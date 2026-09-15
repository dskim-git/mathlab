// 연립방정식과 역행렬 — 활동 데이터
//
//  · x, y 에 대한 연립일차방정식
//        ax + by = m
//        cx + dy = n
//    은 행렬로 AX = B 로 쓸 수 있고, 좌표평면에서는 두 직선으로 보인다.
//    같은 상황을 연립방정식 · 행렬 · 그래프 세 가지로 함께 보여 주는 것이 이 활동의 뼈대다.
//
//  · 세 표현이 맞물리는 지점이 행렬식 ad - bc 다.
//        ad - bc ≠ 0  →  A⁻¹ 이 있다  →  두 직선이 한 점에서 만난다  →  해가 하나
//                         그 해는 X = A⁻¹B = 1/(ad-bc) · ((d,-b),(-c,a)) · B
//        ad - bc = 0  →  A⁻¹ 이 없다  →  두 직선의 기울기가 같다
//              두 식이 서로 실수배이면 같은 직선이라 해가 무수히 많고 (부정)
//              그렇지 않으면 나란한 두 직선이라 해가 없다 (불능)
//    기울기가 같은지는 ad - bc = 0 으로, 같은 직선인지는 an - cm 과 bn - dm 이
//    함께 0 인지로 가린다. (세 계수가 통째로 비례하는지를 보는 것이다.)
//
//  · a 와 b 가 동시에 0 이면 그 식은 직선을 나타내지 못한다. 손잡이로 그런 자리에
//    갈 수 있으므로 그때는 따로 안내한다. m 도 0 이면 늘 참인 식이라 해가 무수히 많고,
//    m 이 0 이 아니면 참이 될 수 없어 해가 없다.
//
// ── 탭 ① 두 직선 실험실 ───────────────────────────────────
//  · a, b, c, d 는 -5~5, m, n 은 -8~8. 화면은 -10~10 이라
//    원점에서 직선까지의 거리가 아무리 멀어도 8 을 넘지 않아 두 직선이 늘 보인다.
//    (거리 = |m| / √(a²+b²) 이고 a, b 가 동시에 0 이 아니면 √(a²+b²) ≥ 1)
//  · 시작은 2x + y = 4, x + 3y = 7 이고 행렬식 5, 교점 (1, 2).
//  · 미션은 나란하게 만들기 / 겹치게 만들기 / 교점을 (2, -1) 로 만들기 /
//    두 직선을 수직으로 만들기(법선끼리 수직이므로 ac + bd = 0). 모두 완전탐색으로
//    답이 있는지 세어 두었고 시작 상태로 풀려 있는 것은 없다.
//
// ── 탭 ② 역행렬로 풀기 ────────────────────────────────────
//  · 다섯 문제. 행렬식이 -7 · -1 · 11 · 1 · 0 으로 다르고 해도 모두 다르다.
//        x + 2y = 7,  3x -  y = 7   det -7   해 ( 3,  2)
//        3x + 4y = 10, x +  y = 3   det -1   해 ( 2,  1)
//        5x - 2y = 22, 3x + y = 11  det 11   해 ( 4, -1)
//        2x + 5y = 1,  x + 3y = 1   det  1   해 (-2,  1)
//        2x + 3y = 5,  4x + 6y = 7  det  0   → 역행렬이 없어 이 방법으로 풀 수 없다
//    행렬식이 ±1 일 때만 역행렬을 직접 채우게 하고, 그 밖에는 짝 행렬을 채운 뒤
//    마지막에 나누게 해서 분수를 입력할 일이 없다.
//
// ── 탭 ③ 세 갈래 판정 ─────────────────────────────────────
//  · 카드 열두 장을 '해가 하나 / 무수히 많다 / 없다' 로 가른다. 넷씩 고르게 넣었다.
//    답하면 두 직선이 그려져 판단이 맞았는지 눈으로 확인할 수 있다.
//
// ── 탭 ④ 실생활 ───────────────────────────────────────────
//  · 앞의 넷은 해가 하나인 문제, 뒤의 둘은 일부러 풀 수 없게 만든 상황이다.
//        농구 슛     x +  y = 12, 2x + 3y = 29   det  1  → 2점슛 7개, 3점슛 5개
//        저금통      x +  y = 30, 5x +  y = 94   det -4  → 500원 16개, 100원 14개
//        주차장      x +  y = 25, 2x +  y = 40   det -1  → 승용차 15대, 오토바이 10대
//        체험학습    x +  y =  8, 9x + 5y = 56   det -4  → 큰 버스 4대, 작은 버스 4대
//        간식 세트   2x + 3y = 8, 4x + 6y = 15   det  0  → 나란함, 해가 없다 (불능)
//              B 세트는 A 세트를 꼭 두 번 산 것인데 값이 16 이 아니라 15 라 앞뒤가 맞지 않는다.
//        문구 세트   3x + 2y = 4, 6x + 4y =  8   det  0  → 같은 직선, 해가 무수히 많다 (부정)
//              B 세트가 A 세트의 정확히 두 배라 새로 알려 주는 것이 없다.
//    저금통은 500x + 100y = 9400 을 100 으로 나누어 5x + y = 94 로 정리한 것이고,
//    주차장은 4x + 2y = 80 을 2로 나누어 2x + y = 40 으로, 체험학습은
//    45x + 25y = 1400 을 5로 나누어 9x + 5y = 280/5 = 56 으로 정리한 것이다.
//    금액과 개수는 모두 이 활동을 위해 정한 가상의 값이다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}
export function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}

// ══════════════════════════════════════════════════════════════
//  행렬 기본
// ══════════════════════════════════════════════════════════════
export type Mat = number[][];
export type Piece = { pre?: string; tex?: string; post?: string };

export const colsOf = (m: Mat): number => (m[0] ? m[0].length : 0);

export function mulM(a: Mat, b: Mat): Mat {
  const l = colsOf(a);
  return a.map((row, i) =>
    b[0].map((_, j) => {
      let s = 0;
      for (let t = 0; t < l; t++) s += a[i][t] * b[t][j];
      return s;
    }),
  );
}
export function eqM(a: Mat, b: Mat): boolean {
  if (a.length !== b.length || colsOf(a) !== colsOf(b)) return false;
  return a.every((row, i) => row.every((v, j) => Math.abs(v - b[i][j]) < 1e-9));
}
export function det2(m: Mat): number {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}
/** 대각선은 자리를 바꾸고 나머지는 부호를 바꾼 짝 행렬 */
export function adj2(m: Mat): Mat {
  return [
    [m[1][1], -m[0][1]],
    [-m[1][0], m[0][0]],
  ];
}
export function inv2(m: Mat): Mat | null {
  const k = det2(m);
  if (k === 0) return null;
  return adj2(m).map((row) => row.map((v) => v / k));
}

export function matTex(m: Mat): string {
  const body = m.map((row) => row.map((v) => fmt(v)).join(" & ")).join(" \\\\ ");
  return `\\begin{pmatrix} ${body} \\end{pmatrix}`;
}
export function detTex(m: Mat): string {
  const w = (v: number) => (v < 0 ? `(${v})` : `${v}`);
  return `${w(m[0][0])} \\cdot ${w(m[1][1])} - ${w(m[0][1])} \\cdot ${w(m[1][0])} = ${det2(m)}`;
}
/** 역행렬을 사람이 읽는 꼴로 — 행렬식이 ±1 이면 분수를 붙이지 않는다 */
export function invTex(m: Mat): string {
  const k = det2(m);
  if (k === 0) return "";
  if (Math.abs(k) === 1) return matTex(inv2(m) as Mat);
  return `\\frac{1}{${k}} ${matTex(adj2(m))}`;
}

// ══════════════════════════════════════════════════════════════
//  연립일차방정식
// ══════════════════════════════════════════════════════════════
export type Sys = { a: number; b: number; c: number; d: number; m: number; n: number };
export type SysKind = "one" | "many" | "none";

export const matOf = (s: Sys): Mat => [
  [s.a, s.b],
  [s.c, s.d],
];
export const constOf = (s: Sys): Mat => [[s.m], [s.n]];
export const detOf = (s: Sys): number => s.a * s.d - s.b * s.c;
/** a 와 b 가 동시에 0 이면 직선이 아니다 */
export const isLine = (a: number, b: number): boolean => !(a === 0 && b === 0);

export function kindOf(s: Sys): SysKind {
  // 직선이 아닌 식을 먼저 가린다
  if (!isLine(s.a, s.b)) return s.m === 0 ? kindOfSingle(s.c, s.d, s.n) : "none";
  if (!isLine(s.c, s.d)) return s.n === 0 ? kindOfSingle(s.a, s.b, s.m) : "none";
  if (detOf(s) !== 0) return "one";
  // 기울기가 같다 — 세 계수가 통째로 비례하면 같은 직선
  const same = s.a * s.n - s.c * s.m === 0 && s.b * s.n - s.d * s.m === 0;
  return same ? "many" : "none";
}
/** 식 하나만 남았을 때 — 그 식이 직선이면 해가 무수히 많다 */
function kindOfSingle(a: number, b: number, m: number): SysKind {
  if (isLine(a, b)) return "many";
  return m === 0 ? "many" : "none";
}

/** 해가 하나일 때의 교점 */
export function solveSys(s: Sys): [number, number] | null {
  const k = detOf(s);
  if (k === 0) return null;
  // 짝 행렬을 먼저 곱하고 나중에 나눠야 오차가 생기지 않는다
  const p = mulM(adj2(matOf(s)), constOf(s));
  return [p[0][0] / k, p[1][0] / k];
}

/** ax + by = m 을 사람이 읽는 꼴로 */
export function eqTex(a: number, b: number, m: number): string {
  const head = a === 0 ? "" : a === 1 ? "x" : a === -1 ? "-x" : `${a}x`;
  let tail = "";
  if (b !== 0) {
    const mag = Math.abs(b) === 1 ? "" : `${Math.abs(b)}`;
    if (head === "") tail = b < 0 ? `-${mag}y` : `${mag}y`;
    else tail = b < 0 ? ` - ${mag}y` : ` + ${mag}y`;
  }
  const lhs = `${head}${tail}` || "0";
  return `${lhs} = ${m}`;
}
export function sysTex(s: Sys): string {
  return `\\begin{cases} ${eqTex(s.a, s.b, s.m)} \\\\ ${eqTex(s.c, s.d, s.n)} \\end{cases}`;
}
/** AX = B 한 줄로 */
export function axbTex(s: Sys): string {
  return `${matTex(matOf(s))} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = ${matTex(constOf(s))}`;
}

// ══════════════════════════════════════════════════════════════
//  좌표평면 — 직선을 상자 안으로 자른다
// ══════════════════════════════════════════════════════════════
export type Box = { xMin: number; xMax: number; yMin: number; yMax: number; grid: number };
export type Seg = { x1: number; y1: number; x2: number; y2: number };

/** ax + by = m 이 상자와 만나는 선분 (만나지 않거나 직선이 아니면 null) */
export function lineSeg(a: number, b: number, m: number, box: Box): Seg | null {
  if (!isLine(a, b)) return null;
  const E = 1e-9;
  const pts: [number, number][] = [];
  const add = (x: number, y: number) => {
    if (x < box.xMin - E || x > box.xMax + E || y < box.yMin - E || y > box.yMax + E) return;
    if (pts.some((p) => Math.abs(p[0] - x) < 1e-7 && Math.abs(p[1] - y) < 1e-7)) return;
    pts.push([x, y]);
  };
  if (b !== 0) {
    add(box.xMin, (m - a * box.xMin) / b);
    add(box.xMax, (m - a * box.xMax) / b);
  }
  if (a !== 0) {
    add((m - b * box.yMin) / a, box.yMin);
    add((m - b * box.yMax) / a, box.yMax);
  }
  if (pts.length < 2) return null;
  // 가장 먼 두 점을 고른다
  let best: [number, number][] = [pts[0], pts[1]];
  let far = -1;
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const dd = (pts[i][0] - pts[j][0]) ** 2 + (pts[i][1] - pts[j][1]) ** 2;
      if (dd > far) {
        far = dd;
        best = [pts[i], pts[j]];
      }
    }
  return { x1: best[0][0], y1: best[0][1], x2: best[1][0], y2: best[1][1] };
}
export function inBox(p: [number, number], box: Box): boolean {
  return p[0] >= box.xMin && p[0] <= box.xMax && p[1] >= box.yMin && p[1] <= box.yMax;
}

// ══════════════════════════════════════════════════════════════
//  단계 문제 — 모든 탭이 함께 쓴다
// ══════════════════════════════════════════════════════════════
export type StepBase = {
  id: string;
  ask: string;
  mats?: { label: string; m: Mat }[];
  hint?: string;
  done?: string;
};
export type Step = StepBase &
  (
    | { kind: "choice"; options: Piece[][]; answer: number; explains: string[] }
    | { kind: "fill"; target: Mat; unit?: string }
    | { kind: "num"; answer: number; unit?: string }
  );

// ══════════════════════════════════════════════════════════════
//  탭 ① 두 직선 실험실
// ══════════════════════════════════════════════════════════════
export const LAB_BOX: Box = { xMin: -10, xMax: 10, yMin: -10, yMax: 10, grid: 2 };
export const COEF_MIN = -5;
export const COEF_MAX = 5;
export const CONST_MIN = -8;
export const CONST_MAX = 8;
export const LAB_START: Sys = { a: 2, b: 1, c: 1, d: 3, m: 4, n: 7 };

export const KIND_TITLE: Record<SysKind, string> = {
  one: "한 점에서 만나요",
  many: "두 직선이 겹쳐요",
  none: "두 직선이 나란해요",
};
export const KIND_SUB: Record<SysKind, string> = {
  one: "해가 하나뿐이에요",
  many: "해가 무수히 많아요 (부정)",
  none: "해가 없어요 (불능)",
};
export const KIND_EMOJI: Record<SysKind, string> = { one: "📍", many: "♾️", none: "🚫" };

export type Mission = { id: string; emoji: string; goal: string; hint: string; test: (s: Sys) => boolean };
export const MISSIONS: Mission[] = [
  {
    id: "mi1",
    emoji: "🚫",
    goal: "두 직선을 나란하게 만들기 (해가 없게)",
    hint: "기울기는 같고 위치는 다르게 해요. 아래 식의 x·y 계수를 위 식의 몇 배로 맞추되 상수항만 어긋나게 하면 돼요.",
    test: (s) => isLine(s.a, s.b) && isLine(s.c, s.d) && kindOf(s) === "none",
  },
  {
    id: "mi2",
    emoji: "♾️",
    goal: "두 직선을 완전히 겹치게 만들기 (해가 무수히 많게)",
    hint: "아래 식 전체가 위 식의 몇 배가 되게 해요. 상수항까지 같은 배수여야 해요.",
    test: (s) => isLine(s.a, s.b) && isLine(s.c, s.d) && kindOf(s) === "many",
  },
  {
    id: "mi3",
    emoji: "🎯",
    goal: "교점을 (2, -1) 로 만들기",
    hint: "두 식 모두 x 에 2, y 에 -1 을 넣었을 때 참이 되어야 해요.",
    test: (s) => {
      const p = solveSys(s);
      return !!p && Math.abs(p[0] - 2) < 1e-9 && Math.abs(p[1] + 1) < 1e-9;
    },
  },
  {
    id: "mi4",
    emoji: "📐",
    goal: "두 직선을 서로 수직으로 만들기",
    hint: "두 직선이 수직이면 계수끼리 ac + bd 가 0 이 돼요.",
    test: (s) => isLine(s.a, s.b) && isLine(s.c, s.d) && detOf(s) !== 0 && s.a * s.c + s.b * s.d === 0,
  },
];
export function missionDone(ms: Mission, s: Sys): boolean {
  return ms.test(s);
}

export const LAB_STEPS: Step[] = [
  {
    id: "l1",
    kind: "choice",
    ask: "행렬식이 0 이 아니면 두 직선은 어떻게 놓일까요?",
    options: [
      [{ pre: "서로 나란하다" }],
      [{ pre: "완전히 겹친다" }],
      [{ pre: "한 점에서 만난다" }],
      [{ pre: "만나지 않거나 겹친다" }],
    ],
    answer: 2,
    explains: [
      "나란한 것은 행렬식이 0 일 때예요.",
      "겹치는 것도 행렬식이 0 일 때예요.",
      "",
      "그 둘은 모두 행렬식이 0 인 경우예요.",
    ],
    hint: "실험실에서 행렬식이 0 이 아닌 자리로 옮겨 놓고 그래프를 보세요.",
  },
  {
    id: "l2",
    kind: "choice",
    ask: "행렬식이 0 인데 두 직선이 겹쳤어요. 해는 어떻게 될까요?",
    options: [
      [{ pre: "해가 무수히 많다" }],
      [{ pre: "해가 없다" }],
      [{ pre: "해가 하나뿐이다" }],
      [{ pre: "해가 두 개다" }],
    ],
    answer: 0,
    explains: [
      "",
      "해가 없는 것은 두 직선이 나란할 때예요.",
      "해가 하나이려면 두 직선이 한 점에서만 만나야 해요.",
      "두 직선의 교점이 두 개가 되는 일은 없어요.",
    ],
    hint: "겹친 직선 위의 점은 모두 두 식을 함께 만족해요.",
    done: "이런 경우를 부정이라 하고, 아래 식이 위 식에 새로 보태 주는 정보가 없다는 뜻이에요.",
  },
  {
    id: "l3",
    kind: "choice",
    ask: "행렬식이 0 이면서 두 직선이 나란하기만 한 경우는 어떤 상황일까요?",
    options: [
      [{ pre: "두 식이 같은 직선이라 해가 무수히 많다" }],
      [{ pre: "해가 하나 있지만 소수가 된다" }],
      [{ pre: "역행렬을 구하면 풀 수 있다" }],
      [{ pre: "두 식이 서로 모순이라 해가 없다" }],
    ],
    answer: 3,
    explains: [
      "같은 직선이면 나란한 것이 아니라 겹친 것이에요.",
      "나란한 두 직선은 어디서도 만나지 않아요.",
      "행렬식이 0 이면 역행렬 자체가 없어요.",
      "",
    ],
    hint: "나란한 두 직선은 아무리 늘여도 만나지 않아요.",
    done: "이런 경우를 불능이라 해요. 두 조건이 서로 앞뒤가 맞지 않는 상황이지요.",
  },
  {
    id: "l4",
    kind: "num",
    ask: "2x + y = 4 와 x + 3y = 7 의 행렬식은 얼마일까요?",
    answer: detOf(LAB_START),
    hint: "2 곱하기 3 에서 1 곱하기 1 을 빼요.",
  },
  {
    id: "l5",
    kind: "fill",
    ask: "그 연립방정식의 해를 구해 보세요. (위 칸이 x, 아래 칸이 y)",
    target: [[1], [2]],
    hint: "실험실 화면의 교점 좌표를 읽어도 되고, 역행렬로 구해도 돼요.",
    done: "그래프의 교점과 역행렬로 구한 해가 같은 것이에요. 표현만 다를 뿐 같은 이야기지요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 역행렬로 풀기
// ══════════════════════════════════════════════════════════════
export const SOLVE_BOX: Box = { xMin: -8, xMax: 8, yMin: -8, yMax: 8, grid: 2 };

export type Quest = { id: string; emoji: string; title: string; sys: Sys; steps: Step[]; wrap: string };

const Q1: Sys = { a: 1, b: 2, c: 3, d: -1, m: 7, n: 7 };
const Q2: Sys = { a: 3, b: 4, c: 1, d: 1, m: 10, n: 3 };
const Q3: Sys = { a: 5, b: -2, c: 3, d: 1, m: 22, n: 11 };
const Q4: Sys = { a: 2, b: 5, c: 1, d: 3, m: 1, n: 1 };
const Q5: Sys = { a: 2, b: 3, c: 4, d: 6, m: 5, n: 7 };

const solCol = (s: Sys): Mat => {
  const p = solveSys(s) as [number, number];
  return [[p[0]], [p[1]]];
};

export const QUESTS: Quest[] = [
  {
    id: "q1",
    emoji: "🥇",
    title: "첫 번째",
    sys: Q1,
    steps: [
      {
        id: "q1s1",
        kind: "choice",
        ask: "이 연립방정식을 AX = B 로 쓸 때 A 는 어느 것일까요?",
        options: [
          [{ tex: matTex([[1, 3], [2, -1]]) }],
          [{ tex: matTex([[1, 2], [3, -1]]) }],
          [{ tex: matTex([[7], [7]]) }],
          [{ tex: matTex([[1, 2], [3, 1]]) }],
        ],
        answer: 1,
        explains: [
          "가로줄과 세로줄이 뒤바뀌었어요. 한 가로줄이 한 식이어야 해요.",
          "",
          "그것은 상수항이 모인 B 예요.",
          "아래 식의 y 계수는 1 이 아니라 -1 이에요. 부호를 놓쳤어요.",
        ],
        hint: "첫 가로줄에는 첫 식의 x 계수와 y 계수가 차례로 들어가요.",
      },
      {
        id: "q1s2",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요?",
        answer: detOf(Q1),
        hint: "1 곱하기 -1 에서 2 곱하기 3 을 빼요.",
        done: "행렬식이 0 이 아니니 두 직선은 한 점에서 만나요. 해가 하나 있다는 뜻이에요.",
      },
      {
        id: "q1s3",
        kind: "fill",
        ask: "행렬식이 1 이 아니니 분수를 앞에 뺍니다. 분수 뒤에 곱할 짝 행렬을 채워 보세요.",
        target: adj2(matOf(Q1)),
        hint: "대각선의 1 과 -1 은 자리를 바꾸고, 2 와 3 은 부호를 바꿔요.",
      },
      {
        id: "q1s4",
        kind: "fill",
        ask: "해를 구해 보세요. (위 칸이 x, 아래 칸이 y)",
        target: solCol(Q1),
        hint: "짝 행렬을 B 에 곱하면 -21 과 -14 가 나와요. 그것을 -7 로 나눠요.",
        done: "그래프에서 두 직선이 만나는 자리와 같은지 확인해 보세요.",
      },
    ],
    wrap: "행렬로 옮기고, 행렬식을 보고, 역행렬을 곱한다 — 이 세 걸음이 전부예요.",
  },
  {
    id: "q2",
    emoji: "🥈",
    title: "두 번째",
    sys: Q2,
    steps: [
      {
        id: "q2s1",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요?",
        answer: detOf(Q2),
        hint: "3 곱하기 1 에서 4 곱하기 1 을 빼요.",
        done: "행렬식이 -1 이니 역행렬의 성분이 모두 정수로 떨어져요.",
      },
      {
        id: "q2s2",
        kind: "fill",
        ask: "A 의 역행렬을 채워 보세요.",
        target: inv2(matOf(Q2)) as Mat,
        hint: "짝 행렬을 만든 다음 -1 로 나누면 모든 성분의 부호가 뒤집혀요.",
      },
      {
        id: "q2s3",
        kind: "fill",
        ask: "해를 구해 보세요.",
        target: solCol(Q2),
        hint: "위 칸은 -1 곱하기 10 에 4 곱하기 3 을 더한 값이에요.",
        done: "두 직선이 (2, 1) 에서 만나는 것을 그래프로 확인해 보세요.",
      },
    ],
    wrap: "행렬식이 -1 이면 짝 행렬의 부호만 모두 뒤집으면 역행렬이 돼요.",
  },
  {
    id: "q3",
    emoji: "🥉",
    title: "세 번째",
    sys: Q3,
    steps: [
      {
        id: "q3s1",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요?",
        answer: detOf(Q3),
        hint: "5 곱하기 1 에서 -2 곱하기 3 을 빼요. 빼는 수가 음수예요.",
        done: "음수를 빼면 더하는 셈이라 11 이 돼요.",
      },
      {
        id: "q3s2",
        kind: "fill",
        ask: "분수 뒤에 곱할 짝 행렬을 채워 보세요.",
        target: adj2(matOf(Q3)),
        hint: "5 와 1 은 자리를 바꾸고, -2 와 3 은 부호를 바꿔요.",
      },
      {
        id: "q3s3",
        kind: "fill",
        ask: "해를 구해 보세요. 음수가 나올 수 있어요.",
        target: solCol(Q3),
        hint: "짝 행렬을 B 에 곱하면 44 와 -11 이 나와요. 그것을 11 로 나눠요.",
        done: "해가 (4, -1) 이에요. 그래프에서 교점이 x축 아래에 있는 것을 확인해 보세요.",
      },
    ],
    wrap: "계수에 음수가 섞이면 부호를 두 번 세 번 살펴야 해요.",
  },
  {
    id: "q4",
    emoji: "🎖️",
    title: "네 번째",
    sys: Q4,
    steps: [
      {
        id: "q4s1",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요?",
        answer: detOf(Q4),
        hint: "2 곱하기 3 에서 5 곱하기 1 을 빼요.",
      },
      {
        id: "q4s2",
        kind: "fill",
        ask: "행렬식이 1 이니 짝 행렬이 곧 역행렬이에요. 채워 보세요.",
        target: inv2(matOf(Q4)) as Mat,
        hint: "2 와 3 은 자리를 바꾸고, 5 와 1 은 부호를 바꿔요.",
      },
      {
        id: "q4s3",
        kind: "fill",
        ask: "해를 구해 보세요.",
        target: solCol(Q4),
        hint: "위 칸은 3 곱하기 1 에서 5 를 뺀 값이에요.",
        done: "해가 (-2, 1) 이에요. 교점이 y축 왼쪽에 있지요.",
      },
    ],
    wrap: "행렬식이 1 이면 나누는 일 없이 곧바로 해가 나와요.",
  },
  {
    id: "q5",
    emoji: "❓",
    title: "다섯 번째",
    sys: Q5,
    steps: [
      {
        id: "q5s1",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요?",
        answer: detOf(Q5),
        hint: "2 곱하기 6 과 3 곱하기 4 를 각각 계산해 보세요.",
        done: "행렬식이 0 이에요. 지금까지와 다른 일이 벌어집니다.",
      },
      {
        id: "q5s2",
        kind: "choice",
        ask: "그러면 이 연립방정식은 어떻게 될까요?",
        options: [
          [{ pre: "역행렬이 없어 이 방법으로는 풀 수 없고, 해도 없다" }],
          [{ pre: "역행렬이 없지만 해는 하나 있다" }],
          [{ pre: "역행렬이 없어도 해가 무수히 많다" }],
          [{ pre: "짝 행렬만으로 풀면 된다" }],
        ],
        answer: 0,
        explains: [
          "",
          "행렬식이 0 이면 두 직선이 한 점에서 만나지 않아요.",
          "아래 식은 위 식의 두 배인데 상수항은 10 이 아니라 7 이라 겹치지 않아요.",
          "짝 행렬만 곱하면 해가 아니라 행렬식을 곱한 값이 나와요.",
        ],
        hint: "아래 식을 2로 나누면 2x + 3y = 3.5 예요. 위 식과 견주어 보세요.",
        done: "같은 좌변인데 우변이 5 와 3.5 로 달라요. 동시에 참이 될 수 없으니 해가 없습니다.",
      },
      {
        id: "q5s3",
        kind: "choice",
        ask: "만약 아래 식이 4x + 6y = 10 이었다면 어땠을까요?",
        options: [
          [{ pre: "여전히 해가 없다" }],
          [{ pre: "해가 하나 생긴다" }],
          [{ pre: "두 직선이 겹쳐 해가 무수히 많아진다" }],
          [{ pre: "행렬식이 0 이 아니게 된다" }],
        ],
        answer: 2,
        explains: [
          "상수항까지 두 배가 되면 두 식은 같은 직선이 돼요.",
          "행렬식이 그대로 0 이라 한 점에서 만날 수 없어요.",
          "",
          "x, y 의 계수를 바꾸지 않았으니 행렬식은 그대로 0 이에요.",
        ],
        hint: "위 식 전체에 2를 곱하면 무엇이 되는지 보세요.",
        done: "행렬식이 0 일 때는 상수항이 결과를 가릅니다. 비례하면 무수히 많고, 아니면 없어요.",
      },
    ],
    wrap: "행렬식이 0 이면 역행렬이 없어 이 방법을 쓸 수 없어요. 그때는 그래프로 두 직선의 관계를 보면 됩니다.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ③ 세 갈래 판정
// ══════════════════════════════════════════════════════════════
export const JUDGE_BOX: Box = { xMin: -8, xMax: 8, yMin: -8, yMax: 8, grid: 2 };

export type JudgeCard = { id: string; sys: Sys; why: string };
export const JUDGE_CARDS: JudgeCard[] = [
  { id: "j1", sys: { a: 2, b: 1, c: 1, d: -1, m: 5, n: 1 }, why: "행렬식이 -3 이라 한 점에서 만나요." },
  { id: "j2", sys: { a: 1, b: 2, c: 2, d: 4, m: 4, n: 8 }, why: "아래 식이 위 식의 꼭 2배라 같은 직선이에요." },
  { id: "j3", sys: { a: 3, b: -1, c: 6, d: -2, m: 2, n: 7 }, why: "계수는 2배인데 상수항은 4가 아니라 7 이라 나란해요." },
  { id: "j4", sys: { a: 1, b: 1, c: 1, d: -1, m: 5, n: 1 }, why: "행렬식이 -2 라 한 점에서 만나요." },
  { id: "j5", sys: { a: 4, b: 6, c: 2, d: 3, m: 10, n: 5 }, why: "위 식이 아래 식의 꼭 2배라 같은 직선이에요." },
  { id: "j6", sys: { a: 1, b: -3, c: -2, d: 6, m: 2, n: 1 }, why: "계수는 -2배인데 상수항은 -4가 아니라 1 이라 나란해요." },
  { id: "j7", sys: { a: 5, b: 2, c: 3, d: -1, m: 13, n: -1 }, why: "행렬식이 -11 이라 한 점에서 만나요." },
  { id: "j8", sys: { a: 2, b: -5, c: -4, d: 10, m: 3, n: -6 }, why: "아래 식이 위 식의 -2배라 같은 직선이에요." },
  { id: "j9", sys: { a: 1, b: 4, c: 1, d: 4, m: 6, n: 9 }, why: "좌변이 똑같은데 우변만 달라 함께 참이 될 수 없어요." },
  { id: "j10", sys: { a: 3, b: 2, c: 1, d: -2, m: 12, n: -4 }, why: "행렬식이 -8 이라 한 점에서 만나요." },
  { id: "j11", sys: { a: 6, b: -4, c: -3, d: 2, m: 2, n: -1 }, why: "아래 식이 위 식의 -0.5배라 같은 직선이에요." },
  { id: "j12", sys: { a: 1, b: 1, c: 1, d: 1, m: 4, n: 7 }, why: "좌변이 똑같은데 우변만 달라 함께 참이 될 수 없어요." },
];
export const JUDGE_OPTIONS: SysKind[] = ["one", "many", "none"];

export const JUDGE_STEPS: Step[] = [
  {
    id: "jg1",
    kind: "choice",
    ask: "해가 무수히 많은 경우와 해가 없는 경우는 무엇으로 갈렸나요?",
    options: [
      [{ pre: "x, y 의 계수가 비례하는지" }],
      [{ pre: "계수가 비례할 때, 상수항까지 같은 비로 비례하는지" }],
      [{ pre: "상수항이 양수인지 음수인지" }],
      [{ pre: "행렬식이 양수인지 음수인지" }],
    ],
    answer: 1,
    explains: [
      "계수가 비례하는 것은 두 경우 모두 그래요. 행렬식이 0 이라는 뜻일 뿐이에요.",
      "",
      "상수항의 부호와는 상관이 없어요.",
      "두 경우 모두 행렬식이 0 이라 부호를 따질 것이 없어요.",
    ],
    hint: "행렬식이 0 인 카드들만 모아 상수항까지 견주어 보세요.",
    done: "계수만 비례하면 나란하고, 상수항까지 같은 비로 비례하면 아예 같은 직선이 돼요.",
  },
  {
    id: "jg2",
    kind: "num",
    ask: "열두 장 가운데 해가 하나뿐인 카드는 몇 장이었을까요?",
    answer: JUDGE_CARDS.filter((c) => kindOf(c.sys) === "one").length,
    unit: "장",
    hint: "행렬식이 0 이 아닌 카드를 세어 보세요.",
    done: "세 갈래가 넷씩 고르게 들어 있었어요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 실생활
// ══════════════════════════════════════════════════════════════
export type Scene = {
  id: string;
  emoji: string;
  title: string;
  lead: string;
  facts: string[];
  names: [string, string];
  unit: string;
  sys: Sys;
  box: Box;
  /** 식을 간단히 한 경우 그 사실을 밝힌다 */
  note?: string;
  steps: Step[];
  wrap: string;
};

const S1: Sys = { a: 1, b: 1, c: 2, d: 3, m: 12, n: 29 };
const S2: Sys = { a: 1, b: 1, c: 5, d: 1, m: 30, n: 94 };
const S3: Sys = { a: 1, b: 1, c: 2, d: 1, m: 25, n: 40 };
const S4: Sys = { a: 1, b: 1, c: 9, d: 5, m: 8, n: 56 };
const S5: Sys = { a: 2, b: 3, c: 4, d: 6, m: 8, n: 15 };
const S6: Sys = { a: 3, b: 2, c: 6, d: 4, m: 4, n: 8 };

export const SCENES: Scene[] = [
  {
    id: "sc1",
    emoji: "🏀",
    title: "농구 경기 기록",
    lead: "성공한 슛은 모두 12개, 얻은 점수는 29점이에요. 2점슛과 3점슛을 각각 몇 개 넣었을까요?",
    facts: ["성공한 슛이 모두 12개", "얻은 점수가 모두 29점 (2점슛 2점, 3점슛 3점)"],
    names: ["2점슛", "3점슛"],
    unit: "개",
    sys: S1,
    box: { xMin: 0, xMax: 16, yMin: 0, yMax: 16, grid: 2 },
    steps: [
      {
        id: "sc1s1",
        kind: "choice",
        ask: "두 조건을 연립방정식으로 세우면 어느 것일까요?",
        options: [
          [{ tex: "\\begin{cases} x + y = 12 \\\\ 2x + 3y = 29 \\end{cases}" }],
          [{ tex: "\\begin{cases} x + y = 29 \\\\ 2x + 3y = 12 \\end{cases}" }],
          [{ tex: "\\begin{cases} 2x + 3y = 12 \\\\ x + y = 29 \\end{cases}" }],
          [{ tex: "\\begin{cases} 3x + 2y = 12 \\\\ x + y = 29 \\end{cases}" }],
        ],
        answer: 0,
        explains: [
          "",
          "개수와 점수가 뒤바뀌었어요. 슛의 개수가 12개예요.",
          "12 는 개수의 합이니 x + y 쪽에 놓여야 해요.",
          "개수와 점수가 뒤바뀌었고 계수도 서로 바뀌었어요.",
        ],
        hint: "첫 식은 개수의 합, 둘째 식은 점수의 합이에요.",
      },
      {
        id: "sc1s2",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요?",
        answer: detOf(S1),
        hint: "1 곱하기 3 에서 1 곱하기 2 를 빼요.",
        done: "행렬식이 1 이라 역행렬이 정수로 떨어져요.",
      },
      {
        id: "sc1s3",
        kind: "fill",
        ask: "2점슛과 3점슛의 개수를 구해 보세요.",
        target: solCol(S1),
        unit: "개",
        hint: "역행렬은 ((3,-1),(-2,1)) 이에요. 이것을 (12, 29) 에 곱해요.",
        done: "2점슛 7개, 3점슛 5개예요. 7 + 5 = 12, 14 + 15 = 29 로 맞지요.",
      },
    ],
    wrap: "개수와 점수 두 가지를 동시에 맞춰야 하는 문제라 식이 두 개 필요했어요.",
  },
  {
    id: "sc2",
    emoji: "🐷",
    title: "저금통 속 동전",
    lead: "동전은 모두 30개, 합하면 9,400원이에요. 500원짜리와 100원짜리가 몇 개씩 있을까요?",
    facts: ["동전이 모두 30개", "금액이 모두 9,400원"],
    names: ["500원짜리", "100원짜리"],
    unit: "개",
    sys: S2,
    box: { xMin: 0, xMax: 32, yMin: 0, yMax: 32, grid: 4 },
    note: "금액 식 500x + 100y = 9400 은 양변을 100 으로 나누어 5x + y = 94 로 간단히 했어요.",
    steps: [
      {
        id: "sc2s1",
        kind: "choice",
        ask: "금액 조건 500x + 100y = 9400 을 간단히 하면?",
        options: [
          [{ tex: "5x + y = 9400" }],
          [{ tex: "x + y = 94" }],
          [{ tex: "50x + 10y = 94" }],
          [{ tex: "5x + y = 94" }],
        ],
        answer: 3,
        explains: [
          "오른쪽도 함께 100 으로 나눠야 해요.",
          "왼쪽의 500 도 100 으로 나누면 5 가 돼요.",
          "같은 수로 나누지 않아 식이 달라졌어요.",
          "",
        ],
        hint: "양변을 모두 100 으로 나눠요.",
        done: "계수가 작아지면 행렬식과 역행렬도 다루기 쉬워져요.",
      },
      {
        id: "sc2s2",
        kind: "num",
        ask: "간단히 한 연립방정식의 행렬식은 얼마일까요?",
        answer: detOf(S2),
        hint: "1 곱하기 1 에서 1 곱하기 5 를 빼요.",
      },
      {
        id: "sc2s3",
        kind: "fill",
        ask: "동전의 개수를 구해 보세요.",
        target: solCol(S2),
        unit: "개",
        hint: "짝 행렬을 (30, 94) 에 곱하면 -64 와 -56 이 나와요. 그것을 -4 로 나눠요.",
        done: "500원짜리 16개, 100원짜리 14개예요. 8,000 + 1,400 = 9,400원이 맞지요.",
      },
    ],
    wrap: "단위가 큰 식은 먼저 나누어 간단히 하면 행렬식이 훨씬 다루기 쉬워져요.",
  },
  {
    id: "sc3",
    emoji: "🅿️",
    title: "주차장 세어 보기",
    lead: "주차장에 승용차와 오토바이가 모두 25대, 바퀴는 모두 80개예요. 각각 몇 대일까요?",
    facts: ["승용차와 오토바이가 모두 25대", "바퀴가 모두 80개 (승용차 4개, 오토바이 2개)"],
    names: ["승용차", "오토바이"],
    unit: "대",
    sys: S3,
    box: { xMin: 0, xMax: 28, yMin: 0, yMax: 28, grid: 4 },
    note: "바퀴 식 4x + 2y = 80 은 양변을 2로 나누어 2x + y = 40 으로 간단히 했어요.",
    steps: [
      {
        id: "sc3s1",
        kind: "num",
        ask: "간단히 한 연립방정식의 행렬식은 얼마일까요?",
        answer: detOf(S3),
        hint: "1 곱하기 1 에서 1 곱하기 2 를 빼요.",
        done: "행렬식이 -1 이라 역행렬이 정수예요.",
      },
      {
        id: "sc3s2",
        kind: "fill",
        ask: "A 의 역행렬을 채워 보세요.",
        target: inv2(matOf(S3)) as Mat,
        hint: "짝 행렬을 만든 뒤 -1 로 나누면 부호가 모두 뒤집혀요.",
      },
      {
        id: "sc3s3",
        kind: "fill",
        ask: "승용차와 오토바이의 수를 구해 보세요.",
        target: solCol(S3),
        unit: "대",
        hint: "위 칸은 -1 곱하기 25 에 40 을 더한 값이에요.",
        done: "승용차 15대, 오토바이 10대예요. 바퀴는 60 + 20 = 80개가 맞지요.",
      },
    ],
    wrap: "옛날부터 내려오는 바퀴 세기 문제도 행렬로 보면 두 줄짜리 계산이에요.",
  },
  {
    id: "sc4",
    emoji: "🚌",
    title: "체험학습 버스 배정",
    lead: "버스 8대에 280명이 꼭 맞게 탔어요. 45인승과 25인승이 각각 몇 대일까요?",
    facts: ["버스가 모두 8대", "정원이 모두 280명 (45인승과 25인승)"],
    names: ["45인승", "25인승"],
    unit: "대",
    sys: S4,
    box: { xMin: 0, xMax: 12, yMin: 0, yMax: 12, grid: 2 },
    note: "정원 식 45x + 25y = 280 은 양변을 5로 나누어 9x + 5y = 56 으로 간단히 했어요.",
    steps: [
      {
        id: "sc4s1",
        kind: "choice",
        ask: "정원 조건 45x + 25y = 280 을 간단히 하면?",
        options: [
          [{ tex: "9x + 5y = 280" }],
          [{ tex: "9x + 5y = 56" }],
          [{ tex: "45x + 25y = 56" }],
          [{ tex: "9x + 5y = 28" }],
        ],
        answer: 1,
        explains: [
          "오른쪽도 함께 5로 나눠야 해요.",
          "",
          "왼쪽만 그대로 두면 안 돼요. 양변을 함께 나눠야 해요.",
          "280 을 5로 나누면 28 이 아니라 56 이에요.",
        ],
        hint: "45, 25, 280 의 공통인수를 찾아 양변을 나눠요.",
      },
      {
        id: "sc4s2",
        kind: "num",
        ask: "간단히 한 연립방정식의 행렬식은 얼마일까요?",
        answer: detOf(S4),
        hint: "1 곱하기 5 에서 1 곱하기 9 를 빼요.",
      },
      {
        id: "sc4s3",
        kind: "fill",
        ask: "버스의 대수를 구해 보세요.",
        target: solCol(S4),
        unit: "대",
        hint: "짝 행렬을 (8, 56) 에 곱하면 -16 과 -16 이 나와요. 그것을 -4 로 나눠요.",
        done: "45인승 4대, 25인승 4대예요. 180 + 100 = 280명이 맞지요.",
      },
    ],
    wrap: "정원이 딱 맞아떨어지는 배정이 있는지도 행렬식이 알려 줘요.",
  },
  {
    id: "sc5",
    emoji: "🍪",
    title: "값을 알 수 없는 간식 세트",
    lead: "두 세트의 값만 보고 쿠키와 주스의 값을 알아낼 수 있을까요? 이번에는 좀 이상해요.",
    facts: ["A 세트 — 쿠키 2개와 주스 3개에 8,000원", "B 세트 — 쿠키 4개와 주스 6개에 15,000원"],
    names: ["쿠키 한 개", "주스 한 개"],
    unit: "천원",
    sys: S5,
    box: { xMin: 0, xMax: 6, yMin: 0, yMax: 6, grid: 1 },
    steps: [
      {
        id: "sc5s1",
        kind: "num",
        ask: "행렬식은 얼마일까요?",
        answer: detOf(S5),
        hint: "2 곱하기 6 과 3 곱하기 4 를 각각 계산해 보세요.",
        done: "행렬식이 0 이에요. 역행렬이 없으니 이 방법으로는 풀 수 없어요.",
      },
      {
        id: "sc5s2",
        kind: "choice",
        ask: "B 세트는 A 세트를 꼭 두 번 산 것과 같아요. 그런데 값은 어떤가요?",
        options: [
          [{ pre: "16,000원이라 두 조건이 잘 맞는다" }],
          [{ pre: "값은 상관없고 개수만 보면 된다" }],
          [{ pre: "16,000원이어야 하는데 15,000원이라 앞뒤가 맞지 않는다" }],
          [{ pre: "세트를 두 번 사면 값도 저절로 두 배가 된다" }],
        ],
        answer: 2,
        explains: [
          "B 세트의 값은 16,000원이 아니라 15,000원이에요.",
          "값이 달라지면 조건도 달라져요.",
          "",
          "묶음 할인 같은 것이 끼면 두 배가 아닐 수도 있어요. 여기가 바로 그런 경우예요.",
        ],
        hint: "A 세트의 값 8,000원을 두 배 해 보세요.",
      },
      {
        id: "sc5s3",
        kind: "choice",
        ask: "그러면 이 상황의 해는 어떻게 될까요?",
        options: [
          [{ pre: "해가 무수히 많다 (부정)" }],
          [{ pre: "해가 없다 (불능)" }],
          [{ pre: "해가 하나 있다" }],
          [{ pre: "해가 두 개 있다" }],
        ],
        answer: 1,
        explains: [
          "두 직선이 겹쳐야 무수히 많은데, 여기서는 나란하기만 해요.",
          "",
          "행렬식이 0 이라 한 점에서 만날 수 없어요.",
          "두 직선의 교점이 두 개가 되는 일은 없어요.",
        ],
        hint: "그래프에서 두 직선이 어떻게 놓였는지 보세요.",
        done: "쿠키와 주스의 값을 어떻게 정해도 두 조건을 함께 만족시킬 수 없어요. 값표가 잘못되었다는 뜻이지요.",
      },
    ],
    wrap: "해가 없다는 것은 계산을 잘못한 것이 아니라 '주어진 조건이 서로 어긋난다' 는 신호예요.",
  },
  {
    id: "sc6",
    emoji: "✏️",
    title: "알 수 없는 문구 세트",
    lead: "이번에는 두 세트의 값이 앞뒤가 잘 맞아요. 그런데도 값을 정할 수 없어요. 왜 그럴까요?",
    facts: ["A 세트 — 연필 3자루와 지우개 2개에 4,000원", "B 세트 — 연필 6자루와 지우개 4개에 8,000원"],
    names: ["연필 한 자루", "지우개 한 개"],
    unit: "천원",
    sys: S6,
    box: { xMin: 0, xMax: 3, yMin: 0, yMax: 3, grid: 1 },
    steps: [
      {
        id: "sc6s1",
        kind: "num",
        ask: "행렬식은 얼마일까요?",
        answer: detOf(S6),
        hint: "3 곱하기 4 와 2 곱하기 6 을 각각 계산해 보세요.",
      },
      {
        id: "sc6s2",
        kind: "choice",
        ask: "B 세트는 A 세트와 어떤 사이일까요?",
        options: [
          [{ pre: "개수만 두 배이고 값은 다르다" }],
          [{ pre: "값만 두 배이고 개수는 다르다" }],
          [{ pre: "아무 관계도 없다" }],
          [{ pre: "개수도 값도 모두 정확히 두 배다" }],
        ],
        answer: 3,
        explains: [
          "값도 4,000원의 두 배인 8,000원이에요.",
          "개수도 3과 2 의 두 배인 6과 4 예요.",
          "모든 수가 꼭 두 배라 분명한 관계가 있어요.",
          "",
        ],
        hint: "3과 6, 2와 4, 4,000과 8,000 을 차례로 견주어 보세요.",
      },
      {
        id: "sc6s3",
        kind: "choice",
        ask: "그러면 이 상황의 해는 어떻게 될까요?",
        options: [
          [{ pre: "해가 하나 있다" }],
          [{ pre: "해가 없다 (불능)" }],
          [{ pre: "해가 두 개 있다" }],
          [{ pre: "해가 무수히 많다 (부정)" }],
        ],
        answer: 3,
        explains: [
          "행렬식이 0 이라 한 점에서 만날 수 없어요.",
          "두 직선이 나란해야 해가 없는데, 여기서는 아예 겹쳐요.",
          "두 직선의 교점이 두 개가 되는 일은 없어요.",
          "",
        ],
        hint: "그래프에서 두 직선이 완전히 포개져 보이지요.",
        done: "B 세트는 A 세트를 두 번 산 것일 뿐이라 새로 알려 주는 것이 없어요. 조건이 사실 하나뿐인 셈이지요.",
      },
      {
        id: "sc6s4",
        kind: "choice",
        ask: "연필과 지우개의 값을 정하려면 무엇이 더 있어야 할까요?",
        options: [
          [{ pre: "A 세트를 한 번 더 사 본다" }],
          [{ pre: "B 세트의 값을 두 배로 올린다" }],
          [{ pre: "연필과 지우개의 개수 비가 다른 새 세트의 값을 안다" }],
          [{ pre: "더 있을 필요 없이 지금 정보로 정할 수 있다" }],
        ],
        answer: 2,
        explains: [
          "같은 세트를 또 사도 같은 식이 하나 더 생길 뿐이에요.",
          "값만 바꾸면 이번에는 앞뒤가 맞지 않아 해가 없어져요.",
          "",
          "지금은 조건이 사실 하나뿐이라 값을 하나로 정할 수 없어요.",
        ],
        hint: "지금 두 식은 같은 직선이에요. 다른 방향의 직선이 하나 필요해요.",
        done: "예를 들어 연필 1자루와 지우개 3개의 값을 알면 새 직선이 생겨 교점이 하나로 정해져요.",
      },
    ],
    wrap: "해가 무수히 많다는 것은 '조건이 모자란다' 는 신호예요. 새로운 정보를 하나 더 얻어야 해요.",
  },
];

export const REAL_NOTE =
  "이 활동에 나오는 값과 개수는 계산이 깔끔하게 떨어지도록 이 활동을 위해 정한 가상의 값이다.";
