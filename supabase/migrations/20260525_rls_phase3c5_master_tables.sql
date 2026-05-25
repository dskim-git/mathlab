-- 20260525_rls_phase3c5_master_tables.sql
-- Phase 3c-5: 부가 하드닝 — student_roster / subjects / school_classes / app_settings.
--
-- 배경: 이 테이블들은 "dev authenticated all"(로그인한 누구나 읽기·쓰기)로 열려 있었다.
-- 특히 student_roster 는 전교생 이름(PII)이라 학생도 PostgREST로 전체 조회가 가능했다.
--
-- 경로 확인(2026-05-25):
--   student_roster: /admin/roster(읽기·업로드)만. 가입 매칭은 check_student_roster RPC +
--                   handle_new_auth_user 트리거(둘 다 SECURITY DEFINER, RLS 우회).
--   subjects/school_classes: /admin/settings, /admin/teachers 드롭다운(모두 admin)만.
--   app_settings: 가입 시 anon 이 current_school_year 읽기(유지 필요) + /admin 읽기·쓰기.
-- → roster/subjects/classes 는 admin 전용, app_settings 는 anon SELECT 유지 + 쓰기 admin.

-- ── student_roster: admin 전용 (PII) ──────────────────────────
alter table public.student_roster enable row level security;  -- 멱등
drop policy if exists "dev authenticated all student_roster" on public.student_roster;
drop policy if exists "admin all student_roster" on public.student_roster;
create policy "admin all student_roster"
  on public.student_roster for all to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );

-- ── subjects: admin 전용 ──────────────────────────────────────
alter table public.subjects enable row level security;  -- 멱등
drop policy if exists "dev authenticated all subjects" on public.subjects;
drop policy if exists "admin all subjects" on public.subjects;
create policy "admin all subjects"
  on public.subjects for all to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );

-- ── school_classes: admin 전용 ────────────────────────────────
alter table public.school_classes enable row level security;  -- 멱등
drop policy if exists "dev authenticated all school_classes" on public.school_classes;
drop policy if exists "admin all school_classes" on public.school_classes;
create policy "admin all school_classes"
  on public.school_classes for all to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );

-- ── app_settings: anon SELECT 유지(가입 전 학년도), 쓰기/그 외 admin ──
alter table public.app_settings enable row level security;  -- 멱등
drop policy if exists "dev authenticated all app_settings" on public.app_settings;
-- "anon read app_settings" (anon SELECT)는 그대로 둔다(가입 폼이 current_school_year 읽음).
drop policy if exists "admin all app_settings" on public.app_settings;
create policy "admin all app_settings"
  on public.app_settings for all to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );

-- ──────────────────────────────────────────────────────────────
-- ROLLBACK (dev 개방으로 복귀)
-- ──────────────────────────────────────────────────────────────
-- drop policy if exists "admin all student_roster" on public.student_roster;
-- create policy "dev authenticated all student_roster" on public.student_roster for all to authenticated using (true) with check (true);
-- drop policy if exists "admin all subjects" on public.subjects;
-- create policy "dev authenticated all subjects" on public.subjects for all to authenticated using (true) with check (true);
-- drop policy if exists "admin all school_classes" on public.school_classes;
-- create policy "dev authenticated all school_classes" on public.school_classes for all to authenticated using (true) with check (true);
-- drop policy if exists "admin all app_settings" on public.app_settings;
-- create policy "dev authenticated all app_settings" on public.app_settings for all to authenticated using (true) with check (true);
