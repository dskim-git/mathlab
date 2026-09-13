"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  ABSURDS,
  CLUES,
  CONTRAS,
  DOUGH_META,
  EMPTY_ASSIGN,
  JUDGES,
  PEOPLE,
  POSITIONS,
  PUZZLE_HINTS,
  PUZZLE_QS,
  TRAITS,
  WAY_META,
  contraAll,
  doughOf,
  posOf,
  shapeOf,
  solveSongpyeon,
  tooMany,
  type AbsurdTask,
  type Assign,
  type ContraTask,
  type Piece,
  type TraitAnswer,
  type Way,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "when_contra",
    prompt:
      "대우법으로 증명할 때 가장 먼저 하는 일과, 그 방법이 통하는 까닭을 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 먼저 명제의 대우를 정확히 만든다. 가정과 결론의 자리를 바꾸고 둘 다 부정해야 하며, 부등호는 등호까지 챙기고 「또는」은 「그리고」로 바뀐다. 그 다음 ~q 에서 출발해 ~p 를 이끌어낸다. 명제와 대우는 참·거짓이 늘 같으므로 대우가 참이면 원래 명제도 참이다.",
  },
  {
    id: "clash",
    prompt:
      "귀류법에서 「모순」은 무엇과 부딪히며 드러났나요? 탭②에서 본 예를 두 가지 이상 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: √2 증명에서는 처음에 붙여 둔 「p 와 q 는 서로소」라는 조건과 부딪혔다. n² 이 짝수이면 n 도 짝수라는 증명에서는 원래 명제의 가정인 「n² 이 짝수」와 부딪혔다. 1+√2 증명에서는 이미 참으로 알고 있던 「√2 는 무리수」와 부딪혔다. 즉 모순은 가정·이미 아는 사실·처음 설정 가운데 하나와 충돌하며 드러난다.",
  },
  {
    id: "difference",
    prompt:
      "대우법과 귀류법의 공통점과 차이점을 탭③에서 본 두 갈래 길 그림을 떠올리며 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 둘 다 결론의 부정 ~q 에서 출발한다는 점이 같다. 그러나 대우법은 ~q 만 가지고 출발해 ~p 에 닿는 것이 목적이고 원래 가정 p 는 쓰지 않는다. 귀류법은 가정 p 와 ~q 를 함께 놓고 따라가다 모순에 닿는 것이 목적이다. 도착점이 ~p 인지 모순인지가 두 방법을 가르는 기준이다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "contra" | "absurd" | "compare" | "puzzle";

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

const ABC = ["①", "②", "③", "④"];

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function IndirectProofLab() {
  const [tab, setTab] = useState<Tab>("contra");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔄 대우법과 귀류법</h3>
        <p className="mt-2 leading-7 text-slate-300">
          둘 다 <b className="text-white">결론을 부정</b> 하며 출발해요. 하지만 하나는 <b className="text-violet-200">~p 에 닿는 것</b> 이, 다른 하나는{" "}
          <b className="text-rose-200">모순에 닿는 것</b> 이 목적입니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "contra"} onClick={() => setTab("contra")}>
          ① 대우 다리 건너기 ↩️
        </TabButton>
        <TabButton active={tab === "absurd"} onClick={() => setTab("absurd")}>
          ② 모순 감지기 💥
        </TabButton>
        <TabButton active={tab === "compare"} onClick={() => setTab("compare")}>
          ③ 두 갈래 길 🛤️
        </TabButton>
        <TabButton active={tab === "puzzle"} onClick={() => setTab("puzzle")}>
          ④ 송편 논리 퍼즐 🥟
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "contra" ? <ContraTab /> : null}
        {tab === "absurd" ? <AbsurdTab /> : null}
        {tab === "compare" ? <CompareTab /> : null}
        {tab === "puzzle" ? <PuzzleTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 대우 다리 건너기
// ══════════════════════════════════════════════════════════════
function ContraTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = CONTRAS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">↩️ 대우를 만들고 징검다리를 건너세요</p>
          <Chips ids={CONTRAS.map((c) => c.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
          <Katex expr="\sim q \to \sim p" /> 가 참이면 그 대우인 <Katex expr="p \to q" /> 도 참 <span className="mx-1 text-slate-500">—</span> 그래서{" "}
          <b className="text-violet-200">결론의 부정에서 출발해 가정의 부정에 닿으면</b> 증명이 끝나요.
        </p>
      </div>

      <ContraOne
        key={t.id}
        t={t}
        last={i === CONTRAS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(CONTRAS.length - 1, k + 1))}
      />

      {done.length === CONTRAS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 다섯 개의 다리를 모두 건넜어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <p className="rounded-xl bg-black/25 px-3 py-2.5 text-[12px] leading-7 text-slate-300">
              <b className="text-violet-200">대우를 만들 때</b>
              <br />· 가정과 결론의 자리를 바꾸고
              <br />· <b className="text-white">둘 다</b> 부정한다
            </p>
            <p className="rounded-xl bg-black/25 px-3 py-2.5 text-[12px] leading-7 text-slate-300">
              <b className="text-amber-200">부정할 때 조심</b>
              <br />· <Katex expr=">" /> 의 부정은 <Katex expr="\le" /> (등호까지)
              <br />· 「또는」의 부정은 「그리고」
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ContraOne({ t, last, onDone, onNext }: { t: ContraTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tip, setTip] = useState(false);

  const step1 = pick !== null && pick === t.answer;
  const all = contraAll(t);
  const deck = t.scatter.map((k) => all[k]);
  const step2 = step1 && built.length === t.stones.length;

  const doneRef = useRef(false);
  useEffect(() => {
    if (step2 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function tap(idx: number) {
    if (step2 || built.includes(idx)) return;
    const item = all[idx];
    if (item.fakeWhy) {
      setMsg({ ok: false, text: `이 돌은 밟으면 안 돼요. ${item.fakeWhy}` });
      return;
    }
    if (idx !== built.length) {
      setMsg({ ok: false, text: `아직 이 돌의 차례가 아니에요. ${built.length + 1}번째로 밟을 돌을 찾아보세요.` });
      return;
    }
    setBuilt((s) => [...s, idx]);
    setMsg(null);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-1.5 text-center text-[11px] font-bold text-slate-400">조건이 놓인 범위 · {t.scope}</div>

      <div className="rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.08] to-sky-500/[0.03] px-4 py-3 text-center">
        <p className="text-[11px] font-bold tracking-widest text-cyan-200/80">증명할 명제</p>
        <p className="mt-1 text-lg font-bold leading-8 text-slate-100">
          <PieceLine ps={t.claim} />
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-bold">
          <span className="rounded-lg bg-black/30 px-2 py-1 text-sky-200">
            <i className="font-serif italic">p</i> : <PieceLine ps={t.p} />
          </span>
          <span className="rounded-lg bg-black/30 px-2 py-1 text-amber-200">
            <i className="font-serif italic">q</i> : <PieceLine ps={t.q} />
          </span>
        </div>
      </div>

      {/* 1단계 — 대우 고르기 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (step1 ? "border-emerald-400/45 bg-emerald-400/[0.08]" : "border-white/10 bg-slate-900/40")}>
        <p className="text-[12px] font-bold text-slate-200">
          1단계 · 이 명제의 <b className="text-violet-200">대우</b> 를 고르세요.
        </p>
        <div className="mt-2 space-y-1.5">
          {t.choices.map((c, k) => {
            const on = pick === k;
            const good = step1 && k === t.answer;
            const bad = on && k !== t.answer;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setPick(k)}
                disabled={step1}
                className={
                  "flex w-full items-baseline gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-[14px] font-semibold leading-7 transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                <span className="shrink-0 font-mono text-[13px] text-slate-400">{ABC[k]}</span>
                <PieceLine ps={c} />
              </button>
            );
          })}
        </div>
        {pick !== null && !step1 ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {t.choiceWhy[pick]}</p> : null}
      </div>

      {/* 2단계 — 다리 건너기 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (step1 ? (step2 ? "border-emerald-400/55 bg-emerald-400/10" : "border-white/10 bg-slate-900/40") : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
        <p className="text-[12px] font-bold text-slate-200">
          2단계 · <b className="text-violet-200">~q 섬</b> 에서 출발해 <b className="text-violet-200">~p 섬</b> 까지 돌을 차례대로 밟으세요.
        </p>

        {/* 두 섬 */}
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-xl border-2 border-amber-400/45 bg-amber-400/[0.10] px-3 py-2 text-center">
            <p className="text-[11px] font-bold text-amber-200">
              출발 · <Katex expr="\sim q" />
            </p>
            <p className="mt-0.5 text-[13px] font-bold leading-7 text-slate-100">
              <PieceLine ps={t.negQ} />
            </p>
          </div>
          <div className="flex items-center justify-center text-xl text-slate-500">···</div>
          <div className={"rounded-xl border-2 px-3 py-2 text-center " + (step2 ? "border-emerald-400/60 bg-emerald-400/15" : "border-sky-400/45 bg-sky-400/[0.10]")}>
            <p className="text-[11px] font-bold text-sky-200">
              도착 · <Katex expr="\sim p" />
            </p>
            <p className="mt-0.5 text-[13px] font-bold leading-7 text-slate-100">
              <PieceLine ps={t.negP} />
            </p>
          </div>
        </div>

        {/* 밟은 돌 */}
        <div className="mt-2 space-y-1.5">
          {built.map((idx, k) => (
            <p key={idx} className="flex flex-wrap items-baseline gap-x-2 rounded-lg bg-black/25 px-3 py-2 text-[13px] leading-7 text-slate-100">
              <span className="shrink-0 font-mono text-[11px] font-bold text-violet-300">{k + 1}</span>
              <PieceLine ps={all[idx].text} />
            </p>
          ))}
          {!step2 && step1 ? (
            <p className="rounded-lg border-2 border-dashed border-white/15 px-3 py-2 text-center text-[12px] font-bold text-slate-600">{built.length + 1}번째 돌을 고르세요</p>
          ) : null}
        </div>

        {/* 남은 돌 */}
        {!step2 ? (
          <div className="mt-2 space-y-1.5">
            {deck.map((item) => {
              if (built.includes(item.idx)) return null;
              return (
                <button
                  key={item.idx}
                  type="button"
                  onClick={() => tap(item.idx)}
                  className="flex w-full items-baseline gap-2 rounded-xl border-2 border-white/12 bg-white/[0.04] px-3 py-2.5 text-left text-[13px] font-semibold leading-7 text-slate-100 transition hover:bg-white/10"
                >
                  <span className="shrink-0 text-[11px] text-slate-500">🪨</span>
                  <PieceLine ps={item.text} />
                </button>
              );
            })}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TipBox text={t.tip} open={tip} onOpen={() => setTip(true)} />
              {built.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setBuilt((s) => s.slice(0, -1));
                    setMsg(null);
                  }}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                >
                  ↶ 한 걸음 뒤로
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {msg ? <p className={"mt-2 rounded-xl px-3 py-2.5 text-[12px] leading-6 " + (msg.ok ? "bg-emerald-400/12 text-emerald-100" : "bg-rose-400/12 text-rose-100")}>❌ {msg.text}</p> : null}
      </div>

      {step2 ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2.5 text-center text-[13px] font-bold leading-7 text-emerald-50">
            ✅ 대우가 참임을 보였으므로 원래 명제 <PieceLine ps={t.claim} /> 도 참이에요.
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">📎 {t.why}</p>
          <div className="space-y-1">
            {t.fakes.map((f, k) => (
              <p key={k} className="rounded-lg bg-rose-400/[0.08] px-3 py-2 text-[12px] leading-7 text-rose-100">
                🚫 <PieceLine ps={f.text} />
                <span className="ml-1 text-slate-400">— {f.why}</span>
              </p>
            ))}
          </div>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 모순 감지기
// ══════════════════════════════════════════════════════════════
function AbsurdTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = ABSURDS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">💥 결론을 부정해 놓고 따라가다 모순을 잡아내세요</p>
          <Chips ids={ABSURDS.map((a) => a.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
          <b className="text-rose-200">배중률</b> · 명제 <Katex expr="q" /> 에 대하여 <Katex expr="q" /> 와 <Katex expr="\sim q" /> 중 하나는 반드시 성립해요. 그러니{" "}
          <Katex expr="\sim q" /> 가 모순을 낳으면 남는 것은 <Katex expr="q" /> 뿐입니다.
        </p>
      </div>

      <AbsurdOne
        key={t.id}
        t={t}
        last={i === ABSURDS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(ABSURDS.length - 1, k + 1))}
      />

      {done.length === ABSURDS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 다섯 개의 모순을 모두 잡아냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            모순은 <b className="text-white">처음에 붙여 둔 조건</b>(서로소), <b className="text-white">원래 명제의 가정</b>(n²이 짝수),{" "}
            <b className="text-white">이미 참으로 아는 사실</b>(√2는 무리수) 가운데 하나와 부딪히며 드러났어요. 어디에 부딪혔는지를 밝히는 것이 귀류법의 마무리랍니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function AbsurdOne({ t, last, onDone, onNext }: { t: AbsurdTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [start, setStart] = useState<number | null>(null);
  const [shown, setShown] = useState(1);
  const [found, setFound] = useState(false);
  const [against, setAgainst] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const step1 = start !== null && start === t.startAnswer;
  const step3 = found && against !== null && against === t.againstAnswer;

  const doneRef = useRef(false);
  useEffect(() => {
    if (step3 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function clash() {
    if (shown - 1 === t.clashAt) {
      setFound(true);
      setMsg("");
    } else {
      setMsg(t.early);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.08] to-sky-500/[0.03] px-4 py-3 text-center">
        <p className="text-[11px] font-bold tracking-widest text-cyan-200/80">증명할 명제</p>
        <p className="mt-1 text-lg font-bold leading-8 text-slate-100">
          <PieceLine ps={t.claim} />
        </p>
      </div>

      {/* 1단계 — 출발 가정 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (step1 ? "border-emerald-400/45 bg-emerald-400/[0.08]" : "border-white/10 bg-slate-900/40")}>
        <p className="text-[12px] font-bold text-slate-200">1단계 · 귀류법은 무엇을 가정하며 출발할까요?</p>
        <div className="mt-2 space-y-1.5">
          {t.starts.map((c, k) => {
            const on = start === k;
            const good = step1 && k === t.startAnswer;
            const bad = on && k !== t.startAnswer;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setStart(k)}
                disabled={step1}
                className={
                  "flex w-full items-baseline gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-[14px] font-semibold leading-7 transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                <span className="shrink-0 font-mono text-[13px] text-slate-400">{ABC[k]}</span>
                <PieceLine ps={c} />
              </button>
            );
          })}
        </div>
        {start !== null && !step1 ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {t.startWhy[start]}</p> : null}
      </div>

      {/* 2단계 — 따라가며 모순 찾기 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (step1 ? (found ? "border-rose-400/55 bg-rose-400/10" : "border-white/10 bg-slate-900/40") : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
        <p className="text-[12px] font-bold text-slate-200">2단계 · 한 줄씩 따라가다 모순이 보이면 감지기를 누르세요.</p>
        <div className="mt-2 space-y-1.5">
          {t.lines.slice(0, shown).map((l, k) => {
            const hit = found && k === t.clashAt;
            return (
              <p
                key={k}
                className={
                  "flex flex-wrap items-baseline gap-x-2 rounded-lg px-3 py-2 text-[13px] leading-7 transition " +
                  (hit ? "bg-rose-400/20 text-rose-50 ring-2 ring-rose-400/70" : "bg-black/25 text-slate-100")
                }
              >
                <span className={"shrink-0 font-mono text-[11px] font-bold " + (hit ? "text-rose-200" : "text-slate-500")}>{hit ? "💥" : k + 1}</span>
                <PieceLine ps={l} />
              </p>
            );
          })}
        </div>

        {!found ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setShown((s) => Math.min(t.lines.length, s + 1));
                setMsg("");
              }}
              disabled={shown >= t.lines.length}
              className="rounded-xl border-2 border-white/12 bg-white/5 px-3 py-2.5 text-[13px] font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-default disabled:opacity-40"
            >
              ▼ 한 줄 더 보기
            </button>
            <button
              type="button"
              onClick={clash}
              className="rounded-xl border-2 border-rose-400/60 bg-rose-400/15 px-3 py-2.5 text-[13px] font-bold text-rose-100 transition hover:bg-rose-400/25"
            >
              💥 모순 발견!
            </button>
          </div>
        ) : null}
        {msg ? <p className="mt-2 rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">⏳ {msg}</p> : null}
      </div>

      {/* 3단계 — 무엇과 모순인가 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (found ? "border-white/10 bg-slate-900/40" : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
        <p className="text-[12px] font-bold text-slate-200">3단계 · 이것은 무엇과 모순일까요?</p>
        <div className="mt-2 space-y-1.5">
          {t.against.map((c, k) => {
            const on = against === k;
            const good = step3 && k === t.againstAnswer;
            const bad = on && k !== t.againstAnswer;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setAgainst(k)}
                disabled={step3}
                className={
                  "flex w-full items-baseline gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-[13px] font-semibold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                <span className="shrink-0 font-mono text-[13px] text-slate-400">{ABC[k]}</span>
                {c}
              </button>
            );
          })}
        </div>
        {against !== null && !step3 && found ? (
          <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ 마지막 줄에서 밝혀진 사실이 어떤 문장과 정면으로 부딪히는지 찾아보세요.</p>
        ) : null}
      </div>

      {step3 ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2.5 text-center text-[13px] font-bold leading-7 text-emerald-50">
            ✅ 모순이 나왔으니 처음 가정이 틀렸어요. 따라서 <PieceLine ps={t.claim} />
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">📎 {t.why}</p>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 두 갈래 길
// ══════════════════════════════════════════════════════════════
function TwoRoads({ way }: { way: Way }) {
  const isC = way === "contra";
  const col = isC ? "#a78bfa" : "#fb7185";
  return (
    <svg viewBox="0 0 460 210" className="mx-auto block w-full max-w-[440px] select-none" role="img" aria-label="대우법과 귀류법의 길">
      {/* 출발 — ~q */}
      <rect x={12} y={80} width={104} height={46} rx={10} fill="rgba(251,191,36,0.16)" stroke="#fbbf24" strokeWidth={2.5} />
      <foreignObject x={12} y={88} width={104} height={30}>
        <div className="flex items-center justify-center text-[15px] font-bold" style={{ color: "#fde68a" }}>
          <Katex expr="\sim q" />
        </div>
      </foreignObject>
      <text x={64} y={72} textAnchor="middle" className="fill-amber-300 text-[11px] font-bold">
        출발 (공통)
      </text>

      {/* 가정 p — 귀류법만 합류 */}
      <g style={{ opacity: isC ? 0.25 : 1, transition: "opacity 320ms ease" }}>
        <rect x={12} y={14} width={104} height={40} rx={10} fill="rgba(56,189,248,0.16)" stroke="#38bdf8" strokeWidth={2.5} strokeDasharray={isC ? "6 5" : undefined} />
        <foreignObject x={12} y={20} width={104} height={28}>
          <div className="flex items-center justify-center text-[15px] font-bold" style={{ color: "#bae6fd" }}>
            <Katex expr="p" />
          </div>
        </foreignObject>
        <path d="M116,34 Q170,34 180,80" fill="none" stroke="#38bdf8" strokeWidth={2.5} strokeDasharray={isC ? "6 5" : undefined} markerEnd="url(#ip-a2)" />
        <text x={168} y={26} textAnchor="middle" className="fill-sky-300 text-[10px] font-bold">
          {isC ? "쓰지 않음" : "함께 씀"}
        </text>
      </g>

      {/* 길 */}
      <line x1={116} y1={103} x2={300} y2={103} stroke={col} strokeWidth={4} markerEnd="url(#ip-a1)" />
      <text x={208} y={94} textAnchor="middle" className="text-[11px] font-bold" fill={col}>
        따라가기
      </text>

      {/* 도착 */}
      <rect x={312} y={78} width={136} height={50} rx={12} fill={col + "26"} stroke={col} strokeWidth={3} />
      {isC ? (
        <foreignObject x={312} y={88} width={136} height={30}>
          <div className="flex items-center justify-center text-[17px] font-bold" style={{ color: "#ddd6fe" }}>
            <Katex expr="\sim p" />
          </div>
        </foreignObject>
      ) : (
        <text x={380} y={110} textAnchor="middle" className="text-[17px] font-bold" fill="#fecdd3">
          💥 모순
        </text>
      )}
      <text x={380} y={70} textAnchor="middle" className="text-[11px] font-bold" fill={col}>
        도착 — {isC ? "대우법" : "귀류법"}
      </text>

      {/* 마무리 */}
      <text x={380} y={150} textAnchor="middle" className="fill-slate-400 text-[11px]">
        {isC ? "대우가 참 ⇒ 원래 명제도 참" : "가정이 틀렸다 ⇒ 결론이 참"}
      </text>
      <text x={230} y={186} textAnchor="middle" className="fill-slate-500 text-[11px]">
        {isC ? "근거 · 명제와 대우는 참·거짓이 같다" : "근거 · 배중률 (q 와 ~q 중 하나는 성립)"}
      </text>

      <defs>
        <marker id="ip-a1" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 z" fill={col} />
        </marker>
        <marker id="ip-a2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#38bdf8" />
        </marker>
      </defs>
    </svg>
  );
}

const TRAIT_CHOICES: { id: TraitAnswer; label: string; emoji: string }[] = [
  { id: "contra", label: "대우법만", emoji: "↩️" },
  { id: "absurd", label: "귀류법만", emoji: "💥" },
  { id: "both", label: "둘 다 아니거나 둘 다", emoji: "🤝" },
];

function CompareTab() {
  const [way, setWay] = useState<Way>("contra");
  const [traits, setTraits] = useState<Record<string, TraitAnswer>>({});
  const [judges, setJudges] = useState<Record<string, Way>>({});

  const traitDone = TRAITS.every((t) => traits[t.id] === t.answer);
  const judgeDone = JUDGES.every((t) => judges[t.id] === t.way);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🛤️ 같은 곳에서 출발해 다른 곳에 닿는 두 길</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["contra", "absurd"] as Way[]).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWay(w)}
              className={
                "rounded-xl border-2 px-3 py-2.5 text-center text-[13px] font-bold transition " +
                (way === w ? WAY_META[w].ring + " " + WAY_META[w].soft + " " + WAY_META[w].tone : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              <span className="block text-lg">{WAY_META[w].emoji}</span>
              {WAY_META[w].label}
            </button>
          ))}
        </div>
        <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 p-2">
          <TwoRoads way={way} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-7 text-slate-300">
            <b className={WAY_META[way].tone}>목적지</b> · {WAY_META[way].goal}
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-7 text-slate-300">
            <b className={WAY_META[way].tone}>가정 p</b> · {WAY_META[way].usesP ? "함께 사용한다" : "사용하지 않는다"}
          </p>
        </div>
      </div>

      {/* 성질 고르기 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (traitDone ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/10 bg-slate-900/40")}>
        <p className="text-[12px] font-bold text-slate-200">
          🔍 이 성질은 어느 쪽 이야기일까요? <span className="font-mono text-slate-400">({TRAITS.filter((t) => traits[t.id] === t.answer).length} / {TRAITS.length})</span>
        </p>
        <div className="mt-2 space-y-1.5">
          {TRAITS.map((t) => {
            const picked = traits[t.id];
            const settled = picked === t.answer;
            return (
              <div
                key={t.id}
                className={
                  "rounded-xl border-2 px-3 py-2.5 transition " +
                  (settled ? "border-emerald-400/55 bg-emerald-400/10" : picked ? "border-rose-400/55 bg-rose-400/10" : "border-white/10 bg-white/[0.03]")
                }
              >
                <p className="text-[13px] font-semibold leading-7 text-slate-100">{t.text}</p>
                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-3">
                  {TRAIT_CHOICES.map((c) => {
                    const on = picked === c.id;
                    const good = settled && c.id === t.answer;
                    const bad = on && c.id !== t.answer;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setTraits((s) => ({ ...s, [t.id]: c.id }))}
                        disabled={settled}
                        className={
                          "rounded-lg border-2 px-2 py-1.5 text-[12px] font-bold transition disabled:cursor-default " +
                          (good
                            ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                            : bad
                              ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                        }
                      >
                        {c.emoji} {c.label}
                      </button>
                    );
                  })}
                </div>
                {settled ? <p className="mt-1.5 text-[12px] leading-6 text-emerald-100">✅ {t.why}</p> : null}
                {picked && !settled ? <p className="mt-1.5 text-[12px] leading-6 text-rose-100">❌ 두 길 그림에서 출발점과 도착점을 다시 견주어 보세요.</p> : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* 증명 판정 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (traitDone ? (judgeDone ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/10 bg-slate-900/40") : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
        <p className="text-[12px] font-bold text-slate-200">
          🧭 이 증명은 어느 길로 갔을까요? <span className="font-mono text-slate-400">({JUDGES.filter((t) => judges[t.id] === t.way).length} / {JUDGES.length})</span>
        </p>
        {!traitDone ? <p className="mt-2 rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">🔒 위의 성질 고르기를 마치면 열려요.</p> : null}
        <div className="mt-2 space-y-1.5">
          {JUDGES.map((t) => {
            const picked = judges[t.id];
            const settled = picked === t.way;
            return (
              <div
                key={t.id}
                className={
                  "rounded-xl border-2 px-3 py-2.5 transition " +
                  (settled ? "border-emerald-400/55 bg-emerald-400/10" : picked ? "border-rose-400/55 bg-rose-400/10" : "border-white/10 bg-white/[0.03]")
                }
              >
                <p className="text-[11px] font-bold text-slate-500">
                  명제 · <PieceLine ps={t.claim} />
                </p>
                <p className="mt-1 rounded-lg bg-black/25 px-2.5 py-1.5 text-[13px] leading-7 text-slate-100">
                  <span className="mr-1 text-[10px] font-bold text-slate-500">첫 줄</span>
                  <PieceLine ps={t.first} />
                </p>
                <p className="mt-1 rounded-lg bg-black/25 px-2.5 py-1.5 text-[13px] leading-7 text-slate-100">
                  <span className="mr-1 text-[10px] font-bold text-slate-500">끝 줄</span>
                  <PieceLine ps={t.last} />
                </p>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {(["contra", "absurd"] as Way[]).map((w) => {
                    const on = picked === w;
                    const good = settled && w === t.way;
                    const bad = on && w !== t.way;
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setJudges((s) => ({ ...s, [t.id]: w }))}
                        disabled={settled}
                        className={
                          "rounded-lg border-2 px-2 py-1.5 text-[12px] font-bold transition disabled:cursor-default " +
                          (good
                            ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                            : bad
                              ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                        }
                      >
                        {WAY_META[w].emoji} {WAY_META[w].label}
                      </button>
                    );
                  })}
                </div>
                {settled ? <p className="mt-1.5 text-[12px] leading-6 text-emerald-100">✅ {t.why}</p> : null}
                {picked && !settled ? <p className="mt-1.5 text-[12px] leading-6 text-rose-100">❌ 끝 줄의 도착점이 ~p 인지 모순인지 보세요.</p> : null}
              </div>
            );
          })}
        </div>
      </div>

      {traitDone && judgeDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 두 길을 완전히 갈라냈어요!</p>
          <div className="mt-2 overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[420px] text-center text-[12px]">
              <thead>
                <tr className="text-[11px] text-slate-400">
                  <th className="px-2 py-1.5 text-left font-semibold">견주는 점</th>
                  <th className="px-2 py-1.5 font-semibold text-violet-200">↩️ 대우법</th>
                  <th className="px-2 py-1.5 font-semibold text-rose-200">💥 귀류법</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                <tr className="border-t border-white/10">
                  <td className="px-2 py-2 text-left text-slate-400">출발점</td>
                  <td className="px-2 py-2" colSpan={2}>
                    <span className="rounded-lg bg-amber-400/15 px-2 py-1 text-amber-100">
                      둘 다 <Katex expr="\sim q" /> (결론의 부정)
                    </span>
                  </td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-2 py-2 text-left text-slate-400">가정 p 사용</td>
                  <td className="px-2 py-2 font-bold text-rose-200">쓰지 않음</td>
                  <td className="px-2 py-2 font-bold text-emerald-200">함께 씀</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-2 py-2 text-left text-slate-400">도착점</td>
                  <td className="px-2 py-2 font-bold text-violet-200">
                    <Katex expr="\sim p" />
                  </td>
                  <td className="px-2 py-2 font-bold text-rose-200">💥 모순</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-2 py-2 text-left text-slate-400">근거</td>
                  <td className="px-2 py-2 text-[11px] text-slate-300">명제와 대우는 참·거짓이 같다</td>
                  <td className="px-2 py-2 text-[11px] text-slate-300">배중률</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 송편 논리 퍼즐
// ══════════════════════════════════════════════════════════════
function Songpyeon({ pos, owner, on, onClick }: { pos: number; owner: string | null; on: boolean; onClick: () => void }) {
  const d = DOUGH_META[doughOf(pos)];
  const person = PEOPLE.find((p) => p.id === owner);
  const half = shapeOf(pos) === "half";
  return (
    <button
      type="button"
      onClick={onClick}
      className={"flex flex-col items-center rounded-xl border-2 px-1.5 py-1.5 transition " + (on ? "border-cyan-400/80 bg-cyan-400/15" : "border-white/10 bg-white/[0.03] hover:bg-white/10")}
    >
      <span className="font-mono text-[10px] font-bold text-slate-500">{pos}</span>
      <svg viewBox="0 0 56 46" className="block w-[46px]" role="img" aria-label={`${pos}번 ${half ? "반달" : "꽃"} 모양 ${d.label} 송편`}>
        {half ? (
          <path d="M6,30 Q28,2 50,30 Q28,42 6,30 Z" fill={d.fill} stroke={d.edge} strokeWidth={2} strokeLinejoin="round" />
        ) : (
          <g>
            {[0, 1, 2, 3, 4].map((k) => {
              const a = (k * 2 * Math.PI) / 5 - Math.PI / 2;
              return <circle key={k} cx={28 + Math.cos(a) * 12} cy={23 + Math.sin(a) * 12} r={9} fill={d.fill} stroke={d.edge} strokeWidth={1.8} />;
            })}
            <circle cx={28} cy={23} r={7} fill={d.fill} stroke={d.edge} strokeWidth={1.8} />
          </g>
        )}
      </svg>
      <span
        className="mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold"
        style={person ? { background: person.color + "33", color: person.color } : { background: "rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.8)" }}
      >
        {person ? person.name : "?"}
      </span>
    </button>
  );
}

function PuzzleTab() {
  const [assign, setAssign] = useState<Assign>({ ...EMPTY_ASSIGN });
  const [sel, setSel] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [tips, setTips] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [reveal, setReveal] = useState(false);

  const states = CLUES.map((c) => c.check(assign));
  const filled = POSITIONS.every((p) => assign[p] !== null);
  const solved = filled && states.every((s) => s === "ok");
  const sol = solveSongpyeon()[0];

  function place(person: string) {
    if (sel === null || solved) return;
    const next: Assign = { ...assign, [sel]: person };
    if (tooMany(next, person)) {
      const who = PEOPLE.find((p) => p.id === person)?.name;
      setMsg(`${who}이(가) 만든 ${sel <= 4 ? "반달" : "꽃"} 모양 송편은 이미 놓여 있어요. 한 사람이 각 모양을 하나씩만 만들었답니다.`);
      return;
    }
    setAssign(next);
    setSel(null);
    setMsg("");
  }

  function clearSlot() {
    if (sel === null) return;
    setAssign((a) => ({ ...a, [sel]: null }));
    setMsg("");
  }

  const left = (id: string) => 2 - posOf(assign, id).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🥟 누가 어떤 송편을 만들었을까요?</p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          재호 · 희정 · 민국 · 예진 네 사람이 <b className="text-slate-200">반달 모양 하나와 꽃 모양 하나</b> 씩 만들어 왼쪽부터 일렬로 놓았어요. 단서를 읽고 각 자리의 주인을 찾아
          보세요.
        </p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">
            <b className="text-slate-100">(1)</b> 첫 번째부터 네 번째까지는 <b className="text-white">반달 모양</b>, 다섯 번째부터 여덟 번째까지는 <b className="text-white">꽃 모양</b>
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">
            <b className="text-slate-100">(2)</b> 홀수 번째는 <b className="text-amber-200">호박 반죽</b>, 짝수 번째는 <b className="text-emerald-200">모시 반죽</b>
          </p>
        </div>
      </div>

      {/* 접시 */}
      <div className="rounded-[2rem] border-2 border-amber-200/20 bg-gradient-to-b from-amber-100/[0.06] to-amber-200/[0.02] p-3">
        <div className="flex flex-wrap items-end justify-center gap-1.5">
          {POSITIONS.map((p) => (
            <Songpyeon key={p} pos={p} owner={assign[p]} on={sel === p} onClick={() => { setSel(sel === p ? null : p); setMsg(""); }} />
          ))}
        </div>
      </div>

      {/* 사람 고르기 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-[12px] font-bold text-slate-200">{sel === null ? "🖐️ 위에서 송편을 하나 고르세요." : `🖐️ ${sel}번 송편은 누가 만들었을까요?`}</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {PEOPLE.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => place(p.id)}
              disabled={sel === null || solved}
              className="rounded-xl border-2 px-2 py-2.5 text-[13px] font-bold transition disabled:cursor-default disabled:opacity-40"
              style={{ borderColor: p.color + "88", background: p.color + "1f", color: p.color }}
            >
              {p.name}
              <span className="ml-1 text-[10px] opacity-70">남은 {left(p.id)}</span>
            </button>
          ))}
        </div>
        {sel !== null && assign[sel] ? (
          <button
            type="button"
            onClick={clearSlot}
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ✕ {sel}번 비우기
          </button>
        ) : null}
        {msg ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {msg}</p> : null}
      </div>

      {/* 단서 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-[12px] font-bold text-slate-200">🗣️ 네 사람의 말</p>
        <div className="mt-2 space-y-1.5">
          {CLUES.map((c, k) => {
            const st = states[k];
            const person = PEOPLE.find((p) => p.name === c.who);
            return (
              <div
                key={c.id}
                className={
                  "flex flex-wrap items-start gap-2 rounded-xl border-2 px-3 py-2.5 transition " +
                  (st === "ok" ? "border-emerald-400/50 bg-emerald-400/10" : st === "bad" ? "border-rose-400/60 bg-rose-400/12" : "border-white/10 bg-white/[0.03]")
                }
              >
                <span className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold" style={{ background: (person?.color ?? "#94a3b8") + "33", color: person?.color ?? "#94a3b8" }}>
                  {c.who}
                </span>
                <span className="flex-1 text-[13px] leading-7 text-slate-100">{c.text}</span>
                <span className="shrink-0 text-lg">{st === "ok" ? "✅" : st === "bad" ? "❌" : "⬜"}</span>
              </div>
            );
          })}
        </div>
        {!solved ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setTips((t) => Math.min(PUZZLE_HINTS.length, t + 1))}
              disabled={tips >= PUZZLE_HINTS.length}
              className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20 disabled:opacity-40"
            >
              💡 힌트 보기 ({tips} / {PUZZLE_HINTS.length})
            </button>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setAssign({ ...EMPTY_ASSIGN });
                  setSel(null);
                  setMsg("");
                }}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                ↺ 처음부터
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssign({ ...sol });
                  setSel(null);
                  setMsg("");
                  setReveal(true);
                }}
                className="rounded-lg border border-rose-400/35 bg-rose-400/10 px-3 py-1.5 text-[11px] font-bold text-rose-100 transition hover:bg-rose-400/20"
              >
                정답 보기
              </button>
            </div>
          </div>
        ) : null}
        {tips > 0 && !solved ? (
          <div className="mt-2 space-y-1">
            {PUZZLE_HINTS.slice(0, tips).map((h, k) => (
              <p key={k} className="rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">
                💡 {h}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      {/* 두 문제 */}
      {solved ? (
        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-3">
            <p className="text-center text-sm font-extrabold text-emerald-100">
              {reveal ? "📖 정답을 펼쳤어요" : "🎉 네 단서를 모두 만족시켰어요!"}
            </p>
            <p className="mt-1 text-center text-[12px] leading-6 text-slate-300">이제 두 가지를 답해 볼까요?</p>
          </div>
          {PUZZLE_QS.map((q) => {
            const picked = answers[q.id];
            const ok = picked === q.answer;
            return (
              <div
                key={q.id}
                className={"rounded-2xl border-2 p-3 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/10" : picked !== undefined ? "border-rose-400/55 bg-rose-400/10" : "border-white/10 bg-slate-900/40")}
              >
                <p className="text-[13px] font-bold text-slate-100">{q.ask}</p>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {q.choices.map((c, k) => {
                    const on = picked === k;
                    const good = ok && k === q.answer;
                    const bad = on && k !== q.answer;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setAnswers((s) => ({ ...s, [q.id]: k }))}
                        disabled={ok}
                        className={
                          "rounded-xl border-2 px-3 py-2.5 text-[13px] font-bold transition disabled:cursor-default " +
                          (good
                            ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                            : bad
                              ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                              : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                        }
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
                {ok ? <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {q.why}</p> : null}
                {picked !== undefined && !ok ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ 접시를 다시 살펴보세요.</p> : null}
              </div>
            );
          })}
          {PUZZLE_QS.every((q) => answers[q.id] === q.answer) ? (
            <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
              <p className="text-center text-sm font-extrabold text-emerald-100">🏆 완벽해요!</p>
              <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
                「예진이는 짝수 번째에 놓을 수 없다」처럼 <b className="text-white">될 수 없는 경우를 지워 나가는 것</b> 도 결국 귀류법이에요. 어떤 가정을 세워 보고 어긋나면 지우는
                것이니까요.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
