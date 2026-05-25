-- 20260525_rls_phase3c1b_teacher_class_loose.sql
-- Phase 3c-1 보정: 교사 매칭을 (subject+grade+class) 엄격 → (grade+class) 완화.
--
-- 사유: activities.subject 가 과목 마스터(subjects)와 분리된 자유 텍스트라 실데이터가
-- 불일치한다(예: 응답 subject='probability' vs 권한 subject='확률과통계'). 과목 단위로
-- 좁히기는 activities↔subjects 정합 작업 이후로 미룬다. 지금은 "담당 학급" 보호만 강제.
--
-- 3c-1 은 이미 라이브에 적용됨 → 이 파일은 델타(헬퍼 추가 + 교사 정책 2개 교체)만 적용한다.
-- teacher_has_class_subject 헬퍼는 그대로 둔다(엄격 모드 복귀 시 재사용).

-- 담당 학급(grade+class) 보유 여부만 본다(과목 무시).
create or replace function public.teacher_has_class(
  p_grade integer,
  p_class integer
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teachers t
    join public.profiles pr on pr.id = t.profile_id
    join public.teacher_permissions tp on tp.teacher_id = t.id
    where t.profile_id = auth.uid()
      and pr.status = 'approved'
      and tp.grade = p_grade
      and tp.class_number = p_class
  );
$$;

grant execute on function public.teacher_has_class(integer, integer) to authenticated;

-- 교사 SELECT: 담당 학급(grade+class)만 (과목 무시)
drop policy if exists "teacher reads scoped activity_responses" on public.activity_responses;
create policy "teacher reads scoped activity_responses"
  on public.activity_responses for select to authenticated
  using ( public.teacher_has_class(grade, class_number) );

-- 교사 DELETE: 동일 기준
drop policy if exists "teacher deletes scoped activity_responses" on public.activity_responses;
create policy "teacher deletes scoped activity_responses"
  on public.activity_responses for delete to authenticated
  using ( public.teacher_has_class(grade, class_number) );

-- ──────────────────────────────────────────────────────────────
-- ROLLBACK (엄격 매칭으로 복귀)
-- ──────────────────────────────────────────────────────────────
-- drop policy if exists "teacher reads scoped activity_responses" on public.activity_responses;
-- create policy "teacher reads scoped activity_responses"
--   on public.activity_responses for select to authenticated
--   using ( public.teacher_has_class_subject(grade, class_number, subject) );
-- drop policy if exists "teacher deletes scoped activity_responses" on public.activity_responses;
-- create policy "teacher deletes scoped activity_responses"
--   on public.activity_responses for delete to authenticated
--   using ( public.teacher_has_class_subject(grade, class_number, subject) );
