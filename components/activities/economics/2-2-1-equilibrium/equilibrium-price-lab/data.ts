// 균형가격의 결정 — 활동 데이터
//
//  · 기업이 생산한 제품을 소비자가 구입하는 시장에서, 가격 x 에 대한
//    소비자의 수요함수를 Qd = f(x), 기업의 공급함수를 Qs = g(x) 라 하자.
//      [수요의 법칙] 가격이 오르면 수요량은 감소  (우하향)
//      [공급의 법칙] 가격이 오르면 공급량은 증가  (우상향)
//  · 어떤 가격 x₀ 에서 수요량과 공급량이 Q₀ 으로 같아지면  f(x₀) = g(x₀) = Q₀
//    이때 x₀ 을 균형가격, Q₀ 을 균형거래량(균형수급량), 점 (x₀, Q₀) 을 균형점이라 한다.
//    곧 수요곡선과 공급곡선이 만나는 점에서 균형이 이루어진다.
//  · 가격이 균형보다 높으면 초과공급(재고), 낮으면 초과수요(품절)가 생겨
//    가격이 균형 쪽으로 움직인다.
//
//  · 수요량의 변화: 같은 수요곡선에서 가격이 변할 때 — 곡선을 따라 점이 이동
//  · 수요의 변화:   가격 이외의 요인이 변해 모든 가격에서 수요량이 달라질 때 — 곡선 자체가 이동
//    (공급량의 변화 / 공급의 변화도 마찬가지)
//
//  ※ 아래 수치는 균형이 어떻게 정해지는지 살펴보기 위해 꾸민 것이다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}

/** 부호를 살려 항을 붙인다 */
export function signed(v: number, d = 2): string {
  return v < 0 ? `- ${fmt(-v, d)}` : `+ ${fmt(v, d)}`;
}

// ══════════════════════════════════════════════════════════════
//  시장 —  Qd = dA·x + dB (dA < 0),  Qs = sA·x + sB (sA > 0)
// ══════════════════════════════════════════════════════════════
export type Market = {
  id: string;
  emoji: string;
  name: string;
  /** 수량의 단위 */
  unit: string;
  /** 가격의 단위 */
  priceUnit: string;
  tone: "emerald" | "sky" | "amber" | "violet";
  dA: number;
  dB: number;
  sA: number;
  sB: number;
  xMax: number;
  xStep: number;
  story: string;
};

export const MARKETS: Market[] = [
  {
    id: "earbud",
    emoji: "🎧",
    name: "무선 이어폰",
    unit: "개",
    priceUnit: "천원",
    tone: "sky",
    dA: -2,
    dB: 240,
    sA: 4,
    sB: 0,
    xMax: 120,
    xStep: 2,
    story: "값이 오를수록 사려는 사람은 줄고, 만들려는 회사는 늘어요.",
  },
  {
    id: "cap",
    emoji: "🧢",
    name: "캡모자",
    unit: "개",
    priceUnit: "천원",
    tone: "amber",
    dA: -4,
    dB: 200,
    sA: 8,
    sB: -40,
    xMax: 50,
    xStep: 1,
    story: "5천 원보다 싸면 아예 만들지 않아요(공급량 0).",
  },
  {
    id: "plant",
    emoji: "🪴",
    name: "화분",
    unit: "개",
    priceUnit: "천원",
    tone: "emerald",
    dA: -3,
    dB: 120,
    sA: 1,
    sB: 8,
    xMax: 40,
    xStep: 1,
    story: "공급이 가격에 덜 민감해 공급곡선이 완만해요.",
  },
];

export function marketOf(id: string): Market {
  return MARKETS.find((m) => m.id === id) ?? MARKETS[0];
}

/** 수요량 (0 아래로는 내려가지 않는다) */
export function qd(m: Market, x: number, shift = 0): number {
  return Math.max(0, m.dA * x + m.dB + shift);
}
/** 공급량 (0 아래로는 내려가지 않는다) */
export function qs(m: Market, x: number, shift = 0): number {
  return Math.max(0, m.sA * x + m.sB + shift);
}
/** 균형가격과 균형거래량 */
export function eqOf(m: Market, dShift = 0, sShift = 0): { x: number; q: number } {
  const x = (m.sB + sShift - (m.dB + dShift)) / (m.dA - m.sA);
  return { x, q: m.dA * x + m.dB + dShift };
}

/** 함수식 (KaTeX) */
export function demandTex(m: Market, shift = 0): string {
  return `Q_d = ${fmt(m.dA)}x ${signed(m.dB + shift)}`;
}
export function supplyTex(m: Market, shift = 0): string {
  const b = m.sB + shift;
  return b === 0 ? `Q_s = ${fmt(m.sA)}x` : `Q_s = ${fmt(m.sA)}x ${signed(b)}`;
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 아이스크림 시장 — 실생활 사건 카드
// ══════════════════════════════════════════════════════════════
export const ICE: Market = {
  id: "ice",
  emoji: "🍦",
  name: "아이스크림",
  unit: "개",
  priceUnit: "백원",
  tone: "violet",
  dA: -10,
  dB: 300,
  sA: 10,
  sB: -100,
  xMax: 30,
  xStep: 1,
  story: "동네 아이스크림 가게의 하루 시장이에요.",
};

export type MarketEvent = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  /** 수요 쪽 이야기인지 공급 쪽 이야기인지 */
  side: "demand" | "supply";
  /** move = 곡선 위에서 점만 이동 · shift = 곡선 자체가 이동 */
  kind: "move" | "shift";
  /** kind = shift 일 때의 이동량 (양수면 증가) */
  shift: number;
  /** kind = move 일 때 옮겨 갈 가격 */
  priceTo: number;
  why: string;
};

export const EVENTS: MarketEvent[] = [
  {
    id: "heat",
    emoji: "☀️",
    title: "기록적인 폭염",
    desc: "연일 35도가 넘는 무더위가 이어졌어요.",
    side: "demand",
    kind: "shift",
    shift: 60,
    priceTo: 0,
    why: "값과 상관없이 아이스크림을 찾는 사람이 많아졌어요. 모든 가격에서 수요량이 늘었으니 수요곡선 자체가 움직입니다.",
  },
  {
    id: "priceup_d",
    emoji: "💸",
    title: "값이 올랐다 — 사는 쪽에서 보면",
    desc: "아이스크림 값이 2,000원에서 2,500원으로 올랐어요.",
    side: "demand",
    kind: "move",
    shift: 0,
    priceTo: 25,
    why: "달라진 것은 가격뿐이에요. 수요곡선은 그대로 있고 그 위에서 점이 미끄러집니다.",
  },
  {
    id: "priceup_s",
    emoji: "📈",
    title: "값이 올랐다 — 만드는 쪽에서 보면",
    desc: "똑같이 2,500원으로 오른 상황을 이번엔 생산자 눈으로 봐요.",
    side: "supply",
    kind: "move",
    shift: 0,
    priceTo: 25,
    why: "같은 가격 인상인데 만드는 쪽은 반대예요. 공급곡선은 그대로, 그 위에서 점이 미끄러집니다.",
  },
  {
    id: "rawup",
    emoji: "🥛",
    title: "원유 값 폭등",
    desc: "아이스크림 재료인 우유 값이 크게 올랐어요.",
    side: "supply",
    kind: "shift",
    shift: -60,
    priceTo: 0,
    why: "만드는 비용이 커져 같은 값에도 덜 만들게 돼요. 공급곡선 자체가 움직입니다.",
  },
  {
    id: "shaved",
    emoji: "🧊",
    title: "옆 가게 빙수 반값",
    desc: "대신 먹을 수 있는 빙수가 아주 싸졌어요.",
    side: "demand",
    kind: "shift",
    shift: -60,
    priceTo: 0,
    why: "아이스크림 값은 그대로인데 사람들이 빙수로 옮겨 갔어요. 수요곡선 자체가 움직입니다.",
  },
  {
    id: "factory",
    emoji: "🏭",
    title: "새 공장 준공",
    desc: "생산 설비를 늘려 더 많이 만들 수 있게 됐어요.",
    side: "supply",
    kind: "shift",
    shift: 60,
    priceTo: 0,
    why: "같은 값에도 더 많이 내놓을 수 있으니 공급곡선 자체가 움직입니다.",
  },
  {
    id: "drama",
    emoji: "🎬",
    title: "인기 드라마에 등장",
    desc: "주인공이 먹은 아이스크림이 화제가 됐어요.",
    side: "demand",
    kind: "shift",
    shift: 40,
    priceTo: 0,
    why: "값과 상관없이 사고 싶어 하는 사람이 늘었어요. 수요곡선 자체가 움직입니다.",
  },
  {
    id: "subsidy",
    emoji: "🚚",
    title: "물류비 지원",
    desc: "배송비의 일부를 지원받게 됐어요.",
    side: "supply",
    kind: "shift",
    shift: 40,
    priceTo: 0,
    why: "내놓는 비용이 줄어 같은 값에도 더 많이 공급할 수 있어요. 공급곡선 자체가 움직입니다.",
  },
];

/** 사건이 시장에 준 결과를 한 줄로 */
export function eventSummary(e: MarketEvent): string {
  if (e.kind === "move") return e.side === "demand" ? "수요량의 변화" : "공급량의 변화";
  const grow = e.shift > 0;
  return e.side === "demand" ? (grow ? "수요의 증가" : "수요의 감소") : grow ? "공급의 증가" : "공급의 감소";
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
  texList?: { label: string; tex: string }[];
  steps: PStep[];
  wrapUp: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "e1",
    emoji: "🖨️",
    title: "문제 1 · 균형가격과 균형거래량",
    scenario:
      "어느 회사에서 만드는 프린터의 가격 x만 원에 대한 수요함수와 공급함수가 각각 다음과 같다고 한다.",
    tex: "Q_d = -3x + 480, \\qquad Q_s = 5x",
    steps: [
      {
        kind: "choice",
        id: "e1s1",
        ask: "균형가격을 구하려면 어떤 식을 풀어야 할까요?",
        hint: "균형에서는 수요량과 공급량이 같아요.",
        options: [
          { tex: "Q_d + Q_s = 0" },
          { tex: "Q_d = Q_s" },
          { tex: "Q_d - Q_s = 480" },
          { tex: "Q_d \\times Q_s = 0" },
        ],
        answer: 1,
        explain: "수요량과 공급량이 같아지는 가격이 균형가격이에요.",
      },
      {
        kind: "number",
        id: "e1s2",
        ask: "균형가격을 구하세요. (만원 단위)",
        tex: "-3x + 480 = 5x",
        hint: "8x = 480",
        answer: 60,
        suffix: "만원",
        explain: "8x = 480 → x = 60. 균형가격은 60만 원이에요.",
      },
      {
        kind: "number",
        id: "e1s3",
        ask: "균형거래량을 구하세요.",
        tex: "Q_s = 5 \\times 60",
        hint: "5 × 60, 또는 −3 × 60 + 480",
        answer: 300,
        suffix: "대",
        explain: "5 × 60 = 300. −3 × 60 + 480 = 300 으로 확인해도 같아요.",
      },
      {
        kind: "number",
        id: "e1s4",
        ask: "가격을 80만 원으로 매기면 팔리지 않고 남는 물건은 몇 대일까요?",
        tex: "Q_s(80) - Q_d(80)",
        hint: "Qs = 400, Qd = 240",
        answer: 160,
        suffix: "대",
        explain: "400 − 240 = 160대가 남아요. 이렇게 남는 것을 초과공급이라 하고, 값을 내리게 됩니다.",
      },
    ],
    wrapUp:
      "균형가격은 수요곡선과 공급곡선이 만나는 곳이에요. 균형보다 값이 비싸면 물건이 남고(초과공급), 싸면 모자랍니다(초과수요).",
  },
  {
    id: "e2",
    emoji: "🪑",
    title: "문제 2 · 공급을 시작하는 가격",
    scenario: "어떤 의자의 가격 x만 원에 대한 수요함수와 공급함수가 각각 다음과 같다고 한다.",
    tex: "Q_d = -4x + 300, \\qquad Q_s = 2x - 60",
    steps: [
      {
        kind: "number",
        id: "e2s1",
        ask: "균형가격을 구하세요. (만원 단위)",
        tex: "-4x + 300 = 2x - 60",
        hint: "6x = 360",
        answer: 60,
        suffix: "만원",
        explain: "6x = 360 → x = 60 이에요.",
      },
      {
        kind: "number",
        id: "e2s2",
        ask: "균형거래량을 구하세요.",
        tex: "Q_s = 2 \\times 60 - 60",
        hint: "120 − 60",
        answer: 60,
        suffix: "개",
        explain: "60개예요. 수요함수에 넣어도 −240 + 300 = 60 으로 같습니다.",
      },
      {
        kind: "number",
        id: "e2s3",
        ask: "이 공장이 의자를 만들기 시작하는 가격은 얼마일까요? (공급량이 0이 되는 가격, 만원 단위)",
        tex: "2x - 60 = 0",
        hint: "2x = 60",
        answer: 30,
        suffix: "만원",
        explain: "x = 30. 값이 30만 원보다 싸면 아예 만들지 않는다는 뜻이에요.",
      },
      {
        kind: "number",
        id: "e2s4",
        ask: "가격이 45만 원이라면 사고 싶어도 못 사는 사람은 몇 명일까요? (초과수요량)",
        tex: "Q_d(45) - Q_s(45)",
        hint: "Qd = 120, Qs = 30",
        answer: 90,
        suffix: "개",
        explain: "120 − 30 = 90. 값이 균형보다 싸면 이렇게 모자라고(초과수요), 값이 오르게 됩니다.",
      },
    ],
    wrapUp:
      "공급함수의 x절편은 생산을 시작하는 최저 가격이에요. 균형보다 싼 가격에서는 초과수요가 생겨 값이 올라갑니다.",
  },
  {
    id: "e3",
    emoji: "🔀",
    title: "문제 3 · 곡선이 움직일까, 점이 움직일까",
    scenario: "다음 각 상황에서 그래프가 어떻게 달라지는지 판단해 보자.",
    steps: [
      {
        kind: "choice",
        id: "e3s1",
        ask: "🍫 초콜릿 값이 올라 사람들이 덜 사게 되었다.",
        hint: "달라진 것이 가격인가요, 가격 이외의 것인가요?",
        options: [{ text: "수요량의 변화 — 곡선 위에서 점이 이동" }, { text: "수요의 변화 — 곡선 자체가 이동" }],
        answer: 0,
        explain: "달라진 것은 가격뿐이에요. 같은 수요곡선 위에서 점만 미끄러집니다.",
      },
      {
        kind: "choice",
        id: "e3s2",
        ask: "🎁 명절이 다가와 선물용 초콜릿을 찾는 사람이 크게 늘었다.",
        hint: "가격이 그대로인데도 사려는 양이 달라졌어요.",
        options: [{ text: "수요량의 변화 — 곡선 위에서 점이 이동" }, { text: "수요의 변화 — 곡선 자체가 이동" }],
        answer: 1,
        explain: "모든 가격에서 수요량이 늘었으므로 수요곡선 자체가 오른쪽 위로 움직여요.",
      },
      {
        kind: "choice",
        id: "e3s3",
        ask: "🌾 카카오 값이 폭등해 초콜릿 만드는 비용이 커졌다.",
        hint: "만드는 쪽 이야기예요.",
        options: [
          { text: "공급량의 변화 — 곡선 위에서 점이 이동" },
          { text: "공급의 변화(증가) — 곡선이 오른쪽으로 이동" },
          { text: "공급의 변화(감소) — 곡선이 왼쪽으로 이동" },
        ],
        answer: 2,
        explain: "같은 값에도 덜 만들게 되므로 공급이 줄어 공급곡선 자체가 움직입니다.",
      },
      {
        kind: "choice",
        id: "e3s4",
        ask: "위 🎁 상황(수요 증가)이 일어나면 균형가격과 균형거래량은 어떻게 될까요?",
        hint: "수요곡선이 위로 올라가면 두 곡선이 만나는 점은 어디로 갈까요?",
        options: [
          { text: "균형가격 상승, 균형거래량 증가" },
          { text: "균형가격 하락, 균형거래량 증가" },
          { text: "균형가격 상승, 균형거래량 감소" },
          { text: "둘 다 변하지 않는다" },
        ],
        answer: 0,
        explain: "수요가 늘면 균형점이 오른쪽 위로 옮겨가 균형가격도 오르고 균형거래량도 늘어요.",
      },
    ],
    wrapUp:
      "가격이 바뀌면 곡선 위에서 점이 움직이고(수요량·공급량의 변화), 가격 이외의 것이 바뀌면 곡선 자체가 움직여요(수요·공급의 변화).",
  },
  {
    id: "e4",
    emoji: "☂️",
    title: "문제 4 · 수요가 늘면 균형은 어디로",
    scenario:
      "어떤 우산의 가격 x천 원에 대한 수요함수와 공급함수가 아래와 같았는데, 장마가 길어지면서 모든 가격에서 수요량이 60개씩 늘었다고 한다.",
    texList: [
      { label: "처음 수요함수", tex: "Q_d = -2x + 200" },
      { label: "공급함수 (그대로)", tex: "Q_s = 2x" },
    ],
    steps: [
      {
        kind: "number",
        id: "e4s1",
        ask: "장마 전의 균형가격을 구하세요. (천원 단위)",
        tex: "-2x + 200 = 2x",
        hint: "4x = 200",
        answer: 50,
        suffix: "천원",
        explain: "4x = 200 → x = 50 이에요.",
      },
      {
        kind: "choice",
        id: "e4s2",
        ask: "모든 가격에서 수요량이 60개씩 늘었어요. 새 수요함수는?",
        hint: "같은 가격에서 수요량이 60만큼 커졌어요.",
        options: [
          { tex: "Q_d = -2x + 140" },
          { tex: "Q_d = -2(x + 60) + 200" },
          { tex: "Q_d = -2x + 260" },
          { tex: "Q_d = -120x + 200" },
        ],
        answer: 2,
        explain: "상수항에 60을 더한 Qd = −2x + 260 이에요. 그래프가 위로 평행이동한 셈이죠.",
      },
      {
        kind: "number",
        id: "e4s3",
        ask: "새 균형가격을 구하세요. (천원 단위)",
        tex: "-2x + 260 = 2x",
        hint: "4x = 260",
        answer: 65,
        suffix: "천원",
        explain: "4x = 260 → x = 65. 값이 50에서 65로 올랐어요.",
      },
      {
        kind: "number",
        id: "e4s4",
        ask: "새 균형거래량을 구하세요.",
        tex: "Q_s = 2 \\times 65",
        hint: "2 × 65",
        answer: 130,
        suffix: "개",
        explain: "130개. 100개에서 130개로 늘었어요. 수요가 늘면 균형가격도 균형거래량도 함께 커집니다.",
      },
    ],
    wrapUp:
      "수요가 늘면 균형가격은 오르고 균형거래량도 늘어요. 반대로 공급이 늘면 균형가격은 내리고 균형거래량은 늘어납니다.",
  },
];
