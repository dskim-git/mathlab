-- 20260602_add_axb_number_line_lab_block.sql
-- 확률과통계 3-1-2 소단원에 신규 미니활동 'aX+b 수직선 변환 실험실' 블록을 삽입.
--
-- 배경: probability_new/lessons/_units.py 에 새로 추가된 활동을 React 앱에 이식했으나
--       curriculum_units.content_blocks 에는 아직 블록이 없어 학습 페이지에서 노출되지 않음.
--
-- 위치: 3-1-2 (이산확률변수의 기댓값과 표준편차) 의 인덱스 3 자리
--       (직전 블록 = '이산확률변수 aX+b의 평균과 표준편차' canva,
--        직후 블록 = '미니: 기댓값·분산·표준편차 탐험' rv_mean_var_lab)
--
-- jsonb_insert(target, path, new_value) 는 path 가 가리키는 인덱스 위치에 새 요소를 삽입하고
-- 그 뒤 요소들을 한 칸씩 뒤로 민다.
-- subject + unit_key 로 행을 찾는다 (UUID id 변경 가능성 회피).
--
-- 라이브는 SQL 에디터(service_role) 로 적용.

update public.curriculum_units
set content_blocks = jsonb_insert(
  content_blocks,
  '{3}',
  '{
    "id": "3-1-2-axb",
    "title": "미니: aX+b 수직선 변환 실험실",
    "type": "interactive_activity",
    "content": {
      "activitySlug": "probability_new/mini/axb_number_line_lab",
      "reflectionType": "simple"
    }
  }'::jsonb
)
where subject = '확률과통계'
  and unit_key = '3-1-2'
  -- 이미 들어있으면 두 번 넣지 않음 (멱등성)
  and not exists (
    select 1
    from jsonb_array_elements(content_blocks) as elem
    where elem->'content'->>'activitySlug' = 'probability_new/mini/axb_number_line_lab'
  );

-- ── 검증 ──
-- 단원의 모든 블록과 그 위치 확인:
-- select ordinality - 1 as idx,
--        elem->>'id' as id,
--        elem->>'title' as title,
--        elem->'content'->>'activitySlug' as slug
-- from public.curriculum_units,
--      jsonb_array_elements(content_blocks) with ordinality elem
-- where subject = '확률과통계' and unit_key = '3-1-2'
-- order by idx;

-- ── ROLLBACK ──
-- update public.curriculum_units
-- set content_blocks = (
--   select jsonb_agg(elem)
--   from jsonb_array_elements(content_blocks) as elem
--   where elem->'content'->>'activitySlug' is distinct from 'probability_new/mini/axb_number_line_lab'
-- )
-- where subject = '확률과통계' and unit_key = '3-1-2';
