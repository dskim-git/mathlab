"use client";

import { useEffect, useId, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CARDS,
  CARD_ORDER,
  CONN_NAME,
  DEMORGANS,
  INEQS,
  NEG_OP,
  NL,
  OPS,
  OP_NAME,
  OP_PAIRS,
  OP_TEX,
  REGIONS,
  REGION_NAME,
  TRUTHS,
  U3,
  V3,
  V4,
  flipCombo,
  gapPieces,
  gapRegions,
  listTex,
  nlX,
  overlapPieces,
  overlapRegions,
  pieceSpan,
  piecesOf,
  regionsOf,
  shuffled,
  ticksOf,
  type Choice,
  type Combo,
  type Conn,
  type DeMorganTask,
  type IneqTask,
  type NegCard,
  type Op,
  type TruthTask,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "how_to_negate",
    prompt:
      "탭①·②에서 여러 문장과 식을 부정해 보았어요. 「~이 아니다」를 붙이는 것 말고, 부등호나 등호가 들어 있는 조건은 어떻게 부정했는지 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 문장은 「~이다」를 「~이 아니다」로 바꾸면 되지만, 부등호가 든 조건은 부등호 자체를 뒤집어야 한다. x < 4 의 부정은 x > 4 가 아니라 x ≥ 4 인데, 그렇지 않으면 x = 4 가 어느 쪽에도 들어가지 않기 때문이다. 등호 = 의 부정은 ≠ 이다.",
  },
  {
    id: "complement_meaning",
    prompt:
      "조건 p 의 진리집합이 P 일 때 ~p 의 진리집합이 왜 P 의 여집합이 되는지, 탭③에서 본 그림을 떠올리며 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 전체집합의 원소는 조건 p 를 참이 되게 하거나 그렇지 않거나 둘 중 하나뿐이다. p 를 참이 되게 하는 원소를 모은 것이 P 이므로, 나머지 원소는 모두 ~p 를 참이 되게 한다. 그래서 ~p 의 진리집합은 P 의 여집합이고, 두 집합을 합치면 전체집합이 되고 겹치는 부분은 없다.",
  },
  {
    id: "de_morgan_why",
    prompt:
      "탭④에서 「또는」을 부정했더니 「그리고」로 바뀌었어요. 왜 그렇게 되는지 벤 다이어그램이나 구체적인 예를 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 「짝수이거나 3의 배수이다」가 아니라는 말은, 짝수도 아니고 동시에 3의 배수도 아니라는 뜻이다. 벤 다이어그램에서 두 원의 합집합 바깥은 두 원 모두의 바깥이므로 두 조건을 동시에 어겨야 한다. 그래서 부정하면 「또는」이 「그리고」로 바뀐다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "switch" | "ineq" | "truth" | "demorgan";

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

/** 문장 한 줄 — 한글은 HTML, 식은 KaTeX (KaTeX 안에 한글을 넣을 수 없다) */
function Sentence({ pre, tex }: Choice) {
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5">
      {pre}
      {tex ? <Katex expr={tex} /> : null}
    </span>
  );
}

/** 조건 이름과 문장 — p : x는 8의 약수이다 */
function CondLine({ name, neg, pre, tex }: { name?: string; neg?: boolean; pre?: string; tex?: string }) {
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 font-semibold text-slate-100">
      {name ? (
        <>
          {neg ? <span className="font-serif text-amber-200">~</span> : null}
          <i className="font-serif italic text-amber-200">{name}</i>
          <span className="text-slate-400">:</span>
        </>
      ) : null}
      {pre}
      {tex ? <Katex expr={tex} /> : null}
    </span>
  );
}

/** 화면 글자용 수 표기 — 음수는 유니코드 빼기표 */
function num(n: number): string {
  return n < 0 ? "−" + String(Math.abs(n)) : String(n);
}

const ABC = ["①", "②", "③", "④"];

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function NegationLab() {
  const [tab, setTab] = useState<Tab>("switch");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔀 명제와 조건의 부정</h3>
        <p className="mt-2 leading-7 text-slate-300">
          명제나 조건 <Katex expr="p" /> 에 대해 <b className="text-amber-200">「p가 아니다」</b>를 <Katex expr="\sim p" /> 로 나타내요. 스위치를 눌러 참·거짓을 뒤집고,
          부등호를 뒤집고, 진리집합을 뒤집어 봅시다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "switch"} onClick={() => setTab("switch")}>
          ① 부정 스위치 🔀
        </TabButton>
        <TabButton active={tab === "ineq"} onClick={() => setTab("ineq")}>
          ② 부등호 뒤집개 ⚖️
        </TabButton>
        <TabButton active={tab === "truth"} onClick={() => setTab("truth")}>
          ③ 진리집합은 여집합 🎯
        </TabButton>
        <TabButton active={tab === "demorgan"} onClick={() => setTab("demorgan")}>
          ④ 또는·그리고 뒤집기 🔗
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "switch" ? <SwitchTab /> : null}
        {tab === "ineq" ? <IneqTab /> : null}
        {tab === "truth" ? <TruthTab /> : null}
        {tab === "demorgan" ? <DeMorganTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 부정 스위치
// ══════════════════════════════════════════════════════════════
/** 참·거짓 램프 두 개와 그 사이의 부정 스위치 */
function LampPanel({ left, right, flipped }: { left: boolean | null; right: boolean | null; flipped: boolean }) {
  const on = "#34d399";
  const off = "#fb7185";
  const dim = "rgba(148,163,184,0.45)";
  function bulb(v: boolean | null, cx: number) {
    const col = v === null ? dim : v ? on : off;
    return (
      <g>
        {v !== null ? <circle cx={cx} cy={58} r={46} fill={col} opacity={0.14} /> : null}
        <circle cx={cx} cy={58} r={32} fill={v === null ? "rgba(255,255,255,0.04)" : `${col}28`} stroke={col} strokeWidth={v === null ? 2.5 : 4} strokeDasharray={v === null ? "6 6" : undefined} />
        <text x={cx} y={66} textAnchor="middle" fill={col} className="text-[19px] font-bold">
          {v === null ? "?" : v ? "참" : "거짓"}
        </text>
      </g>
    );
  }
  return (
    <svg viewBox="0 0 460 132" className="mx-auto block w-full max-w-[420px] select-none" role="img" aria-label="참 거짓 램프">
      {bulb(left, 110)}
      {bulb(right, 350)}
      <line x1={152} y1={58} x2={302} y2={58} stroke="rgba(148,163,184,0.35)" strokeWidth={3} strokeDasharray="7 7" />
      <polygon points="302,58 288,51 288,65" fill="rgba(148,163,184,0.55)" />
      <g style={{ transition: "transform 320ms ease", transform: flipped ? "translateY(0px)" : "translateY(6px)" }}>
        <rect x={198} y={26} width={60} height={32} rx={11} fill={flipped ? "rgba(251,191,36,0.18)" : "rgba(255,255,255,0.05)"} stroke={flipped ? "#fbbf24" : "rgba(148,163,184,0.5)"} strokeWidth={2.5} />
        <text x={228} y={49} textAnchor="middle" fill={flipped ? "#fde68a" : "rgba(203,213,225,0.8)"} className="font-serif text-[19px] font-bold">
          ~
        </text>
      </g>
      <text x={110} y={116} textAnchor="middle" className="fill-sky-300 font-serif text-[17px] font-bold italic">
        p
      </text>
      <text x={350} y={116} textAnchor="middle" className="fill-amber-200 font-serif text-[17px] font-bold italic">
        ~p
      </text>
    </svg>
  );
}

function SwitchTab() {
  const [order, setOrder] = useState<number[]>(() => [...CARD_ORDER]);
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const deck = order.map((k) => CARDS[k]);
  const c = deck[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔀 명제를 부정하고 참·거짓을 뒤집어 보세요</p>
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
          명제 <Katex expr="p" /> 에 대해 <b className="text-white">「p가 아니다」</b>를 <Katex expr="\sim p" /> 라 하고 <b className="text-amber-200">p의 부정</b>이라 불러요.
        </p>
      </div>

      <SwitchOne
        key={c.id}
        c={c}
        last={i === deck.length - 1}
        onDone={() => setDone((s) => (s.includes(c.id) ? s : [...s, c.id]))}
        onNext={() => setI((k) => Math.min(deck.length - 1, k + 1))}
      />

      {done.length === CARDS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문장을 모두 부정했어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <p className="rounded-xl bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
              <b className="text-sky-200">p가 참</b> 이면 <b className="text-amber-200">~p는 거짓</b>
              <br />
              <b className="text-sky-200">p가 거짓</b> 이면 <b className="text-amber-200">~p는 참</b>
            </p>
            <p className="flex items-center justify-center rounded-xl bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
              <Katex expr="\sim(\sim p) = p" />
            </p>
          </div>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            ※ 부정은 <b className="text-white">그 문장 하나만</b> 뒤집는 것이에요. 주어와 술어를 맞바꾸거나, 수를 바꾸거나, 참인 다른 문장을 가져오는 것은 부정이 아니랍니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function SwitchOne({ c, last, onDone, onNext }: { c: NegCard; last: boolean; onDone: () => void; onNext: () => void }) {
  const [truth, setTruth] = useState<boolean | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [negTruth, setNegTruth] = useState<boolean | null>(null);
  const [twice, setTwice] = useState(false);

  const step1 = truth !== null && truth === c.truth;
  const step2 = pick !== null && pick === c.answer;
  const step3 = negTruth !== null && negTruth === !c.truth;
  const ok = step1 && step2 && step3;

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
        {/* 문장 + 램프 */}
        <div
          className={
            "flex flex-col justify-center rounded-2xl border-2 p-4 transition " +
            (ok ? "border-emerald-400/55 bg-emerald-400/[0.10]" : "border-sky-400/35 bg-gradient-to-br from-sky-500/[0.08] to-cyan-500/[0.04]")
          }
        >
          <p className="text-center text-[11px] font-bold tracking-widest text-sky-200/80">{twice ? "~(~p)" : "p"}</p>
          <div className="mt-2 rounded-xl border border-white/12 bg-black/30 px-4 py-6 text-center">
            <p className="text-lg font-bold leading-8 text-slate-100">
              {twice ? <Sentence pre={c.pre} tex={c.tex} /> : step2 ? <Sentence pre={c.choices[c.answer].pre} tex={c.choices[c.answer].tex} /> : <Sentence pre={c.pre} tex={c.tex} />}
            </p>
            <p className="mt-1 text-[11px] font-bold text-slate-500">{twice ? "부정을 두 번 하면 원래 문장" : step2 ? "↑ 부정한 문장 ~p" : "↑ 원래 명제 p"}</p>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-white/10 bg-slate-900/40 p-3">
          <LampPanel left={step1 ? c.truth : null} right={step3 ? !c.truth : null} flipped={step3} />
          <p className="text-center text-[11px] leading-5 text-slate-400">
            {step3 ? "두 램프는 언제나 반대로 켜져요" : "왼쪽은 p, 오른쪽은 ~p 의 참·거짓"}
          </p>
        </div>
      </div>

      {/* 1단계 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-[12px] font-bold text-slate-200">
          1단계 · 원래 명제 <Katex expr="p" /> 는 참일까요, 거짓일까요?
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[true, false].map((v) => {
            const on = truth === v;
            const good = truth !== null && v === c.truth && step1;
            const bad = on && v !== c.truth;
            return (
              <button
                key={String(v)}
                type="button"
                onClick={() => setTruth(v)}
                disabled={step1}
                className={
                  "rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                {v ? "참 ⭕" : "거짓 ❌"}
              </button>
            );
          })}
        </div>
        {step1 ? <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {c.truthWhy}</p> : null}
        {truth !== null && !step1 ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ 다시 한 번 살펴볼까요?</p> : null}
      </div>

      {/* 2단계 */}
      <div className={"rounded-2xl border border-white/10 bg-slate-900/40 p-3 transition " + (step1 ? "" : "pointer-events-none opacity-40")}>
        <p className="text-[12px] font-bold text-slate-200">
          2단계 · <Katex expr="p" /> 의 부정 <Katex expr="\sim p" /> 는 어느 것일까요?
        </p>
        <div className="mt-2 space-y-1.5">
          {c.choices.map((h, k) => {
            const on = pick === k;
            const good = step2 && k === c.answer;
            const bad = on && k !== c.answer;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setPick(k)}
                disabled={step2}
                className={
                  "flex w-full items-center gap-2 overflow-x-auto overflow-y-hidden rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                <span className="shrink-0 font-mono text-[13px] text-slate-400">{ABC[k]}</span>
                <span className="whitespace-nowrap">
                  <Sentence pre={h.pre} tex={h.tex} />
                </span>
              </button>
            );
          })}
        </div>
        {step2 ? <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {c.why}</p> : null}
        {pick !== null && !step2 ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {c.choiceWhy[pick]}</p> : null}
      </div>

      {/* 3단계 */}
      <div className={"rounded-2xl border border-white/10 bg-slate-900/40 p-3 transition " + (step2 ? "" : "pointer-events-none opacity-40")}>
        <p className="text-[12px] font-bold text-slate-200">
          3단계 · 그러면 <Katex expr="\sim p" /> 는 참일까요, 거짓일까요?
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[true, false].map((v) => {
            const on = negTruth === v;
            const good = step3 && v === !c.truth;
            const bad = on && v === c.truth;
            return (
              <button
                key={String(v)}
                type="button"
                onClick={() => setNegTruth(v)}
                disabled={step3}
                className={
                  "rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                {v ? "참 ⭕" : "거짓 ❌"}
              </button>
            );
          })}
        </div>
        {step3 ? (
          <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-center text-[12px] leading-6 text-emerald-100">
            ✅ 명제가 {c.truth ? "참" : "거짓"} 이면 그 부정은 {c.truth ? "거짓" : "참"} — 램프는 늘 반대로 켜져요.
          </p>
        ) : null}
        {negTruth !== null && !step3 ? (
          <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ 원래 명제와 같은 값을 골랐어요. 부정은 참·거짓이 뒤집힌답니다.</p>
        ) : null}
      </div>

      {ok ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTwice((t) => !t)}
            className="rounded-xl border-2 border-amber-400/55 bg-amber-400/15 px-3 py-2.5 text-sm font-bold text-amber-100 transition hover:bg-amber-400/25"
          >
            {twice ? "↩ 다시 ~p 보기" : "🔁 부정을 한 번 더 하기"}
          </button>
          {last ? (
            <p className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[12px] font-bold text-slate-300">마지막 문장이에요</p>
          ) : (
            <NextBtn onClick={onNext} />
          )}
        </div>
      ) : null}
      {twice ? (
        <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2.5 text-center text-[12px] leading-6 text-amber-100">
          부정을 두 번 하면 처음 문장으로 돌아와요 — <Katex expr="\sim(\sim p) = p" />
        </p>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 부등호 뒤집개
// ══════════════════════════════════════════════════════════════
const P_COL = "#38bdf8";
const N_COL = "#fbbf24";

/** 수직선 한 줄 — 조각 집합을 굵은 선과 점으로 그린다 */
function Axis({ t, op, y, color, above }: { t: IneqTask; op: Op | null; y: number; color: string; above: boolean }) {
  const xn = nlX(t, t.num);
  const ps = op ? piecesOf(op) : [];
  const hasL = ps.includes(0);
  const hasE = ps.includes(1);
  const hasR = ps.includes(2);
  const dir = above ? -1 : 1;
  return (
    <g>
      <line x1={NL.x0 - 16} y1={y} x2={NL.x1 + 16} y2={y} stroke="rgba(148,163,184,0.55)" strokeWidth={2} />
      <polygon points={`${NL.x1 + 22},${y} ${NL.x1 + 10},${y - 5} ${NL.x1 + 10},${y + 5}`} fill="rgba(148,163,184,0.55)" />
      <polygon points={`${NL.x0 - 22},${y} ${NL.x0 - 10},${y - 5} ${NL.x0 - 10},${y + 5}`} fill="rgba(148,163,184,0.55)" />
      {ticksOf(t).map((v) => {
        const x = nlX(t, v);
        return (
          <g key={v}>
            <line x1={x} y1={y} x2={x} y2={y + dir * 6} stroke="rgba(148,163,184,0.5)" strokeWidth={1.6} />
            <text x={x} y={y + dir * (above ? 14 : 22)} textAnchor="middle" className="fill-slate-400 text-[11px] font-semibold">
              {num(v)}
            </text>
          </g>
        );
      })}
      {hasL ? (
        <>
          <line x1={NL.x0 - 12} y1={y} x2={xn} y2={y} stroke={color} strokeWidth={6} strokeLinecap="round" />
          <polygon points={`${NL.x0 - 22},${y} ${NL.x0 - 8},${y - 7} ${NL.x0 - 8},${y + 7}`} fill={color} />
        </>
      ) : null}
      {hasR ? (
        <>
          <line x1={xn} y1={y} x2={NL.x1 + 12} y2={y} stroke={color} strokeWidth={6} strokeLinecap="round" />
          <polygon points={`${NL.x1 + 22},${y} ${NL.x1 + 8},${y - 7} ${NL.x1 + 8},${y + 7}`} fill={color} />
        </>
      ) : null}
      {op ? <circle cx={xn} cy={y} r={7} fill={hasE ? color : "#020617"} stroke={color} strokeWidth={3} /> : null}
    </g>
  );
}

function IneqTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = INEQS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">⚖️ 부등호를 뒤집어 부정을 만드세요</p>
          <Chips ids={INEQS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
          조건 <Katex expr="p" /> 와 그 부정 <Katex expr="\sim p" /> 는 <b className="text-white">겹치지도, 틈이 생기지도</b> 않아야 해요. 모든 수가 둘 중 정확히 한 쪽에
          들어가야 하거든요.
        </p>
      </div>

      <IneqOne
        key={t.id}
        t={t}
        last={i === INEQS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(INEQS.length - 1, k + 1))}
      />

      {done.length === INEQS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 부등호 짝 표를 완성했어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
            {OP_PAIRS.map(([a, b]) => (
              <div key={a} className="flex items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2.5 text-base">
                <Katex expr={OP_TEX[a]} />
                <span className="text-[11px] font-bold text-amber-200">부정</span>
                <span className="text-slate-500">↔</span>
                <Katex expr={OP_TEX[b]} />
              </div>
            ))}
          </div>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            ※ <Katex expr="<" /> 의 부정은 <Katex expr=">" /> 가 아니라 <b className="text-white">
              <Katex expr="\ge" />
            </b>{" "}
            예요. <b className="text-white">경계에 있는 수</b>가 어느 쪽에 들어가는지 꼭 살펴야 하지요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function IneqOne({ t, last, onDone, onNext }: { t: IneqTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [pick, setPick] = useState<Op | null>(null);
  const [hint, setHint] = useState(false);

  const ov = pick ? overlapPieces(t.op, pick) : [];
  const gp = pick ? gapPieces(t.op, pick) : [];
  const ok = pick !== null && ov.length === 0 && gp.length === 0;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function pieceName(m: number): string {
    if (m === 0) return `${num(t.num)}보다 작은 수`;
    if (m === 2) return `${num(t.num)}보다 큰 수`;
    return `x = ${num(t.num)}`;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border-2 border-sky-400/35 bg-sky-400/[0.07] px-4 py-3">
        <span className="text-[11px] font-bold tracking-widest text-sky-200/80">조건</span>
        <span className="text-xl">
          <CondLine name="p" tex={`x ${OP_TEX[t.op]} ${t.num}`} />
        </span>
        <span className="rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-bold text-sky-100">
          x는 {num(t.num)}보다 {OP_NAME[t.op]}
        </span>
      </div>

      <div className={"rounded-2xl border-2 p-3 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/[0.08]" : ov.length ? "border-rose-400/50 bg-rose-400/[0.06]" : "border-white/10 bg-slate-900/40")}>
        <div className="overflow-x-auto overflow-y-hidden py-1">
          <svg viewBox={`0 0 ${NL.w} ${NL.h}`} className="mx-auto block w-full min-w-[560px] select-none" role="img" aria-label="수직선">
            {/* 진단 띠 */}
            {[...ov.map((m) => [m, "ov"] as const), ...gp.map((m) => [m, "gp"] as const)].map(([m, kind]) => {
              const [a, b] = pieceSpan(t, m);
              return (
                <rect
                  key={kind + m}
                  x={a}
                  y={NL.stripY}
                  width={Math.max(b - a, 6)}
                  height={NL.stripH}
                  rx={6}
                  fill={kind === "ov" ? "rgba(251,113,133,0.22)" : "rgba(167,139,250,0.20)"}
                  stroke={kind === "ov" ? "rgba(251,113,133,0.75)" : "rgba(167,139,250,0.7)"}
                  strokeWidth={2}
                  strokeDasharray={kind === "gp" ? "6 5" : undefined}
                />
              );
            })}
            <Axis t={t} op={t.op} y={NL.topY} color={P_COL} above />
            <Axis t={t} op={pick} y={NL.botY} color={N_COL} above={false} />
            <text x={20} y={NL.topY + 6} textAnchor="middle" fill={P_COL} className="font-serif text-[17px] font-bold italic">
              p
            </text>
            <text x={20} y={NL.botY + 6} textAnchor="middle" fill={N_COL} className="font-serif text-[17px] font-bold italic">
              ~p
            </text>
          </svg>
        </div>
        <p className="text-center text-[11px] leading-5 text-slate-400">
          위는 조건 <span className="font-serif italic text-sky-300">p</span>, 아래는 내가 만든{" "}
          <span className="font-serif italic text-amber-200">~p</span> — 가운데 띠에 <span className="text-rose-300">붉은 칸</span>(겹침)이나{" "}
          <span className="text-violet-300">보라 칸</span>(틈)이 없어야 해요
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-[12px] font-bold text-slate-200">
          <Katex expr="\sim p" /> 의 부등호를 고르세요 — 기준 수 {num(t.num)} 은 그대로예요
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {OPS.map((o) => {
            const on = pick === o;
            const good = ok && on;
            const bad = on && !ok;
            return (
              <button
                key={o}
                type="button"
                onClick={() => setPick(o)}
                disabled={ok}
                className={
                  "flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-2 transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                <span className="text-lg">
                  <Katex expr={`x ${OP_TEX[o]} ${t.num}`} />
                </span>
                <span className="whitespace-nowrap text-[10px] font-bold text-slate-400">{OP_NAME[o]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {pick === null ? (
        <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-center text-[12px] font-bold text-slate-300">부등호를 하나 골라 아래 수직선을 채워 보세요</p>
      ) : ok ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-3">
          <p className="text-center text-sm font-extrabold text-emerald-100">✅ 딱 맞물렸어요! 겹치는 곳도, 빈 곳도 없어요</p>
          <p className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-center text-[13px] text-emerald-50">
            <Katex expr={`x ${OP_TEX[t.op]} ${t.num}`} />
            <span className="text-slate-400">의 부정은</span>
            <Katex expr={`x ${OP_TEX[NEG_OP[t.op]]} ${t.num}`} />
          </p>
        </div>
      ) : ov.length ? (
        <p className="rounded-xl border-2 border-rose-400/50 bg-rose-400/12 px-3 py-2.5 text-center text-[12px] leading-6 text-rose-100">
          ❌ 겹치는 곳이 있어요 — <b className="text-white">{ov.map(pieceName).join(", ")}</b> 이(가) 양쪽 모두에 들어가요. 같은 수가 <Katex expr="p" /> 도 참,{" "}
          <Katex expr="\sim p" /> 도 참일 수는 없답니다.
        </p>
      ) : (
        <p className="rounded-xl border-2 border-violet-400/50 bg-violet-400/12 px-3 py-2.5 text-center text-[12px] leading-6 text-violet-100">
          🟡 거의 다 왔어요 — <b className="text-white">{gp.map(pieceName).join(", ")}</b> 이(가) 어느 쪽에도 없어요. 경계에 있는 수를 어느 쪽에 넣을지 다시 살펴보세요.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setHint((h) => !h)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          {hint ? "💡 힌트 접기" : "💡 힌트 보기"}
        </button>
        {ok && !last ? <NextBtn onClick={onNext} /> : <span />}
      </div>
      {hint ? <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2.5 text-[12px] leading-6 text-amber-100">💡 {t.tip}</p> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 진리집합은 여집합
// ══════════════════════════════════════════════════════════════
function boxPath(): string {
  const b = V3.box;
  return `M${b.x + b.r},${b.y} H${b.x + b.w - b.r} A${b.r},${b.r} 0 0 1 ${b.x + b.w},${b.y + b.r} V${b.y + b.h - b.r} A${b.r},${b.r} 0 0 1 ${b.x + b.w - b.r},${b.y + b.h} H${b.x + b.r} A${b.r},${b.r} 0 0 1 ${b.x},${b.y + b.h - b.r} V${b.y + b.r} A${b.r},${b.r} 0 0 1 ${b.x + b.r},${b.y} Z`;
}
function circleSub(): string {
  const c = V3.circle;
  return `M${c.cx - c.r},${c.cy} a${c.r},${c.r} 0 1,0 ${2 * c.r},0 a${c.r},${c.r} 0 1,0 ${-2 * c.r},0 Z`;
}

function VennChips({ picked, onToggle, showComp, locked }: { picked: string[]; onToggle: (el: string) => void; showComp: boolean; locked: boolean }) {
  const outside = U3.filter((x) => !picked.includes(x));
  const c = V3.circle;
  return (
    <svg viewBox={`0 0 ${V3.w} ${V3.h}`} className="mx-auto block w-full max-w-[520px] select-none" role="img" aria-label="전체집합과 진리집합">
      <path d={boxPath()} fill="rgba(255,255,255,0.02)" />
      {showComp ? <path d={`${boxPath()} ${circleSub()}`} fillRule="evenodd" fill="rgba(251,191,36,0.16)" /> : null}
      <circle cx={c.cx} cy={c.cy} r={c.r} fill="rgba(56,189,248,0.10)" stroke={P_COL} strokeWidth={3} />
      <path d={boxPath()} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth={2.5} />
      <text x={V3.uLabel.x} y={V3.uLabel.y} textAnchor="middle" className="fill-slate-300 font-serif text-[19px] font-bold italic">
        U
      </text>
      <text x={V3.pLabel.x} y={V3.pLabel.y} textAnchor="middle" fill={P_COL} className="font-serif text-[19px] font-bold italic">
        P
      </text>
      {showComp ? (
        <text x={V3.cLabel.x} y={V3.cLabel.y} textAnchor="middle" fill={N_COL} className="font-serif text-[17px] font-bold italic">
          P&#8202;ᶜ
        </text>
      ) : null}
      {U3.map((el) => {
        const inP = picked.includes(el);
        const slot = inP ? V3.inSlots[picked.indexOf(el)] : V3.outSlots[outside.indexOf(el)];
        return (
          <g
            key={el}
            style={{ transform: `translate(${slot.x}px, ${slot.y}px)`, transition: "transform 340ms cubic-bezier(.4,0,.2,1)" }}
            onClick={locked ? undefined : () => onToggle(el)}
            className={locked ? undefined : "cursor-pointer"}
          >
            <circle
              r={V3.chip}
              fill={inP ? "rgba(56,189,248,0.28)" : showComp ? "rgba(251,191,36,0.24)" : "rgba(255,255,255,0.08)"}
              stroke={inP ? P_COL : showComp ? N_COL : "rgba(148,163,184,0.6)"}
              strokeWidth={2.5}
            />
            <text y={5} textAnchor="middle" className="fill-slate-100 text-[14px] font-bold" pointerEvents="none">
              {el}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TruthTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = TRUTHS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎯 진리집합을 만들고 부정을 찾으세요</p>
          <Chips ids={TRUTHS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg bg-black/25 px-3 py-2 text-[13px] font-semibold text-slate-200">
          <i className="font-serif italic">U</i>
          <span>=</span>
          <span className="text-slate-400">{"{"}</span>
          <i className="font-serif italic">x</i>
          <span className="text-slate-400">|</span>
          <span>
            <i className="font-serif italic">x</i>는 10 이하의 자연수
          </span>
          <span className="text-slate-400">{"}"}</span>
          <span className="ml-1 text-slate-500">=</span>
          <Katex expr={listTex(U3)} />
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
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 조건을 모두 뒤집었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            조건 <Katex expr="p" /> 의 진리집합이 <Katex expr="P" /> 이면 <Katex expr="\sim p" /> 의 진리집합은 <b className="text-amber-200">
              <Katex expr="P^{C}" />
            </b>
          </p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <p className="flex items-center justify-center rounded-xl bg-black/25 px-3 py-2 text-[13px] text-slate-300">
              <Katex expr="P \cup P^{C} = U" />
            </p>
            <p className="flex items-center justify-center rounded-xl bg-black/25 px-3 py-2 text-[13px] text-slate-300">
              <Katex expr="P \cap P^{C} = \varnothing" />
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TruthOne({ t, last, onDone, onNext }: { t: TruthTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [pick, setPick] = useState<number | null>(null);
  const [hint, setHint] = useState(false);

  const extra = picked.filter((x) => !t.answer.includes(x));
  const missing = t.answer.filter((x) => !picked.includes(x));
  const setOk = extra.length === 0 && missing.length === 0;
  const step2 = pick !== null && pick === t.negAnswer;
  const ok = setOk && step2;
  const comp = U3.filter((x) => !t.answer.includes(x));

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function toggle(el: string) {
    setPicked((s) => (s.includes(el) ? s.filter((x) => x !== el) : [...s, el]));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border-2 border-sky-400/35 bg-sky-400/[0.07] px-4 py-3">
        <span className="text-[11px] font-bold tracking-widest text-sky-200/80">조건</span>
        <span className="text-lg">
          <CondLine name={t.name} pre={t.condPre} tex={t.condTex} />
        </span>
      </div>

      <div className={"rounded-2xl border-2 p-3 transition " + (setOk ? "border-emerald-400/55 bg-emerald-400/[0.08]" : "border-white/10 bg-slate-900/40")}>
        <p className="mb-1 text-center text-[12px] font-bold text-slate-200">
          {setOk ? "✅ 진리집합 P 를 완성했어요" : "원소를 눌러 조건을 참이 되게 하는 것만 원 안으로 옮기세요"}
        </p>
        <VennChips picked={picked} onToggle={toggle} showComp={step2} locked={ok} />
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-[12px]">
          <span className="rounded-full bg-black/30 px-2.5 py-1 font-bold text-sky-100">
            원 안 {picked.length}개
          </span>
          {setOk ? null : extra.length && missing.length ? (
            <span className="rounded-full bg-violet-400/15 px-2.5 py-1 font-bold text-violet-100">🟡 담지 않은 원소도, 잘못 담은 원소도 있어요</span>
          ) : extra.length ? (
            <span className="rounded-full bg-violet-400/15 px-2.5 py-1 font-bold text-violet-100">🟡 조건을 만족하지 않는 원소가 들어 있어요</span>
          ) : (
            <span className="rounded-full bg-white/8 px-2.5 py-1 font-bold text-slate-300">아직 담지 않은 원소가 있어요</span>
          )}
        </div>
      </div>

      <div className={"rounded-2xl border border-white/10 bg-slate-900/40 p-3 transition " + (setOk ? "" : "pointer-events-none opacity-40")}>
        <p className="text-[12px] font-bold text-slate-200">
          조건 <i className="font-serif italic text-amber-200">{t.name}</i> 의 부정 <span className="font-serif text-amber-200">~</span>
          <i className="font-serif italic text-amber-200">{t.name}</i> 는 어느 것일까요?
        </p>
        <div className="mt-2 space-y-1.5">
          {t.choices.map((h, k) => {
            const on = pick === k;
            const good = step2 && k === t.negAnswer;
            const bad = on && k !== t.negAnswer;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setPick(k)}
                disabled={step2}
                className={
                  "flex w-full items-center gap-2 overflow-x-auto overflow-y-hidden rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                <span className="shrink-0 font-mono text-[13px] text-slate-400">{ABC[k]}</span>
                <span className="whitespace-nowrap">
                  <Sentence pre={h.pre} tex={h.tex} />
                </span>
              </button>
            );
          })}
        </div>
        {pick !== null && !step2 ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {t.choiceWhy[pick]}</p> : null}
      </div>

      {ok ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-3">
          <p className="text-center text-sm font-extrabold text-emerald-100">✅ 부정의 진리집합은 여집합이에요</p>
          <div className="mt-2 space-y-1">
            <p className="flex flex-wrap items-center justify-center gap-2 rounded-lg bg-black/25 px-3 py-1.5 text-[13px]">
              <i className="font-serif italic text-sky-300">{t.name.toUpperCase()}</i>
              <span className="text-slate-400">=</span>
              <Katex expr={listTex(t.answer)} />
            </p>
            <p className="flex flex-wrap items-center justify-center gap-2 rounded-lg bg-black/25 px-3 py-1.5 text-[13px]">
              <span className="text-amber-200">
                <Katex expr={`${t.name.toUpperCase()}^{C}`} />
              </span>
              <span className="text-slate-400">=</span>
              <Katex expr={listTex(comp)} />
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setHint((h) => !h)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          {hint ? "💡 힌트 접기" : "💡 힌트 보기"}
        </button>
        {ok && !last ? <NextBtn onClick={onNext} /> : <span />}
      </div>
      {hint ? <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2.5 text-[12px] leading-6 text-amber-100">💡 {t.tip}</p> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 또는·그리고 뒤집기 (드모르간)
// ══════════════════════════════════════════════════════════════
function circlePath4(c: { cx: number; cy: number; r: number }): string {
  return `M${c.cx - c.r},${c.cy} a${c.r},${c.r} 0 1,0 ${2 * c.r},0 a${c.r},${c.r} 0 1,0 ${-2 * c.r},0 Z`;
}

function Venn2({ painted, color }: { painted: number[]; color: string }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox={`0 0 ${V4.w} ${V4.h}`} className="mx-auto block w-full max-w-[380px] select-none" role="img" aria-label="벤 다이어그램">
      <defs>
        <clipPath id={`${u}inA`}>
          <circle cx={V4.a.cx} cy={V4.a.cy} r={V4.a.r} />
        </clipPath>
        <clipPath id={`${u}inB`}>
          <circle cx={V4.b.cx} cy={V4.b.cy} r={V4.b.r} />
        </clipPath>
        <clipPath id={`${u}outA`}>
          <path d={`M0,0 H${V4.w} V${V4.h} H0 Z ${circlePath4(V4.a)}`} clipRule="evenodd" />
        </clipPath>
        <clipPath id={`${u}outB`}>
          <path d={`M0,0 H${V4.w} V${V4.h} H0 Z ${circlePath4(V4.b)}`} clipRule="evenodd" />
        </clipPath>
      </defs>
      {REGIONS.map((m) => {
        const on = painted.includes(m);
        let node: React.ReactNode = (
          <rect x={V4.box.x} y={V4.box.y} width={V4.box.w} height={V4.box.h} rx={V4.box.r} fill={on ? `${color}55` : "rgba(255,255,255,0.02)"} />
        );
        node = <g clipPath={`url(#${u}${m & 2 ? "in" : "out"}B)`}>{node}</g>;
        node = <g clipPath={`url(#${u}${m & 1 ? "in" : "out"}A)`}>{node}</g>;
        return <g key={m}>{node}</g>;
      })}
      <rect x={V4.box.x} y={V4.box.y} width={V4.box.w} height={V4.box.h} rx={V4.box.r} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth={2.5} />
      <circle cx={V4.a.cx} cy={V4.a.cy} r={V4.a.r} fill="none" stroke={P_COL} strokeWidth={3} />
      <circle cx={V4.b.cx} cy={V4.b.cy} r={V4.b.r} fill="none" stroke="#a78bfa" strokeWidth={3} />
      <text x={V4.ul.x} y={V4.ul.y} textAnchor="middle" className="fill-slate-300 font-serif text-[18px] font-bold italic">
        U
      </text>
      <text x={V4.a.lx} y={V4.a.ly} textAnchor="middle" fill={P_COL} className="font-serif text-[19px] font-bold italic">
        P
      </text>
      <text x={V4.b.lx} y={V4.b.ly} textAnchor="middle" fill="#a78bfa" className="font-serif text-[19px] font-bold italic">
        Q
      </text>
    </svg>
  );
}

/** 조합을 사람 말로 — 「x는 짝수가 아니다 그리고 x는 3의 배수가 아니다」 */
function ComboLine({ t, c, tone }: { t: DeMorganTask; c: Combo; tone: string }) {
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[13px] font-semibold text-slate-100">
      <span>{c.np ? t.p.no : t.p.yes}</span>
      <span className={"rounded-md px-1.5 py-0.5 text-[12px] font-extrabold " + tone}>{CONN_NAME[c.conn]}</span>
      <span>{c.nq ? t.q.no : t.q.yes}</span>
    </span>
  );
}

function DeMorganTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = DEMORGANS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔗 다이얼을 돌려 조건의 부정을 만드세요</p>
          <Chips ids={DEMORGANS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
          두 그림이 <b className="text-white">겹치지도, 빈 조각을 남기지도</b> 않게 만들면 성공이에요. 왼쪽 원이 <span className="font-serif italic text-sky-300">P</span>, 오른쪽
          원이 <span className="font-serif italic text-violet-300">Q</span> 입니다.
        </p>
      </div>

      <DeMorganOne
        key={t.id}
        t={t}
        last={i === DEMORGANS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(DEMORGANS.length - 1, k + 1))}
      />

      {done.length === DEMORGANS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 드모르간의 법칙을 손으로 확인했어요!</p>
          <div className="mt-2 space-y-1.5">
            {[
              ["또는", "그리고"],
              ["그리고", "또는"],
            ].map(([a, b]) => (
              <p key={a} className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-xl bg-black/25 px-3 py-2 text-[13px] font-semibold text-slate-200">
                <span className="font-serif text-amber-200">~</span>
                <span className="text-slate-400">(</span>
                <i className="font-serif italic">p</i>
                <span className="font-extrabold text-sky-200">{a}</span>
                <i className="font-serif italic">q</i>
                <span className="text-slate-400">)</span>
                <span className="text-slate-500">=</span>
                <span className="font-serif text-amber-200">~</span>
                <i className="font-serif italic">p</i>
                <span className="font-extrabold text-amber-200">{b}</span>
                <span className="font-serif text-amber-200">~</span>
                <i className="font-serif italic">q</i>
              </p>
            ))}
          </div>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            ※ 부정하면 <b className="text-white">두 조건이 각각 뒤집히고</b>, <b className="text-white">「또는」과 「그리고」도 서로 바뀐다</b> — 집합에서 배운{" "}
            <Katex expr="(P \cup Q)^{C} = P^{C} \cap Q^{C}" /> 와 똑같은 이야기예요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function DeMorganOne({ t, last, onDone, onNext }: { t: DeMorganTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [c, setC] = useState<Combo>(() => ({ ...t.origin }));
  const [hint, setHint] = useState(false);

  const orig = regionsOf(t.origin);
  const mine = regionsOf(c);
  const ov = overlapRegions(orig, mine);
  const gp = gapRegions(orig, mine);
  const ok = ov.length === 0 && gp.length === 0;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const answer = flipCombo(t.origin);

  function dial(label: string, on: boolean, a: string, b: string, set: (v: boolean) => void) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/25 p-2">
        <p className="mb-1 text-center text-[10px] font-bold tracking-wider text-slate-500">{label}</p>
        <div className="grid gap-1">
          {[
            [false, a],
            [true, b],
          ].map(([v, text]) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => set(v as boolean)}
              disabled={ok}
              className={
                "rounded-lg border-2 px-2 py-1.5 text-[12px] font-bold leading-5 transition disabled:cursor-default " +
                (on === v
                  ? ok
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : "border-amber-400/70 bg-amber-400/18 text-amber-100"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
              }
            >
              {text as string}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-sky-400/35 bg-sky-400/[0.07] p-3">
          <p className="text-center text-[11px] font-bold tracking-widest text-sky-200/80">부정할 조건</p>
          <div className="mt-1 rounded-xl bg-black/25 px-3 py-2 text-center">
            <ComboLine t={t} c={t.origin} tone="bg-sky-400/25 text-sky-100" />
          </div>
          <Venn2 painted={orig} color={P_COL} />
        </div>
        <div className={"rounded-2xl border-2 p-3 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/[0.09]" : ov.length ? "border-rose-400/50 bg-rose-400/[0.06]" : "border-amber-400/35 bg-amber-400/[0.05]")}>
          <p className="text-center text-[11px] font-bold tracking-widest text-amber-200/80">내가 만든 부정</p>
          <div className="mt-1 rounded-xl bg-black/25 px-3 py-2 text-center">
            <ComboLine t={t} c={c} tone="bg-amber-400/25 text-amber-100" />
          </div>
          <Venn2 painted={mine} color={ok ? "#34d399" : N_COL} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {dial("앞의 조건", c.np, t.p.yes, t.p.no, (v) => setC((s) => ({ ...s, np: v })))}
        <div className="rounded-xl border border-white/10 bg-black/25 p-2">
          <p className="mb-1 text-center text-[10px] font-bold tracking-wider text-slate-500">이음말</p>
          <div className="grid gap-1">
            {(["and", "or"] as Conn[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setC((s) => ({ ...s, conn: k }))}
                disabled={ok}
                className={
                  "rounded-lg border-2 px-2 py-1.5 text-[12px] font-bold leading-5 transition disabled:cursor-default " +
                  (c.conn === k
                    ? ok
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : "border-amber-400/70 bg-amber-400/18 text-amber-100"
                    : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
                }
              >
                {CONN_NAME[k]}
              </button>
            ))}
          </div>
        </div>
        {dial("뒤의 조건", c.nq, t.q.yes, t.q.no, (v) => setC((s) => ({ ...s, nq: v })))}
      </div>

      {ok ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-3">
          <p className="text-center text-sm font-extrabold text-emerald-100">✅ 두 그림이 전체집합을 빈틈없이 나누어 가졌어요!</p>
          <p className="mt-1 text-center text-[12px] leading-6 text-emerald-50">
            두 조건이 각각 뒤집히고, <b className="text-white">{CONN_NAME[t.origin.conn]}</b> 가 <b className="text-white">{CONN_NAME[answer.conn]}</b> 로 바뀌었어요.
          </p>
        </div>
      ) : ov.length ? (
        <p className="rounded-xl border-2 border-rose-400/50 bg-rose-400/12 px-3 py-2.5 text-center text-[12px] leading-6 text-rose-100">
          ❌ 두 그림이 겹쳐요 — <b className="text-white">{ov.map((m) => REGION_NAME[m]).join(", ")}</b> 이(가) 양쪽 모두에 칠해져 있어요.
        </p>
      ) : (
        <p className="rounded-xl border-2 border-violet-400/50 bg-violet-400/12 px-3 py-2.5 text-center text-[12px] leading-6 text-violet-100">
          🟡 거의 다 왔어요 — <b className="text-white">{gp.map((m) => REGION_NAME[m]).join(", ")}</b> 이(가) 어느 쪽에도 칠해지지 않았어요.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setHint((h) => !h)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          {hint ? "💡 힌트 접기" : "💡 힌트 보기"}
        </button>
        {ok && !last ? <NextBtn onClick={onNext} /> : <span />}
      </div>
      {hint ? <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2.5 text-[12px] leading-6 text-amber-100">💡 {t.tip}</p> : null}
    </div>
  );
}
