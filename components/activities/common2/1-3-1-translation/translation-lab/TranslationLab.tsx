"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  MOVE_META,
  PT_QS,
  ROUNDS,
  SHAPES,
  circleTex,
  figCurves,
  figSame,
  nz,
  ptTex,
  type Pt,
  type PtQ,
  type Round,
  type Shape,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_not_function",
    prompt:
      "탭①에서 f(x, y) = 0 꼴로는 모든 도형을 쓸 수 있었지만 y = f(x) 꼴로는 쓸 수 없는 도형이 있었어요. 세로선 검사를 근거로 그 까닭을 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: y = f(x) 는 x 하나에 y 가 하나로 정해진다는 뜻이다. 원이나 누운 포물선은 세로선을 그으면 두 점에서 만나 x 하나에 y 가 둘이라 y = f(x) 로 쓸 수 없다. 하지만 좌변으로 모두 넘기기만 하면 되는 f(x, y) = 0 꼴은 언제나 쓸 수 있다.",
  },
  {
    id: "sign_flip",
    prompt:
      "점은 (x + a, y + b)로 옮겨지는데 도형의 식은 왜 f(x − a, y − b) = 0 처럼 부호가 반대로 들어갈까요? 탭③에서 확인한 것을 바탕으로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 옮긴 도형 위의 점을 (x′, y′)라 하면 이 점이 오기 전의 자리는 (x′ − a, y′ − b)이다. 그 점이 원래 도형 위에 있었으므로 f(x′ − a, y′ − b) = 0 이 성립한다. 식에 넣는 것은 ‘옮기기 전 자리’라서 부호가 반대가 된다.",
  },
  {
    id: "back_and_forth",
    prompt:
      "탭②에는 옮긴 점을 찾는 문제뿐 아니라 이동량을 찾는 문제, 옮기기 전의 점을 찾는 문제도 있었어요. 세 가지를 풀면서 새로 알게 된 점이나 헷갈렸던 점을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 옮기기 전의 점을 찾을 때는 더하는 게 아니라 빼야 해서 헷갈렸다. P′에서 (a, b)를 빼면 P가 된다는 것을 알고 나니, 도형의 식에 x − a 를 넣는 까닭과 같은 이야기라는 것이 보였다.",
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
  onGrab,
  children,
}: {
  cid: string;
  view: View;
  svgRef?: React.Ref<SVGSVGElement>;
  label: string;
  onGrab?: () => void;
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

/** P → P′ 화살표와 a, b 직각삼각형 */
function MoveArrow({ view, P, Pp, showLegs }: { view: View; P: Pt; Pp: Pt; showLegs?: boolean }) {
  const x1 = view.sx(P.x);
  const y1 = view.sy(P.y);
  const x2 = view.sx(Pp.x);
  const y2 = view.sy(Pp.y);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const L = 10;
  return (
    <g>
      {showLegs ? (
        <>
          <line x1={x1} y1={y1} x2={x2} y2={y1} stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 4" />
          <line x1={x2} y1={y1} x2={x2} y2={y2} stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 4" />
          <text x={(x1 + x2) / 2} y={y1 + (y2 > y1 ? -6 : 14)} textAnchor="middle" className="fill-sky-300 font-mono text-[10px] font-bold">
            a = {nz(Pp.x - P.x)}
          </text>
          <text x={x2 + 6} y={(y1 + y2) / 2} className="fill-violet-300 font-mono text-[10px] font-bold">
            b = {nz(Pp.y - P.y)}
          </text>
        </>
      ) : null}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f472b6" strokeWidth={2.5} />
      <path
        d={`M${x2},${y2} L${x2 - L * Math.cos(ang - 0.4)},${y2 - L * Math.sin(ang - 0.4)} L${x2 - L * Math.cos(ang + 0.4)},${y2 - L * Math.sin(ang + 0.4)} Z`}
        fill="#f472b6"
      />
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
function q10(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v * 10) / 10));
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

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "shape" | "point" | "figure";

export default function TranslationLab() {
  const [tab, setTab] = useState<Tab>("shape");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🚚 평행이동</h3>
        <p className="mt-2 leading-7 text-slate-300">
          도형을 식으로 <b className="text-emerald-200">붙잡는 법</b>을 먼저 익히고, <b className="text-sky-200">점</b>과 <b className="text-violet-200">도형</b>을 통째로 옮겨 봅시다.
          식의 부호에 깜짝 놀랄 준비 되었나요?
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "shape"} onClick={() => setTab("shape")}>
          ① 모든 도형을 식으로 🔍
        </TabButton>
        <TabButton active={tab === "point"} onClick={() => setTab("point")}>
          ② 점 옮기기 🚀
        </TabButton>
        <TabButton active={tab === "figure"} onClick={() => setTab("figure")}>
          ③ 도형 겹치기 퍼즐 🧩
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "shape" ? <ShapeTab /> : null}
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
// 탭 ① 모든 도형을 식으로
// ══════════════════════════════════════════════════════════════
function ShapeTab() {
  const [si, setSi] = useState(0);
  const [judged, setJudged] = useState<string[]>([]);
  const s = SHAPES[si];
  const all = judged.length === SHAPES.length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔍 세로선 검사로 도형을 분류해요</p>
          <Chips ids={SHAPES.map((x) => x.id)} cur={si} done={judged} onPick={setSi} emojis={SHAPES.map((x) => x.emoji)} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-xs leading-6 text-slate-300">
          빨간 <b className="text-rose-200">세로선</b>을 좌우로 끌어 도형과 <b>몇 점에서 만나는지</b> 세어 보세요. 한 번이라도 <b className="text-rose-200">두 점 이상</b>에서 만나면{" "}
          <b>y = f(x) 꼴로 쓸 수 없어요.</b>
        </p>
      </div>

      <ShapeOne key={s.id} s={s} onJudged={() => setJudged((v) => (v.includes(s.id) ? v : [...v, s.id]))} />

      {/* 결과 표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">🗂️ 분류 결과</p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {SHAPES.map((x) => {
            const done = judged.includes(x.id);
            return (
              <div
                key={x.id}
                className={
                  "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 " +
                  (!done ? "border-white/10 bg-black/25" : x.isFn ? "border-emerald-400/45 bg-emerald-400/[0.10]" : "border-rose-400/45 bg-rose-400/[0.10]")
                }
              >
                <span className={"text-xs font-bold " + (done ? "text-slate-100" : "text-slate-500")}>
                  {x.emoji} {x.name}
                </span>
                {done ? (
                  <span className="flex items-center gap-1.5">
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (x.isFn ? "bg-emerald-400/25 text-emerald-100" : "bg-rose-400/25 text-rose-100")}>
                      y = f(x) {x.isFn ? "⭕" : "❌"}
                    </span>
                    <span className="rounded-full bg-sky-400/25 px-2 py-0.5 text-[10px] font-bold text-sky-100">f(x, y) = 0 ⭕</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-600">아직</span>
                )}
              </div>
            );
          })}
        </div>
        {all ? (
          <div className="mt-3 rounded-xl border-2 border-emerald-400/50 bg-emerald-400/12 px-4 py-3 text-center">
            <p className="text-sm font-extrabold text-emerald-100">🎉 8개 도형 분류 완료!</p>
            <p className="mt-1 text-xs leading-6 text-emerald-200/90">
              <b>f(x, y) = 0</b> 은 8개 모두 ⭕ — 좌변으로 넘기기만 하면 되니까요. 하지만 <b>y = f(x)</b> 는 4개만 ⭕ 였어요.
              <br />
              그래서 앞으로 도형을 다룰 때는 <b className="text-white">f(x, y) = 0</b> 을 씁니다!
            </p>
          </div>
        ) : (
          <p className="mt-2 text-center text-[11px] text-slate-400">8개 도형을 모두 판정해 보세요</p>
        )}
      </div>
    </div>
  );
}

function ShapeOne({ s, onJudged }: { s: Shape; onJudged: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(-4);
  const [maxSeen, setMaxSeen] = useState<number | "inf">(0);
  const [pick, setPick] = useState<boolean | null>(null);

  const view = makeView(6);
  const setLine = (v: number) => {
    const nv = q10(v, -6, 6);
    setT(nv);
    const h = s.hits(nv);
    if (h === "inf") setMaxSeen("inf");
    else setMaxSeen((m) => (m === "inf" ? "inf" : Math.max(m, h.length)));
  };
  const { setDragId } = useDrag(svgRef, view, (_id, p) => setLine(p.x));

  const h = s.hits(t);
  const cnt = h === "inf" ? "무한" : String(h.length);
  const ok = pick !== null && pick === s.isFn;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onJudged();
    }
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid={`shape-${s.id}`} view={view} svgRef={svgRef} label={`${s.name}과 세로선`} onGrab={() => setDragId("t")}>
          <Clipped cid={`shape-${s.id}`}>
            <Poly view={view} curves={s.curves(6)} color="#34d399" width={3.5} />
            <line x1={view.sx(t)} y1={view.sy(6.5)} x2={view.sx(t)} y2={view.sy(-6.5)} stroke="#fb7185" strokeWidth={3} />
            {h === "inf" ? <line x1={view.sx(t)} y1={view.sy(6.5)} x2={view.sx(t)} y2={view.sy(-6.5)} stroke="#fbbf24" strokeWidth={7} opacity={0.45} /> : null}
          </Clipped>
          {h !== "inf"
            ? h
                .filter((y) => Math.abs(y) <= 6.4)
                .map((y, i) => <Dot key={i} view={view} p={{ x: t, y }} color="#fbbf24" r={6} />)
            : null}
          <text x={view.sx(t)} y={PAD + 12} textAnchor="middle" className="fill-rose-300 font-mono text-[10px] font-bold">
            x = {nz(t)}
          </text>
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 그래프를 끌면 빨간 세로선이 따라와요</p>
      </div>

      <div className="space-y-3">
        <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (cnt === "무한" || Number(cnt) >= 2 ? "border-rose-400/55 bg-rose-400/12" : "border-emerald-400/50 bg-emerald-400/12")}>
          <p className="text-[11px] font-bold text-slate-300">세로선과 만나는 점의 개수</p>
          <p className={"font-mono text-4xl font-extrabold " + (cnt === "무한" || Number(cnt) >= 2 ? "text-rose-100" : "text-emerald-100")}>{cnt}</p>
          <p className="mt-0.5 text-[11px] font-bold text-slate-400">
            지금까지 본 최대 <span className="font-mono text-slate-100">{maxSeen === "inf" ? "무한" : maxSeen}</span> 개
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <Slider label="세로선의 위치 x" value={t} min={-6} max={6} step={0.1} onChange={setLine} accent="accent-rose-400" />
          <p className="mt-2 text-center text-sm font-bold text-slate-100">
            {s.emoji} {s.name}
          </p>
          <div className="mt-2 rounded-lg bg-black/25 px-3 py-2">
            <FormulaLine label="식" tex={s.impTex} />
          </div>
        </div>

        <div className="rounded-2xl border-2 border-violet-400/40 bg-violet-400/[0.08] p-4">
          <p className="text-sm font-bold text-violet-100">이 도형을 y = f(x) 꼴로 쓸 수 있을까요?</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {[true, false].map((v) => {
              const on = pick === v;
              const good = pick !== null && v === s.isFn;
              const bad = on && v !== s.isFn;
              return (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setPick(v)}
                  disabled={ok}
                  className={
                    "rounded-xl border-2 px-3 py-2 text-sm font-bold transition disabled:cursor-default " +
                    (good
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : bad
                        ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  {v ? "⭕ 쓸 수 있어요" : "❌ 쓸 수 없어요"}
                </button>
              );
            })}
          </div>
          {pick !== null && pick !== s.isFn ? <p className="mt-1.5 text-[11px] font-bold text-rose-200">세로선을 더 움직여 보세요!</p> : null}
          {ok ? (
            <div className="mt-2 space-y-2">
              <div className="rounded-lg border border-emerald-400/45 bg-emerald-400/12 px-3 py-2">
                <p className="text-[11px] leading-5 text-emerald-100">{s.why}</p>
              </div>
              <div className="rounded-lg bg-black/25 px-3 py-2">
                <FormulaLine label="y = f(x)" tex={s.yTex ?? "\\text{---}"} />
                <FormulaLine label="f(x,y)=0" tex={s.impTex} big />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 점 옮기기
// ══════════════════════════════════════════════════════════════
const TRI: Pt[] = [
  { x: -4, y: -1 },
  { x: -2, y: -3 },
  { x: -1, y: 0 },
];

function PointTab() {
  const [qi, setQi] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const q = PT_QS[qi];

  return (
    <div className="space-y-4">
      <PointPlay />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎯 미션 — 세 가지 유형</p>
          <Chips ids={PT_QS.map((x) => x.id)} cur={qi} done={solved} onPick={setQi} />
        </div>
        <div className="mt-2 overflow-x-auto overflow-y-hidden py-1 text-center text-slate-100">
          <Katex expr="\text{P}(x,\, y) \;\longrightarrow\; \text{P}'(x + a,\; y + b)" />
        </div>
      </div>

      <PointOne key={q.id} q={q} onSolved={() => setSolved((s) => (s.includes(q.id) ? s : [...s, q.id]))} />
    </div>
  );
}

function PointPlay() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [P, setP] = useState<Pt>({ x: -3, y: -2 });
  const [a, setA] = useState(4);
  const [b, setB] = useState(3);
  const [tri, setTri] = useState(false);

  const view = makeView(10);
  const { setDragId } = useDrag(svgRef, view, (_id, p) => setP({ x: clampInt(p.x, -8, 8), y: clampInt(p.y, -8, 8) }));

  const Pp = { x: P.x + a, y: P.y + b };
  const tri2 = TRI.map((p) => ({ x: p.x + a, y: p.y + b }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid="pt-play" view={view} svgRef={svgRef} label="점의 평행이동">
          <Clipped cid="pt-play">
            {tri ? (
              <>
                <polygon points={TRI.map((p) => `${view.sx(p.x)},${view.sy(p.y)}`).join(" ")} fill="rgba(148,163,184,0.12)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4" />
                <polygon points={tri2.map((p) => `${view.sx(p.x)},${view.sy(p.y)}`).join(" ")} fill="rgba(52,211,153,0.14)" stroke="#34d399" strokeWidth={2.5} />
                {TRI.map((p, i) => (
                  <MoveArrow key={i} view={view} P={p} Pp={tri2[i]} />
                ))}
              </>
            ) : null}
            <MoveArrow view={view} P={P} Pp={Pp} showLegs />
          </Clipped>
          <Dot view={view} p={P} color="#94a3b8" r={7} label={`P(${nz(P.x)}, ${nz(P.y)})`} onDown={() => setDragId("p")} />
          <Dot view={view} p={Pp} color="#34d399" r={7} label={`P′(${nz(Pp.x)}, ${nz(Pp.y)})`} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 회색 점 P를 끌어 보세요</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Slider label="x축으로 a 만큼" value={a} min={-8} max={8} step={1} onChange={setA} accent="accent-sky-400" />
            <Slider label="y축으로 b 만큼" value={b} min={-8} max={8} step={1} onChange={setB} accent="accent-violet-400" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Cell label="a 의 뜻" value={a > 0 ? "오른쪽 →" : a < 0 ? "← 왼쪽" : "그대로"} tone="sky" />
            <Cell label="b 의 뜻" value={b > 0 ? "위쪽 ↑" : b < 0 ? "아래쪽 ↓" : "그대로"} tone="violet" />
          </div>
          <button
            type="button"
            onClick={() => setTri((v) => !v)}
            className="mt-3 w-full rounded-xl border-2 border-emerald-400/50 bg-emerald-400/12 px-3 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/20"
          >
            {tri ? "삼각형 숨기기" : "🔺 삼각형도 함께 옮겨 보기"}
          </button>
          {tri ? <p className="mt-1.5 text-center text-[11px] text-emerald-200">세 꼭짓점이 모두 같은 만큼 움직여요 — 도형의 평행이동!</p> : null}
        </div>

        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
          <p className="text-sm font-bold text-emerald-200">✍️ 지금 이동</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine
              label="계산"
              tex={`(${P.x},\\; ${P.y}) \\;\\longrightarrow\\; (${P.x} ${a < 0 ? "-" : "+"} ${Math.abs(a)},\\; ${P.y} ${b < 0 ? "-" : "+"} ${Math.abs(b)})`}
            />
            <FormulaLine label="결과" tex={`\\text{P}'(${Pp.x},\\; ${Pp.y})`} big />
          </div>
          <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
            분홍 화살표의 <b className="text-sky-200">가로 길이가 a</b>, <b className="text-violet-200">세로 길이가 b</b>. 점을 어디에 두어도 화살표의 모양은 똑같아요!
          </p>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone: "sky" | "violet" }) {
  const cls = tone === "sky" ? "border-sky-400/45 bg-sky-400/10 text-sky-100" : "border-violet-400/45 bg-violet-400/10 text-violet-100";
  return (
    <div className={"rounded-xl border px-2 py-2 text-center " + cls}>
      <p className="text-[10px] font-bold opacity-85">{label}</p>
      <p className="mt-0.5 text-sm font-bold">{value}</p>
    </div>
  );
}

function PointOne({ q, onSolved }: { q: PtQ; onSolved: () => void }) {
  const [i1, setI1] = useState("");
  const [i2, setI2] = useState("");
  const meta = MOVE_META[q.kind];

  const ok1 = i1 === "" ? null : parseNum(i1) === q.ans[0];
  const ok2 = i2 === "" ? null : parseNum(i2) === q.ans[1];
  const done = ok1 === true && ok2 === true;

  const doneRef = useRef(false);
  useEffect(() => {
    if (done && !doneRef.current) {
      doneRef.current = true;
      onSolved();
    }
  });

  const view = makeView(8);
  const showP = q.kind !== "backward" || done;
  const showPp = q.kind !== "forward" || done;

  const tone =
    meta.tone === "emerald" ? "border-emerald-400/40 bg-emerald-400/[0.08]" : meta.tone === "sky" ? "border-sky-400/40 bg-sky-400/[0.08]" : "border-violet-400/40 bg-violet-400/[0.08]";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid={`ptq-${q.id}`} view={view} label="미션">
          <Clipped cid={`ptq-${q.id}`}>{showP && showPp ? <MoveArrow view={view} P={q.P} Pp={q.Pp} showLegs={done || q.kind === "vector"} /> : null}</Clipped>
          {showP ? <Dot view={view} p={q.P} color="#94a3b8" r={7} label={`P${ptTex(q.P)}`} /> : null}
          {showPp ? <Dot view={view} p={q.Pp} color="#34d399" r={7} label={`P′${ptTex(q.Pp)}`} /> : null}
          {!showP ? (
            <text x={PAD + SPAN / 2} y={PAD + 20} textAnchor="middle" className="fill-slate-500 text-[11px]">
              P 는 어디에?
            </text>
          ) : null}
          {!showPp ? (
            <text x={PAD + SPAN / 2} y={PAD + 20} textAnchor="middle" className="fill-slate-500 text-[11px]">
              P′ 는 어디에?
            </text>
          ) : null}
        </Plane>
      </div>

      <div className="space-y-3">
        <div className={"rounded-2xl border-2 p-4 " + tone}>
          <span className="rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-bold text-slate-200">{meta.badge}</span>
          <div className="mt-2 space-y-0.5">
            {q.kind === "backward" ? (
              <>
                <FormulaLine label="옮긴 점" tex={`\\text{P}'${ptTex(q.Pp)}`} />
                <FormulaLine label="이동량" tex={`a = ${q.a},\\quad b = ${q.b}`} />
              </>
            ) : q.kind === "vector" ? (
              <>
                <FormulaLine label="처음" tex={`\\text{P}${ptTex(q.P)}`} />
                <FormulaLine label="옮긴 뒤" tex={`\\text{P}'${ptTex(q.Pp)}`} />
              </>
            ) : (
              <>
                <FormulaLine label="처음" tex={`\\text{P}${ptTex(q.P)}`} />
                <FormulaLine label="이동량" tex={`a = ${q.a},\\quad b = ${q.b}`} />
              </>
            )}
          </div>
          <p className="mt-2 text-sm font-bold text-slate-100">{meta.ask}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-200">
            <span className="font-mono text-lg">(</span>
            <NumBox value={i1} onChange={setI1} ok={ok1} label={q.kind === "vector" ? "a" : "x좌표"} />
            <span className="font-mono text-lg">,</span>
            <NumBox value={i2} onChange={setI2} ok={ok2} label={q.kind === "vector" ? "b" : "y좌표"} />
            <span className="font-mono text-lg">)</span>
          </div>
        </div>

        {done ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4">
            <p className="text-sm font-bold text-emerald-200">✅ 풀이</p>
            <div className="mt-2 space-y-0.5">
              {q.kind === "backward" ? (
                <>
                  <FormulaLine label="되돌리기" tex={`(${q.Pp.x} ${q.a < 0 ? "+" : "-"} ${Math.abs(q.a)},\\; ${q.Pp.y} ${q.b < 0 ? "+" : "-"} ${Math.abs(q.b)})`} />
                  <FormulaLine label="답" tex={`\\text{P}${ptTex(q.P)}`} big />
                </>
              ) : q.kind === "vector" ? (
                <>
                  <FormulaLine label="가로" tex={`a = ${q.Pp.x} - (${q.P.x}) = ${q.a}`} />
                  <FormulaLine label="세로" tex={`b = ${q.Pp.y} - (${q.P.y}) = ${q.b}`} big />
                </>
              ) : (
                <>
                  <FormulaLine label="더하기" tex={`(${q.P.x} ${q.a < 0 ? "-" : "+"} ${Math.abs(q.a)},\\; ${q.P.y} ${q.b < 0 ? "-" : "+"} ${Math.abs(q.b)})`} />
                  <FormulaLine label="답" tex={`\\text{P}'${ptTex(q.Pp)}`} big />
                </>
              )}
            </div>
            <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
              {q.kind === "backward" ? (
                <>
                  옮기기 전으로 돌아가려면 <b>a, b 를 빼요</b>. 이 ‘거꾸로 생각하기’가 탭③에서 도형의 식에 x − a 를 넣는 까닭이 됩니다!
                </>
              ) : q.kind === "vector" ? (
                <>이동량은 (나중 좌표) − (처음 좌표). 가로로 {nz(q.a)}, 세로로 {nz(q.b)} 만큼 움직였어요.</>
              ) : (
                <>
                  x좌표에는 a 를, y좌표에는 b 를 더하기만 하면 끝! a = {nz(q.a)} 이니 {q.a > 0 ? "오른쪽" : "왼쪽"}으로, b = {nz(q.b)} 이니 {q.b > 0 ? "위쪽" : "아래쪽"}으로 움직였어요.
                </>
              )}
            </p>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-6 text-center text-xs text-slate-500">
            🔒 두 칸을 모두 맞히면 그림과 풀이가 열려요
          </p>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 도형 겹치기 퍼즐
// ══════════════════════════════════════════════════════════════
function FigureTab() {
  const [ri, setRi] = useState(0);
  const [cleared, setCleared] = useState<string[]>([]);
  const R = ROUNDS[ri];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧩 회색 목표 자리에 도형을 정확히 겹쳐 보세요</p>
          <Chips ids={ROUNDS.map((x) => x.id)} cur={ri} done={cleared} onPick={setRi} emojis={ROUNDS.map((x) => x.emoji)} />
        </div>
      </div>

      <FigureOne key={R.id} R={R} onCleared={() => setCleared((s) => (s.includes(R.id) ? s : [...s, R.id]))} />

      {/* 왜 부호가 반대일까 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-violet-400/40 bg-violet-400/[0.08] p-4">
          <p className="text-sm font-bold text-violet-100">🤔 점은 +a, 식은 −a … 왜?</p>
          <ol className="mt-2 space-y-2">
            {[
              { t: "옮긴 도형 위의 점을 P′(x′, y′) 라고 하자", tex: null },
              { t: "이 점이 오기 전의 자리는", tex: "(x' - a,\\; y' - b)" },
              { t: "그 자리는 원래 도형 위에 있었으므로", tex: "f(x' - a,\\; y' - b) = 0" },
              { t: "즉 옮긴 도형의 방정식은", tex: "f(x - a,\\; y - b) = 0" },
            ].map((s, i) => (
              <li key={i} className="rounded-xl bg-black/25 px-3 py-2">
                <p className="flex gap-2 text-xs leading-6 text-slate-200">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-400/25 text-[11px] font-bold text-violet-100">{i + 1}</span>
                  {s.t}
                </p>
                {s.tex ? (
                  <div className={"overflow-x-auto overflow-y-hidden py-1 pl-7 " + (i === 3 ? "text-lg text-violet-100" : "text-slate-100")}>
                    <Katex expr={s.tex} />
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.08] p-4">
            <p className="text-sm font-bold text-sky-200">📌 나란히 놓고 보기</p>
            <div className="mt-2 space-y-1">
              <div className="rounded-xl bg-black/25 px-3 py-2">
                <p className="text-[11px] font-bold text-slate-400">점의 평행이동</p>
                <div className="overflow-x-auto overflow-y-hidden py-1 text-slate-100">
                  <Katex expr="(x,\, y) \;\longrightarrow\; (x + a,\; y + b)" />
                </div>
              </div>
              <div className="rounded-xl bg-black/25 px-3 py-2">
                <p className="text-[11px] font-bold text-slate-400">도형의 평행이동</p>
                <div className="overflow-x-auto overflow-y-hidden py-1 text-slate-100">
                  <Katex expr="f(x,\, y) = 0 \;\longrightarrow\; f(x - a,\; y - b) = 0" />
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs leading-6 text-slate-300">
              부호가 반대라고 <b className="text-rose-200">도형이 반대로 움직이는 게 아니에요</b>. 그림은 그대로 오른쪽·위로 갑니다. 식에 넣는 것이 &lsquo;옮기기 전의 자리&rsquo;일 뿐!
            </p>
          </div>

          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-4">
            <p className="text-sm font-bold text-amber-200">💡 원으로 확인하기</p>
            <div className="mt-1 space-y-0.5">
              <FormulaLine label="원본" tex="x^2 + y^2 = 4" />
              <FormulaLine label="이동" tex={circleTex(3, 2, 4)} big />
            </div>
            <p className="mt-1.5 text-xs leading-6 text-amber-100">
              중심이 (0, 0) 에서 <b>(3, 2)</b> 로 갔는데 식에는 <b>x − 3, y − 2</b> 가 들어갔죠? 이미 배운 원의 표준형이 바로 이 이야기였어요!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FigureOne({ R, onCleared }: { R: Round; onCleared: () => void }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [pick, setPick] = useState<number | null>(null);

  const view = makeView(8);
  // 직선처럼 겹치게 만드는 (a, b) 가 여러 가지인 도형이 있으므로 도형 자체를 비교한다
  const fit = figSame(R.fig, a, b, R.a, R.b);
  const exact = a === R.a && b === R.b;
  const ok = fit && pick === R.ans;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onCleared();
    }
  });

  const base = figCurves(R.fig, 0, 0, 8);
  const goal = figCurves(R.fig, R.a, R.b, 8);
  const cur = figCurves(R.fig, a, b, 8);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={"rounded-2xl border p-3 transition " + (fit ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04]")}>
        <Plane cid={`fig-${R.id}`} view={view} label="도형 겹치기 퍼즐">
          <Clipped cid={`fig-${R.id}`}>
            <Poly view={view} curves={base} color="#64748b" width={2} dash="5 5" opacity={0.7} />
            <Poly view={view} curves={goal} color="#e2e8f0" width={6} dash="9 7" opacity={0.45} />
            <Poly view={view} curves={cur} color={fit ? "#34d399" : "#f472b6"} width={3.5} />
          </Clipped>
        </Plane>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold">
          <span className="text-slate-500">┈ 원본</span>
          <span className="text-slate-300">┅ 목표</span>
          <span className={fit ? "text-emerald-300" : "text-pink-300"}>━ 지금 도형</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (fit ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
          <p className={"text-lg font-extrabold " + (fit ? "text-emerald-100" : "text-slate-400")}>
            {fit ? "✨ 딱 겹쳤어요!" : "슬라이더로 목표에 겹쳐 보세요"}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {R.emoji} {R.name}
          </p>
          {fit && !exact && R.note ? <p className="mt-1.5 text-[11px] font-bold leading-5 text-amber-200">💡 {R.note}</p> : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Slider label="x축으로 a 만큼" value={a} min={-6} max={6} step={1} onChange={(v) => { setA(v); setPick(null); }} accent="accent-sky-400" />
            <Slider label="y축으로 b 만큼" value={b} min={-6} max={6} step={1} onChange={(v) => { setB(v); setPick(null); }} accent="accent-violet-400" />
          </div>
          <div className="mt-3 space-y-0.5">
            <FormulaLine label="원본" tex={R.origTex} />
            <FormulaLine label="지금" tex={R.liveTex(a, b)} big />
          </div>
        </div>

        {fit ? (
          <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4">
            <p className="text-sm font-bold text-emerald-100">그렇다면 옮긴 도형의 방정식은?</p>
            <div className="mt-2 grid gap-1.5">
              {R.choices.map((c, i) => {
                const on = pick === i;
                const good = pick !== null && i === R.ans;
                const bad = on && i !== R.ans;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPick(i)}
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
            {pick !== null && pick !== R.ans ? <p className="mt-1.5 text-[11px] font-bold text-rose-200">부호를 다시 보세요 — 오른쪽으로 갔다고 + 는 아니에요!</p> : null}
            {ok ? (
              <p className="mt-2 rounded-lg bg-emerald-400/15 px-3 py-2 text-xs leading-6 text-emerald-100">
                🎉 정답! x축으로 <b>{nz(a)}</b>, y축으로 <b>{nz(b)}</b> 만큼 옮겼더니 식에는 <b>x {a >= 0 ? "−" : "+"} {Math.abs(a)}</b>, <b>y {b >= 0 ? "−" : "+"} {Math.abs(b)}</b> 가
                들어갔어요.{R.note ? ` ${R.note}` : ""}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-5 text-center text-xs leading-6 text-slate-500">
            🔒 도형을 목표에 겹치면
            <br />
            방정식 문제가 열려요
          </p>
        )}
      </div>
    </div>
  );
}
