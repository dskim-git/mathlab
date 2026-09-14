"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CALC_TASKS,
  DOM_TASKS,
  DOM_X,
  EXPR_CARDS,
  EXPR_CHOICES,
  FN_CARDS,
  FN_CHOICES,
  FN_MAP_LABELS,
  FN_X,
  LIFE_CASES,
  LINE,
  MAP,
  MAP_LABEL_FS,
  PLOT,
  PROPS,
  PROP_X,
  type CalcTask,
  type DomTask,
  type ExprCard,
  type FnCard,
  type LifeCase,
  type Piece,
  type PropCard,
  type Zone,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "poly_in_rational",
    prompt:
      "다항식과 유리식의 포함 관계를 활동에서 본 식을 예로 들어 설명해 보세요. 분수 꼴인데도 다항식인 식과, 분수 꼴이 아닌데도 유리식이 아닌 식을 함께 들어 보세요.",
    kind: "text",
    placeholder:
      "예: 모든 다항식은 A/1 로 쓸 수 있으므로 다항식은 모두 유리식이다. (2x−5)/7 은 분수 꼴이지만 분모가 상수라 각 항을 7 로 나눈 다항식과 같다. 거꾸로 5/x 는 분모에 문자가 있어 다항식이 아닌 유리식이다. √x+1 은 분수 꼴이 아니지만 문자가 근호 안에 있어 두 다항식의 비로 쓸 수 없으므로 유리식조차 아니다.",
  },
  {
    id: "domain_rule",
    prompt:
      "유리함수의 정의역을 구할 때 무엇을 보아야 하는지 설명하고, 분모에 문자가 있는데도 정의역이 실수 전체가 되는 경우를 예를 들어 써 보세요.",
    kind: "text",
    placeholder:
      "예: 정의역이 따로 주어지지 않으면 분모가 0 이 되지 않는 실수 전체가 정의역이므로 분모를 0 으로 만드는 x 를 찾아 빼면 된다. 3/(x²−16) 은 x = ±4 둘을 빼고, 2/(x−3)² 은 중근이라 x = 3 하나만 뺀다. 그런데 6/(x²+1) 은 x² ≥ 0 이라 분모가 1 보다 작아질 수 없어 0 이 되지 않으므로 정의역이 실수 전체다.",
  },
  {
    id: "life_rational",
    prompt:
      "일상생활에서 유리함수로 나타나는 상황을 하나 골라, 식이 어떻게 세워지는지와 x 가 커질 때 값이 어떻게 변하는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 공책 x 권을 살 때 낸 돈 전체는 1200x+2500 원인데 한 권당 값은 그것을 x 로 나눈 (1200x+2500)/x 원이다. 앞의 것은 다항함수지만 뒤의 것은 분모에 문자가 있어 유리함수다. 많이 살수록 배송비 2500 원이 잘게 나뉘어 한 권당 값이 1200 원에 가까워지지만 1200 원 아래로는 내려가지 않는다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "expr" | "calc" | "fn" | "domain" | "life";

const ABC = ["①", "②", "③", "④"];

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition " +
        (active ? "border-violet-400/60 bg-violet-400/15 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
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
              ? "border-violet-400/70 bg-violet-400/20 text-violet-100"
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
      className="w-full rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-3 py-2.5 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25"
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

function PieceLine({ items, className }: { items: Piece[]; className?: string }) {
  return (
    <p className={"flex flex-wrap items-baseline gap-x-1 gap-y-1 " + (className ?? "")}>
      <PieceText items={items} />
    </p>
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
  accent = "accent-violet-400",
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

/** 자릿수 맞춘 수 표기(세 자리마다 쉼표). 로케일에 기대지 않아 SSR 과 값이 어긋나지 않는다. */
function fmtNum(v: number, digits: number): string {
  const n = Number(v.toFixed(digits));
  const [i, f] = String(n).split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (f ? "." + f : "");
}

/** 세로로 쌓는 한글 보기 */
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

// ══════════════════════════════════════════════════════════════
// 중첩 상자 지도 (탭 ① · ③ 공용)
// ══════════════════════════════════════════════════════════════
const ZONE_TONE: Record<Zone, { stroke: string; text: string }> = {
  outer: { stroke: "#64748b", text: "#cbd5e1" },
  rational: { stroke: "#38bdf8", text: "#7dd3fc" },
  poly: { stroke: "#34d399", text: "#6ee7b7" },
  const: { stroke: "#fbbf24", text: "#fcd34d" },
};

/** 고른 식(함수)이 앉는 고리가 빛나는 중첩 상자 지도 */
function MapDiagram({ labels, highlight }: { labels: Record<Zone, string>; highlight?: Zone | null }) {
  return (
    <svg
      viewBox={`0 0 ${MAP.w} ${MAP.h}`}
      className="mx-auto block w-full max-w-[330px]"
      role="img"
      aria-label="포함 관계 지도"
    >
      <rect x={0} y={0} width={MAP.w} height={MAP.h} fill="#020617" rx={12} />
      {MAP.boxes.map((b) => {
        const on = highlight === b.key;
        return (
          <g key={b.key}>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={16}
              fill={ZONE_TONE[b.key].stroke}
              fillOpacity={on ? 0.18 : 0}
              stroke={ZONE_TONE[b.key].stroke}
              strokeOpacity={on ? 1 : 0.5}
              strokeWidth={on ? 3 : 1.6}
            />
            <text
              x={b.lx}
              y={b.ly}
              fontSize={MAP_LABEL_FS}
              fontWeight={on ? 800 : 700}
              fill={on ? "#ffffff" : ZONE_TONE[b.key].text}
            >
              {labels[b.key]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function RationalBasicsLab() {
  const [tab, setTab] = useState<Tab>("expr");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-violet-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">➗ 유리식과 유리함수</h3>
        <p className="mt-2 leading-7 text-slate-300">
          분모에 <b className="text-sky-200">문자</b>가 들어오는 순간 식과 함수의 세계가 한 겹 넓어집니다. 직접 나누어 보고 계산해 보며 그 경계를 찾아보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "expr"} onClick={() => setTab("expr")}>
          ① 식의 나라 지도 🗺️
        </TabButton>
        <TabButton active={tab === "calc"} onClick={() => setTab("calc")}>
          ② 유리식 계산소 🧮
        </TabButton>
        <TabButton active={tab === "fn"} onClick={() => setTab("fn")}>
          ③ 함수 기계 ⚙️
        </TabButton>
        <TabButton active={tab === "domain"} onClick={() => setTab("domain")}>
          ④ 정의역 구멍 사냥 🕳️
        </TabButton>
        <TabButton active={tab === "life"} onClick={() => setTab("life")}>
          ⑤ 일상생활 속 유리함수 🚲
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "expr" ? <ExprTab /> : null}
        {tab === "calc" ? <CalcTab /> : null}
        {tab === "fn" ? <FnTab /> : null}
        {tab === "domain" ? <DomainTab /> : null}
        {tab === "life" ? <LifeTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 식의 나라 지도
// ══════════════════════════════════════════════════════════════
function ExprQuizCard({
  card,
  pick,
  onPick,
}: {
  card: ExprCard;
  pick: number | undefined;
  onPick: (i: number) => void;
}) {
  const right = pick === card.answer;
  return (
    <div className="space-y-2">
      <div className="flex min-h-[72px] items-center justify-center rounded-xl border border-white/10 bg-black/30 px-3 py-4 text-[22px]">
        <span className="min-w-0 py-1">
          <Katex expr={card.tex} />
        </span>
      </div>
      <p className="text-[13px] font-bold text-slate-100">이 식은 어디에 앉을까요?</p>
      <WideChoices items={EXPR_CHOICES} pick={pick} answer={card.answer} onPick={onPick} />
      {pick !== undefined ? <Verdict right={right} why={card.why} hint={card.choiceWhy[pick]} /> : null}
    </div>
  );
}

function ExprTab() {
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const card = EXPR_CARDS[qi];
  const doneIds = EXPR_CARDS.filter((c) => pick[c.id] === c.answer).map((c) => c.id);
  const cleared = pick[card.id] === card.answer;

  const shown = cleared ? card.zone : null;
  const all = doneIds.length === EXPR_CARDS.length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🗺️ 식의 나라 지도</p>
        <TipBox>
          📖 <b className="text-emerald-200">다항식</b>은 항의 합으로 이루어진 식, <b className="text-sky-200">유리식</b>은 두 다항식의 비{" "}
          <Katex expr="\dfrac{A}{B}\,(B\neq 0)" /> 로 나타나는 식이에요. 다항식 <Katex expr="A" /> 는 모두{" "}
          <Katex expr="\dfrac{A}{1}" /> 로 쓸 수 있으니 <b className="text-white">다항식은 모두 유리식</b>입니다.
        </TipBox>
        <div className="mt-2">
          <MapDiagram labels={{ outer: "식", rational: "유리식", poly: "다항식", const: "상수" }} highlight={shown} />
        </div>
        <p className="mt-1 text-center text-[11px] text-slate-500">
          {cleared ? "고른 식이 앉는 가장 안쪽 고리가 빛나요" : "판정을 맞히면 이 식이 앉을 고리가 빛납니다"}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔍 이 식은 어떤 식일까요?</p>
          <Chips ids={EXPR_CARDS.map((c) => c.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <ExprQuizCard card={card} pick={pick[card.id]} onPick={(i) => setPick((m) => ({ ...m, [card.id]: i }))} />
        </div>
        {cleared && qi < EXPR_CARDS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {all ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 열두 식을 모두 가렸어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            분모가 <b className="text-white">상수</b>면 다항식, 분모에 <b className="text-white">문자</b>가 들어오면 다항식이 아닌 유리식, 문자가{" "}
            <b className="text-white">근호 안이나 지수 자리</b>에 있으면 유리식조차 아니에요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 유리식 계산소
// ══════════════════════════════════════════════════════════════
function PropLab({ prop, x, onX }: { prop: PropCard; x: number; onX: (v: number) => void }) {
  const l = prop.leftF(x);
  const r = prop.rightF(x);
  const both = l !== null && r !== null;
  const same = both && Math.abs(l - r) < 1e-9;

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
        <p className="text-[11px] font-bold text-amber-200">{prop.no}</p>
        <p className="mt-0.5 text-[13px] font-bold text-slate-100">{prop.title}</p>
        <div className="mt-1.5 flex justify-center py-1 text-[17px]">
          <span className="min-w-0">
            <Katex expr={prop.lawTex} />
          </span>
        </div>
      </div>

      <Slider
        label="x ="
        value={x}
        min={PROP_X.min}
        max={PROP_X.max}
        step={PROP_X.step}
        onChange={onX}
        accent="accent-amber-400"
      />

      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-2.5 py-2.5">
          <p className="text-[10px] font-bold text-sky-300">왼쪽 식</p>
          <div className="mt-1 flex min-h-[42px] items-center py-1 text-[15px]">
            <span className="min-w-0">
              <Katex expr={prop.exLeftTex} />
            </span>
          </div>
          <p className={"mt-1 font-mono text-[15px] font-bold " + (l === null ? "text-rose-300" : "text-sky-100")}>
            {l === null ? "값 없음" : fmtNum(l, 4)}
          </p>
        </div>
        <div className="rounded-xl border border-pink-400/30 bg-pink-400/10 px-2.5 py-2.5">
          <p className="text-[10px] font-bold text-pink-300">오른쪽 식</p>
          <div className="mt-1 flex min-h-[42px] items-center py-1 text-[15px]">
            <span className="min-w-0">
              <Katex expr={prop.exRightTex} />
            </span>
          </div>
          <p className={"mt-1 font-mono text-[15px] font-bold " + (r === null ? "text-rose-300" : "text-pink-100")}>
            {r === null ? "값 없음" : fmtNum(r, 4)}
          </p>
        </div>
      </div>

      <p
        className={
          "rounded-lg px-3 py-2 text-[12px] leading-6 " +
          (same
            ? "bg-emerald-400/12 text-emerald-100"
            : both
              ? "bg-rose-400/10 text-rose-100"
              : "bg-amber-400/12 text-amber-100")
        }
      >
        {same
          ? "✅ 두 식의 값이 똑같아요. 위아래에 같은 것을 곱하거나 나누어도 값은 그대로입니다."
          : both
            ? "❌ 두 식의 값이 다릅니다."
            : "⚠️ 한쪽 식만 값을 잃었어요. 여기서는 두 식이 같다고 말할 수 없습니다."}
      </p>

      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[12px] text-slate-200">
          <Katex expr={prop.cTex} />
        </span>
        <span className="min-w-0">{prop.note}</span>
      </div>
    </div>
  );
}

function CalcCard({
  task,
  picks,
  onPick,
}: {
  task: CalcTask;
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
          <Katex expr={task.exprTex} />
        </span>
      </div>

      {task.steps.map((s, si) => {
        if (!allDone && si > open) return null;
        const pick = picks[`${task.id}:${si}`];
        const right = pick === s.answer;
        return (
          <div key={task.id + si} className="space-y-1.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="rounded-md border border-amber-400/40 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-100">
                {s.badge}
              </span>
              <PieceLine items={s.q} className="text-[13px] font-bold text-slate-100" />
            </div>
            <TexChoices items={s.choices} pick={pick} answer={s.answer} onPick={(i) => onPick(si, i)} />
            {pick !== undefined ? <Verdict right={right} why={s.why} hint={s.choiceWhy[pick]} /> : null}
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
  const [x, setX] = useState(PROP_X.init);
  const [qi, setQi] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});

  const task = CALC_TASKS[qi];
  const isDone = (t: CalcTask) => t.steps.every((s, si) => picks[`${t.id}:${si}`] === s.answer);
  const doneIds = CALC_TASKS.filter(isDone).map((t) => t.id);
  const cleared = isDone(task);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🔬 유리식의 성질 실험대</p>
        <TipBox>
          📖 세 다항식 <Katex expr="A,\ B,\ C\,(C\neq 0)" /> 에 대하여 성립하는 네 가지예요. 슬라이더로{" "}
          <Katex expr="x" /> 를 움직여 두 식의 값을 견주어 보세요.
        </TipBox>
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
          <PropLab prop={PROPS[pi]} x={x} onX={setX} />
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
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === CALC_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            통분과 약분은 모두 <b className="text-white">위아래에 같은 것을 곱하거나 나누는 일</b>이에요. 계산 결과가 다항식이 되더라도 처음부터 넣을 수 없던 수는 그대로 빠져 있습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 함수 기계
// ══════════════════════════════════════════════════════════════
function FnMachine({ card, x, onX }: { card: FnCard; x: number; onX: (v: number) => void }) {
  const y = card.f(x);
  return (
    <div className="space-y-2">
      <Slider label="넣는 수 x =" value={x} min={FN_X.min} max={FN_X.max} step={FN_X.step} onChange={onX} accent="accent-sky-400" />
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
        <span className="inline-flex h-11 min-w-[3.5rem] items-center justify-center rounded-xl border-2 border-sky-400/50 bg-sky-400/15 px-2 font-mono text-[15px] font-bold text-sky-100">
          {x}
        </span>
        <span className="text-slate-500">▶</span>
        <span className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-violet-400/50 bg-violet-400/15 px-3 py-1 text-[15px] text-violet-100">
          <span className="min-w-0">
            <Katex expr={card.tex} />
          </span>
        </span>
        <span className="text-slate-500">▶</span>
        <span
          className={
            "inline-flex h-11 min-w-[4.5rem] items-center justify-center rounded-xl border-2 px-2 font-mono text-[15px] font-bold " +
            (y === null ? "border-rose-400/60 bg-rose-400/15 text-rose-100" : "border-emerald-400/50 bg-emerald-400/15 text-emerald-100")
          }
        >
          {y === null ? "✖ 없음" : fmtNum(y, 3)}
        </span>
      </div>
      <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
        정의역 · <span className="font-bold text-slate-200">{card.domain}</span>
        {card.bad.length ? " — 분모가 0 이 되는 수를 넣으면 기계가 멈춰요." : ""}
      </p>
    </div>
  );
}

function FnTab() {
  const [ci, setCi] = useState(0);
  const [x, setX] = useState(FN_X.init);
  const [pick, setPick] = useState<Record<string, number>>({});

  const card = FN_CARDS[ci];
  const doneIds = FN_CARDS.filter((c) => pick[c.id] === c.answer).map((c) => c.id);
  const cleared = pick[card.id] === card.answer;
  const shown = cleared ? card.ring : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">⚙️ 함수의 나라 지도</p>
        <TipBox>
          📖 <Katex expr="f(x)" /> 가 유리식인 함수 <Katex expr="y=f(x)" /> 를 <b className="text-sky-200">유리함수</b>,{" "}
          <Katex expr="f(x)" /> 가 <Katex expr="x" /> 에 대한 다항식이면 <b className="text-emerald-200">다항함수</b>라 해요. 식의 나라와 똑같은 모양입니다.
        </TipBox>
        <div className="mt-2">
          <MapDiagram labels={FN_MAP_LABELS} highlight={shown} />
        </div>
        <p className="mt-1 text-center text-[11px] text-slate-500">
          {cleared ? "고른 함수가 앉는 가장 안쪽 고리가 빛나요" : "판정을 맞히면 이 함수가 앉을 고리가 빛납니다"}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔎 함수를 골라 넣어 보기</p>
          <Chips ids={FN_CARDS.map((c) => c.id)} cur={ci} done={doneIds} onPick={setCi} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FN_CARDS.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCi(i)}
              className={
                "rounded-lg border-2 px-2.5 py-1.5 text-[13px] transition " +
                (i === ci
                  ? "border-violet-400/70 bg-violet-400/20 text-violet-100"
                  : doneIds.includes(c.id)
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              <span className="min-w-0">
                <Katex expr={c.tex} />
              </span>
            </button>
          ))}
        </div>
        <div className="mt-2">
          <FnMachine card={card} x={x} onX={setX} />
        </div>
        <div className="mt-2 space-y-2">
          <p className="text-[13px] font-bold text-slate-100">이 함수가 앉을 가장 안쪽 고리는?</p>
          <WideChoices
            items={FN_CHOICES}
            pick={pick[card.id]}
            answer={card.answer}
            onPick={(i) => setPick((m) => ({ ...m, [card.id]: i }))}
          />
          {pick[card.id] !== undefined ? (
            <Verdict right={cleared} why={card.why} hint={card.choiceWhy[pick[card.id]]} />
          ) : null}
        </div>
        {cleared && ci < FN_CARDS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setCi((k) => k + 1)} label="다음 함수 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === FN_CARDS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여덟 함수를 모두 가렸어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <b className="text-white">모든 다항함수는 유리함수</b>이지만 거꾸로는 아니에요. 상수함수는 다항함수 가운데 가장 단순한 경우라 맨 안쪽에 앉습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 정의역 구멍 사냥
// ══════════════════════════════════════════════════════════════
const TICKS = Array.from({ length: 17 }, (_, i) => i - 8);

function sxOf(x: number): number {
  return LINE.left + ((x - LINE.x0) / (LINE.x1 - LINE.x0)) * (LINE.right - LINE.left);
}

function HoleLine({ task, x, found }: { task: DomTask; x: number; found: number[] }) {
  const px = sxOf(x);
  const onHole = task.holes.some((h) => Math.abs(h - x) < 1e-9);
  return (
    <svg viewBox={`0 0 ${LINE.w} ${LINE.h}`} className="w-full" role="img" aria-label="정의역 수직선">
      <rect x={0} y={0} width={LINE.w} height={LINE.h} fill="#020617" rx={12} />
      <line x1={LINE.left - 14} y1={LINE.y} x2={LINE.right + 14} y2={LINE.y} stroke="#475569" strokeWidth={2} />
      {TICKS.map((t) => (
        <g key={t}>
          <line x1={sxOf(t)} y1={LINE.y - 5} x2={sxOf(t)} y2={LINE.y + 5} stroke="#475569" strokeWidth={1.2} />
          {t % 2 === 0 ? (
            <text x={sxOf(t)} y={LINE.y + 20} fontSize={10} textAnchor="middle" fill="#64748b" fontFamily="ui-monospace, monospace">
              {t}
            </text>
          ) : null}
        </g>
      ))}
      {found.map((h) => (
        <g key={h}>
          <circle cx={sxOf(h)} cy={LINE.y} r={6} fill="#020617" stroke="#fb7185" strokeWidth={2.4} />
          <text x={sxOf(h)} y={LINE.y + 40} fontSize={11} fontWeight={700} textAnchor="middle" fill="#fda4af">
            {task.holeLabels[task.holes.indexOf(h)] ?? h}
          </text>
        </g>
      ))}
      <line x1={px} y1={26} x2={px} y2={LINE.y - 8} stroke={onHole ? "#fb7185" : "#a78bfa"} strokeWidth={1.4} strokeDasharray="3 3" />
      <circle cx={px} cy={LINE.y} r={5} fill={onHole ? "#fb7185" : "#a78bfa"} />
      <text x={px} y={20} fontSize={11} fontWeight={700} textAnchor="middle" fill={onHole ? "#fda4af" : "#c4b5fd"}>
        {x}
      </text>
    </svg>
  );
}

function DomainCard({
  task,
  x,
  onX,
  found,
  huntDone,
  onHunt,
  onNone,
  flash,
  pick,
  onPick,
}: {
  task: DomTask;
  x: number;
  onX: (v: number) => void;
  found: number[];
  huntDone: boolean;
  onHunt: () => void;
  onNone: () => void;
  flash: string;
  pick: number | undefined;
  onPick: (i: number) => void;
}) {
  const dv = task.denomF(x);
  const right = pick === task.answer;

  return (
    <div className="space-y-2">
      <div className="flex min-h-[68px] items-center justify-center rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-[20px]">
        <span className="min-w-0 py-1">
          <Katex expr={task.fnTex} />
        </span>
      </div>

      <Slider label="x =" value={x} min={DOM_X.min} max={DOM_X.max} step={DOM_X.step} onChange={onX} accent="accent-rose-400" />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
        <span className="text-[11px] font-bold text-slate-400">분모</span>
        <span className="min-w-0 py-0.5 text-[15px]">
          <Katex expr={task.denomTex} />
        </span>
        <span className="text-slate-500">=</span>
        <span
          className={
            "rounded-lg px-2.5 py-1 font-mono text-[15px] font-bold " +
            (Math.abs(dv) < 1e-9 ? "bg-rose-400/20 text-rose-100" : "bg-white/10 text-slate-100")
          }
        >
          {fmtNum(dv, 2)}
        </span>
        {Math.abs(dv) < 1e-9 ? <span className="text-[11px] font-bold text-rose-200">⚠️ 분모가 0!</span> : null}
      </div>

      <HoleLine task={task} x={x} found={found} />

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onHunt}
          disabled={huntDone}
          className="rounded-xl border-2 border-rose-400/55 bg-rose-400/15 px-3 py-2.5 text-[13px] font-bold text-rose-100 transition hover:bg-rose-400/25 disabled:opacity-40"
        >
          🕳️ 여기는 값이 없어요!
        </button>
        <button
          type="button"
          onClick={onNone}
          disabled={huntDone}
          className="rounded-xl border-2 border-sky-400/55 bg-sky-400/15 px-3 py-2.5 text-[13px] font-bold text-sky-100 transition hover:bg-sky-400/25 disabled:opacity-40"
        >
          ✅ 그런 자리는 없어요
        </button>
      </div>

      {flash ? <p className="rounded-lg bg-black/30 px-3 py-2 text-[12px] leading-6 text-slate-200">{flash}</p> : null}

      {huntDone ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
          <p className="text-[13px] font-bold text-slate-100">그러면 이 함수의 정의역은?</p>
          <MixedChoices items={task.choices} pick={pick} answer={task.answer} onPick={onPick} />
          {pick !== undefined ? <Verdict right={right} why={task.why} hint={task.choiceWhy[pick]} /> : null}
        </div>
      ) : (
        <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
          🔎 슬라이더를 움직여 분모가 0 이 되는 자리를 모두 찾으면 정의역 문제가 열려요. 찾은 자리 {found.length} 곳.
        </p>
      )}
    </div>
  );
}

function DomainTab() {
  const [ti, setTi] = useState(0);
  const [x, setX] = useState(DOM_X.init);
  const [found, setFound] = useState<Record<string, number[]>>({});
  const [flash, setFlash] = useState<Record<string, string>>({});
  const [pick, setPick] = useState<Record<string, number>>({});

  const task = DOM_TASKS[ti];
  const got = found[task.id] ?? [];
  const doneIds = DOM_TASKS.filter((t) => pick[t.id] === t.answer).map((t) => t.id);
  const cleared = pick[task.id] === task.answer;

  const hunt = () => {
    const hit = task.holes.find((h) => Math.abs(h - x) < 1e-9);
    if (hit === undefined) {
      setFlash((m) => ({
        ...m,
        [task.id]: `❌ x = ${x} 에서는 분모가 ${fmtNum(task.denomF(x), 2)} 이라 값이 잘 나와요. 분모가 0 이 되는 자리를 찾아보세요.`,
      }));
      return;
    }
    if (got.includes(hit)) {
      setFlash((m) => ({ ...m, [task.id]: "이미 찾은 자리예요. 다른 자리도 있을지 살펴보세요." }));
      return;
    }
    const next = [...got, hit].sort((a, b) => a - b);
    setFound((m) => ({ ...m, [task.id]: next }));
    setFlash((m) => ({
      ...m,
      [task.id]:
        next.length === task.holes.length
          ? `⭕ 찾았어요! 분모가 0 이 되는 자리를 모두 찾았습니다. 모두 ${task.holes.length} 곳이에요.`
          : `⭕ 찾았어요! 아직 더 있을지 살펴보세요.`,
    }));
  };

  const none = () => {
    if (task.holes.length === 0) {
      setFound((m) => ({ ...m, [task.id]: [] }));
      setFlash((m) => ({
        ...m,
        [task.id]: "⭕ 맞아요! 이 함수는 분모를 0 으로 만드는 실수가 없어요. 빼야 할 자리가 한 곳도 없습니다.",
      }));
      return;
    }
    setFlash((m) => ({ ...m, [task.id]: "❌ 아니에요. 분모가 0 이 되는 자리가 있습니다. 슬라이더를 더 움직여 보세요." }));
  };

  // 구멍이 없는 문제는 '그런 자리는 없어요' 를 눌러야 열린다(누르기 전에는 found 가 undefined).
  const huntDone = task.holes.length === 0 ? found[task.id] !== undefined : got.length === task.holes.length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🕳️ 정의역에서 빠지는 자리 찾기</p>
        <TipBox>
          📖 정의역이 따로 주어지지 않으면 <b className="text-rose-200">분모가 0 이 되지 않는</b> 실수 전체의 집합을 정의역으로 봐요. 분모를 0 으로 만드는 수가 정의역에서 빠집니다.
        </TipBox>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔦 구멍 사냥</p>
          <Chips ids={DOM_TASKS.map((t) => t.id)} cur={ti} done={doneIds} onPick={setTi} />
        </div>
        <div className="mt-2">
          <DomainCard
            task={task}
            x={x}
            onX={setX}
            found={got}
            huntDone={huntDone}
            onHunt={hunt}
            onNone={none}
            flash={flash[task.id] ?? ""}
            pick={pick[task.id]}
            onPick={(i) => setPick((m) => ({ ...m, [task.id]: i }))}
          />
        </div>
        {cleared && ti < DOM_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setTi((k) => k + 1)} label="다음 함수 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === DOM_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 함수의 정의역을 모두 찾았어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            빠지는 자리의 개수는 <b className="text-white">분모를 0 으로 만드는 실수의 개수</b>와 같아요. 완전제곱식이면 한 곳, 서로 다른 두 인수면 두 곳, 아예 0 이 될 수 없으면 한 곳도 없습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ⑤ 일상생활 속 유리함수
// ══════════════════════════════════════════════════════════════
function NotebookViz({ n }: { n: number }) {
  const books = Array.from({ length: n }, (_, i) => i);
  return (
    <svg viewBox="0 0 360 92" className="w-full" role="img" aria-label="주문한 공책">
      <rect x={0} y={0} width={360} height={92} fill="#020617" rx={12} />
      {books.map((i) => {
        const col = i % 13;
        const row = Math.floor(i / 13);
        const bx = 20 + col * 25;
        const by = 12 + row * 38;
        return (
          <g key={i}>
            <rect x={bx} y={by} width={20} height={30} rx={3} fill="#1e3a8a" stroke="#60a5fa" strokeWidth={1.2} />
            <line x1={bx + 5} y1={by} x2={bx + 5} y2={by + 30} stroke="#93c5fd" strokeWidth={1} />
          </g>
        );
      })}
    </svg>
  );
}

function BeakerViz({ total, conc }: { total: number; conc: number }) {
  const frac = total / 600;
  const top = 138 - frac * 112;
  const op = 0.2 + (conc / 25) * 0.65;
  return (
    <svg viewBox="0 0 200 160" className="mx-auto h-40" role="img" aria-label="소금물 비커">
      <rect x={0} y={0} width={200} height={160} fill="#020617" rx={12} />
      <clipPath id="beakerClip">
        <rect x={51} y={21} width={98} height={117} rx={6} />
      </clipPath>
      <g clipPath="url(#beakerClip)">
        <rect x={51} y={top} width={98} height={140} fill="#38bdf8" fillOpacity={op} />
        <rect x={51} y={top} width={98} height={3} fill="#7dd3fc" />
      </g>
      <rect x={50} y={20} width={100} height={118} rx={7} fill="none" stroke="#94a3b8" strokeWidth={2.4} />
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={150} y1={138 - t * 112} x2={160} y2={138 - t * 112} stroke="#475569" strokeWidth={1.4} />
      ))}
      <text x={100} y={152} fontSize={10} textAnchor="middle" fill="#64748b">
        소금 60 g 은 그대로
      </text>
    </svg>
  );
}

/** 왕복 길 그림 — 값은 아래 좌표평면과 칩에서 읽는다 */
function TripViz({ speed }: { speed: number }) {
  return (
    <svg viewBox="0 0 360 96" className="mx-auto block w-full max-w-[320px]" role="img" aria-label="집과 도서관을 오가는 길">
      <rect x={0} y={0} width={360} height={96} fill="#020617" rx={12} />
      <rect x={8} y={30} width={64} height={34} rx={8} fill="#1e293b" stroke="#64748b" strokeWidth={1.2} />
      <text x={40} y={52} fontSize={13} fontWeight={700} textAnchor="middle" fill="#e2e8f0">
        집
      </text>
      <rect x={288} y={30} width={64} height={34} rx={8} fill="#1e293b" stroke="#64748b" strokeWidth={1.2} />
      <text x={320} y={52} fontSize={13} fontWeight={700} textAnchor="middle" fill="#e2e8f0">
        도서관
      </text>
      <line x1={78} y1={36} x2={278} y2={36} stroke="#38bdf8" strokeWidth={2.4} />
      <path d="M278 36 l-8 -4 l0 8 z" fill="#38bdf8" />
      <text x={180} y={24} fontSize={12} fontWeight={700} textAnchor="middle" fill="#7dd3fc">
        갈 때 시속 4 km
      </text>
      <line x1={282} y1={60} x2={82} y2={60} stroke="#f472b6" strokeWidth={2.4} />
      <path d="M82 60 l8 -4 l0 8 z" fill="#f472b6" />
      <text x={180} y={80} fontSize={12} fontWeight={700} textAnchor="middle" fill="#f9a8d4">
        올 때 시속 {speed} km
      </text>
    </svg>
  );
}

/** 슬라이더를 움직인 자리마다 점이 하나씩 찍히는 좌표평면 (곡선은 다음 활동에서) */
function LifeGraphViz({ cs, x, visited }: { cs: LifeCase; x: number; visited: number[] }) {
  const g = cs.graph;
  const px = (v: number) => PLOT.left + (v / g.xMax) * (PLOT.right - PLOT.left);
  const py = (v: number) => PLOT.bottom - (v / g.yMax) * (PLOT.bottom - PLOT.top);
  const cx = px(x);
  const cy = py(cs.valueOf(x));

  return (
    <svg viewBox={`0 0 ${PLOT.w} ${PLOT.h}`} className="mx-auto block w-full" role="img" aria-label="값의 변화를 찍은 좌표평면">
      <rect x={0} y={0} width={PLOT.w} height={PLOT.h} fill="#020617" rx={12} />

      {g.yTicks.map((t) => (
        <g key={"y" + t}>
          <line x1={PLOT.left} y1={py(t)} x2={PLOT.right} y2={py(t)} stroke="#1e293b" strokeWidth={1} />
          <text x={PLOT.left - 6} y={py(t) + 4} fontSize={12} textAnchor="end" fill="#64748b" fontFamily="ui-monospace, monospace">
            {t}
          </text>
        </g>
      ))}
      {g.xTicks.map((t) => (
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
        {g.yName}
      </text>
      <text x={PLOT.right} y={PLOT.h - 6} fontSize={11} fontWeight={700} textAnchor="end" fill="#94a3b8">
        {g.xName}
      </text>

      {g.asym ? (
        <g>
          <line
            x1={PLOT.left}
            y1={py(g.asym.y)}
            x2={PLOT.right}
            y2={py(g.asym.y)}
            stroke="#fbbf24"
            strokeWidth={1.4}
            strokeDasharray="5 4"
          />
          <text x={PLOT.left + 4} y={py(g.asym.y) - 5} fontSize={12} fontWeight={700} fill="#fcd34d">
            {g.asym.label}
          </text>
        </g>
      ) : null}

      {visited.map((v) => (
        <circle key={v} cx={px(v)} cy={py(cs.valueOf(v))} r={2.6} fill="#818cf8" fillOpacity={0.55} />
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
  const extra = cs.extraOf ? cs.extraOf(x) : null;
  const q0done = picks[`${cs.id}:0`] === cs.qs[0].answer;
  const allDone = q0done && picks[`${cs.id}:1`] === cs.qs[1].answer;

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
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 sm:col-span-3">
        {cs.id === "L1" ? <NotebookViz n={x} /> : null}
        {cs.id === "L2" ? <BeakerViz total={cs.extraOf ? cs.extraOf(x) : 240} conc={v} /> : null}
        {cs.id === "L3" ? <TripViz speed={x} /> : null}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {extra !== null ? (
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-bold text-slate-200">
              {cs.extraLabel} <span className="font-mono text-[14px] text-white">{fmtNum(extra, cs.extraDigits ?? 0)}</span> {cs.extraUnit}
            </span>
          ) : null}
          <span className="rounded-lg border border-pink-400/40 bg-pink-400/15 px-2.5 py-1.5 text-[12px] font-bold text-pink-100">
            {cs.valueLabel} <span className="font-mono text-[14px] text-white">{fmtNum(v, cs.digits)}</span> {cs.valueUnit}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-3 sm:col-span-2">
        <p className="text-[11px] font-bold text-slate-400">📍 움직인 자리마다 점이 찍혀요</p>
        <div className="mt-1">
          <LifeGraphViz cs={cs} x={x} visited={visited} />
        </div>
        <p className="mt-1 text-center text-[11px] leading-6 text-slate-500">
          {cs.graph.asym ? "노란 점선은 가까워지지만 닿지 못하는 자리" : "끝에서 끝까지 밀어 점이 그리는 모양 보기"}
        </p>
      </div>
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
        <p className="text-[13px] font-bold text-slate-100">{cs.qs[0].prompt}</p>
        <MixedChoices items={cs.qs[0].choices} pick={picks[`${cs.id}:0`]} answer={cs.qs[0].answer} onPick={(i) => onPick(0, i)} />
        {picks[`${cs.id}:0`] !== undefined ? (
          <Verdict right={q0done} why={cs.qs[0].why} hint={cs.qs[0].choiceWhy[picks[`${cs.id}:0`]]} />
        ) : null}
      </div>

      {q0done ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
          <p className="text-[13px] font-bold text-slate-100">{cs.qs[1].prompt}</p>
          <MixedChoices items={cs.qs[1].choices} pick={picks[`${cs.id}:1`]} answer={cs.qs[1].answer} onPick={(i) => onPick(1, i)} />
          {picks[`${cs.id}:1`] !== undefined ? (
            <Verdict right={allDone} why={cs.qs[1].why} hint={cs.qs[1].choiceWhy[picks[`${cs.id}:1`]]} />
          ) : null}
        </div>
      ) : null}

      {allDone ? (
        <div className="rounded-xl border-2 border-violet-400/45 bg-violet-400/12 px-3 py-3">
          <div className="flex justify-center py-1 text-[18px] text-violet-100">
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
        <p className="text-sm font-bold text-slate-100">🚲 일상생활에서 만나는 유리함수</p>
        <TipBox>
          📖 무엇인가를 <b className="text-pink-200">나누어 셈할 때</b> 유리함수가 나타나요. 나누는 수가 문자이면 그 문자가 분모로 내려갑니다. 슬라이더를 움직여 값이 어떻게 변하는지 살펴보세요.
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
            <NextBtn onClick={() => setCi((k) => k + 1)} label="다음 상황 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === LIFE_CASES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 세 상황을 모두 살펴봤어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            식만 보면 분모가 0 이 되는 수만 빼면 되지만, 현실에서는 <b className="text-white">상황이 정의역을 한 번 더 좁혀요</b>. 권수는 자연수이고 붓는 물의 양은 음수가 될 수 없습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
