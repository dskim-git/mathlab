"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

/* ──────────────────────────────────────────────────────────────
   🎲 P(소수 | 홀수) — 조건부확률 미니실험
   주사위(1~6) n번 시행 → 홀수(1,3,5) 중 소수(3,5) 비율 추정 → 이론값 2/3.

   두 모드:
   (1) 단계별: 1번씩 굴림(주사위 SVG 회전 애니), 자동실행+속도조절
   (2) 일괄  : N(10~200000) 한 번에 시행(원본 동작)
   ────────────────────────────────────────────────────────────── */

const THEORY = 2 / 3;

// 시드 PRNG (mulberry32) — 시드 고정 시 결정적, 평소엔 Math.random.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) % 4294967296) / 4294967296;
  };
}

function rollDie(rng: () => number): number {
  return Math.floor(rng() * 6) + 1;
}

// ============================================================
// 주사위 SVG (1~6 pip)
// ============================================================

const PIP_POS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.25, 0.75], [0.75, 0.25], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.25, 0.75], [0.5, 0.5], [0.75, 0.25], [0.75, 0.75]],
  6: [[0.25, 0.25], [0.25, 0.5], [0.25, 0.75], [0.75, 0.25], [0.75, 0.5], [0.75, 0.75]],
};

function DieSVG({ value, tone, spinKey }: { value: number; tone: "odd-prime" | "odd-nonprime" | "even" | "idle"; spinKey: number }) {
  const palette = {
    "odd-prime": { fill: "rgba(52,211,153,0.18)", stroke: "#34d399", pip: "#a7f3d0" },
    "odd-nonprime": { fill: "rgba(96,165,250,0.18)", stroke: "#60a5fa", pip: "#bfdbfe" },
    "even": { fill: "rgba(148,163,184,0.10)", stroke: "rgba(148,163,184,0.45)", pip: "#94a3b8" },
    "idle": { fill: "rgba(255,255,255,0.04)", stroke: "rgba(255,255,255,0.15)", pip: "rgba(255,255,255,0.4)" },
  }[tone];

  return (
    <svg
      key={spinKey}
      viewBox="0 0 100 100"
      className="block h-20 w-20 animate-[diceRoll_0.45s_ease-out]"
      aria-label={`주사위 ${value}`}
    >
      <rect x={4} y={4} width={92} height={92} rx={14} ry={14} fill={palette.fill} stroke={palette.stroke} strokeWidth={3} />
      {PIP_POS[value].map(([rx, ry], i) => (
        <circle key={i} cx={rx * 100} cy={ry * 100} r={8} fill={palette.pip} />
      ))}
    </svg>
  );
}

// 어떤 분류인지
function classify(v: number): "odd-prime" | "odd-nonprime" | "even" {
  if (v % 2 === 0) return "even";
  return v === 3 || v === 5 ? "odd-prime" : "odd-nonprime";
}

// ============================================================
// 메인
// ============================================================

type Mode = "step" | "batch";

type Stats = {
  total: number;
  odd: number;          // p
  oddPrime: number;     // q
};

const EMPTY_STATS: Stats = { total: 0, odd: 0, oddPrime: 0 };

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "sample_space",
    kind: "text",
    prompt:
      "조건부확률 P(소수 | 홀수) = |{3,5}| / |{1,3,5}| = 2/3 인 이유를 표본공간을 ‘홀수’로 좁히는 관점에서 설명해 보세요.",
    placeholder:
      "조건이 ‘홀수가 나왔다’로 주어지면 새로운 표본공간은 {1,3,5}가 되고, 그 안에서 소수는...",
  },
  {
    id: "lln",
    kind: "text",
    prompt:
      "n을 늘릴수록 추정값 q/p가 2/3에 가까워지는 이유는 무엇인가요? 시행 횟수와 추정 정확도의 관계를 적어 보세요.",
    placeholder: "대수의 법칙에 의해 시행 횟수가 많아지면 상대도수가 이론적 확률에...",
  },
  {
    id: "seed_variance",
    kind: "text",
    prompt:
      "시드를 고정하지 않으면 같은 n에서도 결과가 매번 다른 이유와, 같은 시드를 쓰면 결과가 동일해지는 이유를 자기 말로 설명해 보세요.",
    placeholder: "난수 생성기가 시드를 시작점으로 결정적으로 수열을 만들기 때문에...",
  },
];

export default function OddPrimeConditional() {
  const [mode, setMode] = useState<Mode>("step");
  const [seedOn, setSeedOn] = useState(false);
  const [seedVal, setSeedVal] = useState(42);

  // 단계별 모드 상태
  const [lastDie, setLastDie] = useState<number | null>(null);
  const [spinKey, setSpinKey] = useState(0);
  const [auto, setAuto] = useState(false);
  const [speed, setSpeed] = useState(3); // 1~5
  const STEP_MAX = 2000;

  // 일괄 모드 상태
  const [batchN, setBatchN] = useState(5000);

  // 공통 통계
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  // 수렴 곡선 — 단계별일 때만 의미. 표본 100개 정도로 다운샘플링.
  const [history, setHistory] = useState<number[]>([]); // 매 시행 후 q/p (홀수 1+ 일 때만)

  // PRNG ref — 시드 옵션이 바뀔 때마다 핸들러에서 새 값으로 재구성.
  const rngRef = useRef<() => number>(Math.random);

  // 누적값만 비우는 헬퍼 + 인자로 받은 시드 상태로 rng 재구성. 핸들러/초기화 버튼 공용.
  const applyReset = useCallback((newSeedOn: boolean, newSeedVal: number) => {
    setStats(EMPTY_STATS);
    setHistory([]);
    setLastDie(null);
    setAuto(false);
    rngRef.current = newSeedOn ? mulberry32(Math.trunc(newSeedVal)) : Math.random;
  }, []);

  // 모드/시드 옵션 변경 핸들러 — 항상 누적 초기화 동반.
  function changeMode(m: Mode) {
    setMode(m);
    applyReset(seedOn, seedVal);
  }
  function changeSeedOn(on: boolean) {
    setSeedOn(on);
    applyReset(on, seedVal);
  }
  function changeSeedVal(v: number) {
    setSeedVal(v);
    applyReset(seedOn, v);
  }

  // ── 시행 함수들 ──
  const oneRoll = useCallback(() => {
    const v = rollDie(rngRef.current);
    setLastDie(v);
    setSpinKey((k) => k + 1);
    setStats((prev) => {
      const next: Stats = {
        total: prev.total + 1,
        odd: prev.odd + (v % 2 === 1 ? 1 : 0),
        oddPrime: prev.oddPrime + (v === 3 || v === 5 ? 1 : 0),
      };
      // 수렴 곡선 — 홀수가 1개 이상일 때만 의미
      if (next.odd > 0) {
        setHistory((h) => {
          const est = next.oddPrime / next.odd;
          // 최대 200 포인트만 보관
          const dropped = h.length >= 200 ? h.slice(h.length - 199) : h;
          return [...dropped, est];
        });
      }
      return next;
    });
  }, []);

  function batchRoll() {
    let p = 0;
    let q = 0;
    const rng = rngRef.current;
    for (let i = 0; i < batchN; i++) {
      const v = Math.floor(rng() * 6) + 1;
      if (v % 2 === 1) {
        p++;
        if (v === 3 || v === 5) q++;
      }
    }
    setStats({ total: batchN, odd: p, oddPrime: q });
    setLastDie(null);
    setAuto(false);
    setHistory([]); // 일괄은 점진 수렴 표시 X
  }

  // 자동 실행 (단계별)
  useEffect(() => {
    if (mode !== "step" || !auto) return;
    if (stats.total >= STEP_MAX) return;
    const ms = Math.max(40, 420 - speed * 80); // 1: 340 / 5: 20
    const t = window.setTimeout(oneRoll, ms);
    return () => window.clearTimeout(t);
  }, [mode, auto, speed, stats.total, oneRoll]);

  const estimate = stats.odd > 0 ? stats.oddPrime / stats.odd : null;
  const error = estimate !== null ? estimate - THEORY : null;
  const lastTone = lastDie === null ? "idle" : classify(lastDie);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <style>{`@keyframes diceRoll {0%{transform:rotate(-120deg) scale(0.6);opacity:0.4}60%{transform:rotate(15deg) scale(1.08);opacity:1}100%{transform:rotate(0) scale(1);opacity:1}}`}</style>

      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 조건부확률</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 P(소수 | 홀수) — 조건부확률 실험</h3>
        <p className="mt-2 leading-7 text-slate-300">
          주사위를 던져 <b className="text-blue-300">홀수(1,3,5)</b>가 나온 시도 중{" "}
          <b className="text-emerald-300">소수(3,5)</b>가 차지하는 비율을 추정합니다.
          {" "}이론값은 <b className="font-mono text-amber-200">|{"{3,5}"}| / |{"{1,3,5}"}| = 2/3 ≈ 0.6667</b>.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-blue-400/40 bg-blue-400/10 px-2.5 py-1 text-xs font-semibold text-blue-200">조건 = 홀수가 나왔다</span>
          <span className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">관심 사건 = 소수(3,5)</span>
        </div>
      </div>

      {/* 모드 토글 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => changeMode("step")}
          className={
            mode === "step"
              ? "rounded-lg bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950"
              : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          }
        >
          🎯 단계별 시뮬 (애니)
        </button>
        <button
          type="button"
          onClick={() => changeMode("batch")}
          className={
            mode === "batch"
              ? "rounded-lg bg-amber-300 px-3 py-2 text-sm font-bold text-slate-950"
              : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          }
        >
          ⚡ 일괄 시뮬 (N번 한 번에)
        </button>
      </div>

      {/* 메인 패널 */}
      <div className="mt-4 grid gap-4 md:grid-cols-[260px_1fr]">
        {/* 주사위 + 컨트롤 */}
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
            <div className="flex h-24 items-center justify-center">
              {lastDie !== null ? (
                <DieSVG value={lastDie} tone={lastTone} spinKey={spinKey} />
              ) : (
                <div className="text-xs text-slate-500">시행하면 결과가 표시됩니다</div>
              )}
            </div>
            <div className="mt-2 text-center text-xs text-slate-400">
              {lastDie !== null ? (
                <>
                  마지막 결과 :
                  <span className="ml-1 font-mono font-bold text-slate-100">{lastDie}</span>
                  <span className="ml-2">{describe(lastDie)}</span>
                </>
              ) : null}
            </div>
          </div>

          {mode === "step" ? (
            <div className="space-y-2 rounded-xl border border-cyan-400/25 bg-white/[0.04] p-3">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={oneRoll}
                  disabled={stats.total >= STEP_MAX}
                  className="whitespace-nowrap rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-3 py-1.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40"
                >
                  🎲 1회 던지기
                </button>
                <button
                  type="button"
                  onClick={() => setAuto((a) => !a)}
                  disabled={stats.total >= STEP_MAX}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-bold transition disabled:opacity-40 ${
                    auto
                      ? "bg-red-500 text-white hover:brightness-110"
                      : "border border-amber-400/50 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
                  }`}
                >
                  {auto ? "⏸ 정지" : "▶ 자동"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="opc-speed" className="text-[11px] text-slate-400">속도</label>
                <input
                  id="opc-speed"
                  type="range" min={1} max={5} value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  aria-label="자동 실행 속도"
                  className="flex-1 accent-amber-400"
                />
                <span className="w-4 text-right font-mono text-xs text-amber-300">{speed}</span>
              </div>
              <p className="text-[11px] text-slate-500">최대 {STEP_MAX.toLocaleString()}회까지 단계별로 누적합니다.</p>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-amber-400/25 bg-white/[0.04] p-3">
              <label htmlFor="opc-n" className="text-xs text-slate-400">
                시행 횟수 n : <span className="ml-1 font-mono font-bold text-amber-300">{batchN.toLocaleString()}</span>
              </label>
              <input
                id="opc-n"
                type="range" min={10} max={200000} step={10} value={batchN}
                onChange={(e) => setBatchN(Number(e.target.value))}
                aria-label="일괄 시행 횟수 n"
                className="w-full accent-amber-400"
              />
              <button
                type="button"
                onClick={batchRoll}
                className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1.5 text-sm font-bold text-slate-950 transition hover:brightness-110"
              >
                ⚡ {batchN.toLocaleString()}번 일괄 시행
              </button>
              <p className="text-[11px] text-slate-500">큰 n에서도 즉시 계산. 시드 고정 시 동일 결과 재현 가능.</p>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="opc-seed-on" className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input
                  id="opc-seed-on"
                  type="checkbox"
                  checked={seedOn}
                  onChange={(e) => changeSeedOn(e.target.checked)}
                  className="h-3.5 w-3.5 accent-cyan-400"
                />
                시드 고정
              </label>
              <input
                type="number"
                value={seedVal}
                disabled={!seedOn}
                onChange={(e) => changeSeedVal(Number(e.target.value) || 0)}
                aria-label="시드 값"
                className="w-20 rounded-md border border-white/15 bg-slate-950 px-2 py-1 text-xs font-mono text-slate-100 outline-none focus:border-cyan-300 disabled:opacity-40"
              />
            </div>
            <button
              type="button"
              onClick={() => applyReset(seedOn, seedVal)}
              className="mt-2 w-full rounded-md border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
            >
              ↺ 누적 초기화
            </button>
          </div>
        </div>

        {/* 통계 + 수렴 곡선 */}
        <div className="space-y-3">
          {/* KPI 4개 */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <KpiCard label="총 시행 N" value={stats.total.toLocaleString()} tone="slate" />
            <KpiCard label="홀수 p (1·3·5)" value={stats.odd.toLocaleString()} tone="blue" />
            <KpiCard label="소수 q (3·5)" value={stats.oddPrime.toLocaleString()} tone="emerald" />
            <KpiCard
              label="추정 q/p"
              value={estimate === null ? "—" : estimate.toFixed(6)}
              tone={estimate === null ? "slate" : Math.abs((estimate ?? 0) - THEORY) < 0.005 ? "emerald" : "amber"}
              mono
            />
          </div>

          {/* 분포 막대 */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">출현 분포 (1~6)</div>
            <div className="mt-2 grid grid-cols-6 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((v) => {
                // 모드별로 count 표시 — 분포는 다이렉트로 추적 안하니 stats에서 유추 불가.
                // 대신 색만 분류로 표시(범례 역할). 카운트는 4개 KPI에 있음.
                const cls = classify(v);
                const fill =
                  cls === "odd-prime" ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                  : cls === "odd-nonprime" ? "border-blue-400/60 bg-blue-400/15 text-blue-200"
                  : "border-white/15 bg-white/[0.04] text-slate-400";
                return (
                  <div key={v} className={`rounded-md border px-2 py-1.5 text-center text-sm font-bold ${fill}`}>
                    {v}
                    <div className="text-[9px] font-normal text-slate-500">
                      {cls === "odd-prime" ? "홀·소" : cls === "odd-nonprime" ? "홀·비소" : "짝수"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 결과 분석 */}
          <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.06] p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">결과 분석</div>
            {estimate === null ? (
              <p className="mt-2 text-xs text-slate-400">아직 홀수가 한 번도 나오지 않았습니다. 더 시행해 보세요.</p>
            ) : (
              <div className="mt-2 space-y-1 text-sm leading-7 text-slate-200">
                <div>
                  <span className="text-slate-400">P̂(소수 | 홀수) =</span>{" "}
                  <span className="font-mono text-base font-bold text-emerald-300">{stats.oddPrime}</span>
                  <span className="text-slate-500"> / </span>
                  <span className="font-mono text-base font-bold text-blue-300">{stats.odd}</span>
                  <span className="text-slate-400"> = </span>
                  <span className="font-mono text-base font-bold text-amber-200">{estimate.toFixed(6)}</span>
                </div>
                <div className="text-xs text-slate-400">
                  이론값 P(소수 | 홀수) = <span className="font-mono font-bold text-amber-200">2/3 ≈ 0.666667</span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-400">오차 (추정 − 이론) =</span>{" "}
                  <span className={`font-mono font-bold ${error !== null && Math.abs(error) < 0.005 ? "text-emerald-300" : "text-amber-300"}`}>
                    {error !== null ? (error >= 0 ? "+" : "") + error.toFixed(6) : "—"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 수렴 곡선 (단계별 모드 + 데이터 있을 때) */}
          {mode === "step" && history.length >= 2 ? (
            <ConvergencePlot data={history} />
          ) : null}
        </div>
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function describe(v: number): string {
  if (v % 2 === 0) return "→ 짝수 (조건 밖)";
  if (v === 3 || v === 5) return "→ 홀수 ∧ 소수 (q + 1, p + 1)";
  return "→ 홀수 (p + 1)";
}

function KpiCard({
  label, value, tone, mono,
}: { label: string; value: string; tone: "slate" | "blue" | "emerald" | "amber"; mono?: boolean }) {
  const valTone =
    tone === "blue" ? "text-blue-300" :
    tone === "emerald" ? "text-emerald-300" :
    tone === "amber" ? "text-amber-300" :
    "text-slate-200";
  return (
    <div className="rounded-lg border border-white/12 bg-white/[0.06] px-3 py-2 text-center">
      <div className={`${mono ? "font-mono" : ""} text-lg font-bold tabular-nums ${valTone}`}>{value}</div>
      <div className="mt-0.5 text-[10px] text-slate-400">{label}</div>
    </div>
  );
}

// ============================================================
// 수렴 곡선 (SVG)
// ============================================================

function ConvergencePlot({ data }: { data: number[] }) {
  // viewBox 320×140
  const W = 320, H = 140;
  const PL = 36, PR = 8, PT = 10, PB = 22;
  const gW = W - PL - PR;
  const gH = H - PT - PB;
  const yMin = 0;
  const yMax = 1;

  const last = data[data.length - 1];

  const path = useMemo(() => {
    const n = data.length;
    if (n < 2) return "";
    return data
      .map((v, i) => {
        const x = PL + (n === 1 ? 0 : (i / (n - 1)) * gW);
        const y = PT + gH * (1 - (v - yMin) / (yMax - yMin));
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [data, gW, gH]);

  const yTheory = PT + gH * (1 - (THEORY - yMin) / (yMax - yMin));

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-violet-300">📈 추정값 수렴 (시행 누적)</div>
        <div className="text-[10px] text-slate-500">{data.length} 포인트 · 마지막 {last.toFixed(4)}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block w-full rounded-md bg-slate-950">
        {/* 축 */}
        <line x1={PL} y1={PT} x2={PL} y2={PT + gH} stroke="rgba(100,116,139,0.45)" />
        <line x1={PL} y1={PT + gH} x2={PL + gW} y2={PT + gH} stroke="rgba(100,116,139,0.45)" />
        {/* Y 눈금 */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => {
          const y = PT + gH * (1 - v);
          return (
            <g key={v}>
              <line x1={PL} y1={y} x2={PL + gW} y2={y} stroke="rgba(100,116,139,0.12)" />
              <text x={PL - 4} y={y} fontSize={8} textAnchor="end" dominantBaseline="middle" fill="#64748b">{v.toFixed(2)}</text>
            </g>
          );
        })}
        {/* 이론값 2/3 점선 */}
        <line x1={PL} y1={yTheory} x2={PL + gW} y2={yTheory} stroke="rgba(234,179,8,0.6)" strokeDasharray="4 4" />
        <text x={PL + gW - 2} y={yTheory - 3} fontSize={8} textAnchor="end" fill="#fbbf24">이론 2/3</text>
        {/* 추정 곡선 */}
        <path d={path} fill="none" stroke="#22d3ee" strokeWidth={2} />
      </svg>
      <p className="mt-1 text-center text-[11px] text-slate-500">시행이 누적될수록 추정값이 <span className="font-bold text-amber-300">2/3</span>에 수렴 — 대수의 법칙</p>
    </div>
  );
}
