"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 데이터 ─────────────────────────────────────────────────
type Term = { id: string; text: string; deg: number };
type Problem = { label: string; terms: Omit<Term, "id">[] };

const PROBLEMS: Problem[] = [
  {
    label: "① 4차 다항식",
    terms: [
      { text: "3x", deg: 1 },
      { text: "x⁴", deg: 4 },
      { text: "−2x²", deg: 2 },
      { text: "+5", deg: 0 },
      { text: "−x³", deg: 3 },
    ],
  },
  {
    label: "② 3차 다항식",
    terms: [
      { text: "−x³", deg: 3 },
      { text: "+4", deg: 0 },
      { text: "−2x", deg: 1 },
      { text: "+3x²", deg: 2 },
    ],
  },
  {
    label: "③ 4차 다항식",
    terms: [
      { text: "2x²", deg: 2 },
      { text: "−x⁴", deg: 4 },
      { text: "+3x³", deg: 3 },
      { text: "−5", deg: 0 },
    ],
  },
  {
    label: "④ 5차 다항식",
    terms: [
      { text: "x", deg: 1 },
      { text: "+4x³", deg: 3 },
      { text: "−3x²", deg: 2 },
      { text: "−2", deg: 0 },
      { text: "+x⁵", deg: 5 },
    ],
  },
  {
    label: "⑤ 4차 다항식",
    terms: [
      { text: "5x²", deg: 2 },
      { text: "+2", deg: 0 },
      { text: "−3x³", deg: 3 },
      { text: "+x", deg: 1 },
      { text: "−x⁴", deg: 4 },
    ],
  },
  {
    label: "⑥ 3차 다항식",
    terms: [
      { text: "−2x", deg: 1 },
      { text: "+4x³", deg: 3 },
      { text: "−3", deg: 0 },
      { text: "+5x²", deg: 2 },
    ],
  },
  {
    label: "⑦ 4차 다항식 (x 기준)",
    terms: [
      { text: "2x⁴", deg: 4 },
      { text: "−x", deg: 1 },
      { text: "+3x²", deg: 2 },
      { text: "−5x³", deg: 3 },
      { text: "+7", deg: 0 },
    ],
  },
];

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "sort_key",
    prompt:
      "다항식을 내림차순(또는 오름차순)으로 정리할 때, 어떤 기준을 가장 먼저 살펴봐야 했나요? 그 기준이 다항식을 정리하는 데 왜 중요한지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 항의 차수를 먼저 보고 가장 큰(또는 작은) 차수부터 차례로 적었다. 식의 모양을 한눈에 비교하려면 차수 순서가 가장 기준이 되기 때문이다.",
  },
];

type Mode = "desc" | "asc";

// 차수별 색 토큰 (다크 톤)
const DEG_TONE: Record<number, { box: string; text: string }> = {
  0: { box: "border-amber-400/45 bg-amber-400/15", text: "text-amber-200" },
  1: { box: "border-emerald-400/45 bg-emerald-400/15", text: "text-emerald-200" },
  2: { box: "border-sky-400/45 bg-sky-400/15", text: "text-sky-200" },
  3: { box: "border-violet-400/45 bg-violet-400/15", text: "text-violet-200" },
  4: { box: "border-pink-400/45 bg-pink-400/15", text: "text-pink-200" },
  5: { box: "border-fuchsia-400/45 bg-fuchsia-400/15", text: "text-fuchsia-200" },
};
function degTone(d: number) {
  return DEG_TONE[Math.min(d, 5)] ?? DEG_TONE[5];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 문제 → 카드 배열 (id 부여)
function buildCards(problem: Problem): Term[] {
  return problem.terms.map((t, i) => ({ id: `${i}-${t.text}`, ...t }));
}

type SlotState = (Term | null)[];
type Feedback = { tone: "info" | "ok" | "ng" | "hint"; message: string } | null;

export default function PolySortGame() {
  const [problemIdx, setProblemIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("desc");
  const [score, setScore] = useState(0);
  const [pool, setPool] = useState<Term[]>([]);
  const [slots, setSlots] = useState<SlotState>([]);
  const [hintShown, setHintShown] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [solved, setSolved] = useState(false);
  const [slotFlash, setSlotFlash] = useState<("ok" | "ng" | null)[]>([]);

  const dragSrc = useRef<{ id: string; from: "pool" | number } | null>(null);

  const problem = PROBLEMS[problemIdx];

  // 문제/모드 변경 → 풀 셔플 + 슬롯 비우기 (의도된 리셋 패턴)
  useEffect(() => {
    const cards = shuffle(buildCards(problem));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPool(cards);
    setSlots(Array(problem.terms.length).fill(null));
    setHintShown(false);
    setFeedback(null);
    setSolved(false);
    setSlotFlash(Array(problem.terms.length).fill(null));
  }, [problemIdx, mode, problem]);

  const sortedDegs = useMemo(() => {
    const degs = problem.terms.map((t) => t.deg);
    return mode === "desc"
      ? [...degs].sort((a, b) => b - a)
      : [...degs].sort((a, b) => a - b);
  }, [problem, mode]);

  // 표시용 무작위 다항식 문자열 (현재 pool 순서 기반)
  const problemText = useMemo(() => {
    if (!pool.length && slots.every((s) => s !== null)) {
      // 모두 슬롯에 옮겨졌으면 슬롯 + 원래 풀의 합 = 전체. 표시는 원래 셔플 순서 유지가 어렵다 → 그냥 정리 전 모양 안내.
      return "(모든 카드를 슬롯으로 옮겼습니다)";
    }
    return pool.map((t) => t.text).join(" ") || "(빈 상태)";
  }, [pool, slots]);

  function moveCardToSlot(card: Term, slotIdx: number) {
    setPool((p) => p.filter((t) => t.id !== card.id));
    setSlots((s) => {
      const next = [...s];
      const occupant = next[slotIdx];
      next[slotIdx] = card;
      if (occupant) setPool((p) => [...p, occupant]);
      return next;
    });
    setSolved(false);
    setFeedback(null);
  }

  function returnSlotToPool(slotIdx: number) {
    setSlots((s) => {
      const next = [...s];
      const card = next[slotIdx];
      if (card) {
        setPool((p) => [...p, card]);
        next[slotIdx] = null;
      }
      return next;
    });
    setSolved(false);
    setFeedback(null);
  }

  function swapSlots(a: number, b: number) {
    if (a === b) return;
    setSlots((s) => {
      const next = [...s];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
    setSolved(false);
    setFeedback(null);
  }

  function handleCardClick(card: Term, from: "pool" | number) {
    if (from === "pool") {
      const emptyIdx = slots.findIndex((s) => s === null);
      if (emptyIdx >= 0) moveCardToSlot(card, emptyIdx);
    } else {
      returnSlotToPool(from);
    }
  }

  function handleCheck() {
    if (slots.some((s) => s === null)) {
      setFeedback({ tone: "ng", message: "⚠️ 모든 칸을 채운 후 확인해 보세요." });
      return;
    }
    const myDegs = slots.map((s) => s!.deg);
    const correct = sortedDegs.every((d, i) => d === myDegs[i]);
    if (correct) {
      setScore((s) => s + 10);
      setSolved(true);
      setFeedback({ tone: "ok", message: "🎉 정답입니다! +10점" });
      setSlotFlash(Array(slots.length).fill("ok"));
      window.setTimeout(() => setSlotFlash(Array(slots.length).fill(null)), 2200);
    } else {
      setFeedback({
        tone: "ng",
        message: "❌ 아직 맞지 않아요. 빨갛게 표시된 칸을 다시 살펴보세요.",
      });
      const flash = slots.map((s, i): "ok" | "ng" | null =>
        s ? (s.deg === sortedDegs[i] ? "ok" : "ng") : null,
      );
      setSlotFlash(flash);
      window.setTimeout(() => setSlotFlash(Array(slots.length).fill(null)), 1600);
    }
  }

  function handleHint() {
    setHintShown(true);
    setFeedback({
      tone: "hint",
      message: "💡 가장 높은(또는 낮은) 차수의 항부터 차례로 놓아 보세요.",
    });
  }

  function handleReset() {
    const cards = shuffle(buildCards(problem));
    setPool(cards);
    setSlots(Array(problem.terms.length).fill(null));
    setHintShown(false);
    setFeedback(null);
    setSolved(false);
    setSlotFlash(Array(problem.terms.length).fill(null));
  }

  function handleNext() {
    const last = problemIdx === PROBLEMS.length - 1;
    setProblemIdx((i) => (i + 1) % PROBLEMS.length);
    if (last) {
      setFeedback({
        tone: "ok",
        message: "🏆 모든 문제를 완료했습니다! 처음부터 다시 시작해요.",
      });
    }
  }

  const progressPct = Math.round((problemIdx / PROBLEMS.length) * 100);
  const allFilled = slots.every((s) => s !== null);
  const answerOrdered = useMemo(() => {
    const arr = [...problem.terms].sort((a, b) =>
      mode === "desc" ? b.deg - a.deg : a.deg - b.deg,
    );
    return arr.map((t) => t.text).join(" ");
  }, [problem, mode]);

  // 드래그 핸들러
  function onDragStart(id: string, from: "pool" | number) {
    return () => {
      dragSrc.current = { id, from };
    };
  }
  function onSlotDrop(slotIdx: number) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      const src = dragSrc.current;
      if (!src) return;
      if (src.from === "pool") {
        const card = pool.find((t) => t.id === src.id);
        if (card) moveCardToSlot(card, slotIdx);
      } else if (typeof src.from === "number") {
        swapSlots(src.from, slotIdx);
      }
      dragSrc.current = null;
    };
  }
  function onPoolDrop(e: React.DragEvent) {
    e.preventDefault();
    const src = dragSrc.current;
    if (src && typeof src.from === "number") returnSlotToPool(src.from);
    dragSrc.current = null;
  }
  function allowDrop(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* ─── 헤더 ─── */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">🃏 다항식의 정리 — 항 카드 정렬 게임</h3>
        <p className="mt-2 leading-7 text-slate-300">
          무작위로 섞인 다항식의 항 카드를 <b className="text-cyan-200">x에 대한 차수</b>를 기준으로
          드래그하거나 클릭해서 순서대로 칸에 놓아 보세요.
        </p>
      </div>

      {/* ─── 진행 + 점수 ─── */}
      <div className="mt-5 flex items-center gap-3">
        <svg
          viewBox="0 0 100 4"
          preserveAspectRatio="none"
          className="h-2 flex-1"
          role="img"
          aria-label={`진행률 ${progressPct}%`}
        >
          <defs>
            <linearGradient id="psgProgGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
          <rect x="0" y="0" width={progressPct} height="4" rx="2" fill="url(#psgProgGrad)" />
        </svg>
        <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-4 py-1 font-mono text-sm font-bold text-cyan-100">
          점수 {score}
        </span>
      </div>

      {/* ─── 모드 토글 + 문제 ─── */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5">
          {(["desc", "asc"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={
                mode === m
                  ? "rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20"
                  : "rounded-xl px-5 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/5"
              }
            >
              {m === "desc" ? "내림차순" : "오름차순"}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            문제 {problem.label}
          </p>
          <p className="mt-1.5 font-mono text-lg font-bold tracking-wide text-white sm:text-xl">
            {problemText}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            x에 대하여 <b className="text-cyan-200">{mode === "desc" ? "내림차순" : "오름차순"}</b>으로 정리하세요.
          </p>
        </div>
      </div>

      {/* ─── 풀 영역 ─── */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          📦 항 카드
        </p>
        <div
          onDragOver={allowDrop}
          onDrop={onPoolDrop}
          className="flex min-h-[64px] flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.03] p-3"
        >
          {pool.length === 0 ? (
            <span className="px-2 text-sm italic text-slate-500">
              모든 카드를 슬롯에 옮겼습니다. 이제 ✅ 확인을 눌러 보세요.
            </span>
          ) : (
            pool.map((card) => (
              <CardChip
                key={card.id}
                term={card}
                onClick={() => handleCardClick(card, "pool")}
                onDragStart={onDragStart(card.id, "pool")}
              />
            ))
          )}
        </div>
      </div>

      {/* ─── 슬롯 영역 ─── */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          🎯 정렬 칸
        </p>
        <div className="flex flex-wrap gap-2">
          {slots.map((card, i) => {
            const flash = slotFlash[i];
            const base =
              "relative flex min-h-[64px] min-w-[100px] flex-1 items-center justify-center rounded-2xl border-2 border-dashed p-2 text-xs transition";
            const tone =
              flash === "ok"
                ? "border-emerald-400/70 bg-emerald-400/15"
                : flash === "ng"
                ? "border-rose-400/70 bg-rose-400/15"
                : card
                ? "border-white/20 bg-white/[0.04]"
                : "border-white/10 bg-white/[0.02]";
            return (
              <div
                key={i}
                onDragOver={allowDrop}
                onDrop={onSlotDrop(i)}
                className={`${base} ${tone}`}
              >
                <span className="absolute left-2 top-1.5 font-mono text-[10px] font-bold text-slate-500">
                  {i + 1}번
                </span>
                {card ? (
                  <CardChip
                    term={card}
                    onClick={() => handleCardClick(card, i)}
                    onDragStart={onDragStart(card.id, i)}
                  />
                ) : (
                  <span className="text-slate-500">놓을 곳</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 힌트 ─── */}
      {hintShown ? (
        <div className="mt-4 rounded-2xl border border-amber-400/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <span className="font-bold">정답 미리보기:</span>{" "}
          <span className="font-mono">{answerOrdered}</span>
        </div>
      ) : null}

      {/* ─── 피드백 ─── */}
      {feedback ? (
        <p
          className={
            "mt-4 text-center text-base font-bold " +
            (feedback.tone === "ok"
              ? "text-emerald-300"
              : feedback.tone === "ng"
              ? "text-rose-300"
              : feedback.tone === "hint"
              ? "text-amber-200"
              : "text-slate-200")
          }
        >
          {feedback.message}
        </p>
      ) : null}

      {/* ─── 버튼 ─── */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={handleCheck}
          disabled={!allFilled || solved}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          ✅ 확인
        </button>
        <button
          type="button"
          onClick={handleHint}
          className="rounded-xl border border-amber-400/45 bg-amber-400/10 px-5 py-2 text-sm font-bold text-amber-200 transition hover:bg-amber-400/20"
        >
          💡 힌트
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↻ 초기화
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!solved}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          ➡️ 다음 문제
        </button>
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 카드 칩 ───────────────────────────────────────────────
function CardChip({
  term,
  onClick,
  onDragStart,
}: {
  term: Term;
  onClick: () => void;
  onDragStart: () => void;
}) {
  const t = degTone(term.deg);
  return (
    <button
      type="button"
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      className={`group inline-flex min-w-[68px] cursor-grab items-center justify-center rounded-xl border-2 px-3.5 py-2 font-mono text-base font-extrabold shadow-md transition active:cursor-grabbing active:scale-95 hover:-translate-y-0.5 hover:shadow-lg ${t.box} ${t.text}`}
      title={`${term.deg}차항 — 클릭/드래그로 이동`}
    >
      {term.text}
    </button>
  );
}
