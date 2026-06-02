"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "big_num_decode",
    prompt:
      "큰 수의 소수·합성수 판정에서, 그 수를 ‘어떤 식의 값’으로 다시 보았는지 자신의 말로 정리해 보세요. 어떤 단서(완전거듭제곱과의 거리, 가운데 항의 부호, 기준 수 1000·100·10 등)가 적절한 인수분해 공식을 떠올리게 해 주었는지도 함께 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 1,000,027 은 100³ + 3³ 으로 다시 보면 세제곱의 합 공식이 바로 떠오른다. 한편 999,999 는 1,000,000 (= 1000²) 보다 1 작은 수라 1000² − 1² 의 제곱의 차로 보였다. 두 인수가 모두 1보다 크면 그 순간 합성수로 확정된다.",
  },
];

// ─── 사건 데이터 ───────────────────────────────────────────
type ChoiceOption = { value: React.ReactNode; correct: boolean };
type CaseItem = {
  tag: string;
  title: string;
  story: string;
  /** 표시용 큰 수 (콤마 포함) */
  number: string;
  rewritePrompt: string;
  rewriteOptions: ChoiceOption[];
  factorPrompt: string;
  factorOptions: ChoiceOption[];
  /** "소수" 또는 "합성수" */
  verdict: "소수" | "합성수";
  /** 결과 reveal — 인수 (badge용) */
  factors: string[];
  reveal: React.ReactNode;
  hint1: React.ReactNode;
  hint2: React.ReactNode;
  hint3: React.ReactNode;
};

const CASES: CaseItem[] = [
  {
    tag: "사건 1",
    title: "만화 속 첫 번째 금고",
    story:
      "1,000,000 과 27 이 보이면 세제곱의 합을 떠올릴 수 있어야 합니다. 숫자의 변장을 벗겨 보세요.",
    number: "1,000,027",
    rewritePrompt: "이 수를 가장 자연스럽게 다시 쓴 식을 고르세요.",
    rewriteOptions: [
      { value: <>100³ + 3³</>, correct: true },
      { value: <>10⁶ + 3²</>, correct: false },
      { value: <>103³</>, correct: false },
    ],
    factorPrompt: "선택한 식에 맞는 인수분해 결과를 고르세요.",
    factorOptions: [
      { value: <>(100 + 3)(100² − 100 · 3 + 3²)</>, correct: true },
      { value: <>(100 − 3)(100² + 100 · 3 + 3²)</>, correct: false },
      { value: <>(100 + 3)³</>, correct: false },
    ],
    verdict: "합성수",
    factors: ["103", "9709"],
    reveal: <>1,000,027 = 103 × 9,709 이므로 합성수입니다.</>,
    hint1: <>1,000,000 은 100 의 세제곱이고, 27 은 3 의 세제곱입니다.</>,
    hint2: <>a³ + b³ = (a + b)(a² − ab + b²) 꼴입니다.</>,
    hint3: <>103 과 9,709 는 둘 다 1보다 크므로 소수가 될 수 없습니다.</>,
  },
  {
    tag: "사건 2",
    title: "가까운 세제곱의 차를 찾아라",
    story:
      "8,000,000 바로 아래에 있는 숫자입니다. 8,000,000 이 어떤 거듭제곱인지 떠올려 보세요.",
    number: "7,999,973",
    rewritePrompt: "이 수를 가장 자연스럽게 다시 쓴 식을 고르세요.",
    rewriteOptions: [
      { value: <>200³ − 3³</>, correct: true },
      { value: <>20⁴ − 3³</>, correct: false },
      { value: <>199³ + 2³</>, correct: false },
    ],
    factorPrompt: "세제곱의 차 공식에 맞는 식을 고르세요.",
    factorOptions: [
      { value: <>(200 − 3)(200² + 200 · 3 + 3²)</>, correct: true },
      { value: <>(200 + 3)(200² − 200 · 3 + 3²)</>, correct: false },
      { value: <>(200 − 3)³</>, correct: false },
    ],
    verdict: "합성수",
    factors: ["197", "40,609"],
    reveal: <>7,999,973 = 197 × 40,609 이므로 합성수입니다.</>,
    hint1: <>8,000,000 은 200 의 세제곱, 27 은 3 의 세제곱입니다.</>,
    hint2: <>a³ − b³ = (a − b)(a² + ab + b²) 꼴입니다.</>,
    hint3: <>197 과 40,609 라는 두 인수로 나누어지므로 합성수입니다.</>,
  },
  {
    tag: "사건 3",
    title: "다항식 금고의 비밀",
    story:
      "이 숫자는 100 을 대입한 다항식 값으로 볼 수 있습니다. 인수분해 공식을 숫자 판정에 연결해 보세요.",
    number: "99,970,001",
    rewritePrompt: "어떤 다항식에 x = 100 을 넣은 값인지 고르세요.",
    rewriteOptions: [
      { value: <>100⁴ − 3 · 100² + 1</>, correct: true },
      { value: <>100⁴ − 3 · 100 + 1</>, correct: false },
      { value: <>100² − 3 · 100⁴ + 1</>, correct: false },
    ],
    factorPrompt: "x⁴ − 3x² + 1 의 인수분해 결과에 맞는 것을 고르세요.",
    factorOptions: [
      { value: <>(100² + 100 − 1)(100² − 100 − 1)</>, correct: true },
      { value: <>(100² + 100 + 1)(100² − 100 + 1)</>, correct: false },
      { value: <>(100² − 1)²</>, correct: false },
    ],
    verdict: "합성수",
    factors: ["10,099", "9,899"],
    reveal: <>99,970,001 = 10,099 × 9,899 이므로 합성수입니다.</>,
    hint1: <>100⁴ − 3 · 100² + 1 모양을 확인해 보세요.</>,
    hint2: <>x⁴ − 3x² + 1 = (x² + x − 1)(x² − x − 1) 입니다.</>,
    hint3: <>10,099 와 9,899 가 둘 다 1보다 크므로 합성수입니다.</>,
  },
  {
    tag: "사건 4",
    title: "완전제곱 함정 문",
    story:
      "앞뒤가 비슷한 숫자가 반복되면 완전제곱식을 의심할 수 있습니다. 1000 을 기준으로 다시 보세요.",
    number: "1,002,001",
    rewritePrompt: "이 수를 가장 자연스럽게 다시 쓴 식을 고르세요.",
    rewriteOptions: [
      { value: <>1000² + 2 · 1000 + 1</>, correct: true },
      { value: <>1000² − 2 · 1000 + 1</>, correct: false },
      { value: <>100³ + 2³ + 1</>, correct: false },
    ],
    factorPrompt: "완전제곱식 인수분해 결과를 고르세요.",
    factorOptions: [
      { value: <>(1000 + 1)²</>, correct: true },
      { value: <>(1000 − 1)²</>, correct: false },
      { value: <>(1000 + 1)(1000 − 1)</>, correct: false },
    ],
    verdict: "합성수",
    factors: ["1,001", "1,001"],
    reveal: <>1,002,001 = 1,001 × 1,001 이므로 합성수입니다.</>,
    hint1: <>a² + 2ab + b² 꼴에서 a = 1000, b = 1 입니다.</>,
    hint2: <>완전제곱식은 같은 인수가 두 번 곱해진 꼴로 바뀝니다.</>,
    hint3: <>1,001 이 두 번 곱해진 수이므로 합성수입니다.</>,
  },
  {
    tag: "사건 5",
    title: "앞뒤 한 칸 차이 금고",
    story:
      "1,000,000 보다 1 작은 수입니다. 기준 수 1000 을 중심으로 제곱의 차를 떠올려 보세요.",
    number: "999,999",
    rewritePrompt: "이 수를 가장 자연스럽게 다시 쓴 식을 고르세요.",
    rewriteOptions: [
      { value: <>1000² − 1²</>, correct: true },
      { value: <>1000² + 1²</>, correct: false },
      { value: <>100³ − 1</>, correct: false },
    ],
    factorPrompt: "제곱의 차 공식에 맞는 결과를 고르세요.",
    factorOptions: [
      { value: <>(1000 − 1)(1000 + 1)</>, correct: true },
      { value: <>(1000 − 1)²</>, correct: false },
      { value: <>(1000 + 1)²</>, correct: false },
    ],
    verdict: "합성수",
    factors: ["999", "1,001"],
    reveal: <>999,999 = 999 × 1,001 이므로 합성수입니다.</>,
    hint1: <>a² − b² = (a − b)(a + b) 로 분해됩니다.</>,
    hint2: <>1000² − 1² 는 가운데 항이 없는 제곱의 차입니다.</>,
    hint3: <>999 와 1,001 이 둘 다 1보다 크므로 합성수입니다.</>,
  },
  {
    tag: "보너스 사건",
    title: "초대형 마지막 금고",
    story:
      "10억보다 1 큰 수입니다. 1000 의 세제곱과 연결하면 계산 없이도 판정할 수 있습니다.",
    number: "1,000,000,001",
    rewritePrompt: "이 수를 가장 자연스럽게 다시 쓴 식을 고르세요.",
    rewriteOptions: [
      { value: <>1000³ + 1³</>, correct: true },
      { value: <>100⁴ + 1</>, correct: false },
      { value: <>1001³</>, correct: false },
    ],
    factorPrompt: "세제곱의 합 공식에 맞는 결과를 고르세요.",
    factorOptions: [
      { value: <>(1000 + 1)(1000² − 1000 + 1)</>, correct: true },
      { value: <>(1000 − 1)(1000² + 1000 + 1)</>, correct: false },
      { value: <>(1000 + 1)³</>, correct: false },
    ],
    verdict: "합성수",
    factors: ["1,001", "999,001"],
    reveal: <>1,000,000,001 = 1,001 × 999,001 이므로 합성수입니다.</>,
    hint1: <>1,000,000,000 은 1000 의 세제곱입니다.</>,
    hint2: <>a³ + b³ 공식에 a = 1000, b = 1 을 넣어 보세요.</>,
    hint3: <>1,001 과 999,001 이라는 두 인수가 생기므로 합성수입니다.</>,
  },
];

// ─── 메인 ───────────────────────────────────────────────────
export default function PrimeCompositeLock() {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hints, setHints] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  function bumpHint() {
    setHints((h) => h + 1);
  }
  function handleSolved() {
    setSolved((v) => Math.max(v, idx + 1));
    setStreak((s) => {
      const next = s + 1;
      setBestStreak((b) => Math.max(b, next));
      return next;
    });
  }
  function handleFail() {
    setStreak(0);
  }
  function handleNext() {
    if (idx < CASES.length - 1) setIdx((i) => i + 1);
    else setShowSummary(true);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* 헤더 */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-amber-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">🔐 소수·합성수 잠금 해제</h3>
        <p className="mt-2 leading-7 text-slate-300">
          큰 수를 그대로 보지 말고 <b className="text-amber-200">익숙한 식의 값</b>으로 다시
          쓰면, 숨어 있던 인수분해 공식이 드러납니다. 각 사건에서 숫자의 변장을 벗기고, 맞는
          공식을 골라 금고가 <b className="text-rose-200">소수</b>인지{" "}
          <b className="text-emerald-200">합성수</b>인지 판정하세요.
        </p>
        <FormulaDeck />
      </div>

      {/* 진행 + HUD */}
      <div className="mt-5 flex items-center gap-3">
        <ProgressBar done={solved} total={CASES.length} />
        <span className="rounded-full border border-amber-400/45 bg-amber-400/15 px-4 py-1 font-mono text-sm font-bold text-amber-100">
          해제 {solved} / {CASES.length}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <HudCard label="현재 사건" value={`${idx + 1} / ${CASES.length}`} sub="순서대로 해제" />
        <HudCard label="연속 성공" value={String(streak)} sub={`최고 기록 ${bestStreak}`} />
        <HudCard label="해제 성공" value={String(solved)} sub="총 6 개" />
        <HudCard label="힌트 사용" value={String(hints)} sub="적게 쓸수록 좋음" />
      </div>

      {/* 본문 */}
      <div className="mt-4">
        {showSummary ? (
          <Summary
            onReset={() => {
              setIdx(0);
              setSolved(0);
              setStreak(0);
              setBestStreak(0);
              setHints(0);
              setShowSummary(false);
            }}
          />
        ) : (
          <CaseRunner
            key={idx}
            idx={idx}
            isLast={idx === CASES.length - 1}
            item={CASES[idx]}
            onSolved={handleSolved}
            onFail={handleFail}
            onNext={handleNext}
            onHint={bumpHint}
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
        <linearGradient id="pclProgGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="0" y="0" width={ratio * 100} height="4" rx="2" fill="url(#pclProgGrad)" />
    </svg>
  );
}

function HudCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-amber-400/25 bg-slate-900/60 p-3">
      <p className="text-[10px] font-bold text-amber-200/70">{label}</p>
      <p className="mt-0.5 font-mono text-base font-extrabold text-amber-50">{value}</p>
      <p className="mt-0.5 text-[10px] text-amber-200/55">{sub}</p>
    </div>
  );
}

function FormulaDeck() {
  const items: { label: string; lhs: React.ReactNode; rhs: React.ReactNode; note: string }[] = [
    {
      label: "세제곱의 합",
      lhs: <>a³ + b³</>,
      rhs: <>(a + b)(a² − ab + b²)</>,
      note: "큰 수를 두 세제곱의 합으로 볼 수 있으면 바로 두 인수로 나뉜다.",
    },
    {
      label: "세제곱의 차",
      lhs: <>a³ − b³</>,
      rhs: <>(a − b)(a² + ab + b²)</>,
      note: "가까운 세제곱끼리의 차일 수 있다.",
    },
    {
      label: "제곱의 차",
      lhs: <>a² − b²</>,
      rhs: <>(a − b)(a + b)</>,
      note: "기준 수의 앞뒤 한 칸 차이면 빠르게 분해된다.",
    },
    {
      label: "특별한 다항식",
      lhs: <>x⁴ − 3x² + 1</>,
      rhs: <>(x² + x − 1)(x² − x − 1)</>,
      note: "다항식 인수분해를 큰 수 판별에 연결할 수 있다.",
    },
  ];
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-slate-900/60 to-slate-900/80 p-3"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-amber-200">{it.label}</p>
          {/* 좌변과 "= 우변" 을 각각 inline-block 으로 → 한 줄에 들어가지 않으면 등호 이후가 통째로 다음 줄로 떨어진다. */}
          <p className="mt-2 font-mono text-sm font-bold text-slate-50">
            <span className="inline-block">{it.lhs}</span>{" "}
            <span className="inline-block">= {it.rhs}</span>
          </p>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">{it.note}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Case Runner ──────────────────────────────────────────
function CaseRunner({
  isLast,
  item,
  onSolved,
  onFail,
  onNext,
  onHint,
}: {
  idx: number;
  isLast: boolean;
  item: CaseItem;
  onSolved: () => void;
  onFail: () => void;
  onNext: () => void;
  onHint: () => void;
}) {
  const [rewriteSel, setRewriteSel] = useState<number | null>(null);
  const [factorSel, setFactorSel] = useState<number | null>(null);
  const [verdictSel, setVerdictSel] = useState<"소수" | "합성수" | null>(null);
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);
  const [fb, setFb] = useState<Record<1 | 2 | 3, { ok: boolean; text: string } | null>>({
    1: null,
    2: null,
    3: null,
  });
  const [hintShown, setHintShown] = useState({ 1: false, 2: false, 3: false });
  const [showWrong, setShowWrong] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({
    1: false,
    2: false,
    3: false,
  });

  function handleHint(step: 1 | 2 | 3) {
    if (!hintShown[step]) {
      setHintShown((h) => ({ ...h, [step]: true }));
      onHint();
    }
  }

  function checkRewrite() {
    if (rewriteSel === null) {
      setFb((f) => ({ ...f, 1: { ok: false, text: "먼저 식 하나를 선택하세요." } }));
      return;
    }
    const correctIdx = item.rewriteOptions.findIndex((o) => o.correct);
    if (rewriteSel === correctIdx) {
      setStep1Done(true);
      setFb((f) => ({ ...f, 1: { ok: true, text: "좋습니다! 이제 맞는 인수분해 공식을 골라 보세요." } }));
    } else {
      onFail();
      setShowWrong((s) => ({ ...s, 1: true }));
      setFb((f) => ({
        ...f,
        1: { ok: false, text: "아직 구조를 잘못 본 거예요. 완전거듭제곱과 기준 수를 다시 보세요." },
      }));
    }
  }

  function checkFactor() {
    if (!step1Done) return;
    if (factorSel === null) {
      setFb((f) => ({ ...f, 2: { ok: false, text: "먼저 인수분해 식을 선택하세요." } }));
      return;
    }
    const correctIdx = item.factorOptions.findIndex((o) => o.correct);
    if (factorSel === correctIdx) {
      setStep2Done(true);
      setFb((f) => ({ ...f, 2: { ok: true, text: "맞습니다. 이제 최종 판정을 내리세요." } }));
    } else {
      onFail();
      setShowWrong((s) => ({ ...s, 2: true }));
      setFb((f) => ({
        ...f,
        2: { ok: false, text: "공식의 부호가 맞지 않아요. 가운데 항의 부호를 다시 보세요." },
      }));
    }
  }

  function checkVerdict() {
    if (!step2Done) return;
    if (verdictSel === null) {
      setFb((f) => ({ ...f, 3: { ok: false, text: "먼저 소수 또는 합성수를 고르세요." } }));
      return;
    }
    if (verdictSel === item.verdict) {
      setStep3Done(true);
      setFb((f) => ({ ...f, 3: { ok: true, text: "판정 완료. 금고가 열렸습니다!" } }));
      onSolved();
    } else {
      onFail();
      setShowWrong((s) => ({ ...s, 3: true }));
      setFb((f) => ({ ...f, 3: { ok: false, text: "인수분해가 되었으니 다시 생각해 보세요." } }));
    }
  }

  return (
    <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.04] to-sky-500/[0.04] p-4">
      {/* 사건 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-sky-400/45 bg-sky-400/15 px-3 py-0.5 text-xs font-bold text-sky-100">
            {item.tag}
          </span>
          <p className="mt-2 text-lg font-extrabold text-slate-50">{item.title}</p>
          <p className="mt-1 text-sm leading-7 text-slate-300">{item.story}</p>
        </div>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.05] p-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">금고에 적힌 수</p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-amber-100 sm:text-3xl">
            {item.number}
          </p>
        </div>
      </div>

      {/* 3 단계 */}
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <StageCard
          num={1}
          name="식으로 다시 보기"
          desc={item.rewritePrompt}
          status={step1Done ? "done" : "live"}
        >
          <Tip>큰 수를 그대로 계산하지 말고, 1000·100·10 같은 기준 수와 완전거듭제곱을 먼저 떠올려 보세요.</Tip>
          <ChoiceCol
            options={item.rewriteOptions}
            selected={rewriteSel}
            disabled={step1Done}
            wrongShown={showWrong[1]}
            kind="Rewrite"
            onPick={(i) => setRewriteSel(i)}
          />
          {hintShown[1] ? <HintBlock>{item.hint1}</HintBlock> : null}
          {fb[1] ? <Feedback ok={fb[1].ok}>{fb[1].text}</Feedback> : null}
          <ActionRow
            onCheck={checkRewrite}
            checkDisabled={step1Done}
            checkLabel="단서 확인"
            onHint={() => handleHint(1)}
            onReset={() => {
              setRewriteSel(null);
              setShowWrong((s) => ({ ...s, 1: false }));
            }}
          />
        </StageCard>

        <StageCard
          num={2}
          name="맞는 인수분해 고르기"
          desc={item.factorPrompt}
          status={step2Done ? "done" : step1Done ? "live" : "lock"}
        >
          <Tip>공식의 부호와 가운데 항의 부호를 끝까지 정확히 비교해야 합니다.</Tip>
          <ChoiceCol
            options={item.factorOptions}
            selected={factorSel}
            disabled={!step1Done || step2Done}
            wrongShown={showWrong[2]}
            kind="Factor"
            onPick={(i) => setFactorSel(i)}
          />
          {hintShown[2] ? <HintBlock>{item.hint2}</HintBlock> : null}
          {fb[2] ? <Feedback ok={fb[2].ok}>{fb[2].text}</Feedback> : null}
          <ActionRow
            onCheck={checkFactor}
            checkDisabled={!step1Done || step2Done}
            checkLabel="공식 매칭"
            onHint={() => handleHint(2)}
            onReset={() => {
              setFactorSel(null);
              setShowWrong((s) => ({ ...s, 2: false }));
            }}
          />
        </StageCard>

        <StageCard
          num={3}
          name="소수인가, 합성수인가"
          desc="인수분해 결과를 근거로 최종 판정을 내려 보세요."
          status={step3Done ? "done" : step2Done ? "live" : "lock"}
        >
          <Tip>두 인수가 모두 1보다 크면 합성수입니다. 소수는 1과 자기 자신만 인수로 가집니다.</Tip>
          <VerdictRow
            value={verdictSel}
            disabled={!step2Done || step3Done}
            correct={item.verdict}
            wrongShown={showWrong[3]}
            onPick={(v) => setVerdictSel(v)}
          />
          {hintShown[3] ? <HintBlock>{item.hint3}</HintBlock> : null}
          {fb[3] ? <Feedback ok={fb[3].ok}>{fb[3].text}</Feedback> : null}
          <ActionRow
            onCheck={checkVerdict}
            checkDisabled={!step2Done || step3Done}
            checkLabel="판정 확정"
            onHint={() => handleHint(3)}
            onReset={() => {
              setVerdictSel(null);
              setShowWrong((s) => ({ ...s, 3: false }));
            }}
          />
        </StageCard>
      </div>

      {/* reveal */}
      {step3Done ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 to-sky-500/10 p-4">
          <p className="text-sm font-bold text-emerald-200">✅ 잠금 해제 완료</p>
          <p className="mt-2 text-sm leading-7 text-emerald-50">{item.reveal}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.factors.map((f, i) => (
              <span
                key={`${f}-${i}`}
                className="rounded-full border border-emerald-300/40 bg-emerald-300/15 px-3 py-1 text-xs font-bold text-emerald-50"
              >
                인수 {f}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* 다음 사건 */}
      {step3Done ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
          >
            {isLast ? "🏁 모든 사건 완료" : "➡️ 다음 사건"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ─── 작은 UI 헬퍼 ──────────────────────────────────────────
function StageCard({
  num,
  name,
  desc,
  status,
  children,
}: {
  num: number;
  name: string;
  desc: string;
  status: "lock" | "live" | "done";
  children: React.ReactNode;
}) {
  const statusCls =
    status === "lock"
      ? "border-white/10 bg-slate-900/50 opacity-75"
      : status === "live"
      ? "border-sky-400/40 bg-slate-900/70"
      : "border-emerald-400/50 bg-emerald-400/[0.05]";
  const pillCls =
    status === "lock"
      ? "border-white/15 bg-white/5 text-slate-400"
      : status === "live"
      ? "border-sky-400/45 bg-sky-400/15 text-sky-100"
      : "border-emerald-400/45 bg-emerald-400/15 text-emerald-100";

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border-2 p-4 ${statusCls}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-sky-400/40 bg-sky-400/15 text-sm font-extrabold text-sky-100">
              {num}
            </span>
            <p className="text-sm font-bold text-slate-50">{name}</p>
          </div>
          <p className="mt-1 text-xs text-slate-300">{desc}</p>
        </div>
        <span className={`rounded-full border px-3 py-0.5 text-[10px] font-bold ${pillCls}`}>
          {status === "lock" ? "잠김" : status === "live" ? "진행 중" : "완료"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-3 py-1.5 text-[11px] leading-5 text-amber-100">
      {children}
    </p>
  );
}

function HintBlock({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-sky-400/35 bg-sky-400/[0.06] px-3 py-1.5 text-[11px] leading-5 text-sky-100">
      💡 {children}
    </p>
  );
}

function ChoiceCol({
  options,
  selected,
  disabled,
  wrongShown,
  kind,
  onPick,
}: {
  options: ChoiceOption[];
  selected: number | null;
  disabled: boolean;
  wrongShown: boolean;
  kind: string;
  onPick: (i: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt, i) => {
        const isSel = selected === i;
        const showCorrect = wrongShown && opt.correct;
        const showWrong = wrongShown && isSel && !opt.correct;
        const cls = showCorrect
          ? "border-emerald-400/70 bg-emerald-400/[0.08]"
          : showWrong
          ? "border-rose-400/70 bg-rose-400/[0.08]"
          : isSel
          ? "border-amber-300 bg-gradient-to-br from-amber-400/[0.18] to-amber-500/[0.10] shadow-md shadow-amber-500/20"
          : "border-white/15 bg-slate-900/70 hover:-translate-y-0.5 hover:border-sky-400/45 hover:bg-slate-900/80";
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(i)}
            disabled={disabled}
            className={`w-full rounded-xl border-2 p-3 text-left transition disabled:cursor-not-allowed ${cls} ${disabled && !showCorrect && !showWrong ? "opacity-65" : ""}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kind}</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-50">{opt.value}</p>
          </button>
        );
      })}
    </div>
  );
}

function VerdictRow({
  value,
  disabled,
  correct,
  wrongShown,
  onPick,
}: {
  value: "소수" | "합성수" | null;
  disabled: boolean;
  correct: "소수" | "합성수";
  wrongShown: boolean;
  onPick: (v: "소수" | "합성수") => void;
}) {
  const opts: ("소수" | "합성수")[] = ["소수", "합성수"];
  return (
    <div className="grid grid-cols-2 gap-2">
      {opts.map((opt) => {
        const isSel = value === opt;
        const showCorrect = wrongShown && opt === correct;
        const showWrong = wrongShown && isSel && opt !== correct;
        const cls = showCorrect
          ? "border-emerald-400/70 bg-emerald-400/[0.10]"
          : showWrong
          ? "border-rose-400/70 bg-rose-400/[0.10]"
          : isSel
          ? "border-amber-300 bg-gradient-to-br from-amber-400/[0.20] to-amber-500/[0.10] shadow-md shadow-amber-500/20"
          : "border-white/15 bg-slate-900/70 hover:border-sky-400/45 hover:bg-slate-900/80";
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onPick(opt)}
            disabled={disabled}
            className={`rounded-xl border-2 px-3 py-3 text-sm font-extrabold text-slate-50 transition disabled:cursor-not-allowed ${cls} ${disabled && !showCorrect && !showWrong ? "opacity-65" : ""}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Feedback({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p
      className={
        "rounded-lg px-3 py-1.5 text-[12px] font-bold " +
        (ok
          ? "border border-emerald-400/45 bg-emerald-400/15 text-emerald-100"
          : "border border-rose-400/45 bg-rose-400/15 text-rose-100")
      }
    >
      {children}
    </p>
  );
}

function ActionRow({
  onCheck,
  checkDisabled,
  checkLabel,
  onHint,
  onReset,
}: {
  onCheck: () => void;
  checkDisabled: boolean;
  checkLabel: string;
  onHint: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
      <button
        type="button"
        onClick={onCheck}
        disabled={checkDisabled}
        className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow shadow-amber-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {checkLabel}
      </button>
      <button
        type="button"
        onClick={onHint}
        className="rounded-full border border-sky-400/45 bg-sky-400/10 px-3 py-1.5 text-xs font-bold text-sky-100 transition hover:bg-sky-400/20"
      >
        💡 힌트
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10"
      >
        ↺ 초기화
      </button>
    </div>
  );
}

function Summary({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-amber-400/45 bg-gradient-to-br from-amber-500/15 to-sky-500/15 p-5">
      <p className="text-center text-3xl">🏁</p>
      <p className="mt-2 text-center text-xl font-extrabold text-amber-100">
        모든 금고를 해제했습니다!
      </p>
      <p className="mt-3 text-center text-sm leading-7 text-slate-200">
        이제 큰 수를 봐도 먼저 <b className="text-amber-200">어떤 식의 값인지</b> 떠올리며 접근할
        수 있습니다. 인수분해 공식은 다항식 문제만이 아니라 숫자의 성질을 판별하는 도구로도
        연결됩니다. 아래 성찰 폼에 직접 만든 큰 수 문제와 판정 과정을 남겨 보세요.
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
