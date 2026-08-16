"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  AREA_TARGETS,
  TASK,
  TEXTBOOK,
  distTex,
  distancePointLine,
  fracPlain,
  fracTex,
  fracVal,
  genTex,
  intersectionOf,
  lineThrough,
  mkFrac,
  parallelThrough,
  perpThrough,
  radTex,
  reduce3,
  slopeLabel,
  slopeOf,
  slopeTex,
  triangleArea,
  type Gen,
  type Pt,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "slope_relation",
    prompt:
      "점 C를 여기저기 옮겨 보아도 평행선의 기울기와 수직선의 기울기는 늘 같은 값이었어요. 왜 C의 위치와 상관없이 그 두 기울기가 정해지는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 기울기는 직선 AB의 방향으로만 정해지므로, AB에 평행하면 기울기가 m으로 같고 수직이면 mm′ = −1에서 −1/m으로 정해진다. C는 직선이 지나는 위치(상수항)만 바꾼다.",
  },
  {
    id: "compare_friends",
    prompt:
      "탭②에서 서로 다른 점 C를 골라 결과를 모아 보았어요. 친구들과 답을 비교하면 무엇이 같고 무엇이 달랐나요? 그 까닭도 함께 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 기울기(−5/2 와 2/5)는 모두 같았지만 y절편이 달랐다. 같은 직선 AB를 기준으로 삼았기 때문에 방향은 같고, 지나는 점이 달라 위치만 달라진 것이다.",
  },
  {
    id: "area_locus",
    prompt:
      "탭③에서 삼각형 ABC의 넓이가 같아지는 점 C들은 어떤 모양으로 놓였나요? 그 까닭을 ‘점과 직선 사이의 거리’라는 말을 써서 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 직선 AB에 평행한 두 직선 위에 놓였다. 넓이 = ½ × AB × (C와 AB 사이의 거리)인데 AB의 길이가 정해져 있으므로, 넓이가 같으려면 거리가 같아야 하고 그런 점들은 AB에서 같은 거리에 있는 평행선 위에 있다.",
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

const COLOR = { ab: "#f87171", par: "#38bdf8", per: "#a78bfa", pt: "#22d3ee", c: "#fbbf24", h: "#f472b6" };

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
        className={"mx-auto block w-full touch-none select-none " + (small ? "max-w-[320px]" : "max-w-[420px]")}
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

function LineDraw({ g, color, width = 3, dash, opacity = 1 }: { g: Gen; color: string; width?: number; dash?: string; opacity?: number }) {
  if (g.a === 0 && g.b === 0) return null;
  let p: [number, number, number, number];
  if (g.b === 0) {
    const x = -g.c / g.a;
    p = [gx(x), gy(G.MAX + 4), gx(x), gy(G.MIN - 4)];
  } else {
    const yAt = (x: number) => (-g.a * x - g.c) / g.b;
    p = [gx(G.MIN - 4), gy(yAt(G.MIN - 4)), gx(G.MAX + 4), gy(yAt(G.MAX + 4))];
  }
  return (
    <line x1={p[0]} y1={p[1]} x2={p[2]} y2={p[3]} stroke={color} strokeWidth={width} strokeDasharray={dash} strokeOpacity={opacity} strokeLinecap="round" />
  );
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

function RightAngle({ h, g, size = 11 }: { h: Pt; g: Gen; size?: number }) {
  const len = Math.hypot(g.a, g.b) || 1;
  const u = { x: g.b / len, y: -g.a / len };
  const v = { x: g.a / len, y: g.b / len };
  const P = (dx: number, dy: number) => `${gx(h.x) + dx},${gy(h.y) - dy}`;
  const pts = [P(0, 0), P(u.x * size, u.y * size), P((u.x + v.x) * size, (u.y + v.y) * size), P(v.x * size, v.y * size)].join(" ");
  return <polygon points={pts} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />;
}

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
        x: clamp(Math.round((sx - G.PAD) / G.U + G.MIN), G.MIN, G.MAX),
        y: clamp(Math.round(G.MAX - (sy - G.PAD) / G.U), G.MIN, G.MAX),
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

/** 정수·소수·분수 입력 파싱 */
function parseNum(s: string): number | null {
  const t = s.trim().replace(/[−–—]/g, "-").replace(/\s/g, "");
  if (!t || t === "-") return null;
  const f = t.match(/^(-?\d+)\/(-?\d+)$/);
  if (f) {
    const d = Number(f[2]);
    return d === 0 ? null : Number(f[1]) / d;
  }
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  return Number(t);
}
function isAns(s: string, target: number): boolean {
  const v = parseNum(s);
  return v !== null && Math.abs(v - target) < 1e-9;
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "tool" | "task" | "area";

export default function ParallelPerpLab() {
  const [tab, setTab] = useState<Tab>("tool");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🧰 점 C를 지나는 평행선과 수직선</h3>
        <p className="mt-2 leading-7 text-slate-300">
          공학 도구처럼 점을 끌어 옮기며 직선 AB에 <b className="text-sky-200">평행한 직선</b>과{" "}
          <b className="text-violet-200">수직인 직선</b>을 만들어 보고, 친구들과 결과를 비교한 뒤{" "}
          <b className="text-amber-200">삼각형의 넓이</b>까지 탐구해 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "tool"} onClick={() => setTab("tool")}>
          ① 공학 도구 실험실
        </TabButton>
        <TabButton active={tab === "task"} onClick={() => setTab("task")}>
          ② 교과서 활동 · 결과 모으기
        </TabButton>
        <TabButton active={tab === "area"} onClick={() => setTab("area")}>
          ③ 넓이 미션 ⭐
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "tool" ? <ToolTab /> : null}
        {tab === "task" ? <TaskTab /> : null}
        {tab === "area" ? <AreaTab /> : null}
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
// 탭 ① 공학 도구 실험실
// ══════════════════════════════════════════════════════════════
function ToolTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [A, setA] = useState<Pt>(TEXTBOOK.A);
  const [B, setB] = useState<Pt>(TEXTBOOK.B);
  const [C, setC] = useState<Pt>(TEXTBOOK.C);
  const [showPar, setShowPar] = useState(true);
  const [showPer, setShowPer] = useState(true);

  const { setDragId } = useGridDrag(svgRef, (id, p) => {
    if (id === "A") setA(p);
    else if (id === "B") setB(p);
    else setC(p);
  });

  const ab = lineThrough(A, B);
  const par = ab ? parallelThrough(ab, C) : null;
  const per = ab ? perpThrough(ab, C) : null;
  const foot = ab && per ? intersectionOf(ab, per) : null;

  const mAB = ab ? slopeOf(ab) : null;
  const mPer = per ? slopeOf(per) : null;
  const prod = mAB && mPer ? mkFrac(mAB.n * mPer.n, mAB.d * mPer.d) : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* 그래프 */}
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          <Plane cid="tool-plane" svgRef={svgRef} label="직선 AB와 점 C를 지나는 평행선·수직선">
            <Clipped cid="tool-plane">
              {ab ? <LineDraw g={ab} color={COLOR.ab} width={3} /> : null}
              {showPar && par ? <LineDraw g={par} color={COLOR.par} width={3} /> : null}
              {showPer && per ? <LineDraw g={per} color={COLOR.per} width={3} /> : null}
              {ab ? <line x1={gx(A.x)} y1={gy(A.y)} x2={gx(B.x)} y2={gy(B.y)} stroke={COLOR.ab} strokeWidth={5} strokeOpacity={0.35} strokeLinecap="round" /> : null}
              {showPer && foot && per ? <RightAngle h={foot} g={per} /> : null}
            </Clipped>
            {showPer && foot ? <Dot p={foot} color={COLOR.h} r={4} /> : null}
            <Dot p={A} color={COLOR.pt} label={`A(${nx(A.x)}, ${nx(A.y)})`} onDown={() => setDragId("A")} />
            <Dot p={B} color={COLOR.pt} label={`B(${nx(B.x)}, ${nx(B.y)})`} onDown={() => setDragId("B")} />
            <Dot p={C} color={COLOR.c} label={`C(${nx(C.x)}, ${nx(C.y)})`} onDown={() => setDragId("C")} />
          </Plane>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <Legend color={COLOR.ab} text="직선 AB" />
            <Legend color={COLOR.par} text="평행선" />
            <Legend color={COLOR.per} text="수직선" />
          </div>
          <p className="mt-1 text-center text-[11px] text-slate-400">🖱️ 세 점 A, B, C를 모두 끌 수 있어요</p>
        </div>

        {/* 공학 도구 대수 창 */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/15 bg-slate-900/70 p-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <p className="text-xs font-bold text-slate-300">🧰 대수 창</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setA(TEXTBOOK.A);
                    setB(TEXTBOOK.B);
                    setC(TEXTBOOK.C);
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-300 transition hover:bg-white/10"
                >
                  교과서 예시
                </button>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <AlgebraRow color={COLOR.pt} name="A" value={`(${nx(A.x)},\\ ${nx(A.y)})`} kind="점" />
              <AlgebraRow color={COLOR.pt} name="B" value={`(${nx(B.x)},\\ ${nx(B.y)})`} kind="점" />
              <AlgebraRow color={COLOR.c} name="C" value={`(${nx(C.x)},\\ ${nx(C.y)})`} kind="점" />
              {ab ? <AlgebraRow color={COLOR.ab} name="a" value={slopeTex(ab)} kind="직선(A, B)" /> : null}
              {showPar && par ? <AlgebraRow color={COLOR.par} name="b" value={slopeTex(par)} kind="평행선(C, a)" onHide={() => setShowPar(false)} /> : null}
              {showPer && per ? <AlgebraRow color={COLOR.per} name="c" value={slopeTex(per)} kind="수직선(C, a)" onHide={() => setShowPer(false)} /> : null}
            </div>
            {!ab ? <p className="mt-2 text-xs font-bold text-rose-300">⚠️ A와 B가 같은 점이에요. 직선이 하나로 정해지지 않아요.</p> : null}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <ToggleChip on={showPar} onClick={() => setShowPar((v) => !v)} color="sky">
                평행선
              </ToggleChip>
              <ToggleChip on={showPer} onClick={() => setShowPer((v) => !v)} color="violet">
                수직선
              </ToggleChip>
            </div>
          </div>

          {/* 기울기 관계 */}
          {ab ? (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-3">
              <p className="text-sm font-bold text-emerald-200">📐 기울기 관계</p>
              <div className="mt-2 space-y-1.5 text-sm">
                <SlopeRow label="직선 AB" value={slopeLabel(ab)} color={COLOR.ab} />
                {par ? <SlopeRow label="평행선" value={slopeLabel(par)} color={COLOR.par} note="AB와 같다" /> : null}
                {per ? <SlopeRow label="수직선" value={slopeLabel(per)} color={COLOR.per} note="AB의 음의 역수" /> : null}
              </div>
              {prod ? (
                <div className="mt-2 overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-1.5 text-slate-100">
                  <Katex expr={`m \\times m' = ${fracTex(mAB!)} \\times ${fracTex(mPer!)} = ${fracTex(prod)}`} />
                </div>
              ) : (
                <p className="mt-2 rounded-lg bg-black/25 px-3 py-1.5 text-xs text-slate-300">
                  가로선과 세로선이라 기울기의 곱을 쓸 수 없어요. 하지만 두 직선은 여전히 서로 수직이에요.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* 만드는 과정 */}
      {ab && par && per ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-sm font-bold text-slate-100">✍️ 손으로 구하면 이렇게</p>
          <div className="mt-2 grid gap-2 lg:grid-cols-3">
            <StepCard
              tone="rose"
              title="① 직선 AB"
              lines={[`m = \\frac{${B.y} - (${A.y})}{${B.x} - (${A.x})} = ${mAB ? fracTex(mAB) : "\\text{(없음)}"}`, slopeTex(ab)]}
            />
            <StepCard
              tone="sky"
              title="② 평행선 (기울기 그대로)"
              lines={[mAB ? `y - (${C.y}) = ${fracTex(mAB)}\\,(x - (${C.x}))` : `x = ${C.x}`, slopeTex(par)]}
            />
            <StepCard
              tone="violet"
              title="③ 수직선 (음의 역수)"
              lines={[mPer ? `y - (${C.y}) = ${fracTex(mPer)}\\,(x - (${C.x}))` : `x = ${C.x}`, slopeTex(per)]}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span className="flex items-center gap-1 text-slate-300">
      <span className="inline-block h-2.5 w-4 rounded-sm" style={{ backgroundColor: color }} />
      {text}
    </span>
  );
}

function AlgebraRow({ color, name, value, kind, onHide }: { color: string; name: string; value: string; kind: string; onHide?: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/25 px-2 py-1.5">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="w-4 shrink-0 font-mono text-xs font-bold text-slate-300">{name}:</span>
      <span className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden py-0.5 text-[13px] text-slate-100">
        <Katex expr={value} />
      </span>
      <span className="shrink-0 text-[10px] text-slate-500">{kind}</span>
      {onHide ? (
        <button type="button" onClick={onHide} aria-label={`${kind} 숨기기`} className="shrink-0 text-xs text-slate-500 transition hover:text-slate-200">
          ✕
        </button>
      ) : null}
    </div>
  );
}

function ToggleChip({ on, onClick, color, children }: { on: boolean; onClick: () => void; color: "sky" | "violet"; children: React.ReactNode }) {
  const cls = color === "sky" ? "border-sky-400/60 bg-sky-400/20 text-sky-100" : "border-violet-400/60 bg-violet-400/20 text-violet-100";
  return (
    <button
      type="button"
      onClick={onClick}
      className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (on ? cls : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")}
    >
      {on ? "👁️ " : "🚫 "}
      {children}
    </button>
  );
}

function SlopeRow({ label, value, color, note }: { label: string; value: string; color: string; note?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="w-16 shrink-0 text-xs text-slate-300">{label}</span>
      <span className="font-mono text-sm font-bold text-white">{value}</span>
      {note ? <span className="ml-auto text-[10px] text-slate-500">{note}</span> : null}
    </div>
  );
}

function StepCard({ tone, title, lines }: { tone: "rose" | "sky" | "violet"; title: string; lines: string[] }) {
  const cls: Record<string, string> = {
    rose: "border-rose-400/30 bg-rose-400/[0.07] text-rose-200",
    sky: "border-sky-400/30 bg-sky-400/[0.07] text-sky-200",
    violet: "border-violet-400/30 bg-violet-400/[0.07] text-violet-200",
  };
  return (
    <div className={"rounded-xl border px-3 py-2.5 " + cls[tone]}>
      <p className="text-[11px] font-bold">{title}</p>
      <div className="mt-1.5 space-y-1">
        {lines.map((t, i) => (
          <FormulaLine key={i} tex={t} />
        ))}
      </div>
    </div>
  );
}

/** 수식 한 줄 — 줄바꿈 없이 한 줄로 두고, 길면 가로로 넘겨 본다. */
function FormulaLine({ tex, label }: { tex: string; label?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      {label ? <span className="w-14 shrink-0 text-[10px] font-bold text-slate-400">{label}</span> : null}
      <span className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap py-1 text-slate-100">
        <Katex expr={tex} />
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 교과서 활동 · 결과 모으기
// ══════════════════════════════════════════════════════════════
type Entry = { id: number; C: Pt; par: Gen; per: Gen };

function TaskTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [C, setC] = useState<Pt>({ x: 2, y: 2 });
  const [entries, setEntries] = useState<Entry[]>([]);
  const [nextId, setNextId] = useState(1);

  const [dy, setDy] = useState("");
  const [dx, setDx] = useState("");
  const [mPar, setMPar] = useState("");
  const [mPer, setMPer] = useState("");
  const [ck, setCk] = useState({ a: false, b: false, c: false });
  const [gaveUp, setGaveUp] = useState(false);

  const { setDragId } = useGridDrag(svgRef, (_id, p) => setC(p));

  const A = TASK.A;
  const B = TASK.B;
  const ab = lineThrough(A, B)!;
  const par = parallelThrough(ab, C);
  const per = perpThrough(ab, C);
  const m = slopeOf(ab)!; // −5/2
  const mp = slopeOf(per)!; // 2/5

  const okDy = isAns(dy, B.y - A.y);
  const okDx = isAns(dx, B.x - A.x);
  const okMPar = isAns(mPar, fracVal(m));
  const okMPer = isAns(mPer, fracVal(mp));
  const cleared = okDy && okDx && okMPar && okMPer;
  const shown = cleared || gaveUp;

  function addEntry() {
    if (entries.some((e) => e.C.x === C.x && e.C.y === C.y)) return;
    if (entries.length >= 6) return;
    setEntries((s) => [...s, { id: nextId, C: { ...C }, par, per }]);
    setNextId((v) => v + 1);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-400/25 bg-violet-400/[0.07] px-4 py-3">
        <p className="text-xs font-bold text-violet-200">교과서 활동</p>
        <div className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-base text-white">
          <Katex expr={`A(-3,\\ 6),\\quad B(1,\\ -4),\\quad C(a,\\ b)`} />
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-300">
          점 C의 좌표를 <b className="text-amber-200">내 마음대로</b> 정하고, 점 C를 지나면서 직선 AB에 평행한 직선과 수직인 직선의 방정식을 구해 보세요.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* 그래프 */}
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          <Plane cid="task-plane" svgRef={svgRef} label="직선 AB와 학생들이 고른 점 C들">
            <Clipped cid="task-plane">
              {/* 모은 결과 */}
              {entries.map((e) => (
                <g key={e.id}>
                  <LineDraw g={e.par} color={COLOR.par} width={1.8} opacity={0.5} />
                  <LineDraw g={e.per} color={COLOR.per} width={1.8} opacity={0.5} />
                </g>
              ))}
              <LineDraw g={ab} color={COLOR.ab} width={3} />
              <line x1={gx(A.x)} y1={gy(A.y)} x2={gx(B.x)} y2={gy(B.y)} stroke={COLOR.ab} strokeWidth={5} strokeOpacity={0.35} strokeLinecap="round" />
              <LineDraw g={par} color={COLOR.par} width={3} />
              <LineDraw g={per} color={COLOR.per} width={3} />
            </Clipped>
            {entries.map((e) => (
              <Dot key={e.id} p={e.C} color="#94a3b8" r={4} />
            ))}
            <Dot p={A} color={COLOR.pt} label={`A(${nx(A.x)}, ${nx(A.y)})`} />
            <Dot p={B} color={COLOR.pt} label={`B(${nx(B.x)}, ${nx(B.y)})`} />
            <Dot p={C} color={COLOR.c} label={`C(${nx(C.x)}, ${nx(C.y)})`} onDown={() => setDragId("C")} />
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 노란 점 C를 원하는 곳으로 끌어 보세요</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <button
              type="button"
              onClick={addEntry}
              disabled={entries.length >= 6}
              className="rounded-lg border-2 border-emerald-400/55 bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/25 disabled:opacity-40"
            >
              ➕ 내 결과 모으기 ({entries.length}/6)
            </button>
            <button
              type="button"
              onClick={() => setEntries([])}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 비우기
            </button>
          </div>
        </div>

        {/* 단계 */}
        <div className="space-y-2">
          <StepRow n="1" title="직선 AB의 기울기" done={okDy && okDx}>
            <div className="flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
              <span className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={`m = \\frac{y_2 - y_1}{x_2 - x_1} =`} />
              </span>
              <Box value={dy} onChange={setDy} ok={okDy} show={ck.a} disabled={shown} label="y좌표의 차" />
              <span>÷</span>
              <Box value={dx} onChange={setDx} ok={okDx} show={ck.a} disabled={shown} label="x좌표의 차" />
              {!(okDy && okDx) && !shown ? <CheckBtn onClick={() => setCk((v) => ({ ...v, a: true }))} /> : <span>✅</span>}
            </div>
            {(okDy && okDx) || shown ? (
              <p className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-sm text-emerald-200">
                <Katex expr={`m = \\frac{${B.y - A.y}}{${B.x - A.x}} = ${fracTex(m)}`} />
              </p>
            ) : null}
          </StepRow>

          {(okDy && okDx) || shown ? (
            <StepRow n="2" title="평행선의 기울기 (분수는 -5/2 처럼)" done={okMPar}>
              <div className="flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
                <span>기울기 =</span>
                <Box value={mPar} onChange={setMPar} ok={okMPar} show={ck.b} disabled={shown} label="평행선의 기울기" width="w-24" />
                {!okMPar && !shown ? <CheckBtn onClick={() => setCk((v) => ({ ...v, b: true }))} /> : <span>✅</span>}
              </div>
            </StepRow>
          ) : null}

          {(okDy && okDx && okMPar) || shown ? (
            <StepRow n="3" title="수직선의 기울기 (음의 역수)" done={okMPer}>
              <div className="flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
                <span>기울기 =</span>
                <Box value={mPer} onChange={setMPer} ok={okMPer} show={ck.c} disabled={shown} label="수직선의 기울기" width="w-24" />
                {!okMPer && !shown ? <CheckBtn onClick={() => setCk((v) => ({ ...v, c: true }))} /> : <span>✅</span>}
              </div>
            </StepRow>
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
              <p className="mt-1 text-xs text-slate-300">
                내가 고른 점 C({nx(C.x)}, {nx(C.y)}) 로 만든 두 직선이에요.
              </p>
              <div className="mt-1.5 space-y-1.5">
                <ResultLine tone="sky" label="평행선" tex={`y - (${C.y}) = ${fracTex(m)}\\,(x - (${C.x})) \\;\\Rightarrow\\; ${slopeTex(par)}`} />
                <ResultLine tone="violet" label="수직선" tex={`y - (${C.y}) = ${fracTex(mp)}\\,(x - (${C.x})) \\;\\Rightarrow\\; ${slopeTex(per)}`} />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* 결과 모으기 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">👥 친구들과 비교하기</p>
        {entries.length === 0 ? (
          <p className="mt-2 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-4 text-center text-xs leading-5 text-slate-400">
            점 C를 옮기며 <b className="text-emerald-200">‘➕ 내 결과 모으기’</b>를 눌러 보세요. 서로 다른 C에서 나온 직선들을 한 화면에서 비교할 수 있어요.
          </p>
        ) : (
          <>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[460px] text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-1.5 text-left font-semibold">점 C</th>
                    <th className="px-2 py-1.5 text-left font-semibold">평행선</th>
                    <th className="px-2 py-1.5 text-left font-semibold">수직선</th>
                    <th className="px-2 py-1.5 text-right font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-t border-white/5">
                      <td className="px-2 py-1.5 font-mono text-xs text-amber-100">
                        ({nx(e.C.x)}, {nx(e.C.y)})
                      </td>
                      <td className="px-2 py-1.5 text-sky-100">
                        <span className="inline-block overflow-x-auto overflow-y-hidden py-0.5 align-middle">
                          <Katex expr={slopeTex(e.par)} />
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-violet-100">
                        <span className="inline-block overflow-x-auto overflow-y-hidden py-0.5 align-middle">
                          <Katex expr={slopeTex(e.per)} />
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => setEntries((s) => s.filter((z) => z.id !== e.id))}
                          aria-label="이 결과 지우기"
                          className="text-xs text-slate-500 transition hover:text-rose-300"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3">
              <p className="text-sm font-bold text-amber-200">🔎 발견!</p>
              <ul className="mt-1 space-y-1 text-sm leading-6 text-slate-300">
                <li>
                  • 평행선들의 기울기는 모두 <b className="text-sky-200">{fracPlain(m)}</b> — 직선 AB와 같아요.
                </li>
                <li>
                  • 수직선들의 기울기는 모두 <b className="text-violet-200">{fracPlain(mp)}</b> — AB 기울기의 음의 역수예요.
                </li>
                <li>
                  • 달라진 것은 <b className="text-amber-200">상수항(y절편)</b>뿐! 점 C가 직선의 <b>방향</b>이 아니라 <b>위치</b>만 정하기 때문이에요.
                </li>
                <li>• 그래서 친구들이 서로 다른 C를 골라도 평행선끼리는 서로 평행하고, 평행선과 수직선은 언제나 수직이에요.</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ResultLine({ tone, label, tex }: { tone: "sky" | "violet"; label: string; tex: string }) {
  const cls = tone === "sky" ? "border-sky-400/40 bg-sky-400/10 text-sky-200" : "border-violet-400/40 bg-violet-400/10 text-violet-200";
  return (
    <div className="flex items-center gap-2">
      <span className={"w-12 shrink-0 rounded-md border px-1 py-0.5 text-center text-[10px] font-bold " + cls}>{label}</span>
      <span className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg bg-black/25 px-2.5 py-1.5 text-slate-100">
        <Katex expr={tex} />
      </span>
    </div>
  );
}

function StepRow({ n, title, done, children }: { n: string; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <div className={"rounded-xl border px-4 py-3 " + (done ? "border-emerald-400/35 bg-emerald-400/[0.06]" : "border-white/10 bg-slate-950/50")}>
      <p className="text-xs font-bold text-slate-400">
        <span
          className={
            "mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] " +
            (done ? "bg-emerald-400/25 text-emerald-100" : "bg-white/10 text-slate-300")
          }
        >
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
// 탭 ③ 넓이 미션
// ══════════════════════════════════════════════════════════════
function AreaTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [C, setC] = useState<Pt>({ x: 3, y: 2 });
  const [target, setTarget] = useState(0);
  const [cleared, setCleared] = useState<number[]>([]);
  const [showLocus, setShowLocus] = useState(false);
  const { setDragId } = useGridDrag(svgRef, (_id, p) => setC(p));

  const A = TASK.A;
  const B = TASK.B;
  const ab = lineThrough(A, B)!;
  const per = perpThrough(ab, C);
  const H = intersectionOf(ab, per)!;

  const area = triangleArea(A, B, C);
  const abLen2 = (B.x - A.x) ** 2 + (B.y - A.y) ** 2; // 116
  const dNum = Math.abs(ab.a * C.x + ab.b * C.y + ab.c); // |5Cx + 2Cy + 3|
  const dDen = ab.a * ab.a + ab.b * ab.b; // 29
  const d = distancePointLine(C, ab);

  const goal = AREA_TARGETS[target];
  const hit = Math.abs(area - goal) < 1e-9;

  // 목표 달성 기록
  const clearedRef = useRef<number[]>([]);
  useEffect(() => {
    if (hit && !clearedRef.current.includes(goal)) {
      clearedRef.current = [...clearedRef.current, goal];
      setCleared(clearedRef.current);
    }
  }, [hit, goal]);

  // 넓이가 같은 C 의 자취 — 5x + 2y + 3 = ±area
  const s = ab.a * C.x + ab.b * C.y + ab.c;
  const locus1 = reduce3(ab.a, ab.b, ab.c - s);
  const locus2 = reduce3(ab.a, ab.b, ab.c + s);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.07] to-rose-500/[0.04] p-3">
          <Plane cid="area-plane" svgRef={svgRef} label="삼각형 ABC와 점 C에서 AB에 내린 수선">
            <Clipped cid="area-plane">
              {showLocus && s !== 0 ? (
                <>
                  <LineDraw g={locus1} color="#fbbf24" width={1.8} dash="6 4" opacity={0.75} />
                  <LineDraw g={locus2} color="#fbbf24" width={1.8} dash="6 4" opacity={0.75} />
                </>
              ) : null}
              <LineDraw g={ab} color={COLOR.ab} width={2.5} />
              {/* 삼각형 */}
              <polygon
                points={`${gx(A.x)},${gy(A.y)} ${gx(B.x)},${gy(B.y)} ${gx(C.x)},${gy(C.y)}`}
                fill={hit ? "rgba(52,211,153,0.25)" : "rgba(251,191,36,0.16)"}
                stroke={hit ? "#34d399" : "#fbbf24"}
                strokeWidth={2}
              />
              <line x1={gx(C.x)} y1={gy(C.y)} x2={gx(H.x)} y2={gy(H.y)} stroke={COLOR.h} strokeWidth={2.5} strokeDasharray="5 4" />
              <RightAngle h={H} g={per} />
            </Clipped>
            <Dot p={H} color={COLOR.h} r={4} />
            <Dot p={A} color={COLOR.pt} label={`A(${nx(A.x)}, ${nx(A.y)})`} />
            <Dot p={B} color={COLOR.pt} label={`B(${nx(B.x)}, ${nx(B.y)})`} />
            <Dot p={C} color={COLOR.c} label={`C(${nx(C.x)}, ${nx(C.y)})`} onDown={() => setDragId("C")} />
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 점 C를 끌어 삼각형의 넓이를 바꿔 보세요</p>
        </div>

        <div className="space-y-3">
          {/* 미션 */}
          <div className={"rounded-2xl border-2 p-4 transition-colors " + (hit ? "border-emerald-400/60 bg-emerald-400/[0.12]" : "border-amber-400/40 bg-amber-400/[0.08]")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-amber-100">⭐ 미션 · 삼각형 ABC의 넓이를 맞춰라</p>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs font-bold text-slate-200">
                성공 {cleared.length} / {AREA_TARGETS.length}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {AREA_TARGETS.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTarget(i)}
                  className={
                    "rounded-lg border px-3 py-1.5 text-xs font-bold transition " +
                    (i === target ? "border-amber-400/60 bg-amber-400/25 text-amber-50" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  {cleared.includes(t) ? "⭐ " : ""}넓이 {t}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Metric label="목표 넓이" value={String(goal)} tone="slate" />
              <Metric label="지금 넓이" value={String(area)} tone={hit ? "emerald" : "amber"} />
            </div>
            <p className={"mt-2 text-center text-sm font-bold " + (hit ? "text-emerald-200" : "text-slate-400")}>
              {hit ? "🎉 정확히 맞췄어요! ‘같은 넓이의 자취’를 켜 보세요." : area > goal ? "직선 AB 쪽으로 더 가까이!" : "직선 AB에서 더 멀리!"}
            </p>
          </div>

          {/* 두 가지 방법 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-sm font-bold text-slate-100">🧮 넓이를 두 가지 방법으로</p>
            <div className="mt-2 space-y-2">
              <div className="rounded-xl border border-pink-400/30 bg-pink-400/[0.07] px-3 py-2">
                <p className="text-[11px] font-bold text-pink-200">① 밑변 × 높이 ÷ 2 — 높이가 바로 ‘점과 직선 사이의 거리’</p>
                <div className="mt-1 space-y-0.5">
                  <FormulaLine label="밑변" tex={`\\overline{AB} = \\sqrt{${(B.x - A.x) ** 2} + ${(B.y - A.y) ** 2}} = ${radTex(abLen2)}`} />
                  <FormulaLine
                    label="높이"
                    tex={`d = \\frac{|${ab.a}\\cdot(${C.x}) + ${ab.b}\\cdot(${C.y}) + ${ab.c}|}{\\sqrt{${dDen}}} = ${distTex(dNum, dDen)} \\approx ${d.toFixed(3)}`}
                  />
                  <FormulaLine label="넓이" tex={`S = \\tfrac{1}{2} \\times ${radTex(abLen2)} \\times ${distTex(dNum, dDen)} = ${area}`} />
                </div>
              </div>
              <div className="rounded-xl border border-sky-400/30 bg-sky-400/[0.07] px-3 py-2">
                <p className="text-[11px] font-bold text-sky-200">② 신발끈 공식 (좌표로 바로)</p>
                <div className="mt-1 space-y-0.5">
                  <FormulaLine
                    label="넓이"
                    tex={`S = \\tfrac{1}{2}\\left|${A.x}(${B.y} - (${C.y})) + ${B.x}((${C.y}) - ${A.y}) + (${C.x})(${A.y} - (${B.y}))\\right| = ${area}`}
                  />
                </div>
              </div>
              <p className="text-center text-xs font-bold text-emerald-200">✅ 두 방법의 답이 같아요!</p>
            </div>
          </div>

          {/* 자취 */}
          <div className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-violet-200">🧭 같은 넓이를 주는 점 C들은 어디에?</p>
              <button
                type="button"
                onClick={() => setShowLocus((v) => !v)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (showLocus ? "border-amber-400/60 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {showLocus ? "자취 숨기기" : "자취 보기"}
              </button>
            </div>
            {showLocus ? (
              <div className="mt-2 space-y-1.5">
                <p className="text-xs leading-5 text-slate-300">
                  넓이 <b className="text-amber-200">{area}</b> 를 주는 점들은 직선 AB에서 거리가 같은 곳 — 즉 <b className="text-amber-200">AB에 평행한 두 직선</b> 위에
                  있어요.
                </p>
                <div className="space-y-0.5 rounded-lg bg-black/25 px-3 py-1">
                  <FormulaLine tex={genTex(locus1)} />
                  <FormulaLine tex={genTex(locus2)} />
                </div>
                <p className="text-[11px] text-slate-500">노란 점선을 따라 C를 옮겨 보면 넓이가 그대로인 것을 확인할 수 있어요.</p>
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-400">C를 옮겨 넓이가 같아지는 자리를 찾아보고, 버튼을 눌러 확인해 보세요.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "slate" | "amber" | "emerald" }) {
  const cls: Record<string, string> = {
    slate: "border-white/15 bg-white/5 text-slate-100",
    amber: "border-amber-400/45 bg-amber-400/10 text-amber-100",
    emerald: "border-emerald-400/50 bg-emerald-400/15 text-emerald-100",
  };
  return (
    <div className={"rounded-xl border px-3 py-2 text-center " + cls[tone]}>
      <p className="text-[11px] font-bold opacity-85">{label}</p>
      <p className="mt-0.5 font-mono text-2xl font-extrabold">{value}</p>
    </div>
  );
}
