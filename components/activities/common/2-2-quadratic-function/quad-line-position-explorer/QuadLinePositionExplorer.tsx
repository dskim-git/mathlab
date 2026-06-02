"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "discriminant_link",
    prompt:
      "이차함수 y = ax² + bx + c 와 직선 y = mx + n 의 위치관계를 왜 판별식으로 판단할 수 있는지, 연립방정식을 세우는 과정과 연결하여 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 교점은 두 식을 동시에 만족하는 점이므로 ax² + bx + c = mx + n → ax² + (b−m)x + (c−n) = 0 의 실근. 따라서 실근의 개수가 곧 교점의 개수이고, 판별식 D = (b−m)² − 4a(c−n) 의 부호가 그 개수를 결정한다.",
  },
  {
    id: "tangent_geometric_meaning",
    prompt:
      "D = 0 일 때 ‘접한다’ 는 것이 기하학적으로 무슨 의미인지, D > 0 · D < 0 과 비교하여 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: D > 0 → 서로 다른 두 실근 → 그래프가 두 점에서 가로지름. D < 0 → 실근 없음 → 만나지 않음. D = 0 → 중근(같은 두 근) → 한 점에서 ‘접한다’ — 즉 두 교점이 하나로 겹쳐 직선이 포물선과 같은 기울기로 스쳐 지나간다.",
  },
];

// ─── 표기·수식 유틸 ────────────────────────────────────────
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function fmtNum(n: number): string {
  const r = round2(n);
  return r % 1 === 0 ? String(r) : r.toFixed(1);
}

// ─── SVG 그래프 (parabola + line + 교점) ─────────────────
type DualGraphProps = {
  a: number;
  b: number;
  c: number;
  m: number;
  n: number;
  width?: number;
  height?: number;
  scale?: number;
};

function buildParabolaPath(
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
  const xMin = -ox / scale - 0.2;
  const xMax = (W - ox) / scale + 0.2;
  const steps = 240;
  const parts: string[] = [];
  let pen = false;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (xMax - xMin) * (i / steps);
    const y = a * x * x + b * x + c;
    const px = ox + x * scale;
    const py = oy - y * scale;
    if (py < -40 || py > H + 40) {
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

function DualGraph({
  a,
  b,
  c,
  m,
  n,
  width = 440,
  height = 320,
  scale = 32,
}: DualGraphProps) {
  const W = width;
  const H = height;
  const ox = W / 2;
  const oy = H / 2;

  // 판별식 D = (b−m)² − 4a(c−n)
  const D = (b - m) * (b - m) - 4 * a * (c - n);
  const dKind: "pos" | "zero" | "neg" = D > 1e-9 ? "pos" : D > -1e-9 ? "zero" : "neg";
  const parabolaColor = dKind === "pos" ? "#34d399" : dKind === "zero" ? "#fbbf24" : "#f87171";
  const lineColor = "#f472b6";

  const parabPath = useMemo(
    () => buildParabolaPath(a, b, c, W, H, ox, oy, scale),
    [a, b, c, W, H, ox, oy, scale],
  );

  // 격자 + 눈금
  const minX = Math.floor(-ox / scale);
  const maxX = Math.ceil((W - ox) / scale);
  const minY = Math.floor(-(H - oy) / scale);
  const maxY = Math.ceil(oy / scale);

  const gridLines: ReactNode[] = [];
  for (let x = minX; x <= maxX; x++) {
    gridLines.push(
      <line
        key={`vx${x}`}
        x1={ox + x * scale}
        y1={0}
        x2={ox + x * scale}
        y2={H}
        stroke="rgba(255,255,255,0.06)"
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
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.8"
      />,
    );
  }

  const ticks: ReactNode[] = [];
  for (let x = minX + 1; x < maxX; x++) {
    if (x === 0) continue;
    ticks.push(
      <text
        key={`tx${x}`}
        x={ox + x * scale}
        y={oy + 12}
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

  // 직선 — 화면 안에서 두 점 선택
  // y = mx + n, x ∈ [xMin, xMax]
  const lineXMin = -ox / scale;
  const lineXMax = (W - ox) / scale;
  const lineY1 = m * lineXMin + n;
  const lineY2 = m * lineXMax + n;
  const lineX1px = ox + lineXMin * scale;
  const lineY1px = oy - lineY1 * scale;
  const lineX2px = ox + lineXMax * scale;
  const lineY2px = oy - lineY2 * scale;

  // 교점 (D ≥ 0 일 때)
  const intersections: ReactNode[] = [];
  if (D >= -1e-9 && Math.abs(a) > 0.001) {
    const sqD = Math.sqrt(Math.max(0, D));
    // ax² + (b−m)x + (c−n) = 0 의 해
    const x1 = (-(b - m) - sqD) / (2 * a);
    const x2 = (-(b - m) + sqD) / (2 * a);
    const pts = Math.abs(x1 - x2) < 1e-9 ? [x1] : [x1, x2];
    pts.forEach((x, i) => {
      const y = m * x + n;
      const px = ox + x * scale;
      const py = oy - y * scale;
      if (py < -20 || py > H + 20) return;
      intersections.push(
        <g key={`int${i}`}>
          <circle cx={px} cy={py} r="9" fill="none" stroke="rgba(253,230,138,0.4)" strokeWidth="2" />
          <circle cx={px} cy={py} r="5" fill="#fde68a" />
          <text x={px} y={py - 14} fill="#fde68a" fontSize="10" fontWeight="bold" textAnchor="middle">
            ({round2(x)}, {round2(y)})
          </text>
        </g>,
      );
    });
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto block h-auto w-full max-w-[520px]"
      role="img"
      aria-label="이차함수와 직선의 위치관계"
    >
      <defs>
        <linearGradient id="qlpBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#080d1e" />
          <stop offset="100%" stopColor="#0c1628" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#qlpBg)" />
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
      {/* 직선 */}
      <line x1={lineX1px} y1={lineY1px} x2={lineX2px} y2={lineY2px} stroke={lineColor} strokeWidth="2.5" />
      {/* 포물선 */}
      <path d={parabPath} fill="none" stroke={parabolaColor} strokeWidth="2.6" />
      {/* 교점 */}
      {intersections}
    </svg>
  );
}

// ─── 메인 ───────────────────────────────────────────────────
type TabId = 0 | 1 | 2;
const TABS: { id: TabId; emoji: string; main: string; sub: string }[] = [
  { id: 0, emoji: "🔬", main: "탐구 1", sub: "그래프 탐구" },
  { id: 1, emoji: "✏️", main: "탐구 2", sub: "연습문제" },
  { id: 2, emoji: "🌟", main: "탐구 3", sub: "생각 넓히기" },
];

export default function QuadLinePositionExplorer() {
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
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">📐 이차함수·직선 위치관계 실험실</h3>
        <p className="mt-2 leading-7 text-slate-300">
          이차함수 그래프와 직선의 <b>위치관계(두 점·접함·만나지 않음)</b> 를 판별식 D = (b − m)² −
          4a(c − n) 으로 탐구해 봅시다.
        </p>
      </div>

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
        <Tab0Explore onDone={() => markDone(0)} />
      </div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <Tab1Problems onDone={() => markDone(1)} />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <Tab2Extend onDone={() => markDone(2)} />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 공용 — Slider ────────────────────────────────────────
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
      <span className={"w-8 font-mono text-sm font-bold " + colorCls}>{label}</span>
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
      <span className={"min-w-[3rem] text-right font-mono text-sm " + colorCls}>{fmtNum(value)}</span>
    </div>
  );
}

// ─── TAB 0 — 그래프 탐구 ───────────────────────────────────
function Tab0Explore({ onDone }: { onDone: () => void }) {
  const [b, setB] = useState(-2);
  const [c, setC] = useState(1);
  const [m, setM] = useState(1);
  const [n, setN] = useState(-2);

  const [touched, setTouched] = useState({ b: false, c: false, m: false, n: false });
  useEffect(() => {
    if (touched.b && touched.c && touched.m && touched.n) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touched.b, touched.c, touched.m, touched.n]);

  const a = 1;
  const bMinusM = b - m;
  const cMinusN = c - n;
  const D = bMinusM * bMinusM - 4 * a * cMinusN;
  const Dv = round2(D);
  const dKind = D > 1e-9 ? "pos" : D > -1e-9 ? "zero" : "neg";

  const conclusion =
    dKind === "pos"
      ? { txt: "서로 다른 두 점에서 만난다 (교점 2개)", tone: "text-emerald-200" }
      : dKind === "zero"
      ? { txt: "한 점에서 만난다 — 접한다 (교점 1개)", tone: "text-amber-200" }
      : { txt: "만나지 않는다 (교점 0개)", tone: "text-rose-200" };

  const badgeCls =
    dKind === "pos"
      ? "border-emerald-400/45 bg-emerald-400/15 text-emerald-200"
      : dKind === "zero"
      ? "border-amber-400/45 bg-amber-400/15 text-amber-200"
      : "border-rose-400/45 bg-rose-400/15 text-rose-200";

  return (
    <div className="space-y-4">
      <p className="text-sm font-extrabold text-violet-200">🔬 이차함수와 직선을 직접 움직여 봅시다</p>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
          {/* 왼쪽: 식 + 그래프 */}
          <div>
            <p className="text-center font-mono text-sm font-extrabold">
              <span className="text-violet-200">y = x² + {fmtNum(b)}x + {fmtNum(c)}</span>
              {" "}|{" "}
              <span className="text-pink-300">y = {fmtNum(m)}x + {fmtNum(n)}</span>
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              <DualGraph a={1} b={b} c={c} m={m} n={n} />
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">
              <span className="text-violet-300">■</span> 이차함수 &nbsp;
              <span className="text-pink-300">■</span> 직선 &nbsp;
              <span className="text-amber-200">●</span> 교점
            </p>
          </div>

          {/* 오른쪽: 슬라이더 + 판별식 분석 */}
          <div className="space-y-3">
            <div className="rounded-xl border border-violet-400/30 bg-violet-400/5 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
                📈 이차함수 (a = 1 고정)
              </p>
              <div className="mt-2 space-y-2">
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
                  color="text-violet-200"
                  ariaLabel="이차항 b"
                />
                <Slider
                  label="c"
                  min={-8}
                  max={8}
                  step={0.5}
                  value={c}
                  onChange={(v) => {
                    setC(v);
                    setTouched((t) => ({ ...t, c: true }));
                  }}
                  color="text-violet-200"
                  ariaLabel="상수항 c"
                />
              </div>
            </div>

            <div className="rounded-xl border border-pink-400/30 bg-pink-400/5 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-pink-300">
                📏 직선 y = mx + n
              </p>
              <div className="mt-2 space-y-2">
                <Slider
                  label="m"
                  min={-6}
                  max={6}
                  step={0.5}
                  value={m}
                  onChange={(v) => {
                    setM(v);
                    setTouched((t) => ({ ...t, m: true }));
                  }}
                  color="text-pink-300"
                  ariaLabel="직선 기울기 m"
                />
                <Slider
                  label="n"
                  min={-10}
                  max={10}
                  step={0.5}
                  value={n}
                  onChange={(v) => {
                    setN(v);
                    setTouched((t) => ({ ...t, n: true }));
                  }}
                  color="text-pink-300"
                  ariaLabel="직선 y절편 n"
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm leading-7">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">판별식</p>
              <div className="mt-1 space-y-0.5 font-mono">
                <p>
                  <span className="italic text-amber-200">D = (b − m)² − 4a(c − n)</span>
                </p>
                <p>= ({fmtNum(bMinusM)})² − 4 × 1 × ({fmtNum(cMinusN)})</p>
                <p>
                  = {round2(bMinusM * bMinusM)} − {round2(4 * cMinusN)} ={" "}
                  <b className="text-amber-200">{Dv}</b>
                </p>
              </div>
              <p className="mt-2">
                <span className={"inline-block rounded-md border px-2 py-0.5 text-xs font-bold " + badgeCls}>
                  {dKind === "pos" ? "D > 0" : dKind === "zero" ? "D = 0" : "D < 0"}
                </span>
              </p>
              <p className={"mt-2 text-sm font-bold " + conclusion.tone}>→ {conclusion.txt}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-4">
        <p className="text-sm font-extrabold text-cyan-200">📌 핵심 정리</p>
        <p className="mt-2 text-sm leading-7 text-slate-200">
          이차함수 <em className="text-violet-200">y = ax² + bx + c</em> 의 그래프와 직선{" "}
          <em className="text-pink-300">y = mx + n</em> 의 교점의 개수
          <br />
          ⟺ 이차방정식 <em className="text-amber-200">ax² + (b−m)x + (c−n) = 0</em> 의 실근의 개수
          <br />
          ⟺ 판별식 <em className="text-amber-200">D = (b−m)² − 4a(c−n)</em> 의 부호
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-md border border-emerald-400/40 bg-emerald-400/10 p-2 text-sm leading-6 text-emerald-100">
            <p className="font-extrabold">D &gt; 0</p>
            <p className="text-xs">서로 다른 두 점에서 만난다 (교점 2개)</p>
          </div>
          <div className="rounded-md border border-amber-400/40 bg-amber-400/10 p-2 text-sm leading-6 text-amber-100">
            <p className="font-extrabold">D = 0</p>
            <p className="text-xs">한 점에서 만난다 — 접한다 (교점 1개)</p>
          </div>
          <div className="rounded-md border border-rose-400/40 bg-rose-400/10 p-2 text-sm leading-6 text-rose-100">
            <p className="font-extrabold">D &lt; 0</p>
            <p className="text-xs">만나지 않는다 (교점 0개)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 1 — 연습문제 (3 sub-tabs) ────────────────────────
type SubOpt = { label: ReactNode; correct: boolean };
type SubQ = { id: string; prompt: ReactNode; opts: SubOpt[] };
type Step = { title: string; intro: ReactNode; qs: SubQ[] };
type Problem = {
  num: string;
  scenario: ReactNode;
  steps: Step[];
  doneSummary: ReactNode;
};

const P1: Problem = {
  num: "문제 1",
  scenario: (
    <>
      이차함수 <b>y = x² + 2x − 5</b> 의 그래프와 직선 <b>y = 4x + k</b> 의 위치 관계가 다음과 같도록
      실수 k 의 값 또는 범위를 정하시오.
    </>
  ),
  steps: [
    {
      title: "STEP 1 — 연립방정식 세우기",
      intro: (
        <>
          교점을 찾으려면 두 식을 같다고 놓으면 됩니다.
          <br />
          <span className="font-mono italic text-amber-200">x² + 2x − 5 = 4x + k</span>
          <br />
          정리하면 어떤 이차방정식이 될까요?
        </>
      ),
      qs: [
        {
          id: "p1s1",
          prompt: <>정리한 이차방정식을 고르세요</>,
          opts: [
            { label: <>x² − 2x + (5 + k) = 0</>, correct: false },
            { label: <>x² − 2x − (5 + k) = 0</>, correct: true },
            { label: <>x² + 6x − (5 + k) = 0</>, correct: false },
          ],
        },
      ],
    },
    {
      title: "STEP 2 — 판별식 D 계산하기",
      intro: (
        <>
          이차방정식 <span className="font-mono italic text-amber-200">x² − 2x − (5 + k) = 0</span> 의
          판별식
          <br />
          <span className="font-mono italic text-violet-200">D = (−2)² − 4 · 1 · (−5 − k)</span> 를
          전개하면?
        </>
      ),
      qs: [
        {
          id: "p1s2",
          prompt: <>D 를 k 로 표현한 식을 고르세요</>,
          opts: [
            { label: <>D = 4k + 24</>, correct: true },
            { label: <>D = 4k − 24</>, correct: false },
            { label: <>D = 4k + 4</>, correct: false },
          ],
        },
      ],
    },
    {
      title: "STEP 3 — 위치관계에 따른 k 범위 / 값",
      intro: <>D = 4k + 24 임을 이용해 각 조건의 정답을 골라보세요.</>,
      qs: [
        {
          id: "p1q1",
          prompt: (
            <>
              <b>(1) 서로 다른 두 점에서 만난다</b> — D &gt; 0 이면?
            </>
          ),
          opts: [
            { label: <>k &lt; −6</>, correct: false },
            { label: <>k &gt; 6</>, correct: false },
            { label: <>k &gt; −6</>, correct: true },
          ],
        },
        {
          id: "p1q2",
          prompt: (
            <>
              <b>(2) 한 점에서 만난다 (접한다)</b> — D = 0 이면?
            </>
          ),
          opts: [
            { label: <>k = 6</>, correct: false },
            { label: <>k = −6</>, correct: true },
            { label: <>k = −24</>, correct: false },
          ],
        },
        {
          id: "p1q3",
          prompt: (
            <>
              <b>(3) 만나지 않는다</b> — D &lt; 0 이면?
            </>
          ),
          opts: [
            { label: <>k &lt; −6</>, correct: true },
            { label: <>k &gt; −6</>, correct: false },
            { label: <>k &lt; 6</>, correct: false },
          ],
        },
      ],
    },
  ],
  doneSummary: (
    <>
      D = 4k + 24 &nbsp;→&nbsp; D &gt; 0: k &gt; −6 &nbsp;|&nbsp; D = 0: k = −6 &nbsp;|&nbsp;
      D &lt; 0: k &lt; −6
    </>
  ),
};

const P2: Problem = {
  num: "문제 2",
  scenario: (
    <>
      이차함수 <b>y = x² − 6x + 5</b> 의 그래프와 직선 <b>y = 2x + k</b> 의 위치 관계가 다음과 같도록
      실수 k 의 값 또는 범위를 정하시오.
    </>
  ),
  steps: [
    {
      title: "STEP 1 — 연립방정식 세우기",
      intro: (
        <>
          <span className="font-mono italic text-amber-200">x² − 6x + 5 = 2x + k</span>
          <br />
          정리하면 어떤 이차방정식이 될까요?
        </>
      ),
      qs: [
        {
          id: "p2s1",
          prompt: <>정리한 이차방정식을 고르세요</>,
          opts: [
            { label: <>x² − 4x + (5 − k) = 0</>, correct: false },
            { label: <>x² − 8x + (5 − k) = 0</>, correct: true },
            { label: <>x² − 8x + (5 + k) = 0</>, correct: false },
          ],
        },
      ],
    },
    {
      title: "STEP 2 — 판별식 D 계산하기",
      intro: (
        <>
          이차방정식 <span className="font-mono italic text-amber-200">x² − 8x + (5 − k) = 0</span> 의
          판별식
          <br />
          <span className="font-mono italic text-violet-200">D = (−8)² − 4 · 1 · (5 − k)</span> 를
          전개하면?
        </>
      ),
      qs: [
        {
          id: "p2s2",
          prompt: <>D 를 k 로 표현한 식을 고르세요</>,
          opts: [
            { label: <>D = 4k − 44</>, correct: false },
            { label: <>D = 4k + 20</>, correct: false },
            { label: <>D = 4k + 44</>, correct: true },
          ],
        },
      ],
    },
    {
      title: "STEP 3 — 위치관계에 따른 k 범위 / 값",
      intro: <>D = 4k + 44 임을 이용해 각 조건의 정답을 골라보세요.</>,
      qs: [
        {
          id: "p2q1",
          prompt: (
            <>
              <b>(1) 서로 다른 두 점에서 만난다</b> — D &gt; 0 이면?
            </>
          ),
          opts: [
            { label: <>k &gt; −11</>, correct: true },
            { label: <>k &lt; −11</>, correct: false },
            { label: <>k &gt; 11</>, correct: false },
          ],
        },
        {
          id: "p2q2",
          prompt: (
            <>
              <b>(2) 한 점에서 만난다 (접한다)</b> — D = 0 이면?
            </>
          ),
          opts: [
            { label: <>k = 11</>, correct: false },
            { label: <>k = −44</>, correct: false },
            { label: <>k = −11</>, correct: true },
          ],
        },
        {
          id: "p2q3",
          prompt: (
            <>
              <b>(3) 만나지 않는다</b> — D &lt; 0 이면?
            </>
          ),
          opts: [
            { label: <>k &lt; 11</>, correct: false },
            { label: <>k &lt; −11</>, correct: true },
            { label: <>k &gt; −11</>, correct: false },
          ],
        },
      ],
    },
  ],
  doneSummary: (
    <>
      D = 4k + 44 &nbsp;→&nbsp; D &gt; 0: k &gt; −11 &nbsp;|&nbsp; D = 0: k = −11 &nbsp;|&nbsp;
      D &lt; 0: k &lt; −11
    </>
  ),
};

const P3: Problem = {
  num: "문제 3",
  scenario: (
    <>
      이차함수 <b>y = x² + 3x − 2</b> 의 그래프와 직선 <b>y = x + k</b> 의 위치 관계가 다음과 같도록
      실수 k 의 값 또는 범위를 정하시오.
    </>
  ),
  steps: [
    {
      title: "STEP 1 — 연립방정식 세우기",
      intro: (
        <>
          <span className="font-mono italic text-amber-200">x² + 3x − 2 = x + k</span>
          <br />
          정리하면 어떤 이차방정식이 될까요?
        </>
      ),
      qs: [
        {
          id: "p3s1",
          prompt: <>정리한 이차방정식을 고르세요</>,
          opts: [
            { label: <>x² + 2x + (2 + k) = 0</>, correct: false },
            { label: <>x² + 4x − (2 + k) = 0</>, correct: false },
            { label: <>x² + 2x − (2 + k) = 0</>, correct: true },
          ],
        },
      ],
    },
    {
      title: "STEP 2 — 판별식 D 계산하기",
      intro: (
        <>
          이차방정식 <span className="font-mono italic text-amber-200">x² + 2x − (2 + k) = 0</span> 의
          판별식
          <br />
          <span className="font-mono italic text-violet-200">D = (2)² − 4 · 1 · (−2 − k)</span> 를
          전개하면?
        </>
      ),
      qs: [
        {
          id: "p3s2",
          prompt: <>D 를 k 로 표현한 식을 고르세요</>,
          opts: [
            { label: <>D = 4k + 12</>, correct: true },
            { label: <>D = 4k − 12</>, correct: false },
            { label: <>D = 4k + 16</>, correct: false },
          ],
        },
      ],
    },
    {
      title: "STEP 3 — 위치관계에 따른 k 범위 / 값",
      intro: <>D = 4k + 12 임을 이용해 각 조건의 정답을 골라보세요.</>,
      qs: [
        {
          id: "p3q1",
          prompt: (
            <>
              <b>(1) 서로 다른 두 점에서 만난다</b> — D &gt; 0 이면?
            </>
          ),
          opts: [
            { label: <>k &lt; −3</>, correct: false },
            { label: <>k &gt; −3</>, correct: true },
            { label: <>k &gt; 3</>, correct: false },
          ],
        },
        {
          id: "p3q2",
          prompt: (
            <>
              <b>(2) 한 점에서 만난다 (접한다)</b> — D = 0 이면?
            </>
          ),
          opts: [
            { label: <>k = −3</>, correct: true },
            { label: <>k = 3</>, correct: false },
            { label: <>k = −12</>, correct: false },
          ],
        },
        {
          id: "p3q3",
          prompt: (
            <>
              <b>(3) 만나지 않는다</b> — D &lt; 0 이면?
            </>
          ),
          opts: [
            { label: <>k &gt; −3</>, correct: false },
            { label: <>k &lt; 3</>, correct: false },
            { label: <>k &lt; −3</>, correct: true },
          ],
        },
      ],
    },
  ],
  doneSummary: (
    <>
      D = 4k + 12 &nbsp;→&nbsp; D &gt; 0: k &gt; −3 &nbsp;|&nbsp; D = 0: k = −3 &nbsp;|&nbsp;
      D &lt; 0: k &lt; −3
    </>
  ),
};

const PROBLEMS = [P1, P2, P3];

function Tab1Problems({ onDone }: { onDone: () => void }) {
  const [prob, setProb] = useState(0);
  const [picked, setPicked] = useState<Record<string, number>>({});

  function pick(qid: string, oi: number) {
    setPicked((m) => (qid in m ? m : { ...m, [qid]: oi }));
  }

  function probDone(p: Problem): boolean {
    return p.steps.every((s) =>
      s.qs.every((q) => {
        const oi = picked[q.id];
        return oi !== undefined && q.opts[oi].correct;
      }),
    );
  }

  const allProbsDone = PROBLEMS.every(probDone);
  useEffect(() => {
    if (allProbsDone) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProbsDone]);

  function reset() {
    setPicked({});
    setProb(0);
  }

  const cur = PROBLEMS[prob];
  const curDone = probDone(cur);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {PROBLEMS.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setProb(i)}
            className={
              "rounded-xl border-2 px-2 py-2 text-sm font-bold transition " +
              (prob === i
                ? "border-violet-400/60 bg-violet-400/15 text-violet-100"
                : probDone(p)
                ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-200"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {p.num}
            {probDone(p) ? " ✓" : ""}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-violet-400/30 bg-violet-400/10 p-4 text-sm leading-7 text-slate-100">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-300">📝 {cur.num}</p>
        <p className="mt-1">{cur.scenario}</p>
      </div>

      {cur.steps.map((step, si) => (
        <div key={si} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">{step.title}</p>
          <div className="mt-2 text-sm leading-7 text-slate-200">{step.intro}</div>
          <div className="mt-3 space-y-3">
            {step.qs.map((q) => {
              const cur2 = picked[q.id];
              const answered = cur2 !== undefined;
              return (
                <div key={q.id} className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                  <p className="text-sm text-slate-100">{q.prompt}</p>
                  <div className="mt-2 space-y-2">
                    {q.opts.map((o, oi) => {
                      const isAns = o.correct;
                      const isChosen = cur2 === oi;
                      const showCorrect = answered && isAns;
                      const showWrong = answered && isChosen && !isAns;
                      return (
                        <button
                          key={oi}
                          type="button"
                          disabled={answered}
                          onClick={() => pick(q.id, oi)}
                          className={
                            "w-full rounded-lg border-2 px-3 py-2 text-left text-sm font-bold transition disabled:cursor-default " +
                            (showCorrect
                              ? "border-emerald-400 bg-emerald-400/20 text-emerald-100 ring-2 ring-emerald-300/55"
                              : showWrong
                              ? "border-rose-400 bg-rose-400/20 text-rose-100 ring-2 ring-rose-300/55"
                              : "border-white/10 bg-white/5 text-slate-100 hover:border-violet-400/45 hover:bg-violet-400/10")
                          }
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                  {answered ? (
                    <p
                      className={
                        "mt-2 text-xs font-bold leading-6 " +
                        (q.opts[cur2].correct ? "text-emerald-200" : "text-rose-200")
                      }
                    >
                      {q.opts[cur2].correct ? "✅ 정답!" : "❌ 다시 확인해 보세요."}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {curDone ? (
        <div className="rounded-2xl border border-amber-400/45 bg-amber-400/10 p-5 text-center">
          <p className="text-3xl">🎉</p>
          <p className="mt-1 text-lg font-extrabold text-amber-100">{cur.num} 완료!</p>
          <p className="mt-2 text-sm leading-7 text-amber-100/85">{cur.doneSummary}</p>
          {prob < PROBLEMS.length - 1 ? (
            <button
              type="button"
              onClick={() => setProb(prob + 1)}
              className="mt-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
            >
              {PROBLEMS[prob + 1].num} →
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200 hover:bg-white/10"
        >
          ↻ 전체 초기화
        </button>
      </div>
    </div>
  );
}

// ─── TAB 2 — 생각 넓히기 ──────────────────────────────────
type ExtendQ = { id: string; prompt: ReactNode; opts: SubOpt[] };

const METHOD1_QS: ExtendQ[] = [
  {
    id: "c1",
    prompt: <>① 두 식을 연립하면 어떤 이차방정식이 되나요?</>,
    opts: [
      { label: <>x² + (2 + k)x + 3 = 0</>, correct: false },
      { label: <>x² − (2 + k)x + 5 = 0</>, correct: false },
      { label: <>x² − (2 + k)x − 3 = 0</>, correct: true },
    ],
  },
  {
    id: "c2",
    prompt: <>② 이 이차방정식의 판별식 D = (2 + k)² − 4 · 1 · (−3) 을 전개하면?</>,
    opts: [
      { label: <>D = (2 + k)² − 12</>, correct: false },
      { label: <>D = (2 + k)² + 12</>, correct: true },
      { label: <>D = (k − 2)² + 12</>, correct: false },
    ],
  },
  {
    id: "c3",
    prompt: <>③ D = (2 + k)² + 12 가 항상 D &gt; 0 인 이유는?</>,
    opts: [
      { label: <>(2 + k)² ≥ 0 이므로 D ≥ 12 &gt; 0</>, correct: true },
      { label: <>12 &gt; 0 이기만 하면 항상 D &gt; 0</>, correct: false },
      { label: <>k 가 항상 양수이므로 D &gt; 0</>, correct: false },
    ],
  },
];

const METHOD2_QS: ExtendQ[] = [
  {
    id: "g1",
    prompt: <>① 직선 y = kx + 4 가 항상 지나는 점은? (x = 0 대입)</>,
    opts: [
      { label: <>(4, 0)</>, correct: false },
      { label: <>(0, k)</>, correct: false },
      { label: <>(0, 4)</>, correct: true },
    ],
  },
  {
    id: "g2",
    prompt: <>② x = 0 에서 이차함수값은? → 고정점 (0, 4) 와 위치 비교</>,
    opts: [
      { label: <>y = 3 → 고정점이 포물선보다 위</>, correct: false },
      { label: <>y = 1 → 고정점이 포물선보다 위</>, correct: true },
      { label: <>y = 4 → 고정점이 포물선 위에 있음</>, correct: false },
    ],
  },
  {
    id: "g3",
    prompt: <>③ y = x² − 2x + 1 의 꼭짓점은? (완전제곱식으로 변환)</>,
    opts: [
      { label: <>꼭짓점 (1, 0) — 최솟값 0</>, correct: true },
      { label: <>꼭짓점 (−1, 0) — 최솟값 0</>, correct: false },
      { label: <>꼭짓점 (1, 2) — 최솟값 2</>, correct: false },
    ],
  },
];

function Tab2Extend({ onDone }: { onDone: () => void }) {
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [k, setK] = useState(1);

  function pick(qid: string, oi: number) {
    setPicked((m) => (qid in m ? m : { ...m, [qid]: oi }));
  }

  function allCorrect(qs: ExtendQ[]) {
    return qs.every((q) => {
      const oi = picked[q.id];
      return oi !== undefined && q.opts[oi].correct;
    });
  }

  const m1Done = allCorrect(METHOD1_QS);
  const m2Done = allCorrect(METHOD2_QS);
  const allDone = m1Done && m2Done;

  useEffect(() => {
    if (allDone) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  function reset() {
    setPicked({});
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm leading-7 text-amber-50">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">⭐ 생각 넓히기</p>
        <p className="mt-1">
          이차함수 <b>y = x² − 2x + 1</b> 의 그래프와 직선 <b>y = kx + 4</b> 는 실수 k 의 값에
          관계없이 항상 서로 다른 두 점에서 만남을 두 가지 방법으로 설명해 봅시다.
        </p>
      </div>

      {/* 방법 1 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          방법 1 — 이차방정식의 판별식 이용하기
        </p>
        <div className="mt-3 space-y-3">
          {METHOD1_QS.map((q) => (
            <ChoiceQ key={q.id} q={q} picked={picked} onPick={pick} />
          ))}
        </div>
      </div>

      {/* 방법 2 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          방법 2 — 그래프 이용하기
        </p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-start">
          {/* 왼쪽: 질문들 */}
          <div className="space-y-3">
            <p className="text-sm leading-7 text-slate-300">
              직선 y = kx + 4 는 기울기 k 에 관계없이 항상 한 점을 지납니다. 오른쪽 그래프에서
              슬라이더를 움직이며 확인해 보세요.
            </p>
            {METHOD2_QS.map((q) => (
              <ChoiceQ key={q.id} q={q} picked={picked} onPick={pick} />
            ))}
            {m2Done ? (
              <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-xs leading-6 text-emerald-100">
                ✨ y = (x − 1)² → 꼭짓점 (1, 0), 최솟값 0.
                <br />
                x = 0 에서 포물선값은 1 이고 고정점 y = 4 &gt; 1
                <br />→ 고정점 (0, 4) 가 포물선 위에 있습니다. 포물선은 양 끝으로 +∞ → k 가 어떤
                값이든 직선은 반드시 포물선과 두 번 만납니다!
              </div>
            ) : null}
          </div>

          {/* 오른쪽: 미니 그래프 */}
          <div className="space-y-2">
            <p className="text-center text-xs font-bold text-violet-300">📊 그래프로 확인하기</p>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <DualGraph
                a={1}
                b={-2}
                c={1}
                m={k}
                n={4}
                width={380}
                height={280}
                scale={28}
              />
            </div>
            <Slider
              label="k"
              color="text-pink-300"
              min={-5}
              max={5}
              step={0.5}
              value={k}
              onChange={setK}
              ariaLabel="직선 기울기 k"
            />
            <p className="text-xs leading-5 text-slate-400">
              <span className="text-violet-300">■</span> y = (x − 1)² &nbsp;&nbsp;
              <span className="text-pink-300">■</span> y = kx + 4
              <br />
              <span className="text-amber-200">●</span> 고정점 (0, 4) &nbsp;&nbsp;
              <span className="text-emerald-300">●</span> 교점
            </p>
          </div>
        </div>
      </div>

      {allDone ? (
        <div className="rounded-2xl border border-emerald-400/45 bg-emerald-400/10 p-5 text-center">
          <p className="text-3xl">🏆</p>
          <p className="mt-1 text-lg font-extrabold text-emerald-100">생각 넓히기 완료!</p>
          <p className="mt-2 text-sm leading-7 text-emerald-100/85">
            D = (2 + k)² + 12 ≥ 12 &gt; 0 → 항상 D &gt; 0
            <br />→ 이차함수와 직선은 k 에 관계없이{" "}
            <b className="text-emerald-200">항상 두 점에서 만납니다!</b>
          </p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200 hover:bg-white/10"
        >
          ↻ 답 초기화
        </button>
      </div>
    </div>
  );
}

function ChoiceQ({
  q,
  picked,
  onPick,
}: {
  q: ExtendQ;
  picked: Record<string, number>;
  onPick: (qid: string, oi: number) => void;
}) {
  const cur = picked[q.id];
  const answered = cur !== undefined;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
      <p className="text-sm leading-7 text-slate-100">{q.prompt}</p>
      <div className="mt-2 space-y-2">
        {q.opts.map((o, oi) => {
          const isAns = o.correct;
          const isChosen = cur === oi;
          const showCorrect = answered && isAns;
          const showWrong = answered && isChosen && !isAns;
          return (
            <button
              key={oi}
              type="button"
              disabled={answered}
              onClick={() => onPick(q.id, oi)}
              className={
                "w-full rounded-lg border-2 px-3 py-2 text-left text-sm font-bold transition disabled:cursor-default " +
                (showCorrect
                  ? "border-emerald-400 bg-emerald-400/20 text-emerald-100 ring-2 ring-emerald-300/55"
                  : showWrong
                  ? "border-rose-400 bg-rose-400/20 text-rose-100 ring-2 ring-rose-300/55"
                  : "border-white/10 bg-white/5 text-slate-100 hover:border-violet-400/45 hover:bg-violet-400/10")
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {answered ? (
        <p
          className={
            "mt-2 text-xs font-bold leading-6 " +
            (q.opts[cur].correct ? "text-emerald-200" : "text-rose-200")
          }
        >
          {q.opts[cur].correct ? "✅ 정답!" : "❌ 다시 확인해 보세요."}
        </p>
      ) : null}
    </div>
  );
}
