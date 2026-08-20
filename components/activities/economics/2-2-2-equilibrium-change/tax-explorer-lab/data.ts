// 공학도구로 균형 찾기 — 활동 데이터
//
//  · 수요함수 f(x) = dA·x + dB, 공급함수 g(x) = sA·x + sB 일 때
//    정부가 상품 1단위에 대하여 공급자에게 세금을 a 만큼 부과하면
//    공급함수는 g_a(x) = sA(x − a) + sB 로 바뀐다.
//    (같은 양을 내놓으려면 값을 a 만큼 더 받아야 하므로 x 자리에 x − a 를 넣는다.)
//  · 균형은 f(x) = g_a(x) 를 푼 자리.
//        x₀(a) = (sB − sA·a − dB) / (dA − sA)
//        Q₀(a) = dA·x₀(a) + dB
//    두 식 모두 a 에 대한 일차함수이고,
//        (세금 1만큼 늘 때 균형가격의 변화) = sA / (sA − dA)
//        (세금 1만큼 늘 때 균형거래량의 변화) = dA · sA / (sA − dA)   (음수)
//  · 세금이 변해도 수요함수는 그대로이므로 균형점은 언제나 수요곡선 위에 놓인다.
//    곧 a 를 움직일 때 균형점은 수요곡선을 따라 미끄러진다.
//
//  ※ 이 활동의 수치는 공학도구로 균형을 찾아보기 위해 꾸민 값이다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}
export function signed(v: number, d = 2): string {
  return v < 0 ? `- ${fmt(-v, d)}` : `+ ${fmt(v, d)}`;
}

// ══════════════════════════════════════════════════════════════
//  함수와 균형
// ══════════════════════════════════════════════════════════════
export type Fn = { dA: number; dB: number; sA: number; sB: number };

/** 세금 a 를 부과한 뒤의 공급함수 상수항 */
export function taxedSB(f: Fn, a: number): number {
  return f.sB - f.sA * a;
}
export function demandAt(f: Fn, x: number): number {
  return f.dA * x + f.dB;
}
export function supplyAt(f: Fn, x: number, a = 0): number {
  return f.sA * x + taxedSB(f, a);
}
/** 균형가격과 균형거래량 */
export function eqOf(f: Fn, a = 0): { x: number; q: number } {
  const x = (taxedSB(f, a) - f.dB) / (f.dA - f.sA);
  return { x, q: f.dA * x + f.dB };
}
/** 세금 1만큼 늘 때 균형가격이 오르는 양 */
export function priceRate(f: Fn): number {
  return f.sA / (f.sA - f.dA);
}
/** 세금 1만큼 늘 때 균형거래량이 줄어드는 양 (양수로) */
export function qtyRate(f: Fn): number {
  return -f.dA * priceRate(f);
}

export function demandTex(f: Fn): string {
  return `f(x) = ${fmt(f.dA)}x ${signed(f.dB)}`;
}
export function supplyTex(f: Fn): string {
  return f.sB === 0 ? `g(x) = ${fmt(f.sA)}x` : `g(x) = ${fmt(f.sA)}x ${signed(f.sB)}`;
}
/** 세금을 넣은 공급함수 — 교과서와 같은 (x − a) 꼴 */
export function taxedTex(f: Fn, a: number): string {
  const coef = f.sA === 1 ? "" : fmt(f.sA);
  if (a === 0) return supplyTex(f);
  return `g(x) = ${coef}(x - ${fmt(a)}) ${signed(f.sB)}`;
}
/** 정리한 꼴 */
export function taxedTidyTex(f: Fn, a: number): string {
  const b = taxedSB(f, a);
  return b === 0 ? `g(x) = ${fmt(f.sA)}x` : `g(x) = ${fmt(f.sA)}x ${signed(b)}`;
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 공학도구 실험실 — 슬라이더 범위
// ══════════════════════════════════════════════════════════════
export const LAB_RANGE = {
  dA: { min: -5, max: -1, step: 1 },
  dB: { min: 400, max: 800, step: 20 },
  sA: { min: 1, max: 5, step: 1 },
  sB: { min: 40, max: 280, step: 20 },
  a: { min: 0, max: 180, step: 10 },
};

export const LAB_START: Fn = { dA: -2, dB: 600, sA: 1, sB: 120 };

export type Preset = { id: string; emoji: string; name: string; f: Fn; note: string };

export const LAB_PRESETS: Preset[] = [
  {
    id: "base",
    emoji: "🧪",
    name: "기본",
    f: { dA: -2, dB: 600, sA: 1, sB: 120 },
    note: "세금 1당 균형가격이 1/3 만큼 올라요.",
  },
  {
    id: "steepS",
    emoji: "🏭",
    name: "공급이 민감한 시장",
    f: { dA: -1, dB: 600, sA: 4, sB: 100 },
    note: "공급이 값에 민감해 세금이 가격에 크게 반영돼요.",
  },
  {
    id: "steepD",
    emoji: "🙋",
    name: "수요가 민감한 시장",
    f: { dA: -5, dB: 800, sA: 1, sB: 100 },
    note: "수요가 값에 민감해 세금을 매겨도 가격이 조금만 올라요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 표 채우기 (수업 자료의 활동을 다른 수로)
// ══════════════════════════════════════════════════════════════
export const TABLE_FN: Fn = { dA: -2, dB: 600, sA: 1, sB: 120 };
export const TABLE_TAXES = [0, 30, 60, 90];

/** 공급함수 보기 — 각 세금마다 3개 중 하나가 정답 */
export function supplyChoices(a: number): { tex: string; ok: boolean }[] {
  return [
    { tex: `g(x) = (x + ${a}) + 120`, ok: false },
    { tex: `g(x) = (x - ${a}) + 120`, ok: true },
    { tex: `g(x) = ${a}x + 120`, ok: false },
  ];
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 규칙 찾기 · 탭 ④ 단계별 문제
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

export const RULE_STEPS: PStep[] = [
  {
    kind: "choice",
    id: "r1",
    ask: "세금 a가 30씩 늘 때 균형가격은 10씩 올랐어요. 균형가격을 a의 식으로 나타내면?",
    hint: "a = 0일 때 160, 30일 때 170 …",
    options: [
      { tex: "x_0 = 160 + \\dfrac{a}{2}" },
      { tex: "x_0 = 160 + 3a" },
      { tex: "x_0 = 160 + \\dfrac{a}{3}" },
      { tex: "x_0 = 160 - \\dfrac{a}{3}" },
    ],
    answer: 2,
    explain: "30 늘 때 10 오르니 1 늘 때 1/3 씩 올라요. 그래서 x₀ = 160 + a/3 입니다.",
  },
  {
    kind: "choice",
    id: "r2",
    ask: "균형거래량은 30씩 늘 때 20씩 줄었어요. 균형거래량을 a의 식으로 나타내면?",
    hint: "a = 0일 때 280, 30일 때 260 …",
    options: [
      { tex: "Q_0 = 280 - \\dfrac{a}{3}" },
      { tex: "Q_0 = 280 - \\dfrac{2a}{3}" },
      { tex: "Q_0 = 280 - 20a" },
      { tex: "Q_0 = 280 + \\dfrac{2a}{3}" },
    ],
    answer: 1,
    explain: "30 늘 때 20 줄어드니 1 늘 때 2/3 씩 줄어요. 그래서 Q₀ = 280 − 2a/3 입니다.",
  },
  {
    kind: "number",
    id: "r3",
    ask: "그럼 세금이 150일 때의 균형가격을 예측해 보세요.",
    tex: "x_0 = 160 + \\dfrac{150}{3}",
    hint: "160 + 50",
    answer: 210,
    suffix: "",
    explain: "210 이에요. 공학도구에서 a를 150으로 맞춰 확인해 보세요!",
  },
  {
    kind: "number",
    id: "r4",
    ask: "세금이 150일 때의 균형거래량도 예측해 보세요.",
    tex: "Q_0 = 280 - \\dfrac{2 \\times 150}{3}",
    hint: "280 − 100",
    answer: 180,
    suffix: "",
    explain: "180 이에요. 식 하나로 표에 없는 값까지 알 수 있죠.",
  },
  {
    kind: "number",
    id: "r5",
    ask: "거꾸로, 균형거래량이 200이 되게 하려면 세금을 얼마로 매겨야 할까요?",
    tex: "280 - \\dfrac{2a}{3} = 200",
    hint: "2a/3 = 80",
    answer: 120,
    suffix: "",
    explain: "2a/3 = 80 → a = 120 이에요. 목표를 정해 두고 세금을 거꾸로 정할 수도 있어요.",
  },
  {
    kind: "choice",
    id: "r6",
    ask: "세금 a를 0에서 조금씩 늘릴 때, 균형점은 어느 곡선을 따라 미끄러질까요?",
    hint: "세금이 바뀔 때 그대로 있는 곡선은 무엇일까요?",
    options: [
      { text: "수요곡선 f(x) 위를 따라 움직인다" },
      { text: "처음 공급곡선 g(x) 위를 따라 움직인다" },
      { text: "정해진 규칙 없이 움직인다" },
      { text: "가로축을 따라 움직인다" },
    ],
    answer: 0,
    explain:
      "세금은 공급함수만 바꾸고 수요함수는 그대로예요. 균형점은 언제나 수요곡선 위의 점이므로 수요곡선을 따라 미끄러집니다.",
  },
];

export type Problem = {
  id: string;
  emoji: string;
  title: string;
  scenario: string;
  texList?: { label: string; tex: string }[];
  steps: PStep[];
  wrapUp: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "p1",
    emoji: "🔧",
    title: "문제 1 · 세금을 넣은 공급함수",
    scenario:
      "어떤 상품의 가격 x에 대한 수요함수와 공급함수가 아래와 같다. 정부가 상품 1단위에 대하여 공급자에게 세금을 40만큼 부과할 때를 살펴보자.",
    texList: [
      { label: "수요함수", tex: "f(x) = -x + 480" },
      { label: "공급함수", tex: "g(x) = 3x + 40" },
    ],
    steps: [
      {
        kind: "number",
        id: "p1s1",
        ask: "세금을 부과하기 전의 균형가격을 구하세요.",
        tex: "-x + 480 = 3x + 40",
        hint: "4x = 440",
        answer: 110,
        suffix: "",
        explain: "4x = 440 → x = 110 이에요.",
      },
      {
        kind: "choice",
        id: "p1s2",
        ask: "세금 40을 부과한 뒤의 공급함수는?",
        hint: "같은 양을 내놓으려면 값을 40 더 받아야 해요. x 자리에 x − 40 을 넣습니다.",
        options: [
          { tex: "g(x) = 3(x + 40) + 40" },
          { tex: "g(x) = 3(x - 40) + 40" },
          { tex: "g(x) = 3x + 40 - 40" },
          { tex: "g(x) = 40x + 40" },
        ],
        answer: 1,
        explain: "g(x) = 3(x − 40) + 40 = 3x − 80 이 돼요.",
      },
      {
        kind: "number",
        id: "p1s3",
        ask: "세금을 부과한 뒤의 균형가격을 구하세요.",
        tex: "-x + 480 = 3x - 80",
        hint: "4x = 560",
        answer: 140,
        suffix: "",
        explain: "4x = 560 → x = 140. 110에서 140으로 30 올랐어요.",
      },
      {
        kind: "number",
        id: "p1s4",
        ask: "세금을 부과한 뒤의 균형거래량을 구하세요.",
        tex: "Q = -140 + 480",
        hint: "−140 + 480",
        answer: 340,
        suffix: "",
        explain: "340 이에요. 공급함수에 넣어도 3 × 140 − 80 = 340 으로 같습니다.",
      },
    ],
    wrapUp:
      "세금 a를 부과하면 공급함수의 x 자리에 x − a 를 넣어요. 그 뒤 f(x) = g(x)를 풀면 새 균형을 찾을 수 있습니다.",
  },
  {
    id: "p2",
    emoji: "📈",
    title: "문제 2 · 세금과 균형의 관계식",
    scenario: "어떤 상품의 가격 x에 대한 수요함수와 공급함수가 아래와 같고, 세금을 a만큼 부과한다고 하자.",
    texList: [
      { label: "수요함수", tex: "f(x) = -2x + 900" },
      { label: "공급함수", tex: "g(x) = 2x + 100" },
    ],
    steps: [
      {
        kind: "number",
        id: "p2s1",
        ask: "세금이 100일 때의 균형가격을 구하세요.",
        tex: "-2x + 900 = 2(x - 100) + 100",
        hint: "−2x + 900 = 2x − 100 → 4x = 1000",
        answer: 250,
        suffix: "",
        explain: "4x = 1,000 → x = 250 이에요.",
      },
      {
        kind: "number",
        id: "p2s2",
        ask: "그때의 균형거래량을 구하세요.",
        tex: "Q = -2 \\times 250 + 900",
        hint: "−500 + 900",
        answer: 400,
        suffix: "",
        explain: "400 이에요.",
      },
      {
        kind: "number",
        id: "p2s3",
        ask: "균형거래량이 350이 되게 하려면 세금을 얼마로 매겨야 할까요?",
        tex: "Q_0 = 500 - a",
        hint: "세금이 0일 때 균형거래량은 500이고, 세금 1마다 1씩 줄어요.",
        answer: 150,
        suffix: "",
        explain: "500 − a = 350 → a = 150 이에요.",
      },
      {
        kind: "choice",
        id: "p2s4",
        ask: "이 시장에서 세금이 1만큼 늘 때 균형가격은 얼마나 오를까요?",
        hint: "세금 100에 균형가격이 200에서 250으로 올랐어요.",
        options: [{ text: "0.25" }, { text: "0.5" }, { text: "1" }, { text: "2" }],
        answer: 1,
        explain: "50 ÷ 100 = 0.5 씩 올라요. 공급 기울기 ÷ (공급 기울기 − 수요 기울기) = 2 ÷ 4 = 0.5 이기도 하죠.",
      },
    ],
    wrapUp:
      "균형가격과 균형거래량은 모두 세금 a에 대한 일차함수예요. 규칙을 찾으면 표에 없는 값도 계산할 수 있고, 거꾸로 원하는 결과를 만드는 세금도 정할 수 있습니다.",
  },
  {
    id: "p3",
    emoji: "🧭",
    title: "문제 3 · 균형점의 자취",
    scenario: "어떤 상품의 가격 x에 대한 수요함수와 공급함수가 아래와 같다. 세금 a를 바꿔 가며 균형점을 찾아보자.",
    texList: [
      { label: "수요함수", tex: "f(x) = -x + 400" },
      { label: "공급함수", tex: "g(x) = x + 100" },
    ],
    steps: [
      {
        kind: "number",
        id: "p3s1",
        ask: "세금이 50일 때의 균형가격을 구하세요.",
        tex: "-x + 400 = (x - 50) + 100",
        hint: "−x + 400 = x + 50 → 2x = 350",
        answer: 175,
        suffix: "",
        explain: "2x = 350 → x = 175 이고, 균형거래량은 225 예요.",
      },
      {
        kind: "number",
        id: "p3s2",
        ask: "세금이 100일 때의 균형가격을 구하세요.",
        tex: "-x + 400 = (x - 100) + 100",
        hint: "−x + 400 = x → 2x = 400",
        answer: 200,
        suffix: "",
        explain: "x = 200 이고, 균형거래량은 200 이에요.",
      },
      {
        kind: "choice",
        id: "p3s3",
        ask: "두 균형점 (175, 225)와 (200, 200)은 어떤 곡선 위에 있을까요?",
        hint: "두 점의 좌표를 f(x) = −x + 400 에 넣어 보세요.",
        options: [
          { text: "수요곡선 f(x) = -x + 400 위" },
          { text: "처음 공급곡선 g(x) = x + 100 위" },
          { text: "어느 곡선 위에도 있지 않다" },
          { text: "가로축 위" },
        ],
        answer: 0,
        explain: "−175 + 400 = 225, −200 + 400 = 200. 두 점 모두 수요곡선 위에 있어요.",
      },
      {
        kind: "choice",
        id: "p3s4",
        ask: "세금을 어떻게 바꾸든 균형점이 수요곡선 위에 놓이는 까닭은?",
        hint: "세금이 바꾸는 것은 어느 함수일까요?",
        options: [
          { text: "수요함수가 세금에 따라 함께 움직이기 때문" },
          { text: "세금은 공급함수만 바꾸고 수요함수는 그대로이기 때문" },
          { text: "두 함수의 기울기가 같기 때문" },
          { text: "균형거래량이 늘 일정하기 때문" },
        ],
        answer: 1,
        explain:
          "균형점은 두 곡선이 만나는 점이니 수요곡선 위의 점이기도 해요. 수요함수가 그대로면 균형점은 수요곡선을 따라 미끄러집니다.",
      },
    ],
    wrapUp:
      "공학도구에서 세금 손잡이를 움직여 보면 균형점이 수요곡선을 따라 또르르 미끄러지는 것을 볼 수 있어요. 눈으로 본 것을 식으로도 설명할 수 있게 되었습니다.",
  },
  {
    id: "p4",
    emoji: "⚖️",
    title: "문제 4 · 어느 시장이 더 민감할까",
    scenario: "두 시장에 똑같이 세금 40을 부과하려고 한다. 어느 쪽 균형가격이 더 크게 오를지 살펴보자.",
    texList: [
      { label: "A 시장", tex: "f(x) = -x + 300, \\quad g(x) = 3x + 20" },
      { label: "B 시장", tex: "f(x) = -3x + 500, \\quad g(x) = x + 100" },
    ],
    steps: [
      {
        kind: "number",
        id: "p4s1",
        ask: "A 시장의 세금 전 균형가격을 구하세요.",
        tex: "-x + 300 = 3x + 20",
        hint: "4x = 280",
        answer: 70,
        suffix: "",
        explain: "4x = 280 → x = 70 이에요.",
      },
      {
        kind: "number",
        id: "p4s2",
        ask: "A 시장에 세금 40을 부과한 뒤의 균형가격을 구하세요.",
        tex: "-x + 300 = 3(x - 40) + 20",
        hint: "−x + 300 = 3x − 100 → 4x = 400",
        answer: 100,
        suffix: "",
        explain: "x = 100. 70에서 100으로 30 올랐어요.",
      },
      {
        kind: "number",
        id: "p4s3",
        ask: "B 시장에 세금 40을 부과한 뒤의 균형가격을 구하세요. (세금 전 균형가격은 100입니다)",
        tex: "-3x + 500 = (x - 40) + 100",
        hint: "−3x + 500 = x + 60 → 4x = 440",
        answer: 110,
        suffix: "",
        explain: "x = 110. 100에서 110으로 10만 올랐어요.",
      },
      {
        kind: "choice",
        id: "p4s4",
        ask: "같은 세금인데 A 시장의 균형가격이 더 크게 오른 까닭은?",
        hint: "두 시장에서 값이 오를 때 사려는 양이 얼마나 빨리 줄어드는지 견주어 보세요.",
        options: [
          { text: "A 시장의 수요가 값에 덜 민감해서 값을 올려도 수요량이 많이 줄지 않기 때문" },
          { text: "A 시장의 상품이 더 비싸기 때문" },
          { text: "B 시장의 세금이 더 적기 때문" },
          { text: "우연히 그렇게 나왔을 뿐" },
        ],
        answer: 0,
        explain:
          "A는 수요 기울기가 −1, B는 −3 이에요. 값이 올라도 잘 안 줄어드는 A 쪽에서 세금이 가격에 더 많이 반영됩니다. (세금 1당 상승분 = 3/4 대 1/4)",
      },
    ],
    wrapUp:
      "세금 1당 균형가격의 상승분은 공급 기울기 ÷ (공급 기울기 − 수요 기울기) 예요. 공학도구에서 계수를 바꿔 가며 직접 확인해 보세요.",
  },
];
