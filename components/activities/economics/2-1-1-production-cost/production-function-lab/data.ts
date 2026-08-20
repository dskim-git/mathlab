// 생산함수 — 활동 데이터
//
//  · 생산 요소: 어떤 상품을 생산하기 위해 투입하는 투입물.
//    (인적 자본·자연 자원 등도 있지만 간단한 모델링을 위해 노동 L·자본 K 만 고려한다.)
//  · 생산함수: 생산량 Q 를 노동량 L 과 자본량 K 의 함수로 나타낸 것.  Q = f(L, K)
//  · L, K, Q 는 모두 음이 아닌 실수.
//  · Q = f(L, K) 에서 L 을 고정하면 Q 는 K 에 대한 일변수함수,
//                    K 를 고정하면 Q 는 L 에 대한 일변수함수가 된다. (= 단면)

/** 조작 구간 — 노동량·자본량 모두 0 이상 5 이하 */
export const LMAX = 5;
export const KMAX = 5;

/** 수식에 넣을 수 있게 꼬리 0 을 없앤 수 문자열 */
export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}

/** 정수 제곱근이면 그 값, 아니면 null */
function exactSqrt(c: number): number | null {
  if (c < 0) return null;
  const s = Math.round(Math.sqrt(c));
  return Math.abs(s * s - c) < 1e-9 ? s : null;
}

// ══════════════════════════════════════════════════════════════
//  단면(일변수함수) 정보
// ══════════════════════════════════════════════════════════════
export type Section = {
  /** 단면으로 얻어지는 일변수함수 식 (KaTeX · 한글 없음) */
  tex: string;
  /** 그래프 모양을 부르는 이름 (한글) */
  shape: string;
};

// ══════════════════════════════════════════════════════════════
//  생산함수 프리셋
// ══════════════════════════════════════════════════════════════
export type PresetId = "mul" | "root" | "linear" | "pair";

export type Preset = {
  id: PresetId;
  emoji: string;
  name: string;
  /** 생산함수 식 (KaTeX) */
  tex: string;
  /** 한 줄 설명 */
  story: string;
  /** 색 계열 (tailwind 색 이름) */
  tone: "emerald" | "sky" | "amber" | "violet";
  /** 그래프 색 (저 → 고) */
  ramp: [string, string, string];
  f: (L: number, K: number) => number;
  /** 값을 대입해 보여 주는 계산 과정 (KaTeX) */
  subst: (L: number, K: number) => string;
  /** L = a 로 고정했을 때 얻어지는 K 의 함수 */
  fixL: (a: number) => Section;
  /** K = b 로 고정했을 때 얻어지는 L 의 함수 */
  fixK: (b: number) => Section;
};

const RAMP_EMERALD: [string, string, string] = ["#0e7490", "#10b981", "#a3e635"];
const RAMP_SKY: [string, string, string] = ["#1e3a8a", "#3b82f6", "#67e8f9"];
const RAMP_AMBER: [string, string, string] = ["#7c2d12", "#f59e0b", "#fde68a"];
const RAMP_VIOLET: [string, string, string] = ["#4c1d95", "#8b5cf6", "#f0abfc"];

export const PRESETS: Preset[] = [
  {
    id: "mul",
    emoji: "🧱",
    name: "곱셈형",
    tex: "Q = LK",
    story: "노동과 자본을 곱한 만큼 생산돼요. 둘 중 하나라도 0이면 생산량도 0!",
    tone: "emerald",
    ramp: RAMP_EMERALD,
    f: (L, K) => L * K,
    subst: (L, K) => `Q = ${fmt(L)} \\times ${fmt(K)} = ${fmt(L * K)}`,
    fixL: (a) => ({
      tex: a === 0 ? "Q = 0" : a === 1 ? "Q = K" : `Q = ${fmt(a)}K`,
      shape: a === 0 ? "가로축에 붙은 직선" : "원점을 지나는 직선",
    }),
    fixK: (b) => ({
      tex: b === 0 ? "Q = 0" : b === 1 ? "Q = L" : `Q = ${fmt(b)}L`,
      shape: b === 0 ? "가로축에 붙은 직선" : "원점을 지나는 직선",
    }),
  },
  {
    id: "root",
    emoji: "👟",
    name: "제곱근형",
    tex: "Q = \\sqrt{2LK}",
    story: "등산화 공장. 요소를 늘려도 생산량은 점점 천천히 늘어요.",
    tone: "sky",
    ramp: RAMP_SKY,
    f: (L, K) => Math.sqrt(2 * L * K),
    subst: (L, K) =>
      `Q = \\sqrt{2 \\times ${fmt(L)} \\times ${fmt(K)}} = \\sqrt{${fmt(2 * L * K)}} \\approx ${fmt(Math.sqrt(2 * L * K))}`,
    fixL: (a) => {
      const c = 2 * a;
      const s = exactSqrt(c);
      return {
        tex:
          c === 0
            ? "Q = 0"
            : c === 1
              ? "Q = \\sqrt{K}"
              : s !== null
                ? `Q = \\sqrt{${fmt(c)}K} = ${s}\\sqrt{K}`
                : `Q = \\sqrt{${fmt(c)}K}`,
        shape: c === 0 ? "가로축에 붙은 직선" : "무리함수 곡선",
      };
    },
    fixK: (b) => {
      const c = 2 * b;
      const s = exactSqrt(c);
      return {
        tex:
          c === 0
            ? "Q = 0"
            : c === 1
              ? "Q = \\sqrt{L}"
              : s !== null
                ? `Q = \\sqrt{${fmt(c)}L} = ${s}\\sqrt{L}`
                : `Q = \\sqrt{${fmt(c)}L}`,
        shape: c === 0 ? "가로축에 붙은 직선" : "무리함수 곡선",
      };
    },
  },
  {
    id: "linear",
    emoji: "🔁",
    name: "덧셈형",
    tex: "Q = 3L + 2K",
    story: "사람 손과 기계가 서로를 대신할 수 있어요. 한쪽이 0이어도 생산은 돼요.",
    tone: "amber",
    ramp: RAMP_AMBER,
    f: (L, K) => 3 * L + 2 * K,
    subst: (L, K) => `Q = 3 \\times ${fmt(L)} + 2 \\times ${fmt(K)} = ${fmt(3 * L + 2 * K)}`,
    fixL: (a) => ({
      tex: a === 0 ? "Q = 2K" : `Q = 2K + ${fmt(3 * a)}`,
      shape: "기울기가 2인 직선",
    }),
    fixK: (b) => ({
      tex: b === 0 ? "Q = 3L" : `Q = 3L + ${fmt(2 * b)}`,
      shape: "기울기가 3인 직선",
    }),
  },
  {
    id: "pair",
    emoji: "🚲",
    name: "짝 맞추기형",
    tex: "Q = 4\\min(L,\\,K)",
    story: "프레임과 바퀴가 짝을 이뤄야 자전거 한 대. 한쪽만 늘리면 소용없어요.",
    tone: "violet",
    ramp: RAMP_VIOLET,
    f: (L, K) => 4 * Math.min(L, K),
    subst: (L, K) =>
      `Q = 4 \\times \\min(${fmt(L)},\\,${fmt(K)}) = 4 \\times ${fmt(Math.min(L, K))} = ${fmt(4 * Math.min(L, K))}`,
    fixL: (a) => ({
      tex: a === 0 ? "Q = 0" : `Q = 4K \\;\\; (K \\le ${fmt(a)}), \\qquad Q = ${fmt(4 * a)} \\;\\; (K \\ge ${fmt(a)})`,
      shape: a === 0 ? "가로축에 붙은 직선" : "올라가다 평평해지는 꺾은선",
    }),
    fixK: (b) => ({
      tex: b === 0 ? "Q = 0" : `Q = 4L \\;\\; (L \\le ${fmt(b)}), \\qquad Q = ${fmt(4 * b)} \\;\\; (L \\ge ${fmt(b)})`,
      shape: b === 0 ? "가로축에 붙은 직선" : "올라가다 평평해지는 꺾은선",
    }),
  },
];

export function presetOf(id: PresetId): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}

/** 구간 안에서의 최대 생산량 — 그래프 세로 눈금에 쓴다 */
export function qMaxOf(p: Preset): number {
  return p.f(LMAX, KMAX);
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 단계별 문제
// ══════════════════════════════════════════════════════════════

/** 미니 그래프 썸네일 모양 */
export type Shape = "line" | "sqrt" | "parab" | "inv" | "kink" | "flat";

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
  | { kind: "choice"; id: string; ask: string; tex?: string; hint: string; options: Choice[]; answer: number; explain: string }
  | { kind: "shape"; id: string; ask: string; tex?: string; hint: string; options: Shape[]; answer: number; explain: string };

export type Problem = {
  id: string;
  emoji: string;
  title: string;
  scenario: string;
  /** 문제에 주어진 생산함수 (KaTeX) */
  tex: string;
  given: { label: string; value: string }[];
  steps: PStep[];
  wrapUp: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "p1",
    emoji: "🧱",
    title: "문제 1 · 곱셈형 생산함수",
    scenario: "어떤 공장의 생산함수 Q가 노동량 L과 자본량 K에 대하여 다음과 같다고 한다.",
    tex: "Q = 3LK",
    given: [
      { label: "생산함수", value: "Q = 3LK" },
      { label: "변수", value: "노동량 L, 자본량 K (0 이상)" },
      { label: "함수의 종류", value: "L과 K의 이변수함수" },
    ],
    steps: [
      {
        kind: "number",
        id: "p1s1",
        ask: "노동량이 4, 자본량이 5일 때 생산량 Q를 구하세요.",
        tex: "Q = 3 \\times 4 \\times 5",
        hint: "3 × 4 × 5",
        answer: 60,
        suffix: "",
        explain: "Q = 3 × 4 × 5 = 60. 이변수함수는 두 값을 모두 넣어야 값이 하나 정해져요.",
      },
      {
        kind: "number",
        id: "p1s2",
        ask: "자본량은 5 그대로 두고 노동량만 2배인 8로 늘리면 생산량은 얼마가 될까요?",
        tex: "Q = 3 \\times 8 \\times 5",
        hint: "3 × 8 × 5",
        answer: 120,
        suffix: "",
        explain:
          "120. 처음의 2배예요. K = 5로 고정하면 Q = 15L 이라 노동량과 생산량이 정비례하기 때문이죠.",
      },
      {
        kind: "number",
        id: "p1s3",
        ask: "이번에는 노동량과 자본량을 모두 2배(L = 8, K = 10)로 늘려 보세요. 생산량은?",
        tex: "Q = 3 \\times 8 \\times 10",
        hint: "3 × 8 × 10",
        answer: 240,
        suffix: "",
        explain:
          "240 — 처음(60)의 4배! 곱셈형에서는 두 요소를 함께 2배로 늘리면 2 × 2 = 4배가 돼요.",
      },
      {
        kind: "shape",
        id: "p1s4",
        ask: "자본량을 K = 5로 고정하면 Q = 15L 이 됩니다. 이 일변수함수의 그래프 모양은?",
        tex: "Q = 15L",
        hint: "Q와 L이 정비례하는 일차함수예요.",
        options: ["parab", "line", "inv", "sqrt"],
        answer: 1,
        explain: "원점을 지나는 직선이에요. 이변수함수를 한 변수로 자르면 이렇게 익숙한 일변수함수가 나와요.",
      },
    ],
    wrapUp:
      "곱셈형 생산함수에서는 한 요소만 2배로 늘리면 생산량도 2배지만, 두 요소를 함께 2배로 늘리면 4배가 돼요. 어느 요소를 늘리느냐에 따라 결과가 달라집니다.",
  },
  {
    id: "p2",
    emoji: "👟",
    title: "문제 2 · 제곱근형 생산함수",
    scenario: "운동화를 생산하는 어떤 회사의 생산함수 Q가 노동량 L과 자본량 K에 대하여 다음과 같다고 한다.",
    tex: "Q = \\sqrt{8LK}",
    given: [
      { label: "생산함수", value: "Q = √(8LK)" },
      { label: "고정할 요소", value: "자본량 K = 2" },
      { label: "구할 것", value: "L에 대한 생산함수와 그 그래프" },
    ],
    steps: [
      {
        kind: "choice",
        id: "p2s1",
        ask: "자본량이 2로 고정될 때, 생산함수를 노동량 L에 대한 식으로 나타내면?",
        tex: "Q = \\sqrt{8 \\times L \\times 2}",
        hint: "8 × 2 = 16 이니까 √(16L) 이에요. 16을 근호 밖으로 꺼내 보세요.",
        options: [
          { tex: "Q = \\sqrt{8L}" },
          { tex: "Q = \\sqrt{16L} = 4\\sqrt{L}" },
          { tex: "Q = 16\\sqrt{L}" },
          { tex: "Q = 8L" },
        ],
        answer: 1,
        explain: "√(8 · L · 2) = √(16L) = 4√L. 자본량을 고정하니 L만의 일변수함수가 되었어요.",
      },
      {
        kind: "number",
        id: "p2s2",
        ask: "그때 노동량이 9이면 생산량은 얼마일까요?",
        tex: "Q = 4\\sqrt{9}",
        hint: "4 × √9 = 4 × 3",
        answer: 12,
        suffix: "",
        explain: "4 × 3 = 12 예요.",
      },
      {
        kind: "shape",
        id: "p2s3",
        ask: "Q = 4√L 의 그래프는 어떤 모양일까요?",
        tex: "Q = 4\\sqrt{L}",
        hint: "원점에서 출발해 처음엔 가파르다가 점점 완만해지는 곡선이에요.",
        options: ["line", "sqrt", "inv", "parab"],
        answer: 1,
        explain:
          "무리함수의 그래프예요. 노동량을 늘릴수록 생산량은 늘지만 늘어나는 폭은 점점 작아져요.",
      },
      {
        kind: "number",
        id: "p2s4",
        ask: "생산량이 20이 되려면 노동량은 얼마여야 할까요?",
        tex: "4\\sqrt{L} = 20",
        hint: "√L = 5 이면 L은?",
        answer: 25,
        suffix: "",
        explain: "4√L = 20 → √L = 5 → L = 25. 생산량을 구하는 식을 거꾸로 풀면 필요한 노동량을 알 수 있어요.",
      },
    ],
    wrapUp:
      "두 변수 중 하나를 고정하면 이변수 생산함수가 우리가 아는 무리함수 하나로 바뀝니다. 고등학교에서 생산함수를 다룰 때 늘 이렇게 한 요소를 고정하는 이유예요.",
  },
  {
    id: "p3",
    emoji: "🍞",
    title: "문제 3 · 노동량 되돌아 구하기",
    scenario: "어떤 제과 공장의 생산함수 Q가 노동량 L에 대하여 다음과 같다고 한다.",
    tex: "Q = 25L",
    given: [
      { label: "생산함수", value: "Q = 25L" },
      { label: "뜻", value: "노동량 1당 25개 생산" },
      { label: "구할 것", value: "목표 생산량에 필요한 노동량" },
    ],
    steps: [
      {
        kind: "number",
        id: "p3s1",
        ask: "노동량이 40일 때 생산량은 얼마일까요?",
        tex: "Q = 25 \\times 40",
        hint: "25 × 40",
        answer: 1000,
        suffix: "개",
        explain: "25 × 40 = 1,000개예요.",
      },
      {
        kind: "number",
        id: "p3s2",
        ask: "생산량이 30,000이 되려면 투입해야 하는 노동량은 얼마일까요?",
        tex: "25L = 30000",
        hint: "30000 ÷ 25",
        answer: 1200,
        suffix: "",
        explain: "25L = 30,000 → L = 1,200. 생산량을 알고 노동량을 거꾸로 구했어요.",
      },
      {
        kind: "number",
        id: "p3s3",
        ask: "생산량을 45,000으로 늘리려면 노동량을 지금보다 얼마나 더 투입해야 할까요?",
        tex: "L = \\dfrac{45000}{25}",
        hint: "45000 ÷ 25 = 1800. 여기서 1,200을 빼세요.",
        answer: 600,
        suffix: "만큼 더",
        explain: "1,800 − 1,200 = 600. 정비례이므로 생산량이 1.5배가 되면 노동량도 1.5배가 돼요.",
      },
    ],
    wrapUp:
      "Q = 25L 처럼 일차함수인 생산함수에서는 생산량과 노동량이 정비례해요. 그래서 L = Q ÷ 25 로 필요한 노동량을 바로 구할 수 있습니다.",
  },
  {
    id: "p4",
    emoji: "🏢",
    title: "문제 4 · 상수 a 구하기",
    scenario:
      "어떤 기업의 생산함수 Q가 자본량 K에 대하여 다음과 같고, 자본량이 9일 때의 생산량이 480이라고 한다. (단, a는 상수)",
    tex: "Q = a\\sqrt{K}",
    given: [
      { label: "생산함수", value: "Q = a√K" },
      { label: "주어진 조건", value: "K = 9일 때 Q = 480" },
      { label: "구할 것", value: "a의 값과 다른 자본량에서의 생산량" },
    ],
    steps: [
      {
        kind: "number",
        id: "p4s1",
        ask: "상수 a의 값을 구하세요.",
        tex: "480 = a\\sqrt{9}",
        hint: "√9 = 3 이므로 3a = 480",
        answer: 160,
        suffix: "",
        explain: "480 = a × 3 이므로 a = 160 이에요.",
      },
      {
        kind: "number",
        id: "p4s2",
        ask: "그럼 자본량이 25일 때의 생산량은 얼마일까요?",
        tex: "Q = 160\\sqrt{25}",
        hint: "160 × √25 = 160 × 5",
        answer: 800,
        suffix: "",
        explain: "160 × 5 = 800 이에요.",
      },
      {
        kind: "number",
        id: "p4s3",
        ask: "생산량이 1,600이 되려면 자본량은 얼마여야 할까요?",
        tex: "160\\sqrt{K} = 1600",
        hint: "√K = 10 이면 K는?",
        answer: 100,
        suffix: "",
        explain: "160√K = 1,600 → √K = 10 → K = 100 이에요.",
      },
      {
        kind: "choice",
        id: "p4s4",
        ask: "자본량을 4배로 늘리면 생산량은 몇 배가 될까요?",
        tex: "Q = a\\sqrt{4K}",
        hint: "√(4K) = 2√K 예요.",
        options: [{ text: "2배" }, { text: "4배" }, { text: "8배" }, { text: "16배" }],
        answer: 0,
        explain:
          "√(4K) = 2√K 이므로 생산량은 2배! 자본을 4배나 늘려도 생산량은 2배밖에 늘지 않아요. 이것을 수확 체감이라고 해요.",
      },
    ],
    wrapUp:
      "조건이 하나 주어지면 생산함수 속 상수를 정할 수 있어요. 제곱근형 생산함수는 요소를 크게 늘려도 생산량이 그만큼 늘지 않는다는 점이 특징입니다.",
  },
];
