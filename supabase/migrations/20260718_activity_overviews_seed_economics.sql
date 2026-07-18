-- 20260718_activity_overviews_seed_economics.sql
-- 활동 개요 시드 — 경제수학 미니활동(누적). activity_overviews(slug PK) 에 upsert. 재실행 멱등.
-- 관리자가 /admin/overviews 에서 사후 수정 가능.
--
-- 적용:  Supabase SQL 에디터에서 실행(라이브 실행은 사용자가 직접).
-- 검증:  select count(*) from activity_overviews where slug like 'economics/mini/%';

insert into public.activity_overviews (slug, overview, updated_at) values
  ($s$economics/mini/stock_index_lab$s$, $ov$코스피·코스닥·코스피200·나스닥 등 주요 주가지수의 10년 실측 시계열을 연·월·일 주기와 '100 기준' 상대변화로 비교하고, 각 지수에 어떤 종목이 시가총액 순으로 담겨 있는지 트리맵으로 살펴본 뒤, 코스피 시가총액 상위 15종목으로 만든 미니 지수에서 특정 기업의 주가를 직접 올리고 내리며 지수가 시가총액 가중 방식으로 어떻게 움직이는지 시뮬레이션하는 활동. 주가와 시가총액의 차이, 스케일이 다른 지수를 100 기준으로 공정하게 비교하는 방법, 그리고 시가총액이 큰 기업일수록 같은 주가 변동이 지수에 더 큰 영향을 준다는 점을 체험한다.$ov$, now()),
  ($s$economics/mini/gdp_growth_lab$s$, $ov$World Bank(세계개발지표) 공식 데이터로 한국의 명목·실질 GDP, GNI, 경제성장률, GDP 디플레이터, 소비자물가지수의 30년(1995~2024) 흐름을 규모·성장·물가 세 관점으로 비교하고, 214개국의 GDP·1인당 GDP·성장률·1인당 GNI를 연도별 세계지도 음영과 정렬 표로 탐색하며 특정 국가를 골라 그 나라의 시계열 추이까지 살펴본 뒤, 명목·실질 GDP와 GDP 디플레이터를 직접 계산해 보고 GDP·GNP·GNI 판정 퀴즈로 개념 차이를 확인하는 활동. 명목과 실질의 구분, 물가지표(디플레이터·CPI)의 의미, 경제 규모(총액)와 국민 생활수준(1인당)의 차이, 그리고 생산의 '장소(GDP)'와 '국적·소득(GNP·GNI)' 기준의 차이를 공식 데이터로 체험한다.$ov$, now())
on conflict (slug) do update set overview = excluded.overview, updated_at = now();
