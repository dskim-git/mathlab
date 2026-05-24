-- 20260525_student_roster.sql
-- 명렬표(student_roster): 가입 시 학번+이름 매칭의 기준이 되는 공식 재학생 명단.
-- (registered 'students' 테이블과 별개. roster = 가입 자격 원천, students = 실제 가입 계정.)

create table if not exists student_roster (
  id uuid primary key default gen_random_uuid(),
  school_year integer not null,
  grade integer not null,
  class_number integer not null,
  student_number integer not null,
  -- 교내 학번 예: 20202 ( = 학년1자리 + 반2자리 + 번호2자리 )
  student_code text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (school_year, student_code)
);

create index if not exists idx_student_roster_year_class
  on student_roster(school_year, grade, class_number);

alter table student_roster enable row level security;

-- dev 임시 개방: 관리자(authenticated)가 업로드/조회/삭제.
-- 가입 시 명렬표 매칭은 anon에 노출하지 않고 H-2-2의 서버측(트리거) 에서 처리할 예정이다.
drop policy if exists "dev authenticated all student_roster" on public.student_roster;
create policy "dev authenticated all student_roster"
  on public.student_roster for all to authenticated using (true) with check (true);
