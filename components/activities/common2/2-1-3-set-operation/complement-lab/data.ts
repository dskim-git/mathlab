// 여집합과 차집합 — 활동 데이터
//
//  ① 조각 칠하기     U 안의 네 조각을 칠해 여집합과 차집합을 만들어 본다.
//  ② 성질 탐구       두 식이 같은 조각을 나타내는지 각각 칠해 확인한다.
//  ③ 원소로 구하기   원소를 알맞은 조각에 넣고 A^C, A - B, B - A 를 읽어 낸다.
//  ④ 성질 탐정       주어진 등식이 참인지 거짓인지 가리고 어긋나는 조각을 본다.
//
//  전체집합 U 안의 조각은 비트로 적는다 — 1비트 A · 2비트 B
//    0 = 두 원 밖 (U 에만) · 1 = A에만 · 2 = B에만 · 3 = A와 B 모두

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

/** 그 조각이 식에 들어가는가 (m 은 0 ~ 3) */
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

export const ALL_REGIONS = [0, 1, 2, 3];

export function regionsOf(e: Expr): number[] {
  return ALL_REGIONS.filter((m) => inRegion(e, m));
}
export function sameRegions(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}
export function diffRegions(l: Expr, r: Expr): number[] {
  return ALL_REGIONS.filter((m) => inRegion(l, m) !== inRegion(r, m));
}

/** 괄호가 필요 없는 간단한 꼴인가 — A · B · U · ∅ · A^C 같은 것 */
function simple(e: Expr): boolean {
  if (e.k === "A" || e.k === "B" || e.k === "U" || e.k === "E") return true;
  return e.k === "c" && (e.e.k === "A" || e.e.k === "B" || e.e.k === "U" || e.e.k === "E");
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
    case "c": {
      const inner = e.e.k === "A" || e.e.k === "B" || e.e.k === "U" || e.e.k === "E" ? exprTex(e.e) : `(${exprTex(e.e)})`;
      return `${inner}^{C}`;
    }
    default: {
      const op = e.k === "u" ? "\\cup" : e.k === "i" ? "\\cap" : "-";
      const l = simple(e.l) ? exprTex(e.l) : `(${exprTex(e.l)})`;
      const r = simple(e.r) ? exprTex(e.r) : `(${exprTex(e.r)})`;
      return `${l} ${op} ${r}`;
    }
  }
}

export const REGION_NAME: Record<number, string> = {
  0: "두 원 바깥 — U에만 있는 부분",
  1: "A에만 있는 부분",
  2: "B에만 있는 부분",
  3: "A와 B가 겹치는 부분",
};

// ══════════════════════════════════════════════════════════════
// 벤 다이어그램 자리 (전체집합 U 사각형 + 두 원)
// ══════════════════════════════════════════════════════════════
export const G = {
  w: 480,
  h: 300,
  box: { x: 8, y: 26, w: 464, h: 266, r: 18 },
  a: { cx: 168, cy: 150, r: 86, lx: 135, ly: 55 },
  b: { cx: 272, cy: 150, r: 86, lx: 305, ly: 55 },
  ul: { x: 28, y: 46 },
  anchor: {
    0: { x: 414, y: 240, perRow: 2 },
    1: { x: 118, y: 150, perRow: 2 },
    3: { x: 220, y: 150, perRow: 1 },
    2: { x: 322, y: 150, perRow: 2 },
  } as Record<number, { x: number; y: number; perRow: number }>,
};

export function slots(an: { x: number; y: number; perRow: number }, n: number, dx = 40, dy = 34): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const rows = Math.ceil(n / an.perRow) || 1;
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / an.perRow);
    const cnt = Math.min(an.perRow, n - r * an.perRow);
    const c = i % an.perRow;
    out.push({ x: an.x + (c - (cnt - 1) / 2) * dx, y: an.y + (r - (rows - 1) / 2) * dy });
  }
  return out;
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 조각 칠하기
// ══════════════════════════════════════════════════════════════
export type PaintTask = { id: string; expr: Expr; tip: string; sameAs?: string };

export const PAINTS: PaintTask[] = [
  { id: "p1", expr: C(A), tip: "U 안에서 A를 뺀 나머지 — A 바깥의 모든 조각이에요." },
  { id: "p2", expr: D(A, B), tip: "A에는 속하고 B에는 속하지 않는 부분 — A에서 겹치는 자리를 뺀 조각이에요." },
  { id: "p3", expr: D(B, A), tip: "A - B 와는 다른 조각이지요? 차집합은 순서를 바꾸면 달라져요." },
  { id: "p4", expr: C(U(A, B)), tip: "두 원 바깥, U 에만 남는 조각 하나예요." },
  { id: "p5", expr: I(C(A), B), sameAs: "B - A", tip: "A 바깥이면서 B 안 — 앞에서 칠한 B - A 와 똑같아요!" },
  { id: "p6", expr: D(A, I(A, B)), sameAs: "A - B", tip: "A에서 겹치는 부분을 빼도 결국 A - B 와 같아요." },
];

/** 전체집합이 달라지면 여집합도 달라진다 */
export const UNIVERSE_DEMO = {
  A: ["2", "4"],
  options: [
    { id: "u1", label: "5 이하의 자연수", items: ["1", "2", "3", "4", "5"] },
    { id: "u2", label: "10 이하의 짝수", items: ["2", "4", "6", "8", "10"] },
    { id: "u3", label: "8의 약수", items: ["1", "2", "4", "8"] },
  ],
};

export function complementOf(univ: string[], a: string[]): string[] {
  return univ.filter((x) => !a.includes(x));
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 성질 탐구
// ══════════════════════════════════════════════════════════════
export type LawTask = { id: string; left: Expr; right: Expr; law: string; tip: string };

export const LAWS: LawTask[] = [
  {
    id: "l1",
    left: D(A, B),
    right: I(A, C(B)),
    law: "차집합을 여집합으로",
    tip: "「A에 속하고 B에 속하지 않는다」는 「A에 속하고 B의 여집합에 속한다」와 같은 말이에요.",
  },
  {
    id: "l2",
    left: C(C(A)),
    right: A,
    law: "여집합의 여집합",
    tip: "바깥의 바깥은 다시 안쪽 — 두 번 뒤집으면 제자리로 돌아와요.",
  },
  {
    id: "l3",
    left: U(A, C(A)),
    right: UNIV,
    law: "A 와 여집합을 합치면",
    tip: "A와 A의 여집합을 합치면 U의 모든 조각이 채워져요.",
  },
  {
    id: "l4",
    left: I(A, C(A)),
    right: EMPTY,
    law: "A 와 여집합의 교집합",
    tip: "A 안이면서 동시에 A 바깥인 곳은 없어요 — 칠할 조각이 하나도 없습니다.",
  },
  {
    id: "l5",
    left: D(A, B),
    right: D(A, I(A, B)),
    law: "겹치는 만큼만 빠진다",
    tip: "B에서 A와 상관없는 부분은 어차피 A 안에 없으니, 빼도 달라지는 게 없어요.",
  },
  {
    id: "l6",
    left: U(D(A, B), D(B, A)),
    right: D(U(A, B), I(A, B)),
    law: "대칭차집합",
    tip: "두 원을 합친 뒤 겹치는 부분만 도려낸 모양 — 「둘 중 하나에만 속하는」 조각이에요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 원소로 구하기
// ══════════════════════════════════════════════════════════════
export type ElemTask = {
  id: string;
  univLabel: string;
  univ: string[];
  aLabel: string;
  a: string[];
  bLabel: string;
  b: string[];
};

export const ELEMS: ElemTask[] = [
  {
    id: "e1",
    univLabel: "8 이하의 자연수",
    univ: ["1", "2", "3", "4", "5", "6", "7", "8"],
    aLabel: "8 이하의 짝수",
    a: ["2", "4", "6", "8"],
    bLabel: "6의 약수",
    b: ["1", "2", "3", "6"],
  },
  {
    id: "e2",
    univLabel: "10 이하의 자연수",
    univ: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    aLabel: "10 이하의 소수",
    a: ["2", "3", "5", "7"],
    bLabel: "10보다 작은 3의 배수",
    b: ["3", "6", "9"],
  },
];

export function regionOfItem(t: ElemTask, x: string): number {
  return (t.a.includes(x) ? 1 : 0) | (t.b.includes(x) ? 2 : 0);
}
/** 배치가 끝난 뒤 읽어 낼 세 가지 */
export const READS: { key: "comp" | "ab" | "ba"; tex: string; regions: number[] }[] = [
  { key: "comp", tex: "A^{C}", regions: [0, 2] },
  { key: "ab", tex: "A - B", regions: [1] },
  { key: "ba", tex: "B - A", regions: [2] },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 성질 탐정
// ══════════════════════════════════════════════════════════════
export type Judge = { id: string; left: Expr; right: Expr; tip: string };

export const JUDGES: Judge[] = [
  {
    id: "j1",
    left: D(A, B),
    right: D(B, A),
    tip: "A - B 는 A 쪽에, B - A 는 B 쪽에 남아요. 차집합은 순서를 바꾸면 완전히 다른 조각이 됩니다.",
  },
  {
    id: "j2",
    left: C(A),
    right: D(UNIV, A),
    tip: "여집합은 전체집합에서 A를 뺀 것 — 두 표현은 같은 뜻이에요.",
  },
  {
    id: "j3",
    left: D(A, B),
    right: I(C(A), B),
    tip: "A - B 는 A 안에 있어야 하는데, 오른쪽은 A 바깥이라 정반대예요. 올바른 꼴은 A ∩ B^C 랍니다.",
  },
  {
    id: "j4",
    left: U(D(A, B), I(A, B)),
    right: A,
    tip: "A는 「B와 겹치지 않는 부분」과 「겹치는 부분」으로 딱 나뉘어요.",
  },
  {
    id: "j5",
    left: U(A, D(B, A)),
    right: U(A, B),
    tip: "B에서 A와 겹치는 부분을 빼고 합쳐도, 그 부분은 이미 A에 있으니 결과는 같아요.",
  },
  {
    id: "j6",
    left: C(U(A, B)),
    right: U(C(A), C(B)),
    tip: "합집합의 여집합은 두 여집합을 「합친 것」이 아니라 「겹친 것」이에요. 오른쪽은 너무 넓어집니다.",
  },
];
