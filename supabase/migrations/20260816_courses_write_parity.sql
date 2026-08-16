-- 20260816_courses_write_parity.sql
-- 수업 담당 교사에게 "담당 학급 교사" 와 같은 쓰기 권한을 준다 (응답 마감·삭제).
--
-- 배경:
--   20260816_courses.sql 은 SELECT 정책만 추가했다. 그런데 activity_responses 의
--   UPDATE(마감/해제) · DELETE 정책은 여전히 teacher_has_class_subject 뿐이라,
--   수업(courses)으로만 배정된 교사는 자기 수업 응답을 마감할 수 없다.
--   교사 화면의 마감 관리(LockManager)가 학급 담당 교사에게만 동작하는 불일치가 생긴다.
--
--   읽기 범위와 쓰기 범위를 같게 맞춘다 — 판정은 SELECT 와 동일한
--   course_teacher_of_record(student_id, subject, school_year, semester).
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  select policyname, cmd from pg_policies
--          where tablename='activity_responses' order by cmd, policyname;

drop policy if exists "course teacher updates activity_responses" on public.activity_responses;
create policy "course teacher updates activity_responses"
  on public.activity_responses for update to authenticated
  using (
    public.course_teacher_of_record(student_id, subject, school_year, semester)
  )
  with check (
    public.course_teacher_of_record(student_id, subject, school_year, semester)
  );

drop policy if exists "course teacher deletes activity_responses" on public.activity_responses;
create policy "course teacher deletes activity_responses"
  on public.activity_responses for delete to authenticated
  using (
    public.course_teacher_of_record(student_id, subject, school_year, semester)
  );

-- ── ROLLBACK ──
-- drop policy if exists "course teacher updates activity_responses" on public.activity_responses;
-- drop policy if exists "course teacher deletes activity_responses" on public.activity_responses;
