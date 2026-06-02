"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "same_remainder_meaning",
    prompt:
      "이번 활동에서 발견한 사실 — “두 다항식 A, B 를 같은 식으로 나눈 나머지가 같으면 A−B 가 그 식의 배수가 된다 (반대도 성립)” — 가 왜 그렇게 되는지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: A = Q_A·(x²+1) + R₁, B = Q_B·(x²+1) + R₁ 이라 두 식을 빼면 R₁ 끼리는 상쇄되고 (Q_A − Q_B)(x²+1) 만 남는다. 곧 A−B 는 (x²+1) 의 배수.",
  },
  {
    id: "integer_analogy",
    prompt:
      "이 성질은 정수의 합동(mod) 과 같은 원리입니다. 정수 예(예: 7과 3을 4로 나눈 나머지가 같다 → 7−3=4 는 4의 배수)와 다항식 사이의 공통 아이디어를 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 어떤 ‘기준’으로 나눈 나머지가 같다는 것은, 두 양의 차이가 그 기준의 정수배(또는 다항식배)라는 뜻이다. 다항식의 (x²+1) 이 정수의 4 와 같은 역할을 한다.",
  },
];

// ─── 유틸 ───────────────────────────────────────────────────
const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
function sup(n: number) {
  return String(n)
    .split("")
    .map((c) => SUP[Number(c)] ?? c)
    .join("");
}

// 계수 [c_max, ..., c_0] (내림차순) → "x³ − 3x² + 2x + 1"
function polyStr(coeffs: number[]): string {
  // 리딩 0 제거
  const arr = [...coeffs];
  while (arr.length > 1 && arr[0] === 0) arr.shift();
  const n = arr.length;
  const parts: string[] = [];
  arr.forEach((c, i) => {
    if (c === 0) return;
    const exp = n - 1 - i;
    const abs = Math.abs(c);
    const sign = c < 0 ? "−" : parts.length > 0 ? "+" : "";
    const num = abs === 1 && exp > 0 ? "" : String(abs);
    const v = exp === 0 ? "" : exp === 1 ? "x" : `x${sup(exp)}`;
    parts.push(`${sign}${num}${v}`);
  });
  return parts.join(" ") || "0";
}

// ─── 카드 데이터 ───────────────────────────────────────────
type DivStep = { title: string; equation: string; memo: string };
type Card = {
  id: number;
  label: string;
  // 계수 [x³, x², x¹, x⁰]
  coef: number[];
  divSteps: DivStep[];
  // 나머지 [x¹ 계수, x⁰ 계수]
  remainder: [number, number];
};

const CARDS: Card[] = [
  {
    id: 0,
    label: "카드 ①",
    coef: [1, -3, 2, 1],
    remainder: [1, 4],
    divSteps: [
      {
        title: "① 첫 번째 나눗셈",
        equation: "x³ − 3x² + 2x + 1 = x · (x²+1) + (−3x² + x + 1)",
        memo: "x³ ÷ x² = x 이므로 x 를 몫으로 잡고 뺍니다.",
      },
      {
        title: "② 두 번째 나눗셈",
        equation: "−3x² + x + 1 = (−3) · (x²+1) + (x + 4)",
        memo: "−3x² ÷ x² = −3 이므로 −3 을 몫으로 잡고 뺍니다.",
      },
      {
        title: "③ 나눗셈 완료",
        equation: "x³ − 3x² + 2x + 1 = (x − 3)(x²+1) + (x + 4)",
        memo: "나머지 (x+4) 의 차수(1) < (x²+1) 의 차수(2) → 나눗셈 끝!",
      },
    ],
  },
  {
    id: 1,
    label: "카드 ②",
    coef: [1, 0, -1, 0],
    remainder: [-2, 0],
    divSteps: [
      {
        title: "나눗셈 완료",
        equation: "x³ − x = x · (x²+1) + (−2x)",
        memo: "x³ ÷ x² = x 로 한 번만 나누면 끝! 나머지 (−2x) 의 차수(1) < 2.",
      },
    ],
  },
  {
    id: 2,
    label: "카드 ③",
    coef: [2, -4, 0, 0],
    remainder: [-2, 4],
    divSteps: [
      {
        title: "① 첫 번째 나눗셈",
        equation: "2x³ − 4x² = 2x · (x²+1) + (−4x² − 2x)",
        memo: "2x³ ÷ x² = 2x, 빼면 (−4x² − 2x) 가 남습니다.",
      },
      {
        title: "② 두 번째 나눗셈",
        equation: "−4x² − 2x = (−4)(x²+1) + (−2x + 4)",
        memo: "−4x² ÷ x² = −4, 빼면 (−2x + 4) 가 남습니다.",
      },
      {
        title: "③ 나눗셈 완료",
        equation: "2x³ − 4x² = (2x − 4)(x²+1) + (−2x + 4)",
        memo: "나머지 (−2x+4) 의 차수(1) < 2 → 나눗셈 끝!",
      },
    ],
  },
  {
    id: 3,
    label: "카드 ④",
    coef: [1, 0, 1, -1],
    remainder: [0, -1],
    divSteps: [
      {
        title: "나눗셈 완료",
        equation: "x³ + x − 1 = x · (x²+1) + (−1)",
        memo: "x³ ÷ x² = x 로 한 번만 나누면 끝! 나머지 (−1) 의 차수(0) < 2.",
      },
    ],
  },
  {
    id: 4,
    label: "카드 ⑤",
    coef: [1, 0, 0, 1],
    remainder: [-1, 1],
    divSteps: [
      {
        title: "나눗셈 완료",
        equation: "x³ + 1 = x · (x²+1) + (−x + 1)",
        memo: "x³ ÷ x² = x 로 한 번만 나누면 끝! 나머지 (−x+1) 의 차수(1) < 2.",
      },
    ],
  },
  {
    id: 5,
    label: "카드 ⑥",
    coef: [1, 1, 0, 1],
    remainder: [-1, 0],
    divSteps: [
      {
        title: "① 첫 번째 나눗셈",
        equation: "x³ + x² + 1 = x · (x²+1) + (x² − x + 1)",
        memo: "x³ ÷ x² = x, 빼면 (x² − x + 1) 이 남습니다.",
      },
      {
        title: "② 두 번째 나눗셈",
        equation: "x² − x + 1 = 1 · (x²+1) + (−x)",
        memo: "x² ÷ x² = 1, 빼면 (−x) 가 남습니다.",
      },
      {
        title: "③ 나눗셈 완료",
        equation: "x³ + x² + 1 = (x + 1)(x²+1) + (−x)",
        memo: "나머지 (−x) 의 차수(1) < 2 → 나눗셈 끝!",
      },
    ],
  },
];

function r1Str(card: Card): string {
  return polyStr(card.remainder);
}

// ─── 메인 ───────────────────────────────────────────────────
type Phase = 1 | 2 | 3 | 4;

export default function RemainderSameExpressions() {
  const [phase, setPhase] = useState<Phase>(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // B 빌더 4개: {a,b,c} 계수 입력 + 확정 상태
  const [bInputs, setBInputs] = useState<{ a: string; b: string; c: string }[]>(() =>
    Array.from({ length: 4 }, () => ({ a: "1", b: "0", c: "0" })),
  );
  const [bConfirmed, setBConfirmed] = useState<boolean[]>(() => new Array(4).fill(false));
  const [revealed, setRevealed] = useState(false);

  const selected = selectedId === null ? null : CARDS[selectedId];

  function reset() {
    setPhase(1);
    setSelectedId(null);
    setBInputs(Array.from({ length: 4 }, () => ({ a: "1", b: "0", c: "0" })));
    setBConfirmed(new Array(4).fill(false));
    setRevealed(false);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* 헤더 */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">🃏 나머지가 같은 식 탐험</h3>
        <p className="mt-2 leading-7 text-slate-300">
          6장의 다항식 카드에서 한 장을 뽑아 <b className="text-cyan-200">x²+1</b> 로 나눈 나머지를
          구한 뒤, <b className="text-cyan-200">나머지가 같은 식 B</b> 를 4개 만들어 보고{" "}
          <b className="text-cyan-200">A − B</b> 의 나머지가 어떻게 되는지 직접 탐구해 보세요.
        </p>
      </div>

      {/* 진행 + Phase Bar */}
      <div className="mt-5 flex items-center gap-3">
        <ProgressBar phase={phase} />
        <span className="rounded-full border border-violet-400/45 bg-violet-400/15 px-4 py-1 font-mono text-sm font-bold text-violet-100">
          단계 {phase} / 4
        </span>
      </div>

      <PhaseBar phase={phase} onJump={(p) => {
        // 뒤로 이동 가능 (앞 단계 잠금)
        if (p < phase) setPhase(p);
      }} />

      <div className="mt-4">
        {phase === 1 ? (
          <Phase1
            selectedId={selectedId}
            onSelect={setSelectedId}
            onNext={() => setPhase(2)}
            onResetCard={() => setSelectedId(null)}
          />
        ) : phase === 2 && selected ? (
          <Phase2
            card={selected}
            onPrev={() => setPhase(1)}
            onNext={() => setPhase(3)}
          />
        ) : phase === 3 && selected ? (
          <Phase3
            card={selected}
            bInputs={bInputs}
            bConfirmed={bConfirmed}
            onInputChange={(i, key, v) =>
              setBInputs((arr) =>
                arr.map((b, k) => (k === i ? { ...b, [key]: v } : b)),
              )
            }
            onConfirm={(i) =>
              setBConfirmed((arr) => arr.map((v, k) => (k === i ? true : v)))
            }
            onPrev={() => setPhase(2)}
            onNext={() => setPhase(4)}
          />
        ) : phase === 4 && selected ? (
          <Phase4
            card={selected}
            bInputs={bInputs}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onPrev={() => setPhase(3)}
            onReset={reset}
          />
        ) : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function ProgressBar({ phase }: { phase: Phase }) {
  const ratio = (phase - 1) / 3;
  return (
    <svg
      viewBox="0 0 100 4"
      preserveAspectRatio="none"
      className="h-2 flex-1"
      role="img"
      aria-label={`진행률 ${Math.round(ratio * 100)}%`}
    >
      <defs>
        <linearGradient id="rseProgGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="0" y="0" width={ratio * 100} height="4" rx="2" fill="url(#rseProgGrad)" />
    </svg>
  );
}

function PhaseBar({ phase, onJump }: { phase: Phase; onJump: (p: Phase) => void }) {
  const labels = ["카드 뽑기", "R₁ 구하기", "B 만들기", "패턴 발견"];
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      {([1, 2, 3, 4] as Phase[]).map((p, i) => {
        const isCur = phase === p;
        const isDone = phase > p;
        const dotCls = isCur
          ? "scale-110 border-violet-300 bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/40"
          : isDone
          ? "border-cyan-400/55 bg-cyan-400/20 text-cyan-100"
          : "border-white/15 bg-white/5 text-slate-400";
        return (
          <span key={p} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onJump(p)}
              disabled={p > phase}
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition disabled:cursor-not-allowed ${dotCls}`}
              aria-label={`단계 ${p}`}
            >
              {p}
            </button>
            <span
              className={
                "text-xs font-bold " +
                (isCur ? "text-violet-100" : isDone ? "text-cyan-200" : "text-slate-500")
              }
            >
              {labels[i]}
            </span>
            {i < 3 ? (
              <span
                className={
                  "mx-1 h-0.5 w-6 rounded-full " +
                  (isDone ? "bg-cyan-400/60" : "bg-white/15")
                }
                aria-hidden
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

// ─── Phase 1: 카드 뽑기 ────────────────────────────────────
function Phase1({
  selectedId,
  onSelect,
  onNext,
  onResetCard,
}: {
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNext: () => void;
  onResetCard: () => void;
}) {
  return (
    <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.04] p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
        🃏 단계 1 · 다항식 카드 뽑기
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-300">
        아래 6장의 카드 중 한 장을 클릭하여 뒤집어 보세요. 뒤집힌 카드의 다항식이 오늘의 탐구
        대상 <b className="text-cyan-200">A</b> 입니다.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CARDS.map((card) => {
          const isSelected = card.id === selectedId;
          const isDisabled = selectedId !== null && !isSelected;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              disabled={isDisabled}
              className={
                "relative h-[120px] overflow-hidden rounded-2xl border-2 transition disabled:cursor-not-allowed " +
                (isSelected
                  ? "border-amber-400/70 bg-gradient-to-br from-violet-700/40 to-indigo-900/40 shadow-xl shadow-amber-400/20"
                  : isDisabled
                  ? "border-white/10 bg-white/[0.03] opacity-40"
                  : "border-sky-400/45 bg-gradient-to-br from-sky-700/30 to-indigo-900/40 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg")
              }
              aria-label={card.label}
            >
              {isSelected ? (
                <div className="flex h-full flex-col items-center justify-center gap-1 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300">
                    {card.label}
                  </span>
                  <span className="font-mono text-base font-bold text-violet-100">
                    {polyStr(card.coef)}
                  </span>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1">
                  <span
                    className="bg-gradient-to-br from-sky-300 to-violet-300 bg-clip-text text-3xl font-extrabold text-transparent"
                  >
                    {card.id + 1}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    POLYNOMIAL CARD
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedId !== null ? (
        <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-100">
          ✅ <b>{CARDS[selectedId].label}</b> 을(를) 선택했습니다! &nbsp;
          A = <b className="font-mono text-amber-300">{polyStr(CARDS[selectedId].coef)}</b>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onResetCard}
          disabled={selectedId === null}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↩ 다시 선택
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={selectedId === null}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          다음 단계 → 나머지 구하기
        </button>
      </div>
    </div>
  );
}

// ─── Phase 2: R₁ 구하기 ───────────────────────────────────
function Phase2({
  card,
  onPrev,
  onNext,
}: {
  card: Card;
  onPrev: () => void;
  onNext: () => void;
}) {
  const total = card.divSteps.length;
  const [step, setStep] = useState(0);
  const isLast = step === total - 1;

  return (
    <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.04] p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-sky-300">
        ✏️ 단계 2 · A 를 (x²+1) 로 나누어 나머지 R₁ 구하기
      </p>

      <div className="mt-3 rounded-xl border border-amber-400/35 bg-amber-400/[0.06] px-3 py-2 text-sm text-amber-100">
        선택한 카드:{" "}
        <b>
          {card.label} &nbsp;|&nbsp; A ={" "}
          <span className="font-mono text-amber-300">{polyStr(card.coef)}</span>
        </b>
      </div>

      {/* 단계 도트 */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={
              "inline-block h-2.5 w-2.5 rounded-full " +
              (i < step
                ? "bg-cyan-400/70"
                : i === step
                ? "bg-violet-400 shadow-md shadow-violet-400/40"
                : "bg-white/15")
            }
            aria-hidden
          />
        ))}
        <span className="ml-2 text-xs text-slate-400">
          ({step + 1} / {total} 단계)
        </span>
      </div>

      {/* 본 단계 */}
      <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-sm font-bold text-cyan-200">{card.divSteps[step].title}</p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-violet-400/30 bg-violet-400/[0.06] px-4 py-3 text-center font-mono text-base font-bold text-violet-100">
          {card.divSteps[step].equation}
        </div>
        <p className="mt-3 text-sm text-amber-200">💡 {card.divSteps[step].memo}</p>
      </div>

      {/* 마지막 단계: R₁ 결과 */}
      {isLast ? (
        <div className="mt-3 rounded-xl border border-rose-400/40 bg-rose-400/10 p-3 text-sm text-rose-100">
          🎯 <b>최종 나머지 R₁ =</b>{" "}
          <span className="ml-2 font-mono text-base font-extrabold text-amber-300">
            {r1Str(card)}
          </span>
        </div>
      ) : null}

      {/* 네비 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ◀ 이전
        </button>
        <button
          type="button"
          onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
          disabled={isLast}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          다음 ▶
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            ← 이전 단계
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!isLast}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            다음 단계 → B 다항식 만들기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Phase 3: B 만들기 ────────────────────────────────────
type BInput = { a: string; b: string; c: string };

// B = (ax² + bx + c)(x²+1) + R₁
// (ax²+bx+c)(x²+1) = ax⁴ + bx³ + (a+c)x² + bx + c
// + R₁ = (r_x · x + r_0)
// → B 계수 [x⁴, x³, x², x¹, x⁰]:
//   [a, b, a+c, b + r_x, c + r_0]
function computeBCoef(card: Card, ai: number, bi: number, ci: number): number[] {
  const [rx, r0] = card.remainder;
  return [ai, bi, ai + ci, bi + rx, ci + r0];
}

function Phase3({
  card,
  bInputs,
  bConfirmed,
  onInputChange,
  onConfirm,
  onPrev,
  onNext,
}: {
  card: Card;
  bInputs: BInput[];
  bConfirmed: boolean[];
  onInputChange: (i: number, key: "a" | "b" | "c", v: string) => void;
  onConfirm: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const allDone = bConfirmed.every(Boolean);
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.04] p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
        🔧 단계 3 · 나머지가 같은 B 다항식 4 개 만들기
      </p>
      <div className="mt-3 rounded-xl border border-sky-400/35 bg-sky-400/[0.06] px-4 py-3 text-sm leading-7 text-slate-200">
        💡 나머지가 같은 다항식을 만들려면? <br />
        <b className="text-cyan-200">B = (ax² + bx + c)(x²+1) + R₁</b> 형태로 만들면 됩니다.
        아래에서 a, b, c 를 마음대로 정해 4 개의 B 를 완성하세요.
      </div>
      <p className="mt-2 text-sm">
        A ={" "}
        <b className="font-mono text-amber-300">{polyStr(card.coef)}</b>, &nbsp; R₁ ={" "}
        <b className="font-mono text-amber-300">{r1Str(card)}</b>
      </p>

      <div className="mt-4 space-y-3">
        {bInputs.map((bi, i) => (
          <BBuilder
            key={i}
            idx={i}
            card={card}
            input={bi}
            confirmed={bConfirmed[i]}
            onInputChange={onInputChange}
            onConfirm={onConfirm}
          />
        ))}
      </div>

      {allDone ? (
        <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm font-bold text-emerald-200">
          ✅ B 다항식 4 개를 모두 완성했습니다!
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ← 이전 단계
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!allDone}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          다음 단계 → 표 완성하기
        </button>
      </div>
    </div>
  );
}

function BBuilder({
  idx,
  card,
  input,
  confirmed,
  onInputChange,
  onConfirm,
}: {
  idx: number;
  card: Card;
  input: BInput;
  confirmed: boolean;
  onInputChange: (i: number, key: "a" | "b" | "c", v: string) => void;
  onConfirm: (i: number) => void;
}) {
  const ai = Number(input.a) || 0;
  const bi = Number(input.b) || 0;
  const ci = Number(input.c) || 0;
  const coef = useMemo(() => computeBCoef(card, ai, bi, ci), [card, ai, bi, ci]);
  const bStr = polyStr(coef);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-bold text-amber-300">B{idx + 1} 만들기</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <CoefField
          label="a (x²항)"
          value={input.a}
          onChange={(v) => onInputChange(idx, "a", v)}
          disabled={confirmed}
        />
        <span className="font-mono text-base font-extrabold text-slate-400">x²</span>
        <span className="font-mono text-base font-bold text-slate-500">+</span>
        <CoefField
          label="b (x항)"
          value={input.b}
          onChange={(v) => onInputChange(idx, "b", v)}
          disabled={confirmed}
        />
        <span className="font-mono text-base font-extrabold text-slate-400">x</span>
        <span className="font-mono text-base font-bold text-slate-500">+</span>
        <CoefField
          label="c (상수항)"
          value={input.c}
          onChange={(v) => onInputChange(idx, "c", v)}
          disabled={confirmed}
        />
      </div>

      <p className="mt-3 font-mono text-sm text-violet-200">
        B{idx + 1} = <b className="text-cyan-200">{bStr}</b>
      </p>

      {confirmed ? (
        <div className="mt-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
          ✅ B{idx + 1} 확정! 이 다항식을 (x²+1) 로 나누면 나머지 ={" "}
          <b className="font-mono text-amber-300">{r1Str(card)}</b> (= R₁ 과 같음).
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onConfirm(idx)}
          className="mt-2 rounded-lg border border-amber-400/45 bg-amber-400/15 px-4 py-1.5 text-sm font-bold text-amber-100 transition hover:bg-amber-400/25"
        >
          ✔ 이 B{idx + 1} 사용하기
        </button>
      )}
    </div>
  );
}

function CoefField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold text-slate-400">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-[36px] w-[64px] rounded-lg border-2 border-white/15 bg-slate-900/50 text-center font-mono text-base font-bold text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40 disabled:opacity-60"
      />
    </label>
  );
}

// ─── Phase 4: 표 완성 + 패턴 발견 ──────────────────────────
function Phase4({
  card,
  bInputs,
  revealed,
  onReveal,
  onPrev,
  onReset,
}: {
  card: Card;
  bInputs: BInput[];
  revealed: boolean;
  onReveal: () => void;
  onPrev: () => void;
  onReset: () => void;
}) {
  // A 계수 [x⁴, x³, x², x¹, x⁰] (앞에 0 추가)
  const aCoef = [0, ...card.coef];

  const rows = bInputs.map((bi, idx) => {
    const ai = Number(bi.a) || 0;
    const bbi = Number(bi.b) || 0;
    const ci = Number(bi.c) || 0;
    const bCoef = computeBCoef(card, ai, bbi, ci); // 길이 5
    // A − B
    const abCoef = aCoef.map((v, i) => v - bCoef[i]);
    return {
      idx,
      bStr: polyStr(bCoef),
      abStr: polyStr(abCoef),
    };
  });

  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.04] p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
        📊 단계 4 · 표를 완성하고 패턴 발견하기
      </p>
      <div className="mt-3 rounded-xl border border-sky-400/35 bg-sky-400/[0.06] px-4 py-3 text-sm leading-7 text-slate-200">
        A − B 를 (x²+1) 로 나누면 나머지 R₂ 가 어떻게 될까요? 표를 확인하고 규칙을 찾아 보세요.
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-cyan-300">
              {["A", "R₁ (A ÷ (x²+1))", "B", "A − B", "R₂ ((A−B) ÷ (x²+1))"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="border-b border-white/10 px-3 py-2 text-left font-mono text-xs font-bold uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.idx} className="border-b border-white/5 last:border-none">
                <td className="px-3 py-2 font-mono text-amber-200">{polyStr(card.coef)}</td>
                <td className="px-3 py-2 font-mono font-bold text-rose-300">{r1Str(card)}</td>
                <td className="px-3 py-2 font-mono text-violet-200">{r.bStr}</td>
                <td className="px-3 py-2 font-mono text-slate-300">{r.abStr}</td>
                <td className="px-3 py-2 font-mono font-bold text-emerald-300">0</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ← 이전 단계
        </button>
        {!revealed ? (
          <button
            type="button"
            onClick={onReveal}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
          >
            🔍 패턴 발견하기
          </button>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-violet-400/45 bg-violet-400/10 px-4 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/20"
          >
            ↻ 다른 카드로 다시 도전
          </button>
        )}
      </div>

      {revealed ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border-2 border-violet-400/45 bg-gradient-to-br from-violet-500/15 via-indigo-500/15 to-sky-500/15 p-5 text-center">
            <p
              className="bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-xl font-extrabold text-transparent"
            >
              💡 발견한 수학적 규칙!
            </p>
            <p className="mt-3 text-sm leading-7 text-violet-100">
              A 와 B 를 <b className="text-amber-200">(x²+1)</b> 로 나눈 나머지가 같으면 (R₁ 이
              같으면) <br />
              <b className="text-amber-200">A − B 는 항상 (x²+1) 로 나누어 떨어집니다! (R₂ = 0)</b>
            </p>
            <div className="mt-3 inline-block rounded-xl border border-violet-400/40 bg-violet-400/10 px-4 py-3 font-mono text-sm font-bold text-violet-100">
              A ≡ B  (mod  x²+1)  ⟺  (x²+1) | (A − B)
            </div>
            <p className="mt-3 text-xs text-sky-200">
              이것은 정수의 합동(modular arithmetic) 과 같은 원리예요! <br />
              예: 7 과 3 은 4 로 나눈 나머지가 같음 → 7 − 3 = 4 는 4 의 배수!
            </p>
          </div>

          <div className="rounded-2xl border border-amber-400/40 bg-amber-400/[0.06] p-4">
            <p className="text-sm font-bold text-amber-200">🤔 왜 항상 0 일까요?</p>
            <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/40 p-3 font-mono text-sm text-slate-200">
              A = (x²+1) · Q<sub>A</sub>(x) + R₁ <br />
              B = (x²+1) · Q<sub>B</sub>(x) + R₁
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-300">위 두 식을 빼면:</p>
            <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3 font-mono text-sm text-slate-200">
              A − B = (x²+1)(Q<sub>A</sub>(x) − Q<sub>B</sub>(x)) + R₁ − R₁ <br />
              &nbsp;&nbsp;&nbsp;&nbsp; = (x²+1)(Q<sub>A</sub>(x) − Q<sub>B</sub>(x))
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              따라서 A − B 는 (x²+1) 로 <b className="text-emerald-300">나누어 떨어집니다!</b>{" "}
              (나머지 = 0)
            </p>
            <p className="mt-3 rounded-lg border border-amber-400/35 bg-amber-400/[0.06] px-3 py-2 text-sm text-amber-100">
              📌 <b>핵심:</b> 두 다항식의 나머지가 같다 ⟺ 두 다항식의 차가 나누는 식의{" "}
              <b className="text-amber-300">배수</b> 이다!
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
