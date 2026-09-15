// 함수로 그림 그리기 — 활동 데이터
//
//  [그래프 조각] 함수식 하나에 정의역을 좁혀 주면 곡선의 한 토막이 된다.
//        이 토막들을 여러 개 겹쳐 놓으면 그림이 된다.
//        이 활동에서는 여섯 가지 조각을 쓰고, 모두 기준점 (p, q) 와 계수 a 로 적는다.
//          · 무리함수  y = s√(a(x−p)) + q   — 꼭짓점이 (p, q). a 의 부호가 뻗는 좌우, s 가 위아래를 정한다.
//          · 유리함수  y = a/(x−p) + q      — 점근선이 x = p 와 y = q.
//          · 직선      y = a(x−p) + q       — (p, q) 를 지나고 기울기가 a.
//          · 포물선    y = a(x−p)² + q      — 꼭짓점이 (p, q).
//          · 원        중심 (p, q), 반지름 |a|
//          · 점        (p, q)
//
//  [y축 대칭 짝] 식의 x 자리에 −x 를 넣으면 y축에 대하여 대칭인 그래프가 된다.
//        여섯 조각 모두 p → −p 로 바뀌고 정의역 [x1, x2] 는 [−x2, −x1] 로 뒤집힌다.
//        무리함수·유리함수·직선은 a 의 부호도 함께 바뀌고(a → −a),
//        포물선·원·점은 a 가 그대로다. 짝을 한 번에 만들면 좌우 대칭인 그림을 빠르게 그릴 수 있다.
//
//  [토끼] 귀 하나는 두 곡선이 귀 끝에서 만나 밑동으로 갈수록 벌어지는 초승달 모양이다.
//        오른쪽 귀의 바깥 테두리는 무리함수 y = √(9(x−1)) (1 ≤ x ≤ 5) 로,
//        밑동 (1, 0) 에서 출발해 오른쪽 위로 올라 귀 끝 (5, 6) 에 닿는다.
//        안쪽 테두리는 유리함수 y = −6/(x−6) (2 ≤ x ≤ 5) 로, 밑동 (2, 1.5) 에서 같은 귀 끝 (5, 6) 에 닿는다.
//        점근선 x = 6 이 정의역 밖이라 귀 안에서 끊기지 않는다.
//        두 곡선 사이가 x = 2 에서 1.5, x = 3 에서 2.24, x = 4.9 에서 0.47 로 좁아지며 끝에서 만나 뾰족해진다.
//        길이가 6 쯤이고 폭이 2 쯤이라 길쭉한 귀가 되고, 밑동이 오른쪽으로 기울어 바깥으로 벌어진다.
//        왼쪽 귀는 두 곡선의 x 자리에 −x 를 넣어 얻는다.
//        얼굴은 중심 (0, −3), 반지름 5 인 원이고 두 밑동 (1, 0) 과 (2, 1.5) 를 품어 귀가 머리에 꽂힌다.
//
//  [나뭇잎] 위 테두리 y = √(2(x−1)) + 1 과 아래 테두리 y = −10/(x−11) 은
//        두 점 (1, 1) 과 (9, 5) 에서 만나 잎 모양을 이룬다.
//        실제로 x = 1 이면 위는 1, 아래는 −10/(−10) = 1 이고,
//        x = 9 이면 위는 √16 + 1 = 5, 아래는 −10/(−2) = 5 다.
//        점근선 x = 11 이 정의역 밖이라 아래 테두리가 끊기지 않는다.
//        두 꼭짓점을 잇는 직선 y = 0.5(x−1) + 1 이 잎맥이 되고,
//        (1, 1) 에서 왼쪽 아래로 뻗는 직선 y = 1.5(x−1) + 1 (−1 ≤ x ≤ 1) 이 잎자루가 된다.

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

// ══════════════════════════════════════════════════════════════
// 좌표평면과 조각
// ══════════════════════════════════════════════════════════════

export type View = { xMin: number; xMax: number; yMin: number; yMax: number };
export type Pt = { x: number; y: number };

export const VIEW: View = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
export const PLANE = { w: 360, h: 360, pad: 18 };

export function sx(v: View, x: number): number {
  return PLANE.pad + ((x - v.xMin) / (v.xMax - v.xMin)) * (PLANE.w - 2 * PLANE.pad);
}
export function sy(v: View, y: number): number {
  return PLANE.pad + ((v.yMax - y) / (v.yMax - v.yMin)) * (PLANE.h - 2 * PLANE.pad);
}

export type Kind = "sqrt" | "rat" | "line" | "para" | "circle" | "dot";

export const KINDS: { id: Kind; name: string; tex: string }[] = [
  { id: "sqrt", name: "무리함수", tex: "y=s\\sqrt{a(x-p)}+q" },
  { id: "rat", name: "유리함수", tex: "y=\\dfrac{a}{x-p}+q" },
  { id: "line", name: "직선", tex: "y=a(x-p)+q" },
  { id: "para", name: "포물선", tex: "y=a(x-p)^2+q" },
  { id: "circle", name: "원", tex: "(x-p)^2+(y-q)^2=a^2" },
  { id: "dot", name: "점", tex: "(p,\\ q)" },
];

export type Art = {
  kind: Kind;
  a: number;
  p: number;
  q: number;
  s: 1 | -1;
  x1: number;
  x2: number;
  color: string;
};

export const COLORS = ["#f472b6", "#38bdf8", "#a3e635", "#fbbf24", "#c084fc", "#22d3ee", "#fb7185", "#e2e8f0"];

/** 슬라이더 눈금 */
export const A_VALS = Array.from({ length: 41 }, (_, i) => (i - 20) * 0.5);
export const PQ = { min: -12, max: 12, step: 0.5 };
export const XR = { min: -10, max: 10, step: 0.5 };

function inside(v: View, pt: Pt): boolean {
  return pt.x >= v.xMin - 1e-9 && pt.x <= v.xMax + 1e-9 && pt.y >= v.yMin - 1e-9 && pt.y <= v.yMax + 1e-9;
}

/**
 * 매개변수 t 로 그린 곡선을 창 안에서만 잘라 여러 도막으로 뽑는다.
 * 창을 드나드는 자리는 t 에 대한 이분법으로 테두리까지 좁힌다.
 */
export function clipParam(F: (t: number) => Pt, t0: number, t1: number, v: View, n: number): Pt[][] {
  if (!(t1 > t0) || !isFinite(t0) || !isFinite(t1)) return [];
  let node: { t: number; pt: Pt }[] = [];
  for (let i = 0; i <= n; i++) {
    const tt = t0 + ((t1 - t0) * i) / n;
    node.push({ t: tt, pt: F(tt) });
  }
  // 적응 세분 — 창에 걸치는 구간에서 이웃한 표본이 멀면 가운데를 끼워 넣는다.
  // 가파른 포물선처럼 한 걸음에 화면을 가로지르는 곡선이 각져 보이지 않게 하기 위해서다.
  const tol = (v.xMax - v.xMin) / 90;
  const hits = (A: Pt, B: Pt) =>
    Math.min(A.x, B.x) <= v.xMax && Math.max(A.x, B.x) >= v.xMin && Math.min(A.y, B.y) <= v.yMax && Math.max(A.y, B.y) >= v.yMin;
  for (let pass = 0; pass < 7 && node.length < 4000; pass++) {
    let cut = false;
    const next: { t: number; pt: Pt }[] = [node[0]];
    for (let i = 1; i < node.length; i++) {
      const A = node[i - 1];
      const B = node[i];
      if (hits(A.pt, B.pt) && Math.hypot(A.pt.x - B.pt.x, A.pt.y - B.pt.y) > tol) {
        const m = (A.t + B.t) / 2;
        next.push({ t: m, pt: F(m) });
        cut = true;
      }
      next.push(B);
    }
    node = next;
    if (!cut) break;
  }
  const ts: number[] = node.map((d) => d.t);
  const edge = (tIn: number, tOut: number): Pt => {
    let a = tIn;
    let b = tOut;
    for (let k = 0; k < 40; k++) {
      const m = (a + b) / 2;
      if (inside(v, F(m))) a = m;
      else b = m;
    }
    return F(a);
  };
  const segs: Pt[][] = [];
  let cur: Pt[] = [];
  for (let i = 0; i < ts.length; i++) {
    const pt = F(ts[i]);
    if (inside(v, pt)) {
      if (cur.length === 0 && i > 0) cur.push(edge(ts[i], ts[i - 1]));
      cur.push(pt);
    } else if (cur.length) {
      cur.push(edge(ts[i - 1], ts[i]));
      segs.push(cur);
      cur = [];
    }
  }
  if (cur.length > 1) segs.push(cur);
  return segs.filter((sg) => sg.length > 1);
}

/** 유리함수의 한 가지 — x = p + side/w (w > 0) 로 두면 y = (side·a)w + q 라 w 를 고르게 훑으면 y 도 고르다. */
function ratBranch(a: number, p: number, q: number, x1: number, x2: number, side: 1 | -1, v: View): Pt[][] {
  const c = side * a;
  if (c === 0) return [];
  let wLo: number;
  let wHi: number;
  if (side === 1) {
    if (!(x2 > p)) return [];
    wLo = 1 / (x2 - p);
    wHi = x1 > p ? 1 / (x1 - p) : Infinity;
  } else {
    if (!(x1 < p)) return [];
    wLo = 1 / (p - x1);
    wHi = x2 < p ? 1 / (p - x2) : Infinity;
  }
  const yEdge = c > 0 ? v.yMax : v.yMin;
  const wEdge = (yEdge - q) / c;
  if (!(wEdge > 0)) return [];
  wHi = Math.min(wHi, wEdge * 1.03);
  if (!(wHi > wLo)) return [];
  return clipParam((w) => ({ x: p + side / w, y: c * w + q }), wLo, wHi, v, 120);
}

/** 조각 하나를 창 안의 선 도막들로 */
export function artPolys(pc: Art, v: View = VIEW): Pt[][] {
  const { kind, a, p, q, s, x1, x2 } = pc;
  const lo = Math.min(x1, x2);
  const hi = Math.max(x1, x2);
  if (kind === "dot") return [];
  if (kind === "circle") {
    const r = Math.abs(a);
    if (r <= 0) return [];
    return clipParam((t) => ({ x: p + r * Math.cos(t), y: q + r * Math.sin(t) }), 0, 2 * Math.PI, v, 120);
  }
  if (kind === "line") return clipParam((x) => ({ x, y: a * (x - p) + q }), lo, hi, v, 12);
  if (kind === "para") return clipParam((x) => ({ x, y: a * (x - p) * (x - p) + q }), lo, hi, v, 120);
  if (kind === "rat") {
    return [...ratBranch(a, p, q, lo, hi, -1, v), ...ratBranch(a, p, q, lo, hi, 1, v)];
  }
  // sqrt — v = √(a(x−p)) ≥ 0 로 두면 y = s·v + q 가 v 에 대해 일차라 꼭짓점 가까이에서 촘촘해진다
  if (a === 0) return [];
  let v1: number;
  let v2: number;
  if (a > 0) {
    if (!(hi > p)) return [];
    v1 = Math.sqrt(a * Math.max(0, lo - p));
    v2 = Math.sqrt(a * (hi - p));
  } else {
    if (!(lo < p)) return [];
    v1 = Math.sqrt(-a * Math.max(0, p - hi));
    v2 = Math.sqrt(-a * (p - lo));
  }
  if (!(v2 > v1)) return [];
  return clipParam((t) => ({ x: p + (t * t) / a, y: s * t + q }), v1, v2, v, 120);
}

/** x 자리에 −x 를 넣은 짝 — y축에 대하여 대칭인 조각 */
export function mirrorArt(pc: Art): Art {
  const keepA = pc.kind === "para" || pc.kind === "circle" || pc.kind === "dot";
  return {
    ...pc,
    a: keepA ? pc.a : -pc.a,
    p: -pc.p,
    x1: -pc.x2,
    x2: -pc.x1,
  };
}

/** 조각의 식을 KaTeX 로 — p = 0 이면 괄호를 벗기고, 계수 1 은 적지 않는다 */
export function artTex(pc: Art): string {
  const inner = pc.p === 0 ? "x" : pc.p > 0 ? `(x-${pc.p})` : `(x+${-pc.p})`;
  const den = pc.p === 0 ? "x" : pc.p > 0 ? `x-${pc.p}` : `x+${-pc.p}`;
  const tail = pc.q === 0 ? "" : pc.q > 0 ? `+${pc.q}` : `-${-pc.q}`;
  const coef = pc.a === 1 ? "" : pc.a === -1 ? "-" : String(pc.a);
  switch (pc.kind) {
    case "sqrt":
      return `y=${pc.s === -1 ? "-" : ""}\\sqrt{${coef}${inner}}${tail}`;
    case "rat":
      return `y=\\dfrac{${pc.a}}{${den}}${tail}`;
    case "line":
      return `y=${coef}${inner}${tail}`;
    case "para":
      return `y=${coef}${inner}^2${tail}`;
    case "circle": {
      const cy = pc.q === 0 ? "y" : pc.q > 0 ? `(y-${pc.q})` : `(y+${-pc.q})`;
      return `${inner}^2+${cy}^2=${Math.abs(pc.a)}^2`;
    }
    default:
      return `(${pc.p},\\ ${pc.q})`;
  }
}

/** 정의역을 함께 적은 식 */
export function artTexFull(pc: Art): string {
  if (pc.kind === "circle" || pc.kind === "dot") return artTex(pc);
  const lo = Math.min(pc.x1, pc.x2);
  const hi = Math.max(pc.x1, pc.x2);
  return `${artTex(pc)}\\quad (${lo}\\leq x\\leq ${hi})`;
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 조각 익히기
// ══════════════════════════════════════════════════════════════

export const TRY_INIT: Art = { kind: "sqrt", a: 2, p: -2, q: -1, s: 1, x1: -2, x2: 6, color: COLORS[1] };

export const TRY_GOALS = [
  "정의역을 좁혀 곡선을 한 토막으로 잘라 보기",
  "y축 대칭 짝을 켜서 좌우가 마주 보게 하기",
  "종류를 바꿔 네 가지 조각을 모두 그려 보기",
];

export type Quiz = {
  id: string;
  prompt: string;
  choices: Piece[][];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const TRY_QUIZ: Quiz[] = [
  {
    id: "t1",
    prompt: "y = √x 의 그래프에서 1 ≤ x ≤ 4 부분만 그리면 토막의 두 끝점은?",
    choices: [
      [{ tex: "(1,\\ 1)" }, { pre: " 과 ", tex: "(4,\\ 2)" }],
      [{ tex: "(1,\\ 1)" }, { pre: " 과 ", tex: "(4,\\ 4)" }],
      [{ tex: "(0,\\ 0)" }, { pre: " 과 ", tex: "(4,\\ 2)" }],
      [{ tex: "(1,\\ 0)" }, { pre: " 과 ", tex: "(2,\\ 4)" }],
    ],
    answer: 0,
    choiceWhy: [
      "",
      "√4 는 4 가 아니라 2 예요.",
      "정의역이 1 부터이므로 원점은 토막에 들어가지 않아요.",
      "x 와 y 가 뒤바뀌었어요.",
    ],
    why: "x = 1 에서 y = 1, x = 4 에서 y = 2 이므로 토막은 (1, 1) 에서 (4, 2) 까지예요. 정의역을 좁히면 곡선의 한 도막만 남습니다.",
  },
  {
    id: "t2",
    prompt: "어떤 그래프를 y축에 대하여 대칭인 짝으로 만들려면 식을 어떻게 바꿀까요?",
    choices: [
      [{ pre: "y 자리에 " }, { tex: "-y" }, { pre: " 를 넣는다" }],
      [{ pre: "x 자리에 " }, { tex: "-x" }, { pre: " 를 넣는다" }],
      [{ pre: "x 와 y 를 맞바꾼다" }],
      [{ pre: "식 전체에 " }, { tex: "-1" }, { pre: " 을 곱한다" }],
    ],
    answer: 1,
    choiceWhy: [
      "이것은 x축에 대하여 대칭이동하는 방법이에요.",
      "",
      "이것은 직선 y = x 에 대하여 대칭이동하는 방법입니다.",
      "이것도 x축 대칭이동이 돼요.",
    ],
    why: "x 자리에 −x 를 넣으면 오른쪽에 있던 점이 왼쪽 같은 거리로 옮겨가요. 정의역도 [x₁, x₂] 에서 [−x₂, −x₁] 로 뒤집힙니다.",
  },
  {
    id: "t3",
    prompt: "y = √(−2(x−3)) + 1 을 y축에 대하여 대칭이동한 식은?",
    choices: [
      [{ tex: "y=\\sqrt{-2(x+3)}+1" }],
      [{ tex: "y=-\\sqrt{-2(x-3)}+1" }],
      [{ tex: "y=\\sqrt{2(x+3)}+1" }],
      [{ tex: "y=\\sqrt{2(x-3)}+1" }],
    ],
    answer: 2,
    choiceWhy: [
      "x 자리에 −x 를 넣으면 −2(−x−3) = 2(x+3) 이 되어 근호 안의 부호도 바뀝니다.",
      "근호 앞에 음의 부호를 붙이는 것은 x축 대칭이에요.",
      "",
      "p 의 부호도 함께 바뀌어야 해요.",
    ],
    why: "x 자리에 −x 를 넣으면 √(−2(−x−3)) + 1 = √(2(x+3)) + 1 이에요. 근호 안의 계수와 p 의 부호가 함께 바뀝니다.",
  },
  {
    id: "t4",
    prompt: "정의역을 3 ≤ x ≤ 7 로 제한한 y = 2/(x−5) 의 그래프는 어떤 모양일까요?",
    choices: [
      [{ pre: "이어진 한 도막" }],
      [{ pre: "x = 5 에서 끊어진 두 도막" }],
      [{ pre: "아무것도 그려지지 않는다" }],
      [{ pre: "직선 한 도막" }],
    ],
    answer: 1,
    choiceWhy: [
      "x = 5 는 분모를 0 으로 만들어 넣을 수 없으므로 그 자리에서 끊어져요.",
      "",
      "x = 5 만 빼면 나머지 자리에서는 값이 잘 나옵니다.",
      "유리함수의 그래프는 직선이 아니에요.",
    ],
    why: "점근선 x = 5 가 정의역 한가운데에 있어 그 자리에서 끊어져요. 왼쪽 도막은 아래로, 오른쪽 도막은 위로 뻗습니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ②③ 그림 만들기 — 단계마다 식을 골라 조각을 얹는다
// ══════════════════════════════════════════════════════════════

export type Step = {
  id: string;
  label: string;
  hint: string;
  choices: string[];
  answer: number;
  choiceWhy: string[];
  why: string;
  add: Art[];
};

export type Build = {
  id: string;
  icon: string;
  title: string;
  intro: string;
  steps: Step[];
  done: string;
};

/** 귀의 바깥 테두리(무리함수)와 안쪽 테두리(유리함수) — 귀 끝 (5, 6) 에서 만난다 */
const RABBIT_EAR_OUT: Art = { kind: "sqrt", a: 9, p: 1, q: 0, s: 1, x1: 1, x2: 5, color: COLORS[0] };
const RABBIT_EAR_IN: Art = { kind: "rat", a: -6, p: 6, q: 0, s: 1, x1: 2, x2: 5, color: COLORS[0] };

export const BUILDS: Build[] = [
  {
    id: "rabbit",
    icon: "🐰",
    title: "토끼",
    intro: "귀 하나는 두 곡선이 귀 끝에서 만나 밑동으로 벌어지는 초승달이에요.",
    steps: [
      {
        id: "b1",
        label: "오른쪽 귀 · 바깥 테두리",
        hint: "밑동 (1, 0) 에서 출발해 오른쪽 위로 완만하게 올라 귀 끝 (5, 6) 에 닿는 무리함수예요. 정의역은 1 ≤ x ≤ 5 입니다.",
        choices: [
          "y=\\sqrt{9(x+1)}",
          "y=-\\sqrt{9(x-1)}",
          "y=\\sqrt{9(x-1)}",
          "y=\\sqrt{-9(x-1)}",
        ],
        answer: 2,
        choiceWhy: [
          "꼭짓점이 (−1, 0) 이라 왼쪽 귀 자리로 갑니다.",
          "근호 앞의 음의 부호 때문에 아래로 처져 귀가 거꾸로 서요.",
          "",
          "근호 안의 계수가 음수이면 왼쪽으로 뻗어 얼굴을 가로지릅니다.",
        ],
        why: "꼭짓점이 (1, 0) 이고 오른쪽 위로 뻗어요. x = 5 를 넣으면 √36 = 6 이라 귀 끝 (5, 6) 에 정확히 닿습니다.",
        add: [RABBIT_EAR_OUT],
      },
      {
        id: "b2",
        label: "오른쪽 귀 · 안쪽 테두리",
        hint: "밑동 (2, 1.5) 에서 출발해 같은 귀 끝 (5, 6) 에서 바깥 테두리와 만나는 유리함수예요. 점근선이 귀 밖에 있어야 끊기지 않습니다.",
        choices: [
          "y=\\dfrac{6}{x-6}",
          "y=\\dfrac{-6}{x+6}",
          "y=\\dfrac{-6}{x-5}",
          "y=\\dfrac{-6}{x-6}",
        ],
        answer: 3,
        choiceWhy: [
          "x = 5 를 넣으면 −6 이 되어 얼굴 아래로 내려갑니다.",
          "점근선이 x = −6 이라 왼쪽 귀 자리로 갑니다.",
          "점근선 x = 5 가 바로 귀 끝이라 그 자리에서 값이 한없이 커져 끊겨요.",
          "",
        ],
        why: "x = 5 를 넣으면 −6/(−1) = 6 이라 귀 끝에서 바깥 테두리와 만나고, x = 2 에서는 1.5 예요. 점근선 x = 6 이 정의역 밖이라 귀 안에서 끊기지 않습니다.",
        add: [RABBIT_EAR_IN],
      },
      {
        id: "b3",
        label: "왼쪽 귀 · 대칭 짝",
        hint: "두 곡선의 x 자리에 −x 를 넣으면 왼쪽 귀가 됩니다. 바깥 테두리는 어떤 식이 될까요?",
        choices: [
          "y=\\sqrt{-9(x+1)}",
          "y=\\sqrt{9(x+1)}",
          "y=\\sqrt{-9(x-1)}",
          "y=-\\sqrt{-9(x+1)}",
        ],
        answer: 0,
        choiceWhy: [
          "",
          "근호 안의 계수도 9 에서 −9 로 함께 바뀌어야 왼쪽으로 뻗어요.",
          "p 의 부호도 1 에서 −1 로 바뀌어야 합니다.",
          "근호 앞에 음의 부호를 붙이면 아래로 처져요.",
        ],
        why: "x 자리에 −x 를 넣으면 9(−x−1) = −9(x+1) 이 되어 꼭짓점이 (−1, 0) 으로 옮겨가고 왼쪽으로 뻗어요. 정의역도 [1, 5] 에서 [−5, −1] 로 뒤집힙니다. 안쪽 테두리도 같은 방법으로 y = 6/(x+6) 이 됩니다.",
        add: [mirrorArt(RABBIT_EAR_OUT), mirrorArt(RABBIT_EAR_IN)],
      },
      {
        id: "b4",
        label: "얼굴 · 원",
        hint: "중심이 (0, −3) 이고 반지름이 5 인 원이에요. 두 귀의 밑동을 품어야 귀가 머리에 꽂힙니다.",
        choices: [
          "x^2+(y-3)^2=5^2",
          "x^2+(y+3)^2=5^2",
          "(x-3)^2+y^2=5^2",
          "x^2+(y+3)^2=3^2",
        ],
        answer: 1,
        choiceWhy: [
          "중심의 y 좌표가 −3 이므로 (y+3)² 가 돼요.",
          "",
          "중심이 (3, 0) 인 원이라 오른쪽으로 치우칩니다.",
          "반지름이 3 이면 얼굴이 작아 귀 밑동이 밖으로 나와요.",
          ],
        why: "중심이 (0, −3) 이므로 x² + (y+3)² = 5² 이에요. 귀 밑동 (1, 0) 과 (2, 1.5) 가 이 원 안에 들어와 귀가 머리에 꽂힌 모양이 됩니다.",
        add: [{ kind: "circle", a: 5, p: 0, q: -3, s: 1, x1: -10, x2: 10, color: COLORS[7] }],
      },
      {
        id: "b5",
        label: "눈 · 코 · 입",
        hint: "눈은 (−2, −2) 와 (2, −2), 코는 (0, −3.5) 에 찍어요. 입은 아래로 처진 웃는 모양이어야 합니다.",
        choices: [
          "y=-0.5x^2-5.5",
          "y=0.5x^2+5.5",
          "y=0.5x^2-5.5",
          "y=0.5(x-5.5)^2",
        ],
        answer: 2,
        choiceWhy: [
          "위로 볼록한 포물선이라 입이 찡그린 모양이 돼요.",
          "꼭짓점이 (0, 5.5) 로 올라가 귀 사이에 그려집니다.",
          "",
          "꼭짓점이 (5.5, 0) 이라 얼굴 밖 오른쪽으로 치우쳐요.",
        ],
        why: "아래로 볼록한 포물선의 꼭짓점이 (0, −5.5) 라 웃는 입이 돼요. 정의역을 −2 ≤ x ≤ 2 로 좁혀 입 크기를 맞춥니다.",
        add: [
          { kind: "dot", a: 1, p: -2, q: -2, s: 1, x1: -10, x2: 10, color: COLORS[7] },
          { kind: "dot", a: 1, p: 2, q: -2, s: 1, x1: -10, x2: 10, color: COLORS[7] },
          { kind: "dot", a: 1, p: 0, q: -3.5, s: 1, x1: -10, x2: 10, color: COLORS[0] },
          { kind: "para", a: 0.5, p: 0, q: -5.5, s: 1, x1: -2, x2: 2, color: COLORS[0] },
        ],
      },
    ],
    done: "무리함수와 유리함수가 귀 끝에서 만나 초승달 모양 귀가 되었어요. 두 곡선이 한 점에서 만나도록 계수를 고르는 것이 열쇠였습니다.",
  },
  {
    id: "leaf",
    icon: "🍃",
    title: "나뭇잎",
    intro: "무리함수와 유리함수가 두 점에서 만나 잎 모양을 이뤄요.",
    steps: [
      {
        id: "l1",
        label: "잎의 위 테두리",
        hint: "꼭짓점이 (1, 1) 이고 오른쪽 위로 완만하게 오르는 곡선이에요. x = 9 에서 y = 5 를 지납니다.",
        choices: [
          "y=\\sqrt{2(x-1)}+1",
          "y=\\sqrt{2(x+1)}+1",
          "y=-\\sqrt{2(x-1)}+1",
          "y=\\sqrt{2(x-1)}-1",
        ],
        answer: 0,
        choiceWhy: [
          "",
          "꼭짓점이 (−1, 1) 로 옮겨가 잎이 왼쪽으로 밀립니다.",
          "근호 앞의 음의 부호 때문에 아래로 처져요.",
          "꼭짓점이 (1, −1) 로 내려가 아래 테두리와 어긋납니다.",
        ],
        why: "x = 9 를 넣으면 √16 + 1 = 5 라 (9, 5) 를 지나요. 꼭짓점 (1, 1) 에서 오른쪽 위로 완만하게 오르는 잎의 등입니다.",
        add: [{ kind: "sqrt", a: 2, p: 1, q: 1, s: 1, x1: 1, x2: 9, color: COLORS[2] }],
      },
      {
        id: "l2",
        label: "잎의 아래 테두리",
        hint: "위 테두리와 똑같이 (1, 1) 과 (9, 5) 를 지나야 잎이 닫혀요. 점근선이 정의역 밖에 있어야 끊기지 않습니다.",
        choices: [
          "y=\\dfrac{-10}{x-1}",
          "y=\\dfrac{10}{x-11}",
          "y=\\dfrac{-10}{x-11}",
          "y=\\dfrac{-10}{x+11}",
        ],
        answer: 2,
        choiceWhy: [
          "점근선 x = 1 이 정의역의 왼쪽 끝이라 값이 한없이 커져요.",
          "x = 1 을 넣으면 −1 이 되어 (1, 1) 을 지나지 않습니다.",
          "",
          "x = 1 을 넣으면 −10/12 로 (1, 1) 을 지나지 않아요.",
        ],
        why: "x = 1 이면 −10/(−10) = 1, x = 9 이면 −10/(−2) = 5 라 두 점을 모두 지나요. 점근선 x = 11 이 정의역 밖이라 잎 안에서 끊기지 않습니다.",
        add: [{ kind: "rat", a: -10, p: 11, q: 0, s: 1, x1: 1, x2: 9, color: COLORS[2] }],
      },
      {
        id: "l3",
        label: "잎맥",
        hint: "잎의 두 끝 (1, 1) 과 (9, 5) 를 곧게 잇는 직선이에요.",
        choices: [
          "y=0.5(x-1)+1",
          "y=2(x-1)+1",
          "y=0.5(x-1)-1",
          "y=0.5(x+1)+1",
        ],
        answer: 0,
        choiceWhy: [
          "",
          "기울기가 2 이면 x = 9 에서 y = 17 이 되어 잎 밖으로 나가요.",
          "(1, −1) 을 지나 잎 아래로 내려갑니다.",
          "(−1, 1) 을 지나 왼쪽으로 밀려요.",
        ],
        why: "두 점 사이의 기울기가 (5−1)/(9−1) = 0.5 이고 (1, 1) 을 지나므로 y = 0.5(x−1) + 1 이에요.",
        add: [{ kind: "line", a: 0.5, p: 1, q: 1, s: 1, x1: 1, x2: 9, color: COLORS[3] }],
      },
      {
        id: "l4",
        label: "잎자루",
        hint: "잎이 시작하는 (1, 1) 에서 왼쪽 아래로 뻗는 직선이에요. 정의역은 −1 ≤ x ≤ 1 입니다.",
        choices: [
          "y=-1.5(x-1)+1",
          "y=1.5(x-1)+1",
          "y=1.5(x+1)+1",
          "y=1.5(x-1)-1",
        ],
        answer: 1,
        choiceWhy: [
          "기울기가 음수이면 왼쪽으로 갈수록 올라가 잎 위로 뻗어요.",
          "",
          "(−1, 1) 을 지나 잎과 이어지지 않습니다.",
          "(1, −1) 에서 시작해 잎과 떨어져요.",
        ],
        why: "(1, 1) 에서 출발해 왼쪽으로 갈수록 내려가야 하므로 기울기가 양수인 y = 1.5(x−1) + 1 이에요. x = −1 에서 y = −2 까지 내려갑니다.",
        add: [{ kind: "line", a: 1.5, p: 1, q: 1, s: 1, x1: -1, x2: 1, color: COLORS[3] }],
      },
    ],
    done: "무리함수와 유리함수가 두 점에서 만나 잎이 닫혔어요. 두 곡선이 같은 두 점을 지나도록 계수를 고르는 것이 열쇠였습니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 자유 아틀리에 — 미리 담아 둔 그림
// ══════════════════════════════════════════════════════════════

export const PRESETS: { id: string; icon: string; name: string; arts: Art[] }[] = [
  {
    id: "rabbit",
    icon: "🐰",
    name: "토끼",
    arts: BUILDS[0].steps.flatMap((s) => s.add),
  },
  {
    id: "leaf",
    icon: "🍃",
    name: "나뭇잎",
    arts: BUILDS[1].steps.flatMap((s) => s.add),
  },
  {
    id: "hill",
    icon: "⛰️",
    name: "산과 해",
    arts: [
      { kind: "line", a: 0, p: 0, q: -3, s: 1, x1: -10, x2: 10, color: COLORS[2] },
      { kind: "para", a: -0.5, p: -4, q: 5, s: 1, x1: -8, x2: 0, color: COLORS[7] },
      { kind: "para", a: -0.5, p: 3, q: 3, s: 1, x1: -0.5, x2: 6.5, color: COLORS[4] },
      { kind: "circle", a: 2, p: 6, q: 7, s: 1, x1: -10, x2: 10, color: COLORS[3] },
      { kind: "sqrt", a: -3, p: -1, q: -3, s: -1, x1: -7, x2: -1, color: COLORS[1] },
      { kind: "sqrt", a: 3, p: -1, q: -3, s: -1, x1: -1, x2: 5, color: COLORS[1] },
    ],
  },
];

export const ART_MAX = 12;

export const ART_GOALS = [
  "조각을 세 개 이상 얹어 보기",
  "y축 대칭 짝을 만들어 좌우가 마주 보게 하기",
  "네 가지 종류를 모두 한 번씩 써 보기",
];
