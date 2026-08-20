// 수요함수와 공급함수 — 활동 데이터
//
//  · 수요: 소비자가 주어진 가격으로 상품을 구입하고자 하는 욕구
//    수요량: 그 가격에서 구입하고자 하는 상품의 양
//  · 공급: 생산자가 주어진 가격으로 상품을 판매하고자 하는 욕구
//    공급량: 그 가격에서 판매하고자 하는 상품의 양
//  · 수요함수: 가격 말고 다른 조건이 모두 같다고 할 때, 수요량과 가격 사이의 대응 관계를 함수로 나타낸 것.
//    가격 x 에 대한 수요량을 Q_d 라 하면  Q_d = f(x).  그래프로 나타낸 것이 수요곡선.
//  · 공급함수도 마찬가지로  Q_s = f(x),  그래프가 공급곡선.
//  · [수요의 법칙] 가격이 오르면 수요량은 줄고, 가격이 내리면 수요량은 는다. (우하향)
//  · [공급의 법칙] 가격이 오르면 공급량은 늘고, 가격이 내리면 공급량은 준다. (우상향)
//  · 수학에서는 가격을 x축·수량을 y축에 놓지만, 경제학에서는 가격을 y축·수량을 x축에 놓는다.
//    (경제학자 Alfred Marshall 의 영향)  두 그래프는 직선 y = x 에 대하여 대칭 — 곧 역함수의 관계다.
//
//  ※ 아래 사례의 식과 수치는 함수의 모양을 살펴보기 위해 꾸민 것이다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}

/** 부호를 살려 항을 붙인다 (+ 3 / − 3) */
function signed(v: number): string {
  return v < 0 ? `- ${fmt(-v)}` : `+ ${fmt(v)}`;
}

// ══════════════════════════════════════════════════════════════
//  사례 — 수요함수 4개 · 공급함수 4개
// ══════════════════════════════════════════════════════════════
/** linear: Q = ax + b · inverse: Q = a/x · quad: Q = ax² + b · root: Q = a√x + b */
export type Kind = "linear" | "inverse" | "quad" | "root";
export type Side = "demand" | "supply";

export type MarketCase = {
  id: string;
  side: Side;
  emoji: string;
  name: string;
  story: string;
  tone: "emerald" | "sky" | "amber" | "violet";
  kind: Kind;
  /** 모양 이름 (한글) */
  shape: string;
  a: number;
  b: number;
  /** 가격 단위 (천원 / 만원) */
  priceUnit: string;
  /** 수량 단위 */
  qtyUnit: string;
  xMin: number;
  xMax: number;
  xStep: number;
  x0: number;
  /** 표에 쓸 가격들 */
  table: number[];
};

export const CASES: MarketCase[] = [
  // ── 수요함수 ──────────────────────────────────────────────
  {
    id: "movie",
    side: "demand",
    emoji: "🎫",
    name: "영화 티켓",
    story: "값이 오르면 극장에 가는 사람이 줄어요.",
    tone: "emerald",
    kind: "linear",
    shape: "오른쪽 아래로 내려가는 직선",
    a: -40,
    b: 600,
    priceUnit: "천원",
    qtyUnit: "장",
    xMin: 1,
    xMax: 15,
    xStep: 0.5,
    x0: 8,
    table: [2, 4, 6, 8, 10, 12],
  },
  {
    id: "boba",
    side: "demand",
    emoji: "🧋",
    name: "버블티",
    story: "한 잔에 천 원만 올라도 손이 덜 가죠.",
    tone: "sky",
    kind: "linear",
    shape: "오른쪽 아래로 내려가는 직선",
    a: -25,
    b: 200,
    priceUnit: "천원",
    qtyUnit: "잔",
    xMin: 1,
    xMax: 8,
    xStep: 0.25,
    x0: 4,
    table: [2, 3, 4, 5, 6, 7],
  },
  {
    id: "sneaker",
    side: "demand",
    emoji: "👟",
    name: "운동화",
    story: "값이 2배가 되면 팔리는 켤레는 절반으로.",
    tone: "amber",
    kind: "inverse",
    shape: "반비례 곡선",
    a: 600,
    b: 0,
    priceUnit: "만원",
    qtyUnit: "켤레",
    xMin: 2,
    xMax: 20,
    xStep: 0.5,
    x0: 6,
    table: [2, 4, 6, 8, 10, 12],
  },
  {
    id: "choco",
    side: "demand",
    emoji: "🍫",
    name: "수제 초콜릿",
    story: "처음엔 조금씩 줄다가 비싸질수록 뚝 떨어져요.",
    tone: "violet",
    kind: "quad",
    shape: "아래로 굽으며 내려가는 곡선",
    a: -2,
    b: 200,
    priceUnit: "천원",
    qtyUnit: "개",
    xMin: 0,
    xMax: 10,
    xStep: 0.25,
    x0: 5,
    table: [0, 2, 4, 6, 8, 10],
  },
  // ── 공급함수 ──────────────────────────────────────────────
  {
    id: "croissant",
    side: "supply",
    emoji: "🥐",
    name: "크루아상",
    story: "2천 원보다 싸게 팔면 손해라 아예 굽지 않아요.",
    tone: "amber",
    kind: "linear",
    shape: "오른쪽 위로 올라가는 직선",
    a: 30,
    b: -60,
    priceUnit: "천원",
    qtyUnit: "개",
    xMin: 2,
    xMax: 12,
    xStep: 0.25,
    x0: 6,
    table: [2, 4, 6, 8, 10, 12],
  },
  {
    id: "jeans",
    side: "supply",
    emoji: "👖",
    name: "청바지",
    story: "값이 오른 만큼 그대로 더 만들어 내요.",
    tone: "sky",
    kind: "linear",
    shape: "원점을 지나는 직선 (정비례)",
    a: 250,
    b: 0,
    priceUnit: "만원",
    qtyUnit: "벌",
    xMin: 1,
    xMax: 10,
    xStep: 0.25,
    x0: 4,
    table: [1, 2, 4, 6, 8, 10],
  },
  {
    id: "plant",
    side: "supply",
    emoji: "🪴",
    name: "다육식물",
    story: "값이 올라도 자라는 데 시간이 걸려 천천히 늘어요.",
    tone: "emerald",
    kind: "root",
    shape: "완만해지며 올라가는 곡선",
    a: 80,
    b: 0,
    priceUnit: "천원",
    qtyUnit: "개",
    xMin: 0,
    xMax: 25,
    xStep: 0.5,
    x0: 9,
    table: [0, 1, 4, 9, 16, 25],
  },
  {
    id: "bean",
    side: "supply",
    emoji: "☕",
    name: "원두",
    story: "값이 오를수록 더 가파르게 쏟아져 나와요.",
    tone: "violet",
    kind: "quad",
    shape: "가팔라지며 올라가는 곡선",
    a: 2,
    b: 0,
    priceUnit: "천원",
    qtyUnit: "kg",
    xMin: 0,
    xMax: 20,
    xStep: 0.5,
    x0: 10,
    table: [0, 4, 8, 12, 16, 20],
  },
];

export const DEMAND_CASES = CASES.filter((c) => c.side === "demand");
export const SUPPLY_CASES = CASES.filter((c) => c.side === "supply");

/** 탭 ③ 에서 다룰 사례 — 역함수가 깔끔한 네 가지 */
export const FLIP_IDS = ["movie", "sneaker", "croissant", "plant"];

export function caseOf(id: string): MarketCase {
  return CASES.find((c) => c.id === id) ?? CASES[0];
}

/** 기호 */
export function sym(c: MarketCase): string {
  return c.side === "demand" ? "Q_d" : "Q_s";
}

/** 가격 x 에서의 수요량·공급량 */
export function qOf(c: MarketCase, x: number): number {
  switch (c.kind) {
    case "linear":
      return c.a * x + c.b;
    case "inverse":
      return x <= 0 ? 0 : c.a / x;
    case "quad":
      return c.a * x * x + c.b;
    default:
      return c.a * Math.sqrt(Math.max(0, x)) + c.b;
  }
}

/** 구간 안에서의 최대 수량 — 그래프 세로 눈금에 쓴다 */
export function qMaxOf(c: MarketCase): number {
  return Math.max(qOf(c, c.xMin), qOf(c, c.xMax), 1);
}

/** 함수식 (KaTeX) */
export function fnTex(c: MarketCase): string {
  const s = sym(c);
  switch (c.kind) {
    case "linear":
      return c.b === 0 ? `${s} = ${fmt(c.a)}x` : `${s} = ${fmt(c.a)}x ${signed(c.b)}`;
    case "inverse":
      return `${s} = \\dfrac{${fmt(c.a)}}{x}`;
    case "quad":
      return c.b === 0 ? `${s} = ${fmt(c.a)}x^2` : `${s} = ${fmt(c.a)}x^2 ${signed(c.b)}`;
    default:
      return c.b === 0 ? `${s} = ${fmt(c.a)}\\sqrt{x}` : `${s} = ${fmt(c.a)}\\sqrt{x} ${signed(c.b)}`;
  }
}

/** 값을 넣어 계산하는 과정 (KaTeX) */
export function substTex(c: MarketCase, x: number): string {
  const s = sym(c);
  const q = fmt(qOf(c, x), 1);
  switch (c.kind) {
    case "linear":
      return c.b === 0
        ? `${s} = ${fmt(c.a)} \\times ${fmt(x)} = ${q}`
        : `${s} = ${fmt(c.a)} \\times ${fmt(x)} ${signed(c.b)} = ${q}`;
    case "inverse":
      return `${s} = \\dfrac{${fmt(c.a)}}{${fmt(x)}} = ${q}`;
    case "quad":
      return c.b === 0
        ? `${s} = ${fmt(c.a)} \\times ${fmt(x)}^2 = ${q}`
        : `${s} = ${fmt(c.a)} \\times ${fmt(x)}^2 ${signed(c.b)} = ${q}`;
    default:
      return c.b === 0
        ? `${s} = ${fmt(c.a)}\\sqrt{${fmt(x)}} = ${q}`
        : `${s} = ${fmt(c.a)}\\sqrt{${fmt(x)}} ${signed(c.b)} = ${q}`;
  }
}

/** 가격을 수량의 식으로 다시 쓴 것 = 역함수 (KaTeX) */
export function invTex(c: MarketCase): string {
  const s = sym(c);
  switch (c.kind) {
    case "linear":
      if (c.a < 0) return `x = \\dfrac{${fmt(c.b)} - ${s}}{${fmt(-c.a)}}`;
      if (c.b === 0) return `x = \\dfrac{${s}}{${fmt(c.a)}}`;
      return c.b < 0 ? `x = \\dfrac{${s} + ${fmt(-c.b)}}{${fmt(c.a)}}` : `x = \\dfrac{${s} - ${fmt(c.b)}}{${fmt(c.a)}}`;
    case "inverse":
      return `x = \\dfrac{${fmt(c.a)}}{${s}}`;
    case "quad":
      return c.a < 0
        ? `x = \\sqrt{\\dfrac{${fmt(c.b)} - ${s}}{${fmt(-c.a)}}}`
        : `x = \\sqrt{\\dfrac{${s} ${c.b === 0 ? "" : signed(-c.b)}}{${fmt(c.a)}}}`;
    default:
      return c.b === 0
        ? `x = \\left(\\dfrac{${s}}{${fmt(c.a)}}\\right)^2`
        : `x = \\left(\\dfrac{${s} ${signed(-c.b)}}{${fmt(c.a)}}\\right)^2`;
  }
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 퀴즈
// ══════════════════════════════════════════════════════════════
export type Quiz = { id: string; q: string; options: string[]; answer: number; why: string };

export const FLIP_QUIZZES: Quiz[] = [
  {
    id: "fq1",
    q: "경제학에서 그리는 수요곡선의 가로축은 무엇일까?",
    options: ["가격", "수량 (수요량)", "시간"],
    answer: 1,
    why: "경제학에서는 가격을 세로축, 수량을 가로축에 놓아요. 수학에서 배운 것과 반대죠.",
  },
  {
    id: "fq2",
    q: "수학식 그래프와 경제학식 그래프는 서로 어떤 관계일까?",
    options: ["위아래로 평행이동한 것", "아무 관계 없는 다른 그래프", "직선 y = x 에 대하여 대칭"],
    answer: 2,
    why: "가로와 세로를 맞바꾼 것이니 y = x 에 대한 대칭! 곧 역함수의 그래프예요.",
  },
  {
    id: "fq3",
    q: "경제학 그래프에서도 수요곡선이 오른쪽 아래로 내려가는 까닭은?",
    options: ["값이 비쌀수록 사려는 양이 적어서", "축을 뒤집었기 때문에", "공급이 줄어들어서"],
    answer: 0,
    why: "축을 어떻게 놓든 가격과 수요량이 반대로 움직인다는 사실은 그대로예요. 그래서 두 그림 모두 우하향입니다.",
  },
  {
    id: "fq4",
    q: "공급곡선을 경제학식으로 그리면 어떤 모양일까?",
    options: ["오른쪽 아래로 내려간다", "가로로 눕는다", "오른쪽 위로 올라간다"],
    answer: 2,
    why: "가격이 오르면 공급량도 늘어나니 두 그림 모두 우상향이에요.",
  },
];

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
  tex: string;
  table?: { head: [string, string]; rows: [string, string][] };
  given: { label: string; value: string }[];
  steps: PStep[];
  wrapUp: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "d1",
    emoji: "🥤",
    title: "문제 1 · 반비례 수요함수",
    scenario: "어느 회사에서 만드는 텀블러의 가격 x만 원에 대한 수요함수가 다음과 같다고 한다.",
    tex: "Q_d = \\dfrac{720}{x}",
    given: [
      { label: "수요함수", value: "Qd = 720 ÷ x" },
      { label: "가격 단위", value: "만원" },
      { label: "수요량 단위", value: "개" },
    ],
    steps: [
      {
        kind: "number",
        id: "d1s1",
        ask: "가격이 3만 원일 때의 수요량을 구하세요.",
        tex: "Q_d = \\dfrac{720}{3}",
        hint: "720 ÷ 3",
        answer: 240,
        suffix: "개",
        explain: "720 ÷ 3 = 240개예요.",
      },
      {
        kind: "number",
        id: "d1s2",
        ask: "가격이 6만 원일 때의 수요량을 구하세요.",
        tex: "Q_d = \\dfrac{720}{6}",
        hint: "720 ÷ 6",
        answer: 120,
        suffix: "개",
        explain: "720 ÷ 6 = 120개. 값이 오르니 수요량이 줄었죠? 이것이 수요의 법칙이에요.",
      },
      {
        kind: "choice",
        id: "d1s3",
        ask: "가격이 2배가 되면 수요량은 어떻게 될까요?",
        hint: "3만 원일 때 240개, 6만 원일 때 120개였어요.",
        options: [{ text: "2배가 된다" }, { text: "절반으로 줄어든다" }, { text: "그대로다" }, { text: "4배가 된다" }],
        answer: 1,
        explain: "반비례 관계라 가격이 2배가 되면 수요량은 절반이 돼요.",
      },
      {
        kind: "number",
        id: "d1s4",
        ask: "수요량이 90개가 되게 하려면 가격을 얼마로 정해야 할까요? (만원 단위)",
        tex: "\\dfrac{720}{x} = 90",
        hint: "720 ÷ 90",
        answer: 8,
        suffix: "만원",
        explain: "720 ÷ x = 90 → x = 8. 8만 원으로 정하면 90개가 팔려요.",
      },
    ],
    wrapUp:
      "수요함수가 반비례이면 가격과 수요량을 곱한 값이 늘 일정해요. 3 × 240 = 6 × 120 = 8 × 90 = 720 이죠.",
  },
  {
    id: "d2",
    emoji: "🎧",
    title: "문제 2 · 표에서 수요함수 찾기",
    scenario:
      "어떤 헤드폰의 가격 x만 원에 대한 수요함수가 Qd = ax + b라고 한다. 가격에 따른 수요량을 조사한 표가 오른쪽과 같을 때, 상수 a, b의 값을 구해 보자.",
    tex: "Q_d = ax + b",
    table: { head: ["가격 (만원)", "수요량 (개)"], rows: [["4", "36"], ["10", "18"]] },
    given: [
      { label: "수요함수", value: "Qd = ax + b" },
      { label: "조건 1", value: "가격 4만원 → 수요량 36개" },
      { label: "조건 2", value: "가격 10만원 → 수요량 18개" },
    ],
    steps: [
      {
        kind: "number",
        id: "d2s1",
        ask: "상수 a의 값을 구하세요. (음수면 - 기호를 함께 쓰세요)",
        tex: "a = \\dfrac{18 - 36}{10 - 4}",
        hint: "수요량의 변화량 ÷ 가격의 변화량 = (18 − 36) ÷ (10 − 4)",
        answer: -3,
        suffix: "",
        explain: "(18 − 36) ÷ (10 − 4) = −18 ÷ 6 = −3. 값이 1만 원 오를 때마다 3개씩 줄어든다는 뜻이에요.",
      },
      {
        kind: "number",
        id: "d2s2",
        ask: "상수 b의 값을 구하세요.",
        tex: "36 = -3 \\times 4 + b",
        hint: "36 = −12 + b",
        answer: 48,
        suffix: "",
        explain: "36 = −12 + b 이므로 b = 48. 따라서 수요함수는 Qd = −3x + 48 이에요.",
      },
      {
        kind: "number",
        id: "d2s3",
        ask: "가격이 12만 원일 때의 수요량은 얼마일까요?",
        tex: "Q_d = -3 \\times 12 + 48",
        hint: "−36 + 48",
        answer: 12,
        suffix: "개",
        explain: "−36 + 48 = 12개예요.",
      },
      {
        kind: "number",
        id: "d2s4",
        ask: "수요량이 0이 되는 가격은 얼마일까요? (만원 단위)",
        tex: "-3x + 48 = 0",
        hint: "3x = 48",
        answer: 16,
        suffix: "만원",
        explain: "−3x + 48 = 0 → x = 16. 16만 원이 넘으면 아무도 사지 않는다는 뜻이에요.",
      },
    ],
    wrapUp:
      "표의 두 점을 지나는 직선을 찾는 문제였어요. a는 직선의 기울기, b는 세로축과 만나는 값(y절편)입니다. 수요함수의 기울기가 음수인 것이 바로 수요의 법칙이에요.",
  },
  {
    id: "s1",
    emoji: "☂️",
    title: "문제 3 · 정비례 공급함수",
    scenario: "어느 공장에서 만드는 우산의 가격 x만 원에 대한 공급함수가 다음과 같다고 한다.",
    tex: "Q_s = 300x",
    given: [
      { label: "공급함수", value: "Qs = 300x" },
      { label: "가격 단위", value: "만원" },
      { label: "공급량 단위", value: "개" },
    ],
    steps: [
      {
        kind: "number",
        id: "s1s1",
        ask: "가격이 5만 원일 때의 공급량을 구하세요.",
        tex: "Q_s = 300 \\times 5",
        hint: "300 × 5",
        answer: 1500,
        suffix: "개",
        explain: "300 × 5 = 1,500개예요.",
      },
      {
        kind: "number",
        id: "s1s2",
        ask: "가격이 7만 원일 때의 공급량을 구하세요.",
        tex: "Q_s = 300 \\times 7",
        hint: "300 × 7",
        answer: 2100,
        suffix: "개",
        explain: "300 × 7 = 2,100개. 값이 오르니 공급량이 늘었어요 — 공급의 법칙이죠.",
      },
      {
        kind: "number",
        id: "s1s3",
        ask: "공급량이 2,400개가 되려면 가격이 얼마여야 할까요? (만원 단위)",
        tex: "300x = 2400",
        hint: "2400 ÷ 300",
        answer: 8,
        suffix: "만원",
        explain: "300x = 2,400 → x = 8. 8만 원이면 2,400개를 내놓아요.",
      },
      {
        kind: "choice",
        id: "s1s4",
        ask: "이 공급함수의 그래프를 수학에서처럼 (가로축 = 가격, 세로축 = 공급량)으로 그리면 어떤 모양일까요?",
        tex: "Q_s = 300x",
        hint: "y = 300x 의 그래프를 떠올려 보세요.",
        options: [
          { text: "원점을 지나면서 오른쪽 위로 올라가는 직선" },
          { text: "오른쪽 아래로 내려가는 직선" },
          { text: "반비례 곡선" },
          { text: "가로로 누운 직선" },
        ],
        answer: 0,
        explain: "정비례이므로 원점을 지나는 우상향 직선이에요. 공급곡선은 늘 오른쪽 위로 올라갑니다.",
      },
    ],
    wrapUp: "공급함수가 정비례이면 가격이 2배가 될 때 공급량도 2배가 돼요. 그래프는 원점을 지나는 직선입니다.",
  },
  {
    id: "s2",
    emoji: "🪑",
    title: "문제 4 · 표에서 공급함수 찾기",
    scenario:
      "어떤 의자의 가격 x만 원에 대한 공급함수가 Qs = ax + b라고 한다. 가격에 따른 공급량을 조사한 표가 오른쪽과 같을 때, 상수 a, b의 값을 구해 보자.",
    tex: "Q_s = ax + b",
    table: { head: ["가격 (만원)", "공급량 (개)"], rows: [["6", "20"], ["14", "60"]] },
    given: [
      { label: "공급함수", value: "Qs = ax + b" },
      { label: "조건 1", value: "가격 6만원 → 공급량 20개" },
      { label: "조건 2", value: "가격 14만원 → 공급량 60개" },
    ],
    steps: [
      {
        kind: "number",
        id: "s2s1",
        ask: "상수 a의 값을 구하세요.",
        tex: "a = \\dfrac{60 - 20}{14 - 6}",
        hint: "(60 − 20) ÷ (14 − 6)",
        answer: 5,
        suffix: "",
        explain: "40 ÷ 8 = 5. 값이 1만 원 오를 때마다 5개씩 더 내놓는다는 뜻이에요.",
      },
      {
        kind: "number",
        id: "s2s2",
        ask: "상수 b의 값을 구하세요. (음수면 - 기호를 함께 쓰세요)",
        tex: "20 = 5 \\times 6 + b",
        hint: "20 = 30 + b",
        answer: -10,
        suffix: "",
        explain: "20 = 30 + b 이므로 b = −10. 따라서 공급함수는 Qs = 5x − 10 이에요.",
      },
      {
        kind: "number",
        id: "s2s3",
        ask: "가격이 20만 원일 때의 공급량은 얼마일까요?",
        tex: "Q_s = 5 \\times 20 - 10",
        hint: "100 − 10",
        answer: 90,
        suffix: "개",
        explain: "100 − 10 = 90개예요.",
      },
      {
        kind: "number",
        id: "s2s4",
        ask: "이 공장이 의자를 만들기 시작하는 가격은 얼마일까요? (공급량이 0이 되는 가격, 만원 단위)",
        tex: "5x - 10 = 0",
        hint: "5x = 10",
        answer: 2,
        suffix: "만원",
        explain: "5x − 10 = 0 → x = 2. 값이 2만 원보다 싸면 손해라 아예 만들지 않는다는 뜻이에요.",
      },
    ],
    wrapUp:
      "공급함수의 기울기 a는 양수예요. b가 음수면 그래프가 가로축과 만나는 자리, 곧 생산을 시작하는 최저 가격이 생깁니다.",
  },
];
