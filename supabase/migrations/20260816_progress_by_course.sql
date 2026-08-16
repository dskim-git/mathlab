-- 20260816_progress_by_course.sql
-- 진도표·시간표의 단위를 (학년·반·교과) 에서 "개설 수업(course)" 으로 바꾼다.
--
-- 문제:
--   progress_tracker / weekly_schedule / daily_class_overrides 는 모두
--   (teacher_id, grade, class_number, subject) 를 키로 쓰고 grade·class_number 가 NOT NULL 이다.
--   1) 경제수학 같은 선택 수업은 학급이 없어 아예 등록할 수 없다.
--   2) 학기 축이 없어 담당(teacher_permissions) 전체가 한 화면에 쏟아지고,
--      1학기 진도와 2학기 진도가 같은 칸에 섞인다.
--
--   courses 는 이미 학년도·학기·교과·수강생을 한 묶음으로 들고 있으므로
--   진도표 한 칸 = (교사, 날짜, 수업) 으로 두면 셋 다 풀린다.
--
-- 방식:
--   세 테이블에 course_id 를 추가하고, 기존 행은 2026학년도 1학기 수업으로 매칭 백필한다.
--   grade·class_number 는 NULL 허용으로 완화(선택 수업용) 하고, 넣지 않으면
--   트리거가 수업에서 채워준다 — 기존 조회 코드가 이 컬럼들을 계속 읽기 때문에 남겨둔다.
--   유일성 키를 course_id 기준으로 교체한다.
--
--   학생 RLS 도 "내 학급" 에서 "내가 수강하는 수업" 으로 바꾼다. 선택 수업 학생은
--   학급이 달라 기존 정책으로는 자기 수업 진도를 볼 수 없었다.
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  파일 맨 아래 검증 쿼리.

begin;

-- ═════════════════════════════════════════════════════════════
-- 1) course_id 추가
-- ═════════════════════════════════════════════════════════════

alter table public.progress_tracker
  add column if not exists course_id uuid references public.courses(id) on delete cascade;
alter table public.weekly_schedule
  add column if not exists course_id uuid references public.courses(id) on delete cascade;
alter table public.daily_class_overrides
  add column if not exists course_id uuid references public.courses(id) on delete cascade;

-- ═════════════════════════════════════════════════════════════
-- 2) 기존 행 백필 — 2026학년도 1학기 수업으로 매칭
-- ═════════════════════════════════════════════════════════════
-- 담당 학급에서 자동 변환된 수업이 (교과, 학년, 반) 으로 1:1 대응한다.

update public.progress_tracker pt
set course_id = c.id
from public.courses c
where pt.course_id is null
  and c.school_year  = 2026
  and c.semester     = 1
  and c.subject      = pt.subject
  and c.grade        = pt.grade
  and c.class_number = pt.class_number;

update public.weekly_schedule ws
set course_id = c.id
from public.courses c
where ws.course_id is null
  and c.school_year  = 2026
  and c.semester     = 1
  and c.subject      = ws.subject
  and c.grade        = ws.grade
  and c.class_number = ws.class_number;

update public.daily_class_overrides dco
set course_id = c.id
from public.courses c
where dco.course_id is null
  and c.school_year  = 2026
  and c.semester     = 1
  and c.subject      = dco.subject
  and c.grade        = dco.grade
  and c.class_number = dco.class_number;

-- ═════════════════════════════════════════════════════════════
-- 3) 학급 컬럼 완화 — 선택 수업은 학년·반이 없다
-- ═════════════════════════════════════════════════════════════

alter table public.progress_tracker      alter column grade        drop not null;
alter table public.progress_tracker      alter column class_number drop not null;
alter table public.weekly_schedule       alter column grade        drop not null;
alter table public.weekly_schedule       alter column class_number drop not null;
alter table public.daily_class_overrides alter column grade        drop not null;
alter table public.daily_class_overrides alter column class_number drop not null;

-- ═════════════════════════════════════════════════════════════
-- 4) 수업에서 파생 컬럼 채우기 (INSERT/UPDATE 시)
-- ═════════════════════════════════════════════════════════════
-- 화면·조회 코드가 subject/grade/class_number 를 계속 읽으므로 비워두지 않는다.
-- 앱은 course_id 만 보내면 된다.

create or replace function public.fill_progress_course_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.courses%rowtype;
begin
  if new.course_id is null then
    return new;                         -- 옛 방식(학반 직접 지정) 행은 그대로 둔다
  end if;

  select * into c from public.courses where id = new.course_id;
  if not found then
    return new;
  end if;

  new.subject      := c.subject;
  new.grade        := c.grade;
  new.class_number := c.class_number;
  return new;
end;
$$;

drop trigger if exists progress_tracker_fill_course on public.progress_tracker;
create trigger progress_tracker_fill_course
  before insert or update on public.progress_tracker
  for each row execute function public.fill_progress_course_fields();

drop trigger if exists weekly_schedule_fill_course on public.weekly_schedule;
create trigger weekly_schedule_fill_course
  before insert or update on public.weekly_schedule
  for each row execute function public.fill_progress_course_fields();

drop trigger if exists daily_class_overrides_fill_course on public.daily_class_overrides;
create trigger daily_class_overrides_fill_course
  before insert or update on public.daily_class_overrides
  for each row execute function public.fill_progress_course_fields();

-- progress_tracker.school_year 도 수업 기준으로 맞춰둔다 (NOT NULL 유지).
update public.progress_tracker pt
set school_year = c.school_year
from public.courses c
where pt.course_id = c.id and pt.school_year is distinct from c.school_year;

-- ═════════════════════════════════════════════════════════════
-- 5) 유일성 키 교체 — course_id 기준
-- ═════════════════════════════════════════════════════════════
-- 옛 키는 (grade, class_number, subject) 라 선택 수업(학반 NULL)을 구분하지 못한다.

alter table public.progress_tracker
  drop constraint if exists progress_tracker_teacher_id_date_grade_class_number_subject_key;
alter table public.weekly_schedule
  drop constraint if exists weekly_schedule_teacher_id_day_of_week_grade_class_number_su_key;
alter table public.daily_class_overrides
  drop constraint if exists daily_class_overrides_teacher_id_date_grade_class_number_sub_key;

create unique index if not exists progress_tracker_course_uidx
  on public.progress_tracker (teacher_id, date, course_id)
  where course_id is not null;

create unique index if not exists weekly_schedule_course_uidx
  on public.weekly_schedule (teacher_id, day_of_week, course_id)
  where course_id is not null;

create unique index if not exists daily_class_overrides_course_uidx
  on public.daily_class_overrides (teacher_id, date, course_id)
  where course_id is not null;

create index if not exists progress_tracker_course_idx
  on public.progress_tracker (course_id, date);
create index if not exists weekly_schedule_course_idx
  on public.weekly_schedule (course_id);

-- ═════════════════════════════════════════════════════════════
-- 6) 학생 RLS — "내 학급" → "내가 수강하는 수업"
-- ═════════════════════════════════════════════════════════════
-- 선택 수업 학생은 학급이 제각각이라 기존 정책으로는 자기 수업 진도를 못 봤다.
-- course_id 가 없는 옛 행은 종전대로 학급 기준으로 남겨둔다.

drop policy if exists progress_tracker_student_course_select on public.progress_tracker;
create policy progress_tracker_student_course_select on public.progress_tracker
  for select to authenticated
  using ( course_id is not null and public.is_course_student(course_id) );

drop policy if exists weekly_schedule_student_course_select on public.weekly_schedule;
create policy weekly_schedule_student_course_select on public.weekly_schedule
  for select to authenticated
  using ( course_id is not null and public.is_course_student(course_id) );

drop policy if exists daily_class_overrides_student_course_select on public.daily_class_overrides;
create policy daily_class_overrides_student_course_select on public.daily_class_overrides
  for select to authenticated
  using ( course_id is not null and public.is_course_student(course_id) );

commit;

-- ═════════════════════════════════════════════════════════════
-- 검증
-- ═════════════════════════════════════════════════════════════

-- (a) 백필 결과 — course_id 가 비어 있는 행이 남았는지
-- select '진도' as t, count(*) filter (where course_id is null) as 미매칭, count(*) as 전체
--   from public.progress_tracker
-- union all
-- select '시간표', count(*) filter (where course_id is null), count(*) from public.weekly_schedule
-- union all
-- select '예외',   count(*) filter (where course_id is null), count(*) from public.daily_class_overrides;

-- (b) 미매칭 행의 정체 (있으면 어떤 학반·교과인지)
-- select 'progress' as t, grade, class_number, subject, count(*)
--   from public.progress_tracker where course_id is null group by 1,2,3,4
-- union all
-- select 'weekly', grade, class_number, subject, count(*)
--   from public.weekly_schedule where course_id is null group by 1,2,3,4;

-- (c) 수업별 진도 행 수
-- select c.school_year, c.semester, c.name, count(pt.id) as 진도행
--   from public.courses c
--   left join public.progress_tracker pt on pt.course_id = c.id
--  group by c.id, c.school_year, c.semester, c.name
--  order by c.school_year, c.semester, c.name;

-- ═════════════════════════════════════════════════════════════
-- ROLLBACK
-- ═════════════════════════════════════════════════════════════
-- drop policy if exists progress_tracker_student_course_select      on public.progress_tracker;
-- drop policy if exists weekly_schedule_student_course_select       on public.weekly_schedule;
-- drop policy if exists daily_class_overrides_student_course_select on public.daily_class_overrides;
-- drop trigger if exists progress_tracker_fill_course      on public.progress_tracker;
-- drop trigger if exists weekly_schedule_fill_course       on public.weekly_schedule;
-- drop trigger if exists daily_class_overrides_fill_course on public.daily_class_overrides;
-- drop function if exists public.fill_progress_course_fields();
-- drop index if exists public.progress_tracker_course_uidx;
-- drop index if exists public.weekly_schedule_course_uidx;
-- drop index if exists public.daily_class_overrides_course_uidx;
-- alter table public.progress_tracker      drop column if exists course_id;
-- alter table public.weekly_schedule       drop column if exists course_id;
-- alter table public.daily_class_overrides drop column if exists course_id;
--   (grade/class_number NOT NULL 복구는 NULL 행을 먼저 정리한 뒤)
