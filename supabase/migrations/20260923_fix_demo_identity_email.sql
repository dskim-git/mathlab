-- 20260923_fix_demo_identity_email.sql
-- 학번 20602 가입 불가 버그 수정 — auth.identities 에 남은 옛 합성 이메일 잔재 정리.
--
-- [증상]
--   명렬표에 있는 학생(2026 / 2학년 6반 2번 강태우)이 학생 회원가입을 하면
--   "가입 중 오류가 발생했습니다: User already registered" 가 뜬다.
--   그런데 회원관리·Supabase Auth 사용자 목록 어디에도 20602 계정은 없다.
--
-- [원인]
--   20260607_demo_class_for_student.sql 이 데모 계정(홍길동)을 20602 → 10000 으로
--   옮기면서 auth.users.email 만 UPDATE 했다. Supabase Auth 는 이메일을 두 곳에 두는데
--     - auth.users.email                      → 202610000@mathlab.app (변경됨)
--     - auth.identities.identity_data->>'email' → 202620602@mathlab.app (옛 값 잔존)
--     - auth.users.raw_user_meta_data          → login_id/student_code 옛 값 잔존
--   GoTrue 의 가입 중복 검사(IsDuplicatedEmail)는 auth.identities 를 보므로
--   20602 합성 이메일이 여전히 "사용 중"으로 판정된다.
--   (반대로 admin 사용자 조회는 auth.users.email 을 보기 때문에 아무것도 안 보인다.)
--
-- [주의]
--   auth.identities.email 은 identity_data 에서 파생되는 generated column 이라
--   직접 UPDATE 하면 안 된다. identity_data 만 고치면 자동으로 따라온다.
--
-- [실행] Supabase Studio → SQL editor 에 통째로 붙여넣고 실행.
--        마지막 SELECT 두 개로 결과를 확인한다.

begin;

-- 0) 수정 전 상태 확인 (identity 가 옛 이메일을 들고 있는지)
select
  'BEFORE' as phase,
  u.id,
  u.email                        as users_email,
  i.identity_data->>'email'      as identity_email,
  u.raw_user_meta_data->>'login_id'     as meta_login_id,
  u.raw_user_meta_data->>'student_code' as meta_student_code
from auth.users u
join auth.identities i on i.user_id = u.id and i.provider = 'email'
where u.id = '3637bbd0-b518-4557-899f-4d61f8b5b4ab';

-- 1) identity 의 이메일을 현재 계정 이메일(202610000)로 갱신 → 20602 해제
update auth.identities
set identity_data = identity_data || jsonb_build_object('email', '202610000@mathlab.app'),
    updated_at    = now()
where user_id  = '3637bbd0-b518-4557-899f-4d61f8b5b4ab'
  and provider = 'email'
  and identity_data->>'email' = '202620602@mathlab.app';

-- 2) user metadata 의 옛 학번 정보도 현재 값으로 정리
--    (트리거는 INSERT 때만 쓰지만, 관리 화면·디버깅 혼선을 없애기 위해 함께 맞춘다)
update auth.users
set raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
      'email',        '202610000@mathlab.app',
      'login_id',     '202610000',
      'student_code', '10000'
    ),
    updated_at = now()
where id = '3637bbd0-b518-4557-899f-4d61f8b5b4ab';

-- 3) 수정 후 상태 — identity_email 이 202610000@mathlab.app 이어야 한다
select
  'AFTER' as phase,
  u.id,
  u.email                        as users_email,
  i.identity_data->>'email'      as identity_email,
  i.email                        as identity_email_column,  -- generated column 도 따라왔는지
  u.raw_user_meta_data->>'login_id'     as meta_login_id,
  u.raw_user_meta_data->>'student_code' as meta_student_code
from auth.users u
join auth.identities i on i.user_id = u.id and i.provider = 'email'
where u.id = '3637bbd0-b518-4557-899f-4d61f8b5b4ab';

-- 4) 20602 합성 이메일이 완전히 비었는지 최종 확인 — 세 값 모두 0 이어야 한다
select
  (select count(*) from auth.users      where email = '202620602@mathlab.app')            as users_20602,
  (select count(*) from auth.identities where identity_data->>'email' = '202620602@mathlab.app') as identities_20602,
  (select count(*) from public.profiles where login_id = '202620602')                     as profiles_20602;

commit;
