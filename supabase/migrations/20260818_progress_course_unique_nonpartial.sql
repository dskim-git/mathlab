-- 20260818_progress_course_unique_nonpartial.sql
-- 진도표 셀 저장(내용/음영 예외)이 "저장 중 오류" 로 실패하는 문제 수정.
--
-- 문제:
--   20260816_progress_by_course.sql 이 유일성 키를 course_id 기준으로 바꾸면서
--   부분 인덱스(partial index)로 만들었다.
--     create unique index progress_tracker_course_uidx
--       on progress_tracker (teacher_id, date, course_id) where course_id is not null;
--
--   그런데 앱은 PostgREST upsert(onConflict: "teacher_id,date,course_id") 를 쓴다.
--   PostgREST 는 `insert ... on conflict (teacher_id, date, course_id) do update` 를
--   WHERE 절 없이 생성하는데, PostgreSQL 은 부분 인덱스를 충돌 대상(arbiter)으로
--   추론하려면 문장에 인덱스 조건과 같은 WHERE 가 있어야 한다.
--   결과: 42P10 "there is no unique or exclusion constraint matching the
--   ON CONFLICT specification" 로 매번 실패한다.
--
--   증상 구분:
--     · 시간표 설정(weekly_schedule)  = insert/delete 라 정상 동작
--     · 일자 비고·휴강(daily_schedule_meta) = 옛 통짜 unique 라 정상 동작
--     · 진도 내용 + 강제 음영/음영 해제 = upsert 라 실패  ← 여기
--
-- 방식:
--   부분 조건을 떼고 통짜 unique 인덱스로 바꾼다.
--   PostgreSQL 기본(NULLS DISTINCT)에서는 course_id 가 NULL 인 옛 행들끼리는
--   여전히 중복이 허용되므로, 부분 인덱스일 때와 실제 제약 효과가 같다.
--   즉 데이터 손실·추가 제약 없이 ON CONFLICT 추론만 가능해진다.
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  파일 맨 아래 검증 쿼리.

begin;

-- ═════════════════════════════════════════════════════════════
-- 1) 부분 unique 인덱스 → 통짜 unique 인덱스 교체
-- ═════════════════════════════════════════════════════════════
-- 이름은 그대로 유지한다. 20260816 을 다시 돌려도
-- `create unique index if not exists` 가 같은 이름을 보고 건너뛰므로
-- 부분 인덱스가 되살아나지 않는다.

drop index if exists public.progress_tracker_course_uidx;
create unique index progress_tracker_course_uidx
  on public.progress_tracker (teacher_id, date, course_id);

drop index if exists public.daily_class_overrides_course_uidx;
create unique index daily_class_overrides_course_uidx
  on public.daily_class_overrides (teacher_id, date, course_id);

-- weekly_schedule 은 지금은 insert/delete 만 쓰지만, 같은 함정을 남겨두지 않는다.
drop index if exists public.weekly_schedule_course_uidx;
create unique index weekly_schedule_course_uidx
  on public.weekly_schedule (teacher_id, day_of_week, course_id);

commit;

-- ═════════════════════════════════════════════════════════════
-- 검증
-- ═════════════════════════════════════════════════════════════

-- (a) 세 인덱스 정의에 WHERE 가 사라졌는지 — 결과에 "WHERE" 가 없어야 정상
-- select indexname, indexdef
--   from pg_indexes
--  where schemaname = 'public'
--    and indexname in ('progress_tracker_course_uidx',
--                      'daily_class_overrides_course_uidx',
--                      'weekly_schedule_course_uidx')
--  order by indexname;

-- (b) 실제 upsert 가 통과하는지 (본인 teacher_id·course_id 로 바꿔 실행 후 삭제)
-- insert into public.daily_class_overrides (teacher_id, date, course_id, action)
-- values ('<teacher uuid>', '2026-08-18', '<course uuid>', 'remove')
-- on conflict (teacher_id, date, course_id)
-- do update set action = excluded.action
-- returning id, subject, grade, class_number;
-- -- 정리: delete from public.daily_class_overrides where date = '2026-08-18' and course_id = '<course uuid>';

-- ═════════════════════════════════════════════════════════════
-- ROLLBACK  (부분 인덱스로 되돌리기 — 되돌리면 저장 오류도 함께 돌아온다)
-- ═════════════════════════════════════════════════════════════
-- drop index if exists public.progress_tracker_course_uidx;
-- create unique index progress_tracker_course_uidx
--   on public.progress_tracker (teacher_id, date, course_id) where course_id is not null;
-- drop index if exists public.daily_class_overrides_course_uidx;
-- create unique index daily_class_overrides_course_uidx
--   on public.daily_class_overrides (teacher_id, date, course_id) where course_id is not null;
-- drop index if exists public.weekly_schedule_course_uidx;
-- create unique index weekly_schedule_course_uidx
--   on public.weekly_schedule (teacher_id, day_of_week, course_id) where course_id is not null;
