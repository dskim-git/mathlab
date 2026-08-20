// 효용의 순서와 크기 — 활동 데이터
//
//  · 서수적 효용함수: 만족도의 순서는 알 수 있으나 만족도의 크기는 알 수 없는 효용함수.
//  · 기수적 효용함수: 만족도의 순서와 크기를 모두 알 수 있는 효용함수.
//  · 기수적 정보가 있으면 서수적 정보(선호도 순위)는 언제나 뽑아낼 수 있지만,
//    서수적 정보만으로는 크기를 알 수 없다.
//  · U 가 커질 때 함께 커지는 변환(단조증가 변환)을 하면 값은 달라져도 순위는 그대로다.
//    그래서 같은 선호를 나타내는 서수적 효용함수는 무수히 많다.
//  · 보통 소비자와 관련된 이론에서는 서수적 효용함수만으로도 충분한 정보 도출이 가능하다.
//
//  ※ 아래 수치는 순서와 크기의 차이를 살펴보기 위해 꾸민 것이다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}

/** 값이 클수록 1위 — 1부터 시작하는 선호도 순위 */
export function rankOf(values: number[]): number[] {
  return values.map((v) => 1 + values.filter((w) => w > v).length);
}

/** 순위 수열이 같은지 */
export function sameRank(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 사례 — 효용의 크기가 주어졌을 때 순위 채우기
// ══════════════════════════════════════════════════════════════
export type OrdCase = {
  id: string;
  emoji: string;
  name: string;
  unit: string;
  story: string;
  tone: "emerald" | "sky" | "amber" | "violet";
  /** 소비량 1 ~ 5 에서의 효용의 크기 */
  values: number[];
  /** 미리 채워 주는 칸 (소비량, 1부터) */
  given: number;
};

export const ORD_CASES: OrdCase[] = [
  {
    id: "donut",
    emoji: "🍩",
    name: "도넛",
    unit: "개",
    story: "네 개까지는 점점 좋아지다가 다섯 개째엔 조금 물려요.",
    tone: "amber",
    values: [3, 7, 9, 12, 10],
    given: 4,
  },
  {
    id: "juice",
    emoji: "🧃",
    name: "주스",
    unit: "잔",
    story: "마실수록 계속 좋아지지만 늘어나는 폭은 줄어들어요.",
    tone: "emerald",
    values: [4, 8, 11, 13, 14],
    given: 5,
  },
  {
    id: "ramen",
    emoji: "🍜",
    name: "라면",
    unit: "그릇",
    story: "두 그릇이 가장 좋고, 그 뒤로는 부담스러워요.",
    tone: "sky",
    values: [6, 10, 9, 5, 2],
    given: 2,
  },
];

export const ORD_XS = [1, 2, 3, 4, 5];

export function ordCaseOf(id: string): OrdCase {
  return ORD_CASES.find((c) => c.id === id) ?? ORD_CASES[0];
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 값을 바꿔도 순위는 그대로일까 — 변환
// ══════════════════════════════════════════════════════════════
export type Transform = {
  id: string;
  /** 버튼에 쓸 한글 이름 */
  label: string;
  /** 식 (KaTeX · 한글 없음) */
  tex: string;
  color: string;
  apply: (u: number) => number;
  /** U 가 커질 때 함께 커지면 up, 반대로 작아지면 down */
  dir: "up" | "down";
};

export const TRANSFORMS: Transform[] = [
  { id: "id", label: "그대로", tex: "V = U", color: "#34d399", apply: (u) => u, dir: "up" },
  { id: "x2", label: "2배로 늘리기", tex: "V = 2U", color: "#38bdf8", apply: (u) => 2 * u, dir: "up" },
  { id: "p10", label: "10 더하기", tex: "V = U + 10", color: "#a78bfa", apply: (u) => u + 10, dir: "up" },
  { id: "sq", label: "제곱하기", tex: "V = U^2", color: "#fbbf24", apply: (u) => u * u, dir: "up" },
  { id: "sqrt", label: "제곱근 씌우기", tex: "V = \\sqrt{U}", color: "#f472b6", apply: (u) => Math.sqrt(Math.max(0, u)), dir: "up" },
  { id: "neg", label: "부호 바꾸기", tex: "V = -U", color: "#f43f5e", apply: (u) => -u, dir: "down" },
  { id: "sub", label: "20에서 빼기", tex: "V = 20 - U", color: "#fb923c", apply: (u) => 20 - u, dir: "down" },
];

// ══════════════════════════════════════════════════════════════
//  탭 ③ 순서만으로 답할 수 있을까
// ══════════════════════════════════════════════════════════════
export type SortQ = {
  id: string;
  emoji: string;
  q: string;
  /** order = 순서만으로 답할 수 있음 · size = 크기까지 알아야 함 */
  need: "order" | "size";
  why: string;
};

export const SORT_QS: SortQ[] = [
  {
    id: "q1",
    emoji: "⚖️",
    q: "세 개와 다섯 개 중 어느 쪽이 더 만족스러울까?",
    need: "order",
    why: "둘 중 어느 쪽이 위인지만 알면 되니 순위만 있어도 답할 수 있어요.",
  },
  {
    id: "q2",
    emoji: "✖️",
    q: "다섯 개는 세 개보다 몇 배 더 만족스러울까?",
    need: "size",
    why: "‘몇 배’를 따지려면 만족도의 크기를 알아야 해요.",
  },
  {
    id: "q4",
    emoji: "➕",
    q: "네 번째 한 개가 더해 주는 만족(한계효용)은 얼마일까?",
    need: "size",
    why: "빼기를 하려면 두 만족도의 크기가 필요해요.",
  },
  {
    id: "q3",
    emoji: "🥇",
    q: "가장 만족스러운 소비량은 몇 개일까?",
    need: "order",
    why: "1위가 어디인지만 알면 되니 순위로 충분해요.",
  },
  {
    id: "q6",
    emoji: "📊",
    q: "한계효용이 점점 작아지는지(체감하는지) 확인하기",
    need: "size",
    why: "늘어난 만족의 ‘양’을 서로 비교해야 하므로 크기가 필요해요.",
  },
  {
    id: "q5",
    emoji: "📉",
    q: "소비량이 늘어날 때 만족이 커지고 있는지 작아지고 있는지?",
    need: "order",
    why: "앞뒤 순위만 견주어도 오르막인지 내리막인지 알 수 있어요.",
  },
  {
    id: "q7",
    emoji: "🛒",
    q: "떡볶이와 김밥 중 무엇을 먼저 살까?",
    need: "order",
    why: "어느 쪽이 더 좋은지만 정하면 되니 순위로 충분해요.",
  },
  {
    id: "q8",
    emoji: "🔢",
    q: "만족도가 정확히 7점이라고 말하기",
    need: "size",
    why: "점수를 매기는 것 자체가 크기를 나타내는 일이에요.",
  },
  {
    id: "q10",
    emoji: "➗",
    q: "만족이 두 배가 되려면 몇 개를 먹어야 할까?",
    need: "size",
    why: "‘두 배’라는 말이 나오는 순간 크기가 필요해요.",
  },
  {
    id: "q9",
    emoji: "🏅",
    q: "1위부터 5위까지 선호도 순위를 매기기",
    need: "order",
    why: "순위를 매기는 일이니 순서 정보만 있으면 돼요.",
  },
];

export const SORT_WRAP =
  "소비자 이론에서 궁금한 것은 대개 ‘어느 쪽이 더 좋은가’예요. 그래서 서수적 효용함수만으로도 충분한 정보를 끌어낼 수 있습니다.";

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
  table?: { head: string[]; rows: string[][] };
  steps: PStep[];
  wrapUp: string;
};

/** 문제 1·3·4 에 쓰는 자료 */
export const P1_VALUES = [5, 11, 8, 14, 12];
export const P3_VALUES = [2, 5, 9, 6, 3];
export const P4_VALUES = [4, 9, 12, 13];

export const PROBLEMS: Problem[] = [
  {
    id: "o1",
    emoji: "🍪",
    title: "문제 1 · 크기에서 순위 뽑기",
    scenario:
      "어떤 재화의 소비량을 x라고 할 때, 소비량에 따른 효용의 크기가 다음과 같다. 선호도 순위를 매겨 보자.",
    table: {
      head: ["x", "1", "2", "3", "4", "5"],
      rows: [["효용의 크기", "5", "11", "8", "14", "12"]],
    },
    steps: [
      {
        kind: "number",
        id: "o1s1",
        ask: "선호도 1위인 소비량은 얼마일까요?",
        hint: "효용의 크기가 가장 큰 곳을 찾아보세요.",
        answer: 4,
        suffix: "",
        explain: "효용이 14로 가장 큰 x = 4 가 1위예요.",
      },
      {
        kind: "number",
        id: "o1s2",
        ask: "소비량이 2일 때의 선호도 순위는 몇 위일까요?",
        hint: "14, 12 다음으로 큰 값이 11이에요.",
        answer: 3,
        suffix: "위",
        explain: "14(x = 4), 12(x = 5) 다음이므로 3위예요.",
      },
      {
        kind: "number",
        id: "o1s3",
        ask: "선호도 4위인 소비량은 얼마일까요?",
        hint: "큰 값부터 14, 12, 11, 8, 5 순이에요.",
        answer: 3,
        suffix: "",
        explain: "네 번째로 큰 값은 8이고, 그때의 소비량은 x = 3 이에요.",
      },
      {
        kind: "choice",
        id: "o1s4",
        ask: "이 표에서 순위만 남기고 효용의 크기를 지운다면, 다음 중 답할 수 없게 되는 질문은?",
        hint: "‘몇 배’, ‘얼마나’ 같은 말이 들어간 질문을 찾아보세요.",
        options: [
          { text: "가장 만족스러운 소비량은 몇 개인가?" },
          { text: "소비량 2와 3 중 어느 쪽이 더 만족스러운가?" },
          { text: "소비량 4는 소비량 1보다 몇 배 더 만족스러운가?" },
          { text: "소비량 5는 몇 위인가?" },
        ],
        answer: 2,
        explain:
          "‘몇 배’는 크기를 알아야 답할 수 있어요. 순위만 남은 서수적 효용함수로는 알 수 없습니다.",
      },
    ],
    wrapUp:
      "효용의 크기를 알면 순위는 언제나 뽑아낼 수 있어요(기수적 → 서수적). 하지만 그 반대는 되지 않습니다.",
  },
  {
    id: "o2",
    emoji: "🗣️",
    title: "문제 2 · 서수적일까, 기수적일까",
    scenario: "다음은 어떤 사람이 자기 만족을 이야기한 것이다. 각각 어떤 효용함수에 해당하는지 판단해 보자.",
    steps: [
      {
        kind: "choice",
        id: "o2s1",
        ask: "“나는 딸기를 가장 좋아하고, 그다음이 포도, 그다음이 사과야.”",
        hint: "순서를 말했나요, 크기를 말했나요?",
        options: [{ text: "서수적 효용함수" }, { text: "기수적 효용함수" }],
        answer: 0,
        explain: "순서만 말했고 얼마나 더 좋은지는 말하지 않았으므로 서수적이에요.",
      },
      {
        kind: "choice",
        id: "o2s2",
        ask: "“딸기의 만족도는 9점, 포도는 6점, 사과는 2점이야.”",
        hint: "점수를 매겼어요.",
        options: [{ text: "서수적 효용함수" }, { text: "기수적 효용함수" }],
        answer: 1,
        explain: "크기(점수)를 말했으므로 기수적이에요. 물론 순서도 함께 알 수 있죠.",
      },
      {
        kind: "choice",
        id: "o2s3",
        ask: "“딸기를 먹을 때의 만족은 사과를 먹을 때의 만족보다 4점 더 커.”",
        hint: "차이를 말하려면 무엇이 필요할까요?",
        options: [{ text: "서수적 효용함수" }, { text: "기수적 효용함수" }],
        answer: 1,
        explain: "차이를 말하려면 크기를 알아야 하므로 기수적이에요.",
      },
      {
        kind: "choice",
        id: "o2s4",
        ask: "보통 소비자와 관련된 이론에서는 어느 쪽만으로도 충분한 정보를 끌어낼 수 있을까요?",
        hint: "소비자가 하는 결정은 대부분 ‘무엇을 고를까’예요.",
        options: [
          { text: "서수적 효용함수" },
          { text: "기수적 효용함수" },
          { text: "둘 다 있어야 한다" },
          { text: "둘 다 필요 없다" },
        ],
        answer: 0,
        explain:
          "소비자는 결국 ‘어느 쪽을 고를까’를 정하므로 순서만 알아도 충분한 경우가 많아요. 그래서 서수적 효용함수를 많이 씁니다.",
      },
    ],
    wrapUp:
      "순서만 말하면 서수적, 크기·차이·배수를 말하면 기수적이에요. 기수적 효용함수는 서수적 정보를 모두 담고 있습니다.",
  },
  {
    id: "o3",
    emoji: "🔁",
    title: "문제 3 · 값을 바꿔도 순위는 그대로?",
    scenario:
      "어떤 재화의 소비량 x에 따른 효용의 크기가 아래와 같다. 이 효용에 V = 3U + 1 을 적용한 새 효용함수 V를 생각해 보자.",
    tex: "V = 3U + 1",
    table: {
      head: ["x", "1", "2", "3", "4", "5"],
      rows: [["효용 U", "2", "5", "9", "6", "3"]],
    },
    steps: [
      {
        kind: "number",
        id: "o3s1",
        ask: "소비량이 3일 때의 V 값을 구하세요.",
        tex: "V = 3 \\times 9 + 1",
        hint: "27 + 1",
        answer: 28,
        suffix: "",
        explain: "3 × 9 + 1 = 28 이에요.",
      },
      {
        kind: "number",
        id: "o3s2",
        ask: "효용 U에서 선호도 1위인 소비량은 얼마일까요?",
        hint: "2, 5, 9, 6, 3 중 가장 큰 값을 찾아보세요.",
        answer: 3,
        suffix: "",
        explain: "U가 9로 가장 큰 x = 3 이 1위예요.",
      },
      {
        kind: "number",
        id: "o3s3",
        ask: "새 효용 V에서 선호도 1위인 소비량은 얼마일까요?",
        hint: "V = 7, 16, 28, 19, 10 이에요.",
        answer: 3,
        suffix: "",
        explain: "V도 x = 3 에서 28로 가장 커요. 1위가 그대로죠!",
      },
      {
        kind: "choice",
        id: "o3s4",
        ask: "U와 V의 순위가 똑같은 까닭은 무엇일까요?",
        hint: "3U + 1 은 U가 커지면 어떻게 될까요?",
        options: [
          { text: "U가 커지면 V도 반드시 커지는 변환이라 순서가 바뀌지 않는다" },
          { text: "3과 1이 모두 양수이기 때문이다" },
          { text: "값이 커졌으므로 순위도 커진다" },
          { text: "우연히 같아졌을 뿐이다" },
        ],
        answer: 0,
        explain:
          "U가 커질 때 함께 커지는 변환이면 순서가 그대로예요. 그래서 같은 선호를 나타내는 서수적 효용함수는 무수히 많습니다.",
      },
    ],
    wrapUp:
      "값은 완전히 달라졌지만 순위는 그대로였어요. 서수적 효용함수는 ‘값 자체’가 아니라 ‘순서’를 담는 함수이기 때문입니다.",
  },
  {
    id: "o4",
    emoji: "🍫",
    title: "문제 4 · 크기가 있어야 할 수 있는 계산",
    scenario: "어떤 사람이 초콜릿을 먹을 때, 먹는 개수에 따른 효용의 크기가 다음과 같다.",
    table: {
      head: ["x (개)", "1", "2", "3", "4"],
      rows: [["효용 U", "4", "9", "12", "13"]],
    },
    steps: [
      {
        kind: "number",
        id: "o4s1",
        ask: "두 번째 초콜릿의 한계효용을 구하세요.",
        tex: "MU(2) = U(2) - U(1)",
        hint: "9 − 4",
        answer: 5,
        suffix: "",
        explain: "9 − 4 = 5 예요.",
      },
      {
        kind: "number",
        id: "o4s2",
        ask: "세 번째 초콜릿의 한계효용을 구하세요.",
        tex: "MU(3) = U(3) - U(2)",
        hint: "12 − 9",
        answer: 3,
        suffix: "",
        explain: "12 − 9 = 3 이에요.",
      },
      {
        kind: "number",
        id: "o4s3",
        ask: "네 번째 초콜릿의 한계효용을 구하세요.",
        tex: "MU(4) = U(4) - U(3)",
        hint: "13 − 12",
        answer: 1,
        suffix: "",
        explain: "13 − 12 = 1. 5, 3, 1 로 점점 작아지니 한계효용 체감이에요.",
      },
      {
        kind: "choice",
        id: "o4s4",
        ask: "만약 순위(1위 ~ 4위)만 주어졌다면 이 계산을 할 수 있었을까요?",
        hint: "빼기를 하려면 무엇이 필요할까요?",
        options: [
          { text: "할 수 있다 — 순위를 빼면 된다" },
          { text: "할 수 없다 — 한계효용은 크기를 알아야 구할 수 있다" },
          { text: "할 수 있다 — 순위가 1씩 줄어들기 때문이다" },
          { text: "순위가 다섯 개 이상이면 할 수 있다" },
        ],
        answer: 1,
        explain:
          "한계효용은 두 효용의 차이예요. 크기를 알려 주는 기수적 효용함수가 있어야 구할 수 있습니다.",
      },
    ],
    wrapUp:
      "‘어느 쪽이 더 좋은가’는 순서만으로 충분하지만, ‘얼마나 더 좋은가’를 따지려면 크기가 필요해요. 두 효용함수는 이렇게 쓰임이 다릅니다.",
  },
];
