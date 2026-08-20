// 비용함수 — 활동 데이터
//
//  · 비용(Cost): 기업이 어떤 상품을 생산하기 위해 사용한 요소의 가치
//  · 총비용 TC = 고정 비용 FC + 가변 비용 VC
//      - 고정 비용: 생산량에 관계없이 항상 일정하게 드는 비용 (임대료·설비 구입비·보험료 등)
//      - 가변 비용: 생산량에 따라 변하는 비용 (재료 구입비·연료비·종업원 임금 등)
//  · 단기: 모든 고정 비용을 일정하게 취급 / 장기: 모든 요소를 가변 비용으로 취급
//  · 총비용은 목표 생산량만큼 생산하기 위한 최소의 비용이고,
//    생산량 Q 에 대한 함수 C = f(Q) 를 비용함수라 한다.
//  · 생산량 Q 를 만드는 데 필요한 노동량을 L(Q), 노동 1단위당 비용을 R, 고정 비용을 F 라 하면
//        C = (고정 비용) + (가변 비용) = F + R × L(Q)
//
//  ※ 탭 ① 의 금액은 비용 구조를 이해하기 위해 꾸민 예시 값이다(특정 가게의 실제 장부가 아님).

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 우리 가게 비용 시뮬레이터
// ══════════════════════════════════════════════════════════════
export type CostItem = {
  id: string;
  emoji: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
};

export type Shop = {
  id: string;
  emoji: string;
  name: string;
  /** 생산물 한 개를 세는 말 */
  unit: string;
  tone: "emerald" | "sky" | "amber" | "violet";
  /** 한 달 고정 비용 항목 (원) */
  fixed: CostItem[];
  /** 한 개당 가변 비용 항목 (원) */
  variable: CostItem[];
  qDefault: number;
  qMax: number;
  qStep: number;
  hook: string;
};

export const SHOPS: Shop[] = [
  {
    id: "boba",
    emoji: "🧋",
    name: "버블티 가게",
    unit: "잔",
    tone: "emerald",
    fixed: [
      { id: "rent", emoji: "🏠", label: "매장 월세", value: 1_500_000, min: 500_000, max: 3_000_000, step: 100_000 },
      { id: "machine", emoji: "⚙️", label: "음료 기계 리스료", value: 400_000, min: 0, max: 1_000_000, step: 50_000 },
      { id: "insure", emoji: "🛡️", label: "화재 보험료", value: 60_000, min: 0, max: 200_000, step: 10_000 },
    ],
    variable: [
      { id: "milk", emoji: "🥛", label: "우유·타피오카·시럽", value: 1_200, min: 400, max: 2_500, step: 100 },
      { id: "cup", emoji: "🥤", label: "컵·빨대·포장", value: 300, min: 0, max: 800, step: 50 },
      { id: "fee", emoji: "📱", label: "배달앱 수수료", value: 200, min: 0, max: 600, step: 50 },
    ],
    qDefault: 1_200,
    qMax: 3_000,
    qStep: 50,
    hook: "손님이 한 명도 없어도 월세는 나가요.",
  },
  {
    id: "pizza",
    emoji: "🍕",
    name: "피자 푸드트럭",
    unit: "판",
    tone: "amber",
    fixed: [
      { id: "truck", emoji: "🚚", label: "푸드트럭 할부금", value: 800_000, min: 0, max: 1_600_000, step: 50_000 },
      { id: "spot", emoji: "📍", label: "자릿세", value: 500_000, min: 0, max: 1_200_000, step: 50_000 },
      { id: "insure", emoji: "🛡️", label: "자동차 보험료", value: 150_000, min: 0, max: 400_000, step: 10_000 },
    ],
    variable: [
      { id: "dough", emoji: "🧀", label: "도우·치즈·토핑", value: 3_500, min: 1_000, max: 7_000, step: 100 },
      { id: "box", emoji: "📦", label: "포장 상자", value: 500, min: 0, max: 1_500, step: 50 },
      { id: "gas", emoji: "🔥", label: "LPG 연료비", value: 300, min: 0, max: 1_000, step: 50 },
    ],
    qDefault: 500,
    qMax: 1_500,
    qStep: 25,
    hook: "한 판도 못 팔아도 트럭 할부금은 그대로!",
  },
  {
    id: "tshirt",
    emoji: "👕",
    name: "티셔츠 공방",
    unit: "장",
    tone: "sky",
    fixed: [
      { id: "studio", emoji: "🏢", label: "작업실 임대료", value: 700_000, min: 0, max: 1_500_000, step: 50_000 },
      { id: "printer", emoji: "🖨️", label: "전사 프린터 감가상각", value: 300_000, min: 0, max: 800_000, step: 50_000 },
      { id: "soft", emoji: "💻", label: "디자인 프로그램 구독료", value: 50_000, min: 0, max: 200_000, step: 10_000 },
    ],
    variable: [
      { id: "blank", emoji: "👕", label: "무지 티셔츠", value: 4_000, min: 2_000, max: 9_000, step: 250 },
      { id: "ink", emoji: "🎨", label: "전사 잉크", value: 600, min: 0, max: 2_000, step: 100 },
      { id: "ship", emoji: "📮", label: "택배비", value: 3_000, min: 0, max: 5_000, step: 250 },
    ],
    qDefault: 300,
    qMax: 2_000,
    qStep: 25,
    hook: "한 장을 더 만들 때마다 무지 티셔츠 값이 또 들어요.",
  },
  {
    id: "book",
    emoji: "📖",
    name: "독립출판 (책 만들기)",
    unit: "권",
    tone: "violet",
    fixed: [
      { id: "design", emoji: "✏️", label: "표지 디자인·편집비", value: 2_500_000, min: 500_000, max: 5_000_000, step: 100_000 },
      { id: "isbn", emoji: "📇", label: "ISBN 발급·교정비", value: 300_000, min: 0, max: 800_000, step: 50_000 },
    ],
    variable: [
      { id: "print", emoji: "🖨️", label: "인쇄·제본", value: 3_000, min: 1_000, max: 6_000, step: 250 },
      { id: "dist", emoji: "🏪", label: "서점 유통 수수료", value: 1_500, min: 0, max: 4_000, step: 250 },
    ],
    qDefault: 500,
    qMax: 3_000,
    qStep: 50,
    hook: "고정 비용이 아주 크면, 많이 찍을수록 한 권 값이 뚝 떨어져요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 고정비·가변비 분류 게임
// ══════════════════════════════════════════════════════════════
export type SortItem = {
  id: string;
  emoji: string;
  label: string;
  kind: "fixed" | "variable";
  why: string;
};

// 2열로 늘어놓아도 한쪽 줄에 같은 종류만 모이지 않도록 순서를 섞어 두었다.
// (짝수 번째 = 왼쪽 칸, 홀수 번째 = 오른쪽 칸)
export const SORT_ITEMS: SortItem[] = [
  { id: "rent", emoji: "🏠", label: "매장 임대료", kind: "fixed", why: "손님이 없어도 매달 똑같이 나가요." },
  { id: "flour", emoji: "🌾", label: "밀가루·재료 구입비", kind: "variable", why: "많이 만들수록 더 많이 사야 해요." },
  { id: "box", emoji: "📦", label: "포장 상자", kind: "variable", why: "한 개를 만들면 상자도 한 개가 더 필요해요." },
  { id: "oven", emoji: "🏭", label: "기계 설비 구입비", kind: "fixed", why: "한 번 사 두면 몇 개를 만들든 같은 금액이에요." },
  { id: "gas", emoji: "🔥", label: "오븐 가스 연료비", kind: "variable", why: "구운 만큼 연료가 들어요." },
  { id: "fire", emoji: "🛡️", label: "화재 보험료", kind: "fixed", why: "계약한 대로 매달 일정하게 냅니다." },
  { id: "sign", emoji: "🪧", label: "간판 제작비", kind: "fixed", why: "가게를 열 때 한 번 드는 비용이에요." },
  { id: "parttime", emoji: "⏱️", label: "생산량에 따라 더 부르는 아르바이트 임금", kind: "variable", why: "바쁠수록 더 많은 시간을 부르게 돼요." },
  { id: "delivery", emoji: "🚚", label: "택배 발송비", kind: "variable", why: "보낸 개수만큼 늘어나요." },
  { id: "net", emoji: "🌐", label: "인터넷·포스기 회선료", kind: "fixed", why: "매달 정해진 금액이 나가요." },
  { id: "ink", emoji: "💧", label: "프린터 잉크 값", kind: "variable", why: "인쇄한 만큼 줄어들어요." },
  { id: "salary", emoji: "👔", label: "정규직 직원의 매달 기본급", kind: "fixed", why: "생산량과 상관없이 매달 같은 금액이 나가요." },
  { id: "card", emoji: "💳", label: "카드 결제 수수료", kind: "variable", why: "판 금액에 비례해서 늘어나요." },
  { id: "license", emoji: "📜", label: "영업 허가·등록 비용", kind: "fixed", why: "생산량과 관계없이 한 번 드는 비용이에요." },
];

/** 같은 항목도 상황에 따라 달라진다는 안내 */
export const SORT_CAUTION =
  "임금처럼 상황에 따라 달라지는 항목도 있어요. 생산량이 늘 때 함께 늘어나면 가변 비용, 생산량과 관계없이 매달 같은 금액이면 고정 비용으로 봅니다.";

// ══════════════════════════════════════════════════════════════
//  탭 ② 단기와 장기 — 설비 규모 고르기
// ══════════════════════════════════════════════════════════════
export type Plant = { id: string; emoji: string; name: string; F: number; v: number; color: string; note: string };

/** 금액 단위: 만원 */
export const PLANTS: Plant[] = [
  { id: "small", emoji: "🏠", name: "소형 설비", F: 120, v: 10, color: "#34d399", note: "작은 작업실 하나. 손이 많이 가요." },
  { id: "mid", emoji: "🏢", name: "중형 설비", F: 320, v: 6, color: "#38bdf8", note: "기계 두 대와 창고." },
  { id: "big", emoji: "🏭", name: "대형 설비", F: 720, v: 2, color: "#fbbf24", note: "자동화 공장. 한 개 더 만드는 값이 아주 싸요." },
];

export const PLANT_QMAX = 200;

/** 생산량 q 에서 가장 싼 설비 */
export function bestPlant(q: number): Plant {
  return PLANTS.reduce((a, b) => (b.F + b.v * q < a.F + a.v * q ? b : a));
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 노동함수로 비용함수 만들기 —  C = F + R × L(Q)
// ══════════════════════════════════════════════════════════════
export type LaborCase = {
  id: string;
  emoji: string;
  name: string;
  unit: string;
  story: string;
  tone: "emerald" | "sky" | "amber";
  /** 생산함수의 모양 —  linear: Q = aL   root: Q = a√L */
  kind: "linear" | "root";
  a: number;
  F: number;
  Fmin: number;
  Fmax: number;
  Fstep: number;
  R: number;
  Rmin: number;
  Rmax: number;
  Rstep: number;
  qMax: number;
  qStep: number;
  /** 노동 1단위가 무엇을 뜻하는지 */
  laborUnit: string;
};

export const LABOR_CASES: LaborCase[] = [
  {
    id: "croissant",
    emoji: "🥐",
    name: "크루아상 공방",
    unit: "개",
    story: "제빵사 한 사람이 하루에 크루아상 10개를 구워요.",
    tone: "amber",
    kind: "linear",
    a: 10,
    F: 100,
    Fmin: 0,
    Fmax: 400,
    Fstep: 20,
    R: 30,
    Rmin: 10,
    Rmax: 60,
    Rstep: 10,
    qMax: 200,
    qStep: 5,
    laborUnit: "제빵사 1명이 하루 일한 것",
  },
  {
    id: "bag",
    emoji: "🧵",
    name: "가죽가방 공방",
    unit: "개",
    story: "작업대가 몇 개뿐이라 사람이 늘어도 생산량은 천천히 늘어요.",
    tone: "sky",
    kind: "root",
    a: 5,
    F: 400,
    Fmin: 0,
    Fmax: 800,
    Fstep: 50,
    R: 25,
    Rmin: 25,
    Rmax: 150,
    Rstep: 25,
    qMax: 50,
    qStep: 1,
    laborUnit: "장인 1명이 한 달 일한 것",
  },
  {
    id: "card",
    emoji: "🖨️",
    name: "명함 인쇄소",
    unit: "묶음",
    story: "직원 한 명이 하루에 명함 50묶음을 찍어 내요.",
    tone: "emerald",
    kind: "linear",
    a: 50,
    F: 60,
    Fmin: 0,
    Fmax: 200,
    Fstep: 20,
    R: 100,
    Rmin: 50,
    Rmax: 300,
    Rstep: 50,
    qMax: 300,
    qStep: 10,
    laborUnit: "직원 1명이 하루 일한 것",
  },
];

/** 생산량 q 를 만드는 데 필요한 노동량 L(Q) */
export function laborOf(c: LaborCase, q: number): number {
  return c.kind === "linear" ? q / c.a : (q * q) / (c.a * c.a);
}
/** 가변 비용의 계수 —  linear: R/a,  root: R/a² */
export function varCoef(c: LaborCase, R: number): number {
  return c.kind === "linear" ? R / c.a : R / (c.a * c.a);
}
export function costOf(c: LaborCase, q: number, F: number, R: number): number {
  return F + R * laborOf(c, q);
}

/** 생산함수 (KaTeX) */
export function prodTex(c: LaborCase): string {
  return c.kind === "linear" ? `Q = ${c.a}L` : `Q = ${c.a}\\sqrt{L}`;
}
/** 노동함수 (KaTeX) */
export function laborTex(c: LaborCase): string {
  return c.kind === "linear" ? `L(Q) = \\dfrac{Q}{${c.a}}` : `L(Q) = \\dfrac{Q^2}{${c.a * c.a}}`;
}
/** 비용함수 —  기호식과 수치식 */
export function costTex(c: LaborCase, F: number, R: number): { sym: string; num: string } {
  const k = varCoef(c, R);
  const pow = c.kind === "linear" ? "Q" : "Q^2";
  const denom = c.kind === "linear" ? c.a : c.a * c.a;
  // 계수가 1이면 생략하고, 고정 비용이 0이면 앞의 항을 빼서 깔끔하게 적는다.
  const term = `${k === 1 ? "" : fmt(k, 4)}${pow}`;
  const tidy = F === 0 ? `C = ${term}` : `C = ${fmt(F)} + ${term}`;
  return {
    sym: `C = F + R \\times \\dfrac{${pow}}{${denom}}`,
    num: `C = ${fmt(F)} + ${fmt(R)} \\times \\dfrac{${pow}}{${denom}} \\;\\;\\Rightarrow\\;\\; ${tidy}`,
  };
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 단계별 문제
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
  tex?: string;
  given: { label: string; value: string }[];
  steps: PStep[];
  wrapUp: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "c1",
    emoji: "🥤",
    title: "문제 1 · 텀블러 공방",
    scenario:
      "텀블러를 만드는 어느 공방의 고정 비용이 150만 원이고, 가변 비용이 텀블러 1개당 8,000원이라고 한다.",
    given: [
      { label: "고정 비용 F", value: "1,500,000원 (150만원)" },
      { label: "1개당 가변 비용", value: "8,000원" },
      { label: "생산량", value: "Q개" },
    ],
    steps: [
      {
        kind: "choice",
        id: "c1s1",
        ask: "이 공방의 비용함수 C를 생산량 Q로 나타내면?",
        hint: "총비용 = 고정 비용 + (1개당 가변 비용) × (생산량)",
        options: [
          { tex: "C = 1500000Q + 8000" },
          { tex: "C = 1500000 + 8000Q" },
          { tex: "C = (1500000 + 8000)Q" },
          { tex: "C = 1500000 \\times 8000Q" },
        ],
        answer: 1,
        explain: "고정 비용은 생산량과 관계없이 그대로 더해지고, 가변 비용만 생산량 Q에 곱해져요.",
      },
      {
        kind: "number",
        id: "c1s2",
        ask: "텀블러 250개를 생산할 때 드는 가변 비용은 얼마일까요? (만원 단위)",
        tex: "8000 \\times 250",
        hint: "8,000 × 250 = 2,000,000원 → 만원 단위로 고치면?",
        answer: 200,
        suffix: "만원",
        explain: "8,000 × 250 = 2,000,000원 = 200만원이에요.",
      },
      {
        kind: "number",
        id: "c1s3",
        ask: "그럼 250개를 생산할 때의 총비용은 얼마일까요? (만원 단위)",
        tex: "C = 1500000 + 8000 \\times 250",
        hint: "고정 비용 150만원 + 가변 비용 200만원",
        answer: 350,
        suffix: "만원",
        explain: "150 + 200 = 350만원. 총비용 = 고정 비용 + 가변 비용이에요.",
      },
      {
        kind: "number",
        id: "c1s4",
        ask: "이때 텀블러 1개당 비용은 얼마일까요? (원 단위)",
        tex: "\\dfrac{3500000}{250}",
        hint: "3,500,000 ÷ 250",
        answer: 14000,
        suffix: "원",
        explain:
          "3,500,000 ÷ 250 = 14,000원. 1개당 가변 비용 8,000원보다 6,000원 비싼데, 고정 비용을 250개가 나눠 지기 때문이에요.",
      },
      {
        kind: "number",
        id: "c1s5",
        ask: "쓸 수 있는 돈이 590만 원뿐이라면 텀블러를 최대 몇 개까지 만들 수 있을까요? (개)",
        tex: "1500000 + 8000Q = 5900000",
        hint: "먼저 고정 비용을 빼고, 남은 돈을 8,000으로 나누세요.",
        answer: 550,
        suffix: "개",
        explain: "(5,900,000 − 1,500,000) ÷ 8,000 = 4,400,000 ÷ 8,000 = 550개예요.",
      },
    ],
    wrapUp:
      "비용함수 C = 1,500,000 + 8,000Q 는 일차함수예요. y절편이 고정 비용, 기울기가 1개당 가변 비용이 됩니다.",
  },
  {
    id: "c2",
    emoji: "🕯️",
    title: "문제 2 · 캔들 공방",
    scenario:
      "캔들을 만드는 어느 공방의 고정 비용이 240만 원이고, 캔들 30개를 생산할 때 드는 가변 비용이 45만 원이라고 한다. 가변 비용은 생산량에 비례한다.",
    given: [
      { label: "고정 비용 F", value: "2,400,000원 (240만원)" },
      { label: "주어진 조건", value: "30개일 때 가변 비용 450,000원" },
      { label: "구할 것", value: "80개를 생산할 때의 총비용" },
    ],
    steps: [
      {
        kind: "number",
        id: "c2s1",
        ask: "먼저 캔들 1개당 가변 비용을 구해 보세요. (원 단위)",
        tex: "\\dfrac{450000}{30}",
        hint: "450,000 ÷ 30",
        answer: 15000,
        suffix: "원",
        explain: "450,000 ÷ 30 = 15,000원이에요. 비례한다는 말은 1개당 비용이 늘 같다는 뜻이죠.",
      },
      {
        kind: "number",
        id: "c2s2",
        ask: "그럼 캔들 80개를 생산할 때의 가변 비용은 얼마일까요? (만원 단위)",
        tex: "15000 \\times 80",
        hint: "15,000 × 80 = 1,200,000원",
        answer: 120,
        suffix: "만원",
        explain: "15,000 × 80 = 1,200,000원 = 120만원이에요.",
      },
      {
        kind: "number",
        id: "c2s3",
        ask: "80개를 생산할 때의 총비용은 얼마일까요? (만원 단위)",
        tex: "C = 2400000 + 15000 \\times 80",
        hint: "고정 비용 240만원 + 가변 비용 120만원",
        answer: 360,
        suffix: "만원",
        explain: "240 + 120 = 360만원이에요.",
      },
      {
        kind: "number",
        id: "c2s4",
        ask: "이때 캔들 1개당 비용은 얼마일까요? (원 단위)",
        tex: "\\dfrac{3600000}{80}",
        hint: "3,600,000 ÷ 80",
        answer: 45000,
        suffix: "원",
        explain:
          "3,600,000 ÷ 80 = 45,000원. 30개만 만들면 1개당 비용이 95,000원인데, 80개를 만들면 45,000원으로 뚝 떨어져요.",
      },
    ],
    wrapUp:
      "가변 비용이 생산량에 비례할 때는 먼저 1개당 비용을 구하는 것이 지름길이에요. 고정 비용은 여러 개가 나눠 지므로 많이 만들수록 1개당 비용이 낮아집니다.",
  },
  {
    id: "c3",
    emoji: "🪑",
    title: "문제 3 · 노동함수로 만드는 비용함수",
    scenario:
      "어떤 제품을 만드는 회사의 고정 비용은 600이고 투입되는 노동의 1단위당 임금은 5이다. 이 제품의 생산량 Q가 투입된 노동량 L에 대하여 다음과 같다고 한다.",
    tex: "Q = 8L",
    given: [
      { label: "고정 비용 F", value: "600" },
      { label: "노동 1단위당 임금 R", value: "5" },
      { label: "생산함수", value: "Q = 8L" },
    ],
    steps: [
      {
        kind: "choice",
        id: "c3s1",
        ask: "생산량 Q를 만들려면 노동량이 얼마나 필요할까요? 노동함수 L(Q)를 고르세요.",
        tex: "Q = 8L",
        hint: "Q = 8L 을 L에 대하여 풀어 보세요.",
        options: [{ tex: "L(Q) = 8Q" }, { tex: "L(Q) = \\dfrac{Q}{8}" }, { tex: "L(Q) = Q - 8" }, { tex: "L(Q) = \\dfrac{8}{Q}" }],
        answer: 1,
        explain: "Q = 8L 이므로 L = Q ÷ 8. 생산함수의 역함수가 바로 노동함수예요.",
      },
      {
        kind: "choice",
        id: "c3s2",
        ask: "그럼 비용함수 C를 고르세요.",
        tex: "C = F + R \\times L(Q)",
        hint: "C = 600 + 5 × (Q ÷ 8)",
        options: [
          { tex: "C = 600 + 40Q" },
          { tex: "C = 600 + \\dfrac{8}{5}Q" },
          { tex: "C = 600 + \\dfrac{5}{8}Q" },
          { tex: "C = 5 + \\dfrac{600}{8}Q" },
        ],
        answer: 2,
        explain: "C = 600 + 5 × (Q/8) = 600 + (5/8)Q 예요. 고정 비용 600이 y절편이 됩니다.",
      },
      {
        kind: "number",
        id: "c3s3",
        ask: "이 제품을 240만큼 생산하기 위한 총비용을 구하세요.",
        tex: "C = 600 + \\dfrac{5}{8} \\times 240",
        hint: "노동량은 240 ÷ 8 = 30. 임금은 5 × 30.",
        answer: 750,
        suffix: "",
        explain: "노동량 30이 필요하고 임금이 5 × 30 = 150. 총비용은 600 + 150 = 750이에요.",
      },
      {
        kind: "number",
        id: "c3s4",
        ask: "총비용이 1,000이 되려면 생산량은 얼마여야 할까요?",
        tex: "600 + \\dfrac{5}{8}Q = 1000",
        hint: "가변 비용이 400이 되어야 해요. (5/8)Q = 400",
        answer: 640,
        suffix: "",
        explain: "(5/8)Q = 400 → Q = 400 × 8 ÷ 5 = 640. 확인하면 600 + 5 × (640/8) = 600 + 400 = 1,000이에요.",
      },
    ],
    wrapUp:
      "생산함수 → (역함수) → 노동함수 → 임금을 곱해 가변 비용 → 고정 비용을 더해 비용함수. 이 네 걸음이 비용함수를 만드는 길입니다.",
  },
  {
    id: "c4",
    emoji: "👜",
    title: "문제 4 · 노동을 늘려도 생산이 천천히 늘 때",
    scenario:
      "가방을 만드는 어느 공장의 고정 비용이 250이고 투입되는 노동의 1단위당 임금은 4이다. 가방의 생산량 Q가 투입된 노동량 L에 대하여 다음과 같다고 한다.",
    tex: "Q = 5\\sqrt{L}",
    given: [
      { label: "고정 비용 F", value: "250" },
      { label: "노동 1단위당 임금 R", value: "4" },
      { label: "생산함수", value: "Q = 5√L" },
    ],
    steps: [
      {
        kind: "choice",
        id: "c4s1",
        ask: "노동함수 L(Q)를 고르세요.",
        tex: "Q = 5\\sqrt{L}",
        hint: "양변을 5로 나눈 뒤 제곱해 보세요.",
        options: [
          { tex: "L(Q) = \\dfrac{Q^2}{25}" },
          { tex: "L(Q) = \\dfrac{Q}{5}" },
          { tex: "L(Q) = 25Q^2" },
          { tex: "L(Q) = \\dfrac{\\sqrt{Q}}{5}" },
        ],
        answer: 0,
        explain: "√L = Q/5 이므로 양변을 제곱하면 L = Q²/25 예요.",
      },
      {
        kind: "choice",
        id: "c4s2",
        ask: "그럼 비용함수 C를 고르세요.",
        tex: "C = F + R \\times L(Q)",
        hint: "C = 250 + 4 × (Q²/25)",
        options: [
          { tex: "C = 250 + \\dfrac{4}{25}Q" },
          { tex: "C = 250 + \\dfrac{25}{4}Q^2" },
          { tex: "C = 250 + \\dfrac{4}{25}Q^2" },
          { tex: "C = 250 + 100Q^2" },
        ],
        answer: 2,
        explain: "C = 250 + 4 × (Q²/25) = 250 + (4/25)Q². 이번에는 비용함수가 이차함수가 되었어요.",
      },
      {
        kind: "number",
        id: "c4s3",
        ask: "가방을 50개 생산하기 위한 총비용을 구하세요.",
        tex: "C = 250 + \\dfrac{4}{25} \\times 50^2",
        hint: "노동량은 50² ÷ 25 = 100. 임금은 4 × 100.",
        answer: 650,
        suffix: "",
        explain: "노동량 100이 필요하고 임금이 400. 총비용은 250 + 400 = 650이에요.",
      },
      {
        kind: "choice",
        id: "c4s4",
        ask: "생산량을 2배인 100개로 늘리면 가변 비용은 몇 배가 될까요?",
        tex: "\\dfrac{4}{25}Q^2",
        hint: "Q가 2배가 되면 Q²은 몇 배가 될까요?",
        options: [{ text: "2배" }, { text: "4배" }, { text: "8배" }, { text: "16배" }],
        answer: 1,
        explain:
          "Q²에 비례하므로 2² = 4배! 가변 비용이 400에서 1,600으로 늘어요. 노동을 늘려도 생산이 천천히 느는 공장은 많이 만들수록 비용이 가파르게 올라갑니다.",
      },
    ],
    wrapUp:
      "생산함수의 모양이 달라지면 비용함수의 모양도 달라져요. Q = aL 이면 비용함수는 일차함수, Q = a√L 이면 비용함수는 이차함수가 됩니다.",
  },
];
