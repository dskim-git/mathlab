"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "candidate_idea",
    prompt:
      "계수가 정수인 다항식 f(x) 가 일차인수 (ax − b) 를 가지면 인수정리에 넣어 볼 후보가 x = ±b/a 꼴에서 나오는 이유를, 자신의 말로 설명해 보세요. 또 ‘후보가 있다’ 와 ‘실제 유리근이 있다’ 가 같은 말이 아니라는 점도 함께 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: (ax − b) 가 인수라면 f(b/a) = 0 이어야 한다. f 의 상수항을 두 인수의 상수항 곱으로 표현하면 b 가 상수항의 약수, a 는 최고차항 계수의 약수가 된다. 그래서 후보는 ‘상수항의 약수 / 최고차항의 약수’ 의 양·음 부호 조합으로만 나올 수 있다. 다만 후보가 모두 실제 근이 되는 것은 아니다 — 후보를 좁힌 뒤 직접 대입해 0 이 되는지 확인해야 한다.",
  },
];

// ─── 유틸 ───────────────────────────────────────────────────
function divisors(n: number): number[] {
  const v = Math.abs(n);
  const out: number[] = [];
  for (let i = 1; i <= v; i++) {
    if (v % i === 0) out.push(i);
  }
  return out;
}
function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}
function formatRational(numIn: number, denIn: number): string {
  let num = numIn;
  let den = denIn;
  if (den < 0) {
    num *= -1;
    den *= -1;
  }
  const g = gcd(num, den);
  num /= g;
  den /= g;
  if (den === 1) return num < 0 ? `−${Math.abs(num)}` : String(num);
  const sign = num < 0 ? "−" : "";
  return `${sign}${Math.abs(num)}/${den}`;
}
function rationalToNumber(text: string): number {
  // 음수 부호 처리: "−" (U+2212) 또는 "-"
  const norm = text.replace(/−/g, "-");
  if (norm.includes("/")) {
    const [p, q] = norm.split("/").map(Number);
    return p / q;
  }
  return Number(norm);
}
function sortedRationals(values: Iterable<string>): string[] {
  return [...values].sort((l, r) => {
    const d = rationalToNumber(l) - rationalToNumber(r);
    if (Math.abs(d) > 1e-9) return d;
    return l.length - r.length;
  });
}

// ─── 데이터 ───────────────────────────────────────────────
type Problem = {
  title: string;
  subtitle: string;
  poly: React.ReactNode;
  leading: number;
  constant: number;
  constOptions: number[];
  leadOptions: number[];
  candidateDecoys: string[];
  /** 실제 0 이 되는 유리근 (없으면 빈 배열) */
  actualRoots: string[];
  note: string;
};

const PROBLEMS: Problem[] = [
  {
    title: "훈련 임무 1",
    subtitle: "최고차항 계수가 1인 식부터 빠르게 익혀 봅시다.",
    poly: <>P(x) = x³ − 2x² − 5x + 6</>,
    leading: 1,
    constant: 6,
    constOptions: [1, 2, 3, 6, 4, 5, 9],
    leadOptions: [1, 2, 3],
    candidateDecoys: ["1/2", "−1/2", "4", "−4"],
    actualRoots: ["−2", "1", "3"],
    note: "최고차항 계수가 1이면 분모 후보는 1뿐이므로 정수 후보만 보면 됩니다.",
  },
  {
    title: "훈련 임무 2",
    subtitle: "분모 후보가 1과 2로 늘어나면 반정수 후보도 함께 챙겨야 합니다.",
    poly: <>Q(x) = 2x³ − 9x² + 7x + 6</>,
    leading: 2,
    constant: 6,
    constOptions: [1, 2, 3, 6, 4, 5, 9],
    leadOptions: [1, 2, 4],
    candidateDecoys: ["1/4", "−1/4", "4", "−4", "5/2"],
    actualRoots: ["−1/2", "2", "3"],
    note: "상수항 약수 1, 2, 3, 6과 최고차항 약수 1, 2를 조합해 후보를 만들어야 합니다.",
  },
  {
    title: "훈련 임무 3",
    subtitle: "최고차항 계수가 3이면 1/3, 2/3 같은 후보가 새로 생깁니다.",
    poly: <>R(x) = 3x³ + 14x² + 13x − 6</>,
    leading: 3,
    constant: -6,
    constOptions: [1, 2, 3, 6, 4, 5, 9],
    leadOptions: [1, 3, 2, 4],
    candidateDecoys: ["1/6", "−1/6", "4", "−4", "5/3"],
    actualRoots: ["−3", "−2", "1/3"],
    note: "상수항이 음수여도 약수는 절댓값으로 찾고, 마지막 후보 단계에서 ±를 함께 붙입니다.",
  },
  {
    title: "훈련 임무 4",
    subtitle: "최고차항 계수가 4이면 같은 값으로 약분되는 분수들을 조심해야 합니다.",
    poly: <>S(x) = 4x³ + 5x² − 7x − 2</>,
    leading: 4,
    constant: -2,
    constOptions: [1, 2, 4, 6, 8],
    leadOptions: [1, 2, 4, 3, 6],
    candidateDecoys: ["3/4", "−3/4", "3", "−3"],
    actualRoots: ["−2", "1", "−1/4"],
    note: "2/4는 1/2와 같은 값입니다. 기약분수로 정리해 후보를 한 번만 남기세요.",
  },
  {
    title: "훈련 임무 5",
    subtitle: "여러 후보 중 실제로는 일부만 0을 만들더라도 후보 목록은 넓게 잡아야 합니다.",
    poly: <>T(x) = 3x³ − 7x² − 18x − 8</>,
    leading: 3,
    constant: -8,
    constOptions: [1, 2, 4, 8, 3, 5, 6],
    leadOptions: [1, 3, 2, 4],
    candidateDecoys: ["1/8", "−1/8", "5/3", "−5/3", "3"],
    actualRoots: ["−2", "−2/3", "4"],
    note: "실제 근을 모를 때는 후보를 빼지 말고, 조건에 맞는 후보를 모두 남겨 두세요.",
  },
  {
    title: "보너스 임무",
    subtitle: "후보를 찾았다고 해서 꼭 유리근이 있는 것은 아닙니다.",
    poly: <>P(x) = 3x⁴ + 3x² + x + 8</>,
    leading: 3,
    constant: 8,
    constOptions: [1, 2, 4, 8, 3, 5, 6],
    leadOptions: [1, 3, 2, 4],
    candidateDecoys: ["3", "−3", "1/8", "−1/8", "5/3"],
    actualRoots: [],
    note: "후보 찾기는 출발점입니다. 그다음에 실제로 대입해 0이 되는지 확인해야 합니다.",
  },
];

function candidateSet(problem: Problem): string[] {
  const out = new Set<string>();
  const pDivs = divisors(problem.constant);
  const qDivs = divisors(problem.leading);
  for (const p of pDivs) {
    for (const q of qDivs) {
      out.add(formatRational(p, q));
      out.add(formatRational(-p, q));
    }
  }
  return sortedRationals(out);
}
function candidateOptions(problem: Problem): string[] {
  const merged = new Set<string>(candidateSet(problem));
  for (const d of problem.candidateDecoys) merged.add(d);
  return sortedRationals(merged);
}

// ─── 메인 ───────────────────────────────────────────────────
type GlobalStats = {
  hints: number;
  checks: number;
  perfectChecks: number;
};

export default function FactorCandidateRadar() {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState(0);
  const [stats, setStats] = useState<GlobalStats>({ hints: 0, checks: 0, perfectChecks: 0 });
  const [showSummary, setShowSummary] = useState(false);

  function bumpHint() {
    setStats((s) => ({ ...s, hints: s.hints + 1 }));
  }
  function bumpCheck(perfect: boolean) {
    setStats((s) => ({
      ...s,
      checks: s.checks + 1,
      perfectChecks: s.perfectChecks + (perfect ? 1 : 0),
    }));
  }

  function handleSolved() {
    setSolved((v) => Math.max(v, idx + 1));
  }

  function handleNext() {
    if (idx < PROBLEMS.length - 1) {
      setIdx((i) => i + 1);
    } else {
      setShowSummary(true);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* 헤더 */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">🎯 인수 후보 레이더</h3>
        <p className="mt-2 leading-7 text-slate-300">
          조립제법을 시작하기 전에 <b className="text-emerald-200">인수정리에 넣어 볼 x 후보</b>를
          먼저 좁혀 보세요. 상수항의 약수 → 최고차항 계수의 약수 → x = ±b/a 후보 3 단계로
          진행됩니다.
        </p>
      </div>

      {/* 상단: 레이더 원리 + HUD */}
      <div className="mt-5 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
        {/* 원리 */}
        <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-300">
            📡 레이더 원리
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            계수가 정수인 다항식 <b className="text-white">f(x)</b> 가 일차인수{" "}
            <b className="text-white">ax − b</b> 를 가지면, <br />
            <b className="text-white">b</b> 는 상수항의 약수이고 <b className="text-white">a</b> 는
            최고차항 계수의 약수입니다. <br />
            따라서 인수정리에 넣어 볼 후보는 <b className="text-emerald-200">x = ±b/a</b> 꼴에서
            나옵니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip>1단계: 상수항 약수 찾기</Chip>
            <Chip>2단계: 최고차항 약수 찾기</Chip>
            <Chip>3단계: x 후보 전부 선택</Chip>
          </div>
        </div>

        {/* HUD */}
        <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-300">
            🛰️ 진행 현황
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <HudCard label="현재 임무" value={`${idx + 1} / ${PROBLEMS.length}`} sub="순서대로 진행" />
            <HudCard label="완료한 임무" value={String(solved)} sub={`총 ${PROBLEMS.length}개`} />
            <HudCard label="힌트 사용" value={String(stats.hints)} sub="적게 쓸수록 좋음" />
            <HudCard
              label="레이더 정확도"
              value={`${stats.checks ? Math.round((stats.perfectChecks / stats.checks) * 100) : 0}%`}
              sub={stats.checks ? `정확한 스캔 ${stats.perfectChecks}회` : "아직 스캔 전"}
            />
          </div>
        </div>
      </div>

      {/* 진행 막대 */}
      <div className="mt-4 flex items-center gap-3">
        <ProgressBar done={solved} total={PROBLEMS.length} />
      </div>

      {/* 임무 본문 */}
      <div className="mt-4">
        {showSummary ? (
          <Summary onReset={() => {
            setIdx(0);
            setSolved(0);
            setStats({ hints: 0, checks: 0, perfectChecks: 0 });
            setShowSummary(false);
          }} />
        ) : (
          <ProblemRunner
            key={idx}
            idx={idx}
            problem={PROBLEMS[idx]}
            isLast={idx === PROBLEMS.length - 1}
            onSolved={handleSolved}
            onNext={handleNext}
            onCheck={bumpCheck}
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
        <linearGradient id="fcrProgGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="0" y="0" width={ratio * 100} height="4" rx="2" fill="url(#fcrProgGrad)" />
    </svg>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-0.5 text-xs font-bold text-emerald-200">
      {children}
    </span>
  );
}

function HudCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-sky-400/20 bg-slate-900/50 p-3">
      <p className="text-[10px] font-bold text-sky-300/80">{label}</p>
      <p className="mt-0.5 font-mono text-base font-extrabold text-sky-50">{value}</p>
      <p className="mt-0.5 text-[10px] text-sky-200/60">{sub}</p>
    </div>
  );
}

// ─── ProblemRunner ─────────────────────────────────────────
type StepKey = "const" | "lead" | "candidate";

function ProblemRunner({
  idx,
  problem,
  isLast,
  onSolved,
  onNext,
  onCheck,
  onHint,
}: {
  idx: number;
  problem: Problem;
  isLast: boolean;
  onSolved: () => void;
  onNext: () => void;
  onCheck: (perfect: boolean) => void;
  onHint: () => void;
}) {
  const expectedConst = useMemo(() => divisors(problem.constant), [problem]);
  const expectedLead = useMemo(() => divisors(problem.leading), [problem]);
  const expectedCandidates = useMemo(() => candidateSet(problem), [problem]);
  const candOpts = useMemo(() => candidateOptions(problem), [problem]);

  const [selConst, setSelConst] = useState<Set<string>>(new Set());
  const [selLead, setSelLead] = useState<Set<string>>(new Set());
  const [selCand, setSelCand] = useState<Set<string>>(new Set());
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);
  const [hintShown, setHintShown] = useState({ 1: false, 2: false, 3: false });
  const [fb, setFb] = useState<Record<1 | 2 | 3, { ok: boolean; text: string } | null>>({
    1: null,
    2: null,
    3: null,
  });
  const [flashKey, setFlashKey] = useState<{ a: number; b: number; c: number }>({
    a: 0,
    b: 0,
    c: 0,
  });

  function toggle(set: Set<string>, value: string): Set<string> {
    const n = new Set(set);
    if (n.has(value)) n.delete(value);
    else n.add(value);
    return n;
  }

  function eq(selected: Set<string>, expected: (string | number)[]): boolean {
    const eS = new Set(expected.map(String));
    if (selected.size !== eS.size) return false;
    for (const v of selected) if (!eS.has(v)) return false;
    return true;
  }

  function handleCheckConst() {
    const ok = eq(selConst, expectedConst);
    onCheck(ok);
    if (ok) {
      setStep1Done(true);
      setFlashKey((k) => ({ ...k, a: k.a + 1 }));
      setFb((f) => ({ ...f, 1: { ok: true, text: "정확합니다. 이제 최고차항의 약수를 찾아 분모 후보를 정리하세요." } }));
    } else {
      setFb((f) => ({ ...f, 1: { ok: false, text: "다시 보세요. 빠진 약수나 약수가 아닌 수가 섞여 있습니다." } }));
    }
  }

  function handleCheckLead() {
    if (!step1Done) return;
    const ok = eq(selLead, expectedLead);
    onCheck(ok);
    if (ok) {
      setStep2Done(true);
      setFlashKey((k) => ({ ...k, b: k.b + 1 }));
      setFb((f) => ({ ...f, 2: { ok: true, text: "좋습니다. 이제 x = ±b/a 꼴의 후보를 모두 포착하세요." } }));
    } else {
      setFb((f) => ({ ...f, 2: { ok: false, text: "분모 후보를 다시 정리해 보세요. 최고차항의 계수의 약수만 남아야 합니다." } }));
    }
  }

  function handleCheckCandidates() {
    if (!step2Done) return;
    const ok = eq(selCand, expectedCandidates);
    onCheck(ok);
    if (ok) {
      setStep3Done(true);
      setFlashKey((k) => ({ ...k, c: k.c + 1 }));
      setFb((f) => ({ ...f, 3: { ok: true, text: "후보 포착 완료! 이제 실제로 어떤 값을 먼저 대입할지 생각해 보세요." } }));
      onSolved();
    } else {
      setFb((f) => ({ ...f, 3: { ok: false, text: "후보가 부족하거나 함정 카드가 섞였습니다. ± 와 기약분수를 다시 점검하세요." } }));
    }
  }

  function handleHint(step: 1 | 2 | 3) {
    if (!hintShown[step]) {
      setHintShown((s) => ({ ...s, [step]: true }));
      onHint();
    }
  }

  function handleResetStep(step: StepKey) {
    if (step === "const") setSelConst(new Set());
    if (step === "lead") setSelLead(new Set());
    if (step === "candidate") setSelCand(new Set());
  }

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.05] to-sky-500/[0.04] p-4">
      {/* 미션 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full border border-amber-400/45 bg-amber-400/15 px-3 py-0.5 text-xs font-bold text-amber-100">
            {problem.title}
          </span>
          <p className="mt-2 text-lg font-extrabold text-slate-50">
            가능한 x 후보를 모두 포착하라
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-300">
            {problem.subtitle} {problem.note}
          </p>
        </div>
        <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.05] p-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-300">현재 다항식</p>
          <p className="mt-2 font-mono text-lg font-extrabold text-sky-50">{problem.poly}</p>
        </div>
      </div>

      {/* 3 단계 */}
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <StepCard
          num={1}
          name="상수항의 약수 찾기"
          desc={`|상수항| = ${Math.abs(problem.constant)} 의 약수를 선택하세요.`}
          status={step1Done ? "done" : "live"}
          flashKey={flashKey.a}
        >
          <p className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-3 py-1.5 text-[11px] leading-5 text-amber-100">
            상수항의 절댓값을 나누어떨어지게 만드는 양의 정수만 고르세요.
          </p>
          <ChoiceWrap
            options={problem.constOptions.map(String)}
            selected={selConst}
            onPick={(v) => setSelConst((s) => toggle(s, v))}
            disabled={step1Done}
            render={(v) => v}
          />
          {hintShown[1] ? (
            <p className="rounded-lg border border-emerald-400/35 bg-emerald-400/[0.06] px-3 py-1.5 text-[11px] leading-5 text-emerald-100">
              상수항의 절댓값 {Math.abs(problem.constant)} 을 나누어떨어지게 하는 양의 정수만 고르면
              됩니다.
            </p>
          ) : null}
          {fb[1] ? <Feedback ok={fb[1].ok}>{fb[1].text}</Feedback> : null}
          <ActionRow
            onCheck={handleCheckConst}
            checkDisabled={step1Done}
            onHint={() => handleHint(1)}
            onReset={() => handleResetStep("const")}
          />
        </StepCard>

        <StepCard
          num={2}
          name="최고차항 약수 찾기"
          desc={`최고차항의 계수 = ${Math.abs(problem.leading)} 의 약수를 선택하세요.`}
          status={step2Done ? "done" : step1Done ? "live" : "lock"}
          flashKey={flashKey.b}
        >
          <p className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-3 py-1.5 text-[11px] leading-5 text-amber-100">
            최고차항 계수의 약수를 찾아 분모 후보를 정리합니다.
          </p>
          <ChoiceWrap
            options={problem.leadOptions.map(String)}
            selected={selLead}
            onPick={(v) => setSelLead((s) => toggle(s, v))}
            disabled={!step1Done || step2Done}
            render={(v) => v}
          />
          {hintShown[2] ? (
            <p className="rounded-lg border border-emerald-400/35 bg-emerald-400/[0.06] px-3 py-1.5 text-[11px] leading-5 text-emerald-100">
              최고차항의 계수 {Math.abs(problem.leading)} 을 나누어떨어지게 하는 양의 정수만 남기세요.
            </p>
          ) : null}
          {fb[2] ? <Feedback ok={fb[2].ok}>{fb[2].text}</Feedback> : null}
          <ActionRow
            onCheck={handleCheckLead}
            checkDisabled={!step1Done || step2Done}
            onHint={() => handleHint(2)}
            onReset={() => handleResetStep("lead")}
          />
        </StepCard>

        <StepCard
          num={3}
          name="인수정리 후보 포착"
          desc="가능한 x 값을 모두 선택하세요. 부호 ± 도 꼭 챙기세요."
          status={step3Done ? "done" : step2Done ? "live" : "lock"}
          flashKey={flashKey.c}
        >
          <p className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-3 py-1.5 text-[11px] leading-5 text-amber-100">
            x = b/a 꼴에서 나오는 값을 기약분수로 정리해 한 번씩만 남기면 됩니다.
          </p>
          <ChoiceWrap
            options={candOpts}
            selected={selCand}
            onPick={(v) => setSelCand((s) => toggle(s, v))}
            disabled={!step2Done || step3Done}
            render={(v) => `x = ${v}`}
          />
          {hintShown[3] ? (
            <p className="rounded-lg border border-emerald-400/35 bg-emerald-400/[0.06] px-3 py-1.5 text-[11px] leading-5 text-emerald-100">
              1단계 값들을 분자 b, 2단계 값들을 분모 a 로 두고 x = ±b/a 를 만든 뒤 기약분수로
              정리하세요.
            </p>
          ) : null}
          {fb[3] ? <Feedback ok={fb[3].ok}>{fb[3].text}</Feedback> : null}
          <ActionRow
            onCheck={handleCheckCandidates}
            checkDisabled={!step2Done || step3Done}
            onHint={() => handleHint(3)}
            onReset={() => handleResetStep("candidate")}
          />
        </StepCard>
      </div>

      {/* reveal */}
      {step3Done ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 to-sky-500/10 p-4">
          <p className="text-sm font-bold text-emerald-200">✅ 스캔 완료</p>
          <p className="mt-2 text-sm leading-7 text-emerald-50">
            가능한 후보는 <b>{expectedCandidates.join(", ")}</b> 입니다.
          </p>
          {problem.actualRoots.length > 0 ? (
            <>
              <p className="mt-2 text-sm leading-7 text-emerald-50">
                이 식에서는 이 후보들 가운데 실제로 0 을 만드는 값도 있습니다. 아래 값부터
                인수정리로 점검해 볼 수 있습니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {problem.actualRoots.map((root) => (
                  <span
                    key={root}
                    className="rounded-full border border-emerald-300/40 bg-emerald-300/15 px-3 py-1 text-xs font-bold text-emerald-50"
                  >
                    P({root}) = 0
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm leading-7 text-emerald-50">
                하지만 이번 식은 후보는 있어도 실제 유리근은 없습니다. 후보 찾기와 실제 근
                존재는 다른 단계라는 점을 기억하세요.
              </p>
              <div className="mt-3">
                <span className="rounded-full border border-rose-400/40 bg-rose-400/15 px-3 py-1 text-xs font-bold text-rose-100">
                  유리근 없음
                </span>
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* 다음 임무 */}
      {step3Done ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
          >
            {isLast ? "🏁 모든 임무 완료" : "➡️ 다음 임무"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ─── StepCard ──────────────────────────────────────────────
function StepCard({
  num,
  name,
  desc,
  status,
  flashKey,
  children,
}: {
  num: number;
  name: string;
  desc: string;
  status: "lock" | "live" | "done";
  flashKey: number;
  children: React.ReactNode;
}) {
  const statusCls =
    status === "lock"
      ? "border-white/10 bg-slate-900/50 opacity-70"
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
    <div
      key={`flash-${flashKey}`}
      className={`flex flex-col gap-3 rounded-2xl border-2 p-4 transition ${statusCls} ${flashKey > 0 ? "animate-[pulseGlow_0.55s_ease]" : ""}`}
    >
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

function ChoiceWrap({
  options,
  selected,
  onPick,
  disabled,
  render,
}: {
  options: string[];
  selected: Set<string>;
  onPick: (v: string) => void;
  disabled: boolean;
  render: (v: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt, i) => {
        const isSel = selected.has(opt);
        return (
          <button
            key={`${i}-${opt}`}
            type="button"
            onClick={() => onPick(opt)}
            disabled={disabled}
            className={
              "rounded-xl border-2 px-3 py-1.5 font-mono text-sm font-bold transition disabled:cursor-not-allowed " +
              (disabled
                ? isSel
                  ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-100 opacity-80"
                  : "border-white/10 bg-slate-900/40 text-slate-400 opacity-50"
                : isSel
                ? "border-emerald-300 bg-gradient-to-br from-emerald-400/25 to-sky-400/20 text-emerald-50 shadow-md shadow-emerald-500/20"
                : "border-white/15 bg-slate-900/60 text-slate-200 hover:border-sky-400/45 hover:bg-slate-900/80")
            }
          >
            {render(opt)}
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
  onHint,
  onReset,
}: {
  onCheck: () => void;
  checkDisabled: boolean;
  onHint: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
      <button
        type="button"
        onClick={onCheck}
        disabled={checkDisabled}
        className="rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow shadow-sky-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        약수 스캔
      </button>
      <button
        type="button"
        onClick={onHint}
        className="rounded-full border border-amber-400/45 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-400/20"
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
    <div className="rounded-2xl border-2 border-emerald-400/45 bg-gradient-to-br from-emerald-500/15 to-sky-500/15 p-5">
      <p className="text-center text-3xl">🏁</p>
      <p className="mt-2 text-center text-xl font-extrabold text-emerald-100">
        모든 레이더 임무 완료!
      </p>
      <p className="mt-3 text-center text-sm leading-7 text-slate-200">
        이제 다항식을 보면 바로 <b className="text-emerald-200">상수항의 약수</b>,{" "}
        <b className="text-emerald-200">최고차항의 약수</b>,{" "}
        <b className="text-emerald-200">x = ±b/a 형태의 후보</b> 를 연결해서 생각할 수 있어야
        합니다. <br />
        아래 성찰 폼에는 직접 만든 문제와 후보 찾기 과정을 적어 보세요.
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
