"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "method_choice",
    prompt:
      "계수비교법과 수치대입법의 차이를 자신의 말로 설명하고, 각 방법이 더 유리한 상황(어떤 모양의 식인가)을 예와 함께 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 계수비교법은 좌·우변을 같은 차수의 항끼리 비교한다. 우변이 ax²+bx+c 같은 표준형이거나 전개가 쉬울 때 빠르다. 반면 수치대입법은 식의 형태가 인수형이거나 특정 x를 넣으면 한 항이 0이 되어 다른 계수가 바로 나올 때 강력하다 — 예: (x−p)(x−q) 형은 인수의 근을 대입하면 즉시 결정된다.",
  },
];

// ─── 데이터 ───────────────────────────────────────────────
type Step = { content: React.ReactNode; emphasize?: boolean };
type Problem = {
  id: number;
  left: string;
  right: string;
  /** answers 의 키 = 미정계수 이름, 값 = 정답값 */
  answers: Record<string, number>;
  /** 어떤 방법이 더 편함을 강조 */
  better: "coeff" | "subst" | "both";
  steps: {
    coeff: Step[];
    subst: Step[];
  };
};

const PROBLEMS: Problem[] = [
  {
    id: 1,
    left: "3x² − x + 4",
    right: "a(x − 1)² + b(x − 1) + c",
    answers: { a: 3, b: 5, c: 6 },
    better: "both",
    steps: {
      coeff: [
        { content: "(x − 1)² = x² − 2x + 1 이므로 a(x − 1)² = ax² − 2ax + a" },
        { content: "b(x − 1) = bx − b" },
        { content: "우변을 정리: ax² + (−2a + b)x + (a − b + c)" },
        { content: "계수 비교: a = 3, −2a + b = −1, a − b + c = 4" },
        { content: "a = 3 ⇒ b = −1 + 2·3 = 5, c = 4 − a + b = 4 − 3 + 5 = 6", emphasize: true },
      ],
      subst: [
        { content: "x = 1 을 대입: 3 − 1 + 4 = 0 + 0 + c → c = 6" },
        { content: "x = 0 을 대입: 4 = a − b + c → a − b = −2" },
        { content: "x = 2 를 대입: 12 − 2 + 4 = 14 = a + b + c → a + b = 8" },
        { content: "a − b = −2, a + b = 8 → a = 3, b = 5 ✓", emphasize: true },
      ],
    },
  },
  {
    id: 2,
    left: "2x − 4",
    right: "a(x − 2)",
    answers: { a: 2 },
    better: "coeff",
    steps: {
      coeff: [
        { content: "a(x − 2) = ax − 2a" },
        { content: "좌변: 2x − 4" },
        { content: "계수 비교: a = 2 (그리고 −2a = −4 도 일치) ⭐ 계수비교가 더 빠름", emphasize: true },
      ],
      subst: [
        { content: "x = 2 를 대입: 0 = 0 (정보 없음 — 이 값은 a 를 결정하지 못함)" },
        { content: "x = 0 을 대입: −4 = −2a → a = 2 ✓" },
        { content: "x = 1 을 대입: −2 = −a → a = 2 ✓ (이중 확인)" },
      ],
    },
  },
  {
    id: 3,
    left: "x² − 2x + 3",
    right: "a(x − 1)² + b",
    answers: { a: 1, b: 2 },
    better: "coeff",
    steps: {
      coeff: [
        { content: "a(x − 1)² + b = ax² − 2ax + a + b" },
        { content: "좌변: x² − 2x + 3" },
        { content: "계수 비교: a = 1, −2a = −2 (확인), a + b = 3 → b = 2 ⭐", emphasize: true },
      ],
      subst: [
        { content: "x = 1 을 대입: 1 − 2 + 3 = 2 → 0 + b = 2 → b = 2 ✓" },
        { content: "x = 0 을 대입: 3 = a + b → a = 1 ✓" },
        { content: "x = 2 를 대입: 4 − 4 + 3 = 3 = a + b → 1 + 2 = 3 ✓" },
      ],
    },
  },
  {
    id: 4,
    left: "x² + 2x",
    right: "a(x + 1)² + b(x + 1) + c",
    answers: { a: 1, b: 0, c: -1 },
    better: "both",
    steps: {
      coeff: [
        { content: "a(x + 1)² + b(x + 1) + c = ax² + (2a + b)x + (a + b + c)" },
        { content: "좌변: x² + 2x + 0 (상수항 = 0)" },
        { content: "계수 비교: a = 1, 2a + b = 2 → b = 0, a + b + c = 0 → c = −1", emphasize: true },
      ],
      subst: [
        { content: "x = −1 을 대입: 1 − 2 = −1 → 0 + 0 + c = −1 → c = −1 ✓" },
        { content: "x = 0 을 대입: 0 = a + b + c → a + b = 1" },
        { content: "x = 1 을 대입: 3 = 4a + 2b + c → 4a + 2b = 4 → 2a + b = 2" },
        { content: "두 식 풀이: a = 1, b = 0 ✓", emphasize: true },
      ],
    },
  },
  {
    id: 5,
    left: "2x² + 5x + 3",
    right: "ax² + bx + c",
    answers: { a: 2, b: 5, c: 3 },
    better: "coeff",
    steps: {
      coeff: [
        { content: "좌·우변이 이미 표준형(같은 차수끼리 정렬)" },
        { content: "계수를 직접 비교: a = 2, b = 5, c = 3", emphasize: true },
        { content: "⭐⭐ 계수비교가 압도적으로 편함 — 거의 즉답" },
      ],
      subst: [
        { content: "x = 0 을 대입: 3 = c → c = 3" },
        { content: "x = 1 을 대입: 10 = a + b + c → a + b = 7" },
        { content: "x = −1 을 대입: 0 = a − b + c → a − b = −3" },
        { content: "연립: a + b = 7, a − b = −3 → a = 2, b = 5 ✓" },
        { content: "연립방정식을 풀어야 해서 훨씬 번거롭다" },
      ],
    },
  },
  {
    id: 6,
    left: "(x − 2)(x + 3)",
    right: "(x − p)(x − q)",
    answers: { p: 2, q: -3 },
    better: "subst",
    steps: {
      coeff: [
        { content: "좌변 전개: (x − 2)(x + 3) = x² + x − 6" },
        { content: "우변 전개: (x − p)(x − q) = x² − (p + q)x + pq" },
        { content: "계수 비교: 1 = −(p + q) → p + q = −1, −6 = pq" },
        { content: "p + q = −1, pq = −6 의 연립 → p = 2, q = −3 (또는 역순)" },
        { content: "연립방정식 풀이 필요 — 비교적 번거롭다" },
      ],
      subst: [
        { content: "좌변이 인수형이므로 좌변을 0 으로 만드는 x 가 우변도 0 으로 만들어야 함" },
        { content: "x = 2 를 대입: (0)(5) = 0 → (2 − p)(2 − q) = 0 → p = 2 또는 q = 2" },
        { content: "x = −3 을 대입: (−5)(0) = 0 → (−3 − p)(−3 − q) = 0 → p = −3 또는 q = −3" },
        { content: "따라서 {p, q} = {2, −3}", emphasize: true },
        { content: "⭐⭐ 수치대입이 압도적으로 편함 — 근을 대입하면 즉답!" },
      ],
    },
  },
];

// ─── 메인 ───────────────────────────────────────────────────
type Answers = Record<number, { correct: boolean }>;

export default function UndefinedCoefficients() {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const score = Object.values(answers).filter((a) => a.correct).length;

  function handleSolve() {
    setAnswers((arr) => ({ ...arr, [idx]: { correct: true } }));
  }
  function handleNext() {
    setIdx((i) => Math.min(PROBLEMS.length, i + 1));
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
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">🔑 미정계수법 탐정 게임</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-violet-200">계수비교법</b> 과{" "}
          <b className="text-cyan-200">수치대입법</b> 으로 미정계수를 찾아 보세요. 같은 문제를 두
          방법으로 비교하면 어느 쪽이 더 효율적인지 보입니다.
        </p>
      </div>

      {/* 진행 + 점수 */}
      <div className="mt-5 flex items-center gap-3">
        <ProgressBar done={score} total={PROBLEMS.length} />
        <span className="rounded-full border border-pink-400/45 bg-pink-400/15 px-4 py-1 font-mono text-sm font-bold text-pink-100">
          정답 {score} / {PROBLEMS.length}
        </span>
      </div>

      <div className="mt-4">
        {!isFinished ? (
          <ProblemRunner
            key={idx}
            idx={idx}
            problem={PROBLEMS[idx]}
            solved={!!answers[idx]?.correct}
            onSolve={handleSolve}
            onNext={handleNext}
          />
        ) : (
          <Summary score={score} total={PROBLEMS.length} onReset={handleReset} />
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
        <linearGradient id="ucProgGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="0" y="0" width={ratio * 100} height="4" rx="2" fill="url(#ucProgGrad)" />
    </svg>
  );
}

// ─── 문제 ───────────────────────────────────────────────────
type Method = "coeff" | "subst";

function ProblemRunner({
  idx,
  problem,
  solved,
  onSolve,
  onNext,
}: {
  idx: number;
  problem: Problem;
  solved: boolean;
  onSolve: () => void;
  onNext: () => void;
}) {
  const [method, setMethod] = useState<Method | null>(null);
  const coefKeys = Object.keys(problem.answers);
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(coefKeys.map((k) => [k, ""])),
  );
  const [status, setStatus] = useState<Record<string, boolean | null>>(() =>
    Object.fromEntries(coefKeys.map((k) => [k, null])),
  );
  const [fb, setFb] = useState<{ tone: "ok" | "ng"; text: string } | null>(null);

  function handleCheck() {
    const newStatus: Record<string, boolean | null> = {};
    let correctCount = 0;
    let allOk = true;
    for (const key of coefKeys) {
      const raw = inputs[key].trim().replace(/−/g, "-");
      const v = Number(raw);
      const exp = problem.answers[key];
      const ok = raw !== "" && Number.isFinite(v) && Math.abs(v - exp) < 0.01;
      newStatus[key] = ok;
      if (ok) correctCount++;
      else allOk = false;
    }
    setStatus(newStatus);
    if (allOk) {
      setFb({ tone: "ok", text: "✅ 정답! 모든 미정계수를 올바르게 구했습니다!" });
      if (!solved) onSolve();
    } else {
      setFb({
        tone: "ng",
        text: `⚠️ ${correctCount} / ${coefKeys.length} 정답입니다. 계산을 다시 확인해 보세요.`,
      });
    }
  }

  function handleResetProblem() {
    setInputs(Object.fromEntries(coefKeys.map((k) => [k, ""])));
    setStatus(Object.fromEntries(coefKeys.map((k) => [k, null])));
    setFb(null);
  }

  const tonePref =
    problem.better === "coeff"
      ? "계수비교가 더 빠름"
      : problem.better === "subst"
      ? "수치대입이 더 빠름"
      : "두 방법 모두 쓸 만함";

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-violet-500/[0.04] to-cyan-500/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          문제 {idx + 1} / {PROBLEMS.length}
        </p>
        <span className="rounded-full border border-amber-400/45 bg-amber-400/10 px-3 py-0.5 text-xs font-bold text-amber-200">
          힌트: {tonePref}
        </span>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border-l-4 border-cyan-400 bg-cyan-400/[0.08] px-4 py-3 text-center font-mono text-lg font-extrabold text-cyan-100">
        {problem.left} <span className="text-slate-400">=</span> {problem.right}
      </div>

      <p className="mt-3 text-sm text-slate-300">
        💡 아래 두 방법 중 하나를 선택하여 단계별 풀이를 확인해 보세요.
      </p>

      {/* 방법 선택 */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMethod("coeff")}
          className={
            "rounded-xl border-2 p-3 text-left transition " +
            (method === "coeff"
              ? "border-violet-300 bg-violet-400/25 shadow-lg shadow-violet-500/20"
              : "border-violet-400/45 bg-violet-400/10 hover:bg-violet-400/20")
          }
        >
          <p className="font-bold text-violet-100">📊 계수비교법</p>
          <p className="mt-0.5 text-xs text-violet-200">동류항의 계수를 비교</p>
        </button>
        <button
          type="button"
          onClick={() => setMethod("subst")}
          className={
            "rounded-xl border-2 p-3 text-left transition " +
            (method === "subst"
              ? "border-cyan-300 bg-cyan-400/25 shadow-lg shadow-cyan-500/20"
              : "border-cyan-400/45 bg-cyan-400/10 hover:bg-cyan-400/20")
          }
        >
          <p className="font-bold text-cyan-100">🔢 수치대입법</p>
          <p className="mt-0.5 text-xs text-cyan-200">적당한 x 값을 대입</p>
        </button>
      </div>

      {/* 단계 풀이 */}
      {method ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 p-4">
          <p
            className={
              "mb-2 text-sm font-bold " +
              (method === "coeff" ? "text-violet-200" : "text-cyan-200")
            }
          >
            {method === "coeff" ? "📊 계수비교법 풀이" : "🔢 수치대입법 풀이"}
          </p>
          <ol className="space-y-2">
            {problem.steps[method].map((s, i) => (
              <li
                key={i}
                className={
                  "flex gap-2 rounded-lg border px-3 py-2 text-sm " +
                  (s.emphasize
                    ? "border-amber-400/45 bg-amber-400/10 text-amber-100"
                    : "border-white/10 bg-slate-900/40 text-slate-200")
                }
              >
                <span
                  className={
                    "shrink-0 font-bold " +
                    (s.emphasize ? "text-amber-300" : "text-cyan-300")
                  }
                >
                  Step {i + 1}.
                </span>
                <span className="font-mono">{s.content}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {/* 미정계수 입력 */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-bold text-slate-200">✏️ 미정계수 입력</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {coefKeys.map((key) => (
            <CoefField
              key={key}
              name={key}
              value={inputs[key]}
              status={status[key]}
              onChange={(v) => {
                setInputs((arr) => ({ ...arr, [key]: v }));
                setStatus((arr) => ({ ...arr, [key]: null }));
                setFb(null);
              }}
            />
          ))}
        </div>
      </div>

      {fb ? (
        <p
          className={`mt-3 rounded-xl px-3 py-2 text-center text-sm font-bold ${
            fb.tone === "ok"
              ? "border border-emerald-400/45 bg-emerald-400/15 text-emerald-100"
              : "border border-rose-400/45 bg-rose-400/15 text-rose-100"
          }`}
        >
          {fb.text}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCheck}
          disabled={solved}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ✅ 답 확인
        </button>
        <button
          type="button"
          onClick={handleResetProblem}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          🔄 초기화
        </button>
        {solved ? (
          <button
            type="button"
            onClick={onNext}
            className="ml-auto rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110"
          >
            ➡️ 다음 문제
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CoefField({
  name,
  value,
  status,
  onChange,
}: {
  name: string;
  value: string;
  status: boolean | null | undefined;
  onChange: (v: string) => void;
}) {
  const okCls =
    status === true
      ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-100"
      : status === false
      ? "border-rose-400/70 bg-rose-400/15 text-rose-100"
      : "border-white/15 bg-slate-900/50 text-slate-100";
  return (
    <label className="flex items-center gap-2">
      <span className="font-mono text-base font-bold text-slate-300">{name} =</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="?"
        className={`h-[36px] w-[72px] rounded-lg border-2 px-2 text-center font-mono text-base font-bold outline-none transition focus:ring-2 focus:ring-cyan-400/40 ${okCls}`}
      />
    </label>
  );
}

// ─── 요약 ───────────────────────────────────────────────────
function Summary({
  score,
  total,
  onReset,
}: {
  score: number;
  total: number;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-cyan-400/45 bg-gradient-to-br from-violet-500/15 to-cyan-500/15 p-5">
      <p className="text-center text-3xl">🎉</p>
      <p className="mt-2 text-center text-xl font-extrabold text-cyan-100">
        모든 문제를 풀었습니다!
      </p>
      <p className="mt-2 text-center text-lg font-mono font-bold text-cyan-200">
        정답: {score} / {total}
      </p>
      <p className="mt-4 text-center text-sm text-slate-200">
        계수비교법과 수치대입법, 두 방법의 특징과 유리한 상황을 정리해 아래 성찰 폼을 작성해
        보세요. ✏️
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
