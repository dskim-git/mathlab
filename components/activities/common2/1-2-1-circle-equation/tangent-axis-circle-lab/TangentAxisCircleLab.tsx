"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  AXIS_PROBLEMS,
  MISSIONS,
  MODE_EMOJI,
  MODE_LABEL,
  MODE_RULE,
  MODE_VERB,
  NEED_CARDS,
  QUADRANTS,
  centerFree,
  stdTex,
  symbolTexFree,
  type AxisProblem,
  type MissionId,
  type Pt,
  type TangentMode,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_tangent",
    prompt:
      "원이 x축에 접하려면 중심의 y좌표와 반지름 사이에 어떤 관계가 있어야 했나요? 그렇게 되는 까닭을 ‘중심에서 직선까지의 거리’라는 말을 써서 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 중심에서 x축까지의 거리는 |b| 인데, 접하려면 이 거리가 반지름과 같아야 하므로 |b| = r 이 된다. 그래서 중심의 y좌표가 r 또는 −r 이 된다.",
  },
  {
    id: "eight_forms",
    prompt:
      "사분면마다 식의 부호가 달라졌지만, 사실 외울 것은 많지 않았어요. 여덟 가지 식을 외우지 않고도 바로 쓸 수 있는 나만의 방법을 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 중심의 좌표를 (x−a)²+(y−b)²=r² 에 그대로 넣기만 하면 된다. 접하는 축 쪽 좌표만 ±r 로 바꿔 주면 되고, 부호는 중심이 어느 사분면에 있는지 그림으로 보면 바로 알 수 있다.",
  },
  {
    id: "how_many_points",
    prompt:
      "그냥 원은 세 점, 한 축에 접하는 원은 두 점, 두 축에 모두 접하는 원은 한 점이면 정해졌어요. 왜 필요한 점의 개수가 달라지는지 ‘미지수’라는 말을 써서 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 원을 정하려면 a, b, r 세 개를 알아야 하는데, 접한다는 조건이 |b| = r 처럼 미지수 하나를 없애 준다. 두 축에 접하면 남는 미지수가 r 하나라 점 한 개면 충분하다.",
  },
];

// ─── 좌표평면 공용 ────────────────────────────────────────────
const G = { MIN: -10, MAX: 10, U: 17, PAD: 26 };
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

function GridLines() {
  return (
    <g>
      {range(G.MIN, G.MAX).map((v) => (
        <line key={`vx${v}`} x1={gx(v)} y1={gy(G.MAX)} x2={gx(v)} y2={gy(G.MIN)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      {range(G.MIN, G.MAX).map((v) => (
        <line key={`hy${v}`} x1={gx(G.MIN)} y1={gy(v)} x2={gx(G.MAX)} y2={gy(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      <line x1={gx(G.MIN)} y1={gy(0)} x2={gx(G.MAX)} y2={gy(0)} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
      <line x1={gx(0)} y1={gy(G.MIN)} x2={gx(0)} y2={gy(G.MAX)} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
      {range(G.MIN, G.MAX)
        .filter((v) => v !== 0 && v % 5 === 0)
        .map((v) => (
          <text key={`tx${v}`} x={gx(v)} y={gy(0) + 12} textAnchor="middle" className="fill-slate-500 font-mono text-[8px]">
            {v}
          </text>
        ))}
      {range(G.MIN, G.MAX)
        .filter((v) => v !== 0 && v % 5 === 0)
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

function CircleDraw({ c, r, color, fill, width = 3, dash }: { c: Pt; r: number; color: string; fill?: string; width?: number; dash?: string }) {
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
          textAnchor={p.x <= G.MIN + 2 ? "start" : p.x >= G.MAX - 2 ? "end" : "middle"}
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
        x: clamp(Math.round((sx - G.PAD) / G.U + G.MIN), G.MIN + 1, G.MAX - 1),
        y: clamp(Math.round(G.MAX - (sy - G.PAD) / G.U), G.MIN + 1, G.MAX - 1),
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

function Box({
  value,
  onChange,
  ok,
  show,
  disabled,
  label,
  width = "w-20",
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

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400">{label}</span>
        <span className="font-mono text-xs font-bold text-slate-100">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-1.5 w-full accent-cyan-400"
      />
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "play" | "quad" | "find";

export default function TangentAxisCircleLab() {
  const [tab, setTab] = useState<Tab>("play");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🎯 좌표축에 접하는 원</h3>
        <p className="mt-2 leading-7 text-slate-300">
          원을 직접 움직여 축에 <b className="text-emerald-200">딱 붙여</b> 보면, 외울 것은 딱 한 줄이라는 걸 알게 돼요 —
          <b className="text-amber-200"> 중심에서 축까지의 거리 = 반지름</b>.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "play"} onClick={() => setTab("play")}>
          ① 축에 딱 붙이기 🎮
        </TabButton>
        <TabButton active={tab === "quad"} onClick={() => setTab("quad")}>
          ② 사분면 갤러리
        </TabButton>
        <TabButton active={tab === "find"} onClick={() => setTab("find")}>
          ③ 조건에서 원 찾기
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "play" ? <PlayTab /> : null}
        {tab === "quad" ? <QuadTab /> : null}
        {tab === "find" ? <FindTab /> : null}
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
// 탭 ① 축에 딱 붙이기
// ══════════════════════════════════════════════════════════════
type AxisState = "far" | "touch" | "cross";
const STATE_LABEL: Record<AxisState, string> = { far: "만나지 않아요", touch: "딱 접했어요!", cross: "두 점에서 만나요" };
const STATE_COLOR: Record<AxisState, string> = { far: "#94a3b8", touch: "#34d399", cross: "#fb7185" };

function stateOf(d: number, r: number): AxisState {
  return d > r ? "far" : d === r ? "touch" : "cross";
}

function PlayTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [c, setC] = useState<Pt>({ x: 4, y: 6 });
  const [r, setR] = useState(3);
  const { setDragId } = useGridDrag(svgRef, (_id, p) => setC(p));
  const [cleared, setCleared] = useState<MissionId[]>([]);

  const dy = Math.abs(c.y); // x축까지의 거리
  const dx = Math.abs(c.x); // y축까지의 거리
  const sx = stateOf(dy, r); // x축과의 관계
  const sy = stateOf(dx, r); // y축과의 관계

  const nowMission: MissionId | null = sx === "touch" && sy === "touch" ? "both" : sx === "touch" ? "x" : sy === "touch" ? "y" : null;

  const clearedRef = useRef<MissionId[]>([]);
  useEffect(() => {
    if (nowMission && !clearedRef.current.includes(nowMission)) {
      clearedRef.current = [...clearedRef.current, nowMission];
      setCleared(clearedRef.current);
    }
  }, [nowMission]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 그래프 */}
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          <Plane cid="play-plane" svgRef={svgRef} label="원과 좌표축의 위치 관계">
            <Clipped cid="play-plane">
              <CircleDraw
                c={c}
                r={r}
                color={sx === "touch" || sy === "touch" ? "#34d399" : "#38bdf8"}
                fill={sx === "touch" || sy === "touch" ? "rgba(52,211,153,0.14)" : "rgba(56,189,248,0.10)"}
                width={3}
              />
              {/* 중심에서 각 축까지의 거리 */}
              <line x1={gx(c.x)} y1={gy(c.y)} x2={gx(c.x)} y2={gy(0)} stroke={STATE_COLOR[sx]} strokeWidth={2.5} strokeDasharray="5 3" />
              <line x1={gx(c.x)} y1={gy(c.y)} x2={gx(0)} y2={gy(c.y)} stroke={STATE_COLOR[sy]} strokeWidth={2.5} strokeDasharray="5 3" />
              <text x={gx(c.x) + 6} y={(gy(c.y) + gy(0)) / 2} className="font-mono text-[10px] font-bold" fill={STATE_COLOR[sx]}>
                |b| = {dy}
              </text>
              <text x={(gx(c.x) + gx(0)) / 2} y={gy(c.y) - 6} textAnchor="middle" className="font-mono text-[10px] font-bold" fill={STATE_COLOR[sy]}>
                |a| = {dx}
              </text>
            </Clipped>
            {sx === "touch" ? <Dot p={{ x: c.x, y: 0 }} color="#34d399" r={5} /> : null}
            {sy === "touch" ? <Dot p={{ x: 0, y: c.y }} color="#34d399" r={5} /> : null}
            <Dot p={c} color="#f472b6" label={`(${nx(c.x)}, ${nx(c.y)})`} onDown={() => setDragId("C")} />
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 분홍 점(중심)을 끌고, 아래에서 반지름을 바꿔 보세요</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <Slider label="반지름 r" value={r} min={1} max={8} onChange={setR} />
            <div className="mt-3 space-y-2">
              <AxisCard axis="x" dist={dy} r={r} state={sx} distLabel="|b|" />
              <AxisCard axis="y" dist={dx} r={r} state={sy} distLabel="|a|" />
            </div>
          </div>

          {/* 미션 */}
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-amber-200">⭐ 미션</p>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs font-bold text-slate-200">
                {cleared.length} / {MISSIONS.length}
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              {MISSIONS.map((m) => {
                const done = cleared.includes(m.id);
                const now = nowMission === m.id;
                return (
                  <div
                    key={m.id}
                    className={
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition " +
                      (now ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : done ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-200/80" : "border-white/10 bg-white/5 text-slate-300")
                    }
                  >
                    <span>{done ? "⭐" : m.emoji}</span>
                    <span className="font-bold">{m.text}</span>
                    {now ? <span className="ml-auto text-xs font-bold">지금 성공! 🎉</span> : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 방정식 */}
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
            <p className="text-sm font-bold text-emerald-200">지금 이 원의 방정식</p>
            <FormulaLine tex={stdTex(c.x, c.y, r * r)} big />
            {nowMission ? (
              <p className="mt-1 rounded-lg bg-emerald-400/15 px-3 py-2 text-xs leading-5 text-emerald-100">
                {nowMission === "x"
                  ? `중심의 y좌표 ${nx(c.y)} 의 절댓값이 반지름 ${r} 과 같아졌어요 → x축에 접합니다.`
                  : nowMission === "y"
                    ? `중심의 x좌표 ${nx(c.x)} 의 절댓값이 반지름 ${r} 과 같아졌어요 → y축에 접합니다.`
                    : `중심의 x좌표·y좌표의 절댓값이 모두 반지름 ${r} 과 같아요 → 두 축에 모두 접합니다.`}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* 한 줄 규칙 */}
      <div className="rounded-2xl border-2 border-violet-400/40 bg-violet-400/[0.10] p-4 text-center">
        <p className="text-xs font-bold text-violet-200">🔑 외울 것은 이 한 줄뿐</p>
        <p className="mt-1 text-lg font-extrabold text-white">중심에서 그 직선까지의 거리 = 반지름 ⟺ 접한다</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-black/25 px-3 py-2">
            <p className="text-[11px] font-bold text-amber-200">x축까지의 거리는 중심의 y좌표</p>
            <Katex expr="|b| = r" />
          </div>
          <div className="rounded-xl bg-black/25 px-3 py-2">
            <p className="text-[11px] font-bold text-sky-200">y축까지의 거리는 중심의 x좌표</p>
            <Katex expr="|a| = r" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AxisCard({ axis, dist, r, state, distLabel }: { axis: "x" | "y"; dist: number; r: number; state: AxisState; distLabel: string }) {
  const cls =
    state === "touch" ? "border-emerald-400/55 bg-emerald-400/15" : state === "cross" ? "border-rose-400/40 bg-rose-400/10" : "border-white/10 bg-white/5";
  return (
    <div className={"rounded-xl border-2 px-3 py-2 " + cls}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-200">{axis}축과의 관계</span>
        <span className="text-sm font-extrabold" style={{ color: STATE_COLOR[state] }}>
          {state === "touch" ? "🎯 " : ""}
          {STATE_LABEL[state]}
        </span>
      </div>
      <p className="mt-1 text-center font-mono text-base font-bold text-white">
        {distLabel} = {dist} {state === "touch" ? "=" : state === "far" ? ">" : "<"} r = {r}
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 사분면 갤러리
// ══════════════════════════════════════════════════════════════
const MODES: TangentMode[] = ["x", "y", "both"];
/** 사분면별 색 — 그래프와 식 목록을 눈으로 이어 준다. */
const QCOLOR: Record<number, string> = { 1: "#34d399", 2: "#38bdf8", 3: "#a78bfa", 4: "#fbbf24" };
const QFILL: Record<number, string> = {
  1: "rgba(52,211,153,0.12)",
  2: "rgba(56,189,248,0.12)",
  3: "rgba(167,139,250,0.12)",
  4: "rgba(251,191,36,0.12)",
};

function QuadTab() {
  const [a, setA] = useState(4);
  const [b, setB] = useState(2);
  const [r, setR] = useState(3);
  const [goal, setGoal] = useState<TangentMode>("x");
  const [cleared, setCleared] = useState<TangentMode[]>([]);

  const tangentY = a === r; // y축까지의 거리 |a| = r
  const tangentX = b === r; // x축까지의 거리 |b| = r
  const met = goal === "x" ? tangentX : goal === "y" ? tangentY : tangentX && tangentY;

  const clearedRef = useRef<TangentMode[]>([]);
  useEffect(() => {
    if (met && !clearedRef.current.includes(goal)) {
      clearedRef.current = [...clearedRef.current, goal];
      setCleared(clearedRef.current);
    }
  }, [met, goal]);

  /** 이번 목표에서 r 에 묶여 움직일 수 없는 슬라이더 */
  const lockedA = goal === "y" || goal === "both";
  const lockedB = goal === "x" || goal === "both";

  return (
    <div className="space-y-4">
      {/* 목표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎯 이번에 만들 원</p>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs font-bold text-slate-200">
            성공 {cleared.length} / 3
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setGoal(m)}
              className={
                "rounded-xl border-2 px-3 py-2 text-xs font-bold transition " +
                (m === goal ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {cleared.includes(m) ? "⭐ " : MODE_EMOJI[m] + " "}
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
      </div>

      {/* 슬라이더 3개 + 상태 */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] p-4">
            <p className="text-sm font-bold text-cyan-200">🎚️ 세 슬라이더를 모두 움직여 보세요</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              네 사분면의 중심은 각각 (±a, ±b) 예요. 어떤 슬라이더를 r 에 맞춰야 축에 닿을까요?
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <LockSlider label="중심의 x좌표 a" value={a} min={1} max={5} onChange={setA} matched={tangentY} locked={lockedA} />
              <LockSlider label="중심의 y좌표 b" value={b} min={1} max={5} onChange={setB} matched={tangentX} locked={lockedB} />
              <LockSlider label="반지름 r" value={r} min={1} max={4} onChange={setR} matched={false} locked={false} />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <MatchCard axis="y" sym="a" left={a} r={r} ok={tangentY} />
              <MatchCard axis="x" sym="b" left={b} r={r} ok={tangentX} />
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
            <Plane cid="quad-plane" label="네 사분면에서 좌표축에 접하는 원">
              <Clipped cid="quad-plane">
                {QUADRANTS.map((q) => {
                  const c = centerFree(q, a, b);
                  return (
                    <g key={`c${q.n}`}>
                      <CircleDraw c={c} r={r} color={QCOLOR[q.n]} fill={QFILL[q.n]} width={2.5} />
                      <line
                        x1={gx(c.x)}
                        y1={gy(c.y)}
                        x2={gx(c.x)}
                        y2={gy(0)}
                        stroke={tangentX ? QCOLOR[q.n] : "rgba(148,163,184,0.75)"}
                        strokeWidth={tangentX ? 2 : 1.4}
                        strokeDasharray="4 3"
                      />
                      <line
                        x1={gx(c.x)}
                        y1={gy(c.y)}
                        x2={gx(0)}
                        y2={gy(c.y)}
                        stroke={tangentY ? QCOLOR[q.n] : "rgba(148,163,184,0.75)"}
                        strokeWidth={tangentY ? 2 : 1.4}
                        strokeDasharray="4 3"
                      />
                    </g>
                  );
                })}
              </Clipped>
              {QUADRANTS.map((q) => {
                const c = centerFree(q, a, b);
                return (
                  <g key={`d${q.n}`}>
                    {tangentX ? <Dot p={{ x: c.x, y: 0 }} color={QCOLOR[q.n]} r={4} /> : null}
                    {tangentY ? <Dot p={{ x: 0, y: c.y }} color={QCOLOR[q.n]} r={4} /> : null}
                    <Dot p={c} color={QCOLOR[q.n]} r={5} />
                  </g>
                );
              })}
            </Plane>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              {tangentX && tangentY
                ? "✳️ 네 원이 두 축에 모두 닿았어요!"
                : tangentX
                  ? "↔️ 네 원이 x축에 딱 붙었어요 — a를 움직여도 그대로예요"
                  : tangentY
                    ? "↕️ 네 원이 y축에 딱 붙었어요 — b를 움직여도 그대로예요"
                    : "아직 어느 축에도 닿지 않았어요"}
            </p>
          </div>
        </div>

        {/* 네 사분면의 식 */}
        <div className="space-y-1.5">
          <div
            className={
              "rounded-xl border-2 px-3 py-2 text-center text-xs font-bold " +
              (met ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-amber-400/40 bg-amber-400/10 text-amber-100")
            }
          >
            {met ? (
              <>
                ⭐ 성공! 이제 <b>{goal === "x" ? "a" : goal === "y" ? "b" : "r"}</b>
                {goal === "both" ? " 를 바꿔도" : " 를 움직여도"} 계속 접해요.
                <br />
                <span className="font-normal text-slate-200">
                  {goal === "both" ? "a, b 는 둘 다 r 에 묶여 자유롭게 정할 수 없어요." : `${goal === "x" ? "b" : "a"} 는 r 에 묶여 있고, ${goal === "x" ? "a" : "b"} 는 자유예요.`}
                </span>
              </>
            ) : (
              <>
                {MODE_EMOJI[goal]} {MODE_RULE[goal]} 이 되도록
                <br />
                <span className="font-normal text-slate-200">
                  {goal === "x" ? "b 를 r 과 같게" : goal === "y" ? "a 를 r 과 같게" : "a 와 b 를 모두 r 과 같게"} 맞춰 보세요
                </span>
              </>
            )}
          </div>

          {[...QUADRANTS]
            .sort((p, q) => p.n - q.n)
            .map((q) => {
              const c = centerFree(q, a, b);
              return (
                <div
                  key={q.n}
                  className={"rounded-xl border px-3 py-2 " + (tangentX || tangentY ? "border-white/15 bg-slate-900/60" : "border-white/10 bg-slate-900/40")}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: QCOLOR[q.n] }} />
                    <span className="text-[11px] font-bold text-slate-300">
                      {["", "①", "②", "③", "④"][q.n]} {q.label}
                    </span>
                    <span className="ml-auto font-mono text-[11px] text-slate-500">
                      중심 ({nx(c.x)}, {nx(c.y)})
                    </span>
                  </div>
                  <div className="mt-1 text-[15px] text-slate-50">
                    <Katex expr={symbolTexFree(q, tangentY, tangentX)} />
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <Katex expr={stdTex(c.x, c.y, r * r)} />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 정리 */}
      <div className="rounded-2xl border-2 border-violet-400/40 bg-violet-400/[0.10] p-4">
        <p className="text-sm font-bold text-violet-200">🔑 여덟 가지 식을 외우지 않아도 되는 이유</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <RuleCard n="1" text="중심의 좌표를 (x−a)² + (y−b)² = r² 에 그대로 넣는다" />
          <RuleCard n="2" text="접하는 축 쪽 좌표는 r 에 묶인다 (x축이면 b = r, y축이면 a = r)" />
          <RuleCard n="3" text="나머지 좌표는 자유! 부호는 사분면 그림으로 보면 끝" />
        </div>
        <p className="mt-2 text-center text-xs text-slate-300">
          위에서 슬라이더를 맞추는 순간 식의 <b className="text-violet-200">a 나 b 가 저절로 r 로 바뀌는 것</b>을 보셨죠? 그게 교과서의 여덟 가지 식이에요.
        </p>
      </div>
    </div>
  );
}

/** r 에 맞춰야 하는 슬라이더는 자물쇠로, 맞으면 초록으로 표시한다. */
function LockSlider({
  label,
  value,
  min,
  max,
  onChange,
  matched,
  locked,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  matched: boolean;
  locked: boolean;
}) {
  return (
    <div className={"rounded-xl border px-2.5 py-2 " + (matched ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/10 bg-slate-950/40")}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-bold text-slate-300">
          {locked ? "🔒 " : ""}
          {label}
        </span>
        <span className={"font-mono text-xs font-bold " + (matched ? "text-emerald-200" : "text-slate-100")}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-1 h-1.5 w-full " + (matched ? "accent-emerald-400" : "accent-cyan-400")}
      />
    </div>
  );
}

/** |a| = r 인지, |b| = r 인지 한눈에. */
function MatchCard({ axis, sym, left, r, ok }: { axis: "x" | "y"; sym: string; left: number; r: number; ok: boolean }) {
  return (
    <div className={"rounded-xl border-2 px-3 py-2 text-center " + (ok ? "border-emerald-400/55 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
      <p className="text-[11px] font-bold text-slate-300">{axis}축까지의 거리</p>
      <p className={"mt-0.5 font-mono text-base font-bold " + (ok ? "text-emerald-200" : "text-slate-100")}>
        |{sym}| = {left} {ok ? "=" : left > r ? ">" : "<"} r = {r}
      </p>
      <p className={"text-[11px] font-bold " + (ok ? "text-emerald-200" : "text-slate-500")}>{ok ? `🎯 ${axis}축에 접해요!` : `${axis}축에 안 닿아요`}</p>
    </div>
  );
}

function RuleCard({ n, text }: { n: string; text: string }) {
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
// 탭 ③ 조건에서 원 찾기
// ══════════════════════════════════════════════════════════════
function FindTab() {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const p = AXIS_PROBLEMS[idx];

  return (
    <div className="space-y-4">
      {/* 필요한 점의 개수 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">🔢 원을 정하려면 점이 몇 개 필요할까?</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {NEED_CARDS.map((c) => (
            <div key={c.title} className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5">
              <p className="text-sm font-bold text-slate-100">
                {c.emoji} {c.title}
              </p>
              <p className="mt-1 font-mono text-[11px] text-amber-200">미지수 {c.unknowns}</p>
              <p className="mt-0.5 text-sm font-extrabold text-emerald-200">{c.need}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-400">{c.why}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✏️ 조건에 맞는 원 찾기</p>
          <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 font-mono text-xs font-bold text-cyan-100">
            해결 {solved.size} / {AXIS_PROBLEMS.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AXIS_PROBLEMS.map((z, i) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setIdx(i)}
              className={
                "rounded-lg border px-3 py-1 text-xs font-bold transition " +
                (i === idx ? "border-cyan-400/60 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {solved.has(z.id) ? "✅ " : ""}
              {MODE_EMOJI[z.mode]} {z.title}
            </button>
          ))}
        </div>
      </div>

      <AxisCardProblem key={p.id} p={p} onSolved={() => setSolved((s) => new Set(s).add(p.id))} />
    </div>
  );
}

function AxisCardProblem({ p, onSolved }: { p: AxisProblem; onSolved: () => void }) {
  const [vals, setVals] = useState<string[]>(p.steps.map(() => ""));
  const [ck, setCk] = useState<boolean[]>(p.steps.map(() => false));
  const [gaveUp, setGaveUp] = useState(false);

  const oks = p.steps.map((s, i) => isAns(vals[i], s.answer));
  const cleared = oks.every(Boolean);
  const shown = cleared || gaveUp;

  const solvedRef = useRef(false);
  useEffect(() => {
    if (cleared && !solvedRef.current) {
      solvedRef.current = true;
      onSolved();
    }
  }, [cleared, onSolved]);

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
      <div className="space-y-2">
        <div className="rounded-xl border border-violet-400/25 bg-violet-400/[0.07] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-violet-400/45 bg-violet-400/15 px-2.5 py-1 text-[11px] font-bold text-violet-100">
              {MODE_EMOJI[p.mode]} {MODE_LABEL[p.mode]}
            </span>
            <span className="rounded-lg border border-emerald-400/45 bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold text-emerald-100">
              필요한 조건: {p.need}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-200">
            중심이 제1사분면에 있고 {MODE_VERB[p.mode]}, 다음 점을 지나는 원의 방정식을 구해 보세요.
          </p>
          <FormulaLine big tex={p.pts.map((z) => `(${z.x},\\ ${z.y})`).join(",\\quad ")} />
        </div>

        <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-4 py-3">
          <p className="text-xs font-bold text-sky-200">💡 시작은 이렇게</p>
          <p className="mt-1 text-sm leading-6 text-slate-200">{p.setup}</p>
        </div>

        {p.steps.map((s, i) => {
          const unlocked = i === 0 || oks[i - 1] || shown;
          if (!unlocked) return null;
          return (
            <div key={s.sym} className={"rounded-xl border px-4 py-3 " + (oks[i] ? "border-emerald-400/35 bg-emerald-400/[0.06]" : "border-white/10 bg-slate-950/50")}>
              <p className="text-xs font-bold text-slate-400">
                <span
                  className={
                    "mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] " +
                    (oks[i] ? "bg-emerald-400/25 text-emerald-100" : "bg-white/10 text-slate-300")
                  }
                >
                  {i + 1}
                </span>
                {s.label}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
                <span className="py-1">
                  <Katex expr={s.tex} />
                </span>
                <Box
                  value={vals[i]}
                  onChange={(v) => setVals((z) => z.map((w, j) => (j === i ? v : w)))}
                  ok={oks[i]}
                  show={ck[i]}
                  disabled={shown}
                  label={`${s.sym} 값`}
                  width="w-16"
                />
                {!oks[i] && !shown ? <CheckBtn onClick={() => setCk((z) => z.map((w, j) => (j === i ? true : w)))} /> : oks[i] ? <span>✅</span> : null}
              </div>
            </div>
          );
        })}

        {!shown ? (
          <button
            type="button"
            onClick={() => setGaveUp(true)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10"
          >
            정답 보기
          </button>
        ) : null}

        {shown ? (
          <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-4 py-3">
            <p className="text-sm font-bold text-emerald-100">
              {cleared ? "🎉 정답!" : "📖 풀이"} {p.solutions.length > 1 ? ` — 답이 ${p.solutions.length}개예요!` : ""}
            </p>
            <div className="mt-1 space-y-0.5">
              {p.solutions.map((s, i) => (
                <FormulaLine
                  key={i}
                  label={p.solutions.length > 1 ? `답 ${i + 1}` : undefined}
                  tex={stdTex(s.center.x, s.center.y, s.r * s.r)}
                />
              ))}
            </div>
            <p className="mt-1 text-xs leading-5 text-emerald-100/90">{p.explain}</p>
          </div>
        ) : null}
      </div>

      <div>
        <Plane cid={`ax-${p.id}`} label="조건에 맞는 원" small>
          <Clipped cid={`ax-${p.id}`}>
            {shown
              ? p.solutions.map((s, i) => (
                  <g key={i}>
                    <CircleDraw c={s.center} r={s.r} color={i === 0 ? "#34d399" : "#a78bfa"} fill={i === 0 ? "rgba(52,211,153,0.12)" : "rgba(167,139,250,0.12)"} width={3} />
                  </g>
                ))
              : null}
          </Clipped>
          {shown
            ? p.solutions.map((s, i) => (
                <g key={i}>
                  {p.mode !== "y" ? <Dot p={{ x: s.center.x, y: 0 }} color="#fbbf24" r={4} /> : null}
                  {p.mode !== "x" ? <Dot p={{ x: 0, y: s.center.y }} color="#38bdf8" r={4} /> : null}
                  <Dot p={s.center} color="#f472b6" label={`(${nx(s.center.x)}, ${nx(s.center.y)})`} r={5} />
                </g>
              ))
            : null}
          {p.pts.map((z, i) => (
            <Dot key={`p${i}`} p={z} color="#22d3ee" label={`(${nx(z.x)}, ${nx(z.y)})`} r={5} />
          ))}
        </Plane>
        <p className="mt-1 text-center text-[11px] text-slate-500">
          {shown ? (p.solutions.length > 1 ? "조건을 만족하는 원이 두 개!" : "노란·파란 점이 축과 닿는 접점이에요") : "풀고 나면 원이 그려져요"}
        </p>
      </div>
    </div>
  );
}
