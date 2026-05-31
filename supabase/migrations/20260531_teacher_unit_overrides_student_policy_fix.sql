-- 20260531_teacher_unit_overrides_student_policy_fix.sql
-- 학생 SELECT 정책이 작동하지 않던 문제 수정.
-- 원인: 기존 정책의 EXISTS 가 students+teachers+teacher_permissions 3 테이블을 join 하는데,
--      학생 권한으로 평가될 때 teachers / teacher_permissions 의 RLS 가 학생 SELECT 를 허용
--      하지 않아 EXISTS 가 빈 집합 → 정책 false → 학생이 자기 학급 담당 교사 override 를 못 봤다.
-- 수정: SECURITY DEFINER 헬퍼 함수로 매칭 검사 부분을 우회. activity_visits_teacher_class_select 가
--      teacher_has_class() 를 쓰는 방식과 동일.
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:
--   1) 함수 확인: select proname from pg_proc where proname='student_can_see_teacher_override';
--   2) 정책 교체 확인:
--      select policyname, cmd from pg_policies
--        where tablename='teacher_unit_overrides' order by policyname;
--   3) 학생 본인으로 로그인 후 (Supabase SQL editor 가 아니라 앱에서) /learn 단원 접근:
--      교사가 편집한 단원이 그 교사 구성으로 뜨면 OK.

create or replace function public.student_can_see_teacher_override(
  p_teacher_profile_id uuid,
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
      join public.teachers t on t.profile_id = p_teacher_profile_id
      join public.teacher_permissions tp on tp.teacher_id = t.id
     where s.profile_id   = auth.uid()
       and tp.grade        = s.grade
       and tp.class_number = s.class_number
       and tp.subject      = p_subject
  );
$$;

-- 기존 정책 제거 + 함수 기반 정책으로 교체.
drop policy if exists teacher_unit_overrides_student_class_select on public.teacher_unit_overrides;
create policy teacher_unit_overrides_student_class_select on public.teacher_unit_overrides
  for select to authenticated
  using (
    public.student_can_see_teacher_override(
      teacher_unit_overrides.teacher_profile_id,
      teacher_unit_overrides.subject
    )
  );

-- 빠른 audit
-- select student_can_see_teacher_override('<교사 profile_id>'::uuid, '확률과통계'); -- 학생 세션에서 true 가 떠야 함.
