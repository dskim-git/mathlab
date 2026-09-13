// 역함수 — 활동 데이터
//
//  [역함수] 함수 f : X → Y 가 일대일대응일 때, Y 의 각 원소 y 에 f(x) = y 인 X 의 원소 x 를
//        대응시키면 Y 를 정의역, X 를 공역으로 하는 함수가 된다.
//        이를 f 의 역함수라 하고  f⁻¹ : Y → X,  f⁻¹(y) = x  (단, f(x) = y) 로 쓴다.
//
//  [왜 일대일대응이어야 하는가] 화살표를 거꾸로 돌렸을 때 그것이 다시 「함수」가 되려면
//        ① Y 의 모든 원소가 빠짐없이 짝을 가져야 한다  → f 의 치역과 공역이 같아야 한다
//        ② Y 의 각 원소의 짝이 오직 하나여야 한다      → f 가 일대일함수여야 한다
//        곧 함수가 되기 위한 두 조건이 그대로 f 에게 「전사」와 「단사」를 요구한다.
//        둘을 합치면 f 는 일대일대응이어야 한다.
//
//  [성질] f : X → Y 가 일대일대응이면
//        1) f⁻¹ : Y → X 가 존재한다
//        2) y = f(x)  ⟺  x = f⁻¹(y)
//        3) (f⁻¹ ∘ f)(x) = x,  (f ∘ f⁻¹)(y) = y   곧  f⁻¹ ∘ f = I_X,  f ∘ f⁻¹ = I_Y
//        2) 로부터 점 (a, b) 가 y = f(x) 위에 있으면 점 (b, a) 가 y = f⁻¹(x) 위에 있으므로
//        두 그래프는 직선 y = x 에 대하여 대칭이다.
//
//  [구하는 법] y = f(x) 에서 x 를 y 로 나타내어 x = f⁻¹(y) 를 얻은 뒤,
//        정의역의 문자를 x 로 쓰는 관례에 맞추어 x 와 y 를 서로 바꾸어 y = f⁻¹(x) 로 적는다.
//        (x 와 y 를 먼저 바꾼 뒤 y 에 대해 정리해도 같은 결과가 나온다.)
//
//  [연산법칙] 역함수가 있는 두 함수 f, g 에 대하여
//        (f⁻¹)⁻¹ = f
//        (g ∘ f)⁻¹ = f⁻¹ ∘ g⁻¹      … 순서가 뒤집힌다
//        뒤의 것은 「양말을 신고 신발을 신었으면 벗을 때는 신발부터 벗는다」와 같은 이치다.
//        f⁻¹ ∘ g⁻¹ 가 아니라 g⁻¹ ∘ f⁻¹ 로 잘못 쓰면 대개 다른 함수가 된다.

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

export type Edge = [number, number];
export type Pt = [number, number];

// ══════════════════════════════════════════════════════════════
// 화살표 대응도 — 공용 좌표
// ══════════════════════════════════════════════════════════════
export const DG = { w: 300, rowH: 36, cxX: 78, cxY: 222, rx: 50, headH: 42, pad: 28, botPad: 16, inset: 30 };

export function dgGeom(nx: number, ny: number) {
  const maxN = Math.max(nx, ny);
  const ryMax = ((maxN - 1) * DG.rowH) / 2 + DG.pad;
  const cy = DG.headH + ryMax;
  return {
    cy,
    h: cy + ryMax + DG.botPad,
    ryX: ((nx - 1) * DG.rowH) / 2 + DG.pad,
    ryY: ((ny - 1) * DG.rowH) / 2 + DG.pad,
  };
}

export function dgRowY(i: number, n: number, cy: number): number {
  return cy + (i - (n - 1) / 2) * DG.rowH;
}

// ── 대응 판정 헬퍼 ────────────────────────────────────────────
export function outDeg(edges: Edge[], nx: number): number[] {
  const d = Array.from({ length: nx }, () => 0);
  for (const [a] of edges) d[a] += 1;
  return d;
}
export function inDeg(edges: Edge[], ny: number): number[] {
  const d = Array.from({ length: ny }, () => 0);
  for (const [, b] of edges) d[b] += 1;
  return d;
}
export function isFunction(edges: Edge[], nx: number): boolean {
  return outDeg(edges, nx).every((d) => d === 1);
}
export function isInjective(edges: Edge[], nx: number, ny: number): boolean {
  return isFunction(edges, nx) && inDeg(edges, ny).every((d) => d <= 1);
}
export function isOnto(edges: Edge[], nx: number, ny: number): boolean {
  return isFunction(edges, nx) && inDeg(edges, ny).every((d) => d >= 1);
}
export function isBijection(edges: Edge[], nx: number, ny: number): boolean {
  return isFunction(edges, nx) && inDeg(edges, ny).every((d) => d === 1);
}
/** 화살표를 거꾸로 돌린다 */
export function flip(edges: Edge[]): Edge[] {
  return edges.map(([a, b]) => [b, a] as Edge);
}
/** 거꾸로 돌린 것이 함수가 되지 못하는 까닭 — 0: 짝 없는 원소, 1: 짝이 둘 이상, 2: 둘 다 */
export function flipFail(edges: Edge[], ny: number): 0 | 1 | 2 | null {
  const d = inDeg(edges, ny);
  const none = d.some((v) => v === 0);
  const many = d.some((v) => v >= 2);
  if (none && many) return 2;
  if (none) return 0;
  if (many) return 1;
  return null;
}

export const FAIL_CHOICES = ["짝을 받지 못한 원소가 있다", "짝이 둘 이상인 원소가 있다", "두 가지 모두 어겼다"];

// ══════════════════════════════════════════════════════════════
// 좌표평면 — 탭 ② 에서 두 그래프를 겹쳐 그린다
// ══════════════════════════════════════════════════════════════
export const PV = { size: 288, min: -6, max: 6, pad: 18 };

export function pvX(v: number): number {
  return PV.pad + ((v - PV.min) / (PV.max - PV.min)) * (PV.size - 2 * PV.pad);
}
export function pvY(v: number): number {
  return PV.pad + ((PV.max - v) / (PV.max - PV.min)) * (PV.size - 2 * PV.pad);
}
export const PV_TICKS = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];

const inWin = (y: number) => y >= PV.min && y <= PV.max;

/**
 * 함수를 창 안의 꺾은선 조각들로 바꾼다.
 * 창을 벗어나는 자리는 이분법으로 테두리까지만 이어 붙이므로 좌표가 언제나 그림 상자 안에 들어온다.
 */
export function traceFn(fn: (x: number) => number): Pt[][] {
  const N = 900;
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  let px: number | null = null;
  let py: number | null = null;

  const edgePoint = (xIn: number, xOut: number): Pt => {
    let a = xIn;
    let b = xOut;
    for (let k = 0; k < 40; k++) {
      const m = (a + b) / 2;
      const ym = fn(m);
      if (!Number.isFinite(ym) || !inWin(ym)) b = m;
      else a = m;
    }
    const ya = fn(a);
    return [a, Number.isFinite(ya) ? Math.max(PV.min, Math.min(PV.max, ya)) : PV.min];
  };

  const flush = () => {
    if (cur.length > 1) out.push(cur);
    cur = [];
  };

  for (let i = 0; i <= N; i++) {
    const x = PV.min + ((PV.max - PV.min) * i) / N;
    const yr = fn(x);
    const y = Number.isFinite(yr) ? yr : null;
    const good = y !== null && inWin(y) && (py === null || Math.abs(y - py) <= 6);
    if (good) {
      if (cur.length === 0 && px !== null && py !== null) cur.push(edgePoint(x, px));
      cur.push([x, y as number]);
    } else {
      if (cur.length > 0 && px !== null && py !== null) cur.push(edgePoint(px, x));
      flush();
    }
    px = x;
    py = y;
  }
  flush();
  return out;
}

export function svgPath(poly: Pt[]): string {
  return "M" + poly.map(([x, y]) => `${pvX(x).toFixed(2)},${pvY(y).toFixed(2)}`).join(" L");
}

export function nx(v: number): string {
  const r = Math.round(v * 100) / 100;
  return r < 0 ? "−" + String(Math.abs(r)) : String(r);
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 역함수가 있으려면
// ══════════════════════════════════════════════════════════════
export const FLIP_X = ["1", "2", "3"];
export const FLIP_Y3 = ["a", "b", "c"];
export const FLIP_Y4 = ["a", "b", "c", "d"];

export const FLIP_GOALS = [
  "짝이 둘이 되어 거꾸로 돌릴 수 없게 만들기",
  "짝을 받지 못한 원소가 생기게 만들기",
  "거꾸로 돌려도 함수가 되게 만들기",
];

export type InvTask = {
  id: string;
  kind: "set" | "expr";
  /** 유한집합 문제 */
  xs?: string[];
  ys?: string[];
  edges?: Edge[];
  /** 식 문제 */
  tex?: string;
  domTex?: Piece[];
  codTex?: Piece[];
  has: boolean;
  /** 역함수가 없을 때 어긴 조건 (공역 쪽에서 본다) */
  fail: 0 | 1 | 2 | null;
  why: string;
};

const REAL: Piece[] = [{ pre: "실수 전체의 집합" }];

export const INV_TASKS: InvTask[] = [
  {
    id: "t1",
    kind: "set",
    xs: ["1", "2", "3"],
    ys: ["a", "b", "c"],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
    has: true,
    fail: null,
    why: "오른쪽 세 원소가 저마다 화살표를 하나씩 받았어요. 거꾸로 돌려도 빠짐없이 하나씩이라 함수가 됩니다.",
  },
  {
    id: "t2",
    kind: "set",
    xs: ["1", "2", "3"],
    ys: ["a", "b", "c"],
    edges: [
      [0, 0],
      [1, 0],
      [2, 1],
    ],
    has: false,
    fail: 2,
    why: "a 는 화살표를 둘 받았고 c 는 하나도 받지 못했어요. 거꾸로 돌리면 a 의 짝이 둘, c 의 짝이 없어 함수가 되지 못합니다.",
  },
  {
    id: "t3",
    kind: "set",
    xs: ["1", "2"],
    ys: ["a", "b", "c"],
    edges: [
      [0, 0],
      [1, 2],
    ],
    has: false,
    fail: 0,
    why: "b 가 화살표를 받지 못했어요. 거꾸로 돌리면 b 가 짝을 찾지 못해 함수가 되지 못합니다. 일대일함수이기는 하지만 치역이 공역보다 작아요.",
  },
  {
    id: "t4",
    kind: "set",
    xs: ["1", "2", "3"],
    ys: ["a", "b"],
    edges: [
      [0, 0],
      [1, 1],
      [2, 0],
    ],
    has: false,
    fail: 1,
    why: "a 가 1 과 3 에게서 화살표를 둘 받았어요. 거꾸로 돌리면 a 를 1 로 보낼지 3 으로 보낼지 정할 수 없습니다.",
  },
  {
    id: "t5",
    kind: "expr",
    tex: "y = 3x - 5",
    domTex: REAL,
    codTex: REAL,
    has: true,
    fail: null,
    why: "기울기가 0 이 아닌 일차함수는 쭉 올라가거나 쭉 내려가기만 해요. 서로 다른 x 가 서로 다른 값으로 가고 모든 실수가 값으로 나오니 일대일대응입니다.",
  },
  {
    id: "t6",
    kind: "expr",
    tex: "y = x^2",
    domTex: REAL,
    codTex: REAL,
    has: false,
    fail: 2,
    why: "2 와 -2 가 모두 4 로 가고, 음수는 값으로 나오지 않아요. 짝이 둘인 원소와 짝이 없는 원소가 함께 있어 두 조건을 모두 어깁니다.",
  },
  {
    id: "t7",
    kind: "expr",
    tex: "y = x^2",
    domTex: [{ tex: "\\{x \\mid x \\ge 0\\}" }],
    codTex: [{ tex: "\\{y \\mid y \\ge 0\\}" }],
    has: true,
    fail: null,
    why: "같은 식이라도 정의역을 0 이상으로 좁히고 공역을 치역에 맞추면 일대일대응이 돼요. 이때 역함수가 바로 제곱근입니다.",
  },
  {
    id: "t8",
    kind: "expr",
    tex: "y = x^3",
    domTex: REAL,
    codTex: REAL,
    has: true,
    fail: null,
    why: "세제곱은 쭉 올라가기만 해서 같은 값을 두 번 내놓지 않고, 어떤 실수든 값으로 나와요. 삼차식이라고 역함수가 없는 것은 아닙니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 역함수의 성질
// ══════════════════════════════════════════════════════════════
//   f : 1→6, 2→7, 3→5  (일대일대응)
//   f⁻¹ : 5→3, 6→1, 7→2
export const ROUND = {
  xs: ["1", "2", "3"],
  ys: ["5", "6", "7"],
  /** x 첨자 → y 첨자 */
  f: [1, 2, 0],
};

export type LineFn = {
  id: string;
  fTex: string;
  invTex: string;
  f: (x: number) => number;
  inv: (x: number) => number;
  note: string;
};

export const LINE_FNS: LineFn[] = [
  {
    id: "n1",
    fTex: "f(x)=2x-1",
    invTex: "f^{-1}(x)=\\dfrac{x+1}{2}",
    f: (x) => 2 * x - 1,
    inv: (x) => (x + 1) / 2,
    note: "2배 하고 1 을 빼는 일의 역은 1 을 더하고 2 로 나누는 일이에요. 순서까지 거꾸로 됩니다.",
  },
  {
    id: "n2",
    fTex: "f(x)=x+3",
    invTex: "f^{-1}(x)=x-3",
    f: (x) => x + 3,
    inv: (x) => x - 3,
    note: "3 을 더하는 일의 역은 3 을 빼는 일이에요. 두 그래프가 나란히 놓입니다.",
  },
  {
    id: "n3",
    fTex: "f(x)=-x+2",
    invTex: "f^{-1}(x)=-x+2",
    f: (x) => -x + 2,
    inv: (x) => -x + 2,
    note: "역함수가 자기 자신이 되는 드문 경우예요. 그래프가 이미 직선 y = x 에 대하여 대칭이기 때문입니다.",
  },
];

export type PropTask = {
  id: string;
  prompt: Piece[];
  choices: string[];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const PROP_TASKS: PropTask[] = [
  {
    id: "p1",
    prompt: [{ tex: "f(x)=3x+1" }, { pre: " 일 때 " }, { tex: "f^{-1}(7)" }, { pre: " 의 값은?" }],
    choices: ["2", "7", "22", "3"],
    answer: 0,
    choiceWhy: [
      "",
      "f(7) 을 구한 것이 아니에요. f(x) = 7 이 되는 x 를 찾아야 합니다.",
      "22 는 f(7) 의 값이에요. 방향이 반대입니다.",
      "3 은 x 의 계수일 뿐이에요.",
    ],
    why: "f⁻¹(7) 은 f(x) = 7 이 되는 x 예요. 3x + 1 = 7 에서 x = 2 입니다.",
  },
  {
    id: "p2",
    prompt: [{ pre: "일대일대응 " }, { tex: "f" }, { pre: " 에 대하여 " }, { tex: "(f^{-1} \\circ f)(5)" }, { pre: " 의 값은?" }],
    choices: ["f(5)", "5", "f^{-1}(5)", "1"],
    answer: 1,
    choiceWhy: [
      "f 를 씌운 뒤 다시 벗겼으니 f(5) 가 남지 않아요.",
      "",
      "f⁻¹ 만 쓴 것이 아니라 f 를 쓴 뒤 f⁻¹ 을 씌운 것입니다.",
      "1 은 항등함수를 나타내는 기호일 뿐 값이 아니에요.",
    ],
    why: "f 로 갔다가 f⁻¹ 으로 돌아오면 제자리예요. f⁻¹ ∘ f 는 항등함수라 값이 그대로 5 입니다.",
  },
  {
    id: "p3",
    prompt: [{ pre: "일대일대응 " }, { tex: "f" }, { pre: " 에 대하여 " }, { tex: "(f \\circ f^{-1})(-2)" }, { pre: " 의 값은?" }],
    choices: ["2", "0", "-2", "f(-2)"],
    answer: 2,
    choiceWhy: [
      "부호가 바뀌지 않아요. 넣은 값이 그대로 나옵니다.",
      "0 이 되는 것은 아니에요.",
      "",
      "f 를 한 번 더 씌우는 것이 아니라 f⁻¹ 을 벗기는 것입니다.",
    ],
    why: "f⁻¹ 으로 갔다가 f 로 돌아와도 제자리예요. f ∘ f⁻¹ 역시 항등함수라 값이 그대로 -2 입니다.",
  },
  {
    id: "p4",
    prompt: [{ tex: "f(x)=3x+1" }, { pre: " 이고 " }, { tex: "f^{-1}(a)=4" }, { pre: " 일 때 " }, { tex: "a" }, { pre: " 의 값은?" }],
    choices: ["1", "4", "12", "13"],
    answer: 3,
    choiceWhy: [
      "상수항만 본 값이에요.",
      "4 는 f⁻¹(a) 의 값이지 a 가 아닙니다.",
      "3 × 4 만 셈하고 1 을 더하지 않았어요.",
      "",
    ],
    why: "f⁻¹(a) = 4 는 f(4) = a 와 같은 말이에요. a = 3 × 4 + 1 = 13 입니다.",
  },
  {
    id: "p5",
    prompt: [{ pre: "일대일대응 " }, { tex: "f" }, { pre: " 에서 " }, { tex: "f(2)=7,\\ f(5)=1" }, { pre: " 일 때 " }, { tex: "f^{-1}(1)" }, { pre: " 의 값은?" }],
    choices: ["1", "5", "2", "7"],
    answer: 1,
    choiceWhy: [
      "1 은 f⁻¹ 에 넣은 값이에요.",
      "",
      "2 는 7 로 가는 원소입니다.",
      "7 은 f(2) 의 값이에요.",
    ],
    why: "f(5) = 1 이므로 거꾸로 보면 f⁻¹(1) = 5 예요. 표를 오른쪽에서 왼쪽으로 읽으면 됩니다.",
  },
  {
    id: "p6",
    prompt: [{ tex: "g(x)=x-6" }, { pre: " 일 때 " }, { tex: "g^{-1}(0)" }, { pre: " 의 값은?" }],
    choices: ["-6", "0", "6", "1"],
    answer: 2,
    choiceWhy: [
      "g(0) 의 값이에요. 방향이 반대입니다.",
      "넣은 값을 그대로 적었어요.",
      "",
      "1 이 되는 까닭은 없습니다.",
    ],
    why: "g(x) = 0 이 되는 x 를 찾으면 x - 6 = 0 에서 x = 6 이에요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 역함수 구하기
// ══════════════════════════════════════════════════════════════
export type Step = {
  choices: string[];
  answer: number;
  choiceWhy: string[];
};

export type SolveTask = {
  id: string;
  fTex: string;
  f: (x: number) => number;
  inv: (x: number) => number;
  /** 1단계 — x 를 y 로 나타내기 */
  step1: Step;
  /** 2단계 — x 와 y 를 서로 바꾸기 */
  step2: Step;
  invTex: string;
  note: string;
};

export const SOLVE_TASKS: SolveTask[] = [
  {
    id: "s1",
    fTex: "y = 3x - 2",
    f: (x) => 3 * x - 2,
    inv: (x) => (x + 2) / 3,
    step1: {
      choices: ["x = \\dfrac{y-2}{3}", "x = \\dfrac{y+2}{3}", "x = 3y + 2", "x = 3(y - 2)"],
      answer: 1,
      choiceWhy: [
        "2 를 옮길 때 부호가 바뀌어야 해요. 왼쪽으로 넘기면 더하기가 됩니다.",
        "",
        "3 을 곱하는 것이 아니라 3 으로 나누어야 해요.",
        "부호와 나눗셈이 모두 어긋났습니다.",
      ],
    },
    step2: {
      choices: ["f^{-1}(x) = \\dfrac{x-2}{3}", "f^{-1}(x) = 3x + 2", "f^{-1}(x) = \\dfrac{x+2}{3}", "f^{-1}(x) = 3x - 2"],
      answer: 2,
      choiceWhy: [
        "1단계에서 얻은 식의 부호가 바뀌었어요.",
        "1단계의 결과와 다릅니다.",
        "",
        "이것은 처음 함수 그대로예요.",
      ],
    },
    invTex: "f^{-1}(x) = \\dfrac{x+2}{3}",
    note: "3배 하고 2 를 빼는 일의 역은 2 를 더하고 3 으로 나누는 일이에요.",
  },
  {
    id: "s2",
    fTex: "y = -2x + 6",
    f: (x) => -2 * x + 6,
    inv: (x) => (6 - x) / 2,
    step1: {
      choices: ["x = \\dfrac{y-6}{2}", "x = \\dfrac{6-y}{2}", "x = -2y + 6", "x = \\dfrac{y+6}{2}"],
      answer: 1,
      choiceWhy: [
        "-2 로 나누면 분자의 부호까지 바뀝니다. 분자를 6 - y 로 두어야 해요.",
        "",
        "x 와 y 를 그냥 바꿔 쓴 것이에요. 먼저 x 에 대해 정리해야 합니다.",
        "6 을 옮길 때 부호가 바뀌어야 해요.",
      ],
    },
    step2: {
      choices: ["f^{-1}(x) = \\dfrac{6-x}{2}", "f^{-1}(x) = \\dfrac{x-6}{2}", "f^{-1}(x) = -2x + 6", "f^{-1}(x) = 2x - 6"],
      answer: 0,
      choiceWhy: [
        "",
        "1단계 결과의 분자 부호가 뒤집혔어요.",
        "처음 함수 그대로입니다.",
        "나누기와 곱하기가 뒤바뀌었어요.",
      ],
    },
    invTex: "f^{-1}(x) = \\dfrac{6-x}{2}",
    note: "분자를 나누어 쓰면 x 에 -0.5 를 곱하고 3 을 더하는 꼴로도 적을 수 있어요.",
  },
  {
    id: "s3",
    fTex: "y = \\dfrac{1}{2}x + 1",
    f: (x) => x / 2 + 1,
    inv: (x) => 2 * x - 2,
    step1: {
      choices: ["x = \\dfrac{y-1}{2}", "x = 2y + 2", "x = 2y - 2", "x = \\dfrac{y+1}{2}"],
      answer: 2,
      choiceWhy: [
        "1/2 로 나누는 것이 아니라 2 를 곱해야 해요.",
        "1 을 옮길 때 부호가 바뀌어야 합니다.",
        "",
        "2 를 곱해야 하는데 2 로 나누었어요.",
      ],
    },
    step2: {
      choices: ["f^{-1}(x) = 2x + 2", "f^{-1}(x) = 2x - 2", "f^{-1}(x) = \\dfrac{x-1}{2}", "f^{-1}(x) = \\dfrac{1}{2}x - 1"],
      answer: 1,
      choiceWhy: [
        "1단계 결과의 부호가 바뀌었어요.",
        "",
        "곱하기와 나누기가 뒤바뀌었습니다.",
        "처음 함수와 비슷한 꼴로 잘못 적었어요.",
      ],
    },
    invTex: "f^{-1}(x) = 2x - 2",
    note: "2 로 나누고 1 을 더하는 일의 역은 1 을 빼고 2 를 곱하는 일이에요.",
  },
  {
    id: "s4",
    fTex: "y = -x + 5",
    f: (x) => -x + 5,
    inv: (x) => -x + 5,
    step1: {
      choices: ["x = y - 5", "x = -y + 5", "x = y + 5", "x = -y - 5"],
      answer: 1,
      choiceWhy: [
        "-x 를 x 로 만들 때 양변의 부호가 모두 바뀝니다.",
        "",
        "부호를 바꾸는 것을 빠뜨렸어요.",
        "5 의 부호까지 바꾸어 버렸습니다.",
      ],
    },
    step2: {
      choices: ["f^{-1}(x) = x - 5", "f^{-1}(x) = x + 5", "f^{-1}(x) = -x + 5", "f^{-1}(x) = -x - 5"],
      answer: 2,
      choiceWhy: [
        "1단계 결과와 다릅니다.",
        "부호를 바꾸는 것을 빠뜨렸어요.",
        "",
        "5 의 부호가 뒤집혔습니다.",
      ],
    },
    invTex: "f^{-1}(x) = -x + 5",
    note: "역함수가 처음 함수와 똑같아졌어요. 그래프가 이미 직선 y = x 에 대하여 대칭이기 때문입니다.",
  },
  {
    id: "s5",
    fTex: "y = \\dfrac{x-3}{2}",
    f: (x) => (x - 3) / 2,
    inv: (x) => 2 * x + 3,
    step1: {
      choices: ["x = 2y + 3", "x = 2y - 3", "x = \\dfrac{y+3}{2}", "x = \\dfrac{y-3}{2}"],
      answer: 0,
      choiceWhy: [
        "",
        "3 을 옮길 때 부호가 바뀌어야 해요.",
        "양변에 2 를 곱해야 하는데 나누었습니다.",
        "처음 식을 그대로 옮겨 적었어요.",
      ],
    },
    step2: {
      choices: ["f^{-1}(x) = \\dfrac{x-3}{2}", "f^{-1}(x) = 2x - 3", "f^{-1}(x) = \\dfrac{x+3}{2}", "f^{-1}(x) = 2x + 3"],
      answer: 3,
      choiceWhy: [
        "처음 함수 그대로입니다.",
        "1단계 결과의 부호가 바뀌었어요.",
        "곱하기와 나누기가 뒤바뀌었습니다.",
        "",
      ],
    },
    invTex: "f^{-1}(x) = 2x + 3",
    note: "3 을 빼고 2 로 나누는 일의 역은 2 를 곱하고 3 을 더하는 일이에요.",
  },
  {
    id: "s6",
    fTex: "y = \\dfrac{2}{x}",
    f: (x) => 2 / x,
    inv: (x) => 2 / x,
    step1: {
      choices: ["x = \\dfrac{y}{2}", "x = 2y", "x = \\dfrac{2}{y}", "x = y - 2"],
      answer: 2,
      choiceWhy: [
        "양변에 x 를 곱하면 xy = 2 가 돼요. 거기서 y 로 나누어야 합니다.",
        "곱하기와 나누기가 뒤바뀌었어요.",
        "",
        "분수식이라 빼기로 풀 수 없습니다.",
      ],
    },
    step2: {
      choices: ["f^{-1}(x) = \\dfrac{2}{x}", "f^{-1}(x) = \\dfrac{x}{2}", "f^{-1}(x) = 2x", "f^{-1}(x) = -\\dfrac{2}{x}"],
      answer: 0,
      choiceWhy: [
        "",
        "1단계 결과와 분자·분모가 뒤바뀌었어요.",
        "나누기가 곱하기로 바뀌었습니다.",
        "부호를 바꿀 까닭이 없어요.",
      ],
    },
    invTex: "f^{-1}(x) = \\dfrac{2}{x}",
    note: "이 함수도 역함수가 자기 자신이에요. 정의역은 0 이 아닌 실수입니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 역함수의 연산법칙
// ══════════════════════════════════════════════════════════════
export type UndoTask = {
  id: string;
  icon: string;
  title: string;
  /** 하는 차례 */
  doSteps: string[];
  /** doSteps[i] 를 되돌리는 말 */
  undoLabels: string[];
  /** 단추를 늘어놓을 차례 (undoLabels 의 첨자) — 정답 차례와 달라야 생각할 거리가 생긴다 */
  scatter: number[];
  why: string;
};

export const UNDO_TASKS: UndoTask[] = [
  {
    id: "u1",
    icon: "🧦",
    title: "외출 준비",
    doSteps: ["양말 신기", "신발 신기", "신발끈 묶기"],
    undoLabels: ["양말 벗기", "신발 벗기", "신발끈 풀기"],
    scatter: [1, 0, 2],
    why: "끈을 묶은 것이 마지막이니 풀 때는 그것부터예요. 신발을 신은 채로 양말을 벗을 수는 없습니다.",
  },
  {
    id: "u2",
    icon: "🎁",
    title: "선물 포장",
    doSteps: ["상자에 넣기", "포장지로 싸기", "리본 묶기"],
    undoLabels: ["상자에서 꺼내기", "포장지 벗기기", "리본 풀기"],
    scatter: [0, 2, 1],
    why: "가장 나중에 한 일을 가장 먼저 되돌려요. 리본을 풀어야 포장지를 벗길 수 있습니다.",
  },
  {
    id: "u3",
    icon: "🔒",
    title: "문단속",
    doSteps: ["창문 닫기", "현관문 닫기", "자물쇠 잠그기"],
    undoLabels: ["창문 열기", "현관문 열기", "자물쇠 열기"],
    scatter: [2, 0, 1],
    why: "자물쇠를 열어야 문을 열 수 있고, 문을 열어야 안으로 들어가 창문을 열 수 있어요.",
  },
  {
    id: "u4",
    icon: "💾",
    title: "파일 보내기",
    doSteps: ["파일 압축하기", "암호 걸기", "메일에 붙이기"],
    undoLabels: ["압축 풀기", "암호 풀기", "메일에서 내려받기"],
    scatter: [1, 2, 0],
    why: "받는 쪽에서는 내려받고, 암호를 풀고, 압축을 푸는 차례예요. 보낼 때와 정확히 거꾸로입니다.",
  },
];

export type PairTask = {
  id: string;
  fTex: string;
  gTex: string;
  f: (x: number) => number;
  g: (x: number) => number;
  finvTex: string;
  ginvTex: string;
  gfTex: string;
  /** (g∘f)^{-1} 과 f^{-1}∘g^{-1} 은 같다 */
  rightTex: string;
  right: (x: number) => number;
  /** g^{-1}∘f^{-1} 은 다르다 */
  wrongTex: string;
  wrong: (x: number) => number;
};

export const PAIRS: PairTask[] = [
  {
    id: "r1",
    fTex: "f(x)=2x",
    gTex: "g(x)=x+3",
    f: (x) => 2 * x,
    g: (x) => x + 3,
    finvTex: "f^{-1}(x)=\\dfrac{x}{2}",
    ginvTex: "g^{-1}(x)=x-3",
    gfTex: "(g \\circ f)(x)=2x+3",
    rightTex: "\\dfrac{x-3}{2}",
    right: (x) => (x - 3) / 2,
    wrongTex: "\\dfrac{x}{2}-3",
    wrong: (x) => x / 2 - 3,
  },
  {
    id: "r2",
    fTex: "f(x)=x-4",
    gTex: "g(x)=3x",
    f: (x) => x - 4,
    g: (x) => 3 * x,
    finvTex: "f^{-1}(x)=x+4",
    ginvTex: "g^{-1}(x)=\\dfrac{x}{3}",
    gfTex: "(g \\circ f)(x)=3x-12",
    rightTex: "\\dfrac{x}{3}+4",
    right: (x) => x / 3 + 4,
    wrongTex: "\\dfrac{x+4}{3}",
    wrong: (x) => (x + 4) / 3,
  },
  {
    id: "r3",
    fTex: "f(x)=-x",
    gTex: "g(x)=x+5",
    f: (x) => -x,
    g: (x) => x + 5,
    finvTex: "f^{-1}(x)=-x",
    ginvTex: "g^{-1}(x)=x-5",
    gfTex: "(g \\circ f)(x)=-x+5",
    rightTex: "-x+5",
    right: (x) => -x + 5,
    wrongTex: "-x-5",
    wrong: (x) => -x - 5,
  },
];

/** (f⁻¹)⁻¹ = f 를 확인할 함수 */
export const TWICE = {
  fTex: "f(x)=3x+1",
  invTex: "f^{-1}(x)=\\dfrac{x-1}{3}",
  backTex: "(f^{-1})^{-1}(x)=3x+1",
  f: (x: number) => 3 * x + 1,
  inv: (x: number) => (x - 1) / 3,
};

export type LawTask = {
  id: string;
  prompt: Piece[];
  /** 보기마다 한글과 식이 섞일 수 있으므로 조각 배열로 담는다 */
  choices: Piece[][];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const LAW_TASKS: LawTask[] = [
  {
    id: "w1",
    prompt: [{ pre: "역함수가 있는 두 함수 " }, { tex: "f,\\ g" }, { pre: " 에 대하여 " }, { tex: "(g \\circ f)^{-1}" }, { pre: " 과 같은 것은?" }],
    choices: [[{ tex: "g^{-1} \\circ f^{-1}" }], [{ tex: "f^{-1} \\circ g^{-1}" }], [{ tex: "f \\circ g" }], [{ tex: "g \\circ f" }]],
    answer: 1,
    choiceWhy: [
      "순서가 그대로예요. 되돌릴 때는 나중에 쓴 것부터 벗겨야 합니다.",
      "",
      "역함수를 쓰지 않았어요.",
      "처음 식 그대로입니다.",
    ],
    why: "f 를 먼저, g 를 나중에 씌웠으니 벗길 때는 g 부터예요. 그래서 (g ∘ f)⁻¹ = f⁻¹ ∘ g⁻¹ 입니다.",
  },
  {
    id: "w2",
    prompt: [{ pre: "양말을 신고 신발을 신었습니다. 벗는 차례로 알맞은 것은?" }],
    choices: [[{ pre: "양말 → 신발" }], [{ pre: "둘은 아무 차례나 괜찮다" }], [{ pre: "신발 → 양말" }], [{ pre: "양말만 벗으면 된다" }]],
    answer: 2,
    choiceWhy: [
      "신발을 신은 채로 양말을 벗을 수는 없어요.",
      "차례가 정해져 있습니다. 나중에 한 일부터 되돌려야 해요.",
      "",
      "두 가지를 모두 되돌려야 처음으로 돌아갑니다.",
    ],
    why: "나중에 신은 신발부터 벗어야 해요. (신발 ∘ 양말)⁻¹ = 양말⁻¹ ∘ 신발⁻¹ 과 같은 이치입니다.",
  },
  {
    id: "w3",
    prompt: [{ pre: "역함수가 있는 " }, { tex: "f" }, { pre: " 에 대하여 " }, { tex: "(f^{-1})^{-1}" }, { pre: " 과 같은 것은?" }],
    choices: [[{ tex: "f" }], [{ tex: "f^{-1}" }], [{ pre: "항등함수" }], [{ tex: "f \\circ f" }]],
    answer: 0,
    choiceWhy: [
      "",
      "한 번만 뒤집은 것이에요. 두 번 뒤집으면 처음으로 돌아갑니다.",
      "항등함수가 되는 것은 f⁻¹ ∘ f 예요.",
      "f 를 두 번 합성한 것과는 다릅니다.",
    ],
    why: "화살표를 거꾸로 돌린 뒤 다시 거꾸로 돌리면 처음 방향이에요. 그래서 (f⁻¹)⁻¹ = f 입니다.",
  },
  {
    id: "w4",
    prompt: [{ tex: "f(x)=2x,\\ g(x)=x+1" }, { pre: " 일 때 " }, { tex: "(g \\circ f)^{-1}(5)" }, { pre: " 의 값은?" }],
    choices: [[{ tex: "11" }], [{ tex: "3" }], [{ tex: "1.5" }], [{ tex: "2" }]],
    answer: 3,
    choiceWhy: [
      "(g ∘ f)(5) 를 구한 것이에요. 방향이 반대입니다.",
      "g 만 벗긴 값이에요. f 도 벗겨야 합니다.",
      "f 만 벗긴 값입니다.",
      "",
    ],
    why: "(g ∘ f)(x) = 2x + 1 이므로 2x + 1 = 5 에서 x = 2 예요. f⁻¹(g⁻¹(5)) = f⁻¹(4) = 2 로 셈해도 같습니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ⑤ 일상 속 역함수
// ══════════════════════════════════════════════════════════════
export type LifeCase = {
  id: string;
  icon: string;
  title: string;
  forward: string;
  has: boolean;
  q2: string;
  choices: string[];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const LIFE_CASES: LifeCase[] = [
  {
    id: "L1",
    icon: "🔐",
    title: "글자를 세 칸 미는 암호",
    forward: "글자를 알파벳 차례로 세 칸 뒤로 민다",
    has: true,
    q2: "이 일을 되돌리는 방법은?",
    choices: ["세 칸 더 뒤로 민다", "세 칸 앞으로 민다", "글자를 거꾸로 쓴다", "되돌릴 수 없다"],
    answer: 1,
    choiceWhy: [
      "여섯 칸을 민 셈이 되어 더 멀어져요.",
      "",
      "차례를 미는 일과 거꾸로 쓰는 일은 다릅니다.",
      "서로 다른 글자가 서로 다른 글자로 가니 되돌릴 수 있어요.",
    ],
    why: "서로 다른 글자가 서로 다른 글자로 가고 모든 글자가 나올 수 있어 일대일대응이에요. 역은 세 칸 앞으로 미는 일입니다.",
  },
  {
    id: "L2",
    icon: "🌡️",
    title: "섭씨를 화씨로 바꾸기",
    forward: "섭씨 온도에 1.8 을 곱하고 32 를 더한다",
    has: true,
    q2: "역함수를 식으로 쓰면?",
    choices: ["C = (F − 32) ÷ 1.8", "C = 1.8 × F + 32", "C = F ÷ 1.8 + 32", "C = 1.8 × (F − 32)"],
    answer: 0,
    choiceWhy: [
      "",
      "처음 식 그대로예요. 문자만 바꿔 적었습니다.",
      "32 를 먼저 빼야 하는데 나눈 뒤에 더했어요.",
      "나누어야 할 자리에 곱했습니다.",
    ],
    why: "1.8 을 곱하고 32 를 더한 일의 역은 32 를 빼고 1.8 로 나누는 일이에요. 순서까지 거꾸로 됩니다.",
  },
  {
    id: "L3",
    icon: "👤",
    title: "사람에게 나이를 짝지어 주기",
    forward: "사람에게 그 사람의 나이를 짝지어 준다",
    has: false,
    q2: "역함수가 없는 까닭은?",
    choices: [
      "같은 나이인 사람이 여럿이라 되돌릴 수 없다",
      "나이를 모르는 사람이 있기 때문",
      "나이가 해마다 바뀌기 때문",
      "나이는 수이고 사람은 수가 아니기 때문",
    ],
    answer: 0,
    choiceWhy: [
      "",
      "누구에게나 나이는 있어요. 짝이 없는 사람은 없습니다.",
      "어느 한 때를 정해 놓고 생각하면 값은 하나로 정해져요.",
      "정의역과 공역의 종류가 달라도 함수는 됩니다.",
    ],
    why: "17살이라는 값 하나에 여러 사람이 몰려 있어요. 거꾸로 돌리면 짝이 둘 이상이 되어 함수가 되지 못합니다.",
  },
  {
    id: "L4",
    icon: "🎽",
    title: "학생에게 학번을 짝지어 주기",
    forward: "학생에게 그 학생의 학번을 짝지어 준다 (학번은 겹치지 않는다)",
    has: true,
    q2: "역함수는 무엇일까요?",
    choices: [
      "학생에게 이름을 짝지어 준다",
      "학번에 그 학번의 앞 번호를 짝지어 준다",
      "학번에 그 학번을 쓰는 학생을 짝지어 준다",
      "학생에게 반을 짝지어 준다",
    ],
    answer: 2,
    choiceWhy: [
      "이름은 겹칠 수 있고 학번과도 관계가 없어요.",
      "앞 번호를 찾는 일은 원래 짝짓기를 되돌리는 일이 아닙니다.",
      "",
      "반은 여러 학생이 함께 쓰니 되돌릴 수 없어요.",
    ],
    why: "학번이 겹치지 않고 빈 학번도 없다면 일대일대응이에요. 학번을 보고 학생을 찾는 일이 바로 역함수입니다.",
  },
  {
    id: "L5",
    icon: "🎨",
    title: "컬러 사진을 흑백으로 바꾸기",
    forward: "색이 있는 사진을 회색 사진으로 바꾼다",
    has: false,
    q2: "역함수가 없는 까닭은?",
    choices: [
      "흑백 사진이 컬러 사진보다 작기 때문",
      "회색이 나오지 않는 색이 있기 때문",
      "서로 다른 색이 같은 회색이 되어 되돌릴 수 없다",
      "사진마다 크기가 다르기 때문",
    ],
    answer: 2,
    choiceWhy: [
      "크기와는 관계가 없어요.",
      "어떤 색이든 회색 값이 정해집니다. 문제는 그 값이 겹친다는 것이에요.",
      "",
      "크기와는 관계가 없습니다.",
    ],
    why: "밝기가 같은 빨강과 파랑이 같은 회색이 돼요. 거꾸로 돌리면 어느 색이었는지 정할 수 없으니 함수가 되지 못합니다.",
  },
  {
    id: "L6",
    icon: "📮",
    title: "주소에 우편번호를 짝지어 주기",
    forward: "주소에 그 동네의 우편번호를 짝지어 준다",
    has: false,
    q2: "역함수가 없는 까닭은?",
    choices: [
      "우편번호가 없는 주소가 있기 때문",
      "한 우편번호에 여러 주소가 몰려 있기 때문",
      "우편번호가 때때로 바뀌기 때문",
      "주소가 너무 길기 때문",
    ],
    answer: 1,
    choiceWhy: [
      "어느 주소에나 우편번호는 있어요.",
      "",
      "한 때를 정해 놓고 보면 값은 하나로 정해집니다.",
      "길이와는 관계가 없어요.",
    ],
    why: "한 우편번호를 같은 동네의 여러 주소가 함께 써요. 번호만 보고 주소를 하나로 되짚을 수 없으니 역함수가 없습니다.",
  },
  {
    id: "L7",
    icon: "💱",
    title: "원을 달러로 바꾸기",
    forward: "환율이 정해진 어느 날, 원화 금액을 달러 금액으로 바꾼다",
    has: true,
    q2: "역함수는 무엇일까요?",
    choices: [
      "원화 금액에서 수수료를 뺀다",
      "달러 금액에 환율을 한 번 더 곱한다",
      "환율을 거꾸로 뒤집어 적는다",
      "달러 금액을 다시 원화 금액으로 바꾼다",
    ],
    answer: 3,
    choiceWhy: [
      "수수료는 환전과 다른 일이에요.",
      "한 번 더 곱하면 더 멀어집니다.",
      "환율을 적는 방식과는 관계가 없어요.",
      "",
    ],
    why: "환율이 정해져 있으면 금액마다 달러가 하나씩 정해지고 겹치지도 않아요. 되돌리는 일은 그 환율로 다시 원화를 구하는 일입니다.",
  },
  {
    id: "L8",
    icon: "📸",
    title: "사진을 절반 크기로 줄이기",
    forward: "네 칸의 색을 평균 내어 한 칸으로 줄인다",
    has: false,
    q2: "역함수가 없는 까닭은?",
    choices: [
      "줄인 사진이 흐려 보이기 때문",
      "사진의 모양이 달라지기 때문",
      "칸의 수가 줄어들기 때문",
      "서로 다른 네 칸이 같은 평균을 내어 되돌릴 수 없다",
    ],
    answer: 3,
    choiceWhy: [
      "흐려 보이는 것은 결과일 뿐 까닭이 아니에요.",
      "가로세로를 똑같이 줄이면 모양은 그대로입니다.",
      "칸이 줄어드는 것 자체보다, 서로 다른 것이 같은 값이 된다는 것이 문제예요.",
      "",
    ],
    why: "평균이 같아지는 네 칸의 조합이 여럿이에요. 줄인 사진만 보고 원래 색을 하나로 되짚을 수 없으니 역함수가 없습니다.",
  },
];

export const HAS_CHOICES = ["역함수가 있다", "역함수가 없다"];
