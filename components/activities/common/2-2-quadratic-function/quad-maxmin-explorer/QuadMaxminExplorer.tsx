"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "vertex_extreme",
    prompt:
      "이차함수 y = a(x − p)² + q 에서 실수 전체에서의 최대/최소를 꼭짓점 (p, q) 와 a 의 부호로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: a > 0 → 아래로 볼록 → 꼭짓점이 가장 낮은 점 → x = p 에서 최솟값 q, 최댓값 없음(±∞). a < 0 → 위로 볼록 → 꼭짓점이 가장 높은 점 → x = p 에서 최댓값 q, 최솟값 없음.",
  },
  {
    id: "closed_interval_cases",
    prompt:
      "닫힌 구간 [α, β] 에서의 최대·최소를 구할 때, 꼭짓점의 x좌표가 구간 안/밖 어디에 있는지에 따라 어떻게 달라지는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 꼭짓점이 구간 안(α ≤ p ≤ β) 이면 x = α, p, β 세 점의 함숫값을 모두 비교한다. 꼭짓점이 구간 밖이면 그 구간에서 함수는 단조이므로 두 끝점 f(α), f(β) 만 비교하면 충분하다. 가장 큰 값이 최댓값, 가장 작은 값이 최솟값.",
  },
];

// ─── 수식 유틸 ──────────────────────────────────────────────
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function fmtNum(n: number): string {
  const r = round2(n);
  return r % 1 === 0 ? String(r) : r.toFixed(1);
}
function fmtSigned(n: number): string {
  // " − 3" 또는 " + 3" 형태
  if (n >= 0) return ` + ${fmtNum(n)}`;
  return ` − ${fmtNum(-n)}`;
}

// ─── SVG Auto-viewport 유틸 ─────────────────────────────────
type Viewport = {
  ox: number;
  oy: number;
  sc: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

function computeView(keyXs: number[], keyYs: number[], W: number, H: number, zoom: number): Viewport {
  let xLo = Math.min(...keyXs);
  let xHi = Math.max(...keyXs);
  let yLo = Math.min(...keyYs);
  let yHi = Math.max(...keyYs);
  const xSpan = Math.max(xHi - xLo, 2);
  const ySpan = Math.max(yHi - yLo, 2);
  const xPad = xSpan * 0.22;
  const yPad = ySpan * 0.22;
  xLo -= xPad;
  xHi += xPad;
  yLo -= yPad;
  yHi += yPad;
  const margin = 44;
  const scX = (W - margin * 2) / (xHi - xLo);
  const scY = (H - margin * 2) / (yHi - yLo);
  let sc = Math.min(scX, scY) * zoom;
  sc = Math.max(3, Math.min(250, sc));
  const midX = (xLo + xHi) / 2;
  const midY = (yLo + yHi) / 2;
  const ox = W / 2 - midX * sc;
  const oy = H / 2 + midY * sc;
  return {
    ox,
    oy,
    sc,
    xMin: -ox / sc,
    xMax: (W - ox) / sc,
    yMin: (oy - H) / sc,
    yMax: oy / sc,
  };
}

function niceStep(span: number): number {
  if (span <= 0) return 1;
  const rough = span / 6;
  const pwr = Math.pow(10, Math.floor(Math.log10(rough)));
  const f = rough / pwr;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * pwr;
}

function buildParabolaSegment(
  a: number,
  p: number,
  q: number,
  v: Viewport,
  xFrom: number,
  xTo: number,
): string {
  const steps = Math.max(150, Math.round((xTo - xFrom) * 60));
  const dx = (xTo - xFrom) / steps;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const wx = xFrom + i * dx;
    const wy = a * (wx - p) * (wx - p) + q;
    const px = v.ox + wx * v.sc;
    const py = v.oy - wy * v.sc;
    parts.push(`${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  return parts.join(" ");
}

// ─── 공용 SVG 베이스 (격자 + 축 + 눈금) ─────────────────────
function GridAxes({ W, H, v }: { W: number; H: number; v: Viewport }) {
  const xStep = niceStep(v.xMax - v.xMin);
  const yStep = niceStep(v.yMax - v.yMin);
  const grids: ReactNode[] = [];
  const ticks: ReactNode[] = [];

  const startX = Math.ceil(v.xMin / xStep) * xStep;
  for (let gx = startX; gx <= v.xMax * 1.001; gx += xStep) {
    const px = v.ox + gx * v.sc;
    grids.push(
      <line
        key={`vx${gx.toFixed(3)}`}
        x1={px}
        y1={0}
        x2={px}
        y2={H}
        stroke="rgba(150,170,220,0.15)"
        strokeDasharray="3 5"
        strokeWidth="1"
      />,
    );
    if (Math.abs(gx) >= xStep * 0.05) {
      const ly = Math.min(Math.max(v.oy, 8), H - 6) + 12;
      ticks.push(
        <text
          key={`tx${gx.toFixed(3)}`}
          x={px}
          y={ly}
          fill="rgba(160,180,230,0.8)"
          fontSize="10"
          textAnchor="middle"
        >
          {Number(gx.toFixed(4))}
        </text>,
      );
    }
  }
  const startY = Math.ceil(v.yMin / yStep) * yStep;
  for (let gy = startY; gy <= v.yMax * 1.001; gy += yStep) {
    const py = v.oy - gy * v.sc;
    grids.push(
      <line
        key={`hy${gy.toFixed(3)}`}
        x1={0}
        y1={py}
        x2={W}
        y2={py}
        stroke="rgba(150,170,220,0.15)"
        strokeDasharray="3 5"
        strokeWidth="1"
      />,
    );
    if (Math.abs(gy) >= yStep * 0.05) {
      const lx = Math.min(Math.max(v.ox, 4), W - 4) - 4;
      ticks.push(
        <text
          key={`ty${gy.toFixed(3)}`}
          x={lx}
          y={py + 4}
          fill="rgba(160,180,230,0.8)"
          fontSize="10"
          textAnchor="end"
        >
          {Number(gy.toFixed(4))}
        </text>,
      );
    }
  }
  const ayC = Math.max(0, Math.min(H, v.oy));
  const axC = Math.max(0, Math.min(W, v.ox));
  return (
    <>
      {grids}
      <line x1={0} y1={ayC} x2={W} y2={ayC} stroke="rgba(180,200,255,0.55)" strokeWidth="1.5" />
      <line x1={axC} y1={0} x2={axC} y2={H} stroke="rgba(180,200,255,0.55)" strokeWidth="1.5" />
      {ticks}
      <text x={W - 6} y={Math.min(Math.max(v.oy - 6, 10), H - 4)} fill="rgba(190,210,255,0.9)" fontSize="12" fontWeight="bold" textAnchor="end">
        x
      </text>
      <text x={Math.min(Math.max(v.ox + 10, 10), W - 4)} y={12} fill="rgba(190,210,255,0.9)" fontSize="12" fontWeight="bold" textAnchor="middle">
        y
      </text>
    </>
  );
}

function PlotSVG({
  W,
  H,
  v,
  children,
  ariaLabel = "이차함수 그래프",
}: {
  W: number;
  H: number;
  v: Viewport;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto block h-auto w-full max-w-[520px]"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id="qmmBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0a0f22" />
          <stop offset="100%" stopColor="#0c1628" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#qmmBg)" />
      <GridAxes W={W} H={H} v={v} />
      {children}
    </svg>
  );
}

// ─── 공용 Slider ───────────────────────────────────────────
function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  color,
  ariaLabel,
}: {
  label: ReactNode;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  color?: string;
  ariaLabel: string;
}) {
  const colorCls = color ?? "text-cyan-200";
  return (
    <div className="space-y-1">
      <div className={"flex items-center justify-between text-xs font-bold " + colorCls}>
        <span>{label}</span>
        <span className="font-mono">{fmtNum(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        className="w-full accent-violet-400"
      />
    </div>
  );
}

// ─── 메인 ───────────────────────────────────────────────────
type TabId = 0 | 1 | 2 | 3;
const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: 0, emoji: "🌐", label: "실수 전체" },
  { id: 1, emoji: "📏", label: "닫힌 구간" },
  { id: 2, emoji: "🔬", label: "실험실" },
  { id: 3, emoji: "✏️", label: "연습 문제" },
];

export default function QuadMaxminExplorer() {
  const [tab, setTab] = useState<TabId>(0);
  const [done, setDone] = useState<boolean[]>(() => [false, false, false, false]);

  function markDone(i: TabId) {
    setDone((d) => {
      if (d[i]) return d;
      const n = [...d];
      n[i] = true;
      return n;
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">📈 이차함수의 최대·최소 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          이차함수 y = a(x − p)² + q 에서 <b className="text-cyan-200">실수 전체 / 닫힌 구간</b> 의
          최대·최소를 그래프와 함께 탐구해 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {TABS.map((t) => {
          const active = tab === t.id;
          const isDone = done[t.id];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                "rounded-xl border-2 px-2 py-2 text-center text-xs font-bold transition " +
                (active
                  ? "border-cyan-400/60 bg-gradient-to-br from-cyan-400/15 to-violet-400/15 text-cyan-100"
                  : isDone
                  ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {t.emoji} {t.label}
              {isDone ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}>
        <Tab0FullRange onDone={() => markDone(0)} />
      </div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <Tab1Cases onDone={() => markDone(1)} />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <Tab2Lab onDone={() => markDone(2)} />
      </div>
      <div className={tab === 3 ? "mt-5" : "mt-5 hidden"}>
        <Tab3Quiz onDone={() => markDone(3)} />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── TAB 0 — 실수 전체 ────────────────────────────────────
function Tab0FullRange({ onDone }: { onDone: () => void }) {
  const [a, setA] = useState(1);
  const [p, setP] = useState(0);
  const [q, setQ] = useState(0);
  const [touched, setTouched] = useState({ a: false, p: false, q: false });
  useEffect(() => {
    if (touched.a && touched.p && touched.q) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touched.a, touched.p, touched.q]);

  const W = 520;
  const H = 320;
  const isFlat = Math.abs(a) < 0.001;

  const v = useMemo(() => {
    const aSafe = isFlat ? 0.1 : a;
    const xSpread = Math.max(3.5, Math.min(9, 2.8 / Math.sqrt(Math.abs(aSafe))));
    const keyXs = [p - xSpread, p, p + xSpread];
    const keyYs = keyXs.map((x) => aSafe * (x - p) * (x - p) + q);
    return computeView(keyXs, keyYs, W, H, 1);
  }, [a, p, q, isFlat]);

  const pathD = useMemo(() => {
    if (isFlat) return "";
    return buildParabolaSegment(a, p, q, v, v.xMin, v.xMax);
  }, [a, p, q, v, isFlat]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">🌐 실수 전체에서의 최대·최소</p>
        <p className="mt-1 text-sm leading-7 text-slate-300">
          이차함수 <b className="text-cyan-200">y = a(x − p)² + q</b> 의 a 부호에 따라 최대·최소가
          달라집니다. 슬라이더로 a, p, q 를 바꿔 보세요.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div>
            <p className="text-center font-mono text-base font-extrabold text-cyan-200">
              y = {fmtNum(a)}(x{fmtSigned(-p)})²{fmtSigned(q)}
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              <PlotSVG W={W} H={H} v={v} ariaLabel="이차함수 그래프">
                {!isFlat ? (
                  <>
                    <path d={pathD} fill="none" stroke="#6888ff" strokeWidth="2.5" />
                    <line
                      x1={v.ox + p * v.sc}
                      y1={0}
                      x2={v.ox + p * v.sc}
                      y2={H}
                      stroke="rgba(255,215,0,0.4)"
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                    />
                    <circle cx={v.ox + p * v.sc} cy={v.oy - q * v.sc} r="8" fill="#ffd700" />
                    <text
                      x={v.ox + p * v.sc}
                      y={v.oy - q * v.sc + (a > 0 ? -14 : 18)}
                      fill="#ffd700"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      꼭짓점 ({fmtNum(p)}, {fmtNum(q)})
                    </text>
                  </>
                ) : null}
              </PlotSVG>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <Slider
                label={<>a (계수)</>}
                color="text-pink-300"
                min={-3}
                max={3}
                step={0.5}
                value={a}
                onChange={(v0) => {
                  setA(v0);
                  setTouched((t) => ({ ...t, a: true }));
                }}
                ariaLabel="계수 a"
              />
              <Slider
                label={<>p (꼭짓점 x좌표)</>}
                color="text-amber-300"
                min={-4}
                max={4}
                step={0.5}
                value={p}
                onChange={(v0) => {
                  setP(v0);
                  setTouched((t) => ({ ...t, p: true }));
                }}
                ariaLabel="꼭짓점 x좌표 p"
              />
              <Slider
                label={<>q (꼭짓점 y좌표)</>}
                color="text-amber-300"
                min={-4}
                max={4}
                step={0.5}
                value={q}
                onChange={(v0) => {
                  setQ(v0);
                  setTouched((t) => ({ ...t, q: true }));
                }}
                ariaLabel="꼭짓점 y좌표 q"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm leading-7">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">분석 결과</p>
              {isFlat ? (
                <p className="mt-1 text-rose-300">⚠️ a = 0 이면 이차함수가 아닙니다.</p>
              ) : a > 0 ? (
                <div className="mt-1 space-y-0.5">
                  <p>
                    <span className="rounded border border-cyan-400/40 bg-cyan-400/15 px-2 py-0.5 text-xs font-bold text-cyan-200">
                      a = {fmtNum(a)} &gt; 0
                    </span>{" "}
                    아래로 볼록
                  </p>
                  <p>
                    x = {fmtNum(p)} 일 때{" "}
                    <span className="rounded border border-emerald-400/40 bg-emerald-400/15 px-2 py-0.5 text-xs font-bold text-emerald-200">
                      최솟값 {fmtNum(q)}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    최댓값은 존재하지 않습니다 (x → ±∞ 이면 y → +∞)
                  </p>
                </div>
              ) : (
                <div className="mt-1 space-y-0.5">
                  <p>
                    <span className="rounded border border-rose-400/40 bg-rose-400/15 px-2 py-0.5 text-xs font-bold text-rose-200">
                      a = {fmtNum(a)} &lt; 0
                    </span>{" "}
                    위로 볼록
                  </p>
                  <p>
                    x = {fmtNum(p)} 일 때{" "}
                    <span className="rounded border border-rose-400/40 bg-rose-400/15 px-2 py-0.5 text-xs font-bold text-rose-200">
                      최댓값 {fmtNum(q)}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    최솟값은 존재하지 않습니다 (x → ±∞ 이면 y → −∞)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-4">
        <p className="text-sm font-extrabold text-cyan-200">💡 핵심 정리</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-md border border-cyan-400/40 bg-cyan-400/10 p-3 text-sm leading-6 text-cyan-100">
            <p className="font-extrabold">a &gt; 0 — 아래로 볼록</p>
            <p>꼭짓점이 가장 낮은 점 → x = p 에서 최솟값 q</p>
            <p className="text-xs text-cyan-200/80">최댓값 없음 (x → ±∞ → y → +∞)</p>
          </div>
          <div className="rounded-md border border-rose-400/40 bg-rose-400/10 p-3 text-sm leading-6 text-rose-100">
            <p className="font-extrabold">a &lt; 0 — 위로 볼록</p>
            <p>꼭짓점이 가장 높은 점 → x = p 에서 최댓값 q</p>
            <p className="text-xs text-rose-200/80">최솟값 없음 (x → ±∞ → y → −∞)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 1 — 닫힌 구간 케이스 ─────────────────────────────
type CasePreset = { a: number; p: number; q: number; aL: number; b: number };
const CASE_PRESETS: Record<1 | 2 | 3, CasePreset> = {
  1: { a: 1, p: 0, q: -1, aL: -3, b: 3 },
  // 꼭짓점이 구간 밖이면 a=1 로는 f값이 너무 커져 그래프가 세로로 늘어남.
  // a 를 낮춰 포물선을 넓게 → 단조증가/감소 추세가 잘 보이도록.
  2: { a: 0.3, p: -4, q: 0, aL: -2, b: 3 },
  3: { a: 0.3, p: 4, q: 0, aL: -3, b: 2 },
};

function Tab1Cases({ onDone }: { onDone: () => void }) {
  const [caseN, setCaseN] = useState<1 | 2 | 3 | 4>(1);
  const [c4a, setC4a] = useState(1);
  const [c4p, setC4p] = useState(0);
  const [c4aL, setC4aL] = useState(-2);
  const [c4b, setC4b] = useState(2);

  useEffect(() => {
    onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseN]);

  // 효과적인 a/p/q/aL/b
  const a = caseN === 4 ? c4a : CASE_PRESETS[caseN].a;
  const p = caseN === 4 ? c4p : CASE_PRESETS[caseN].p;
  const q = caseN === 4 ? 0 : CASE_PRESETS[caseN].q;
  const aL = caseN === 4 ? c4aL : CASE_PRESETS[caseN].aL;
  const bRaw = caseN === 4 ? c4b : CASE_PRESETS[caseN].b;
  const b = aL >= bRaw ? aL + 0.5 : bRaw;

  const W = 520;
  const H = 300;
  const fA = a * (aL - p) * (aL - p) + q;
  const fB = a * (b - p) * (b - p) + q;
  const fP = q;
  const inRange = aL <= p && p <= b;
  const aSafe = Math.abs(a) < 0.001 ? 0.1 : a;

  const v = useMemo(() => {
    const span = Math.max(b - aL, 1);
    const kxs = [aL, b, aL - span * 0.18, b + span * 0.18];
    if (inRange) kxs.push(p);
    const kys = kxs.map((x) => aSafe * (x - p) * (x - p) + q);
    kys.push(0);
    return computeView(kxs, kys, W, H, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, p, q, aL, b, inRange]);

  const dashedPath = useMemo(
    () => buildParabolaSegment(aSafe, p, q, v, v.xMin, v.xMax),
    [aSafe, p, q, v],
  );
  const solidPath = useMemo(() => buildParabolaSegment(aSafe, p, q, v, aL, b), [aSafe, p, q, v, aL, b]);

  const candidatePts = inRange
    ? [
        { x: aL, y: fA, lbl: `f(α) = ${fA.toFixed(2)}` },
        { x: p, y: fP, lbl: `f(p) = ${fP.toFixed(2)}` },
        { x: b, y: fB, lbl: `f(β) = ${fB.toFixed(2)}` },
      ]
    : [
        { x: aL, y: fA, lbl: `f(α) = ${fA.toFixed(2)}` },
        { x: b, y: fB, lbl: `f(β) = ${fB.toFixed(2)}` },
      ];
  const ys = candidatePts.map((pt) => pt.y);
  const maxY = Math.max(...ys);
  const minY = Math.min(...ys);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">📏 닫힌 구간 [α, β] 에서의 최대·최소</p>
        <p className="mt-1 text-sm leading-7 text-slate-300">
          <b className="text-cyan-200">대칭축(꼭짓점) x = p</b> 와 <b className="text-cyan-200">양 끝점 x = α, β</b>{" "}
          에서 최대·최소가 결정됩니다. 대칭축이 구간 안/밖 어디인지에 따라 케이스가 달라집니다.
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCaseN(n as 1 | 2 | 3 | 4)}
              className={
                "rounded-xl border-2 p-3 text-left text-xs font-bold transition " +
                (caseN === n
                  ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {n === 1
                ? "📌 케이스 1 · 대칭축 구간 안"
                : n === 2
                ? "📌 케이스 2 · 대칭축 왼쪽"
                : n === 3
                ? "📌 케이스 3 · 대칭축 오른쪽"
                : "📌 케이스 4 · 직접 조작"}
              <p className="mt-1 text-[10px] font-normal opacity-80">
                {n === 1
                  ? "f(α), f(p), f(β) 비교"
                  : n === 2 || n === 3
                  ? "끝점 f(α), f(β) 만"
                  : "슬라이더로 탐구"}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <PlotSVG W={W} H={H} v={v} ariaLabel="구간 위에서 이차함수의 최대·최소">
              <path d={dashedPath} fill="none" stroke="rgba(104,136,255,0.25)" strokeWidth="2" strokeDasharray="6 5" />
              <path d={solidPath} fill="none" stroke="#6888ff" strokeWidth="2.6" />
              {/* 최대·최소 수평 점선 */}
              <line x1={0} y1={v.oy - maxY * v.sc} x2={W} y2={v.oy - maxY * v.sc} stroke="rgba(255,136,112,0.45)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={0} y1={v.oy - minY * v.sc} x2={W} y2={v.oy - minY * v.sc} stroke="rgba(123,224,176,0.45)" strokeWidth="1" strokeDasharray="4 4" />
              {/* 대칭축 */}
              <line x1={v.ox + p * v.sc} y1={0} x2={v.ox + p * v.sc} y2={H} stroke="rgba(255,215,0,0.4)" strokeWidth="1.5" strokeDasharray="5 4" />
              {/* 후보 점 */}
              {candidatePts.map((pt, i) => {
                const isMax = Math.abs(pt.y - maxY) < 0.001;
                const isMin = Math.abs(pt.y - minY) < 0.001;
                const col = isMax ? "#ff8870" : isMin ? "#7be0b0" : "#ccddff";
                const px = v.ox + pt.x * v.sc;
                const py = v.oy - pt.y * v.sc;
                return (
                  <g key={i}>
                    {isMax || isMin ? (
                      <circle
                        cx={px}
                        cy={py}
                        r="14"
                        fill={isMax ? "rgba(255,136,112,0.15)" : "rgba(123,224,176,0.15)"}
                        stroke={isMax ? "rgba(255,136,112,0.6)" : "rgba(123,224,176,0.6)"}
                        strokeWidth="1.5"
                      />
                    ) : null}
                    <circle cx={px} cy={py} r="6" fill={col} />
                    <text
                      x={px}
                      y={py + (isMax ? -16 : 18)}
                      fill={col}
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {pt.lbl}
                    </text>
                  </g>
                );
              })}
            </PlotSVG>
          </div>

          <div className="space-y-3">
            {caseN === 4 ? (
              <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <Slider label="계수 a" color="text-pink-300" min={-2} max={2} step={0.5} value={c4a} onChange={setC4a} ariaLabel="계수 a" />
                <Slider label="대칭축 p" color="text-amber-300" min={-5} max={5} step={0.5} value={c4p} onChange={setC4p} ariaLabel="대칭축 p" />
                <Slider label="왼쪽 끝 α" color="text-cyan-200" min={-5} max={4} step={0.5} value={c4aL} onChange={setC4aL} ariaLabel="구간 왼쪽 끝 α" />
                <Slider label="오른쪽 끝 β" color="text-cyan-200" min={-4} max={5} step={0.5} value={c4b} onChange={setC4b} ariaLabel="구간 오른쪽 끝 β" />
              </div>
            ) : null}

            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm leading-7">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">분석 결과</p>
              <p className="mt-1">
                대칭축 <b className="text-amber-200">x = {fmtNum(p)}</b> 이 구간 [
                <b>{fmtNum(aL)}</b>, <b>{fmtNum(b)}</b>] {inRange ? "안" : "밖"} 에 있습니다.
              </p>
              <div className="mt-2 space-y-0.5 font-mono text-xs">
                <p>f(α) = {fA.toFixed(2)}</p>
                {inRange ? <p>f(p) = {fP.toFixed(2)}</p> : null}
                <p>f(β) = {fB.toFixed(2)}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded border border-rose-400/40 bg-rose-400/15 px-2 py-0.5 text-xs font-bold text-rose-200">
                  최댓값 = {maxY.toFixed(2)}
                </span>
                <span className="rounded border border-emerald-400/40 bg-emerald-400/15 px-2 py-0.5 text-xs font-bold text-emerald-200">
                  최솟값 = {minY.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-4">
        <p className="text-sm font-extrabold text-cyan-200">📝 최대·최소 구하는 5 단계</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-7 text-slate-200">
          <li>함수식을 <b>y = a(x − p)² + q</b> (꼭짓점 형태) 로 변환합니다.</li>
          <li>대칭축 <b>x = p</b> 와 구간 [α, β] 의 관계를 파악합니다.</li>
          <li>대칭축이 구간 안에 있으면 <b>x = α, p, β</b> 의 함숫값을 모두 구합니다.</li>
          <li>대칭축이 구간 밖에 있으면 <b>x = α, β</b> 의 함숫값만 비교합니다.</li>
          <li>그 중 가장 큰 값이 최댓값, 가장 작은 값이 최솟값입니다.</li>
        </ol>
      </div>
    </div>
  );
}

// ─── TAB 2 — 인터랙티브 실험실 ────────────────────────────
type Preset = { a: number; p: number; q: number; aL: number; b: number; lC: boolean; rC: boolean; msg: string };
const PRESETS: Preset[] = [
  { a: 1, p: 0, q: 0, aL: -3, b: 3, lC: true, rC: true, msg: "🎯 미션 1: 꼭짓점이 정중앙 → 최솟값은 꼭짓점, 최댓값은 양 끝점 중 더 먼 쪽" },
  { a: 1, p: -5, q: 0, aL: -2, b: 3, lC: true, rC: true, msg: "🎯 미션 2: 대칭축이 구간 왼쪽 밖 → 구간에서 단조증가 → 최솟값 = f(α), 최댓값 = f(β)" },
  { a: 1, p: 0, q: 0, aL: -3, b: 3, lC: false, rC: false, msg: "🎯 미션 3: 열린구간이지만 꼭짓점은 구간 안 → 최솟값 존재. 양 끝이 열려 있어 최댓값은 존재하지 않음" },
  { a: 1, p: -5, q: 0, aL: -2, b: 3, lC: false, rC: false, msg: "🎯 미션 4: 열린구간 + 단조증가 → 최솟값·최댓값 모두 존재하지 않음!" },
  { a: -1, p: 1, q: 2, aL: -2, b: 4, lC: true, rC: true, msg: "🎯 미션 5: a < 0(위로 볼록), 꼭짓점이 구간 안 → 꼭짓점이 최댓값, 끝점에서 최솟값" },
  { a: 2, p: 1, q: 0, aL: 0.9, b: 1.1, lC: true, rC: true, msg: "🎯 미션 6: 아주 좁은 구간에서도 원리는 같음" },
];

function Tab2Lab({ onDone }: { onDone: () => void }) {
  const [a, setA] = useState(1);
  const [p, setP] = useState(0);
  const [q, setQ] = useState(0);
  const [aL, setAL] = useState(-3);
  const [b, setB] = useState(3);
  const [lClose, setLClose] = useState(true);
  const [rClose, setRClose] = useState(true);
  const [missionMsg, setMissionMsg] = useState<string | null>(null);

  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touched]);
  function markTouched() {
    if (!touched) setTouched(true);
  }

  const W = 540;
  const H = 340;
  const aSafe = Math.abs(a) < 0.001 ? 0.1 : a;
  const bClamped = aL >= b ? aL + 0.5 : b;

  const v = useMemo(() => {
    const span = Math.max(bClamped - aL, 1);
    const kxs = [aL, bClamped, aL - span * 0.15, bClamped + span * 0.15];
    const pInside = p > aL && p < bClamped;
    if (pInside) kxs.push(p);
    const kys = kxs.map((x) => aSafe * (x - p) * (x - p) + q);
    kys.push(0);
    return computeView(kxs, kys, W, H, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, p, q, aL, bClamped]);

  const dashedPath = useMemo(
    () => buildParabolaSegment(aSafe, p, q, v, v.xMin, v.xMax),
    [aSafe, p, q, v],
  );
  const eps = (bClamped - aL) * 0.0005;
  const solidPath = useMemo(
    () =>
      buildParabolaSegment(
        aSafe,
        p,
        q,
        v,
        aL + (lClose ? 0 : eps),
        bClamped - (rClose ? 0 : eps),
      ),
    [aSafe, p, q, v, aL, bClamped, lClose, rClose, eps],
  );

  // 최대·최소 샘플링
  const sampleStats = useMemo(() => {
    const left = lClose ? aL : aL + eps;
    const right = rClose ? bClamped : bClamped - eps;
    let sMax = -Infinity;
    let sMin = Infinity;
    for (let t = 0; t <= 1500; t++) {
      const x = left + ((right - left) * t) / 1500;
      const y = aSafe * (x - p) * (x - p) + q;
      if (y > sMax) sMax = y;
      if (y < sMin) sMin = y;
    }
    return { sMax, sMin };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, p, q, aL, bClamped, lClose, rClose]);

  const pInside = p > aL && p < bClamped;
  const fA = aSafe * (aL - p) * (aL - p) + q;
  const fB = aSafe * (bClamped - p) * (bClamped - p) + q;

  const candidates: { x: number; y: number }[] = [];
  if (pInside) candidates.push({ x: p, y: q });
  if (lClose) candidates.push({ x: aL, y: fA });
  if (rClose) candidates.push({ x: bClamped, y: fB });

  const attainedMax = candidates.some((c) => Math.abs(c.y - sampleStats.sMax) < 0.001);
  const attainedMin = candidates.some((c) => Math.abs(c.y - sampleStats.sMin) < 0.001);

  function applyPreset(idx: number) {
    const pr = PRESETS[idx];
    setA(pr.a);
    setP(pr.p);
    setQ(pr.q);
    setAL(pr.aL);
    setB(pr.b);
    setLClose(pr.lC);
    setRClose(pr.rC);
    setMissionMsg(pr.msg);
    markTouched();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">🔬 인터랙티브 그래프 실험실</p>
        <p className="mt-1 text-sm leading-7 text-slate-300">
          계수·꼭짓점·구간을 자유롭게 조작하고, <b>구간 끝점 포함 여부(열린/닫힌)</b> 도 바꿔 보세요.
          최대·최소가 어떻게 달라지는지 직접 확인할 수 있습니다.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <PlotSVG W={W} H={H} v={v} ariaLabel="이차함수 + 구간 실험실">
              {/* 구간 음영 */}
              <rect
                x={v.ox + aL * v.sc}
                y={0}
                width={Math.max(0, (bClamped - aL) * v.sc)}
                height={H}
                fill="rgba(104,136,255,0.07)"
              />
              <path d={dashedPath} fill="none" stroke="rgba(104,136,255,0.18)" strokeWidth="2" strokeDasharray="6 5" />
              <path d={solidPath} fill="none" stroke="#6888ff" strokeWidth="2.6" />
              {/* 대칭축 */}
              <line x1={v.ox + p * v.sc} y1={0} x2={v.ox + p * v.sc} y2={H} stroke="rgba(255,215,0,0.4)" strokeWidth="1.5" strokeDasharray="5 4" />
              {/* 최대·최소 수평 점선 */}
              <line x1={0} y1={v.oy - sampleStats.sMax * v.sc} x2={W} y2={v.oy - sampleStats.sMax * v.sc} stroke="rgba(255,136,112,0.45)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={0} y1={v.oy - sampleStats.sMin * v.sc} x2={W} y2={v.oy - sampleStats.sMin * v.sc} stroke="rgba(123,224,176,0.45)" strokeWidth="1" strokeDasharray="4 4" />
              {/* 꼭짓점 (구간 안) */}
              {pInside ? <circle cx={v.ox + p * v.sc} cy={v.oy - q * v.sc} r="6" fill="#ffd700" /> : null}
              {/* 끝점 마커 — 닫힌은 채움, 열린은 비움 */}
              <circle
                cx={v.ox + aL * v.sc}
                cy={v.oy - fA * v.sc}
                r="7"
                fill={lClose ? "#ff8870" : "none"}
                stroke="#ff8870"
                strokeWidth="2.5"
              />
              <circle
                cx={v.ox + bClamped * v.sc}
                cy={v.oy - fB * v.sc}
                r="7"
                fill={rClose ? "#ff8870" : "none"}
                stroke="#ff8870"
                strokeWidth="2.5"
              />
              {/* 구간 라벨 */}
              <text
                x={(v.ox + aL * v.sc + v.ox + bClamped * v.sc) / 2}
                y={H - 5}
                fill="rgba(104,136,255,0.8)"
                fontSize="12"
                textAnchor="middle"
              >
                {lClose ? "[" : "("}
                {fmtNum(aL)}, {fmtNum(bClamped)}
                {rClose ? "]" : ")"}
              </text>
              {/* 최대·최소 라벨 */}
              {candidates.map((c, i) => {
                const isMax = Math.abs(c.y - sampleStats.sMax) < 0.001 && attainedMax;
                const isMin = Math.abs(c.y - sampleStats.sMin) < 0.001 && attainedMin;
                if (!isMax && !isMin) return null;
                const col = isMax ? "#ff8870" : "#7be0b0";
                const lbl = isMax ? "최대" : "최소";
                return (
                  <g key={i}>
                    <circle cx={v.ox + c.x * v.sc} cy={v.oy - c.y * v.sc} r="9" fill={col} />
                    <text x={v.ox + c.x * v.sc} y={v.oy - c.y * v.sc + (isMax ? -16 : 18)} fill={col} fontSize="11" fontWeight="bold" textAnchor="middle">
                      {lbl}
                    </text>
                  </g>
                );
              })}
            </PlotSVG>
          </div>

          <div className="space-y-3">
            <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <Slider label="계수 a" color="text-pink-300" min={-3} max={3} step={0.5} value={a} onChange={(v0) => { setA(v0); markTouched(); }} ariaLabel="계수 a" />
              <Slider label="꼭짓점 p" color="text-amber-300" min={-5} max={5} step={0.5} value={p} onChange={(v0) => { setP(v0); markTouched(); }} ariaLabel="꼭짓점 p" />
              <Slider label="꼭짓점 q" color="text-amber-300" min={-5} max={5} step={0.5} value={q} onChange={(v0) => { setQ(v0); markTouched(); }} ariaLabel="꼭짓점 q" />
              <Slider label="왼쪽 끝 α" color="text-cyan-200" min={-8} max={7} step={0.5} value={aL} onChange={(v0) => { setAL(v0); markTouched(); }} ariaLabel="구간 왼쪽 α" />
              <Slider label="오른쪽 끝 β" color="text-cyan-200" min={-7} max={8} step={0.5} value={b} onChange={(v0) => { setB(v0); markTouched(); }} ariaLabel="구간 오른쪽 β" />
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <label className="flex items-center gap-1 text-cyan-200">
                  <input type="checkbox" checked={lClose} onChange={(e) => { setLClose(e.target.checked); markTouched(); }} className="accent-violet-400" />
                  α 포함
                </label>
                <label className="flex items-center gap-1 text-cyan-200">
                  <input type="checkbox" checked={rClose} onChange={(e) => { setRClose(e.target.checked); markTouched(); }} className="accent-violet-400" />
                  β 포함
                </label>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-300">📊 최댓값</p>
                <p className="font-mono">
                  {attainedMax ? (
                    <span className="text-rose-200">최댓값 = {sampleStats.sMax.toFixed(3)}</span>
                  ) : (
                    <span className="text-slate-400">
                      최댓값 없음{" "}
                      <span className="text-xs">
                        ({sampleStats.sMax.toFixed(3)} 에 가까워지지만 도달 안 함)
                      </span>
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">📊 최솟값</p>
                <p className="font-mono">
                  {attainedMin ? (
                    <span className="text-emerald-200">최솟값 = {sampleStats.sMin.toFixed(3)}</span>
                  ) : (
                    <span className="text-slate-400">
                      최솟값 없음{" "}
                      <span className="text-xs">
                        ({sampleStats.sMin.toFixed(3)} 에 가까워지지만 도달 안 함)
                      </span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">🧪 탐구 미션 — 프리셋으로 빠르게</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyPreset(i)}
              className="rounded-lg border border-violet-400/35 bg-violet-400/10 px-3 py-2 text-left text-xs font-bold text-violet-100 hover:bg-violet-400/20"
            >
              🎯 미션 {i + 1}
            </button>
          ))}
        </div>
        {missionMsg ? (
          <p className="mt-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-2 text-xs leading-6 text-amber-100">
            {missionMsg}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ─── TAB 3 — 연습 문제 ────────────────────────────────────
type QuizItem = {
  q: ReactNode;
  opts: ReactNode[];
  ans: number;
  hint: ReactNode;
  exp: ReactNode;
};

const QUIZZES: QuizItem[] = [
  {
    q: <>이차함수 y = (x − 2)² − 3 에서 실수 전체를 정의역으로 할 때, 다음 중 옳은 것은?</>,
    opts: [
      <>최댓값은 −3 이다.</>,
      <>최솟값은 −3 이다.</>,
      <>최댓값과 최솟값이 모두 존재한다.</>,
      <>최댓값도 최솟값도 존재하지 않는다.</>,
    ],
    ans: 1,
    hint: <>a = 1 &gt; 0 이므로 아래로 볼록. 꼭짓점은 (2, −3).</>,
    exp: <>a = 1 &gt; 0 이므로 아래로 볼록. x = 2 일 때 최솟값 −3. 최댓값은 없음.</>,
  },
  {
    q: <>이차함수 y = −2(x + 1)² + 5 에서 실수 전체를 정의역으로 할 때 최댓값은?</>,
    opts: [<>−1</>, <>5</>, <>−5</>, <>존재하지 않는다</>],
    ans: 1,
    hint: <>a = −2 &lt; 0 이므로 위로 볼록. 꼭짓점은 (−1, 5).</>,
    exp: <>a &lt; 0 이므로 위로 볼록. 꼭짓점 (−1, 5) 에서 최댓값 5. 최솟값은 없음.</>,
  },
  {
    q: <>y = (x − 1)² − 2 를 닫힌 구간 [−1, 3] 에서 정의할 때, 최댓값은?</>,
    opts: [<>−2</>, <>2</>, <>6</>, <>7</>],
    ans: 1,
    hint: <>대칭축 x = 1 이 [−1, 3] 안에 있음. f(−1), f(1), f(3) 을 비교하세요.</>,
    exp: <>f(−1) = 4 − 2 = 2, f(1) = −2, f(3) = 4 − 2 = 2. 최댓값 = 2.</>,
  },
  {
    q: <>y = x² − 4x + 3 을 닫힌 구간 [0, 5] 에서 정의할 때 최솟값은?</>,
    opts: [<>3</>, <>0</>, <>−1</>, <>−2</>],
    ans: 2,
    hint: <>완전제곱식: y = (x − 2)² − 1. 대칭축 x = 2 가 [0, 5] 안.</>,
    exp: <>y = (x − 2)² − 1. f(0) = 3, f(2) = −1, f(5) = 8. 최솟값 = −1.</>,
  },
  {
    q: <>y = (x − 2)² − 1 을 열린 구간 (0, 2) 에서 정의할 때 최솟값은?</>,
    opts: [<>−1</>, <>0</>, <>존재하지 않는다</>, <>3</>],
    ans: 2,
    hint: <>구간 (0, 2) 에서 x = 2 는 포함되지 않습니다. 대칭축 x = 2 는 구간 경계.</>,
    exp: <>x = 2 에서 최솟값 −1 이지만 x = 2 는 열린 구간에 포함되지 않음. y 는 −1 에 가까워지지만 도달하지 않으므로 최솟값 없음.</>,
  },
  {
    q: <>y = −(x − 1)² + 4 를 닫힌 구간 [−1, 4] 에서 정의할 때 최솟값은?</>,
    opts: [<>4</>, <>−5</>, <>0</>, <>−1</>],
    ans: 1,
    hint: <>a = −1 &lt; 0 이므로 위로 볼록. 끝점에서 최솟값을 찾아야 합니다.</>,
    exp: <>f(−1) = −4 + 4 = 0, f(1) = 4, f(4) = −9 + 4 = −5. 최솟값 = −5 (x = 4).</>,
  },
];

function Tab3Quiz({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<(number | null)[]>(() => QUIZZES.map(() => null));

  const allAnswered = picked.every((p) => p !== null);
  useEffect(() => {
    if (allAnswered) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAnswered]);

  function pick(oi: number) {
    setPicked((arr) => {
      if (arr[idx] !== null) return arr;
      const n = [...arr];
      n[idx] = oi;
      return n;
    });
  }

  const cur = QUIZZES[idx];
  const curPick = picked[idx];
  const answered = curPick !== null;
  const score = picked.filter((p, i) => p === QUIZZES[i].ans).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold text-violet-200">✏️ 연습 문제</p>
          <span className="font-mono text-xs text-slate-400">
            {idx + 1} / {QUIZZES.length} · 점수 {score}
          </span>
        </div>

        <div className="mt-3 rounded-xl border border-violet-400/30 bg-violet-400/10 p-3 text-sm leading-7 text-slate-100">
          <p className="text-xs font-bold text-violet-300">문제 {idx + 1}</p>
          <p className="mt-1">{cur.q}</p>
        </div>

        <div className="mt-3 grid gap-2">
          {cur.opts.map((opt, oi) => {
            const isAns = oi === cur.ans;
            const isChosen = curPick === oi;
            const showCorrect = answered && isAns;
            const showWrong = answered && isChosen && !isAns;
            return (
              <button
                key={oi}
                type="button"
                disabled={answered}
                onClick={() => pick(oi)}
                className={
                  "rounded-xl border-2 px-3 py-2 text-left text-sm font-bold transition disabled:cursor-default " +
                  (showCorrect
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-100 ring-2 ring-emerald-300/55"
                    : showWrong
                    ? "border-rose-400 bg-rose-400/20 text-rose-100 ring-2 ring-rose-300/55"
                    : "border-white/10 bg-white/5 text-slate-100 hover:border-violet-400/45 hover:bg-violet-400/10")
                }
              >
                {String.fromCharCode(9312 + oi)} {opt}
              </button>
            );
          })}
        </div>

        {answered ? (
          <p
            className={
              "mt-3 rounded-lg border p-3 text-sm leading-6 " +
              (curPick === cur.ans
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                : "border-rose-400/40 bg-rose-400/10 text-rose-100")
            }
          >
            {curPick === cur.ans ? "✅ 정답! " : "❌ 다시 생각해 보세요. "}
            {cur.exp}
          </p>
        ) : (
          <p className="mt-3 text-xs leading-6 text-slate-400">💡 힌트: {cur.hint}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10 disabled:opacity-40"
          >
            ◀ 이전
          </button>
          <span className="text-xs text-slate-400">
            {idx + 1} / {QUIZZES.length}
          </span>
          <button
            type="button"
            onClick={() => setIdx((i) => Math.min(QUIZZES.length - 1, i + 1))}
            disabled={idx === QUIZZES.length - 1}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-40"
          >
            다음 ▶
          </button>
        </div>
      </div>

      {allAnswered ? (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 text-center">
          <p className="text-3xl">🏆</p>
          <p className="mt-1 text-lg font-extrabold text-amber-100">
            연습 완료! {score} / {QUIZZES.length} 점
          </p>
          <p className="mt-2 text-sm leading-7 text-amber-100/85">
            {score === 6
              ? "완벽해요! 이차함수 최대·최소 마스터 🌟"
              : score >= 4
              ? "잘 했어요! 틀린 문제를 한 번 더 짚어 봅시다."
              : "탐구 탭으로 돌아가 그래프를 한 번 더 움직여 본 뒤 도전해 봐요."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
