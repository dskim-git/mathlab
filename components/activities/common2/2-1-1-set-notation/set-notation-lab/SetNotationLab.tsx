"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  BALL_ROUNDS,
  CARDS,
  CONVS,
  DETECTIVE_MAX,
  MYSTERIES,
  PREDS,
  RANGES,
  buildSet,
  listTex,
  mysterySet,
  sameSet,
  type BallRound,
  type Conv,
  type Mystery,
  type SetCard,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "what_makes_a_set",
    prompt:
      "탭①에서 '집합이 아니다'로 갈라 담은 모임들에는 어떤 공통점이 있었나요? 집합이 되기 위해 꼭 필요한 조건을 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: '키가 큰', '맛이 좋은', '가까운'처럼 사람마다 기준이 다른 말이 들어 있었다. 그러면 어떤 대상이 들어가고 어떤 대상이 빠지는지 정할 수 없다. 집합이 되려면 주어진 조건만 보고 그 대상에 속하는지 아닌지를 누구나 똑같이 판단할 수 있어야 한다.",
  },
  {
    id: "symbol_meaning",
    prompt:
      "탭②에서 수를 ∈ 바구니와 ∉ 바구니로 나누어 담았어요. 두 기호가 각각 무엇을 뜻하는지, 그리고 집합은 대문자·원소는 소문자로 쓰는 약속이 왜 편리한지 써 보세요.",
    kind: "text",
    placeholder:
      "예: a ∈ A 는 a가 집합 A의 원소라는 뜻이고, b ∉ B 는 b가 집합 B의 원소가 아니라는 뜻이다. 대문자와 소문자를 구별해 쓰면 기호만 보고도 어느 쪽이 모임이고 어느 쪽이 그 안의 대상인지 바로 알 수 있어서 헷갈리지 않는다.",
  },
  {
    id: "two_ways",
    prompt:
      "탭③에서 같은 집합을 원소나열법과 조건제시법 두 가지로 나타내 보았어요. 각 방법이 편했던 때와 불편했던 때를 견주어 보고, 조건제시법의 답이 하나가 아닐 수 있었던 까닭도 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 원소가 몇 개 안 될 때는 원소나열법이 한눈에 들어와 편했지만, 원소가 많아지면 다 적기 힘들어 조건제시법이 편했다. 대신 조건제시법은 어떤 수가 들어 있는지 바로 보이지 않는다. 또 {2, 3, 5, 7}처럼 '10 이하의 소수'와 '10보다 작은 소수'가 같은 집합을 나타내기도 해서, 조건을 다르게 써도 원소가 같으면 같은 집합이다.",
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

/** 조건제시법 { x | x는 ~ } — KaTeX 안에 한글을 넣을 수 없어 HTML로 조립 */
function CondBox({
  name,
  children,
  tone = "slate",
}: {
  name?: string;
  children: React.ReactNode;
  tone?: "slate" | "amber" | "violet";
}) {
  const c = tone === "amber" ? "text-amber-100" : tone === "violet" ? "text-violet-100" : "text-slate-100";
  return (
    <span className={"inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-base font-semibold " + c}>
      {name ? (
        <>
          <i className="font-serif italic">{name}</i>
          <span>=</span>
        </>
      ) : null}
      <span className="text-slate-400">{"{"}</span>
      <i className="font-serif italic">x</i>
      <span className="text-slate-400">|</span>
      <span>
        <i className="font-serif italic">x</i>는 {children}
      </span>
      <span className="text-slate-400">{"}"}</span>
    </span>
  );
}

function ElemChip({
  label,
  state,
  onClick,
}: {
  label: string;
  state: "idle" | "good" | "bad" | "miss";
  onClick?: () => void;
}) {
  const cls =
    state === "good"
      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
      : state === "bad"
        ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
        : state === "miss"
          ? "border-dashed border-amber-400/60 bg-amber-400/10 text-amber-200"
          : "border-white/12 bg-white/5 text-slate-200 hover:bg-white/12";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={"h-10 min-w-[2.75rem] rounded-xl border-2 px-2.5 font-mono text-base font-bold transition " + cls}
    >
      {label}
    </Tag>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
type Tab = "judge" | "basket" | "convert" | "detective";

export default function SetNotationLab() {
  const [tab, setTab] = useState<Tab>("judge");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🎒 집합의 뜻과 표현</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-amber-200">조건이 분명한 모임</b>만이 집합이에요. 어떤 모임이 집합인지 가려내고, <b className="text-emerald-200">∈ · ∉</b> 기호로 원소를 나타내고,{" "}
          <b className="text-sky-200">두 가지 표현법</b>을 자유롭게 오가 보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "judge"} onClick={() => setTab("judge")}>
          ① 집합일까? 🗂️
        </TabButton>
        <TabButton active={tab === "basket"} onClick={() => setTab("basket")}>
          ② 기호 바구니 🧺
        </TabButton>
        <TabButton active={tab === "convert"} onClick={() => setTab("convert")}>
          ③ 표현 바꾸기 🔁
        </TabButton>
        <TabButton active={tab === "detective"} onClick={() => setTab("detective")}>
          ④ 집합 탐정 🔍
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "judge" ? <JudgeTab /> : null}
        {tab === "basket" ? <BasketTab /> : null}
        {tab === "convert" ? <ConvertTab /> : null}
        {tab === "detective" ? <DetectiveTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 집합일까?
// ══════════════════════════════════════════════════════════════
function JudgeTab() {
  const [ci, setCi] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const c = CARDS[ci];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🗂️ 이 모임은 집합일까요?</p>
          <Chips ids={CARDS.map((x) => x.id)} cur={ci} done={done} onPick={setCi} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
            <b className="text-amber-200">집합</b> — 주어진 조건에 의하여 그 대상을 <b className="text-white">분명히 할 수 있는</b> 것들의 모임
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
            <b className="text-emerald-200">원소</b> — 집합에 <b className="text-white">속하는 대상</b> 하나하나
          </p>
        </div>
      </div>

      <JudgeOne
        key={c.id}
        c={c}
        last={ci === CARDS.length - 1}
        onDone={() => setDone((s) => (s.includes(c.id) ? s : [...s, c.id]))}
        onNext={() => setCi((i) => Math.min(CARDS.length - 1, i + 1))}
      />

      {done.length === CARDS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여덟 장을 모두 갈라 담았어요!</p>
          <p className="mt-2 text-center text-[12px] leading-6 text-slate-300">
            집합이 <b className="text-rose-200">아니었던</b> 모임에는 <b className="text-white">키가 큰 · 맛이 좋은 · 가까운</b> 처럼 사람마다 기준이 다른 말이 들어 있었어요.
            <br />
            누가 판단해도 <b className="text-emerald-200">답이 똑같이 나오는 조건</b>이어야 집합이 됩니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function JudgeOne({ c, last, onDone, onNext }: { c: SetCard; last: boolean; onDone: () => void; onNext: () => void }) {
  const [pick, setPick] = useState<boolean | null>(null);
  const [sel, setSel] = useState<string[]>([]);

  const judged = pick !== null && pick === c.isSet;
  const wrong = pick !== null && pick !== c.isSet;
  const gathered = judged && (!c.isSet || sameStrSet(sel, c.members));
  const cleared = gathered;

  const doneRef = useRef(false);
  useEffect(() => {
    if (cleared && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function toggle(v: string) {
    setSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* 카드 */}
      <div
        className={
          "flex flex-col justify-center rounded-2xl border-2 p-5 transition " +
          (cleared ? "border-emerald-400/55 bg-emerald-400/[0.10]" : wrong ? "border-rose-400/55 bg-rose-400/[0.08]" : "border-amber-400/35 bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.04]")
        }
      >
        <p className="text-center text-[11px] font-bold tracking-widest text-amber-200/80">MOIM CARD</p>
        <div className="mt-3 rounded-xl border border-white/12 bg-black/30 px-4 py-8 text-center">
          <p className="text-lg font-bold leading-8 text-slate-100">
            {c.pre}
            {c.tex ? <Katex expr={c.tex} /> : null}
            {c.post ?? ""}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[true, false].map((v) => {
            const on = pick === v;
            const good = pick !== null && v === c.isSet;
            const bad = on && v !== c.isSet;
            return (
              <button
                key={String(v)}
                type="button"
                onClick={() => setPick(v)}
                disabled={judged}
                className={
                  "rounded-xl border-2 px-3 py-3 text-sm font-bold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                {v ? "⭕ 집합이다" : "❌ 집합이 아니다"}
              </button>
            );
          })}
        </div>
        {wrong ? <p className="mt-2 text-center text-[11px] font-bold text-rose-200">다시 생각해 보세요 — 대상을 분명히 정할 수 있나요?</p> : null}
      </div>

      {/* 오른쪽 : 원소 담기 / 해설 */}
      <div className="space-y-3">
        {!judged ? (
          <div className="flex h-full min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center">
            <p className="text-[12px] leading-6 text-slate-500">
              왼쪽 카드를 먼저 판정해 주세요.
              <br />
              집합이라면 <b className="text-slate-300">원소를 골라 담는</b> 단계가 열려요.
            </p>
          </div>
        ) : c.isSet ? (
          <div className={"rounded-2xl border-2 p-4 transition " + (gathered ? "border-emerald-400/55 bg-emerald-400/12" : "border-sky-400/40 bg-sky-400/[0.07]")}>
            <p className="text-sm font-bold text-sky-100">🧲 이 집합의 원소를 모두 골라 담으세요</p>
            <p className="mt-1 text-[11px] text-slate-400">원소가 아닌 것을 담으면 빨갛게 표시돼요.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {c.pool.map((v) => (
                <ElemChip
                  key={v}
                  label={v}
                  state={!sel.includes(v) ? "idle" : c.members.includes(v) ? "good" : "bad"}
                  onClick={gathered ? undefined : () => toggle(v)}
                />
              ))}
            </div>
            <p className={"mt-3 text-center text-[12px] font-bold " + (gathered ? "text-emerald-200" : "text-slate-400")}>
              {gathered ? "✅ 원소를 모두 찾았어요!" : `담은 원소 ${sel.filter((v) => c.members.includes(v)).length} / ${c.members.length}`}
            </p>
            {gathered ? (
              <div className="mt-2 flex justify-center rounded-lg bg-black/30 px-3 py-2 text-slate-100">
                <Katex expr={listTex(c.members)} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-rose-400/45 bg-rose-400/[0.09] p-4">
            <p className="text-sm font-bold text-rose-100">🚫 집합이 아니에요</p>
            <p className="mt-1.5 text-[12px] leading-6 text-slate-200">{c.why}</p>
          </div>
        )}

        {cleared ? (
          <>
            {c.isSet ? <p className="rounded-xl bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {c.why}</p> : null}
            {!last ? (
              <button
                type="button"
                onClick={onNext}
                className="w-full rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
              >
                다음 카드 ▶
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function sameStrSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const x = [...a].sort();
  const y = [...b].sort();
  return x.every((v, i) => v === y[i]);
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 기호 바구니
// ══════════════════════════════════════════════════════════════
const BW = 660;
const BH = 390;
const BALL_R = 26;
const HOME_Y = 78;
const BASKETS = [
  { key: "in" as const, x: 26, y: 190, w: 280, h: 178, sym: "∈", label: "원소이다", color: "#34d399" },
  { key: "out" as const, x: 354, y: 190, w: 280, h: 178, sym: "∉", label: "원소가 아니다", color: "#fb7185" },
];
type Bin = "in" | "out";

function homeX(i: number, n: number): number {
  return (BW / (n + 1)) * (i + 1);
}

function binAt(x: number, y: number): Bin | null {
  for (const b of BASKETS) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.key;
  return null;
}

function useSvgDrag(
  svgRef: React.RefObject<SVGSVGElement | null>,
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
      return { x: (e.clientX - r.left) * (BW / r.width), y: (e.clientY - r.top) * (BH / r.height) };
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
  }, [on, svgRef]);
  return { start: () => setOn(true) };
}

function BasketTab() {
  const [ri, setRi] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const r = BALL_ROUNDS[ri];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧺 수를 끌어다 알맞은 바구니에 담으세요</p>
          <Chips ids={BALL_ROUNDS.map((x) => x.id)} cur={ri} done={done} onPick={setRi} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <span className="font-mono text-base font-bold text-emerald-200">∈</span> — <span className="font-serif italic">a</span>가 집합{" "}
            <span className="font-serif italic">A</span>의 원소일 때 <Katex expr="a \in A" />
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <span className="font-mono text-base font-bold text-rose-200">∉</span> — <span className="font-serif italic">b</span>가 집합{" "}
            <span className="font-serif italic">B</span>의 원소가 아닐 때 <Katex expr="b \notin B" />
          </p>
        </div>
        <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-1.5 text-center text-[11px] text-slate-400">
          ※ 집합은 알파벳 <b className="text-slate-200">대문자</b>로, 원소는 알파벳 <b className="text-slate-200">소문자</b>로 나타내요
        </p>
      </div>

      <BasketOne key={r.id} r={r} onDone={() => setDone((s) => (s.includes(r.id) ? s : [...s, r.id]))} />
    </div>
  );
}

function BasketOne({ r, onDone }: { r: BallRound; onDone: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [placed, setPlaced] = useState<(Bin | null)[]>(() => r.balls.map(() => null));
  const [drag, setDrag] = useState<{ i: number; x: number; y: number } | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const [miss, setMiss] = useState(0);
  /** 끌고 있는 공의 번호 — 놓는 순간에 읽는다 */
  const heldRef = useRef<number | null>(null);

  function drop(p: { x: number; y: number }) {
    const i = heldRef.current;
    heldRef.current = null;
    setDrag(null);
    if (i === null) return;
    const bin = binAt(p.x, p.y);
    if (!bin) return;
    const right: Bin = r.all.includes(r.balls[i]) ? "in" : "out";
    if (bin === right) {
      setPlaced((s) => s.map((v, k) => (k === i ? bin : v)));
      setWrong(null);
    } else {
      setWrong(i);
      setMiss((m) => m + 1);
    }
  }

  const { start } = useSvgDrag(
    svgRef,
    (p) => setDrag((d) => (d ? { ...d, x: p.x, y: p.y } : d)),
    drop,
  );

  const doneCount = placed.filter((v) => v !== null).length;
  const all = doneCount === r.balls.length;

  const doneRef = useRef(false);
  useEffect(() => {
    if (all && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const hover = drag ? binAt(drag.x, drag.y) : null;

  function grab(i: number, e: React.PointerEvent) {
    if (placed[i]) return;
    e.preventDefault();
    setWrong(null);
    heldRef.current = i;
    setDrag({ i, x: homeX(i, r.balls.length), y: HOME_Y });
    start();
  }

  // 바구니 안 자리
  function slot(bin: Bin, order: number) {
    const b = BASKETS.find((x) => x.key === bin)!;
    return { x: b.x + 46 + (order % 4) * 63, y: b.y + 78 + Math.floor(order / 4) * 52 };
  }
  const order: number[] = r.balls.map(() => 0);
  (["in", "out"] as Bin[]).forEach((bin) => {
    let k = 0;
    placed.forEach((v, i) => {
      if (v === bin) order[i] = k++;
    });
  });

  const example = r.balls.find((b) => r.all.includes(b));
  const example2 = r.balls.find((b) => !r.all.includes(b));

  return (
    <div className="space-y-3">
      <div className={"rounded-2xl border-2 px-4 py-3 text-center transition " + (all ? "border-emerald-400/55 bg-emerald-400/12" : "border-white/10 bg-white/5")}>
        <CondBox name={r.name} tone="amber">
          {r.cond}
        </CondBox>
        <p className={"mt-1 text-[12px] font-bold " + (all ? "text-emerald-200" : "text-slate-400")}>
          {all ? "🎉 모두 담았어요!" : `담은 수 ${doneCount} / ${r.balls.length}`}
          {miss > 0 ? <span className="ml-2 font-normal text-rose-300">되돌아온 횟수 {miss}</span> : null}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
        <svg ref={svgRef} viewBox={`0 0 ${BW} ${BH}`} className="mx-auto block w-full touch-none select-none" role="img" aria-label="기호 바구니">
          {/* 바구니 */}
          {BASKETS.map((b) => {
            const lit = hover === b.key;
            return (
              <g key={b.key}>
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx={20}
                  fill={lit ? `${b.color}22` : `${b.color}10`}
                  stroke={lit ? b.color : `${b.color}66`}
                  strokeWidth={lit ? 4 : 2.5}
                />
                <text x={b.x + b.w / 2} y={b.y + 42} textAnchor="middle" fill={b.color} className="font-mono text-[30px] font-bold">
                  {b.sym} {r.name}
                </text>
                <text x={b.x + b.w / 2} y={b.y + 62} textAnchor="middle" className="fill-slate-400 text-[12px]">
                  {b.label}
                </text>
              </g>
            );
          })}

          {/* 대기 줄 */}
          <line x1={20} y1={HOME_Y + 52} x2={BW - 20} y2={HOME_Y + 52} stroke="rgba(255,255,255,0.07)" strokeWidth={2} strokeDasharray="7 6" />

          {/* 공 */}
          {r.balls.map((v, i) => {
            const bin = placed[i];
            const dragging = drag?.i === i;
            const pos = dragging
              ? { x: drag.x, y: drag.y }
              : bin
                ? slot(bin, order[i])
                : { x: homeX(i, r.balls.length), y: HOME_Y };
            const rad = bin ? 20 : BALL_R;
            const col = bin === "in" ? "#34d399" : bin === "out" ? "#fb7185" : wrong === i ? "#f43f5e" : "#38bdf8";
            return (
              <g
                key={v}
                className={bin ? undefined : "cursor-grab touch-none"}
                onPointerDown={bin ? undefined : (e) => grab(i, e)}
                opacity={dragging ? 0.92 : 1}
              >
                <circle cx={pos.x} cy={pos.y} r={rad} fill={`${col}2e`} stroke={col} strokeWidth={dragging ? 4 : 3} />
                <text x={pos.x} y={pos.y + (bin ? 6 : 8)} textAnchor="middle" className={"fill-white font-mono font-bold " + (bin ? "text-[16px]" : "text-[21px]")}>
                  {v}
                </text>
                {wrong === i && !dragging ? (
                  <text x={pos.x} y={pos.y - rad - 8} textAnchor="middle" className="fill-rose-300 text-[13px] font-bold">
                    ✕
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-center text-[11px] text-slate-400">🖱️ 파란 공을 끌어다 바구니 위에서 놓으세요 · 잘못 담으면 제자리로 돌아와요</p>

      {all ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">✅ 집합 {r.name} 의 원소를 모두 가려냈어요</p>
          <div className="mt-2 flex justify-center rounded-lg bg-black/30 px-3 py-2 text-slate-100">
            <Katex expr={`${r.name} = ${listTex(r.all)}`} />
          </div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-slate-200">
              {example !== undefined ? <Katex expr={`${example} \\in ${r.name}`} /> : null}
            </p>
            <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-slate-200">
              {example2 !== undefined ? <Katex expr={`${example2} \\notin ${r.name}`} /> : null}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 표현 바꾸기
// ══════════════════════════════════════════════════════════════
function ConvertTab() {
  const [vi, setVi] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const v = CONVS[vi];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔁 같은 집합을 다른 방법으로 나타내 보세요</p>
          <Chips ids={CONVS.map((x) => x.id)} cur={vi} done={done} onPick={setVi} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
            <b className="text-sky-200">원소나열법</b> — {"{ }"} 안에 모든 원소를 나열 (같은 원소는 중복해서 쓰지 않음)
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
            <b className="text-violet-200">조건제시법</b> — {"{ }"} 안에 원소들의 공통된 성질을 조건으로 제시
          </p>
        </div>
      </div>

      <ConvertOne
        key={v.id}
        v={v}
        last={vi === CONVS.length - 1}
        onDone={() => setDone((s) => (s.includes(v.id) ? s : [...s, v.id]))}
        onNext={() => setVi((i) => Math.min(CONVS.length - 1, i + 1))}
      />

      {done.length === CONVS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 바꿔 나타냈어요!</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-black/25 px-3 py-2 text-center">
              <p className="text-xs font-bold text-sky-200">원소나열법</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-300">
                원소를 구체적으로 확인하기 편리
                <br />
                <span className="text-slate-500">원소가 많으면 나타내기 불편</span>
              </p>
            </div>
            <div className="rounded-xl bg-black/25 px-3 py-2 text-center">
              <p className="text-xs font-bold text-violet-200">조건제시법</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-300">
                원소가 많은 집합을 나타내기 편리
                <br />
                <span className="text-slate-500">원소를 구체적으로 확인하기 불편</span>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ConvertOne({ v, last, onDone, onNext }: { v: Conv; last: boolean; onDone: () => void; onNext: () => void }) {
  return v.kind === "toCond" ? (
    <ToCondOne key={v.id} v={v} last={last} onDone={onDone} onNext={onNext} />
  ) : (
    <ToListOne key={v.id} v={v} last={last} onDone={onDone} onNext={onNext} />
  );
}

function NextBar({ last, onNext, hint }: { last: boolean; onNext: () => void; hint?: string }) {
  return (
    <>
      {hint ? <p className="rounded-xl bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {hint}</p> : null}
      {!last ? (
        <button
          type="button"
          onClick={onNext}
          className="w-full rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
        >
          다음 문제 ▶
        </button>
      ) : null}
    </>
  );
}

function ToCondOne({
  v,
  last,
  onDone,
  onNext,
}: {
  v: Extract<Conv, { kind: "toCond" }>;
  last: boolean;
  onDone: () => void;
  onNext: () => void;
}) {
  const [rk, setRk] = useState<string | null>(null);
  const [pk, setPk] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const rng = RANGES.find((x) => x.key === rk) ?? null;
  const prd = PREDS.find((x) => x.key === pk) ?? null;
  const made = rng && prd ? buildSet(rng, prd) : null;
  const ok = made !== null && sameSet(made, v.target);

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const missing = made ? v.target.filter((t) => !made.includes(t)) : [];
  const shown = made ? made.slice(0, 16) : [];
  const others = ok
    ? RANGES.flatMap((r2) => PREDS.map((p2) => ({ r2, p2 }))).filter(
        ({ r2, p2 }) => sameSet(buildSet(r2, p2), v.target) && !(r2.key === rng!.key && p2.key === prd!.key),
      )
    : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-sky-400/40 bg-sky-400/[0.07] p-4 text-center">
          <p className="text-[11px] font-bold text-sky-200">원소나열법으로 주어진 집합</p>
          <div className="mt-2 flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-slate-100">
            <Katex expr={listTex(v.target)} />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">↓ 이 집합을 조건제시법으로 바꾸세요</p>
        </div>

        <div className={"rounded-2xl border-2 px-4 py-4 text-center transition " + (ok ? "border-emerald-400/60 bg-emerald-400/15" : "border-violet-400/40 bg-violet-400/[0.08]")}>
          <CondBox tone="violet">
            <span className={"mx-0.5 rounded-md border px-1.5 py-0.5 " + (rng ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" : "border-dashed border-white/25 text-slate-500")}>
              {rng ? rng.label : "범위"}
            </span>{" "}
            <span className={"mx-0.5 rounded-md border px-1.5 py-0.5 " + (prd ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" : "border-dashed border-white/25 text-slate-500")}>
              {prd ? prd.label : "대상"}
            </span>
          </CondBox>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="text-[11px] font-bold text-slate-400">① 범위 고르기</p>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {RANGES.map((x) => (
              <PickBtn key={x.key} on={rk === x.key} onClick={() => setRk(x.key)} disabled={ok}>
                {x.label}
              </PickBtn>
            ))}
          </div>
          <p className="mt-3 text-[11px] font-bold text-slate-400">② 대상 고르기</p>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {PREDS.map((x) => (
              <PickBtn key={x.key} on={pk === x.key} onClick={() => setPk(x.key)} disabled={ok}>
                {x.label}
              </PickBtn>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className={"rounded-2xl border-2 p-4 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/12" : "border-white/10 bg-white/5")}>
          <p className="text-sm font-bold text-slate-100">🔎 내가 만든 조건이 나타내는 집합</p>
          {made === null ? (
            <p className="mt-3 rounded-xl border border-dashed border-white/15 px-3 py-6 text-center text-[11px] text-slate-500">범위와 대상을 모두 골라 보세요</p>
          ) : (
            <>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {shown.map((n) => (
                  <ElemChip key={n} label={String(n)} state={v.target.includes(n) ? "good" : "bad"} />
                ))}
                {made.length > shown.length ? <span className="self-center font-mono text-sm text-slate-400">… (모두 {made.length}개)</span> : null}
                {missing.map((n) => (
                  <ElemChip key={`m${n}`} label={String(n)} state="miss" />
                ))}
              </div>
              <p className={"mt-3 text-center text-[12px] font-bold " + (ok ? "text-emerald-200" : "text-slate-400")}>
                {ok ? "✅ 두 표현이 같은 집합을 나타내요!" : missing.length ? "노란 점선 원소가 빠졌어요" : "빨간 원소가 더 들어갔어요"}
              </p>
            </>
          )}
        </div>

        {ok ? (
          <>
            {others.length ? (
              <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3">
                <p className="text-[12px] font-bold text-amber-100">✨ 이렇게 나타내도 같은 집합이에요</p>
                <div className="mt-1.5 space-y-1">
                  {others.map(({ r2, p2 }) => (
                    <div key={`${r2.key}-${p2.key}`} className="rounded-lg bg-black/25 px-3 py-1.5 text-center">
                      <CondBox>
                        {r2.label} {p2.label}
                      </CondBox>
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] leading-5 text-amber-200/90">조건제시법은 표현이 하나로 정해지지 않아요. 원소가 같으면 같은 집합입니다.</p>
              </div>
            ) : null}
            <NextBar last={last} onNext={onNext} hint={v.hint} />
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowHint((s) => !s)}
            className="w-full rounded-xl border border-amber-400/45 bg-amber-400/10 px-3 py-2 text-[12px] font-bold text-amber-100 transition hover:bg-amber-400/20"
          >
            💡 힌트 {showHint ? "닫기" : "보기"}
          </button>
        )}
        {!ok && showHint ? <p className="rounded-lg bg-amber-400/12 px-3 py-2 text-[12px] leading-6 text-amber-100">{v.hint}</p> : null}
      </div>
    </div>
  );
}

function PickBtn({ on, onClick, disabled, children }: { on: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-lg border-2 px-1 py-1.5 text-[12px] font-bold whitespace-nowrap transition disabled:cursor-default " +
        (on ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

function ToListOne({
  v,
  last,
  onDone,
  onNext,
}: {
  v: Extract<Conv, { kind: "toList" }>;
  last: boolean;
  onDone: () => void;
  onNext: () => void;
}) {
  const [sel, setSel] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const ok = sameSet(sel, v.answer);

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
        <div className="rounded-2xl border-2 border-violet-400/40 bg-violet-400/[0.08] p-4 text-center">
          <p className="text-[11px] font-bold text-violet-200">조건제시법으로 주어진 집합</p>
          <div className="mt-2">
            <CondBox tone="violet">
              {v.condPre}
              {v.condTex ? <Katex expr={v.condTex} /> : null}
              {v.condPost ?? ""}
            </CondBox>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">↓ 이 집합을 원소나열법으로 바꾸세요</p>
        </div>
        <div className={"rounded-2xl border-2 p-4 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/12" : "border-sky-400/40 bg-sky-400/[0.07]")}>
          <p className="text-sm font-bold text-sky-100">🧲 원소인 수를 모두 골라 담으세요</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {v.pool.map((n) => (
              <ElemChip
                key={n}
                label={String(n)}
                state={!sel.includes(n) ? "idle" : v.answer.includes(n) ? "good" : "bad"}
                onClick={ok ? undefined : () => setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]))}
              />
            ))}
          </div>
          <p className={"mt-3 text-center text-[12px] font-bold " + (ok ? "text-emerald-200" : "text-slate-400")}>
            {ok ? "✅ 원소를 모두 찾았어요!" : `담은 원소 ${sel.filter((n) => v.answer.includes(n)).length} / ${v.answer.length}`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className={"rounded-2xl border-2 p-4 text-center transition " + (ok ? "border-emerald-400/55 bg-emerald-400/12" : "border-white/10 bg-white/5")}>
          <p className="text-[11px] font-bold text-slate-400">원소나열법</p>
          <div className="mt-2 flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-slate-100">
            {ok ? <Katex expr={listTex(v.answer)} /> : <span className="font-mono text-slate-500">{"{ ? , ? , … }"}</span>}
          </div>
        </div>
        {ok ? (
          <NextBar last={last} onNext={onNext} hint={v.hint} />
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowHint((s) => !s)}
              className="w-full rounded-xl border border-amber-400/45 bg-amber-400/10 px-3 py-2 text-[12px] font-bold text-amber-100 transition hover:bg-amber-400/20"
            >
              💡 힌트 {showHint ? "닫기" : "보기"}
            </button>
            {showHint ? <p className="rounded-lg bg-amber-400/12 px-3 py-2 text-[12px] leading-6 text-amber-100">{v.hint}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 집합 탐정
// ══════════════════════════════════════════════════════════════
function DetectiveTab() {
  const [mi, setMi] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const m = MYSTERIES[mi];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔍 숨은 집합의 정체를 밝혀라</p>
          <Chips ids={MYSTERIES.map((x) => x.id)} cur={mi} done={done} onPick={setMi} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          수를 눌러 <b className="text-emerald-200">∈</b> 인지 <b className="text-rose-200">∉</b> 인지 물어볼 수 있어요. 적게 물어보고 알아낼수록 별을 많이 받습니다.
        </p>
      </div>

      <DetectiveOne key={m.id} m={m} onDone={() => setDone((s) => (s.includes(m.id) ? s : [...s, m.id]))} />
    </div>
  );
}

function DetectiveOne({ m, onDone }: { m: Mystery; onDone: () => void }) {
  const [asked, setAsked] = useState<number[]>([]);
  const [pick, setPick] = useState<number | null>(null);
  const [wrongs, setWrongs] = useState(0);

  const solved = pick === m.ans;
  const base = asked.length <= m.par ? 3 : asked.length <= m.par + 4 ? 2 : 1;
  const stars = Math.max(1, base - (wrongs > 0 ? 1 : 0));

  const doneRef = useRef(false);
  useEffect(() => {
    if (solved && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function ask(n: number) {
    if (solved || asked.includes(n)) return;
    setAsked((s) => [...s, n]);
  }

  function choose(i: number) {
    if (solved) return;
    setPick(i);
    if (i !== m.ans) setWrongs((w) => w + 1);
  }

  const nums = Array.from({ length: DETECTIVE_MAX }, (_, i) => i + 1);
  const found = asked.filter((n) => m.f(n)).sort((a, b) => a - b);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={"rounded-2xl border-2 p-4 transition " + (solved ? "border-emerald-400/55 bg-emerald-400/[0.10]" : "border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04]")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">
            🔢 1 부터 {DETECTIVE_MAX} 까지 중에서 물어보기
          </p>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300">질문 {asked.length}번</span>
        </div>
        <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-8">
          {nums.map((n) => {
            const on = asked.includes(n);
            const yes = on && m.f(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => ask(n)}
                disabled={on || solved}
                className={
                  "flex h-12 flex-col items-center justify-center rounded-lg border-2 font-mono text-sm font-bold transition disabled:cursor-default " +
                  (!on
                    ? "border-white/12 bg-white/5 text-slate-200 hover:bg-white/12"
                    : yes
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : "border-white/10 bg-black/40 text-slate-600")
                }
              >
                <span>{n}</span>
                {on ? <span className="text-[10px] leading-3">{yes ? "∈" : "∉"}</span> : null}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            setAsked([]);
            setPick(null);
          }}
          disabled={solved}
          className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
        >
          ↺ 질문 지우기
        </button>
      </div>

      <div className="space-y-3">
        <div className={"rounded-2xl border-2 px-4 py-3 text-center transition " + (solved ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
          <p className="text-[11px] font-bold text-slate-400">지금까지 찾아낸 원소</p>
          <div className="mt-1.5 flex min-h-[2.25rem] flex-wrap justify-center gap-1.5">
            {found.length ? (
              found.map((n) => (
                <span key={n} className="rounded-lg border border-emerald-400/50 bg-emerald-400/15 px-2 py-0.5 font-mono text-sm font-bold text-emerald-100">
                  {n}
                </span>
              ))
            ) : (
              <span className="self-center text-[11px] text-slate-500">아직 없어요 — 수를 눌러 물어보세요</span>
            )}
          </div>
        </div>

        <div className={"rounded-2xl border-2 p-4 transition " + (solved ? "border-emerald-400/60 bg-emerald-400/15" : "border-violet-400/45 bg-violet-400/[0.09]")}>
          <p className="text-sm font-bold text-slate-100">🧠 숨은 집합을 조건제시법으로 나타내면?</p>
          <div className="mt-2 grid gap-1.5">
            {m.choices.map((c, i) => {
              const on = pick === i;
              const good = pick !== null && i === m.ans && solved;
              const bad = on && i !== m.ans;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => choose(i)}
                  disabled={solved}
                  className={
                    "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-[13px] font-bold whitespace-nowrap transition disabled:cursor-default " +
                    (good
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : bad
                        ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/30 font-mono text-[11px]">{"①②③④"[i]}</span>
                  <CondBox>{c.replace(/^x는 /, "")}</CondBox>
                </button>
              );
            })}
          </div>
          {pick !== null && !solved ? <p className="mt-2 text-[11px] font-bold text-rose-200">아니에요 — 몇 개 더 물어보고 다시 골라 보세요!</p> : null}
        </div>

        {solved ? (
          <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
            <p className="text-center text-base font-extrabold text-emerald-100">{"⭐".repeat(stars)} 정체를 밝혔어요!</p>
            <p className="mt-0.5 text-center text-[11px] text-emerald-200">
              질문 {asked.length}번 사용 · {m.par}번 이하면 별 셋
            </p>
            <div className="mt-2 flex justify-center overflow-x-auto overflow-y-hidden rounded-lg bg-black/30 px-3 py-2 text-slate-100">
              <Katex expr={listTex(mysterySet(m))} />
            </div>
            <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-200">💡 {m.tip}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
