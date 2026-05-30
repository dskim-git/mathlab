-- 20260530_feedback.sql
-- 학생/일반인이 관리자에게 보내는 건의사항.
-- 카테고리: 오류 제보(bug) / 활동 요청(activity_request) / 기타(other)
-- 상태: 접수(received) → 검토(reviewing) → 처리완료(resolved) | 반려(rejected)
--
-- RLS:
--  - 본인(profile_id = auth.uid) : SELECT/INSERT (수정·삭제는 불가)
--  - 교사: 권한 없음 (관리자만 처리)
--  - 관리자: 전체 ALL
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  select policyname, cmd from pg_policies where tablename='feedback' order by policyname;

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  category    text not null check (category in ('bug', 'activity_request', 'other')),
  title       text not null,
  body        text not null,
  status      text not null default 'received'
                check (status in ('received', 'reviewing', 'resolved', 'rejected')),
  admin_reply text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists feedback_profile_idx on public.feedback (profile_id);
create index if not exists feedback_status_idx  on public.feedback (status, created_at desc);

alter table public.feedback enable row level security;

-- 본인: 자기 건의 INSERT
drop policy if exists feedback_owner_insert on public.feedback;
create policy feedback_owner_insert on public.feedback
  for insert to authenticated
  with check (profile_id = auth.uid());

-- 본인: 자기 건의 SELECT
drop policy if exists feedback_owner_select on public.feedback;
create policy feedback_owner_select on public.feedback
  for select to authenticated
  using (profile_id = auth.uid());

-- 관리자: 전체 ALL
drop policy if exists feedback_admin_all on public.feedback;
create policy feedback_admin_all on public.feedback
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
