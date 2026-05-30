-- 20260530_ai_model_allowlist.sql
-- AI 세특에서 교사가 사용할 수 있는 Claude 모델 화이트리스트.
-- 글로벌 단일 정책 (관리자가 모든 교사에게 동일 적용).
-- app_settings 의 키 'ai_sebteuk_enabled_models' 에 콤마 문자열로 저장.
--
-- 기본값: 전체 (3개 모델 다 허용)
-- 사용처:
--  - /admin/access 의 모델 허용 토글 UI 가 이 값을 읽고 쓴다.
--  - /teacher/sebteuk 의 모델 드롭다운이 이 값으로 필터.
--  - /api/teacher/sebteuk/generate 가 호출 모델이 허용 목록에 있는지 검증.
--
-- 적용:  Supabase SQL 에디터에서 실행.

insert into public.app_settings (key, value)
values ('ai_sebteuk_enabled_models', 'claude-sonnet-4-6,claude-opus-4-7,claude-haiku-4-5')
on conflict (key) do nothing;
