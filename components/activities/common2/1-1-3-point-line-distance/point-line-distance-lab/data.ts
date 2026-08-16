// 점과 직선 사이의 거리 — 활동 데이터
//
//  점 (x₁, y₁) 과 직선 ax + by + c = 0 사이의 거리
//        d = |ax₁ + by₁ + c| / √(a² + b²)
//
//  · 직선 위의 점 P 중 거리가 가장 짧은 곳은 A 에서 내린 수선의 발 H 다.
//    (AP² 를 t 에 대한 이차식으로 보면 최솟값이 바로 이 지점)
//  · 평행한 두 직선 ax+by+c₁=0, ax+by+c₂=0 사이의 거리는
//    한 직선 위의 어느 점을 골라도 같다 — 그 점에서 ax+by = −c₁ 이므로
//        |ax₀ + by₀ + c₂| = |c₂ − c₁|  ⇒  d = |c₁ − c₂| / √(a² + b²)

export type Pt = { x: number; y: number };

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** √n = k√r 로 분리(r 은 제곱인수가 없는 수). */
export function simpRad(n: number): { k: number; r: number } {
  let k = 1;
  let r = n;
  for (let f = 2; f * f <= r; f++) {
    while (r % (f * f) === 0) {
      r /= f * f;
      k *= f;
    }
  }
  return { k, r };
}

/** p / √q 를 유리화·약분해 LaTeX 로. 예: 7/√5 → 7√5/5, 10/√25 → 2, 5/√5 → √5 */
export function distTex(p: number, q: number): string {
  if (p === 0) return "0";
  const { k, r } = simpRad(q);
  if (r === 1) {
    const g = gcd(p, k) || 1;
    const num = p / g;
    const den = k / g;
    return den === 1 ? `${num}` : `\\frac{${num}}{${den}}`;
  }
  const den0 = k * r;
  const g = gcd(p, den0) || 1;
  const num = p / g;
  const den = den0 / g;
  const numTex = num === 1 ? `\\sqrt{${r}}` : `${num}\\sqrt{${r}}`;
  return den === 1 ? numTex : `\\frac{${numTex}}{${den}}`;
}

/** √q 자체를 LaTeX 로. 예: 25 → 5, 20 → 2√5 */
export function radTex(q: number): string {
  const { k, r } = simpRad(q);
  if (r === 1) return String(k);
  return k === 1 ? `\\sqrt{${r}}` : `${k}\\sqrt{${r}}`;
}

/** ax + by + c = 0 을 LaTeX 로. */
export function genTex(a: number, b: number, c: number): string {
  const term = (k: number, v: string, first: boolean) => {
    if (k === 0) return "";
    const neg = k < 0;
    const abs = Math.abs(k);
    const body = abs === 1 ? v : `${abs}${v}`;
    if (first) return neg ? `-${body}` : body;
    return neg ? ` - ${body}` : ` + ${body}`;
  };
  let s = "";
  let first = true;
  if (a !== 0) {
    s += term(a, "x", first);
    first = false;
  }
  if (b !== 0) {
    s += term(b, "y", first);
    first = false;
  }
  if (c !== 0 || first) {
    s += first ? String(c) : c < 0 ? ` - ${-c}` : ` + ${c}`;
  }
  return `${s} = 0`;
}

/** y = mx + n 을 LaTeX 로. */
export function stdTex(m: number, n: number): string {
  const mt = m === 0 ? "" : m === 1 ? "x" : m === -1 ? "-x" : `${m}x`;
  if (m === 0) return `y = ${n}`;
  const nt = n === 0 ? "" : n < 0 ? ` - ${-n}` : ` + ${n}`;
  return `y = ${mt}${nt}`;
}

/** 점 P 에서 직선 ax+by+c=0 에 내린 수선의 발. */
export function footOf(p: Pt, a: number, b: number, c: number): Pt {
  const k = (a * p.x + b * p.y + c) / (a * a + b * b);
  return { x: p.x - a * k, y: p.y - b * k };
}

export function distanceOf(p: Pt, a: number, b: number, c: number): number {
  return Math.abs(a * p.x + b * p.y + c) / Math.sqrt(a * a + b * b);
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 단계별 빈칸 문제 (정답은 node 로 검산)
// ══════════════════════════════════════════════════════════════
export type DistProblem = {
  id: string;
  title: string;
  form: "gen" | "std";
  point: Pt;
  pointName: string;
  /** 최종적으로 쓰는 일반형 계수 */
  a: number;
  b: number;
  c: number;
  /** 표준형 문제일 때 화면에 보여 줄 식 */
  m?: number;
  n?: number;
  /** 표준형 → 일반형 고르기(표준형 문제에만) */
  genChoices?: string[];
  genAnswer?: number;
  choices: string[];
  answer: number;
  hint: string;
  explain: string;
};

export const DIST_PROBLEMS: DistProblem[] = [
  {
    id: "d1",
    title: "일반형 직선",
    form: "gen",
    point: { x: 2, y: 3 },
    pointName: "A",
    a: 3,
    b: 4,
    c: -5,
    choices: ["\\frac{13}{5}", "\\frac{13}{25}", "\\frac{13}{\\sqrt{5}}", "\\frac{5}{13}"],
    answer: 0,
    hint: "a = 3, b = 4, c = −5 를 그대로 |ax₁ + by₁ + c| 에 넣어 보세요.",
    explain: "|3·2 + 4·3 − 5| = |13| = 13, √(3² + 4²) = √25 = 5 이므로 d = 13/5 입니다.",
  },
  {
    id: "d2",
    title: "표준형 직선",
    form: "std",
    point: { x: 1, y: -2 },
    pointName: "B",
    a: 2,
    b: -1,
    c: 3,
    m: 2,
    n: 3,
    genChoices: ["2x - y + 3 = 0", "2x + y + 3 = 0", "2x - y - 3 = 0", "x - 2y + 3 = 0"],
    genAnswer: 0,
    choices: ["\\frac{7\\sqrt{5}}{5}", "\\frac{7}{5}", "7\\sqrt{5}", "\\frac{\\sqrt{5}}{7}"],
    answer: 0,
    hint: "y = 2x + 3 의 y 를 왼쪽으로 넘기면 2x − y + 3 = 0 이 됩니다.",
    explain: "|2·1 − (−2) + 3| = 7, √(2² + (−1)²) = √5 이므로 d = 7/√5 = 7√5/5 입니다.",
  },
  {
    id: "d3",
    title: "원점과의 거리",
    form: "gen",
    point: { x: 0, y: 0 },
    pointName: "O",
    a: 3,
    b: 4,
    c: -10,
    choices: ["2", "\\frac{10}{25}", "\\frac{2\\sqrt{5}}{5}", "10"],
    answer: 0,
    hint: "원점은 x₁ = 0, y₁ = 0 이라 ax₁ + by₁ + c 가 c 만 남아요.",
    explain: "|3·0 + 4·0 − 10| = 10, √25 = 5 이므로 d = 10/5 = 2 입니다. 원점과의 거리는 |c|/√(a²+b²) 로 바로 구할 수 있어요.",
  },
  {
    id: "d4",
    title: "표준형 직선",
    form: "std",
    point: { x: 5, y: -1 },
    pointName: "C",
    a: 1,
    b: 1,
    c: -2,
    m: -1,
    n: 2,
    genChoices: ["x + y - 2 = 0", "x - y + 2 = 0", "x + y + 2 = 0", "-x + y - 2 = 0"],
    genAnswer: 0,
    choices: ["\\sqrt{2}", "2", "\\frac{\\sqrt{2}}{2}", "2\\sqrt{2}"],
    answer: 0,
    hint: "y = −x + 2 를 옮기면 x + y − 2 = 0 이에요. 계수 1은 생략되어 보이니 주의!",
    explain: "|1·5 + 1·(−1) − 2| = 2, √(1² + 1²) = √2 이므로 d = 2/√2 = √2 입니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 평행한 두 직선 사이의 거리
// ══════════════════════════════════════════════════════════════
export type ParPair = {
  id: string;
  label: string;
  form: "gen" | "std";
  a: number;
  b: number;
  c1: number;
  c2: number;
  /** 표준형으로 보여 줄 때 */
  m?: number;
  n1?: number;
  n2?: number;
  /** l₁ 위에서 y 가 정수가 되는 x 값들 */
  xChoices: number[];
  /** 표준형 → 정수 계수 일반형 고르기(표준형 문제에만) */
  genChoices?: string[];
  genAnswer?: number;
  choices: string[];
  answer: number;
  explain: string;
};

/** 탭③ 1단계 — 두 직선이 평행한 까닭 고르기(모든 문제 공통). */
export const PARALLEL_WHY = [
  "x, y의 계수가 각각 같고 상수항만 다르므로 평행하다",
  "x, y의 계수가 각각 달라서 평행하다",
  "상수항이 같아서 평행하다",
  "두 직선이 모두 원점을 지나므로 평행하다",
];
export const PARALLEL_WHY_ANSWER = 0;

export const PAR_PAIRS: ParPair[] = [
  {
    id: "p1",
    label: "교과서 문제",
    form: "gen",
    a: 2,
    b: 1,
    c1: 1,
    c2: -4,
    xChoices: [-3, -2, -1, 0, 1, 2, 3],
    choices: ["\\sqrt{5}", "5", "\\frac{5}{\\sqrt{5}}", "\\frac{\\sqrt{5}}{5}"],
    answer: 0,
    explain: "l₁ 위의 점에서 2x + y = −1 이므로 |2x₀ + y₀ − 4| = |−1 − 4| = 5. 따라서 d = 5/√5 = √5 입니다.",
  },
  {
    id: "p2",
    label: "계수가 큰 경우",
    form: "gen",
    a: 3,
    b: -4,
    c1: 5,
    c2: -15,
    xChoices: [-7, -3, 1, 5],
    choices: ["4", "\\frac{20}{\\sqrt{5}}", "20", "\\frac{4}{5}"],
    answer: 0,
    explain: "|c₁ − c₂| = |5 − (−15)| = 20, √(3² + (−4)²) = 5 이므로 d = 20/5 = 4 입니다.",
  },
  {
    id: "p3",
    label: "표준형으로 주어진 경우",
    form: "std",
    a: 1,
    b: 2,
    c1: -6,
    c2: 2,
    m: -0.5,
    n1: 3,
    n2: -1,
    xChoices: [-4, -2, 0, 2, 4, 6],
    genChoices: [
      "x + 2y - 6 = 0,\\ \\ x + 2y + 2 = 0",
      "x + 2y + 6 = 0,\\ \\ x + 2y - 2 = 0",
      "2x + y - 6 = 0,\\ \\ 2x + y + 2 = 0",
      "x - 2y - 6 = 0,\\ \\ x - 2y + 2 = 0",
    ],
    genAnswer: 0,
    choices: ["\\frac{8\\sqrt{5}}{5}", "\\frac{8}{5}", "8\\sqrt{5}", "4"],
    answer: 0,
    explain:
      "두 식을 정수 계수 일반형으로 고치면 x + 2y − 6 = 0, x + 2y + 2 = 0. |c₁ − c₂| = |−6 − 2| = 8, √(1² + 2²) = √5 이므로 d = 8/√5 = 8√5/5 입니다.",
  },
];

/** 표준형 y = mx + n 을 소수 없이 보여 주기 위한 문자열(−1/2 처럼). */
export function stdParTex(m: number, n: number): string {
  const mt =
    m === 1 ? "x" : m === -1 ? "-x" : Number.isInteger(m) ? `${m}x` : m === -0.5 ? "-\\frac{1}{2}x" : m === 0.5 ? "\\frac{1}{2}x" : `${m}x`;
  const nt = n === 0 ? "" : n < 0 ? ` - ${-n}` : ` + ${n}`;
  return `y = ${mt}${nt}`;
}
