"use client";

import { useId, useMemo, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  DG,
  GRAPH_GOALS,
  GRID_X,
  GRID_Y,
  GV,
  HSHAPES,
  IC_CHOICES,
  IC_GOALS,
  IC_TASKS,
  IC_X,
  IC_Y_OTHER,
  IC_Y_SAME,
  KIND_CHOICES,
  LIFE_CASES,
  NEST,
  ONE_GOALS,
  ONE_X,
  ONE_Y3,
  ONE_Y4,
  PV,
  PV_TICKS,
  SHAPES,
  cutH,
  cutV,
  dgGeom,
  dgRowY,
  gvX,
  gvY,
  imageIdx,
  isBijection,
  isConstant,
  isFunction,
  isIdentity,
  isInjective,
  outDeg,
  pvX,
  pvY,
  svgPath,
  traceBranch,
  type Edge,
  type HShape,
  type IcTask,
  type LifeCase,
  type Piece,
  type Pt,
  type Shape,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "graph_is_set",
    prompt:
      "함수의 그래프가 본디 「집합」이라는 말의 뜻을 순서쌍을 써서 설명하고, 세로선 판정이 함수의 어떤 조건을 확인하는 것인지 써 보세요.",
    kind: "text",
    placeholder:
      "예: 그래프는 G = {(x, f(x)) | x ∈ X} 로, 정의역의 원소와 그 함숫값을 짝지은 순서쌍을 모두 모은 집합이다. 좌표평면의 그림은 그 집합을 눈에 보이게 그린 것일 뿐이다. 세로선 x = a 가 그래프와 두 점에서 만나면 a 의 짝이 둘이 되므로, 세로선 판정은 「짝은 오직 하나」라는 조건을 확인하는 것이다.",
  },
  {
    id: "inj_vs_bij",
    prompt:
      "일대일함수와 일대일대응은 무엇이 다른가요? 탭②에서 공역의 크기를 바꾸었을 때 일어난 일과 함께 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 일대일함수는 서로 다른 x 가 서로 다른 값으로 가는 것이고, 일대일대응은 거기에 치역과 공역이 같다는 조건이 더 붙은 것이다. 공역을 3개에서 4개로 늘리자 일대일함수는 만들 수 있었지만 화살표를 받지 못한 원소가 반드시 하나 남아 일대일대응은 아예 만들 수 없었다. 가로선 판정으로는 일대일함수인지까지만 알 수 있고 일대일대응인지는 공역을 알아야 한다.",
  },
  {
    id: "id_and_const",
    prompt:
      "항등함수와 상수함수의 조건을 각각 쓰고, 탭③에서 겉보기에 속기 쉬웠던 문제를 하나 들어 그 까닭을 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 항등함수는 정의역과 공역이 같고 모든 x 에 대해 f(x) = x 인 함수, 상수함수는 모든 x 의 값이 하나로 같은 함수다. 정의역이 {0, 1} 인 f(x) = x² 은 식이 x 가 아니어서 항등함수가 아닐 줄 알았는데 값이 0 과 1 그대로여서 항등함수였다. 반대로 f(x) = 5 − x 는 정의역과 공역이 같은데도 자리를 바꾸어 항등함수가 아니었다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "graph" | "one" | "idconst" | "life";

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition " +
        (active ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
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
            (i === cur
              ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100"
              : done.includes(id)
                ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
                : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
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

function NextBtn({ onClick, label = "다음 문제 ▶" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
    >
      {label}
    </button>
  );
}

/** 문장 조각 — 한글은 HTML, 식은 KaTeX (KaTeX 안에 한글을 넣을 수 없다) */
function PieceText({ p }: { p: Piece }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1">
      {p.pre}
      {p.tex ? <Katex expr={p.tex} /> : null}
      {p.post}
    </span>
  );
}
function PieceLine({ ps }: { ps: Piece[] }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
      {ps.map((p, i) => (
        <PieceText key={i} p={p} />
      ))}
    </span>
  );
}

function TipBox({ text, open, onOpen }: { text: string; open: boolean; onOpen: () => void }) {
  if (open) return <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">💡 {text}</p>;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
    >
      💡 힌트
    </button>
  );
}

function Slider({ label, value, min, max, step, onChange, accent = "accent-cyan-400" }: { label: React.ReactNode; value: number; min: number; max: number; step: number; onChange: (v: number) => void; accent?: string }) {
  return (
    <label className="block text-[11px] font-bold text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        {label} <span className="font-mono text-[13px] text-slate-100">{value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={"mt-0.5 w-full " + accent} />
    </label>
  );
}

const ABC = ["①", "②", "③", "④", "⑤", "⑥"];

function SetTag({ items, tone }: { items: string[]; tone: string }) {
  return (
    <span className={"rounded-lg px-2 py-1 font-mono text-[13px] font-bold " + tone}>
      {items.length === 0 ? "{ }" : `{ ${items.join(", ")} }`}
    </span>
  );
}

function GoalList({ goals, seen }: { goals: string[]; seen: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className="text-[11px] font-bold text-slate-400">해 볼 것 세 가지</p>
      <div className="mt-1 space-y-1 text-[12px] leading-6">
        {goals.map((g, i) => (
          <p key={g} className={seen.includes(String(i)) ? "text-emerald-200" : "text-slate-400"}>
            {seen.includes(String(i)) ? "✓" : "○"} {g}
          </p>
        ))}
      </div>
    </div>
  );
}

function toggleEdge(edges: Edge[], a: number, b: number): Edge[] {
  const hit = edges.some(([p, q]) => p === a && q === b);
  return hit ? edges.filter(([p, q]) => !(p === a && q === b)) : [...edges, [a, b] as Edge];
}

// ══════════════════════════════════════════════════════════════
// 화살표 대응도
// ══════════════════════════════════════════════════════════════
function arrowHead(x1: number, y1: number, x2: number, y2: number): string {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const L = 9.5;
  const W = 4.6;
  const bx = x2 - L * Math.cos(a);
  const by = y2 - L * Math.sin(a);
  return `${x2},${y2} ${bx + W * Math.sin(a)},${by - W * Math.cos(a)} ${bx - W * Math.sin(a)},${by + W * Math.cos(a)}`;
}

type DiaProps = {
  xs: string[];
  ys: string[];
  edges: Edge[];
  lx?: string;
  ly?: string;
  fname?: string;
  arrowColor?: string;
  rangeSet?: number[];
  badX?: number[];
  selX?: number | null;
  onPickX?: (i: number) => void;
  onPickY?: (i: number) => void;
  fontPx?: number;
};

function ArrowDia({
  xs,
  ys,
  edges,
  lx = "X",
  ly = "Y",
  fname = "f",
  arrowColor = "rgba(226,232,240,0.8)",
  rangeSet,
  badX,
  selX = null,
  onPickX,
  onPickY,
  fontPx = 14,
}: DiaProps) {
  const g = dgGeom(xs.length, ys.length);
  const x0 = DG.cxX + DG.inset;
  const x1 = DG.cxY - DG.inset;
  const clickable = Boolean(onPickX || onPickY);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${DG.w} ${g.h}`} className="mx-auto block w-full max-w-[360px] touch-none select-none" role="img" aria-label="두 집합 사이의 대응을 나타낸 그림">
        <ellipse cx={DG.cxX} cy={g.cy} rx={DG.rx} ry={g.ryX} fill="rgba(255,255,255,0.03)" stroke="rgba(226,232,240,0.55)" strokeWidth={2} />
        <ellipse cx={DG.cxY} cy={g.cy} rx={DG.rx} ry={g.ryY} fill="rgba(255,255,255,0.03)" stroke="rgba(226,232,240,0.55)" strokeWidth={2} />

        <text x={DG.cxX} y={g.cy - g.ryX - 9} textAnchor="middle" className="fill-slate-300 text-[13px] font-bold">
          {lx}
        </text>
        <text x={DG.cxY} y={g.cy - g.ryY - 9} textAnchor="middle" className="fill-slate-300 text-[13px] font-bold">
          {ly}
        </text>

        {fname ? (
          <g>
            <line x1={DG.cxX + 26} y1={20} x2={DG.cxY - 26} y2={20} stroke="rgba(226,232,240,0.5)" strokeWidth={1.6} />
            <polygon points={arrowHead(DG.cxX + 26, 20, DG.cxY - 26, 20)} fill="rgba(226,232,240,0.5)" />
            <text x={(DG.cxX + DG.cxY) / 2} y={13} textAnchor="middle" className="fill-slate-300 text-[12px] font-bold italic">
              {fname}
            </text>
          </g>
        ) : null}

        {rangeSet
          ? rangeSet.map((i) => (
              <circle key={`rg${i}`} cx={DG.cxY} cy={dgRowY(i, ys.length, g.cy)} r={15} fill="rgba(52,211,153,0.28)" stroke="#34d399" strokeWidth={2} />
            ))
          : null}

        {edges.map(([a, b], k) => {
          const ya = dgRowY(a, xs.length, g.cy);
          const yb = dgRowY(b, ys.length, g.cy);
          return (
            <g key={`e${k}`}>
              <line x1={x0} y1={ya} x2={x1} y2={yb} stroke={arrowColor} strokeWidth={1.8} />
              <polygon points={arrowHead(x0, ya, x1, yb)} fill={arrowColor} />
            </g>
          );
        })}

        {xs.map((s, i) => {
          const y = dgRowY(i, xs.length, g.cy);
          const bad = badX?.includes(i);
          const sel = selX === i;
          return (
            <g key={`x${i}`} className={onPickX ? "cursor-pointer" : undefined} onPointerDown={onPickX ? (e) => { e.preventDefault(); onPickX(i); } : undefined}>
              <circle cx={DG.cxX} cy={y} r={15} fill={sel ? "rgba(34,211,238,0.3)" : bad ? "rgba(251,113,133,0.22)" : clickable ? "rgba(255,255,255,0.07)" : "transparent"} stroke={sel ? "#22d3ee" : bad ? "#fb7185" : "transparent"} strokeWidth={2} />
              <text x={DG.cxX} y={y + fontPx * 0.36} textAnchor="middle" style={{ fontSize: fontPx }} className="fill-slate-100 font-semibold">
                {s}
              </text>
            </g>
          );
        })}
        {ys.map((s, i) => {
          const y = dgRowY(i, ys.length, g.cy);
          return (
            <g key={`y${i}`} className={onPickY ? "cursor-pointer" : undefined} onPointerDown={onPickY ? (e) => { e.preventDefault(); onPickY(i); } : undefined}>
              <circle cx={DG.cxY} cy={y} r={15} fill={clickable ? "rgba(255,255,255,0.07)" : "transparent"} stroke="transparent" strokeWidth={2} />
              <text x={DG.cxY} y={y + fontPx * 0.36} textAnchor="middle" style={{ fontSize: fontPx }} className="fill-slate-100 font-semibold">
                {s}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 좌표평면 — 세로선·가로선 판정에 함께 쓴다
// ══════════════════════════════════════════════════════════════
type PlaneProps = {
  branches: Shape["branches"];
  dots?: Pt[];
  /** 정의역이 거기서 끝남을 알리는 끝점 */
  ends?: Pt[];
  vertical?: number;
  mode: "v" | "h";
  pos: number;
  cuts: number[] | "many";
  curveColor?: string;
};

function PlaneBox({ branches, dots, ends, vertical, mode, pos, cuts, curveColor = "#a78bfa" }: PlaneProps) {
  const uid = useId().replace(/:/g, "");
  const polys = useMemo(() => branches.flatMap((br) => traceBranch(br)), [branches]);
  const many = cuts === "many";
  const list = many ? [] : cuts;
  const lineColor = mode === "v" ? "#fbbf24" : "#38bdf8";

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${PV.size} ${PV.size}`} className="mx-auto block w-full max-w-[300px]" role="img" aria-label="그래프와 움직이는 판정선">
        <defs>
          <clipPath id={`pc-${uid}`}>
            <rect x={PV.pad - 1} y={PV.pad - 1} width={PV.size - 2 * PV.pad + 2} height={PV.size - 2 * PV.pad + 2} />
          </clipPath>
        </defs>

        <rect x={PV.pad} y={PV.pad} width={PV.size - 2 * PV.pad} height={PV.size - 2 * PV.pad} fill="rgba(255,255,255,0.02)" />
        {PV_TICKS.map((v) => (
          <g key={`gr${v}`}>
            <line x1={pvX(v)} y1={PV.pad} x2={pvX(v)} y2={PV.size - PV.pad} stroke="rgba(226,232,240,0.06)" strokeWidth={1} />
            <line x1={PV.pad} y1={pvY(v)} x2={PV.size - PV.pad} y2={pvY(v)} stroke="rgba(226,232,240,0.06)" strokeWidth={1} />
          </g>
        ))}
        <line x1={PV.pad} y1={pvY(0)} x2={PV.size - PV.pad} y2={pvY(0)} stroke="rgba(226,232,240,0.5)" strokeWidth={1.6} />
        <line x1={pvX(0)} y1={PV.pad} x2={pvX(0)} y2={PV.size - PV.pad} stroke="rgba(226,232,240,0.5)" strokeWidth={1.6} />

        {/* 그래프와 판정선 — 선만 잘라 낸다 */}
        <g clipPath={`url(#pc-${uid})`}>
          {polys.map((poly, k) => (
            <path key={`p${k}`} d={svgPath(poly)} fill="none" stroke={many ? "#fb7185" : curveColor} strokeWidth={2.6} strokeLinecap="round" />
          ))}
          {vertical !== undefined ? (
            <line x1={pvX(vertical)} y1={pvY(PV.max)} x2={pvX(vertical)} y2={pvY(PV.min)} stroke={many ? "#fb7185" : curveColor} strokeWidth={2.6} />
          ) : null}
          {mode === "v" ? (
            <line x1={pvX(pos)} y1={PV.pad} x2={pvX(pos)} y2={PV.size - PV.pad} stroke={lineColor} strokeWidth={2.2} strokeDasharray="6 4" />
          ) : (
            <line x1={PV.pad} y1={pvY(pos)} x2={PV.size - PV.pad} y2={pvY(pos)} stroke={lineColor} strokeWidth={2.2} strokeDasharray="6 4" />
          )}
        </g>

        {/* 점·이름표는 잘라 내기 밖에 그린다 */}
        {(dots ?? []).map(([x, y]) => (
          <circle key={`d${x}_${y}`} cx={pvX(x)} cy={pvY(y)} r={4.5} fill={many ? "#fb7185" : curveColor} />
        ))}
        {(ends ?? []).map(([x, y]) => (
          <circle key={`e${x}_${y}`} cx={pvX(x)} cy={pvY(y)} r={4.5} fill={many ? "#fb7185" : curveColor} stroke="#0f172a" strokeWidth={1.5} />
        ))}
        {list.map((v, k) => {
          const cx = mode === "v" ? pvX(pos) : pvX(v);
          const cy = mode === "v" ? pvY(v) : pvY(pos);
          return <circle key={`c${k}`} cx={cx} cy={cy} r={6} fill={list.length >= 2 ? "#fb7185" : "#34d399"} stroke="#0f172a" strokeWidth={2} />;
        })}
        <text x={PV.size - PV.pad + 1} y={pvY(0) - 6} textAnchor="end" className="fill-slate-500 text-[10px] font-bold italic">
          x
        </text>
        <text x={pvX(0) + 7} y={PV.pad + 9} className="fill-slate-500 text-[10px] font-bold italic">
          y
        </text>
        <text x={mode === "v" ? Math.min(PV.size - 6, pvX(pos) + 5) : PV.size - PV.pad - 2} y={mode === "v" ? PV.pad + 10 : Math.max(PV.pad + 10, pvY(pos) - 6)} textAnchor={mode === "v" ? "start" : "end"} style={{ fill: lineColor }} className="text-[10px] font-bold italic">
          {mode === "v" ? `x=${pos}` : `y=${pos}`}
        </text>
      </svg>
    </div>
  );
}

function CutBadge({ cuts }: { cuts: number[] | "many" }) {
  const many = cuts === "many";
  const n = many ? Infinity : cuts.length;
  const tone = many || n >= 2 ? "bg-rose-400/15 text-rose-100" : n === 1 ? "bg-emerald-400/15 text-emerald-100" : "bg-white/5 text-slate-300";
  return (
    <p className={"rounded-lg px-3 py-2 text-center text-[13px] font-extrabold " + tone}>
      만나는 점 {many ? "무수히 많음" : `${n} 개`}
    </p>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function FunctionTypesLab() {
  const [tab, setTab] = useState<Tab>("graph");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">📈 함수의 그래프와 여러 가지 함수</h3>
        <p className="mt-2 leading-7 text-slate-300">
          그래프는 순서쌍을 모은 <b className="text-violet-200">집합</b>입니다. 선을 하나 그어 움직여 보는 것만으로 함수인지, 일대일함수인지를 가려낼 수 있어요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "graph"} onClick={() => setTab("graph")}>
          ① 함수의 그래프 📈
        </TabButton>
        <TabButton active={tab === "one"} onClick={() => setTab("one")}>
          ② 일대일함수·일대일대응 ↔️
        </TabButton>
        <TabButton active={tab === "idconst"} onClick={() => setTab("idconst")}>
          ③ 항등함수·상수함수 🪞
        </TabButton>
        <TabButton active={tab === "life"} onClick={() => setTab("life")}>
          ④ 일상 속에서 찾기 🏫
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "graph" ? <GraphTab /> : null}
        {tab === "one" ? <OneTab /> : null}
        {tab === "idconst" ? <IdConstTab /> : null}
        {tab === "life" ? <LifeTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 함수의 그래프
// ══════════════════════════════════════════════════════════════
function GridPlane({ pts, onToggle }: { pts: Pt[]; onToggle: (x: number, y: number) => void }) {
  const has = (x: number, y: number) => pts.some(([a, b]) => a === x && b === y);
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${GV.size} ${GV.size}`} className="mx-auto block w-full max-w-[260px] touch-none select-none" role="img" aria-label="순서쌍을 찍는 좌표평면">
        {GRID_X.map((x) => (
          <line key={`vx${x}`} x1={gvX(x)} y1={gvY(GV.y0)} x2={gvX(x)} y2={gvY(GV.y1)} stroke="rgba(226,232,240,0.08)" strokeWidth={1} />
        ))}
        {GRID_Y.map((y) => (
          <line key={`hy${y}`} x1={gvX(GV.x0)} y1={gvY(y)} x2={gvX(GV.x1)} y2={gvY(y)} stroke="rgba(226,232,240,0.08)" strokeWidth={1} />
        ))}
        <line x1={gvX(GV.x0)} y1={gvY(0)} x2={gvX(GV.x1)} y2={gvY(0)} stroke="rgba(226,232,240,0.55)" strokeWidth={1.6} />
        <line x1={gvX(0)} y1={gvY(GV.y0)} x2={gvX(0)} y2={gvY(GV.y1)} stroke="rgba(226,232,240,0.55)" strokeWidth={1.6} />

        {GRID_X.map((x) => (
          <text key={`tx${x}`} x={gvX(x)} y={gvY(0) + 15} textAnchor="middle" className="fill-slate-500 font-mono text-[10px]">
            {x}
          </text>
        ))}
        {GRID_Y.map((y) => (
          <text key={`ty${y}`} x={gvX(0) - 7} y={gvY(y) + 4} textAnchor="end" className="fill-slate-500 font-mono text-[10px]">
            {y}
          </text>
        ))}

        {GRID_X.map((x) =>
          GRID_Y.map((y) => {
            const on = has(x, y);
            return (
              <g key={`p${x}_${y}`} className="cursor-pointer" onPointerDown={(e) => { e.preventDefault(); onToggle(x, y); }}>
                <circle cx={gvX(x)} cy={gvY(y)} r={13} fill="rgba(255,255,255,0.04)" />
                <circle cx={gvX(x)} cy={gvY(y)} r={on ? 6 : 2.6} fill={on ? "#a78bfa" : "rgba(226,232,240,0.3)"} />
              </g>
            );
          }),
        )}
        <text x={gvX(GV.x1) - 2} y={gvY(0) - 6} textAnchor="end" className="fill-slate-500 text-[10px] font-bold italic">
          x
        </text>
        <text x={gvX(0) + 7} y={gvY(GV.y1) + 10} className="fill-slate-500 text-[10px] font-bold italic">
          y
        </text>
      </svg>
    </div>
  );
}

function pairTex(pts: Pt[]): string {
  if (pts.length === 0) return "G = \\varnothing";
  const sorted = [...pts].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  return "G = \\{" + sorted.map(([x, y]) => `(${x},\\,${y})`).join(",\\ ") + "\\}";
}

function GraphTab() {
  const [pts, setPts] = useState<Pt[]>([]);
  const [seen, setSeen] = useState<string[]>([]);

  const [qi, setQi] = useState(0);
  const [posMap, setPosMap] = useState<Record<string, number>>({});
  const [verdict, setVerdict] = useState<Record<string, boolean>>({});
  const [foundMap, setFoundMap] = useState<Record<string, boolean>>({});
  const [tips, setTips] = useState<string[]>([]);

  const deg = GRID_X.map((x) => pts.filter(([a]) => a === x).length);
  const isFn = deg.every((d) => d === 1);
  const edges: Edge[] = pts.map(([x, y]) => [GRID_X.indexOf(x), GRID_Y.indexOf(y)]);

  const toggle = (x: number, y: number) => {
    const next: Pt[] = pts.some(([a, b]) => a === x && b === y) ? pts.filter(([a, b]) => !(a === x && b === y)) : [...pts, [x, y] as Pt];
    setPts(next);
    const d = GRID_X.map((v) => next.filter(([a]) => a === v).length);
    const hit: string[] = [];
    if (d.every((v) => v === 1)) hit.push("0");
    if (d.some((v) => v >= 2)) hit.push("1");
    if (d.some((v) => v === 0) && next.length > 0) hit.push("2");
    if (hit.length) setSeen((s) => [...new Set([...s, ...hit])]);
  };

  const s = SHAPES[qi];
  const pos = posMap[s.id] ?? 0;
  const cuts = useMemo(() => cutV(s, pos), [s, pos]);
  const cnt = cuts === "many" ? Infinity : cuts.length;
  const found = (foundMap[s.id] ?? false) || cnt >= 2;
  const right = verdict[s.id] === s.isFunc;
  const cleared = right && (s.isFunc || found);

  const doneIds = SHAPES.filter((q) => verdict[q.id] === q.isFunc && (q.isFunc || foundMap[q.id])).map((q) => q.id);

  const movePos = (v: number) => {
    setPosMap((m) => ({ ...m, [s.id]: v }));
    const r = cutV(s, v);
    if (r === "many" || r.length >= 2) setFoundMap((m) => ({ ...m, [s.id]: true }));
  };

  return (
    <div className="space-y-4">
      {/* 순서쌍으로 그래프 만들기 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">📌 그래프는 순서쌍을 모은 집합</p>
        <p className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-center text-[15px] leading-8 text-slate-100">
          <Katex expr="G = \{\,(x,\ f(x)) \mid x \in X\,\}" />
        </p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          격자 위의 점을 눌러 순서쌍을 찍어 보세요. 왼쪽 대응도의 화살표가 함께 움직입니다.
        </p>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            <GridPlane pts={pts} onToggle={toggle} />
            <button
              type="button"
              onClick={() => setPts([])}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 모두 지우기
            </button>
          </div>

          <div className="space-y-2">
            <ArrowDia
              xs={GRID_X.map(String)}
              ys={GRID_Y.map(String)}
              edges={edges}
              fname={isFn ? "f" : ""}
              arrowColor={isFn ? "rgba(52,211,153,0.9)" : "rgba(167,139,250,0.85)"}
              badX={deg.map((d, i) => (d === 1 ? -1 : i)).filter((i) => i >= 0)}
              fontPx={13}
            />
            <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2.5 text-center text-[13px] leading-8 text-slate-100">
              <Katex expr={pairTex(pts)} />
            </p>
            <p className={"rounded-lg px-3 py-2 text-center text-[13px] font-extrabold " + (isFn ? "bg-emerald-400/15 text-emerald-100" : "bg-white/5 text-slate-300")}>
              {isFn ? "🎉 함수의 그래프입니다" : "아직 함수의 그래프가 아니에요"}
            </p>
            <GoalList goals={GRAPH_GOALS} seen={seen} />
          </div>
        </div>
      </div>

      {/* 세로선 판정 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">📏 세로선 판정</p>
          <Chips ids={SHAPES.map((q) => q.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          세로선을 옮겨 만나는 점을 세어 보세요. 어느 자리에서든 <b className="text-slate-200">한 점을 넘지 않으면</b> 함수의 그래프입니다.
        </p>
        <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
          📖 <b className="text-slate-300">보는 법</b> — 그림마다 <b className="text-slate-300">어디까지 그려져 있는지</b>를 함께 적어 두었어요. 상자 끝에서 잘린 그림은 밖으로도 이어진다는 뜻이고, 동그란 점으로 끝난 곳은 거기서 그림이 끝난다는 뜻입니다. 세로선과 한 점도 만나지 않는 자리는 그 <Katex expr="x" /> 가 정의역에 없다는 뜻이니 판정과는 관계가 없어요.
        </p>

        <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-center">
          <p className="overflow-x-auto overflow-y-hidden py-1 text-[15px] font-bold leading-8 text-slate-100">
            <PieceLine ps={s.label} />
          </p>
          <p className="mt-1 text-[12px] leading-7 text-slate-400">
            <PieceLine ps={s.note} />
          </p>
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <PlaneBox branches={s.branches} dots={s.dots} ends={s.ends} vertical={s.vertical} mode="v" pos={pos} cuts={cuts} />

          <div className="space-y-2">
            <Slider label={<Katex expr="x" />} value={pos} min={PV.min} max={PV.max} step={0.25} onChange={movePos} accent="accent-amber-400" />
            <CutBadge cuts={cuts} />

            <div className="grid grid-cols-2 gap-1.5">
              {[true, false].map((v) => {
                const picked = verdict[s.id] === v;
                const good = picked && v === s.isFunc;
                const badPick = picked && v !== s.isFunc;
                return (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setVerdict((m) => ({ ...m, [s.id]: v }))}
                    disabled={right}
                    className={
                      "rounded-xl border-2 px-2 py-2.5 text-[13px] font-bold transition disabled:cursor-default " +
                      (good
                        ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                        : badPick
                          ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    {v ? "함수의 그래프" : "함수의 그래프가 아님"}
                  </button>
                );
              })}
            </div>

            {verdict[s.id] !== undefined && !right ? (
              <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ 세로선을 여기저기 옮겨 보고 다시 판정해 보세요.</p>
            ) : null}

            {right && !s.isFunc && !found ? (
              <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">
                🔍 판정은 맞았어요. 이제 <b>두 점 이상에서 만나는 자리</b>를 세로선으로 직접 찾아보세요.
              </p>
            ) : null}

            {cleared ? <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {s.why}</p> : <TipBox text={s.hint} open={tips.includes(s.id)} onOpen={() => setTips((t) => [...t, s.id])} />}

            {cleared && qi < SHAPES.length - 1 ? <NextBtn onClick={() => setQi((k) => k + 1)} /> : null}
          </div>
        </div>
      </div>

      {doneIds.length === SHAPES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 아홉 그림을 모두 가려냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            굽이가 많아도, 조각이 끊겨 있어도, 점 몇 개뿐이어도 <b className="text-white">세로선과 두 점에서 만나지만 않으면</b> 함수의 그래프예요. 만나지 않는 자리는 그저 정의역 밖일 뿐입니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 일대일함수와 일대일대응
// ══════════════════════════════════════════════════════════════
// ly: 띠 이름표의 글자 밑선,  my: 「지금 여기」 표시가 들어갈 자리.
// 둘 다 제 띠 안쪽이면서 바로 안쪽 띠의 밖이 되도록 잡았다(한 칸 안쪽을 가리키는 것처럼 보이지 않게).
const NEST_BOX = [
  { x: 6, y: 6, w: 308, h: 188, ly: 22, my: 182 },
  { x: 34, y: 30, w: 252, h: 140, ly: 46, my: 158 },
  { x: 62, y: 54, w: 196, h: 92, ly: 70, my: 134 },
  { x: 96, y: 78, w: 128, h: 44, ly: 95, my: 112 },
];

/** 모서리가 둥근 직사각형 한 바퀴 */
function rrPath(x: number, y: number, w: number, h: number, r: number): string {
  return (
    `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r}` +
    ` V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h}` +
    ` H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r}` +
    ` V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`
  );
}

/** 지금 해당하는 띠만 칠한다 — 안쪽 띠는 도려 내어 겹치지 않게 한다 */
function ringPath(i: number): string {
  const b = NEST_BOX[i];
  const outer = rrPath(b.x, b.y, b.w, b.h, 18);
  if (i === NEST_BOX.length - 1) return outer;
  const n = NEST_BOX[i + 1];
  return outer + " " + rrPath(n.x, n.y, n.w, n.h, 18);
}

function NestDia({ level }: { level: number }) {
  const cur = NEST_BOX[level];
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox="0 0 320 200" className="mx-auto block w-full max-w-[320px]" role="img" aria-label="대응과 함수의 포함 관계">
        <path d={ringPath(level)} fillRule="evenodd" fill={NEST[level].color} opacity={0.18} />
        {NEST_BOX.map((b, i) => (
          <rect
            key={NEST[i].id}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={18}
            fill="none"
            stroke={NEST[i].color}
            strokeWidth={level === i ? 3 : 1.6}
            opacity={level === i ? 1 : 0.5}
          />
        ))}
        {NEST_BOX.map((b, i) => (
          <text
            key={NEST[i].id}
            x={160}
            y={b.ly}
            textAnchor="middle"
            style={{ fill: NEST[i].color }}
            className={"text-[12px] " + (level === i ? "font-extrabold" : "font-bold")}
            opacity={level === i ? 1 : 0.65}
          >
            {NEST[i].name}
          </text>
        ))}
        <rect x={128} y={cur.my - 8} width={64} height={16} rx={8} fill="#0f172a" stroke={NEST[level].color} strokeWidth={1.6} />
        <text x={160} y={cur.my + 4} textAnchor="middle" style={{ fill: NEST[level].color }} className="text-[10px] font-extrabold">
          지금 여기
        </text>
      </svg>
    </div>
  );
}

function OneTab() {
  const [big, setBig] = useState(false);
  const [boards, setBoards] = useState<Record<string, Edge[]>>({});
  const [selX, setSelX] = useState<number | null>(null);
  const [seen, setSeen] = useState<string[]>([]);

  const [qi, setQi] = useState(0);
  const [posMap, setPosMap] = useState<Record<string, number>>({});
  const [verdict, setVerdict] = useState<Record<string, boolean>>({});
  const [foundMap, setFoundMap] = useState<Record<string, boolean>>({});
  const [tips, setTips] = useState<string[]>([]);

  const ys = big ? ONE_Y4 : ONE_Y3;
  const bk = big ? "b4" : "b3";
  const edges = boards[bk] ?? [];
  const nx = ONE_X.length;
  const ny = ys.length;
  const fn = isFunction(edges, nx);
  const inj = isInjective(edges, nx);
  const bij = isBijection(edges, nx, ny);
  const level = !fn ? 0 : !inj ? 1 : !bij ? 2 : 3;

  const pickY = (b: number) => {
    if (selX === null) return;
    const next = toggleEdge(edges, selX, b);
    setBoards((m) => ({ ...m, [bk]: next }));
    setSelX(null);
    const f = isFunction(next, nx);
    const i2 = isInjective(next, nx);
    const b2 = isBijection(next, nx, ny);
    const hit: string[] = [];
    if (f && !i2) hit.push("0");
    if (i2 && !b2) hit.push("1");
    if (b2) hit.push("2");
    if (hit.length) setSeen((s) => [...new Set([...s, ...hit])]);
  };

  const s: HShape = HSHAPES[qi];
  const pos = posMap[s.id] ?? 0;
  const cuts = useMemo(() => cutH(s, pos), [s, pos]);
  const cnt = cuts === "many" ? Infinity : cuts.length;
  const found = (foundMap[s.id] ?? false) || cnt >= 2;
  const right = verdict[s.id] === s.one2one;
  const cleared = right && (s.one2one || found);
  const doneIds = HSHAPES.filter((q) => verdict[q.id] === q.one2one && (q.one2one || foundMap[q.id])).map((q) => q.id);

  const movePos = (v: number) => {
    setPosMap((m) => ({ ...m, [s.id]: v }));
    const r = cutH(s, v);
    if (r === "many" || r.length >= 2) setFoundMap((m) => ({ ...m, [s.id]: true }));
  };

  return (
    <div className="space-y-4">
      {/* 대응도로 배우기 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">↔️ 조건을 하나씩 더 붙여 보기</p>
          <div className="flex gap-1.5">
            {[false, true].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => {
                  setBig(v);
                  setSelX(null);
                }}
                className={
                  "rounded-lg border-2 px-2.5 py-1.5 text-[12px] font-bold transition " +
                  (big === v ? "border-pink-400/70 bg-pink-400/20 text-pink-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                공역 {v ? "4" : "3"} 개
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            <ArrowDia
              xs={ONE_X}
              ys={ys}
              edges={edges}
              fname={fn ? "f" : ""}
              arrowColor={bij ? "rgba(244,114,182,0.9)" : inj ? "rgba(251,191,36,0.9)" : fn ? "rgba(52,211,153,0.9)" : "rgba(226,232,240,0.8)"}
              rangeSet={fn ? imageIdx(edges) : undefined}
              badX={outDeg(edges, nx).map((d, i) => (d === 1 ? -1 : i)).filter((i) => i >= 0)}
              selX={selX}
              onPickX={(i) => setSelX((v) => (v === i ? null : i))}
              onPickY={pickY}
            />
            <button
              type="button"
              onClick={() => {
                setBoards((m) => ({ ...m, [bk]: [] }));
                setSelX(null);
              }}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 모두 지우기
            </button>
            <div className="space-y-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-[12px] leading-6">
              <p className={fn ? "text-emerald-200" : "text-slate-400"}>{fn ? "✓" : "○"} 함수 — 빠짐없이 하나씩</p>
              <p className={inj ? "text-amber-200" : "text-slate-400"}>{inj ? "✓" : "○"} 일대일함수 — 서로 다른 곳으로</p>
              <p className={bij ? "text-pink-200" : "text-slate-400"}>{bij ? "✓" : "○"} 일대일대응 — 치역과 공역이 같음</p>
            </div>
          </div>

          <div className="space-y-2">
            <NestDia level={level} />
            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-[12px] leading-7 text-slate-300">
              <p className="flex flex-wrap items-center gap-1.5">
                <span className="text-emerald-200">치역</span>{" "}
                {fn ? <SetTag items={imageIdx(edges).map((i) => ys[i])} tone="bg-emerald-400/15 text-emerald-100" /> : <span className="text-slate-500">함수가 아니라 말할 수 없음</span>}
              </p>
              <p className="flex flex-wrap items-center gap-1.5">
                <span className="text-sky-200">공역</span> <SetTag items={ys} tone="bg-sky-400/15 text-sky-100" />
              </p>
            </div>
            <GoalList goals={ONE_GOALS} seen={seen} />
            {big ? (
              <p className="rounded-lg bg-pink-400/10 px-3 py-2 text-[12px] leading-6 text-pink-100">
                🔍 공역이 정의역보다 크면 화살표를 받지 못한 원소가 반드시 남아요. 그래서 일대일대응은 아예 만들 수 없습니다.
              </p>
            ) : (
              <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">
                🔍 공역이 3개일 때는 일대일함수가 되면 저절로 일대일대응이 돼요. 두 번째 미션을 해내려면 공역을 4개로 늘려 보세요.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 가로선 판정 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">📐 가로선 판정</p>
          <Chips ids={HSHAPES.map((q) => q.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          모두 함수의 그래프예요. 가로선을 옮겨 <b className="text-slate-200">같은 높이를 두 번 지나는지</b> 살펴보세요.
        </p>
        <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
          📖 <b className="text-slate-300">보는 법</b> — 일대일함수인지는 <b className="text-slate-300">정의역과 대응 규칙</b>만으로 가려낼 수 있으므로 그림마다 정의역을 함께 적어 두었어요. 다만 <b className="text-slate-300">일대일대응인지는 공역까지 알아야</b> 하므로 그래프만 보고는 알 수 없습니다. 그래서 여기서는 일대일함수인지만 묻습니다.
        </p>

        <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-center">
          <p className="overflow-x-auto overflow-y-hidden py-1 text-[15px] font-bold leading-8 text-slate-100">
            <PieceLine ps={s.label} />
          </p>
          <p className="mt-1 text-[12px] leading-7 text-slate-400">
            <PieceLine ps={s.note} />
          </p>
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <PlaneBox branches={s.branches} dots={s.dots} ends={s.ends} mode="h" pos={pos} cuts={cuts} curveColor="#34d399" />

          <div className="space-y-2">
            <Slider label={<Katex expr="y" />} value={pos} min={PV.min} max={PV.max} step={0.25} onChange={movePos} accent="accent-sky-400" />
            <CutBadge cuts={cuts} />

            <div className="grid grid-cols-2 gap-1.5">
              {[true, false].map((v) => {
                const picked = verdict[s.id] === v;
                const good = picked && v === s.one2one;
                const badPick = picked && v !== s.one2one;
                return (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setVerdict((m) => ({ ...m, [s.id]: v }))}
                    disabled={right}
                    className={
                      "rounded-xl border-2 px-2 py-2.5 text-[13px] font-bold transition disabled:cursor-default " +
                      (good
                        ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                        : badPick
                          ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    {v ? "일대일함수" : "일대일함수가 아님"}
                  </button>
                );
              })}
            </div>

            {verdict[s.id] !== undefined && !right ? (
              <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ 가로선을 위아래로 옮겨 보고 다시 판정해 보세요.</p>
            ) : null}

            {right && !s.one2one && !found ? (
              <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">
                🔍 판정은 맞았어요. 이제 <b>두 점 이상에서 만나는 높이</b>를 가로선으로 직접 찾아보세요.
              </p>
            ) : null}

            {cleared ? <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {s.why}</p> : <TipBox text={s.hint} open={tips.includes(s.id)} onOpen={() => setTips((t) => [...t, s.id])} />}

            {cleared && qi < HSHAPES.length - 1 ? <NextBtn onClick={() => setQi((k) => k + 1)} /> : null}
          </div>
        </div>
      </div>

      {doneIds.length === HSHAPES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여덟 그래프를 모두 가려냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            그래프만 보고는 <b className="text-white">일대일함수인지까지만</b> 알 수 있어요. 일대일대응인지는 공역이 무엇인지 알아야 가려낼 수 있습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 항등함수와 상수함수
// ══════════════════════════════════════════════════════════════
function IcCard({ t, pick, onPick }: { t: IcTask; pick: number | undefined; onPick: (k: number) => void }) {
  const right = pick === t.answer;
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
        <div className="grid gap-1.5 text-[13px] leading-8 sm:grid-cols-3">
          <p className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-[11px] font-bold text-amber-200">정의역</span>
            <span className="text-slate-100">
              <Katex expr={t.domainTex} />
            </span>
          </p>
          <p className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-[11px] font-bold text-sky-200">공역</span>
            <span className="text-slate-100">
              <Katex expr={t.codoTex} />
            </span>
          </p>
          <p className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-[11px] font-bold text-violet-200">대응</span>
            <span className="text-slate-100">
              <Katex expr={t.ruleTex} />
            </span>
          </p>
        </div>
        {t.codoSame ? (
          <p className="mt-1 text-[11px] text-slate-500">정의역과 공역이 같은 집합입니다.</p>
        ) : (
          <p className="mt-1 text-[11px] text-slate-500">정의역과 공역이 다른 집합입니다.</p>
        )}
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {IC_CHOICES.map((c, k) => {
          const picked = pick === k;
          const good = picked && k === t.answer;
          const badPick = picked && k !== t.answer;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onPick(k)}
              disabled={right}
              className={
                "rounded-xl border-2 px-2.5 py-2 text-left text-[13px] font-bold transition disabled:cursor-default " +
                (good
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : badPick
                    ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              <span className="mr-1 text-slate-400">{ABC[k]}</span>
              {c}
            </button>
          );
        })}
      </div>

      {pick !== undefined ? (
        <div className="space-y-1.5">
          <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-white/10 bg-black/25 py-1">
            <table className="w-full min-w-[200px] text-center font-mono text-[12px]">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-2 py-1 font-bold">x</th>
                  {t.domain.map((x) => (
                    <th key={x} className="px-2 py-1 font-bold text-slate-200">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/10">
                  <td className="px-2 py-1 font-bold text-violet-300">f(x)</td>
                  {t.domain.map((x) => (
                    <td key={x} className={"px-2 py-1 " + (t.fn(x) === x ? "text-emerald-300" : "text-slate-100")}>
                      {t.fn(x)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {right ? (
            <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {t.why}</p>
          ) : (
            <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
              ❌ 표를 보며 다시 골라 보세요. <b>값이 자기 자신인지</b>, <b>값이 모두 하나로 같은지</b>, 그리고 <b>정의역과 공역이 같은 집합인지</b>를 차례로 따지면 됩니다.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function IdConstTab() {
  const [same, setSame] = useState(true);
  const [boards, setBoards] = useState<Record<string, Edge[]>>({});
  const [selX, setSelX] = useState<number | null>(null);
  const [seen, setSeen] = useState<string[]>([]);

  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const ys = same ? IC_Y_SAME : IC_Y_OTHER;
  const bk = same ? "same" : "other";
  const edges = boards[bk] ?? [];
  const nx = IC_X.length;
  const fn = isFunction(edges, nx);
  const idn = isIdentity(edges, IC_X, ys);
  const con = isConstant(edges, nx);

  const pickY = (b: number) => {
    if (selX === null) return;
    const next = toggleEdge(edges, selX, b);
    setBoards((m) => ({ ...m, [bk]: next }));
    setSelX(null);
    const f = isFunction(next, nx);
    const i2 = isIdentity(next, IC_X, ys);
    const c2 = isConstant(next, nx);
    const hit: string[] = [];
    if (i2) hit.push("0");
    if (c2) hit.push("1");
    if (f && !i2 && !c2) hit.push("2");
    if (hit.length) setSeen((s) => [...new Set([...s, ...hit])]);
  };

  const t = IC_TASKS[qi];
  const doneIds = IC_TASKS.filter((q) => pick[q.id] === q.answer).map((q) => q.id);
  const cleared = pick[t.id] === t.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🪞 직접 만들어 보기</p>
          <div className="flex gap-1.5">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => {
                  setSame(v);
                  setSelX(null);
                }}
                className={
                  "rounded-lg border-2 px-2.5 py-1.5 text-[12px] font-bold transition " +
                  (same === v ? "border-violet-400/70 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {v ? "공역 = 정의역" : "공역이 다른 집합"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            <ArrowDia
              xs={IC_X}
              ys={ys}
              edges={edges}
              ly={same ? "X" : "Y"}
              fname={fn ? "f" : ""}
              arrowColor={idn ? "rgba(52,211,153,0.9)" : con ? "rgba(251,191,36,0.9)" : "rgba(226,232,240,0.8)"}
              rangeSet={fn ? imageIdx(edges) : undefined}
              badX={outDeg(edges, nx).map((d, i) => (d === 1 ? -1 : i)).filter((i) => i >= 0)}
              selX={selX}
              onPickX={(i) => setSelX((v) => (v === i ? null : i))}
              onPickY={pickY}
            />
            <button
              type="button"
              onClick={() => {
                setBoards((m) => ({ ...m, [bk]: [] }));
                setSelX(null);
              }}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 모두 지우기
            </button>
          </div>

          <div className="space-y-2">
            <div className="space-y-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-[12px] leading-6">
              <p className={fn ? "text-slate-200" : "text-slate-500"}>{fn ? "✓" : "○"} 함수</p>
              <p className={idn ? "text-emerald-200" : "text-slate-500"}>
                {idn ? "✓" : "○"} 항등함수 — 공역이 정의역과 같고 <Katex expr="f(x)=x" />
              </p>
              <p className={con ? "text-amber-200" : "text-slate-500"}>
                {con ? "✓" : "○"} 상수함수 — 모두 <Katex expr="f(x)=c" /> 한 곳으로
              </p>
            </div>
            <GoalList goals={IC_GOALS} seen={seen} />
            <p className={"rounded-lg px-3 py-2 text-[12px] leading-6 " + (same ? "bg-violet-400/10 text-violet-100" : "bg-amber-400/10 text-amber-100")}>
              🔍{" "}
              {same
                ? "공역이 정의역과 같으니 항등함수를 만들 수 있어요. 그런 방법은 딱 하나뿐입니다."
                : "공역이 다른 집합이면 아무리 이어도 항등함수가 될 수 없어요. 상수함수는 여전히 만들 수 있습니다."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔎 어떤 함수일까?</p>
          <Chips ids={IC_TASKS.map((q) => q.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <IcCard t={t} pick={pick[t.id]} onPick={(k) => setPick((m) => ({ ...m, [t.id]: k }))} />
        </div>
        {cleared && qi < IC_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === IC_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 열 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            식의 겉모습이 아니라 <b className="text-white">함숫값의 표</b>를 보세요. 값이 자기 자신이면 항등함수, 값이 모두 같으면 상수함수이고, 항등함수는 정의역과 공역이 같아야 한다는 조건이 하나 더 붙습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 일상 속에서 찾기
// ══════════════════════════════════════════════════════════════
function LifeCard({ c, pick, onPick }: { c: LifeCase; pick: number | undefined; onPick: (k: number) => void }) {
  const right = pick === c.answer;
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
        <p className="text-[13px] font-bold leading-7 text-slate-100">
          <span className="mr-1.5 text-lg">{c.icon}</span>
          {c.rule}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-slate-400">
          <span className="rounded-lg bg-amber-400/15 px-2 py-0.5 font-bold text-amber-100">{c.from}</span>
          <span>→</span>
          <span className="rounded-lg bg-sky-400/15 px-2 py-0.5 font-bold text-sky-100">{c.to}</span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ArrowDia
          xs={c.xs}
          ys={c.ys}
          edges={c.edges}
          lx={c.from}
          ly={c.to}
          fname={right && c.answer !== 0 ? "f" : ""}
          arrowColor={right ? (c.answer === 0 ? "rgba(251,113,133,0.9)" : "rgba(52,211,153,0.9)") : "rgba(226,232,240,0.8)"}
          rangeSet={right && c.answer !== 0 ? imageIdx(c.edges) : undefined}
          badX={right && c.answer === 0 ? outDeg(c.edges, c.xs.length).map((d, i) => (d === 1 ? -1 : i)).filter((i) => i >= 0) : undefined}
          fontPx={12}
        />

        <div className="space-y-1.5">
          <p className="text-[13px] font-bold text-slate-100">이 짝짓기는 어떤 함수일까요?</p>
          {KIND_CHOICES.map((k, i) => {
            const picked = pick === i;
            const good = picked && i === c.answer;
            const badPick = picked && i !== c.answer;
            return (
              <button
                key={k}
                type="button"
                onClick={() => onPick(i)}
                disabled={right}
                className={
                  "w-full rounded-lg border-2 px-2.5 py-2 text-left text-[12px] font-bold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : badPick
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                <span className="mr-1 text-slate-400">{ABC[i]}</span>
                {k}
              </button>
            );
          })}
        </div>
      </div>

      {pick !== undefined ? (
        right ? (
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {c.why}</p>
        ) : (
          <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
            ❌ 순서대로 따져 보세요. 빠짐없이 하나씩인가 → 서로 다른 곳으로 가는가 → 받지 못한 원소가 남았는가 → 모두 한 곳으로 가는가 → 자기 자신으로 가는가.
          </p>
        )
      ) : null}
    </div>
  );
}

function LifeTab() {
  const [ci, setCi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const c = LIFE_CASES[ci];
  const done = LIFE_CASES.filter((q) => pick[q.id] === q.answer).map((q) => q.id);
  const cleared = pick[c.id] === c.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🏫 일상생활에서 여섯 갈래 찾기</p>
          <Chips ids={LIFE_CASES.map((q) => q.id)} cur={ci} done={done} onPick={setCi} />
        </div>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">그림은 그 짝짓기를 몇 개만 뽑아 그린 것이에요.</p>
        <div className="mt-2">
          <LifeCard c={c} pick={pick[c.id]} onPick={(k) => setPick((m) => ({ ...m, [c.id]: k }))} />
        </div>
        {cleared && ci < LIFE_CASES.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setCi((k) => k + 1)} label="다음 사례 ▶" />
          </div>
        ) : null}
      </div>

      {done.length === LIFE_CASES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 열두 사례를 모두 가려냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            같은 짝짓기라도 <b className="text-white">공역을 무엇으로 두느냐</b>에 따라 일대일함수에서 일대일대응으로 바뀝니다. 남는 원소가 있는지 늘 함께 살펴보세요.
          </p>
        </div>
      ) : null}
    </div>
  );
}
