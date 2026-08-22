// 명제와 조건의 부정 — 활동 데이터
//
//  ① 부정 스위치      명제 p 의 부정 ~p 를 만들고, 참·거짓이 뒤집히는 것과 ~(~p) = p 를 확인한다.
//  ② 부등호 뒤집개    조건의 부등호를 뒤집어 부정을 만들고, 수직선에서 틈·겹침이 없는지 살핀다.
//  ③ 진리집합은 여집합 조건의 진리집합 P 를 직접 만들고, ~p 의 진리집합이 P 의 여집합임을 본다.
//  ④ 또는·그리고 뒤집기 드모르간 — ~(p 또는 q) = ~p 그리고 ~q 를 벤 다이어그램으로 맞춘다.

export function listTex(xs: (string | number)[]): string {
  return xs.length ? `\\{${xs.join(",\\; ")}\\}` : "\\varnothing";
}
export function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}
export function upTo(n: number): string[] {
  return Array.from({ length: n }, (_, i) => String(i + 1));
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 부정 스위치
// ══════════════════════════════════════════════════════════════
export type Choice = { pre: string; tex?: string };

export type NegCard = {
  id: string;
  /** 원래 명제 */
  pre: string;
  tex?: string;
  /** 원래 명제의 참·거짓 */
  truth: boolean;
  /** 왜 참(거짓)인지 */
  truthWhy: string;
  /** 부정 문장 4지선다 */
  choices: Choice[];
  answer: number;
  /** 고르면 나오는 한 줄 짚어 주기 (정답 자리는 빈 문자열) */
  choiceWhy: string[];
  /** 정답 해설 */
  why: string;
};

export const CARDS: NegCard[] = [
  {
    id: "c1",
    pre: "12는 4의 배수이다.",
    truth: true,
    truthWhy: "12 ÷ 4 = 3 이므로 나누어떨어져요.",
    choices: [
      { pre: "4는 12의 배수이다." },
      { pre: "12는 4의 배수가 아니다." },
      { pre: "12는 4의 약수이다." },
      { pre: "12는 5의 배수이다." },
    ],
    answer: 1,
    choiceWhy: [
      "주어와 술어를 뒤바꾼 문장이에요. 자리를 바꾸는 것은 부정이 아니랍니다.",
      "",
      "배수를 약수로 바꾼 문장이에요. 말을 바꾸는 것은 부정이 아니에요.",
      "수만 바꾼 문장이에요. 부정은 수를 바꾸는 것이 아니랍니다.",
    ],
    why: "「~이다」를 「~이 아니다」로 바꾸면 부정이에요. 원래 명제가 참이니 부정은 거짓입니다.",
  },
  {
    id: "c2",
    pre: "8은 소수이다.",
    truth: false,
    truthWhy: "8의 약수는 1, 2, 4, 8 이라 소수가 아니에요.",
    choices: [
      { pre: "8은 짝수이다." },
      { pre: "9는 소수이다." },
      { pre: "8은 소수도 짝수도 아니다." },
      { pre: "8은 소수가 아니다." },
    ],
    answer: 3,
    choiceWhy: [
      "참인 문장이기는 하지만, 「소수이다」를 부정한 문장은 아니에요.",
      "다른 수에 대한 문장이에요. 부정은 대상을 바꾸지 않아요.",
      "부정을 너무 많이 했어요. 「소수가 아니다」 하나면 충분해요.",
      "",
    ],
    why: "부정은 딱 그 문장만 뒤집어요. 원래 명제가 거짓이니 부정은 참입니다.",
  },
  {
    id: "c3",
    pre: "",
    tex: "7 - 2 = 6",
    truth: false,
    truthWhy: "7 − 2 = 5 이므로 6이 아니에요.",
    choices: [
      { pre: "", tex: "7 - 2 \\ne 6" },
      { pre: "", tex: "7 - 2 < 6" },
      { pre: "", tex: "7 - 2 = 5" },
      { pre: "", tex: "6 - 2 \\ne 7" },
    ],
    answer: 0,
    choiceWhy: [
      "",
      "「= 6」의 부정은 「< 6」이 아니에요. 6보다 큰 경우도 함께 담아야 하거든요.",
      "참인 식이지만 원래 식을 부정한 것은 아니에요.",
      "좌변의 수를 마음대로 바꾼 식이에요.",
    ],
    why: "등식의 부정은 「같지 않다(≠)」예요. 원래 명제가 거짓이니 부정은 참입니다.",
  },
  {
    id: "c4",
    pre: "정사각형은 마름모이다.",
    truth: true,
    truthWhy: "정사각형은 네 변의 길이가 모두 같으니 마름모의 조건을 갖추었어요.",
    choices: [
      { pre: "마름모는 정사각형이다." },
      { pre: "정사각형은 직사각형이다." },
      { pre: "정사각형은 마름모가 아니다." },
      { pre: "정사각형은 사다리꼴이 아니다." },
    ],
    answer: 2,
    choiceWhy: [
      "주어와 술어를 맞바꾼 문장이에요. 이건 부정이 아니라 「역」이랍니다.",
      "참인 문장이지만 원래 문장을 부정한 것은 아니에요.",
      "",
      "도형 이름을 다른 것으로 바꾼 문장이에요.",
    ],
    why: "「A는 B이다」의 부정은 「A는 B가 아니다」예요. 원래 명제가 참이니 부정은 거짓입니다.",
  },
  {
    id: "c5",
    pre: "15는 짝수가 아니다.",
    truth: true,
    truthWhy: "15는 2로 나누어떨어지지 않으니 짝수가 아닌 것이 맞아요.",
    choices: [
      { pre: "15는 짝수가 아니다." },
      { pre: "15는 짝수이다." },
      { pre: "15는 홀수이다." },
      { pre: "16은 짝수가 아니다." },
    ],
    answer: 1,
    choiceWhy: [
      "원래 문장 그대로예요. 부정하면 「아니다」가 떨어져 나가야 해요.",
      "",
      "원래 문장과 뜻이 같은 문장이에요. 부정이 아니랍니다.",
      "다른 수에 대한 문장이에요.",
    ],
    why: "이미 「아니다」가 붙어 있으면 그것을 떼어 내는 것이 부정이에요. 원래 명제가 참이니 부정은 거짓입니다.",
  },
  {
    id: "c6",
    pre: "고래는 물고기이다.",
    truth: false,
    truthWhy: "고래는 새끼를 낳아 젖을 먹이는 포유류예요.",
    choices: [
      { pre: "물고기는 고래가 아니다." },
      { pre: "고래는 포유류이다." },
      { pre: "상어는 물고기가 아니다." },
      { pre: "고래는 물고기가 아니다." },
    ],
    answer: 3,
    choiceWhy: [
      "주어와 술어를 뒤바꾼 문장이에요.",
      "참인 문장이지만 원래 문장을 부정한 것은 아니에요.",
      "다른 동물에 대한 문장이에요.",
      "",
    ],
    why: "부정은 그 문장 하나만 뒤집어요. 원래 명제가 거짓이니 부정은 참입니다.",
  },
];

/** 참인 명제와 거짓인 명제가 번갈아 나오도록 미리 정해 둔 차례 (무작위를 쓰지 않아 서버 렌더와 어긋나지 않는다) */
export const CARD_ORDER = [0, 1, 4, 2, 3, 5];

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
// 탭 ② 부등호 뒤집개
// ══════════════════════════════════════════════════════════════
export type Op = "lt" | "le" | "gt" | "ge" | "eq" | "ne";

export const OPS: Op[] = ["lt", "le", "gt", "ge", "eq", "ne"];
export const OP_TEX: Record<Op, string> = { lt: "<", le: "\\le", gt: ">", ge: "\\ge", eq: "=", ne: "\\ne" };
export const OP_NAME: Record<Op, string> = {
  lt: "작다",
  le: "작거나 같다",
  gt: "크다",
  ge: "크거나 같다",
  eq: "같다",
  ne: "같지 않다",
};
export const NEG_OP: Record<Op, Op> = { lt: "ge", ge: "lt", gt: "le", le: "gt", eq: "ne", ne: "eq" };

/** 수직선을 기준수로 자른 세 조각 — 0: 기준수보다 작은 쪽 · 1: 기준수 자신 · 2: 기준수보다 큰 쪽 */
export const PIECES = [0, 1, 2];
export function piecesOf(op: Op): number[] {
  switch (op) {
    case "lt":
      return [0];
    case "le":
      return [0, 1];
    case "gt":
      return [2];
    case "ge":
      return [1, 2];
    case "eq":
      return [1];
    default:
      return [0, 2];
  }
}
/** 두 조건이 동시에 참이 되는 조각 */
export function overlapPieces(a: Op, b: Op): number[] {
  const pb = piecesOf(b);
  return piecesOf(a).filter((m) => pb.includes(m));
}
/** 어느 쪽도 참이 되지 않는 조각 */
export function gapPieces(a: Op, b: Op): number[] {
  const all = [...piecesOf(a), ...piecesOf(b)];
  return PIECES.filter((m) => !all.includes(m));
}

export type IneqTask = {
  id: string;
  op: Op;
  num: number;
  from: number;
  to: number;
  tip: string;
};

export const INEQS: IneqTask[] = [
  { id: "i1", op: "lt", num: 4, from: -1, to: 9, tip: "「4보다 작다」가 아니려면 4와 같거나 4보다 커야 해요." },
  { id: "i2", op: "ge", num: 1, from: -4, to: 6, tip: "「1보다 크거나 같다」에는 1이 들어 있어요. 부정에는 1이 빠져야 하지요." },
  { id: "i3", op: "gt", num: -2, from: -7, to: 3, tip: "「−2보다 크다」가 아니려면 −2이거나 그보다 작아야 해요." },
  { id: "i4", op: "le", num: 5, from: 0, to: 10, tip: "「5보다 작거나 같다」에는 5가 들어 있어요. 부정은 5를 넘는 수랍니다." },
  { id: "i5", op: "eq", num: 2, from: -3, to: 7, tip: "「2와 같다」가 아닌 수는 2를 뺀 나머지 전부예요." },
  { id: "i6", op: "ne", num: 3, from: -2, to: 8, tip: "「3이 아니다」가 아니라는 말은 곧 「3이다」라는 뜻이에요." },
];

/** 부등호를 부정하는 짝 (탭 ② 를 다 풀면 완성되는 표) */
export const OP_PAIRS: [Op, Op][] = [
  ["lt", "ge"],
  ["gt", "le"],
  ["eq", "ne"],
];

/** 수직선 자리 — 위 칸은 조건 p, 아래 칸은 학생이 만든 부정, 그 사이가 진단 띠 */
export const NL = { w: 620, h: 186, x0: 52, x1: 576, topY: 62, botY: 134, stripY: 78, stripH: 40 };

/** 진단 띠에서 조각 하나가 차지하는 x 구간 */
export function pieceSpan(t: IneqTask, m: number): [number, number] {
  const xn = nlX(t, t.num);
  if (m === 0) return [NL.x0, xn];
  if (m === 2) return [xn, NL.x1];
  return [xn - 8, xn + 8];
}
export function nlX(t: IneqTask, v: number): number {
  return NL.x0 + ((v - t.from) / (t.to - t.from)) * (NL.x1 - NL.x0);
}
export function ticksOf(t: IneqTask): number[] {
  return Array.from({ length: t.to - t.from + 1 }, (_, i) => t.from + i);
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 진리집합은 여집합
// ══════════════════════════════════════════════════════════════
export const U3 = upTo(10);

export type TruthTask = {
  id: string;
  name: string;
  condPre: string;
  condTex?: string;
  /** 조건 p 의 진리집합 P */
  answer: string[];
  /** ~p 의 문장 4지선다 */
  choices: Choice[];
  negAnswer: number;
  choiceWhy: string[];
  tip: string;
};

export const TRUTHS: TruthTask[] = [
  {
    id: "s1",
    name: "p",
    condPre: "x는 8의 약수이다",
    answer: ["1", "2", "4", "8"],
    choices: [
      { pre: "x는 8의 배수이다" },
      { pre: "x는 8의 약수가 아니다" },
      { pre: "x는 8이 아니다" },
      { pre: "x는 8보다 크다" },
    ],
    negAnswer: 1,
    choiceWhy: [
      "약수를 배수로 바꾼 조건이에요. 부정이 아니랍니다.",
      "",
      "8 하나만 빼낸 조건이에요. 1, 2, 4 도 함께 빠져야 하지요.",
      "크기에 대한 조건으로 바뀌었어요.",
    ],
    tip: "8을 나누어떨어지게 하는 수를 모두 찾아 보세요.",
  },
  {
    id: "s2",
    name: "q",
    condPre: "x는 3의 배수이다",
    answer: ["3", "6", "9"],
    choices: [
      { pre: "x는 3의 배수가 아니다" },
      { pre: "x는 3의 약수이다" },
      { pre: "x는 3이 아니다" },
      { pre: "x는 3의 배수도 짝수도 아니다" },
    ],
    negAnswer: 0,
    choiceWhy: [
      "",
      "배수를 약수로 바꾼 조건이에요.",
      "3 하나만 빼낸 조건이라 6, 9 가 남아 버려요.",
      "부정을 너무 많이 했어요. 짝수까지 건드릴 필요가 없어요.",
    ],
    tip: "10 이하의 3의 배수는 셋뿐이에요.",
  },
  {
    id: "s3",
    name: "r",
    condPre: "",
    condTex: "x \\ge 7",
    answer: ["7", "8", "9", "10"],
    choices: [
      { pre: "", tex: "x > 7" },
      { pre: "", tex: "x \\le 7" },
      { pre: "", tex: "x < 7" },
      { pre: "", tex: "x \\ne 7" },
    ],
    negAnswer: 2,
    choiceWhy: [
      "부등호만 뒤집으면 7이 어느 쪽에도 없거나 양쪽에 겹치게 돼요.",
      "7이 원래 조건에도 들어 있어 겹쳐 버려요.",
      "",
      "7만 빼낸 조건이라 8, 9, 10 이 그대로 남아요.",
    ],
    tip: "7 이상에는 7 자신이 들어 있어요. 부정에는 7이 빠지지요.",
  },
  {
    id: "s4",
    name: "s",
    condPre: "x는 10의 약수가 아니다",
    answer: ["3", "4", "6", "7", "8", "9"],
    choices: [
      { pre: "x는 10의 배수이다" },
      { pre: "x는 5의 약수이다" },
      { pre: "x는 10보다 작다" },
      { pre: "x는 10의 약수이다" },
    ],
    negAnswer: 3,
    choiceWhy: [
      "약수를 배수로 바꾼 조건이에요.",
      "5의 약수는 1, 5 뿐이라 2와 10이 빠져요.",
      "크기에 대한 조건으로 바뀌었어요.",
      "",
    ],
    tip: "10의 약수를 먼저 찾은 다음, 그것을 뺀 나머지를 담으면 돼요.",
  },
];

/** 벤 다이어그램 자리 — 칩은 클릭할 때마다 원 안팎의 자리로 옮겨 간다 */
export const V3 = {
  w: 480,
  h: 280,
  box: { x: 10, y: 12, w: 460, h: 256, r: 18 },
  circle: { cx: 170, cy: 145, r: 110 },
  chip: 16,
  inSlots: [
    { x: 132, y: 88 },
    { x: 170, y: 88 },
    { x: 208, y: 88 },
    { x: 132, y: 126 },
    { x: 170, y: 126 },
    { x: 208, y: 126 },
    { x: 132, y: 164 },
    { x: 170, y: 164 },
    { x: 208, y: 164 },
    { x: 170, y: 202 },
  ],
  outSlots: [
    { x: 330, y: 60 },
    { x: 372, y: 60 },
    { x: 414, y: 60 },
    { x: 330, y: 102 },
    { x: 372, y: 102 },
    { x: 414, y: 102 },
    { x: 330, y: 144 },
    { x: 372, y: 144 },
    { x: 414, y: 144 },
    { x: 330, y: 186 },
  ],
  uLabel: { x: 36, y: 38 },
  pLabel: { x: 170, y: 28 },
  cLabel: { x: 444, y: 34 },
};

// ══════════════════════════════════════════════════════════════
// 탭 ④ 또는·그리고 뒤집기 (드모르간)
// ══════════════════════════════════════════════════════════════
export type Conn = "and" | "or";
export const CONN_NAME: Record<Conn, string> = { and: "그리고", or: "또는" };

/** 벤 다이어그램의 네 조각 — 1비트: 왼쪽 원(p), 2비트: 오른쪽 원(q) */
export const REGIONS = [0, 1, 2, 3];
export const REGION_NAME: Record<number, string> = {
  0: "두 원 바깥",
  1: "왼쪽 원에만 있는 곳",
  2: "오른쪽 원에만 있는 곳",
  3: "두 원이 겹치는 곳",
};

export type Combo = { np: boolean; conn: Conn; nq: boolean };

export function regionsOf(c: Combo): number[] {
  return REGIONS.filter((m) => {
    const p = c.np ? (m & 1) === 0 : (m & 1) !== 0;
    const q = c.nq ? (m & 2) === 0 : (m & 2) !== 0;
    return c.conn === "and" ? p && q : p || q;
  });
}
export function sameRegions(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}
export function flipCombo(c: Combo): Combo {
  return { np: !c.np, conn: c.conn === "and" ? "or" : "and", nq: !c.nq };
}
export function overlapRegions(a: number[], b: number[]): number[] {
  return a.filter((m) => b.includes(m));
}
export function gapRegions(a: number[], b: number[]): number[] {
  return REGIONS.filter((m) => !a.includes(m) && !b.includes(m));
}

export type DeMorganTask = {
  id: string;
  p: { yes: string; no: string };
  q: { yes: string; no: string };
  /** 부정해야 할 원래 조건 */
  origin: Combo;
  tip: string;
};

export const DEMORGANS: DeMorganTask[] = [
  {
    id: "d1",
    p: { yes: "x는 짝수이다", no: "x는 짝수가 아니다" },
    q: { yes: "x는 3의 배수이다", no: "x는 3의 배수가 아니다" },
    origin: { np: false, conn: "or", nq: false },
    tip: "「짝수이거나 3의 배수이다」가 아니려면, 짝수도 아니고 3의 배수도 아니어야 해요.",
  },
  {
    id: "d2",
    p: { yes: "x는 5보다 크다", no: "x는 5보다 크지 않다" },
    q: { yes: "x는 8보다 작다", no: "x는 8보다 작지 않다" },
    origin: { np: false, conn: "and", nq: false },
    tip: "두 가지를 모두 만족해야 하는 조건은, 둘 중 하나만 어긋나도 거짓이 돼요.",
  },
  {
    id: "d3",
    p: { yes: "x는 소수이다", no: "x는 소수가 아니다" },
    q: { yes: "x는 10의 약수이다", no: "x는 10의 약수가 아니다" },
    origin: { np: true, conn: "or", nq: false },
    tip: "이미 부정이 붙은 조건은 부정을 한 번 더 하면 원래대로 돌아와요.",
  },
  {
    id: "d4",
    p: { yes: "x는 4의 배수이다", no: "x는 4의 배수가 아니다" },
    q: { yes: "x는 홀수이다", no: "x는 홀수가 아니다" },
    origin: { np: false, conn: "and", nq: true },
    tip: "「그리고」는 「또는」으로 바뀌고, 부정이 붙은 쪽은 부정이 떨어져 나가요.",
  },
];

/** 두 원이 겹치는 벤 다이어그램 자리 */
export const V4 = {
  w: 460,
  h: 260,
  box: { x: 8, y: 16, w: 444, h: 232, r: 18 },
  a: { cx: 172, cy: 142, r: 82, lx: 126, ly: 48 },
  b: { cx: 268, cy: 142, r: 82, lx: 314, ly: 48 },
  ul: { x: 30, y: 40 },
};
