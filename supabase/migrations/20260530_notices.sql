-- 20260530_notices.sql
-- 관리자가 회원에게 보내는 공지사항.
-- 대상:
--   target_kind='all'     : 전체
--   target_kind='role'    : target_value = 'student'/'teacher'/'general'/'admin'
--   target_kind='class'   : target_value = 'GRADE-CLASS' (예: '1-9'), 같은 학급 학생 전체
--   target_kind='profile' : target_value = 대상 profile.id (개인)
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:  select policyname, cmd from pg_policies where tablename='notices' order by policyname;

create table if not exists public.notices (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  target_kind  text not null check (target_kind in ('all', 'role', 'class', 'profile')),
  target_value text,
  created_by   uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now()
);

create index if not exists notices_created_at_idx on public.notices (created_at desc);
create index if not exists notices_target_idx     on public.notices (target_kind, target_value);

alter table public.notices enable row level security;

-- 관리자: ALL
drop policy if exists notices_admin_all on public.notices;
create policy notices_admin_all on public.notices
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 일반 사용자: 대상 매칭되는 공지만 SELECT
drop policy if exists notices_user_select on public.notices;
create policy notices_user_select on public.notices
  for select to authenticated
  using (
    target_kind = 'all'
    or (
      target_kind = 'profile'
      and target_value = auth.uid()::text
    )
    or (
      target_kind = 'role'
      and target_value = (
        select role from public.profiles where id = auth.uid()
      )
    )
    or (
      target_kind = 'class'
      and target_value in (
        select s.grade::text || '-' || s.class_number::text
        from public.students s
        where s.profile_id = auth.uid()
      )
    )
  );
