"use client";

import { useId, useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 수학 ─────────────────────────────────────────────────
const TAU = 2 * Math.PI;
const FWHM_FACTOR = 2 * Math.sqrt(2 * Math.log(2)); // ≈ 2.3548
function pdf(x: number, mu: number, si: number) {
  return Math.exp(-0.5 * ((x - mu) / si) ** 2) / (si * Math.sqrt(TAU));
}
function fmt(v: number, d = 2) {
  return v.toFixed(d);
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "mu_vs_sigma_effect",
    prompt:
      "μ만 바꿀 때와 σ만 바꿀 때 정규분포 곡선이 각각 어떻게 달라졌는지, 직접 슬라이더를 움직여 본 결과로 설명해 보세요.",
    kind: "text",
    placeholder: "예: μ를 바꾸면 곡선이 좌우로 평행이동만 하고 모양은 그대로다. σ를 키우면 곡선이 넓고 낮아지고, 줄이면 좁고 높아진다.",
  },
  {
    id: "empirical_rule_meaning",
    prompt:
      "경험법칙(μ±σ ≈ 68%, μ±2σ ≈ 95%, μ±3σ ≈ 99.7%)이 어떤 의미인지, 그리고 어떤 μ·σ를 골라도 곡선 아래 넓이가 항상 1인 이유를 자신의 말로 적어 보세요.",
    kind: "text",
    placeholder: "예: μ가 어디든 σ가 얼마든 ‘평균±σ’ 안에 데이터의 약 68%가 들어간다는 뜻이다. σ가 커져 곡선이 낮아져도 가로로 펼쳐져서 총 넓이는 1을 유지한다.",
  },
];

// ─── 메인 ─────────────────────────────────────────────────
type TabKey = "single" | "compare";

export default function NormalCompareP5() {
  const [tab, setTab] = useState<TabKey>("single");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">📊 정규분포곡선 탐색기</h3>
        <p className="mt-2 leading-7 text-slate-300">
          슬라이더로 <b className="text-violet-300">평균 μ</b>와 <b className="text-amber-300">표준편차 σ</b>를 바꾸며
          정규분포 곡선의 모양 변화를 실시간으로 탐색하고, 두 곡선을 옆에 두고 비교해 보세요.
        </p>
      </div>

      {/* 탭 */}
      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "single"} onClick={() => setTab("single")}>🔍 단일 곡선 탐색</TabButton>
        <TabButton active={tab === "compare"} onClick={() => setTab("compare")}>📊 두 곡선 비교</TabButton>
      </div>

      {/* 동시 마운트로 슬라이더 상태 보존 */}
      <div className={tab === "single" ? "mt-4" : "mt-4 hidden"}>
        <SinglePane />
      </div>
      <div className={tab === "compare" ? "mt-4" : "mt-4 hidden"}>
        <ComparePane />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl border-2 border-violet-400/50 bg-violet-500/15 px-4 py-2 text-sm font-bold text-violet-200 shadow-[0_0_16px_rgba(99,102,241,0.2)]"
          : "rounded-xl border-2 border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-400 hover:bg-white/10"
      }
    >
      {children}
    </button>
  );
}

// ═════════════════════════════════════════════════════════
// 단일 곡선 탐색
// ═════════════════════════════════════════════════════════

function SinglePane() {
  // 슬라이더는 정수 단위로 저장(0.1 단위 → ×10)
  const [muT, setMuT] = useState(0); // μ×10
  const [siT, setSiT] = useState(10); // σ×10
  const mu = muT / 10;
  const si = siT / 10;
  const peak = pdf(mu, mu, si);

  function preset(muVal: number, siVal: number) {
    setMuT(Math.round(muVal * 10));
    setSiT(Math.round(siVal * 10));
  }

  const obs = useMemo(() => buildSingleObservations(mu, si, peak), [mu, si, peak]);

  return (
    <div className="space-y-3">
      {/* 컨트롤 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-violet-300">⚙️ 파라미터 조절</p>
        <RangeRow
          label={<>μ (평균) — 곡선의 <em>위치</em>를 결정합니다</>}
          tone="violet"
          value={muT}
          display={fmt(mu, 1)}
          min={-40} max={40} step={1}
          onChange={setMuT}
        />
        <RangeRow
          label={<>σ (표준편차) — 곡선의 <em>퍼짐</em>을 결정합니다</>}
          tone="orange"
          value={siT}
          display={fmt(si, 1)}
          min={3} max={30} step={1}
          onChange={setSiT}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">빠른 설정 →</span>
          <PresetButton onClick={() => preset(0, 1)}>표준정규 N(0,1)</PresetButton>
          <PresetButton onClick={() => preset(0, 0.5)}>좁은 곡선 σ=0.5</PresetButton>
          <PresetButton onClick={() => preset(0, 2)}>넓은 곡선 σ=2.0</PresetButton>
          <PresetButton onClick={() => preset(3, 1)}>오른쪽 이동 μ=3</PresetButton>
        </div>
      </div>

      {/* 캔버스(SVG) */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-0">
        <NormalCurveSVG mu={mu} si={si} mode="single" />
      </div>

      {/* 경험 법칙 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-amber-300">📐 경험 법칙 (68 − 95 − 99.7)</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <EmpCard tone="violet" pct="68.3%" range={`${fmt(mu - si)} ~ ${fmt(mu + si)}`} label="μ ± 1σ 구간" />
          <EmpCard tone="emerald" pct="95.4%" range={`${fmt(mu - 2 * si)} ~ ${fmt(mu + 2 * si)}`} label="μ ± 2σ 구간" />
          <EmpCard tone="amber" pct="99.7%" range={`${fmt(mu - 3 * si)} ~ ${fmt(mu + 3 * si)}`} label="μ ± 3σ 구간" />
        </div>
        {/* 시각 밴드 */}
        <div className="mt-4">
          <EmpiricalBand />
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-emerald-300">📋 곡선 정보</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <StatCard val={fmt(mu)} label="평균 μ" />
          <StatCard val={fmt(si)} label="표준편차 σ" />
          <StatCard val={fmt(si * si)} label="분산 σ²" />
          <StatCard val={fmt(peak, 4)} label="최댓값 f(μ)" tone="amber" />
          <StatCard val={fmt(FWHM_FACTOR * si, 3)} label="반치전폭 FWHM" tone="emerald" />
        </div>
      </div>

      {/* 관찰 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-pink-300">💡 탐구 관찰</p>
        <div className="mt-3 space-y-2">
          {obs.map((o, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <span className="text-xl leading-tight">{o.icon}</span>
              <p className="text-sm leading-6 text-slate-300" dangerouslySetInnerHTML={{ __html: o.html }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildSingleObservations(mu: number, si: number, peak: number): { icon: string; html: string }[] {
  const items: { icon: string; html: string }[] = [];
  if (Math.abs(mu) < 0.15) {
    items.push({ icon: "↔️", html: "현재 μ = 0입니다. 곡선이 <strong>원점에 대칭</strong>으로 놓여 있습니다." });
  } else {
    const dir = mu > 0 ? "오른쪽" : "왼쪽";
    items.push({ icon: "↔️", html: `μ = ${fmt(mu)}으로 곡선이 ${dir}에 위치합니다. μ를 바꾸면 곡선이 <strong>좌우로 평행이동</strong>할 뿐, 모양(폭·높이)은 전혀 변하지 않습니다.` });
  }
  if (si <= 0.6) {
    items.push({ icon: "📏", html: `σ = ${fmt(si)} — 아주 <strong>좁고 높은 첨봉형</strong> 곡선입니다. 데이터가 평균 주변에 매우 밀집되어 있음을 의미합니다.` });
  } else if (si >= 2.2) {
    items.push({ icon: "📏", html: `σ = ${fmt(si)} — 아주 <strong>넓고 낮은 완만형</strong> 곡선입니다. 데이터가 넓은 범위에 고르게 퍼져 있음을 의미합니다.` });
  } else {
    items.push({ icon: "📏", html: `σ = ${fmt(si)}입니다. σ가 커질수록 곡선은 <strong>넓고 낮게</strong>, 작아질수록 <strong>좁고 높게</strong> 변합니다.` });
  }
  items.push({ icon: "🔺", html: `최댓값 f(μ) = <strong>${fmt(peak, 4)}</strong>은 σ에 반비례합니다.<br/>σ가 2배 → 최댓값은 ½배, σ가 ½배 → 최댓값은 2배.` });
  items.push({ icon: "∫", html: "어떤 μ·σ 값을 사용해도 <strong>곡선 아래의 넓이는 항상 1</strong>입니다.<br/>σ가 커져 곡선이 낮아지는 대신, 더 넓게 펼쳐져 총 넓이를 보존합니다." });
  return items;
}

// ═════════════════════════════════════════════════════════
// 두 곡선 비교
// ═════════════════════════════════════════════════════════

type CmpPreset = { muA: number; siA: number; muB: number; siB: number; label: string };
const CMP_PRESETS: CmpPreset[] = [
  { muA: -2, siA: 1.0, muB: 2, siB: 1.0, label: "μ만 다를 때" },
  { muA: 0, siA: 0.7, muB: 0, siB: 2.0, label: "σ만 다를 때" },
  { muA: -1, siA: 0.8, muB: 2, siB: 1.6, label: "둘 다 다를 때" },
  { muA: -3, siA: 1.2, muB: 3, siB: 1.2, label: "대칭 배치" },
];

function ComparePane() {
  const [muAT, setMuAT] = useState(-20);
  const [siAT, setSiAT] = useState(10);
  const [muBT, setMuBT] = useState(20);
  const [siBT, setSiBT] = useState(10);
  const [activePreset, setActivePreset] = useState<number | null>(0);

  function applyPreset(i: number) {
    const p = CMP_PRESETS[i];
    setMuAT(Math.round(p.muA * 10));
    setSiAT(Math.round(p.siA * 10));
    setMuBT(Math.round(p.muB * 10));
    setSiBT(Math.round(p.siB * 10));
    setActivePreset(i);
  }

  const muA = muAT / 10, siA = siAT / 10, muB = muBT / 10, siB = siBT / 10;
  const peakA = pdf(muA, muA, siA);
  const peakB = pdf(muB, muB, siB);
  const insights = useMemo(
    () => buildCompareInsights(muA, siA, peakA, muB, siB, peakB),
    [muA, siA, peakA, muB, siB, peakB]
  );

  function changeMu(setter: (v: number) => void) {
    return (v: number) => { setter(v); setActivePreset(null); };
  }
  function changeSi(setter: (v: number) => void) {
    return (v: number) => { setter(v); setActivePreset(null); };
  }

  return (
    <div className="space-y-3">
      {/* 프리셋 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-bold text-slate-300">🎯 비교 시나리오 프리셋</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CMP_PRESETS.map((p, i) => (
            <PresetButton key={i} onClick={() => applyPreset(i)} active={i === activePreset}>
              {`${["①", "②", "③", "④"][i]} ${p.label}`}
            </PresetButton>
          ))}
        </div>
      </div>

      {/* 두 곡선 컨트롤 */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-indigo-400/45 bg-white/5 p-5">
          <p className="text-sm font-bold text-indigo-300">🔵 곡선 A</p>
          <RangeRow label="μ_A" tone="violet" value={muAT} display={fmt(muA, 1)} min={-40} max={40} step={1} onChange={changeMu(setMuAT)} />
          <RangeRow label="σ_A" tone="orange" value={siAT} display={fmt(siA, 1)} min={3} max={30} step={1} onChange={changeSi(setSiAT)} />
        </div>
        <div className="rounded-2xl border-2 border-orange-400/45 bg-white/5 p-5">
          <p className="text-sm font-bold text-orange-300">🟠 곡선 B</p>
          <RangeRow label="μ_B" tone="amber" value={muBT} display={fmt(muB, 1)} min={-40} max={40} step={1} onChange={changeMu(setMuBT)} />
          <RangeRow label="σ_B" tone="rose" value={siBT} display={fmt(siB, 1)} min={3} max={30} step={1} onChange={changeSi(setSiBT)} />
        </div>
      </div>

      {/* 비교 캔버스 */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-0">
        <NormalCurveSVG mu={muA} si={siA} mode="compare" muB={muB} siB={siB} />
      </div>

      {/* 비교 분석 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-amber-300">🔍 비교 분석</p>
        <div className="mt-3 space-y-2">
          {insights.map((it, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${it.cls}`}
            >
              <span className="text-xl leading-tight">{it.icon}</span>
              <p className="text-sm leading-6 text-slate-300" dangerouslySetInnerHTML={{ __html: it.html }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type CmpInsight = { icon: string; html: string; cls: string };
function buildCompareInsights(muA: number, siA: number, peakA: number, muB: number, siB: number, peakB: number): CmpInsight[] {
  const items: CmpInsight[] = [];
  const muSame = Math.abs(muA - muB) < 0.2;
  const siSame = Math.abs(siA - siB) < 0.15;

  if (muSame) {
    items.push({
      icon: "↔️",
      cls: "border-indigo-400/25 bg-indigo-400/[0.08]",
      html: `두 곡선의 평균이 거의 같습니다 (μ ≈ ${fmt((muA + muB) / 2)}). 평균이 같으면 곡선은 <strong>같은 위치</strong>에 있습니다.`,
    });
  } else {
    const dir = muA < muB ? "곡선 A가 왼쪽, 곡선 B가 오른쪽" : "곡선 B가 왼쪽, 곡선 A가 오른쪽";
    items.push({
      icon: "↔️",
      cls: "border-indigo-400/25 bg-indigo-400/[0.08]",
      html: `${dir}에 위치합니다. 평균 차이: |μ_A − μ_B| = <strong>${fmt(Math.abs(muA - muB))}</strong>`,
    });
  }

  if (siSame) {
    items.push({
      icon: "📏",
      cls: "border-emerald-400/25 bg-emerald-400/[0.08]",
      html: `표준편차가 같아 (σ ≈ ${fmt((siA + siB) / 2)}) 두 곡선의 <strong>폭과 높이가 동일</strong>합니다. μ만 다르면 곡선은 단순히 평행이동합니다.`,
    });
  } else if (siA < siB) {
    items.push({
      icon: "📏",
      cls: "border-emerald-400/25 bg-emerald-400/[0.08]",
      html: `σ_A(${fmt(siA)}) &lt; σ_B(${fmt(siB)}) → <strong>곡선 A가 좁고 높으며</strong>, 곡선 B는 더 넓고 낮습니다. 표준편차가 클수록 데이터가 더 넓게 퍼집니다.`,
    });
  } else {
    items.push({
      icon: "📏",
      cls: "border-emerald-400/25 bg-emerald-400/[0.08]",
      html: `σ_A(${fmt(siA)}) &gt; σ_B(${fmt(siB)}) → <strong>곡선 B가 좁고 높으며</strong>, 곡선 A는 더 넓고 낮습니다.`,
    });
  }

  const peakSame = Math.abs(peakA - peakB) < 0.002;
  items.push({
    icon: "🔺",
    cls: "border-amber-400/25 bg-amber-400/[0.08]",
    html:
      `최댓값: A = <strong>${fmt(peakA, 4)}</strong>, B = <strong>${fmt(peakB, 4)}</strong>. ` +
      (peakSame
        ? "두 값이 거의 같습니다 (σ가 같기 때문)."
        : peakA > peakB
        ? "σ_A가 작아 A의 최댓값이 더 큽니다."
        : "σ_B가 작아 B의 최댓값이 더 큽니다."),
  });

  items.push({
    icon: "∫",
    cls: "border-pink-400/25 bg-pink-400/[0.08]",
    html: "두 곡선의 넓이는 모두 <strong>1</strong>입니다. σ가 커져 곡선이 낮아지더라도, 양쪽으로 펼쳐져 총 확률의 합은 항상 1을 유지합니다.",
  });
  return items;
}

// ═════════════════════════════════════════════════════════
// 공용 컴포넌트
// ═════════════════════════════════════════════════════════

function RangeRow({
  label, tone, value, display, min, max, step, onChange,
}: {
  label: React.ReactNode;
  tone: "violet" | "orange" | "amber" | "rose";
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const accent =
    tone === "violet" ? "accent-violet-500"
    : tone === "orange" ? "accent-amber-500"
    : tone === "amber" ? "accent-amber-400"
    : "accent-rose-500";
  const badge =
    tone === "violet" ? "from-indigo-500 to-violet-500"
    : tone === "orange" ? "from-amber-500 to-rose-500"
    : tone === "amber" ? "from-amber-500 to-orange-400"
    : "from-rose-500 to-orange-500";
  return (
    <div className="mt-3">
      <label htmlFor={id} className="mb-1 flex items-center justify-between text-xs font-bold text-slate-300">
        <span>{label}</span>
        <span
          key={display}
          className={`min-w-[60px] animate-[pulseR_0.3s_ease] rounded-md bg-gradient-to-r ${badge} px-2.5 py-0.5 text-center font-mono text-base font-extrabold text-white`}
        >
          {display}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-1.5 w-full cursor-pointer rounded-full ${accent} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40`}
      />
    </div>
  );
}

function PresetButton({
  onClick, children, active = false,
}: { onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-lg border border-indigo-400/55 bg-indigo-500/25 px-3 py-1 text-xs font-bold text-indigo-100"
          : "rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-bold text-slate-400 hover:border-indigo-400/35 hover:bg-indigo-500/15 hover:text-indigo-200"
      }
    >
      {children}
    </button>
  );
}

function StatCard({ val, label, tone = "violet" }: { val: string; label: string; tone?: "violet" | "amber" | "emerald" }) {
  const color = tone === "amber" ? "text-amber-300" : tone === "emerald" ? "text-emerald-300" : "text-indigo-300";
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 px-2 py-3 text-center">
      <p key={val} className={`animate-[pulseR_0.3s_ease] font-mono text-xl font-black ${color}`}>{val}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}

function EmpCard({
  tone, pct, range, label,
}: { tone: "violet" | "emerald" | "amber"; pct: string; range: string; label: string }) {
  const cls = tone === "violet" ? { box: "border-violet-400/40 bg-violet-400/10", pct: "text-violet-300", lbl: "text-violet-200" }
            : tone === "emerald" ? { box: "border-emerald-400/40 bg-emerald-400/10", pct: "text-emerald-300", lbl: "text-emerald-200" }
            : { box: "border-amber-400/40 bg-amber-400/10", pct: "text-amber-300", lbl: "text-amber-200" };
  return (
    <div className={`min-w-[110px] flex-1 rounded-2xl border-2 px-3 py-3 text-center ${cls.box}`}>
      <p className={`text-2xl font-black ${cls.pct}`}>{pct}</p>
      <p key={range} className="mt-1 animate-[pulseR_0.3s_ease] text-[11px] font-semibold text-slate-400">{range}</p>
      <p className={`mt-0.5 text-xs ${cls.lbl}`}>{label}</p>
    </div>
  );
}

// ─── 경험법칙 시각 밴드 (인라인 style 회피 → SVG) ─────────
function EmpiricalBand() {
  // viewBox 100×8 — μ±3σ 폭을 100% 로 두고 안에 μ±2σ(66.67%) / μ±1σ(33.33%) 중첩.
  return (
    <div className="overflow-hidden rounded-2xl">
      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="block h-14 w-full" aria-label="μ±σ 경험법칙 시각 밴드">
        <rect x={0} y={0} width={100} height={8} rx={1.5} fill="rgba(245,158,11,0.18)" />
        <rect x={16.67} y={1.1} width={66.66} height={5.8} rx={1.2} fill="rgba(16,185,129,0.22)" />
        <rect x={33.33} y={2.1} width={33.33} height={3.8} rx={1} fill="rgba(99,102,241,0.30)" />
        <rect x={49.5} y={0} width={1} height={8} fill="rgba(255,255,255,0.45)" />
        <text x={4} y={4.3} fontSize={1.3} fontWeight={800} fill="rgba(245,158,11,0.9)">μ−3σ</text>
        <text x={96} y={4.3} fontSize={1.3} fontWeight={800} textAnchor="end" fill="rgba(245,158,11,0.9)">μ+3σ</text>
        <text x={20} y={4.5} fontSize={1.4} fontWeight={800} fill="rgba(16,185,129,0.95)">μ−2σ</text>
        <text x={80} y={4.5} fontSize={1.4} fontWeight={800} textAnchor="end" fill="rgba(16,185,129,0.95)">μ+2σ</text>
        <text x={50} y={5.0} fontSize={1.6} fontWeight={800} textAnchor="middle" fill="rgba(255,255,255,0.92)">μ</text>
      </svg>
    </div>
  );
}

// ─── 정규분포 곡선 SVG ────────────────────────────────────
type CurveProps =
  | { mu: number; si: number; mode: "single"; muB?: undefined; siB?: undefined }
  | { mu: number; si: number; mode: "compare"; muB: number; siB: number };

function NormalCurveSVG(props: CurveProps) {
  const W = 860;
  const H = 320;
  const PAD = { t: 24, b: 44, l: 46, r: 18 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const baseY = PAD.t + cH;

  const uid = useId().replace(/[:]/g, "");
  const idCurve = `cv_${uid}`;

  // x 범위 결정
  let xMin: number, xMax: number;
  if (props.mode === "single") {
    xMin = -8;
    xMax = 8;
  } else {
    const lo = Math.min(props.mu - 3.5 * props.si, props.muB - 3.5 * props.siB);
    const hi = Math.max(props.mu + 3.5 * props.si, props.muB + 3.5 * props.siB);
    const center = (lo + hi) / 2;
    const halfW = Math.max((hi - lo) / 2, 5);
    xMin = Math.max(-10, center - halfW - 1.5);
    xMax = Math.min(10, center + halfW + 1.5);
  }

  // y 스케일
  const peakA = pdf(props.mu, props.mu, props.si);
  const peakB = props.mode === "compare" ? pdf(props.muB, props.muB, props.siB) : 0;
  const yMaxActual = (props.mode === "compare" ? Math.max(peakA, peakB) : peakA) * (props.mode === "single" ? 1.22 : 1.25);

  function toX(x: number) {
    return PAD.l + ((x - xMin) / (xMax - xMin)) * cW;
  }
  function toY(y: number) {
    return PAD.t + cH - Math.max(0, Math.min(cH, (y / yMaxActual) * cH));
  }

  // 곡선 path (samples 위에서 path 만들기)
  function curvePath(mu: number, si: number): string {
    const samples = 280;
    const parts: string[] = [];
    for (let i = 0; i <= samples; i++) {
      const x = xMin + (i / samples) * (xMax - xMin);
      const px = toX(x);
      const py = toY(pdf(x, mu, si));
      parts.push(`${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`);
    }
    return parts.join(" ");
  }
  function fillPath(mu: number, si: number, loX: number, hiX: number): string {
    const samples = 200;
    const parts: string[] = [];
    parts.push(`M ${toX(loX)} ${baseY}`);
    for (let i = 0; i <= samples; i++) {
      const x = loX + (i / samples) * (hiX - loX);
      parts.push(`L ${toX(x)} ${toY(pdf(x, mu, si))}`);
    }
    parts.push(`L ${toX(hiX)} ${baseY}`);
    parts.push("Z");
    return parts.join(" ");
  }

  // 그리드 (1 또는 2 step)
  const gridStep = xMax - xMin <= 12 ? 1 : 2;
  const gridLines: number[] = [];
  for (let x = Math.ceil(xMin / gridStep) * gridStep; x <= xMax; x += gridStep) gridLines.push(x);

  // x 라벨
  const labelStep = xMax - xMin <= 10 ? 1 : 2;
  const xLabels: number[] = [];
  for (let x = Math.ceil(xMin); x <= xMax; x += labelStep) xLabels.push(x);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="정규분포 곡선">
      {/* 배경 */}
      <defs>
        <linearGradient id={`bg_${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0f1a" />
          <stop offset="1" stopColor="#070a12" />
        </linearGradient>
        <linearGradient id={idCurve} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(139,92,246,0.3)" />
          <stop offset="0.5" stopColor="#a78bfa" />
          <stop offset="1" stopColor="rgba(139,92,246,0.3)" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#bg_${uid})`} />

      {/* 격자 */}
      {gridLines.map((x) => (
        <line
          key={x}
          x1={toX(x)} y1={PAD.t} x2={toX(x)} y2={baseY}
          stroke="rgba(255,255,255,0.05)"
        />
      ))}

      {props.mode === "single" ? (
        <SingleBands mu={props.mu} si={props.si} fillPath={fillPath} xMin={xMin} xMax={xMax} />
      ) : null}

      {/* 단일: μ 기준선 (실선) */}
      {props.mode === "single" ? (
        <line x1={toX(props.mu)} y1={PAD.t} x2={toX(props.mu)} y2={baseY} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
      ) : null}

      {/* 비교: μ 기준선(점선) */}
      {props.mode === "compare" ? (
        <>
          <line x1={toX(props.mu)} y1={PAD.t} x2={toX(props.mu)} y2={baseY} stroke="rgba(99,102,241,0.55)" strokeWidth={1.5} strokeDasharray="5 4" />
          <line x1={toX(props.muB)} y1={PAD.t} x2={toX(props.muB)} y2={baseY} stroke="rgba(251,146,60,0.55)" strokeWidth={1.5} strokeDasharray="5 4" />
        </>
      ) : null}

      {/* x축 */}
      <line x1={PAD.l} y1={baseY} x2={W - PAD.r} y2={baseY} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
      {xLabels.map((x) => (
        <text key={x} x={toX(x)} y={baseY + 16} textAnchor="middle" fontSize={11} fill="rgba(71,85,105,1)">
          {x}
        </text>
      ))}

      {/* 단일: σ 레이블 */}
      {props.mode === "single" ? (
        <>
          {[
            { x: props.mu - props.si, lbl: "μ−σ", col: "#818cf8" },
            { x: props.mu + props.si, lbl: "μ+σ", col: "#818cf8" },
            { x: props.mu - 2 * props.si, lbl: "μ−2σ", col: "#34d399" },
            { x: props.mu + 2 * props.si, lbl: "μ+2σ", col: "#34d399" },
          ].map((it) => {
            if (it.x < xMin + 0.2 || it.x > xMax - 0.2) return null;
            return (
              <text key={it.lbl} x={toX(it.x)} y={baseY + 30} textAnchor="middle" fontSize={10} fontWeight={700} fill={it.col}>
                {it.lbl}
              </text>
            );
          })}
          <text x={toX(props.mu)} y={baseY + 30} textAnchor="middle" fontSize={12} fontWeight={700} fill="rgba(255,255,255,0.85)">μ</text>
        </>
      ) : (
        <>
          <text x={toX(props.mu)} y={baseY + 30} textAnchor="middle" fontSize={11} fontWeight={700} fill="#818cf8">μ_A</text>
          <text x={toX(props.muB)} y={baseY + 30} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fb923c">μ_B</text>
        </>
      )}

      {/* 곡선 + 피크 */}
      {props.mode === "single" ? (
        <>
          {/* 채우기 */}
          <path d={fillPath(props.mu, props.si, xMin, xMax)} fill="rgba(99,102,241,0.08)" />
          {/* 곡선 */}
          <path d={curvePath(props.mu, props.si)} fill="none" stroke={`url(#${idCurve})`} strokeWidth={3} />
          {/* 피크 */}
          <circle cx={toX(props.mu)} cy={toY(peakA)} r={5.5} fill="#fff" stroke="#a78bfa" strokeWidth={2.5} />
          <text x={toX(props.mu)} y={toY(peakA) - 12} textAnchor="middle" fontSize={12} fontWeight={700} fill="#e2e8f0">
            f(μ) = {fmt(peakA, 4)}
          </text>
        </>
      ) : (
        <>
          {/* A */}
          <path d={fillPath(props.mu, props.si, xMin, xMax)} fill="rgba(99,102,241,0.14)" />
          <path d={curvePath(props.mu, props.si)} fill="none" stroke="#a5b4fc" strokeWidth={3} />
          <circle cx={toX(props.mu)} cy={toY(peakA)} r={5.5} fill="#fff" stroke="#a5b4fc" strokeWidth={2.5} />
          {/* B */}
          <path d={fillPath(props.muB, props.siB, xMin, xMax)} fill="rgba(251,146,60,0.12)" />
          <path d={curvePath(props.muB, props.siB)} fill="none" stroke="#fdba74" strokeWidth={3} />
          <circle cx={toX(props.muB)} cy={toY(peakB)} r={5.5} fill="#fff" stroke="#fdba74" strokeWidth={2.5} />

          {/* 범례 */}
          <g>
            <rect x={PAD.l + 8} y={PAD.t + 11} width={18} height={4} fill="#a5b4fc" />
            <text x={PAD.l + 32} y={PAD.t + 16} fontSize={12} fontWeight={700} fill="#d1d5db">
              A: μ={fmt(props.mu)}, σ={fmt(props.si)}, f(μ)={fmt(peakA, 3)}
            </text>
            <rect x={PAD.l + 8} y={PAD.t + 29} width={18} height={4} fill="#fdba74" />
            <text x={PAD.l + 32} y={PAD.t + 34} fontSize={12} fontWeight={700} fill="#d1d5db">
              B: μ={fmt(props.muB)}, σ={fmt(props.siB)}, f(μ)={fmt(peakB, 3)}
            </text>
          </g>
        </>
      )}
    </svg>
  );
}

// 단일 모드의 1σ/2σ/3σ 채우기 + 점선 경계.
function SingleBands({
  mu, si, fillPath, xMin, xMax,
}: {
  mu: number;
  si: number;
  fillPath: (mu: number, si: number, lo: number, hi: number) => string;
  xMin: number;
  xMax: number;
}) {
  const bands = [
    { k: 3, fill: "rgba(245,158,11,0.10)", stroke: "rgba(245,158,11,0.35)" },
    { k: 2, fill: "rgba(16,185,129,0.12)", stroke: "rgba(16,185,129,0.40)" },
    { k: 1, fill: "rgba(99,102,241,0.18)", stroke: "rgba(99,102,241,0.50)" },
  ];
  return (
    <g>
      {bands.map(({ k, fill }) => {
        const lo = Math.max(xMin, mu - k * si);
        const hi = Math.min(xMax, mu + k * si);
        if (lo >= hi) return null;
        return <path key={k} d={fillPath(mu, si, lo, hi)} fill={fill} />;
      })}
    </g>
  );
}
