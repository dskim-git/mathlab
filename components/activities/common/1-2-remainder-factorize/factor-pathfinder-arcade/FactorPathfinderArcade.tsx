"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "strategy_decision",
    prompt:
      "이 활동에서 만난 5가지 인수분해 전략(공식 바로 / 치환 / 식 변형 / 한 문자 정리 / 인수정리) 중, 같은 식을 보더라도 헷갈리게 만든 사례 하나를 골라 ‘어떤 단서로 어떤 전략을 골랐는지’ 자신만의 판단 체크리스트를 만들어 보세요.",
    kind: "text",
    placeholder:
      "예: x⁴+x²+1 같은 식은 처음에 ‘치환(x²=t)’ 으로 보이지만 t²+t+1 은 인수분해가 안 된다. 그래서 +x²−x² 를 더하고 빼서 (x²+1)²−x² 의 ‘식 변형 → 제곱의 차’ 로 가야 한다. 나의 체크 순서: ① 공식이 보이는가 → ② 같은 모양 반복? → ③ 항을 더·빼면 살아나는가 → ④ 한 문자 정리가 쉬운가 → ⑤ 고차식이면 유리근 후보부터.",
  },
];

// ─── 전략 / 데이터 ────────────────────────────────────────
type MethodId = "formula" | "substitution" | "transform" | "single_var" | "factor_theorem";

type Method = {
  id: MethodId;
  short: string;
  name: string;
  tip: string;
};

const METHODS: Method[] = [
  {
    id: "formula",
    short: "①",
    name: "공식 바로 적용",
    tip: "완전제곱식, 제곱의 차, 세제곱 공식 등 패턴이 바로 보일 때.",
  },
  {
    id: "substitution",
    short: "②",
    name: "치환 인수분해",
    tip: "반복되는 식이 보이면 한 문자(t 등)로 두고 단순한 식으로 바꿀 때.",
  },
  {
    id: "transform",
    short: "③",
    name: "식 변형 후 인수분해",
    tip: "항을 더하고 빼서 제곱의 차나 공식 형태를 억지로 만들어 줄 때.",
  },
  {
    id: "single_var",
    short: "④",
    name: "한 문자 정리",
    tip: "문자가 여러 개면 한 문자 기준으로 정리해 이차식처럼 다룰 때.",
  },
  {
    id: "factor_theorem",
    short: "⑤",
    name: "인수정리 활용",
    tip: "고차식에서 유리근 후보를 점검하며 일차인수를 찾아 내려갈 때.",
  },
];

type CaseItem = {
  expr: React.ReactNode;
  answer: MethodId;
  note: string;
  hint: React.ReactNode;
};

const BASE_CASES: CaseItem[] = [
  {
    expr: <>x² − 9</>,
    answer: "formula",
    note: "패턴이 바로 드러나는 대표형입니다.",
    hint: <>두 항이 모두 제곱이고 뺄셈입니다. a² − b² 형태를 먼저 떠올리세요.</>,
  },
  {
    expr: <>x⁴ + 2x² + 1</>,
    answer: "substitution",
    note: "같은 모양의 항이 반복됩니다.",
    hint: <>x² 를 하나의 문자로 보면 t² + 2t + 1 입니다.</>,
  },
  {
    expr: <>x⁴ + x² + 1</>,
    answer: "transform",
    note: "이미지 예시처럼 식을 다듬어 구조를 만듭니다.",
    hint: <>x⁴ + 2x² + 1 − x² 처럼 더하고 빼면 제곱의 차로 이어집니다.</>,
  },
  {
    expr: <>2x² + xy − y² + 3x + 1</>,
    answer: "single_var",
    note: "문자가 두 개 이상일 때 정리 기준을 먼저 잡습니다.",
    hint: <>x 에 대한 이차식으로 묶어 보면 계수가 y 를 포함하는 형태가 됩니다.</>,
  },
  {
    expr: <>2x³ − 5x² − 4x + 3</>,
    answer: "factor_theorem",
    note: "삼차식 이상에서는 후보 점검이 강력합니다.",
    hint: <>상수항 약수와 최고차항 계수 약수로 유리근 후보를 먼저 정리하세요.</>,
  },
  {
    expr: <>y⁴ − 10y² + 9</>,
    answer: "substitution",
    note: "제곱 항이 반복되는 전형적인 치환형입니다.",
    hint: <>t = y² 로 치환하면 t² − 10t + 9 로 단순해집니다.</>,
  },
  {
    expr: <>a² + 2ab + b² − 16</>,
    answer: "formula",
    note: "완전제곱식과 제곱의 차 공식을 연속으로 적용하는 유형입니다.",
    hint: <>앞의 세 항이 (a + b)² 이고, 전체는 (a + b)² − 4² 꼴입니다.</>,
  },
  {
    expr: <>x²y − xy² + y²z − yz² + z²x − zx²</>,
    answer: "single_var",
    note: "여러 문자식은 구조를 정리하며 공통 인수를 찾습니다.",
    hint: <>같은 차수, 같은 문자 조합을 기준으로 순서를 정리해 보세요.</>,
  },
  {
    expr: <>8m³ + 1</>,
    answer: "formula",
    note: "세제곱 공식이 바로 보이는 문제입니다.",
    hint: <>(2m)³ + 1³ 로 보면 합의 세제곱 공식을 바로 적용할 수 있습니다.</>,
  },
  {
    expr: <>3x⁴ + 3x² + x + 8</>,
    answer: "factor_theorem",
    note: "고차식에서는 유리근 후보 탐색으로 시작합니다.",
    hint: <>유리근이 없을 수도 있지만, 출발은 후보 점검입니다.</>,
  },
];

type MiniProblem = { expr: React.ReactNode; answer: MethodId };
const MINI_ROUND: MiniProblem[] = [
  { expr: <>x² − 6x + 9</>, answer: "formula" },
  { expr: <>x⁴ − 5x² + 4</>, answer: "substitution" },
  { expr: <>x⁴ + 3x² + 4</>, answer: "transform" },
  { expr: <>x² + xy − 2y²</>, answer: "single_var" },
  { expr: <>x³ − 6x² + 11x − 6</>, answer: "factor_theorem" },
  { expr: <>a⁴ − 1</>, answer: "transform" },
  { expr: <>z⁴ + 4z² + 4</>, answer: "substitution" },
  { expr: <>p³ − 27</>, answer: "formula" },
  { expr: <>x²y + 3xy + 2y</>, answer: "single_var" },
  { expr: <>2x³ + x² − 8x − 4</>, answer: "factor_theorem" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── 메인 ───────────────────────────────────────────────────
export default function FactorPathfinderArcade() {
  const [cases, setCases] = useState<CaseItem[]>(() => shuffle(BASE_CASES));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<MethodId | null>(null);
  const [checked, setChecked] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState(0);
  const [bestMini, setBestMini] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [miniOpen, setMiniOpen] = useState(false);

  const current = cases[idx];
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
  const isLast = idx === cases.length - 1;

  function handleSelect(id: MethodId) {
    if (checked) return;
    setSelected(id);
  }

  function handleCheck() {
    if (checked || !selected) return;
    const ok = selected === current.answer;
    setAttempts((a) => a + 1);
    if (ok) setCorrect((c) => c + 1);
    setChecked(true);
    if (isLast) {
      setShowSummary(true);
      setMiniOpen(true);
    }
  }

  function handleHint() {
    if (!hintShown) {
      setHints((h) => h + 1);
      setHintShown(true);
    }
  }

  function handleNext() {
    if (!checked || isLast) return;
    setIdx((i) => i + 1);
    setSelected(null);
    setChecked(false);
    setHintShown(false);
  }

  function handleRestart() {
    setCases(shuffle(BASE_CASES));
    setIdx(0);
    setSelected(null);
    setChecked(false);
    setHintShown(false);
    setCorrect(0);
    setAttempts(0);
    setHints(0);
    setShowSummary(false);
    setMiniOpen(false);
  }

  const summaryGuide = useMemo(() => {
    if (!showSummary) return "";
    if (accuracy >= 90)
      return `분류 정확도 ${accuracy}% — 전략 선택 감각이 매우 좋습니다. 이제 실제 계산에서도 시작점을 빠르게 잡을 수 있어요.`;
    if (accuracy >= 70)
      return `분류 정확도 ${accuracy}% — 대부분 잘 분류했습니다. 헷갈린 유형은 힌트 문장을 다시 보며 기준을 고정해 보세요.`;
    return `분류 정확도 ${accuracy}% — 아직 기준이 흔들립니다. 계산 전에 5가지 체크포인트를 먼저 확인하는 습관을 추천합니다.`;
  }, [showSummary, accuracy]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* 헤더 */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-amber-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">🧭 인수분해 패스파인더 아케이드</h3>
        <p className="mt-2 leading-7 text-slate-300">
          문제를 보자마자 계산부터 시작하지 말고, 먼저{" "}
          <b className="text-amber-200">어떤 길로 갈지</b> 를 고르는 연습을 해 보세요. 아래 다섯
          전략 중 가장 알맞은 방법을 선택하고, 마지막{" "}
          <b className="text-cyan-200">20초 스피드 미니게임</b> 으로 분류 감각을 완성합니다.
        </p>
        <MethodDeck />
      </div>

      {/* HUD + 체크포인트 */}
      <div className="mt-5 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
        <div className="grid grid-cols-2 gap-2">
          <HudCard label="정답 개수" value={String(correct)} sub="사례 분류 정답" />
          <HudCard
            label="정확도"
            value={`${accuracy}%`}
            sub={attempts ? `시도 ${attempts}회` : "아직 시작 전"}
          />
          <HudCard label="힌트 사용" value={String(hints)} sub="적게 쓸수록 좋음" />
          <HudCard label="미니 최고 점수" value={String(bestMini)} sub="20초 최고 기록" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            🧩 분류 체크포인트
          </p>
          <ol className="ml-4 mt-2 list-decimal space-y-1 text-sm leading-7 text-slate-300">
            <li>공식이 바로 보이는가?</li>
            <li>같은 모양이 반복되는가?</li>
            <li>항을 더하고 빼면 구조가 살아나는가?</li>
            <li>한 문자 기준으로 정리하면 쉬워지는가?</li>
            <li>고차식이라면 인수정리 후보부터 점검할 수 있는가?</li>
          </ol>
        </div>
      </div>

      {/* 진행 막대 */}
      <div className="mt-4 flex items-center gap-3">
        <ProgressBar done={idx + (checked ? 1 : 0)} total={cases.length} />
        <span className="rounded-full border border-amber-400/45 bg-amber-400/15 px-4 py-1 font-mono text-sm font-bold text-amber-100">
          사례 {Math.min(idx + 1, cases.length)} / {cases.length}
        </span>
      </div>

      {/* 사례 본문 */}
      <div className="mt-4 rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.04] to-cyan-500/[0.04] p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-50">사례 {idx + 1} — 어떤 전략이 가장 먼저 적절할까?</p>
            <p className="mt-1 text-xs text-slate-300">{current.note}</p>
          </div>
          <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-3 py-0.5 text-xs font-bold text-cyan-100">
            문제 {idx + 1} / {cases.length}
          </span>
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-5 text-center font-mono text-2xl font-extrabold text-slate-50">
          {current.expr}
        </div>

        <div className="mt-3 grid gap-2">
          {METHODS.map((m) => {
            const isSel = selected === m.id;
            const isCorrect = checked && m.id === current.answer;
            const isWrong = checked && isSel && m.id !== current.answer;
            const cls = isCorrect
              ? "border-emerald-400/70 bg-emerald-400/[0.10]"
              : isWrong
              ? "border-rose-400/70 bg-rose-400/[0.10]"
              : isSel
              ? "border-amber-300 bg-gradient-to-br from-amber-400/[0.18] to-amber-500/[0.10] shadow-md shadow-amber-500/20"
              : "border-white/15 bg-slate-900/60 hover:-translate-y-0.5 hover:border-cyan-400/45 hover:bg-slate-900/80";
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelect(m.id)}
                disabled={checked}
                className={`rounded-xl border-2 px-3 py-3 text-left transition disabled:cursor-not-allowed ${cls}`}
              >
                <p className="text-sm font-extrabold text-slate-50">
                  <span className="mr-2 text-amber-200">{m.short}</span>
                  {m.name}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-300">{m.tip}</p>
              </button>
            );
          })}
        </div>

        {/* 피드백 */}
        {checked ? (
          <p
            className={
              "mt-3 rounded-lg px-3 py-2 text-sm font-bold " +
              (selected === current.answer
                ? "border border-emerald-400/45 bg-emerald-400/15 text-emerald-100"
                : "border border-rose-400/45 bg-rose-400/15 text-rose-100")
            }
          >
            {selected === current.answer
              ? `정답입니다. 이 사례는 "${METHODS.find((m) => m.id === current.answer)?.name}" 접근이 가장 자연스럽습니다.`
              : `이번 사례의 핵심 전략은 "${METHODS.find((m) => m.id === current.answer)?.name}" 입니다. 포인트를 다시 확인해 보세요.`}
          </p>
        ) : null}

        {/* 힌트 */}
        {hintShown ? (
          <p className="mt-3 rounded-lg border border-sky-400/35 bg-sky-400/[0.06] px-3 py-2 text-xs leading-6 text-sky-100">
            💡 {current.hint}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCheck}
            disabled={checked || !selected}
            className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-bold text-white shadow shadow-amber-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            분류 확인
          </button>
          <button
            type="button"
            onClick={handleHint}
            className="rounded-full border border-sky-400/45 bg-sky-400/10 px-5 py-2 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20"
          >
            💡 힌트
          </button>
          {checked && !isLast ? (
            <button
              type="button"
              onClick={handleNext}
              className="ml-auto rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 text-sm font-bold text-white shadow shadow-emerald-500/20 transition hover:brightness-110"
            >
              ➡️ 다음 사례
            </button>
          ) : null}
        </div>
      </div>

      {/* 학습 정리 + 미니게임 */}
      {showSummary ? (
        <div className="mt-4 rounded-2xl border-2 border-emerald-400/45 bg-gradient-to-br from-emerald-500/15 to-sky-500/10 p-4">
          <p className="text-sm font-bold text-emerald-200">🏁 학습 정리</p>
          <p className="mt-2 text-sm leading-7 text-emerald-50">{summaryGuide}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRestart}
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              ↻ 처음부터 다시
            </button>
          </div>
        </div>
      ) : null}

      {miniOpen ? (
        <MiniGame
          onBest={(score) => {
            if (score > bestMini) setBestMini(score);
          }}
        />
      ) : null}

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 5 전략 데크 ──────────────────────────────────────────
function MethodDeck() {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {METHODS.map((m) => (
        <div
          key={m.id}
          className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-slate-900/60 to-slate-900/80 p-3"
        >
          <p className="text-sm font-bold text-amber-200">
            <span className="mr-1.5">{m.short}</span>
            {m.name}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">{m.tip}</p>
        </div>
      ))}
    </div>
  );
}

// ─── HUD ──────────────────────────────────────────────────
function HudCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-amber-400/25 bg-slate-900/60 p-3">
      <p className="text-[10px] font-bold text-amber-200/70">{label}</p>
      <p className="mt-0.5 font-mono text-base font-extrabold text-amber-50">{value}</p>
      <p className="mt-0.5 text-[10px] text-amber-200/55">{sub}</p>
    </div>
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
        <linearGradient id="fpaProgGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="0" y="0" width={ratio * 100} height="4" rx="2" fill="url(#fpaProgGrad)" />
    </svg>
  );
}

// ─── 미니게임 ──────────────────────────────────────────────
function MiniGame({ onBest }: { onBest: (score: number) => void }) {
  const [deck, setDeck] = useState<MiniProblem[]>(() => shuffle(MINI_ROUND));
  const [miIdx, setMiIdx] = useState(0);
  const [time, setTime] = useState(20);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(true);
  const [lastFlash, setLastFlash] = useState<{ id: MethodId; ok: boolean } | null>(null);

  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          // 종료
          setRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
    };
  }, [running]);

  // running 이 false 로 바뀌면 최고 점수 갱신
  useEffect(() => {
    if (!running && time === 0) {
      onBest(score);
    }
  }, [running, time, score, onBest]);

  function handlePick(id: MethodId) {
    if (!running) return;
    const prob = deck[miIdx % deck.length];
    const ok = id === prob.answer;
    if (ok) setScore((s) => s + 1);
    setLastFlash({ id, ok });
    window.setTimeout(() => {
      setMiIdx((i) => i + 1);
      setLastFlash(null);
    }, 130);
  }

  function handleRetry() {
    setDeck(shuffle(MINI_ROUND));
    setMiIdx(0);
    setTime(20);
    setScore(0);
    setLastFlash(null);
    setRunning(true);
  }

  const prob = deck[miIdx % deck.length];

  return (
    <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.06] to-violet-500/[0.04] p-4">
      <p className="text-sm font-bold text-cyan-200">⚡ 최종 미니게임: 20초 전략 스냅</p>
      <p className="mt-1 text-xs leading-6 text-cyan-100/80">
        20초 안에 최대한 많이 맞혀 보세요. 핵심은 계산이 아니라{" "}
        <b className="text-cyan-200">전략 분류 속도</b> 입니다.
      </p>

      <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-5 text-center font-mono text-xl font-extrabold text-slate-50">
        {prob.expr}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {METHODS.map((m) => {
          const isFlashGood = lastFlash?.id === m.id && lastFlash.ok;
          const isFlashBad = lastFlash?.id === m.id && !lastFlash.ok;
          const cls = isFlashGood
            ? "border-emerald-400/70 bg-emerald-400/[0.15] text-emerald-100"
            : isFlashBad
            ? "border-rose-400/70 bg-rose-400/[0.15] text-rose-100"
            : "border-white/15 bg-slate-900/60 text-slate-200 hover:border-cyan-400/45 hover:bg-slate-900/80";
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handlePick(m.id)}
              disabled={!running}
              className={`rounded-xl border-2 px-3 py-2 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
            >
              <span className="mr-1 text-amber-200">{m.short}</span>
              {m.name}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full border border-amber-400/45 bg-amber-400/15 px-3 py-1 font-mono font-bold text-amber-100">
          ⏱ {time}초
        </span>
        <span className="rounded-full border border-emerald-400/45 bg-emerald-400/15 px-3 py-1 font-mono font-bold text-emerald-100">
          점수 {score}
        </span>
        {!running ? (
          <button
            type="button"
            onClick={handleRetry}
            className="ml-auto rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-1.5 text-xs font-bold text-white shadow shadow-cyan-500/20 transition hover:brightness-110"
          >
            ↻ 다시 도전
          </button>
        ) : null}
      </div>

      {!running ? (
        <p className="mt-2 text-sm font-bold text-cyan-200">
          ⏰ 시간 종료! 이번 점수 {score}점.
        </p>
      ) : null}
    </div>
  );
}
