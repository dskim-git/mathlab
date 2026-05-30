-- 20260530_weekly_schedule.sql
-- 교사의 "요일별 기본 시간표" + "특정 날짜 휴강/비고" 두 테이블 추가.
-- 진도표 화면이 이 둘을 합쳐 음영(수업 있는 칸)·휴강 표시·일자 비고를 그려낸다.
--
-- weekly_schedule(teacher_id, day_of_week 0~4, grade, class_number, subject)
--   day_of_week: 0=월, 1=화, 2=수, 3=목, 4=금
--   교사가 "월요일에 1-9 공통수학, 2-9 확률과통계" 같은 식으로 등록.
--   같은 (요일, 학반, 과목) 중복 등록 방지.
--
-- daily_schedule_meta(teacher_id, date, is_off, notes)
--   특정 날짜 단위로 휴강(전 학반 음영 끔) + 비고. 한 교사 한 날 한 행.
--   학반별 ON/OFF 교체는 MVP 범위 밖(추후 daily_schedule_overrides 별도 테이블).
--
-- 적용:  Supabase SQL 에디터에 그대로 붙여 실행.
-- 검증:  select policyname, cmd from pg_policies where tablename in ('weekly_schedule','daily_schedule_meta') order by tablename, policyname;

-- ── weekly_schedule ────────────────────────────────────────────────────────
create table if not exists public.weekly_schedule (
  id            uuid primary key default gen_random_uuid(),
  teacher_id    uuid    not null references public.profiles(id) on delete cascade,
  day_of_week   smallint not null check (day_of_week between 0 and 4),
  grade         integer not null,
  class_number  integer not null,
  subject       text    not null references public.subjects(name) on update cascade on delete restrict,
  created_at    timestamptz not null default now(),
  unique (teacher_id, day_of_week, grade, class_number, subject)
);

create index if not exists weekly_schedule_teacher_idx
  on public.weekly_schedule (teacher_id);
create index if not exists weekly_schedule_class_idx
  on public.weekly_schedule (grade, class_number);

alter table public.weekly_schedule enable row level security;

drop policy if exists weekly_schedule_owner_all on public.weekly_schedule;
create policy weekly_schedule_owner_all on public.weekly_schedule
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists weekly_schedule_admin_all on public.weekly_schedule;
create policy weekly_schedule_admin_all on public.weekly_schedule
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 학생: 자기 학급의 시간표(어느 요일에 자기 학급 수업이 있는지) SELECT
drop policy if exists weekly_schedule_student_class_select on public.weekly_schedule;
create policy weekly_schedule_student_class_select on public.weekly_schedule
  for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.profile_id = auth.uid()
        and s.grade        = weekly_schedule.grade
        and s.class_number = weekly_schedule.class_number
    )
  );

-- ── daily_schedule_meta ────────────────────────────────────────────────────
create table if not exists public.daily_schedule_meta (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  is_off      boolean not null default false,
  notes       text    not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (teacher_id, date)
);

create index if not exists daily_schedule_meta_teacher_date_idx
  on public.daily_schedule_meta (teacher_id, date);

alter table public.daily_schedule_meta enable row level security;

drop policy if exists daily_schedule_meta_owner_all on public.daily_schedule_meta;
create policy daily_schedule_meta_owner_all on public.daily_schedule_meta
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists daily_schedule_meta_admin_all on public.daily_schedule_meta;
create policy daily_schedule_meta_admin_all on public.daily_schedule_meta
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- updated_at 자동 갱신
create or replace function public.set_daily_schedule_meta_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists daily_schedule_meta_set_updated_at on public.daily_schedule_meta;
create trigger daily_schedule_meta_set_updated_at
  before update on public.daily_schedule_meta
  for each row execute function public.set_daily_schedule_meta_updated_at();
