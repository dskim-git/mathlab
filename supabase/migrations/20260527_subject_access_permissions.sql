-- 20260527_subject_access_permissions.sql
-- 교과 접근 권한: 학생(학급 단위) + 일반인(개인 단위) 테이블 + RLS.
--
-- 배경(역할별 교과 접근 모델):
--   - 교사   : teacher_permissions(subject, grade, class_number) — 기존, 변경 없음.
--   - 학생   : class_subject_permissions(grade, class_number, subject) — 신규(이 파일).
--             학생의 (grade, class_number) 가 매칭되는 교과를 접근.
--   - 일반인 : general_subject_permissions(profile_id, subject) — 신규(이 파일). 개인별 부여.
--
-- subject 는 기존 3개 컬럼(activities/activity_responses/teacher_permissions)과 동일하게
--   subjects(name) 에 FK(ON UPDATE CASCADE — 교과명 rename 시 자동 정합, ON DELETE RESTRICT — 참조 중 삭제 방지).
--
-- RLS: 관리자 전체(부여/회수/조회) + 본인만 읽기(미래 학생/일반인 교과 탐색 UI 대비).
--   쓰기는 관리자만. 라이브는 SQL 에디터(service_role)로 적용 → 우회.

-- ──────────────────────────────────────────────────────────────
-- class_subject_permissions (학생: 학급 단위)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.class_subject_permissions (
  id uuid primary key default gen_random_uuid(),
  grade integer not null,
  class_number integer not null,
  subject text not null
    references public.subjects(name) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  unique (grade, class_number, subject)
);

create index if not exists idx_class_subject_permissions_class
  on public.class_subject_permissions(grade, class_number);

alter table public.class_subject_permissions enable row level security;

-- 관리자: 전체
drop policy if exists "admin all class_subject_permissions" on public.class_subject_permissions;
create policy "admin all class_subject_permissions"
  on public.class_subject_permissions for all to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- 학생: 본인 학급(grade+class_number)에 해당하는 행만 읽기
drop policy if exists "student reads own class subjects" on public.class_subject_permissions;
create policy "student reads own class subjects"
  on public.class_subject_permissions for select to authenticated
  using (
    exists (
      select 1 from public.students st
      where st.profile_id = auth.uid()
        and st.grade = class_subject_permissions.grade
        and st.class_number = class_subject_permissions.class_number
    )
  );

-- ──────────────────────────────────────────────────────────────
-- general_subject_permissions (일반인: 개인 단위)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.general_subject_permissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null
    references public.subjects(name) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  unique (profile_id, subject)
);

create index if not exists idx_general_subject_permissions_profile
  on public.general_subject_permissions(profile_id);

alter table public.general_subject_permissions enable row level security;

-- 관리자: 전체
drop policy if exists "admin all general_subject_permissions" on public.general_subject_permissions;
create policy "admin all general_subject_permissions"
  on public.general_subject_permissions for all to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- 본인: 자기에게 부여된 교과만 읽기
drop policy if exists "general reads own subjects" on public.general_subject_permissions;
create policy "general reads own subjects"
  on public.general_subject_permissions for select to authenticated
  using ( profile_id = auth.uid() );

-- ── 검증 (적용 후) ──
-- select tablename, policyname, cmd from pg_policies
--   where tablename in ('class_subject_permissions','general_subject_permissions') order by tablename, policyname;
-- insert/select smoke test as admin(SQL editor): 한 행 넣고 조회 후 삭제.

-- ── ROLLBACK ──
-- drop table if exists public.class_subject_permissions;
-- drop table if exists public.general_subject_permissions;
