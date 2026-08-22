// 집합의 연산법칙 — 활동 데이터
//
//  ① 교환·결합법칙   두 식이 나타내는 영역을 각각 칠해 보고 같은지 확인한다.
//  ② 분배법칙       ∩ 과 ∪ 이 섞였을 때도 괄호를 풀어 쓸 수 있음을 그림으로 확인한다.
//  ③ 수와 견주기     수의 연산법칙과 집합의 연산법칙을 짝짓고, 수에서는 깨지지만
//                   집합에서는 성립하는 분배법칙을 반례로 확인한다.
//  ④ 법칙 탐정       주어진 등식이 참인지 거짓인지 가리고, 거짓이면 어긋나는 영역을 본다.
//
//  벤 다이어그램의 영역은 비트로 적는다 — 1비트 A · 2비트 B · 4비트 C
//    1 = A에만 · 2 = B에만 · 4 = C에만 · 3 = A와 B에만 · 5 = A와 C에만
//    6 = B와 C에만 · 7 = A, B, C 모두

export type Expr =
  | { k: "A" }
  | { k: "B" }
  | { k: "C" }
  | { k: "u"; l: Expr; r: Expr }
  | { k: "i"; l: Expr; r: Expr };

export const A: Expr = { k: "A" };
export const B: Expr = { k: "B" };
export const C: Expr = { k: "C" };
export const U = (l: Expr, r: Expr): Expr => ({ k: "u", l, r });
export const I = (l: Expr, r: Expr): Expr => ({ k: "i", l, r });

/** 그 영역이 식에 들어가는가 */
export function inRegion(e: Expr, m: number): boolean {
  if (e.k === "A") return (m & 1) !== 0;
  if (e.k === "B") return (m & 2) !== 0;
  if (e.k === "C") return (m & 4) !== 0;
  const l = inRegion(e.l, m);
  const r = inRegion(e.r, m);
  return e.k === "u" ? l || r : l && r;
}

/** 식이 나타내는 영역들 */
export function regionsOf(e: Expr, n: 2 | 3): number[] {
  const out: number[] = [];
  for (let m = 1; m <= (n === 2 ? 3 : 7); m++) if (inRegion(e, m)) out.push(m);
  return out;
}

export function sameRegions(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}

/** KaTeX 로 옮긴다 — 맨 바깥 괄호는 생략 */
export function exprTex(e: Expr, top = true): string {
  if (e.k === "A" || e.k === "B" || e.k === "C") return e.k;
  const op = e.k === "u" ? "\\cup" : "\\cap";
  const s = `${exprTex(e.l, false)} ${op} ${exprTex(e.r, false)}`;
  return top ? s : `(${s})`;
}

export const REGION_NAME: Record<number, string> = {
  1: "A에만 있는 부분",
  2: "B에만 있는 부분",
  4: "C에만 있는 부분",
  3: "A와 B에만 겹치는 부분",
  5: "A와 C에만 겹치는 부분",
  6: "B와 C에만 겹치는 부분",
  7: "A, B, C가 모두 겹치는 부분",
};

// ══════════════════════════════════════════════════════════════
// 벤 다이어그램 자리
// ══════════════════════════════════════════════════════════════
export type Circle = { key: "A" | "B" | "C"; cx: number; cy: number; r: number; lx: number; ly: number };

export const G2: { w: number; h: number; circles: Circle[]; anchor: Record<number, { x: number; y: number }> } = {
  w: 420,
  h: 250,
  circles: [
    { key: "A", cx: 160, cy: 125, r: 95, lx: 112, ly: 26 },
    { key: "B", cx: 260, cy: 125, r: 95, lx: 308, ly: 26 },
  ],
  anchor: { 1: { x: 112, y: 125 }, 3: { x: 210, y: 125 }, 2: { x: 308, y: 125 } },
};

export const G3: { w: number; h: number; circles: Circle[]; anchor: Record<number, { x: number; y: number }> } = {
  w: 420,
  h: 300,
  circles: [
    { key: "A", cx: 210, cy: 105, r: 82, lx: 210, ly: 16 },
    { key: "B", cx: 162, cy: 190, r: 82, lx: 76, ly: 252 },
    { key: "C", cx: 258, cy: 190, r: 82, lx: 344, ly: 252 },
  ],
  anchor: {
    1: { x: 210, y: 62 },
    2: { x: 118, y: 218 },
    4: { x: 302, y: 218 },
    3: { x: 162, y: 140 },
    5: { x: 258, y: 140 },
    6: { x: 210, y: 218 },
    7: { x: 210, y: 163 },
  },
};

export function geom(n: 2 | 3) {
  return n === 2 ? G2 : G3;
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 교환법칙 · 결합법칙
// ══════════════════════════════════════════════════════════════
export type LawProblem = {
  id: string;
  n: 2 | 3;
  left: Expr;
  right: Expr;
  law: string;
  /** 괄호를 없앤 짧은 꼴 (결합법칙일 때) */
  shortTex?: string;
  tip: string;
};

export const LAWS1: LawProblem[] = [
  {
    id: "c1",
    n: 2,
    left: U(A, B),
    right: U(B, A),
    law: "합집합의 교환법칙",
    tip: "「A 또는 B」나 「B 또는 A」나 가리키는 곳은 똑같아요. 순서를 바꿔도 됩니다.",
  },
  {
    id: "c2",
    n: 2,
    left: I(A, B),
    right: I(B, A),
    law: "교집합의 교환법칙",
    tip: "「A이면서 B」나 「B이면서 A」나 같은 말이에요. 교집합도 순서를 바꿔도 됩니다.",
  },
  {
    id: "c3",
    n: 3,
    left: U(U(A, B), C),
    right: U(A, U(B, C)),
    law: "합집합의 결합법칙",
    shortTex: "A \\cup B \\cup C",
    tip: "어느 둘을 먼저 합치든 셋을 모두 합친 것과 같아요. 그래서 괄호를 지우고 써도 됩니다.",
  },
  {
    id: "c4",
    n: 3,
    left: I(I(A, B), C),
    right: I(A, I(B, C)),
    law: "교집합의 결합법칙",
    shortTex: "A \\cap B \\cap C",
    tip: "어느 둘을 먼저 겹치든 결국 셋 모두에 들어 있는 부분만 남아요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 분배법칙
// ══════════════════════════════════════════════════════════════
export const LAWS2: LawProblem[] = [
  {
    id: "d1",
    n: 3,
    left: I(A, U(B, C)),
    right: U(I(A, B), I(A, C)),
    law: "분배법칙",
    tip: "A와 겹치는 부분을 B 쪽·C 쪽으로 나누어 구한 뒤 합쳐도 같아요.",
  },
  {
    id: "d2",
    n: 3,
    left: U(A, I(B, C)),
    right: I(U(A, B), U(A, C)),
    law: "분배법칙",
    tip: "수에서는 이런 모양이 성립하지 않는데, 집합에서는 성립해요! 탭③에서 견주어 봅시다.",
  },
  {
    id: "d3",
    n: 3,
    left: I(U(A, B), C),
    right: U(I(A, C), I(B, C)),
    law: "분배법칙",
    tip: "괄호가 앞에 있어도 마찬가지예요. C를 각각에 나누어 곱하듯 씁니다.",
  },
  {
    id: "d4",
    n: 3,
    left: U(I(A, B), C),
    right: I(U(A, C), U(B, C)),
    law: "분배법칙",
    tip: "C를 각각에 나누어 더하듯 쓰면 돼요. ∩ 과 ∪ 이 서로 자리를 바꾼다는 점을 눈여겨보세요.",
  },
];

/** 오른쪽 식을 두 조각으로 쪼갠다 (분배법칙 설명용) */
export function splitRight(e: Expr): { parts: Expr[]; op: "u" | "i" } | null {
  if (e.k !== "u" && e.k !== "i") return null;
  return { parts: [e.l, e.r], op: e.k };
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 수와 견주기
// ══════════════════════════════════════════════════════════════
export type MatchCard = { id: string; law: string; num: string; set: string };

export const MATCHES: MatchCard[] = [
  { id: "m1", law: "교환법칙", num: "a + b = b + a", set: "A \\cup B = B \\cup A" },
  { id: "m2", law: "교환법칙", num: "a \\times b = b \\times a", set: "A \\cap B = B \\cap A" },
  { id: "m3", law: "결합법칙", num: "(a + b) + c = a + (b + c)", set: "(A \\cup B) \\cup C = A \\cup (B \\cup C)" },
  { id: "m4", law: "결합법칙", num: "(a \\times b) \\times c = a \\times (b \\times c)", set: "(A \\cap B) \\cap C = A \\cap (B \\cap C)" },
  { id: "m5", law: "분배법칙", num: "a \\times (b + c) = a \\times b + a \\times c", set: "A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C)" },
];

/** 집합 카드를 섞어 놓는 차례 (무작위를 쓰지 않아 서버 렌더와 어긋나지 않는다) */
export const SET_ORDER = [2, 4, 0, 3, 1];

export const NUM_MAX = 6;
export function lhsNum(a: number, b: number, c: number): number {
  return a + b * c;
}
export function rhsNum(a: number, b: number, c: number): number {
  return (a + b) * (a + c);
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 법칙 탐정
// ══════════════════════════════════════════════════════════════
export type Judge = { id: string; left: Expr; right: Expr; tip: string };

export const JUDGES: Judge[] = [
  {
    id: "j1",
    left: U(A, I(A, B)),
    right: A,
    tip: "A와 B가 겹치는 부분은 어차피 A 안에 있어요. 그래서 다시 합쳐도 A 그대로예요.",
  },
  {
    id: "j2",
    left: I(A, U(A, B)),
    right: A,
    tip: "A는 통째로 A ∪ B 안에 들어 있으니, 그것과 겹치면 A가 그대로 남아요.",
  },
  {
    id: "j3",
    left: I(A, U(B, C)),
    right: U(I(A, B), C),
    tip: "오른쪽에는 A와 상관없는 C 부분까지 들어가 버려요. 괄호를 아무 데나 옮기면 안 됩니다.",
  },
  {
    id: "j4",
    left: I(U(A, B), C),
    right: U(A, I(B, C)),
    tip: "왼쪽은 반드시 C 안에 있어야 하지만, 오른쪽은 C 밖의 A 부분도 들어가요.",
  },
  {
    id: "j5",
    left: U(I(A, B), I(A, C)),
    right: I(A, U(B, C)),
    tip: "분배법칙을 좌우로 뒤집어 쓴 것이에요. 양쪽 모두 A와 겹치는 부분만 남습니다.",
  },
  {
    id: "j6",
    left: U(A, I(B, C)),
    right: I(U(A, B), C),
    tip: "왼쪽에는 C 밖의 A 부분이 들어가지만 오른쪽은 모두 C 안에 있어야 해요.",
  },
];

/** 두 식에서 어긋나는 영역 */
export function diffRegions(l: Expr, r: Expr): number[] {
  const out: number[] = [];
  for (let m = 1; m <= 7; m++) if (inRegion(l, m) !== inRegion(r, m)) out.push(m);
  return out;
}
