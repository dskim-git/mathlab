"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CHAINS,
  PUZZLES,
  SPLITS,
  SUBSETS,
  VENN,
  condIf,
  condName,
  condThen,
  contra,
  counterOf,
  findCond,
  isSubset,
  placeChips,
  sameNums,
  sameRef,
  shuffled,
  solvePuzzle,
  truthSetOf,
  vennKind,
  type ChainTask,
  type CondRef,
  type Piece,
  type PuzzleTask,
  type SplitTask,
  type Stmt,
  type SubsetTask,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_subset",
    prompt:
      "명제 p → q 가 참인 것과 진리집합 사이에 P ⊂ Q 라는 관계가 왜 성립하는지, 탭②에서 만든 벤 다이어그램을 떠올리며 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: p → q 가 참이라는 말은 조건 p 를 참이 되게 하는 모든 x 에 대해 q 도 참이 된다는 뜻이다. p 를 참이 되게 하는 x 를 모은 것이 P 이고 q 를 참이 되게 하는 x 를 모은 것이 Q 이므로, P 의 모든 원소가 Q 에 들어간다. 그래서 P ⊂ Q 이다.",
  },
  {
    id: "counterexample",
    prompt:
      "명제 p → q 가 거짓임을 보이려면 어떤 x 를 찾으면 되는지, 그 x 가 벤 다이어그램의 어느 자리에 있는지 함께 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: P 에는 들어 있는데 Q 에는 들어 있지 않은 x 를 하나만 찾으면 된다. 벤 다이어그램에서는 P 안이면서 Q 밖인 자리다. 그런 x 가 하나만 있어도 P ⊂ Q 가 무너지므로 명제는 거짓이 된다. 두 원이 겹쳐 있든 Q 가 P 안에 있든 그 자리만 비어 있지 않으면 반례다.",
  },
  {
    id: "syllogism",
    prompt:
      "탭③·④에서 두 명제를 이어 새로운 명제를 얻었어요. 삼단논법이 왜 성립하는지 진리집합으로 설명하고, 기억에 남는 사슬을 하나 들어 보세요.",
    kind: "text",
    placeholder:
      "예: p → q 가 참이면 P ⊂ Q 이고 q → r 가 참이면 Q ⊂ R 이다. P 의 원소는 모두 Q 에 있고 Q 의 원소는 모두 R 에 있으므로 P 의 원소는 모두 R 에 있다. 그래서 P ⊂ R 이고 p → r 도 참이다. 정사각형 → 마름모 → 평행사변형 사슬이 기억에 남는다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "split" | "subset" | "chain" | "puzzle";

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
    <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5">
      {ps.map((p, i) => (
        <PieceText key={i} p={p} />
      ))}
    </span>
  );
}

/** 조건 이름 p / q / r — 문장 속에 섞이므로 KaTeX 대신 HTML 이탤릭으로 */
function Var({ name, tone }: { name: string; tone?: string }) {
  return <i className={"font-serif text-[1.05em] italic " + (tone ?? "text-slate-200")}>{name}</i>;
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

function TFButtons({ value, answer, locked, onPick, labels }: { value: boolean | null; answer: boolean; locked: boolean; onPick: (v: boolean) => void; labels?: [string, string] }) {
  const [yes, no] = labels ?? ["참 ⭕", "거짓 ❌"];
  return (
    <div className="grid grid-cols-2 gap-2">
      {[true, false].map((v) => {
        const on = value === v;
        const good = locked && v === answer;
        const bad = on && v !== answer;
        return (
          <button
            key={String(v)}
            type="button"
            onClick={() => onPick(v)}
            disabled={locked}
            className={
              "rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition disabled:cursor-default " +
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
  );
}

const ABC = ["①", "②", "③", "④"];

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function ConditionalTruthLab() {
  const [tab, setTab] = useState<Tab>("split");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">➡️ 명제 p → q의 참과 거짓</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-sky-200">가정</b>과 <b className="text-amber-200">결론</b>으로 문장을 나누고, 두 진리집합의{" "}
          <b className="text-emerald-200">포함 관계</b> 하나로 참·거짓을 가려 봅시다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "split"} onClick={() => setTab("split")}>
          ① 가정과 결론 ✂️
        </TabButton>
        <TabButton active={tab === "subset"} onClick={() => setTab("subset")}>
          ② 진리집합 비교기 ⭕
        </TabButton>
        <TabButton active={tab === "chain"} onClick={() => setTab("chain")}>
          ③ 삼단논법 사슬 🔗
        </TabButton>
        <TabButton active={tab === "puzzle"} onClick={() => setTab("puzzle")}>
          ④ 추리 퍼즐 🕵️
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "split" ? <SplitTab /> : null}
        {tab === "subset" ? <SubsetTab /> : null}
        {tab === "chain" ? <ChainTab /> : null}
        {tab === "puzzle" ? <PuzzleTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 가정과 결론 나누기
// ══════════════════════════════════════════════════════════════
function SplitTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = SPLITS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✂️ 문장을 가정과 결론으로 잘라 보세요</p>
          <Chips ids={SPLITS.map((s) => s.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
          「<Var name="p" tone="text-sky-200" />이면 <Var name="q" tone="text-amber-200" />이다」를 <b className="text-white">p → q</b> 로 나타내고,{" "}
          <Var name="p" tone="text-sky-200" /> 를 <b className="text-sky-200">가정</b>, <Var name="q" tone="text-amber-200" /> 를 <b className="text-amber-200">결론</b> 이라고 해요.
        </p>
      </div>

      <SplitOne
        key={t.id}
        t={t}
        last={i === SPLITS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(SPLITS.length - 1, k + 1))}
      />

      {done.length === SPLITS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문장을 모두 나눴어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <p className="rounded-xl bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
              「<b className="text-white">…이면</b>」 앞이 <b className="text-sky-200">가정</b>
              <br />뒤가 <b className="text-amber-200">결론</b>
            </p>
            <p className="rounded-xl bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
              가정이 숨어 있는 문장도
              <br />「<b className="text-white">x가 …이면 x는 …이다</b>」로 고쳐 쓸 수 있어요
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SplitOne({ t, last, onDone, onNext }: { t: SplitTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const [cut, setCut] = useState<number | null>(null);
  const [tip, setTip] = useState(false);

  const needRewrite = !!t.raw;
  const step1 = !needRewrite || (pick !== null && pick === t.rewriteAnswer);
  const step2 = step1 && cut !== null && cut === t.cut;

  const doneRef = useRef(false);
  useEffect(() => {
    if (step2 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="space-y-3">
      {/* 1단계 — 조건문 꼴로 고쳐 쓰기 */}
      {needRewrite ? (
        <div className={"rounded-2xl border-2 p-3 transition " + (step1 ? "border-emerald-400/45 bg-emerald-400/[0.08]" : "border-white/10 bg-slate-900/40")}>
          <p className="text-[12px] font-bold text-slate-200">1단계 · 이 문장을 「…이면 …이다」 꼴로 고쳐 쓰면?</p>
          <div className="mt-2 rounded-xl border border-white/12 bg-black/30 px-4 py-4 text-center">
            <p className="text-lg font-bold text-slate-100">{t.raw}</p>
            <p className="mt-1 text-[11px] font-bold text-slate-500">↑ 가정이 겉으로 드러나 있지 않은 문장</p>
          </div>
          <div className="mt-2 space-y-1.5">
            {(t.rewrites ?? []).map((h, k) => {
              const on = pick === k;
              const good = step1 && k === t.rewriteAnswer;
              const bad = on && k !== t.rewriteAnswer;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setPick(k)}
                  disabled={step1}
                  className={
                    "flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-default " +
                    (good
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : bad
                        ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  <span className="shrink-0 font-mono text-[13px] text-slate-400">{ABC[k]}</span>
                  <span>{h}</span>
                </button>
              );
            })}
          </div>
          {pick !== null && !step1 ? (
            <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {(t.rewriteWhy ?? [])[pick]}</p>
          ) : null}
        </div>
      ) : null}

      {/* 가위 — 토큰 사이를 자른다 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (step1 ? "border-white/10 bg-slate-900/40" : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
        <p className="text-[12px] font-bold text-slate-200">
          {needRewrite ? "2단계" : "1단계"} · <b className="text-cyan-200">✂️ 가위</b> 를 눌러 가정과 결론을 나누세요.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-y-2 rounded-xl border border-white/12 bg-black/30 px-3 py-5">
          {t.tokens.map((tok, k) => (
            <span key={k} className="inline-flex items-center">
              <span
                className={
                  "rounded-lg px-1.5 py-1 text-lg font-bold transition " +
                  (step2 ? (k < t.cut ? "bg-sky-400/20 text-sky-100" : "bg-amber-400/20 text-amber-100") : "text-slate-100")
                }
              >
                <PieceText p={tok} />
              </span>
              {k < t.tokens.length - 1 ? (
                step2 ? (
                  k + 1 === t.cut ? (
                    <span className="mx-1 text-lg text-emerald-300">✂️</span>
                  ) : (
                    <span className="mx-1 w-1" />
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setCut(k + 1)}
                    className={
                      "mx-0.5 rounded-md border px-1 py-0.5 text-[11px] leading-none transition " +
                      (cut === k + 1 ? "border-rose-400/70 bg-rose-400/20" : "border-white/15 bg-white/5 text-slate-400 hover:border-cyan-400/60 hover:bg-cyan-400/20")
                    }
                    aria-label={`${k + 1}번째 자리에서 자르기`}
                  >
                    ✂️
                  </button>
                )
              ) : null}
            </span>
          ))}
        </div>
        {cut !== null && !step2 && step1 ? (
          <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ 여기가 아니에요. 「…이면」이 끝나는 자리를 찾아보세요.</p>
        ) : null}
        {!step2 && step1 ? (
          <div className="mt-2">
            <TipBox text={t.tip} open={tip} onOpen={() => setTip(true)} />
          </div>
        ) : null}
      </div>

      {/* 결과 */}
      {step2 ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-sky-400/45 bg-sky-400/10 px-3 py-3 text-center">
              <p className="text-[11px] font-bold tracking-widest text-sky-200/80">가정</p>
              <p className="mt-1 text-base font-bold leading-7 text-slate-100">
                <Var name="p" tone="text-sky-200" />
                <span className="mx-1.5 text-slate-500">:</span>
                <PieceLine ps={t.pText} />
              </p>
            </div>
            <div className="rounded-xl border-2 border-amber-400/45 bg-amber-400/10 px-3 py-3 text-center">
              <p className="text-[11px] font-bold tracking-widest text-amber-200/80">결론</p>
              <p className="mt-1 text-base font-bold leading-7 text-slate-100">
                <Var name="q" tone="text-amber-200" />
                <span className="mx-1.5 text-slate-500">:</span>
                <PieceLine ps={t.qText} />
              </p>
            </div>
          </div>
          <p className="rounded-xl bg-black/25 px-3 py-3 text-center text-xl font-extrabold text-slate-100">
            <Var name="p" tone="text-sky-200" /> <span className="text-emerald-300">→</span> <Var name="q" tone="text-amber-200" />
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">✅ {t.why}</p>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 진리집합 비교기
// ══════════════════════════════════════════════════════════════
function VennBoard({ U, P, Q, counters, show }: { U: number[]; P: number[]; Q: number[]; counters: number[]; show: boolean }) {
  const kind = vennKind(P, Q);
  const chips = show ? placeChips(U, P, Q) : [];
  const n = VENN.nested;
  const c = VENN.cross;
  const pColor = "#38bdf8";
  const qColor = "#fbbf24";

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${VENN.w} ${VENN.h}`} className="mx-auto block w-full max-w-[480px] select-none" role="img" aria-label="두 진리집합의 벤 다이어그램">
        <rect x={VENN.box.x} y={VENN.box.y} width={VENN.box.w} height={VENN.box.h} rx={VENN.box.r} fill="rgba(255,255,255,0.03)" stroke="rgba(148,163,184,0.5)" strokeWidth={2} />
        <text x={VENN.uLabel.x} y={VENN.uLabel.y} textAnchor="middle" className="fill-slate-400 font-serif text-[17px] font-bold italic">
          U
        </text>

        {!show ? (
          <text x={VENN.w / 2} y={VENN.h / 2} textAnchor="middle" className="fill-slate-600 text-[15px] font-bold">
            두 진리집합을 모두 만들면 그림이 나타나요
          </text>
        ) : kind === "cross" ? (
          <>
            <circle cx={c.a.cx} cy={c.a.cy} r={c.a.r} fill={`${pColor}14`} stroke={pColor} strokeWidth={3} />
            <circle cx={c.b.cx} cy={c.b.cy} r={c.b.r} fill={`${qColor}14`} stroke={qColor} strokeWidth={3} />
            <text x={c.a.lx} y={c.a.ly} textAnchor="middle" fill={pColor} className="font-serif text-[19px] font-bold italic">
              P
            </text>
            <text x={c.b.lx} y={c.b.ly} textAnchor="middle" fill={qColor} className="font-serif text-[19px] font-bold italic">
              Q
            </text>
          </>
        ) : (
          <>
            <circle
              cx={n.outer.cx}
              cy={n.outer.cy}
              r={n.outer.r}
              fill={kind === "pInQ" ? `${qColor}12` : `${pColor}12`}
              stroke={kind === "pInQ" ? qColor : pColor}
              strokeWidth={3}
            />
            <circle
              cx={n.inner.cx}
              cy={n.inner.cy}
              r={n.inner.r}
              fill={kind === "pInQ" ? `${pColor}20` : `${qColor}20`}
              stroke={kind === "pInQ" ? pColor : qColor}
              strokeWidth={3}
            />
            <text
              x={n.outer.lx}
              y={n.outer.ly}
              textAnchor="middle"
              fill={kind === "pInQ" ? qColor : pColor}
              className="font-serif text-[19px] font-bold italic"
            >
              {kind === "pInQ" ? "Q" : "P"}
            </text>
            <text
              x={n.inner.lx}
              y={n.inner.ly}
              textAnchor="middle"
              fill={kind === "pInQ" ? pColor : qColor}
              className="font-serif text-[19px] font-bold italic"
            >
              {kind === "pInQ" ? "P" : "Q"}
            </text>
          </>
        )}

        {chips.map((ch) => {
          const bad = counters.includes(ch.n);
          return (
            <g key={ch.n}>
              {bad ? <circle cx={ch.x} cy={ch.y} r={VENN.chipR + 5} fill="none" stroke="#fb7185" strokeWidth={2.5} strokeDasharray="4 3" /> : null}
              <circle cx={ch.x} cy={ch.y} r={VENN.chipR} fill={bad ? "#fb7185" : "rgba(226,232,240,0.92)"} stroke="#0f172a" strokeWidth={1.5} />
              <text x={ch.x} y={ch.y + 4} textAnchor="middle" className="font-mono text-[11px] font-bold" fill="#0f172a">
                {ch.n}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function NumChip({ n, on, locked, onClick }: { n: number; on: boolean; locked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      className={
        "h-10 w-10 rounded-xl border-2 font-mono text-base font-bold transition disabled:cursor-default " +
        (on ? "border-emerald-400/70 bg-emerald-400/25 text-emerald-50" : "border-white/12 bg-white/[0.04] text-slate-400 hover:bg-white/10")
      }
    >
      {n}
    </button>
  );
}

function SubsetTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = SUBSETS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">⭕ 두 진리집합을 만들고 포함 관계로 판정해요</p>
          <Chips ids={SUBSETS.map((s) => s.id)} cur={i} done={done} onPick={setI} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <b className="text-white">p → q 가 참</b> <span className="mx-1 text-slate-500">⟺</span> <Katex expr="P \subset Q" />
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <b className="text-white">p → q 가 거짓</b> <span className="mx-1 text-slate-500">⟺</span> <Katex expr="P \not\subset Q" />
          </p>
        </div>
      </div>

      <SubsetOne
        key={t.id}
        t={t}
        last={i === SUBSETS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(SUBSETS.length - 1, k + 1))}
      />

      {done.length === SUBSETS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 명제를 모두 판정했어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
            반례는 <b className="text-rose-200">P 안에 있으면서 Q 밖에 있는 원소</b> 예요. 두 원이 겹쳐 있든, Q 가 P 안에 들어 있든, 그 자리에 원소가 하나라도 있으면 명제는 거짓이랍니다.
          </p>
          <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
            ※ 명제 p → q 가 참임이 밝혀지면 <b className="text-white">p ⇒ q</b> 로 나타내요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** 진리집합 만들기 상자 — 칩을 눌러 고르고 확인을 누른다. */
function TruthSetBox({
  t,
  which,
  sel,
  locked,
  open,
  tried,
  want,
  tipOpen,
  onToggle,
  onCheck,
  onTip,
}: {
  t: SubsetTask;
  which: "p" | "q";
  sel: number[];
  locked: boolean;
  open: boolean;
  tried: boolean;
  want: number[];
  tipOpen: boolean;
  onToggle: (n: number) => void;
  onCheck: () => void;
  onTip: () => void;
}) {
  const isP = which === "p";
  const wrong = tried && !locked ? t.U.filter((n) => sel.includes(n) !== want.includes(n)).length : 0;
  return (
      <div
        className={
          "rounded-2xl border-2 p-3 transition " +
          (locked
            ? isP
              ? "border-sky-400/55 bg-sky-400/[0.08]"
              : "border-amber-400/55 bg-amber-400/[0.08]"
            : open
              ? "border-white/10 bg-slate-900/40"
              : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")
        }
      >
        <p className="text-[12px] font-bold text-slate-200">
          {isP ? "1단계" : "2단계"} · 조건 <Var name={isP ? "p" : "q"} tone={isP ? "text-sky-200" : "text-amber-200"} /> 의 진리집합{" "}
          <Katex expr={isP ? "P" : "Q"} /> 를 만드세요
        </p>
        <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-center text-[13px] font-bold leading-7 text-slate-100">
          <Var name={isP ? "p" : "q"} tone={isP ? "text-sky-200" : "text-amber-200"} />
          <span className="mx-1.5 text-slate-500">:</span>
          <PieceText p={(isP ? t.p : t.q).cond} />
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {t.U.map((n) => (
            <NumChip key={n} n={n} on={sel.includes(n)} locked={locked} onClick={() => onToggle(n)} />
          ))}
        </div>
        {locked ? (
          <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-center font-mono text-[12px] font-bold leading-6 text-emerald-100">
            ✅ {isP ? "P" : "Q"} = {"{"} {want.join(", ")} {"}"}
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <TipBox text={isP ? t.tipP : t.tipQ} open={tipOpen} onOpen={onTip} />
            <button
              type="button"
              onClick={onCheck}
              className="rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/25"
            >
              확인
            </button>
          </div>
        )}
        {wrong > 0 ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {wrong}개가 잘못 골라졌어요. 다시 살펴볼까요?</p> : null}
      </div>
    );
}

function SubsetOne({ t, last, onDone, onNext }: { t: SubsetTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [selP, setSelP] = useState<number[]>([]);
  const [selQ, setSelQ] = useState<number[]>([]);
  const [okP, setOkP] = useState(false);
  const [okQ, setOkQ] = useState(false);
  const [tryP, setTryP] = useState(false);
  const [tryQ, setTryQ] = useState(false);
  const [sub, setSub] = useState<boolean | null>(null);
  const [truth, setTruth] = useState<boolean | null>(null);
  const [tipP, setTipP] = useState(false);
  const [tipQ, setTipQ] = useState(false);

  const P = truthSetOf(t, "p");
  const Q = truthSetOf(t, "q");
  const wantSub = isSubset(P, Q);
  const counters = counterOf(P, Q);

  const step2 = okP && okQ;
  const step3 = step2 && sub !== null && sub === wantSub;
  const step4 = step3 && truth !== null && truth === wantSub;

  const doneRef = useRef(false);
  useEffect(() => {
    if (step4 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function toggle(which: "p" | "q", n: number) {
    if (which === "p") {
      if (okP) return;
      setTryP(false);
      setSelP((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
    } else {
      if (okQ) return;
      setTryQ(false);
      setSelQ((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
    }
  }



  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <TruthSetBox
            t={t}
            which="p"
            sel={selP}
            locked={okP}
            open
            tried={tryP}
            want={P}
            tipOpen={tipP}
            onToggle={(n) => toggle("p", n)}
            onCheck={() => (sameNums(selP, P) ? setOkP(true) : setTryP(true))}
            onTip={() => setTipP(true)}
          />
          <TruthSetBox
            t={t}
            which="q"
            sel={selQ}
            locked={okQ}
            open={okP}
            tried={tryQ}
            want={Q}
            tipOpen={tipQ}
            onToggle={(n) => toggle("q", n)}
            onCheck={() => (sameNums(selQ, Q) ? setOkQ(true) : setTryQ(true))}
            onTip={() => setTipQ(true)}
          />
        </div>

        <div className="space-y-3">
          <VennBoard U={t.U} P={P} Q={Q} counters={step3 ? counters : []} show={step2} />

          <div className="grid gap-2 sm:grid-cols-2">
            <div className={"rounded-2xl border-2 p-3 transition " + (step2 ? "border-white/10 bg-slate-900/40" : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
              <p className="text-center text-[12px] font-bold text-slate-200">
                3단계 · <Katex expr="P \subset Q" /> 인가요?
              </p>
              <div className="mt-2">
                <TFButtons value={sub} answer={wantSub} locked={step3} onPick={setSub} labels={["맞아요 ⭕", "아니에요 ❌"]} />
              </div>
            </div>
            <div className={"rounded-2xl border-2 p-3 transition " + (step3 ? "border-white/10 bg-slate-900/40" : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
              <p className="text-center text-[12px] font-bold text-slate-200">
                4단계 · 그러면 <b className="text-white">p → q</b> 는?
              </p>
              <div className="mt-2">
                <TFButtons value={truth} answer={wantSub} locked={step4} onPick={setTruth} />
              </div>
            </div>
          </div>
          {sub !== null && !step3 && step2 ? (
            <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
              ❌ 그림에서 <Katex expr="P" /> 안에 있으면서 <Katex expr="Q" /> 밖에 있는 원소가 있는지 살펴보세요.
            </p>
          ) : null}
          {truth !== null && !step4 && step3 ? (
            <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
              ❌ <Katex expr="P \subset Q" /> 와 <b className="text-white">p → q 가 참</b> 은 같은 말이에요.
            </p>
          ) : null}
        </div>
      </div>

      {step4 ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <p className="text-center text-lg font-extrabold leading-8 text-slate-100">
            <Var name="p" tone="text-sky-200" /> <span className="text-emerald-300">→</span> <Var name="q" tone="text-amber-200" /> 는{" "}
            <b className={wantSub ? "text-emerald-200" : "text-rose-200"}>{wantSub ? "참" : "거짓"}</b>
            <span className="ml-2 rounded-lg bg-black/30 px-2 py-1 align-middle text-[13px] font-bold text-slate-300">
              <Katex expr={wantSub ? "P \\subset Q" : "P \\not\\subset Q"} />
            </span>
          </p>
          {counters.length > 0 ? (
            <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-center text-[12px] leading-6 text-rose-100">
              🚨 반례 <b className="font-mono text-base">{counters.join(", ")}</b> — <Katex expr="P" /> 안에 있으면서 <Katex expr="Q" /> 밖에 있어요 (그림에서 붉은 원소)
            </p>
          ) : (
            <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-center text-[12px] leading-6 text-emerald-100">
              ✨ 반례가 하나도 없어요. <Katex expr="P" /> 의 원소가 모두 <Katex expr="Q" /> 안에 들어 있네요.
            </p>
          )}
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">📎 {t.why}</p>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 삼단논법 사슬
// ══════════════════════════════════════════════════════════════
const RING_TONE = [
  { stroke: "#34d399", fill: "rgba(52,211,153,0.16)", text: "text-emerald-200", chip: "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" },
  { stroke: "#38bdf8", fill: "rgba(56,189,248,0.13)", text: "text-sky-200", chip: "border-sky-400/60 bg-sky-400/20 text-sky-100" },
  { stroke: "#a78bfa", fill: "rgba(167,139,250,0.11)", text: "text-violet-200", chip: "border-violet-400/60 bg-violet-400/20 text-violet-100" },
  { stroke: "#fbbf24", fill: "rgba(251,191,36,0.09)", text: "text-amber-200", chip: "border-amber-400/60 bg-amber-400/20 text-amber-100" },
];

function RingBoard({ t, placed }: { t: ChainTask; placed: number }) {
  const n = t.rings.length;
  const cx = 240;
  const cy = 158;
  const RX = 214;
  const RY = 124;
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox="0 0 480 300" className="mx-auto block w-full max-w-[480px] select-none" role="img" aria-label="진리집합 포함 관계">
        {t.rings
          .map((r, i) => ({ r, i }))
          .reverse()
          .map(({ r, i }) => {
            const s = (i + 1) / n;
            const on = i < placed;
            const tone = RING_TONE[i % RING_TONE.length];
            return (
              <g key={r.id} style={{ opacity: on ? 1 : 0.12, transition: "opacity 380ms ease" }}>
                <ellipse cx={cx} cy={cy} rx={RX * s} ry={RY * s} fill={tone.fill} stroke={tone.stroke} strokeWidth={3} strokeDasharray={on ? undefined : "6 6"} />
                <text x={cx} y={cy - RY * s + 20} textAnchor="middle" fill={tone.stroke} className="text-[15px] font-bold">
                  {on ? r.label : "?"}
                </text>
              </g>
            );
          })}
        {placed >= 2 ? (
          <g style={{ transition: "opacity 380ms ease" }}>
            <text x={cx} y={cy + 34} textAnchor="middle" className="fill-slate-400 text-[12px] font-bold">
              안쪽 ⊂ 바깥쪽
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

function ChainTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = CHAINS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔗 좁은 것부터 눌러 진리집합을 겹겹이 쌓아 보세요</p>
          <Chips ids={CHAINS.map((c) => c.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
          <b className="text-cyan-200">삼단논법</b> · <b className="text-white">p → q</b> 와 <b className="text-white">q → r</b> 가 모두 참이면{" "}
          <b className="text-white">p → r</b> 도 참 <span className="mx-1 text-slate-500">—</span> <Katex expr="P \subset Q" /> 이고 <Katex expr="Q \subset R" /> 이면{" "}
          <Katex expr="P \subset R" /> 이니까요.
        </p>
      </div>

      <ChainOne
        key={t.id}
        t={t}
        last={i === CHAINS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(CHAINS.length - 1, k + 1))}
      />

      {done.length === CHAINS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 개의 사슬을 모두 완성했어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
            포함 관계는 <b className="text-white">안에서 바깥으로만</b> 이어져요. 거꾸로 가는 명제는 거의 언제나 반례가 생깁니다. 삼단논법은 이 화살표를 여러 번 이어 붙이는 것이랍니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ChainOne({ t, last, onDone, onNext }: { t: ChainTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [placed, setPlaced] = useState(0);
  const [msg, setMsg] = useState("");
  const [quiz, setQuiz] = useState<(boolean | null)[]>(() => t.quiz.map(() => null));

  const built = placed === t.rings.length;
  const quizOk = t.quiz.every((q, k) => quiz[k] !== null && quiz[k] === q.ok);
  const label = (id: string) => t.rings.find((r) => r.id === id)?.label ?? id;

  const doneRef = useRef(false);
  useEffect(() => {
    if (built && quizOk && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function tap(idx: number) {
    if (built) return;
    if (idx === placed) {
      setPlaced(placed + 1);
      setMsg("");
    } else if (idx < placed) {
      setMsg("이미 놓은 카드예요.");
    } else {
      setMsg(`아직이에요. ${placed === 0 ? "가장 좁은" : "지금 놓인 것보다 한 단계 넓은"} 것을 찾아보세요.`);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.08] to-sky-500/[0.03] px-4 py-3 text-center">
        <p className="text-2xl">{t.emoji}</p>
        <p className="mt-0.5 text-base font-extrabold text-cyan-100">{t.theme}</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[12px] font-bold text-slate-200">
              1단계 · <b className="text-emerald-200">가장 좁은 것</b>부터 차례로 누르세요 ({placed} / {t.rings.length})
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {t.scramble.map((idx) => {
                const r = t.rings[idx];
                const on = idx < placed;
                const tone = RING_TONE[idx % RING_TONE.length];
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => tap(idx)}
                    disabled={on}
                    className={
                      "rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition disabled:cursor-default " +
                      (on ? tone.chip : "border-white/12 bg-white/[0.04] text-slate-300 hover:bg-white/10")
                    }
                  >
                    {on ? `${idx + 1}. ` : ""}
                    {r.label}
                  </button>
                );
              })}
            </div>
            {msg && !built ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-center text-[12px] leading-6 text-rose-100">❌ {msg}</p> : null}
            {built ? (
              <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-center text-[12px] font-bold leading-6 text-emerald-100">
                ✅ {t.rings.map((r) => r.label).join(" ⊂ ")}
              </p>
            ) : null}
          </div>

          {built ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-[12px] font-bold text-slate-200">2단계 · 이 사슬에서 따라 나오는 명제일까요?</p>
              <div className="mt-2 space-y-1.5">
                {t.quiz.map((q, k) => {
                  const picked = quiz[k];
                  const settled = picked !== null && picked === q.ok;
                  return (
                    <div
                      key={k}
                      className={
                        "rounded-xl border-2 px-3 py-2.5 transition " +
                        (settled ? "border-emerald-400/55 bg-emerald-400/10" : picked !== null ? "border-rose-400/55 bg-rose-400/10" : "border-white/10 bg-white/[0.03]")
                      }
                    >
                      <p className="text-center text-[13px] font-bold leading-7 text-slate-100">
                        <span className="text-sky-200">{label(q.from)}</span>이면 <span className="text-amber-200">{label(q.to)}</span>이다.
                      </p>
                      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                        {[true, false].map((v) => {
                          const on = picked === v;
                          const good = settled && v === q.ok;
                          const bad = on && v !== q.ok;
                          return (
                            <button
                              key={String(v)}
                              type="button"
                              onClick={() => setQuiz((s) => s.map((x, j) => (j === k ? v : x)))}
                              disabled={settled}
                              className={
                                "rounded-lg border-2 px-2 py-1.5 text-[13px] font-bold transition disabled:cursor-default " +
                                (good
                                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                                  : bad
                                    ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                              }
                            >
                              {v ? "참 ⭕" : "거짓 ❌"}
                            </button>
                          );
                        })}
                      </div>
                      {settled ? <p className="mt-1.5 text-[12px] leading-6 text-emerald-100">✅ {q.why}</p> : null}
                      {picked !== null && !settled ? <p className="mt-1.5 text-[12px] leading-6 text-rose-100">❌ 그림에서 화살표 방향을 다시 살펴보세요.</p> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <RingBoard t={t} placed={placed} />
          {built ? (
            <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
              <p className="text-center text-[12px] font-bold text-emerald-100">🔗 삼단논법으로 얻은 명제</p>
              <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[13px] leading-7 text-slate-100">
                {t.rings.slice(0, -1).map((r, k) => (
                  <span key={r.id}>
                    <span className="text-slate-300">{r.label}</span>
                    <span className="mx-1 text-emerald-300">→</span>
                    {k === t.rings.length - 2 ? <span className="text-slate-300">{t.rings[t.rings.length - 1].label}</span> : null}
                  </span>
                ))}
              </p>
              <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2.5 text-center text-base font-extrabold leading-7 text-slate-100">
                <span className="text-sky-200">{t.rings[0].label}</span>이면 <span className="text-amber-200">{t.rings[t.rings.length - 1].label}</span>이다.
              </p>
              <p className="mt-1.5 text-center text-[11px] leading-5 text-slate-400">{t.note}</p>
            </div>
          ) : null}
        </div>
      </div>

      {built && quizOk && !last ? <NextBtn onClick={onNext} /> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 추리 퍼즐
// ══════════════════════════════════════════════════════════════
function CondBadge({ t, r, tone }: { t: PuzzleTask; r: CondRef; tone: "start" | "mid" | "goal" }) {
  const c = findCond(t, r.id);
  const cls =
    tone === "start"
      ? "border-sky-400/60 bg-sky-400/15 text-sky-100"
      : tone === "goal"
        ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
        : "border-white/15 bg-white/[0.06] text-slate-200";
  return <span className={"inline-block rounded-xl border-2 px-2.5 py-1.5 text-center text-[12px] font-bold leading-5 " + cls}>{condName(c, r.neg)}</span>;
}

function StmtLine({ t, s, flip }: { t: PuzzleTask; s: Stmt; flip?: boolean }) {
  const st = flip ? contra(s) : s;
  const cf = findCond(t, st.from.id);
  const ct = findCond(t, st.to.id);
  return (
    <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5 leading-7">
      <b className="text-sky-200">{condIf(cf, st.from.neg)}</b>
      <b className="text-amber-200">{condThen(ct, st.to.neg)}.</b>
    </span>
  );
}

function PuzzleTab() {
  const [order, setOrder] = useState<number[]>(() => PUZZLES.map((_, i) => i));
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [why, setWhy] = useState(false);
  const deck = order.map((k) => PUZZLES[k]);
  const t = deck[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🕵️ 참인 명제를 이어 붙여 목표 명제를 증명하세요</p>
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
        <button
          type="button"
          onClick={() => setWhy((v) => !v)}
          className="mt-2 w-full rounded-lg border border-violet-400/40 bg-violet-400/10 px-3 py-1.5 text-[11px] font-bold text-violet-100 transition hover:bg-violet-400/20"
        >
          {why ? "▲ 접기" : "▼ 카드를 「뒤집어도」 되는 이유가 궁금하다면"}
        </button>
        {why ? <ContraWhy /> : null}
      </div>

      <PuzzleOne
        key={t.id}
        t={t}
        last={i === deck.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(deck.length - 1, k + 1))}
      />

      {done.length === PUZZLES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 퍼즐을 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
            앞 명제의 결론과 뒤 명제의 가정이 맞물리면 사슬이 이어져요(<b className="text-white">삼단논법</b>). 맞물리지 않을 때는 카드를 <b className="text-violet-200">뒤집어</b> 보세요 —
            이 뒤집기의 이름은 다음 시간에 배울 <b className="text-white">대우</b> 랍니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** 뒤집기(대우)가 왜 성립하는지 — 진리집합 그림 */
function ContraWhy() {
  return (
    <div className="mt-2 rounded-xl border border-violet-400/25 bg-violet-400/[0.06] p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/70">
          <svg viewBox="0 0 260 190" className="mx-auto block w-full max-w-[260px] select-none" role="img" aria-label="P가 Q 안에 있는 그림">
            <rect x={6} y={8} width={248} height={174} rx={14} fill="rgba(255,255,255,0.03)" stroke="rgba(148,163,184,0.5)" strokeWidth={2} />
            <text x={22} y={26} textAnchor="middle" className="fill-slate-400 font-serif text-[13px] font-bold italic">
              U
            </text>
            <circle cx={126} cy={98} r={74} fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth={2.5} />
            <circle cx={116} cy={106} r={40} fill="rgba(56,189,248,0.22)" stroke="#38bdf8" strokeWidth={2.5} />
            <text x={126} y={44} textAnchor="middle" fill="#fbbf24" className="font-serif text-[15px] font-bold italic">
              Q
            </text>
            <text x={116} y={112} textAnchor="middle" fill="#38bdf8" className="font-serif text-[15px] font-bold italic">
              P
            </text>
          </svg>
          <p className="px-2 pb-2 text-center text-[11px] font-bold text-slate-300">
            <Katex expr="P \subset Q" /> · p → q 가 참
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/70">
          <svg viewBox="0 0 260 190" className="mx-auto block w-full max-w-[260px] select-none" role="img" aria-label="Q 밖이 P 밖에 들어가는 그림">
            <defs>
              <pattern id="ctw-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="7" height="7" fill="rgba(167,139,250,0.10)" />
                <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(167,139,250,0.55)" strokeWidth="2.5" />
              </pattern>
              <mask id="ctw-mask">
                <rect x={6} y={8} width={248} height={174} rx={14} fill="white" />
                <circle cx={126} cy={98} r={74} fill="black" />
              </mask>
            </defs>
            <rect x={6} y={8} width={248} height={174} rx={14} fill="url(#ctw-hatch)" mask="url(#ctw-mask)" />
            <rect x={6} y={8} width={248} height={174} rx={14} fill="none" stroke="rgba(148,163,184,0.5)" strokeWidth={2} />
            <circle cx={126} cy={98} r={74} fill="none" stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="5 4" />
            <circle cx={116} cy={106} r={40} fill="none" stroke="#38bdf8" strokeWidth={2.5} strokeDasharray="5 4" />
            <text x={40} y={168} textAnchor="middle" fill="#a78bfa" className="font-serif text-[13px] font-bold italic">
              Qᶜ
            </text>
          </svg>
          <p className="px-2 pb-2 text-center text-[11px] font-bold text-slate-300">
            빗금친 <Katex expr="Q^c" /> 는 <Katex expr="P^c" /> 안에 · ~q → ~p 도 참
          </p>
        </div>
      </div>
      <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
        작은 원 <Katex expr="P" /> 가 큰 원 <Katex expr="Q" /> 안에 있으면, 큰 원 <b className="text-white">바깥</b>은 자연히 작은 원 <b className="text-white">바깥</b>이에요. 그래서{" "}
        <Katex expr="P \subset Q" /> 와 <Katex expr="Q^c \subset P^c" /> 는 같은 말이고, 카드를 뒤집어도 여전히 참이랍니다.
      </p>
    </div>
  );
}

type Move = { card: number; flip: boolean };

function PuzzleOne({ t, last, onDone, onNext }: { t: PuzzleTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [moves, setMoves] = useState<Move[]>([]);
  const [flips, setFlips] = useState<boolean[]>(() => t.cards.map(() => false));
  const [msg, setMsg] = useState("");
  const [tip, setTip] = useState(false);
  const [reveal, setReveal] = useState(false);

  const need = t.cards.length;
  // 현재까지 도달한 조건
  let at: CondRef = t.goal.from;
  for (const m of moves) {
    const s = m.flip ? contra(t.cards[m.card]) : t.cards[m.card];
    at = s.to;
  }
  const solved = moves.length === need && sameRef(at, t.goal.to);
  const used = (k: number) => moves.some((m) => m.card === k);

  const doneRef = useRef(false);
  useEffect(() => {
    if (solved && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function play(k: number) {
    if (solved || used(k) || moves.length >= need) return;
    const flip = flips[k];
    const s = flip ? contra(t.cards[k]) : t.cards[k];
    if (!sameRef(s.from, at)) {
      const cf = findCond(t, s.from.id);
      const ca = findCond(t, at.id);
      setMsg(`이 카드는 「${condName(cf, s.from.neg)}」에서 출발하는데, 지금 서 있는 자리는 「${condName(ca, at.neg)}」예요. 카드를 뒤집어 보거나 다른 카드를 써 보세요.`);
      return;
    }
    setMsg("");
    setMoves((m) => [...m, { card: k, flip }]);
  }

  function undo() {
    setMoves((m) => m.slice(0, -1));
    setMsg("");
    setReveal(false);
  }
  function reset() {
    setMoves([]);
    setFlips(t.cards.map(() => false));
    setMsg("");
    setReveal(false);
  }

  const sol = solvePuzzle(t)[0] ?? [];

  return (
    <div className="space-y-3">
      {/* 목표 */}
      <div className="rounded-2xl border-2 border-emerald-400/35 bg-gradient-to-br from-emerald-500/[0.10] to-teal-500/[0.04] px-4 py-3 text-center">
        <p className="text-2xl">{t.emoji}</p>
        <p className="mt-0.5 text-[11px] font-bold tracking-widest text-emerald-200/80">{t.title} · 이 명제가 참임을 보이세요</p>
        <p className="mt-1.5 text-lg font-bold text-slate-100">
          <StmtLine t={t} s={t.goal} />
        </p>
      </div>

      {/* 사슬 트랙 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (solved ? "border-emerald-400/55 bg-emerald-400/10" : "border-white/10 bg-slate-900/40")}>
        <p className="text-[12px] font-bold text-slate-200">🔗 사슬 — 출발 조건에서 목표 결론까지 이어 보세요</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          <CondBadge t={t} r={t.goal.from} tone="start" />
          {Array.from({ length: need }, (_, k) => {
            const m = moves[k];
            const s = m ? (m.flip ? contra(t.cards[m.card]) : t.cards[m.card]) : null;
            const isGoal = k === need - 1;
            return (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className="text-lg text-slate-500">→</span>
                <span
                  className={
                    "inline-flex min-w-[86px] items-center justify-center rounded-xl border-2 border-dashed px-2 py-1.5 text-[11px] font-bold " +
                    (s ? "border-violet-400/60 bg-violet-400/15 text-violet-100" : "border-white/15 bg-white/[0.03] text-slate-600")
                  }
                >
                  {s ? `카드 ${"AB"[m.card] ?? m.card + 1}${m.flip ? " 뒤집기" : ""}` : `${k + 1}번째`}
                </span>
                <span className="text-lg text-slate-500">→</span>
                {s ? <CondBadge t={t} r={s.to} tone={isGoal && sameRef(s.to, t.goal.to) ? "goal" : "mid"} /> : <CondBadge t={t} r={t.goal.to} tone="mid" />}
              </span>
            );
          })}
        </div>
        {moves.length > 0 && !solved ? (
          <p className="mt-2 text-center text-[12px] font-bold text-slate-300">
            지금 서 있는 자리 · <CondBadge t={t} r={at} tone="mid" />
          </p>
        ) : null}
        {solved ? (
          <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-center text-[12px] font-bold leading-6 text-emerald-100">✅ 목표 결론에 닿았어요! 명제가 참임을 보였습니다.</p>
        ) : null}
      </div>

      {/* 카드 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-[12px] font-bold text-slate-200">🗂️ 참이라고 주어진 명제 — 필요하면 뒤집어 쓰세요</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {t.cards.map((card, k) => {
            const isUsed = used(k);
            return (
              <div
                key={card.key}
                className={"rounded-xl border-2 p-2.5 transition " + (isUsed ? "border-emerald-400/45 bg-emerald-400/10 opacity-60" : "border-white/12 bg-white/[0.04]")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-black/30 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-300">카드 {"AB"[k] ?? k + 1}</span>
                  <button
                    type="button"
                    onClick={() => setFlips((f) => f.map((v, j) => (j === k ? !v : v)))}
                    disabled={isUsed || solved}
                    className={
                      "rounded-lg border-2 px-2 py-1 text-[11px] font-bold transition disabled:cursor-default " +
                      (flips[k] ? "border-violet-400/70 bg-violet-400/20 text-violet-100" : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10")
                    }
                  >
                    🔄 {flips[k] ? "뒤집은 상태" : "뒤집기"}
                  </button>
                </div>
                <p className="mt-1.5 min-h-[3.5rem] text-center text-[13px] font-bold text-slate-100">
                  <StmtLine t={t} s={card} flip={flips[k]} />
                </p>
                <button
                  type="button"
                  onClick={() => play(k)}
                  disabled={isUsed || solved || moves.length >= need}
                  className="mt-1.5 w-full rounded-lg border-2 border-cyan-400/50 bg-cyan-400/12 px-2 py-1.5 text-[12px] font-bold text-cyan-100 transition hover:bg-cyan-400/22 disabled:cursor-default disabled:opacity-40"
                >
                  {isUsed ? "사슬에 넣었어요 ✓" : "사슬에 넣기 ▶"}
                </button>
              </div>
            );
          })}
        </div>
        {msg ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {msg}</p> : null}
        {!solved ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <TipBox text={t.hint} open={tip} onOpen={() => setTip(true)} />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={undo}
                disabled={moves.length === 0}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
              >
                ↶ 되돌리기
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                ↺ 처음부터
              </button>
              <button
                type="button"
                onClick={() => setReveal(true)}
                className="rounded-lg border border-rose-400/35 bg-rose-400/10 px-3 py-1.5 text-[11px] font-bold text-rose-100 transition hover:bg-rose-400/20"
              >
                정답 보기
              </button>
            </div>
          </div>
        ) : null}
        {reveal && !solved ? (
          <div className="mt-2 space-y-1 rounded-lg bg-black/30 px-3 py-2">
            <p className="text-[11px] font-bold text-rose-200">정답 순서</p>
            {sol.map((m, k) => (
              <p key={k} className="text-[12px] leading-6 text-slate-300">
                {k + 1}. 카드 {"AB"[m.card] ?? m.card + 1}
                {m.flip ? " 를 뒤집어서" : " 를 그대로"} — <StmtLine t={t} s={t.cards[m.card]} flip={m.flip} />
              </p>
            ))}
          </div>
        ) : null}
      </div>

      {solved ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <p className="text-center text-[12px] font-bold text-emerald-100">🔗 이어 붙인 사슬</p>
          {moves.map((m, k) => (
            <p key={k} className="rounded-lg bg-black/25 px-3 py-2 text-center text-[13px] text-slate-100">
              <StmtLine t={t} s={t.cards[m.card]} flip={m.flip} />
              {m.flip ? <span className="ml-1.5 rounded bg-violet-400/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-100">뒤집음</span> : null}
            </p>
          ))}
          <p className="rounded-lg bg-emerald-400/15 px-3 py-2.5 text-center text-base font-extrabold leading-7 text-emerald-50">
            ∴ <StmtLine t={t} s={t.goal} />
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">📎 {t.note}</p>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}
