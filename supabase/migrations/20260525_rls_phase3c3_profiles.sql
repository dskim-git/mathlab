-- 20260525_rls_phase3c3_profiles.sql
-- Phase 3c-3: profiles RLS 좁히기 (본인 + 관리자 + 교사가 담당학급 학생의 profile), dev 개방 회수.
--
-- 읽기 경로 확인(2026-05-25): profiles 읽기는
--   (자기) 로그인/게이트/requireTeacher 가 본인 행(id=auth.uid),
--   (관리자) 승인 대시보드/교사권한 화면,
--   (교사) records/sessions 의 students→profiles(name) 조인.
-- UPDATE 는 관리자 승인(status 변경)뿐. anon 읽기 경로 없음 → anon 개방 회수 안전.
--
-- 재귀 방지: 교사 판별/대상 학생 판별은 SECURITY DEFINER 헬퍼로 RLS 우회.

-- 교사가 이 profile(학생)을 볼 수 있나 = 그 profile 의 학생이 교사 담당 학급인가.
create or replace function public.teacher_can_see_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    where s.profile_id = p_profile_id
      and public.teacher_has_class(s.grade, s.class_number)
  );
$$;

grant execute on function public.teacher_can_see_profile(uuid) to authenticated;

alter table public.profiles enable row level security;  -- 이미 on이지만 멱등

-- 1) dev 개방 회수
drop policy if exists "Allow anon read profiles for dev" on public.profiles;
drop policy if exists "dev authenticated read profiles" on public.profiles;
drop policy if exists "dev authenticated update profiles" on public.profiles;

-- 2) 본인 행 읽기 (로그인/게이트/승인대기 본인 확인)
drop policy if exists "self reads own profile" on public.profiles;
create policy "self reads own profile"
  on public.profiles for select to authenticated
  using ( id = auth.uid() );

-- 3) 교사: 담당 학급 학생의 profile 읽기 (이름 조인 유지)
drop policy if exists "teacher reads scoped student profiles" on public.profiles;
create policy "teacher reads scoped student profiles"
  on public.profiles for select to authenticated
  using ( public.teacher_can_see_profile(id) );

-- 4) 관리자: 전체 (승인 SELECT/UPDATE 포함)
drop policy if exists "admin all profiles" on public.profiles;
create policy "admin all profiles"
  on public.profiles for all to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ──────────────────────────────────────────────────────────────
-- ROLLBACK (dev 개방으로 복귀)
-- ──────────────────────────────────────────────────────────────
-- drop policy if exists "self reads own profile"               on public.profiles;
-- drop policy if exists "teacher reads scoped student profiles" on public.profiles;
-- drop policy if exists "admin all profiles"                    on public.profiles;
-- create policy "Allow anon read profiles for dev"
--   on public.profiles for select to anon using (true);
-- create policy "dev authenticated read profiles"
--   on public.profiles for select to authenticated using (true);
-- create policy "dev authenticated update profiles"
--   on public.profiles for update to authenticated using (true) with check (true);
