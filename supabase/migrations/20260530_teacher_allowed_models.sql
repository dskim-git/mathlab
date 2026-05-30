-- 20260530_teacher_allowed_models.sql
-- 교사별 AI 모델 허용 목록(글로벌 정책의 부분집합으로 동작).
-- NULL  : 글로벌 정책(app_settings.ai_sebteuk_enabled_models) 그대로 따름
-- []    : 명시적으로 0개 (이 교사는 어떤 모델도 사용 불가)
-- 값 있음: 그 모델만 허용 (교사용 드롭다운/검증에 사용)
--
-- 실제 사용 가능 모델 = (글로벌 enabled) ∩ (교사 allowed) 로 계산한다.
-- (둘 다 통과해야 진짜 사용 가능. 관리자 정책이 우선.)
--
-- 적용:  Supabase SQL 에디터에서 실행.

alter table public.teachers
  add column if not exists allowed_sebteuk_models text[];
