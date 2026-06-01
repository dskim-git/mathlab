-- 20260601_teacher_student_notes.sql
-- 교사가 학생별로 비공개 메모를 남긴다. AI 세특 생성 시 컨텍스트로 자동 포함된다.
-- 학생/일반인은 접근 불가(비공개). 교사 본인 + 관리자 ALL.
--
-- 모델:
--   PK = (teacher_profile_id, student_id) — 교사별 학생 1개의 누적 메모.
--   note 는 길게 적어도 OK (text).
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:
--   select column_name, data_type from information_schema.columns
--     where table_schema='public' and table_name='teacher_student_notes' order by ordinal_position;
--   select policyname, cmd from pg_policies
--     where tablename='teacher_student_notes' order by policyname;

create table if not exists public.teacher_student_notes (
  teacher_profile_id uuid not null references public.profiles(id) on delete cascade,
  student_id         uuid not null references public.students(id) on delete cascade,
  note               text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  primary key (teacher_profile_id, student_id)
);

create index if not exists teacher_student_notes_teacher_idx
  on public.teacher_student_notes (teacher_profile_id);

alter table public.teacher_student_notes enable row level security;

-- 본인(교사) ALL
drop policy if exists teacher_student_notes_owner_all on public.teacher_student_notes;
create policy teacher_student_notes_owner_all on public.teacher_student_notes
  for all to authenticated
  using (teacher_profile_id = auth.uid())
  with check (teacher_profile_id = auth.uid());

-- 관리자 ALL
drop policy if exists teacher_student_notes_admin_all on public.teacher_student_notes;
create policy teacher_student_notes_admin_all on public.teacher_student_notes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- updated_at 자동 갱신
create or replace function public.set_teacher_student_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists teacher_student_notes_set_updated_at on public.teacher_student_notes;
create trigger teacher_student_notes_set_updated_at
  before update on public.teacher_student_notes
  for each row execute function public.set_teacher_student_notes_updated_at();

-- 빠른 audit
-- select count(*) from public.teacher_student_notes;
-- select teacher_profile_id, student_id, length(note) as note_len, updated_at
--   from public.teacher_student_notes order by updated_at desc limit 10;
