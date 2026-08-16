// 맨해튼의 24달러와 72의 법칙 — 활동 데이터
//
// 역사 자료
//  · 1626년 네덜란드 서인도회사(West-Indische Compagnie)의 총독 피터 미누이트(Peter Minuit)가
//    맨해튼 섬을 원주민(레나페족)에게서 60길더 상당의 물품으로 사들였다.
//    유일한 1차 사료는 1626년 11월 5일 피터 스카헨(Pieter Schaghen)이 본국에 보낸 편지다.
//  · 흔히 말하는 '24달러'는 1846년 역사가가 60길더를 당시 환율로 환산해 붙인 값으로,
//    이후 이야기 속에서 굳어진 수치다.
//  · 자주 나오는 오해: '동인도회사'가 아니라 '서인도회사'다(동인도회사는 아시아 담당).
//    또 현금이 아니라 교역 물품으로 치렀고, 레나페족에게는 땅을 사고파는 개념이 달랐다.
//
// 비교 수치(개략치·추정)
//  · 미국 1년 GDP 약 29조 달러, 전 세계 1년 GDP 약 110조 달러 (2024, IMF)
//  · 맨해튼 전체 부동산 가치 약 1.5조 달러(추정), 애플 시가총액 약 3.5조 달러

export const BUY_YEAR = 1626;
export const NOW_YEAR = 2026;
export const YEARS = NOW_YEAR - BUY_YEAR; // 400
export const PRINCIPAL_USD = 24;
export const GUILDERS = 60;

/** 원금 p를 연이율 r(소수)로 y년 복리 */
export function grow(p: number, r: number, y: number): number {
  return p * Math.pow(1 + r, y);
}
/** 원금이 2배가 되는 정확한 기간 */
export function exactDouble(rPct: number): number {
  return rPct > 0 ? Math.log(2) / Math.log(1 + rPct / 100) : Infinity;
}
/** 72의 법칙으로 어림한 기간 */
export function rule72(rPct: number): number {
  return rPct > 0 ? 72 / rPct : Infinity;
}
/** n년 만에 2배가 되려면 필요한 정확한 이율(%) */
export function exactRate(years: number): number {
  return years > 0 ? (Math.pow(2, 1 / years) - 1) * 100 : Infinity;
}

// ─── 달러 금액을 한국식 단위로 ────────────────────────────────
export function fmtUSD(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e16) return (v / 1e16).toFixed(1) + "경 달러";
  if (a >= 1e12) return (v / 1e12).toLocaleString("ko-KR", { maximumFractionDigits: 1 }) + "조 달러";
  if (a >= 1e8) return (v / 1e8).toLocaleString("ko-KR", { maximumFractionDigits: 1 }) + "억 달러";
  if (a >= 1e4) return (v / 1e4).toLocaleString("ko-KR", { maximumFractionDigits: 1 }) + "만 달러";
  if (a >= 100) return Math.round(v).toLocaleString("ko-KR") + " 달러";
  return v.toFixed(2) + " 달러";
}
export function fmtUSDShort(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e16) return (v / 1e16).toFixed(1) + "경";
  if (a >= 1e12) return (v / 1e12).toFixed(1) + "조";
  if (a >= 1e8) return (v / 1e8).toFixed(1) + "억";
  if (a >= 1e4) return (v / 1e4).toFixed(1) + "만";
  return Math.round(v).toLocaleString("ko-KR");
}

// ─── 애니메이션·시뮬레이션에서 쓰는 비교 대상 ─────────────────
export type Bench = { id: string; emoji: string; label: string; usd: number; note: string };
export const BENCHES: Bench[] = [
  { id: "nyc", emoji: "🏙️", label: "뉴욕시 1년 예산", usd: 1.12e11, note: "약 1,120억 달러(2025 회계연도 규모)" },
  { id: "manhattan", emoji: "🏝️", label: "맨해튼 전체 부동산", usd: 1.5e12, note: "약 1조 5천억 달러(추정치)" },
  { id: "apple", emoji: "🍎", label: "애플 시가총액", usd: 3.5e12, note: "약 3조 5천억 달러(2025년 무렵)" },
  { id: "usgdp", emoji: "🇺🇸", label: "미국 1년 GDP", usd: 2.9e13, note: "약 29조 달러(2024, IMF)" },
  { id: "world", emoji: "🌍", label: "전 세계 1년 GDP", usd: 1.1e14, note: "약 110조 달러(2024, IMF)" },
];

/** 애니메이션 마지막에 쓰는 이율별 비교 */
export const RATE_SCENARIOS = [2, 4, 6, 8];

// ══════════════════════════════════════════════════════════════
// 탭 ② 72의 법칙
// ══════════════════════════════════════════════════════════════
/** 교과서 표(55p 생생 경제 탐구) 재현용 — r, n = 72/r, (1 + r/100)^n */
export const RULE_TABLE_RATES = [1, 2, 3, 4, 6, 8, 9, 12];

export type Challenge = {
  id: string;
  emoji: string;
  ask: string;
  hint: string;
  answer: number; // 정답(72의 법칙으로 구한 값)
  suffix: string;
  explain: string;
};

export const CHALLENGES: Challenge[] = [
  {
    id: "c1", emoji: "🏦",
    ask: "연이율 4%의 복리로 예금하면 원금이 두 배가 되는 데 몇 년이 걸릴까요? (72의 법칙)",
    hint: "72 ÷ 4",
    answer: 18, suffix: "년",
    explain: "72 ÷ 4 = 18년. 정확히 계산하면 17.67년이니 어림값이 꽤 잘 맞아요.",
  },
  {
    id: "c2", emoji: "💳",
    ask: "카드 현금서비스 이율이 연 18%예요. 갚지 않고 두면 빚이 두 배가 되는 데 몇 년이 걸릴까요?",
    hint: "72 ÷ 18",
    answer: 4, suffix: "년",
    explain: "72 ÷ 18 = 4년. 정확히는 4.19년이에요. 높은 이율의 빚은 눈 깜짝할 사이에 두 배가 돼요.",
  },
  {
    id: "c3", emoji: "🎯",
    ask: "10년 만에 원금을 두 배로 만들려면 연이율이 몇 %여야 할까요? (72의 법칙)",
    hint: "72 ÷ 10",
    answer: 7.2, suffix: "%",
    explain: "72 ÷ 10 = 7.2%. 정확히 계산한 값은 7.177%로, 어림값이 거의 같아요. (교과서 활동 ②)",
  },
  {
    id: "c4", emoji: "🚀",
    ask: "연이율 6%로 예금하면 원금이 네 배가 되는 데 몇 년이 걸릴까요? (두 배가 두 번!)",
    hint: "두 배가 되는 기간(72 ÷ 6)의 2배",
    answer: 24, suffix: "년",
    explain: "72 ÷ 6 = 12년마다 두 배 → 네 배가 되려면 두 번, 즉 24년. 여덟 배는 36년이에요.",
  },
];

export const DATA_NOTE =
  "역사 자료: 1626년 네덜란드 서인도회사(동인도회사가 아님)의 총독 피터 미누이트가 맨해튼 섬을 레나페족에게서 60길더 상당의 물품으로 사들였고, 1626년 11월 5일 피터 스카헨의 편지가 유일한 1차 사료입니다. 흔히 말하는 ‘24달러’는 1846년에 60길더를 당시 환율로 환산해 붙인 값이며, 대금은 현금이 아니라 교역 물품이었습니다. ‘복리는 인간의 가장 위대한 발명’이라는 말은 아인슈타인의 말로 널리 인용되지만 실제로 그가 말했다는 근거는 확인되지 않았습니다. 금액 계산은 모두 복리식 24×(1+r)^400을 그대로 계산한 값이고, 비교에 쓴 미국 GDP 약 29조 달러·세계 GDP 약 110조 달러(2024, IMF), 맨해튼 부동산 약 1조 5천억 달러(추정), 애플 시가총액 약 3조 5천억 달러는 개략치입니다. 72의 법칙은 어림값으로, 정확한 배가 기간은 log2 / log(1+r)이며 이율이 8% 부근일 때 가장 잘 맞습니다.";
