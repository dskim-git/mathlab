// 점대칭·선대칭의 일반화 — 활동 데이터
//
//  ① 점 (a, b) 에 대한 점대칭
//     선분 PP′ 의 중점이 (a, b) 이므로
//        (x + x′)/2 = a,  (y + y′)/2 = b   ⇒   P′(2a − x, 2b − y)
//     도형 :  f(x, y) = 0  →  f(2a − x, 2b − y) = 0
//
//  ② 직선 l : ax + by + c = 0 에 대한 선대칭
//     ㉠ 선분 PP′ 의 중점이 l 위에 있고  ㉡ PP′ 이 l 과 수직이다.
//     교과서는 이 두 조건을 연립해 일반식을 얻지만, 식이 매우 복잡하므로
//     이 활동에서는 외우지 않고 다음 두 걸음으로 구한다.
//        1) P 에서 l 에 내린 수선의 발 H 를 구한다
//        2) H 가 PP′ 의 중점이므로  P′ = 2H − P
//     (수선의 발은 H = P − t(a, b),  t = (a·Px + b·Py + c)/(a² + b²) 로 얻는다.)
//
//  ③ 점대칭인지 선대칭인지는 대응점을 이어 보면 알 수 있다.
//     점대칭 : 세 선분이 한 점(대칭의 중심)에서 만난다 — 도형의 방향이 그대로
//     선대칭 : 세 선분이 서로 평행하다(모두 거울과 수직) — 도형의 방향이 뒤집힌다

export type Pt = { x: number; y: number };
/** ax + by + c = 0 */
export type Line = { a: number; b: number; c: number };

// ─── 조판 ─────────────────────────────────────────────────────
export function ptTex(p: Pt): string {
  return `(${p.x}, ${p.y})`;
}
export function nz(v: number): string {
  const r = Math.round(v * 100) / 100;
  return r < 0 ? `−${Math.abs(r)}` : String(r);
}
export function fmt(v: number, k = 2): string {
  const s = v.toFixed(k);
  return s.startsWith("-") ? `−${s.slice(1)}` : s;
}
/** ax + by + c = 0 */
export function lineTex(L: Line): string {
  const head = (v: number, name: string) => {
    const abs = Math.abs(v);
    const body = abs === 1 ? name : `${abs}${name}`;
    return v < 0 ? `-${body}` : body;
  };
  const tail = (v: number, name: string) => {
    if (v === 0) return "";
    const abs = Math.abs(v);
    const body = name === "" ? `${abs}` : abs === 1 ? name : `${abs}${name}`;
    return (v < 0 ? " - " : " + ") + body;
  };
  let s = "";
  if (L.a !== 0) s += head(L.a, "x");
  if (L.b !== 0) s += s === "" ? head(L.b, "y") : tail(L.b, "y");
  if (L.c !== 0 || s === "") s += s === "" ? String(L.c) : tail(L.c, "");
  return `${s} = 0`;
}
/** (x−p)² + (y−q)² = r² */
export function circleTex(p: number, q: number, r2: number): string {
  const t = (v: number, name: string) => (v === 0 ? `${name}^2` : `(${name} ${v > 0 ? "-" : "+"} ${Math.abs(v)})^2`);
  return `${t(p, "x")} + ${t(q, "y")} = ${r2}`;
}

// ─── 기하 ─────────────────────────────────────────────────────
export function midPt(p: Pt, q: Pt): Pt {
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
}
/** 점 (a, b) 에 대한 점대칭 */
export function pointSym(P: Pt, O: Pt): Pt {
  return { x: 2 * O.x - P.x, y: 2 * O.y - P.y };
}
/** P 에서 직선 l 에 내린 수선의 발 */
export function footOn(L: Line, P: Pt): Pt {
  const t = (L.a * P.x + L.b * P.y + L.c) / (L.a * L.a + L.b * L.b);
  return { x: P.x - L.a * t, y: P.y - L.b * t };
}
/** 직선 l 에 대한 선대칭 */
export function lineSym(P: Pt, L: Line): Pt {
  const H = footOn(L, P);
  return { x: 2 * H.x - P.x, y: 2 * H.y - P.y };
}
export function onLine(L: Line, p: Pt, eps = 1e-9): boolean {
  return Math.abs(L.a * p.x + L.b * p.y + L.c) < eps;
}
/** 세 점의 방향 (양수면 반시계) */
export function orient(t: Pt[]): number {
  return (t[1].x - t[0].x) * (t[2].y - t[0].y) - (t[1].y - t[0].y) * (t[2].x - t[0].x);
}
export function samePts(a: Pt[], b: Pt[]): boolean {
  return a.length === b.length && a.every((p, i) => p.x === b[i].x && p.y === b[i].y);
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 점대칭의 일반화
// ══════════════════════════════════════════════════════════════
/** 실험실에서 함께 옮기는 원 */
export const LAB_CIRCLE = { p: 1, q: -1, r2: 4 };

export type PtQ = { id: string; P: Pt; O: Pt; ans: Pt };
function mkPtQ(id: string, P: Pt, O: Pt): PtQ {
  return { id, P, O, ans: pointSym(P, O) };
}
export const PT_QS: PtQ[] = [
  mkPtQ("p1", { x: 3, y: 1 }, { x: 2, y: -1 }),
  mkPtQ("p2", { x: -2, y: 4 }, { x: 0, y: 3 }),
  mkPtQ("p3", { x: 5, y: -2 }, { x: 1, y: 1 }),
];

export type FigQ = { id: string; tex: string; O: Pt; choices: string[]; ans: number; tip: string };
export const FIG_QS: FigQ[] = [
  {
    id: "f1",
    tex: "(x - 1)^2 + (y - 2)^2 = 9",
    O: { x: 3, y: 0 },
    choices: ["(x - 5)^2 + (y + 2)^2 = 9", "(x + 5)^2 + (y - 2)^2 = 9", "(x - 5)^2 + (y - 2)^2 = 9", "(x - 1)^2 + (y + 2)^2 = 9"],
    ans: 0,
    tip: "중심 (1, 2) 만 옮기면 돼요. (2·3 − 1, 2·0 − 2) = (5, −2)",
  },
  {
    id: "f2",
    tex: "y = 2x + 1",
    O: { x: 1, y: 1 },
    choices: ["y = 2x - 3", "y = -2x + 3", "y = 2x + 3", "y = -2x - 1"],
    ans: 0,
    tip: "x 자리에 2 − x, y 자리에 2 − y 를 넣고 정리하면 2 − y = 2(2 − x) + 1 이에요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 선대칭의 일반화
// ══════════════════════════════════════════════════════════════
export type LineQ = {
  id: string;
  L: Line;
  P: Pt;
  /** 수선의 발 (문제는 모두 정수가 되도록 골랐다) */
  H: Pt;
  /** 대칭점 */
  ans: Pt;
  tip: string;
};
function mkLineQ(id: string, L: Line, P: Pt, tip: string): LineQ {
  const H = footOn(L, P);
  return { id, L, P, H: { x: Math.round(H.x), y: Math.round(H.y) }, ans: lineSym(P, L), tip };
}
export const LINE_QS: LineQ[] = [
  mkLineQ("l1", { a: 0, b: 1, c: 1 }, { x: 3, y: 4 }, "가로선이라 x좌표는 그대로! y좌표만 거울 아래로 같은 만큼."),
  mkLineQ("l2", { a: 1, b: 0, c: -2 }, { x: 5, y: 3 }, "세로선이라 y좌표는 그대로예요."),
  mkLineQ("l3", { a: 1, b: 1, c: -4 }, { x: 1, y: 1 }, "P 에서 직선에 수직으로 다가가면 어디에 닿을까요?"),
  mkLineQ("l4", { a: 1, b: -1, c: 2 }, { x: 3, y: 1 }, "l 의 기울기가 1 이니 PP′ 의 기울기는 −1 이에요."),
  mkLineQ("l5", { a: 2, b: 1, c: -5 }, { x: 0, y: 0 }, "원점에서 직선까지 수직으로 가 보세요."),
  mkLineQ("l6", { a: 1, b: -2, c: 0 }, { x: 1, y: 3 }, "H 를 찾았다면 P′ = 2H − P 로 한 번에!"),
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 탐정 게임 — 대칭의 정체를 밝혀라
// ══════════════════════════════════════════════════════════════
/** 대칭축이 없는 삼각형 */
export const BASE_TRI: Pt[] = [
  { x: 0, y: 1 },
  { x: 3, y: 0 },
  { x: 2, y: 3 },
];

export type Case =
  | { id: string; kind: "point"; O: Pt; hint: string }
  | { id: string; kind: "line"; L: Line; lTex: string; hint: string };

export const CASES: Case[] = [
  { id: "c1", kind: "point", O: { x: 2, y: 1 }, hint: "세 선분이 한 점에서 만나요. 그 점이 바로 대칭의 중심!", },
  { id: "c2", kind: "line", L: { a: 1, b: 0, c: -1 }, lTex: "x = 1", hint: "세 선분이 모두 가로 방향으로 나란해요. 거울은 세로선!" },
  { id: "c3", kind: "point", O: { x: 0, y: -2 }, hint: "대응하는 두 점의 중점을 세 번 구해 보세요 — 모두 같은 점이에요." },
  { id: "c4", kind: "line", L: { a: 1, b: -1, c: -1 }, lTex: "y = x - 1", hint: "세 선분이 모두 기울기 −1 로 나란해요." },
  { id: "c5", kind: "line", L: { a: 1, b: 1, c: -3 }, lTex: "y = -x + 3", hint: "거울은 대응점을 잇는 선분의 수직이등분선이에요." },
  { id: "c6", kind: "point", O: { x: -1, y: 2 }, hint: "도형의 방향(돌아가는 차례)이 그대로면 점대칭이에요." },
];

export function caseImage(c: Case): Pt[] {
  return c.kind === "point" ? BASE_TRI.map((p) => pointSym(p, c.O)) : BASE_TRI.map((p) => lineSym(p, c.L));
}

/** 두 점으로 정해지는 직선 */
export function lineThrough(A: Pt, B: Pt): Line | null {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  if (dx === 0 && dy === 0) return null;
  return { a: dy, b: -dx, c: -(dy * A.x - dx * A.y) };
}

/** 학생이 놓은 직선이 정말 거울인가 — 모든 대응쌍의 수직이등분선인지 확인 */
export function isMirrorOf(L: Line, from: Pt[], to: Pt[]): boolean {
  const len = Math.hypot(L.a, L.b);
  if (len === 0) return false;
  for (let i = 0; i < from.length; i++) {
    const M = midPt(from[i], to[i]);
    if (Math.abs(L.a * M.x + L.b * M.y + L.c) > 1e-9) return false;
    const dx = to[i].x - from[i].x;
    const dy = to[i].y - from[i].y;
    if (Math.abs(dx) < 1e-12 && Math.abs(dy) < 1e-12) continue;
    // l 의 방향벡터 (−b, a) 와 PP′ 이 수직
    if (Math.abs(-L.b * dx + L.a * dy) > 1e-9) return false;
  }
  return true;
}

/** 학생이 놓은 점이 정말 대칭의 중심인가 */
export function isCenterOf(O: Pt, from: Pt[], to: Pt[]): boolean {
  return from.every((p, i) => {
    const M = midPt(p, to[i]);
    return Math.abs(M.x - O.x) < 1e-9 && Math.abs(M.y - O.y) < 1e-9;
  });
}

// ─── 마무리 요약 ─────────────────────────────────────────────
export const SUMMARY: { title: string; how: string; pt: string; fig: string; tone: string }[] = [
  {
    title: "점 (a, b) 대칭",
    how: "PP′ 의 중점이 (a, b)",
    pt: "(2a - x,\\; 2b - y)",
    fig: "f(2a - x,\\; 2b - y) = 0",
    tone: "violet",
  },
  {
    title: "직선 l 대칭",
    how: "수선의 발 H 를 찾고 P′ = 2H − P",
    pt: "2H - P",
    fig: "\\text{P} \\to \\text{P}' \\text{ 를 대입해 정리}",
    tone: "emerald",
  },
];
