"use client";

import { useId, useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 수학 헬퍼 ─────────────────────────────────────────────
function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 0; i < Math.min(k, n - k); i++) {
    r = (r * (n - i)) / (i + 1);
  }
  return r;
}
function binomPMF(n: number, p: number, k: number): number {
  return comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}
function fmt2(x: number) {
  return (Math.round(x * 100) / 100).toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

// ─── 시나리오 데이터 ──────────────────────────────────────
type Scenario = {
  id: string;
  emoji: string;
  title: string;
  baseDesc: string;
  unit: string;
  verb: string;
  nMin: number;
  nMax: number;
  nDefault: number;
  nStep: number;
  pMin: number; // 1..100
  pMax: number;
  pDefault: number;
  pStep: number;
  nLabel: string;
  pLabel: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "freethrow", emoji: "🏀", title: "농구 자유투",
    baseDesc: "자유투 성공 여부를 베르누이 시행으로 분석합니다.",
    unit: "골", verb: "성공",
    nMin: 5, nMax: 30, nDefault: 10, nStep: 1,
    pMin: 10, pMax: 99, pDefault: 70, pStep: 5,
    nLabel: "던지는 횟수", pLabel: "자유투 성공률",
  },
  {
    id: "mcq", emoji: "📝", title: "객관식 찍기",
    baseDesc: "선택지 중 하나를 무작위로 찍을 때 정답 수를 분석합니다.",
    unit: "문제", verb: "정답",
    nMin: 5, nMax: 50, nDefault: 20, nStep: 1,
    pMin: 10, pMax: 90, pDefault: 25, pStep: 5,
    nLabel: "문제 수", pLabel: "정답 확률 (선택지 수의 역수)",
  },
  {
    id: "defect", emoji: "🏭", title: "제품 불량률",
    baseDesc: "생산 제품 중 불량품 개수를 이항분포로 모델링합니다.",
    unit: "개", verb: "불량",
    nMin: 50, nMax: 500, nDefault: 200, nStep: 10,
    pMin: 1, pMax: 20, pDefault: 3, pStep: 1,
    nLabel: "검수 개수", pLabel: "불량률 (%)",
  },
  {
    id: "rain", emoji: "🌧️", title: "비 오는 날",
    baseDesc: "일별 강수 여부를 베르누이 시행으로 봅니다.",
    unit: "일", verb: "강수",
    nMin: 10, nMax: 90, nDefault: 30, nStep: 1,
    pMin: 5, pMax: 95, pDefault: 40, pStep: 5,
    nLabel: "관측 기간 (일)", pLabel: "일별 강수 확률",
  },
  {
    id: "archery", emoji: "🎯", title: "양궁 10점",
    baseDesc: "10점 과녁 명중 여부를 베르누이 시행으로 분석합니다.",
    unit: "발", verb: "10점",
    nMin: 5, nMax: 30, nDefault: 15, nStep: 1,
    pMin: 10, pMax: 99, pDefault: 80, pStep: 5,
    nLabel: "발사 횟수", pLabel: "10점 명중률",
  },
];

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "np_change_observation",
    prompt:
      "n 또는 p를 바꿨을 때 막대그래프 모양이 어떻게 달라졌나요? 평균(노란 점선)과 μ±σ(초록 영역)의 변화를 함께 설명해 보세요.",
    kind: "text",
    placeholder: "예: n을 키우면 분포가 종 모양으로 매끄러워지고, p가 0.5에 가까울수록 좌우 대칭이 된다. σ는 √(npq)라 n이 늘면 σ도 커진다.",
  },
  {
    id: "scenario_real_life",
    prompt:
      "실생활 시나리오 5개 중 하나를 골라, 그 상황을 B(n, p) 로 어떻게 표현했고 평균·표준편차가 의미하는 바를 자신의 말로 적어 보세요.",
    kind: "text",
    placeholder: "예: 농구 자유투 10개·성공률 70% → B(10, 0.7). 평균 7골, σ≈1.45 → 5~9골 사이가 흔한 결과.",
  },
];

// ─── 메인 ─────────────────────────────────────────────────
export default function BinomialMeanVarExplorer() {
  // ① 메인 탐험기
  const [n, setN] = useState(20);
  const [pPct, setPPct] = useState(50);
  const p = pPct / 100;
  const stats = useMemo(() => computeStats(n, p), [n, p]);

  // 시뮬 결과
  const [simResult, setSimResult] = useState<{ hits: number; outcomes: boolean[] } | null>(null);

  function runSim() {
    const outcomes: boolean[] = [];
    let hits = 0;
    for (let i = 0; i < n; i++) {
      const ok = Math.random() < p;
      outcomes.push(ok);
      if (ok) hits += 1;
    }
    setSimResult({ hits, outcomes });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">📊 이항분포의 평균·분산·표준편차 탐험</h3>
        <p className="mt-2 leading-7 text-slate-300">
          n과 p를 조절하며 <b className="text-amber-300">B(n, p)</b>의 평균·분산·표준편차가
          어떻게 달라지는지 관찰하고, 실생활 시나리오 5가지에서 직접 분석해 보세요.
        </p>
      </div>

      {/* ① 수식 카드 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">📐 이항분포 B(n, p)의 평균·분산·표준편차</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <FormulaBox tone="mean" lbl="E(X) = np" val={fmt2(stats.mean)} formula="평균 = n × p" />
          <FormulaBox tone="var" lbl="V(X) = npq" val={fmt2(stats.vari)} formula="분산 = n × p × (1−p)" />
          <FormulaBox tone="sigma" lbl="σ(X) = √npq" val={fmt2(stats.sigma)} formula="표준편차 = √분산" />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <RangeRow
            label="시행 횟수 n"
            value={n}
            display={String(n)}
            min={5}
            max={60}
            step={1}
            onChange={setN}
            tone="orange"
          />
          <RangeRow
            label="성공 확률 p"
            value={pPct}
            display={p.toFixed(2)}
            min={5}
            max={95}
            step={5}
            onChange={setPPct}
            tone="violet"
          />
        </div>

        <div className="mt-4">
          <BinomialChartSVG n={n} p={p} height={220} />
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          ← X값 (성공 횟수) →  |  <span className="text-amber-300">노란 점선</span> = 평균(E(X))  |{" "}
          <span className="text-emerald-300">초록 영역</span> = μ ± σ
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Chip lbl="평균 E(X)" val={fmt2(stats.mean)} color="text-amber-300" />
          <Chip lbl="분산 V(X)" val={fmt2(stats.vari)} color="text-indigo-300" />
          <Chip lbl="표준편차 σ" val={fmt2(stats.sigma)} color="text-emerald-300" />
          <Chip lbl="q = 1−p" val={fmt2(1 - p)} color="text-pink-300" />
        </div>
      </div>

      {/* ② 시뮬레이션 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">🎲 n번 시행 시뮬레이션</p>
        <button
          type="button"
          onClick={runSim}
          className="mt-3 w-full rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-4 py-3 text-base font-extrabold text-slate-900 transition hover:brightness-110"
        >
          ▶ 지금 n번 시행해보기!
        </button>
        {simResult ? (
          <>
            <p className="mt-3 text-center text-base leading-7 text-slate-300">
              <b className="text-lg text-amber-300">{n}번 시행 → {simResult.hits}번 성공!</b>
              <br />
              <span className="text-sm text-slate-400">
                (이론 평균 {fmt2(stats.mean)}, 표준편차 {fmt2(stats.sigma)})
              </span>
            </p>
            <div className="mt-3 flex max-h-24 flex-wrap justify-center gap-1 overflow-hidden">
              {simResult.outcomes.map((ok, i) => (
                <span
                  key={i}
                  className={
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold " +
                    (ok ? "bg-amber-500/80 text-slate-900" : "bg-slate-500/40 text-slate-400")
                  }
                >
                  {ok ? "✓" : "·"}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-3 text-center text-sm text-slate-500">버튼을 눌러 현재 (n, p)로 직접 시행해 봅니다.</p>
        )}
      </div>

      {/* ③ 실생활 시나리오 */}
      <ScenarioSection />

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 보조: 수식 박스 ──────────────────────────────────────
function FormulaBox({
  tone, lbl, val, formula,
}: { tone: "mean" | "var" | "sigma"; lbl: string; val: string; formula: string }) {
  const cls = tone === "mean"
    ? { box: "border-amber-400/50 bg-amber-400/10", val: "text-amber-300" }
    : tone === "var"
    ? { box: "border-indigo-400/50 bg-indigo-400/10", val: "text-indigo-300" }
    : { box: "border-emerald-400/50 bg-emerald-400/10", val: "text-emerald-300" };
  return (
    <div className={`rounded-2xl border-2 px-3 py-3 text-center ${cls.box}`}>
      <p className="text-xs font-semibold tracking-wider text-slate-400">{lbl}</p>
      <p key={val} className={`mt-1 animate-[pulseR_0.4s_ease] font-mono text-2xl font-black ${cls.val}`}>{val}</p>
      <p className="mt-1 text-[11px] text-slate-500">{formula}</p>
    </div>
  );
}

function Chip({ lbl, val, color }: { lbl: string; val: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
      <p key={val} className={`animate-[pulseR_0.4s_ease] font-mono text-lg font-black ${color}`}>{val}</p>
      <p className="text-[10px] font-semibold tracking-wider text-slate-500">{lbl}</p>
    </div>
  );
}

// ─── 보조: 슬라이더 ───────────────────────────────────────
function RangeRow({
  label, value, display, min, max, step, onChange, tone,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  tone: "orange" | "violet";
}) {
  const id = useId();
  const accent = tone === "orange" ? "accent-amber-500" : "accent-violet-500";
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex items-center justify-between text-sm text-slate-300">
        <span><b>{label}</b></span>
        <span
          key={display}
          className="animate-[pulseR_0.35s_ease] rounded-md bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-0.5 font-mono text-base font-extrabold text-slate-900"
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
        className={`h-2 w-full cursor-pointer rounded-full ${accent} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40`}
      />
    </div>
  );
}

// ─── 시나리오 섹션 ────────────────────────────────────────
function ScenarioSection() {
  const [active, setActive] = useState(0);

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-base font-bold text-amber-300">🌍 실생활 속 이항분포</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SCENARIOS.map((sc, i) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => setActive(i)}
            className={
              i === active
                ? "rounded-lg border border-amber-400/45 bg-amber-400/15 px-3 py-1.5 text-sm font-bold text-amber-200"
                : "rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-bold text-slate-300 hover:bg-white/10"
            }
          >
            {sc.emoji} {sc.title}
          </button>
        ))}
      </div>

      {/* 각 시나리오 패널을 모두 마운트해 슬라이더 상태 보존 */}
      <div className="mt-4 space-y-0">
        {SCENARIOS.map((sc, i) => (
          <div key={sc.id} className={i === active ? "" : "hidden"}>
            <ScenarioPanel sc={sc} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ScenarioPanel({ sc }: { sc: Scenario }) {
  const [n, setN] = useState(sc.nDefault);
  const [pPct, setPPct] = useState(sc.pDefault);
  const p = pPct / 100;
  const stats = useMemo(() => computeStats(n, p), [n, p]);
  const lo = Math.max(0, Math.round(stats.mean - stats.sigma));
  const hi = Math.min(n, Math.round(stats.mean + stats.sigma));

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{sc.emoji}</span>
        <div>
          <p className="text-lg font-extrabold text-slate-100">{sc.title}</p>
          <p className="text-sm text-slate-400">{sc.baseDesc}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <RangeRow
          label={`${sc.nLabel} n`}
          value={n}
          display={String(n)}
          min={sc.nMin}
          max={sc.nMax}
          step={sc.nStep}
          onChange={setN}
          tone="orange"
        />
        <RangeRow
          label={`${sc.pLabel} p`}
          value={pPct}
          display={p.toFixed(2)}
          min={sc.pMin}
          max={sc.pMax}
          step={sc.pStep}
          onChange={setPPct}
          tone="violet"
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatCell tone="mean" lbl="평균 E(X) = np" val={fmt2(stats.mean)} />
        <StatCell tone="var" lbl="분산 V(X) = npq" val={fmt2(stats.vari)} />
        <StatCell tone="sigma" lbl="표준편차 σ(X)" val={fmt2(stats.sigma)} />
      </div>

      <div className="mt-3">
        <BinomialChartSVG n={n} p={p} height={150} />
      </div>
      <p className="mt-1 text-center text-[11px] text-slate-500">
        ← 성공 횟수 →  |  <span className="text-amber-300">노란 점선</span> = 평균  |{" "}
        <span className="text-emerald-300">초록 영역</span> = μ ± σ
      </p>

      <div className="mt-3 rounded-r-lg border-l-4 border-amber-400 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-slate-200">
        <b>B({n}, {p.toFixed(2)})</b> 이항분포 기준 — 평균{" "}
        <b className="text-amber-300">{fmt2(stats.mean)}{sc.unit}</b> {sc.verb}, 표준편차{" "}
        <b className="text-emerald-300">{fmt2(stats.sigma)}</b>. 대부분의 경우{" "}
        <b className="text-indigo-300">{lo}~{hi}{sc.unit}</b> 범위에 분포해요. (분산 ={" "}
        {fmt2(stats.vari)})
      </div>
    </div>
  );
}

function StatCell({ tone, lbl, val }: { tone: "mean" | "var" | "sigma"; lbl: string; val: string }) {
  const cls = tone === "mean" ? "text-amber-300" : tone === "var" ? "text-indigo-300" : "text-emerald-300";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-center">
      <p key={val} className={`animate-[pulseR_0.4s_ease] font-mono text-xl font-black ${cls}`}>{val}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{lbl}</p>
    </div>
  );
}

// ─── SVG 이항분포 차트 ────────────────────────────────────
function BinomialChartSVG({ n, p, height }: { n: number; p: number; height: number }) {
  const W = 700;
  const H = height;
  const PL = 36, PR = 12, PT = 18, PB = 28;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;

  const q = 1 - p;
  const mean = n * p;
  const sigma = Math.sqrt(n * p * q);
  const probs = Array.from({ length: n + 1 }, (_, k) => binomPMF(n, p, k));
  const maxP = Math.max(...probs);

  // x 범위: μ ± 4σ
  const xMin = Math.max(0, Math.floor(mean - 4 * sigma) - 1);
  const xMax = Math.min(n, Math.ceil(mean + 4 * sigma) + 1);
  const cnt = xMax - xMin + 1;
  const cellW = innerW / cnt;
  const barW = Math.max(1, cellW - 2);
  const xPos = (k: number) => PL + (k - xMin + 0.5) * cellW;

  // μ±σ 영역
  const sigmaLeft = xPos(mean - sigma);
  const sigmaRight = xPos(mean + sigma);

  // x축 레이블 간격
  const step = cnt > 20 ? Math.ceil(cnt / 12) : 1;

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="이항분포 막대 차트">
        {/* μ±σ 영역 */}
        <rect
          x={Math.max(PL, sigmaLeft)}
          y={PT}
          width={Math.max(0, Math.min(W - PR, sigmaRight) - Math.max(PL, sigmaLeft))}
          height={innerH}
          fill="rgba(16,185,129,0.10)"
        />

        {/* 막대 */}
        {Array.from({ length: cnt }, (_, i) => {
          const k = xMin + i;
          const v = probs[k] ?? 0;
          const bh = innerH * (v / maxP);
          const cx = xPos(k);
          const dist = sigma > 0 ? Math.abs(k - mean) / sigma : 0;
          const alpha = Math.max(0.4, 1 - dist * 0.18);
          const inSigma = k >= mean - sigma && k <= mean + sigma;
          const fill = inSigma
            ? `rgba(99,102,241,${alpha})`
            : `rgba(99,102,241,${alpha * 0.55})`;
          return (
            <rect
              key={k}
              x={cx - barW / 2}
              y={PT + innerH - bh}
              width={barW}
              height={bh}
              rx={3}
              fill={fill}
            />
          );
        })}

        {/* 평균 점선 */}
        <line
          x1={xPos(mean)}
          y1={PT}
          x2={xPos(mean)}
          y2={PT + innerH}
          stroke="#fbbf24"
          strokeWidth={2.5}
          strokeDasharray="5 3"
        />

        {/* x축 레이블 */}
        {Array.from({ length: cnt }, (_, i) => {
          const k = xMin + i;
          if (k % step !== 0) return null;
          return (
            <text
              key={k}
              x={xPos(k)}
              y={H - 8}
              textAnchor="middle"
              fontSize={10}
              fill="rgba(148,163,184,0.85)"
            >
              {k}
            </text>
          );
        })}

        {/* 평균 라벨 */}
        <text
          x={xPos(mean)}
          y={PT - 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="#fbbf24"
        >
          μ={fmt2(mean)}
        </text>

        {/* y축 라벨 (확률) */}
        <text x={4} y={PT + innerH / 2} textAnchor="middle" fontSize={10} fill="rgba(148,163,184,0.7)" transform={`rotate(-90 4 ${PT + innerH / 2})`}>
          P(X = k)
        </text>
      </svg>
    </div>
  );
}

// ─── 통계 계산 ────────────────────────────────────────────
function computeStats(n: number, p: number) {
  const q = 1 - p;
  const mean = n * p;
  const vari = n * p * q;
  const sigma = Math.sqrt(vari);
  return { mean, vari, sigma };
}
