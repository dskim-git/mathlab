-- 20260709_teacher_subject_permissions.sql
-- 교사 교과 접근 권한(개인 단위): teacher_subject_permissions 테이블 + RLS.
--
-- 배경(역할별 교과 접근 모델 보강):
--   - 교사   : teacher_permissions(담당 학반) 로 도출되는 과목 ∪ teacher_subject_permissions(개인 부여) — 신규(이 파일).
--             담당 학반이 없는 교과라도, 학생·일반인처럼 수업 내용을 볼 수 있도록 개인별로 부여.
--   - 학생   : class_subject_permissions(grade, class_number, subject) — 기존.
--   - 일반인 : general_subject_permissions(profile_id, subject) — 기존.
--
-- general_subject_permissions 와 동일 구조(개인 단위): profile_id 로 부여.
-- subject 는 subjects(name) 에 FK(ON UPDATE CASCADE — 교과명 rename 정합, ON DELETE RESTRICT — 참조 중 삭제 방지).
--
-- RLS: 관리자 전체(부여/회수/조회) + 교사 본인만 읽기(담당 교과 산출용).
--   쓰기는 관리자만. 라이브는 SQL 에디터(service_role)로 적용 → 우회.

-- ──────────────────────────────────────────────────────────────
-- teacher_subject_permissions (교사: 개인 단위)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.teacher_subject_permissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null
    references public.subjects(name) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  unique (profile_id, subject)
);

create index if not exists idx_teacher_subject_permissions_profile
  on public.teacher_subject_permissions(profile_id);

alter table public.teacher_subject_permissions enable row level security;

-- 관리자: 전체
drop policy if exists "admin all teacher_subject_permissions" on public.teacher_subject_permissions;
create policy "admin all teacher_subject_permissions"
  on public.teacher_subject_permissions for all to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- 본인(교사): 자기에게 부여된 교과만 읽기
drop policy if exists "teacher reads own subjects" on public.teacher_subject_permissions;
create policy "teacher reads own subjects"
  on public.teacher_subject_permissions for select to authenticated
  using ( profile_id = auth.uid() );

-- ── 검증 (적용 후) ──
-- select tablename, policyname, cmd from pg_policies
--   where tablename = 'teacher_subject_permissions' order by policyname;
-- insert/select smoke test as admin(SQL editor): 한 행 넣고 조회 후 삭제.

-- ── ROLLBACK ──
-- drop table if exists public.teacher_subject_permissions;
