// 수입과 지출을 고려한 금융 생활 — 활동 데이터
//
//  교과서 활동 그대로:
//   · A씨의 한 달 지출표(월수입 250만원, 지출 합계 250만원)
//   · 조정 지출1 — 내가 A씨라면? 항목을 더하고 최소 비용으로 조정
//   · 조정 지출2·3 — 월수입이 20% 늘었을 때 / 20% 줄었을 때
//       소득세: [연 소득 1,400만원 초과 5,000만원 이하] 84만원 + (1,400만원 초과 금액의 15%)
//   · 정한 저축액을 10년 만기 정기 적금(월이율 0.5% 복리)에 넣으면? (1.005^120 = 1.82)

export type Group = "생활" | "공과금" | "문화·자기계발" | "저축";

export type Item = {
  id: string;
  emoji: string;
  name: string;
  group: Group;
  base: number;      // A씨의 지출
  min: number;       // 슬라이더 최솟값
  max: number;       // 슬라이더 최댓값
  step: number;
  fixed?: boolean;   // 줄이기 어려운 고정 지출
  auto?: boolean;    // 자동 계산 항목(소득세·저축)
  hint?: string;
};

export const ITEMS: Item[] = [
  { id: "rent", emoji: "🏠", name: "주거비(월세)", group: "생활", base: 500_000, min: 200_000, max: 900_000, step: 10_000, fixed: true, hint: "집을 옮기지 않으면 바꾸기 어려운 돈" },
  { id: "food", emoji: "🍚", name: "식비", group: "생활", base: 400_000, min: 150_000, max: 800_000, step: 10_000, hint: "외식을 줄이면 크게 달라져요" },
  { id: "transport", emoji: "🚇", name: "교통비", group: "생활", base: 70_000, min: 0, max: 300_000, step: 5_000, hint: "대중교통 이용료 또는 차량 유지비" },
  { id: "clothes", emoji: "👕", name: "의류 및 꾸밈 비용", group: "생활", base: 100_000, min: 0, max: 400_000, step: 10_000 },
  { id: "telecom", emoji: "📱", name: "통신 요금", group: "생활", base: 60_000, min: 20_000, max: 150_000, step: 5_000, fixed: true, hint: "요금제를 바꾸면 조금 줄일 수 있어요" },
  { id: "tax", emoji: "🧾", name: "소득세", group: "공과금", base: 270_000, min: 0, max: 1_000_000, step: 1_000, auto: true, hint: "수입에 따라 자동으로 계산돼요" },
  { id: "elec", emoji: "💡", name: "전기 요금", group: "공과금", base: 40_000, min: 10_000, max: 150_000, step: 5_000 },
  { id: "water", emoji: "🚰", name: "수도 요금", group: "공과금", base: 20_000, min: 5_000, max: 80_000, step: 5_000 },
  { id: "book", emoji: "📚", name: "도서 구입비", group: "문화·자기계발", base: 50_000, min: 0, max: 200_000, step: 5_000 },
  { id: "movie", emoji: "🎬", name: "영화 관람료", group: "문화·자기계발", base: 30_000, min: 0, max: 150_000, step: 5_000 },
  { id: "ott", emoji: "📺", name: "OTT 구독료", group: "문화·자기계발", base: 20_000, min: 0, max: 80_000, step: 5_000, fixed: true },
  { id: "social", emoji: "🎁", name: "대인 관계 유지비", group: "생활", base: 90_000, min: 0, max: 300_000, step: 10_000, hint: "친구 선물 및 경조사비" },
  { id: "medical", emoji: "🏥", name: "의료비", group: "생활", base: 50_000, min: 0, max: 300_000, step: 10_000 },
  { id: "self", emoji: "🎓", name: "자기 계발비", group: "문화·자기계발", base: 100_000, min: 0, max: 500_000, step: 10_000, hint: "학원 수강료 등" },
  { id: "saving", emoji: "🐷", name: "저축", group: "저축", base: 700_000, min: 0, max: 2_000_000, step: 10_000, auto: true, hint: "수입에서 지출을 뺀 나머지" },
];

/** 교과서 활동 — “추가적으로 필요하다고 생각되는 항목”을 담는 후보 */
export type Extra = { id: string; emoji: string; name: string; group: Group; def: number; max: number; why: string };
export const EXTRAS: Extra[] = [
  { id: "insure", emoji: "🛡️", name: "보험료", group: "공과금", def: 80_000, max: 300_000, why: "아플 때·사고가 났을 때를 대비" },
  { id: "pension", emoji: "👵", name: "개인연금(연금저축)", group: "저축", def: 100_000, max: 500_000, why: "노후를 위한 3층 연금" },
  { id: "emergency", emoji: "🚨", name: "비상금 통장", group: "저축", def: 100_000, max: 500_000, why: "갑자기 목돈이 필요할 때" },
  { id: "parents", emoji: "💝", name: "부모님 용돈", group: "생활", def: 100_000, max: 500_000, why: "가족을 위한 지출" },
  { id: "pet", emoji: "🐶", name: "반려동물", group: "생활", def: 80_000, max: 300_000, why: "사료·병원비" },
  { id: "gym", emoji: "🏋️", name: "운동·헬스", group: "문화·자기계발", def: 60_000, max: 200_000, why: "건강 관리" },
  { id: "travel", emoji: "✈️", name: "여행 적립", group: "문화·자기계발", def: 100_000, max: 500_000, why: "1년에 한 번 여행 준비" },
  { id: "coffee", emoji: "☕", name: "커피·간식", group: "생활", def: 60_000, max: 200_000, why: "하루 한 잔이면 한 달에 얼마?" },
];

export const BASE_INCOME = 2_500_000;

export type ScenarioId = "s1" | "s2" | "s3";
export type Scenario = { id: ScenarioId; label: string; short: string; income: number; desc: string; tone: string };

export const SCENARIOS: Scenario[] = [
  { id: "s1", label: "조정 지출 1", short: "조정1", income: BASE_INCOME, desc: "수입은 그대로 250만원 — 항목을 더하고 최소 비용으로 조정", tone: "sky" },
  { id: "s2", label: "조정 지출 2", short: "조정2", income: Math.round(BASE_INCOME * 1.2), desc: "월수입이 20% 늘어 300만원", tone: "emerald" },
  { id: "s3", label: "조정 지출 3", short: "조정3", income: Math.round(BASE_INCOME * 0.8), desc: "월수입이 20% 줄어 200만원", tone: "rose" },
];

/**
 * 소득세(월) — 교과서에서 준 종합소득세 기본세율 표를 그대로 적용.
 *   1,400만원 이하: 6%
 *   1,400만원 초과 5,000만원 이하: 84만원 + (1,400만원 초과 금액의 15%)
 *   5,000만원 초과 8,800만원 이하: 624만원 + (5,000만원 초과 금액의 24%)
 * (실제로는 근로소득공제·인적공제 등을 뺀 과세표준에 매기지만, 교과서 활동은 연소득에 바로 적용한다.)
 */
export function monthlyIncomeTax(monthlyIncome: number): number {
  const annual = monthlyIncome * 12;
  let tax: number;
  if (annual <= 14_000_000) tax = annual * 0.06;
  else if (annual <= 50_000_000) tax = 840_000 + (annual - 14_000_000) * 0.15;
  else tax = 6_240_000 + (annual - 50_000_000) * 0.24;
  return Math.round(tax / 12);
}

// ── 정기 적금(기수불, 매월 초 납입) ────────────────────────────
export const SAVING_RATE = 0.005;   // 월이율 0.5%
export const SAVING_MONTHS = 120;   // 10년
export const TEXTBOOK_POW = 1.82;   // 교과서에서 준 1.005^120 의 어림값

/** 매월 a원씩 n개월 적립할 때의 원리합계 배수 (1+r){(1+r)^n − 1} / r */
export function savingFactor(pow: number, r = SAVING_RATE): number {
  return ((1 + r) * (pow - 1)) / r;
}
export const FACTOR_TEXTBOOK = savingFactor(TEXTBOOK_POW);                       // 164.82
export const FACTOR_EXACT = savingFactor(Math.pow(1 + SAVING_RATE, SAVING_MONTHS)); // ≈ 164.70

export const DATA_NOTE =
  "A씨의 한 달 지출표와 조정 지출 활동, 소득세 계산식, 정기 적금 문제는 교과서 활동을 그대로 옮긴 것입니다. 소득세는 교과서가 제시한 종합소득세 기본세율(연 소득 1,400만원 초과 5,000만원 이하: 84만원 + 1,400만원 초과 금액의 15%)을 연소득에 바로 적용해 12로 나눈 값으로, 월수입 250만원이면 27만원·300만원이면 34.5만원·200만원이면 19.5만원이 됩니다. 실제 근로소득세는 근로소득공제·인적공제 등을 뺀 과세표준에 매기고 4대 보험료가 따로 빠지므로 실제 실수령액과는 차이가 있습니다. 정기 적금 원리합계는 매월 초 납입(기수불) 기준 S = a(1+r){(1+r)ⁿ−1}/r 로 계산하며, 교과서가 준 1.005¹²⁰ = 1.82를 쓰면 배수가 164.82, 정확한 값(1.819397…)을 쓰면 164.70으로 조금 달라집니다. 저축은 수입에서 다른 지출을 모두 뺀 나머지로 자동 계산합니다.";
