// 정기 적금의 원리합계 — 활동 데이터
//
//  매 기간 초에 a원씩, 이율 r의 복리로 n기간 적립할 때(기수불)
//   · 제k회 납입금은 만기까지 (n−k+1)기간 동안 이자가 붙는다 → a(1+r)^(n−k+1)
//   · 만기 원리합계는 첫째항 a(1+r), 공비 (1+r), 항수 n 인 등비수열의 합
//       S = a(1+r) + a(1+r)² + … + a(1+r)ⁿ = a(1+r){(1+r)ⁿ − 1} / r

export type PeriodUnit = "month" | "year";
export const UNIT: Record<PeriodUnit, { rate: string; period: string; every: string }> = {
  month: { rate: "월이율", period: "개월", every: "매월" },
  year: { rate: "연이율", period: "년", every: "매년" },
};

/** 제k회 납입금의 만기 금액 a(1+r)^(n−k+1) */
export function depositValue(a: number, r: number, n: number, k: number): number {
  return a * Math.pow(1 + r, n - k + 1);
}
/** k기간 말의 잔액 (기수불 적립) */
export function balanceAt(a: number, r: number, k: number): number {
  if (k <= 0) return 0;
  if (r === 0) return a * k;
  return (a * (1 + r) * (Math.pow(1 + r, k) - 1)) / r;
}
/** 만기 원리합계 */
export function maturity(a: number, r: number, n: number): number {
  return balanceAt(a, r, n);
}
/** 총 납입액 */
export function totalPaid(a: number, n: number): number {
  return a * n;
}

export type Preset = { label: string; a: number; ratePct: number; unit: PeriodUnit; n: number; note: string };
export const PRESETS: Preset[] = [
  { label: "🧒 용돈 적금", a: 100_000, ratePct: 0.3, unit: "month", n: 12, note: "매월 초 10만원씩 · 월이율 0.3% · 12개월" },
  { label: "🎓 등록금 모으기", a: 200_000, ratePct: 0.4, unit: "month", n: 36, note: "매월 초 20만원씩 · 월이율 0.4% · 36개월" },
  { label: "🚗 3년 목돈", a: 300_000, ratePct: 0.5, unit: "month", n: 36, note: "매월 초 30만원씩 · 월이율 0.5% · 36개월" },
  { label: "🏠 연 단위 적립", a: 1_000_000, ratePct: 4, unit: "year", n: 10, note: "매년 초 100만원씩 · 연이율 4% · 10년" },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 단계별 문제
// ══════════════════════════════════════════════════════════════
export type Step =
  | { kind: "number"; id: string; ask: string; hint: string; answer: number; suffix: string; explain: string; tol?: number }
  | { kind: "choice"; id: string; ask: string; hint: string; options: string[]; answer: number; explain: string };

export type Problem = {
  id: string;
  emoji: string;
  title: string;
  scenario: string;
  /** 다이어그램·계산에 쓰는 조건 */
  setup: { a: number; ratePct: number; unit: PeriodUnit; n: number };
  given: { label: string; value: string }[];
  steps: Step[];
  wrapUp: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "p1",
    emoji: "🐷",
    title: "문제 1 · 매월 초 20만 원씩 2년",
    scenario:
      "매월 초에 20만 원씩 적립하는 만기 2년의 정기 적금에 가입하였다. 월이율 0.5%의 복리로 매월 이자를 계산할 때, 2년 후에 받게 될 정기 적금의 원리합계를 구하시오. (단, 1.005²⁴ = 1.127로 계산한다.)",
    setup: { a: 200_000, ratePct: 0.5, unit: "month", n: 24 },
    given: [
      { label: "매월 적립액 a", value: "200,000원" },
      { label: "월이율 r", value: "0.5% (= 0.005)" },
      { label: "기간 n", value: "24개월" },
      { label: "주어진 값", value: "1.005²⁴ = 1.127" },
    ],
    steps: [
      {
        kind: "number", id: "p1s1",
        ask: "가장 먼저 넣은 제1회 20만 원은 만기에 얼마가 되어 있을까요?",
        hint: "24개월 내내 이자가 붙어요 → 200,000 × 1.005²⁴ = 200,000 × 1.127",
        answer: 225400, suffix: "원",
        explain: "a(1+r)ⁿ = 200,000 × 1.127 = 225,400원. 제1회 납입금이 가장 오래 이자를 받아요.",
      },
      {
        kind: "number", id: "p1s2",
        ask: "마지막에 넣은 제24회 20만 원은 만기에 얼마가 되어 있을까요?",
        hint: "마지막 달 초에 넣으면 딱 1개월치 이자만 붙어요 → 200,000 × 1.005",
        answer: 201000, suffix: "원",
        explain: "a(1+r) = 200,000 × 1.005 = 201,000원. 늦게 넣은 돈일수록 이자가 적어요.",
      },
      {
        kind: "number", id: "p1s3",
        ask: "이제 24회 전부를 더해 봅시다. 만기 원리합계 S는 얼마일까요?",
        hint: "S = a(1+r){(1+r)ⁿ − 1} ÷ r = 200,000 × 1.005 × (1.127 − 1) ÷ 0.005",
        answer: 5105400, suffix: "원",
        explain:
          "0.127 ÷ 0.005 = 25.4, × 1.005 = 25.527, × 200,000 = 5,105,400원. 첫째항 a(1+r), 공비 (1+r)인 등비수열의 합이에요.",
      },
      {
        kind: "number", id: "p1s4",
        ask: "그렇다면 이자는 모두 얼마를 받은 걸까요?",
        hint: "원리합계 − 총 납입액. 총 납입액은 200,000 × 24 = 4,800,000원",
        answer: 305400, suffix: "원",
        explain: "5,105,400 − 4,800,000 = 305,400원. 총 납입액의 약 6.4%예요.",
      },
    ],
    wrapUp:
      "정기 적금은 넣는 시점이 다르므로 각 납입금이 이자를 받는 기간도 다릅니다. 그래서 등비수열의 합으로 한 번에 계산해요.",
  },
  {
    id: "p2",
    emoji: "🏠",
    title: "문제 2 · 매년 초 100만 원씩 5년",
    scenario:
      "매년 초에 100만 원씩 적립하는 만기 5년의 정기 적금에 가입하였다. 연이율 4%의 복리로 매년 이자를 계산할 때, 5년 후에 받게 될 원리합계를 구하시오. (단, 1.04⁵ = 1.217로 계산한다.)",
    setup: { a: 1_000_000, ratePct: 4, unit: "year", n: 5 },
    given: [
      { label: "매년 적립액 a", value: "1,000,000원" },
      { label: "연이율 r", value: "4% (= 0.04)" },
      { label: "기간 n", value: "5년" },
      { label: "주어진 값", value: "1.04⁵ = 1.217" },
    ],
    steps: [
      {
        kind: "number", id: "p2s1",
        ask: "제1회 100만 원은 만기에 얼마가 되어 있을까요?",
        hint: "1,000,000 × 1.04⁵ = 1,000,000 × 1.217",
        answer: 1217000, suffix: "원",
        explain: "a(1+r)ⁿ = 1,217,000원.",
      },
      {
        kind: "number", id: "p2s2",
        ask: "만기 원리합계 S는 얼마일까요?",
        hint: "S = 1,000,000 × 1.04 × (1.217 − 1) ÷ 0.04",
        answer: 5642000, suffix: "원",
        explain: "0.217 ÷ 0.04 = 5.425, × 1.04 = 5.642, × 1,000,000 = 5,642,000원.",
      },
      {
        kind: "number", id: "p2s3",
        ask: "5년 동안 받은 이자는 모두 얼마일까요?",
        hint: "5,642,000 − (1,000,000 × 5)",
        answer: 642000, suffix: "원",
        explain: "5,642,000 − 5,000,000 = 642,000원.",
      },
    ],
    wrapUp:
      "공식은 월·연 어느 단위든 똑같아요. 이율과 기간의 단위만 맞춰 주면 됩니다(월이율에는 개월 수, 연이율에는 햇수).",
  },
  {
    id: "p3",
    emoji: "⚖️",
    title: "문제 3 · 적금과 예금, 어느 쪽 이자가 많을까?",
    scenario:
      "지민이는 매월 초 10만 원씩 36개월 동안 월이율 0.4%(연 4.8%)의 정기 적금에 넣기로 했다. 반면 이미 360만 원을 가진 서준이는 그 돈을 3년 만기 연이율 4.8%의 정기 예금에 한 번에 맡겼다. 두 사람이 3년 뒤 받는 이자를 비교해 보자. (단, 1.004³⁶ = 1.155, 1.048³ = 1.151로 계산한다.)",
    setup: { a: 100_000, ratePct: 0.4, unit: "month", n: 36 },
    given: [
      { label: "지민 · 적금", value: "매월 초 100,000원 × 36개월, 월이율 0.4%" },
      { label: "서준 · 예금", value: "3,600,000원 한 번에, 연이율 4.8%" },
      { label: "주어진 값", value: "1.004³⁶ = 1.155, 1.048³ = 1.151" },
    ],
    steps: [
      {
        kind: "number", id: "p3s1",
        ask: "지민이의 적금 원리합계는 얼마일까요?",
        hint: "100,000 × 1.004 × (1.155 − 1) ÷ 0.004",
        answer: 3890500, suffix: "원",
        explain: "0.155 ÷ 0.004 = 38.75, × 1.004 = 38.905, × 100,000 = 3,890,500원.",
      },
      {
        kind: "number", id: "p3s2",
        ask: "지민이가 받은 이자는 얼마일까요? (총 납입액은 3,600,000원)",
        hint: "3,890,500 − 3,600,000",
        answer: 290500, suffix: "원",
        explain: "290,500원이에요.",
      },
      {
        kind: "number", id: "p3s3",
        ask: "서준이의 예금 원리합계는 얼마일까요?",
        hint: "3,600,000 × 1.048³ = 3,600,000 × 1.151",
        answer: 4143600, suffix: "원",
        explain: "3,600,000 × 1.151 = 4,143,600원.",
      },
      {
        kind: "number", id: "p3s4",
        ask: "서준이가 받은 이자는 얼마일까요?",
        hint: "4,143,600 − 3,600,000",
        answer: 543600, suffix: "원",
        explain: "543,600원. 지민이(290,500원)보다 253,100원이나 많아요!",
      },
      {
        kind: "choice", id: "p3s5",
        ask: "총 납입액도 3,600,000원으로 같고 이율도 연 4.8%로 같은데, 왜 적금 이자가 더 적을까요?",
        hint: "각 납입금이 ‘이자를 받은 기간’이 얼마나 되는지 위 그림을 보세요.",
        options: [
          "적금은 나중에 넣은 돈일수록 이자가 붙는 기간이 짧아서",
          "적금은 이율을 절반만 쳐주기 때문에",
          "적금에는 세금이 두 배로 붙어서",
        ],
        answer: 0,
        explain:
          "예금은 3,600,000원 전액이 3년 내내 이자를 받지만, 적금은 마지막 달에 넣은 10만 원은 한 달치 이자만 받아요. 평균 예치 기간이 절반 정도라 이자도 대략 절반 수준이 됩니다.",
      },
    ],
    wrapUp:
      "‘적금 금리가 예금 금리보다 높다’고 광고해도, 실제 받는 이자는 적금 쪽이 적을 수 있어요. 목돈이 있으면 예금, 목돈을 만들어 가는 중이면 적금이 알맞습니다.",
  },
  {
    id: "p4",
    emoji: "🎯",
    title: "문제 4 · 목표 금액을 거꾸로 구하기",
    scenario:
      "은우는 2년 뒤 여행 자금 255만 2,700원을 모으고 싶다. 월이율 0.5%의 복리로 매월 초에 일정 금액을 적립한다면 매월 얼마씩 넣어야 할까? (단, 1.005²⁴ = 1.127로 계산한다.)",
    setup: { a: 100_000, ratePct: 0.5, unit: "month", n: 24 },
    given: [
      { label: "목표 금액 S", value: "2,552,700원" },
      { label: "월이율 r", value: "0.5% (= 0.005)" },
      { label: "기간 n", value: "24개월" },
      { label: "주어진 값", value: "1.005²⁴ = 1.127" },
    ],
    steps: [
      {
        kind: "number", id: "p4s1",
        ask: "먼저 ‘매월 초 1만 원씩’ 넣는다면 24개월 뒤 원리합계는 얼마일까요?",
        hint: "10,000 × 1.005 × (1.127 − 1) ÷ 0.005 = 10,000 × 25.527",
        answer: 255270, suffix: "원",
        explain: "10,000 × 25.527 = 255,270원. 즉 매월 1만 원마다 만기에 255,270원이 돼요.",
      },
      {
        kind: "number", id: "p4s2",
        ask: "그렇다면 2,552,700원을 모으려면 매월 초에 얼마씩 넣어야 할까요?",
        hint: "2,552,700 ÷ 255,270 = 10 → 1만 원의 10배",
        answer: 100000, suffix: "원",
        explain: "적립액과 원리합계는 정비례해요. 1만 원의 10배인 10만 원씩 넣으면 됩니다.",
      },
      {
        kind: "number", id: "p4s3",
        ask: "그때 24개월 동안 실제로 넣는 돈(총 납입액)은 얼마일까요?",
        hint: "100,000 × 24",
        answer: 2400000, suffix: "원",
        explain: "2,400,000원. 이자로 152,700원을 더 받는 셈이에요.",
      },
    ],
    wrapUp:
      "S = a × [(1+r){(1+r)ⁿ − 1} ÷ r] 에서 대괄호 부분은 a와 상관없는 상수예요. 그래서 ‘1원(또는 1만 원)씩 넣으면 얼마가 되는지’를 먼저 구하면 목표 금액에 맞는 적립액을 바로 나눗셈으로 구할 수 있어요.",
  },
];

export const DATA_NOTE =
  "정기 적금은 일정 기간 동안 매 기간마다 일정 금액을 적립해 약정 기간 후에 적립 총액과 이자를 받는 금융상품입니다. 매 기간 초에 a원씩 이율 r의 복리로 n기간 적립하면 제k회 납입금은 (n−k+1)기간 동안 이자가 붙어 a(1+r)^(n−k+1)이 되고, 이를 모두 더한 만기 원리합계는 첫째항 a(1+r)·공비 (1+r)·항수 n인 등비수열의 합 S = a(1+r){(1+r)ⁿ − 1}/r 입니다(기수불 기준). 시뮬레이터는 이 식을 그대로 계산하며, 문제에 주어진 1.005²⁴ = 1.127, 1.04⁵ = 1.217, 1.004³⁶ = 1.155, 1.048³ = 1.151은 문제에서 정한 어림값이라 정확한 값과 아주 조금 다를 수 있습니다. 실제 은행 적금은 단리로 계산하는 상품이 많고 이자소득세 15.4%가 붙지만, 여기서는 교과서와 같이 복리로 계산하며 세금은 넣지 않았습니다.";
