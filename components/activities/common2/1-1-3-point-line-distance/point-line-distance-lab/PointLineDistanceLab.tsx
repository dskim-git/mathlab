"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  DIST_PROBLEMS,
  PARALLEL_WHY,
  PARALLEL_WHY_ANSWER,
  PAR_PAIRS,
  distTex,
  distanceOf,
  footOf,
  genTex,
  radTex,
  stdParTex,
  stdTex,
  type DistProblem,
  type ParPair,
  type Pt,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_perp",
    prompt:
      "탭①에서 직선 위의 점 P를 이리저리 옮겨 보았어요. 왜 하필 ‘수선의 발’까지의 거리를 점과 직선 사이의 거리라고 정하는지, 관찰한 것을 근거로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: P를 움직이면 AP 길이가 변하는데 수선의 발 H에서 가장 짧아졌다. 거리는 보통 가장 가까운 거리를 뜻하므로 AH를 점과 직선 사이의 거리로 정한다.",
  },
  {
    id: "formula_steps",
    prompt:
      "점 (x₁, y₁)과 직선 ax + by + c = 0 사이의 거리를 구하는 순서를 자신의 말로 정리해 보세요. 직선이 y = mx + n 꼴로 주어졌을 때 먼저 해야 할 일도 함께 적어 주세요.",
    kind: "text",
    placeholder:
      "예: ① 직선을 ax + by + c = 0 꼴로 고치고 ② 점의 좌표를 넣어 |ax₁+by₁+c|를 구한 뒤 ③ √(a²+b²)로 나눈다. y = mx + n 은 y를 넘겨 mx − y + n = 0 으로 먼저 고친다.",
  },
  {
    id: "parallel_any_point",
    prompt:
      "평행한 두 직선 사이의 거리를 구할 때, 한 직선 위의 점을 어느 것으로 골라도 답이 같았어요. 왜 그런지 이유를 적어 보세요.",
    kind: "text",
    placeholder:
      "예: l₁ 위의 점은 ax₀ + by₀ = −c₁ 을 만족하므로, l₂ 까지의 거리 식에 넣으면 |ax₀+by₀+c₂| = |c₂−c₁| 이 되어 점의 위치와 상관없이 같은 값이 된다.",
  },
];

// ─── 좌표평면 공용 ────────────────────────────────────────────
const G = { MIN: -8, MAX: 8, U: 21, PAD: 30 };
const SPAN = (G.MAX - G.MIN) * G.U;
const VB = SPAN + G.PAD * 2;

function gx(v: number): number {
  return G.PAD + (v - G.MIN) * G.U;
}
function gy(v: number): number {
  return G.PAD + (G.MAX - v) * G.U;
}
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function range(lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let i = lo; i <= hi; i++) out.push(i);
  return out;
}
function nx(v: number): string {
  const r = Math.round(v * 100) / 100;
  return r < 0 ? `−${Math.abs(r)}` : String(r);
}

function GridLines() {
  return (
    <g>
      {range(G.MIN, G.MAX).map((v) => (
        <line key={`vx${v}`} x1={gx(v)} y1={gy(G.MAX)} x2={gx(v)} y2={gy(G.MIN)} stroke="rgba(255,255,255,0.055)" strokeWidth={1} />
      ))}
      {range(G.MIN, G.MAX).map((v) => (
        <line key={`hy${v}`} x1={gx(G.MIN)} y1={gy(v)} x2={gx(G.MAX)} y2={gy(v)} stroke="rgba(255,255,255,0.055)" strokeWidth={1} />
      ))}
      <line x1={gx(G.MIN)} y1={gy(0)} x2={gx(G.MAX)} y2={gy(0)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={gx(0)} y1={gy(G.MIN)} x2={gx(0)} y2={gy(G.MAX)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      {range(G.MIN, G.MAX)
        .filter((v) => v !== 0 && v % 2 === 0)
        .map((v) => (
          <text key={`tx${v}`} x={gx(v)} y={gy(0) + 12} textAnchor="middle" className="fill-slate-500 font-mono text-[8px]">
            {v}
          </text>
        ))}
      {range(G.MIN, G.MAX)
        .filter((v) => v !== 0 && v % 2 === 0)
        .map((v) => (
          <text key={`ty${v}`} x={gx(0) - 6} y={gy(v) + 3} textAnchor="end" className="fill-slate-500 font-mono text-[8px]">
            {v}
          </text>
        ))}
      <text x={gx(0) - 6} y={gy(0) + 12} textAnchor="end" className="fill-slate-500 font-mono text-[8px]">
        O
      </text>
      <text x={gx(G.MAX) - 2} y={gy(0) - 6} textAnchor="end" className="fill-slate-400 text-[10px] italic">
        x
      </text>
      <text x={gx(0) + 8} y={gy(G.MAX) + 8} className="fill-slate-400 text-[10px] italic">
        y
      </text>
    </g>
  );
}

function Plane({
  cid,
  svgRef,
  label,
  small,
  children,
}: {
  cid: string;
  svgRef?: React.Ref<SVGSVGElement>;
  label: string;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        className={"mx-auto block w-full touch-none select-none " + (small ? "max-w-[300px]" : "max-w-[400px]")}
        role="img"
        aria-label={label}
      >
        <defs>
          <clipPath id={cid}>
            <rect x={gx(G.MIN)} y={gy(G.MAX)} width={SPAN} height={SPAN} />
          </clipPath>
        </defs>
        <GridLines />
        {children}
      </svg>
    </div>
  );
}

function Clipped({ cid, children }: { cid: string; children: React.ReactNode }) {
  return <g clipPath={`url(#${cid})`}>{children}</g>;
}

/** ax + by + c = 0 을 격자 끝까지 그린다. */
function LineDraw({ a, b, c, color, width = 3, dash }: { a: number; b: number; c: number; color: string; width?: number; dash?: string }) {
  if (a === 0 && b === 0) return null;
  let p: [number, number, number, number];
  if (b === 0) {
    const x = -c / a;
    p = [gx(x), gy(G.MAX + 4), gx(x), gy(G.MIN - 4)];
  } else {
    const yAt = (x: number) => (-a * x - c) / b;
    p = [gx(G.MIN - 4), gy(yAt(G.MIN - 4)), gx(G.MAX + 4), gy(yAt(G.MAX + 4))];
  }
  return <line x1={p[0]} y1={p[1]} x2={p[2]} y2={p[3]} stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" />;
}

function Dot({ p, color, label, onDown, r = 6 }: { p: Pt; color: string; label?: string; onDown?: () => void; r?: number }) {
  return (
    <g
      className={onDown ? "cursor-grab touch-none" : undefined}
      onPointerDown={
        onDown
          ? (e) => {
              e.preventDefault();
              onDown();
            }
          : undefined
      }
    >
      {onDown ? <circle cx={gx(p.x)} cy={gy(p.y)} r={16} fill="transparent" /> : null}
      <circle cx={gx(p.x)} cy={gy(p.y)} r={r} fill={color} stroke="#0f172a" strokeWidth={2} />
      {label ? (
        <text
          x={gx(p.x)}
          y={p.y >= G.MAX ? gy(p.y) + 19 : gy(p.y) - 12}
          textAnchor={p.x <= G.MIN + 1 ? "start" : p.x >= G.MAX - 1 ? "end" : "middle"}
          className="fill-white font-mono text-[10px] font-bold"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

/** 직각 표시 — 점 H 에서 직선 방향 u 와 수선 방향 v 로 작은 사각형. */
function RightAngle({ h, a, b, size = 11 }: { h: Pt; a: number; b: number; size?: number }) {
  const len = Math.hypot(a, b) || 1;
  const u = { x: b / len, y: -a / len }; // 직선 방향
  const v = { x: a / len, y: b / len }; // 법선 방향
  const P = (dx: number, dy: number) => `${gx(h.x) + dx},${gy(h.y) - dy}`;
  const pts = [P(0, 0), P(u.x * size, u.y * size), P((u.x + v.x) * size, (u.y + v.y) * size), P(v.x * size, v.y * size)].join(" ");
  return <polygon points={pts} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />;
}

/** 격자 위 드래그 */
function useGridDrag(svgRef: React.RefObject<SVGSVGElement | null>, onDrag: (id: string, p: Pt) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const cb = useRef(onDrag);
  useEffect(() => {
    cb.current = onDrag;
  });
  useEffect(() => {
    if (!dragId) return;
    function move(e: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (VB / rect.width);
      const sy = (e.clientY - rect.top) * (VB / rect.height);
      cb.current(dragId as string, {
        x: clamp((sx - G.PAD) / G.U + G.MIN, G.MIN, G.MAX),
        y: clamp(G.MAX - (sy - G.PAD) / G.U, G.MIN, G.MAX),
      });
    }
    function up() {
      setDragId(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragId, svgRef]);
  return { setDragId };
}

function num(s: string): number | null {
  const t = s.trim().replace(/[−–—]/g, "-").replace(/\s/g, "");
  if (!t || t === "-") return null;
  if (!/^-?\d+$/.test(t)) return null;
  return Number(t);
}
function isAns(s: string, target: number): boolean {
  const v = num(s);
  return v !== null && v === target;
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "why" | "formula" | "parallel";

export default function PointLineDistanceLab() {
  const [tab, setTab] = useState<Tab>("why");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">📏 점과 직선 사이의 거리</h3>
        <p className="mt-2 leading-7 text-slate-300">
          직선 위의 수많은 점 중 <b className="text-emerald-200">어느 점까지</b>의 거리를 재야 할까요? 직접 끌어 보며 확인하고,
          <b className="text-amber-200"> 거리 공식</b>과 <b className="text-violet-200">평행한 두 직선 사이의 거리</b>까지 단계별로 풀어 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "why"} onClick={() => setTab("why")}>
          ① 왜 수선일까? 🔍
        </TabButton>
        <TabButton active={tab === "formula"} onClick={() => setTab("formula")}>
          ② 거리 공식 연습
        </TabButton>
        <TabButton active={tab === "parallel"} onClick={() => setTab("parallel")}>
          ③ 평행한 두 직선
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "why" ? <WhyTab /> : null}
        {tab === "formula" ? <FormulaTab /> : null}
        {tab === "parallel" ? <ParallelTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-4 py-2 text-sm font-bold transition " +
        (active ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 왜 수선일까?
// ══════════════════════════════════════════════════════════════
const FAN_TS = [-8, -6, -4, -2, 0, 2, 4, 6, 8];

function WhyTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState<Pt>({ x: -2, y: 5 });
  const [m, setM] = useState(1);
  const [n, setN] = useState(-2);
  const [t, setT] = useState(4);
  const [fan, setFan] = useState(false);
  const [seeking, setSeeking] = useState(false);

  const tRef = useRef(t);
  const targetRef = useRef(0);
  function setTv(v: number) {
    tRef.current = v;
    setT(v);
  }

  // 직선 l: y = mx + n  ⇔  mx − y + n = 0
  const LA = m;
  const LB = -1;
  const LC = n;

  const A: Pt = { x: Math.round(a.x), y: Math.round(a.y) };
  const H = footOf(A, LA, LB, LC);
  const dMin = distanceOf(A, LA, LB, LC);
  const P: Pt = { x: t, y: m * t + n };
  const AP = Math.hypot(A.x - P.x, A.y - P.y);
  const atFoot = Math.abs(t - H.x) < 0.12;

  const numerator = Math.abs(LA * A.x + LB * A.y + LC);
  const denom = LA * LA + LB * LB;

  const { setDragId } = useGridDrag(svgRef, (id, p) => {
    if (id === "A") setA({ x: Math.round(p.x), y: Math.round(p.y) });
    else setTv(clamp(Math.round(p.x * 4) / 4, G.MIN, G.MAX));
  });

  // "가장 짧은 곳으로" 애니메이션
  useEffect(() => {
    if (!seeking) return;
    const id = window.setInterval(() => {
      const target = targetRef.current;
      const cur = tRef.current;
      if (Math.abs(target - cur) < 0.03) {
        setTv(Math.round(target * 100) / 100);
        setSeeking(false);
        return;
      }
      setTv(cur + (target - cur) * 0.28);
    }, 28);
    return () => window.clearInterval(id);
  }, [seeking]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 그래프 */}
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          <Plane cid="why-plane" svgRef={svgRef} label="점 A와 직선 위의 점 P">
            <Clipped cid="why-plane">
              {/* 여러 점까지의 선분(부채꼴) */}
              {fan
                ? FAN_TS.map((tt) => {
                    const q = { x: tt, y: m * tt + n };
                    const len = Math.hypot(A.x - q.x, A.y - q.y);
                    return (
                      <line
                        key={tt}
                        x1={gx(A.x)}
                        y1={gy(A.y)}
                        x2={gx(q.x)}
                        y2={gy(q.y)}
                        stroke="#64748b"
                        strokeWidth={1.4}
                        strokeOpacity={0.55}
                        strokeDasharray="3 3"
                      >
                        <title>{`길이 ${len.toFixed(2)}`}</title>
                      </line>
                    );
                  })
                : null}

              <LineDraw a={LA} b={LB} c={LC} color="#34d399" width={3} />

              {/* 최단 거리(수선) */}
              <line x1={gx(A.x)} y1={gy(A.y)} x2={gx(H.x)} y2={gy(H.y)} stroke="#f472b6" strokeWidth={2} strokeDasharray="5 4" />
              <RightAngle h={H} a={LA} b={LB} />

              {/* 현재 선분 AP */}
              <line x1={gx(A.x)} y1={gy(A.y)} x2={gx(P.x)} y2={gy(P.y)} stroke={atFoot ? "#f472b6" : "#fbbf24"} strokeWidth={3.5} />
            </Clipped>

            <Dot p={H} color="#f472b6" r={5} />
            <Dot p={P} color="#fbbf24" label={`P(${nx(P.x)}, ${nx(P.y)})`} onDown={() => setDragId("P")} />
            <Dot p={A} color="#22d3ee" label={`A(${nx(A.x)}, ${nx(A.y)})`} onDown={() => setDragId("A")} />
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 점 A와 직선 위의 노란 점 P를 끌어 보세요</p>
        </div>

        {/* 조작 + 측정 */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-100">📐 직선 l</span>
              <span className="max-w-full overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-1 text-slate-100">
                <Katex expr={`${stdTex(m, n)} \\;\\Leftrightarrow\\; ${genTex(LA, LB, LC)}`} />
              </span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Slider label="기울기 m" value={m} min={-3} max={3} step={1} onChange={setM} />
              <Slider label="y절편 n" value={n} min={-6} max={6} step={1} onChange={setN} />
            </div>
            <div className="mt-2">
              <Slider label="P의 x좌표" value={t} min={G.MIN} max={G.MAX} step={0.25} onChange={setTv} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  targetRef.current = clamp(H.x, G.MIN, G.MAX);
                  setSeeking(true);
                }}
                className="rounded-lg border-2 border-pink-400/55 bg-pink-400/15 px-3 py-1.5 text-xs font-bold text-pink-100 transition hover:bg-pink-400/25"
              >
                🎯 가장 짧은 곳으로
              </button>
              <button
                type="button"
                onClick={() => setFan((v) => !v)}
                className={
                  "rounded-lg border px-3 py-1.5 text-xs font-bold transition " +
                  (fan ? "border-slate-300/50 bg-white/15 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                👀 여러 점까지 한꺼번에
              </button>
            </div>
          </div>

          {/* 측정 */}
          <div className={"rounded-2xl border p-4 transition-colors " + (atFoot ? "border-pink-400/50 bg-pink-400/[0.10]" : "border-amber-400/30 bg-amber-400/[0.06]")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-100">📏 지금 재고 있는 길이</span>
              {atFoot ? (
                <span className="rounded-lg border-2 border-pink-400/60 bg-pink-400/20 px-3 py-1 text-xs font-extrabold text-pink-100">🏆 최소!</span>
              ) : (
                <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                  최소보다 +{(AP - dMin).toFixed(2)}
                </span>
              )}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Stat label="AP (지금)" value={AP.toFixed(2)} tone={atFoot ? "pink" : "amber"} />
              <Stat label="AH (최소 = 거리)" value={dMin.toFixed(2)} tone="pink" />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              직선 위의 점은 무수히 많지만, <b className="text-pink-200">A에서 내린 수선의 발 H</b>까지가 가장 짧아요. 그래서 이 길이를{" "}
              <b className="text-pink-200">점과 직선 사이의 거리</b>라고 정합니다.
            </p>
          </div>

          {/* 거리 그래프 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-xs font-bold text-slate-400">📉 P의 위치(x좌표)에 따른 AP 길이</p>
            <LengthChart A={A} m={m} n={n} t={t} hx={H.x} />
          </div>
        </div>
      </div>

      {/* 공식 */}
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">✨ 이 최소 거리를 한 번에 구하는 공식</p>
        <div className="mt-2 space-y-2">
          <div className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2 text-slate-100">
            <Katex expr="d = \frac{|ax_1 + by_1 + c|}{\sqrt{a^2 + b^2}}" display />
          </div>
          <div className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2 text-slate-100">
            <Katex
              expr={`d = \\frac{|${LA}\\cdot(${A.x}) + (${LB})\\cdot(${A.y}) + (${LC})|}{\\sqrt{${LA}^2 + (${LB})^2}} = \\frac{${numerator}}{${radTex(denom)}} = ${distTex(numerator, denom)} \\approx ${dMin.toFixed(2)}`}
              display
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-400">위에서 자로 잰 AH 값과 같은지 확인해 보세요!</p>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400">{label}</span>
        <span className="font-mono text-xs font-bold text-slate-100">{nx(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-1.5 w-full accent-cyan-400"
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "pink" | "amber" }) {
  const cls = tone === "pink" ? "border-pink-400/45 bg-pink-400/10 text-pink-100" : "border-amber-400/45 bg-amber-400/10 text-amber-100";
  return (
    <div className={"rounded-xl border px-3 py-2 text-center " + cls}>
      <p className="text-[11px] font-bold opacity-85">{label}</p>
      <p className="mt-0.5 font-mono text-xl font-bold">{value}</p>
    </div>
  );
}

/** AP 길이를 P의 x좌표에 대한 곡선으로 그린다. */
function LengthChart({ A, m, n, t, hx }: { A: Pt; m: number; n: number; t: number; hx: number }) {
  const W = 420;
  const H = 130;
  const PADL = 30;
  const PADB = 20;
  const len = (x: number) => Math.hypot(A.x - x, A.y - (m * x + n));
  const xs: number[] = [];
  for (let i = 0; i <= 120; i++) xs.push(G.MIN + (i * (G.MAX - G.MIN)) / 120);
  const vals = xs.map(len);
  const maxV = Math.max(...vals) || 1;
  const px = (x: number) => PADL + ((x - G.MIN) / (G.MAX - G.MIN)) * (W - PADL - 8);
  const py = (v: number) => H - PADB - (v / maxV) * (H - PADB - 10);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${px(x).toFixed(1)} ${py(vals[i]).toFixed(1)}`).join(" ");
  const minV = len(hx);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 w-full" role="img" aria-label="P의 x좌표에 따른 AP 길이 그래프">
      <line x1={PADL} y1={H - PADB} x2={W - 6} y2={H - PADB} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <line x1={PADL} y1={8} x2={PADL} y2={H - PADB} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <text x={PADL - 4} y={H - PADB + 4} textAnchor="end" className="fill-slate-500 font-mono text-[8px]">
        0
      </text>
      <text x={PADL - 4} y={14} textAnchor="end" className="fill-slate-500 font-mono text-[8px]">
        {maxV.toFixed(1)}
      </text>
      <text x={W - 6} y={H - PADB + 12} textAnchor="end" className="fill-slate-500 font-mono text-[8px]">
        P의 x좌표
      </text>
      <path d={d} fill="none" stroke="#fbbf24" strokeWidth={2} />
      {/* 최솟값 */}
      {hx >= G.MIN && hx <= G.MAX ? (
        <>
          <line x1={px(hx)} y1={py(minV)} x2={px(hx)} y2={H - PADB} stroke="#f472b6" strokeWidth={1.2} strokeDasharray="3 3" />
          <circle cx={px(hx)} cy={py(minV)} r={4} fill="#f472b6" />
          <text x={px(hx)} y={py(minV) - 7} textAnchor="middle" className="fill-pink-200 font-mono text-[9px] font-bold">
            최소 {minV.toFixed(2)}
          </text>
        </>
      ) : null}
      {/* 현재 위치 */}
      <circle cx={px(t)} cy={py(len(t))} r={4} fill="#fde68a" stroke="#0f172a" strokeWidth={1.5} />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 거리 공식 연습
// ══════════════════════════════════════════════════════════════
function FormulaTab() {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const p = DIST_PROBLEMS[idx];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✏️ 단계별로 채워 가며 거리 구하기</p>
          <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 font-mono text-xs font-bold text-cyan-100">
            해결 {solved.size} / {DIST_PROBLEMS.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DIST_PROBLEMS.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setIdx(i)}
              className={
                "rounded-lg border px-3 py-1 text-xs font-bold transition " +
                (i === idx ? "border-cyan-400/60 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {solved.has(q.id) ? "✅ " : ""}
              {i + 1}. {q.title}
            </button>
          ))}
        </div>
      </div>
      <DistCard key={p.id} p={p} onSolved={() => setSolved((s) => new Set(s).add(p.id))} />
    </div>
  );
}

function DistCard({ p, onSolved }: { p: DistProblem; onSolved: () => void }) {
  const needsConvert = p.form === "std";
  const [genPick, setGenPick] = useState<number | null>(null);
  const [i1, setI1] = useState("");
  const [i2, setI2] = useState("");
  const [ck1, setCk1] = useState(false);
  const [ck2, setCk2] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const numerator = Math.abs(p.a * p.point.x + p.b * p.point.y + p.c);
  const denom = p.a * p.a + p.b * p.b;
  const exact = distTex(numerator, denom);

  const genOk = !needsConvert || genPick === p.genAnswer;
  const ok1 = isAns(i1, numerator);
  const ok2 = isAns(i2, denom);
  const okFinal = pick === p.answer;
  const cleared = genOk && ok1 && ok2 && okFinal;
  const shown = cleared || gaveUp;

  const solvedRef = useRef(false);
  useEffect(() => {
    if (cleared && !solvedRef.current) {
      solvedRef.current = true;
      onSolved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleared]);

  const foot = footOf(p.point, p.a, p.b, p.c);

  return (
    <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
      {/* 그래프 */}
      <div>
        <Plane cid={`dist-${p.id}`} label={`${p.pointName}와 직선`} small>
          <Clipped cid={`dist-${p.id}`}>
            <LineDraw a={p.a} b={p.b} c={p.c} color="#34d399" width={3} />
            {shown ? (
              <>
                <line x1={gx(p.point.x)} y1={gy(p.point.y)} x2={gx(foot.x)} y2={gy(foot.y)} stroke="#f472b6" strokeWidth={2.5} />
                <RightAngle h={foot} a={p.a} b={p.b} />
              </>
            ) : null}
          </Clipped>
          {shown ? <Dot p={foot} color="#f472b6" r={5} /> : null}
          <Dot p={p.point} color="#22d3ee" label={`${p.pointName}(${nx(p.point.x)}, ${nx(p.point.y)})`} />
        </Plane>
        <p className="mt-1 text-center text-[11px] text-slate-500">{shown ? "분홍 선분이 점과 직선 사이의 거리예요" : "정답을 맞히면 수선이 그려져요"}</p>
      </div>

      {/* 문제 */}
      <div className="space-y-2">
        <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.07] px-4 py-3">
          <p className="text-xs font-bold text-cyan-200">
            점 {p.pointName}와 직선 l 사이의 거리는? <span className="text-slate-400">({p.form === "gen" ? "일반형" : "표준형"})</span>
          </p>
          <div className="mt-1.5 overflow-x-auto overflow-y-hidden py-1 text-lg text-white">
            <Katex expr={`${p.pointName}(${p.point.x},\\ ${p.point.y}),\\quad l:\\ ${p.form === "std" ? stdTex(p.m!, p.n!) : genTex(p.a, p.b, p.c)}`} />
          </div>
        </div>

        {/* 0단계 — 표준형이면 일반형으로 */}
        {needsConvert ? (
          <StepBox n="1" title="직선을 ax + by + c = 0 꼴로 고치기" done={genOk}>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {p.genChoices!.map((c, i) => {
                const state = genPick === null ? "idle" : i === p.genAnswer ? "right" : i === genPick ? "wrong" : "idle";
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={genOk || shown}
                    onClick={() => setGenPick(i)}
                    className={
                      "rounded-lg border-2 px-3 py-2 text-left transition " +
                      (state === "right"
                        ? "border-emerald-400/60 bg-emerald-400/20"
                        : state === "wrong"
                          ? "border-rose-400/60 bg-rose-400/20"
                          : "border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-60")
                    }
                  >
                    <span className="text-slate-100">
                      <Katex expr={c} />
                    </span>
                    {state === "right" ? " ✅" : state === "wrong" ? " ❌" : ""}
                  </button>
                );
              })}
            </div>
          </StepBox>
        ) : null}

        {/* 1단계 분자 */}
        {genOk || shown ? (
          <StepBox n={needsConvert ? "2" : "1"} title="분자 — 점의 좌표를 대입" done={ok1}>
            <div className="flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
              <span className="max-w-full overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={`|${p.a}\\cdot(${p.point.x}) + (${p.b})\\cdot(${p.point.y}) + (${p.c})| =`} />
              </span>
              <Box value={i1} onChange={setI1} ok={ok1} show={ck1} disabled={shown} label="분자 값" />
              {!ok1 && !shown ? <CheckBtn onClick={() => setCk1(true)} /> : ok1 ? <span>✅</span> : null}
            </div>
          </StepBox>
        ) : null}

        {/* 2단계 분모 */}
        {(genOk && ok1) || shown ? (
          <StepBox n={needsConvert ? "3" : "2"} title="분모 — 계수의 제곱의 합" done={ok2}>
            <div className="flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
              <span className="max-w-full overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={`a^2 + b^2 = (${p.a})^2 + (${p.b})^2 =`} />
              </span>
              <Box value={i2} onChange={setI2} ok={ok2} show={ck2} disabled={shown} label="분모 값" />
              {!ok2 && !shown ? <CheckBtn onClick={() => setCk2(true)} /> : ok2 ? <span>✅</span> : null}
            </div>
            {ok2 || shown ? (
              <p className="mt-1 text-xs text-slate-400">
                → 분모는 <Katex expr={`\\sqrt{${denom}} = ${radTex(denom)}`} />
              </p>
            ) : null}
          </StepBox>
        ) : null}

        {/* 3단계 최종 */}
        {(genOk && ok1 && ok2) || shown ? (
          <StepBox n={needsConvert ? "4" : "3"} title="거리 구하기 (분모에 근호가 있으면 유리화)" done={okFinal}>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {p.choices.map((c, i) => {
                const state = pick === null ? "idle" : i === p.answer ? "right" : i === pick ? "wrong" : "idle";
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={okFinal || shown}
                    onClick={() => setPick(i)}
                    className={
                      "rounded-lg border-2 px-3 py-2 text-center transition " +
                      (state === "right"
                        ? "border-emerald-400/60 bg-emerald-400/20"
                        : state === "wrong"
                          ? "border-rose-400/60 bg-rose-400/20"
                          : "border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-60")
                    }
                  >
                    <span className="text-slate-100">
                      <Katex expr={c} />
                    </span>
                    {state === "right" ? " ✅" : state === "wrong" ? " ❌" : ""}
                  </button>
                );
              })}
            </div>
          </StepBox>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setHint((v) => !v)}
            className="rounded-lg border border-amber-400/45 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-400/20"
          >
            💡 힌트
          </button>
          {!shown ? (
            <button
              type="button"
              onClick={() => setGaveUp(true)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              정답 보기
            </button>
          ) : null}
        </div>
        {hint ? <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-100">💡 {p.hint}</p> : null}

        {shown ? (
          <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-4 py-3">
            <p className="text-sm font-bold text-emerald-100">{cleared ? "🎉 정답!" : "📖 풀이"}</p>
            <div className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-slate-100">
              <Katex expr={`d = \\frac{${numerator}}{${radTex(denom)}} = ${exact}`} display />
            </div>
            <p className="mt-1 text-xs leading-5 text-emerald-100/90">{p.explain}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StepBox({ n, title, done, children }: { n: string; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <div className={"rounded-xl border px-4 py-3 " + (done ? "border-emerald-400/35 bg-emerald-400/[0.06]" : "border-white/10 bg-slate-950/50")}>
      <p className="text-xs font-bold text-slate-400">
        <span className={"mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] " + (done ? "bg-emerald-400/25 text-emerald-100" : "bg-white/10 text-slate-300")}>
          {n}
        </span>
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function CheckBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/25"
    >
      확인
    </button>
  );
}

function Box({
  value,
  onChange,
  ok,
  show,
  disabled,
  label,
  width = "w-20",
}: {
  value: string;
  onChange: (v: string) => void;
  ok: boolean;
  show: boolean;
  disabled: boolean;
  label: string;
  width?: string;
}) {
  const border = !show ? "border-white/15" : ok ? "border-emerald-400/60" : "border-rose-400/60";
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      aria-label={label}
      disabled={disabled}
      placeholder="?"
      onChange={(e) => onChange(e.target.value)}
      className={`${width} rounded-lg border-2 bg-slate-900 px-2 py-1 text-center font-mono text-sm text-white outline-none transition focus:border-cyan-300 disabled:opacity-70 ` + border}
    />
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 평행한 두 직선 사이의 거리
// ══════════════════════════════════════════════════════════════
function ParallelTab() {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const pair = PAR_PAIRS[idx];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🛤️ 평행한 두 직선 사이의 거리</p>
          <span className="rounded-full border border-violet-400/45 bg-violet-400/15 px-3 py-1 font-mono text-xs font-bold text-violet-100">
            해결 {solved.size} / {PAR_PAIRS.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PAR_PAIRS.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setIdx(i)}
              className={
                "rounded-lg border px-3 py-1 text-xs font-bold transition " +
                (i === idx ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {solved.has(q.id) ? "✅ " : ""}
              {i + 1}. {q.label}
            </button>
          ))}
        </div>
      </div>
      <ParCard key={pair.id} q={pair} onSolved={() => setSolved((s) => new Set(s).add(pair.id))} />
    </div>
  );
}

function ParCard({ q, onSolved }: { q: ParPair; onSolved: () => void }) {
  const needsConvert = q.form === "std";
  const [genPick, setGenPick] = useState<number | null>(null);
  const [whyPick, setWhyPick] = useState<number | null>(null);
  const [x0, setX0] = useState<number | null>(null);
  const [y0In, setY0In] = useState("");
  const [ckY, setCkY] = useState(false);
  const [i1, setI1] = useState("");
  const [i2, setI2] = useState("");
  const [ck1, setCk1] = useState(false);
  const [ck2, setCk2] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const [manyMarks, setManyMarks] = useState(false);
  const [probe, setProbe] = useState(0); // 시뮬레이터에서 끌고 다니는 점의 x좌표

  const numerator = Math.abs(q.c1 - q.c2);
  const denom = q.a * q.a + q.b * q.b;
  const exact = distTex(numerator, denom);
  const dVal = numerator / Math.sqrt(denom);

  const y0True = x0 === null ? null : (-q.a * x0 - q.c1) / q.b;
  // '정답 보기'로 건너뛴 경우엔 첫 번째 x값을 대신 쓴다.
  const xUsed = x0 ?? q.xChoices[0];
  const yUsed = (-q.a * xUsed - q.c1) / q.b;
  const genOk = !needsConvert || genPick === q.genAnswer;
  const whyOk = whyPick === PARALLEL_WHY_ANSWER;
  const pointOk = x0 !== null && y0True !== null && isAns(y0In, y0True);
  const ok1 = isAns(i1, numerator);
  const ok2 = isAns(i2, denom);
  const okFinal = pick === q.answer;
  const cleared = genOk && whyOk && pointOk && ok1 && ok2 && okFinal;
  const shown = cleared || gaveUp;

  const solvedRef = useRef(false);
  useEffect(() => {
    if (cleared && !solvedRef.current) {
      solvedRef.current = true;
      onSolved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleared]);

  // 시뮬레이터 — l₁ 위의 점 P 와 l₂ 위의 수선의 발
  const svgRef = useRef<SVGSVGElement>(null);
  const { setDragId } = useGridDrag(svgRef, (_id, p) => setProbe(clamp(Math.round(p.x * 4) / 4, G.MIN, G.MAX)));
  const P: Pt = { x: probe, y: (-q.a * probe - q.c1) / q.b };
  const F = footOf(P, q.a, q.b, q.c2);
  const marks = [-5, -2, 1, 4, 7];

  const step = (k: number) => String(k + (needsConvert ? 1 : 0));

  return (
    <div className="space-y-3">
      {/* 문제 */}
      <div className="rounded-xl border border-violet-400/25 bg-violet-400/[0.07] px-4 py-3">
        <p className="text-xs font-bold text-violet-200">평행한 두 직선 사이의 거리를 구해 보자.</p>
        <div className="mt-1.5 overflow-x-auto overflow-y-hidden py-1 text-lg text-white">
          <Katex
            expr={
              needsConvert
                ? `l_1:\\ ${stdParTex(q.m!, q.n1!)},\\qquad l_2:\\ ${stdParTex(q.m!, q.n2!)}`
                : `l_1:\\ ${genTex(q.a, q.b, q.c1)},\\qquad l_2:\\ ${genTex(q.a, q.b, q.c2)}`
            }
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
        {/* 시뮬레이터 */}
        <div>
          <Plane cid={`par-${q.id}`} svgRef={svgRef} label="평행한 두 직선과 그 사이의 거리" small>
            <Clipped cid={`par-${q.id}`}>
              <LineDraw a={q.a} b={q.b} c={q.c1} color="#22d3ee" width={3} />
              <LineDraw a={q.a} b={q.b} c={q.c2} color="#fbbf24" width={3} />
              {manyMarks
                ? marks.map((mx) => {
                    const p1 = { x: mx, y: (-q.a * mx - q.c1) / q.b };
                    const f1 = footOf(p1, q.a, q.b, q.c2);
                    return (
                      <g key={mx}>
                        <line x1={gx(p1.x)} y1={gy(p1.y)} x2={gx(f1.x)} y2={gy(f1.y)} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" />
                        <RightAngle h={f1} a={q.a} b={q.b} size={8} />
                      </g>
                    );
                  })
                : null}
              <line x1={gx(P.x)} y1={gy(P.y)} x2={gx(F.x)} y2={gy(F.y)} stroke="#f472b6" strokeWidth={3} />
              <RightAngle h={F} a={q.a} b={q.b} />
            </Clipped>
            <Dot p={F} color="#f472b6" r={5} />
            <Dot p={P} color="#22d3ee" label={`P(${nx(P.x)}, ${nx(P.y)})`} onDown={() => setDragId("P")} />
          </Plane>
          <p className="mt-1 text-center text-[11px] text-slate-400">🖱️ 파란 직선 위의 P를 끌어 보세요</p>
          <div className="mt-1.5 rounded-xl border-2 border-pink-400/45 bg-pink-400/10 px-3 py-2 text-center">
            <p className="text-[11px] font-bold text-pink-200">P에서 l₂까지의 거리</p>
            <p className="font-mono text-xl font-extrabold text-pink-100">{dVal.toFixed(3)}</p>
            <p className="text-[10px] text-slate-400">P를 아무리 옮겨도 그대로예요!</p>
          </div>
          <button
            type="button"
            onClick={() => setManyMarks((v) => !v)}
            className={
              "mt-1.5 w-full rounded-lg border px-3 py-1.5 text-xs font-bold transition " +
              (manyMarks ? "border-slate-300/50 bg-white/15 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            📐 여러 곳에서 재보기
          </button>
        </div>

        {/* 단계 */}
        <div className="space-y-2">
          {needsConvert ? (
            <StepBox n="1" title="두 직선을 정수 계수의 일반형으로 고치기" done={genOk}>
              <div className="grid gap-1.5">
                {q.genChoices!.map((c, i) => {
                  const state = genPick === null ? "idle" : i === q.genAnswer ? "right" : i === genPick ? "wrong" : "idle";
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={genOk || shown}
                      onClick={() => setGenPick(i)}
                      className={
                        "rounded-lg border-2 px-3 py-2 text-left transition " +
                        (state === "right"
                          ? "border-emerald-400/60 bg-emerald-400/20"
                          : state === "wrong"
                            ? "border-rose-400/60 bg-rose-400/20"
                            : "border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-60")
                      }
                    >
                      <span className="text-slate-100">
                        <Katex expr={c} />
                      </span>
                      {state === "right" ? " ✅" : state === "wrong" ? " ❌" : ""}
                    </button>
                  );
                })}
              </div>
            </StepBox>
          ) : null}

          {genOk || shown ? (
            <StepBox n={step(1)} title="두 직선이 평행한 까닭은?" done={whyOk}>
              <div className="grid gap-1.5">
                {PARALLEL_WHY.map((w, i) => {
                  const state = whyPick === null ? "idle" : i === PARALLEL_WHY_ANSWER ? "right" : i === whyPick ? "wrong" : "idle";
                  return (
                    <button
                      key={w}
                      type="button"
                      disabled={whyOk || shown}
                      onClick={() => setWhyPick(i)}
                      className={
                        "rounded-lg border-2 px-3 py-2 text-left text-sm transition " +
                        (state === "right"
                          ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100"
                          : state === "wrong"
                            ? "border-rose-400/60 bg-rose-400/20 text-rose-100"
                            : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 disabled:opacity-60")
                      }
                    >
                      {w}
                      {state === "right" ? " ✅" : state === "wrong" ? " ❌" : ""}
                    </button>
                  );
                })}
              </div>
            </StepBox>
          ) : null}

          {(genOk && whyOk) || shown ? (
            <StepBox n={step(2)} title="l₁ 위의 점을 하나 고르기 (아무 점이나!)" done={pointOk}>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400">x₀ =</span>
                {q.xChoices.map((x) => (
                  <button
                    key={x}
                    type="button"
                    disabled={shown}
                    onClick={() => {
                      setX0(x);
                      setY0In("");
                      setCkY(false);
                    }}
                    className={
                      "rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition " +
                      (x0 === x ? "border-cyan-400/60 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                    }
                  >
                    {nx(x)}
                  </button>
                ))}
              </div>
              {x0 !== null ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
                  <span className="max-w-full overflow-x-auto overflow-y-hidden py-1">
                    <Katex expr={`${q.a}\\cdot(${x0}) + (${q.b})\\,y_0 + (${q.c1}) = 0 \\;\\Rightarrow\\; y_0 =`} />
                  </span>
                  <Box value={y0In} onChange={setY0In} ok={pointOk} show={ckY} disabled={shown} label="y0 값" />
                  {!pointOk && !shown ? <CheckBtn onClick={() => setCkY(true)} /> : pointOk ? <span>✅</span> : null}
                </div>
              ) : null}
              {pointOk ? (
                <p className="mt-1 text-xs text-emerald-200">
                  ✅ 점 ({nx(x0!)}, {nx(y0True!)}) 은 l₁ 위에 있어요.
                </p>
              ) : null}
            </StepBox>
          ) : null}

          {(genOk && whyOk && pointOk) || shown ? (
            <StepBox n={step(3)} title="그 점과 l₂ 사이의 거리 — 분자" done={ok1}>
              <div className="flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
                <span className="max-w-full overflow-x-auto overflow-y-hidden py-1">
                  <Katex expr={`|${q.a}\\cdot(${xUsed}) + (${q.b})\\cdot(${yUsed}) + (${q.c2})| =`} />
                </span>
                <Box value={i1} onChange={setI1} ok={ok1} show={ck1} disabled={shown} label="분자 값" />
                {!ok1 && !shown ? <CheckBtn onClick={() => setCk1(true)} /> : ok1 ? <span>✅</span> : null}
              </div>
            </StepBox>
          ) : null}

          {(genOk && whyOk && pointOk && ok1) || shown ? (
            <StepBox n={step(4)} title="분모 — 계수의 제곱의 합" done={ok2}>
              <div className="flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
                <span className="max-w-full overflow-x-auto overflow-y-hidden py-1">
                  <Katex expr={`(${q.a})^2 + (${q.b})^2 =`} />
                </span>
                <Box value={i2} onChange={setI2} ok={ok2} show={ck2} disabled={shown} label="분모 값" />
                {!ok2 && !shown ? <CheckBtn onClick={() => setCk2(true)} /> : ok2 ? <span>✅</span> : null}
              </div>
            </StepBox>
          ) : null}

          {(genOk && whyOk && pointOk && ok1 && ok2) || shown ? (
            <StepBox n={step(5)} title="두 직선 사이의 거리" done={okFinal}>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {q.choices.map((c, i) => {
                  const state = pick === null ? "idle" : i === q.answer ? "right" : i === pick ? "wrong" : "idle";
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={okFinal || shown}
                      onClick={() => setPick(i)}
                      className={
                        "rounded-lg border-2 px-3 py-2 text-center transition " +
                        (state === "right"
                          ? "border-emerald-400/60 bg-emerald-400/20"
                          : state === "wrong"
                            ? "border-rose-400/60 bg-rose-400/20"
                            : "border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-60")
                      }
                    >
                      <span className="text-slate-100">
                        <Katex expr={c} />
                      </span>
                      {state === "right" ? " ✅" : state === "wrong" ? " ❌" : ""}
                    </button>
                  );
                })}
              </div>
            </StepBox>
          ) : null}

          {!shown ? (
            <button
              type="button"
              onClick={() => setGaveUp(true)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              정답 보기
            </button>
          ) : null}

          {shown ? (
            <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-4 py-3">
              <p className="text-sm font-bold text-emerald-100">{cleared ? "🎉 정답!" : "📖 풀이"}</p>
              <div className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-slate-100">
                <Katex expr={`d = \\frac{${numerator}}{${radTex(denom)}} = ${exact}`} display />
              </div>
              <p className="mt-1 text-xs leading-5 text-emerald-100/90">{q.explain}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* 정리 */}
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">💡 어느 점을 골라도 답이 같은 까닭</p>
        <div className="mt-2 overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2 text-slate-100">
          <Katex expr={`ax_0 + by_0 = -c_1 \\;\\Rightarrow\\; |ax_0 + by_0 + c_2| = |c_2 - c_1|`} display />
        </div>
        <div className="mt-2 overflow-x-auto overflow-y-hidden rounded-lg border border-amber-400/45 bg-amber-400/15 px-3 py-2 text-amber-50">
          <Katex expr={`d = \\frac{|c_1 - c_2|}{\\sqrt{a^2 + b^2}}`} display />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          l₁ 위의 점은 항상 ax₀ + by₀ = −c₁ 을 만족하니, 분자가 점의 위치와 상관없이 |c₁ − c₂| 로 정해져요. 시뮬레이터에서 P를 끌어도 거리가 그대로였던 이유예요.
        </p>
      </div>
    </div>
  );
}
