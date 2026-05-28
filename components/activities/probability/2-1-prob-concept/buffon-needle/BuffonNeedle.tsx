"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

const D = 65; // 평행선 간격(px)
type Shape = "straight" | "v" | "w";
type Seg = { x1: number; y1: number; x2: number; y2: number };
type Drop = { segs: Seg[]; hit: boolean; cross: number };

const SHAPE_INFO: Record<Shape, { slider: string; fTitle: string; fMain: string; fSub: string }> = {
  straight: { slider: "바늘 길이 L", fTitle: "📐 직선 바늘 공식 (L ≤ d)", fMain: "P(교차) = 2L / (π·d)", fSub: "→ π ≈ 2·L·n / (교차 횟수·d)" },
  v: { slider: "팔 길이 (각 arm)", fTitle: "📐 V자형 – 뷔퐁의 국수 정리", fMain: "E(교차) = 2·(2·arm) / (π·d)", fSub: "→ π ≈ 2·(2·arm)·n / (교차 횟수·d)" },
  w: { slider: "마디 길이 (각 seg)", fTitle: "📐 W자형 – 뷔퐁의 국수 정리", fMain: "E(교차) = 2·(4·seg) / (π·d)", fSub: "→ π ≈ 2·(4·seg)·n / (교차 횟수·d)" },
};
const arcLenOf = (shape: Shape, size: number) => (shape === "straight" ? size : shape === "v" ? 2 * size : 4 * size);

function segCross(y1: number, y2: number): number {
  const mn = Math.min(y1, y2), mx = Math.max(y1, y2);
  if (mn === mx) return 0;
  const kmin = Math.ceil(mn / D + 1e-9), kmax = Math.floor(mx / D - 1e-9);
  return Math.max(0, kmax - kmin + 1);
}
function makeOneDrop(shape: Shape, size: number, W: number, H: number): Drop {
  const cx = Math.random() * W, cy = Math.random() * H, theta = Math.random() * Math.PI;
  const C = Math.cos(theta), S = Math.sin(theta);
  const rot = (lx: number, ly: number) => ({ x: cx + lx * C - ly * S, y: cy + lx * S + ly * C });
  const segs: Seg[] = []; let cross = 0;
  if (shape === "straight") {
    const p1 = rot(-size / 2, 0), p2 = rot(size / 2, 0);
    segs.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }); cross = segCross(p1.y, p2.y);
  } else if (shape === "v") {
    const ha = Math.PI / 6;
    const a1 = rot(size * Math.cos(ha), -size * Math.sin(ha)), a2 = rot(-size * Math.cos(ha), -size * Math.sin(ha));
    segs.push({ x1: cx, y1: cy, x2: a1.x, y2: a1.y }, { x1: cx, y1: cy, x2: a2.x, y2: a2.y });
    cross = segCross(cy, a1.y) + segCross(cy, a2.y);
  } else {
    const seg = size, cs = Math.cos(Math.PI / 4), ss = Math.sin(Math.PI / 4);
    const lp = [
      { x: -2 * seg * cs, y: seg * ss * 0.5 }, { x: -seg * cs, y: -seg * ss * 0.5 }, { x: 0, y: seg * ss * 0.5 },
      { x: seg * cs, y: -seg * ss * 0.5 }, { x: 2 * seg * cs, y: seg * ss * 0.5 },
    ];
    const avgY = lp.reduce((a, p) => a + p.y, 0) / lp.length;
    for (let i = 0; i < 4; i++) {
      const p1 = rot(lp[i].x, lp[i].y - avgY), p2 = rot(lp[i + 1].x, lp[i + 1].y - avgY);
      segs.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }); cross += segCross(p1.y, p2.y);
    }
  }
  return { segs, hit: cross > 0, cross };
}

const SPEEDS = [{ v: 2, l: "느리게" }, { v: 8, l: "보통" }, { v: 30, l: "빠르게" }, { v: 120, l: "매우 빠르게" }];

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  { id: "formula", prompt: "교차 확률 공식 P = 2L/(π·d)가 어떻게 성립하는지, ‘원리 설명’ 탭의 적분 과정을 포함해 설명해 보세요.", kind: "text" },
  { id: "convergence", prompt: "시행 횟수를 늘릴수록 π 추정값이 어떻게 변했나요? 수렴 그래프에서 관찰한 경향을 설명해 보세요.", kind: "text" },
  { id: "noodle", prompt: "직선·V자·W자의 총 길이가 같을 때 π 추정 결과를 비교하고, ‘뷔퐁의 국수 정리’(형태가 달라도 총 길이가 같으면 같은 기댓값)의 의미를 설명해 보세요.", kind: "text" },
];

function SimTab() {
  const [shape, setShape] = useState<Shape>("straight");
  const [size, setSize] = useState(45);
  const [spd, setSpd] = useState(8);
  const [auto, setAuto] = useState(false);
  const [stats, setStats] = useState({ total: 0, crossings: 0, pi: NaN, rate: NaN, theo: 0 });

  const [w, setW] = useState(360);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const simRef = useRef<HTMLCanvasElement | null>(null);
  const grRef = useRef<HTMLCanvasElement | null>(null);

  const dropsRef = useRef<Drop[]>([]);
  const totalRef = useRef(0);
  const crossRef = useRef(0);
  const piHistRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const autoRef = useRef(false);
  const cfgRef = useRef({ shape, size, spd });
  useEffect(() => { cfgRef.current = { shape, size, spd }; }, [shape, size, spd]);

  useEffect(() => {
    const m = () => { if (wrapRef.current) setW(wrapRef.current.clientWidth); };
    m(); window.addEventListener("resize", m);
    return () => window.removeEventListener("resize", m);
  }, []);
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  function estimatePi(): number {
    if (crossRef.current === 0) return NaN;
    return (2 * arcLenOf(cfgRef.current.shape, cfgRef.current.size) * totalRef.current) / (crossRef.current * D);
  }
  function theoRate(): number {
    return (2 * arcLenOf(cfgRef.current.shape, cfgRef.current.size)) / (Math.PI * D);
  }
  function syncStats() {
    setStats({ total: totalRef.current, crossings: crossRef.current, pi: estimatePi(), rate: totalRef.current > 0 ? crossRef.current / totalRef.current : NaN, theo: theoRate() });
  }

  function dropN(n: number) {
    const cvs = simRef.current; if (!cvs) return;
    for (let i = 0; i < n; i++) {
      const d = makeOneDrop(cfgRef.current.shape, cfgRef.current.size, cvs.width, cvs.height);
      dropsRef.current.push(d);
      totalRef.current++;
      crossRef.current += d.cross; // 총 교차 수(국수 정리 기준)
      if (crossRef.current > 0) piHistRef.current.push(estimatePi());
    }
    draw(); syncStats();
  }

  function draw() {
    drawSim(); drawGraph();
  }
  function drawSim() {
    const cvs = simRef.current; const ctx = cvs?.getContext("2d"); if (!cvs || !ctx) return;
    const W = cvs.width, H = cvs.height;
    ctx.fillStyle = "#0d1b2a"; ctx.fillRect(0, 0, W, H);
    for (let y = D; y < H; y += D) {
      ctx.strokeStyle = "rgba(99,102,241,0.18)"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.strokeStyle = "rgba(203,213,225,0.6)"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.fillStyle = "rgba(100,116,139,0.7)"; ctx.font = "10px sans-serif"; ctx.textAlign = "left";
    if (D < H) ctx.fillText(`d = ${D}px`, 4, D - 4);
    const arr = dropsRef.current, n = arr.length, fadeStart = Math.max(0, n - 800);
    for (let i = fadeStart; i < n; i++) {
      const dp = arr[i], age = n - 1 - i;
      const alpha = age < 20 ? 1 : age < 150 ? 0.65 : 0.3;
      ctx.strokeStyle = dp.hit ? `rgba(248,113,113,${alpha})` : `rgba(96,165,250,${alpha})`;
      ctx.lineWidth = age < 4 ? 2.8 : 1.2;
      for (const s of dp.segs) { ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke(); }
    }
    if (totalRef.current > 0) {
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(W - 120, 6, 114, 22);
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(`n = ${totalRef.current.toLocaleString()}`, W - 8, 21); ctx.textAlign = "left";
    }
  }
  function drawGraph() {
    const cvs = grRef.current; const ctx = cvs?.getContext("2d"); if (!cvs || !ctx) return;
    const W = cvs.width, H = cvs.height, pad = { t: 24, r: 22, b: 22, l: 34 };
    const gx = pad.l, gy = pad.t, gw = W - pad.l - pad.r, gh = H - pad.t - pad.b;
    ctx.fillStyle = "#0d1b2a"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#94a3b8"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("π 수렴 그래프", W / 2, 15); ctx.textAlign = "left";
    const hist = piHistRef.current;
    if (hist.length < 2) {
      ctx.fillStyle = "#334155"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("바늘을 던지면 그래프가 나타납니다", W / 2, H / 2 + 8); ctx.textAlign = "left"; return;
    }
    const minY = 2, maxY = 5, yS = (v: number) => gy + gh - ((v - minY) / (maxY - minY)) * gh;
    ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 1;
    [2, 2.5, 3, 3.5, 4, 4.5, 5].forEach((v) => { const py = yS(v); ctx.beginPath(); ctx.moveTo(gx, py); ctx.lineTo(gx + gw, py); ctx.stroke(); });
    ctx.save(); ctx.strokeStyle = "rgba(251,191,36,.85)"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
    const piY = yS(Math.PI); ctx.beginPath(); ctx.moveTo(gx, piY); ctx.lineTo(gx + gw, piY); ctx.stroke(); ctx.restore();
    ctx.fillStyle = "#fbbf24"; ctx.font = "bold 10px sans-serif"; ctx.fillText("π", gx + gw + 3, piY + 4);
    ctx.strokeStyle = "#c084fc"; ctx.lineWidth = 1.5; ctx.beginPath();
    const step = Math.max(1, Math.floor(hist.length / (gw * 2)));
    for (let i = 0; i < hist.length; i += step) {
      const px = gx + (i / (hist.length - 1)) * gw, pv = Math.min(maxY, Math.max(minY, hist[i])), py = yS(pv);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    const last = hist[hist.length - 1];
    if (last >= minY && last <= maxY) { ctx.fillStyle = "#e879f9"; ctx.beginPath(); ctx.arc(gx + gw, yS(last), 3, 0, 2 * Math.PI); ctx.fill(); }
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
    ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif"; ctx.textAlign = "right";
    [2, 3, 4, 5].forEach((v) => ctx.fillText(String(v), gx - 3, yS(v) + 3)); ctx.textAlign = "left";
  }

  // 캔버스 크기 설정 + 재그리기
  useEffect(() => {
    const sim = simRef.current, gr = grRef.current;
    if (sim) { sim.width = w; sim.height = Math.round(w * 0.55); }
    if (gr) { gr.width = w; gr.height = 175; }
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, shape, size]);

  function toggleAuto() {
    if (autoRef.current) { autoRef.current = false; setAuto(false); if (rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    autoRef.current = true; setAuto(true);
    const loop = () => { if (!autoRef.current) return; dropN(cfgRef.current.spd); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
  }
  function reset() {
    autoRef.current = false; setAuto(false); if (rafRef.current) cancelAnimationFrame(rafRef.current);
    dropsRef.current = []; totalRef.current = 0; crossRef.current = 0; piHistRef.current = [];
    draw(); syncStats();
  }
  function changeShape(s: Shape) { setShape(s); reset(); }

  const info = SHAPE_INFO[shape];
  const shBtn = (a: boolean) => a ? "rounded-md border border-amber-400 bg-amber-400/20 px-3 py-1 text-sm font-bold text-amber-200" : "rounded-md border border-white/15 bg-white/5 px-3 py-1 text-sm font-semibold text-slate-400 transition hover:bg-white/10";
  const spdBtn = (a: boolean) => a ? "rounded border border-violet-400 bg-violet-400/20 px-2 py-1 text-xs font-bold text-violet-200" : "rounded border border-white/15 bg-white/5 px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10";

  const piColor = Number.isNaN(stats.pi) ? "text-amber-300" : Math.abs(stats.pi - Math.PI) < 0.031 ? "text-emerald-300" : Math.abs(stats.pi - Math.PI) < 0.16 ? "text-amber-300" : "text-red-300";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-900 p-3">
        <span className="text-sm text-slate-400">모양 선택:</span>
        <button type="button" className={shBtn(shape === "straight")} onClick={() => changeShape("straight")}>📏 직선 바늘</button>
        <button type="button" className={shBtn(shape === "v")} onClick={() => changeShape("v")}>〈 V자형</button>
        <button type="button" className={shBtn(shape === "w")} onClick={() => changeShape("w")}>W자형</button>
      </div>

      <div ref={wrapRef}>
        <canvas ref={simRef} className="block w-full rounded-lg border border-indigo-400/25" />
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="inline-block h-1 w-3.5 rounded bg-red-400" />교차(hit)</span>
        <span className="flex items-center gap-1"><span className="inline-block h-1 w-3.5 rounded bg-blue-400" />비교차(miss)</span>
        <span className="text-slate-500">최신은 밝게 표시</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat val={stats.total.toLocaleString()} lbl="투척 횟수 (n)" tone="text-blue-300" />
        <Stat val={stats.crossings.toLocaleString()} lbl="교차 횟수" tone="text-red-300" />
        <Stat val={Number.isNaN(stats.rate) ? "—" : stats.rate.toFixed(5)} lbl="교차율" tone="text-violet-300" />
        <Stat val={stats.theo.toFixed(5)} lbl="이론 교차율" tone="text-violet-300" />
        <Stat
          val={Number.isNaN(stats.pi) ? "던져보세요!" : stats.pi.toFixed(6)}
          lbl="π 추정값"
          sub={Number.isNaN(stats.pi) ? "" : `오차 ${(Math.abs(stats.pi - Math.PI) / Math.PI * 100).toFixed(2)}%`}
          tone={piColor}
        />
        <Stat val="3.141592…" lbl="실제 π" tone="text-amber-300" />
      </div>

      <div><canvas ref={grRef} className="block w-full rounded-lg border border-indigo-400/25" /></div>

      <div className="space-y-2.5 rounded-xl border border-white/10 bg-slate-900 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-[110px] text-sm text-slate-400">{info.slider}</span>
          <input type="range" min={10} max={58} value={size} onChange={(e) => { setSize(Number(e.target.value)); reset(); }} className="flex-1 accent-violet-400" aria-label={info.slider} />
          <span className="min-w-[52px] text-right text-sm text-slate-200">{size} px</span>
          <span className="text-xs text-slate-500">(d = {D}px)</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400">속도:</span>
          {SPEEDS.map((s) => <button key={s.v} type="button" className={spdBtn(spd === s.v)} onClick={() => setSpd(s.v)}>{s.l}</button>)}
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 10, 100, 1000].map((n) => (
            <button key={n} type="button" disabled={auto} onClick={() => dropN(n)}
              className="rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-45">+{n.toLocaleString()}개</button>
          ))}
          <button type="button" onClick={toggleAuto} className={`rounded-md px-3 py-1.5 text-sm font-bold text-white transition hover:brightness-110 ${auto ? "bg-slate-600" : "bg-emerald-600"}`}>{auto ? "⏸ 정지" : "▶ 자동"}</button>
          <button type="button" onClick={reset} className="rounded-md bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-110">↺ 초기화</button>
        </div>
      </div>

      <div className="rounded-xl border border-violet-400/30 bg-violet-400/10 p-3 text-center">
        <p className="text-xs text-violet-300">{info.fTitle}</p>
        <p className="mt-1 font-mono text-base font-bold text-slate-100">{info.fMain}</p>
        <p className="mt-1 text-sm text-slate-400">{info.fSub}</p>
      </div>
    </div>
  );
}

function Stat({ val, lbl, sub, tone }: { val: number | string; lbl: string; sub?: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/9 bg-white/[0.04] p-2.5 text-center">
      <div className={`truncate text-lg font-black tabular-nums ${tone}`}>{val}</div>
      <div className="mt-0.5 whitespace-nowrap text-[11px] leading-tight text-slate-500">{lbl}</div>
      {/* 오차처럼 자릿수가 바뀌는 보조 수치는 고정 높이의 별도 줄에 둬서 칸 높이가 흔들리지 않게 한다. */}
      {sub !== undefined ? (
        <div className="h-[14px] whitespace-nowrap text-[11px] leading-tight tabular-nums text-slate-500">{sub}</div>
      ) : null}
    </div>
  );
}

function FBox({ children }: { children: React.ReactNode }) {
  return <div className="my-2 rounded-lg border border-indigo-400/25 bg-indigo-400/10 p-2.5 text-center font-mono text-sm text-slate-100">{children}</div>;
}

function TheoryTab() {
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <h4 className="border-b border-violet-400/20 pb-1.5 text-sm font-bold text-violet-300">📌 단계 1: 실험 설정</h4>
        <p className="mt-2 text-sm leading-7 text-slate-300">간격 <b>d</b>인 평행선 위에 길이 <b>L(≤d)</b>인 바늘을 무작위로 던집니다. 두 확률 변수:</p>
        <ul className="ml-4 list-disc text-sm leading-7 text-slate-300">
          <li><b className="text-amber-300">θ</b>: 바늘과 평행선이 이루는 각 (0~π, 균일분포)</li>
          <li><b className="text-emerald-300">D</b>: 바늘 중심에서 가장 가까운 선까지의 거리 (0~d/2, 균일분포)</li>
        </ul>
        <p className="mt-1 text-sm leading-7 text-slate-300">두 변수는 <b>서로 독립</b>이며, 교차 사건은 아래 조건으로 결정됩니다.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <h4 className="border-b border-violet-400/20 pb-1.5 text-sm font-bold text-violet-300">📌 단계 2: 교차 조건</h4>
        <p className="mt-2 text-sm leading-7 text-slate-300">바늘의 수직 돌출 길이는 <b>(L/2)·sinθ</b>. 중심에서 선까지 거리 D가 이보다 작거나 같으면 교차합니다.</p>
        <FBox>D ≤ (L/2)·sin θ</FBox>
        <div className="mt-2 flex justify-center">
          <svg viewBox="0 0 200 130" className="max-w-[220px]">
            <line x1="24" y1="10" x2="24" y2="110" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="22" y1="108" x2="192" y2="108" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="8" y="64" fill="#4ade80" fontSize="9" fontWeight="bold">D</text>
            <text x="100" y="122" fill="#fbbf24" fontSize="9" fontWeight="bold">θ (0~π)</text>
            <line x1="22" y1="30" x2="185" y2="30" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="3,2" />
            <text x="4" y="33" fill="#94a3b8" fontSize="8">d/2</text>
            <path d="M24,108 Q 60,10 104,30 Q 148,50 184,108 Z" fill="rgba(96,165,250,0.25)" />
            <path d="M24,108 Q 60,10 104,30 Q 148,50 184,108" fill="none" stroke="#60a5fa" strokeWidth="2" />
            <text x="64" y="78" fill="#60a5fa" fontSize="8">교차 영역</text>
          </svg>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <h4 className="border-b border-violet-400/20 pb-1.5 text-sm font-bold text-violet-300">📌 단계 3: 적분으로 확률 계산</h4>
        <p className="mt-2 text-sm leading-7 text-slate-300">θ, D가 [0,π]·[0,d/2]에서 균일하므로, 교차 확률은 직사각형에 대한 사인 곡선 아래 면적의 비율입니다.</p>
        <FBox>P(교차) = ∫₀^π (L/2)sinθ dθ ÷ (π × d/2) = L ÷ (πd/2) = <b className="text-amber-300">2L/(πd)</b></FBox>
        <FBox>hits/n ≈ 2L/(πd) → <b className="text-amber-300">π ≈ 2Ln / (hits·d)</b></FBox>
        <p className="text-xs text-slate-500">* 이 공식은 L ≤ d (짧은 바늘)에서 정확히 성립.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <h4 className="border-b border-violet-400/20 pb-1.5 text-sm font-bold text-violet-300">📌 단계 4: 뷔퐁의 바늘 → 뷔퐁의 국수</h4>
        <span className="mt-2 inline-block rounded bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-300">확장 정리</span>
        <p className="mt-1.5 text-sm leading-7 text-slate-300"><b>어떤 형태의 곡선이든</b> 총 호의 길이가 L이면, 간격 d인 평행선에 던질 때 교차 횟수의 기댓값은 항상 같습니다! 따라서 직선이 아닌 V·W자로도 π를 추정할 수 있습니다.</p>
        <FBox>E(교차) = 2L/(π·d) → π ≈ 2L·n / (총 교차수·d)</FBox>
        <div className="mt-1 rounded-lg border border-red-400/20 bg-red-400/10 p-2.5 text-sm leading-7 text-red-200">
          ⚠️ <b>원은 왜 제외?</b> 원 둘레 = 2πr에 이미 π가 들어 있어, E = 2L/(πd)에 대입하면 E = 4r/d로 π가 소거됩니다 → 교차 데이터만으로 π를 못 구합니다.
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
        <h4 className="border-b border-violet-400/20 pb-1.5 text-sm font-bold text-violet-300">💡 몬테카를로 방법</h4>
        <p className="mt-2 text-sm leading-7 text-slate-300">뷔퐁의 바늘처럼 <b>무작위 시행을 대량 반복</b>해 수학 상수·확률을 추정하는 방법을 <b className="text-violet-300">몬테카를로 방법</b>이라 합니다. 물리·금융·의학·AI 등 다양한 분야에서 활용됩니다.</p>
      </div>
    </div>
  );
}

export default function BuffonNeedle() {
  const [tab, setTab] = useState<"sim" | "theory">("sim");
  const tabBtn = (a: boolean) => a ? "rounded-lg bg-violet-400 px-3 py-2 text-sm font-bold text-slate-950" : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 확률</p>
        <h3 className="mt-2 text-2xl font-bold">🪡 뷔퐁의 바늘 실험</h3>
        <p className="mt-2 leading-7 text-slate-300">
          평행선 위로 직선·V자·W자를 던져 <b className="text-violet-300">π</b>를 추정합니다. 원리 설명 탭에서 교차 조건과 적분 유도(뷔퐁의 국수 정리)도 확인해 보세요.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "sim")} onClick={() => setTab("sim")}>🔬 시뮬레이션</button>
        <button type="button" className={tabBtn(tab === "theory")} onClick={() => setTab("theory")}>📐 원리 설명</button>
      </div>

      <div className="mt-4">{tab === "sim" ? <SimTab /> : <TheoryTab />}</div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
