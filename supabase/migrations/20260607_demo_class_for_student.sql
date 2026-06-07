-- 20260607_demo_class_for_student.sql
-- 수업 시연용 "데모반" — 1학년 0반 0번 + 학생 홍길동을 그 자리로 + ID 동기화.
--
-- 배경: 현재 홍길동의 ID 202620602(=2학년 6반 02번)는 학번 인코딩 약속을 따른다.
-- 사용자가 전자칠판 수업 시연용으로 외우기 쉬운 ID 202610000(=1학년 0반 0번)을 원함.
-- "0반 0번"은 비정상 값이지만 데모 약속 — 실제 학반과 충돌 없음.
--
-- 변경:
--   1) school_classes 에 (grade=1, class_number=0) 데모반 추가
--   2) students 행을 데모반으로 이동 + student_login_id/student_code 변경
--   3) profiles 의 login_id/email 동기화
--   4) auth.users 의 email 동기화 (합성 이메일 매핑 유지 — loginIdToEmail)
--   5) class_subject_permissions 에 데모반(1,0) × 모든 교과 권한 부여
--      → 학생 권한 흐름으로도 모든 교과 학습 동선 시연 가능
--
-- ─── 실행 ──────────────────────────────────────────────────────────────
-- Supabase SQL editor 에서 BEGIN~COMMIT 한 번에 실행 후 마지막 SELECT 결과로 검증.
-- auth.users.email update 가 GoTrue 환경설정상 막혀 있으면 그 한 줄만 실패 →
-- 1~3은 commit 되고, Dashboard → Authentication → Users 에서 해당 사용자
-- email 만 수동으로 202610000@mathlab.app 으로 변경.
-- ────────────────────────────────────────────────────────────────────────

begin;

-- 1) 데모반 등록 (없으면 추가)
insert into public.school_classes (grade, class_number)
values (1, 0)
on conflict (grade, class_number) do nothing;

-- 2) students — 홍길동 행을 데모반으로 + ID/코드 변경
update public.students
set
  grade = 1,
  class_number = 0,
  student_number = 0,
  student_code = '10000',
  student_login_id = '202610000'
where student_login_id = '202620602';

-- 3) profiles — login_id + email 동기화
update public.profiles
set
  login_id = '202610000',
  email = '202610000@mathlab.app'
where login_id = '202620602';

-- 4) auth.users — 합성 이메일 동기화 (loginIdToEmail 매핑 유지)
update auth.users
set email = '202610000@mathlab.app'
where email = '202620602@mathlab.app';

-- 5) 데모반에 모든 교과 권한 부여 — 학생 동선으로 모든 교과 학습 시연 가능
insert into public.class_subject_permissions (grade, class_number, subject)
select 1, 0, name from public.subjects
on conflict (grade, class_number, subject) do nothing;

-- 6) 검증
select 'students(new_id)'   as t, count(*) as n from public.students where student_login_id = '202610000'
union all select 'profiles(new_id)',  count(*) from public.profiles where login_id = '202610000'
union all select 'auth.users(new)',   count(*) from auth.users where email = '202610000@mathlab.app'
union all select 'students(old_id)',  count(*) from public.students where student_login_id = '202620602'
union all select 'profiles(old_id)',  count(*) from public.profiles where login_id = '202620602'
union all select 'demo_class_row',    count(*) from public.school_classes where grade=1 and class_number=0
union all select 'demo_class_perms',  count(*) from public.class_subject_permissions where grade=1 and class_number=0;

-- 기대값:
--   students(new_id)=1, profiles(new_id)=1, auth.users(new)=1
--   students(old_id)=0, profiles(old_id)=0
--   demo_class_row=1
--   demo_class_perms=현재 subjects 행 수 (메모리상 9개)

commit;

-- 로그인 테스트:
--   기존: 202620602 / (기존 비번)
--   새것: 202610000 / (동일 비번 — Auth 의 비번은 email 변경에 영향받지 않음)
--   학생 홈에 들어가면 "1학년 0반 0번" 으로 표시됨 (의도된 데모 약속).
