// 직선 y = x 에 대한 대칭이동 — 활동 데이터
//
//  ① 점 :  P(x, y) → P′(x′, y′) 일 때
//     ㉠ PP′ ⊥ (y = x) 이므로  (y − y′)/(x − x′) × 1 = −1  ⇒  x′ + y′ = x + y
//     ㉡ 중점 ((x+x′)/2, (y+y′)/2) 이 y = x 위에 있으므로  x′ − y′ = −x + y
//     두 식을 연립하면  x′ = y, y′ = x  ⇒  P′(y, x)   (좌표를 맞바꾼다)
//
//  ② 도형 :  f(x, y) = 0 위의 점 P(x, y) 의 상 P′(x′, y′) 은 x′ = y, y′ = x,
//     곧 x = y′, y = x′ 이므로 f(y′, x′) = 0.  따라서 옮긴 도형의 방정식은
//        f(y, x) = 0
//
//  ③ 이 중단원의 다섯 가지 이동
//        평행이동 (x + a, y + b)      도형 f(x − a, y − b) = 0
//        x축 대칭 (x, −y)             도형 f(x, −y) = 0
//        y축 대칭 (−x, y)             도형 f(−x, y) = 0
//        원점 대칭 (−x, −y)           도형 f(−x, −y) = 0
//        y = x 대칭 (y, x)            도형 f(y, x) = 0

export type Pt = { x: number; y: number };

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

/** 직선 y = x 에 대한 대칭 — 좌표를 맞바꾼다 */
export function swapPt(p: Pt): Pt {
  return { x: p.y, y: p.x };
}
export function midPt(p: Pt, q: Pt): Pt {
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 점의 y = x 대칭 — 짝 맞추기
// ══════════════════════════════════════════════════════════════
/** 서로 y = x 대칭인 네 쌍 */
export const PAIRS: [Pt, Pt][] = [
  [{ x: 3, y: 1 }, { x: 1, y: 3 }],
  [{ x: -2, y: 4 }, { x: 4, y: -2 }],
  [{ x: 5, y: 0 }, { x: 0, y: 5 }],
  [{ x: -3, y: -1 }, { x: -1, y: -3 }],
];

/** 짝이 흩어지도록 미리 섞어 둔 카드 순서 (무작위를 쓰지 않는다) */
export const CARDS: Pt[] = [
  { x: 3, y: 1 },
  { x: 4, y: -2 },
  { x: 0, y: 5 },
  { x: -1, y: -3 },
  { x: 1, y: 3 },
  { x: -2, y: 4 },
  { x: 5, y: 0 },
  { x: -3, y: -1 },
];

export function pairIndexOf(i: number): number {
  const p = CARDS[i];
  const q = swapPt(p);
  return CARDS.findIndex((c, j) => j !== i && c.x === q.x && c.y === q.y);
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 도형의 y = x 대칭
// ══════════════════════════════════════════════════════════════
export type Fig = {
  id: string;
  emoji: string;
  name: string;
  /** 원본 방정식 */
  tex: string;
  /** y = x 대칭이동한 방정식 (그대로 맞바꾼 모습) */
  texSwap: string;
  /** 정리한 모습 (없으면 texSwap 과 같음) */
  texTidy?: string;
  /** 자기 자신과 겹치는가 */
  self: boolean;
  /** 곡선 매개변수 */
  t0: number;
  t1: number;
  pt: (t: number) => Pt;
};

export const FIGS: Fig[] = [
  {
    id: "parab",
    emoji: "🏹",
    name: "포물선",
    tex: "y = x^2 - 2",
    texSwap: "x = y^2 - 2",
    self: false,
    t0: -3.2,
    t1: 3.2,
    pt: (t) => ({ x: t, y: t * t - 2 }),
  },
  {
    id: "line",
    emoji: "📏",
    name: "직선",
    tex: "y = 2x + 1",
    texSwap: "x = 2y + 1",
    texTidy: "y = \\frac{x - 1}{2}",
    self: false,
    t0: -4.5,
    t1: 4.5,
    pt: (t) => ({ x: t, y: 2 * t + 1 }),
  },
  {
    id: "circleC",
    emoji: "🎯",
    name: "옮겨진 원",
    tex: "(x - 3)^2 + (y - 1)^2 = 4",
    texSwap: "(y - 3)^2 + (x - 1)^2 = 4",
    texTidy: "(x - 1)^2 + (y - 3)^2 = 4",
    self: false,
    t0: 0,
    t1: 2 * Math.PI,
    pt: (t) => ({ x: 3 + 2 * Math.cos(t), y: 1 + 2 * Math.sin(t) }),
  },
  {
    id: "absv",
    emoji: "📐",
    name: "절댓값 그래프",
    tex: "y = |x| - 2",
    texSwap: "x = |y| - 2",
    self: false,
    t0: -6,
    t1: 6,
    pt: (t) => ({ x: t, y: Math.abs(t) - 2 }),
  },
  {
    id: "circleO",
    emoji: "⭕",
    name: "원점이 중심인 원",
    tex: "x^2 + y^2 = 9",
    texSwap: "y^2 + x^2 = 9",
    texTidy: "x^2 + y^2 = 9",
    self: true,
    t0: 0,
    t1: 2 * Math.PI,
    pt: (t) => ({ x: 3 * Math.cos(t), y: 3 * Math.sin(t) }),
  },
  {
    id: "hyper",
    emoji: "✖️",
    name: "쌍곡선",
    tex: "xy = 4",
    texSwap: "yx = 4",
    texTidy: "xy = 4",
    self: true,
    t0: 0.5,
    t1: 8,
    pt: (t) => ({ x: t, y: 4 / t }),
  },
];

export function figCurve(f: Fig, half: number): Pt[][] {
  const main = sampleParam(f.pt, f.t0, f.t1, 220, half);
  if (f.id !== "hyper") return main;
  // 쌍곡선은 반대쪽 가지도 함께 그린다
  return [...main, ...sampleParam((t) => ({ x: -t, y: -4 / t }), 0.5, 8, 220, half)];
}
export function swapCurves(cs: Pt[][]): Pt[][] {
  return cs.map((c) => c.map(swapPt));
}

// ─── 식 맞히기 퀴즈 ──────────────────────────────────────────
export type EqQ = {
  id: string;
  tex: string;
  choices: string[];
  ans: number;
  tip: string;
};

export const EQ_QS: EqQ[] = [
  {
    id: "q1",
    tex: "y = 2x + 1",
    choices: ["x = 2y + 1", "y = -2x + 1", "y = 2x - 1", "-y = 2x + 1"],
    ans: 0,
    tip: "x 와 y 를 통째로 맞바꾸면 끝! 정리하면 y = (x − 1)/2 예요.",
  },
  {
    id: "q2",
    tex: "(x - 3)^2 + (y - 1)^2 = 4",
    choices: ["(x + 3)^2 + (y + 1)^2 = 4", "(x - 1)^2 + (y - 3)^2 = 4", "(x - 3)^2 + (y + 1)^2 = 4", "(x + 1)^2 + (y - 3)^2 = 4"],
    ans: 1,
    tip: "중심 (3, 1) 이 (1, 3) 으로 가요. 반지름은 그대로!",
  },
  {
    id: "q3",
    tex: "y = x^2 - 2",
    choices: ["y = -x^2 + 2", "x = y^2 - 2", "y = x^2 + 2", "x = -y^2 - 2"],
    ans: 1,
    tip: "y 자리에 x 를, x 자리에 y 를 넣으면 누운 포물선이 돼요.",
  },
  {
    id: "q4",
    tex: "3x - 2y + 6 = 0",
    choices: ["3x + 2y + 6 = 0", "2x - 3y - 6 = 0", "2x - 3y + 6 = 0", "-3x + 2y + 6 = 0"],
    ans: 1,
    tip: "3y − 2x + 6 = 0 의 양변에 −1 을 곱해 정리해 보세요.",
  },
  {
    id: "q5",
    tex: "x^2 + y^2 - 4x + 2y = 0",
    choices: ["x^2 + y^2 + 4x - 2y = 0", "x^2 + y^2 + 2x - 4y = 0", "x^2 + y^2 - 2x + 4y = 0", "x^2 + y^2 - 4x - 2y = 0"],
    ans: 1,
    tip: "x² 과 y² 은 그대로지만 −4x 와 +2y 는 자리를 바꿔요.",
  },
  {
    id: "q6",
    tex: "y = |x| - 2",
    choices: ["y = -|x| + 2", "y = |x| + 2", "x = |y| - 2", "x = -|y| + 2"],
    ans: 2,
    tip: "옆으로 누운 V 자가 돼요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 종합 게임 — 삼각형 옮기기 퍼즐
// ══════════════════════════════════════════════════════════════
export type Move = "left" | "right" | "down" | "up" | "sx" | "sy" | "so" | "sd";

export const MOVE_META: Record<Move, { label: string; icon: string; rule: string; kind: "move" | "sym"; color: string }> = {
  left: { label: "왼쪽", icon: "←", rule: "(x - 1,\\; y)", kind: "move", color: "#38bdf8" },
  right: { label: "오른쪽", icon: "→", rule: "(x + 1,\\; y)", kind: "move", color: "#38bdf8" },
  down: { label: "아래", icon: "↓", rule: "(x,\\; y - 1)", kind: "move", color: "#38bdf8" },
  up: { label: "위", icon: "↑", rule: "(x,\\; y + 1)", kind: "move", color: "#38bdf8" },
  sx: { label: "x축 대칭", icon: "↕️", rule: "(x,\\; -y)", kind: "sym", color: "#34d399" },
  sy: { label: "y축 대칭", icon: "↔️", rule: "(-x,\\; y)", kind: "sym", color: "#f472b6" },
  so: { label: "원점 대칭", icon: "🔄", rule: "(-x,\\; -y)", kind: "sym", color: "#a78bfa" },
  sd: { label: "y = x 대칭", icon: "🪞", rule: "(y,\\; x)", kind: "sym", color: "#fbbf24" },
};
export const MOVE_ORDER: Move[] = ["left", "right", "up", "down", "sx", "sy", "so", "sd"];

export function applyMove(pts: Pt[], m: Move): Pt[] {
  switch (m) {
    case "left":
      return pts.map((p) => ({ x: p.x - 1, y: p.y }));
    case "right":
      return pts.map((p) => ({ x: p.x + 1, y: p.y }));
    case "down":
      return pts.map((p) => ({ x: p.x, y: p.y - 1 }));
    case "up":
      return pts.map((p) => ({ x: p.x, y: p.y + 1 }));
    case "sx":
      return pts.map((p) => ({ x: p.x, y: -p.y }));
    case "sy":
      return pts.map((p) => ({ x: -p.x, y: p.y }));
    case "so":
      return pts.map((p) => ({ x: -p.x, y: -p.y }));
    default:
      return pts.map(swapPt);
  }
}
export function applySeq(pts: Pt[], seq: Move[]): Pt[] {
  return seq.reduce((acc, m) => applyMove(acc, m), pts);
}
export function samePts(a: Pt[], b: Pt[]): boolean {
  return a.length === b.length && a.every((p, i) => p.x === b[i].x && p.y === b[i].y);
}

/** 대칭축이 없는 삼각형 — 여덟 가지 변환이 모두 구별된다 */
export const BASE_TRI: Pt[] = [
  { x: 1, y: 1 },
  { x: 4, y: 1 },
  { x: 1, y: 3 },
];

export type Stage = {
  id: string;
  seq: Move[];
  locked: Move[];
  /** 최소 몇 번이면 되는가 (node 로 너비 우선 탐색해 검증) */
  min: number;
  hint: string;
};

export const STAGES: Stage[] = [
  { id: "s1", seq: ["sd"], locked: [], min: 1, hint: "x좌표와 y좌표가 통째로 맞바뀌었어요." },
  { id: "s2", seq: ["so", "up", "up"], locked: [], min: 3, hint: "먼저 뒤집고 나서 옮기면 짧아요." },
  { id: "s3", seq: ["sd", "right", "right"], locked: [], min: 3, hint: "y = x 대칭을 쓴 뒤 오른쪽으로!" },
  { id: "s4", seq: ["so"], locked: ["so"], min: 2, hint: "원점 대칭 버튼이 없어도 두 번이면 갈 수 있어요." },
  { id: "s5", seq: ["sd", "sx"], locked: [], min: 2, hint: "y = x 대칭과 x축 대칭을 이어 하면 90° 돌아가요." },
  { id: "s6", seq: ["left", "left"], locked: ["left"], min: 4, hint: "왼쪽 버튼이 없어도 괜찮아요 — 뒤집었다가 오른쪽으로 간 뒤 다시 뒤집으면?" },
];

export function goalOf(st: Stage): Pt[] {
  return applySeq(BASE_TRI, st.seq);
}

// ─── 마무리 요약 ─────────────────────────────────────────────
export const SUMMARY: { title: string; pt: string; fig: string; tone: string }[] = [
  { title: "평행이동", pt: "(x + a,\\; y + b)", fig: "f(x - a,\\; y - b) = 0", tone: "sky" },
  { title: "x축 대칭", pt: "(x,\\; -y)", fig: "f(x,\\; -y) = 0", tone: "emerald" },
  { title: "y축 대칭", pt: "(-x,\\; y)", fig: "f(-x,\\; y) = 0", tone: "pink" },
  { title: "원점 대칭", pt: "(-x,\\; -y)", fig: "f(-x,\\; -y) = 0", tone: "violet" },
  { title: "y = x 대칭", pt: "(y,\\; x)", fig: "f(y,\\; x) = 0", tone: "amber" },
];
