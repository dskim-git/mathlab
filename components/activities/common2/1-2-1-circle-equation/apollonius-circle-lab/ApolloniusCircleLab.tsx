"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  RATIOS,
  REL_LABEL,
  SHAPE_META,
  apolloniusOf,
  circleGen,
  circleIntersections,
  diffLocus,
  dist2,
  externalPoint,
  fracPlain,
  fv,
  genIntTex,
  internalPoint,
  lineTex,
  radicalAxis,
  stdTexF,
  sumLocus,
  twoCircleRel,
  type Pt,
  type ShapeKind,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_circle",
    prompt:
      "두 점 A, B에서의 거리의 비가 일정한 점들이 왜 ‘원’이 되는지, 탭①에서 본 식의 변형 과정을 근거로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: n·PA = m·PB 의 양변을 제곱해 좌표로 쓰면 x², y²의 계수가 같고 xy항이 없는 식이 되어 원의 방정식 꼴이 된다. 그래서 자취가 원이 된다.",
  },
  {
    id: "ratio_one",
    prompt:
      "비를 1:1에 가깝게 만들수록 원은 어떻게 변했나요? 그리고 정확히 1:1이 되면 왜 원이 아니라 직선이 되는지 식으로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 비가 1에 가까울수록 원이 점점 커졌다. m = n 이면 x²+y² 앞의 계수 n²−m² 이 0이 되어 이차항이 사라지고 일차식만 남는다. 그 직선이 바로 AB의 수직이등분선이다.",
  },
  {
    id: "other_loci",
    prompt:
      "탭②·③에서 본 결과 중 가장 인상 깊었던 것을 하나 고르고, 왜 그런 도형이 나오는지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 두 원의 방정식을 빼면 x², y²이 사라져 일차식만 남고, 그 직선이 두 교점을 정확히 지나는 것이 신기했다. 두 원의 방정식을 모두 만족하는 점은 뺀 식도 만족하기 때문이다.",
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
  children,
}: {
  cid: string;
  view: View;
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
        className={"mx-auto block w-full touch-none select-none " + (small ? "max-w-[320px]" : "max-w-[440px]")}
        role="img"
        aria-label={label}
      >
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

function CircleDraw({ view, c, r, color, fill, width = 3, dash }: { view: View; c: Pt; r: number; color: string; fill?: string; width?: number; dash?: string }) {
  return <circle cx={view.sx(c.x)} cy={view.sy(c.y)} r={r * view.u} fill={fill ?? "none"} stroke={color} strokeWidth={width} strokeDasharray={dash} />;
}

/** ax + by + c = 0 */
function LineDraw({ view, a, b, c, color, width = 3, dash }: { view: View; a: number; b: number; c: number; color: string; width?: number; dash?: string }) {
  if (a === 0 && b === 0) return null;
  const L = view.half + 5;
  let p: [number, number, number, number];
  if (b === 0) {
    const x = -c / a;
    p = [view.sx(x), view.sy(L), view.sx(x), view.sy(-L)];
  } else {
    const yAt = (x: number) => (-a * x - c) / b;
    p = [view.sx(-L), view.sy(yAt(-L)), view.sx(L), view.sy(yAt(L))];
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
              onDown();
            }
          : undefined
      }
    >
      {onDown ? <circle cx={view.sx(p.x)} cy={view.sy(p.y)} r={16} fill="transparent" /> : null}
      <circle cx={view.sx(p.x)} cy={view.sy(p.y)} r={r} fill={color} stroke="#0f172a" strokeWidth={2} />
      {label ? (
        <text x={view.sx(p.x)} y={view.sy(p.y) - 12} textAnchor="middle" className="fill-white font-mono text-[10px] font-bold">
          {label}
        </text>
      ) : null}
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
function q4(v: number): number {
  return Math.round(v * 4) / 4;
}

function FormulaLine({ tex, label, big }: { tex: string; label?: string; big?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      {label ? <span className="w-16 shrink-0 text-[10px] font-bold text-slate-400">{label}</span> : null}
      <span className={"min-w-0 flex-1 py-1 text-slate-100 " + (big ? "text-lg" : "")}>
        <Katex expr={tex} />
      </span>
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "apollo" | "loci" | "twoCircles";

export default function ApolloniusCircleLab() {
  const [tab, setTab] = useState<Tab>("apollo");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🌀 아폴로니오스의 원</h3>
        <p className="mt-2 leading-7 text-slate-300">
          두 점에서의 <b className="text-emerald-200">거리의 비가 일정한 점</b>들을 직접 찍어 보면 놀랍게도 원이 나타나요. 거리 조건을 바꾸면 또 어떤 도형이 나올까요?
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "apollo"} onClick={() => setTab("apollo")}>
          ① 비가 일정한 점 찾기 🔍
        </TabButton>
        <TabButton active={tab === "loci"} onClick={() => setTab("loci")}>
          ② 거리 조건 3형제
        </TabButton>
        <TabButton active={tab === "twoCircles"} onClick={() => setTab("twoCircles")}>
          ③ 두 원이 만나는 곳 ✂️
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "apollo" ? <ApolloTab /> : null}
        {tab === "loci" ? <LociTab /> : null}
        {tab === "twoCircles" ? <TwoCirclesTab /> : null}
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
// 탭 ① 비가 일정한 점 찾기
// ══════════════════════════════════════════════════════════════
function ApolloTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [A, setA] = useState<Pt>({ x: -3, y: 0 });
  const [B, setB] = useState<Pt>({ x: 3, y: 0 });
  const [ri, setRi] = useState(1); // RATIOS 인덱스 (기본 1:2)
  const [P, setP] = useState<Pt>({ x: -1, y: 0 });
  const [found, setFound] = useState<Pt[]>([]);
  const [reveal, setReveal] = useState(false);

  const { m, n } = RATIOS[ri];
  const ap = apolloniusOf(A, B, m, n);

  // 보이는 범위 계산 — 원이 커져도 화면에 담기도록
  let need = Math.max(Math.abs(A.x), Math.abs(A.y), Math.abs(B.x), Math.abs(B.y), 6) + 1;
  if (ap.kind === "circle") {
    const cx = fv(ap.center.x);
    const cy = fv(ap.center.y);
    const r = Math.sqrt(Math.max(0, fv(ap.r2)));
    need = Math.max(need, Math.abs(cx) + r + 1, Math.abs(cy) + r + 1);
  }
  const view = makeView(need);

  const { setDragId } = useDrag(svgRef, view, (id, p) => {
    if (id === "A") setA({ x: clampInt(p.x, -8, 8), y: clampInt(p.y, -8, 8) });
    else if (id === "B") setB({ x: clampInt(p.x, -8, 8), y: clampInt(p.y, -8, 8) });
    else setP({ x: q4(p.x), y: q4(p.y) });
  });

  const PA = Math.sqrt(dist2(P, A));
  const PB = Math.sqrt(dist2(P, B));
  const gap = Math.abs(n * PA - m * PB);
  const tol = 0.2 * Math.max(1, (m + n) / 2);
  const hit = gap < tol;

  // 조건을 만족하는 자리에 오면 자동으로 흔적을 남긴다
  const foundRef = useRef<Pt[]>([]);
  useEffect(() => {
    if (!hit) return;
    const near = foundRef.current.some((f) => dist2(f, P) < 0.6);
    if (near || foundRef.current.length >= 40) return;
    foundRef.current = [...foundRef.current, P];
    setFound(foundRef.current);
  }, [hit, P]);

  function resetHunt() {
    foundRef.current = [];
    setFound([]);
    setReveal(false);
  }

  const inner = internalPoint(A, B, m, n);
  const outer = externalPoint(A, B, m, n);

  return (
    <div className="space-y-4">
      {/* 비 선택 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">
            ⚖️ 조건: <span className="font-mono text-emerald-200">PA : PB = {m} : {n}</span>
          </p>
          <button
            type="button"
            onClick={resetHunt}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↺ 찾은 점 지우기
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {RATIOS.map((r, i) => (
            <button
              key={`${r.m}:${r.n}`}
              type="button"
              onClick={() => {
                setRi(i);
                resetHunt();
              }}
              className={
                "rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition " +
                (i === ri ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {r.m} : {r.n}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 그래프 */}
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          <Plane cid="apollo-plane" view={view} svgRef={svgRef} label="거리의 비가 일정한 점들">
            <Clipped cid="apollo-plane">
              {reveal ? (
                ap.kind === "circle" ? (
                  <CircleDraw
                    view={view}
                    c={{ x: fv(ap.center.x), y: fv(ap.center.y) }}
                    r={Math.sqrt(Math.max(0, fv(ap.r2)))}
                    color="#fb923c"
                    fill="rgba(251,146,60,0.10)"
                    width={3}
                  />
                ) : (
                  <LineDraw view={view} a={ap.a} b={ap.b} c={ap.c} color="#fb923c" width={3} />
                )
              ) : null}
              {/* 찾은 점들 */}
              {found.map((f, i) => (
                <circle key={i} cx={view.sx(f.x)} cy={view.sy(f.y)} r={3.5} fill="#fb923c" fillOpacity={0.9} />
              ))}
              {/* PA, PB */}
              <line x1={view.sx(P.x)} y1={view.sy(P.y)} x2={view.sx(A.x)} y2={view.sy(A.y)} stroke="#22d3ee" strokeWidth={2} />
              <line x1={view.sx(P.x)} y1={view.sy(P.y)} x2={view.sx(B.x)} y2={view.sy(B.y)} stroke="#fbbf24" strokeWidth={2} />
              {reveal && ap.kind === "circle" && outer ? (
                <line
                  x1={view.sx(fv(inner.x))}
                  y1={view.sy(fv(inner.y))}
                  x2={view.sx(fv(outer.x))}
                  y2={view.sy(fv(outer.y))}
                  stroke="#f472b6"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
              ) : null}
            </Clipped>
            {reveal && ap.kind === "circle" ? (
              <>
                <Dot view={view} p={{ x: fv(inner.x), y: fv(inner.y) }} color="#f472b6" r={5} label="C" />
                {outer ? <Dot view={view} p={{ x: fv(outer.x), y: fv(outer.y) }} color="#f472b6" r={5} label="D" /> : null}
              </>
            ) : null}
            <Dot view={view} p={A} color="#22d3ee" label={`A(${nx(A.x)}, ${nx(A.y)})`} onDown={() => setDragId("A")} />
            <Dot view={view} p={B} color="#fbbf24" label={`B(${nx(B.x)}, ${nx(B.y)})`} onDown={() => setDragId("B")} />
            <Dot view={view} p={P} color={hit ? "#34d399" : "#e2e8f0"} label="P" onDown={() => setDragId("P")} r={7} />
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 흰 점 P를 끌어 조건을 만족하는 자리를 찾아보세요 (A, B도 옮길 수 있어요)</p>
        </div>

        <div className="space-y-3">
          {/* 측정 */}
          <div className={"rounded-2xl border-2 p-4 transition-colors " + (hit ? "border-emerald-400/60 bg-emerald-400/12" : "border-white/10 bg-slate-900/40")}>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="PA" value={PA.toFixed(2)} tone="cyan" />
              <Metric label="PB" value={PB.toFixed(2)} tone="amber" />
            </div>
            <p className="mt-2 text-center font-mono text-lg font-bold text-white">
              PA : PB = {PB > 0.01 ? (PA / PB).toFixed(2) : "—"} : 1
            </p>
            <p className="mt-0.5 text-center font-mono text-xs text-slate-400">목표 {(m / n).toFixed(2)} : 1</p>
            <p className={"mt-1 text-center text-sm font-extrabold " + (hit ? "text-emerald-200" : "text-slate-400")}>
              {hit ? "🎯 조건을 만족해요! 점이 찍혔어요" : "아직 아니에요 — P를 더 움직여 보세요"}
            </p>
          </div>

          {/* 찾은 점 */}
          <div className="rounded-2xl border border-orange-400/30 bg-orange-400/[0.08] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-orange-200">🔍 찾은 점</p>
              <span className="rounded-full border border-orange-400/45 bg-orange-400/15 px-3 py-1 font-mono text-xs font-bold text-orange-100">
                {found.length} 개
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              {found.length === 0
                ? "P를 끌어 조건을 만족하는 자리를 찾아보세요. 찾을 때마다 주황 점이 남아요."
                : found.length < 6
                  ? "좋아요! 점을 더 모으면 어떤 모양이 보일까요?"
                  : "점들이 어떤 모양으로 늘어서 있나요? 아래 버튼으로 확인해 보세요!"}
            </p>
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              disabled={found.length === 0 && !reveal}
              className="mt-2 w-full rounded-xl border-2 border-orange-400/55 bg-orange-400/15 px-4 py-2 text-sm font-bold text-orange-100 transition hover:bg-orange-400/25 disabled:opacity-40"
            >
              {reveal ? "자취 숨기기" : "✨ 자취 보기"}
            </button>
          </div>

          {/* 식 */}
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
            <p className="text-sm font-bold text-emerald-200">✍️ 왜 원이 될까?</p>
            <div className="mt-2 space-y-0.5">
              <FormulaLine label="조건" tex={`${n === 1 ? "" : n}\\overline{PA} = ${m === 1 ? "" : m}\\overline{PB}`} />
              <FormulaLine label="제곱" tex={`${n * n}\\,\\overline{PA}^2 = ${m * m}\\,\\overline{PB}^2`} />
              <FormulaLine
                label="좌표로"
                tex={`${n * n}\\{(x ${A.x <= 0 ? "+" : "-"} ${Math.abs(A.x)})^2 + (y ${A.y <= 0 ? "+" : "-"} ${Math.abs(A.y)})^2\\} = ${m * m}\\{(x ${B.x <= 0 ? "+" : "-"} ${Math.abs(B.x)})^2 + (y ${B.y <= 0 ? "+" : "-"} ${Math.abs(B.y)})^2\\}`}
              />
              {ap.kind === "circle" ? (
                <>
                  <FormulaLine label="정리" tex={genIntTex(ap.k, ap.D, ap.E, ap.F)} />
                  <FormulaLine label="표준형" tex={stdTexF(ap.center.x, ap.center.y, ap.r2)} big />
                </>
              ) : (
                <FormulaLine label="정리" tex={lineTex(ap.a, ap.b, ap.c)} big />
              )}
            </div>
            {ap.kind === "circle" ? (
              <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-xs leading-5 text-emerald-100">
                x², y²의 계수가 같고 xy항이 없으니 <b>원의 방정식</b>이에요. 지름의 양 끝점은 선분 AB를 {m}:{n} 으로{" "}
                <b className="text-pink-200">내분한 점 C({fracPlain(inner.x)}, {fracPlain(inner.y)})</b> 와{" "}
                <b className="text-pink-200">외분한 점 D({outer ? fracPlain(outer.x) : "—"}, {outer ? fracPlain(outer.y) : "—"})</b> 랍니다.
              </p>
            ) : (
              <p className="mt-2 rounded-lg bg-amber-400/15 px-3 py-2 text-xs leading-5 text-amber-100">
                ⚠️ 비가 <b>1 : 1</b> 이면 x²+y² 앞의 계수 n²−m² 이 <b>0</b> 이 되어 이차항이 사라져요. 남는 것은 일차식 — 자취는 원이 아니라{" "}
                <b>선분 AB의 수직이등분선</b>입니다!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 관찰 */}
      <div className="rounded-2xl border-2 border-violet-400/40 bg-violet-400/[0.10] p-4">
        <p className="text-sm font-bold text-violet-200">🔭 비를 바꿔 보면</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <ObsCard n="1" text="비가 1에서 멀수록 (1:3, 1:4) 원이 작아지고, 가까운 점 쪽으로 쏠려요" />
          <ObsCard n="2" text="비가 1에 가까울수록 (3:4, 4:3) 원이 아주 커져요" />
          <ObsCard n="3" text="정확히 1:1 이 되면 원이 무한히 커져 직선(수직이등분선)이 돼요" />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "cyan" | "amber" }) {
  const cls = tone === "cyan" ? "border-cyan-400/45 bg-cyan-400/10 text-cyan-100" : "border-amber-400/45 bg-amber-400/10 text-amber-100";
  return (
    <div className={"rounded-xl border px-3 py-2 text-center " + cls}>
      <p className="text-[11px] font-bold opacity-85">{label}</p>
      <p className="mt-0.5 font-mono text-xl font-bold">{value}</p>
    </div>
  );
}

function ObsCard({ n, text }: { n: string; text: string }) {
  return (
    <div className="rounded-xl bg-black/25 px-3 py-2">
      <p className="text-xs leading-6 text-slate-200">
        <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-400/25 text-[11px] font-bold text-violet-100">{n}</span>
        {text}
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 거리 조건 3형제
// ══════════════════════════════════════════════════════════════
const SHAPES: ShapeKind[] = ["ratio", "sum", "diff"];

function LociTab() {
  const [kind, setKind] = useState<ShapeKind>("ratio");
  const [ri, setRi] = useState(1);
  const [kSum, setKSum] = useState(40);
  const [kDiff, setKDiff] = useState(24);

  const A: Pt = { x: -3, y: 0 };
  const B: Pt = { x: 3, y: 0 };
  const { m, n } = RATIOS[ri];

  const ap = apolloniusOf(A, B, m, n);
  const sum = sumLocus(A, B, kSum);
  const diff = diffLocus(A, B, kDiff);

  let need = 8;
  if (kind === "ratio" && ap.kind === "circle") {
    need = Math.max(need, Math.abs(fv(ap.center.x)) + Math.sqrt(Math.max(0, fv(ap.r2))) + 1);
  }
  if (kind === "sum" && sum.r2 > 0) need = Math.max(need, Math.sqrt(sum.r2) + 1);
  const view = makeView(need);

  const meta = SHAPE_META[kind];

  return (
    <div className="space-y-4">
      <div className="grid gap-1.5 sm:grid-cols-3">
        {SHAPES.map((s) => {
          const mt = SHAPE_META[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setKind(s)}
              className={
                "rounded-xl border-2 px-3 py-2.5 text-left transition " +
                (s === kind ? "border-emerald-400/60 bg-emerald-400/20" : "border-white/10 bg-white/5 hover:bg-white/10")
              }
            >
              <p className="text-xs font-bold text-slate-100">
                {mt.emoji} {mt.title}
              </p>
              <div className="mt-0.5 text-[13px] text-slate-200">
                <Katex expr={mt.cond} />
              </div>
              <p className="mt-0.5 text-[11px] font-bold text-emerald-200">→ {mt.result}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          <Plane cid="loci-plane" view={view} label="거리 조건이 만드는 도형">
            <Clipped cid="loci-plane">
              {kind === "ratio" ? (
                ap.kind === "circle" ? (
                  <CircleDraw
                    view={view}
                    c={{ x: fv(ap.center.x), y: fv(ap.center.y) }}
                    r={Math.sqrt(Math.max(0, fv(ap.r2)))}
                    color="#34d399"
                    fill="rgba(52,211,153,0.12)"
                  />
                ) : (
                  <LineDraw view={view} a={ap.a} b={ap.b} c={ap.c} color="#34d399" />
                )
              ) : null}
              {kind === "sum" && sum.r2 > 0 ? (
                <CircleDraw view={view} c={sum.center} r={Math.sqrt(sum.r2)} color="#38bdf8" fill="rgba(56,189,248,0.12)" />
              ) : null}
              {kind === "diff" ? <LineDraw view={view} a={diff.a} b={diff.b} c={diff.c} color="#a78bfa" /> : null}
              <line x1={view.sx(A.x)} y1={view.sy(A.y)} x2={view.sx(B.x)} y2={view.sy(B.y)} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeDasharray="4 3" />
            </Clipped>
            <Dot view={view} p={A} color="#22d3ee" label="A(−3, 0)" />
            <Dot view={view} p={B} color="#fbbf24" label="B(3, 0)" />
          </Plane>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-sm font-bold text-slate-100">
              {meta.emoji} 조건 바꿔 보기
            </p>
            {kind === "ratio" ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {RATIOS.map((r, i) => (
                  <button
                    key={`${r.m}:${r.n}`}
                    type="button"
                    onClick={() => setRi(i)}
                    className={
                      "rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition " +
                      (i === ri ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                    }
                  >
                    {r.m} : {r.n}
                  </button>
                ))}
              </div>
            ) : kind === "sum" ? (
              <>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">k</span>
                  <span className="font-mono text-xs font-bold text-slate-100">{kSum}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={80}
                  step={2}
                  value={kSum}
                  aria-label="거리의 제곱의 합 k"
                  onChange={(e) => setKSum(Number(e.target.value))}
                  className="mt-1 h-1.5 w-full accent-sky-400"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  k 를 줄여 보세요. k = 18 이면 점 하나, 그보다 작으면 그런 점이 아예 없어요!
                </p>
              </>
            ) : (
              <>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">k</span>
                  <span className="font-mono text-xs font-bold text-slate-100">{kDiff}</span>
                </div>
                <input
                  type="range"
                  min={-48}
                  max={48}
                  step={6}
                  value={kDiff}
                  aria-label="거리의 제곱의 차 k"
                  onChange={(e) => setKDiff(Number(e.target.value))}
                  className="mt-1 h-1.5 w-full accent-violet-400"
                />
                <p className="mt-1 text-[11px] text-slate-400">k 를 바꾸면 직선이 좌우로만 움직여요 — 언제나 AB에 수직!</p>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
            <p className="text-sm font-bold text-emerald-200">📐 지금 조건과 결과</p>
            <div className="mt-2 space-y-0.5">
              {kind === "ratio" ? (
                <>
                  <FormulaLine label="조건" tex={`\\overline{PA} : \\overline{PB} = ${m} : ${n}`} />
                  {ap.kind === "circle" ? (
                    <FormulaLine label="자취" tex={stdTexF(ap.center.x, ap.center.y, ap.r2)} big />
                  ) : (
                    <FormulaLine label="자취" tex={lineTex(ap.a, ap.b, ap.c)} big />
                  )}
                </>
              ) : kind === "sum" ? (
                <>
                  <FormulaLine label="조건" tex={`\\overline{PA}^2 + \\overline{PB}^2 = ${kSum}`} />
                  <FormulaLine label="정리" tex={`2(x^2 + y^2) + 18 = ${kSum}`} />
                  {sum.r2 > 0 ? <FormulaLine label="자취" tex={`x^2 + y^2 = ${sum.r2}`} big /> : null}
                </>
              ) : (
                <>
                  <FormulaLine label="조건" tex={`\\overline{PA}^2 - \\overline{PB}^2 = ${kDiff}`} />
                  <FormulaLine label="정리" tex={`-12x = ${kDiff}`} />
                  <FormulaLine label="자취" tex={lineTex(diff.a, diff.b, diff.c)} big />
                </>
              )}
            </div>
            {kind === "sum" && sum.r2 <= 0 ? (
              <p className="mt-1 rounded-lg bg-amber-400/15 px-3 py-2 text-xs leading-5 text-amber-100">
                {sum.r2 === 0 ? "⚠️ 반지름이 0 — 원점 한 점뿐이에요!" : "⚠️ 오른쪽이 음수라 그런 점이 하나도 없어요!"}
              </p>
            ) : null}
            {kind === "diff" ? (
              <p className="mt-1 rounded-lg bg-violet-400/12 px-3 py-2 text-xs leading-5 text-violet-100">
                제곱의 <b>차</b>에서는 x², y²이 서로 지워져 <b>일차식</b>만 남아요. 그래서 자취가 직선이 됩니다.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* 요약 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">🗂️ 한눈에 정리</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {SHAPES.map((s) => {
            const mt = SHAPE_META[s];
            return (
              <div key={s} className={"rounded-xl border px-3 py-2.5 " + (s === kind ? "border-emerald-400/45 bg-emerald-400/[0.10]" : "border-white/10 bg-slate-950/50")}>
                <p className="text-xs font-bold text-slate-200">
                  {mt.emoji} {mt.title}
                </p>
                <div className="mt-1 text-[13px] text-slate-100">
                  <Katex expr={mt.cond} />
                </div>
                <p className="mt-1 text-[11px] font-bold text-emerald-200">{mt.result}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-center text-xs text-slate-300">
          비와 제곱의 합은 <b className="text-emerald-200">원</b>, 제곱의 차는 <b className="text-violet-200">직선</b> — x², y²이 남느냐 지워지느냐가 갈림길이에요.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 두 원이 만나는 곳
// ══════════════════════════════════════════════════════════════
function TwoCirclesTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [c1, setC1] = useState<Pt>({ x: 0, y: 0 });
  const [c2, setC2] = useState<Pt>({ x: 6, y: 0 });
  const [r1, setR1] = useState(5);
  const [r2, setR2] = useState(5);
  const [subtract, setSubtract] = useState(false);

  const view = makeView(Math.max(10, Math.abs(c1.x) + r1 + 1, Math.abs(c2.x) + r2 + 1, Math.abs(c1.y) + r1 + 1, Math.abs(c2.y) + r2 + 1));
  const { setDragId } = useDrag(svgRef, view, (id, p) => {
    const q = { x: clampInt(p.x, -8, 8), y: clampInt(p.y, -8, 8) };
    if (id === "c1") setC1(q);
    else setC2(q);
  });

  const rel = twoCircleRel(c1, r1, c2, r2);
  const pts = circleIntersections(c1, r1, c2, r2);
  const axis = radicalAxis(c1, r1, c2, r2);
  const g1 = circleGen(c1, r1);
  const g2 = circleGen(c2, r2);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          <Plane cid="two-plane" view={view} svgRef={svgRef} label="두 원의 위치 관계">
            <Clipped cid="two-plane">
              <CircleDraw view={view} c={c1} r={r1} color="#22d3ee" fill="rgba(34,211,238,0.10)" />
              <CircleDraw view={view} c={c2} r={r2} color="#fbbf24" fill="rgba(251,191,36,0.10)" />
              {subtract ? <LineDraw view={view} a={axis.a} b={axis.b} c={axis.c} color="#fb923c" width={3} /> : null}
            </Clipped>
            {pts.map((p, i) => (
              <Dot key={i} view={view} p={p} color="#34d399" r={6} label={`(${nx(p.x)}, ${nx(p.y)})`} />
            ))}
            <Dot view={view} p={c1} color="#22d3ee" r={5} onDown={() => setDragId("c1")} />
            <Dot view={view} p={c2} color="#fbbf24" r={5} onDown={() => setDragId("c2")} />
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 두 원의 중심을 끌어 보세요</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <RSlider label="파란 원의 반지름" value={r1} onChange={setR1} tone="cyan" />
              <RSlider label="노란 원의 반지름" value={r2} onChange={setR2} tone="amber" />
            </div>
            <div className={"mt-3 rounded-xl border-2 px-3 py-2 text-center " + (rel === "cross" ? "border-emerald-400/55 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
              <p className="text-[11px] font-bold text-slate-400">두 원의 위치 관계</p>
              <p className={"mt-0.5 text-base font-extrabold " + (rel === "cross" ? "text-emerald-200" : "text-slate-100")}>{REL_LABEL[rel]}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-400/30 bg-orange-400/[0.08] p-4">
            <p className="text-sm font-bold text-orange-200">✂️ 두 원의 방정식을 빼 보면?</p>
            <div className="mt-2 space-y-0.5">
              <FormulaLine label="파란 원" tex={genIntTex(1, g1.D, g1.E, g1.F)} />
              <FormulaLine label="노란 원" tex={genIntTex(1, g2.D, g2.E, g2.F)} />
            </div>
            <button
              type="button"
              onClick={() => setSubtract((v) => !v)}
              className="mt-2 w-full rounded-xl border-2 border-orange-400/55 bg-orange-400/15 px-4 py-2 text-sm font-bold text-orange-100 transition hover:bg-orange-400/25"
            >
              {subtract ? "결과 숨기기" : "✂️ 빼 보기"}
            </button>
            {subtract ? (
              <div className="mt-2 space-y-1">
                <div className="rounded-lg border border-orange-400/45 bg-orange-400/15 px-3 py-2">
                  <p className="text-[10px] font-bold text-orange-200">x², y² 이 사라지고 일차식만!</p>
                  <FormulaLine tex={lineTex(axis.a, axis.b, axis.c)} big />
                </div>
                <p className="text-xs leading-5 text-slate-300">
                  {pts.length === 2 ? (
                    <>
                      이 직선이 두 교점 <b className="text-emerald-200">({nx(pts[0].x)}, {nx(pts[0].y)})</b>, <b className="text-emerald-200">({nx(pts[1].x)}, {nx(pts[1].y)})</b> 를 정확히
                      지나요! 두 원의 방정식을 모두 만족하는 점은 그 둘을 뺀 식도 만족하기 때문이에요. 이 직선을 <b className="text-orange-200">공통현</b>이라고 해요.
                    </>
                  ) : pts.length === 1 ? (
                    <>두 원이 한 점에서 접할 때는 이 직선이 그 접점을 지나는 <b className="text-orange-200">공통접선</b>이 돼요.</>
                  ) : (
                    <>지금은 두 원이 만나지 않아 교점이 없어요. 중심을 옮겨 두 원이 만나게 해 보세요!</>
                  )}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs leading-5 text-slate-400">
                두 식 모두 x² + y² 으로 시작해요. 빼면 무엇이 남을까요? 버튼을 눌러 확인해 보세요.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RSlider({ label, value, onChange, tone }: { label: string; value: number; onChange: (v: number) => void; tone: "cyan" | "amber" }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400">{label}</span>
        <span className="font-mono text-xs font-bold text-slate-100">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={8}
        step={1}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-1 h-1.5 w-full " + (tone === "cyan" ? "accent-cyan-400" : "accent-amber-400")}
      />
    </div>
  );
}
