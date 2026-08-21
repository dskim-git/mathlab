/**
 * 경제수학 환율 미니활동 3종의 data.ts 스냅샷 재생성.
 *
 * 출처:
 *   Frankfurter (유럽중앙은행 ECB 참조환율, 무료·키 불필요) — 환율 시계열
 *   Yahoo Finance CL=F — WTI 국제유가($/배럴)
 *
 * 주의: Frankfurter 를 base=EUR 로 호출하면 응답 rates 에 기준통화 EUR
 *   자신이 빠져 있다. { EUR: 1, ...rates } 로 채워야 유로가 누락되지 않는다.
 *   (같은 함정으로 app/api/economics/exchange-rate/route.ts 가 한 번 깨졌음)
 *
 * 생성 대상: components/activities/economics/1-1-2-exchange-rate/
 *   exchange-rate-lab/data.ts    AS_OF, LATEST_KRW, SERIES(yearly/monthly/daily)
 *   exchange-impact-lab/data.ts  AS_OF, CURRENT_KRW, RANGE_KRW, MONTHLY, OIL_USD
 *   exchange-smart-lab/data.ts   AS_OF, CURRENT_KRW
 *
 * 값은 모두 '통화 1단위 = ? 원'(KRW per unit, 소수 2자리). JPY 는 화면에서만
 * 100단위로 표시(unit=100)하며 저장값은 1엔 기준이다.
 * CURRENCIES 의 표시명·unit 과 smart-lab 의 spread(은행 환전 수수료율)는
 * 외부 데이터가 아니므로 이 스크립트 안의 상수로 유지한다.
 *
 * 실행: node scripts/fetch/economics_fx.mjs
 */

import { writeFileSync } from "node:fs";

const DIR = new URL("../../components/activities/economics/1-1-2-exchange-rate/", import.meta.url);
const CODES = ["USD", "CNY", "JPY", "EUR", "GBP", "AUD", "CAD", "CHF", "HKD", "SGD"];
const START = "2014-01-01";
const r2 = (v) => Math.round(v * 100) / 100;

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// ── 1. 전체 일별 시계열 ───────────────────────────────────────
const ts = await getJson(`https://api.frankfurter.dev/v1/${START}..?base=EUR&symbols=KRW,${CODES.join(",")}`);
const byDate = new Map(); // date -> { code: KRW per 1 unit }
for (const d of Object.keys(ts.rates).sort()) {
  const raw = { EUR: 1, ...ts.rates[d] }; // base=EUR 은 응답에서 빠지므로 보정
  if (!raw.KRW) continue;
  const row = {};
  for (const c of CODES) if (raw[c]) row[c] = r2(raw.KRW / raw[c]);
  if (Object.keys(row).length === CODES.length) byDate.set(d, row); // 통화 하나라도 결측인 날은 제외
}
const dates = [...byDate.keys()];
if (dates.length < 1000) throw new Error(`시계열이 너무 짧다: ${dates.length}`);
const AS_OF = dates[dates.length - 1];
const LATEST = byDate.get(AS_OF);
console.log(`fetched ${dates.length} obs, ${dates[0]} .. ${AS_OF}`);
console.log("latest:", LATEST);

// ── 2. 기간별 시계열 (각 구간의 마지막 관측일 + 최신일) ────────
function lastOfEach(keyFn) {
  const pick = new Map();
  for (const d of dates) pick.set(keyFn(d), d); // 같은 키의 뒤쪽 날짜가 앞을 덮어씀
  const out = [...pick.values()].filter((d) => d !== AS_OF);
  out.push(AS_OF); // 최신일은 항상 마지막 점으로
  return out;
}
const series = (sel) => ({
  dates: sel,
  rates: Object.fromEntries(CODES.map((c) => [c, sel.map((d) => byDate.get(d)[c])])),
});
const yearlyD = lastOfEach((d) => d.slice(0, 4)).filter((d) => d >= "2014-12-01");
const monthlyD = lastOfEach((d) => d.slice(0, 7)).filter((d) => d >= "2014-12-01");
const dailyD = dates.slice(-180);
const SERIES = { yearly: series(yearlyD), monthly: series(monthlyD), daily: series(dailyD) };
for (const k of ["yearly", "monthly", "daily"])
  console.log(`${k}: n=${SERIES[k].dates.length} ${SERIES[k].dates[0]} .. ${SERIES[k].dates.at(-1)}`);

// ── 3. 유가 (실패해도 나머지는 생성) ──────────────────────────
let OIL = null;
try {
  const y = await getJson("https://query1.finance.yahoo.com/v8/finance/chart/CL=F?range=1d&interval=1d");
  const p = y?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (typeof p === "number") OIL = r2(p);
} catch (e) {
  console.log("oil failed:", e.message);
}
console.log("oil:", OIL);
if (OIL == null) throw new Error("유가 조회 실패 — OIL_USD 를 덮어쓰지 않도록 중단");

// ── 4. 파일 쓰기 ─────────────────────────────────────────────
const J = (v) => JSON.stringify(v);
const write = (p, body) => { writeFileSync(new URL(p, DIR), body, "utf8"); console.log("wrote", p); };
const pick = (codes, src) => Object.fromEntries(codes.map((c) => [c, src[c]]));

// 4-1. exchange-rate-lab
const CUR_RATE = [
  ["USD", "미국 달러", "🇺🇸", 1], ["CNY", "중국 위안", "🇨🇳", 1], ["JPY", "일본 엔", "🇯🇵", 100],
  ["EUR", "유로", "🇪🇺", 1], ["GBP", "영국 파운드", "🇬🇧", 1], ["AUD", "호주 달러", "🇦🇺", 1],
  ["CAD", "캐나다 달러", "🇨🇦", 1], ["CHF", "스위스 프랑", "🇨🇭", 1], ["HKD", "홍콩 달러", "🇭🇰", 1],
  ["SGD", "싱가포르 달러", "🇸🇬", 1],
].map(([code, ko, emoji, unit]) => ({ code, ko, emoji, unit }));
write("exchange-rate-lab/data.ts", `// 환율 미니활동 — Frankfurter(유럽중앙은행 ECB 참조환율) 공식 데이터. 기준일 ${AS_OF}.
// scripts/fetch/economics_fx.mjs 로 생성. 값은 '통화 1단위 = ? 원'(KRW per unit). JPY 는 관례상 100단위로 표시(unit).
export type Currency = { code: string; ko: string; emoji: string; unit: number };
export type Series = { dates: string[]; rates: Record<string, (number | null)[]> };
export const AS_OF = ${J(AS_OF)};
export const CURRENCIES: Currency[] = ${J(CUR_RATE)};
export const LATEST_KRW: Record<string, number> = ${J(pick(CUR_RATE.map((c) => c.code), LATEST))};
export const SERIES: { yearly: Series; monthly: Series; daily: Series } = ${J(SERIES)};
`);

// 4-2. exchange-impact-lab
const IMP = ["USD", "JPY", "CNY"];
const CUR_IMP = [
  { code: "USD", ko: "미국 달러", country: "미국", unit: 1 },
  { code: "JPY", ko: "일본 엔", country: "일본", unit: 100 },
  { code: "CNY", ko: "중국 위안", country: "중국", unit: 1 },
];
// 슬라이더 범위는 그래프가 다루는 기간(MONTHLY 시작일 이후)의 일별 최소/최대.
const rangeDates = dates.filter((d) => d >= monthlyD[0]);
const RANGE = Object.fromEntries(IMP.map((c) => {
  const all = rangeDates.map((d) => byDate.get(d)[c]);
  return [c, { min: Math.min(...all), max: Math.max(...all) }];
}));
const MONTHLY = { dates: monthlyD, rates: Object.fromEntries(IMP.map((c) => [c, monthlyD.map((d) => byDate.get(d)[c])])) };
write("exchange-impact-lab/data.ts", `// 환율 변동과 손익 미니활동 — Frankfurter(ECB) 환율 + Yahoo(WTI 국제유가). 기준일 ${AS_OF}.
// scripts/fetch/economics_fx.mjs 로 생성. 값은 '통화 1단위 = ? 원'. JPY 는 100단위 표시(unit). oilUsd = 국제유가($/배럴).
export type Cur = { code: string; ko: string; country: string; unit: number };
export const AS_OF = ${J(AS_OF)};
export const CURRENCIES: Cur[] = ${J(CUR_IMP)};
export const CURRENT_KRW: Record<string, number> = ${J(pick(IMP, LATEST))};
export const RANGE_KRW: Record<string, { min: number; max: number }> = ${J(RANGE)};
export const MONTHLY: { dates: string[]; rates: Record<string, (number | null)[]> } = ${J(MONTHLY)};
export const OIL_USD = ${OIL};
`);

// 4-3. exchange-smart-lab (spread 는 은행 현찰 환전 수수료율 — 외부 데이터가 아니라 상수)
const SPREAD = { USD: 0.0175, JPY: 0.0175, EUR: 0.0199, CNY: 0.05, GBP: 0.0199, AUD: 0.0199, CAD: 0.0199, CHF: 0.0199, HKD: 0.0199, SGD: 0.0199 };
const KO = Object.fromEntries(CUR_RATE.map((c) => [c.code, c.ko]));
const ORDER = ["USD", "JPY", "EUR", "CNY", "GBP", "AUD", "CAD", "CHF", "HKD", "SGD"];
const CUR_SMART = ORDER.map((code) => ({ code, ko: KO[code], unit: code === "JPY" ? 100 : 1, spread: SPREAD[code] }));
write("exchange-smart-lab/data.ts", `// 현명하게 환전하기 미니활동 — Frankfurter(ECB) 환율 스냅샷. 기준일 ${AS_OF}.
// scripts/fetch/economics_fx.mjs 로 생성. CURRENT_KRW = 통화 1단위 = ? 원(매매기준율). spread = 은행 현찰 환전 수수료율(편도, 근사).
// 살 때(고객이 외화 살 때)=기준*(1+spread), 팔 때=기준*(1-spread).
export type Cur = { code: string; ko: string; unit: number; spread: number };
export const AS_OF = ${J(AS_OF)};
export const CURRENCIES: Cur[] = ${J(CUR_SMART)};
export const CURRENT_KRW: Record<string, number> = ${J(pick(ORDER, LATEST))};
`);
