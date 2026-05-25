-- 20260525_rls_phase3c2_students.sql
-- Phase 3c-2: students RLS 좁히기 (본인 + 교사담당 + 관리자), dev 개방 회수.
--
-- 읽기 경로 확인(2026-05-25): students 직접 읽기는 (1) 학생 로그인 직후 본인 행,
-- (2) 제출 시 ProbabilitySimulator 본인 행 — 둘 다 authenticated 본인(profile_id=auth.uid).
-- 교사 화면은 activity_responses→students 조인을 인증된 서버로 읽으며 담당 학급만 본다.
-- anon 의 students 읽기 경로는 없음 → anon 개방 회수 안전.
--
-- 의존: is_admin(), teacher_has_class() (3c-1 / 3c-1b 에서 생성됨).

alter table public.students enable row level security;  -- 이미 on이지만 멱등

-- 1) dev 개방 회수
drop policy if exists "Allow anon read students for dev" on public.students;
drop policy if exists "dev authenticated read students" on public.students;

-- 2) 학생: 본인 행만
drop policy if exists "student reads own students" on public.students;
create policy "student reads own students"
  on public.students for select to authenticated
  using ( profile_id = auth.uid() );

-- 3) 교사: 담당 학급(grade+class) 학생만
drop policy if exists "teacher reads scoped students" on public.students;
create policy "teacher reads scoped students"
  on public.students for select to authenticated
  using ( public.teacher_has_class(grade, class_number) );

-- 4) 관리자: 전체
drop policy if exists "admin all students" on public.students;
create policy "admin all students"
  on public.students for all to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ──────────────────────────────────────────────────────────────
-- ROLLBACK (dev 개방으로 복귀)
-- ──────────────────────────────────────────────────────────────
-- drop policy if exists "student reads own students"   on public.students;
-- drop policy if exists "teacher reads scoped students" on public.students;
-- drop policy if exists "admin all students"            on public.students;
-- create policy "Allow anon read students for dev"
--   on public.students for select to anon using (true);
-- create policy "dev authenticated read students"
--   on public.students for select to authenticated using (true);
