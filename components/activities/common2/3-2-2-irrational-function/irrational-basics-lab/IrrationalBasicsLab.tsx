"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CALC_TASKS,
  DOM_TASKS,
  FN_CARDS,
  FN_CHOICES,
  HORIZON,
  IRR_CARDS,
  IRR_CHOICES,
  LIFE_CASES,
  LINE,
  LINE_TICKS,
  LINE_X,
  PLOT,
  PROPS,
  RANGE_TASKS,
  SWING,
  horizonGeom,
  horizonShip,
  inRange,
  lineX,
  swingLen,
  type CalcTask,
  type DomTask,
  type LifeCase,
  type Piece,
  type Range,
  type RangeTask,
  type SqrtProp,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "what_is_irrational",
    prompt:
      "어떤 식이 무리식인지 가리는 기준을 자기 말로 정리하고, 근호가 보이는데도 무리식이 아닌 경우를 활동에서 본 예로 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 근호 안에 문자가 들어 있으면서 유리식으로 고쳐 쓸 수 없어야 무리식이다. √7 x − 2 나 √3/(x+1) 은 근호 안에 있는 것이 수라서 무리식이 아니다. √((x−3)²) 은 근호 안에 문자가 있지만 |x−3| 이 되어 근호가 사라지므로 무리식이 아니다. 반대로 (x+1)/√(2−x) 처럼 분모에 있어도 근호 안에 문자가 있으면 무리식이다.",
  },
  {
    id: "domain_rule",
    prompt:
      "무리식의 값이 실수가 되는 범위와 무리함수의 정의역을 구하는 방법을 설명하고, 근호가 분모에 있을 때 무엇이 달라지는지 예를 들어 써 보세요.",
    kind: "text",
    placeholder:
      "예: 근호 안의 값이 0 이상이 되는 x 만 넣을 수 있다. √(x−5) 는 x − 5 ≥ 0 이라 x ≥ 5 다. 그런데 근호가 분모에 있으면 0 이면 나눌 수 없으므로 등호가 빠져서 1/√(x+3) 은 x > −3 이 된다. 조건이 여럿이면 모두 만족하는 공통 범위를 잡아 √(x+1)/√(6−x) 는 −1 ≤ x < 6 이다.",
  },
  {
    id: "life_irrational",
    prompt:
      "일상생활에서 무리함수로 나타나는 상황을 하나 골라 식을 세워 보고, x 가 커질수록 값이 늘어나는 모습이 어떠했는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 줄 길이가 x m 인 그네가 한 번 왕복하는 시간은 2√x 초다. 줄을 두 배로 늘려도 시간은 √2 배, 곧 1.41 배쯤만 늘어나고 시간을 두 배로 하려면 줄을 네 배로 해야 한다. 그래프에 찍히는 점도 처음에는 가파르게 올라가다가 갈수록 눕는다. 지평선까지의 거리 3.6√x 도 마찬가지여서 높이를 네 배로 올려야 두 배 멀리 보인다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "irr" | "calc" | "fn" | "life";

const ABC = ["①", "②", "③", "④"];

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition " +
        (active ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
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
              ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
              : done.includes(id)
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
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
      className="w-full rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 px-3 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/25"
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
  accent = "accent-emerald-400",
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

function BigTex({ tex, tone = "" }: { tex: string; tone?: string }) {
  return (
    <div className={"flex min-h-[66px] items-center justify-center rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-[20px] " + tone}>
      <span className="min-w-0 py-1">
        <Katex expr={tex} />
      </span>
    </div>
  );
}

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
    <div className="grid gap-1.5 sm:grid-cols-2">
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

function fmt(v: number, d = 2): string {
  const n = Number(v.toFixed(d));
  const [a, b] = String(n).split(".");
  return a.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (b ? "." + b : "");
}

// ══════════════════════════════════════════════════════════════
// 수직선 — 범위와 발자국
// ══════════════════════════════════════════════════════════════
function RangeLine({
  band,
  bandColor = "#34d399",
  cur,
  curOk,
  dots = [],
  aria,
}: {
  band: Range | null;
  bandColor?: string;
  cur: number | null;
  curOk: boolean;
  dots?: { x: number; ok: boolean }[];
  aria: string;
}) {
  const bx1 = band && band.lo !== null ? lineX(band.lo) : LINE.left - 12;
  const bx2 = band && band.hi !== null ? lineX(band.hi) : LINE.right + 12;
  return (
    <svg viewBox={`0 0 ${LINE.w} ${LINE.h}`} className="w-full" role="img" aria-label={aria}>
      <rect x={0} y={0} width={LINE.w} height={LINE.h} fill="#020617" rx={12} />
      <line x1={LINE.left - 16} y1={LINE.y} x2={LINE.right + 16} y2={LINE.y} stroke="#475569" strokeWidth={2} />
      {LINE_TICKS.map((t) => (
        <g key={t}>
          <line x1={lineX(t)} y1={LINE.y - 4} x2={lineX(t)} y2={LINE.y + 4} stroke="#475569" strokeWidth={1.2} />
          {t % 2 === 0 ? (
            <text x={lineX(t)} y={LINE.y + 20} fontSize={10} textAnchor="middle" fill="#64748b" fontFamily="ui-monospace, monospace">
              {t}
            </text>
          ) : null}
        </g>
      ))}

      {band ? (
        <g>
          <line x1={bx1} y1={LINE.y} x2={bx2} y2={LINE.y} stroke={bandColor} strokeWidth={7} strokeOpacity={0.55} strokeLinecap="butt" />
          {band.lo !== null ? (
            <circle cx={lineX(band.lo)} cy={LINE.y} r={5.5} fill={band.loOpen ? "#020617" : bandColor} stroke={bandColor} strokeWidth={2.2} />
          ) : (
            <path d={`M ${LINE.left - 16} ${LINE.y} l 10 -5 l 0 10 z`} fill={bandColor} />
          )}
          {band.hi !== null ? (
            <circle cx={lineX(band.hi)} cy={LINE.y} r={5.5} fill={band.hiOpen ? "#020617" : bandColor} stroke={bandColor} strokeWidth={2.2} />
          ) : (
            <path d={`M ${LINE.right + 16} ${LINE.y} l -10 -5 l 0 10 z`} fill={bandColor} />
          )}
        </g>
      ) : null}

      {dots.map((d) => (
        <circle key={d.x} cx={lineX(d.x)} cy={LINE.y + 34} r={2.6} fill={d.ok ? "#34d399" : "#f43f5e"} fillOpacity={0.85} />
      ))}

      {cur !== null ? (
        <g>
          <line x1={lineX(cur)} y1={26} x2={lineX(cur)} y2={LINE.y - 8} stroke={curOk ? "#a3e635" : "#fb7185"} strokeWidth={1.3} strokeDasharray="3 3" />
          <circle cx={lineX(cur)} cy={LINE.y} r={4.6} fill={curOk ? "#a3e635" : "#fb7185"} stroke="#020617" strokeWidth={1.2} />
          <text x={lineX(cur)} y={20} fontSize={11} fontWeight={700} textAnchor="middle" fill={curOk ? "#bef264" : "#fda4af"}>
            {cur}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function IrrationalBasicsLab() {
  const [tab, setTab] = useState<Tab>("irr");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">√ 무리식과 무리함수</h3>
        <p className="mt-2 leading-7 text-slate-300">
          근호 안에 <b className="text-emerald-200">문자</b>가 들어오면 아무 수나 넣을 수 없게 됩니다. 넣어도 되는 자리를 직접 찾아보며 무리식과 무리함수를 익혀 보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "irr"} onClick={() => setTab("irr")}>
          ① 무리식일까? 🔍
        </TabButton>
        <TabButton active={tab === "calc"} onClick={() => setTab("calc")}>
          ② 근호 계산소 🧮
        </TabButton>
        <TabButton active={tab === "fn"} onClick={() => setTab("fn")}>
          ③ 무리함수 기계 ⚙️
        </TabButton>
        <TabButton active={tab === "life"} onClick={() => setTab("life")}>
          ④ 일상생활 속 무리함수 🛝
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "irr" ? <IrrTab /> : null}
        {tab === "calc" ? <CalcTab /> : null}
        {tab === "fn" ? <FnTab /> : null}
        {tab === "life" ? <LifeTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 무리식일까? + 실수가 되는 범위
// ══════════════════════════════════════════════════════════════
function RangeCard({
  task,
  x,
  onX,
  visited,
  pick,
  onPick,
}: {
  task: RangeTask;
  x: number;
  onX: (v: number) => void;
  visited: number[];
  pick: number | undefined;
  onPick: (i: number) => void;
}) {
  const good = inRange(task, x);
  const solved = pick === task.answer;
  return (
    <div className="space-y-2">
      <BigTex tex={task.tex} />
      <Slider label="x =" value={x} min={LINE_X.min} max={LINE_X.max} step={LINE_X.step} onChange={onX} accent="accent-lime-400" />

      <div className="flex flex-wrap gap-1.5">
        {task.parts.map((p) => {
          const v = p.f(x);
          const okPart = p.strict ? v > 0 : v >= 0;
          return (
            <span
              key={p.label}
              className={
                "inline-flex min-w-0 flex-wrap items-baseline gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-bold " +
                (okPart ? "border-lime-400/40 bg-lime-400/10 text-lime-100" : "border-rose-400/40 bg-rose-400/10 text-rose-100")
              }
            >
              <span className="text-[10px] text-slate-400">{p.label}</span>
              <Katex expr={p.tex} />
              <span className="text-slate-500">=</span>
              <span className="font-mono text-[13px] text-white">{fmt(v)}</span>
              <span className="text-[10px]">{p.strict ? "(0 보다 커야)" : "(0 이상이어야)"}</span>
            </span>
          );
        })}
        <span
          className={
            "inline-flex items-center rounded-lg px-2.5 py-1.5 text-[12px] font-extrabold " +
            (good ? "bg-lime-400/20 text-lime-100" : "bg-rose-400/20 text-rose-100")
          }
        >
          {good ? "✅ 실수예요" : "✖ 실수가 아니에요"}
        </span>
      </div>

      <RangeLine
        band={solved ? task.range : null}
        cur={x}
        curOk={good}
        dots={visited.map((v) => ({ x: v, ok: inRange(task, v) }))}
        aria="값이 실수가 되는 범위"
      />
      <p className="text-center text-[11px] leading-6 text-slate-500">
        {solved ? "초록 띠가 값이 실수가 되는 범위예요. 속이 빈 동그라미는 그 수를 넣을 수 없다는 뜻입니다." : "슬라이더를 움직인 자리마다 아래에 점이 남아요. 초록은 되는 자리, 붉은색은 안 되는 자리입니다."}
      </p>

      <p className="text-[13px] font-bold text-slate-100">값이 실수가 되도록 하는 x 의 범위는?</p>
      <MixedChoices items={task.choices} pick={pick} answer={task.answer} onPick={onPick} />
      {pick !== undefined ? <Verdict right={solved} why={task.why} hint={task.choiceWhy[pick]} /> : null}
    </div>
  );
}

function IrrTab() {
  const [ci, setCi] = useState(0);
  const [cpick, setCpick] = useState<Record<string, number>>({});
  const [ri, setRi] = useState(0);
  const [xs, setXs] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    RANGE_TASKS.forEach((t) => (m[t.id] = 0));
    return m;
  });
  const [visited, setVisited] = useState<Record<string, number[]>>(() => {
    const m: Record<string, number[]> = {};
    RANGE_TASKS.forEach((t) => (m[t.id] = [0]));
    return m;
  });
  const [rpick, setRpick] = useState<Record<string, number>>({});

  const card = IRR_CARDS[ci];
  const cDone = IRR_CARDS.filter((c) => cpick[c.id] === c.answer).map((c) => c.id);
  const cCleared = cpick[card.id] === card.answer;

  const task = RANGE_TASKS[ri];
  const rDone = RANGE_TASKS.filter((t) => rpick[t.id] === t.answer).map((t) => t.id);
  const rCleared = rpick[task.id] === task.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔍 이 식은 무리식일까?</p>
          <Chips ids={IRR_CARDS.map((c) => c.id)} cur={ci} done={cDone} onPick={setCi} />
        </div>
        <TipBox>
          📖 <b className="text-emerald-200">무리식</b>은 근호 안에 문자가 들어 있으면서 유리식으로 나타낼 수 없는 식이에요. 근호 안이 완전제곱이면 근호가 벗겨져 무리식이 아닙니다.
        </TipBox>
        <div className="mt-2 space-y-2">
          <BigTex tex={card.tex} />
          <WideChoices items={IRR_CHOICES} pick={cpick[card.id]} answer={card.answer} onPick={(i) => setCpick((m) => ({ ...m, [card.id]: i }))} />
          {cpick[card.id] !== undefined ? <Verdict right={cCleared} why={card.why} hint={card.choiceWhy[cpick[card.id]]} /> : null}
        </div>
        {cCleared && ci < IRR_CARDS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setCi((v) => v + 1)} label="다음 식 ▶" />
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎚️ 넣어도 되는 자리 찾기</p>
          <Chips ids={RANGE_TASKS.map((t) => t.id)} cur={ri} done={rDone} onPick={setRi} />
        </div>
        <TipBox>
          📖 근호 안의 값이 <b className="text-lime-200">0 이상</b>이어야 실수가 돼요. 근호가 분모에 있으면 0 이어도 안 되므로 등호가 빠집니다.
        </TipBox>
        <div className="mt-2">
          <RangeCard
            task={task}
            x={xs[task.id]}
            onX={(v) => {
              setXs((m) => ({ ...m, [task.id]: v }));
              setVisited((m) => (m[task.id].includes(v) ? m : { ...m, [task.id]: [...m[task.id], v] }));
            }}
            visited={visited[task.id]}
            pick={rpick[task.id]}
            onPick={(i) => setRpick((m) => ({ ...m, [task.id]: i }))}
          />
        </div>
        {rCleared && ri < RANGE_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setRi((v) => v + 1)} label="다음 식 ▶" />
          </div>
        ) : null}
      </div>

      {cDone.length === IRR_CARDS.length && rDone.length === RANGE_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 무리식을 모두 가려냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            근호 안에 <b className="text-white">문자</b>가 있어야 무리식이고, 근호 안이 <b className="text-white">완전제곱</b>이면 근호가 벗겨져 무리식이 아니에요. 값이 실수가 되는 범위는 근호 안이 0 이상, 분모는 0 이 아니어야 합니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 근호 계산소
// ══════════════════════════════════════════════════════════════
function PropLab({ prop, a, b, onA, onB }: { prop: SqrtProp; a: number; b: number; onA: (v: number) => void; onB: (v: number) => void }) {
  const L = prop.leftF(a, b);
  const R = prop.rightF(a, b);
  const both = L !== null && R !== null;
  const same = both && Math.abs(L - R) < 1e-9;

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="rounded-md border border-amber-400/40 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-100">{prop.no}</span>
          <p className="text-[13px] font-bold text-slate-100">{prop.title}</p>
        </div>
        <div className="mt-1.5 flex justify-center py-1 text-[17px]">
          <span className="min-w-0">
            <Katex expr={prop.lawTex} />
          </span>
        </div>
        <p className="text-center text-[11px] font-bold text-amber-200">{prop.cond}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Slider label={<Katex expr="a=" />} value={a} min={prop.aMin} max={prop.aMax} step={prop.aStep} onChange={onA} accent="accent-sky-400" />
        {prop.useB ? (
          <Slider label={<Katex expr="b=" />} value={b} min={prop.bMin} max={prop.bMax} step={prop.bStep} onChange={onB} accent="accent-pink-400" />
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-2.5 py-2.5">
          <p className="text-[10px] font-bold text-sky-300">왼쪽</p>
          <div className="mt-1 flex min-h-[40px] items-center py-1 text-[16px]">
            <span className="min-w-0">
              <Katex expr={prop.leftTex} />
            </span>
          </div>
          <p className={"mt-1 font-mono text-[15px] font-bold " + (L === null ? "text-rose-300" : "text-sky-100")}>{L === null ? "값 없음" : fmt(L, 4)}</p>
        </div>
        <div className="rounded-xl border border-pink-400/30 bg-pink-400/10 px-2.5 py-2.5">
          <p className="text-[10px] font-bold text-pink-300">오른쪽</p>
          <div className="mt-1 flex min-h-[40px] items-center py-1 text-[16px]">
            <span className="min-w-0">
              <Katex expr={prop.rightTex} />
            </span>
          </div>
          <p className={"mt-1 font-mono text-[15px] font-bold " + (R === null ? "text-rose-300" : "text-pink-100")}>{R === null ? "값 없음" : fmt(R, 4)}</p>
        </div>
      </div>

      <p
        className={
          "rounded-lg px-3 py-2 text-[12px] leading-6 " +
          (same ? "bg-emerald-400/12 text-emerald-100" : both ? "bg-rose-400/12 text-rose-100" : "bg-amber-400/12 text-amber-100")
        }
      >
        {same ? "✅ 두 값이 같아요." : both ? "❌ 두 값이 다릅니다! 조건을 벗어났어요." : "⚠️ 한쪽이 값을 잃었어요."}
      </p>
      <TipBox>💡 {prop.note}</TipBox>
    </div>
  );
}

function CalcCard({ task, picks, onPick }: { task: CalcTask; picks: Record<string, number>; onPick: (si: number, i: number) => void }) {
  const solved = (si: number) => picks[`${task.id}:${si}`] === task.steps[si].answer;
  const open = task.steps.findIndex((_, si) => !solved(si));
  const allDone = open === -1;

  return (
    <div className="space-y-2">
      <BigTex tex={task.exprTex} />
      {task.steps.map((s, si) => {
        if (!allDone && si > open) return null;
        const pick = picks[`${task.id}:${si}`];
        return (
          <div key={task.id + si} className="space-y-1.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="rounded-md border border-amber-400/40 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-100">{s.badge}</span>
              <p className="text-[13px] font-bold text-slate-100">{s.q}</p>
            </div>
            <TexChoices items={s.choices} pick={pick} answer={s.answer} onPick={(i) => onPick(si, i)} />
            {pick !== undefined ? <Verdict right={pick === s.answer} why={s.why} hint={s.choiceWhy[pick]} /> : null}
          </div>
        );
      })}
      {allDone ? (
        <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/12 px-3 py-3">
          <p className="text-center text-[11px] font-bold text-emerald-200">정리하면</p>
          <div className="mt-1 flex justify-center py-1 text-[20px] text-emerald-100">
            <span className="min-w-0">
              <Katex expr={task.resultTex} />
            </span>
          </div>
          <p className="mt-1 text-center text-[11px] leading-6 text-slate-300">{task.note}</p>
        </div>
      ) : null}
    </div>
  );
}

function CalcTab() {
  const [pi, setPi] = useState(0);
  const [ab, setAb] = useState<Record<string, { a: number; b: number }>>(() => {
    const m: Record<string, { a: number; b: number }> = {};
    PROPS.forEach((p) => (m[p.id] = { a: p.aInit, b: p.bInit }));
    return m;
  });
  const [qi, setQi] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});

  const prop = PROPS[pi];
  const cur = ab[prop.id];
  const task = CALC_TASKS[qi];
  const isDone = (t: CalcTask) => t.steps.every((s, i) => picks[`${t.id}:${i}`] === s.answer);
  const doneIds = CALC_TASKS.filter(isDone).map((t) => t.id);
  const cleared = isDone(task);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🔬 근호의 성질 실험대</p>
        <TipBox>📖 성질 카드를 눌러 슬라이더로 좌변과 우변의 값을 견주어 보세요. 조건을 벗어나면 어떻게 되는지도 살펴봅니다.</TipBox>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PROPS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPi(i)}
              className={
                "rounded-lg border-2 px-2.5 py-1.5 text-[13px] transition " +
                (i === pi ? "border-amber-400/70 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              <span className="min-w-0">
                <Katex expr={p.lawTex} />
              </span>
            </button>
          ))}
        </div>
        <div className="mt-2">
          <PropLab
            prop={prop}
            a={cur.a}
            b={cur.b}
            onA={(v) => setAb((m) => ({ ...m, [prop.id]: { ...m[prop.id], a: v } }))}
            onB={(v) => setAb((m) => ({ ...m, [prop.id]: { ...m[prop.id], b: v } }))}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧮 한 걸음씩 계산하기</p>
          <Chips ids={CALC_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <CalcCard task={task} picks={picks} onPick={(si, i) => setPicks((m) => ({ ...m, [`${task.id}:${si}`]: i }))} />
        </div>
        {cleared && qi < CALC_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((v) => v + 1)} label="다음 문제 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === CALC_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            근호가 있는 식도 <b className="text-white">합과 차의 곱</b>과 <b className="text-white">유리화</b> 두 도구면 웬만큼 정리돼요. 분모에서 근호를 없애면 크기를 어림하기도 쉬워집니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 무리함수 기계
// ══════════════════════════════════════════════════════════════
function DomCard({
  task,
  x,
  onX,
  visited,
  pick,
  onPick,
}: {
  task: DomTask;
  x: number;
  onX: (v: number) => void;
  visited: number[];
  pick: number | undefined;
  onPick: (i: number) => void;
}) {
  const inner = task.inner(x);
  const y = task.f(x);
  const solved = pick === task.answer;

  return (
    <div className="space-y-2">
      <BigTex tex={task.tex} />
      <Slider label="넣는 수 x =" value={x} min={LINE_X.min} max={LINE_X.max} step={LINE_X.step} onChange={onX} accent="accent-sky-400" />

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
        <span className="inline-flex h-10 min-w-[3.2rem] items-center justify-center rounded-xl border-2 border-sky-400/50 bg-sky-400/15 px-2 font-mono text-[15px] font-bold text-sky-100">
          {x}
        </span>
        <span className="text-slate-500">▶</span>
        <span
          className={
            "inline-flex h-10 min-w-0 items-center gap-1.5 rounded-xl border-2 px-2.5 text-[13px] font-bold " +
            (inner >= 0 ? "border-lime-400/50 bg-lime-400/10 text-lime-100" : "border-rose-400/50 bg-rose-400/10 text-rose-100")
          }
        >
          <Katex expr={task.innerTex} />
          <span className="text-slate-400">=</span>
          <span className="font-mono text-white">{fmt(inner)}</span>
        </span>
        <span className="text-slate-500">▶</span>
        <span
          className={
            "inline-flex h-10 min-w-[4.4rem] items-center justify-center rounded-xl border-2 px-2 font-mono text-[15px] font-bold " +
            (y === null ? "border-rose-400/60 bg-rose-400/15 text-rose-100" : "border-emerald-400/50 bg-emerald-400/15 text-emerald-100")
          }
        >
          {y === null ? "✖ 없음" : fmt(y, 3)}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-bold text-slate-400">넣는 수 x 의 자리</p>
        <RangeLine
          band={solved ? task.domain : null}
          bandColor="#38bdf8"
          cur={x}
          curOk={inner >= 0}
          dots={visited.map((v) => ({ x: v, ok: task.f(v) !== null }))}
          aria="정의역 수직선"
        />
      </div>
      {solved ? (
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400">나오는 값 y 의 자리</p>
          <RangeLine band={task.rangeY} bandColor="#f472b6" cur={y} curOk={true} aria="치역 수직선" />
        </div>
      ) : null}
      <p className="text-center text-[11px] leading-6 text-slate-500">
        {solved ? "파란 띠가 정의역, 분홍 띠가 치역이에요." : "슬라이더를 움직인 자리마다 점이 남아요. 붉은 점은 값이 없는 자리입니다."}
      </p>

      <p className="text-[13px] font-bold text-slate-100">이 함수의 정의역과 치역은?</p>
      <MixedChoices items={task.choices} pick={pick} answer={task.answer} onPick={onPick} />
      {pick !== undefined ? <Verdict right={solved} why={task.why} hint={task.choiceWhy[pick]} /> : null}
    </div>
  );
}

function FnTab() {
  const [ci, setCi] = useState(0);
  const [cpick, setCpick] = useState<Record<string, number>>({});
  const [di, setDi] = useState(0);
  const [xs, setXs] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    DOM_TASKS.forEach((t) => (m[t.id] = 0));
    return m;
  });
  const [visited, setVisited] = useState<Record<string, number[]>>(() => {
    const m: Record<string, number[]> = {};
    DOM_TASKS.forEach((t) => (m[t.id] = [0]));
    return m;
  });
  const [dpick, setDpick] = useState<Record<string, number>>({});

  const card = FN_CARDS[ci];
  const cDone = FN_CARDS.filter((c) => cpick[c.id] === c.answer).map((c) => c.id);
  const cCleared = cpick[card.id] === card.answer;

  const task = DOM_TASKS[di];
  const dDone = DOM_TASKS.filter((t) => dpick[t.id] === t.answer).map((t) => t.id);
  const dCleared = dpick[task.id] === task.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">⚙️ 이 함수는 무리함수일까?</p>
          <Chips ids={FN_CARDS.map((c) => c.id)} cur={ci} done={cDone} onPick={setCi} />
        </div>
        <TipBox>
          📖 <Katex expr="f(x)" /> 가 <Katex expr="x" /> 에 대한 무리식인 함수 <Katex expr="y=f(x)" /> 를 <b className="text-emerald-200">무리함수</b>라 해요.
        </TipBox>
        <div className="mt-2 space-y-2">
          <BigTex tex={card.tex} />
          <WideChoices items={FN_CHOICES} pick={cpick[card.id]} answer={card.answer} onPick={(i) => setCpick((m) => ({ ...m, [card.id]: i }))} />
          {cpick[card.id] !== undefined ? <Verdict right={cCleared} why={card.why} hint={card.choiceWhy[cpick[card.id]]} /> : null}
        </div>
        {cCleared && ci < FN_CARDS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setCi((v) => v + 1)} label="다음 함수 ▶" />
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎯 정의역과 치역 찾기</p>
          <Chips ids={DOM_TASKS.map((t) => t.id)} cur={di} done={dDone} onPick={setDi} />
        </div>
        <TipBox>
          📖 정의역이 따로 주어지지 않으면 <b className="text-sky-200">근호 안의 값이 0 이상</b>이 되는 실수 전체가 정의역이에요. 치역은 근호 앞의 부호와 뒤에 더한 수가 함께 정합니다.
        </TipBox>
        <div className="mt-2">
          <DomCard
            task={task}
            x={xs[task.id]}
            onX={(v) => {
              setXs((m) => ({ ...m, [task.id]: v }));
              setVisited((m) => (m[task.id].includes(v) ? m : { ...m, [task.id]: [...m[task.id], v] }));
            }}
            visited={visited[task.id]}
            pick={dpick[task.id]}
            onPick={(i) => setDpick((m) => ({ ...m, [task.id]: i }))}
          />
        </div>
        {dCleared && di < DOM_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setDi((v) => v + 1)} label="다음 함수 ▶" />
          </div>
        ) : null}
      </div>

      {cDone.length === FN_CARDS.length && dDone.length === DOM_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 무리함수를 모두 살펴봤어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            정의역은 <b className="text-white">근호 안이 0 이상</b>인 곳, 치역은 <b className="text-white">근호의 값 0 이상</b>에서 출발해 앞의 부호로 뒤집히고 뒤에 더한 수만큼 옮겨집니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 일상생활 속 무리함수
// ══════════════════════════════════════════════════════════════
/** 그네 — 줄 길이에 맞춰 늘어나고, 한 번 왕복하는 데 걸리는 시간(2√x 초)으로 흔들린다. */
function SwingViz({ x, period }: { x: number; period: number }) {
  const len = swingLen(x, 6);
  const a = SWING.amp;
  const px = SWING.px;
  const py = SWING.py;
  return (
    <svg viewBox={`0 0 ${SWING.w} ${SWING.h}`} className="mx-auto block w-full max-w-[190px]" role="img" aria-label="그네">
      <rect x={0} y={0} width={SWING.w} height={SWING.h} fill="#020617" rx={12} />
      <line x1={28} y1={py} x2={172} y2={py} stroke="#64748b" strokeWidth={4} strokeLinecap="round" />
      <line x1={34} y1={py} x2={20} y2={150} stroke="#475569" strokeWidth={3} strokeLinecap="round" />
      <line x1={166} y1={py} x2={180} y2={150} stroke="#475569" strokeWidth={3} strokeLinecap="round" />
      <line x1={12} y1={150} x2={188} y2={150} stroke="#334155" strokeWidth={2} />
      {/* 흔들리는 부분 — key 를 바꿔 주기가 달라지면 처음부터 다시 흔들리게 한다 */}
      <g key={`${x}`}>
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          values={`${-a} ${px} ${py};${a} ${px} ${py};${-a} ${px} ${py}`}
          keyTimes="0;0.5;1"
          calcMode="spline"
          keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
          dur={`${period.toFixed(2)}s`}
          repeatCount="indefinite"
        />
        <line x1={px} y1={py} x2={px} y2={py + len} stroke="#a3e635" strokeWidth={2} />
        <rect x={px - 13} y={py + len - 4} width={26} height={7} rx={3} fill="#4d7c0f" stroke="#a3e635" strokeWidth={1.4} />
        <circle cx={px} cy={py + len - 12} r={5} fill="#facc15" />
      </g>
      <text x={100} y={16} fontSize={11} fontWeight={700} textAnchor="middle" fill="#cbd5e1">
        줄 {x} m · 왕복 {period.toFixed(2)} 초
      </text>
      <text x={100} y={166} fontSize={10} textAnchor="middle" fill="#64748b">
        줄이 길수록 천천히 흔들려요
      </text>
    </svg>
  );
}

/** 지평선 — 둥근 지구 위 높이 x 인 탑에서 그은 접선이 지면에 닿는 곳까지가 보이는 거리 */
function HorizonViz({ x, xMax }: { x: number; xMax: number }) {
  const g = horizonGeom(x, xMax);
  const ship = horizonShip(x, xMax);
  const R = HORIZON.R;
  const arc = `M ${HORIZON.cx} ${HORIZON.cy - R} A ${R} ${R} 0 0 1 ${g.px.toFixed(2)} ${g.py.toFixed(2)}`;
  return (
    <svg viewBox={`0 0 ${HORIZON.w} ${HORIZON.h}`} className="mx-auto block w-full max-w-[190px]" role="img" aria-label="지평선까지 보이는 거리">
      <rect x={0} y={0} width={HORIZON.w} height={HORIZON.h} fill="#020617" rx={12} />
      <circle cx={HORIZON.cx} cy={HORIZON.cy} r={R} fill="#0b2545" stroke="#334155" strokeWidth={1.4} />

      {/* 지평선 너머의 배 — 시선에 가려 보이지 않는다 */}
      <g opacity={0.45}>
        <path
          d={`M ${ship.x - 7} ${ship.y} l 14 0 l -3 5 l -8 0 z`}
          fill="#475569"
          transform={`rotate(${(g.alpha + 0.3) * (180 / Math.PI)} ${HORIZON.cx} ${HORIZON.cy})`}
        />
        <line
          x1={ship.x}
          y1={ship.y}
          x2={ship.x}
          y2={ship.y - 9}
          stroke="#475569"
          strokeWidth={1.6}
          transform={`rotate(${(g.alpha + 0.3) * (180 / Math.PI)} ${HORIZON.cx} ${HORIZON.cy})`}
        />
      </g>

      {/* 보이는 거리 — 지면을 따라 난 호 */}
      <path d={arc} fill="none" stroke="#38bdf8" strokeWidth={4} strokeLinecap="round" />

      {/* 탑 */}
      <rect x={HORIZON.cx - 4} y={g.ty} width={8} height={g.h} fill="#1e293b" stroke="#cbd5e1" strokeWidth={1.3} />
      <circle cx={HORIZON.cx} cy={g.ty} r={4} fill="#facc15" />

      {/* 시선 */}
      <line x1={HORIZON.cx} y1={g.ty} x2={g.px} y2={g.py} stroke="#facc15" strokeWidth={1.5} strokeDasharray="4 3" />
      <circle cx={g.px} cy={g.py} r={3.4} fill="#38bdf8" stroke="#020617" strokeWidth={1} />

      <text x={HORIZON.cx - 8} y={g.ty + g.h / 2} fontSize={10.5} fontWeight={700} textAnchor="end" fill="#e2e8f0">
        {x} m
      </text>
      <text x={g.px + 6} y={g.py + 3} fontSize={10} fontWeight={700} fill="#7dd3fc">
        지평선
      </text>
      <text x={100} y={14} fontSize={10.5} fontWeight={700} textAnchor="middle" fill="#fcd34d">
        노란 점선이 눈에 닿는 끝
      </text>
      <text x={100} y={164} fontSize={10} textAnchor="middle" fill="#64748b">
        하늘색 호가 보이는 거리 · 회색 배는 너머라 안 보여요
      </text>
    </svg>
  );
}

function TentViz({ x }: { x: number }) {
  const s = 108 / 8;
  const h = Math.max(2, x * s);
  const w = 3 * s;
  const bx = 52;
  const by = 132;
  return (
    <svg viewBox="0 0 200 170" className="mx-auto block w-full max-w-[190px]" role="img" aria-label="텐트 줄">
      <rect x={0} y={0} width={200} height={170} fill="#020617" rx={12} />
      <line x1={20} y1={by} x2={180} y2={by} stroke="#475569" strokeWidth={2} />
      <line x1={bx} y1={by} x2={bx} y2={by - h} stroke="#94a3b8" strokeWidth={4} />
      <line x1={bx} y1={by - h} x2={bx + w} y2={by} stroke="#f472b6" strokeWidth={2.4} />
      <line x1={bx} y1={by} x2={bx + w} y2={by} stroke="#38bdf8" strokeWidth={2.4} />
      <path d={`M ${bx} ${by - 12} l 12 0 l 0 12`} fill="none" stroke="#64748b" strokeWidth={1.2} />
      <circle cx={bx + w} cy={by} r={4} fill="#1e293b" stroke="#94a3b8" strokeWidth={1.4} />
      <text x={bx - 6} y={by - h / 2} fontSize={10.5} fontWeight={700} textAnchor="end" fill="#cbd5e1">
        {x} m
      </text>
      <text x={bx + w / 2} y={by + 16} fontSize={10.5} fontWeight={700} textAnchor="middle" fill="#7dd3fc">
        3 m
      </text>
      <text x={100} y={16} fontSize={11} fontWeight={700} textAnchor="middle" fill="#f9a8d4">
        분홍색이 줄의 길이
      </text>
    </svg>
  );
}

function LifePlot({ cs, x, visited }: { cs: LifeCase; x: number; visited: number[] }) {
  const px = (t: number) => PLOT.left + (t / cs.xMax) * (PLOT.right - PLOT.left);
  const py = (t: number) => PLOT.bottom - (t / cs.yMax) * (PLOT.bottom - PLOT.top);
  const cx = px(x);
  const cy = py(cs.valueOf(x));
  return (
    <svg viewBox={`0 0 ${PLOT.w} ${PLOT.h}`} className="mx-auto block w-full" role="img" aria-label="값의 변화를 찍은 좌표평면">
      <rect x={0} y={0} width={PLOT.w} height={PLOT.h} fill="#020617" rx={12} />
      {cs.yTicks.map((t) => (
        <g key={"y" + t}>
          <line x1={PLOT.left} y1={py(t)} x2={PLOT.right} y2={py(t)} stroke="#1e293b" strokeWidth={1} />
          <text x={PLOT.left - 6} y={py(t) + 4} fontSize={12} textAnchor="end" fill="#64748b" fontFamily="ui-monospace, monospace">
            {t}
          </text>
        </g>
      ))}
      {cs.xTicks.map((t) => (
        <g key={"x" + t}>
          <line x1={px(t)} y1={PLOT.top} x2={px(t)} y2={PLOT.bottom} stroke="#1e293b" strokeWidth={1} />
          <text x={px(t)} y={PLOT.bottom + 16} fontSize={12} textAnchor="middle" fill="#64748b" fontFamily="ui-monospace, monospace">
            {t}
          </text>
        </g>
      ))}
      <line x1={PLOT.left} y1={PLOT.top - 6} x2={PLOT.left} y2={PLOT.bottom} stroke="#64748b" strokeWidth={1.6} />
      <line x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right + 6} y2={PLOT.bottom} stroke="#64748b" strokeWidth={1.6} />
      <text x={4} y={14} fontSize={11} fontWeight={700} fill="#94a3b8">
        {cs.yName}
      </text>
      <text x={PLOT.right} y={PLOT.h - 6} fontSize={11} fontWeight={700} textAnchor="end" fill="#94a3b8">
        {cs.xName}
      </text>
      {visited.map((v) => (
        <circle key={v} cx={px(v)} cy={py(cs.valueOf(v))} r={2.6} fill="#34d399" fillOpacity={0.55} />
      ))}
      <line x1={cx} y1={cy} x2={cx} y2={PLOT.bottom} stroke="#f472b6" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={PLOT.left} y1={cy} x2={cx} y2={cy} stroke="#f472b6" strokeWidth={1} strokeDasharray="3 3" />
      <circle cx={cx} cy={cy} r={4.6} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
    </svg>
  );
}

function LifePanel({
  cs,
  x,
  onX,
  visited,
  picks,
  onPick,
}: {
  cs: LifeCase;
  x: number;
  onX: (v: number) => void;
  visited: number[];
  picks: Record<string, number>;
  onPick: (qi: number, i: number) => void;
}) {
  const v = cs.valueOf(x);
  const q0 = picks[`${cs.id}:0`] === cs.qs[0].answer;
  const allDone = q0 && picks[`${cs.id}:1`] === cs.qs[1].answer;

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
        <p className="text-[13px] font-bold text-slate-100">
          {cs.icon} {cs.title}
        </p>
        <div className="mt-1 space-y-0.5 text-[12px] leading-6 text-slate-300">
          {cs.story.map((s) => (
            <p key={s}>{s}</p>
          ))}
        </div>
      </div>

      <Slider label={cs.xLabel + " ="} value={x} min={cs.min} max={cs.max} step={cs.step} onChange={onX} accent="accent-pink-400" show={`${x} ${cs.xUnit}`} />

      <div className="grid gap-2 sm:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-3 sm:col-span-2">
          {cs.id === "W1" ? <SwingViz x={x} period={v} /> : null}
          {cs.id === "W2" ? <HorizonViz x={x} xMax={cs.max} /> : null}
          {cs.id === "W3" ? <TentViz x={x} /> : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-lg border border-pink-400/40 bg-pink-400/15 px-2.5 py-1.5 text-[12px] font-bold text-pink-100">
              {cs.yLabel} <span className="font-mono text-[14px] text-white">{fmt(v, cs.digits)}</span> {cs.yUnit}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-2 py-3 sm:col-span-3">
          <LifePlot cs={cs} x={x} visited={visited} />
          <p className="mt-1 text-center text-[11px] leading-6 text-slate-500">움직인 자리마다 점이 찍혀요. 처음엔 가파르다가 점점 눕습니다.</p>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
        <p className="text-[13px] font-bold text-slate-100">{cs.qs[0].prompt}</p>
        <MixedChoices items={cs.qs[0].choices} pick={picks[`${cs.id}:0`]} answer={cs.qs[0].answer} onPick={(i) => onPick(0, i)} />
        {picks[`${cs.id}:0`] !== undefined ? <Verdict right={q0} why={cs.qs[0].why} hint={cs.qs[0].choiceWhy[picks[`${cs.id}:0`]]} /> : null}
      </div>

      {q0 ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
          <p className="text-[13px] font-bold text-slate-100">{cs.qs[1].prompt}</p>
          <MixedChoices items={cs.qs[1].choices} pick={picks[`${cs.id}:1`]} answer={cs.qs[1].answer} onPick={(i) => onPick(1, i)} />
          {picks[`${cs.id}:1`] !== undefined ? <Verdict right={allDone} why={cs.qs[1].why} hint={cs.qs[1].choiceWhy[picks[`${cs.id}:1`]]} /> : null}
        </div>
      ) : null}

      {allDone ? (
        <div className="rounded-xl border-2 border-emerald-400/45 bg-emerald-400/12 px-3 py-3">
          <div className="flex justify-center py-1 text-[18px] text-emerald-100">
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
  const [visited, setVisited] = useState<Record<string, number[]>>(() => {
    const m: Record<string, number[]> = {};
    LIFE_CASES.forEach((c) => (m[c.id] = [c.init]));
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
        <p className="text-sm font-bold text-slate-100">🛝 일상생활에서 만나는 무리함수</p>
        <TipBox>
          📖 <b className="text-emerald-200">네 배가 되어야 두 배</b>가 되는 관계는 거의 다 무리함수예요. 슬라이더를 움직여 값이 어떻게 늘어나는지 살펴보세요.
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
          onX={(v) => {
            setXs((m) => ({ ...m, [cs.id]: v }));
            setVisited((m) => (m[cs.id].includes(v) ? m : { ...m, [cs.id]: [...m[cs.id], v] }));
          }}
          visited={visited[cs.id]}
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
            무리함수는 <b className="text-white">처음엔 빠르게 늘다가 점점 더디게</b> 늘어요. 그래서 값을 두 배로 만들려면 x 를 네 배로 키워야 합니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
