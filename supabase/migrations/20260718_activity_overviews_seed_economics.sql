-- 20260718_activity_overviews_seed_economics.sql
-- 활동 개요 시드 — 경제수학 미니활동(누적). activity_overviews(slug PK) 에 upsert. 재실행 멱등.
-- 관리자가 /admin/overviews 에서 사후 수정 가능.
--
-- 적용:  Supabase SQL 에디터에서 실행(라이브 실행은 사용자가 직접).
-- 검증:  select count(*) from activity_overviews where slug like 'economics/mini/%';

insert into public.activity_overviews (slug, overview, updated_at) values
  ($s$economics/mini/stock_index_lab$s$, $ov$코스피·코스닥·코스피200·나스닥 등 주요 주가지수의 10년 실측 시계열을 연·월·일 주기와 '100 기준' 상대변화로 비교하고, 각 지수에 어떤 종목이 시가총액 순으로 담겨 있는지 트리맵으로 살펴본 뒤, 코스피 시가총액 상위 15종목으로 만든 미니 지수에서 특정 기업의 주가를 직접 올리고 내리며 지수가 시가총액 가중 방식으로 어떻게 움직이는지 시뮬레이션하는 활동. 주가와 시가총액의 차이, 스케일이 다른 지수를 100 기준으로 공정하게 비교하는 방법, 그리고 시가총액이 큰 기업일수록 같은 주가 변동이 지수에 더 큰 영향을 준다는 점을 체험한다.$ov$, now())
on conflict (slug) do update set overview = excluded.overview, updated_at = now();
