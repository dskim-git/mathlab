// 단리의 원리합계 — 활동 데이터
// 단리: 최초 원금에 대해서만 이자를 계산한다. 원금 A, 이율 r, 기간 n 일 때 원리합계 S = A(1 + rn).
// 원리합계는 첫째항 A+rA, 공차 rA 인 등차수열이다.

export type PeriodUnit = "month" | "year";

export const UNIT_LABEL: Record<PeriodUnit, { rate: string; period: string; short: string }> = {
  month: { rate: "월이율", period: "개월", short: "달" },
  year: { rate: "연이율", period: "년", short: "해" },
};

/** k기간 뒤 누적 이자 (단리) */
export function interestAt(a: number, r: number, k: number): number {
  return a * r * k;
}
/** k기간 뒤 원리합계 S = A(1 + rk) */
export function balanceAt(a: number, r: number, k: number): number {
  return a * (1 + r * k);
}
/** 복리 비교용 — k기간 뒤 원리합계 A(1+r)^k */
export function compoundAt(a: number, r: number, k: number): number {
  return a * Math.pow(1 + r, k);
}

export type Preset = { label: string; a: number; ratePct: number; unit: PeriodUnit; n: number; note: string };
export const PRESETS: Preset[] = [
  { label: "🏦 정기예금", a: 2_000_000, ratePct: 3.5, unit: "year", n: 5, note: "200만원을 연 3.5% 단리로 5년" },
  { label: "🎓 학자금대출", a: 4_000_000, ratePct: 1.7, unit: "year", n: 8, note: "400만원을 연 1.7% 단리로 8년" },
  { label: "🈷️ 월이율 적금", a: 1_000_000, ratePct: 0.3, unit: "month", n: 24, note: "100만원을 월 0.3% 단리로 24개월" },
  { label: "💳 대출", a: 3_000_000, ratePct: 6, unit: "year", n: 3, note: "300만원을 연 6% 단리로 3년" },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 단리 미션 — 단계별 실생활 사례
// ══════════════════════════════════════════════════════════════
export type Step =
  | {
      kind: "number";
      id: string;
      ask: string;
      hint: string;
      answer: number;
      suffix: string; // 입력 뒤에 붙는 단위
      explain: string;
    }
  | {
      kind: "choice";
      id: string;
      ask: string;
      hint: string;
      options: string[];
      answer: number;
      explain: string;
    };

export type Mission = {
  id: string;
  emoji: string;
  title: string;
  badge: string;
  scenario: string;
  given: { label: string; value: string }[];
  steps: Step[];
  wrapUp: string;
  source?: string;
};

export const MISSIONS: Mission[] = [
  {
    id: "deposit",
    emoji: "🏦",
    title: "미션 1 · 정기예금",
    badge: "예금왕",
    scenario:
      "세뱃돈을 모은 200만원을 은행에 맡기려고 해요. 은행이 ‘연이율 3.5% 단리, 만기 일시 지급’ 상품을 권했어요. 단리는 최초 원금에 대해서만 이자를 계산해요.",
    given: [
      { label: "원금 A", value: "2,000,000원" },
      { label: "이율 r", value: "연 3.5% (= 0.035)" },
      { label: "기간 n", value: "2년" },
    ],
    steps: [
      {
        kind: "number", id: "d1",
        ask: "1년 동안 붙는 이자는 얼마일까요?",
        hint: "이자 = 원금 × 이율 = 2,000,000 × 0.035",
        answer: 70000, suffix: "원",
        explain: "2,000,000 × 0.035 = 70,000원. 단리에서는 해마다 이 금액이 똑같이 붙어요(rA).",
      },
      {
        kind: "number", id: "d2",
        ask: "2년 동안 붙는 이자를 모두 더하면 얼마일까요?",
        hint: "단리는 매년 똑같은 이자가 붙어요. 70,000 × 2",
        answer: 140000, suffix: "원",
        explain: "70,000 × 2 = 140,000원. 이자 = A·r·n = 2,000,000 × 0.035 × 2 예요.",
      },
      {
        kind: "number", id: "d3",
        ask: "2년 뒤 받는 원리합계는 얼마일까요?",
        hint: "원리합계 = 원금 + 이자 = A(1 + rn)",
        answer: 2140000, suffix: "원",
        explain: "2,000,000 × (1 + 0.035 × 2) = 2,000,000 × 1.07 = 2,140,000원.",
      },
      {
        kind: "choice", id: "d4",
        ask: "기간을 3년으로 늘리면 원리합계는 얼마가 될까요?",
        hint: "이자가 한 해치(70,000원) 더 붙어요.",
        options: ["2,210,000원", "2,280,000원", "2,214,500원"],
        answer: 0,
        explain: "2,000,000 × (1 + 0.035 × 3) = 2,210,000원. 복리라면 2,217,445원이지만, 단리는 붙은 이자에 다시 이자가 붙지 않아요.",
      },
    ],
    wrapUp:
      "단리의 원리합계는 해마다 rA씩 똑같이 늘어나요. 그래서 2,070,000 → 2,140,000 → 2,210,000 … 처럼 첫째항 A+rA, 공차 rA인 등차수열이 돼요.",
    source: "만기 일시 지급식 정기예금은 단리로 계산하는 것이 일반적이에요.",
  },
  {
    id: "loan",
    emoji: "💳",
    title: "미션 2 · 대출 이자",
    badge: "이자 계산왕",
    scenario:
      "가게를 여는 데 300만원이 필요해 연이율 6% 단리로 빌렸어요. 그런데 1년을 다 채우지 않고 8개월 만에 갚으려고 해요. 기간이 1년이 아니면 어떻게 계산할까요?",
    given: [
      { label: "원금 A", value: "3,000,000원" },
      { label: "이율 r", value: "연 6% (= 0.06)" },
      { label: "기간 n", value: "8개월 (= 8/12년)" },
    ],
    steps: [
      {
        kind: "number", id: "l1",
        ask: "1년을 꽉 채워 빌렸다면 이자는 얼마일까요?",
        hint: "3,000,000 × 0.06",
        answer: 180000, suffix: "원",
        explain: "3,000,000 × 0.06 = 180,000원이 1년치 이자예요.",
      },
      {
        kind: "number", id: "l2",
        ask: "8개월만 빌렸다면 이자는 얼마일까요?",
        hint: "1년치 이자 × (8 ÷ 12). 단리는 기간에 정비례해요.",
        answer: 120000, suffix: "원",
        explain: "180,000 × 8/12 = 120,000원. 이자 = A·r·n 에서 n = 8/12 을 넣은 것과 같아요.",
      },
      {
        kind: "number", id: "l3",
        ask: "8개월 뒤 갚아야 할 돈은 모두 얼마일까요?",
        hint: "원금 + 이자",
        answer: 3120000, suffix: "원",
        explain: "3,000,000 + 120,000 = 3,120,000원 = 3,000,000 × (1 + 0.06 × 8/12).",
      },
      {
        kind: "choice", id: "l4",
        ask: "‘연이율 6%’를 ‘월이율’로 바꾸면 몇 %일까요? (단리 기준)",
        hint: "1년은 12개월이니 12로 나눠요.",
        options: ["월 0.5%", "월 6%", "월 0.6%"],
        answer: 0,
        explain: "6 ÷ 12 = 0.5%. 월이율 0.5%로 8개월이면 3,000,000 × 0.005 × 8 = 120,000원으로 결과가 같아요.",
      },
    ],
    wrapUp:
      "단리에서는 이자가 기간에 정비례해요. 그래서 개월 수만큼만 이자를 내면 되고, 이율의 기간 단위(연↔월)도 나누고 곱해서 바꿀 수 있어요.",
  },
  {
    id: "student",
    emoji: "🎓",
    title: "미션 3 · 학자금 대출",
    badge: "슬기로운 대출",
    scenario:
      "대학 등록금 400만원을 한국장학재단 학자금대출로 빌렸어요. 금리는 연 1.7% 단리로 4년 동안 유지된다고 해요. 만약 같은 돈을 일반 신용대출(연 6%)로 빌렸다면 얼마나 차이 날까요?",
    given: [
      { label: "원금 A", value: "4,000,000원" },
      { label: "이율 r", value: "연 1.7% (= 0.017)" },
      { label: "기간 n", value: "4년" },
    ],
    steps: [
      {
        kind: "number", id: "s1",
        ask: "학자금대출의 1년치 이자는 얼마일까요?",
        hint: "4,000,000 × 0.017",
        answer: 68000, suffix: "원",
        explain: "4,000,000 × 0.017 = 68,000원.",
      },
      {
        kind: "number", id: "s2",
        ask: "4년 동안 내는 이자는 모두 얼마일까요?",
        hint: "68,000 × 4",
        answer: 272000, suffix: "원",
        explain: "4,000,000 × 0.017 × 4 = 272,000원.",
      },
      {
        kind: "number", id: "s3",
        ask: "같은 400만원을 연 6% 단리 신용대출로 4년 빌렸다면 이자는 얼마일까요?",
        hint: "4,000,000 × 0.06 × 4",
        answer: 960000, suffix: "원",
        explain: "4,000,000 × 0.06 × 4 = 960,000원.",
      },
      {
        kind: "number", id: "s4",
        ask: "두 이자의 차이는 얼마일까요?",
        hint: "960,000 − 272,000",
        answer: 688000, suffix: "원",
        explain: "688,000원! 같은 돈을 같은 기간 빌려도 이율에 따라 이자가 3배 넘게 차이 나요.",
      },
    ],
    wrapUp:
      "학자금대출은 학생을 돕기 위해 나라가 이율을 아주 낮게 정해 둔 대출이에요. 이율이 낮을수록 같은 기간에 내는 이자가 그만큼 적어져요.",
    source: "한국장학재단 학자금대출 금리는 2022년 2학기부터 연 1.7%로 유지되고 있어요(단리).",
  },
  {
    id: "compare",
    emoji: "⚖️",
    title: "미션 4 · 어느 은행이 유리할까?",
    badge: "현명한 선택",
    scenario:
      "학자금 500만원을 3년 동안 빌리려고 두 은행을 알아봤어요. 새싹은행은 ‘월이율 0.3%(단리)’, 구름은행은 ‘연이율 3%(단리)’라고 적어 두었어요. 숫자만 보면 0.3%가 훨씬 작아 보이는데, 정말 그럴까요?",
    given: [
      { label: "빌릴 돈", value: "5,000,000원" },
      { label: "🌱 새싹은행", value: "월이율 0.3% (단리)" },
      { label: "☁️ 구름은행", value: "연이율 3% (단리)" },
      { label: "기간", value: "3년" },
    ],
    steps: [
      {
        kind: "choice", id: "c1",
        ask: "먼저 기간 단위를 맞춰 볼까요? 새싹은행의 월이율 0.3%는 연이율로 몇 %일까요? (단리)",
        hint: "1년은 12개월이에요. 0.3 × 12",
        options: ["연 3.6%", "연 3%", "연 0.36%"],
        answer: 0,
        explain: "0.3 × 12 = 3.6%. 월이율은 작아 보여도 12번 붙기 때문에 연이율로 바꿔야 제대로 비교할 수 있어요.",
      },
      {
        kind: "number", id: "c2",
        ask: "새싹은행에서 3년 동안 내는 이자는 얼마일까요?",
        hint: "5,000,000 × 0.036 × 3 (또는 5,000,000 × 0.003 × 36개월)",
        answer: 540000, suffix: "원",
        explain: "5,000,000 × 0.036 × 3 = 540,000원. 월로 계산해도 5,000,000 × 0.003 × 36 = 540,000원으로 같아요.",
      },
      {
        kind: "number", id: "c3",
        ask: "구름은행에서 3년 동안 내는 이자는 얼마일까요?",
        hint: "5,000,000 × 0.03 × 3",
        answer: 450000, suffix: "원",
        explain: "5,000,000 × 0.03 × 3 = 450,000원.",
      },
      {
        kind: "choice", id: "c4",
        ask: "그렇다면 어느 은행에서 빌리는 것이 유리할까요?",
        hint: "이자를 적게 내는 쪽이 유리해요.",
        options: ["☁️ 구름은행 (9만원 적게 냄)", "🌱 새싹은행 (9만원 적게 냄)", "두 곳이 똑같다"],
        answer: 0,
        explain: "540,000 − 450,000 = 90,000원. 구름은행이 9만원 적게 내요. ‘0.3%’라는 작은 숫자에 속으면 안 돼요!",
      },
    ],
    wrapUp:
      "이율을 비교할 때는 반드시 기간 단위를 똑같이 맞춰야 해요. 월이율 0.3%는 연이율 3.6%이므로, 연이율 3%인 구름은행이 더 낮은 이율이에요. 광고에 적힌 숫자만 보지 말고 단위를 확인하는 습관을 들이세요.",
  },
];

export const DATA_NOTE =
  "단리는 최초 원금에 대해서만 이자를 계산하는 방법으로, 원금 A·이율 r·기간 n일 때 이자는 A·r·n, 원리합계는 S = A(1 + rn)이고, 시점별 원리합계는 첫째항 A+rA, 공차 rA인 등차수열을 이룹니다. 미션에 쓰인 학자금대출 연 1.7%는 한국장학재단이 2022년 2학기부터 유지하고 있는 실제 금리이며, 만기 일시 지급식 정기예금과 학자금대출은 단리로 계산합니다. 정기예금·대출 금리 예시는 계산 연습을 위한 값으로, 실제 금리는 은행연합회 소비자포털에서 확인할 수 있습니다. 세금(이자소득세 15.4%)은 계산에 넣지 않았습니다.";
