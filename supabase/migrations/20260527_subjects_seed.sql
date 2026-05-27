-- 20260527_subjects_seed.sql
-- 교과(subjects) 마스터를 정규 교육과정 교과로 시드 + 표시 순서 + 철자 정합.
--
-- 배경: subjects 에는 '확률과 통계'(공백 포함) 1개만 있었고, activities.subject /
--   activity_responses.subject / teacher_permissions.subject 가 이 값을 FK(ON UPDATE CASCADE)로 참조한다.
--   사용자가 정한 표기는 '확률과통계'(공백 없음)이고, 정규 교과 9개를 등록한다.
--
-- 처리:
--   1) subjects.order_index 추가(교육과정 순서로 정렬용; 기존 알파벳 정렬 대체).
--   2) '확률과 통계' → '확률과통계' rename. FK CASCADE 로 activities/responses/teacher_permissions 자동 정합.
--      (코드에 '확률과 통계' 하드코딩 없음 — 'probability-simulator'는 활동 slug 라 무관.)
--   3) 교과 9개 upsert(순서 부여). 멱등.
--
-- 안전성: rename 은 '확률과 통계' 가 있고 '확률과통계' 가 아직 없을 때만(unique 충돌 방지).
--   seed 는 on conflict(name) do update → 재실행해도 순서만 갱신. RLS 는 admin 전용이나
--   SQL 에디터(service_role)로 적용 → 우회.

-- (1) 표시 순서 컬럼
alter table public.subjects add column if not exists order_index integer;

-- (2) 철자 정합: '확률과 통계' → '확률과통계'
update public.subjects
set name = '확률과통계'
where name = '확률과 통계'
  and not exists (select 1 from public.subjects s2 where s2.name = '확률과통계');

-- (3) 정규 교과 9개 시드(교육과정 순서)
insert into public.subjects (name, order_index) values
  ('공통수학1', 1),
  ('공통수학2', 2),
  ('대수',      3),
  ('미적분1',   4),
  ('미적분2',   5),
  ('확률과통계', 6),
  ('경제수학',   7),
  ('기하',      8),
  ('영재',      9)
on conflict (name) do update set order_index = excluded.order_index;

-- ── 검증 (적용 후) ──
-- select name, order_index from subjects order by order_index nulls last, name;  -- 9행, 1..9 순
-- select subject, count(*) from activity_responses group by subject;            -- '확률과통계' 로 정합
-- select subject, count(*) from teacher_permissions group by subject;           -- '확률과통계' 로 정합

-- ── ROLLBACK ──
-- 시드 제거(참조 없는 8개만; 확률과통계는 FK 참조가 있어 함부로 삭제 불가):
--   delete from subjects where name in ('공통수학1','공통수학2','대수','미적분1','미적분2','경제수학','기하','영재');
-- 철자 되돌리기(필요 시): update subjects set name='확률과 통계' where name='확률과통계';
-- 순서 컬럼 제거: alter table subjects drop column if exists order_index;
