-- 20260528_class_birthdays.sql
-- 생일 역설 미니활동(Tab 3 우리 반 탐구) 데이터 인프라.
--
-- 정책 결정(2026-05-28):
-- (1) "누구 생일"이 아니라 "어느 일자의 카운트"만 필요 → 학급 통계 RPC는 (month, day, count)만 반환.
-- (2) 학생 1명당 1행(수정 가능). PK = student_id.
-- (3) school_year/grade/class_number는 입력 시점의 학급을 보존하기 위해 비정규화.
--     학생이 진급(2026 5반 → 2027 2반)해도 작년 보드는 작년 학급에 그대로 남는다.
-- (4) 학생 본인 행 CRUD는 RLS로, 같은 학급 동료 일자 조회는 RPC(SECURITY DEFINER)로 처리.
--     → students/profiles RLS는 변경 없음, 다른 활동에 영향 0.
-- 의존: is_admin(), teacher_has_class(grade, class_number) (3c-1 / 3c-1b 에서 정의).
--
-- 적용 순서(에디터):
--   (a) BEGIN; ...본문... COMMIT;
--   (b) 검증 쿼리(아래 주석) 확인
--   (c) 신규 RLS·RPC 권한 확인

begin;

-- ──────────────────────────────────────────────────────────────
-- 1) 테이블
-- ──────────────────────────────────────────────────────────────
create table if not exists public.class_birthdays (
  student_id     uuid primary key references public.students(id) on delete cascade,
  birthday_month smallint not null check (birthday_month between 1 and 12),
  birthday_day   smallint not null check (birthday_day between 1 and 31),
  school_year    integer  not null,
  grade          smallint not null,
  class_number   smallint not null,
  updated_at     timestamptz not null default now()
);

comment on table public.class_birthdays is
  '학급 단위 생일 보드. 학생 1명당 1행. 통계 RPC만 외부 조회 가능(이름·학번 노출 X).';

create index if not exists class_birthdays_class_idx
  on public.class_birthdays (school_year, grade, class_number);

-- ──────────────────────────────────────────────────────────────
-- 2) RLS — 본인 + 관리자만. 학급 동료 SELECT는 RPC로 처리.
-- ──────────────────────────────────────────────────────────────
alter table public.class_birthdays enable row level security;

drop policy if exists "student own all class_birthdays" on public.class_birthdays;
create policy "student own all class_birthdays"
  on public.class_birthdays for all to authenticated
  using (
    student_id in (select id from public.students where profile_id = auth.uid())
  )
  with check (
    student_id in (select id from public.students where profile_id = auth.uid())
  );

drop policy if exists "admin all class_birthdays" on public.class_birthdays;
create policy "admin all class_birthdays"
  on public.class_birthdays for all to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ──────────────────────────────────────────────────────────────
-- 3) RPC: 학생 본인 생일 등록/수정 (UPSERT)
--    학생만 호출 의미 있음(다른 role은 students에 row 없어 자동으로 0행 처리).
-- ──────────────────────────────────────────────────────────────
create or replace function public.submit_class_birthday(
  p_month int,
  p_day   int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student record;
begin
  if p_month is null or p_month < 1 or p_month > 12 then
    raise exception '월은 1~12 사이여야 합니다.' using errcode = '22023';
  end if;
  if p_day is null or p_day < 1 or p_day > 31 then
    raise exception '일은 1~31 사이여야 합니다.' using errcode = '22023';
  end if;

  -- 호출 학생 찾기 (학생이 아니면 NULL → 명시 에러)
  select id, school_year, grade, class_number
    into v_student
    from public.students
   where profile_id = auth.uid()
   limit 1;

  if v_student.id is null then
    raise exception '학생 계정으로만 등록할 수 있습니다.' using errcode = '42501';
  end if;

  insert into public.class_birthdays (
    student_id, birthday_month, birthday_day,
    school_year, grade, class_number, updated_at
  )
  values (
    v_student.id, p_month, p_day,
    v_student.school_year, v_student.grade, v_student.class_number, now()
  )
  on conflict (student_id) do update
    set birthday_month = excluded.birthday_month,
        birthday_day   = excluded.birthday_day,
        -- 학년이 바뀌었다면 새 학급 정보로 갱신
        school_year    = excluded.school_year,
        grade          = excluded.grade,
        class_number   = excluded.class_number,
        updated_at     = now();
end;
$$;

revoke all on function public.submit_class_birthday(int, int) from public;
grant execute on function public.submit_class_birthday(int, int) to authenticated;

-- ──────────────────────────────────────────────────────────────
-- 4) RPC: 학급 일자별 카운트 (이름·학번 노출 없음)
--    권한 게이트:
--      - 학생: 본인 students(year,grade,class)가 인자와 정확히 일치할 때만
--      - 교사: teacher_has_class(grade, class)
--      - 관리자: 무제한
--    권한 없으면 빈 결과 반환(노출 차단).
-- ──────────────────────────────────────────────────────────────
create or replace function public.get_class_birthday_stats(
  p_year  int,
  p_grade int,
  p_class int
)
returns table (
  birthday_month smallint,
  birthday_day   smallint,
  cnt            int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role  text;
  v_ok    boolean := false;
begin
  -- 역할 확인
  select role into v_role from public.profiles where id = auth.uid() limit 1;

  if v_role = 'admin' then
    v_ok := true;
  elsif v_role = 'teacher' then
    v_ok := public.teacher_has_class(p_grade, p_class);
  elsif v_role = 'student' then
    v_ok := exists (
      select 1 from public.students
       where profile_id = auth.uid()
         and school_year = p_year
         and grade       = p_grade
         and class_number= p_class
    );
  end if;

  if not v_ok then
    return; -- 빈 결과
  end if;

  return query
    select cb.birthday_month,
           cb.birthday_day,
           count(*)::int as cnt
      from public.class_birthdays cb
     where cb.school_year  = p_year
       and cb.grade        = p_grade
       and cb.class_number = p_class
     group by cb.birthday_month, cb.birthday_day
     order by cb.birthday_month, cb.birthday_day;
end;
$$;

revoke all on function public.get_class_birthday_stats(int, int, int) from public;
grant execute on function public.get_class_birthday_stats(int, int, int) to authenticated;

commit;

-- ──────────────────────────────────────────────────────────────
-- 검증 쿼리 (적용 후 에디터에서 실행 권장)
-- ──────────────────────────────────────────────────────────────
-- 테이블 존재
--   select count(*) from public.class_birthdays;           -- 0이어야 함
-- 정책 존재
--   select policyname from pg_policies
--    where schemaname='public' and tablename='class_birthdays';
--   -- 기대: student own all class_birthdays / admin all class_birthdays
-- 함수 존재
--   select proname from pg_proc
--    where proname in ('submit_class_birthday','get_class_birthday_stats');
-- 권한 확인
--   select has_function_privilege('authenticated',
--          'public.submit_class_birthday(int,int)','execute');   -- t
--   select has_function_privilege('authenticated',
--          'public.get_class_birthday_stats(int,int,int)','execute'); -- t

-- ──────────────────────────────────────────────────────────────
-- ROLLBACK (실패 시 되돌리기)
-- ──────────────────────────────────────────────────────────────
-- begin;
--   drop function if exists public.get_class_birthday_stats(int,int,int);
--   drop function if exists public.submit_class_birthday(int,int);
--   drop table if exists public.class_birthdays;
-- commit;
