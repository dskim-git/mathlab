"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "real_imag_part",
    prompt:
      "복소수 a + bi 에서 실수부분은 a, 허수부분은 bi 가 아니라 b 입니다. 자신이 예시 복소수 하나를 직접 들어, 그 수의 실수부분과 허수부분을 쓰고, 실수 · 허수 · 순허수 중 어느 것에 해당하는지 그 이유와 함께 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: −2 + 5i 의 실수부분은 −2, 허수부분은 5 (5i 가 아니라!). 허수부분 5 ≠ 0 이므로 허수이고, 실수부분이 0이 아니므로 순허수는 아니다.",
  },
];

// ─── 표기 헬퍼 ─────────────────────────────────────────────
function I() {
  return <em className="font-serif italic text-pink-300">i</em>;
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
type Kind = "실수" | "허수" | "순허수";

type Phase1Q = { expr: ReactNode; type: Kind; hint: ReactNode };
type Phase2Q = {
  expr: ReactNode;
  realOpts: ReactNode[]; realAns: number;
  imagOpts: ReactNode[]; imagAns: number;
  hint: ReactNode;
};
type Phase3Q = { text: ReactNode; ans: "O" | "X"; hint: ReactNode };

const P1: Phase1Q[] = [
  { expr: <>3</>, type: "실수",
    hint: <>3 = 3 + 0 · <I/> → 허수부분이 0이므로 <b>실수</b>입니다.</> },
  { expr: <>2 + <Sqrt>5</Sqrt></>, type: "실수",
    hint: <><Sqrt>5</Sqrt> 는 실수이므로 2 + <Sqrt>5</Sqrt> 도 <b>실수</b>입니다. (허수부분 = 0)</> },
  { expr: <>1 − 2<I/></>, type: "허수",
    hint: <>허수부분 = −2 ≠ 0 → <b>허수</b> (실수가 아닌 복소수)</> },
  { expr: <>4<I/></>, type: "순허수",
    hint: <>실수부분 = 0, 허수부분 = 4 ≠ 0 → <b>순허수</b></> },
  { expr: <>−7</>, type: "실수",
    hint: <>−7 = −7 + 0 · <I/> → 허수부분 = 0 → <b>실수</b></> },
  { expr: <><Sqrt>2</Sqrt> + <I/></>, type: "허수",
    hint: <>허수부분 = 1 ≠ 0 → <b>허수</b></> },
  { expr: <>−3<I/></>, type: "순허수",
    hint: <>실수부분 = 0, 허수부분 = −3 ≠ 0 → <b>순허수</b></> },
  { expr: <>0</>, type: "실수",
    hint: <>0 = 0 + 0 · <I/> → 허수부분 = 0 → <b>실수</b> (0도 복소수!)</> },
];

const P2: Phase2Q[] = [
  {
    expr: <>3 + 4<I/></>,
    realOpts: ["3", "4", "7", "0"], realAns: 0,
    imagOpts: ["4", "3", "−4", "0"], imagAns: 0,
    hint: <>3 + 4<I/> → 실수부분 = <b>3</b>, 허수부분 = <b>4</b></>,
  },
  {
    expr: <>5 − <I/></>,
    realOpts: ["5", "−1", "1", "6"], realAns: 0,
    imagOpts: ["−1", "1", "5", "−5"], imagAns: 0,
    hint: <>5 − <I/> = 5 + (−1)<I/> → 실수부분 = <b>5</b>, 허수부분 = <b>−1</b></>,
  },
  {
    expr: <>−2<I/></>,
    realOpts: ["0", "−2", "2", "−2"], realAns: 0,
    imagOpts: ["−2", "0", "2", <>−2<I/></>], imagAns: 0,
    hint: <>0 + (−2)<I/> → 실수부분 = <b>0</b>, 허수부분 = <b>−2</b> &nbsp;(순허수!)</>,
  },
  {
    expr: <><Sqrt>3</Sqrt></>,
    realOpts: [<><Sqrt>3</Sqrt></>, "0", "3", <>−<Sqrt>3</Sqrt></>], realAns: 0,
    imagOpts: ["0", <><Sqrt>3</Sqrt></>, "1", "−1"], imagAns: 0,
    hint: <><Sqrt>3</Sqrt> = <Sqrt>3</Sqrt> + 0<I/> → 실수부분 = <b><Sqrt>3</Sqrt></b>, 허수부분 = <b>0</b> &nbsp;(실수!)</>,
  },
  {
    expr: <>−1 − 3<I/></>,
    realOpts: ["−1", "−3", "1", "3"], realAns: 0,
    imagOpts: ["−3", "−1", "3", "1"], imagAns: 0,
    hint: <>−1 + (−3)<I/> → 실수부분 = <b>−1</b>, 허수부분 = <b>−3</b></>,
  },
];

const P3: Phase3Q[] = [
  {
    text: <>복소수 a + b<I/> 에서 허수부분은 b<I/> 이다.</>,
    ans: "X",
    hint: <>허수부분은 b<I/> 가 아니라 <b>b</b> 입니다. 실수부분·허수부분 모두 실수 값이에요!</>,
  },
  {
    text: <>모든 실수는 복소수이다.</>,
    ans: "O",
    hint: <>a = a + 0 · <I/> 이므로 모든 실수는 복소수입니다.</>,
  },
  {
    text: <>복소수끼리는 크기(대소)를 비교할 수 있다.</>,
    ans: "X",
    hint: <>허수를 포함한 복소수는 대소 비교가 <b>불가능</b>합니다. (실수끼리는 비교 가능)</>,
  },
  {
    text: <>순허수는 허수에 속한다.</>,
    ans: "O",
    hint: <>순허수 (a = 0, b ≠ 0) 는 허수 (b ≠ 0) 의 특수한 경우로 허수에 속합니다.</>,
  },
  {
    text: <>2 + 0<I/> 는 허수이다.</>,
    ans: "X",
    hint: <>허수부분 b = 0 이므로 <b>실수</b>입니다. 2 + 0<I/> = 2.</>,
  },
];

const MAX_SCORE = P1.length * 10 + P2.length * 10 + P3.length * 10;

const KIND_TONE: Record<
  Kind,
  { box: string; ring: string }
> = {
  "실수":   { box: "border-emerald-400/55 bg-emerald-400/15 text-emerald-100", ring: "ring-emerald-300/60" },
  "허수":   { box: "border-sky-400/55 bg-sky-400/15 text-sky-100",             ring: "ring-sky-300/60" },
  "순허수": { box: "border-violet-400/55 bg-violet-400/15 text-violet-100",     ring: "ring-violet-300/60" },
};

// ─── 컴포넌트 ───────────────────────────────────────────────
type Screen = "intro" | "game" | "break" | "result";
type Phase = 1 | 2 | 3;
type Tone = "ok" | "ng" | "info";

function shuffle4(): number[] {
  const a = [0, 1, 2, 3];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ComplexNumberTerms() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [phase, setPhase] = useState<Phase>(1);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);

  // Phase 1 / 3 — 단일 선택
  const [chosenP1, setChosenP1] = useState<Kind | null>(null);
  const [chosenP3, setChosenP3] = useState<"O" | "X" | null>(null);

  // Phase 2 — 두 줄 (실수부분 + 허수부분) 셔플 + 선택
  const [p2RealOrder, setP2RealOrder] = useState<number[] | null>(null);
  const [p2ImagOrder, setP2ImagOrder] = useState<number[] | null>(null);
  const [p2RealPicked, setP2RealPicked] = useState<number | null>(null);
  const [p2ImagPicked, setP2ImagPicked] = useState<number | null>(null);

  // 공통
  const [feedback, setFeedback] = useState<{ tone: Tone; node: ReactNode } | null>(null);
  const [answered, setAnswered] = useState(false);

  // 문제 / phase 전환 시 입력 상태 리셋 + Phase 2 셔플
  useEffect(() => {
    setChosenP1(null);
    setChosenP3(null);
    setP2RealPicked(null);
    setP2ImagPicked(null);
    setFeedback(null);
    setAnswered(false);
    if (phase === 2) {
      setP2RealOrder(shuffle4());
      setP2ImagOrder(shuffle4());
    } else {
      setP2RealOrder(null);
      setP2ImagOrder(null);
    }
  }, [phase, qIdx]);

  const phaseTotal = phase === 1 ? P1.length : phase === 2 ? P2.length : P3.length;
  const phaseProgress = Math.round((qIdx / phaseTotal) * 100);

  function start() {
    setPhase(1);
    setQIdx(0);
    setScore(0);
    setScreen("game");
  }

  function nextQuestion() {
    if (qIdx + 1 < phaseTotal) {
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
    setScreen("intro");
  }

  // Phase 1 정답 처리
  function answerClassify(choice: Kind) {
    if (answered) return;
    const data = P1[qIdx];
    const correct = choice === data.type;
    setChosenP1(choice);
    setAnswered(true);
    if (correct) setScore((s) => s + 10);
    setFeedback({
      tone: correct ? "ok" : "ng",
      node: (
        <>
          <b>{correct ? "✅ 정답!" : "❌ 아쉬워요!"}</b> {data.hint}
        </>
      ),
    });
  }

  // Phase 3 정답 처리
  function answerOX(choice: "O" | "X") {
    if (answered) return;
    const data = P3[qIdx];
    const correct = choice === data.ans;
    setChosenP3(choice);
    setAnswered(true);
    if (correct) setScore((s) => s + 10);
    setFeedback({
      tone: correct ? "ok" : "ng",
      node: (
        <>
          <b>{correct ? "✅ 정답!" : "❌ 아쉬워요!"}</b> {data.hint}
        </>
      ),
    });
  }

  // Phase 2 — 한 행(실수 or 허수) 선택
  function pickPart(part: "real" | "imag", pos: number) {
    if (answered) return;
    if (part === "real" && p2RealPicked !== null) return;
    if (part === "imag" && p2ImagPicked !== null) return;

    const data = P2[qIdx];
    if (!p2RealOrder || !p2ImagOrder) return;
    const order = part === "real" ? p2RealOrder : p2ImagOrder;
    const origAns = part === "real" ? data.realAns : data.imagAns;
    const correctPos = order.indexOf(origAns);
    const correct = pos === correctPos;

    if (part === "real") setP2RealPicked(pos);
    else setP2ImagPicked(pos);
    if (correct) setScore((s) => s + 5);

    // 둘 다 선택 끝났는지 확인
    const realDone = part === "real" ? true : p2RealPicked !== null;
    const imagDone = part === "imag" ? true : p2ImagPicked !== null;
    if (realDone && imagDone) {
      const realOk = (part === "real" ? correct : (p2RealPicked === p2RealOrder.indexOf(data.realAns)));
      const imagOk = (part === "imag" ? correct : (p2ImagPicked === p2ImagOrder.indexOf(data.imagAns)));
      const allOk = realOk && imagOk;
      setAnswered(true);
      setFeedback({
        tone: allOk ? "ok" : "ng",
        node: (
          <>
            <b>{allOk ? "✅ 완벽!" : "💡 확인해 봅시다."}</b> {data.hint}
          </>
        ),
      });
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* ─── 헤더 ─── */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🌀 복소수 정복! 용어 마스터</h3>
        <p className="mt-2 leading-7 text-slate-300">
          3단계 퀴즈로 복소수의 핵심 용어(실수·허수·순허수, 실수부분·허수부분)를 정복해 봅시다.
        </p>
      </div>

      {/* ─── 화면 분기 ─── */}
      {screen === "intro" ? (
        <IntroScreen onStart={start} />
      ) : screen === "result" ? (
        <ResultScreen score={score} onRestart={restart} />
      ) : screen === "break" ? (
        <BreakScreen phase={phase} onNext={startNextPhase} />
      ) : (
        <>
          {/* 상단 상태 */}
          <div className="mt-5 flex items-center gap-3">
            <span className="rounded-full border border-violet-400/45 bg-violet-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-100">
              Phase {phase} · {phase === 1 ? "분류관" : phase === 2 ? "성분 해독기" : "O/X 판별대"}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-[width] duration-500"
                style={{ width: `${phaseProgress}%` }}
              />
            </div>
            <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 font-mono text-xs font-bold text-cyan-100">
              {qIdx + 1} / {phaseTotal}
            </span>
            <span className="rounded-full border border-amber-400/55 bg-amber-400/15 px-3 py-1 font-mono text-xs font-bold text-amber-100">
              ⭐ {score} 점
            </span>
          </div>

          {/* 문제 카드 */}
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {phase === 1
                ? "다음 수는 실수·허수·순허수 중 어느 것인가요?"
                : phase === 2
                ? "다음 복소수의 실수부분 a 와 허수부분 b 를 찾으세요."
                : "다음 설명이 맞으면 ⭕, 틀리면 ❌!"}
            </p>
            <div className="mt-3 min-h-[2.5rem] font-mono text-3xl font-extrabold text-white">
              {phase === 1 ? P1[qIdx].expr : phase === 2 ? P2[qIdx].expr : P3[qIdx].text}
            </div>
          </div>

          {/* Phase 1 — 분류 버튼 */}
          {phase === 1 ? (
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              {(["실수", "허수", "순허수"] as Kind[]).map((k) => {
                const ans = P1[qIdx].type;
                const isAns = answered && k === ans;
                const isChosen = chosenP1 === k;
                const wrong = answered && isChosen && !isAns;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => answerClassify(k)}
                    disabled={answered}
                    className={
                      "min-w-[100px] rounded-xl border-2 px-5 py-2.5 text-sm font-extrabold transition disabled:cursor-default " +
                      KIND_TONE[k].box +
                      (isAns ? ` ring-4 ${KIND_TONE[k].ring}` : "") +
                      (wrong ? " opacity-90 ring-4 ring-rose-400/60" : "") +
                      (!answered ? " hover:-translate-y-0.5 hover:brightness-110" : "")
                    }
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Phase 2 — 4지선다 × 2 */}
          {phase === 2 && p2RealOrder && p2ImagOrder ? (
            <PartsArea
              data={P2[qIdx]}
              realOrder={p2RealOrder}
              imagOrder={p2ImagOrder}
              realPicked={p2RealPicked}
              imagPicked={p2ImagPicked}
              answered={answered}
              onPick={pickPart}
            />
          ) : null}

          {/* Phase 3 — O/X */}
          {phase === 3 ? (
            <div className="mt-5 flex justify-center gap-3">
              {(["O", "X"] as const).map((c) => {
                const ans = P3[qIdx].ans;
                const isAns = answered && c === ans;
                const isChosen = chosenP3 === c;
                const wrong = answered && isChosen && !isAns;
                const tone = c === "O"
                  ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
                  : "border-rose-400/55 bg-rose-400/15 text-rose-100";
                const ring = c === "O" ? "ring-emerald-300/60" : "ring-rose-300/60";
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => answerOX(c)}
                    disabled={answered}
                    className={
                      "min-w-[110px] rounded-xl border-2 px-5 py-2.5 text-base font-extrabold transition disabled:cursor-default " +
                      tone +
                      (isAns ? ` ring-4 ${ring}` : "") +
                      (wrong ? " ring-4 ring-rose-400/60 opacity-95" : "") +
                      (!answered ? " hover:-translate-y-0.5 hover:brightness-110" : "")
                    }
                  >
                    {c === "O" ? "⭕ O (참)" : "❌ X (거짓)"}
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* 피드백 */}
          {feedback ? (
            <div
              className={
                "mt-5 rounded-xl border p-3 text-sm leading-7 " +
                (feedback.tone === "ok"
                  ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-100"
                  : feedback.tone === "ng"
                  ? "border-rose-400/45 bg-rose-400/10 text-rose-100"
                  : "border-cyan-400/45 bg-cyan-400/10 text-cyan-100")
              }
            >
              {feedback.node}
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
                {qIdx + 1 < phaseTotal
                  ? "다음 문제 ▶"
                  : phase === 3
                  ? "결과 보기 🏆"
                  : "Phase 정리 ▶"}
              </button>
            </div>
          ) : null}

          {/* 규칙 카드 (게임 화면 하단 상시) */}
          <RuleCard />
        </>
      )}

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── Phase 2 4지선다 × 2 ────────────────────────────────────
function PartsArea({
  data,
  realOrder,
  imagOrder,
  realPicked,
  imagPicked,
  answered,
  onPick,
}: {
  data: Phase2Q;
  realOrder: number[];
  imagOrder: number[];
  realPicked: number | null;
  imagPicked: number | null;
  answered: boolean;
  onPick: (part: "real" | "imag", pos: number) => void;
}) {
  return (
    <div className="mt-5 space-y-4">
      <PartRow
        label={<>🟢 실수부분 <b>a</b> 는?</>}
        opts={realOrder.map((origIdx) => data.realOpts[origIdx])}
        correctPos={realOrder.indexOf(data.realAns)}
        picked={realPicked}
        answered={answered}
        onPick={(pos) => onPick("real", pos)}
        tone="emerald"
      />
      <PartRow
        label={
          <>
            🟣 허수부분 <b>b</b> 는?{" "}
            <span className="text-xs font-normal text-slate-400">(b<I/> 가 아닌 b 값)</span>
          </>
        }
        opts={imagOrder.map((origIdx) => data.imagOpts[origIdx])}
        correctPos={imagOrder.indexOf(data.imagAns)}
        picked={imagPicked}
        answered={answered}
        onPick={(pos) => onPick("imag", pos)}
        tone="violet"
      />
    </div>
  );
}

function PartRow({
  label,
  opts,
  correctPos,
  picked,
  answered,
  onPick,
  tone,
}: {
  label: ReactNode;
  opts: ReactNode[];
  correctPos: number;
  picked: number | null;
  answered: boolean;
  onPick: (pos: number) => void;
  tone: "emerald" | "violet";
}) {
  const baseBox =
    tone === "emerald"
      ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-100"
      : "border-violet-400/45 bg-violet-400/10 text-violet-100";
  const baseRing = tone === "emerald" ? "ring-emerald-300/60" : "ring-violet-300/60";
  const rowDone = picked !== null;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="mb-2 text-sm font-bold text-slate-200">{label}</p>
      <div className="flex flex-wrap gap-2">
        {opts.map((opt, pos) => {
          const isAns = pos === correctPos;
          const isPicked = picked === pos;
          // 행 자체가 끝났을 때(picked != null) 정답은 항상 ring 강조,
          // 게임 전체가 끝났을 때(answered) 다른 오답은 흐리게
          const showCorrect = (rowDone || answered) && isAns;
          const showWrong = (rowDone || answered) && isPicked && !isAns;
          return (
            <button
              key={pos}
              type="button"
              onClick={() => onPick(pos)}
              disabled={rowDone || answered}
              className={
                "min-w-[58px] rounded-lg border-2 px-4 py-1.5 text-base font-extrabold transition disabled:cursor-default " +
                baseBox +
                (showCorrect ? ` ring-4 ${baseRing}` : "") +
                (showWrong ? " ring-4 ring-rose-400/60 opacity-95" : "") +
                (!rowDone && !answered ? " hover:-translate-y-0.5 hover:brightness-110" : "")
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── 인트로 화면 ────────────────────────────────────────────
function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <ul className="space-y-3 text-sm leading-7 text-slate-200">
          <li>
            <b className="text-violet-200">Phase 1 · 분류관</b>{" "}
            <span className="text-xs text-slate-400">(8문제)</span>
            <br />
            주어진 수가 <span className="text-emerald-200">실수</span>인지,{" "}
            <span className="text-sky-200">허수</span>인지,{" "}
            <span className="text-violet-200">순허수</span>인지 분류합니다.
          </li>
          <li>
            <b className="text-violet-200">Phase 2 · 성분 해독기</b>{" "}
            <span className="text-xs text-slate-400">(5문제)</span>
            <br />
            복소수의 <b className="text-emerald-200">실수부분 a</b> 와{" "}
            <b className="text-violet-200">허수부분 b</b> 를 찾습니다.
          </li>
          <li>
            <b className="text-violet-200">Phase 3 · O/X 판별대</b>{" "}
            <span className="text-xs text-slate-400">(5문제)</span>
            <br />
            복소수에 관한 설명이 맞으면 ⭕, 틀리면 ❌!
          </li>
        </ul>
      </div>

      <RuleCard />

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onStart}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
        >
          ▶ 게임 시작
        </button>
      </div>
    </div>
  );
}

// ─── 공통 규칙 카드 ────────────────────────────────────────
function RuleCard() {
  return (
    <div className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3 text-sm leading-7 text-slate-200">
      💡 복소수 a + b<I/> 에서<br />
      &nbsp;&nbsp;• <b>실수부분</b> = <b>a</b> &nbsp;|&nbsp; <b>허수부분</b> = <b>b</b>{" "}
      <span className="text-xs text-rose-300">
        (⚠️ b<I/> 가 아니라 b 입니다!)
      </span>
      <br />
      &nbsp;&nbsp;• <b className="text-emerald-200">b = 0</b> → 실수 &nbsp;|&nbsp;{" "}
      <b className="text-sky-200">b ≠ 0</b> → 허수 &nbsp;|&nbsp;{" "}
      <b className="text-violet-200">a = 0, b ≠ 0</b> → 순허수
    </div>
  );
}

// ─── Break 화면 (Phase 1→2, 2→3 정리) ────────────────────────
function BreakScreen({ phase, onNext }: { phase: Phase; onNext: () => void }) {
  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-2xl border border-violet-400/40 bg-gradient-to-br from-violet-400/10 to-cyan-400/10 p-5">
        <p className="text-center text-2xl">{phase === 1 ? "🎯" : "⚗️"}</p>
        <p className="mt-1 text-center text-base font-bold text-violet-100">
          Phase {phase} 완료! 핵심 정리
        </p>
        <div className="mt-4 text-sm leading-7 text-slate-200">
          {phase === 1 ? (
            <>
              복소수 a + b<I/> 에서
              <br />
              &nbsp;• <b>b = 0</b> → <b className="text-emerald-200">실수</b>
              <br />
              &nbsp;• <b>b ≠ 0</b> → <b className="text-sky-200">허수</b> (실수가 아닌 복소수)
              <br />
              &nbsp;• <b>a = 0, b ≠ 0</b> → <b className="text-violet-200">순허수</b>
              <br />
              <br />
              <b>포함 관계:</b> 순허수 ⊂ 허수 ⊂ 복소수 &nbsp;/&nbsp; 실수 ⊂ 복소수
            </>
          ) : (
            <>
              a + b<I/> 에서 실수부분 = <b>a</b>, 허수부분 = <b>b</b>.
              <br />
              ⚠️ 허수부분은 <b>b<I/> 가 아니라 b</b> (실수 값!) 입니다.
              <br />
              <br />
              예) 5 − <I/> &nbsp;→&nbsp; 실수부분 = <b>5</b>, 허수부분 = <b>−1</b>
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

// ─── 결과 화면 ──────────────────────────────────────────────
function ResultScreen({ score, onRestart }: { score: number; onRestart: () => void }) {
  const pct = Math.round((score / MAX_SCORE) * 100);
  const { emoji, msg } =
    pct >= 90
      ? { emoji: "🏆", msg: "완벽해요! 복소수 용어를 완전히 정복했군요!" }
      : pct >= 70
      ? { emoji: "🎉", msg: "훌륭해요! 거의 다 알고 있네요. 틀린 부분을 한 번 더 짚어 봅시다." }
      : pct >= 50
      ? { emoji: "😊", msg: "잘 했어요! 위쪽 규칙 카드를 다시 한 번 읽고 도전해 봐요." }
      : { emoji: "💪", msg: "아직 어렵지요? 규칙 카드를 참고해서 다시 도전해 봐요!" };

  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-2xl border border-cyan-400/45 bg-gradient-to-br from-cyan-400/10 to-violet-400/10 p-6 text-center">
        <p className="text-5xl">{emoji}</p>
        <p className="mt-2 text-2xl font-extrabold text-white">{score} 점</p>
        <p className="text-xs text-slate-400">/ {MAX_SCORE} 점 ({pct}%)</p>
        <div className="mx-auto mt-4 h-3 max-w-md overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-[width] duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-200">{msg}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center text-sm leading-7 text-slate-200">
        <span className="inline-flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-md border border-cyan-400/45 bg-cyan-400/15 px-2 py-0.5 text-xs font-bold text-cyan-100">
            복소수
          </span>
          <span className="text-slate-500">⊃</span>
          <span className="rounded-md border border-emerald-400/45 bg-emerald-400/15 px-2 py-0.5 text-xs font-bold text-emerald-100">
            실수
          </span>
          <span className="text-slate-500">+</span>
          <span className="rounded-md border border-sky-400/45 bg-sky-400/15 px-2 py-0.5 text-xs font-bold text-sky-100">
            허수
          </span>
          <span className="text-slate-500">⊃</span>
          <span className="rounded-md border border-violet-400/45 bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-100">
            순허수
          </span>
        </span>
        <p className="mt-2 text-xs text-slate-400">
          포함 관계: 순허수 ⊂ 허수 ⊂ 복소수 &nbsp;/&nbsp; 실수 ⊂ 복소수
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
