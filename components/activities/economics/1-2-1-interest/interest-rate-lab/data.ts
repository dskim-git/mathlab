// 여러 가지 이율 — 활동 데이터
// 1년 = 365일 = 8,760시간 = 525,600분 = 31,536,000초 로 환산한다.
// 사례 이율의 출처는 각 항목의 source 에 표기. 시장금리는 수시로 바뀌므로 기준 시점을 함께 적는다.

// ══════════════════════════════════════════════════════════════
// 탭 ① 이율 변환기
// ══════════════════════════════════════════════════════════════
export type UnitKey = "year" | "half" | "quarter" | "month" | "week" | "day" | "hour" | "minute" | "second";

export type RateUnit = {
  key: UnitKey;
  emoji: string;
  label: string; // 연이율, 월이율 …
  per: string; // 1년에 몇 번인지 설명
  perYear: number; // 1년에 들어가는 기간의 수
};

export const UNITS: RateUnit[] = [
  { key: "year", emoji: "🗓️", label: "연이율", per: "1년에 1번", perYear: 1 },
  { key: "half", emoji: "🌗", label: "반기이율", per: "1년에 2번(6개월마다)", perYear: 2 },
  { key: "quarter", emoji: "📆", label: "분기이율", per: "1년에 4번(3개월마다)", perYear: 4 },
  { key: "month", emoji: "🈷️", label: "월이율", per: "1년에 12번", perYear: 12 },
  { key: "week", emoji: "🗒️", label: "주이율", per: "1년에 약 52.14번", perYear: 365 / 7 },
  { key: "day", emoji: "☀️", label: "일이율", per: "1년에 365번", perYear: 365 },
  { key: "hour", emoji: "⏰", label: "시간이율", per: "1년에 8,760번", perYear: 8760 },
  { key: "minute", emoji: "⏱️", label: "분이율", per: "1년에 525,600번", perYear: 525600 },
  { key: "second", emoji: "⚡", label: "초이율", per: "1년에 31,536,000번", perYear: 31536000 },
];

export function unitOf(key: UnitKey): RateUnit {
  return UNITS.find((u) => u.key === key)!;
}

/** 단리(비례) 환산 — 기준 단위 이율 v 를 목표 단위 이율로 */
export function simpleConvert(v: number, from: RateUnit, to: RateUnit): number {
  return (v * from.perYear) / to.perYear;
}

/** 복리(실효) 환산 — (1+i_to)^(k_to) = (1+v)^(k_from) */
export function compoundConvert(v: number, from: RateUnit, to: RateUnit): number {
  return Math.pow(1 + v, from.perYear / to.perYear) - 1;
}

/** 기준 이율에서 연 명목이율(단리 기준) */
export function nominalAnnual(v: number, from: RateUnit): number {
  return v * from.perYear;
}

/** 기준 이율에서 연 실효이율(복리 기준) */
export function effectiveAnnual(v: number, from: RateUnit): number {
  return Math.pow(1 + v, from.perYear) - 1;
}

/** 명목 연이율 r 을 1년에 n번 복리로 계산했을 때의 1년 성장 배수 */
export function growth(r: number, n: number): number {
  return Math.pow(1 + r / n, n);
}

/** 복리 횟수 비교표에 쓰는 항목 */
export type SplitRow = { key: string; label: string; n: number | null };
export const SPLIT_ROWS: SplitRow[] = [
  { key: "year", label: "1년마다 (연 1회)", n: 1 },
  { key: "half", label: "6개월마다 (연 2회)", n: 2 },
  { key: "quarter", label: "3개월마다 (연 4회)", n: 4 },
  { key: "month", label: "1개월마다 (연 12회)", n: 12 },
  { key: "week", label: "1주마다 (연 52.14회)", n: 365 / 7 },
  { key: "day", label: "하루마다 (연 365회)", n: 365 },
  { key: "hour", label: "1시간마다 (연 8,760회)", n: 8760 },
  { key: "minute", label: "1분마다 (연 525,600회)", n: 525600 },
  { key: "second", label: "1초마다 (연 31,536,000회)", n: 31536000 },
  { key: "cont", label: "쉬지 않고 (연속복리)", n: null },
];

export type Preset = { label: string; unit: UnitKey; value: number; hint: string };
export const PRESETS: Preset[] = [
  { label: "연 3% (정기예금)", unit: "year", value: 0.03, hint: "은행에 1년 맡길 때" },
  { label: "연 20% (법정 최고금리)", unit: "year", value: 0.2, hint: "법으로 정한 최고 이자율" },
  { label: "월 1%", unit: "month", value: 0.01, hint: "한 달에 1%면 1년에는?" },
  { label: "일 0.1% (불법 ‘일수’)", unit: "day", value: 0.001, hint: "하루 0.1%가 1년이면?" },
  { label: "연 100%", unit: "year", value: 1, hint: "쪼갤수록 e에 가까워져요" },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 우리 주변의 이율
// ══════════════════════════════════════════════════════════════
export type CaseGroup = "모으기(저축)" | "빌리기(대출)" | "나라·연금" | "물가";

export type RateCase = {
  id: string;
  emoji: string;
  name: string;
  group: CaseGroup;
  rate: number; // 대표 연이율(%)
  range?: [number, number]; // 흔히 볼 수 있는 범위(%)
  fixed: boolean; // 법·제도로 정해져 잘 바뀌지 않는 값인지
  desc: string;
  detail: string;
  source: string;
};

export const CASES: RateCase[] = [
  // ── 모으기(저축) ──
  {
    id: "checking", emoji: "🐷", name: "수시입출금 통장", group: "모으기(저축)",
    rate: 0.1, range: [0.1, 0.2], fixed: false,
    desc: "언제든 넣고 뺄 수 있는 대신 이자가 거의 없어요.",
    detail: "100만원을 1년 넣어 두어도 이자가 1,000원 남짓이에요. 편리함의 대가로 이자를 거의 포기하는 셈이에요.",
    source: "은행 보통예금 공시금리(수시 변동)",
  },
  {
    id: "parking", emoji: "🅿️", name: "파킹통장", group: "모으기(저축)",
    rate: 2.5, range: [2.0, 3.0], fixed: false,
    desc: "수시입출금인데 이자를 더 주는 통장이에요.",
    detail: "인터넷은행·저축은행이 고객을 모으려고 내놓은 상품으로, 한도(예: 5천만원까지)나 조건이 붙는 경우가 많아요.",
    source: "은행연합회 소비자포털 공시(2025년 기준·수시 변동)",
  },
  {
    id: "deposit", emoji: "🏦", name: "정기예금 (1년)", group: "모으기(저축)",
    rate: 2.8, range: [2.5, 3.2], fixed: false,
    desc: "목돈을 1년 동안 맡기고 약속한 이자를 받아요.",
    detail: "한국은행 기준금리가 오르내리면 예금 금리도 따라 움직여요. 만기 전에 깨면(중도해지) 약속한 이자를 거의 못 받아요.",
    source: "은행연합회 소비자포털 정기예금 공시(2025년 기준·수시 변동)",
  },
  {
    id: "saving", emoji: "📅", name: "정기적금 (1년)", group: "모으기(저축)",
    rate: 3.2, range: [3.0, 3.8], fixed: false,
    desc: "매달 조금씩 넣어 만기에 목돈을 받아요.",
    detail: "적금 금리는 예금보다 높아 보이지만, 첫 달 돈만 12개월, 마지막 달 돈은 1개월만 이자가 붙어서 실제 이자는 표시 금리의 절반 정도예요.",
    source: "은행연합회 소비자포털 정기적금 공시(2025년 기준·수시 변동)",
  },
  {
    id: "housing", emoji: "🏠", name: "주택청약종합저축", group: "모으기(저축)",
    rate: 3.1, range: [2.0, 3.1], fixed: true,
    desc: "집을 분양받을 자격을 얻으면서 이자도 받아요.",
    detail: "가입 기간에 따라 이율이 달라요(1년 미만 2.0% → 2년 이상 3.1%). 2024년 9월에 정부가 2.8%에서 3.1%로 올렸어요.",
    source: "국토교통부 고시(2024.9 인상)",
  },
  {
    id: "youth", emoji: "🧒", name: "청년도약계좌", group: "모으기(저축)",
    rate: 5.0, range: [4.5, 6.0], fixed: false,
    desc: "청년이 5년간 모으면 정부가 돈을 보태 주는 적금이에요.",
    detail: "은행 이자에 더해 소득에 따라 정부기여금이 붙고, 이자에 세금도 붙지 않아(비과세) 실제 효과는 표시된 이율보다 커요.",
    source: "서민금융진흥원 청년도약계좌 안내(2025년 기준)",
  },

  // ── 빌리기(대출) ──
  {
    id: "student", emoji: "🎓", name: "학자금대출", group: "빌리기(대출)",
    rate: 1.7, fixed: true,
    desc: "대학 등록금을 빌려주는 나라의 대출이에요.",
    detail: "한국장학재단이 2022년 2학기부터 연 1.7% 고정으로 유지하고 있어요. 학생을 돕기 위한 대출이라 시중 금리보다 훨씬 낮아요.",
    source: "한국장학재단 학자금대출 금리(2022-2학기 이후 1.7% 동결)",
  },
  {
    id: "mortgage", emoji: "🏡", name: "주택담보대출", group: "빌리기(대출)",
    rate: 4.0, range: [3.5, 5.0], fixed: false,
    desc: "집을 담보로 맡기고 큰돈을 오래 빌려요.",
    detail: "집이라는 확실한 담보가 있어서 이자가 낮은 편이에요. 금액이 크고 기간이 길어(20~30년) 이자 총액은 아주 커져요.",
    source: "한국은행 예금은행 가중평균 대출금리(2025년 기준·수시 변동)",
  },
  {
    id: "credit", emoji: "💳", name: "신용대출·마이너스통장", group: "빌리기(대출)",
    rate: 5.5, range: [4.0, 7.0], fixed: false,
    desc: "담보 없이 신용만 보고 빌려주는 대출이에요.",
    detail: "담보가 없으니 주택담보대출보다 이자가 높아요. 갚을 능력(신용점수)에 따라 사람마다 금리가 크게 달라져요.",
    source: "한국은행 예금은행 가중평균 대출금리(2025년 기준·수시 변동)",
  },
  {
    id: "installment", emoji: "🧾", name: "카드 할부 수수료", group: "빌리기(대출)",
    rate: 15.0, range: [10.0, 19.9], fixed: false,
    desc: "‘무이자 할부’가 아니면 이자를 내는 거예요.",
    detail: "할부 수수료는 남은 금액에만 붙기 때문에 실제로 내는 돈은 표시 이율 그대로는 아니지만, 연 10~19.9%는 예금 이자의 대여섯 배예요.",
    source: "여신금융협회 카드사 할부수수료율 공시",
  },
  {
    id: "cashadv", emoji: "💵", name: "카드 현금서비스", group: "빌리기(대출)",
    rate: 17.5, range: [15.0, 19.9], fixed: false,
    desc: "카드로 현금을 빌리는 것 — 이자가 아주 높아요.",
    detail: "간편하지만 법정 최고금리(20%)에 가까운 이자가 붙어요. 급할수록 이자가 비싸진다는 것을 보여주는 사례예요.",
    source: "여신금융협회 카드사 단기카드대출 금리 공시",
  },
  {
    id: "revolving", emoji: "🔁", name: "리볼빙", group: "빌리기(대출)",
    rate: 16.5, range: [14.0, 19.9], fixed: false,
    desc: "이번 달 카드값 일부만 내고 나머지를 미루는 것이에요.",
    detail: "‘최소결제’처럼 보이지만 미룬 금액에 높은 이자가 계속 붙어요. 미룬 돈이 눈덩이처럼 불어나기 쉬워요.",
    source: "여신금융협회 일부결제금액이월약정(리볼빙) 수수료율 공시",
  },
  {
    id: "legalmax", emoji: "⚖️", name: "법정 최고금리", group: "빌리기(대출)",
    rate: 20.0, fixed: true,
    desc: "누구도 이보다 높은 이자를 받을 수 없어요.",
    detail: "이자제한법·대부업법에 따라 2021년 7월부터 연 20%가 상한이에요. 이를 넘는 이자 약속은 법적으로 무효라 갚지 않아도 돼요.",
    source: "이자제한법·대부업법 시행령(2021.7.7 시행)",
  },
  {
    id: "overdue", emoji: "⏰", name: "연체이자", group: "빌리기(대출)",
    rate: 8.5, range: [7.0, 20.0], fixed: true,
    desc: "제때 갚지 못하면 원래 금리에 더 붙어요.",
    detail: "은행 여신거래기본약관에 따라 ‘약정금리 + 3%p 이내, 최고 연 20% 이내’로 매겨요. 예를 들어 5.5% 대출을 연체하면 8.5%가 돼요.",
    source: "은행 여신거래기본약관(2018.11 지연배상금률 개편)",
  },
  {
    id: "illegal", emoji: "🚫", name: "불법 사금융 ‘일수’", group: "빌리기(대출)",
    rate: 36.5, fixed: true,
    desc: "하루 0.1%씩 — 1년이면 36.5%예요.",
    detail: "하루에 0.1%라니 작아 보이지만 365배 하면 연 36.5%로, 법정 최고금리 20%를 훌쩍 넘는 불법이에요. 짧은 단위의 이율에 속지 않으려면 탭①처럼 연이율로 바꿔 봐야 해요.",
    source: "하루 0.1% × 365일 = 연 36.5% (법정 최고금리 초과 → 무효)",
  },

  // ── 나라·연금 ──
  {
    id: "basert", emoji: "🏛️", name: "한국은행 기준금리", group: "나라·연금",
    rate: 2.5, range: [0.5, 5.25], fixed: false,
    desc: "모든 금리의 출발점이 되는 ‘기준’ 금리예요.",
    detail: "한국은행 금융통화위원회가 정해요. 역대 최고는 2008년 5.25%, 사상 최저는 코로나 때인 2020년 0.50%였어요. 이 금리가 오르면 예금·대출 금리도 함께 움직여요.",
    source: "한국은행 기준금리(현재 값은 한국은행 누리집에서 확인)",
  },
  {
    id: "bond", emoji: "📜", name: "국고채 3년 금리", group: "나라·연금",
    rate: 2.6, range: [1.0, 4.5], fixed: false,
    desc: "나라가 돈을 빌릴 때 주는 이자예요.",
    detail: "나라가 부도날 걱정이 가장 적으니 금리가 낮아요. 대출·예금 금리를 정할 때 기준으로 삼는 대표적인 시장금리예요.",
    source: "한국은행 경제통계시스템 국고채(3년) 수익률(수시 변동)",
  },
  {
    id: "pension", emoji: "👵", name: "국민연금 기금 수익률", group: "나라·연금",
    rate: 6.0, fixed: false,
    desc: "우리가 낸 연금 보험료를 굴려서 얻은 수익률이에요.",
    detail: "1988년부터 쌓아 온 기금의 연평균 수익률이 6%대예요. 해마다 크게 오르내려서(2022년 −8.2%, 2024년 15.0%) 평균으로 봐야 해요.",
    source: "국민연금공단 기금운용 성과(1988~2024 연평균)",
  },

  // ── 물가 ──
  {
    id: "cpi", emoji: "🛒", name: "소비자물가 상승률", group: "물가",
    rate: 2.3, range: [0.5, 5.1], fixed: false,
    desc: "물건값이 1년에 얼마나 올랐는지예요.",
    detail: "이자율과 짝을 이루는 아주 중요한 비율이에요. 예금 이자가 2.8%인데 물가가 2.3% 오르면, 실제로 부자가 된 정도(실질금리)는 약 0.5%뿐이에요.",
    source: "통계청 소비자물가지수(2024년 연간 2.3%)",
  },
];

export const CASE_GROUPS: CaseGroup[] = ["모으기(저축)", "빌리기(대출)", "나라·연금", "물가"];

export const GROUP_TONE: Record<CaseGroup, { color: string; badge: string }> = {
  "모으기(저축)": { color: "#38bdf8", badge: "border-sky-400/50 bg-sky-400/[0.10] text-sky-100" },
  "빌리기(대출)": { color: "#fb7185", badge: "border-rose-400/50 bg-rose-400/[0.10] text-rose-100" },
  "나라·연금": { color: "#34d399", badge: "border-emerald-400/50 bg-emerald-400/[0.10] text-emerald-100" },
  물가: { color: "#fbbf24", badge: "border-amber-400/50 bg-amber-400/[0.10] text-amber-100" },
};

export const INTEREST_TAX = 0.154; // 이자소득세 14% + 지방소득세 1.4%

/** 단리 이자 */
export function simpleInterest(p: number, ratePct: number, years: number): number {
  return p * (ratePct / 100) * years;
}
/** 복리 이자(연 1회) */
export function compoundInterest(p: number, ratePct: number, years: number): number {
  return p * (Math.pow(1 + ratePct / 100, years) - 1);
}
/** 72의 법칙 — 원금이 2배가 되는 데 걸리는 대략의 햇수 */
export function ruleOf72(ratePct: number): number {
  return ratePct > 0 ? 72 / ratePct : Infinity;
}
/** 정기적금(매월 같은 금액 납입, 단리) 만기 이자 — 월 납입액 m, 연이율 r%, 12개월 */
export function savingsInterest(m: number, ratePct: number, months = 12): number {
  const r = ratePct / 100;
  return (m * r * (months * (months + 1))) / 2 / 12;
}

export const DATA_NOTE =
  "이율 환산은 1년 = 365일 = 8,760시간 = 525,600분 = 31,536,000초를 기준으로 계산합니다. 단리(비례) 환산은 이율을 기간 수에 비례해 나누고, 복리(실효) 환산은 (1+단위이율)^(1년의 기간 수)이 같아지도록 계산합니다. 사례 이율 중 법정 최고금리 연 20%(이자제한법·대부업법, 2021.7 시행), 학자금대출 연 1.7%(한국장학재단, 2022-2학기부터 동결), 주택청약종합저축 연 2.0~3.1%(국토교통부, 2024.9 인상), 연체이자 ‘약정금리+3%p·최고 20%’(은행 여신거래기본약관), 이자소득세 15.4%(소득세 14%+지방소득세 1.4%)는 법·제도로 정해진 값이고, 예금·대출·기준금리 등 시장금리는 수시로 바뀌므로 2025년 기준의 대표값·범위로 표시했습니다. 실제 금리는 은행연합회 소비자포털·여신금융협회 공시, 한국은행 경제통계시스템에서 확인할 수 있습니다.";
