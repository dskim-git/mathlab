"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "around_95",
    prompt:
      "신뢰도를 95%로 두고 ‘표본 100세트 새로 추출’을 여러 번 눌러 보았을 때, m을 포함한 구간 개수는 보통 몇 개쯤이었나요? 왜 매번 정확히 95개가 아니라 그 근처에서 흔들리는지 본인의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 보통 92~97개 정도가 나왔다. 100세트는 무한이 아니라 유한 표본이라서 무작위로 흔들린다. 시도 횟수를 많이 늘리면 평균 포함 비율이 95에 점점 가까워진다.",
  },
  {
    id: "conf_changes",
    prompt:
      "신뢰도를 80% / 95% / 99%로 바꿔 보면 녹색(포함) 비율과 신뢰구간의 길이는 어떻게 달라졌나요? 표본 크기 n을 작게/크게 했을 때 100개 구간의 모양은 또 어떻게 변했나요?",
    kind: "text",
    placeholder:
      "예: 신뢰도를 높이면 포함 비율은 더 커지지만 한 구간의 길이가 늘어났다. n을 키우면 모든 구간이 짧고 m 주변에 촘촘히 모였다.",
  },
  {
    id: "wrong_interpretation",
    prompt:
      "‘95% 신뢰구간은 모평균이 그 구간 안에 있을 확률이 95%다’라는 친구의 말을 이 활동을 본 뒤 어떻게 바로잡아 설명할 수 있을까요?",
    kind: "text",
    placeholder:
      "예: 이미 만든 구간 하나에 대해서는 m이 들어 있거나 없거나 둘 중 하나라 확률 95%가 아니다. 같은 방법으로 매우 많이 만든 신뢰구간들 중 약 95%가 m을 포함한다는 뜻이다.",
  },
];

// ─── 수치 헬퍼 ─────────────────────────────────────────
function normPpf(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const plow = 0.02425;
  const phigh = 1 - plow;
  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

function tPpf(p: number, df: number): number {
  if (df > 200) return normPpf(p);
  const z = normPpf(p);
  const g1 = (z ** 3 + z) / (4 * df);
  const g2 = (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df ** 2);
  const g3 = (3 * z ** 7 + 19 * z ** 5 + 17 * z ** 3 - 15 * z) / (384 * df ** 3);
  return z + g1 + g2 + g3;
}

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
  for (let i = 0; i < 200; i++) {
    let v = 168 + boxMuller(rng) * 6.2;
    v = Math.max(150, Math.min(188, v));
    arr.push(Math.round(v * 10) / 10);
  }
  return arr;
}
function makeScores(): number[] {
  const rng = mulberry32(73821);
  const arr: number[] = [];
  for (let i = 0; i < 200; i++) {
    let v = 72 + boxMuller(rng) * 14;
    v = Math.max(15, Math.min(100, v));
    arr.push(Math.round(v));
  }
  return arr;
}
function makeJumprope(): number[] {
  const rng = mulberry32(91234);
  const arr: number[] = [];
  for (let i = 0; i < 200; i++) {
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
  heights: { label: "학생 키", data: makeHeights(), unit: "cm", showInt: false },
  scores: { label: "수학 시험 점수", data: makeScores(), unit: "점", showInt: true },
  jumprope: { label: "1분 줄넘기 횟수", data: makeJumprope(), unit: "회", showInt: true },
};

type PopStats = {
  n: number;
  mu: number;
  sd: number;
  variance: number;
  min: number;
  max: number;
};
function popStats(arr: number[]): PopStats {
  const n = arr.length;
  const mu = arr.reduce((a, b) => a + b, 0) / n;
  const v = arr.reduce((s, x) => s + (x - mu) ** 2, 0) / n;
  return {
    n,
    mu,
    sd: Math.sqrt(v),
    variance: v,
    min: Math.min(...arr),
    max: Math.max(...arr),
  };
}

type Interval = { lo: number; hi: number; mean: number; ok: boolean };
type DrawConfig = {
  pop: Population;
  ps: PopStats;
  n: number;
  conf: number;
  useSigma: boolean;
  rng: () => number;
};

function drawOneSample(cfg: DrawConfig): { mean: number; s: number } {
  const data = cfg.pop.data;
  const N = data.length;
  const vals = new Array<number>(cfg.n);
  for (let i = 0; i < cfg.n; i++) vals[i] = data[Math.floor(cfg.rng() * N)];
  const mean = vals.reduce((a, b) => a + b, 0) / cfg.n;
  let s = 0;
  if (cfg.n > 1) {
    const v = vals.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (cfg.n - 1);
    s = Math.sqrt(v);
  }
  return { mean, s };
}

function makeCI(cfg: DrawConfig, sam: { mean: number; s: number }): Interval {
  const alpha = 1 - cfg.conf;
  let half: number;
  if (cfg.useSigma) {
    const z = normPpf(1 - alpha / 2);
    half = z * (cfg.ps.sd / Math.sqrt(cfg.n));
  } else {
    const tt = tPpf(1 - alpha / 2, Math.max(1, cfg.n - 1));
    half = tt * (sam.s / Math.sqrt(cfg.n));
  }
  const lo = sam.mean - half;
  const hi = sam.mean + half;
  const ok = lo <= cfg.ps.mu && cfg.ps.mu <= hi;
  return { lo, hi, mean: sam.mean, ok };
}

function fmt(v: number, d = 2): string {
  if (!isFinite(v)) return "--";
  return Number(v.toFixed(d)).toString();
}

// ─── 메인 ─────────────────────────────────────────────────
export default function CiMeaningLab() {
  const [popKey, setPopKey] = useState<PopKey>("heights");
  const [n, setN] = useState(30);
  const [conf, setConf] = useState(0.95);
  const [useSigma, setUseSigma] = useState(true);

  // RNG + 초기 100개 intervals 를 lazy init 으로 함께 생성 → effect setState 회피.
  const [drawRng] = useState<() => number>(() =>
    mulberry32(Date.now() & 0xffffffff)
  );
  const [intervals, setIntervals] = useState<Interval[]>(() => {
    const cfg: DrawConfig = {
      pop: POPULATIONS.heights,
      ps: popStats(POPULATIONS.heights.data),
      n: 30,
      conf: 0.95,
      useSigma: true,
      rng: drawRng,
    };
    const arr: Interval[] = [];
    for (let i = 0; i < 100; i++) arr.push(makeCI(cfg, drawOneSample(cfg)));
    return arr;
  });
  // 첫 추출 결과의 포함 개수로 trialHistory 시작.
  const [trialHistory, setTrialHistory] = useState<number[]>(() => [
    intervals.filter((x) => x.ok).length,
  ]);

  const pop = POPULATIONS[popKey];
  const ps = useMemo(() => popStats(pop.data), [pop.data]);

  // 메인 액션: 표본 100세트 새로 추출
  function handleDraw() {
    const cfg: DrawConfig = { pop, ps, n, conf, useSigma, rng: drawRng };
    const arr: Interval[] = [];
    for (let i = 0; i < 100; i++) arr.push(makeCI(cfg, drawOneSample(cfg)));
    setIntervals(arr);
    const okN = arr.filter((x) => x.ok).length;
    setTrialHistory((prev) => [...prev, okN]);
    setShown(100);
  }

  // 프리셋 변경 — 모집단 + intervals 초기화
  function handlePreset(key: PopKey) {
    setPopKey(key);
    setTrialHistory([]);
    setShown(100);
    const nextPop = POPULATIONS[key];
    const nextPs = popStats(nextPop.data);
    const cfg: DrawConfig = {
      pop: nextPop,
      ps: nextPs,
      n,
      conf,
      useSigma,
      rng: drawRng,
    };
    const arr: Interval[] = [];
    for (let i = 0; i < 100; i++) arr.push(makeCI(cfg, drawOneSample(cfg)));
    setIntervals(arr);
    setTrialHistory([arr.filter((x) => x.ok).length]);
  }

  function handleClearHistory() {
    setTrialHistory([]);
  }

  // 애니메이션 — shown 0→100, 30ms 마다 2씩
  const [shown, setShown] = useState(100);
  const animRef = useRef<number | null>(null);
  function startReplay() {
    if (animRef.current !== null) {
      window.clearInterval(animRef.current);
      animRef.current = null;
    }
    setShown(0);
    const id = window.setInterval(() => {
      setShown((prev) => {
        const next = prev + 2;
        if (next >= 100) {
          if (animRef.current !== null) {
            window.clearInterval(animRef.current);
            animRef.current = null;
          }
          return 100;
        }
        return next;
      });
    }, 30);
    animRef.current = id;
  }
  useEffect(
    () => () => {
      if (animRef.current !== null) window.clearInterval(animRef.current);
    },
    []
  );

  const okCount = intervals.slice(0, shown).filter((x) => x.ok).length;
  const badCount = shown - okCount;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">
          🌐 신뢰도의 의미 — 100개의 신뢰구간
        </h3>
        <p className="mt-2 leading-7 text-slate-300">
          같은 모집단에서 표본을 <b className="text-amber-300">100세트</b> 뽑아 95% 신뢰구간을
          100개 만들어 봐요. 그중 모평균 <b className="text-amber-300">m</b>을 포함하는 구간이
          정말 약 <b className="text-amber-300">95개</b>인지 직접 확인해 봅시다!
        </p>
      </div>

      {/* ① 모집단 선택 */}
      <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-emerald-200">
          🎒 모집단 선택{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            실생활 데이터 3가지
          </span>
        </h4>
        <div className="flex flex-wrap gap-2">
          <PresetBtn active={popKey === "heights"} onClick={() => handlePreset("heights")}>
            📏 학생 키 (cm)
          </PresetBtn>
          <PresetBtn active={popKey === "scores"} onClick={() => handlePreset("scores")}>
            📝 수학 시험 점수 (점)
          </PresetBtn>
          <PresetBtn active={popKey === "jumprope"} onClick={() => handlePreset("jumprope")}>
            🪢 1분 줄넘기 횟수 (회)
          </PresetBtn>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <InfoCard label="모집단 크기 N" value={String(pop.data.length)} />
          <InfoCard label="모평균 m" value={fmt(ps.mu)} />
          <InfoCard label="모표준편차 σ" value={fmt(ps.sd)} />
          <InfoCard label="단위" value={pop.unit} />
        </div>
      </div>

      {/* ② 컨트롤 */}
      <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-cyan-200">
          🎲 표본 추출과 신뢰도 설정{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            표본 100세트를 한꺼번에
          </span>
        </h4>

        <div className="space-y-2">
          <CtrlRow
            id="cim-n"
            label="표본 크기 n"
            value={n}
            min={2}
            max={100}
            step={1}
            display={String(n)}
            onChange={setN}
          />
          <CtrlRow
            id="cim-conf"
            label="신뢰도 (%)"
            value={Math.round(conf * 100)}
            min={50}
            max={99}
            step={1}
            display={`${Math.round(conf * 100)}%`}
            onChange={(v) => setConf(v / 100)}
          />
          <label className="flex items-center gap-3 rounded-xl border-[1.5px] border-violet-400/35 bg-violet-500/10 px-3 py-2 text-sm font-extrabold text-violet-200">
            <input
              type="checkbox"
              checked={useSigma}
              onChange={(e) => setUseSigma(e.target.checked)}
              className="h-4 w-4 accent-violet-400"
            />
            길이를 일정하게 (모표준편차 σ 사용: z-구간)
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDraw}
            className="flex-1 min-w-[170px] rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-emerald-400 hover:to-emerald-600 active:scale-95"
          >
            🎲 표본 100세트 새로 추출
          </button>
          <button
            type="button"
            onClick={startReplay}
            className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-blue-400 hover:to-blue-600 active:scale-95"
          >
            ▶ 한 줄씩 다시 그리기 (애니메이션)
          </button>
          <button
            type="button"
            onClick={handleClearHistory}
            className="rounded-xl border border-slate-400/30 bg-slate-700/70 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-700/95 active:scale-95"
          >
            🔄 누적 통계 초기화
          </button>
        </div>
      </div>

      {/* ③ 100개 CI */}
      <div className="mt-3 rounded-2xl border border-violet-400/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-violet-200">
          📊 100개의 신뢰구간{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            초록=m포함, 빨강=m제외
          </span>
        </h4>
        <div className="rounded-xl border-[1.5px] border-violet-400/30 bg-slate-950/55 p-3">
          <CICanvas
            intervals={intervals}
            shown={shown}
            mu={ps.mu}
            unit={pop.unit}
            showInt={pop.showInt}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl border-2 border-emerald-400/50 bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 p-4">
          <div className="text-4xl font-extrabold tabular-nums text-emerald-300">
            {okCount}
          </div>
          <div className="text-sm leading-6 text-slate-200">
            <div className="text-lg font-extrabold text-emerald-100">
              m을 포함한 신뢰구간 / 100개
            </div>
            <div>
              선택한 신뢰도:{" "}
              <b className="text-yellow-200">{Math.round(conf * 100)}%</b> · 기대:{" "}
              <b className="text-yellow-200">약 {Math.round(conf * 100)}개</b> 포함
            </div>
          </div>
          <div className="ml-auto text-4xl font-extrabold tabular-nums text-rose-300">
            {badCount}
          </div>
          <div className="text-sm leading-6 text-slate-200">
            <div className="text-base font-extrabold text-rose-100">m 제외 / 100개</div>
            <div className="text-xs text-slate-400">
              난수 시드가 바뀔 때마다 포함 개수는 95 근처에서 흔들립니다.
            </div>
          </div>
        </div>

        {/* 누적 히스토리 + 평균 차트 */}
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border-[1.5px] border-cyan-400/30 bg-slate-950/55 p-3">
            <h5 className="mb-1 flex items-center justify-between text-sm font-extrabold text-cyan-200">
              <span>
                📈 최근 추출 누적 (시도 ={" "}
                <span className="text-yellow-200">{trialHistory.length}</span>회)
              </span>
              <span className="text-xs font-bold text-slate-300">
                평균 포함 비율:{" "}
                <b className="text-yellow-200">
                  {trialHistory.length > 0
                    ? fmt(trialHistory.reduce((a, b) => a + b, 0) / trialHistory.length, 1)
                    : "--"}{" "}
                  / 100
                </b>
              </span>
            </h5>
            <TrialChartCanvas history={trialHistory} conf={conf} />
          </div>
          <div className="rounded-xl border-[1.5px] border-cyan-400/30 bg-slate-950/55 p-3">
            <h5 className="mb-1 flex items-center justify-between text-sm font-extrabold text-cyan-200">
              <span>🔍 표본평균 X̄들의 분포</span>
              <span className="text-xs font-bold text-slate-300">
                n={n} 인 표본 100개의 X̄
              </span>
            </h5>
            <MeanHistCanvas intervals={intervals} mu={ps.mu} showInt={pop.showInt} />
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-amber-300/45 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
          <span className="text-xl">💡</span>
          <span>
            “신뢰도 95%”는 “지금 만든 신뢰구간 안에 m이 95% 확률로 들어있다”는 뜻이{" "}
            <b className="text-yellow-200">아니에요</b>.
            <br />
            <b className="text-yellow-200">
              같은 방법으로 표본을 매우 많이 뽑으면, 그렇게 만든 신뢰구간들 중 약 95%가 m을
              포함한다
            </b>
            는 의미예요!
          </span>
        </div>
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <ReflectionForm questions={REFLECTION_QUESTIONS} />
      </div>
    </section>
  );
}

// ─── 빌딩블록 ──────────────────────────────────────────
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
          ? "border-emerald-200 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md"
          : "border-transparent bg-gradient-to-br from-slate-600 to-slate-700 text-white hover:-translate-y-px"
      }`}
    >
      {children}
    </button>
  );
}
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-[1.5px] border-emerald-400/40 bg-emerald-500/10 p-3 text-center">
      <div className="text-sm font-extrabold tracking-wide text-emerald-300">{label}</div>
      <div className="mt-1 text-xl font-extrabold leading-tight text-emerald-100">{value}</div>
    </div>
  );
}

function CtrlRow({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-cyan-400/30 bg-cyan-500/10 px-3 py-2">
      <label htmlFor={id} className="min-w-[140px] text-sm font-extrabold text-cyan-200">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 flex-1 accent-cyan-400"
      />
      <span className="min-w-[78px] rounded-md bg-slate-950/70 px-3 py-1 text-center text-lg font-extrabold text-amber-300">
        {display}
      </span>
    </div>
  );
}

// ─── CI Canvas ────────────────────────────────────────
function CICanvas({
  intervals,
  shown,
  mu,
  unit,
  showInt,
}: {
  intervals: Interval[];
  shown: number;
  mu: number;
  unit: string;
  showInt: boolean;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 980;
  const H = 760;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 58;
    const padR = 140;
    const padT = 30;
    const padB = 44;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    if (intervals.length === 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎲 위 버튼으로 표본을 추출해 주세요", W / 2, H / 2);
      return;
    }

    let lo = Math.min(...intervals.map((c) => c.lo), mu);
    let hi = Math.max(...intervals.map((c) => c.hi), mu);
    const pad = (hi - lo) * 0.07 || 1;
    lo -= pad;
    hi += pad;
    const X = (v: number) => padL + ((v - lo) / (hi - lo)) * plotW;

    ctx.strokeStyle = "rgba(148,163,184,.15)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    const xTicks = 6;
    for (let i = 0; i <= xTicks; i++) {
      const v = lo + ((hi - lo) * i) / xTicks;
      const x = X(v);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const xMu = X(mu);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xMu, padT);
    ctx.lineTo(xMu, padT + plotH);
    ctx.stroke();
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("m = " + fmt(mu) + " " + unit, xMu, padT - 7);

    const rowH = plotH / 100;
    for (let i = 0; i < Math.min(shown, intervals.length); i++) {
      const it = intervals[i];
      const y = padT + i * rowH + rowH / 2;
      const x1 = X(it.lo);
      const x2 = X(it.hi);
      const xm = X(it.mean);
      ctx.strokeStyle = it.ok ? "rgba(34,197,94,.88)" : "rgba(244,63,94,.88)";
      ctx.lineWidth = Math.max(1.5, rowH - 2);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();

      ctx.fillStyle = it.ok ? "#dcfce7" : "#fee2e2";
      ctx.beginPath();
      ctx.arc(xm, y, Math.max(1.5, rowH * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(148,163,184,.5)";
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    ctx.lineTo(W - padR, padT + plotH);
    ctx.stroke();
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= xTicks; i++) {
      const v = lo + ((hi - lo) * i) / xTicks;
      ctx.fillText(showInt ? String(Math.round(v)) : v.toFixed(1), X(v), padT + plotH + 6);
    }
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("값 (" + unit + ")", W / 2, H - 16);

    // 오른쪽 통계
    const okCnt = intervals.slice(0, shown).filter((x) => x.ok).length;
    const badCnt = shown - okCnt;
    ctx.fillStyle = "#86efac";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("✔ m 포함: " + okCnt, W - padR + 10, padT + 20);
    ctx.fillStyle = "#fca5a5";
    ctx.fillText("✘ m 제외: " + badCnt, W - padR + 10, padT + 44);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px sans-serif";
    ctx.fillText("진행: " + shown + "/100", W - padR + 10, padT + 68);
  }, [intervals, shown, mu, unit, showInt]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[760px] w-full rounded-lg bg-slate-950/60"
      aria-label="100개 신뢰구간 시각화"
    />
  );
}

function TrialChartCanvas({
  history,
  conf,
}: {
  history: number[];
  conf: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 700;
  const H = 150;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 30;
    const padR = 18;
    const padT = 10;
    const padB = 20;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const yMin = 50;
    const yMax = 100;
    const Y = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

    ctx.strokeStyle = "rgba(148,163,184,.13)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    for (const v of [60, 70, 80, 90, 100]) {
      ctx.beginPath();
      ctx.moveTo(padL, Y(v));
      ctx.lineTo(W - padR, Y(v));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const exp = Math.round(conf * 100);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, Y(exp));
    ctx.lineTo(W - padR, Y(exp));
    ctx.stroke();
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("기대 " + exp, padL + 4, Y(exp) - 8);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const v of [50, 75, 100]) {
      ctx.fillText(String(v), padL - 4, Y(v));
    }

    const T = history.length;
    if (T === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("아직 추출이 없어요", W / 2, H / 2);
      return;
    }
    const X = (i: number) =>
      padL + (T === 1 ? plotW / 2 : (i / (T - 1)) * plotW);

    ctx.strokeStyle = "rgba(56,189,248,.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    history.forEach((v, i) => {
      if (i === 0) ctx.moveTo(X(i), Y(v));
      else ctx.lineTo(X(i), Y(v));
    });
    ctx.stroke();

    history.forEach((v, i) => {
      ctx.fillStyle =
        v >= exp - 3 && v <= exp + 3
          ? "#86efac"
          : v < exp - 3
          ? "#fca5a5"
          : "#7dd3fc";
      ctx.beginPath();
      ctx.arc(X(i), Y(v), 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [history, conf]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[150px] w-full rounded-lg bg-slate-950/60"
      aria-label="시도별 포함 개수"
    />
  );
}

function MeanHistCanvas({
  intervals,
  mu,
  showInt,
}: {
  intervals: Interval[];
  mu: number;
  showInt: boolean;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 700;
  const H = 150;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 30;
    const padR = 18;
    const padT = 10;
    const padB = 24;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    if (intervals.length === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("표본을 추출하면 표본평균 분포가 표시돼요", W / 2, H / 2);
      return;
    }
    const means = intervals.map((c) => c.mean);
    const lo = Math.min(...means);
    const hi = Math.max(...means);
    const nbins = 18;
    const binW = (hi - lo) / nbins || 1;
    const bins = new Array<number>(nbins).fill(0);
    for (const v of means) {
      let k = Math.floor((v - lo) / binW);
      if (k < 0) k = 0;
      if (k >= nbins) k = nbins - 1;
      bins[k]++;
    }
    const cMax = Math.max(...bins);
    const X = (i: number) => padL + (i / nbins) * plotW;
    const Y = (c: number) =>
      padT + plotH - (c / Math.max(1, cMax)) * plotH * 0.96;
    const Xv = (v: number) => padL + ((v - lo) / (hi - lo || 1)) * plotW;

    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Xv(mu), padT);
    ctx.lineTo(Xv(mu), padT + plotH);
    ctx.stroke();
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("m", Xv(mu), padT - 1);

    ctx.fillStyle = "rgba(56,189,248,.6)";
    for (let i = 0; i < nbins; i++) {
      const x = X(i);
      const y = Y(bins[i]);
      ctx.fillRect(x + 1, y, plotW / nbins - 2, padT + plotH - y);
    }

    ctx.strokeStyle = "rgba(148,163,184,.5)";
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    ctx.lineTo(W - padR, padT + plotH);
    ctx.stroke();
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const t of [0, 0.5, 1]) {
      const v = lo + t * (hi - lo);
      ctx.fillText(
        showInt ? String(Math.round(v)) : v.toFixed(1),
        padL + t * plotW,
        padT + plotH + 5
      );
    }
  }, [intervals, mu, showInt]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[150px] w-full rounded-lg bg-slate-950/60"
      aria-label="표본평균 분포 히스토그램"
    />
  );
}
