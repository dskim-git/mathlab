// 부등식의 영역 — 활동 데이터
//
//  · y > f(x) 의 영역은 y = f(x) 그래프의 윗부분,
//    y < f(x) 의 영역은 아랫부분이다.
//    등호가 들어가면(≥, ≤) 경계도 영역에 들어가므로 실선,
//    등호가 없으면(>, <) 경계는 빠지므로 점선으로 그린다.
//
//  · 이 활동에서 다루는 부등식은 세 가지 꼴이다.
//        line   :  y  ⊐  ax + b
//        vline  :  x  ⊐  c            (세로선 — 왼쪽·오른쪽으로 갈린다)
//        circle :  x² + y²  ⊐  r²     (원 — 안쪽·바깥쪽으로 갈린다)
//
//  · 어떤 점이 영역에 들어가는지는 좌표를 그대로 대입해 부등식이 참인지 보면 된다.
//    경계 위의 점은 등호가 있을 때만 영역에 들어간다.
//
//  · 부등식을 y에 대하여 정리할 때 음수로 나누면 부등호의 방향이 뒤집힌다.
//        x - 3y + 6 ≤ 0  →  -3y ≤ -x - 6  →  3y ≥ x + 6  →  y ≥ (1/3)x + 2
//
//  · 연립부등식의 영역과 그 활용(선형계획법)은 뒤의 다른 활동에서 다룬다.

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
export const OP_SIGN = [">", "≥", "<", "≤"] as const;
/** 등호가 들어가면 경계도 영역에 들어간다 → 실선 */
export const OP_SOLID = [false, true, false, true] as const;
export const ALL_OPS: Op[] = [0, 1, 2, 3];

export type Ineq =
  | { kind: "line"; a: number; b: number; op: Op; hidden?: boolean }
  | { kind: "vline"; c: number; op: Op; hidden?: boolean }
  | { kind: "circle"; r: number; op: Op; hidden?: boolean };

const EPS = 1e-9;

/** 부등식의 좌변 − 우변 (등호가 없는 쪽을 양수로) */
export function slack(q: Ineq, x: number, y: number): number {
  const raw = q.kind === "line" ? y - (q.a * x + q.b) : q.kind === "vline" ? x - q.c : x * x + y * y - q.r * q.r;
  return q.op < 2 ? raw : -raw;
}
export function satisfies(q: Ineq, x: number, y: number): boolean {
  const v = slack(q, x, y);
  return OP_SOLID[q.op] ? v >= -EPS : v > EPS;
}
export function onBoundary(q: Ineq, x: number, y: number): boolean {
  return Math.abs(slack(q, x, y)) < EPS;
}
export function withOp(q: Ineq, op: Op): Ineq {
  return { ...q, op };
}

/** 분수까지 살린 수 표기 */
function numTex(a: number): string {
  if (Number.isInteger(a)) return String(a);
  const sign = a < 0 ? "-" : "";
  const m = Math.abs(a);
  if (Math.abs(m * 3 - Math.round(m * 3)) < EPS && !Number.isInteger(m * 2)) return `${sign}\\dfrac{${Math.round(m * 3)}}{3}`;
  return `${sign}\\dfrac{${Math.round(m * 2)}}{2}`;
}
/** ax 꼴 계수 */
function coefTex(a: number): string {
  if (a === 0) return "";
  const m = Math.abs(a);
  if (Number.isInteger(m)) return `${a < 0 ? "-" : ""}${m === 1 ? "" : m}x`;
  return `${numTex(a)}x`;
}
export function rhsTex(a: number, b: number): string {
  const head = coefTex(a);
  if (head === "") return `${fmt(b)}`;
  if (b === 0) return head;
  return `${head} ${b < 0 ? "-" : "+"} ${fmt(Math.abs(b))}`;
}
export function ineqTex(q: Ineq): string {
  if (q.kind === "line") return `y ${OP_TEX[q.op]} ${rhsTex(q.a, q.b)}`;
  if (q.kind === "vline") return `x ${OP_TEX[q.op]} ${fmt(q.c)}`;
  return `x^2 + y^2 ${OP_TEX[q.op]} ${fmt(q.r * q.r)}`;
}
/** 경계선의 식 */
export function edgeTex(q: Ineq): string {
  if (q.kind === "line") return `y = ${rhsTex(q.a, q.b)}`;
  if (q.kind === "vline") return `x = ${fmt(q.c)}`;
  return `x^2 + y^2 = ${fmt(q.r * q.r)}`;
}
const par = (v: number) => (v < 0 ? `(${fmt(v)})` : `${fmt(v)}`);
/** 점을 대입한 모습 */
export function substTex(q: Ineq, x: number, y: number): string {
  if (q.kind === "vline") return `${par(x)} ${OP_TEX[q.op]} ${fmt(q.c)}`;
  if (q.kind === "circle") return `${par(x)}^2 + ${par(y)}^2 = ${fmt(x * x + y * y)} ${OP_TEX[q.op]} ${fmt(q.r * q.r)}`;
  if (q.a === 0) return `${fmt(y)} ${OP_TEX[q.op]} ${fmt(q.b)}`;
  const rhs = q.a * x + q.b;
  const head = `${numTex(q.a)} \\times ${par(x)}`;
  const tail = q.b === 0 ? "" : ` ${q.b < 0 ? "-" : "+"} ${fmt(Math.abs(q.b))}`;
  return `${fmt(y)} ${OP_TEX[q.op]} ${head}${tail} = ${fmt(rhs)}`;
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 영역 그리기 실험실
// ══════════════════════════════════════════════════════════════
export const PLANE = { min: -6, max: 6 };
export const LAB_RANGE = {
  a: { min: -3, max: 3, step: 0.5 },
  b: { min: -5, max: 5, step: 1 },
  c: { min: -5, max: 5, step: 1 },
  r: { min: 1, max: 5, step: 1 },
};
export const LAB_START: Ineq = { kind: "line", a: 1, b: 0, op: 1 };

export type Preset = { id: string; emoji: string; label: string; q: Ineq };
export const LAB_PRESETS: Preset[] = [
  { id: "p1", emoji: "📐", label: "기울어진 직선", q: { kind: "line", a: -1, b: 3, op: 0 } },
  { id: "p2", emoji: "➖", label: "가로선", q: { kind: "line", a: 0, b: -2, op: 3 } },
  { id: "p3", emoji: "❘", label: "세로선", q: { kind: "vline", c: -2, op: 1 } },
  { id: "p4", emoji: "⭕", label: "원", q: { kind: "circle", r: 4, op: 2 } },
];

export type Mission = { id: string; emoji: string; title: string; inPts: [number, number][]; outPts: [number, number][]; hint: string };
export const MISSIONS: Mission[] = [
  {
    id: "m1",
    emoji: "🔵",
    title: "미션 1",
    inPts: [
      [0, -3],
      [3, -4],
      [-2, -2],
    ],
    outPts: [
      [1, 2],
      [-3, 1],
    ],
    hint: "파란 점 셋은 모두 아래쪽에 모여 있어요. 가로선 하나면 갈라낼 수 있어요. 경계에 걸친 점이 있는지도 살펴보세요.",
  },
  {
    id: "m2",
    emoji: "🟣",
    title: "미션 2",
    inPts: [
      [3, 1],
      [5, 0],
      [4, -2],
    ],
    outPts: [
      [-1, 2],
      [0, 4],
    ],
    hint: "이번에는 위아래가 아니라 좌우로 갈려 있어요. 세로선을 써 볼까요?",
  },
  {
    id: "m3",
    emoji: "🟢",
    title: "미션 3",
    inPts: [
      [0, 0],
      [1, 1],
      [-1, 1],
    ],
    outPts: [
      [4, 3],
      [-4, -3],
    ],
    hint: "파란 점은 가운데에 모여 있고 빨간 점은 멀리 떨어져 있어요. 직선으로는 갈라낼 수 없어요.",
  },
];

export function missionDone(mi: Mission, q: Ineq): boolean {
  return mi.inPts.every((p) => satisfies(q, p[0], p[1])) && mi.outPts.every((p) => !satisfies(q, p[0], p[1]));
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 어느 부분일까 — 그림 고르기 퀴즈
// ══════════════════════════════════════════════════════════════
export type RegionQ = {
  id: string;
  /** 문제에 보이는 그대로의 부등식 */
  tex: string;
  /** y에 대하여 정리한 꼴 (정리가 필요 없으면 생략) */
  solvedTex?: string;
  base: Ineq;
  /** 보기 네 칸에 놓을 부등호 — base.op 가 정답 */
  order: Op[];
  explain: string;
};

export const REGION_QUIZ: RegionQ[] = [
  {
    id: "q1",
    tex: "y \\ge -x + 3",
    base: { kind: "line", a: -1, b: 3, op: 1 },
    order: [2, 0, 1, 3],
    explain: "y ≥ (식) 이므로 경계선의 윗부분이고, 등호가 있으니 경계선도 들어가 실선으로 그려요.",
  },
  {
    id: "q2",
    tex: "y < 2x - 1",
    base: { kind: "line", a: 2, b: -1, op: 2 },
    order: [2, 3, 0, 1],
    explain: "y < (식) 이므로 경계선의 아랫부분이고, 등호가 없으니 경계선은 빠져 점선으로 그려요.",
  },
  {
    id: "q3",
    tex: "2x + y - 4 > 0",
    solvedTex: "y > -2x + 4",
    base: { kind: "line", a: -2, b: 4, op: 0 },
    order: [1, 2, 3, 0],
    explain: "y만 남기면 y > -2x + 4 예요. 윗부분이고 등호가 없으니 점선입니다.",
  },
  {
    id: "q4",
    tex: "x - 3y + 6 \\le 0",
    solvedTex: "y \\ge \\dfrac{1}{3}x + 2",
    base: { kind: "line", a: 1 / 3, b: 2, op: 1 },
    order: [3, 1, 0, 2],
    explain:
      "-3y ≤ -x - 6 에서 양변을 -3으로 나누면 부등호의 방향이 뒤집혀 y ≥ (1/3)x + 2 가 돼요. 음수로 나눌 때 방향이 바뀌는 것을 잊지 마세요!",
  },
  {
    id: "q5",
    tex: "y + 2 \\le 0",
    solvedTex: "y \\le -2",
    base: { kind: "line", a: 0, b: -2, op: 3 },
    order: [0, 1, 3, 2],
    explain: "y ≤ -2 이므로 가로선 y = -2 의 아랫부분이에요. 등호가 있으니 실선입니다.",
  },
  {
    id: "q6",
    tex: "x - 1 > 0",
    solvedTex: "x > 1",
    base: { kind: "vline", c: 1, op: 0 },
    order: [0, 3, 2, 1],
    explain: "x > 1 은 세로선 x = 1 의 오른쪽이에요. 위아래가 아니라 좌우로 갈린다는 점에 주의하세요.",
  },
  {
    id: "q7",
    tex: "x^2 + y^2 < 9",
    base: { kind: "circle", r: 3, op: 2 },
    order: [3, 2, 1, 0],
    explain: "원점에서의 거리가 3보다 작은 점들이니 반지름 3인 원의 안쪽이에요. 등호가 없으니 원은 점선입니다.",
  },
];

export function quizAnswer(q: RegionQ): number {
  return q.order.indexOf(q.base.op);
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 이 점, 들어갈까? — 판정 게임
// ══════════════════════════════════════════════════════════════
export type PointQ = { id: string; q: Ineq; p: [number, number]; explain: string };

export const POINT_GAME: PointQ[] = [
  {
    id: "g1",
    q: { kind: "line", a: 1, b: 2, op: 2 },
    p: [1, 3],
    explain: "3 < 3 은 거짓이에요. 점이 경계선 위에 딱 있는데 등호가 없으니 영역에 들어가지 못해요.",
  },
  {
    id: "g2",
    q: { kind: "line", a: 1, b: 2, op: 3 },
    p: [1, 3],
    explain: "3 ≤ 3 은 참이에요. 같은 점인데 등호가 붙자 경계까지 영역에 들어왔어요. 실선과 점선의 차이랍니다.",
  },
  {
    id: "g3",
    q: { kind: "line", a: -2, b: 1, op: 0 },
    p: [2, -1],
    explain: "-1 > -3 은 참이에요. 경계선의 윗부분에 있는 점입니다.",
  },
  {
    id: "g4",
    q: { kind: "line", a: 3, b: -4, op: 1 },
    p: [1, -2],
    explain: "-2 ≥ -1 은 거짓이에요. 경계선보다 아래에 있으니 윗부분 영역에는 못 들어가요.",
  },
  {
    id: "g5",
    q: { kind: "vline", c: -1, op: 1 },
    p: [-1, 4],
    explain: "-1 ≥ -1 은 참이에요. 세로선 위의 점이지만 등호가 있어 영역에 들어갑니다. y좌표는 아무 상관이 없어요.",
  },
  {
    id: "g6",
    q: { kind: "vline", c: 2, op: 2 },
    p: [3, 0],
    explain: "3 < 2 는 거짓이에요. 세로선의 오른쪽에 있으니 왼쪽 영역에는 못 들어가요.",
  },
  {
    id: "g7",
    q: { kind: "circle", r: 5, op: 3 },
    p: [3, -4],
    explain: "3² + (-4)² = 25 이고 25 ≤ 25 는 참이에요. 원 위에 딱 놓인 점인데 등호 덕분에 들어갑니다.",
  },
  {
    id: "g8",
    q: { kind: "circle", r: 2, op: 0 },
    p: [1, 1],
    explain: "1² + 1² = 2 이고 2 > 4 는 거짓이에요. 원 안에 있는 점이라 바깥쪽 영역에는 못 들어가요.",
  },
  {
    id: "g9",
    q: { kind: "line", a: -1, b: 5, op: 3 },
    p: [2, 2],
    explain: "2 ≤ 3 은 참이에요. 경계선의 아랫부분에 있는 점입니다.",
  },
  {
    id: "g10",
    q: { kind: "line", a: 0.5, b: 0, op: 0 },
    p: [-4, -1],
    explain: "-1 > -2 는 참이에요. 음수 자리에서도 위아래를 헷갈리지 않고 대입해 보면 알 수 있어요.",
  },
];
