-- 20260816_study_group_teacher_access.sql
-- 수업 그룹(study_groups) 담당 교사에게 "정규 담당 학급"과 같은 학생 기록 열람 권한 부여.
--
-- 배경:
--   경제수학처럼 선택 수업은 한 학급이 통째로 오는 게 아니라 여러 학급에서 선택한 학생이 모인다.
--   지금까지 교사 권한 판정은 전부 teacher_permissions(subject, grade, class_number) 기반
--   (teacher_has_class / teacher_has_class_subject) 이라 이런 집단을 표현할 방법이 없었다.
--   그 결과 그룹 담당 교사는 그룹 학생의 students 행조차 못 읽어 성찰 열람·AI 세특이 불가능했다.
--   20260605_study_groups.sql 주석의 "그룹 안 교사 역할의 정책 적용은 후속 라운드" 를 여기서 완료한다.
--
-- 모델(신규 테이블 없음 — 진실의 원천 하나):
--   담당 수업 그룹 = study_group_members(role='teacher') 행.
--   그룹 학생      = study_group_members(role='student') 행.
--   그룹 교과      = study_group_subjects.
--   즉 "그룹 G 에 교사 역할로 들어있는 승인된 교사" 는 "G 에 학생 역할로 들어있는 학생" 의
--   기록을 볼 수 있다. 학생이 어느 학급 소속이든 무관.
--
-- 열람 범위 — 정규 담당 학급 규칙과 동일하게 맞춘다:
--   activity_responses / reflection_priority : 그룹 교과로 제한 (teacher_has_class_subject 와 동형).
--                                              단 응답 subject 가 NULL 이면 교과 무관 노출(기존 예외 동일).
--   students / profiles / legacy_reflections / survey_responses / activity_visits
--                                            : 교과 무관 (teacher_has_class 와 동형).
--
-- 구현 방식:
--   기존 정책을 고치지 않고 "그룹용 permissive 정책" 을 추가한다.
--   PostgreSQL 은 같은 커맨드의 permissive 정책을 OR 로 합치므로 기존 학급 권한은 그대로 살아있다.
--   판정은 전부 SECURITY DEFINER 헬퍼로 — study_group_members 자기참조 RLS 재귀를 피한다
--   (20260605_study_groups_recursion_fix.sql 의 is_group_member 와 같은 패턴).
--
-- 쓰기 권한은 주지 않는다(SELECT 만). 그룹 학생 응답 삭제·마감은 학급 담당 교사/관리자 몫.
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  파일 맨 아래 검증 쿼리 참고.

-- ═════════════════════════════════════════════════════════════
-- 1) SECURITY DEFINER 헬퍼
-- ═════════════════════════════════════════════════════════════

-- 현재 사용자가 이 profile(학생) 이 속한 어떤 그룹의 담당 교사인가.
-- 그룹 안 'teacher' 역할이라도 실제 계정이 승인된 교사/관리자여야 한다
-- (학생 계정을 그룹 교사로 잘못 넣어도 동료 성찰이 열리지 않도록).
create or replace function public.is_group_teacher_of_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.study_group_members sm
    join public.study_group_members tm
      on tm.group_id = sm.group_id and tm.role = 'teacher'
    join public.profiles pr on pr.id = tm.profile_id
    where sm.profile_id = p_profile_id
      and sm.role = 'student'
      and tm.profile_id = auth.uid()
      and pr.status = 'approved'
      and pr.role in ('teacher', 'admin')
  );
$$;

-- students.id 기준 동일 판정.
create or replace function public.is_group_teacher_of_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    where s.id = p_student_id
      and public.is_group_teacher_of_profile(s.profile_id)
  );
$$;

-- 교과까지 제한한 판정 — 그 학생과 같은 그룹이면서, 그 그룹이 해당 교과를 가진 경우만.
-- p_subject 가 NULL 이면 교과 무관(그룹 담당이면 통과) — teacher_has_class_subject 의 예외와 동일.
create or replace function public.is_group_teacher_of_student_subject(
  p_student_id uuid,
  p_subject text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    join public.study_group_members sm
      on sm.profile_id = s.profile_id and sm.role = 'student'
    join public.study_group_members tm
      on tm.group_id = sm.group_id and tm.role = 'teacher'
    join public.profiles pr on pr.id = tm.profile_id
    where s.id = p_student_id
      and tm.profile_id = auth.uid()
      and pr.status = 'approved'
      and pr.role in ('teacher', 'admin')
      and (
        p_subject is null
        or exists (
          select 1 from public.study_group_subjects gs
          where gs.group_id = sm.group_id and gs.subject = p_subject
        )
      )
  );
$$;

-- reflection_priority 용 — 응답의 (student_id, subject) 로 위 판정을 재사용.
-- 정책에서 activity_responses 를 직접 서브쿼리하면 그 테이블 RLS 가 겹쳐 적용되므로 헬퍼로 우회.
create or replace function public.is_group_teacher_of_response(p_response_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.activity_responses ar
    where ar.id = p_response_id
      and public.is_group_teacher_of_student_subject(ar.student_id, ar.subject)
  );
$$;

revoke all on function public.is_group_teacher_of_profile(uuid) from public;
revoke all on function public.is_group_teacher_of_student(uuid) from public;
revoke all on function public.is_group_teacher_of_student_subject(uuid, text) from public;
revoke all on function public.is_group_teacher_of_response(uuid) from public;

grant execute on function public.is_group_teacher_of_profile(uuid) to authenticated;
grant execute on function public.is_group_teacher_of_student(uuid) to authenticated;
grant execute on function public.is_group_teacher_of_student_subject(uuid, text) to authenticated;
grant execute on function public.is_group_teacher_of_response(uuid) to authenticated;

-- ═════════════════════════════════════════════════════════════
-- 2) 정책 추가 (기존 학급 정책과 OR 로 합쳐짐)
-- ═════════════════════════════════════════════════════════════

-- ── students: 그룹 학생 행 SELECT (학생 목록·학번·이름 조인의 출발점)
drop policy if exists "group teacher reads students" on public.students;
create policy "group teacher reads students"
  on public.students for select to authenticated
  using ( public.is_group_teacher_of_student(id) );

-- ── profiles: 그룹 학생의 이름 조인
drop policy if exists "group teacher reads student profiles" on public.profiles;
create policy "group teacher reads student profiles"
  on public.profiles for select to authenticated
  using ( public.is_group_teacher_of_profile(id) );

-- ── activity_responses: 그룹 학생의 응답·성찰 (그룹 교과로 제한)
drop policy if exists "group teacher reads activity_responses" on public.activity_responses;
create policy "group teacher reads activity_responses"
  on public.activity_responses for select to authenticated
  using ( public.is_group_teacher_of_student_subject(student_id, subject) );

-- ── reflection_priority: 학생이 생기부 후보로 별표한 항목 (AI 세특 기본 선택)
drop policy if exists "group teacher reads reflection_priority" on public.reflection_priority;
create policy "group teacher reads reflection_priority"
  on public.reflection_priority for select to authenticated
  using ( public.is_group_teacher_of_response(activity_response_id) );

-- ── legacy_reflections: 옛 앱(Streamlit) 이식 성찰 (교과 무관 — 기존 학급 규칙과 동일)
drop policy if exists "group teacher reads legacy_reflections" on public.legacy_reflections;
create policy "group teacher reads legacy_reflections"
  on public.legacy_reflections for select to authenticated
  using ( public.is_group_teacher_of_student(student_id) );

-- ── survey_responses: 사전/사후 설문 응답 (교과 무관)
drop policy if exists "group teacher reads survey_responses" on public.survey_responses;
create policy "group teacher reads survey_responses"
  on public.survey_responses for select to authenticated
  using ( public.is_group_teacher_of_student(student_id) );

-- ── activity_visits: 그룹 학생의 활동 방문 기록 (교과 무관, profile_id 기준)
drop policy if exists "group teacher reads activity_visits" on public.activity_visits;
create policy "group teacher reads activity_visits"
  on public.activity_visits for select to authenticated
  using ( public.is_group_teacher_of_profile(profile_id) );

-- ═════════════════════════════════════════════════════════════
-- 3) 검증
-- ═════════════════════════════════════════════════════════════

-- (a) 헬퍼 4개가 생겼는가
-- select proname from pg_proc
--  where pronamespace = 'public'::regnamespace
--    and proname like 'is_group_teacher_%' order by proname;
-- 기대: is_group_teacher_of_profile / _of_response / _of_student / _of_student_subject

-- (b) 정책 7개가 붙었는가
-- select tablename, policyname, cmd from pg_policies
--  where policyname like 'group teacher reads%' order by tablename;
-- 기대: activity_responses, activity_visits, legacy_reflections, profiles,
--       reflection_priority, students, survey_responses  (각 SELECT 1개)

-- (c) 실데이터 스모크 — 관리자(SQL 에디터)에서 그룹 구성 확인
-- select g.name as 그룹,
--        count(*) filter (where m.role='teacher') as 교사수,
--        count(*) filter (where m.role='student') as 학생수,
--        (select string_agg(gs.subject, ', ') from public.study_group_subjects gs
--          where gs.group_id = g.id) as 교과
--   from public.study_groups g
--   left join public.study_group_members m on m.group_id = g.id
--  group by g.id, g.name order by g.name;

-- (d) 특정 교사 시점 판정 — auth.uid() 대신 직접 확인하고 싶을 때
--     (아래는 헬퍼가 아니라 같은 조건을 손으로 푼 쿼리)
-- select s.grade, s.class_number, s.student_number, pr.name
--   from public.students s
--   join public.profiles pr on pr.id = s.profile_id
--  where exists (
--    select 1
--      from public.study_group_members sm
--      join public.study_group_members tm
--        on tm.group_id = sm.group_id and tm.role = 'teacher'
--     where sm.profile_id = s.profile_id and sm.role = 'student'
--       and tm.profile_id = '<교사 profile_id>'
--  )
--  order by s.grade, s.class_number, s.student_number;

-- ═════════════════════════════════════════════════════════════
-- ROLLBACK (문제 시 이 블록만 실행 — 그룹 권한만 사라지고 학급 권한은 그대로)
-- ═════════════════════════════════════════════════════════════
-- drop policy if exists "group teacher reads students"            on public.students;
-- drop policy if exists "group teacher reads student profiles"    on public.profiles;
-- drop policy if exists "group teacher reads activity_responses"  on public.activity_responses;
-- drop policy if exists "group teacher reads reflection_priority" on public.reflection_priority;
-- drop policy if exists "group teacher reads legacy_reflections"  on public.legacy_reflections;
-- drop policy if exists "group teacher reads survey_responses"    on public.survey_responses;
-- drop policy if exists "group teacher reads activity_visits"     on public.activity_visits;
-- drop function if exists public.is_group_teacher_of_response(uuid);
-- drop function if exists public.is_group_teacher_of_student_subject(uuid, text);
-- drop function if exists public.is_group_teacher_of_student(uuid);
-- drop function if exists public.is_group_teacher_of_profile(uuid);
