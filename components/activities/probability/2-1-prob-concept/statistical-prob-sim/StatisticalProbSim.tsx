"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

const randInt = (n: number) => Math.floor(Math.random() * n);

type SpeedKey = "slow" | "normal" | "fast";
const SPEED_MS: Record<SpeedKey, number> = { slow: 950, normal: 550, fast: 280 };
const SPEED_LABEL: Record<SpeedKey, string> = { slow: "🐢 느리게", normal: "🚶 보통", fast: "🐇 빠르게" };

type AccentKey = "amber" | "cyan" | "emerald";
const ACCENT: Record<AccentKey, { range: string; text: string; run: string; speedOn: string }> = {
  amber: { range: "accent-amber-400", text: "text-amber-300", run: "from-amber-500 to-orange-500", speedOn: "border-amber-400/40 bg-amber-400/20 text-amber-200" },
  cyan: { range: "accent-cyan-400", text: "text-cyan-300", run: "from-cyan-500 to-indigo-500", speedOn: "border-cyan-400/40 bg-cyan-400/20 text-cyan-200" },
  emerald: { range: "accent-emerald-400", text: "text-emerald-300", run: "from-emerald-500 to-teal-500", speedOn: "border-emerald-400/40 bg-emerald-400/20 text-emerald-200" },
};

// ─────────────────────────────────────────────────────────────
//  공용 러너 훅 — 시행마다 애니메이션 후 tick(집계). 자동 실행(속도) 지원.
// ─────────────────────────────────────────────────────────────
function useRunner(tick: () => void, onRollStart?: () => void, onRollEnd?: () => void) {
  const [phase, setPhase] = useState<"idle" | "rolling" | "result">("idle");
  const [auto, setAuto] = useState(false);
  const [speed, setSpeed] = useState<SpeedKey>("normal");
  const rollingRef = useRef(false);
  const autoRef = useRef(false);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef(tick);
  const startCbRef = useRef(onRollStart);
  const endCbRef = useRef(onRollEnd);
  const speedRef = useRef(speed);
  const startRef = useRef<() => void>(() => {});

  useEffect(() => { tickRef.current = tick; startCbRef.current = onRollStart; endCbRef.current = onRollEnd; });
  useEffect(() => { speedRef.current = speed; }, [speed]);

  function clearAll() {
    if (tRef.current) clearTimeout(tRef.current);
    if (nextRef.current) clearTimeout(nextRef.current);
  }
  useEffect(() => () => clearAll(), []);

  function start() {
    if (rollingRef.current) return;
    rollingRef.current = true;
    setPhase("rolling");
    startCbRef.current?.();
    const ms = SPEED_MS[speedRef.current];
    tRef.current = setTimeout(() => {
      endCbRef.current?.();
      tickRef.current();
      setPhase("result");
      rollingRef.current = false;
      if (autoRef.current) nextRef.current = setTimeout(() => startRef.current(), Math.max(140, ms * 0.3));
    }, ms);
  }
  useEffect(() => { startRef.current = start; });

  function manualRun() { if (!autoRef.current && !rollingRef.current) start(); }
  function toggleAuto() {
    if (autoRef.current) { autoRef.current = false; setAuto(false); if (nextRef.current) clearTimeout(nextRef.current); return; }
    autoRef.current = true; setAuto(true);
    if (!rollingRef.current) start();
  }
  function hardStop() { autoRef.current = false; setAuto(false); clearAll(); rollingRef.current = false; setPhase("idle"); }

  return { phase, auto, speed, setSpeed, manualRun, toggleAuto, hardStop };
}

// ─────────────────────────────────────────────────────────────
//  공용 컨트롤 바
// ─────────────────────────────────────────────────────────────
function RunControls({ accent, n, setN, max, unit, total, speed, setSpeed, auto, phase, onRun, onAuto, onReset, runLabel, runDisabled }: {
  accent: AccentKey; n: number; setN: (v: number) => void; max: number; unit: string; total: number;
  speed: SpeedKey; setSpeed: (s: SpeedKey) => void; auto: boolean; phase: string;
  onRun: () => void; onAuto: () => void; onReset: () => void; runLabel: string; runDisabled?: boolean;
}) {
  const a = ACCENT[accent];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-white/10 bg-slate-900 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">한 번에</span>
        <input type="range" min={1} max={max} value={n} onChange={(e) => setN(Number(e.target.value))} className={`w-24 ${a.range}`} aria-label="시행 횟수" />
        <span className={`min-w-[48px] text-sm font-bold ${a.text}`}>{n}{unit}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-400">속도</span>
        {(["slow", "normal", "fast"] as SpeedKey[]).map((s) => (
          <button key={s} type="button" onClick={() => setSpeed(s)}
            className={speed === s ? `rounded-md border px-2 py-1 text-xs font-bold ${a.speedOn}` : "rounded-md border border-white/12 bg-white/5 px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10"}>
            {SPEED_LABEL[s]}
          </button>
        ))}
      </div>
      <span className="ml-auto text-xs text-slate-400">누적: <b className={a.text}>{total}</b>{unit}</span>
      <button type="button" onClick={onRun} disabled={runDisabled || phase === "rolling" || auto}
        className={`rounded-lg bg-gradient-to-r ${a.run} px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-45`}>{runLabel}</button>
      <button type="button" onClick={onAuto} disabled={runDisabled}
        className={`rounded-lg px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-45 ${auto ? "bg-red-500" : "bg-indigo-600"}`}>{auto ? "■ 정지" : "▶ 자동"}</button>
      <button type="button" onClick={onReset} disabled={runDisabled}
        className="rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-45">↺ 초기화</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  공용: 수렴 차트(canvas)
// ─────────────────────────────────────────────────────────────
function ConvergenceChart({ history, refVal, color }: { history: number[]; refVal: number; color: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cvsRef = useRef<HTMLCanvasElement | null>(null);
  const [w, setW] = useState(320);

  useEffect(() => {
    const measure = () => { if (wrapRef.current) setW(wrapRef.current.clientWidth); };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const cvs = cvsRef.current;
    const ctx = cvs?.getContext("2d");
    if (!cvs || !ctx) return;
    const H = 130;
    cvs.width = w; cvs.height = H;
    ctx.clearRect(0, 0, w, H);
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.fillRect(0, 0, w, H);
    const pad = { t: 10, b: 18, l: 34, r: 10 };
    const iW = w - pad.l - pad.r, iH = H - pad.t - pad.b;

    const ry = pad.t + iH * (1 - refVal);
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad.l, ry); ctx.lineTo(w - pad.r, ry); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.font = "9px sans-serif";
    ctx.fillText(`${(refVal * 100).toFixed(0)}%`, 2, ry + 3);

    [0.25, 0.5, 0.75].forEach((v) => {
      const gy = pad.t + iH * (1 - v);
      ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(w - pad.r, gy); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.font = "9px sans-serif";
      ctx.fillText(`${(v * 100).toFixed(0)}%`, 2, gy + 3);
    });

    if (history.length < 2) return;
    const step = Math.ceil(history.length / 150);
    const data = step > 1 ? history.filter((_, i) => i % step === 0) : history;

    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.shadowColor = color; ctx.shadowBlur = 4;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = pad.l + (i / (data.length - 1)) * iW;
      const y = pad.t + iH * (1 - Math.min(Math.max(v, 0), 1));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    const last = data[data.length - 1];
    const lx = w - pad.r, ly = pad.t + iH * (1 - Math.min(Math.max(last, 0), 1));
    ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    ctx.fillStyle = "white"; ctx.font = "bold 9px sans-serif";
    ctx.fillText(`${(last * 100).toFixed(1)}%`, lx - 20, ly - 6);
  }, [history, refVal, color, w]);

  return <div ref={wrapRef}><canvas ref={cvsRef} className="block w-full rounded-lg" /></div>;
}

// ─────────────────────────────────────────────────────────────
//  공용: 통계 막대(SVG)
// ─────────────────────────────────────────────────────────────
type BarRow = { label: string; count: number; refPct: number; color: string };
function StatBars({ rows, total }: { rows: BarRow[]; total: number }) {
  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const pct = total > 0 ? (r.count / total) * 100 : 0;
        return (
          <div key={r.label}>
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">{r.label}</span>
              <span className="text-slate-400">{r.count}회 ({pct.toFixed(1)}%)</span>
            </div>
            <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="mt-1 h-3.5 w-full overflow-hidden rounded bg-white/8" aria-hidden>
              <rect x="0" y="0" width={Math.min(pct, 100)} height="8" fill={r.color} rx="1" />
              <line x1={Math.min(r.refPct, 100)} x2={Math.min(r.refPct, 100)} y1="0" y2="8" stroke="white" strokeOpacity="0.5" strokeWidth="0.6" />
            </svg>
          </div>
        );
      })}
      <p className="text-right text-[11px] text-slate-500">흰 선 = 기준(이론/설정) 확률</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  탭 ① 윷놀이
// ═══════════════════════════════════════════════════════════════
const YUT = ["도", "개", "걸", "윷", "모"];
const YUT_EMOJI: Record<string, string> = { 도: "🐕", 개: "🐶", 걸: "🐈", 윷: "🌙", 모: "⭕" };
const YUT_COLORS: Record<string, string> = { 도: "#fb923c", 개: "#fbbf24", 걸: "#a3e635", 윷: "#34d399", 모: "#60a5fa" };
const YUT_TEXT: Record<string, string> = { 도: "text-orange-300", 개: "text-amber-300", 걸: "text-lime-300", 윷: "text-emerald-300", 모: "text-blue-300" };
const YUT_REF: Record<string, number> = {
  도: 4 * 0.6 * 0.4 ** 3, 개: 6 * 0.6 ** 2 * 0.4 ** 2, 걸: 4 * 0.6 ** 3 * 0.4, 윷: 0.6 ** 4, 모: 0.4 ** 4,
};
function rollYutOnce(): { outcome: string; front: number } {
  let front = 0;
  for (let i = 0; i < 4; i++) if (Math.random() < 0.6) front++;
  const outcome = front === 0 ? "모" : front === 1 ? "도" : front === 2 ? "개" : front === 3 ? "걸" : "윷";
  return { outcome, front };
}

function TabYut() {
  const [counts, setCounts] = useState<Record<string, number>>(() => Object.fromEntries(YUT.map((o) => [o, 0])));
  const [total, setTotal] = useState(0);
  const [frontTotal, setFrontTotal] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [n, setN] = useState(1);
  const [result, setResult] = useState<{ outcome?: string; last?: string; bulk?: number } | null>(null);

  function tick() {
    let last = "", front = 0;
    const tally: Record<string, number> = {};
    for (let i = 0; i < n; i++) { const r = rollYutOnce(); last = r.outcome; front += r.front; tally[last] = (tally[last] ?? 0) + 1; }
    setCounts((prev) => { const nc = { ...prev }; for (const k in tally) nc[k] = (nc[k] ?? 0) + tally[k]; return nc; });
    const nt = total + n, nf = frontTotal + front;
    setTotal(nt); setFrontTotal(nf);
    setHistory((h) => [...h, nf / (nt * 4)]);
    setResult(n === 1 ? { outcome: last } : { bulk: n, last });
  }
  const run = useRunner(tick);
  function reset() {
    run.hardStop();
    setCounts(Object.fromEntries(YUT.map((o) => [o, 0])));
    setTotal(0); setFrontTotal(0); setHistory([]); setResult(null);
  }
  const frontRate = total > 0 ? frontTotal / (total * 4) : 0;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border-l-4 border-amber-400 bg-amber-400/10 p-3.5 text-sm leading-7 text-amber-100">
        <p className="font-bold text-amber-200">🪵 왜 윷은 수학적 확률로 계산할 수 없을까?</p>
        <p className="mt-1">윷가락은 <b>반원기둥</b> 모양이라 평평한 면(배)과 볼록한 면의 넓이가 달라 앞뒤 확률이 <b>다릅니다</b>. 근원사건이 동일한 확률을 갖지 않으므로 수학적 확률(동일가능성)이 성립하지 않아요. → 많이 던져 얻은 <b>상대도수</b>로만 확률을 추정합니다!</p>
      </div>
      <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 text-center text-sm text-slate-300">
        통계적 확률 ≈ <span className="font-bold text-amber-300">도·개·걸·윷·모가 나온 횟수</span> ÷ <span className="font-bold text-amber-300">전체 던진 횟수</span>
      </div>

      <RunControls accent="amber" n={n} setN={setN} max={500} unit="회" total={total}
        speed={run.speed} setSpeed={run.setSpeed} auto={run.auto} phase={run.phase}
        onRun={run.manualRun} onAuto={run.toggleAuto} onReset={reset} runLabel="🪵 던져라!" />

      <div className="flex h-[150px] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/8 bg-black/30 p-4">
        {run.phase === "rolling" ? (
          <>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 w-3.5 rounded-full bg-gradient-to-b from-amber-100 via-amber-300 to-amber-700 animate-[diceTumble_0.5s_linear_infinite]" />
              ))}
            </div>
            <p className="text-xs text-slate-500">윷가락이 구르는 중…</p>
          </>
        ) : run.phase === "result" && result ? (
          result.bulk ? (
            <>
              <div className="animate-[fadeIn_0.3s_ease] text-4xl font-black text-amber-300">🪵 +{result.bulk}번!</div>
              <p className="text-sm text-slate-400">총 {total}번 던졌습니다 (마지막: {result.last})</p>
            </>
          ) : (
            <>
              <div className="animate-[fadeIn_0.3s_ease] text-4xl font-black">
                {YUT_EMOJI[result.outcome!]} <span className={YUT_TEXT[result.outcome!]}>{result.outcome}</span>
              </div>
              <p className="text-sm text-slate-400">&ldquo;{result.outcome}&rdquo;(이)가 나왔습니다</p>
            </>
          )
        ) : (
          <p className="text-sm text-slate-500">버튼을 눌러 윷을 던져보세요!</p>
        )}
      </div>

      {total > 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
          <p className="text-sm font-bold text-amber-300">📊 누적 통계 <span className="text-xs font-normal text-slate-500">총 {total}번</span></p>
          <div className="mt-2.5">
            <StatBars total={total} rows={YUT.map((o) => ({ label: `${YUT_EMOJI[o]} ${o}`, count: counts[o] ?? 0, refPct: YUT_REF[o] * 100, color: YUT_COLORS[o] }))} />
          </div>
        </div>
      ) : null}

      {total > 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
          <p className="text-sm font-bold text-amber-300">📈 앞면(배) 상대도수의 수렴</p>
          <div className="mt-2"><ConvergenceChart history={history} refVal={0.6} color="#eab308" /></div>
          <p className="mt-1 text-[11px] text-slate-500">가로: 시행 횟수 · 세로: 윷가락 1개의 앞면 비율 · ━ 기준 60%</p>
        </div>
      ) : null}

      {total >= 50 ? (
        <div className="rounded-xl border-l-4 border-cyan-400 bg-cyan-400/10 p-3.5 text-sm leading-7 text-cyan-100">
          <p className="font-bold">💡 발견!</p>
          <p className="mt-1">윷가락 1개의 앞면(배) 비율: <b>{(frontRate * 100).toFixed(1)}%</b> (총 {total * 4}개 중 앞면 {frontTotal}개). 던지는 횟수가 늘수록 <b>약 60%</b>에 가까워집니다. 시행 횟수를 늘릴수록 상대도수가 일정 값에 수렴하는 성질을 <b>대수의 법칙</b>이라 하며, 그 수렴 값이 <b>통계적 확률</b>입니다!</p>
        </div>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  탭 ② 기상예보
// ═══════════════════════════════════════════════════════════════
const SEASONS = [
  { prob: 40, name: "봄", icon: "🌸" },
  { prob: 70, name: "여름", icon: "☀️" },
  { prob: 25, name: "가을", icon: "🍂" },
  { prob: 10, name: "겨울", icon: "❄️" },
];
const WEATHER_FLICKER = ["☀️", "⛅", "🌧️", "🌦️", "☁️"];

function TabRain() {
  const [season, setSeason] = useState<{ prob: number; name: string; icon: string } | null>(null);
  const [counts, setCounts] = useState({ rain: 0, clear: 0 });
  const [total, setTotal] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [n, setN] = useState(1);
  const [flicker, setFlicker] = useState("☁️");
  const [result, setResult] = useState<{ rain?: boolean; bulk?: number; last?: boolean } | null>(null);
  const flickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (flickRef.current) clearInterval(flickRef.current); }, []);

  const prob = season ? season.prob / 100 : 0;

  function tick() {
    if (!season) return;
    let rain = 0, last = false;
    for (let i = 0; i < n; i++) { const r = Math.random() < prob; if (r) rain++; last = r; }
    setCounts((prev) => ({ rain: prev.rain + rain, clear: prev.clear + (n - rain) }));
    const nt = total + n;
    setTotal(nt);
    setHistory((h) => [...h, (counts.rain + rain) / nt]);
    setResult(n === 1 ? { rain: last } : { bulk: n, last });
  }
  const run = useRunner(
    tick,
    () => { flickRef.current = setInterval(() => setFlicker(WEATHER_FLICKER[randInt(WEATHER_FLICKER.length)]), 90); },
    () => { if (flickRef.current) clearInterval(flickRef.current); }
  );

  function selectSeason(s: typeof SEASONS[number]) {
    run.hardStop();
    if (flickRef.current) clearInterval(flickRef.current);
    setSeason(s);
    setCounts({ rain: 0, clear: 0 }); setTotal(0); setHistory([]); setResult(null);
  }
  function reset() {
    run.hardStop();
    if (flickRef.current) clearInterval(flickRef.current);
    setCounts({ rain: 0, clear: 0 }); setTotal(0); setHistory([]); setResult(null);
  }

  const seasonBtn = (active: boolean) =>
    active ? "rounded-lg border border-cyan-400/50 bg-cyan-400/20 px-3 py-1.5 text-sm font-bold text-cyan-100"
      : "rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10";

  return (
    <div className="space-y-3">
      <div className="rounded-xl border-l-4 border-cyan-400 bg-cyan-400/10 p-3.5 text-sm leading-7 text-cyan-100">
        <p className="font-bold text-cyan-200">🌧️ 비가 올 확률을 왜 통계적 확률로 구할까?</p>
        <p className="mt-1">비 오는 날씨는 기온·습도·기압 등 수많은 요인이 작용해 모든 근원사건이 같은 확률이라 볼 수 없어요. → 기상청은 <b>“오늘과 비슷한 기상 조건이 과거에 있었을 때 그 중 몇 번 비가 왔나”</b>를 세어 강수확률을 계산합니다. 이것이 통계적 확률!</p>
      </div>
      <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 text-center text-sm text-slate-300">
        강수 확률(%) ≈ <span className="font-bold text-cyan-300">비가 온 날의 수</span> ÷ <span className="font-bold text-cyan-300">비슷한 기상조건의 날 수</span> × 100
      </div>

      <div className="flex flex-wrap gap-2">
        {SEASONS.map((s) => (
          <button key={s.name} type="button" className={seasonBtn(season?.name === s.name)} onClick={() => selectSeason(s)}>{s.icon} {s.name} ({s.prob}%)</button>
        ))}
      </div>

      <RunControls accent="cyan" n={n} setN={setN} max={365} unit="일" total={total}
        speed={run.speed} setSpeed={run.setSpeed} auto={run.auto} phase={run.phase}
        onRun={run.manualRun} onAuto={run.toggleAuto} onReset={reset} runLabel="🌦️ 날씨 확인!" runDisabled={!season} />

      <div className="flex h-[150px] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/8 bg-black/30 p-4">
        {!season ? (
          <p className="text-sm text-slate-500">먼저 계절을 선택하세요!</p>
        ) : run.phase === "rolling" ? (
          <>
            <div className="text-5xl animate-[weatherFloat_0.6s_ease-in-out_infinite]">{flicker}</div>
            <p className="text-xs text-slate-500">날씨를 확인하는 중…</p>
          </>
        ) : run.phase === "result" && result ? (
          result.bulk ? (
            <>
              <div className="animate-[fadeIn_0.3s_ease] text-4xl font-black text-cyan-300">🌦️ +{result.bulk}일</div>
              <p className="text-sm text-slate-400">총 {total}일 누적 (마지막: {result.last ? "비 🌧️" : "맑음 ☀️"})</p>
            </>
          ) : (
            <>
              <div className="animate-[fadeIn_0.3s_ease] text-5xl">{result.rain ? "🌧️" : "☀️"}</div>
              <p className="text-sm text-slate-400">{result.rain ? "비가 왔습니다" : "맑거나 흐린 날이었습니다"}</p>
            </>
          )
        ) : (
          <p className="text-sm text-slate-400">{season.icon} {season.name} 강수확률 {season.prob}%. 날씨를 확인해보세요!</p>
        )}
      </div>

      {total > 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
          <p className="text-sm font-bold text-cyan-300">📊 강수 통계 <span className="text-xs font-normal text-slate-500">총 {total}일</span></p>
          <div className="mt-2.5">
            <StatBars total={total} rows={[
              { label: "🌧️ 비", count: counts.rain, refPct: prob * 100, color: "#60a5fa" },
              { label: "☀️ 맑음/흐림", count: counts.clear, refPct: (1 - prob) * 100, color: "#fbbf24" },
            ]} />
          </div>
        </div>
      ) : null}

      {total > 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
          <p className="text-sm font-bold text-cyan-300">📈 강수 상대도수의 수렴</p>
          <div className="mt-2"><ConvergenceChart history={history} refVal={prob} color="#06b6d4" /></div>
          <p className="mt-1 text-[11px] text-slate-500">가로: 날 수 · 세로: 강수 상대도수 · ━ 설정 강수확률 {season ? season.prob : 0}%</p>
        </div>
      ) : null}

      {total >= 30 ? (
        <div className="rounded-xl border-l-4 border-indigo-400 bg-indigo-400/10 p-3.5 text-sm leading-7 text-indigo-100">
          <p className="font-bold">🌦️ 기상청의 예보 방식</p>
          <p className="mt-1">현재 강수 상대도수: <b>{((counts.rain / total) * 100).toFixed(1)}%</b>. 기상청은 오늘과 비슷한 기상 조건의 날을 모아 비 온 날의 비율을 강수확률로 발표합니다. 반복하면 상대도수가 <b>{season ? season.prob : 0}%</b>로 수렴해요!</p>
        </div>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  탭 ③ 야구 타율
// ═══════════════════════════════════════════════════════════════
const PLAYERS = [
  { name: "이정후", avg: 0.349, icon: "🦅" },
  { name: "투수 타자", avg: 0.18, icon: "🎯" },
  { name: "슬럼프 타자", avg: 0.2, icon: "😰" },
  { name: "평균 선수", avg: 0.28, icon: "⚾" },
];
const HIT_EMOJI = ["💥", "🏃", "🎉", "👊"];
const OUT_EMOJI = ["😤", "⚾", "💨", "👎"];

function TabBat() {
  const [player, setPlayer] = useState<{ name: string; avg: number; icon: string } | null>(null);
  const [counts, setCounts] = useState({ hit: 0, out: 0 });
  const [total, setTotal] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [n, setN] = useState(1);
  const [result, setResult] = useState<{ hit?: boolean; emoji?: string; bulk?: number; last?: boolean } | null>(null);

  const prob = player ? player.avg : 0;

  function tick() {
    if (!player) return;
    let hit = 0, last = false;
    for (let i = 0; i < n; i++) { const h = Math.random() < prob; if (h) hit++; last = h; }
    setCounts((prev) => ({ hit: prev.hit + hit, out: prev.out + (n - hit) }));
    const nt = total + n;
    setTotal(nt);
    setHistory((h) => [...h, (counts.hit + hit) / nt]);
    const emoji = last ? HIT_EMOJI[randInt(HIT_EMOJI.length)] : OUT_EMOJI[randInt(OUT_EMOJI.length)];
    setResult(n === 1 ? { hit: last, emoji } : { bulk: n, last });
  }
  const run = useRunner(tick);

  function selectPlayer(p: typeof PLAYERS[number]) {
    run.hardStop();
    setPlayer(p);
    setCounts({ hit: 0, out: 0 }); setTotal(0); setHistory([]); setResult(null);
  }
  function reset() {
    run.hardStop();
    setCounts({ hit: 0, out: 0 }); setTotal(0); setHistory([]); setResult(null);
  }

  const playerBtn = "rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10";
  const playerSel = "rounded-lg border border-emerald-400/50 bg-emerald-400/20 px-3 py-1.5 text-sm font-bold text-emerald-100";

  return (
    <div className="space-y-3">
      <div className="rounded-xl border-l-4 border-emerald-400 bg-emerald-400/10 p-3.5 text-sm leading-7 text-emerald-100">
        <p className="font-bold text-emerald-200">⚾ 야구 타율을 왜 수학적 확률로 구할 수 없을까?</p>
        <p className="mt-1">안타 확률은 투수의 구질·컨디션·구장 등 무수한 변수로 결정돼 모든 타석이 같은 조건이 아니에요. → 대신 <b>실제 타석 수와 안타 수</b>로 타율 = 안타/타수를 구합니다. 이것이 통계적 확률!</p>
      </div>
      <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 text-center text-sm text-slate-300">
        타율(통계적 확률) = <span className="font-bold text-emerald-300">안타 수</span> ÷ <span className="font-bold text-emerald-300">타수(타석 수)</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {PLAYERS.map((p) => (
          <button key={p.name} type="button" className={player?.name === p.name ? playerSel : playerBtn} onClick={() => selectPlayer(p)}>{p.icon} {p.name} (.{(p.avg * 1000).toFixed(0)})</button>
        ))}
      </div>

      <RunControls accent="emerald" n={n} setN={setN} max={200} unit="타석" total={total}
        speed={run.speed} setSpeed={run.setSpeed} auto={run.auto} phase={run.phase}
        onRun={run.manualRun} onAuto={run.toggleAuto} onReset={reset} runLabel="⚾ 타석!" runDisabled={!player} />

      <div className="flex h-[150px] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/8 bg-black/30 p-4">
        {!player ? (
          <p className="text-sm text-slate-500">먼저 선수를 선택하세요!</p>
        ) : run.phase === "rolling" ? (
          <>
            <div className="flex items-center gap-2 text-5xl">
              <span className="inline-block origin-bottom animate-[batSwing_0.45s_ease-in-out_infinite]">🏏</span>
              <span className="text-3xl">⚾</span>
            </div>
            <p className="text-xs text-slate-500">스윙!</p>
          </>
        ) : run.phase === "result" && result ? (
          result.bulk ? (
            <>
              <div className="animate-[fadeIn_0.3s_ease] text-4xl font-black text-emerald-300">⚾ +{result.bulk}타석</div>
              <p className="text-sm text-slate-400">총 {total}타석 (마지막: {result.last ? "안타" : "아웃"})</p>
            </>
          ) : (
            <>
              <div className="animate-[fadeIn_0.3s_ease] text-5xl">{result.emoji}</div>
              <p className={`text-sm ${result.hit ? "text-emerald-300" : "text-red-300"}`}>{result.hit ? `🎉 안타! ${player.name} 출루!` : "😤 아웃! 다음 타석을 기약합니다."}</p>
            </>
          )
        ) : (
          <p className="text-sm text-slate-400">{player.icon} {player.name} (타율 .{(player.avg * 1000).toFixed(0)}) 등장!</p>
        )}
      </div>

      {total > 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
          <p className="text-sm font-bold text-emerald-300">📊 타격 통계 <span className="text-xs font-normal text-slate-500">총 {total}타석</span></p>
          <div className="mt-2.5">
            <StatBars total={total} rows={[
              { label: "안타", count: counts.hit, refPct: prob * 100, color: "#22c55e" },
              { label: "아웃", count: counts.out, refPct: (1 - prob) * 100, color: "#f87171" },
            ]} />
          </div>
        </div>
      ) : null}

      {total > 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
          <p className="text-sm font-bold text-emerald-300">📈 타율(상대도수)의 수렴</p>
          <div className="mt-2"><ConvergenceChart history={history} refVal={prob} color="#22c55e" /></div>
          <p className="mt-1 text-[11px] text-slate-500">가로: 타석 수 · 세로: 타율 · ━ 실제 타율 .{player ? (player.avg * 1000).toFixed(0) : 0}</p>
        </div>
      ) : null}

      {total >= 30 ? (
        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-400/10 p-3.5 text-sm leading-7 text-amber-100">
          <p className="font-bold">⚾ 통계적 확률의 의미</p>
          <p className="mt-1">현재 타율: <b>.{Math.round((counts.hit / total) * 1000)}</b>. 타석이 쌓일수록 <b>.{player ? (player.avg * 1000).toFixed(0) : 0}</b>에 수렴합니다. 타율이 높은 타자가 한두 번 아웃돼도 실망할 필요 없는 이유! 통계적 확률은 <b>시행 횟수가 충분히 많을 때</b> 의미 있는 값이 됩니다.</p>
        </div>
      ) : null}
    </div>
  );
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_statistical",
    prompt:
      "윷놀이·비가 올 확률·야구 타율을 수학적 확률로 정의할 수 없는 이유를 각각 설명해 보세요. (공통점: 근원사건이 동일한 확률이 아님)",
    kind: "text",
  },
  {
    id: "law_large_numbers",
    prompt:
      "실험 횟수를 늘릴수록 상대도수가 어떻게 변했나요? 이 ‘대수의 법칙’이 통계적 확률과 어떤 관련이 있는지 설명해 보세요.",
    kind: "text",
  },
  {
    id: "define_statistical",
    prompt: "이 활동을 통해 알게 된 통계적 확률의 정의를 자신의 말로 써 보세요.",
    kind: "text",
  },
];

type TabKey = "yut" | "rain" | "bat";

export default function StatisticalProbSim() {
  const [tab, setTab] = useState<TabKey>("yut");
  const tabBtn = (active: boolean, color: string) =>
    active ? `rounded-lg px-3 py-2 text-sm font-bold text-slate-950 ${color}`
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 확률</p>
        <h3 className="mt-2 text-2xl font-bold">🎯 통계적 확률 탐험대</h3>
        <p className="mt-2 leading-7 text-slate-300">
          수학적 확률로는 계산할 수 없는 세 사례(윷놀이·기상예보·야구 타율)를 직접 실험하며 <b className="text-cyan-300">통계적 확률</b>과 <b className="text-cyan-300">대수의 법칙</b>을 탐구해 보세요.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "yut", "bg-amber-400")} onClick={() => setTab("yut")}>🪵 윷놀이</button>
        <button type="button" className={tabBtn(tab === "rain", "bg-cyan-300")} onClick={() => setTab("rain")}>🌧️ 기상예보</button>
        <button type="button" className={tabBtn(tab === "bat", "bg-emerald-400")} onClick={() => setTab("bat")}>⚾ 야구 타율</button>
      </div>

      <div className="mt-4">
        {tab === "yut" ? <TabYut /> : tab === "rain" ? <TabRain /> : <TabBat />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
