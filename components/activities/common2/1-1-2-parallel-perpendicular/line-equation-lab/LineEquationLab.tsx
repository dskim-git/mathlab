"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  LINE_QUIZ,
  PS_PROBLEMS,
  STAR_ROUNDS,
  fracPlain,
  fracTex,
  fracVal,
  fromDecimal,
  interceptOf,
  lineSpecTex,
  lineTex,
  mkFrac,
  pointSlopeSubTex,
  pointSlopeTidyTex,
  slopeOf,
  type LineSpec,
  type PsProblem,
  type Pt,
  type StarRound,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "always_passes",
    prompt:
      "탭①에서 기울기 m을 이리저리 바꿔도 직선은 언제나 점 A를 지났어요. 식 y − y₁ = m(x − x₁)을 보고, 왜 m의 값에 관계없이 항상 (x₁, y₁)을 지나는지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: x에 x₁을 넣으면 오른쪽이 m×0 = 0이 되어 y = y₁이 되므로, m이 무엇이든 (x₁, y₁)은 항상 이 식을 만족한다.",
  },
  {
    id: "zero_vs_none",
    prompt:
      "‘기울기가 0인 직선’과 ‘기울기가 없는 직선’은 어떻게 다른가요? 두 경우의 방정식이 y = y₁ 과 x = x₁ 으로 달라지는 까닭을 함께 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 기울기 0은 가로로 누운 직선이라 y값이 늘 같아서 y = y₁이고, 세로로 선 직선은 x의 변화량이 0이라 (y의 변화량)÷0을 정할 수 없어 기울기 자체가 없으므로 x = x₁로 쓴다.",
  },
  {
    id: "two_points",
    prompt:
      "탭③에서 기준점을 A로 잡을 때와 B로 잡을 때 처음 식은 달라 보였지만 정리하면 같은 식이 되었어요. 별 잇기 미션에서 두 점으로 직선의 방정식을 세우는 순서를 자신만의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: ① y좌표의 차와 x좌표의 차로 기울기를 구하고 ② 두 점 중 아무 점이나 골라 점기울기 꼴에 넣은 다음 ③ 정리하면 된다. x좌표가 같으면 기울기를 못 구하니 바로 x = x₁로 쓴다.",
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
/** 좌표값 표기(마이너스는 유니코드 −). */
function nx(v: number): string {
  return v < 0 ? `−${Math.abs(v)}` : String(v);
}

function GridLines() {
  return (
    <g>
      {range(G.MIN, G.MAX).map((v) => (
        <line
          key={`vx${v}`}
          x1={gx(v)}
          y1={gy(G.MAX)}
          x2={gx(v)}
          y2={gy(G.MIN)}
          stroke="rgba(255,255,255,0.055)"
          strokeWidth={1}
        />
      ))}
      {range(G.MIN, G.MAX).map((v) => (
        <line
          key={`hy${v}`}
          x1={gx(G.MIN)}
          y1={gy(v)}
          x2={gx(G.MAX)}
          y2={gy(v)}
          stroke="rgba(255,255,255,0.055)"
          strokeWidth={1}
        />
      ))}
      <line x1={gx(G.MIN)} y1={gy(0)} x2={gx(G.MAX)} y2={gy(0)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={gx(0)} y1={gy(G.MIN)} x2={gx(0)} y2={gy(G.MAX)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      {range(G.MIN, G.MAX)
        .filter((v) => v !== 0 && v % 2 === 0)
        .map((v) => (
          <text key={`tx${v}`} x={gx(v)} y={gy(0) + 12} textAnchor="middle" className="fill-slate-500 font-mono text-[8px]">
            {nx(v)}
          </text>
        ))}
      {range(G.MIN, G.MAX)
        .filter((v) => v !== 0 && v % 2 === 0)
        .map((v) => (
          <text key={`ty${v}`} x={gx(0) - 6} y={gy(v) + 3} textAnchor="end" className="fill-slate-500 font-mono text-[8px]">
            {nx(v)}
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

/** 격자 밖으로 나가면 안 되는 요소(직선·보조선)를 감싼다. 점·라벨은 감싸지 않는다. */
function Clipped({ cid, children }: { cid: string; children: React.ReactNode }) {
  return <g clipPath={`url(#${cid})`}>{children}</g>;
}

/** 직선을 격자 끝에서 끝까지 그린다(clip 으로 잘림). */
function LineDraw({
  spec,
  color,
  width = 3,
  dash,
  opacity = 1,
}: {
  spec: LineSpec;
  color: string;
  width?: number;
  dash?: string;
  opacity?: number;
}) {
  let p: [number, number, number, number];
  if (spec.kind === "v") p = [gx(spec.k), gy(G.MAX) - 40, gx(spec.k), gy(G.MIN) + 40];
  else if (spec.kind === "h") p = [gx(G.MIN) - 40, gy(spec.k), gx(G.MAX) + 40, gy(spec.k)];
  else {
    const m = fracVal(spec.m);
    const b = fracVal(spec.b);
    const x0 = G.MIN - 4;
    const x1 = G.MAX + 4;
    p = [gx(x0), gy(m * x0 + b), gx(x1), gy(m * x1 + b)];
  }
  return (
    <line x1={p[0]} y1={p[1]} x2={p[2]} y2={p[3]} stroke={color} strokeWidth={width} strokeDasharray={dash} strokeOpacity={opacity} strokeLinecap="round" />
  );
}

function Dot({
  p,
  color,
  label,
  onDown,
}: {
  p: Pt;
  color: string;
  label?: string;
  onDown?: () => void;
}) {
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
      <circle cx={gx(p.x)} cy={gy(p.y)} r={6} fill={color} stroke="#0f172a" strokeWidth={2} />
      {label ? (
        <text
          x={gx(p.x)}
          y={p.y >= G.MAX ? gy(p.y) + 19 : gy(p.y) - 13}
          textAnchor={p.x <= G.MIN + 1 ? "start" : p.x >= G.MAX - 1 ? "end" : "middle"}
          className="fill-white font-mono text-[10px] font-bold"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

/** 격자 위 점 드래그 */
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
      const x = clamp(Math.round((sx - G.PAD) / G.U + G.MIN), G.MIN, G.MAX);
      const y = clamp(Math.round(G.MAX - (sy - G.PAD) / G.U), G.MIN, G.MAX);
      cb.current(dragId as string, { x, y });
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

/** 입력값 파싱 — 정수·소수·분수(3/4) 모두 허용. */
function parseAns(s: string): number | null {
  const t = s.trim().replace(/[−–—]/g, "-").replace(/\s/g, "");
  if (!t) return null;
  const f = t.match(/^(-?\d+)\/(-?\d+)$/);
  if (f) {
    const d = Number(f[2]);
    return d === 0 ? null : Number(f[1]) / d;
  }
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  return Number(t);
}
function same(input: string, target: number): boolean {
  const v = parseAns(input);
  return v !== null && Math.abs(v - target) < 1e-9;
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "point" | "special" | "two";

export default function LineEquationLab() {
  const [tab, setTab] = useState<Tab>("point");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">📐 직선의 방정식 세우기</h3>
        <p className="mt-2 leading-7 text-slate-300">
          점을 끌고 기울기를 돌려 보면서 <b className="text-cyan-200">y − y₁ = m(x − x₁)</b> 이 어떻게 만들어지는지 보고,
          <b className="text-amber-200"> 가로로 누운 직선</b>과 <b className="text-rose-200">세로로 선 직선</b>,
          그리고 <b className="text-emerald-200">두 점을 지나는 직선</b>까지 직접 세워 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "point"} onClick={() => setTab("point")}>
          ① 한 점 + 기울기
        </TabButton>
        <TabButton active={tab === "special"} onClick={() => setTab("special")}>
          ② 가로선 · 세로선
        </TabButton>
        <TabButton active={tab === "two"} onClick={() => setTab("two")}>
          ③ 두 점 잇기 🌠
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "point" ? <PointSlopeTab /> : null}
        {tab === "special" ? <SpecialTab /> : null}
        {tab === "two" ? <TwoPointTab /> : null}
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
// 탭 ① 한 점 + 기울기
// ══════════════════════════════════════════════════════════════
const M_STEPS: number[] = range(-8, 8).map((k) => k / 2);
const FAN: number[] = [-4, -2, -1, -0.5, 0, 0.5, 1, 2, 4];

function PointSlopeTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState<Pt>({ x: 2, y: 3 });
  const [mIdx, setMIdx] = useState(M_STEPS.indexOf(1.5));
  const [fan, setFan] = useState(false);
  const [shift, setShift] = useState(false);
  const [spin, setSpin] = useState(false);
  const { setDragId } = useGridDrag(svgRef, (_id, p) => setA(p));

  useEffect(() => {
    if (!spin) return;
    const t = window.setInterval(() => setMIdx((i) => (i + 1) % M_STEPS.length), 160);
    return () => window.clearInterval(t);
  }, [spin]);

  const m = fromDecimal(M_STEPS[mIdx]);
  const b = interceptOf(a.x, a.y, m);
  const spec: LineSpec = { kind: "s", m, b };
  // 기울기 삼각형 — 격자 오른쪽 끝에 닿으면 왼쪽으로 그린다(모양은 그대로).
  const triDir = a.x + m.d > G.MAX ? -1 : 1;
  const tri = { dir: triDir, x: a.x + triDir * m.d, y: a.y + triDir * m.n };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 그래프 */}
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          <Plane cid="ps-clip" svgRef={svgRef} label="한 점을 지나고 기울기가 주어진 직선">
            <Clipped cid="ps-clip">
              {/* 잔상(부채꼴) */}
              {fan
                ? FAN.map((v) => {
                    const mv = fromDecimal(v);
                    return <LineDraw key={v} spec={{ kind: "s", m: mv, b: interceptOf(a.x, a.y, mv) }} color="#22d3ee" width={1.5} opacity={0.28} />;
                  })
                : null}

              {/* 평행이동: y = mx */}
              {shift ? (
                <>
                  <LineDraw spec={{ kind: "s", m, b: mkFrac(0, 1) }} color="#a78bfa" width={2} dash="6 4" opacity={0.9} />
                  <line x1={gx(0)} y1={gy(0)} x2={gx(a.x)} y2={gy(a.y)} stroke="#a78bfa" strokeWidth={1.6} strokeDasharray="3 3" />
                  <circle cx={gx(0)} cy={gy(0)} r={4} fill="#a78bfa" />
                  <text x={(gx(0) + gx(a.x)) / 2 + 6} y={(gy(0) + gy(a.y)) / 2 - 5} className="fill-violet-200 font-mono text-[9px]">
                    평행이동
                  </text>
                </>
              ) : null}

              {/* 기울기 삼각형 */}
              <line x1={gx(a.x)} y1={gy(a.y)} x2={gx(tri.x)} y2={gy(a.y)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3" />
              <line x1={gx(tri.x)} y1={gy(a.y)} x2={gx(tri.x)} y2={gy(tri.y)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3" />
              <text x={(gx(a.x) + gx(tri.x)) / 2} y={gy(a.y) + 13} textAnchor="middle" className="fill-amber-300 font-mono text-[9px] font-bold">
                {tri.dir > 0 ? "→" : "←"}
                {m.d}
              </text>
              {tri.y !== a.y ? (
                <text
                  x={gx(tri.x) + (tri.dir > 0 ? 5 : -5)}
                  y={(gy(a.y) + gy(tri.y)) / 2 + 3}
                  textAnchor={tri.dir > 0 ? "start" : "end"}
                  className="fill-amber-300 font-mono text-[9px] font-bold"
                >
                  {tri.y > a.y ? `↑${tri.y - a.y}` : `↓${a.y - tri.y}`}
                </text>
              ) : null}

              <LineDraw spec={spec} color="#34d399" width={3} />
            </Clipped>
            <Dot p={a} color="#22d3ee" label={`A(${nx(a.x)}, ${nx(a.y)})`} onDown={() => setDragId("A")} />
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 파란 점 A를 끌어 옮겨 보세요</p>
        </div>

        {/* 조작 + 식 */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-100">🎚️ 기울기 m</span>
              <span className="rounded-lg border border-amber-400/45 bg-amber-400/15 px-3 py-1 font-mono text-sm font-bold text-amber-100">
                m = {fracPlain(m)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={M_STEPS.length - 1}
              step={1}
              value={mIdx}
              aria-label="기울기 m"
              onChange={(e) => setMIdx(Number(e.target.value))}
              className="mt-2 h-1.5 w-full accent-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              오른쪽으로 <b className="text-amber-200">{m.d}</b>칸 갈 때 세로로{" "}
              <b className="text-amber-200">{m.n > 0 ? `${m.n}칸 위로` : m.n < 0 ? `${-m.n}칸 아래로` : "그대로"}</b>
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Toggle on={spin} onClick={() => setSpin((v) => !v)} tone="amber">
                {spin ? "⏸ 멈추기" : "🌀 돌려보기"}
              </Toggle>
              <Toggle on={fan} onClick={() => setFan((v) => !v)} tone="cyan">
                👻 잔상 남기기
              </Toggle>
              <Toggle on={shift} onClick={() => setShift((v) => !v)} tone="violet">
                ➡️ y = mx 의 평행이동
              </Toggle>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
            <p className="text-sm font-bold text-emerald-200">✍️ 식이 만들어지는 과정</p>
            <div className="mt-2 space-y-2">
              <EqRow step="공식" tex="y - y_1 = m(x - x_1)" tone="slate" />
              <EqRow step="대입" tex={pointSlopeSubTex(a.x, a.y, m)} tone="cyan" />
              <EqRow step="정리" tex={pointSlopeTidyTex(a.x, a.y, m)} tone="amber" />
              <EqRow step="완성" tex={lineTex(m, b)} tone="emerald" />
            </div>
            <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-xs leading-5 text-emerald-100">
              🔎 m을 아무리 바꿔도 직선은 늘 <b>A({nx(a.x)}, {nx(a.y)})</b>를 지나요. x에 {nx(a.x)}을 넣으면 오른쪽이 m×0 = 0이 되어
              y = {nx(a.y)} 가 되기 때문이에요.
            </p>
          </div>
        </div>
      </div>

      <PsPractice />
    </div>
  );
}

function Toggle({ on, onClick, tone, children }: { on: boolean; onClick: () => void; tone: "amber" | "cyan" | "violet"; children: React.ReactNode }) {
  const cls: Record<string, string> = {
    amber: "border-amber-400/60 bg-amber-400/20 text-amber-100",
    cyan: "border-cyan-400/60 bg-cyan-400/20 text-cyan-100",
    violet: "border-violet-400/60 bg-violet-400/20 text-violet-100",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (on ? cls[tone] : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}
    >
      {children}
    </button>
  );
}

function EqRow({ step, tex, tone }: { step: string; tex: string; tone: "slate" | "cyan" | "amber" | "emerald" }) {
  const cls: Record<string, string> = {
    slate: "border-white/10 bg-white/5 text-slate-400",
    cyan: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
    amber: "border-amber-400/40 bg-amber-400/10 text-amber-200",
    emerald: "border-emerald-400/50 bg-emerald-400/15 text-emerald-100",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={"w-11 shrink-0 rounded-md border px-1 py-0.5 text-center text-[10px] font-bold " + cls[tone]}>{step}</span>
      <div className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-black/25 px-3 py-1.5 text-slate-100">
        <Katex expr={tex} />
      </div>
    </div>
  );
}

// ─── 탭 ① 연습 문제 ───────────────────────────────────────────
function PsPractice() {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const p = PS_PROBLEMS[idx];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-100">✏️ 식 세우기 연습</p>
        <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 font-mono text-xs font-bold text-cyan-100">
          해결 {solved.size} / {PS_PROBLEMS.length}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PS_PROBLEMS.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setIdx(i)}
            className={
              "rounded-lg border px-3 py-1 text-xs font-bold transition " +
              (i === idx ? "border-cyan-400/60 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {solved.has(q.id) ? "✅ " : ""}문제 {i + 1}
          </button>
        ))}
      </div>
      <PsCard key={p.id} p={p} onSolved={() => setSolved((s) => new Set(s).add(p.id))} />
    </div>
  );
}

function PsCard({ p, onSolved }: { p: PsProblem; onSolved: () => void }) {
  const [i1, setI1] = useState(""); // y₁
  const [i2, setI2] = useState(""); // m
  const [i3, setI3] = useState(""); // x₁
  const [iN, setIN] = useState(""); // n
  const [checkA, setCheckA] = useState(false);
  const [checkB, setCheckB] = useState(false);
  const [hint, setHint] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const b = interceptOf(p.x1, p.y1, p.m);
  const mv = fracVal(p.m);
  const bv = fracVal(b);

  const ok1 = same(i1, p.y1);
  const ok2 = same(i2, mv);
  const ok3 = same(i3, p.x1);
  const okA = ok1 && ok2 && ok3;
  const okN = same(iN, bv);
  const done = (okA && okN) || gaveUp;

  useEffect(() => {
    if (okA && okN) onSolved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [okA, okN]);

  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_300px]">
      <div>
        <p className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.07] px-4 py-2.5 text-sm font-bold text-cyan-100">
          {p.story}의 방정식을 구해 보세요.
        </p>

        {/* 1단계 */}
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
          <p className="text-xs font-bold text-slate-400">1단계 · 점기울기 꼴에 넣기</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-base text-slate-100">
            <span>y −</span>
            <Box value={i1} onChange={setI1} ok={ok1} show={checkA} disabled={done} aria-label="y1 값" />
            <span>=</span>
            <Box value={i2} onChange={setI2} ok={ok2} show={checkA} disabled={done} aria-label="기울기 m 값" />
            <span>( x −</span>
            <Box value={i3} onChange={setI3} ok={ok3} show={checkA} disabled={done} aria-label="x1 값" />
            <span>)</span>
          </div>
          {!okA ? (
            <button
              type="button"
              onClick={() => setCheckA(true)}
              className="mt-2 rounded-lg border-2 border-cyan-400/55 bg-cyan-400/15 px-4 py-1.5 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/25"
            >
              확인
            </button>
          ) : (
            <p className="mt-2 text-xs font-bold text-emerald-300">✅ 좋아요! 이제 정리해 볼까요?</p>
          )}
        </div>

        {/* 2단계 */}
        {okA || gaveUp ? (
          <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
            <p className="text-xs font-bold text-slate-400">2단계 · y = mx + n 꼴로 정리하기</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-base text-slate-100">
              <span>y = {fracPlain(p.m)} x +</span>
              <Box value={iN} onChange={setIN} ok={okN} show={checkB} disabled={done} aria-label="상수항 n 값" />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">※ 음수면 −4 처럼, 분수면 3/2 처럼 적어 주세요.</p>
            {!okN ? (
              <button
                type="button"
                onClick={() => setCheckB(true)}
                className="mt-2 rounded-lg border-2 border-cyan-400/55 bg-cyan-400/15 px-4 py-1.5 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/25"
              >
                확인
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setHint((v) => !v)}
            className="rounded-lg border border-amber-400/45 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-400/20"
          >
            💡 힌트
          </button>
          {!done ? (
            <button
              type="button"
              onClick={() => setGaveUp(true)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              정답 보기
            </button>
          ) : null}
        </div>
        {hint ? <p className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-100">💡 {p.hint}</p> : null}

        {done ? (
          <div className="mt-2 rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-4 py-3">
            <p className="text-sm font-bold text-emerald-100">{gaveUp && !okN ? "📖 풀이" : "🎉 정답!"}</p>
            <div className="mt-1 overflow-x-auto text-slate-100">
              <Katex expr={`${pointSlopeTidyTex(p.x1, p.y1, p.m)} \\;\\Rightarrow\\; ${lineTex(p.m, b)}`} display />
            </div>
            <p className="mt-1 text-xs leading-5 text-emerald-100/90">{p.explain}</p>
          </div>
        ) : null}
      </div>

      {/* 미니 그래프 */}
      <div>
        <Plane cid={`ps-mini-${p.id}`} label={`${p.story} 그래프`} small>
          <Clipped cid={`ps-mini-${p.id}`}>{done ? <LineDraw spec={{ kind: "s", m: p.m, b }} color="#34d399" width={3} /> : null}</Clipped>
          <Dot p={{ x: p.x1, y: p.y1 }} color="#22d3ee" label={`(${nx(p.x1)}, ${nx(p.y1)})`} />
        </Plane>
        <p className="mt-1 text-center text-[11px] text-slate-500">{done ? "정답 직선이 점을 지나요!" : "정답을 맞히면 직선이 그려져요"}</p>
      </div>
    </div>
  );
}

function Box({
  value,
  onChange,
  ok,
  show,
  disabled,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  ok: boolean;
  show: boolean;
  disabled: boolean;
  "aria-label": string;
}) {
  const border = !show ? "border-white/15" : ok ? "border-emerald-400/60" : "border-rose-400/60";
  return (
    <input
      type="text"
      inputMode="text"
      value={value}
      aria-label={ariaLabel}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder="?"
      className={"w-16 rounded-lg border-2 bg-slate-900 px-2 py-1 text-center font-mono text-sm text-white outline-none transition focus:border-cyan-300 disabled:opacity-70 " + border}
    />
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 가로선 · 세로선
// ══════════════════════════════════════════════════════════════
function SpecialTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState<Pt>({ x: 2, y: -3 });
  const [mIdx, setMIdx] = useState(M_STEPS.indexOf(1));
  const [vertical, setVertical] = useState(false);
  const { setDragId } = useGridDrag(svgRef, (_id, p) => setA(p));

  const m = fromDecimal(M_STEPS[mIdx]);
  const b = interceptOf(a.x, a.y, m);
  const isZero = !vertical && m.n === 0;
  const spec: LineSpec = vertical ? { kind: "v", k: a.x } : { kind: "s", m, b };
  // 격자 밖으로 나가지 않도록 보조점을 반대쪽으로 잡는다(삼각형 모양은 그대로).
  const dirX = a.x + m.d > G.MAX ? -1 : 1;
  const other: Pt = vertical
    ? { x: a.x, y: a.y + 4 > G.MAX ? a.y - 4 : a.y + 4 }
    : { x: a.x + dirX * m.d, y: a.y + dirX * m.n };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={"rounded-2xl border p-3 " + (vertical ? "border-rose-400/30 bg-rose-500/[0.06]" : isZero ? "border-amber-400/30 bg-amber-500/[0.06]" : "border-cyan-400/25 bg-cyan-500/[0.05]")}>
          <Plane cid="sp-clip" svgRef={svgRef} label="기울기에 따라 달라지는 직선">
            <Clipped cid="sp-clip">
              {vertical ? (
                <>
                  <LineDraw spec={spec} color="#fb7185" width={3} />
                  <line x1={gx(a.x)} y1={gy(a.y)} x2={gx(a.x)} y2={gy(other.y)} stroke="#fda4af" strokeWidth={2} strokeDasharray="4 3" />
                  <text x={gx(a.x) + 7} y={(gy(a.y) + gy(other.y)) / 2} className="fill-rose-200 font-mono text-[9px] font-bold">
                    세로 변화 ≠ 0
                  </text>
                  <text x={gx(a.x)} y={gy(a.y) + 26} textAnchor="middle" className="fill-rose-200 font-mono text-[9px] font-bold">
                    가로 변화 = 0
                  </text>
                </>
              ) : (
                <>
                  <LineDraw spec={spec} color={isZero ? "#fbbf24" : "#34d399"} width={3} />
                  <line x1={gx(a.x)} y1={gy(a.y)} x2={gx(other.x)} y2={gy(a.y)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3" />
                  {m.n !== 0 ? <line x1={gx(other.x)} y1={gy(a.y)} x2={gx(other.x)} y2={gy(other.y)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3" /> : null}
                  <text x={(gx(a.x) + gx(other.x)) / 2} y={gy(a.y) + 13} textAnchor="middle" className="fill-amber-300 font-mono text-[9px] font-bold">
                    {dirX > 0 ? "→" : "←"}
                    {m.d}
                  </text>
                  <text x={gx(other.x) + (dirX > 0 ? 5 : -5)} y={(gy(a.y) + gy(other.y)) / 2 + 3} textAnchor={dirX > 0 ? "start" : "end"} className="fill-amber-300 font-mono text-[9px] font-bold">
                    {other.y === a.y ? "0" : other.y > a.y ? `↑${other.y - a.y}` : `↓${a.y - other.y}`}
                  </text>
                </>
              )}
            </Clipped>
            {vertical ? <Dot p={other} color="#fda4af" label={`(${nx(a.x)}, ${nx(other.y)})`} /> : null}
            <Dot p={a} color="#22d3ee" label={`A(${nx(a.x)}, ${nx(a.y)})`} onDown={() => setDragId("A")} />
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 점 A를 끌고, 아래에서 기울기를 바꿔 보세요</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-100">🎚️ 기울기</span>
              <span
                className={
                  "rounded-lg border px-3 py-1 font-mono text-sm font-bold " +
                  (vertical ? "border-rose-400/45 bg-rose-400/15 text-rose-100" : "border-amber-400/45 bg-amber-400/15 text-amber-100")
                }
              >
                {vertical ? "m = 없음" : `m = ${fracPlain(m)}`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={M_STEPS.length - 1}
              step={1}
              value={mIdx}
              disabled={vertical}
              aria-label="기울기 m"
              onChange={(e) => setMIdx(Number(e.target.value))}
              className="mt-2 h-1.5 w-full accent-amber-400 disabled:opacity-40"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setVertical(false);
                  setMIdx(M_STEPS.indexOf(0));
                }}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (isZero ? "border-amber-400/60 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                ─ 기울기 0 (x축에 평행)
              </button>
              <button
                type="button"
                onClick={() => setVertical(true)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (vertical ? "border-rose-400/60 bg-rose-400/20 text-rose-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                │ y축에 평행 (기울기 없음)
              </button>
              <button
                type="button"
                onClick={() => {
                  setVertical(false);
                  setMIdx(M_STEPS.indexOf(1));
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10"
              >
                ↺ 보통 직선으로
              </button>
            </div>
          </div>

          {/* 상황별 식 */}
          {vertical ? (
            <div className="rounded-2xl border border-rose-400/35 bg-rose-400/[0.08] p-4">
              <p className="text-sm font-bold text-rose-200">│ y축에 평행한 직선</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                가로로 간 거리가 <b className="text-rose-200">0</b>이라 (세로 변화)÷(가로 변화)를 계산할 수 없어요 ⇒{" "}
                <b className="text-rose-200">기울기가 없다</b>.
              </p>
              <div className="mt-2 space-y-2">
                <div className="rounded-lg border border-rose-400/30 bg-black/25 px-3 py-2 text-slate-400 line-through">
                  <Katex expr="y - y_1 = m(x - x_1)" />
                </div>
                <p className="text-center text-xs text-rose-200">↓ 대신에</p>
                <div className="overflow-x-auto rounded-lg border border-rose-400/45 bg-rose-400/15 px-3 py-2 text-rose-50">
                  <Katex expr={`x = ${a.x}`} display />
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-400">직선 위 점들의 x좌표가 모두 {nx(a.x)} 이기 때문이에요.</p>
            </div>
          ) : isZero ? (
            <div className="rounded-2xl border border-amber-400/35 bg-amber-400/[0.08] p-4">
              <p className="text-sm font-bold text-amber-200">─ 기울기가 0인 직선 (x축에 평행)</p>
              <div className="mt-2 space-y-2">
                <EqRow step="대입" tex={pointSlopeSubTex(a.x, a.y, m)} tone="cyan" />
                <EqRow step="정리" tex={`y - ${a.y < 0 ? `(${a.y})` : a.y} = 0`} tone="amber" />
                <EqRow step="완성" tex={`y = ${a.y}`} tone="emerald" />
              </div>
              <p className="mt-2 text-xs text-slate-400">아무리 x가 변해도 y는 늘 {nx(a.y)} — 그래서 y좌표만 남아요.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
              <p className="text-sm font-bold text-emerald-200">↗ 기울어진 보통 직선</p>
              <div className="mt-2 space-y-2">
                <EqRow step="대입" tex={pointSlopeSubTex(a.x, a.y, m)} tone="cyan" />
                <EqRow step="완성" tex={lineTex(m, b)} tone="emerald" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 정리표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📋 점 A(x₁, y₁)을 지나는 특별한 직선</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <SummaryCard tone="amber" icon="─" title="x축에 평행" slope="기울기 m = 0" eq="y = y_1" note="y좌표가 늘 같아요" example="예: A(4, −1) → y = −1" />
          <SummaryCard tone="rose" icon="│" title="y축에 평행" slope="기울기 없음" eq="x = x_1" note="x좌표가 늘 같아요" example="예: A(4, −1) → x = 4" />
        </div>
        <p className="mt-2 rounded-lg border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-xs leading-5 text-violet-100">
          ⚠️ 자주 하는 실수 — <b>x축에 평행</b>하다고 해서 x = □ 가 아니에요! x축에 평행하면 <b>y</b>가 일정하므로 y = □ 입니다.
        </p>
      </div>

      <LineQuizGame />
    </div>
  );
}

function SummaryCard({
  tone,
  icon,
  title,
  slope,
  eq,
  note,
  example,
}: {
  tone: "amber" | "rose";
  icon: string;
  title: string;
  slope: string;
  eq: string;
  note: string;
  example: string;
}) {
  const cls = tone === "amber" ? "border-amber-400/35 bg-amber-400/[0.08]" : "border-rose-400/35 bg-rose-400/[0.08]";
  const txt = tone === "amber" ? "text-amber-200" : "text-rose-200";
  return (
    <div className={"rounded-xl border px-4 py-3 " + cls}>
      <p className={"text-sm font-bold " + txt}>
        <span className="mr-1 font-mono">{icon}</span>
        {title}
      </p>
      <p className="mt-0.5 text-xs text-slate-300">{slope}</p>
      <div className="mt-2 overflow-x-auto rounded-lg bg-black/25 px-3 py-1.5 text-slate-50">
        <Katex expr={eq} />
      </div>
      <p className="mt-1 text-[11px] text-slate-400">{note}</p>
      <p className="mt-0.5 font-mono text-[11px] text-slate-300">{example}</p>
    </div>
  );
}

// ─── 탭 ② 직선 맞히기 ─────────────────────────────────────────
function LineQuizGame() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = idx >= LINE_QUIZ.length;

  if (done) {
    return (
      <div className="rounded-2xl border-2 border-emerald-400/45 bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 p-5 text-center">
        <p className="text-3xl">🎯</p>
        <p className="mt-2 text-xl font-extrabold text-emerald-200">직선 맞히기 완료!</p>
        <p className="mt-2 font-mono text-lg font-bold text-emerald-100">
          한 번에 맞힌 문제 {score} / {LINE_QUIZ.length}
        </p>
        <button
          type="button"
          onClick={() => {
            setIdx(0);
            setPicked(null);
            setScore(0);
          }}
          className="mt-4 rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↻ 다시 도전
        </button>
      </div>
    );
  }

  const q = LINE_QUIZ[idx];
  const correct = picked === q.answer;
  const showLine = q.mode === "graph" || correct;

  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">🎯 직선 맞히기 · {idx + 1} / {LINE_QUIZ.length}</p>
        <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 font-mono text-xs font-bold text-cyan-100">점수 {score}</span>
      </div>
      <p className="mt-2 text-sm font-bold text-slate-100">{q.prompt}</p>

      <div className="mt-3 grid gap-3 lg:grid-cols-[300px_1fr]">
        <Plane cid={`quiz-${q.id}`} label={q.prompt} small>
          <Clipped cid={`quiz-${q.id}`}>{showLine ? <LineDraw spec={q.line} color="#34d399" width={3} /> : null}</Clipped>
          {q.point ? <Dot p={q.point} color="#22d3ee" label={`(${nx(q.point.x)}, ${nx(q.point.y)})`} /> : null}
        </Plane>

        <div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {q.choices.map((c, i) => {
              const state = picked === null ? "idle" : i === q.answer ? "right" : i === picked ? "wrong" : "idle";
              return (
                <button
                  key={c}
                  type="button"
                  disabled={correct}
                  onClick={() => {
                    if (correct) return;
                    if (picked === null && i === q.answer) setScore((s) => s + 1);
                    setPicked(i);
                  }}
                  className={
                    "rounded-xl border-2 px-3 py-2 text-left transition " +
                    (state === "right"
                      ? "border-emerald-400/60 bg-emerald-400/20"
                      : state === "wrong"
                        ? "border-rose-400/60 bg-rose-400/20"
                        : "border-white/10 bg-white/5 hover:bg-white/10")
                  }
                >
                  <span className="text-slate-100">
                    <Katex expr={c} />
                  </span>
                  {state === "right" ? <span className="ml-2 text-sm">✅</span> : null}
                  {state === "wrong" ? <span className="ml-2 text-sm">❌</span> : null}
                </button>
              );
            })}
          </div>

          {picked !== null ? (
            <div
              className={
                "mt-2 rounded-xl border px-3 py-2 text-xs leading-5 " +
                (correct ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-100" : "border-rose-400/45 bg-rose-400/10 text-rose-100")
              }
            >
              {correct ? "✅ 정답! " : "❌ 다시 골라 보세요. "}
              {correct ? q.explain : ""}
            </div>
          ) : null}

          {correct ? (
            <button
              type="button"
              onClick={() => {
                setIdx((i) => i + 1);
                setPicked(null);
              }}
              className="mt-2 rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-5 py-1.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
            >
              {idx + 1 < LINE_QUIZ.length ? "다음 문제 →" : "결과 보기 🎉"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 두 점 잇기
// ══════════════════════════════════════════════════════════════
function TwoPointTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState<Pt>({ x: -2, y: -1 });
  const [b, setB] = useState<Pt>({ x: 3, y: 4 });
  const [base, setBase] = useState<"A" | "B">("A");
  const { setDragId } = useGridDrag(svgRef, (id, p) => (id === "A" ? setA(p) : setB(p)));

  const samePoint = a.x === b.x && a.y === b.y;
  const isVertical = !samePoint && a.x === b.x;
  const m = isVertical || samePoint ? null : slopeOf(a, b);
  const n = m ? interceptOf(a.x, a.y, m) : null;
  const spec: LineSpec | null = samePoint ? null : isVertical ? { kind: "v", k: a.x } : m && n ? { kind: "s", m, b: n } : null;
  const bp = base === "A" ? a : b;

  const dy = b.y - a.y;
  const dx = b.x - a.x;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-3">
          <Plane cid="tp-clip" svgRef={svgRef} label="두 점을 지나는 직선">
            <Clipped cid="tp-clip">
              {spec ? <LineDraw spec={spec} color={isVertical ? "#fb7185" : "#34d399"} width={3} /> : null}
              {!samePoint ? (
                <>
                  <line x1={gx(a.x)} y1={gy(a.y)} x2={gx(b.x)} y2={gy(a.y)} stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 3" />
                  <line x1={gx(b.x)} y1={gy(a.y)} x2={gx(b.x)} y2={gy(b.y)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3" />
                  {dx !== 0 ? (
                    <text x={(gx(a.x) + gx(b.x)) / 2} y={gy(a.y) + (dy > 0 ? 14 : -7)} textAnchor="middle" className="fill-sky-300 font-mono text-[9px] font-bold">
                      x의 차 {nx(dx)}
                    </text>
                  ) : null}
                  {dy !== 0 ? (
                    <text x={gx(b.x) + (dx >= 0 ? 6 : -6)} y={(gy(a.y) + gy(b.y)) / 2 + 3} textAnchor={dx >= 0 ? "start" : "end"} className="fill-amber-300 font-mono text-[9px] font-bold">
                      y의 차 {nx(dy)}
                    </text>
                  ) : null}
                </>
              ) : null}
            </Clipped>
            <Dot p={a} color="#22d3ee" label={`A(${nx(a.x)}, ${nx(a.y)})`} onDown={() => setDragId("A")} />
            <Dot p={b} color="#fbbf24" label={`B(${nx(b.x)}, ${nx(b.y)})`} onDown={() => setDragId("B")} />
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 두 점을 끌어 옮겨 보세요</p>
        </div>

        <div className="space-y-3">
          {samePoint ? (
            <div className="rounded-2xl border border-violet-400/35 bg-violet-400/[0.08] p-4">
              <p className="text-sm font-bold text-violet-200">🤔 두 점이 겹쳤어요!</p>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                한 점만으로는 직선이 하나로 정해지지 않아요(그 점을 지나는 직선은 무수히 많아요). <b>서로 다른</b> 두 점이어야 직선이
                딱 하나로 정해집니다.
              </p>
            </div>
          ) : isVertical ? (
            <div className="rounded-2xl border border-rose-400/35 bg-rose-400/[0.08] p-4">
              <p className="text-sm font-bold text-rose-200">│ x좌표가 같아요 → 기울기가 없어요</p>
              <div className="mt-2 space-y-2">
                <EqRow step="기울기" tex={`m = \\frac{${b.y} - (${a.y})}{${b.x} - (${a.x})} = \\frac{${dy}}{0}`} tone="cyan" />
                <p className="text-center text-xs font-bold text-rose-200">↑ 0으로 나눌 수 없어요 — 기울기를 정할 수 없습니다</p>
                <div className="overflow-x-auto rounded-lg border border-rose-400/45 bg-rose-400/15 px-3 py-2 text-rose-50">
                  <Katex expr={`x = ${a.x}`} display />
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-400">두 점의 x좌표가 모두 {nx(a.x)} 이므로 y축에 평행한 직선이에요.</p>
            </div>
          ) : m && n ? (
            <>
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-emerald-200">✍️ 두 점으로 식 세우기</p>
                  <button
                    type="button"
                    onClick={() => setBase((v) => (v === "A" ? "B" : "A"))}
                    className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-200 transition hover:bg-white/10"
                  >
                    기준점: {base} ⇄ {base === "A" ? "B" : "A"}
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  <EqRow step="① 기울기" tex={`m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{${b.y} - (${a.y})}{${b.x} - (${a.x})} = \\frac{${dy}}{${dx}} = ${fracTex(m)}`} tone="cyan" />
                  <EqRow step={`② 대입`} tex={pointSlopeSubTex(bp.x, bp.y, m)} tone="amber" />
                  <EqRow step="③ 완성" tex={lineTex(m, n)} tone="emerald" />
                </div>
              </div>

              <div className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
                <p className="text-sm font-bold text-violet-200">🔄 어느 점을 기준으로 해도 같아요</p>
                <div className="mt-2 space-y-1.5 text-sm">
                  <EqRow step="A 기준" tex={`${pointSlopeTidyTex(a.x, a.y, m)} \\;\\Rightarrow\\; ${lineTex(m, n)}`} tone="cyan" />
                  <EqRow step="B 기준" tex={`${pointSlopeTidyTex(b.x, b.y, m)} \\;\\Rightarrow\\; ${lineTex(m, n)}`} tone="amber" />
                </div>
                <p className="mt-1.5 text-xs text-violet-100">✅ 정리하면 똑같은 직선의 방정식이 나와요!</p>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <StarMission />
    </div>
  );
}

// ─── 탭 ③ 별 잇기 미션 ────────────────────────────────────────
function StarMission() {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const done = idx >= STAR_ROUNDS.length;

  if (done) {
    return (
      <div className="rounded-2xl border-2 border-emerald-400/45 bg-gradient-to-br from-emerald-500/15 to-violet-500/15 p-5 text-center">
        <p className="text-3xl">🌌</p>
        <p className="mt-2 text-xl font-extrabold text-emerald-200">별자리 완성!</p>
        <p className="mt-2 font-mono text-lg font-bold text-emerald-100">
          이은 별자리 {solved.size} / {STAR_ROUNDS.length}
        </p>
        <p className="mt-3 text-sm text-emerald-100">
          두 점만 있으면 기울기를 구해 직선의 방정식을 세울 수 있어요. x좌표가 같을 때는 바로 x = x₁ 이었죠! ✏️
        </p>
        <button
          type="button"
          onClick={() => {
            setIdx(0);
            setSolved(new Set());
          }}
          className="mt-4 rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↻ 처음부터 다시
        </button>
      </div>
    );
  }

  const r = STAR_ROUNDS[idx];
  return (
    <StarCard
      key={r.id}
      r={r}
      idx={idx}
      total={STAR_ROUNDS.length}
      solvedCount={solved.size}
      onSolved={() => setSolved((s) => new Set(s).add(r.id))}
      onNext={() => setIdx((i) => i + 1)}
    />
  );
}

function StarCard({
  r,
  idx,
  total,
  solvedCount,
  onSolved,
  onNext,
}: {
  r: StarRound;
  idx: number;
  total: number;
  solvedCount: number;
  onSolved: () => void;
  onNext: () => void;
}) {
  const [sDy, setSDy] = useState("");
  const [sDx, setSDx] = useState("");
  const [sM, setSM] = useState("");
  const [mNone, setMNone] = useState(false);
  const [sAns, setSAns] = useState("");
  const [ck, setCk] = useState({ a: false, b: false, c: false, d: false });
  const [hint, setHint] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const dy = r.b.y - r.a.y;
  const dx = r.b.x - r.a.x;
  const vertical = dx === 0;
  const m = vertical ? null : slopeOf(r.a, r.b);
  const n = m ? interceptOf(r.a.x, r.a.y, m) : null;
  const spec: LineSpec = vertical ? { kind: "v", k: r.a.x } : { kind: "s", m: m!, b: n! };
  const finalAns = vertical ? r.a.x : fracVal(n!);

  const okDy = same(sDy, dy);
  const okDx = same(sDx, dx);
  const okM = vertical ? mNone : same(sM, fracVal(m!));
  const okAns = same(sAns, finalAns);
  const cleared = okDy && okDx && okM && okAns;
  const shown = cleared || gaveUp;

  useEffect(() => {
    if (cleared) onSolved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleared]);

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.07] to-slate-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
          🌠 별 잇기 미션 · {idx + 1} / {total}
        </p>
        <span className="rounded-full border border-violet-400/45 bg-violet-400/15 px-3 py-1 font-mono text-xs font-bold text-violet-100">
          완성 {solvedCount} / {total}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-200">
        {r.emoji} <b className="text-violet-200">{r.name}</b> — 두 별{" "}
        <b className="font-mono text-cyan-200">A({nx(r.a.x)}, {nx(r.a.y)})</b> 와{" "}
        <b className="font-mono text-amber-200">B({nx(r.b.x)}, {nx(r.b.y)})</b> 를 잇는 직선의 방정식을 구해 별자리를 완성하세요!
      </p>

      <div className="mt-3 grid gap-3 lg:grid-cols-[300px_1fr]">
        <div>
          <Plane cid={`star-${r.id}`} label={`${r.name} 별 잇기`} small>
            <Clipped cid={`star-${r.id}`}>{shown ? <LineDraw spec={spec} color={vertical ? "#fb7185" : "#34d399"} width={3} /> : null}</Clipped>
            <Dot p={r.a} color="#22d3ee" label={`A(${nx(r.a.x)}, ${nx(r.a.y)})`} />
            <Dot p={r.b} color="#fbbf24" label={`B(${nx(r.b.x)}, ${nx(r.b.y)})`} />
          </Plane>
          <p className="mt-1 text-center text-[11px] text-slate-500">{shown ? "✨ 별자리가 이어졌어요!" : "정답을 맞히면 별이 이어져요"}</p>
        </div>

        <div className="space-y-2">
          <StepLine label="① y좌표의 차  y₂ − y₁" value={sDy} onChange={setSDy} ok={okDy} show={ck.a} onCheck={() => setCk((c) => ({ ...c, a: true }))} disabled={shown} />

          {okDy || shown ? (
            <StepLine label="② x좌표의 차  x₂ − x₁" value={sDx} onChange={setSDx} ok={okDx} show={ck.b} onCheck={() => setCk((c) => ({ ...c, b: true }))} disabled={shown} />
          ) : null}

          {(okDy && okDx) || shown ? (
            vertical ? (
              <div className="rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2">
                <p className="font-mono text-sm text-slate-200">③ 기울기 m = (y의 차) ÷ (x의 차) 를 구할 수 있을까요?</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={shown}
                    onClick={() => setCk((c) => ({ ...c, c: true }))}
                    className={"rounded-lg border px-3 py-1.5 text-xs font-bold transition " + (ck.c && !mNone ? "border-rose-400/60 bg-rose-400/20 text-rose-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}
                  >
                    구할 수 있다
                  </button>
                  <button
                    type="button"
                    disabled={shown}
                    onClick={() => {
                      setMNone(true);
                      setCk((c) => ({ ...c, c: true }));
                    }}
                    className={"rounded-lg border px-3 py-1.5 text-xs font-bold transition " + (mNone ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}
                  >
                    기울기가 없다
                  </button>
                  {ck.c ? <span className="self-center text-sm">{mNone ? "✅" : "❌"}</span> : null}
                </div>
                {ck.c && !mNone ? <p className="mt-1 text-[11px] text-rose-200">0으로 나눌 수는 없어요. 다시 생각해 볼까요?</p> : null}
              </div>
            ) : (
              <StepLine label="③ 기울기 m = (y의 차) ÷ (x의 차)" value={sM} onChange={setSM} ok={okM} show={ck.c} onCheck={() => setCk((c) => ({ ...c, c: true }))} disabled={shown} placeholder="예: 2 또는 1/2" />
            )
          ) : null}

          {(okDy && okDx && okM) || shown ? (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/[0.08] px-3 py-2">
              <p className="text-xs font-bold text-emerald-200">④ 직선의 방정식 완성하기</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-base text-slate-100">
                {vertical ? (
                  <>
                    <span>x =</span>
                    <Box value={sAns} onChange={setSAns} ok={okAns} show={ck.d} disabled={shown} aria-label="x 값" />
                  </>
                ) : m!.n === 0 ? (
                  <>
                    <span>y =</span>
                    <Box value={sAns} onChange={setSAns} ok={okAns} show={ck.d} disabled={shown} aria-label="y 값" />
                  </>
                ) : (
                  <>
                    <span>y = {fracPlain(m!)} x +</span>
                    <Box value={sAns} onChange={setSAns} ok={okAns} show={ck.d} disabled={shown} aria-label="상수항 n 값" />
                  </>
                )}
                {!okAns && !shown ? (
                  <button
                    type="button"
                    onClick={() => setCk((c) => ({ ...c, d: true }))}
                    className="rounded-lg border-2 border-emerald-400/55 bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/25"
                  >
                    확인
                  </button>
                ) : null}
              </div>
              {!vertical && m!.n !== 0 ? <p className="mt-1 text-[11px] text-slate-500">※ n = y₁ − m·x₁ 이에요. 음수면 −4, 분수면 3/2 처럼 적어 주세요.</p> : null}
            </div>
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
          {hint ? <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-100">💡 {r.hint}</p> : null}

          {shown ? (
            <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-4 py-3">
              <p className="text-sm font-bold text-emerald-100">{cleared ? "🎉 별자리 완성!" : "📖 풀이"}</p>
              <div className="mt-1 overflow-x-auto text-slate-100">
                <Katex expr={lineSpecTex(spec)} display />
              </div>
              <p className="mt-1 text-xs leading-5 text-emerald-100/90">{r.explain}</p>
              <button
                type="button"
                onClick={onNext}
                className="mt-2 rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-5 py-1.5 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25"
              >
                {idx + 1 < total ? "다음 별자리 →" : "결과 보기 🎉"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StepLine({
  label,
  value,
  onChange,
  ok,
  show,
  onCheck,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  ok: boolean;
  show: boolean;
  onCheck: () => void;
  disabled: boolean;
  placeholder?: string;
}) {
  const border = !show ? "border-white/15" : ok ? "border-emerald-400/60" : "border-rose-400/60";
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2">
      <label className="flex-1 font-mono text-sm text-slate-200" htmlFor={label}>
        {label}
      </label>
      <input
        id={label}
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder ?? "?"}
        onChange={(e) => onChange(e.target.value)}
        className={"w-24 rounded-lg border-2 bg-slate-900 px-2 py-1 text-center font-mono text-sm text-white outline-none transition focus:border-cyan-300 disabled:opacity-70 " + border}
      />
      {!ok && !disabled ? (
        <button
          type="button"
          onClick={onCheck}
          className="rounded-lg border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/25"
        >
          확인
        </button>
      ) : (
        <span className="w-5 text-center text-base">{ok ? "✅" : ""}</span>
      )}
    </div>
  );
}
