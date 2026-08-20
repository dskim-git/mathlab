// 인플레이션과 균형가격 — 활동 데이터
//
//  · 가로축 = 가격 x, 세로축 = 수량 Q  (수업 자료와 같은 방향)
//    수요함수 f(x) = dA·x + dB  (dA < 0),  공급함수 g(x) = sA·x + sB  (sA > 0)
//
//  · 수요가 늘면 같은 값에서 사려는 양이 많아지므로 수요곡선은 "위로" 평행이동한다.
//        f_k(x) = dA·x + dB + k        (k > 0 : 수요 증가, k < 0 : 수요 감소)
//    생산비가 오르면 같은 값에서 내놓는 양이 줄므로 공급곡선은 "아래로" 평행이동한다.
//        g_m(x) = sA·x + sB + m        (m < 0 : 생산비 상승 — 세금 부과와 같은 효과)
//
//  · 균형은 f_k(x) = g_m(x) 인 자리
//        x₀ = (sB + m − dB − k) / (dA − sA)
//        Q₀ = dA·x₀ + dB + k
//    두 값 모두 k, m 에 대한 일차함수이므로 손잡이를 움직이면 곧바로 다시 계산된다.
//
//  · ※ 경제학 책에서 흔히 보는 그림은 가로축이 수량이라 곡선이 좌·우로 움직이지만,
//    이 활동은 수업 자료와 같이 가로축이 가격이므로 같은 사건이 위·아래 이동으로 나타난다.
//
//  · 물가와 화폐가치
//        n년 뒤 물가지수 = 100(1 + r)^n,   지금 돈 A의 n년 뒤 실질 가치 = A / (1 + r)^n
//        물가가 두 배가 되는 데 걸리는 해 ≈ 72 / (100r)      (72의 법칙)

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}
export function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}
export function pct(v: number, d = 1): string {
  return `${v > 0 ? "+" : ""}${fmt(v, d)}%`;
}

// ══════════════════════════════════════════════════════════════
//  함수와 균형 — 탭 ①②에서 함께 쓴다
// ══════════════════════════════════════════════════════════════
export type Fn = { dA: number; dB: number; sA: number; sB: number };

export function demandAt(f: Fn, x: number, k = 0): number {
  return f.dA * x + f.dB + k;
}
export function supplyAt(f: Fn, x: number, m = 0): number {
  return f.sA * x + f.sB + m;
}
/** 수요곡선을 k, 공급곡선을 m 만큼 위아래로 옮겼을 때의 균형 */
export function eqOf(f: Fn, k = 0, m = 0): { x: number; q: number } {
  const x = (f.sB + m - f.dB - k) / (f.dA - f.sA);
  return { x, q: f.dA * x + f.dB + k };
}

function term(a: number, b: number): string {
  const head = a === 1 ? "x" : a === -1 ? "-x" : `${fmt(a)}x`;
  if (b === 0) return head;
  return b < 0 ? `${head} - ${fmt(-b)}` : `${head} + ${fmt(b)}`;
}
export function demandTex(f: Fn, k = 0): string {
  return `f(x) = ${term(f.dA, f.dB + k)}`;
}
export function supplyTex(f: Fn, m = 0): string {
  return `g(x) = ${term(f.sA, f.sB + m)}`;
}
/** 균형을 구하는 방정식 */
export function eqTex(f: Fn, k = 0, m = 0): string {
  return `${term(f.dA, f.dB + k)} = ${term(f.sA, f.sB + m)}`;
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 곡선을 움직여 보자 — 식빵 시장
// ══════════════════════════════════════════════════════════════
export const BREAD: Fn = { dA: -2, dB: 1000, sA: 3, sB: 250 };
export const BREAD_VIEW = { xMax: 280, qTop: 1200 };
export const SHIFT_RANGE = { min: -200, max: 200, step: 25 };

export type Preset = { id: string; emoji: string; name: string; k: number; m: number; note: string };

export const PRESETS: Preset[] = [
  { id: "base", emoji: "🍞", name: "평소의 시장", k: 0, m: 0, note: "두 곡선이 제자리에 있어요." },
  { id: "dup", emoji: "🎉", name: "수요가 늘었어요", k: 150, m: 0, note: "값도 오르고 거래량도 늘어요." },
  { id: "sdn", emoji: "🛢️", name: "생산비가 올랐어요", k: 0, m: -150, note: "값은 오르는데 거래량은 줄어요." },
  { id: "stag", emoji: "🥶", name: "수요 ↓ · 비용 ↑", k: -100, m: -200, note: "값은 오르고 거래량은 크게 줄어요." },
];

// ── 탭 ① 빈칸 채우기 (수업 자료의 탐구를 다른 사례로) ──────────
export type Blank = { id: string; lead: string; tail: string; options: string[]; answer: number };
export type ExploreQ = {
  id: string;
  emoji: string;
  title: string;
  story: string;
  k: number;
  m: number;
  blanks: Blank[];
  explain: string;
};

export const EXPLORES: ExploreQ[] = [
  {
    id: "e1",
    emoji: "💧",
    title: "탐구 1 · 수요가 늘어 생기는 물가 상승",
    story:
      "무더위가 이어지자 생수를 찾는 사람이 크게 늘었어요. 공장의 생산 능력은 그대로인데 사려는 사람만 많아졌습니다.",
    k: 150,
    m: 0,
    blanks: [
      { id: "b1", lead: "수요곡선이", tail: "으로 이동하고", options: ["위쪽", "아래쪽"], answer: 0 },
      { id: "b2", lead: "균형가격은", tail: "하며", options: ["하락", "상승"], answer: 1 },
      { id: "b3", lead: "균형거래량은", tail: "한다.", options: ["증가", "감소"], answer: 0 },
    ],
    explain:
      "같은 값에서 사려는 양이 많아졌으니 수요곡선이 위로 올라가요. 공급곡선은 그대로이므로 교점은 오른쪽 위로 옮겨 가고, 값과 거래량이 함께 늘어납니다. 소득이 늘었을 때와 똑같은 모습이에요.",
  },
  {
    id: "e2",
    emoji: "☕",
    title: "탐구 2 · 생산 비용이 올라 생기는 물가 상승",
    story:
      "수입 원두 값이 크게 올라 카페가 커피 한 잔을 만드는 데 드는 비용이 커졌어요. 사려는 사람의 마음은 그대로입니다.",
    k: 0,
    m: -150,
    blanks: [
      { id: "b1", lead: "공급곡선이", tail: "으로 이동하고", options: ["위쪽", "아래쪽"], answer: 1 },
      { id: "b2", lead: "균형가격은", tail: "하며", options: ["상승", "하락"], answer: 0 },
      { id: "b3", lead: "균형거래량은", tail: "한다.", options: ["감소", "증가"], answer: 0 },
    ],
    explain:
      "비용이 커지면 같은 값을 받고 내놓을 수 있는 양이 줄어들어 공급곡선이 아래로 내려가요. 세금을 매길 때와 똑같은 모습이죠. 교점은 오른쪽 아래로 옮겨 가서 값은 오르고 거래량은 줄어듭니다.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 무슨 일이 생겼을까 — 예측 퀴즈
// ══════════════════════════════════════════════════════════════
export const Q2_FN: Fn = { dA: -2, dB: 800, sA: 2, sB: 200 };
export const Q2_VIEW = { xMax: 280, qTop: 1000 };
export const Q2_SHIFT = 120;

export type Scenario = {
  id: string;
  emoji: string;
  title: string;
  story: string;
  /** 0 = 수요곡선, 1 = 공급곡선 */
  curve: number;
  /** 0 = 위쪽, 1 = 아래쪽 */
  dir: number;
  /** 0 = 상승, 1 = 하락 */
  price: number;
  /** 0 = 증가, 1 = 감소 */
  qty: number;
  badge: string;
  badgeClass: string;
  explain: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    emoji: "🎁",
    title: "온 국민에게 소비 지원금",
    story: "정부가 모든 가정에 소비 지원금을 나누어 주었어요. 쓸 수 있는 돈이 늘자 사람들이 물건을 더 많이 사려고 합니다.",
    curve: 0,
    dir: 0,
    price: 0,
    qty: 0,
    badge: "수요가 끌어올린 물가",
    badgeClass: "border-rose-400/50 bg-rose-400/15 text-rose-100",
    explain: "쓸 돈이 늘면 같은 값에서 사려는 양이 많아져 수요곡선이 위로 올라가요. 값도 오르고 거래량도 늘어납니다.",
  },
  {
    id: "s2",
    emoji: "🛢️",
    title: "국제 유가가 크게 뛰었다",
    story: "기름값이 오르자 공장을 돌리고 물건을 나르는 비용이 모두 커졌어요. 사려는 사람의 마음은 그대로입니다.",
    curve: 1,
    dir: 1,
    price: 0,
    qty: 1,
    badge: "비용이 밀어올린 물가",
    badgeClass: "border-amber-400/50 bg-amber-400/15 text-amber-100",
    explain: "만드는 데 드는 돈이 커지면 같은 값에 내놓을 양이 줄어 공급곡선이 아래로 내려가요. 값은 오르는데 거래량은 줄어듭니다.",
  },
  {
    id: "s3",
    emoji: "🏦",
    title: "금리를 크게 내렸다",
    story: "중앙은행이 금리를 내리자 빌리는 돈이 싸졌어요. 시중에 돈이 많이 풀리면서 사람들의 씀씀이가 커졌습니다.",
    curve: 0,
    dir: 0,
    price: 0,
    qty: 0,
    badge: "돈이 많이 풀려서",
    badgeClass: "border-rose-400/50 bg-rose-400/15 text-rose-100",
    explain: "돈이 흔해지면 사려는 힘이 세져 수요곡선이 위로 올라가요. 물가가 오르는 대표적인 까닭 가운데 하나입니다.",
  },
  {
    id: "s4",
    emoji: "🧊",
    title: "경기가 나빠져 지갑을 닫았다",
    story: "일자리가 줄고 앞날이 걱정되자 사람들이 꼭 필요한 것만 사기 시작했어요. 만드는 비용은 그대로입니다.",
    curve: 0,
    dir: 1,
    price: 1,
    qty: 1,
    badge: "물가가 내려가는 신호",
    badgeClass: "border-sky-400/50 bg-sky-400/15 text-sky-100",
    explain: "사려는 양이 줄면 수요곡선이 아래로 내려가요. 값도 내리고 거래량도 줄어듭니다. 이런 일이 오래 이어지면 디플레이션이 됩니다.",
  },
  {
    id: "s5",
    emoji: "🤖",
    title: "새 기술로 생산성이 좋아졌다",
    story: "공장에 새 설비가 들어와 같은 값을 받고도 훨씬 많이 만들 수 있게 되었어요. 사려는 사람의 마음은 그대로입니다.",
    curve: 1,
    dir: 0,
    price: 1,
    qty: 0,
    badge: "물가를 눌러 주는 힘",
    badgeClass: "border-emerald-400/50 bg-emerald-400/15 text-emerald-100",
    explain: "만들기 쉬워지면 공급곡선이 위로 올라가요. 값은 내리고 거래량은 늘어납니다. 기술 발전이 물가를 안정시키는 까닭이에요.",
  },
  {
    id: "s6",
    emoji: "🌾",
    title: "이상 기후로 밀 수확이 줄었다",
    story: "가뭄이 이어져 밀 수확량이 크게 줄었어요. 빵을 만들 재료를 구하기가 어려워졌습니다.",
    curve: 1,
    dir: 1,
    price: 0,
    qty: 1,
    badge: "갑작스러운 공급 충격",
    badgeClass: "border-amber-400/50 bg-amber-400/15 text-amber-100",
    explain: "재료가 귀해지면 내놓을 수 있는 양이 줄어 공급곡선이 아래로 내려가요. 값은 오르고 거래량은 줄어듭니다.",
  },
];

export const Q2_LABELS = {
  curve: ["수요곡선", "공급곡선"],
  dir: ["위쪽으로", "아래쪽으로"],
  price: ["상승", "하락"],
  qty: ["증가", "감소"],
};

// ══════════════════════════════════════════════════════════════
//  탭 ③ 물가가 오르면 내 돈은
// ══════════════════════════════════════════════════════════════
export const PRICE_RANGE = { r: { min: 0.5, max: 12, step: 0.5 }, n: { min: 1, max: 20, step: 1 } };
export const PRICE_START = { r: 5, n: 10 };

export type Item = { id: string; emoji: string; name: string; price: number };
export const ITEMS: Item[] = [
  { id: "gimbap", emoji: "🍙", name: "김밥 한 줄", price: 4000 },
  { id: "movie", emoji: "🎬", name: "영화표 한 장", price: 14000 },
  { id: "bus", emoji: "🚌", name: "버스 요금", price: 1500 },
];
export const WALLET = 10000;

export function grow(base: number, r: number, n: number): number {
  return base * Math.pow(1 + r / 100, n);
}
export function shrink(base: number, r: number, n: number): number {
  return base / Math.pow(1 + r / 100, n);
}
/** 72의 법칙 — 물가가 두 배가 되는 데 걸리는 해 */
export function doubleYears(r: number): number {
  return 72 / r;
}

// ══════════════════════════════════════════════════════════════
//  단계별 문제 공용 타입
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

export const MONEY_STEPS: PStep[] = [
  {
    kind: "number",
    id: "m1",
    ask: "물가가 해마다 5%씩 오른다면 지금 4,000원인 김밥 한 줄은 4년 뒤 얼마가 될까요? (일의 자리까지, 반올림)",
    tex: "4000 \\times (1 + 0.05)^{4}",
    hint: "1.05를 네 번 곱하면 약 1.2155 예요.",
    answer: 4862,
    suffix: "원",
    tol: 2,
    explain: "4,000 × 1.2155 ≈ 4,862원. 4년 만에 약 862원, 곧 22%쯤 오릅니다.",
  },
  {
    kind: "choice",
    id: "m2",
    ask: "월급이 3% 올랐는데 물가는 6% 올랐어요. 실제로 살 수 있는 양(실질 소득)은 어떻게 될까요?",
    tex: "\\dfrac{1 + 0.03}{1 + 0.06}",
    hint: "1.03 ÷ 1.06 을 계산해 1과 견주어 보세요.",
    options: [{ text: "약 2.8% 줄어든다" }, { text: "약 3% 늘어난다" }, { text: "약 9% 줄어든다" }, { text: "달라지지 않는다" }],
    answer: 0,
    explain:
      "1.03 ÷ 1.06 ≈ 0.972 이므로 약 2.8% 줄어요. 월급이 올라도 물가가 더 많이 오르면 살 수 있는 양은 오히려 줄어듭니다.",
  },
  {
    kind: "number",
    id: "m3",
    ask: "물가가 해마다 6%씩 오른다면 물가가 두 배가 되는 데 약 몇 년이 걸릴까요? (72의 법칙)",
    tex: "\\dfrac{72}{6}",
    hint: "72를 상승률(%)로 나누면 돼요.",
    answer: 12,
    suffix: "년",
    explain: "72 ÷ 6 = 12년. 실제로 1.06¹² ≈ 2.012 이니 꽤 잘 맞는 어림셈이에요.",
  },
  {
    kind: "choice",
    id: "m4",
    ask: "물가가 해마다 4%씩 오르는 나라에서 지금 100만원을 금고에 그냥 넣어 두면 10년 뒤 그 돈으로 살 수 있는 양은 지금의 얼마쯤일까요?",
    tex: "\\dfrac{100}{(1 + 0.04)^{10}}",
    hint: "1.04를 열 번 곱하면 약 1.48 이에요.",
    options: [{ text: "약 148만원어치" }, { text: "약 68만원어치" }, { text: "약 96만원어치" }, { text: "약 40만원어치" }],
    answer: 1,
    explain:
      "100 ÷ 1.48 ≈ 67.6 이므로 약 68만원어치예요. 돈의 액수는 그대로인데 살 수 있는 양이 3분의 1쯤 사라진 셈입니다.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 역사 속 물가 이야기
// ══════════════════════════════════════════════════════════════
export type PriceType = "inflation" | "deflation" | "stag";

export type TypeCard = {
  id: PriceType;
  emoji: string;
  name: string;
  sub: string;
  cause: string;
  effect: string;
  ring: string;
  chip: string;
  dot: string;
};

export const TYPES: TypeCard[] = [
  {
    id: "inflation",
    emoji: "📈",
    name: "인플레이션",
    sub: "물가가 얼마 동안 계속 오르는 일",
    cause: "수요 급증 · 생산비 상승 · 돈이 너무 많이 풀림",
    effect: "돈의 가치가 떨어져 같은 돈으로 살 수 있는 양이 줄어요",
    ring: "border-rose-400/50 bg-rose-400/[0.10]",
    chip: "bg-rose-400/20 text-rose-100",
    dot: "#fb7185",
  },
  {
    id: "deflation",
    emoji: "📉",
    name: "디플레이션",
    sub: "물가가 얼마 동안 계속 내리는 일",
    cause: "수요 감소 · 기업 매출 감소 · 투자와 고용이 얼어붙음",
    effect: "돈의 가치는 오르지만 '더 기다렸다 사자'며 소비를 미뤄요",
    ring: "border-sky-400/50 bg-sky-400/[0.10]",
    chip: "bg-sky-400/20 text-sky-100",
    dot: "#38bdf8",
  },
  {
    id: "stag",
    emoji: "🥶",
    name: "스태그플레이션",
    sub: "물가는 오르는데 경기는 가라앉는 일",
    cause: "갑작스러운 공급 충격(유가 급등) · 정책 실패",
    effect: "물가도 오르고 일자리도 줄어 손쓰기가 가장 어려워요",
    ring: "border-violet-400/50 bg-violet-400/[0.10]",
    chip: "bg-violet-400/20 text-violet-100",
    dot: "#c084fc",
  },
];

export type HistPoint = {
  id: string;
  flag: string;
  place: string;
  year: number;
  /** 실질 경제성장률 (%) */
  g: number;
  /** 소비자물가 상승률 (%) */
  i: number;
  type: PriceType | "stable";
  head: string;
  note: string;
};

export const HISTORY: HistPoint[] = [
  {
    id: "kr1998",
    flag: "🇰🇷",
    place: "우리나라",
    year: 1998,
    g: -5.1,
    i: 7.5,
    type: "stag",
    head: "외환위기",
    note: "환율이 치솟아 수입 물건값이 뛰었는데 경제는 크게 뒷걸음쳤어요. 물가와 실업이 함께 올라간 해입니다.",
  },
  {
    id: "kr2009",
    flag: "🇰🇷",
    place: "우리나라",
    year: 2009,
    g: 0.8,
    i: 2.8,
    type: "inflation",
    head: "세계 금융위기",
    note: "성장은 거의 멈췄지만 물가는 조금 올랐어요. 세계 경제가 크게 흔들린 해였습니다.",
  },
  {
    id: "kr2015",
    flag: "🇰🇷",
    place: "우리나라",
    year: 2015,
    g: 2.8,
    i: 0.7,
    type: "stable",
    head: "아주 낮은 물가",
    note: "성장은 이어졌는데 물가는 거의 오르지 않았어요. 국제 유가가 크게 내린 것이 큰 몫을 했습니다.",
  },
  {
    id: "kr2020",
    flag: "🇰🇷",
    place: "우리나라",
    year: 2020,
    g: -0.7,
    i: 0.5,
    type: "stable",
    head: "감염병으로 멈춘 해",
    note: "사람들이 밖에 나가지 못해 수요가 확 줄었어요. 성장률은 마이너스였지만 물가도 거의 오르지 않았습니다.",
  },
  {
    id: "kr2022",
    flag: "🇰🇷",
    place: "우리나라",
    year: 2022,
    g: 2.7,
    i: 5.1,
    type: "inflation",
    head: "24년 만의 높은 물가",
    note: "감염병 뒤 수요가 되살아난 데다 국제 원자재값까지 뛰어 물가가 크게 올랐어요. 수요와 비용이 함께 밀어올린 물가입니다.",
  },
  {
    id: "kr2024",
    flag: "🇰🇷",
    place: "우리나라",
    year: 2024,
    g: 2.0,
    i: 2.3,
    type: "stable",
    head: "다시 안정으로",
    note: "금리를 올려 돈이 도는 속도를 늦추자 물가 상승률이 2%대로 내려왔어요.",
  },
  {
    id: "jp1999",
    flag: "🇯🇵",
    place: "일본",
    year: 1999,
    g: -0.3,
    i: -0.3,
    type: "deflation",
    head: "잃어버린 시절의 시작",
    note: "부동산·주식 거품이 꺼진 뒤 물가가 오히려 내렸어요. 사람들이 소비를 미루면서 경기가 오래 가라앉았습니다.",
  },
  {
    id: "jp2009",
    flag: "🇯🇵",
    place: "일본",
    year: 2009,
    g: -5.7,
    i: -1.4,
    type: "deflation",
    head: "물가도 성장도 마이너스",
    note: "세계 금융위기까지 겹쳐 물가와 성장이 모두 마이너스가 되었어요. 디플레이션이 가장 깊었던 해입니다.",
  },
  {
    id: "jp2016",
    flag: "🇯🇵",
    place: "일본",
    year: 2016,
    g: 0.8,
    i: -0.1,
    type: "deflation",
    head: "좀처럼 오르지 않는 물가",
    note: "경제는 조금씩 자랐는데 물가는 여전히 제자리였어요. 디플레이션에서 빠져나오기가 얼마나 어려운지 보여 줍니다.",
  },
];

export const HIST_VIEW = { gMin: -7, gMax: 5, iMin: -3, iMax: 9 };

export type Era = {
  id: string;
  emoji: string;
  title: string;
  when: string;
  type: PriceType;
  lead: string;
  bars: { label: string; value: number }[];
  barUnit: string;
  /** 로그 눈금으로 그릴지 */
  logScale?: boolean;
  tail: string;
};

export const ERAS: Era[] = [
  {
    id: "de1923",
    emoji: "🇩🇪",
    title: "돈을 수레에 담아 다닌 독일",
    when: "1922 ~ 1923년",
    type: "inflation",
    lead:
      "전쟁 배상금을 갚으려고 돈을 마구 찍어 내자 돈의 가치가 순식간에 사라졌어요. 빵 한 덩이 값이 두 해 만에 수백억 배가 되었습니다.",
    bars: [
      { label: "1922년 1월", value: 3.5 },
      { label: "1923년 1월", value: 250 },
      { label: "1923년 7월", value: 3465 },
      { label: "1923년 9월", value: 1512000 },
      { label: "1923년 11월", value: 201000000000 },
    ],
    barUnit: "마르크",
    logScale: true,
    tail:
      "막대의 눈금은 한 칸 올라갈 때마다 10배가 되는 눈금이에요. 곧게 뻗은 막대는 값이 곱하기로 늘어났다는 뜻입니다. 이렇게 걷잡을 수 없이 오르는 물가를 초인플레이션이라고 불러요.",
  },
  {
    id: "kr1980",
    emoji: "🛢️",
    title: "기름값이 흔든 우리나라",
    when: "1980년",
    type: "stag",
    lead:
      "두 번째 석유 파동으로 원유값이 뛰자 생산비가 한꺼번에 커졌어요. 물가는 크게 올랐는데 경제는 뒷걸음친 해였습니다.",
    bars: [
      { label: "물가 상승률", value: 28.7 },
      { label: "경제성장률", value: -1.6 },
    ],
    barUnit: "%",
    tail:
      "공급곡선이 아래로 내려가면 값은 오르고 거래량은 줄어요. 이것이 나라 전체에서 한꺼번에 일어난 것이 스태그플레이션입니다.",
  },
  {
    id: "jplost",
    emoji: "🇯🇵",
    title: "물가가 오르지 않은 일본",
    when: "1999 ~ 2016년",
    type: "deflation",
    lead:
      "거품이 꺼진 뒤 일본에서는 물가가 내리거나 제자리에 머무는 해가 오래 이어졌어요. 값이 더 내릴 것 같으니 사람들이 소비를 미뤘습니다.",
    bars: [
      { label: "1999년", value: -0.3 },
      { label: "2002년", value: -0.9 },
      { label: "2009년", value: -1.4 },
      { label: "2016년", value: -0.1 },
    ],
    barUnit: "%",
    tail:
      "물가가 내리면 좋을 것 같지만, 기업의 매출이 줄고 일자리가 사라지며 빌린 돈의 실제 무게는 오히려 무거워져요.",
  },
];

export type Classify = { id: string; emoji: string; text: string; answer: number; explain: string };

/** 보기 순서는 TYPES 와 같다 — 0 인플레이션 · 1 디플레이션 · 2 스태그플레이션 */
export const CLASSIFY: Classify[] = [
  {
    id: "c1",
    emoji: "🏭",
    text: "물건값은 계속 오르는데 공장은 문을 닫고 일자리가 줄어들고 있다.",
    answer: 2,
    explain: "물가 상승과 경기 침체가 같이 왔으니 스태그플레이션이에요. 금리를 올리자니 경기가, 내리자니 물가가 걱정되는 상황입니다.",
  },
  {
    id: "c2",
    emoji: "🛒",
    text: "값이 조금씩 떨어지자 사람들이 '조금 더 기다렸다 사자'며 지갑을 닫는다.",
    answer: 1,
    explain: "물가가 내려가고 소비가 미뤄지는 디플레이션이에요. 값이 내리는 것이 되레 경기를 더 얼어붙게 만듭니다.",
  },
  {
    id: "c3",
    emoji: "🚀",
    text: "경제가 잘 돌아가고 소득이 늘면서 물건값도 해마다 2%쯤 함께 오른다.",
    answer: 0,
    explain: "성장과 함께 오는 완만한 인플레이션이에요. 여러 나라의 중앙은행이 목표로 삼는 것이 바로 이 2% 정도의 물가 상승입니다.",
  },
  {
    id: "c4",
    emoji: "🛒",
    text: "빵 한 덩이 값이 몇 달 만에 수백만 배가 되어 돈을 수레에 담아 다닌다.",
    answer: 0,
    explain: "아주 심한 인플레이션, 곧 초인플레이션이에요. 돈의 가치가 사실상 사라진 상태입니다.",
  },
  {
    id: "c5",
    emoji: "⛽",
    text: "원유값이 갑자기 뛰어 생산비가 커졌는데 경기는 얼어붙어 성장률이 마이너스다.",
    answer: 2,
    explain: "공급 충격이 물가를 밀어올린 스태그플레이션이에요. 1970~80년대 석유 파동 때 여러 나라가 겪었습니다.",
  },
  {
    id: "c6",
    emoji: "🏦",
    text: "은행에 넣어 둔 돈의 실제 가치는 커지는데, 기업의 매출과 빌린 돈의 부담은 오히려 나빠진다.",
    answer: 1,
    explain: "돈의 가치가 오르는 디플레이션이에요. 빌린 사람은 갚아야 할 돈의 실제 무게가 무거워집니다.",
  },
];

export const DATA_NOTE =
  "📌 소비자물가 상승률과 실질 경제성장률은 통계청 소비자물가지수, 한국은행 국민계정, 일본 총무성·내각부가 밝힌 값을 소수 첫째 자리로 반올림해 옮긴 것이다. 1923년 독일의 빵값은 여러 역사 자료에 실린 대표적인 기록으로, 자료마다 조금씩 다르게 적혀 있다. 그래프는 흐름을 보기 위한 것이므로 실제 통계 그림과 눈금이 다를 수 있다.";
