// 다각형과 부등식의 영역 — 활동 데이터
//
//  · 지금까지는 부등식 → 영역이었다면, 이번에는 거꾸로 영역(다각형) → 부등식이다.
//    볼록 다각형의 변 하나하나가 부등식 하나가 되고, 그것을 모두 모으면 연립부등식이 된다.
//
//  · 변 p1 → p2 를 반시계 방향으로 놓으면 다각형의 안쪽은 늘 그 변의 왼쪽에 있다.
//    (dx, dy) = p2 − p1 일 때 안쪽을 가리키는 법선은 (−dy, dx) 이므로
//        −dy·(x − x1) + dx·(y − y1) ≥ 0
//    곧  (−dy)x + (dx)y ≥ (−dy)x1 + (dx)y1  이 그 변이 만드는 부등식이다.
//    계수를 최대공약수로 나누고 x의 계수가 양수가 되도록 정리해 보여 준다.
//
//  · 일차식 f(x, y) = ax + by 의 최댓값·최솟값은 볼록 다각형의 꼭짓점에서 나온다.
//    a, b 를 바꾸면 f = k 직선의 기울기가 바뀌어 답이 나오는 꼭짓점이 옮겨 간다.
//
//  · 탭 ③④ 오각형 : x ≥ 0, y ≥ 0, x ≤ 4, y ≤ 3, x + y ≥ 1
//        꼭짓점 (0,1) (1,0) (4,0) (4,3) (0,3)
//        f = ax + by 의 꼭짓점 값은 차례로 b, a, 4a, 4a + 3b, 3b

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}

// ══════════════════════════════════════════════════════════════
//  부등식
// ══════════════════════════════════════════════════════════════
/** 0 : >   1 : ≥   2 : <   3 : ≤ */
export type Op = 0 | 1 | 2 | 3;
export const OP_SOLID = [false, true, false, true] as const;

export type Ineq = { kind: "line"; a: number; b: number; op: Op } | { kind: "vline"; c: number; op: Op };
export type Pt = [number, number];
export type Box = { xMin: number; xMax: number; yMin: number; yMax: number };

const EPS = 1e-9;

/** ax + by ≤ c (le = true) 또는 ax + by ≥ c 를 y에 대하여 정리한다 */
export function std(a: number, b: number, c: number, le: boolean): Ineq {
  if (b === 0) {
    const isLe = a < 0 ? !le : le;
    return { kind: "vline", c: c / a, op: isLe ? 3 : 1 };
  }
  const isLe = b > 0 ? le : !le;
  return { kind: "line", a: -a / b, b: c / b, op: isLe ? 3 : 1 };
}
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
export function regionPoly(qs: Ineq[], b: Box): Pt[] {
  let poly: Pt[] = [
    [b.xMin, b.yMin],
    [b.xMax, b.yMin],
    [b.xMax, b.yMax],
    [b.xMin, b.yMax],
  ];
  for (const q of qs) poly = clipPoly(poly, q);
  const out: Pt[] = [];
  for (const p of poly) {
    const r: Pt = [Number(p[0].toFixed(6)), Number(p[1].toFixed(6))];
    if (!out.some((z) => Math.abs(z[0] - r[0]) < 1e-6 && Math.abs(z[1] - r[1]) < 1e-6)) out.push(r);
  }
  return out;
}
export function polyArea(poly: Pt[]): number {
  let s = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  return Math.abs(s) / 2;
}

// ══════════════════════════════════════════════════════════════
//  ax + by ⊐ c 를 사람이 읽는 꼴로
// ══════════════════════════════════════════════════════════════
export type Std = { a: number; b: number; c: number; le: boolean };

function gcd2(m: number, n: number): number {
  let x = Math.abs(Math.round(m));
  let y = Math.abs(Math.round(n));
  while (y) [x, y] = [y, x % y];
  return x;
}
/** 계수를 약분하고 x의 계수가 양수가 되도록 정리한다 */
export function normStd(s: Std): Std {
  let g = gcd2(gcd2(s.a, s.b), s.c);
  if (!g) g = 1;
  let { a, b, c } = { a: s.a / g, b: s.b / g, c: s.c / g };
  let le = s.le;
  if (a < 0 || (a === 0 && b < 0)) {
    a = -a;
    b = -b;
    c = -c;
    le = !le;
  }
  return { a, b, c, le };
}
function termTex(coef: number, sym: string, first: boolean): string {
  if (coef === 0) return "";
  const mag = Math.abs(coef) === 1 ? "" : fmt(Math.abs(coef));
  if (first) return `${coef < 0 ? "-" : ""}${mag}${sym}`;
  return ` ${coef < 0 ? "-" : "+"} ${mag}${sym}`;
}
export function stdTex(s: Std): string {
  const n = normStd(s);
  const head = termTex(n.a, "x", true);
  const tail = termTex(n.b, "y", head === "");
  const lhs = `${head}${tail}` || "0";
  return `${lhs} ${n.le ? "\\le" : "\\ge"} ${fmt(n.c)}`;
}
export function stdToIneq(s: Std): Ineq {
  return std(s.a, s.b, s.c, s.le);
}
export function sameStd(p: Std, q: Std): boolean {
  const a = normStd(p);
  const b = normStd(q);
  return a.a === b.a && a.b === b.b && a.c === b.c && a.le === b.le;
}

// ══════════════════════════════════════════════════════════════
//  볼록껍질과 변의 부등식 — 탭 ②
// ══════════════════════════════════════════════════════════════
const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** 반시계 방향 볼록껍질 (한 줄로 늘어선 점들은 빈 배열) */
export function convexHull(pts: Pt[]): Pt[] {
  const ps = [...pts].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  if (ps.length < 3) return [];
  const lower: Pt[] = [];
  for (const p of ps) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  const hull = [...lower, ...upper];
  return hull.length >= 3 ? hull : [];
}
/** 반시계 방향 볼록 다각형의 각 변이 만드는 부등식 */
export function edgesOf(hull: Pt[]): Std[] {
  const out: Std[] = [];
  for (let i = 0; i < hull.length; i++) {
    const [x1, y1] = hull[i];
    const [x2, y2] = hull[(i + 1) % hull.length];
    const dx = x2 - x1;
    const dy = y2 - y1;
    out.push(normStd({ a: -dy, b: dx, c: -dy * x1 + dx * y1, le: false }));
  }
  return out;
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 다각형을 부등식으로
// ══════════════════════════════════════════════════════════════
export const BOX7: Box = { xMin: -1, xMax: 7, yMin: -1, yMax: 7 };

export type Shape = {
  id: string;
  emoji: string;
  title: string;
  name: string;
  corners: Pt[];
  /** 카드 목록 — pick 이 참인 것이 정답 */
  cards: { s: Std; pick: boolean }[];
  explain: string;
};

export const SHAPES: Shape[] = [
  {
    id: "sh1",
    emoji: "🔺",
    title: "도형 1",
    name: "삼각형",
    corners: [
      [1, 0],
      [5, 0],
      [1, 4],
    ],
    cards: [
      { s: { a: 1, b: 1, c: 5, le: true }, pick: true },
      { s: { a: 1, b: 0, c: 1, le: true }, pick: false },
      { s: { a: 0, b: 1, c: 0, le: false }, pick: true },
      { s: { a: 1, b: 1, c: 4, le: true }, pick: false },
      { s: { a: 1, b: 0, c: 1, le: false }, pick: true },
      { s: { a: 1, b: 1, c: 5, le: false }, pick: false },
      { s: { a: 0, b: 1, c: 0, le: true }, pick: false },
    ],
    explain:
      "세 변이 각각 부등식 하나씩을 만들어요. 세로선 x = 1 의 오른쪽, 가로축 y = 0 의 위쪽, 그리고 빗변 x + y = 5 의 아래쪽입니다.",
  },
  {
    id: "sh2",
    emoji: "🔷",
    title: "도형 2",
    name: "사다리꼴",
    corners: [
      [0, 0],
      [4, 0],
      [4, 2],
      [0, 4],
    ],
    cards: [
      { s: { a: 1, b: 0, c: 4, le: false }, pick: false },
      { s: { a: 0, b: 1, c: 0, le: false }, pick: true },
      { s: { a: 1, b: 2, c: 8, le: true }, pick: true },
      { s: { a: 1, b: 0, c: 0, le: false }, pick: true },
      { s: { a: 2, b: 1, c: 8, le: true }, pick: false },
      { s: { a: 1, b: 0, c: 4, le: true }, pick: true },
      { s: { a: 1, b: 2, c: 8, le: false }, pick: false },
      { s: { a: 0, b: 1, c: 4, le: false }, pick: false },
    ],
    explain:
      "네 변이니 부등식도 네 개예요. 기울어진 변 (0, 4) — (4, 2) 는 기울기가 -1/2 이라 x + 2y = 8 이 되고, 도형은 그 아래쪽에 있습니다.",
  },
  {
    id: "sh3",
    emoji: "⬟",
    title: "도형 3",
    name: "오각형",
    corners: [
      [0, 1],
      [1, 0],
      [4, 0],
      [4, 3],
      [0, 3],
    ],
    cards: [
      { s: { a: 0, b: 1, c: 3, le: true }, pick: true },
      { s: { a: 1, b: 1, c: 1, le: true }, pick: false },
      { s: { a: 1, b: 0, c: 0, le: false }, pick: true },
      { s: { a: 1, b: 1, c: 1, le: false }, pick: true },
      { s: { a: 1, b: -1, c: 1, le: false }, pick: false },
      { s: { a: 1, b: 0, c: 4, le: true }, pick: true },
      { s: { a: 1, b: 0, c: 1, le: false }, pick: false },
      { s: { a: 0, b: 1, c: 0, le: false }, pick: true },
    ],
    explain:
      "직사각형의 왼쪽 아래 모서리를 잘라 낸 모양이에요. 잘린 자리가 x + y = 1 이고, 도형은 그 위쪽에 있으니 x + y ≥ 1 이 더 붙습니다.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 내 도형 만들기
// ══════════════════════════════════════════════════════════════
export const DRAW_BOX: Box = { xMin: -1, xMax: 9, yMin: -1, yMax: 9 };
export const DRAW_MAX = 8;
export const DRAW_START: Pt[] = [
  [1, 1],
  [6, 1],
  [7, 4],
  [3, 6],
];

// ══════════════════════════════════════════════════════════════
//  탭 ③④ a, b 를 바꾸면
// ══════════════════════════════════════════════════════════════
export const COEF_BOX: Box = { xMin: -2, xMax: 8, yMin: -2, yMax: 8 };
export const PENTA: Pt[] = [
  [0, 1],
  [1, 0],
  [4, 0],
  [4, 3],
  [0, 3],
];
export const PENTA_STD: Std[] = [
  { a: 1, b: 0, c: 0, le: false },
  { a: 0, b: 1, c: 0, le: false },
  { a: 1, b: 0, c: 4, le: true },
  { a: 0, b: 1, c: 3, le: true },
  { a: 1, b: 1, c: 1, le: false },
];
export const PENTA_INEQS: Ineq[] = PENTA_STD.map(stdToIneq);
export const COEF_RANGE = { min: -4, max: 4, step: 1 };
export const COEF_START = { a: 3, b: -2 };
export const CORNER_NAMES = ["A", "B", "C", "D", "E"];

export function valuesAt(corners: Pt[], a: number, b: number): number[] {
  return corners.map((p) => a * p[0] + b * p[1]);
}
export function argBest(vals: number[], wantMax: boolean): number[] {
  const v = wantMax ? Math.max(...vals) : Math.min(...vals);
  return vals.map((z, i) => (Math.abs(z - v) < 1e-9 ? i : -1)).filter((i) => i >= 0);
}
/** f(x, y) = k 를 그리기 위한 두 끝점 (a = b = 0 이면 그리지 않는다) */
export function kLine(a: number, b: number, k: number, box: Box): { x1: number; y1: number; x2: number; y2: number } | null {
  if (a === 0 && b === 0) return null;
  if (b === 0) return { x1: k / a, y1: box.yMin, x2: k / a, y2: box.yMax };
  return { x1: box.xMin, y1: (k - a * box.xMin) / b, x2: box.xMax, y2: (k - a * box.xMax) / b };
}
export function objTex(a: number, b: number): string {
  const head = termTex(a, "x", true);
  const tail = termTex(b, "y", head === "");
  return `${head}${tail}` || "0";
}

// ── 탭 ③ 마무리 빈칸 ────────────────────────────────────────
export type Blank = { id: string; ask: string; options: string[]; answer: number; explain: string };
export const CONCLUSIONS: Blank[] = [
  {
    id: "cb1",
    ask: "일차식 ax + by 의 최댓값과 최솟값은 영역의 어디에서 나올까요?",
    options: ["영역 안쪽의 아무 점", "변의 한가운데", "꼭짓점", "원점에서 가장 먼 점"],
    answer: 2,
    explain:
      "f = k 직선을 밀 때 영역에서 떨어지기 직전에 걸리는 곳이 늘 꼭짓점이기 때문이에요. 그래서 꼭짓점의 값만 견주면 됩니다.",
  },
  {
    id: "cb2",
    ask: "a와 b를 바꾸면 무엇이 달라질까요?",
    options: [
      "영역의 모양이 달라진다",
      "f = k 직선의 기울기가 달라져 답이 나오는 꼭짓점이 옮겨 간다",
      "꼭짓점의 개수가 달라진다",
      "아무것도 달라지지 않는다",
    ],
    answer: 1,
    explain:
      "영역은 그대로예요. 바뀌는 것은 직선의 기울기 -a/b 이고, 그래서 마지막으로 걸리는 꼭짓점이 달라집니다.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 미션
// ══════════════════════════════════════════════════════════════
export type Mission = {
  id: string;
  emoji: string;
  title: string;
  goal: string;
  kind: "max" | "min" | "tieMax" | "flat";
  corner?: number;
  hint: string;
};

export const MISSIONS: Mission[] = [
  {
    id: "m1",
    emoji: "🎯",
    title: "미션 1",
    goal: "최댓값이 꼭짓점 D 에서만 나오게 하기",
    kind: "max",
    corner: 3,
    hint: "D (4, 3) 은 오른쪽 위 모서리예요. x가 커도 좋고 y가 커도 좋은 일차식이면 되겠죠?",
  },
  {
    id: "m2",
    emoji: "🎯",
    title: "미션 2",
    goal: "최댓값이 꼭짓점 E 에서만 나오게 하기",
    kind: "max",
    corner: 4,
    hint: "E (0, 3) 은 왼쪽 위예요. x는 작을수록 좋고 y는 클수록 좋아야 해요.",
  },
  {
    id: "m3",
    emoji: "🎯",
    title: "미션 3",
    goal: "최솟값이 꼭짓점 B 에서만 나오게 하기",
    kind: "min",
    corner: 1,
    hint: "B (1, 0) 은 왼쪽 아래에 가까워요. 이번에는 최솟값이니 값이 작아지는 방향을 생각해 보세요.",
  },
  {
    id: "m4",
    emoji: "🤝",
    title: "미션 4",
    goal: "최댓값이 두 꼭짓점에서 함께 나오게 하기",
    kind: "tieMax",
    hint: "f = k 직선이 어느 변과 나란해지면 그 변의 양 끝에서 값이 같아져요.",
  },
  {
    id: "m5",
    emoji: "😳",
    title: "미션 5",
    goal: "다섯 꼭짓점의 값이 모두 같게 하기",
    kind: "flat",
    hint: "어떤 점을 넣어도 값이 같아지려면 x와 y가 아예 영향을 주지 않아야겠죠?",
  },
];

export function missionDone(m: Mission, a: number, b: number): boolean {
  const vals = valuesAt(PENTA, a, b);
  if (m.kind === "flat") return vals.every((v) => Math.abs(v - vals[0]) < 1e-9);
  if (m.kind === "tieMax") return argBest(vals, true).length >= 2 && !vals.every((v) => Math.abs(v - vals[0]) < 1e-9);
  const idx = argBest(vals, m.kind === "max");
  return idx.length === 1 && idx[0] === m.corner;
}
