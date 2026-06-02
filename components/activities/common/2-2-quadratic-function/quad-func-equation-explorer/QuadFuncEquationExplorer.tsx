"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "root_xintercept_link",
    prompt:
      "이차방정식 ax² + bx + c = 0 의 근과 이차함수 y = ax² + bx + c 그래프의 x 절편이 같은 이유를 판별식 D = b² − 4ac 와 연결하여 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: y = ax²+bx+c 의 그래프가 x축과 만나는 점은 y = 0 인 곳이므로 ax²+bx+c = 0 을 만족한다. 즉 그래프의 x절편 = 이차방정식의 근. 판별식 D = b²−4ac 는 근의 종류를 결정하므로 D 의 값이 x축과의 교점의 개수까지 결정한다.",
  },
  {
    id: "discriminant_meaning",
    prompt:
      "D > 0, D = 0, D < 0 일 때 이차함수 그래프와 x 축의 위치 관계(교점의 개수)가 어떻게 다른지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: D > 0 → 서로 다른 두 실근 → 그래프가 x축과 두 점에서 만남. D = 0 → 중근 → 그래프가 x축에 접함(한 점에서 만남). D < 0 → 서로 다른 두 허근 → 그래프가 x축과 만나지 않음.",
  },
];

// ─── 수식 포맷 ─────────────────────────────────────────────
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildEq(a: number, b: number, c: number): string {
  const ra = round2(a);
  const rb = round2(b);
  const rc = round2(c);
  let s = "y = ";
  if (ra === 0) {
    if (rb !== 0) {
      const bTerm = rb === 1 ? "" : rb === -1 ? "−" : rb < 0 ? `−${round2(-rb)}` : `${rb}`;
      s += `${bTerm}x`;
      if (rc > 0) s += ` + ${rc}`;
      else if (rc < 0) s += ` − ${round2(-rc)}`;
    } else {
      s += rc;
    }
    return s;
  }
  if (ra === 1) s += "x²";
  else if (ra === -1) s += "−x²";
  else if (ra < 0) s += `−${round2(-ra)}x²`;
  else s += `${ra}x²`;
  if (rb === 1) s += " + x";
  else if (rb === -1) s += " − x";
  else if (rb > 0) s += ` + ${rb}x`;
  else if (rb < 0) s += ` − ${round2(-rb)}x`;
  if (rc > 0) s += ` + ${rc}`;
  else if (rc < 0) s += ` − ${round2(-rc)}`;
  return s;
}

function buildEqRHS(a: number, b: number, c: number): string {
  return buildEq(a, b, c).replace("y = ", "");
}

// ─── SVG 그래프 (Canvas → SVG 포팅) ───────────────────────
type PlotConfig = {
  width: number;
  height: number;
  scale: number; // pixels per unit
  showVertex?: boolean;
  showIntercepts?: boolean;
  parabolaColor: "neutral" | "auto"; // auto = discriminant-based
  pLine?: number | null; // 점 p (수직 점선) — Tab2 용
};

function parabolaPath(
  a: number,
  b: number,
  c: number,
  W: number,
  H: number,
  ox: number,
  oy: number,
  scale: number,
): string {
  if (Math.abs(a) < 0.001) return "";
  const xMin = (-ox / scale) - 0.2;
  const xMax = ((W - ox) / scale) + 0.2;
  const steps = 280;
  const parts: string[] = [];
  let pen = false;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (xMax - xMin) * (i / steps);
    const y = a * x * x + b * x + c;
    const px = ox + x * scale;
    const py = oy - y * scale;
    if (py < -30 || py > H + 30) {
      pen = false;
      continue;
    }
    if (!pen) {
      parts.push(`M ${px.toFixed(1)} ${py.toFixed(1)}`);
      pen = true;
    } else {
      parts.push(`L ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
  }
  return parts.join(" ");
}

function GraphPlot({
  a,
  b,
  c,
  config,
}: {
  a: number;
  b: number;
  c: number;
  config: PlotConfig;
}) {
  const W = config.width;
  const H = config.height;
  const ox = W / 2;
  const oy = H / 2;
  const scale = config.scale;

  const D = b * b - 4 * a * c;
  const pColor =
    config.parabolaColor === "neutral"
      ? "#60a5fa"
      : D > 1e-9
      ? "#34d399"
      : D > -1e-9
      ? "#fbbf24"
      : "#f87171";

  const pathD = useMemo(() => parabolaPath(a, b, c, W, H, ox, oy, scale), [a, b, c, W, H, ox, oy, scale]);

  // 격자선
  const gridLines: ReactNode[] = [];
  const minX = Math.floor(-ox / scale);
  const maxX = Math.ceil((W - ox) / scale);
  const minY = Math.floor(-(H - oy) / scale);
  const maxY = Math.ceil(oy / scale);
  for (let x = minX; x <= maxX; x++) {
    gridLines.push(
      <line
        key={`vx${x}`}
        x1={ox + x * scale}
        y1={0}
        x2={ox + x * scale}
        y2={H}
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="0.8"
      />,
    );
  }
  for (let y = minY; y <= maxY; y++) {
    gridLines.push(
      <line
        key={`hy${y}`}
        x1={0}
        y1={oy - y * scale}
        x2={W}
        y2={oy - y * scale}
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="0.8"
      />,
    );
  }

  // 눈금 숫자
  const ticks: ReactNode[] = [];
  for (let x = minX + 1; x < maxX; x++) {
    if (x === 0) continue;
    ticks.push(
      <text
        key={`tx${x}`}
        x={ox + x * scale}
        y={oy + 13}
        fill="rgba(255,255,255,0.32)"
        fontSize="10"
        textAnchor="middle"
      >
        {x}
      </text>,
    );
  }
  for (let y = minY + 1; y < maxY; y++) {
    if (y === 0) continue;
    ticks.push(
      <text
        key={`ty${y}`}
        x={ox - 5}
        y={oy - y * scale + 4}
        fill="rgba(255,255,255,0.32)"
        fontSize="10"
        textAnchor="end"
      >
        {y}
      </text>,
    );
  }

  // x 절편
  const intercepts: ReactNode[] = [];
  if (config.showIntercepts && D >= -1e-9 && Math.abs(a) > 0.001) {
    const sqD = Math.sqrt(Math.max(0, D));
    const x1 = (-b - sqD) / (2 * a);
    const x2 = (-b + sqD) / (2 * a);
    const pts = Math.abs(x1 - x2) < 1e-9 ? [x1] : [x1, x2];
    pts.forEach((x, i) => {
      const px = ox + x * scale;
      intercepts.push(
        <g key={`int${i}`}>
          <circle cx={px} cy={oy} r="9" fill="none" stroke="rgba(253,230,138,0.4)" strokeWidth="2" />
          <circle cx={px} cy={oy} r="5" fill="#fde68a" />
          <text x={px} y={oy - 14} fill="#fde68a" fontSize="10" fontWeight="bold" textAnchor="middle">
            ({round2(x)}, 0)
          </text>
        </g>,
      );
    });
  }

  // 꼭짓점
  let vertex: ReactNode = null;
  if (config.showVertex && Math.abs(a) > 0.001) {
    const vx = -b / (2 * a);
    const vy = c - (b * b) / (4 * a);
    const px = ox + vx * scale;
    const py = oy - vy * scale;
    if (py >= -20 && py <= H + 20) {
      const labelX = px > ox ? px - 8 : px + 8;
      const labelAnchor = px > ox ? "end" : "start";
      vertex = (
        <g>
          <circle cx={px} cy={py} r="4" fill="#a78bfa" />
          <text
            x={labelX}
            y={py - 8}
            fill="rgba(196,181,253,0.85)"
            fontSize="10"
            textAnchor={labelAnchor}
          >
            꼭짓점 ({round2(vx)}, {round2(vy)})
          </text>
        </g>
      );
    }
  }

  // p 점 + f(p) (Tab 2 전용)
  let pOverlay: ReactNode = null;
  if (config.pLine !== undefined && config.pLine !== null) {
    const p = config.pLine;
    const ppx = ox + p * scale;
    const fp = a * p * p + b * p + c;
    const fppy = oy - fp * scale;
    pOverlay = (
      <g>
        <line
          x1={ppx}
          y1={12}
          x2={ppx}
          y2={H - 12}
          stroke="rgba(240,171,252,0.75)"
          strokeWidth="1.8"
          strokeDasharray="5 5"
        />
        <text x={ppx} y={26} fill="#f0abfc" fontStyle="italic" fontSize="14" fontWeight="bold" textAnchor="middle">
          p
        </text>
        {fppy > -20 && fppy < H + 20 ? (
          <g>
            <line x1={ppx} y1={oy} x2={ppx} y2={fppy} stroke="rgba(240,171,252,0.45)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={ppx} cy={fppy} r="5" fill="#e879f9" />
            <text
              x={ppx + (ppx < W * 0.6 ? 8 : -8)}
              y={fppy - 8}
              fill="#e879f9"
              fontSize="11"
              textAnchor={ppx < W * 0.6 ? "start" : "end"}
            >
              f(p) = {round2(fp)}
            </text>
          </g>
        ) : null}
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto block h-auto w-full max-w-[520px]"
      role="img"
      aria-label="이차함수 그래프"
    >
      <defs>
        <linearGradient id="quadBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#080d1e" />
          <stop offset="100%" stopColor="#0c1628" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#quadBg)" />
      {gridLines}
      {/* 축 */}
      <line x1={6} y1={oy} x2={W - 6} y2={oy} stroke="rgba(255,255,255,0.32)" strokeWidth="1.5" />
      <line x1={ox} y1={6} x2={ox} y2={H - 6} stroke="rgba(255,255,255,0.32)" strokeWidth="1.5" />
      <polygon points={`${W - 6},${oy} ${W - 14},${oy - 4} ${W - 14},${oy + 4}`} fill="rgba(255,255,255,0.32)" />
      <polygon points={`${ox},6 ${ox - 4},14 ${ox + 4},14`} fill="rgba(255,255,255,0.32)" />
      <text x={W - 8} y={oy - 7} fill="rgba(255,255,255,0.5)" fontStyle="italic" fontSize="13" textAnchor="end">
        x
      </text>
      <text x={ox + 12} y={14} fill="rgba(255,255,255,0.5)" fontStyle="italic" fontSize="13" textAnchor="middle">
        y
      </text>
      {ticks}
      {/* 포물선 */}
      <path d={pathD} fill="none" stroke={pColor} strokeWidth="2.6" />
      {intercepts}
      {vertex}
      {pOverlay}
    </svg>
  );
}

// ─── 메인 ───────────────────────────────────────────────────
type TabId = 0 | 1 | 2;
const TABS: { id: TabId; emoji: string; main: string; sub: string }[] = [
  { id: 0, emoji: "🔍", main: "탐구 1", sub: "그래프 조작" },
  { id: 1, emoji: "📊", main: "탐구 2", sub: "판별식 퀴즈" },
  { id: 2, emoji: "🎯", main: "탐구 3", sub: "근의 범위" },
];

export default function QuadFuncEquationExplorer() {
  const [tab, setTab] = useState<TabId>(0);
  const [done, setDone] = useState<boolean[]>(() => [false, false, false]);

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
      {/* ─── 헤더 ─── */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">📈 이차함수·방정식 그래프 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          이차방정식 ax² + bx + c = 0 의 근과 이차함수 y = ax² + bx + c 그래프의 x 절편이 같음을
          그래프 조작·판별식 퀴즈·근의 범위로 탐구해 봅시다.
        </p>
      </div>

      {/* 탭 바 */}
      <div className="mt-5 grid grid-cols-3 gap-2">
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
              <p className="text-sm">
                {t.emoji} {t.main}
                {isDone ? " ✓" : ""}
              </p>
              <p className="mt-0.5 text-[10px] font-normal opacity-80">{t.sub}</p>
            </button>
          );
        })}
      </div>

      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}>
        <Tab0Graph onDone={() => markDone(0)} />
      </div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <Tab1Quiz onDone={() => markDone(1)} />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <Tab2RootRange onDone={() => markDone(2)} />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 공통 — 슬라이더 ────────────────────────────────────────
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
  label: string;
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
    <div className="flex items-center gap-3">
      <span className={"w-6 font-mono text-sm font-bold " + colorCls}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        className="flex-1 accent-violet-400"
      />
      <span className={"min-w-[3rem] text-right font-mono text-sm " + colorCls}>{value}</span>
    </div>
  );
}

// ─── TAB 0 — 그래프 조작 ────────────────────────────────────
function Tab0Graph({ onDone }: { onDone: () => void }) {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(-4);

  // a, b, c 모두 한 번 이상 움직이면 done
  const [touched, setTouched] = useState({ a: false, b: false, c: false });
  useEffect(() => {
    if (touched.a && touched.b && touched.c) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touched.a, touched.b, touched.c]);

  const isLine = Math.abs(a) < 0.001;
  const D = b * b - 4 * a * c;
  const Dv = round2(D);
  const dKind = D > 1e-9 ? "pos" : D > -1e-9 ? "zero" : "neg";

  // 4ac 음수일 때 식 표기에서 "− −3" 같은 모양을 피하기 위한 분기
  const fourAc = 4 * a * c;
  const fourAcAbs = round2(Math.abs(fourAc));

  let rootHeading: string | null = null;
  let rootBody: ReactNode = null;
  if (isLine) {
    rootBody = <span className="text-rose-300">⚠️ a = 0 이면 이차함수가 아닙니다.</span>;
  } else if (dKind === "pos") {
    const sq = Math.sqrt(D);
    const x1 = round2((-b - sq) / (2 * a));
    const x2 = round2((-b + sq) / (2 * a));
    const [lo, hi] = x1 < x2 ? [x1, x2] : [x2, x1];
    rootHeading = "서로 다른 두 실근";
    rootBody = (
      <span className="font-mono italic text-amber-200">
        x = {lo}, &nbsp; x = {hi}
      </span>
    );
  } else if (dKind === "zero") {
    const x0 = round2(-b / (2 * a));
    rootHeading = "중근";
    rootBody = <span className="font-mono italic text-amber-200">x = {x0}</span>;
  } else {
    rootBody = <span className="text-rose-300">실수 근 없음 (두 허근)</span>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-extrabold text-violet-200">📐 이차함수 그래프 조작</p>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
          {/* 왼쪽: 식 + 그래프 */}
          <div>
            <p className="text-center font-mono text-lg font-extrabold text-cyan-200">{buildEq(a, b, c)}</p>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              <GraphPlot
                a={a}
                b={b}
                c={c}
                config={{
                  width: 460,
                  height: 360,
                  scale: 38,
                  showVertex: true,
                  showIntercepts: true,
                  parabolaColor: "auto",
                }}
              />
            </div>
          </div>

          {/* 오른쪽: 슬라이더 + 정보 */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Slider
                label="a"
                min={-3}
                max={3}
                step={0.5}
                value={a}
                onChange={(v) => {
                  setA(v);
                  setTouched((t) => ({ ...t, a: true }));
                }}
                ariaLabel="이차항 계수 a"
              />
              <Slider
                label="b"
                min={-6}
                max={6}
                step={0.5}
                value={b}
                onChange={(v) => {
                  setB(v);
                  setTouched((t) => ({ ...t, b: true }));
                }}
                ariaLabel="일차항 계수 b"
              />
              <Slider
                label="c"
                min={-6}
                max={6}
                step={0.5}
                value={c}
                onChange={(v) => {
                  setC(v);
                  setTouched((t) => ({ ...t, c: true }));
                }}
                ariaLabel="상수항 c"
              />
            </div>

            {!isLine ? (
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm leading-7 text-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  판별식
                </p>
                <div className="mt-1 space-y-0.5 font-mono">
                  <p>
                    <span className="italic text-amber-200">D = b² − 4ac</span>
                  </p>
                  <p>= ({b})² − 4 × ({a}) × ({c})</p>
                  <p>
                    = {round2(b * b)}{" "}
                    {fourAc < 0 ? (
                      <>− (−{fourAcAbs})</>
                    ) : (
                      <>− {fourAcAbs}</>
                    )}{" "}
                    = <b className="text-amber-200">{Dv}</b>
                  </p>
                </div>
                <p className="mt-2">
                  <span
                    className={
                      "inline-block rounded-md px-2 py-0.5 text-xs font-bold " +
                      (dKind === "pos"
                        ? "border border-emerald-400/45 bg-emerald-400/15 text-emerald-200"
                        : dKind === "zero"
                        ? "border border-amber-400/45 bg-amber-400/15 text-amber-200"
                        : "border border-rose-400/45 bg-rose-400/15 text-rose-200")
                    }
                  >
                    {dKind === "pos" ? "D > 0" : dKind === "zero" ? "D = 0" : "D < 0"}
                  </span>
                </p>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  이차방정식의 근
                </p>
                {rootHeading ? <p className="mt-1">{rootHeading}</p> : null}
                <p className={rootHeading ? "" : "mt-1"}>{rootBody}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">💡 판별식과 그래프의 관계</p>
        <p className="mt-1 text-sm leading-7 text-slate-300">
          이차함수 <span className="font-mono italic">y = ax² + bx + c</span> 의 그래프와 x 축의 교점의
          x 좌표가 이차방정식 <span className="font-mono italic">ax² + bx + c = 0</span> 의{" "}
          <b>해(근)</b> 임을 슬라이더로 확인해 보세요.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-center text-sm leading-6 text-emerald-100">
            <p className="font-extrabold">D &gt; 0</p>
            <p>서로 다른 두 실근</p>
            <p className="text-xs">x 축과 두 점 교차</p>
          </div>
          <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-center text-sm leading-6 text-amber-100">
            <p className="font-extrabold">D = 0</p>
            <p>중근 (겹치는 근)</p>
            <p className="text-xs">x 축에 접함</p>
          </div>
          <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 p-3 text-center text-sm leading-6 text-rose-100">
            <p className="font-extrabold">D &lt; 0</p>
            <p>서로 다른 두 허근</p>
            <p className="text-xs">x 축과 만나지 않음</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 1 — 판별식 퀴즈 ────────────────────────────────────
type QuizItem = { a: number; b: number; c: number; ans: 0 | 1 | 2; hint: ReactNode };
const QUIZ: QuizItem[] = [
  { a: 1, b: -4, c: 3, ans: 0, hint: <>D = (−4)² − 4×1×3 = 16 − 12 = 4 &gt; 0 → 서로 다른 두 실근</> },
  { a: 1, b: 2, c: 2, ans: 2, hint: <>D = 2² − 4×1×2 = 4 − 8 = −4 &lt; 0 → 두 허근</> },
  { a: 1, b: 2, c: 1, ans: 1, hint: <>D = 2² − 4×1×1 = 4 − 4 = 0 → 중근</> },
  { a: -1, b: 2, c: 3, ans: 0, hint: <>D = 2² − 4×(−1)×3 = 4 + 12 = 16 &gt; 0 → 서로 다른 두 실근</> },
  { a: -1, b: 4, c: -4, ans: 1, hint: <>D = 4² − 4×(−1)×(−4) = 16 − 16 = 0 → 중근</> },
  { a: -1, b: 0, c: -1, ans: 2, hint: <>D = 0² − 4×(−1)×(−1) = 0 − 4 = −4 &lt; 0 → 두 허근</> },
];

const CHOICE_LABELS = [
  { main: "서로 다른 두 실근", sub: "D > 0", tone: "emerald" as const },
  { main: "중근", sub: "D = 0", tone: "amber" as const },
  { main: "서로 다른 두 허근", sub: "D < 0", tone: "rose" as const },
];

function Tab1Quiz({ onDone }: { onDone: () => void }) {
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<(0 | 1 | 2 | null)[]>(() => QUIZ.map(() => null));
  const [showResult, setShowResult] = useState(false);

  const current = QUIZ[qIdx];
  const curPicked = picked[qIdx];
  const answered = curPicked !== null;

  const score = picked.filter((p, i) => p === QUIZ[i].ans).length;

  useEffect(() => {
    if (showResult) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult]);

  function pick(c: 0 | 1 | 2) {
    if (answered) return;
    setPicked((arr) => arr.map((x, i) => (i === qIdx ? c : x)));
  }
  function next() {
    if (qIdx >= QUIZ.length - 1) {
      setShowResult(true);
    } else {
      setQIdx((i) => i + 1);
    }
  }
  function reset() {
    setQIdx(0);
    setPicked(QUIZ.map(() => null));
    setShowResult(false);
  }

  const msgs = [
    "아직 어렵나요? 그래프를 다시 탐구해 봐요 💪",
    "조금만 더 연습하면 완벽해져요!",
    "절반 이상 맞혔어요! 잘하고 있어요 😊",
    "훌륭해요! 판별식을 잘 이해하고 있어요 👍",
    "대단해요! 거의 완벽해요 ⭐",
    "아주 우수해요! 🌟",
    "완벽해요! 이차함수 마스터 🏆",
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm font-extrabold text-violet-200">📊 그래프 보고 판별식 맞추기</p>

      {!showResult ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          {/* 진행 dots */}
          <div className="mb-3 flex items-center gap-2">
            <div className="flex gap-1">
              {QUIZ.map((_, i) => {
                const p = picked[i];
                const ok = p !== null && p === QUIZ[i].ans;
                const wrong = p !== null && p !== QUIZ[i].ans;
                return (
                  <span
                    key={i}
                    className={
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold " +
                      (i === qIdx
                        ? "border-2 border-cyan-400/70 bg-cyan-400/15 text-cyan-100"
                        : ok
                        ? "border border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
                        : wrong
                        ? "border border-rose-400/55 bg-rose-400/15 text-rose-100"
                        : "border border-white/15 bg-white/5 text-slate-400")
                    }
                  >
                    {p !== null ? (ok ? "✓" : "✗") : i + 1}
                  </span>
                );
              })}
            </div>
            <span className="ml-auto text-xs text-slate-400">
              Q{qIdx + 1} / {QUIZ.length}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
            {/* 왼쪽: 식 + 그래프 + 문항 */}
            <div>
              <p className="text-center font-mono text-lg font-extrabold text-cyan-200">
                {buildEq(current.a, current.b, current.c)}
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                <GraphPlot
                  key={qIdx}
                  a={current.a}
                  b={current.b}
                  c={current.c}
                  config={{
                    width: 400,
                    height: 300,
                    scale: 34,
                    parabolaColor: answered ? "auto" : "neutral",
                    showIntercepts: answered,
                  }}
                />
              </div>
              <div className="mt-2 text-center text-sm text-slate-400">
                <p>이 이차방정식의 근의 종류는?</p>
                <p className="mt-1 font-mono italic text-slate-200">
                  {buildEqRHS(current.a, current.b, current.c)} = 0
                </p>
              </div>
            </div>

            {/* 오른쪽: 선택지 + 피드백 + 다음 버튼 */}
            <div className="space-y-3">
              <div className="grid gap-2">
                {CHOICE_LABELS.map((cl, i) => {
                  const ci = i as 0 | 1 | 2;
                  const isAns = ci === current.ans;
                  const isChosen = curPicked === ci;
                  const showCorrect = answered && isAns;
                  const showWrong = answered && isChosen && !isAns;
                  const toneCls =
                    cl.tone === "emerald"
                      ? "text-emerald-300"
                      : cl.tone === "amber"
                      ? "text-amber-300"
                      : "text-rose-300";
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={answered}
                      onClick={() => pick(ci)}
                      className={
                        "rounded-xl border-2 px-3 py-3 text-center text-sm font-bold transition disabled:cursor-default " +
                        (showCorrect
                          ? "border-emerald-400 bg-emerald-400/20 text-emerald-100 ring-2 ring-emerald-300/55"
                          : showWrong
                          ? "border-rose-400 bg-rose-400/20 text-rose-100 ring-2 ring-rose-300/55"
                          : "border-white/10 bg-white/5 text-slate-100 hover:border-violet-400/45 hover:bg-violet-400/10")
                      }
                    >
                      <p>{cl.main}</p>
                      <p className={"mt-1 text-xs font-bold " + toneCls}>{cl.sub}</p>
                    </button>
                  );
                })}
              </div>

              {answered ? (
                <p
                  className={
                    "rounded-lg border p-3 text-sm leading-6 " +
                    (curPicked === current.ans
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                      : "border-rose-400/40 bg-rose-400/10 text-rose-100")
                  }
                >
                  {curPicked === current.ans ? "🎉 정답! " : "💡 오답! "}
                  {current.hint}
                </p>
              ) : null}

              {answered ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={next}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
                  >
                    {qIdx < QUIZ.length - 1 ? "다음 →" : "결과 보기 🏆"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-6 text-center">
          <p className="text-3xl">🏆</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-100">
            {score} / {QUIZ.length} 점
          </p>
          <p className="mt-2 text-sm text-amber-100/85">{msgs[score]}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
          >
            다시 도전 🔄
          </button>
        </div>
      )}
    </div>
  );
}

// ─── TAB 2 — 근의 범위 ──────────────────────────────────────
function CondBadge({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span
      className={
        "rounded-md border px-2 py-0.5 text-xs font-bold " +
        (ok
          ? "border-emerald-400/45 bg-emerald-400/15 text-emerald-200"
          : "border-rose-400/45 bg-rose-400/15 text-rose-200")
      }
    >
      {children}
    </span>
  );
}

function Tab2RootRange({ onDone }: { onDone: () => void }) {
  const [b, setB] = useState(-4);
  const [c, setC] = useState(3);
  const [p, setP] = useState(4);

  const [touched, setTouched] = useState({ b: false, c: false, p: false });
  useEffect(() => {
    if (touched.b && touched.c && touched.p) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touched.b, touched.c, touched.p]);

  const a = 1;
  const D = b * b - 4 * a * c;
  const fp = p * p + b * p + c;
  const vx = -b / 2;

  const Dv = round2(D);
  const fpv = round2(fp);
  const vxv = round2(vx);

  const dGe0 = D >= -1e-9;
  const fpNeg = fp < -1e-9;
  const fpPos = fp > 1e-9;
  const vLtP = vx < p - 1e-9;
  const vGtP = vx > p + 1e-9;

  let title: string, titleColor: string, bg: string;
  if (!dGe0) {
    title = "판별식 D < 0 → 실근이 없습니다 (그래프가 x 축과 만나지 않음)";
    titleColor = "text-rose-300";
    bg = "border-rose-400/30 bg-rose-400/5";
  } else if (fpNeg) {
    title = "✅ f(p) < 0 → p 가 두 근 사이에 있습니다!";
    titleColor = "text-amber-200";
    bg = "border-amber-400/30 bg-amber-400/5";
  } else if (fpPos && vLtP) {
    title = "✅ D ≥ 0, 꼭짓점 x 좌표 < p, f(p) > 0 → 두 근 모두 p 보다 작습니다!";
    titleColor = "text-emerald-300";
    bg = "border-emerald-400/30 bg-emerald-400/5";
  } else if (fpPos && vGtP) {
    title = "✅ D ≥ 0, p < 꼭짓점 x 좌표, f(p) > 0 → 두 근 모두 p 보다 큽니다!";
    titleColor = "text-cyan-300";
    bg = "border-cyan-400/30 bg-cyan-400/5";
  } else {
    title = "경계 케이스 (p = 근 또는 꼭짓점). 슬라이더를 더 조절해 보세요!";
    titleColor = "text-slate-300";
    bg = "border-white/10 bg-white/5";
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-extrabold text-violet-200">🎯 근의 범위 탐구 (a = 1 고정)</p>
      <p className="text-sm text-slate-300">
        슬라이더로 포물선 모양과 점 <span className="font-mono italic text-pink-300">p</span> 의
        위치를 바꿔 보세요.
      </p>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
          {/* 왼쪽: 식 + 그래프 */}
          <div>
            <p className="text-center font-mono text-lg font-extrabold text-cyan-200">{buildEq(1, b, c)}</p>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              <GraphPlot
                a={1}
                b={b}
                c={c}
                config={{
                  width: 460,
                  height: 360,
                  scale: 38,
                  showVertex: true,
                  showIntercepts: true,
                  parabolaColor: !dGe0 ? "neutral" : "auto",
                  pLine: p,
                }}
              />
            </div>
          </div>

          {/* 오른쪽: 슬라이더 + 분석 */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Slider
                label="b"
                min={-6}
                max={6}
                step={0.5}
                value={b}
                onChange={(v) => {
                  setB(v);
                  setTouched((t) => ({ ...t, b: true }));
                }}
                ariaLabel="일차항 계수 b"
              />
              <Slider
                label="c"
                min={-6}
                max={6}
                step={0.5}
                value={c}
                onChange={(v) => {
                  setC(v);
                  setTouched((t) => ({ ...t, c: true }));
                }}
                ariaLabel="상수항 c"
              />
              <Slider
                label="p"
                color="text-pink-300"
                min={-5}
                max={5}
                step={0.25}
                value={p}
                onChange={(v) => {
                  setP(v);
                  setTouched((t) => ({ ...t, p: true }));
                }}
                ariaLabel="점 p"
              />
            </div>

            <div className={"rounded-xl border p-3 text-sm leading-7 " + bg}>
              <p className={"font-bold " + titleColor}>{title}</p>
              <div className="mt-2 space-y-2">
                <div className="rounded-md bg-white/5 p-2">
                  <p className="font-mono text-sm">D = b² − 4c = {Dv}</p>
                  <div className="mt-1">
                    <CondBadge ok={dGe0}>{dGe0 ? "D ≥ 0 ✓" : "D < 0 ✗"}</CondBadge>
                  </div>
                </div>
                <div className="rounded-md bg-white/5 p-2">
                  <p className="font-mono text-sm">꼭짓점 x좌표 −b/2 = {vxv}</p>
                  <p className="font-mono text-sm">vs &nbsp; p = {round2(p)}</p>
                  <div className="mt-1">
                    <CondBadge ok={vLtP || vGtP}>
                      {vLtP ? "꼭짓점 < p ✓" : vGtP ? "p < 꼭짓점 ✓" : "꼭짓점 = p"}
                    </CondBadge>
                  </div>
                </div>
                <div className="rounded-md bg-white/5 p-2">
                  <p className="font-mono text-sm">f(p) = {fpv}</p>
                  <div className="mt-1">
                    <CondBadge ok={fpPos}>
                      {fpPos ? "f(p) > 0 ✓" : fpNeg ? "f(p) < 0" : "f(p) = 0"}
                    </CondBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">📌 근의 범위 조건 정리 (a &gt; 0)</p>
        <div className="mt-3 space-y-2">
          <div className="rounded-lg border border-violet-400/35 bg-violet-400/10 p-2 text-sm leading-6">
            <p className="font-bold text-violet-200">두 실근이 모두 p 보다 작다</p>
            <p className="font-mono italic text-slate-100">D ≥ 0, −b/2a &lt; p, f(p) &gt; 0</p>
          </div>
          <div className="rounded-lg border border-amber-400/35 bg-amber-400/10 p-2 text-sm leading-6">
            <p className="font-bold text-amber-200">두 실근 사이에 p 가 있다</p>
            <p className="font-mono italic text-slate-100">f(p) &lt; 0</p>
          </div>
          <div className="rounded-lg border border-emerald-400/35 bg-emerald-400/10 p-2 text-sm leading-6">
            <p className="font-bold text-emerald-200">두 실근이 모두 p 보다 크다</p>
            <p className="font-mono italic text-slate-100">D ≥ 0, p &lt; −b/2a, f(p) &gt; 0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
