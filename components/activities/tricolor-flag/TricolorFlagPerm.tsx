"use client";

import { useMemo, useState } from "react";
import Quiz, { type QuizItem } from "@/components/activities/Quiz";
import ReflectionForm from "@/components/activities/ReflectionForm";
import { useCountUp } from "@/lib/activities/anim";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

type ColorKey = "B" | "W" | "R";
const COLOR_DEFS: { key: ColorKey; name: string; hex: string }[] = [
  { key: "B", name: "파랑", hex: "#3b82f6" },
  { key: "W", name: "흰색", hex: "#f8fafc" },
  { key: "R", name: "빨강", hex: "#ef4444" },
];
const HEX: Record<ColorKey, string> = { B: "#3b82f6", W: "#f8fafc", R: "#ef4444" };

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "repeat_effect",
    prompt:
      "같은 색을 1개에서 2개로 늘리면 서로 다른 깃발의 수는 어떻게 변하나요? 공식 n!/(p!q!r!)과 연결해 설명해 보세요.",
    kind: "text",
    placeholder: "예: 같은 색이 늘면 분모가 커져서 …",
  },
];

const QUIZ: QuizItem[] = [
  {
    q: "파랑·흰색·빨강을 각각 1개씩 사용하여 3칸짜리 가로 줄무늬 삼색기를 만들 때, 서로 다른 경우는 몇 가지인지 구하시오.",
    answer: "6",
    hint: "서로 다른 3가지 색을 일렬로 나열하는 순열입니다.",
    solution: "3! = 6가지입니다.",
  },
  {
    q: "파랑 1개, 빨강 2개를 사용하여 3칸짜리 삼색기를 만들 때, 서로 다른 경우는 몇 가지인지 구하시오.",
    answer: "3",
    hint: "같은 것이 있는 순열 n!/(p!q!) 를 사용하세요.",
    solution: "3! / (1!·2!) = 6 / 2 = 3가지 (파·빨·빨, 빨·파·빨, 빨·빨·파).",
  },
  {
    q: "파랑 1개, 흰색 2개, 빨강 1개를 모두 사용하여 4칸짜리 가로 줄무늬 국기를 만들 때, 서로 다른 경우는 모두 몇 가지인지 구하시오.",
    answer: "12",
    hint: "전체 4개 중 흰색이 2개 같으므로 4!/(1!·2!·1!).",
    solution: "4! / (1!·2!·1!) = 24 / 2 = 12가지입니다.",
  },
];

// 같은 것이 있는 순열을 직접 생성(각 자리에서 남은 색 중 하나만 골라 중복 없이).
function distinctFlags(counts: Record<ColorKey, number>, cap = 200): ColorKey[][] {
  const out: ColorKey[][] = [];
  const cur: ColorKey[] = [];
  const order: ColorKey[] = ["B", "W", "R"];
  const rem = { ...counts };
  const rec = () => {
    if (out.length >= cap) return;
    if (order.every((c) => rem[c] === 0)) {
      out.push([...cur]);
      return;
    }
    for (const c of order) {
      if (rem[c] > 0) {
        rem[c] -= 1;
        cur.push(c);
        rec();
        cur.pop();
        rem[c] += 1;
      }
    }
  };
  rec();
  return out;
}

function Flag({ stripes, size = "sm" }: { stripes: ColorKey[]; size?: "sm" | "lg" }) {
  const h = size === "lg" ? "h-24" : "h-12";
  const w = size === "lg" ? "w-40" : "w-20";
  return (
    <div className={`flex ${h} ${w} overflow-hidden rounded-md border border-white/15`}>
      {stripes.map((c, i) => (
        <div key={i} className="flex-1" style={{ background: HEX[c] }} />
      ))}
    </div>
  );
}

export default function TricolorFlagPerm() {
  const [counts, setCounts] = useState<Record<ColorKey, number>>({ B: 1, W: 1, R: 1 });
  const [featured, setFeatured] = useState(0);

  const n = counts.B + counts.W + counts.R;
  const distinct = useMemo(
    () => (n === 0 || n > 8 ? 0 : factorial(n) / (factorial(counts.B) * factorial(counts.W) * factorial(counts.R))),
    [counts, n]
  );
  const distinctCount = useCountUp(distinct);

  const flags = useMemo(
    () => (n === 0 ? [] : distinctFlags(counts)),
    [counts, n]
  );

  function change(key: ColorKey, delta: number) {
    setCounts((prev) => {
      const next = { ...prev, [key]: Math.max(0, Math.min(5, prev[key] + delta)) };
      if (next.B + next.W + next.R > 8) return prev; // 총 8칸 제한
      return next;
    });
    setFeatured(0);
  }

  const denomParts = COLOR_DEFS.filter((c) => counts[c.key] > 0).map(
    (c) => `${counts[c.key]}!`
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 같은 것이 있는 순열</p>
        <h3 className="mt-2 text-2xl font-bold">🏳️ 삼색기와 같은 것이 있는 순열</h3>
        <p className="mt-2 leading-7 text-slate-300">
          같은 색이 섞인 n칸 깃발의 서로 다른 배열 수는{" "}
          <b className="text-cyan-200">n! / (p!·q!·r!)</b> (전체 n칸, 같은 색이 각각 p·q·r개).
        </p>
      </div>

      {/* 색 개수 스테퍼 */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {COLOR_DEFS.map((c) => (
          <div
            key={c.key}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900 p-4"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-md border border-white/20"
                style={{ background: c.hex }}
              />
              <span className="text-sm font-semibold text-slate-200">{c.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => change(c.key, -1)}
                className="h-7 w-7 rounded-lg border border-white/15 text-slate-200 transition hover:bg-white/10"
                aria-label={`${c.name} 줄이기`}
              >
                −
              </button>
              <span className="w-5 text-center text-lg font-extrabold tabular-nums">
                {counts[c.key]}
              </span>
              <button
                type="button"
                onClick={() => change(c.key, 1)}
                className="h-7 w-7 rounded-lg border border-white/15 text-slate-200 transition hover:bg-white/10"
                aria-label={`${c.name} 늘리기`}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 공식 + 카운트업 */}
      <div className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-950/20 p-5 text-center">
        <div className="text-lg font-bold text-cyan-100">
          {n}! / ({denomParts.join("·") || "—"}) ={" "}
          <span className="text-cyan-200">{distinct.toLocaleString()}</span>
        </div>
        <div className="mt-2 text-4xl font-black text-white tabular-nums">
          {distinctCount.toLocaleString()}
          <span className="ml-1 text-xl font-bold text-slate-400">가지</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">전체 {n}칸 깃발의 서로 다른 배열 수</p>
      </div>

      {/* 한 배열 크게 보기 */}
      {flags.length > 0 ? (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 p-5">
          <Flag stripes={flags[Math.min(featured, flags.length - 1)]} size="lg" />
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <button
              type="button"
              onClick={() => setFeatured((f) => (f - 1 + flags.length) % flags.length)}
              className="rounded-lg border border-white/15 px-3 py-1 transition hover:bg-white/10"
            >
              ◀
            </button>
            <span className="tabular-nums">
              {Math.min(featured, flags.length - 1) + 1} / {flags.length}
            </span>
            <button
              type="button"
              onClick={() => setFeatured((f) => (f + 1) % flags.length)}
              className="rounded-lg border border-white/15 px-3 py-1 transition hover:bg-white/10"
            >
              ▶
            </button>
          </div>
        </div>
      ) : null}

      {/* 모든 배열 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-semibold text-slate-200">
          서로 다른 깃발 전체{" "}
          <span className="text-xs font-normal text-slate-500">
            {distinct > flags.length ? `(처음 ${flags.length}개)` : `(${flags.length}가지)`}
          </span>
        </p>
        <div className="mt-3 flex max-h-80 flex-wrap gap-2 overflow-y-auto">
          {flags.map((stripes, i) => (
            <Flag key={i} stripes={stripes} />
          ))}
        </div>
      </div>

      <Quiz items={QUIZ} />
      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
