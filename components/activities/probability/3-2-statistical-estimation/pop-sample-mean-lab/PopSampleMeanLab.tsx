"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoCentroid, geoMercator, geoPath } from "d3-geo";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from "geojson";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 질문 ──────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "m_vs_xbar",
    prompt:
      "이 활동을 통해 알게 된 모평균 m과 표본평균 X̄의 차이는 무엇인가요? 두 값의 ‘성격’이 어떻게 다른지 함께 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 모평균 m은 모집단 전체의 평균으로 한 번 정해지면 바뀌지 않는 고정된 값이고, 표본평균 X̄은 어떤 표본을 뽑느냐에 따라 매번 달라지는 값(확률변수)이다.",
  },
  {
    id: "size_effect",
    prompt:
      "표본 크기 n을 작게(예: n=3) 했을 때와 크게(예: n=30) 했을 때, 표본평균 X̄의 분포는 어떻게 달랐나요?",
    kind: "text",
    placeholder:
      "예: n이 작을 때는 X̄이 m에서 멀리 떨어진 값도 자주 나왔지만, n이 커지자 X̄들이 m 근처에 더 좁게 모였다.",
  },
  {
    id: "why_random_variable",
    prompt:
      "왜 표본평균 X̄을 ‘확률변수’라고 부르는지, 이번 활동에서 관찰한 내용을 근거로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 같은 모집단·같은 n으로 뽑아도 어떤 표본이 뽑히느냐에 따라 X̄ 값이 매번 달라졌기 때문에, X̄은 미리 정해진 상수가 아니라 우연에 따라 값이 변하는 확률변수다.",
  },
];

// ─── 공통 유틸 ─────────────────────────────────────────────
function gauss(mean: number, std: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function colorForScore(v: number): string {
  // 30→파랑(220), 60→초록, 95→빨강(0)
  const t = Math.max(0, Math.min(1, (v - 30) / 65));
  const hue = 220 - t * 220;
  return `hsl(${hue},75%,60%)`;
}

function sampleIndices(N: number, n: number): number[] {
  const pool = Array.from({ length: N }, (_, i) => i);
  const out: number[] = [];
  const k = Math.min(n, N);
  for (let i = 0; i < k; i++) {
    const j = Math.floor(Math.random() * pool.length);
    out.push(pool[j]);
    pool.splice(j, 1);
  }
  return out;
}

// ─── 메인 ─────────────────────────────────────────────────
type TabKey = "secret" | "map";

export default function PopSampleMeanLab() {
  const [tab, setTab] = useState<TabKey>("secret");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">🎯 모평균 vs 표본평균 — 비밀 모집단 추적</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-rose-300">모평균 m</b>은 모집단의 고정된 평균이지만,{" "}
          <b className="text-cyan-300">표본평균 X̄</b>은 표본을 어떻게 뽑는지에 따라 달라지는{" "}
          <b className="text-amber-300">확률변수</b>입니다. 두 시뮬레이션으로 직접 확인해 봐요!
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabBtn active={tab === "secret"} tone="cyan" onClick={() => setTab("secret")}>
          🎲 비밀 모집단 추적
        </TabBtn>
        <TabBtn active={tab === "map"} tone="pink" onClick={() => setTab("map")}>
          🗺️ 미세먼지 지도
        </TabBtn>
      </div>

      <div className={tab === "secret" ? "mt-4" : "mt-4 hidden"}>
        <SecretPopTab />
      </div>
      <div className={tab === "map" ? "mt-4" : "mt-4 hidden"}>
        <DustMapTab />
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <ReflectionForm questions={REFLECTION_QUESTIONS} />
      </div>
    </section>
  );
}

// ─── 탭 버튼 ─────────────────────────────────────────────
type Tone = "cyan" | "pink";
const ACTIVE_CLASS: Record<Tone, string> = {
  cyan: "bg-cyan-300 text-slate-900",
  pink: "bg-pink-300 text-slate-900",
};
const INACTIVE_CLASS: Record<Tone, string> = {
  cyan: "border border-cyan-300/30 text-cyan-200 hover:bg-cyan-300/10",
  pink: "border border-pink-300/30 text-pink-200 hover:bg-pink-300/10",
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
  const cls = active ? ACTIVE_CLASS[tone] : INACTIVE_CLASS[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${cls}`}
    >
      {children}
    </button>
  );
}

// =================================================================
// TAB 1 — 비밀 모집단 추적 (Canvas)
// =================================================================
const N_POP = 200;
const POP_W = 700;
const POP_H = 450;

type SecretSample = { idx: number[]; vals: number[]; xbar: number };

function buildPopulation(): { values: number[]; positions: { x: number; y: number }[] } {
  const values: number[] = [];
  for (let i = 0; i < N_POP; i++) {
    let v = gauss(62, 11);
    v = Math.max(30, Math.min(98, Math.round(v)));
    values.push(v);
  }
  const positions: { x: number; y: number }[] = [];
  const cols = 20;
  const rows = 10;
  const cellW = POP_W / cols;
  const cellH = POP_H / rows;
  for (let i = 0; i < N_POP; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = (c + 0.5) * cellW + (Math.random() - 0.5) * cellW * 0.55;
    const y = (r + 0.5) * cellH + (Math.random() - 0.5) * cellH * 0.55;
    positions.push({ x, y });
  }
  return { values, positions };
}

function SecretPopTab() {
  const popCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const histoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [pop, setPop] = useState(() => buildPopulation());
  const [n, setN] = useState(10);
  const [revealed, setRevealed] = useState(false);
  const [lastSample, setLastSample] = useState<SecretSample | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [highlight, setHighlight] = useState<Set<number>>(() => new Set());
  const [flash, setFlash] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const autoRunningRef = useRef(false);

  const m = useMemo(
    () => pop.values.reduce((a, b) => a + b, 0) / pop.values.length,
    [pop.values]
  );

  // 모집단 캔버스 그리기
  useEffect(() => {
    const canvas = popCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W / 1.4);
    grad.addColorStop(0, "rgba(30,41,59,0.0)");
    grad.addColorStop(1, "rgba(15,23,42,0.4)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const has = highlight.size > 0;
    for (let i = 0; i < N_POP; i++) {
      const p = pop.positions[i];
      const v = pop.values[i];
      const isH = highlight.has(i);
      const r = isH ? 11 : 7;
      if (isH) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(251,191,36,0.18)";
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isH ? "#fbbf24" : colorForScore(v);
      ctx.globalAlpha = isH ? 1 : has ? 0.32 : 0.92;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = isH ? 2 : 1;
      ctx.strokeStyle = isH ? "#fff" : "rgba(15,23,42,0.6)";
      ctx.stroke();
    }
  }, [pop, highlight]);

  // 히스토그램 그리기
  useEffect(() => {
    const canvas = histoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const padL = 30;
    const padR = 12;
    const padT = 14;
    const padB = 28;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const lo = 30;
    const hi = 95;
    const nBins = 26;
    const binW = (hi - lo) / nBins;
    const bins = new Array<number>(nBins).fill(0);
    for (const v of history) {
      let idx = Math.floor((v - lo) / binW);
      if (idx < 0) idx = 0;
      if (idx >= nBins) idx = nBins - 1;
      bins[idx]++;
    }
    const maxBin = Math.max(1, ...bins);

    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
    }

    for (let i = 0; i < nBins; i++) {
      const x = padL + (i / nBins) * plotW;
      const w = plotW / nBins - 1;
      const h = (bins[i] / maxBin) * plotH;
      const binCenter = lo + (i + 0.5) * binW;
      ctx.fillStyle = colorForScore(binCenter);
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x, padT + plotH - h, w, h);
      ctx.globalAlpha = 1;
    }

    if (revealed) {
      const mx = padL + ((m - lo) / (hi - lo)) * plotW;
      ctx.strokeStyle = "#fb7185";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(mx, padT);
      ctx.lineTo(mx, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#fb7185";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("m=" + m.toFixed(1), mx + 4, padT + 12);
    }

    if (history.length > 0) {
      const v = history[history.length - 1];
      const vx = padL + ((v - lo) / (hi - lo)) * plotW;
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(vx, padT + plotH + 4);
      ctx.lineTo(vx - 5, padT + plotH + 12);
      ctx.lineTo(vx + 5, padT + plotH + 12);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    for (const v of [30, 45, 60, 75, 90]) {
      const x = padL + ((v - lo) / (hi - lo)) * plotW;
      ctx.fillText(String(v), x, H - padB + 15);
    }
    ctx.textAlign = "left";
    ctx.fillText("X̄", 4, padT + plotH / 2);
  }, [history, m, revealed]);

  function doSampleOnce(): SecretSample {
    const idx = sampleIndices(N_POP, n);
    const vals = idx.map((i) => pop.values[i]);
    const xbar = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { idx, vals, xbar };
  }

  function handleDraw() {
    const s = doSampleOnce();
    setLastSample(s);
    setHistory((prev) => [...prev, s.xbar]);
    setHighlight(new Set(s.idx));
    setFlash(true);
    window.setTimeout(() => setFlash(false), 800);
  }

  function handleBatch(times: number) {
    if (autoRunningRef.current) return;
    autoRunningRef.current = true;
    setAutoRunning(true);
    let i = 0;
    let lastSampleLocal: SecretSample | null = null;
    const addBuf: number[] = [];
    const step = () => {
      if (!autoRunningRef.current) {
        autoRunningRef.current = false;
        setAutoRunning(false);
        return;
      }
      const s = doSampleOnce();
      addBuf.push(s.xbar);
      lastSampleLocal = s;
      i++;
      if (i % 5 === 0 || i === times) {
        // splice 를 functional updater 밖에서 수행해 Strict Mode 가
        // updater 를 두 번 호출해도 데이터가 손실되지 않게 한다.
        const flush = addBuf.splice(0);
        setHistory((prev) => [...prev, ...flush]);
      }
      if (i < times) {
        requestAnimationFrame(step);
      } else {
        autoRunningRef.current = false;
        setAutoRunning(false);
        if (lastSampleLocal) {
          setLastSample(lastSampleLocal);
          setHighlight(new Set(lastSampleLocal.idx));
        }
      }
    };
    requestAnimationFrame(step);
  }

  function handleReset() {
    autoRunningRef.current = false;
    setAutoRunning(false);
    setPop(buildPopulation());
    setHistory([]);
    setHighlight(new Set());
    setLastSample(null);
    setFlash(false);
  }

  function handleToggleReveal() {
    setRevealed((r) => !r);
  }

  const diff = lastSample ? lastSample.xbar - m : 0;
  const sign = diff >= 0 ? "+" : "";

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* 좌: 모집단 시각화 + 표본 박스 */}
      <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/40 p-4">
        <h4 className="mb-2 flex items-center gap-2 text-base font-bold text-cyan-200">
          🔬 모집단 (Population)
        </h4>

        <div className="relative w-full overflow-hidden rounded-xl border border-cyan-300/20 bg-slate-900 aspect-[1.55]">
          <span className="absolute left-3 top-2 z-10 rounded-md bg-slate-900/70 px-2 py-0.5 text-xs font-bold tracking-wide text-slate-400">
            📊 200명의 점수 분포
          </span>
          {revealed && (
            <span className="absolute right-3 top-2 z-10 rounded-md border border-amber-300/40 bg-slate-900/85 px-2 py-1 text-sm font-extrabold text-amber-300">
              진짜 모평균 m = {m.toFixed(2)}
            </span>
          )}
          <canvas
            ref={popCanvasRef}
            width={POP_W}
            height={POP_H}
            className="block h-full w-full"
            aria-label="모집단 200명 점수 시각화"
          />
        </div>

        {/* 표본 박스 */}
        <div className="mt-3 rounded-xl border-2 border-emerald-400/40 bg-emerald-400/5 p-3">
          <div className="mb-2 flex items-center justify-between text-sm font-bold text-emerald-300">
            <span>📦 이번에 뽑은 표본</span>
            <span className="text-amber-100">
              {lastSample
                ? `X̄ = ${lastSample.xbar.toFixed(2)} (n=${lastSample.vals.length})`
                : "X̄ = --"}
            </span>
          </div>
          {lastSample ? (
            <div className="flex flex-wrap gap-1.5">
              {lastSample.vals.map((v, i) => (
                <SampleChip key={i} v={v} />
              ))}
            </div>
          ) : (
            <div className="py-1 text-sm italic text-slate-500">
              아직 표본을 뽑지 않았어요. 오른쪽에서 표본을 뽑아 보세요 →
            </div>
          )}
        </div>
      </div>

      {/* 우: 컨트롤 + 통계 + 히스토그램 */}
      <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/40 p-4">
        <h4 className="mb-2 flex items-center gap-2 text-base font-bold text-cyan-200">
          🎲 표본 추출 (Sampling)
        </h4>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <label htmlFor="popN" className="min-w-[80px] text-sm font-bold text-cyan-200">
              표본 크기 n
            </label>
            <input
              id="popN"
              type="range"
              min={3}
              max={50}
              value={n}
              onChange={(e) => setN(parseInt(e.target.value, 10))}
              className="flex-1 accent-cyan-300"
              disabled={autoRunning}
            />
            <span className="min-w-[55px] rounded-md bg-slate-900 px-2 py-1 text-center text-base font-extrabold text-amber-300">
              {n}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDraw}
              disabled={autoRunning}
              className="flex-1 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-blue-400 hover:to-blue-600 active:scale-95 disabled:opacity-40"
            >
              🎲 표본 1번 뽑기
            </button>
            <button
              type="button"
              onClick={() => handleBatch(50)}
              disabled={autoRunning}
              className="flex-1 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-violet-400 hover:to-violet-600 active:scale-95 disabled:opacity-40"
            >
              ⚡ 50번 뽑기
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleToggleReveal}
              className="flex-1 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-orange-400 hover:to-orange-600 active:scale-95"
            >
              {revealed ? "🙈 모평균 m 숨기기" : "🔍 모평균 m 공개"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-xl border border-slate-400/30 bg-slate-700/50 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-700/80 active:scale-95"
            >
              🔄 처음부터
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border-[1.5px] border-rose-400/50 bg-rose-500/10 p-2.5 text-center">
            <div className="text-[0.7rem] font-bold tracking-wide text-slate-400">모평균 m</div>
            <div
              className={`text-2xl font-extrabold text-rose-300 ${
                revealed ? "" : "select-none blur-[6px]"
              }`}
            >
              {revealed ? m.toFixed(2) : "??.?"}
            </div>
            <div className="text-[0.7rem] text-slate-400">고정된 상수</div>
          </div>
          <div
            className={`rounded-xl border-[1.5px] border-cyan-400/50 bg-cyan-500/10 p-2.5 text-center transition ${
              flash ? "ring-4 ring-amber-300/50" : ""
            }`}
          >
            <div className="text-[0.7rem] font-bold tracking-wide text-slate-400">
              최근 표본평균 X̄
            </div>
            <div className="text-2xl font-extrabold text-cyan-300">
              {lastSample ? lastSample.xbar.toFixed(2) : "--"}
            </div>
            <div className="text-[0.7rem] text-slate-400">
              {lastSample
                ? revealed
                  ? `X̄ − m = ${sign}${diff.toFixed(2)}`
                  : "차이: ?? (m을 공개해 보세요)"
                : "차이: --"}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
            <span>📈 표본평균 X̄ 의 분포</span>
            <span>
              누적: <span className="font-extrabold text-amber-300">{history.length}</span>회
            </span>
          </div>
          <canvas
            ref={histoCanvasRef}
            width={340}
            height={200}
            className="block h-[200px] w-full rounded-lg border border-cyan-300/20 bg-slate-900"
            aria-label="표본평균 X̄ 분포 히스토그램"
          />
          <div className="mt-2 max-h-20 overflow-y-auto rounded-lg border border-cyan-300/15 bg-slate-900/50 p-2">
            {history.length === 0 ? (
              <span className="text-xs italic text-slate-500">
                최근 X̄ 값이 여기에 나타나요
              </span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {history
                  .slice(-12)
                  .reverse()
                  .map((v, i) => (
                    <span
                      key={i}
                      className="rounded border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 text-xs font-bold text-cyan-200"
                    >
                      {v.toFixed(2)}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-violet-400/35 bg-violet-500/10 p-3 text-sm leading-6 text-violet-100">
          💡 <b className="text-violet-200">관찰해 봐요!</b>
          <br />• 표본을 뽑을 때마다 X̄ 값이 바뀌나요?
          <br />• 표본평균 X̄들의 분포는 어디 근처에 모이나요?
          <br />• n을 키우면 X̄의 변동은 어떻게 변하나요?
        </div>
      </div>
    </div>
  );
}

// 점수(30~98) 7단계 양자화 → 정적 Tailwind 임의값 클래스 (인라인 style 회피).
// Canvas 도트는 colorForScore 연속 hsla 그대로 → chip은 보기용 동일 톤 7단계.
const SCORE_BG_CLASS = [
  "bg-[hsl(220,75%,60%)]", // 30-39 파랑
  "bg-[hsl(183,75%,60%)]", // 40-49
  "bg-[hsl(147,75%,60%)]", // 50-59
  "bg-[hsl(110,75%,60%)]", // 60-69 초록
  "bg-[hsl(73,75%,60%)]", // 70-79
  "bg-[hsl(37,75%,60%)]", // 80-89
  "bg-[hsl(0,75%,60%)]", // 90+ 빨강
];

function scoreBin(v: number): number {
  if (v < 40) return 0;
  if (v < 50) return 1;
  if (v < 60) return 2;
  if (v < 70) return 3;
  if (v < 80) return 4;
  if (v < 90) return 5;
  return 6;
}

function SampleChip({ v }: { v: number }) {
  const bgCls = SCORE_BG_CLASS[scoreBin(v)];
  return (
    <span
      className={`inline-flex h-7 min-w-[42px] items-center justify-center rounded-md px-2 text-sm font-extrabold text-slate-900 [animation:chipIn_0.3s_cubic-bezier(.34,1.56,.64,1)_both] ${bgCls}`}
    >
      {v}
    </span>
  );
}

// =================================================================
// TAB 2 — 미세먼지 지도 (SVG + d3-geo)
// =================================================================
const MAP_W = 540;
const MAP_H = 700;

const CITY_DATA: Record<string, number> = {
  서울: 62,
  부산: 29,
  대구: 70,
  인천: 47,
  광주: 61,
  대전: 46,
  울산: 52,
  세종: 59,
  경기: 67,
  강원: 30,
  충북: 77,
  충남: 53,
  경북: 74,
  경남: 57,
  전북: 65,
  전남: 28,
  제주: 24,
};
const POP_MEAN_DUST =
  Object.values(CITY_DATA).reduce((a, b) => a + b, 0) / Object.keys(CITY_DATA).length;

const EXTERNAL_NAMES = new Set(["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종"]);

const PROVINCE_CENTROIDS: Record<string, [number, number]> = {
  서울: [126.99, 37.55],
  부산: [129.07, 35.18],
  대구: [128.6, 35.87],
  인천: [126.55, 37.46],
  광주: [126.85, 35.15],
  대전: [127.38, 36.35],
  울산: [129.31, 35.54],
  세종: [127.29, 36.48],
  경기: [127.2, 37.43],
  강원: [128.3, 37.85],
  충북: [127.7, 36.8],
  충남: [126.8, 36.6],
  경북: [128.85, 36.3],
  경남: [128.25, 35.3],
  전북: [127.15, 35.72],
  전남: [126.9, 34.8],
  제주: [126.55, 33.4],
};

const PROVINCE_COLORS: Record<string, string> = {
  서울: "#ef4444",
  부산: "#f97316",
  대구: "#f59e0b",
  인천: "#eab308",
  광주: "#84cc16",
  대전: "#22c55e",
  울산: "#10b981",
  세종: "#06b6d4",
  경기: "#0ea5e9",
  강원: "#3b82f6",
  충북: "#6366f1",
  충남: "#8b5cf6",
  경북: "#a855f7",
  경남: "#d946ef",
  전북: "#ec4899",
  전남: "#f43f5e",
  제주: "#14b8a6",
};

const GEO_URLS = [
  "https://cdn.jsdelivr.net/gh/southkorea/southkorea-maps@master/kostat/2013/json/skorea_provinces_geo_simple.json",
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_provinces_geo_simple.json",
  "https://cdn.jsdelivr.net/gh/southkorea/southkorea-maps@master/kostat/2018/json/skorea-provinces-2018-geo.json",
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-provinces-2018-geo.json",
  "https://cdn.jsdelivr.net/gh/southkorea/southkorea-maps@master/kostat/2013/json/skorea_provinces_geo.json",
];

type GeoFeature = Feature<Geometry, GeoJsonProperties>;
type GeoFC = FeatureCollection<Geometry, GeoJsonProperties>;

type ProvinceShape = {
  name: string;
  value: number;
  pathD: string;
  cx: number;
  cy: number;
  area: number;
  isExt: boolean;
  ext?: { boxX: number; boxY: number };
};

function assignProvinces(features: GeoFeature[]): Map<number, string> {
  type Pair = { fi: number; name: string; d: number };
  const pairs: Pair[] = [];
  features.forEach((feat, fi) => {
    let lon: number;
    let lat: number;
    try {
      const c = geoCentroid(feat);
      lon = c[0];
      lat = c[1];
    } catch {
      return;
    }
    if (!isFinite(lon) || !isFinite(lat)) return;
    for (const [name, [pLon, pLat]] of Object.entries(PROVINCE_CENTROIDS)) {
      const dx = lon - pLon;
      const dy = lat - pLat;
      pairs.push({ fi, name, d: dx * dx + dy * dy });
    }
  });
  pairs.sort((a, b) => a.d - b.d);
  const fUsed = new Set<number>();
  const nUsed = new Set<string>();
  const assignment = new Map<number, string>();
  for (const p of pairs) {
    if (fUsed.has(p.fi) || nUsed.has(p.name)) continue;
    fUsed.add(p.fi);
    nUsed.add(p.name);
    assignment.set(p.fi, p.name);
  }
  return assignment;
}

function computeExternalLabel(cx: number, cy: number): { boxX: number; boxY: number } {
  const mcx = MAP_W / 2;
  const mcy = MAP_H / 2;
  let dx = cx - mcx;
  let dy = cy - mcy;
  const d = Math.hypot(dx, dy) || 1;
  dx /= d;
  dy /= d;
  const dist = 55;
  const lx = cx + dx * dist;
  const ly = cy + dy * dist;
  return {
    boxX: Math.max(28, Math.min(MAP_W - 28, lx)),
    boxY: Math.max(20, Math.min(MAP_H - 24, ly)),
  };
}

async function loadGeo(): Promise<GeoFC> {
  let lastErr: unknown = null;
  for (const url of GEO_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = (await res.json()) as GeoFC;
      if (data && data.features && data.features.length >= 15) {
        return data;
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("지도 데이터를 가져올 수 없습니다");
}

function buildShapes(geo: GeoFC): ProvinceShape[] {
  const projection = geoMercator().fitSize([MAP_W, MAP_H], geo);
  const pathGen = geoPath(projection);
  const shapes: ProvinceShape[] = [];
  const assignment = assignProvinces(geo.features);
  geo.features.forEach((feat, fi) => {
    const name = assignment.get(fi);
    if (!name || !(name in CITY_DATA)) return;
    const value = CITY_DATA[name];
    const d = pathGen(feat);
    const [cx, cy] = pathGen.centroid(feat);
    const area = pathGen.area(feat);
    if (!d || isNaN(cx) || isNaN(cy)) return;
    shapes.push({
      name,
      value,
      pathD: d,
      cx,
      cy,
      area,
      isExt: EXTERNAL_NAMES.has(name),
      ext: EXTERNAL_NAMES.has(name) ? computeExternalLabel(cx, cy) : undefined,
    });
  });
  return shapes;
}

type DustSample = { idx: number[]; xbar: number };

function DustMapTab() {
  const [shapes, setShapes] = useState<ProvinceShape[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [n, setN] = useState(3);
  const [lastSample, setLastSample] = useState<DustSample | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [highlight, setHighlight] = useState<Set<number>>(() => new Set());
  const [flash, setFlash] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const autoRunningRef = useRef(false);
  const aliveRef = useRef(false);

  useEffect(() => {
    aliveRef.current = true;
    loadGeo()
      .then((geo) => {
        if (!aliveRef.current) return;
        try {
          const built = buildShapes(geo);
          if (built.length < 15) {
            setLoadError(`시도 데이터 ${built.length}개만 매칭됨 (17개 필요)`);
          } else {
            setShapes(built);
          }
        } catch (e) {
          setLoadError(e instanceof Error ? e.message : String(e));
        } finally {
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!aliveRef.current) return;
        const msg = err instanceof Error ? err.message : String(err);
        setLoadError(msg);
        setLoading(false);
      });
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const sortedShapes = useMemo(
    () => [...shapes].sort((a, b) => b.area - a.area),
    [shapes]
  );

  const F = shapes.length;
  const cappedN = Math.min(n, Math.max(1, F));

  function doSampleOnce(): DustSample {
    const idx = sampleIndices(F, cappedN);
    const vals = idx.map((i) => shapes[i].value);
    const xbar = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { idx, xbar };
  }

  const handleDraw = useCallback(() => {
    if (F === 0) return;
    const s = doSampleOnce();
    setLastSample(s);
    setHistory((prev) => [...prev, s.xbar]);
    setHighlight(new Set(s.idx));
    setFlash(true);
    window.setTimeout(() => setFlash(false), 800);
  }, [F, cappedN, shapes]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleBatch(times: number) {
    if (F === 0 || autoRunningRef.current) return;
    autoRunningRef.current = true;
    setAutoRunning(true);
    let i = 0;
    let last: DustSample | null = null;
    const buf: number[] = [];
    const step = () => {
      if (!autoRunningRef.current) {
        autoRunningRef.current = false;
        setAutoRunning(false);
        return;
      }
      const s = doSampleOnce();
      buf.push(s.xbar);
      last = s;
      i++;
      if (i % 4 === 0 || i === times) {
        // splice 는 functional updater 밖에서 — Strict Mode 의 updater
        // double-invoke 로 인한 데이터 손실 회피.
        const flush = buf.splice(0);
        setHistory((prev) => [...prev, ...flush]);
      }
      if (i < times) {
        requestAnimationFrame(step);
      } else {
        autoRunningRef.current = false;
        setAutoRunning(false);
        if (last) {
          setLastSample(last);
          setHighlight(new Set(last.idx));
        }
      }
    };
    requestAnimationFrame(step);
  }

  function handleReset() {
    autoRunningRef.current = false;
    setAutoRunning(false);
    setLastSample(null);
    setHistory([]);
    setHighlight(new Set());
    setFlash(false);
  }

  const diff = lastSample ? lastSample.xbar - POP_MEAN_DUST : 0;
  const sign = diff >= 0 ? "+" : "";

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
      {/* 좌: 지도 */}
      <div className="rounded-2xl border border-pink-300/15 bg-slate-900/40 p-4">
        <h4 className="mb-2 flex items-center gap-2 text-base font-bold text-violet-200">
          🌏 모집단 = 17개 시도
        </h4>
        <div className="relative w-full overflow-hidden rounded-xl border border-violet-400/25 bg-slate-900 aspect-[0.78]">
          <div className="absolute left-2.5 top-2.5 z-10 rounded-lg border border-amber-300/40 bg-slate-900/85 px-3 py-1 text-xs font-bold text-amber-100">
            📌 단위: μg/m³ · <b className="text-amber-300">모평균 m = {POP_MEAN_DUST.toFixed(0)}</b>
          </div>
          <KoreaMap
            shapes={sortedShapes}
            highlight={highlight}
          />
          {(loading || loadError) && (
            <div
              className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/85 p-5 text-center transition ${
                loadError ? "" : "text-slate-300"
              }`}
            >
              {!loadError && (
                <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-violet-400/25 border-t-violet-400" />
              )}
              <div
                className={`text-sm font-bold ${
                  loadError ? "text-rose-300" : "text-violet-300"
                }`}
              >
                {loadError ? "⚠️ 한국 지도 데이터를 불러올 수 없어요" : "🌏 한국 지도를 불러오는 중..."}
              </div>
              <div className="text-xs text-slate-400">
                {loadError ? (
                  <>
                    네트워크 연결을 확인하고 새로고침해 주세요.
                    <br />({loadError})
                  </>
                ) : (
                  "통계청 행정구역 데이터 (GeoJSON)"
                )}
              </div>
            </div>
          )}
          <div className="absolute bottom-2.5 right-2.5 z-10 rounded-lg border border-cyan-300/25 bg-slate-900/85 px-2.5 py-1.5 text-[0.72rem] leading-tight text-slate-300">
            <div>🎨 색: 시도 구분</div>
            <div>🔢 숫자: μg/m³</div>
          </div>
        </div>
      </div>

      {/* 우: 컨트롤 */}
      <div className="rounded-2xl border border-pink-300/15 bg-slate-900/40 p-4">
        <h4 className="mb-2 flex items-center gap-2 text-base font-bold text-violet-200">
          🎯 표본 추출
        </h4>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <label htmlFor="dustN" className="min-w-[90px] text-sm font-bold text-violet-200">
              표본 크기 n
            </label>
            <input
              id="dustN"
              type="range"
              min={1}
              max={16}
              value={n}
              onChange={(e) => setN(parseInt(e.target.value, 10))}
              className="flex-1 accent-pink-400"
              disabled={autoRunning}
            />
            <span className="min-w-[55px] rounded-md bg-slate-900 px-2 py-1 text-center text-base font-extrabold text-amber-300">
              {n}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDraw}
              disabled={autoRunning || F === 0}
              className="flex-1 rounded-xl bg-gradient-to-br from-pink-500 to-pink-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-pink-400 hover:to-pink-600 active:scale-95 disabled:opacity-40"
            >
              🎯 표본 1번 뽑기
            </button>
            <button
              type="button"
              onClick={() => handleBatch(20)}
              disabled={autoRunning || F === 0}
              className="flex-1 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-violet-400 hover:to-violet-600 active:scale-95 disabled:opacity-40"
            >
              ⚡ 20번 뽑기
            </button>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-xl border border-slate-400/30 bg-slate-700/50 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-700/80 active:scale-95"
          >
            🔄 처음부터
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border-[1.5px] border-rose-400/50 bg-rose-500/10 p-2.5 text-center">
            <div className="text-[0.7rem] font-bold tracking-wide text-slate-400">모평균 m</div>
            <div className="text-2xl font-extrabold text-rose-300">
              {POP_MEAN_DUST.toFixed(2)}
            </div>
            <div className="text-[0.7rem] text-slate-400">17개 시도 평균</div>
          </div>
          <div
            className={`rounded-xl border-[1.5px] border-cyan-400/50 bg-cyan-500/10 p-2.5 text-center transition ${
              flash ? "ring-4 ring-amber-300/50" : ""
            }`}
          >
            <div className="text-[0.7rem] font-bold tracking-wide text-slate-400">
              표본평균 X̄
            </div>
            <div className="text-2xl font-extrabold text-cyan-300">
              {lastSample ? lastSample.xbar.toFixed(2) : "--"}
            </div>
            <div className="text-[0.7rem] text-slate-400">
              {lastSample
                ? `X̄ − m = ${sign}${diff.toFixed(2)}`
                : "X̄ − m = --"}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border-2 border-emerald-400/40 bg-emerald-400/5 p-3">
          <div className="mb-1.5 flex items-center justify-between text-sm font-bold text-emerald-300">
            <span>📦 이번에 뽑힌 시도</span>
            <span className="text-amber-100">
              {lastSample ? `n = ${lastSample.idx.length}` : "n = --"}
            </span>
          </div>
          {lastSample ? (
            <div className="flex flex-wrap gap-1.5">
              {lastSample.idx.map((i, k) => {
                const s = shapes[i];
                if (!s) return null;
                return <DustChip key={k} name={s.name} value={s.value} />;
              })}
            </div>
          ) : (
            <div className="text-sm italic text-slate-500">아직 추출하지 않았어요</div>
          )}
        </div>

        <div className="mt-3 rounded-xl border border-cyan-300/15 bg-slate-900/50 p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
            <span>📈 표본평균 X̄들의 분포</span>
            <span>
              누적 <span className="font-extrabold text-amber-300">{history.length}</span>회
            </span>
          </div>
          <XbarCanvas history={history} />
        </div>

        <div className="mt-3 rounded-xl border border-pink-400/35 bg-pink-500/10 p-3 text-sm leading-6 text-pink-100">
          💡 <b className="text-pink-200">실험해 봐요!</b>
          <br />• n=3일 때와 n=10일 때, X̄ 값들이 m=53 주위에 얼마나 모이나요?
          <br />• 친구와 같은 n으로 뽑아도 X̄이 서로 다른 이유는?
          <br />• X̄들의 평균은 m=53과 가까워지나요?
        </div>
      </div>
    </div>
  );
}

function KoreaMap({
  shapes,
  highlight,
}: {
  shapes: ProvinceShape[];
  highlight: Set<number>;
}) {
  const has = highlight.size > 0;
  // index는 원본 shapes 기준이어야 highlight Set과 매칭.
  return (
    <svg
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full"
      aria-label="한국 시도 지도"
    >
      {/* 폴리곤 (큰 도 먼저, 광역시 나중에) */}
      {shapes.map((s) => {
        const i = shapes.indexOf(s);
        const sampled = highlight.has(i);
        const dimmed = has && !sampled;
        return (
          <path
            key={`p-${s.name}`}
            d={s.pathD}
            fill={PROVINCE_COLORS[s.name] ?? "#64748b"}
            stroke={sampled ? "#fef3c7" : "rgba(255,255,255,0.55)"}
            strokeWidth={sampled ? 2.2 : 0.8}
            strokeLinejoin="round"
            opacity={dimmed ? 0.32 : 1}
            className={
              sampled
                ? "[filter:drop-shadow(0_0_8px_#fbbf24)] [animation:provPulse_1.4s_ease-in-out_infinite]"
                : ""
            }
          />
        );
      })}

      {/* 외부 콜아웃 (광역시) */}
      {shapes.map((s) => {
        if (!s.isExt || !s.ext) return null;
        const i = shapes.indexOf(s);
        const sampled = highlight.has(i);
        const dimmed = has && !sampled;
        const boxW = 42;
        const boxH = 30;
        const bx = s.ext.boxX - boxW / 2;
        const by = s.ext.boxY - boxH / 2;
        return (
          <g key={`c-${s.name}`} opacity={dimmed ? 0.3 : 1}>
            <line
              x1={s.cx}
              y1={s.cy}
              x2={s.ext.boxX}
              y2={s.ext.boxY}
              stroke="rgba(203,213,225,.55)"
              strokeWidth={1}
              fill="none"
            />
            <rect
              x={bx}
              y={by}
              width={boxW}
              height={boxH}
              rx={6}
              fill={sampled ? "rgba(251,191,36,.18)" : "rgba(15,23,42,.88)"}
              stroke={sampled ? "#fbbf24" : "rgba(168,85,247,.45)"}
              strokeWidth={sampled ? 1.8 : 1}
              className={sampled ? "[filter:drop-shadow(0_0_6px_rgba(251,191,36,.6))]" : ""}
            />
            <text textAnchor="middle">
              <tspan
                x={s.ext.boxX}
                y={s.ext.boxY - 2}
                fontWeight={800}
                fontSize={10.5}
                fill={sampled ? "#fef3c7" : "#e2e8f0"}
              >
                {s.name}
              </tspan>
              <tspan x={s.ext.boxX} y={s.ext.boxY + 11} fontWeight={900} fontSize={11.5} fill="#fbbf24">
                {s.value}
              </tspan>
            </text>
          </g>
        );
      })}

      {/* 내부 라벨 (큰 도 + 제주) */}
      {shapes.map((s) => {
        if (s.isExt) return null;
        const i = shapes.indexOf(s);
        const sampled = highlight.has(i);
        const dimmed = has && !sampled;
        return (
          <g key={`l-${s.name}`} opacity={dimmed ? 0.3 : 1} pointerEvents="none">
            <text
              x={s.cx}
              y={s.cy - 2}
              textAnchor="middle"
              fontWeight={800}
              fontSize={11.5}
              fill="#0f172a"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={2.5}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {s.name}
            </text>
            <text
              x={s.cx}
              y={s.cy + 13}
              textAnchor="middle"
              fontWeight={900}
              fontSize={13}
              fill="#0f172a"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth={2.8}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {s.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// 17개 시도 정적 색상 → 정적 Tailwind 임의값 클래스 맵 (인라인 style 회피)
const DUST_CHIP_BORDER: Record<string, string> = {
  서울: "border-[#ef4444]",
  부산: "border-[#f97316]",
  대구: "border-[#f59e0b]",
  인천: "border-[#eab308]",
  광주: "border-[#84cc16]",
  대전: "border-[#22c55e]",
  울산: "border-[#10b981]",
  세종: "border-[#06b6d4]",
  경기: "border-[#0ea5e9]",
  강원: "border-[#3b82f6]",
  충북: "border-[#6366f1]",
  충남: "border-[#8b5cf6]",
  경북: "border-[#a855f7]",
  경남: "border-[#d946ef]",
  전북: "border-[#ec4899]",
  전남: "border-[#f43f5e]",
  제주: "border-[#14b8a6]",
};

function DustChip({ name, value }: { name: string; value: number }) {
  const borderCls = DUST_CHIP_BORDER[name] ?? "border-slate-500";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border-[1.5px] bg-slate-900/70 px-2.5 py-1 text-xs font-extrabold [animation:chipIn_0.25s_cubic-bezier(.34,1.56,.64,1)_both] ${borderCls}`}
    >
      <span className="text-slate-200">{name}</span>
      <span className="text-amber-300">{value}</span>
    </span>
  );
}

function XbarCanvas({ history }: { history: number[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 320;
  const H = 140;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 28;
    const padR = 12;
    const padT = 12;
    const padB = 26;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const lo = 0;
    const hi = 100;

    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = padL + (plotW * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }

    // m 선
    const mx = padL + ((POP_MEAN_DUST - lo) / (hi - lo)) * plotW;
    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(mx, padT);
    ctx.lineTo(mx, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fb7185";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`m=${POP_MEAN_DUST.toFixed(0)}`, mx, padT - 2);

    // 점 쌓기
    const nBins = 40;
    const binW = (hi - lo) / nBins;
    const bins = new Array<number>(nBins).fill(0);
    const dotR = 3.5;
    history.forEach((v, idx) => {
      let bi = Math.floor((v - lo) / binW);
      if (bi < 0) bi = 0;
      if (bi >= nBins) bi = nBins - 1;
      const x = padL + (bi + 0.5) * (plotW / nBins);
      const stackH = bins[bi];
      const y = padT + plotH - (stackH + 0.5) * (dotR * 2 + 1);
      if (y > padT) {
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        const isLast = idx === history.length - 1;
        ctx.fillStyle = isLast ? "#fbbf24" : "rgba(56,189,248,0.75)";
        ctx.fill();
        if (isLast) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        bins[bi]++;
      }
    });

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    for (const v of [0, 25, 50, 75, 100]) {
      const x = padL + ((v - lo) / (hi - lo)) * plotW;
      ctx.fillText(String(v), x, H - padB + 13);
    }
    ctx.textAlign = "left";
    ctx.fillText("X̄", 4, padT + plotH / 2);
  }, [history]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[140px] w-full rounded-lg bg-slate-900"
      aria-label="표본평균 X̄ 분포"
    />
  );
}
