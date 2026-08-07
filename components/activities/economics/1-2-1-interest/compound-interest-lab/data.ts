// 복리의 원리합계 — 활동 데이터
// 복리: 발생한 이자를 원금에 더해 다음 기간의 이자를 계산한다(이자의 재투자).
//   원금 A, 이율 r, 기간 n 일 때 원리합계 S = A(1+r)^n.
//   시점별 원리합계는 첫째항 A(1+r), 공비 (1+r)인 등비수열이다.
// 단리: S = A(1 + rn). 시점별 원리합계는 첫째항 A+rA, 공차 rA인 등차수열이다.

export type PeriodUnit = "month" | "year";

export const UNIT_LABEL: Record<PeriodUnit, { rate: string; period: string }> = {
  month: { rate: "월이율", period: "개월" },
  year: { rate: "연이율", period: "년" },
};

/** 복리 원리합계 A(1+r)^k */
export function compoundAt(a: number, r: number, k: number): number {
  return a * Math.pow(1 + r, k);
}
/** 단리 원리합계 A(1+rk) */
export function simpleAt(a: number, r: number, k: number): number {
  return a * (1 + r * k);
}
/** 복리에서 k번째 기간에 새로 붙는 이자 = 직전 원리합계 × r */
export function compoundStepInterest(a: number, r: number, k: number): number {
  return k <= 0 ? 0 : compoundAt(a, r, k - 1) * r;
}
/** 원금이 2배가 되는 시점 */
export function doubleTimeCompound(r: number): number {
  return r > 0 ? Math.log(2) / Math.log(1 + r) : Infinity;
}
export function doubleTimeSimple(r: number): number {
  return r > 0 ? 1 / r : Infinity;
}

export type Preset = { label: string; a: number; ratePct: number; unit: PeriodUnit; n: number; note: string };
export const PRESETS: Preset[] = [
  { label: "🏦 정기예금", a: 2_000_000, ratePct: 3.5, unit: "year", n: 10, note: "200만원을 연 3.5% 복리로 10년" },
  { label: "🧒 적금 통장", a: 1_000_000, ratePct: 0.3, unit: "month", n: 36, note: "100만원을 월 0.3% 복리로 36개월" },
  { label: "💳 카드 현금서비스", a: 3_000_000, ratePct: 17.5, unit: "year", n: 5, note: "300만원을 연 17.5% 복리로 5년" },
  { label: "👵 국민연금 기금", a: 5_000_000, ratePct: 6, unit: "year", n: 30, note: "500만원을 연 6% 복리로 30년" },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 이율의 기간 단위를 바꾸면?
// ══════════════════════════════════════════════════════════════
/** 연이율 r 을 1년에 m번 나누어 붙일 때, n년 뒤 복리 원리합계 */
export function compoundSplit(a: number, r: number, m: number, years: number): number {
  return a * Math.pow(1 + r / m, m * years);
}
/** 연이율 r 을 1년에 m번 나누어 붙일 때의 실효 연이율 */
export function effectiveAnnual(r: number, m: number): number {
  return Math.pow(1 + r / m, m) - 1;
}

export type SplitRow = { key: string; label: string; m: number | null };
export const SPLIT_ROWS: SplitRow[] = [
  { key: "year", label: "1년마다 (연 1회)", m: 1 },
  { key: "half", label: "6개월마다 (연 2회)", m: 2 },
  { key: "quarter", label: "3개월마다 (연 4회)", m: 4 },
  { key: "month", label: "1개월마다 (연 12회)", m: 12 },
  { key: "day", label: "하루마다 (연 365회)", m: 365 },
  { key: "cont", label: "쉬지 않고 (연속복리)", m: null },
];

export type Predict = { id: string; ask: string; options: string[]; answer: number; explain: string };
export const PREDICTS: Predict[] = [
  {
    id: "simple",
    ask: "① 단리로 계산할 때, ‘연이율 6%로 3년’과 ‘월이율 0.5%로 36개월’의 원리합계는?",
    options: ["똑같다", "월이율 쪽이 더 크다", "연이율 쪽이 더 크다"],
    answer: 0,
    explain:
      "단리는 이자가 기간에 정비례해요. A(1 + 0.06 × 3) = A(1 + 0.005 × 36) = 1.18A 로 완전히 같아요. 이율을 12로 나눈 만큼 기간을 12배 하니 곱이 그대로예요.",
  },
  {
    id: "compound",
    ask: "② 복리로 계산할 때, ‘연이율 6%로 3년’과 ‘월이율 0.5%로 36개월’의 원리합계는?",
    options: ["월이율 쪽이 더 크다", "똑같다", "연이율 쪽이 더 크다"],
    answer: 0,
    explain:
      "복리는 이자가 붙는 횟수가 중요해요. A(1.06)³ = 1.191016A 지만 A(1.005)³⁶ = 1.196681A 로, 이자를 더 자주 붙이는 월복리 쪽이 큽니다. 붙은 이자가 더 빨리 재투자되기 때문이에요.",
  },
];

export const DATA_NOTE =
  "복리는 발생한 이자를 원금에 더해 다음 기간의 이자를 계산하는 방법으로, 원금 A·이율 r·기간 n일 때 원리합계는 S = A(1+r)^n 이고 시점별 원리합계는 첫째항 A(1+r), 공비 (1+r)인 등비수열입니다(단리는 S = A(1+rn), 공차 rA인 등차수열). 이율의 기간 단위를 바꿀 때 단리는 A(1+rn) = A(1+(r/12)(12n))으로 원리합계가 변하지 않지만, 복리는 A(1+r)^n ≠ A(1+r/12)^(12n)으로 이자를 붙이는 횟수가 많을수록 커지며 (1+r/m)^m은 m을 한없이 크게 할 때 e^r에 수렴합니다. 사례에 쓰인 이율(정기예금 3.5%, 카드 현금서비스 17.5%, 국민연금 기금 장기 연평균 수익률 6%)은 2025년 기준의 대표값이며, 세금(이자소득세 15.4%)은 계산에 넣지 않았습니다.";
