"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  WB_SOURCE,
  WB_LAST_UPDATED,
  YEARS,
  COUNTRIES,
  MATRIX,
  KOR,
} from "./data";
import { GEO, GEO_W, GEO_H } from "./geoData";

// ─── 성찰 (활동 고유 질문 4개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "nominal_vs_real",
    prompt:
      "탭①의 ‘규모’ 보기에서 명목 GDP와 실질 GDP의 격차가 해마다 벌어지는 까닭은 무엇인가요? ‘성장·물가’ 보기도 함께 보고, 경제가 실제로 얼마나 성장했는지 볼 때 왜 명목이 아니라 실질 GDP를 쓰는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 명목 GDP에는 물가 상승분이 섞여 있어 실질보다 크게 나온다. 생산량이 그대로여도 가격이 오르면 명목은 커지므로, 진짜 성장은 물가를 제거한 실질 GDP로 봐야 한다.",
  },
  {
    id: "deflator_cpi",
    prompt:
      "탭①의 ‘물가지수’ 보기에서 GDP 디플레이터와 소비자물가지수(CPI)가 함께 오르는 것을 관찰했나요? 둘 다 ‘물가’를 재는데 무엇이 다른지(측정 대상) 자신의 말로 정리해 보세요. (힌트: 디플레이터 = 명목GDP ÷ 실질GDP × 100)",
    kind: "text",
    placeholder:
      "예: CPI는 소비자가 사는 대표 상품 묶음의 물가를, GDP 디플레이터는 국내에서 생산된 모든 것의 물가를 잰다. 둘 다 물가가 오르면 함께 오르지만 대상 범위가 다르다.",
  },
  {
    id: "total_vs_percapita",
    prompt:
      "탭②에서 ‘GDP 총액’으로 볼 때와 ‘1인당 GDP’로 볼 때 지도의 색(순위)이 크게 달라지는 나라를 찾아 적어 보세요. 한 나라의 경제를 볼 때 총액과 1인당 중 무엇을 봐야 하는지가 상황에 따라 왜 달라질까요?",
    kind: "text",
    placeholder:
      "예: 인도·중국은 총액은 크지만 인구가 많아 1인당은 낮다. 나라 전체의 경제 규모는 총액으로, 국민 개개인의 생활 수준은 1인당으로 봐야 한다.",
  },
  {
    id: "gdp_vs_gnp",
    prompt:
      "탭③ 판정 퀴즈에서 ‘한국 안 외국기업의 생산’과 ‘해외에 있는 한국인의 생산’은 GDP·GNP 중 각각 어디에 포함되었나요? GDP는 ‘생산한 장소’, GNP·GNI는 ‘생산한 국민(국적)·소득’을 기준으로 한다는 점을 예를 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 한국 안 외국기업 생산은 GDP엔 포함(장소=국내)되지만 GNP엔 빠진다. 해외 한국인 생산은 반대로 GDP엔 빠지고 GNP·GNI엔 포함된다. GDP=장소, GNP=국적 기준.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function fmtKRW(won: number): string {
  return `${Math.round(won / 1e12).toLocaleString()}조원`;
}
function fmtUsd(usd: number): string {
  if (usd >= 1e12) return `${(usd / 1e12).toFixed(usd / 1e12 >= 10 ? 0 : 1)}조 달러`;
  if (usd >= 1e8) return `${Math.round(usd / 1e8).toLocaleString()}억 달러`;
  return `$${Math.round(usd).toLocaleString()}`;
}
function fmtUsdPerCap(usd: number): string {
  return `$${Math.round(usd).toLocaleString()}`;
}
function fmtPct(v: number, d = 1): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(d)}%`;
}
const yearIndex = (y: number) => y - YEARS[0];
const NAME: Record<string, string> = Object.fromEntries(COUNTRIES.map((c) => [c.iso3, c.name]));

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "korea" | "world" | "calc" | "quiz";

export default function GdpGrowthLab() {
  const [tab, setTab] = useState<Tab>("korea");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🌏 GDP와 경제성장률 탐험</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-emerald-200">세계은행 공식 데이터</b>로 한국 경제의 30년 흐름을 살펴보고, 세계
          여러 나라의 경제를 지도와 표로 비교한 뒤, 명목·실질 GDP와 GDP·GNP·GNI의 차이를 직접 계산·판정하며
          이해해 봐요.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          출처 {WB_SOURCE} · 최신 갱신 {WB_LAST_UPDATED}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "korea"} onClick={() => setTab("korea")}>
          ① 한국 경제지표 흐름
        </TabButton>
        <TabButton active={tab === "world"} onClick={() => setTab("world")}>
          ② 세계 여러 나라 비교
        </TabButton>
        <TabButton active={tab === "calc"} onClick={() => setTab("calc")}>
          ③ 명목·실질 계산 실험실
        </TabButton>
        <TabButton active={tab === "quiz"} onClick={() => setTab("quiz")}>
          ④ GDP·GNP·GNI 퀴즈
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "korea" ? <KoreaTab /> : null}
        {tab === "world" ? <WorldTab /> : null}
        {tab === "calc" ? <NominalRealLab /> : null}
        {tab === "quiz" ? <ClassifyQuiz /> : null}
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
// 공용 라인차트 (연도 x축, 다중 시리즈, 호버)
// ══════════════════════════════════════════════════════════════
type Series = { key: string; label: string; color: string; pts: (number | null)[] };
const LC = { W: 560, H: 250, X0: 56, X1: 546, Y0: 205, Y1: 20 };

function LineChart({
  xs,
  series,
  formatY,
  formatVal,
  markIndex,
  yUnit,
}: {
  xs: number[];
  series: Series[];
  formatY: (v: number) => string;
  formatVal: (v: number) => string;
  markIndex?: number | null;
  yUnit?: string;
}) {
  const [hoverI, setHoverI] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const L = xs.length;

  const { yMin, yMax } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const s of series) for (const v of s.pts) if (v != null) { if (v < lo) lo = v; if (v > hi) hi = v; }
    if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
    if (lo > 0) lo = Math.min(lo, 0); // 0 기준선 포함(성장률 등)
    const pad = (hi - lo) * 0.08 || 1;
    return { yMin: lo - pad * 0.2, yMax: hi + pad };
  }, [series]);

  const xAt = (i: number) => (L <= 1 ? LC.X0 : LC.X0 + (i / (L - 1)) * (LC.X1 - LC.X0));
  const yAt = (v: number) => LC.Y0 - ((v - yMin) / (yMax - yMin || 1)) * (LC.Y0 - LC.Y1);

  const yTicks = useMemo(() => {
    const t: number[] = [];
    for (let i = 0; i <= 4; i++) t.push(yMin + ((yMax - yMin) * i) / 4);
    return t;
  }, [yMin, yMax]);
  const xTicks = useMemo(() => {
    const step = Math.max(1, Math.ceil(L / 7));
    const t: number[] = [];
    for (let i = 0; i < L; i += step) t.push(i);
    if (t[t.length - 1] !== L - 1) t.push(L - 1);
    return t;
  }, [L]);

  function onMove(e: React.MouseEvent) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * LC.W;
    const i = Math.round(((svgX - LC.X0) / (LC.X1 - LC.X0)) * (L - 1));
    setHoverI(Math.max(0, Math.min(L - 1, i)));
  }

  const activeI = hoverI ?? markIndex ?? null;

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${LC.W} ${LC.H}`}
          className="w-full select-none"
          role="img"
          aria-label="연도별 지표 그래프"
          onMouseMove={onMove}
          onMouseLeave={() => setHoverI(null)}
        >
          <line x1={LC.X0} y1={LC.Y0} x2={LC.X1} y2={LC.Y0} stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
          <line x1={LC.X0} y1={LC.Y0} x2={LC.X0} y2={LC.Y1} stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={LC.X0} y1={yAt(v)} x2={LC.X1} y2={yAt(v)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={LC.X0 - 6} y={yAt(v) + 3} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">
                {formatY(v)}
              </text>
            </g>
          ))}
          {yMin < 0 && yMax > 0 ? (
            <line x1={LC.X0} y1={yAt(0)} x2={LC.X1} y2={yAt(0)} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="4 3" />
          ) : null}
          {xTicks.map((i) => (
            <text key={i} x={xAt(i)} y={LC.Y0 + 14} textAnchor="middle" className="fill-slate-400 font-mono text-[9px]">
              {String(xs[i]).slice(2)}
            </text>
          ))}
          {yUnit ? (
            <text x={LC.X0 + 2} y={LC.Y1 - 6} className="fill-slate-500 text-[9px]">
              {yUnit}
            </text>
          ) : null}

          {series.map((s) => {
            let d = "";
            s.pts.forEach((v, i) => {
              if (v == null) { d += " "; return; }
              d += (d.trim().endsWith("Z") || d === "" || s.pts[i - 1] == null ? "M" : "L") + xAt(i).toFixed(1) + " " + yAt(v).toFixed(1) + " ";
            });
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

      {/* 범례 + (호버/선택 연도) 값 */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {activeI !== null ? <span className="font-mono font-bold text-slate-200">{xs[activeI]}년</span> : null}
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 font-mono">
            <span className="inline-block h-2 w-3 rounded-sm" aria-hidden="true">
              <svg viewBox="0 0 12 8" className="h-2 w-3">
                <rect width={12} height={8} rx={2} fill={s.color} />
              </svg>
            </span>
            <span className="text-slate-300">{s.label}</span>
            {activeI !== null && s.pts[activeI] != null ? (
              <b className="text-white">{formatVal(s.pts[activeI] as number)}</b>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 한국 경제지표 흐름
// ══════════════════════════════════════════════════════════════
type KView = "size" | "rate" | "price";

function korSeriesValues(key: keyof typeof KOR, xs: number[]): (number | null)[] {
  const map = new Map(KOR[key].map((r) => [r.year, r.value]));
  return xs.map((y) => (map.has(y) ? (map.get(y) as number) : null));
}

function KoreaTab() {
  const [view, setView] = useState<KView>("size");
  const xs = useMemo(() => KOR.growth.map((r) => r.year), []);

  const size: Series[] = useMemo(
    () => [
      { key: "nom", label: "명목 GDP", color: "#34d399", pts: korSeriesValues("gdpNominalKRW", xs).map((v) => (v == null ? null : v / 1e12)) },
      { key: "real", label: "실질 GDP(2015년 가격)", color: "#fbbf24", pts: korSeriesValues("gdpRealKRW", xs).map((v) => (v == null ? null : v / 1e12)) },
      { key: "gni", label: "GNI", color: "#a78bfa", pts: korSeriesValues("gniKRW", xs).map((v) => (v == null ? null : v / 1e12)) },
    ],
    [xs]
  );

  const rate: Series[] = useMemo(() => {
    const defl = korSeriesValues("deflator", xs);
    const deflYoY = defl.map((v, i) => (i === 0 || v == null || defl[i - 1] == null ? null : (v / (defl[i - 1] as number) - 1) * 100));
    return [
      { key: "growth", label: "경제성장률(실질)", color: "#34d399", pts: korSeriesValues("growth", xs) },
      { key: "cpi", label: "물가상승률(CPI)", color: "#fb7185", pts: korSeriesValues("cpiInfl", xs) },
      { key: "deflYoY", label: "GDP디플레이터 상승률", color: "#fbbf24", pts: deflYoY },
    ];
  }, [xs]);

  const price: Series[] = useMemo(() => {
    const cpi = korSeriesValues("cpi", xs);
    const cpi2015 = KOR.cpi.find((r) => r.year === 2015)?.value ?? 100;
    const cpiReb = cpi.map((v) => (v == null ? null : (v / cpi2015) * 100));
    return [
      { key: "defl", label: "GDP디플레이터", color: "#34d399", pts: korSeriesValues("deflator", xs) },
      { key: "cpiReb", label: "소비자물가지수(CPI)", color: "#fb7185", pts: cpiReb },
    ];
  }, [xs]);

  const series = view === "size" ? size : view === "rate" ? rate : price;
  const formatY = view === "size" ? (v: number) => `${Math.round(v)}` : view === "rate" ? (v: number) => `${v.toFixed(0)}` : (v: number) => `${Math.round(v)}`;
  const formatVal = view === "size" ? (v: number) => `${v.toFixed(0)}조원` : view === "rate" ? (v: number) => `${v.toFixed(1)}%` : (v: number) => v.toFixed(1);
  const yUnit = view === "size" ? "조원" : view === "rate" ? "%" : "지수(2015=100)";

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 한국의 경제지표 30년(1995~2024) 흐름이에요. 보기를 바꿔 <b className="text-emerald-200">규모·성장·물가</b>를
        각각 살펴보세요. 그래프에 마우스를 올리면 연도별 값이 보여요.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <ViewButton active={view === "size"} onClick={() => setView("size")}>규모(조원)</ViewButton>
        <ViewButton active={view === "rate"} onClick={() => setView("rate")}>성장·물가(%)</ViewButton>
        <ViewButton active={view === "price"} onClick={() => setView("price")}>물가지수</ViewButton>
      </div>

      <div className="mt-3">
        <LineChart xs={xs} series={series} formatY={formatY} formatVal={formatVal} yUnit={yUnit} />
      </div>

      {/* 보기별 해설 */}
      <div className="mt-3 rounded-xl border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-4 py-3 text-sm text-slate-200">
        {view === "size" ? (
          <p>
            📈 <b className="text-emerald-200">명목 GDP</b>는 그해 가격으로, <b className="text-amber-200">실질 GDP</b>는
            2015년 가격으로 잰 값이에요. 둘의 <b>격차 = 물가 상승분</b>. 2024년 명목{" "}
            <b className="text-white">{fmtKRW(KOR.gdpNominalKRW.at(-1)!.value)}</b> vs 실질{" "}
            <b className="text-white">{fmtKRW(KOR.gdpRealKRW.at(-1)!.value)}</b>.
          </p>
        ) : view === "rate" ? (
          <p>
            📊 <b className="text-emerald-200">경제성장률</b>은 실질 GDP가 전년보다 얼마나 늘었는지(%)예요. 물가상승률과
            비교해 보세요. 성장률이 (−)였던 해(예: 1998 외환위기, 2020 코로나)를 찾아보세요.
          </p>
        ) : (
          <p>
            🔍 <b className="text-emerald-200">GDP디플레이터</b>와 <b className="text-rose-200">CPI</b>를 모두 2015=100으로
            맞췄어요. 둘 다 <b>물가</b>를 재기에 <b>함께 오릅니다</b>. 디플레이터 = 명목GDP ÷ 실질GDP × 100 으로, 국내
            생산물 전체의 물가를 반영해요.
          </p>
        )}
      </div>
    </div>
  );
}

function ViewButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " +
        (active ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 세계 여러 나라 비교 (지도 + 연도 + 국가 시계열)
// ══════════════════════════════════════════════════════════════
type Indicator = "gdp" | "gdpPerCap" | "growth" | "gniPerCap";
const IND_META: Record<Indicator, { label: string; kind: "seq" | "div"; fmt: (v: number) => string }> = {
  gdp: { label: "GDP 총액", kind: "seq", fmt: (v) => fmtUsd(v * 1e6) }, // 저장 단위 백만$
  gdpPerCap: { label: "1인당 GDP", kind: "seq", fmt: (v) => fmtUsdPerCap(v) },
  growth: { label: "경제성장률", kind: "div", fmt: (v) => fmtPct(v) },
  gniPerCap: { label: "1인당 GNI", kind: "seq", fmt: (v) => fmtUsdPerCap(v) },
};

function WorldTab() {
  const [ind, setInd] = useState<Indicator>("gdp");
  const [year, setYear] = useState<number>(YEARS[YEARS.length - 1]);
  const [selIso, setSelIso] = useState<string>("KOR");
  const [hoverIso, setHoverIso] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState(false);

  const yi = yearIndex(year);
  const meta = IND_META[ind];

  // 재생: 연도 자동 증가
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setYear((y) => {
        if (y >= YEARS[YEARS.length - 1]) return YEARS[0];
        return y + 1;
      });
    }, 650);
    return () => clearInterval(id);
  }, [playing]);

  // 색 척도 도메인(전 연도·전 국가 고정 → 연도 이동해도 색 의미 동일)
  const domain = useMemo(() => {
    if (meta.kind === "div") return { min: -8, max: 8 };
    let lo = Infinity;
    let hi = -Infinity;
    for (const iso in MATRIX) for (const v of MATRIX[iso][ind]) if (v != null && v > 0) { const l = Math.log(v); if (l < lo) lo = l; if (l > hi) hi = l; }
    return { min: lo, max: hi };
  }, [ind, meta.kind]);

  function colorFor(v: number | null): string {
    if (v == null) return "#293548";
    if (meta.kind === "div") {
      const t = Math.max(-1, Math.min(1, v / 8));
      if (t >= 0) return `hsl(160, 62%, ${78 - t * 42}%)`;
      return `hsl(2, 66%, ${78 + t * 40}%)`;
    }
    if (v <= 0) return "#293548";
    const t = Math.max(0, Math.min(1, (Math.log(v) - domain.min) / (domain.max - domain.min || 1)));
    return `hsl(160, 58%, ${84 - t * 54}%)`;
  }

  const valOf = (iso: string, y = yi): number | null => MATRIX[iso]?.[ind]?.[y] ?? null;

  // 표: 값 내림차순
  const ranked = useMemo(() => {
    const list = COUNTRIES.filter((c) => valOf(c.iso3) != null);
    list.sort((a, b) => (valOf(b.iso3) as number) - (valOf(a.iso3) as number));
    return list;
  }, [ind, yi]);
  const rankOf = useMemo(() => {
    const m = new Map<string, number>();
    ranked.forEach((c, i) => m.set(c.iso3, i + 1));
    return m;
  }, [ranked]);

  const filtered = query.trim()
    ? ranked.filter((c) => c.name.includes(query.trim()) || c.nameEn.toLowerCase().includes(query.trim().toLowerCase()))
    : ranked;

  const capIso = hoverIso ?? selIso;
  const capVal = valOf(capIso);

  // 선택 국가 시계열
  const selSeries: Series[] = useMemo(
    () => [{ key: "sel", label: NAME[selIso] ?? selIso, color: "#34d399", pts: (MATRIX[selIso]?.[ind] ?? YEARS.map(() => null)) as (number | null)[] }],
    [selIso, ind]
  );

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 지표와 연도를 바꿔 세계 여러 나라의 경제를 비교해요. <b className="text-emerald-200">지도의 색이 진할수록 값이 큰</b>{" "}
        나라예요. 지도나 표에서 나라를 클릭하면 그 나라의 <b className="text-emerald-200">시계열 추이</b>를 볼 수 있어요.
      </p>

      {/* 지표 선택 */}
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(IND_META) as Indicator[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setInd(k)}
            className={
              "rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " +
              (ind === k ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {IND_META[k].label}
          </button>
        ))}
      </div>

      {/* 연도 슬라이더 + 재생 */}
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="rounded-lg border border-emerald-400/45 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/20"
        >
          {playing ? "⏸ 정지" : "▶ 재생"}
        </button>
        <input
          type="range"
          min={YEARS[0]}
          max={YEARS[YEARS.length - 1]}
          step={1}
          value={year}
          onChange={(e) => { setYear(Number(e.target.value)); setPlaying(false); }}
          aria-label="연도"
          className="h-2 flex-1 cursor-pointer accent-emerald-400"
        />
        <span className="w-14 shrink-0 text-right font-mono text-lg font-bold text-emerald-200">{year}</span>
      </div>

      {/* 지도 */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/70">
        <svg viewBox={`0 0 ${GEO_W} ${GEO_H}`} className="w-full select-none" role="img" aria-label={`세계 ${meta.label} 지도 (${year}년)`}>
          {Object.entries(GEO).map(([iso, g]) => {
            const v = valOf(iso);
            const sel = iso === selIso;
            const hov = iso === hoverIso;
            return (
              <path
                key={iso}
                d={g.d}
                fill={colorFor(v)}
                stroke={sel ? "#f8fafc" : hov ? "#e2e8f0" : "rgba(2,6,23,0.6)"}
                strokeWidth={sel ? 1.4 : hov ? 1.1 : 0.4}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIso(iso)}
                onMouseLeave={() => setHoverIso(null)}
                onClick={() => setSelIso(iso)}
              />
            );
          })}
        </svg>
      </div>

      {/* 색 범례 + 캡션 */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Legend meta={meta} colorFor={colorFor} domain={domain} />
        <div className="rounded-lg border border-white/10 bg-slate-900/50 px-3 py-1.5 text-sm">
          <b className={NAME[capIso] ? "text-emerald-200" : "text-slate-300"}>{NAME[capIso] ?? GEO[capIso]?.name ?? capIso}</b>
          <span className="ml-2 font-mono text-white">{capVal != null ? meta.fmt(capVal) : "자료 없음"}</span>
          <span className="ml-1 text-xs text-slate-500">({year})</span>
        </div>
      </div>

      {/* 표(순위) */}
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            {year}년 · {meta.label} 순위 (총 {ranked.length}개국) · 행을 클릭하면 아래 그래프에 그 나라가 나와요
          </p>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="나라 검색"
            aria-label="나라 검색"
            className="w-32 rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-400/60"
          />
        </div>
        <div className="mt-1.5 max-h-[300px] overflow-y-auto rounded-xl border border-white/10 bg-slate-900/40">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-900">
              <tr className="text-slate-300">
                <th className="border-b border-white/10 px-3 py-1.5 text-left text-xs">순위·나라</th>
                <th className="border-b border-white/10 px-3 py-1.5 text-right text-xs">{meta.label}</th>
                <th className="border-b border-white/10 px-3 py-1.5 text-right text-xs">인구</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 80).map((c) => {
                const v = valOf(c.iso3);
                const isSel = c.iso3 === selIso;
                const isKor = c.iso3 === "KOR";
                return (
                  <tr
                    key={c.iso3}
                    onClick={() => setSelIso(c.iso3)}
                    className={
                      "cursor-pointer border-b border-white/5 last:border-none transition " +
                      (isSel ? "bg-emerald-400/15" : isKor ? "bg-emerald-400/[0.06] hover:bg-white/5" : "hover:bg-white/5")
                    }
                  >
                    <td className="px-3 py-1.5 text-slate-200">
                      <span className="mr-1.5 font-mono text-slate-500">{rankOf.get(c.iso3)}</span>
                      {c.name}
                      {isKor ? <span className="ml-1 text-emerald-300">🇰🇷</span> : null}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-emerald-200">{v != null ? meta.fmt(v) : "—"}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-slate-400">{c.pop != null ? `${(c.pop / 1e6).toFixed(1)}백만` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 80 ? <p className="mt-1 text-xs text-slate-500">상위 80개국 표시 · 검색으로 다른 나라를 찾아보세요</p> : null}
      </div>

      {/* 선택 국가 시계열 */}
      <div className="mt-3 rounded-xl border border-emerald-400/25 bg-slate-900/30 p-3">
        <p className="text-sm font-bold text-emerald-200">
          📉 {NAME[selIso] ?? GEO[selIso]?.name ?? selIso} — {meta.label} 추이 (2000~2024)
        </p>
        <div className="mt-2">
          <LineChart
            xs={YEARS}
            series={selSeries}
            formatY={ind === "gdp" ? (v) => `${(v / 1e6).toFixed(1)}` : ind === "gdpPerCap" || ind === "gniPerCap" ? (v) => `${Math.round(v / 1000)}k` : (v) => `${v.toFixed(0)}`}
            formatVal={(v) => meta.fmt(v)}
            markIndex={yi}
            yUnit={ind === "gdp" ? "조 달러" : ind === "gdpPerCap" || ind === "gniPerCap" ? "천 달러" : "%"}
          />
        </div>
      </div>
    </div>
  );
}

function Legend({
  meta,
  colorFor,
  domain,
}: {
  meta: { kind: "seq" | "div"; fmt: (v: number) => string };
  colorFor: (v: number | null) => string;
  domain: { min: number; max: number };
}) {
  // 대표 눈금값
  const stops =
    meta.kind === "div"
      ? [-8, -4, 0, 4, 8]
      : [domain.min, domain.min + (domain.max - domain.min) * 0.5, domain.max].map((l) => Math.exp(l));
  return (
    <div className="flex items-center gap-2">
      <div className="flex overflow-hidden rounded-md border border-white/10">
        {stops.map((v, i) => (
          <span key={i} className="h-3 w-6" aria-hidden="true">
            <svg viewBox="0 0 24 12" className="h-3 w-6">
              <rect width={24} height={12} fill={colorFor(v)} />
            </svg>
          </span>
        ))}
      </div>
      <span className="text-[10px] text-slate-500">
        {meta.kind === "div" ? "낮음(−) → 높음(+)" : "적음 → 많음"}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 명목·실질 GDP·디플레이터 계산 실험실
// ══════════════════════════════════════════════════════════════
type Preset = { label: string; q0: number; p0: number; q1: number; p1: number };
const PRESETS: Preset[] = [
  { label: "가격만 2배 (100개·1000→2000원)", q0: 100, p0: 1000, q1: 100, p1: 2000 },
  { label: "생산량↑·가격↑ (100→120개·1000→2000원)", q0: 100, p0: 1000, q1: 120, p1: 2000 },
  { label: "생산량만 증가 (100→120개·1000원)", q0: 100, p0: 1000, q1: 120, p1: 1000 },
];

const CALC_VB = { W: 360, H: 190, BASE: 150, TOP: 24 };

function NominalRealLab() {
  const [q0, setQ0] = useState(100);
  const [p0, setP0] = useState(1000);
  const [q1, setQ1] = useState(120);
  const [p1, setP1] = useState(2000);

  const nom0 = q0 * p0; // 기준연도 명목 = 실질
  const nom1 = q1 * p1; // 비교연도 명목
  const real1 = q1 * p0; // 비교연도 실질(기준연도 가격)
  const nomGrowth = nom0 ? (nom1 / nom0 - 1) * 100 : 0;
  const realGrowth = nom0 ? (real1 / nom0 - 1) * 100 : 0;
  const deflator = real1 ? (nom1 / real1) * 100 : 0;

  const maxBar = Math.max(nom0, nom1, real1, 1);
  const bars = [
    { label: "기준연도 GDP", sub: "2025", value: nom0, color: "#94a3b8" },
    { label: "명목 GDP", sub: "2026 · 그해 가격", value: nom1, color: "#34d399" },
    { label: "실질 GDP", sub: "2026 · 2025년 가격", value: real1, color: "#fbbf24" },
  ];
  const barH = (v: number) => (v / maxBar) * (CALC_VB.BASE - CALC_VB.TOP);

  return (
    <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.04] p-4">
      <p className="text-base font-bold text-amber-200">🧮 명목·실질 GDP·디플레이터 계산 실험실</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">
        사과 하나만 생산하는 나라예요. <b className="text-amber-200">기준연도(2025)</b>와{" "}
        <b className="text-emerald-200">비교연도(2026)</b>의 생산량·가격을 바꿔 보세요.{" "}
        <b>실질 GDP는 언제나 기준연도(2025) 가격</b>으로 계산해 물가 효과를 걷어냅니다.
      </p>

      <p className="mt-3 text-xs font-semibold text-slate-400">빠른 예시</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => { setQ0(p.q0); setP0(p.p0); setQ1(p.q1); setP1(p.p1); }}
            className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-400/20"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 입력 */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <YearInputs title="🍎 기준연도 (2025)" accent="amber" q={q0} p={p0} setQ={setQ0} setP={setP0} />
        <YearInputs title="🍎 비교연도 (2026)" accent="emerald" q={q1} p={p1} setQ={setQ1} setP={setP1} />
      </div>

      {/* 시각화 — 세 막대 한눈에 */}
      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/50 p-4">
        <p className="text-xs font-semibold text-slate-300">한눈에 보기 — GDP 크기 비교</p>
        <div className="mt-1 overflow-x-auto">
          <svg viewBox={`0 0 ${CALC_VB.W} ${CALC_VB.H}`} className="w-full select-none" role="img" aria-label="명목·실질 GDP 막대 비교">
            <line x1={20} y1={CALC_VB.BASE} x2={CALC_VB.W - 8} y2={CALC_VB.BASE} stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
            {bars.map((b, i) => {
              const bw = 74;
              const gap = (CALC_VB.W - 30 - bars.length * bw) / (bars.length + 1);
              const x = 20 + gap + i * (bw + gap);
              const h = barH(b.value);
              return (
                <g key={b.label}>
                  <rect x={x} y={CALC_VB.BASE - h} width={bw} height={h} rx={3} fill={b.color} opacity={0.9} />
                  <text x={x + bw / 2} y={CALC_VB.BASE - h - 6} textAnchor="middle" className="fill-white font-mono text-[11px] font-bold">
                    {b.value.toLocaleString()}
                  </text>
                  <text x={x + bw / 2} y={CALC_VB.BASE + 14} textAnchor="middle" className="fill-slate-200 text-[10px] font-bold">
                    {b.label}
                  </text>
                  <text x={x + bw / 2} y={CALC_VB.BASE + 25} textAnchor="middle" className="fill-slate-500 text-[9px]">
                    {b.sub}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="mt-1 text-[11px] leading-5 text-slate-400">
          <b className="text-emerald-300">명목</b> vs <b className="text-amber-300">실질</b>의 차이 = <b>물가(가격) 효과</b> ·{" "}
          <b className="text-amber-300">실질</b> vs <b className="text-slate-300">기준연도</b>의 차이 = <b>생산량(진짜 성장) 효과</b>
        </p>
      </div>

      {/* 결과 카드 */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <StatCard label="명목 성장률" value={fmtPct(nomGrowth)} sub="그해 가격 기준(물가 포함)" tone="slate" />
        <StatCard label="실질 성장률 (진짜 성장)" value={fmtPct(realGrowth)} sub="기준연도 가격 기준" tone="emerald" big />
        <StatCard label="GDP디플레이터" value={deflator.toFixed(1)} sub="명목 ÷ 실질 × 100" tone="rose" />
      </div>

      {/* 계산식 상세(작게) */}
      <div className="mt-2 grid gap-2 font-mono text-[11px] text-slate-400 sm:grid-cols-2">
        <p className="rounded-lg bg-slate-950/40 px-3 py-1.5">명목 GDP = {q1} × {p1.toLocaleString()} = <b className="text-emerald-200">{nom1.toLocaleString()}원</b></p>
        <p className="rounded-lg bg-slate-950/40 px-3 py-1.5">실질 GDP = {q1} × {p0.toLocaleString()} = <b className="text-amber-200">{real1.toLocaleString()}원</b></p>
      </div>

      <div className="mt-3 rounded-xl border-l-4 border-amber-400 bg-amber-400/[0.08] px-4 py-2.5 text-sm text-slate-200">
        {Math.abs(realGrowth) < 0.01 && Math.abs(nomGrowth) > 0.01 ? (
          <p>💡 생산량이 그대로면 <b className="text-emerald-200">실질 성장률은 0%</b>예요! 명목이 커진 건 순전히 <b className="text-rose-200">물가(가격)</b> 때문이죠. 그래서 진짜 성장은 실질로 봐야 해요.</p>
        ) : (
          <p>💡 <b className="text-rose-200">GDP디플레이터 = 명목 ÷ 실질 × 100</b>. 100보다 크면 기준연도보다 물가가 오른 거예요. 지금은 <b className="text-white">{deflator.toFixed(1)}</b> → 물가가 약 <b className="text-rose-200">{Math.max(0, deflator - 100).toFixed(0)}%</b> 올랐다는 뜻.</p>
        )}
      </div>
    </div>
  );
}

function YearInputs({
  title,
  accent,
  q,
  p,
  setQ,
  setP,
}: {
  title: string;
  accent: "amber" | "emerald";
  q: number;
  p: number;
  setQ: (n: number) => void;
  setP: (n: number) => void;
}) {
  const ring = accent === "amber" ? "border-amber-400/40" : "border-emerald-400/40";
  const text = accent === "amber" ? "text-amber-200" : "text-emerald-200";
  return (
    <div className={"rounded-xl border bg-slate-900/50 px-4 py-3 " + ring}>
      <p className={"text-sm font-bold " + text}>{title}</p>
      <label className="mt-2.5 flex items-center justify-between text-sm text-slate-300">
        생산량(개)
        <input type="number" min={0} value={q} onChange={(e) => setQ(Math.max(0, Number(e.target.value)))} className="w-28 rounded-md border border-white/10 bg-slate-900 px-2 py-1.5 text-right font-mono text-base text-white outline-none focus:border-emerald-400/60" />
      </label>
      <label className="mt-2 flex items-center justify-between text-sm text-slate-300">
        가격(원)
        <input type="number" min={0} value={p} onChange={(e) => setP(Math.max(0, Number(e.target.value)))} className="w-28 rounded-md border border-white/10 bg-slate-900 px-2 py-1.5 text-right font-mono text-base text-white outline-none focus:border-emerald-400/60" />
      </label>
    </div>
  );
}

function StatCard({ label, value, sub, tone, big }: { label: string; value: string; sub: string; tone: "amber" | "emerald" | "rose" | "slate"; big?: boolean }) {
  const map = {
    amber: "border-amber-400/40 bg-amber-400/[0.08] text-amber-200",
    emerald: "border-emerald-400/45 bg-emerald-400/[0.10] text-emerald-200",
    rose: "border-rose-400/40 bg-rose-400/[0.08] text-rose-200",
    slate: "border-white/10 bg-slate-900/50 text-slate-200",
  } as const;
  const [border, value_c] = [map[tone].split(" ").slice(0, 2).join(" "), map[tone].split(" ")[2]];
  return (
    <div className={"rounded-xl border px-3 py-2.5 " + border}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={"mt-0.5 font-mono font-bold " + (big ? "text-2xl" : "text-xl") + " " + value_c}>{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ GDP·GNP·GNI 판정 퀴즈 (카드형 · 한 문제씩)
// ══════════════════════════════════════════════════════════════
type Cat = "both" | "gdp" | "gnp" | "none";
type Scenario = { id: string; icon: string; text: string; answer: Cat; why: string };
const CAT_LABEL: Record<Cat, string> = { both: "GDP·GNP 둘 다", gdp: "GDP만", gnp: "GNP·GNI만", none: "둘 다 아님" };
const CAT_ORDER: Cat[] = ["both", "gdp", "gnp", "none"];

const SCENARIOS: Scenario[] = [
  { id: "s1", icon: "🏭", text: "한국 안 삼성 공장에서 한국 노동자가 만든 반도체", answer: "both", why: "국내(장소) + 한국 국민(국적) → GDP·GNP 모두 포함." },
  { id: "s2", icon: "🚗", text: "한국에 있는 미국 자동차회사 공장의 생산", answer: "gdp", why: "생산 장소가 국내라 GDP엔 포함, 국적이 외국이라 GNP엔 제외." },
  { id: "s3", icon: "🌐", text: "미국에 진출한 한국 기업 공장의 생산", answer: "gnp", why: "장소가 국외라 GDP 제외, 한국 국민의 생산이라 GNP·GNI엔 포함." },
  { id: "s4", icon: "💵", text: "해외에서 일하는 한국인이 받은 임금", answer: "gnp", why: "국외 소득이지만 한국 국민의 소득 → GNP·GNI 포함, GDP 제외." },
  { id: "s5", icon: "♻️", text: "작년에 만든 재고 자동차를 올해 중고로 되판 것", answer: "none", why: "올해 새로 생산된 것이 아니어서 어느 지표에도 포함 안 됨(신규 생산 아님)." },
  { id: "s6", icon: "🌾", text: "빵을 만들기 위해 쓴 밀가루(중간재)의 가치", answer: "none", why: "최종재(빵)에 이미 포함 → 중간재는 따로 더하지 않음." },
  { id: "s7", icon: "🛣️", text: "정부가 국내에 새로 놓은 도로(정부지출 G)", answer: "both", why: "국내에서 새로 생산된 최종 산출 → GDP·GNP 모두 포함." },
  { id: "s8", icon: "🏠", text: "부모님이 집에서 하신 가사노동", answer: "none", why: "시장에서 거래되지 않아 GDP·GNP 어디에도 포함되지 않음." },
];

function ClassifyQuiz() {
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<Record<string, Cat>>({});
  const [finished, setFinished] = useState(false);

  const total = SCENARIOS.length;
  const score = SCENARIOS.filter((s) => ans[s.id] === s.answer).length;
  function reset() { setStep(0); setAns({}); setFinished(false); }

  if (finished) {
    return (
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <p className="text-base font-bold text-violet-200">🏁 판정 퀴즈 결과</p>
        <div className="mt-3 flex justify-center">
          <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/10 px-8 py-4 text-center">
            <p className="font-mono text-3xl font-bold text-emerald-100">{score} / {total}</p>
            <p className="mt-1 text-xs text-slate-300">{score === total ? "완벽해요! 🎉" : score >= total * 0.6 ? "잘했어요! 👍" : "다시 도전해 볼까요?"}</p>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          {SCENARIOS.map((s) => {
            const ok = ans[s.id] === s.answer;
            return (
              <div key={s.id} className="flex items-start gap-2 rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-xs">
                <span className="mt-0.5">{ok ? "✅" : "❌"}</span>
                <div>
                  <p className="text-slate-200">{s.icon} {s.text}</p>
                  <p className="mt-0.5 text-slate-400">
                    정답: <b className="text-emerald-200">{CAT_LABEL[s.answer]}</b>
                    {ans[s.id] && !ok ? <> · 내 답: <span className="text-rose-300">{CAT_LABEL[ans[s.id]]}</span></> : null} — {s.why}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <ComparisonTable />

        <div className="mt-3 flex justify-center">
          <button type="button" onClick={reset} className="rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25">
            ↺ 다시 풀기
          </button>
        </div>
      </div>
    );
  }

  const s = SCENARIOS[step];
  const chosen = ans[s.id];
  const revealed = chosen !== undefined;
  const isLast = step === total - 1;

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
      <p className="text-base font-bold text-violet-200">🧭 GDP·GNP·GNI 판정 퀴즈</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">
        <b className="text-violet-200">GDP = 생산한 ‘장소’(국내)</b> · <b className="text-violet-200">GNP·GNI = 생산한 ‘국민(국적)’·소득</b> 기준.
        각 항목이 한국의 어디에 포함될지 골라 보세요.
      </p>

      {/* 진행바 */}
      <div className="mt-3 flex items-center gap-3">
        <span className="shrink-0 font-mono text-xs font-bold text-slate-300">문제 {step + 1} / {total}</span>
        <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="h-1.5 flex-1" aria-hidden="true">
          <rect width={100} height={6} rx={3} fill="rgba(255,255,255,0.08)" />
          <rect width={((step + (revealed ? 1 : 0)) / total) * 100} height={6} rx={3} fill="#a78bfa" />
        </svg>
        <span className="shrink-0 font-mono text-xs text-slate-400">점수 {score}</span>
      </div>

      {/* 문제 카드 */}
      <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">{s.icon}</span>
          <p className="text-lg font-bold leading-7 text-slate-100">{s.text}</p>
        </div>
        <p className="mt-1 text-xs text-slate-500">→ 한국의 GDP·GNP·GNI 중 어디에 포함될까요?</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {CAT_ORDER.map((cat) => {
            const sel = chosen === cat;
            const showRight = revealed && cat === s.answer;
            const showWrong = revealed && sel && cat !== s.answer;
            return (
              <button
                key={cat}
                type="button"
                disabled={revealed}
                onClick={() => setAns((a) => ({ ...a, [s.id]: cat }))}
                className={
                  "rounded-xl border-2 px-3 py-3 text-sm font-bold transition " +
                  (showRight
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : showWrong
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : sel
                        ? "border-violet-400/60 bg-violet-400/15 text-violet-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10")
                }
              >
                {CAT_LABEL[cat]}
                {showRight ? " ✓" : showWrong ? " ✕" : ""}
              </button>
            );
          })}
        </div>

        {revealed ? (
          <div className={"mt-3 rounded-xl border-l-4 px-4 py-2.5 " + (chosen === s.answer ? "border-emerald-400 bg-emerald-400/[0.08]" : "border-amber-400 bg-amber-400/[0.08]")}>
            <p className={"text-sm font-bold " + (chosen === s.answer ? "text-emerald-100" : "text-amber-100")}>
              {chosen === s.answer ? "정답이에요! ✅" : `아쉬워요 — 정답은 ‘${CAT_LABEL[s.answer]}’`}
            </p>
            <p className="mt-0.5 text-xs text-slate-300">{s.why}</p>
          </div>
        ) : null}
      </div>

      {/* 네비게이션 */}
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((n) => Math.max(0, n - 1))}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
        >
          ← 이전
        </button>
        <button
          type="button"
          disabled={!revealed}
          onClick={() => (isLast ? setFinished(true) : setStep((n) => n + 1))}
          className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-5 py-1.5 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25 disabled:opacity-40"
        >
          {isLast ? "결과 보기 →" : "다음 문제 →"}
        </button>
      </div>
    </div>
  );
}

function ComparisonTable() {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="text-violet-100">
            <th className="border-b border-white/10 px-3 py-1.5 text-left">구분</th>
            <th className="border-b border-white/10 px-3 py-1.5">GDP</th>
            <th className="border-b border-white/10 px-3 py-1.5">GNP</th>
            <th className="border-b border-white/10 px-3 py-1.5">GNI</th>
          </tr>
        </thead>
        <tbody className="text-slate-300">
          <tr className="border-b border-white/5">
            <td className="px-3 py-1.5 font-bold text-slate-200">기준</td>
            <td className="px-3 py-1.5 text-center">국내에서 생산</td>
            <td className="px-3 py-1.5 text-center">국민이 생산</td>
            <td className="px-3 py-1.5 text-center">국민이 얻은 소득</td>
          </tr>
          <tr>
            <td className="px-3 py-1.5 font-bold text-slate-200">현재 활용</td>
            <td className="px-3 py-1.5 text-center">경제 규모 대표</td>
            <td className="px-3 py-1.5 text-center">거의 안 씀</td>
            <td className="px-3 py-1.5 text-center">생활 수준 평가</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
