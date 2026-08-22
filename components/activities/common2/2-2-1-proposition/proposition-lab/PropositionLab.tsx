"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  BADGE,
  CARDS,
  CARD_ORDER,
  LINES,
  MATCHES,
  MATCH_UNIV,
  NL,
  NOT_WHY,
  SET_ORDER,
  TRUTHS,
  hasHangul,
  listTex,
  nlX,
  sameSet,
  shuffled,
  traitsOf,
  type LineTask,
  type PropCard,
  type TruthTask,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "what_is_prop",
    prompt:
      "탭①에서 명제가 아니라고 가려낸 문장들에는 어떤 것들이 있었나요? 명제가 되기 위한 조건을 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: '축구는 재미있다'처럼 사람마다 다르게 느끼는 말, '물을 아껴 쓰자'처럼 권하는 말, 'x + 3 = 8'처럼 변수가 들어 있어 값에 따라 달라지는 식은 명제가 아니었다. 명제가 되려면 그 문장만 보고 참인지 거짓인지를 분명하게 가릴 수 있어야 한다.",
  },
  {
    id: "condition_and_truth_set",
    prompt:
      "조건과 진리집합이 무엇인지 설명하고, 같은 조건이라도 전체집합이 달라지면 진리집합이 어떻게 되는지 예를 들어 써 보세요.",
    kind: "text",
    placeholder:
      "예: 조건은 x 같은 변수를 포함해서 값에 따라 참·거짓이 달라지는 문장이나 식이고, 진리집합은 그 조건을 참이 되게 하는 원소를 모두 모은 집합이다. 예를 들어 '2x + 1 ≤ 9'는 x ≤ 4 인데, 전체집합이 자연수면 진리집합이 {1, 2, 3, 4}이지만 실수 전체이면 4 이하의 모든 실수가 되어 수직선의 반직선이 된다.",
  },
  {
    id: "everyday_condition",
    prompt:
      "탭②에서는 수가 아닌 일상 사례로도 진리집합을 구했어요. 우리 반이나 우리 학교에서 조건을 하나 만들고, 그 진리집합이 무엇이 될지 말해 보세요.",
    kind: "text",
    placeholder:
      "예: 전체집합을 우리 반 학생 전체로 두고 조건 p를 'x는 3학년 때 같은 반이었던 학생이다'로 하면, 진리집합 P는 그 조건을 만족하는 학생들을 모은 집합이 된다. 조건이 수에 관한 것이 아니어도 참이 되게 하는 대상을 모으면 그것이 진리집합이다.",
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

/** 원소나열법 — 한글 원소가 섞이면 HTML 로 그린다 */
function Listing({ items }: { items: string[] }) {
  if (!items.length) return <Katex expr="\varnothing" />;
  if (!hasHangul(items)) return <Katex expr={listTex(items)} />;
  return (
    <span className="font-semibold">
      <span className="text-slate-400">{"{ "}</span>
      {items.join(", ")}
      <span className="text-slate-400">{" }"}</span>
    </span>
  );
}

/** 조건 { x | ~ } 꼴 — KaTeX 안에 한글을 넣을 수 없어 HTML 로 조립 */
function CondLine({ name, pre, tex, post }: { name?: string; pre?: string; tex?: string; post?: string }) {
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-base font-semibold text-slate-100">
      {name ? (
        <>
          <i className="font-serif italic text-amber-200">{name}</i>
          <span className="text-slate-400">:</span>
        </>
      ) : null}
      {pre}
      {tex ? <Katex expr={tex} /> : null}
      {post ?? ""}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
type Tab = "prop" | "truth" | "line" | "match";

export default function PropositionLab() {
  const [tab, setTab] = useState<Tab>("prop");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔎 명제와 조건</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-amber-200">참·거짓을 분명하게 가릴 수 있는</b> 문장이 명제, <b className="text-sky-200">변수 때문에 값에 따라 달라지는</b> 문장이 조건이에요. 조건을
          참이 되게 하는 원소를 모으면 <b className="text-emerald-200">진리집합</b>이 됩니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "prop"} onClick={() => setTab("prop")}>
          ① 명제일까? 🔎
        </TabButton>
        <TabButton active={tab === "truth"} onClick={() => setTab("truth")}>
          ② 진리집합 만들기 🎒
        </TabButton>
        <TabButton active={tab === "line"} onClick={() => setTab("line")}>
          ③ 수직선 진리집합 📏
        </TabButton>
        <TabButton active={tab === "match"} onClick={() => setTab("match")}>
          ④ 조건 ↔ 진리집합 🧲
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "prop" ? <PropTab /> : null}
        {tab === "truth" ? <TruthTab /> : null}
        {tab === "line" ? <LineTab /> : null}
        {tab === "match" ? <MatchTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 명제일까?
// ══════════════════════════════════════════════════════════════
function PropTab() {
  const [order, setOrder] = useState<number[]>(() => [...CARD_ORDER]);
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const deck = order.map((k) => CARDS[k]);
  const c = deck[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔎 이 문장은 명제일까요?</p>
          <div className="flex flex-wrap items-center gap-2">
            <Chips ids={deck.map((x) => x.id)} cur={i} done={done} onPick={setI} />
            <button
              type="button"
              onClick={() => {
                setOrder((o) => shuffled(o));
                setI(0);
              }}
              className="h-8 rounded-lg border-2 border-amber-400/50 bg-amber-400/12 px-2.5 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/22"
            >
              🔀 섞기
            </button>
          </div>
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
          <b className="text-amber-200">명제</b> — 참 또는 거짓을 <b className="text-white">분명하게 판별할 수 있는</b> 문장이나 식
        </p>
      </div>

      <PropOne
        key={c.id}
        c={c}
        last={i === deck.length - 1}
        onDone={() => setDone((s) => (s.includes(c.id) ? s : [...s, c.id]))}
        onNext={() => setI((k) => Math.min(deck.length - 1, k + 1))}
      />

      {done.length === CARDS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 열두 문장을 모두 가려냈어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
            {(Object.keys(NOT_WHY) as (keyof typeof NOT_WHY)[]).map((k) => (
              <p key={k} className="rounded-xl bg-black/25 px-3 py-2 text-center text-[11px] leading-5 text-slate-300">
                <b className="text-rose-200">{NOT_WHY[k].tag}</b>
              </p>
            ))}
          </div>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            ※ 「참·거짓을 <b className="text-white">판별할 수 있다</b>」와 「참·거짓을 <b className="text-white">바로 알 수 있다</b>」는 다른 말이에요. 지금 당장 계산하기
            어려워도 원리상 가릴 수 있으면 명제랍니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function PropOne({ c, last, onDone, onNext }: { c: PropCard; last: boolean; onDone: () => void; onNext: () => void }) {
  const [isProp, setIsProp] = useState<boolean | null>(null);
  const [truth, setTruth] = useState<boolean | null>(null);

  const step1 = isProp !== null && isProp === c.isProp;
  const wrong1 = isProp !== null && isProp !== c.isProp;
  const step2 = !c.isProp || (truth !== null && truth === c.truth);
  const wrong2 = c.isProp && truth !== null && truth !== c.truth;
  const ok = step1 && step2;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div
        className={
          "flex flex-col justify-center rounded-2xl border-2 p-5 transition " +
          (ok ? "border-emerald-400/55 bg-emerald-400/[0.10]" : wrong1 || wrong2 ? "border-rose-400/55 bg-rose-400/[0.08]" : "border-amber-400/35 bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.04]")
        }
      >
        <p className="text-center text-[11px] font-bold tracking-widest text-amber-200/80">SENTENCE</p>
        <div className="mt-3 rounded-xl border border-white/12 bg-black/30 px-4 py-8 text-center">
          <p className="text-lg font-bold leading-8 text-slate-100">
            {c.pre}
            {c.tex ? <Katex expr={c.tex} /> : null}
            {c.post ?? ""}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[true, false].map((v) => {
            const on = isProp === v;
            const good = isProp !== null && v === c.isProp;
            const bad = on && v !== c.isProp;
            return (
              <button
                key={String(v)}
                type="button"
                onClick={() => setIsProp(v)}
                disabled={step1}
                className={
                  "rounded-xl border-2 px-3 py-3 text-sm font-bold transition disabled:cursor-default " +
                  (good ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : bad ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                {v ? "⭕ 명제이다" : "❌ 명제가 아니다"}
              </button>
            );
          })}
        </div>
        {wrong1 ? <p className="mt-2 text-center text-[11px] font-bold text-rose-200">다시 생각해 보세요 — 참·거짓을 분명하게 가릴 수 있나요?</p> : null}
      </div>

      <div className="space-y-3">
        {!step1 ? (
          <div className="flex h-full min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 py-8 text-center">
            <p className="text-[12px] leading-6 text-slate-500">
              먼저 명제인지 판정해 주세요.
              <br />
              명제라면 <b className="text-slate-300">참·거짓을 가리는</b> 단계가 열려요.
            </p>
          </div>
        ) : c.isProp ? (
          <div className={"rounded-2xl border-2 p-4 transition " + (step2 ? "border-emerald-400/55 bg-emerald-400/12" : "border-sky-400/40 bg-sky-400/[0.07]")}>
            <p className="text-sm font-bold text-sky-100">⚖️ 그러면 참일까요, 거짓일까요?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[true, false].map((v) => {
                const on = truth === v;
                const good = truth !== null && v === c.truth;
                const bad = on && v !== c.truth;
                return (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setTruth(v)}
                    disabled={step2}
                    className={
                      "rounded-xl border-2 px-3 py-3 text-base font-bold transition disabled:cursor-default " +
                      (good ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : bad ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    {v ? "참 ⭕" : "거짓 ❌"}
                  </button>
                );
              })}
            </div>
            {wrong2 ? <p className="mt-2 text-center text-[11px] font-bold text-rose-200">다시 생각해 보세요!</p> : null}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-rose-400/45 bg-rose-400/[0.09] p-4">
            <p className="text-sm font-bold text-rose-100">🚫 명제가 아니에요</p>
            <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-1.5 text-[12px] font-bold text-rose-200">{NOT_WHY[c.notWhy as keyof typeof NOT_WHY].tag}</p>
            <p className="mt-1.5 text-[12px] leading-6 text-slate-200">{NOT_WHY[c.notWhy as keyof typeof NOT_WHY].note}</p>
          </div>
        )}

        {ok ? (
          <>
            <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {c.why}</p>
            {!last ? <NextBtn onClick={onNext} label="다음 문장 ▶" /> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 진리집합 만들기
// ══════════════════════════════════════════════════════════════
function TruthTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = TRUTHS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎒 조건을 참이 되게 하는 원소를 모두 담으세요</p>
          <Chips ids={TRUTHS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[11px] leading-5 text-slate-300">
            <b className="text-sky-200">조건</b> — 참·거짓을 결정하는 <b className="text-white">변수</b>를 포함하는 문장이나 식
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[11px] leading-5 text-slate-300">
            <b className="text-emerald-200">진리집합</b> — 조건을 <b className="text-white">참이 되게 하는</b> 모든 원소의 집합
          </p>
        </div>
      </div>

      <TruthOne
        key={t.id}
        t={t}
        last={i === TRUTHS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(TRUTHS.length - 1, k + 1))}
      />

      {done.length === TRUTHS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 여섯 조건의 진리집합을 모두 구했어요!</p>
          <p className="mt-1.5 text-[12px] leading-7 text-slate-300">
            조건은 <Katex expr="p, \; q, \; r" /> 로, 그 진리집합은 <Katex expr="P, \; Q, \; R" /> 로 나타내요. 수에 관한 조건이 아니어도 진리집합을 똑같이 구할 수 있답니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function TruthOne({ t, last, onDone, onNext }: { t: TruthTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [sel, setSel] = useState<string[]>([]);
  const ok = sameSet(sel, t.answer);

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
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[15px] font-semibold text-slate-100">
          <i className="font-serif italic">U</i>
          <span>=</span>
          <span className="text-slate-400">{"{"}</span>
          <i className="font-serif italic">x</i>
          <span className="text-slate-400">|</span>
          <span>
            <i className="font-serif italic">x</i>는 {t.univLabel}
          </span>
          <span className="text-slate-400">{"}"}</span>
        </div>
        <div className="mt-2 flex justify-center">
          <CondLine name={t.name} pre={t.condPre} tex={t.condTex} post={t.condPost} />
        </div>
      </div>

      {t.kind === "person" ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
          <p className="text-center text-[11px] text-slate-400">
            배지 뜻 —{" "}
            {Object.values(BADGE).map((b, k) => (
              <span key={b} className="ml-1.5 font-bold text-slate-200">
                {k > 0 ? "· " : ""}
                {b}
              </span>
            ))}
          </p>
        </div>
      ) : null}

      <div className={"rounded-2xl border-2 p-4 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/12" : "border-sky-400/40 bg-sky-400/[0.07]")}>
        <p className="text-[11px] font-bold text-slate-400">👆 조건을 참이 되게 하는 원소를 눌러 담으세요</p>
        <div className={"mt-2 flex flex-wrap justify-center gap-2 " + (t.kind === "person" ? "" : "")}>
          {t.items.map((x) => {
            const on = sel.includes(x);
            const good = on && t.answer.includes(x);
            const bad = on && !t.answer.includes(x);
            const cls = good
              ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
              : bad
                ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10";
            return t.kind === "person" ? (
              <button
                key={x}
                type="button"
                onClick={() => setSel((s) => (s.includes(x) ? s.filter((y) => y !== x) : [...s, x]))}
                disabled={ok}
                className={"w-[104px] rounded-2xl border-2 px-2 py-2.5 text-center transition disabled:cursor-default " + cls}
              >
                <p className="text-base font-bold">{x}</p>
                <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                  {traitsOf(x).map((tr) => (
                    <span key={tr} className="rounded bg-black/35 px-1 py-0.5 text-[10px] leading-4">
                      {BADGE[tr].split(" ")[0]}
                    </span>
                  ))}
                </div>
              </button>
            ) : (
              <button
                key={x}
                type="button"
                onClick={() => setSel((s) => (s.includes(x) ? s.filter((y) => y !== x) : [...s, x]))}
                disabled={ok}
                className={"h-11 min-w-[3rem] rounded-xl border-2 px-3 font-mono text-lg font-bold transition disabled:cursor-default " + cls}
              >
                {x}
              </button>
            );
          })}
        </div>
        <p className={"mt-3 text-center text-[12px] font-bold " + (ok ? "text-emerald-200" : "text-slate-400")}>
          {ok ? "✅ 진리집합을 모두 찾았어요!" : `담은 원소 ${sel.filter((x) => t.answer.includes(x)).length} / ${t.answer.length}`}
        </p>
      </div>

      {ok ? (
        <>
          <div className="rounded-2xl border-2 border-emerald-400/55 bg-emerald-400/12 px-4 py-3 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2 text-lg text-emerald-100">
              <i className="font-serif italic">{t.name.toUpperCase()}</i>
              <span>=</span>
              <Listing items={t.answer} />
            </div>
          </div>
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {t.tip}</p>
          {!last ? <NextBtn onClick={onNext} /> : null}
        </>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 수직선 진리집합
// ══════════════════════════════════════════════════════════════
function NumberLine({
  t,
  sel,
  onPick,
  showReal,
}: {
  t: LineTask;
  sel: number[];
  onPick?: (v: number) => void;
  showReal: boolean;
}) {
  const okSet = t.answer;
  const loX = t.real.lo === null ? NL.x0 : nlX(t, t.real.lo);
  const hiX = t.real.hi === null ? NL.x1 : nlX(t, t.real.hi);
  return (
    <svg viewBox={`0 0 ${NL.w} ${NL.h}`} className="mx-auto block w-full select-none" role="img" aria-label="수직선">
      {showReal ? (
        <g>
          <line x1={loX} y1={NL.barY} x2={hiX} y2={NL.barY} stroke="#fbbf24" strokeWidth={8} strokeLinecap="butt" />
          {t.real.lo === null ? (
            <path d={`M${NL.x0},${NL.barY} l14,-8 v16 z`} fill="#fbbf24" />
          ) : (
            <circle cx={loX} cy={NL.barY} r={7} fill={t.real.loClosed ? "#fbbf24" : "#0f172a"} stroke="#fbbf24" strokeWidth={3} />
          )}
          {t.real.hi === null ? (
            <path d={`M${NL.x1},${NL.barY} l-14,-8 v16 z`} fill="#fbbf24" />
          ) : (
            <circle cx={hiX} cy={NL.barY} r={7} fill={t.real.hiClosed ? "#fbbf24" : "#0f172a"} stroke="#fbbf24" strokeWidth={3} />
          )}
          <text x={(loX + hiX) / 2} y={NL.barY - 16} textAnchor="middle" className="fill-amber-200 text-[12px] font-bold">
            전체집합이 실수 전체일 때
          </text>
        </g>
      ) : null}

      <line x1={NL.x0 - 20} y1={NL.axisY} x2={NL.x1 + 20} y2={NL.axisY} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
      <path d={`M${NL.x1 + 20},${NL.axisY} l-10,-5 v10 z`} fill="rgba(255,255,255,0.5)" />
      <path d={`M${NL.x0 - 20},${NL.axisY} l10,-5 v10 z`} fill="rgba(255,255,255,0.5)" />

      {Array.from({ length: t.to - t.from + 1 }, (_, k) => t.from + k).map((v) => {
        const x = nlX(t, v);
        const isPoint = t.points.includes(v);
        const on = sel.includes(v);
        const good = on && okSet.includes(v);
        const bad = on && !okSet.includes(v);
        return (
          <g key={v}>
            <line x1={x} y1={NL.axisY - 6} x2={x} y2={NL.axisY + 6} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
            <text x={x} y={NL.axisY + 26} textAnchor="middle" className="fill-slate-400 font-mono text-[11px]">
              {v}
            </text>
            {isPoint ? (
              <g className={onPick ? "cursor-pointer" : undefined} onClick={onPick ? () => onPick(v) : undefined}>
                <circle cx={x} cy={NL.axisY} r={14} fill="transparent" />
                <circle
                  cx={x}
                  cy={NL.axisY}
                  r={9}
                  fill={good ? "#34d399" : bad ? "#fb7185" : "rgba(255,255,255,0.10)"}
                  stroke={good ? "#34d399" : bad ? "#fb7185" : "rgba(255,255,255,0.6)"}
                  strokeWidth={2.5}
                />
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function LineTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = LINES[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">📏 수직선 위에서 진리집합을 만드세요</p>
          <Chips ids={LINES.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          전체집합의 원소가 <b className="text-white">동그라미</b>로 찍혀 있어요. 조건을 참이 되게 하는 것을 눌러 담으면 초록, 아니면 빨강으로 바뀝니다.
        </p>
      </div>

      <LineOne
        key={t.id}
        t={t}
        last={i === LINES.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(LINES.length - 1, k + 1))}
      />

      {done.length === LINES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 네 조건의 진리집합을 모두 만들었어요!</p>
          <p className="mt-1.5 text-[12px] leading-7 text-slate-300">
            수에 관한 조건에서 <b className="text-amber-200">전체집합이 주어지지 않으면 실수 전체</b>를 전체집합으로 봐요. 그때 진리집합은 수직선 위의 <b className="text-white">구간</b>이
            됩니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function LineOne({ t, last, onDone, onNext }: { t: LineTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [sel, setSel] = useState<number[]>([]);
  const [showReal, setShowReal] = useState(false);
  const [showSolved, setShowSolved] = useState(false);
  const ok = sel.length === t.answer.length && sel.every((x) => t.answer.includes(x));

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
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[15px] font-semibold text-slate-100">
          <i className="font-serif italic">U</i>
          <span>=</span>
          <span className="text-slate-400">{"{"}</span>
          <i className="font-serif italic">x</i>
          <span className="text-slate-400">|</span>
          <span>
            <i className="font-serif italic">x</i>는 {t.univLabel}
          </span>
          <span className="text-slate-400">{"}"}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-lg">
          <i className="font-serif italic text-amber-200">{t.name}</i>
          <span className="text-slate-400">:</span>
          <span className="text-slate-100">
            <Katex expr={t.condTex} />
          </span>
          {showSolved || ok ? (
            <>
              <span className="text-slate-500">⇒</span>
              <span className="text-emerald-200">
                <Katex expr={t.solvedTex} />
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className={"overflow-hidden rounded-2xl border-2 bg-slate-950/70 p-2 transition " + (ok ? "border-emerald-400/55" : "border-white/10")}>
        <NumberLine t={t} sel={sel} onPick={ok ? undefined : (v) => setSel((s) => (s.includes(v) ? s.filter((y) => y !== v) : [...s, v]))} showReal={showReal && ok} />
        <p className={"mt-1 text-center text-[12px] font-bold " + (ok ? "text-emerald-200" : "text-slate-400")}>
          {ok ? "✅ 진리집합을 모두 찾았어요!" : `담은 원소 ${sel.filter((x) => t.answer.includes(x)).length} / ${t.answer.length}`}
        </p>
      </div>

      {!ok ? (
        <button
          type="button"
          onClick={() => setShowSolved((v) => !v)}
          className="w-full rounded-xl border border-amber-400/45 bg-amber-400/10 px-3 py-2 text-[12px] font-bold text-amber-100 transition hover:bg-amber-400/20"
        >
          💡 부등식을 풀어 {showSolved ? "숨기기" : "보기"}
        </button>
      ) : (
        <>
          <div className="rounded-2xl border-2 border-emerald-400/55 bg-emerald-400/12 px-4 py-3 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2 text-lg text-emerald-100">
              <i className="font-serif italic">{t.name.toUpperCase()}</i>
              <span>=</span>
              <Katex expr={listTex(t.answer)} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowReal((v) => !v)}
            className="w-full rounded-xl border-2 border-amber-400/50 bg-amber-400/12 px-3 py-2.5 text-[12px] font-bold text-amber-100 transition hover:bg-amber-400/22"
          >
            🌊 전체집합이 <b>실수 전체</b>라면? {showReal ? "숨기기" : "보기"}
          </button>
          {showReal ? (
            <p className="rounded-lg bg-amber-400/12 px-3 py-2 text-center text-[12px] leading-6 text-amber-100">
              진리집합이 점이 아니라 <b className="text-white">이어진 구간</b>이 돼요. 속이 찬 동그라미는 그 수가 들어간다는 뜻, 빈 동그라미는 들어가지 않는다는 뜻이에요.
            </p>
          ) : null}
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {t.tip}</p>
          {!last ? <NextBtn onClick={onNext} /> : null}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 조건 ↔ 진리집합 짝짓기
// ══════════════════════════════════════════════════════════════
function MatchTab() {
  const [condPick, setCondPick] = useState<string | null>(null);
  const [setPick, setSetPick] = useState<string | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [miss, setMiss] = useState(0);

  const cleared = found.length === MATCHES.length;
  const wrong = condPick !== null && setPick !== null && condPick !== setPick;

  function pick(kind: "cond" | "set", id: string) {
    if (found.includes(id) || cleared) return;
    const mine = kind === "cond" ? condPick : setPick;
    const other = kind === "cond" ? setPick : condPick;
    const setMine = kind === "cond" ? setCondPick : setSetPick;
    if (other === null) {
      // 아직 반대쪽을 고르지 않았으면 이쪽만 골라 둔다
      setMine(id === mine ? null : id);
      return;
    }
    if (other === id) {
      setFound((s) => [...s, id]);
      setCondPick(null);
      setSetPick(null);
      return;
    }
    setMine(id);
    setMiss((m) => m + 1);
  }

  function cls(id: string, picked: string | null) {
    if (found.includes(id)) return "border-emerald-400/50 bg-emerald-400/12 text-emerald-100 opacity-70";
    if (picked === id) return wrong ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : "border-cyan-400/70 bg-cyan-400/20 text-cyan-100";
    return "border-white/12 bg-white/5 text-slate-200 hover:bg-white/10";
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧲 조건과 진리집합을 짝지으세요</p>
          <span className={"rounded-full px-3 py-1 text-[12px] font-bold " + (cleared ? "bg-emerald-400/25 text-emerald-100" : "bg-white/8 text-slate-300")}>
            {cleared ? "🎉 모두 짝지었어요!" : `짝지은 것 ${found.length} / ${MATCHES.length}`}
            {miss > 0 ? <span className="ml-2 font-normal text-rose-300">헛짚음 {miss}</span> : null}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg bg-black/25 px-3 py-2 text-[13px] font-semibold text-slate-200">
          <i className="font-serif italic">U</i>
          <span>=</span>
          <span className="text-slate-400">{"{"}</span>
          <i className="font-serif italic">x</i>
          <span className="text-slate-400">|</span>
          <span>
            <i className="font-serif italic">x</i>는 12 이하의 자연수
          </span>
          <span className="text-slate-400">{"}"}</span>
          <span className="ml-1 text-slate-500">=</span>
          <Katex expr={listTex(MATCH_UNIV)} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-center text-[11px] font-bold text-amber-200">조건</p>
          <div className="space-y-1.5">
            {MATCHES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => pick("cond", m.id)}
                disabled={found.includes(m.id) || cleared}
                className={"flex w-full items-center justify-center overflow-x-auto overflow-y-hidden rounded-xl border-2 px-2 py-2.5 transition disabled:cursor-default " + cls(m.id, condPick)}
              >
                <CondLine name={m.name} pre={m.condPre} tex={m.condTex} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-center text-[11px] font-bold text-emerald-200">진리집합</p>
          <div className="space-y-1.5">
            {SET_ORDER.map((k) => {
              const m = MATCHES[k];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => pick("set", m.id)}
                  disabled={found.includes(m.id) || cleared}
                  className={"flex w-full items-center justify-center overflow-x-auto overflow-y-hidden rounded-xl border-2 px-2 py-2.5 text-lg transition disabled:cursor-default " + cls(m.id, setPick)}
                >
                  <Katex expr={listTex(m.set)} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {cleared ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 다섯 짝을 모두 찾았어요!</p>
          <div className="mt-2 space-y-1">
            {MATCHES.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-center gap-2 rounded-lg bg-black/25 px-3 py-1.5 text-[13px]">
                <CondLine name={m.name} pre={m.condPre} tex={m.condTex} />
                <span className="text-slate-500">→</span>
                <span className="text-emerald-100">
                  <i className="font-serif italic">{m.name.toUpperCase()}</i> = <Katex expr={listTex(m.set)} />
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[12px] leading-6 text-slate-300">
            조건은 소문자 <Katex expr="p, \; q, \; r" />, 그 진리집합은 대문자 <Katex expr="P, \; Q, \; R" /> 로 나타내요.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setCondPick(null);
            setSetPick(null);
          }}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          ↺ 고른 카드 지우기
        </button>
      )}
    </div>
  );
}
