// 수요량 예측하기 — 활동 데이터
//
//  · 수요곡선이 직선이면 두 점의 좌표만 알아도 그 직선의 방정식을 구할 수 있다.
//      기울기  a = (y₂ − y₁) / (x₂ − x₁),   y절편  b = y₁ − a·x₁
//    식을 얻으면 자료에 없는 가격에서의 수요량도 예측할 수 있다.
//
//  · 조사한 값들이 한 직선 위에 정확히 놓이지 않을 때는 최소제곱법을 쓴다.
//    예측 수요량과 실제 수요량의 차를 제곱해 모두 더한 값 C 가 가장 작아지도록
//    상수를 정하는 방법. C 는 상수에 대한 이차함수가 되므로 완전제곱식으로
//    고쳐 꼭짓점을 찾으면 된다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}

/** 부호를 살려 항을 붙인다 */
export function signed(v: number, d = 2): string {
  return v < 0 ? `- ${fmt(-v, d)}` : `+ ${fmt(v, d)}`;
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 두 점으로 수요곡선 찾기
// ══════════════════════════════════════════════════════════════
export type Pt = { x: number; y: number };

export type TwoPointPreset = {
  id: string;
  emoji: string;
  name: string;
  story: string;
  tone: "emerald" | "sky" | "amber" | "violet";
  A: Pt;
  B: Pt;
};

export const TWO_POINT_PRESETS: TwoPointPreset[] = [
  {
    id: "juice",
    emoji: "🧃",
    name: "주스",
    story: "가격 2에서 9, 가격 6에서 3만큼 팔렸어요.",
    tone: "emerald",
    A: { x: 2, y: 9 },
    B: { x: 6, y: 3 },
  },
  {
    id: "popcorn",
    emoji: "🍿",
    name: "팝콘",
    story: "가격 1에서 10, 가격 4에서 4만큼 팔렸어요.",
    tone: "amber",
    A: { x: 1, y: 10 },
    B: { x: 4, y: 4 },
  },
  {
    id: "socks",
    emoji: "🧦",
    name: "양말",
    story: "가격 2에서 7, 가격 7에서 2만큼 팔렸어요.",
    tone: "sky",
    A: { x: 2, y: 7 },
    B: { x: 7, y: 2 },
  },
  {
    id: "earphone",
    emoji: "🎧",
    name: "이어폰",
    story: "가격 1에서 7, 가격 5에서 4만큼 팔렸어요.",
    tone: "violet",
    A: { x: 1, y: 7 },
    B: { x: 5, y: 4 },
  },
];

export const GX_MAX = 10;
export const GY_MAX = 12;
export const SNAP = 0.5;

/** 두 점을 지나는 직선의 기울기와 y절편 */
export function lineOf(A: Pt, B: Pt): { a: number; b: number; ok: boolean } {
  if (Math.abs(B.x - A.x) < 1e-9) return { a: 0, b: 0, ok: false };
  const a = (B.y - A.y) / (B.x - A.x);
  return { a, b: A.y - a * A.x, ok: true };
}

/** 예측 표에 쓸 가격들 */
export const FORECAST_PRICES = [1, 2, 3, 4, 5, 6];

// ══════════════════════════════════════════════════════════════
//  탭 ② 최소제곱법으로 예측하기
// ══════════════════════════════════════════════════════════════
export type LsqSetup = {
  emoji: string;
  name: string;
  priceUnit: string;
  qtyUnit: string;
  /** 수요함수의 꼴 —  Qd = a x + b0 */
  b0: number;
  data: Pt[];
  aMin: number;
  aMax: number;
  aStep: number;
  aStart: number;
  /** 식을 얻은 뒤 예측해 볼 가격 */
  forecastX: number;
};

export const LSQ: LsqSetup = {
  emoji: "🧁",
  name: "컵케이크 가게",
  priceUnit: "천원",
  qtyUnit: "개",
  b0: 80,
  data: [
    { x: 1, y: 79 },
    { x: 2, y: 73 },
    { x: 3, y: 71 },
  ],
  aMin: -6,
  aMax: 0,
  aStep: 0.05,
  aStart: -1,
  forecastX: 5,
};

/** C(a) = Σ (a·xᵢ + b0 − yᵢ)² 를 a 에 대한 이차식 A2·a² + A1·a + A0 로 */
export function lsqCoefs(s: LsqSetup): { A2: number; A1: number; A0: number; aBest: number; cMin: number } {
  let A2 = 0,
    A1 = 0,
    A0 = 0;
  for (const p of s.data) {
    const c = s.b0 - p.y;
    A2 += p.x * p.x;
    A1 += 2 * p.x * c;
    A0 += c * c;
  }
  const aBest = -A1 / (2 * A2);
  return { A2, A1, A0, aBest, cMin: A0 - (A1 * A1) / (4 * A2) };
}

/** 어떤 a 에서의 오차 제곱합 */
export function cOf(s: LsqSetup, a: number): number {
  return s.data.reduce((sum, p) => sum + (a * p.x + s.b0 - p.y) ** 2, 0);
}

/** C 를 항별로 펼친 식 (KaTeX) */
export function lsqTermsTex(s: LsqSetup): string {
  return (
    "C = " +
    s.data
      .map((p) => {
        const coef = p.x === 1 ? "a" : `${fmt(p.x)}a`;
        const c = s.b0 - p.y;
        return c === 0 ? `(${coef})^2` : `(${coef} ${signed(c)})^2`;
      })
      .join(" + ")
  );
}

/** C 를 정리한 이차식과 완전제곱식 (KaTeX) */
export function lsqSquareTex(s: LsqSetup): { poly: string; square: string } {
  const { A2, A1, A0, aBest, cMin } = lsqCoefs(s);
  return {
    poly: `C = ${fmt(A2)}a^2 ${signed(A1)}a ${signed(A0)}`,
    square: `C = ${fmt(A2)}(a ${signed(-aBest)})^2 ${signed(cMin)}`,
  };
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 단계별 문제
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
  table?: { head: string[]; rows: string[][] };
  steps: PStep[];
  wrapUp: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "p1",
    emoji: "🍡",
    title: "문제 1 · 두 점으로 수요곡선 찾기",
    scenario:
      "어떤 간식의 수요곡선이 직선이라고 한다. 조사한 두 자료가 아래와 같을 때, 수요함수 Qd = ax + b를 구하고 수요량을 예측해 보자.",
    table: { head: ["가격 x", "3", "7"], rows: [["수요량 Qd", "24", "12"]] },
    steps: [
      {
        kind: "number",
        id: "p1s1",
        ask: "직선의 기울기 a를 구하세요. (음수면 - 기호를 함께 쓰세요)",
        tex: "a = \\dfrac{12 - 24}{7 - 3}",
        hint: "수요량의 변화량 ÷ 가격의 변화량",
        answer: -3,
        suffix: "",
        explain: "(12 − 24) ÷ (7 − 3) = −12 ÷ 4 = −3 이에요.",
      },
      {
        kind: "number",
        id: "p1s2",
        ask: "y절편 b를 구하세요.",
        tex: "24 = -3 \\times 3 + b",
        hint: "24 = −9 + b",
        answer: 33,
        suffix: "",
        explain: "b = 33. 따라서 수요함수는 Qd = −3x + 33 이에요.",
      },
      {
        kind: "number",
        id: "p1s3",
        ask: "가격이 5일 때의 수요량을 예측하세요.",
        tex: "Q_d = -3 \\times 5 + 33",
        hint: "−15 + 33",
        answer: 18,
        suffix: "",
        explain: "−15 + 33 = 18. 자료에 없던 가격의 수요량도 식으로 예측할 수 있어요.",
      },
      {
        kind: "number",
        id: "p1s4",
        ask: "수요량이 0이 되는 가격은 얼마일까요?",
        tex: "-3x + 33 = 0",
        hint: "3x = 33",
        answer: 11,
        suffix: "",
        explain: "x = 11. 값이 11보다 비싸지면 아무도 사지 않는다고 본 것이죠.",
      },
    ],
    wrapUp:
      "직선인 수요곡선은 두 점만 있으면 식을 완전히 정할 수 있어요. 식을 얻으면 조사하지 않은 가격의 수요량도 예측할 수 있습니다.",
  },
  {
    id: "p2",
    emoji: "🥯",
    title: "문제 2 · 최소제곱법으로 예측하기",
    scenario:
      "다음 조건을 만족하는 수요함수를 예측하고, 가격이 3일 때의 수요량을 예측해 보자. 조사한 값들이 한 직선 위에 정확히 놓이지 않으므로, 예측 수요량과 실제 수요량의 차의 제곱을 모두 더한 값 C가 가장 작아지도록 상수 a를 정한다.",
    tex: "Q_d = ax + 60",
    table: { head: ["가격 x", "1", "2", "4"], rows: [["실제 수요량", "58", "51", "44"]] },
    steps: [
      {
        kind: "choice",
        id: "p2s1",
        ask: "가격이 1일 때, (예측 수요량) − (실제 수요량)을 a로 나타내면?",
        tex: "(a \\times 1 + 60) - 58",
        hint: "a + 60 − 58",
        options: [{ tex: "a + 2" }, { tex: "a - 2" }, { tex: "a + 58" }, { tex: "58 - a" }],
        answer: 0,
        explain: "a + 60 − 58 = a + 2 예요. 같은 방법으로 나머지도 2a + 9, 4a + 16 이 됩니다.",
      },
      {
        kind: "number",
        id: "p2s2",
        ask: "세 차의 제곱을 모두 더한 C를 정리하면 C = 21a² + 168a + 341 이에요. 이것을 C = 21(a + k)² + 5 꼴로 고칠 때 k의 값은?",
        tex: "C = 21a^2 + 168a + 341",
        hint: "21(a² + 8a) + 341 = 21(a + 4)² − 336 + 341",
        answer: 4,
        suffix: "",
        explain: "21(a + 4)² + 5 예요. 168 ÷ (2 × 21) = 4 임을 이용해도 됩니다.",
      },
      {
        kind: "number",
        id: "p2s3",
        ask: "C를 가장 작게 만드는 a의 값은? (음수면 - 기호를 함께 쓰세요)",
        tex: "C = 21(a + 4)^2 + 5",
        hint: "제곱이 0이 될 때 가장 작아요.",
        answer: -4,
        suffix: "",
        explain: "a = −4일 때 C = 5로 가장 작아요. 따라서 수요함수는 Qd = −4x + 60 으로 판단합니다.",
      },
      {
        kind: "number",
        id: "p2s4",
        ask: "이 수요함수로 가격이 3일 때의 수요량을 예측하세요.",
        tex: "Q_d = -4 \\times 3 + 60",
        hint: "−12 + 60",
        answer: 48,
        suffix: "",
        explain: "−12 + 60 = 48 이에요.",
      },
    ],
    wrapUp:
      "자료가 한 직선 위에 놓이지 않아도 괜찮아요. 오차의 제곱의 합 C는 상수 a에 대한 이차함수라, 완전제곱식으로 고쳐 꼭짓점을 찾으면 가장 잘 맞는 직선을 정할 수 있습니다.",
  },
  {
    id: "p3",
    emoji: "🧤",
    title: "문제 3 · 예측을 어디까지 믿을까",
    scenario: "어떤 장갑의 수요곡선이 직선이라고 한다. 조사한 두 자료가 아래와 같다.",
    table: { head: ["가격 x", "2", "6"], rows: [["수요량 Qd", "90", "66"]] },
    steps: [
      {
        kind: "number",
        id: "p3s1",
        ask: "직선의 기울기 a를 구하세요. (음수면 - 기호를 함께 쓰세요)",
        tex: "a = \\dfrac{66 - 90}{6 - 2}",
        hint: "(66 − 90) ÷ (6 − 2)",
        answer: -6,
        suffix: "",
        explain: "−24 ÷ 4 = −6. y절편은 90 − (−6 × 2) = 102 이므로 Qd = −6x + 102 예요.",
      },
      {
        kind: "number",
        id: "p3s2",
        ask: "가격이 4일 때의 수요량을 예측하세요.",
        tex: "Q_d = -6 \\times 4 + 102",
        hint: "−24 + 102",
        answer: 78,
        suffix: "",
        explain: "−24 + 102 = 78 이에요.",
      },
      {
        kind: "number",
        id: "p3s3",
        ask: "수요량이 60이 되게 하려면 가격을 얼마로 정해야 할까요?",
        tex: "-6x + 102 = 60",
        hint: "6x = 42",
        answer: 7,
        suffix: "",
        explain: "6x = 42 → x = 7 이에요.",
      },
      {
        kind: "choice",
        id: "p3s4",
        ask: "이 식에 가격 20을 넣으면 수요량이 −18로 나와요. 이 결과를 어떻게 보아야 할까요?",
        tex: "Q_d = -6 \\times 20 + 102 = -18",
        hint: "수요량은 사려는 상품의 양이에요. 음수가 될 수 있을까요?",
        options: [
          { text: "가격 20에서는 18만큼 되팔린다는 뜻이다" },
          { text: "수요량은 음수가 될 수 없으므로, 조사한 범위를 크게 벗어난 예측은 믿기 어렵다" },
          { text: "계산이 틀렸으므로 다시 해야 한다" },
          { text: "수요곡선의 기울기를 양수로 바꿔야 한다" },
        ],
        answer: 1,
        explain:
          "직선은 조사한 자료 근처에서만 잘 맞아요. 자료의 범위를 크게 벗어난 곳까지 그대로 늘여 예측하면 이렇게 뜻이 통하지 않는 값이 나옵니다.",
      },
    ],
    wrapUp:
      "예측은 편리하지만 만능은 아니에요. 조사한 가격의 범위 안에서는 잘 맞지만, 그 밖으로 멀리 나가면 수요량이 음수가 되는 것처럼 뜻이 통하지 않는 값이 나올 수 있습니다.",
  },
];
