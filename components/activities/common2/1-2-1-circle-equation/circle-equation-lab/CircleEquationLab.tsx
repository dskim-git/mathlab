"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CIRCLE_QUIZ,
  DIAMETER_QUIZ,
  SCENARIOS,
  VERDICT_LABEL,
  VERDICT_SIGN,
  circleTex,
  dist2,
  midpoint,
  radPlain,
  verdictOf,
  type CircleQ,
  type DiameterQ,
  type Pt,
  type Scenario,
  type Verdict,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_equation",
    prompt:
      "원은 ‘한 점에서 같은 거리에 있는 점들의 모임’이에요. 이 말에서 어떻게 (x−a)² + (y−b)² = r² 이라는 식이 나오는지, 탭①에서 본 직각삼각형과 함께 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 중심 C(a, b)와 원 위의 점 P(x, y) 사이의 거리가 늘 r이다. 두 점 사이의 거리는 가로 |x−a|, 세로 |y−b|를 두 변으로 하는 직각삼각형의 빗변이므로 (x−a)²+(y−b)²=r²이 된다.",
  },
  {
    id: "sign_trap",
    prompt:
      "(x + 3)² + (y − 2)² = 16 의 중심과 반지름을 찾을 때 실수하기 쉬운 점은 무엇인가요? 방정식에서 중심과 반지름을 정확히 읽어 내는 나만의 방법을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: (x + 3)² 은 (x − (−3))² 이라 중심의 x좌표가 +3이 아니라 −3이다. 그리고 오른쪽 16은 r이 아니라 r²이므로 반지름은 4다. 항상 (x − a)² 꼴로 바꿔 읽는 습관을 들이면 좋겠다.",
  },
  {
    id: "diameter",
    prompt:
      "지름의 양 끝점 A, B만 주어져도 원의 방정식을 구할 수 있었어요. 그 방법을 순서대로 정리하고, 탭③에서 관찰한 ‘지름을 바라보는 각’에 대해 알게 된 것도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: ① 중심은 A와 B의 중점 ② 반지름은 AB 길이의 절반(또는 r² = AB²÷4) ③ 표준형에 넣는다. 원 위의 어느 점 P에서 A, B를 바라봐도 각이 항상 90°였다.",
  },
];

// ─── 좌표평면 공용 ────────────────────────────────────────────
const G = { MIN: -9, MAX: 9, U: 19, PAD: 28 };
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

const C_IN = "#34d399";
const C_ON = "#fbbf24";
const C_OUT = "#fb7185";
const VERDICT_COLOR: Record<Verdict, string> = { in: C_IN, on: C_ON, out: C_OUT };

function GridLines() {
  return (
    <g>
      {range(G.MIN, G.MAX).map((v) => (
        <line key={`vx${v}`} x1={gx(v)} y1={gy(G.MAX)} x2={gx(v)} y2={gy(G.MIN)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      {range(G.MIN, G.MAX).map((v) => (
        <line key={`hy${v}`} x1={gx(G.MIN)} y1={gy(v)} x2={gx(G.MAX)} y2={gy(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      <line x1={gx(G.MIN)} y1={gy(0)} x2={gx(G.MAX)} y2={gy(0)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={gx(0)} y1={gy(G.MIN)} x2={gx(0)} y2={gy(G.MAX)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      {range(G.MIN, G.MAX)
        .filter((v) => v !== 0 && v % 3 === 0)
        .map((v) => (
          <text key={`tx${v}`} x={gx(v)} y={gy(0) + 12} textAnchor="middle" className="fill-slate-500 font-mono text-[8px]">
            {v}
          </text>
        ))}
      {range(G.MIN, G.MAX)
        .filter((v) => v !== 0 && v % 3 === 0)
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
        className={"mx-auto block w-full touch-none select-none " + (small ? "max-w-[300px]" : "max-w-[420px]")}
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

function CircleDraw({ c, r, color, fill, dash, width = 3 }: { c: Pt; r: number; color: string; fill?: string; dash?: string; width?: number }) {
  return <circle cx={gx(c.x)} cy={gy(c.y)} r={r * G.U} fill={fill ?? "none"} stroke={color} strokeWidth={width} strokeDasharray={dash} />;
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
          y={p.y >= G.MAX - 0.5 ? gy(p.y) + 19 : gy(p.y) - 12}
          textAnchor={p.x <= G.MIN + 1.5 ? "start" : p.x >= G.MAX - 1.5 ? "end" : "middle"}
          className="fill-white font-mono text-[10px] font-bold"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
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

function parseInt2(s: string): number | null {
  const t = s.trim().replace(/[−–—]/g, "-").replace(/\s/g, "");
  if (!t || t === "-") return null;
  return /^-?\d+$/.test(t) ? Number(t) : null;
}
function isAns(s: string, target: number): boolean {
  const v = parseInt2(s);
  return v !== null && v === target;
}

/** 수식 한 줄 — 줄바꿈 없이, 길면 그 줄만 가로 스크롤. */
function FormulaLine({ tex, label, big }: { tex: string; label?: string; big?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      {label ? <span className="w-12 shrink-0 text-[10px] font-bold text-slate-400">{label}</span> : null}
      <span className={"min-w-0 flex-1 overflow-x-auto overflow-y-hidden py-1 text-slate-100 " + (big ? "text-lg" : "")}>
        <Katex expr={tex} />
      </span>
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "birth" | "quiz" | "diameter";

export default function CircleEquationLab() {
  const [tab, setTab] = useState<Tab>("birth");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">⭕ 원의 방정식</h3>
        <p className="mt-2 leading-7 text-slate-300">
          와이파이·배달·등대처럼 <b className="text-emerald-200">“중심에서 같은 거리”</b> 인 상황에서 원의 방정식이 어떻게 태어나는지 보고,
          <b className="text-amber-200"> 중심·반지름 ⇄ 방정식</b>을 자유자재로 오간 뒤 <b className="text-violet-200">지름의 양 끝점</b>으로도 원을 만들어 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "birth"} onClick={() => setTab("birth")}>
          ① 원의 방정식이 태어나는 순간
        </TabButton>
        <TabButton active={tab === "quiz"} onClick={() => setTab("quiz")}>
          ② 중심·반지름 ⇄ 방정식
        </TabButton>
        <TabButton active={tab === "diameter"} onClick={() => setTab("diameter")}>
          ③ 지름의 양 끝점 🎯
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "birth" ? <BirthTab /> : null}
        {tab === "quiz" ? <QuizTab /> : null}
        {tab === "diameter" ? <DiameterTab /> : null}
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
// 탭 ① 원의 방정식이 태어나는 순간
// ══════════════════════════════════════════════════════════════
function BirthTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [sid, setSid] = useState(0);
  const sc: Scenario = SCENARIOS[sid];
  const [Q, setQ] = useState<Pt>(sc.probes[0].p);
  const [picked, setPicked] = useState<Record<string, Verdict>>({});
  const [probeIdx, setProbeIdx] = useState(0);

  const { setDragId } = useGridDrag(svgRef, (_id, p) => setQ(p));

  const C = sc.center;
  const r2 = sc.r * sc.r;
  const lhs = dist2(Q, C);
  const verdict = verdictOf(Q, C, r2);

  const probe = sc.probes[probeIdx];
  const probeKey = `${sc.id}-${probeIdx}`;
  const probeAnswer = verdictOf(probe.p, C, r2);
  const myPick = picked[probeKey];
  const solvedCount = sc.probes.filter((_, i) => picked[`${sc.id}-${i}`] === verdictOf(sc.probes[i].p, C, r2)).length;

  function selectScenario(i: number) {
    setSid(i);
    setProbeIdx(0);
    setQ(SCENARIOS[i].probes[0].p);
  }
  function selectProbe(i: number) {
    setProbeIdx(i);
    setQ(sc.probes[i].p);
  }

  return (
    <div className="space-y-4">
      {/* 상황 카드 */}
      <div className="flex flex-wrap gap-1.5">
        {SCENARIOS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => selectScenario(i)}
            className={
              "rounded-xl border-2 px-3 py-2 text-xs font-bold transition " +
              (i === sid ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {s.emoji} {s.name}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-4 py-3">
        <p className="text-sm leading-6 text-slate-200">
          {sc.emoji} {sc.story}
        </p>
        <p className="mt-1 font-mono text-xs text-emerald-200">
          중심 {sc.centerName} ({nx(C.x)}, {nx(C.y)}) · 반지름 {sc.r} {sc.unit}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 그래프 */}
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          <Plane cid="birth-plane" svgRef={svgRef} label={`${sc.name} 범위와 테스트 지점`}>
            <Clipped cid="birth-plane">
              <CircleDraw c={C} r={sc.r} color="#34d399" fill="rgba(52,211,153,0.10)" width={3} />
              {/* 직각삼각형 */}
              <line x1={gx(C.x)} y1={gy(C.y)} x2={gx(Q.x)} y2={gy(C.y)} stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 3" />
              <line x1={gx(Q.x)} y1={gy(C.y)} x2={gx(Q.x)} y2={gy(Q.y)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3" />
              <line x1={gx(C.x)} y1={gy(C.y)} x2={gx(Q.x)} y2={gy(Q.y)} stroke={VERDICT_COLOR[verdict]} strokeWidth={3} />
              {Q.x !== C.x ? (
                <text x={(gx(C.x) + gx(Q.x)) / 2} y={gy(C.y) + (Q.y > C.y ? 13 : -6)} textAnchor="middle" className="fill-sky-300 font-mono text-[9px] font-bold">
                  |x−a| = {Math.abs(Q.x - C.x)}
                </text>
              ) : null}
              {Q.y !== C.y ? (
                <text x={gx(Q.x) + (Q.x >= C.x ? 5 : -5)} y={(gy(C.y) + gy(Q.y)) / 2 + 3} textAnchor={Q.x >= C.x ? "start" : "end"} className="fill-amber-300 font-mono text-[9px] font-bold">
                  |y−b| = {Math.abs(Q.y - C.y)}
                </text>
              ) : null}
            </Clipped>
            <Dot p={C} color="#f472b6" label={`${sc.centerName}(${nx(C.x)}, ${nx(C.y)})`} r={5} />
            <Dot p={Q} color={VERDICT_COLOR[verdict]} label={`(${nx(Q.x)}, ${nx(Q.y)})`} onDown={() => setDragId("Q")} />
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 색깔 점을 끌어 여기저기 확인해 보세요</p>
        </div>

        <div className="space-y-3">
          {/* 판정 */}
          <div
            className={
              "rounded-2xl border-2 p-4 " +
              (verdict === "in" ? "border-emerald-400/50 bg-emerald-400/10" : verdict === "on" ? "border-amber-400/50 bg-amber-400/10" : "border-rose-400/50 bg-rose-400/10")
            }
          >
            <p className="text-center text-lg font-extrabold text-white">
              {verdict === "in" ? sc.inLabel : verdict === "on" ? sc.onLabel : sc.outLabel}
            </p>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              <Katex expr="(x-a)^2 + (y-b)^2" /> 과 <Katex expr="r^2" /> 을 비교해요
            </p>
            <div className="mt-1 space-y-0.5">
              <FormulaLine label="왼쪽" tex={`(${Q.x} - (${C.x}))^2 + (${Q.y} - (${C.y}))^2 = ${lhs}`} />
              <FormulaLine label="오른쪽" tex={`${sc.r}^2 = ${r2}`} />
              <FormulaLine label="비교" tex={`${lhs} \\;${VERDICT_SIGN[verdict]}\\; ${r2}`} />
            </div>
            <p className="mt-1 text-center text-sm font-bold" style={{ color: VERDICT_COLOR[verdict] }}>
              → {VERDICT_LABEL[verdict]}
            </p>
          </div>

          {/* 예상 퀴즈 */}
          <div className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-violet-200">🔮 먼저 예상해 보기</p>
              <span className="rounded-full border border-violet-400/45 bg-violet-400/15 px-3 py-1 font-mono text-[11px] font-bold text-violet-100">
                {solvedCount} / {sc.probes.length}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sc.probes.map((pr, i) => {
                const key = `${sc.id}-${i}`;
                const done = picked[key] === verdictOf(pr.p, C, r2);
                return (
                  <button
                    key={pr.name}
                    type="button"
                    onClick={() => selectProbe(i)}
                    className={
                      "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                      (i === probeIdx ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                    }
                  >
                    {done ? "✅ " : ""}
                    {pr.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-sm text-slate-200">
              <b className="text-amber-200">{probe.name}</b> ({nx(probe.p.x)}, {nx(probe.p.y)}) 은(는) 어디에 있을까요?
            </p>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {(["in", "on", "out"] as Verdict[]).map((v) => {
                const state = !myPick ? "idle" : v === probeAnswer ? "right" : v === myPick ? "wrong" : "idle";
                return (
                  <button
                    key={v}
                    type="button"
                    disabled={myPick === probeAnswer}
                    onClick={() => setPicked((s) => ({ ...s, [probeKey]: v }))}
                    className={
                      "rounded-xl border-2 px-2 py-2 text-xs font-bold transition " +
                      (state === "right"
                        ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100"
                        : state === "wrong"
                          ? "border-rose-400/60 bg-rose-400/20 text-rose-100"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    {VERDICT_LABEL[v]}
                    {state === "right" ? " ✅" : state === "wrong" ? " ❌" : ""}
                  </button>
                );
              })}
            </div>
            {myPick ? (
              <p className={"mt-1.5 text-center text-xs font-bold " + (myPick === probeAnswer ? "text-emerald-200" : "text-rose-200")}>
                {myPick === probeAnswer ? "정답! 위 계산으로 확인해 보세요." : "다시 생각해 볼까요? 점을 끌어 계산을 살펴보세요."}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* 유도 */}
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">✨ 그래서 원의 방정식은 이렇게 태어나요</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <DeriveCard n="1" title="원의 뜻">중심에서 거리가 늘 r 인 점 P(x, y) 들의 모임</DeriveCard>
          <DeriveCard n="2" title="거리로 쓰기">
            <Katex expr="\overline{CP} = r" />
          </DeriveCard>
          <DeriveCard n="3" title="두 점 사이의 거리">
            <Katex expr="\sqrt{(x-a)^2 + (y-b)^2} = r" />
          </DeriveCard>
          <DeriveCard n="4" title="양변 제곱 → 표준형" highlight>
            <Katex expr="(x-a)^2 + (y-b)^2 = r^2" />
          </DeriveCard>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2">
            <p className="text-[11px] font-bold text-slate-400">지금 상황에 넣으면</p>
            <FormulaLine tex={circleTex(C.x, C.y, r2)} big />
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.08] px-3 py-2">
            <p className="text-[11px] font-bold text-amber-200">중심이 원점이면</p>
            <FormulaLine tex="x^2 + y^2 = r^2" big />
          </div>
        </div>
      </div>
    </div>
  );
}

function DeriveCard({ n, title, highlight, children }: { n: string; title: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <div className={"rounded-xl border px-3 py-2.5 " + (highlight ? "border-emerald-400/55 bg-emerald-400/15" : "border-white/10 bg-slate-950/50")}>
      <p className="text-[11px] font-bold text-slate-400">
        <span className={"mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] " + (highlight ? "bg-emerald-400/30 text-emerald-50" : "bg-white/10 text-slate-300")}>
          {n}
        </span>
        {title}
      </p>
      <div className="mt-1.5 py-1 text-[13px] leading-6 text-slate-100">{children}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 중심·반지름 ⇄ 방정식
// ══════════════════════════════════════════════════════════════
function QuizTab() {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);

  if (idx >= CIRCLE_QUIZ.length) {
    return (
      <div className="rounded-2xl border-2 border-emerald-400/45 bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 p-5 text-center">
        <p className="text-3xl">{score === CIRCLE_QUIZ.length ? "🏆" : score >= 6 ? "🎉" : "💪"}</p>
        <p className="mt-2 text-xl font-extrabold text-emerald-200">
          {score} / {CIRCLE_QUIZ.length} 문제 정답!
        </p>
        <p className="mt-2 text-sm text-slate-300">
          {score === CIRCLE_QUIZ.length ? "중심과 반지름을 자유자재로 읽어 내는군요! 이제 지름 문제에 도전해 볼까요? 🎯" : "부호와 r² 에 주의하며 한 번 더 도전해 보세요."}
        </p>
        <button
          type="button"
          onClick={() => {
            setIdx(0);
            setScore(0);
            setSolvedIds([]);
          }}
          className="mt-4 rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↻ 다시 풀기
        </button>
      </div>
    );
  }

  const q = CIRCLE_QUIZ[idx];
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            ⭕ 원 그리기 챌린지 · {idx + 1} / {CIRCLE_QUIZ.length}
          </p>
          <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 font-mono text-xs font-bold text-cyan-100">점수 {score}</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${(idx / CIRCLE_QUIZ.length) * 100}%` }} />
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {CIRCLE_QUIZ.map((z, i) => (
            <span
              key={z.id}
              className={
                "h-2 w-6 rounded-full " + (solvedIds.includes(z.id) ? "bg-emerald-400" : i === idx ? "bg-cyan-400" : i < idx ? "bg-rose-400/60" : "bg-white/10")
              }
            />
          ))}
        </div>
      </div>
      <CircleCard
        key={q.id}
        q={q}
        onDone={(correct) => {
          if (correct) {
            setScore((s) => s + 1);
            setSolvedIds((s) => [...s, q.id]);
          }
        }}
        onNext={() => setIdx((i) => i + 1)}
        last={idx + 1 === CIRCLE_QUIZ.length}
      />
    </div>
  );
}

function CircleCard({ q, onDone, onNext, last }: { q: CircleQ; onDone: (correct: boolean) => void; onNext: () => void; last: boolean }) {
  const [pick, setPick] = useState<number | null>(null);
  const [ax, setAx] = useState("");
  const [by, setBy] = useState("");
  const [ck, setCk] = useState(false);
  const [rPick, setRPick] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [firstTry, setFirstTry] = useState(true);

  const eqTex = circleTex(q.a, q.b, q.r2);
  const r = Math.sqrt(q.r2);

  const okA = isAns(ax, q.a);
  const okB = isAns(by, q.b);
  const okR = rPick === q.rAnswer;
  const cleared = q.kind === "toEq" ? pick === q.answer : okA && okB && okR;

  const doneRef = useRef(false);
  useEffect(() => {
    if (cleared && !doneRef.current) {
      doneRef.current = true;
      onDone(firstTry);
    }
  }, [cleared, firstTry, onDone]);

  return (
    <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
      <div>
        <Plane cid={`quiz-${q.id}`} label="정답 원" small>
          <Clipped cid={`quiz-${q.id}`}>
            {cleared ? (
              <>
                <CircleDraw c={{ x: q.a, y: q.b }} r={r} color="#34d399" fill="rgba(52,211,153,0.12)" width={3} />
                <line x1={gx(q.a)} y1={gy(q.b)} x2={gx(q.a + r)} y2={gy(q.b)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3" />
                <text x={gx(q.a + r / 2)} y={gy(q.b) - 6} textAnchor="middle" className="fill-amber-300 font-mono text-[10px] font-bold">
                  r = {radPlain(q.r2)}
                </text>
              </>
            ) : null}
          </Clipped>
          {cleared ? <Dot p={{ x: q.a, y: q.b }} color="#f472b6" label={`(${nx(q.a)}, ${nx(q.b)})`} r={5} /> : null}
        </Plane>
        <p className="mt-1 text-center text-[11px] text-slate-500">{cleared ? "🎉 원이 그려졌어요!" : "정답을 맞히면 원이 그려져요"}</p>
      </div>

      <div className="space-y-2">
        {q.kind === "toEq" ? (
          <>
            <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.07] px-4 py-3">
              <p className="text-xs font-bold text-cyan-200">중심과 반지름이 주어졌어요. 원의 방정식은?</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <Chip label="중심" value={`(${nx(q.a)}, ${nx(q.b)})`} tone="pink" />
                <Chip label="반지름" value={radPlain(q.r2)} tone="amber" />
              </div>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {q.choices!.map((c, i) => {
                const state = pick === null ? "idle" : i === q.answer ? "right" : i === pick ? "wrong" : "idle";
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={cleared}
                    onClick={() => {
                      if (i !== q.answer) setFirstTry(false);
                      setPick(i);
                    }}
                    className={
                      "rounded-xl border-2 px-3 py-2.5 text-center transition " +
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
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3">
              <p className="text-xs font-bold text-amber-200">이 원의 중심과 반지름을 찾아보세요.</p>
              <FormulaLine tex={eqTex} big />
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
              <p className="text-xs font-bold text-slate-400">중심의 좌표</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-base text-slate-100">
                <span>(</span>
                <Box value={ax} onChange={setAx} ok={okA} show={ck} disabled={cleared} label="중심의 x좌표" />
                <span>,</span>
                <Box value={by} onChange={setBy} ok={okB} show={ck} disabled={cleared} label="중심의 y좌표" />
                <span>)</span>
                {!(okA && okB) && !cleared ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCk(true);
                      if (!isAns(ax, q.a) || !isAns(by, q.b)) setFirstTry(false);
                    }}
                    className="rounded-lg border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/25"
                  >
                    확인
                  </button>
                ) : okA && okB ? (
                  <span>✅</span>
                ) : null}
              </div>
            </div>
            {okA && okB ? (
              <div className="rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
                <p className="text-xs font-bold text-slate-400">반지름의 길이</p>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {q.rChoices!.map((c, i) => {
                    const state = rPick === null ? "idle" : i === q.rAnswer ? "right" : i === rPick ? "wrong" : "idle";
                    return (
                      <button
                        key={c}
                        type="button"
                        disabled={cleared}
                        onClick={() => {
                          if (i !== q.rAnswer) setFirstTry(false);
                          setRPick(i);
                        }}
                        className={
                          "rounded-xl border-2 px-2 py-2 text-center transition " +
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
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setHint((v) => !v)}
            className="rounded-lg border border-amber-400/45 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-400/20"
          >
            💡 힌트
          </button>
        </div>
        {hint ? <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-100">💡 {q.hint}</p> : null}

        {cleared ? (
          <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-4 py-3">
            <p className="text-sm font-bold text-emerald-100">🎉 정답!</p>
            <FormulaLine tex={eqTex} big />
            <p className="mt-0.5 text-xs text-emerald-100/90">
              중심 ({nx(q.a)}, {nx(q.b)}) · 반지름 {radPlain(q.r2)} — 오른쪽 값은 r 이 아니라 <b>r²</b> 이라는 점을 기억하세요.
            </p>
            <button
              type="button"
              onClick={onNext}
              className="mt-2 rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-5 py-1.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
            >
              {last ? "결과 보기 🎉" : "다음 문제 →"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Chip({ label, value, tone }: { label: string; value: string; tone: "pink" | "amber" }) {
  const cls = tone === "pink" ? "border-pink-400/45 bg-pink-400/15 text-pink-100" : "border-amber-400/45 bg-amber-400/15 text-amber-100";
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 " + cls}>
      <span className="text-[10px] font-bold opacity-80">{label}</span>
      <span className="font-mono text-sm font-bold">{value}</span>
    </span>
  );
}

function Box({
  value,
  onChange,
  ok,
  show,
  disabled,
  label,
  width = "w-16",
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
// 탭 ③ 지름의 양 끝점
// ══════════════════════════════════════════════════════════════
function DiameterTab() {
  return (
    <div className="space-y-4">
      <DiameterSim />
      <DiameterQuizBlock />
    </div>
  );
}

function DiameterSim() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [A, setA] = useState<Pt>({ x: -3, y: -2 });
  const [B, setB] = useState<Pt>({ x: 3, y: 4 });
  const [theta, setTheta] = useState(0.9);
  const [showThales, setShowThales] = useState(false);
  const { setDragId } = useGridDrag(svgRef, (id, p) => (id === "A" ? setA(p) : setB(p)));

  const M = midpoint(A, B);
  const ab2 = dist2(A, B);
  const r2 = ab2 / 4;
  const r = Math.sqrt(r2);
  const P: Pt = { x: M.x + r * Math.cos(theta), y: M.y + r * Math.sin(theta) };
  const same = A.x === B.x && A.y === B.y;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.07] to-slate-900/40 p-3">
        <Plane cid="dia-plane" svgRef={svgRef} label="지름의 양 끝점으로 정해지는 원">
          <Clipped cid="dia-plane">
            {!same ? (
              <>
                <CircleDraw c={M} r={r} color="#a78bfa" fill="rgba(167,139,250,0.10)" width={3} />
                <line x1={gx(A.x)} y1={gy(A.y)} x2={gx(B.x)} y2={gy(B.y)} stroke="#fbbf24" strokeWidth={3} />
                {showThales ? (
                  <>
                    <line x1={gx(P.x)} y1={gy(P.y)} x2={gx(A.x)} y2={gy(A.y)} stroke="#34d399" strokeWidth={2} />
                    <line x1={gx(P.x)} y1={gy(P.y)} x2={gx(B.x)} y2={gy(B.y)} stroke="#34d399" strokeWidth={2} />
                  </>
                ) : null}
              </>
            ) : null}
          </Clipped>
          {!same ? (
            <>
              {showThales ? <Dot p={P} color="#34d399" label={`P`} r={5} /> : null}
              <Dot p={M} color="#f472b6" label={`중심(${nx(M.x)}, ${nx(M.y)})`} r={5} />
            </>
          ) : null}
          <Dot p={A} color="#22d3ee" label={`A(${nx(A.x)}, ${nx(A.y)})`} onDown={() => setDragId("A")} />
          <Dot p={B} color="#22d3ee" label={`B(${nx(B.x)}, ${nx(B.y)})`} onDown={() => setDragId("B")} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 지름의 양 끝점 A, B를 끌어 보세요</p>
      </div>

      <div className="space-y-3">
        {same ? (
          <p className="rounded-2xl border border-rose-400/35 bg-rose-400/[0.08] px-4 py-3 text-sm font-bold text-rose-100">
            ⚠️ 두 점이 겹쳤어요. 지름이 되려면 서로 다른 두 점이어야 해요.
          </p>
        ) : (
          <>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
              <p className="text-sm font-bold text-slate-100">🔧 지름 → 원의 방정식</p>
              <div className="mt-2 space-y-0.5">
                <FormulaLine label="중심" tex={`\\left(\\frac{${A.x} + (${B.x})}{2},\\ \\frac{${A.y} + (${B.y})}{2}\\right) = (${M.x},\\ ${M.y})`} />
                <FormulaLine label="지름²" tex={`(${B.x} - (${A.x}))^2 + (${B.y} - (${A.y}))^2 = ${ab2}`} />
                <FormulaLine label="반지름²" tex={`\\frac{${ab2}}{4} = ${r2}`} />
              </div>
              <div className="mt-2 rounded-xl border border-emerald-400/45 bg-emerald-400/15 px-3 py-2">
                <FormulaLine tex={circleTex(M.x, M.y, r2)} big />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                반지름 r = {radPlain(r2)} {Number.isInteger(r) ? "" : `≈ ${r.toFixed(2)}`}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-emerald-200">🧭 보너스 — 지름을 바라보는 각</p>
                <button
                  type="button"
                  onClick={() => setShowThales((v) => !v)}
                  className={
                    "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                    (showThales ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  {showThales ? "숨기기" : "확인하기"}
                </button>
              </div>
              {showThales ? (
                <>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    원 위의 점 P를 돌려 보세요. <b className="text-emerald-200">∠APB 는 언제나 90°</b> 예요! (지름에 대한 원주각)
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={628}
                    step={1}
                    value={Math.round(theta * 100)}
                    aria-label="원 위의 점 P의 위치"
                    onChange={(e) => setTheta(Number(e.target.value) / 100)}
                    className="mt-2 h-1.5 w-full accent-emerald-400"
                  />
                  <p className="mt-1 text-center font-mono text-sm font-bold text-emerald-200">∠APB = 90°</p>
                </>
              ) : (
                <p className="mt-1 text-xs text-slate-400">원 위의 점에서 지름의 양 끝을 바라보면 각이 몇 도일까요? 버튼을 눌러 확인해 보세요.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DiameterQuizBlock() {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const q = DIAMETER_QUIZ[idx];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-100">🎯 지름 문제 도전</p>
        <span className="rounded-full border border-violet-400/45 bg-violet-400/15 px-3 py-1 font-mono text-xs font-bold text-violet-100">
          해결 {solved.size} / {DIAMETER_QUIZ.length}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {DIAMETER_QUIZ.map((z, i) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setIdx(i)}
            className={
              "rounded-lg border px-3 py-1 text-xs font-bold transition " +
              (i === idx ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {solved.has(z.id) ? "✅ " : ""}문제 {i + 1}
          </button>
        ))}
      </div>
      <DiameterCard key={q.id} q={q} onSolved={() => setSolved((s) => new Set(s).add(q.id))} />
    </div>
  );
}

function DiameterCard({ q, onSolved }: { q: DiameterQ; onSolved: () => void }) {
  const [mx, setMx] = useState("");
  const [my, setMy] = useState("");
  const [ab, setAb] = useState("");
  const [r2In, setR2In] = useState("");
  const [ck, setCk] = useState({ a: false, b: false, c: false });
  const [pick, setPick] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const M = midpoint(q.A, q.B);
  const ab2 = dist2(q.A, q.B);
  const r2 = ab2 / 4;
  const r = Math.sqrt(r2);

  const okM = isAns(mx, M.x) && isAns(my, M.y);
  const okAb = isAns(ab, ab2);
  const okR2 = isAns(r2In, r2);
  const okEq = pick === q.answer;
  const cleared = okM && okAb && okR2 && okEq;
  const shown = cleared || gaveUp;

  const solvedRef = useRef(false);
  useEffect(() => {
    if (cleared && !solvedRef.current) {
      solvedRef.current = true;
      onSolved();
    }
  }, [cleared, onSolved]);

  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-[300px_1fr]">
      <div>
        <Plane cid={`dq-${q.id}`} label="지름의 양 끝점" small>
          <Clipped cid={`dq-${q.id}`}>
            {shown ? <CircleDraw c={M} r={r} color="#a78bfa" fill="rgba(167,139,250,0.12)" width={3} /> : null}
            <line x1={gx(q.A.x)} y1={gy(q.A.y)} x2={gx(q.B.x)} y2={gy(q.B.y)} stroke="#fbbf24" strokeWidth={3} />
          </Clipped>
          {shown ? <Dot p={M} color="#f472b6" label={`(${nx(M.x)}, ${nx(M.y)})`} r={5} /> : null}
          <Dot p={q.A} color="#22d3ee" label={`A(${nx(q.A.x)}, ${nx(q.A.y)})`} />
          <Dot p={q.B} color="#22d3ee" label={`B(${nx(q.B.x)}, ${nx(q.B.y)})`} />
        </Plane>
        <p className="mt-1 text-center text-[11px] text-slate-500">{shown ? "🎉 원이 완성됐어요!" : "노란 선분이 지름이에요"}</p>
      </div>

      <div className="space-y-2">
        <div className="rounded-xl border border-violet-400/25 bg-violet-400/[0.07] px-4 py-3">
          <p className="text-xs font-bold text-violet-200">두 점을 지름의 양 끝점으로 하는 원의 방정식을 구하세요.</p>
          <FormulaLine tex={`A(${q.A.x},\\ ${q.A.y}),\\qquad B(${q.B.x},\\ ${q.B.y})`} />
        </div>

        <MiniStep n="1" title="중심 = 두 점의 중점" done={okM}>
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-base text-slate-100">
            <span>(</span>
            <Box value={mx} onChange={setMx} ok={isAns(mx, M.x)} show={ck.a} disabled={shown} label="중심의 x좌표" />
            <span>,</span>
            <Box value={my} onChange={setMy} ok={isAns(my, M.y)} show={ck.a} disabled={shown} label="중심의 y좌표" />
            <span>)</span>
            {!okM && !shown ? <CheckBtn onClick={() => setCk((v) => ({ ...v, a: true }))} /> : okM ? <span>✅</span> : null}
          </div>
        </MiniStep>

        {okM || shown ? (
          <MiniStep n="2" title="지름의 길이의 제곱" done={okAb}>
            <div className="flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
              <span className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={`(${q.B.x} - (${q.A.x}))^2 + (${q.B.y} - (${q.A.y}))^2 =`} />
              </span>
              <Box value={ab} onChange={setAb} ok={okAb} show={ck.b} disabled={shown} label="지름의 제곱" />
              {!okAb && !shown ? <CheckBtn onClick={() => setCk((v) => ({ ...v, b: true }))} /> : okAb ? <span>✅</span> : null}
            </div>
          </MiniStep>
        ) : null}

        {(okM && okAb) || shown ? (
          <MiniStep n="3" title="반지름의 제곱 (지름²의 ¼)" done={okR2}>
            <div className="flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
              <span className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={`\\frac{${ab2}}{4} =`} />
              </span>
              <Box value={r2In} onChange={setR2In} ok={okR2} show={ck.c} disabled={shown} label="반지름의 제곱" />
              {!okR2 && !shown ? <CheckBtn onClick={() => setCk((v) => ({ ...v, c: true }))} /> : okR2 ? <span>✅</span> : null}
            </div>
          </MiniStep>
        ) : null}

        {(okM && okAb && okR2) || shown ? (
          <MiniStep n="4" title="원의 방정식" done={okEq}>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {q.choices.map((c, i) => {
                const state = pick === null ? "idle" : i === q.answer ? "right" : i === pick ? "wrong" : "idle";
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={okEq || shown}
                    onClick={() => setPick(i)}
                    className={
                      "rounded-xl border-2 px-3 py-2 text-center transition " +
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
                  </button>
                );
              })}
            </div>
          </MiniStep>
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
        {hint ? <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-100">💡 {q.hint}</p> : null}

        {shown ? (
          <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-4 py-3">
            <p className="text-sm font-bold text-emerald-100">{cleared ? "🎉 정답!" : "📖 풀이"}</p>
            <FormulaLine tex={circleTex(M.x, M.y, r2)} big />
            <p className="mt-0.5 text-xs text-emerald-100/90">
              중심 ({nx(M.x)}, {nx(M.y)}) · 반지름 {radPlain(r2)} — 지름의 길이를 반으로 나눈 값이에요.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MiniStep({ n, title, done, children }: { n: string; title: string; done: boolean; children: React.ReactNode }) {
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
