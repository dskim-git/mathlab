-- 20260530_ai_sebteuk_permission.sql
-- 교사별 AI세특 사용 권한 토글.
-- 관리자가 토글한 교사만 /teacher/sebteuk 메뉴·라우트가 노출되고,
-- Claude API 가 호출되어 비용이 발생하므로 이중 잠금이 필요하다 (페이지 게이트 + RLS).
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:  select column_name, data_type, column_default
--          from information_schema.columns
--          where table_name='teachers' and column_name='ai_sebteuk_enabled';

alter table public.teachers
  add column if not exists ai_sebteuk_enabled boolean not null default false;

-- 빠른 조회용 인덱스 (활성 교사만 골라낼 때)
create index if not exists teachers_ai_sebteuk_enabled_idx
  on public.teachers (ai_sebteuk_enabled)
  where ai_sebteuk_enabled = true;
