// 명제와 조건 — 활동 데이터
//
//  ① 명제일까?      문장이 명제인지 가리고, 명제이면 참·거짓까지 판정한다.
//  ② 진리집합 만들기  전체집합의 원소 가운데 조건을 참이 되게 하는 것을 골라 담는다.
//  ③ 수직선 진리집합  부등식 조건의 진리집합을 수직선 위에서 만들고, 실수 전체일 때와 견준다.
//  ④ 조건 ↔ 진리집합  조건과 진리집합을 짝짓는다.

export function listTex(xs: (string | number)[]): string {
  return xs.length ? `\\{${xs.join(",\\; ")}\\}` : "\\varnothing";
}
/** 원소에 한글이 섞이면 KaTeX 로 그릴 수 없다 */
export function hasHangul(xs: string[]): boolean {
  return xs.some((x) => /[ㄱ-ㆎ가-힣]/.test(x));
}
export function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}
export function upTo(n: number): string[] {
  return Array.from({ length: n }, (_, i) => String(i + 1));
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 명제일까?
// ══════════════════════════════════════════════════════════════
/** 명제가 아닌 까닭 */
export type NotWhy = "vague" | "variable" | "order";
export const NOT_WHY: Record<NotWhy, { tag: string; note: string }> = {
  vague: { tag: "기준이 사람마다 달라요", note: "재미있다·좋다 처럼 사람마다 다르게 느끼는 말이 들어 있으면 참·거짓을 가릴 수 없어요." },
  variable: { tag: "변수 때문에 값에 따라 달라져요", note: "x 같은 변수가 들어 있어 값에 따라 참이 되기도, 거짓이 되기도 해요. 이런 것은 명제가 아니라 「조건」이라고 불러요." },
  order: { tag: "참·거짓을 따질 수 있는 문장이 아니에요", note: "권하거나 시키는 말, 느낌을 나타내는 말은 참인지 거짓인지 물을 수 없어요." },
};

export type PropCard = {
  id: string;
  pre: string;
  tex?: string;
  post?: string;
  isProp: boolean;
  /** 명제일 때의 참·거짓 */
  truth?: boolean;
  why: string;
  notWhy?: NotWhy;
};

export const CARDS: PropCard[] = [
  // ── 명제 (참) ──
  { id: "p1", pre: "7은 소수이다.", isProp: true, truth: true, why: "7의 약수는 1과 7뿐이니 소수가 맞아요." },
  { id: "p2", pre: "", tex: "3 \\times 5 = 15", isProp: true, truth: true, why: "계산해 보면 그대로 맞는 식이에요." },
  { id: "p3", pre: "정삼각형의 세 각의 크기는 모두 같다.", isProp: true, truth: true, why: "정삼각형의 세 각은 모두 60°로 같아요." },
  // ── 명제 (거짓) ──
  { id: "p4", pre: "", tex: "4 > 9", isProp: true, truth: false, why: "4는 9보다 작으므로 거짓이에요. 거짓이어도 참·거짓을 가릴 수 있으니 명제랍니다." },
  { id: "p5", pre: "12는 5의 배수이다.", isProp: true, truth: false, why: "12를 5로 나누면 나누어떨어지지 않아요." },
  { id: "p6", pre: "모든 정사각형은 서로 합동이다.", isProp: true, truth: false, why: "한 변의 길이가 다르면 합동이 아니에요. 반례가 있으니 거짓입니다." },
  // ── 명제가 아닌 것 ──
  { id: "n1", pre: "축구는 재미있다.", isProp: false, notWhy: "vague", why: "재미있다고 느끼는 사람도, 아닌 사람도 있어요." },
  { id: "n2", pre: "이 문제는 쉽다.", isProp: false, notWhy: "vague", why: "쉽다고 느끼는 정도가 사람마다 달라 참·거짓을 가릴 수 없어요." },
  { id: "n3", pre: "", tex: "x + 3 = 8", isProp: false, notWhy: "variable", why: "x가 5이면 참이지만 다른 값이면 거짓이에요. 이런 문장이 바로 「조건」이랍니다." },
  { id: "n4", pre: "x는 4의 약수이다.", isProp: false, notWhy: "variable", why: "x가 2이면 참, 3이면 거짓 — 값에 따라 달라지니 명제가 아니라 조건이에요." },
  { id: "n5", pre: "물을 아껴 쓰자.", isProp: false, notWhy: "order", why: "권하는 말이라 참인지 거짓인지 물을 수 없어요." },
  { id: "n6", pre: "오늘 날씨가 참 좋구나!", isProp: false, notWhy: "order", why: "느낌을 나타내는 말이라 참·거짓을 따질 수 없어요." },
];

/** 명제인 것과 아닌 것이 섞여 나오도록 미리 정해 둔 차례 (무작위를 쓰지 않아 서버 렌더와 어긋나지 않는다) */
export const CARD_ORDER = [0, 6, 3, 8, 1, 9, 4, 7, 10, 2, 11, 5];

/** 「섞기」를 누를 때만 쓰는 뒤섞기 — 사용자가 누른 뒤에만 돌아가므로 서버 렌더와 어긋나지 않는다 */
export function shuffled(xs: number[]): number[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 진리집합 만들기
// ══════════════════════════════════════════════════════════════
export const BADGE: Record<string, string> = { glasses: "👓 안경", pet: "🐶 반려동물", soccer: "⚽ 축구", piano: "🎹 피아노" };

export type Person = { name: string; traits: string[] };
export const CLASS: Person[] = [
  { name: "지훈", traits: ["glasses", "soccer"] },
  { name: "서연", traits: ["pet", "piano"] },
  { name: "민준", traits: ["glasses", "pet", "soccer"] },
  { name: "하윤", traits: ["piano"] },
  { name: "태오", traits: ["pet", "soccer"] },
  { name: "유나", traits: ["glasses", "piano"] },
];

export type TruthTask = {
  id: string;
  kind: "num" | "person";
  name: string;
  univLabel: string;
  /** 전체집합의 원소 */
  items: string[];
  condPre: string;
  condTex?: string;
  condPost?: string;
  answer: string[];
  tip: string;
};

export const TRUTHS: TruthTask[] = [
  {
    id: "t1",
    kind: "num",
    name: "p",
    univLabel: "12 이하의 자연수",
    items: upTo(12),
    condPre: "x는 4의 약수이다",
    answer: ["1", "2", "4"],
    tip: "4를 나누어떨어지게 하는 수는 1, 2, 4 뿐이에요.",
  },
  {
    id: "t2",
    kind: "num",
    name: "q",
    univLabel: "12 이하의 자연수",
    items: upTo(12),
    condPre: "",
    condTex: "2x - 3 < 9",
    answer: ["1", "2", "3", "4", "5"],
    tip: "양변에 3을 더하고 2로 나누면 x < 6 이에요. 전체집합이 자연수이니 1부터 5까지랍니다.",
  },
  {
    id: "t3",
    kind: "num",
    name: "r",
    univLabel: "15 이하의 자연수",
    items: upTo(15),
    condPre: "x는 3의 배수이다",
    answer: ["3", "6", "9", "12", "15"],
    tip: "15 이하의 3의 배수는 다섯 개예요.",
  },
  {
    id: "t4",
    kind: "num",
    name: "s",
    univLabel: "10 이하의 자연수",
    items: upTo(10),
    condPre: "",
    condTex: "x^2 \\ge 25",
    answer: ["5", "6", "7", "8", "9", "10"],
    tip: "제곱해서 25 이상이 되려면 5부터예요. 4의 제곱은 16이라 모자라요.",
  },
  {
    id: "t5",
    kind: "person",
    name: "p",
    univLabel: "우리 모둠의 학생",
    items: CLASS.map((c) => c.name),
    condPre: "x는 안경을 쓴 학생이다",
    answer: ["지훈", "민준", "유나"],
    tip: "조건이 수에 관한 것이 아니어도 진리집합을 똑같이 구할 수 있어요.",
  },
  {
    id: "t6",
    kind: "person",
    name: "q",
    univLabel: "우리 모둠의 학생",
    items: CLASS.map((c) => c.name),
    condPre: "x는 반려동물을 기르는 학생이다",
    answer: ["서연", "민준", "태오"],
    tip: "민준이는 안경도 쓰고 반려동물도 길러요. 두 진리집합에 모두 들어가지요.",
  },
];

export function traitsOf(name: string): string[] {
  return CLASS.find((c) => c.name === name)?.traits ?? [];
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 수직선 진리집합
// ══════════════════════════════════════════════════════════════
export type LineTask = {
  id: string;
  name: string;
  univLabel: string;
  /** 수직선에 찍는 전체집합의 원소 */
  points: number[];
  /** 수직선이 보여 줄 범위 */
  from: number;
  to: number;
  condTex: string;
  solvedTex: string;
  answer: number[];
  /** 전체집합이 실수 전체일 때의 구간 */
  real: { lo: number | null; hi: number | null; loClosed: boolean; hiClosed: boolean };
  tip: string;
};

const range = (a: number, b: number): number[] => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export const LINES: LineTask[] = [
  {
    id: "n1",
    name: "p",
    univLabel: "8 이하의 자연수",
    points: range(1, 8),
    from: 0,
    to: 9,
    condTex: "2x + 1 \\le 9",
    solvedTex: "x \\le 4",
    answer: [1, 2, 3, 4],
    real: { lo: null, hi: 4, loClosed: false, hiClosed: true },
    tip: "양변에서 1을 빼고 2로 나누면 x ≤ 4 예요.",
  },
  {
    id: "n2",
    name: "q",
    univLabel: "10 이하의 자연수",
    points: range(1, 10),
    from: 0,
    to: 11,
    condTex: "3x - 2 > 13",
    solvedTex: "x > 5",
    answer: [6, 7, 8, 9, 10],
    real: { lo: 5, hi: null, loClosed: false, hiClosed: false },
    tip: "x > 5 이므로 5는 들어가지 않아요. 수직선에서도 5 자리가 비어 있지요.",
  },
  {
    id: "n3",
    name: "r",
    univLabel: "−3 이상 5 이하의 정수",
    points: range(-3, 5),
    from: -4,
    to: 6,
    condTex: "-2 \\le x < 3",
    solvedTex: "-2 \\le x < 3",
    answer: [-2, -1, 0, 1, 2],
    real: { lo: -2, hi: 3, loClosed: true, hiClosed: false },
    tip: "왼쪽 끝 −2 는 들어가고 오른쪽 끝 3 은 들어가지 않아요.",
  },
  {
    id: "n4",
    name: "s",
    univLabel: "12 이하의 자연수",
    points: range(1, 12),
    from: 0,
    to: 13,
    condTex: "5 < 2x \\le 16",
    solvedTex: "2.5 < x \\le 8",
    answer: [3, 4, 5, 6, 7, 8],
    real: { lo: 2.5, hi: 8, loClosed: false, hiClosed: true },
    tip: "모두 2로 나누면 2.5 < x ≤ 8 이에요. 자연수 중에서는 3부터 8까지랍니다.",
  },
];

/** 수직선 자리 */
export const NL = { w: 620, h: 150, x0: 44, x1: 580, axisY: 96, barY: 52 };
export function nlX(t: LineTask, v: number): number {
  return NL.x0 + ((v - t.from) / (t.to - t.from)) * (NL.x1 - NL.x0);
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 조건 ↔ 진리집합 짝짓기
// ══════════════════════════════════════════════════════════════
export const MATCH_UNIV = upTo(12);

export type MatchItem = { id: string; name: string; condPre: string; condTex?: string; set: string[] };

export const MATCHES: MatchItem[] = [
  { id: "m1", name: "p", condPre: "x는 12의 약수이다", set: ["1", "2", "3", "4", "6", "12"] },
  { id: "m2", name: "q", condPre: "x는 소수이다", set: ["2", "3", "5", "7", "11"] },
  { id: "m3", name: "r", condPre: "x는 4의 배수이다", set: ["4", "8", "12"] },
  { id: "m4", name: "s", condPre: "", condTex: "x^2 < 20", set: ["1", "2", "3", "4"] },
  { id: "m5", name: "t", condPre: "x는 3의 배수이다", set: ["3", "6", "9", "12"] },
];

/** 진리집합 카드를 섞어 놓는 차례 (무작위를 쓰지 않아 서버 렌더와 어긋나지 않는다) */
export const SET_ORDER = [3, 0, 4, 1, 2];
