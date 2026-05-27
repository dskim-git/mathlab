"use client";

import { useMemo, useState } from "react";
import Quiz, { type QuizItem } from "@/components/activities/Quiz";
import ReflectionForm from "@/components/activities/ReflectionForm";
import { useCountUp } from "@/lib/activities/anim";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

type Axis = "x" | "y" | "z";
const MOVES: { key: Axis; arrow: string; label: string; hex: string }[] = [
  { key: "x", arrow: "→", label: "가로", hex: "#22d3ee" },
  { key: "y", arrow: "↑", label: "세로", hex: "#f472b6" },
  { key: "z", arrow: "➚", label: "높이", hex: "#f59e0b" },
];
const ARROW: Record<Axis, string> = { x: "→", y: "↑", z: "➚" };
const MHEX: Record<Axis, string> = { x: "#22d3ee", y: "#f472b6", z: "#f59e0b" };

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "edge_growth",
    prompt:
      "한 변의 길이를 2에서 3으로 늘리면(2×2×2 → 3×3×3) 최단경로의 수가 크게 늘어납니다. 같은 것이 있는 순열 공식과 연결해 그 이유를 설명해 보세요.",
    kind: "text",
    placeholder: "예: 이동 횟수가 늘면서 n!이 …",
  },
];

const QUIZ: QuizItem[] = [
  {
    q: "한 모서리 길이가 2인 정육면체(2×2×2)에서 한 꼭짓점에서 가장 먼 꼭짓점까지 모서리를 따라가는 최단경로의 수를 구하시오.",
    answer: "90",
    hint: "가로·세로·높이로 각각 2칸씩, 총 6번 이동. 같은 방향 이동을 같은 것으로 보는 순열.",
    solution: "(2+2+2)! / (2!·2!·2!) = 720 / 8 = 90가지입니다.",
  },
  {
    q: "한 모서리 길이가 3인 정육면체(3×3×3)에서 한 꼭짓점에서 가장 먼 꼭짓점까지의 최단경로의 수를 구하시오.",
    answer: "1680",
    hint: "각 방향 3칸씩, 총 9번 이동.",
    solution: "9! / (3!·3!·3!) = 362880 / 216 = 1680가지입니다.",
  },
];

// 이동 다중집합의 서로 다른 순서(= 같은 것이 있는 순열) 생성.
function distinctPaths(a: number, b: number, c: number, cap = 200): Axis[][] {
  const out: Axis[][] = [];
  const cur: Axis[] = [];
  const rem: Record<Axis, number> = { x: a, y: b, z: c };
  const order: Axis[] = ["x", "y", "z"];
  const rec = () => {
    if (out.length >= cap) return;
    if (order.every((k) => rem[k] === 0)) {
      out.push([...cur]);
      return;
    }
    for (const k of order) {
      if (rem[k] > 0) {
        rem[k] -= 1;
        cur.push(k);
        rec();
        cur.pop();
        rem[k] += 1;
      }
    }
  };
  rec();
  return out;
}

export default function CubePathPerm() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(2);
  const [c, setC] = useState(2);
  const [featured, setFeatured] = useState(0);

  const total = a + b + c;
  const count = useMemo(
    () => factorial(total) / (factorial(a) * factorial(b) * factorial(c)),
    [a, b, c, total]
  );
  const countAnim = useCountUp(count);
  const paths = useMemo(() => distinctPaths(a, b, c), [a, b, c]);

  const sliders: { label: string; value: number; set: (v: number) => void; axis: Axis }[] = [
    { label: "가로 a", value: a, set: setA, axis: "x" },
    { label: "세로 b", value: b, set: setB, axis: "y" },
    { label: "높이 c", value: c, set: setC, axis: "z" },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 같은 것이 있는 순열</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 정육면체 최단경로</h3>
        <p className="mt-2 leading-7 text-slate-300">
          한 꼭짓점에서 반대편 꼭짓점까지 모서리를 따라가는 최단경로는 가로·세로·높이
          이동을 나열하는 것 → <b className="text-cyan-200">(a+b+c)! / (a!·b!·c!)</b>.
        </p>
      </div>

      {/* 변 길이 */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {sliders.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <span style={{ color: MHEX[s.axis] }}>{ARROW[s.axis]}</span> {s.label}
              </label>
              <span className="rounded-lg bg-cyan-300 px-3 py-0.5 text-sm font-extrabold text-slate-950">
                {s.value}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={4}
              value={s.value}
              onChange={(e) => {
                s.set(Number(e.target.value));
                setFeatured(0);
              }}
              className="mt-2 w-full accent-cyan-400"
              aria-label={s.label}
            />
          </div>
        ))}
      </div>

      {/* 이동 범례 */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
        {MOVES.map((m) => (
          <span key={m.key} className="flex items-center gap-1.5">
            <span className="text-lg" style={{ color: m.hex }}>
              {m.arrow}
            </span>
            {m.label} {m.key === "x" ? a : m.key === "y" ? b : c}번
          </span>
        ))}
      </div>

      {/* 공식 + 카운트업 */}
      <div className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-950/20 p-5 text-center">
        <div className="text-lg font-bold text-cyan-100">
          {total}! / ({a}!·{b}!·{c}!) ={" "}
          <span className="text-cyan-200">{count.toLocaleString()}</span>
        </div>
        <div className="mt-2 text-4xl font-black text-white tabular-nums">
          {countAnim.toLocaleString()}
          <span className="ml-1 text-xl font-bold text-slate-400">가지</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">최단경로의 수</p>
      </div>

      {/* 한 경로 보기 */}
      {paths.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-200">한 최단경로</p>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <button
                type="button"
                onClick={() => setFeatured((f) => (f - 1 + paths.length) % paths.length)}
                className="rounded-lg border border-white/15 px-3 py-1 transition hover:bg-white/10"
              >
                ◀
              </button>
              <span className="tabular-nums">
                {Math.min(featured, paths.length - 1) + 1} / {paths.length}
              </span>
              <button
                type="button"
                onClick={() => setFeatured((f) => (f + 1) % paths.length)}
                className="rounded-lg border border-white/15 px-3 py-1 transition hover:bg-white/10"
              >
                ▶
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {paths[Math.min(featured, paths.length - 1)].map((mv, i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-950 text-lg font-bold"
                style={{ color: MHEX[mv] }}
              >
                {ARROW[mv]}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* 모든 경로 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-semibold text-slate-200">
          서로 다른 최단경로{" "}
          <span className="text-xs font-normal text-slate-500">
            {count > paths.length ? `(처음 ${paths.length}개)` : `(${paths.length}가지)`}
          </span>
        </p>
        <div className="mt-3 flex max-h-72 flex-col gap-1.5 overflow-y-auto">
          {paths.map((path, i) => (
            <div key={i} className="flex flex-wrap items-center gap-1">
              <span className="w-8 text-right text-[10px] text-slate-500">{i + 1}</span>
              {path.map((mv, j) => (
                <span key={j} className="text-base font-bold" style={{ color: MHEX[mv] }}>
                  {ARROW[mv]}
                </span>
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
