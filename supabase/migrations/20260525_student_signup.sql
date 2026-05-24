-- 20260525_student_signup.sql
-- H-2-2: 학생 회원가입 — 명렬표(student_roster) 매칭 + 자동 승인 + students 행 생성.
--
-- 1) 명렬표 매칭은 anon 에 명단을 노출하지 않도록 security definer 함수로만 확인한다.
-- 2) handle_new_auth_user 트리거를 확장해 학생(role=student) 가입을 서버측에서 검증/처리한다.

-- 1) 가입 폼이 제출 전에 호출하는 사전 확인용 RPC. (전체 명단 대신 불리언만 반환)
create or replace function public.check_student_roster(
  p_school_year integer,
  p_student_code text,
  p_name text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from student_roster
    where school_year = p_school_year
      and student_code = p_student_code
      and name = btrim(p_name)
  );
$$;

grant execute on function public.check_student_roster(integer, text, text)
  to anon, authenticated;

-- 2) auth.users 생성 시 profiles(및 학생이면 students) 자동 생성 트리거 (확장판)
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_login_id     text := nullif(trim(new.raw_user_meta_data->>'login_id'), '');
  meta_name         text := coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), '이름 미입력');
  meta_role         text := new.raw_user_meta_data->>'role';
  meta_school_year  integer := nullif(new.raw_user_meta_data->>'school_year', '')::integer;
  meta_student_code text := nullif(trim(new.raw_user_meta_data->>'student_code'), '');
  safe_role         text;
  r                 student_roster%rowtype;
begin
  -- 가입자가 스스로 admin 이 되는 것을 차단한다.
  safe_role := case
    when meta_role in ('teacher', 'student', 'general') then meta_role
    else 'general'
  end;

  if safe_role = 'student' then
    -- 명렬표 매칭(학번 + 이름). 일치해야 가입 허용 + 자동 승인.
    select * into r
    from student_roster sr
    where sr.school_year = meta_school_year
      and sr.student_code = meta_student_code
      and sr.name = meta_name
    limit 1;

    if not found then
      raise exception '명렬표에서 일치하는 학생을 찾을 수 없습니다.';
    end if;

    insert into profiles (id, login_id, name, role, status, email)
    values (
      new.id,
      coalesce(meta_login_id, r.school_year::text || r.student_code),
      r.name,                                  -- 이름은 명렬표 기준(권위)
      'student',
      'approved',                              -- 명렬표 일치 → 자동 승인
      new.email
    )
    on conflict (id) do nothing;

    insert into students (
      profile_id, school_year, student_code, student_login_id,
      grade, class_number, student_number
    )
    values (
      new.id, r.school_year, r.student_code, r.school_year::text || r.student_code,
      r.grade, r.class_number, r.student_number
    )
    on conflict (profile_id) do nothing;

  else
    -- 교사/일반: 항상 승인 대기로 시작.
    insert into profiles (id, login_id, name, role, status, email)
    values (
      new.id,
      coalesce(meta_login_id, new.email),
      meta_name,
      safe_role,
      'pending',
      new.email
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;
