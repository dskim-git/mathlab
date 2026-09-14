// 무리식과 무리함수 — 활동 데이터
//
//  [무리식] 근호 안에 문자가 들어 있는 식 가운데 유리식으로 나타낼 수 없는 식.
//        · 근호가 보여도 근호 안에 문자가 없으면(√7 x − 2, √3/(x+1)) 무리식이 아니다.
//        · 근호 안이 완전제곱이면 근호가 벗겨져 무리식이 아니다.
//          √((x−3)²) = |x−3|, √(9x²) = 3|x| 처럼 절댓값 식이 되어 근호가 사라진다.
//        · 분모에 근호가 있어도( (x+1)/√(2−x) ) 무리식이다.
//
//  [값이 실수가 되는 범위] 무리식은 (근호 안의 값) ≥ 0 이고 (분모의 값) ≠ 0 인 곳에서만 생각한다.
//        · 근호가 분모에 있으면 0 도 안 되므로 부등호에서 등호가 빠진다.
//          √(x−5) 는 x ≥ 5, 1/√(x+3) 은 x > −3 이다.
//        · 조건이 여럿이면 모두 만족하는 공통 범위를 잡는다.
//          √(x+1)/√(6−x) 는 x + 1 ≥ 0 이고 6 − x > 0 이므로 −1 ≤ x < 6 이다.
//
//  [무리식의 계산] a ≥ 0 일 때 (√a)² = a 이고, 모든 실수 a 에 대하여 √(a²) = |a| 이다.
//        a > 0, b > 0 일 때 √a √b = √(ab), √(a²b) = a√b, √a/√b = √(a/b), √(a/b²) = √a/b 이다.
//        여기서 a > 0 이라는 조건이 없으면 √(a²b) = a√b 가 깨진다.
//        a = −2, b = 3 이면 왼쪽은 √12 로 양수인데 오른쪽은 −2√3 으로 음수다. 바르게는 |a|√b 다.
//        b > 0 일 때 a/√b = a√b/b 로 분모를 유리화하고,
//        분모가 두 항이면 켤레를 곱한다. 1/(√5 + √2) = (√5 − √2)/3 이다.
//
//  [무리함수] f(x) 가 x 에 대한 무리식인 함수 y = f(x).
//        정의역이 따로 주어지지 않으면 근호 안의 값이 0 이상이 되는 실수 전체가 정의역이다.
//        y = √(x−3) 은 정의역 x ≥ 3, 치역 y ≥ 0 이고,
//        y = √(x+2) + 3 은 정의역 x ≥ −2, 치역 y ≥ 3 이며,
//        y = −√(x−4) 는 근호 앞의 음의 부호 때문에 치역이 y ≤ 0 으로 뒤집힌다.
//        근호 안의 x 계수가 음수이면(√(8−4x)) 정의역이 x ≤ 2 처럼 왼쪽으로 뻗는다.
//        y = √(x²+9) 처럼 근호 안이 늘 양수이면 정의역이 실수 전체다.
//
//  [일상] 줄 길이가 x m 인 그네가 한 번 왕복하는 데 걸리는 시간은 대략 2√x 초라서
//        주기를 두 배로 하려면 줄을 네 배로 길게 해야 한다.
//        (그림의 그네는 이 주기를 그대로 한 번 왕복하는 데 걸리는 시간으로 삼아 흔들린다.)
//        높이 x m 에서 볼 수 있는 지평선까지의 거리는 대략 3.6√x km 다.
//        높이 x m 인 기둥 꼭대기에서 기둥으로부터 3 m 떨어진 말뚝까지 맨 줄의 길이는
//        피타고라스 정리로 √(x² + 9) m 이고, 근호 안이 늘 양수라 정의역이 실수 전체다.

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

// ══════════════════════════════════════════════════════════════
// 수직선 (탭 ①③ 공용)
// ══════════════════════════════════════════════════════════════
export const LINE = { w: 480, h: 92, left: 36, right: 448, y: 48, x0: -8, x1: 8 };
export const LINE_X = { min: -8, max: 8, step: 0.5 };

export function lineX(x: number): number {
  return LINE.left + ((x - LINE.x0) / (LINE.x1 - LINE.x0)) * (LINE.right - LINE.left);
}
export const LINE_TICKS = Array.from({ length: 17 }, (_, i) => i - 8);

/** 반직선·구간을 함께 나타내는 범위. lo 가 없으면 왼쪽으로, hi 가 없으면 오른쪽으로 뻗는다. */
export type Range = { lo: number | null; loOpen?: boolean; hi: number | null; hiOpen?: boolean };

// ══════════════════════════════════════════════════════════════
// 탭 ① 무리식일까? + 값이 실수가 되는 범위
// ══════════════════════════════════════════════════════════════

export const IRR_CHOICES = ["무리식이다", "무리식이 아니다"];

export type IrrCard = {
  id: string;
  tex: string;
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const IRR_CARDS: IrrCard[] = [
  {
    id: "c1",
    tex: "\\sqrt{x+5}",
    answer: 0,
    choiceWhy: ["", "근호 안에 문자 x 가 있고 근호를 벗길 수도 없어요."],
    why: "근호 안에 문자가 들어 있고 유리식으로 고쳐 쓸 수 없으므로 무리식이에요.",
  },
  {
    id: "c2",
    tex: "\\sqrt{7}\\,x-2",
    answer: 1,
    choiceWhy: ["근호 안에 있는 것은 문자가 아니라 수 7 이에요.", ""],
    why: "√7 은 x 앞에 붙은 계수일 뿐이에요. 근호 안에 문자가 없으므로 그냥 일차식입니다.",
  },
  {
    id: "c5",
    tex: "\\sqrt{x^2+4}",
    answer: 0,
    choiceWhy: ["", "x²+4 는 완전제곱식이 아니라 근호를 벗길 수 없어요."],
    why: "근호 안에 문자가 있고 완전제곱이 아니므로 근호를 벗길 수 없어요. 무리식입니다.",
  },
  {
    id: "c3",
    tex: "\\sqrt{(x-3)^2}",
    answer: 1,
    choiceWhy: ["근호 안이 완전제곱이라 근호가 벗겨집니다.", ""],
    why: "√((x−3)²) = |x−3| 이라 근호가 사라져요. 절댓값 식이 되므로 무리식이 아닙니다.",
  },
  {
    id: "c7",
    tex: "\\dfrac{x+1}{\\sqrt{2-x}}",
    answer: 0,
    choiceWhy: ["", "분모에 있더라도 근호 안에 문자가 있으면 무리식이에요."],
    why: "분모의 근호 안에 문자가 있고 근호를 없앨 수 없으므로 무리식이에요. 분모가 0 이 되면 안 되는 조건도 함께 따라옵니다.",
  },
  {
    id: "c6",
    tex: "\\sqrt{9x^2}",
    answer: 1,
    choiceWhy: ["9x² = (3x)² 이므로 근호가 벗겨집니다.", ""],
    why: "√(9x²) = 3|x| 예요. 근호 안이 완전제곱이라 근호가 사라지므로 무리식이 아닙니다.",
  },
  {
    id: "c4",
    tex: "\\dfrac{1}{\\sqrt{x}-1}",
    answer: 0,
    choiceWhy: ["", "분모에 √x 가 남아 있어 유리식으로 고쳐 쓸 수 없어요."],
    why: "분모에 근호가 붙은 문자가 있어 무리식이에요. 분모를 유리화해도 √x 가 사라지지 않습니다.",
  },
  {
    id: "c8",
    tex: "\\dfrac{\\sqrt{3}}{x+1}",
    answer: 1,
    choiceWhy: ["근호 안에 있는 것은 문자가 아니라 수 3 이에요.", ""],
    why: "√3 은 그냥 하나의 수예요. 근호 안에 문자가 없으므로 분모가 x+1 인 유리식입니다.",
  },
];

export type RangePart = {
  label: string;
  tex: string;
  f: (x: number) => number;
  /** 0 이 되면 안 되면 true (분모 속 근호) */
  strict: boolean;
};

export type RangeTask = {
  id: string;
  tex: string;
  parts: RangePart[];
  range: Range;
  choices: Piece[][];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export function inRange(t: RangeTask, x: number): boolean {
  return t.parts.every((p) => (p.strict ? p.f(x) > 0 : p.f(x) >= 0));
}

export const RANGE_TASKS: RangeTask[] = [
  {
    id: "r1",
    tex: "\\sqrt{x-5}",
    parts: [{ label: "근호 안", tex: "x-5", f: (x) => x - 5, strict: false }],
    range: { lo: 5, hi: null },
    choices: [
      [{ tex: "x\\geq 5" }],
      [{ tex: "x>5" }],
      [{ tex: "x\\leq 5" }],
      [{ tex: "x\\geq -5" }],
    ],
    answer: 0,
    choiceWhy: [
      "",
      "x = 5 이면 근호 안이 0 이라 √0 = 0 으로 실수예요. 등호가 들어갑니다.",
      "부등호의 방향이 반대예요. 근호 안이 0 이상이어야 합니다.",
      "부호를 반대로 보았어요. x − 5 ≥ 0 이면 x ≥ 5 입니다.",
    ],
    why: "근호 안 x − 5 가 0 이상이어야 하므로 x ≥ 5 예요. 근호 안이 0 이어도 값은 0 인 실수라 등호가 들어갑니다.",
  },
  {
    id: "r2",
    tex: "\\sqrt{4-x}",
    parts: [{ label: "근호 안", tex: "4-x", f: (x) => 4 - x, strict: false }],
    range: { lo: null, hi: 4 },
    choices: [
      [{ tex: "x\\geq 4" }],
      [{ tex: "x\\leq -4" }],
      [{ tex: "x\\leq 4" }],
      [{ tex: "x<4" }],
    ],
    answer: 2,
    choiceWhy: [
      "x 가 4 보다 크면 4 − x 가 음수가 돼요.",
      "부호를 잘못 보았어요. 4 − x ≥ 0 이면 x ≤ 4 입니다.",
      "",
      "x = 4 이면 근호 안이 0 이라 실수예요. 등호가 들어갑니다.",
    ],
    why: "근호 안 4 − x 가 0 이상이어야 하므로 x ≤ 4 예요. x 앞에 음의 부호가 있으면 부등호의 방향이 뒤집힙니다.",
  },
  {
    id: "r3",
    tex: "\\dfrac{1}{\\sqrt{x+3}}",
    parts: [{ label: "분모의 근호 안", tex: "x+3", f: (x) => x + 3, strict: true }],
    range: { lo: -3, loOpen: true, hi: null },
    choices: [
      [{ tex: "x\\geq -3" }],
      [{ tex: "x>-3" }],
      [{ tex: "x\\neq -3", post: " 인 실수 전체" }],
      [{ tex: "x>3" }],
    ],
    answer: 1,
    choiceWhy: [
      "x = −3 이면 분모가 √0 = 0 이 되어 나눌 수 없어요. 등호가 빠집니다.",
      "",
      "−3 보다 작은 수를 넣으면 근호 안이 음수가 되어 실수가 아니에요.",
      "부호를 반대로 보았어요. x + 3 > 0 이면 x > −3 입니다.",
    ],
    why: "근호가 분모에 있으므로 x + 3 > 0 이어야 해요. 0 이면 분모가 0 이 되어 안 되므로 등호가 빠집니다.",
  },
  {
    id: "r4",
    tex: "\\dfrac{\\sqrt{x+1}}{\\sqrt{6-x}}",
    parts: [
      { label: "분자의 근호 안", tex: "x+1", f: (x) => x + 1, strict: false },
      { label: "분모의 근호 안", tex: "6-x", f: (x) => 6 - x, strict: true },
    ],
    range: { lo: -1, hi: 6, hiOpen: true },
    choices: [
      [{ tex: "-1\\leq x\\leq 6" }],
      [{ tex: "-1<x<6" }],
      [{ tex: "-1\\leq x<6" }],
      [{ tex: "x\\geq -1" }],
    ],
    answer: 2,
    choiceWhy: [
      "x = 6 이면 분모가 0 이 되어 나눌 수 없어요.",
      "x = −1 이면 분자가 √0 = 0 이라 값이 0 인 실수예요. 왼쪽에는 등호가 들어갑니다.",
      "",
      "분모의 조건도 함께 만족해야 해요. 6 보다 큰 수는 넣을 수 없습니다.",
    ],
    why: "분자 쪽은 x + 1 ≥ 0, 분모 쪽은 6 − x > 0 이어야 하므로 두 조건을 모두 만족하는 −1 ≤ x < 6 이 답이에요.",
  },
  {
    id: "r5",
    tex: "\\sqrt{2x+5}",
    parts: [{ label: "근호 안", tex: "2x+5", f: (x) => 2 * x + 5, strict: false }],
    range: { lo: -2.5, hi: null },
    choices: [
      [{ tex: "x\\geq -5" }],
      [{ tex: "x\\geq \\dfrac{5}{2}" }],
      [{ tex: "x\\geq -\\dfrac{2}{5}" }],
      [{ tex: "x\\geq -\\dfrac{5}{2}" }],
    ],
    answer: 3,
    choiceWhy: [
      "2 로 나누는 것을 잊었어요. 2x ≥ −5 이므로 x ≥ −5/2 입니다.",
      "부호를 반대로 보았어요.",
      "분모와 분자가 뒤바뀌었어요.",
      "",
    ],
    why: "2x + 5 ≥ 0 에서 2x ≥ −5 이므로 x ≥ −5/2 예요. x 의 계수가 1 이 아니면 나누는 것을 잊지 마세요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 무리식 계산소
// ══════════════════════════════════════════════════════════════

export type SqrtProp = {
  id: string;
  no: string;
  title: string;
  lawTex: string;
  cond: string;
  /** 슬라이더 구성 */
  aMin: number;
  aMax: number;
  aStep: number;
  aInit: number;
  bMin: number;
  bMax: number;
  bStep: number;
  bInit: number;
  useB: boolean;
  leftTex: string;
  rightTex: string;
  leftF: (a: number, b: number) => number | null;
  rightF: (a: number, b: number) => number | null;
  note: string;
};

export const PROPS: SqrtProp[] = [
  {
    id: "s1",
    no: "성질 (1)",
    title: "제곱과 근호는 서로를 지운다",
    lawTex: "\\sqrt{a^2}=|a|,\\quad (\\sqrt{a})^2=a",
    cond: "뒤의 식은 a ≥ 0 일 때만",
    aMin: -5,
    aMax: 5,
    aStep: 0.5,
    aInit: 3,
    bMin: 1,
    bMax: 5,
    bStep: 0.5,
    bInit: 2,
    useB: false,
    leftTex: "\\sqrt{a^2}",
    rightTex: "a",
    leftF: (a) => Math.sqrt(a * a),
    rightF: (a) => a,
    note: "a 를 음수로 내려 보세요. √(a²) 는 늘 0 이상이라 a 와 달라집니다. 바른 값은 |a| 예요.",
  },
  {
    id: "s2",
    no: "성질 (2)",
    title: "근호끼리 곱하기",
    lawTex: "\\sqrt{a}\\,\\sqrt{b}=\\sqrt{ab}",
    cond: "a ≥ 0, b ≥ 0",
    aMin: 0,
    aMax: 6,
    aStep: 0.5,
    aInit: 2,
    bMin: 0,
    bMax: 6,
    bStep: 0.5,
    bInit: 3,
    useB: true,
    leftTex: "\\sqrt{a}\\,\\sqrt{b}",
    rightTex: "\\sqrt{ab}",
    leftF: (a, b) => (a < 0 || b < 0 ? null : Math.sqrt(a) * Math.sqrt(b)),
    rightF: (a, b) => (a * b < 0 ? null : Math.sqrt(a * b)),
    note: "두 수가 모두 0 이상이면 언제나 같아요. 근호를 하나로 묶거나 둘로 쪼갤 수 있습니다.",
  },
  {
    id: "s3",
    no: "성질 (3)",
    title: "제곱인 것만 근호 밖으로",
    lawTex: "\\sqrt{a^2 b}=a\\sqrt{b}",
    cond: "a > 0, b > 0 일 때만",
    aMin: -4,
    aMax: 4,
    aStep: 0.5,
    aInit: 2,
    bMin: 0.5,
    bMax: 5,
    bStep: 0.5,
    bInit: 3,
    useB: true,
    leftTex: "\\sqrt{a^2 b}",
    rightTex: "a\\sqrt{b}",
    leftF: (a, b) => (b < 0 ? null : Math.sqrt(a * a * b)),
    rightF: (a, b) => (b < 0 ? null : a * Math.sqrt(b)),
    note: "a 를 음수로 내리면 왼쪽은 양수인데 오른쪽은 음수가 돼요. a > 0 이라는 조건이 꼭 필요합니다.",
  },
  {
    id: "s4",
    no: "성질 (4)",
    title: "분모를 유리화하기",
    lawTex: "\\dfrac{a}{\\sqrt{b}}=\\dfrac{a\\sqrt{b}}{b}",
    cond: "b > 0",
    aMin: -4,
    aMax: 6,
    aStep: 0.5,
    aInit: 3,
    bMin: 0.5,
    bMax: 6,
    bStep: 0.5,
    bInit: 2,
    useB: true,
    leftTex: "\\dfrac{a}{\\sqrt{b}}",
    rightTex: "\\dfrac{a\\sqrt{b}}{b}",
    leftF: (a, b) => (b <= 0 ? null : a / Math.sqrt(b)),
    rightF: (a, b) => (b <= 0 ? null : (a * Math.sqrt(b)) / b),
    note: "위아래에 √b 를 곱한 것뿐이라 값은 그대로예요. 분모에서 근호를 없애면 크기를 어림하기 쉬워집니다.",
  },
];

export type CalcStep = {
  q: string;
  badge: string;
  choices: string[];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export type CalcTask = {
  id: string;
  exprTex: string;
  steps: CalcStep[];
  resultTex: string;
  note: string;
};

export const CALC_TASKS: CalcTask[] = [
  {
    id: "q1",
    exprTex: "(\\sqrt{x+3}-1)(\\sqrt{x+3}+1)",
    steps: [
      {
        badge: "합과 차의 곱",
        q: "합과 차의 곱이므로 앞의 제곱에서 뒤의 제곱을 뺍니다. 앞의 제곱은?",
        choices: ["x+9", "\\sqrt{x+3}", "x+3", "(x+3)^2"],
        answer: 2,
        choiceWhy: [
          "제곱을 근호 안의 수에 하는 것이 아니에요.",
          "근호가 그대로 남으면 안 됩니다. 제곱하면 근호가 벗겨져요.",
          "",
          "근호를 제곱하면 근호만 사라집니다. 다시 제곱하는 것이 아니에요.",
        ],
        why: "x + 3 ≥ 0 이므로 (√(x+3))² = x + 3 이에요. 근호와 제곱이 서로를 지웁니다.",
      },
      {
        badge: "정리",
        q: "이어서 1 을 빼고 정리하면?",
        choices: ["x+2", "x+4", "x-2", "x+3"],
        answer: 0,
        choiceWhy: ["", "1 을 더한 것이 아니라 뺐어요.", "3 을 빼는 것이 아니라 1 을 뺍니다.", "1 을 빼는 것을 잊었어요."],
        why: "(x + 3) − 1² = x + 2 입니다.",
      },
    ],
    resultTex: "x+2",
    note: "x ≥ −3 일 때의 이야기예요.",
  },
  {
    id: "q2",
    exprTex: "\\dfrac{x-9}{\\sqrt{x}-3}",
    steps: [
      {
        badge: "인수분해",
        q: "x = (√x)² 로 보고 분자를 인수분해하면?",
        choices: ["(\\sqrt{x}-3)^2", "(\\sqrt{x}-3)(\\sqrt{x}+3)", "(x-3)(x+3)", "(\\sqrt{x}+9)(\\sqrt{x}-1)"],
        answer: 1,
        choiceWhy: [
          "완전제곱식으로 보면 x − 6√x + 9 가 됩니다.",
          "",
          "전개하면 x² − 9 가 되어 분자와 다릅니다.",
          "전개해 보면 분자와 맞지 않아요.",
        ],
        why: "x − 9 = (√x)² − 3² 이므로 합과 차의 곱 (√x − 3)(√x + 3) 로 쪼갤 수 있어요.",
      },
      {
        badge: "약분",
        q: "약분하면?",
        choices: ["\\sqrt{x}-3", "\\dfrac{1}{\\sqrt{x}+3}", "\\sqrt{x}+3", "x+3"],
        answer: 2,
        choiceWhy: [
          "약분되어 사라지는 쪽이 √x − 3 이에요.",
          "분자가 1 이 아니라 (√x−3)(√x+3) 입니다.",
          "",
          "근호가 사라지지 않아요.",
        ],
        why: "분모의 √x − 3 이 약분되어 √x + 3 만 남습니다.",
      },
    ],
    resultTex: "\\sqrt{x}+3",
    note: "x ≥ 0 이고 x ≠ 9 일 때의 이야기예요.",
  },
  {
    id: "q3",
    exprTex: "\\dfrac{6}{\\sqrt{3}}",
    steps: [
      {
        badge: "유리화",
        q: "분모의 근호를 없애려면 위아래에 무엇을 곱할까요?",
        choices: ["\\sqrt{3}", "3", "\\sqrt{6}", "\\sqrt{3}-1"],
        answer: 0,
        choiceWhy: [
          "",
          "3 을 곱하면 분모가 3√3 이 되어 근호가 그대로 남아요.",
          "√6 을 곱하면 분모가 √18 이 되어 근호가 남습니다.",
          "분모가 한 항뿐이라 켤레를 곱할 필요가 없어요.",
        ],
        why: "√3 × √3 = 3 이 되어 분모에서 근호가 사라집니다.",
      },
      {
        badge: "정리",
        q: "정리하면?",
        choices: ["\\dfrac{\\sqrt{3}}{2}", "3\\sqrt{2}", "2\\sqrt{6}", "2\\sqrt{3}"],
        answer: 3,
        choiceWhy: [
          "분자와 분모가 뒤바뀌었어요.",
          "근호 안의 수가 달라졌습니다.",
          "√3 을 곱했는데 √6 이 나올 수 없어요.",
          "",
        ],
        why: "6√3 / 3 = 2√3 입니다.",
      },
    ],
    resultTex: "2\\sqrt{3}",
    note: "분모에 근호가 없으면 값이 3.46쯤이라는 것을 바로 어림할 수 있어요.",
  },
  {
    id: "q4",
    exprTex: "\\dfrac{1}{\\sqrt{5}+\\sqrt{2}}",
    steps: [
      {
        badge: "켤레",
        q: "분모가 두 항일 때는 켤레를 곱합니다. 위아래에 무엇을 곱할까요?",
        choices: ["\\sqrt{5}+\\sqrt{2}", "\\sqrt{10}", "\\sqrt{5}-\\sqrt{2}", "\\sqrt{3}"],
        answer: 2,
        choiceWhy: [
          "같은 것을 곱하면 분모가 7 + 2√10 이 되어 근호가 남아요.",
          "√10 을 곱해도 분모의 근호가 사라지지 않습니다.",
          "",
          "분모와 상관없는 수예요.",
        ],
        why: "(√5 + √2)(√5 − √2) = 5 − 2 = 3 이 되어 분모에서 근호가 사라집니다.",
      },
      {
        badge: "정리",
        q: "정리하면?",
        choices: ["\\dfrac{\\sqrt{5}-\\sqrt{2}}{7}", "\\dfrac{\\sqrt{5}-\\sqrt{2}}{3}", "\\sqrt{5}-\\sqrt{2}", "\\dfrac{\\sqrt{5}+\\sqrt{2}}{3}"],
        answer: 1,
        choiceWhy: [
          "분모는 5 + 2 가 아니라 5 − 2 예요.",
          "",
          "분모로 3 을 나누는 것을 빠뜨렸어요.",
          "분자는 곱한 켤레 그대로여야 합니다.",
        ],
        why: "분자는 √5 − √2, 분모는 5 − 2 = 3 이므로 (√5 − √2)/3 이에요.",
      },
    ],
    resultTex: "\\dfrac{\\sqrt{5}-\\sqrt{2}}{3}",
    note: "값은 0.26쯤이에요. 유리화하면 어림하기가 훨씬 쉬워집니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 무리함수 기계 — 판별과 정의역·치역
// ══════════════════════════════════════════════════════════════

export const FN_CHOICES = ["무리함수이다", "무리함수가 아니다"];

export type FnCard = {
  id: string;
  tex: string;
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const FN_CARDS: FnCard[] = [
  {
    id: "n1",
    tex: "y=\\sqrt{x+4}",
    answer: 0,
    choiceWhy: ["", "근호 안에 문자가 있고 근호를 벗길 수 없어요."],
    why: "f(x) = √(x+4) 가 무리식이므로 무리함수예요.",
  },
  {
    id: "n3",
    tex: "y=\\sqrt{5}\\,x+1",
    answer: 1,
    choiceWhy: ["근호 안에 있는 것은 문자가 아니라 수 5 예요.", ""],
    why: "√5 는 기울기일 뿐이에요. f(x) 가 일차식이므로 다항함수입니다.",
  },
  {
    id: "n5",
    tex: "y=\\sqrt{x^2+9}",
    answer: 0,
    choiceWhy: ["", "x²+9 는 완전제곱식이 아니라 근호를 벗길 수 없어요."],
    why: "근호를 벗길 수 없으므로 무리함수예요. 근호 안이 늘 양수라 정의역은 실수 전체입니다.",
  },
  {
    id: "n2",
    tex: "y=\\sqrt{(x-2)^2}",
    answer: 1,
    choiceWhy: ["근호 안이 완전제곱이라 근호가 벗겨집니다.", ""],
    why: "√((x−2)²) = |x−2| 라 근호가 사라져요. 그래프도 곡선이 아니라 꺾인 직선입니다.",
  },
  {
    id: "n6",
    tex: "y=-\\sqrt{3-x}",
    answer: 0,
    choiceWhy: ["", "근호 앞의 음의 부호는 근호를 없애 주지 않아요."],
    why: "근호 안에 문자가 있으므로 무리함수예요. 앞의 음의 부호는 값의 부호만 뒤집습니다.",
  },
  {
    id: "n4",
    tex: "y=\\dfrac{1}{\\sqrt{x-1}}",
    answer: 0,
    choiceWhy: ["", "분모에 있더라도 근호 안에 문자가 있으면 무리함수예요."],
    why: "f(x) 가 무리식이므로 무리함수예요. 분모가 0 이 되면 안 되므로 x > 1 만 정의역이 됩니다.",
  },
];

export type DomTask = {
  id: string;
  tex: string;
  /** 근호 안의 식 */
  innerTex: string;
  inner: (x: number) => number;
  /** 함수값 — 정의역 밖이면 null */
  f: (x: number) => number | null;
  domain: Range;
  rangeY: Range;
  choices: Piece[][];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const DOM_TASKS: DomTask[] = [
  {
    id: "d1",
    tex: "y=\\sqrt{x-3}",
    innerTex: "x-3",
    inner: (x) => x - 3,
    f: (x) => (x < 3 ? null : Math.sqrt(x - 3)),
    domain: { lo: 3, hi: null },
    rangeY: { lo: 0, hi: null },
    choices: [
      [{ pre: "정의역 ", tex: "x\\geq 3" }, { pre: ", 치역 ", tex: "y\\geq 0" }],
      [{ pre: "정의역 ", tex: "x\\geq 3" }, { pre: ", 치역 ", tex: "y\\geq 3" }],
      [{ pre: "정의역 ", tex: "x\\geq -3" }, { pre: ", 치역 ", tex: "y\\geq 0" }],
      [{ pre: "정의역과 치역 모두 실수 전체" }],
    ],
    answer: 0,
    choiceWhy: [
      "",
      "근호의 값은 0 부터 시작해요. 3 부터 시작하는 것이 아닙니다.",
      "근호 안 x − 3 이 0 이상이어야 하므로 x ≥ 3 이에요.",
      "근호 안이 음수이면 실수가 아니므로 정의역이 실수 전체일 수 없어요.",
    ],
    why: "근호 안 x − 3 ≥ 0 에서 정의역은 x ≥ 3 이고, 근호의 값은 언제나 0 이상이므로 치역은 y ≥ 0 이에요.",
  },
  {
    id: "d2",
    tex: "y=\\sqrt{x+2}+3",
    innerTex: "x+2",
    inner: (x) => x + 2,
    f: (x) => (x < -2 ? null : Math.sqrt(x + 2) + 3),
    domain: { lo: -2, hi: null },
    rangeY: { lo: 3, hi: null },
    choices: [
      [{ pre: "정의역 ", tex: "x\\geq -2" }, { pre: ", 치역 ", tex: "y\\geq 0" }],
      [{ pre: "정의역 ", tex: "x\\geq 2" }, { pre: ", 치역 ", tex: "y\\geq 3" }],
      [{ pre: "정의역 ", tex: "x\\geq -2" }, { pre: ", 치역 ", tex: "y\\geq 3" }],
      [{ pre: "정의역 ", tex: "x\\geq -3" }, { pre: ", 치역 ", tex: "y\\geq 2" }],
    ],
    answer: 2,
    choiceWhy: [
      "뒤에 더한 3 만큼 값이 모두 올라가요. 치역도 3 부터 시작합니다.",
      "근호 안 x + 2 가 0 이상이어야 하므로 x ≥ −2 예요.",
      "",
      "정의역과 치역에 들어갈 수가 서로 바뀌었어요.",
    ],
    why: "근호 안 x + 2 ≥ 0 에서 정의역은 x ≥ −2 이고, 근호의 값 0 이상에 3 을 더하므로 치역은 y ≥ 3 이에요.",
  },
  {
    id: "d3",
    tex: "y=-\\sqrt{x-4}",
    innerTex: "x-4",
    inner: (x) => x - 4,
    f: (x) => (x < 4 ? null : -Math.sqrt(x - 4)),
    domain: { lo: 4, hi: null },
    rangeY: { lo: null, hi: 0 },
    choices: [
      [{ pre: "정의역 ", tex: "x\\geq 4" }, { pre: ", 치역 ", tex: "y\\geq 0" }],
      [{ pre: "정의역 ", tex: "x\\leq 4" }, { pre: ", 치역 ", tex: "y\\leq 0" }],
      [{ pre: "정의역 ", tex: "x\\geq -4" }, { pre: ", 치역 ", tex: "y\\leq 0" }],
      [{ pre: "정의역 ", tex: "x\\geq 4" }, { pre: ", 치역 ", tex: "y\\leq 0" }],
    ],
    answer: 3,
    choiceWhy: [
      "근호 앞의 음의 부호 때문에 값이 모두 0 이하로 뒤집혀요.",
      "근호 안 x − 4 가 0 이상이어야 하므로 정의역은 x ≥ 4 예요.",
      "부호를 반대로 보았어요. x − 4 ≥ 0 이면 x ≥ 4 입니다.",
      "",
    ],
    why: "정의역은 근호 안 조건으로 x ≥ 4 이고, 앞의 음의 부호가 값을 모두 뒤집으므로 치역은 y ≤ 0 이에요.",
  },
  {
    id: "d4",
    tex: "y=\\sqrt{8-4x}",
    innerTex: "8-4x",
    inner: (x) => 8 - 4 * x,
    f: (x) => (8 - 4 * x < 0 ? null : Math.sqrt(8 - 4 * x)),
    domain: { lo: null, hi: 2 },
    rangeY: { lo: 0, hi: null },
    choices: [
      [{ pre: "정의역 ", tex: "x\\leq 8" }, { pre: ", 치역 ", tex: "y\\geq 0" }],
      [{ pre: "정의역 ", tex: "x\\leq 2" }, { pre: ", 치역 ", tex: "y\\geq 0" }],
      [{ pre: "정의역 ", tex: "x\\geq 2" }, { pre: ", 치역 ", tex: "y\\geq 0" }],
      [{ pre: "정의역 ", tex: "x\\leq 2" }, { pre: ", 치역 ", tex: "y\\leq 0" }],
    ],
    answer: 1,
    choiceWhy: [
      "4 로 나누는 것을 잊었어요. 4x ≤ 8 이므로 x ≤ 2 입니다.",
      "",
      "x 앞이 음수라 부등호의 방향이 뒤집혀요.",
      "근호 앞에 음의 부호가 없으므로 값은 0 이상이에요.",
    ],
    why: "8 − 4x ≥ 0 에서 4x ≤ 8 이므로 정의역은 x ≤ 2 이고, 근호의 값이므로 치역은 y ≥ 0 이에요.",
  },
  {
    id: "d5",
    tex: "y=-\\sqrt{2x+4}+1",
    innerTex: "2x+4",
    inner: (x) => 2 * x + 4,
    f: (x) => (2 * x + 4 < 0 ? null : -Math.sqrt(2 * x + 4) + 1),
    domain: { lo: -2, hi: null },
    rangeY: { lo: null, hi: 1 },
    choices: [
      [{ pre: "정의역 ", tex: "x\\geq -2" }, { pre: ", 치역 ", tex: "y\\leq 1" }],
      [{ pre: "정의역 ", tex: "x\\geq -4" }, { pre: ", 치역 ", tex: "y\\leq 1" }],
      [{ pre: "정의역 ", tex: "x\\geq -2" }, { pre: ", 치역 ", tex: "y\\geq 1" }],
      [{ pre: "정의역 ", tex: "x\\leq -2" }, { pre: ", 치역 ", tex: "y\\leq 1" }],
    ],
    answer: 0,
    choiceWhy: [
      "",
      "2 로 나누는 것을 잊었어요. 2x ≥ −4 이므로 x ≥ −2 입니다.",
      "근호 앞의 음의 부호 때문에 값이 1 보다 커질 수 없어요.",
      "x 앞이 양수라 부등호의 방향이 그대로예요.",
    ],
    why: "2x + 4 ≥ 0 에서 정의역은 x ≥ −2 예요. −√( ) 는 0 이하이고 여기에 1 을 더하므로 치역은 y ≤ 1 입니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 일상생활 속 무리함수
// ══════════════════════════════════════════════════════════════

export const PLOT = { w: 300, h: 220, left: 44, right: 288, top: 24, bottom: 176 };

export type LifeQ = {
  prompt: string;
  choices: Piece[][];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export type LifeCase = {
  id: string;
  icon: string;
  title: string;
  story: string[];
  xLabel: string;
  xUnit: string;
  yLabel: string;
  yUnit: string;
  min: number;
  max: number;
  step: number;
  init: number;
  digits: number;
  valueOf: (x: number) => number;
  fnTex: string;
  xMax: number;
  yMax: number;
  xTicks: number[];
  yTicks: number[];
  xName: string;
  yName: string;
  insight: string;
  qs: LifeQ[];
};

export const LIFE_CASES: LifeCase[] = [
  {
    id: "W1",
    icon: "🛝",
    title: "그네의 한 번 왕복",
    story: ["줄의 길이가 x m 인 그네가 한 번 왔다 갔다 하는 데 걸리는 시간은 대략 2√x 초예요.", "줄이 길어지면 시간도 늘지만, 늘어나는 속도는 점점 느려집니다."],
    xLabel: "줄의 길이 x",
    xUnit: "m",
    yLabel: "한 번 왕복",
    yUnit: "초",
    min: 0.5,
    max: 6,
    step: 0.5,
    init: 1,
    digits: 2,
    valueOf: (x) => 2 * Math.sqrt(x),
    fnTex: "y=2\\sqrt{x}",
    xMax: 6,
    yMax: 6,
    xTicks: [1, 2, 3, 4, 5, 6],
    yTicks: [1, 2, 3, 4, 5, 6],
    xName: "줄의 길이 x (m)",
    yName: "왕복 시간 (초)",
    insight:
      "줄을 두 배로 늘려도 시간은 두 배가 되지 않아요. √2 배, 곧 1.41 배쯤 늘 뿐입니다. 시간을 두 배로 하려면 줄을 네 배로 길게 해야 해요.",
    qs: [
      {
        prompt: "줄의 길이가 x m 일 때 한 번 왕복하는 시간을 나타내는 식은?",
        choices: [[{ tex: "\\sqrt{2x}" }], [{ tex: "2x" }], [{ tex: "\\dfrac{\\sqrt{x}}{2}" }], [{ tex: "2\\sqrt{x}" }]],
        answer: 3,
        choiceWhy: [
          "2 는 근호 밖에 있어요. 근호 안에 넣으면 √(2x) 가 되어 값이 달라집니다.",
          "근호가 빠졌어요. x 가 커질수록 늘어나는 속도가 느려지는 모양이 아닙니다.",
          "2 로 나누는 것이 아니라 곱합니다.",
          "",
        ],
        why: "√x 에 2 를 곱한 2√x 예요. x = 1 이면 2 초, x = 4 이면 4 초가 됩니다.",
      },
      {
        prompt: "한 번 왕복하는 시간을 두 배로 늘리려면 줄의 길이를 몇 배로 해야 할까요?",
        choices: [[{ pre: "2 배" }], [{ pre: "4 배" }], [{ pre: "√2 배" }], [{ pre: "8 배" }]],
        answer: 1,
        choiceWhy: [
          "줄을 두 배로 하면 시간은 √2 배, 곧 1.41 배쯤만 늘어요.",
          "",
          "√2 배로 늘리면 시간은 4제곱근 2 배밖에 늘지 않아요.",
          "여덟 배로 하면 시간이 두 배를 훌쩍 넘습니다.",
        ],
        why: "2√(4x) = 2·2√x 이므로 줄을 네 배로 하면 시간이 정확히 두 배가 돼요. 근호 안에서는 네 배가 밖에서 두 배가 됩니다.",
      },
    ],
  },
  {
    id: "W2",
    icon: "🔭",
    title: "지평선까지의 거리",
    story: ["지구가 둥글기 때문에 높이 올라갈수록 더 멀리까지 보여요.", "높이 x m 에서 볼 수 있는 지평선까지의 거리는 대략 3.6√x km 입니다."],
    xLabel: "높이 x",
    xUnit: "m",
    yLabel: "보이는 거리",
    yUnit: "km",
    min: 0,
    max: 100,
    step: 5,
    init: 25,
    digits: 2,
    valueOf: (x) => 3.6 * Math.sqrt(x),
    fnTex: "y=3.6\\sqrt{x}",
    xMax: 100,
    yMax: 40,
    xTicks: [20, 40, 60, 80, 100],
    yTicks: [10, 20, 30, 40],
    xName: "높이 x (m)",
    yName: "보이는 거리 (km)",
    insight:
      "높이를 네 배로 올려야 보이는 거리가 두 배가 돼요. 처음에는 조금만 올라가도 훅 멀어지지만 갈수록 더디게 늘어납니다. 이것이 무리함수 그래프가 처음에 가파르다가 점점 눕는 까닭이에요.",
    qs: [
      {
        prompt: "높이가 25 m 인 전망대에서 볼 수 있는 거리는?",
        choices: [[{ pre: "약 90 km" }], [{ pre: "약 18 km" }], [{ pre: "약 5 km" }], [{ pre: "약 36 km" }]],
        answer: 1,
        choiceWhy: [
          "근호를 씌우지 않고 25 에 3.6 을 그대로 곱했어요.",
          "",
          "3.6 을 곱하는 것을 잊었어요.",
          "높이 100 m 일 때의 값이에요.",
        ],
        why: "√25 = 5 이므로 3.6 × 5 = 18 km 예요.",
      },
      {
        prompt: "보이는 거리를 두 배로 늘리려면 높이를 어떻게 해야 할까요?",
        choices: [[{ pre: "네 배로 올린다" }], [{ pre: "두 배로 올린다" }], [{ pre: "여덟 배로 올린다" }], [{ pre: "그대로 두어도 된다" }]],
        answer: 0,
        choiceWhy: [
          "",
          "두 배로 올리면 거리는 √2 배, 곧 1.41 배쯤만 늘어나요.",
          "여덟 배는 두 배를 훌쩍 넘습니다.",
          "높이를 바꾸지 않으면 보이는 거리도 그대로예요.",
        ],
        why: "3.6√(4x) = 3.6·2√x 이므로 높이를 네 배로 올려야 거리가 두 배가 돼요. 25 m 에서 18 km 였다면 100 m 에서 36 km 입니다.",
      },
    ],
  },
  {
    id: "W3",
    icon: "⛺",
    title: "텐트를 묶는 줄",
    story: ["높이가 x m 인 기둥의 꼭대기에서 기둥으로부터 3 m 떨어진 말뚝까지 줄을 팽팽하게 묶어요.", "필요한 줄의 길이는 직각삼각형의 빗변이 됩니다."],
    xLabel: "기둥의 높이 x",
    xUnit: "m",
    yLabel: "줄의 길이",
    yUnit: "m",
    min: 0,
    max: 8,
    step: 0.5,
    init: 4,
    digits: 2,
    valueOf: (x) => Math.sqrt(x * x + 9),
    fnTex: "y=\\sqrt{x^2+9}",
    xMax: 8,
    yMax: 10,
    xTicks: [2, 4, 6, 8],
    yTicks: [2, 4, 6, 8, 10],
    xName: "기둥의 높이 x (m)",
    yName: "줄의 길이 (m)",
    insight:
      "기둥이 낮을 때는 줄의 길이가 3 m 근처에서 거의 변하지 않다가, 기둥이 높아질수록 줄의 길이가 기둥의 높이와 거의 같아져요. 근호 안이 늘 양수라 수학만 보면 정의역이 실수 전체지만, 현실에서는 기둥의 높이가 음수일 수 없습니다.",
    qs: [
      {
        prompt: "필요한 줄의 길이를 x 에 대한 식으로 나타내면?",
        choices: [[{ tex: "\\sqrt{x^2+9}" }], [{ tex: "x+3" }], [{ tex: "\\sqrt{x^2-9}" }], [{ tex: "\\sqrt{x+9}" }]],
        answer: 0,
        choiceWhy: [
          "",
          "빗변은 두 변의 합이 아니에요. 두 변을 각각 제곱해 더한 뒤 근호를 씌워야 합니다.",
          "빗변을 구할 때는 두 변의 제곱을 더합니다.",
          "x 를 제곱하는 것을 빠뜨렸어요.",
        ],
        why: "직각을 낀 두 변이 x 와 3 이므로 빗변은 √(x² + 3²) = √(x² + 9) 예요.",
      },
      {
        prompt: "이 식을 함수로만 볼 때(현실 조건을 빼고) 정의역은?",
        choices: [
          [{ tex: "x\\geq 3", post: " 인 실수 전체" }],
          [{ tex: "x\\geq 0", post: " 인 실수 전체" }],
          [{ pre: "실수 전체" }],
          [{ tex: "x\\geq -3", post: " 인 실수 전체" }],
        ],
        answer: 2,
        choiceWhy: [
          "근호 안은 x²+9 예요. x 가 3 보다 작아도 음수가 되지 않습니다.",
          "현실에서는 그렇지만 식만 보면 음수를 넣어도 근호 안이 양수예요.",
          "",
          "x = −5 를 넣어도 근호 안이 34 로 양수라 값이 잘 나옵니다.",
        ],
        why: "x² ≥ 0 이므로 x² + 9 ≥ 9 로 근호 안이 언제나 양수예요. 그래서 정의역이 실수 전체입니다. 다만 현실에서 기둥의 높이는 x ≥ 0 이에요.",
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 그림 치수 — 좌표가 칸 안에 드는지 검증 스크립트가 검사한다
// ══════════════════════════════════════════════════════════════

/** 그네: pivot 에서 줄을 늘어뜨리고 amp 만큼 좌우로 흔든다. */
export const SWING = { w: 200, h: 170, px: 100, py: 26, lenMin: 18, lenMax: 114, amp: 24, bob: 9 };

export function swingLen(x: number, xMax: number): number {
  return SWING.lenMin + (x / xMax) * (SWING.lenMax - SWING.lenMin);
}
/** 최대로 기울었을 때 추의 중심 */
export function swingBob(x: number, xMax: number, sign: 1 | -1) {
  const len = swingLen(x, xMax);
  const th = (SWING.amp * Math.PI) / 180;
  return { x: SWING.px + sign * len * Math.sin(th), y: SWING.py + len * Math.cos(th) };
}

/**
 * 지평선: 반지름 R 인 작은 지구 위 높이 h 인 탑에서 지면에 그은 접선.
 * 중심에서 탑 꼭대기까지가 R + h 이므로 cos α = R/(R+h) 이고
 * 접점은 꼭대기에서 각 α 만큼 돌아간 자리다.
 */
export const HORIZON = { w: 200, h: 170, cx: 100, cy: 150, R: 70, hMin: 10, hMax: 54 };

export function horizonGeom(x: number, xMax: number) {
  const h = HORIZON.hMin + (x / xMax) * (HORIZON.hMax - HORIZON.hMin);
  const d = HORIZON.R + h;
  const cos = HORIZON.R / d;
  const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
  return {
    h,
    /** 탑 꼭대기 */
    tx: HORIZON.cx,
    ty: HORIZON.cy - d,
    /** 접점(지평선) */
    px: HORIZON.cx + HORIZON.R * sin,
    py: HORIZON.cy - HORIZON.R * cos,
    alpha: Math.acos(cos),
  };
}
/** 지평선 너머에 놓는 배 — 접점보다 조금 더 돌아간 자리 */
export function horizonShip(x: number, xMax: number) {
  const g = horizonGeom(x, xMax);
  const a = g.alpha + 0.30;
  return { x: HORIZON.cx + HORIZON.R * Math.sin(a), y: HORIZON.cy - HORIZON.R * Math.cos(a) };
}
