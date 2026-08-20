// 균형가격의 변화 — 활동 데이터
//
//  [세금]  제품에 부과되는 세금 증가 → 생산 비용 증가 효과(공급곡선 이동)
//          → 균형점 이동 E₀ ⇒ E₁ → 균형가격 상승, 균형거래량 감소
//          세금 감소는 그 반대.
//          세금의 피해는 공급자만 받지 않는다. 소비자와 공급자가 나누어 지며,
//          그 몫은 두 곡선의 기울기(탄력성)에 따라 달라진다.
//            1개당 소비자 부담 = x₁ − x₀ = sA·t / (sA − dA)
//            1개당 공급자 부담 = x₀ − xs = |dA|·t / (sA − dA)      (xs = x₁ − t)
//            정부 세수 = t × Q₁,  세금으로 인한 사회적 손실 = ½ × t × (Q₀ − Q₁)
//
//  [소득]  수요자의 소득 증가 → 구매력 증가 효과(수요곡선 이동)
//          → 균형점 이동 → 균형가격 상승, 균형거래량 증가. 소득 감소는 그 반대.
//          단, 소득이 늘 때 오히려 수요가 줄어드는 재화(열등재)도 있다.
//
//  [정리]  수요 증가 → 가격↑ 거래량↑ · 수요 감소 → 가격↓ 거래량↓
//          공급 증가 → 가격↓ 거래량↑ · 공급 감소 → 가격↑ 거래량↓
//
//  ※ 이 활동의 가격·수량은 균형의 움직임을 살펴보기 위해 꾸민 값이다.
//    (가로축 = 가격 x, 세로축 = 수량 Q — 수업 자료와 같은 방식)

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}
export function signed(v: number, d = 2): string {
  return v < 0 ? `- ${fmt(-v, d)}` : `+ ${fmt(v, d)}`;
}

// ══════════════════════════════════════════════════════════════
//  시장 —  Qd = dA·x + dB,  Qs = sA·x + sB
// ══════════════════════════════════════════════════════════════
export type Mkt = {
  id: string;
  emoji: string;
  name: string;
  unit: string;
  priceUnit: string;
  tone: "emerald" | "sky" | "amber" | "violet";
  dA: number;
  dB: number;
  sA: number;
  sB: number;
  xMax: number;
  story: string;
};

export function qd(m: Mkt, x: number, shift = 0): number {
  return Math.max(0, m.dA * x + m.dB + shift);
}
export function qs(m: Mkt, x: number, shift = 0): number {
  return Math.max(0, m.sA * x + m.sB + shift);
}
/** 균형가격·균형거래량 (dShift = 수요곡선 이동, sShift = 공급곡선 이동) */
export function eqOf(m: Mkt, dShift = 0, sShift = 0): { x: number; q: number } {
  const x = (m.sB + sShift - (m.dB + dShift)) / (m.dA - m.sA);
  return { x, q: m.dA * x + m.dB + dShift };
}
export function demandTex(m: Mkt, shift = 0): string {
  return `Q_d = ${fmt(m.dA)}x ${signed(m.dB + shift)}`;
}
export function supplyTex(m: Mkt, shift = 0): string {
  const b = m.sB + shift;
  return b === 0 ? `Q_s = ${fmt(m.sA)}x` : `Q_s = ${fmt(m.sA)}x ${signed(b)}`;
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 세금과 균형점
// ══════════════════════════════════════════════════════════════
export const TAX_MARKETS: Mkt[] = [
  {
    id: "fuel",
    emoji: "⛽",
    name: "휘발유",
    unit: "만 L",
    priceUnit: "십원/L",
    tone: "amber",
    dA: -1,
    dB: 300,
    sA: 3,
    sB: -100,
    xMax: 180,
    story: "값이 올라도 차는 타야 해요. 수요가 값에 덜 민감한 상품이에요.",
  },
  {
    id: "soda",
    emoji: "🥤",
    name: "탄산음료",
    unit: "천 개",
    priceUnit: "십원",
    tone: "sky",
    dA: -2,
    dB: 360,
    sA: 2,
    sB: -40,
    xMax: 180,
    story: "값이 오르면 어느 정도는 다른 음료로 옮겨 가요.",
  },
  {
    id: "car",
    emoji: "🚗",
    name: "자동차",
    unit: "대",
    priceUnit: "십만원",
    tone: "violet",
    dA: -3,
    dB: 400,
    sA: 1,
    sB: 100,
    xMax: 130,
    story: "값이 조금만 올라도 사려는 사람이 크게 줄어요. 수요가 값에 아주 민감해요.",
  },
];

export const TAX_MAX = 40;
export const TAX_STEP = 4;

export type TaxResult = {
  /** 세금 전 균형 */
  x0: number;
  q0: number;
  /** 세금 후 균형 (소비자 지불 가격) */
  x1: number;
  q1: number;
  /** 생산자가 실제로 받는 가격 */
  xs: number;
  /** 1개당 소비자 부담 · 공급자 부담 */
  cPer: number;
  pPer: number;
  /** 총액 */
  cTotal: number;
  pTotal: number;
  revenue: number;
  /** 세금으로 인한 사회적 손실 */
  dwl: number;
  /** 공급곡선이 아래로 내려간 양 */
  sShift: number;
};

export function taxResult(m: Mkt, t: number): TaxResult {
  const sShift = -m.sA * t;
  const e0 = eqOf(m);
  const e1 = eqOf(m, 0, sShift);
  const xs = e1.x - t;
  const cPer = e1.x - e0.x;
  const pPer = e0.x - xs;
  return {
    x0: e0.x,
    q0: e0.q,
    x1: e1.x,
    q1: e1.q,
    xs,
    cPer,
    pPer,
    cTotal: cPer * e1.q,
    pTotal: pPer * e1.q,
    revenue: t * e1.q,
    dwl: 0.5 * t * (e0.q - e1.q),
    sShift,
  };
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 소득과 균형점
// ══════════════════════════════════════════════════════════════
export type IncomeMkt = Mkt & {
  /** 소득이 늘 때 오히려 수요가 줄어드는 재화 */
  inferior: boolean;
  note: string;
};

export const INCOME_MARKETS: IncomeMkt[] = [
  {
    id: "trip",
    emoji: "✈️",
    name: "해외여행 상품",
    unit: "명",
    priceUnit: "만원",
    tone: "sky",
    dA: -1,
    dB: 350,
    sA: 1,
    sB: 50,
    xMax: 300,
    inferior: false,
    story: "주머니가 넉넉해지면 가장 먼저 떠오르는 것 가운데 하나예요.",
    note: "정상재 — 소득이 늘면 수요가 늘어요.",
  },
  {
    id: "cafe",
    emoji: "🍰",
    name: "디저트 카페",
    unit: "잔",
    priceUnit: "백원",
    tone: "amber",
    dA: -2,
    dB: 300,
    sA: 3,
    sB: -50,
    xMax: 140,
    inferior: false,
    story: "여윳돈이 생기면 카페에 더 자주 가게 되죠.",
    note: "정상재 — 소득이 늘면 수요가 늘어요.",
  },
  {
    id: "noodle",
    emoji: "🍜",
    name: "봉지 라면",
    unit: "천 봉",
    priceUnit: "십원",
    tone: "emerald",
    dA: -1,
    dB: 260,
    sA: 1,
    sB: 20,
    xMax: 240,
    inferior: true,
    story: "돈이 넉넉해지면 라면 대신 다른 음식을 찾게 되기도 해요.",
    note: "열등재 — 소득이 늘면 오히려 수요가 줄어요!",
  },
];

export const INCOME_MAX = 80;
export const INCOME_STEP = 20;

/** 소득 변화 m 이 수요곡선을 얼마나 움직이는지 */
export function incomeShift(m: IncomeMkt, income: number): number {
  return m.inferior ? -income : income;
}

// ══════════════════════════════════════════════════════════════
//  탭 ③·④ 실생활 사례 — 공통 시장
// ══════════════════════════════════════════════════════════════
export const CARD_MKT: Mkt = {
  id: "card",
  emoji: "🛒",
  name: "어떤 상품",
  unit: "개",
  priceUnit: "백원",
  tone: "emerald",
  dA: -2,
  dB: 300,
  sA: 2,
  sB: -20,
  xMax: 170,
  story: "",
};
export const CARD_SHIFT = 40;

export type Card = {
  id: string;
  emoji: string;
  /** 어떤 상품의 시장인지 */
  product: string;
  title: string;
  desc: string;
  /** 곡선이 늘어나는 쪽인지 줄어드는 쪽인지 */
  dir: "up" | "down";
  /** 요인의 종류 */
  kind: string;
  why: string;
};

/** 수요곡선을 움직이는 요인 */
export const DEMAND_CARDS: Card[] = [
  {
    id: "heat",
    emoji: "☀️",
    product: "아이스크림",
    title: "기록적인 폭염",
    desc: "연일 35도가 넘는 무더위가 이어졌어요.",
    dir: "up",
    kind: "기호·계절",
    why: "값과 상관없이 찾는 사람이 늘어 모든 가격에서 수요량이 커졌어요.",
  },
  {
    id: "shaved",
    emoji: "🧊",
    product: "아이스크림",
    title: "옆 가게 빙수 반값",
    desc: "대신 먹을 수 있는 빙수가 아주 싸졌어요.",
    dir: "down",
    kind: "대체재 가격",
    why: "대체재가 싸지면 이 상품에서 사람들이 옮겨 가 수요가 줄어요.",
  },
  {
    id: "income",
    emoji: "💰",
    product: "해외여행 상품",
    title: "국민 소득 증가",
    desc: "작년에 비해 사람들의 소득이 크게 늘었어요.",
    dir: "up",
    kind: "소득 (정상재)",
    why: "구매력이 커져 같은 값에도 더 많이 사려고 해요.",
  },
  {
    id: "wait",
    emoji: "📅",
    product: "스마트폰",
    title: "다음 달 신제품 출시 소문",
    desc: "곧 값이 내릴 거라는 이야기가 돌았어요.",
    dir: "down",
    kind: "미래 가격 기대",
    why: "값이 내릴 것 같으면 지금 사지 않고 기다려요. 지금의 수요가 줄어듭니다.",
  },
  {
    id: "baby",
    emoji: "👶",
    product: "유아용품",
    title: "신생아 수 감소",
    desc: "아기가 태어나는 수가 크게 줄었어요.",
    dir: "down",
    kind: "수요자의 수",
    why: "살 사람 자체가 줄면 모든 가격에서 수요량이 줄어요.",
  },
  {
    id: "school",
    emoji: "🏫",
    product: "문구류",
    title: "새 학기 시작",
    desc: "전국 학교가 한꺼번에 개학했어요.",
    dir: "up",
    kind: "계절·수요자의 수",
    why: "필요한 사람이 한꺼번에 늘어 수요곡선이 통째로 움직여요.",
  },
  {
    id: "fuelup",
    emoji: "⛽",
    product: "자동차",
    title: "휘발유 값 급등",
    desc: "기름값이 크게 올랐어요.",
    dir: "down",
    kind: "보완재 가격",
    why: "함께 써야 하는 보완재가 비싸지면 이 상품의 수요도 줄어요.",
  },
  {
    id: "ppl",
    emoji: "🎬",
    product: "운동화",
    title: "인기 드라마에 등장",
    desc: "주인공이 신은 운동화가 화제가 됐어요.",
    dir: "up",
    kind: "기호·유행",
    why: "값은 그대로인데 사고 싶어 하는 사람이 늘었어요.",
  },
];

/** 공급곡선을 움직이는 요인 */
export const SUPPLY_CARDS: Card[] = [
  {
    id: "flour",
    emoji: "🌾",
    product: "빵",
    title: "밀가루 값 폭등",
    desc: "빵의 원재료인 밀 값이 크게 올랐어요.",
    dir: "down",
    kind: "원자재 가격",
    why: "만드는 비용이 커져 같은 값에도 덜 만들게 돼요.",
  },
  {
    id: "robot",
    emoji: "🤖",
    product: "부품",
    title: "자동화 설비 도입",
    desc: "로봇을 들여 같은 시간에 훨씬 많이 만들 수 있게 됐어요.",
    dir: "up",
    kind: "생산 기술",
    why: "기술이 좋아지면 같은 값에도 더 많이 내놓을 수 있어요.",
  },
  {
    id: "typhoon",
    emoji: "🌊",
    product: "김",
    title: "태풍으로 양식장 피해",
    desc: "큰 태풍이 지나가며 양식장이 망가졌어요.",
    dir: "down",
    kind: "자연재해",
    why: "만들 수 있는 양 자체가 줄어 공급곡선이 통째로 움직여요.",
  },
  {
    id: "plants",
    emoji: "🏭",
    product: "배터리",
    title: "새 공장이 여럿 준공",
    desc: "만드는 회사가 크게 늘었어요.",
    dir: "up",
    kind: "생산자의 수",
    why: "파는 쪽이 많아지면 같은 값에도 시장에 나오는 양이 늘어요.",
  },
  {
    id: "subsidy",
    emoji: "💰",
    product: "전기차",
    title: "정부 보조금 지급",
    desc: "정부가 생산에 보조금을 주기로 했어요.",
    dir: "up",
    kind: "보조금",
    why: "생산 비용이 줄어드는 효과라 공급이 늘어요.",
  },
  {
    id: "excise",
    emoji: "🧾",
    product: "고급 시계",
    title: "개별소비세 인상",
    desc: "이 제품에 붙는 세금이 올랐어요.",
    dir: "down",
    kind: "세금",
    why: "세금은 생산 비용이 커지는 효과라 공급이 줄어요.",
  },
  {
    id: "oil",
    emoji: "🛢️",
    product: "택배 서비스",
    title: "국제 유가 급등",
    desc: "배송에 드는 기름값이 크게 올랐어요.",
    dir: "down",
    kind: "운송·원자재 비용",
    why: "내놓는 데 드는 비용이 커지면 공급이 줄어요.",
  },
  {
    id: "harvest",
    emoji: "🌻",
    product: "배추",
    title: "역대급 풍년",
    desc: "날씨가 좋아 수확량이 크게 늘었어요.",
    dir: "up",
    kind: "생산 여건",
    why: "내놓을 수 있는 양이 늘어 공급곡선이 통째로 움직여요.",
  },
];

/** 균형 변화 4지선다 */
export const RESULT_OPTIONS = [
  "균형가격 ⬆️ 상승 · 균형거래량 ⬆️ 증가",
  "균형가격 ⬆️ 상승 · 균형거래량 ⬇️ 감소",
  "균형가격 ⬇️ 하락 · 균형거래량 ⬆️ 증가",
  "균형가격 ⬇️ 하락 · 균형거래량 ⬇️ 감소",
];

/** side = demand/supply, dir = up/down 일 때의 정답 번호 */
export function resultAnswer(side: "demand" | "supply", dir: "up" | "down"): number {
  if (side === "demand") return dir === "up" ? 0 : 3;
  return dir === "up" ? 2 : 1;
}

export const SUMMARY_LINES = [
  { k: "수요 증가", v: "균형가격 ⬆️ · 균형거래량 ⬆️" },
  { k: "수요 감소", v: "균형가격 ⬇️ · 균형거래량 ⬇️" },
  { k: "공급 증가", v: "균형가격 ⬇️ · 균형거래량 ⬆️" },
  { k: "공급 감소", v: "균형가격 ⬆️ · 균형거래량 ⬇️" },
];

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ 단계별 문제
// ══════════════════════════════════════════════════════════════
export type Choice = { text?: string; tex?: string };

export type PStep =
  | {
      kind: "number";
      id: string;
      ask: string;
      tex?: string;
      hint: string;
      answer: number;
      suffix: string;
      explain: string;
      tol?: number;
    }
  | { kind: "choice"; id: string; ask: string; tex?: string; hint: string; options: Choice[]; answer: number; explain: string };

export type Problem = {
  id: string;
  emoji: string;
  title: string;
  scenario: string;
  texList?: { label: string; tex: string }[];
  steps: PStep[];
  wrapUp: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "t1",
    emoji: "🖥️",
    title: "문제 1 · 세금이 오르면",
    scenario:
      "어느 기업에서 생산하는 모니터의 가격 x만 원에 대한 수요함수가 일정하고, 정부가 세금을 인상하여 공급함수가 아래와 같이 변하였다고 한다.",
    texList: [
      { label: "수요함수 (그대로)", tex: "Q_d = -3x + 600" },
      { label: "세금 전 공급함수", tex: "Q_s = 2x + 100" },
      { label: "세금 후 공급함수", tex: "Q'_s = 2x - 50" },
    ],
    steps: [
      {
        kind: "number",
        id: "t1s1",
        ask: "세금을 인상하기 전의 균형가격을 구하세요. (만원 단위)",
        tex: "-3x + 600 = 2x + 100",
        hint: "5x = 500",
        answer: 100,
        suffix: "만원",
        explain: "5x = 500 → x = 100 이에요.",
      },
      {
        kind: "number",
        id: "t1s2",
        ask: "세금을 인상한 뒤의 균형가격을 구하세요. (만원 단위)",
        tex: "-3x + 600 = 2x - 50",
        hint: "5x = 650",
        answer: 130,
        suffix: "만원",
        explain: "5x = 650 → x = 130. 균형가격이 100에서 130으로 올랐어요.",
      },
      {
        kind: "number",
        id: "t1s3",
        ask: "균형거래량은 얼마나 줄었을까요?",
        tex: "Q_0 - Q_1",
        hint: "세금 전 300대, 세금 후 210대",
        answer: 90,
        suffix: "대",
        explain: "300 − 210 = 90대가 줄었어요.",
      },
      {
        kind: "choice",
        id: "t1s4",
        ask: "제품에 부과되는 세금이 늘어나면 균형점은 어떻게 움직일까요?",
        hint: "생산 비용이 커지는 효과예요.",
        options: [
          { text: "균형가격 상승 · 균형거래량 증가" },
          { text: "균형가격 상승 · 균형거래량 감소" },
          { text: "균형가격 하락 · 균형거래량 증가" },
          { text: "균형가격 하락 · 균형거래량 감소" },
        ],
        answer: 1,
        explain:
          "세금은 생산 비용이 커지는 효과라 공급이 줄어요. 그래서 균형가격은 오르고 균형거래량은 줄어듭니다.",
      },
    ],
    wrapUp:
      "세금이 늘면 공급곡선이 움직여 균형점이 옮겨 가요. 균형가격은 오르고 균형거래량은 줄어듭니다. 세금이 줄면 그 반대가 되죠.",
  },
  {
    id: "t2",
    emoji: "🎧",
    title: "문제 2 · 세금은 누가 부담할까",
    scenario:
      "어떤 무선 스피커의 가격 x천 원에 대한 수요함수가 일정하고, 세금 인상으로 공급함수가 아래와 같이 변하였다고 한다.",
    texList: [
      { label: "수요함수 (그대로)", tex: "Q_d = -2x + 900" },
      { label: "세금 전 공급함수", tex: "Q_s = x + 300" },
      { label: "세금 후 공급함수", tex: "Q'_s = x + 210" },
    ],
    steps: [
      {
        kind: "number",
        id: "t2s1",
        ask: "세금을 인상하기 전의 균형가격을 구하세요. (천원 단위)",
        tex: "-2x + 900 = x + 300",
        hint: "3x = 600",
        answer: 200,
        suffix: "천원",
        explain: "3x = 600 → x = 200 이에요.",
      },
      {
        kind: "number",
        id: "t2s2",
        ask: "세금을 인상한 뒤의 균형가격을 구하세요. (천원 단위)",
        tex: "-2x + 900 = x + 210",
        hint: "3x = 690",
        answer: 230,
        suffix: "천원",
        explain: "3x = 690 → x = 230 이에요.",
      },
      {
        kind: "number",
        id: "t2s3",
        ask: "수요자(소비자)가 1개당 추가로 부담하는 금액은 얼마일까요? (천원 단위)",
        tex: "x_1 - x_0",
        hint: "230 − 200",
        answer: 30,
        suffix: "천원",
        explain: "230 − 200 = 30천 원을 소비자가 더 내게 됐어요.",
      },
      {
        kind: "number",
        id: "t2s4",
        ask: "1개당 붙은 세금이 90천 원이라면, 공급자가 1개당 지는 부담은 얼마일까요? (천원 단위)",
        tex: "90 - 30",
        hint: "세금은 소비자와 공급자가 나누어 져요.",
        answer: 60,
        suffix: "천원",
        explain:
          "90 − 30 = 60천 원이에요. 세금 90 가운데 소비자가 30, 공급자가 60을 진 셈이죠. 피해는 공급자만 받는 것이 아니랍니다.",
      },
    ],
    wrapUp:
      "세금의 피해는 공급자만 받지 않아요. 소비자와 공급자가 나누어 지고, 그 몫은 두 곡선의 기울기(탄력성)에 따라 달라집니다.",
  },
  {
    id: "t3",
    emoji: "🏕️",
    title: "문제 3 · 소득이 늘면",
    scenario:
      "어느 캠핑용품점의 가격 x천 원에 대한 공급함수가 일정한데, 국민 소득이 늘어 수요함수가 아래와 같이 변하였다고 한다.",
    texList: [
      { label: "공급함수 (그대로)", tex: "Q_s = x + 80" },
      { label: "작년 수요함수", tex: "Q_d = -x + 320" },
      { label: "올해 수요함수", tex: "Q'_d = -x + 400" },
    ],
    steps: [
      {
        kind: "number",
        id: "t3s1",
        ask: "작년의 균형가격을 구하세요. (천원 단위)",
        tex: "-x + 320 = x + 80",
        hint: "2x = 240",
        answer: 120,
        suffix: "천원",
        explain: "2x = 240 → x = 120 이에요.",
      },
      {
        kind: "number",
        id: "t3s2",
        ask: "작년의 균형거래량을 구하세요.",
        tex: "Q_s = 120 + 80",
        hint: "120 + 80",
        answer: 200,
        suffix: "개",
        explain: "200개예요.",
      },
      {
        kind: "number",
        id: "t3s3",
        ask: "올해의 균형가격을 구하세요. (천원 단위)",
        tex: "-x + 400 = x + 80",
        hint: "2x = 320",
        answer: 160,
        suffix: "천원",
        explain: "2x = 320 → x = 160. 120에서 160으로 올랐어요.",
      },
      {
        kind: "number",
        id: "t3s4",
        ask: "올해의 균형거래량을 구하세요.",
        tex: "Q_s = 160 + 80",
        hint: "160 + 80",
        answer: 240,
        suffix: "개",
        explain: "240개. 200에서 240으로 늘었어요.",
      },
      {
        kind: "choice",
        id: "t3s5",
        ask: "수요자의 소득이 늘면 (정상재의) 균형점은 어떻게 움직일까요?",
        hint: "구매력이 커지는 효과예요.",
        options: [
          { text: "균형가격 상승 · 균형거래량 증가" },
          { text: "균형가격 상승 · 균형거래량 감소" },
          { text: "균형가격 하락 · 균형거래량 증가" },
          { text: "균형가격 하락 · 균형거래량 감소" },
        ],
        answer: 0,
        explain: "구매력이 커져 수요가 늘면 균형가격도 오르고 균형거래량도 늘어요.",
      },
    ],
    wrapUp:
      "소득이 늘면 수요곡선이 움직여 균형가격과 균형거래량이 함께 커져요. 다만 라면처럼 소득이 늘 때 오히려 수요가 주는 재화(열등재)도 있답니다.",
  },
  {
    id: "t4",
    emoji: "🧠",
    title: "문제 4 · 원인을 찾아라",
    scenario: "다음 상황에서 균형가격과 균형거래량이 어떻게 달라질지 판단해 보자.",
    steps: [
      {
        kind: "choice",
        id: "t4s1",
        ask: "🌾 밀가루 값이 크게 올라 빵을 만드는 비용이 커졌다.",
        hint: "만드는 쪽 이야기예요.",
        options: [
          { text: "균형가격 상승 · 균형거래량 증가" },
          { text: "균형가격 상승 · 균형거래량 감소" },
          { text: "균형가격 하락 · 균형거래량 증가" },
          { text: "균형가격 하락 · 균형거래량 감소" },
        ],
        answer: 1,
        explain: "원자재 값이 오르면 공급이 줄어요. 공급 감소 → 균형가격 상승, 균형거래량 감소.",
      },
      {
        kind: "choice",
        id: "t4s2",
        ask: "🤖 새 기술이 나와 같은 비용으로 훨씬 많이 만들 수 있게 되었다.",
        hint: "공급이 늘어나는 쪽이에요.",
        options: [
          { text: "균형가격 상승 · 균형거래량 증가" },
          { text: "균형가격 상승 · 균형거래량 감소" },
          { text: "균형가격 하락 · 균형거래량 증가" },
          { text: "균형가격 하락 · 균형거래량 감소" },
        ],
        answer: 2,
        explain: "공급 증가 → 균형가격 하락, 균형거래량 증가. 수요가 늘 때와 결과가 다르죠?",
      },
      {
        kind: "choice",
        id: "t4s3",
        ask: "🧊 이 상품 대신 쓸 수 있는 대체재의 값이 크게 내렸다.",
        hint: "사는 쪽 이야기예요.",
        options: [
          { text: "균형가격 상승 · 균형거래량 증가" },
          { text: "균형가격 상승 · 균형거래량 감소" },
          { text: "균형가격 하락 · 균형거래량 증가" },
          { text: "균형가격 하락 · 균형거래량 감소" },
        ],
        answer: 3,
        explain: "사람들이 대체재로 옮겨 가 수요가 줄어요. 수요 감소 → 균형가격 하락, 균형거래량 감소.",
      },
      {
        kind: "choice",
        id: "t4s4",
        ask: "제품에 세금이 부과되었을 때, 그 부담은 누가 질까요?",
        hint: "값이 오른 만큼은 소비자가 더 내지만, 생산자가 실제로 받는 값도 줄어요.",
        options: [
          { text: "공급자가 모두 진다" },
          { text: "소비자가 모두 진다" },
          { text: "소비자와 공급자가 나누어 지며, 그 몫은 탄력성에 따라 다르다" },
          { text: "정부가 모두 진다" },
        ],
        answer: 2,
        explain:
          "세금의 피해는 공급자만 받지 않아요. 값에 덜 민감한 쪽이 더 많이 지게 되고, 게다가 거래 자체가 줄어드는 사회적 손실도 생깁니다.",
      },
    ],
    wrapUp:
      "수요가 움직이면 가격과 거래량이 같은 방향으로, 공급이 움직이면 반대 방향으로 달라져요. 이 네 가지만 기억하면 어떤 뉴스든 읽어 낼 수 있습니다.",
  },
];
