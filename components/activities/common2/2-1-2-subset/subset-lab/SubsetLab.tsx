"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  EQUALS,
  LAYOUTS,
  PICK_LAYOUTS,
  POWER_BASE,
  RELATIONS,
  SUBSETS,
  VB_H,
  VB_W,
  VENN_TASKS,
  allMasks,
  isSubset,
  layoutOf,
  listTex,
  maskItems,
  maskKey,
  regionAt,
  regionOf,
  sameSet,
  slots,
  type EqProblem,
  type Layout,
  type Region,
  type RelProblem,
  type SetSpec,
  type SubProblem,
  type VennTask,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "subset_check",
    prompt:
      "어떤 두 집합에 대하여 A ⊂ B 인지 아닌지를 어떻게 확인했는지 자신의 말로 정리해 보세요. 그리고 공집합이 모든 집합의 부분집합인 까닭도 함께 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: A의 원소를 하나씩 꺼내어 B 안에 있는지 확인했다. 하나라도 B에 없으면 A ⊄ B 이고, 전부 B에 있으면 A ⊂ B 이다. 공집합은 원소가 하나도 없어서 'B에 속하지 않는 원소'를 찾을 수가 없다. 그래서 어떤 집합에 대해서도 부분집합이 된다.",
  },
  {
    id: "equal_and_proper",
    prompt:
      "A = B 를 확인할 때 왜 A ⊂ B 와 B ⊂ A 를 둘 다 따져야 하는지 설명하고, 부분집합과 진부분집합이 어떻게 다른지 원소가 3개인 집합을 예로 들어 말해 보세요.",
    kind: "text",
    placeholder:
      "예: 한쪽만 확인하면 상대 집합에 더 있는 원소를 놓칠 수 있다. A ⊂ B 만 보면 B가 A보다 클 수도 있으므로, 양쪽을 모두 확인해야 원소가 완전히 같다고 말할 수 있다. 원소가 3개인 집합의 부분집합은 2³ = 8개인데, 그중 자기 자신을 뺀 7개가 진부분집합이다.",
  },
  {
    id: "venn_pictures",
    prompt:
      "탭④에서 A ⊄ B 이고 B ⊄ A 인 경우인데도 그림이 두 가지로 나뉘었어요. 어떤 경우에 두 원이 겹치고 어떤 경우에 떨어지는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 두 집합이 서로에게 없는 원소를 가지고 있으면 기호는 둘 다 ⊄ 이 된다. 그런데 두 집합이 함께 가진 원소가 있으면 그 원소를 놓을 자리가 필요하므로 두 원을 겹쳐 그리고, 함께 가진 원소가 하나도 없으면 겹치는 자리가 필요 없으므로 두 원을 떨어뜨려 그린다.",
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

/** 집합 하나를 보여 준다 — 조건제시법이 있으면 그것을, 없으면 원소나열법을 */
function SetHead({ spec, tone = "slate", withItems }: { spec: SetSpec; tone?: "sky" | "violet" | "slate"; withItems?: boolean }) {
  const col = tone === "sky" ? "text-sky-100" : tone === "violet" ? "text-violet-100" : "text-slate-100";
  const cond = spec.condPre !== undefined || spec.condTex;
  const noSubject = !spec.condPre && !!spec.condTex;
  return (
    <div className={"flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-base font-semibold " + col}>
      <i className="font-serif italic">{spec.name}</i>
      <span>=</span>
      {cond ? (
        <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5">
          <span className="text-slate-400">{"{"}</span>
          <i className="font-serif italic">x</i>
          <span className="text-slate-400">|</span>
          <span>
            {noSubject ? null : (
              <>
                <i className="font-serif italic">x</i>는{" "}
              </>
            )}
            {spec.condPre}
            {spec.condTex ? <Katex expr={spec.condTex} /> : null}
            {spec.condPost ?? ""}
          </span>
          <span className="text-slate-400">{"}"}</span>
        </span>
      ) : (
        <Katex expr={listTex(spec.items)} />
      )}
      {cond && withItems ? (
        <>
          <span className="text-slate-500">=</span>
          <Katex expr={listTex(spec.items)} />
        </>
      ) : null}
    </div>
  );
}

type ChipTone = "idle" | "good" | "bad" | "focus" | "dim";
const CHIP_CLS: Record<ChipTone, string> = {
  idle: "border-white/15 bg-white/5 text-slate-200",
  good: "border-emerald-400/70 bg-emerald-400/20 text-emerald-100",
  bad: "border-rose-400/70 bg-rose-400/20 text-rose-100",
  focus: "border-amber-400/80 bg-amber-400/25 text-amber-100",
  dim: "border-white/10 bg-white/[0.03] text-slate-500",
};

function EChip({ label, tone = "idle", onClick }: { label: string; tone?: ChipTone; onClick?: () => void }) {
  const cls = "h-10 min-w-[2.75rem] rounded-xl border-2 px-2.5 font-mono text-base font-bold transition " + CHIP_CLS[tone];
  return onClick ? (
    <button type="button" onClick={onClick} className={cls + " hover:brightness-125"}>
      {label}
    </button>
  ) : (
    <div className={cls + " flex items-center justify-center"}>{label}</div>
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

function YesNo({
  q,
  pick,
  ans,
  onPick,
  locked,
  yes = "⭕ 그렇다",
  no = "❌ 아니다",
}: {
  q: React.ReactNode;
  pick: boolean | null;
  ans: boolean;
  onPick: (v: boolean) => void;
  locked: boolean;
  yes?: string;
  no?: string;
}) {
  const ok = pick !== null && pick === ans;
  return (
    <div className={"rounded-2xl border-2 p-3 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/12" : locked ? "border-white/10 bg-white/[0.03] opacity-45" : "border-cyan-400/35 bg-cyan-400/[0.07]")}>
      <div className="text-center text-sm font-bold text-slate-100">{q}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[true, false].map((v) => {
          const on = pick === v;
          const good = pick !== null && v === ans;
          const bad = on && v !== ans;
          return (
            <button
              key={String(v)}
              type="button"
              onClick={() => onPick(v)}
              disabled={locked || ok}
              className={
                "rounded-xl border-2 px-2 py-2 text-[13px] font-bold whitespace-nowrap transition disabled:cursor-default " +
                (good
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : bad
                    ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              {v ? yes : no}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 벤 다이어그램 그리기
// ══════════════════════════════════════════════════════════════
const CIRCLE_COLOR: Record<string, string> = { A: "#38bdf8", B: "#a78bfa" };

function VennFrame({ layout, children, svgRef, extraH = 0 }: { layout: Layout; children?: React.ReactNode; svgRef?: React.Ref<SVGSVGElement>; extraH?: number }) {
  const spec = LAYOUTS[layout];
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB_W} ${VB_H + extraH}`}
      className="mx-auto block w-full max-w-[520px] touch-none select-none"
      role="img"
      aria-label="벤 다이어그램"
    >
      {spec.circles.map((c) => {
        const col = c.label === "A = B" ? "#34d399" : CIRCLE_COLOR[c.key];
        return (
          <g key={c.key}>
            <circle cx={c.cx} cy={c.cy} r={c.r} fill={`${col}12`} stroke={col} strokeWidth={3} />
            <text x={c.cx} y={c.cy - c.r + 24} textAnchor="middle" fill={col} className="font-serif text-[19px] font-bold italic">
              {c.label}
            </text>
          </g>
        );
      })}
      {children}
    </svg>
  );
}

function VChip({ x, y, label, tone = "idle" }: { x: number; y: number; label: string; tone?: "idle" | "good" | "bad" | "wait" }) {
  const fill = tone === "good" ? "#34d39933" : tone === "bad" ? "#fb718533" : tone === "wait" ? "#ffffff12" : "#ffffff18";
  const stroke = tone === "good" ? "#34d399" : tone === "bad" ? "#fb7185" : tone === "wait" ? "#64748b" : "#cbd5e1";
  return (
    <g>
      <rect x={x - 17} y={y - 14} width={34} height={28} rx={9} fill={fill} stroke={stroke} strokeWidth={2} />
      <text x={x} y={y + 5} textAnchor="middle" className="fill-white font-mono text-[14px] font-bold">
        {label}
      </text>
    </g>
  );
}

/** 원소가 제자리에 놓인 벤 다이어그램 (보기 전용) */
function VennView({ layout, A, B }: { layout: Layout; A: string[]; B: string[] }) {
  const spec = LAYOUTS[layout];
  const pool = [...new Set([...A, ...B])];
  const nodes: React.ReactNode[] = [];
  (["A", "B", "both", "out"] as Region[]).forEach((rg) => {
    const members = pool.filter((x) => regionOf(x, A, B) === rg);
    const an = spec.anchors[rg];
    if (!members.length || !an) return;
    slots(an, members.length).forEach((p, i) => nodes.push(<VChip key={`${rg}${i}`} x={p.x} y={p.y} label={members[i]} />));
  });
  return <VennFrame layout={layout}>{nodes}</VennFrame>;
}

/** 고를 수 있는 작은 그림 */
const MINI: Record<Layout, { circles: { cx: number; cy: number; r: number; key: string; label: string }[] }> = {
  single: { circles: [{ cx: 70, cy: 45, r: 34, key: "A", label: "A" }] },
  AinB: {
    circles: [
      { cx: 70, cy: 45, r: 40, key: "B", label: "B" },
      { cx: 70, cy: 54, r: 19, key: "A", label: "A" },
    ],
  },
  BinA: {
    circles: [
      { cx: 70, cy: 45, r: 40, key: "A", label: "A" },
      { cx: 70, cy: 54, r: 19, key: "B", label: "B" },
    ],
  },
  cross: {
    circles: [
      { cx: 55, cy: 46, r: 32, key: "A", label: "A" },
      { cx: 85, cy: 46, r: 32, key: "B", label: "B" },
    ],
  },
  apart: {
    circles: [
      { cx: 37, cy: 46, r: 29, key: "A", label: "A" },
      { cx: 103, cy: 46, r: 29, key: "B", label: "B" },
    ],
  },
  equal: { circles: [{ cx: 70, cy: 45, r: 38, key: "A", label: "A = B" }] },
};

function MiniVenn({ layout }: { layout: Layout }) {
  return (
    <svg viewBox="0 0 140 90" className="block w-full" role="img" aria-label="포함관계 그림">
      {MINI[layout].circles.map((c, i) => {
        const col = c.label === "A = B" ? "#34d399" : CIRCLE_COLOR[c.key];
        return (
          <g key={i}>
            <circle cx={c.cx} cy={c.cy} r={c.r} fill={`${col}12`} stroke={col} strokeWidth={2.5} />
            <text x={c.cx} y={c.cy - c.r + 14} textAnchor="middle" fill={col} className="font-serif text-[11px] font-bold italic">
              {c.label}
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
type Tab = "subset" | "equal" | "venn" | "relation";

export default function SubsetLab() {
  const [tab, setTab] = useState<Tab>("subset");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🫧 부분집합과 포함관계</h3>
        <p className="mt-2 leading-7 text-slate-300">
          원소를 하나씩 대어 보며 <b className="text-sky-200">⊂ · ⊄</b>를 가리고, 양쪽을 모두 따져 <b className="text-emerald-200">A = B</b>를 확인하고, 두 집합의 관계를{" "}
          <b className="text-violet-200">벤 다이어그램</b>으로 그려 봅시다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "subset"} onClick={() => setTab("subset")}>
          ① 원소 검문소 🚧
        </TabButton>
        <TabButton active={tab === "equal"} onClick={() => setTab("equal")}>
          ② 상등과 진부분집합 ⚖️
        </TabButton>
        <TabButton active={tab === "venn"} onClick={() => setTab("venn")}>
          ③ 벤 다이어그램 🎨
        </TabButton>
        <TabButton active={tab === "relation"} onClick={() => setTab("relation")}>
          ④ 포함관계 그림 🔗
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "subset" ? <SubsetTab /> : null}
        {tab === "equal" ? <EqualTab /> : null}
        {tab === "venn" ? <VennTab /> : null}
        {tab === "relation" ? <RelationTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 원소 검문소
// ══════════════════════════════════════════════════════════════
function SubsetTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = SUBSETS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🚧 A 의 원소를 하나씩 B 에 대어 보세요</p>
          <Chips ids={SUBSETS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            A 의 <b className="text-emerald-200">모든</b> 원소가 B 에 속한다 <Katex expr="\;\Rightarrow\; A \subset B" />
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            B 에 <b className="text-rose-200">속하지 않는</b> 원소가 있다 <Katex expr="\;\Rightarrow\; A \not\subset B" />
          </p>
        </div>
      </div>

      <SubsetOne
        key={p.id}
        p={p}
        last={i === SUBSETS.length - 1}
        onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))}
        onNext={() => setI((k) => Math.min(SUBSETS.length - 1, k + 1))}
      />

      {done.length === SUBSETS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 통과했어요!</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <p className="rounded-xl bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">
              공집합에는 걸릴 원소가 없어요
              <br />
              <span className="text-emerald-200">
                <Katex expr="\varnothing \subset A" />
              </span>
            </p>
            <p className="rounded-xl bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">
              자기 원소는 모두 자기 안에 있어요
              <br />
              <span className="text-emerald-200">
                <Katex expr="A \subset A" />
              </span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SubsetOne({ p, last, onDone, onNext }: { p: SubProblem; last: boolean; onDone: () => void; onNext: () => void }) {
  const [checked, setChecked] = useState<string[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [pick, setPick] = useState<boolean | null>(null);

  const ans = isSubset(p.A.items, p.B.items);
  const ok = pick !== null && pick === ans;
  const allChecked = checked.length === p.A.items.length;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function inspect(x: string) {
    setFocus(x);
    setChecked((s) => (s.includes(x) ? s : [...s, x]));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-sky-400/40 bg-sky-400/[0.07] p-3">
          <SetHead spec={p.A} tone="sky" withItems />
          <p className="mt-2 text-center text-[11px] text-slate-400">👆 원소를 눌러 B 에 있는지 검사해 보세요</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {p.A.items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/20 px-4 py-3 text-center text-[12px] leading-6 text-slate-400">
                검사할 원소가 하나도 없어요
                <br />
                <span className="text-emerald-200">B 에 속하지 않는 원소도 없겠네요!</span>
              </p>
            ) : (
              p.A.items.map((x) => (
                <EChip
                  key={x}
                  label={x}
                  tone={!checked.includes(x) ? "idle" : p.B.items.includes(x) ? "good" : "bad"}
                  onClick={() => inspect(x)}
                />
              ))
            )}
          </div>
          {p.A.items.length ? (
            <p className={"mt-2 text-center text-[11px] font-bold " + (allChecked ? "text-emerald-200" : "text-slate-400")}>검사한 원소 {checked.length} / {p.A.items.length}</p>
          ) : null}
        </div>

        <p className="text-center text-lg text-slate-500">↓ B 에 있나요?</p>

        <div className="rounded-2xl border-2 border-violet-400/40 bg-violet-400/[0.07] p-3">
          <SetHead spec={p.B} tone="violet" withItems />
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {p.B.items.map((x) => (
              <EChip key={x} label={x} tone={focus === x ? "focus" : checked.includes(x) ? "good" : "idle"} />
            ))}
          </div>
          {focus ? (
            <p className={"mt-2 text-center text-[12px] font-bold " + (p.B.items.includes(focus) ? "text-emerald-200" : "text-rose-200")}>
              {p.B.items.includes(focus) ? `✓ ${focus} 은(는) B 에 있어요 — 통과!` : `✗ ${focus} 은(는) B 에 없어요 — 여기서 걸렸어요!`}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <YesNo
          q={
            <>
              <Katex expr={`${p.A.name} \\subset ${p.B.name}`} /> 일까요?
            </>
          }
          pick={pick}
          ans={ans}
          onPick={setPick}
          locked={false}
          yes="⭕ 부분집합이다"
          no="❌ 부분집합이 아니다"
        />
        {pick !== null && !ok ? <p className="text-center text-[11px] font-bold text-rose-200">다시 생각해 보세요 — 걸린 원소가 있었나요?</p> : null}
        {ok ? (
          <>
            <div className="rounded-2xl border-2 border-emerald-400/55 bg-emerald-400/12 px-4 py-3 text-center text-xl text-emerald-100">
              <Katex expr={`${p.A.name} ${ans ? "\\subset" : "\\not\\subset"} ${p.B.name}`} />
            </div>
            <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {p.tip}</p>
            {!last ? <NextBtn onClick={onNext} /> : null}
          </>
        ) : (
          <div className="flex min-h-[7rem] items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 text-center">
            <p className="text-[12px] leading-6 text-slate-500">
              원소를 모두 검사한 뒤
              <br />
              판정해 보세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 상등과 진부분집합
// ══════════════════════════════════════════════════════════════
function EqualTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = EQUALS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">⚖️ 양쪽을 모두 따져 보세요</p>
          <Chips ids={EQUALS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
          <Katex expr="A \subset B" /> 이고 <Katex expr="B \subset A" /> 이면 <b className="text-emerald-200">두 집합은 서로 같다</b> <Katex expr="\;\Rightarrow\; A = B" />
        </p>
      </div>

      <EqualOne
        key={p.id}
        p={p}
        last={i === EQUALS.length - 1}
        onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))}
        onNext={() => setI((k) => Math.min(EQUALS.length - 1, k + 1))}
      />

      <ProperSection />
    </div>
  );
}

function EqualOne({ p, last, onDone, onNext }: { p: EqProblem; last: boolean; onDone: () => void; onNext: () => void }) {
  const [ab, setAb] = useState<boolean | null>(null);
  const [ba, setBa] = useState<boolean | null>(null);
  const [eq, setEq] = useState<boolean | null>(null);

  const ansAb = isSubset(p.A.items, p.B.items);
  const ansBa = isSubset(p.B.items, p.A.items);
  const ansEq = sameSet(p.A.items, p.B.items);
  const okAb = ab !== null && ab === ansAb;
  const okBa = ba !== null && ba === ansBa;
  const ok = okAb && okBa && eq !== null && eq === ansEq;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-sky-400/40 bg-sky-400/[0.07] p-3">
          <SetHead spec={p.A} tone="sky" withItems />
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {p.A.items.map((x) => (
              <EChip key={x} label={x} tone={okAb && okBa ? (p.B.items.includes(x) ? "good" : "bad") : "idle"} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border-2 border-violet-400/40 bg-violet-400/[0.07] p-3">
          <SetHead spec={p.B} tone="violet" withItems />
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {p.B.items.map((x) => (
              <EChip key={x} label={x} tone={okAb && okBa ? (p.A.items.includes(x) ? "good" : "bad") : "idle"} />
            ))}
          </div>
        </div>
        {okAb && okBa ? (
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[11px] leading-5 text-slate-300">
            <b className="text-emerald-200">초록</b> = 상대 집합에도 있는 원소 · <b className="text-rose-200">빨강</b> = 상대 집합에 없는 원소
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <YesNo q={<Katex expr={`A \\subset B`} />} pick={ab} ans={ansAb} onPick={setAb} locked={false} />
        <YesNo q={<Katex expr={`B \\subset A`} />} pick={ba} ans={ansBa} onPick={setBa} locked={!okAb} />
        <div className={"rounded-2xl border-2 p-3 transition " + (ok ? "border-emerald-400/60 bg-emerald-400/15" : okAb && okBa ? "border-violet-400/45 bg-violet-400/[0.09]" : "border-white/10 bg-white/[0.03] opacity-45")}>
          <p className="text-center text-sm font-bold text-slate-100">그러면 두 집합은?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[true, false].map((v) => {
              const on = eq === v;
              const good = eq !== null && v === ansEq;
              const bad = on && v !== ansEq;
              return (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setEq(v)}
                  disabled={!(okAb && okBa) || ok}
                  className={
                    "rounded-xl border-2 px-2 py-2 text-base font-bold transition disabled:cursor-default " +
                    (good
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : bad
                        ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  <Katex expr={v ? "A = B" : "A \\ne B"} />
                </button>
              );
            })}
          </div>
        </div>
        {ok ? (
          <>
            <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {p.tip}</p>
            {!last ? <NextBtn onClick={onNext} /> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function ProperSection() {
  const [picked, setPicked] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const key = maskKey(POWER_BASE, picked);
  const all = allMasks(POWER_BASE.length);
  const fullKey = "1".repeat(POWER_BASE.length);
  const already = found.includes(key);
  const complete = found.length === all.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <p className="text-sm font-bold text-slate-100">🎁 부분집합을 모두 모아 보세요</p>
      <p className="mt-1 text-[11px] leading-5 text-slate-400">
        <b className="text-amber-200">진부분집합</b> — 어떤 집합에 대하여 <b className="text-white">자기 자신이 아닌</b> 부분집합
      </p>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-sky-400/40 bg-sky-400/[0.07] p-3 text-center">
            <p className="text-base font-semibold text-sky-100">
              <Katex expr={`S = ${listTex(POWER_BASE)}`} />
            </p>
            <p className="mt-2 text-[11px] text-slate-400">원소마다 넣을지 뺄지 정해 보세요</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {POWER_BASE.map((x) => (
                <EChip
                  key={x}
                  label={x}
                  tone={picked.includes(x) ? "good" : "dim"}
                  onClick={() => setPicked((s) => (s.includes(x) ? s.filter((y) => y !== x) : [...s, x]))}
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
            <p className="text-[11px] font-bold text-slate-400">지금 만든 부분집합</p>
            <div className="mt-1 text-lg text-slate-100">
              <Katex expr={listTex(POWER_BASE.filter((x) => picked.includes(x)))} />
            </div>
            {key === fullKey ? <p className="mt-1 text-[11px] font-bold text-amber-200">자기 자신이라 진부분집합은 아니에요</p> : null}
          </div>

          <button
            type="button"
            onClick={() => setFound((s) => (s.includes(key) ? s : [...s, key]))}
            disabled={already}
            className="w-full rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 px-3 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/25 disabled:opacity-40"
          >
            {already ? "이미 담은 부분집합이에요" : "＋ 이 부분집합 담기"}
          </button>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            {all.map((k) => {
              const got = found.includes(k);
              const self = k === fullKey;
              return (
                <div
                  key={k}
                  className={
                    "rounded-xl border-2 px-2 py-2 text-center transition " +
                    (!got ? "border-dashed border-white/15 bg-white/[0.03]" : self ? "border-amber-400/60 bg-amber-400/15" : "border-emerald-400/50 bg-emerald-400/15")
                  }
                >
                  {got ? (
                    <>
                      <span className="text-slate-100">
                        <Katex expr={listTex(maskItems(POWER_BASE, k))} />
                      </span>
                      {self ? <p className="text-[9px] font-bold text-amber-200">자기 자신</p> : null}
                    </>
                  ) : (
                    <span className="font-mono text-sm text-slate-600">? ? ?</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className={"text-center text-[12px] font-bold " + (complete ? "text-emerald-200" : "text-slate-400")}>
            {complete ? "🎉 부분집합을 모두 찾았어요!" : `찾은 부분집합 ${found.length} / ${all.length}`}
          </p>
          {complete ? (
            <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-3 text-center">
              <p className="text-[12px] leading-7 text-slate-200">
                원소가 3개니까 부분집합은 <Katex expr="2^3 = 8" /> 개
                <br />
                자기 자신을 뺀 진부분집합은 <Katex expr="2^3 - 1 = 7" /> 개
              </p>
              <div className="mt-2 overflow-x-auto overflow-y-hidden py-1">
                <table className="mx-auto text-[11px] text-slate-300">
                  <tbody>
                    <tr>
                      <td className="px-2 py-1 font-bold text-slate-400">원소의 개수</td>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <td key={n} className="px-3 py-1 font-mono font-bold text-white">
                          {n}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-white/10">
                      <td className="px-2 py-1 font-bold text-slate-400">부분집합의 개수</td>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <td key={n} className="px-3 py-1 font-mono font-bold text-emerald-200">
                          {2 ** n}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 벤 다이어그램 만들기
// ══════════════════════════════════════════════════════════════
const WAIT_Y = VB_H + 42;
const EXTRA_H = 84;

function useSvgDrag(
  svgRef: React.RefObject<SVGSVGElement | null>,
  h: number,
  onMove: (p: { x: number; y: number }) => void,
  onEnd: (p: { x: number; y: number }) => void,
) {
  const [on, setOn] = useState(false);
  const mv = useRef(onMove);
  const up = useRef(onEnd);
  useEffect(() => {
    mv.current = onMove;
    up.current = onEnd;
  });
  useEffect(() => {
    if (!on) return;
    function toP(e: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) return { x: -1, y: -1 };
      const r = svg.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (VB_W / r.width), y: (e.clientY - r.top) * (h / r.height) };
    }
    function move(e: PointerEvent) {
      e.preventDefault();
      mv.current(toP(e));
    }
    function end(e: PointerEvent) {
      up.current(toP(e));
      setOn(false);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    };
  }, [on, svgRef, h]);
  return { start: () => setOn(true) };
}

function VennTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = VENN_TASKS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎨 원소를 끌어다 알맞은 자리에 놓으세요</p>
          <Chips ids={VENN_TASKS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          집합을 원으로 그리고 그 안에 원소를 써넣은 그림을 <b className="text-amber-200">벤 다이어그램</b>이라고 해요. 자리를 잘못 놓으면 원소가 제자리로 돌아옵니다.
        </p>
      </div>

      <VennOne
        key={t.id}
        t={t}
        last={i === VENN_TASKS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(VENN_TASKS.length - 1, k + 1))}
      />
    </div>
  );
}

function VennOne({ t, last, onDone, onNext }: { t: VennTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const H = VB_H + EXTRA_H;
  const spec = LAYOUTS[t.layout];
  const A = t.A.items;
  const B = t.B?.items ?? [];

  const [placed, setPlaced] = useState<boolean[]>(() => t.pool.map(() => false));
  const [drag, setDrag] = useState<{ i: number; x: number; y: number } | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const [miss, setMiss] = useState(0);
  const heldRef = useRef<number | null>(null);

  const cleared = placed.every(Boolean);
  const doneRef = useRef(false);
  useEffect(() => {
    if (cleared && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function homeX(i: number) {
    return (VB_W / (t.pool.length + 1)) * (i + 1);
  }

  /** 원소가 놓여야 할 자리 */
  function seat(x: string) {
    const rg = regionOf(x, A, B);
    const an = spec.anchors[rg];
    if (!an) return null;
    const members = t.pool.filter((y) => regionOf(y, A, B) === rg);
    const ps = slots(an, members.length);
    return ps[members.indexOf(x)] ?? null;
  }

  function drop(p: { x: number; y: number }) {
    const i = heldRef.current;
    heldRef.current = null;
    setDrag(null);
    if (i === null) return;
    if (p.y > VB_H) return; // 대기 줄로 되돌림
    const want = regionOf(t.pool[i], A, B);
    const got = regionAt(spec, p.x, p.y);
    if (got === want && seat(t.pool[i])) {
      setPlaced((s) => s.map((v, k) => (k === i ? true : v)));
      setWrong(null);
    } else {
      setWrong(i);
      setMiss((m) => m + 1);
    }
  }

  const { start } = useSvgDrag(svgRef, H, (p) => setDrag((d) => (d ? { ...d, x: p.x, y: p.y } : d)), drop);

  function grab(i: number, e: React.PointerEvent) {
    if (placed[i]) return;
    e.preventDefault();
    setWrong(null);
    heldRef.current = i;
    setDrag({ i, x: homeX(i), y: WAIT_Y });
    start();
  }

  const hoverRegion = drag && drag.y <= VB_H ? regionAt(spec, drag.x, drag.y) : null;

  return (
    <div className="space-y-3">
      <div className={"rounded-2xl border-2 p-3 transition " + (cleared ? "border-emerald-400/55 bg-emerald-400/[0.10]" : "border-white/10 bg-white/5")}>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <SetHead spec={t.A} tone="sky" withItems />
          {t.B ? <SetHead spec={t.B} tone="violet" withItems /> : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
        <VennFrame layout={t.layout} svgRef={svgRef} extraH={EXTRA_H}>
          {/* 지금 손이 올라가 있는 영역 알려 주기 */}
          {hoverRegion && hoverRegion !== "out"
            ? spec.circles
                .filter((c) => (hoverRegion === "both" ? true : c.key === hoverRegion))
                .map((c) => <circle key={`h${c.key}`} cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke="#22d3ee" strokeWidth={4} opacity={0.6} />)
            : null}

          <line x1={14} y1={VB_H + 6} x2={VB_W - 14} y2={VB_H + 6} stroke="rgba(255,255,255,0.08)" strokeWidth={2} strokeDasharray="7 6" />
          <text x={VB_W / 2} y={VB_H + 26} textAnchor="middle" className="fill-slate-500 text-[12px]">
            아직 놓지 않은 원소
          </text>

          {t.pool.map((x, i) => {
            const dragging = drag?.i === i;
            const home = { x: homeX(i), y: WAIT_Y };
            const pos = dragging ? { x: drag.x, y: drag.y } : placed[i] ? (seat(x) ?? home) : home;
            const tone = placed[i] ? "good" : wrong === i ? "bad" : dragging ? "idle" : "wait";
            return (
              <g key={x} className={placed[i] ? undefined : "cursor-grab touch-none"} onPointerDown={placed[i] ? undefined : (e) => grab(i, e)} opacity={dragging ? 0.92 : 1}>
                {placed[i] ? null : <rect x={pos.x - 22} y={pos.y - 20} width={44} height={40} fill="transparent" />}
                <VChip x={pos.x} y={pos.y} label={x} tone={tone} />
              </g>
            );
          })}
        </VennFrame>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <p className={"rounded-xl px-3 py-2 text-center text-[12px] font-bold " + (cleared ? "bg-emerald-400/15 text-emerald-100" : "bg-white/5 text-slate-300")}>
          {cleared ? "🎉 벤 다이어그램을 완성했어요!" : `놓은 원소 ${placed.filter(Boolean).length} / ${t.pool.length}`}
          {miss > 0 ? <span className="ml-2 font-normal text-rose-300">되돌아온 횟수 {miss}</span> : null}
        </p>
        <p className="rounded-xl bg-black/25 px-3 py-2 text-center text-[11px] text-slate-400">🖱️ 아래 줄의 원소를 끌어다 원 안이나 밖에 놓으세요</p>
      </div>

      {cleared ? (
        <>
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {t.tip}</p>
          {!last ? <NextBtn onClick={onNext} /> : null}
        </>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 포함관계 그림
// ══════════════════════════════════════════════════════════════
function RelationTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = RELATIONS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔗 두 기호를 정하면 그림이 정해져요</p>
          <Chips ids={RELATIONS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
      </div>

      <RelationOne
        key={p.id}
        p={p}
        last={i === RELATIONS.length - 1}
        onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))}
        onNext={() => setI((k) => Math.min(RELATIONS.length - 1, k + 1))}
      />

      {done.length === RELATIONS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 다섯 가지 관계를 모두 그려 봤어요!</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { l: "AinB" as Layout, tex: "A \\subset B,\\; B \\not\\subset A" },
                { l: "BinA" as Layout, tex: "B \\subset A,\\; A \\not\\subset B" },
                { l: "cross" as Layout, tex: "A \\not\\subset B,\\; B \\not\\subset A" },
                { l: "equal" as Layout, tex: "A \\subset B,\\; B \\subset A" },
              ]
            ).map((x) => (
              <div key={x.l} className="rounded-xl border border-white/10 bg-black/25 p-2">
                <MiniVenn layout={x.l} />
                <p className="mt-1 text-center text-[11px] text-slate-200">
                  <Katex expr={x.tex} />
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[11px] leading-5 text-slate-300">
            <Katex expr="A \not\subset B" /> 이고 <Katex expr="B \not\subset A" /> 일 때는 함께 가진 원소가 있으면 <b className="text-white">겹치게</b>, 없으면{" "}
            <b className="text-white">떨어뜨려</b> 그려요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function RelationOne({ p, last, onDone, onNext }: { p: RelProblem; last: boolean; onDone: () => void; onNext: () => void }) {
  const [ab, setAb] = useState<boolean | null>(null);
  const [ba, setBa] = useState<boolean | null>(null);
  const [pickL, setPickL] = useState<Layout | null>(null);

  const ansAb = isSubset(p.A.items, p.B.items);
  const ansBa = isSubset(p.B.items, p.A.items);
  const ansL = layoutOf(p.A.items, p.B.items);
  const okAb = ab !== null && ab === ansAb;
  const okBa = ba !== null && ba === ansBa;
  const step3 = okAb && okBa;
  const ok = step3 && pickL === ansL;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-white/10 bg-white/5 p-3">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1">
          <SetHead spec={p.A} tone="sky" withItems />
          <SetHead spec={p.B} tone="violet" withItems />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <YesNo q={<Katex expr="A \subset B" />} pick={ab} ans={ansAb} onPick={setAb} locked={false} />
          <YesNo q={<Katex expr="B \subset A" />} pick={ba} ans={ansBa} onPick={setBa} locked={!okAb} />
          <div className={"rounded-2xl border-2 p-3 transition " + (ok ? "border-emerald-400/60 bg-emerald-400/15" : step3 ? "border-violet-400/45 bg-violet-400/[0.09]" : "border-white/10 bg-white/[0.03] opacity-45")}>
            <p className="text-center text-sm font-bold text-slate-100">어떤 그림일까요?</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {PICK_LAYOUTS.map((x) => {
                const on = pickL === x.key;
                const good = pickL !== null && x.key === ansL && ok;
                const bad = on && x.key !== ansL;
                return (
                  <button
                    key={x.key}
                    type="button"
                    onClick={() => setPickL(x.key)}
                    disabled={!step3 || ok}
                    className={
                      "rounded-xl border-2 p-1 transition disabled:cursor-default " +
                      (good
                        ? "border-emerald-400/70 bg-emerald-400/20"
                        : bad
                          ? "border-rose-400/70 bg-rose-400/20"
                          : "border-white/10 bg-white/5 hover:bg-white/10")
                    }
                  >
                    <MiniVenn layout={x.key} />
                    <p className="mt-0.5 text-center text-[10px] font-bold text-slate-300">{x.label}</p>
                  </button>
                );
              })}
            </div>
            {pickL !== null && step3 && !ok ? <p className="mt-1.5 text-center text-[11px] font-bold text-rose-200">다시 골라 보세요 — 함께 가진 원소가 있나요?</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          <div className={"rounded-2xl border-2 p-3 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/[0.10]" : "border-white/10 bg-slate-950/60")}>
            {ok ? (
              <VennView layout={ansL} A={p.A.items} B={p.B.items} />
            ) : (
              <div className="flex h-full min-h-[13rem] items-center justify-center px-4 text-center">
                <p className="text-[12px] leading-6 text-slate-500">
                  두 기호를 맞히고 그림을 고르면
                  <br />
                  원소가 놓인 벤 다이어그램이 나타나요
                </p>
              </div>
            )}
          </div>
          {ok ? (
            <>
              <div className="rounded-xl bg-black/25 px-3 py-2 text-center text-base text-slate-100">
                <Katex expr={`${ansAb ? "A \\subset B" : "A \\not\\subset B"},\\quad ${ansBa ? "B \\subset A" : "B \\not\\subset A"}`} />
              </div>
              <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {p.tip}</p>
              {!last ? <NextBtn onClick={onNext} /> : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
