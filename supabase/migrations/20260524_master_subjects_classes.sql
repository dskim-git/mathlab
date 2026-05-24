-- 20260524_master_subjects_classes.sql
-- 관리자 기초 설정: 과목(subjects) / 학급(school_classes) 마스터 목록.
-- 교사 담당 학급(teacher_permissions) 부여 시 드롭다운 선택지로 사용한다.
-- (teacher_permissions.subject/grade/class_number 는 여전히 값 복사 방식이라 FK로 묶지는 않는다.)

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists school_classes (
  id uuid primary key default gen_random_uuid(),
  grade integer not null,
  class_number integer not null,
  created_at timestamptz not null default now(),
  unique (grade, class_number)
);

alter table subjects enable row level security;
alter table school_classes enable row level security;

-- dev 임시 개방: 로그인한 관리자 화면에서 읽기/추가/삭제. Phase 3에서 admin 전용으로 교체.
drop policy if exists "dev authenticated all subjects" on public.subjects;
create policy "dev authenticated all subjects"
  on public.subjects for all to authenticated using (true) with check (true);

drop policy if exists "dev authenticated all school_classes" on public.school_classes;
create policy "dev authenticated all school_classes"
  on public.school_classes for all to authenticated using (true) with check (true);
