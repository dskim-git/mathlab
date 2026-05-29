"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "exbar_vxbar",
    prompt:
      "표본 크기 n을 늘리며 시뮬레이션해 봤을 때, 표본평균의 평균 E(X̄)과 분산 V(X̄)은 각각 어떻게 변했나요? 모집단 통계량 m, σ²과 어떤 관계가 있었나요?",
    kind: "text",
    placeholder:
      "예: E(X̄)은 n이 바뀌어도 m에 가까운 값으로 고정됐고, V(X̄)은 n이 커질수록 작아져 σ²/n 꼴이었다.",
  },
  {
    id: "enum_vs_random",
    prompt:
      "‘모든 경우(N^n)를 한꺼번에’ 버튼을 눌렀을 때와, 표본을 100번씩 직접 뽑았을 때 결과가 어떻게 달랐나요? 왜 그런 차이가 생긴다고 생각하나요?",
    kind: "text",
    placeholder:
      "예: 모든 경우를 열거하면 E(X̄), V(X̄)이 이론값과 정확히 일치했고, 100번 뽑기는 약간 흔들리는 추정값이 나왔다. 이는 100회는 무한 반복이 아니라 표본 추출이라서다.",
  },
  {
    id: "across_tabs",
    prompt:
      "주머니 속 공·주사위·홀수 카드 세 모집단은 값이 모두 달랐는데도, n이 커질수록 X̄의 분포에서 공통적으로 나타난 현상은 무엇이었나요? n을 크게 한다는 것은 모평균 추정과 어떻게 연결되나요?",
    kind: "text",
    placeholder:
      "예: 세 모집단 모두 n이 커질수록 X̄의 분포가 m 근처에 모이고 종 모양에 가까워졌다. n을 크게 하면 X̄이 m을 더 정확히 추정할 수 있다.",
  },
];

// ─── 메인 ─────────────────────────────────────────────────
type TabKey = "balls" | "dice" | "cards";

type Theme = {
  // 모집단 통/상자 보더 색 (Tailwind 임의값으로)
  vizBorder: string; // ring color
  // 모집단 통계 패널 색
  popStatsBorder: string;
  popStatsBg: string;
  popStatsLabel: string;
  popStatsVal: string;
  // 공 색 — radial-gradient 임의값
  ballGradient: string; // background image (radial-gradient)
  ballBorder: string;
  ballText: string;
  // 히스토그램 막대 그라데이션 stops
  histStart: string;
  histEnd: string;
  // 탭 액티브
  accentText: string;
};

const THEMES: Record<TabKey, Theme> = {
  balls: {
    vizBorder: "border-amber-400/45",
    popStatsBorder: "border-amber-400/45",
    popStatsBg: "bg-amber-500/10",
    popStatsLabel: "text-amber-200",
    popStatsVal: "text-amber-100",
    ballGradient:
      "bg-[radial-gradient(circle_at_30%_30%,#fde047,#f59e0b)]",
    ballBorder: "border-[#fbbf24]",
    ballText: "text-slate-800",
    histStart: "#fde047",
    histEnd: "rgba(99,102,241,.45)",
    accentText: "text-amber-200",
  },
  dice: {
    vizBorder: "border-rose-400/55",
    popStatsBorder: "border-rose-400/55",
    popStatsBg: "bg-rose-500/10",
    popStatsLabel: "text-rose-200",
    popStatsVal: "text-rose-100",
    ballGradient:
      "bg-[radial-gradient(circle_at_30%_30%,#fca5a5,#dc2626)]",
    ballBorder: "border-[#f87171]",
    ballText: "text-white",
    histStart: "#fda4af",
    histEnd: "rgba(99,102,241,.45)",
    accentText: "text-rose-200",
  },
  cards: {
    vizBorder: "border-emerald-400/55",
    popStatsBorder: "border-emerald-400/55",
    popStatsBg: "bg-emerald-500/10",
    popStatsLabel: "text-emerald-200",
    popStatsVal: "text-emerald-100",
    ballGradient:
      "bg-[radial-gradient(circle_at_30%_30%,#a7f3d0,#059669)]",
    ballBorder: "border-[#34d399]",
    ballText: "text-emerald-900",
    histStart: "#86efac",
    histEnd: "rgba(99,102,241,.45)",
    accentText: "text-emerald-200",
  },
};

export default function SampleMeanDistLab() {
  const [tab, setTab] = useState<TabKey>("balls");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">
          🎲 표본평균의 평균·분산·표준편차 시뮬레이터
        </h3>
        <p className="mt-2 leading-7 text-slate-300">
          표본의 크기 <b>n</b>을 늘리며 표본평균 X̄ 의{" "}
          <b className="text-rose-300">평균</b>·<b className="text-violet-300">분산</b>·
          <b className="text-cyan-300">표준편차</b>가{" "}
          <b className="text-amber-300">m, σ²/n, σ/√n</b> 으로 수렴하는 모습을 직접 관찰합니다.
          ‘모든 경우(Nⁿ)’ 버튼은 이론값과 정확히 일치해요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabBtn active={tab === "balls"} tone="amber" onClick={() => setTab("balls")}>
          🎒 주머니 속 공 {"{2,4,6,8}"}
        </TabBtn>
        <TabBtn active={tab === "dice"} tone="rose" onClick={() => setTab("dice")}>
          🎲 주사위 {"{1..6}"}
        </TabBtn>
        <TabBtn active={tab === "cards"} tone="emerald" onClick={() => setTab("cards")}>
          🃏 홀수 카드 {"{1,3,5,7,9}"}
        </TabBtn>
      </div>

      {/* 동시 마운트 + hidden 패턴: 탭 전환해도 누적 상태/슬라이더 보존 */}
      <div className={tab === "balls" ? "mt-4" : "mt-4 hidden"}>
        <PopulationLab
          tabKey="balls"
          population={[2, 4, 6, 8]}
          maxN={5}
          popIcon="🎒"
          popLabel="공 4개가 든 주머니 (모집단)"
          theme={THEMES.balls}
        />
      </div>
      <div className={tab === "dice" ? "mt-4" : "mt-4 hidden"}>
        <PopulationLab
          tabKey="dice"
          population={[1, 2, 3, 4, 5, 6]}
          maxN={5}
          popIcon="🎲"
          popLabel="주사위 한 개의 눈 (모집단)"
          theme={THEMES.dice}
        />
      </div>
      <div className={tab === "cards" ? "mt-4" : "mt-4 hidden"}>
        <PopulationLab
          tabKey="cards"
          population={[1, 3, 5, 7, 9]}
          maxN={5}
          popIcon="🃏"
          popLabel="카드 5장 (모집단)"
          theme={THEMES.cards}
        />
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <ReflectionForm questions={REFLECTION_QUESTIONS} />
      </div>
    </section>
  );
}

// ─── 탭 버튼 ─────────────────────────────────────────────
type Tone = "amber" | "rose" | "emerald";
const TAB_ACTIVE: Record<Tone, string> = {
  amber: "bg-amber-300 text-slate-900",
  rose: "bg-rose-300 text-slate-900",
  emerald: "bg-emerald-300 text-slate-900",
};
const TAB_INACTIVE: Record<Tone, string> = {
  amber: "border border-amber-300/30 text-amber-200 hover:bg-amber-300/10",
  rose: "border border-rose-300/30 text-rose-200 hover:bg-rose-300/10",
  emerald:
    "border border-emerald-300/30 text-emerald-200 hover:bg-emerald-300/10",
};
function TabBtn({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: Tone;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const cls = active ? TAB_ACTIVE[tone] : TAB_INACTIVE[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-bold transition ${cls}`}
    >
      {children}
    </button>
  );
}

// =================================================================
// PopulationLab — 모집단별 시뮬레이션 섹션
// =================================================================

type PopulationLabProps = {
  tabKey: TabKey;
  population: number[];
  maxN: number;
  popIcon: string;
  popLabel: string;
  theme: Theme;
};

function fmtNum(v: number, d = 3): string {
  if (!isFinite(v)) return "--";
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
  return v.toFixed(d);
}

function stats(arr: number[]): { mean: number; variance: number; sd: number } {
  if (arr.length === 0) return { mean: NaN, variance: NaN, sd: NaN };
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  const v = arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length;
  return { mean: m, variance: v, sd: Math.sqrt(v) };
}

function enumerateAll(pop: number[], n: number): number[] {
  const total = pop.length ** n;
  const out = new Array<number>(total);
  for (let i = 0; i < total; i++) {
    let k = i;
    let s = 0;
    for (let j = 0; j < n; j++) {
      s += pop[k % pop.length];
      k = Math.floor(k / pop.length);
    }
    out[i] = s / n;
  }
  return out;
}

function sampleOnceFromPop(
  pop: number[],
  n: number
): { idx: number[]; vals: number[]; xbar: number } {
  const idx: number[] = [];
  const vals: number[] = [];
  for (let i = 0; i < n; i++) {
    const k = Math.floor(Math.random() * pop.length);
    idx.push(k);
    vals.push(pop[k]);
  }
  const xbar = vals.reduce((a, b) => a + b, 0) / n;
  return { idx, vals, xbar };
}

const ALL_MAX_ROWS = 5000;

function PopulationLab({
  population,
  maxN,
  popIcon,
  popLabel,
  theme,
}: PopulationLabProps) {
  const N_POP = population.length;
  const M = useMemo(
    () => population.reduce((a, b) => a + b, 0) / N_POP,
    [population, N_POP]
  );
  const SIGMA2 = useMemo(
    () => population.reduce((s, x) => s + (x - M) ** 2, 0) / N_POP,
    [population, M, N_POP]
  );
  const SIGMA = useMemo(() => Math.sqrt(SIGMA2), [SIGMA2]);

  const [n, setN] = useState(2);
  const [xbars, setXbars] = useState<number[]>([]);
  const [lastSample, setLastSample] = useState<{
    idx: number[];
    vals: number[];
    xbar: number;
  } | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const autoRef = useRef(false);

  const currentStats = useMemo(() => stats(xbars), [xbars]);
  const theE = M;
  const theV = SIGMA2 / n;
  const theS = SIGMA / Math.sqrt(n);

  function ratioBar(exp: number, the: number): number {
    if (xbars.length === 0 || the === 0 || !isFinite(exp)) return 0;
    const r = Math.min(exp, the) / Math.max(exp, the);
    return Math.max(0, Math.min(1, r));
  }

  function handleDraw1() {
    const s = sampleOnceFromPop(population, n);
    setLastSample(s);
    setXbars((prev) => [...prev, s.xbar]);
  }

  function handleDraw100() {
    if (autoRef.current) return;
    autoRef.current = true;
    setAutoRunning(true);
    const total = 100;
    let i = 0;
    let lastLocal: ReturnType<typeof sampleOnceFromPop> | null = null;
    const step = () => {
      if (!autoRef.current) {
        autoRef.current = false;
        setAutoRunning(false);
        return;
      }
      const burst = 20;
      const buf: number[] = [];
      for (let k = 0; k < burst && i < total; k++, i++) {
        const s = sampleOnceFromPop(population, n);
        buf.push(s.xbar);
        if (i === total - 1) lastLocal = s;
      }
      // splice 회피: buf 는 step 클로저 안에서 새로 만들어진 배열이라 updater 안에서 spread 안전
      setXbars((prev) => [...prev, ...buf]);
      if (i < total) {
        requestAnimationFrame(step);
      } else {
        autoRef.current = false;
        setAutoRunning(false);
        if (lastLocal) setLastSample(lastLocal);
      }
    };
    requestAnimationFrame(step);
  }

  function handleEnumerate() {
    if (autoRunning) return;
    const arr = enumerateAll(population, n);
    setXbars((prev) => [...prev, ...arr]);
    // 마지막 케이스 표본으로 보여주기 (인덱스 복원)
    const lastIdx = N_POP ** n - 1;
    const vals: number[] = [];
    let k = lastIdx;
    for (let j = 0; j < n; j++) {
      vals.push(population[k % N_POP]);
      k = Math.floor(k / N_POP);
    }
    const last = arr[arr.length - 1];
    setLastSample({ idx: [], vals, xbar: last });
  }

  function handleReset() {
    autoRef.current = false;
    setAutoRunning(false);
    setXbars([]);
    setLastSample(null);
  }

  // 강조 인덱스 집합 (lastSample 의 idx 가 비어있으면 강조 없음)
  const highlightSet = useMemo(
    () => new Set(lastSample?.idx ?? []),
    [lastSample]
  );

  return (
    <div className="space-y-3">
      {/* ① 모집단 */}
      <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/40 p-4">
        <h4 className={`mb-2 text-base font-bold ${theme.accentText}`}>
          {popIcon} 모집단
        </h4>
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <PopulationViz
            population={population}
            popLabel={popLabel}
            highlight={highlightSet}
            theme={theme}
          />
          <div
            className={`flex flex-col gap-1.5 rounded-xl border-[1.5px] p-3 ${theme.popStatsBorder} ${theme.popStatsBg}`}
          >
            <div
              className={`text-center text-xs font-extrabold tracking-wide ${theme.popStatsLabel}`}
            >
              📊 모집단의 통계량
            </div>
            <PopStatRow
              label="모평균 m"
              value={fmtNum(M)}
              labelCls={theme.popStatsLabel}
              valCls={theme.popStatsVal}
            />
            <PopStatRow
              label="모분산 σ²"
              value={fmtNum(SIGMA2)}
              labelCls={theme.popStatsLabel}
              valCls={theme.popStatsVal}
            />
            <PopStatRow
              label="모표준편차 σ"
              value={fmtNum(SIGMA)}
              labelCls={theme.popStatsLabel}
              valCls={theme.popStatsVal}
            />
          </div>
        </div>
      </div>

      {/* ② 표본 추출 */}
      <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/40 p-4">
        <h4 className={`mb-2 text-base font-bold ${theme.accentText}`}>
          🎯 표본 뽑기 <span className="ml-1 text-xs font-normal text-slate-400">(임의·복원추출)</span>
        </h4>

        <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-cyan-400/35 bg-cyan-500/10 px-3 py-2">
          <span className="min-w-[96px] text-sm font-extrabold text-cyan-200">
            표본 크기 n
          </span>
          <input
            type="range"
            min={1}
            max={maxN}
            value={n}
            onChange={(e) => setN(parseInt(e.target.value, 10))}
            disabled={autoRunning}
            className="h-1.5 flex-1 accent-cyan-400"
            aria-label="표본 크기"
          />
          <span className="min-w-[38px] rounded-md bg-slate-950/70 px-3 py-1 text-center text-lg font-extrabold text-amber-300">
            {n}
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDraw1}
            disabled={autoRunning}
            className="flex-1 min-w-[120px] rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-blue-400 hover:to-blue-600 active:scale-95 disabled:opacity-40"
          >
            🎲 표본 1개 뽑기
          </button>
          <button
            type="button"
            onClick={handleDraw100}
            disabled={autoRunning}
            className="flex-1 min-w-[120px] rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-violet-400 hover:to-violet-600 active:scale-95 disabled:opacity-40"
          >
            ⚡ 100번 뽑기
          </button>
          <button
            type="button"
            onClick={handleEnumerate}
            disabled={autoRunning}
            className="flex-1 min-w-[120px] rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-emerald-400 hover:to-emerald-600 active:scale-95 disabled:opacity-40"
          >
            📊 모든 경우 (Nⁿ)
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-400/30 bg-slate-700/70 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-700/95 active:scale-95"
          >
            🔄 초기화
          </button>
        </div>

        <div className="mt-3 rounded-xl border-2 border-emerald-400/40 bg-emerald-400/5 p-3">
          <div className="mb-1.5 flex items-center justify-between text-sm font-extrabold text-emerald-300">
            <span>📦 이번에 뽑힌 {popIcon === "🃏" ? "카드" : "공"}</span>
            <span className="text-amber-100">
              X̄ ={" "}
              {lastSample ? fmtNum(lastSample.xbar, 2) : "--"}
            </span>
          </div>
          {lastSample ? (
            <div className="flex flex-wrap items-center gap-2">
              {lastSample.vals.map((v, i) => (
                <SampleChip key={i} value={v} theme={theme} />
              ))}
            </div>
          ) : (
            <div className="py-1 text-sm italic text-slate-500">아직 뽑지 않았어요</div>
          )}
        </div>
      </div>

      {/* ③ 분포 + 통계 */}
      <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/40 p-4">
        <h4 className={`mb-2 text-base font-bold ${theme.accentText}`}>
          📈 표본평균 X̄ 의 분포
        </h4>

        <div className="rounded-xl border border-cyan-300/20 bg-slate-900/50 p-3">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>가로축: 표본평균 값 · 세로축: 상대도수</span>
            <span>
              누적 <span className="font-extrabold text-amber-300">{xbars.length}</span>회
            </span>
          </div>
          <DistCanvas
            xbars={xbars}
            population={population}
            n={n}
            m={M}
            theme={theme}
          />
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          <StatsCard
            tone="mean"
            head="E(X̄) — 평균"
            value={fmtNum(currentStats.mean)}
            theoryLabel="m"
            theory={fmtNum(theE)}
            ratio={ratioBar(currentStats.mean, theE)}
          />
          <StatsCard
            tone="var"
            head="V(X̄) — 분산"
            value={fmtNum(currentStats.variance)}
            theoryLabel="σ²/n"
            theory={fmtNum(theV)}
            ratio={ratioBar(currentStats.variance, theV)}
          />
          <StatsCard
            tone="sd"
            head="σ(X̄) — 표준편차"
            value={fmtNum(currentStats.sd)}
            theoryLabel="σ/√n"
            theory={fmtNum(theS)}
            ratio={ratioBar(currentStats.sd, theS)}
          />
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl border-[1.5px] border-amber-400/45 bg-amber-500/10 p-3 text-sm leading-6 text-amber-50">
          <span className="text-xl">💡</span>
          <span>
            n을 <b className="text-yellow-200">크게</b> 할수록 X̄ 의 평균은{" "}
            <b className="text-yellow-200">여전히 m</b>이고, 분산은{" "}
            <b className="text-yellow-200">σ²/n</b> 으로 작아져요. 즉 X̄ 이 m 주위에 더
            촘촘히 모입니다!
          </span>
        </div>

        <SummaryTable currentN={n} M={M} SIGMA2={SIGMA2} SIGMA={SIGMA} />
      </div>

      {/* ④ 모든 가능한 표본 */}
      <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/40 p-4">
        <h4 className={`mb-2 text-base font-bold ${theme.accentText}`}>
          📋 n=<span className="text-amber-300">{n}</span>일 때 나올 수 있는 모든 표본
          <span className="ml-2 text-sm font-medium text-slate-400">
            총{" "}
            <span className="font-extrabold text-amber-300">
              {(N_POP ** n).toLocaleString()}
            </span>
            가지
          </span>
        </h4>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-xs text-slate-300">
          <span>
            각 행 = 추출 순서(X<sub>1</sub>, X<sub>2</sub>, …)대로 뽑힌 값 · 합 · 표본평균
          </span>
          <span>n 슬라이더를 바꾸면 자동으로 갱신됩니다</span>
        </div>
        <AllSamplesTable population={population} n={n} />
      </div>
    </div>
  );
}

// ─── PopulationViz ─────────────────────────────────────────
function PopulationViz({
  population,
  popLabel,
  highlight,
  theme,
}: {
  population: number[];
  popLabel: string;
  highlight: Set<number>;
  theme: Theme;
}) {
  const N = population.length;
  const BSIZE = N <= 5 ? 60 : 50;
  // 가로로 균등 배치 — 컨테이너 폭이 동적이라 percentage 로
  return (
    <div
      className={`relative h-[170px] overflow-hidden rounded-[120px/80px] border-2 ${theme.vizBorder} bg-[radial-gradient(ellipse_at_center,rgba(30,41,59,.85),rgba(15,23,42,.95))]`}
    >
      <div className="absolute left-1/2 top-1.5 -translate-x-1/2 text-xs font-bold tracking-wide text-slate-400">
        {popLabel}
      </div>
      <div className="absolute inset-0 flex items-center justify-center gap-3">
        {population.map((v, i) => (
          <PopulationBall
            key={i}
            value={v}
            size={BSIZE}
            picked={highlight.has(i)}
            dimmed={highlight.size > 0 && !highlight.has(i)}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}

function PopulationBall({
  value,
  size,
  picked,
  dimmed,
  theme,
}: {
  value: number;
  size: number;
  picked: boolean;
  dimmed: boolean;
  theme: Theme;
}) {
  // 크기는 동적이라 인라인 style 불가피 — 다만 두 가지 사이즈(60/50)만 쓰니 정적 클래스로 분기
  const sizeCls = size === 60 ? "h-[60px] w-[60px] text-2xl" : "h-[50px] w-[50px] text-xl";
  return (
    <div
      className={`flex items-center justify-center rounded-full border-[3px] font-extrabold transition-all duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] ${sizeCls} ${theme.ballGradient} ${theme.ballBorder} ${theme.ballText} ${
        picked
          ? "scale-110 ring-4 ring-rose-500 shadow-[0_6px_20px_rgba(244,63,94,.6)]"
          : "shadow-[0_4px_12px_rgba(251,191,36,.45),inset_0_-4px_8px_rgba(0,0,0,.2)]"
      } ${dimmed ? "opacity-30 grayscale" : ""}`}
    >
      {value}
    </div>
  );
}

function PopStatRow({
  label,
  value,
  labelCls,
  valCls,
}: {
  label: string;
  value: string;
  labelCls: string;
  valCls: string;
}) {
  return (
    <div className="flex items-center justify-between px-1 py-0.5 text-sm font-bold">
      <span className={labelCls}>{label}</span>
      <span className={`text-base font-extrabold ${valCls}`}>{value}</span>
    </div>
  );
}

function SampleChip({ value, theme }: { value: number; theme: Theme }) {
  return (
    <div
      className={`flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 text-base font-extrabold shadow-md [animation:chipIn_0.3s_cubic-bezier(.34,1.56,.64,1)_both] ${theme.ballGradient} ${theme.ballBorder} ${theme.ballText}`}
    >
      {value}
    </div>
  );
}

// ─── StatsCard ─────────────────────────────────────────
type StatTone = "mean" | "var" | "sd";
const STAT_BORDER: Record<StatTone, string> = {
  mean: "border-rose-400/55 bg-rose-500/10",
  var: "border-violet-400/55 bg-violet-500/10",
  sd: "border-cyan-400/55 bg-cyan-500/10",
};
const STAT_HEAD: Record<StatTone, string> = {
  mean: "text-rose-300",
  var: "text-violet-300",
  sd: "text-cyan-300",
};

function StatsCard({
  tone,
  head,
  value,
  theoryLabel,
  theory,
  ratio,
}: {
  tone: StatTone;
  head: string;
  value: string;
  theoryLabel: string;
  theory: string;
  ratio: number;
}) {
  return (
    <div className={`rounded-xl border-[1.5px] p-3 ${STAT_BORDER[tone]}`}>
      <div className={`text-sm font-extrabold ${STAT_HEAD[tone]}`}>{head}</div>
      <div className="mt-1 text-2xl font-extrabold leading-tight text-amber-100">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-400">
        이론값 <b className="text-yellow-300">{theoryLabel} = {theory}</b>
      </div>
      <RatioBar pct={ratio * 100} tone={tone} />
    </div>
  );
}

function RatioBar({ pct, tone }: { pct: number; tone: StatTone }) {
  const id = useId().replace(/[:]/g, "");
  const w = Math.max(0, Math.min(100, pct));
  const colors: Record<StatTone, { from: string; to: string }> = {
    mean: { from: "#f43f5e", to: "#fb7185" },
    var: { from: "#a855f7", to: "#c4b5fd" },
    sd: { from: "#0ea5e9", to: "#7dd3fc" },
  };
  const c = colors[tone];
  const gradId = `rb-${id}`;
  return (
    <div className="mt-1.5 h-2 overflow-hidden rounded-md border border-white/5 bg-slate-950/80">
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="block h-full w-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c.from} />
            <stop offset="100%" stopColor={c.to} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={w} height="10" rx="1" fill={`url(#${gradId})`} />
      </svg>
    </div>
  );
}

// ─── SummaryTable (n=1..5 이론값) ───────────────────────────
function SummaryTable({
  currentN,
  M,
  SIGMA2,
  SIGMA,
}: {
  currentN: number;
  M: number;
  SIGMA2: number;
  SIGMA: number;
}) {
  return (
    <div className="mt-3.5 overflow-x-auto rounded-xl border border-violet-400/30 bg-slate-900/50 p-3">
      <h5 className="mb-2 text-sm font-extrabold text-violet-200">
        📋 n별 요약 — 모든 경우(Nⁿ)를 열거하면 정확한 이론값과 일치합니다
      </h5>
      <table className="w-full min-w-[440px] border-collapse text-center text-sm text-slate-200">
        <thead>
          <tr>
            <th className="border border-violet-400/20 bg-violet-500/15 px-2 py-1.5 font-extrabold text-violet-200">
              n
            </th>
            {[1, 2, 3, 4, 5].map((k) => (
              <th
                key={k}
                className="border border-violet-400/20 bg-violet-500/15 px-2 py-1.5 font-extrabold text-violet-200"
              >
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SummaryRow
            label={
              <>
                E(X̄)
              </>
            }
            values={[1, 2, 3, 4, 5].map(() => fmtNum(M))}
            currentN={currentN}
          />
          <SummaryRow
            label={
              <>
                V(X̄)
              </>
            }
            values={[1, 2, 3, 4, 5].map((k) => fmtNum(SIGMA2 / k))}
            currentN={currentN}
          />
          <SummaryRow
            label={
              <>
                σ(X̄)
              </>
            }
            values={[1, 2, 3, 4, 5].map((k) => fmtNum(SIGMA / Math.sqrt(k)))}
            currentN={currentN}
          />
        </tbody>
      </table>
    </div>
  );
}

function SummaryRow({
  label,
  values,
  currentN,
}: {
  label: React.ReactNode;
  values: string[];
  currentN: number;
}) {
  return (
    <tr>
      <th className="border border-violet-400/20 bg-rose-500/15 px-2 py-1.5 text-right font-extrabold text-rose-200">
        {label}
      </th>
      {values.map((v, i) => {
        const n = i + 1;
        const live = n === currentN;
        return (
          <td
            key={n}
            className={`border border-violet-400/20 px-2 py-1.5 ${
              live
                ? "bg-cyan-500/15 font-extrabold text-amber-200"
                : ""
            }`}
          >
            {v}
          </td>
        );
      })}
    </tr>
  );
}

// ─── AllSamplesTable (Nⁿ 가능한 모든 표본) ───────────────────
function AllSamplesTable({
  population,
  n,
}: {
  population: number[];
  n: number;
}) {
  const rows = useMemo(() => {
    const total = population.length ** n;
    const showCount = Math.min(total, ALL_MAX_ROWS);
    type Row = { idx: number; cells: number[]; sum: number; xbar: number };
    const out: Row[] = [];
    for (let i = 0; i < showCount; i++) {
      let k = i;
      let sum = 0;
      const cells: number[] = [];
      for (let j = 0; j < n; j++) {
        const v = population[k % population.length];
        cells.push(v);
        sum += v;
        k = Math.floor(k / population.length);
      }
      out.push({ idx: i + 1, cells, sum, xbar: sum / n });
    }
    return { rows: out, total };
  }, [population, n]);

  return (
    <div className="max-h-[360px] overflow-auto rounded-xl border border-violet-400/25 bg-slate-900/50">
      <table className="w-full border-collapse text-center text-sm text-slate-200">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="border-b-2 border-violet-400/50 bg-violet-500/25 px-2 py-2 font-extrabold text-violet-100">
              #
            </th>
            {Array.from({ length: n }, (_, i) => (
              <th
                key={i}
                className="border-b-2 border-violet-400/50 bg-violet-500/25 px-2 py-2 font-extrabold text-violet-100"
              >
                X<sub className="text-xs text-violet-200">{i + 1}</sub>
              </th>
            ))}
            <th className="border-b-2 border-violet-400/50 bg-violet-500/25 px-2 py-2 font-extrabold text-violet-100">
              합
            </th>
            <th className="border-b-2 border-violet-400/50 bg-violet-500/25 px-2 py-2 font-extrabold text-violet-100">
              X̄
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.rows.map((r) => (
            <tr key={r.idx} className="odd:bg-slate-800/40 hover:bg-cyan-500/15">
              <td className="border-b border-violet-400/10 px-2 py-1 font-bold text-slate-400">
                {r.idx}
              </td>
              {r.cells.map((v, i) => (
                <td
                  key={i}
                  className="border-b border-violet-400/10 px-2 py-1"
                >
                  {v}
                </td>
              ))}
              <td className="border-b border-violet-400/10 px-2 py-1 font-bold text-amber-300">
                {r.sum}
              </td>
              <td className="border-b border-violet-400/10 px-2 py-1 font-extrabold text-amber-200">
                {fmtNum(r.xbar)}
              </td>
            </tr>
          ))}
          {rows.total > ALL_MAX_ROWS && (
            <tr>
              <td
                colSpan={n + 3}
                className="bg-pink-500/10 p-2 italic text-pink-200"
              >
                … 이하 {(rows.total - ALL_MAX_ROWS).toLocaleString()}가지는 생략 (총{" "}
                {rows.total.toLocaleString()}가지)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── 히스토그램 Canvas ─────────────────────────────────────
function DistCanvas({
  xbars,
  population,
  n,
  m,
  theme,
}: {
  xbars: number[];
  population: number[];
  n: number;
  m: number;
  theme: Theme;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 640;
  const H = 230;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const lo = Math.min(...population);
    const hi = Math.max(...population);
    const padL = 36;
    const padR = 16;
    const padT = 16;
    const padB = 30;

    ctx.strokeStyle = "rgba(148,163,184,.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, H - padB);
    ctx.lineTo(W - padR, H - padB);
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, H - padB);
    ctx.stroke();

    if (xbars.length === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("표본을 뽑으면 분포가 그려져요", W / 2, H / 2);
      return;
    }

    const span = hi - lo;
    const nBins = Math.max(8, Math.min(40, n * 6 + 4));
    const binW = span / nBins;
    const bins = new Array<number>(nBins + 1).fill(0);
    for (const x of xbars) {
      let k = Math.floor((x - lo) / binW + 1e-9);
      if (k < 0) k = 0;
      if (k > nBins) k = nBins;
      bins[k]++;
    }
    bins[nBins - 1] += bins[nBins];
    bins[nBins] = 0;
    const maxC = Math.max(...bins, 1);

    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    for (let i = 0; i < nBins; i++) {
      const c = bins[i];
      if (c === 0) continue;
      const x0 = padL + (i / nBins) * plotW;
      const x1 = padL + ((i + 1) / nBins) * plotW;
      const bh = (c / maxC) * plotH;
      const grad = ctx.createLinearGradient(0, H - padB - bh, 0, H - padB);
      grad.addColorStop(0, theme.histStart);
      grad.addColorStop(1, theme.histEnd);
      ctx.fillStyle = grad;
      ctx.fillRect(x0 + 1, H - padB - bh, x1 - x0 - 2, bh);
    }

    // 모평균 m 점선
    const xm = padL + ((m - lo) / span) * plotW;
    ctx.strokeStyle = "#fb7185";
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xm, padT);
    ctx.lineTo(xm, H - padB);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fb7185";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("m=" + (Number.isInteger(m) ? m : m.toFixed(2)), xm, padT - 2);

    // 표본평균의 실험값
    const expMean = xbars.reduce((a, b) => a + b, 0) / xbars.length;
    const xe = padL + ((expMean - lo) / span) * plotW;
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xe, padT + 12);
    ctx.lineTo(xe, H - padB);
    ctx.stroke();
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("표본평균≈" + expMean.toFixed(2), xe, H - padB + 18);

    // 가로축 눈금
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    for (const v of [lo, (lo + hi) / 2, hi]) {
      const x = padL + ((v - lo) / span) * plotW;
      ctx.fillText(Number.isInteger(v) ? String(v) : v.toFixed(1), x, H - padB + 18);
    }
  }, [xbars, population, n, m, theme.histStart, theme.histEnd]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[230px] w-full rounded-lg bg-slate-950/60"
      aria-label="표본평균 분포 히스토그램"
    />
  );
}
