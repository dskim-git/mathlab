"use client";

import { useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import { AS_OF, CURRENCIES, CURRENT_KRW, RANGE_KRW, MONTHLY, OIL_USD } from "./data";
import { FLAG } from "./flags";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "export_vs_import",
    prompt:
      "탭①에서 환율이 오를 때 수출 기업과 수입(직구) 소비자는 서로 반대 영향을 받았어요. 왜 같은 환율 상승이 누구에게는 유리하고 누구에게는 불리한지, 원화 매출·비용이 어떻게 달라지는지로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 환율이 오르면 달러로 받은 수출 대금을 원으로 바꿀 때 더 많은 원이 되어 수출 기업은 유리하다. 반대로 달러로 사야 하는 수입·직구는 같은 물건에 더 많은 원이 들어 불리하다.",
  },
  {
    id: "import_price",
    prompt:
      "국제 유가가 그대로여도 환율이 오르면 국내 휘발유·전기료·운송비가 오를 수 있음을 봤어요. 국제 유가가 ‘달러’로 거래된다는 점을 이용해 그 이유를 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 원유는 배럴당 달러로 사 오는데, 달러가 비싸지면(환율↑) 같은 유가라도 원으로 낼 돈이 늘어 수입 물가가 오른다.",
  },
  {
    id: "misconception",
    prompt:
      "탭③에서 ‘환율 상승은 무조건 좋다 / 하락은 무조건 나쁘다’가 오해인 이유를, 환율 상승·하락이 각각 이득을 보는 사람과 손해를 보는 사람을 함께 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 환율 상승은 수출 기업엔 유리하지만 수입 기업·소비자·유학생·여행객엔 불리하다. 하락은 그 반대다. 그래서 상승·하락 어느 쪽도 ‘무조건’ 좋거나 나쁘지 않다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function fmtWon(v: number): string {
  if (v >= 1e8) return `${(v / 1e8).toLocaleString(undefined, { maximumFractionDigits: 2 })}억원`;
  if (v >= 1e4) return `${(v / 1e4).toLocaleString(undefined, { maximumFractionDigits: 1 })}만원`;
  return `${Math.round(v).toLocaleString()}원`;
}
function fmt(v: number, d = 0): string {
  return v.toLocaleString(undefined, { maximumFractionDigits: d });
}
function FlagImg({ code, className }: { code: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={FLAG[code]} alt={code} className={"inline-block shrink-0 rounded-sm object-cover " + (className ?? "h-3.5 w-5")} />;
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "sim" | "life" | "quiz";

export default function ExchangeImpactLab() {
  const [tab, setTab] = useState<Tab>("sim");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">💹 환율 변동과 손익</h3>
        <p className="mt-2 leading-7 text-slate-300">
          환율이 오르내리면 <b className="text-emerald-200">수출·수입·여행·유학·물가</b>가 어떻게 달라질까요? 실제 환율
          데이터로 손익을 시뮬레이션하고, 우리 삶에 미치는 영향과 흔한 오해를 카드 퀴즈로 확인해 봐요.
        </p>
        <p className="mt-1 text-xs text-slate-500">환율 Frankfurter(ECB) · 국제유가 WTI · 기준일 {AS_OF}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "sim"} onClick={() => setTab("sim")}>① 환율 손익 시뮬레이터</TabButton>
        <TabButton active={tab === "life"} onClick={() => setTab("life")}>② 환율과 우리 삶</TabButton>
        <TabButton active={tab === "quiz"} onClick={() => setTab("quiz")}>③ 카드 퀴즈</TabButton>
      </div>

      <div className="mt-4">
        {tab === "sim" ? <SimTab /> : null}
        {tab === "life" ? <LifeTab /> : null}
        {tab === "quiz" ? <QuizTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3 py-2 text-sm font-bold transition " +
        (active ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 환율 손익 시뮬레이터
// ══════════════════════════════════════════════════════════════
// 통화별 예시 금액(외화)
const AMT: Record<string, { sym: string; exportP: number; importP: number; travel: number; tuition: number }> = {
  USD: { sym: "$", exportP: 1000, importP: 100, travel: 100, tuition: 20000 },
  JPY: { sym: "¥", exportP: 100000, importP: 10000, travel: 30000, tuition: 1500000 },
  CNY: { sym: "元", exportP: 7000, importP: 700, travel: 3000, tuition: 100000 },
};
const CHART = { W: 520, H: 150, X0: 44, X1: 508, Y0: 122, Y1: 14 };

function SimTab() {
  const [code, setCode] = useState("USD");
  const [rates, setRates] = useState<Record<string, number>>({ ...CURRENT_KRW }); // 원 / 1단위 (현재)
  const [oil, setOil] = useState(OIL_USD);
  const [asOf, setAsOf] = useState(AS_OF);
  const [liveState, setLiveState] = useState<"idle" | "loading" | "error">("idle");

  const cur = CURRENCIES.find((c) => c.code === code)!;
  const unit = cur.unit;
  const perCur = rates[code] ?? CURRENT_KRW[code]; // 원 / 1단위
  const dispCur = perCur * unit; // 표시 환율(원/quote단위)
  const dMin = Math.min(Math.floor((RANGE_KRW[code].min * unit) / 10) * 10, Math.floor(dispCur / 10) * 10);
  const dMax = Math.max(Math.ceil((RANGE_KRW[code].max * unit) / 10) * 10, Math.ceil(dispCur / 10) * 10);
  const [disp, setDisp] = useState(Math.round(CURRENT_KRW[code] * unit)); // 슬라이더(표시 환율)
  const per = disp / unit; // 원 / 1단위 (슬라이더)

  async function refresh() {
    setLiveState("loading");
    try {
      const res = await fetch("/api/economics/exchange-rate", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok || !json.krw) throw new Error();
      setRates((r) => ({ ...r, ...json.krw }));
      if (typeof json.oil === "number") setOil(json.oil);
      if (json.date) setAsOf(json.date);
      if (typeof json.krw[code] === "number") setDisp(Math.round(json.krw[code] * unit)); // 슬라이더도 오늘 값으로
      setLiveState("idle");
    } catch {
      setLiveState("error");
    }
  }

  const diff = disp - dispCur;
  const dir = Math.abs(diff) < dispCur * 0.002 ? "same" : diff > 0 ? "up" : "down";
  const amt = AMT[code];
  const usdPer = code === "USD" ? per : (rates.USD ?? CURRENT_KRW.USD); // 유가는 원/달러
  const usdCur = rates.USD ?? CURRENT_KRW.USD;

  const scenarios = [
    { key: "export", icon: "📦", title: "수출 기업 매출", desc: `제품 ${amt.sym}${fmt(amt.exportP)} 수출`, won: amt.exportP * per, base: amt.exportP * perCur, goodWhenUp: true },
    { key: "import", icon: "🛒", title: "수입·직구 비용", desc: `물건 ${amt.sym}${fmt(amt.importP)} 구입`, won: amt.importP * per, base: amt.importP * perCur, goodWhenUp: false },
    { key: "travel", icon: "✈️", title: "해외여행 환전", desc: `${amt.sym}${fmt(amt.travel)} 환전`, won: amt.travel * per, base: amt.travel * perCur, goodWhenUp: false },
    { key: "tuition", icon: "🎓", title: "유학 등록금", desc: `등록금 ${amt.sym}${fmt(amt.tuition)}`, won: amt.tuition * per, base: amt.tuition * perCur, goodWhenUp: false },
    { key: "oil", icon: "🛢️", title: "수입 물가(국제유가)", desc: `유가 $${oil}/배럴`, won: oil * usdPer, base: oil * usdCur, goodWhenUp: false },
  ];

  // 미니 차트
  const series = MONTHLY.rates[code].map((v) => (v == null ? null : v * unit));
  const L = MONTHLY.dates.length;
  const vals = series.filter((v): v is number => v != null);
  const cLo = Math.min(...vals, disp), cHi = Math.max(...vals, disp);
  const xAt = (i: number) => CHART.X0 + (i / (L - 1)) * (CHART.X1 - CHART.X0);
  const yAt = (v: number) => CHART.Y0 - ((v - cLo) / (cHi - cLo || 1)) * (CHART.Y0 - CHART.Y1);
  const path = useMemo(() => { let d = ""; series.forEach((v, i) => { if (v == null) return; d += (d === "" ? "M" : "L") + xAt(i).toFixed(1) + " " + yAt(v).toFixed(1) + " "; }); return d.trim(); }, [series, cLo, cHi]);

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 나라를 고르고 <b className="text-emerald-200">환율 슬라이더</b>를 움직여 보세요. 같은 환율 변동이 수출·수입·여행·유학·물가에
        어떻게 다르게 작용하는지 실제 데이터로 확인해요.
      </p>

      {/* 나라 선택 + 새로고침 */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {CURRENCIES.map((c) => (
          <button key={c.code} type="button" onClick={() => { setCode(c.code); setDisp(Math.round((rates[c.code] ?? CURRENT_KRW[c.code]) * c.unit)); }}
            className={"flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " + (code === c.code ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
            <FlagImg code={c.code} /> {c.country}
          </button>
        ))}
        <button type="button" onClick={refresh} disabled={liveState === "loading"} className="ml-auto rounded-lg border border-emerald-400/45 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-50">
          {liveState === "loading" ? "불러오는 중…" : "🔄 오늘 환율로 새로고침"}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        기준 {asOf === AS_OF ? `${AS_OF} 스냅샷` : <b className="text-emerald-300">{asOf} (방금)</b>} · 유가 ${oil}/배럴
        {liveState === "error" ? <span className="ml-2 text-amber-300/90">⚠️ 최신값 실패 — 스냅샷 사용</span> : null}
      </p>

      {/* 실제 환율 미니차트 */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg viewBox={`0 0 ${CHART.W} ${CHART.H}`} className="w-full select-none" role="img" aria-label={`${cur.country} 환율 추이`}>
          <line x1={CHART.X0} y1={CHART.Y0} x2={CHART.X1} y2={CHART.Y0} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
          {[cLo, (cLo + cHi) / 2, cHi].map((v, i) => (
            <text key={i} x={CHART.X0 - 5} y={yAt(v) + 3} textAnchor="end" className="fill-slate-400 font-mono text-[8px]">{Math.round(v)}</text>
          ))}
          <path d={path} fill="none" stroke="#34d399" strokeWidth={1.8} />
          {/* 슬라이더 위치 기준선 */}
          <line x1={CHART.X0} y1={yAt(disp)} x2={CHART.X1} y2={yAt(disp)} stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 3" />
          <text x={CHART.X1} y={yAt(disp) - 3} textAnchor="end" className="fill-amber-300 font-mono text-[9px]">지금 슬라이더 {fmt(disp)}</text>
          <text x={CHART.X0 + 2} y={CHART.Y1} className="fill-slate-500 text-[8px]">최근 10년 · {unit === 100 ? "100" : "1"}{code} = 원</text>
        </svg>
      </div>

      {/* 슬라이더 */}
      <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">{unit === 100 ? "100" : "1"}{code} 환율</span>
          <span className="font-mono text-lg font-bold text-emerald-200">{fmt(disp)}원</span>
        </div>
        <input type="range" min={dMin} max={dMax} step={1} value={disp} onChange={(e) => setDisp(Number(e.target.value))} aria-label="환율" className="mt-1 h-2 w-full cursor-pointer accent-emerald-400" />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
          <span>실제 최저 {fmt(dMin)}</span>
          <span>현재 {fmt(Math.round(dispCur))}</span>
          <span>실제 최고 {fmt(dMax)}</span>
        </div>
      </div>

      {/* 방향 배너 */}
      <div className={"mt-3 rounded-xl border-2 px-4 py-2 text-center text-sm font-bold " + (dir === "up" ? "border-rose-400/50 bg-rose-400/10 text-rose-100" : dir === "down" ? "border-sky-400/50 bg-sky-400/10 text-sky-100" : "border-white/15 bg-white/5 text-slate-200")}>
        {dir === "up" ? "📈 환율 상승 (원화 약세) — 1원의 가치↓, 외화가 비싸짐" : dir === "down" ? "📉 환율 하락 (원화 강세) — 1원의 가치↑, 외화가 싸짐" : "지금은 현재 환율 수준이에요. 슬라이더를 움직여 보세요."}
      </div>

      {/* 시나리오 카드 */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {scenarios.map((s) => {
          const delta = s.won - s.base;
          const favorable = s.goodWhenUp ? delta >= 0 : delta <= 0;
          const changed = Math.abs(delta) > s.base * 0.002;
          return (
            <div key={s.key} className={"rounded-xl border px-4 py-2.5 " + (!changed ? "border-white/10 bg-slate-900/40" : favorable ? "border-emerald-400/45 bg-emerald-400/[0.08]" : "border-rose-400/45 bg-rose-400/[0.08]")}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-100">{s.icon} {s.title}</p>
                {changed ? <span className={"rounded px-1.5 py-0.5 text-[10px] font-bold " + (favorable ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/20 text-rose-100")}>{favorable ? "유리 ▲" : "불리 ▼"}</span> : null}
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{s.desc}</p>
              <p className="mt-0.5 font-mono text-base font-bold text-white">{fmtWon(s.won)}</p>
              {changed ? <p className={"font-mono text-xs " + (delta >= 0 ? "text-rose-300" : "text-sky-300")}>현재 대비 {delta >= 0 ? "+" : ""}{fmtWon(Math.abs(delta)).replace("원", "원")}{delta >= 0 ? " 더 듦/받음" : " 덜 듦/받음"}</p> : null}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">🛢️ 국제유가는 <b className="text-slate-300">배럴당 달러</b>로 거래돼요. 유가가 그대로여도 원/달러 환율이 오르면 원화 유가는 오릅니다.</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 환율과 우리 삶 (사례 + 오해)
// ══════════════════════════════════════════════════════════════
const LOW = 1300, HIGH = 1500; // 예시용 원/달러
type LifeCase = { icon: string; title: string; usd: number; unitLabel: string; upGood: boolean; note: string };
const LIFE: LifeCase[] = [
  { icon: "📦", title: "수출 기업", usd: 1000, unitLabel: "휴대폰 $1,000 수출", upGood: true, note: "달러로 받은 돈을 원으로 바꿀 때 더 많은 원을 받음" },
  { icon: "🛒", title: "수입·해외직구", usd: 100, unitLabel: "신발 $100 직구", upGood: false, note: "같은 물건을 사는 데 더 많은 원이 필요함" },
  { icon: "✈️", title: "해외여행", usd: 100, unitLabel: "$100 환전", upGood: false, note: "여행 경비(환전액)가 더 비싸짐" },
  { icon: "🎓", title: "유학생 부담", usd: 20000, unitLabel: "등록금 $20,000", upGood: false, note: "등록금·생활비 원화 부담이 커짐" },
  { icon: "🛢️", title: "수입 물가(유가)", usd: OIL_USD, unitLabel: `유가 $${OIL_USD}/배럴`, upGood: false, note: "휘발유·전기료·운송비 등이 오름" },
];
const MISCONCEPTIONS = [
  { wrong: "환율이 상승하면 수출이 많아지니까 경제가 무조건 좋아진다.", right: "수출 기업엔 유리하지만 수입 물가↑·수입 기업·소비자·유학·여행 부담↑. 좋고 나쁜 면이 함께 있어요." },
  { wrong: "환율 상승은 무조건 좋은 일이다.", right: "수입·유학·여행·물가 측면에선 불리해요. ‘무조건’ 좋은 건 아니에요." },
  { wrong: "환율 하락은 무조건 나쁜 일이다.", right: "수입·유학·여행·물가엔 오히려 유리해요. 손해 보는 쪽(수출 기업)만 보고 판단하면 오해예요." },
];

function LifeTab() {
  const [up, setUp] = useState(true);
  const rate = up ? HIGH : LOW;
  const other = up ? LOW : HIGH;

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">💡 환율이 <b className="text-emerald-200">오르면(원화 약세)</b> / <b className="text-sky-200">내리면(원화 강세)</b> 우리 삶이 어떻게 달라질까요? 버튼을 눌러 방향을 바꿔 보세요.</p>

      <div className="mt-3 flex overflow-hidden rounded-xl border border-white/10">
        <button type="button" onClick={() => setUp(true)} className={"flex-1 px-3 py-2 text-sm font-bold transition " + (up ? "bg-rose-400/20 text-rose-100" : "text-slate-400 hover:bg-white/5")}>📈 환율 상승 ($1={HIGH.toLocaleString()}원)</button>
        <button type="button" onClick={() => setUp(false)} className={"flex-1 px-3 py-2 text-sm font-bold transition " + (!up ? "bg-sky-400/20 text-sky-100" : "text-slate-400 hover:bg-white/5")}>📉 환율 하락 ($1={LOW.toLocaleString()}원)</button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {LIFE.map((c) => {
          const favorable = up ? c.upGood : !c.upGood;
          const won = c.usd * rate;
          const wonOther = c.usd * other;
          return (
            <div key={c.title} className={"rounded-xl border px-4 py-3 " + (favorable ? "border-emerald-400/45 bg-emerald-400/[0.08]" : "border-rose-400/45 bg-rose-400/[0.08]")}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-100">{c.icon} {c.title}</p>
                <span className={"rounded px-1.5 py-0.5 text-[10px] font-bold " + (favorable ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/20 text-rose-100")}>{favorable ? "유리 😊" : "불리 😟"}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{c.unitLabel}</p>
              <p className="mt-1 font-mono text-sm text-white">
                <span className="text-slate-500">{fmtWon(wonOther)}</span> → <b>{fmtWon(won)}</b>
              </p>
              <p className="mt-0.5 text-xs text-slate-300">{c.note}</p>
            </div>
          );
        })}
      </div>

      {/* 오해 바로잡기 */}
      <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">🤔 환율 변동과 관련된 흔한 오해</p>
        <div className="mt-2 space-y-2">
          {MISCONCEPTIONS.map((m, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-2.5">
              <p className="text-sm text-rose-200">❌ {m.wrong}</p>
              <p className="mt-1 text-sm text-emerald-100">✅ {m.right}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 카드 퀴즈
// ══════════════════════════════════════════════════════════════
type Quiz = { icon: string; q: string; options: string[]; answer: number; why: string };
const QUIZZES: Quiz[] = [
  { icon: "🚗", q: "환율이 1,300 → 1,500원으로 올랐어요. 미국에 자동차를 수출하는 기업에게는?", options: ["유리", "불리"], answer: 0, why: "달러 수출 대금을 원으로 바꿀 때 더 많은 원을 받아 유리해요." },
  { icon: "🛒", q: "환율이 1,300 → 1,500원으로 올랐어요. 미국에서 직구로 물건을 사는 소비자에게는?", options: ["유리", "불리"], answer: 1, why: "같은 달러 물건에 더 많은 원이 들어 불리해요." },
  { icon: "🎓", q: "환율이 1,300 → 1,500원으로 올랐어요. 미국 유학 중인 자녀를 둔 부모에게는?", options: ["부담 감소", "부담 증가"], answer: 1, why: "등록금·생활비(달러)를 원으로 낼 때 더 많은 원이 필요해 부담이 커져요." },
  { icon: "✈️", q: "환율이 1,300 → 1,500원으로 올랐어요. 곧 미국 여행을 갈 사람에게는?", options: ["여행이 싸짐", "여행이 비싸짐"], answer: 1, why: "환전액이 늘어 여행 경비가 비싸져요." },
  { icon: "🛢️", q: "국제 유가는 그대로인데 환율이 올랐어요. 국내 휘발유 가격은?", options: ["오른다", "그대로다"], answer: 0, why: "원유는 달러로 사 오므로, 환율이 오르면 원화 수입가격이 올라 휘발유값도 올라요." },
  { icon: "🏭", q: "환율이 1,500 → 1,300원으로 내렸어요(원화 강세). 원자재를 수입하는 기업에게는?", options: ["유리", "불리"], answer: 0, why: "달러로 사는 원자재 값이 원화로 싸져서 유리해요." },
  { icon: "❗", q: "‘환율 상승은 무조건 좋은 일이다.’ — 맞을까요?", options: ["맞다", "틀리다(오해)"], answer: 1, why: "수출엔 유리하지만 수입·유학·여행·물가엔 불리해요. 무조건 좋은 건 아니에요." },
  { icon: "❗", q: "‘환율 하락은 무조건 나쁜 일이다.’ — 맞을까요?", options: ["맞다", "틀리다(오해)"], answer: 1, why: "수입·유학·여행·물가엔 유리해요. 손해 보는 쪽만 보면 오해예요." },
];

function QuizTab() {
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);
  const total = QUIZZES.length;
  const score = QUIZZES.filter((q, i) => ans[i] === q.answer).length;
  function reset() { setStep(0); setAns({}); setDone(false); }

  if (done) {
    return (
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <p className="text-base font-bold text-violet-200">🏁 카드 퀴즈 결과</p>
        <div className="mt-3 flex justify-center">
          <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/10 px-8 py-4 text-center">
            <p className="font-mono text-3xl font-bold text-emerald-100">{score} / {total}</p>
            <p className="mt-1 text-xs text-slate-300">{score === total ? "완벽해요! 🎉 환율의 손익을 확실히 이해했어요." : score >= total * 0.6 ? "잘했어요! 👍" : "다시 도전해 볼까요?"}</p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          {QUIZZES.map((q, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-xs">
              <span className="mt-0.5">{ans[i] === q.answer ? "✅" : "❌"}</span>
              <div><p className="text-slate-200">{q.icon} {q.q}</p><p className="mt-0.5 text-slate-400">정답: <b className="text-emerald-200">{q.options[q.answer]}</b> — {q.why}</p></div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center"><button type="button" onClick={reset} className="rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25">↺ 다시 풀기</button></div>
      </div>
    );
  }

  const q = QUIZZES[step];
  const chosen = ans[step];
  const revealed = chosen !== undefined;
  const isLast = step === total - 1;

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
      <p className="text-base font-bold text-violet-200">🃏 환율 손익 카드 퀴즈</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="shrink-0 font-mono text-xs font-bold text-slate-300">문제 {step + 1} / {total}</span>
        <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="h-1.5 flex-1" aria-hidden="true">
          <rect width={100} height={6} rx={3} fill="rgba(255,255,255,0.08)" />
          <rect width={((step + (revealed ? 1 : 0)) / total) * 100} height={6} rx={3} fill="#a78bfa" />
        </svg>
        <span className="shrink-0 font-mono text-xs text-slate-400">점수 {score}</span>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <div className="flex items-start gap-3">
          <span className="text-4xl" aria-hidden="true">{q.icon}</span>
          <p className="text-lg font-bold leading-7 text-slate-100">{q.q}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {q.options.map((opt, i) => {
            const sel = chosen === i;
            const showRight = revealed && i === q.answer;
            const showWrong = revealed && sel && i !== q.answer;
            return (
              <button key={i} type="button" disabled={revealed} onClick={() => setAns((a) => ({ ...a, [step]: i }))}
                className={"rounded-xl border-2 px-3 py-3 text-sm font-bold transition " + (showRight ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : showWrong ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : sel ? "border-violet-400/60 bg-violet-400/15 text-violet-100" : "border-white/10 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10")}>
                {opt}{showRight ? " ✓" : showWrong ? " ✕" : ""}
              </button>
            );
          })}
        </div>
        {revealed ? (
          <div className={"mt-3 rounded-xl border-l-4 px-4 py-2.5 " + (chosen === q.answer ? "border-emerald-400 bg-emerald-400/[0.08]" : "border-amber-400 bg-amber-400/[0.08]")}>
            <p className={"text-sm font-bold " + (chosen === q.answer ? "text-emerald-100" : "text-amber-100")}>{chosen === q.answer ? "정답이에요! ✅" : `아쉬워요 — 정답은 ‘${q.options[q.answer]}’`}</p>
            <p className="mt-0.5 text-xs text-slate-300">{q.why}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button type="button" disabled={step === 0} onClick={() => setStep((n) => Math.max(0, n - 1))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-40">← 이전</button>
        <button type="button" disabled={!revealed} onClick={() => (isLast ? setDone(true) : setStep((n) => n + 1))} className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-5 py-1.5 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25 disabled:opacity-40">{isLast ? "결과 보기 →" : "다음 문제 →"}</button>
      </div>
    </div>
  );
}
