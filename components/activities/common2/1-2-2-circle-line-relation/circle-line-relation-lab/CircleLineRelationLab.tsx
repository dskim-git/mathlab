"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CHORD_BONUS,
  CHORD_QS,
  DIST_QS,
  GALLERY,
  GALLERY_M,
  GALLERY_R,
  REL_META,
  REL_ORDER,
  SUB_QS,
  circleStdTex,
  distToLine,
  distTex,
  footOf,
  lineCirclePts,
  lineFromSlope,
  lineTex,
  mulRadTex,
  mxnTex,
  quadTex,
  relOf,
  type ChordQ,
  type DistQ,
  type Line,
  type Pt,
  type Rel,
  type SubQ,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "three_cases",
    prompt:
      "탭①에서 직선을 이리저리 움직여 보았을 때, 원과 직선이 만나는 경우가 왜 딱 세 가지뿐이었는지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 직선을 평행하게 옮기면 중심에서 직선까지의 거리 d 만 변한다. d가 r보다 작으면 원을 가로질러 두 점, 딱 r이면 스치며 한 점, r보다 크면 아예 비껴가서 0점이 된다. 그 사이의 다른 경우는 있을 수 없다.",
  },
  {
    id: "two_methods",
    prompt:
      "판별식 D로 판정하는 방법(탭②)과 거리 d로 판정하는 방법(탭③)은 왜 언제나 같은 결론을 줄까요? 두 방법을 비교해 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 연립해서 정리하면 D/4 = (m²+1)(r²−d²) 가 되어 D의 부호가 r²−d²의 부호와 똑같아진다. 그래서 두 방법은 같은 답을 준다. 계수가 복잡할 때는 거리 쪽이 계산이 훨씬 짧았다.",
  },
  {
    id: "chord_len",
    prompt:
      "탭④에서 직선을 원의 중심에서 멀리 옮길수록 현의 길이는 어떻게 변했나요? 그 이유를 직각삼각형과 피타고라스의 정리로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: d가 커질수록 현이 짧아졌다. 중심 C, 수선의 발 H, 교점 A로 만든 직각삼각형에서 AH² = r² − d² 이므로 d가 커지면 AH가 줄고, 현 AB = 2·AH 도 함께 줄어든다. d = 0 일 때 지름으로 가장 길고, d = r 이면 0이 된다.",
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

function nx(v: number): string {
  const r = Math.round(v * 100) / 100;
  return r < 0 ? `−${Math.abs(r)}` : String(r);
}
function fmt(v: number, k = 2): string {
  const s = v.toFixed(k);
  return s.startsWith("-") ? `−${s.slice(1)}` : s;
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
  small,
  onGrab,
  children,
}: {
  cid: string;
  view: View;
  svgRef?: React.Ref<SVGSVGElement>;
  label: string;
  small?: boolean;
  onGrab?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        className={"mx-auto block w-full touch-none select-none " + (small ? "max-w-[340px]" : "max-w-[440px]")}
        role="img"
        aria-label={label}
      >
        <defs>
          <clipPath id={cid}>
            <rect x={PAD} y={PAD} width={SPAN} height={SPAN} />
          </clipPath>
        </defs>
        <Grid view={view} />
        {onGrab ? (
          <rect
            x={PAD}
            y={PAD}
            width={SPAN}
            height={SPAN}
            fill="transparent"
            className="cursor-grab touch-none"
            onPointerDown={(e) => {
              e.preventDefault();
              onGrab();
            }}
          />
        ) : null}
        {children}
      </svg>
    </div>
  );
}

function Clipped({ cid, children }: { cid: string; children: React.ReactNode }) {
  return <g clipPath={`url(#${cid})`}>{children}</g>;
}

function CircleDraw({ view, c, r, color, fill, width = 3, dash }: { view: View; c: Pt; r: number; color: string; fill?: string; width?: number; dash?: string }) {
  return <circle cx={view.sx(c.x)} cy={view.sy(c.y)} r={r * view.u} fill={fill ?? "none"} stroke={color} strokeWidth={width} strokeDasharray={dash} />;
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

/** 수선의 발 H 에 직각 표시 */
function RightAngle({ view, H, L, size = 11 }: { view: View; H: Pt; L: Line; size?: number }) {
  const len = Math.hypot(L.a, L.b);
  if (len === 0) return null;
  // 화면 좌표에서 직선 방향 / 법선 방향 (y축이 뒤집혀 있음)
  const ux = -L.b / len;
  const uy = L.a / len;
  const t1 = { x: ux, y: -uy };
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
function q10(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v * 10) / 10));
}

// ─── 공통 UI 조각 ─────────────────────────────────────────────
function FormulaLine({ tex, label, big }: { tex: string; label?: string; big?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      {label ? <span className="w-14 shrink-0 text-[10px] font-bold text-slate-400">{label}</span> : null}
      <span className={"min-w-0 flex-1 py-1 text-slate-100 " + (big ? "text-lg" : "")}>
        <Katex expr={tex} />
      </span>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  accent,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  accent: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400">{label}</span>
        <span className="font-mono text-xs font-bold text-slate-100">
          {fmt(value, step < 1 ? 1 : 0)}
          {suffix ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-1 h-1.5 w-full " + accent}
      />
    </div>
  );
}

function RelBadge({ rel, big }: { rel: Rel; big?: boolean }) {
  const m = REL_META[rel];
  return (
    <div className={"rounded-xl border-2 px-3 py-2 text-center " + m.box}>
      <p className="text-[11px] font-bold text-slate-300">교점의 개수</p>
      <p className={"font-mono font-extrabold " + m.text + (big ? " text-4xl" : " text-2xl")}>{m.count}</p>
      <p className={"mt-0.5 text-sm font-extrabold " + m.text}>
        {m.emoji} {m.label}
      </p>
    </div>
  );
}

function RelPicker({ picked, answer, onPick }: { picked: Rel | null; answer: Rel; onPick: (r: Rel) => void }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-3">
      {REL_ORDER.map((r) => {
        const on = picked === r;
        const good = picked !== null && r === answer;
        const bad = on && r !== answer;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onPick(r)}
            disabled={picked === answer}
            className={
              "rounded-xl border-2 px-2 py-2 text-center text-xs font-bold transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : bad
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            <span className="mr-1">{REL_META[r].emoji}</span>
            {REL_META[r].short}
          </button>
        );
      })}
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
        (state === "done"
          ? "border-emerald-400/45 bg-emerald-400/[0.08]"
          : state === "open"
            ? "border-cyan-400/40 bg-cyan-400/[0.06]"
            : "border-white/10 bg-slate-900/40 opacity-45")
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
            (i === cur
              ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100"
              : solved.includes(id)
                ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
                : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
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

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "sim" | "sub" | "dist" | "chord";

export default function CircleLineRelationLab() {
  const [tab, setTab] = useState<Tab>("sim");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🎯 원과 직선의 위치 관계</h3>
        <p className="mt-2 leading-7 text-slate-300">
          직선을 원 쪽으로 밀어 보면 <b className="text-rose-200">가로지르고</b> · <b className="text-emerald-200">스치고</b> ·{" "}
          <b className="text-orange-200">비껴가요</b>. 이 세 가지를 <b>식</b> 두 가지 방법으로 알아맞혀 봅시다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "sim"} onClick={() => setTab("sim")}>
          ① 직선을 밀어 보자 🎬
        </TabButton>
        <TabButton active={tab === "sub"} onClick={() => setTab("sub")}>
          ② 연립해서 판별식 🧮
        </TabButton>
        <TabButton active={tab === "dist"} onClick={() => setTab("dist")}>
          ③ 거리로 판정 📏
        </TabButton>
        <TabButton active={tab === "chord"} onClick={() => setTab("chord")}>
          ④ 현의 길이 ✂️
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "sim" ? <SimTab /> : null}
        {tab === "sub" ? <SubTab /> : null}
        {tab === "dist" ? <DistTab /> : null}
        {tab === "chord" ? <ChordTab /> : null}
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
// 탭 ① 직선을 밀어 보자
// ══════════════════════════════════════════════════════════════
const ORIGIN: Pt = { x: 0, y: 0 };
const SIM_EPS = 0.035;

function SimTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [st, setSt] = useState({ m: 1, n: 1, r: 3 });
  const [seen, setSeen] = useState<Rel[]>([]);
  const [playing, setPlaying] = useState(false);
  const [showD, setShowD] = useState(true);

  const L = lineFromSlope(st.m, st.n);
  const d = distToLine(L, ORIGIN);
  const rel = relOf(d, st.r, SIM_EPS);
  const pts = lineCirclePts(L, ORIGIN, st.r, SIM_EPS);
  const H = footOf(L, ORIGIN);
  const view = makeView(Math.max(st.r + 2, 10));

  function update(patch: Partial<typeof st>) {
    const ns = { ...st, ...patch };
    setSt(ns);
    const nl = lineFromSlope(ns.m, ns.n);
    const nrel = relOf(distToLine(nl, ORIGIN), ns.r, SIM_EPS);
    setSeen((old) => (old.includes(nrel) ? old : [...old, nrel]));
  }

  const stRef = useRef(st);
  const upRef = useRef(update);
  useEffect(() => {
    stRef.current = st;
    upRef.current = update;
  });

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const cur = stRef.current;
      const nn = Math.round((cur.n + 0.12) * 100) / 100;
      upRef.current({ n: nn > 9 ? -9 : nn });
    }, 45);
    return () => window.clearInterval(id);
  }, [playing]);

  const { setDragId } = useDrag(svgRef, view, (id, p) => {
    if (id !== "line") return;
    upRef.current({ n: q10(p.y - stRef.current.m * p.x, -9, 9) });
  });

  const done = seen.length === 3;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 좌표평면 */}
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          <Plane cid="sim-plane" view={view} svgRef={svgRef} label="원과 직선의 위치 관계" onGrab={() => setDragId("line")}>
            <Clipped cid="sim-plane">
              <CircleDraw view={view} c={ORIGIN} r={st.r} color="#e2e8f0" fill="rgba(226,232,240,0.06)" width={3} />
              <LineDraw view={view} L={L} color={REL_META[rel].color} width={4} />
              {showD ? (
                <line x1={view.sx(0)} y1={view.sy(0)} x2={view.sx(H.x)} y2={view.sy(H.y)} stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="5 4" />
              ) : null}
            </Clipped>
            {showD ? <RightAngle view={view} H={H} L={L} /> : null}
            {pts.map((p, i) => (
              <Dot key={i} view={view} p={p} color={REL_META[rel].color} r={7} />
            ))}
            <Dot view={view} p={ORIGIN} color="#e2e8f0" r={4} />
            {showD ? (
              <text x={view.sx(H.x / 2) + 10} y={view.sy(H.y / 2) - 4} className="fill-amber-200 font-mono text-[11px] font-bold">
                d = {fmt(d)}
              </text>
            ) : null}
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 그래프를 끌면 직선이 따라와요 (기울기는 아래 슬라이더)</p>
        </div>

        {/* 조작 */}
        <div className="space-y-3">
          <RelBadge rel={rel} big />

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Slider label="직선의 기울기 m" value={st.m} min={-3} max={3} step={0.1} onChange={(v) => update({ m: v })} accent="accent-rose-400" />
              <Slider label="y절편 n" value={st.n} min={-9} max={9} step={0.1} onChange={(v) => update({ n: v })} accent="accent-sky-400" />
              <Slider label="원의 반지름 r" value={st.r} min={1} max={8} step={1} onChange={(v) => update({ r: v })} accent="accent-slate-300" />
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setPlaying((v) => !v)}
                  className="flex-1 rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-3 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
                >
                  {playing ? "⏸ 멈춤" : "▶ 직선 지나가기"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowD((v) => !v)}
                  className="rounded-xl border-2 border-amber-400/45 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-400/20"
                >
                  {showD ? "d 숨김" : "d 보기"}
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-amber-400/45 bg-amber-400/10 px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-amber-200">중심에서 직선까지 d</p>
                <p className="mt-0.5 font-mono text-xl font-bold text-amber-100">{fmt(d)}</p>
              </div>
              <div className="rounded-xl border border-slate-300/40 bg-white/5 px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-slate-300">반지름 r</p>
                <p className="mt-0.5 font-mono text-xl font-bold text-white">{st.r.toFixed(2)}</p>
              </div>
            </div>
            {pts.length > 0 ? (
              <p className="mt-2 text-center font-mono text-[11px] text-slate-300">
                교점 {pts.map((p) => `(${nx(p.x)}, ${nx(p.y)})`).join("  ")}
              </p>
            ) : null}
          </div>

          {/* 미션 */}
          <div className={"rounded-2xl border-2 p-4 transition " + (done ? "border-emerald-400/60 bg-emerald-400/12" : "border-violet-400/40 bg-violet-400/[0.08]")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-violet-100">🎖️ 세 가지 위치 관계를 모두 만들어 보세요</p>
              <button
                type="button"
                onClick={() => setSeen([])}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                ↺ 다시
              </button>
            </div>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
              {REL_ORDER.map((r) => {
                const got = seen.includes(r);
                return (
                  <div
                    key={r}
                    className={"rounded-xl border-2 px-2 py-2 text-center text-xs font-bold transition " + (got ? REL_META[r].box + " " + REL_META[r].text : "border-white/10 bg-black/25 text-slate-500")}
                  >
                    <span className="mr-1">{got ? "⭐" : REL_META[r].emoji}</span>
                    {REL_META[r].short}
                  </div>
                );
              })}
            </div>
            {done ? (
              <p className="mt-2 text-center text-xs font-bold text-emerald-200">🎉 완성! 세 가지 말고 다른 경우는 없다는 것도 확인했나요?</p>
            ) : (
              <p className="mt-2 text-center text-[11px] text-slate-400">
                d 와 r 을 견주어 보세요 — 접하게 만들려면 d 를 r 에 아주 가깝게!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 교과서 그림 재현 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="mb-2 text-sm font-bold text-slate-100">🖼️ 기울기가 같은 직선을 나란히 놓으면</p>
          <Plane cid="gal-plane" view={makeView(10)} label="기울기가 같은 세 직선" small>
            <Clipped cid="gal-plane">
              <CircleDraw view={makeView(10)} c={ORIGIN} r={GALLERY_R} color="#e2e8f0" fill="rgba(226,232,240,0.06)" />
              {GALLERY.map((g) => (
                <LineDraw key={g.n} view={makeView(10)} L={lineFromSlope(GALLERY_M, g.n)} color={REL_META[g.rel].color} width={3} />
              ))}
            </Clipped>
            {GALLERY.filter((g) => g.rel !== "none").flatMap((g) =>
              lineCirclePts(lineFromSlope(GALLERY_M, g.n), ORIGIN, GALLERY_R, 1e-6).map((p, i) => (
                <Dot key={`${g.n}-${i}`} view={makeView(10)} p={p} color={REL_META[g.rel].color} r={5} />
              )),
            )}
          </Plane>
        </div>
        <div className="space-y-2">
          {GALLERY.map((g) => (
            <div key={g.n} className={"rounded-xl border-2 px-3 py-2.5 " + REL_META[g.rel].box}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={"text-sm font-extrabold " + REL_META[g.rel].text}>
                  {REL_META[g.rel].emoji} {REL_META[g.rel].label}
                </p>
                <span className="rounded-full bg-black/30 px-2.5 py-0.5 font-mono text-[11px] font-bold text-slate-200">교점 {REL_META[g.rel].count}개</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-300">{g.note}</p>
            </div>
          ))}
          <p className="rounded-xl bg-black/25 px-3 py-2 text-xs leading-6 text-slate-300">
            원의 반지름이 <b className="text-slate-100">3</b> 이고 세 직선의 기울기는 모두 같아요. 달라진 건 <b className="text-sky-200">중심에서 직선까지의 거리 d</b> 하나뿐! 그 거리 하나가
            위치 관계를 결정합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 연립해서 판별식
// ══════════════════════════════════════════════════════════════
function SubTab() {
  const [qi, setQi] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const q = SUB_QS[qi];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧮 연립 → 이차방정식 → 판별식</p>
          <QChips ids={SUB_QS.map((s) => s.id)} cur={qi} solved={solved} onPick={setQi} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <RecipeCard n="1" title="대입" tex="x^2 + (mx + n)^2 = r^2" />
          <RecipeCard n="2" title="정리" tex="(m^2+1)x^2 + 2mnx + n^2 - r^2 = 0" />
          <RecipeCard n="3" title="판별식" tex="\frac{D}{4} = (mn)^2 - (m^2+1)(n^2-r^2)" />
        </div>
      </div>

      <SubOne key={q.id} q={q} onSolved={() => setSolved((s) => (s.includes(q.id) ? s : [...s, q.id]))} />

      {solved.length === SUB_QS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 6문제 완료! 판별식의 부호가 곧 교점의 개수였어요.</p>
          <p className="mt-1 text-xs text-emerald-200/90">D &gt; 0 → 2개 · D = 0 → 1개 · D &lt; 0 → 0개, 그리고 거꾸로도 성립합니다.</p>
        </div>
      ) : null}
    </div>
  );
}

function RecipeCard({ n, title, tex }: { n: string; title: string; tex: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
      <p className="text-[11px] font-bold text-slate-400">
        <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400/25 text-[10px] font-bold text-cyan-100">{n}</span>
        {title}
      </p>
      <div className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-[13px] text-slate-100">
        <Katex expr={tex} />
      </div>
    </div>
  );
}

function SubOne({ q, onSolved }: { q: SubQ; onSolved: () => void }) {
  const [ia, setIa] = useState("");
  const [ib, setIb] = useState("");
  const [ic, setIc] = useState("");
  const [id, setId] = useState("");
  const [pick, setPick] = useState<Rel | null>(null);
  const [hint, setHint] = useState(false);

  const okA = ia === "" ? null : parseNum(ia) === q.a;
  const okB = ib === "" ? null : parseNum(ib) === q.b;
  const okC = ic === "" ? null : parseNum(ic) === q.c;
  const s1 = okA === true && okB === true && okC === true;
  const okD = id === "" ? null : parseNum(id) === q.dq;
  const s2 = s1 && okD === true;
  const s3 = s2 && pick === q.rel;

  const view = makeView(Math.max(Math.sqrt(q.r2) + 2, 6));
  const L = lineFromSlope(q.m, q.n);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* 문제 + 단계 */}
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
          <p className="text-xs font-bold text-cyan-200">문제 — 원과 직선의 위치 관계를 판별식으로 알아내세요</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label="원" tex={circleStdTex(0, 0, q.r2)} />
            <FormulaLine label="직선" tex={`y = ${mxnTex(q.m, q.n)}`} />
          </div>
        </div>

        <Step n={1} title="대입해서 정리한 이차방정식의 계수" state={s1 ? "done" : "open"}>
          <div className="overflow-x-auto overflow-y-hidden py-1 text-[13px] text-slate-200">
            <Katex expr={`x^2 + (${mxnTex(q.m, q.n)})^2 = ${q.r2}`} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-slate-200">
            <NumBox value={ia} onChange={setIa} ok={okA} label="x제곱의 계수" />
            <span className="font-mono text-sm">x²</span>
            <span className="font-mono text-sm">+</span>
            <NumBox value={ib} onChange={setIb} ok={okB} label="x의 계수" />
            <span className="font-mono text-sm">x</span>
            <span className="font-mono text-sm">+</span>
            <NumBox value={ic} onChange={setIc} ok={okC} label="상수항" />
            <span className="font-mono text-sm">= 0</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            {s1 ? "✅ 맞아요!" : "빈칸에 정수를 넣으세요 (부호도 함께)"}
          </p>
        </Step>

        <Step n={2} title="판별식 D/4 의 값" state={s2 ? "done" : s1 ? "open" : "locked"}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="py-1 text-slate-100">
              <Katex expr="\frac{D}{4} =" />
            </span>
            <NumBox value={id} onChange={setId} ok={okD} label="판별식 D/4" width="w-24" />
          </div>
          {hint ? (
            <div className="mt-2 rounded-lg bg-amber-400/12 px-3 py-2 text-[11px] leading-5 text-amber-100">
              <span className="py-1">
                <Katex expr={`\\frac{D}{4} = (${q.b / 2})^2 - (${q.a})(${q.c})`} />
              </span>
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
            <button
              type="button"
              onClick={() => setId(String(q.dq))}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              정답 보기
            </button>
          </div>
        </Step>

        <Step n={3} title="그래서 위치 관계는?" state={s3 ? "done" : s2 ? "open" : "locked"}>
          <RelPicker
            picked={pick}
            answer={q.rel}
            onPick={(r) => {
              setPick(r);
              if (r === q.rel) onSolved();
            }}
          />
          {pick !== null && pick !== q.rel ? <p className="mt-1.5 text-[11px] font-bold text-rose-200">다시 생각해 보세요 — D의 부호를 확인!</p> : null}
        </Step>
      </div>

      {/* 그래프 + 해설 */}
      <div className="space-y-3">
        {s3 ? (
          <>
            <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
              <Plane cid={`sub-plane-${q.id}`} view={view} label="연립 결과">
                <Clipped cid={`sub-plane-${q.id}`}>
                  <CircleDraw view={view} c={ORIGIN} r={Math.sqrt(q.r2)} color="#e2e8f0" fill="rgba(226,232,240,0.06)" />
                  <LineDraw view={view} L={L} color={REL_META[q.rel].color} width={4} />
                </Clipped>
                {q.pts.map((p, i) => (
                  <Dot key={i} view={view} p={p} color={REL_META[q.rel].color} r={7} label={`(${nx(p.x)}, ${nx(p.y)})`} />
                ))}
                <Dot view={view} p={ORIGIN} color="#e2e8f0" r={4} />
              </Plane>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4">
              <p className="text-sm font-bold text-emerald-200">✅ 풀이</p>
              <div className="mt-2 space-y-0.5">
                <FormulaLine label="연립" tex={`x^2 + (${mxnTex(q.m, q.n)})^2 = ${q.r2}`} />
                <FormulaLine label="정리" tex={quadTex(q.a, q.b, q.c)} />
                <FormulaLine label="판별식" tex={`\\frac{D}{4} = (${q.b / 2})^2 - (${q.a})(${q.c}) = ${q.dq}`} big />
              </div>
              <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
                {q.rel === "two" ? (
                  <>
                    D &gt; 0 이므로 <b>서로 다른 두 점</b>에서 만나요. 이차방정식의 두 근이 곧 교점의 x좌표 —{" "}
                    <b className="text-white">x = {q.pts.map((p) => nx(p.x)).join(", ")}</b> 를 직선의 식에 넣으면 교점 {q.pts.map((p) => `(${nx(p.x)}, ${nx(p.y)})`).join(", ")} 를 얻습니다.
                  </>
                ) : q.rel === "tangent" ? (
                  <>
                    D = 0 이므로 <b>한 점에서 접해요</b>. 중근 <b className="text-white">x = {nx(q.pts[0].x)}</b> 하나뿐이라 접점은 ({nx(q.pts[0].x)}, {nx(q.pts[0].y)}) 입니다.
                  </>
                ) : (
                  <>
                    D &lt; 0 이라 실근이 없어요. 만나는 점이 하나도 없으니 원과 직선은 <b>만나지 않습니다</b>.
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
// 탭 ③ 거리로 판정
// ══════════════════════════════════════════════════════════════
function DistTab() {
  const [qi, setQi] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const q = DIST_QS[qi];

  return (
    <div className="space-y-4">
      <DistPlayground />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">📏 거리 공식으로 판정하기</p>
          <QChips ids={DIST_QS.map((s) => s.id)} cur={qi} solved={solved} onPick={setQi} />
        </div>
        <div className="mt-2 overflow-x-auto overflow-y-hidden py-1 text-center text-slate-100">
          <Katex expr="d = \frac{|a p + b q + c|}{\sqrt{a^2 + b^2}}" />
        </div>
        <p className="mt-1 text-center text-[11px] text-slate-400">원 (x−p)² + (y−q)² = r² 의 중심 (p, q) 와 직선 ax + by + c = 0 사이의 거리</p>
      </div>

      <DistOne key={q.id} q={q} onSolved={() => setSolved((s) => (s.includes(q.id) ? s : [...s, q.id]))} />

      {solved.length === DIST_QS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 6문제 완료! 연립하지 않고도 위치 관계를 알 수 있었어요.</p>
          <p className="mt-1 text-xs text-emerald-200/90">d &lt; r → 두 점 · d = r → 접함 · d &gt; r → 만나지 않음</p>
        </div>
      ) : null}
    </div>
  );
}

function DistPlayground() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [c, setC] = useState<Pt>({ x: 1, y: 1 });
  const [r, setR] = useState(4);
  const [m, setM] = useState(0.5);
  const [n, setN] = useState(-3);

  const L = lineFromSlope(m, n);
  const d = distToLine(L, c);
  const rel = relOf(d, r, SIM_EPS);
  const H = footOf(L, c);
  const pts = lineCirclePts(L, c, r, SIM_EPS);
  const view = makeView(Math.max(10, Math.abs(c.x) + r + 2, Math.abs(c.y) + r + 2));

  const stRef = useRef({ m, n });
  useEffect(() => {
    stRef.current = { m, n };
  });

  const { setDragId } = useDrag(svgRef, view, (id, p) => {
    if (id === "c") setC({ x: clampInt(p.x, -6, 6), y: clampInt(p.y, -6, 6) });
    else setN(q10(p.y - stRef.current.m * p.x, -9, 9));
  });

  const maxBar = Math.max(d, r, 1);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid="dist-plane" view={view} svgRef={svgRef} label="중심에서 직선까지의 거리" onGrab={() => setDragId("line")}>
          <Clipped cid="dist-plane">
            <CircleDraw view={view} c={c} r={r} color="#e2e8f0" fill="rgba(226,232,240,0.06)" />
            <LineDraw view={view} L={L} color={REL_META[rel].color} width={4} />
            <line x1={view.sx(c.x)} y1={view.sy(c.y)} x2={view.sx(H.x)} y2={view.sy(H.y)} stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="5 4" />
            <line
              x1={view.sx(c.x)}
              y1={view.sy(c.y)}
              x2={view.sx(c.x + r * Math.SQRT1_2)}
              y2={view.sy(c.y + r * Math.SQRT1_2)}
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="4 3"
            />
          </Clipped>
          <RightAngle view={view} H={H} L={L} />
          {pts.map((p, i) => (
            <Dot key={i} view={view} p={p} color={REL_META[rel].color} r={6} />
          ))}
          <Dot view={view} p={c} color="#e2e8f0" r={6} label={`(${nx(c.x)}, ${nx(c.y)})`} onDown={() => setDragId("c")} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 흰 점(중심)과 직선을 각각 끌어 보세요</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Slider label="반지름 r" value={r} min={1} max={7} step={1} onChange={setR} accent="accent-sky-400" />
            <Slider label="직선의 기울기 m" value={m} min={-3} max={3} step={0.1} onChange={setM} accent="accent-rose-400" />
          </div>
        </div>

        {/* d vs r 막대 */}
        <div className={"rounded-2xl border-2 p-4 " + REL_META[rel].box}>
          <p className="text-sm font-bold text-slate-100">⚖️ d 와 r 을 견주어 보면</p>
          <div className="mt-2 space-y-2">
            <Bar label="d" value={d} max={maxBar} color="bg-amber-400" text="text-amber-100" />
            <Bar label="r" value={r} max={maxBar} color="bg-sky-400" text="text-sky-100" />
          </div>
          <p className={"mt-2 text-center text-lg font-extrabold " + REL_META[rel].text}>
            d {d < r - SIM_EPS ? "<" : d > r + SIM_EPS ? ">" : "="} r → {REL_META[rel].emoji} {REL_META[rel].label}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
          <p className="text-sm font-bold text-emerald-200">🔗 판별식과 같은 이야기</p>
          <div className="mt-1.5 overflow-x-auto overflow-y-hidden py-1 text-slate-100">
            <Katex expr="\frac{D}{4} = (m^2+1)(r^2 - d^2)" />
          </div>
          <p className="mt-1.5 text-xs leading-6 text-slate-300">
            앞의 괄호 <span className="font-mono text-emerald-200">m²+1</span> 은 언제나 양수예요. 그래서 <b className="text-emerald-100">D의 부호</b>와{" "}
            <b className="text-emerald-100">r − d 의 부호</b>가 늘 같습니다 — 두 방법이 같은 답을 주는 이유!
          </p>
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, max, color, text }: { label: string; value: number; max: number; color: string; text: string }) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className={"w-5 shrink-0 font-mono text-sm font-bold " + text}>{label}</span>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-black/40">
        <div className={"h-full rounded-full transition-all " + color} style={{ width: `${pct}%` }} />
      </div>
      <span className={"w-12 shrink-0 text-right font-mono text-xs font-bold " + text}>{fmt(value)}</span>
    </div>
  );
}

function DistOne({ q, onSolved }: { q: DistQ; onSolved: () => void }) {
  const [inNum, setInNum] = useState("");
  const [inDen, setInDen] = useState("");
  const [pick, setPick] = useState<Rel | null>(null);
  const [hint, setHint] = useState(false);

  const okN = inNum === "" ? null : parseNum(inNum) === q.num;
  const okD = inDen === "" ? null : parseNum(inDen) === q.den2;
  const s1 = okN === true && okD === true;
  const s2 = s1 && pick === q.rel;

  const r = Math.sqrt(q.r2);
  const d = q.num / Math.sqrt(q.den2);
  const view = makeView(Math.max(Math.abs(q.center.x) + r + 2, Math.abs(q.center.y) + r + 2, 6));
  const pts = lineCirclePts(q.L, q.center, r, 1e-9);

  const sgn = (v: number) => (v < 0 ? "-" : "+");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
          <p className="text-xs font-bold text-cyan-200">문제 — 중심에서 직선까지의 거리로 판정하세요</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label="원" tex={circleStdTex(q.center.x, q.center.y, q.r2)} />
            <FormulaLine label="직선" tex={lineTex(q.L.a, q.L.b, q.L.c)} />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            중심 ({nx(q.center.x)}, {nx(q.center.y)}) · 반지름{" "}
            <span className="align-middle text-slate-200">
              <Katex expr={`r = ${mulRadTex(1, q.r2)} \\approx ${fmt(r)}`} />
            </span>
          </p>
        </div>

        <Step n={1} title="거리 공식의 분자와 분모 안" state={s1 ? "done" : "open"}>
          <div className="flex flex-wrap items-center gap-2 text-slate-200">
            <span className="py-1">
              <Katex expr="d =" />
            </span>
            <div className="flex flex-col items-center">
              <NumBox value={inNum} onChange={setInNum} ok={okN} label="분자 절댓값" />
              <div className="my-1 h-0.5 w-24 bg-slate-400" />
              <div className="flex items-center gap-1">
                <span className="font-mono text-lg text-slate-200">√</span>
                <NumBox value={inDen} onChange={setInDen} ok={okD} label="분모 근호 안" />
              </div>
            </div>
          </div>
          {hint ? (
            <div className="mt-2 overflow-x-auto overflow-y-hidden rounded-lg bg-amber-400/12 px-3 py-2 text-[12px] text-amber-100">
              <Katex
                expr={`|(${q.L.a})(${q.center.x}) ${sgn(q.L.b)} (${Math.abs(q.L.b)})(${q.center.y}) ${sgn(q.L.c)} ${Math.abs(q.L.c)}| \\;,\\; a^2 + b^2 = (${q.L.a})^2 + (${q.L.b})^2`}
              />
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
            <button
              type="button"
              onClick={() => {
                setInNum(String(q.num));
                setInDen(String(q.den2));
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              정답 보기
            </button>
          </div>
          {s1 ? (
            <div className="mt-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2">
              <div className="overflow-x-auto overflow-y-hidden py-1 text-slate-100">
                <Katex expr={`d = \\frac{${q.num}}{\\sqrt{${q.den2}}} = ${distTex(q.num, q.den2)} \\approx ${fmt(d)}`} />
              </div>
            </div>
          ) : null}
        </Step>

        <Step n={2} title="d 와 r 을 비교하면?" state={s2 ? "done" : s1 ? "open" : "locked"}>
          {s1 ? (
            <div className="mb-2 space-y-2 rounded-lg bg-black/25 px-3 py-2">
              <Bar label="d" value={d} max={Math.max(d, r)} color="bg-amber-400" text="text-amber-100" />
              <Bar label="r" value={r} max={Math.max(d, r)} color="bg-sky-400" text="text-sky-100" />
            </div>
          ) : null}
          <RelPicker
            picked={pick}
            answer={q.rel}
            onPick={(r2) => {
              setPick(r2);
              if (r2 === q.rel) onSolved();
            }}
          />
          {pick !== null && pick !== q.rel ? <p className="mt-1.5 text-[11px] font-bold text-rose-200">막대 길이를 다시 견주어 보세요!</p> : null}
        </Step>
      </div>

      <div className="space-y-3">
        {s2 ? (
          <>
            <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
              <Plane cid={`distq-${q.id}`} view={view} label="거리 판정 결과">
                <Clipped cid={`distq-${q.id}`}>
                  <CircleDraw view={view} c={q.center} r={r} color="#e2e8f0" fill="rgba(226,232,240,0.06)" />
                  <LineDraw view={view} L={q.L} color={REL_META[q.rel].color} width={4} />
                  <line
                    x1={view.sx(q.center.x)}
                    y1={view.sy(q.center.y)}
                    x2={view.sx(footOf(q.L, q.center).x)}
                    y2={view.sy(footOf(q.L, q.center).y)}
                    stroke="#fbbf24"
                    strokeWidth={2.5}
                    strokeDasharray="5 4"
                  />
                </Clipped>
                <RightAngle view={view} H={footOf(q.L, q.center)} L={q.L} />
                {pts.map((p, i) => (
                  <Dot key={i} view={view} p={p} color={REL_META[q.rel].color} r={6} />
                ))}
                <Dot view={view} p={q.center} color="#e2e8f0" r={5} />
              </Plane>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4">
              <p className="text-sm font-bold text-emerald-200">✅ 풀이</p>
              <div className="mt-2 space-y-0.5">
                <FormulaLine label="거리" tex={`d = \\frac{${q.num}}{\\sqrt{${q.den2}}} = ${distTex(q.num, q.den2)} \\approx ${fmt(d)}`} />
                <FormulaLine label="반지름" tex={`r = ${mulRadTex(1, q.r2)} \\approx ${fmt(r)}`} />
                <FormulaLine label="비교" tex={`d ${d < r ? "<" : d > r ? ">" : "="} r`} big />
              </div>
              <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
                {q.rel === "two" ? "중심이 반지름보다 가까이 있으니 직선이 원 안쪽을 가로질러 두 점에서 만나요." : q.rel === "tangent" ? "거리가 반지름과 정확히 같으니 직선이 원에 스치듯 접해요. 접점은 중심에서 내린 수선의 발이에요." : "중심이 반지름보다 멀리 떨어져 있으니 직선이 원을 비껴갑니다."}
              </p>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
                💡 근호가 있는 수끼리 비교가 어려우면 <b className="text-slate-200">양변을 제곱</b>해 d² = {q.num}²/{q.den2} 와 r² = {q.r2} 을 견주면 정확해요.
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
// 탭 ④ 현의 길이
// ══════════════════════════════════════════════════════════════
const CHORD_TARGETS = [6, 8];

function ChordTab() {
  const [qi, setQi] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const q = CHORD_QS[qi];

  return (
    <div className="space-y-4">
      <ChordPlayground />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✂️ 현의 길이 구하기</p>
          <QChips ids={CHORD_QS.map((s) => s.id)} cur={qi} solved={solved} onPick={setQi} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <RecipeCard n="1" title="중심에서 직선까지의 거리" tex="d = \frac{|ap + bq + c|}{\sqrt{a^2+b^2}}" />
          <RecipeCard n="2" title="피타고라스의 정리" tex="\overline{AH} = \sqrt{r^2 - d^2}" />
          <RecipeCard n="3" title="현의 길이" tex="\overline{AB} = 2\,\overline{AH} = 2\sqrt{r^2 - d^2}" />
        </div>
        <p className="mt-2 rounded-lg border border-amber-400/40 bg-amber-400/[0.10] px-3 py-2 text-[11px] leading-6 text-amber-100">
          ⚠️ 마지막 줄에서 <b>2를 빠뜨리기 쉬워요</b>. H는 현의 <b>중점</b>이므로 AH는 현의 <b>절반</b>! 반드시 2를 곱해야 현 AB의 길이가 됩니다.
        </p>
      </div>

      <ChordOne key={q.id} q={q} onSolved={() => setSolved((s) => (s.includes(q.id) ? s : [...s, q.id]))} />

      <ChordBonus />
    </div>
  );
}

function ChordPlayground() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [r, setR] = useState(5);
  const [m, setM] = useState(0.5);
  const [n, setN] = useState(3);
  const [cleared, setCleared] = useState<number[]>([]);

  const L = lineFromSlope(m, n);
  const d = distToLine(L, ORIGIN);
  const H = footOf(L, ORIGIN);
  const pts = lineCirclePts(L, ORIGIN, r, SIM_EPS);
  const half = d < r ? Math.sqrt(Math.max(0, r * r - d * d)) : 0;
  const chord = 2 * half;
  const view = makeView(Math.max(r + 2, 10));

  const stRef = useRef({ m, r });
  useEffect(() => {
    stRef.current = { m, r };
  });

  function record(nchord: number) {
    for (const t of CHORD_TARGETS) {
      if (Math.abs(nchord - t) < 0.12) setCleared((old) => (old.includes(t) ? old : [...old, t]));
    }
    if (Math.abs(nchord - 2 * stRef.current.r) < 0.12) setCleared((old) => (old.includes(0) ? old : [...old, 0]));
  }
  function setLine(nm: number, nn: number) {
    setM(nm);
    setN(nn);
    const nl = lineFromSlope(nm, nn);
    const nd = distToLine(nl, ORIGIN);
    record(nd < stRef.current.r ? 2 * Math.sqrt(Math.max(0, stRef.current.r ** 2 - nd * nd)) : 0);
  }

  const { setDragId } = useDrag(svgRef, view, (id, p) => {
    if (id !== "line") return;
    setLine(stRef.current.m, q10(p.y - stRef.current.m * p.x, -9, 9));
  });

  const A = pts[0];
  const B = pts[1];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid="chord-plane" view={view} svgRef={svgRef} label="현의 길이" onGrab={() => setDragId("line")}>
          <Clipped cid="chord-plane">
            <CircleDraw view={view} c={ORIGIN} r={r} color="#e2e8f0" fill="rgba(226,232,240,0.06)" />
            <LineDraw view={view} L={L} color="#94a3b8" width={2} dash="6 5" />
            {A && B ? <line x1={view.sx(A.x)} y1={view.sy(A.y)} x2={view.sx(B.x)} y2={view.sy(B.y)} stroke="#f472b6" strokeWidth={5} strokeLinecap="round" /> : null}
            <line x1={view.sx(0)} y1={view.sy(0)} x2={view.sx(H.x)} y2={view.sy(H.y)} stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="5 4" />
            {A ? <line x1={view.sx(0)} y1={view.sy(0)} x2={view.sx(A.x)} y2={view.sy(A.y)} stroke="#38bdf8" strokeWidth={2.5} strokeDasharray="4 3" /> : null}
          </Clipped>
          <RightAngle view={view} H={H} L={L} />
          {A ? <Dot view={view} p={A} color="#f472b6" r={6} label="A" /> : null}
          {B ? <Dot view={view} p={B} color="#f472b6" r={6} label="B" /> : null}
          <Dot view={view} p={H} color="#fbbf24" r={5} label="H" />
          <Dot view={view} p={ORIGIN} color="#e2e8f0" r={5} label="C" />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 그래프를 끌어 직선을 옮겨 보세요</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Slider label="반지름 r" value={r} min={3} max={8} step={1} onChange={(v) => { setR(v); setCleared([]); }} accent="accent-slate-300" />
            <Slider label="직선의 기울기 m" value={m} min={-3} max={3} step={0.1} onChange={(v) => setLine(v, n)} accent="accent-rose-400" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Cell label="거리 d" value={fmt(d)} tone="amber" />
            <Cell label="반현 AH" value={fmt(half)} tone="sky" />
            <Cell label="현 AB" value={fmt(chord)} tone="pink" />
          </div>
          <div className="mt-2 overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2 text-center text-slate-100">
            <Katex expr={`${fmt(d)}^2 + ${fmt(half)}^2 = ${fmt(r * r, 1)} = r^2`} />
          </div>
        </div>

        {/* 미션 */}
        <div className="rounded-2xl border-2 border-violet-400/40 bg-violet-400/[0.08] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-violet-100">🎯 현의 길이를 맞춰라</p>
            <button
              type="button"
              onClick={() => setCleared([])}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 다시
            </button>
          </div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
            {[...CHORD_TARGETS, 0].map((t) => {
              const got = cleared.includes(t);
              const label = t === 0 ? `지름 = ${2 * r}` : `AB = ${t}`;
              const possible = t === 0 || t <= 2 * r;
              return (
                <div
                  key={t}
                  className={
                    "rounded-xl border-2 px-2 py-2 text-center text-xs font-bold transition " +
                    (got ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : possible ? "border-white/10 bg-black/25 text-slate-400" : "border-white/5 bg-black/20 text-slate-600")
                  }
                >
                  {got ? "⭐ " : ""}
                  {label}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            {cleared.length >= 3 ? "🎉 전부 성공! 현이 가장 길 때가 언제였나요?" : "직선을 끌어 분홍 현의 길이를 맞춰 보세요 (오차 0.1 이내)"}
          </p>
        </div>

        <ChordCurve r={r} d={Math.min(d, r)} />
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone: "amber" | "sky" | "pink" }) {
  const cls =
    tone === "amber"
      ? "border-amber-400/45 bg-amber-400/10 text-amber-100"
      : tone === "sky"
        ? "border-sky-400/45 bg-sky-400/10 text-sky-100"
        : "border-pink-400/45 bg-pink-400/10 text-pink-100";
  return (
    <div className={"rounded-xl border px-2 py-2 text-center " + cls}>
      <p className="text-[10px] font-bold opacity-85">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-bold">{value}</p>
    </div>
  );
}

/** d 가 커질수록 현이 짧아지는 관계 그래프 */
function ChordCurve({ r, d }: { r: number; d: number }) {
  const W = 300;
  const Hh = 170;
  const ml = 34;
  const mb = 26;
  const px = (v: number) => ml + (v / r) * (W - ml - 14);
  const py = (v: number) => Hh - mb - (v / (2 * r)) * (Hh - mb - 14);
  const path: string[] = [];
  for (let i = 0; i <= 48; i++) {
    const dd = (r * i) / 48;
    const l = 2 * Math.sqrt(Math.max(0, r * r - dd * dd));
    path.push(`${i === 0 ? "M" : "L"}${px(dd).toFixed(1)},${py(l).toFixed(1)}`);
  }
  const cur = 2 * Math.sqrt(Math.max(0, r * r - d * d));

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
      <p className="text-sm font-bold text-slate-100">📉 거리 d 가 커지면 현은?</p>
      <svg viewBox={`0 0 ${W} ${Hh}`} className="mx-auto mt-1 block w-full max-w-[320px]" role="img" aria-label="거리와 현의 길이 관계">
        <line x1={ml} y1={Hh - mb} x2={W - 8} y2={Hh - mb} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
        <line x1={ml} y1={Hh - mb} x2={ml} y2={8} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
        <path d={path.join(" ")} fill="none" stroke="#f472b6" strokeWidth={3} />
        <line x1={px(d)} y1={py(cur)} x2={px(d)} y2={Hh - mb} stroke="rgba(251,191,36,0.55)" strokeDasharray="4 3" strokeWidth={1.5} />
        <line x1={ml} y1={py(cur)} x2={px(d)} y2={py(cur)} stroke="rgba(244,114,182,0.55)" strokeDasharray="4 3" strokeWidth={1.5} />
        <circle cx={px(d)} cy={py(cur)} r={6} fill="#f472b6" stroke="#0f172a" strokeWidth={2} />
        <text x={ml - 5} y={py(2 * r) + 4} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">
          {2 * r}
        </text>
        <text x={ml - 5} y={Hh - mb + 4} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">
          0
        </text>
        <text x={px(r)} y={Hh - mb + 14} textAnchor="middle" className="fill-slate-400 font-mono text-[9px]">
          {r}
        </text>
        <text x={W - 8} y={Hh - mb + 14} textAnchor="end" className="fill-slate-400 text-[10px] italic">
          d
        </text>
        <text x={ml + 4} y={14} className="fill-pink-300 text-[10px] font-bold">
          AB
        </text>
      </svg>
      <p className="mt-1 text-center text-[11px] leading-5 text-slate-300">
        d = 0 일 때 현이 <b className="text-pink-200">지름 {2 * r}</b> 으로 가장 길고, d = r 이 되면 <b className="text-emerald-200">0</b> (접함) 이 돼요.
      </p>
    </div>
  );
}

function ChordOne({ q, onSolved }: { q: ChordQ; onSolved: () => void }) {
  const [id2, setId2] = useState("");
  const [ih, setIh] = useState("");
  const [pick, setPick] = useState<number | null>(null);
  const [hint, setHint] = useState(false);

  const okD = id2 === "" ? null : parseNum(id2) === q.d2;
  const okH = ih === "" ? null : parseNum(ih) === q.half2;
  const s1 = okD === true;
  const s2 = s1 && okH === true;
  const s3 = s2 && pick === q.ans;

  const r = Math.sqrt(q.r2);
  const pts = lineCirclePts(q.L, q.center, r, 1e-9);
  const H = footOf(q.L, q.center);
  const view = makeView(Math.max(Math.abs(q.center.x) + r + 2, Math.abs(q.center.y) + r + 2, 6));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
          <p className="text-xs font-bold text-cyan-200">문제 — 원과 직선이 만나 생기는 현의 길이를 구하세요</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label="원" tex={circleStdTex(q.center.x, q.center.y, q.r2)} />
            <FormulaLine label="직선" tex={lineTex(q.L.a, q.L.b, q.L.c)} />
          </div>
        </div>

        <Step n={1} title="중심에서 직선까지의 거리를 제곱한 값 d²" state={s1 ? "done" : "open"}>
          <div className="flex flex-wrap items-center gap-2 text-slate-200">
            <span className="py-1">
              <Katex expr="d^2 =" />
            </span>
            <NumBox value={id2} onChange={setId2} ok={okD} label="d의 제곱" />
          </div>
          {hint ? (
            <div className="mt-2 overflow-x-auto overflow-y-hidden rounded-lg bg-amber-400/12 px-3 py-2 text-[12px] text-amber-100">
              <Katex expr={`d = \\frac{${q.num}}{\\sqrt{${q.den2}}} = ${distTex(q.num, q.den2)}`} />
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
            <button
              type="button"
              onClick={() => setId2(String(q.d2))}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              정답 보기
            </button>
          </div>
        </Step>

        <Step n={2} title="피타고라스의 정리로 반현의 제곱 AH² = r² − d²" state={s2 ? "done" : s1 ? "open" : "locked"}>
          <div className="flex flex-wrap items-center gap-2 text-slate-200">
            <span className="py-1">
              <Katex expr={`\\overline{AH}^2 = ${q.r2} - ${q.d2} =`} />
            </span>
            <NumBox value={ih} onChange={setIh} ok={okH} label="반현의 제곱" />
          </div>
        </Step>

        <Step n={3} title="그래서 현 AB 의 길이는?" state={s3 ? "done" : s2 ? "open" : "locked"}>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {q.choices.map((ch, i) => {
              const on = pick === i;
              const good = pick !== null && i === q.ans;
              const bad = on && i !== q.ans;
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => {
                    setPick(i);
                    if (i === q.ans) onSolved();
                  }}
                  disabled={pick === q.ans}
                  className={
                    "rounded-xl border-2 px-3 py-2 text-center transition disabled:cursor-default " +
                    (good
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : bad
                        ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  <span className="py-1 text-base">
                    <Katex expr={ch} />
                  </span>
                </button>
              );
            })}
          </div>
          {pick !== null && pick !== q.ans ? <p className="mt-1.5 text-[11px] font-bold text-rose-200">앗! AH는 현의 절반이에요 — 2를 곱했나요?</p> : null}
          <p className="mt-1.5 text-[11px] text-slate-400">💡 {q.tip}</p>
        </Step>
      </div>

      <div className="space-y-3">
        {s3 ? (
          <>
            <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
              <Plane cid={`chordq-${q.id}`} view={view} label="현의 길이">
                <Clipped cid={`chordq-${q.id}`}>
                  <CircleDraw view={view} c={q.center} r={r} color="#e2e8f0" fill="rgba(226,232,240,0.06)" />
                  <LineDraw view={view} L={q.L} color="#94a3b8" width={2} dash="6 5" />
                  {pts.length === 2 ? (
                    <line x1={view.sx(pts[0].x)} y1={view.sy(pts[0].y)} x2={view.sx(pts[1].x)} y2={view.sy(pts[1].y)} stroke="#f472b6" strokeWidth={5} strokeLinecap="round" />
                  ) : null}
                  <line x1={view.sx(q.center.x)} y1={view.sy(q.center.y)} x2={view.sx(H.x)} y2={view.sy(H.y)} stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="5 4" />
                  {pts.length === 2 ? (
                    <line x1={view.sx(q.center.x)} y1={view.sy(q.center.y)} x2={view.sx(pts[0].x)} y2={view.sy(pts[0].y)} stroke="#38bdf8" strokeWidth={2.5} strokeDasharray="4 3" />
                  ) : null}
                </Clipped>
                <RightAngle view={view} H={H} L={q.L} />
                {pts[0] ? <Dot view={view} p={pts[0]} color="#f472b6" r={6} label="A" /> : null}
                {pts[1] ? <Dot view={view} p={pts[1]} color="#f472b6" r={6} label="B" /> : null}
                <Dot view={view} p={H} color="#fbbf24" r={5} label="H" />
                <Dot view={view} p={q.center} color="#e2e8f0" r={5} label="C" />
              </Plane>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4">
              <p className="text-sm font-bold text-emerald-200">✅ 풀이</p>
              <div className="mt-2 space-y-0.5">
                <FormulaLine label="거리" tex={`d = \\frac{${q.num}}{\\sqrt{${q.den2}}} = ${distTex(q.num, q.den2)}`} />
                <FormulaLine label="반현" tex={`\\overline{AH} = \\sqrt{${q.r2} - ${q.d2}} = ${mulRadTex(1, q.half2)}`} />
                <FormulaLine label="현" tex={`\\overline{AB} = 2\\,\\overline{AH} = ${q.choices[q.ans]}`} big />
              </div>
              <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
                {q.d2 === 0
                  ? "직선이 중심을 지나므로 d = 0 — 이때 현은 원에서 가장 긴 지름이 됩니다."
                  : "중심 C, 수선의 발 H, 교점 A 로 만든 직각삼각형에서 CH = d, CA = r 이므로 AH² = r² − d². H가 현의 중점이라 AB = 2AH 예요."}
              </p>
            </div>
          </>
        ) : (
          <Locked text={"세 단계를 모두 맞히면\n그림과 풀이가 열려요"} />
        )}
      </div>
    </div>
  );
}

function ChordBonus() {
  const [pick, setPick] = useState<number | null>(null);
  const ok = pick === CHORD_BONUS.ans;
  return (
    <div className="rounded-2xl border-2 border-violet-400/45 bg-violet-400/[0.10] p-4">
      <p className="text-sm font-bold text-violet-100">🏅 도전 — 거꾸로 생각하기</p>
      <div className="mt-2 space-y-0.5">
        <FormulaLine label="원" tex={circleStdTex(0, 0, CHORD_BONUS.r2)} />
        <FormulaLine label="직선" tex="y = k" />
      </div>
      <p className="mt-1 text-xs leading-6 text-slate-200">
        이 원과 직선이 만나 생기는 현의 길이가 <b className="text-pink-200">{CHORD_BONUS.chord}</b> 일 때, 상수 k 의 값은?
      </p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-4">
        {CHORD_BONUS.choices.map((ch, i) => {
          const on = pick === i;
          const good = pick !== null && i === CHORD_BONUS.ans;
          const bad = on && i !== CHORD_BONUS.ans;
          return (
            <button
              key={ch}
              type="button"
              onClick={() => setPick(i)}
              disabled={ok}
              className={
                "rounded-xl border-2 px-3 py-2 text-center transition disabled:cursor-default " +
                (good
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : bad
                    ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              <span className="py-1">
                <Katex expr={ch} />
              </span>
            </button>
          );
        })}
      </div>
      {ok ? (
        <div className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2">
          <div className="space-y-0.5">
            <FormulaLine label="반현" tex="\overline{AH} = 4" />
            <FormulaLine label="관계" tex="4^2 = 25 - d^2 \Rightarrow d^2 = 9" />
            <FormulaLine label="답" tex="d = |k| = 3 \Rightarrow k = \pm 3" big />
          </div>
          <p className="mt-1 text-[11px] leading-5 text-emerald-100">직선 y = k 와 원점 사이의 거리는 |k| 예요. 위쪽·아래쪽 두 직선 모두 답이 됩니다.</p>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-slate-400">💡 현의 길이 → 반현 → r² − d² → d 순서로 거꾸로 따라가 보세요.</p>
      )}
    </div>
  );
}
