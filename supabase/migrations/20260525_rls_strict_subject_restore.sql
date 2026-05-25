-- 20260525_rls_strict_subject_restore.sql
-- 과목 정합 2단계: 교사 매칭을 (grade+class) 완화 → (subject+grade+class) 엄격으로 복원.
--
-- 전제: 20260525_subject_align_probability.sql 로 활동/응답 subject가 과목 마스터('확률과 통계')와
--       글자까지 일치하도록 정합됨. 이제 teacher_permissions.subject(역시 마스터값)와 매칭된다.
-- 효과: 같은 학급이라도 담당 "교과목"이 다른 교사에게는 그 과목 기록이 보이지 않는다(응답 subject가
--       NULL인 경우는 그 학급 담당 교사면 보임 — teacher_has_class_subject 의 예외).
-- 이는 3c-1b(완화)를 되돌리는 것. teacher_has_class_subject 헬퍼는 3c-1에서 생성됨.

-- 교사 SELECT: 담당 (subject, grade, class)
drop policy if exists "teacher reads scoped activity_responses" on public.activity_responses;
create policy "teacher reads scoped activity_responses"
  on public.activity_responses for select to authenticated
  using ( public.teacher_has_class_subject(grade, class_number, subject) );

-- 교사 DELETE: 동일 기준
drop policy if exists "teacher deletes scoped activity_responses" on public.activity_responses;
create policy "teacher deletes scoped activity_responses"
  on public.activity_responses for delete to authenticated
  using ( public.teacher_has_class_subject(grade, class_number, subject) );

-- ──────────────────────────────────────────────────────────────
-- ROLLBACK (다시 완화: grade+class 만)
-- ──────────────────────────────────────────────────────────────
-- drop policy if exists "teacher reads scoped activity_responses" on public.activity_responses;
-- create policy "teacher reads scoped activity_responses"
--   on public.activity_responses for select to authenticated
--   using ( public.teacher_has_class(grade, class_number) );
-- drop policy if exists "teacher deletes scoped activity_responses" on public.activity_responses;
-- create policy "teacher deletes scoped activity_responses"
--   on public.activity_responses for delete to authenticated
--   using ( public.teacher_has_class(grade, class_number) );
