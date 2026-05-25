-- 20260525_rls_phase3c4_teachers_permissions.sql
-- Phase 3c-4: teachers / teacher_permissions RLS 좁히기 (본인 + 관리자), dev 개방 회수.
--
-- 읽기/쓰기 경로 확인(2026-05-25):
--   teachers: 교사 로그인/레이아웃이 본인 행(profile_id=auth.uid) 조회, 관리자 승인 시 INSERT,
--             관리자 화면(/admin/teachers)이 목록 조회.
--   teacher_permissions: 교사 picker(TeacherClassPicker)가 본인 권한 조회,
--             관리자 화면이 부여(INSERT)/회수(DELETE)/조회.
--   anon 읽기 경로 없음 → anon 개방 회수 안전.
--
-- 중요: teacher_has_class()/teacher_has_class_subject() 는 SECURITY DEFINER 라
--   이 테이블들을 잠가도 RLS 우회로 계속 읽는다 → 교사 범위 판정(다른 테이블 정책) 유지.

-- ──────────────────────────────────────────────────────────────
-- teachers
-- ──────────────────────────────────────────────────────────────
alter table public.teachers enable row level security;  -- 멱등

drop policy if exists "dev anon select teachers" on public.teachers;
drop policy if exists "dev authenticated read teachers" on public.teachers;
drop policy if exists "dev authenticated insert teachers" on public.teachers;

-- 교사: 본인 행만
drop policy if exists "teacher reads own teacher row" on public.teachers;
create policy "teacher reads own teacher row"
  on public.teachers for select to authenticated
  using ( profile_id = auth.uid() );

-- 관리자: 전체 (승인 시 INSERT 포함)
drop policy if exists "admin all teachers" on public.teachers;
create policy "admin all teachers"
  on public.teachers for all to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ──────────────────────────────────────────────────────────────
-- teacher_permissions
-- ──────────────────────────────────────────────────────────────
alter table public.teacher_permissions enable row level security;  -- 멱등

drop policy if exists "dev anon select teacher_permissions" on public.teacher_permissions;
drop policy if exists "dev authenticated read teacher_permissions" on public.teacher_permissions;
drop policy if exists "dev authenticated insert teacher_permissions" on public.teacher_permissions;
drop policy if exists "dev authenticated delete teacher_permissions" on public.teacher_permissions;

-- 교사: 본인 권한만 읽기
drop policy if exists "teacher reads own permissions" on public.teacher_permissions;
create policy "teacher reads own permissions"
  on public.teacher_permissions for select to authenticated
  using (
    exists (
      select 1 from public.teachers t
      where t.id = teacher_permissions.teacher_id
        and t.profile_id = auth.uid()
    )
  );

-- 관리자: 전체 (담당 학급 부여/회수)
drop policy if exists "admin all teacher_permissions" on public.teacher_permissions;
create policy "admin all teacher_permissions"
  on public.teacher_permissions for all to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ──────────────────────────────────────────────────────────────
-- ROLLBACK (dev 개방으로 복귀)
-- ──────────────────────────────────────────────────────────────
-- drop policy if exists "teacher reads own teacher row" on public.teachers;
-- drop policy if exists "admin all teachers" on public.teachers;
-- create policy "dev anon select teachers" on public.teachers for select to anon using (true);
-- create policy "dev authenticated read teachers" on public.teachers for select to authenticated using (true);
-- create policy "dev authenticated insert teachers" on public.teachers for insert to authenticated with check (true);
-- drop policy if exists "teacher reads own permissions" on public.teacher_permissions;
-- drop policy if exists "admin all teacher_permissions" on public.teacher_permissions;
-- create policy "dev anon select teacher_permissions" on public.teacher_permissions for select to anon using (true);
-- create policy "dev authenticated read teacher_permissions" on public.teacher_permissions for select to authenticated using (true);
-- create policy "dev authenticated insert teacher_permissions" on public.teacher_permissions for insert to authenticated with check (true);
-- create policy "dev authenticated delete teacher_permissions" on public.teacher_permissions for delete to authenticated using (true);
