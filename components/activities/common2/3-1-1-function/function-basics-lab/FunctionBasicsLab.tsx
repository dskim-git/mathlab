"use client";

import { useId, useMemo, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  AB,
  DCR_TASKS,
  DG,
  EQUAL_PAIRS,
  EQ_ROWS,
  FAIL_CHOICES,
  FUNC_RULES,
  GV,
  JUDGE_TASKS,
  LAB_X,
  LAB_Y,
  LIFE_CASES,
  MISSIONS,
  RULE_CHIPS,
  RULE_X,
  RULE_Y,
  abX,
  abY,
  dgGeom,
  dgRowY,
  gvX,
  gvY,
  imageIdx,
  isFunction,
  outDeg,
  samplePath,
  type DcrTask,
  type Edge,
  type EqualPair,
  type JudgeTask,
  type LifeCase,
  type Mission,
  type Piece,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "corr_vs_func",
    prompt:
      "모든 함수는 대응이지만 모든 대응이 함수는 아닙니다. 함수가 되기 위한 두 조건을 쓰고, 탭①이나 탭④에서 그 조건을 어겼던 예를 하나 들어 보세요.",
    kind: "text",
    placeholder:
      "예: ① X 의 모든 원소가 빠짐없이 대응되어야 하고 ② 각 x 에 대응되는 Y 의 원소가 오직 하나여야 한다. 「학생 → 기르는 반려동물」은 기르지 않는 학생이 있어서 ①을 어겼고, 「수 → 그 수의 약수」는 4 에 1, 2, 4 가 함께 대응되어 ②를 어겼다.",
  },
  {
    id: "range_vs_codomain",
    prompt:
      "치역과 공역은 어떻게 다른가요? 탭②에서 규칙만 바꾸었을 때 치역이 어떻게 달라졌는지와 함께 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 공역은 짝이 될 수 있는 후보 전체이고 치역은 실제로 화살표를 받은 원소만 모은 것이라 언제나 치역 ⊂ 공역 이다. 공역 {1,…,8} 을 그대로 두고 규칙만 f(x)=2x 에서 f(x)=5 로 바꾸었더니 치역이 {2,4,6,8} 에서 {5} 로 줄었다. 치역은 정의역과 대응 규칙이 정한다는 것을 알았다.",
  },
  {
    id: "equal_three",
    prompt:
      "탭③에서 식이 서로 다른데도 f = g 였던 경우와, 식이 똑같은데도 f ≠ g 였던 경우를 각각 하나씩 들고 그 까닭을 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 정의역이 {1, 2} 일 때 f(x)=x² 과 g(x)=3x−2 는 값이 1 과 4 로 같아서 f = g 였다. 반대로 f(x)=2x 와 g(x)=2x 는 식이 같아도 정의역이 {1,2} 와 {1,2,3} 으로 달라 f ≠ g 였다. 함수는 식이 아니라 정의역·공역·대응 관계 세 가지로 정해지기 때문이다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "detect" | "dcr" | "equal" | "life" | "mission";

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

const ABC = ["①", "②", "③", "④"];

// ══════════════════════════════════════════════════════════════
// 화살표 대응도 — 다섯 탭이 함께 쓴다
// ══════════════════════════════════════════════════════════════
type DiaProps = {
  xs: string[];
  ys: string[];
  edges: Edge[];
  lx?: string;
  ly?: string;
  fname?: string;
  arrowColor?: string;
  /** 굵게 칠할 영역 */
  hl?: "domain" | "codomain" | "range" | null;
  /** 치역에 드는 Y 첨자 */
  rangeSet?: number[];
  /** 조건을 어긴 X 첨자 */
  badX?: number[];
  selX?: number | null;
  onPickX?: (i: number) => void;
  onPickY?: (i: number) => void;
  fontPx?: number;
};

function arrowHead(x1: number, y1: number, x2: number, y2: number): string {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const L = 9.5;
  const W = 4.6;
  const bx = x2 - L * Math.cos(a);
  const by = y2 - L * Math.sin(a);
  return `${x2},${y2} ${bx + W * Math.sin(a)},${by - W * Math.cos(a)} ${bx - W * Math.sin(a)},${by + W * Math.cos(a)}`;
}

function ArrowDia({
  xs,
  ys,
  edges,
  lx = "X",
  ly = "Y",
  fname = "f",
  arrowColor = "rgba(226,232,240,0.8)",
  hl = null,
  rangeSet,
  badX,
  selX = null,
  onPickX,
  onPickY,
  fontPx = 14,
}: DiaProps) {
  const uid = useId().replace(/:/g, "");
  const g = dgGeom(xs.length, ys.length);
  const x0 = DG.cxX + DG.inset;
  const x1 = DG.cxY - DG.inset;
  const clickable = Boolean(onPickX || onPickY);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg
        viewBox={`0 0 ${DG.w} ${g.h}`}
        className="mx-auto block w-full max-w-[360px] touch-none select-none"
        role="img"
        aria-label="두 집합 사이의 대응을 나타낸 그림"
      >
        <defs>
          <radialGradient id={`gx-${uid}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.28)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0.08)" />
          </radialGradient>
          <radialGradient id={`gy-${uid}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(56,189,248,0.26)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0.08)" />
          </radialGradient>
        </defs>

        {/* 집합 타원 */}
        <ellipse
          cx={DG.cxX}
          cy={g.cy}
          rx={DG.rx}
          ry={g.ryX}
          fill={hl === "domain" ? `url(#gx-${uid})` : "rgba(255,255,255,0.03)"}
          stroke={hl === "domain" ? "#fbbf24" : "rgba(226,232,240,0.55)"}
          strokeWidth={hl === "domain" ? 3 : 2}
        />
        <ellipse
          cx={DG.cxY}
          cy={g.cy}
          rx={DG.rx}
          ry={g.ryY}
          fill={hl === "codomain" ? `url(#gy-${uid})` : "rgba(255,255,255,0.03)"}
          stroke={hl === "codomain" ? "#38bdf8" : "rgba(226,232,240,0.55)"}
          strokeWidth={hl === "codomain" ? 3 : 2}
        />

        {/* 집합 이름 */}
        <text x={DG.cxX} y={g.cy - g.ryX - 9} textAnchor="middle" className={"text-[13px] font-bold " + (hl === "domain" ? "fill-amber-200" : "fill-slate-300")}>
          {lx}
        </text>
        <text x={DG.cxY} y={g.cy - g.ryY - 9} textAnchor="middle" className={"text-[13px] font-bold " + (hl === "codomain" ? "fill-sky-200" : "fill-slate-300")}>
          {ly}
        </text>

        {/* 위쪽 이름표 화살표 */}
        {fname ? (
          <g>
            <line x1={DG.cxX + 26} y1={20} x2={DG.cxY - 26} y2={20} stroke="rgba(226,232,240,0.5)" strokeWidth={1.6} />
            <polygon points={arrowHead(DG.cxX + 26, 20, DG.cxY - 26, 20)} fill="rgba(226,232,240,0.5)" />
            <text x={(DG.cxX + DG.cxY) / 2} y={13} textAnchor="middle" className="fill-slate-300 text-[12px] font-bold italic">
              {fname}
            </text>
          </g>
        ) : null}

        {/* 치역 표시 — 화살표를 받은 원소를 감싼다 */}
        {hl === "range" && rangeSet
          ? rangeSet.map((i) => (
              <circle key={`rg${i}`} cx={DG.cxY} cy={dgRowY(i, ys.length, g.cy)} r={15} fill="rgba(52,211,153,0.3)" stroke="#34d399" strokeWidth={2} />
            ))
          : null}

        {/* 화살표 */}
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

        {/* 원소 */}
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

/** 집합을 중괄호로 묶어 보여 준다 */
function SetTag({ items, tone }: { items: string[]; tone: string }) {
  return (
    <span className={"rounded-lg px-2 py-1 font-mono text-[13px] font-bold " + tone}>
      {items.length === 0 ? "{ }" : `{ ${items.join(", ")} }`}
    </span>
  );
}

function RuleCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className="text-[11px] font-bold text-slate-400">함수가 되기 위한 두 조건</p>
      <div className="mt-1 space-y-1 text-[13px] leading-7 text-slate-200">
        {FUNC_RULES.map((ps, i) => (
          <p key={i}>
            <PieceLine ps={ps} />
          </p>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function FunctionBasicsLab() {
  const [tab, setTab] = useState<Tab>("detect");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔗 함수</h3>
        <p className="mt-2 leading-7 text-slate-300">
          두 집합 사이에 <b className="text-amber-200">화살표를 긋는 일</b>이 대응, 그 가운데 규칙 두 가지를 지킨 것이 <b className="text-emerald-200">함수</b>입니다. 직접 이어 보며 그 차이를 찾아보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "detect"} onClick={() => setTab("detect")}>
          ① 대응과 함수 🔗
        </TabButton>
        <TabButton active={tab === "dcr"} onClick={() => setTab("dcr")}>
          ② 정의역·공역·치역 🎯
        </TabButton>
        <TabButton active={tab === "equal"} onClick={() => setTab("equal")}>
          ③ 함수의 상등 ⚖️
        </TabButton>
        <TabButton active={tab === "life"} onClick={() => setTab("life")}>
          ④ 일상 속 함수 🏪
        </TabButton>
        <TabButton active={tab === "mission"} onClick={() => setTab("mission")}>
          ⑤ 함수 만들기 🧩
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "detect" ? <DetectTab /> : null}
        {tab === "dcr" ? <DcrTab /> : null}
        {tab === "equal" ? <EqualTab /> : null}
        {tab === "life" ? <LifeTab /> : null}
        {tab === "mission" ? <MissionTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 대응과 함수
// ══════════════════════════════════════════════════════════════
function toggleEdge(edges: Edge[], a: number, b: number): Edge[] {
  const hit = edges.some(([p, q]) => p === a && q === b);
  return hit ? edges.filter(([p, q]) => !(p === a && q === b)) : [...edges, [a, b] as Edge];
}

const LAB_GOALS = [
  { id: "g1", text: "함수를 하나 만들어 보기", tone: "emerald" },
  { id: "g2", text: "조건 ① 을 어겨 보기 (짝이 없는 원소)", tone: "rose" },
  { id: "g3", text: "조건 ② 를 어겨 보기 (짝이 둘인 원소)", tone: "rose" },
];

function JudgeCard({ t, verdict, failPick, onVerdict, onFail }: { t: JudgeTask; verdict: boolean | undefined; failPick: number | undefined; onVerdict: (v: boolean) => void; onFail: (k: number) => void }) {
  const right = verdict === t.isFunc;
  const needFail = right && !t.isFunc;
  const failRight = failPick === t.fail;
  const cleared = right && (t.isFunc || failRight);
  const rng = imageIdx(t.edges).map((i) => t.ys[i]);

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <ArrowDia
        xs={t.xs}
        ys={t.ys}
        edges={t.edges}
        fname={cleared && t.isFunc ? "f" : ""}
        arrowColor={cleared ? (t.isFunc ? "rgba(52,211,153,0.9)" : "rgba(251,113,133,0.9)") : "rgba(226,232,240,0.8)"}
        hl={cleared && t.isFunc ? "range" : null}
        rangeSet={imageIdx(t.edges)}
        badX={cleared && !t.isFunc ? outDeg(t.edges, t.xs.length).map((d, i) => (d === 1 ? -1 : i)).filter((i) => i >= 0) : undefined}
      />
      <div className="space-y-2">
        <p className="text-sm font-bold text-slate-100">이 대응은 함수일까요?</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[true, false].map((v) => {
            const picked = verdict === v;
            const good = picked && v === t.isFunc;
            const badPick = picked && v !== t.isFunc;
            return (
              <button
                key={String(v)}
                type="button"
                onClick={() => onVerdict(v)}
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
                {v ? "함수이다" : "함수가 아니다"}
              </button>
            );
          })}
        </div>

        {verdict !== undefined && !right ? (
          <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
            ❌ 다시 살펴보세요. 왼쪽 원소 하나하나에서 나가는 화살표를 세어 보면 됩니다.
          </p>
        ) : null}

        {needFail ? (
          <div className="space-y-1.5">
            <p className="text-[12px] font-bold text-slate-300">어떤 조건을 어겼나요?</p>
            {FAIL_CHOICES.map((c, k) => {
              const picked = failPick === k;
              const good = picked && k === t.fail;
              const badPick = picked && k !== t.fail;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onFail(k)}
                  disabled={failRight}
                  className={
                    "w-full rounded-lg border-2 px-2.5 py-2 text-left text-[12px] font-bold transition disabled:cursor-default " +
                    (good
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : badPick
                        ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  {ABC[k]} {c}
                </button>
              );
            })}
          </div>
        ) : null}

        {cleared ? (
          <div className="space-y-1.5">
            <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {t.why}</p>
            {t.isFunc ? (
              <p className="flex flex-wrap items-center gap-1.5 rounded-lg bg-black/25 px-3 py-2 text-[12px] text-slate-300">
                치역 <SetTag items={rng} tone="bg-emerald-400/15 text-emerald-100" />
                <span className="text-slate-500">공역 가운데 화살표를 받은 것만 모았어요.</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DetectTab() {
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selX, setSelX] = useState<number | null>(null);
  const [seen, setSeen] = useState<string[]>([]);

  const [qi, setQi] = useState(0);
  const [verdict, setVerdict] = useState<Record<string, boolean>>({});
  const [failPick, setFailPick] = useState<Record<string, number>>({});

  const deg = outDeg(edges, LAB_X.length);
  const ok1 = deg.every((d) => d >= 1);
  const ok2 = deg.every((d) => d <= 1);
  const isFn = ok1 && ok2;
  const rng = imageIdx(edges);

  const noteGoals = (next: Edge[]) => {
    const d = outDeg(next, LAB_X.length);
    const hit: string[] = [];
    if (d.every((v) => v === 1)) hit.push("g1");
    if (d.some((v) => v === 0) && next.length > 0) hit.push("g2");
    if (d.some((v) => v >= 2)) hit.push("g3");
    if (hit.length) setSeen((s) => [...new Set([...s, ...hit])]);
  };

  const pickY = (b: number) => {
    if (selX === null) return;
    const next = toggleEdge(edges, selX, b);
    setEdges(next);
    setSelX(null);
    noteGoals(next);
  };

  const t = JUDGE_TASKS[qi];
  const done = JUDGE_TASKS.filter((q) => verdict[q.id] === q.isFunc && (q.isFunc || failPick[q.id] === q.fail)).map((q) => q.id);
  const cleared = verdict[t.id] === t.isFunc && (t.isFunc || failPick[t.id] === t.fail);

  return (
    <div className="space-y-4">
      {/* 자유 연결 실험실 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🔗 화살표를 직접 이어 보세요</p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          왼쪽 원소를 누른 뒤 오른쪽 원소를 누르면 화살표가 생기고, 같은 곳을 한 번 더 누르면 지워집니다.
        </p>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            <ArrowDia
              xs={LAB_X}
              ys={LAB_Y}
              edges={edges}
              fname={isFn ? "f" : ""}
              arrowColor={isFn ? "rgba(52,211,153,0.9)" : "rgba(226,232,240,0.8)"}
              hl={isFn ? "range" : null}
              rangeSet={rng}
              badX={deg.map((d, i) => (d === 1 ? -1 : i)).filter((i) => i >= 0)}
              selX={selX}
              onPickX={(i) => setSelX((s) => (s === i ? null : i))}
              onPickY={pickY}
            />
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEdges([]);
                  setSelX(null);
                }}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                ↺ 모두 지우기
              </button>
              <button
                type="button"
                onClick={() => {
                  const next: Edge[] = [
                    [0, 1],
                    [1, 1],
                    [2, 2],
                  ];
                  setEdges(next);
                  setSelX(null);
                  noteGoals(next);
                }}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                예시 하나 넣기
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
              <p className="text-[11px] font-bold text-slate-400">지금 상태</p>
              <div className="mt-1.5 space-y-1.5 text-[12px] leading-6">
                <p className={ok1 ? "text-emerald-200" : "text-rose-200"}>
                  {ok1 ? "✓" : "✗"} 조건 ① 모든 원소가 빠짐없이 대응
                  {!ok1 ? <span className="text-slate-400"> — {deg.map((d, i) => (d === 0 ? LAB_X[i] : null)).filter(Boolean).join(", ")} 이(가) 남았어요</span> : null}
                </p>
                <p className={ok2 ? "text-emerald-200" : "text-rose-200"}>
                  {ok2 ? "✓" : "✗"} 조건 ② 짝이 오직 하나
                  {!ok2 ? <span className="text-slate-400"> — {deg.map((d, i) => (d >= 2 ? LAB_X[i] : null)).filter(Boolean).join(", ")} 의 짝이 둘 이상이에요</span> : null}
                </p>
              </div>
              <p className={"mt-2 rounded-lg px-3 py-2 text-center text-[13px] font-extrabold " + (isFn ? "bg-emerald-400/15 text-emerald-100" : "bg-white/5 text-slate-300")}>
                {isFn ? "🎉 함수입니다" : "아직은 대응일 뿐이에요"}
              </p>
              {isFn ? (
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-slate-300">
                  치역 <SetTag items={rng.map((i) => LAB_Y[i])} tone="bg-emerald-400/15 text-emerald-100" />
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
              <p className="text-[11px] font-bold text-slate-400">해 볼 것 세 가지</p>
              <div className="mt-1 space-y-1 text-[12px] leading-6">
                {LAB_GOALS.map((g) => (
                  <p key={g.id} className={seen.includes(g.id) ? "text-emerald-200" : "text-slate-400"}>
                    {seen.includes(g.id) ? "✓" : "○"} {g.text}
                  </p>
                ))}
              </div>
            </div>

            <RuleCard />
          </div>
        </div>
      </div>

      {/* 판정 문제 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔎 함수일까, 아닐까?</p>
          <Chips ids={JUDGE_TASKS.map((q) => q.id)} cur={qi} done={done} onPick={setQi} />
        </div>
        <div className="mt-2">
          <JudgeCard
            t={t}
            verdict={verdict[t.id]}
            failPick={failPick[t.id]}
            onVerdict={(v) => setVerdict((s) => ({ ...s, [t.id]: v }))}
            onFail={(k) => setFailPick((s) => ({ ...s, [t.id]: k }))}
          />
        </div>
        {cleared && qi < JUDGE_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {done.length === JUDGE_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 아홉 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            판정은 언제나 <b className="text-white">왼쪽 집합에서 나가는 화살표</b>만 세면 됩니다. 오른쪽으로 화살표가 몰려도, 아무것도 받지 못한 원소가 있어도 함수인 데는 아무 문제가 없어요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 정의역·공역·치역
// ══════════════════════════════════════════════════════════════
const SLOT_KEYS = ["domain", "codomain", "range"] as const;
type SlotKey = (typeof SLOT_KEYS)[number];
const SLOT_META: Record<SlotKey, { name: string; on: string; text: string; ring: string }> = {
  domain: { name: "정의역", on: "border-amber-400/70 bg-amber-400/20 text-amber-100", text: "text-amber-200", ring: "#fbbf24" },
  codomain: { name: "공역", on: "border-sky-400/70 bg-sky-400/20 text-sky-100", text: "text-sky-200", ring: "#38bdf8" },
  range: { name: "치역", on: "border-emerald-400/70 bg-emerald-400/20 text-emerald-100", text: "text-emerald-200", ring: "#34d399" },
};

const GRID_TICKS = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];

function GraphBox({ t, hl }: { t: DcrTask; hl: SlotKey | null }) {
  const uid = useId().replace(/:/g, "");
  const segs = useMemo(() => samplePath(t), [t]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${GV.size} ${GV.size}`} className="mx-auto block w-full max-w-[280px]" role="img" aria-label="함수의 그래프">
        <defs>
          <clipPath id={`cp-${uid}`}>
            <rect x={GV.pad - 1} y={GV.pad - 1} width={GV.size - 2 * GV.pad + 2} height={GV.size - 2 * GV.pad + 2} />
          </clipPath>
        </defs>

        <rect x={GV.pad} y={GV.pad} width={GV.size - 2 * GV.pad} height={GV.size - 2 * GV.pad} fill="rgba(255,255,255,0.02)" />
        {GRID_TICKS.map((v) => (
          <g key={`g${v}`}>
            <line x1={gvX(v)} y1={GV.pad} x2={gvX(v)} y2={GV.size - GV.pad} stroke="rgba(226,232,240,0.07)" strokeWidth={1} />
            <line x1={GV.pad} y1={gvY(v)} x2={GV.size - GV.pad} y2={gvY(v)} stroke="rgba(226,232,240,0.07)" strokeWidth={1} />
          </g>
        ))}

        {/* 공역 — y축 전체 */}
        {hl === "codomain" ? (
          <line x1={gvX(0)} y1={GV.pad} x2={gvX(0)} y2={GV.size - GV.pad} stroke="#38bdf8" strokeWidth={7} strokeLinecap="round" opacity={0.5} />
        ) : null}
        {/* 정의역 — x축 위의 구간 */}
        {hl === "domain"
          ? t.domainSegs.map(([a, b], k) => (
              <line key={`ds${k}`} x1={gvX(a)} y1={gvY(0)} x2={gvX(b)} y2={gvY(0)} stroke="#fbbf24" strokeWidth={7} strokeLinecap="round" opacity={0.6} />
            ))
          : null}
        {/* 치역 — y축 위의 구간 */}
        {hl === "range"
          ? t.rangeSegs.map(([a, b], k) =>
              a === b ? (
                <circle key={`rs${k}`} cx={gvX(0)} cy={gvY(a)} r={5} fill="#34d399" />
              ) : (
                <line key={`rs${k}`} x1={gvX(0)} y1={gvY(a)} x2={gvX(0)} y2={gvY(b)} stroke="#34d399" strokeWidth={7} strokeLinecap="round" opacity={0.75} />
              ),
            )
          : null}

        {/* 좌표축 */}
        <line x1={GV.pad} y1={gvY(0)} x2={GV.size - GV.pad} y2={gvY(0)} stroke="rgba(226,232,240,0.5)" strokeWidth={1.6} />
        <line x1={gvX(0)} y1={GV.pad} x2={gvX(0)} y2={GV.size - GV.pad} stroke="rgba(226,232,240,0.5)" strokeWidth={1.6} />

        {/* 그래프 (선만 잘라 낸다) */}
        <g clipPath={`url(#cp-${uid})`}>
          {segs.map((d, k) => (
            <path key={`p${k}`} d={d} fill="none" stroke="#a78bfa" strokeWidth={2.6} strokeLinecap="round" />
          ))}
        </g>

        {/* 속 빈 점·라벨은 잘라 내기 밖에 그린다 */}
        {hl === "range"
          ? t.rangeOpen.map((v) => <circle key={`ro${v}`} cx={gvX(0)} cy={gvY(v)} r={4.5} fill="#0f172a" stroke="#34d399" strokeWidth={2} />)
          : null}
        {hl === "domain"
          ? t.domainOpen.map((v) => <circle key={`do${v}`} cx={gvX(v)} cy={gvY(0)} r={4.5} fill="#0f172a" stroke="#fbbf24" strokeWidth={2} />)
          : null}
        <text x={GV.size - GV.pad + 1} y={gvY(0) - 6} textAnchor="end" className="fill-slate-500 text-[10px] font-bold italic">
          x
        </text>
        <text x={gvX(0) + 7} y={GV.pad + 9} className="fill-slate-500 text-[10px] font-bold italic">
          y
        </text>
        {hl ? (
          <text x={GV.size / 2} y={GV.size - 3} textAnchor="middle" style={{ fill: SLOT_META[hl].ring }} className="text-[11px] font-bold">
            {SLOT_META[hl].name}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

function DcrTab() {
  const [chip, setChip] = useState(0);
  const [look, setLook] = useState<SlotKey | null>(null);

  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const c = RULE_CHIPS[chip];
  const ruleEdges: Edge[] = [];
  RULE_X.forEach((x, i) => {
    for (const y of c.map(x)) {
      const j = RULE_Y.indexOf(y);
      if (j >= 0) ruleEdges.push([i, j]);
    }
  });
  const ruleRange = imageIdx(ruleEdges);
  const ruleIsFn = isFunction(ruleEdges, RULE_X.length);

  const t = DCR_TASKS[qi];
  const key = (k: SlotKey) => `${t.id}:${k}`;
  const slotOf = (k: SlotKey) => (k === "domain" ? t.domain : k === "codomain" ? t.codomain : t.range);
  const solved = (k: SlotKey) => pick[key(k)] === slotOf(k).answer;
  const stage: SlotKey | null = !solved("domain") ? "domain" : !solved("codomain") ? "codomain" : !solved("range") ? "range" : null;
  const cleared = stage === null;
  const doneIds = DCR_TASKS.filter((q) =>
    SLOT_KEYS.every((k) => pick[`${q.id}:${k}`] === (k === "domain" ? q.domain : k === "codomain" ? q.codomain : q.range).answer),
  ).map((q) => q.id);
  const cur = stage ? slotOf(stage) : null;

  return (
    <div className="space-y-4">
      {/* 그림으로 보는 세 영역 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🎯 규칙을 바꾸면 치역이 달라져요</p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          정의역과 공역은 그대로 둔 채 대응 규칙만 바꿔 보세요. 어디가 정의역·공역·치역인지 단추로 확인할 수 있어요.
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {RULE_CHIPS.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setChip(i)}
              className={
                "rounded-lg border-2 px-2.5 py-1.5 text-[13px] font-bold transition " +
                (i === chip ? "border-violet-400/70 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              <PieceLine ps={r.label} />
            </button>
          ))}
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ArrowDia
            xs={RULE_X.map(String)}
            ys={RULE_Y.map(String)}
            edges={ruleEdges}
            fname={ruleIsFn ? "f" : ""}
            arrowColor={ruleIsFn ? "rgba(167,139,250,0.85)" : "rgba(251,113,133,0.85)"}
            hl={look}
            rangeSet={ruleRange}
            badX={ruleIsFn ? undefined : outDeg(ruleEdges, RULE_X.length).map((d, i) => (d === 1 ? -1 : i)).filter((i) => i >= 0)}
            fontPx={13}
          />
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              {SLOT_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setLook((s) => (s === k ? null : k))}
                  disabled={k === "range" && !ruleIsFn}
                  className={
                    "rounded-xl border-2 px-2 py-2 text-[12px] font-bold transition disabled:opacity-35 " +
                    (look === k ? SLOT_META[k].on : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  {SLOT_META[k].name}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-[12px] leading-7 text-slate-300">
              <p className="flex flex-wrap items-center gap-1.5">
                <span className="text-amber-200">정의역</span> <SetTag items={RULE_X.map(String)} tone="bg-amber-400/15 text-amber-100" />
              </p>
              <p className="flex flex-wrap items-center gap-1.5">
                <span className="text-sky-200">공역</span> <SetTag items={RULE_Y.map(String)} tone="bg-sky-400/15 text-sky-100" />
              </p>
              <p className="flex flex-wrap items-center gap-1.5">
                <span className="text-emerald-200">치역</span>{" "}
                {ruleIsFn ? (
                  <SetTag items={ruleRange.map((i) => String(RULE_Y[i]))} tone="bg-emerald-400/15 text-emerald-100" />
                ) : (
                  <span className="rounded-lg bg-rose-400/15 px-2 py-1 text-[12px] font-bold text-rose-100">함수가 아니라 말할 수 없음</span>
                )}
              </p>
            </div>

            <p className={"rounded-lg px-3 py-2 text-[12px] leading-6 " + (ruleIsFn ? "bg-violet-400/12 text-violet-100" : "bg-rose-400/10 text-rose-100")}>
              {ruleIsFn ? "🔍" : "⚠️"} {c.note}
            </p>
            {ruleIsFn ? (
              <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-400">
                공역 8개 가운데 {ruleRange.length}개만 화살표를 받았어요. 언제나 <Katex expr="(\text{range}) \subset (\text{codomain})" /> 이 성립합니다.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* 구하기 문제 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">📐 세 가지를 구해 보기</p>
          <Chips ids={DCR_TASKS.map((q) => q.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>

        <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center">
          <p className="overflow-x-auto overflow-y-hidden py-1 text-lg font-bold leading-8 text-slate-100">
            <Katex expr={t.titleTex} />
          </p>
          {t.extra ? <p className="mt-1 text-[12px] text-slate-400">{t.extra}</p> : null}
          {!t.extra ? <p className="mt-1 text-[12px] text-slate-500">정의역과 공역을 따로 밝히지 않았습니다.</p> : null}
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <GraphBox t={t} hl={stage} />

          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              {SLOT_KEYS.map((k) => (
                <div
                  key={k}
                  className={
                    "rounded-lg border px-2 py-1.5 text-center text-[11px] font-bold transition " +
                    (solved(k)
                      ? "border-emerald-400/45 bg-emerald-400/12 text-emerald-100"
                      : stage === k
                        ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
                        : "border-white/10 bg-white/5 text-slate-500")
                  }
                >
                  {solved(k) ? "✓ " : ""}
                  {SLOT_META[k].name}
                </div>
              ))}
            </div>

            {cur && stage ? (
              <>
                <p className="text-[13px] font-bold text-slate-100">
                  <span className={SLOT_META[stage].text}>{SLOT_META[stage].name}</span> 은 무엇일까요?
                </p>
                <div className="grid gap-1.5">
                  {cur.choices.map((ch, k) => {
                    const picked = pick[key(stage)];
                    const good = picked === k && k === cur.answer;
                    const badPick = picked === k && k !== cur.answer;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setPick((s) => ({ ...s, [key(stage)]: k }))}
                        className={
                          "rounded-xl border-2 px-2.5 py-2 text-left text-[13px] font-bold transition " +
                          (good
                            ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                            : badPick
                              ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                              : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                        }
                      >
                        <span className="mr-1 text-slate-400">{ABC[k]}</span>
                        <PieceLine ps={ch} />
                      </button>
                    );
                  })}
                </div>
                {pick[key(stage)] !== undefined && pick[key(stage)] !== cur.answer ? (
                  <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {cur.choiceWhy[pick[key(stage)]]}</p>
                ) : null}
              </>
            ) : (
              <div className="space-y-1.5">
                <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-center text-[13px] font-extrabold text-emerald-100">🎉 세 가지를 모두 찾았어요!</p>
                <div className="space-y-1 rounded-lg bg-black/25 px-3 py-2.5 text-[12px] leading-7 text-slate-300">
                  {SLOT_KEYS.map((k) => (
                    <p key={k} className="flex flex-wrap items-baseline gap-1.5">
                      <span className={SLOT_META[k].text + " font-bold"}>{SLOT_META[k].name}</span>
                      <PieceLine ps={slotOf(k).choices[slotOf(k).answer]} />
                    </p>
                  ))}
                </div>
                {qi < DCR_TASKS.length - 1 ? <NextBtn onClick={() => setQi((k) => k + 1)} /> : null}
              </div>
            )}
          </div>
        </div>
        {!cleared ? (
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
            🎨 지금 묻는 자리가 그래프에 색으로 나타납니다. 정의역은 <span className="text-amber-200">x축</span>, 치역은 <span className="text-emerald-200">y축</span> 에서 찾아보세요.
          </p>
        ) : null}
      </div>

      {doneIds.length === DCR_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <b className="text-white">정의역</b>은 넣을 수 있는 x 를 모은 것, <b className="text-white">공역</b>은 밝히지 않으면 늘 실수 전체, <b className="text-white">치역</b>은 실제로 나오는 y 를 모은 것. 셋 가운데 손이 많이 가는 것은 늘 치역입니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 함수의 상등
// ══════════════════════════════════════════════════════════════
function FnCard({ spec, tone }: { spec: EqualPair["f"]; tone: string }) {
  return (
    <div className={"rounded-xl border-2 px-3 py-2.5 " + tone}>
      <p className="text-[11px] font-bold text-slate-400">
        함수 <span className="font-mono text-[13px] text-slate-100">{spec.name}</span>
      </p>
      <div className="mt-1 space-y-1 text-[12px] leading-7">
        <p className="flex flex-wrap items-baseline gap-1.5">
          <span className="w-14 shrink-0 font-bold text-amber-200">정의역</span>
          <span className="min-w-0 py-0.5 text-slate-100">
            <Katex expr={spec.domainTex} />
          </span>
        </p>
        <p className="flex flex-wrap items-baseline gap-1.5">
          <span className="w-14 shrink-0 font-bold text-sky-200">공역</span>
          <span className="min-w-0 py-0.5 text-slate-100">
            {spec.codoTex ? <Katex expr={spec.codoTex} /> : "실수 전체의 집합"}
          </span>
        </p>
        <p className="flex flex-wrap items-baseline gap-1.5">
          <span className="w-14 shrink-0 font-bold text-violet-200">대응</span>
          <span className="min-w-0 py-0.5 text-slate-100">
            <Katex expr={spec.ruleTex} />
          </span>
        </p>
      </div>
    </div>
  );
}

function ValueTable({ p }: { p: EqualPair }) {
  const all = [...new Set([...p.f.domain, ...p.g.domain])].sort((a, b) => a - b);
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2));
  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-white/10 bg-black/25 py-1">
      <table className="w-full min-w-[240px] text-center font-mono text-[12px]">
        <thead>
          <tr className="text-slate-400">
            <th className="px-2 py-1 font-bold">x</th>
            {all.map((x) => (
              <th key={x} className="px-2 py-1 font-bold text-slate-200">
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[p.f, p.g].map((s) => (
            <tr key={s.name} className="border-t border-white/10">
              <td className="px-2 py-1 font-bold text-slate-400">{s.name}(x)</td>
              {all.map((x) => (
                <td key={x} className={"px-2 py-1 " + (s.domain.includes(x) ? "text-slate-100" : "text-slate-600")}>
                  {s.domain.includes(x) ? fmt(s.fn(x)) : "—"}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-white/10">
            <td className="px-2 py-1 font-bold text-slate-400">견주기</td>
            {all.map((x) => {
              const both = p.f.domain.includes(x) && p.g.domain.includes(x);
              const same = both && Math.abs(p.f.fn(x) - p.g.fn(x)) < 1e-12;
              return (
                <td key={x} className={"px-2 py-1 " + (!both ? "text-slate-600" : same ? "text-emerald-300" : "text-rose-300")}>
                  {!both ? "—" : same ? "=" : "≠"}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function AbChallenge() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const uid = useId().replace(/:/g, "");

  const hit = AB.domain.every((x) => AB.f(x, a, b) === AB.g(x));
  const path = useMemo(() => {
    const pts: string[] = [];
    const N = 240;
    for (let i = 0; i <= N; i++) {
      const x = AB.view.xmin + ((AB.view.xmax - AB.view.xmin) * i) / N;
      const y = AB.f(x, a, b);
      const cy = Math.max(AB.view.ymin - 1, Math.min(AB.view.ymax + 1, y));
      pts.push(`${abX(x).toFixed(2)},${abY(cy).toFixed(2)}`);
    }
    return "M" + pts.join(" L");
  }, [a, b]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-slate-100">🎚️ a, b 를 맞춰 두 함수를 같게 만들기</p>
      <p className="text-[12px] leading-6 text-slate-400">
        정의역이 <Katex expr="\{2,\ 3\}" /> 인 두 함수 <Katex expr={AB.fTex} /> 와 <Katex expr={AB.gTex} /> 가 같아지도록 슬라이더를 움직여 보세요.
      </p>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
          <svg viewBox={`0 0 ${AB.view.size} ${AB.view.size}`} className="mx-auto block w-full max-w-[280px]" role="img" aria-label="두 함수의 그래프와 맞춰야 할 두 점">
            <defs>
              <clipPath id={`abc-${uid}`}>
                <rect x={AB.view.pad - 1} y={AB.view.pad - 1} width={AB.view.size - 2 * AB.view.pad + 2} height={AB.view.size - 2 * AB.view.pad + 2} />
              </clipPath>
            </defs>
            <rect x={AB.view.pad} y={AB.view.pad} width={AB.view.size - 2 * AB.view.pad} height={AB.view.size - 2 * AB.view.pad} fill="rgba(255,255,255,0.02)" />
            {[0, 1, 2, 3, 4, 5].map((v) => (
              <line key={`vx${v}`} x1={abX(v)} y1={AB.view.pad} x2={abX(v)} y2={AB.view.size - AB.view.pad} stroke="rgba(226,232,240,0.07)" strokeWidth={1} />
            ))}
            {[-4, -2, 0, 2, 4, 6, 8, 10, 12].map((v) => (
              <line key={`vy${v}`} x1={AB.view.pad} y1={abY(v)} x2={AB.view.size - AB.view.pad} y2={abY(v)} stroke="rgba(226,232,240,0.07)" strokeWidth={1} />
            ))}

            <g clipPath={`url(#abc-${uid})`}>
              <line x1={abX(AB.view.xmin)} y1={abY(0)} x2={abX(AB.view.xmax)} y2={abY(0)} stroke="rgba(226,232,240,0.5)" strokeWidth={1.6} />
              <line x1={abX(0)} y1={abY(AB.view.ymin)} x2={abX(0)} y2={abY(AB.view.ymax)} stroke="rgba(226,232,240,0.5)" strokeWidth={1.6} />
              {AB.domain.map((x) => (
                <line key={`gl${x}`} x1={abX(x)} y1={abY(AB.view.ymin)} x2={abX(x)} y2={abY(AB.view.ymax)} stroke="rgba(226,232,240,0.18)" strokeWidth={1.2} strokeDasharray="4 4" />
              ))}
              <line
                x1={abX(AB.view.xmin)}
                y1={abY(AB.g(AB.view.xmin))}
                x2={abX(AB.view.xmax)}
                y2={abY(AB.g(AB.view.xmax))}
                stroke="#38bdf8"
                strokeWidth={2.4}
              />
              <path d={path} fill="none" stroke={hit ? "#34d399" : "#a78bfa"} strokeWidth={2.6} strokeLinecap="round" />
            </g>

            {/* 맞춰야 할 두 점과 이름표는 잘라 내기 밖에 그린다 */}
            {AB.domain.map((x) => (
              <circle key={`tg${x}`} cx={abX(x)} cy={abY(AB.g(x))} r={7} fill="none" stroke="#fbbf24" strokeWidth={2.5} />
            ))}
            {AB.domain.map((x) => {
              const y = AB.f(x, a, b);
              if (y < AB.view.ymin || y > AB.view.ymax) return null;
              return <circle key={`cf${x}`} cx={abX(x)} cy={abY(y)} r={4.5} fill={hit ? "#34d399" : "#a78bfa"} />;
            })}
            <text x={abX(AB.view.xmax) - 2} y={abY(AB.g(AB.view.xmax)) - 7} textAnchor="end" className="fill-sky-300 text-[11px] font-bold italic">
              g
            </text>
            <text x={abX(AB.view.xmin) + 4} y={AB.view.pad + 11} className={"text-[11px] font-bold italic " + (hit ? "fill-emerald-300" : "fill-violet-300")}>
              f
            </text>
          </svg>
        </div>

        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Slider label={<Katex expr="a" />} value={a} min={AB.aMin} max={AB.aMax} step={1} onChange={setA} accent="accent-violet-400" />
            <Slider label={<Katex expr="b" />} value={b} min={AB.bMin} max={AB.bMax} step={1} onChange={setB} accent="accent-violet-400" />
          </div>

          <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-white/10 bg-black/25 py-1">
            <table className="w-full min-w-[200px] text-center font-mono text-[12px]">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-2 py-1 font-bold">x</th>
                  {AB.domain.map((x) => (
                    <th key={x} className="px-2 py-1 font-bold text-slate-200">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/10">
                  <td className="px-2 py-1 font-bold text-violet-300">f(x)</td>
                  {AB.domain.map((x) => (
                    <td key={x} className="px-2 py-1 text-slate-100">
                      {AB.f(x, a, b)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-2 py-1 font-bold text-sky-300">g(x)</td>
                  {AB.domain.map((x) => (
                    <td key={x} className="px-2 py-1 text-slate-100">
                      {AB.g(x)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-2 py-1 font-bold text-slate-400">견주기</td>
                  {AB.domain.map((x) => (
                    <td key={x} className={"px-2 py-1 " + (AB.f(x, a, b) === AB.g(x) ? "text-emerald-300" : "text-rose-300")}>
                      {AB.f(x, a, b) === AB.g(x) ? "=" : "≠"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {hit ? (
            <div className="space-y-1.5">
              <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-center text-[13px] font-extrabold text-emerald-100">🎉 두 함수가 같아졌어요!</p>
              <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-7 text-slate-300">
                포물선과 직선이 <Katex expr="x=2" /> 와 <Katex expr="x=3" /> 에서 만나면 됩니다. 곧 <Katex expr="f(x)-g(x)=(x-2)(x-3)" /> 이어야 하므로{" "}
                <Katex expr="x^2+(a-1)x+(b-1)=x^2-5x+6" /> 에서 <Katex expr="a=-4,\ b=7" /> 로 답이 하나뿐이에요. 정의역 밖에서는 두 그래프가 갈라져도 괜찮습니다.
              </p>
            </div>
          ) : (
            <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">
              💡 노란 고리 두 개가 맞춰야 할 자리예요. <Katex expr="x=2" /> 부터 맞춘 뒤 <Katex expr="x=3" /> 을 맞춰 보세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EqualTab() {
  const [pi, setPi] = useState(0);
  const [judge, setJudge] = useState<Record<string, boolean>>({});
  const [openTbl, setOpenTbl] = useState<Record<string, boolean>>({});

  const p = EQUAL_PAIRS[pi];
  const truth = (k: "domain" | "codo" | "rule") => (k === "domain" ? p.sameDomain : k === "codo" ? p.sameCodo : p.sameRule);
  const kk = (k: string) => `${p.id}:${k}`;
  const rowOk = (k: "domain" | "codo" | "rule") => judge[kk(k)] === truth(k);
  const cleared = EQ_ROWS.every((r) => rowOk(r.key));

  const doneIds = EQUAL_PAIRS.filter((q) =>
    EQ_ROWS.every((r) => judge[`${q.id}:${r.key}`] === (r.key === "domain" ? q.sameDomain : r.key === "codo" ? q.sameCodo : q.sameRule)),
  ).map((q) => q.id);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">⚖️ 두 함수는 같을까요?</p>
          <Chips ids={EQUAL_PAIRS.map((q) => q.id)} cur={pi} done={doneIds} onPick={setPi} />
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <FnCard spec={p.f} tone="border-violet-400/35 bg-violet-400/8" />
          <FnCard spec={p.g} tone="border-sky-400/35 bg-sky-400/8" />
        </div>

        <div className="mt-2 space-y-1.5">
          {EQ_ROWS.map((r) => {
            const picked = judge[kk(r.key)];
            const ok = rowOk(r.key);
            return (
              <div key={r.key} className={"rounded-xl border-2 px-3 py-2 transition " + (ok ? "border-emerald-400/45 bg-emerald-400/10" : picked !== undefined ? "border-rose-400/45 bg-rose-400/10" : "border-white/10 bg-black/25")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] font-bold text-slate-200">
                    <span className="mr-1.5 text-slate-400">{r.name}</span>
                    {r.ask}
                  </p>
                  <div className="flex gap-1.5">
                    {[true, false].map((v) => {
                      const sel = picked === v;
                      const good = sel && v === truth(r.key);
                      const badPick = sel && v !== truth(r.key);
                      return (
                        <button
                          key={String(v)}
                          type="button"
                          onClick={() => setJudge((s) => ({ ...s, [kk(r.key)]: v }))}
                          disabled={ok}
                          className={
                            "rounded-lg border-2 px-3 py-1.5 text-[12px] font-bold transition disabled:cursor-default " +
                            (good
                              ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                              : badPick
                                ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                                : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                          }
                        >
                          {v ? "같다" : "다르다"}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {r.key === "rule" ? (
                  <div className="mt-1.5">
                    {openTbl[p.id] ? (
                      <ValueTable p={p} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenTbl((s) => ({ ...s, [p.id]: true }))}
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                      >
                        🔢 함숫값 표 펴 보기
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {cleared ? (
          <div className="mt-2 space-y-1.5">
            <p className={"rounded-xl px-3 py-2.5 text-center text-lg font-extrabold " + (p.equal ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-400/15 text-rose-100")}>
              <Katex expr={p.equal ? "f = g" : "f \\ne g"} />
            </p>
            <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">✅ {p.why}</p>
            {pi < EQUAL_PAIRS.length - 1 ? <NextBtn onClick={() => setPi((k) => k + 1)} label="다음 짝 ▶" /> : null}
          </div>
        ) : (
          <p className="mt-2 rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">
            💡 세 줄을 모두 판정하면 결론이 나옵니다. 셋 가운데 <b>하나라도 다르면</b> 두 함수는 다른 함수예요.
          </p>
        )}
      </div>

      <div className="rounded-2xl border-2 border-white/10 bg-slate-900/40 p-3">
        <AbChallenge />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 일상 속 함수
// ══════════════════════════════════════════════════════════════
function LifeCard({ c, verdict, failPick, onVerdict, onFail }: { c: LifeCase; verdict: boolean | undefined; failPick: number | undefined; onVerdict: (v: boolean) => void; onFail: (k: number) => void }) {
  const right = verdict === c.isFunc;
  const needFail = right && !c.isFunc;
  const failRight = failPick === c.fail;
  const cleared = right && (c.isFunc || failRight);

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
          fname={cleared && c.isFunc ? "f" : ""}
          arrowColor={cleared ? (c.isFunc ? "rgba(52,211,153,0.9)" : "rgba(251,113,133,0.9)") : "rgba(226,232,240,0.8)"}
          badX={cleared && !c.isFunc ? outDeg(c.edges, c.xs.length).map((d, i) => (d === 1 ? -1 : i)).filter((i) => i >= 0) : undefined}
          fontPx={12}
        />

        <div className="space-y-2">
          <p className="text-sm font-bold text-slate-100">이 짝짓기는 함수일까요?</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[true, false].map((v) => {
              const picked = verdict === v;
              const good = picked && v === c.isFunc;
              const badPick = picked && v !== c.isFunc;
              return (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => onVerdict(v)}
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
                  {v ? "함수이다" : "함수가 아니다"}
                </button>
              );
            })}
          </div>

          {verdict !== undefined && !right ? (
            <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
              ❌ 다시 생각해 보세요. 왼쪽 것 하나하나가 짝을 &ldquo;빠짐없이, 하나씩&rdquo; 갖는지 따져 보면 됩니다.
            </p>
          ) : null}

          {needFail ? (
            <div className="space-y-1.5">
              <p className="text-[12px] font-bold text-slate-300">어떤 조건을 어겼나요?</p>
              {FAIL_CHOICES.map((f, k) => {
                const picked = failPick === k;
                const good = picked && k === c.fail;
                const badPick = picked && k !== c.fail;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => onFail(k)}
                    disabled={failRight}
                    className={
                      "w-full rounded-lg border-2 px-2.5 py-2 text-left text-[12px] font-bold transition disabled:cursor-default " +
                      (good
                        ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                        : badPick
                          ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    {ABC[k]} {f}
                  </button>
                );
              })}
            </div>
          ) : null}

          {cleared ? <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {c.why}</p> : null}
        </div>
      </div>
    </div>
  );
}

function LifeTab() {
  const [ci, setCi] = useState(0);
  const [verdict, setVerdict] = useState<Record<string, boolean>>({});
  const [failPick, setFailPick] = useState<Record<string, number>>({});

  const c = LIFE_CASES[ci];
  const done = LIFE_CASES.filter((q) => verdict[q.id] === q.isFunc && (q.isFunc || failPick[q.id] === q.fail)).map((q) => q.id);
  const cleared = verdict[c.id] === c.isFunc && (c.isFunc || failPick[c.id] === c.fail);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🏪 둘레에서 함수 찾기</p>
          <Chips ids={LIFE_CASES.map((q) => q.id)} cur={ci} done={done} onPick={setCi} />
        </div>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          그림은 그 짝짓기를 몇 개만 뽑아 그린 것이에요. 조건 두 가지를 그대로 대어 보세요.
        </p>
        <div className="mt-2">
          <LifeCard
            c={c}
            verdict={verdict[c.id]}
            failPick={failPick[c.id]}
            onVerdict={(v) => setVerdict((s) => ({ ...s, [c.id]: v }))}
            onFail={(k) => setFailPick((s) => ({ ...s, [c.id]: k }))}
          />
        </div>
        {cleared && ci < LIFE_CASES.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setCi((k) => k + 1)} label="다음 사례 ▶" />
          </div>
        ) : null}
        <div className="mt-2">
          <RuleCard />
        </div>
      </div>

      {done.length === LIFE_CASES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 열 가지 사례를 모두 살폈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <b className="text-white">약수</b>는 여럿이라 함수가 아니지만 <b className="text-white">약수의 개수</b>는 하나라 함수였지요. 함수가 아닌 짝짓기도 <b className="text-white">묻는 것을 조금 바꾸면</b> 함수가 됩니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ⑤ 함수 만들기 챌린지
// ══════════════════════════════════════════════════════════════
function MissionBoard({ m, edges, selX, onPickX, onPickY, onClear }: { m: Mission; edges: Edge[]; selX: number | null; onPickX: (i: number) => void; onPickY: (i: number) => void; onClear: () => void }) {
  const done = m.check(edges, m.xs.length, m.ys.length);
  const fn = isFunction(edges, m.xs.length);
  const deg = outDeg(edges, m.xs.length);
  return (
    <div className="space-y-2">
      <ArrowDia
        xs={m.xs}
        ys={m.ys}
        edges={edges}
        fname={fn ? "f" : ""}
        arrowColor={done ? "rgba(52,211,153,0.9)" : "rgba(226,232,240,0.8)"}
        hl={done && fn ? "range" : null}
        rangeSet={imageIdx(edges)}
        badX={deg.map((d, i) => (d === 1 ? -1 : i)).filter((i) => i >= 0)}
        selX={selX}
        onPickX={onPickX}
        onPickY={onPickY}
      />
      <button
        type="button"
        onClick={onClear}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
      >
        ↺ 모두 지우기
      </button>
    </div>
  );
}

function MissionTab() {
  const [mi, setMi] = useState(0);
  const [boards, setBoards] = useState<Record<string, Edge[]>>({});
  const [selX, setSelX] = useState<number | null>(null);
  const [tips, setTips] = useState<string[]>([]);

  const m = MISSIONS[mi];
  const edges = boards[m.id] ?? [];
  const done = m.check(edges, m.xs.length, m.ys.length);
  const doneIds = MISSIONS.filter((q) => q.check(boards[q.id] ?? [], q.xs.length, q.ys.length)).map((q) => q.id);
  const deg = outDeg(edges, m.xs.length);
  const rng = imageIdx(edges);

  const pickY = (b: number) => {
    if (selX === null) return;
    setBoards((s) => ({ ...s, [m.id]: toggleEdge(s[m.id] ?? [], selX, b) }));
    setSelX(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧩 조건에 맞게 이어 보기</p>
          <Chips
            ids={MISSIONS.map((q) => q.id)}
            cur={mi}
            done={doneIds}
            onPick={(i) => {
              setMi(i);
              setSelX(null);
            }}
          />
        </div>

        <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center">
          <p className="text-[11px] font-bold text-slate-400">미션 {mi + 1}</p>
          <p className="mt-1 text-[15px] font-bold leading-8 text-slate-100">
            <PieceLine ps={m.goal} />
          </p>
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <MissionBoard
            m={m}
            edges={edges}
            selX={selX}
            onPickX={(i) => setSelX((s) => (s === i ? null : i))}
            onPickY={pickY}
            onClear={() => {
              setBoards((s) => ({ ...s, [m.id]: [] }));
              setSelX(null);
            }}
          />

          <div className="space-y-2">
            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-[12px] leading-7 text-slate-300">
              <p className="text-[11px] font-bold text-slate-400">지금 상태</p>
              <p className="mt-1">
                화살표 <span className="font-mono text-slate-100">{edges.length}</span> 개 · 왼쪽에서 나가는 개수{" "}
                <span className="font-mono text-slate-100">{deg.join(" / ")}</span>
              </p>
              <p className="mt-0.5">
                {isFunction(edges, m.xs.length) ? (
                  <span className="text-emerald-200">함수입니다</span>
                ) : (
                  <span className="text-slate-400">아직 함수가 아니에요</span>
                )}
                {isFunction(edges, m.xs.length) ? (
                  <span className="ml-1.5 inline-flex items-center gap-1.5">
                    치역 <SetTag items={rng.map((i) => m.ys[i])} tone="bg-emerald-400/15 text-emerald-100" />
                  </span>
                ) : null}
              </p>
            </div>

            {done ? (
              <div className="space-y-1.5">
                <p className="rounded-xl bg-emerald-400/15 px-3 py-2.5 text-center text-[13px] font-extrabold text-emerald-100">🎉 미션 성공!</p>
                <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">
                  이 조건을 만족하는 방법은 모두 <b className="text-white">{m.count}</b> 가지예요. 다른 방법으로도 한번 만들어 보세요.
                </p>
                {mi < MISSIONS.length - 1 ? (
                  <NextBtn
                    onClick={() => {
                      setMi((k) => k + 1);
                      setSelX(null);
                    }}
                    label="다음 미션 ▶"
                  />
                ) : null}
              </div>
            ) : (
              <TipBox text={m.hint} open={tips.includes(m.id)} onOpen={() => setTips((s) => [...s, m.id])} />
            )}

            <RuleCard />
          </div>
        </div>
      </div>

      {doneIds.length === MISSIONS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 일곱 미션을 모두 해냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            정의역이 <Katex expr="3" /> 개, 공역이 <Katex expr="3" /> 개일 때 만들 수 있는 함수는 <Katex expr="3^3=27" /> 가지였어요. 각 원소가 갈 곳을 저마다 고르기 때문입니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
