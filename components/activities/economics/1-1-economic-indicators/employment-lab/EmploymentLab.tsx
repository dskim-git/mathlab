"use client";

import { useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import { WB_SOURCE, WB_LAST_UPDATED, YEARS, COUNTRIES, MATRIX, KOR } from "./data";
import { GEO, GEO_W, GEO_H } from "./geoData";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "emp_vs_employ",
    prompt:
      "탭④에서 ‘취업률+실업률’은 항상 100%였지만 ‘고용률+실업률’은 100%가 되지 않았어요. 그 이유를 두 지표의 분모(고용률=15세 이상 인구, 취업률·실업률=경제활동인구) 차이로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 취업률과 실업률은 분모가 같은 경제활동인구라 합이 100%다. 하지만 고용률은 분모가 더 큰 15세 이상 인구(비경제활동인구 포함)라 실업률과 분모가 달라 합이 100%가 되지 않는다.",
  },
  {
    id: "cpi_relation",
    prompt:
      "탭②에서 물가상승률과 실업률(또는 고용률)의 시계열을 비교했을 때 어떤 관계가 보였나요? 특정 시기(예: 1998 외환위기, 2020 코로나)를 예로 들어, 경기가 나빠질 때 이 지표들이 어떻게 함께 움직였는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 경기가 나쁠 때 실업률이 급등하고 고용률이 떨어졌다. 물가상승률과는 시기에 따라 반대로 움직이기도(필립스곡선), 함께 나빠지기도 했다.",
  },
  {
    id: "world_compare",
    prompt:
      "탭③ 세계지도에서 고용률이 높은 나라와 실업률이 높은 나라가 꼭 반대는 아니었어요(비경제활동인구 차이 때문). 한국과 다른 한 나라를 골라 고용률·실업률을 비교하고, 무엇이 다른지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: A나라는 실업률은 낮지만 고용률도 낮았다. 일할 의사가 없는 비경제활동인구가 많으면 실업률이 낮아도 고용률은 높지 않을 수 있다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function pct(v: number, d = 1): string {
  return `${v.toFixed(d)}%`;
}
const yearIndex = (y: number) => y - YEARS[0];
const NAME: Record<string, string> = Object.fromEntries(COUNTRIES.map((c) => [c.iso3, c.name]));

function korSeries(key: keyof typeof KOR, xs: number[]): (number | null)[] {
  const m = new Map(KOR[key].map((r) => [r.year, r.value]));
  return xs.map((y) => (m.has(y) ? (m.get(y) as number) : null));
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "korea" | "cpi" | "world" | "identity";

export default function EmploymentLab() {
  const [tab, setTab] = useState<Tab>("korea");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">👷 고용률·취업률·실업률 탐험</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-emerald-200">세계은행 공식 데이터</b>로 한국의 고용 지표 흐름과 물가와의 관계를 살펴보고,
          세계 여러 나라를 지도로 비교한 뒤, 인구 구성을 직접 조작하며{" "}
          <b className="text-emerald-200">고용률과 취업률의 차이</b>를 확인해 봐요.
        </p>
        <p className="mt-1 text-xs text-slate-500">출처 {WB_SOURCE} · 최신 갱신 {WB_LAST_UPDATED}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "korea"} onClick={() => setTab("korea")}>① 한국 고용지표 흐름</TabButton>
        <TabButton active={tab === "cpi"} onClick={() => setTab("cpi")}>② 물가와의 관계</TabButton>
        <TabButton active={tab === "world"} onClick={() => setTab("world")}>③ 세계 여러 나라</TabButton>
        <TabButton active={tab === "identity"} onClick={() => setTab("identity")}>④ 합이 100%일까?</TabButton>
      </div>

      <div className="mt-4">
        {tab === "korea" ? <KoreaTab /> : null}
        {tab === "cpi" ? <CpiTab /> : null}
        {tab === "world" ? <WorldTab /> : null}
        {tab === "identity" ? <IdentityTab /> : null}
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

// ─── 공용 라인차트 ─────────────────────────────────────────────
type Series = { key: string; label: string; color: string; pts: (number | null)[] };
const LC = { W: 560, H: 250, X0: 50, X1: 546, Y0: 205, Y1: 20 };

function LineChart({ xs, series, formatY, markIndex, yUnit, yFloor, yCap }: { xs: number[]; series: Series[]; formatY: (v: number) => string; markIndex?: number | null; yUnit?: string; yFloor?: number; yCap?: number }) {
  const [hoverI, setHoverI] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const L = xs.length;

  const { yMin, yMax } = useMemo(() => {
    let lo = Infinity, hi = -Infinity;
    for (const s of series) for (const v of s.pts) if (v != null) { if (v < lo) lo = v; if (v > hi) hi = v; }
    if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
    const pad = (hi - lo) * 0.1 || 1;
    let mn = lo - pad, mx = hi + pad;
    if (yFloor != null) mn = Math.max(mn, yFloor); // 하한(예: 0%)
    if (yCap != null) mx = Math.min(mx, yCap); // 상한(예: 100%)
    return { yMin: mn, yMax: mx };
  }, [series, yFloor, yCap]);

  const xAt = (i: number) => (L <= 1 ? LC.X0 : LC.X0 + (i / (L - 1)) * (LC.X1 - LC.X0));
  const yAt = (v: number) => LC.Y0 - ((v - yMin) / (yMax - yMin || 1)) * (LC.Y0 - LC.Y1);
  const yTicks = useMemo(() => { const t: number[] = []; for (let i = 0; i <= 4; i++) t.push(yMin + ((yMax - yMin) * i) / 4); return t; }, [yMin, yMax]);
  const xTicks = useMemo(() => { const step = Math.max(1, Math.ceil(L / 7)); const t: number[] = []; for (let i = 0; i < L; i += step) t.push(i); if (t[t.length - 1] !== L - 1) t.push(L - 1); return t; }, [L]);

  function onMove(e: React.MouseEvent) {
    const svg = svgRef.current; if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * LC.W;
    const i = Math.round(((svgX - LC.X0) / (LC.X1 - LC.X0)) * (L - 1));
    setHoverI(Math.max(0, Math.min(L - 1, i)));
  }
  const activeI = hoverI ?? markIndex ?? null;

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg ref={svgRef} viewBox={`0 0 ${LC.W} ${LC.H}`} className="w-full select-none" role="img" aria-label="연도별 지표 그래프" onMouseMove={onMove} onMouseLeave={() => setHoverI(null)}>
          <line x1={LC.X0} y1={LC.Y0} x2={LC.X1} y2={LC.Y0} stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
          <line x1={LC.X0} y1={LC.Y0} x2={LC.X0} y2={LC.Y1} stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={LC.X0} y1={yAt(v)} x2={LC.X1} y2={yAt(v)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={LC.X0 - 6} y={yAt(v) + 3} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">{formatY(v)}</text>
            </g>
          ))}
          {xTicks.map((i) => (<text key={i} x={xAt(i)} y={LC.Y0 + 14} textAnchor="middle" className="fill-slate-400 font-mono text-[9px]">{String(xs[i]).slice(2)}</text>))}
          {yUnit ? <text x={LC.X0 + 2} y={LC.Y1 - 6} className="fill-slate-500 text-[9px]">{yUnit}</text> : null}
          {series.map((s) => {
            let d = ""; s.pts.forEach((v, i) => { if (v == null) return; d += (d === "" || s.pts[i - 1] == null ? "M" : "L") + xAt(i).toFixed(1) + " " + yAt(v).toFixed(1) + " "; });
            return <path key={s.key} d={d.trim()} fill="none" stroke={s.color} strokeWidth={2} />;
          })}
          {activeI !== null ? (
            <g>
              <line x1={xAt(activeI)} y1={LC.Y1} x2={xAt(activeI)} y2={LC.Y0} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="3 3" />
              {series.map((s) => (s.pts[activeI] != null ? <circle key={s.key} cx={xAt(activeI)} cy={yAt(s.pts[activeI] as number)} r={3.5} fill={s.color} stroke="#0f172a" strokeWidth={1.2} /> : null))}
            </g>
          ) : null}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {activeI !== null ? <span className="font-mono font-bold text-slate-200">{xs[activeI]}년</span> : null}
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 font-mono">
            <svg viewBox="0 0 12 8" className="h-2 w-3"><rect width={12} height={8} rx={2} fill={s.color} /></svg>
            <span className="text-slate-300">{s.label}</span>
            {activeI !== null && s.pts[activeI] != null ? <b className="text-white">{pct(s.pts[activeI] as number)}</b> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 한국 고용지표 흐름
// ══════════════════════════════════════════════════════════════
function KoreaTab() {
  const xs = useMemo(() => KOR.emp.map((r) => r.year), []);
  const [show, setShow] = useState<Record<string, boolean>>({ emp: true, employ: true, unemp: true });

  const unemp = korSeries("unemp", xs);
  const all: Series[] = [
    { key: "emp", label: "고용률", color: "#34d399", pts: korSeries("emp", xs) },
    { key: "employ", label: "취업률(=100−실업률)", color: "#38bdf8", pts: unemp.map((u) => (u == null ? null : 100 - u)) },
    { key: "unemp", label: "실업률", color: "#fb7185", pts: unemp },
  ];
  const series = all.filter((s) => show[s.key]);

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 한국의 <b className="text-emerald-200">고용률</b>·<b className="text-sky-200">취업률</b>·<b className="text-rose-200">실업률</b> 30년 흐름이에요.
        지표를 켜고 끄면 그래프가 그 범위에 맞춰 확대돼요(실업률만 켜면 잘 보여요).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {all.map((s) => (
          <button key={s.key} type="button" onClick={() => setShow((v) => ({ ...v, [s.key]: !v[s.key] }))}
            className={"flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-xs font-bold transition " + (show[s.key] ? "border-white/25 bg-white/10 text-white" : "border-white/10 bg-white/5 text-slate-500 hover:bg-white/10")}>
            <svg viewBox="0 0 12 8" className="h-2 w-3"><rect width={12} height={8} rx={2} fill={show[s.key] ? s.color : "#475569"} /></svg>
            {s.label}
          </button>
        ))}
      </div>
      <div className="mt-3"><LineChart xs={xs} series={series} formatY={(v) => `${Math.round(v)}`} yUnit="%" yFloor={0} yCap={100} /></div>
      <div className="mt-3 rounded-xl border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-4 py-3 text-sm text-slate-200">
        📌 <b className="text-emerald-200">고용률</b> = 취업자 ÷ 15세 이상 인구 · <b className="text-sky-200">취업률</b> = 취업자 ÷ 경제활동인구 ·{" "}
        <b className="text-rose-200">실업률</b> = 실업자 ÷ 경제활동인구. 2024년 한국 고용률 약 {pct(KOR.emp.at(-1)!.value)}, 실업률 약 {pct(KOR.unemp.at(-1)!.value)}.
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 물가와의 관계
// ══════════════════════════════════════════════════════════════
type EmpKey = "unemp" | "emp" | "employ";
const EMP_LABEL: Record<EmpKey, string> = { unemp: "실업률", emp: "고용률", employ: "취업률" };
const EMP_COLOR: Record<EmpKey, string> = { unemp: "#fb7185", emp: "#34d399", employ: "#38bdf8" };

function CpiTab() {
  const xs = useMemo(() => KOR.cpiInfl.map((r) => r.year), []);
  const [emp, setEmp] = useState<EmpKey>("unemp");

  const unemp = korSeries("unemp", xs);
  const empPts = emp === "unemp" ? unemp : emp === "emp" ? korSeries("emp", xs) : unemp.map((u) => (u == null ? null : 100 - u));
  const series: Series[] = [
    { key: "cpi", label: "물가상승률", color: "#fbbf24", pts: korSeries("cpiInfl", xs) },
    { key: emp, label: EMP_LABEL[emp], color: EMP_COLOR[emp], pts: empPts },
  ];

  return (
    <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 <b className="text-amber-200">물가상승률</b>과 고용 지표가 함께 어떻게 움직이는지 비교해요. 특히{" "}
        <b className="text-rose-200">실업률</b>과 물가는 함께 보면 좋아요(경기와의 관계).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["unemp", "emp", "employ"] as EmpKey[]).map((k) => (
          <button key={k} type="button" onClick={() => setEmp(k)}
            className={"rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " + (emp === k ? "border-amber-400/60 bg-amber-400/15 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
            물가 vs {EMP_LABEL[k]}
          </button>
        ))}
      </div>
      <div className="mt-3"><LineChart xs={xs} series={series} formatY={(v) => `${Math.round(v)}`} yUnit="%" yCap={100} /></div>
      <div className="mt-3 rounded-xl border-l-4 border-amber-400 bg-amber-400/[0.08] px-4 py-3 text-sm text-slate-200">
        🔍 경기가 나빠지면 대체로 <b className="text-rose-200">실업률↑·고용률↓</b>. 물가상승률은 시기에 따라 실업률과 반대로 움직이기도(필립스곡선),
        공급 충격 땐 물가·실업이 함께 나빠지기도 해요. 1998·2020년 부근을 살펴보세요.
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 세계 여러 나라 (지도 + 연도 + 국가 시계열)
// ══════════════════════════════════════════════════════════════
type Ind = "emp" | "unemp" | "employ";
const IND_LABEL: Record<Ind, string> = { emp: "고용률", unemp: "실업률", employ: "취업률" };
const IND_HUE: Record<Ind, number> = { emp: 160, unemp: 2, employ: 199 };

function valOf(iso: string, ind: Ind, yi: number): number | null {
  const row = MATRIX[iso];
  if (!row) return null;
  if (ind === "employ") { const u = row.unemp[yi]; return u == null ? null : Math.round((100 - u) * 100) / 100; }
  return row[ind][yi] ?? null;
}

function WorldTab() {
  const [ind, setInd] = useState<Ind>("emp");
  const [year, setYear] = useState<number>(YEARS[YEARS.length - 1]);
  const [selIso, setSelIso] = useState<string>("KOR");
  const [hoverIso, setHoverIso] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const yi = yearIndex(year);
  const hue = IND_HUE[ind];

  const domain = useMemo(() => {
    let lo = Infinity, hi = -Infinity;
    for (const iso in MATRIX) for (let i = 0; i < YEARS.length; i++) { const v = valOf(iso, ind, i); if (v != null) { if (v < lo) lo = v; if (v > hi) hi = v; } }
    if (!Number.isFinite(lo)) { lo = 0; hi = 100; }
    return { lo, hi };
  }, [ind]);

  function colorFor(v: number | null): string {
    if (v == null) return "#293548";
    const t = Math.max(0, Math.min(1, (v - domain.lo) / (domain.hi - domain.lo || 1)));
    return `hsl(${hue}, ${ind === "unemp" ? 66 : 58}%, ${84 - t * 52}%)`;
  }

  const ranked = useMemo(() => {
    const list = COUNTRIES.filter((c) => valOf(c.iso3, ind, yi) != null);
    list.sort((a, b) => (valOf(b.iso3, ind, yi) as number) - (valOf(a.iso3, ind, yi) as number));
    return list;
  }, [ind, yi]);
  const rankOf = useMemo(() => { const m = new Map<string, number>(); ranked.forEach((c, i) => m.set(c.iso3, i + 1)); return m; }, [ranked]);
  const filtered = query.trim() ? ranked.filter((c) => c.name.includes(query.trim()) || c.nameEn.toLowerCase().includes(query.trim().toLowerCase())) : ranked;

  const capIso = hoverIso ?? selIso;
  const capVal = valOf(capIso, ind, yi);
  const selPts = YEARS.map((_, i) => valOf(selIso, ind, i));

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">💡 지표·연도를 바꿔 세계 여러 나라의 고용을 비교해요. 지도·표에서 나라를 클릭하면 그 나라의 <b className="text-emerald-200">시계열</b>이 나와요.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {(["emp", "unemp", "employ"] as Ind[]).map((k) => (
          <button key={k} type="button" onClick={() => setInd(k)}
            className={"rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " + (ind === k ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
            {IND_LABEL[k]}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
        <input type="range" min={YEARS[0]} max={YEARS[YEARS.length - 1]} step={1} value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="연도" className="h-2 flex-1 cursor-pointer accent-emerald-400" />
        <span className="w-14 shrink-0 text-right font-mono text-lg font-bold text-emerald-200">{year}</span>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/70">
        <svg viewBox={`0 0 ${GEO_W} ${GEO_H}`} className="w-full select-none" role="img" aria-label={`세계 ${IND_LABEL[ind]} 지도 (${year})`}>
          {Object.entries(GEO).map(([iso, g]) => {
            const sel = iso === selIso, hov = iso === hoverIso;
            return <path key={iso} d={g.d} fill={colorFor(valOf(iso, ind, yi))} stroke={sel ? "#f8fafc" : hov ? "#e2e8f0" : "rgba(2,6,23,0.6)"} strokeWidth={sel ? 1.4 : hov ? 1.1 : 0.4} className="cursor-pointer" onMouseEnter={() => setHoverIso(iso)} onMouseLeave={() => setHoverIso(null)} onClick={() => setSelIso(iso)} />;
          })}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] text-slate-500">색이 진할수록 {IND_LABEL[ind]}이 {ind === "unemp" ? "높음(실업 많음)" : "높음"}</span>
        <div className="rounded-lg border border-white/10 bg-slate-900/50 px-3 py-1.5 text-sm">
          <b className={NAME[capIso] ? "text-emerald-200" : "text-slate-300"}>{NAME[capIso] ?? GEO[capIso]?.name ?? capIso}</b>
          <span className="ml-2 font-mono text-white">{capVal != null ? pct(capVal) : "자료 없음"}</span>
          <span className="ml-1 text-xs text-slate-500">({year})</span>
        </div>
      </div>

      {/* 표 */}
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-400">{year}년 · {IND_LABEL[ind]} 순위 (총 {ranked.length}개국) · 행 클릭 → 아래 그래프</p>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="나라 검색" aria-label="나라 검색" className="w-32 rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-400/60" />
        </div>
        <div className="mt-1.5 max-h-[280px] overflow-y-auto rounded-xl border border-white/10 bg-slate-900/40">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-900">
              <tr className="text-slate-300">
                <th className="border-b border-white/10 px-3 py-1.5 text-left text-xs">순위·나라</th>
                <th className="border-b border-white/10 px-3 py-1.5 text-right text-xs">{IND_LABEL[ind]}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 80).map((c) => {
                const v = valOf(c.iso3, ind, yi), isSel = c.iso3 === selIso, isKor = c.iso3 === "KOR";
                return (
                  <tr key={c.iso3} onClick={() => setSelIso(c.iso3)} className={"cursor-pointer border-b border-white/5 last:border-none transition " + (isSel ? "bg-emerald-400/15" : isKor ? "bg-emerald-400/[0.06] hover:bg-white/5" : "hover:bg-white/5")}>
                    <td className="px-3 py-1.5 text-slate-200"><span className="mr-1.5 font-mono text-slate-500">{rankOf.get(c.iso3)}</span>{c.name}{isKor ? <span className="ml-1 text-emerald-300">🇰🇷</span> : null}</td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-emerald-200">{v != null ? pct(v) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 선택 국가 시계열 */}
      <div className="mt-3 rounded-xl border border-emerald-400/25 bg-slate-900/30 p-3">
        <p className="text-sm font-bold text-emerald-200">📉 {NAME[selIso] ?? GEO[selIso]?.name ?? selIso} — {IND_LABEL[ind]} 추이 (2000~2024)</p>
        <div className="mt-2"><LineChart xs={YEARS} series={[{ key: "sel", label: NAME[selIso] ?? selIso, color: `hsl(${hue},60%,55%)`, pts: selPts }]} formatY={(v) => `${Math.round(v)}`} yUnit="%" markIndex={yi} yFloor={0} yCap={100} /></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 합이 100%일까? (인구 구성 조작)
// ══════════════════════════════════════════════════════════════
const BOX = { W: 560, H: 150 };

function IdentityTab() {
  // 단위: 만 명. 초기값 ≈ 한국 2024(고용률 62.7%, 실업률 2.8%)
  const [employed, setEmployed] = useState(2890);
  const [unemployed, setUnemployed] = useState(80);
  const [inactive, setInactive] = useState(1640);

  const active = employed + unemployed; // 경제활동인구
  const pop15 = active + inactive; // 15세 이상 인구
  const empRate = pop15 ? (employed / pop15) * 100 : 0; // 고용률
  const employRate = active ? (employed / active) * 100 : 0; // 취업률
  const unempRate = active ? (unemployed / active) * 100 : 0; // 실업률

  const w = (n: number) => (pop15 ? (n / pop15) * BOX.W : 0);
  const wEmp = w(employed), wUnemp = w(unemployed), wInact = w(inactive);

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 인구 구성을 직접 바꿔 보세요. <b className="text-violet-200">취업률+실업률=100%</b>인데{" "}
        <b className="text-violet-200">고용률+실업률</b>은 100%가 될까요? 왜 그런지 확인해요.
      </p>

      {/* 인구 구성 막대 */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/50 p-3">
        <svg viewBox={`0 0 ${BOX.W} ${BOX.H}`} className="w-full select-none" role="img" aria-label="15세 이상 인구 구성">
          {/* 15세 이상 인구 전체 테두리 */}
          <rect x={0} y={26} width={BOX.W} height={54} rx={4} fill="none" stroke="#eab308" strokeWidth={1.5} />
          <text x={4} y={20} className="fill-yellow-300 text-[11px] font-bold">15세 이상 인구 = {pop15.toLocaleString()}만</text>
          {/* 취업자 */}
          <rect x={0} y={28} width={Math.max(0, wEmp - 1)} height={50} fill="#34d399" opacity={0.85} />
          <text x={Math.max(6, wEmp / 2)} y={57} textAnchor="middle" className="fill-slate-950 text-[10px] font-bold">취업자</text>
          {/* 실업자 */}
          <rect x={wEmp} y={28} width={Math.max(0, wUnemp - 1)} height={50} fill="#fb7185" opacity={0.85} />
          {wUnemp > 24 ? <text x={wEmp + wUnemp / 2} y={57} textAnchor="middle" className="fill-slate-950 text-[10px] font-bold">실업자</text> : null}
          {/* 비경제활동 */}
          <rect x={wEmp + wUnemp} y={28} width={Math.max(0, wInact - 1)} height={50} fill="#64748b" opacity={0.7} />
          {wInact > 40 ? <text x={wEmp + wUnemp + wInact / 2} y={57} textAnchor="middle" className="fill-slate-950 text-[10px] font-bold">비경제활동</text> : null}
          {/* 경제활동인구 괄호 */}
          <line x1={0} y1={88} x2={Math.max(0, wEmp + wUnemp)} y2={88} stroke="#a78bfa" strokeWidth={2} />
          <text x={Math.max(0, (wEmp + wUnemp) / 2)} y={102} textAnchor="middle" className="fill-violet-300 text-[10px] font-bold">경제활동인구 = {active.toLocaleString()}만 (취업률·실업률의 분모)</text>
          <line x1={0} y1={118} x2={BOX.W} y2={118} stroke="#eab308" strokeWidth={2} />
          <text x={BOX.W / 2} y={132} textAnchor="middle" className="fill-yellow-300 text-[10px] font-bold">15세 이상 인구 (고용률의 분모)</text>
        </svg>
      </div>

      {/* 슬라이더 */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <SliderBox label="취업자(만)" color="emerald" value={employed} setValue={setEmployed} max={4000} />
        <SliderBox label="실업자(만)" color="rose" value={unemployed} setValue={setUnemployed} max={600} />
        <SliderBox label="비경제활동(만)" color="slate" value={inactive} setValue={setInactive} max={3000} />
      </div>

      {/* 세 지표 */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <RateCard label="고용률" sub="취업자 ÷ 15세이상" value={empRate} color="emerald" />
        <RateCard label="취업률" sub="취업자 ÷ 경제활동" value={employRate} color="sky" />
        <RateCard label="실업률" sub="실업자 ÷ 경제활동" value={unempRate} color="rose" />
      </div>

      {/* 합 확인 */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/[0.10] px-4 py-3">
          <p className="text-xs text-slate-300">취업률 + 실업률</p>
          <p className="font-mono text-xl font-bold text-emerald-100">{pct(employRate)} + {pct(unempRate)} = {pct(employRate + unempRate)}</p>
          <p className="mt-0.5 text-xs text-emerald-300">✅ 항상 100% (분모가 같은 경제활동인구)</p>
        </div>
        <div className="rounded-xl border-2 border-rose-400/50 bg-rose-400/[0.08] px-4 py-3">
          <p className="text-xs text-slate-300">고용률 + 실업률</p>
          <p className="font-mono text-xl font-bold text-rose-100">{pct(empRate)} + {pct(unempRate)} = {pct(empRate + unempRate)}</p>
          <p className="mt-0.5 text-xs text-rose-300">{Math.abs(empRate + unempRate - 100) < 0.05 ? "지금은 비경제활동=0이라 100%!" : "❌ 100%가 아님 (분모가 15세이상 인구로 다름)"}</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border-l-4 border-violet-400 bg-violet-400/[0.08] px-4 py-2.5 text-sm text-slate-200">
        💡 <b className="text-sky-200">취업률</b>과 <b className="text-emerald-200">고용률</b>은 분자(취업자)는 같지만 <b>분모가 달라요</b>.
        비경제활동인구를 <b className="text-violet-200">0으로</b> 줄이면 고용률=취업률이 되고 고용률+실업률=100%가 돼요. 비경제활동인구가 많을수록 고용률은 취업률보다 낮아집니다.
      </div>
    </div>
  );
}

function SliderBox({ label, color, value, setValue, max }: { label: string; color: "emerald" | "rose" | "slate"; value: number; setValue: (n: number) => void; max: number }) {
  const accent = color === "emerald" ? "accent-emerald-400" : color === "rose" ? "accent-rose-400" : "accent-slate-400";
  const text = color === "emerald" ? "text-emerald-200" : color === "rose" ? "text-rose-200" : "text-slate-300";
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">{label}</span>
        <span className={"font-mono text-sm font-bold " + text}>{value.toLocaleString()}만</span>
      </div>
      <input type="range" min={0} max={max} step={10} value={value} onChange={(e) => setValue(Number(e.target.value))} aria-label={label} className={"mt-1 h-2 w-full cursor-pointer " + accent} />
    </div>
  );
}

function RateCard({ label, sub, value, color }: { label: string; sub: string; value: number; color: "emerald" | "sky" | "rose" }) {
  const c = color === "emerald" ? "border-emerald-400/45 bg-emerald-400/[0.10] text-emerald-200" : color === "sky" ? "border-sky-400/45 bg-sky-400/[0.10] text-sky-200" : "border-rose-400/45 bg-rose-400/[0.08] text-rose-200";
  const [border, bg, textc] = c.split(" ");
  return (
    <div className={"rounded-xl border px-3 py-2.5 " + border + " " + bg}>
      <p className="text-xs text-slate-400">{label} <span className="text-[10px] text-slate-500">({sub})</span></p>
      <p className={"font-mono text-2xl font-bold " + textc}>{pct(value)}</p>
    </div>
  );
}
