"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  EXT_QS,
  POINT_QS,
  SLOPE_QS,
  circleStdTex,
  lineTex,
  mulRadTex,
  mxnTex,
  ptTex,
  quadTex,
  shiftedTangentTex,
  tangentAtPoint,
  tangentPointsFrom,
  tangentsWithSlope,
  xyEqTex,
  yEqTex,
  type ExtQ,
  type Line,
  type PointQ,
  type Pt,
  type SlopeQ,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_two",
    prompt:
      "기울기만 정해 주었을 때(탭①)와 원 밖의 한 점만 정해 주었을 때(탭③) 접선이 모두 2개씩 나왔어요. 각각 왜 2개인지 그림과 식을 근거로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 기울기가 같은 직선은 원의 위쪽과 아래쪽에서 각각 한 번씩 스칠 수 있어서 n = ±r√(m²+1) 처럼 부호가 두 개 나온다. 원 밖의 점에서는 접점을 구하는 이차방정식의 근이 두 개라서 접선도 두 개가 된다.",
  },
  {
    id: "tangent_formula",
    prompt:
      "원 위의 점 P(x₁, y₁)에서의 접선이 x₁x + y₁y = r² 이 되는 까닭을 설명해 보세요. 중심이 원점이 아닐 때는 식이 어떻게 바뀌었나요?",
    kind: "text",
    placeholder:
      "예: 반지름 OP와 접선이 수직이므로 접선의 기울기는 OP 기울기의 음의 역수 −x₁/y₁ 이다. 점기울기 꼴로 쓰고 정리하면 x₁x + y₁y = x₁² + y₁² 인데 P가 원 위의 점이라 오른쪽이 r²이 된다. 중심이 (a, b)면 x, y 자리에 x−a, y−b 를 넣은 (x₁−a)(x−a) + (y₁−b)(y−b) = r² 이 된다.",
  },
  {
    id: "shift_idea",
    prompt:
      "세 경우 모두 중심이 원점인 원에서 먼저 식을 만든 뒤 중심이 (a, b)인 원으로 넓혔어요. 이 ‘평행이동’ 아이디어가 왜 통하는지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 원을 통째로 (a, b)만큼 옮기면 접선도 똑같이 옮겨진다. 그래서 X = x−a, Y = y−b 로 두면 원점이 중심인 원 문제와 완전히 같아지고, 답을 구한 뒤 X, Y 자리에 x−a, y−b 를 되돌려 넣기만 하면 된다.",
  },
];

// ─── 자동 축척 좌표평면 ───────────────────────────────────────
const PAD = 26;
const SPAN = 360;
const VB = SPAN + PAD * 2;

type View = { half: number; step: number; u: number; sx: (v: number) => number; sy: (v: number) => number };

function makeView(need: number): View {
  const h = need <= 6 ? 6 : need <= 10 ? 10 : need <= 16 ? 16 : need <= 26 ? 26 : 40;
  const u = SPAN / (2 * h);
  const step = h <= 6 ? 1 : h <= 10 ? 2 : h <= 16 ? 4 : h <= 26 ? 5 : 10;
  return { half: h, step, u, sx: (v) => PAD + (v + h) * u, sy: (v) => PAD + (h - v) * u };
}

function fmt(v: number, k = 2): string {
  const s = v.toFixed(k);
  return s.startsWith("-") ? `−${s.slice(1)}` : s;
}
function nz(v: number): string {
  const r = Math.round(v * 100) / 100;
  return r < 0 ? `−${Math.abs(r)}` : String(r);
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

function Plane({
  cid,
  view,
  svgRef,
  label,
  children,
}: {
  cid: string;
  view: View;
  svgRef?: React.Ref<SVGSVGElement>;
  label: string;
  children: React.ReactNode;
}) {
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

function CircleDraw({ view, c, r, color, fill, width = 3 }: { view: View; c: Pt; r: number; color: string; fill?: string; width?: number }) {
  return <circle cx={view.sx(c.x)} cy={view.sy(c.y)} r={r * view.u} fill={fill ?? "none"} stroke={color} strokeWidth={width} />;
}

/** ax + by + c = 0 */
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

/** 접점에서 반지름과 접선이 이루는 직각 표시 */
function RightAngle({ view, H, L, size = 11 }: { view: View; H: Pt; L: Line; size?: number }) {
  const len = Math.hypot(L.a, L.b);
  if (len === 0) return null;
  const t1 = { x: -L.b / len, y: L.a / len };
  const t2 = { x: L.a / len, y: -L.b / len };
  const hx = view.sx(H.x);
  const hy = view.sy(H.y);
  const p = (a: number, b: number) => `${hx + t1.x * a + t2.x * b},${hy + t1.y * a + t2.y * b}`;
  return <path d={`M${p(size, 0)} L${p(size, size)} L${p(0, size)}`} fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth={1.5} />;
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

// ─── 공통 UI 조각 ─────────────────────────────────────────────
function FormulaLine({ tex, label, big }: { tex: string; label?: string; big?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      {label ? <span className="w-14 shrink-0 text-[10px] font-bold text-slate-400">{label}</span> : null}
      <span className={"min-w-0 flex-1 overflow-x-auto overflow-y-hidden py-1 text-slate-100 " + (big ? "text-lg" : "")}>
        <Katex expr={tex} />
      </span>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, accent }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; accent: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400">{label}</span>
        <span className="font-mono text-xs font-bold text-slate-100">{fmt(value, step < 1 ? 1 : 0)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} className={"mt-1 h-1.5 w-full " + accent} />
    </div>
  );
}

function parseNum(s: string): number | null {
  const t = s.trim().replace(/−/g, "-");
  if (t === "" || t === "-") return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}

function NumBox({ value, onChange, ok, label, width = "w-16" }: { value: string; onChange: (v: string) => void; ok: boolean | null; label: string; width?: string }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className={
        "rounded-lg border-2 bg-slate-950 px-2 py-1 text-center font-mono text-sm font-bold text-white outline-none transition " +
        width +
        " " +
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
        <span
          className={
            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold " +
            (state === "done" ? "bg-emerald-400/30 text-emerald-100" : "bg-white/10 text-slate-300")
          }
        >
          {state === "done" ? "✓" : n}
        </span>
        {title}
      </p>
      {state !== "locked" ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

function QChips({ ids, cur, solved, onPick }: { ids: string[]; cur: number; solved: string[]; onPick: (i: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ids.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => onPick(i)}
          className={
            "h-8 w-8 rounded-lg border-2 font-mono text-xs font-bold transition " +
            (i === cur ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100" : solved.includes(id) ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
          }
        >
          {solved.includes(id) && i !== cur ? "✓" : i + 1}
        </button>
      ))}
      <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300">
        {solved.length} / {ids.length}
      </span>
    </div>
  );
}

function Locked({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-slate-950/60 p-6">
      <p className="whitespace-pre-line text-center text-xs leading-6 text-slate-500">🔒 {text}</p>
    </div>
  );
}

function HintRow({ open, onToggle, onReveal, children }: { open: boolean; onToggle: () => void; onReveal: () => void; children?: React.ReactNode }) {
  return (
    <>
      {open && children ? <div className="mt-2 overflow-x-auto overflow-y-hidden rounded-lg bg-amber-400/12 px-3 py-2 text-[12px] text-amber-100">{children}</div> : null}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onToggle} className="rounded-lg border border-amber-400/45 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20">
          💡 힌트
        </button>
        <button type="button" onClick={onReveal} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10">
          정답 보기
        </button>
      </div>
    </>
  );
}

const T1 = "#34d399"; // 접선 1
const T2 = "#38bdf8"; // 접선 2
const TP = "#fbbf24"; // 접점
const EX = "#f472b6"; // 원 밖의 점

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "slope" | "point" | "ext";

export default function CircleTangentLineLab() {
  const [tab, setTab] = useState<Tab>("slope");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">📐 원의 접선의 방정식</h3>
        <p className="mt-2 leading-7 text-slate-300">
          접선을 정하는 단서는 세 가지 — <b className="text-emerald-200">기울기</b>, <b className="text-amber-200">접점</b>, <b className="text-pink-200">지나는 점</b>. 단서마다 접선을 찾는
          방법이 달라요!
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "slope"} onClick={() => setTab("slope")}>
          ① 기울기를 알 때 📐
        </TabButton>
        <TabButton active={tab === "point"} onClick={() => setTab("point")}>
          ② 접점을 알 때 📍
        </TabButton>
        <TabButton active={tab === "ext"} onClick={() => setTab("ext")}>
          ③ 원 밖의 점에서 ⭐
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "slope" ? <SlopeTab /> : null}
        {tab === "point" ? <PointTab /> : null}
        {tab === "ext" ? <ExtTab /> : null}
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

/** 중심이 원점인지에 따라 원의 방정식·접선 공식을 골라 준다 */
function isOrigin(c: Pt): boolean {
  return c.x === 0 && c.y === 0;
}

/** a·X + b·Y = c 를 임의의 변수 이름으로 조판 */
function varEqTex(a: number, b: number, c: number, xs: string, ys: string): string {
  const head = (v: number, name: string) => {
    const abs = Math.abs(v);
    const body = abs === 1 ? name : `${abs}${name}`;
    return v < 0 ? `-${body}` : body;
  };
  const tail = (v: number, name: string) => {
    if (v === 0) return "";
    const abs = Math.abs(v);
    const body = abs === 1 ? name : `${abs}${name}`;
    return (v < 0 ? " - " : " + ") + body;
  };
  let s = "";
  if (a !== 0) s += head(a, xs);
  if (b !== 0) s += s === "" ? head(b, ys) : tail(b, ys);
  if (s === "") s = "0";
  return `${s} = ${c}`;
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 기울기를 알 때
// ══════════════════════════════════════════════════════════════
function SlopeTab() {
  const [qi, setQi] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const q = SLOPE_QS[qi];

  return (
    <div className="space-y-4">
      <SlopePlay />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">📐 기울기가 주어진 접선 구하기</p>
          <QChips ids={SLOPE_QS.map((s) => s.id)} cur={qi} solved={solved} onPick={setQi} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <FormulaCard title="중심이 원점인 원" tex="y = mx \pm r\sqrt{m^2+1}" tone="emerald" />
          <FormulaCard title="중심이 (a, b)인 원" tex="y - b = m(x - a) \pm r\sqrt{m^2+1}" tone="sky" />
        </div>
      </div>

      <SlopeOne key={q.id} q={q} onSolved={() => setSolved((s) => (s.includes(q.id) ? s : [...s, q.id]))} />
    </div>
  );
}

function FormulaCard({ title, tex, tone }: { title: string; tex: string; tone: "emerald" | "sky" | "amber" | "violet" }) {
  const cls =
    tone === "emerald"
      ? "border-emerald-400/35 bg-emerald-400/[0.08]"
      : tone === "sky"
        ? "border-sky-400/35 bg-sky-400/[0.08]"
        : tone === "amber"
          ? "border-amber-400/35 bg-amber-400/[0.08]"
          : "border-violet-400/35 bg-violet-400/[0.08]";
  return (
    <div className={"rounded-xl border px-3 py-2 " + cls}>
      <p className="text-[11px] font-bold text-slate-300">{title}</p>
      <div className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-slate-100">
        <Katex expr={tex} />
      </div>
    </div>
  );
}

function SlopePlay() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [C, setC] = useState<Pt>({ x: 0, y: 0 });
  const [r, setR] = useState(3);
  const [m, setM] = useState(1);
  const [playing, setPlaying] = useState(false);

  const view = makeView(Math.max(10, Math.abs(C.x) + r + 2, Math.abs(C.y) + r + 2));
  const { setDragId } = useDrag(svgRef, view, (id, p) => {
    if (id === "c") setC({ x: clampInt(p.x, -5, 5), y: clampInt(p.y, -5, 5) });
  });

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setM((v) => {
        const nv = Math.round((v + 0.1) * 10) / 10;
        return nv > 3 ? -3 : nv;
      });
    }, 60);
    return () => window.clearInterval(id);
  }, [playing]);

  const ts = tangentsWithSlope(C, r, m);
  const k = r * Math.sqrt(m * m + 1);
  const org = isOrigin(C);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid="slope-plane" view={view} svgRef={svgRef} label="기울기가 주어진 두 접선">
          <Clipped cid="slope-plane">
            <CircleDraw view={view} c={C} r={r} color="#e2e8f0" fill="rgba(226,232,240,0.06)" />
            {ts.map((t, i) => (
              <g key={i}>
                <LineDraw view={view} L={t.L} color={i === 0 ? T1 : T2} width={4} />
                <line x1={view.sx(C.x)} y1={view.sy(C.y)} x2={view.sx(t.T.x)} y2={view.sy(t.T.y)} stroke={i === 0 ? T1 : T2} strokeWidth={2} strokeDasharray="4 3" />
              </g>
            ))}
          </Clipped>
          {ts.map((t, i) => (
            <g key={i}>
              <RightAngle view={view} H={t.T} L={t.L} />
              <Dot view={view} p={t.T} color={TP} r={5} />
            </g>
          ))}
          <Dot view={view} p={C} color="#e2e8f0" r={6} label={`(${nz(C.x)}, ${nz(C.y)})`} onDown={() => setDragId("c")} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 흰 점(중심)을 끌어 원을 옮겨 보세요</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 px-4 py-3 text-center">
          <p className="text-[11px] font-bold text-slate-300">기울기가 정해지면 접선은</p>
          <p className="font-mono text-4xl font-extrabold text-emerald-100">2</p>
          <p className="text-sm font-extrabold text-emerald-200">개 — 위쪽 하나, 아래쪽 하나!</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Slider label="기울기 m" value={m} min={-3} max={3} step={0.1} onChange={setM} accent="accent-emerald-400" />
            <Slider label="반지름 r" value={r} min={1} max={6} step={1} onChange={setR} accent="accent-slate-300" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              className="flex-1 rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-3 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
            >
              {playing ? "⏸ 멈춤" : "🎬 기울기 훑기"}
            </button>
            <button
              type="button"
              onClick={() => setC({ x: 0, y: 0 })}
              className="rounded-xl border-2 border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              중심을 원점으로
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
          <p className="text-sm font-bold text-emerald-200">✍️ 지금 두 접선</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label="원" tex={circleStdTex(C.x, C.y, r * r)} />
            <FormulaLine label="공식" tex={org ? "y = mx \\pm r\\sqrt{m^2+1}" : "y - b = m(x - a) \\pm r\\sqrt{m^2+1}"} />
            <FormulaLine label="계산" tex={`r\\sqrt{m^2+1} = ${r}\\sqrt{${fmt(m * m + 1)}} \\approx ${fmt(k)}`} />
            <FormulaLine label="접선 1" tex={`y = ${mxnTex(m, Math.round(ts[0].n * 100) / 100)}`} />
            <FormulaLine label="접선 2" tex={`y = ${mxnTex(m, Math.round(ts[1].n * 100) / 100)}`} />
          </div>
          <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
            두 접선의 <b>기울기는 같고 y절편만 ± 로 갈라져요</b>. 접점(노란 점)에서 반지름과 접선이 직각으로 만나는 것도 확인해 보세요.
          </p>
        </div>
      </div>
    </div>
  );
}

function SlopeOne({ q, onSolved }: { q: SlopeQ; onSolved: () => void }) {
  const [i1, setI1] = useState("");
  const [i2, setI2] = useState("");
  const [n1, setN1] = useState("");
  const [n2, setN2] = useState("");
  const [hint, setHint] = useState(false);

  const ok1 = i1 === "" ? null : parseNum(i1) === q.m2p1;
  const s1 = ok1 === true;
  const ok2 = i2 === "" ? null : parseNum(i2) === q.k;
  const s2 = s1 && ok2 === true;
  const vn1 = parseNum(n1);
  const vn2 = parseNum(n2);
  const pair = vn1 !== null && vn2 !== null && vn1 !== vn2 && [vn1, vn2].every((v) => q.ns.includes(v as (typeof q.ns)[number]));
  const okN1 = n1 === "" ? null : q.ns.includes(vn1 as (typeof q.ns)[number]);
  const okN2 = n2 === "" ? null : q.ns.includes(vn2 as (typeof q.ns)[number]);
  const s3 = s2 && pair;

  const doneRef = useRef(false);
  useEffect(() => {
    if (s3 && !doneRef.current) {
      doneRef.current = true;
      onSolved();
    }
  });

  const org = isOrigin(q.center);
  const r = Math.sqrt(q.r2);
  const view = makeView(Math.max(Math.abs(q.center.x) + r + 3, Math.abs(q.center.y) + r + 3, 6));
  const Ls: Line[] = q.ns.map((n) => ({ a: q.m, b: -1, c: n }));
  const Ts = tangentsWithSlope(q.center, r, q.m).map((t) => t.T);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
          <p className="text-xs font-bold text-cyan-200">문제 — 원에 접하고 기울기가 주어진 직선을 모두 구하세요</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label="원" tex={circleStdTex(q.center.x, q.center.y, q.r2)} />
            <FormulaLine label="기울기" tex={`m = ${q.m}`} />
          </div>
          {!org ? <p className="mt-1 text-[11px] text-amber-200">↗ 중심이 원점이 아니에요 — 평행이동한 공식을 쓰세요!</p> : null}
        </div>

        <Step n={1} title="근호 안의 값 m² + 1" state={s1 ? "done" : "open"}>
          <div className="flex flex-wrap items-center gap-2 text-slate-200">
            <span className="py-1">
              <Katex expr={`m^2 + 1 = (${q.m})^2 + 1 =`} />
            </span>
            <NumBox value={i1} onChange={setI1} ok={ok1} label="m제곱 더하기 1" />
          </div>
        </Step>

        <Step n={2} title="접선까지의 거리에서 나오는 값 r√(m²+1)" state={s2 ? "done" : s1 ? "open" : "locked"}>
          <div className="flex flex-wrap items-center gap-2 text-slate-200">
            <span className="py-1">
              <Katex expr={`\\sqrt{${q.r2}} \\times \\sqrt{${q.m2p1}} = \\sqrt{${q.r2 * q.m2p1}} =`} />
            </span>
            <NumBox value={i2} onChange={setI2} ok={ok2} label="r 곱하기 근호 m제곱 더하기 1" />
          </div>
          <HintRow open={hint} onToggle={() => setHint((v) => !v)} onReveal={() => setI2(String(q.k))}>
            <Katex expr={`r\\sqrt{m^2+1} = ${mulRadTex(1, q.r2)} \\cdot \\sqrt{${q.m2p1}} = ${q.k}`} />
          </HintRow>
        </Step>

        <Step n={3} title="두 접선의 y절편" state={s3 ? "done" : s2 ? "open" : "locked"}>
          <div className="overflow-x-auto overflow-y-hidden py-1 text-[13px] text-slate-200">
            <Katex
              expr={
                org
                  ? `y = ${q.m}x \\pm ${q.k}`
                  : `y ${q.center.y > 0 ? "-" : "+"} ${Math.abs(q.center.y)} = ${q.m}(x ${q.center.x > 0 ? "-" : "+"} ${Math.abs(q.center.x)}) \\pm ${q.k}`
              }
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-200">
            <span className="font-mono text-sm">y = {q.m === 1 ? "x" : q.m === -1 ? "−x" : `${nz(q.m)}x`} +</span>
            <NumBox value={n1} onChange={setN1} ok={okN1} label="y절편 1" />
            <span className="mx-1 text-slate-500">그리고</span>
            <span className="font-mono text-sm">y = {q.m === 1 ? "x" : q.m === -1 ? "−x" : `${nz(q.m)}x`} +</span>
            <NumBox value={n2} onChange={setN2} ok={okN2} label="y절편 2" />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">두 칸에 서로 다른 값을 넣으세요 (순서는 상관없어요)</p>
        </Step>
      </div>

      <div className="space-y-3">
        {s3 ? (
          <>
            <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
              <Plane cid={`slopeq-${q.id}`} view={view} label="구한 두 접선">
                <Clipped cid={`slopeq-${q.id}`}>
                  <CircleDraw view={view} c={q.center} r={r} color="#e2e8f0" fill="rgba(226,232,240,0.06)" />
                  {Ls.map((L, i) => (
                    <LineDraw key={i} view={view} L={L} color={i === 0 ? T1 : T2} width={4} />
                  ))}
                </Clipped>
                {Ts.map((T, i) => (
                  <Dot key={i} view={view} p={T} color={TP} r={5} />
                ))}
                <Dot view={view} p={q.center} color="#e2e8f0" r={5} />
              </Plane>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4">
              <p className="text-sm font-bold text-emerald-200">✅ 풀이</p>
              <div className="mt-2 space-y-0.5">
                <FormulaLine label="공식" tex={org ? "y = mx \\pm r\\sqrt{m^2+1}" : "y - b = m(x - a) \\pm r\\sqrt{m^2+1}"} />
                <FormulaLine label="대입" tex={`r\\sqrt{m^2+1} = ${mulRadTex(1, q.r2)}\\sqrt{${q.m2p1}} = ${q.k}`} />
                <FormulaLine label="접선" tex={`${yEqTex(q.m, q.ns[0])}, \\quad ${yEqTex(q.m, q.ns[1])}`} big />
              </div>
              <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
                {org ? (
                  <>y절편이 ± 로 갈라져 접선이 두 개! 두 직선은 원을 사이에 두고 평행합니다.</>
                ) : (
                  <>
                    중심이 ({nz(q.center.x)}, {nz(q.center.y)}) 이므로 y − b = m(x − a) 꼴에서 시작해 정리하면 y절편이 {nz(q.ns[0])} 와 {nz(q.ns[1])} 로 갈라져요.
                  </>
                )}
              </p>
            </div>
          </>
        ) : (
          <Locked text={"세 단계를 모두 맞히면\n그래프와 풀이가 열려요"} />
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 접점을 알 때
// ══════════════════════════════════════════════════════════════
function PointTab() {
  const [qi, setQi] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const q = POINT_QS[qi];

  return (
    <div className="space-y-4">
      <PointPlay />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">📍 접점이 주어진 접선 구하기</p>
          <QChips ids={POINT_QS.map((s) => s.id)} cur={qi} solved={solved} onPick={setQi} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <FormulaCard title="중심이 원점인 원" tex="x_1 x + y_1 y = r^2" tone="amber" />
          <FormulaCard title="중심이 (a, b)인 원" tex="(x_1 - a)(x - a) + (y_1 - b)(y - b) = r^2" tone="violet" />
        </div>
      </div>

      <PointOne key={q.id} q={q} onSolved={() => setSolved((s) => (s.includes(q.id) ? s : [...s, q.id]))} />
    </div>
  );
}

const PRESETS: { label: string; th: number }[] = [
  { label: "오른쪽", th: 0 },
  { label: "위", th: Math.PI / 2 },
  { label: "왼쪽", th: Math.PI },
  { label: "아래", th: -Math.PI / 2 },
];

function PointPlay() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [C, setC] = useState<Pt>({ x: 0, y: 0 });
  const [r, setR] = useState(4);
  const [th, setTh] = useState(0.9);

  const view = makeView(Math.max(10, Math.abs(C.x) + r + 2, Math.abs(C.y) + r + 2));
  const CRef = useRef(C);
  useEffect(() => {
    CRef.current = C;
  });
  const { setDragId } = useDrag(svgRef, view, (id, p) => {
    if (id === "c") setC({ x: clampInt(p.x, -5, 5), y: clampInt(p.y, -5, 5) });
    else setTh(Math.atan2(p.y - CRef.current.y, p.x - CRef.current.x));
  });

  const P: Pt = { x: C.x + r * Math.cos(th), y: C.y + r * Math.sin(th) };
  const L = tangentAtPoint(C, r * r, P);
  const org = isOrigin(C);
  const cx = Math.round((P.x - C.x) * 100) / 100;
  const cy = Math.round((P.y - C.y) * 100) / 100;
  const special = Math.abs(cx) < 0.02 || Math.abs(cy) < 0.02;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid="point-plane" view={view} svgRef={svgRef} label="접점에서의 접선">
          <Clipped cid="point-plane">
            <CircleDraw view={view} c={C} r={r} color="#e2e8f0" fill="rgba(226,232,240,0.06)" />
            <LineDraw view={view} L={L} color={T1} width={4} />
            <line x1={view.sx(C.x)} y1={view.sy(C.y)} x2={view.sx(P.x)} y2={view.sy(P.y)} stroke={TP} strokeWidth={2.5} strokeDasharray="5 4" />
          </Clipped>
          <RightAngle view={view} H={P} L={L} />
          <Dot view={view} p={P} color={TP} r={7} label={`P(${nz(P.x)}, ${nz(P.y)})`} onDown={() => setDragId("p")} />
          <Dot view={view} p={C} color="#e2e8f0" r={6} onDown={() => setDragId("c")} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 노란 점 P를 원 위에서 끌어 보세요 (중심도 옮길 수 있어요)</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <Slider label="반지름 r" value={r} min={1} max={6} step={1} onChange={setR} accent="accent-slate-300" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setTh(p.th)}
                className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
              >
                {p.label} 끝
              </button>
            ))}
            <button
              type="button"
              onClick={() => setC({ x: 0, y: 0 })}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              중심을 원점으로
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-4">
          <p className="text-sm font-bold text-amber-200">✍️ 지금 접선</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label="원" tex={circleStdTex(C.x, C.y, r * r)} />
            <FormulaLine label="접점" tex={`P(${fmt(P.x)},\\; ${fmt(P.y)})`} />
            <FormulaLine label="공식" tex={org ? "x_1 x + y_1 y = r^2" : "(x_1-a)(x-a) + (y_1-b)(y-b) = r^2"} />
            <FormulaLine label="접선" tex={shiftedTangentTex(cx, cy, C.x, C.y, r * r)} big />
          </div>
          <p className="mt-2 rounded-lg bg-amber-400/12 px-3 py-2 text-xs leading-6 text-amber-100">
            {special ? (
              <>
                🎯 지금은 접선이 <b>가로선 또는 세로선</b>이에요. 계수 하나가 0이 되지만 공식은 그대로 성립합니다!
              </>
            ) : (
              <>
                반지름 CP 와 접선이 직각! 그래서 접선의 기울기는 CP 기울기의 <b>음의 역수</b>가 돼요.
              </>
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.08] p-4">
          <p className="text-sm font-bold text-violet-200">🔎 공식은 이렇게 나와요</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label="1" tex="\text{OP} : \frac{y_1}{x_1}" />
            <FormulaLine label="2" tex="\text{tangent} : -\frac{x_1}{y_1}" />
            <FormulaLine label="3" tex="y - y_1 = -\frac{x_1}{y_1}(x - x_1)" />
            <FormulaLine label="4" tex="x_1 x + y_1 y = x_1^2 + y_1^2 = r^2" big />
          </div>
        </div>
      </div>
    </div>
  );
}

function PointOne({ q, onSolved }: { q: PointQ; onSolved: () => void }) {
  const [i0, setI0] = useState("");
  const [ix, setIx] = useState("");
  const [iy, setIy] = useState("");
  const [hint, setHint] = useState(false);

  const ok0 = i0 === "" ? null : parseNum(i0) === q.r2;
  const s1 = ok0 === true;
  const okX = ix === "" ? null : parseNum(ix) === q.coefX;
  const okY = iy === "" ? null : parseNum(iy) === q.coefY;
  const s2 = s1 && okX === true && okY === true;

  const doneRef = useRef(false);
  useEffect(() => {
    if (s2 && !doneRef.current) {
      doneRef.current = true;
      onSolved();
    }
  });

  const org = isOrigin(q.center);
  const r = Math.sqrt(q.r2);
  const view = makeView(Math.max(Math.abs(q.center.x) + r + 3, Math.abs(q.center.y) + r + 3, 6));
  const L = tangentAtPoint(q.center, q.r2, q.P);
  const tidy = xyEqTex(q.coefX, q.coefY, q.rhs);
  const simple = q.coefX === 0 || q.coefY === 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
          <p className="text-xs font-bold text-cyan-200">문제 — 원 위의 점에서의 접선의 방정식을 구하세요</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label="원" tex={circleStdTex(q.center.x, q.center.y, q.r2)} />
            <FormulaLine label="접점" tex={`P${ptTex(q.P)}`} />
          </div>
        </div>

        <Step n={1} title="접점이 정말 원 위에 있는지 확인" state={s1 ? "done" : "open"}>
          <div className="flex flex-wrap items-center gap-2 text-slate-200">
            <span className="py-1">
              <Katex
                expr={
                  org
                    ? `(${q.P.x})^2 + (${q.P.y})^2 =`
                    : `(${q.P.x} ${q.center.x > 0 ? "-" : "+"} ${Math.abs(q.center.x)})^2 + (${q.P.y} ${q.center.y > 0 ? "-" : "+"} ${Math.abs(q.center.y)})^2 =`
                }
              />
            </span>
            <NumBox value={i0} onChange={setI0} ok={ok0} label="원 위에 있는지 확인" />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">{s1 ? `✅ r² = ${q.r2} 과 같아요 — 접점이 원 위에 있어요!` : "r² 과 같은 값이 나와야 해요"}</p>
        </Step>

        <Step n={2} title="공식에 넣을 계수" state={s2 ? "done" : s1 ? "open" : "locked"}>
          <div className="flex flex-wrap items-center gap-1.5 text-slate-200">
            <NumBox value={ix} onChange={setIx} ok={okX} label="x쪽 계수" />
            <span className="font-mono text-sm">{org ? "· x" : `· (x ${q.center.x > 0 ? "−" : "+"} ${Math.abs(q.center.x)})`}</span>
            <span className="font-mono text-sm">+</span>
            <NumBox value={iy} onChange={setIy} ok={okY} label="y쪽 계수" />
            <span className="font-mono text-sm">{org ? "· y" : `· (y ${q.center.y > 0 ? "−" : "+"} ${Math.abs(q.center.y)})`}</span>
            <span className="font-mono text-sm">= {q.r2}</span>
          </div>
          <HintRow
            open={hint}
            onToggle={() => setHint((v) => !v)}
            onReveal={() => {
              setIx(String(q.coefX));
              setIy(String(q.coefY));
            }}
          >
            <Katex expr={org ? "x_1 x + y_1 y = r^2" : "(x_1 - a)(x - a) + (y_1 - b)(y - b) = r^2"} />
          </HintRow>
        </Step>
      </div>

      <div className="space-y-3">
        {s2 ? (
          <>
            <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
              <Plane cid={`pointq-${q.id}`} view={view} label="구한 접선">
                <Clipped cid={`pointq-${q.id}`}>
                  <CircleDraw view={view} c={q.center} r={r} color="#e2e8f0" fill="rgba(226,232,240,0.06)" />
                  <LineDraw view={view} L={L} color={T1} width={4} />
                  <line x1={view.sx(q.center.x)} y1={view.sy(q.center.y)} x2={view.sx(q.P.x)} y2={view.sy(q.P.y)} stroke={TP} strokeWidth={2.5} strokeDasharray="5 4" />
                </Clipped>
                <RightAngle view={view} H={q.P} L={L} />
                <Dot view={view} p={q.P} color={TP} r={7} label={`P${ptTex(q.P)}`} />
                <Dot view={view} p={q.center} color="#e2e8f0" r={5} />
              </Plane>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4">
              <p className="text-sm font-bold text-emerald-200">✅ 풀이</p>
              <div className="mt-2 space-y-0.5">
                <FormulaLine label="공식" tex={org ? "x_1 x + y_1 y = r^2" : "(x_1-a)(x-a) + (y_1-b)(y-b) = r^2"} />
                <FormulaLine label="대입" tex={shiftedTangentTex(q.coefX, q.coefY, q.center.x, q.center.y, q.r2)} />
                <FormulaLine label="접선" tex={simple ? `${tidy} \\;\\Rightarrow\\; ${q.coefX === 0 ? `y = ${q.rhs / q.coefY}` : `x = ${q.rhs / q.coefX}`}` : tidy} big />
              </div>
              <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
                {simple ? (
                  <>계수 하나가 0이라 접선이 가로선/세로선이 됐어요. 공식은 이런 경우에도 그대로 통합니다!</>
                ) : org ? (
                  <>
                    접점의 좌표를 x, y 앞에 그대로 옮겨 적고 오른쪽에 r² 을 쓰면 끝! 반지름 OP 와 접선이 직각인 것을 그림에서 확인해 보세요.
                  </>
                ) : (
                  <>
                    중심이 ({nz(q.center.x)}, {nz(q.center.y)}) 이라 x → x−a, y → y−b 로 바꿔 넣었어요. 괄호를 풀어 정리하면 {" "}
                    <span className="mx-0.5 align-middle font-bold text-white">
                      <Katex expr={tidy} />
                    </span>{" "}
                    입니다.
                  </>
                )}
              </p>
            </div>
          </>
        ) : (
          <Locked text={"두 단계를 모두 맞히면\n그래프와 풀이가 열려요"} />
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 원 밖의 점에서
// ══════════════════════════════════════════════════════════════
function ExtTab() {
  const [qi, setQi] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const q = EXT_QS[qi];

  return (
    <div className="space-y-4">
      <ExtPlay />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">⭐ 원 밖의 점에서 그은 접선 구하기</p>
          <QChips ids={EXT_QS.map((s) => s.id)} cur={qi} solved={solved} onPick={setQi} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <FormulaCard title="① A를 접선의 식에 대입 (일차식)" tex="p\,x_1 + q\,y_1 = r^2" tone="emerald" />
          <FormulaCard title="② 접점은 원 위의 점 (이차식)" tex="x_1^2 + y_1^2 = r^2" tone="violet" />
        </div>
        <p className="mt-2 rounded-lg border border-amber-400/40 bg-amber-400/[0.10] px-3 py-2 text-[11px] leading-6 text-amber-100">
          ⚠️ 교과서 슬라이드의 이차식은 아래첨자가 <b>x₁² + y₂² = r²</b> 로 인쇄되어 있어요. 같은 접점의 좌표이므로 <b>x₁² + y₁² = r²</b> 가 맞습니다.
        </p>
      </div>

      <ExtOne key={q.id} q={q} onSolved={() => setSolved((s) => (s.includes(q.id) ? s : [...s, q.id]))} />
    </div>
  );
}

function ExtPlay() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [C, setC] = useState<Pt>({ x: 0, y: 0 });
  const [r, setR] = useState(3);
  const [A, setA] = useState<Pt>({ x: 6, y: 4 });
  const [chord, setChord] = useState(false);

  const view = makeView(Math.max(10, Math.abs(C.x) + r + 2, Math.abs(A.x) + 2, Math.abs(A.y) + 2));
  const { setDragId } = useDrag(svgRef, view, (id, p) => {
    const g = { x: clampInt(p.x, -8, 8), y: clampInt(p.y, -8, 8) };
    if (id === "c") setC(g);
    else setA(g);
  });

  const d = Math.hypot(A.x - C.x, A.y - C.y);
  const Ts = tangentPointsFrom(C, r, A);
  const Ls = Ts.map((T) => tangentAtPoint(C, r * r, T));
  const tanLen = d > r ? Math.sqrt(d * d - r * r) : 0;
  const polar: Line = { a: A.x - C.x, b: A.y - C.y, c: -((A.x - C.x) * C.x + (A.y - C.y) * C.y + r * r) };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid="ext-plane" view={view} svgRef={svgRef} label="원 밖의 점에서 그은 접선">
          <Clipped cid="ext-plane">
            <CircleDraw view={view} c={C} r={r} color="#e2e8f0" fill="rgba(226,232,240,0.06)" />
            {Ls.map((L, i) => (
              <LineDraw key={i} view={view} L={L} color={i === 0 ? T1 : T2} width={4} />
            ))}
            {Ts.map((T, i) => (
              <line key={i} x1={view.sx(C.x)} y1={view.sy(C.y)} x2={view.sx(T.x)} y2={view.sy(T.y)} stroke={TP} strokeWidth={2} strokeDasharray="4 3" />
            ))}
            {chord && Ts.length === 2 ? <LineDraw view={view} L={polar} color="#a78bfa" width={3} dash="7 5" /> : null}
          </Clipped>
          {Ts.map((T, i) => (
            <g key={i}>
              <RightAngle view={view} H={T} L={Ls[i]} />
              <Dot view={view} p={T} color={TP} r={6} label={`(${nz(T.x)}, ${nz(T.y)})`} />
            </g>
          ))}
          <Dot view={view} p={C} color="#e2e8f0" r={5} onDown={() => setDragId("c")} />
          <Dot view={view} p={A} color={EX} r={7} label={`A(${nz(A.x)}, ${nz(A.y)})`} onDown={() => setDragId("a")} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 분홍 점 A를 끌어 보세요 (원 안으로 넣으면 어떻게 될까요?)</p>
      </div>

      <div className="space-y-3">
        <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (Ts.length === 2 ? "border-pink-400/55 bg-pink-400/12" : "border-white/10 bg-white/5")}>
          <p className="text-[11px] font-bold text-slate-300">A에서 그을 수 있는 접선</p>
          <p className={"font-mono text-4xl font-extrabold " + (Ts.length === 2 ? "text-pink-100" : "text-slate-400")}>{Ts.length}</p>
          <p className={"text-sm font-extrabold " + (Ts.length === 2 ? "text-pink-200" : "text-slate-400")}>
            {Ts.length === 2 ? "개 — 원 밖의 점이면 언제나 2개!" : d < r ? "개 — 원 안의 점에서는 그을 수 없어요" : "개 — 원 위의 점이면 딱 1개"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <Slider label="반지름 r" value={r} min={1} max={6} step={1} onChange={setR} accent="accent-slate-300" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <MiniCell label="중심에서 A까지 d" value={fmt(d)} tone="pink" />
            <MiniCell label="접선의 길이 √(d²−r²)" value={Ts.length === 2 ? fmt(tanLen) : "—"} tone="amber" />
          </div>
          <button
            type="button"
            onClick={() => setChord((v) => !v)}
            disabled={Ts.length !== 2}
            className="mt-3 w-full rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-3 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25 disabled:opacity-40"
          >
            {chord ? "숨기기" : "✨ 두 접점을 잇는 직선 보기"}
          </button>
          {chord && Ts.length === 2 ? (
            <div className="mt-2 rounded-lg border border-violet-400/40 bg-violet-400/10 px-3 py-2">
              <p className="text-[10px] font-bold text-violet-200">A를 접선의 식에 대입해 만든 그 일차식이에요!</p>
              <FormulaLine tex={lineTex(polar)} />
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
          <p className="text-sm font-bold text-emerald-200">🧭 접선을 찾는 순서</p>
          <ol className="mt-2 space-y-1.5">
            {[
              "접점을 (x₁, y₁) 이라 두면 접선은 x₁x + y₁y = r²",
              "이 접선이 A(p, q) 를 지나므로 p·x₁ + q·y₁ = r²",
              "접점은 원 위의 점이므로 x₁² + y₁² = r²",
              "두 식을 연립해 접점 두 개를 구한다",
              "구한 접점을 접선의 식에 넣으면 접선 두 개!",
            ].map((t, i) => (
              <li key={i} className="flex gap-2 text-xs leading-6 text-slate-200">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/25 text-[11px] font-bold text-emerald-100">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function MiniCell({ label, value, tone }: { label: string; value: string; tone: "pink" | "amber" }) {
  const cls = tone === "pink" ? "border-pink-400/45 bg-pink-400/10 text-pink-100" : "border-amber-400/45 bg-amber-400/10 text-amber-100";
  return (
    <div className={"rounded-xl border px-2 py-2 text-center " + cls}>
      <p className="text-[10px] font-bold opacity-85">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-bold">{value}</p>
    </div>
  );
}

function ExtOne({ q, onSolved }: { q: ExtQ; onSolved: () => void }) {
  const [ia, setIa] = useState("");
  const [ib, setIb] = useState("");
  const [x1, setX1] = useState("");
  const [x2, setX2] = useState("");
  const [hint, setHint] = useState(false);

  const okA = ia === "" ? null : parseNum(ia) === q.cA;
  const okB = ib === "" ? null : parseNum(ib) === q.cB;
  const s1 = okA === true && okB === true;

  const xs = [q.Ts[0].x, q.Ts[1].x];
  const v1 = parseNum(x1);
  const v2 = parseNum(x2);
  const okX1 = x1 === "" ? null : v1 !== null && xs.includes(v1);
  const okX2 = x2 === "" ? null : v2 !== null && xs.includes(v2);
  const s2 = s1 && okX1 === true && okX2 === true && v1 !== v2;

  const doneRef = useRef(false);
  useEffect(() => {
    if (s2 && !doneRef.current) {
      doneRef.current = true;
      onSolved();
    }
  });

  const org = isOrigin(q.center);
  const r = Math.sqrt(q.r2);
  const view = makeView(Math.max(Math.abs(q.center.x) + r + 3, Math.abs(q.A.x) + 2, Math.abs(q.A.y) + 2, 6));
  const vname = org ? "x_1" : "X";
  const d2 = (q.A.x - q.center.x) ** 2 + (q.A.y - q.center.y) ** 2;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
          <p className="text-xs font-bold text-cyan-200">문제 — 원 밖의 점 A에서 그은 두 접선의 방정식을 구하세요</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label="원" tex={circleStdTex(q.center.x, q.center.y, q.r2)} />
            <FormulaLine label="점" tex={`A${ptTex(q.A)}`} />
          </div>
          {!org ? (
            <p className="mt-1 text-[11px] text-amber-200">
              ↗ 중심이 원점이 아니에요 — <b>X = x {q.center.x > 0 ? "−" : "+"} {Math.abs(q.center.x)}</b>, <b>Y = y {q.center.y > 0 ? "−" : "+"} {Math.abs(q.center.y)}</b> 로 옮겨 생각하면
              원점이 중심인 문제와 똑같아요!
            </p>
          ) : null}
        </div>

        <Step n={1} title="접점 (x₁, y₁) 이 만족하는 일차식" state={s1 ? "done" : "open"}>
          <div className="flex flex-wrap items-center gap-1.5 text-slate-200">
            <NumBox value={ia} onChange={setIa} ok={okA} label="x1의 계수" />
            <span className="font-mono text-sm">{org ? "· x₁" : "· (x₁ − a)"}</span>
            <span className="font-mono text-sm">+</span>
            <NumBox value={ib} onChange={setIb} ok={okB} label="y1의 계수" />
            <span className="font-mono text-sm">{org ? "· y₁" : "· (y₁ − b)"}</span>
            <span className="font-mono text-sm">= {q.r2}</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">접선의 식에 점 A의 좌표를 그대로 넣으면 돼요</p>
        </Step>

        <Step n={2} title="연립해서 접점의 x좌표 두 개 구하기" state={s2 ? "done" : s1 ? "open" : "locked"}>
          <div className="overflow-x-auto overflow-y-hidden py-1 text-[13px] text-slate-200">
            <Katex expr={quadTex(q.quad.a, q.quad.b, q.quad.c, vname)} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-200">
            <span className="font-mono text-sm">접점의 x좌표 =</span>
            <NumBox value={x1} onChange={setX1} ok={okX1} label="접점 x좌표 1" />
            <span className="text-slate-500">,</span>
            <NumBox value={x2} onChange={setX2} ok={okX2} label="접점 x좌표 2" />
          </div>
          <HintRow
            open={hint}
            onToggle={() => setHint((v) => !v)}
            onReveal={() => {
              setX1(String(xs[0]));
              setX2(String(xs[1]));
            }}
          >
            <Katex
              expr={
                org
                  ? `y_1 = \\frac{${q.r2} - ${q.cA}x_1}{${q.cB}} \\;\\Rightarrow\\; ${quadTex(q.quad.a, q.quad.b, q.quad.c, "x_1")}`
                  : `X = x ${q.center.x > 0 ? "-" : "+"} ${Math.abs(q.center.x)} \\;,\\; ${quadTex(q.quad.a, q.quad.b, q.quad.c, "X")}`
              }
            />
          </HintRow>
          {!org ? <p className="mt-1.5 text-[11px] text-slate-400">X 를 구했다면 x = X {q.center.x > 0 ? "+" : "−"} {Math.abs(q.center.x)} 로 되돌리세요</p> : null}
        </Step>
      </div>

      <div className="space-y-3">
        {s2 ? (
          <>
            <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
              <Plane cid={`extq-${q.id}`} view={view} label="구한 두 접선">
                <Clipped cid={`extq-${q.id}`}>
                  <CircleDraw view={view} c={q.center} r={r} color="#e2e8f0" fill="rgba(226,232,240,0.06)" />
                  {q.Ls.map((L, i) => (
                    <LineDraw key={i} view={view} L={L} color={i === 0 ? T1 : T2} width={4} />
                  ))}
                  {q.Ts.map((T, i) => (
                    <line key={i} x1={view.sx(q.center.x)} y1={view.sy(q.center.y)} x2={view.sx(T.x)} y2={view.sy(T.y)} stroke={TP} strokeWidth={2} strokeDasharray="4 3" />
                  ))}
                </Clipped>
                {q.Ts.map((T, i) => (
                  <g key={i}>
                    <RightAngle view={view} H={T} L={q.Ls[i]} />
                    <Dot view={view} p={T} color={TP} r={6} label={ptTex(T)} />
                  </g>
                ))}
                <Dot view={view} p={q.center} color="#e2e8f0" r={5} />
                <Dot view={view} p={q.A} color={EX} r={7} label={`A${ptTex(q.A)}`} />
              </Plane>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4">
              <p className="text-sm font-bold text-emerald-200">✅ 풀이</p>
              <div className="mt-2 space-y-0.5">
                <FormulaLine
                  label="일차식"
                  tex={
                    org
                      ? varEqTex(q.cA, q.cB, q.r2, "x_1", "y_1")
                      : varEqTex(q.cA, q.cB, q.r2, `(x_1 ${q.center.x > 0 ? "-" : "+"} ${Math.abs(q.center.x)})`, `(y_1 ${q.center.y > 0 ? "-" : "+"} ${Math.abs(q.center.y)})`)
                  }
                />
                <FormulaLine
                  label="이차식"
                  tex={
                    org
                      ? `x_1^2 + y_1^2 = ${q.r2}`
                      : `(x_1 ${q.center.x > 0 ? "-" : "+"} ${Math.abs(q.center.x)})^2 + (y_1 ${q.center.y > 0 ? "-" : "+"} ${Math.abs(q.center.y)})^2 = ${q.r2}`
                  }
                />
                <FormulaLine label="연립" tex={quadTex(q.quad.a, q.quad.b, q.quad.c, vname)} />
                <FormulaLine label="접점" tex={`${ptTex(q.Ts[0])},\\; ${ptTex(q.Ts[1])}`} />
                <FormulaLine label="접선" tex={`${lineTex(q.Ls[0])}, \\quad ${lineTex(q.Ls[1])}`} big />
              </div>
              <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
                이차방정식의 근이 <b>두 개</b>라서 접점도 두 개, 접선도 두 개예요. 두 접선의 길이는 모두{" "}
                <span className="mx-0.5 align-middle font-bold text-white">
                  <Katex expr={`\\sqrt{${d2} - ${q.r2}} = ${mulRadTex(1, d2 - q.r2)}`} />
                </span>{" "}
                로 같습니다.
              </p>
            </div>
          </>
        ) : (
          <Locked text={"두 단계를 모두 맞히면\n그래프와 풀이가 열려요"} />
        )}
      </div>
    </div>
  );
}
