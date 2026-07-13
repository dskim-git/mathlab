-- 20260713_activity_overviews_seed_common2.sql
-- 활동 개요 시드 — 공통수학2 미니활동(누적). activity_overviews(slug PK) 에 upsert. 재실행 멱등.
-- 관리자가 /admin/overviews 에서 사후 수정 가능.
--
-- 적용:  Supabase SQL 에디터에서 실행(라이브 실행은 사용자가 직접).
-- 검증:  select count(*) from activity_overviews where slug like 'common2/mini/%';

insert into public.activity_overviews (slug, overview, updated_at) values
  ($s$common2/mini/two_point_distance$s$, $ov$수직선과 좌표평면에서 두 점을 직접 끌어 움직이며 두 점 사이의 거리가 계산되는 과정을 관찰하는 활동. 1차원에서는 좌표의 차의 절댓값으로, 2차원에서는 가로·세로 차이를 두 변으로 하는 직각삼각형과 피타고라스 정리로 거리 공식이 유도됨을 시각적으로 탐구한다. 마지막 탭에서는 좌표평면 위 마을 지도에서 두 장소 사이의 거리를 가로 차이·세로 차이·거리의 제곱을 단계별로 구해 해결하는 배달 게임을 한다.$ov$, now())
on conflict (slug) do update set overview = excluded.overview, updated_at = now();
