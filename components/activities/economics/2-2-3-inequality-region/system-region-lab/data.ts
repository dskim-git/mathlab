// 연립부등식의 영역과 최대·최소 — 활동 데이터
//
//  · 연립부등식의 영역은 각 부등식의 영역이 모두 겹치는 부분(공통부분)이다.
//    부등식 하나하나를 y에 대하여 정리해 위·아래(또는 좌·우)를 정한 뒤 겹쳐 나간다.
//
//  · 영역은 반평면을 차례로 잘라 만든다(Sutherland–Hodgman).
//    자르고 남은 다각형의 꼭짓점이 곧 영역의 꼭짓점이다.
//
//  · 영역에서 일차식 f(x, y) = ax + by 의 최대·최소
//        f(x, y) = k 로 놓으면 기울기가 -a/b 로 일정한 평행한 직선들이 된다.
//        이 직선을 밀며 영역과 만나는 k 를 모으면 그 가운데 가장 큰 값이 최댓값,
//        가장 작은 값이 최솟값이다.
//        영역이 볼록한 다각형이면 그 값은 반드시 꼭짓점에서 나온다.
//        (직선의 기울기가 어느 변과 나란하면 그 변 위의 모든 점에서 같은 값이 나온다.)
//
//  · 탭 ④는 탭 ③에서 찾은 꼭짓점을 그대로 이어 쓴다.
//    꼭짓점에서만 f 의 값을 구해 표로 견주면 최댓값과 최솟값을 바로 고를 수 있다.
//    (재료가 정해진 실생활 계획 문제는 뒤의 선형계획법 활동에서 다룬다.)

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}

// ══════════════════════════════════════════════════════════════
//  부등식
// ══════════════════════════════════════════════════════════════
/** 0 : >   1 : ≥   2 : <   3 : ≤ */
export type Op = 0 | 1 | 2 | 3;
export const OP_TEX = [">", "\\ge", "<", "\\le"] as const;
/** 등호가 들어가면 경계도 영역에 들어간다 → 실선 */
export const OP_SOLID = [false, true, false, true] as const;

export type Ineq = { kind: "line"; a: number; b: number; op: Op } | { kind: "vline"; c: number; op: Op };
export type Pt = [number, number];

const EPS = 1e-9;

/** 부등식의 좌변 − 우변 (만족하는 쪽을 양수로) */
export function slack(q: Ineq, x: number, y: number): number {
  const raw = q.kind === "line" ? y - (q.a * x + q.b) : x - q.c;
  return q.op < 2 ? raw : -raw;
}
export function satisfies(q: Ineq, x: number, y: number): boolean {
  const v = slack(q, x, y);
  return OP_SOLID[q.op] ? v >= -EPS : v > EPS;
}
export function satisfiesAll(qs: Ineq[], x: number, y: number): boolean {
  return qs.every((q) => satisfies(q, x, y));
}
/** 위쪽(오른쪽)을 고르는 부등식인가 */
export function isUpper(q: Ineq): boolean {
  return q.op < 2;
}

function coefTex(a: number): string {
  if (a === 0) return "";
  const m = Math.abs(a);
  return `${a < 0 ? "-" : ""}${m === 1 ? "" : fmt(m)}x`;
}
export function rhsTex(a: number, b: number): string {
  const head = coefTex(a);
  if (head === "") return fmt(b);
  if (b === 0) return head;
  return `${head} ${b < 0 ? "-" : "+"} ${fmt(Math.abs(b))}`;
}
export function ineqTex(q: Ineq): string {
  return q.kind === "line" ? `y ${OP_TEX[q.op]} ${rhsTex(q.a, q.b)}` : `x ${OP_TEX[q.op]} ${fmt(q.c)}`;
}
export function edgeTex(q: Ineq): string {
  return q.kind === "line" ? `y = ${rhsTex(q.a, q.b)}` : `x = ${fmt(q.c)}`;
}

// ── 반평면으로 다각형 잘라 내기 ─────────────────────────────────
export function clipPoly(poly: Pt[], q: Ineq): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i];
    const B = poly[(i + 1) % poly.length];
    const va = slack(q, A[0], A[1]);
    const vb = slack(q, B[0], B[1]);
    if (va >= 0) out.push(A);
    if (va >= 0 !== vb >= 0) {
      const t = va / (va - vb);
      out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
    }
  }
  return out;
}
export type Box = { xMin: number; xMax: number; yMin: number; yMax: number };
export function boxPoly(b: Box): Pt[] {
  return [
    [b.xMin, b.yMin],
    [b.xMax, b.yMin],
    [b.xMax, b.yMax],
    [b.xMin, b.yMax],
  ];
}
/** 연립부등식의 영역을 이루는 다각형 (거의 같은 꼭짓점은 하나로 모은다) */
export function regionPoly(qs: Ineq[], b: Box): Pt[] {
  let poly = boxPoly(b);
  for (const q of qs) poly = clipPoly(poly, q);
  const out: Pt[] = [];
  for (const p of poly) {
    const r: Pt = [Number(p[0].toFixed(6)), Number(p[1].toFixed(6))];
    if (!out.some((z) => Math.abs(z[0] - r[0]) < 1e-6 && Math.abs(z[1] - r[1]) < 1e-6)) out.push(r);
  }
  return out;
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 하나씩 겹쳐 보기
// ══════════════════════════════════════════════════════════════
export const BOX6: Box = { xMin: -6, xMax: 6, yMin: -6, yMax: 6 };

export type SysItem = {
  id: string;
  /** 문제에 보이는 그대로 */
  rawTex: string;
  /** y에 대하여 정리한 꼴 (정리가 필요 없으면 생략) */
  solvedTex?: string;
  q: Ineq;
  tip: string;
};
export type Sys = { id: string; emoji: string; title: string; shape: string; items: SysItem[] };

export const SYSTEMS: Sys[] = [
  {
    id: "s1",
    emoji: "🔺",
    title: "연립부등식 ①",
    shape: "삼각형",
    items: [
      {
        id: "a1",
        rawTex: "x + y < 4",
        solvedTex: "y < -x + 4",
        q: { kind: "line", a: -1, b: 4, op: 2 },
        tip: "y만 남기면 y < -x + 4 예요. 등호가 없으니 경계는 빠집니다.",
      },
      {
        id: "a2",
        rawTex: "x - y \\le 2",
        solvedTex: "y \\ge x - 2",
        q: { kind: "line", a: 1, b: -2, op: 1 },
        tip: "-y ≤ -x + 2 에서 양변을 -1로 나누면 부등호가 뒤집혀 y ≥ x - 2 가 돼요.",
      },
      {
        id: "a3",
        rawTex: "x > -1",
        q: { kind: "vline", c: -1, op: 0 },
        tip: "세로선 x = -1 을 기준으로 좌우가 갈려요. y는 아무 값이나 됩니다.",
      },
    ],
  },
  {
    id: "s2",
    emoji: "⛰️",
    title: "연립부등식 ②",
    shape: "삼각형",
    items: [
      {
        id: "b1",
        rawTex: "y \\ge 0",
        q: { kind: "line", a: 0, b: 0, op: 1 },
        tip: "가로축 위쪽이에요. 경계인 가로축도 들어갑니다.",
      },
      {
        id: "b2",
        rawTex: "x - y + 3 \\ge 0",
        solvedTex: "y \\le x + 3",
        q: { kind: "line", a: 1, b: 3, op: 3 },
        tip: "-y ≥ -x - 3 에서 -1로 나누면 y ≤ x + 3 이 돼요.",
      },
      {
        id: "b3",
        rawTex: "2x + y - 6 \\le 0",
        solvedTex: "y \\le -2x + 6",
        q: { kind: "line", a: -2, b: 6, op: 3 },
        tip: "y ≤ -2x + 6 이므로 경계선의 아랫부분이에요.",
      },
    ],
  },
  {
    id: "s3",
    emoji: "📐",
    title: "연립부등식 ③",
    shape: "삼각형",
    items: [
      {
        id: "c1",
        rawTex: "x \\ge -2",
        q: { kind: "vline", c: -2, op: 1 },
        tip: "세로선 x = -2 의 오른쪽이에요. 경계도 들어갑니다.",
      },
      {
        id: "c2",
        rawTex: "y \\le 3",
        q: { kind: "line", a: 0, b: 3, op: 3 },
        tip: "가로선 y = 3 의 아랫부분이에요.",
      },
      {
        id: "c3",
        rawTex: "x - y - 1 < 0",
        solvedTex: "y > x - 1",
        q: { kind: "line", a: 1, b: -1, op: 0 },
        tip: "-y < -x + 1 에서 -1로 나누면 y > x - 1 이 돼요. 등호가 없으니 점선입니다.",
      },
    ],
  },
];

export const SIDE_LABELS = {
  line: ["위쪽", "아래쪽"],
  vline: ["오른쪽", "왼쪽"],
};
export const EDGE_LABELS = ["실선", "점선"];

// ══════════════════════════════════════════════════════════════
//  탭 ② 직선을 밀어라
// ══════════════════════════════════════════════════════════════
export const OPT_BOX: Box = { xMin: -1, xMax: 6, yMin: -1, yMax: 6 };
export const OPT_REGION: Ineq[] = [
  { kind: "vline", c: 0, op: 1 },
  { kind: "line", a: 0, b: 0, op: 1 },
  { kind: "line", a: -0.5, b: 4, op: 3 },
  { kind: "line", a: -2, b: 10, op: 3 },
];
export const OPT_RAW_TEX = ["x \\ge 0", "y \\ge 0", "x + 2y \\le 8", "2x + y \\le 10"];

/** f(x, y) = ax + by */
export type Obj = { id: string; tex: string; kTex: string; a: number; b: number };
export const OBJECTIVES: Obj[] = [
  { id: "o1", tex: "x + y", kTex: "x + y = k", a: 1, b: 1 },
  { id: "o2", tex: "3x + y", kTex: "3x + y = k", a: 3, b: 1 },
  { id: "o3", tex: "y - x", kTex: "y - x = k", a: -1, b: 1 },
  { id: "o4", tex: "x + 3y", kTex: "x + 3y = k", a: 1, b: 3 },
];
export function objAt(o: Obj, x: number, y: number): number {
  return o.a * x + o.b * y;
}
/** 영역의 꼭짓점에서 f 의 최댓값·최솟값과 그 자리 */
export function objRange(o: Obj, corners: Pt[]): { max: number; min: number; argMax: Pt[]; argMin: Pt[] } {
  const vals = corners.map((p) => objAt(o, p[0], p[1]));
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  return {
    max,
    min,
    argMax: corners.filter((_, i) => Math.abs(vals[i] - max) < 1e-9),
    argMin: corners.filter((_, i) => Math.abs(vals[i] - min) < 1e-9),
  };
}
/** f(x, y) = k 를 그리기 위한 두 끝점 */
export function kLine(o: Obj, k: number, b: Box): { x1: number; y1: number; x2: number; y2: number } {
  if (o.b === 0) return { x1: k / o.a, y1: b.yMin, x2: k / o.a, y2: b.yMax };
  return {
    x1: b.xMin,
    y1: (k - o.a * b.xMin) / o.b,
    x2: b.xMax,
    y2: (k - o.a * b.xMax) / o.b,
  };
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 꼭짓점 사냥
// ══════════════════════════════════════════════════════════════
export type Hunt = { id: string; emoji: string; title: string; texList: string[]; ineqs: Ineq[]; corners: Pt[] };

export const HUNTS: Hunt[] = [
  {
    id: "h1",
    emoji: "🔺",
    title: "사냥 1",
    texList: ["y \\ge 1", "y \\le -x + 5", "y \\le 2x + 5"],
    ineqs: [
      { kind: "line", a: 0, b: 1, op: 1 },
      { kind: "line", a: -1, b: 5, op: 3 },
      { kind: "line", a: 2, b: 5, op: 3 },
    ],
    corners: [
      [4, 1],
      [-2, 1],
      [0, 5],
    ],
  },
  {
    id: "h2",
    emoji: "🟦",
    title: "사냥 2",
    texList: ["x \\ge -3", "x \\le 2", "y \\ge -x", "y \\le 4"],
    ineqs: [
      { kind: "vline", c: -3, op: 1 },
      { kind: "vline", c: 2, op: 3 },
      { kind: "line", a: -1, b: 0, op: 1 },
      { kind: "line", a: 0, b: 4, op: 3 },
    ],
    corners: [
      [-3, 3],
      [-3, 4],
      [2, 4],
      [2, -2],
    ],
  },
  {
    id: "h3",
    emoji: "🔷",
    title: "사냥 3",
    texList: ["y \\ge -1", "y \\le 2", "y \\ge x - 3", "y \\le x + 2"],
    ineqs: [
      { kind: "line", a: 0, b: -1, op: 1 },
      { kind: "line", a: 0, b: 2, op: 3 },
      { kind: "line", a: 1, b: -3, op: 1 },
      { kind: "line", a: 1, b: 2, op: 3 },
    ],
    corners: [
      [2, -1],
      [5, 2],
      [0, 2],
      [-3, -1],
    ],
  },
  {
    id: "h4",
    emoji: "🔻",
    title: "사냥 4",
    texList: ["x \\ge 0", "y \\le -x + 4", "y \\ge x - 4"],
    ineqs: [
      { kind: "vline", c: 0, op: 1 },
      { kind: "line", a: -1, b: 4, op: 3 },
      { kind: "line", a: 1, b: -4, op: 1 },
    ],
    corners: [
      [0, 4],
      [0, -4],
      [4, 0],
    ],
  },
  {
    id: "h5",
    emoji: "🏔️",
    title: "사냥 5",
    texList: ["y \\ge 0", "y \\le 2", "y \\le 2x + 4", "y \\le -2x + 4"],
    ineqs: [
      { kind: "line", a: 0, b: 0, op: 1 },
      { kind: "line", a: 0, b: 2, op: 3 },
      { kind: "line", a: 2, b: 4, op: 3 },
      { kind: "line", a: -2, b: 4, op: 3 },
    ],
    corners: [
      [-2, 0],
      [2, 0],
      [1, 2],
      [-1, 2],
    ],
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 꼭짓점 표로 풀기
// ══════════════════════════════════════════════════════════════
export const CORNER_NAMES = ["A", "B", "C", "D"];

export type TableProb = {
  id: string;
  emoji: string;
  title: string;
  texList: string[];
  ineqs: Ineq[];
  /** A, B, C, D 차례 */
  corners: Pt[];
  obj: Obj;
};

export const TABLE_PROBS: TableProb[] = [
  {
    id: "t1",
    emoji: "🔺",
    title: "문제 1",
    texList: ["y \\ge 0", "y \\le x + 4", "y \\le -x + 4"],
    ineqs: [
      { kind: "line", a: 0, b: 0, op: 1 },
      { kind: "line", a: 1, b: 4, op: 3 },
      { kind: "line", a: -1, b: 4, op: 3 },
    ],
    corners: [
      [-4, 0],
      [4, 0],
      [0, 4],
    ],
    obj: { id: "t1o", tex: "2x + y", kTex: "2x + y = k", a: 2, b: 1 },
  },
  {
    id: "t2",
    emoji: "📐",
    title: "문제 2",
    texList: ["x \\ge -1", "y \\ge -1", "x + y \\le 4"],
    ineqs: [
      { kind: "vline", c: -1, op: 1 },
      { kind: "line", a: 0, b: -1, op: 1 },
      { kind: "line", a: -1, b: 4, op: 3 },
    ],
    corners: [
      [-1, -1],
      [5, -1],
      [-1, 5],
    ],
    obj: { id: "t2o", tex: "3x - y", kTex: "3x - y = k", a: 3, b: -1 },
  },
  {
    id: "t3",
    emoji: "🔷",
    title: "문제 3",
    texList: ["x \\ge 0", "y \\ge 1", "y \\le 4", "x + y \\le 6"],
    ineqs: [
      { kind: "vline", c: 0, op: 1 },
      { kind: "line", a: 0, b: 1, op: 1 },
      { kind: "line", a: 0, b: 4, op: 3 },
      { kind: "line", a: -1, b: 6, op: 3 },
    ],
    corners: [
      [0, 1],
      [5, 1],
      [2, 4],
      [0, 4],
    ],
    obj: { id: "t3o", tex: "x + 2y", kTex: "x + 2y = k", a: 1, b: 2 },
  },
];

/** 꼭짓점에서의 f 값 */
export function tableValues(p: TableProb): number[] {
  return p.corners.map((c) => objAt(p.obj, c[0], c[1]));
}
export function argMaxIdx(vals: number[]): number[] {
  const m = Math.max(...vals);
  return vals.map((v, i) => (Math.abs(v - m) < 1e-9 ? i : -1)).filter((i) => i >= 0);
}
export function argMinIdx(vals: number[]): number[] {
  const m = Math.min(...vals);
  return vals.map((v, i) => (Math.abs(v - m) < 1e-9 ? i : -1)).filter((i) => i >= 0);
}
