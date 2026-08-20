// 효용함수 — 활동 데이터
//
//  · 효용(Utility): 소비자가 어떤 재화나 서비스를 소비할 때 얻는 주관적인 만족도.
//      1) 효용이 클수록 만족도가 높다.
//      2) 같은 상품이라도 개인마다 만족도가 다르므로 효용은 주관적인 지표다.
//  · 효용함수: 효용을 U, 상품 소비량을 x 라 할 때 x 에 대한 함수로 나타낸 U = f(x).
//  · 일반적으로 효용은 소비량이 늘면 (1) 증가하거나 (2) 증가하다가 감소하는 형태를 띤다.
//  · 한계효용: 한 단위를 더 소비할 때 늘어나는 효용.  MU(n) = U(n) − U(n−1)
//    소비량이 늘수록 한계효용이 점점 작아지는 것을 한계효용 체감의 법칙이라 한다.
//
//  ※ 사례의 식과 수치는 효용함수의 모양을 살펴보기 위해 꾸민 것이다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}

/** 부호를 살려 항을 붙인다 */
export function signed(v: number, d = 2): string {
  return v < 0 ? `- ${fmt(-v, d)}` : `+ ${fmt(v, d)}`;
}

// ══════════════════════════════════════════════════════════════
//  사례 — 여러 모양의 효용함수
// ══════════════════════════════════════════════════════════════
/** quad: U = ax² + bx · root: U = a√x · linear: U = ax */
export type Kind = "quad" | "root" | "linear";

export type UtilCase = {
  id: string;
  emoji: string;
  name: string;
  /** 소비량의 단위 */
  unit: string;
  story: string;
  tone: "emerald" | "sky" | "amber" | "violet";
  kind: Kind;
  a: number;
  b: number;
  xMax: number;
  xStep: number;
  x0: number;
  /** 한계효용 표에 쓸 최대 개수 */
  nMax: number;
  /** 모양 이름 (한글) */
  shape: string;
};

export const CASES: UtilCase[] = [
  {
    id: "pizza",
    emoji: "🍕",
    name: "피자",
    unit: "조각",
    story: "다섯 조각까지는 행복! 그 뒤로는 배가 불러 오히려 힘들어져요.",
    tone: "amber",
    kind: "quad",
    a: -0.5,
    b: 5,
    xMax: 10,
    xStep: 0.25,
    x0: 3,
    nMax: 10,
    shape: "올라갔다 내려오는 곡선",
  },
  {
    id: "movie",
    emoji: "🎬",
    name: "영화",
    unit: "편",
    story: "많이 볼수록 좋지만, 늘어나는 폭은 점점 작아져요.",
    tone: "sky",
    kind: "root",
    a: 4,
    b: 0,
    xMax: 16,
    xStep: 0.5,
    x0: 4,
    nMax: 9,
    shape: "계속 올라가되 완만해지는 곡선",
  },
  {
    id: "song",
    emoji: "🎵",
    name: "최애 노래",
    unit: "번",
    story: "아무리 들어도 질리지 않아요. 한 번 들을 때마다 똑같이 좋아요.",
    tone: "emerald",
    kind: "linear",
    a: 2,
    b: 0,
    xMax: 10,
    xStep: 0.5,
    x0: 4,
    nMax: 10,
    shape: "원점을 지나는 직선",
  },
  {
    id: "spicy",
    emoji: "🌶️",
    name: "매운 떡볶이",
    unit: "입",
    story: "두 입까지가 딱! 그 뒤로는 너무 매워서 만족도가 뚝 떨어져요.",
    tone: "violet",
    kind: "quad",
    a: -1,
    b: 4,
    xMax: 5,
    xStep: 0.25,
    x0: 2,
    nMax: 5,
    shape: "금방 꺾여 내려오는 곡선",
  },
];

export function caseOf(id: string): UtilCase {
  return CASES.find((c) => c.id === id) ?? CASES[0];
}

/** 소비량 x 에서의 효용 */
export function uOf(c: UtilCase, x: number): number {
  if (c.kind === "root") return c.a * Math.sqrt(Math.max(0, x));
  if (c.kind === "linear") return c.a * x;
  return c.a * x * x + c.b * x;
}

/** 한계효용 —  n 번째 한 단위를 더 소비할 때 늘어나는 효용 */
export function muOf(c: UtilCase, n: number): number {
  return uOf(c, n) - uOf(c, n - 1);
}

/** 효용이 가장 커지는 소비량 (이차형만) */
export function peakOf(c: UtilCase): { x: number; u: number } | null {
  if (c.kind !== "quad" || c.a >= 0) return null;
  const x = -c.b / (2 * c.a);
  return { x, u: uOf(c, x) };
}

/** 구간 안에서의 최대·최소 효용 */
export function uRange(c: UtilCase): { lo: number; hi: number } {
  let lo = 0,
    hi = 0;
  for (let i = 0; i <= 200; i++) {
    const u = uOf(c, (i / 200) * c.xMax);
    lo = Math.min(lo, u);
    hi = Math.max(hi, u);
  }
  return { lo, hi };
}

/** 계수 1, -1 은 생략해 적는다 (x^2 / -x^2) */
function coefVar(a: number): string {
  return a === 1 ? "" : a === -1 ? "-" : fmt(a);
}
/** 값을 대입할 때의 계수 (1, -1 은 곱셈 기호도 생략) */
function coefMul(a: number): string {
  return a === 1 ? "" : a === -1 ? "-" : `${fmt(a)} \\times `;
}
/** 부호가 붙은 뒷항 */
function tailTerm(b: number, tail: string, mul: boolean): string {
  if (b === 0) return "";
  const sign = b < 0 ? "-" : "+";
  const m = Math.abs(b);
  const head = m === 1 ? "" : mul ? `${fmt(m)} \\times ` : fmt(m);
  return ` ${sign} ${head}${tail}`;
}

/** 효용함수의 식 (KaTeX) */
export function fnTex(c: UtilCase): string {
  if (c.kind === "root") return `U = ${coefVar(c.a)}\\sqrt{x}`;
  if (c.kind === "linear") return `U = ${coefVar(c.a)}x`;
  return `U = ${coefVar(c.a)}x^2${tailTerm(c.b, "x", false)}`;
}

/** 값을 넣어 계산하는 과정 (KaTeX) */
export function substTex(c: UtilCase, x: number): string {
  const u = fmt(uOf(c, x), 2);
  if (c.kind === "root") return `U = ${coefVar(c.a)}\\sqrt{${fmt(x)}} = ${u}`;
  if (c.kind === "linear") return `U = ${coefMul(c.a)}${fmt(x)} = ${u}`;
  return `U = ${coefMul(c.a)}${fmt(x)}^2${tailTerm(c.b, fmt(x), true)} = ${u}`;
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 나의 효용 곡선 그리기
// ══════════════════════════════════════════════════════════════
export type DrawItem = { id: string; emoji: string; name: string; unit: string };

export const DRAW_ITEMS: DrawItem[] = [
  { id: "berry", emoji: "🍓", name: "딸기", unit: "개" },
  { id: "choco", emoji: "🍫", name: "초콜릿", unit: "조각" },
  { id: "soda", emoji: "🥤", name: "탄산음료", unit: "컵" },
  { id: "ramen", emoji: "🍜", name: "라면", unit: "그릇" },
];

export const DRAW_NMAX = 6;
export const DRAW_UMAX = 10;
export const DRAW_STEP = 0.5;

/** 견주어 볼 친구들의 곡선 (index = 소비량 0 ~ 6) */
export const FRIENDS: { id: string; emoji: string; name: string; color: string; note: string; values: number[] }[] = [
  {
    id: "a",
    emoji: "🧑‍🎤",
    name: "친구 A",
    color: "#38bdf8",
    note: "처음이 가장 좋고 금방 배가 불러요 — 한계효용 체감이 뚜렷해요.",
    values: [0, 3, 5, 6, 6.5, 6.5, 6],
  },
  {
    id: "b",
    emoji: "🧑‍🍳",
    name: "친구 B",
    color: "#fbbf24",
    note: "몇 개를 먹든 똑같이 좋아요 — 한계효용이 변하지 않아요.",
    values: [0, 1.5, 3, 4.5, 6, 7.5, 9],
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 단계별 문제
// ══════════════════════════════════════════════════════════════
export type Choice = { text?: string; tex?: string };

export type PStep =
  | {
      kind: "number";
      id: string;
      ask: string;
      tex?: string;
      hint: string;
      answer: number;
      suffix: string;
      explain: string;
      tol?: number;
    }
  | { kind: "choice"; id: string; ask: string; tex?: string; hint: string; options: Choice[]; answer: number; explain: string };

export type Problem = {
  id: string;
  emoji: string;
  title: string;
  scenario: string;
  tex?: string;
  /** 식이 둘 이상일 때 — 라벨(한글)은 HTML 로 두고 식만 KaTeX 로 */
  texList?: { label: string; tex: string }[];
  table?: { head: string[]; rows: string[][] };
  steps: PStep[];
  wrapUp: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "u1",
    emoji: "🧋",
    title: "문제 1 · 무리함수 꼴 효용함수",
    scenario:
      "어떤 학생이 마시는 버블티의 소비량을 x, 효용을 U라고 할 때, 버블티에 대한 이 학생의 효용함수가 다음과 같다고 한다.",
    tex: "U = \\sqrt{8x}",
    steps: [
      {
        kind: "number",
        id: "u1s1",
        ask: "소비량이 2일 때의 효용을 구하세요.",
        tex: "U = \\sqrt{8 \\times 2}",
        hint: "√16",
        answer: 4,
        suffix: "",
        explain: "√16 = 4 예요.",
      },
      {
        kind: "number",
        id: "u1s2",
        ask: "소비량이 8일 때의 효용을 구하세요.",
        tex: "U = \\sqrt{8 \\times 8}",
        hint: "√64",
        answer: 8,
        suffix: "",
        explain: "√64 = 8 이에요.",
      },
      {
        kind: "choice",
        id: "u1s3",
        ask: "소비량이 2에서 8로 4배가 되었어요. 효용은 몇 배가 되었나요?",
        hint: "4에서 8로 바뀌었어요.",
        options: [{ text: "4배" }, { text: "2배" }, { text: "8배" }, { text: "그대로" }],
        answer: 1,
        explain:
          "2배예요. 소비량을 4배로 늘려도 만족도는 2배밖에 커지지 않아요. 이것이 효용이 완만하게 늘어나는 모습이에요.",
      },
      {
        kind: "number",
        id: "u1s4",
        ask: "효용이 12가 되게 하려면 소비량이 얼마여야 할까요?",
        tex: "\\sqrt{8x} = 12",
        hint: "양변을 제곱하면 8x = 144",
        answer: 18,
        suffix: "",
        explain: "8x = 144 → x = 18 이에요.",
      },
    ],
    wrapUp:
      "무리함수 꼴의 효용함수는 소비량이 늘수록 효용이 계속 커지지만, 늘어나는 폭은 점점 작아져요. 한계효용 체감의 대표적인 모습입니다.",
  },
  {
    id: "u2",
    emoji: "🍰",
    title: "문제 2 · 이차함수 꼴 효용함수",
    scenario:
      "어떤 사람이 먹는 케이크의 소비량을 x, 효용을 U라고 할 때, 케이크에 대한 이 사람의 효용함수가 다음과 같다고 한다.",
    tex: "U = -x^2 + 12x",
    steps: [
      {
        kind: "number",
        id: "u2s1",
        ask: "소비량이 4일 때의 효용을 구하세요.",
        tex: "U = -4^2 + 12 \\times 4",
        hint: "−16 + 48",
        answer: 32,
        suffix: "",
        explain: "−16 + 48 = 32 예요.",
      },
      {
        kind: "number",
        id: "u2s2",
        ask: "효용이 가장 커지는 소비량은 얼마일까요?",
        tex: "U = -(x - 6)^2 + 36",
        hint: "완전제곱식으로 고쳐 꼭짓점을 찾아보세요.",
        answer: 6,
        suffix: "",
        explain: "U = −(x − 6)² + 36 이므로 x = 6 에서 가장 커요.",
      },
      {
        kind: "number",
        id: "u2s3",
        ask: "그때의 효용은 얼마일까요?",
        tex: "U = -6^2 + 12 \\times 6",
        hint: "−36 + 72",
        answer: 36,
        suffix: "",
        explain: "36 이에요. 여섯 조각을 넘게 먹으면 오히려 만족도가 떨어져요.",
      },
      {
        kind: "number",
        id: "u2s4",
        ask: "효용이 0이 되는 소비량은 얼마일까요? (0이 아닌 값)",
        tex: "-x^2 + 12x = 0",
        hint: "x(12 − x) = 0",
        answer: 12,
        suffix: "",
        explain: "x = 12. 열두 조각을 먹으면 만족도가 먹기 전과 같아진다는 뜻이에요.",
      },
    ],
    wrapUp:
      "이차함수 꼴의 효용함수는 어느 지점까지는 만족도가 커지다가 그 뒤로는 줄어들어요. 꼭짓점이 바로 가장 만족스러운 소비량입니다.",
  },
  {
    id: "u3",
    emoji: "🍬",
    title: "문제 3 · 표에서 한계효용 읽기",
    scenario:
      "다음 표는 어떤 학생이 사탕을 먹을 때, 먹는 개수에 따른 효용을 나타낸 것이다. 한계효용은 한 개를 더 먹을 때 늘어나는 효용을 뜻한다.",
    table: {
      head: ["사탕 (개)", "0", "1", "2", "3", "4", "5"],
      rows: [["효용 U", "0", "6", "10", "13", "15", "16"]],
    },
    steps: [
      {
        kind: "number",
        id: "u3s1",
        ask: "세 번째 사탕을 먹을 때의 한계효용을 구하세요.",
        tex: "MU(3) = U(3) - U(2)",
        hint: "13 − 10",
        answer: 3,
        suffix: "",
        explain: "13 − 10 = 3 이에요. 세 번째 사탕은 3만큼의 만족을 더해 줍니다.",
      },
      {
        kind: "number",
        id: "u3s2",
        ask: "첫 번째부터 다섯 번째까지의 한계효용을 모두 더하면 얼마일까요?",
        tex: "6 + 4 + 3 + 2 + 1",
        hint: "한계효용을 모두 더하면 총효용이 돼요.",
        answer: 16,
        suffix: "",
        explain: "6 + 4 + 3 + 2 + 1 = 16. 5개를 먹었을 때의 총효용과 같아요!",
      },
      {
        kind: "choice",
        id: "u3s3",
        ask: "사탕을 하나씩 더 먹을 때 한계효용은 어떻게 달라지나요?",
        hint: "6, 4, 3, 2, 1 …",
        options: [
          { text: "점점 커진다" },
          { text: "변하지 않는다" },
          { text: "점점 작아진다" },
          { text: "커졌다 작아졌다 한다" },
        ],
        answer: 2,
        explain: "점점 작아져요. 이것을 한계효용 체감의 법칙이라고 합니다.",
      },
      {
        kind: "number",
        id: "u3s4",
        ask: "여섯 번째 사탕의 한계효용이 0이라면, 6개를 먹었을 때의 총효용은 얼마일까요?",
        tex: "U(6) = U(5) + MU(6)",
        hint: "16 + 0",
        answer: 16,
        suffix: "",
        explain: "16 + 0 = 16. 한계효용이 0이 되는 순간 총효용이 가장 커져요.",
      },
    ],
    wrapUp:
      "한계효용을 모두 더하면 총효용이 되고, 한계효용이 0이 되는 지점에서 총효용이 가장 커요. 그 뒤로 한계효용이 음수가 되면 더 먹을수록 손해입니다.",
  },
  {
    id: "u4",
    emoji: "👥",
    title: "문제 4 · 같은 상품, 다른 만족도",
    scenario:
      "같은 아이스크림을 두고도 사람마다 느끼는 만족도는 다르다. 소비량을 x라 할 때 두 사람의 효용함수가 각각 다음과 같다고 한다.",
    texList: [
      { label: "지우", tex: "U = 6\\sqrt{x}" },
      { label: "하준", tex: "U = 3x" },
    ],
    steps: [
      {
        kind: "number",
        id: "u4s1",
        ask: "소비량이 1일 때 지우의 효용을 구하세요.",
        tex: "U = 6\\sqrt{1}",
        hint: "6 × 1",
        answer: 6,
        suffix: "",
        explain: "6 이에요. 이때 하준이의 효용은 3 × 1 = 3 이니 지우가 더 만족하죠.",
      },
      {
        kind: "number",
        id: "u4s2",
        ask: "소비량이 4일 때 두 사람의 효용은 같아져요. 그 값은 얼마일까요?",
        tex: "6\\sqrt{4} \\quad \\text{vs} \\quad 3 \\times 4",
        hint: "6 × 2 와 3 × 4",
        answer: 12,
        suffix: "",
        explain: "지우는 6 × 2 = 12, 하준이는 3 × 4 = 12 로 같아요.",
      },
      {
        kind: "choice",
        id: "u4s3",
        ask: "소비량이 9일 때는 누가 더 만족할까요?",
        tex: "6\\sqrt{9} \\quad \\text{vs} \\quad 3 \\times 9",
        hint: "18 과 27 을 비교해 보세요.",
        options: [{ text: "지우" }, { text: "하준" }, { text: "두 사람이 같다" }],
        answer: 1,
        explain: "지우는 18, 하준이는 27 이므로 하준이가 더 만족해요.",
      },
      {
        kind: "choice",
        id: "u4s4",
        ask: "이 결과가 말해 주는 것은 무엇일까요?",
        hint: "같은 아이스크림인데 결과가 사람마다 달랐어요.",
        options: [
          { text: "지우가 하준이보다 아이스크림을 싫어한다" },
          { text: "효용은 언제나 소비량에 비례한다" },
          { text: "같은 상품이라도 사람마다 만족도가 달라 효용은 주관적인 지표다" },
          { text: "효용함수는 늘 무리함수여야 한다" },
        ],
        answer: 2,
        explain:
          "효용은 주관적인 지표예요. 그래서 같은 상품이라도 사람마다 효용함수의 모양이 다르고, 소비량에 따라 누가 더 만족하는지도 달라집니다.",
      },
    ],
    wrapUp:
      "효용은 사람의 마음속 만족도를 나타내는 주관적인 지표예요. 지우는 처음 한 개에서 큰 만족을 얻지만 금방 완만해지고, 하준이는 먹을수록 꾸준히 만족이 커집니다.",
  },
];
