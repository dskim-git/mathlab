// 세계 여러 나라의 세율·복지 비교 — 활동 데이터
// 수집: OWID(HDI·삶의만족도·기대수명·조세수입·사회복지지출) + World Bank(GDP). 스크립트 자동 수집.
// 개인소득세 최고세율: OECD Table I.7(2024, 중앙+지방 결합) 및 비OECD는 KPMG/각국 세법 기준.
// 값·연도는 화면에 함께 표기한다.

export const DATA_NOTE =
  "출처: Our World in Data(UNDP HDI·세계행복보고서·기대수명·UNU-WIDER 조세수입·OECD 사회복지지출), World Bank(GDP), OECD Table I.7·KPMG(소득세 최고세율). 국가별 최신 이용가능 연도.";

export type MetricKey = "pit" | "burden" | "hdi" | "happy" | "life" | "social" | "taxTotal";
export type AxisKind = "tax" | "welfare" | "total";
export type MetricDef = {
  key: MetricKey;
  label: string;
  short: string;
  unit: string;
  axis: AxisKind;
  desc: string;
  source: string;
  /** 색 스케일 방향: 높을수록 진하게(true) */
  higherDeeper: boolean;
};

export const TAX_METRICS: MetricKey[] = ["pit", "burden"];
export const WELFARE_METRICS: MetricKey[] = ["hdi", "happy", "life", "social"];

export const METRICS: Record<MetricKey, MetricDef> = {
  pit: { key:"pit", label:"개인소득세 최고세율", short:"소득세 최고세율", unit:"%", axis:"tax",
    desc:"각국 개인 소득세의 가장 높은 구간 세율(중앙+지방 결합).", source:"OECD Table I.7(2024)·KPMG", higherDeeper:true },
  burden: { key:"burden", label:"국민부담률", short:"국민부담률", unit:"%", axis:"tax",
    desc:"GDP 대비 조세+사회보장기여금 총액의 비율. 나라 전체가 얼마나 걷는지.", source:"OWID/UNU-WIDER", higherDeeper:true },
  hdi: { key:"hdi", label:"인간개발지수(HDI)", short:"HDI", unit:"", axis:"welfare",
    desc:"소득·교육·기대수명을 종합한 발전·복지 지수(0~1).", source:"UNDP", higherDeeper:true },
  happy: { key:"happy", label:"행복지수(삶의 만족도)", short:"행복지수", unit:"점", axis:"welfare",
    desc:"국민이 스스로 매긴 삶의 만족도(0~10, Cantril 사다리).", source:"세계행복보고서", higherDeeper:true },
  life: { key:"life", label:"기대수명", short:"기대수명", unit:"세", axis:"welfare",
    desc:"태어난 아이가 살 것으로 기대되는 평균 수명.", source:"OWID/World Bank", higherDeeper:true },
  social: { key:"social", label:"사회복지지출(%GDP)", short:"사회복지지출", unit:"%", axis:"welfare",
    desc:"정부가 복지에 쓰는 지출이 GDP에서 차지하는 비중.", source:"OECD SOCX", higherDeeper:true },
  taxTotal: { key:"taxTotal", label:"걷힌 세금 총액", short:"세금 총액", unit:"USD", axis:"total",
    desc:"국민부담률 × GDP로 계산한 한 해 걷힌 세금의 대략적 총액.", source:"OWID·World Bank 계산", higherDeeper:true },
};

export type CountryRow = {
  code: string; name: string;
  pit: number | null; burden: number | null;
  hdi: number | null; happy: number | null; life: number | null; social: number | null;
  gdp: number | null; taxTotal: number | null;
};

export function metricValue(c: CountryRow, k: MetricKey): number | null {
  return c[k];
}

export const COUNTRIES: CountryRow[] = [
  { code:"AUS", name:"오스트레일리아", pit:45, burden:30.4, hdi:0.958, happy:6.92, life:83.9, social:17.1, gdp:1798518933689.21, taxTotal:546749755842 },
  { code:"AUT", name:"오스트리아", pit:55, burden:42.5, hdi:0.93, happy:6.85, life:82, social:32, gdp:579470021095.418, taxTotal:246274758966 },
  { code:"BEL", name:"벨기에", pit:53.5, burden:42.6, hdi:0.951, happy:6.93, life:82.1, social:29.1, gdp:725466462859.646, taxTotal:309048713178 },
  { code:"CAN", name:"캐나다", pit:53.5, burden:34.8, hdi:0.939, happy:6.74, life:82.6, social:19.3, gdp:2319899772425.92, taxTotal:807325120804 },
  { code:"CHL", name:"칠레", pit:40, burden:18.9, hdi:0.878, happy:6.3, life:81.2, social:12.9, gdp:357371159574.862, taxTotal:67543149160 },
  { code:"COL", name:"콜롬비아", pit:39, burden:25.2, hdi:0.788, happy:6.04, life:77.7, social:14.1, gdp:457410034202.523, taxTotal:115267328619 },
  { code:"CRI", name:"코스타리카", pit:27.5, burden:24.9, hdi:0.833, happy:7.44, life:80.8, social:12.6, gdp:102904921157.478, taxTotal:25623325368 },
  { code:"CZE", name:"체코", pit:23, burden:33.7, hdi:0.915, happy:6.82, life:79.8, social:22.2, gdp:391026962800.475, taxTotal:131776086464 },
  { code:"DNK", name:"덴마크", pit:55.9, burden:43.4, hdi:0.962, happy:7.54, life:81.9, social:28.1, gdp:462526660468.393, taxTotal:200736570643 },
  { code:"EST", name:"에스토니아", pit:20, burden:33.5, hdi:0.905, happy:6.41, life:79.2, social:19, gdp:47030833798.5866, taxTotal:15755329323 },
  { code:"FIN", name:"핀란드", pit:51.4, burden:42.7, hdi:0.948, happy:7.76, life:81.9, social:31, gdp:317039368819.607, taxTotal:135375810486 },
  { code:"FRA", name:"프랑스", pit:55.4, burden:43.8, hdi:0.92, happy:6.59, life:83.3, social:31.4, gdp:3366315927447.33, taxTotal:1474446376222 },
  { code:"DEU", name:"독일", pit:47.5, burden:37.5, hdi:0.959, happy:6.88, life:81.4, social:28.9, gdp:5050922925047.05, taxTotal:1894096096893 },
  { code:"GRC", name:"그리스", pit:44, burden:39.8, hdi:0.908, happy:5.7, life:81.9, social:26.4, gdp:280635521324.441, taxTotal:111692937487 },
  { code:"HUN", name:"헝가리", pit:15, burden:34.2, hdi:0.87, happy:5.94, life:77, social:18.4, gdp:246490213513.054, taxTotal:84299653021 },
  { code:"ISL", name:"아이슬란드", pit:46.3, burden:35.6, hdi:0.972, happy:7.54, life:82.7, social:22.7, gdp:38582528789.0033, taxTotal:13735380249 },
  { code:"IRL", name:"아일랜드", pit:48, burden:21.9, hdi:0.949, happy:6.93, life:82.4, social:13.6, gdp:721701359046.313, taxTotal:158052597631 },
  { code:"ISR", name:"이스라엘", pit:50, burden:29.8, hdi:0.919, happy:7.19, life:82.4, social:16.3, gdp:610777842873.595, taxTotal:182011797176 },
  { code:"ITA", name:"이탈리아", pit:47.2, burden:42, hdi:0.915, happy:6.57, life:83.7, social:29.8, gdp:2551556954100.35, taxTotal:1071653920722 },
  { code:"JPN", name:"일본", pit:55.9, burden:34.9, hdi:0.925, happy:6.13, life:84.7, social:24.7, gdp:4435162999976.94, taxTotal:1547871886992 },
  { code:"KOR", name:"대한민국", pit:49.5, burden:26.9, hdi:0.937, happy:6.04, life:84.3, social:16.2, gdp:1872374961553.15, taxTotal:503668864658 },
  { code:"LVA", name:"라트비아", pit:31, burden:31.9, hdi:0.889, happy:6.37, life:76.2, social:21.7, gdp:48618869160.3254, taxTotal:15509419262 },
  { code:"LTU", name:"리투아니아", pit:32, burden:32.6, hdi:0.895, happy:6.7, life:76, social:19.3, gdp:95210150818.3512, taxTotal:31038509167 },
  { code:"LUX", name:"룩셈부르크", pit:45.8, burden:40.9, hdi:0.922, happy:7.06, life:82.2, social:21.5, gdp:101157829491.107, taxTotal:41373552262 },
  { code:"MEX", name:"멕시코", pit:35, burden:14.3, hdi:0.789, happy:6.97, life:75.1, social:10, gdp:1832641364775.52, taxTotal:262067715163 },
  { code:"NLD", name:"네덜란드", pit:49.5, burden:38.5, hdi:0.955, happy:7.22, life:82.2, social:19.8, gdp:1332767651100.39, taxTotal:513115545674 },
  { code:"NZL", name:"뉴질랜드", pit:39, burden:34.7, hdi:0.938, happy:7, life:82.1, social:24.6, gdp:264057413739.965, taxTotal:91627922568 },
  { code:"NOR", name:"노르웨이", pit:47.4, burden:41.4, hdi:0.97, happy:7.24, life:83.3, social:23.4, gdp:530755719438.879, taxTotal:219732867848 },
  { code:"POL", name:"폴란드", pit:36, burden:35.1, hdi:0.906, happy:6.77, life:78.6, social:22.2, gdp:1035491784197.44, taxTotal:363457616253 },
  { code:"PRT", name:"포르투갈", pit:53, burden:35.8, hdi:0.89, happy:6.03, life:82.4, social:25.5, gdp:346639825141.821, taxTotal:124097057401 },
  { code:"SVK", name:"슬로바키아", pit:25, burden:35.5, hdi:0.88, happy:6.26, life:78.3, social:19, gdp:154530066506.895, taxTotal:54858173610 },
  { code:"SVN", name:"슬로베니아", pit:50, burden:36.4, hdi:0.931, happy:6.87, life:81.6, social:24.5, gdp:79648204979.3618, taxTotal:28991946612 },
  { code:"ESP", name:"스페인", pit:47, burden:36.4, hdi:0.918, happy:6.54, life:83.7, social:28.4, gdp:1906453309985.88, taxTotal:693949004835 },
  { code:"SWE", name:"스웨덴", pit:52.3, burden:41.4, hdi:0.959, happy:7.26, life:83.3, social:26.3, gdp:668998664082.081, taxTotal:276965446930 },
  { code:"CHE", name:"스위스", pit:39.9, burden:26.8, hdi:0.97, happy:7.02, life:84, social:17.5, gdp:1043529899250.92, taxTotal:279666012999 },
  { code:"TUR", name:"튀르키예", pit:40.8, burden:23.2, hdi:0.853, happy:5.3, life:77.2, social:11, gdp:1597293229287, taxTotal:370572029195 },
  { code:"GBR", name:"영국", pit:45, burden:34.9, hdi:0.946, happy:6.69, life:81.3, social:22.7, gdp:4002587541846.01, taxTotal:1396903052104 },
  { code:"USA", name:"미국", pit:43.7, burden:24.8, hdi:0.938, happy:6.82, life:79.3, social:19, gdp:30769700000000, taxTotal:7630885600000 },
  { code:"CHN", name:"중국", pit:45, burden:22.1, hdi:0.797, happy:6.07, life:78, social:null, gdp:19498039388042.6, taxTotal:4309066704757 },
  { code:"IND", name:"인도", pit:42.7, burden:17.3, hdi:0.685, happy:4.54, life:72, social:null, gdp:3956067115771.63, taxTotal:684399611028 },
  { code:"BRA", name:"브라질", pit:27.5, burden:32.7, hdi:0.786, happy:6.63, life:75.8, social:null, gdp:2279920092492.13, taxTotal:745533870245 },
  { code:"RUS", name:"러시아", pit:22, burden:30.5, hdi:0.832, happy:5.83, life:73.2, social:null, gdp:2561310169358.74, taxTotal:781199601654 },
  { code:"IDN", name:"인도네시아", pit:35, burden:10.3, hdi:0.728, happy:5.62, life:71.1, social:null, gdp:1445642584163.81, taxTotal:148901186169 },
  { code:"ZAF", name:"남아프리카공화국", pit:45, burden:28.1, hdi:0.741, happy:5.01, life:66.1, social:null, gdp:427184325997.307, taxTotal:120038795605 },
  { code:"SGP", name:"싱가포르", pit:24, burden:14, hdi:0.946, happy:6.59, life:83.7, social:null, gdp:603869516998.738, taxTotal:84541732380 },
  { code:"ARG", name:"아르헨티나", pit:35, burden:29.6, hdi:0.865, happy:6.43, life:77.4, social:null, gdp:683097891618.597, taxTotal:202196975919 },
  { code:"SAU", name:"사우디아라비아", pit:0, burden:8, hdi:0.9, happy:6.82, life:78.7, social:null, gdp:1276942933333.33, taxTotal:102155434667 },
];
