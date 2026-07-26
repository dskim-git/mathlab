// 개별소비세(간접세) 계산 — 활동 데이터
// 세율: 개별소비세법 제1조·시행령(2024년 기준). 금액 단위는 '원'.

export const DATA_NOTE =
  "개별소비세법 제1조·시행령(2024): 승용자동차 5%, 유흥음식 10%, 고급물품은 기준가격 초과분 20%, 담배(궐련) 20개비당 594원, 골프장 12,000원·카지노 50,000원(1인 1회) 등. 자동차 개별소비세 탄력세율 인하는 실제 시행 이력 기준.";

export type ExGroup = "물품" | "장소·유흥" | "석유류";
export type ExKind = "rate" | "threshold" | "flat";

export type ExItem = {
  id: string;
  emoji: string;
  name: string;
  group: ExGroup;
  kind: ExKind;
  rate?: number;        // rate / threshold 방식의 세율
  threshold?: number;   // threshold 방식의 기준가격(초과분 과세)
  unitPrice?: number;   // flat 방식의 단위당 세액
  unit?: string;        // flat 방식의 단위 이름
  inputLabel: string;   // 입력값 설명
  desc: string;         // 한 줄 설명
};

export const ITEMS: ExItem[] = [
  { id: "car", emoji: "🚗", name: "승용자동차", group: "물품", kind: "rate", rate: 0.05,
    inputLabel: "공장도가(과세표준)", desc: "차량의 공장도가(제조장 반출가격·수입가)의 5%." },
  { id: "bar", emoji: "🍸", name: "유흥주점 유흥음식", group: "장소·유흥", kind: "rate", rate: 0.10,
    inputLabel: "유흥음식 요금", desc: "유흥주점 등에서 먹고 마신 요금의 10%." },
  { id: "jewel", emoji: "💍", name: "보석·귀금속", group: "물품", kind: "threshold", rate: 0.20, threshold: 5_000_000,
    inputLabel: "물품 가격", desc: "기준가격 500만원을 넘는 부분의 20%." },
  { id: "watch", emoji: "⌚", name: "고급시계·고급가방", group: "물품", kind: "threshold", rate: 0.20, threshold: 2_000_000,
    inputLabel: "물품 가격", desc: "기준가격 200만원을 넘는 부분의 20%." },
  { id: "fur", emoji: "🧥", name: "고급모피", group: "물품", kind: "threshold", rate: 0.20, threshold: 5_000_000,
    inputLabel: "물품 가격", desc: "기준가격 500만원을 넘는 부분의 20%." },
  { id: "furniture", emoji: "🛋️", name: "고급가구", group: "물품", kind: "threshold", rate: 0.20, threshold: 5_000_000,
    inputLabel: "물품 가격(1개)", desc: "기준가격 1개당 500만원(1조 800만원)을 넘는 부분의 20%." },
  { id: "cigar", emoji: "🚬", name: "담배(궐련)", group: "물품", kind: "flat", unitPrice: 594, unit: "갑(20개비)",
    inputLabel: "담배 갑 수", desc: "궐련 20개비(1갑)당 594원." },
  { id: "golf", emoji: "⛳", name: "골프장 입장", group: "장소·유흥", kind: "flat", unitPrice: 12_000, unit: "1인 1회",
    inputLabel: "입장 횟수(인·회)", desc: "골프장 입장 1인 1회당 12,000원." },
  { id: "casino", emoji: "🎰", name: "카지노 입장(내국인)", group: "장소·유흥", kind: "flat", unitPrice: 50_000, unit: "1인 1회",
    inputLabel: "입장 횟수(인·회)", desc: "카지노 입장 1인 1회당 50,000원(외국인 2,000원)." },
  { id: "race", emoji: "🏇", name: "경마장 입장", group: "장소·유흥", kind: "flat", unitPrice: 1_000, unit: "1인 1회",
    inputLabel: "입장 횟수(인·회)", desc: "경마장 입장 1인 1회당 1,000원(장외 2,000원)." },
  { id: "kerosene", emoji: "🛢️", name: "등유", group: "석유류", kind: "flat", unitPrice: 90, unit: "L",
    inputLabel: "구입량(L)", desc: "등유 1리터당 90원." },
  { id: "butane", emoji: "🔥", name: "부탄", group: "석유류", kind: "flat", unitPrice: 252, unit: "kg",
    inputLabel: "구입량(kg)", desc: "부탄 1킬로그램당 252원." },
];

/** 개별소비세액 계산. x = rate/threshold는 금액(원), flat은 수량. */
export function exciseTax(item: ExItem, x: number): number {
  if (x <= 0) return 0;
  if (item.kind === "rate") return Math.round(x * (item.rate ?? 0));
  if (item.kind === "threshold") return Math.round(Math.max(0, x - (item.threshold ?? 0)) * (item.rate ?? 0));
  return Math.round(x * (item.unitPrice ?? 0)); // flat
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 자동차 개별소비세 인하(탄력세율) — 실제 시행 이력
// ══════════════════════════════════════════════════════════════
export const EDU_RATE = 0.30; // 교육세 = 개별소비세의 30%
export const VAT_RATE = 0.10; // 부가가치세 10%

export type CarRate = { key: string; rate: number; label: string; tone: string };
export const CAR_RATES: CarRate[] = [
  { key: "normal", rate: 0.05, label: "정상 5%", tone: "slate" },
  { key: "cut30", rate: 0.035, label: "3.5% (30% 인하)", tone: "sky" },
  { key: "cut70", rate: 0.015, label: "1.5% (70% 인하)", tone: "emerald" },
];

export type CarPeriod = { term: string; rate: string; reason: string };
export const CAR_PERIODS: CarPeriod[] = [
  { term: "2018.7 ~ 2019.12", rate: "3.5%", reason: "내수 경기 회복(30% 인하)" },
  { term: "2020.3 ~ 2020.6", rate: "1.5%", reason: "코로나 충격 대응(70% 인하, 개소세 인하 100만원 한도)" },
  { term: "2020.7 ~ 2023.6", rate: "3.5%", reason: "소비 진작(30% 인하, 여러 차례 연장)" },
  { term: "2023.7 ~ 현재", rate: "5%", reason: "인하 종료, 정상 세율 복귀" },
];

export type CarStack = { excise: number; edu: number; vat: number; totalTax: number; price: number };
/** 공장도가(base)와 개소세율(rate)로 세금 스택 계산 */
export function carTaxStack(base: number, rate: number): CarStack {
  const excise = Math.round(base * rate);
  const edu = Math.round(excise * EDU_RATE);
  const vat = Math.round((base + excise + edu) * VAT_RATE);
  const totalTax = excise + edu + vat;
  return { excise, edu, vat, totalTax, price: base + totalTax };
}
