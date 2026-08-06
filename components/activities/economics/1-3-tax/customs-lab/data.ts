// 관세(Tariff, Customs Duties) — 활동 데이터
// 출처
//  · 주요국 평균 관세율: WTO World Tariff Profiles (실행 MFN 관세율, 단순평균)
//  · 우리나라 품목별 관세율: 관세청 관세율표(HS 기준 실행세율)
//  · 소액물품 면세(자가사용): 관세법 시행규칙 — 미화 150달러 이하(미국발 200달러 이하)
//  · FTA 발효 현황: 산업통상자원부·관세청 FTA 포털

export const VAT_RATE = 0.1;

export const DATA_NOTE =
  "주요국 평균 관세율은 WTO World Tariff Profiles의 실행 MFN 관세율(단순평균)이고, 품목별 관세율은 관세청 관세율표의 실행세율입니다. 자가사용 소액물품 면세 한도는 관세법 시행규칙에 따라 물품가격 미화 150달러 이하(한·미 FTA 적용 미국발은 200달러 이하)입니다. 관세 과세가격은 물품가격에 운임·보험료를 더한 값(CIF)이며, 수입 부가가치세는 (과세가격+관세)의 10%입니다. FTA 발효 현황은 산업통상자원부·관세청 FTA 포털 기준입니다. 시뮬레이션의 환율은 직접 바꿀 수 있는 예시 값입니다.";

// ══════════════════════════════════════════════════════════════
// 탭 ① 주요국·주요 품목 관세 데이터
// ══════════════════════════════════════════════════════════════
export type CountryTariff = {
  code: string; // ISO3 (지도용)
  flag: string;
  name: string;
  all: number; // 전체 단순평균 실행 MFN 세율(%)
  ag: number; // 농산물
  nonAg: number; // 공산품
};

/** WTO World Tariff Profiles — 실행 MFN 관세율 단순평균(%) */
export const COUNTRY_TARIFFS: CountryTariff[] = [
  { code: "IND", flag: "🇮🇳", name: "인도", all: 18.1, ag: 39.6, nonAg: 14.7 },
  { code: "KOR", flag: "🇰🇷", name: "대한민국", all: 13.6, ag: 56.9, nonAg: 6.5 },
  { code: "BRA", flag: "🇧🇷", name: "브라질", all: 13.3, ag: 10.2, nonAg: 13.8 },
  { code: "TUR", flag: "🇹🇷", name: "튀르키예", all: 10.9, ag: 41.0, nonAg: 5.6 },
  { code: "THA", flag: "🇹🇭", name: "태국", all: 9.8, ag: 27.4, nonAg: 7.1 },
  { code: "VNM", flag: "🇻🇳", name: "베트남", all: 9.5, ag: 17.1, nonAg: 8.3 },
  { code: "IDN", flag: "🇮🇩", name: "인도네시아", all: 8.0, ag: 8.6, nonAg: 8.0 },
  { code: "CHN", flag: "🇨🇳", name: "중국", all: 7.5, ag: 13.8, nonAg: 6.5 },
  { code: "RUS", flag: "🇷🇺", name: "러시아", all: 6.6, ag: 10.2, nonAg: 6.1 },
  { code: "MEX", flag: "🇲🇽", name: "멕시코", all: 5.9, ag: 14.6, nonAg: 4.6 },
  { code: "CHE", flag: "🇨🇭", name: "스위스", all: 5.6, ag: 32.7, nonAg: 1.7 },
  { code: "EUU", flag: "🇪🇺", name: "유럽연합(EU)", all: 5.1, ag: 11.4, nonAg: 4.1 },
  { code: "CAN", flag: "🇨🇦", name: "캐나다", all: 3.8, ag: 14.7, nonAg: 2.1 },
  { code: "GBR", flag: "🇬🇧", name: "영국", all: 3.8, ag: 8.0, nonAg: 3.1 },
  { code: "JPN", flag: "🇯🇵", name: "일본", all: 3.7, ag: 15.5, nonAg: 2.5 },
  { code: "USA", flag: "🇺🇸", name: "미국", all: 3.3, ag: 5.1, nonAg: 3.1 },
  { code: "AUS", flag: "🇦🇺", name: "호주", all: 2.4, ag: 1.2, nonAg: 2.6 },
  { code: "SGP", flag: "🇸🇬", name: "싱가포르", all: 0.0, ag: 0.0, nonAg: 0.0 },
];

export type TariffMetric = "all" | "ag" | "nonAg";
export const TARIFF_METRICS: Record<TariffMetric, { label: string; short: string }> = {
  all: { label: "전체 평균", short: "전체" },
  ag: { label: "농산물", short: "농산물" },
  nonAg: { label: "공산품", short: "공산품" },
};

export type ItemGroup = "농·축·수산물" | "식품·음료" | "공산품" | "무관세(0%)";

export type ItemTariff = {
  emoji: string;
  name: string;
  rate: number; // 우리나라 실행세율(%)
  group: ItemGroup;
  note: string;
};

/** 관세청 관세율표 — 우리나라 주요 품목의 실행세율(%) */
export const ITEM_TARIFFS: ItemTariff[] = [
  // 농·축·수산물 — 국내 농업 보호를 위한 고율 관세
  { emoji: "🌿", name: "인삼(홍삼)", rate: 754.3, group: "농·축·수산물", note: "우리나라에서 가장 관세가 높은 품목 중 하나예요." },
  { emoji: "🌰", name: "참깨", rate: 630, group: "농·축·수산물", note: "국내 재배 농가를 보호하기 위한 고율 관세예요." },
  { emoji: "🍚", name: "쌀", rate: 513, group: "농·축·수산물", note: "정해진 물량(TRQ)을 넘겨 수입할 때 붙는 세율이에요." },
  { emoji: "🫘", name: "대두(콩)", rate: 487, group: "농·축·수산물", note: "정해진 물량을 넘는 수입분에 붙어요." },
  { emoji: "🧄", name: "마늘", rate: 360, group: "농·축·수산물", note: "1990년대 ‘마늘 파동’의 배경이 된 품목이에요." },
  { emoji: "🌶️", name: "고추(건고추)", rate: 270, group: "농·축·수산물", note: "국내 생산 보호를 위한 고율 관세예요." },
  { emoji: "🍯", name: "천연 꿀", rate: 243, group: "농·축·수산물", note: "양봉 농가 보호를 위한 고율 관세예요." },
  { emoji: "🍼", name: "분유", rate: 176, group: "농·축·수산물", note: "낙농 산업 보호를 위한 관세예요." },
  { emoji: "🥩", name: "쇠고기", rate: 40, group: "농·축·수산물", note: "FTA로 단계적으로 낮아지고 있어요." },
  { emoji: "🍊", name: "오렌지", rate: 50, group: "농·축·수산물", note: "제철에 국내 감귤과 경쟁하므로 높게 매겨요." },
  { emoji: "🍌", name: "바나나", rate: 30, group: "농·축·수산물", note: "국내 생산이 적지만 과일 시장 보호를 위해 관세가 있어요." },
  { emoji: "🥓", name: "돼지고기", rate: 22.5, group: "농·축·수산물", note: "부위·냉장/냉동에 따라 조금씩 달라요." },

  // 식품·음료
  { emoji: "🥃", name: "위스키", rate: 20, group: "식품·음료", note: "관세 외에 주세·교육세도 함께 붙어요." },
  { emoji: "🍷", name: "포도주(와인)", rate: 15, group: "식품·음료", note: "FTA 체결국에서는 0%인 경우가 많아요." },
  { emoji: "🍫", name: "초콜릿", rate: 8, group: "식품·음료", note: "가공식품의 일반적인 세율이에요." },
  { emoji: "☕", name: "커피 원두(볶은 것)", rate: 8, group: "식품·음료", note: "볶지 않은 생두는 2%로 더 낮아요." },
  { emoji: "🌱", name: "커피 생두", rate: 2, group: "식품·음료", note: "국내에서 가공할 원재료라 낮게 매겨요." },

  // 공산품
  { emoji: "👕", name: "의류", rate: 13, group: "공산품", note: "수업 자료의 예시(미국에서 의류 수입 13%)와 같은 세율이에요." },
  { emoji: "👟", name: "신발", rate: 13, group: "공산품", note: "국내 섬유·신발 산업 보호를 위해 상대적으로 높아요." },
  { emoji: "👜", name: "가방", rate: 8, group: "공산품", note: "일반 공산품의 대표 세율이에요." },
  { emoji: "💄", name: "화장품", rate: 8, group: "공산품", note: "일반 공산품의 대표 세율이에요." },
  { emoji: "🚗", name: "승용자동차", rate: 8, group: "공산품", note: "한·미, 한·EU FTA로 해당 국가에서는 0%예요." },
  { emoji: "📺", name: "TV", rate: 8, group: "공산품", note: "가전제품의 일반 세율이에요." },
  { emoji: "🧸", name: "완구", rate: 8, group: "공산품", note: "일반 공산품의 대표 세율이에요." },

  // 무관세
  { emoji: "💻", name: "노트북·컴퓨터", rate: 0, group: "무관세(0%)", note: "WTO 정보기술협정(ITA)에 따라 무관세예요." },
  { emoji: "📱", name: "휴대전화", rate: 0, group: "무관세(0%)", note: "WTO 정보기술협정(ITA)에 따라 무관세예요." },
  { emoji: "🔌", name: "반도체", rate: 0, group: "무관세(0%)", note: "WTO 정보기술협정(ITA)에 따라 무관세예요." },
  { emoji: "📚", name: "책", rate: 0, group: "무관세(0%)", note: "지식·문화 교류를 위해 무관세예요." },
  { emoji: "✈️", name: "항공기", rate: 0, group: "무관세(0%)", note: "국내에서 생산하지 않는 대형 장비는 무관세인 경우가 많아요." },
];

export const ITEM_GROUPS: ItemGroup[] = ["농·축·수산물", "식품·음료", "공산품", "무관세(0%)"];

// ══════════════════════════════════════════════════════════════
// 탭 ② 해외직구 관세 시뮬레이터
// ══════════════════════════════════════════════════════════════
export type FtaKind = "full" | "partial" | "none";

export type SimCountry = {
  code: string;
  flag: string;
  name: string;
  fta: string | null; // 협정 이름
  ftaYear: string | null; // 발효 시기
  kind: FtaKind;
  deMinimis: number; // 자가사용 소액물품 면세 한도(USD, 물품가격 기준)
  note: string;
};

export const SIM_COUNTRIES: SimCountry[] = [
  {
    code: "USA", flag: "🇺🇸", name: "미국", fta: "한·미 FTA", ftaYear: "2012.3", kind: "full", deMinimis: 200,
    note: "한·미 FTA로 대부분의 공산품 관세가 0%예요. 미국발 물품은 면세 한도도 200달러로 더 넉넉해요(협정에 따른 특례).",
  },
  {
    code: "DEU", flag: "🇩🇪", name: "독일 (EU)", fta: "한·EU FTA", ftaYear: "2011.7", kind: "full", deMinimis: 150,
    note: "한·EU FTA로 EU 27개국에서 오는 대부분의 공산품 관세가 0%예요.",
  },
  {
    code: "GBR", flag: "🇬🇧", name: "영국", fta: "한·영 FTA", ftaYear: "2021.1", kind: "full", deMinimis: 150,
    note: "영국이 EU를 떠난 뒤(브렉시트) 따로 맺은 협정으로, 한·EU FTA와 비슷한 혜택이 이어져요.",
  },
  {
    code: "VNM", flag: "🇻🇳", name: "베트남", fta: "한·베트남 FTA", ftaYear: "2015.12", kind: "full", deMinimis: 150,
    note: "한·아세안 FTA에 더해 베트남과 따로 맺은 협정으로 관세가 더 낮아졌어요.",
  },
  {
    code: "AUS", flag: "🇦🇺", name: "호주", fta: "한·호주 FTA", ftaYear: "2014.12", kind: "full", deMinimis: 150,
    note: "한·호주 FTA로 대부분의 공산품 관세가 0%예요.",
  },
  {
    code: "CHN", flag: "🇨🇳", name: "중국", fta: "한·중 FTA", ftaYear: "2015.12", kind: "partial", deMinimis: 150,
    note: "한·중 FTA는 품목마다 관세를 없애는 시기가 달라서 아직 관세가 남은 품목이 많아요. 여기서는 기본 관세율로 계산해요.",
  },
  {
    code: "JPN", flag: "🇯🇵", name: "일본", fta: null, ftaYear: null, kind: "none", deMinimis: 150,
    note: "일본과는 두 나라끼리 맺은 FTA가 없어요. RCEP(2022 발효)으로 일부 품목만 조금씩 낮아지는 중이라, 대부분은 기본 관세율이 그대로 붙어요.",
  },
  {
    code: "IND", flag: "🇮🇳", name: "인도", fta: "한·인도 CEPA", ftaYear: "2010.1", kind: "partial", deMinimis: 150,
    note: "한·인도 CEPA는 관세를 완전히 없애기보다 낮추는 품목이 많아요. 여기서는 기본 관세율로 계산해요.",
  },
];

export type SimItem = {
  id: string;
  emoji: string;
  name: string;
  hs: string;
  rate: number; // 기본(MFN) 관세율 %
  price: number; // 예시 물품가격(USD)
  noDeMinimis?: boolean; // 소액 면세가 그대로 적용되지 않는 품목
  note?: string;
};

export const SIM_ITEMS: SimItem[] = [
  { id: "cloth", emoji: "👕", name: "의류(후드티)", hs: "6110", rate: 13, price: 60 },
  { id: "shoes", emoji: "👟", name: "운동화", hs: "6404", rate: 13, price: 120 },
  { id: "bag", emoji: "👜", name: "가방", hs: "4202", rate: 8, price: 250 },
  { id: "cosmetic", emoji: "💄", name: "화장품", hs: "3304", rate: 8, price: 80 },
  { id: "watch", emoji: "⌚", name: "손목시계", hs: "9102", rate: 8, price: 300 },
  { id: "headphone", emoji: "🎧", name: "헤드폰", hs: "8518", rate: 8, price: 200 },
  { id: "tv", emoji: "📺", name: "TV", hs: "8528", rate: 8, price: 700 },
  { id: "toy", emoji: "🧸", name: "장난감·피규어", hs: "9503", rate: 8, price: 90 },
  { id: "golf", emoji: "🏌️", name: "골프채", hs: "9506", rate: 8, price: 500 },
  { id: "vitamin", emoji: "💊", name: "건강기능식품(비타민)", hs: "2106", rate: 8, price: 60, note: "건강기능식품은 간편한 목록통관 대상이 아니어서 따로 신고해야 해요." },
  { id: "coffee", emoji: "☕", name: "커피 원두(볶은 것)", hs: "0901", rate: 8, price: 40 },
  { id: "choco", emoji: "🍫", name: "초콜릿", hs: "1806", rate: 8, price: 30 },
  { id: "wine", emoji: "🍷", name: "포도주(와인)", hs: "2204", rate: 15, price: 60, noDeMinimis: true, note: "술·담배는 소액 면세가 그대로 적용되지 않고, 관세 외에 주세·교육세도 따로 붙어요(여기서는 관세와 부가세만 계산해요)." },
  { id: "laptop", emoji: "💻", name: "노트북", hs: "8471", rate: 0, price: 1200, note: "WTO 정보기술협정(ITA)으로 관세가 0%예요." },
  { id: "phone", emoji: "📱", name: "스마트폰", hs: "8517", rate: 0, price: 900, note: "WTO 정보기술협정(ITA)으로 관세가 0%예요." },
  { id: "book", emoji: "📚", name: "책", hs: "4901", rate: 0, price: 40, note: "책은 관세가 0%예요." },
];

export type DutyResult = {
  goodsKRW: number; // 물품가격(원)
  shipKRW: number; // 배송비(원)
  customsValue: number; // 과세가격 = 물품가격 + 운임(CIF)
  exempt: boolean; // 소액물품 면세 여부
  appliedRate: number; // 실제 적용 관세율(%)
  mfnRate: number; // 기본 관세율(%)
  duty: number; // 관세
  vat: number; // 수입 부가가치세
  totalTax: number;
  totalPay: number; // 최종 지불 금액
  ftaApplied: boolean; // FTA 협정세율 적용 여부
};

/** 해외직구 세금 계산. useFta = 원산지증명서를 갖춰 협정세율을 신청한 경우 */
export function calcDuty(
  country: SimCountry,
  item: SimItem,
  goodsUSD: number,
  shipUSD: number,
  rateKRW: number,
  useFta: boolean
): DutyResult {
  const goodsKRW = Math.round(goodsUSD * rateKRW);
  const shipKRW = Math.round(shipUSD * rateKRW);
  const customsValue = goodsKRW + shipKRW;

  const exempt = !item.noDeMinimis && goodsUSD <= country.deMinimis;
  const ftaApplied = useFta && country.kind === "full" && !exempt;
  const appliedRate = exempt ? 0 : ftaApplied ? 0 : item.rate;

  const duty = exempt ? 0 : Math.round((customsValue * appliedRate) / 100);
  const vat = exempt ? 0 : Math.round((customsValue + duty) * VAT_RATE);
  const totalTax = duty + vat;
  return {
    goodsKRW,
    shipKRW,
    customsValue,
    exempt,
    appliedRate,
    mfnRate: item.rate,
    duty,
    vat,
    totalTax,
    totalPay: customsValue + totalTax,
    ftaApplied,
  };
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 우리나라의 FTA 지도
// ══════════════════════════════════════════════════════════════
export type FtaCountry = { code: string; ko: string };
export type Fta = {
  id: string;
  name: string;
  ym: string; // 발효 시기
  year: number;
  countries: FtaCountry[];
  note?: string;
};

/** 발효일 순. 산업통상자원부·관세청 FTA 포털 기준 */
export const FTAS: Fta[] = [
  { id: "chl", name: "한·칠레 FTA", ym: "2004.4", year: 2004, countries: [{ code: "CHL", ko: "칠레" }], note: "우리나라가 처음으로 맺은 FTA예요." },
  { id: "sgp", name: "한·싱가포르 FTA", ym: "2006.3", year: 2006, countries: [{ code: "SGP", ko: "싱가포르" }] },
  {
    id: "efta", name: "한·EFTA FTA", ym: "2006.9", year: 2006,
    countries: [
      { code: "CHE", ko: "스위스" }, { code: "NOR", ko: "노르웨이" },
      { code: "ISL", ko: "아이슬란드" }, { code: "LIE", ko: "리히텐슈타인" },
    ],
    note: "EFTA는 EU에 속하지 않은 유럽 4개국의 모임이에요.",
  },
  {
    id: "asean", name: "한·아세안 FTA", ym: "2007.6", year: 2007,
    countries: [
      { code: "BRN", ko: "브루나이" }, { code: "KHM", ko: "캄보디아" }, { code: "IDN", ko: "인도네시아" },
      { code: "LAO", ko: "라오스" }, { code: "MYS", ko: "말레이시아" }, { code: "MMR", ko: "미얀마" },
      { code: "PHL", ko: "필리핀" }, { code: "SGP", ko: "싱가포르" }, { code: "THA", ko: "태국" },
      { code: "VNM", ko: "베트남" },
    ],
    note: "동남아시아 10개국과 한 번에 맺은 협정이에요.",
  },
  { id: "ind", name: "한·인도 CEPA", ym: "2010.1", year: 2010, countries: [{ code: "IND", ko: "인도" }] },
  {
    id: "eu", name: "한·EU FTA", ym: "2011.7", year: 2011,
    countries: [
      { code: "GRC", ko: "그리스" }, { code: "NLD", ko: "네덜란드" }, { code: "DNK", ko: "덴마크" },
      { code: "DEU", ko: "독일" }, { code: "LVA", ko: "라트비아" }, { code: "ROU", ko: "루마니아" },
      { code: "LUX", ko: "룩셈부르크" }, { code: "LTU", ko: "리투아니아" }, { code: "MLT", ko: "몰타" },
      { code: "BEL", ko: "벨기에" }, { code: "BGR", ko: "불가리아" }, { code: "SWE", ko: "스웨덴" },
      { code: "ESP", ko: "스페인" }, { code: "SVK", ko: "슬로바키아" }, { code: "SVN", ko: "슬로베니아" },
      { code: "IRL", ko: "아일랜드" }, { code: "EST", ko: "에스토니아" }, { code: "AUT", ko: "오스트리아" },
      { code: "ITA", ko: "이탈리아" }, { code: "CZE", ko: "체코" }, { code: "HRV", ko: "크로아티아" },
      { code: "CYP", ko: "키프로스" }, { code: "PRT", ko: "포르투갈" }, { code: "POL", ko: "폴란드" },
      { code: "FRA", ko: "프랑스" }, { code: "FIN", ko: "핀란드" }, { code: "HUN", ko: "헝가리" },
    ],
    note: "유럽연합 27개국과 한 번에 맺은 협정이에요.",
  },
  { id: "per", name: "한·페루 FTA", ym: "2011.8", year: 2011, countries: [{ code: "PER", ko: "페루" }] },
  { id: "usa", name: "한·미 FTA", ym: "2012.3", year: 2012, countries: [{ code: "USA", ko: "미국" }], note: "우리나라 수출입에서 비중이 매우 큰 협정이에요." },
  { id: "tur", name: "한·튀르키예 FTA", ym: "2013.5", year: 2013, countries: [{ code: "TUR", ko: "튀르키예" }] },
  { id: "aus", name: "한·호주 FTA", ym: "2014.12", year: 2014, countries: [{ code: "AUS", ko: "호주" }] },
  { id: "can", name: "한·캐나다 FTA", ym: "2015.1", year: 2015, countries: [{ code: "CAN", ko: "캐나다" }] },
  { id: "chn", name: "한·중 FTA", ym: "2015.12", year: 2015, countries: [{ code: "CHN", ko: "중국" }], note: "품목마다 관세를 없애는 시기를 길게 나눈 협정이에요." },
  { id: "nzl", name: "한·뉴질랜드 FTA", ym: "2015.12", year: 2015, countries: [{ code: "NZL", ko: "뉴질랜드" }] },
  { id: "vnm", name: "한·베트남 FTA", ym: "2015.12", year: 2015, countries: [{ code: "VNM", ko: "베트남" }] },
  { id: "col", name: "한·콜롬비아 FTA", ym: "2016.7", year: 2016, countries: [{ code: "COL", ko: "콜롬비아" }] },
  { id: "gbr", name: "한·영 FTA", ym: "2021.1", year: 2021, countries: [{ code: "GBR", ko: "영국" }], note: "영국이 EU를 떠난 뒤 따로 맺었어요." },
  {
    id: "cam", name: "한·중미 FTA", ym: "2021.3", year: 2021,
    countries: [
      { code: "CRI", ko: "코스타리카" }, { code: "SLV", ko: "엘살바도르" }, { code: "HND", ko: "온두라스" },
      { code: "NIC", ko: "니카라과" }, { code: "PAN", ko: "파나마" },
    ],
  },
  {
    id: "rcep", name: "RCEP (역내포괄적경제동반자협정)", ym: "2022.2", year: 2022,
    countries: [
      { code: "JPN", ko: "일본" }, { code: "CHN", ko: "중국" }, { code: "AUS", ko: "호주" },
      { code: "NZL", ko: "뉴질랜드" }, { code: "BRN", ko: "브루나이" }, { code: "KHM", ko: "캄보디아" },
      { code: "IDN", ko: "인도네시아" }, { code: "LAO", ko: "라오스" }, { code: "MYS", ko: "말레이시아" },
      { code: "MMR", ko: "미얀마" }, { code: "PHL", ko: "필리핀" }, { code: "SGP", ko: "싱가포르" },
      { code: "THA", ko: "태국" }, { code: "VNM", ko: "베트남" },
    ],
    note: "15개국이 함께 맺은 세계 최대 규모의 협정으로, 일본과 연결된 유일한 통로예요(두 나라끼리 맺은 FTA는 없어요).",
  },
  { id: "isr", name: "한·이스라엘 FTA", ym: "2022.12", year: 2022, countries: [{ code: "ISR", ko: "이스라엘" }] },
  { id: "khm", name: "한·캄보디아 FTA", ym: "2022.12", year: 2022, countries: [{ code: "KHM", ko: "캄보디아" }] },
  { id: "idn", name: "한·인도네시아 CEPA", ym: "2023.1", year: 2023, countries: [{ code: "IDN", ko: "인도네시아" }] },
  { id: "phl", name: "한·필리핀 FTA", ym: "2024.12", year: 2024, countries: [{ code: "PHL", ko: "필리핀" }] },
];

/** 지도에 표시할 국가 → 가장 먼저 발효된 협정 정보 */
export type FtaCountryInfo = { code: string; ko: string; firstYear: number; firstYm: string; ftaIds: string[]; ftaNames: string[] };

export function buildFtaMap(): Record<string, FtaCountryInfo> {
  const map: Record<string, FtaCountryInfo> = {};
  for (const f of FTAS) {
    for (const c of f.countries) {
      const cur = map[c.code];
      if (!cur) {
        map[c.code] = { code: c.code, ko: c.ko, firstYear: f.year, firstYm: f.ym, ftaIds: [f.id], ftaNames: [f.name] };
      } else {
        cur.ftaIds.push(f.id);
        cur.ftaNames.push(f.name);
        if (f.year < cur.firstYear) { cur.firstYear = f.year; cur.firstYm = f.ym; }
      }
    }
  }
  return map;
}

/** 발효 시기 구간(지도 색) */
export type Era = { id: string; label: string; from: number; to: number; color: string };
export const ERAS: Era[] = [
  { id: "e1", label: "2004~2010", from: 2004, to: 2010, color: "#0e7490" },
  { id: "e2", label: "2011~2015", from: 2011, to: 2015, color: "#0d9488" },
  { id: "e3", label: "2016~2020", from: 2016, to: 2020, color: "#34d399" },
  { id: "e4", label: "2021~", from: 2021, to: 9999, color: "#a7f3d0" },
];
export function eraOf(year: number): Era {
  return ERAS.find((e) => year >= e.from && year <= e.to) ?? ERAS[ERAS.length - 1];
}

/** 지도에 도형이 없는 아주 작은 나라는 점으로 표시 (등장방형 투영: x=(경도+180)×2, y=(83−위도)×2) */
export const TINY_MARKS: Record<string, { x: number; y: number }> = {
  SGP: { x: 568, y: 163 },
  LIE: { x: 379, y: 72 },
};

export const KOREA_CODE = "KOR";
