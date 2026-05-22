-- 20260523_student_login_foundation.sql
-- MathLab 학생 로그인 / 교사 권한 / 활동 응답 구조 1차 설계

create extension if not exists pgcrypto;

-- 1. 공통 프로필
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),

  -- 학생은 202620202 같은 로그인 ID, 교사/일반인은 email 또는 별도 login_id 사용 가능
  login_id text unique not null,

  name text not null,

  role text not null default 'general'
    check (role in ('admin', 'teacher', 'student', 'general')),

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'locked')),

  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- 2. 학생 정보
create table if not exists students (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid unique not null references profiles(id) on delete cascade,

  -- 예: 2026
  school_year integer not null,

  -- 예: 20202
  student_code text not null,

  -- 예: 202620202
  student_login_id text unique not null,

  grade integer not null,
  class_number integer not null,
  student_number integer not null,

  created_at timestamptz not null default now(),

  unique (school_year, student_code),
  unique (school_year, grade, class_number, student_number)
);

-- 3. 교사 정보
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid unique not null references profiles(id) on delete cascade,

  teacher_group text,
  created_at timestamptz not null default now()
);

-- 4. 교사 권한
-- subject는 우선 text로 둔다.
-- 나중에 subjects 테이블을 확정하면 subject_id로 전환 가능.
create table if not exists teacher_permissions (
  id uuid primary key default gen_random_uuid(),

  teacher_id uuid not null references teachers(id) on delete cascade,

  subject text not null,
  grade integer not null,
  class_number integer not null,

  can_read_reflections boolean not null default true,
  can_manage_sessions boolean not null default true,
  can_manage_activities boolean not null default false,

  created_at timestamptz not null default now(),

  unique (teacher_id, subject, grade, class_number)
);

-- 5. 새 활동 응답 테이블
create table if not exists activity_responses (
  id uuid primary key default gen_random_uuid(),

  activity_id uuid not null references activities(id) on delete restrict,

  student_id uuid not null references students(id) on delete cascade,

  -- 세션은 보조 기능이므로 nullable
  session_id uuid references sessions(id) on delete set null,

  -- 나중에 교사 권한 조회나 세션 생성자 추적을 위해 nullable로 둔다.
  teacher_id uuid references teachers(id) on delete set null,

  -- 빠른 조회를 위해 학생 테이블에서 복사해 저장한다.
  -- 학생 정보가 나중에 바뀌어도 제출 당시 기준을 보존할 수 있다.
  school_year integer not null,
  grade integer not null,
  class_number integer not null,
  student_number integer not null,

  subject text,
  activity_slug text,

  response_data jsonb not null default '{}'::jsonb,
  reflection_data jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. 조회 성능용 인덱스
create index if not exists idx_activity_responses_student_id
  on activity_responses(student_id);

create index if not exists idx_activity_responses_activity_id
  on activity_responses(activity_id);

create index if not exists idx_activity_responses_session_id
  on activity_responses(session_id);

create index if not exists idx_activity_responses_class_scope
  on activity_responses(subject, grade, class_number);

create index if not exists idx_activity_responses_created_at
  on activity_responses(created_at desc);

-- 7. sessions에 교사/학급 범위 정보를 나중에 붙일 수 있도록 컬럼 추가
alter table sessions
  add column if not exists teacher_id uuid references teachers(id) on delete set null;

alter table sessions
  add column if not exists subject text;

alter table sessions
  add column if not exists grade integer;

alter table sessions
  add column if not exists class_number integer;

-- 8. 개발 초기용 RLS 메모
-- 지금은 기존 anon 기반 MVP가 있으므로 RLS를 바로 강하게 걸면 화면이 깨질 수 있다.
-- 학생 로그인 저장 전환이 끝난 뒤 RLS 정책을 정교하게 추가하는 것을 권장한다.