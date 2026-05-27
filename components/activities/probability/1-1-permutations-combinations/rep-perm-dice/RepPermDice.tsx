"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Quiz, { type QuizItem } from "@/components/activities/Quiz";
import ReflectionForm from "@/components/activities/ReflectionForm";
import { sup, useCountUp } from "@/lib/activities/anim";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "other_dice",
    prompt:
      "주사위가 6면이 아니라 4면(정사면체)이나 12면이라면, n번 던질 때 경우의 수는 어떻게 될까요? 식으로 써 보세요.",
    kind: "text",
    placeholder: "예: m면 주사위를 n번 던지면 …",
  },
];

const QUIZ: QuizItem[] = [
  {
    q: "주사위를 3번 던질 때, 나온 세 수의 합이 3이 되는 경우의 수를 구하시오.",
    answer: "1",
    hint: "각 수가 1 이상이므로 세 수의 합이 3이 되는 경우를 생각해 보세요.",
    solution: "각 수가 1~6의 자연수이고 합이 3 → (1, 1, 1)의 1가지뿐입니다.",
  },
  {
    q: "주사위 2개를 동시에 던질 때, 두 눈의 곱이 홀수인 경우의 수를 구하시오.",
    answer: "9",
    hint: "곱이 홀수이려면 두 눈 모두 홀수(1, 3, 5)여야 합니다.",
    solution: "두 눈 모두 홀수 → 3 × 3 = 9가지입니다.",
  },
  {
    q: "주사위를 4번 던져서 나온 4개의 수의 곱이 짝수가 되는 경우의 수를 구하시오.",
    answer: "1215",
    hint: "여사건(4개 모두 홀수)을 빼는 것이 편리합니다.",
    solution: "전체 6⁴ = 1296, 모두 홀수 3⁴ = 81 → 1296 − 81 = 1215가지입니다.",
  },
];

function* cartesian6(n: number): Generator<number[]> {
  if (n === 0) {
    yield [];
    return;
  }
  for (const rest of cartesian6(n - 1)) {
    for (let i = 0; i < 6; i++) yield [i, ...rest];
  }
}

export default function RepPermDice() {
  const [n, setN] = useState(2);
  const [reel, setReel] = useState<number[]>([0, 0]);
  const [rolling, setRolling] = useState(false);
  const rollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = useMemo(() => Math.pow(6, n), [n]);
  const totalCount = useCountUp(total);

  useEffect(() => {
    setReel((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? 0));
  }, [n]);

  useEffect(() => () => {
    if (rollRef.current) clearInterval(rollRef.current);
  }, []);

  function roll() {
    if (rollRef.current) clearInterval(rollRef.current);
    setRolling(true);
    const start = performance.now();
    rollRef.current = setInterval(() => {
      setReel((prev) => prev.map(() => Math.floor(Math.random() * 6)));
      if (performance.now() - start > 800) {
        if (rollRef.current) clearInterval(rollRef.current);
        rollRef.current = null;
        setReel(Array.from({ length: n }, () => Math.floor(Math.random() * 6)));
        setRolling(false);
      }
    }, 70);
  }

  const MAX_LIST = 300;
  const results = useMemo(() => {
    const out: number[][] = [];
    for (const combo of cartesian6(n)) {
      if (out.length >= MAX_LIST) break;
      out.push(combo);
    }
    return out;
  }, [n]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 중복순열</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 주사위 연속 던지기와 중복순열</h3>
        <p className="mt-2 leading-7 text-slate-300">
          주사위를 <b className="text-cyan-200">n</b>번 던지면 매번 1~6 중 하나(중복 허용) →
          전체 경우의 수는 <b className="text-cyan-200">₆Πₙ = 6ⁿ</b>.
        </p>
      </div>

      {/* 던지는 횟수 */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <label htmlFor="dice-n" className="text-sm font-semibold text-slate-200">
            던지는 횟수 n
          </label>
          <span className="rounded-lg bg-cyan-300 px-3 py-0.5 text-sm font-extrabold text-slate-950">
            {n}
          </span>
        </div>
        <input
          id="dice-n"
          type="range"
          min={1}
          max={5}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="mt-2 w-full accent-cyan-400"
        />
      </div>

      {/* 던지기 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-200">한 번 던져 보기</p>
          <button
            type="button"
            onClick={roll}
            disabled={rolling}
            className="rounded-full bg-cyan-300 px-4 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
          >
            🎲 던지기
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {reel.map((d, i) => (
            <div
              key={i}
              className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 bg-slate-950 text-4xl leading-none transition ${
                rolling ? "border-cyan-300/70 text-cyan-200" : "border-white/15 text-white"
              }`}
            >
              {FACES[d]}
            </div>
          ))}
        </div>
      </div>

      {/* 공식 + 카운트업 */}
      <div className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-950/20 p-5 text-center">
        <div className="text-lg font-bold text-cyan-100">
          ₆Π
          <sub>{n}</sub> = 6{sup(n)}
        </div>
        <div className="mt-2 text-4xl font-black text-white tabular-nums">
          {totalCount.toLocaleString()}
          <span className="ml-1 text-xl font-bold text-slate-400">가지</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          주사위를 {n}번 던질 때 나올 수 있는 결과의 수
        </p>
      </div>

      {/* 모든 결과 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-semibold text-slate-200">
          모든 결과{" "}
          <span className="text-xs font-normal text-slate-500">
            {total > MAX_LIST
              ? `(처음 ${MAX_LIST}개)`
              : `(${total.toLocaleString()}가지 전체)`}
          </span>
        </p>
        <div className="mt-3 flex max-h-80 flex-wrap gap-2 overflow-y-auto">
          {results.map((combo, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xl leading-none"
              title={combo.map((c) => c + 1).join(", ")}
            >
              {combo.map((c, j) => (
                <span key={j}>{FACES[c]}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <Quiz items={QUIZ} />
      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
