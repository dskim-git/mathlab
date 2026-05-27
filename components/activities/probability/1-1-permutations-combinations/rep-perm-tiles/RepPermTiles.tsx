"use client";

import { useEffect, useMemo, useState } from "react";
import Quiz, { type QuizItem } from "@/components/activities/Quiz";
import ReflectionForm from "@/components/activities/ReflectionForm";
import { sup, useCountUp } from "@/lib/activities/anim";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899"];
const NAMES = ["빨강", "파랑", "초록", "주황", "보라", "분홍"];

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "base_vs_exp",
    prompt:
      "칸 수 n을 1 늘릴 때와 색의 수 k를 1 늘릴 때, 경우의 수(kⁿ)의 변화는 어떻게 다른가요? 한 가지 예를 들어 설명해 보세요.",
    kind: "text",
    placeholder: "예: n을 늘리면 …배가 되고, k를 늘리면 …",
  },
];

const QUIZ: QuizItem[] = [
  {
    q: "빨강·파랑·초록·노랑 4가지 색 타일을 5칸에 배열할 때(같은 색 반복 허용), 첫 칸과 마지막 칸의 색이 서로 같아야 한다면 가능한 배열은 모두 몇 가지인지 구하시오.",
    answer: "256",
    hint: "첫 칸 4가지, 가운데 3칸 각 4가지, 마지막 칸은 첫 칸과 같아 1가지.",
    solution: "4 × 4³ × 1 = 4⁴ = 256가지입니다.",
  },
  {
    q: "빨강·파랑·초록 3가지 색 타일을 4칸에 배열할 때, 빨간색 타일이 하나도 없는 배열의 수를 구하시오.",
    answer: "16",
    hint: "빨강을 빼면 2가지 색만 사용합니다.",
    solution: "파랑·초록 2가지만 사용 → 2⁴ = 16가지입니다.",
  },
  {
    q: "3가지 색(빨강·파랑·초록) 타일을 4칸에 배열할 때, 인접한 두 칸의 색이 절대 같지 않으려면 몇 가지 배열이 가능한지 구하시오.",
    answer: "24",
    hint: "첫 칸 3가지, 이후 각 칸은 직전 칸과 달라야 하므로 2가지씩.",
    solution: "3 × 2 × 2 × 2 = 3 × 2³ = 24가지입니다.",
  },
];

function* cartesian(k: number, n: number): Generator<number[]> {
  if (n === 0) {
    yield [];
    return;
  }
  for (const rest of cartesian(k, n - 1)) {
    for (let i = 0; i < k; i++) yield [i, ...rest];
  }
}

export default function RepPermTiles() {
  const [k, setK] = useState(3);
  const [n, setN] = useState(3);
  const [build, setBuild] = useState<number[]>([0, 1, 2]);

  const total = useMemo(() => Math.pow(k, n), [k, n]);
  const totalCount = useCountUp(total);

  useEffect(() => {
    setBuild((prev) =>
      Array.from({ length: n }, (_, i) => Math.min(prev[i] ?? 0, k - 1))
    );
  }, [n, k]);

  const MAX_LIST = 300;
  const arrangements = useMemo(() => {
    const out: number[][] = [];
    for (const combo of cartesian(k, n)) {
      if (out.length >= MAX_LIST) break;
      out.push(combo);
    }
    return out;
  }, [k, n]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 중복순열</p>
        <h3 className="mt-2 text-2xl font-bold">🎨 색깔 타일 배열기</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-cyan-200">k</b>가지 색 타일을 같은 색 반복을 허용해{" "}
          <b className="text-cyan-200">n</b>칸에 나열하면 경우의 수는{" "}
          <b className="text-cyan-200">kⁿ</b>.
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="tile-k" className="text-sm font-semibold text-slate-200">
              색깔 수 k
            </label>
            <span className="rounded-lg bg-cyan-300 px-3 py-0.5 text-sm font-extrabold text-slate-950">
              {k}
            </span>
          </div>
          <input
            id="tile-k"
            type="range"
            min={2}
            max={6}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="mt-2 w-full accent-cyan-400"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="tile-n" className="text-sm font-semibold text-slate-200">
              칸 수 n
            </label>
            <span className="rounded-lg bg-cyan-300 px-3 py-0.5 text-sm font-extrabold text-slate-950">
              {n}
            </span>
          </div>
          <input
            id="tile-n"
            type="range"
            min={1}
            max={5}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="mt-2 w-full accent-cyan-400"
          />
        </div>
      </div>

      {/* 팔레트 */}
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">팔레트</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Array.from({ length: k }).map((_, i) => (
            <span
              key={i}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white/15 text-[10px] font-bold text-white/90"
              style={{ background: COLORS[i] }}
              title={NAMES[i]}
            >
              {NAMES[i][0]}
            </span>
          ))}
        </div>
      </div>

      {/* 배열 만들기 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">배열 만들기</p>
          <span className="text-xs text-slate-500">칸을 눌러 색 바꾸기</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {build.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                setBuild((prev) => prev.map((v, idx) => (idx === i ? (v + 1) % k : v)))
              }
              className="h-12 w-12 rounded-xl border-2 border-white/15 transition hover:scale-105"
              style={{ background: COLORS[c] }}
              aria-label={`${i + 1}번째 칸 (현재 ${NAMES[c]})`}
            />
          ))}
        </div>
      </div>

      {/* 공식 + 카운트업 */}
      <div className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-950/20 p-5 text-center">
        <div className="text-lg font-bold text-cyan-100">
          {k}
          {sup(n)} 가지
        </div>
        <div className="mt-2 text-4xl font-black text-white tabular-nums">
          {totalCount.toLocaleString()}
          <span className="ml-1 text-xl font-bold text-slate-400">가지</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {k}가지 색을 중복 허용하여 {n}칸을 배열하는 경우의 수
        </p>
      </div>

      {/* 전체 배열 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-semibold text-slate-200">
          전체 배열{" "}
          <span className="text-xs font-normal text-slate-500">
            {total > MAX_LIST
              ? `(처음 ${MAX_LIST}개)`
              : `(${total.toLocaleString()}가지 전체)`}
          </span>
        </p>
        <div className="mt-3 flex max-h-80 flex-col gap-1.5 overflow-y-auto">
          {arrangements.map((combo, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-8 text-right text-[10px] text-slate-500">{i + 1}</span>
              {combo.map((ci, j) => (
                <span
                  key={j}
                  className="h-7 w-7 rounded-md border border-white/10"
                  style={{ background: COLORS[ci] }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <Quiz items={QUIZ} />
      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
