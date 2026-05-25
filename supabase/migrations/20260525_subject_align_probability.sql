-- 20260525_subject_align_probability.sql
-- 과목 정합 1단계: probability-simulator 활동과 그 응답의 subject를 과목 마스터 표기로 통일.
--
-- 현재: activities.subject='probability'(영문), activity_responses.subject='probability'(5건),
--       과목 마스터 subjects.name='확률과 통계'(공백 포함), teacher_permissions.subject도 마스터에서 복사됨.
-- 목표: 활동/응답의 subject를 마스터 값(subjects.name)으로 "바이트 그대로" 맞춰
--       teacher_permissions.subject 와 글자까지 일치 → 엄격 매칭(2단계)이 통하게 한다.
--
-- 안전장치: 리터럴을 직접 쓰지 않고 subjects 행에서 값을 복사한다(= s.name).
--   s.name='확률과 통계' 필터가 마스터 행을 찾으며, 혹시 글자가 안 맞으면 0건 갱신으로 드러난다(fail-closed).

update public.activities a
  set subject = s.name
  from public.subjects s
  where a.subject = 'probability'
    and s.name = '확률과 통계';

update public.activity_responses ar
  set subject = s.name
  from public.subjects s
  where ar.subject = 'probability'
    and s.name = '확률과 통계';

-- ── 검증용 (실행해 결과 확인) ─────────────────────────────────
-- select subject, count(*) from public.activity_responses group by subject;   -- 기대: '확률과 통계' 5
-- select slug, subject from public.activities where slug='probability-simulator'; -- 기대: '확률과 통계'
-- -- 활동/응답 subject가 교사 권한 subject와 정확히 일치하는지:
-- select exists(select 1 from teacher_permissions tp join activity_responses ar on ar.subject=tp.subject) as matches;

-- ── ROLLBACK (되돌리기) ───────────────────────────────────────
-- update public.activities set subject='probability' where slug='probability-simulator';
-- update public.activity_responses set subject='probability' where activity_slug='probability-simulator';
