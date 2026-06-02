"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "identity_vs_equation",
    prompt:
      "이 활동에서 항등식과 방정식을 어떻게 구분했는지, 그리고 두 개념의 핵심 차이는 무엇인지 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 여러 값을 넣어 봤을 때 ‘모든 값에서’ 좌·우변이 같으면 항등식, ‘특정 값에서만’ 같으면 방정식이다. 좌·우변을 정리하면 항등식은 같은 식이 되고, 방정식은 미지수의 해를 가지는 식이 된다.",
  },
];

// ─── 데이터 ───────────────────────────────────────────────
type Variable = "x" | "ab";
type Test = {
  // 단일 변수 x 또는 두 변수 a, b
  vars: Record<string, number>;
  leftVal: number;
  rightVal: number;
};
type Problem = {
  id: number;
  left: string;
  right: string;
  variable: Variable;
  type: "항등식" | "방정식";
  tests: Test[];
};

const PROBLEMS: Problem[] = [
  {
    id: 1,
    left: "x² − 3x",
    right: "x(x − 3)",
    variable: "x",
    type: "항등식",
    tests: [
      { vars: { x: 0 }, leftVal: 0, rightVal: 0 },
      { vars: { x: 1 }, leftVal: -2, rightVal: -2 },
      { vars: { x: 2 }, leftVal: -2, rightVal: -2 },
      { vars: { x: -1 }, leftVal: 4, rightVal: 4 },
    ],
  },
  {
    id: 2,
    left: "2x − 4",
    right: "0",
    variable: "x",
    type: "방정식",
    tests: [
      { vars: { x: 0 }, leftVal: -4, rightVal: 0 },
      { vars: { x: 1 }, leftVal: -2, rightVal: 0 },
      { vars: { x: 2 }, leftVal: 0, rightVal: 0 },
      { vars: { x: 3 }, leftVal: 2, rightVal: 0 },
    ],
  },
  {
    id: 3,
    left: "(a + b)²",
    right: "a² + 2ab + b²",
    variable: "ab",
    type: "항등식",
    tests: [
      { vars: { a: 1, b: 1 }, leftVal: 4, rightVal: 4 },
      { vars: { a: 2, b: 1 }, leftVal: 9, rightVal: 9 },
      { vars: { a: -1, b: 2 }, leftVal: 1, rightVal: 1 },
      { vars: { a: 3, b: -2 }, leftVal: 1, rightVal: 1 },
    ],
  },
  {
    id: 4,
    left: "x²",
    right: "16",
    variable: "x",
    type: "방정식",
    tests: [
      { vars: { x: 0 }, leftVal: 0, rightVal: 16 },
      { vars: { x: 2 }, leftVal: 4, rightVal: 16 },
      { vars: { x: 4 }, leftVal: 16, rightVal: 16 },
      { vars: { x: -4 }, leftVal: 16, rightVal: 16 },
    ],
  },
  {
    id: 5,
    left: "3(x + 2)",
    right: "3x + 6",
    variable: "x",
    type: "항등식",
    tests: [
      { vars: { x: 0 }, leftVal: 6, rightVal: 6 },
      { vars: { x: 1 }, leftVal: 9, rightVal: 9 },
      { vars: { x: -2 }, leftVal: 0, rightVal: 0 },
      { vars: { x: 5 }, leftVal: 21, rightVal: 21 },
    ],
  },
  {
    id: 6,
    left: "x + 2",
    right: "3",
    variable: "x",
    type: "방정식",
    tests: [
      { vars: { x: 0 }, leftVal: 2, rightVal: 3 },
      { vars: { x: 1 }, leftVal: 3, rightVal: 3 },
      { vars: { x: 2 }, leftVal: 4, rightVal: 3 },
      { vars: { x: 3 }, leftVal: 5, rightVal: 3 },
    ],
  },
];

function fmtN(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : String(n);
}
function fmtVars(t: Test, variable: Variable): string {
  if (variable === "x") return `x = ${fmtN(t.vars.x)}`;
  return `a = ${fmtN(t.vars.a)}, b = ${fmtN(t.vars.b)}`;
}

// ─── 메인 ───────────────────────────────────────────────────
type Answer = { type: "항등식" | "방정식"; correct: boolean };

export default function IdentityGame() {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});

  const done = Object.keys(answers).length;
  const score = Object.values(answers).filter((a) => a.correct).length;

  function handleAnswer(choice: "항등식" | "방정식") {
    const p = PROBLEMS[idx];
    const correct = choice === p.type;
    setAnswers((arr) => ({ ...arr, [idx]: { type: choice, correct } }));
    // 1.5초 후 다음 문제 (또는 요약)
    window.setTimeout(() => {
      setIdx((i) => Math.min(PROBLEMS.length, i + 1));
    }, 1500);
  }

  function handleReset() {
    setAnswers({});
    setIdx(0);
  }

  const isFinished = idx >= PROBLEMS.length;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* 헤더 */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-violet-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">🔍 항등식 탐정 게임</h3>
        <p className="mt-2 leading-7 text-slate-300">
          각 식에 여러 값을 대입해 보고 그 식이{" "}
          <b className="text-violet-200">항등식</b>(모든 값에서 성립)인지{" "}
          <b className="text-rose-200">방정식</b>(특정 값에서만 성립)인지 판별해 보세요.
        </p>
      </div>

      {/* 진행 + 점수 */}
      <div className="mt-5 flex items-center gap-3">
        <ProgressBar done={done} total={PROBLEMS.length} />
        <span className="rounded-full border border-emerald-400/45 bg-emerald-400/15 px-4 py-1 font-mono text-sm font-bold text-emerald-100">
          정답 {score} / {PROBLEMS.length}
        </span>
      </div>

      <div className="mt-4">
        {!isFinished ? (
          <ProblemRunner
            key={idx}
            idx={idx}
            problem={PROBLEMS[idx]}
            answer={answers[idx]}
            onAnswer={handleAnswer}
          />
        ) : (
          <Summary
            answers={answers}
            score={score}
            total={PROBLEMS.length}
            onReset={handleReset}
          />
        )}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const ratio = total === 0 ? 0 : Math.min(1, done / total);
  return (
    <svg
      viewBox="0 0 100 4"
      preserveAspectRatio="none"
      className="h-2 flex-1"
      role="img"
      aria-label={`진행률 ${Math.round(ratio * 100)}%`}
    >
      <defs>
        <linearGradient id="idGameProgGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="0" y="0" width={ratio * 100} height="4" rx="2" fill="url(#idGameProgGrad)" />
    </svg>
  );
}

// ─── 문제 ───────────────────────────────────────────────────
function ProblemRunner({
  idx,
  problem,
  answer,
  onAnswer,
}: {
  idx: number;
  problem: Problem;
  answer: Answer | undefined;
  onAnswer: (choice: "항등식" | "방정식") => void;
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function handleSubClick(i: number) {
    setChecked((s) => {
      const n = new Set(s);
      n.add(i);
      return n;
    });
  }

  const allChecked = checked.size === problem.tests.length;

  return (
    <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/[0.06] to-indigo-500/[0.04] p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
        문제 {idx + 1} / {PROBLEMS.length}
      </p>

      {/* 식 표시 */}
      <div className="mt-3 overflow-x-auto rounded-xl border-l-4 border-violet-400 bg-violet-400/[0.08] px-4 py-3 text-center font-mono text-lg font-extrabold text-violet-100">
        {problem.left} <span className="text-slate-400">=</span> {problem.right}
      </div>

      <p className="mt-3 text-sm text-slate-300">
        💡 카드를 클릭해서 다양한 값을 대입해 보고, 이 식이{" "}
        <b className="text-violet-200">항등식</b>인지{" "}
        <b className="text-rose-200">방정식</b>인지 판별하세요.
      </p>

      {/* 대입값 카드 */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {problem.tests.map((t, i) => {
          const isChecked = checked.has(i);
          const match = t.leftVal === t.rightVal;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSubClick(i)}
              className={
                "rounded-xl border-2 p-3 text-left transition hover:-translate-y-0.5 " +
                (isChecked
                  ? match
                    ? "border-emerald-400/55 bg-emerald-400/10 shadow-lg shadow-emerald-400/15"
                    : "border-rose-400/55 bg-rose-400/10 shadow-lg shadow-rose-400/15"
                  : "border-violet-400/45 bg-violet-400/[0.08] hover:bg-violet-400/15")
              }
            >
              <p className="text-xs text-violet-200">{fmtVars(t, problem.variable)}</p>
              {isChecked ? (
                <p className="mt-1 font-mono text-sm text-slate-200">
                  좌 = <b className="text-sky-300">{fmtN(t.leftVal)}</b>{" "}
                  &nbsp;|&nbsp; 우 = <b className="text-amber-300">{fmtN(t.rightVal)}</b>
                </p>
              ) : (
                <p className="mt-1 text-xs italic text-slate-500">클릭해서 대입</p>
              )}
            </button>
          );
        })}
      </div>

      {/* 결과 표 */}
      {checked.size > 0 ? (
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-violet-200">
                {["대입값", "좌변", "우변", "결과"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="border-b border-white/10 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {problem.tests
                .map((t, i) => ({ t, i }))
                .filter((row) => checked.has(row.i))
                .map(({ t, i }) => {
                  const match = t.leftVal === t.rightVal;
                  return (
                    <tr key={i} className="border-b border-white/5 last:border-none">
                      <td className="px-3 py-2 font-mono text-slate-200">
                        {fmtVars(t, problem.variable)}
                      </td>
                      <td className="px-3 py-2 font-mono text-sky-300">{fmtN(t.leftVal)}</td>
                      <td className="px-3 py-2 font-mono text-amber-300">{fmtN(t.rightVal)}</td>
                      <td
                        className={`px-3 py-2 font-mono font-bold ${
                          match ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {match ? "✓ 같음" : "✗ 다름"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* 피드백 */}
      {answer ? (
        <p
          className={`mt-3 rounded-xl px-3 py-2 text-center text-sm font-bold ${
            answer.correct
              ? "border border-emerald-400/45 bg-emerald-400/15 text-emerald-100"
              : "border border-rose-400/45 bg-rose-400/15 text-rose-100"
          }`}
        >
          {answer.correct
            ? `✅ 정답! 이것은 ${problem.type}입니다.`
            : `❌ 틀렸습니다. 정답은 ${problem.type}입니다.`}
        </p>
      ) : null}

      {/* 판단 버튼 */}
      <div className="mt-3 flex flex-wrap gap-2">
        <p className="w-full text-center text-xs text-slate-400">
          {allChecked
            ? "모든 대입값을 확인했어요. 판단해 보세요!"
            : "여러 값을 대입해 보고 판단해 보세요."}
        </p>
        <div className="mx-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onAnswer("항등식")}
            disabled={!!answer}
            className="rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-5 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            항등식 ✔️
          </button>
          <button
            type="button"
            onClick={() => onAnswer("방정식")}
            disabled={!!answer}
            className="rounded-xl border-2 border-rose-400/55 bg-rose-400/15 px-5 py-2 text-sm font-bold text-rose-100 transition hover:bg-rose-400/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            방정식 ❌
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 요약 ───────────────────────────────────────────────────
function Summary({
  answers,
  score,
  total,
  onReset,
}: {
  answers: Record<number, Answer>;
  score: number;
  total: number;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-emerald-400/45 bg-gradient-to-br from-emerald-500/15 to-violet-500/15 p-5">
      <p className="text-center text-3xl">🎉</p>
      <p className="mt-2 text-center text-xl font-extrabold text-emerald-200">
        모든 문제를 풀었습니다!
      </p>
      <p className="mt-2 text-center text-lg font-mono font-bold text-emerald-100">
        정답: {score} / {total}
      </p>

      <div className="mx-auto mt-4 max-w-md space-y-1.5">
        {PROBLEMS.map((p, i) => {
          const a = answers[i];
          return (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-sm"
            >
              <span className="flex-1 font-mono text-slate-200">
                {p.left} = {p.right}
              </span>
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-bold ${
                  p.type === "항등식"
                    ? "border-violet-400/55 bg-violet-400/15 text-violet-200"
                    : "border-rose-400/55 bg-rose-400/15 text-rose-200"
                }`}
              >
                {p.type}
              </span>
              <span
                className={`ml-2 text-base ${a?.correct ? "text-emerald-300" : "text-rose-300"}`}
                aria-label={a?.correct ? "정답" : "오답"}
              >
                {a?.correct ? "✓" : "✗"}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-sm text-emerald-100">
        항등식의 성질을 정리해 아래 성찰 폼을 완성해 보세요. ✏️
      </p>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↻ 처음부터 다시
        </button>
      </div>
    </div>
  );
}
