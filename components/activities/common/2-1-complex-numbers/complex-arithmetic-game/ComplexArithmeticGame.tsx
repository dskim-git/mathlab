"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "i_squared_minus_one",
    prompt:
      "복소수 곱셈 (2 + 3i)(1 − 2i) 를 직접 전개 과정을 단계별로 보이며 풀어 보세요. 그리고 이 계산이 다항식 곱셈과 가장 다른 지점이 어디인지, 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: (2+3i)(1−2i) = 2 − 4i + 3i − 6i² = 2 − i − 6×(−1) = 8 − i. 다항식 곱셈과 가장 다른 지점은 i² 가 나오면 그것을 −1 로 바꿔 실수부에 합쳐야 한다는 점이다.",
  },
];

// ─── 표기 헬퍼 ─────────────────────────────────────────────
function I() {
  return <em className="font-serif italic text-pink-300">i</em>;
}
function Re({ children }: { children: ReactNode }) {
  return <span className="font-bold text-emerald-200">{children}</span>;
}
function Im({ children }: { children: ReactNode }) {
  return <span className="font-bold text-violet-200">{children}</span>;
}
function Hi({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-amber-400/25 px-1 font-bold text-amber-100">
      {children}
    </span>
  );
}

// 근호: √ 뒤 피연산자에 위 가로선(vinculum)을 그려 가독성을 높인다.
function Sqrt({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap">
      √<span className="border-t border-current px-[1px]">{children}</span>
    </span>
  );
}

// ─── 데이터 ─────────────────────────────────────────────────
type Q = { expr: ReactNode; choices: ReactNode[]; correct: number; solution: ReactNode };
type QType = "conjugate" | "division" | null;
type P3Q = Q & { qtype: Exclude<QType, null> };

const P1: Q[] = [
  {
    expr: <>(<Re>3</Re>+<Im>2</Im><I/>) + (<Re>1</Re>+<Im>4</Im><I/>) = ?</>,
    choices: [<>4 + 6<I/></>, <>4 + 8<I/></>, <>3 + 6<I/></>, <>4 + 2<I/></>],
    correct: 0,
    solution: (
      <>
        <b>실수끼리:</b> <Re>3 + 1 = 4</Re>
        <br />
        <b>허수끼리:</b> <Im>2 + 4 = 6</Im>
        <br />
        ∴ <b>4 + 6<I/></b>
      </>
    ),
  },
  {
    expr: <>(<Re>5</Re>−<Im>3</Im><I/>) + (<Re>−2</Re>+<Im>1</Im><I/>) = ?</>,
    choices: [<>3 + 2<I/></>, <>3 − 2<I/></>, <>7 − 4<I/></>, <>3 − 4<I/></>],
    correct: 1,
    solution: (
      <>
        <b>실수끼리:</b> <Re>5 + (−2) = 3</Re>
        <br />
        <b>허수끼리:</b> <Im>−3 + 1 = −2</Im>
        <br />
        ∴ <b>3 − 2<I/></b>
      </>
    ),
  },
  {
    expr: <>(<Re>4</Re>+<Im>1</Im><I/>) − (<Re>1</Re>+<Im>3</Im><I/>) = ?</>,
    choices: [<>5 + 4<I/></>, <>3 + 4<I/></>, <>3 − 2<I/></>, <>3 + 2<I/></>],
    correct: 2,
    solution: (
      <>
        <b>실수끼리:</b> <Re>4 − 1 = 3</Re>
        <br />
        <b>허수끼리:</b> <Im>1 − 3 = −2</Im>
        <br />
        ∴ <b>3 − 2<I/></b>
      </>
    ),
  },
  {
    expr: <>(<Re>2</Re>+<Im>5</Im><I/>) + (<Re>−2</Re>−<Im>5</Im><I/>) = ?</>,
    choices: [<>4 + 10<I/></>, <>10<I/></>, <>4</>, <>0</>],
    correct: 3,
    solution: (
      <>
        <b>실수끼리:</b> <Re>2 + (−2) = 0</Re>
        <br />
        <b>허수끼리:</b> <Im>5 + (−5) = 0</Im>
        <br />
        ∴ <b>0</b> &nbsp;← 켤레복소수를 더하면 실수(특히 0)가 될 수 있어요!
      </>
    ),
  },
  {
    expr: <>(<Re>−1</Re>+<Im>3</Im><I/>) − (<Re>−3</Re>−<Im>2</Im><I/>) = ?</>,
    choices: [<>−4 + <I/></>, <>2 + 5<I/></>, <>2 + <I/></>, <>−4 + 5<I/></>],
    correct: 1,
    solution: (
      <>
        <b>실수끼리:</b> <Re>−1 − (−3) = −1 + 3 = 2</Re>
        <br />
        <b>허수끼리:</b> <Im>3 − (−2) = 3 + 2 = 5</Im>
        <br />
        ∴ <b>2 + 5<I/></b>
      </>
    ),
  },
];

const P2: Q[] = [
  {
    expr: <>(<Re>2</Re>+<I/>)(<Re>1</Re>+<Im>3</Im><I/>) = ?</>,
    choices: [<>2 + 7<I/></>, <>−1 − 7<I/></>, <>−1 + 7<I/></>, <>5 + 7<I/></>],
    correct: 2,
    solution: (
      <>
        전개: 2·1 + 2·3<I/> + <I/>·1 + <I/>·3<I/>
        <br />
        = 2 + 6<I/> + <I/> + 3<Hi><I/>²</Hi>
        <br />
        = 2 + 7<I/> + 3 × <Hi>(−1)</Hi>
        <br />
        = <b>−1 + 7<I/></b>
      </>
    ),
  },
  {
    expr: <>(<Re>3</Re>−<I/>)(<Re>3</Re>+<I/>) = ?</>,
    choices: [<>8</>, <>9</>, <>10<I/></>, <>10</>],
    correct: 3,
    solution: (
      <>
        합차공식 적용: <Re>3²</Re> − (<I/>)²
        <br />
        = 9 − <Hi><I/>²</Hi> = 9 − <Hi>(−1)</Hi>
        <br />
        = <b>10</b> &nbsp;← 켤레끼리 곱하면 항상 실수!
      </>
    ),
  },
  {
    expr: <>(1 + 2<I/>)² = ?</>,
    choices: [<>−3 + 4<I/></>, <>1 + 4<I/></>, <>3 + 4<I/></>, <>−3 − 4<I/></>],
    correct: 0,
    solution: (
      <>
        (1 + 2<I/>)² = 1² + 2·1·2<I/> + (2<I/>)²
        <br />
        = 1 + 4<I/> + 4<Hi><I/>²</Hi>
        <br />
        = 1 + 4<I/> + 4 × <Hi>(−1)</Hi>
        <br />
        = <b>−3 + 4<I/></b>
      </>
    ),
  },
  {
    expr: <>(<Re>2</Re>+<Im>3</Im><I/>)(<Re>2</Re>−<Im>3</Im><I/>) = ?</>,
    choices: [<>4</>, <>13</>, <>−5</>, <>13<I/></>],
    correct: 1,
    solution: (
      <>
        합차공식 적용: <Re>2²</Re> + <Im>3²</Im>
        <br />
        = 4 + 9 = <b>13</b>
        <br />
        일반식: (<Re>a</Re>+<Im>b</Im><I/>)(<Re>a</Re>−<Im>b</Im><I/>) = <Re>a²</Re>+<Im>b²</Im> → 항상 실수!
      </>
    ),
  },
  {
    expr: <><I/> · (3 − 4<I/>) = ?</>,
    choices: [<>3<I/> − 4<I/></>, <>−4 + 3<I/></>, <>4 + 3<I/></>, <>3 − 4<I/></>],
    correct: 2,
    solution: (
      <>
        <I/>·3 + <I/>·(−4<I/>)
        <br />
        = 3<I/> − 4<Hi><I/>²</Hi> = 3<I/> − 4 × <Hi>(−1)</Hi>
        <br />
        = <b>4 + 3<I/></b>
      </>
    ),
  },
];

// 분수 표기 (분자 ÷ 분모)
function Frac({ num, den }: { num: ReactNode; den: ReactNode }) {
  return (
    <span className="inline-flex flex-col items-center px-2 align-middle leading-tight">
      <span>{num}</span>
      <span className="my-0.5 block h-[2px] w-full bg-violet-300/70" />
      <span>{den}</span>
    </span>
  );
}

const P3: P3Q[] = [
  {
    qtype: "conjugate",
    expr: <>3 + 4<I/> 의 켤레복소수는?</>,
    choices: [<>−3 + 4<I/></>, <>4 + 3<I/></>, <>−3 − 4<I/></>, <>3 − 4<I/></>],
    correct: 3,
    solution: (
      <>
        <Re>a</Re>+<Im>b</Im><I/> 의 켤레 = <Re>a</Re>−<Im>b</Im><I/>
        <br />
        3 + 4<I/> → 허수부분의 부호만 바꾸면 켤레 = <b>3 − 4<I/></b>
      </>
    ),
  },
  {
    qtype: "conjugate",
    expr: <>5<I/> 의 켤레복소수는?</>,
    choices: [<>−5<I/></>, <>5<I/></>, <>5</>, <>−5</>],
    correct: 0,
    solution: (
      <>
        5<I/> = 0 + 5<I/> → 실수부분 = 0, 허수부분 = 5
        <br />
        켤레 = 0 − 5<I/> = <b>−5<I/></b>
        <br />
        순허수의 켤레도 순허수예요!
      </>
    ),
  },
  {
    qtype: "division",
    expr: <><Frac num={<>2 + 4<I/></>} den={<>1 + <I/></>} /> = ?</>,
    choices: [<>3 − <I/></>, <>3 + <I/></>, <>6 + 2<I/></>, <>2 + 4<I/></>],
    correct: 1,
    solution: (
      <>
        분모의 켤레 <b>(1 − <I/>)</b> 를 분자·분모에 곱함.
        <br />
        분자: (2 + 4<I/>)(1 − <I/>) = 2 − 2<I/> + 4<I/> − 4<Hi><I/>²</Hi>
        <br />
        = 2 + 2<I/> + 4 = <b>6 + 2<I/></b>
        <br />
        분모: (1 + <I/>)(1 − <I/>) = 1 + 1 = <b>2</b>
        <br />
        ∴ (6 + 2<I/>) ÷ 2 = <b>3 + <I/></b>
      </>
    ),
  },
  {
    qtype: "division",
    expr: <><Frac num={<>1 + <I/></>} den={<>1 − <I/></>} /> = ?</>,
    choices: [<>1</>, <>−<I/></>, <><I/></>, <>2<I/></>],
    correct: 2,
    solution: (
      <>
        분모의 켤레 <b>(1 + <I/>)</b> 를 곱함.
        <br />
        분자: (1 + <I/>)² = 1 + 2<I/> + <Hi><I/>²</Hi> = 1 + 2<I/> − 1 = <b>2<I/></b>
        <br />
        분모: (1 − <I/>)(1 + <I/>) = 1 + 1 = <b>2</b>
        <br />
        ∴ 2<I/> ÷ 2 = <b><I/></b>
      </>
    ),
  },
  {
    qtype: "division",
    expr: <><Frac num={<>3 + <I/></>} den={<>2 − <I/></>} /> = ?</>,
    choices: [<>1 − <I/></>, <>3 + <I/></>, <>5 + 5<I/></>, <>1 + <I/></>],
    correct: 3,
    solution: (
      <>
        분모의 켤레 <b>(2 + <I/>)</b> 를 곱함.
        <br />
        분자: (3 + <I/>)(2 + <I/>) = 6 + 3<I/> + 2<I/> + <Hi><I/>²</Hi>
        <br />
        = 6 + 5<I/> − 1 = <b>5 + 5<I/></b>
        <br />
        분모: (2 − <I/>)(2 + <I/>) = 4 + 1 = <b>5</b>
        <br />
        ∴ (5 + 5<I/>) ÷ 5 = <b>1 + <I/></b>
      </>
    ),
  },
];

const MAX_SCORE = (P1.length + P2.length + P3.length) * 10;

// ─── Phase 별 공식 카드 / Break 카드 ────────────────────────
function FormulaCard({ phase }: { phase: Phase }) {
  if (phase === 1)
    return (
      <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3 text-sm leading-7 text-slate-200">
        ➕ <b>덧셈</b>: (<Re>a</Re>+<Im>b</Im><I/>) + (<Re>c</Re>+<Im>d</Im><I/>) ={" "}
        <Re>(a+c)</Re> + <Im>(b+d)</Im><I/>
        <br />
        ➖ <b>뺄셈</b>: (<Re>a</Re>+<Im>b</Im><I/>) − (<Re>c</Re>+<Im>d</Im><I/>) ={" "}
        <Re>(a−c)</Re> + <Im>(b−d)</Im><I/>
      </div>
    );
  if (phase === 2)
    return (
      <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3 text-sm leading-7 text-slate-200">
        ✖️ <b>곱셈</b>: (<Re>a</Re>+<Im>b</Im><I/>)(<Re>c</Re>+<Im>d</Im><I/>) ={" "}
        <Re>(ac−bd)</Re> + <Im>(ad+bc)</Im><I/>
        <br />
        ⚠️ 핵심: <Hi><I/>² = −1</Hi> 적용! &nbsp;(다항식 전개 후 <I/>² 를 −1 로)
      </div>
    );
  return (
    <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3 text-sm leading-7 text-slate-200">
      🔗 <b>켤레</b>: <Re>a</Re>+<Im>b</Im><I/> 의 켤레 = <Re>a</Re>−<Im>b</Im><I/>
      <br />
      ➗ <b>나눗셈</b>: 분모×켤레 → 분모 실수화. (<Re>a</Re>+<Im>b</Im><I/>)(<Re>a</Re>−<Im>b</Im><I/>) ={" "}
      <Re>a²</Re>+<Im>b²</Im>
    </div>
  );
}

// ─── 컴포넌트 ───────────────────────────────────────────────
type Screen = "intro" | "game" | "break" | "result";
type Phase = 1 | 2 | 3;

export default function ComplexArithmeticGame() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [phase, setPhase] = useState<Phase>(1);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // 문제 변경 시 답 리셋 (의도된 리셋 패턴)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChosen(null);
    setAnswered(false);
  }, [phase, qIdx]);

  const list = phase === 1 ? P1 : phase === 2 ? P2 : P3;
  const current = list[qIdx];
  const total = list.length;
  const progressPct = Math.round((qIdx / total) * 100);

  function start() {
    setPhase(1);
    setQIdx(0);
    setScore(0);
    setScreen("game");
  }

  function pickChoice(idx: number) {
    if (answered) return;
    const correct = idx === current.correct;
    setChosen(idx);
    setAnswered(true);
    if (correct) setScore((s) => s + 10);
  }

  function nextQuestion() {
    if (qIdx + 1 < total) {
      setQIdx(qIdx + 1);
      return;
    }
    if (phase === 3) {
      setScreen("result");
      return;
    }
    setScreen("break");
  }

  function startNextPhase() {
    const next: Phase = phase === 1 ? 2 : 3;
    setPhase(next);
    setQIdx(0);
    setScreen("game");
  }

  function restart() {
    setPhase(1);
    setQIdx(0);
    setScore(0);
    setChosen(null);
    setAnswered(false);
    setScreen("intro");
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* ─── 헤더 ─── */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">⚡ 복소수 계산 배틀!</h3>
        <p className="mt-2 leading-7 text-slate-300">
          덧셈·뺄셈 → 곱셈 → 켤레·나눗셈의 3단계 4지선다 게임으로
          복소수 사칙연산을 정복해 봅시다.
        </p>
      </div>

      {screen === "intro" ? (
        <IntroScreen onStart={start} />
      ) : screen === "result" ? (
        <ResultScreen score={score} onRestart={restart} />
      ) : screen === "break" ? (
        <BreakScreen fromPhase={phase} onNext={startNextPhase} />
      ) : (
        <>
          {/* 상단 상태 */}
          <div className="mt-5 flex items-center gap-3">
            <span className="rounded-full border border-violet-400/45 bg-violet-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-100">
              Phase {phase} · {phase === 1 ? "덧셈·뺄셈" : phase === 2 ? "곱셈" : "켤레·나눗셈"}
            </span>
            <svg
              viewBox="0 0 100 4"
              preserveAspectRatio="none"
              className="h-2 flex-1"
              role="img"
              aria-label={`진행률 ${progressPct}%`}
            >
              <defs>
                <linearGradient id="cagProgGrad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
              <rect x="0" y="0" width={progressPct} height="4" rx="2" fill="url(#cagProgGrad)" />
            </svg>
            <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 font-mono text-xs font-bold text-cyan-100">
              {qIdx + 1} / {total}
            </span>
            <span className="rounded-full border border-amber-400/55 bg-amber-400/15 px-3 py-1 font-mono text-xs font-bold text-amber-100">
              ⚡ {score} / {MAX_SCORE}
            </span>
          </div>

          {/* 공식 카드 */}
          <div className="mt-4">
            <FormulaCard phase={phase} />
          </div>

          {/* 문제 카드 */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {phase === 3
                ? (current as P3Q).qtype === "conjugate"
                  ? "켤레복소수 찾기"
                  : "나눗셈 계산"
                : phase === 2
                ? "곱셈 계산"
                : "덧셈·뺄셈 계산"}
            </p>
            <div className="mt-3 min-h-[2.5rem] font-mono text-2xl font-extrabold text-white">
              {current.expr}
            </div>
          </div>

          {/* 4지선다 */}
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {current.choices.map((c, i) => {
              const isCorrect = i === current.correct;
              const isChosen = chosen === i;
              const showCorrect = answered && isCorrect;
              const showWrong = answered && isChosen && !isCorrect;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickChoice(i)}
                  disabled={answered}
                  className={
                    "flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-base font-bold transition disabled:cursor-default " +
                    (showCorrect
                      ? "border-emerald-400 bg-emerald-400/20 text-emerald-100 ring-4 ring-emerald-300/60"
                      : showWrong
                      ? "border-rose-400 bg-rose-400/20 text-rose-100 ring-4 ring-rose-300/60"
                      : "border-violet-400/30 bg-white/5 text-slate-100") +
                    (!answered ? " hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-400/15" : "")
                  }
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-400/30 text-xs font-extrabold text-violet-50">
                    {"ABCD"[i]}
                  </span>
                  <span>{c}</span>
                </button>
              );
            })}
          </div>

          {/* 피드백 + 풀이 */}
          {answered ? (
            <div
              className={
                "mt-5 rounded-xl border p-4 text-sm leading-7 " +
                (chosen === current.correct
                  ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-100"
                  : "border-rose-400/45 bg-rose-400/10 text-rose-100")
              }
            >
              <p className="font-bold">
                {chosen === current.correct ? "✅ 정답!" : "❌ 틀렸어요!"}
              </p>
              <div className="mt-2 rounded-lg bg-black/30 p-3 font-mono text-sm leading-7 text-violet-100">
                {current.solution}
              </div>
            </div>
          ) : null}

          {/* 다음 버튼 */}
          {answered ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={nextQuestion}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
              >
                {qIdx + 1 < total
                  ? "다음 문제 ▶"
                  : phase === 3
                  ? "결과 보기 🏆"
                  : "Phase 정리 ▶"}
              </button>
            </div>
          ) : null}
        </>
      )}

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 인트로 ─────────────────────────────────────────────────
function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <ul className="space-y-3 text-sm leading-7 text-slate-200">
          <li>
            <b className="text-emerald-200">Phase 1 · 덧셈·뺄셈</b>{" "}
            <span className="text-xs text-slate-400">(5문제)</span>
            <br />
            실수부분끼리, 허수부분끼리 따로 계산합니다.
          </li>
          <li>
            <b className="text-violet-200">Phase 2 · 곱셈</b>{" "}
            <span className="text-xs text-slate-400">(5문제)</span>
            <br />
            다항식처럼 전개하되,{" "}
            <Hi><I/>² = −1</Hi> 을 잊지 말고 적용해야 합니다.
          </li>
          <li>
            <b className="text-pink-200">Phase 3 · 켤레·나눗셈</b>{" "}
            <span className="text-xs text-slate-400">(5문제)</span>
            <br />
            켤레복소수를 찾고, 분모의 켤레를 곱해 나눗셈을 계산합니다.
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3 text-sm leading-7 text-slate-200">
        💡 핵심 공식 미리 보기
        <br />
        &nbsp;• 덧셈: <Re>(a+c)</Re> + <Im>(b+d)</Im><I/>
        <br />
        &nbsp;• 곱셈: <Re>(ac−bd)</Re> + <Im>(ad+bc)</Im><I/> &nbsp;←&nbsp; <Hi><I/>²= −1</Hi> 적용
        <br />
        &nbsp;• 켤레: <Re>a</Re>+<Im>b</Im><I/> 의 켤레 = <Re>a</Re>−<Im>b</Im><I/>
        <br />
        &nbsp;• 나눗셈: 분모의 켤레를 분자·분모에 곱해 분모 실수화
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onStart}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
        >
          ▶ 배틀 시작
        </button>
      </div>
    </div>
  );
}

// ─── Break ──────────────────────────────────────────────────
function BreakScreen({ fromPhase, onNext }: { fromPhase: Phase; onNext: () => void }) {
  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-2xl border border-violet-400/40 bg-gradient-to-br from-violet-400/10 to-cyan-400/10 p-5">
        <p className="text-center text-2xl">{fromPhase === 1 ? "✖️" : "🔗"}</p>
        <p className="mt-1 text-center text-base font-bold text-violet-100">
          Phase {fromPhase} 클리어! {fromPhase === 1 ? "이제 곱셈이다!" : "마지막 단계!"}
        </p>
        <div className="mt-4 text-sm leading-7 text-slate-200">
          {fromPhase === 1 ? (
            <>
              <b>복소수 곱셈의 핵심</b>은 <Hi><I/>² = −1</Hi> 을 잊지 않는 것!
              <br />
              <br />
              (a+b<I/>)(c+d<I/>) 전개 시:
              <br />
              &nbsp;ac + ad<I/> + bc<I/> + bd<Hi><I/>²</Hi>
              <br />
              = ac + (ad+bc)<I/> + bd × <Hi>(−1)</Hi>
              <br />
              = <Re>(ac−bd)</Re> + <Im>(ad+bc)</Im><I/>
              <br />
              <br />
              실수부분에서 <b>bd 가 빠지는 것</b>이 다항식 곱셈과의 결정적 차이!
            </>
          ) : (
            <>
              <b>복소수 나눗셈</b>은 <b>켤레복소수</b>가 핵심!
              <br />
              <br />
              <Re>a</Re>+<Im>b</Im><I/> 의 켤레복소수 = <Re>a</Re>−<Im>b</Im><I/>
              <br />
              <br />
              왜 켤레를 곱하나? → 분모를 <b>실수</b>로 만들기 위해!
              <br />
              (<Re>a</Re>+<Im>b</Im><I/>)(<Re>a</Re>−<Im>b</Im><I/>) = <Re>a²</Re> + <Im>b²</Im>{" "}
              ← 항상 실수
              <br />
              <br />
              무리수 분모 유리화와 같은 원리예요!
              <br />
              <span className="text-amber-200"><Sqrt>2</Sqrt> 분모 유리화</span> ×<Sqrt>2</Sqrt>/<Sqrt>2</Sqrt> →{" "}
              <span className="text-amber-200">복소수 나눗셈</span> ×켤레/켤레
            </>
          )}
        </div>
      </div>
      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={onNext}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
        >
          다음 단계로 ▶
        </button>
      </div>
    </div>
  );
}

// ─── 결과 ───────────────────────────────────────────────────
function ResultScreen({ score, onRestart }: { score: number; onRestart: () => void }) {
  const pct = score / MAX_SCORE;
  const { emoji, msg } =
    pct >= 0.93
      ? { emoji: "🏆", msg: "완벽합니다! 복소수 사칙연산을 완전히 마스터했어요! 다항식처럼 전개하면서 i² = −1 만 잊지 않으면 돼요." }
      : pct >= 0.73
      ? { emoji: "⭐", msg: "훌륭해요! 대부분의 문제를 풀었네요. 틀린 문제의 풀이 과정을 다시 한번 살펴보세요." }
      : pct >= 0.53
      ? { emoji: "💪", msg: "좋은 시작! 특히 곱셈에서 i² = −1 적용, 나눗셈에서 켤레 곱하기를 다시 연습해 봐요." }
      : { emoji: "🌱", msg: "괜찮아요. 복소수 연산의 핵심은 ① i² = −1 ② 나눗셈 = 켤레로 분모 실수화. 다시 도전해 봐요!" };

  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-2xl border border-cyan-400/45 bg-gradient-to-br from-cyan-400/10 to-violet-400/10 p-6 text-center">
        <p className="text-5xl">{emoji}</p>
        <p className="mt-2 text-2xl font-extrabold text-white">{score} 점</p>
        <p className="text-xs text-slate-400">/ {MAX_SCORE} 점 ({Math.round(pct * 100)}%)</p>
        <svg
          viewBox="0 0 100 6"
          preserveAspectRatio="none"
          className="mx-auto mt-4 block h-3 w-full max-w-md"
          role="img"
          aria-label={`결과 ${Math.round(pct * 100)}%`}
        >
          <defs>
            <linearGradient id="cagResGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="6" rx="3" fill="rgba(255,255,255,0.1)" />
          <rect x="0" y="0" width={Math.round(pct * 100)} height="6" rx="3" fill="url(#cagResGrad)" />
        </svg>
        <p className="mt-4 text-sm leading-7 text-slate-200">{msg}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center text-sm leading-7 text-slate-200">
        <p>
          <b>최종 정리</b>
        </p>
        <p>• 덧셈·뺄셈은 <b>실수↔실수, 허수↔허수</b>끼리 계산</p>
        <p>
          • 곱셈은 다항식 전개 후 <Hi><I/>² = −1</Hi> 대입
        </p>
        <p>• 나눗셈은 분모의 <b>켤레복소수</b>를 곱해 분모를 실수로</p>
        <p>
          • (<Re>a</Re>+<Im>b</Im><I/>)(<Re>a</Re>−<Im>b</Im><I/>) = <Re>a²</Re>+<Im>b²</Im> → 항상 실수!
        </p>
      </div>

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          🔄 처음부터 다시
        </button>
      </div>
    </div>
  );
}
