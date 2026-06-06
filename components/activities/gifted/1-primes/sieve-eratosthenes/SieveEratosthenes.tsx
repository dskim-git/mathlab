"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TabKey = "sieve" | "twin" | "density";

const RANGE_OPTIONS = [50, 100, 200] as const;
const COL_OPTIONS = [5, 10, 20] as const;

const FACTS = [
  "<b>에라토스테네스</b>는 기원전 276년경 그리스의 수학자로, 지구 둘레도 최초로 계산했어요. 🌍",
  "소수는 <b>2, 3, 5, 7, 11, 13…</b> — 2를 제외하면 모두 홀수입니다.",
  "<b>골드바흐의 추측</b>: 2보다 큰 모든 짝수는 두 소수의 합이다. (아직 미증명!)",
  "<b>메르센 소수</b>: 2ⁿ−1 형태의 소수. 현재 알려진 가장 큰 소수도 메르센 형태!",
  "소수의 역수의 합 <b>1/2 + 1/3 + 1/5 + 1/7 + …</b> 은 무한대로 발산합니다.",
  "100 이하 소수는 <b>25개</b>, 1000 이하는 168개, 10000 이하는 1229개!",
];

type CellState = "normal" | "sieved" | "prime" | "current" | "highlight";

function getPrimesUpTo(max: number): number[] {
  const composite = new Array(max + 1).fill(false);
  composite[0] = composite[1] = true;
  for (let p = 2; p * p <= max; p++) {
    if (!composite[p]) {
      for (let k = p * p; k <= max; k += p) composite[k] = true;
    }
  }
  const out: number[] = [];
  for (let n = 2; n <= max; n++) if (!composite[n]) out.push(n);
  return out;
}

export default function SieveEratosthenes() {
  const [tab, setTab] = useState<TabKey>("sieve");

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-5">
        <h2 className="text-2xl font-bold text-white">🔢 에라토스테네스의 체와 소수정리</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          소수를 직접 골라내며 체의 원리를 체험하고, 쌍둥이 소수·소수정리까지 탐험해 보세요.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { key: "sieve", label: "🧮 체 조작" },
            { key: "twin", label: "👯 쌍둥이 소수" },
            { key: "density", label: "📊 소수 밀도" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              "rounded-lg border px-3 py-1.5 text-sm font-semibold transition " +
              (tab === t.key
                ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
                : "border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-900")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className={tab === "sieve" ? "" : "hidden"}>
        <SieveTab />
      </section>
      <section className={tab === "twin" ? "" : "hidden"}>
        <TwinTab />
      </section>
      <section className={tab === "density" ? "" : "hidden"}>
        <DensityTab />
      </section>
    </div>
  );
}

// ─── 탭 1: 체 조작 ────────────────────────────────────────────
function SieveTab() {
  const [N, setN] = useState<number>(100);
  const [cols, setCols] = useState<number>(10);
  // sieved[n] = 합성수로 지워짐, confirmed[n] = 소수 확정.
  const [sieved, setSieved] = useState<boolean[]>(() => initSieved(100));
  const [confirmed, setConfirmed] = useState<boolean[]>(() => new Array(101).fill(false));
  const [curP, setCurP] = useState<number>(2);
  const [done, setDone] = useState<boolean>(false);
  const [primes, setPrimes] = useState<number[]>([]);
  const [highlight, setHighlight] = useState<Set<number>>(new Set());
  const [autoRunning, setAutoRunning] = useState<boolean>(false);
  const [factIdx, setFactIdx] = useState<number>(0);
  const [factHtml, setFactHtml] = useState<string | null>(null);

  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRunning = useRef<boolean>(false);

  function initSieved(n: number): boolean[] {
    const a = new Array(n + 1).fill(false);
    a[0] = a[1] = true;
    return a;
  }

  function reset(nextN: number) {
    setN(nextN);
    setSieved(initSieved(nextN));
    setConfirmed(new Array(nextN + 1).fill(false));
    setCurP(2);
    setDone(false);
    setPrimes([]);
    setHighlight(new Set());
    setFactIdx(0);
    setFactHtml(null);
    stopAutoTimer();
    setAutoRunning(false);
  }

  function stopAutoTimer() {
    if (autoTimer.current) {
      clearTimeout(autoTimer.current);
      autoTimer.current = null;
    }
  }

  // 단계 진행: curP 소수 확정 → 배수 highlight 후 sieved 처리 → 다음 소수로.
  function step() {
    if (done || stepRunning.current) return;
    stepRunning.current = true;

    const nextConfirmed = confirmed.slice();
    nextConfirmed[curP] = true;
    const nextPrimes = [...primes, curP];
    setConfirmed(nextConfirmed);
    setPrimes(nextPrimes);

    // p² 부터 p 간격 배수 — 아직 sieved 가 아닌 것만 highlight.
    const targets: number[] = [];
    const nextSieved = sieved.slice();
    for (let k = curP * curP; k <= N; k += curP) {
      if (!nextSieved[k] && !nextConfirmed[k]) targets.push(k);
      nextSieved[k] = true;
    }

    // 순차 하이라이트.
    const delay = autoRunning ? 30 : 60;
    let i = 0;
    const seen = new Set<number>();
    const flash = () => {
      if (i < targets.length) {
        seen.add(targets[i]);
        setHighlight(new Set(seen));
        i++;
        setTimeout(flash, delay);
      } else {
        setSieved(nextSieved);
        setHighlight(new Set());
        advanceCurP(nextSieved, nextConfirmed, nextPrimes);
        stepRunning.current = false;
      }
    };
    if (targets.length === 0) {
      setSieved(nextSieved);
      advanceCurP(nextSieved, nextConfirmed, nextPrimes);
      stepRunning.current = false;
    } else {
      flash();
    }
  }

  function advanceCurP(
    nextSieved: boolean[],
    nextConfirmed: boolean[],
    nextPrimes: number[],
  ) {
    let nxt = curP + 1;
    while (nxt <= N && nextSieved[nxt]) nxt++;
    if (nxt * nxt > N) {
      // 남은 모든 미지움 수는 소수 확정.
      const fc = nextConfirmed.slice();
      const fp = nextPrimes.slice();
      for (let n = nxt; n <= N; n++) {
        if (!nextSieved[n] && !fc[n]) {
          fc[n] = true;
          fp.push(n);
        }
      }
      setConfirmed(fc);
      setPrimes(fp);
      setDone(true);
      stopAutoTimer();
      setAutoRunning(false);
      setFactHtml(buildFinalFact(N, fp));
    } else {
      setCurP(nxt);
      const f = FACTS[factIdx % FACTS.length];
      setFactHtml(f);
      setFactIdx(factIdx + 1);
    }
  }

  function toggleAuto() {
    if (done) return;
    if (autoRunning) {
      stopAutoTimer();
      setAutoRunning(false);
    } else {
      setAutoRunning(true);
    }
  }

  useEffect(() => {
    if (!autoRunning || done) return;
    autoTimer.current = setTimeout(() => {
      step();
    }, 800);
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunning, curP, done]);

  function toggleCell(n: number) {
    if (done) return;
    if (n === curP) return;
    if (confirmed[n]) return;
    const ns = sieved.slice();
    ns[n] = !ns[n];
    setSieved(ns);
  }

  const cells = useMemo(() => {
    const arr: number[] = [];
    for (let n = 2; n <= N; n++) arr.push(n);
    return arr;
  }, [N]);

  function cellState(n: number): CellState {
    if (highlight.has(n)) return "highlight";
    if (!done && n === curP && !sieved[n] && !confirmed[n]) return "current";
    if (confirmed[n]) return "prime";
    if (sieved[n]) return "sieved";
    return "normal";
  }

  const composites = sieved.filter(Boolean).length;
  const progressPct = Math.round((composites / Math.max(1, N - 1)) * 100);
  const twinPairs = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i < primes.length - 1; i++) {
      if (primes[i + 1] - primes[i] === 2) {
        set.add(primes[i]);
        set.add(primes[i + 1]);
      }
    }
    return set;
  }, [primes]);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-xs font-semibold text-slate-400">범위</label>
        <select
          aria-label="범위"
          value={N}
          onChange={(e) => reset(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-sm text-slate-200"
        >
          {RANGE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              2 ~ {r}
            </option>
          ))}
        </select>
        <label className="ml-2 text-xs font-semibold text-slate-400">열 수</label>
        <select
          aria-label="열 수"
          value={cols}
          onChange={(e) => setCols(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-sm text-slate-200"
        >
          {COL_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={step}
          disabled={done || autoRunning}
          className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-400 disabled:bg-blue-500/40 disabled:cursor-not-allowed"
        >
          ▶ 다음 단계
        </button>
        <button
          type="button"
          onClick={toggleAuto}
          disabled={done}
          className={
            "rounded-md px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed " +
            (autoRunning ? "bg-amber-500 hover:bg-amber-400" : "bg-emerald-500 hover:bg-emerald-400")
          }
        >
          {autoRunning ? "⏸ 일시정지" : "⚡ 자동 진행"}
        </button>
        <button
          type="button"
          onClick={() => reset(N)}
          className="rounded-md border border-rose-400/40 bg-rose-500/20 px-3 py-1.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/30"
        >
          ↺ 초기화
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm">
        <span>
          현재 소수: <b className="text-cyan-300">{done ? "—" : curP}</b>
        </span>
        <span>
          단계: <b className="text-violet-300">{primes.length}</b>
        </span>
        <span>
          발견된 소수: <b className="text-emerald-300">{primes.length}</b>개
        </span>
        {done ? <span className="font-bold text-emerald-300">✅ 완료!</span> : null}
      </div>

      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-400 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div
        className="mx-auto max-w-full overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-3"
        style={{ width: "fit-content" }}
      >
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${cols}, 42px)` }}
        >
          {cells.map((n) => {
            const s = cellState(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggleCell(n)}
                className={
                  "aspect-square rounded-md border text-2xl font-semibold leading-none transition " +
                  cellClass(s)
                }
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/60 p-3">
        <h3 className="mb-2 text-sm font-bold text-white">
          🎯 발견된 소수 목록{" "}
          <span className="text-xs font-normal text-slate-500">(쌍둥이 소수는 초록)</span>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {primes.map((p) => (
            <span
              key={p}
              className={
                "rounded-md border px-2 py-0.5 text-xs font-semibold " +
                (twinPairs.has(p)
                  ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                  : "border-blue-400/40 bg-blue-500/15 text-blue-200")
              }
            >
              {p}
            </span>
          ))}
          {primes.length === 0 ? (
            <span className="text-xs text-slate-500">아직 발견된 소수가 없어요.</span>
          ) : null}
        </div>
      </div>

      {factHtml ? (
        <div
          className="mt-3 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100"
          dangerouslySetInnerHTML={{ __html: "💡 " + factHtml }}
        />
      ) : null}
    </div>
  );
}

function cellClass(s: CellState): string {
  switch (s) {
    case "normal":
      return "border-white/10 bg-slate-800/60 text-slate-300 hover:bg-slate-700/80";
    case "sieved":
      return "border-rose-500/30 bg-rose-500/10 text-rose-300 line-through";
    case "prime":
      return "border-blue-400/60 bg-blue-500/25 text-blue-100";
    case "current":
      return "border-amber-400/70 bg-amber-500/30 text-amber-100 animate-pulse";
    case "highlight":
      return "border-amber-300 bg-amber-300/60 text-amber-900";
  }
}

function buildFinalFact(N: number, primes: number[]): string {
  let twinCount = 0;
  for (let i = 0; i < primes.length - 1; i++) {
    if (primes[i + 1] - primes[i] === 2) twinCount++;
  }
  const cnt = primes.length;
  const ratio = ((cnt / Math.max(1, N - 1)) * 100).toFixed(1);
  const pnt = Math.round(N / Math.log(N));
  const last = primes[primes.length - 1] ?? "—";
  return (
    `🎉 <b>${N} 이하 소수: ${cnt}개</b> (비율 ${ratio}%)<br>` +
    `👯 쌍둥이 소수 쌍: <b>${twinCount}쌍</b><br>` +
    `가장 큰 소수: <b>${last}</b><br>` +
    `<span class="text-emerald-300">소수정리: π(N) ≈ N / ln N = ${pnt} (이론값)</span>`
  );
}

// ─── 탭 2: 쌍둥이 소수 ────────────────────────────────────────
const TWIN_RANGES = [100, 500, 1000] as const;

function TwinTab() {
  const [maxRange, setMaxRange] = useState<number>(500);
  const twins = useMemo(() => {
    const ps = getPrimesUpTo(maxRange);
    const out: [number, number][] = [];
    for (let i = 0; i < ps.length - 1; i++) {
      if (ps[i + 1] - ps[i] === 2) out.push([ps[i], ps[i + 1]]);
    }
    return out;
  }, [maxRange]);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="text-xs font-semibold text-slate-400">범위</label>
        <select
          aria-label="쌍둥이 소수 범위"
          value={maxRange}
          onChange={(e) => setMaxRange(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-sm text-slate-200"
        >
          {TWIN_RANGES.map((r) => (
            <option key={r} value={r}>
              ~ {r}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-3 text-sm leading-relaxed text-slate-300">
        <b className="text-emerald-300">쌍둥이 소수</b>: 차이가 2인 소수 쌍 — 예: (3, 5),
        (11, 13), (17, 19) … 무한히 많은지 여부는 아직 미해결 문제입니다. 🤔
      </p>

      <p className="mb-3 text-sm font-semibold text-slate-200">
        {maxRange} 이하 쌍둥이 소수:{" "}
        <span className="text-emerald-300">{twins.length}쌍</span>
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {twins.map(([a, b]) => (
          <span
            key={a}
            className="rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-0.5 text-xs font-semibold text-emerald-200"
          >
            ({a}, {b})
          </span>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-xs leading-relaxed text-slate-400">
        📌 <b className="text-slate-200">쌍둥이 소수 추측</b>: 쌍둥이 소수는 무한히 많다 —
        여전히 미증명.
        <br />
        📌 2013년 장이탕(Zhang Yitang)이 차이 7,000만 이하인 소수 쌍이 무한히 많음을 최초
        증명.
      </div>
    </div>
  );
}

// ─── 탭 3: 소수 밀도 ──────────────────────────────────────────
const PNT_ROWS_SMALL: [number, number][] = [
  [100, 25],
  [1000, 168],
  [10000, 1229],
  [100000, 9592],
  [1000000, 78498],
];
const PNT_ROWS_BIG: [number, number][] = [
  [1e9, 50847534],
  [1e12, 37607912018],
  [1e15, 29844570422669],
  [1e18, 24739954287740860],
  [1e21, 21127269486018731928],
];

const GRAPH_RANGES = [500, 1000, 5000] as const;

function DensityTab() {
  return (
    <div className="space-y-4">
      <PntTableCard />
      <div className="grid gap-4 md:grid-cols-2">
        <PrimeProbCard />
        <NthPrimeCard />
      </div>
      <DensityGraphCard />
    </div>
  );
}

function PntTableCard() {
  const rows = [...PNT_ROWS_SMALL, ...PNT_ROWS_BIG];
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-2 text-base font-bold text-white">
        📋 소수정리: π(N) ≈ N / ln N
      </div>
      <p className="mb-3 text-sm text-slate-400">
        N 이 커질수록 <b className="text-slate-200">N / π(N)</b> 은{" "}
        <b className="text-slate-200">ln N</b> 에 가까워집니다.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-violet-500/80 text-white">
              <th className="px-3 py-2 text-right">N</th>
              <th className="px-3 py-2 text-right">ln N</th>
              <th className="px-3 py-2 text-right">
                π(N)
                <span className="ml-1 text-xs font-normal opacity-80">(실제)</span>
              </th>
              <th className="px-3 py-2 text-right">N / π(N)</th>
              <th className="px-3 py-2 text-right">차이(%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([N, piN], i) => {
              const lnN = Math.log(N);
              const ratio = N / piN;
              const diff = (Math.abs(ratio - lnN) / lnN) * 100;
              const isBig = i >= PNT_ROWS_SMALL.length;
              const nStr = isBig ? N.toExponential(0) : N.toLocaleString();
              const piStr = isBig ? piN.toExponential(4) : piN.toLocaleString();
              return (
                <tr
                  key={N}
                  className={i % 2 === 0 ? "bg-slate-900/60" : "bg-slate-900/30"}
                >
                  <td className="px-3 py-1.5 text-right font-bold text-slate-100">
                    {nStr}
                  </td>
                  <td className="px-3 py-1.5 text-right text-slate-300">
                    {lnN.toFixed(4)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-blue-300">
                    {piStr}
                    {isBig ? (
                      <span className="ml-1 text-xs text-slate-500">(알려진 값)</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-1.5 text-right font-bold text-violet-300">
                    {ratio.toFixed(4)}
                  </td>
                  <td
                    className={
                      "px-3 py-1.5 text-right font-semibold " +
                      (diff < 5 ? "text-emerald-300" : "text-amber-300")
                    }
                  >
                    {diff.toFixed(4)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        * N 이 클수록 차이(%)가 0 에 가까워집니다. (큰 N 은 근삿값 사용)
      </p>
    </div>
  );
}

function PrimeProbCard() {
  const [N, setN] = useState<number>(1000);
  const [result, setResult] = useState<{
    N: number;
    lnN: number;
    prob: number;
    empirical: { count: number; total: number } | null;
  } | null>(null);

  function calc() {
    const nN = Math.max(10, N);
    const lnN = Math.log(nN);
    const prob = 1 / lnN;
    let empirical: { count: number; total: number } | null = null;
    if (nN <= 100000) {
      const nearby = getPrimesUpTo(nN + 100).filter((p) => p >= nN - 100);
      empirical = { count: nearby.length, total: 201 };
    }
    setResult({ N: nN, lnN, prob, empirical });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-2 text-sm font-bold text-white">
        🎲 정수 N 이 소수일 확률 ≈ 1 / ln N
      </div>
      <p className="mb-3 text-xs text-slate-400">
        N 근처의 수 중에서 소수가 얼마나 촘촘히 있는지 나타냅니다.
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={10}
          value={N}
          onChange={(e) => setN(Number(e.target.value) || 10)}
          className="w-32 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-sm text-slate-100"
          aria-label="N 입력"
        />
        <button
          type="button"
          onClick={calc}
          className="rounded-md bg-blue-500 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-400"
        >
          계산
        </button>
      </div>
      {result ? (
        <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 p-3 text-xs leading-6 text-slate-100">
          N = <b>{result.N.toLocaleString()}</b>
          <br />
          ln N = <b>{result.lnN.toFixed(4)}</b>
          <br />
          1 / ln N ={" "}
          <b className="text-blue-300">{result.prob.toFixed(4)}</b>{" "}
          <span className="text-slate-400">
            (약 {(result.prob * 100).toFixed(2)}%)
          </span>
          <br />→ N 근처 수를 무작위로 고르면 약 <b>{Math.round(1 / result.prob)}개 중 1개</b>{" "}
          가 소수!
          {result.empirical ? (
            <>
              <br />
              📊 실제 ({result.N - 100} ~ {result.N + 100} 근처):{" "}
              <b>
                {result.empirical.count} / {result.empirical.total} ={" "}
                {(result.empirical.count / result.empirical.total).toFixed(4)}
              </b>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

let CACHED_PRIMES_10K: number[] | null = null;
function getPrimes10k(): number[] {
  if (CACHED_PRIMES_10K) return CACHED_PRIMES_10K;
  CACHED_PRIMES_10K = getPrimesUpTo(105000).slice(0, 10000);
  return CACHED_PRIMES_10K;
}

function NthPrimeCard() {
  const [n, setN] = useState<number>(100);
  const [result, setResult] = useState<{
    n: number;
    actual: number;
    approx1: number;
    diff1: number;
    approx2: number;
    diff2: number;
  } | null>(null);

  function calc() {
    const nn = Math.max(1, Math.min(10000, n));
    const ps = getPrimes10k();
    const actual = ps[nn - 1];
    const lnn = Math.log(nn);
    const approx1 = Math.round(nn * lnn);
    const diff1 = (Math.abs(approx1 - actual) / actual) * 100;
    const approx2 = Math.round(nn * (lnn + Math.log(lnn) - 1));
    const diff2 = (Math.abs(approx2 - actual) / actual) * 100;
    setResult({ n: nn, actual, approx1, diff1, approx2, diff2 });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-2 text-sm font-bold text-white">
        🔢 N 번째 소수 ≈ N · ln N
      </div>
      <p className="mb-3 text-xs text-slate-400">
        N 번째 소수의 크기는 N · ln N 에 가까워집니다.
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={1}
          max={10000}
          value={n}
          onChange={(e) => setN(Number(e.target.value) || 1)}
          className="w-32 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-sm text-slate-100"
          aria-label="n 입력"
        />
        <button
          type="button"
          onClick={calc}
          className="rounded-md bg-blue-500 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-400"
        >
          계산
        </button>
      </div>
      {result ? (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs leading-6 text-slate-100">
          <b>{result.n}번째</b> 소수 ={" "}
          <b className="text-emerald-300">{result.actual.toLocaleString()}</b>
          <br />
          근사 N · ln N = <b>{result.approx1.toLocaleString()}</b>{" "}
          <span
            className={result.diff1 < 5 ? "text-emerald-300" : "text-amber-300"}
          >
            (오차 {result.diff1.toFixed(2)}%)
          </span>
          <br />
          개선 근사 N · (ln N + ln ln N − 1) ={" "}
          <b>{result.approx2.toLocaleString()}</b>{" "}
          <span
            className={result.diff2 < 3 ? "text-emerald-300" : "text-amber-300"}
          >
            (오차 {result.diff2.toFixed(2)}%)
          </span>
          <p className="mt-1 text-[11px] text-slate-500">
            * N 이 클수록 근사가 더 정확해집니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function DensityGraphCard() {
  const [range, setRange] = useState<number>(1000);
  const [hover, setHover] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const piArrRef = useRef<number[] | null>(null);
  const padRef = useRef<{ l: number; r: number; t: number; b: number; iW: number; iH: number; yMax: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const MAX = range;

    // 소수 배열·π(x) 누적
    const sArr = new Array(MAX + 1).fill(false);
    sArr[0] = sArr[1] = true;
    for (let p = 2; p * p <= MAX; p++) {
      if (!sArr[p]) for (let k = p * p; k <= MAX; k += p) sArr[k] = true;
    }
    const piArr = new Array(MAX + 1).fill(0);
    let c = 0;
    for (let n = 2; n <= MAX; n++) {
      if (!sArr[n]) c++;
      piArr[n] = c;
    }
    piArrRef.current = piArr;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    const pad = { l: 56, r: 20, t: 28, b: 36 };
    const iW = W - pad.l - pad.r;
    const iH = H - pad.t - pad.b;
    const yMax = piArr[MAX] * 1.1;
    padRef.current = { ...pad, iW, iH, yMax };

    // 축
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + iH);
    ctx.lineTo(pad.l + iW, pad.t + iH);
    ctx.stroke();

    // y 그리드 + 라벨
    ctx.font = "11px sans-serif";
    for (let i = 0; i <= 4; i++) {
      const val = Math.round((yMax * i) / 4);
      const yy = pad.t + iH - (iH * i) / 4;
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "right";
      ctx.fillText(val.toLocaleString(), pad.l - 6, yy + 4);
      ctx.strokeStyle = "#1e293b";
      ctx.beginPath();
      ctx.moveTo(pad.l, yy);
      ctx.lineTo(pad.l + iW, yy);
      ctx.stroke();
    }
    // x 라벨
    for (let i = 0; i <= 5; i++) {
      const val = Math.round((MAX * i) / 5);
      const xx = pad.l + (iW * i) / 5;
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.fillText(val.toLocaleString(), xx, pad.t + iH + 16);
    }

    // π(x) 실제 — 파랑 실선
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    for (let n = 2; n <= MAX; n++) {
      const xx = pad.l + iW * (n / MAX);
      const yy = pad.t + iH - (iH * piArr[n]) / yMax;
      if (n === 2) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();

    // x/ln x 근사 — 주황 점선
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 4]);
    ctx.beginPath();
    for (let n = 3; n <= MAX; n++) {
      const approx = n / Math.log(n);
      const xx = pad.l + iW * (n / MAX);
      const yy = pad.t + iH - (iH * approx) / yMax;
      if (n === 3) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 범례
    ctx.fillStyle = "#60a5fa";
    ctx.fillRect(pad.l + 10, pad.t + 8, 22, 3);
    ctx.fillStyle = "#bfdbfe";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("π(x) 실제 소수 개수", pad.l + 38, pad.t + 13);
    ctx.strokeStyle = "#fbbf24";
    ctx.setLineDash([7, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad.l + 10, pad.t + 26);
    ctx.lineTo(pad.l + 32, pad.t + 26);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fde68a";
    ctx.fillText("x / ln x (근사)", pad.l + 38, pad.t + 30);
  }, [range]);

  function onMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const piArr = piArrRef.current;
    const pad = padRef.current;
    if (!canvas || !piArr || !pad) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const mx = (e.clientX - rect.left) * scale;
    const n = Math.round(((mx - pad.l) / pad.iW) * range);
    if (n < 2 || n > range) {
      setHover(null);
      return;
    }
    const approx = n / Math.log(n);
    const err = (Math.abs(piArr[n] - approx) / piArr[n]) * 100;
    setHover(
      `x = ${n.toLocaleString()} | π(x) = ${piArr[n]} | x/ln x = ${approx.toFixed(1)} | 오차 ${err.toFixed(2)}%`,
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-2 text-sm font-bold text-white">
        📈 π(x) vs x / ln x 그래프
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-xs font-semibold text-slate-400">범위</label>
        <select
          aria-label="그래프 범위"
          value={range}
          onChange={(e) => setRange(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-sm text-slate-200"
        >
          {GRAPH_RANGES.map((r) => (
            <option key={r} value={r}>
              ~ {r.toLocaleString()}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">
          — 파란선: 실제 π(x) · 주황점선: 근사 x/ln x
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={840}
        height={300}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        className="block w-full rounded-md border border-white/10"
      />
      <div className="mt-2 min-h-[18px] text-xs text-slate-300">{hover ?? ""}</div>
    </div>
  );
}

export { getPrimesUpTo };
