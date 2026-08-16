-- 20260816_course_enrollment_by_roster.sql
-- 수강생 편성을 "가입 계정" 이 아니라 "학번(student_code)" 기준으로 바꾼다.
--
-- 문제:
--   course_students 가 students.id(가입 계정) 만 참조해서, 아직 회원가입하지 않은 학생은
--   수업에 편성할 수 없었다. 학기 초에는 명렬표만 있고 계정은 없으므로 사전 세팅이 불가능하다.
--
--   옛 앱은 "명렬표에 있으면 가입 즉시 학년에 맞는 교과로 자동 배정" 이었는데, 교과가 늘고
--   선택 과목이 생기면서 학년만으로는 교과를 정할 수 없게 됐다. 그래서 편성 자체를
--   미리 만들어두고 계정이 생기면 자동으로 이어붙이는 방식으로 간다.
--
-- 바뀌는 모델 (테이블은 그대로, 컬럼만 추가):
--   course_students = "편성 명단". 행의 정체성은 (수업, 학번) 이다.
--     student_code  : 필수. 명렬표에만 있는 학생도 여기 들어온다.
--     student_id    : NULL 허용. 계정이 생기면 트리거가 채운다 (= 실제 연결됨).
--   RLS 헬퍼들은 student_id 로 판정하므로, 미가입 편성 행은 아무 권한도 만들지 않는다.
--
-- 자동화 (트리거 2개):
--   1) course_students 에 넣을 때  : student_code ↔ student_id 를 서로 채워준다.
--      → 이미 가입한 학생을 학번으로 편성하면 즉시 연결된다.
--   2) students 행이 생길 때(가입) : 대기 중인 편성을 연결하고,
--      그 학년·반으로 지정된 정규 수업에는 자동으로 편성을 만든다.
--      → 학기 초에 수업만 만들어두면 학생들이 가입하는 대로 알아서 채워진다.
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  파일 맨 아래 검증 쿼리.

begin;

-- ═════════════════════════════════════════════════════════════
-- 1) 컬럼 추가 + 기존 행 백필
-- ═════════════════════════════════════════════════════════════

alter table public.course_students
  add column if not exists student_code text;
alter table public.course_students
  add column if not exists school_year integer;

update public.course_students cs
set student_code = s.student_code,
    school_year  = s.school_year
from public.students s
where s.id = cs.student_id
  and cs.student_code is null;

-- 계정 없이도 편성할 수 있어야 하므로 student_id 를 NULL 허용으로.
alter table public.course_students
  alter column student_id drop not null;

alter table public.course_students
  alter column student_code set not null;

-- 행의 정체성 = (수업, 학번). 같은 학생을 두 번 넣지 못하게 한다.
create unique index if not exists course_students_course_code_uidx
  on public.course_students (course_id, student_code);

create index if not exists course_students_code_idx
  on public.course_students (school_year, student_code);

-- ═════════════════════════════════════════════════════════════
-- 2) 트리거 1 — 편성 행을 넣을 때 학번 ↔ 계정을 서로 채운다
-- ═════════════════════════════════════════════════════════════
-- 관리자 화면은 상황에 따라 둘 중 하나만 알고 있다:
--   가입자 목록에서 고르면 student_id 만, 명렬표에서 고르면 student_code 만.
-- 어느 쪽으로 넣든 나머지가 채워지도록 여기서 정리한다.
create or replace function public.fill_course_student_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_year integer;
begin
  select school_year into v_course_year from public.courses where id = new.course_id;

  -- 계정으로 넣은 경우 → 학번·학년도 채우기
  if new.student_id is not null and (new.student_code is null or new.school_year is null) then
    select s.student_code, s.school_year
      into new.student_code, new.school_year
      from public.students s where s.id = new.student_id;
  end if;

  -- 학년도가 여전히 비면 수업의 학년도를 따른다
  if new.school_year is null then
    new.school_year := v_course_year;
  end if;

  -- 학번으로 넣은 경우 → 이미 가입한 계정이 있으면 바로 연결
  if new.student_id is null and new.student_code is not null then
    select s.id into new.student_id
      from public.students s
     where s.student_code = new.student_code
       and s.school_year  = new.school_year
     limit 1;
  end if;

  return new;
end;
$$;

drop trigger if exists course_students_fill_link on public.course_students;
create trigger course_students_fill_link
  before insert or update on public.course_students
  for each row execute function public.fill_course_student_link();

-- ═════════════════════════════════════════════════════════════
-- 3) 트리거 2 — 학생 계정이 생기면 편성을 이어붙인다
-- ═════════════════════════════════════════════════════════════
-- (a) 미리 만들어둔 편성(student_id IS NULL) 을 이 계정에 연결
-- (b) 학년·반이 지정된 정규 수업에는 편성이 없어도 자동으로 만들어 준다
--     — 옛 앱의 "명렬표 매칭 시 자동 배정" 을 학년도·학기·교과 단위로 되살린 것.
create or replace function public.link_student_to_courses()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.course_students cs
     set student_id = new.id
   where cs.student_id is null
     and cs.student_code = new.student_code
     and cs.school_year  = new.school_year;

  insert into public.course_students (course_id, student_id, student_code, school_year)
  select c.id, new.id, new.student_code, new.school_year
    from public.courses c
   where c.school_year  = new.school_year
     and c.grade        = new.grade
     and c.class_number = new.class_number
  on conflict (course_id, student_code) do nothing;

  return new;
end;
$$;

drop trigger if exists students_link_courses on public.students;
create trigger students_link_courses
  after insert on public.students
  for each row execute function public.link_student_to_courses();

commit;

-- ═════════════════════════════════════════════════════════════
-- 검증
-- ═════════════════════════════════════════════════════════════

-- (a) 편성 현황 — 가입 연결 / 미가입 대기
-- select c.name, c.subject,
--        count(*)                                as 편성,
--        count(cs.student_id)                    as 가입연결,
--        count(*) - count(cs.student_id)         as 미가입대기
--   from public.courses c
--   join public.course_students cs on cs.course_id = c.id
--  group by c.id, c.name, c.subject
--  order by c.name;

-- (b) 미가입 대기 명단 (명렬표 이름과 함께)
-- select c.name as 수업, cs.student_code, sr.name as 학생, sr.grade, sr.class_number
--   from public.course_students cs
--   join public.courses c on c.id = cs.course_id
--   left join public.student_roster sr
--          on sr.school_year = cs.school_year and sr.student_code = cs.student_code
--  where cs.student_id is null
--  order by c.name, cs.student_code;

-- (c) 트리거 동작 확인 — 학생 1명 가입시킨 뒤
-- select c.name, cs.student_code, cs.student_id is not null as 연결됨
--   from public.course_students cs join public.courses c on c.id = cs.course_id
--  where cs.student_code = '<학번>';

-- ═════════════════════════════════════════════════════════════
-- ROLLBACK
-- ═════════════════════════════════════════════════════════════
-- drop trigger if exists students_link_courses on public.students;
-- drop function if exists public.link_student_to_courses();
-- drop trigger if exists course_students_fill_link on public.course_students;
-- drop function if exists public.fill_course_student_link();
-- drop index if exists public.course_students_course_code_uidx;
-- drop index if exists public.course_students_code_idx;
-- delete from public.course_students where student_id is null;   -- 미가입 편성 제거 후
-- alter table public.course_students alter column student_id set not null;
-- alter table public.course_students drop column if exists student_code;
-- alter table public.course_students drop column if exists school_year;
