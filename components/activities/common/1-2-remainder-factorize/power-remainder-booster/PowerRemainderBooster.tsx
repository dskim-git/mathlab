"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "booster_idea",
    prompt:
      "큰 수의 거듭제곱(예: 49³¹)을 작은 수(예: 50)로 나눈 나머지를 ‘다항식의 나머지정리’로 풀어내는 핵심 아이디어와, 3단계의 다항식 나머지 R 과 4단계의 최종 나머지가 같지 않을 수 있는 까닭을 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 밑을 x 로 두고 나누는 수를 (x±1) 로 보면 큰 수의 나눗셈이 다항식 나눗셈으로 바뀐다. (x±1) 을 0 으로 만드는 값을 대입하면 R 이 바로 보인다. 다만 다항식의 R 은 음수도 가능하므로, ‘최종 나머지는 0 이상 나누는 수 미만’ 으로 보정해야 한다. 예: 49³¹ → R = (−1)³¹ = −1 → 50 − 1 = 49.",
  },
];

// ─── 데이터 ───────────────────────────────────────────────
type FormChoice = "x-1" | "x+1" | "x-2" | "x+2";
type Mission = {
  title: string;
  expression: React.ReactNode;
  relation: string;
  hint: string;
  formula: React.ReactNode;
  form: FormChoice;
  sub: number;
  polyRem: number;
  /** 0 이상 나누는 수 미만으로 정리한 실제 나머지 */
  final: number;
  finalOptions: number[];
  reveal: React.ReactNode;
};

const MISSIONS: Mission[] = [
  {
    title: "워밍업",
    expression: <>103<sup>100</sup> 을 102 로 나눈 나머지</>,
    relation: "102 = 103 − 1",
    hint: "102는 103보다 1 작습니다.",
    formula: <>x<sup>100</sup> = (x − 1) Q(x) + R</>,
    form: "x-1",
    sub: 1,
    polyRem: 1,
    final: 1,
    finalOptions: [0, 1, 2, 101],
    reveal: (
      <>
        x = 1 을 대입하면 R = 1<sup>100</sup> = 1, 다시 x = 103 을 대입하면 103
        <sup>100</sup> = 102 · Q(103) + 1 입니다.
      </>
    ),
  },
  {
    title: "미러 점프",
    expression: <>98<sup>100</sup> 을 99 로 나눈 나머지</>,
    relation: "99 = 98 + 1",
    hint: "99는 98보다 1 큽니다.",
    formula: <>x<sup>100</sup> = (x + 1) Q(x) + R</>,
    form: "x+1",
    sub: -1,
    polyRem: 1,
    final: 1,
    finalOptions: [1, -1, 98, 99],
    reveal: (
      <>
        x = −1 을 대입하면 R = (−1)<sup>100</sup> = 1, x = 98 을 넣으면 98<sup>100</sup> = 99
        · Q(98) + 1 입니다.
      </>
    ),
  },
  {
    title: "홀수 지수 트랩",
    expression: <>49<sup>31</sup> 을 50 으로 나눈 나머지</>,
    relation: "50 = 49 + 1",
    hint: "50은 49보다 1 큽니다. 그런데 지수가 홀수라면?",
    formula: <>x<sup>31</sup> = (x + 1) Q(x) + R</>,
    form: "x+1",
    sub: -1,
    polyRem: -1,
    final: 49,
    finalOptions: [-1, 1, 49, 50],
    reveal: (
      <>
        x = −1 을 대입하면 R = (−1)<sup>31</sup> = −1. 따라서 49<sup>31</sup> = 50 · Q(49) − 1
        이고, 나머지는 음수가 될 수 없으므로 50 − 1 = <b>49</b> 로 고쳐 씁니다.
      </>
    ),
  },
  {
    title: "직진 부스터",
    expression: <>202<sup>35</sup> 을 201 로 나눈 나머지</>,
    relation: "201 = 202 − 1",
    hint: "201은 202보다 1 작습니다.",
    formula: <>x<sup>35</sup> = (x − 1) Q(x) + R</>,
    form: "x-1",
    sub: 1,
    polyRem: 1,
    final: 1,
    finalOptions: [0, 1, 35, 200],
    reveal: (
      <>
        x = 1 을 넣으면 R = 1<sup>35</sup> = 1, 다시 x = 202 를 넣으면 202<sup>35</sup> = 201
        · Q(202) + 1 입니다.
      </>
    ),
  },
  {
    title: "음수 나머지 변환",
    expression: <>76<sup>45</sup> 을 77 로 나눈 나머지</>,
    relation: "77 = 76 + 1",
    hint: "77은 76보다 1 큽니다. 지수의 홀짝도 함께 살펴보세요.",
    formula: <>x<sup>45</sup> = (x + 1) Q(x) + R</>,
    form: "x+1",
    sub: -1,
    polyRem: -1,
    final: 76,
    finalOptions: [-1, 1, 76, 77],
    reveal: (
      <>
        x = −1 을 넣으면 R = (−1)<sup>45</sup> = −1. 따라서 76<sup>45</sup> = 77 · Q(76) − 1
        이고, 0 이상으로 보정하면 77 − 1 = <b>76</b>.
      </>
    ),
  },
  {
    title: "보너스 미션",
    expression: <>1001<sup>23</sup> 을 1000 으로 나눈 나머지</>,
    relation: "1000 = 1001 − 1",
    hint: "1000은 1001보다 1 작습니다.",
    formula: <>x<sup>23</sup> = (x − 1) Q(x) + R</>,
    form: "x-1",
    sub: 1,
    polyRem: 1,
    final: 1,
    finalOptions: [0, 1, 23, 999],
    reveal: <>나누는 수가 밑보다 1 작을 때 x = 1 을 대입하면 R = 1, 항상 나머지가 1.</>,
  },
];

const FORM_OPTIONS: FormChoice[] = ["x-1", "x+1", "x-2", "x+2"];
const SUB_OPTIONS = [1, -1, 0, 2];
const POLY_REM_OPTIONS = [1, -1, 0, 2];

// ─── 메인 ───────────────────────────────────────────────────
type Selected = {
  form: FormChoice | null;
  sub: number | null;
  polyRem: number | null;
  final: number | null;
};
const EMPTY_SEL: Selected = { form: null, sub: null, polyRem: null, final: null };

export default function PowerRemainderBooster() {
  const [idx, setIdx] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<Selected>(EMPTY_SEL);
  const [solved, setSolved] = useState(false);
  const [fb, setFb] = useState<{ tone: "ok" | "ng" | "hint"; text: React.ReactNode } | null>(null);

  const m = MISSIONS[idx];
  const isLast = idx === MISSIONS.length - 1;

  function pick(key: keyof Selected, value: FormChoice | number) {
    if (solved) return;
    setSelected((s) => ({ ...s, [key]: value }));
    setFb(null);
  }

  function showHint() {
    setFb({ tone: "hint", text: `힌트: ${m.hint} (${m.relation} 이 되도록 일차식을 맞춰 보세요.)` });
  }

  function resetSel() {
    setSelected(EMPTY_SEL);
    setSolved(false);
    setFb(null);
  }

  function checkMission() {
    if (
      selected.form === null ||
      selected.sub === null ||
      selected.polyRem === null ||
      selected.final === null
    ) {
      setFb({ tone: "ng", text: "네 단계의 선택을 모두 채운 뒤 부스터를 발동하세요." });
      return;
    }
    // 3단계까지 맞췄지만 최종 나머지를 R 그대로 입력한 경우 (예: R = −1 → 최종 49 가 정답인데 −1 선택)
    if (
      selected.form === m.form &&
      selected.sub === m.sub &&
      selected.polyRem === m.polyRem &&
      selected.final === m.polyRem &&
      m.final !== m.polyRem
    ) {
      setFb({
        tone: "ng",
        text: "3 단계까지는 맞았습니다. 그런데 다항식 나머지 R 과 최종 나머지는 다를 수 있어요. 최종 나머지는 0 이상 나누는 수 미만으로 다시 고쳐 써야 합니다.",
      });
      setStreak(0);
      return;
    }

    const ok =
      selected.form === m.form &&
      selected.sub === m.sub &&
      selected.polyRem === m.polyRem &&
      selected.final === m.final;

    if (!ok) {
      setFb({
        tone: "ng",
        text: "조금만 더 점검해 보세요. 일차식을 0 으로 만드는 값과 지수의 홀짝부터 확인하면 좋아요.",
      });
      setStreak(0);
      return;
    }

    setSolved(true);
    setStreak((s) => s + 1);
    setScore((s) => s + 10);
    setFb({ tone: "ok", text: "정답입니다! 나머지정리 부스터가 정확히 작동했어요." });
  }

  function nextMission() {
    if (!solved) return;
    if (idx < MISSIONS.length - 1) {
      setIdx((i) => i + 1);
      setSelected(EMPTY_SEL);
      setSolved(false);
      setFb(null);
    } else {
      setFb({ tone: "ok", text: "🎉 모든 부스터 미션을 완료했습니다!" });
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* 헤더 */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-amber-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">🚀 거듭제곱 나머지 부스터</h3>
        <p className="mt-2 leading-7 text-slate-300">
          큰 수를 직접 계산하지 말고 <b className="text-amber-200">나머지정리</b> 로 순간이동하듯
          나머지를 찾아 보세요. 밑이 ±1 만큼 떨어진 수로 나눈다면{" "}
          <b className="text-cyan-200">(x − 1)</b> 또는 <b className="text-cyan-200">(x + 1)</b> 을
          잡으면 지수가 커도 한 번에 정리됩니다.
        </p>
      </div>

      {/* HUD */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <HudCard label="현재 미션" value={`${idx + 1} / ${MISSIONS.length}`} sub="총 6 문제" />
        <HudCard label="연속 성공" value={String(streak)} sub="streak" />
        <HudCard label="부스터 점수" value={String(score)} sub="정답마다 +10" />
      </div>

      {/* 진행 막대 (해결 / 전체) */}
      <div className="mt-4 flex items-center gap-3">
        <ProgressBar done={solved ? idx + 1 : idx} total={MISSIONS.length} />
      </div>

      {/* 미션 + 기본 틀 */}
      <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
        {/* 이번 미션 */}
        <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
            🎮 이번 미션
          </p>
          <p className="mt-3 font-mono text-xl font-extrabold text-amber-50">{m.expression}</p>
          <p className="mt-2 text-sm leading-7 text-amber-100/80">{m.hint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="amber">{m.title}</Badge>
            <Badge tone="sky">{m.relation}</Badge>
          </div>
        </div>

        {/* 기본 틀 */}
        <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.05] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-300">기본 틀</p>
          <p className="mt-3 text-center font-mono text-lg font-extrabold text-sky-100">
            {m.formula}
          </p>
          <p className="mt-3 rounded-xl border border-sky-400/30 bg-sky-400/[0.04] px-3 py-2 text-xs leading-6 text-sky-100">
            나누는 수가 밑보다 1 <b>작으면 (x − 1)</b>, 1 <b>크면 (x + 1)</b> 을 먼저 의심하세요.
            그 일차식을 0 으로 만드는 값을 대입하면 다항식 나머지 R 이 한 번에 나옵니다.
          </p>
        </div>
      </div>

      {/* 4 단계 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StepCard num={1} name="일차식 고르기" desc="어떤 일차식으로 나머지정리를 연결할지 선택">
          <ChoiceRow
            options={FORM_OPTIONS}
            value={selected.form}
            onPick={(v) => pick("form", v)}
            renderLabel={(v) => v}
          />
        </StepCard>
        <StepCard num={2} name="대입값 정하기" desc="일차식을 0 으로 만드는 x 값">
          <ChoiceRow
            options={SUB_OPTIONS}
            value={selected.sub}
            onPick={(v) => pick("sub", v)}
            renderLabel={(v) => `x = ${v}`}
          />
        </StepCard>
        <StepCard num={3} name="다항식 나머지 R" desc="대입했을 때 xⁿ 의 값 (음수도 가능)">
          <Hint>R 은 음수일 수도 있습니다.</Hint>
          <ChoiceRow
            options={POLY_REM_OPTIONS}
            value={selected.polyRem}
            onPick={(v) => pick("polyRem", v)}
            renderLabel={(v) => String(v)}
          />
        </StepCard>
        <StepCard num={4} name="최종 나머지" desc="실제 큰 수를 나누었을 때의 나머지">
          <Hint>0 이상 나누는 수 미만으로 정리.</Hint>
          <ChoiceRow
            options={m.finalOptions}
            value={selected.final}
            onPick={(v) => pick("final", v)}
            renderLabel={(v) => String(v)}
          />
        </StepCard>
      </div>

      {/* 피드백 */}
      {fb ? (
        <p
          className={
            "mt-4 rounded-xl px-3 py-2 text-sm font-bold " +
            (fb.tone === "ok"
              ? "border border-emerald-400/45 bg-emerald-400/15 text-emerald-100"
              : fb.tone === "ng"
              ? "border border-rose-400/45 bg-rose-400/15 text-rose-100"
              : "border border-sky-400/45 bg-sky-400/15 text-sky-100")
          }
        >
          {fb.text}
        </p>
      ) : null}

      {/* 액션 */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={checkMission}
          disabled={solved}
          className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ⚡ 부스터 발동
        </button>
        <button
          type="button"
          onClick={showHint}
          className="rounded-full border border-sky-400/45 bg-sky-400/10 px-5 py-2 text-sm font-bold text-sky-100 transition hover:bg-sky-400/20"
        >
          💡 힌트
        </button>
        <button
          type="button"
          onClick={resetSel}
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↺ 선택 초기화
        </button>
        {solved ? (
          <button
            type="button"
            onClick={nextMission}
            disabled={isLast}
            className="ml-auto rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLast ? "🏁 모든 미션 완료" : "➡️ 다음 미션"}
          </button>
        ) : null}
      </div>

      {/* 정답 reveal */}
      {solved ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 to-amber-500/10 p-4">
          <p className="text-sm font-bold text-emerald-200">✅ 부스터 성공</p>
          <p className="mt-2 text-sm leading-7 text-emerald-50">{m.reveal}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <TrailCard label="선택한 일차식" value={m.form} />
            <TrailCard label="대입값" value={`x = ${m.sub}`} />
            <TrailCard label="다항식 나머지" value={`R = ${m.polyRem}`} />
            <TrailCard label="최종 나머지" value={String(m.final)} />
          </div>
        </div>
      ) : null}

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── UI 헬퍼 ──────────────────────────────────────────────
function HudCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-b from-slate-800/60 to-slate-900/70 p-4">
      <p className="text-xs font-semibold text-amber-200/70">{label}</p>
      <p className="mt-1 font-mono text-xl font-extrabold text-amber-50">{value}</p>
      <p className="mt-0.5 text-[10px] text-amber-200/50">{sub}</p>
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
        <linearGradient id="prbProgGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="0" y="0" width={ratio * 100} height="4" rx="2" fill="url(#prbProgGrad)" />
    </svg>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "amber" | "sky";
  children: React.ReactNode;
}) {
  const cls =
    tone === "amber"
      ? "border-amber-400/45 bg-amber-400/15 text-amber-100"
      : "border-sky-400/45 bg-sky-400/15 text-sky-100";
  return (
    <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${cls}`}>{children}</span>
  );
}

function StepCard({
  num,
  name,
  desc,
  children,
}: {
  num: number;
  name: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-amber-400/25 bg-slate-900/60 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/15 text-sm font-extrabold text-amber-200">
          {num}
        </span>
        <p className="text-sm font-bold text-amber-50">{name}</p>
      </div>
      <p className="text-xs text-amber-100/70">{desc}</p>
      <div className="mt-1 space-y-2">{children}</div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-3 py-1.5 text-[11px] leading-5 text-amber-100">
      {children}
    </p>
  );
}

function ChoiceRow<T extends string | number>({
  options,
  value,
  onPick,
  renderLabel,
}: {
  options: T[];
  value: T | null;
  onPick: (v: T) => void;
  renderLabel: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt, i) => {
        const isSelected = value === opt;
        return (
          <button
            key={`${i}-${opt}`}
            type="button"
            onClick={() => onPick(opt)}
            className={
              "rounded-xl border-2 px-3 py-1.5 font-mono text-sm font-bold transition " +
              (isSelected
                ? "border-amber-300 bg-gradient-to-br from-amber-400/30 to-orange-500/20 text-amber-50 shadow-md shadow-amber-500/20"
                : "border-white/15 bg-slate-900/40 text-slate-200 hover:border-amber-400/40 hover:bg-slate-900/60")
            }
          >
            {renderLabel(opt)}
          </button>
        );
      })}
    </div>
  );
}

function TrailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.04] p-3">
      <p className="text-[11px] text-emerald-200/70">{label}</p>
      <p className="mt-1 font-mono text-sm font-extrabold text-emerald-50">{value}</p>
    </div>
  );
}
