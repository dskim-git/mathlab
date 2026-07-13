-- 20260713_activity_overviews_seed_common2.sql
-- 활동 개요 시드 — 공통수학2 미니활동(누적). activity_overviews(slug PK) 에 upsert. 재실행 멱등.
-- 관리자가 /admin/overviews 에서 사후 수정 가능.
--
-- 적용:  Supabase SQL 에디터에서 실행(라이브 실행은 사용자가 직접).
-- 검증:  select count(*) from activity_overviews where slug like 'common2/mini/%';

insert into public.activity_overviews (slug, overview, updated_at) values
  ($s$common2/mini/two_point_distance$s$, $ov$수직선과 좌표평면에서 두 점을 직접 끌어 움직이며 두 점 사이의 거리가 계산되는 과정을 관찰하는 활동. 1차원에서는 좌표의 차의 절댓값으로, 2차원에서는 가로·세로 차이를 두 변으로 하는 직각삼각형과 피타고라스 정리로 거리 공식이 유도됨을 시각적으로 탐구한다. 마지막 탭에서는 좌표평면 위 마을 지도에서 두 장소 사이의 거리를 가로 차이·세로 차이·거리의 제곱을 단계별로 구해 해결하는 배달 게임을 한다.$ov$, now()),
  ($s$common2/mini/internal_division_lab$s$, $ov$수직선 위의 두 점을 끌고 비 m:n 을 슬라이더로 바꾸며 선분 AB를 m:n 으로 내분하는 점 P의 좌표가 (m·x2 + n·x1)/(m+n) 로 정해지는 과정을 시각적으로 탐구하는 활동. 두 번째 탭에서는 내분의 개념을 황금비에 연결해, 막대를 눈대중으로 나눠 황금분할점(약 0.618 지점)을 맞히는 챌린지와, 내분비 m:n 을 피보나치 수로 잡을수록 황금비 φ 에 수렴함을 확인하는 활동을 한다.$ov$, now()),
  ($s$common2/mini/centroid_lab$s$, $ov$삼각형의 무게중심 성질을 내분과 연결해 네 개의 탭에서 조작·시뮬레이션하는 활동. 무게중심이 각 중선을 꼭짓점에서부터 2:1로 내분함을 꼭짓점을 끌며 확인하고(G=(2M+A)/3), 삼각형 내부 점 P에 대해 AP제곱+BP제곱+CP제곱 의 값을 히트맵으로 시각화해 무게중심에서 최소가 됨을 탐색하며, 세 변의 중점으로 만든 중점삼각형(예: A(1,0),B(5,2),C(3,4))의 무게중심이 원래 무게중심과 일치함을 좌표로 확인한다. 마지막 탭에서는 각 변을 같은 비 s로 내분한 삼각형의 무게중심도 원래 삼각형과 항상 일치함을 슬라이더로 일반화해 확인한다.$ov$, now()),
  ($s$common2/mini/block_stacking_lab$s$, $ov$같은 블록 n개를 책상 밖으로 무너지지 않게 최대한 밀 때 빠져나온 길이 L_n=(l/2)(1+1/2+...+1/n)이 됨을 탐구하는 활동. 슬라이더로 블록 개수를 조절해 최적으로 밀린 계단 모양과 L_n을 시뮬레이션하고(맨 위 블록이 책상 밖으로 완전히 나가는 순간 확인), n에 따른 L_n 그래프로 조화급수의 느리지만 무한한(발산) 증가와 원하는 거리에 도달하는 데 필요한 블록 수의 폭발적 증가를 관찰하며, 무게중심이 두 블록의 무게중심을 잇는 선분을 내분한다는 지렛대 원리와 연결하고 퀴즈로 확인한다.$ov$, now())
on conflict (slug) do update set overview = excluded.overview, updated_at = now();
