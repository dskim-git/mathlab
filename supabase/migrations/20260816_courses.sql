-- 20260816_courses.sql
-- 개설 수업(courses) 도입 — (학년도 · 학기 · 교과 · 수강생) 을 하나로 묶는 단위.
--
-- 배경:
--   지금까지 "누가 어떤 학생을 담당하는가" 가 세 군데에 흩어져 있었다.
--     teacher_permissions : 교과 + 학반      (학년도·학기 없음)
--     study_groups        : 멤버 + 교과      (학년도·학기 없음)
--     activity_responses  : school_year·semester·subject 는 있는데 담당 정보가 없음
--   그래서 "2026학년도 2학기 경제수학 수강생" 같은 수업 단위를 표현할 수 없고,
--   교사 화면에서 학기와 교과를 따로 고르게 되어 축이 서로 겉돈다.
--
--   courses 는 정규 수업(1학년 9반 공통수학1)과 선택 수업(경제수학)을 같은 모델로 표현한다.
--   수업 하나를 고르면 학년도·학기·교과·학생 명단이 한 번에 결정된다.
--
-- 모델:
--   courses         : 개설 수업 (학년도, 학기, 교과, 이름, [정규 수업이면 학년·반])
--   course_teachers : 수업 담당 교사 (profile_id — auth.uid() 와 바로 비교)
--   course_students : 수강 학생 (students.id)
--
--   정규 수업은 grade/class_number 가 채워지고, 선택 수업은 NULL 이다.
--   (표시용 힌트일 뿐 — 권한 판정은 언제나 course_students 명단으로 한다.)
--
-- 기존 데이터 자동 변환 (2026학년도 1학기로):
--   teacher_permissions 의 (교과, 학년, 반) → 수업 1개 + 그 반 학생 전원 배정 + 담당 교사 배정
--   study_group_subjects 의 (그룹, 교과)    → 수업 1개 + 그룹의 학생/교사 배정
--   원본 테이블은 그대로 둔다 — 기존 RLS 헬퍼(teacher_has_class 등)가 아직 이를 참조한다.
--   새 courses 정책은 기존 정책과 OR 로 합쳐지므로 권한이 좁아지는 일은 없다.
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  파일 맨 아래 검증 쿼리.

begin;

-- ═════════════════════════════════════════════════════════════
-- 1) 테이블
-- ═════════════════════════════════════════════════════════════

create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  school_year   integer  not null,
  semester      smallint not null check (semester in (1, 2)),
  subject       text     not null
                  references public.subjects(name) on update cascade on delete restrict,
  name          text     not null,
  -- 정규 학급 수업이면 학년·반 (선택 수업은 NULL). 표시·일괄배정 편의용.
  grade         integer,
  class_number  integer,
  note          text     not null default '',
  -- 자동 변환 추적용 — 어느 수업 그룹에서 왔는지
  source_group_id uuid references public.study_groups(id) on delete set null,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (school_year, semester, name)
);

create table if not exists public.course_teachers (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  added_at   timestamptz not null default now(),
  unique (course_id, profile_id)
);

create table if not exists public.course_students (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  added_at   timestamptz not null default now(),
  unique (course_id, student_id)
);

create index if not exists courses_term_idx
  on public.courses (school_year, semester, subject);
create index if not exists course_teachers_profile_idx
  on public.course_teachers (profile_id);
create index if not exists course_students_student_idx
  on public.course_students (student_id);
create index if not exists course_students_course_idx
  on public.course_students (course_id);

create or replace function public.set_courses_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_courses_updated_at();

-- ═════════════════════════════════════════════════════════════
-- 2) SECURITY DEFINER 헬퍼
--    정책 안에서 course_* 를 직접 EXISTS 하면 그 테이블 RLS 와 얽히므로 전부 함수로 우회한다.
--    (study_groups 의 is_group_member 와 같은 패턴.)
-- ═════════════════════════════════════════════════════════════

-- 내가 이 수업의 담당 교사인가. 그룹과 마찬가지로 계정이 승인된 교사/관리자여야 한다.
create or replace function public.is_course_teacher(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.course_teachers ct
    join public.profiles pr on pr.id = ct.profile_id
    where ct.course_id = p_course_id
      and ct.profile_id = auth.uid()
      and pr.status = 'approved'
      and pr.role in ('teacher', 'admin')
  );
$$;

-- 내가 담당하는 어떤 수업에든 이 학생이 수강생으로 있는가 (교과 무관).
create or replace function public.course_teacher_of_student(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.course_students cs
    join public.course_teachers ct on ct.course_id = cs.course_id
    join public.profiles pr on pr.id = ct.profile_id
    where cs.student_id = p_student_id
      and ct.profile_id = auth.uid()
      and pr.status = 'approved'
      and pr.role in ('teacher', 'admin')
  );
$$;

create or replace function public.course_teacher_of_profile(p_profile_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.students s
    where s.profile_id = p_profile_id
      and public.course_teacher_of_student(s.id)
  );
$$;

-- 기록 한 건(학생 · 교과 · 학년도 · 학기)이 내 수업 범위 안인가.
-- NULL 인 축은 제한하지 않는다 — 교과 무관 자료(subject IS NULL)를 담당 학생에 한해 통과시키기 위함.
create or replace function public.course_teacher_of_record(
  p_student_id uuid,
  p_subject    text,
  p_year       integer,
  p_semester   smallint
)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.course_students cs
    join public.courses c         on c.id = cs.course_id
    join public.course_teachers ct on ct.course_id = c.id
    join public.profiles pr        on pr.id = ct.profile_id
    where cs.student_id = p_student_id
      and ct.profile_id = auth.uid()
      and pr.status = 'approved'
      and pr.role in ('teacher', 'admin')
      and (p_subject  is null or c.subject     = p_subject)
      and (p_year     is null or c.school_year = p_year)
      and (p_semester is null or c.semester    = p_semester)
  );
$$;

-- reflection_priority 용 — 응답 행의 축을 그대로 재사용.
create or replace function public.course_teacher_of_response(p_response_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.activity_responses ar
    where ar.id = p_response_id
      and public.course_teacher_of_record(
            ar.student_id, ar.subject, ar.school_year, ar.semester)
  );
$$;

-- 학생 본인이 이 수업의 수강생인가 (자기 수업 목록 조회용).
create or replace function public.is_course_student(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.course_students cs
    join public.students s on s.id = cs.student_id
    where cs.course_id = p_course_id
      and s.profile_id = auth.uid()
  );
$$;

revoke all on function public.is_course_teacher(uuid)          from public;
revoke all on function public.course_teacher_of_student(uuid)  from public;
revoke all on function public.course_teacher_of_profile(uuid)  from public;
revoke all on function public.course_teacher_of_record(uuid, text, integer, smallint) from public;
revoke all on function public.course_teacher_of_response(uuid) from public;
revoke all on function public.is_course_student(uuid)          from public;

grant execute on function public.is_course_teacher(uuid)          to authenticated;
grant execute on function public.course_teacher_of_student(uuid)  to authenticated;
grant execute on function public.course_teacher_of_profile(uuid)  to authenticated;
grant execute on function public.course_teacher_of_record(uuid, text, integer, smallint) to authenticated;
grant execute on function public.course_teacher_of_response(uuid) to authenticated;
grant execute on function public.is_course_student(uuid)          to authenticated;

-- ═════════════════════════════════════════════════════════════
-- 3) course_* 자체의 RLS
-- ═════════════════════════════════════════════════════════════

alter table public.courses         enable row level security;
alter table public.course_teachers enable row level security;
alter table public.course_students enable row level security;

drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses
  for select to authenticated
  using (
    public.is_admin()
    or public.is_course_teacher(id)
    or public.is_course_student(id)
  );

drop policy if exists courses_admin_all on public.courses;
create policy courses_admin_all on public.courses
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists course_teachers_select on public.course_teachers;
create policy course_teachers_select on public.course_teachers
  for select to authenticated
  using (
    public.is_admin()
    or profile_id = auth.uid()
    or public.is_course_teacher(course_id)
  );

drop policy if exists course_teachers_admin_all on public.course_teachers;
create policy course_teachers_admin_all on public.course_teachers
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists course_students_select on public.course_students;
create policy course_students_select on public.course_students
  for select to authenticated
  using (
    public.is_admin()
    or public.is_course_teacher(course_id)
    or public.is_course_student(course_id)
  );

drop policy if exists course_students_admin_all on public.course_students;
create policy course_students_admin_all on public.course_students
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ═════════════════════════════════════════════════════════════
-- 4) 기록 테이블에 수업 기반 SELECT 정책 추가
--    기존 학급·그룹 정책과 OR 로 합쳐진다.
-- ═════════════════════════════════════════════════════════════

drop policy if exists "course teacher reads students" on public.students;
create policy "course teacher reads students"
  on public.students for select to authenticated
  using ( public.course_teacher_of_student(id) );

drop policy if exists "course teacher reads student profiles" on public.profiles;
create policy "course teacher reads student profiles"
  on public.profiles for select to authenticated
  using ( public.course_teacher_of_profile(id) );

drop policy if exists "course teacher reads activity_responses" on public.activity_responses;
create policy "course teacher reads activity_responses"
  on public.activity_responses for select to authenticated
  using (
    public.course_teacher_of_record(student_id, subject, school_year, semester)
  );

drop policy if exists "course teacher reads reflection_priority" on public.reflection_priority;
create policy "course teacher reads reflection_priority"
  on public.reflection_priority for select to authenticated
  using ( public.course_teacher_of_response(activity_response_id) );

drop policy if exists "course teacher reads legacy_reflections" on public.legacy_reflections;
create policy "course teacher reads legacy_reflections"
  on public.legacy_reflections for select to authenticated
  using (
    public.course_teacher_of_record(student_id, subject, school_year, semester)
  );

drop policy if exists "course teacher reads survey_responses" on public.survey_responses;
create policy "course teacher reads survey_responses"
  on public.survey_responses for select to authenticated
  using (
    public.course_teacher_of_record(student_id, subject, school_year, semester)
  );

drop policy if exists "course teacher reads activity_visits" on public.activity_visits;
create policy "course teacher reads activity_visits"
  on public.activity_visits for select to authenticated
  using ( public.course_teacher_of_profile(profile_id) );

-- ═════════════════════════════════════════════════════════════
-- 5) 기존 데이터 자동 변환 → 2026학년도 1학기
-- ═════════════════════════════════════════════════════════════

-- (a) 정규 학급 수업 — teacher_permissions 의 (교과, 학년, 반) 조합마다 1개
insert into public.courses (school_year, semester, subject, name, grade, class_number, note)
select distinct
  2026, 1::smallint, tp.subject,
  tp.grade || '학년 ' || tp.class_number || '반 ' || tp.subject,
  tp.grade, tp.class_number,
  '담당 학급에서 자동 변환'
from public.teacher_permissions tp
on conflict (school_year, semester, name) do nothing;

insert into public.course_teachers (course_id, profile_id)
select distinct c.id, t.profile_id
from public.teacher_permissions tp
join public.teachers t on t.id = tp.teacher_id
join public.courses  c on c.school_year = 2026
                      and c.semester = 1
                      and c.subject = tp.subject
                      and c.grade = tp.grade
                      and c.class_number = tp.class_number
on conflict (course_id, profile_id) do nothing;

-- 그 학반의 학생 전원 배정
insert into public.course_students (course_id, student_id)
select distinct c.id, s.id
from public.courses c
join public.students s on s.grade = c.grade and s.class_number = c.class_number
where c.school_year = 2026 and c.semester = 1
  and c.grade is not null and c.class_number is not null
on conflict (course_id, student_id) do nothing;

-- (b) 선택 수업 — study_group_subjects 의 (그룹, 교과) 조합마다 1개
--     그룹에 교과가 2개 이상이면 이름 뒤에 교과를 붙여 구분한다.
insert into public.courses (school_year, semester, subject, name, source_group_id, note)
select
  2026, 1::smallint, gs.subject,
  case
    when count(*) over (partition by gs.group_id) > 1
      then sg.name || ' · ' || gs.subject
    else sg.name
  end,
  sg.id,
  '수업 그룹에서 자동 변환'
from public.study_group_subjects gs
join public.study_groups sg on sg.id = gs.group_id
on conflict (school_year, semester, name) do nothing;

insert into public.course_teachers (course_id, profile_id)
select distinct c.id, m.profile_id
from public.courses c
join public.study_group_members m on m.group_id = c.source_group_id and m.role = 'teacher'
where c.source_group_id is not null
on conflict (course_id, profile_id) do nothing;

insert into public.course_students (course_id, student_id)
select distinct c.id, s.id
from public.courses c
join public.study_group_members m on m.group_id = c.source_group_id and m.role = 'student'
join public.students s on s.profile_id = m.profile_id
where c.source_group_id is not null
on conflict (course_id, student_id) do nothing;

commit;

-- ═════════════════════════════════════════════════════════════
-- 검증
-- ═════════════════════════════════════════════════════════════

-- (a) 만들어진 수업 + 인원
-- select c.school_year, c.semester, c.subject, c.name,
--        (select count(*) from public.course_teachers ct where ct.course_id = c.id) as 교사수,
--        (select count(*) from public.course_students cs where cs.course_id = c.id) as 학생수,
--        c.note
--   from public.courses c
--  order by c.school_year, c.semester, c.subject, c.name;

-- (b) 담당 교사가 0명인 수업 (있으면 관리자 화면에서 붙여야 함)
-- select name, subject from public.courses c
--  where not exists (select 1 from public.course_teachers ct where ct.course_id = c.id);

-- (c) 수강생이 0명인 수업
-- select name, subject from public.courses c
--  where not exists (select 1 from public.course_students cs where cs.course_id = c.id);

-- (d) 정책이 붙었는가
-- select tablename, policyname from pg_policies
--  where policyname like 'course teacher reads%' or tablename like 'course%'
--  order by tablename, policyname;

-- ═════════════════════════════════════════════════════════════
-- ROLLBACK
-- ═════════════════════════════════════════════════════════════
-- drop policy if exists "course teacher reads students"            on public.students;
-- drop policy if exists "course teacher reads student profiles"    on public.profiles;
-- drop policy if exists "course teacher reads activity_responses"  on public.activity_responses;
-- drop policy if exists "course teacher reads reflection_priority" on public.reflection_priority;
-- drop policy if exists "course teacher reads legacy_reflections"  on public.legacy_reflections;
-- drop policy if exists "course teacher reads survey_responses"    on public.survey_responses;
-- drop policy if exists "course teacher reads activity_visits"     on public.activity_visits;
-- drop table if exists public.course_students cascade;
-- drop table if exists public.course_teachers cascade;
-- drop table if exists public.courses cascade;
-- drop function if exists public.course_teacher_of_response(uuid);
-- drop function if exists public.course_teacher_of_record(uuid, text, integer, smallint);
-- drop function if exists public.course_teacher_of_profile(uuid);
-- drop function if exists public.course_teacher_of_student(uuid);
-- drop function if exists public.is_course_student(uuid);
-- drop function if exists public.is_course_teacher(uuid);
-- drop function if exists public.set_courses_updated_at();
