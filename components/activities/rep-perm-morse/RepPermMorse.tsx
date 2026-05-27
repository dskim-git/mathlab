"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Quiz, { type QuizItem } from "@/components/activities/Quiz";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};
function sup(n: number): string {
  return String(n).split("").map((c) => SUP[c] ?? c).join("");
}

function useCountUp(target: number, duration = 450): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// 한 신호(점=0/선=1 배열)를 점·선 모양으로 렌더.
function Signal({ bits }: { bits: number[] }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {bits.map((b, i) =>
        b === 0 ? (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#67e8f9]"
          />
        ) : (
          <span
            key={i}
            className="h-2.5 w-6 rounded-full bg-pink-400 shadow-[0_0_6px_#f472b6]"
          />
        )
      )}
    </span>
  );
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "three_symbols",
    prompt:
      "점·선 2가지가 아니라 3가지 기호(점·선·공백)를 쓴다면 n자리 신호는 몇 가지가 될까요? 식으로 설명해 보세요.",
    kind: "text",
    placeholder: "예: 각 자리마다 3가지 중 하나를 고르므로 …",
  },
];

const QUIZ: QuizItem[] = [
  {
    q: "점(·)과 선(−) 2가지 기호로 길이 1~4의 신호를 모두 만들 때, 서로 다른 신호는 모두 몇 가지인지 구하시오. (길이 1·2·3·4를 모두 합산)",
    answer: "30",
    hint: "길이별로 2¹, 2², 2³, 2⁴ 를 모두 더합니다.",
    solution: "2 + 4 + 8 + 16 = 30가지입니다.",
  },
  {
    q: "점·선에 '공백(□)'을 추가한 3가지 기호로 길이 4짜리 신호를 만들 때, 경우의 수는 모두 몇 가지인지 구하시오.",
    answer: "81",
    hint: "3가지 기호를 4자리에 중복 허용하여 나열합니다.",
    solution: "3⁴ = 81가지입니다.",
  },
  {
    q: "점·선 2가지 기호로 n자리 신호를 만들 때, 경우의 수가 처음으로 100을 넘는 n의 값을 구하시오.",
    answer: "7",
    hint: "2ⁿ > 100 을 만족하는 가장 작은 n.",
    solution: "2⁶ = 64 ≤ 100, 2⁷ = 128 > 100 → n = 7.",
  },
];

function* cartesian2(n: number): Generator<number[]> {
  if (n === 0) {
    yield [];
    return;
  }
  for (const rest of cartesian2(n - 1)) {
    for (const s of [0, 1]) yield [s, ...rest];
  }
}

export default function RepPermMorse() {
  const [n, setN] = useState(3);
  const [bits, setBits] = useState<number[]>([0, 1, 0]);
  const total = useMemo(() => Math.pow(2, n), [n]);
  const totalCount = useCountUp(total);

  // 자릿수가 바뀌면 "신호 만들기" 길이 동기화.
  useEffect(() => {
    setBits((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? 0));
  }, [n]);

  const allSignals = useMemo(() => Array.from(cartesian2(n)), [n]);

  function toggle(i: number) {
    setBits((prev) => prev.map((b, idx) => (idx === i ? (b === 0 ? 1 : 0) : b)));
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 중복순열</p>
        <h3 className="mt-2 text-2xl font-bold">📡 모스 부호와 중복순열</h3>
        <p className="mt-2 leading-7 text-slate-300">
          모스 부호는 <b className="text-cyan-200">점(·)</b>과{" "}
          <b className="text-pink-300">선(−)</b> 2가지 기호만 씁니다. n자리 신호는 2가지를
          중복 허용하여 나열 → <b className="text-cyan-200">₂Πₙ = 2ⁿ</b>.
        </p>
      </div>

      {/* 신호 길이 */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <label htmlFor="morse-n" className="text-sm font-semibold text-slate-200">
            신호 길이 n
          </label>
          <span className="rounded-lg bg-cyan-300 px-3 py-0.5 text-sm font-extrabold text-slate-950">
            {n}
          </span>
        </div>
        <input
          id="morse-n"
          type="range"
          min={1}
          max={6}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="mt-2 w-full accent-cyan-400"
        />
      </div>

      {/* 신호 만들기 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">신호 만들기</p>
          <span className="text-xs text-slate-500">칸을 눌러 점 ↔ 선 전환</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {bits.map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/15 bg-slate-950 transition hover:border-cyan-300/60"
              aria-label={`${i + 1}번째 기호 (현재 ${b === 0 ? "점" : "선"})`}
            >
              {b === 0 ? (
                <span className="h-4 w-4 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
              ) : (
                <span className="h-3.5 w-9 rounded-full bg-pink-400 shadow-[0_0_8px_#f472b6]" />
              )}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" /> 점 (·)
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-6 rounded-full bg-pink-400" /> 선 (−)
          </span>
        </div>
      </div>

      {/* 공식 + 카운트업 */}
      <div className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-950/20 p-5 text-center">
        <div className="text-lg font-bold text-cyan-100">
          ₂Π
          <sub>{n}</sub> = 2{sup(n)}
        </div>
        <div className="mt-2 text-4xl font-black text-white tabular-nums">
          {totalCount.toLocaleString()}
          <span className="ml-1 text-xl font-bold text-slate-400">가지</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          2가지 기호를 중복 허용하여 {n}자리를 나열하는 경우의 수
        </p>
      </div>

      {/* 모든 신호 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-semibold text-slate-200">
          모든 신호 <span className="text-cyan-300">{total}가지</span>
        </p>
        <div className="mt-3 flex max-h-72 flex-wrap gap-2 overflow-y-auto">
          {allSignals.map((sig, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2"
              title={sig.map((s) => (s === 0 ? "·" : "−")).join("")}
            >
              <Signal bits={sig} />
            </span>
          ))}
        </div>
      </div>

      <Quiz items={QUIZ} />
      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
