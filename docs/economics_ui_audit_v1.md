# 경제수학 미니활동 화면 표현 전수조사 v1

- 조사일: 2026-11-04 · 대상: `components/activities/economics/` 54개 활동 · **조사만 함(코드 수정 없음)**
- 근거 줄은 활동 폴더 안 파일 기준 `파일명:줄`. 화면을 직접 보지 못했으므로 코드로 계산한 값이고, 추정이 섞인 곳은 **(추측)** 으로 표시.
- 이미 고친 곳은 제외: matrix-use-lab ②③ · marginal-lab ① · limit-lab ①(ZoomScope) · derivative-lab ②(TanTab) 및 이 세 활동의 공용 Plot.

---

## 0. 먼저 알아 둘 것 — SVG 글자는 "fontSize × 배율"로 보인다

같은 `fontSize 8` 이라도 viewBox 가 얼마나 늘어나 그려지느냐에 따라 화면 크기가 다르다.
페이지 폭 `max-w-6xl`(`app/learn/page.tsx:69`) 에서 활동 카드 안쪽을 약 1050px 로 잡고 계산했다 **(추측: 패딩·스크롤바에 따라 ±10%)**.

| 단원 | 그래프 배치 | 배율 | `fontSize 8~9` 의 실제 크기 | 판정 |
|---|---|---|---|---|
| 1단원 (지표·환율·세금·이자·연금) | 대부분 카드 전체 폭(또는 `max-w-[80%]`) · viewBox 320~560 | ×1.9~3 | 약 16~22px | **SVG 글자 크기는 문제 아님.** 오히려 그래프가 지나치게 크고 눈금이 3개뿐이라 성김. 예외: 현재가치 ②(2열), 지도 툴팁 |
| 2단원 (수요·공급·균형·부등식) | `lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]` 반 칸(약 520px) · viewBox 380~430 | ×1.2~1.4 | 약 11~12px | 크기는 기준(11)과 비슷. **문제는 흐린 색 `#64748b`**. 8.5 두 곳만 작음 |
| 3·4단원 (행렬·미분·탄력성·최적화) | `lg:grid-cols-[minmax(0,340px)_…]` 340px 고정 칸 · viewBox 320 | ×1.06 | **약 8.5px** (compact 7 을 4열에 두면 **약 5px**) | **실제로 작다.** 고친 limit-lab Plot(11/10/#94a3b8)과 같은 조건 |

반면 HTML 글자(`text-[9px]`·`[10px]`·`[11px]`)는 배율 없이 그대로 보인다. 그래서 1·2단원의 A 문제는 거의 다 **HTML 작은 글자** 쪽이다.

---

## 1. 추천 순서 (우선순위 '상' 중심, 효과 대비 작업이 작은 순)

| 순서 | 대상 | 무엇을 | 크기 |
|---|---|---|---|
| 1 | **4단원 후반 Plot 복제본 6개** (extremum · shape · elasticity · supply-elasticity · elasticity-graph · optimization) | 눈금 8(compact 7)→11, 축 이름→10, `#64748b`/`#475569`→`#94a3b8`. limit-lab Plot 을 본으로 (§2-P1) | 소×6 |
| 2 | **shape-lab ①** 보기 그래프 4장 | `lg:grid-cols-4` + compact(약 5px)인데 "눈금 숫자를 보고 견줘 보세요"(`ShapeLab.tsx:837`)가 풀이 근거 → 2열로 + 글자 키움 | 소 |
| 3 | **inverse-matrix-lab ③** 행렬 암호 글자표 | 암호를 풀 숫자 코드가 `text-[8px] text-slate-500`(`InverseMatrixLab.tsx:895,1095`) | 소 |
| 4 | **marginal-lab ④** 한계수입 직사각형 그림 | `RevenueRect` 눈금·축 이름 8, `#475569`(`MarginalLab.tsx:1378-1387`), `max-w-[320px]` | 소 |
| 5 | **3단원 좌표평면 2개** (linear-system Plane, matrix-use ① MarketPlane) | 9 / `#64748b`, `max-w-[330px]`, 네 탭·①탭의 주인공 (§2-P2) | 소×2 |
| 6 | **matrix-lab ④⑤ + row-sum-mean ②** 스프레드시트·DataTable | 시트 칸 `text-[11px]`·머리 `text-[10px]`(`MatrixLab.tsx:1366-1432`), DataTable `text-xs`·모서리 9px·w-full 아님 (§2-P7) | 소 |
| 7 | **present-value-lab ②** 기간별 그래프 | 두 그래프 `lg:grid-cols-2`(`PresentValueLab.tsx:383`) → fontSize 6 이 약 9px. 한 줄 배치 + 글자 키움 | 소 |
| 8 | **tax-explorer-lab ②③** 표 | ② 공급함수 보기가 `text-[10px]` 안의 KaTeX(`TaxExplorerLab.tsx:542`), ③ 규칙의 핵심 행(Δ가격·Δ거래량)만 `text-[11px]`(`:728-749`) | 소 |
| 9 | **installment-savings-lab ①** 회차 쌓기 재생 | 기본 n=24 에서 줄이 5개만 보여 재생 중 약 5초간 화면이 멈춘 듯함(`InstallmentSavingsLab.tsx:74,222-226`) → 회차 동전이 부풀며 쌓이는 연출 | 중 |
| 10 | **곡선·직선 "순간 이동" 묶음** | 정답·버튼 시 값이 툭 바뀜 → rAF 글라이드 + 옛 균형점 잔상 + E₀→E₁ 화살표 (§2-P8). 1순위는 equilibrium-price ② · market-adjust ② | 중 |
| 11 | **utility-function-lab ②** 한계효용 | "한 개 더!" 때 막대 투명도만 켜짐 → MU 조각이 U 막대 위로 쌓이며 점점 작아지는 연출 + BarChart 8.5 | 중 |
| 12 | **employment-lab ④** 합이 100%일까 | 실업자 칸이 약 10단위라 안 보이고 이름표도 숨김(`EmploymentLab.tsx:415` `wUnemp > 24`) → ZoomScope 식 확대창 | 중 |
| 13 | **continuous-compound-lab ①** 주기 쪼개기 | 850ms마다 한 칸씩 점프(`ContinuousCompoundLab.tsx:164-168`) → m 연속 증가 + e 에 다가가는 확대 (극한 개념 그 자체) | 중 |
| 14 | **vat-lab ①** 부가가치 사슬 | `w-56` 카드 본문 10~12px, 검산식 `text-[10px]`(`VatLab.tsx:196-260`) + 세금 토큰이 단계마다 흘러가 쌓이는 연출 | 중~대 |

---

## 2. 공용으로 한 번에 정할 수 있는 패턴

활동마다 공용 UI 를 복제하는 관례라 **실제 수정은 파일마다** 해야 한다. 아래 "크기"는 파일 수를 감안한 전체 추정.

| # | 패턴 | 파일:줄 | 바꿀 값 | 전체 크기 |
|---|---|---|---|---|
| P1 | **4단원 Plot 복제 6개** (PS=320, 340px 칸) | `ExtremumLab.tsx:246,295-309` (`fs = compact ? 7 : 8`) · `ShapeLab.tsx:232,270-286` · `ElasticityLab.tsx:241-255` · `SupplyElasticityLab.tsx:247-261` · `ElasticityGraphLab.tsx:243-257` · `OptimizationLab.tsx:252-266` | 눈금 11, 축 이름 10, `#94a3b8`, compact 는 10 이상. 점 이름표 compact 9~10 → 11 | 소~중 (6파일, 거의 같은 치환. compact 를 4열·2×2 에 쓰는 자리는 격자도 손봐야 함) |
| P1' | 4단원 Plot 주변 SVG 소품 | EGauge `ElasticityLab.tsx:635-647`, `SupplyElasticityLab.tsx:638-650` (9) · ChangeBars `ElasticityLab.tsx:679,682` / `SupplyElasticityLab.tsx:682,685` (8, `max-w-[320px]`) · SignBar `ExtremumLab.tsx:1539` (8) · Gauge/CabView `ExtremumLab.tsx:957-969,1062,1091` (8~9) · SignStrip `OptimizationLab.tsx:778-786` (9) · SlopeBars 결론 문장 `ElasticityGraphLab.tsx:662` (10, `#64748b`) | P1 과 같은 기준 | 소 |
| P1'' | `w-4/5` 로 2열 그래프를 한 번 더 줄임 | `ExtremumLab.tsx:1660,1677` · `ElasticityLab.tsx:1266,1285` · `ElasticityGraphLab.tsx:1151,1167,1294,1307` | `w-full` | 소 |
| P2 | **3단원 좌표평면** | `LinearSystemLab.tsx:198,218,225` (축 이름 없음) · `MatrixUseLab.tsx:602,616-628` | P1 과 같음. `max-w-[330px]` 유지 시 글자만, 아니면 폭도 | 소 |
| P3 | **2단원 SVG 차트 복제 약 20개** (눈금 `fontSize 9 fontFamily monospace fill #64748b`) | ProductionFunction `:913,921`(+3D `:422-449`) · CostFunction ChartFrame `:419,427`(그래프 6개 공용) · DemandSupply `:208,216,584-594` · DemandForecast `:277,286,625,633,684,694` · UtilityFunction `:263,271,783,791` · OrdinalCardinal `:472` · EquilibriumPrice `:209,217` · MarketAdjust `:201-222` · EquilibriumChange `:249,257` · Inflation `:205,213,860,866,1167,1175` · TaxExplorer `:209,217` · Plane 4개: Region `:290,297` / SystemRegion `:239,244` / LinearProgramming `:229,234` / PolygonRegion `:255,260` | 실제 크기 약 11~12px 라 **색만 `#94a3b8`** 로, 원하면 10~11 로. **8.5 인 두 곳**(UtilityFunction BarChart `:622-657`, MarketAdjust PriceTimeline `:759-785`)은 10~11 + 높이 키움 | 소~중 (15파일, 단순 치환) |
| P3' | Plane 이름표 x 클램프 계수 | `SystemRegionLab.tsx:255` · `LinearProgrammingLab.tsx:245` · `PolygonRegionLab.tsx:271` (`label.length*5.5`) | 글자를 키우면 계수도 같이 올리고 node 로 좌표 전수 검사 (§5.7) | 소 |
| P4 | 1-1 라인차트 복제 4개 (viewBox 560, 눈금 `text-[9px]`, 단위 `fill-slate-500`) | `GdpGrowthLab.tsx:211,220,225` · `EmploymentLab.tsx:144-148` · `ExchangeRateLab.tsx:293-298` · `StockIndexLab.tsx:374-389` | 실제 약 17px 라 크기는 괜찮음. 단위 줄 색만 slate-400 | 소 (하) |
| P5 | 1-2 선그래프 복제 5개 (viewBox 320~340, 눈금 3개, fontSize 6~7, `fill-slate-500`, 높이 약 500px까지 커짐) | `SimpleInterestLab.tsx:257` · `CompoundInterestLab.tsx:118` · `ContinuousCompoundLab.tsx:356` · `InstallmentSavingsLab.tsx:370` · `PresentValueLab.tsx:345` | 한 규격으로 통일: viewBox 약 640×300, 눈금 5~6개, 11/10/12~13 bold, `max-w` 지정 → 2열에 넣어도 같은 크기 | 중 (5파일, 좌표 재배치) |
| P6 | **단계 문제 탭 복제** (주어진 값 라벨·힌트·정답 해설 `text-[11px]`, 번호 `text-[9px]`) | 2단원 ProblemTab 8개(예 `DemandSupplyLab.tsx:871,987-1004`) · StepList `TaxExplorerLab.tsx:934-949` / `InflationLab.tsx:1423-1438` / `LinearProgrammingLab.tsx:1286-1301` / `EquilibriumChangeLab.tsx:1075-1092` · 1-2단원 `SimpleInterestLab.tsx:441,528,531` / `ContinuousCompoundLab.tsx:567,622,625` / `InstallmentSavingsLab.tsx:494,584` / `PresentValueLab.tsx:582,664` / `PensionLab.tsx:530,602` | 해설·힌트는 읽어야 하는 글이라 text-sm, 라벨 text-xs | 소~중 (약 20파일) |
| P7 | **표 규격이 기준보다 두 단계 작음** (`table text-xs` · `th text-[10px] px-2 py-1.5`) | 2단원: ProductionFunction `:607-826` · DemandSupply `:402-421` · DemandForecast `:415,767-792` · UtilityFunction `:334-882`(머리 8곳) · OrdinalCardinal `:513,524` · EquilibriumPrice `:476-515` · LinearProgramming CornerTable `:285-315` · PolygonRegion ValueTable `:653-691` · 3단원 DataTable `MatrixLab.tsx:1674-1730` = `RowSumMeanLab.tsx:786-836` · 4단원 수렴표 `ElasticityLab.tsx:976-991` = `SupplyElasticityLab.tsx:1178-1193` · 1-2단원 compound/simple/continuous/installment/interest-rate 표 | matrix-use-lab ②③ 기준: `w-full`, 머리 text-sm, 숫자 text-base~xl, `px-4 py-3` | 중 (약 15파일) |
| P8 | **"툭" 바뀌는 이동 → 글라이드** | 정답 시 곡선 순간 이동: `EquilibriumPriceLab.tsx:690-692` · `EquilibriumChangeLab.tsx:665` · 프리셋: `InflationLab.tsx:319-322` · "최대로 밀기": `SystemRegionLab.tsx:653,660` · `LinearProgrammingLab.tsx:718` · 하루 지나기: `MarketAdjustLab.tsx:550` | rAF + easeInOut 0.8~1.2초, 옛 위치 잔상. 이미 같은 보간을 쓰는 코드가 있음: `DemandSupplyLab.tsx:483` · `DemandForecastLab.tsx:532` · `EquilibriumPriceLab.tsx:308` (setInterval 방식 → TanTab 처럼 rAF 로 바꿔도 됨) | 중 (6파일) |
| P9 | "순간변화율 vs 실제 1단위 변화" 비교 카드 `text-[10px] text-slate-500` | `DerivativeLab.tsx:1652-1662` · `MarginalLab.tsx:1024-1028,1224-1228` | 그 탭의 결론이라 text-xs~sm, slate-300 | 소 |
| P10 | 카드 부제·주석·캡션 `text-[10px]~[11px] text-slate-500` (분모 정의·계산식처럼 꼭 읽을 내용인 곳만) | `EmploymentLab.tsx:482` · `GdpGrowthLab.tsx:807` · `BigMacLab.tsx:163` · `ExchangeSmartLab.tsx:178,421` · `InverseMatrixLab.tsx:637-639` · `MatrixUseLab.tsx:833,1386` · `LimitLab.tsx:1232,1382` · `DerivativeLab.tsx:793` 등 | text-xs + slate-400 이상 | 소 (흩어져 있음) |

---

## 3. 활동별 결과 (54개)

열: 단원 / 제목(`SHORT_ACTIVITY_TITLE`) / 슬러그(`economics/mini/` 생략) / 탭 / A 가독성(근거) / B 연출 아이디어 / 우선순위 / 크기

### 1단원 — 1-1-1 경제지표 · 1-1-2 환율

| 단원 | 제목 | 슬러그 | 탭 | A 가독성 | B 연출 | 우선 | 크기 |
|---|---|---|---|---|---|---|---|
| 1-1-1 | 주가지수 탐험 | stock_index_lab | ①지수 흐름 비교 ②지수 속 종목들 ③코스피 조작 | ② 트리맵 중소형 셀 이름 10·비중 9 `fill-slate-900/80`(`StockIndexLab.tsx:639-651`), 상위5 표 머리 text-xs(`:664-682`) · ③ 핵심 식 `text-[11px]`(`:736`), 안내 slate-500(`:742,792`) | ③ 종목별 기여도를 지수 게이지 위에 쌓은 막대로 실시간 표시 + "삼성전자 +10% vs 현대모비스 +10%" 실험 기록 A/B 칸 나란히(`:809`) | 중 | 중 |
| 1-1-1 | GDP와 경제성장률 | gdp_growth_lab | ①한국 지표 흐름 ②세계 비교 ③명목·실질 계산 ④GDP·GNP·GNI 퀴즈 | ③ 핵심 해설 캡션·계산식 `text-[11px]`(`GdpGrowthLab.tsx:733,747`), StatCard 부제 `text-[11px] slate-500`(`:807`) · ② 범례 `text-[10px] slate-500`(`:636`) · ④ 비교표 text-xs(`:976`) | ③ 명목 막대를 '실질분 + 물가 효과', 실질 막대를 '기준분 + 생산량 효과'로 쪼개 쌓고, 프리셋 전환 시 높이 보간 | 중 | 중 |
| 1-1-1 | 퍼센트와 퍼센트포인트 | percentage_point_lab | ①기사 속 %p ②30초 스피드 퀴즈 | ① 이전 막대 색 `#64748b`(`PercentagePointLab.tsx:282`) · ② 오답 해설이 `text-xs h-8` 고정(`:505-507`) — 길면 넘침(추측) | ① 막대 기준이 max(전,후)라(`:243-244`) 2.5→2.75% 가 거의 같아 보임 → 0~100% 고정 눈금에 늘어난 구간만 색칠 + "+3%p" 괄호, 옆에 "상대 +n%" 복제 막대 | 중 | 소~중 |
| 1-1-1 | 고용률과 실업률 | employment_lab | ①한국 고용지표 ②물가와의 관계 ③세계 비교 ④합이 100%일까? | ④ RateCard 부제(분모 정의) `text-[10px] slate-500`(`EmploymentLab.tsx:482`), 분모 설명 10(`:421,423`) · ③ 범례 `text-[10px] slate-500`(`:331`) | ④ 실업자 칸이 초기값 80/4610 이라 약 10단위로 안 보이고 이름표 숨김(`:415`) → **ZoomScope 식 확대창** + 분모 괄호가 늘었다 줄었다 · ② 물가–실업률 산점도에 연도 궤적 ▶ 재생(필립스곡선) | **상** | 중 |
| 1-1-2 | 환율 변환과 추이 | exchange_rate_lab | ①환율 변환기 ②환율 시계열 | ① 통화명 `text-[10px] slate-500`(`ExchangeRateLab.tsx:181`) · ② 그래프 글자는 실제 약 17px 로 괜찮음 | ② 선이 왼→오로 그려지는 ▶ 재생 (효과 작음) | 하 | 소 |
| 1-1-2 | 환율 변동과 손익 | exchange_impact_lab | ①손익 시뮬레이터 ②환율과 우리 삶 ③카드 퀴즈 | ① 미니차트 8(`ExchangeImpactLab.tsx:195,201`)은 viewBox 520 전체 폭이라 약 16px — 크기는 괜찮음, x축 연도 눈금 없음 · 최저/현재/최고 `text-[10px] slate-500`(`:212`) · ② 이전 금액 slate-500(`:293`) | ① 시나리오 카드 5장이 숫자·색만 바뀜 → 수출(유리)↔수입·여행(불리) **시소**, 또는 카드마다 '현재 vs 슬라이더' 유령 막대 · ② 상승/하락 토글을 보간 카운트로 | 중 | 중 |
| 1-1-2 | 빅맥지수와 물가 | bigmac_index_lab | ①빅맥지수와 환율 ②다른 물건 지수 ③공식 물가지표 비교 | ① 랭킹 막대 `h-3`, 나라 이름 `text-xs w-20 truncate`(`BigMacLab.tsx:113-121`), 미국 기준선 폭 0.6(`:117`), 설명·계산식 `text-[10px] slate-500`(`:126,163`) · ② 비교표 머리 text-xs(`:238-270`) | ① 미국=0 기준 **좌우 편차 막대**(고평가 오른쪽·저평가 왼쪽) · 내재환율 vs 실제환율을 한 수직선의 두 핀으로, 나라 바꿀 때 핀이 미끄러짐 | 중 | 중 |
| 1-1-2 | 현명하게 환전하기 | exchange_smart_lab | ①환전소 체험 ②수지의 여행 환전 | ② RateTable `text-xs px-2 py-1`, 단위 설명 `text-[9px] slate-500`(`ExchangeSmartLab.tsx:401-421`), 경로 계산식 `text-[11px]`(`:284,290`) · ① 환율판 머리 text-xs(`:153-171`) | ② 경로 A/B 를 지폐 더미가 수수료 관문을 지날 때마다 깎이는 흐름도로 · ① 살 때/팔 때/기준율을 한 수직선 세 점 + 스프레드 색칠 · **(규칙)** 활동 안 자체 계산기(`:369,427-497`, 문구 `:322`) — §5.6 위반 | 중 | 중 |

### 1단원 — 1-1-3 세금

| 단원 | 제목 | 슬러그 | 탭 | A 가독성 | B 연출 | 우선 | 크기 |
|---|---|---|---|---|---|---|---|
| 1-1-3 | 세금의 종류 | tax_lab | ①세금 카드 뒤집기 ②하루 소비 시뮬레이터 ③분류 게임 | ① 앞면 안내 `text-[11px] slate-500`(`TaxLab.tsx:193`) · ② 영수증 ※ 주석 `text-[11px] slate-500`(`:289`) | ① 앞뒤가 순간 교체(`:179`) → rotateY 3D 뒤집기 · ② 합계 카운트업 + 국세/지방세 막대 폭 전환(`:312`) | 하 | 소 |
| 1-1-3 | 세계의 세율과 복지 | tax_rates_lab | ①세율 vs 복지 ②세율 vs 세금 총액 | 산점도는 `max-w-[80%]` 라 실제 약 20px — 크기는 괜찮으나 눈금이 최솟값·최댓값 2개뿐, 격자 없음(`TaxRatesLab.tsx:306-312`) · **지도 툴팁** `text-[8px]` + viewBox 720 을 80% 로(`:175,177,191`) → 약 9px · 순위 "⋯" slate-600(`:368`) | 축 지표를 바꾸면 점이 순간이동 → `cx/cy` 전환으로 나라들이 새 자리로 미끄러짐 + r 에 맞춘 추세선 · **(규칙)** RankingList 안 `const Row`(`:348`) — §5.8 위반 | 중 | 중 |
| 1-1-3 | 소득세 계산 | income_tax_lab | ①과세표준 만들기 ②소득세 계산 ③세금으로 소득 추정 ④직업별 소득세 | ② 그래프 라벨 `text-[9px]`(`IncomeTaxLab.tsx:273-276`, 실제 약 20px 추정) — 크기보다 **구간 경계선에 세율·경계값 라벨이 없음**(`:268`) · ④ 막대 행 연봉·세액 text-xs(`:419,424`) | ③ 그래프가 없음 → ②의 그래프를 다시 써서 세금값에서 수평선→곡선→수직선으로 내려가는 역함수 화살표 rAF · ② 구간별 기울기(6%·15%·24%…) 라벨 + 현재 구간 강조 | 중 | 중 |
| 1-1-3 | 법인세 계산 | corporate_tax_lab | ①법인세 계산 시뮬레이션 ②실제 기업 5개년 | 그래프 `text-[8px]`·`[9px]`(`CorporateTaxLab.tsx:210-212,317-322`)는 `max-w-[80%]` 라 실제 약 18~21px — 크기는 괜찮음 · ② 툴팁 `text-[8px]`(`:353-354`), 음수=환입 안내 `text-xs slate-500`(`:361`) · ① 구간 경계 점선에 세율 라벨 없음(`:205`) | ② 기업을 켜고 끌 때 y축 자동 맞춤으로 그래프가 튐 → ymax rAF 보간으로 "규모 차이"가 늘어나며 보이게 · ① 점이 구간 경계를 넘을 때 해당 구간 강조 | 중 | 중 |
| 1-1-3 | 부가가치세 계산 | vat_lab | ①부가가치 사슬 ②내 영수증 속 부가세 ③카드 퀴즈 | ① `w-56` 고정 카드라 본문 전부 작음: 설명·판매가 `text-[11px]`, 계산표 `text-[12px]`, **검산식 `text-[10px] leading-3`**, 소비자 카드 `text-[11px]`(`VatLab.tsx:196-260`) · ② 가격·이유·GuessBtn `text-[11px]`(`:429,471,567`) | ① "▶ n단계 계산하기"(`:270`)가 카드만 엶 → 세금 토큰이 단계를 따라 흘러 '세무서' 통에 쌓이고, 마지막에 통 높이 = 소비자 부가세 막대 · **(규칙)** Legend 인라인 style(`:576`) | **상** | 중~대 |
| 1-1-3 | 개별소비세 계산 | excise_tax_lab | ①품목별 계산기 ②자동차 개소세 인하 체감 | ② 비교 막대 `h-3`, 라벨 text-xs(`ExciseTaxLab.tsx:267-272`) — 그 밖 이상 없음 | ② 개소세·교육세·부가세 **세로 누적 막대**를 인하 전/후 나란히 → "개소세를 내리면 교육세·부가세가 함께 줄어든다" 연쇄 · ① 기준가격 초과분만 색칠한 가격 막대(지금 식 텍스트뿐 `:157-160`) | 중 | 중 |
| 1-1-3 | 관세와 FTA | customs_lab | ①나라·품목별 관세율 ②해외직구 계산기 ③FTA 지도 | ② **CalcStep 계산식 `text-[11px]`**(`CustomsLab.tsx:437-438`) — 결과(text-lg)보다 훨씬 작음 · ① 막대 행 text-xs·truncate(`:164-203`), 설명 `text-[11px]`(`:208,214,237`) · ③ 협정 목록 `text-[11px]`(`:616,618`), 지도 툴팁 8(viewBox 720 전체 폭 → 약 12px) | ③ **연도 슬라이더 + ▶ 재생**: 2004 칠레부터 나라가 차례로 칠해지고 체결국 카운터가 올라감 (ERAS·firstYear 데이터 이미 있음) · ② 149→151달러에서 관세·부가세 조각이 생기는 순간 막대 전환 · **(규칙)** Legend 인라인 style(`:462`) | 중 | 중~대 |

### 1단원 — 1-2 이자 · 현재가치 · 연금

| 단원 | 제목 | 슬러그 | 탭 | A 가독성 | B 연출 | 우선 | 크기 |
|---|---|---|---|---|---|---|---|
| 1-2-1 | 여러 가지 이율 | interest_rate_lab | ①이율 변환기 ②우리 주변의 이율 | ① 변환표 숫자 text-xs·셀 px 없음(`InterestRateLab.tsx:208,222`), 표 설명 `text-[11px] slate-500`(`:230`) · ② 사례 설명 `text-[11px]`, 범위·배지 `text-[10px] slate-500`(`:398-406`) · **(규칙)** 인라인 색 style(`:397,418`) | ① "쪼갤수록 무한히 커질까?" 정적 막대 → n 을 로그 연속 증가시키며 금액이 e^r 선에 닿을 듯 다가감(막대 끝 확대) | 중 | 소+중 |
| 1-2-1 | 단리의 원리합계 | simple_interest_lab | ①단리 시뮬레이터 ②단리 미션 | 그래프 `text-[7px] fill-slate-500`(`SimpleInterestLab.tsx:280,287,307`) — 전체 폭이라 실제 약 20px, 대신 눈금 3개로 성김(§2-P5) · 표 숫자 text-xs·식 `text-[11px] slate-500`(`:223-233`) | ① 매 기간 **같은 크기 rA 블록이 ▶로 하나씩 쌓이는 계단**, "복리와 비교"를 켜면 복리 블록은 점점 커지게 나란히 | 중 | 중 |
| 1-2-1 | 복리의 원리합계 | compound_interest_lab | ①복리 시뮬레이터 ②단리 vs 복리 ③이율 단위를 바꾸면? | 공용 LineChart `text-[7px] fill-slate-500`, 눈금 3개(`CompoundInterestLab.tsx:169-201`) — 세 탭 공용, 크기보다 성김 · 표 식 열 `text-[11px] slate-500`(`:380-391,490-492`) · ③ 공식 `text-[10px] slate-500`(`:626,632`) | ② ▶ 재생으로 두 점이 해마다 함께 달리고 사이 영역이 벌어지며 채워짐 + 차이 카운터("눈덩이") · ① 원금 / 원금의 이자 / **이자의 이자** 3색 누적 막대 | 중 | 중~대 |
| 1-2-1 | 맨해튼의 24달러와 72의 법칙 | rule_of_72_lab | ①맨해튼 24달러 🎬 ②72의 법칙 확인 | ① 영상 SVG(fontSize 3, slice)는 괜찮음. 영상 위 HTML 막대 이름·자막 `text-[11px]`(`RuleOf72Lab.tsx:388-430,513,586,715`), 타임머신 막대 `text-[11px]`(`:859-868`) · ② 표 오른쪽 열 text-xs slate-500(`:1035-1036`) | ② "두 배 사다리"(`:1073-1090`) 정적 → ▶ 연도 카운터가 오르고 72/r 년마다 동전 더미가 ×2 로 커짐 · ① 아래 타임머신 로그 막대 길이 보간 · **(규칙)** 화면 문구 "📖 교과서 활동 ①/②"(`:1004,1065`) — §5.3 교과서 인용 금지와 충돌 | 중 | 소+중 |
| 1-2-1 | 연속복리 | continuous_compound_lab | ①주기를 쪼개 보기 ②단리·복리·연속복리 ③도전 문제 | ② 그래프 `fontSize 6/5.5`(인라인 style, `ContinuousCompoundLab.tsx:401-426`) — 실제 약 17px · ① m 값 `text-[10px] slate-500`(`:274`), 설명 `text-[11px] slate-500`(`:262`) | ① "▶ 자동으로 쪼개 보기"가 850ms 마다 한 칸 점프(`:164-168`) → **m 을 로그 연속값으로 rAF 보간 + 금액 카운터 + 게이지 끝을 ZoomScope 처럼 확대**("e 에 다가간다") · ② 복리·연속복리 선이 거의 겹침(추측) → 차이 확대 토글 | **상** | 중 |
| 1-2-1 | 정기 적금의 원리합계 | installment_savings_lab | ①적금 시뮬레이터 ②단계별 문제 | ① 회차 다이어그램 fontSize 5~6 `fill-slate-500/600`(`InstallmentSavingsLab.tsx:104-151`) — 전체 폭이면 약 15px 로 경계 · 표 식 `text-[11px] slate-500`(`:352-354`) | ① **재생이 멈춘 듯함**: n=24 면 보이는 줄이 1·2·3·⋯·n 다섯 줄(`:74`)이라 260ms 씩 오르는 동안(`:222-226`) 약 5초간 변화 없음 → 회차마다 납입 동전이 만기 쪽으로 날아가며 a(1+r)^k 로 부풀어 합계 막대에 쌓이게, 잔액 그래프와 연동 | **상** | 중 |
| 1-2-2 | 현재가치와 할인율 | present_value_lab | ①현재⇄미래 왕복 ②기간별 그래프 ③단계별 문제 | ② **두 그래프 `lg:grid-cols-2`**(`PresentValueLab.tsx:383`) → fontSize 6 이 약 9px(`:471,477,489`), 공식 `text-[11px]`(`:387,397`) · ① ValueBridge 비활성 화살표 `fill-slate-600`(`:113,143`) | ① ▶ 동전이 시간축을 따라 1년씩 ×(1+r) 커지며 가고 ÷(1+r) 작아지며 돌아오는 **왕복** 애니메이션 · ② 시점 커서 재생으로 두 그래프가 거울처럼 자람 | **상** | 소+중 |
| 1-2-3 | 연금의 종류와 생명연금 | pension_lab | ①연금 3층 구조 ②종신 vs 확정 ③실제 사례 계산 | ② 타임라인 fontSize 6~7, 나이 눈금 slate-500, 높이 96(`PensionLab.tsx:390-432`) — 전체 폭이면 약 18px, 사망 나이 최대일 때 이름표가 오른쪽 끝(x≈338/340)(추측) · ① 펼친 카드 사실 목록 `text-[11px]`(`:186-187`) — 탭 본문 · 비교표 tbody text-xs(`:350`) | ② **"▶ 인생 재생"**: 나이 커서가 흐르며 두 막대가 차오르고 누적 수령액 카운터 둘이 경주, 손익분기 나이에서 순위가 뒤집히는 순간 강조, 사망 후 확정연금은 유족 줄무늬 | 중 | 중 |
| 1-2-3 | 수입과 지출을 고려한 금융 생활 | budget_life_lab | ①A씨의 가계부 ②나의 조정 지출 ③저축이 만드는 10년 뒤 | ① 비율 `text-[10px] slate-500`(`BudgetLifeLab.tsx:174`) · ② 🔒·차이 `text-[10px]`, 0 이면 slate-600(`:315,326`), 비교표 text-xs·A씨 열 slate-500(`:353`) · ③ "납입+이자" `text-[10px] slate-500`(`:484`) | ③ ▶ 120개월 재생: 납입(회색)·이자(초록)가 달마다 자라고 후반에 이자가 가속, 시나리오 네 줄 동시 경주 | 중 | 소+중 |

### 2단원 — 2-1 생산·수요·효용 · 2-2-1 균형

| 단원 | 제목 | 슬러그 | 탭 | A 가독성 | B 연출 | 우선 | 크기 |
|---|---|---|---|---|---|---|---|
| 2-1-1 | 생산함수 | production_function_lab | ①두 변수 함께 ②하나를 고정하면—단면 ③단계별 문제 | ② Section2D 눈금 9 `#64748b`(`ProductionFunctionLab.tsx:913,921`), 340×232 로 오른쪽 칸에 작게 · 표 2개 `text-xs`·머리 `text-[10px]`(`:607-826`) · 설명 `text-[11px]`·slate-500(`:532,560,581,584`) | ② "▶ 훑기": 고정값을 0→5 rAF 로 움직이면 3D 단면 평면이 미끄러지고 2D 에는 지나온 단면 곡선이 잔상으로 쌓임(곡선족) · ① 자동 회전 토글 | 중 | 중 |
| 2-1-1 | 비용함수 | cost_function_lab | ①가게 비용 시뮬레이터 ②비용의 두 얼굴 ③노동함수→비용함수 ④단계별 문제 | ChartFrame 눈금 9 `#64748b`(`CostFunctionLab.tsx:419,427`, 그래프 6개 공용), 분기점 숫자 9(`:814`) · Big 카드 `text-[11px]`/`[10px]`(`:201,203`), 설비 카드 `text-[10px] slate-500`(`:849`), StepCard `text-[10px]`(`:1029`) | ① 총비용/1개당 비용이 토글이라 한쪽만 보임(`:262-271`) → 위아래로 함께 그리고 Q 를 ▶ 재생: 총비용은 직선을 타고 오르고 평균비용은 점근선으로 떨어지는 게 동시에 · ② 설비 비교에서 최적 설비가 바뀌는 순간 강조 | 중 | 중 |
| 2-1-2 | 수요함수와 공급함수 | demand_supply_lab | ①수요함수 ②공급함수 ③왜 뒤집어 그릴까 ④단계별 문제 | CurveChart 눈금 9 `#64748b`(`DemandSupplyLab.tsx:208,216`) · 값 표 text-xs·머리 `text-[10px]`(`:402-421`) · 캡션 `text-[11px]` slate-500(`:324,390,439`) | ①② "값 올리기/내리기"(`:350-366`)가 숫자 카드만 바꾸고 이전 점이 없음(`:188`) → 이전 점 잔상 + 새 점까지 미끄러짐 + Δ가격·Δ수량 화살표 · ③ 축 뒤집기 애니메이션은 이미 있음 | 중 | 중 |
| 2-1-2 | 수요량 예측하기 | demand_forecast_lab | ①두 점으로 수요곡선 ②최소제곱법 ③단계별 문제 | 그래프 3개 눈금 9 `#64748b`(`DemandForecastLab.tsx:277-694`) · 캡션 `text-[10px] slate-500`(`:339,671,715`) · ② 잔차 표 머리 `text-[10px]`(`:767-792`) · StepLine 번호 `text-[9px]`(`:498-499`) | ② a 를 움직일 때 C(a) 포물선 위에 지나온 점을 흐린 자취로 남겨 "꼭짓점으로 내려가는 길" (자동 보간 `:532` 은 이미 있음) | 중 | 소~중 |
| 2-1-3 | 효용함수 | utility_function_lab | ①효용과 효용함수 ②한계효용 체감 ③나의 효용 곡선 ④단계별 문제 | ② **BarChart 눈금·막대 값·x라벨 8.5 `#64748b`**(`UtilityFunctionLab.tsx:622-657`), 380×190 두 개가 탭의 주인공 — 실제 약 11px · 표 머리 `text-[10px]` 8곳(`:337-882`) · U/MU 카드 라벨 `text-[10px]`(`:446,450`) | ② "한 개 더!"(`:470`) 때 막대 투명도만 켜짐(`:641`) → **새 MU 조각이 U 막대 꼭대기에 쌓이고, 쌓이는 조각이 점점 작아지는** rAF 연출 ("U 의 증가분 = MU" + 체감) | **상** | 중 |
| 2-1-3 | 효용의 순서와 크기 | ordinal_cardinal_lab | ①순서만? 크기까지? ②값을 바꿔도 순위는? ③순서만으로 ④단계별 문제 | ② x 눈금 10 `#64748b`, **y 눈금 없음**(`OrdinalCardinalLab.tsx:472`), 캡션 `text-[10px] slate-500`(`:506`), 순위 칸 `text-[11px]`(`:540`) | ② **min-max 정규화(`:402-406`) 때문에 2U·U+10 같은 증가 일차변환은 원래 선과 정확히 겹침** (수식상 확실) → 원래 눈금에서 U→f(U) 로 점이 위아래 이동하는 모핑, 점 위 순위 메달은 따라가되 순서 유지, 감소 변환에서만 메달 뒤바뀜 · **(규칙)** 인라인 style(`:449,451,534`) | 중 | 중 |
| 2-2-1 | 균형가격의 결정 | equilibrium_price_lab | ①균형점 찾기 ②점이 움직일까, 곡선이 움직일까 ③단계별 문제 | MarketChart 눈금 9 `#64748b`(`EquilibriumPriceLab.tsx:209,217`) · ① 표 머리 `text-[10px]`(`:476-515`), 설명 `text-[11px]`(`:425,434,531`) · ② 사건 해설 `text-[11px]`(`:776-835`) | ② 사건 게임 정답 시 dShift/sShift 가 0→목표로 즉시(`:690-692`) → **곡선이 서서히 미끄러지고 옛 균형점 E₀ 잔상 + 새 균형점까지 화살표** (단원 핵심 개념) · **(규칙)** 인라인 style 다수(`:332-393,495,505,776`) | **상** | 중 |
| 2-2-1 | 시장가격과 균형가격 | market_adjust_lab | ①남을까, 모자랄까 ②균형을 찾아가는 여정 ③단계별 문제 | ② **PriceTimeline 눈금 8.5 `#64748b`, 높이 170**(`MarketAdjustLab.tsx:759-785`) · GapChart 9·9.5(`:201-261`) · 하루 기록 카드 `text-[10px]`/`[11px]`(`:704-717`), 흐름도 미도달 slate-600(`:605,612`) | ② "하루 지나기"/"끝까지"(700ms, `:550`)마다 가격이 순간이동 → 하루 사이 rAF 보간: 가격선이 미끄러지고 초과량 화살표가 줄고 타임라인 꺾은선이 뻗어 감 (자취 `:248` 은 이미 있음) | **상** | 중 |

### 2단원 — 2-2-2 균형의 변화 · 2-2-3 부등식의 영역

| 단원 | 제목 | 슬러그 | 탭 | A 가독성 | B 연출 | 우선 | 크기 |
|---|---|---|---|---|---|---|---|
| 2-2-2 | 균형가격의 변화 | equilibrium_change_lab | ①세금과 균형점 ②소득과 균형점 ③수요를 움직이는 것들 ④공급을 움직이는 것들 ⑤단계별 문제 | ShiftChart 눈금 9 `#64748b`·세금 이름표 9(`EquilibriumChangeLab.tsx:249,257,331`) · ① 부담 분석 카드 `text-[10px]`/`[11px]`, "총 …" 값 slate-500(`:431-453`) · ③④ QRow 보기 `text-[11px]`(`:859`), 번호 `text-[9px]`(`:846`) | ③④ CardGame 정답 시 곡선 순간 이동(`:665`) → rAF 글라이드 + E₀→E₁ 점선 화살표 (InflationLab 의 Arrow `:147` 처럼 파일 안에 정의) | 중 | 중 |
| 2-2-2 | 공학도구로 균형 찾기 | tax_explorer_lab | ①공학도구 실험실 ②표 채우기 ③규칙 찾기 ④단계별 문제 | ② **공급함수 보기 버튼 `text-[10px]` 안 KaTeX**(`TaxExplorerLab.tsx:542`), 표 text-xs(`:506`), 정정값 `text-[10px]`(`:583,608`) · ③ **규칙의 핵심 행(Δ가격 +10, Δ거래량 −20)만 `text-[11px]`**, 다른 행은 text-base(`:728-749`) | ① "균형점 자취 보기"(`:225-250`) 정적 토글 → ▶ 세금 0→180 재생, 30·60·90… 지날 때마다 자취 점이 찍히며 균형점이 수요곡선을 따라 미끄러짐 | **상** | 중 |
| 2-2-2 | 인플레이션과 균형가격 | inflation_lab | ①곡선을 움직여 보자 ②무슨 일이 생겼을까 ③내 돈의 힘 ④역사 속 물가 | 차트 3개 눈금 9(`InflationLab.tsx:205,213,860,866,1167,1175`) · ④ **점 옆 연도 9**(`:1207`, 누를 대상), 사분면 이름 9.5 · ③ 원래 가격 `text-[11px] slate-500`(`:793`) · ④ 유형 카드 `text-[10px]`(`:946,949`) | ① 프리셋이 k·m 즉시 변경(`:319-322`) → rAF 글라이드 · ② 정답 후 애니메이션이 선형 약 0.37초(`:552-561`)로 너무 빠름 → easeInOut 1초 · **(규칙)** 인라인 style(`:341,366,1114,1123`) | 중 | 소~중 |
| 2-2-3 | 부등식의 영역 | region_lab | ①영역 그리기 ②어느 부분일까 ③이 점, 들어갈까 | Plane 눈금 9(`RegionLab.tsx:290,297`) · ② 미니 평면 머리(실선/점선 단서) `text-[10px] slate-500`(`:694`) · 라벨 `text-[11px]` 다수 | ③ 답하면 영역이 갑자기 나타남(`:813`) → 경계선에서 해당 쪽으로 쓸어 칠하는 짧은 전개 · ① 버튼의 "❘" 문자 대용(`:440`) | 하 | 소 |
| 2-2-3 | 연립부등식의 영역과 최대·최소 | system_region_lab | ①하나씩 겹쳐 보기 ②직선을 밀어라 ③꼭짓점 사냥 ④꼭짓점 표로 풀기 | Plane 눈금 9(`SystemRegionLab.tsx:239,244`) · ① **질문 라벨 "어느 쪽 영역? / 경계선은?" `text-[10px] slate-500`**(`:401,427`) · ④ 표 text-xs, 좌표 행 `text-[11px]`(`:986,999`) | ② "최대로/최소로 밀기"가 `setK` 순간 이동(`:653,660`) → k 글라이드 + 지나간 직선 잔상 몇 개("평행이동 → 마지막 접점"), 직선 위 "k = …" 이름표 · ① 겹침 영역 페이드인 | 중 | 중 |
| 2-2-3 | 선형계획법 | linear_programming_lab | ①조건을 부등식으로 ②이익을 최대로 ③비용을 최소로 ④실전 문제 | Plane 눈금 9(`LinearProgrammingLab.tsx:229,234`) · **CornerTable(②③④ 결론 표)** 좌표 `text-[11px]`, text-xs `px-2 py-1.5`, 단위 `text-[10px] slate-500`(`:285-315`) · 조건 표 text-xs(`:363,793,1044`) | ② 시작값 k=0(`:539`)이라 이익 직선이 원점 꼭짓점에 붙어 안 보임 → 시작 k 를 영역 중간으로(판정 무관) · ② "최대로 밀기" 순간 이동(`:718`) → 글라이드 + 등이익선 잔상, ③에도 같게 | 중 | 중 |
| 2-2-3 | 다각형과 부등식의 영역 | polygon_region_lab | ①도형을 부등식으로 ②내 도형 만들기 ③a와 b를 바꾸면 ④꼭짓점 미션 | Plane 눈금 9(`PolygonRegionLab.tsx:255,260`) · **ValueTable(③④ 주인공)** 이름 `text-[11px]`, 좌표 `text-[10px]`, `px-1 py-1.5`, 캡션 `text-[10px] slate-500`(`:653-691`) | ③ "▶ 돌려 보기": (a,b) 를 원 둘레로 천천히 회전시키면 최대·최소 직선이 돌며 노랑/파랑 꼭짓점이 오각형을 따라 옮겨 감 | 중 | 소~중 |

### 3단원 — 행렬

| 단원 | 제목 | 슬러그 | 탭 | A 가독성 | B 연출 | 우선 | 크기 |
|---|---|---|---|---|---|---|---|
| 3-1-1 | 행렬의 연산과 활용 | matrix_lab | ①행렬 읽기 ②더하기·빼기·몇 배 ③곱셈의 비밀 ④스프레드시트 ⑤실생활 해결 | ④ **시트 격자(탭 주인공) 머리 `text-[10px]`, 칸 `h-7 w-[54px] text-[11px]`, fx 줄 `text-[10px]`**(`MatrixLab.tsx:1366-1432`) · ⑤ DataTable text-xs·`px-2.5 py-1`·w-full 아님·모서리 `text-[9px] slate-500`(`:1674-1730`) · MatrixView md 칸 `h-9 text-sm`(`:190-192`) | ③ VisualMul "이 칸 채우기"가 값만 바로 표시(`:1183-1194`) → A 행 칸과 B 열 칸이 짝지어 차례로 밝아지고 곱이 하나씩 쌓여 결과 칸으로 들어가는 ▶ · ④ 실행 시 결과 칸을 위에서부터 채우며 참조 칸을 비춤 | **상** | 중 |
| 3-1-1 | 행의 합과 평균을 구하는 행렬 | row_sum_mean_lab | ①합 기계·평균 기계 ②실생활 해결 ③앞뒤로 끼우기 ④빈칸 탐정 | ② DataTable 이 matrix-lab 과 같은 복사본(`RowSumMeanLab.tsx:786-836`) · ③ 행·열 이름(반·과목) `text-[11px] slate-400`(`:263,271`) · ① 행렬 설명 `text-[11px] slate-500`(`:690`) · ④ 이름표 `text-[10px]`(`:1141,1170`) | ① 고른 가로줄 성분이 끼운 수와 곱해지며 결과 칸으로 흘러 한 수로 "접히는" 애니메이션(지금은 식만 `:731-734`) · ③ 슬롯을 바꿀 때 성적표가 가로/세로로 접히는 전환 | 중 | 소+중 |
| 3-2-1 | 역행렬과 행렬식 | inverse_matrix_lab | ①역행렬 실험실 ②값 알아내기 ③행렬 암호 ④행렬식 사냥 | ③ **글자표 숫자 코드 `text-[8px] text-slate-500`**(`InverseMatrixLab.tsx:895,1095`) — 암호를 풀 정보 · ① 짝 행렬 설명 `text-[10px] slate-500`(`:637-639`) · ④ 오답 이유 `text-[10px]`(`:1172`) | ① a·d 가 자리를 바꾸고 b·c 부호가 뒤집히는 걸 칸이 실제로 이동하는 애니메이션 · ① 단위정사각형→평행사변형, 넓이 = \|det\|, det=0 이면 납작해짐 | **상** | 소(글씨)/중(그림) |
| 3-2-2 | 연립방정식과 역행렬 | linear_system_lab | ①두 직선 실험실 ②역행렬로 풀기 ③세 갈래 판정 ④실생활 해결 | **Plane 눈금 9 `#64748b`, 축 이름 없음, `max-w-[330px]`**(`LinearSystemLab.tsx:198,218,225`) — 네 탭 공용, 실제 약 9px · TriView 이름표 `text-[10px]`(`:300,306,1023`) · "행렬식" `text-[10px]`(`:802,948,1177`) | ① det→0 일 때 교점이 화면 밖으로 달아나는 자취(잔상) → "평행 = 해 없음" · ③ 확인 시 직선이 갑자기 나타남(`:1101`) → 그려 나가며 교점이 튀어나옴 | **상** | 소+중 |
| 3-2-2 | 행렬로 푸는 실생활 문제 (②③ 제외) | matrix_use_lab | ①균형가격 찾기 ②생산량 되짚기 ③사용자 수 예측 ④사회 연결망 | ① **MarketPlane 눈금 9 `#64748b`, 축 이름 9 `#475569`, `max-w-[330px]`**(`MatrixUseLab.tsx:602-628`), 이름표 `text-[10px]`(`:751-826`) · ④ 인접행렬 sm `h-7 text-[11px]`(`:174`), 열 이름 `text-[9px] slate-500`(`:1355`), A² 설명 `text-[10px] slate-500`(`:1386`), 연결망 `max-w-[300px]`(`:1256`) | ④ 선을 이었다 끊을 때 대칭 두 칸이 깜빡, A² 칸을 누르면 그래프에 두 다리 경로가 밝아짐 · ① 손잡이 이동 시 옛 균형점 잔상 | **상** | 중 |

### 4단원 — 미분과 경제

| 단원 | 제목 | 슬러그 | 탭 | A 가독성 | B 연출 | 우선 | 크기 |
|---|---|---|---|---|---|---|---|
| 4-1-1 | 함수의 극한과 그 성질 (① 제외) | limit_lab | ①한없이 가까이 ②구멍이 있어도 ③극한의 성질 ④그래프 탐정 | ② 그래프 3개 `lg:grid-cols-3`(`LimitLab.tsx:1003`) → 각 약 250px(추측), 극한값/함숫값 이름표 `text-[10px]`(`:1028,1034`) · ③ 이름표 `text-[10px]`, "구멍" `text-[9px]`(`:1130-1208`), 캡션 `text-[10px] slate-500`(`:1232`) | ② ▶ 세 그래프에서 동시에 점이 양쪽에서 x=a 로 미끄러져 같은 높이 L 로 모이는데 함숫값만 다름 (ZoomScope 재사용) · ③ f·g 를 옅게 겹쳐 그리고 세 y 값이 함께 모임 | 중 | 소+중 |
| 4-1-2 | 평균변화율과 도함수 (② 제외) | derivative_lab | ①증분과 평균변화율 ②할선→접선 ③미분계수 모으기 ④미분 공식 ⑤경제 속 순간변화율 | ④ 표 text-xs·머리 `text-[10px] px-2 py-1`·n 칸 `text-[11px]`(`DerivativeLab.tsx:1412-1425`), 그래프 2개 반반 폭(`:1515-1527`) · ⑤ **핵심 비교 이름표·설명 `text-[10px] slate-500`**(`:1652-1662`) · ① 캡션 `text-[10px] slate-500`(`:793`) | ⑤ f 그래프에 접선과 함께 "실제 Δx=1 계단(가로 1·세로 실제 변화)"을 겹쳐 두 값 차이를 눈으로 · ③ 스캔(`:1172-1185`)에서 찍힌 점이 아래 도함수 평면으로 떨어지는 연결선 | 중 | 소+중 |
| 4-1-3 | 경제함수의 미분과 한계 (① 제외) | marginal_lab | ①한계효용 ②한계비용 ③한계생산량 ④한계수입 | ④ **RevenueRect 눈금·축 이름 8, 축 이름 `#475569`, 넓이 값 11 보통 굵기, `max-w-[320px]`**(`MarginalLab.tsx:1342,1371-1387`) · ④ 캡션 `text-[10px] slate-500`(`:1454`) · ②③ 핵심 비교 이름표 `text-[10px] slate-500`(`:1024,1028,1224,1228`) | ③ 한 명 더 뽑을 때마다 늘어난 몫을 막대로 쌓아 점점 줄어드는 계단으로(지금은 이모지만 `:1168-1176`) · ④ 가격 이동 시 직사각형 잔상 / 넓이 자취 | **상** | 소+중 |
| 4-1-3 | 죄수의 딜레마 | dilemma_lab | ①딜레마 실험실 ②한 판 승부 ③전략 리그 ④조건과 탈출 | ② 기록표 text-xs, 칸 `px-2 py-1 text-[11px]`(`DilemmaLab.tsx:958-983`) · ③ 리그 표 머리 `text-[10px]`, 숫자 `text-[11px] px-1 py-1`(`:1281-1317`), ScoreBars 10(`:1069,1072`), 판 번호 `text-[9px] slate-500`(`:1233`) · PayoffGrid 본문은 괜찮음 | ① 상대 선택을 고정할 때마다 "나쁜 칸 → 나은 칸" 화살표, 두 경우를 다 보면 화살표가 (배신, 배신)으로 모임 (지금은 테두리·✓ 뿐 `:226-255`) · ② 판 공개 시 보수표 칸이 밝아지고 점수가 누적 막대로 날아감 | 중 | 중 |
| 4-1-4 | 함수의 증가·감소와 극값 | extremum_lab | ①두 점 재판소 ②롤러코스터 ③돋보기 창 ④경사계와 증감표 ⑤평평한 자리 분류소 | Plot `fs = compact ? 7 : 8`, `#64748b`/`#475569`(`ExtremumLab.tsx:246,295-309`) — 전 탭 · ⑤ 카드 8장 compact(`:1846,1888`) · ② Gauge 8~9, `max-w-[160px]`(`:956-969`) · ④ f·f′ 를 `w-4/5`(`:1660,1677`), SignBar 8(`:1539`) · ③ 판정 문구 slate-500(`:1453,1465`) · ④ 증감표는 이상 없음 | ① "🔎 모든 쌍 검사"(`:917`)가 990쌍 결과를 한 번에 표시 → x₁,x₂ 쌍이 rAF 로 훑으며 증거 점이 쌓이고 깨는 쌍에서 멈춰 강조 · ④ f 와 f′ 를 위아래로 쌓아 세로 가이드선 하나로 관통 + ▶ 훑기 · ② 이미 좋음 | 중 (A 는 P1 로 상) | 중 |
| 4-1-4 | 도함수로 그리는 그래프의 개형 | graph_shape_lab | ①증감표 탐정 ②개형 공장 ③공학도구 그래프판 ④부호 카드 퍼즐 ⑤짝 맞추기 | ① **보기 그래프 4장 `lg:grid-cols-4` + compact fs 7 → 약 5px**(`ShapeLab.tsx:232,793,821`)인데 "눈금 숫자를 보고 견줘 보세요"(`:837`) · Plot 색 `#64748b`/`#475569`(`:270-286`) · ③ 슬라이더 이름표 `text-[11px]`(`:1329-1386`) · ⑤ 눈금은 일부러 지웠음(`:1668`) → 크기 문제 아님 | ④ 부호 카드를 뒤집으면 "내가 만든 모양"(`:1546`)이 순간 교체 → 이전 곡선→새 곡선 rAF 모핑 · ② 3단계 뒤 구간별 ↗↘ 화살표를 먼저 그리고 4단계 뒤 곡선이 이어 그려지게(`:897`) | **상** | 중 |
| 4-2-1 | 수요의 가격 탄력성 | elasticity_lab | ①할인 실험실 ②좁혀 보기 ③탄력성 판별기 ④사장님의 선택 ⑤대체재 창고 | ② **수렴 표(탭 주인공) text-xs, 값 `text-[11px]`, `px-2 py-1.5`**(`ElasticityLab.tsx:874,976-991`) · Plot 8(`:241-255`) · EGauge 9(`:635-647`) · ChangeBars 8, `max-w-[320px]`(`:667-682`) · ④ 그래프 `w-4/5`(`:1266,1285`) · ①⑤ 이상 없음 | ④ 수요곡선 위에 **수입 직사각형 x·f(x)** 음영 — 가격을 끌면 넓이가 늘었다 줄었다 (지금은 점과 숫자 `:1243,1270`) · ② "할인폭 더 줄이기"(`:958`)에서 점이 x₀ 쪽으로 미끄러지며 할선이 접선으로 닫히는 TanTab 식 연출 | **상** | 중~대 |
| 4-2-1 | 공급의 가격 탄력성 | supply_elasticity_lab | ①공장 실험실 ②절편의 비밀 ③좁혀 보기 ④시간이 흐르면 ⑤조절 속도 창고 | ③ 수렴 표 = elasticity ② 와 같은 문제(`SupplyElasticityLab.tsx:1076,1178-1193`) · Plot 8(`:247-261`) · EGauge 9 · ChangeBars 8 · ② 절편 부호 설명 카드 `text-[11px]`(`:1025`) | ④ 기간 버튼이 공급선을 순간 이동 → **▶ 시간 흐르기**: 기준점을 축으로 공급선이 점점 가팔라지며 회전(e rAF 보간), 지나온 선 잔상 · ② a·b 를 움직일 때 `supplyBox` 로 축 범위가 바뀌어 기울기 변화가 안 보일 수 있음(`:880`, 추측) → 축 고정 | 중 | 중 |
| 4-2-1 | 그래프로 보는 탄력성 | elasticity_graph_lab | ①두 기울기 재판소 ②중점의 비밀 ③탄력성 자취 그리기 ④탄력성 사격장 | Plot 8(`ElasticityGraphLab.tsx:243-257`) · ① **SlopeBars 결론 문장 10 `#64748b`**(`:662`) · ③④ 그래프 `w-4/5`(`:1151,1167,1294,1307`) · 값 카드 `text-[11px]` | 움직임은 이미 충분(①③). 굳이: ② 점을 A→B ▶ 자동 훑기, 중점 C 를 지날 때 배지 번쩍 | 중 (A 만) | 소 |
| 4-2-2 | 경제 현상의 최적화 | optimization_lab | ①최댓값 사냥 ②소비자의 선택 ③생산자의 선택 ④기업의 선택 ⑤한계비용 = 가격 | Plot 8(`OptimizationLab.tsx:252-266`) · ① SignStrip 9, 0 은 `#64748b`(`:778-786`) · ④ **수업 버튼 가격 "값 p" `text-[10px]`**(`:1323`) · ④⑤ 그래프 크기는 이상 없음 | ②③ U(x)·P(x) 그래프 아래 같은 x축으로 **한계효용·한계생산 막대** — 슬라이더를 밀면 막대가 줄다 0 을 지나 음수로 (지금은 숫자 배지 `:1063,1204`) · 정수 슬라이더라 접선이 툭툭 → 표시용 x rAF 보간 | 중 (A 는 P1) | 중 |

---

## 4. 이번 조사에서 함께 보인 규칙 위반 (화면 표현 밖 — 참고)

| 내용 | 위치 | 근거 규칙 |
|---|---|---|
| 활동 안 자체 계산기 + "계산기를 써도 좋아요!" | `ExchangeSmartLab.tsx:322,369,427-497` | §5.6 활동 안에 계산기 금지 |
| 화면 문구에 "📖 교과서 활동 ①/②" | `RuleOf72Lab.tsx:1004,1009(주석),1065` | §5.3 교과서 인용 금지 |
| 컴포넌트 안에서 컴포넌트 정의(`const Row`) | `TaxRatesLab.tsx:348` | §5.8 |
| 동적 색 인라인 `style` | `VatLab.tsx:576` · `CustomsLab.tsx:462` · `InterestRateLab.tsx:397,418` · `EquilibriumPriceLab.tsx:332-393,495,505,776` · `OrdinalCardinalLab.tsx:449,451,534` · `CostFunctionLab.tsx:843` · `UtilityFunctionLab.tsx:929` · `InflationLab.tsx:341,366,1114,1123` · `RuleOf72Lab.tsx:861,1082` | §5.6 인라인 스타일 금지 |
| SVG 글자 크기를 인라인 `style={{ fontSize }}` 로 | `ContinuousCompoundLab.tsx:401-426` · `InstallmentSavingsLab.tsx:104-151,384-394` · `PresentValueLab.tsx:471-489` · `PensionLab.tsx:394-432` | §5.6 (SVG 속성으로) |

---

## 부록 A. 정량 신호 (grep, 활동 폴더의 `*.ts*` 전체)

`fs8-9` = `fontSize` 속성 8·9 · `sty5-7` = `style={{ fontSize: 5~7 }}` · `px9/10/11` = `text-[9px]`·`[10px]`·`[11px]` · `col340` = `minmax(0,340px)` 고정 칸 · `rAF` = `requestAnimationFrame` · `step` = `setX(x ± 1)` 꼴 · `sl500` = `text-slate-500`.
같은 숫자라도 배율이 다르므로(§0) 이 표만으로 순위를 매기지 않았다. (ExtremumLab·ShapeLab 의 `fs = compact ? 7 : 8` 처럼 변수로 준 크기는 이 표에 잡히지 않는다.)

| 활동 | 줄 | fs8-9 | sty5-7 | px9 | px10 | px11 | col340 | rAF | step | sl500 |
|---|---|---|---|---|---|---|---|---|---|---|
| employment-lab | 506 | 0 | 0 | 3 | 7 | 1 | 0 | 0 | 0 | 6 |
| gdp-growth-lab | 1024 | 0 | 0 | 4 | 2 | 4 | 0 | 0 | 1 | 7 |
| percentage-point-lab | 533 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 2 | 3 |
| stock-index-lab | 839 | 0 | 0 | 5 | 2 | 2 | 0 | 0 | 0 | 9 |
| bigmac-index-lab | 412 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 0 | 7 |
| exchange-impact-lab | 423 | 0 | 0 | 1 | 3 | 0 | 0 | 0 | 1 | 5 |
| exchange-rate-lab | 339 | 0 | 0 | 3 | 1 | 0 | 0 | 0 | 0 | 5 |
| exchange-smart-lab | 506 | 0 | 0 | 1 | 2 | 2 | 0 | 0 | 0 | 4 |
| corporate-tax-lab | 473 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 4 |
| customs-lab | 1009 | 0 | 0 | 0 | 1 | 8 | 0 | 0 | 0 | 4 |
| excise-tax-lab | 391 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| income-tax-lab | 556 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 1 |
| tax-lab | 915 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 2 | 10 |
| tax-rates-lab | 579 | 0 | 0 | 4 | 2 | 1 | 0 | 0 | 0 | 4 |
| vat-lab | 943 | 0 | 0 | 0 | 1 | 10 | 0 | 0 | 2 | 6 |
| compound-interest-lab | 858 | 0 | 0 | 0 | 3 | 8 | 0 | 0 | 0 | 6 |
| continuous-compound-lab | 882 | 0 | 2 | 0 | 1 | 8 | 0 | 0 | 0 | 4 |
| installment-savings-lab | 866 | 0 | 8 | 0 | 1 | 9 | 0 | 0 | 0 | 5 |
| interest-rate-lab | 757 | 0 | 0 | 0 | 4 | 5 | 0 | 0 | 0 | 4 |
| rule-of-72-lab | 1285 | 0 | 0 | 0 | 0 | 19 | 0 | 2 | 0 | 6 |
| simple-interest-lab | 821 | 0 | 0 | 0 | 1 | 10 | 0 | 0 | 0 | 5 |
| present-value-lab | 943 | 4 | 3 | 0 | 1 | 11 | 0 | 0 | 0 | 4 |
| budget-life-lab | 604 | 0 | 0 | 0 | 4 | 6 | 0 | 0 | 0 | 5 |
| pension-lab | 1035 | 0 | 7 | 0 | 3 | 16 | 0 | 0 | 0 | 8 |
| cost-function-lab | 1888 | 3 | 0 | 0 | 4 | 24 | 0 | 0 | 0 | 4 |
| production-function-lab | 1686 | 5 | 0 | 0 | 4 | 10 | 0 | 0 | 0 | 4 |
| demand-forecast-lab | 1472 | 6 | 0 | 1 | 6 | 12 | 0 | 0 | 1 | 4 |
| demand-supply-lab | 1648 | 6 | 0 | 0 | 3 | 15 | 0 | 0 | 1 | 5 |
| ordinal-cardinal-lab | 1453 | 0 | 0 | 0 | 3 | 18 | 0 | 0 | 0 | 4 |
| utility-function-lab | 1712 | 8 | 0 | 0 | 13 | 22 | 0 | 0 | 2 | 3 |
| equilibrium-price-lab | 1659 | 2 | 0 | 1 | 6 | 22 | 0 | 0 | 1 | 1 |
| market-adjust-lab | 1550 | 11 | 0 | 0 | 4 | 20 | 0 | 0 | 0 | 1 |
| equilibrium-change-lab | 1868 | 3 | 0 | 1 | 11 | 26 | 0 | 0 | 0 | 6 |
| inflation-lab | 2082 | 11 | 0 | 1 | 9 | 27 | 0 | 0 | 0 | 8 |
| tax-explorer-lab | 1521 | 2 | 0 | 0 | 10 | 23 | 0 | 0 | 0 | 5 |
| linear-programming-lab | 1799 | 2 | 0 | 0 | 1 | 32 | 0 | 0 | 1 | 4 |
| polygon-region-lab | 1348 | 2 | 0 | 0 | 3 | 16 | 0 | 0 | 0 | 2 |
| region-lab | 1247 | 2 | 0 | 0 | 1 | 16 | 0 | 0 | 2 | 1 |
| system-region-lab | 1597 | 2 | 0 | 0 | 5 | 27 | 0 | 0 | 0 | 4 |
| matrix-lab | 3162 | 0 | 0 | 2 | 3 | 20 | 2 | 0 | 2 | 11 |
| row-sum-mean-lab | 2195 | 0 | 0 | 2 | 2 | 20 | 0 | 0 | 3 | 8 |
| inverse-matrix-lab | 2094 | 0 | 0 | 0 | 5 | 13 | 1 | 0 | 3 | 7 |
| linear-system-lab | 2213 | 2 | 0 | 0 | 7 | 9 | 2 | 0 | 3 | 2 |
| matrix-use-lab | 2540 | 4 | 0 | 1 | 11 | 16 | 3 | 0 | 4 | 11 |
| limit-lab | 2243 | 0 | 0 | 1 | 9 | 11 | 3 | 2 | 2 | 4 |
| derivative-lab | 2698 | 0 | 0 | 0 | 10 | 29 | 3 | 2 | 1 | 7 |
| dilemma-lab | 2179 | 0 | 0 | 1 | 11 | 39 | 4 | 0 | 2 | 8 |
| marginal-lab | 2320 | 4 | 0 | 0 | 8 | 36 | 3 | 0 | 5 | 9 |
| extremum-lab | 2988 | 7 | 0 | 0 | 0 | 23 | 3 | 0 | 1 | 4 |
| shape-lab | 2781 | 0 | 0 | 0 | 0 | 18 | 2 | 0 | 3 | 2 |
| elasticity-graph-lab | 2059 | 4 | 0 | 0 | 0 | 18 | 2 | 0 | 1 | 1 |
| elasticity-lab | 2217 | 11 | 0 | 0 | 0 | 19 | 3 | 0 | 2 | 1 |
| supply-elasticity-lab | 2271 | 11 | 0 | 0 | 0 | 17 | 4 | 0 | 2 | 1 |
| optimization-lab | 2541 | 7 | 0 | 0 | 1 | 26 | 5 | 0 | 1 | 4 |

- `requestAnimationFrame` 을 쓰는 활동은 54개 중 3개(rule-of-72 · limit · derivative)뿐이다. 나머지의 재생은 `setInterval`/`setTimeout` 단계 점프다.
- 1~2단원 SVG 는 Tailwind `text-[Npx]` 클래스나 `fontSize` 속성 9 를 쓰고, 3~4단원은 `fontSize` 속성 8 을 쓴다. 고칠 때 찾을 문자열이 단원마다 다르다.
