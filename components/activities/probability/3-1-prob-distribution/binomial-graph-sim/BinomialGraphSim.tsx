"use client";

import { useId, useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 수학 헬퍼 ─────────────────────────────────────────────
function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 0; i < Math.min(k, n - k); i++) r = (r * (n - i)) / (i + 1);
  return r;
}
function pmf(n: number, p: number, k: number) {
  return comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}
function buildPMF(n: number, p: number): number[] {
  return Array.from({ length: n + 1 }, (_, k) => pmf(n, p, k));
}
function fmt(x: number, d = 2) {
  return (Math.round(x * 10 ** d) / 10 ** d).toLocaleString("ko-KR", { maximumFractionDigits: d });
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "shape_by_p",
    prompt:
      "p를 0.1·0.5·0.9로 바꿔 보며 분포 모양이 어떻게 달라졌나요? 우편포·좌편포·대칭을 직접 관찰한 결과로 설명해 보세요.",
    kind: "text",
    placeholder: "예: p=0.1에선 막대가 왼쪽에 몰려 오른쪽 꼬리가 길고(우편포), p=0.5에선 좌우 대칭, p=0.9에선 반대로 좌편포가 된다.",
  },
  {
    id: "range_or_normal_approx",
    prompt:
      "P(a ≤ X ≤ b) 계산기로 흥미로웠던 예 하나를 들거나, 정규근사 조건(np≥5, nq≥5)이 분포 모양에서 어떻게 드러나는지 적어 보세요.",
    kind: "text",
    placeholder: "예: B(20, 0.4)에서 P(6 ≤ X ≤ 10) ≈ 75%처럼 평균 근처 한 구간에 확률이 많이 쏠려 있음을 확인했다.",
  },
];

// ─── 메인 ─────────────────────────────────────────────────
export default function BinomialGraphSim() {
  const [n, setN] = useState(10);
  const [pPct, setPPct] = useState(40);
  const p = pPct / 100;
  const q = 1 - p;

  // 범위 입력
  const [aStr, setAStr] = useState("0");
  const [bStr, setBStr] = useState("10");
  const [range, setRange] = useState<{ a: number; b: number } | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);

  // n 변경 시 범위 초기화 (핸들러에서 처리, setState-in-effect 회피)
  function changeN(next: number) {
    setN(next);
    setRange(null);
    setRangeError(null);
    // b가 새 n을 넘으면 클램프
    const bv = Number(bStr);
    if (Number.isFinite(bv) && bv > next) setBStr(String(next));
  }
  function changeP(next: number) {
    setPPct(next);
    setRange(null);
    setRangeError(null);
  }

  function calcRange() {
    const a = Math.floor(Number(aStr));
    const b = Math.floor(Number(bStr));
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b > n || a > b) {
      setRangeError(`⚠ 올바른 범위를 입력해 주세요. (0 ≤ a ≤ b ≤ ${n})`);
      setRange(null);
      return;
    }
    setRangeError(null);
    setRange({ a, b });
  }

  const probs = useMemo(() => buildPMF(n, p), [n, p]);
  const stats = useMemo(() => {
    const mean = n * p;
    const vari = n * p * q;
    const sigma = Math.sqrt(vari);
    const maxP = Math.max(...probs);
    const modeK = probs.indexOf(maxP);
    return { mean, vari, sigma, maxP, modeK };
  }, [n, p, q, probs]);

  const rangeProb = useMemo(() => {
    if (!range) return null;
    let s = 0;
    for (let k = range.a; k <= range.b; k++) s += probs[k] ?? 0;
    return s;
  }, [range, probs]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">📈 이항분포 그래프 시뮬레이터</h3>
        <p className="mt-2 leading-7 text-slate-300">
          n·p를 조절해 <b className="text-amber-300">B(n, p)</b>의 막대그래프·확률분포표를 실시간으로 탐색하고,{" "}
          <b className="text-violet-300">P(a ≤ X ≤ b)</b> 범위 확률을 계산해 분포 형태까지 분석해 보세요.
        </p>
      </div>

      {/* ① 컨트롤 + 통계 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">⚙️ 이항분포 B(n, p) 설정</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <RangeRow label="시행 횟수 n" value={n} display={String(n)} min={1} max={30} step={1} onChange={changeN} tone="orange" />
          <RangeRow label="성공 확률 p" value={pPct} display={p.toFixed(2)} min={1} max={99} step={1} onChange={changeP} tone="violet" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatChip tone="mean" lbl="평균 E(X) = np" val={fmt(stats.mean, 3)} />
          <StatChip tone="var" lbl="분산 V(X) = npq" val={fmt(stats.vari, 3)} />
          <StatChip tone="sig" lbl="표준편차 σ(X)" val={fmt(stats.sigma, 4)} />
          <StatChip tone="q" lbl="q = 1 − p" val={fmt(q, 3)} />
        </div>
      </div>

      {/* ② 그래프 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">📊 이항분포 그래프 (막대그래프)</p>
        <div className="mt-3">
          <BinomialBarChart n={n} probs={probs} mean={stats.mean} sigma={stats.sigma} range={range} />
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          <span className="text-amber-300">노란 점선</span> = 평균(μ) | <span className="text-emerald-300">초록 영역</span> = μ ± σ |{" "}
          <span className="text-blue-300">파란 막대</span> = 일반 | <span className="text-violet-300">보라 막대</span> = 선택 범위
        </p>
      </div>

      {/* ③ P(a≤X≤b) 계산기 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">
          🧮 범위 확률 계산기{" "}
          <span className="ml-1 text-sm font-normal text-slate-500">P(a ≤ X ≤ b)</span>
        </p>
        <RangeCalculator
          n={n}
          aStr={aStr} bStr={bStr}
          setAStr={setAStr} setBStr={setBStr}
          calcRange={calcRange}
        />
        {rangeError ? (
          <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-300">
            {rangeError}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-violet-400/30 bg-violet-400/10 px-5 py-4 text-center">
            {range && rangeProb !== null ? (
              <RangeResult
                a={range.a} b={range.b}
                prob={rangeProb}
                probs={probs}
                n={n}
                p={p}
              />
            ) : (
              <p className="text-sm text-slate-500">a, b 값을 입력하고 ▶ 계산하기를 눌러 주세요.</p>
            )}
          </div>
        )}
      </div>

      {/* ④ 확률분포표 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">📋 확률분포표</p>
        <DistTable probs={probs} range={range} />
        <p className="mt-2 text-xs text-slate-500">
          🟡 주황색 행 = 최빈값(mode) | 🟣 보라색 행 = 선택된 P(a ≤ X ≤ b) 범위
        </p>
      </div>

      {/* ⑤ 분석 리포트 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">🔍 분포 분석 리포트</p>
        <AnalysisReport n={n} p={p} q={q} probs={probs} stats={stats} />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 슬라이더 ─────────────────────────────────────────────
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
  const badgeBg =
    tone === "orange"
      ? "from-amber-400 to-orange-500"
      : "from-indigo-500 to-violet-500";
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex items-center justify-between text-sm text-slate-300">
        <span><b>{label}</b></span>
        <span
          key={display}
          className={`animate-[pulseR_0.35s_ease] rounded-md bg-gradient-to-r ${badgeBg} px-2.5 py-0.5 font-mono text-base font-extrabold text-slate-900`}
        >
          {display}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-2 w-full cursor-pointer rounded-full ${accent} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40`}
      />
    </div>
  );
}

// ─── 통계 칩 ──────────────────────────────────────────────
function StatChip({ tone, lbl, val }: { tone: "mean" | "var" | "sig" | "q"; lbl: string; val: string }) {
  const cls = tone === "mean" ? { box: "border-amber-400/50 bg-amber-400/10", v: "text-amber-300" }
            : tone === "var" ? { box: "border-indigo-400/50 bg-indigo-400/10", v: "text-indigo-300" }
            : tone === "sig" ? { box: "border-emerald-400/50 bg-emerald-400/10", v: "text-emerald-300" }
            : { box: "border-pink-400/50 bg-pink-400/10", v: "text-pink-300" };
  return (
    <div className={`rounded-xl border-2 px-3 py-2 text-center ${cls.box}`}>
      <p key={val} className={`animate-[pulseR_0.35s_ease] font-mono text-lg font-black ${cls.v}`}>{val}</p>
      <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400">{lbl}</p>
    </div>
  );
}

// ─── 막대 차트 ────────────────────────────────────────────
function BinomialBarChart({
  n, probs, mean, sigma, range,
}: {
  n: number; probs: number[]; mean: number; sigma: number; range: { a: number; b: number } | null;
}) {
  const W = 720;
  const H = 260;
  const PL = 42, PR = 14, PT = 22, PB = 38;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const cnt = n + 1;
  const cellW = innerW / cnt;
  const barW = Math.max(2, cellW - 3);
  const maxP = Math.max(...probs);
  const xPos = (k: number) => PL + (k + 0.5) * cellW;

  const uid = useId().replace(/[:]/g, "");
  const gradN = `gradN_${uid}`;
  const gradR = `gradR_${uid}`;

  const sigmaLeft = PL + Math.max(0, mean - sigma) * cellW;
  const sigmaRight = PL + Math.min(n, mean + sigma) * cellW + cellW;
  const step = n > 20 ? Math.ceil(n / 15) : 1;
  const nTicks = 4;

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="이항분포 막대 차트">
        <defs>
          <linearGradient id={gradN} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(59,130,246,0.9)" />
            <stop offset="1" stopColor="rgba(37,99,235,0.6)" />
          </linearGradient>
          <linearGradient id={gradR} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(139,92,246,0.95)" />
            <stop offset="1" stopColor="rgba(99,102,241,0.7)" />
          </linearGradient>
        </defs>

        {/* μ±σ 영역 */}
        <rect
          x={Math.max(PL, sigmaLeft)}
          y={PT}
          width={Math.max(0, Math.min(W - PR, sigmaRight) - Math.max(PL, sigmaLeft))}
          height={innerH}
          fill="rgba(16,185,129,0.07)"
        />

        {/* y축 눈금 */}
        {Array.from({ length: nTicks + 1 }, (_, i) => {
          const v = (maxP * i) / nTicks;
          const y = PT + innerH * (1 - i / nTicks);
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={PL + innerW} y2={y} stroke="rgba(255,255,255,0.05)" />
              <text x={PL - 5} y={y + 4} textAnchor="end" fontSize={10} fill="rgba(71,85,105,1)">
                {(v * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}

        {/* 막대 */}
        {probs.map((v, k) => {
          const bh = innerH * (v / maxP);
          const cx = xPos(k);
          const x = cx - barW / 2;
          const y = PT + innerH - bh;
          const inR = range !== null && k >= range.a && k <= range.b;
          return (
            <g key={k}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={bh}
                rx={Math.min(4, barW * 0.3)}
                fill={`url(#${inR ? gradR : gradN})`}
              />
              {n <= 20 && bh > 22 ? (
                <text x={cx} y={y - 3} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.7)">
                  {(v * 100).toFixed(1)}%
                </text>
              ) : null}
            </g>
          );
        })}

        {/* 평균 점선 + 라벨 */}
        <line x1={xPos(mean)} y1={PT} x2={xPos(mean)} y2={PT + innerH} stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="6 4" />
        <text x={xPos(mean)} y={PT - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fbbf24">
          μ={fmt(mean, 2)}
        </text>

        {/* x축 */}
        <line x1={PL} y1={PT + innerH} x2={PL + innerW} y2={PT + innerH} stroke="rgba(255,255,255,0.15)" />
        {Array.from({ length: cnt }, (_, k) => {
          if (k % step !== 0) return null;
          return (
            <text key={k} x={xPos(k)} y={H - 18} textAnchor="middle" fontSize={11} fill="rgba(100,116,139,1)">
              {k}
            </text>
          );
        })}
        <text x={PL + innerW / 2} y={H - 4} textAnchor="middle" fontSize={11} fill="rgba(71,85,105,1)">
          ← 성공 횟수 X →
        </text>
      </svg>
    </div>
  );
}

// ─── 범위 계산기 ──────────────────────────────────────────
function RangeCalculator({
  n, aStr, bStr, setAStr, setBStr, calcRange,
}: {
  n: number;
  aStr: string; bStr: string;
  setAStr: (s: string) => void;
  setBStr: (s: string) => void;
  calcRange: () => void;
}) {
  const aId = useId(), bId = useId();
  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") calcRange();
  }
  return (
    <div className="mt-3 grid items-end gap-3 sm:grid-cols-3">
      <div>
        <label htmlFor={aId} className="block text-sm font-semibold text-slate-300">a (하한)</label>
        <input
          id={aId}
          type="number"
          inputMode="numeric"
          min={0} max={n}
          value={aStr}
          onChange={(e) => setAStr(e.target.value)}
          onKeyDown={onKey}
          className="mt-1 w-full rounded-xl border-2 border-white/15 bg-white/10 px-3 py-2 text-center font-mono text-lg text-slate-100 outline-none transition focus:border-indigo-400 focus:bg-indigo-500/10 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
        />
      </div>
      <div>
        <label htmlFor={bId} className="block text-sm font-semibold text-slate-300">b (상한)</label>
        <input
          id={bId}
          type="number"
          inputMode="numeric"
          min={0} max={n}
          value={bStr}
          onChange={(e) => setBStr(e.target.value)}
          onKeyDown={onKey}
          className="mt-1 w-full rounded-xl border-2 border-white/15 bg-white/10 px-3 py-2 text-center font-mono text-lg text-slate-100 outline-none transition focus:border-indigo-400 focus:bg-indigo-500/10 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
        />
      </div>
      <button
        type="button"
        onClick={calcRange}
        className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-extrabold text-white transition hover:brightness-110"
      >
        ▶ 계산하기
      </button>
    </div>
  );
}

function RangeResult({
  a, b, prob, probs, n, p,
}: { a: number; b: number; prob: number; probs: number[]; n: number; p: number }) {
  const terms: string[] = [];
  for (let k = a; k <= Math.min(b, a + 4); k++) {
    terms.push(`P(X=${k}) = ${(probs[k] * 100).toFixed(3)}%`);
  }
  if (b - a > 4) terms.push("…");
  return (
    <>
      <p className="text-3xl font-black text-indigo-300">
        P({a} ≤ X ≤ {b}) ={" "}
        <span className="text-violet-300">{(prob * 100).toFixed(4)}%</span>
      </p>
      <p className="mt-1 text-base font-bold text-indigo-200">≈ {prob.toFixed(6)}</p>
      <p className="mt-2 break-words font-mono text-sm text-slate-400">{terms.join(" + ")}</p>
      <p className="mt-1 text-xs text-slate-500">
        n={n}, p={p.toFixed(2)}의 이항분포 B({n}, {p.toFixed(2)})에서
      </p>
    </>
  );
}

// ─── 분포표 ───────────────────────────────────────────────
function DistTable({
  probs, range,
}: { probs: number[]; range: { a: number; b: number } | null }) {
  const maxP = Math.max(...probs);
  // 누적 확률 — reduce 로 사전 계산해 map 내 let 재할당을 피한다(react-hooks/immutability).
  const cumArr = probs.reduce<number[]>((acc, v) => {
    const last = acc.length === 0 ? 0 : acc[acc.length - 1];
    acc.push(Math.min(last + v, 1));
    return acc;
  }, []);
  const rows = probs.map((v, k) => ({
    k,
    v,
    cum: cumArr[k],
    isMode: v >= maxP - 1e-10,
    inRange: range !== null && k >= range.a && k <= range.b,
    barPct: (v / maxP) * 100,
  }));

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <Th>X</Th><Th>P(X=x)</Th><Th>누적 F(x)</Th><Th>상대 막대</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const cls = r.inRange
              ? "bg-violet-500/15 text-violet-200"
              : r.isMode
              ? "bg-amber-500/12 text-amber-200"
              : "";
            return (
              <tr key={r.k} className={cls}>
                <Td className="font-bold text-slate-300">{r.k}</Td>
                <Td className="font-mono">{(r.v * 100).toFixed(4)}%</Td>
                <Td className="font-mono text-emerald-300">{(r.cum * 100).toFixed(3)}%</Td>
                <Td className="text-left">
                  <MiniBar pct={r.barPct} />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-white/10 bg-indigo-500/20 px-2 py-2 text-center text-sm font-bold text-indigo-200">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`border border-white/5 px-2 py-1.5 text-center text-sm ${className}`}>{children}</td>;
}
function MiniBar({ pct }: { pct: number }) {
  // 최대 120px 너비. SVG 로 비율 표시(인라인 style 회피).
  const w = Math.round(Math.min(120, Math.max(2, pct * 1.2)));
  const uid = useId().replace(/[:]/g, "");
  const gid = `mb_${uid}`;
  return (
    <svg width={w} height={10} className="block">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={w} height={10} rx={3} fill={`url(#${gid})`} />
    </svg>
  );
}

// ─── 분석 리포트 ──────────────────────────────────────────
function AnalysisReport({
  n, p, q, probs, stats,
}: {
  n: number; p: number; q: number; probs: number[];
  stats: { mean: number; vari: number; sigma: number; maxP: number; modeK: number };
}) {
  const { mean, sigma, maxP, modeK } = stats;

  // μ±σ 정수 구간 (양쪽 포함)
  const lo1 = Math.max(0, Math.ceil(mean - sigma));
  const hi1 = Math.min(n, Math.floor(mean + sigma));
  let probSig1 = 0;
  for (let k = lo1; k <= hi1; k++) probSig1 += probs[k];

  const lo2 = Math.max(0, Math.ceil(mean - 2 * sigma));
  const hi2 = Math.min(n, Math.floor(mean + 2 * sigma));
  let probSig2 = 0;
  for (let k = lo2; k <= hi2; k++) probSig2 += probs[k];

  // 다중 최빈값
  const modes: number[] = [];
  probs.forEach((v, i) => { if (v >= maxP - 1e-10) modes.push(i); });

  // 변동계수·집중도
  const cv = mean > 0 ? sigma / mean : Infinity;
  const conc = cv < 0.2 ? "매우 집중" : cv < 0.4 ? "집중" : cv < 0.7 ? "보통" : "분산";

  // 피어슨 비대칭도
  const pearson = sigma > 0 ? (mean - modeK) / sigma : 0;

  // 분포 형태
  const skewLabel = p < 0.5 ? "우편포" : p > 0.5 ? "좌편포" : "대칭";
  const skewDesc = p < 0.5
    ? "오른쪽 꼬리 (right-skewed)"
    : p > 0.5
    ? "왼쪽 꼬리 (left-skewed)"
    : "대칭 (symmetric, p=0.5)";
  const skewTag: "right" | "left" | "sym" = p < 0.5 ? "right" : p > 0.5 ? "left" : "sym";

  // 정규근사
  const normalOK = n * p >= 5 && n * q >= 5;

  const cards: { title: string; val: React.ReactNode; sub: React.ReactNode }[] = [
    {
      title: "최빈값 (mode)",
      val: <span className="font-mono text-xl font-extrabold text-slate-100">{modes.length > 1 ? modes.join(", ") : modeK}</span>,
      sub: `P(X=${modeK}) = ${(maxP * 100).toFixed(3)}% 가 가장 높습니다.`,
    },
    {
      title: "분포 형태",
      val: <Tag tone={skewTag}>{skewLabel}</Tag>,
      sub: skewDesc,
    },
    {
      title: "P(μ−σ ≤ X ≤ μ+σ)",
      val: <span className="font-mono text-xl font-extrabold text-slate-100">{(probSig1 * 100).toFixed(2)}%</span>,
      sub: `X가 ${lo1} ~ ${hi1} 범위에 있을 확률 (약 68% 기대)`,
    },
    {
      title: "P(μ−2σ ≤ X ≤ μ+2σ)",
      val: <span className="font-mono text-xl font-extrabold text-slate-100">{(probSig2 * 100).toFixed(2)}%</span>,
      sub: `X가 ${lo2} ~ ${hi2} 범위에 있을 확률 (약 95% 기대)`,
    },
    {
      title: "집중도 (CV)",
      val: <Tag tone="info">{conc}</Tag>,
      sub: `변동계수 σ/μ = ${cv === Infinity ? "—" : cv.toFixed(3)} → 평균 대비 퍼진 정도`,
    },
    {
      title: "피어슨 비대칭도",
      val: <span className="font-mono text-xl font-extrabold text-slate-100">{pearson.toFixed(3)}</span>,
      sub: "(μ − mode) / σ ≈ 0이면 대칭, 양수면 우편포, 음수면 좌편포",
    },
    {
      title: "중앙값 근사",
      val: <span className="font-mono text-xl font-extrabold text-slate-100">{Math.floor(mean)} ~ {Math.ceil(mean)}</span>,
      sub: "이항분포의 중앙값은 floor(np) 또는 ceil(np) 부근에 있습니다.",
    },
    {
      title: "X=0 확률 (전체 실패)",
      val: <span className="font-mono text-xl font-extrabold text-slate-100">{(probs[0] * 100).toFixed(4)}%</span>,
      sub: `n번 모두 실패할 확률 = qⁿ = ${q.toFixed(3)}^${n}`,
    },
    {
      title: `X=${n} 확률 (전체 성공)`,
      val: <span className="font-mono text-xl font-extrabold text-slate-100">{(probs[n] * 100).toFixed(4)}%</span>,
      sub: `n번 모두 성공할 확률 = pⁿ = ${p.toFixed(3)}^${n}`,
    },
    {
      title: "정규분포 근사 적합성",
      val: normalOK
        ? <Tag tone="sym">근사 가능 ✓</Tag>
        : <Tag tone="left">근사 불충분 ✗</Tag>,
      sub: `np=${(n * p).toFixed(1)}, nq=${(n * q).toFixed(1)} — np ≥ 5 이고 nq ≥ 5 이면 정규근사 권장`,
    },
  ];

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {cards.map((c, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
          <p className="text-[11px] font-semibold tracking-wider text-slate-500">{c.title}</p>
          <div className="mt-1 text-base font-extrabold text-slate-100">{c.val}</div>
          <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}

function Tag({ tone, children }: { tone: "sym" | "right" | "left" | "info"; children: React.ReactNode }) {
  const cls = tone === "sym" ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
            : tone === "right" ? "border-amber-400/40 bg-amber-400/15 text-amber-200"
            : tone === "left" ? "border-rose-400/40 bg-rose-400/15 text-rose-200"
            : "border-indigo-400/40 bg-indigo-400/15 text-indigo-200";
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 text-sm font-bold ${cls}`}>
      {children}
    </span>
  );
}
