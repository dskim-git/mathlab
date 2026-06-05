-- study_groups: 정규 학년·반과 별도로 운영되는 수업 그룹 (영재 수업 등).
--
-- 모델:
--   - study_groups        : 그룹 정의 (이름, 비고 — 언제·누구 대상 등 수업 메모)
--   - study_group_members : 그룹 회원 (profile_id × group_id, 역할 teacher|student)
--   - study_group_subjects: 그룹이 접근 가능한 교과 (FK → subjects)
--
--   같은 회원이 여러 그룹에 속할 수 있고, 그룹마다 다른 역할을 가질 수 있음
--   (예: 한 회원이 그룹 A 에서 학생, 그룹 B 에서 교사).
--   그룹 안 "교사 역할" 은 그 그룹의 교과 안에서만 교사 권한으로 작동
--   (정책 적용은 후속 라운드 — 이번 마이그레이션은 데이터 모델만).
--
-- RLS:
--   SELECT : 관리자 OR 그룹 멤버 (자기 속한 그룹 + 멤버 + 교과 조회 가능)
--   INSERT/UPDATE/DELETE : 관리자만
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  select policyname, cmd from pg_policies where tablename like 'study_group%' order by tablename, policyname;

-- ═════════════════════════════════════════════════════════════
-- 1) 테이블 (정책에서 서로 참조하므로 모두 먼저 생성)
-- ═════════════════════════════════════════════════════════════

create table if not exists public.study_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  note        text not null default '',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.study_group_members (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.study_groups(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  role        text not null check (role in ('teacher','student')),
  added_at    timestamptz not null default now(),
  unique (group_id, profile_id)
);

create table if not exists public.study_group_subjects (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.study_groups(id) on delete cascade,
  subject     text not null references public.subjects(name) on update cascade on delete restrict,
  added_at    timestamptz not null default now(),
  unique (group_id, subject)
);

-- ═════════════════════════════════════════════════════════════
-- 2) 인덱스
-- ═════════════════════════════════════════════════════════════

create index if not exists study_groups_name_idx
  on public.study_groups (name);
create index if not exists study_group_members_group_idx
  on public.study_group_members (group_id);
create index if not exists study_group_members_profile_idx
  on public.study_group_members (profile_id);
create index if not exists study_group_subjects_group_idx
  on public.study_group_subjects (group_id);
create index if not exists study_group_subjects_subject_idx
  on public.study_group_subjects (subject);

-- ═════════════════════════════════════════════════════════════
-- 3) updated_at 트리거 (study_groups)
-- ═════════════════════════════════════════════════════════════

create or replace function public.set_study_groups_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists study_groups_set_updated_at on public.study_groups;
create trigger study_groups_set_updated_at
  before update on public.study_groups
  for each row execute function public.set_study_groups_updated_at();

-- ═════════════════════════════════════════════════════════════
-- 4) RLS — 세 테이블 모두 활성화 후 정책 일괄 생성
-- ═════════════════════════════════════════════════════════════

alter table public.study_groups         enable row level security;
alter table public.study_group_members  enable row level security;
alter table public.study_group_subjects enable row level security;

-- ── study_groups: 멤버 자신이 속한 그룹은 SELECT 가능
drop policy if exists study_groups_select on public.study_groups;
create policy study_groups_select on public.study_groups
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.study_group_members m
      where m.group_id = study_groups.id and m.profile_id = auth.uid()
    )
  );

drop policy if exists study_groups_admin_all on public.study_groups;
create policy study_groups_admin_all on public.study_groups
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── study_group_members: 본인 행 또는 같은 그룹 동료
drop policy if exists study_group_members_select on public.study_group_members;
create policy study_group_members_select on public.study_group_members
  for select to authenticated
  using (
    public.is_admin()
    or profile_id = auth.uid()
    or exists (
      select 1 from public.study_group_members m2
      where m2.group_id = study_group_members.group_id
        and m2.profile_id = auth.uid()
    )
  );

drop policy if exists study_group_members_admin_all on public.study_group_members;
create policy study_group_members_admin_all on public.study_group_members
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── study_group_subjects: 자기 그룹의 교과 목록 SELECT
drop policy if exists study_group_subjects_select on public.study_group_subjects;
create policy study_group_subjects_select on public.study_group_subjects
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.study_group_members m
      where m.group_id = study_group_subjects.group_id
        and m.profile_id = auth.uid()
    )
  );

drop policy if exists study_group_subjects_admin_all on public.study_group_subjects;
create policy study_group_subjects_admin_all on public.study_group_subjects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
