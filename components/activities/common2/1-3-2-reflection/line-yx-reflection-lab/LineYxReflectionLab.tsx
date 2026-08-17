"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CARDS,
  EQ_QS,
  FIGS,
  MOVE_META,
  STAGES,
  SUMMARY,
  BASE_TRI,
  applyMove,
  figCurve,
  goalOf,
  midPt,
  nz,
  pairIndexOf,
  ptTex,
  samePts,
  swapCurves,
  swapPt,
  type EqQ,
  type Fig,
  type Move,
  type Pt,
  type Stage,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_swap",
    prompt:
      "점 (x, y)를 직선 y = x에 대해 대칭이동하면 왜 (y, x)가 되는지, 탭①에서 확인한 두 조건(수직·중점)을 근거로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: y = x가 PP′를 수직이등분하므로 ① PP′의 기울기가 −1이고 ② PP′의 중점이 y = x 위에 있다. 두 조건을 식으로 쓰면 x′ + y′ = x + y, x′ − y′ = −x + y 이고, 연립하면 x′ = y, y′ = x가 되어 좌표가 통째로 맞바뀐다.",
  },
  {
    id: "figure_swap",
    prompt:
      "탭②에서 도형을 y = x에 대해 대칭이동할 때 식이 어떻게 바뀌었나요? 원본과 겹치는 도형이 있었다면 어떤 것이었고 왜 그런지도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: f(x, y) = 0 에서 x와 y를 통째로 맞바꾼 f(y, x) = 0 이 되었다. x² + y² = 9 나 xy = 4 는 x와 y를 바꿔도 식이 그대로라 자기 자신과 겹쳤다.",
  },
  {
    id: "game_insight",
    prompt:
      "탭③ 퍼즐에서 새로 알게 된 것을 하나 골라 설명해 보세요. (예: 어떤 버튼이 잠겼을 때 다른 버튼 조합으로 대신한 방법, 또는 대칭을 두 번 이어 했을 때 생긴 일)",
    kind: "text",
    placeholder:
      "예: 왼쪽 버튼이 잠겼을 때 y축 대칭으로 뒤집고 오른쪽으로 간 다음 다시 y축 대칭으로 되돌리면 왼쪽으로 옮긴 것과 같아졌다. 또 y = x 대칭 다음 x축 대칭을 하면 도형이 90° 돌아갔다.",
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

/** 거울 역할을 하는 직선 y = x */
function MirrorLine({ view, faint }: { view: View; faint?: boolean }) {
  const M = view.half;
  return (
    <g>
      <line
        x1={view.sx(-M)}
        y1={view.sy(-M)}
        x2={view.sx(M)}
        y2={view.sy(M)}
        stroke={faint ? "rgba(251,191,36,0.30)" : "#fbbf24"}
        strokeWidth={faint ? 2 : 3}
        strokeDasharray={faint ? "6 6" : undefined}
      />
      <text x={view.sx(M) - 6} y={view.sy(M) + 16} textAnchor="end" className="fill-amber-300 text-[10px] font-bold italic">
        y = x
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

function Tri({ view, pts, fill, stroke, width = 3, dash }: { view: View; pts: Pt[]; fill: string; stroke: string; width?: number; dash?: string }) {
  return <polygon points={pts.map((p) => `${view.sx(p.x)},${view.sy(p.y)}`).join(" ")} fill={fill} stroke={stroke} strokeWidth={width} strokeDasharray={dash} strokeLinejoin="round" />;
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
  const at = (t: number) => ({ x: x1 + dx * t, y: y1 + dy * t });
  const S = 5;
  return (
    <g>
      {[0.3, 0.7].map((t) => {
        const c = at(t);
        return <line key={t} x1={c.x - nx * S} y1={c.y - ny * S} x2={c.x + nx * S} y2={c.y + ny * S} stroke={color} strokeWidth={2.5} />;
      })}
    </g>
  );
}

/** y = x 위의 점 M 에서의 직각 표시 */
function RightAngleAtMirror({ view, M, size = 10 }: { view: View; M: Pt; size?: number }) {
  const s = Math.SQRT1_2;
  const mx = view.sx(M.x);
  const my = view.sy(M.y);
  const u = { x: s, y: -s };
  const v = { x: s, y: s };
  const p = (a: number, b: number) => `${mx + u.x * a + v.x * b},${my + u.y * a + v.y * b}`;
  return <path d={`M${p(size, 0)} L${p(size, size)} L${p(0, size)}`} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />;
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
      {label ? <span className="w-16 shrink-0 text-[10px] font-bold text-slate-400">{label}</span> : null}
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

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "point" | "figure" | "game";

export default function LineYxReflectionLab() {
  const [tab, setTab] = useState<Tab>("point");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🪞 직선 y = x 에 대한 대칭이동</h3>
        <p className="mt-2 leading-7 text-slate-300">
          대각선 거울에 비추면 <b className="text-amber-200">x와 y가 통째로 자리를 바꿔요</b>. 규칙을 찾아낸 뒤, 이 단원에서 배운 다섯 가지 이동을 모두 써서 퍼즐에 도전해 봅시다!
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "point"} onClick={() => setTab("point")}>
          ① 점 뒤집기 🎴
        </TabButton>
        <TabButton active={tab === "figure"} onClick={() => setTab("figure")}>
          ② 도형 그려내기 ✏️
        </TabButton>
        <TabButton active={tab === "game"} onClick={() => setTab("game")}>
          ③ 삼각형 퍼즐 🧩
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "point" ? <PointTab /> : null}
        {tab === "figure" ? <FigureTab /> : null}
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
// 탭 ① 점 뒤집기
// ══════════════════════════════════════════════════════════════
function PointTab() {
  return (
    <div className="space-y-4">
      <PointPlay />
      <MatchGame />
    </div>
  );
}

function PointPlay() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [P, setP] = useState<Pt>({ x: 4, y: -1 });

  const view = makeView(6);
  const { setDragId } = useDrag(svgRef, view, (_id, p) => setP({ x: clampInt(p.x, -5, 5), y: clampInt(p.y, -5, 5) }));

  const Q = swapPt(P);
  const M = midPt(P, Q);
  const onMirror = P.x === P.y;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid="yx-play" view={view} svgRef={svgRef} label="직선 y = x 에 대한 점의 대칭이동">
          <Clipped cid="yx-play">
            <MirrorLine view={view} />
            {!onMirror ? (
              <>
                <line x1={view.sx(P.x)} y1={view.sy(P.y)} x2={view.sx(Q.x)} y2={view.sy(Q.y)} stroke="#f472b6" strokeWidth={2.5} strokeDasharray="6 4" />
                <Ticks view={view} A={P} B={M} color="#f472b6" />
                <Ticks view={view} A={M} B={Q} color="#f472b6" />
              </>
            ) : null}
          </Clipped>
          {!onMirror ? <RightAngleAtMirror view={view} M={M} /> : null}
          {!onMirror ? <Dot view={view} p={M} color="#fbbf24" r={5} /> : null}
          <Dot view={view} p={Q} color="#34d399" r={7} label={`P′(${nz(Q.x)}, ${nz(Q.y)})`} />
          <Dot view={view} p={P} color="#e2e8f0" r={7} label={`P(${nz(P.x)}, ${nz(P.y)})`} onDown={() => setDragId("P")} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 흰 점 P 를 끌어 보세요 — 초록 점이 거울에 비친 자리예요</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-amber-400/50 bg-amber-400/12 px-4 py-4 text-center">
          <p className="text-[11px] font-bold text-slate-300">좌표를 통째로 맞바꾸면 끝!</p>
          <div className="mt-1 flex items-center justify-center gap-3 text-xl">
            <span className="rounded-xl bg-black/30 px-3 py-1.5 text-white">
              <Katex expr={`(\\,${P.x},\\; ${P.y}\\,)`} />
            </span>
            <span className="text-amber-300">🪞</span>
            <span className="rounded-xl bg-emerald-400/20 px-3 py-1.5 text-emerald-100">
              <Katex expr={`(\\,${Q.x},\\; ${Q.y}\\,)`} />
            </span>
          </div>
          <p className={"mt-2 text-sm font-extrabold " + (onMirror ? "text-amber-200" : "text-slate-300")}>
            {onMirror ? "✨ y = x 위의 점이라 제자리예요!" : "x좌표와 y좌표가 자리를 바꿨어요"}
          </p>
        </div>

        <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.08] p-4">
          <p className="text-sm font-bold text-violet-200">🔎 왜 (y, x) 일까?</p>
          <div className="mt-2 space-y-1.5">
            <div className="rounded-xl bg-black/25 px-3 py-2">
              <p className="text-[11px] font-bold text-slate-400">① y = x 와 PP′ 이 수직</p>
              <FormulaLine tex="\frac{y - y'}{x - x'} \times 1 = -1 \;\Rightarrow\; x' + y' = x + y" />
            </div>
            <div className="rounded-xl bg-black/25 px-3 py-2">
              <p className="text-[11px] font-bold text-slate-400">② PP′ 의 중점이 y = x 위</p>
              <FormulaLine tex="\frac{x + x'}{2} = \frac{y + y'}{2} \;\Rightarrow\; x' - y' = -x + y" />
            </div>
            <div className="rounded-xl border border-violet-400/45 bg-violet-400/15 px-3 py-2">
              <p className="text-[11px] font-bold text-violet-200">연립하면</p>
              <FormulaLine tex="x' = y, \quad y' = x" big />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchGame() {
  const [picked, setPicked] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);

  const view = makeView(6);
  const done = matched.length === CARDS.length;

  function tap(i: number) {
    if (matched.includes(i) || picked.includes(i) || picked.length >= 2) return;
    const np = [...picked, i];
    setPicked(np);
    if (np.length === 2) {
      setTries((t) => t + 1);
      if (pairIndexOf(np[0]) === np[1]) {
        setMatched((m) => [...m, np[0], np[1]]);
        setPicked([]);
      } else {
        setWrong(np);
        window.setTimeout(() => {
          setPicked([]);
          setWrong([]);
        }, 700);
      }
    }
  }
  function reset() {
    setPicked([]);
    setMatched([]);
    setWrong([]);
    setTries(0);
  }

  const shownPairs: [number, number][] = [];
  for (const i of matched) {
    const j = pairIndexOf(i);
    if (i < j) shownPairs.push([i, j]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={"rounded-2xl border p-3 transition " + (done ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04]")}>
        <Plane cid="match-plane" view={view} label="짝 맞추기">
          <Clipped cid="match-plane">
            <MirrorLine view={view} />
            {shownPairs.map(([i, j]) => (
              <line key={i} x1={view.sx(CARDS[i].x)} y1={view.sy(CARDS[i].y)} x2={view.sx(CARDS[j].x)} y2={view.sy(CARDS[j].y)} stroke="#34d399" strokeWidth={2.5} strokeDasharray="6 4" />
            ))}
          </Clipped>
          {CARDS.map((c, i) => {
            const on = matched.includes(i);
            const sel = picked.includes(i);
            return <Dot key={i} view={view} p={c} color={on ? "#34d399" : sel ? "#fbbf24" : "#475569"} r={on || sel ? 7 : 5} label={on || sel ? ptTex(c) : undefined} />;
          })}
        </Plane>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-100">🎴 짝 맞추기 — 서로 y = x 대칭인 카드 두 장</p>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300">
              {matched.length / 2} / 4 쌍
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {CARDS.map((c, i) => {
              const on = matched.includes(i);
              const sel = picked.includes(i);
              const bad = wrong.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => tap(i)}
                  disabled={on}
                  className={
                    "rounded-xl border-2 px-2 py-3 text-center transition disabled:cursor-default " +
                    (on
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : bad
                        ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                        : sel
                          ? "border-amber-400/70 bg-amber-400/20 text-amber-100"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  <Katex expr={ptTex(c)} />
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 다시 하기
            </button>
            <span className="ml-auto font-mono text-[11px] text-slate-400">시도 {tries}번</span>
          </div>
        </div>

        <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (done ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
          <p className={"text-sm font-extrabold " + (done ? "text-emerald-100" : "text-slate-400")}>
            {done ? `🎉 네 쌍 모두 완성! ${tries}번 만에 찾았어요` : "두 장을 골라 짝을 맞춰 보세요"}
          </p>
          {done ? <p className="mt-1 text-[11px] leading-5 text-emerald-200/90">짝지어진 두 점을 이은 선은 모두 y = x 와 수직이고, 중점이 y = x 위에 있어요!</p> : null}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 도형 그려내기
// ══════════════════════════════════════════════════════════════
function FigureTab() {
  const [fi, setFi] = useState(0);
  const [qi, setQi] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const f = FIGS[fi];
  const q = EQ_QS[qi];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✏️ 점을 하나씩 비춰 대칭 도형을 그려내 보세요</p>
          <div className="flex flex-wrap gap-1.5">
            {FIGS.map((x, i) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setFi(i)}
                className={
                  "h-8 min-w-[2rem] rounded-lg border-2 px-1.5 text-sm transition " +
                  (i === fi ? "border-cyan-400/70 bg-cyan-400/20" : "border-white/10 bg-white/5 hover:bg-white/10")
                }
              >
                {x.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      <TraceOne key={f.id} f={f} />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✍️ y = x 대칭이동한 도형의 방정식은?</p>
          <Chips ids={EQ_QS.map((x) => x.id)} cur={qi} done={solved} onPick={setQi} />
        </div>
        <div className="mt-2 overflow-x-auto overflow-y-hidden py-1 text-center text-slate-100">
          <Katex expr="f(x,\, y) = 0 \;\longrightarrow\; f(y,\, x) = 0" />
        </div>
      </div>

      <EqOne key={q.id} q={q} onSolved={() => setSolved((s) => (s.includes(q.id) ? s : [...s, q.id]))} />
    </div>
  );
}

function TraceOne({ f }: { f: Fig }) {
  const [t, setT] = useState(f.t0);
  const [marks, setMarks] = useState<Pt[]>([]);
  const [reveal, setReveal] = useState(false);

  const view = makeView(8);
  const base = figCurve(f, 8);
  const mirrored = swapCurves(base);
  const P = f.pt(t);
  const Q = swapPt(P);

  function move(v: number) {
    setT(v);
    const p = f.pt(v);
    const q = swapPt(p);
    setMarks((old) => {
      if (old.length >= 40) return old;
      if (old.some((m) => Math.hypot(m.x - q.x, m.y - q.y) < 0.55)) return old;
      return [...old, q];
    });
  }

  const enough = marks.length >= 8;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid={`trace-${f.id}`} view={view} label={`${f.name}의 y = x 대칭`}>
          <Clipped cid={`trace-${f.id}`}>
            <MirrorLine view={view} faint />
            <Poly view={view} curves={base} color="#e2e8f0" width={3} />
            {reveal ? <Poly view={view} curves={mirrored} color="#34d399" width={3.5} /> : null}
            {marks.map((m, i) => (
              <circle key={i} cx={view.sx(m.x)} cy={view.sy(m.y)} r={3.5} fill="#34d399" fillOpacity={0.95} />
            ))}
            <line x1={view.sx(P.x)} y1={view.sy(P.y)} x2={view.sx(Q.x)} y2={view.sy(Q.y)} stroke="#f472b6" strokeWidth={2} strokeDasharray="5 4" />
          </Clipped>
          <Dot view={view} p={Q} color="#34d399" r={6} />
          <Dot view={view} p={P} color="#e2e8f0" r={6} label={`(${nz(P.x)}, ${nz(P.y)})`} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">아래 슬라이더로 흰 점을 움직이면 초록 점이 남아요</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">
              {f.emoji} {f.name} 위에서 점 움직이기
            </span>
            <span className="font-mono text-xs font-bold text-emerald-200">찍힌 점 {marks.length}개</span>
          </div>
          <input
            type="range"
            min={f.t0}
            max={f.t1}
            step={(f.t1 - f.t0) / 120}
            value={t}
            aria-label="곡선 위의 점 움직이기"
            onChange={(e) => move(Number(e.target.value))}
            className="mt-2 h-1.5 w-full accent-emerald-400"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              disabled={!enough && !reveal}
              className="flex-1 rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 px-3 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/25 disabled:opacity-40"
            >
              {reveal ? "곡선 숨기기" : "✨ 완성된 도형 보기"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMarks([]);
                setReveal(false);
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 지우기
            </button>
          </div>
          <p className="mt-1.5 text-center text-[11px] text-slate-400">
            {enough ? "점이 충분히 모였어요 — 어떤 모양이 보이나요?" : `초록 점을 ${8 - marks.length}개 더 모으면 확인할 수 있어요`}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-4">
          <p className="text-sm font-bold text-amber-200">📐 식은 이렇게 바뀌어요</p>
          <div className="mt-2 space-y-0.5">
            <FormulaLine label="원본" tex={f.tex} />
            <FormulaLine label="맞바꾸면" tex={f.texSwap} />
            {f.texTidy ? <FormulaLine label="정리하면" tex={f.texTidy} big /> : null}
          </div>
          <p className={"mt-2 rounded-lg px-3 py-2 text-xs leading-6 " + (f.self ? "bg-emerald-400/15 text-emerald-100" : "bg-black/25 text-slate-300")}>
            {f.self ? (
              <>✨ x 와 y 를 바꿔도 식이 그대로! 그래서 이 도형은 <b>자기 자신과 완전히 겹쳐요.</b></>
            ) : (
              <>x 와 y 를 통째로 맞바꾸기만 하면 돼요. 그림에서도 두 도형이 y = x 를 사이에 두고 마주 보고 있죠?</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function EqOne({ q, onSolved }: { q: EqQ; onSolved: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const ok = pick === q.ans;

  return (
    <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
      <FormulaLine label="원본" tex={q.tex} big />
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
      <button
        type="button"
        onClick={() => setHint((v) => !v)}
        className="mt-2 rounded-lg border border-amber-400/45 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
      >
        💡 힌트
      </button>
      {hint || ok ? <p className="mt-2 rounded-lg bg-amber-400/12 px-3 py-2 text-[11px] leading-5 text-amber-100">{q.tip}</p> : null}
      {pick !== null && !ok ? <p className="mt-1.5 text-[11px] font-bold text-rose-200">부호를 바꾸는 게 아니라 x 와 y 의 자리를 바꾸는 거예요!</p> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 삼각형 퍼즐
// ══════════════════════════════════════════════════════════════
function GameTab() {
  const [si, setSi] = useState(0);
  const [cleared, setCleared] = useState<string[]>([]);
  const st = STAGES[si];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧩 회색 목표 자리에 삼각형을 정확히 옮기세요</p>
          <Chips ids={STAGES.map((x) => x.id)} cur={si} done={cleared} onPick={setSi} />
        </div>
      </div>

      <StageOne key={st.id} st={st} onCleared={() => setCleared((s) => (s.includes(st.id) ? s : [...s, st.id]))} />

      {/* 마무리 요약 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">🗂️ 이 단원의 다섯 가지 이동</p>
        <div className="mt-2 space-y-1.5">
          <div className="hidden gap-2 px-3 text-[10px] font-bold text-slate-500 sm:grid sm:grid-cols-[7rem_1fr_1fr]">
            <span />
            <span>점 (x, y) 는</span>
            <span>도형 f(x, y) = 0 은</span>
          </div>
          {SUMMARY.map((s) => (
            <div key={s.title} className={"grid gap-2 rounded-xl px-3 py-2 sm:grid-cols-[7rem_1fr_1fr] " + toneBox(s.tone)}>
              <p className="text-xs font-bold text-slate-100">{s.title}</p>
              <div className="overflow-x-auto overflow-y-hidden py-1 text-slate-100">
                <Katex expr={s.pt} />
              </div>
              <div className="overflow-x-auto overflow-y-hidden py-1 text-slate-100">
                <Katex expr={s.fig} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[11px] leading-6 text-slate-300">
          평행이동만 <b className="text-sky-200">부호가 반대로</b> 들어가고, 대칭이동 넷은 <b className="text-white">점과 도형의 계산이 똑같아요.</b>
        </p>
      </div>
    </div>
  );
}

function toneBox(t: string): string {
  return t === "sky"
    ? "border border-sky-400/35 bg-sky-400/[0.08]"
    : t === "emerald"
      ? "border border-emerald-400/35 bg-emerald-400/[0.08]"
      : t === "pink"
        ? "border border-pink-400/35 bg-pink-400/[0.08]"
        : t === "violet"
          ? "border border-violet-400/35 bg-violet-400/[0.08]"
          : "border border-amber-400/35 bg-amber-400/[0.08]";
}

function StageOne({ st, onCleared }: { st: Stage; onCleared: () => void }) {
  const [hist, setHist] = useState<Move[]>([]);
  const [showHint, setShowHint] = useState(false);

  const goal = goalOf(st);
  const cur = hist.reduce<Pt[]>((acc, m) => applyMove(acc, m), BASE_TRI);
  const n = hist.length;
  const done = samePts(cur, goal);
  const perfect = done && n === st.min;

  const doneRef = useRef(false);
  useEffect(() => {
    if (done && !doneRef.current) {
      doneRef.current = true;
      onCleared();
    }
  });

  const view = makeView(8);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={"rounded-2xl border p-3 transition " + (done ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04]")}>
        <Plane cid={`stage-${st.id}`} view={view} label="삼각형 퍼즐">
          <Clipped cid={`stage-${st.id}`}>
            <MirrorLine view={view} faint />
            <Tri view={view} pts={BASE_TRI} fill="rgba(148,163,184,0.06)" stroke="#475569" width={2} dash="4 4" />
            <Tri view={view} pts={goal} fill="rgba(226,232,240,0.10)" stroke="#e2e8f0" width={5} dash="9 7" />
            <Tri view={view} pts={cur} fill={done ? "rgba(52,211,153,0.25)" : "rgba(244,114,182,0.22)"} stroke={done ? "#34d399" : "#f472b6"} width={3} />
          </Clipped>
          {cur.map((p, i) => (
            <Dot key={i} view={view} p={p} color={done ? "#34d399" : "#f472b6"} r={5} />
          ))}
        </Plane>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] font-bold">
          <span className="text-slate-500">┈ 처음</span>
          <span className="text-slate-300">┅ 목표</span>
          <span className={done ? "text-emerald-300" : "text-pink-300"}>━ 지금</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (done ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
          <p className={"text-base font-extrabold " + (done ? "text-emerald-100" : "text-slate-300")}>
            {done ? (perfect ? `🎉 ${n}번 만에 성공 — 최소 횟수예요! ⭐` : `✅ ${n}번 만에 성공! (최소 ${st.min}번)`) : `${n}번 눌렀어요`}
          </p>
          {!done ? <p className="mt-0.5 text-[11px] text-slate-400">최소 {st.min}번이면 갈 수 있어요</p> : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-[11px] font-bold text-slate-400">평행이동</p>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {(["left", "right", "up", "down"] as Move[]).map((m) => (
              <MoveBtn key={m} m={m} locked={st.locked.includes(m)} disabled={done} onPress={() => setHist((h) => [...h, m])} />
            ))}
          </div>
          <p className="mt-3 text-[11px] font-bold text-slate-400">대칭이동</p>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {(["sx", "sy", "so", "sd"] as Move[]).map((m) => (
              <MoveBtn key={m} m={m} locked={st.locked.includes(m)} disabled={done} onPress={() => setHist((h) => [...h, m])} />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setHist((h) => h.slice(0, -1))}
              disabled={!n}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-35"
            >
              ↶ 한 번 되돌리기
            </button>
            <button
              type="button"
              onClick={() => setHist([])}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 처음부터
            </button>
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="rounded-xl border border-amber-400/45 bg-amber-400/10 px-3 py-2 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
            >
              💡
            </button>
          </div>
          {showHint ? <p className="mt-2 rounded-lg bg-amber-400/12 px-3 py-2 text-[11px] leading-5 text-amber-100">{st.hint}</p> : null}
          {st.locked.length ? (
            <p className="mt-2 text-center text-[11px] text-slate-400">
              🔒 이번 판에는 <b className="text-slate-200">{st.locked.map((m) => MOVE_META[m].label).join(", ")}</b> 을(를) 쓸 수 없어요
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-sm font-bold text-slate-100">📍 꼭짓점 좌표</p>
          <div className="mt-2 space-y-1">
            {BASE_TRI.map((p, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-black/25 px-3 py-1.5">
                <span className="font-mono text-[11px] font-bold text-slate-500">{"ABC"[i]}</span>
                <span className="ml-auto">
                  <Katex expr={`${ptTex(p)} \\;\\to\\; ${ptTex(cur[i])}`} />
                </span>
              </div>
            ))}
          </div>
          {n ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {hist.map((m, i) => (
                <span key={i} className="rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `${MOVE_META[m].color}26`, color: MOVE_META[m].color }}>
                  {MOVE_META[m].icon}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MoveBtn({ m, locked, disabled, onPress }: { m: Move; locked: boolean; disabled: boolean; onPress: () => void }) {
  const meta = MOVE_META[m];
  return (
    <button
      type="button"
      disabled={locked || disabled}
      onClick={onPress}
      className={"rounded-xl border-2 px-1 py-2 text-center transition disabled:opacity-35 " + (locked ? "border-white/10 bg-black/30" : "border-white/10 bg-white/5 hover:brightness-125")}
      style={locked ? undefined : { borderColor: `${meta.color}66`, background: `${meta.color}14` }}
    >
      <span className="block text-base">{locked ? "🔒" : meta.icon}</span>
      <span className="text-[10px] font-bold text-slate-200">{meta.label}</span>
    </button>
  );
}
