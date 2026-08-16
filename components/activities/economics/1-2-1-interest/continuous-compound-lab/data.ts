// 연속복리 — 활동 데이터
//
//  원금 A를 연이율 r로 n년, 연 m회 복리로 이자를 계산할 때
//    S_m = A(1 + r/m)^(mn)
//  m을 한없이 크게 하면  lim (1 + r/m)^(m/r) = e = 2.718281…  이므로
//    S = A·e^(rn)   ← 연속복리
//
//  1년 = 365일 = 8,760시간 = 525,600분 = 31,536,000초 로 환산한다.

export type Cycle = { key: string; emoji: string; label: string; short: string; m: number };

export const CYCLES: Cycle[] = [
  { key: "year", emoji: "🗓️", label: "1년마다", short: "연", m: 1 },
  { key: "half", emoji: "🌗", label: "6개월마다", short: "반기", m: 2 },
  { key: "quarter", emoji: "📆", label: "3개월마다", short: "분기", m: 4 },
  { key: "month", emoji: "🈷️", label: "1개월마다", short: "월", m: 12 },
  { key: "week", emoji: "🗒️", label: "1주마다", short: "주", m: 365 / 7 },
  { key: "day", emoji: "☀️", label: "하루마다", short: "일", m: 365 },
  { key: "hour", emoji: "⏰", label: "1시간마다", short: "시간", m: 8760 },
  { key: "minute", emoji: "⏱️", label: "1분마다", short: "분", m: 525600 },
  { key: "second", emoji: "⚡", label: "1초마다", short: "초", m: 31536000 },
];

export const CONT_LABEL = { emoji: "♾️", label: "쉬지 않고 (연속복리)", short: "연속" };

/** 연 m회 복리 원리합계 S_m = A(1 + r/m)^(mn) — 아주 큰 m 에서도 정확하도록 log1p 사용 */
export function compoundM(a: number, r: number, m: number, n: number): number {
  if (!Number.isFinite(m)) return continuous(a, r, n);
  return a * Math.exp(m * n * Math.log1p(r / m));
}
/** 연속복리 S = A·e^(rn) */
export function continuous(a: number, r: number, n: number): number {
  return a * Math.exp(r * n);
}
/** 단리 S = A(1 + rn) */
export function simple(a: number, r: number, n: number): number {
  return a * (1 + r * n);
}
/** 실효 연이율 — 연 m회 복리를 1년 기준으로 환산 */
export function effectiveAnnual(r: number, m: number): number {
  if (!Number.isFinite(m)) return Math.exp(r) - 1;
  return Math.exp(m * Math.log1p(r / m)) - 1;
}
/** 연속복리에서 원금이 k배가 되는 기간 n = ln k / r */
export function contMultiplyTime(r: number, k: number): number {
  return r > 0 ? Math.log(k) / r : Infinity;
}

export type Preset = { label: string; a: number; ratePct: number; years: number; note: string };
export const PRESETS: Preset[] = [
  { label: "📖 교과서 예시", a: 1_000_000, ratePct: 10, years: 1, note: "100만원 · 연 10% · 1년 (교과서 계산과 같은 값)" },
  { label: "📈 12% 30년", a: 1_000_000, ratePct: 12, years: 30, note: "100만원 · 연 12% · 30년 (단리·복리·연속복리 비교 예시)" },
  { label: "🏦 정기예금", a: 3_000_000, ratePct: 5, years: 4, note: "300만원 · 연 5% · 4년" },
  { label: "🚀 고금리 장기", a: 1_000_000, ratePct: 20, years: 20, note: "차이가 크게 벌어지는 조건" },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 도전 문제
// ══════════════════════════════════════════════════════════════
export type Quest = {
  id: string;
  emoji: string;
  title: string;
  scenario: string;
  given: { label: string; value: string }[];
  steps: {
    id: string;
    ask: string;
    hint: string;
    answer: number;
    suffix: string;
    explain: string;
  }[];
  wrapUp: string;
};

export const QUESTS: Quest[] = [
  {
    id: "q1",
    emoji: "🏦",
    title: "문제 1 · 연속복리로 4년",
    scenario:
      "원금 300만 원을 연이율 5%의 연속복리로 계산하였을 때, 4년 후의 원리합계를 구하시오. (단, e^0.2은 1.22로 계산한다.)",
    given: [
      { label: "원금 A", value: "3,000,000원" },
      { label: "연이율 r", value: "5% (= 0.05)" },
      { label: "기간 n", value: "4년" },
      { label: "주어진 값", value: "e^0.2 = 1.22" },
    ],
    steps: [
      {
        id: "q1s1",
        ask: "먼저 지수 rn을 구해 보세요. r × n은 얼마인가요?",
        hint: "0.05 × 4",
        answer: 0.2, suffix: "",
        explain: "0.05 × 4 = 0.2. 그래서 S = 300만 × e^0.2 이 됩니다.",
      },
      {
        id: "q1s2",
        ask: "4년 후의 원리합계는 얼마일까요? (원 단위)",
        hint: "3,000,000 × 1.22",
        answer: 3660000, suffix: "원",
        explain: "S = 3,000,000 × e^0.2 = 3,000,000 × 1.22 = 3,660,000원 (366만 원).",
      },
    ],
    wrapUp: "연속복리는 S = A·e^(rn) 하나로 끝나요. 지수 rn만 구하면 되니 계산이 오히려 간단하죠.",
  },
  {
    id: "q2",
    emoji: "⚖️",
    title: "문제 2 · 세 가지 방식 비교",
    scenario:
      "원금 1,000만 원을 연이율 5%로 10년 동안 다음 방식으로 계산할 때 원리합계를 구하시오. (단, 복리는 매년 이자를 계산하며 1.05^10 = 1.63, e^0.5 = 1.65로 계산한다.)",
    given: [
      { label: "원금 A", value: "10,000,000원" },
      { label: "연이율 r", value: "5% (= 0.05)" },
      { label: "기간 n", value: "10년" },
      { label: "주어진 값", value: "1.05^10 = 1.63, e^0.5 = 1.65" },
    ],
    steps: [
      {
        id: "q2s1",
        ask: "(1) 단리로 계산한 원리합계는? (원 단위)",
        hint: "A(1 + rn) = 10,000,000 × (1 + 0.05 × 10)",
        answer: 15000000, suffix: "원",
        explain: "10,000,000 × (1 + 0.5) = 15,000,000원 (1,500만 원).",
      },
      {
        id: "q2s2",
        ask: "(2) 복리(매년)로 계산한 원리합계는? (원 단위)",
        hint: "A(1 + r)^n = 10,000,000 × 1.63",
        answer: 16300000, suffix: "원",
        explain: "10,000,000 × 1.05^10 = 10,000,000 × 1.63 = 16,300,000원 (1,630만 원).",
      },
      {
        id: "q2s3",
        ask: "(3) 연속복리로 계산한 원리합계는? (원 단위)",
        hint: "A·e^(rn) = 10,000,000 × e^0.5 = 10,000,000 × 1.65",
        answer: 16500000, suffix: "원",
        explain: "10,000,000 × e^0.5 = 10,000,000 × 1.65 = 16,500,000원 (1,650만 원).",
      },
      {
        id: "q2s4",
        ask: "연속복리는 단리보다 얼마나 더 받나요? (원 단위)",
        hint: "16,500,000 − 15,000,000",
        answer: 1500000, suffix: "원",
        explain: "150만 원을 더 받아요. 단리 < 복리 < 연속복리 순서는 언제나 변하지 않아요.",
      },
    ],
    wrapUp:
      "같은 원금·같은 이율·같은 기간이어도 이자를 계산하는 방식에 따라 결과가 달라져요. 단리 1,500만 < 복리 1,630만 < 연속복리 1,650만.",
  },
  {
    id: "q3",
    emoji: "🔢",
    title: "문제 3 · 교과서 표 확인하기",
    scenario:
      "원금 100만 원을 연이율 10%로 1년 동안 연 m회 복리로 계산합니다. m을 키우면 원리합계가 어떻게 변하는지 직접 구해 보세요. (만원 단위, 소수 둘째 자리까지)",
    given: [
      { label: "원금 A", value: "100만원" },
      { label: "연이율 r", value: "10% (= 0.1)" },
      { label: "기간 n", value: "1년" },
    ],
    steps: [
      {
        id: "q3s1",
        ask: "m = 1 (연 단위)일 때 원리합계는 몇 만원일까요?",
        hint: "100 × (1 + 0.1)",
        answer: 110, suffix: "만원",
        explain: "100 × 1.1 = 110만원.",
      },
      {
        id: "q3s2",
        ask: "m = 4 (분기 단위)일 때는 몇 만원일까요? (소수 둘째 자리까지)",
        hint: "100 × (1 + 0.1/4)^4 = 100 × 1.025^4",
        answer: 110.38, suffix: "만원",
        explain: "100 × 1.025⁴ ≈ 110.38만원. 주기를 쪼갰더니 0.38만원이 늘었어요.",
      },
      {
        id: "q3s3",
        ask: "m = 12 (월 단위)일 때는 몇 만원일까요? (소수 둘째 자리까지)",
        hint: "100 × (1 + 0.1/12)^12",
        answer: 110.47, suffix: "만원",
        explain: "100 × 1.008333…¹² ≈ 110.47만원.",
      },
      {
        id: "q3s4",
        ask: "m을 한없이 크게 하면(연속복리) 몇 만원에 가까워질까요? (소수 둘째 자리까지)",
        hint: "100 × e^0.1, e^0.1 ≈ 1.10517",
        answer: 110.52, suffix: "만원",
        explain: "100 × e^0.1 ≈ 110.52만원. m = 365(일)에서 이미 110.52로, 더 쪼개도 거의 늘지 않아요.",
      },
    ],
    wrapUp:
      "주기를 잘게 쪼갤수록 원리합계는 커지지만 끝없이 커지지 않고 A·e^(rn)에 수렴해요. 이것이 연속복리예요.",
  },
  {
    id: "q4",
    emoji: "⏳",
    title: "문제 4 · 연속복리로 두 배가 되는 시간",
    scenario:
      "연속복리에서는 A·e^(rn) = 2A 를 풀어 원금이 두 배가 되는 시간을 정확히 구할 수 있어요. e^(rn) = 2 이므로 rn = ln 2 = 0.693이 됩니다. (단, ln 2 = 0.693으로 계산한다.)",
    given: [
      { label: "관계식", value: "e^(rn) = 2 → n = ln2 ÷ r" },
      { label: "주어진 값", value: "ln 2 = 0.693" },
    ],
    steps: [
      {
        id: "q4s1",
        ask: "연이율 8%의 연속복리라면 원금이 두 배가 되는 데 몇 년이 걸릴까요? (소수 둘째 자리까지)",
        hint: "0.693 ÷ 0.08",
        answer: 8.66, suffix: "년",
        explain: "0.693 ÷ 0.08 = 8.66년. 72의 법칙으로 어림한 9년보다 조금 짧아요(연속복리가 더 빠르니까요).",
      },
      {
        id: "q4s2",
        ask: "연이율 10%의 연속복리라면 몇 년일까요? (소수 둘째 자리까지)",
        hint: "0.693 ÷ 0.1",
        answer: 6.93, suffix: "년",
        explain: "0.693 ÷ 0.1 = 6.93년. 72의 법칙으로는 7.2년이니 꽤 가깝죠.",
      },
    ],
    wrapUp:
      "연속복리에서는 두 배가 되는 시간이 n = ln2 ÷ r = 0.693 ÷ r 로 딱 떨어져요. ‘72의 법칙’은 이 값(69.3의 법칙)을 나누기 쉬운 72로 바꾼 어림법이랍니다.",
  },
];

export const DATA_NOTE =
  "연 m회 복리의 원리합계는 S_m = A(1 + r/m)^(mn)이고, m을 한없이 크게 하면 lim(1 + r/m)^(m/r) = e = 2.718281…이므로 S = A·e^(rn)에 수렴합니다. 이때의 복리를 연속복리라 합니다. 1년 = 365일 = 8,760시간 = 525,600분 = 31,536,000초로 환산했고, 아주 큰 m에서도 오차가 생기지 않도록 log1p를 이용해 계산했습니다. 교과서 계산값(연 10%·100만원·1년: 연 110, 분기 110.38, 월 110.47, 일 110.52, 시간 110.52만원)과 같은 값이 나오는지 확인할 수 있습니다. 도전 문제의 e^0.2 = 1.22, 1.05^10 = 1.63, e^0.5 = 1.65, ln2 = 0.693은 문제에서 주어진 어림값입니다. 세금(이자소득세 15.4%)은 계산에 넣지 않았습니다.";
