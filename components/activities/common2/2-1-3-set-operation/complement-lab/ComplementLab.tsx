"use client";

import { useEffect, useId, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  ALL_REGIONS,
  ELEMS,
  G,
  JUDGES,
  LAWS,
  PAINTS,
  READS,
  REGION_NAME,
  UNIVERSE_DEMO,
  complementOf,
  diffRegions,
  exprTex,
  regionOfItem,
  regionsOf,
  sameRegions,
  slots,
  type ElemTask,
  type Expr,
  type Judge,
  type LawTask,
  type PaintTask,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "universe_matters",
    prompt:
      "같은 집합 A라도 전체집합 U가 달라지면 여집합 Aᶜ가 달라졌어요. 왜 그런지, 그리고 여집합을 말할 때 무엇을 꼭 함께 말해야 하는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 여집합은 U의 원소 중 A에 속하지 않는 것을 모두 모은 것이므로, 바탕이 되는 U가 바뀌면 남는 원소도 달라진다. A = {2, 4}일 때 U가 5 이하의 자연수면 Aᶜ = {1, 3, 5}이지만 U가 8의 약수면 Aᶜ = {1, 8}이 된다. 그래서 여집합을 말할 때는 어떤 전체집합에 대한 여집합인지를 반드시 함께 말해야 한다.",
  },
  {
    id: "diff_order",
    prompt:
      "A − B 와 B − A 는 왜 서로 다른가요? 벤 다이어그램의 조각으로 설명하고, A − B 를 여집합을 써서 나타내면 어떻게 되는지도 써 보세요.",
    kind: "text",
    placeholder:
      "예: A − B 는 A 안에 있으면서 B에는 없는 조각이고, B − A 는 B 안에 있으면서 A에는 없는 조각이라서 서로 겹치지 않는 다른 자리다. 그래서 차집합은 순서를 바꾸면 결과가 달라진다. 또 「A에 속하고 B에 속하지 않는다」는 「A에 속하고 Bᶜ에 속한다」와 같은 말이므로 A − B = A ∩ Bᶜ 로 쓸 수 있다.",
  },
  {
    id: "complement_props",
    prompt:
      "A ∪ Aᶜ = U 와 A ∩ Aᶜ = ∅ 가 성립하는 까닭을 벤 다이어그램의 조각으로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: U 안의 모든 자리는 A 안이거나 A 바깥이거나 둘 중 하나이므로, 둘을 합치면 U의 모든 조각이 빠짐없이 채워져 A ∪ Aᶜ = U 가 된다. 반대로 A 안이면서 동시에 A 바깥인 자리는 있을 수 없으므로 겹치는 조각이 하나도 없어 A ∩ Aᶜ = ∅ 가 된다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
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

function listTex(xs: string[]): string {
  return xs.length ? `\\{${xs.join(",\\; ")}\\}` : "\\varnothing";
}

// ══════════════════════════════════════════════════════════════
// 벤 다이어그램 — U 상자 + 두 원, 네 조각을 눌러 칠한다
// ══════════════════════════════════════════════════════════════
const A_COL = "#38bdf8";
const B_COL = "#a78bfa";

function circlePath(c: { cx: number; cy: number; r: number }): string {
  return `M${c.cx - c.r},${c.cy} a${c.r},${c.r} 0 1,0 ${2 * c.r},0 a${c.r},${c.r} 0 1,0 ${-2 * c.r},0 Z`;
}

function Venn({
  painted,
  onToggle,
  bad,
  paintColor = "#22d3ee",
  small,
  children,
}: {
  painted: number[];
  onToggle?: (m: number) => void;
  bad?: number[];
  paintColor?: string;
  small?: boolean;
  children?: React.ReactNode;
}) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg
      viewBox={`0 0 ${G.w} ${G.h}`}
      className={"mx-auto block w-full select-none " + (small ? "max-w-[210px]" : "max-w-[460px]")}
      role="img"
      aria-label="벤 다이어그램"
    >
      <defs>
        <clipPath id={`${u}inA`}>
          <circle cx={G.a.cx} cy={G.a.cy} r={G.a.r} />
        </clipPath>
        <clipPath id={`${u}inB`}>
          <circle cx={G.b.cx} cy={G.b.cy} r={G.b.r} />
        </clipPath>
        <clipPath id={`${u}outA`}>
          <path d={`M0,0 H${G.w} V${G.h} H0 Z ${circlePath(G.a)}`} clipRule="evenodd" />
        </clipPath>
        <clipPath id={`${u}outB`}>
          <path d={`M0,0 H${G.w} V${G.h} H0 Z ${circlePath(G.b)}`} clipRule="evenodd" />
        </clipPath>
      </defs>

      {ALL_REGIONS.map((m) => {
        const isBad = (bad ?? []).includes(m);
        const on = painted.includes(m);
        const fill = isBad ? "#fb718566" : on ? `${paintColor}55` : "rgba(255,255,255,0.02)";
        let node: React.ReactNode = (
          <rect
            x={G.box.x}
            y={G.box.y}
            width={G.box.w}
            height={G.box.h}
            rx={G.box.r}
            fill={fill}
            onClick={onToggle ? () => onToggle(m) : undefined}
            className={onToggle ? "cursor-pointer" : undefined}
          />
        );
        node = <g clipPath={`url(#${u}${m & 2 ? "in" : "out"}B)`}>{node}</g>;
        node = <g clipPath={`url(#${u}${m & 1 ? "in" : "out"}A)`}>{node}</g>;
        return <g key={m}>{node}</g>;
      })}

      <rect x={G.box.x} y={G.box.y} width={G.box.w} height={G.box.h} rx={G.box.r} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth={small ? 4 : 2.5} pointerEvents="none" />
      <circle cx={G.a.cx} cy={G.a.cy} r={G.a.r} fill="none" stroke={A_COL} strokeWidth={small ? 5 : 3} pointerEvents="none" />
      <circle cx={G.b.cx} cy={G.b.cy} r={G.b.r} fill="none" stroke={B_COL} strokeWidth={small ? 5 : 3} pointerEvents="none" />
      {small ? null : (
        <>
          <text x={G.ul.x} y={G.ul.y} textAnchor="middle" className="fill-slate-300 font-serif text-[19px] font-bold italic" pointerEvents="none">
            U
          </text>
          <text x={G.a.lx} y={G.a.ly} textAnchor="middle" fill={A_COL} className="font-serif text-[20px] font-bold italic" pointerEvents="none">
            A
          </text>
          <text x={G.b.lx} y={G.b.ly} textAnchor="middle" fill={B_COL} className="font-serif text-[20px] font-bold italic" pointerEvents="none">
            B
          </text>
        </>
      )}
      {children}
    </svg>
  );
}

function PaintBox({
  expr,
  painted,
  setPainted,
  locked,
}: {
  expr: Expr;
  painted: number[];
  setPainted: (f: (s: number[]) => number[]) => void;
  locked?: boolean;
}) {
  const want = regionsOf(expr);
  const ok = sameRegions(painted, want);
  return (
    <div className={"rounded-2xl border-2 p-3 transition " + (ok ? "border-emerald-400/60 bg-emerald-400/[0.10]" : "border-white/10 bg-white/5")}>
      <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-slate-100">
        <Katex expr={exprTex(expr)} />
      </div>
      <div className="mt-1 overflow-hidden rounded-xl bg-slate-950/70 p-1">
        <Venn painted={painted} onToggle={locked ? undefined : (m) => setPainted((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]))} />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className={"text-[12px] font-bold " + (ok ? "text-emerald-200" : "text-slate-400")}>{ok ? "✅ 알맞게 칠했어요" : `칠한 조각 ${painted.length}`}</p>
        {!locked && !ok && painted.length ? (
          <button
            type="button"
            onClick={() => setPainted(() => [])}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↺ 지우기
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
type Tab = "paint" | "law" | "elem" | "judge";

export default function ComplementLab() {
  const [tab, setTab] = useState<Tab>("paint");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🌓 여집합과 차집합</h3>
        <p className="mt-2 leading-7 text-slate-300">
          전체집합 <b className="text-slate-100">U</b> 안의 <b className="text-cyan-200">네 조각</b>을 눌러 칠하면 여집합과 차집합이 어떤 자리인지 한눈에 보여요. 조각을 직접 만들며
          성질까지 확인해 봅시다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "paint"} onClick={() => setTab("paint")}>
          ① 조각 칠하기 🎨
        </TabButton>
        <TabButton active={tab === "law"} onClick={() => setTab("law")}>
          ② 성질 탐구 🔬
        </TabButton>
        <TabButton active={tab === "elem"} onClick={() => setTab("elem")}>
          ③ 원소로 구하기 🔢
        </TabButton>
        <TabButton active={tab === "judge"} onClick={() => setTab("judge")}>
          ④ 성질 탐정 🔍
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "paint" ? <PaintTab /> : null}
        {tab === "law" ? <LawTab /> : null}
        {tab === "elem" ? <ElemTab /> : null}
        {tab === "judge" ? <JudgeTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 조각 칠하기
// ══════════════════════════════════════════════════════════════
function PaintTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = PAINTS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎨 식이 나타내는 조각을 칠하세요</p>
          <Chips ids={PAINTS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <Katex expr="A^{C}" /> — <b className="text-white">U의 원소 중 A에 속하지 않는</b> 것
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <Katex expr="A - B" /> — <b className="text-white">A에는 속하고 B에는 속하지 않는</b> 것
          </p>
        </div>
      </div>

      <PaintOne
        key={p.id}
        p={p}
        last={i === PAINTS.length - 1}
        onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))}
        onNext={() => setI((k) => Math.min(PAINTS.length - 1, k + 1))}
      />

      {done.length === PAINTS.length ? <KeyPoints /> : null}
      <UniverseDemo />
    </div>
  );
}

function PaintOne({ p, last, onDone, onNext }: { p: PaintTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [painted, setPainted] = useState<number[]>([]);
  const want = regionsOf(p.expr);
  const ok = sameRegions(painted, want);

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PaintBox expr={p.expr} painted={painted} setPainted={setPainted} locked={ok} />
      <div className="space-y-3">
        <div className={"rounded-2xl border-2 px-4 py-4 text-center transition " + (ok ? "border-emerald-400/60 bg-emerald-400/15" : "border-cyan-400/35 bg-cyan-400/[0.07]")}>
          <p className="text-[11px] font-bold text-slate-400">칠할 식</p>
          <div className="mt-1 flex justify-center overflow-x-auto overflow-y-hidden py-1 text-2xl text-slate-100">
            <Katex expr={exprTex(p.expr)} />
          </div>
          {p.sameAs && ok ? <p className="mt-1 text-[12px] font-bold text-amber-200">✨ 앞에서 칠한 {p.sameAs} 와 같은 조각이에요!</p> : null}
        </div>
        {ok ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <p className="text-[11px] font-bold text-slate-400">칠한 조각</p>
              <div className="mt-1 space-y-1">
                {want.length ? (
                  want.map((m) => (
                    <p key={m} className="rounded-lg bg-emerald-400/12 px-2 py-1 text-[11px] text-emerald-100">
                      {REGION_NAME[m]}
                    </p>
                  ))
                ) : (
                  <p className="rounded-lg bg-white/5 px-2 py-1 text-[11px] text-slate-400">칠할 조각이 하나도 없어요</p>
                )}
              </div>
            </div>
            <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {p.tip}</p>
            {!last ? <NextBtn onClick={onNext} /> : null}
          </>
        ) : (
          <div className="flex min-h-[7rem] items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 text-center">
            <p className="text-[12px] leading-6 text-slate-500">
              U 상자 안의 네 조각을 눌러 보세요
              <br />
              <span className="text-slate-600">두 원 바깥도 조각 하나예요!</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function KeyPoints() {
  const items: { tex: string; note: string }[] = [
    { tex: "A^{C} = U - A", note: "여집합은 전체집합에서 A를 뺀 것" },
    { tex: "A - A = \\varnothing", note: "자기에서 자기를 빼면 남는 게 없어요" },
    { tex: "A - \\varnothing = A", note: "뺄 것이 없으면 그대로예요" },
    { tex: "A - B \\ne B - A", note: "차집합은 순서를 바꾸면 달라져요" },
  ];
  return (
    <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
      <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 조각을 모두 칠했어요 — 꼭 기억할 것</p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {items.map((x) => (
          <div key={x.tex} className="rounded-xl bg-black/25 px-3 py-2 text-center">
            <div className="flex justify-center overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
              <Katex expr={x.tex} />
            </div>
            <p className="mt-0.5 text-[11px] text-slate-300">{x.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UniverseDemo() {
  const [pick, setPick] = useState(0);
  const [seen, setSeen] = useState<number[]>([0]);
  const opt = UNIVERSE_DEMO.options[pick];
  const A = UNIVERSE_DEMO.A;
  const comp = complementOf(opt.items, A);
  const all = seen.length === UNIVERSE_DEMO.options.length;

  return (
    <div className={"rounded-2xl border-2 p-4 transition " + (all ? "border-amber-400/55 bg-amber-400/[0.10]" : "border-white/10 bg-slate-900/40")}>
      <p className="text-sm font-bold text-slate-100">🌍 전체집합을 바꿔 보세요</p>
      <p className="mt-1 text-[12px] leading-6 text-slate-300">
        A 는 <Katex expr={listTex(A)} /> 로 그대로인데, 전체집합만 바꾸면 여집합은 어떻게 될까요?
      </p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
        {UNIVERSE_DEMO.options.map((o, i) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              setPick(i);
              setSeen((s) => (s.includes(i) ? s : [...s, i]));
            }}
            className={
              "rounded-xl border-2 px-2 py-2 text-center text-[12px] font-bold transition " +
              (pick === i ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100" : seen.includes(i) ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-white/12 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {[
          { k: "U", v: opt.items, col: "text-slate-100" },
          { k: "A", v: A, col: "text-sky-200" },
          { k: "A^{C}", v: comp, col: "text-rose-200" },
        ].map((x) => (
          <div key={x.k} className="rounded-xl bg-black/30 px-3 py-2 text-center">
            <div className="text-[11px] font-bold text-slate-400">
              <Katex expr={x.k} />
            </div>
            <div className={"mt-1 overflow-x-auto overflow-y-hidden py-0.5 text-lg " + x.col}>
              <Katex expr={listTex(x.v)} />
            </div>
          </div>
        ))}
      </div>
      <p className={"mt-2 text-center text-[12px] font-bold " + (all ? "text-amber-100" : "text-slate-400")}>
        {all ? "✨ 같은 A 인데 여집합이 셋 다 달라요 — 여집합은 전체집합에 따라 달라집니다!" : `살펴본 전체집합 ${seen.length} / ${UNIVERSE_DEMO.options.length}`}
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 성질 탐구
// ══════════════════════════════════════════════════════════════
function LawTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = LAWS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔬 두 식이 같은 조각을 나타낼까요?</p>
          <Chips ids={LAWS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          왼쪽과 오른쪽을 각각 칠해 보세요. <b className="text-white">칠할 조각이 하나도 없는</b> 식도 있답니다.
        </p>
      </div>

      <LawOne
        key={p.id}
        p={p}
        last={i === LAWS.length - 1}
        onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))}
        onNext={() => setI((k) => Math.min(LAWS.length - 1, k + 1))}
      />

      {done.length === LAWS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 성질을 모두 확인했어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {["A - B = A \\cap B^{C}", "(A^{C})^{C} = A", "U^{C} = \\varnothing,\\; \\varnothing^{C} = U", "A \\cup A^{C} = U,\\; A \\cap A^{C} = \\varnothing"].map((t) => (
              <div key={t} className="flex justify-center overflow-x-auto overflow-y-hidden rounded-xl bg-black/25 px-3 py-2 text-slate-100">
                <Katex expr={t} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LawOne({ p, last, onDone, onNext }: { p: LawTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [left, setLeft] = useState<number[]>([]);
  const [right, setRight] = useState<number[]>([]);
  const okL = sameRegions(left, regionsOf(p.left));
  const okR = sameRegions(right, regionsOf(p.right));
  const ok = okL && okR;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <PaintBox expr={p.left} painted={left} setPainted={setLeft} locked={ok} />
        <PaintBox expr={p.right} painted={right} setPainted={setRight} locked={ok} />
      </div>
      <div className={"rounded-2xl border-2 px-4 py-3 text-center transition " + (ok ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
        {ok ? (
          <>
            <p className="text-sm font-extrabold text-emerald-100">✅ 두 조각이 완전히 같아요 — {p.law}</p>
            <div className="mt-1.5 flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-slate-100">
              <Katex expr={`${exprTex(p.left)} = ${exprTex(p.right)}`} />
            </div>
          </>
        ) : (
          <p className="text-[12px] leading-6 text-slate-400">{okL || okR ? "한쪽을 맞혔어요 — 나머지도 칠해 보세요" : "두 식이 나타내는 조각을 각각 칠해 보세요"}</p>
        )}
      </div>
      {ok ? (
        <>
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {p.tip}</p>
          {!last ? <NextBtn onClick={onNext} /> : null}
        </>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 원소로 구하기
// ══════════════════════════════════════════════════════════════
function ElemTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = ELEMS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔢 원소를 알맞은 조각에 넣으세요</p>
          <Chips ids={ELEMS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          아래 원소를 하나 고른 뒤 벤 다이어그램의 <b className="text-white">조각을 눌러</b> 넣어요. 자리를 잘못 고르면 넣어지지 않아요.
        </p>
      </div>

      <ElemOne key={t.id} t={t} last={i === ELEMS.length - 1} onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))} onNext={() => setI((k) => Math.min(ELEMS.length - 1, k + 1))} />
    </div>
  );
}

function ElemOne({ t, last, onDone, onNext }: { t: ElemTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [placed, setPlaced] = useState<Record<string, number>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [miss, setMiss] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [read, setRead] = useState<"comp" | "ab" | "ba" | null>(null);

  const rest = t.univ.filter((x) => placed[x] === undefined);
  const cleared = rest.length === 0;

  const doneRef = useRef(false);
  useEffect(() => {
    if (cleared && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function drop(m: number) {
    if (!sel || cleared) return;
    if (regionOfItem(t, sel) === m) {
      setPlaced((s) => ({ ...s, [sel]: m }));
      setSel(null);
      setWrong(null);
    } else {
      setWrong(m);
      setMiss((k) => k + 1);
    }
  }

  const byReg: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [] };
  for (const x of t.univ) if (placed[x] !== undefined) byReg[placed[x]].push(x);

  const readItem = READS.find((r) => r.key === read) ?? null;
  const readRegions = readItem ? readItem.regions : [];
  const readItems = readItem ? readItem.regions.flatMap((m) => byReg[m]) : [];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-white/10 bg-white/5 p-3">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[14px] font-semibold">
          {[
            { n: "U", label: t.univLabel, col: "text-slate-100" },
            { n: "A", label: t.aLabel, col: "text-sky-100" },
            { n: "B", label: t.bLabel, col: "text-violet-100" },
          ].map((x) => (
            <span key={x.n} className={"inline-flex flex-wrap items-center gap-1.5 " + x.col}>
              <i className="font-serif italic">{x.n}</i>
              <span>=</span>
              <span className="text-slate-400">{"{"}</span>
              <i className="font-serif italic">x</i>
              <span className="text-slate-400">|</span>
              <span>
                <i className="font-serif italic">x</i>는 {x.label}
              </span>
              <span className="text-slate-400">{"}"}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={"overflow-hidden rounded-xl border-2 bg-slate-950/70 p-2 transition " + (cleared ? "border-emerald-400/50" : "border-white/10")}>
          <Venn
            painted={readRegions}
            onToggle={cleared ? undefined : drop}
            bad={wrong !== null ? [wrong] : []}
            paintColor="#fbbf24"
          >
            {ALL_REGIONS.map((m) => {
              const xs = byReg[m];
              if (!xs.length) return null;
              return slots(G.anchor[m], xs.length).map((q, i) => (
                <g key={`${m}-${i}`} pointerEvents="none">
                  <rect x={q.x - 16} y={q.y - 13} width={32} height={26} rx={8} fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
                  <text x={q.x} y={q.y + 5} textAnchor="middle" className="fill-white font-mono text-[13px] font-bold">
                    {xs[i]}
                  </text>
                </g>
              ));
            })}
          </Venn>
          <p className={"mt-1 text-center text-[12px] font-bold " + (cleared ? "text-emerald-200" : wrong !== null ? "text-rose-200" : "text-slate-400")}>
            {cleared ? "🎉 모든 원소를 제자리에 넣었어요!" : wrong !== null ? "그 조각이 아니에요 — 다시 살펴볼까요?" : `넣은 원소 ${t.univ.length - rest.length} / ${t.univ.length}`}
            {miss > 0 && !cleared ? <span className="ml-2 font-normal text-rose-300">헛짚음 {miss}</span> : null}
          </p>
        </div>

        <div className="space-y-3">
          {!cleared ? (
            <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-3">
              <p className="text-[11px] font-bold text-slate-400">아직 넣지 않은 원소 — 하나 고르세요</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {rest.map((x) => (
                  <button
                    key={x}
                    type="button"
                    onClick={() => {
                      setSel(x === sel ? null : x);
                      setWrong(null);
                    }}
                    className={
                      "h-11 min-w-[3rem] rounded-xl border-2 px-3 font-mono text-lg font-bold transition " +
                      (sel === x ? "border-amber-400/80 bg-amber-400/25 text-amber-100" : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    {x}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">{sel ? `👉 ${sel} 을(를) 넣을 조각을 누르세요` : "원소를 먼저 고르세요"}</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-3">
                <p className="text-[12px] font-bold text-emerald-100">🔎 눌러서 읽어 보세요</p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {READS.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRead(read === r.key ? null : r.key)}
                      className={
                        "rounded-xl border-2 px-2 py-2 transition " +
                        (read === r.key ? "border-amber-400/70 bg-amber-400/20 text-amber-100" : "border-white/12 bg-white/5 text-slate-200 hover:bg-white/10")
                      }
                    >
                      <Katex expr={r.tex} />
                    </button>
                  ))}
                </div>
                {readItem ? (
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/30 px-3 py-2 text-lg text-slate-100">
                    <Katex expr={readItem.tex} />
                    <span>=</span>
                    <Katex expr={listTex([...readItems].sort((a, b) => Number(a) - Number(b)))} />
                  </div>
                ) : (
                  <p className="mt-2 text-center text-[11px] text-slate-400">세 가지 중 하나를 눌러 보세요</p>
                )}
              </div>
              {!last ? <NextBtn onClick={onNext} label="다음 세트 ▶" /> : null}
            </>
          )}

          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <p className="text-[11px] font-bold text-slate-400">조각 이름</p>
            <div className="mt-1 grid gap-1">
              {ALL_REGIONS.map((m) => (
                <p key={m} className="rounded-lg bg-white/5 px-2 py-1 text-[11px] text-slate-300">
                  {REGION_NAME[m]}
                  {byReg[m].length ? <span className="ml-2 font-mono font-bold text-slate-100">{byReg[m].join(", ")}</span> : null}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 성질 탐정
// ══════════════════════════════════════════════════════════════
function JudgeTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = JUDGES[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔍 이 등식은 언제나 성립할까요?</p>
          <Chips ids={JUDGES.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          맞히면 두 식의 조각을 겹쳐 보여 줘요. <b className="text-rose-200">빨간 조각</b>은 한쪽에만 들어 있는 자리랍니다.
        </p>
      </div>

      <JudgeOne key={p.id} p={p} last={i === JUDGES.length - 1} onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))} onNext={() => setI((k) => Math.min(JUDGES.length - 1, k + 1))} />

      {done.length === JUDGES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 여섯 등식을 모두 판정했어요!</p>
          <p className="mt-1.5 text-[12px] leading-6 text-slate-300">
            헷갈릴 때는 <b className="text-white">네 조각을 하나씩 짚어</b> 보면 돼요. 두 식이 모든 조각에서 똑같아야 비로소 같은 집합입니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function JudgeOne({ p, last, onDone, onNext }: { p: Judge; last: boolean; onDone: () => void; onNext: () => void }) {
  const [pick, setPick] = useState<boolean | null>(null);
  const d = diffRegions(p.left, p.right);
  const isTrue = d.length === 0;
  const ok = pick !== null && pick === isTrue;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const L = regionsOf(p.left);
  const R = regionsOf(p.right);
  const both = L.filter((m) => R.includes(m));

  return (
    <div className="space-y-3">
      <div className={"rounded-2xl border-2 px-4 py-4 text-center transition " + (ok ? (isTrue ? "border-emerald-400/60 bg-emerald-400/15" : "border-rose-400/55 bg-rose-400/12") : "border-white/10 bg-white/5")}>
        <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-xl text-slate-100">
          <Katex expr={`${exprTex(p.left)} = ${exprTex(p.right)}`} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-3">
            <div className="grid grid-cols-2 gap-2">
              {[true, false].map((v) => {
                const on = pick === v;
                const good = pick !== null && v === isTrue;
                const bad = on && v !== isTrue;
                return (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setPick(v)}
                    disabled={ok}
                    className={
                      "rounded-xl border-2 px-2 py-3 text-sm font-bold transition disabled:cursor-default " +
                      (good
                        ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                        : bad
                          ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    {v ? "⭕ 언제나 성립" : "❌ 성립하지 않음"}
                  </button>
                );
              })}
            </div>
            {pick !== null && !ok ? <p className="mt-2 text-center text-[11px] font-bold text-rose-200">다시 생각해 보세요 — 네 조각을 하나씩 짚어 볼까요?</p> : null}
          </div>

          {ok ? (
            <>
              <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (isTrue ? "border-emerald-400/55 bg-emerald-400/12" : "border-rose-400/55 bg-rose-400/12")}>
                <p className={"text-base font-extrabold " + (isTrue ? "text-emerald-100" : "text-rose-100")}>{isTrue ? "✅ 언제나 성립해요" : "❌ 성립하지 않아요"}</p>
                {!isTrue ? (
                  <div className="mt-1.5 space-y-1">
                    <p className="text-[11px] font-bold text-rose-200">어긋나는 조각</p>
                    {d.map((m) => (
                      <p key={m} className="rounded-lg bg-black/25 px-2 py-1 text-[11px] text-slate-200">
                        {REGION_NAME[m]}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
              <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {p.tip}</p>
              {!last ? <NextBtn onClick={onNext} /> : null}
            </>
          ) : null}
        </div>

        <div className="space-y-2">
          {ok ? (
            <>
              <div className="overflow-hidden rounded-xl border-2 border-white/10 bg-slate-950/70 p-2">
                <Venn painted={both} bad={d} paintColor="#34d399" />
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-[11px]">
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 font-bold text-emerald-100">초록 — 양쪽 모두</span>
                <span className="rounded-full bg-rose-400/25 px-3 py-1 font-bold text-rose-100">빨강 — 한쪽에만</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[p.left, p.right].map((e, k) => (
                  <div key={k} className="text-center">
                    <div className="overflow-hidden rounded-lg bg-slate-950/70 p-1">
                      <Venn painted={regionsOf(e)} small paintColor={k === 0 ? "#38bdf8" : "#a78bfa"} />
                    </div>
                    <p className="mt-1 overflow-x-auto overflow-y-hidden py-0.5 text-[13px] text-slate-200">
                      <Katex expr={exprTex(e)} />
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 text-center">
              <p className="text-[12px] leading-6 text-slate-500">
                판정하면 두 식의 조각을
                <br />
                겹쳐서 보여 줘요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
