// 드모르간의 법칙 — 활동 데이터
//
//  ① 뒤집고 겹치기   A ∪ B 를 칠하고 통째로 뒤집은 것과, A^C 와 B^C 를 겹친 것을 견준다.
//  ② 원소로 확인     구체적인 집합에서 양변의 원소를 골라 같은 집합임을 확인한다.
//  ③ 개수 세는 길    n(A ∪ B) 를 나타내는 여러 식이 정말 같은지 조각으로 확인한다.
//  ④ 조건과 포함관계  조건이 뜻하는 「비어 있는 조각」을 찾아 포함관계를 알아낸다.
//
//  U 안의 조각은 비트로 적는다 — 1비트 A · 2비트 B
//    0 = 두 원 밖 · 1 = A에만(A - B) · 2 = B에만(B - A) · 3 = 겹치는 곳(A ∩ B)

export type Expr =
  | { k: "A" }
  | { k: "B" }
  | { k: "U" }
  | { k: "E" }
  | { k: "u"; l: Expr; r: Expr }
  | { k: "i"; l: Expr; r: Expr }
  | { k: "d"; l: Expr; r: Expr }
  | { k: "c"; e: Expr };

export const A: Expr = { k: "A" };
export const B: Expr = { k: "B" };
export const UNIV: Expr = { k: "U" };
export const EMPTY: Expr = { k: "E" };
export const U = (l: Expr, r: Expr): Expr => ({ k: "u", l, r });
export const I = (l: Expr, r: Expr): Expr => ({ k: "i", l, r });
export const D = (l: Expr, r: Expr): Expr => ({ k: "d", l, r });
export const C = (e: Expr): Expr => ({ k: "c", e });

export const ALL_REGIONS = [0, 1, 2, 3];

export function inRegion(e: Expr, m: number): boolean {
  switch (e.k) {
    case "A":
      return (m & 1) !== 0;
    case "B":
      return (m & 2) !== 0;
    case "U":
      return true;
    case "E":
      return false;
    case "c":
      return !inRegion(e.e, m);
    case "u":
      return inRegion(e.l, m) || inRegion(e.r, m);
    case "i":
      return inRegion(e.l, m) && inRegion(e.r, m);
    default:
      return inRegion(e.l, m) && !inRegion(e.r, m);
  }
}
export function regionsOf(e: Expr): number[] {
  return ALL_REGIONS.filter((m) => inRegion(e, m));
}
export function sameRegions(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}
export function flip(rs: number[]): number[] {
  return ALL_REGIONS.filter((m) => !rs.includes(m));
}

function atom(e: Expr): boolean {
  return e.k === "A" || e.k === "B" || e.k === "U" || e.k === "E";
}
function simple(e: Expr): boolean {
  return atom(e) || (e.k === "c" && atom(e.e));
}
export function exprTex(e: Expr): string {
  switch (e.k) {
    case "A":
      return "A";
    case "B":
      return "B";
    case "U":
      return "U";
    case "E":
      return "\\varnothing";
    case "c":
      return `${atom(e.e) ? exprTex(e.e) : `(${exprTex(e.e)})`}^{C}`;
    default: {
      const op = e.k === "u" ? "\\cup" : e.k === "i" ? "\\cap" : "-";
      const l = simple(e.l) ? exprTex(e.l) : `(${exprTex(e.l)})`;
      const r = simple(e.r) ? exprTex(e.r) : `(${exprTex(e.r)})`;
      return `${l} ${op} ${r}`;
    }
  }
}

export const REGION_NAME: Record<number, string> = {
  0: "두 원 바깥",
  1: "A에만 있는 부분",
  2: "B에만 있는 부분",
  3: "A와 B가 겹치는 부분",
};

// ══════════════════════════════════════════════════════════════
// 벤 다이어그램 자리 (U 사각형 + 두 원)
// ══════════════════════════════════════════════════════════════
export const G = {
  w: 460,
  h: 280,
  box: { x: 8, y: 24, w: 444, h: 248, r: 18 },
  a: { cx: 172, cy: 152, r: 82, lx: 142, ly: 54 },
  b: { cx: 268, cy: 152, r: 82, lx: 298, ly: 54 },
  ul: { x: 28, y: 44 },
  anchor: {
    0: { x: 398, y: 226 },
    1: { x: 124, y: 152 },
    3: { x: 220, y: 152 },
    2: { x: 316, y: 152 },
  } as Record<number, { x: number; y: number }>,
};

// ══════════════════════════════════════════════════════════════
// 탭 ① 뒤집고 겹치기
// ══════════════════════════════════════════════════════════════
export type MorganTask = {
  id: string;
  /** 괄호 안의 식 */
  inner: Expr;
  /** 왼쪽 결과 — 괄호 안을 뒤집은 것 */
  left: Expr;
  /** 오른쪽 두 조각 */
  p1: Expr;
  p2: Expr;
  /** 두 조각을 잇는 연산 */
  joinOp: "i" | "u";
  right: Expr;
  tip: string;
};

export const MORGANS: MorganTask[] = [
  {
    id: "m1",
    inner: U(A, B),
    left: C(U(A, B)),
    p1: C(A),
    p2: C(B),
    joinOp: "i",
    right: I(C(A), C(B)),
    tip: "합집합을 통째로 뒤집으면, 두 여집합이 함께 덮는 곳만 남아요. ∪ 가 ∩ 으로 바뀝니다.",
  },
  {
    id: "m2",
    inner: I(A, B),
    left: C(I(A, B)),
    p1: C(A),
    p2: C(B),
    joinOp: "u",
    right: U(C(A), C(B)),
    tip: "교집합을 뒤집으면 두 여집합 중 하나에라도 들어 있는 곳이 남아요. ∩ 이 ∪ 으로 바뀝니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 원소로 확인
// ══════════════════════════════════════════════════════════════
export type ElemTask = {
  id: string;
  law: 1 | 2;
  univLabel: string;
  univ: string[];
  aLabel: string;
  a: string[];
  bLabel: string;
  b: string[];
  tip: string;
};

export const ELEMS: ElemTask[] = [
  {
    id: "e1",
    law: 1,
    univLabel: "9 이하의 자연수",
    univ: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    aLabel: "6의 약수",
    a: ["1", "2", "3", "6"],
    bLabel: "9 이하의 소수",
    b: ["2", "3", "5", "7"],
    tip: "A ∪ B 를 먼저 구해 뒤집는 길과, A^C 와 B^C 를 구해 겹치는 길이 같은 곳에 닿아요.",
  },
  {
    id: "e2",
    law: 2,
    univLabel: "8 이하의 자연수",
    univ: ["1", "2", "3", "4", "5", "6", "7", "8"],
    aLabel: "8의 약수",
    a: ["1", "2", "4", "8"],
    bLabel: "8 이하의 짝수",
    b: ["2", "4", "6", "8"],
    tip: "교집합은 {2, 4, 8} 이라 작지만, 뒤집으면 나머지가 모두 들어와 넓어져요.",
  },
  {
    id: "e3",
    law: 1,
    univLabel: "10 이하의 자연수",
    univ: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    aLabel: "4 이상 10 이하의 자연수",
    a: ["4", "5", "6", "7", "8", "9", "10"],
    bLabel: "10의 약수",
    b: ["1", "2", "5", "10"],
    tip: "A ∪ B 가 U 를 거의 다 덮어서 남는 원소가 하나뿐이에요.",
  },
  {
    id: "e4",
    law: 2,
    univLabel: "6 이하의 자연수",
    univ: ["1", "2", "3", "4", "5", "6"],
    aLabel: "6의 약수",
    a: ["1", "2", "3", "6"],
    bLabel: "6 이하의 짝수",
    b: ["2", "4", "6"],
    tip: "겹치는 {2, 6} 만 빼면 나머지가 모두 답이 돼요.",
  },
];

export function unionOf(a: string[], b: string[]): string[] {
  return [...a, ...b.filter((x) => !a.includes(x))];
}
export function interOf(a: string[], b: string[]): string[] {
  return a.filter((x) => b.includes(x));
}
export function compOf(univ: string[], a: string[]): string[] {
  return univ.filter((x) => !a.includes(x));
}
/** 그 문제의 정답 (양변이 같으므로 하나) */
export function elemAnswer(t: ElemTask): string[] {
  return compOf(t.univ, t.law === 1 ? unionOf(t.a, t.b) : interOf(t.a, t.b));
}
export function listTex(xs: string[]): string {
  return xs.length ? `\\{${xs.join(",\\; ")}\\}` : "\\varnothing";
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 개수 세는 여러 길
// ══════════════════════════════════════════════════════════════
export const CNT_MAX = 9;

export type Term = { tex: string; regions: number[]; sign: 1 | -1 };
export type CountForm = { id: string; tex: string; terms: Term[]; ok: boolean; tip: string };

/** 조각 개수 — 1은 a개, 3은 b개, 2는 c개 */
export function countOf(regions: number[], a: number, b: number, c: number): number {
  return regions.reduce((s, m) => s + (m === 1 ? a : m === 3 ? b : m === 2 ? c : 0), 0);
}
export function valueOf(f: CountForm, a: number, b: number, c: number): number {
  return f.terms.reduce((s, t) => s + t.sign * countOf(t.regions, a, b, c), 0);
}

export const FORMS: CountForm[] = [
  {
    id: "f1",
    tex: "n(A \\cup B)",
    terms: [{ tex: "n(A \\cup B)", regions: [1, 3, 2], sign: 1 }],
    ok: true,
    tip: "세 조각을 통째로 세는 가장 기본이 되는 길이에요.",
  },
  {
    id: "f2",
    tex: "n(A - B) + n(A \\cap B) + n(B - A)",
    terms: [
      { tex: "n(A - B)", regions: [1], sign: 1 },
      { tex: "n(A \\cap B)", regions: [3], sign: 1 },
      { tex: "n(B - A)", regions: [2], sign: 1 },
    ],
    ok: true,
    tip: "세 조각을 하나씩 따로 세어 더한 길 — 겹치는 곳이 없어 안전해요.",
  },
  {
    id: "f3",
    tex: "n(A) + n(B - A)",
    terms: [
      { tex: "n(A)", regions: [1, 3], sign: 1 },
      { tex: "n(B - A)", regions: [2], sign: 1 },
    ],
    ok: true,
    tip: "A를 통째로 센 뒤, B에서 아직 세지 않은 부분만 더해요.",
  },
  {
    id: "f4",
    tex: "n(A - B) + n(B)",
    terms: [
      { tex: "n(A - B)", regions: [1], sign: 1 },
      { tex: "n(B)", regions: [3, 2], sign: 1 },
    ],
    ok: true,
    tip: "앞의 길을 좌우로 뒤집은 것 — B를 통째로 세고 A의 남은 부분을 더해요.",
  },
  {
    id: "f5",
    tex: "n(A) + n(B) - n(A \\cap B)",
    terms: [
      { tex: "n(A)", regions: [1, 3], sign: 1 },
      { tex: "n(B)", regions: [3, 2], sign: 1 },
      { tex: "n(A \\cap B)", regions: [3], sign: -1 },
    ],
    ok: true,
    tip: "둘을 그냥 더하면 겹치는 곳을 두 번 세니 한 번 빼 줘요.",
  },
  {
    id: "g1",
    tex: "n(A) + n(B)",
    terms: [
      { tex: "n(A)", regions: [1, 3], sign: 1 },
      { tex: "n(B)", regions: [3, 2], sign: 1 },
    ],
    ok: false,
    tip: "겹치는 조각을 두 번 세어 버려요. 겹치는 원소가 있으면 값이 커집니다.",
  },
  {
    id: "g2",
    tex: "n(A - B) + n(B - A)",
    terms: [
      { tex: "n(A - B)", regions: [1], sign: 1 },
      { tex: "n(B - A)", regions: [2], sign: 1 },
    ],
    ok: false,
    tip: "겹치는 조각을 아예 빠뜨렸어요. 이건 대칭차집합의 개수랍니다.",
  },
  {
    id: "g3",
    tex: "n(A \\cup B) - n(A \\cap B)",
    terms: [
      { tex: "n(A \\cup B)", regions: [1, 3, 2], sign: 1 },
      { tex: "n(A \\cap B)", regions: [3], sign: -1 },
    ],
    ok: false,
    tip: "빼지 않아도 될 겹치는 조각을 덜어 내서 값이 작아져요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 조건과 포함관계
// ══════════════════════════════════════════════════════════════
export type Infer = {
  id: string;
  left: Expr;
  right: Expr;
  /** 화면에 보여 줄 조건 (없으면 left = right 로 보여 준다) */
  condTex?: string;
  /** 반드시 비어 있어야 하는 조각 */
  empty: 1 | 2;
  tip: string;
};

export const INFERS: Infer[] = [
  { id: "q1", left: U(A, B), right: A, empty: 2, tip: "B를 더해도 A 그대로라면, B에만 있는 부분이 있을 수 없어요." },
  { id: "q2", left: I(A, B), right: A, empty: 1, tip: "A와 B가 겹치는 부분이 A 전체라면, A에만 있는 부분이 없다는 뜻이에요." },
  { id: "q3", left: D(A, B), right: EMPTY, empty: 1, tip: "A에서 B를 빼도 남는 게 없다는 것은 A에만 있는 부분이 없다는 뜻이에요." },
  { id: "q4", left: C(A), right: I(C(A), C(B)), condTex: "A^{C} \\subset B^{C}", empty: 2, tip: "A^C 가 B^C 안에 들어간다는 말이에요. B에만 있는 부분이 비어야 합니다." },
  { id: "q5", left: I(A, C(B)), right: EMPTY, empty: 1, tip: "A ∩ B^C 는 A - B 와 같은 조각이지요." },
  { id: "q6", left: U(A, C(B)), right: UNIV, empty: 2, tip: "빈 곳이 없으려면 A 밖이면서 B 안인 자리가 없어야 해요." },
];

/** 그 조각이 비면 어떤 포함관계가 되는가 */
export function subsetOf(empty: 1 | 2): "AsubB" | "BsubA" {
  return empty === 1 ? "AsubB" : "BsubA";
}
export const SUB_TEX: Record<string, string> = { AsubB: "A \\subset B", BsubA: "B \\subset A" };
