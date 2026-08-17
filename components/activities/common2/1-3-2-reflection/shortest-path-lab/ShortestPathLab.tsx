"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  LAB_A,
  LAB_B,
  LAB_MIRROR,
  MIN_QS,
  PROOF_STEPS,
  ROOMS,
  dist,
  fmt,
  meetPoint,
  mirrorTex,
  nz,
  ptTex,
  reflectPt,
  tn,
  tracePath,
  type MinQ,
  type Mirror,
  type Pt,
  type Room,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_reflect",
    prompt:
      "AP + PB 를 가장 짧게 하는 점 P 를 찾을 때 왜 B 의 대칭점 B′ 을 잡았나요? 대칭점을 쓰면 무엇이 좋아지는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 거울이 BB′ 을 수직이등분하므로 PB = PB′ 이고, 그래서 AP + PB 를 AP + PB′ 으로 바꿔 쓸 수 있다. 꺾여 있던 길이 A에서 B′으로 가는 하나의 길로 펴져서, 두 점을 잇는 가장 짧은 길이 직선이라는 사실을 그대로 쓸 수 있게 된다.",
  },
  {
    id: "equality",
    prompt:
      "탭①에서 P 를 움직이며 관찰한 것을 바탕으로, 최솟값이 되는 순간이 언제인지와 그때 값이 얼마인지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: A, P, B′ 이 한 직선 위에 놓일 때 AP + PB′ 이 가장 짧아졌고, 그 값은 선분 AB′ 의 길이였다. P 가 그 자리에서 조금만 벗어나도 삼각형이 만들어져 두 변의 합이 AB′ 보다 길어졌다.",
  },
  {
    id: "two_walls",
    prompt:
      "탭③처럼 거울 벽 두 개에 차례로 반사시킬 때는 어떻게 생각했나요? 반사를 한 번 할 때와 무엇이 같고 무엇이 달랐는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 목표를 왼쪽 벽에 대칭시키고 그 점을 다시 아래 벽에 대칭시켜 두 번 펴 주면, 출발점에서 그 점까지의 직선이 곧 실제 경로가 되었다. 반사가 한 번이면 대칭을 한 번, 두 번이면 대칭을 두 번 하는 것이 같은 원리였다.",
  },
];

// ─── 좌표평면 (원점 중심) ─────────────────────────────────────
const PAD = 26;
const SPAN = 360;
const VB = SPAN + PAD * 2;

type View = { half: number; step: number; u: number; sx: (v: number) => number; sy: (v: number) => number };

function makeView(half: number): View {
  const u = SPAN / (2 * half);
  const step = half <= 6 ? 1 : half <= 10 ? 2 : half <= 16 ? 4 : 5;
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
      <line x1={view.sx(-view.half)} y1={view.sy(0)} x2={view.sx(view.half)} y2={view.sy(0)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={view.sx(0)} y1={view.sy(-view.half)} x2={view.sx(0)} y2={view.sy(view.half)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
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
    </g>
  );
}

function Plane({ cid, svgRef, label, children }: { cid: string; svgRef?: React.Ref<SVGSVGElement>; label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg ref={svgRef} viewBox={`0 0 ${VB} ${VB}`} className="mx-auto block w-full max-w-[440px] touch-none select-none" role="img" aria-label={label}>
        <defs>
          <clipPath id={cid}>
            <rect x={PAD} y={PAD} width={SPAN} height={SPAN} />
          </clipPath>
        </defs>
        {children}
      </svg>
    </div>
  );
}

function Clipped({ cid, children }: { cid: string; children: React.ReactNode }) {
  return <g clipPath={`url(#${cid})`}>{children}</g>;
}

function MirrorLine({ view, m, name }: { view: View; m: Mirror; name?: string }) {
  const M = view.half;
  const p =
    m.kind === "h"
      ? { x1: view.sx(-M), y1: view.sy(m.k), x2: view.sx(M), y2: view.sy(m.k) }
      : { x1: view.sx(m.k), y1: view.sy(M), x2: view.sx(m.k), y2: view.sy(-M) };
  return (
    <g>
      <line {...p} stroke="#38bdf8" strokeWidth={5} strokeLinecap="round" opacity={0.85} />
      {name ? (
        <text
          x={m.kind === "h" ? view.sx(M) - 4 : view.sx(m.k) + 6}
          y={m.kind === "h" ? view.sy(m.k) - 7 : view.sy(-M) + 14}
          textAnchor={m.kind === "h" ? "end" : "start"}
          className="fill-sky-300 text-[10px] font-bold"
        >
          {name}
        </text>
      ) : null}
    </g>
  );
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
  if (len < 12) return null;
  const nx = -dy / len;
  const ny = dx / len;
  const S = 5;
  return (
    <g>
      {[0.35, 0.65].map((t) => {
        const cx = x1 + dx * t;
        const cy = y1 + dy * t;
        return <line key={t} x1={cx - nx * S} y1={cy - ny * S} x2={cx + nx * S} y2={cy + ny * S} stroke={color} strokeWidth={2.5} />;
      })}
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

function Chips({ ids, cur, done, onPick, emojis }: { ids: string[]; cur: number; done: string[]; onPick: (i: number) => void; emojis?: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ids.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => onPick(i)}
          className={
            "h-8 min-w-[2rem] rounded-lg border-2 px-1.5 text-xs font-bold transition " +
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

const C_A = "#e2e8f0";
const C_B = "#fbbf24";
const C_R = "#a78bfa";
const C_P = "#f472b6";

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "why" | "real" | "walls";

export default function ShortestPathLab() {
  const [tab, setTab] = useState<Tab>("why");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🛣️ 대칭이동과 최단 거리</h3>
        <p className="mt-2 leading-7 text-slate-300">
          꺾인 길은 재기 어렵죠. 한쪽을 <b className="text-violet-200">거울에 비춰 펴 버리면</b> 곧은 길이 되고, 두 점을 잇는 가장 짧은 길은 언제나 <b className="text-emerald-200">직선</b>이에요!
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "why"} onClick={() => setTab("why")}>
          ① 왜 대칭점일까 🎯
        </TabButton>
        <TabButton active={tab === "real"} onClick={() => setTab("real")}>
          ② 생활 속 최단 거리 🗺️
        </TabButton>
        <TabButton active={tab === "walls"} onClick={() => setTab("walls")}>
          ③ 두 번 튕기기 🔦
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "why" ? <WhyTab /> : null}
        {tab === "real" ? <RealTab /> : null}
        {tab === "walls" ? <WallsTab /> : null}
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
// 탭 ① 왜 대칭점일까
// ══════════════════════════════════════════════════════════════
function WhyTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [A, setA] = useState<Pt>(LAB_A);
  const [B, setB] = useState<Pt>(LAB_B);
  const [px, setPx] = useState(-3);
  const [showR, setShowR] = useState(false);
  const [best, setBest] = useState(false);

  const view = makeView(8);
  const R = reflectPt(B, LAB_MIRROR);
  const star = meetPoint(A, R, LAB_MIRROR);
  const minVal = dist(A, R);
  const P = { x: px, y: 0 };
  const cur = dist(A, P) + dist(P, B);
  const hit = Math.abs(px - star.x) < 0.051;

  function move(v: number) {
    setPx(v);
    if (Math.abs(v - star.x) < 0.051) setBest(true);
  }

  const { setDragId } = useDrag(svgRef, view, (id, p) => {
    if (id === "A") setA({ x: clampInt(p.x, -7, 7), y: clampInt(p.y, 1, 7) });
    else if (id === "B") setB({ x: clampInt(p.x, -7, 7), y: clampInt(p.y, 1, 7) });
    else move(Math.max(-8, Math.min(8, Math.round(p.x * 10) / 10)));
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={"rounded-2xl border p-3 transition " + (hit ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04]")}>
          <Plane cid="why-plane" svgRef={svgRef} label="최단 경로 실험">
            <Grid view={view} />
            <Clipped cid="why-plane">
              <MirrorLine view={view} m={LAB_MIRROR} name="거울" />
              {showR ? (
                <>
                  <line x1={view.sx(B.x)} y1={view.sy(B.y)} x2={view.sx(R.x)} y2={view.sy(R.y)} stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" />
                  <line x1={view.sx(A.x)} y1={view.sy(A.y)} x2={view.sx(R.x)} y2={view.sy(R.y)} stroke={C_R} strokeWidth={2} strokeDasharray="7 5" />
                  <line x1={view.sx(P.x)} y1={view.sy(P.y)} x2={view.sx(R.x)} y2={view.sy(R.y)} stroke={C_R} strokeWidth={3} />
                  <Ticks view={view} A={P} B={B} color={C_R} />
                  <Ticks view={view} A={P} B={R} color={C_R} />
                </>
              ) : null}
              <line x1={view.sx(A.x)} y1={view.sy(A.y)} x2={view.sx(P.x)} y2={view.sy(P.y)} stroke={hit ? "#34d399" : C_P} strokeWidth={3.5} />
              <line x1={view.sx(P.x)} y1={view.sy(P.y)} x2={view.sx(B.x)} y2={view.sy(B.y)} stroke={hit ? "#34d399" : C_P} strokeWidth={3.5} />
            </Clipped>
            {showR ? <Dot view={view} p={R} color={C_R} r={6} label="B′" /> : null}
            <Dot view={view} p={A} color={C_A} r={7} label={`A(${nz(A.x)}, ${nz(A.y)})`} onDown={() => setDragId("A")} />
            <Dot view={view} p={B} color={C_B} r={7} label={`B(${nz(B.x)}, ${nz(B.y)})`} onDown={() => setDragId("B")} />
            <Dot view={view} p={P} color={hit ? "#34d399" : C_P} r={7} label={`P(${fmt(px, 1)}, 0)`} onDown={() => setDragId("P")} />
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 분홍 점 P 를 거울 위에서 끌어 보세요 (A, B 도 옮길 수 있어요)</p>
        </div>

        <div className="space-y-3">
          <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (hit ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
            <p className="text-[11px] font-bold text-slate-300">지금 경로의 길이 AP + PB</p>
            <p className={"font-mono text-4xl font-extrabold " + (hit ? "text-emerald-100" : "text-pink-100")}>{fmt(cur)}</p>
            <p className="mt-0.5 text-[11px] font-bold text-slate-400">
              가장 짧은 길이 <span className="font-mono text-slate-100">{fmt(minVal)}</span>
            </p>
            <p className={"mt-1 text-sm font-extrabold " + (hit ? "text-emerald-200" : "text-slate-400")}>
              {hit ? "⭐ 최단 경로를 찾았어요!" : `${fmt(cur - minVal)} 만큼 더 길어요`}
            </p>
          </div>

          <MinCurve A={A} B={B} px={px} starX={star.x} minVal={minVal} />

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <button
              type="button"
              onClick={() => setShowR((v) => !v)}
              className="w-full rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-3 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
            >
              {showR ? "거울 속 B′ 숨기기" : "🪞 거울에 비친 B′ 보기"}
            </button>
            {showR ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Cell label="PB" value={fmt(dist(P, B))} tone="amber" />
                <Cell label="PB′" value={fmt(dist(P, R))} tone="violet" />
              </div>
            ) : (
              <p className="mt-2 text-center text-[11px] text-slate-400">B 를 거울에 비추면 무엇이 보일까요?</p>
            )}
          </div>
        </div>
      </div>

      {/* 증명 */}
      <div className={"rounded-2xl border-2 p-4 transition " + (best ? "border-violet-400/45 bg-violet-400/[0.10]" : "border-white/10 bg-slate-900/40 opacity-60")}>
        <p className="text-sm font-bold text-violet-100">🧠 왜 그럴까 — 네 줄 증명</p>
        {best ? (
          <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {PROOF_STEPS.map((s, i) => (
              <li key={i} className="rounded-xl bg-black/25 px-3 py-2">
                <p className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-400/25 text-[11px] font-bold text-violet-100">{i + 1}</span>
                  {s.note}
                </p>
                <div className="mt-1 overflow-x-auto overflow-y-hidden py-1 pl-7 text-slate-100">
                  <Katex expr={s.tex} />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-center text-xs text-slate-500">🔒 최단 경로를 한 번 찾으면 증명이 열려요</p>
        )}
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone: "amber" | "violet" | "sky" | "emerald" }) {
  const cls =
    tone === "amber"
      ? "border-amber-400/45 bg-amber-400/10 text-amber-100"
      : tone === "violet"
        ? "border-violet-400/45 bg-violet-400/10 text-violet-100"
        : tone === "sky"
          ? "border-sky-400/45 bg-sky-400/10 text-sky-100"
          : "border-emerald-400/45 bg-emerald-400/10 text-emerald-100";
  return (
    <div className={"rounded-xl border px-2 py-2 text-center " + cls}>
      <p className="text-[10px] font-bold opacity-85">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-bold">{value}</p>
    </div>
  );
}

/** P 의 위치에 따른 AP + PB 그래프 */
function MinCurve({ A, B, px, starX, minVal }: { A: Pt; B: Pt; px: number; starX: number; minVal: number }) {
  const W = 300;
  const H = 150;
  const ml = 30;
  const mb = 22;
  const lo = -8;
  const hi = 8;
  const f = (t: number) => dist(A, { x: t, y: 0 }) + dist({ x: t, y: 0 }, B);
  const top = Math.max(f(lo), f(hi));
  const gx = (t: number) => ml + ((t - lo) / (hi - lo)) * (W - ml - 12);
  const gy = (v: number) => H - mb - ((v - minVal) / Math.max(1e-6, top - minVal)) * (H - mb - 14);
  const path: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = lo + ((hi - lo) * i) / 80;
    path.push(`${i === 0 ? "M" : "L"}${gx(t).toFixed(1)},${gy(f(t)).toFixed(1)}`);
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
      <p className="text-sm font-bold text-slate-100">📉 P 를 옮기면 길이가 어떻게 변할까</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto mt-1 block w-full max-w-[320px]" role="img" aria-label="P 의 위치와 경로 길이">
        <line x1={ml} y1={H - mb} x2={W - 8} y2={H - mb} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
        <line x1={ml} y1={H - mb} x2={ml} y2={8} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
        <line x1={ml} y1={gy(minVal)} x2={W - 8} y2={gy(minVal)} stroke="rgba(52,211,153,0.45)" strokeDasharray="4 3" strokeWidth={1.5} />
        <path d={path.join(" ")} fill="none" stroke="#f472b6" strokeWidth={3} />
        <circle cx={gx(starX)} cy={gy(minVal)} r={5} fill="#34d399" stroke="#0f172a" strokeWidth={2} />
        <circle cx={gx(px)} cy={gy(f(px))} r={5} fill="#f472b6" stroke="#0f172a" strokeWidth={2} />
        <text x={ml - 5} y={gy(minVal) + 4} textAnchor="end" className="fill-emerald-300 font-mono text-[9px]">
          {minVal.toFixed(1)}
        </text>
        <text x={gx(starX)} y={H - mb + 13} textAnchor="middle" className="fill-emerald-300 font-mono text-[9px]">
          {starX.toFixed(1)}
        </text>
        <text x={W - 8} y={H - mb + 13} textAnchor="end" className="fill-slate-400 text-[10px] italic">
          P
        </text>
      </svg>
      <p className="mt-1 text-center text-[11px] text-slate-400">골짜기의 가장 낮은 곳이 최단 경로예요</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 생활 속 최단 거리
// ══════════════════════════════════════════════════════════════
function RealTab() {
  const [qi, setQi] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const q = MIN_QS[qi];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🗺️ 어디에 두어야 가장 가까울까?</p>
          <Chips ids={MIN_QS.map((x) => x.id)} cur={qi} done={solved} onPick={setQi} emojis={MIN_QS.map((x) => x.emoji)} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {["한쪽 지점을 거울에 비춘다", "비친 점과 다른 지점을 직선으로 잇는다", "그 직선이 거울과 만나는 곳!"].map((t, i) => (
            <div key={t} className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
              <p className="text-[11px] leading-5 text-slate-300">
                <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400/25 text-[10px] font-bold text-cyan-100">{i + 1}</span>
                {t}
              </p>
            </div>
          ))}
        </div>
      </div>

      <RealOne key={q.id} q={q} onSolved={() => setSolved((s) => (s.includes(q.id) ? s : [...s, q.id]))} />
    </div>
  );
}

function RealOne({ q, onSolved }: { q: MinQ; onSolved: () => void }) {
  const [rx, setRx] = useState("");
  const [ry, setRy] = useState("");
  const [mn, setMn] = useState("");
  const [pxs, setPxs] = useState("");
  const [pys, setPys] = useState("");

  const okRx = rx === "" ? null : parseNum(rx) === q.R.x;
  const okRy = ry === "" ? null : parseNum(ry) === q.R.y;
  const s1 = okRx === true && okRy === true;
  const okMn = mn === "" ? null : parseNum(mn) === q.min;
  const s2 = s1 && okMn === true;
  const okPx = pxs === "" ? null : parseNum(pxs) === q.P.x;
  const okPy = pys === "" ? null : parseNum(pys) === q.P.y;
  const s3 = s2 && okPx === true && okPy === true;

  const doneRef = useRef(false);
  useEffect(() => {
    if (s3 && !doneRef.current) {
      doneRef.current = true;
      onSolved();
    }
  });

  const view = makeView(q.half);
  const dx = q.R.x - q.A.x;
  const dy = q.R.y - q.A.y;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
          <p className="text-sm font-bold text-cyan-100">
            {q.emoji} {q.title}
          </p>
          <p className="mt-1 text-xs leading-6 text-slate-200">{q.story}</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label={q.nameA} tex={`\\text{A}${ptTex(q.A)}`} />
            <FormulaLine label={q.nameB} tex={`\\text{B}${ptTex(q.B)}`} />
            <FormulaLine label={q.lineName} tex={mirrorTex(q.m)} />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">좌표 한 칸은 1 {q.unit} 예요.</p>
        </div>

        <Step n={1} title={`${q.nameB} 를 ${q.lineName} 에 비춘 점 B′`} state={s1 ? "done" : "open"}>
          <div className="flex flex-wrap items-center gap-2 text-slate-200">
            <span className="font-mono text-sm">B′ =</span>
            <span className="font-mono text-lg">(</span>
            <NumBox value={rx} onChange={setRx} ok={okRx} label="B′의 x좌표" />
            <span className="font-mono text-lg">,</span>
            <NumBox value={ry} onChange={setRy} ok={okRy} label="B′의 y좌표" />
            <span className="font-mono text-lg">)</span>
          </div>
        </Step>

        <Step n={2} title="가장 짧은 거리 = AB′" state={s2 ? "done" : s1 ? "open" : "locked"}>
          <div className="overflow-x-auto overflow-y-hidden py-1 text-[13px] text-slate-200">
            <Katex expr={`\\overline{AB'} = \\sqrt{${dx * dx} + ${dy * dy}}`} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-200">
            <NumBox value={mn} onChange={setMn} ok={okMn} label="최솟값" />
            <span className="font-mono text-sm">{q.unit}</span>
          </div>
        </Step>

        <Step n={3} title="가장 좋은 자리 P" state={s3 ? "done" : s2 ? "open" : "locked"}>
          <p className="mb-2 text-[11px] text-slate-400">선분 AB′ 이 {q.lineName} 과 만나는 점이에요.</p>
          <div className="flex flex-wrap items-center gap-2 text-slate-200">
            <span className="font-mono text-sm">P =</span>
            <span className="font-mono text-lg">(</span>
            <NumBox value={pxs} onChange={setPxs} ok={okPx} label="P의 x좌표" />
            <span className="font-mono text-lg">,</span>
            <NumBox value={pys} onChange={setPys} ok={okPy} label="P의 y좌표" />
            <span className="font-mono text-lg">)</span>
          </div>
        </Step>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          <Plane cid={`real-${q.id}`} label={q.title}>
            <Grid view={view} />
            <Clipped cid={`real-${q.id}`}>
              <MirrorLine view={view} m={q.m} name={q.lineName} />
              {s1 ? <line x1={view.sx(q.B.x)} y1={view.sy(q.B.y)} x2={view.sx(q.R.x)} y2={view.sy(q.R.y)} stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" /> : null}
              {s2 ? <line x1={view.sx(q.A.x)} y1={view.sy(q.A.y)} x2={view.sx(q.R.x)} y2={view.sy(q.R.y)} stroke={C_R} strokeWidth={2.5} strokeDasharray="7 5" /> : null}
              {s3 ? (
                <>
                  <line x1={view.sx(q.A.x)} y1={view.sy(q.A.y)} x2={view.sx(q.P.x)} y2={view.sy(q.P.y)} stroke="#34d399" strokeWidth={3.5} />
                  <line x1={view.sx(q.P.x)} y1={view.sy(q.P.y)} x2={view.sx(q.B.x)} y2={view.sy(q.B.y)} stroke="#34d399" strokeWidth={3.5} />
                </>
              ) : null}
            </Clipped>
            {s1 ? <Dot view={view} p={q.R} color={C_R} r={6} label="B′" /> : null}
            {s3 ? <Dot view={view} p={q.P} color="#34d399" r={7} label={`P${ptTex(q.P)}`} /> : null}
            <Dot view={view} p={q.A} color={C_A} r={7} label="A" />
            <Dot view={view} p={q.B} color={C_B} r={7} label="B" />
          </Plane>
        </div>

        {s3 ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4">
            <p className="text-sm font-bold text-emerald-200">✅ 정리</p>
            <div className="mt-2 space-y-0.5">
              <FormulaLine label="대칭점" tex={`\\text{B}'${ptTex(q.R)}`} />
              <FormulaLine label="최솟값" tex={`\\overline{AB'} = \\sqrt{${dx * dx} + ${dy * dy}} = ${q.min}`} big />
              <FormulaLine label="자리" tex={`\\text{P}${ptTex(q.P)}`} />
            </div>
            <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
              A 에서 P 를 거쳐 B 로 가는 길이 <b>{q.min} {q.unit}</b> — 초록 길보다 짧은 길은 없어요!
            </p>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-5 text-center text-xs leading-6 text-slate-500">
            🔒 단계를 맞힐 때마다
            <br />
            그림이 한 겹씩 열려요
          </p>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 두 번 튕기기
// ══════════════════════════════════════════════════════════════
type RectView = { u: number; sx: (v: number) => number; sy: (v: number) => number };

function makeRect(x0: number, x1: number, y0: number, y1: number): RectView {
  const u = Math.min(SPAN / (x1 - x0), SPAN / (y1 - y0));
  const w = (x1 - x0) * u;
  const h = (y1 - y0) * u;
  const ox = PAD + (SPAN - w) / 2;
  const oy = PAD + (SPAN + h) / 2;
  return { u, sx: (v) => ox + (v - x0) * u, sy: (v) => oy - (v - y0) * u };
}

function WallsTab() {
  const [ri, setRi] = useState(0);
  const [cleared, setCleared] = useState<string[]>([]);
  const r = ROOMS[ri];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔦 아래 거울 → 왼쪽 거울, 두 번 튕겨 목표에 맞히기</p>
          <Chips ids={ROOMS.map((x) => x.id)} cur={ri} done={cleared} onPick={setRi} emojis={ROOMS.map((x) => x.emoji)} />
        </div>
      </div>

      <RoomOne key={r.id} r={r} onCleared={() => setCleared((s) => (s.includes(r.id) ? s : [...s, r.id]))} />
    </div>
  );
}

function RoomOne({ r, onCleared }: { r: Room; onCleared: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState(Math.round(r.W * 0.75 * 4) / 4);
  const [unfold, setUnfold] = useState(false);
  const [tot, setTot] = useState("");

  const step = 0.25;
  const view = unfold ? makeRect(-r.T.x - 1, r.W + 1, -r.S.y - 1, r.H + 1) : makeRect(-1, r.W + 1, -1, r.H + 1);
  const uRef = useRef(view);
  useEffect(() => {
    uRef.current = view;
  });

  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (!dragging) return;
    function move(e: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const px = (e.clientX - rect.left) * (VB / rect.width);
      const v = uRef.current;
      const raw = (px - v.sx(0)) / v.u;
      setA(Math.max(step, Math.min(r.W - step, Math.round(raw / step) * step)));
    }
    function up() {
      setDragging(false);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, r.W]);

  const tr = tracePath(r.S, a);
  const yAtT = tr.B && tr.B.y <= r.H ? tr.yAtX(r.T.x) : null;
  const miss = yAtT === null ? null : Math.abs(yAtT - r.T.y);
  const hit = miss !== null && miss < 1e-6;

  const okTot = tot === "" ? null : parseNum(tot) === r.total;
  const done = hit && okTot === true;

  const doneRef = useRef(false);
  useEffect(() => {
    if (done && !doneRef.current) {
      doneRef.current = true;
      onCleared();
    }
  });

  /** 발신기 S 를 아래 거울(x축)에 비춘 점 */
  const Sref = { x: r.S.x, y: -r.S.y };
  /** 목표 T 를 왼쪽 거울(y축)에 비춘 점 */
  const Tref = { x: -r.T.x, y: r.T.y };
  // 실제로 그려질 마지막 광선의 끝점
  const endX = r.W;
  const endY = tr.B ? tr.yAtX(endX) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={"rounded-2xl border p-3 transition " + (hit ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04]")}>
        <Plane cid={`room-${r.id}`} svgRef={svgRef} label={r.title}>
          <Clipped cid={`room-${r.id}`}>
            {/* 방 */}
            <rect x={view.sx(0)} y={view.sy(r.H)} width={r.W * view.u} height={r.H * view.u} fill="rgba(56,189,248,0.06)" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
            {/* 거울 두 벽 */}
            <line x1={view.sx(0)} y1={view.sy(0)} x2={view.sx(r.W)} y2={view.sy(0)} stroke="#38bdf8" strokeWidth={5} strokeLinecap="round" />
            <line x1={view.sx(0)} y1={view.sy(0)} x2={view.sx(0)} y2={view.sy(r.H)} stroke="#38bdf8" strokeWidth={5} strokeLinecap="round" />
            {unfold ? (
              <>
                {/* 왼쪽 거울 너머로 펼쳐진 방 (T′ 이 사는 곳) */}
                <rect x={view.sx(-r.T.x)} y={view.sy(r.H)} width={r.T.x * view.u} height={r.H * view.u} fill="rgba(167,139,250,0.05)" stroke="rgba(167,139,250,0.22)" strokeWidth={1} />
                {/* 아래 거울 너머로 펼쳐진 방 (S′ 이 사는 곳) */}
                <rect x={view.sx(0)} y={view.sy(0)} width={r.W * view.u} height={r.S.y * view.u} fill="rgba(167,139,250,0.05)" stroke="rgba(167,139,250,0.22)" strokeWidth={1} />
                <line x1={view.sx(r.S.x)} y1={view.sy(r.S.y)} x2={view.sx(Sref.x)} y2={view.sy(Sref.y)} stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" />
                <line x1={view.sx(r.T.x)} y1={view.sy(r.T.y)} x2={view.sx(Tref.x)} y2={view.sy(Tref.y)} stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" />
                <line x1={view.sx(Sref.x)} y1={view.sy(Sref.y)} x2={view.sx(Tref.x)} y2={view.sy(Tref.y)} stroke={C_R} strokeWidth={2.5} strokeDasharray="7 5" />
              </>
            ) : null}
            {/* 광선 */}
            <line x1={view.sx(r.S.x)} y1={view.sy(r.S.y)} x2={view.sx(a)} y2={view.sy(0)} stroke={hit ? "#34d399" : C_P} strokeWidth={3} />
            {tr.B ? (
              <>
                <line x1={view.sx(a)} y1={view.sy(0)} x2={view.sx(tr.B.x)} y2={view.sy(tr.B.y)} stroke={hit ? "#34d399" : C_P} strokeWidth={3} />
                {endY !== null ? <line x1={view.sx(tr.B.x)} y1={view.sy(tr.B.y)} x2={view.sx(endX)} y2={view.sy(endY)} stroke={hit ? "#34d399" : C_P} strokeWidth={3} strokeDasharray={hit ? undefined : "6 4"} /> : null}
              </>
            ) : null}
          </Clipped>
          {unfold ? (
            <>
              <Dot view={view as unknown as View} p={Sref} color={C_R} r={6} label="S′" />
              <Dot view={view as unknown as View} p={Tref} color={C_R} r={6} label="T′" />
            </>
          ) : null}
          {tr.B && tr.B.y <= r.H ? <Dot view={view as unknown as View} p={tr.B} color={C_B} r={5} label="B" /> : null}
          <g className="cursor-grab touch-none" onPointerDown={(e) => { e.preventDefault(); setDragging(true); }}>
            <circle cx={view.sx(a)} cy={view.sy(0)} r={18} fill="transparent" />
            <circle cx={view.sx(a)} cy={view.sy(0)} r={8} fill={hit ? "#34d399" : C_P} stroke="#0f172a" strokeWidth={2} />
            <text x={view.sx(a)} y={view.sy(0) + 22} textAnchor="middle" className="fill-white font-mono text-[10px] font-bold">
              A({fmt(a, 2)}, 0)
            </text>
          </g>
          <Dot view={view as unknown as View} p={r.S} color={C_A} r={7} label={r.nameS} />
          <Dot view={view as unknown as View} p={r.T} color="#f87171" r={7} label={r.nameT} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 아래 거울 위의 점 A 를 좌우로 끌어 목표를 맞혀 보세요</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
          <p className="text-sm font-bold text-cyan-100">
            {r.emoji} {r.title}
          </p>
          <p className="mt-1 text-xs leading-6 text-slate-200">{r.story}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Cell label={`${r.nameS} S`} value={`(${r.S.x}, ${r.S.y})`} tone="sky" />
            <Cell label={`${r.nameT} T`} value={`(${r.T.x}, ${r.T.y})`} tone="amber" />
          </div>
        </div>

        <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (hit ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
          <p className={"text-base font-extrabold " + (hit ? "text-emerald-100" : "text-slate-300")}>
            {hit ? "🎯 명중!" : miss === null ? "왼쪽 거울에 닿지 않아요" : `${fmt(miss)} ${r.unit} 빗나갔어요`}
          </p>
          {hit ? (
            <p className="mt-1 font-mono text-[11px] text-emerald-200">
              A({tn(r.A.x)}, 0) → B(0, {tn(r.B.y)})
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <button
            type="button"
            onClick={() => setUnfold((v) => !v)}
            className="w-full rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-3 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
          >
            {unfold ? "접기" : "🪞 양끝을 거울에 비춰 펴 보기"}
          </button>
          {unfold ? (
            <div className="mt-2 space-y-0.5">
              <FormulaLine label="아래 거울" tex={`\\text{S} \\to \\text{S}'(${r.S.x},\\; ${-r.S.y})`} />
              <FormulaLine label="왼쪽 거울" tex={`\\text{T} \\to \\text{T}'(${-r.T.x},\\; ${r.T.y})`} />
              <FormulaLine label="펴진 길" tex={`\\overline{S'T'} = \\sqrt{(${r.S.x} + ${r.T.x})^2 + (${r.S.y} + ${r.T.y})^2}`} />
              <p className="pt-1 text-[11px] leading-5 text-violet-100">
                ✨ 보라색 직선 S′T′ 이 <b className="text-white">두 거울과 만나는 곳</b>이 바로 반사점 A, B 예요.{" "}
                <span className="text-slate-300">SA = S′A, BT = BT′ 이라 길이도 그대로!</span>
              </p>
            </div>
          ) : (
            <p className="mt-2 text-center text-[11px] leading-5 text-slate-400">발신기는 아래 거울에, 목표는 왼쪽 거울에 비춰 보면 길이 곧게 펴져요</p>
          )}
        </div>

        <div className={"rounded-2xl border-2 p-4 transition " + (!hit ? "border-white/10 bg-slate-900/40 opacity-45" : done ? "border-emerald-400/60 bg-emerald-400/15" : "border-violet-400/45 bg-violet-400/[0.10]")}>
          <p className="text-sm font-bold text-slate-100">전체 이동 거리는 얼마일까요?</p>
          {hit ? (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-200">
                <span className="font-mono text-sm">S → A → B → T =</span>
                <NumBox value={tot} onChange={setTot} ok={okTot} label="전체 이동 거리" />
                <span className="font-mono text-sm">{r.unit}</span>
              </div>
              {done ? (
                <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-6 text-emerald-100">
                  ✅ 꺾인 길이지만 펴 놓으면 그냥 직선 하나! 세 조각을 따로 재지 않아도 <b>{r.total} {r.unit}</b> 이 나와요.
                </p>
              ) : (
                <p className="mt-1.5 text-[11px] text-slate-400">💡 &lsquo;양끝을 거울에 비춰 펴 보기&rsquo; 를 켜면 직선 하나로 보여요.</p>
              )}
            </>
          ) : (
            <p className="mt-1 text-[11px] text-slate-500">먼저 목표를 맞혀 보세요</p>
          )}
        </div>
      </div>
    </div>
  );
}
