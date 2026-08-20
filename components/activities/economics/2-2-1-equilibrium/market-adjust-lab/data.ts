// 시장가격과 균형가격 — 활동 데이터
//
//  · 시장에서 수요와 공급이 자연스럽게 만나 균형이 이루어지면
//    균형가격과 균형거래량은 그대로 유지된다.
//  · (시장가격) > (균형가격)  ⇒  초과 공급 발생
//      초과 공급 → 잉여 물품 발생 → 물건을 팔기 위해 가격 하락(생산 감소) → 균형점 도달
//  · (시장가격) < (균형가격)  ⇒  초과 수요 발생
//      초과 수요 → 시장의 물품 부족 → 희귀성으로 가격 상승(추가 생산) → 균형점 도달
//  · 초과량 = |Qd(x) − Qs(x)| = |dA − sA| × |x − x₀|  이므로
//    균형에서 같은 거리만큼 떨어져 있으면 초과 공급량과 초과 수요량의 크기가 같다.
//
//  ※ 아래 수치는 조정 과정을 살펴보기 위해 꾸민 것이다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}

export function signed(v: number, d = 2): string {
  return v < 0 ? `- ${fmt(-v, d)}` : `+ ${fmt(v, d)}`;
}

// ══════════════════════════════════════════════════════════════
//  시장 —  Qd = dA·x + dB,  Qs = sA·x + sB
// ══════════════════════════════════════════════════════════════
export type Shop = {
  id: string;
  emoji: string;
  name: string;
  unit: string;
  priceUnit: string;
  tone: "emerald" | "sky" | "amber" | "violet";
  dA: number;
  dB: number;
  sA: number;
  sB: number;
  xMax: number;
  xStep: number;
  /** 처음 매겨 보는 시장가격 (균형보다 비싸게) */
  startHigh: number;
  /** 처음 매겨 보는 시장가격 (균형보다 싸게) */
  startLow: number;
  story: string;
  /** 남는 것을 부르는 말 */
  surplusWord: string;
  /** 모자란 것을 부르는 말 */
  shortageWord: string;
};

export const SHOPS: Shop[] = [
  {
    id: "ticket",
    emoji: "🎫",
    name: "콘서트 티켓",
    unit: "석",
    priceUnit: "천원",
    tone: "violet",
    dA: -20,
    dB: 1400,
    sA: 30,
    sB: -100,
    xMax: 70,
    xStep: 1,
    startHigh: 50,
    startLow: 12,
    story: "값을 너무 높이면 빈 좌석이 생기고, 너무 낮추면 순식간에 매진돼요.",
    surplusWord: "빈 좌석",
    shortageWord: "표를 못 구한 사람",
  },
  {
    id: "berry",
    emoji: "🍓",
    name: "딸기",
    unit: "팩",
    priceUnit: "천원",
    tone: "amber",
    dA: -30,
    dB: 900,
    sA: 20,
    sB: -100,
    xMax: 30,
    xStep: 1,
    startHigh: 28,
    startLow: 8,
    story: "그날 못 판 딸기는 다음 날이면 물러져요. 값을 빨리 내리게 되죠.",
    surplusWord: "안 팔린 팩",
    shortageWord: "사지 못한 손님",
  },
  {
    id: "console",
    emoji: "🎮",
    name: "게임기",
    unit: "대",
    priceUnit: "만원",
    tone: "sky",
    dA: -5,
    dB: 700,
    sA: 15,
    sB: -300,
    xMax: 120,
    xStep: 1,
    startHigh: 90,
    startLow: 24,
    story: "신형 게임기는 값이 낮으면 예약 대기가 몇 달씩 밀려요.",
    surplusWord: "창고에 쌓인 재고",
    shortageWord: "예약 대기",
  },
  {
    id: "bike",
    emoji: "🚲",
    name: "자전거",
    unit: "대",
    priceUnit: "만원",
    tone: "emerald",
    dA: -8,
    dB: 640,
    sA: 12,
    sB: -160,
    xMax: 80,
    xStep: 1,
    startHigh: 68,
    startLow: 16,
    story: "매장에 오래 남은 자전거는 자리만 차지해요.",
    surplusWord: "매장에 남은 자전거",
    shortageWord: "대기 손님",
  },
];

export function shopOf(id: string): Shop {
  return SHOPS.find((s) => s.id === id) ?? SHOPS[0];
}

export function qd(s: Shop, x: number): number {
  return Math.max(0, s.dA * x + s.dB);
}
export function qs(s: Shop, x: number): number {
  return Math.max(0, s.sA * x + s.sB);
}
/** 균형가격과 균형거래량 */
export function eqOf(s: Shop): { x: number; q: number } {
  const x = (s.sB - s.dB) / (s.dA - s.sA);
  return { x, q: s.dA * x + s.dB };
}
/** 초과량 —  양수면 초과공급, 음수면 초과수요 */
export function excessOf(s: Shop, x: number): number {
  return qs(s, x) - qd(s, x);
}

/** 다음 날의 가격 — 남거나 모자란 양에 비례해 값을 움직인다 (기울기 차이로 나눠 반씩 좁힌다) */
export function nextPrice(s: Shop, x: number): number {
  const eq = eqOf(s);
  if (Math.abs(x - eq.x) < 1e-9) return eq.x;
  const raw = x - (0.5 * excessOf(s, x)) / (s.sA - s.dA);
  let next = Math.round(raw / s.xStep) * s.xStep;
  if (Math.abs(next - x) < s.xStep - 1e-9) next = x + Math.sign(eq.x - x) * s.xStep;
  // 균형을 지나치지 않도록
  if ((eq.x - x) * (eq.x - next) < 0) next = eq.x;
  return Number(next.toFixed(4));
}

export function demandTex(s: Shop): string {
  return `Q_d = ${fmt(s.dA)}x ${signed(s.dB)}`;
}
export function supplyTex(s: Shop): string {
  return s.sB === 0 ? `Q_s = ${fmt(s.sA)}x` : `Q_s = ${fmt(s.sA)}x ${signed(s.sB)}`;
}

/** 교과서의 흐름도 */
export const FLOW_OVER = ["초과 공급 발생", "잉여 물품 발생", "물건을 팔기 위해 가격 하락", "균형점 도달"];
export const FLOW_SHORT = ["초과 수요 발생", "시장의 물품 부족", "희귀성으로 가격 상승", "균형점 도달"];

// ══════════════════════════════════════════════════════════════
//  탭 ① 뉴스 헤드라인 판별
// ══════════════════════════════════════════════════════════════
export type News = {
  id: string;
  emoji: string;
  head: string;
  /** over = 초과공급(시장가격 > 균형가격) · short = 초과수요(시장가격 < 균형가격) */
  state: "over" | "short";
  why: string;
};

export const NEWS: News[] = [
  {
    id: "sneaker",
    emoji: "👟",
    head: "한정판 운동화, 발매 10분 만에 완판… 웃돈 얹은 되팔이 등장",
    state: "short",
    why: "값이 균형보다 싸서 사려는 사람이 훨씬 많았어요. 초과 수요 → 값이 오릅니다.",
  },
  {
    id: "padding",
    emoji: "🧥",
    head: "봄이 왔는데 안 팔린 패딩, 창고에 산더미",
    state: "over",
    why: "값이 균형보다 비싸 남은 물건이 쌓였어요. 초과 공급 → 값을 내리게 됩니다.",
  },
  {
    id: "cabbage",
    emoji: "🥬",
    head: "역대급 풍년에 배춧값 폭락… 밭 갈아엎는 농가",
    state: "over",
    why: "내놓은 양이 사려는 양보다 훨씬 많아졌어요. 초과 공급이라 값이 떨어집니다.",
  },
  {
    id: "concert",
    emoji: "🎤",
    head: "인기 가수 콘서트, 예매 시작 1분 만에 전석 매진",
    state: "short",
    why: "표값이 균형보다 낮아 표를 못 구한 사람이 많았어요. 초과 수요예요.",
  },
  {
    id: "clearance",
    emoji: "🏷️",
    head: "재고 떨이 반값 세일… 남은 물량 소진 총력",
    state: "over",
    why: "물건이 남아서 값을 내리는 중이에요. 전형적인 초과 공급 상황입니다.",
  },
  {
    id: "console",
    emoji: "🎮",
    head: "신형 게임기 예약 대기 6개월… 웃돈 거래 기승",
    state: "short",
    why: "정가가 균형보다 낮아 대기 줄이 길어졌어요. 초과 수요예요.",
  },
  {
    id: "apple",
    emoji: "🍎",
    head: "명절 앞두고 사과 품귀… 값 껑충",
    state: "short",
    why: "찾는 사람에 견주어 물건이 모자라요. 초과 수요라 값이 오릅니다.",
  },
  {
    id: "burn",
    emoji: "📦",
    head: "안 팔린 재고 의류 대량 폐기 논란",
    state: "over",
    why: "팔리지 않고 남은 물건이 그만큼 많았다는 뜻이에요. 초과 공급입니다.",
  },
];

export const NEWS_WRAP =
  "완판·웃돈·대기 줄 이야기가 나오면 값이 균형보다 싼 것(초과 수요)이고, 재고·떨이·폐기 이야기가 나오면 값이 균형보다 비싼 것(초과 공급)이에요.";

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
  steps: PStep[];
  wrapUp: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "m1",
    emoji: "🎧",
    title: "문제 1 · 값이 비쌀 때",
    scenario:
      "어느 회사에서 만드는 헤드폰의 가격 x만 원에 대한 수요함수와 공급함수가 각각 다음과 같다고 한다.",
    tex: "Q_d = -12x + 480, \\qquad Q_s = 8x - 20",
    steps: [
      {
        kind: "number",
        id: "m1s1",
        ask: "균형가격을 구하세요. (만원 단위)",
        tex: "-12x + 480 = 8x - 20",
        hint: "20x = 500",
        answer: 25,
        suffix: "만원",
        explain: "20x = 500 → x = 25 예요.",
      },
      {
        kind: "number",
        id: "m1s2",
        ask: "시장가격이 30만 원일 때의 수요량을 구하세요.",
        tex: "Q_d = -12 \\times 30 + 480",
        hint: "−360 + 480",
        answer: 120,
        suffix: "개",
        explain: "120개예요.",
      },
      {
        kind: "number",
        id: "m1s3",
        ask: "같은 가격에서의 공급량을 구하세요.",
        tex: "Q_s = 8 \\times 30 - 20",
        hint: "240 − 20",
        answer: 220,
        suffix: "개",
        explain: "220개예요. 수요량보다 훨씬 많죠?",
      },
      {
        kind: "number",
        id: "m1s4",
        ask: "초과 공급량을 구하세요.",
        tex: "Q_s - Q_d",
        hint: "220 − 120",
        answer: 100,
        suffix: "개",
        explain: "220 − 120 = 100개가 남아요.",
      },
      {
        kind: "choice",
        id: "m1s5",
        ask: "이런 상황에서 앞으로 시장가격은 어떻게 될까요?",
        hint: "물건이 남으면 가게는 어떻게 할까요?",
        options: [
          { text: "더 오른다" },
          { text: "내려가서 균형가격 25만 원에 다가간다" },
          { text: "그대로 있다" },
          { text: "0이 된다" },
        ],
        answer: 1,
        explain:
          "남은 물건을 팔기 위해 값을 내리게 되고, 값이 내려가면 수요량은 늘고 공급량은 줄어 균형가격으로 다가갑니다.",
      },
    ],
    wrapUp:
      "(시장가격) > (균형가격)이면 초과 공급이 생겨요. 잉여 물품이 쌓이고, 팔기 위해 값을 내리다 보면 균형점에 이릅니다.",
  },
  {
    id: "m2",
    emoji: "🍊",
    title: "문제 2 · 값이 쌀 때",
    scenario: "어느 농장에서 파는 귤의 가격 x천 원에 대한 수요함수와 공급함수가 각각 다음과 같다고 한다.",
    tex: "Q_d = -25x + 750, \\qquad Q_s = 25x - 250",
    steps: [
      {
        kind: "number",
        id: "m2s1",
        ask: "균형가격을 구하세요. (천원 단위)",
        tex: "-25x + 750 = 25x - 250",
        hint: "50x = 1000",
        answer: 20,
        suffix: "천원",
        explain: "50x = 1,000 → x = 20 이에요.",
      },
      {
        kind: "number",
        id: "m2s2",
        ask: "시장가격이 14천 원일 때의 초과 수요량을 구하세요.",
        tex: "Q_d(14) - Q_s(14)",
        hint: "Qd = 400, Qs = 100",
        answer: 300,
        suffix: "상자",
        explain: "400 − 100 = 300상자가 모자라요.",
      },
      {
        kind: "choice",
        id: "m2s3",
        ask: "이때 시장에서는 어떤 일이 일어날까요?",
        hint: "사려는 사람이 훨씬 많아요.",
        options: [
          { text: "물건이 남아 창고에 쌓인다" },
          { text: "물건이 모자라 품귀 현상이 생기고 값이 오른다" },
          { text: "아무 일도 일어나지 않는다" },
          { text: "농장이 값을 더 내린다" },
        ],
        answer: 1,
        explain: "사려는 양이 훨씬 많으니 물건이 귀해지고, 그 희귀성 때문에 값이 오르게 돼요.",
      },
      {
        kind: "number",
        id: "m2s4",
        ask: "값이 올라 균형에 이르면 실제로 거래되는 양은 몇 상자일까요?",
        tex: "Q_s = 25 \\times 20 - 250",
        hint: "500 − 250",
        answer: 250,
        suffix: "상자",
        explain: "250상자예요. 이것이 균형거래량이고, 균형에 이르면 이 값이 그대로 유지됩니다.",
      },
    ],
    wrapUp:
      "(시장가격) < (균형가격)이면 초과 수요가 생겨요. 물건이 부족해 값이 오르고, 오르다 보면 균형점에 이릅니다.",
  },
  {
    id: "m3",
    emoji: "🎒",
    title: "문제 3 · 같은 거리, 같은 크기?",
    scenario: "어느 브랜드 가방의 가격 x만 원에 대한 수요함수와 공급함수가 각각 다음과 같다고 한다.",
    tex: "Q_d = -6x + 480, \\qquad Q_s = 9x - 120",
    steps: [
      {
        kind: "number",
        id: "m3s1",
        ask: "균형가격을 구하세요. (만원 단위)",
        tex: "-6x + 480 = 9x - 120",
        hint: "15x = 600",
        answer: 40,
        suffix: "만원",
        explain: "15x = 600 → x = 40 이에요.",
      },
      {
        kind: "number",
        id: "m3s2",
        ask: "시장가격이 50만 원일 때의 초과 공급량을 구하세요.",
        tex: "Q_s(50) - Q_d(50)",
        hint: "Qs = 330, Qd = 180",
        answer: 150,
        suffix: "개",
        explain: "330 − 180 = 150개가 남아요.",
      },
      {
        kind: "number",
        id: "m3s3",
        ask: "이번에는 시장가격이 30만 원일 때의 초과 수요량을 구하세요.",
        tex: "Q_d(30) - Q_s(30)",
        hint: "Qd = 300, Qs = 150",
        answer: 150,
        suffix: "개",
        explain: "300 − 150 = 150개가 모자라요. 앞의 답과 크기가 똑같죠?",
      },
      {
        kind: "choice",
        id: "m3s4",
        ask: "두 초과량의 크기가 같은 까닭은 무엇일까요?",
        hint: "50과 30은 균형가격 40에서 각각 얼마나 떨어져 있나요?",
        options: [
          { text: "두 가격이 모두 짝수이기 때문" },
          { text: "균형가격에서 떨어진 거리가 10으로 같고, 초과량은 그 거리에 비례하기 때문" },
          { text: "수요함수와 공급함수의 상수항이 같기 때문" },
          { text: "우연히 같아졌을 뿐" },
        ],
        answer: 1,
        explain:
          "초과량은 (기울기의 차이) × (균형가격에서 떨어진 거리)예요. 여기서는 15 × 10 = 150 이라 양쪽 모두 150이 됩니다.",
      },
    ],
    wrapUp:
      "초과량은 시장가격이 균형가격에서 멀수록 커져요. 두 곡선의 기울기 차이에 그 거리를 곱한 값이랍니다.",
  },
  {
    id: "m4",
    emoji: "📰",
    title: "문제 4 · 뉴스로 읽는 시장",
    scenario: "다음 뉴스에서 시장가격과 균형가격의 관계를 판단해 보자.",
    steps: [
      {
        kind: "choice",
        id: "m4s1",
        ask: "📰 “한정판 스니커즈, 발매 즉시 완판… 웃돈 얹은 거래 성행”",
        hint: "사려는 사람이 훨씬 많았어요.",
        options: [
          { text: "(시장가격) > (균형가격) — 초과 공급" },
          { text: "(시장가격) < (균형가격) — 초과 수요" },
          { text: "(시장가격) = (균형가격) — 균형" },
        ],
        answer: 1,
        explain: "정가가 균형보다 낮아 초과 수요가 생겼고, 그래서 웃돈이 붙은 거예요.",
      },
      {
        kind: "choice",
        id: "m4s2",
        ask: "📰 “안 팔린 겨울옷 반값 세일… 창고 정리 나서”",
        hint: "물건이 남아 있어요.",
        options: [
          { text: "(시장가격) > (균형가격) — 초과 공급" },
          { text: "(시장가격) < (균형가격) — 초과 수요" },
          { text: "(시장가격) = (균형가격) — 균형" },
        ],
        answer: 0,
        explain: "값이 균형보다 비싸 물건이 남았고, 팔기 위해 값을 내리는 중이에요.",
      },
      {
        kind: "choice",
        id: "m4s3",
        ask: "초과 공급이 생겼을 때, 시장가격은 앞으로 어떻게 움직일까요?",
        hint: "잉여 물품을 팔아야 해요.",
        options: [{ text: "오른다" }, { text: "내린다" }, { text: "변하지 않는다" }],
        answer: 1,
        explain: "남은 물건을 팔기 위해 값이 내려가고, 그러면서 균형점에 다가갑니다.",
      },
      {
        kind: "choice",
        id: "m4s4",
        ask: "시장가격이 균형가격과 같아지면 그다음에는 어떻게 될까요?",
        hint: "남지도 모자라지도 않아요.",
        options: [
          { text: "값이 계속 오르내린다" },
          { text: "거래가 멈춘다" },
          { text: "균형가격과 균형거래량이 그대로 유지된다" },
          { text: "수요곡선이 이동한다" },
        ],
        answer: 2,
        explain:
          "수요량과 공급량이 같아 값을 바꿀 까닭이 없어요. 다른 조건이 변하지 않는 한 균형가격과 균형거래량은 유지됩니다.",
      },
    ],
    wrapUp:
      "완판·웃돈·대기 줄은 초과 수요의 신호, 재고·떨이·폐기는 초과 공급의 신호예요. 어느 쪽이든 값이 움직여 결국 균형으로 모여듭니다.",
  },
];
