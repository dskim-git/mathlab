// 평행이동 — 활동 데이터
//
//  ① 좌표평면 위의 도형은 모두 f(x, y) = 0 꼴로 쓸 수 있다.
//     y = f(x) 꼴은 좌변으로 모두 넘기기만 하면 되므로 언제나 가능하지만,
//     거꾸로 f(x, y) = 0 이 반드시 y = f(x) 꼴이 되지는 않는다.
//     판정은 세로선 검사 — 세로선 x = t 와 두 번 이상 만나는 도형은
//     한 x 에 y 가 여럿이라 y = f(x) 꼴로 쓸 수 없다.
//
//  ② 점의 평행이동 :  P(x, y)  →  P'(x + a, y + b)
//     거꾸로 P' 에서 P 를 찾을 때는 (x' − a, y' − b) 로 되돌린다.
//
//  ③ 도형의 평행이동 :  f(x, y) = 0  →  f(x − a, y − b) = 0
//     옮긴 도형 위의 점 P'(x', y') 에 대해 원래 점은 (x' − a, y' − b) 이고
//     그 점이 원래 도형 위에 있으므로 f(x' − a, y' − b) = 0 이 된다.
//     점은 +a, +b 인데 식에는 −a, −b 가 들어가는 까닭이다.

export type Pt = { x: number; y: number };

// ─── 조판 ─────────────────────────────────────────────────────
/** " + 3" / " - 3" / "" */
export function signTerm(v: number, unit = ""): string {
  if (v === 0) return "";
  const abs = Math.abs(v);
  const body = unit === "" ? `${abs}` : abs === 1 ? unit : `${abs}${unit}`;
  return (v < 0 ? " - " : " + ") + body;
}
/** "x" / "(x - 3)" / "(x + 2)" */
export function shiftedVar(name: string, s: number): string {
  return s === 0 ? name : `(${name} ${s > 0 ? "-" : "+"} ${Math.abs(s)})`;
}
/** "x" / "x - 3" / "x + 2"  (괄호 없이) */
export function shiftedBare(name: string, s: number): string {
  return s === 0 ? name : `${name} ${s > 0 ? "-" : "+"} ${Math.abs(s)}`;
}
/** (x−p)² + (y−q)² = r² */
export function circleTex(p: number, q: number, r2: number): string {
  const t = (v: number, name: string) => (v === 0 ? `${name}^2` : `(${name} ${v > 0 ? "-" : "+"} ${Math.abs(v)})^2`);
  return `${t(p, "x")} + ${t(q, "y")} = ${r2}`;
}
export function ptTex(p: Pt): string {
  return `(${p.x}, ${p.y})`;
}
export function nz(v: number): string {
  const r = Math.round(v * 100) / 100;
  return r < 0 ? `−${Math.abs(r)}` : String(r);
}

// ─── 곡선 표본화 ──────────────────────────────────────────────
/** 매개변수 곡선을 화면 안의 조각들로 나눠 준다 */
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
// 탭 ① 모든 도형은 f(x, y) = 0
// ══════════════════════════════════════════════════════════════
export type Shape = {
  id: string;
  emoji: string;
  name: string;
  /** y = f(x) 꼴 (쓸 수 없으면 null) */
  yTex: string | null;
  /** f(x, y) = 0 꼴 */
  impTex: string;
  /** y = f(x) 꼴로 쓸 수 있는가 */
  isFn: boolean;
  /** 판정 근거 */
  why: string;
  /** 세로선 x = t 와의 교점 y좌표 (무한히 많으면 "inf") */
  hits: (t: number) => number[] | "inf";
  curves: (half: number) => Pt[][];
};

const EPS = 1e-9;

export const SHAPES: Shape[] = [
  {
    id: "line",
    emoji: "📏",
    name: "직선",
    yTex: "y = x + 1",
    impTex: "x - y + 1 = 0",
    isFn: true,
    why: "어떤 세로선을 그어도 딱 한 번 만나요.",
    hits: (t) => [t + 1],
    curves: (h) => sampleParam((t) => ({ x: t, y: t + 1 }), -h - 2, h + 2, 80, h),
  },
  {
    id: "parab",
    emoji: "🏹",
    name: "포물선",
    yTex: "y = x^2 - 2",
    impTex: "x^2 - y - 2 = 0",
    isFn: true,
    why: "세로선과 언제나 한 번만 만나요.",
    hits: (t) => [t * t - 2],
    curves: (h) => sampleParam((t) => ({ x: t, y: t * t - 2 }), -h - 2, h + 2, 200, h),
  },
  {
    id: "abs",
    emoji: "📐",
    name: "절댓값 그래프",
    yTex: "y = |x| - 1",
    impTex: "|x| - y - 1 = 0",
    isFn: true,
    why: "꺾인 모양이어도 세로선과는 한 번만 만나요.",
    hits: (t) => [Math.abs(t) - 1],
    curves: (h) => sampleParam((t) => ({ x: t, y: Math.abs(t) - 1 }), -h - 2, h + 2, 160, h),
  },
  {
    id: "half",
    emoji: "🌗",
    name: "위쪽 반원",
    yTex: "y = \\sqrt{9 - x^2}",
    impTex: "\\sqrt{9 - x^2} - y = 0",
    isFn: true,
    why: "위쪽 절반만 있으니 세로선과 한 번만 만나요.",
    hits: (t) => (Math.abs(t) <= 3 + EPS ? [Math.sqrt(Math.max(0, 9 - t * t))] : []),
    curves: (h) => sampleParam((t) => ({ x: 3 * Math.cos(t), y: 3 * Math.sin(t) }), 0, Math.PI, 160, h),
  },
  {
    id: "circle",
    emoji: "⭕",
    name: "원",
    yTex: null,
    impTex: "x^2 + y^2 - 9 = 0",
    isFn: false,
    why: "세로선이 원을 가로지르면 두 점에서 만나요 — 한 x 에 y 가 둘!",
    hits: (t) => {
      if (Math.abs(t) > 3 + EPS) return [];
      if (Math.abs(Math.abs(t) - 3) < EPS) return [0];
      const s = Math.sqrt(9 - t * t);
      return [s, -s];
    },
    curves: (h) => sampleParam((t) => ({ x: 3 * Math.cos(t), y: 3 * Math.sin(t) }), 0, 2 * Math.PI, 200, h),
  },
  {
    id: "vline",
    emoji: "🚧",
    name: "세로 직선",
    yTex: null,
    impTex: "x - 2 = 0",
    isFn: false,
    why: "x = 2 위에서는 y 가 무엇이든 되니 y 를 하나로 정할 수 없어요.",
    hits: (t) => (Math.abs(t - 2) < EPS ? "inf" : []),
    curves: (h) => [
      [
        { x: 2, y: -h - 2 },
        { x: 2, y: h + 2 },
      ],
    ],
  },
  {
    id: "sidep",
    emoji: "🌙",
    name: "누운 포물선",
    yTex: null,
    impTex: "y^2 - x - 3 = 0",
    isFn: false,
    why: "옆으로 누워 있어 세로선과 두 점에서 만나요.",
    hits: (t) => {
      if (t < -3 - EPS) return [];
      if (Math.abs(t + 3) < EPS) return [0];
      const s = Math.sqrt(t + 3);
      return [s, -s];
    },
    curves: (h) => sampleParam((t) => ({ x: t * t - 3, y: t }), -h - 2, h + 2, 200, h),
  },
  {
    id: "cross",
    emoji: "❌",
    name: "X자 두 직선",
    yTex: null,
    impTex: "x^2 - y^2 = 0",
    isFn: false,
    why: "y = x 와 y = −x 두 직선이라 세로선과 두 점에서 만나요.",
    hits: (t) => (Math.abs(t) < EPS ? [0] : [t, -t]),
    curves: (h) => [
      [
        { x: -h - 2, y: -h - 2 },
        { x: h + 2, y: h + 2 },
      ],
      [
        { x: -h - 2, y: h + 2 },
        { x: h + 2, y: -h - 2 },
      ],
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 점의 평행이동
// ══════════════════════════════════════════════════════════════
export type MoveKind = "forward" | "vector" | "backward";
export const MOVE_META: Record<MoveKind, { badge: string; ask: string; tone: string }> = {
  forward: { badge: "옮긴 점 찾기", ask: "옮긴 뒤의 점 P′ 의 좌표는?", tone: "emerald" },
  vector: { badge: "이동량 찾기", ask: "얼마만큼 옮겼을까요?", tone: "sky" },
  backward: { badge: "원래 점 찾기", ask: "옮기기 전의 점 P 의 좌표는?", tone: "violet" },
};

export type PtQ = {
  id: string;
  kind: MoveKind;
  P: Pt;
  a: number;
  b: number;
  Pp: Pt;
  /** 학생이 채울 두 값 */
  ans: [number, number];
};

function mkPt(id: string, kind: MoveKind, P: Pt, a: number, b: number): PtQ {
  const Pp = { x: P.x + a, y: P.y + b };
  const ans: [number, number] = kind === "forward" ? [Pp.x, Pp.y] : kind === "vector" ? [a, b] : [P.x, P.y];
  return { id, kind, P, a, b, Pp, ans };
}

export const PT_QS: PtQ[] = [
  mkPt("t1", "forward", { x: 2, y: 1 }, 3, 2),
  mkPt("t2", "forward", { x: -1, y: 4 }, 2, -5),
  mkPt("t3", "vector", { x: 1, y: 1 }, 3, -3),
  mkPt("t4", "forward", { x: 3, y: -2 }, -4, 1),
  mkPt("t5", "vector", { x: -3, y: 2 }, 5, 3),
  mkPt("t6", "backward", { x: 2, y: 1 }, 1, 4),
  mkPt("t7", "vector", { x: 0, y: -4 }, -5, 3),
  mkPt("t8", "backward", { x: 1, y: -2 }, -3, 2),
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 도형의 평행이동 — 겹치기 퍼즐
// ══════════════════════════════════════════════════════════════
export type Fig =
  | { kind: "circle"; c: Pt; r: number }
  | { kind: "fx"; g: (x: number) => number };

export type Round = {
  id: string;
  emoji: string;
  name: string;
  fig: Fig;
  /** 목표 이동량 */
  a: number;
  b: number;
  /** 원본 방정식 */
  origTex: string;
  /** (a, b) 만큼 옮겼을 때의 정리된 방정식 */
  liveTex: (a: number, b: number) => string;
  choices: string[];
  ans: number;
  /** 겹치게 만드는 (a, b) 가 여러 가지인 도형(직선)일 때의 안내 */
  note?: string;
};

export const ROUNDS: Round[] = [
  {
    id: "r1",
    emoji: "⭕",
    name: "원",
    fig: { kind: "circle", c: { x: 0, y: 0 }, r: 2 },
    a: 3,
    b: 2,
    origTex: "x^2 + y^2 = 4",
    liveTex: (a, b) => circleTex(a, b, 4),
    choices: ["(x + 3)^2 + (y + 2)^2 = 4", "(x - 3)^2 + (y - 2)^2 = 4", "(x - 2)^2 + (y - 3)^2 = 4", "(x - 3)^2 + (y - 2)^2 = 2"],
    ans: 1,
  },
  {
    id: "r2",
    emoji: "🏹",
    name: "포물선",
    fig: { kind: "fx", g: (x) => x * x },
    a: -2,
    b: 1,
    origTex: "y = x^2",
    liveTex: (a, b) => `y = ${shiftedVar("x", a)}^2${signTerm(b)}`,
    choices: ["y = (x - 2)^2 + 1", "y = (x + 2)^2 - 1", "y = (x + 2)^2 + 1", "y = (x + 1)^2 + 2"],
    ans: 2,
  },
  {
    id: "r3",
    emoji: "📏",
    name: "직선",
    fig: { kind: "fx", g: (x) => 2 * x },
    a: 1,
    b: -3,
    origTex: "y = 2x",
    liveTex: (a, b) => `y = 2x${signTerm(b - 2 * a)}`,
    choices: ["y = 2x - 5", "y = 2x + 5", "y = 2x - 1", "y = 2x - 3"],
    ans: 0,
    note: "직선은 겹치게 만드는 (a, b) 가 한 가지가 아니에요! 2a − b 가 같기만 하면 모두 같은 직선이 됩니다.",
  },
  {
    id: "r4",
    emoji: "📐",
    name: "절댓값 그래프",
    fig: { kind: "fx", g: (x) => Math.abs(x) },
    a: 2,
    b: -1,
    origTex: "y = |x|",
    liveTex: (a, b) => `y = |${shiftedBare("x", a)}|${signTerm(b)}`,
    choices: ["y = |x + 2| - 1", "y = |x - 2| + 1", "y = |x - 1| - 2", "y = |x - 2| - 1"],
    ans: 3,
  },
  {
    id: "r5",
    emoji: "🎯",
    name: "중심이 옮겨진 원",
    fig: { kind: "circle", c: { x: 1, y: 0 }, r: 1 },
    a: -3,
    b: 3,
    origTex: "(x - 1)^2 + y^2 = 1",
    liveTex: (a, b) => circleTex(1 + a, b, 1),
    choices: ["(x + 2)^2 + (y - 3)^2 = 1", "(x - 4)^2 + (y + 3)^2 = 1", "(x + 2)^2 + (y + 3)^2 = 1", "(x - 2)^2 + (y - 3)^2 = 1"],
    ans: 0,
  },
];

/**
 * (a₁, b₁) 만큼 옮긴 도형과 (a₂, b₂) 만큼 옮긴 도형이 완전히 같은가.
 * 직선처럼 겹치게 만드는 이동량이 여러 가지인 도형이 있으므로
 * 이동량을 직접 비교하지 않고 도형 자체를 비교한다.
 */
export function figSame(fig: Fig, a1: number, b1: number, a2: number, b2: number): boolean {
  if (fig.kind === "circle") return a1 === a2 && b1 === b2;
  const xs = [-5.3, -2.1, -0.7, 0.9, 2.3, 4.7, 6.1, a1, a2, a1 + 1, a2 - 1];
  return xs.every((x) => Math.abs(fig.g(x - a1) + b1 - (fig.g(x - a2) + b2)) < 1e-9);
}

/** 도형을 (a, b) 만큼 평행이동한 곡선 */
export function figCurves(fig: Fig, a: number, b: number, half: number): Pt[][] {
  if (fig.kind === "circle") {
    return sampleParam((t) => ({ x: fig.c.x + a + fig.r * Math.cos(t), y: fig.c.y + b + fig.r * Math.sin(t) }), 0, 2 * Math.PI, 160, half);
  }
  return sampleParam((t) => ({ x: t, y: fig.g(t - a) + b }), -half - 2, half + 2, 200, half);
}
