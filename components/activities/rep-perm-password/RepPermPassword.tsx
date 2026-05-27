"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Quiz, { type QuizItem } from "@/components/activities/Quiz";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

const ALL_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#a855f7", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];

const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};
function sup(n: number): string {
  return String(n).split("").map((c) => SUP[c] ?? c).join("");
}

function permutation(k: number, n: number): number {
  if (n > k) return 0;
  let r = 1;
  for (let i = k; i > k - n; i--) r *= i;
  return r;
}

// 목표값으로 부드럽게 올라가는 카운트업.
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

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "growth",
    prompt: "자릿수 n을 1씩 늘리면 경우의 수는 어떻게 변하나요? 그 이유를 설명해 보세요.",
    kind: "text",
    placeholder: "예: 자리 하나가 늘 때마다 …",
  },
  {
    id: "rep_vs_perm",
    prompt:
      "중복을 허용할 때(kⁿ)와 허용하지 않을 때(ₖPₙ)의 경우의 수가 다른 이유는 무엇인가요?",
    kind: "text",
  },
];

const QUIZ: QuizItem[] = [
  {
    q: "0~9의 숫자를 사용하여 만들 수 있는 4자리 비밀번호의 수는 모두 몇 가지인지 구하시오. (각 자리에 같은 숫자를 반복 사용할 수 있음)",
    answer: "10000",
    hint: "10가지 숫자를 4자리에 중복 허용하여 나열합니다.",
    solution: "각 자리마다 0~9 중 하나를 독립적으로 선택하므로 10⁴ = 10,000가지입니다.",
  },
  {
    q: "a~z 알파벳 26가지를 중복 허용하여 3자리 암호를 만들 때, 첫 번째 자리가 반드시 모음(a, e, i, o, u) 5가지 중 하나여야 한다면 만들 수 있는 암호는 모두 몇 가지인지 구하시오.",
    answer: "3380",
    hint: "첫 자리 5가지, 나머지 두 자리는 각각 26가지입니다.",
    solution: "5 × 26² = 5 × 676 = 3,380가지입니다.",
  },
  {
    q: "0~9의 숫자를 중복 허용하여 4자리 비밀번호를 만들 때와, 중복 없이 만들 때의 경우의 수의 차를 구하시오.",
    answer: "4960",
    hint: "중복 허용 10⁴, 중복 불가 ₁₀P₄ 를 계산하여 뺍니다.",
    solution: "10⁴ = 10,000, ₁₀P₄ = 10·9·8·7 = 5,040 → 차는 4,960가지입니다.",
  },
];

export default function RepPermPassword() {
  const [n, setN] = useState(4);
  const [k, setK] = useState(10);
  const [reel, setReel] = useState<number[]>([0, 0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [showList, setShowList] = useState(false);
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chars = useMemo(() => ALL_CHARS.slice(0, k), [k]);
  const rep = useMemo(() => Math.pow(k, n), [k, n]);
  const perm = useMemo(() => permutation(k, n), [k, n]);
  const repCount = useCountUp(rep);

  // 자릿수가 바뀌면 릴 길이를 맞춘다.
  useEffect(() => {
    setReel((prev) => {
      const next = Array.from({ length: n }, (_, i) => prev[i] ?? 0);
      return next.map((d) => Math.min(d, k - 1));
    });
  }, [n, k]);

  useEffect(() => () => {
    if (spinRef.current) clearInterval(spinRef.current);
  }, []);

  function spin() {
    if (spinRef.current) clearInterval(spinRef.current);
    setSpinning(true);
    const start = performance.now();
    spinRef.current = setInterval(() => {
      setReel((prev) => prev.map(() => Math.floor(Math.random() * k)));
      if (performance.now() - start > 850) {
        if (spinRef.current) clearInterval(spinRef.current);
        spinRef.current = null;
        setReel(Array.from({ length: n }, () => Math.floor(Math.random() * k)));
        setSpinning(false);
      }
    }, 70);
  }

  // 전체 목록(중복순열) — 표시 상한 500.
  const MAX_LIST = 500;
  const combos = useMemo(() => {
    if (!showList) return [];
    const out: string[] = [];
    const rec = (depth: number, acc: string) => {
      if (out.length >= MAX_LIST) return;
      if (depth === n) {
        out.push(acc);
        return;
      }
      for (const c of chars) {
        if (out.length >= MAX_LIST) break;
        rec(depth + 1, acc + c);
      }
    };
    rec(0, "");
    return out;
  }, [showList, chars, n]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 중복순열</p>
        <h3 className="mt-2 text-2xl font-bold">🔐 비밀번호 경우의 수 탐색기</h3>
        <p className="mt-2 leading-7 text-slate-300">
          서로 다른 <b className="text-cyan-200">k</b>가지 문자를 중복 허용하여{" "}
          <b className="text-cyan-200">n</b>자리로 나열하면 경우의 수는{" "}
          <b className="text-cyan-200">kⁿ</b>. 자릿수와 문자 종류를 바꿔 보세요.
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="rpp-n" className="text-sm font-semibold text-slate-200">
              자릿수 n
            </label>
            <span className="rounded-lg bg-cyan-300 px-3 py-0.5 text-sm font-extrabold text-slate-950">
              {n}
            </span>
          </div>
          <input
            id="rpp-n"
            type="range"
            min={1}
            max={6}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="mt-2 w-full accent-cyan-400"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="rpp-k" className="text-sm font-semibold text-slate-200">
              문자 종류 k
            </label>
            <span className="rounded-lg bg-cyan-300 px-3 py-0.5 text-sm font-extrabold text-slate-950">
              {k}
            </span>
          </div>
          <input
            id="rpp-k"
            type="range"
            min={2}
            max={10}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="mt-2 w-full accent-cyan-400"
          />
        </div>
      </div>

      {/* 사용 문자 */}
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">사용 문자</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {chars.map((c, i) => (
            <span
              key={c}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-base font-extrabold text-white shadow"
              style={{ background: COLORS[i] }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* 자물쇠 릴 */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-200">비밀번호 예시</p>
          <button
            type="button"
            onClick={spin}
            disabled={spinning}
            className="rounded-full bg-cyan-300 px-4 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60"
          >
            🎲 무작위로 돌리기
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          {reel.map((d, i) => (
            <div key={i} className="text-center">
              <div
                className={`flex h-16 w-12 items-center justify-center rounded-xl border-2 bg-slate-950 text-3xl font-black tabular-nums transition ${
                  spinning ? "border-cyan-300/70 text-cyan-200" : "border-white/15 text-white"
                }`}
              >
                {chars[d] ?? "0"}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">{k}가지</div>
            </div>
          ))}
        </div>
      </div>

      {/* 곱셈 스트립 + 결과 카운트업 */}
      <div className="mt-6 rounded-2xl border border-cyan-300/25 bg-cyan-950/20 p-5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2 text-lg font-bold text-cyan-100">
          {Array.from({ length: n }).map((_, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="rounded-lg bg-cyan-300/15 px-3 py-1">{k}</span>
              {i < n - 1 ? <span className="text-cyan-400/70">×</span> : null}
            </span>
          ))}
          <span className="text-cyan-400/70">=</span>
          <span className="text-cyan-200">
            {k}
            {sup(n)}
          </span>
        </div>
        <div className="mt-3 text-4xl font-black text-white tabular-nums">
          {repCount.toLocaleString()}
          <span className="ml-1 text-xl font-bold text-slate-400">가지</span>
        </div>
      </div>

      {/* 비교: 중복순열 vs 순열 */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-cyan-300/40 bg-cyan-300/10 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200/80">
            중복순열 (중복 허용)
          </p>
          <p className="mt-2 text-3xl font-black text-white tabular-nums">
            {rep.toLocaleString()}
          </p>
          <p className="mt-1 text-sm font-bold text-cyan-300">
            {k}
            {sup(n)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            순열 (중복 불가)
          </p>
          <p className="mt-2 text-3xl font-black text-white tabular-nums">
            {perm > 0 ? perm.toLocaleString() : "—"}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-400">
            {k >= n ? `${k}P${n}` : "k < n 이면 불가"}
          </p>
        </div>
      </div>

      {/* 전체 목록 */}
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setShowList((s) => !s)}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
        >
          {showList ? "전체 목록 닫기" : `전체 목록 보기 (${rep.toLocaleString()}가지)`}
        </button>
        {showList ? (
          <div className="mt-3">
            <p className="text-xs text-slate-400">
              {rep > MAX_LIST
                ? `총 ${rep.toLocaleString()}가지 중 처음 ${MAX_LIST}개 미리보기`
                : `${rep.toLocaleString()}가지 전체`}
            </p>
            <div className="mt-2 flex max-h-72 flex-wrap gap-2 overflow-y-auto rounded-xl border border-white/10 bg-slate-900 p-3">
              {combos.map((c, i) => (
                <span
                  key={i}
                  className="rounded-md border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-1 font-mono text-sm text-indigo-100"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Quiz items={QUIZ} />
      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
