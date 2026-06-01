-- 20260601_notifications.sql
-- 사용자별 알림 큐 + 이벤트 트리거 3종.
--
-- 알림 이벤트(1차):
--   1) feedback_received  : 새 건의 들어오면 관리자(들)에게.
--   2) feedback_replied   : 건의 상태가 resolved/rejected 로 변경되면 작성자에게.
--   3) response_locked    : 활동 응답이 마감되면(locked_at NULL→NOT NULL) 학생에게.
--
-- 공지(notices)는 별도 NoticeBoard 가 처리하므로 알림에 중복 INSERT 안 함.
-- 새 응답 → 교사 알림은 노이즈가 크니 1차 범위에서 제외(/teacher/records 가 대체).
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:
--   select column_name, data_type from information_schema.columns
--     where table_schema='public' and table_name='notifications' order by ordinal_position;
--   select policyname, cmd from pg_policies
--     where tablename='notifications' order by policyname;
--   select tgname from pg_trigger where tgrelid in
--     ('public.feedback'::regclass, 'public.activity_responses'::regclass)
--     and tgname like 'notify_%';

create table if not exists public.notifications (
  id          bigserial primary key,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (
    type in ('feedback_received', 'feedback_replied', 'response_locked')
  ),
  title       text not null,
  body        text,
  ref_table   text,
  ref_id      text,  -- 참조 row id (uuid 또는 bigint 등) — text 로 일관화
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_profile_id, created_at desc);
create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_profile_id)
  where read_at is null;

alter table public.notifications enable row level security;

-- 본인 SELECT (자기에게 온 알림만)
drop policy if exists notifications_owner_select on public.notifications;
create policy notifications_owner_select on public.notifications
  for select to authenticated
  using (recipient_profile_id = auth.uid());

-- 본인 UPDATE (read_at 토글 용)
drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_update on public.notifications
  for update to authenticated
  using (recipient_profile_id = auth.uid())
  with check (recipient_profile_id = auth.uid());

-- 관리자 ALL
drop policy if exists notifications_admin_all on public.notifications;
create policy notifications_admin_all on public.notifications
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 트리거 INSERT 는 SECURITY DEFINER 함수가 처리 — INSERT 정책 별도 없음.
-- (트리거가 RLS 우회. 일반 클라이언트가 임의 INSERT 못 함.)

-- ======================================================================
-- 트리거 1: feedback INSERT → 관리자들에게 알림
-- ======================================================================
create or replace function public.notify_feedback_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid;
begin
  for admin_id in
    select id from public.profiles where role = 'admin' and status = 'approved'
  loop
    insert into public.notifications
      (recipient_profile_id, type, title, body, ref_table, ref_id)
    values
      (admin_id, 'feedback_received', '새 건의 사항', new.title,
       'feedback', new.id::text);
  end loop;
  return new;
end;
$$;

drop trigger if exists notify_feedback_received_after_insert on public.feedback;
create trigger notify_feedback_received_after_insert
  after insert on public.feedback
  for each row execute function public.notify_feedback_received();

-- ======================================================================
-- 트리거 2: feedback UPDATE — 상태가 resolved/rejected 로 바뀐 첫 순간 → 작성자
-- ======================================================================
create or replace function public.notify_feedback_replied()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  msg text;
begin
  if new.status in ('resolved', 'rejected')
     and (old.status is distinct from new.status)
  then
    msg := coalesce(new.admin_reply, '(답변 없음)');
    insert into public.notifications
      (recipient_profile_id, type, title, body, ref_table, ref_id)
    values
      (new.profile_id, 'feedback_replied',
       case new.status when 'resolved' then '건의 처리 완료' else '건의 처리 결과' end,
       msg, 'feedback', new.id::text);
  end if;
  return new;
end;
$$;

drop trigger if exists notify_feedback_replied_after_update on public.feedback;
create trigger notify_feedback_replied_after_update
  after update on public.feedback
  for each row execute function public.notify_feedback_replied();

-- ======================================================================
-- 트리거 3: activity_responses UPDATE — locked_at NULL→NOT NULL → 학생
-- ======================================================================
create or replace function public.notify_response_locked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  stu_profile_id uuid;
  title_text text;
begin
  if old.locked_at is null and new.locked_at is not null then
    select profile_id into stu_profile_id
      from public.students where id = new.student_id;
    if stu_profile_id is not null then
      title_text := coalesce(new.activity_slug, '활동') || ' 성찰 마감';
      insert into public.notifications
        (recipient_profile_id, type, title, body, ref_table, ref_id)
      values
        (stu_profile_id, 'response_locked', title_text,
         '담당 교사가 이 활동 성찰을 마감했습니다. 더 이상 수정할 수 없습니다.',
         'activity_responses', new.id::text);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists notify_response_locked_after_update on public.activity_responses;
create trigger notify_response_locked_after_update
  after update on public.activity_responses
  for each row execute function public.notify_response_locked();

-- 빠른 audit
-- select count(*) total, count(*) filter (where read_at is null) unread
--   from public.notifications;
-- select tgname, tgrelid::regclass from pg_trigger
--   where tgname like 'notify_%' order by tgname;
