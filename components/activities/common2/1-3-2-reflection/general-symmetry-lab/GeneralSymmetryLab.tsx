"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  BASE_TRI,
  CASES,
  FIG_QS,
  LAB_CIRCLE,
  LINE_QS,
  PT_QS,
  SUMMARY,
  caseImage,
  circleTex,
  fmt,
  footOn,
  isCenterOf,
  isMirrorOf,
  lineSym,
  lineTex,
  lineThrough,
  midPt,
  nz,
  pointSym,
  ptTex,
  type Case,
  type FigQ,
  type Line,
  type LineQ,
  type Pt,
  type PtQ,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "point_center",
    prompt:
      "점 (a, b)에 대한 대칭점이 (2a − x, 2b − y)가 되는 까닭을 ‘중점’이라는 말을 써서 설명해 보세요. 공식을 외우지 않고도 만들어 낼 수 있나요?",
    kind: "text",
    placeholder:
      "예: (a, b)가 PP′의 중점이므로 (x + x′)/2 = a 이고 (y + y′)/2 = b 이다. 각각을 x′, y′에 대해 풀면 x′ = 2a − x, y′ = 2b − y 가 된다. 중점 조건 하나만 기억하면 공식은 그때그때 만들 수 있다.",
  },
  {
    id: "line_two_steps",
    prompt:
      "직선에 대한 대칭점을 찾을 때 교과서의 복잡한 일반식 대신 어떤 두 걸음을 썼나요? 그 방법이 왜 통하는지도 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: ① P에서 직선에 내린 수선의 발 H를 구하고 ② P′ = 2H − P 로 계산했다. 직선이 PP′를 수직이등분하므로 H가 곧 PP′의 중점이고, 중점 공식을 거꾸로 쓰면 P′를 얻을 수 있기 때문이다.",
  },
  {
    id: "detective",
    prompt:
      "탭③에서 점대칭인지 선대칭인지 어떻게 알아냈나요? 그리고 대칭의 중심이나 거울을 찾는 데 쓴 방법을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 대응하는 점끼리 이어 보니 세 선분이 한 점에서 만나면 점대칭, 서로 나란하면 선대칭이었다. 점대칭에서는 대응점의 중점이 곧 중심이었고, 선대칭에서는 대응점을 잇는 선분의 수직이등분선이 거울이었다.",
  },
];

// ─── 좌표평면 ─────────────────────────────────────────────────
const PAD = 26;
const SPAN = 360;
const VB = SPAN + PAD * 2;

type View = { half: number; step: number; u: number; sx: (v: number) => number; sy: (v: number) => number };

function makeView(half: number): View {
  const u = SPAN / (2 * half);
  const step = half <= 6 ? 1 : half <= 10 ? 2 : 4;
  return { half, step, u, sx: (v) => PAD + (v + half) * u, sy: (v) => PAD + (half - v) * u };
}

function Grid({ view }: { view: View }) {
  const lines: number[] = [];
  for (let v = -view.half; v <= view.half; v += view.step) lines.push(v);
  return (
    <g>
      {lines.map((v) => (
        <line key={`vx${v}`} x1={view.sx(v)} y1={view.sy(view.half)} x2={view.sx(v)} y2={view.sy(-view.half)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      ))}
      {lines.map((v) => (
        <line key={`hy${v}`} x1={view.sx(-view.half)} y1={view.sy(v)} x2={view.sx(view.half)} y2={view.sy(v)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      ))}
      <line x1={view.sx(-view.half)} y1={view.sy(0)} x2={view.sx(view.half)} y2={view.sy(0)} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
      <line x1={view.sx(0)} y1={view.sy(-view.half)} x2={view.sx(0)} y2={view.sy(view.half)} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
      {lines
        .filter((v) => v !== 0)
        .map((v) => (
          <text key={`tx${v}`} x={view.sx(v)} y={view.sy(0) + 12} textAnchor="middle" className="fill-slate-500 font-mono text-[8px]">
            {v}
          </text>
        ))}
      {lines
        .filter((v) => v !== 0)
        .map((v) => (
          <text key={`ty${v}`} x={view.sx(0) - 5} y={view.sy(v) + 3} textAnchor="end" className="fill-slate-500 font-mono text-[8px]">
            {v}
          </text>
        ))}
      <text x={view.sx(view.half) - 2} y={view.sy(0) - 6} textAnchor="end" className="fill-slate-400 text-[10px] italic">
        x
      </text>
      <text x={view.sx(0) + 8} y={view.sy(view.half) + 8} className="fill-slate-400 text-[10px] italic">
        y
      </text>
    </g>
  );
}

function Plane({ cid, view, svgRef, label, children }: { cid: string; view: View; svgRef?: React.Ref<SVGSVGElement>; label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg ref={svgRef} viewBox={`0 0 ${VB} ${VB}`} className="mx-auto block w-full max-w-[440px] touch-none select-none" role="img" aria-label={label}>
        <defs>
          <clipPath id={cid}>
            <rect x={PAD} y={PAD} width={SPAN} height={SPAN} />
          </clipPath>
        </defs>
        <Grid view={view} />
        {children}
      </svg>
    </div>
  );
}

function Clipped({ cid, children }: { cid: string; children: React.ReactNode }) {
  return <g clipPath={`url(#${cid})`}>{children}</g>;
}

function LineDraw({ view, L, color, width = 3, dash }: { view: View; L: Line; color: string; width?: number; dash?: string }) {
  if (L.a === 0 && L.b === 0) return null;
  const M = view.half + 6;
  let p: [number, number, number, number];
  if (L.b === 0) {
    const x = -L.c / L.a;
    p = [view.sx(x), view.sy(M), view.sx(x), view.sy(-M)];
  } else {
    const yAt = (x: number) => (-L.a * x - L.c) / L.b;
    p = [view.sx(-M), view.sy(yAt(-M)), view.sx(M), view.sy(yAt(M))];
  }
  return <line x1={p[0]} y1={p[1]} x2={p[2]} y2={p[3]} stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" />;
}

function Dot({ view, p, color, label, onDown, r = 6 }: { view: View; p: Pt; color: string; label?: string; onDown?: () => void; r?: number }) {
  return (
    <g
      className={onDown ? "cursor-grab touch-none" : undefined}
      onPointerDown={
        onDown
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              onDown();
            }
          : undefined
      }
    >
      {onDown ? <circle cx={view.sx(p.x)} cy={view.sy(p.y)} r={17} fill="transparent" /> : null}
      <circle cx={view.sx(p.x)} cy={view.sy(p.y)} r={r} fill={color} stroke="#0f172a" strokeWidth={2} />
      {label ? (
        <text x={view.sx(p.x)} y={view.sy(p.y) - 12} textAnchor="middle" className="fill-white font-mono text-[10px] font-bold">
          {label}
        </text>
      ) : null}
    </g>
  );
}

function Ticks({ view, A, B, color }: { view: View; A: Pt; B: Pt; color: string }) {
  const x1 = view.sx(A.x);
  const y1 = view.sy(A.y);
  const x2 = view.sx(B.x);
  const y2 = view.sy(B.y);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 10) return null;
  const nx = -dy / len;
  const ny = dx / len;
  const S = 5;
  return (
    <g>
      {[0.3, 0.7].map((t) => {
        const cx = x1 + dx * t;
        const cy = y1 + dy * t;
        return <line key={t} x1={cx - nx * S} y1={cy - ny * S} x2={cx + nx * S} y2={cy + ny * S} stroke={color} strokeWidth={2.5} />;
      })}
    </g>
  );
}

function RightAngle({ view, H, L, size = 10 }: { view: View; H: Pt; L: Line; size?: number }) {
  const len = Math.hypot(L.a, L.b);
  if (len === 0) return null;
  const t1 = { x: -L.b / len, y: L.a / len };
  const t2 = { x: L.a / len, y: -L.b / len };
  const hx = view.sx(H.x);
  const hy = view.sy(H.y);
  const p = (a: number, b: number) => `${hx + t1.x * a + t2.x * b},${hy + t1.y * a + t2.y * b}`;
  return <path d={`M${p(size, 0)} L${p(size, size)} L${p(0, size)}`} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />;
}

function Tri({ view, pts, fill, stroke, width = 3, dash }: { view: View; pts: Pt[]; fill: string; stroke: string; width?: number; dash?: string }) {
  return <polygon points={pts.map((p) => `${view.sx(p.x)},${view.sy(p.y)}`).join(" ")} fill={fill} stroke={stroke} strokeWidth={width} strokeDasharray={dash} strokeLinejoin="round" />;
}

function useDrag(svgRef: React.RefObject<SVGSVGElement | null>, view: View, onDrag: (id: string, p: Pt) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const cb = useRef(onDrag);
  const vw = useRef(view);
  useEffect(() => {
    cb.current = onDrag;
    vw.current = view;
  });
  useEffect(() => {
    if (!dragId) return;
    function move(e: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const px = (e.clientX - rect.left) * (VB / rect.width);
      const py = (e.clientY - rect.top) * (VB / rect.height);
      const v = vw.current;
      cb.current(dragId as string, { x: (px - PAD) / v.u - v.half, y: v.half - (py - PAD) / v.u });
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

function clampInt(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}
function snap(p: Pt, lo = -6, hi = 6): Pt {
  return { x: clampInt(p.x, lo, hi), y: clampInt(p.y, lo, hi) };
}

// ─── 공통 UI ──────────────────────────────────────────────────
function FormulaLine({ tex, label, big }: { tex: string; label?: string; big?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      {label ? <span className="w-16 shrink-0 text-[10px] font-bold text-slate-400">{label}</span> : null}
      <span className={"min-w-0 flex-1 overflow-x-auto overflow-y-hidden py-1 text-slate-100 " + (big ? "text-lg" : "")}>
        <Katex expr={tex} />
      </span>
    </div>
  );
}

function Slider({ label, value, min, max, onChange, accent }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; accent: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400">{label}</span>
        <span className="font-mono text-xs font-bold text-slate-100">{nz(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} className={"mt-1 h-1.5 w-full " + accent} />
    </div>
  );
}

/** KaTeX 안에서 음수는 괄호로 감싼다 (2 · -2 처럼 붙지 않게) */
function pn(v: number): string {
  return v < 0 ? `(${v})` : String(v);
}
/** KaTeX 안에 넣을 소수 (유니코드 − 대신 ASCII 하이픈, −0.00 방지) */
function tn(v: number): string {
  const r = Math.round(v * 100) / 100;
  return String(Object.is(r, -0) || r === 0 ? 0 : r);
}
/** 음수면 괄호를 씌운 tn */
function ptn(v: number): string {
  return v < 0 ? `(${tn(v)})` : tn(v);
}

/**
 * 중점 조건 → 대칭점 을 등호에 맞춰 세 줄로 조판한다.
 * 좁은 칸에서 브라우저가 아무 데서나 줄을 끊지 않도록 KaTeX 의 aligned 를 쓴다.
 */
function alignedSolve(name: string, p: number, o: number, q: number): string {
  const v = `${name}'`;
  return [
    "\\begin{aligned}",
    `\\frac{${pn(p)} + ${v}}{2} &= ${pn(o)} \\\\[2pt]`,
    `${v} &= 2 \\cdot ${pn(o)} - ${pn(p)} \\\\[2pt]`,
    `&= ${q}`,
    "\\end{aligned}",
  ].join(" ");
}

function parseNum(s: string): number | null {
  const t = s.trim().replace(/−/g, "-");
  if (t === "" || t === "-") return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}

function NumBox({ value, onChange, ok, label }: { value: string; onChange: (v: string) => void; ok: boolean | null; label: string }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className={
        "w-16 rounded-lg border-2 bg-slate-950 px-2 py-1 text-center font-mono text-sm font-bold text-white outline-none transition " +
        (ok === true ? "border-emerald-400/70 bg-emerald-400/10" : ok === false ? "border-rose-400/60" : "border-white/15 focus:border-cyan-400/60")
      }
    />
  );
}

function Step({ n, title, state, children }: { n: number; title: string; state: "locked" | "open" | "done"; children?: React.ReactNode }) {
  return (
    <div
      className={
        "rounded-xl border p-3 transition " +
        (state === "done" ? "border-emerald-400/45 bg-emerald-400/[0.08]" : state === "open" ? "border-cyan-400/40 bg-cyan-400/[0.06]" : "border-white/10 bg-slate-900/40 opacity-45")
      }
    >
      <p className="flex items-center gap-2 text-xs font-bold text-slate-200">
        <span className={"inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold " + (state === "done" ? "bg-emerald-400/30 text-emerald-100" : "bg-white/10 text-slate-300")}>
          {state === "done" ? "✓" : n}
        </span>
        {title}
      </p>
      {state !== "locked" ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

function Chips({ ids, cur, done, onPick }: { ids: string[]; cur: number; done: string[]; onPick: (i: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ids.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => onPick(i)}
          className={
            "h-8 min-w-[2rem] rounded-lg border-2 px-1.5 font-mono text-xs font-bold transition " +
            (i === cur ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100" : done.includes(id) ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
          }
        >
          {done.includes(id) && i !== cur ? "✓" : i + 1}
        </button>
      ))}
      <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300">
        {done.length} / {ids.length}
      </span>
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "point" | "line" | "game";

export default function GeneralSymmetryLab() {
  const [tab, setTab] = useState<Tab>("point");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🧭 점대칭·선대칭의 일반화</h3>
        <p className="mt-2 leading-7 text-slate-300">
          기준이 원점이나 x축이 아니어도 괜찮아요. <b className="text-violet-200">중점</b> 하나와 <b className="text-emerald-200">수선의 발</b> 하나면 어떤 대칭이든 만들어 낼 수 있습니다
          — 복잡한 공식은 외우지 않아도 돼요!
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "point"} onClick={() => setTab("point")}>
          ① 점 (a, b) 대칭 🔘
        </TabButton>
        <TabButton active={tab === "line"} onClick={() => setTab("line")}>
          ② 직선 l 대칭 📏
        </TabButton>
        <TabButton active={tab === "game"} onClick={() => setTab("game")}>
          ③ 탐정 게임 🔎
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "point" ? <PointTab /> : null}
        {tab === "line" ? <LineTab /> : null}
        {tab === "game" ? <GameTab /> : null}
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
// 탭 ① 점 (a, b) 에 대한 대칭
// ══════════════════════════════════════════════════════════════
function PointTab() {
  const [qi, setQi] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const [fi, setFi] = useState(0);
  const [fsolved, setFsolved] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <PointPlay />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔘 점의 대칭점 구하기</p>
          <Chips ids={PT_QS.map((q) => q.id)} cur={qi} done={solved} onPick={setQi} />
        </div>
      </div>

      <PtOne key={PT_QS[qi].id} q={PT_QS[qi]} onSolved={() => setSolved((s) => (s.includes(PT_QS[qi].id) ? s : [...s, PT_QS[qi].id]))} />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧩 도형은 x, y 자리에 그대로 넣기</p>
          <Chips ids={FIG_QS.map((q) => q.id)} cur={fi} done={fsolved} onPick={setFi} />
        </div>
        <div className="mt-2 overflow-x-auto overflow-y-hidden py-1 text-center text-slate-100">
          <Katex expr="f(x,\, y) = 0 \;\longrightarrow\; f(2a - x,\; 2b - y) = 0" />
        </div>
      </div>

      <FigOne key={FIG_QS[fi].id} q={FIG_QS[fi]} onSolved={() => setFsolved((s) => (s.includes(FIG_QS[fi].id) ? s : [...s, FIG_QS[fi].id]))} />
    </div>
  );
}

function PointPlay() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [O, setO] = useState<Pt>({ x: 2, y: 1 });
  const [P, setP] = useState<Pt>({ x: -2, y: -2 });
  const [showCircle, setShowCircle] = useState(false);

  const view = makeView(8);
  const { setDragId } = useDrag(svgRef, view, (id, p) => {
    if (id === "O") setO(snap(p, -5, 5));
    else setP(snap(p, -6, 6));
  });

  const Q = pointSym(P, O);
  const c2 = { x: 2 * O.x - LAB_CIRCLE.p, y: 2 * O.y - LAB_CIRCLE.q };
  const r = Math.sqrt(LAB_CIRCLE.r2);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid="ps-play" view={view} svgRef={svgRef} label="점 (a, b) 에 대한 점대칭">
          <Clipped cid="ps-play">
            {showCircle ? (
              <>
                <circle cx={view.sx(LAB_CIRCLE.p)} cy={view.sy(LAB_CIRCLE.q)} r={r * view.u} fill="rgba(148,163,184,0.10)" stroke="#94a3b8" strokeWidth={2.5} strokeDasharray="5 4" />
                <circle cx={view.sx(c2.x)} cy={view.sy(c2.y)} r={r * view.u} fill="rgba(167,139,250,0.14)" stroke="#a78bfa" strokeWidth={3} />
              </>
            ) : null}
            <line x1={view.sx(P.x)} y1={view.sy(P.y)} x2={view.sx(Q.x)} y2={view.sy(Q.y)} stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="6 4" />
            <Ticks view={view} A={P} B={O} color="#fbbf24" />
            <Ticks view={view} A={O} B={Q} color="#fbbf24" />
          </Clipped>
          <Dot view={view} p={Q} color="#a78bfa" r={7} label={`P′(${nz(Q.x)}, ${nz(Q.y)})`} />
          <Dot view={view} p={O} color="#fbbf24" r={7} label={`O(${nz(O.x)}, ${nz(O.y)})`} onDown={() => setDragId("O")} />
          <Dot view={view} p={P} color="#e2e8f0" r={7} label={`P(${nz(P.x)}, ${nz(P.y)})`} onDown={() => setDragId("P")} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 노란 점 O(기준)와 흰 점 P 를 각각 끌어 보세요</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-violet-400/50 bg-violet-400/12 p-4">
          <p className="text-center text-[11px] font-bold text-slate-300">기준점 O 가 PP′ 의 중점!</p>
          <div className="mt-2 space-y-2">
            {[
              { key: "x", tex: alignedSolve("x", P.x, O.x, Q.x) },
              { key: "y", tex: alignedSolve("y", P.y, O.y, Q.y) },
            ].map((r) => (
              <div key={r.key} className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-2">
                <span className="w-10 shrink-0 text-[10px] font-bold text-slate-400">{r.key} 좌표</span>
                <span className="min-w-0 flex-1 py-1 text-slate-100">
                  <Katex expr={r.tex} />
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-xl border border-violet-400/45 bg-violet-400/15 px-3 py-2 text-center text-lg text-white">
            <Katex expr={`\\text{P}'(${Q.x},\\; ${Q.y})`} />
          </div>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-xs leading-7 text-violet-100">
            외울 것은 <b className="text-white">중점 하나</b>뿐! 여기서{" "}
            <span className="mx-0.5 align-middle text-white">
              <Katex expr="(2a - x,\; 2b - y)" />
            </span>{" "}
            가 저절로 나와요.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <button
            type="button"
            onClick={() => setShowCircle((v) => !v)}
            className="w-full rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-3 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
          >
            {showCircle ? "원 숨기기" : "⭕ 도형도 함께 옮겨 보기"}
          </button>
          {showCircle ? (
            <div className="mt-2 space-y-0.5">
              <FormulaLine label="원본" tex={circleTex(LAB_CIRCLE.p, LAB_CIRCLE.q, LAB_CIRCLE.r2)} />
              <FormulaLine label="옮긴 뒤" tex={circleTex(c2.x, c2.y, LAB_CIRCLE.r2)} big />
              <p className="pt-1 text-[11px] leading-5 text-slate-400">
                중심 ({nz(LAB_CIRCLE.p)}, {nz(LAB_CIRCLE.q)}) 만 점대칭시키면 끝 — 반지름은 그대로예요.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-center text-[11px] text-slate-400">도형도 점 하나하나가 같은 규칙으로 옮겨져요</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PtOne({ q, onSolved }: { q: PtQ; onSolved: () => void }) {
  const [i1, setI1] = useState("");
  const [i2, setI2] = useState("");
  const [hint, setHint] = useState(false);

  const ok1 = i1 === "" ? null : parseNum(i1) === q.ans.x;
  const ok2 = i2 === "" ? null : parseNum(i2) === q.ans.y;
  const done = ok1 === true && ok2 === true;

  const doneRef = useRef(false);
  useEffect(() => {
    if (done && !doneRef.current) {
      doneRef.current = true;
      onSolved();
    }
  });

  const view = makeView(8);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
          <p className="text-xs font-bold text-cyan-200">문제 — 점 P 를 점 O 에 대하여 대칭이동한 점은?</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label="점" tex={`\\text{P}${ptTex(q.P)}`} />
            <FormulaLine label="기준" tex={`\\text{O}${ptTex(q.O)}`} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-slate-200">
            <span className="font-mono text-sm">P′ =</span>
            <span className="font-mono text-lg">(</span>
            <NumBox value={i1} onChange={setI1} ok={ok1} label="x좌표" />
            <span className="font-mono text-lg">,</span>
            <NumBox value={i2} onChange={setI2} ok={ok2} label="y좌표" />
            <span className="font-mono text-lg">)</span>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setHint((v) => !v)}
              className="rounded-lg border border-amber-400/45 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
            >
              💡 힌트
            </button>
          </div>
          {hint ? (
            <div className="mt-2 overflow-x-auto overflow-y-hidden rounded-lg bg-amber-400/12 px-3 py-2 text-[12px] text-amber-100">
              <Katex expr={`\\frac{${q.P.x} + x'}{2} = ${q.O.x}, \\quad \\frac{${q.P.y} + y'}{2} = ${q.O.y}`} />
            </div>
          ) : null}
        </div>
      </div>

      <div>
        {done ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-3">
            <Plane cid={`ptq-${q.id}`} view={view} label="풀이">
              <Clipped cid={`ptq-${q.id}`}>
                <line x1={view.sx(q.P.x)} y1={view.sy(q.P.y)} x2={view.sx(q.ans.x)} y2={view.sy(q.ans.y)} stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="6 4" />
                <Ticks view={view} A={q.P} B={q.O} color="#fbbf24" />
                <Ticks view={view} A={q.O} B={q.ans} color="#fbbf24" />
              </Clipped>
              <Dot view={view} p={q.ans} color="#a78bfa" r={7} label={`P′${ptTex(q.ans)}`} />
              <Dot view={view} p={q.O} color="#fbbf24" r={6} label={`O${ptTex(q.O)}`} />
              <Dot view={view} p={q.P} color="#e2e8f0" r={6} label={`P${ptTex(q.P)}`} />
            </Plane>
            <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
              O 가 PP′ 의 중점 — 두 선분의 길이가 같죠? <b>(2a − x, 2b − y)</b> 를 그대로 계산해도 같은 답이에요.
            </p>
          </div>
        ) : (
          <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-slate-950/60 p-6">
            <p className="whitespace-pre-line text-center text-xs leading-6 text-slate-500">{"🔒 두 칸을 모두 맞히면\n그림과 풀이가 열려요"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FigOne({ q, onSolved }: { q: FigQ; onSolved: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const ok = pick === q.ans;

  return (
    <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
      <div className="space-y-0.5">
        <FormulaLine label="도형" tex={q.tex} big />
        <FormulaLine label="기준" tex={`\\text{O}${ptTex(q.O)}`} />
      </div>
      <div className="mt-2 grid gap-1.5">
        {q.choices.map((c, i) => {
          const on = pick === i;
          const good = pick !== null && i === q.ans;
          const bad = on && i !== q.ans;
          return (
            <button
              key={c}
              type="button"
              onClick={() => {
                setPick(i);
                if (i === q.ans) onSolved();
              }}
              disabled={ok}
              className={
                "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left transition disabled:cursor-default " +
                (good ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : bad ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/30 font-mono text-[11px] font-bold">{"①②③④"[i]}</span>
              <span className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap py-1">
                <Katex expr={c} />
              </span>
            </button>
          );
        })}
      </div>
      {ok ? <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-[11px] leading-5 text-emerald-100">✅ {q.tip}</p> : null}
      {pick !== null && !ok ? <p className="mt-1.5 text-[11px] font-bold text-rose-200">x 자리에 2a − x, y 자리에 2b − y 를 넣어 보세요!</p> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 직선 l 에 대한 대칭
// ══════════════════════════════════════════════════════════════
function LineTab() {
  const [qi, setQi] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <LinePlay />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">📏 두 걸음으로 대칭점 찾기</p>
          <Chips ids={LINE_QS.map((q) => q.id)} cur={qi} done={solved} onPick={setQi} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-400/35 bg-emerald-400/[0.08] px-3 py-2">
            <p className="text-[11px] font-bold text-emerald-200">1걸음 — 수선의 발 H</p>
            <p className="mt-1 text-xs leading-6 text-slate-200">P 에서 직선 l 에 수직으로 내려 닿는 점</p>
          </div>
          <div className="rounded-xl border border-violet-400/35 bg-violet-400/[0.08] px-3 py-2">
            <p className="text-[11px] font-bold text-violet-200">2걸음 — 한 번 더 가기</p>
            <div className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-slate-100">
              <Katex expr="\text{P}' = 2\text{H} - \text{P}" />
            </div>
          </div>
        </div>
      </div>

      <LineOne key={LINE_QS[qi].id} q={LINE_QS[qi]} onSolved={() => setSolved((s) => (s.includes(LINE_QS[qi].id) ? s : [...s, LINE_QS[qi].id]))} />
    </div>
  );
}

function LinePlay() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [c, setC] = useState(-2);
  const [P, setP] = useState<Pt>({ x: -2, y: -3 });
  const [open, setOpen] = useState(false);

  const L: Line = a === 0 && b === 0 ? { a: 1, b: 0, c } : { a, b, c };
  const view = makeView(8);
  const { setDragId } = useDrag(svgRef, view, (_id, p) => setP(snap(p, -6, 6)));

  const H = footOn(L, P);
  const Q = lineSym(P, L);
  const M = midPt(P, Q);
  const chk1 = L.a * M.x + L.b * M.y + L.c;
  const dx = Q.x - P.x;
  const dy = Q.y - P.y;
  const degen = Math.hypot(dx, dy) < 1e-9; // P 가 이미 l 위
  const mL = L.b === 0 ? null : -L.a / L.b; // l 의 기울기 (세로선이면 없음)
  const mPP = Math.abs(dx) < 1e-9 ? null : dy / dx; // PP′ 의 기울기

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid="ls-play" view={view} svgRef={svgRef} label="직선 l 에 대한 선대칭">
          <Clipped cid="ls-play">
            <LineDraw view={view} L={L} color="#34d399" width={3} />
            <line x1={view.sx(P.x)} y1={view.sy(P.y)} x2={view.sx(Q.x)} y2={view.sy(Q.y)} stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="6 4" />
            <Ticks view={view} A={P} B={H} color="#fbbf24" />
            <Ticks view={view} A={H} B={Q} color="#fbbf24" />
          </Clipped>
          <RightAngle view={view} H={H} L={L} />
          <Dot view={view} p={Q} color="#a78bfa" r={7} label={`P′(${fmt(Q.x, 1)}, ${fmt(Q.y, 1)})`} />
          <Dot view={view} p={H} color="#34d399" r={5} label="H" />
          <Dot view={view} p={P} color="#e2e8f0" r={7} label={`P(${nz(P.x)}, ${nz(P.y)})`} onDown={() => setDragId("P")} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 흰 점 P 를 끌고, 아래 슬라이더로 거울(직선)을 바꿔 보세요</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="mb-2 overflow-x-auto overflow-y-hidden py-1 text-center text-slate-100">
            <Katex expr={`l : ${lineTex(L)}`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Slider label="a" value={a} min={-4} max={4} onChange={setA} accent="accent-emerald-400" />
            <Slider label="b" value={b} min={-4} max={4} onChange={setB} accent="accent-sky-400" />
            <Slider label="c" value={c} min={-6} max={6} onChange={setC} accent="accent-violet-400" />
          </div>
        </div>

        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4">
          <p className="text-sm font-bold text-emerald-100">✅ 두 조건이 늘 성립해요</p>
          <div className="mt-2 space-y-1.5">
            <div className="rounded-xl bg-black/25 px-3 py-2">
              <p className="text-[11px] font-bold text-slate-400">① PP′ 의 중점이 l 위에</p>
              <div className="overflow-x-auto overflow-y-hidden py-1 text-slate-100">
                <Katex expr={`${ptn(L.a)} \\cdot ${ptn(M.x)} + ${ptn(L.b)} \\cdot ${ptn(M.y)} + ${ptn(L.c)} = ${tn(Math.abs(chk1) < 1e-9 ? 0 : chk1)}`} />
              </div>
            </div>
            <div className="rounded-xl bg-black/25 px-3 py-2">
              <p className="text-[11px] font-bold text-slate-400">② PP′ 이 l 과 수직 (기울기의 곱이 −1)</p>
              {degen ? (
                <p className="pt-1 text-[11px] leading-5 text-slate-300">P 가 직선 l 위에 있어 P′ 이 P 와 같아요.</p>
              ) : mL !== null && mPP !== null ? (
                <div className="mt-0.5 space-y-0.5">
                  {[
                    { l: "l 의 기울기", t: `m = ${tn(mL)}` },
                    { l: "PP′ 의 기울기", t: `m' = ${tn(mPP)}` },
                    { l: "두 기울기의 곱", t: `m \\times m' = ${tn(mL * mPP)}` },
                  ].map((r) => (
                    <div key={r.l} className="flex items-baseline gap-2">
                      <span className="w-24 shrink-0 text-[10px] font-bold text-slate-400">{r.l}</span>
                      <span className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden py-1 text-slate-100">
                        <Katex expr={r.t} />
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pt-1 text-[11px] leading-5 text-slate-300">
                  {L.b === 0 ? "l 은 세로선(기울기가 없어요), PP′ 은 가로선이라 서로 수직이에요." : "l 은 가로선(기울기 0), PP′ 은 세로선이라 서로 수직이에요."}
                </p>
              )}
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label="수선의 발" tex={`\\text{H}(${tn(H.x)},\\; ${tn(H.y)})`} />
            <FormulaLine label="대칭점" tex={`\\text{P}' = 2\\text{H} - \\text{P} = (${tn(Q.x)},\\; ${tn(Q.y)})`} big />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            {open ? "접기" : "📜 교과서의 일반식이 궁금하다면 (외울 필요 없어요!)"}
          </button>
          {open ? (
            <div className="mt-2 space-y-1">
              <div className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/30 px-3 py-2 text-slate-200">
                <Katex expr="x' = -\frac{(a^2 - b^2)x + 2aby + 2ca}{a^2 + b^2}" />
              </div>
              <div className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/30 px-3 py-2 text-slate-200">
                <Katex expr="y' = -\frac{2abx - (a^2 - b^2)y + 2bc}{a^2 + b^2}" />
              </div>
              <p className="text-[11px] leading-5 text-amber-200">
                ⚠️ 두 조건을 연립하면 이 식이 나오지만, 실제 문제에서는 <b>수선의 발 → 2H − P</b> 두 걸음이 훨씬 빠르고 안전해요.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LineOne({ q, onSolved }: { q: LineQ; onSolved: () => void }) {
  const [h1, setH1] = useState("");
  const [h2, setH2] = useState("");
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [hint, setHint] = useState(false);

  const okH1 = h1 === "" ? null : parseNum(h1) === q.H.x;
  const okH2 = h2 === "" ? null : parseNum(h2) === q.H.y;
  const s1 = okH1 === true && okH2 === true;
  const okA1 = a1 === "" ? null : parseNum(a1) === Math.round(q.ans.x);
  const okA2 = a2 === "" ? null : parseNum(a2) === Math.round(q.ans.y);
  const s2 = s1 && okA1 === true && okA2 === true;

  const doneRef = useRef(false);
  useEffect(() => {
    if (s2 && !doneRef.current) {
      doneRef.current = true;
      onSolved();
    }
  });

  const view = makeView(8);
  const ans = { x: Math.round(q.ans.x), y: Math.round(q.ans.y) };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
          <p className="text-xs font-bold text-cyan-200">문제 — 점 P 를 직선 l 에 대하여 대칭이동한 점은?</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label="직선" tex={`l : ${lineTex(q.L)}`} />
            <FormulaLine label="점" tex={`\\text{P}${ptTex(q.P)}`} />
          </div>
        </div>

        <Step n={1} title="P 에서 l 에 내린 수선의 발 H" state={s1 ? "done" : "open"}>
          <div className="flex flex-wrap items-center gap-2 text-slate-200">
            <span className="font-mono text-sm">H =</span>
            <span className="font-mono text-lg">(</span>
            <NumBox value={h1} onChange={setH1} ok={okH1} label="H의 x좌표" />
            <span className="font-mono text-lg">,</span>
            <NumBox value={h2} onChange={setH2} ok={okH2} label="H의 y좌표" />
            <span className="font-mono text-lg">)</span>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setHint((v) => !v)}
              className="rounded-lg border border-amber-400/45 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
            >
              💡 힌트
            </button>
            <button
              type="button"
              onClick={() => {
                setH1(String(q.H.x));
                setH2(String(q.H.y));
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              정답 보기
            </button>
          </div>
          {hint ? <p className="mt-2 rounded-lg bg-amber-400/12 px-3 py-2 text-[11px] leading-5 text-amber-100">{q.tip}</p> : null}
        </Step>

        <Step n={2} title="P′ = 2H − P" state={s2 ? "done" : s1 ? "open" : "locked"}>
          <div className="overflow-x-auto overflow-y-hidden py-1 text-[13px] text-slate-200">
            <Katex expr={`\\text{P}' = 2(${q.H.x},\\; ${q.H.y}) - (${q.P.x},\\; ${q.P.y})`} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-200">
            <span className="font-mono text-sm">P′ =</span>
            <span className="font-mono text-lg">(</span>
            <NumBox value={a1} onChange={setA1} ok={okA1} label="P′의 x좌표" />
            <span className="font-mono text-lg">,</span>
            <NumBox value={a2} onChange={setA2} ok={okA2} label="P′의 y좌표" />
            <span className="font-mono text-lg">)</span>
          </div>
        </Step>
      </div>

      <div>
        {s2 ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-3">
            <Plane cid={`lq-${q.id}`} view={view} label="풀이">
              <Clipped cid={`lq-${q.id}`}>
                <LineDraw view={view} L={q.L} color="#34d399" width={3} />
                <line x1={view.sx(q.P.x)} y1={view.sy(q.P.y)} x2={view.sx(ans.x)} y2={view.sy(ans.y)} stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="6 4" />
                <Ticks view={view} A={q.P} B={q.H} color="#fbbf24" />
                <Ticks view={view} A={q.H} B={ans} color="#fbbf24" />
              </Clipped>
              <RightAngle view={view} H={q.H} L={q.L} />
              <Dot view={view} p={ans} color="#a78bfa" r={7} label={`P′${ptTex(ans)}`} />
              <Dot view={view} p={q.H} color="#34d399" r={6} label={`H${ptTex(q.H)}`} />
              <Dot view={view} p={q.P} color="#e2e8f0" r={6} label={`P${ptTex(q.P)}`} />
            </Plane>
            <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
              H 가 PP′ 의 중점이라 두 빗금 구간의 길이가 같아요. 복잡한 일반식 없이 <b>두 걸음</b>만으로 끝!
            </p>
          </div>
        ) : (
          <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-slate-950/60 p-6">
            <p className="whitespace-pre-line text-center text-xs leading-6 text-slate-500">{"🔒 두 걸음을 모두 맞히면\n그림과 풀이가 열려요"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 탐정 게임
// ══════════════════════════════════════════════════════════════
function GameTab() {
  const [ci, setCi] = useState(0);
  const [cleared, setCleared] = useState<string[]>([]);
  const c = CASES[ci];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔎 어떤 대칭이었을까? 그리고 기준은 어디에?</p>
          <Chips ids={CASES.map((x) => x.id)} cur={ci} done={cleared} onPick={setCi} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-violet-400/35 bg-violet-400/[0.08] px-3 py-2">
            <p className="text-[11px] font-bold text-violet-200">🔘 점대칭이라면</p>
            <p className="mt-1 text-xs leading-6 text-slate-200">대응점을 이은 선분들이 <b>한 점에서 만나요</b> — 그 점이 중심!</p>
          </div>
          <div className="rounded-xl border border-emerald-400/35 bg-emerald-400/[0.08] px-3 py-2">
            <p className="text-[11px] font-bold text-emerald-200">📏 선대칭이라면</p>
            <p className="mt-1 text-xs leading-6 text-slate-200">선분들이 <b>서로 나란해요</b> — 거울은 그 수직이등분선!</p>
          </div>
        </div>
      </div>

      <CaseOne key={c.id} c={c} onCleared={() => setCleared((s) => (s.includes(c.id) ? s : [...s, c.id]))} />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">🗂️ 한 줄로 기억하기</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {SUMMARY.map((s) => (
            <div key={s.title} className={"rounded-xl px-3 py-2.5 " + (s.tone === "violet" ? "border border-violet-400/35 bg-violet-400/[0.08]" : "border border-emerald-400/35 bg-emerald-400/[0.08]")}>
              <p className="text-xs font-bold text-slate-100">{s.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-300">{s.how}</p>
              <div className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-slate-100">
                <Katex expr={s.pt} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[11px] leading-6 text-slate-300">
          외울 것은 <b className="text-violet-200">중점</b>과 <b className="text-emerald-200">수선의 발</b> 둘뿐! 나머지는 그때그때 만들면 돼요.
        </p>
      </div>
    </div>
  );
}

function CaseOne({ c, onCleared }: { c: Case; onCleared: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pick, setPick] = useState<"point" | "line" | null>(null);
  const [O, setO] = useState<Pt>({ x: 0, y: 0 });
  const [A, setA] = useState<Pt>({ x: -3, y: -3 });
  const [B, setB] = useState<Pt>({ x: 3, y: 3 });
  const [links, setLinks] = useState(false);
  const [hint, setHint] = useState(false);

  const img = caseImage(c);
  const view = makeView(8);
  const { setDragId } = useDrag(svgRef, view, (id, p) => {
    const g = snap(p, -6, 6);
    if (id === "O") setO(g);
    else if (id === "A") setA(g);
    else setB(g);
  });

  const kindOk = pick === c.kind;
  const guessLine = lineThrough(A, B);
  const found = !kindOk ? false : c.kind === "point" ? isCenterOf(O, BASE_TRI, img) : guessLine !== null && isMirrorOf(guessLine, BASE_TRI, img);

  const doneRef = useRef(false);
  useEffect(() => {
    if (found && !doneRef.current) {
      doneRef.current = true;
      onCleared();
    }
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={"rounded-2xl border p-3 transition " + (found ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04]")}>
        <Plane cid={`case-${c.id}`} view={view} svgRef={svgRef} label="대칭의 정체">
          <Clipped cid={`case-${c.id}`}>
            {links
              ? BASE_TRI.map((p, i) => (
                  <line key={i} x1={view.sx(p.x)} y1={view.sy(p.y)} x2={view.sx(img[i].x)} y2={view.sy(img[i].y)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 4" />
                ))
              : null}
            {kindOk && c.kind === "line" && guessLine ? <LineDraw view={view} L={guessLine} color={found ? "#34d399" : "#38bdf8"} width={3} dash={found ? undefined : "7 5"} /> : null}
            <Tri view={view} pts={BASE_TRI} fill="rgba(148,163,184,0.10)" stroke="#94a3b8" width={2.5} dash="5 4" />
            <Tri view={view} pts={img} fill={found ? "rgba(52,211,153,0.22)" : "rgba(244,114,182,0.20)"} stroke={found ? "#34d399" : "#f472b6"} width={3} />
          </Clipped>
          {links
            ? BASE_TRI.map((p, i) => {
                const M = midPt(p, img[i]);
                return <circle key={i} cx={view.sx(M.x)} cy={view.sy(M.y)} r={3} fill="#fbbf24" />;
              })
            : null}
          {kindOk && c.kind === "point" ? <Dot view={view} p={O} color={found ? "#34d399" : "#38bdf8"} r={8} label={`O(${nz(O.x)}, ${nz(O.y)})`} onDown={() => setDragId("O")} /> : null}
          {kindOk && c.kind === "line" ? (
            <>
              <Dot view={view} p={A} color={found ? "#34d399" : "#38bdf8"} r={6} label="A" onDown={() => setDragId("A")} />
              <Dot view={view} p={B} color={found ? "#34d399" : "#38bdf8"} r={6} label="B" onDown={() => setDragId("B")} />
            </>
          ) : null}
        </Plane>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold">
          <span className="text-slate-400">┈ 원래 도형</span>
          <span className={found ? "text-emerald-300" : "text-pink-300"}>━ 옮겨진 도형</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-100">🔍 단서 보기</p>
            <button
              type="button"
              onClick={() => setLinks((v) => !v)}
              className="rounded-lg border border-amber-400/45 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
            >
              {links ? "선분 숨기기" : "🧵 대응점 이어 보기"}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-slate-400">이은 선분들이 한 점에서 만나는지, 서로 나란한지 살펴보세요 (노란 작은 점은 중점이에요).</p>
        </div>

        <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
          <p className="text-sm font-bold text-cyan-100">① 어떤 대칭일까요?</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {(["point", "line"] as const).map((k) => {
              const on = pick === k;
              const good = pick !== null && k === c.kind;
              const bad = on && k !== c.kind;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setPick(k)}
                  disabled={kindOk}
                  className={
                    "rounded-xl border-2 px-3 py-2 text-center text-sm font-bold transition disabled:cursor-default " +
                    (good ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : bad ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  {k === "point" ? "🔘 점대칭" : "📏 선대칭"}
                </button>
              );
            })}
          </div>
          {pick !== null && !kindOk ? <p className="mt-1.5 text-[11px] font-bold text-rose-200">단서를 다시 보세요 — 선분들이 만나나요, 나란한가요?</p> : null}
        </div>

        <div className={"rounded-2xl border-2 p-4 transition " + (!kindOk ? "border-white/10 bg-slate-900/40 opacity-45" : found ? "border-emerald-400/60 bg-emerald-400/15" : "border-violet-400/45 bg-violet-400/[0.10]")}>
          <p className="text-sm font-bold text-slate-100">② {c.kind === "point" ? "대칭의 중심을 놓아 보세요" : "거울(직선)을 놓아 보세요"}</p>
          {kindOk ? (
            <>
              <p className="mt-1 text-[11px] leading-5 text-slate-300">
                {c.kind === "point" ? "파란 점 O 를 끌어 알맞은 자리에 놓으세요." : "파란 점 A, B 를 끌어 두 점을 지나는 직선을 거울에 맞추세요."}
              </p>
              <p className={"mt-2 text-center text-base font-extrabold " + (found ? "text-emerald-100" : "text-slate-400")}>
                {found ? "✨ 정확해요!" : "아직이에요"}
              </p>
              {found ? (
                <div className="mt-2 space-y-0.5 rounded-lg bg-black/25 px-3 py-2">
                  {c.kind === "point" ? (
                    <>
                      <FormulaLine label="중심" tex={`\\text{O}${ptTex(c.O)}`} />
                      <FormulaLine label="규칙" tex={`(x,\\, y) \\to (${2 * c.O.x} - x,\\; ${2 * c.O.y} - y)`} big />
                    </>
                  ) : (
                    <>
                      <FormulaLine label="거울" tex={`l : ${c.lTex}`} />
                      <FormulaLine label="확인" tex="l \perp \text{PP}' \;,\; \text{중점} \in l" />
                    </>
                  )}
                </div>
              ) : null}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setHint((v) => !v)}
                  className="rounded-lg border border-amber-400/45 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
                >
                  💡 힌트
                </button>
                {c.kind === "line" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setA({ x: -3, y: -3 });
                      setB({ x: 3, y: 3 });
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                  >
                    ↺ 직선 초기화
                  </button>
                ) : null}
              </div>
              {hint ? <p className="mt-2 rounded-lg bg-amber-400/12 px-3 py-2 text-[11px] leading-5 text-amber-100">{c.hint}</p> : null}
            </>
          ) : (
            <p className="mt-1 text-[11px] text-slate-500">먼저 대칭의 종류를 맞혀 보세요</p>
          )}
        </div>
      </div>
    </div>
  );
}
