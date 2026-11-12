"use client";

import { useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import { AS_OF, CURRENCIES, LATEST_KRW, SERIES, type Currency } from "./data";
import { FLAG } from "./flags";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "rate_meaning",
    prompt:
      "탭①에서 ‘1달러 = OO원’이 커지면(예: 1300원→1500원) 원화의 가치는 오른 걸까요, 내린 걸까요? 같은 100달러를 바꿀 때 필요한 원화가 어떻게 달라지는지로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 1달러에 더 많은 원이 필요하므로 원의 가치는 내린 것(원화 약세). 같은 100달러를 바꾸려면 13만원 → 15만원으로 더 많은 원이 든다.",
  },
  {
    id: "cross_rate",
    prompt:
      "탭①에서 원을 거치지 않고 두 외국 통화끼리(예: 달러↔엔) 환전할 수 있었어요. 1달러가 몇 엔인지는 ‘1달러=OO원’과 ‘1엔=OO원’ 두 환율로 어떻게 계산되는지 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 1달러를 원으로 바꾼 뒤 그 원을 엔으로 바꾼다. 즉 (1달러의 원값) ÷ (1엔의 원값) = 1달러가 몇 엔인지.",
  },
  {
    id: "trend",
    prompt:
      "탭②에서 여러 나라 환율의 과거 흐름을 비교했을 때, 최근 몇 년간 원화 대비 특히 많이 오르거나 내린 통화가 있었나요? ‘100 기준’으로 비교하면 왜 서로 다른 통화의 변화를 더 공정하게 볼 수 있는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 달러가 원화 대비 많이 올랐다. 통화마다 원래 환율 크기가 달라(달러 1485원 vs 엔 9원) 실제 값으론 비교가 어렵지만, 시작을 100으로 맞추면 몇 % 움직였는지 같은 기준으로 비교된다.",
  },
];

// KRW 포함 전체 통화 목록
const KRW: Currency = { code: "KRW", ko: "대한민국 원", emoji: "🇰🇷", unit: 1 };
const ALL: Currency[] = [KRW, ...CURRENCIES];
const META: Record<string, Currency> = Object.fromEntries(ALL.map((c) => [c.code, c]));
const COLOR: Record<string, string> = {
  USD: "#34d399", CNY: "#fb7185", JPY: "#fbbf24", EUR: "#38bdf8", GBP: "#a78bfa",
  AUD: "#f472b6", CAD: "#f97316", CHF: "#22d3ee", HKD: "#a3e635", SGD: "#c084fc",
};

function fmt(v: number, d = 2): string {
  return v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: d });
}

function FlagImg({ code, className }: { code: string; className?: string }) {
  // 국기 PNG(base64). Windows 국기 이모지 미표시 회피.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={FLAG[code]} alt={code} className={"inline-block shrink-0 rounded-sm object-cover " + (className ?? "h-3.5 w-5")} />;
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "convert" | "trend";

export default function ExchangeRateLab() {
  const [tab, setTab] = useState<Tab>("convert");
  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/40 p-4 shadow-2xl shadow-emerald-950/25 sm:p-6">
      <div className="border-b border-white/10 pb-5 sm:pb-6">
        <p className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1 text-xs font-bold tracking-wide text-emerald-200">미니활동 · 경제수학</p>
        <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">💱 환율 변환과 추이</h3>
        <p className="mt-2 max-w-4xl leading-7 text-slate-300">
          <b className="text-emerald-200">유럽중앙은행(ECB) 공식 환율</b>로 여러 나라 돈을 서로 바꿔 보고(원↔외화, 외화↔외화),
          주요 통화의 <b className="text-emerald-200">과거 환율 흐름</b>을 원 기준으로 비교해 봐요.
        </p>
        <p className="mt-2 text-xs text-slate-500">출처 Frankfurter(ECB 참조환율) · 내장 스냅샷 기준일 {AS_OF} · 각 탭에서 최신 자료를 새로고침할 수 있어요</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-white/[0.06] bg-slate-900/50 p-1.5">
        <TabButton active={tab === "convert"} onClick={() => setTab("convert")}>① 환율 변환기</TabButton>
        <TabButton active={tab === "trend"} onClick={() => setTab("trend")}>② 환율 시계열</TabButton>
      </div>

      <div className="mt-4">{tab === "convert" ? <ConvertTab /> : <TrendTab />}</div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-xl border px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 " +
        (active ? "border-emerald-300/40 bg-gradient-to-r from-emerald-400/20 to-teal-400/15 text-emerald-50 shadow-sm shadow-emerald-950/30" : "border-transparent bg-transparent text-slate-400 hover:border-white/[0.08] hover:bg-white/[0.05] hover:text-slate-100")
      }
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 환율 변환기
// ══════════════════════════════════════════════════════════════
function ConvertTab() {
  const [rates, setRates] = useState<Record<string, number>>({ KRW: 1, ...LATEST_KRW }); // 통화 1단위 = ? 원
  const [live, setLive] = useState<{ date: string } | null>(null);
  const [liveState, setLiveState] = useState<"idle" | "loading" | "error">("idle");
  const [amount, setAmount] = useState(10000);
  const [from, setFrom] = useState("KRW");
  const [to, setTo] = useState("USD");

  const result = rates[from] && rates[to] ? (amount * rates[from]) / rates[to] : 0;
  const oneRate = rates[from] && rates[to] ? rates[from] / rates[to] : 0; // 1 from = ? to

  async function refresh() {
    setLiveState("loading");
    try {
      const res = await fetch("/api/economics/exchange-rate", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok || !json.krw) throw new Error();
      setRates({ KRW: 1, ...json.krw });
      setLive({ date: json.date });
      setLiveState("idle");
    } catch {
      setLiveState("error");
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-300/20 bg-gradient-to-br from-emerald-400/[0.08] via-slate-900/70 to-cyan-400/[0.05] p-4 shadow-lg shadow-black/10 sm:p-5">
      <p className="text-sm text-slate-300">
        💡 금액과 통화를 골라 환전해 보세요. <b className="text-emerald-200">원이 아니어도</b> 어떤 나라 돈이든 서로 바꿀 수 있어요.
      </p>

      {/* 변환기 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-black/20 sm:p-5">
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div>
            <label className="text-xs font-semibold text-slate-400">보낼 금액</label>
            <div className="mt-1 flex gap-2">
              <input type="number" min={0} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} aria-label="금액" className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-right font-mono text-lg text-white outline-none focus:border-emerald-400/60" />
              <CurrencySelect value={from} onChange={setFrom} />
            </div>
          </div>
          <button type="button" onClick={() => { setFrom(to); setTo(from); }} aria-label="통화 바꾸기" className="mx-auto rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-lg font-bold text-emerald-100 transition hover:bg-emerald-400/20">⇄</button>
          <div>
            <label className="text-xs font-semibold text-slate-400">받는 금액</label>
            <div className="mt-1 flex gap-2">
              <div className="w-full rounded-lg border border-emerald-400/40 bg-emerald-400/[0.08] px-3 py-2 text-right font-mono text-lg font-bold text-emerald-100">{fmt(result, 2)}</div>
              <CurrencySelect value={to} onChange={setTo} />
            </div>
          </div>
        </div>
        <p className="mt-3 text-center font-mono text-sm text-slate-300">
          1 {META[from].code} = <b className="text-white">{fmt(oneRate, oneRate < 1 ? 4 : 2)}</b> {META[to].code}
          <span className="mx-2 text-slate-600">·</span>
          1 {META[to].code} = <b className="text-white">{fmt(oneRate ? 1 / oneRate : 0, oneRate > 1 ? 4 : 2)}</b> {META[from].code}
        </p>
      </div>

      {/* 새로고침 */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-slate-950/50 p-3">
        <button type="button" onClick={refresh} disabled={liveState === "loading"} className="rounded-lg border border-emerald-400/45 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-50">
          {liveState === "loading" ? "불러오는 중…" : "🔄 최신 환율 새로고침"}
        </button>
        <span className="text-xs text-slate-500">
          기준 {live ? <b className="text-emerald-300">{live.date} (방금)</b> : `${AS_OF} 스냅샷`}
        </span>
        {liveState === "error" ? <span className="text-xs text-amber-300/90">⚠️ 최신값 실패 — 스냅샷 사용</span> : null}
      </div>

      {/* 주요 환율 카드 (원 기준) */}
      <p className="mt-4 text-xs font-semibold text-slate-400">원(₩) 기준 주요 환율 · 카드를 누르면 그 통화로 바꿔요</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {CURRENCIES.map((c) => {
          const krw = rates[c.code] ?? 0;
          return (
            <button key={c.code} type="button" onClick={() => { setFrom("KRW"); setTo(c.code); }}
              className="group rounded-xl border border-white/[0.08] bg-gradient-to-br from-slate-800/80 to-slate-900/70 px-3 py-3 text-left shadow-sm shadow-black/20 transition hover:-translate-y-0.5 hover:border-emerald-300/40 hover:from-emerald-400/[0.12] hover:to-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60">
              <p className="flex items-center gap-1.5 text-sm font-bold text-slate-100"><FlagImg code={c.code} /> {c.code}</p>
              <p className="font-mono text-sm text-emerald-200">{c.unit === 100 ? "100 " : "1 "}{c.code} = {fmt(krw * c.unit, 2)}원</p>
              <p className="text-[10px] text-slate-500">{c.ko}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 pl-2 focus-within:border-emerald-400/60">
      <FlagImg code={value} />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="통화 선택" className="bg-transparent py-2 pr-2 text-sm font-bold text-white outline-none">
        {ALL.map((c) => (<option key={c.code} value={c.code} className="bg-slate-900">{c.code} · {c.ko}</option>))}
      </select>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 환율 시계열
// ══════════════════════════════════════════════════════════════
type Period = "daily" | "monthly" | "yearly";
type Mode = "abs" | "rebase";
const LC = { W: 720, H: 300, X0: 68, X1: 700, Y0: 250, Y1: 28 };

function TrendTab() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [mode, setMode] = useState<Mode>("abs");
  const [series, setSeries] = useState(SERIES);
  const [liveDate, setLiveDate] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveState, setLiveState] = useState<"idle" | "loading" | "error">("idle");
  const [sel, setSel] = useState<Record<string, boolean>>({ USD: true, JPY: true, EUR: true, CNY: true });
  const [hoverI, setHoverI] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const S = series[period];
  const dates = S.dates;
  const L = dates.length;
  const shown = CURRENCIES.filter((c) => sel[c.code]);

  const lines = useMemo(() => shown.map((c) => {
    const raw = S.rates[c.code];
    const first = raw.find((v) => v != null) ?? 1;
    const pts = raw.map((v) => (v == null ? null : mode === "rebase" ? (v / (first as number)) * 100 : v * c.unit));
    return { code: c.code, unit: c.unit, color: COLOR[c.code], pts };
  }), [shown, period, mode, S]);

  const { yMin, yMax } = useMemo(() => {
    let lo = Infinity, hi = -Infinity;
    for (const ln of lines) for (const v of ln.pts) if (v != null) { if (v < lo) lo = v; if (v > hi) hi = v; }
    if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
    const pad = (hi - lo) * 0.1 || 1;
    return { yMin: Math.max(0, lo - pad), yMax: hi + pad };
  }, [lines]);

  const xAt = (i: number) => (L <= 1 ? LC.X0 : LC.X0 + (i / (L - 1)) * (LC.X1 - LC.X0));
  const yAt = (v: number) => LC.Y0 - ((v - yMin) / (yMax - yMin || 1)) * (LC.Y0 - LC.Y1);
  const yTicks = useMemo(() => { const t: number[] = []; for (let i = 0; i <= 4; i++) t.push(yMin + ((yMax - yMin) * i) / 4); return t; }, [yMin, yMax]);
  const xTicks = useMemo(() => {
    const count = Math.min(5, L);
    if (count <= 1) return count === 1 ? [0] : [];
    return Array.from({ length: count }, (_, i) => Math.round((i * (L - 1)) / (count - 1)));
  }, [L]);

  async function refresh() {
    setLiveState("loading");
    setLiveError(null);
    setHoverI(null);
    try {
      const res = await fetch("/api/economics/exchange-rate?history=1", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok || !json.series?.daily?.dates?.length) {
        throw new Error(json.error || `환율 시계열 응답 오류 (${res.status})`);
      }
      setSeries(json.series as typeof SERIES);
      setLiveDate(json.date);
      setLiveState("idle");
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "알 수 없는 오류");
      setLiveState("error");
    }
  }

  function onMove(e: React.MouseEvent) {
    const svg = svgRef.current; if (!svg || L < 1) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * LC.W;
    const i = Math.round(((svgX - LC.X0) / (LC.X1 - LC.X0)) * (L - 1));
    setHoverI(Math.max(0, Math.min(L - 1, i)));
  }
  function shortDate(d: string): string { return period === "yearly" ? d.slice(0, 4) : period === "monthly" ? d.slice(0, 7) : d.slice(5); }

  return (
    <div className="rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/[0.07] via-slate-900/70 to-emerald-400/[0.05] p-4 shadow-lg shadow-black/10 sm:p-5">
      <p className="text-sm text-slate-300">
        💡 원(₩) 기준으로 여러 나라 통화의 <b className="text-emerald-200">과거 환율</b>을 한 그래프에서 비교해요. 통화를 골라 켜고,
        주기(일·월·연)와 보기를 바꿔 보세요.
      </p>

      {/* 컨트롤 */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.07] bg-slate-950/55 p-3">
        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 p-1">
          {(["daily", "monthly", "yearly"] as Period[]).map((p) => (
            <button key={p} type="button" onClick={() => { setPeriod(p); setHoverI(null); }} aria-pressed={period === p} className={"rounded-lg px-3 py-2 text-xs font-bold transition " + (period === p ? "bg-emerald-300/15 text-emerald-100 shadow-inner shadow-emerald-950/30" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100")}>
              {p === "daily" ? "일" : p === "monthly" ? "월" : "연"}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 p-1">
          {(["abs", "rebase"] as Mode[]).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={"rounded-lg px-3 py-2 text-xs font-bold transition " + (mode === m ? "bg-cyan-300/15 text-cyan-100 shadow-inner shadow-cyan-950/30" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100")}>
              {m === "abs" ? "실제 환율(원)" : "100 기준"}
            </button>
          ))}
        </div>
        <button type="button" onClick={refresh} disabled={liveState === "loading"} className="ml-auto rounded-xl border border-emerald-300/30 bg-emerald-300/[0.12] px-4 py-2 text-xs font-bold text-emerald-100 transition hover:border-emerald-200/50 hover:bg-emerald-300/[0.18] disabled:cursor-wait disabled:opacity-50">
          {liveState === "loading" ? "시계열 불러오는 중…" : "🔄 최신 시계열 새로고침"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">기준 {liveDate ? <b className="text-emerald-300">{liveDate} (최근 제공일)</b> : `${AS_OF} 내장 스냅샷`}</p>
      {liveState === "error" ? <p className="mt-2 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs text-amber-200">최신 시계열을 불러오지 못했어요: {liveError || "네트워크 연결 실패"}. 내장 자료를 유지합니다.</p> : null}

      {/* 통화 선택 */}
      <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-white/[0.07] bg-slate-950/35 p-3">
        {CURRENCIES.map((c) => (
          <button key={c.code} type="button" onClick={() => setSel((s) => ({ ...s, [c.code]: !s[c.code] }))}
            aria-pressed={sel[c.code]}
            className={"flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 " + (sel[c.code] ? "border-white/20 bg-white/[0.09] text-white shadow-sm" : "border-white/[0.06] bg-slate-900/40 text-slate-500 hover:border-white/15 hover:bg-white/[0.06] hover:text-slate-200")}>
            <svg viewBox="0 0 12 8" className="h-2 w-3"><rect width={12} height={8} rx={2} fill={sel[c.code] ? COLOR[c.code] : "#475569"} /></svg>
            <FlagImg code={c.code} className="h-3 w-4" /> {c.code}
          </button>
        ))}
      </div>

      {/* 그래프 */}
      <div className="mt-4 overflow-x-auto overflow-y-hidden rounded-2xl border border-white/[0.08] bg-slate-950/85 px-2 py-2 shadow-inner shadow-black/30">
        <svg ref={svgRef} viewBox={`0 0 ${LC.W} ${LC.H}`} className="w-full select-none" role="img" aria-label="환율 시계열" onMouseMove={onMove} onMouseLeave={() => setHoverI(null)}>
          <line x1={LC.X0} y1={LC.Y0} x2={LC.X1} y2={LC.Y0} stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
          <line x1={LC.X0} y1={LC.Y0} x2={LC.X0} y2={LC.Y1} stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={LC.X0} y1={yAt(v)} x2={LC.X1} y2={yAt(v)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={LC.X0 - 10} y={yAt(v) + 4} textAnchor="end" className="fill-slate-400 font-mono text-[10px]">{Math.round(v).toLocaleString()}</text>
            </g>
          ))}
          {mode === "rebase" && yMin < 100 && yMax > 100 ? <line x1={LC.X0} y1={yAt(100)} x2={LC.X1} y2={yAt(100)} stroke="rgba(255,255,255,0.28)" strokeWidth={1} strokeDasharray="4 3" /> : null}
          {xTicks.map((i) => (<text key={i} x={xAt(i)} y={LC.Y0 + 22} textAnchor={i === 0 ? "start" : i === L - 1 ? "end" : "middle"} className="fill-slate-400 font-mono text-[11px]">{shortDate(dates[i])}</text>))}
          <text x={LC.X0 + 2} y={LC.Y1 - 10} className="fill-slate-500 text-[10px]">{mode === "rebase" ? "환율(시작=100)" : "원(₩)"}</text>
          {lines.map((ln) => {
            let d = ""; ln.pts.forEach((v, i) => { if (v == null) return; d += (d === "" || ln.pts[i - 1] == null ? "M" : "L") + xAt(i).toFixed(1) + " " + yAt(v).toFixed(1) + " "; });
            return <path key={ln.code} d={d.trim()} fill="none" stroke={ln.color} strokeWidth={2} />;
          })}
          {hoverI !== null ? (
            <g>
              <line x1={xAt(hoverI)} y1={LC.Y1} x2={xAt(hoverI)} y2={LC.Y0} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="3 3" />
              {lines.map((ln) => (ln.pts[hoverI] != null ? <circle key={ln.code} cx={xAt(hoverI)} cy={yAt(ln.pts[hoverI] as number)} r={3.5} fill={ln.color} stroke="#0f172a" strokeWidth={1.2} /> : null))}
            </g>
          ) : null}
        </svg>
      </div>

      {/* 범례/호버 값 */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-white/[0.07] bg-slate-950/40 px-4 py-3 text-xs">
        {hoverI !== null ? <span className="font-mono font-bold text-slate-200">{dates[hoverI]}</span> : null}
        {lines.map((ln) => {
          const raw = S.rates[ln.code][hoverI ?? L - 1];
          return (
            <span key={ln.code} className="flex items-center gap-1.5 font-mono">
              <svg viewBox="0 0 12 8" className="h-2 w-3"><rect width={12} height={8} rx={2} fill={ln.color} /></svg>
              <span className="text-slate-300">{ln.unit === 100 ? "100" : "1"}{ln.code}</span>
              {raw != null ? <b className="text-white">{fmt(raw * ln.unit, 1)}원</b> : null}
            </span>
          );
        })}
      </div>
      {shown.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-white/15 py-6 text-center text-sm text-slate-500">통화를 하나 이상 선택하세요</p> : null}
    </div>
  );
}
