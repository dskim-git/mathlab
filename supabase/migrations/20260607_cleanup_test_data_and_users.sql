-- 20260607_cleanup_test_data_and_users.sql
-- 테스트 데이터 일괄 정리 — 학생 데이터·운영 부속 테이블 wipe + 비-보존 사용자 삭제.
--
-- 보존 사용자(4명):
--   - admin       (관리자)   profile/auth id = 5ebe16f0-d780-4ebd-a35d-401b6c9f808b
--   - pyopyo      (표선생, 교사)            16b9c3ab-2ca5-4818-97bd-08c8c2e8b0ad
--   - heyheidi    (성윤, 교사)              21d0a5af-aed3-4344-81ed-a30e2d0080d7
--   - 202620602   (홍길동, 학생)            3637bbd0-b518-4557-899f-4d61f8b5b4ab
--
-- 삭제 사용자(3명):
--   - test        (김선생, 교사)
--   - 202630102   (정순이, 학생)
--   - 202610301   (이영희, 학생)
--
-- wipe 테이블(전체 행 비움):
--   activity_responses, activity_visits, learning_progress, reflection_priority,
--   sebteuk_drafts, bingo_rooms, study_group_members, study_groups,
--   progress_tracker, feedback, notifications, login_logs, student_roster
--
-- 보존 테이블(손대지 않음):
--   ai_usage_log (운영 비용 추적용 2건 — 활동기록과는 별개)
--   subjects, school_classes, app_settings, curriculum_units 등 마스터 테이블
--   teacher_permissions / class_subject_permissions / general_subject_permissions
--   (이들 권한 행은 profiles 삭제 시 cascade 또는 이미 보존 사용자 것이라 영향 없음)
--
-- ─── 실행 절차 ──────────────────────────────────────────────────────────
-- 1) (선택) Supabase Studio Table editor 에서 wipe 대상 테이블 CSV export 로 백업.
--    데이터는 전부 테스트라 사용자가 직접 "복구 불필요" 확인함.
-- 2) 아래 BEGIN ~ COMMIT 블록을 SQL editor 에 그대로 붙여넣고 한 번에 실행.
-- 3) 마지막 SELECT 결과로 행 수 확인 (예상값은 주석 참고).
-- 4) auth.users 가 SQL 권한 부족으로 삭제 안 되면 Supabase Dashboard →
--    Authentication → Users 에서 test/202630102/202610301 수동 삭제.
-- 5) 문제 있으면 BEGIN 블록을 다시 굴리되, COMMIT 직전에 ROLLBACK; 으로 취소 가능.
-- ────────────────────────────────────────────────────────────────────────

begin;

-- 1) 학생/활동/성찰 데이터 wipe (참조 자식부터 부모 순)
delete from public.activity_responses;
delete from public.activity_visits;
delete from public.learning_progress;
delete from public.reflection_priority;
delete from public.sebteuk_drafts;

-- 2) 운영 부속 데이터 wipe
delete from public.bingo_rooms;
delete from public.study_group_members;
delete from public.study_groups;
delete from public.progress_tracker;
delete from public.feedback;
delete from public.notifications;
delete from public.login_logs;
delete from public.student_roster;

-- 3) 보존 4명 외 모든 profiles 삭제. students/teachers 는 ON DELETE CASCADE.
delete from public.profiles
where id not in (
  '5ebe16f0-d780-4ebd-a35d-401b6c9f808b'::uuid,  -- admin (관리자)
  '16b9c3ab-2ca5-4818-97bd-08c8c2e8b0ad'::uuid,  -- pyopyo (표선생, 교사)
  '21d0a5af-aed3-4344-81ed-a30e2d0080d7'::uuid,  -- heyheidi (성윤, 교사)
  '3637bbd0-b518-4557-899f-4d61f8b5b4ab'::uuid   -- 홍길동 (학생)
);

-- 4) auth.users 정리 (profiles ↔ auth.users 사이 FK 없음 → 별도 삭제 필요)
--    SQL editor 권한이 부족하면 이 한 줄만 에러 → 위 1~3은 commit 되고
--    auth.users 3명만 Dashboard → Authentication → Users 에서 수동 삭제.
delete from auth.users
where id not in (
  '5ebe16f0-d780-4ebd-a35d-401b6c9f808b'::uuid,
  '16b9c3ab-2ca5-4818-97bd-08c8c2e8b0ad'::uuid,
  '21d0a5af-aed3-4344-81ed-a30e2d0080d7'::uuid,
  '3637bbd0-b518-4557-899f-4d61f8b5b4ab'::uuid
);

-- 5) 검증 — 한 번에 결과 표시
select 'profiles' as t, count(*) as n from public.profiles
union all select 'students',           count(*) from public.students
union all select 'teachers',           count(*) from public.teachers
union all select 'auth.users',         count(*) from auth.users
union all select 'activity_responses', count(*) from public.activity_responses
union all select 'activity_visits',    count(*) from public.activity_visits
union all select 'learning_progress',  count(*) from public.learning_progress
union all select 'reflection_priority',count(*) from public.reflection_priority
union all select 'sebteuk_drafts',     count(*) from public.sebteuk_drafts
union all select 'bingo_rooms',        count(*) from public.bingo_rooms
union all select 'study_group_members',count(*) from public.study_group_members
union all select 'study_groups',       count(*) from public.study_groups
union all select 'progress_tracker',   count(*) from public.progress_tracker
union all select 'feedback',           count(*) from public.feedback
union all select 'notifications',      count(*) from public.notifications
union all select 'login_logs',         count(*) from public.login_logs
union all select 'student_roster',     count(*) from public.student_roster
union all select 'ai_usage_log',       count(*) from public.ai_usage_log;

-- 기대 결과:
--   profiles=4, students=1, teachers=2, auth.users=4
--   activity_responses=0, activity_visits=0, learning_progress=0,
--   reflection_priority=0, sebteuk_drafts=0, bingo_rooms=0,
--   study_group_members=0, study_groups=0, progress_tracker=0,
--   feedback=0, notifications=0, login_logs=0, student_roster=0
--   ai_usage_log=2 (보존)

commit;

-- ─── 롤백 가이드 ─────────────────────────────────────────────────────────
-- 위 commit; 을 ROLLBACK; 으로 바꿔 실행하면 트랜잭션 전체가 취소된다(데이터 살아남음).
-- 단, auth.users 의 삭제는 트랜잭션 안에 있어도 일부 Supabase 환경에서 즉시
-- 적용될 수 있으니, 의심되면 commit 전에 select count(*) from auth.users; 로
-- 먼저 확인 후 결정한다.
-- ────────────────────────────────────────────────────────────────────────
