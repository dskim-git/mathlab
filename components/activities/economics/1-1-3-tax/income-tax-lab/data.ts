// 소득세(직접세) 계산 — 활동 데이터
// 세율·누진공제액: 국세청 종합소득세 기본세율(2023년 귀속 기준, 8구간).
// 근로소득공제: 소득세법 제47조(2023 기준). 금액 단위는 '원'.

export const DATA_NOTE =
  "세율표: 국세청 종합소득세 기본세율(2023년 귀속, 8구간). 근로소득공제·공제 항목: 소득세법 기준(단순화). 직업별 평균 연봉은 고용노동부·워크넷 한국직업정보(KNOW) 등 공신력 통계의 개략치(세전).";

export const MAN = 10000; // 1만 원

// ─── 종합소득세 기본세율표 (과세표준 구간, 세율, 누진공제액) ─────────
export type Bracket = { upTo: number; rate: number; deduct: number };
export const BRACKETS: Bracket[] = [
  { upTo: 14_000_000, rate: 0.06, deduct: 0 },
  { upTo: 50_000_000, rate: 0.15, deduct: 1_260_000 },
  { upTo: 88_000_000, rate: 0.24, deduct: 5_760_000 },
  { upTo: 150_000_000, rate: 0.35, deduct: 15_440_000 },
  { upTo: 300_000_000, rate: 0.38, deduct: 19_940_000 },
  { upTo: 500_000_000, rate: 0.40, deduct: 25_940_000 },
  { upTo: 1_000_000_000, rate: 0.42, deduct: 35_940_000 },
  { upTo: Infinity, rate: 0.45, deduct: 65_940_000 },
];

/** 과세표준이 속한 구간 index */
export function bracketIndex(base: number): number {
  for (let i = 0; i < BRACKETS.length; i++) if (base <= BRACKETS[i].upTo) return i;
  return BRACKETS.length - 1;
}

/** 방법 A — 구간별 누진세율을 각각 적용해 합산 */
export function taxByBracket(base: number): number {
  if (base <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const b of BRACKETS) {
    const hi = Math.min(base, b.upTo);
    if (hi > prev) tax += (hi - prev) * b.rate;
    if (base <= b.upTo) break;
    prev = b.upTo;
  }
  return Math.round(tax);
}

/** 방법 B — 과세표준 × 해당 구간 세율 − 누진공제액 */
export function taxByDeduction(base: number): number {
  if (base <= 0) return 0;
  const b = BRACKETS[bracketIndex(base)];
  return Math.round(base * b.rate - b.deduct);
}

/** 각 구간 하한(구간이 시작되는 과세표준) */
export function bracketLow(i: number): number {
  return i === 0 ? 0 : BRACKETS[i - 1].upTo;
}

// ─── 근로소득공제 (소득세법 제47조, 총급여 기준, 한도 2,000만 원) ─────
export function earnedIncomeDeduction(salary: number): number {
  let d: number;
  if (salary <= 5_000_000) d = salary * 0.7;
  else if (salary <= 15_000_000) d = 3_500_000 + (salary - 5_000_000) * 0.4;
  else if (salary <= 45_000_000) d = 7_500_000 + (salary - 15_000_000) * 0.15;
  else if (salary <= 100_000_000) d = 12_000_000 + (salary - 45_000_000) * 0.05;
  else d = 14_750_000 + (salary - 100_000_000) * 0.02;
  return Math.round(Math.min(d, 20_000_000));
}

/** 세금(산출세액)으로부터 과세표준을 역산 (소득세 함수의 역함수) */
export function baseFromTax(tax: number): number {
  if (tax <= 0) return 0;
  // 각 구간에서 tax = base*rate - deduct  →  base = (tax + deduct)/rate
  for (let i = 0; i < BRACKETS.length; i++) {
    const b = BRACKETS[i];
    const base = (tax + b.deduct) / b.rate;
    if (base <= b.upTo + 1) return Math.round(base);
  }
  const b = BRACKETS[BRACKETS.length - 1];
  return Math.round((tax + b.deduct) / b.rate);
}

// ─── 직업별 평균 연봉(세전, 개략치) ─────────────────────────────
// 출처: 고용노동부 고용형태별근로실태조사 / 워크넷 한국직업정보(KNOW) / 통계청 등
// 공신력 통계의 직종별 평균을 반올림한 개략치(2023 기준). 개인·경력·지역에 따라 편차가 큼.
export type Job = { id: string; emoji: string; name: string; salary: number };
export const JOBS: Job[] = [
  { id: "parttime", emoji: "🧋", name: "아르바이트(최저임금)", salary: 24_720_000 },
  { id: "sales", emoji: "🛍️", name: "판매원", salary: 30_000_000 },
  { id: "cook", emoji: "🍳", name: "요리사", salary: 33_000_000 },
  { id: "technician", emoji: "🔧", name: "생산·기술직", salary: 40_000_000 },
  { id: "nurse", emoji: "🩺", name: "간호사", salary: 45_000_000 },
  { id: "teacher", emoji: "🧑‍🏫", name: "초·중등 교사", salary: 47_000_000 },
  { id: "police", emoji: "👮", name: "경찰관", salary: 55_000_000 },
  { id: "developer", emoji: "💻", name: "소프트웨어 개발자", salary: 58_000_000 },
  { id: "office", emoji: "🏢", name: "대기업 사무직", salary: 65_000_000 },
  { id: "lawyer", emoji: "⚖️", name: "변호사", salary: 90_000_000 },
  { id: "pilot", emoji: "✈️", name: "항공기 조종사", salary: 110_000_000 },
  { id: "doctor", emoji: "👨‍⚕️", name: "의사(전문의)", salary: 150_000_000 },
];

// ─── 과세표준 계산 (총급여 − 공제들) · 탭①/④ 공용 ────────────────
export type Deductions = { dependents: number; pension: boolean; card: number };
export function taxableBase(salary: number, d: Deductions): {
  earned: number; personal: number; pension: number; card: number; base: number;
} {
  const earned = earnedIncomeDeduction(salary);
  const personal = 1_500_000 * (1 + Math.max(0, d.dependents)); // 본인 150만 + 부양가족 1인당 150만
  const pension = d.pension ? Math.round(salary * 0.045) : 0; // 국민연금 근로자 부담 4.5%
  const card = Math.max(0, d.card || 0);
  const base = Math.max(0, salary - earned - personal - pension - card);
  return { earned, personal, pension, card, base };
}
