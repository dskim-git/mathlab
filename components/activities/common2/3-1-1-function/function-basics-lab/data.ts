// 함수 — 활동 데이터
//
//  [대응] 공집합이 아닌 두 집합 X, Y 에 대하여 X 의 원소에 Y 의 원소를 짝짓는 것.
//         X 의 원소 x 에 Y 의 원소 y 가 짝지어지면 "x 가 y 에 대응한다" 라 하고 x → y 로 쓴다.
//         짝이 하나도 없는 원소가 있어도, 짝이 여럿인 원소가 있어도 그것은 여전히 대응이다.
//
//  [함수] 대응 가운데 다음 두 가지를 모두 지키는 것.
//         ① X 의 모든 원소가 하나도 빠짐없이 대응된다
//         ② X 의 각 원소 x 에 대응되는 Y 의 원소가 반드시 하나뿐이다
//         이때 f : X → Y 로 쓰고, x 에 대응되는 Y 의 원소를 y = f(x) 로 나타낸다.
//         함수의 대응이 어떤 계산 규칙을 따를 필요는 없다. 짝만 규칙 ①②에 맞게 지어지면 함수다.
//         그러므로 「함수 ⊂ 대응」 — 함수는 대응의 특별한 경우다.
//
//  [정의역] X        [공역] Y        [치역] f(X) = { f(x) | x ∈ X }
//         언제나 (치역) ⊂ (공역) 이고, 치역은 정의역과 대응 규칙에 의해 결정된다.
//         Y 의 원소 가운데 화살표를 하나도 받지 못한 것이 있어도 함수가 되는 데는 문제가 없다.
//         y = f(x) 꼴만 주어지고 정의역·공역을 밝히지 않으면
//         정의역은 f 가 정의되는 모든 실수 x 의 집합, 공역은 실수 전체의 집합으로 본다.
//
//  [상등] 두 함수 f : X → Y, g : A → B 에 대하여
//         (i) X = A, Y = B 이고  (ii) 모든 x ∈ X 에 대하여 f(x) = g(x)  이면  f = g.
//         곧 함수를 이루는 세 요소 「정의역·공역·대응 관계」 가운데
//         하나라도 다르면 f ≠ g 이다. 식의 겉모습이 달라도 세 요소가 같으면 같은 함수다.
//         치역은 앞의 세 요소에서 따라 나오는 것이므로 상등을 따질 때 따로 보지 않는다.

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

export type Edge = [number, number];

// ══════════════════════════════════════════════════════════════
// 화살표 대응도 — 공용 좌표
// ══════════════════════════════════════════════════════════════
export const DG = {
  w: 340,
  rowH: 38,
  cxX: 88,
  cxY: 252,
  rx: 56,
  headH: 42,
  pad: 30,
  botPad: 16,
  inset: 34,
};

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

export function imageIdx(edges: Edge[]): number[] {
  const s = new Set<number>();
  for (const [, b] of edges) s.add(b);
  return [...s].sort((p, q) => p - q);
}

export function isFunction(edges: Edge[], nx: number): boolean {
  return outDeg(edges, nx).every((d) => d === 1);
}

/** 대응이 함수가 아닐 때 어긴 조건 — 0: 빠진 원소, 1: 짝이 둘 이상, 2: 둘 다 */
export function failKind(edges: Edge[], nx: number): 0 | 1 | 2 | null {
  const d = outDeg(edges, nx);
  const miss = d.some((v) => v === 0);
  const many = d.some((v) => v >= 2);
  if (miss && many) return 2;
  if (miss) return 0;
  if (many) return 1;
  return null;
}

export const FAIL_CHOICES = [
  "짝이 하나도 없는 원소가 있다",
  "짝이 둘 이상인 원소가 있다",
  "두 가지를 모두 어겼다",
];

export const FUNC_RULES: Piece[][] = [
  [{ pre: "조건 ①  " }, { tex: "X" }, { pre: " 의 모든 원소가 빠짐없이 대응된다" }],
  [{ pre: "조건 ②  각 " }, { tex: "x" }, { pre: " 에 대응되는 " }, { tex: "Y" }, { pre: " 의 원소가 오직 하나다" }],
];

// ══════════════════════════════════════════════════════════════
// 탭 ① 대응과 함수
// ══════════════════════════════════════════════════════════════
export const LAB_X = ["1", "2", "3"];
export const LAB_Y = ["p", "q", "r"];

export type JudgeTask = {
  id: string;
  xs: string[];
  ys: string[];
  edges: Edge[];
  isFunc: boolean;
  /** 함수가 아닐 때 어긴 조건 */
  fail: 0 | 1 | 2 | null;
  why: string;
};

export const JUDGE_TASKS: JudgeTask[] = [
  {
    id: "j1",
    xs: ["1", "2", "3"],
    ys: ["p", "q", "r"],
    edges: [
      [0, 1],
      [1, 1],
      [2, 0],
    ],
    isFunc: true,
    fail: null,
    why: "세 원소가 모두 빠짐없이, 각각 하나씩만 짝지어졌어요. 1 과 2 가 같은 q 로 가도 괜찮습니다. 조건은 「X 쪽에서 나가는 화살표」에 대한 것이니까요.",
  },
  {
    id: "j2",
    xs: ["1", "2", "3"],
    ys: ["p", "q", "r"],
    edges: [
      [0, 0],
      [1, 2],
    ],
    isFunc: false,
    fail: 0,
    why: "3 에서 나가는 화살표가 없어요. X 의 원소가 하나라도 빠지면 함수가 아닙니다.",
  },
  {
    id: "j3",
    xs: ["1", "2", "3"],
    ys: ["p", "q", "r"],
    edges: [
      [0, 0],
      [0, 2],
      [1, 1],
      [2, 1],
    ],
    isFunc: false,
    fail: 1,
    why: "1 에서 화살표가 두 개 나갔어요. f(1) 을 p 라 해야 할지 r 이라 해야 할지 정할 수 없으니 함수가 아닙니다.",
  },
  {
    id: "j4",
    xs: ["1", "2", "3", "4"],
    ys: ["p", "q"],
    edges: [
      [0, 1],
      [1, 0],
      [2, 1],
      [3, 0],
    ],
    isFunc: true,
    fail: null,
    why: "네 원소가 모두 하나씩 짝지어졌어요. 공역이 정의역보다 작아도 아무 문제가 없습니다.",
  },
  {
    id: "j5",
    xs: ["1", "2", "3", "4"],
    ys: ["p", "q", "r", "s"],
    edges: [
      [0, 3],
      [1, 2],
      [2, 1],
      [3, 0],
    ],
    isFunc: true,
    fail: null,
    why: "모두 하나씩, 게다가 서로 다른 곳으로 갔어요. 치역이 공역과 같아지는 경우입니다.",
  },
  {
    id: "j6",
    xs: ["1", "2", "3", "4"],
    ys: ["p", "q", "r"],
    edges: [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 0],
      [3, 1],
    ],
    isFunc: false,
    fail: 1,
    why: "4 에서 화살표가 둘 나갔어요. 앞의 세 원소가 아무리 얌전해도 딱 하나가 어기면 함수가 아닙니다.",
  },
  {
    id: "j7",
    xs: ["1", "2", "3"],
    ys: ["p", "q", "r", "s"],
    edges: [
      [0, 3],
      [1, 3],
      [2, 3],
    ],
    isFunc: true,
    fail: null,
    why: "셋이 모두 s 한 곳으로 가도 함수예요. Y 쪽에 화살표를 받지 못한 원소가 있어도 상관없습니다.",
  },
  {
    id: "j8",
    xs: ["1", "2", "3", "4"],
    ys: ["p", "q", "r"],
    edges: [
      [1, 0],
      [2, 1],
      [3, 2],
    ],
    isFunc: false,
    fail: 0,
    why: "1 이 짝을 찾지 못했어요. 나머지가 모두 얌전해도 X 의 원소 하나가 남으면 함수가 아닙니다.",
  },
  {
    id: "j9",
    xs: ["1", "2", "3"],
    ys: ["p", "q"],
    edges: [
      [0, 0],
      [1, 0],
      [1, 1],
    ],
    isFunc: false,
    fail: 2,
    why: "3 은 짝이 없고 2 는 짝이 둘이에요. 두 조건을 한꺼번에 어긴 경우입니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 정의역·공역·치역
// ══════════════════════════════════════════════════════════════
export const RULE_X = [1, 2, 3, 4];
export const RULE_Y = [1, 2, 3, 4, 5, 6, 7, 8];

export type RuleChip = {
  id: string;
  label: Piece[];
  map: (x: number) => number[];
  isFunc: boolean;
  note: string;
};

export const RULE_CHIPS: RuleChip[] = [
  {
    id: "r1",
    label: [{ tex: "f(x)=x+2" }],
    map: (x) => [x + 2],
    isFunc: true,
    note: "네 화살표가 서로 다른 곳으로 갔어요. 치역의 원소가 정의역과 같은 4개입니다.",
  },
  {
    id: "r2",
    label: [{ tex: "f(x)=2x" }],
    map: (x) => [2 * x],
    isFunc: true,
    note: "짝수 자리만 골라 갑니다. 공역 8개 가운데 4개만 화살표를 받았어요.",
  },
  {
    id: "r3",
    label: [{ tex: "f(x)=5" }],
    map: () => [5],
    isFunc: true,
    note: "모두 5 한 곳으로 갑니다. 이런 함수를 상수함수라 하고, 치역의 원소는 딱 하나예요.",
  },
  {
    id: "r4",
    label: [{ tex: "f(x)=|2x-5|+1" }],
    map: (x) => [Math.abs(2 * x - 5) + 1],
    isFunc: true,
    note: "1 과 4 가 같은 곳, 2 와 3 이 같은 곳으로 갑니다. 정의역은 4개인데 치역은 2개예요.",
  },
  {
    id: "r5",
    label: [{ pre: "x 에 x 의 약수를 대응" }],
    map: (x) => RULE_Y.filter((y) => x % y === 0),
    isFunc: false,
    note: "4 에는 1, 2, 4 가 함께 대응됩니다. 짝이 둘 이상이므로 함수가 아니고, 그래서 치역을 말할 수 없어요.",
  },
];

export const DCR_SLOTS: { key: "domain" | "codomain" | "range"; name: string; color: string }[] = [
  { key: "domain", name: "정의역", color: "amber" },
  { key: "codomain", name: "공역", color: "sky" },
  { key: "range", name: "치역", color: "emerald" },
];

export type DcrSlot = {
  choices: Piece[][];
  answer: number;
  /** 정답 자리는 빈 문자열, 오답마다 해설 */
  choiceWhy: string[];
};

export type DcrTask = {
  id: string;
  titleTex: string;
  extra?: string;
  fx: (x: number) => number | null;
  /** 그래프를 그릴 x 범위 (정의역 제한) */
  dom: [number, number];
  /** 함수가 정의되지 않는 x */
  holes: number[];
  /** 치역을 y축 위에 그릴 구간 (보이는 창 안으로 잘라 둔 값) */
  rangeSegs: [number, number][];
  /** 치역에서 빠지는 y 값 (속 빈 점) */
  rangeOpen: number[];
  /** 정의역을 x축 위에 그릴 구간 */
  domainSegs: [number, number][];
  domainOpen: number[];
  domain: DcrSlot;
  codomain: DcrSlot;
  range: DcrSlot;
};

const REAL: Piece[] = [{ pre: "실수 전체의 집합" }];
const NAT: Piece[] = [{ pre: "자연수 전체의 집합" }];
const INT: Piece[] = [{ pre: "정수 전체의 집합" }];

export const DCR_TASKS: DcrTask[] = [
  {
    id: "d1",
    titleTex: "y = 3x - 1",
    fx: (x) => 3 * x - 1,
    dom: [-6, 6],
    holes: [],
    rangeSegs: [[-6, 6]],
    rangeOpen: [],
    domainSegs: [[-6, 6]],
    domainOpen: [],
    domain: {
      choices: [[{ tex: "\\{x \\mid x \\ne 0\\}" }], [{ tex: "\\{x \\mid x \\ge 0\\}" }], REAL, [{ tex: "\\{x \\mid x \\ge -1\\}" }]],
      answer: 2,
      choiceWhy: [
        "x = 0 을 넣으면 y = -1 로 값이 잘 나와요. 뺄 까닭이 없습니다.",
        "음수를 넣어도 값이 나옵니다. x = -2 이면 y = -7 이에요.",
        "",
        "-1 은 y 쪽 이야기예요. x 에는 아무 제한이 없습니다.",
      ],
    },
    codomain: {
      choices: [REAL, NAT, [{ tex: "\\{y \\mid y \\ge -1\\}" }], [{ tex: "\\{y \\mid y \\ne 0\\}" }]],
      answer: 0,
      choiceWhy: [
        "",
        "공역을 따로 밝히지 않았으니 실수 전체로 봅니다. 자연수로 좁힐 근거가 없어요.",
        "공역은 치역처럼 값이 실제로 닿는 곳이 아니라, 짝을 고르는 「후보 전체」예요.",
        "밝히지 않은 공역은 언제나 실수 전체의 집합입니다.",
      ],
    },
    range: {
      choices: [[{ tex: "\\{y \\mid y \\ge -1\\}" }], [{ tex: "\\{y \\mid y \\ge 0\\}" }], [{ tex: "\\{y \\mid y \\ne -1\\}" }], REAL],
      answer: 3,
      choiceWhy: [
        "일차식은 아래로도 끝없이 내려가요. x = -10 이면 y = -31 입니다.",
        "음수 값도 얼마든지 나옵니다.",
        "y = -1 도 x = 0 에서 실제로 나오는 값이에요.",
        "",
      ],
    },
  },
  {
    id: "d2",
    titleTex: "y = x^2 - 4",
    fx: (x) => x * x - 4,
    dom: [-6, 6],
    holes: [],
    rangeSegs: [[-4, 6]],
    rangeOpen: [],
    domainSegs: [[-6, 6]],
    domainOpen: [],
    domain: {
      choices: [[{ tex: "\\{x \\mid x \\ge 2\\}" }], REAL, [{ tex: "\\{x \\mid x \\ge 0\\}" }], [{ tex: "\\{x \\mid x \\ne \\pm 2\\}" }]],
      answer: 1,
      choiceWhy: [
        "x = 0 을 넣으면 y = -4 로 값이 나와요. 2 보다 작아도 괜찮습니다.",
        "",
        "음수도 제곱하면 값이 나옵니다. x = -3 이면 y = 5 예요.",
        "x = 2 에서 y = 0 이 나옵니다. 나누는 식이 아니므로 뺄 값이 없어요.",
      ],
    },
    codomain: {
      choices: [[{ tex: "\\{y \\mid y \\ge -4\\}" }], [{ tex: "\\{y \\mid y \\ge 0\\}" }], INT, REAL],
      answer: 3,
      choiceWhy: [
        "그건 치역이에요. 공역은 밝히지 않았으니 실수 전체입니다.",
        "제곱만 보고 고른 값이에요. 4 를 빼면 음수도 나옵니다.",
        "정수로 좁힐 근거가 없어요. 공역은 실수 전체로 봅니다.",
        "",
      ],
    },
    range: {
      choices: [[{ tex: "\\{y \\mid y \\ge -4\\}" }], REAL, [{ tex: "\\{y \\mid y \\ge 0\\}" }], [{ tex: "\\{y \\mid y \\le -4\\}" }]],
      answer: 0,
      choiceWhy: [
        "",
        "y 가 -4 보다 작아지는 x 는 없어요. 아래쪽이 막혀 있습니다.",
        "x = 0 에서 y = -4 가 나옵니다. 0 보다 작은 값도 나와요.",
        "부등호 방향이 반대예요. 꼭짓점 -4 가 가장 작은 값입니다.",
      ],
    },
  },
  {
    id: "d3",
    titleTex: "y = \\dfrac{1}{x-2}",
    fx: (x) => (Math.abs(x - 2) < 1e-9 ? null : 1 / (x - 2)),
    dom: [-6, 6],
    holes: [2],
    rangeSegs: [
      [-6, 0],
      [0, 6],
    ],
    rangeOpen: [0],
    domainSegs: [
      [-6, 2],
      [2, 6],
    ],
    domainOpen: [2],
    domain: {
      choices: [REAL, [{ tex: "\\{x \\mid x \\ne 0\\}" }], [{ tex: "\\{x \\mid x > 2\\}" }], [{ tex: "\\{x \\mid x \\ne 2\\}" }]],
      answer: 3,
      choiceWhy: [
        "x = 2 이면 분모가 0 이 되어 값을 정할 수 없어요.",
        "분모가 0 이 되는 곳은 x = 0 이 아니라 x = 2 입니다.",
        "x = 1 에서도 y = -1 로 값이 나와요. 2 보다 작아도 됩니다.",
        "",
      ],
    },
    codomain: {
      choices: [[{ tex: "\\{y \\mid y \\ne 2\\}" }], REAL, [{ tex: "\\{y \\mid y \\ne 0\\}" }], [{ tex: "\\{y \\mid y > 0\\}" }]],
      answer: 1,
      choiceWhy: [
        "2 는 x 쪽에서 뺀 값이에요. 공역과는 관계가 없습니다.",
        "",
        "그건 치역이에요. 밝히지 않은 공역은 실수 전체입니다.",
        "공역은 값이 실제로 닿는 곳이 아니라 후보 전체를 가리킵니다.",
      ],
    },
    range: {
      choices: [REAL, [{ tex: "\\{y \\mid y > 0\\}" }], [{ tex: "\\{y \\mid y \\ne 0\\}" }], [{ tex: "\\{y \\mid y \\ne 2\\}" }]],
      answer: 2,
      choiceWhy: [
        "분자가 1 이므로 y = 0 은 결코 나오지 않아요.",
        "x 가 2 보다 작으면 분모가 음수라 y 도 음수가 됩니다.",
        "",
        "2 는 정의역에서 뺀 값이에요. y = 2 는 x = 2.5 에서 실제로 나옵니다.",
      ],
    },
  },
  {
    id: "d4",
    titleTex: "y = \\sqrt{x+3}",
    fx: (x) => (x < -3 ? null : Math.sqrt(x + 3)),
    dom: [-3, 6],
    holes: [],
    rangeSegs: [[0, 3]],
    rangeOpen: [],
    domainSegs: [[-3, 6]],
    domainOpen: [],
    domain: {
      choices: [[{ tex: "\\{x \\mid x \\ge -3\\}" }], REAL, [{ tex: "\\{x \\mid x \\ge 0\\}" }], [{ tex: "\\{x \\mid x > -3\\}" }]],
      answer: 0,
      choiceWhy: [
        "",
        "x = -5 이면 근호 안이 -2 가 되어 실수 범위에서 값이 없어요.",
        "x = -1 이면 근호 안이 2 로 양수라 값이 나옵니다.",
        "x = -3 이면 근호 안이 0 이고 y = 0 이에요. 등호를 빼면 안 됩니다.",
      ],
    },
    codomain: {
      choices: [[{ tex: "\\{y \\mid y \\ge 0\\}" }], NAT, REAL, [{ tex: "\\{y \\mid y \\ge -3\\}" }]],
      answer: 2,
      choiceWhy: [
        "그건 치역이에요. 밝히지 않은 공역은 실수 전체입니다.",
        "자연수로 좁힐 근거가 없어요. 공역은 실수 전체로 봅니다.",
        "",
        "-3 은 x 쪽에서 나온 값이에요. 공역과는 관계가 없습니다.",
      ],
    },
    range: {
      choices: [[{ tex: "\\{y \\mid y \\ge -3\\}" }], [{ tex: "\\{y \\mid y \\ge 0\\}" }], REAL, [{ tex: "\\{y \\mid y > 0\\}" }]],
      answer: 1,
      choiceWhy: [
        "-3 은 정의역의 끝이지 함숫값이 아니에요.",
        "",
        "근호 기호는 음이 아닌 값만 나타냅니다. 음수 y 는 나오지 않아요.",
        "x = -3 에서 y = 0 이 실제로 나옵니다.",
      ],
    },
  },
  {
    id: "d5",
    titleTex: "y = 2x + 1",
    extra: "정의역이 −2 ≤ x ≤ 1 로 정해진 경우",
    fx: (x) => (x < -2 || x > 1 ? null : 2 * x + 1),
    dom: [-2, 1],
    holes: [],
    rangeSegs: [[-3, 3]],
    rangeOpen: [],
    domainSegs: [[-2, 1]],
    domainOpen: [],
    domain: {
      choices: [REAL, [{ tex: "\\{x \\mid x \\ge -2\\}" }], [{ tex: "\\{x \\mid -2 \\le x \\le 1\\}" }], [{ tex: "\\{x \\mid -3 \\le x \\le 3\\}" }]],
      answer: 2,
      choiceWhy: [
        "정의역을 괄호 안에 밝혀 두었어요. 밝혀 두면 그것을 따릅니다.",
        "위쪽 끝 1 도 함께 적어야 해요.",
        "",
        "-3 과 3 은 y 가 움직이는 범위, 곧 치역이에요.",
      ],
    },
    codomain: {
      choices: [REAL, [{ tex: "\\{y \\mid -3 \\le y \\le 3\\}" }], [{ tex: "\\{x \\mid -2 \\le x \\le 1\\}" }], [{ tex: "\\{y \\mid y \\ge -3\\}" }]],
      answer: 0,
      choiceWhy: [
        "",
        "그건 치역이에요. 정의역만 밝혔을 뿐 공역은 밝히지 않았습니다.",
        "그건 정의역이에요. 공역은 y 쪽 집합입니다.",
        "공역을 밝히지 않았으니 실수 전체로 봅니다.",
      ],
    },
    range: {
      choices: [[{ tex: "\\{y \\mid -2 \\le y \\le 1\\}" }], REAL, [{ tex: "\\{y \\mid -1 \\le y \\le 3\\}" }], [{ tex: "\\{y \\mid -3 \\le y \\le 3\\}" }]],
      answer: 3,
      choiceWhy: [
        "그건 x 가 움직이는 범위예요. 양 끝을 식에 넣어 y 를 구해야 합니다.",
        "정의역이 잘려 있으므로 y 도 함께 잘립니다.",
        "왼쪽 끝 x = -2 를 넣으면 y = -3 이에요.",
        "",
      ],
    },
  },
  {
    id: "d6",
    titleTex: "y = 4",
    fx: () => 4,
    dom: [-6, 6],
    holes: [],
    rangeSegs: [[4, 4]],
    rangeOpen: [],
    domainSegs: [[-6, 6]],
    domainOpen: [],
    domain: {
      choices: [[{ tex: "\\{4\\}" }], REAL, [{ tex: "\\{x \\mid x \\ne 4\\}" }], [{ tex: "\\{x \\mid x = 4\\}" }]],
      answer: 1,
      choiceWhy: [
        "4 는 함숫값이에요. x 에는 아무 수나 넣을 수 있습니다.",
        "",
        "x = 4 를 넣어도 y = 4 로 값이 잘 나와요.",
        "x 를 4 로 묶어 둘 까닭이 없습니다. 식에 x 가 아예 없어요.",
      ],
    },
    codomain: {
      choices: [[{ tex: "\\{4\\}" }], [{ tex: "\\{y \\mid y \\ge 4\\}" }], NAT, REAL],
      answer: 3,
      choiceWhy: [
        "그건 치역이에요. 밝히지 않은 공역은 실수 전체입니다.",
        "공역은 값이 닿는 곳이 아니라 후보 전체를 가리켜요.",
        "자연수로 좁힐 근거가 없습니다.",
        "",
      ],
    },
    range: {
      choices: [[{ tex: "\\{4\\}" }], REAL, [{ tex: "\\{y \\mid y \\le 4\\}" }], [{ tex: "\\{y \\mid y \\ge 4\\}" }]],
      answer: 0,
      choiceWhy: [
        "",
        "어떤 x 를 넣어도 값은 늘 4 하나예요.",
        "4 보다 작은 값은 나오지 않습니다.",
        "4 보다 큰 값도 나오지 않아요. 치역의 원소는 딱 하나입니다.",
      ],
    },
  },
];

/** 그래프 창 — 여섯 문제 모두 같은 자를 쓴다 */
export const GV = { size: 268, min: -6, max: 6, pad: 16 };

export function gvX(v: number): number {
  return GV.pad + ((v - GV.min) / (GV.max - GV.min)) * (GV.size - 2 * GV.pad);
}
export function gvY(v: number): number {
  return GV.pad + ((GV.max - v) / (GV.max - GV.min)) * (GV.size - 2 * GV.pad);
}

/**
 * 함수 그래프를 끊어진 조각들로 나누어 표본을 만든다.
 * 창 밖으로 나가는 자리는 창 테두리까지만 선형보간해 그린 뒤 조각을 끊으므로,
 * 만들어지는 좌표는 언제나 그림 상자 안에 들어온다.
 */
export function samplePath(t: DcrTask): string[] {
  const N = 900;
  const lo = Math.max(t.dom[0], GV.min);
  const hi = Math.min(t.dom[1], GV.max);
  const inBox = (y: number) => y >= GV.min && y <= GV.max;
  const pt = (x: number, y: number) => `${gvX(x).toFixed(2)},${gvY(y).toFixed(2)}`;

  const segs: string[] = [];
  let cur: string[] = [];
  let px: number | null = null;
  let py: number | null = null;

  const flush = () => {
    if (cur.length > 1) segs.push("M" + cur.join(" L"));
    cur = [];
  };

  /** 창 안의 xIn 과 창 밖의 xOut 사이에서 테두리를 지나는 자리를 이분법으로 찾는다 */
  const edgePoint = (xIn: number, xOut: number) => {
    let a = xIn;
    let b = xOut;
    for (let k = 0; k < 40; k++) {
      const m = (a + b) / 2;
      const ym = t.fx(m);
      if (ym === null || !Number.isFinite(ym) || !inBox(ym)) b = m;
      else a = m;
    }
    const ya = t.fx(a);
    const y = ya === null || !Number.isFinite(ya) ? GV.min : Math.max(GV.min, Math.min(GV.max, ya));
    return { x: a, y };
  };

  for (let i = 0; i <= N; i++) {
    const x = lo + ((hi - lo) * i) / N;
    const yr = t.fx(x);
    const y = yr === null || !Number.isFinite(yr) ? null : yr;
    const good = y !== null && inBox(y) && (py === null || Math.abs(y - py) <= 6);

    if (good) {
      if (cur.length === 0 && px !== null && py !== null) {
        const e = edgePoint(x, px);
        cur.push(pt(e.x, e.y));
      }
      cur.push(pt(x, y as number));
    } else {
      if (cur.length > 0 && px !== null && py !== null) {
        const e = edgePoint(px, x);
        cur.push(pt(e.x, e.y));
      }
      flush();
    }
    px = x;
    py = y;
  }
  flush();
  return segs;
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 함수의 상등
// ══════════════════════════════════════════════════════════════
export type FnSpec = {
  name: string;
  domain: number[];
  domainTex: string;
  /** null 이면 실수 전체의 집합 */
  codoTex: string | null;
  ruleTex: string;
  fn: (x: number) => number;
};

export type EqualPair = {
  id: string;
  f: FnSpec;
  g: FnSpec;
  sameDomain: boolean;
  sameCodo: boolean;
  /** 두 정의역에 함께 들어 있는 x 마다 함숫값이 같은가 */
  sameRule: boolean;
  equal: boolean;
  why: string;
};

export const EQUAL_PAIRS: EqualPair[] = [
  {
    id: "e1",
    f: { name: "f", domain: [1, 2], domainTex: "\\{1,\\ 2\\}", codoTex: null, ruleTex: "f(x)=x^2", fn: (x) => x * x },
    g: { name: "g", domain: [1, 2], domainTex: "\\{1,\\ 2\\}", codoTex: null, ruleTex: "g(x)=3x-2", fn: (x) => 3 * x - 2 },
    sameDomain: true,
    sameCodo: true,
    sameRule: true,
    equal: true,
    why: "식의 겉모습은 이차식과 일차식으로 전혀 다르지만, 정의역 1 과 2 에서 값이 1 과 4 로 똑같아요. 함수는 식이 아니라 「짝짓기」로 정해집니다.",
  },
  {
    id: "e2",
    f: { name: "f", domain: [-1, 1], domainTex: "\\{-1,\\ 1\\}", codoTex: null, ruleTex: "f(x)=x^3", fn: (x) => x ** 3 },
    g: { name: "g", domain: [-1, 1], domainTex: "\\{-1,\\ 1\\}", codoTex: null, ruleTex: "g(x)=x", fn: (x) => x },
    sameDomain: true,
    sameCodo: true,
    sameRule: true,
    equal: true,
    why: "-1 과 1 은 세제곱해도 자기 자신이에요. 정의역이 이 두 수뿐이라 두 함수가 같아집니다. 정의역을 넓히면 달라져요.",
  },
  {
    id: "e3",
    f: { name: "f", domain: [1, 2], domainTex: "\\{1,\\ 2\\}", codoTex: null, ruleTex: "f(x)=2x", fn: (x) => 2 * x },
    g: { name: "g", domain: [1, 2, 3], domainTex: "\\{1,\\ 2,\\ 3\\}", codoTex: null, ruleTex: "g(x)=2x", fn: (x) => 2 * x },
    sameDomain: false,
    sameCodo: true,
    sameRule: true,
    equal: false,
    why: "식이 완전히 같은데도 다른 함수예요. g 에는 3 이라는 짝이 하나 더 있으니 f 와 같다고 할 수 없습니다.",
  },
  {
    id: "e4",
    f: { name: "f", domain: [1, 2], domainTex: "\\{1,\\ 2\\}", codoTex: null, ruleTex: "f(x)=2x", fn: (x) => 2 * x },
    g: { name: "g", domain: [1, 2], domainTex: "\\{1,\\ 2\\}", codoTex: "\\{2,\\ 4\\}", ruleTex: "g(x)=2x", fn: (x) => 2 * x },
    sameDomain: true,
    sameCodo: false,
    sameRule: true,
    equal: false,
    why: "정의역도 식도 같지만 공역이 달라요. g 는 후보를 2 와 4 로만 두었고 f 는 실수 전체를 두었습니다. 공역도 함수의 구성 요소예요.",
  },
  {
    id: "e5",
    f: { name: "f", domain: [0, 1], domainTex: "\\{0,\\ 1\\}", codoTex: null, ruleTex: "f(x)=\\sqrt{x}", fn: (x) => Math.sqrt(x) },
    g: { name: "g", domain: [0, 1], domainTex: "\\{0,\\ 1\\}", codoTex: null, ruleTex: "g(x)=x", fn: (x) => x },
    sameDomain: true,
    sameCodo: true,
    sameRule: true,
    equal: true,
    why: "0 과 1 은 근호를 씌워도 그대로예요. 근호가 있는 식과 없는 식이 같은 함수가 되는 경우입니다.",
  },
  {
    id: "e6",
    f: { name: "f", domain: [-2, 2], domainTex: "\\{-2,\\ 2\\}", codoTex: null, ruleTex: "f(x)=|x|", fn: (x) => Math.abs(x) },
    g: { name: "g", domain: [-2, 2], domainTex: "\\{-2,\\ 2\\}", codoTex: null, ruleTex: "g(x)=x", fn: (x) => x },
    sameDomain: true,
    sameCodo: true,
    sameRule: false,
    equal: false,
    why: "x = 2 에서는 둘 다 2 라 같지만 x = -2 에서 2 와 -2 로 갈라져요. 정의역의 원소 가운데 딱 하나만 달라도 다른 함수입니다.",
  },
  {
    id: "e7",
    f: { name: "f", domain: [1, 2, 3], domainTex: "\\{1,\\ 2,\\ 3\\}", codoTex: null, ruleTex: "f(x)=x^2-3x+3", fn: (x) => x * x - 3 * x + 3 },
    g: { name: "g", domain: [1, 2, 3], domainTex: "\\{1,\\ 2,\\ 3\\}", codoTex: null, ruleTex: "g(x)=1", fn: () => 1 },
    sameDomain: true,
    sameCodo: true,
    sameRule: false,
    equal: false,
    why: "1 과 2 에서는 값이 나란히 1 이라 속기 쉬워요. 그러나 3 에서 3 과 1 로 갈라집니다. 표를 끝까지 채워 보아야 합니다.",
  },
  {
    id: "e8",
    f: { name: "f", domain: [0, 2], domainTex: "\\{0,\\ 2\\}", codoTex: null, ruleTex: "f(x)=x^2-x", fn: (x) => x * x - x },
    g: { name: "g", domain: [0, 2], domainTex: "\\{0,\\ 2\\}", codoTex: null, ruleTex: "g(x)=x", fn: (x) => x },
    sameDomain: true,
    sameCodo: true,
    sameRule: true,
    equal: true,
    why: "x^2 - x = x 는 x = 0 과 x = 2 에서만 성립해요. 정의역이 바로 그 두 수뿐이라 두 함수가 같아집니다.",
  },
];

export const EQ_ROWS: { key: "domain" | "codo" | "rule"; name: string; ask: string }[] = [
  { key: "domain", name: "정의역", ask: "두 정의역이 같은 집합인가?" },
  { key: "codo", name: "공역", ask: "두 공역이 같은 집합인가?" },
  { key: "rule", name: "대응 관계", ask: "함께 들어 있는 x 마다 함숫값이 같은가?" },
];

// ── a, b 맞추기 챌린지 ────────────────────────────────────────
//   정의역 {2, 3} 에서 f = g 가 되려면 f(x) - g(x) = (x-2)(x-3) 이어야 한다.
//   x^2 + ax + b - (x+1) = x^2 + (a-1)x + (b-1) = x^2 - 5x + 6 이므로 a = -4, b = 7. 해는 하나뿐이다.
export const AB = {
  domain: [2, 3],
  fTex: "f(x)=x^2+ax+b",
  gTex: "g(x)=x+1",
  f: (x: number, a: number, b: number) => x * x + a * x + b,
  g: (x: number) => x + 1,
  aMin: -8,
  aMax: 2,
  bMin: 0,
  bMax: 12,
  aAns: -4,
  bAns: 7,
  view: { xmin: -1, xmax: 6, ymin: -6, ymax: 14, size: 268, pad: 18 },
};

export function abX(v: number): number {
  const { xmin, xmax, size, pad } = AB.view;
  return pad + ((v - xmin) / (xmax - xmin)) * (size - 2 * pad);
}
export function abY(v: number): number {
  const { ymin, ymax, size, pad } = AB.view;
  return pad + ((ymax - v) / (ymax - ymin)) * (size - 2 * pad);
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 일상 속 함수
// ══════════════════════════════════════════════════════════════
export type LifeCase = {
  id: string;
  icon: string;
  from: string;
  to: string;
  rule: string;
  xs: string[];
  ys: string[];
  edges: Edge[];
  isFunc: boolean;
  fail: 0 | 1 | 2 | null;
  why: string;
};

export const LIFE_CASES: LifeCase[] = [
  {
    id: "L1",
    icon: "🎂",
    from: "우리 반 학생",
    to: "달",
    rule: "학생에게 그 학생의 생일이 있는 달을 짝지어 준다",
    xs: ["민서", "지훈", "하윤"],
    ys: ["3월", "7월", "11월"],
    edges: [
      [0, 0],
      [1, 1],
      [2, 0],
    ],
    isFunc: true,
    fail: null,
    why: "생일이 없는 사람도, 생일 달이 두 개인 사람도 없어요. 민서와 하윤이 같은 3월이어도 괜찮습니다.",
  },
  {
    id: "L2",
    icon: "👶",
    from: "어른",
    to: "아이",
    rule: "어른에게 그 사람의 자녀를 짝지어 준다",
    xs: ["윤 씨", "박 씨", "최 씨"],
    ys: ["아이 ㄱ", "아이 ㄴ", "아이 ㄷ"],
    edges: [
      [0, 0],
      [0, 1],
      [2, 2],
    ],
    isFunc: false,
    fail: 2,
    why: "윤 씨는 자녀가 둘이고 박 씨는 자녀가 없어요. 두 조건을 한꺼번에 어깁니다.",
  },
  {
    id: "L3",
    icon: "🏛️",
    from: "나라",
    to: "도시",
    rule: "나라에 그 나라의 수도를 짝지어 준다",
    xs: ["프랑스", "일본", "호주"],
    ys: ["파리", "도쿄", "캔버라"],
    edges: [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    isFunc: true,
    fail: null,
    why: "한 나라의 수도는 정확히 한 곳이에요. 나라마다 빠짐없이 하나씩 정해집니다.",
  },
  {
    id: "L4",
    icon: "🔢",
    from: "자연수",
    to: "자연수",
    rule: "수에 그 수의 약수를 짝지어 준다",
    xs: ["4", "9"],
    ys: ["1", "2", "3", "4", "9"],
    edges: [
      [0, 0],
      [0, 1],
      [0, 3],
      [1, 0],
      [1, 2],
      [1, 4],
    ],
    isFunc: false,
    fail: 1,
    why: "4 의 약수는 1, 2, 4 로 셋이에요. 「약수」가 아니라 「약수의 개수」였다면 함수가 됩니다.",
  },
  {
    id: "L5",
    icon: "🧮",
    from: "자연수",
    to: "자연수",
    rule: "수에 그 수의 약수의 개수를 짝지어 준다",
    xs: ["4", "9", "12"],
    ys: ["3", "6"],
    edges: [
      [0, 0],
      [1, 0],
      [2, 1],
    ],
    isFunc: true,
    fail: null,
    why: "약수는 여럿이지만 그 개수는 언제나 딱 하나로 정해져요. 4 와 9 는 나란히 3 개입니다.",
  },
  {
    id: "L6",
    icon: "👩",
    from: "사람",
    to: "사람",
    rule: "사람에게 그 사람의 어머니를 짝지어 준다",
    xs: ["가은", "나윤", "다온"],
    ys: ["어머니 ㄱ", "어머니 ㄴ"],
    edges: [
      [0, 0],
      [1, 0],
      [2, 1],
    ],
    isFunc: true,
    fail: null,
    why: "누구에게나 어머니는 한 분뿐이에요. 가은과 나윤이 자매라서 같은 곳으로 가도 함수입니다.",
  },
  {
    id: "L7",
    icon: "🎽",
    from: "학생",
    to: "동아리",
    rule: "학생에게 그 학생이 가입한 동아리를 짝지어 준다",
    xs: ["서연", "도윤", "가온"],
    ys: ["밴드부", "농구부", "천문부"],
    edges: [
      [0, 0],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    isFunc: false,
    fail: 1,
    why: "도윤이 두 동아리에 들어 있어요. 「가입할 수 있는 동아리는 하나뿐」이라는 규칙이 있어야 함수가 됩니다.",
  },
  {
    id: "L8",
    icon: "🐶",
    from: "우리 반 학생",
    to: "반려동물",
    rule: "학생에게 그 학생이 기르는 반려동물을 짝지어 준다",
    xs: ["은우", "채원", "시우"],
    ys: ["강아지", "고양이"],
    edges: [
      [0, 0],
      [2, 1],
    ],
    isFunc: false,
    fail: 0,
    why: "채원은 반려동물을 기르지 않아요. 짝을 찾지 못하는 원소가 하나라도 있으면 함수가 아닙니다.",
  },
  {
    id: "L9",
    icon: "🌡️",
    from: "요일",
    to: "기온",
    rule: "요일에 그날의 최고 기온을 짝지어 준다",
    xs: ["월", "화", "수"],
    ys: ["18도", "21도"],
    edges: [
      [0, 0],
      [1, 1],
      [2, 1],
    ],
    isFunc: true,
    fail: null,
    why: "하루의 최고 기온은 하나로 정해져요. 화요일과 수요일이 같은 값이어도 상관없습니다.",
  },
  {
    id: "L10",
    icon: "🎬",
    from: "영화관 좌석",
    to: "관객",
    rule: "좌석에 그 자리에 앉은 관객을 짝지어 준다",
    xs: ["A1", "A2", "A3"],
    ys: ["관객 ㄱ", "관객 ㄴ"],
    edges: [
      [0, 0],
      [2, 1],
    ],
    isFunc: false,
    fail: 0,
    why: "A2 는 빈자리예요. 좌석이 모두 찬 상영관에서라면 이 대응이 함수가 됩니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ⑤ 함수 만들기 챌린지
// ══════════════════════════════════════════════════════════════
export type Mission = {
  id: string;
  xs: string[];
  ys: string[];
  goal: Piece[];
  check: (edges: Edge[], nx: number, ny: number) => boolean;
  hint: string;
  /** 조건을 만족하는 방법의 수 (전수 탐색으로 확인한 값) */
  count: number;
};

export const MISSIONS: Mission[] = [
  {
    id: "m1",
    xs: ["1", "2", "3"],
    ys: ["a", "b", "c"],
    goal: [{ pre: "함수가 되도록 화살표를 이어 보세요." }],
    check: (e, nx) => isFunction(e, nx),
    hint: "왼쪽 세 원소에서 화살표가 하나씩만 나가면 됩니다. 어디로 가든 상관없어요.",
    count: 27,
  },
  {
    id: "m2",
    xs: ["1", "2", "3"],
    ys: ["a", "b", "c"],
    goal: [{ pre: "함수이면서 치역이 공역과 같아지도록 이어 보세요." }],
    check: (e, nx, ny) => isFunction(e, nx) && imageIdx(e).length === ny,
    hint: "오른쪽 세 원소가 모두 화살표를 하나씩 받아야 해요.",
    count: 6,
  },
  {
    id: "m3",
    xs: ["1", "2", "3"],
    ys: ["a", "b", "c"],
    goal: [{ pre: "함수이면서 치역의 원소가 딱 " }, { tex: "1" }, { pre: " 개가 되도록 이어 보세요." }],
    check: (e, nx) => isFunction(e, nx) && imageIdx(e).length === 1,
    hint: "셋을 모두 같은 곳으로 보내면 됩니다. 이런 함수를 상수함수라 불러요.",
    count: 3,
  },
  {
    id: "m4",
    xs: ["1", "2", "3"],
    ys: ["a", "b", "c"],
    goal: [{ pre: "함수가 아니게 하되, 조건 ① 만 어기도록 이어 보세요." }],
    check: (e, nx) => {
      const d = outDeg(e, nx);
      return e.length >= 1 && d.every((v) => v <= 1) && d.some((v) => v === 0);
    },
    hint: "짝이 둘인 원소는 없어야 하고, 짝이 아예 없는 원소가 적어도 하나 있어야 해요. 화살표를 하나도 잇지 않은 것은 셈에 넣지 않습니다.",
    count: 36,
  },
  {
    id: "m5",
    xs: ["1", "2", "3"],
    ys: ["a", "b", "c"],
    goal: [{ pre: "함수가 아니게 하되, 조건 ② 만 어기도록 이어 보세요." }],
    check: (e, nx) => {
      const d = outDeg(e, nx);
      return d.every((v) => v >= 1) && d.some((v) => v >= 2);
    },
    hint: "셋 모두 짝이 있어야 하고, 그 가운데 하나는 짝이 둘 이상이어야 해요.",
    count: 316,
  },
  {
    id: "m6",
    xs: ["1", "2", "3", "4"],
    ys: ["a", "b"],
    goal: [
      { pre: "함수이면서 치역이 " },
      { tex: "\\{a,\\ b\\}" },
      { pre: " 이고 " },
      { tex: "f(1)=f(4)" },
      { pre: " 가 되도록 이어 보세요." },
    ],
    check: (e, nx) => {
      if (!isFunction(e, nx)) return false;
      const m = new Map(e.map(([a, b]) => [a, b]));
      return imageIdx(e).length === 2 && m.get(0) === m.get(3);
    },
    hint: "1 과 4 를 같은 곳으로 보낸 뒤, 2 와 3 으로 남은 한 곳을 채워 보세요.",
    count: 6,
  },
  {
    id: "m7",
    xs: ["1", "2", "3"],
    ys: ["a", "b", "c"],
    goal: [
      { pre: "함수이면서 " },
      { tex: "f(1)=c" },
      { pre: " 이고 치역의 원소가 정확히 " },
      { tex: "2" },
      { pre: " 개가 되도록 이어 보세요." },
    ],
    check: (e, nx) => {
      if (!isFunction(e, nx)) return false;
      const m = new Map(e.map(([a, b]) => [a, b]));
      return m.get(0) === 2 && imageIdx(e).length === 2;
    },
    hint: "1 은 c 로 못 박혀 있어요. 2 와 3 이 만들어 낼 수 있는 치역을 헤아려 보세요.",
    count: 6,
  },
];
