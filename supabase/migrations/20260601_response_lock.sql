-- 20260601_response_lock.sql
-- 학생이 본인 활동 응답을 수정할 수 있게 + 교사가 학급·활동 단위로 마감(잠금) 처리.
--
-- 정책 변경:
--   1) activity_responses.locked_at timestamptz nullable 컬럼 추가.
--      NULL  = 학생이 자기 응답을 수정 가능.
--      값 있음 = 잠금. 학생 수정 불가, 표시상 "🔒 마감됨".
--   2) 학생 UPDATE 정책 추가 — 본인 응답 + locked_at IS NULL 일 때만.
--      WITH CHECK 도 동일 조건 — 학생이 자기 응답을 잠금(locked_at SET) 시도해도
--      with check 가 거부(locked_at IS NULL 유지).
--   3) 교사 UPDATE 정책 추가 — 담당 학급·과목(teacher_has_class_subject). 마감/해제 용.
--
-- 적용 흐름:
--   학생 /student/reflections — 응답 카드에 "수정" 버튼(locked_at NULL). 저장 시 reflection_data UPDATE.
--   교사 /teacher/records — 학급·활동 그룹 단위로 "마감"/"마감 해제" 버튼. locked_at = now() 또는 NULL.
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:
--   select column_name from information_schema.columns
--     where table_schema='public' and table_name='activity_responses' and column_name='locked_at';
--   select policyname, cmd from pg_policies
--     where tablename='activity_responses' order by policyname;

alter table public.activity_responses
  add column if not exists locked_at timestamptz;

create index if not exists activity_responses_lock_lookup_idx
  on public.activity_responses (subject, grade, class_number, activity_slug);

-- 학생 UPDATE — 본인 응답이고 locked_at IS NULL.
-- WITH CHECK 도 locked_at IS NULL 유지 → 학생이 본인 응답을 잠금할 수 없음.
drop policy if exists "student updates own activity_responses" on public.activity_responses;
create policy "student updates own activity_responses"
  on public.activity_responses for update to authenticated
  using (
    locked_at is null
    and student_id in (
      select id from public.students where profile_id = auth.uid()
    )
  )
  with check (
    locked_at is null
    and student_id in (
      select id from public.students where profile_id = auth.uid()
    )
  );

-- 교사 UPDATE — 담당 학급·과목. 마감/해제 위해 locked_at 조작 허용.
-- (조건은 SELECT/DELETE 와 같은 teacher_has_class_subject 헬퍼 사용.)
drop policy if exists "teacher updates scoped activity_responses" on public.activity_responses;
create policy "teacher updates scoped activity_responses"
  on public.activity_responses for update to authenticated
  using ( public.teacher_has_class_subject(grade, class_number, subject) )
  with check ( public.teacher_has_class_subject(grade, class_number, subject) );

-- 빠른 audit
-- select count(*) total,
--        count(*) filter (where locked_at is not null) as locked
--   from public.activity_responses;
