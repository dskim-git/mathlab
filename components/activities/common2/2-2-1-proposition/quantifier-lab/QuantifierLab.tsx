"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import { useActivityContext } from "@/components/activities/ActivityContext";
import { fetchLeaderboard, submitActivityScore, type LeaderRow } from "@/lib/activities/activityScores";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  HUNT_PENALTY,
  HUNT_SECONDS,
  HUNT_MODE,
  LAMPS,
  NEGS,
  QUANT_FLIP,
  QUANT_WORD,
  SCANS,
  U2_SIZE,
  allTrue,
  counterExamples,
  huntEvidence,
  huntTruth,
  isNegPair,
  makeHuntItem,
  pairKey,
  sameAtK,
  sameSet,
  shuffled,
  someTrue,
  witnesses,
  type Elem,
  type HuntItem,
  type LampDef,
  type LampId,
  type NegTask,
  type Piece,
  type Quant,
  type ScanTask,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "judge_by_truthset",
    prompt:
      "「모든 x에 대하여 p이다」와 「어떤 x에 대하여 p이다」의 참·거짓을 진리집합 P 와 전체집합 U 로 어떻게 판정하는지, 탭①에서 만든 그림을 떠올리며 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 조건 p 를 참이 되게 하는 원소를 모은 것이 P 이다. 전체집합의 원소가 하나도 빠짐없이 P 에 들어가면, 즉 P = U 이면 「모든 …」이 참이다. P 에 원소가 하나라도 있으면, 즉 P ≠ ∅ 이면 「어떤 …」이 참이다.",
  },
  {
    id: "one_is_enough",
    prompt:
      "「모든 …」은 반례 하나로 거짓임을 보일 수 있고, 「어떤 …」은 사례 하나로 참임을 보일 수 있어요. 왜 하나면 충분한지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 「모든 …」이 참이려면 P 가 U 와 똑같아야 하는데, P 에 들어가지 않는 원소를 하나만 찾아도 P ≠ U 가 되어 버린다. 「어떤 …」은 P 가 비어 있지 않기만 하면 되므로 P 에 들어가는 원소를 하나만 보여 주면 끝난다.",
  },
  {
    id: "why_both_flip",
    prompt:
      "부정을 하면 한정어(모든 ⇄ 어떤)와 조건(p ⇄ ~p)이 왜 함께 뒤집히는지, 탭②의 램프와 진리집합을 근거로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 「모든 x에 대하여 p」가 참일 조건은 P = U 이므로, 그 부정은 P ≠ U 이다. 그런데 P ≠ U 라는 말은 P 에 들어가지 않는 원소가 있다는 뜻이고, 그런 원소를 모은 것이 P의 여집합이므로 「어떤 x에 대하여 ~p」가 된다. 그래서 한정어와 조건이 함께 뒤집힌다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "scan" | "lamp" | "build" | "hunt";

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

/** 문장 한 조각 — 한글은 HTML, 식은 KaTeX (KaTeX 안에 한글을 넣을 수 없다) */
function PieceText({ p }: { p: Piece }) {
  return (
    <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5">
      {p.pre}
      {p.tex ? <Katex expr={p.tex} /> : null}
      {p.post}
    </span>
  );
}

/** 변수 x — 식이 아닌 문장 속에 섞이므로 KaTeX 대신 HTML 로 쓴다 */
function VarX() {
  return <i className="font-serif text-[1.05em] italic text-slate-200">x</i>;
}

const Q_TONE: Record<Quant, { text: string; ring: string; soft: string }> = {
  all: { text: "text-sky-200", ring: "border-sky-400/55", soft: "bg-sky-400/12" },
  some: { text: "text-amber-200", ring: "border-amber-400/55", soft: "bg-amber-400/12" },
};

/** 「모든 x에 대하여 …이다.」 한 줄 */
function QuantLine({ q, cond, big }: { q: Quant; cond: Piece; big?: boolean }) {
  return (
    <span className={"inline-flex flex-wrap items-baseline justify-center gap-x-1.5 leading-8 " + (big ? "text-lg font-bold" : "font-semibold")}>
      <b className={Q_TONE[q].text}>{QUANT_WORD[q]}</b>
      <span>
        <VarX />에 대하여
      </span>
      <PieceText p={cond} />
      <span>.</span>
    </span>
  );
}

/** 조건을 p 라는 이름만으로 쓴 문장 — 「어떤 x에 대하여 ~p이다.」 */
function AbstractLine({ q, neg }: { q: Quant; neg: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5 font-semibold leading-7">
      <b className={Q_TONE[q].text}>{QUANT_WORD[q]}</b>
      <span>
        <VarX />에 대하여
      </span>
      <span>
        {neg ? <span className="font-serif text-rose-200">~</span> : null}
        <i className="font-serif text-[1.05em] italic text-emerald-200">p</i>
        이다.
      </span>
    </span>
  );
}

/** 참·거짓 전구 하나 */
function Bulb({ on, w = 132 }: { on: boolean | null; w?: number }) {
  const col = on === null ? "rgba(148,163,184,0.45)" : on ? "#34d399" : "#fb7185";
  return (
    <svg viewBox="0 0 132 96" className="mx-auto block select-none" style={{ width: w }} role="img" aria-label={on === null ? "아직 판정하지 않음" : on ? "참" : "거짓"}>
      {on !== null ? <circle cx={66} cy={44} r={40} fill={col} opacity={0.16} /> : null}
      <circle
        cx={66}
        cy={44}
        r={29}
        fill={on === null ? "rgba(255,255,255,0.04)" : `${col}2e`}
        stroke={col}
        strokeWidth={on === null ? 2.5 : 4}
        strokeDasharray={on === null ? "6 6" : undefined}
      />
      <text x={66} y={52} textAnchor="middle" fill={col} className="text-[18px] font-bold">
        {on === null ? "?" : on ? "참" : "거짓"}
      </text>
    </svg>
  );
}

/** 참·거짓 두 버튼 */
function TFButtons({ value, answer, locked, onPick }: { value: boolean | null; answer: boolean; locked: boolean; onPick: (v: boolean) => void }) {
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
            {v ? "참 ⭕" : "거짓 ❌"}
          </button>
        );
      })}
    </div>
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

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function QuantifierLab() {
  const [tab, setTab] = useState<Tab>("scan");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔍 ‘모든’과 ‘어떤’이 있는 명제</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-sky-200">모든</b> 과 <b className="text-amber-200">어떤</b> 이 붙으면 조건이 명제가 돼요. 참·거짓은 어떻게 가릴까요?
          <b className="text-emerald-200"> 진리집합</b> 하나면 충분합니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "scan"} onClick={() => setTab("scan")}>
          ① 진리집합 스캐너 🔦
        </TabButton>
        <TabButton active={tab === "lamp"} onClick={() => setTab("lamp")}>
          ② 부정 램프 💡
        </TabButton>
        <TabButton active={tab === "build"} onClick={() => setTab("build")}>
          ③ 부정 조립기 🔧
        </TabButton>
        <TabButton active={tab === "hunt"} onClick={() => setTab("hunt")}>
          ④ 반례 사냥 🎯
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "scan" ? <ScanTab /> : null}
        {tab === "lamp" ? <LampTab /> : null}
        {tab === "build" ? <BuildTab /> : null}
        {tab === "hunt" ? <HuntTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 진리집합 스캐너
// ══════════════════════════════════════════════════════════════
function ElemChip({ e, tone, onClick }: { e: Elem; tone: "in" | "out" | "plain"; onClick?: () => void }) {
  const cls =
    tone === "in"
      ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-50"
      : tone === "out"
        ? "border-white/15 bg-white/[0.06] text-slate-300"
        : "border-white/10 bg-white/5 text-slate-300";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={
        "inline-flex items-center gap-1 rounded-xl border-2 px-2.5 py-1.5 text-sm font-bold transition disabled:cursor-default " +
        cls +
        (onClick ? " hover:brightness-125 active:scale-95" : "")
      }
    >
      {e.emoji ? <span className="text-base leading-none">{e.emoji}</span> : null}
      <span className={e.emoji ? "" : "font-mono"}>{e.label}</span>
    </button>
  );
}

function ScanTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = SCANS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔦 조건을 참이 되게 하는 원소를 모아 진리집합을 만들어요</p>
          <Chips ids={SCANS.map((s) => s.id)} cur={i} done={done} onPick={setI} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <b className="text-sky-200">모든</b> <VarX />에 대하여 p 가 참 <span className="mx-1 text-slate-500">⟺</span>{" "}
            <b className="text-white">
              <Katex expr="P = U" />
            </b>
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <b className="text-amber-200">어떤</b> <VarX />에 대하여 p 가 참 <span className="mx-1 text-slate-500">⟺</span>{" "}
            <b className="text-white">
              <Katex expr="P \ne \varnothing" />
            </b>
          </p>
        </div>
      </div>

      <ScanOne
        key={t.id}
        t={t}
        last={i === SCANS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(SCANS.length - 1, k + 1))}
      />

      {done.length === SCANS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 조건을 모두 스캔했어요!</p>
          <div className="mt-3 overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[420px] text-center text-[12px]">
              <thead>
                <tr className="text-[11px] text-slate-400">
                  <th className="px-2 py-1.5 font-semibold">진리집합</th>
                  <th className="px-2 py-1.5 font-semibold">모든 …</th>
                  <th className="px-2 py-1.5 font-semibold">어떤 …</th>
                  <th className="px-2 py-1.5 font-semibold">언제 이런 일이</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                <tr className="border-t border-white/10">
                  <td className="px-2 py-2">
                    <Katex expr="P = U" />
                  </td>
                  <td className="px-2 py-2 font-bold text-emerald-200">참</td>
                  <td className="px-2 py-2 font-bold text-emerald-200">참</td>
                  <td className="px-2 py-2 text-slate-400">모두가 조건을 만족</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-2 py-2 text-slate-300">
                    <Katex expr="\varnothing \ne P \ne U" />
                  </td>
                  <td className="px-2 py-2 font-bold text-rose-200">거짓</td>
                  <td className="px-2 py-2 font-bold text-emerald-200">참</td>
                  <td className="px-2 py-2 text-slate-400">일부만 만족 (반례도 사례도 있음)</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-2 py-2">
                    <Katex expr="P = \varnothing" />
                  </td>
                  <td className="px-2 py-2 font-bold text-rose-200">거짓</td>
                  <td className="px-2 py-2 font-bold text-rose-200">거짓</td>
                  <td className="px-2 py-2 text-slate-400">아무도 만족하지 않음</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            ※ <b className="text-white">「모든」이 참인데 「어떤」이 거짓</b> 인 칸은 표에 없어요. <Katex expr="P = U" /> 이면 <Katex expr="P" /> 는 비어 있을 수 없으니까요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ScanOne({ t, last, onDone, onNext }: { t: ScanTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [aAll, setAAll] = useState<boolean | null>(null);
  const [aSome, setASome] = useState<boolean | null>(null);
  const [tip, setTip] = useState(false);

  const wantAll = allTrue(t);
  const wantSome = someTrue(t);
  const step1 = checked && sameSet(picked, t.inP);
  const step2 = step1 && aAll !== null && aAll === wantAll;
  const step3 = step2 && aSome !== null && aSome === wantSome;

  const doneRef = useRef(false);
  useEffect(() => {
    if (step3 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function toggle(id: string) {
    if (step1) return;
    setChecked(false);
    setPicked((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const inside = t.universe.filter((e) => picked.includes(e.id));
  const outside = t.universe.filter((e) => !picked.includes(e.id));
  const misplaced = t.universe.filter((e) => picked.includes(e.id) !== t.inP.includes(e.id)).length;

  return (
    <div className="space-y-3">
      {/* 조건 카드 */}
      <div className="rounded-2xl border-2 border-emerald-400/35 bg-gradient-to-br from-emerald-500/[0.10] to-teal-500/[0.04] px-4 py-3 text-center">
        <p className="text-[11px] font-bold tracking-widest text-emerald-200/80">조건</p>
        <p className="mt-1 text-lg font-bold leading-8 text-slate-100">
          <i className="font-serif italic text-emerald-200">p</i>
          <span className="mx-1.5 text-slate-500">:</span>
          <PieceText p={t.cond} />
        </p>
        <p className="mt-1 text-[11px] font-bold text-slate-500">전체집합 U · {t.uLabel}</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* 1단계 — 벤 다이어그램 위에서 진리집합 만들기 */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="text-[12px] font-bold text-slate-200">
            1단계 · 조건을 <b className="text-emerald-200">참이 되게 하는 원소</b>를 눌러 <Katex expr="P" /> 안으로 옮기세요.
          </p>
          <div className="mt-2 rounded-2xl border-2 border-dashed border-slate-500/45 bg-slate-950/60 p-2.5">
            <p className="px-1 text-[11px] font-bold text-slate-400">
              <Katex expr="U" /> · 전체집합
            </p>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
              <div
                className={
                  "rounded-[2rem] border-2 p-2.5 transition " +
                  (step1 ? "border-emerald-400/70 bg-emerald-400/[0.12]" : "border-emerald-400/45 bg-emerald-400/[0.06]")
                }
              >
                <p className="text-center text-[11px] font-bold text-emerald-200">
                  <Katex expr="P" /> · 조건이 참
                </p>
                <div className="mt-2 flex min-h-[76px] flex-wrap content-start justify-center gap-1.5">
                  {inside.length === 0 ? <span className="self-center text-[12px] font-bold text-slate-600">비어 있음 ∅</span> : null}
                  {inside.map((e) => (
                    <ElemChip key={e.id} e={e} tone="in" onClick={step1 ? undefined : () => toggle(e.id)} />
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-2.5">
                <p className="text-center text-[11px] font-bold text-slate-400">
                  <Katex expr="P" /> 바깥 · 조건이 거짓
                </p>
                <div className="mt-2 flex min-h-[76px] flex-wrap content-start justify-center gap-1.5">
                  {outside.length === 0 ? <span className="self-center text-[12px] font-bold text-slate-600">비어 있음</span> : null}
                  {outside.map((e) => (
                    <ElemChip key={e.id} e={e} tone="out" onClick={step1 ? undefined : () => toggle(e.id)} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {step1 ? (
            <div className="mt-2 space-y-1.5">
              <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-center text-[12px] font-bold leading-6 text-emerald-100">
                ✅ 진리집합 완성! 원소 {t.inP.length}개 / 전체 {t.universe.length}개
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <p className={"rounded-lg px-3 py-2 text-center text-[12px] font-bold " + (wantAll ? "bg-sky-400/15 text-sky-100" : "bg-white/5 text-slate-400")}>
                  <Katex expr="P = U" /> {wantAll ? "⭕ 맞아요" : "❌ 아니에요"}
                </p>
                <p className={"rounded-lg px-3 py-2 text-center text-[12px] font-bold " + (wantSome ? "bg-amber-400/15 text-amber-100" : "bg-white/5 text-slate-400")}>
                  <Katex expr="P \ne \varnothing" /> {wantSome ? "⭕ 맞아요" : "❌ 아니에요"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <TipBox text={t.tip} open={tip} onOpen={() => setTip(true)} />
              <button
                type="button"
                onClick={() => setChecked(true)}
                className="rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/25"
              >
                진리집합 확인 🔦
              </button>
            </div>
          )}
          {checked && !step1 ? (
            <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ 자리를 잘못 잡은 원소가 {misplaced}개 있어요. 다시 살펴볼까요?</p>
          ) : null}
        </div>

        {/* 2·3단계 — 두 램프 */}
        <div className="space-y-2.5">
          <div className={"rounded-2xl border-2 p-3 transition " + (step1 ? "border-sky-400/40 bg-sky-400/[0.07]" : "border-white/10 bg-slate-900/40 pointer-events-none opacity-40")}>
            <p className="text-center text-lg leading-8">
              <QuantLine q="all" cond={t.cond} big />
            </p>
            <Bulb on={step2 ? wantAll : null} />
            <p className="mb-2 text-center text-[11px] font-bold text-slate-500">
              판정 기준 <Katex expr="P = U" />
            </p>
            <TFButtons value={aAll} answer={wantAll} locked={step2} onPick={setAAll} />
            {step2 ? <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {t.allWhy}</p> : null}
            {aAll !== null && !step2 && step1 ? (
              <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
                ❌ <Katex expr="P" /> 와 <Katex expr="U" /> 가 같은지 다시 비교해 보세요.
              </p>
            ) : null}
          </div>

          <div className={"rounded-2xl border-2 p-3 transition " + (step2 ? "border-amber-400/40 bg-amber-400/[0.07]" : "border-white/10 bg-slate-900/40 pointer-events-none opacity-40")}>
            <p className="text-center text-lg leading-8">
              <QuantLine q="some" cond={t.cond} big />
            </p>
            <Bulb on={step3 ? wantSome : null} />
            <p className="mb-2 text-center text-[11px] font-bold text-slate-500">
              판정 기준 <Katex expr="P \ne \varnothing" />
            </p>
            <TFButtons value={aSome} answer={wantSome} locked={step3} onPick={setASome} />
            {step3 ? <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {t.someWhy}</p> : null}
            {aSome !== null && !step3 && step2 ? (
              <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
                ❌ <Katex expr="P" /> 가 비어 있는지 다시 살펴보세요.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {step3 ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-black/25 px-3 py-2">
              <p className="text-[11px] font-bold text-rose-200">🚨 반례 — 「모든 …」을 무너뜨리는 원소</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {counterExamples(t).length === 0 ? (
                  <span className="text-[12px] font-bold text-slate-500">하나도 없어요 → 「모든 …」이 참</span>
                ) : (
                  counterExamples(t).map((e) => <ElemChip key={e.id} e={e} tone="plain" />)
                )}
              </div>
            </div>
            <div className="rounded-xl bg-black/25 px-3 py-2">
              <p className="text-[11px] font-bold text-emerald-200">✨ 사례 — 「어떤 …」을 살리는 원소</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {witnesses(t).length === 0 ? (
                  <span className="text-[12px] font-bold text-slate-500">하나도 없어요 → 「어떤 …」이 거짓</span>
                ) : (
                  witnesses(t).map((e) => <ElemChip key={e.id} e={e} tone="plain" />)
                )}
              </div>
            </div>
          </div>
          {t.note ? <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">📎 {t.note}</p> : null}
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 부정 램프
// ══════════════════════════════════════════════════════════════
const K_ALL = Array.from({ length: U2_SIZE + 1 }, (_, i) => i);

function LampCard({ lamp, k, selected, clickable, solved, onClick }: { lamp: LampDef; k: number; selected: boolean; clickable: boolean; solved: boolean; onClick: () => void }) {
  const on = lamp.on(k);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={
        "rounded-2xl border-2 p-2.5 text-left transition disabled:cursor-default " +
        (selected
          ? "border-cyan-400/80 bg-cyan-400/15"
          : solved
            ? "border-emerald-400/55 bg-emerald-400/10"
            : on
              ? "border-white/15 bg-white/[0.06]"
              : "border-white/10 bg-white/[0.02]") +
        (clickable ? " hover:border-cyan-400/50" : "")
      }
    >
      <p className="text-center">
        <AbstractLine q={lamp.q} neg={lamp.neg} />
      </p>
      <div className="mt-1 flex items-center justify-center gap-2">
        <span className={"rounded-lg px-2 py-1 font-mono text-[11px] font-bold " + (on ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/15 text-rose-100")}>
          {on ? "참" : "거짓"}
        </span>
        <span className="rounded-lg bg-black/30 px-2 py-1 font-mono text-[11px] font-bold text-slate-300">{lamp.setCond}</span>
        <span className="rounded-lg bg-black/30 px-2 py-1 font-mono text-[11px] text-slate-400">{lamp.altCond}</span>
      </div>
    </button>
  );
}

function LampTab() {
  const [k, setK] = useState(5);
  const [seen, setSeen] = useState<number[]>([5]);
  const [sel, setSel] = useState<LampId | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  const explored = seen.length === U2_SIZE + 1;
  const cleared = found.length === 2;

  function slide(v: number) {
    setK(v);
    setSeen((s) => (s.includes(v) ? s : [...s, v]));
    setMsg("");
  }

  function tapLamp(id: LampId) {
    if (cleared) return;
    if (sel === null) {
      setSel(id);
      setMsg("");
      return;
    }
    if (sel === id) {
      setSel(null);
      return;
    }
    const a = LAMPS.find((l) => l.id === sel) as LampDef;
    const b = LAMPS.find((l) => l.id === id) as LampDef;
    if (isNegPair(sel, id)) {
      const key = pairKey(sel, id);
      setFound((s) => (s.includes(key) ? s : [...s, key]));
      setMsg("✅ 이 둘은 언제나 반대로 켜져요 — 서로가 서로의 부정이에요!");
    } else {
      const bad = sameAtK(a, b);
      setMsg(`❌ 짝이 아니에요. 다이얼을 k = ${bad} 에 맞춰 보면 두 램프가 같이 켜지거나 같이 꺼져요.`);
    }
    setSel(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">💡 다이얼을 돌려 진리집합의 크기를 바꿔 보세요</p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          전체집합 <Katex expr="U" /> 의 원소는 8개예요. 조건 <Katex expr="p" /> 를 참이 되게 하는 원소가 <b className="text-emerald-200">k개</b> 일 때 네 명제가 어떻게 켜지고 꺼지는지
          지켜보세요.
        </p>
      </div>

      {/* 다이얼 + 전구 8개 */}
      <div className="rounded-2xl border-2 border-emerald-400/30 bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.03] p-4">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: U2_SIZE }, (_, i) => (
            <span
              key={i}
              className={
                "flex h-11 w-11 items-center justify-center rounded-xl border-2 text-lg transition " +
                (i < k ? "border-emerald-400/70 bg-emerald-400/25 text-emerald-50" : "border-white/12 bg-white/[0.03] text-slate-600")
              }
              aria-label={i < k ? "조건이 참인 원소" : "조건이 거짓인 원소"}
            >
              {i < k ? "🟢" : "⚪"}
            </span>
          ))}
        </div>
        <p className="mt-2 text-center text-[12px] font-bold text-slate-300">
          <Katex expr="|P| = k =" /> <span className="font-mono text-lg text-emerald-200">{k}</span>
          <span className="ml-2 text-slate-500">
            / <Katex expr="|U| = 8" />
          </span>
        </p>
        <input
          type="range"
          min={0}
          max={U2_SIZE}
          step={1}
          value={k}
          onChange={(e) => slide(Number(e.target.value))}
          className="mt-2 w-full accent-emerald-400"
          aria-label="진리집합의 크기 k"
        />
        <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
          <span className="mr-1 text-[11px] font-bold text-slate-500">훑어본 자리</span>
          {K_ALL.map((v) => (
            <span
              key={v}
              className={
                "flex h-5 w-5 items-center justify-center rounded font-mono text-[10px] font-bold " +
                (seen.includes(v) ? "bg-emerald-400/25 text-emerald-100" : "bg-white/5 text-slate-600")
              }
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* 네 램프 */}
      <div className="grid gap-2 sm:grid-cols-2">
        {LAMPS.map((l) => (
          <LampCard
            key={l.id}
            lamp={l}
            k={k}
            selected={sel === l.id}
            clickable={explored && !cleared}
            solved={found.some((key) => key.split("-").includes(l.id))}
            onClick={() => tapLamp(l.id)}
          />
        ))}
      </div>

      {/* 미션 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-[12px] font-bold text-slate-200">
          🎯 미션 · <b className="text-cyan-200">언제나 반대로 켜지는 두 램프</b>를 찾아 짝지으세요 (모두 2쌍)
        </p>
        {explored ? (
          <p className="mt-1.5 text-[12px] leading-6 text-slate-400">
            램프 두 개를 차례로 누르면 짝이 맞는지 알려 줘요. {sel ? <b className="text-cyan-200">하나 골랐어요 — 짝이 될 램프를 눌러 보세요.</b> : null}
          </p>
        ) : (
          <p className="mt-1.5 rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">
            🔒 다이얼을 <Katex expr="k = 0" /> 부터 <Katex expr="k = 8" /> 까지 모두 한 번씩 훑어본 뒤에 열려요. ({seen.length} / {U2_SIZE + 1})
          </p>
        )}
        {msg ? <p className={"mt-2 rounded-lg px-3 py-2 text-[12px] leading-6 " + (msg.startsWith("✅") ? "bg-emerald-400/10 text-emerald-100" : "bg-rose-400/10 text-rose-100")}>{msg}</p> : null}
        <p className="mt-2 text-center font-mono text-[12px] font-bold text-slate-400">찾은 짝 {found.length} / 2</p>
      </div>

      {/* k 별 판정표 */}
      {seen.length >= 2 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="text-[12px] font-bold text-slate-200">📊 훑어본 자리만 채워지는 판정표</p>
          <div className="mt-2 overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[460px] text-center text-[12px]">
              <thead>
                <tr className="text-[11px] text-slate-400">
                  <th className="px-2 py-1.5 text-left font-semibold">명제</th>
                  {K_ALL.map((v) => (
                    <th key={v} className="px-1 py-1.5 font-mono font-semibold">
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LAMPS.map((l) => (
                  <tr key={l.id} className="border-t border-white/10">
                    <td className="whitespace-nowrap px-2 py-1.5 text-left">
                      <AbstractLine q={l.q} neg={l.neg} />
                    </td>
                    {K_ALL.map((v) => (
                      <td key={v} className="px-1 py-1.5">
                        <span
                          className={
                            "inline-flex h-6 w-6 items-center justify-center rounded font-mono text-[10px] font-bold " +
                            (!seen.includes(v)
                              ? "bg-white/5 text-slate-700"
                              : l.on(v)
                                ? "bg-emerald-400/25 text-emerald-100"
                                : "bg-rose-400/20 text-rose-100")
                          }
                        >
                          {seen.includes(v) ? (l.on(v) ? "T" : "F") : "·"}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">T 와 F 가 정확히 엇갈리는 두 줄을 찾아보세요. 그 둘이 서로의 부정이에요.</p>
        </div>
      ) : null}

      {cleared ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 두 쌍을 모두 찾았어요!</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-black/25 px-3 py-2.5 text-center">
              <p className="leading-7">
                <AbstractLine q="all" neg={false} />
              </p>
              <p className="my-1 text-[11px] font-bold text-rose-200">↕ 부정</p>
              <p className="leading-7">
                <AbstractLine q="some" neg />
              </p>
              <p className="mt-1.5 border-t border-white/10 pt-1.5 font-mono text-[11px] text-slate-400">P = U 의 부정은 Pᶜ ≠ ∅</p>
            </div>
            <div className="rounded-xl bg-black/25 px-3 py-2.5 text-center">
              <p className="leading-7">
                <AbstractLine q="some" neg={false} />
              </p>
              <p className="my-1 text-[11px] font-bold text-rose-200">↕ 부정</p>
              <p className="leading-7">
                <AbstractLine q="all" neg />
              </p>
              <p className="mt-1.5 border-t border-white/10 pt-1.5 font-mono text-[11px] text-slate-400">P ≠ ∅ 의 부정은 Pᶜ = U</p>
            </div>
          </div>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            ※ 부정을 하면 <b className="text-white">모든 ⇄ 어떤</b> 이 바뀌고, 조건도 <Katex expr="p" /> <span className="text-slate-500">⇄</span> <Katex expr="\sim p" /> 로 바뀌어요.{" "}
            <b className="text-amber-200">둘 다</b> 뒤집어야 한답니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 부정 조립기
// ══════════════════════════════════════════════════════════════
function BuildTab() {
  const [order, setOrder] = useState<number[]>(() => NEGS.map((_, i) => i));
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const deck = order.map((k) => NEGS[k]);
  const t = deck[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔧 다이얼 두 개를 돌려 부정문을 조립하세요</p>
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
          <b className="text-sky-200">모든</b> <span className="mx-1 text-slate-500">⇄</span> <b className="text-amber-200">어떤</b>
          <span className="mx-3 text-slate-600">그리고</span>
          <Katex expr="p" /> <span className="mx-1 text-slate-500">⇄</span> <Katex expr="\sim p" />
        </p>
      </div>

      <BuildOne
        key={t.id}
        t={t}
        last={i === deck.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(deck.length - 1, k + 1))}
      />

      {done.length === NEGS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문장을 모두 부정했어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <p className="rounded-xl bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
              「<b className="text-sky-200">모든</b> <VarX />에 대하여 p이다」의 부정
              <br />= 「<b className="text-amber-200">어떤</b> <VarX />에 대하여 <span className="font-serif text-rose-200">~</span>p이다」
            </p>
            <p className="rounded-xl bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
              「<b className="text-amber-200">어떤</b> <VarX />에 대하여 p이다」의 부정
              <br />= 「<b className="text-sky-200">모든</b> <VarX />에 대하여 <span className="font-serif text-rose-200">~</span>p이다」
            </p>
          </div>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            ※ 한정어만 뒤집거나 조건만 뒤집으면 부정이 아니에요. <b className="text-white">언제나 둘을 함께</b> 뒤집어야 한답니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function BuildOne({ t, last, onDone, onNext }: { t: NegTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [q, setQ] = useState<Quant>(t.q);
  const [neg, setNeg] = useState(false);
  const [judged, setJudged] = useState(false);
  const [truth, setTruth] = useState<boolean | null>(null);
  const [tip, setTip] = useState(false);

  const wantQ = QUANT_FLIP[t.q];
  const built = judged && q === wantQ && neg;
  const step2 = built && truth !== null && truth === t.truth;

  const doneRef = useRef(false);
  useEffect(() => {
    if (step2 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const head = (qq: Quant) => (qq === "all" ? t.headAll : t.headSome);
  const pred = neg ? t.predNo : t.predYes;

  let wrongWhy = "";
  if (judged && !built) {
    if (q === t.q && !neg) wrongWhy = "원래 명제 그대로예요. 한정어와 술어를 모두 바꿔 보세요.";
    else if (q === t.q && neg) wrongWhy = "술어만 뒤집었어요. 한정어도 함께 뒤집어야 부정이 된답니다.";
    else wrongWhy = "한정어만 뒤집었어요. 술어도 함께 뒤집어야 부정이 된답니다.";
  }

  return (
    <div className="space-y-3">
      {/* 원래 명제 */}
      <div className="rounded-2xl border-2 border-sky-400/35 bg-gradient-to-br from-sky-500/[0.10] to-cyan-500/[0.04] px-4 py-3 text-center">
        <p className="text-[11px] font-bold tracking-widest text-sky-200/80">원래 명제</p>
        <p className="mt-1 text-lg font-bold leading-8 text-slate-100">
          <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5">
            <b className={Q_TONE[t.q].text}>{head(t.q)}</b>
            <PieceText p={t.predYes} />
            <span>.</span>
          </span>
        </p>
      </div>

      {/* 조립기 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (built ? "border-emerald-400/55 bg-emerald-400/10" : "border-white/10 bg-slate-900/40")}>
        <p className="text-[12px] font-bold text-slate-200">1단계 · 다이얼 두 개를 돌려 이 명제의 부정을 만드세요.</p>

        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
            <p className="text-center text-[11px] font-bold text-slate-400">다이얼 1 · 한정어</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {(["all", "some"] as Quant[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setQ(v);
                    setJudged(false);
                  }}
                  disabled={built}
                  className={
                    "rounded-lg border-2 px-2 py-2 text-sm font-bold transition disabled:cursor-default " +
                    (q === v ? `${Q_TONE[v].ring} ${Q_TONE[v].soft} ${Q_TONE[v].text}` : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
                  }
                >
                  {QUANT_WORD[v]}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
            <p className="text-center text-[11px] font-bold text-slate-400">다이얼 2 · 술어</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {[false, true].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => {
                    setNeg(v);
                    setJudged(false);
                  }}
                  disabled={built}
                  className={
                    "overflow-x-auto overflow-y-hidden rounded-lg border-2 px-2 py-2 text-[13px] font-bold transition disabled:cursor-default " +
                    (neg === v ? "border-rose-400/55 bg-rose-400/12 text-rose-100" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
                  }
                >
                  <PieceText p={v ? t.predNo : t.predYes} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 조립 결과 */}
        <div className={"mt-2.5 rounded-xl border-2 px-4 py-4 text-center transition " + (built ? "border-emerald-400/60 bg-emerald-400/10" : "border-dashed border-amber-400/45 bg-amber-400/[0.06]")}>
          <p className="text-[11px] font-bold tracking-widest text-amber-200/80">조립 중인 문장</p>
          <p className="mt-1.5 text-lg font-bold leading-8 text-slate-100">
            <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5">
              <b className={Q_TONE[q].text}>{head(q)}</b>
              <PieceText p={pred} />
              <span>.</span>
            </span>
          </p>
        </div>

        {built ? (
          <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {t.negWhy}</p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <TipBox text={t.tip} open={tip} onOpen={() => setTip(true)} />
            <button
              type="button"
              onClick={() => setJudged(true)}
              className="rounded-xl border-2 border-amber-400/55 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-100 transition hover:bg-amber-400/25"
            >
              이걸로 부정 완성! 🔧
            </button>
          </div>
        )}
        {wrongWhy ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {wrongWhy}</p> : null}
      </div>

      {/* 2단계 참·거짓 */}
      <div className={"rounded-2xl border border-white/10 bg-slate-900/40 p-3 transition " + (built ? "" : "pointer-events-none opacity-40")}>
        <p className="text-[12px] font-bold text-slate-200">2단계 · 원래 명제는 참일까요, 거짓일까요?</p>
        <div className="mt-2">
          <TFButtons value={truth} answer={t.truth} locked={step2} onPick={setTruth} />
        </div>
        {step2 ? (
          <div className="mt-2 space-y-1.5">
            <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {t.truthWhy}</p>
            <div className="grid grid-cols-2 gap-1.5 text-center">
              <div className="rounded-xl bg-black/25 px-3 py-2">
                <p className="text-[11px] font-bold text-sky-200">원래 명제</p>
                <Bulb on={t.truth} w={104} />
              </div>
              <div className="rounded-xl bg-black/25 px-3 py-2">
                <p className="text-[11px] font-bold text-amber-200">부정한 명제</p>
                <Bulb on={!t.truth} w={104} />
              </div>
            </div>
            <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">부정은 참·거짓을 반드시 뒤집어요.</p>
            {last ? null : <NextBtn onClick={onNext} />}
          </div>
        ) : null}
        {truth !== null && !step2 && built ? (
          <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
            ❌ {t.q === "all" ? "반례가 하나라도 있는지 찾아보세요." : "사례가 하나라도 있는지 찾아보세요."}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 반례 사냥 + 순위표
// ══════════════════════════════════════════════════════════════
type Phase = "idle" | "run" | "done";

const HS_KEY = "mathlab.quantifier_lab.best";
const ACTIVITY_SLUG = "common2/mini/quantifier_lab";

/** 이 기기에 남겨 둔 최고 기록(로그인 전에도 보이도록). */
function readBest(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(HS_KEY);
    return v === null ? null : Number(v) || 0;
  } catch {
    return null;
  }
}

type Miss = { item: HuntItem; picked: number | null };

function HuntTab() {
  const ctx = useActivityContext();
  const activitySlug = ctx?.activitySlug ?? ACTIVITY_SLUG;
  const subject = ctx?.subject ?? "공통수학2";

  const [phase, setPhase] = useState<Phase>("idle");
  const [item, setItem] = useState<HuntItem | null>(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [left, setLeft] = useState(HUNT_SECONDS);
  const [flash, setFlash] = useState<null | "ok" | "no">(null);
  const [misses, setMisses] = useState<Miss[]>([]);
  const [best, setBest] = useState<number | null>(readBest);
  const [saveMsg, setSaveMsg] = useState("");
  const [reload, setReload] = useState(0);

  // 타이머 콜백에서 최신 값을 읽기 위한 거울
  const deadlineRef = useRef(0);
  const scoreRef = useRef(0);
  const wrongRef = useRef(0);
  const bestRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  /** 한 판을 마무리 — 최고 기록 갱신 + 랭킹 제출(신원은 서버 RPC 가 auth.uid() 로 채운다). */
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = scoreRef.current;
    const w = wrongRef.current;
    setPhase("done");

    if (bestRef.current === null || s > bestRef.current) {
      bestRef.current = s;
      setBest(s);
      try {
        window.localStorage.setItem(HS_KEY, String(s));
      } catch {
        /* 저장소를 못 쓰는 환경은 무시 */
      }
    }

    if (s <= 0) {
      setSaveMsg("0점은 순위표에 올라가지 않아요. 한 문제라도 맞혀 보세요!");
      return;
    }
    setSaveMsg("점수를 올리는 중…");
    void (async () => {
      const res = await submitActivityScore({
        activitySlug,
        subject,
        difficulty: HUNT_MODE,
        score: s,
        meta: { correct: s, wrong: w, seconds: HUNT_SECONDS },
      });
      if (res.ok) {
        setSaveMsg("순위표에 기록했어요! 🏅");
        setReload((x) => x + 1);
      } else {
        setSaveMsg(res.notStudent ? "학생 계정으로 로그인하면 순위표에 기록돼요." : `점수 저장 실패: ${res.error}`);
      }
    })();
  }, [activitySlug, subject]);

  // 타이머 — 남은 시간만 갱신하고, 0이 되면 마무리한다.
  useEffect(() => {
    if (phase !== "run") return;
    const t = window.setInterval(() => {
      const remain = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
      setLeft(remain);
      if (remain <= 0) finish();
    }, 100);
    return () => window.clearInterval(t);
  }, [phase, finish]);

  function start() {
    deadlineRef.current = Date.now() + HUNT_SECONDS * 1000;
    scoreRef.current = 0;
    wrongRef.current = 0;
    doneRef.current = false;
    setScore(0);
    setWrong(0);
    setMisses([]);
    setLeft(HUNT_SECONDS);
    setSaveMsg("");
    setItem(makeHuntItem());
    setPhase("run");
  }

  /** picked = 누른 원소, null 이면 「그런 수는 없어요」 버튼 */
  function answer(picked: number | null) {
    if (!item || phase !== "run") return;
    const ev = huntEvidence(item);
    const right = picked === null ? ev.length === 0 : ev.includes(picked);
    if (right) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash("ok");
    } else {
      wrongRef.current += 1;
      setWrong(wrongRef.current);
      deadlineRef.current -= HUNT_PENALTY * 1000;
      setFlash("no");
      setMisses((s) => (s.length >= 5 ? s : [...s, { item, picked }]));
    }
    window.setTimeout(() => setFlash(null), 220);
    setItem(makeHuntItem(item.key));
  }

  return (
    <div className="space-y-4">
      {phase === "idle" ? (
        <div className="rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/[0.12] to-rose-500/[0.06] p-6 text-center">
          <p className="text-4xl">🎯</p>
          <p className="mt-2 text-xl font-extrabold text-amber-100">{HUNT_SECONDS}초 반례 사냥</p>
          <div className="mx-auto mt-3 grid max-w-md gap-1.5 text-left text-sm leading-6 text-slate-300">
            <p>
              • <b className="text-sky-200">「모든 …」</b> 이 나오면 → <b className="text-rose-200">반례</b>가 될 수를 눌러 거짓임을 보여 주세요.
            </p>
            <p>
              • <b className="text-amber-200">「어떤 …」</b> 이 나오면 → <b className="text-emerald-200">사례</b>가 될 수를 눌러 참임을 보여 주세요.
            </p>
            <p>
              • 그런 수가 <b className="text-white">하나도 없으면</b> 아래의 큰 버튼을 누르면 돼요.
            </p>
            <p>
              • 틀리면 남은 시간이 <b className="text-rose-200">{HUNT_PENALTY}초</b> 줄어드니 찍기는 손해!
            </p>
          </div>
          {best !== null ? <p className="mt-3 font-mono text-sm font-bold text-amber-200">내 최고 기록 {best}점</p> : null}
          <button
            type="button"
            onClick={start}
            className="mt-4 rounded-xl border-2 border-amber-400/60 bg-amber-400/20 px-8 py-3 text-lg font-extrabold text-amber-100 transition hover:bg-amber-400/30"
          >
            사냥 시작 🚀
          </button>
        </div>
      ) : null}

      {phase === "run" && item ? (
        <div
          className={
            "rounded-2xl border-2 p-4 transition-colors " +
            (flash === "ok" ? "border-emerald-400/70 bg-emerald-400/10" : flash === "no" ? "border-rose-400/70 bg-rose-400/10" : "border-white/10 bg-slate-900/40")
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full border border-emerald-400/45 bg-emerald-400/15 px-3 py-1 font-mono text-sm font-bold text-emerald-100">✅ {score}</span>
            <span className="font-mono text-2xl font-extrabold text-amber-100">{left.toFixed(1)}초</span>
            <span className="rounded-full border border-rose-400/45 bg-rose-400/15 px-3 py-1 font-mono text-sm font-bold text-rose-100">❌ {wrong}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className={"h-full rounded-full transition-all " + (left < 10 ? "bg-rose-400" : "bg-amber-400")} style={{ width: `${(left / HUNT_SECONDS) * 100}%` }} />
          </div>

          <div className={"mt-3 rounded-2xl border-2 px-4 py-4 text-center " + (item.q === "all" ? "border-sky-400/40 bg-sky-400/[0.07]" : "border-amber-400/40 bg-amber-400/[0.07]")}>
            <p className="text-lg leading-8 text-slate-100">
              <QuantLine q={item.q} cond={item.cond} big />
            </p>
            <p className="mt-1 font-mono text-[12px] font-bold text-slate-400">
              U = {"{"} {item.nums.join(", ")} {"}"}
            </p>
          </div>

          <p className="mt-3 text-center text-[12px] font-bold text-slate-300">
            {item.q === "all" ? (
              <>
                <b className="text-rose-200">반례</b>가 되는 수를 누르세요
              </>
            ) : (
              <>
                <b className="text-emerald-200">사례</b>가 되는 수를 누르세요
              </>
            )}
          </p>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {item.nums.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => answer(n)}
                className="rounded-xl border-2 border-white/12 bg-white/5 py-4 font-mono text-2xl font-extrabold text-slate-100 transition hover:bg-white/15 active:scale-95"
              >
                {n}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => answer(null)}
            className="mt-2 w-full rounded-xl border-2 border-violet-400/50 bg-violet-400/12 px-3 py-3 text-sm font-bold text-violet-100 transition hover:bg-violet-400/22 active:scale-95"
          >
            {item.q === "all" ? "반례가 없어요 → 이 명제는 참 ⭕" : "사례가 없어요 → 이 명제는 거짓 ❌"}
          </button>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/15 to-rose-500/10 p-5 text-center">
            <p className="text-3xl">{score >= 15 ? "🏆" : score >= 8 ? "🎉" : "💪"}</p>
            <p className="mt-1 text-sm font-bold text-amber-200">{HUNT_SECONDS}초 기록</p>
            <p className="mt-1 font-mono text-4xl font-extrabold text-white">{score}점</p>
            <p className="mt-1 text-xs text-slate-400">
              맞힘 {score} · 틀림 {wrong}
              {best !== null ? ` · 내 최고 ${best}점` : ""}
            </p>
            {saveMsg ? <p className="mt-2 text-xs font-bold text-emerald-200">{saveMsg}</p> : null}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={start}
                className="rounded-xl border-2 border-amber-400/60 bg-amber-400/20 px-6 py-2 text-sm font-extrabold text-amber-100 transition hover:bg-amber-400/30"
              >
                ↻ 다시 도전
              </button>
              <button
                type="button"
                onClick={() => setPhase("idle")}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
              >
                규칙 다시 보기
              </button>
            </div>
          </div>

          {misses.length > 0 ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/[0.06] p-4">
              <p className="text-sm font-bold text-rose-200">🔎 놓친 문제 다시 보기</p>
              <div className="mt-2 space-y-2">
                {misses.map((m, idx) => {
                  const ev = huntEvidence(m.item);
                  return (
                    <div key={idx} className="rounded-xl bg-black/25 px-3 py-2.5">
                      <p className="leading-7 text-slate-100">
                        <QuantLine q={m.item.q} cond={m.item.cond} />
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                        U = {"{"} {m.item.nums.join(", ")} {"}"} · P = {"{"} {m.item.inP.join(", ") || " "} {"}"}
                      </p>
                      <p className="mt-1 text-[12px] leading-6 text-slate-300">
                        {ev.length === 0 ? (
                          <>
                            {m.item.q === "all" ? (
                              <>
                                반례가 하나도 없어요 → <b className="text-emerald-200">참</b>
                              </>
                            ) : (
                              <>
                                사례가 하나도 없어요 → <b className="text-rose-200">거짓</b>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {m.item.q === "all" ? "반례" : "사례"}는 <b className="font-mono text-amber-200">{ev.join(", ")}</b> →{" "}
                            <b className={huntTruth(m.item) ? "text-emerald-200" : "text-rose-200"}>{huntTruth(m.item) ? "참" : "거짓"}</b>
                          </>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <Leaderboard activitySlug={activitySlug} reloadToken={reload} />
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

function Leaderboard({ activitySlug, reloadToken }: { activitySlug: string; reloadToken: number }) {
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const res = await fetchLeaderboard({ activitySlug, limit: 20 });
      if (!alive) return;
      if (res.ok) {
        setRows(res.rows);
        setErr("");
      } else {
        setRows(null);
        setErr(res.error);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [activitySlug, reloadToken, tick]);

  const meMissing = !!rows && rows.length > 0 && !rows.some((r) => r.isMe);

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-violet-200">
          🏅 반례 사냥 순위표 <span className="text-[11px] font-normal text-slate-500">(학생별 최고 점수)</span>
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setTick((x) => x + 1);
          }}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          🔄 새로고침
        </button>
      </div>

      {loading ? (
        <p className="mt-3 text-center text-xs text-slate-400">순위표를 불러오는 중…</p>
      ) : err ? (
        <p className="mt-3 text-center text-xs text-rose-300">순위표를 불러오지 못했습니다: {err}</p>
      ) : !rows || rows.length === 0 ? (
        <p className="mt-3 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-4 text-center text-xs leading-5 text-slate-400">
          아직 기록이 없어요. 첫 번째 사냥꾼이 되어 보세요! 🚀
        </p>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[380px] text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-2.5 py-2 text-left font-semibold">순위</th>
                  <th className="px-2.5 py-2 text-left font-semibold">이름</th>
                  <th className="px-2.5 py-2 text-right font-semibold">학급</th>
                  <th className="px-2.5 py-2 text-right font-semibold">최고 점수</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.rank}-${r.displayName}`} className={"border-t border-white/5 " + (r.isMe ? "bg-violet-400/15 font-bold" : "")}>
                    <td className="px-2.5 py-2 text-left text-base">{r.rank <= 3 ? MEDALS[r.rank - 1] : `${r.rank}위`}</td>
                    <td className="px-2.5 py-2 text-left text-slate-100">
                      {r.displayName}
                      {r.isMe ? <span className="ml-1.5 text-[11px] text-violet-200">← 나</span> : null}
                    </td>
                    <td className="px-2.5 py-2 text-right font-mono text-xs text-slate-400">{r.grade && r.classNumber ? `${r.grade}-${r.classNumber}` : "—"}</td>
                    <td className="px-2.5 py-2 text-right font-mono font-extrabold text-amber-200">{r.bestScore}점</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meMissing ? (
            <p className="mt-2 rounded-lg border border-violet-400/35 bg-violet-400/10 px-3 py-2 text-center text-xs font-bold text-violet-100">
              아직 상위 {rows.length}명 안에 이름이 없어요. 한 번 더 도전해 볼까요? 💪
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
