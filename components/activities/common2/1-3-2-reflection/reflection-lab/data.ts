// 대칭이동 — 활동 데이터
//
//  ① 두 가지 대칭
//     점대칭 : 점 O 에 대해 P → P′ ⇔ 세 점 P, O, P′ 이 일직선 위에 있고 OP = OP′
//              (곧 O 가 선분 PP′ 의 중점)  ⇒  P′ = 2O − P
//     선대칭 : 직선 l 에 대해 Q → Q′ ⇔ l 이 선분 QQ′ 의 수직이등분선
//              (① l ⊥ QQ′  ② MQ = MQ′)  ⇒  Q′ = 2H − Q  (H 는 Q 에서 l 에 내린 수선의 발)
//
//  ② 점의 대칭이동 :  (x, y) →  x축 (x, −y) /  y축 (−x, y) /  원점 (−x, −y)
//     x축 대칭과 y축 대칭을 이어서 하면 원점 대칭이 되고,
//     같은 대칭을 두 번 하면 제자리로 돌아온다 (클라인 사원군).
//
//  ③ 도형의 대칭이동 :  f(x, y) = 0 →  x축 f(x, −y) = 0 /  y축 f(−x, y) = 0 /
//     원점 f(−x, −y) = 0.  평행이동과 달리 점과 도형의 계산 방법이 똑같다.

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

// ─── 곡선 표본화 ──────────────────────────────────────────────
export function sampleParam(f: (t: number) => Pt, t0: number, t1: number, n: number, half: number): Pt[][] {
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    const p = f(t);
    const bad = !Number.isFinite(p.x) || !Number.isFinite(p.y) || Math.abs(p.x) > half + 3 || Math.abs(p.y) > half + 3;
    if (bad) {
      if (cur.length > 1) out.push(cur);
      cur = [];
    } else {
      cur.push(p);
    }
  }
  if (cur.length > 1) out.push(cur);
  return out;
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 점대칭 · 선대칭
// ══════════════════════════════════════════════════════════════
export function midPt(p: Pt, q: Pt): Pt {
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
}
/** 점 O 에 대한 점대칭 */
export function reflectAboutPoint(P: Pt, O: Pt): Pt {
  return { x: 2 * O.x - P.x, y: 2 * O.y - P.y };
}
/** 직선 l 위로 내린 수선의 발 */
export function footOn(L: Line, Q: Pt): Pt {
  const t = (L.a * Q.x + L.b * Q.y + L.c) / (L.a * L.a + L.b * L.b);
  return { x: Q.x - L.a * t, y: Q.y - L.b * t };
}
/** 직선 l 에 대한 선대칭 */
export function reflectAboutLine(Q: Pt, L: Line): Pt {
  const H = footOn(L, Q);
  return { x: 2 * H.x - Q.x, y: 2 * H.y - Q.y };
}
export function onLine(L: Line, p: Pt): boolean {
  return Math.abs(L.a * p.x + L.b * p.y + L.c) < 1e-9;
}
/** 두 선분이 수직인가 (한쪽이 점이면 false) */
export function isPerp(L: Line, P: Pt, Q: Pt): boolean {
  const dx = Q.x - P.x;
  const dy = Q.y - P.y;
  if (Math.abs(dx) < 1e-12 && Math.abs(dy) < 1e-12) return false;
  // l 의 방향벡터는 (−b, a)
  return Math.abs(-L.b * dx + L.a * dy) < 1e-9;
}
/** 세 점이 일직선 위에 있는가 */
export function isCollinear(P: Pt, O: Pt, Q: Pt): boolean {
  return Math.abs((O.x - P.x) * (Q.y - P.y) - (O.y - P.y) * (Q.x - P.x)) < 1e-9;
}
export function dist(p: Pt, q: Pt): number {
  return Math.hypot(p.x - q.x, p.y - q.y);
}

export type SymRound =
  | { id: string; kind: "point"; label: string; O: Pt; P0: Pt }
  | { id: string; kind: "line"; label: string; L: Line; lTex: string; P0: Pt };

export const SYM_ROUNDS: SymRound[] = [
  { id: "a1", kind: "point", label: "원점에 대한 점대칭", O: { x: 0, y: 0 }, P0: { x: 3, y: 2 } },
  { id: "a2", kind: "point", label: "점 (1, −1)에 대한 점대칭", O: { x: 1, y: -1 }, P0: { x: 4, y: 3 } },
  { id: "a3", kind: "line", label: "x축에 대한 선대칭", L: { a: 0, b: 1, c: 0 }, lTex: "y = 0", P0: { x: 2, y: 3 } },
  { id: "a4", kind: "line", label: "y축에 대한 선대칭", L: { a: 1, b: 0, c: 0 }, lTex: "x = 0", P0: { x: -2, y: 4 } },
  { id: "a5", kind: "line", label: "직선 y = x 에 대한 선대칭", L: { a: 1, b: -1, c: 0 }, lTex: "y = x", P0: { x: 3, y: 1 } },
  { id: "a6", kind: "line", label: "직선 y = x + 2 에 대한 선대칭", L: { a: 1, b: -1, c: 2 }, lTex: "y = x + 2", P0: { x: 3, y: 1 } },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 점의 대칭이동 — 버튼 게임
// ══════════════════════════════════════════════════════════════
export type Sym = "x" | "y" | "o";
export type SymState = "none" | Sym;

export const SYM_META: Record<Sym, { label: string; emoji: string; tex: string; color: string }> = {
  x: { label: "x축 대칭", emoji: "↕️", tex: "(x,\\; -y)", color: "#38bdf8" },
  y: { label: "y축 대칭", emoji: "↔️", tex: "(-x,\\; y)", color: "#f472b6" },
  o: { label: "원점 대칭", emoji: "🔄", tex: "(-x,\\; -y)", color: "#a78bfa" },
};
export const SYM_ORDER: Sym[] = ["x", "y", "o"];

export function applySym(p: Pt, s: Sym): Pt {
  if (s === "x") return { x: p.x, y: -p.y };
  if (s === "y") return { x: -p.x, y: p.y };
  return { x: -p.x, y: -p.y };
}

/** 대칭의 합성 (클라인 사원군) */
export const COMPOSE: Record<SymState, Record<Sym, SymState>> = {
  none: { x: "x", y: "y", o: "o" },
  x: { x: "none", y: "o", o: "y" },
  y: { x: "o", y: "none", o: "x" },
  o: { x: "y", y: "x", o: "none" },
};

export type GameQ = {
  id: string;
  P: Pt;
  T: Pt;
  /** 쓸 수 없는 버튼 */
  locked: Sym[];
  /** 최소 몇 번이면 되는가 */
  min: number;
  hint: string;
};

export const GAME_QS: GameQ[] = [
  { id: "g1", P: { x: 3, y: 2 }, T: { x: 3, y: -2 }, locked: [], min: 1, hint: "y좌표만 부호가 바뀌었어요." },
  { id: "g2", P: { x: 3, y: 2 }, T: { x: -3, y: -2 }, locked: ["o"], min: 2, hint: "원점 버튼 없이도 갈 수 있어요. 두 번 눌러 보세요!" },
  { id: "g3", P: { x: -4, y: 1 }, T: { x: 4, y: 1 }, locked: ["y"], min: 2, hint: "x축 대칭을 먼저 해 두면 길이 열려요." },
  { id: "g4", P: { x: 2, y: -3 }, T: { x: 2, y: 3 }, locked: ["x"], min: 2, hint: "y축으로 넘겼다가 원점으로 돌리면?" },
  { id: "g5", P: { x: 1, y: 4 }, T: { x: 1, y: 4 }, locked: [], min: 2, hint: "같은 버튼을 두 번 누르면 어떻게 될까요?" },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 도형의 대칭이동
// ══════════════════════════════════════════════════════════════
export type FigShape = {
  id: string;
  emoji: string;
  name: string;
  /** 상태별 방정식 */
  tex: Record<SymState, string>;
  /** 그 대칭에 대해 자기 자신인가 */
  self: Record<Sym, boolean>;
  base: (half: number) => Pt[][];
};

export const FIGS: FigShape[] = [
  {
    id: "circle",
    emoji: "⭕",
    name: "원",
    tex: { none: "x^2 + y^2 = 9", x: "x^2 + y^2 = 9", y: "x^2 + y^2 = 9", o: "x^2 + y^2 = 9" },
    self: { x: true, y: true, o: true },
    base: (h) => sampleParam((t) => ({ x: 3 * Math.cos(t), y: 3 * Math.sin(t) }), 0, 2 * Math.PI, 180, h),
  },
  {
    id: "parab",
    emoji: "🏹",
    name: "포물선",
    tex: { none: "y = x^2 - 2", y: "y = x^2 - 2", x: "y = -x^2 + 2", o: "y = -x^2 + 2" },
    self: { x: false, y: true, o: false },
    base: (h) => sampleParam((t) => ({ x: t, y: t * t - 2 }), -h - 2, h + 2, 200, h),
  },
  {
    id: "cubic",
    emoji: "🌊",
    name: "삼차곡선",
    tex: {
      none: "y = \\frac{x^3}{8} - x",
      o: "y = \\frac{x^3}{8} - x",
      x: "y = -\\frac{x^3}{8} + x",
      y: "y = -\\frac{x^3}{8} + x",
    },
    self: { x: false, y: false, o: true },
    base: (h) => sampleParam((t) => ({ x: t, y: (t * t * t) / 8 - t }), -h - 2, h + 2, 240, h),
  },
  {
    id: "sidep",
    emoji: "🌙",
    name: "누운 포물선",
    tex: { none: "y^2 = x + 3", x: "y^2 = x + 3", y: "y^2 = -x + 3", o: "y^2 = -x + 3" },
    self: { x: true, y: false, o: false },
    base: (h) => sampleParam((t) => ({ x: t * t - 3, y: t }), -h - 2, h + 2, 200, h),
  },
  {
    id: "line",
    emoji: "📏",
    name: "직선",
    tex: { none: "y = x + 1", x: "y = -x - 1", y: "y = -x + 1", o: "y = x - 1" },
    self: { x: false, y: false, o: false },
    base: (h) => sampleParam((t) => ({ x: t, y: t + 1 }), -h - 2, h + 2, 60, h),
  },
  {
    id: "hyper",
    emoji: "✖️",
    name: "쌍곡선",
    tex: { none: "xy = 4", o: "xy = 4", x: "xy = -4", y: "xy = -4" },
    self: { x: false, y: false, o: true },
    base: (h) => [
      ...sampleParam((t) => ({ x: t, y: 4 / t }), 0.35, h + 3, 200, h),
      ...sampleParam((t) => ({ x: t, y: 4 / t }), -h - 3, -0.35, 200, h),
    ],
  },
];

/** 상태 s 를 적용한 곡선 */
export function figCurves(fig: FigShape, s: SymState, half: number): Pt[][] {
  const base = fig.base(half);
  if (s === "none") return base;
  return base.map((poly) => poly.map((p) => applySym(p, s)));
}

// ─── 식 맞히기 퀴즈 ──────────────────────────────────────────
export type EqQ = {
  id: string;
  figTex: string;
  sym: Sym;
  choices: string[];
  ans: number;
  tip: string;
};

export const EQ_QS: EqQ[] = [
  {
    id: "e1",
    figTex: "(x - 2)^2 + (y - 1)^2 = 4",
    sym: "x",
    choices: ["(x - 2)^2 + (y + 1)^2 = 4", "(x + 2)^2 + (y - 1)^2 = 4", "(x + 2)^2 + (y + 1)^2 = 4", "(x - 2)^2 + (y - 1)^2 = -4"],
    ans: 0,
    tip: "y 자리에 −y 를 넣으면 (−y − 1)² = (y + 1)² 이에요.",
  },
  {
    id: "e2",
    figTex: "y = 2x - 3",
    sym: "y",
    choices: ["y = 2x + 3", "y = -2x - 3", "y = -2x + 3", "y = 2x - 3"],
    ans: 1,
    tip: "x 자리에만 −x 를 넣어요. 상수항은 그대로!",
  },
  {
    id: "e3",
    figTex: "(x - 2)^2 + (y - 1)^2 = 4",
    sym: "o",
    choices: ["(x - 2)^2 + (y + 1)^2 = 4", "(x + 2)^2 + (y - 1)^2 = 4", "(x + 2)^2 + (y + 1)^2 = 4", "(x - 2)^2 + (y - 1)^2 = 4"],
    ans: 2,
    tip: "중심 (2, 1) 이 원점 대칭으로 (−2, −1) 로 가요.",
  },
  {
    id: "e4",
    figTex: "y = (x - 1)^2 + 2",
    sym: "x",
    choices: ["y = -(x - 1)^2 - 2", "y = (x + 1)^2 + 2", "y = -(x + 1)^2 - 2", "y = (x - 1)^2 - 2"],
    ans: 0,
    tip: "−y = (x − 1)² + 2 를 y 에 대해 정리하면 양변에 −1 을 곱해요.",
  },
  {
    id: "e5",
    figTex: "3x - 2y + 6 = 0",
    sym: "o",
    choices: ["3x + 2y + 6 = 0", "3x - 2y - 6 = 0", "-3x - 2y + 6 = 0", "3x - 2y + 6 = 0"],
    ans: 1,
    tip: "−3x + 2y + 6 = 0 의 양변에 −1 을 곱해 보세요.",
  },
  {
    id: "e6",
    figTex: "x^2 + y^2 - 4x + 2y = 0",
    sym: "y",
    choices: ["x^2 + y^2 - 4x - 2y = 0", "x^2 + y^2 + 4x + 2y = 0", "x^2 + y^2 + 4x - 2y = 0", "x^2 + y^2 - 4x + 2y = 0"],
    ans: 1,
    tip: "x² 은 그대로지만 −4x 의 부호는 바뀌어요.",
  },
];
