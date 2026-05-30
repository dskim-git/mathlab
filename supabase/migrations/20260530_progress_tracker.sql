-- 20260530_progress_tracker.sql
-- 교사별 진도표 테이블 + RLS.
-- 한 칸 = (teacher, date, grade, class_number, subject) 단위로 한 행.
-- 교사 본인: 본인 행 ALL / 관리자: ALL / 학생: 자기 학급의 행 SELECT (학생 홈 "오늘 수업" 노출용)
--
-- 적용:  Supabase SQL editor 에 그대로 붙여 실행.
-- 검증:  select * from public.progress_tracker limit 1;  /  select policyname from pg_policies where tablename='progress_tracker';

create table if not exists public.progress_tracker (
  id            uuid primary key default gen_random_uuid(),
  teacher_id    uuid not null references public.profiles(id) on delete cascade,
  school_year   integer not null,
  date          date    not null,
  grade         integer not null,
  class_number  integer not null,
  subject       text    not null references public.subjects(name) on update cascade on delete restrict,
  lesson_topic  text    not null default '',
  notes         text    not null default '',
  activity_slug text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (teacher_id, date, grade, class_number, subject)
);

create index if not exists progress_tracker_teacher_date_idx
  on public.progress_tracker (teacher_id, date);
create index if not exists progress_tracker_class_date_idx
  on public.progress_tracker (grade, class_number, date);

alter table public.progress_tracker enable row level security;

-- 교사 본인 (자기 행만)
drop policy if exists progress_tracker_owner_all on public.progress_tracker;
create policy progress_tracker_owner_all on public.progress_tracker
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- 관리자 전체
drop policy if exists progress_tracker_admin_all on public.progress_tracker;
create policy progress_tracker_admin_all on public.progress_tracker
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 학생: 자기 학급의 진도 행 SELECT (학생 홈 "오늘 수업"용)
drop policy if exists progress_tracker_student_class_select on public.progress_tracker;
create policy progress_tracker_student_class_select on public.progress_tracker
  for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.profile_id = auth.uid()
        and s.grade        = progress_tracker.grade
        and s.class_number = progress_tracker.class_number
    )
  );

-- updated_at 자동 갱신
create or replace function public.set_progress_tracker_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists progress_tracker_set_updated_at on public.progress_tracker;
create trigger progress_tracker_set_updated_at
  before update on public.progress_tracker
  for each row execute function public.set_progress_tracker_updated_at();

-- 빠른 audit
-- select count(*) as rows from public.progress_tracker;
-- select policyname, cmd from pg_policies where tablename='progress_tracker' order by policyname;
