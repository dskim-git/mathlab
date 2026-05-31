-- 20260531_responses_loosen_activity_fk.sql
-- 이식한 미니활동(60+개)은 activities 테이블에 행이 없는 경우가 많다.
-- /learn 에서 미니활동 성찰을 저장하려면 activity_responses.activity_id 가 NULL 도 허용해야 한다.
-- (식별은 activity_slug 가 맡는다. activities 행이 있는 경우엔 activity_id 가 같이 채워질 수 있음.)
--
-- 마이그레이션 내용:
--   activity_responses.activity_id NOT NULL → NULL 허용.
-- 기존 5건 정도의 행은 그대로 유지(activity_id 채워진 채).
-- FK 자체(on delete restrict)는 유지 — 행이 NULL 이면 FK 무시.
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:  select is_nullable from information_schema.columns
--           where table_schema='public' and table_name='activity_responses' and column_name='activity_id';
--        -- 'YES' 가 떠야 한다.

alter table public.activity_responses
  alter column activity_id drop not null;

-- 빠른 audit
-- select count(*) total,
--        count(*) filter (where activity_id is null) as null_rows
--   from public.activity_responses;
