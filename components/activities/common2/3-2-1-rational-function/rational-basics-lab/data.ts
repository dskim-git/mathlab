// 유리식과 유리함수 — 활동 데이터
//
//  [다항식] 한 개 또는 두 개 이상의 항의 합으로 이루어진 식. 계수는 실수이므로 √2 x + 1 처럼
//        계수가 무리수여도 다항식이고, −6 이나 2/√3 같은 상수도 항이 하나뿐인 다항식이다.
//
//  [유리식] 두 다항식 A, B (B ≠ 0) 에 대하여 A/B 꼴로 나타나는 식.
//        다항식 A 는 모두 A/1 로 쓸 수 있으므로 모든 다항식은 유리식이다. 거꾸로는 아니다.
//        분모에 문자가 있으면(예: 5/x) 다항식이 아닌 유리식이다.
//        분모가 상수이면(예: (2x−5)/7) 각 항을 그 상수로 나눈 다항식과 같으므로 다항식이다.
//        √x + 1, √(2x−1), 2^x 처럼 문자가 근호 안이나 지수 자리에 있으면 두 다항식의 비로
//        나타낼 수 없으므로 유리식이 아니다.
//        (x²−9)/(x−3) 은 약분하면 x+3 이지만 x = 3 에서 값이 없으므로 다항식 x+3 과 같은 식이 아니다.
//        포함 관계는 상수 ⊂ 다항식 ⊂ 유리식 ⊂ 식 이다.
//
//  [유리식의 성질] 세 다항식 A, B, C (C ≠ 0) 에 대하여
//        (1) A/B = (A×C)/(B×C)    (2) A/B = (A÷C)/(B÷C)    (단 B ≠ 0)
//        (3) A/C + B/C = (A+B)/C  (4) A/C − B/C = (A−B)/C
//        (1)(2) 가 통분과 약분의 근거다. 다만 곱하거나 나누는 C 가 0 이 되는 자리에서는
//        두 식 가운데 한쪽이 값을 잃으므로 그 자리에서는 "값이 같다"고 말할 수 없다.
//        보기를 들면 (x²−4)/(x²+2x) 와 (x−2)/x 는 x = −2 에서만 갈린다.
//
//  [유리함수] f(x) 가 유리식인 함수 y = f(x). f(x) 가 x 에 대한 다항식이면 다항함수라 한다.
//        모든 다항함수는 유리함수이고, 상수함수 ⊂ 다항함수 ⊂ 유리함수 ⊂ 함수 이다.
//
//  [정의역] 정의역이 따로 주어지지 않으면 분모가 0 이 되지 않는 실수 전체의 집합을 정의역으로 본다.
//        다항함수는 분모가 상수이므로 정의역이 실수 전체다.
//        6/(x²+1) 처럼 분모에 문자가 있어도 분모가 0 이 될 수 없으면 정의역은 실수 전체다.
//        2/(x²−6x+9) = 2/(x−3)² 은 분모가 중근을 가지므로 빼는 수가 x = 3 하나뿐이다.
//
//  [일상의 유리함수] 공책 x 권을 1200x + 2500 원에 살 때 한 권당 값은 (1200x+2500)/x 원이고
//        x 가 커질수록 1200 원에 가까워진다.
//        소금 60 g 이 든 소금물 240 g 에 물 x g 을 더 부으면 농도는 6000/(240+x) % 다.
//        갈 때 시속 4 km, 올 때 시속 x km 로 왕복하면 평균 속력은 8x/(x+4) km/h 이므로
//        올 때 아무리 빨리 달려도 시속 8 km 를 넘지 못한다.

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

// ══════════════════════════════════════════════════════════════
// 탭 ① 식의 나라 지도 — 다항식 · 유리식 · 그 밖의 식
// ══════════════════════════════════════════════════════════════

export type Zone = "outer" | "rational" | "poly" | "const";

/** 중첩 상자 지도 — 고른 식(함수)이 앉는 고리가 빛난다. 탭 ① 과 ③ 이 이름만 바꿔 함께 쓴다. */
export const MAP = {
  w: 360,
  h: 200,
  boxes: [
    { key: "outer" as Zone, label: "식", x: 8, y: 26, w: 344, h: 166, lx: 16, ly: 46 },
    { key: "rational" as Zone, label: "유리식", x: 80, y: 48, w: 260, h: 132, lx: 88, ly: 68 },
    { key: "poly" as Zone, label: "다항식", x: 152, y: 70, w: 176, h: 98, lx: 160, ly: 90 },
    { key: "const" as Zone, label: "상수", x: 222, y: 92, w: 94, h: 64, lx: 230, ly: 112 },
  ],
};

/** 이름표 글자 크기 — 상자를 벗어나지 않는지 검증 스크립트가 검사한다. */
export const MAP_LABEL_FS = 15;

/** 함수 쪽 지도(탭 ③)는 같은 자리에 이름만 바꿔 쓴다. */
export const FN_MAP_LABELS: Record<Zone, string> = {
  outer: "함수",
  rational: "유리함수",
  poly: "다항함수",
  const: "상수함수",
};

/** 세 갈래 판정 — 0: 다항식, 1: 다항식이 아닌 유리식, 2: 유리식이 아닌 식 */
export const EXPR_CHOICES = ["다항식", "다항식이 아닌 유리식", "유리식이 아닌 식"];

export type ExprCard = {
  id: string;
  tex: string;
  zone: Zone;
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const EXPR_CARDS: ExprCard[] = [
  {
    id: "e3",
    tex: "\\sqrt{x}+1",
    zone: "outer",
    answer: 2,
    choiceWhy: [
      "항의 합으로 보이지만 문자가 근호 안에 들어 있어 다항식이 아니에요.",
      "두 다항식의 비로 고쳐 쓸 수 없어요.",
      "",
    ],
    why: "문자 x 가 근호 안에 있습니다. 이런 식은 두 다항식의 비로 나타낼 수 없으므로 유리식이 아니에요.",
  },
  {
    id: "e2",
    tex: "x^3-2x+6",
    zone: "poly",
    answer: 0,
    choiceWhy: [
      "",
      "분모에 문자가 없으므로 다항식이 맞아요.",
      "다항식은 모두 유리식이기도 합니다.",
    ],
    why: "세 항의 합이므로 다항식입니다. 모든 다항식은 분모가 1 인 유리식이기도 해요.",
  },
  {
    id: "e1",
    tex: "\\dfrac{5}{x}",
    zone: "rational",
    answer: 1,
    choiceWhy: [
      "분모에 문자 x 가 있으면 항의 합으로 고쳐 쓸 수 없어요.",
      "",
      "분자 5 와 분모 x 가 모두 다항식이므로 유리식은 맞습니다.",
    ],
    why: "분자 5, 분모 x 가 모두 다항식이므로 유리식이고, 분모에 문자가 있으므로 다항식은 아니에요.",
  },
  {
    id: "e6",
    tex: "-6",
    zone: "const",
    answer: 0,
    choiceWhy: [
      "",
      "분모에 문자가 없어요. 상수는 다항식입니다.",
      "상수도 −6/1 로 쓸 수 있으므로 유리식이에요.",
    ],
    why: "항이 하나뿐인 다항식, 곧 상수예요. 가장 안쪽 고리에 앉습니다.",
  },
  {
    id: "e5",
    tex: "\\dfrac{x+3}{x-4}",
    zone: "rational",
    answer: 1,
    choiceWhy: [
      "분모 x−4 에 문자가 있어 항의 합으로 풀어 쓸 수 없어요.",
      "",
      "분자와 분모가 모두 다항식이므로 유리식입니다.",
    ],
    why: "분자 x+3, 분모 x−4 가 모두 다항식이므로 유리식이고, 분모에 문자가 있으므로 다항식은 아니에요.",
  },
  {
    id: "e12",
    tex: "\\sqrt{2x-1}",
    zone: "outer",
    answer: 2,
    choiceWhy: [
      "문자가 근호 안에 있으므로 항의 합이 아니에요.",
      "분수 꼴로 고쳐 써도 근호는 사라지지 않아요.",
      "",
    ],
    why: "근호 안에 문자가 들어 있어 두 다항식의 비로 나타낼 수 없습니다. 유리식이 아닌 식이에요.",
  },
  {
    id: "e4",
    tex: "\\dfrac{2x-5}{7}",
    zone: "poly",
    answer: 0,
    choiceWhy: [
      "",
      "분모가 상수 7 이라 각 항을 7 로 나눈 다항식과 같아요.",
      "분자와 분모가 모두 다항식이므로 유리식이기도 합니다.",
    ],
    why: "분모가 상수 7 이므로 각 항을 7 로 나누면 항의 합이 됩니다. 분수 꼴로 보이지만 다항식이에요.",
  },
  {
    id: "e7",
    tex: "\\dfrac{x}{x^2+1}",
    zone: "rational",
    answer: 1,
    choiceWhy: [
      "분모 x²+1 은 0 이 되지 않지만, 문자가 들어 있어 다항식은 아니에요.",
      "",
      "분자 x 와 분모 x²+1 이 모두 다항식이므로 유리식입니다.",
    ],
    why: "분모 x²+1 은 어떤 실수를 넣어도 0 이 되지 않아요. 그래도 분모에 문자가 있으므로 다항식이 아닌 유리식입니다.",
  },
  {
    id: "e11",
    tex: "\\dfrac{2}{\\sqrt{3}}",
    zone: "const",
    answer: 0,
    choiceWhy: [
      "",
      "분모의 √3 은 문자가 아니라 정해진 수예요.",
      "근호가 보여도 문자가 없으므로 그냥 하나의 수입니다.",
    ],
    why: "√3 은 문자가 아니라 정해진 수라서 2/√3 도 하나의 상수예요. 상수는 다항식의 가장 단순한 경우입니다.",
  },
  {
    id: "e8",
    tex: "2^{x}",
    zone: "outer",
    answer: 2,
    choiceWhy: [
      "문자가 지수 자리에 있어 항의 합이 아니에요.",
      "두 다항식의 비로 고쳐 쓸 수 없어요.",
      "",
    ],
    why: "문자 x 가 지수 자리에 있습니다. 다항식의 꼴도 아니고 두 다항식의 비로도 나타낼 수 없어요.",
  },
  {
    id: "e9",
    tex: "\\sqrt{2}\\,x+1",
    zone: "poly",
    answer: 0,
    choiceWhy: [
      "",
      "분모에 문자가 없어요. 계수가 무리수여도 다항식입니다.",
      "다항식이므로 유리식이기도 해요.",
    ],
    why: "√2 는 문자가 아니라 x 앞에 붙은 계수예요. 계수가 무리수여도 항의 합이므로 다항식입니다.",
  },
  {
    id: "e10",
    tex: "\\dfrac{x^2-9}{x-3}",
    zone: "rational",
    answer: 1,
    choiceWhy: [
      "약분하면 x+3 이 되지만 x = 3 에서 값이 없어 다항식 x+3 과 같은 식은 아니에요.",
      "",
      "분자와 분모가 모두 다항식이므로 유리식입니다.",
    ],
    why: "약분하면 x+3 이 되지만 x = 3 에서는 값이 없으므로 다항식 x+3 과 같은 식이 아니에요. 분모에 문자가 있으므로 다항식이 아닌 유리식입니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 유리식의 성질 실험대 + 단계별 계산
// ══════════════════════════════════════════════════════════════

export type PropCard = {
  id: string;
  no: string;
  title: string;
  lawTex: string;
  exLeftTex: string;
  exRightTex: string;
  cTex: string;
  leftF: (x: number) => number | null;
  rightF: (x: number) => number | null;
  note: string;
};

export const PROPS: PropCard[] = [
  {
    id: "p1",
    no: "성질 (1)",
    title: "위아래에 같은 것을 곱하기 — 통분의 근거",
    lawTex: "\\dfrac{A}{B}=\\dfrac{A\\times C}{B\\times C}",
    exLeftTex: "\\dfrac{x+1}{x-2}",
    exRightTex: "\\dfrac{(x+1)(x+3)}{(x-2)(x+3)}",
    cTex: "C=x+3",
    leftF: (x) => (x === 2 ? null : (x + 1) / (x - 2)),
    rightF: (x) => (x === 2 || x === -3 ? null : ((x + 1) * (x + 3)) / ((x - 2) * (x + 3))),
    note: "x = −3 으로 맞춰 보세요. 곱한 C 가 0 이 되어 오른쪽 식만 값을 잃습니다.",
  },
  {
    id: "p2",
    no: "성질 (2)",
    title: "위아래를 같은 것으로 나누기 — 약분의 근거",
    lawTex: "\\dfrac{A}{B}=\\dfrac{A\\div C}{B\\div C}",
    exLeftTex: "\\dfrac{x^2-4}{x^2+2x}",
    exRightTex: "\\dfrac{x-2}{x}",
    cTex: "C=x+2",
    leftF: (x) => (x === 0 || x === -2 ? null : (x * x - 4) / (x * x + 2 * x)),
    rightF: (x) => (x === 0 ? null : (x - 2) / x),
    note: "x = −2 로 맞춰 보세요. 약분해 없앤 C 가 0 이 되는 자리에서는 왼쪽 식만 값을 잃습니다.",
  },
  {
    id: "p3",
    no: "성질 (3)",
    title: "분모가 같은 두 분수의 덧셈",
    lawTex: "\\dfrac{A}{C}+\\dfrac{B}{C}=\\dfrac{A+B}{C}",
    exLeftTex: "\\dfrac{3x}{x+4}+\\dfrac{12}{x+4}",
    exRightTex: "3",
    cTex: "C=x+4",
    leftF: (x) => (x === -4 ? null : (3 * x) / (x + 4) + 12 / (x + 4)),
    rightF: () => 3,
    note: "더한 결과가 상수 3 이 되지만, x = −4 에서는 원래 식에 값이 없습니다.",
  },
  {
    id: "p4",
    no: "성질 (4)",
    title: "분모가 같은 두 분수의 뺄셈",
    lawTex: "\\dfrac{A}{C}-\\dfrac{B}{C}=\\dfrac{A-B}{C}",
    exLeftTex: "\\dfrac{x^2}{x-5}-\\dfrac{25}{x-5}",
    exRightTex: "x+5",
    cTex: "C=x-5",
    leftF: (x) => (x === 5 ? null : (x * x) / (x - 5) - 25 / (x - 5)),
    rightF: (x) => x + 5,
    note: "뺀 뒤 약분하면 다항식 x+5 가 됩니다. 그래도 x = 5 는 처음부터 넣을 수 없는 수예요.",
  },
];

export const PROP_X = { min: -6, max: 6, step: 0.5, init: 1 };

export type CalcStep = {
  q: Piece[];
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
    exprTex: "\\dfrac{1}{x-1}+\\dfrac{1}{x+1}",
    steps: [
      {
        badge: "성질 (1)",
        q: [{ pre: "분모를 같게 만들려면 무엇으로 통분할까요?" }],
        choices: ["(x-1)+(x+1)", "(x-1)(x+1)", "x^2+1", "x-1"],
        answer: 1,
        choiceWhy: [
          "분모끼리 더하는 것이 아니라 곱해서 공통분모를 만들어요.",
          "",
          "두 분모의 곱은 x²−1 입니다. x²+1 이 아니에요.",
          "x−1 로는 두 번째 분수의 분모를 맞출 수 없어요.",
        ],
        why: "각 분수의 위아래에 모자란 인수를 곱해 분모를 (x−1)(x+1) 로 맞춥니다.",
      },
      {
        badge: "성질 (3)",
        q: [{ pre: "통분한 두 분자를 더하면?" }],
        choices: ["2", "x^2-1", "2x", "x^2+1"],
        answer: 2,
        choiceWhy: [
          "분자는 (x+1)+(x−1) 이라 x 항이 남아요.",
          "x²−1 은 분자가 아니라 분모예요.",
          "",
          "분자를 곱한 것이 아니라 더해야 합니다.",
        ],
        why: "첫 분수의 분자는 x+1, 둘째 분수의 분자는 x−1 이 되어 더하면 2x 입니다.",
      },
      {
        badge: "정리",
        q: [{ pre: "정리한 결과는?" }],
        choices: ["\\dfrac{2}{x^2-1}", "\\dfrac{2x}{x^2+1}", "\\dfrac{1}{x}", "\\dfrac{2x}{x^2-1}"],
        answer: 3,
        choiceWhy: [
          "분자는 2 가 아니라 2x 입니다.",
          "분모는 (x−1)(x+1) = x²−1 이에요.",
          "분자끼리, 분모끼리 그냥 더하면 안 됩니다.",
          "",
        ],
        why: "분자 2x, 분모 x²−1 이므로 2x/(x²−1) 입니다.",
      },
    ],
    resultTex: "\\dfrac{2x}{x^2-1}",
    note: "x = 1 과 x = −1 에서는 원래 식에 값이 없습니다.",
  },
  {
    id: "q2",
    exprTex: "\\dfrac{x}{x-3}-\\dfrac{3}{x-3}",
    steps: [
      {
        badge: "성질 (4)",
        q: [{ pre: "분모가 이미 같으니 분자끼리 빼면?" }],
        choices: ["x-3", "x+3", "3-x", "x"],
        answer: 0,
        choiceWhy: [
          "",
          "빼기이므로 부호에 주의하세요.",
          "빼는 순서를 바꾸었어요. x 에서 3 을 빼야 합니다.",
          "3 을 빼는 것을 잊었어요.",
        ],
        why: "분모가 같으므로 분자끼리 빼면 x−3 이 됩니다.",
      },
      {
        badge: "성질 (2)",
        q: [{ pre: "그 결과를 약분하면?" }],
        choices: ["\\dfrac{1}{x-3}", "1", "0", "x"],
        answer: 1,
        choiceWhy: [
          "분자와 분모가 똑같으므로 분수 꼴이 남지 않아요.",
          "",
          "분자는 0 이 아니라 x−3 이에요.",
          "약분하면 문자가 남지 않습니다.",
        ],
        why: "(x−3)/(x−3) 이므로 값은 1 입니다.",
      },
    ],
    resultTex: "1",
    note: "값은 언제나 1 이지만 x = 3 은 처음부터 넣을 수 없는 수예요.",
  },
  {
    id: "q3",
    exprTex: "\\dfrac{x^2-1}{x+3}\\times\\dfrac{x+3}{x+1}",
    steps: [
      {
        badge: "인수분해",
        q: [{ pre: "약분할 것을 찾기 위해 " }, { tex: "x^2-1" }, { post: " 을 인수분해하면?" }],
        choices: ["(x-1)^2", "x(x-1)", "(x+1)^2", "(x+1)(x-1)"],
        answer: 3,
        choiceWhy: [
          "(x−1)² 을 전개하면 x²−2x+1 이에요.",
          "전개하면 x²−x 입니다.",
          "(x+1)² 을 전개하면 x²+2x+1 이에요.",
          "",
        ],
        why: "합과 차의 곱이므로 x²−1 = (x+1)(x−1) 입니다.",
      },
      {
        badge: "성질 (2)",
        q: [{ pre: "약분한 결과는?" }],
        choices: ["x-1", "(x-1)(x+3)", "x+1", "\\dfrac{x-1}{x+3}"],
        answer: 0,
        choiceWhy: [
          "",
          "x+3 은 위아래에서 약분되어 사라져요.",
          "약분되어 사라지는 것이 x+1 이고 남는 것은 x−1 입니다.",
          "x+3 은 분모에 남지 않아요.",
        ],
        why: "(x+1)(x−1)/(x+3) × (x+3)/(x+1) 에서 x+3 과 x+1 이 약분되어 x−1 만 남습니다.",
      },
    ],
    resultTex: "x-1",
    note: "x ≠ −3, x ≠ −1 일 때의 이야기예요.",
  },
  {
    id: "q4",
    exprTex: "\\dfrac{x+1}{x-4}\\div\\dfrac{x^2-1}{x-4}",
    steps: [
      {
        badge: "나눗셈",
        q: [{ pre: "나눗셈을 곱셈으로 바꾸면?" }],
        choices: [
          "\\dfrac{x+1}{x-4}\\times\\dfrac{x^2-1}{x-4}",
          "\\dfrac{x-4}{x+1}\\times\\dfrac{x-4}{x^2-1}",
          "\\dfrac{x+1}{x-4}\\times\\dfrac{x-4}{x^2-1}",
          "\\dfrac{x^2-1}{x-4}\\times\\dfrac{x-4}{x+1}",
        ],
        answer: 2,
        choiceWhy: [
          "뒤의 분수를 뒤집지 않았어요.",
          "앞의 분수까지 뒤집었어요. 뒤집는 것은 뒤의 분수뿐입니다.",
          "",
          "앞뒤를 바꾸어 놓았어요.",
        ],
        why: "나누는 분수를 뒤집어 곱하면 됩니다.",
      },
      {
        badge: "성질 (2)",
        q: [{ pre: "약분하면?" }],
        choices: ["\\dfrac{1}{x+1}", "\\dfrac{1}{x-1}", "x-1", "\\dfrac{x+1}{x-1}"],
        answer: 1,
        choiceWhy: [
          "x²−1 = (x+1)(x−1) 이므로 약분하면 분모에 x−1 이 남아요.",
          "",
          "분모에 남는 것을 분자로 올렸어요.",
          "x+1 은 위아래에서 약분되어 사라집니다.",
        ],
        why: "x−4 가 약분되고 (x+1)/((x+1)(x−1)) 에서 x+1 도 약분되어 1/(x−1) 이 됩니다.",
      },
    ],
    resultTex: "\\dfrac{1}{x-1}",
    note: "x ≠ 4, x ≠ 1, x ≠ −1 일 때의 이야기예요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 함수의 나라 — 다항함수 · 유리함수
// ══════════════════════════════════════════════════════════════

/** 0: 다항함수, 1: 다항함수가 아닌 유리함수, 2: 유리함수가 아닌 함수 */
export const FN_CHOICES = ["다항함수", "다항함수가 아닌 유리함수", "유리함수가 아닌 함수"];

export type FnCard = {
  id: string;
  tex: string;
  ring: Zone;
  answer: number;
  f: (x: number) => number | null;
  bad: number[];
  domain: string;
  choiceWhy: string[];
  why: string;
};

export const FN_CARDS: FnCard[] = [
  {
    id: "f2",
    tex: "y=2x^2-x+1",
    ring: "poly",
    answer: 0,
    f: (x) => 2 * x * x - x + 1,
    bad: [],
    domain: "실수 전체",
    choiceWhy: ["", "분모에 문자가 없으므로 다항함수입니다.", "다항함수는 모두 유리함수이기도 해요."],
    why: "f(x) 가 x 에 대한 다항식이므로 다항함수이고, 정의역은 실수 전체입니다.",
  },
  {
    id: "f1",
    tex: "y=\\dfrac{5}{x}",
    ring: "rational",
    answer: 1,
    f: (x) => (x === 0 ? null : 5 / x),
    bad: [0],
    domain: "x ≠ 0 인 실수 전체",
    choiceWhy: ["분모에 문자 x 가 있으므로 다항함수가 아니에요.", "", "분자와 분모가 모두 다항식이므로 유리함수입니다."],
    why: "f(x) = 5/x 는 유리식이므로 유리함수이고, 분모에 문자가 있으므로 다항함수는 아니에요.",
  },
  {
    id: "f5",
    tex: "y=-7",
    ring: "const",
    answer: 0,
    f: () => -7,
    bad: [],
    domain: "실수 전체",
    choiceWhy: ["", "x 를 아무리 바꾸어도 값이 −7 인 상수함수예요. 상수함수는 다항함수입니다.", "상수함수도 유리함수예요."],
    why: "값이 늘 −7 인 상수함수입니다. 상수함수는 다항함수 가운데 가장 단순한 경우라 가장 안쪽 고리에 앉아요.",
  },
  {
    id: "f6",
    tex: "y=\\sqrt{x}+1",
    ring: "outer",
    answer: 2,
    f: (x) => (x < 0 ? null : Math.sqrt(x) + 1),
    bad: [],
    domain: "x ≥ 0 인 실수 전체",
    choiceWhy: ["문자가 근호 안에 있어 다항식이 아니에요.", "두 다항식의 비로 나타낼 수 없어요.", ""],
    why: "f(x) 가 유리식이 아니므로 유리함수가 아닙니다. 음수를 넣으면 값이 없어 정의역도 x ≥ 0 이에요.",
  },
  {
    id: "f4",
    tex: "y=\\dfrac{x+3}{x-4}",
    ring: "rational",
    answer: 1,
    f: (x) => (x === 4 ? null : (x + 3) / (x - 4)),
    bad: [4],
    domain: "x ≠ 4 인 실수 전체",
    choiceWhy: ["분모 x−4 에 문자가 있어요.", "", "분자와 분모가 모두 다항식이므로 유리함수입니다."],
    why: "f(x) 가 유리식이므로 유리함수이고, 분모가 0 이 되는 x = 4 는 정의역에서 빠집니다.",
  },
  {
    id: "f3",
    tex: "y=\\dfrac{3x-1}{5}",
    ring: "poly",
    answer: 0,
    f: (x) => (3 * x - 1) / 5,
    bad: [],
    domain: "실수 전체",
    choiceWhy: ["", "분모가 상수 5 이므로 다항식으로 고쳐 쓸 수 있어요.", "다항함수는 유리함수이기도 합니다."],
    why: "분모가 상수 5 라 f(x) = 0.6x − 0.2 처럼 항의 합으로 쓸 수 있어요. 분수 꼴로 보이지만 다항함수입니다.",
  },
  {
    id: "f8",
    tex: "y=\\dfrac{1}{x^2-9}",
    ring: "rational",
    answer: 1,
    f: (x) => (x === 3 || x === -3 ? null : 1 / (x * x - 9)),
    bad: [-3, 3],
    domain: "x ≠ −3 이고 x ≠ 3 인 실수 전체",
    choiceWhy: ["분모에 문자가 있으므로 다항함수가 아니에요.", "", "분자 1 과 분모 x²−9 가 모두 다항식이에요."],
    why: "f(x) 가 유리식이므로 유리함수입니다. 분모 x²−9 = (x+3)(x−3) 이 0 이 되는 두 수가 정의역에서 빠져요.",
  },
  {
    id: "f7",
    tex: "y=\\dfrac{x}{x^2+4}",
    ring: "rational",
    answer: 1,
    f: (x) => x / (x * x + 4),
    bad: [],
    domain: "실수 전체",
    choiceWhy: ["분모에 문자가 있으면 다항함수가 아니에요.", "", "분자 x 와 분모 x²+4 가 모두 다항식이에요."],
    why: "분모 x²+4 는 0 이 될 수 없어 정의역이 실수 전체예요. 그래도 분모에 문자가 있으므로 다항함수는 아닌 유리함수입니다.",
  },
];

export const FN_X = { min: -6, max: 6, step: 0.5, init: 2 };

// ══════════════════════════════════════════════════════════════
// 탭 ④ 정의역 구멍 사냥
// ══════════════════════════════════════════════════════════════

export const LINE = { w: 480, h: 104, left: 32, right: 452, y: 58, x0: -8, x1: 8 };
export const DOM_X = { min: -8, max: 8, step: 0.5, init: 1 };

export type DomTask = {
  id: string;
  fnTex: string;
  denomTex: string;
  denomF: (x: number) => number;
  holes: number[];
  holeLabels: string[];
  choices: Piece[][];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const DOM_TASKS: DomTask[] = [
  {
    id: "d1",
    fnTex: "y=\\dfrac{4}{x+5}",
    denomTex: "x+5",
    denomF: (x) => x + 5,
    holes: [-5],
    holeLabels: ["−5"],
    choices: [
      [{ pre: "모든 실수" }],
      [{ tex: "x\\neq -5", post: " 인 실수 전체" }],
      [{ tex: "x>-5", post: " 인 실수 전체" }],
      [{ tex: "x\\neq 5", post: " 인 실수 전체" }],
    ],
    answer: 1,
    choiceWhy: [
      "분모 x+5 가 0 이 되는 x = −5 를 빼야 해요.",
      "",
      "분모가 0 만 아니면 되므로 −5 보다 작은 수도 모두 정의역입니다.",
      "부호를 반대로 보았어요. x+5 = 0 이면 x = −5 입니다.",
    ],
    why: "x+5 = 0 이 되는 x = −5 만 빼면 되므로 정의역은 x ≠ −5 인 실수 전체의 집합이에요.",
  },
  {
    id: "d2",
    fnTex: "y=\\dfrac{x-1}{2x-7}",
    denomTex: "2x-7",
    denomF: (x) => 2 * x - 7,
    holes: [3.5],
    holeLabels: ["7/2"],
    choices: [
      [{ tex: "x\\neq -\\dfrac{7}{2}", post: " 인 실수 전체" }],
      [{ tex: "x\\neq 7", post: " 인 실수 전체" }],
      [{ tex: "x\\neq \\dfrac{7}{2}", post: " 인 실수 전체" }],
      [{ pre: "모든 실수" }],
    ],
    answer: 2,
    choiceWhy: [
      "2x−7 = 0 을 풀면 x = 7/2 입니다. 부호를 반대로 보았어요.",
      "2 로 나누는 것을 잊었어요. 2x = 7 이므로 x = 7/2 입니다.",
      "",
      "분모가 0 이 되는 자리가 있으므로 실수 전체가 될 수 없어요.",
    ],
    why: "2x−7 = 0 에서 x = 7/2 이므로 정의역은 x ≠ 7/2 인 실수 전체의 집합입니다. 분자 x−1 은 정의역과 상관이 없어요.",
  },
  {
    id: "d3",
    fnTex: "y=\\dfrac{3}{x^2-16}",
    denomTex: "x^2-16",
    denomF: (x) => x * x - 16,
    holes: [-4, 4],
    holeLabels: ["−4", "4"],
    choices: [
      [{ tex: "x\\neq 16", post: " 인 실수 전체" }],
      [{ tex: "x\\neq 4", post: " 인 실수 전체" }],
      [{ pre: "모든 실수" }],
      [{ tex: "x\\neq -4", post: " 이고 " }, { tex: "x\\neq 4", post: " 인 실수 전체" }],
    ],
    answer: 3,
    choiceWhy: [
      "x² = 16 을 풀면 x = ±4 예요. 16 을 그대로 쓰면 안 됩니다.",
      "x = −4 를 넣어도 분모가 0 이 됩니다. 빠지는 수가 두 개예요.",
      "분모가 0 이 되는 자리가 두 군데 있습니다.",
      "",
    ],
    why: "x²−16 = (x+4)(x−4) 이므로 0 이 되는 수가 −4 와 4 두 개예요. 둘 다 정의역에서 빠집니다.",
  },
  {
    id: "d4",
    fnTex: "y=\\dfrac{6}{x^2+1}",
    denomTex: "x^2+1",
    denomF: (x) => x * x + 1,
    holes: [],
    holeLabels: [],
    choices: [
      [{ tex: "x\\neq 0", post: " 인 실수 전체" }],
      [{ tex: "x\\neq 1", post: " 인 실수 전체" }],
      [{ pre: "모든 실수" }],
      [{ tex: "x\\neq -1", post: " 이고 " }, { tex: "x\\neq 1", post: " 인 실수 전체" }],
    ],
    answer: 2,
    choiceWhy: [
      "x = 0 을 넣으면 분모가 1 이라 값이 잘 나옵니다.",
      "x = 1 을 넣으면 분모가 2 예요. 0 이 아닙니다.",
      "",
      "x²+1 = 0 을 만족하는 실수는 없습니다.",
    ],
    why: "x² ≥ 0 이므로 x²+1 ≥ 1 이라 분모가 0 이 될 수 없어요. 분모에 문자가 있어도 정의역은 실수 전체입니다.",
  },
  {
    id: "d5",
    fnTex: "y=\\dfrac{2}{x^2-6x+9}",
    denomTex: "x^2-6x+9",
    denomF: (x) => x * x - 6 * x + 9,
    holes: [3],
    holeLabels: ["3"],
    choices: [
      [{ tex: "x\\neq -3", post: " 이고 " }, { tex: "x\\neq 3", post: " 인 실수 전체" }],
      [{ tex: "x\\neq 3", post: " 인 실수 전체" }],
      [{ tex: "x\\neq 9", post: " 인 실수 전체" }],
      [{ pre: "모든 실수" }],
    ],
    answer: 1,
    choiceWhy: [
      "x = −3 을 넣으면 분모가 36 이에요. 0 이 아닙니다.",
      "",
      "상수항 9 가 아니라 분모가 0 이 되는 x 를 찾아야 해요.",
      "x = 3 에서 분모가 0 이 됩니다.",
    ],
    why: "x²−6x+9 = (x−3)² 이라 0 이 되는 수가 x = 3 하나뿐이에요. 완전제곱식은 빠지는 수가 한 개입니다.",
  },
  {
    id: "d6",
    fnTex: "y=\\dfrac{5}{x^2+2x}",
    denomTex: "x^2+2x",
    denomF: (x) => x * x + 2 * x,
    holes: [-2, 0],
    holeLabels: ["−2", "0"],
    choices: [
      [{ tex: "x\\neq -2", post: " 이고 " }, { tex: "x\\neq 0", post: " 인 실수 전체" }],
      [{ tex: "x\\neq -2", post: " 인 실수 전체" }],
      [{ tex: "x\\neq 0", post: " 인 실수 전체" }],
      [{ tex: "x\\neq 0", post: " 이고 " }, { tex: "x\\neq 2", post: " 인 실수 전체" }],
    ],
    answer: 0,
    choiceWhy: [
      "",
      "x = 0 을 넣어도 분모가 0 이 됩니다. 빠지는 수가 두 개예요.",
      "x = −2 를 넣어도 분모가 0 이 됩니다.",
      "x = 2 를 넣으면 분모가 8 이에요. 0 이 되는 것은 −2 입니다.",
    ],
    why: "x²+2x = x(x+2) 이므로 0 이 되는 수가 0 과 −2 예요. 둘 다 정의역에서 빠집니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ⑤ 일상생활 속 유리함수
// ══════════════════════════════════════════════════════════════

/** 탭 ⑤ 좌표평면 — 슬라이더를 움직인 자리마다 점이 하나씩 찍힌다(곡선은 다음 활동에서). */
export type LifeGraph = {
  xMax: number;
  yMax: number;
  xTicks: number[];
  yTicks: number[];
  xName: string;
  yName: string;
  /** 값이 가까워지지만 닿지 못하는 가로선 */
  asym?: { y: number; label: string };
};

/** 좌표평면 칸의 치수 — 점이 모두 이 안에 들어오는지 검증 스크립트가 검사한다. */
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
  min: number;
  max: number;
  step: number;
  init: number;
  valueOf: (x: number) => number;
  valueLabel: string;
  valueUnit: string;
  digits: number;
  extraOf?: (x: number) => number;
  extraLabel?: string;
  extraUnit?: string;
  extraDigits?: number;
  fnTex: string;
  insight: string;
  graph: LifeGraph;
  qs: LifeQ[];
};

export const LIFE_CASES: LifeCase[] = [
  {
    id: "L1",
    icon: "📒",
    title: "공책 주문하기",
    story: [
      "공책 한 권 값은 1200 원이고, 몇 권을 사든 배송비 2500 원이 한 번 붙어요.",
      "x 권을 주문했을 때 낸 돈 전체와 공책 한 권당 값을 견주어 보세요.",
    ],
    xLabel: "주문한 권수 x",
    xUnit: "권",
    min: 1,
    max: 25,
    step: 1,
    init: 2,
    valueOf: (x) => (1200 * x + 2500) / x,
    valueLabel: "한 권당",
    valueUnit: "원",
    digits: 0,
    extraOf: (x) => 1200 * x + 2500,
    extraLabel: "낸 돈 전체",
    extraUnit: "원",
    extraDigits: 0,
    fnTex: "y=\\dfrac{1200x+2500}{x}",
    insight:
      "낸 돈 전체는 1200x+2500 으로 다항함수지만, 한 권당 값은 그것을 x 로 나눈 유리함수예요. 많이 살수록 배송비가 나뉘어 한 권당 값이 1200 원에 가까워집니다.",
    graph: {
      xMax: 25,
      yMax: 4000,
      xTicks: [5, 10, 15, 20, 25],
      yTicks: [1000, 2000, 3000, 4000],
      xName: "권수 x (권)",
      yName: "한 권당 값 (원)",
      asym: { y: 1200, label: "y = 1200" },
    },
    qs: [
      {
        prompt: "공책 한 권당 값을 x 에 대한 식으로 나타내면?",
        choices: [
          [{ tex: "\\dfrac{1200x+2500}{x}" }],
          [{ tex: "1200x+2500" }],
          [{ tex: "1200x+\\dfrac{2500}{x}" }],
          [{ tex: "\\dfrac{1200+2500}{x}" }],
        ],
        answer: 0,
        choiceWhy: [
          "",
          "이것은 낸 돈 전체예요. 한 권당 값은 여기서 한 번 더 나누어야 합니다.",
          "공책값까지 x 로 나누어야 하는데 나누지 않았어요.",
          "공책값 1200 원은 권수만큼 늘어나므로 x 를 곱해야 합니다.",
        ],
        why: "낸 돈 전체 1200x+2500 원을 권수 x 로 나눈 값이 한 권당 값이에요.",
      },
      {
        prompt: "한 권당 값을 나타내는 이 함수는 어떤 함수일까요?",
        choices: [
          [{ pre: "다항함수" }],
          [{ pre: "다항함수가 아닌 유리함수" }],
          [{ pre: "유리함수가 아닌 함수" }],
        ],
        answer: 1,
        choiceWhy: [
          "분모에 문자 x 가 있으므로 항의 합으로 고쳐 쓸 수 없어요.",
          "",
          "분자와 분모가 모두 다항식이므로 유리함수는 맞습니다.",
        ],
        why: "분모에 문자 x 가 있는 유리식이므로 다항함수가 아닌 유리함수예요. 현실에서 x 는 1 이상의 자연수입니다.",
      },
    ],
  },
  {
    id: "L2",
    icon: "🧪",
    title: "소금물 묽히기",
    story: [
      "소금 60 g 이 녹아 있는 소금물 240 g 이 있어요.",
      "여기에 물 x g 을 더 부으면 소금의 양은 그대로지만 소금물 전체가 무거워집니다.",
    ],
    xLabel: "더 붓는 물 x",
    xUnit: "g",
    min: 0,
    max: 360,
    step: 20,
    init: 0,
    valueOf: (x) => 6000 / (240 + x),
    valueLabel: "농도",
    valueUnit: "%",
    digits: 2,
    extraOf: (x) => 240 + x,
    extraLabel: "소금물 전체",
    extraUnit: "g",
    extraDigits: 0,
    fnTex: "y=\\dfrac{6000}{240+x}",
    insight:
      "분자에 있는 소금 60 g 은 그대로이고 분모인 소금물의 양만 늘어나므로 농도는 점점 낮아져요. 물을 아무리 부어도 농도가 0 이 되지는 않습니다.",
    graph: {
      xMax: 360,
      yMax: 30,
      xTicks: [90, 180, 270, 360],
      yTicks: [10, 20, 30],
      xName: "더 붓는 물 x (g)",
      yName: "농도 (%)",
    },
    qs: [
      {
        prompt: "물 x g 을 더 부었을 때의 농도(%)를 x 에 대한 식으로 나타내면?",
        choices: [
          [{ tex: "\\dfrac{60}{240+x}" }],
          [{ tex: "\\dfrac{6000}{240}" }],
          [{ tex: "\\dfrac{6000}{240+x}" }],
          [{ tex: "\\dfrac{60+x}{240}" }],
        ],
        answer: 2,
        choiceWhy: [
          "백분율로 나타내려면 100 을 곱해야 해요.",
          "더 부은 물 x 가 분모에 들어가지 않았어요.",
          "",
          "늘어나는 것은 소금이 아니라 소금물 전체입니다.",
        ],
        why: "농도는 소금의 양을 소금물 전체의 양으로 나눈 뒤 100 을 곱한 값이므로 60 ÷ (240+x) × 100 = 6000/(240+x) 입니다.",
      },
      {
        prompt: "이 상황에서 x 가 가질 수 있는 값의 범위는?",
        choices: [
          [{ tex: "x\\neq -240", post: " 인 실수 전체" }],
          [{ pre: "모든 실수" }],
          [{ tex: "x\\geq 0", post: " 인 실수 전체" }],
          [{ tex: "x>240", post: " 인 실수 전체" }],
        ],
        answer: 2,
        choiceWhy: [
          "식만 보면 그렇지만, 물을 −240 g 붓는 일은 현실에 없어요.",
          "물의 양이 음수가 될 수는 없습니다.",
          "",
          "물을 조금만 부어도 되고 아예 붓지 않아도 됩니다.",
        ],
        why: "식만 보면 분모가 0 이 되는 x = −240 만 빼면 되지만, 붓는 물의 양은 음수가 될 수 없으므로 현실에서는 x ≥ 0 이에요. 상황이 정의역을 더 좁히는 셈입니다.",
      },
    ],
  },
  {
    id: "L3",
    icon: "🚲",
    title: "왕복 평균 속력",
    story: [
      "집에서 도서관까지 갈 때는 오르막이라 시속 4 km 로 갔어요.",
      "돌아올 때는 내리막이라 시속 x km 로 달립니다. 왕복 전체의 평균 속력은 얼마일까요?",
    ],
    xLabel: "올 때 속력 x",
    xUnit: "km/h",
    min: 1,
    max: 40,
    step: 1,
    init: 4,
    valueOf: (x) => (8 * x) / (x + 4),
    valueLabel: "왕복 평균 속력",
    valueUnit: "km/h",
    digits: 2,
    fnTex: "y=\\dfrac{8x}{x+4}",
    insight:
      "평균 속력은 두 속력의 한가운데가 아니에요. 느리게 간 구간에서 시간을 많이 쓰기 때문에 느린 쪽으로 끌려갑니다. 올 때 속력을 아무리 크게 해도 왕복 평균은 시속 8 km 를 넘지 못해요.",
    graph: {
      xMax: 40,
      yMax: 10,
      xTicks: [10, 20, 30, 40],
      yTicks: [2, 4, 6, 8, 10],
      xName: "올 때 속력 x (km/h)",
      yName: "왕복 평균 속력 (km/h)",
      asym: { y: 8, label: "y = 8" },
    },
    qs: [
      {
        prompt: "왕복 평균 속력을 x 에 대한 식으로 나타내면?",
        choices: [
          [{ tex: "\\dfrac{x+4}{2}" }],
          [{ tex: "\\dfrac{2x}{x+4}" }],
          [{ tex: "\\dfrac{x+4}{8}" }],
          [{ tex: "\\dfrac{8x}{x+4}" }],
        ],
        answer: 3,
        choiceWhy: [
          "두 속력의 평균이 아니에요. 걸린 시간이 서로 다릅니다.",
          "분자를 잘못 보았어요. 거리 두 배를 걸린 시간으로 나누어야 합니다.",
          "분자와 분모가 뒤바뀌었어요.",
          "",
        ],
        why: "편도 거리를 d 라 하면 걸린 시간은 d/4 + d/x 이고 간 거리는 2d 이므로, 평균 속력은 2d ÷ (d/4 + d/x) = 8x/(x+4) 입니다.",
      },
      {
        prompt: "올 때 속력 x 를 아무리 크게 해도 왕복 평균 속력이 넘지 못하는 값은?",
        choices: [
          [{ pre: "시속 ", tex: "4", post: " km" }],
          [{ pre: "시속 ", tex: "8", post: " km" }],
          [{ pre: "시속 ", tex: "12", post: " km" }],
          [{ pre: "넘지 못하는 값은 없다" }],
        ],
        answer: 1,
        choiceWhy: [
          "슬라이더를 조금만 올려도 시속 4 km 를 넘습니다.",
          "",
          "슬라이더를 끝까지 밀어도 시속 12 km 에 한참 못 미쳐요.",
          "슬라이더를 끝까지 밀어 값이 어디에 가까워지는지 살펴보세요.",
        ],
        why: "8x/(x+4) 의 위아래를 x 로 나누면 8 ÷ (1 + 4/x) 이 되는데, x 가 커질수록 4/x 가 0 에 가까워져 값이 8 에 가까워집니다. 다만 4/x 가 0 이 되지는 않으므로 8 에 닿지는 못해요.",
      },
    ],
  },
];
