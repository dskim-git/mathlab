"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "e_phat_observation",
    prompt:
      "4가지 시나리오(동전 0.5 / 자유투 0.7 / 단팥빵 0.4 / 광고 0.15)에서 표본을 충분히 많이 뽑았을 때, p̂의 평균(E(p̂))과 분산(V(p̂))은 각각 모비율 p와 어떤 관계였나요? 이론값 p, pq/n 과 어떻게 일치했는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 표본 수가 많아질수록 E(p̂)은 모비율 p에 가까워졌고, V(p̂)은 pq/n에 수렴했다. 4가지 시나리오 모두 같은 패턴.",
  },
  {
    id: "p_and_n",
    prompt:
      "같은 n에서 시나리오를 바꿔보면(p=0.5 vs p=0.15) 분포의 폭(σ(p̂))은 어떻게 달랐나요? p가 어떤 값일 때 폭이 가장 넓고 좁았는지, 그리고 n을 키우면 폭이 어떻게 변했는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: p=0.5일 때 σ(p̂)가 가장 넓고, p=0.15일 때 좁았다. 이는 pq가 p=0.5에서 최대(0.25)가 되기 때문. n을 키우면 √(pq/n)이 1/√n에 비례해 줄었다.",
  },
  {
    id: "real_life_meaning",
    prompt:
      "‘광고 클릭률이 15%’라는 광고주의 말을 표본조사로 확인하려고 할 때, n을 어느 정도로 잡아야 결과를 신뢰할 수 있을까요? 표본 크기와 정확도의 관계를 활동에서 본 모양을 근거로 적어 보세요.",
    kind: "text",
    placeholder:
      "예: n=10이면 p̂이 0.1~0.25 사이에서 흔들려서 ‘진짜 15%’인지 알기 어렵다. n=200쯤이면 √(0.15·0.85/200)≈0.025라 p̂이 약 ±5%p 범위에 모여 신뢰할 만하다.",
  },
];

// ─── 시나리오 정의 ─────────────────────────────────────
type ScenKey = "coin" | "freethrow" | "bread" | "ad";
type Scenario = {
  title: string;
  scnText: React.ReactNode;
  p: number;
  pDisp: string;
  popEmoji: string;
  popName: string;
  succLabel: React.ReactNode;
  failLabel: React.ReactNode;
  // 모집단 막대·성공 셀 배경(정적 클래스)
  succBarClass: string; // bg-gradient-to-r from-... to-...
  succCellClass: string; // bg-gradient-to-br from-... to-...
  // 헤더 카드
  headerCardClass: string;
  headerBorder: string;
  headerTitle: string; // text color
  // 모비율 칩
  pChipBg: string;
  pChipText: string;
  // 히스토그램 막대 그라데이션 stop 색
  histTop: string;
  // 히스토그램 strokeStyle (위와 동일 컬러)
  histStroke: string;
  // 모집단 카드 border
  popBorder: string;
  // 탭 액티브/비액티브
  tabActive: string;
  tabInactive: string;
};

const SCENARIOS: Record<ScenKey, Scenario> = {
  coin: {
    title: "🪙 동전 던지기 — 앞면이 나올 비율",
    scnText: (
      <>
        <b className="text-yellow-200">균형 잡힌 동전</b>을 n번 던졌을 때 앞면(H)이 나온 비율
        p̂ 의 분포를 관찰해요.
      </>
    ),
    p: 0.5,
    pDisp: "0.5 (앞면)",
    popEmoji: "🪙",
    popName: "동전 1개",
    succLabel: "앞면 H",
    failLabel: "뒷면 T",
    succBarClass: "bg-gradient-to-r from-[#fbbf24] to-[#f59e0b]",
    succCellClass: "bg-gradient-to-br from-[#fbbf24] to-[#f59e0b]",
    headerCardClass: "from-amber-500/20 to-yellow-500/15",
    headerBorder: "border-amber-400/55",
    headerTitle: "text-amber-200",
    pChipBg: "bg-slate-950/55",
    pChipText: "text-amber-200",
    histTop: "#fbbf24",
    histStroke: "#fbbf24",
    popBorder: "border-amber-400/55",
    tabActive: "bg-amber-300 text-slate-900",
    tabInactive: "border border-amber-300/30 text-amber-200 hover:bg-amber-300/10",
  },
  freethrow: {
    title: "🏀 자유투 — 슛 성공 비율",
    scnText: (
      <>
        자유투 성공률이 <b className="text-yellow-200">70%</b>인 농구 선수가 n번 던졌을 때
        성공 비율 p̂ 의 분포를 관찰해요.
      </>
    ),
    p: 0.7,
    pDisp: "0.7 (슛 성공)",
    popEmoji: "🏀",
    popName: "자유투 1회",
    succLabel: "성공 🎯",
    failLabel: "실패 ✗",
    succBarClass: "bg-gradient-to-r from-[#fb923c] to-[#ea580c]",
    succCellClass: "bg-gradient-to-br from-[#fb923c] to-[#ea580c]",
    headerCardClass: "from-orange-500/20 to-orange-700/15",
    headerBorder: "border-orange-400/55",
    headerTitle: "text-orange-200",
    pChipBg: "bg-slate-950/55",
    pChipText: "text-orange-200",
    histTop: "#fb923c",
    histStroke: "#fb923c",
    popBorder: "border-orange-400/55",
    tabActive: "bg-orange-300 text-slate-900",
    tabInactive: "border border-orange-300/30 text-orange-200 hover:bg-orange-300/10",
  },
  bread: {
    title: "🍞 학교 매점 — 단팥빵을 고른 학생 비율",
    scnText: (
      <>
        학생 중 <b className="text-yellow-200">40%</b>가 매점에서 단팥빵을 고를 때, 표본 n명에서
        단팥빵 선택 비율 p̂의 분포를 관찰해요.
      </>
    ),
    p: 0.4,
    pDisp: "0.4 (단팥빵 선택)",
    popEmoji: "🍞",
    popName: "매점 방문 학생 1명",
    succLabel: "단팥빵 🥖",
    failLabel: "다른 빵",
    succBarClass: "bg-gradient-to-r from-[#f472b6] to-[#db2777]",
    succCellClass: "bg-gradient-to-br from-[#f472b6] to-[#db2777]",
    headerCardClass: "from-pink-500/20 to-pink-700/15",
    headerBorder: "border-pink-400/55",
    headerTitle: "text-pink-200",
    pChipBg: "bg-slate-950/55",
    pChipText: "text-pink-200",
    histTop: "#f472b6",
    histStroke: "#f472b6",
    popBorder: "border-pink-400/55",
    tabActive: "bg-pink-300 text-slate-900",
    tabInactive: "border border-pink-300/30 text-pink-200 hover:bg-pink-300/10",
  },
  ad: {
    title: "📱 SNS 광고 — 클릭한 사용자 비율",
    scnText: (
      <>
        SNS 광고 클릭률이 <b className="text-yellow-200">15%</b>일 때, 표본 n명에서 광고를
        클릭한 비율 p̂의 분포를 관찰해요.
      </>
    ),
    p: 0.15,
    pDisp: "0.15 (광고 클릭)",
    popEmoji: "📱",
    popName: "광고에 노출된 사용자 1명",
    succLabel: "클릭 👆",
    failLabel: "무시",
    succBarClass: "bg-gradient-to-r from-[#22d3ee] to-[#0891b2]",
    succCellClass: "bg-gradient-to-br from-[#22d3ee] to-[#0891b2]",
    headerCardClass: "from-cyan-500/20 to-cyan-700/15",
    headerBorder: "border-cyan-400/55",
    headerTitle: "text-cyan-200",
    pChipBg: "bg-slate-950/55",
    pChipText: "text-cyan-200",
    histTop: "#22d3ee",
    histStroke: "#22d3ee",
    popBorder: "border-cyan-400/55",
    tabActive: "bg-cyan-300 text-slate-900",
    tabInactive: "border border-cyan-300/30 text-cyan-200 hover:bg-cyan-300/10",
  },
};

// ─── 헬퍼 ──────────────────────────────────────────────
function pdfNormal(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return 0;
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}
function fmt(v: number, d = 4): string {
  if (!isFinite(v)) return "--";
  return Number(v.toFixed(d)).toString();
}

// ─── 메인 ─────────────────────────────────────────────────
export default function SampleProportionDistLab() {
  const [tab, setTab] = useState<ScenKey>("coin");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">
          🎯 표본비율 p̂의 분포 — 실생활 시뮬레이션
        </h3>
        <p className="mt-2 leading-7 text-slate-300">
          동전·자유투·매점 단팥빵·SNS 광고 4가지 실생활 사례에서 표본 n명을 반복 추출해{" "}
          <b className="text-amber-300">p̂ = X/n</b> 의 분포가{" "}
          <b className="text-amber-300">N(p, pq/n)</b> 정규분포에 가까워지는 모습을 직접
          확인해 봐요!
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(Object.keys(SCENARIOS) as ScenKey[]).map((key) => {
          const scen = SCENARIOS[key];
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                active ? scen.tabActive : scen.tabInactive
              }`}
            >
              {scen.popEmoji}{" "}
              {key === "coin"
                ? "동전"
                : key === "freethrow"
                ? "자유투"
                : key === "bread"
                ? "단팥빵"
                : "광고 클릭"}{" "}
              (p={scen.p})
            </button>
          );
        })}
      </div>

      {(Object.keys(SCENARIOS) as ScenKey[]).map((key) => (
        <div key={key} className={tab === key ? "mt-4" : "mt-4 hidden"}>
          <ProportionLab scen={SCENARIOS[key]} />
        </div>
      ))}

      <div className="mt-8 border-t border-white/10 pt-6">
        <ReflectionForm questions={REFLECTION_QUESTIONS} />
      </div>
    </section>
  );
}

// ─── ProportionLab — 한 시나리오의 시뮬 ───────────────
function ProportionLab({ scen }: { scen: Scenario }) {
  const [n, setN] = useState(50);
  const [phats, setPhats] = useState<number[]>([]);
  const [lastSample, setLastSample] = useState<{
    cells: number[];
    x: number;
    phat: number;
  } | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const autoRef = useRef(false);

  const empirical = useMemo(() => {
    if (phats.length === 0) return { m: NaN, v: NaN, s: NaN };
    const m = phats.reduce((a, b) => a + b, 0) / phats.length;
    const v = phats.reduce((s, x) => s + (x - m) ** 2, 0) / phats.length;
    return { m, v, s: Math.sqrt(v) };
  }, [phats]);

  const tE = scen.p;
  const tV = (scen.p * (1 - scen.p)) / n;
  const tS = Math.sqrt(tV);

  function ratio(exp: number, the: number): number {
    if (phats.length === 0 || the === 0 || !isFinite(exp)) return 0;
    const r = Math.min(exp, the) / Math.max(exp, the);
    return Math.max(0, Math.min(1, r));
  }

  function sampleOnce(nn: number) {
    let x = 0;
    const cells = new Array<number>(nn);
    for (let i = 0; i < nn; i++) {
      const b = Math.random() < scen.p ? 1 : 0;
      x += b;
      cells[i] = b;
    }
    return { cells, x, phat: x / nn };
  }

  function handleDraw1() {
    const s = sampleOnce(n);
    setLastSample(s);
    setPhats((prev) => [...prev, s.phat]);
  }

  function handleMany(times: number) {
    if (autoRef.current) return;
    autoRef.current = true;
    setAutoRunning(true);
    let i = 0;
    let last: ReturnType<typeof sampleOnce> | null = null;
    const step = () => {
      if (!autoRef.current) {
        autoRef.current = false;
        setAutoRunning(false);
        return;
      }
      const burst = 40;
      const end = Math.min(i + burst, times);
      const buf: number[] = [];
      for (; i < end; i++) {
        const s = sampleOnce(n);
        buf.push(s.phat);
        if (i === times - 1) last = s;
      }
      setPhats((prev) => [...prev, ...buf]);
      if (i < times) {
        requestAnimationFrame(step);
      } else {
        autoRef.current = false;
        setAutoRunning(false);
        if (last) setLastSample(last);
      }
    };
    requestAnimationFrame(step);
  }

  function handleReset() {
    autoRef.current = false;
    setAutoRunning(false);
    setPhats([]);
    setLastSample(null);
  }

  function handleNChange(newN: number) {
    setN(newN);
    handleReset();
  }

  return (
    <div className="space-y-3">
      {/* 헤더 — 시나리오 */}
      <div
        className={`rounded-2xl border-2 bg-gradient-to-br p-4 text-center ${scen.headerBorder} ${scen.headerCardClass}`}
      >
        <div className={`text-xl font-extrabold tracking-wide ${scen.headerTitle}`}>
          {scen.title}
        </div>
        <div className="mt-1 text-sm leading-6 text-slate-200">{scen.scnText}</div>
        <span
          className={`mt-2 inline-block rounded-full px-3 py-1 text-base font-extrabold ${scen.pChipBg} ${scen.pChipText}`}
        >
          모비율 p = {scen.pDisp}
        </span>
      </div>

      {/* 모집단 카드 */}
      <div
        className={`rounded-2xl border-2 bg-slate-900/45 p-4 ${scen.popBorder}`}
      >
        <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
          <div
            className={`flex flex-col items-center justify-center rounded-xl border border-dashed bg-slate-950/55 p-3 ${scen.popBorder}`}
          >
            <div className="text-5xl leading-none">{scen.popEmoji}</div>
            <div className="mt-2 text-sm font-extrabold text-slate-200">{scen.popName}</div>
            <PopBar scen={scen} />
            <div className="mt-2 flex gap-4 text-xs font-bold">
              <span className={scen.headerTitle}>
                <span
                  className={`mr-1 inline-block h-3 w-3 rounded-sm align-middle ${scen.succCellClass}`}
                />
                {scen.succLabel}
              </span>
              <span className="text-slate-300">
                <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-slate-500 align-middle" />
                {scen.failLabel}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2 rounded-xl border-[1.5px] border-violet-400/30 bg-slate-950/55 p-3">
            <h5 className="text-sm font-extrabold tracking-wide text-violet-200">
              📊 모집단 정보
            </h5>
            <PopStatRow label="모비율 p" value={scen.p.toFixed(2)} />
            <PopStatRow label="실패확률 q = 1 − p" value={(1 - scen.p).toFixed(2)} />
            <PopStatRow label="pq" value={(scen.p * (1 - scen.p)).toFixed(4)} />
          </div>
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="rounded-2xl border border-cyan-300/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex flex-wrap items-center gap-2 text-base font-bold text-cyan-200">
          🎯 표본을 뽑아 p̂ = X/n 을 계산해 봐요{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            각 표본 = n번 독립시행
          </span>
        </h4>

        <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-cyan-400/30 bg-cyan-500/10 px-3 py-2">
          <label
            htmlFor={`prop-n-${scen.popEmoji}`}
            className="flex min-w-[140px] items-center gap-2 text-sm font-extrabold text-cyan-200"
          >
            🧮 표본 크기 n
          </label>
          <input
            id={`prop-n-${scen.popEmoji}`}
            type="range"
            min={10}
            max={500}
            step={5}
            value={n}
            onChange={(e) => handleNChange(parseInt(e.target.value, 10))}
            disabled={autoRunning}
            className="h-1.5 flex-1 accent-cyan-400"
          />
          <span className="min-w-[78px] rounded-md bg-slate-950/70 px-3 py-1 text-center text-lg font-extrabold text-amber-300">
            {n}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDraw1}
            disabled={autoRunning}
            className="flex-1 min-w-[135px] rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-blue-400 hover:to-blue-600 active:scale-95 disabled:opacity-40"
          >
            🎲 표본 1개 뽑기
          </button>
          <button
            type="button"
            onClick={() => handleMany(50)}
            disabled={autoRunning}
            className="flex-1 min-w-[135px] rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-violet-400 hover:to-violet-600 active:scale-95 disabled:opacity-40"
          >
            ⚡ 50번 뽑기
          </button>
          <button
            type="button"
            onClick={() => handleMany(500)}
            disabled={autoRunning}
            className="flex-1 min-w-[135px] rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-emerald-400 hover:to-emerald-600 active:scale-95 disabled:opacity-40"
          >
            🚀 500번 뽑기
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
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-sm font-extrabold text-emerald-300">
            <span>📦 가장 최근 표본 (X = 성공 횟수)</span>
            <span className="text-amber-100">
              p̂ ={" "}
              {lastSample
                ? `${lastSample.x}/${lastSample.cells.length} = ${lastSample.phat.toFixed(3)}`
                : "--"}
            </span>
          </div>
          {lastSample ? (
            <SampleCells cells={lastSample.cells} scen={scen} />
          ) : (
            <div className="py-1 text-sm italic text-slate-500">
              아직 뽑지 않았어요. ‘표본 1개 뽑기’를 눌러보세요!
            </div>
          )}
        </div>
      </div>

      {/* 분포 */}
      <div className="rounded-2xl border border-violet-400/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex flex-wrap items-center gap-2 text-base font-bold text-violet-200">
          📈 표본비율 p̂의 분포{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            노란 곡선 = 이론 정규분포 N(p, pq/n)
          </span>
        </h4>
        <div className="rounded-xl border-[1.5px] border-violet-400/30 bg-slate-950/55 p-3">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-300">
            <span>가로축: p̂ 값 · 세로축: 상대도수</span>
            <span>
              누적 표본 <span className="font-extrabold text-amber-300">{phats.length}</span>개
            </span>
          </div>
          <DistCanvas phats={phats} p={scen.p} n={n} scen={scen} />
          <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-400">
            <Legend swatchClass={scen.succCellClass}>시뮬레이션 히스토그램</Legend>
            <Legend lineClass="bg-amber-300">이론 곡선 N(p, pq/n)</Legend>
            <Legend dashClass="border-rose-400">모비율 p</Legend>
          </div>
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          <StatsCard
            tone="mean"
            head="E(p̂) — 평균"
            value={fmt(empirical.m)}
            theoryLabel="p"
            theory={fmt(tE)}
            ratio={ratio(empirical.m, tE)}
          />
          <StatsCard
            tone="var"
            head="V(p̂) — 분산"
            value={fmt(empirical.v, 5)}
            theoryLabel="pq/n"
            theory={fmt(tV, 5)}
            ratio={ratio(empirical.v, tV)}
          />
          <StatsCard
            tone="sd"
            head="σ(p̂) — 표준편차"
            value={fmt(empirical.s)}
            theoryLabel="√(pq/n)"
            theory={fmt(tS)}
            ratio={ratio(empirical.s, tS)}
          />
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-amber-300/45 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
          <span className="text-xl">💡</span>
          <span>
            n이 <b className="text-yellow-200">충분히 크면</b> p̂의 분포는{" "}
            <span className="font-extrabold text-emerald-300">정규분포 N(p, pq/n)</span> 에
            가까워져요.
            <br />
            표본을 더 많이 뽑을수록 <b className="text-yellow-200">E(p̂) ≈ p</b> 그리고{" "}
            <b className="text-yellow-200">σ(p̂) ≈ √(pq/n)</b> 에 수렴합니다.
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── 모집단 비율 바 ─────────────────────────────────────
function PopBar({ scen }: { scen: Scenario }) {
  const succW = scen.p * 100;
  const failW = (1 - scen.p) * 100;
  return (
    <div className="mt-2 flex h-9 w-full max-w-[340px] overflow-hidden rounded-full border border-slate-400/30 bg-slate-950/55">
      <BarSeg widthPct={succW} className={`${scen.succBarClass} text-white`}>
        {succW >= 10 ? `${Math.round(succW)}%` : ""}
      </BarSeg>
      <BarSeg
        widthPct={failW}
        className="bg-gradient-to-r from-[#475569] to-[#334155] text-slate-200"
      >
        {failW >= 10 ? `${Math.round(failW)}%` : ""}
      </BarSeg>
    </div>
  );
}

function BarSeg({
  widthPct,
  className,
  children,
}: {
  widthPct: number;
  className: string;
  children: React.ReactNode;
}) {
  // 동적 % 너비는 Tailwind 정적 클래스로 불가 → SVG 한 줄 비율로 대신 그릴 수도 있지만
  // 여기서는 flex-basis 만 inline 으로 — 다른 활동에서도 dynamic flex/grid 비율은 인라인 예외.
  // 깔끔하게: SVG bar 두 개로 SegBar 만들 수도 있으나, 텍스트 라벨이 안에 들어가야 해서 flex 유지.
  return (
    <div
      className={`flex items-center justify-center text-sm font-extrabold tracking-wide transition-[flex-basis] duration-300 ${className}`}
      style={{ flexBasis: `${widthPct}%` }}
    >
      {children}
    </div>
  );
}

function PopStatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-400/15 bg-slate-950/55 px-2.5 py-1.5">
      <span className="text-sm font-bold text-slate-200">{label}</span>
      <span className="text-base font-extrabold text-amber-300 tabular-nums">{value}</span>
    </div>
  );
}

// ─── 최근 표본 셀 ─────────────────────────────────────
function SampleCells({ cells, scen }: { cells: number[]; scen: Scenario }) {
  const MAX_SHOW = 200;
  const showN = Math.min(cells.length, MAX_SHOW);
  return (
    <div className="flex min-h-[36px] flex-wrap items-center gap-1.5">
      {cells.slice(0, showN).map((c, i) => (
        <span
          key={i}
          className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-extrabold leading-none text-white shadow-sm [animation:cellPop_0.35s_cubic-bezier(.34,1.56,.64,1)_both] ${
            c === 1 ? scen.succCellClass : "bg-gradient-to-br from-[#64748b] to-[#475569]"
          }`}
        >
          {c === 1 ? "✓" : "·"}
        </span>
      ))}
      {cells.length > MAX_SHOW && (
        <span className="self-center px-2 text-sm font-bold text-slate-300">
          … 외 {cells.length - MAX_SHOW}개
        </span>
      )}
    </div>
  );
}

// ─── 범례 ─────────────────────────────────────────────
function Legend({
  swatchClass,
  lineClass,
  dashClass,
  children,
}: {
  swatchClass?: string;
  lineClass?: string;
  dashClass?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {swatchClass && <span className={`inline-block h-3 w-3.5 rounded-sm ${swatchClass}`} />}
      {lineClass && <span className={`inline-block h-1 w-5 rounded ${lineClass}`} />}
      {dashClass && (
        <span className={`inline-block h-3.5 border-l-2 border-dashed ${dashClass}`} />
      )}
      {children}
    </span>
  );
}

// ─── 통계 카드 ──────────────────────────────────────────
type StatTone = "mean" | "var" | "sd";
const STAT_CLS: Record<StatTone, string> = {
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
    <div className={`rounded-xl border-[1.5px] p-3 ${STAT_CLS[tone]}`}>
      <div className={`text-sm font-extrabold ${STAT_HEAD[tone]}`}>{head}</div>
      <div className="mt-1 text-2xl font-extrabold leading-tight tabular-nums text-amber-100">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-400">
        이론값{" "}
        <b className="text-yellow-300">
          {theoryLabel} = {theory}
        </b>
      </div>
      <RatioBar pct={ratio * 100} tone={tone} />
    </div>
  );
}

function RatioBar({ pct, tone }: { pct: number; tone: StatTone }) {
  const w = Math.max(0, Math.min(100, pct));
  const colorMap: Record<StatTone, { from: string; to: string }> = {
    mean: { from: "#f43f5e", to: "#fb7185" },
    var: { from: "#a855f7", to: "#c4b5fd" },
    sd: { from: "#0ea5e9", to: "#7dd3fc" },
  };
  const c = colorMap[tone];
  return (
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-md border border-white/5 bg-slate-950/80">
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="block h-full w-full">
        <defs>
          <linearGradient id={`rb-${tone}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c.from} />
            <stop offset="100%" stopColor={c.to} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={w} height="10" rx="1" fill={`url(#rb-${tone})`} />
      </svg>
    </div>
  );
}

// ─── 히스토그램 Canvas ─────────────────────────────────
function DistCanvas({
  phats,
  p,
  n,
  scen,
}: {
  phats: number[];
  p: number;
  n: number;
  scen: Scenario;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 900;
  const H = 280;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 46;
    const padR = 18;
    const padT = 18;
    const padB = 42;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const xLo = 0;
    const xHi = 1;
    const X = (v: number) => padL + ((v - xLo) / (xHi - xLo)) * plotW;

    // 격자
    ctx.strokeStyle = "rgba(148,163,184,.13)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let i = 1; i <= 4; i++) {
      const y = padT + (i / 5) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(148,163,184,.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, H - padB);
    ctx.lineTo(W - padR, H - padB);
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, H - padB);
    ctx.stroke();

    // x 눈금
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      const x = X(v);
      ctx.strokeStyle = "rgba(148,163,184,.55)";
      ctx.beginPath();
      ctx.moveTo(x, H - padB);
      ctx.lineTo(x, H - padB + 4);
      ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(v.toFixed(2), x, H - padB + 6);
    }

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("p̂  (표본비율)", (padL + W - padR) / 2, H - 18);

    const sigmaT = Math.sqrt((p * (1 - p)) / n);
    let nBins = 40;
    if (n <= 20) nBins = 21;
    else if (n <= 50) nBins = 30;
    const binW = (xHi - xLo) / nBins;
    const bins = new Array<number>(nBins).fill(0);
    for (const v of phats) {
      let k = Math.floor((v - xLo) / binW);
      if (k < 0) k = 0;
      if (k >= nBins) k = nBins - 1;
      bins[k]++;
    }

    const total = phats.length;
    let curveMax = 0;
    if (sigmaT > 0) {
      for (let i = 0; i <= 200; i++) {
        const x = xLo + (i / 200) * (xHi - xLo);
        curveMax = Math.max(curveMax, pdfNormal(x, p, sigmaT));
      }
    }
    let histMax = 0;
    if (total > 0) {
      for (const c of bins) {
        const d = c / total / binW;
        if (d > histMax) histMax = d;
      }
    }
    const yMax = Math.max(curveMax * 1.1, histMax * 1.1, 0.5);
    const Y = (v: number) => padT + plotH - (v / yMax) * plotH;

    // y 눈금
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 5; i++) {
      const v = yMax * (i / 5);
      const y = Y(v);
      ctx.fillText(v.toFixed(1), padL - 5, y);
    }

    if (total > 0) {
      for (let i = 0; i < nBins; i++) {
        const c = bins[i];
        if (c === 0) continue;
        const density = c / total / binW;
        const x0 = X(xLo + i * binW);
        const x1 = X(xLo + (i + 1) * binW);
        const y0 = Y(density);
        const y1 = Y(0);
        const grad = ctx.createLinearGradient(0, y0, 0, y1);
        grad.addColorStop(0, scen.histTop);
        grad.addColorStop(1, "rgba(99,102,241,.4)");
        ctx.fillStyle = grad;
        ctx.fillRect(x0 + 0.6, y0, x1 - x0 - 1.2, y1 - y0);
        ctx.strokeStyle = scen.histStroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(x0 + 0.6, y0, x1 - x0 - 1.2, y1 - y0);
      }
    }

    if (sigmaT > 0) {
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const STEPS = 240;
      for (let i = 0; i <= STEPS; i++) {
        const x = xLo + (i / STEPS) * (xHi - xLo);
        const y = pdfNormal(x, p, sigmaT);
        const cx = X(x);
        const cy = Y(y);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(X(p), Y(pdfNormal(p, p, sigmaT)), 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 모비율 p 점선
    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = 2.3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(X(p), padT);
    ctx.lineTo(X(p), H - padB);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fb7185";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("p = " + p.toFixed(2), X(p), padT - 1);

    if (total > 0) {
      const m = phats.reduce((a, b) => a + b, 0) / phats.length;
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X(m), padT + 14);
      ctx.lineTo(X(m), H - padB);
      ctx.stroke();
      ctx.fillStyle = "#22d3ee";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("p̂평균≈" + m.toFixed(3), X(m), padT + 14);
    }
  }, [phats, p, n, scen.histTop, scen.histStroke]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[280px] w-full rounded-lg bg-slate-950/60"
      aria-label="표본비율 분포"
    />
  );
}
