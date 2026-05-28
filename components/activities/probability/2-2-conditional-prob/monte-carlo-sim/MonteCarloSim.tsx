"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

/* ──────────────────────────────────────────────────────────────
   🎲 몬테카를로 시뮬레이션  (3 tabs)
   1) 동전·주사위 시뮬 — n번 독립시행 반복 → 이항분포 B(n,p) 수렴
   2) π 추정 — 정사각형 + 원 + 무작위 점 → π ≈ 4·(원 안)/(전체)
   3) 이항분포 계산기 — n, p, r 슬라이더 + P(X=r) + 분포 막대
   ────────────────────────────────────────────────────────────── */

// ============================================================
// 공통 수학
// ============================================================

function comb(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  const k = Math.min(r, n - r);
  let c = 1;
  for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1);
  return Math.round(c);
}
function binomPMF(n: number, p: number, k: number): number {
  if (k < 0 || k > n) return 0;
  return comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

// ============================================================
// 탭 0 — 🪙 동전·주사위 시뮬레이터
// ============================================================

type SimMode = "coin" | "dice" | "custom";

function CoinDiceTab() {
  const [mode, setMode] = useState<SimMode>("coin");
  const [n, setN] = useState(10);
  const [customP, setCustomP] = useState(35); // 0~100
  const [sets, setSets] = useState(0);
  const [succTotal, setSuccTotal] = useState(0);
  const [counts, setCounts] = useState<number[]>(() => new Array(11).fill(0));
  const [lastResults, setLastResults] = useState<boolean[]>([]);
  const [auto, setAuto] = useState(false);

  const p = mode === "coin" ? 0.5 : mode === "dice" ? 1 / 6 : customP / 100;

  // 설정 변경 핸들러 — 변경과 동시에 카운트 초기화 (useEffect 안에서 setState 회피)
  function resetCounts(newN = n) {
    setSets(0);
    setSuccTotal(0);
    setCounts(new Array(newN + 1).fill(0));
    setLastResults([]);
    setAuto(false);
  }
  function changeMode(m: SimMode) { setMode(m); resetCounts(); }
  function changeN(v: number) { setN(v); resetCounts(v); }
  function changeCustomP(v: number) { setCustomP(v); resetCounts(); }

  const roll = useCallback((rounds: number) => {
    setSets((prev) => prev + rounds);
    let succAdd = 0;
    const newCounts = [...counts];
    let last: boolean[] = [];
    for (let s = 0; s < rounds; s++) {
      let k = 0;
      const res: boolean[] = [];
      for (let i = 0; i < n; i++) {
        const ok = Math.random() < p;
        res.push(ok);
        if (ok) k++;
      }
      succAdd += k;
      if (newCounts[k] !== undefined) newCounts[k]++;
      if (s === rounds - 1) last = res;
    }
    setSuccTotal((prev) => prev + succAdd);
    setCounts(newCounts);
    setLastResults(last);
  }, [n, p, counts]);

  // 자동 모드 — 110ms마다 1세트
  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => roll(1), 110);
    return () => window.clearInterval(id);
  }, [auto, roll]);

  function reset() {
    setAuto(false);
    setSets(0);
    setSuccTotal(0);
    setCounts(new Array(n + 1).fill(0));
    setLastResults([]);
  }

  const totalTrials = sets * n;
  const empirical = totalTrials > 0 ? succTotal / totalTrials : 0;

  return (
    <div className="space-y-3">
      <InfoBox tone="cyan">
        동전/주사위를 <b>n번 독립적으로</b> 던지는 시행을 반복합니다.
        <br />
        &lsquo;성공 횟수&rsquo;의 분포가 이론값인 <b className="text-cyan-300">이항분포 B(n, p)</b>에 점점 수렴하는 것을 확인하세요!
      </InfoBox>

      {/* 컨트롤 */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <label htmlFor="mc-mode" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">실험 종류</label>
          <select
            id="mc-mode"
            value={mode}
            onChange={(e) => changeMode(e.target.value as SimMode)}
            className="mt-1 w-full rounded-md border border-white/15 bg-slate-950 px-2 py-1 text-sm text-white outline-none focus:border-cyan-300"
          >
            <option value="coin" className="bg-slate-950">🪙 동전 던지기 (p = 1/2)</option>
            <option value="dice" className="bg-slate-950">🎲 주사위 특정 눈 (p = 1/6)</option>
            <option value="custom" className="bg-slate-950">⚙️ 확률 직접 설정</option>
          </select>
        </div>
        <Slider id="mc-n" label="1세트 시행 수 n" valueText={String(n)} min={1} max={30} value={n} onChange={changeN} />
        {mode === "custom" ? (
          <Slider id="mc-p" label="성공 확률 p" valueText={(customP / 100).toFixed(2)} min={1} max={99} value={customP} onChange={changeCustomP} />
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-center text-xs text-slate-400">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">현재 p</span>
            <span className="mt-2 inline-block rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-1 font-mono text-lg font-bold text-white">{p.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* 시행 결과 시각화 */}
      <div className="flex min-h-[78px] flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-black/30 p-3">
        {lastResults.length === 0 ? (
          <span className="text-xs text-slate-600">버튼을 눌러 시행을 시작해 보세요!</span>
        ) : lastResults.map((ok, i) => {
          const lbl = mode === "coin" ? (ok ? "앞" : "뒤") : ok ? "★" : "×";
          return (
            <span
              key={i}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold animate-[mcPopIn_0.3s_cubic-bezier(0.25,1.5,0.5,1)] ${
                ok ? "border-cyan-400 bg-cyan-400/25 text-cyan-300" : "border-slate-500 bg-slate-500/15 text-slate-500"
              }`}
            >
              {lbl}
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <RollBtn label="1세트" tone="blue" onClick={() => roll(1)} />
        <RollBtn label="100세트" tone="green" onClick={() => roll(100)} />
        <RollBtn label="1000세트" tone="amber" onClick={() => roll(1000)} />
        <button
          type="button"
          onClick={() => setAuto((a) => !a)}
          className={`rounded-lg px-4 py-1.5 text-xs font-bold text-white transition ${
            auto ? "bg-red-500 hover:brightness-110" : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110"
          }`}
        >
          {auto ? "⏹ 정지" : "▶ 자동"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
        >
          ↺ 초기화
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiBox value={sets.toLocaleString()} label="총 세트 수" tone="cyan" />
        <KpiBox value={succTotal.toLocaleString()} label="총 성공 횟수" tone="cyan" />
        <KpiBox value={totalTrials > 0 ? empirical.toFixed(4) : "—"} label="경험적 확률" tone="amber" />
        <KpiBox value={p.toFixed(4)} label="이론 확률 p" tone="emerald" />
      </div>

      <p className="text-[11px] text-slate-500">
        📈 성공 횟수 분포 — <span className="text-indigo-400">■</span> 시뮬레이션 &nbsp;
        <span className="text-emerald-400">──</span> 이론 이항분포 B(n, p)
      </p>
      <HistogramSVG n={n} p={p} counts={counts} />
    </div>
  );
}

function Slider({
  id, label, valueText, min, max, step = 1, value, onChange,
}: {
  id: string; label: string; valueText: string;
  min: number; max: number; step?: number; value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <label htmlFor={id} className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <span>{label}</span>
        <span className="rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 px-2 py-0.5 font-mono text-sm font-bold text-white">{valueText}</span>
      </label>
      <input
        id={id}
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-2 w-full accent-indigo-400"
      />
    </div>
  );
}

function RollBtn({ label, tone, onClick }: { label: string; tone: "blue" | "green" | "amber"; onClick: () => void }) {
  const cls = tone === "blue" ? "from-indigo-500 to-indigo-700"
    : tone === "green" ? "from-emerald-500 to-emerald-700"
    : "from-amber-500 to-amber-700";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg bg-gradient-to-r ${cls} px-4 py-1.5 text-xs font-bold text-white transition hover:brightness-110`}
    >
      {label}
    </button>
  );
}

function KpiBox({ value, label, tone }: { value: string; label: string; tone: "cyan" | "amber" | "emerald" }) {
  const valTone = tone === "amber" ? "text-amber-300" : tone === "emerald" ? "text-emerald-300" : "text-cyan-300";
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-2.5 text-center">
      <div className={`text-xl font-black tabular-nums ${valTone}`}>{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

function InfoBox({ children, tone = "cyan" }: { children: React.ReactNode; tone?: "cyan" | "emerald" }) {
  const cls = tone === "emerald" ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-cyan-400/25 bg-cyan-400/[0.06]";
  return (
    <div className={`rounded-lg border p-3 text-xs leading-7 text-slate-300 ${cls}`}>{children}</div>
  );
}

// ── 히스토그램 (SVG) ──

function HistogramSVG({ n, p, counts }: { n: number; p: number; counts: number[] }) {
  const W = 640, H = 220, PL = 44, PR = 14, PT = 14, PB = 32;
  const gW = W - PL - PR;
  const gH = H - PT - PB;

  const theo = useMemo(() => Array.from({ length: n + 1 }, (_, k) => binomPMF(n, p, k)), [n, p]);
  const totalSets = counts.reduce((a, b) => a + b, 0);
  const emp = useMemo(() => counts.map((c) => (totalSets > 0 ? c / totalSets : 0)), [counts, totalSets]);
  const yMax = Math.max(...theo, ...emp, 0.02) * 1.22;
  const gap = gW / (n + 1);
  const bw = Math.max(3, Math.min(38, gap * 0.6));

  const uid = useId().replace(/[:]/g, "");
  const gid = `mc-hist-${uid}`;

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/25">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(99,102,241,0.9)" />
            <stop offset="100%" stopColor="rgba(67,56,202,0.4)" />
          </linearGradient>
        </defs>
        {/* Grid + Y 라벨 */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = PT + gH - (gH * i) / 4;
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.06)" />
              <text x={PL - 4} y={y + 4} fontSize={10} textAnchor="end" fill="#475569">{((yMax * i) / 4).toFixed(2)}</text>
            </g>
          );
        })}
        {/* 시뮬 막대 */}
        {Array.from({ length: n + 1 }, (_, k) => {
          const xBar = PL + k * gap + (gap - bw) / 2;
          const h = gH * (emp[k] / yMax);
          const yBar = PT + gH - h;
          return (
            <g key={k}>
              {h > 0.5 ? <rect x={xBar} y={yBar} width={bw} height={h} fill={`url(#${gid})`} /> : null}
              <text x={xBar + bw / 2} y={H - 16} fontSize={n > 20 ? 8 : 10} textAnchor="middle" fill="#475569">{k}</text>
            </g>
          );
        })}
        {/* 이론값 선 + 점 */}
        <path
          d={Array.from({ length: n + 1 }, (_, k) => {
            const x = PL + k * gap + gap / 2;
            const y = PT + gH - gH * (theo[k] / yMax);
            return `${k === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
          }).join(" ")}
          fill="none" stroke="#34d399" strokeWidth={2.5} strokeDasharray="4 3"
        />
        {Array.from({ length: n + 1 }, (_, k) => {
          const x = PL + k * gap + gap / 2;
          const y = PT + gH - gH * (theo[k] / yMax);
          return <circle key={k} cx={x} cy={y} r={3.5} fill="#34d399" />;
        })}
        {/* X 축 라벨 */}
        <text x={W / 2} y={H - 2} fontSize={10} textAnchor="middle" fill="#475569">성공 횟수 k</text>
      </svg>
    </div>
  );
}

// ============================================================
// 탭 1 — 🔵 π 추정 실험
// ============================================================

const PI_MAX = 10000;
const PI_SIZE = 270;

type PiPoint = { x: number; y: number; inside: boolean };

function PiTab() {
  const [points, setPoints] = useState<PiPoint[]>([]);
  const [history, setHistory] = useState<{ n: number; est: number }[]>([]);
  const [auto, setAuto] = useState(false);

  const total = points.length;
  const inside = useMemo(() => points.reduce((c, pt) => c + (pt.inside ? 1 : 0), 0), [points]);
  const est = total > 0 ? (4 * inside) / total : 0;
  const err = total > 0 ? Math.abs(est - Math.PI) : 0;

  const addPoints = useCallback((cnt: number) => {
    setPoints((prev) => {
      const remain = PI_MAX - prev.length;
      const add = Math.min(cnt, remain);
      if (add <= 0) return prev;
      const sz = PI_SIZE;
      const cx = sz / 2, cy = sz / 2, r = sz / 2 - 1;
      const news: PiPoint[] = [];
      for (let i = 0; i < add; i++) {
        const x = Math.random() * sz;
        const y = Math.random() * sz;
        const ok = (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
        news.push({ x, y, inside: ok });
      }
      const merged = [...prev, ...news];
      const totalNow = merged.length;
      const insideNow = merged.reduce((c, pt) => c + (pt.inside ? 1 : 0), 0);
      setHistory((h) => {
        const last = h[h.length - 1];
        if (!last || totalNow - last.n >= 50 || totalNow >= PI_MAX) {
          return [...h, { n: totalNow, est: (4 * insideNow) / totalNow }];
        }
        return h;
      });
      // PI_MAX 도달 시 자동 정지 (useEffect 안에서 setState 회피)
      if (totalNow >= PI_MAX) setAuto(false);
      return merged;
    });
  }, []);

  // 자동 — 60ms마다 50점 추가 (PI_MAX 도달은 addPoints 내부에서 처리)
  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => addPoints(50), 60);
    return () => window.clearInterval(id);
  }, [auto, addPoints]);

  function reset() {
    setAuto(false);
    setPoints([]);
    setHistory([]);
  }

  return (
    <div className="space-y-3">
      <InfoBox tone="cyan">
        한 변의 길이가 2인 정사각형 안에 점을 <b>무작위(독립적으로)</b> 던집니다.
        <br />
        반지름 1인 원 안에 들어올 확률은 <b className="text-cyan-300">π/4</b>이므로,
        <br />
        <b className="text-cyan-300">π ≈ 4 × (원 안 점 수) / (전체 점 수)</b> 로 추정할 수 있습니다.
      </InfoBox>

      <div className="grid gap-3 lg:grid-cols-[270px_1fr]">
        {/* 정사각형 + 원 SVG */}
        <div className="mx-auto w-full max-w-[270px]">
          <PiCanvasSVG points={points} />
        </div>

        {/* 우측 패널 */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <KpiBox value={total.toLocaleString()} label="총 점" tone="cyan" />
            <KpiBox value={inside.toLocaleString()} label="원 안 ●" tone="cyan" />
            <KpiBox value={(total - inside).toLocaleString()} label="원 밖 ●" tone="amber" />
          </div>
          <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-4 text-center">
            <div className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text font-mono text-4xl font-black text-transparent">
              {total > 0 ? est.toFixed(4) : "—"}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">실제 π = 3.14159…</div>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-slate-500">추정 오차 :</span>
            <span className="font-bold text-amber-300">{total > 0 ? `±${err.toFixed(4)}` : "—"}</span>
          </div>
          <PiProgressBar pct={Math.round((total / PI_MAX) * 100)} />
          <p className="text-center text-[11px] text-slate-500">{total.toLocaleString()} / {PI_MAX.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <RollBtn label="+10점" tone="blue" onClick={() => addPoints(10)} />
        <RollBtn label="+100점" tone="green" onClick={() => addPoints(100)} />
        <RollBtn label="+1000점" tone="amber" onClick={() => addPoints(1000)} />
        <button
          type="button"
          onClick={() => setAuto((a) => !a)}
          disabled={total >= PI_MAX}
          className={`rounded-lg px-4 py-1.5 text-xs font-bold text-white transition disabled:opacity-40 ${
            auto ? "bg-red-500 hover:brightness-110" : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110"
          }`}
        >
          {auto ? "⏹ 정지" : "▶ 자동"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
        >
          ↺ 초기화
        </button>
      </div>

      <p className="text-[11px] text-slate-500">
        📈 점 수에 따른 π 추정값 수렴 — <span className="text-amber-400">──</span> 추정값 &nbsp;
        <span className="text-cyan-400">- -</span> 실제 π
      </p>
      <PiConvergenceSVG history={history} />
    </div>
  );
}

function PiCanvasSVG({ points }: { points: PiPoint[] }) {
  const sz = PI_SIZE;
  return (
    <svg viewBox={`0 0 ${sz} ${sz}`} className="block w-full rounded-2xl border border-white/10" aria-hidden="true">
      <defs>
        <radialGradient id="piBg" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stopColor="#0b1e3a" />
          <stop offset="100%" stopColor="#060d1f" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={sz} height={sz} fill="url(#piBg)" />
      <rect x={1} y={1} width={sz - 2} height={sz - 2} fill="none" stroke="rgba(99,102,241,0.35)" strokeWidth={1.5} />
      <circle cx={sz / 2} cy={sz / 2} r={sz / 2 - 1} fill="rgba(6,182,212,0.04)" stroke="rgba(6,182,212,0.5)" strokeWidth={1.8} />
      <text x={sz / 2} y={sz - 7} fontSize={11} textAnchor="middle" fill="rgba(6,182,212,0.35)">r = 1</text>
      <text x={5} y={14} fontSize={11} textAnchor="start" fill="rgba(99,102,241,0.3)">2×2 정사각형</text>
      {/* 점 — 최대 10000개, 작은 원으로 */}
      {points.map((pt, i) => (
        <circle
          key={i}
          cx={pt.x}
          cy={pt.y}
          r={1.7}
          fill={pt.inside ? "rgba(34,211,238,0.72)" : "rgba(248,113,113,0.6)"}
        />
      ))}
    </svg>
  );
}

function PiProgressBar({ pct }: { pct: number }) {
  const uid = useId().replace(/[:]/g, "");
  const gid = `pi-prog-${uid}`;
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="block h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={Math.min(100, pct)} height={8} fill={`url(#${gid})`} className="transition-all duration-300" />
      </svg>
    </div>
  );
}

function PiConvergenceSVG({ history }: { history: { n: number; est: number }[] }) {
  const W = 640, H = 200, PL = 50, PR = 18, PT = 18, PB = 26;
  const gW = W - PL - PR, gH = H - PT - PB;
  const yMin = Math.PI - 1.3, yMax = Math.PI + 1.3;
  const piY = PT + gH * (yMax - Math.PI) / (yMax - yMin);

  if (history.length < 2) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/25 p-8 text-center text-xs text-slate-500">
        점을 추가하면 수렴 그래프가 표시됩니다
      </div>
    );
  }

  const path = history.map((pt, i) => {
    const x = PL + gW * (pt.n / PI_MAX);
    const yv = Math.max(yMin, Math.min(yMax, pt.est));
    const y = PT + gH * (yMax - yv) / (yMax - yMin);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/25">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden="true">
        {/* Grid + Y 라벨 */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = PT + (gH * i) / 4;
          const v = yMax - (yMax - yMin) * i / 4;
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.05)" />
              <text x={PL - 4} y={y + 4} fontSize={10} textAnchor="end" fill="#475569">{v.toFixed(2)}</text>
            </g>
          );
        })}
        {/* π 기준선 */}
        <line x1={PL} y1={piY} x2={W - PR} y2={piY} stroke="rgba(34,211,238,0.45)" strokeWidth={1.5} strokeDasharray="5 4" />
        <text x={PL + 4} y={piY - 4} fontSize={10} fontWeight={700} fill="#22d3ee">π = 3.14159</text>
        {/* 추정값 곡선 */}
        <path d={path} fill="none" stroke="#f59e0b" strokeWidth={2} />
        {/* X 축 눈금 */}
        {[0, 2500, 5000, 7500, 10000].map((t) => {
          const x = PL + gW * (t / PI_MAX);
          return (
            <text key={t} x={x} y={H - 6} fontSize={10} textAnchor="middle" fill="#475569">
              {t.toLocaleString()}
            </text>
          );
        })}
        <text x={W / 2} y={H - 1} fontSize={10} textAnchor="middle" fill="#475569">점 수</text>
      </svg>
    </div>
  );
}

// ============================================================
// 탭 2 — 📊 이항분포 계산기
// ============================================================

function BinomTab() {
  const [n, setN] = useState(10);
  const [pPct, setPPct] = useState(50);
  const [r, setR] = useState(5);

  const p = pPct / 100;
  const safeR = Math.min(r, n);

  const prob = binomPMF(n, p, safeR);
  const q = 1 - p;
  const c = comb(n, safeR);
  const E = n * p;
  const sigma = Math.sqrt(n * p * q);

  const pmf = useMemo(() => Array.from({ length: n + 1 }, (_, k) => binomPMF(n, p, k)), [n, p]);

  return (
    <div className="space-y-3">
      <InfoBox tone="cyan">
        n번의 독립시행에서 성공 확률이 p일 때,
        <br />
        정확히 r번 성공할 확률 : <b className="text-cyan-300">P(X = r) = C(n,r) × p<sup>r</sup> × (1 − p)<sup>n−r</sup></b>
      </InfoBox>

      <div className="grid gap-3 sm:grid-cols-3">
        <Slider id="b-n" label="시행 횟수 n" valueText={String(n)} min={1} max={30} value={n} onChange={(v) => { setN(v); if (r > v) setR(v); }} />
        <Slider id="b-p" label="성공 확률 p" valueText={p.toFixed(2)} min={1} max={99} value={pPct} onChange={setPPct} />
        <Slider id="b-r" label="성공 횟수 r" valueText={String(safeR)} min={0} max={n} value={safeR} onChange={setR} />
      </div>

      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.07] p-4 text-center">
        <p className="font-mono text-sm font-bold leading-7 text-emerald-300">
          P(X = {safeR}) = C({n},{safeR}) × {p.toFixed(2)}<sup>{safeR}</sup> × {q.toFixed(2)}<sup>{n - safeR}</sup>
        </p>
        <p className="mt-1 text-2xl font-black text-emerald-200">{prob > 0 ? prob.toFixed(6) : "≈ 0"}</p>
        <p className="mt-1 text-xs text-emerald-300/80">
          C({n},{safeR}) = {c} · 기댓값 E(X) = {E.toFixed(2)} · 표준편차 σ = {sigma.toFixed(3)}
        </p>
      </div>

      <p className="text-[11px] text-slate-500">
        📊 이항분포 B(n, p) 전체 분포 — 막대 클릭으로 r 변경 &nbsp; <span className="text-amber-300">■</span> 선택된 r
      </p>
      <BinomChartSVG pmf={pmf} n={n} highlight={safeR} onPick={setR} />

      <p className="text-[11px] text-slate-500">각 k에서의 확률 (클릭하면 r로 선택) :</p>
      <div className="flex flex-wrap gap-1.5">
        {pmf.map((v, k) => {
          const show = v >= 0.0005 || k === safeR;
          if (!show) return null;
          const isHl = k === safeR;
          const cls = isHl
            ? "border-amber-400 bg-amber-400/20 text-amber-200"
            : "border-indigo-400/30 bg-indigo-400/12 text-indigo-200 hover:bg-indigo-400/25";
          return (
            <button
              key={k}
              type="button"
              onClick={() => setR(k)}
              className={`rounded-md border px-2 py-1 font-mono text-[11px] transition ${cls}`}
            >
              k={k} : {v.toFixed(4)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BinomChartSVG({ pmf, n, highlight, onPick }: { pmf: number[]; n: number; highlight: number; onPick: (k: number) => void }) {
  const W = 640, H = 240, PL = 44, PR = 14, PT = 16, PB = 32;
  const gW = W - PL - PR, gH = H - PT - PB;
  const yMax = Math.max(...pmf) * 1.22;
  const gap = gW / (n + 1);
  const bw = Math.max(3, Math.min(38, gap * 0.65));

  const uid = useId().replace(/[:]/g, "");
  const gradHl = `b-hl-${uid}`;
  const gradNormal = `b-n-${uid}`;

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/25">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden="true">
        <defs>
          <linearGradient id={gradHl} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="rgba(245,158,11,0.4)" />
          </linearGradient>
          <linearGradient id={gradNormal} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(99,102,241,0.85)" />
            <stop offset="100%" stopColor="rgba(67,56,202,0.4)" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = PT + gH - (gH * i) / 4;
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.06)" />
              <text x={PL - 4} y={y + 4} fontSize={10} textAnchor="end" fill="#475569">{((yMax * i) / 4).toFixed(2)}</text>
            </g>
          );
        })}
        {/* Bars */}
        {Array.from({ length: n + 1 }, (_, k) => {
          const x = PL + k * gap + (gap - bw) / 2;
          const h = gH * (pmf[k] / yMax);
          const y = PT + gH - h;
          const isHl = k === highlight;
          return (
            <g key={k} onClick={() => onPick(k)} className="cursor-pointer" role="button">
              {/* Click target — 막대 위 전체 영역 */}
              <rect x={PL + k * gap} y={PT} width={gap} height={gH} fill="transparent" />
              {h > 0.5 ? <rect x={x} y={y} width={bw} height={h} fill={`url(#${isHl ? gradHl : gradNormal})`} /> : null}
              <text x={x + bw / 2} y={H - 16} fontSize={n > 22 ? 8 : 10} textAnchor="middle" fill={isHl ? "#fbbf24" : "#475569"}>{k}</text>
            </g>
          );
        })}
        <text x={W / 2} y={H - 2} fontSize={10} textAnchor="middle" fill="#475569">성공 횟수 k</text>
      </svg>
    </div>
  );
}

// ============================================================
// 메인
// ============================================================

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "convergence_lln",
    kind: "text",
    prompt: "탭 1 시뮬레이터에서 세트 수를 늘릴수록 ‘경험적 확률’이 이론 확률 p에 가까워지는 이유를 적어 보세요. (대수의 법칙)",
    placeholder: "시행 횟수가 많아지면 상대도수가 이론 확률에 수렴한다는 ...",
  },
  {
    id: "pi_geometric",
    kind: "text",
    prompt: "몬테카를로 방법으로 π를 추정할 때, 왜 ‘원 안 점 수 / 전체 점 수’ 가 π/4가 되는지 기하학적으로 설명해 보세요.",
    placeholder: "정사각형 넓이는 4, 원 넓이는 π · 1² = π 이므로 ...",
  },
  {
    id: "binom_independence",
    kind: "text",
    prompt: "탭 2에서 자동으로 그려지는 이론 이항분포 B(n, p)와 시뮬레이션 막대가 점점 일치하는 것을 관찰했나요? 이는 각 시행이 ‘독립’이라는 가정 덕분입니다. 그 이유를 설명해 보세요.",
    placeholder: "각 시행 결과가 서로 영향을 주지 않으므로 ...",
  },
  {
    id: "real_world_mc",
    kind: "text",
    prompt: "몬테카를로 방법이 실생활에서 활용될 수 있는 사례를 떠올려 보세요. (예 : 금융 시뮬, 신뢰 구간 추정, AI 학습, …)",
    placeholder: "복잡한 적분을 직접 계산하기 어려울 때 무작위 표본으로 근사할 수 있고 ...",
  },
];

type TabKey = "sim" | "pi" | "binom";

export default function MonteCarloSim() {
  const [tab, setTab] = useState<TabKey>("sim");
  const tabBtn = (active: boolean, color: string) =>
    active
      ? `rounded-lg ${color} px-3 py-2 text-sm font-bold text-slate-950`
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <style>{`
        @keyframes mcPopIn {from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1}}
      `}</style>

      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 사건의 독립과 종속</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 몬테카를로 시뮬레이션</h3>
        <p className="mt-2 leading-7 text-slate-300">
          무작위 실험을 수없이 반복해 확률을 추정하는 방법 — <b className="text-amber-200">독립시행</b>의 세계를 직접 체험합니다.
          이항분포 수렴, π 추정, 분포 계산까지.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "sim", "bg-indigo-300")} onClick={() => setTab("sim")}>🪙 동전·주사위 시뮬</button>
        <button type="button" className={tabBtn(tab === "pi", "bg-cyan-300")} onClick={() => setTab("pi")}>🔵 π 추정 실험</button>
        <button type="button" className={tabBtn(tab === "binom", "bg-amber-300")} onClick={() => setTab("binom")}>📊 이항분포 계산기</button>
      </div>

      <div className="mt-5">
        {tab === "sim" ? <CoinDiceTab />
          : tab === "pi" ? <PiTab />
          : <BinomTab />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
