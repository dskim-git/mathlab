"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

const rand1to6 = () => 1 + Math.floor(Math.random() * 6);
function waysToSum(s: number): number {
  if (s < 2 || s > 12) return 0;
  return s <= 7 ? s - 1 : 13 - s;
}

// ── 주사위 면(SVG, pips) ──
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
function DieFace({ face, className }: { face: number; className?: string }) {
  const o = 26;
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <rect x="6" y="6" width="88" height="88" rx="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
      {(PIPS[face] ?? []).map(([dx, dy], i) => (
        <circle key={i} cx={50 + dx * o} cy={50 + dy * o} r="9" fill="#1e293b" />
      ))}
    </svg>
  );
}

// ── 히스토그램(canvas) ──
function Histogram({ labels, counts, theory }: { labels: number[]; counts: number[]; theory: number[] | null }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cvsRef = useRef<HTMLCanvasElement | null>(null);
  const [w, setW] = useState(420);
  useEffect(() => {
    const m = () => { if (wrapRef.current) setW(wrapRef.current.clientWidth); };
    m(); window.addEventListener("resize", m);
    return () => window.removeEventListener("resize", m);
  }, []);
  useEffect(() => {
    const cvs = cvsRef.current; const ctx = cvs?.getContext("2d");
    if (!cvs || !ctx) return;
    const H = 240; cvs.width = w; cvs.height = H;
    ctx.fillStyle = "#0d1117"; ctx.fillRect(0, 0, w, H);
    const left = 38, right = 12, top = 14, bottom = 30;
    const iW = w - left - right, iH = H - top - bottom;
    const maxVal = Math.max(1, ...counts, ...(theory ?? [0]));
    const yMax = maxVal * 1.15;

    ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.fillStyle = "#64748b"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const y = top + iH - iH * (i / 4);
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(w - right, y); ctx.stroke();
      ctx.fillText(String(Math.round(yMax * (i / 4))), left - 4, y + 3.5);
    }

    const n = labels.length, gap = 6;
    const barW = (iW - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      const h = iH * (counts[i] / yMax);
      const x = left + i * (barW + gap), y = top + iH - h;
      ctx.fillStyle = "#60a5fa"; ctx.fillRect(x, y, barW, h);
      ctx.fillStyle = "#cbd5e1"; ctx.textAlign = "center"; ctx.font = "10px sans-serif";
      ctx.fillText(String(labels[i]), x + barW / 2, H - 14);
    }
    if (theory) {
      ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const y = top + iH - iH * (theory[i] / yMax);
        const x = left + i * (barW + gap) + barW / 2;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = "#f87171"; ctx.textAlign = "right"; ctx.font = "bold 10px sans-serif";
      ctx.fillText("이론 기대도수", w - right, top + 2);
    }
  }, [labels, counts, theory, w]);
  return <div ref={wrapRef}><canvas ref={cvsRef} className="block h-[240px] w-full rounded-lg border border-white/8" /></div>;
}

type Mode = "one" | "two";
const ONE_EVENTS = [
  { value: "odd", label: "홀수 (1,3,5)" },
  { value: "prime", label: "소수 (2,3,5)" },
  { value: "eq6", label: "6" },
  { value: "ge4", label: "4 이상 (4,5,6)" },
  { value: "custom", label: "사용자 정의(체크)" },
];
const TWO_EVENTS = [
  { value: "sum7", label: "합 = 7" },
  { value: "sumX", label: "합 = X" },
  { value: "sumGE", label: "합 ≥ X" },
  { value: "doubles", label: "더블(같은 눈)" },
  { value: "atleast6", label: "최소 하나 6" },
];

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "emp_vs_theory",
    prompt: "경험확률과 이론확률을 비교해 보고, 시행 횟수를 늘릴 때 둘의 관계가 어떻게 변하는지(대수의 법칙)를 설명해 보세요.",
    kind: "text",
  },
  {
    id: "sum_distribution",
    prompt: "주사위 2개의 합 분포(2~12)에서 합이 7일 때 가장 많이 나오는 이유를, 경우의 수(합을 만드는 방법의 수)로 설명해 보세요.",
    kind: "text",
  },
];

export default function DiceLab() {
  const [mode, setMode] = useState<Mode>("one");
  const [event, setEvent] = useState("odd");
  const [customFaces, setCustomFaces] = useState<Set<number>>(new Set());
  const [x, setX] = useState(9);
  const [speed, setSpeed] = useState(40);
  const [bulk, setBulk] = useState(100);

  const [total, setTotal] = useState(0);
  const [hits, setHits] = useState(0);
  const [counts1, setCounts1] = useState<number[]>(() => Array(6).fill(0));
  const [counts2, setCounts2] = useState<number[]>(() => Array(13).fill(0));
  const [d1, setD1] = useState(1);
  const [d2, setD2] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [auto, setAuto] = useState(false);

  const rollingRef = useRef(false);
  const autoRef = useRef(false);
  const flickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 콜백에서 최신 값 읽기
  const cfgRef = useRef({ mode, event, x, speed, customFaces });
  useEffect(() => { cfgRef.current = { mode, event, x, speed, customFaces }; }, [mode, event, x, speed, customFaces]);

  useEffect(() => () => {
    if (flickRef.current) clearInterval(flickRef.current);
    if (doneRef.current) clearTimeout(doneRef.current);
    if (nextRef.current) clearTimeout(nextRef.current);
  }, []);

  function eventHit(vals: number[], ev: string, faces: Set<number>, xv: number): boolean {
    if (cfgRef.current.mode === "one") {
      const d = vals[0];
      if (ev === "odd") return d % 2 === 1;
      if (ev === "prime") return d === 2 || d === 3 || d === 5;
      if (ev === "eq6") return d === 6;
      if (ev === "ge4") return d >= 4;
      if (ev === "custom") return faces.has(d);
      return false;
    }
    const a = vals[0], b = vals[1], s = vals[2];
    if (ev === "sum7") return s === 7;
    if (ev === "doubles") return a === b;
    if (ev === "atleast6") return a === 6 || b === 6;
    if (ev === "sumX") return s === xv;
    if (ev === "sumGE") return s >= xv;
    return false;
  }

  function theoreticalP(): number {
    if (mode === "one") {
      if (event === "odd" || event === "prime" || event === "ge4") return 3 / 6;
      if (event === "eq6") return 1 / 6;
      if (event === "custom") return customFaces.size / 6;
      return 0;
    }
    if (event === "sum7" || event === "doubles") return 6 / 36;
    if (event === "atleast6") return 11 / 36;
    if (event === "sumX") return waysToSum(x) / 36;
    if (event === "sumGE") { let c = 0; for (let s = Math.max(2, x); s <= 12; s++) c += waysToSum(s); return c / 36; }
    return 0;
  }

  // 한 번 결과 집계(애니메이션 정착 시 + 일괄)
  function tally(vals: number[]) {
    const { event: ev, x: xv, customFaces: cf } = cfgRef.current;
    setTotal((t) => t + 1);
    if (cfgRef.current.mode === "one") setCounts1((c) => { const n = [...c]; n[vals[0] - 1]++; return n; });
    else setCounts2((c) => { const n = [...c]; n[vals[2]]++; return n; });
    if (eventHit(vals, ev, cf, xv)) setHits((h) => h + 1);
  }

  function startRoll() {
    if (rollingRef.current) return;
    rollingRef.current = true; setRolling(true);
    const m = cfgRef.current.mode;
    const dur = Math.max(150, 640 - cfgRef.current.speed * 5);
    flickRef.current = setInterval(() => { setD1(rand1to6()); if (m === "two") setD2(rand1to6()); }, 55);
    doneRef.current = setTimeout(() => {
      if (flickRef.current) clearInterval(flickRef.current);
      const a = rand1to6(); const b = m === "two" ? rand1to6() : 1;
      setD1(a); if (m === "two") setD2(b);
      tally(m === "one" ? [a] : [a, b, a + b]);
      rollingRef.current = false; setRolling(false);
      if (autoRef.current) nextRef.current = setTimeout(startRoll, 130);
    }, dur);
  }
  function toggleAuto() {
    if (autoRef.current) { autoRef.current = false; setAuto(false); if (nextRef.current) clearTimeout(nextRef.current); return; }
    autoRef.current = true; setAuto(true);
    if (!rollingRef.current) startRoll();
  }
  function rollBulk() {
    if (autoRef.current) return;
    const n = Math.max(1, Math.min(10000, bulk || 1));
    const m = cfgRef.current.mode;
    let addTotal = 0, addHits = 0;
    const c1 = [...counts1], c2 = [...counts2];
    const { event: ev, x: xv, customFaces: cf } = cfgRef.current;
    let lastA = d1, lastB = d2;
    for (let i = 0; i < n; i++) {
      if (m === "one") {
        const a = rand1to6(); c1[a - 1]++; addTotal++; lastA = a;
        if (eventHit([a], ev, cf, xv)) addHits++;
      } else {
        const a = rand1to6(), b = rand1to6(); c2[a + b]++; addTotal++; lastA = a; lastB = b;
        if (eventHit([a, b, a + b], ev, cf, xv)) addHits++;
      }
    }
    setCounts1(c1); setCounts2(c2);
    setTotal((t) => t + addTotal); setHits((h) => h + addHits);
    setD1(lastA); if (m === "two") setD2(lastB);
  }
  function reset() {
    autoRef.current = false; setAuto(false); rollingRef.current = false; setRolling(false);
    if (flickRef.current) clearInterval(flickRef.current);
    if (doneRef.current) clearTimeout(doneRef.current);
    if (nextRef.current) clearTimeout(nextRef.current);
    setTotal(0); setHits(0); setCounts1(Array(6).fill(0)); setCounts2(Array(13).fill(0));
  }
  function changeMode(m: Mode) {
    reset();
    setMode(m);
    setEvent(m === "one" ? "odd" : "sum7");
  }
  function toggleFace(f: number) {
    setCustomFaces((prev) => { const n = new Set(prev); if (n.has(f)) n.delete(f); else n.add(f); return n; });
  }

  const pEmp = total > 0 ? hits / total : 0;
  const pTh = theoreticalP();
  const labels = mode === "one" ? [1, 2, 3, 4, 5, 6] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const hcounts = mode === "one" ? labels.map((v) => counts1[v - 1]) : labels.map((s) => counts2[s]);
  const theory = total > 0 ? (mode === "one" ? labels.map(() => total / 6) : labels.map((s) => total * (waysToSum(s) / 36))) : null;

  const runBtn = "rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-45";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 확률</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 주사위 실험</h3>
        <p className="mt-2 leading-7 text-slate-300">
          주사위를 1개/2개로 굴려 <b className="text-blue-300">경험확률</b>을 모으고 <b className="text-red-300">이론확률</b>과 비교하며, 시행을 늘릴수록 가까워지는 <b>대수의 법칙</b>을 체험해 보세요.
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-900 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400">🎯 모드</span>
          <select value={mode} onChange={(e) => changeMode(e.target.value as Mode)} aria-label="모드"
            className="rounded-md border border-white/15 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40">
            <option value="one">주사위 1개</option>
            <option value="two">주사위 2개(합)</option>
          </select>
          <span className="ml-2 text-sm text-slate-400">🎛 이벤트</span>
          <select value={event} onChange={(e) => setEvent(e.target.value)} aria-label="이벤트"
            className="min-w-[150px] flex-1 rounded-md border border-white/15 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40">
            {(mode === "one" ? ONE_EVENTS : TWO_EVENTS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {event === "sumX" || event === "sumGE" ? (
            <span className="flex items-center gap-1.5">
              <span className="text-sm text-slate-400">X</span>
              <input type="number" min={2} max={12} value={x} onChange={(e) => setX(Number(e.target.value))} aria-label="X 값"
                className="w-16 rounded-md border border-white/15 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40" />
            </span>
          ) : null}
        </div>

        {event === "custom" ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-400">포함 눈:</span>
            {[1, 2, 3, 4, 5, 6].map((f) => (
              <label key={f} className="flex cursor-pointer items-center gap-1 text-sm text-slate-300">
                <input type="checkbox" checked={customFaces.has(f)} onChange={() => toggleFace(f)} className="accent-cyan-400" />{f}
              </label>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-400">속도</span>
          <input type="range" min={1} max={100} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-28 accent-blue-400" aria-label="속도" />
          <span className="text-xs text-slate-500">느림 ← → 빠름</span>
          <span className="ml-2 text-sm text-slate-400">한 번에</span>
          <input type="number" min={1} max={10000} value={bulk} onChange={(e) => setBulk(Number(e.target.value))} aria-label="일괄 횟수"
            className="w-20 rounded-md border border-white/15 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40" />
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={runBtn} onClick={startRoll} disabled={rolling || auto}>🎲 한 번 굴리기</button>
          <button type="button" onClick={toggleAuto} className={`rounded-lg px-3.5 py-2 text-sm font-bold text-white transition hover:brightness-110 ${auto ? "bg-red-500" : "bg-emerald-600"}`}>{auto ? "⏹ 자동 정지" : "▶ 자동 시작"}</button>
          <button type="button" className="rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-45" onClick={rollBulk} disabled={auto}>한 번에 {bulk}회</button>
          <button type="button" className="rounded-lg border border-red-400/30 bg-red-400/10 px-3.5 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/20" onClick={reset}>초기화</button>
        </div>
      </div>

      {/* 통계 */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat val={total.toLocaleString()} lbl="총 시행" tone="text-slate-100" />
        <Stat val={hits.toLocaleString()} lbl="이벤트 적중" tone="text-blue-300" />
        <Stat val={total > 0 ? pEmp.toFixed(4) : "—"} lbl="경험확률" tone="text-emerald-300" />
        <Stat val={pTh > 0 ? pTh.toFixed(4) : "—"} lbl="이론확률" tone="text-red-300" />
      </div>

      {/* 주사위 애니메이션 + 히스토그램 */}
      <div className="mt-3 grid gap-3 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-slate-900 p-4">
          <p className="text-sm font-bold text-blue-300">🎲 주사위</p>
          <div className="mt-2 flex h-[120px] items-center justify-center gap-3 [perspective:600px]">
            <div className={`h-24 w-24 ${rolling ? "animate-[diceTumble_0.5s_linear_infinite]" : ""}`}><DieFace face={d1} className="h-full w-full" /></div>
            {mode === "two" ? <div className={`h-24 w-24 ${rolling ? "animate-[diceTumble_0.5s_linear_infinite]" : ""}`}><DieFace face={d2} className="h-full w-full" /></div> : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">{rolling ? "굴리는 중…" : mode === "two" ? `합 ${d1 + d2}` : `눈 ${d1}`}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
          <p className="text-sm font-bold text-blue-300">📈 분포 {mode === "one" ? "(눈 1~6)" : "(합 2~12)"} <span className="text-xs font-normal text-red-300">— 빨간선=이론 기대도수</span></p>
          <div className="mt-2"><Histogram labels={labels} counts={hcounts} theory={theory} /></div>
        </div>
      </div>

      <details className="mt-3 rounded-2xl border border-white/10 bg-slate-900 p-4">
        <summary className="cursor-pointer text-sm font-bold text-cyan-300">📘 수업용 가이드 / 미션</summary>
        <div className="mt-2 space-y-2 text-sm leading-7 text-slate-300">
          <p>① <b>주사위 1개</b>: 이벤트를 홀수·소수·=6·≥4로 바꿔가며 자동 실행으로 경험확률이 이론값에 가까워지는지 확인</p>
          <p>② <b>주사위 2개(합)</b>: 합=7·합=X·합≥X·더블·최소 하나 6 등으로 비교</p>
          <p>③ <b>사용자 정의(1개)</b>: 포함할 눈을 직접 체크하여 임의 사건의 이론값(선택면/6)과 경험값 비교</p>
          <p className="text-slate-400">팁: ‘한 번에 N회’로 대량 집계를 빠르게, ‘자동 시작’으로 애니메이션 체험. 히스토그램 빨간 선 = 이론 기대도수(시행 수 × 이론확률).</p>
        </div>
      </details>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function Stat({ val, lbl, tone }: { val: number | string; lbl: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/9 bg-white/[0.04] p-2.5 text-center">
      <div className={`text-xl font-black tabular-nums ${tone}`}>{val}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{lbl}</div>
    </div>
  );
}
