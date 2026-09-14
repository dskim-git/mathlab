"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  A_INIT,
  A_LIST,
  DETECT_TASKS,
  FORM_TASKS,
  K_GOALS,
  K_INIT,
  K_LIST,
  K_LIST2,
  K_QUIZ,
  LIFE_CASES,
  LIFE_PLOT,
  MISSIONS,
  MOVE_INIT,
  MOVE_QUIZ,
  NUMBERED,
  PLANE,
  PQ,
  SHAPE_CHOICES,
  SHAPE_TASKS,
  TICKS,
  VIEW,
  curveBranches,
  lifeValue,
  planeX,
  planeY,
  type DetectTask,
  type FormTask,
  type LifeCase,
  type Mission,
  type Piece,
  type Quiz,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "k_shape",
    prompt:
      "y = k/x 의 그래프에서 k 의 부호와 절댓값이 각각 무엇을 바꾸는지, 점근선과 대칭성은 어떻게 되는지 활동에서 본 대로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: k 의 부호는 곡선이 놓이는 사분면을 정한다. k > 0 이면 x 와 y 의 부호가 같아 제1·3사분면, k < 0 이면 제2·4사분면에 놓인다. |k| 는 원점에서 떨어진 정도를 정해서 |k| 가 커질수록 곡선이 바깥으로 물러난다. 점근선은 k 와 상관없이 언제나 x축과 y축이고, (a, b) 가 그래프 위에 있으면 (−a, −b) 도 있으므로 원점에 대하여 대칭이다.",
  },
  {
    id: "move_meaning",
    prompt:
      "y = k/(x−p) + q 에서 p 와 q 가 그래프를 어떻게 바꾸는지, 그리고 점근선·정의역·치역·대칭점이 p, q 와 어떻게 이어지는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: p 와 q 는 모양을 바꾸지 않고 자리만 옮긴다. y = k/x 를 x축 방향으로 p, y축 방향으로 q 만큼 평행이동한 것이다. 그래서 점근선도 함께 옮겨져 x = p 와 y = q 가 되고, 정의역은 x ≠ p, 치역은 y ≠ q 가 된다. 대칭의 중심도 원점에서 두 점근선이 만나는 점 (p, q) 로 옮겨간다. 휘어진 정도는 k 혼자 정한다.",
  },
  {
    id: "form_and_life",
    prompt:
      "y = (ax+b)/(cx+d) 의 점근선을 찾는 방법을 자기 말로 정리하고, 일상 상황에서 가로 점근선이 무엇을 뜻했는지 활동에서 본 예를 들어 써 보세요.",
    kind: "text",
    placeholder:
      "예: 세로 점근선은 분모를 0 으로 만드는 x 이고, 가로 점근선은 x 가 한없이 커질 때 다가가는 값이라 분자와 분모의 x 계수를 견주면 된다. 분자를 분모로 나누어 k/(x−p)+q 꼴로 고치면 몫이 가로 점근선의 높이가 된다. 버스 대절 문제에서 가로 점근선 y = 8000 은 사람이 아무리 많아져도 입장료 8000 원 아래로는 내려갈 수 없다는 뜻이었다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "k" | "move" | "form" | "detect" | "life";

const ABC = ["①", "②", "③", "④"];

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition " +
        (active ? "border-sky-400/60 bg-sky-400/15 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
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
              ? "border-sky-400/70 bg-sky-400/20 text-sky-100"
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

function NextBtn({ onClick, label = "다음 ▶" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border-2 border-sky-400/55 bg-sky-400/15 px-3 py-2.5 text-sm font-bold text-sky-100 transition hover:bg-sky-400/25"
    >
      {label}
    </button>
  );
}

function PieceText({ items }: { items: Piece[] }) {
  return (
    <>
      {items.map((p, i) => (
        <span key={i} className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1">
          {p.pre ? <span>{p.pre}</span> : null}
          {p.tex ? (
            <span className="min-w-0 py-0.5">
              <Katex expr={p.tex} />
            </span>
          ) : null}
          {p.post ? <span>{p.post}</span> : null}
        </span>
      ))}
    </>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">{children}</p>;
}

function Verdict({ right, why, hint }: { right: boolean; why: string; hint: string }) {
  return right ? (
    <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {why}</p>
  ) : (
    <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {hint}</p>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  accent = "accent-sky-400",
  show,
}: {
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  accent?: string;
  show?: string;
}) {
  return (
    <label className="block text-[11px] font-bold text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        {label} <span className="font-mono text-[13px] text-slate-100">{show ?? value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-0.5 w-full " + accent}
      />
    </label>
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

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex min-w-0 flex-wrap items-baseline gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-bold text-slate-200">
      <span className="text-[10px] text-slate-400">{label}</span>
      {children}
    </span>
  );
}

/** 한글과 수식이 섞인 보기 — 세로로 쌓는다 */
function MixedChoices({
  items,
  pick,
  answer,
  onPick,
}: {
  items: Piece[][];
  pick: number | undefined;
  answer: number;
  onPick: (i: number) => void;
}) {
  const right = pick === answer;
  return (
    <div className="space-y-1.5">
      {items.map((row, i) => {
        const good = pick === i && i === answer;
        const bad = pick === i && i !== answer;
        return (
          <button
            key={row.map((p) => (p.pre ?? "") + (p.tex ?? "") + (p.post ?? "")).join("")}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "flex w-full min-w-0 items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-[13px] font-bold transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : bad
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="shrink-0 text-[11px] text-slate-400">{ABC[i]}</span>
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-1">
              <PieceText items={row} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** 수식만 담긴 보기 — 두 칸씩 */
function TexChoices({
  items,
  pick,
  answer,
  onPick,
}: {
  items: string[];
  pick: number | undefined;
  answer: number;
  onPick: (i: number) => void;
}) {
  const right = pick === answer;
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map((s, i) => {
        const good = pick === i && i === answer;
        const bad = pick === i && i !== answer;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "flex min-w-0 items-center gap-1.5 rounded-xl border-2 px-2.5 py-2.5 text-[15px] transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : bad
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="text-[11px] text-slate-400">{ABC[i]}</span>
            <span className="min-w-0 py-0.5">
              <Katex expr={s} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** 한글 보기 — 세로로 쌓는다 */
function WideChoices({
  items,
  pick,
  answer,
  onPick,
}: {
  items: string[];
  pick: number | undefined;
  answer: number;
  onPick: (i: number) => void;
}) {
  const right = pick === answer;
  return (
    <div className="space-y-1.5">
      {items.map((s, i) => {
        const good = pick === i && i === answer;
        const bad = pick === i && i !== answer;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-[13px] font-bold transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : bad
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="text-[11px] text-slate-400">{ABC[i]}</span>
            {s}
          </button>
        );
      })}
    </div>
  );
}

/** Piece[][] 보기를 쓰는 퀴즈 한 장 */
function QuizCard({ q, pick, onPick }: { q: Quiz; pick: number | undefined; onPick: (i: number) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] font-bold text-slate-100">{q.prompt}</p>
      <MixedChoices items={q.choices} pick={pick} answer={q.answer} onPick={onPick} />
      {pick !== undefined ? <Verdict right={pick === q.answer} why={q.why} hint={q.choiceWhy[pick]} /> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 좌표평면
// ══════════════════════════════════════════════════════════════
type Curve = { k: number; p: number; q: number; color: string; width?: number; dash?: string };
type Dot = { x: number; y: number; color: string };

const AX = { x0: planeX(VIEW.xMin), x1: planeX(VIEW.xMax), y0: planeY(VIEW.yMax), y1: planeY(VIEW.yMin) };

function branchPath(c: Curve): string[] {
  return curveBranches(c.k, c.p, c.q).map(
    (b) => "M " + b.map((s) => `${planeX(s.x).toFixed(2)} ${planeY(s.y).toFixed(2)}`).join(" L ")
  );
}

function Plane({
  curves,
  asymP = null,
  asymQ = null,
  dots = [],
  quad = null,
  linkOrigin = false,
  showAsymLabel = true,
}: {
  curves: Curve[];
  asymP?: number | null;
  asymQ?: number | null;
  dots?: Dot[];
  quad?: "13" | "24" | null;
  linkOrigin?: boolean;
  showAsymLabel?: boolean;
}) {
  return (
    <svg viewBox={`0 0 ${PLANE.w} ${PLANE.h}`} className="mx-auto block w-full max-w-[340px]" role="img" aria-label="유리함수의 그래프">
      <rect x={0} y={0} width={PLANE.w} height={PLANE.h} fill="#020617" rx={12} />

      {quad ? (
        <g fill={quad === "13" ? "#38bdf8" : "#f472b6"} fillOpacity={0.07}>
          {quad === "13" ? (
            <>
              <rect x={planeX(0)} y={AX.y0} width={AX.x1 - planeX(0)} height={planeY(0) - AX.y0} />
              <rect x={AX.x0} y={planeY(0)} width={planeX(0) - AX.x0} height={AX.y1 - planeY(0)} />
            </>
          ) : (
            <>
              <rect x={AX.x0} y={AX.y0} width={planeX(0) - AX.x0} height={planeY(0) - AX.y0} />
              <rect x={planeX(0)} y={planeY(0)} width={AX.x1 - planeX(0)} height={AX.y1 - planeY(0)} />
            </>
          )}
        </g>
      ) : null}

      {TICKS.map((t) => (
        <g key={"g" + t}>
          <line x1={planeX(t)} y1={AX.y0} x2={planeX(t)} y2={AX.y1} stroke="#1e293b" strokeWidth={1} />
          <line x1={AX.x0} y1={planeY(t)} x2={AX.x1} y2={planeY(t)} stroke="#1e293b" strokeWidth={1} />
        </g>
      ))}

      <line x1={AX.x0} y1={planeY(0)} x2={AX.x1} y2={planeY(0)} stroke="#64748b" strokeWidth={1.6} />
      <line x1={planeX(0)} y1={AX.y0} x2={planeX(0)} y2={AX.y1} stroke="#64748b" strokeWidth={1.6} />
      {NUMBERED.map((t) => (
        <g key={"n" + t}>
          <text x={planeX(t)} y={planeY(0) + 13} fontSize={9.5} textAnchor="middle" fill="#64748b" fontFamily="ui-monospace, monospace">
            {t}
          </text>
          <text x={planeX(0) - 5} y={planeY(t) + 3.5} fontSize={9.5} textAnchor="end" fill="#64748b" fontFamily="ui-monospace, monospace">
            {t}
          </text>
        </g>
      ))}
      <text x={planeX(0) - 5} y={planeY(0) + 13} fontSize={9.5} textAnchor="end" fill="#64748b">
        O
      </text>

      {asymP !== null ? (
        <g>
          <line x1={planeX(asymP)} y1={AX.y0} x2={planeX(asymP)} y2={AX.y1} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="6 4" />
          {showAsymLabel ? (
            <text x={planeX(asymP) + 5} y={AX.y0 + 11} fontSize={11} fontWeight={700} fill="#fcd34d">
              x = {asymP}
            </text>
          ) : null}
        </g>
      ) : null}
      {asymQ !== null ? (
        <g>
          <line x1={AX.x0} y1={planeY(asymQ)} x2={AX.x1} y2={planeY(asymQ)} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="6 4" />
          {showAsymLabel ? (
            <text x={AX.x1 - 4} y={planeY(asymQ) - 6} fontSize={11} fontWeight={700} textAnchor="end" fill="#fcd34d">
              y = {asymQ}
            </text>
          ) : null}
        </g>
      ) : null}

      {curves.map((c, ci) =>
        branchPath(c).map((d, i) => (
          <path
            key={ci + "-" + i}
            d={d}
            fill="none"
            stroke={c.color}
            strokeWidth={c.width ?? 2.4}
            strokeDasharray={c.dash}
            strokeLinecap="round"
          />
        ))
      )}

      {linkOrigin && dots.length === 2 ? (
        <line
          x1={planeX(dots[0].x)}
          y1={planeY(dots[0].y)}
          x2={planeX(dots[1].x)}
          y2={planeY(dots[1].y)}
          stroke="#94a3b8"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      ) : null}
      {dots.map((d, i) => (
        <circle key={i} cx={planeX(d.x)} cy={planeY(d.y)} r={4.6} fill={d.color} stroke="#020617" strokeWidth={1.2} />
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function RationalGraphLab() {
  const [tab, setTab] = useState<Tab>("k");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-sky-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">📉 유리함수의 그래프</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-amber-200">점근선</b>은 곡선이 한없이 다가가지만 끝내 만나지 못하는 직선입니다. 슬라이더를 움직여 곡선이 어떻게 자리를 잡는지 직접 살펴보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "k"} onClick={() => setTab("k")}>
          ① k/x 실험실 🔬
        </TabButton>
        <TabButton active={tab === "move"} onClick={() => setTab("move")}>
          ② 평행이동 미션 🎯
        </TabButton>
        <TabButton active={tab === "form"} onClick={() => setTab("form")}>
          ③ 변신 공장 🏭
        </TabButton>
        <TabButton active={tab === "detect"} onClick={() => setTab("detect")}>
          ④ 그래프 탐정 🔍
        </TabButton>
        <TabButton active={tab === "life"} onClick={() => setTab("life")}>
          ⑤ 일상생활 속 점근선 🚌
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "k" ? <KTab /> : null}
        {tab === "move" ? <MoveTab /> : null}
        {tab === "form" ? <FormTab /> : null}
        {tab === "detect" ? <DetectTab /> : null}
        {tab === "life" ? <LifeTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① y = k/x 실험실
// ══════════════════════════════════════════════════════════════
function KTab() {
  const [ki, setKi] = useState(K_INIT);
  const [ai, setAi] = useState(A_INIT);
  const [sym, setSym] = useState(false);
  const [base, setBase] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const k = K_LIST[ki];
  const a = A_LIST[ai];
  const color = k > 0 ? "#38bdf8" : "#f472b6";

  const mark = (i: number) => setSeen((s) => (s.includes(String(i)) ? s : [...s, String(i)]));
  const onK = (v: number) => {
    setKi(v);
    const nk = K_LIST[v];
    if (nk > 0) mark(0);
    if (nk < 0) mark(1);
    if (Math.abs(nk) >= 3) mark(2);
  };

  const curves: Curve[] = [{ k, p: 0, q: 0, color }];
  if (base && k !== 1) curves.unshift({ k: 1, p: 0, q: 0, color: "#64748b", width: 1.6, dash: "5 4" });
  const dots: Dot[] = sym
    ? [
        { x: a, y: k / a, color: "#a3e635" },
        { x: -a, y: -k / a, color: "#a3e635" },
      ]
    : [];

  const q = K_QUIZ[qi];
  const doneIds = K_QUIZ.filter((v) => pick[v.id] === v.answer).map((v) => v.id);
  const cleared = pick[q.id] === q.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🔬 k 를 움직여 보기</p>
        <TipBox>
          📖 <Katex expr="y=\dfrac{k}{x}" /> 에서 <Katex expr="k" /> 하나가 그래프의 모든 것을 정합니다. 부호는 놓이는 사분면을, 절댓값은 원점에서 떨어진 정도를 바꿔요.
        </TipBox>

        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <Plane curves={curves} dots={dots} quad={k > 0 ? "13" : "24"} linkOrigin={sym} showAsymLabel={false} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Slider
              label={<Katex expr="k=" />}
              value={ki}
              min={0}
              max={K_LIST.length - 1}
              step={1}
              onChange={onK}
              accent={k > 0 ? "accent-sky-400" : "accent-pink-400"}
              show={String(k)}
            />
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-bold text-slate-200">
                {k > 0 ? "제1·3사분면" : "제2·4사분면"}
              </span>
              <Info label="점근선">
                <span>x축과 y축</span>
              </Info>
              <Info label="대칭">
                <span>원점</span>
              </Info>
              <Info label="언제나">
                <Katex expr={`xy=${k}`} />
              </Info>
            </div>
            <button
              type="button"
              onClick={() => setBase((v) => !v)}
              className={
                "w-full rounded-xl border-2 px-3 py-2 text-[12px] font-bold transition " +
                (base ? "border-slate-400/60 bg-white/10 text-slate-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {base ? "✓ " : ""}
              기준 곡선 y = 1/x 겹쳐 보기
            </button>
            <button
              type="button"
              onClick={() => setSym((v) => !v)}
              className={
                "w-full rounded-xl border-2 px-3 py-2 text-[12px] font-bold transition " +
                (sym ? "border-lime-400/60 bg-lime-400/15 text-lime-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {sym ? "✓ " : ""}
              원점대칭 확인하기
            </button>
            {sym ? (
              <div className="space-y-1.5 rounded-xl border border-lime-400/25 bg-lime-400/10 px-2.5 py-2">
                <Slider
                  label={<Katex expr="a=" />}
                  value={ai}
                  min={0}
                  max={A_LIST.length - 1}
                  step={1}
                  onChange={setAi}
                  accent="accent-lime-400"
                  show={String(a)}
                />
                <p className="flex flex-wrap items-baseline gap-x-1 text-[11px] leading-6 text-lime-100">
                  <Katex expr={`\\left(${a},\\ ${(k / a).toFixed(2)}\\right)`} />
                  <span>와</span>
                  <Katex expr={`\\left(${-a},\\ ${(-k / a).toFixed(2)}\\right)`} />
                  <span>가 원점을 사이에 두고 마주 봅니다.</span>
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-2">
          <GoalList goals={K_GOALS} seen={seen} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✏️ 확인 문제</p>
          <Chips ids={K_QUIZ.map((v) => v.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <QuizCard q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < K_QUIZ.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((v) => v + 1)} label="다음 문제 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === K_QUIZ.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <Katex expr="y=\dfrac{k}{x}" /> 는 <b className="text-white">언제나 x축과 y축이 점근선</b>이고 <b className="text-white">원점에 대하여 대칭</b>이에요. k 가 바꾸는 것은 사분면과 원점에서 떨어진 정도뿐입니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 평행이동 미션
// ══════════════════════════════════════════════════════════════
function MissionCard({ m, done, showHint, onHint }: { m: Mission; done: boolean; showHint: boolean; onHint: () => void }) {
  return (
    <div className={"space-y-2 rounded-xl border-2 px-3 py-2.5 " + (done ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/10 bg-black/25")}>
      <p className="flex flex-wrap items-baseline gap-x-1.5 text-[13px] font-bold text-slate-100">
        <span>🎯 점근선이</span>
        <Katex expr={`x=${m.p}`} />
        <span>,</span>
        <Katex expr={`y=${m.q}`} />
        <span>이고 점</span>
        <Katex expr={`(${m.px},\\ ${m.py})`} />
        <span>를 지나도록 맞춰 보세요.</span>
      </p>
      {done ? (
        <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {m.why}</p>
      ) : showHint ? (
        <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">💡 {m.hint}</p>
      ) : (
        <button
          type="button"
          onClick={onHint}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          힌트 보기
        </button>
      )}
    </div>
  );
}

function MoveTab() {
  const [ki, setKi] = useState(MOVE_INIT.ki);
  const [p, setP] = useState(MOVE_INIT.p);
  const [q, setQ] = useState(MOVE_INIT.q);
  const [base, setBase] = useState(true);
  const [mi, setMi] = useState(0);
  const [hints, setHints] = useState<string[]>([]);
  const [cleared, setCleared] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const k = K_LIST2[ki];
  const m = MISSIONS[mi];
  // 미션 달성 판정은 그리는 중이 아니라 슬라이더 이벤트(onAny)에서 기록한다.
  const hit = k === m.k && p === m.p && q === m.q;

  const onAny = (nk: number, np: number, nq: number) => {
    const cur = MISSIONS[mi];
    if (K_LIST2[nk] === cur.k && np === cur.p && nq === cur.q) {
      setCleared((s) => (s.includes(cur.id) ? s : [...s, cur.id]));
    }
  };

  const curves: Curve[] = [{ k, p, q, color: "#38bdf8" }];
  if (base && (p !== 0 || q !== 0)) curves.unshift({ k, p: 0, q: 0, color: "#64748b", width: 1.6, dash: "5 4" });

  const dots: Dot[] = [
    { x: p, y: q, color: "#fbbf24" },
    { x: m.px, y: m.py, color: hit ? "#34d399" : "#f472b6" },
  ];

  const quiz = MOVE_QUIZ[qi];
  const doneIds = MOVE_QUIZ.filter((v) => pick[v.id] === v.answer).map((v) => v.id);
  const qCleared = pick[quiz.id] === quiz.answer;
  const fnTex = `y=\\dfrac{${k}}{x${p === 0 ? "" : p > 0 ? `-${p}` : `+${-p}`}}${q === 0 ? "" : q > 0 ? `+${q}` : `-${-q}`}`;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🎯 점근선을 맞춰라</p>
        <TipBox>
          📖 <Katex expr="y=\dfrac{k}{x-p}+q" /> 는 <Katex expr="y=\dfrac{k}{x}" /> 를 x축 방향으로 <Katex expr="p" />, y축 방향으로 <Katex expr="q" /> 만큼 평행이동한 그래프예요. 모양은 <Katex expr="k" /> 만 바꿉니다.
        </TipBox>

        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <Plane curves={curves} asymP={p} asymQ={q} dots={dots} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex justify-center rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-[17px]">
              <span className="min-w-0">
                <Katex expr={fnTex} />
              </span>
            </div>
            <Slider
              label={<Katex expr="k=" />}
              value={ki}
              min={0}
              max={K_LIST2.length - 1}
              step={1}
              onChange={(v) => {
                setKi(v);
                onAny(v, p, q);
              }}
              show={String(k)}
            />
            <Slider
              label={<Katex expr="p=" />}
              value={p}
              min={PQ.min}
              max={PQ.max}
              step={PQ.step}
              onChange={(v) => {
                setP(v);
                onAny(ki, v, q);
              }}
              accent="accent-amber-400"
            />
            <Slider
              label={<Katex expr="q=" />}
              value={q}
              min={PQ.min}
              max={PQ.max}
              step={PQ.step}
              onChange={(v) => {
                setQ(v);
                onAny(ki, p, v);
              }}
              accent="accent-amber-400"
            />
            <div className="flex flex-wrap gap-1.5">
              <Info label="정의역">
                <Katex expr={`x\\neq ${p}`} />
              </Info>
              <Info label="치역">
                <Katex expr={`y\\neq ${q}`} />
              </Info>
              <Info label="대칭점">
                <Katex expr={`(${p},\\ ${q})`} />
              </Info>
            </div>
            <button
              type="button"
              onClick={() => setBase((v) => !v)}
              className={
                "w-full rounded-xl border-2 px-3 py-2 text-[12px] font-bold transition " +
                (base ? "border-slate-400/60 bg-white/10 text-slate-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {base ? "✓ " : ""}
              옮기기 전 곡선 겹쳐 보기
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-bold text-slate-400">미션</p>
          <Chips ids={MISSIONS.map((v) => v.id)} cur={mi} done={cleared} onPick={setMi} />
        </div>
        <div className="mt-1.5">
          <MissionCard
            m={m}
            done={cleared.includes(m.id)}
            showHint={hints.includes(m.id)}
            onHint={() => setHints((s) => [...s, m.id])}
          />
        </div>
        {cleared.includes(m.id) && mi < MISSIONS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setMi((v) => v + 1)} label="다음 미션 ▶" />
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✏️ 확인 문제</p>
          <Chips ids={MOVE_QUIZ.map((v) => v.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <QuizCard q={quiz} pick={pick[quiz.id]} onPick={(i) => setPick((mm) => ({ ...mm, [quiz.id]: i }))} />
        </div>
        {qCleared && qi < MOVE_QUIZ.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((v) => v + 1)} label="다음 문제 ▶" />
          </div>
        ) : null}
      </div>

      {cleared.length === MISSIONS.length && doneIds.length === MOVE_QUIZ.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 미션과 문제를 모두 끝냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <b className="text-white">점근선 두 개와 지나는 점 하나</b>를 알면 k, p, q 가 하나로 정해져요. 그래프를 그리는 일은 곧 점근선을 먼저 긋는 일입니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 변신 공장
// ══════════════════════════════════════════════════════════════
function FormCard({
  task,
  picks,
  onPick,
}: {
  task: FormTask;
  picks: Record<string, number>;
  onPick: (si: number, i: number) => void;
}) {
  const solved = (si: number) => picks[`${task.id}:${si}`] === task.steps[si].answer;
  const open = task.steps.findIndex((_, si) => !solved(si));
  const allDone = open === -1;

  return (
    <div className="space-y-2">
      <div className="flex min-h-[68px] items-center justify-center rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-[20px]">
        <span className="min-w-0 py-1">
          <Katex expr={task.rawTex} />
        </span>
      </div>

      {task.steps.map((s, si) => {
        if (!allDone && si > open) return null;
        const pick = picks[`${task.id}:${si}`];
        return (
          <div key={task.id + si} className="space-y-1.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="rounded-md border border-amber-400/40 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-100">
                {s.badge}
              </span>
              <p className="text-[13px] font-bold text-slate-100">{s.q}</p>
            </div>
            <TexChoices items={s.choices} pick={pick} answer={s.answer} onPick={(i) => onPick(si, i)} />
            {pick !== undefined ? <Verdict right={pick === s.answer} why={s.why} hint={s.choiceWhy[pick]} /> : null}
          </div>
        );
      })}

      {allDone ? (
        <div className="space-y-2 rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-3 py-3">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[17px] text-emerald-100">
            <span className="min-w-0">
              <Katex expr={task.rawTex} />
            </span>
            <span className="text-[13px] text-emerald-300">⟹</span>
            <span className="min-w-0">
              <Katex expr={task.formTex} />
            </span>
          </p>
          <Plane
            curves={[
              { k: task.k, p: task.p, q: task.q, color: "#94a3b8", width: 6 },
              { k: task.k, p: task.p, q: task.q, color: "#34d399", width: 2 },
            ]}
            asymP={task.p}
            asymQ={task.q}
            dots={[{ x: task.p, y: task.q, color: "#fbbf24" }]}
          />
          <p className="text-center text-[11px] leading-6 text-slate-400">
            굵은 회색은 처음 식, 가는 초록은 고쳐 쓴 식이에요. 두 곡선이 완전히 겹칩니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function FormTab() {
  const [ti, setTi] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [si, setSi] = useState(0);
  const [spick, setSpick] = useState<Record<string, number>>({});

  const task = FORM_TASKS[ti];
  const isDone = (t: FormTask) => t.steps.every((s, i) => picks[`${t.id}:${i}`] === s.answer);
  const doneIds = FORM_TASKS.filter(isDone).map((t) => t.id);
  const cleared = isDone(task);

  const sTask = SHAPE_TASKS[si];
  const sDone = SHAPE_TASKS.filter((t) => spick[t.id] === t.answer).map((t) => t.id);
  const sCleared = spick[sTask.id] === sTask.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🏭 점근선이 보이는 꼴로 변신시키기</p>
        <TipBox>
          📖 <Katex expr="y=\dfrac{ax+b}{cx+d}" /> 는 분자를 분모로 나누어 <Katex expr="y=\dfrac{k}{x-p}+q" /> 꼴로 고칠 수 있어요. <b className="text-amber-200">몫이 가로 점근선의 높이</b>가 되고 <b className="text-amber-200">나머지가 k</b> 가 됩니다.
        </TipBox>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {FORM_TASKS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTi(i)}
                className={
                  "rounded-lg border-2 px-2.5 py-1.5 text-[13px] transition " +
                  (i === ti
                    ? "border-sky-400/70 bg-sky-400/20 text-sky-100"
                    : doneIds.includes(t.id)
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                <span className="min-w-0">
                  <Katex expr={t.rawTex} />
                </span>
              </button>
            ))}
          </div>
          <Chips ids={FORM_TASKS.map((t) => t.id)} cur={ti} done={doneIds} onPick={setTi} />
        </div>
        <div className="mt-2">
          <FormCard task={task} picks={picks} onPick={(s, i) => setPicks((m) => ({ ...m, [`${task.id}:${s}`]: i }))} />
        </div>
        {cleared && ti < FORM_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setTi((v) => v + 1)} label="다음 식 ▶" />
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧐 이 그래프는 곡선일까?</p>
          <Chips ids={SHAPE_TASKS.map((t) => t.id)} cur={si} done={sDone} onPick={setSi} />
        </div>
        <TipBox>
          📖 <Katex expr="y=\dfrac{ax+b}{cx+d}" /> 가 점근선이 있는 곡선이 되려면 <Katex expr="c\neq 0" /> 이고 <Katex expr="ad-bc\neq 0" /> 이어야 해요.
        </TipBox>
        <div className="mt-2 space-y-2">
          <div className="flex min-h-[60px] items-center justify-center rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-[19px]">
            <span className="min-w-0 py-1">
              <Katex expr={sTask.tex} />
            </span>
          </div>
          <WideChoices
            items={SHAPE_CHOICES}
            pick={spick[sTask.id]}
            answer={sTask.answer}
            onPick={(i) => setSpick((m) => ({ ...m, [sTask.id]: i }))}
          />
          {spick[sTask.id] !== undefined ? (
            <Verdict right={sCleared} why={sTask.why} hint={sTask.choiceWhy[spick[sTask.id]]} />
          ) : null}
        </div>
        {sCleared && si < SHAPE_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setSi((v) => v + 1)} label="다음 식 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === FORM_TASKS.length && sDone.length === SHAPE_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 변신 공장을 모두 돌렸어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            세로 점근선은 <b className="text-white">분모를 0 으로 만드는 x</b>, 가로 점근선은 <b className="text-white">분자와 분모의 x 계수의 비</b>예요. 나눗셈 한 번이면 그래프의 자리가 다 보입니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 그래프 탐정
// ══════════════════════════════════════════════════════════════
function DetectCard({ task, pick, onPick }: { task: DetectTask; pick: number | undefined; onPick: (i: number) => void }) {
  const right = pick === task.answer;
  return (
    <div className="space-y-2">
      <Plane
        curves={[{ k: task.k, p: task.p, q: task.q, color: "#38bdf8" }]}
        asymP={task.p}
        asymQ={task.q}
        dots={[{ x: task.mx, y: task.my, color: "#f472b6" }]}
        showAsymLabel={right}
      />
      <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
        🔍 노란 점선 두 개가 점근선이고 분홍 점은 곡선 위의 한 점이에요. 점근선으로 <Katex expr="p,\ q" /> 를 읽고 점으로 <Katex expr="k" /> 를 구하세요.
      </p>
      <p className="text-[13px] font-bold text-slate-100">이 그래프의 식은?</p>
      <TexChoices items={task.choices} pick={pick} answer={task.answer} onPick={onPick} />
      {pick !== undefined ? <Verdict right={right} why={task.why} hint={task.choiceWhy[pick]} /> : null}
    </div>
  );
}

function DetectTab() {
  const [ti, setTi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const task = DETECT_TASKS[ti];
  const doneIds = DETECT_TASKS.filter((t) => pick[t.id] === t.answer).map((t) => t.id);
  const cleared = pick[task.id] === task.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔍 그래프만 보고 식을 찾아라</p>
          <Chips ids={DETECT_TASKS.map((t) => t.id)} cur={ti} done={doneIds} onPick={setTi} />
        </div>
        <div className="mt-2">
          <DetectCard task={task} pick={pick[task.id]} onPick={(i) => setPick((m) => ({ ...m, [task.id]: i }))} />
        </div>
        {cleared && ti < DETECT_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setTi((v) => v + 1)} label="다음 그래프 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === DETECT_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 그래프를 모두 알아냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            점근선이 같아도 <b className="text-white">k 가 다르면 굽은 정도가 달라져요</b>. 그래서 점근선 두 개에 곡선 위의 점 하나가 더 있어야 식이 하나로 정해집니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ⑤ 일상생활 속 점근선
// ══════════════════════════════════════════════════════════════
function fmtMoney(v: number, digits: number): string {
  const n = Number(v.toFixed(digits));
  const [a, b] = String(n).split(".");
  return a.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (b ? "." + b : "");
}

function GardenViz({ x }: { x: number }) {
  const y = 36 / x;
  const s = 140 / 18;
  return (
    <svg viewBox="0 0 200 170" className="mx-auto block w-full max-w-[190px]" role="img" aria-label="텃밭 모양">
      <rect x={0} y={0} width={200} height={170} fill="#020617" rx={12} />
      <rect x={28} y={150 - y * s} width={x * s} height={y * s} fill="#166534" stroke="#4ade80" strokeWidth={1.6} rx={3} />
      <text x={28 + (x * s) / 2} y={164} fontSize={11} fontWeight={700} textAnchor="middle" fill="#86efac">
        {x} m
      </text>
      <text x={22} y={150 - (y * s) / 2 + 4} fontSize={11} fontWeight={700} textAnchor="end" fill="#86efac">
        {y.toFixed(1)}
      </text>
      <text x={100} y={16} fontSize={11} fontWeight={700} textAnchor="middle" fill="#cbd5e1">
        넓이는 늘 36 m²
      </text>
    </svg>
  );
}

function BusViz({ x }: { x: number }) {
  const seats = Array.from({ length: 50 }, (_, i) => i);
  return (
    <svg viewBox="0 0 200 170" className="mx-auto block w-full max-w-[190px]" role="img" aria-label="버스 좌석">
      <rect x={0} y={0} width={200} height={170} fill="#020617" rx={12} />
      <rect x={16} y={24} width={168} height={104} rx={12} fill="#0f172a" stroke="#64748b" strokeWidth={1.6} />
      <rect x={26} y={32} width={148} height={16} rx={5} fill="#1e293b" />
      {seats.map((i) => {
        const col = i % 10;
        const row = Math.floor(i / 10);
        return (
          <circle
            key={i}
            cx={32 + col * 15}
            cy={62 + row * 15}
            r={5}
            fill={i < x ? "#38bdf8" : "#1e293b"}
            stroke={i < x ? "#7dd3fc" : "#334155"}
            strokeWidth={1}
          />
        );
      })}
      <circle cx={48} cy={136} r={10} fill="#1e293b" stroke="#64748b" strokeWidth={1.6} />
      <circle cx={152} cy={136} r={10} fill="#1e293b" stroke="#64748b" strokeWidth={1.6} />
      <text x={100} y={16} fontSize={11} fontWeight={700} textAnchor="middle" fill="#cbd5e1">
        {x} 명이 함께 가요
      </text>
    </svg>
  );
}

function ClassViz({ x }: { x: number }) {
  const bar = (n: number) => Math.max(3, (n / 60) * 104);
  return (
    <svg viewBox="0 0 220 170" className="mx-auto block w-full max-w-[210px]" role="img" aria-label="반 인원과 점수">
      <rect x={0} y={0} width={220} height={170} fill="#020617" rx={12} />
      <text x={110} y={20} fontSize={11} fontWeight={700} textAnchor="middle" fill="#cbd5e1">
        사람 수와 점수
      </text>
      <text x={8} y={52} fontSize={10.5} fontWeight={700} fill="#94a3b8">
        기존
      </text>
      <rect x={52} y={40} width={bar(20)} height={16} rx={8} fill="#475569" />
      <text x={212} y={53} fontSize={11} fontWeight={700} textAnchor="end" fill="#cbd5e1" fontFamily="ui-monospace, monospace">
        20명 · 72점
      </text>
      <text x={8} y={90} fontSize={10.5} fontWeight={700} fill="#94a3b8">
        새 학생
      </text>
      <rect x={52} y={78} width={bar(x)} height={16} rx={8} fill="#34d399" />
      <text x={212} y={91} fontSize={11} fontWeight={700} textAnchor="end" fill="#6ee7b7" fontFamily="ui-monospace, monospace">
        {x}명 · 100점
      </text>
      <line x1={8} y1={112} x2={212} y2={112} stroke="#1e293b" strokeWidth={1} />
      <text x={8} y={134} fontSize={10.5} fontWeight={700} fill="#94a3b8">
        반 평균
      </text>
      <rect x={52} y={122} width={Math.max(3, ((1440 + 100 * x) / (20 + x) / 110) * 104)} height={16} rx={8} fill="#f472b6" />
      <text x={212} y={135} fontSize={11} fontWeight={700} textAnchor="end" fill="#f9a8d4" fontFamily="ui-monospace, monospace">
        {((1440 + 100 * x) / (20 + x)).toFixed(2)}점
      </text>
      <text x={110} y={160} fontSize={10} textAnchor="middle" fill="#64748b">
        막대 길이는 사람 수에 맞췄어요
      </text>
    </svg>
  );
}

function LifePlane({ cs, x }: { cs: LifeCase; x: number }) {
  const L = LIFE_PLOT;
  const v = cs.view;
  const px = (t: number) => L.left + ((t - v.xMin) / (v.xMax - v.xMin)) * (L.right - L.left);
  const py = (t: number) => L.bottom - ((t - v.yMin) / (v.yMax - v.yMin)) * (L.bottom - L.top);
  const pts: string[] = [];
  for (let i = 0; i <= 240; i++) {
    const t = v.xMin + ((v.xMax - v.xMin) * i) / 240;
    pts.push(`${px(t).toFixed(2)} ${py(lifeValue(cs, t)).toFixed(2)}`);
  }
  const cy = py(lifeValue(cs, x));
  const cx = px(x);

  return (
    <svg viewBox={`0 0 ${L.w} ${L.h}`} className="mx-auto block w-full" role="img" aria-label="일상 상황의 그래프">
      <rect x={0} y={0} width={L.w} height={L.h} fill="#020617" rx={12} />
      {cs.yTicks.map((t) => (
        <g key={"y" + t}>
          <line x1={L.left} y1={py(t)} x2={L.right} y2={py(t)} stroke="#1e293b" strokeWidth={1} />
          <text x={L.left - 6} y={py(t) + 4} fontSize={10.5} textAnchor="end" fill="#64748b" fontFamily="ui-monospace, monospace">
            {fmtMoney(t, 0)}
          </text>
        </g>
      ))}
      {cs.xTicks.map((t) => (
        <g key={"x" + t}>
          <line x1={px(t)} y1={L.top} x2={px(t)} y2={L.bottom} stroke="#1e293b" strokeWidth={1} />
          <text x={px(t)} y={L.bottom + 16} fontSize={10.5} textAnchor="middle" fill="#64748b" fontFamily="ui-monospace, monospace">
            {t}
          </text>
        </g>
      ))}
      <line x1={L.left} y1={L.top - 6} x2={L.left} y2={L.bottom} stroke="#64748b" strokeWidth={1.6} />
      <line x1={L.left} y1={L.bottom} x2={L.right + 6} y2={L.bottom} stroke="#64748b" strokeWidth={1.6} />
      <text x={6} y={14} fontSize={10.5} fontWeight={700} fill="#94a3b8">
        {cs.yName}
      </text>
      <text x={L.right} y={L.h - 6} fontSize={10.5} fontWeight={700} textAnchor="end" fill="#94a3b8">
        {cs.xName}
      </text>

      <line x1={L.left} y1={py(cs.q)} x2={L.right} y2={py(cs.q)} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="6 4" />
      <text x={L.left + 5} y={py(cs.q) - 6} fontSize={11} fontWeight={700} fill="#fcd34d">
        {cs.asymLabel}
      </text>

      <path d={"M " + pts.join(" L ")} fill="none" stroke="#38bdf8" strokeWidth={2.4} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx} y2={L.bottom} stroke="#f472b6" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={L.left} y1={cy} x2={cx} y2={cy} stroke="#f472b6" strokeWidth={1} strokeDasharray="3 3" />
      <circle cx={cx} cy={cy} r={4.6} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
    </svg>
  );
}

function LifePanel({
  cs,
  x,
  onX,
  picks,
  onPick,
}: {
  cs: LifeCase;
  x: number;
  onX: (v: number) => void;
  picks: Record<string, number>;
  onPick: (qi: number, i: number) => void;
}) {
  const v = lifeValue(cs, x);
  const q0 = picks[`${cs.id}:0`] === cs.qs[0].answer;
  const allDone = q0 && picks[`${cs.id}:1`] === cs.qs[1].answer;

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-slate-100">
          <span>
            {cs.icon} {cs.title}
          </span>
          <span className="rounded-md border border-sky-400/40 bg-sky-400/15 px-1.5 py-0.5 text-[10px] text-sky-100">{cs.form}</span>
        </p>
        <div className="mt-1 space-y-0.5 text-[12px] leading-6 text-slate-300">
          {cs.story.map((s) => (
            <p key={s}>{s}</p>
          ))}
        </div>
      </div>

      <Slider
        label={cs.xLabel + " ="}
        value={x}
        min={cs.min}
        max={cs.max}
        step={cs.step}
        onChange={onX}
        accent="accent-pink-400"
        show={`${x} ${cs.xUnit}`}
      />

      <div className="grid gap-2 sm:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-3 sm:col-span-2">
          {cs.id === "V1" ? <GardenViz x={x} /> : null}
          {cs.id === "V2" ? <BusViz x={x} /> : null}
          {cs.id === "V3" ? <ClassViz x={x} /> : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-lg border border-pink-400/40 bg-pink-400/15 px-2.5 py-1.5 text-[12px] font-bold text-pink-100">
              {cs.yLabel} <span className="font-mono text-[14px] text-white">{fmtMoney(v, cs.digits)}</span> {cs.yUnit}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-2 py-3 sm:col-span-3">
          <LifePlane cs={cs} x={x} />
          <p className="mt-1 text-center text-[11px] leading-6 text-slate-500">
            노란 점선이 가로 점근선이에요. 곡선이 다가가기만 하고 넘지 못합니다.
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
        <p className="text-[13px] font-bold text-slate-100">{cs.qs[0].prompt}</p>
        <MixedChoices items={cs.qs[0].choices} pick={picks[`${cs.id}:0`]} answer={cs.qs[0].answer} onPick={(i) => onPick(0, i)} />
        {picks[`${cs.id}:0`] !== undefined ? (
          <Verdict right={q0} why={cs.qs[0].why} hint={cs.qs[0].choiceWhy[picks[`${cs.id}:0`]]} />
        ) : null}
      </div>

      {q0 ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
          <p className="text-[13px] font-bold text-slate-100">{cs.qs[1].prompt}</p>
          <MixedChoices items={cs.qs[1].choices} pick={picks[`${cs.id}:1`]} answer={cs.qs[1].answer} onPick={(i) => onPick(1, i)} />
          {picks[`${cs.id}:1`] !== undefined ? (
            <Verdict right={allDone} why={cs.qs[1].why} hint={cs.qs[1].choiceWhy[picks[`${cs.id}:1`]]} />
          ) : null}
        </div>
      ) : null}

      {allDone ? (
        <div className="rounded-xl border-2 border-sky-400/45 bg-sky-400/12 px-3 py-3">
          <div className="flex justify-center py-1 text-[18px] text-sky-100">
            <span className="min-w-0">
              <Katex expr={cs.fnTex} />
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-7 text-slate-300">💡 {cs.insight}</p>
        </div>
      ) : null}
    </div>
  );
}

function LifeTab() {
  const [ci, setCi] = useState(0);
  const [xs, setXs] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    LIFE_CASES.forEach((c) => (m[c.id] = c.init));
    return m;
  });
  const [picks, setPicks] = useState<Record<string, number>>({});

  const cs = LIFE_CASES[ci];
  const isDone = (c: LifeCase) => c.qs.every((q, qi) => picks[`${c.id}:${qi}`] === q.answer);
  const doneIds = LIFE_CASES.filter(isDone).map((c) => c.id);
  const cleared = isDone(cs);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🚌 일상생활에서 만나는 점근선</p>
        <TipBox>
          📖 세 상황이 각각 <Katex expr="y=\dfrac{k}{x}" />, <Katex expr="y=\dfrac{k}{x}+q" />, <Katex expr="y=\dfrac{ax+b}{cx+d}" /> 꼴이에요. 가로 점근선이 <b className="text-amber-200">닿지 못하는 값</b>이라는 뜻을 상황 속에서 읽어 보세요.
        </TipBox>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {LIFE_CASES.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCi(i)}
                className={
                  "rounded-lg border-2 px-2.5 py-1.5 text-[12px] font-bold transition " +
                  (i === ci
                    ? "border-pink-400/70 bg-pink-400/20 text-pink-100"
                    : doneIds.includes(c.id)
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {c.icon} {c.title}
              </button>
            ))}
          </div>
          <Chips ids={LIFE_CASES.map((c) => c.id)} cur={ci} done={doneIds} onPick={setCi} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <LifePanel
          cs={cs}
          x={xs[cs.id]}
          onX={(v) => setXs((m) => ({ ...m, [cs.id]: v }))}
          picks={picks}
          onPick={(qi, i) => setPicks((m) => ({ ...m, [`${cs.id}:${qi}`]: i }))}
        />
        {cleared && ci < LIFE_CASES.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setCi((v) => v + 1)} label="다음 상황 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === LIFE_CASES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 세 상황을 모두 살펴봤어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            점근선은 그림 속의 선일 뿐 아니라 <b className="text-white">현실에서 넘을 수 없는 한계</b>를 뜻해요. 입장료 8000 원, 만점 100 점처럼 말이지요.
          </p>
        </div>
      ) : null}
    </div>
  );
}
