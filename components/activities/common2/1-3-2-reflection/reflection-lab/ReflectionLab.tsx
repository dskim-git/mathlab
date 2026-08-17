"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  COMPOSE,
  EQ_QS,
  FIGS,
  GAME_QS,
  SYM_META,
  SYM_ORDER,
  SYM_ROUNDS,
  applySym,
  dist,
  figCurves,
  footOn,
  isCollinear,
  isPerp,
  midPt,
  nz,
  onLine,
  ptTex,
  reflectAboutLine,
  reflectAboutPoint,
  type EqQ,
  type GameQ,
  type Line,
  type Pt,
  type Sym,
  type SymRound,
  type SymState,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "two_kinds",
    prompt:
      "점대칭과 선대칭은 각각 어떤 조건을 만족해야 하나요? 탭①에서 점을 직접 놓아 보며 확인한 조건을 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 점대칭은 P, O, P′이 한 직선 위에 있고 OP = OP′이어야 한다. 곧 O가 PP′의 중점이다. 선대칭은 직선 l이 PP′를 수직이등분해야 해서, l과 PP′가 수직이고 PP′의 중점이 l 위에 있어야 한다.",
  },
  {
    id: "compose",
    prompt:
      "탭②의 버튼 게임에서 원점 대칭 버튼 없이도 원점 대칭 자리에 갈 수 있었어요. 어떻게 갔는지, 그리고 같은 버튼을 두 번 누르면 왜 제자리로 돌아오는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: x축 대칭을 한 뒤 y축 대칭을 하면 (x, y) → (x, −y) → (−x, −y) 가 되어 원점 대칭과 같아진다. 같은 버튼을 두 번 누르면 바꾼 부호를 다시 바꾸는 셈이라 처음 좌표로 돌아온다.",
  },
  {
    id: "figure_rule",
    prompt:
      "평행이동에서는 점은 x + a 인데 도형의 식은 x − a 였죠. 대칭이동에서는 점과 도형의 계산이 어땠나요? 그 까닭도 함께 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 대칭이동은 점도 (x, −y), 도형도 f(x, −y) = 0 으로 계산이 똑같았다. 대칭이동은 두 번 하면 제자리로 돌아오는 이동이라 되돌리는 식과 옮기는 식이 같기 때문이다.",
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

function Poly({ view, curves, color, width = 3, dash, opacity = 1 }: { view: View; curves: Pt[][]; color: string; width?: number; dash?: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      {curves.map((c, i) => (
        <polyline
          key={i}
          points={c.map((p) => `${view.sx(p.x).toFixed(1)},${view.sy(p.y).toFixed(1)}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeDasharray={dash}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
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

function Dot({ view, p, color, label, onDown, r = 6, hollow }: { view: View; p: Pt; color: string; label?: string; onDown?: () => void; r?: number; hollow?: boolean }) {
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
      <circle cx={view.sx(p.x)} cy={view.sy(p.y)} r={r} fill={hollow ? "#0f172a" : color} stroke={color} strokeWidth={hollow ? 3 : 2} />
      {label ? (
        <text x={view.sx(p.x)} y={view.sy(p.y) - 12} textAnchor="middle" className="fill-white font-mono text-[10px] font-bold">
          {label}
        </text>
      ) : null}
    </g>
  );
}

/** 선분 위 두 곳에 같은 길이 표시(이중 빗금) */
function Ticks({ view, A, B, color }: { view: View; A: Pt; B: Pt; color: string }) {
  const x1 = view.sx(A.x);
  const y1 = view.sy(A.y);
  const x2 = view.sx(B.x);
  const y2 = view.sy(B.y);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 8) return null;
  const nx = -dy / len;
  const ny = dx / len;
  const at = (t: number) => ({ x: x1 + dx * t, y: y1 + dy * t });
  const S = 5;
  return (
    <g>
      {[0.25, 0.75].map((t) => {
        const c = at(t);
        return <line key={t} x1={c.x - nx * S} y1={c.y - ny * S} x2={c.x + nx * S} y2={c.y + ny * S} stroke={color} strokeWidth={2.5} />;
      })}
    </g>
  );
}

/** 직각 표시 */
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

function Arrow({ view, A, B, color }: { view: View; A: Pt; B: Pt; color: string }) {
  const x1 = view.sx(A.x);
  const y1 = view.sy(A.y);
  const x2 = view.sx(B.x);
  const y2 = view.sy(B.y);
  if (Math.hypot(x2 - x1, y2 - y1) < 2) return null;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const L = 9;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5} />
      <path d={`M${x2},${y2} L${x2 - L * Math.cos(ang - 0.4)},${y2 - L * Math.sin(ang - 0.4)} L${x2 - L * Math.cos(ang + 0.4)},${y2 - L * Math.sin(ang + 0.4)} Z`} fill={color} />
    </g>
  );
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
function samePt(a: Pt, b: Pt): boolean {
  return a.x === b.x && a.y === b.y;
}

// ─── 공통 UI ──────────────────────────────────────────────────
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

function Chips({ ids, cur, done, onPick, emojis }: { ids: string[]; cur: number; done: string[]; onPick: (i: number) => void; emojis?: string[] }) {
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
          {done.includes(id) && i !== cur ? "✓" : (emojis?.[i] ?? String(i + 1))}
        </button>
      ))}
      <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300">
        {done.length} / {ids.length}
      </span>
    </div>
  );
}

function Check({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className={"flex items-center gap-2 rounded-xl border px-3 py-2 transition " + (ok ? "border-emerald-400/50 bg-emerald-400/[0.12]" : "border-white/10 bg-black/25")}>
      <span className={"inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold " + (ok ? "bg-emerald-400/30 text-emerald-100" : "bg-white/10 text-slate-500")}>
        {ok ? "✓" : "?"}
      </span>
      <span className={"text-xs leading-5 " + (ok ? "font-bold text-emerald-100" : "text-slate-400")}>{text}</span>
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "concept" | "point" | "figure";

export default function ReflectionLab() {
  const [tab, setTab] = useState<Tab>("concept");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🪞 대칭이동</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-amber-200">점</b>을 기준으로 뒤집을까요, <b className="text-emerald-200">직선</b>을 기준으로 접을까요? 조건을 손으로 맞춰 본 뒤 좌표와 식으로 옮겨 봅시다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "concept"} onClick={() => setTab("concept")}>
          ① 점대칭 · 선대칭 🎯
        </TabButton>
        <TabButton active={tab === "point"} onClick={() => setTab("point")}>
          ② 점 뒤집기 게임 🎮
        </TabButton>
        <TabButton active={tab === "figure"} onClick={() => setTab("figure")}>
          ③ 도형 뒤집기 🪞
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "concept" ? <ConceptTab /> : null}
        {tab === "point" ? <PointTab /> : null}
        {tab === "figure" ? <FigureTab /> : null}
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
// 탭 ① 점대칭 · 선대칭
// ══════════════════════════════════════════════════════════════
function ConceptTab() {
  const [ri, setRi] = useState(0);
  const [cleared, setCleared] = useState<string[]>([]);
  const R = SYM_ROUNDS[ri];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎯 대칭이동한 점 P′ 를 직접 놓아 보세요</p>
          <Chips ids={SYM_ROUNDS.map((x) => x.id)} cur={ri} done={cleared} onPick={setRi} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-400/35 bg-amber-400/[0.08] px-3 py-2">
            <p className="text-[11px] font-bold text-amber-200">🔘 점대칭 — 점 O 에 대해</p>
            <p className="mt-1 text-xs leading-6 text-slate-200">① P, O, P′ 이 한 직선 위 ② OP = OP′ → O 가 PP′ 의 중점</p>
          </div>
          <div className="rounded-xl border border-emerald-400/35 bg-emerald-400/[0.08] px-3 py-2">
            <p className="text-[11px] font-bold text-emerald-200">📏 선대칭 — 직선 l 에 대해</p>
            <p className="mt-1 text-xs leading-6 text-slate-200">① l ⊥ PP′ ② PP′ 의 중점이 l 위 → l 이 PP′ 의 수직이등분선</p>
          </div>
        </div>
      </div>

      <ConceptOne key={R.id} R={R} onCleared={() => setCleared((s) => (s.includes(R.id) ? s : [...s, R.id]))} />
    </div>
  );
}

function ConceptOne({ R, onCleared }: { R: SymRound; onCleared: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [P, setP] = useState<Pt>(R.P0);
  const [Q, setQ] = useState<Pt>({ x: -R.P0.x + 1, y: -R.P0.y - 1 });
  const [mirror, setMirror] = useState(false);

  const view = makeView(6);
  const { setDragId } = useDrag(svgRef, view, (id, p) => {
    if (id === "P") setP(snap(p));
    else setQ(snap(p));
  });

  const raw = R.kind === "point" ? reflectAboutPoint(P, R.O) : reflectAboutLine(P, R.L);
  const ans: Pt = { x: Math.round(raw.x), y: Math.round(raw.y) };
  const shown = mirror ? ans : Q;
  const good = samePt(shown, ans);
  const M = midPt(P, shown);

  const c1 = R.kind === "point" ? isCollinear(P, R.O, shown) && !samePt(shown, P) : isPerp(R.L, P, shown);
  const c2 = R.kind === "point" ? Math.abs(dist(P, R.O) - dist(shown, R.O)) < 1e-9 && !samePt(shown, P) : onLine(R.L, M) && !samePt(shown, P);

  const doneRef = useRef(false);
  useEffect(() => {
    if (good && !mirror && !doneRef.current) {
      doneRef.current = true;
      onCleared();
    }
  });

  const H = R.kind === "line" ? footOn(R.L, P) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={"rounded-2xl border p-3 transition " + (good ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04]")}>
        <Plane cid={`con-${R.id}`} view={view} svgRef={svgRef} label={R.label}>
          <Clipped cid={`con-${R.id}`}>
            {R.kind === "line" ? <LineDraw view={view} L={R.L} color="#34d399" width={3} /> : null}
            <line x1={view.sx(P.x)} y1={view.sy(P.y)} x2={view.sx(shown.x)} y2={view.sy(shown.y)} stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="6 4" />
            {R.kind === "point" ? (
              <>
                <Ticks view={view} A={P} B={R.O} color="#fbbf24" />
                <Ticks view={view} A={R.O} B={shown} color="#fbbf24" />
              </>
            ) : (
              <>
                <Ticks view={view} A={P} B={M} color="#fbbf24" />
                <Ticks view={view} A={M} B={shown} color="#fbbf24" />
              </>
            )}
          </Clipped>
          {R.kind === "line" && H ? <RightAngle view={view} H={M} L={R.L} /> : null}
          {R.kind === "point" ? (
            <Dot view={view} p={R.O} color="#e2e8f0" r={6} label={`O${ptTex(R.O)}`} />
          ) : (
            <Dot view={view} p={M} color="#34d399" r={5} label="M" />
          )}
          <Dot view={view} p={P} color="#94a3b8" r={7} label={`P(${nz(P.x)}, ${nz(P.y)})`} onDown={() => setDragId("P")} />
          <Dot
            view={view}
            p={shown}
            color={good ? "#34d399" : "#f472b6"}
            r={7}
            label={`P′(${nz(shown.x)}, ${nz(shown.y)})`}
            onDown={mirror ? undefined : () => setDragId("Q")}
          />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          {mirror ? "🪞 자동 거울이 켜져 있어요 — P 를 끌어 관찰해 보세요" : "🖱️ 분홍 점 P′ 를 끌어 알맞은 자리에 놓으세요 (P 도 옮길 수 있어요)"}
        </p>
      </div>

      <div className="space-y-3">
        <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (good ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
          <p className="text-[11px] font-bold text-slate-300">{R.kind === "point" ? "🔘 점대칭" : "📏 선대칭"}</p>
          <p className={"mt-0.5 text-base font-extrabold " + (good ? "text-emerald-100" : "text-slate-200")}>{R.label}</p>
          {R.kind === "line" ? (
            <div className="mt-1 flex justify-center">
              <Katex expr={`l : ${R.lTex}`} />
            </div>
          ) : null}
          <p className={"mt-1 text-sm font-extrabold " + (good ? "text-emerald-200" : "text-slate-500")}>
            {good ? "✨ 정확해요!" : samePt(shown, P) ? "P 와 같은 자리예요" : "아직이에요 — 조건을 확인해 보세요"}
          </p>
        </div>

        <div className="space-y-1.5">
          <Check ok={c1} text={R.kind === "point" ? "세 점 P, O, P′ 이 한 직선 위에 있어요" : "직선 l 과 선분 PP′ 이 수직이에요"} />
          <Check ok={c2} text={R.kind === "point" ? "OP = OP′ (O 가 PP′ 의 중점)" : "PP′ 의 중점 M 이 l 위에 있어요 (MP = MP′)"} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="grid grid-cols-2 gap-2">
            <MiniCell label={R.kind === "point" ? "OP" : "MP"} value={dist(P, R.kind === "point" ? R.O : M).toFixed(2)} tone="amber" />
            <MiniCell label={R.kind === "point" ? "OP′" : "MP′"} value={dist(shown, R.kind === "point" ? R.O : M).toFixed(2)} tone="pink" />
          </div>
          <button
            type="button"
            onClick={() => setMirror((v) => !v)}
            className="mt-3 w-full rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-3 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
          >
            {mirror ? "🔌 자동 거울 끄기" : "🪞 자동 거울 켜기 (답 보기)"}
          </button>
          <p className="mt-1.5 text-center text-[11px] text-slate-400">자동 거울로 규칙을 먼저 살펴본 뒤 직접 맞춰 보세요</p>
        </div>

        {good && !mirror ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4">
            <p className="text-sm font-bold text-emerald-200">✅ 좌표로 보면</p>
            <div className="mt-1 space-y-0.5">
              <FormulaLine label="P" tex={ptTex(P)} />
              <FormulaLine label="P′" tex={ptTex(ans)} big />
            </div>
            <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
              {R.kind === "point" ? (
                <>
                  O 가 중점이므로 <b>P′ = 2O − P</b> 예요. P 를 다른 자리로 옮겨 한 번 더 확인해 보세요!
                </>
              ) : (
                <>
                  P 에서 l 에 내린 수선을 그대로 반대편으로 같은 길이만큼 연장한 자리예요. P 를 옮겨 또 해 보세요!
                </>
              )}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MiniCell({ label, value, tone }: { label: string; value: string; tone: "amber" | "pink" | "sky" | "violet" }) {
  const cls =
    tone === "amber"
      ? "border-amber-400/45 bg-amber-400/10 text-amber-100"
      : tone === "pink"
        ? "border-pink-400/45 bg-pink-400/10 text-pink-100"
        : tone === "sky"
          ? "border-sky-400/45 bg-sky-400/10 text-sky-100"
          : "border-violet-400/45 bg-violet-400/10 text-violet-100";
  return (
    <div className={"rounded-xl border px-2 py-2 text-center " + cls}>
      <p className="text-[10px] font-bold opacity-85">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-bold">{value}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 점 뒤집기 게임
// ══════════════════════════════════════════════════════════════
function PointTab() {
  const [gi, setGi] = useState(0);
  const [cleared, setCleared] = useState<string[]>([]);
  const g = GAME_QS[gi];

  return (
    <div className="space-y-4">
      <PointPlay />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎮 버튼을 눌러 ⭐ 목표 자리에 도착하세요</p>
          <Chips ids={GAME_QS.map((x) => x.id)} cur={gi} done={cleared} onPick={setGi} />
        </div>
      </div>

      <GameOne key={g.id} g={g} onCleared={() => setCleared((s) => (s.includes(g.id) ? s : [...s, g.id]))} />

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { e: "🔁", t: "같은 버튼 두 번", d: "제자리로 돌아와요" },
          { e: "➕", t: "x축 → y축", d: "원점 대칭과 같아요" },
          { e: "🔀", t: "순서를 바꿔도", d: "결과가 같아요" },
        ].map((c) => (
          <div key={c.t} className="rounded-xl border border-violet-400/30 bg-violet-400/[0.08] px-3 py-2.5 text-center">
            <p className="text-lg">{c.e}</p>
            <p className="text-xs font-bold text-violet-100">{c.t}</p>
            <p className="mt-0.5 text-[11px] text-slate-300">{c.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PointPlay() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [P, setP] = useState<Pt>({ x: 3, y: 2 });

  const view = makeView(6);
  const { setDragId } = useDrag(svgRef, view, (_id, p) => setP(snap(p, -5, 5)));

  const imgs: { s: Sym; p: Pt }[] = SYM_ORDER.map((s) => ({ s, p: applySym(P, s) }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid="pt-play" view={view} svgRef={svgRef} label="한 점의 세 가지 대칭">
          <Clipped cid="pt-play">
            <line x1={view.sx(P.x)} y1={view.sy(P.y)} x2={view.sx(P.x)} y2={view.sy(-P.y)} stroke={SYM_META.x.color} strokeWidth={2} strokeDasharray="5 4" />
            <line x1={view.sx(P.x)} y1={view.sy(P.y)} x2={view.sx(-P.x)} y2={view.sy(P.y)} stroke={SYM_META.y.color} strokeWidth={2} strokeDasharray="5 4" />
            <line x1={view.sx(P.x)} y1={view.sy(P.y)} x2={view.sx(-P.x)} y2={view.sy(-P.y)} stroke={SYM_META.o.color} strokeWidth={2} strokeDasharray="5 4" />
            <Ticks view={view} A={P} B={{ x: P.x, y: 0 }} color={SYM_META.x.color} />
            <Ticks view={view} A={{ x: P.x, y: 0 }} B={{ x: P.x, y: -P.y }} color={SYM_META.x.color} />
            <Ticks view={view} A={P} B={{ x: 0, y: P.y }} color={SYM_META.y.color} />
            <Ticks view={view} A={{ x: 0, y: P.y }} B={{ x: -P.x, y: P.y }} color={SYM_META.y.color} />
          </Clipped>
          {imgs.map(({ s, p }) => (
            <Dot key={s} view={view} p={p} color={SYM_META[s].color} r={6} label={`(${nz(p.x)}, ${nz(p.y)})`} />
          ))}
          <Dot view={view} p={P} color="#e2e8f0" r={7} label={`P(${nz(P.x)}, ${nz(P.y)})`} onDown={() => setDragId("P")} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 흰 점 P 를 끌어 보세요 — 세 대칭점이 함께 움직여요</p>
      </div>

      <div className="space-y-2">
        {SYM_ORDER.map((s) => {
          const p = applySym(P, s);
          return (
            <div key={s} className="rounded-2xl border px-4 py-3" style={{ borderColor: `${SYM_META[s].color}66`, background: `${SYM_META[s].color}14` }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-white">
                  {SYM_META[s].emoji} {SYM_META[s].label}
                </p>
                <span className="rounded-full bg-black/30 px-2.5 py-1">
                  <Katex expr={SYM_META[s].tex} />
                </span>
              </div>
              <div className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-slate-100">
                <Katex expr={`${ptTex(P)} \\;\\longrightarrow\\; ${ptTex(p)}`} />
              </div>
            </div>
          );
        })}
        <p className="rounded-xl bg-black/25 px-3 py-2 text-center text-[11px] leading-6 text-slate-300">
          ☆축 대칭이면 <b className="text-white">☆ 가 아닌 쪽</b>의 부호가 바뀌어요. 원점 대칭은 둘 다!
        </p>
      </div>
    </div>
  );
}

function GameOne({ g, onCleared }: { g: GameQ; onCleared: () => void }) {
  const [path, setPath] = useState<{ from: Pt; to: Pt; s: Sym }[]>([]);
  const cur = path.length ? path[path.length - 1].to : g.P;
  const n = path.length;
  const done = n >= 1 && samePt(cur, g.T);
  const perfect = done && n === g.min;
  const [showHint, setShowHint] = useState(false);

  const doneRef = useRef(false);
  useEffect(() => {
    if (done && !doneRef.current) {
      doneRef.current = true;
      onCleared();
    }
  });

  const view = makeView(6);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={"rounded-2xl border p-3 transition " + (done ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04]")}>
        <Plane cid={`game-${g.id}`} view={view} label="버튼 게임">
          <Clipped cid={`game-${g.id}`}>
            {path.map((seg, i) => (
              <Arrow key={i} view={view} A={seg.from} B={seg.to} color={SYM_META[seg.s].color} />
            ))}
          </Clipped>
          <g>
            <polygon
              points={starPoints(view.sx(g.T.x), view.sy(g.T.y), 12, 5.5)}
              fill={done ? "#34d399" : "rgba(251,191,36,0.35)"}
              stroke={done ? "#34d399" : "#fbbf24"}
              strokeWidth={2}
            />
            <text x={view.sx(g.T.x)} y={view.sy(g.T.y) - 17} textAnchor="middle" className="fill-amber-200 font-mono text-[10px] font-bold">
              {ptTex(g.T)}
            </text>
          </g>
          <Dot view={view} p={g.P} color="#64748b" r={5} hollow label={n === 0 ? undefined : "시작"} />
          <Dot view={view} p={cur} color={done ? "#34d399" : "#e2e8f0"} r={7} label={`(${nz(cur.x)}, ${nz(cur.y)})`} />
        </Plane>
      </div>

      <div className="space-y-3">
        <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (done ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
          <p className="text-[11px] font-bold text-slate-300">시작 → 목표</p>
          <div className="mt-0.5 flex justify-center text-base">
            <Katex expr={`${ptTex(g.P)} \\;\\longrightarrow\\; ${ptTex(g.T)}`} />
          </div>
          <p className={"mt-1 text-sm font-extrabold " + (done ? "text-emerald-200" : "text-slate-400")}>
            {done ? (perfect ? `🎉 ${n}번 만에 성공! 최소 횟수예요 ⭐` : `✅ ${n}번 만에 성공! (최소 ${g.min}번)`) : `${n}번 눌렀어요`}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="grid gap-1.5 sm:grid-cols-3">
            {SYM_ORDER.map((s) => {
              const lock = g.locked.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={lock || done}
                  onClick={() => setPath((p) => [...p, { from: cur, to: applySym(cur, s), s }])}
                  className={
                    "rounded-xl border-2 px-2 py-2.5 text-center text-xs font-bold transition disabled:opacity-35 " +
                    (lock ? "border-white/10 bg-black/30 text-slate-500" : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10")
                  }
                  style={lock ? undefined : { borderColor: `${SYM_META[s].color}66`, background: `${SYM_META[s].color}14` }}
                >
                  <span className="block text-base">{lock ? "🔒" : SYM_META[s].emoji}</span>
                  {SYM_META[s].label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setPath([])}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 처음부터
            </button>
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="rounded-xl border border-amber-400/45 bg-amber-400/10 px-3 py-2 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
            >
              💡 힌트
            </button>
          </div>
          {showHint ? <p className="mt-2 rounded-lg bg-amber-400/12 px-3 py-2 text-[11px] leading-5 text-amber-100">{g.hint}</p> : null}
          {g.locked.length ? (
            <p className="mt-2 text-center text-[11px] text-slate-400">
              🔒 이번 판에는 <b className="text-slate-200">{g.locked.map((s) => SYM_META[s].label).join(", ")}</b> 버튼을 쓸 수 없어요
            </p>
          ) : null}
        </div>

        {path.length ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-sm font-bold text-slate-100">🧭 누른 순서</p>
            <div className="mt-2 space-y-1">
              {path.map((seg, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-black/25 px-3 py-1.5">
                  <span className="font-mono text-[11px] font-bold text-slate-500">{i + 1}</span>
                  <span className="text-[11px] font-bold" style={{ color: SYM_META[seg.s].color }}>
                    {SYM_META[seg.s].emoji} {SYM_META[seg.s].label}
                  </span>
                  <span className="ml-auto">
                    <Katex expr={`${ptTex(seg.from)} \\to ${ptTex(seg.to)}`} />
                  </span>
                </div>
              ))}
            </div>
            {done && n === 2 && path[0].s !== path[1].s ? (
              <p className="mt-2 rounded-lg bg-violet-400/12 px-3 py-2 text-[11px] leading-5 text-violet-100">
                ✨ 서로 다른 두 대칭을 이어 했더니 나머지 하나와 같아졌어요!
              </p>
            ) : null}
            {done && n === 2 && path[0].s === path[1].s ? (
              <p className="mt-2 rounded-lg bg-violet-400/12 px-3 py-2 text-[11px] leading-5 text-violet-100">
                ✨ 같은 대칭을 두 번 하면 제자리! 대칭이동은 되돌리는 방법이 자기 자신이에요.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function starPoints(cx: number, cy: number, R: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
  }
  return pts.join(" ");
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 도형 뒤집기
// ══════════════════════════════════════════════════════════════
function FigureTab() {
  const [fi, setFi] = useState(0);
  const [state, setState] = useState<SymState>("none");
  const [seen, setSeen] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);

  const fig = FIGS[fi];
  const view = makeView(8);
  const base = figCurves(fig, "none", 8);
  const cur = figCurves(fig, state, 8);
  const overlap = state === "none" || fig.self[state];

  function press(s: Sym) {
    const ns = COMPOSE[state][s];
    setState(ns);
    if (ns !== "none") setSeen((v) => (v.includes(`${fig.id}/${ns}`) ? v : [...v, `${fig.id}/${ns}`]));
  }
  function pickFig(i: number) {
    setFi(i);
    setState("none");
  }

  const total = FIGS.length * SYM_ORDER.length;
  const q = EQ_QS[qi];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🪞 도형을 뒤집어 보세요 — 자기 자신과 겹치는 도형은?</p>
          <div className="flex flex-wrap gap-1.5">
            {FIGS.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => pickFig(i)}
                className={
                  "h-8 min-w-[2rem] rounded-lg border-2 px-1.5 text-sm transition " +
                  (i === fi ? "border-cyan-400/70 bg-cyan-400/20" : "border-white/10 bg-white/5 hover:bg-white/10")
                }
              >
                {f.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={"rounded-2xl border p-3 transition " + (state !== "none" && overlap ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04]")}>
          <Plane cid={`fig-${fig.id}`} view={view} label={`${fig.name}의 대칭이동`}>
            <Clipped cid={`fig-${fig.id}`}>
              <Poly view={view} curves={base} color="#64748b" width={2.5} dash="6 5" opacity={0.75} />
              <Poly view={view} curves={cur} color={state === "none" ? "#e2e8f0" : overlap ? "#34d399" : SYM_META[state].color} width={3.5} />
            </Clipped>
          </Plane>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold">
            <span className="text-slate-500">┈ 원본</span>
            <span className={state !== "none" && overlap ? "text-emerald-300" : "text-slate-200"}>━ 지금 도형</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (state !== "none" && overlap ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
            <p className="text-[11px] font-bold text-slate-300">
              {fig.emoji} {fig.name} · {state === "none" ? "원본" : SYM_META[state].label}
            </p>
            <p className={"mt-0.5 text-sm font-extrabold " + (state !== "none" && overlap ? "text-emerald-100" : "text-slate-300")}>
              {state === "none" ? "버튼을 눌러 뒤집어 보세요" : overlap ? "✨ 원본과 완전히 겹쳐요!" : "원본과 다른 자리로 갔어요"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <div className="grid gap-1.5 sm:grid-cols-3">
              {SYM_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => press(s)}
                  className="rounded-xl border-2 px-2 py-2.5 text-center text-xs font-bold text-slate-100 transition hover:brightness-125"
                  style={{ borderColor: `${SYM_META[s].color}66`, background: `${SYM_META[s].color}14` }}
                >
                  <span className="block text-base">{SYM_META[s].emoji}</span>
                  {SYM_META[s].label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setState("none")}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 원본으로
            </button>
            <div className="mt-3 space-y-0.5">
              <FormulaLine label="원본" tex={fig.tex.none} />
              <FormulaLine label="지금" tex={fig.tex[state]} big />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-amber-200">🏅 자기대칭 도감</p>
              <span className="rounded-full border border-amber-400/45 bg-amber-400/15 px-2.5 py-1 font-mono text-[11px] font-bold text-amber-100">
                {seen.length} / {total}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {FIGS.map((f) => (
                <div key={f.id} className="flex items-center gap-2 rounded-lg bg-black/25 px-2.5 py-1.5">
                  <span className="w-24 shrink-0 text-[11px] font-bold text-slate-200">
                    {f.emoji} {f.name}
                  </span>
                  {SYM_ORDER.map((s) => {
                    const key = `${f.id}/${s}`;
                    const found = seen.includes(key);
                    return (
                      <span
                        key={s}
                        className={
                          "flex-1 rounded-md px-1 py-0.5 text-center text-[10px] font-bold " +
                          (!found ? "bg-white/5 text-slate-600" : f.self[s] ? "bg-emerald-400/25 text-emerald-100" : "bg-rose-400/20 text-rose-200")
                        }
                      >
                        {SYM_META[s].emoji} {found ? (f.self[s] ? "⭕" : "❌") : "?"}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              {seen.length === total ? "🎉 도감 완성! 자기 자신과 겹치는 대칭이 도형마다 다르네요." : "도형마다 세 버튼을 모두 눌러 도감을 채워 보세요"}
            </p>
          </div>
        </div>
      </div>

      {/* 식 맞히기 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✍️ 대칭이동한 도형의 방정식은?</p>
          <Chips ids={EQ_QS.map((x) => x.id)} cur={qi} done={solved} onPick={setQi} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {SYM_ORDER.map((s) => (
            <div key={s} className="rounded-xl px-3 py-2" style={{ border: `1px solid ${SYM_META[s].color}59`, background: `${SYM_META[s].color}14` }}>
              <p className="text-[11px] font-bold text-slate-200">
                {SYM_META[s].emoji} {SYM_META[s].label}
              </p>
              <div className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-slate-100">
                <Katex expr={s === "x" ? "f(x,\\, -y) = 0" : s === "y" ? "f(-x,\\, y) = 0" : "f(-x,\\, -y) = 0"} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[11px] leading-6 text-slate-300">
          평행이동과 달리 <b className="text-white">점과 도형의 계산 방법이 똑같아요</b> — 부호만 바꿔 넣으면 끝!
        </p>
      </div>

      <EqOne key={q.id} q={q} onSolved={() => setSolved((s) => (s.includes(q.id) ? s : [...s, q.id]))} />
    </div>
  );
}

function EqOne({ q, onSolved }: { q: EqQ; onSolved: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const ok = pick === q.ans;

  return (
    <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-slate-100" style={{ background: `${SYM_META[q.sym].color}33` }}>
          {SYM_META[q.sym].emoji} {SYM_META[q.sym].label}
        </span>
        <span className="text-[11px] text-slate-400">한 도형을 이렇게 대칭이동하면?</span>
      </div>
      <div className="mt-2">
        <FormulaLine label="원본" tex={q.figTex} big />
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
                (good
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : bad
                    ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
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
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setHint((v) => !v)}
          className="rounded-lg border border-amber-400/45 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
        >
          💡 힌트
        </button>
      </div>
      {hint || ok ? <p className="mt-2 rounded-lg bg-amber-400/12 px-3 py-2 text-[11px] leading-5 text-amber-100">{q.tip}</p> : null}
      {pick !== null && !ok ? <p className="mt-1.5 text-[11px] font-bold text-rose-200">바꾸지 않아도 되는 자리까지 바꾸지 않았나요?</p> : null}
    </div>
  );
}
