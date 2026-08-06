// 부가가치세(간접세) — 활동 데이터
// 근거: 부가가치세법 제26조(면세), 제30조(세율 10%), 제37조·제38조(납부세액 = 매출세액 − 매입세액).
// 금액 단위는 '원'.

export const VAT_RATE = 0.1;

export const DATA_NOTE =
  "부가가치세법 제30조(세율 10%), 제37조·제38조(납부세액 = 매출세액 − 매입세액), 제26조(면세: 미가공 식료품·도서·신문·여객운송(시내버스·지하철)·의료보건 용역·여성용 생리처리 위생용품 등). 마트 가격표와 영수증의 표시가격은 부가가치세가 포함된 금액이며, 과세 물품 가액 = 표시가격 ÷ 1.1 로 역산한다. 공급망 사례의 금액은 계산 원리를 보기 위한 예시 가격이다.";

// ══════════════════════════════════════════════════════════════
// 탭 ① 부가가치 사슬 시뮬레이션
// ══════════════════════════════════════════════════════════════
export type ChainStage = {
  emoji: string;
  label: string; // 사업자 이름
  role: string; // 단계 성격
  action: string; // 무엇을 해서 파는지
  price: number; // 이 단계의 판매가(공급가액, 부가세 별도)
};

export type Chain = {
  id: string;
  emoji: string;
  name: string;
  product: string; // 최종 소비자가 받는 것
  stages: ChainStage[]; // 항상 5단계(앞에서부터 n개 사용)
  note?: string;
};

export const CHAINS: Chain[] = [
  {
    id: "tomato",
    emoji: "🍅",
    name: "토마토 → 파스타",
    product: "토마토 파스타 1인분",
    stages: [
      { emoji: "🚜", label: "토마토 농장", role: "재료 생산", action: "토마토를 길러 판매", price: 2000 },
      { emoji: "🏭", label: "식품 공장", role: "가공", action: "토마토를 소스로 가공해 판매", price: 4000 },
      { emoji: "🚚", label: "식자재 도매상", role: "도매", action: "소스를 모아 식당·마트에 판매", price: 5000 },
      { emoji: "🏪", label: "마트", role: "소매", action: "마진을 붙여 진열·판매", price: 6000 },
      { emoji: "🍝", label: "식당", role: "외식 서비스", action: "요리해서 손님에게 판매", price: 12000 },
    ],
    note: "실제 세법에서는 가공하지 않은 농산물(토마토)이 면세라 1단계에는 부가가치세가 붙지 않아요. 여기서는 계산 원리를 보기 위해 모든 단계가 과세된다고 가정했어요.",
  },
  {
    id: "tshirt",
    emoji: "👕",
    name: "목화 → 티셔츠",
    product: "면 티셔츠 1장",
    stages: [
      { emoji: "🌱", label: "목화 농장", role: "재료 생산", action: "목화를 길러 판매", price: 3000 },
      { emoji: "🧵", label: "방적·방직 공장", role: "1차 가공", action: "실을 뽑아 원단으로 짜서 판매", price: 6000 },
      { emoji: "✂️", label: "봉제 공장", role: "2차 가공", action: "원단을 재단·봉제해 티셔츠로 판매", price: 12000 },
      { emoji: "🚚", label: "의류 도매상", role: "도매", action: "매장들에 나눠 판매", price: 16000 },
      { emoji: "🏬", label: "의류 매장", role: "소매", action: "진열·판매", price: 25000 },
    ],
  },
  {
    id: "desk",
    emoji: "🪑",
    name: "나무 → 책상",
    product: "원목 책상 1개",
    stages: [
      { emoji: "🌲", label: "임업 회사", role: "재료 생산", action: "원목을 베어 판매", price: 20000 },
      { emoji: "🪚", label: "제재소", role: "1차 가공", action: "원목을 판재로 켜서 판매", price: 40000 },
      { emoji: "🔨", label: "가구 공장", role: "2차 가공", action: "판재로 책상을 만들어 판매", price: 90000 },
      { emoji: "🚚", label: "가구 도매상", role: "도매", action: "매장들에 나눠 판매", price: 110000 },
      { emoji: "🏬", label: "가구 매장", role: "소매", action: "배송·조립 서비스와 함께 판매", price: 150000 },
    ],
  },
  {
    id: "phone",
    emoji: "📱",
    name: "부품 → 스마트폰",
    product: "스마트폰 1대",
    stages: [
      { emoji: "⛏️", label: "소재 회사", role: "재료 생산", action: "반도체용 웨이퍼·소재를 판매", price: 100000 },
      { emoji: "🔩", label: "부품 회사", role: "1차 가공", action: "칩·카메라·디스플레이를 만들어 판매", price: 300000 },
      { emoji: "🏭", label: "완제품 공장", role: "2차 가공", action: "부품을 조립해 스마트폰으로 판매", price: 700000 },
      { emoji: "🚚", label: "통신사 물류", role: "도매", action: "대리점에 공급", price: 900000 },
      { emoji: "🏪", label: "휴대폰 대리점", role: "소매", action: "개통 서비스와 함께 판매", price: 1000000 },
    ],
  },
];

export type ChainRow = {
  sale: number; // 판매가(공급가액)
  buy: number; // 매입가
  added: number; // 부가가치 = 판매가 − 매입가
  outTax: number; // 매출세액 = 판매가 × 10%
  inTax: number; // 매입세액 = 매입가 × 10%
  pay: number; // 납부세액 = 매출세액 − 매입세액
};

/** 단계별 판매가 배열로 각 단계의 부가가치·세액을 계산 */
export function chainRows(prices: number[]): ChainRow[] {
  return prices.map((sale, i) => {
    const buy = i === 0 ? 0 : prices[i - 1];
    const outTax = Math.round(sale * VAT_RATE);
    const inTax = Math.round(buy * VAT_RATE);
    return { sale, buy, added: sale - buy, outTax, inTax, pay: outTax - inTax };
  });
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 영수증 탐구 — 과세 물품 / 면세 물품
// ══════════════════════════════════════════════════════════════
export type ShopGroup = "식료품" | "가공식품·음료" | "생활용품" | "서비스·문화";

export type ShopItem = {
  id: string;
  emoji: string;
  name: string;
  price: number; // 단가(소비자가 내는 표시가격 = 과세품이면 부가세 포함)
  exempt: boolean; // true = 면세
  group: ShopGroup;
  reason: string; // 면세/과세인 까닭
};

export const SHOP_ITEMS: ShopItem[] = [
  // ── 식료품(대부분 면세: 미가공 식료품) ──
  { id: "rice", emoji: "🍚", name: "쌀 5kg", price: 15000, exempt: true, group: "식료품", reason: "가공하지 않은 곡물은 미가공 식료품이라 면세예요." },
  { id: "milk", emoji: "🥛", name: "흰 우유 1L", price: 4000, exempt: true, group: "식료품", reason: "살균만 한 흰 우유는 미가공 식료품으로 보아 면세예요." },
  { id: "egg", emoji: "🥚", name: "계란 30구", price: 7000, exempt: true, group: "식료품", reason: "가공하지 않은 축산물이라 면세예요." },
  { id: "cabbage", emoji: "🥬", name: "배추 1포기", price: 4000, exempt: true, group: "식료품", reason: "가공하지 않은 농산물이라 면세예요." },
  { id: "apple", emoji: "🍎", name: "사과 5개", price: 8000, exempt: true, group: "식료품", reason: "가공하지 않은 농산물이라 면세예요." },
  { id: "pork", emoji: "🥩", name: "돼지고기 600g", price: 12000, exempt: true, group: "식료품", reason: "단순히 자르기만 한 정육은 미가공 식료품이라 면세예요." },
  { id: "fish", emoji: "🐟", name: "고등어 2마리", price: 6000, exempt: true, group: "식료품", reason: "가공하지 않은 수산물이라 면세예요." },

  // ── 가공식품·음료(과세) ──
  { id: "ramen", emoji: "🍜", name: "라면 (1개)", price: 880, exempt: false, group: "가공식품·음료", reason: "라면은 공장에서 가공한 식품이라 과세예요. 880원 = 800원 + 부가세 80원." },
  { id: "snack", emoji: "🍫", name: "초코 스낵", price: 1320, exempt: false, group: "가공식품·음료", reason: "과자는 가공식품이라 과세예요. 1,320원 = 1,200원 + 부가세 120원." },
  { id: "flavmilk", emoji: "🧃", name: "딸기 우유 500mL", price: 1650, exempt: false, group: "가공식품·음료", reason: "설탕·향을 넣어 가공한 가공유는 과세예요. 같은 우유라도 흰 우유(면세)와 달라요!" },
  { id: "instantrice", emoji: "🍱", name: "즉석밥 3개", price: 4950, exempt: false, group: "가공식품·음료", reason: "조리·포장한 가공식품이라 과세예요. 쌀(면세)과 비교해 보세요!" },
  { id: "sausage", emoji: "🌭", name: "소시지 1팩", price: 6600, exempt: false, group: "가공식품·음료", reason: "양념·훈제로 가공한 육가공품이라 과세예요. 생돼지고기(면세)와 비교해 보세요!" },
  { id: "cola", emoji: "🥤", name: "탄산음료 1.5L", price: 2200, exempt: false, group: "가공식품·음료", reason: "가공한 음료라 과세예요." },
  { id: "water", emoji: "💧", name: "생수 6병", price: 3300, exempt: false, group: "가공식품·음료", reason: "수돗물은 면세지만, 병에 담아 파는 생수는 과세예요." },

  // ── 생활용품 ──
  { id: "detergent", emoji: "🧴", name: "세탁 세제", price: 5500, exempt: false, group: "생활용품", reason: "공산품이라 과세예요." },
  { id: "pen", emoji: "✏️", name: "볼펜 1자루", price: 1100, exempt: false, group: "생활용품", reason: "공산품이라 과세예요." },
  { id: "tshirt", emoji: "👕", name: "티셔츠 1장", price: 22000, exempt: false, group: "생활용품", reason: "공산품이라 과세예요." },
  { id: "pad", emoji: "🩹", name: "생리대 1팩", price: 5500, exempt: true, group: "생활용품", reason: "여성용 생리처리 위생용품은 2018년부터 면세예요(생활 필수품)." },
  { id: "book", emoji: "📚", name: "수학 문제집", price: 15000, exempt: true, group: "생활용품", reason: "도서는 지식·문화를 위해 면세예요." },
  { id: "news", emoji: "📰", name: "신문 1개월 구독", price: 20000, exempt: true, group: "생활용품", reason: "신문(광고 제외)은 면세예요." },

  // ── 서비스·문화 ──
  { id: "subway", emoji: "🚇", name: "지하철 요금 1회", price: 1400, exempt: true, group: "서비스·문화", reason: "시내버스·지하철 같은 대중교통 여객운송은 면세예요." },
  { id: "taxi", emoji: "🚕", name: "택시 요금", price: 8800, exempt: false, group: "서비스·문화", reason: "택시는 대중교통 면세 대상이 아니라 과세예요. 지하철(면세)과 비교해 보세요!" },
  { id: "clinic", emoji: "🏥", name: "병원 진료비(감기)", price: 5000, exempt: true, group: "서비스·문화", reason: "의료보건 용역은 국민 건강을 위해 면세예요." },
  { id: "cafe", emoji: "☕", name: "카페 아메리카노", price: 4400, exempt: false, group: "서비스·문화", reason: "음식점·카페에서 조리해 파는 것은 과세예요." },
  { id: "movie", emoji: "🎬", name: "영화 관람 1인", price: 14000, exempt: false, group: "서비스·문화", reason: "영화 관람은 과세예요(도서·신문과 달리 면세 대상이 아니에요)." },
];

export const SHOP_GROUPS: ShopGroup[] = ["식료품", "가공식품·음료", "생활용품", "서비스·문화"];

export type Cart = Record<string, number>; // itemId → 수량

export type Preset = { id: string; label: string; desc: string; cart: Cart };
export const PRESETS: Preset[] = [
  {
    id: "textbook",
    label: "🧾 교과서 영수증",
    desc: "쌀 5kg · 흰 우유 1L · 라면 5개 · 초코 스낵 1개 → 면세 19,000 / 과세 5,200 / 부가세 520 / 합계 24,720",
    cart: { rice: 1, milk: 1, ramen: 5, snack: 1 },
  },
  {
    id: "compare",
    label: "🔍 헷갈리는 짝 비교",
    desc: "흰 우유↔딸기 우유, 쌀↔즉석밥, 돼지고기↔소시지, 지하철↔택시",
    cart: { milk: 1, flavmilk: 1, rice: 1, instantrice: 1, pork: 1, sausage: 1, subway: 1, taxi: 1 },
  },
  {
    id: "weekend",
    label: "🛒 주말 장보기",
    desc: "신선식품과 가공식품·생활용품이 섞인 한 주 장바구니",
    cart: { rice: 1, egg: 1, cabbage: 1, pork: 1, apple: 1, ramen: 5, snack: 2, cola: 1, detergent: 1, water: 1 },
  },
  {
    id: "myday",
    label: "🎒 나의 하루",
    desc: "등하교·간식·문화생활 — 서비스에도 부가세가 붙는지 확인",
    cart: { subway: 2, cafe: 1, snack: 1, book: 1, movie: 1, pen: 2 },
  },
];

export type ReceiptSummary = {
  exemptAmount: number; // 면세 물품 가액
  taxableSupply: number; // 과세 물품 가액(공급가액)
  vat: number; // 부가가치세
  total: number; // 합계(소비자가 낸 금액)
};

/** 장바구니로 영수증 합계 계산. 과세품의 표시가격은 부가세 포함 금액. */
export function receiptSummary(cart: Cart): ReceiptSummary {
  let exemptAmount = 0;
  let taxableGross = 0;
  for (const item of SHOP_ITEMS) {
    const qty = cart[item.id] ?? 0;
    if (qty <= 0) continue;
    if (item.exempt) exemptAmount += item.price * qty;
    else taxableGross += item.price * qty;
  }
  const taxableSupply = Math.round(taxableGross / (1 + VAT_RATE));
  const vat = taxableGross - taxableSupply;
  return { exemptAmount, taxableSupply, vat, total: exemptAmount + taxableGross };
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 퀴즈
// ══════════════════════════════════════════════════════════════
export type Quiz = { icon: string; q: string; options: string[]; answer: number; why: string };

export const QUIZZES: Quiz[] = [
  {
    icon: "🍅",
    q: "농장이 토마토를 2,000원에 팔고, 공장이 그것을 소스로 만들어 4,000원에 팔았어요. 공장이 새로 만들어 낸 ‘부가가치’는?",
    options: ["2,000원", "4,000원"],
    answer: 0,
    why: "부가가치 = 판매가 − 매입가 = 4,000 − 2,000 = 2,000원. 판매가 전체가 아니라 ‘새로 더해진 가치’예요.",
  },
  {
    icon: "🧮",
    q: "어떤 사업자의 매출세액이 400원, 매입세액이 200원이에요. 이 사업자가 실제로 납부하는 세액은?",
    options: ["200원", "600원"],
    answer: 0,
    why: "납부세액 = 매출세액 − 매입세액 = 400 − 200 = 200원. 앞 단계에서 이미 낸 세금은 빼 주기 때문에 중복 과세가 되지 않아요.",
  },
  {
    icon: "👩",
    q: "부가가치세는 여러 단계의 사업자가 나눠서 납부해요. 그렇다면 그 세금을 결국 ‘부담’하는 사람은 누구일까요?",
    options: ["각 단계의 생산자", "최종 소비자"],
    answer: 1,
    why: "각 단계의 세금은 판매가에 얹혀 다음 단계로 넘어가고, 마지막에 최종 소비자가 전부 부담해요. 내는 사람(사업자)과 부담하는 사람(소비자)이 다른 것이 간접세의 특징이에요.",
  },
  {
    icon: "🏷️",
    q: "마트 가격표에 3,300원이라고 적힌 과자가 있어요. 이 가격 안에 들어 있는 부가가치세는 얼마일까요?",
    options: ["300원", "330원"],
    answer: 0,
    why: "표시가격은 이미 부가세가 포함된 금액이에요. 물품 가액 3,000원 + 부가세 300원 = 3,300원. 3,300 ÷ 1.1 = 3,000으로 역산해요.",
  },
  {
    icon: "🥛",
    q: "흰 우유와 딸기 우유 중 부가가치세가 붙는 것은?",
    options: ["흰 우유", "딸기 우유"],
    answer: 1,
    why: "살균만 한 흰 우유는 미가공 식료품이라 면세, 설탕·향을 넣어 가공한 딸기 우유는 과세예요.",
  },
  {
    icon: "🚇",
    q: "지하철 요금과 택시 요금 중 부가가치세가 붙는 것은?",
    options: ["지하철 요금", "택시 요금"],
    answer: 1,
    why: "시내버스·지하철 같은 대중교통 여객운송은 면세지만, 택시는 면세 대상이 아니라 과세예요.",
  },
  {
    icon: "🧾",
    q: "영수증에 ‘면세 물품 가액 19,000원’이라고 적혀 있어요. 이 19,000원에 붙은 부가가치세는?",
    options: ["0원", "1,900원"],
    answer: 0,
    why: "면세 물품에는 부가가치세가 아예 붙지 않아요. 그래서 영수증에서 과세 물품과 따로 적어 줘요.",
  },
  {
    icon: "❗",
    q: "만약 매입세액을 빼 주지 않고, 단계마다 판매가 전체에 10%를 매긴다면 어떻게 될까요?",
    options: ["세금이 중복되어 총 세금이 훨씬 커진다", "총 세금은 똑같다"],
    answer: 0,
    why: "앞 단계에서 이미 과세된 금액에 또 세금이 붙어 단계가 많을수록 세금이 눈덩이처럼 불어나요. 매입세액 공제가 바로 이 중복 과세를 막는 장치예요.",
  },
  {
    icon: "⚖️",
    q: "부가가치세는 소득이 많든 적든 똑같은 10%예요. 그래서 소득이 적은 사람일수록 소득 대비 세 부담 비율이 커지는데, 이런 성질을 뭐라고 할까요?",
    options: ["역진성", "누진성"],
    answer: 0,
    why: "이것이 간접세의 ‘역진성’이에요. 그래서 쌀·우유 같은 생활 필수품과 의료·교육·대중교통에는 면세를 두어 부담을 덜어 줘요.",
  },
];
