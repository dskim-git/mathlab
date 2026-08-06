// 법인세(직접세) 계산 — 활동 데이터
// 세율·누진공제액: 우리나라 법인세율(2024년 기준). 금액 단위는 '원'.
// 기업 법인세비용: DART(전자공시) — 영리법인 5곳은 연결 손익계산서(사업보고서),
//   조합법인(한살림사업연합)은 별도 손익계산서(감사보고서). 모두 검산(세전−법인세=순이익) 확인.

export const DATA_NOTE =
  "법인세율: 국세청 법인세율표(2024년). 기업 법인세비용: DART 전자공시 — 영리법인은 연결 손익계산서(사업보고서), 조합법인(한살림)은 별도 손익계산서(감사보고서). 음수는 이연법인세·결손 등에 따른 법인세 환입.";

export const EOK = 100_000_000; // 1억 원

// ─── 법인세율표 ────────────────────────────────────────────────
export type CorpBracket = { upTo: number; rate: number; deduct: number };
export type CorpKind = "일반" | "조합";

// 영리법인·비영리법인 (일반) — 과세표준 2억 / 200억 / 3,000억 경계
export const BRACKETS_GENERAL: CorpBracket[] = [
  { upTo: 2 * EOK, rate: 0.09, deduct: 0 },                          // 2억 이하
  { upTo: 200 * EOK, rate: 0.19, deduct: 2_000 * 10_000 },           // 2억~200억, 누진공제 2,000만
  { upTo: 3_000 * EOK, rate: 0.21, deduct: 42_000 * 10_000 },        // 200억~3,000억, 누진공제 4억 2,000만
  { upTo: Infinity, rate: 0.24, deduct: 942_000 * 10_000 },          // 3,000억 초과, 누진공제 94억 2,000만
];

// 조합법인 (농협·생협 등) — 과세표준 20억 경계
export const BRACKETS_COOP: CorpBracket[] = [
  { upTo: 20 * EOK, rate: 0.09, deduct: 0 },                         // 20억 이하
  { upTo: Infinity, rate: 0.12, deduct: 6_000 * 10_000 },            // 20억 초과, 누진공제 6,000만
];

export function brackets(kind: CorpKind): CorpBracket[] {
  return kind === "조합" ? BRACKETS_COOP : BRACKETS_GENERAL;
}

export function corpBracketIndex(base: number, kind: CorpKind): number {
  const bs = brackets(kind);
  for (let i = 0; i < bs.length; i++) if (base <= bs[i].upTo) return i;
  return bs.length - 1;
}

/** 방법 A — 구간별 누진세율 합산 */
export function corpTaxByBracket(base: number, kind: CorpKind): number {
  if (base <= 0) return 0;
  const bs = brackets(kind);
  let tax = 0, prev = 0;
  for (const b of bs) {
    const hi = Math.min(base, b.upTo);
    if (hi > prev) tax += (hi - prev) * b.rate;
    if (base <= b.upTo) break;
    prev = b.upTo;
  }
  return Math.round(tax);
}

/** 방법 B — 과세표준 × 세율 − 누진공제액 */
export function corpTaxByDeduction(base: number, kind: CorpKind): number {
  if (base <= 0) return 0;
  const b = brackets(kind)[corpBracketIndex(base, kind)];
  return Math.round(base * b.rate - b.deduct);
}

// ─── 실제 기업 법인세비용 5개년 (DART) ──────────────────────────
export const YEARS = [2021, 2022, 2023, 2024, 2025] as const;
export type Company = {
  id: string; name: string; emoji: string; kind: CorpKind; sector: string;
  fs: string; // 재무제표 구분(연결/별도)
  tax: Record<number, number>; // 원 단위, 음수=환입
};

// 영리법인 — 연결 손익계산서 '법인세비용'(사업보고서)
// 조합법인 — 별도 손익계산서 '법인세비용'(감사보고서)
export const COMPANIES: Company[] = [
  { id: "samsung", name: "삼성전자", emoji: "📱", kind: "일반", sector: "반도체·전자", fs: "연결",
    tax: { 2021: 13_444_377_000_000, 2022: -9_213_603_000_000, 2023: -4_480_835_000_000, 2024: 3_078_383_000_000, 2025: 4_274_666_000_000 } },
  { id: "skhynix", name: "SK하이닉스", emoji: "💾", kind: "일반", sector: "반도체", fs: "연결",
    tax: { 2021: 3_799_799_000_000, 2022: 1_761_111_000_000, 2023: -2_520_269_000_000, 2024: 4_088_448_000_000, 2025: 7_517_650_000_000 } },
  { id: "hyundai", name: "현대자동차", emoji: "🚗", kind: "일반", sector: "자동차", fs: "연결",
    tax: { 2021: 2_266_485_000_000, 2022: 2_964_329_000_000, 2023: 4_626_640_000_000, 2024: 4_232_418_000_000, 2025: 3_477_128_000_000 } },
  { id: "naver", name: "NAVER", emoji: "🟢", kind: "일반", sector: "인터넷·IT", fs: "연결",
    tax: { 2021: 648_668_889_581, 2022: 410_536_791_065, 2023: 496_378_555_058, 2024: 390_208_118_495, 2025: 601_396_983_055 } },
  { id: "kakao", name: "카카오", emoji: "💬", kind: "일반", sector: "인터넷·IT", fs: "연결",
    tax: { 2021: 646_176_899_199, 2022: 201_905_981_231, 2023: 168_428_765_288, 2024: 159_055_770_545, 2025: 94_701_402_519 } },
  { id: "hansalim", name: "한살림사업연합", emoji: "🥬", kind: "조합", sector: "소비자생활협동조합", fs: "별도",
    tax: { 2021: 101_389_358, 2022: 207_437_261, 2023: -3_986_323, 2024: 20_717_806, 2025: -2_123_992 } },
];
