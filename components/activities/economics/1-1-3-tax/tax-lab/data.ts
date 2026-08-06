// 대한민국 세금의 종류 — 활동 데이터
// 출처·기준: 국세청·행정안전부(지방세)·관세청 현행 세법(2025년 기준).
// 세율은 개정·탄력세율·감면에 따라 달라질 수 있어, 화면에도 이 점을 명시한다.

export const DATA_NOTE =
  "국세청·행정안전부·관세청 현행 세법(2025년 기준). 세율은 법 개정·탄력세율·감면에 따라 달라질 수 있어요.";

export type TaxLevel = "국세" | "지방세";
export type DirectIndirect = "직접세" | "간접세";

export type TaxCard = {
  id: string;
  name: string;
  emoji: string;
  level: TaxLevel;
  /** 표에서의 세부 분류 경로 (예: "내국세 · 보통세 · 직접세") */
  path: string;
  /** 국세 내국세 보통세만 직접/간접 구분이 있다 */
  di?: DirectIndirect;
  payer: string; // 누가 내나
  def: string; // 한 줄 정의
  example: string; // 실생활 사례
  rate: string; // 세율·특징
};

// ─── 국세 · 내국세 · 보통세 · 직접세 (5) ───────────────────────
export const TAX_DIRECT: TaxCard[] = [
  {
    id: "income",
    name: "소득세",
    emoji: "💼",
    level: "국세",
    path: "내국세 · 보통세 · 직접세",
    di: "직접세",
    payer: "소득을 번 개인",
    def: "개인이 한 해 동안 번 소득에 매기는 세금.",
    example: "회사원의 월급에서 미리 떼는(원천징수) 세금, 자영업자의 종합소득세 신고.",
    rate: "과세표준에 따라 6%~45% 8단계 누진세율.",
  },
  {
    id: "corporate",
    name: "법인세",
    emoji: "🏢",
    level: "국세",
    path: "내국세 · 보통세 · 직접세",
    di: "직접세",
    payer: "이익을 낸 회사(법인)",
    def: "회사(법인)가 벌어들인 이익(소득)에 매기는 세금.",
    example: "기업이 1년 장사해서 남긴 순이익에 대해 내는 세금.",
    rate: "과세표준 2억 이하 9% ~ 3,000억 초과 24% 누진.",
  },
  {
    id: "comprehensive_realestate",
    name: "종합부동산세",
    emoji: "🏙️",
    level: "국세",
    path: "내국세 · 보통세 · 직접세",
    di: "직접세",
    payer: "고액 부동산을 가진 사람",
    def: "일정 금액을 넘는 주택·토지를 가진 사람에게 추가로 매기는 세금.",
    example: "공시가격이 큰 집이나 여러 채의 집을 가진 사람이 재산세와 별도로 냄.",
    rate: "공시가격 합계가 기준(1세대 1주택 12억 등) 초과분에 누진세율.",
  },
  {
    id: "inheritance",
    name: "상속세",
    emoji: "🕊️",
    level: "국세",
    path: "내국세 · 보통세 · 직접세",
    di: "직접세",
    payer: "재산을 물려받은 사람",
    def: "사망한 사람의 재산을 물려받을 때 그 재산에 매기는 세금.",
    example: "부모님이 남긴 집·예금 등을 자녀가 물려받을 때.",
    rate: "과세표준 1억 이하 10% ~ 30억 초과 50% 5단계 누진.",
  },
  {
    id: "gift",
    name: "증여세",
    emoji: "🎁",
    level: "국세",
    path: "내국세 · 보통세 · 직접세",
    di: "직접세",
    payer: "재산을 무상으로 받은 사람",
    def: "살아 있는 사람에게서 재산을 공짜로 받을 때 매기는 세금.",
    example: "부모가 자녀에게 집 살 돈이나 부동산을 나눠 줄 때.",
    rate: "상속세와 같은 10%~50% 누진(10년간 일정액 공제).",
  },
];

// ─── 국세 · 내국세 · 보통세 · 간접세 (5) ───────────────────────
export const TAX_INDIRECT: TaxCard[] = [
  {
    id: "vat",
    name: "부가가치세",
    emoji: "🧾",
    level: "국세",
    path: "내국세 · 보통세 · 간접세",
    di: "간접세",
    payer: "물건·서비스를 산 소비자(가게가 대신 냄)",
    def: "물건이나 서비스를 사고팔 때 붙는, 우리가 가장 자주 내는 세금.",
    example: "편의점 음료·식당 밥값·옷값에 이미 포함되어 있음(영수증의 '부가세').",
    rate: "공급가액의 10%.",
  },
  {
    id: "individual_consumption",
    name: "개별소비세",
    emoji: "💎",
    level: "국세",
    path: "내국세 · 보통세 · 간접세",
    di: "간접세",
    payer: "특정 물품·장소를 이용한 소비자",
    def: "승용차·보석 같은 특정 물품이나 유흥·카지노 등에 따로 매기는 세금.",
    example: "자동차를 살 때, 고급 시계·가방을 살 때, 경마장·카지노 이용 시.",
    rate: "물품·장소별로 다름(승용차 공장도가의 5% 등).",
  },
  {
    id: "liquor",
    name: "주세",
    emoji: "🍶",
    level: "국세",
    path: "내국세 · 보통세 · 간접세",
    di: "간접세",
    payer: "술을 산 소비자(제조·수입자가 대신 냄)",
    def: "술에 매기는 세금.",
    example: "마트·식당에서 파는 맥주·소주 등 술값에 포함.",
    rate: "맥주·탁주는 양(L)당(종량세), 그 밖은 가격 비율(종가세).",
  },
  {
    id: "stamp",
    name: "인지세",
    emoji: "📜",
    level: "국세",
    path: "내국세 · 보통세 · 간접세",
    di: "간접세",
    payer: "증서·문서를 만든 사람",
    def: "부동산 계약서·통장 등 재산에 관한 문서를 만들 때 내는 세금.",
    example: "집을 사고팔 때 쓰는 매매계약서, 은행 대출 약정서.",
    rate: "문서의 기재 금액에 따라 정해진 금액(정액).",
  },
  {
    id: "securities_transaction",
    name: "증권거래세",
    emoji: "📈",
    level: "국세",
    path: "내국세 · 보통세 · 간접세",
    di: "간접세",
    payer: "주식을 판 사람",
    def: "주식을 팔 때 그 거래금액에 매기는 세금.",
    example: "증권 앱에서 가지고 있던 주식을 매도할 때.",
    rate: "매도금액의 약 0.15%(2025년, 시장별 상이).",
  },
];

// ─── 국세 · 내국세 · 목적세 (3) + 관세 (1) ────────────────────
export const TAX_NATIONAL_OTHER: TaxCard[] = [
  {
    id: "education",
    name: "교육세",
    emoji: "🎓",
    level: "국세",
    path: "내국세 · 목적세",
    payer: "금융·보험업자, 개별소비세·주세 납세자 등",
    def: "교육에 쓸 돈을 마련하려고 다른 세금 등에 얹어 매기는 목적세.",
    example: "은행·보험사의 수익, 개별소비세·주세 등에 함께 붙음.",
    rate: "금융·보험 수익금액 0.5%, 개별소비세·주세 등의 일정 비율.",
  },
  {
    id: "transport_energy_env",
    name: "교통·에너지·환경세",
    emoji: "⛽",
    level: "국세",
    path: "내국세 · 목적세",
    payer: "휘발유·경유를 산 소비자",
    def: "도로·교통·에너지·환경 사업에 쓰려고 휘발유·경유에 매기는 목적세(유류세의 핵심).",
    example: "주유소에서 기름을 넣을 때 기름값에 이미 포함.",
    rate: "휘발유 529원/L, 경유 375원/L(법정 기본, 탄력세율로 변동).",
  },
  {
    id: "rural_special",
    name: "농어촌특별세",
    emoji: "🌾",
    level: "국세",
    path: "내국세 · 목적세",
    payer: "특정 세금 감면·거래를 한 사람",
    def: "농어촌을 지원할 돈을 마련하려고 특정 감면·거래에 얹어 매기는 목적세.",
    example: "주식을 팔 때(증권거래), 취득세를 감면받을 때 함께 붙음.",
    rate: "대상별로 다름(예: 증권거래분 0.15%).",
  },
  {
    id: "customs",
    name: "관세",
    emoji: "🛃",
    level: "국세",
    path: "관세",
    payer: "물품을 수입한 사람",
    def: "외국에서 물건을 수입할 때 그 물품에 매기는 세금.",
    example: "해외직구로 옷·신발을 살 때(면세 기준을 넘으면 부과), 수입 자동차·식품.",
    rate: "물품 종류(품목)별로 다른 관세율(수입가격 × 관세율).",
  },
];

// ─── 지방세 (11) — 도세 보통세 4 · 도세 목적세 2 · 시군세 5 ────────
export const TAX_LOCAL: TaxCard[] = [
  {
    id: "acquisition",
    name: "취득세",
    emoji: "🏠",
    level: "지방세",
    path: "도세 · 보통세",
    payer: "부동산·자동차 등을 새로 산(취득한) 사람",
    def: "집·땅·자동차 등을 사서 갖게 될 때 내는 세금.",
    example: "집을 살 때, 자동차를 새로 등록할 때.",
    rate: "주택 1~3%(가격 구간별), 자동차 7%(비영업 승용) 등.",
  },
  {
    id: "registration_license",
    name: "등록면허세",
    emoji: "🖋️",
    level: "지방세",
    path: "도세 · 보통세",
    payer: "등기·등록을 하거나 면허를 받는 사람",
    def: "재산의 등기·등록을 하거나 각종 면허·허가를 받을 때 내는 세금.",
    example: "부동산 등기, 법인 설립 등기, 각종 인·허가.",
    rate: "등록분은 정액·정률, 면허분은 종류별 정액.",
  },
  {
    id: "leisure",
    name: "레저세",
    emoji: "🏇",
    level: "지방세",
    path: "도세 · 보통세",
    payer: "경마·경륜 등에 베팅한 사람",
    def: "경마·경륜·경정 등의 승자투표권을 살 때 매기는 세금.",
    example: "경마장·경륜장에서 마권·투표권을 살 때.",
    rate: "발매금액의 10%.",
  },
  {
    id: "local_consumption",
    name: "지방소비세",
    emoji: "🛍️",
    level: "지방세",
    path: "도세 · 보통세",
    payer: "물건·서비스를 산 소비자",
    def: "부가가치세의 일부를 지방자치단체 몫으로 돌린 세금.",
    example: "물건을 살 때 낸 부가가치세 중 일부가 지방소비세로 지방에 감.",
    rate: "부가가치세액의 약 25.3%를 지방으로.",
  },
  {
    id: "local_education",
    name: "지방교육세",
    emoji: "🏫",
    level: "지방세",
    path: "도세 · 목적세",
    payer: "취득세·재산세·자동차세 등을 내는 사람",
    def: "지방 교육재정을 위해 다른 지방세에 얹어 매기는 목적세.",
    example: "자동차세·취득세·재산세를 낼 때 함께 붙음.",
    rate: "대상 세금의 일정 비율(예: 자동차세의 30%).",
  },
  {
    id: "regional_resource",
    name: "지역자원시설세",
    emoji: "🚒",
    level: "지방세",
    path: "도세 · 목적세",
    payer: "특정 자원 이용자·건축물 소유자 등",
    def: "지역 자원 보호나 소방시설 등에 쓰려고 매기는 목적세.",
    example: "건축물의 소방분, 발전·지하수 등 자원 이용.",
    rate: "대상별 정해진 세율(소방분·특정자원분 등).",
  },
  {
    id: "tobacco_consumption",
    name: "담배소비세",
    emoji: "🚬",
    level: "지방세",
    path: "시·군세",
    payer: "담배를 산 소비자(제조·수입자가 대신 냄)",
    def: "담배에 매기는 세금.",
    example: "편의점에서 담배를 살 때 담뱃값에 포함.",
    rate: "궐련 20개비(1갑)당 1,007원.",
  },
  {
    id: "resident",
    name: "주민세",
    emoji: "🏘️",
    level: "지방세",
    path: "시·군세",
    payer: "그 지역에 사는 개인·사업소",
    def: "지역 주민이라는 이유로 매년 내는 세금(개인분·사업소분·종업원분).",
    example: "매년 8월, 주소지 지자체에 내는 개인분 주민세.",
    rate: "개인분은 지자체별 정액(1만 원 안팎).",
  },
  {
    id: "local_income",
    name: "지방소득세",
    emoji: "🧮",
    level: "지방세",
    path: "시·군세",
    payer: "소득이 있는 개인·법인",
    def: "소득세·법인세를 낼 때 지방에도 함께 내는 세금.",
    example: "연말정산·종합소득세 신고 때 소득세와 함께.",
    rate: "소득세·법인세 산출세액의 10%.",
  },
  {
    id: "property",
    name: "재산세",
    emoji: "🧱",
    level: "지방세",
    path: "시·군세",
    payer: "토지·건물·주택 등을 가진 사람",
    def: "집·땅·건물 등 재산을 '가지고 있다'는 이유로 매년 내는 세금.",
    example: "집을 소유하면 매년 7월·9월에 부과.",
    rate: "주택 0.1~0.4% 누진 등 재산 종류별.",
  },
  {
    id: "automobile",
    name: "자동차세",
    emoji: "🚗",
    level: "지방세",
    path: "시·군세",
    payer: "자동차를 가진 사람",
    def: "자동차를 소유한 것에 매년 매기는 세금(주행분은 유류에 포함).",
    example: "차를 가지고 있으면 매년 6월·12월에 부과.",
    rate: "승용(비영업) 배기량 cc당 80~200원 + 지방교육세.",
  },
];

// 전체 카드 (탐색 탭 필터용)
export const ALL_TAX_CARDS: TaxCard[] = [
  ...TAX_DIRECT,
  ...TAX_INDIRECT,
  ...TAX_NATIONAL_OTHER,
  ...TAX_LOCAL,
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 하루 소비 시뮬레이터 — 실제 세율로 계산한 항목
// (담배·주류는 청소년 대상이라 선택지에서 제외; 개념은 탭① 카드에서 다룸)
// ══════════════════════════════════════════════════════════════
export type SimTaxLine = { taxId: string; label: string; amount: number; level: TaxLevel };
export type SimItem = {
  id: string;
  emoji: string;
  title: string;
  desc: string; // 상황 설명(가격 포함)
  taxes: SimTaxLine[];
  note?: string; // 계산 근거·주의
};

export const SIM_ITEMS: SimItem[] = [
  {
    id: "drink",
    emoji: "🥤",
    title: "편의점 음료수",
    desc: "1,650원짜리 음료수 한 병을 샀어요.",
    taxes: [{ taxId: "vat", label: "부가가치세(10%)", amount: 150, level: "국세" }],
    note: "값 1,650원 = 공급가 1,500원 + 부가세 150원.",
  },
  {
    id: "lunch",
    emoji: "🍔",
    title: "점심 외식",
    desc: "9,900원짜리 점심을 사 먹었어요.",
    taxes: [{ taxId: "vat", label: "부가가치세(10%)", amount: 900, level: "국세" }],
    note: "값의 1/11이 부가세.",
  },
  {
    id: "movie",
    emoji: "🎬",
    title: "영화 관람",
    desc: "15,000원짜리 영화표를 샀어요.",
    taxes: [{ taxId: "vat", label: "부가가치세(10%)", amount: 1364, level: "국세" }],
  },
  {
    id: "clothes",
    emoji: "👕",
    title: "옷 한 벌",
    desc: "55,000원짜리 옷을 샀어요.",
    taxes: [{ taxId: "vat", label: "부가가치세(10%)", amount: 5000, level: "국세" }],
  },
  {
    id: "phone",
    emoji: "📱",
    title: "스마트폰",
    desc: "1,155,000원짜리 스마트폰을 샀어요.",
    taxes: [{ taxId: "vat", label: "부가가치세(10%)", amount: 105000, level: "국세" }],
  },
  {
    id: "fuel",
    emoji: "⛽",
    title: "휘발유 40L 주유",
    desc: "자동차에 휘발유 40L를 넣었어요.",
    taxes: [
      { taxId: "transport_energy_env", label: "교통·에너지·환경세(529원/L)", amount: 21160, level: "국세" },
      { taxId: "education", label: "교육세(교통세의 15%)", amount: 3174, level: "국세" },
      { taxId: "automobile", label: "자동차세 주행분(교통세의 26%)", amount: 5502, level: "지방세" },
    ],
    note: "법정 기본세율 기준. 유가·탄력세율에 따라 실제 유류세는 달라져요(부가세 별도).",
  },
  {
    id: "car_own",
    emoji: "🚗",
    title: "자동차 보유 (1년, 2,000cc 승용)",
    desc: "2,000cc 승용차(비영업용)를 1년간 가지고 있어요.",
    taxes: [
      { taxId: "automobile", label: "자동차세(200원×2,000cc)", amount: 400000, level: "지방세" },
      { taxId: "local_education", label: "지방교육세(자동차세의 30%)", amount: 120000, level: "지방세" },
    ],
    note: "비영업 승용차 배기량 1,600cc 초과분은 cc당 200원.",
  },
  {
    id: "house_buy",
    emoji: "🏡",
    title: "집 구입 (3억원, 85㎡ 이하)",
    desc: "3억 원짜리 국민주택규모(85㎡ 이하) 집을 처음 샀어요.",
    taxes: [
      { taxId: "acquisition", label: "취득세(1%)", amount: 3000000, level: "지방세" },
      { taxId: "local_education", label: "지방교육세(0.1%)", amount: 300000, level: "지방세" },
    ],
    note: "6억 원 이하 주택 취득세율 1%. 85㎡ 이하는 농어촌특별세 비과세.",
  },
  {
    id: "stock_sell",
    emoji: "📊",
    title: "주식 매도 (100만원)",
    desc: "가지고 있던 주식을 100만 원어치 팔았어요.",
    taxes: [{ taxId: "securities_transaction", label: "증권거래세(약 0.15%)", amount: 1500, level: "국세" }],
    note: "매도금액 기준. 시장·연도에 따라 세율이 조금씩 달라요.",
  },
  {
    id: "overseas",
    emoji: "📦",
    title: "해외직구 운동화 (약 27만원)",
    desc: "해외 사이트에서 27만 원짜리 운동화를 직구했어요.",
    taxes: [
      { taxId: "customs", label: "관세(신발 13%)", amount: 35100, level: "국세" },
      { taxId: "vat", label: "부가가치세(10%)", amount: 30510, level: "국세" },
    ],
    note: "면세 기준(150달러)을 넘어 과세되는 경우. 부가세는 (물품가+관세)에 부과.",
  },
];
