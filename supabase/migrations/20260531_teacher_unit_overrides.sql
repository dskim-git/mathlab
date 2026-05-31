-- 20260531_teacher_unit_overrides.sql
-- 교사별 단원(잎) 수업 블록 커스터마이즈.
-- 기본 자료(curriculum_units.content_blocks)는 글로벌·관리자 관리. 교사는 단원당 본인 행 1개를 만들어
-- 그 단원에서 자기 수업에 쓸 블록 ID 의 순서·포함 목록을 저장한다. 다른 교사·기본 자료는 영향 X.
--
-- 적용 흐름:
--   교사 편집 페이지(/teacher/lesson-blocks) — 단원 선택 → 기본 블록 보고 체크/순서 변경 → 저장.
--   학생 진입(/learn) — 자기 학급·과목의 담당 교사 행이 있으면 그 block_ids 순서대로 필터·정렬해 렌더.
--                       없으면 기본 블록 그대로.
--
-- 데이터 형식:
--   block_ids = 기본 블록의 id 들 중 "교사가 포함하기로 한" 부분집합, 본인이 원하는 순서로.
--   기본 블록이 나중에 새로 추가되면 그 ID 는 override 에 없으므로 자동 제외(교사가 다시 편집해야 포함).
--   기본 블록이 사라지면 그 ID 는 override 에 남아 있어도 무시(렌더 시 매칭 안 됨).
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:  select column_name, data_type from information_schema.columns
--           where table_schema='public' and table_name='teacher_unit_overrides' order by ordinal_position;
--        select policyname, cmd from pg_policies
--           where tablename='teacher_unit_overrides' order by policyname;

create table if not exists public.teacher_unit_overrides (
  teacher_profile_id uuid not null references public.profiles(id) on delete cascade,
  subject            text not null references public.subjects(name) on update cascade on delete restrict,
  unit_key           text not null,
  -- 기본 블록 중 교사가 사용할 블록의 id 들, 본인이 원하는 순서로.
  block_ids          text[] not null default '{}',
  updated_at         timestamptz not null default now(),
  primary key (teacher_profile_id, subject, unit_key)
);

-- 학생 진입 시 (subject, unit_key) 로 담당 교사 행을 빠르게 찾는 보조 인덱스.
create index if not exists teacher_unit_overrides_lookup_idx
  on public.teacher_unit_overrides (subject, unit_key);

alter table public.teacher_unit_overrides enable row level security;

-- 본인(교사) ALL
drop policy if exists teacher_unit_overrides_owner_all on public.teacher_unit_overrides;
create policy teacher_unit_overrides_owner_all on public.teacher_unit_overrides
  for all to authenticated
  using (teacher_profile_id = auth.uid())
  with check (teacher_profile_id = auth.uid());

-- 관리자 ALL
drop policy if exists teacher_unit_overrides_admin_all on public.teacher_unit_overrides;
create policy teacher_unit_overrides_admin_all on public.teacher_unit_overrides
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 학생 SELECT — 자기 학급·과목의 담당 교사가 만든 행에 한해.
-- (teacher_permissions: subject·grade·class_number 매칭 → teacher_id → teachers.profile_id → row.teacher_profile_id)
drop policy if exists teacher_unit_overrides_student_class_select on public.teacher_unit_overrides;
create policy teacher_unit_overrides_student_class_select on public.teacher_unit_overrides
  for select to authenticated
  using (
    exists (
      select 1
        from public.students s
        join public.teachers t on t.profile_id = teacher_unit_overrides.teacher_profile_id
        join public.teacher_permissions tp on tp.teacher_id = t.id
       where s.profile_id   = auth.uid()
         and tp.grade        = s.grade
         and tp.class_number = s.class_number
         and tp.subject      = teacher_unit_overrides.subject
    )
  );

-- updated_at 자동 갱신
create or replace function public.set_teacher_unit_overrides_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists teacher_unit_overrides_set_updated_at on public.teacher_unit_overrides;
create trigger teacher_unit_overrides_set_updated_at
  before update on public.teacher_unit_overrides
  for each row execute function public.set_teacher_unit_overrides_updated_at();

-- 빠른 audit
-- select count(*) as rows from public.teacher_unit_overrides;
-- select teacher_profile_id, subject, unit_key, array_length(block_ids,1) as n_blocks, updated_at
--   from public.teacher_unit_overrides order by updated_at desc limit 10;
