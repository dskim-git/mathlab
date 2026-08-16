-- 20260816_scores_course_parity.sql
-- 점수 기록(activity_scores) 조회를 수업 담당 교사에게도 열어준다.
--
-- 배경:
--   teacher SELECT 정책이 teacher_has_class_subject(grade, class_number, subject) 뿐이라,
--   수업(courses)으로만 배정된 교사는 자기 수업 학생의 점수를 볼 수 없다.
--   activity_responses 에 이미 맞춰둔 읽기 범위와 어긋난다.
--
--   리더보드(activity_leaderboard)는 SECURITY DEFINER RPC 라 원래 모두에게 동작한다.
--   여기서 여는 것은 관리 화면 등에서의 직접 SELECT 경로다.
--
-- activity_scores 에는 학년도·학기 컬럼이 없으므로 교과만으로 판정한다
-- (course_teacher_of_record 의 year/semester 인자에 NULL 을 넘겨 그 축은 제한하지 않음).
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  select policyname, cmd from pg_policies
--          where tablename='activity_scores' order by policyname;

drop policy if exists "course teacher reads activity_scores" on public.activity_scores;
create policy "course teacher reads activity_scores"
  on public.activity_scores for select to authenticated
  using (
    public.course_teacher_of_record(student_id, subject, null, null)
  );

-- ── ROLLBACK ──
-- drop policy if exists "course teacher reads activity_scores" on public.activity_scores;
