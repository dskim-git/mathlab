-- 20260530_daily_class_overrides.sql
-- 학반·날짜 단위 음영 예외.
-- 평소엔 weekly_schedule 이 음영을 결정하지만, 임시 보강/결강이 생기는 날엔
-- daily_class_overrides 가 (그 날, 그 학반, 그 과목) 단위로 시간표 결과를 뒤집는다.
--   action='add'    : 시간표엔 없지만 이 날 임시로 수업 (음영 ON)
--   action='remove' : 시간표엔 있지만 이 날 결강 (음영 OFF)
-- 일자 전체 휴강은 daily_schedule_meta.is_off (기존) 가 처리.
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  select policyname, cmd from pg_policies where tablename='daily_class_overrides';

create table if not exists public.daily_class_overrides (
  id            uuid primary key default gen_random_uuid(),
  teacher_id    uuid not null references public.profiles(id) on delete cascade,
  date          date not null,
  grade         integer not null,
  class_number  integer not null,
  subject       text   not null references public.subjects(name) on update cascade on delete restrict,
  action        text   not null check (action in ('add', 'remove')),
  created_at    timestamptz not null default now(),
  unique (teacher_id, date, grade, class_number, subject)
);

create index if not exists daily_class_overrides_teacher_date_idx
  on public.daily_class_overrides (teacher_id, date);

alter table public.daily_class_overrides enable row level security;

drop policy if exists daily_class_overrides_owner_all on public.daily_class_overrides;
create policy daily_class_overrides_owner_all on public.daily_class_overrides
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists daily_class_overrides_admin_all on public.daily_class_overrides;
create policy daily_class_overrides_admin_all on public.daily_class_overrides
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 학생: 자기 학급에 해당하는 override SELECT (학생 홈 "오늘 수업"용)
drop policy if exists daily_class_overrides_student_class_select on public.daily_class_overrides;
create policy daily_class_overrides_student_class_select on public.daily_class_overrides
  for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.profile_id = auth.uid()
        and s.grade        = daily_class_overrides.grade
        and s.class_number = daily_class_overrides.class_number
    )
  );
