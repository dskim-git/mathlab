"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "two_curves",
    prompt:
      "그래프에 함께 그려진 두 정규곡선 N(μ, σ²)과 N(μ, σ²/n)은 모양이 어떻게 달랐나요? 어느 쪽이 더 좁고 뾰족했는지, 왜 그렇게 보였는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 모집단 곡선 N(μ, σ²)은 넓게 퍼져 있었고, 표본평균 곡선 N(μ, σ²/n)은 같은 μ 자리에서 훨씬 좁고 뾰족했다. 분산이 σ²/n으로 n분의 1로 줄기 때문이다.",
  },
  {
    id: "n_and_m_effect",
    prompt:
      "표본 크기 n(예: 4 → 40)을 키웠을 때와 표본 개수 m(예: 10 → 200)을 늘렸을 때, X̄들의 점·히스토그램은 각각 어떻게 변했나요?",
    kind: "text",
    placeholder:
      "예: n을 키우면 표본평균 곡선이 더 좁아지고 X̄ 점들이 μ 주변에 더 모였다. m을 늘리면 히스토그램이 점점 더 매끄러워져 표본평균 이론 곡선 N(μ, σ²/n)에 가까워졌다.",
  },
  {
    id: "nonnormal_clt",
    prompt:
      "모집단이 종 모양이 아닌 ‘줄넘기 횟수(비대칭)’일 때에도 X̄의 분포는 어떻게 보였나요? 거기서 무엇을 발견했나요?",
    kind: "text",
    placeholder:
      "예: 모집단 자체는 오른쪽으로 꼬리가 긴 비대칭이었지만, X̄의 분포는 n이 커질수록 점점 종 모양에 가까워졌다. 모집단이 정규가 아니어도 표본평균의 분포는 정규에 가까워진다(중심극한정리).",
  },
];

// ─── 시드 RNG ────────────────────────────────────────────
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function boxMuller(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeHeights(): number[] {
  const rng = mulberry32(20251);
  const arr: number[] = [];
  for (let i = 0; i < 160; i++) {
    let v = 168 + boxMuller(rng) * 6.2;
    v = Math.max(150, Math.min(188, v));
    arr.push(Math.round(v * 10) / 10);
  }
  return arr;
}
function makeScores(): number[] {
  const rng = mulberry32(73821);
  const arr: number[] = [];
  for (let i = 0; i < 160; i++) {
    let v = 72 + boxMuller(rng) * 14;
    v = Math.max(15, Math.min(100, v));
    arr.push(Math.round(v));
  }
  return arr;
}
function makeJumprope(): number[] {
  const rng = mulberry32(91234);
  const arr: number[] = [];
  for (let i = 0; i < 160; i++) {
    const shape = 4;
    let v = 0;
    for (let k = 0; k < shape; k++) v += -Math.log(1 - rng()) * 22;
    v = v + 28;
    v = Math.max(30, Math.min(240, v));
    arr.push(Math.round(v));
  }
  return arr;
}

type PopKey = "heights" | "scores" | "jumprope";
type Population = {
  label: string;
  data: number[];
  unit: string;
  showInt: boolean;
};
const POPULATIONS: Record<PopKey, Population> = {
  heights: { label: "학생 키 (cm)", data: makeHeights(), unit: "cm", showInt: false },
  scores: { label: "수학 시험 점수 (점)", data: makeScores(), unit: "점", showInt: true },
  jumprope: { label: "1분 줄넘기 횟수", data: makeJumprope(), unit: "회", showInt: true },
};

// ─── 통계 헬퍼 ────────────────────────────────────────────
type PopStats = { mean: number; variance: number; sd: number; min: number; max: number };
function popStats(values: number[]): PopStats {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const v = values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length;
  return {
    mean,
    variance: v,
    sd: Math.sqrt(v),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function sampleStats(values: number[]): { mean: number; sd: number } {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  if (n <= 1) return { mean, sd: 0 };
  const v = values.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1);
  return { mean, sd: Math.sqrt(v) };
}

type Sample = { idx: number[]; vals: number[]; mean: number; sd: number };

function drawOneSample(values: number[], n: number, rng: () => number): Sample {
  const N = values.length;
  const idx: number[] = new Array(n);
  const vals: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const k = Math.floor(rng() * N);
    idx[i] = k;
    vals[i] = values[k];
  }
  const st = sampleStats(vals);
  return { idx, vals, mean: st.mean, sd: st.sd };
}

function drawSamples(values: number[], n: number, m: number, rng: () => number): Sample[] {
  const out: Sample[] = new Array(m);
  for (let i = 0; i < m; i++) out[i] = drawOneSample(values, n, rng);
  return out;
}

function pdf(x: number, mu: number, sd: number): number {
  if (sd <= 0) return 0;
  return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sd) ** 2);
}

function fmt(v: number, d = 3): string {
  if (!isFinite(v)) return "--";
  return Number(v.toFixed(d)).toString();
}

// ─── Canvas X̄ 라벨 헬퍼 ────────────────────────────────────
function fillXBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  prefix: string,
  suffix: string
) {
  const oldAlign = ctx.textAlign;
  const oldBaseline = ctx.textBaseline;
  const parts: { t: string; bar: boolean }[] = [];
  if (prefix) parts.push({ t: prefix, bar: false });
  parts.push({ t: "X", bar: true });
  if (suffix) parts.push({ t: suffix, bar: false });
  let totalW = 0;
  for (const p of parts) totalW += ctx.measureText(p.t).width;
  let cursor: number;
  if (oldAlign === "center") cursor = x - totalW / 2;
  else if (oldAlign === "right") cursor = x - totalW;
  else cursor = x;
  const fm = ctx.font.match(/(\d+(?:\.\d+)?)px/);
  const fpx = fm ? parseFloat(fm[1]) : 12;
  ctx.textAlign = "left";
  for (const p of parts) {
    const w = ctx.measureText(p.t).width;
    ctx.fillText(p.t, cursor, y);
    if (p.bar && w > 0) {
      let top: number;
      if (oldBaseline === "top") top = y - 1;
      else if (oldBaseline === "middle") top = y - fpx * 0.55;
      else if (oldBaseline === "bottom") top = y - fpx * 1.0 - 1;
      else top = y - fpx * 0.92;
      const barH = Math.max(1.5, fpx * 0.09);
      ctx.fillRect(cursor + 1, top, w - 2, barH);
    }
    cursor += w;
  }
  ctx.textAlign = oldAlign;
}

// ─── X̄ React 표기 ─────────────────────────────────────────
function Xb() {
  return (
    <span className="inline-block px-px leading-none [text-decoration:overline] decoration-[1.5px]">
      X
    </span>
  );
}

// ─── 메인 ─────────────────────────────────────────────────
export default function SamplingMeanRelationLab() {
  const [popKey, setPopKey] = useState<PopKey>("heights");
  const [n, setN] = useState(10);
  const [m, setM] = useState(50);

  // 추출용 RNG — useState lazy initializer 로 mount 시 단 한 번 생성.
  const [drawRng] = useState<() => number>(() =>
    mulberry32(Date.now() & 0xffffffff)
  );
  // 초기 50개 표본도 lazy init 으로 첫 렌더에 한 번만 추출.
  const [samples, setSamples] = useState<Sample[]>(() =>
    drawSamples(POPULATIONS.heights.data, 10, 50, drawRng)
  );
  const [selectedIdx, setSelectedIdx] = useState(0);

  const pop = POPULATIONS[popKey];
  const ps = useMemo(() => popStats(pop.data), [pop.data]);

  function handleSelectPreset(key: PopKey) {
    setPopKey(key);
    setSamples([]);
    setSelectedIdx(0);
  }

  function handleDraw() {
    const s = drawSamples(pop.data, n, m, drawRng);
    setSamples(s);
    setSelectedIdx(0);
  }

  function handleAdd() {
    if (samples.length === 0) {
      handleDraw();
      return;
    }
    const newOnes = drawSamples(pop.data, n, m, drawRng);
    setSamples((prev) => [...prev, ...newOnes]);
  }

  function handleClear() {
    setSamples([]);
    setSelectedIdx(0);
  }

  // 경험 통계
  const empirical = useMemo(() => {
    if (samples.length === 0) return null;
    const means = samples.map((s) => s.mean);
    const mu = means.reduce((a, b) => a + b, 0) / means.length;
    let v: number | null = null;
    if (means.length > 1) {
      v = means.reduce((s, x) => s + (x - mu) ** 2, 0) / (means.length - 1);
    }
    return { mu, v, sd: v !== null ? Math.sqrt(v) : null };
  }, [samples]);

  const selectedSample = samples[selectedIdx] ?? null;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">
          🌟 모평균과 표본평균의 관계 — 두 정규곡선 비교 실험실
        </h3>
        <p className="mt-2 leading-7 text-slate-300">
          모집단에서 표본을 여러 번 뽑아 <Xb /> 들이 그리는 분포를{" "}
          <b className="text-amber-300">두 정규곡선</b>{" "}
          <b className="text-cyan-300">N(μ, σ²)</b> ↔ <b className="text-orange-300">N(μ, σ²/n)</b>{" "}
          과 함께 비교해 봐요!
        </p>
      </div>

      {/* ① 모집단 선택 */}
      <div className="mt-5 rounded-2xl border border-amber-400/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-amber-200">
          🎒 모집단 선택{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            실생활 데이터 3가지
          </span>
        </h4>
        <div className="flex flex-wrap gap-2">
          <PresetBtn active={popKey === "heights"} onClick={() => handleSelectPreset("heights")}>
            📏 학생 키 (cm) · N≈종모양
          </PresetBtn>
          <PresetBtn active={popKey === "scores"} onClick={() => handleSelectPreset("scores")}>
            📝 수학 시험 점수 · N≈종모양
          </PresetBtn>
          <PresetBtn active={popKey === "jumprope"} onClick={() => handleSelectPreset("jumprope")}>
            🪢 1분 줄넘기 횟수 · 비대칭
          </PresetBtn>
        </div>

        <div className="mt-3 rounded-xl border-[1.5px] border-cyan-300/30 bg-slate-900/50 p-3">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-slate-300">
            <span>
              📊 모집단 (가로 수직선 위 회색 점) · 크기{" "}
              <b className="text-amber-300">N = {pop.data.length}</b>
            </span>
            <span>🟥 빨간 점/막대 = 선택된 표본의 위치</span>
          </div>
          <PopLineCanvas
            population={pop}
            stats={ps}
            selectedIdxSet={
              selectedSample ? new Set(selectedSample.idx) : null
            }
          />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <PopStatCard label="모집단 크기 N" value={String(pop.data.length)} />
          <PopStatCard label="모평균 μ" value={fmt(ps.mean, 2)} />
          <PopStatCard label="모분산 σ²" value={fmt(ps.variance, 2)} />
          <PopStatCard label="모표준편차 σ" value={fmt(ps.sd, 2)} />
        </div>
      </div>

      {/* ② 표본 추출 설정 */}
      <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-emerald-200">
          🎲 표본 추출 설정{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            크기 n인 표본을 m번 뽑습니다
          </span>
        </h4>

        <div className="space-y-2">
          <RangeRow label="표본 크기 n" value={n} min={2} max={60} onChange={setN} idHint="srl-n" />
          <RangeRow label="표본 개수 m" value={m} min={5} max={200} onChange={setM} idHint="srl-m" />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDraw}
            className="flex-1 min-w-[160px] rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-emerald-400 hover:to-emerald-600 active:scale-95"
          >
            🎲 새로 표본 추출
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-blue-400 hover:to-blue-600 active:scale-95"
          >
            ➕ 표본 m개 더 추가
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-slate-400/30 bg-slate-700/70 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-700/95 active:scale-95"
          >
            🔄 초기화
          </button>
        </div>
      </div>

      {/* ③ 표본 표 + 선택 표본 */}
      <div className="mt-3 rounded-2xl border border-violet-400/25 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-violet-200">
          📋 추출된 표본들{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            행을 클릭하면 강조됩니다
          </span>
        </h4>

        <div className="grid gap-3 lg:grid-cols-2">
          <SampleListTable
            samples={samples}
            selectedIdx={selectedIdx}
            onSelect={setSelectedIdx}
          />
          <SelectedSampleDetail
            sample={selectedSample}
            selectedIdx={selectedSample ? selectedIdx + 1 : null}
            showInt={pop.showInt}
          />
        </div>
      </div>

      {/* ④ 정규곡선 차트 */}
      <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 text-base font-bold text-cyan-200">
          📈 정규곡선 비교: N(μ, σ²) vs N(μ, σ²/n)
        </h4>
        <div className="rounded-xl border-[1.5px] border-cyan-400/30 bg-slate-900/50 p-3">
          <NormChartCanvas
            population={pop}
            stats={ps}
            samples={samples}
            selectedIdx={selectedIdx}
            n={n}
          />
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-slate-300">
            <Legend swatchClass="bg-cyan-400">
              모집단 N(μ, σ²)
            </Legend>
            <Legend swatchClass="bg-orange-400">
              표본평균 N(μ, σ²/n)
            </Legend>
            <Legend dot dotClass="bg-slate-700 ring-1 ring-slate-500">
              <>
                표본평균 <Xb /> 들 (점)
              </>
            </Legend>
            <Legend dot dotClass="bg-rose-500">
              <>
                선택된 표본의 <Xb />
              </>
            </Legend>
            <Legend swatchClass="bg-cyan-400/35">
              <>
                <Xb /> 히스토그램
              </>
            </Legend>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-amber-300/45 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
          <span className="text-xl">💡</span>
          <span>
            모집단 곡선보다 <Xb /> 의 곡선이 <b className="text-yellow-200">훨씬 좁고 뾰족</b>해요.
            n이 커질수록 <Xb /> 점들이 모평균 μ 주위에{" "}
            <b className="text-yellow-200">더 촘촘히</b> 모이고, 모집단이 종 모양이 아니어도{" "}
            <Xb /> 의 분포는 점점 종 모양에 가까워져요!
          </span>
        </div>
      </div>

      {/* ⑤ 비교 표 */}
      <div className="mt-3 rounded-2xl border border-violet-400/30 bg-slate-900/40 p-4">
        <h4 className="mb-3 text-base font-bold text-violet-200">
          📊 모수 vs 표본평균 — 이론과 경험 비교
        </h4>
        <div className="overflow-x-auto rounded-xl border-[1.5px] border-violet-400/40">
          <table className="w-full min-w-[480px] border-collapse text-center text-sm text-slate-200">
            <thead>
              <tr className="border-b-2 border-violet-400/50 bg-violet-500/25">
                <th className="px-2 py-2 text-left text-base font-extrabold text-violet-100 pl-3">항목</th>
                <th className="px-2 py-2 text-base font-extrabold text-violet-100">평균 (μ)</th>
                <th className="px-2 py-2 text-base font-extrabold text-violet-100">분산 (σ²)</th>
                <th className="px-2 py-2 text-base font-extrabold text-violet-100">표준편차 (σ)</th>
              </tr>
            </thead>
            <tbody>
              <CmpRow
                label="🎒 모집단 (이론)"
                muClass="text-amber-100 font-extrabold"
                vCells={[fmt(ps.mean), fmt(ps.variance), fmt(ps.sd)]}
                zebra={false}
              />
              <CmpRow
                label="🎯 표본평균 (이론)"
                muClass="text-cyan-300 font-extrabold"
                vCells={[fmt(ps.mean), fmt(ps.variance / n), fmt(ps.sd / Math.sqrt(n))]}
                zebra={true}
              />
              <CmpRow
                label="🌟 표본평균 (경험)"
                muClass="text-emerald-300 font-extrabold"
                vCells={[
                  empirical ? fmt(empirical.mu) : "--",
                  empirical?.v != null ? fmt(empirical.v) : "--",
                  empirical?.sd != null ? fmt(empirical.sd) : "--",
                ]}
                zebra={false}
              />
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-amber-300/45 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
          <span className="text-xl">🔍</span>
          <span>
            m(표본 개수)을 늘릴수록 <b className="text-yellow-200">표본평균(경험)</b> 행이{" "}
            <b className="text-yellow-200">표본평균(이론)</b> 행에 가까워져요. 이론:{" "}
            E(<Xb />) = μ, V(<Xb />) = σ²/n.
          </span>
        </div>
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <ReflectionForm questions={REFLECTION_QUESTIONS} />
      </div>
    </section>
  );
}

// ─── 작은 빌딩블록 ──────────────────────────────────────
function PresetBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-2 text-sm font-extrabold transition ${
        active
          ? "border-yellow-200 bg-gradient-to-br from-amber-500 to-orange-700 text-white shadow-md"
          : "border-transparent bg-gradient-to-br from-slate-600 to-slate-700 text-white hover:-translate-y-px"
      }`}
    >
      {children}
    </button>
  );
}

function PopStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-[1.5px] border-amber-400/40 bg-amber-500/10 p-3 text-center">
      <div className="text-sm font-extrabold tracking-wide text-amber-300">{label}</div>
      <div className="mt-1 text-xl font-extrabold leading-tight text-amber-100">{value}</div>
    </div>
  );
}

function RangeRow({
  label,
  value,
  min,
  max,
  onChange,
  idHint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  idHint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-emerald-400/30 bg-emerald-500/10 px-3 py-2">
      <label htmlFor={idHint} className="min-w-[110px] text-sm font-extrabold text-emerald-200">
        {label}
      </label>
      <input
        id={idHint}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="h-1.5 flex-1 accent-emerald-400"
      />
      <span className="min-w-[54px] rounded-md bg-slate-950/70 px-3 py-1 text-center text-lg font-extrabold text-amber-300">
        {value}
      </span>
    </div>
  );
}

function Legend({
  swatchClass,
  dot,
  dotClass,
  children,
}: {
  swatchClass?: string;
  dot?: boolean;
  dotClass?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {dot ? (
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotClass}`} />
      ) : (
        <span className={`inline-block h-1 w-5 rounded ${swatchClass}`} />
      )}
      {children}
    </span>
  );
}

function CmpRow({
  label,
  muClass,
  vCells,
  zebra,
}: {
  label: string;
  muClass: string;
  vCells: string[];
  zebra: boolean;
}) {
  return (
    <tr className={zebra ? "bg-slate-900/40" : ""}>
      <th
        scope="row"
        className="border-b border-violet-400/15 bg-violet-500/15 px-3 py-2.5 text-left font-extrabold text-violet-200"
      >
        {label}
      </th>
      {vCells.map((v, i) => (
        <td key={i} className={`border-b border-violet-400/15 px-2 py-2.5 text-base ${muClass}`}>
          {v}
        </td>
      ))}
    </tr>
  );
}

// ─── 표본 목록 / 상세 ──────────────────────────────────
function SampleListTable({
  samples,
  selectedIdx,
  onSelect,
}: {
  samples: Sample[];
  selectedIdx: number;
  onSelect: (i: number) => void;
}) {
  // 선택된 행으로 스크롤 — 실제 노드 ref 필요 없이 element id 로 처리
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = containerRef.current?.querySelector(
      `tr[data-i="${selectedIdx}"]`
    );
    if (el && "scrollIntoView" in el) {
      (el as HTMLElement).scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIdx, samples.length]);

  return (
    <div className="overflow-hidden rounded-xl border-[1.5px] border-violet-400/25 bg-slate-900/50">
      <div className="flex items-center justify-between bg-violet-500/15 px-3 py-2 text-sm font-extrabold text-violet-200">
        <span>표본 목록</span>
        <span className="text-xs font-bold text-slate-300">
          누적 <span className="font-extrabold text-amber-300">{samples.length}</span>개
        </span>
      </div>
      <div ref={containerRef} className="max-h-[260px] overflow-auto">
        <table className="w-full border-collapse text-center text-sm text-slate-200">
          <thead>
            <tr>
              <th className="sticky top-0 z-10 border-b-2 border-violet-400/40 bg-slate-950/95 px-2 py-2 font-extrabold text-violet-200">
                표본#
              </th>
              <th className="sticky top-0 z-10 border-b-2 border-violet-400/40 bg-slate-950/95 px-2 py-2 font-extrabold text-violet-200">
                크기 n
              </th>
              <th className="sticky top-0 z-10 border-b-2 border-violet-400/40 bg-slate-950/95 px-2 py-2 font-extrabold text-violet-200">
                표본평균 <Xb />
              </th>
              <th className="sticky top-0 z-10 border-b-2 border-violet-400/40 bg-slate-950/95 px-2 py-2 font-extrabold text-violet-200">
                표본표준편차 S
              </th>
            </tr>
          </thead>
          <tbody>
            {samples.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 italic text-slate-500">
                  표본을 추출해 보세요
                </td>
              </tr>
            ) : (
              samples.map((s, i) => {
                const selected = i === selectedIdx;
                return (
                  <tr
                    key={i}
                    data-i={i}
                    onClick={() => onSelect(i)}
                    className={`cursor-pointer border-b border-violet-400/10 even:bg-slate-800/40 hover:bg-cyan-500/15 ${
                      selected ? "!bg-rose-500/20 outline outline-2 -outline-offset-2 outline-rose-400/55" : ""
                    }`}
                  >
                    <td className="px-2 py-1.5 font-extrabold text-slate-400">#{i + 1}</td>
                    <td className="px-2 py-1.5">{s.vals.length}</td>
                    <td className="px-2 py-1.5 font-extrabold text-amber-200">
                      {fmt(s.mean)}
                    </td>
                    <td className="px-2 py-1.5">{fmt(s.sd)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SelectedSampleDetail({
  sample,
  selectedIdx,
  showInt,
}: {
  sample: Sample | null;
  selectedIdx: number | null;
  showInt: boolean;
}) {
  return (
    <div className="rounded-xl border-[1.5px] border-rose-400/40 bg-rose-500/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-extrabold tracking-wide text-rose-300">
          📦 선택한 표본 #{selectedIdx ?? "--"}
        </span>
        <span className="rounded-md bg-slate-950/55 px-2 py-1 text-sm font-extrabold text-amber-200">
          <Xb /> = {sample ? fmt(sample.mean) : "--"}
        </span>
      </div>
      {sample ? (
        <div className="flex max-h-[200px] flex-wrap gap-1.5 overflow-auto">
          {sample.vals.map((v, i) => (
            <span
              key={i}
              className="inline-flex h-[30px] min-w-[34px] items-center justify-center rounded-md border-[1.5px] border-rose-300 bg-gradient-to-br from-red-200 to-red-600 px-2 text-sm font-extrabold text-white shadow-md [animation:popIn_0.25s_cubic-bezier(.34,1.56,.64,1)_both]"
            >
              {showInt ? Math.round(v) : v}
            </span>
          ))}
        </div>
      ) : (
        <div className="p-2 text-center text-sm italic text-slate-400">
          왼쪽 표에서 표본을 선택해 보세요
        </div>
      )}
    </div>
  );
}

// ─── PopLine Canvas ─────────────────────────────────────
function PopLineCanvas({
  population,
  stats,
  selectedIdxSet,
}: {
  population: Population;
  stats: PopStats;
  selectedIdxSet: Set<number> | null;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 900;
  const H = 170;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const data = population.data;
    const padL = 48;
    const padR = 30;
    const padT = 30;
    const padB = 50;
    const lo = stats.min;
    const hi = stats.max;
    const span = hi - lo || 1;
    const yAxis = H - padB - 30;

    ctx.strokeStyle = "rgba(148,163,184,.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, yAxis);
    ctx.lineTo(W - padR, yAxis);
    ctx.stroke();

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(population.showInt ? String(Math.round(lo)) : lo.toFixed(1), padL, yAxis + 8);
    ctx.textAlign = "right";
    ctx.fillText(
      population.showInt ? String(Math.round(hi)) : hi.toFixed(1),
      W - padR,
      yAxis + 8
    );

    const ticks = 5;
    ctx.textAlign = "center";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    for (let i = 1; i < ticks; i++) {
      const v = lo + (i * span) / ticks;
      const x = padL + ((v - lo) / span) * (W - padL - padR);
      ctx.strokeStyle = "rgba(148,163,184,.4)";
      ctx.beginPath();
      ctx.moveTo(x, yAxis - 4);
      ctx.lineTo(x, yAxis + 4);
      ctx.stroke();
      ctx.fillText(population.showInt ? String(Math.round(v)) : v.toFixed(0), x, yAxis + 8);
    }

    const xMu = padL + ((stats.mean - lo) / span) * (W - padL - padR);
    ctx.strokeStyle = "#fbbf24";
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xMu, padT - 4);
    ctx.lineTo(xMu, yAxis);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("μ=" + fmt(stats.mean, 2), xMu, padT - 6);

    const half = 22;
    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      const x = padL + ((v - lo) / span) * (W - padL - padR);
      const jr = ((i * 2654435761) >>> 0) / 4294967296;
      const jy = (jr - 0.5) * 14;
      if (selectedIdxSet && selectedIdxSet.has(i)) {
        ctx.strokeStyle = "rgba(244,63,94,.95)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, yAxis - half);
        ctx.lineTo(x, yAxis + half);
        ctx.stroke();
        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(x, yAxis + jy, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "rgba(148,163,184,.55)";
        ctx.beginPath();
        ctx.arc(x, yAxis + jy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(population.unit, W - padR - 2, padT - 6);
  }, [population, stats, selectedIdxSet]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[170px] w-full rounded-lg bg-slate-950/60"
      aria-label="모집단 수직선"
    />
  );
}

// ─── NormChart Canvas ─────────────────────────────────────
function NormChartCanvas({
  population,
  stats,
  samples,
  selectedIdx,
  n,
}: {
  population: Population;
  stats: PopStats;
  samples: Sample[];
  selectedIdx: number;
  n: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 980;
  const H = 360;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 56;
    const padR = 22;
    const padT = 22;
    const padB = 60;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const mu = stats.mean;
    const sd = stats.sd;
    const sdBar = sd / Math.sqrt(n);

    const xMin = Math.min(mu - 4 * sd, mu - 5 * sdBar, stats.min);
    const xMax = Math.max(mu + 4 * sd, mu + 5 * sdBar, stats.max);
    const xSpan = xMax - xMin;

    const maxPdfPop = pdf(mu, mu, sd);
    const maxPdfBar = pdf(mu, mu, sdBar);
    let yMaxPdf = Math.max(maxPdfPop, maxPdfBar);

    let hist: { nbins: number; binW: number; dens: number[] } | null = null;
    if (samples.length > 0) {
      const means = samples.map((s) => s.mean);
      const nbins = Math.max(10, Math.min(30, Math.ceil(Math.sqrt(samples.length)) + 5));
      const binW = xSpan / nbins;
      const bins = new Array<number>(nbins).fill(0);
      for (const v of means) {
        let k = Math.floor((v - xMin) / binW);
        if (k < 0) k = 0;
        if (k >= nbins) k = nbins - 1;
        bins[k]++;
      }
      const dens = bins.map((c) => c / (samples.length * binW));
      yMaxPdf = Math.max(yMaxPdf, Math.max(...dens));
      hist = { nbins, binW, dens };
    }

    const Y = (y: number) => padT + plotH - (y / yMaxPdf) * plotH;
    const X = (x: number) => padL + ((x - xMin) / xSpan) * plotW;

    ctx.strokeStyle = "rgba(148,163,184,.13)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    if (hist) {
      ctx.fillStyle = "rgba(56,189,248,.32)";
      ctx.strokeStyle = "rgba(56,189,248,.6)";
      ctx.lineWidth = 1;
      for (let i = 0; i < hist.nbins; i++) {
        const x0 = X(xMin + i * hist.binW);
        const x1 = X(xMin + (i + 1) * hist.binW);
        const y0 = Y(hist.dens[i]);
        const y1 = Y(0);
        ctx.beginPath();
        ctx.rect(x0 + 1, y0, x1 - x0 - 2, y1 - y0);
        ctx.fill();
        ctx.stroke();
      }
    }

    // 모집단 N(μ, σ²) — 파랑
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 400; i++) {
      const x = xMin + (i / 400) * xSpan;
      const y = pdf(x, mu, sd);
      if (i === 0) ctx.moveTo(X(x), Y(y));
      else ctx.lineTo(X(x), Y(y));
    }
    ctx.stroke();

    // 표본평균 N(μ, σ²/n) — 주황
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    for (let i = 0; i <= 400; i++) {
      const x = xMin + (i / 400) * xSpan;
      const y = pdf(x, mu, sdBar);
      if (i === 0) ctx.moveTo(X(x), Y(y));
      else ctx.lineTo(X(x), Y(y));
    }
    ctx.stroke();

    // μ 점선
    const xMu = X(mu);
    ctx.strokeStyle = "rgba(251,191,36,.9)";
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xMu, padT);
    ctx.lineTo(xMu, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("μ=" + fmt(mu, 2), xMu, padT - 5);

    // 축
    ctx.strokeStyle = "rgba(148,163,184,.5)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    ctx.lineTo(W - padR, padT + plotH);
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const xTicks = 7;
    for (let i = 0; i <= xTicks; i++) {
      const xv = xMin + (i / xTicks) * xSpan;
      const xpx = X(xv);
      ctx.strokeStyle = "rgba(148,163,184,.45)";
      ctx.beginPath();
      ctx.moveTo(xpx, padT + plotH);
      ctx.lineTo(xpx, padT + plotH + 4);
      ctx.stroke();
      ctx.fillText(
        population.showInt ? String(Math.round(xv)) : xv.toFixed(1),
        xpx,
        padT + plotH + 8
      );
    }

    // 표본평균 점들
    if (samples.length > 0) {
      const yDots = padT + plotH - 14;
      ctx.fillStyle = "rgba(0,0,0,.5)";
      for (let i = 0; i < samples.length; i++) {
        if (i === selectedIdx) continue;
        const s = samples[i];
        const x = X(s.mean);
        const jy = (((i * 2654435761) >>> 0) / 4294967296 - 0.5) * 12;
        ctx.beginPath();
        ctx.arc(x, yDots + jy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      const sel = samples[selectedIdx];
      if (sel) {
        const sx = X(sel.mean);
        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(sx, yDots, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fda4af";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        fillXBar(ctx, sx, yDots - 9, "", "=" + fmt(sel.mean));
      }
    }

    // 축 제목
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("값 (" + population.unit + ")", W / 2, H - 10);
    ctx.save();
    ctx.translate(15, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("확률밀도", 0, 0);
    ctx.restore();
  }, [population, stats, samples, selectedIdx, n]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[360px] w-full rounded-lg bg-slate-950/60"
      aria-label="정규곡선 비교 차트"
    />
  );
}
