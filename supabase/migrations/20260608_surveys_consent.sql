-- 20260608_surveys_consent.sql
-- surveys.consent_text 컬럼 추가 — 설문 응답 전 개인정보 동의 안내문.
--
-- 정책:
--   - null/빈 문자열 → 동의 단계 표시 X (바로 폼)
--   - 텍스트 있음 → 응답 전 안내 + "동의합니다" 체크 강제
-- 옛 streamlit 의 survey_pre/post.py 의 안내문을 옛 pre/post 설문 행에 채워둠.

begin;

alter table public.surveys
  add column if not exists consent_text text;

-- 옛 사전/사후 설문 안내문 (streamlit survey_pre.py / survey_post.py 의 _render_consent)
update public.surveys
set consent_text = $$이 설문은 수학 탐구 웹앱이 여러분의 수학 학습에 어떤 도움이 되는지 알아보기 위한 것입니다.

- 응답 내용은 수업 연구 목적으로만 활용되며, 성적에 전혀 영향을 주지 않습니다.
- 솔직하게 답할수록 더 좋은 수업을 만드는 데 도움이 됩니다.
- 참여를 원하지 않으면 언제든 중단할 수 있습니다.$$
where slug = 'pre_survey_2026';

update public.surveys
set consent_text = $$이 설문은 수학 탐구 웹앱을 활용한 수업이 여러분의 수학 학습에 어떤 도움이 되었는지 알아보기 위한 것입니다.

- 응답 내용은 수업 연구 목적으로만 활용되며, 성적에 전혀 영향을 주지 않습니다.
- 솔직하게 답할수록 더 좋은 수업을 만드는 데 도움이 됩니다.
- 참여를 원하지 않으면 언제든 중단할 수 있습니다.$$
where slug = 'post_survey_2026';

-- 검증
select slug, length(consent_text) as consent_len
  from public.surveys
  order by slug;

-- 기대: pre_survey_2026 / post_survey_2026 각 consent_len > 0

commit;
