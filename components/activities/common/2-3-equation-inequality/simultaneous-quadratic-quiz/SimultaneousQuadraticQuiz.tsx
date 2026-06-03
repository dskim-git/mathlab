"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (게임 1개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "judge_order",
    prompt:
      "연립이차방정식의 해의 개수를 판단할 때 어떤 순서로 생각했나요? (예: 일차식 포함? → 이차식이 인수분해 되는가? → 판별식 D 등) 자신만의 판단 순서를 적어 보세요.",
    kind: "text",
    placeholder:
      "예: ① 일차식이 있는지 본다 — 있으면 A타입 → 대입해서 이차방정식의 판별식 D 로 0·1·2쌍 판단. ② 이차식이 (일차)(일차) 로 인수분해되면 B₁타입 → 각 분기마다 A타입을 적용해 0~4쌍, 공통해가 있으면 한 쌍 줄어든다. ③ 이차식이 (일차)² 꼴이면 B₂타입 — 일차식 = 0 으로 줄여 A타입처럼.",
  },
];

// ─── 표기 헬퍼 ────────────────────────────────────────────
function X() {
  return <em className="font-serif italic">x</em>;
}
function Y() {
  return <em className="font-serif italic">y</em>;
}

// ─── 문제 풀 (POOL) ───────────────────────────────────────
type Quiz = { q1: ReactNode; q2: ReactNode; ans: 0 | 1 | 2 | 3 | 4; reason: ReactNode };

const POOL: Quiz[] = [
  // ── 0쌍 ──
  {
    q1: <><X /> + <Y /> = 3</>,
    q2: <><X /><sup>2</sup> + <Y /><sup>2</sup> = 2</>,
    ans: 0,
    reason: (
      <>
        <X /> = 3 − <Y /> 대입 → 2<Y />² − 6<Y /> + 7 = 0
        <br />
        판별식 D = 36 − 56 = −20 &lt; 0 →{" "}
        <b className="text-rose-300">실근 없음 → 0쌍</b>
      </>
    ),
  },
  {
    q1: <><X /> + <Y /> = 5</>,
    q2: <><X /><sup>2</sup> + <Y /><sup>2</sup> = 4</>,
    ans: 0,
    reason: (
      <>
        <X /> = 5 − <Y /> 대입 → 2<Y />² − 10<Y /> + 21 = 0
        <br />
        D = 100 − 168 &lt; 0 → <b className="text-rose-300">0쌍</b>
      </>
    ),
  },
  {
    q1: <><X /><sup>2</sup> + 2<X /><Y /> + <Y /><sup>2</sup> = 0</>,
    q2: <><X /><sup>2</sup> − <Y /><sup>2</sup> = 3</>,
    ans: 0,
    reason: (
      <>
        (<X /> + <Y />)² = 0 → <X /> = −<Y />
        <br />
        <X />² − <Y />² = (<X /> + <Y />)(<X /> − <Y />) = 0 ≠ 3 →{" "}
        <b className="text-rose-300">0쌍</b>
      </>
    ),
  },
  // ── 1쌍 ──
  {
    q1: <><X /> + <Y /> = 2</>,
    q2: <><X /><sup>2</sup> + <Y /><sup>2</sup> = 2</>,
    ans: 1,
    reason: (
      <>
        <X /> = 2 − <Y /> 대입 → 2<Y />² − 4<Y /> + 2 = 0
        <br />
        (<Y /> − 1)² = 0 → <Y /> = 1, <X /> = 1 →{" "}
        <b className="text-amber-200">(1, 1) 1쌍</b>
      </>
    ),
  },
  {
    q1: <><X /> − <Y /> = 2</>,
    q2: <><X /><sup>2</sup> + <Y /><sup>2</sup> = 2</>,
    ans: 1,
    reason: (
      <>
        <X /> = <Y /> + 2 대입 → 2<Y />² + 4<Y /> + 2 = 0
        <br />
        (<Y /> + 1)² = 0 → <Y /> = −1, <X /> = 1 →{" "}
        <b className="text-amber-200">(1, −1) 1쌍</b>
      </>
    ),
  },
  {
    q1: <><X /><sup>2</sup> − 2<X /><Y /> + <Y /><sup>2</sup> = 0</>,
    q2: <><X /><sup>2</sup> + <Y /><sup>2</sup> = 0</>,
    ans: 1,
    reason: (
      <>
        (<X /> − <Y />)² = 0 → <X /> = <Y />
        <br />
        2<X />² = 0 → <X /> = 0, <Y /> = 0 →{" "}
        <b className="text-amber-200">(0, 0) 1쌍</b>
      </>
    ),
  },
  // ── 2쌍 · A타입 ──
  {
    q1: <><X /> + <Y /> = 3</>,
    q2: <><X /><sup>2</sup> + <Y /><sup>2</sup> = 5</>,
    ans: 2,
    reason: (
      <>
        <X /> = 3 − <Y /> 대입 → 2<Y />² − 6<Y /> + 4 = 0
        <br />
        (<Y /> − 1)(<Y /> − 2) = 0 →{" "}
        <b className="text-emerald-300">(2, 1), (1, 2) 2쌍</b>
      </>
    ),
  },
  {
    q1: <><X /> − <Y /> = 2</>,
    q2: <><X /><Y /> = 8</>,
    ans: 2,
    reason: (
      <>
        <X /> = <Y /> + 2 대입 → <Y />² + 2<Y /> − 8 = 0
        <br />
        (<Y /> + 4)(<Y /> − 2) = 0 →{" "}
        <b className="text-emerald-300">(−2, −4), (4, 2) 2쌍</b>
      </>
    ),
  },
  {
    q1: <><X /> + <Y /> = 0</>,
    q2: <><X /><sup>2</sup> + <Y /><sup>2</sup> = 2</>,
    ans: 2,
    reason: (
      <>
        <X /> = −<Y /> 대입 → 2<Y />² = 2 → <Y /> = ±1
        <br />→ <b className="text-emerald-300">(−1, 1), (1, −1) 2쌍</b>
      </>
    ),
  },
  // ── 2쌍 · B₂타입 ──
  {
    q1: <><X /><sup>2</sup> − 2<X /><Y /> + <Y /><sup>2</sup> = 0</>,
    q2: <><X /><sup>2</sup> + <Y /><sup>2</sup> = 4</>,
    ans: 2,
    reason: (
      <>
        (<X /> − <Y />)² = 0 → <X /> = <Y />
        <br />
        2<Y />² = 4 → <Y /> = ±√2 → <b className="text-emerald-300">2쌍</b>
      </>
    ),
  },
  {
    q1: <>4<X /><sup>2</sup> − 4<X /><Y /> + <Y /><sup>2</sup> = 0</>,
    q2: <><X /><sup>2</sup> + <Y /><sup>2</sup> = 5</>,
    ans: 2,
    reason: (
      <>
        (2<X /> − <Y />)² = 0 → <Y /> = 2<X />
        <br />5<X />² = 5 → <X /> = ±1 →{" "}
        <b className="text-emerald-300">(1, 2), (−1, −2) 2쌍</b>
      </>
    ),
  },
  // ── 3쌍 · B₁타입 (공통해 포함) ──
  {
    q1: <><X /><sup>2</sup> − <Y /><sup>2</sup> = 0</>,
    q2: <><X /><sup>2</sup> − 2<X /> + <Y /><sup>2</sup> = 0</>,
    ans: 3,
    reason: (
      <>
        (<X /> + <Y />)(<X /> − <Y />) = 0
        <br />
        <X /> = <Y />: 2<Y />(<Y /> − 1) = 0 → (0, 0), (1, 1)
        <br />
        <X /> = −<Y />: 2<Y />(<Y /> + 1) = 0 → (0, 0), (1, −1)
        <br />
        (0, 0) 중복 →{" "}
        <b className="text-teal-300">(0, 0), (1, 1), (1, −1) 3쌍</b>
      </>
    ),
  },
  {
    q1: <><X /><sup>2</sup> − <X /><Y /> = 0</>,
    q2: <><X /><sup>2</sup> + <Y /><sup>2</sup> − 2<Y /> = 0</>,
    ans: 3,
    reason: (
      <>
        <X />(<X /> − <Y />) = 0
        <br />
        <X /> = 0: <Y />(<Y /> − 2) = 0 → (0, 0), (0, 2)
        <br />
        <X /> = <Y />: 2<Y />(<Y /> − 1) = 0 → (0, 0), (1, 1)
        <br />
        (0, 0) 중복 →{" "}
        <b className="text-teal-300">(0, 0), (0, 2), (1, 1) 3쌍</b>
      </>
    ),
  },
  // ── 4쌍 · B₁타입 (모두 다름) ──
  {
    q1: <><X /><sup>2</sup> − <Y /><sup>2</sup> = 0</>,
    q2: <><X /><sup>2</sup> + <Y /><sup>2</sup> = 4</>,
    ans: 4,
    reason: (
      <>
        (<X /> + <Y />)(<X /> − <Y />) = 0
        <br />
        각 분기: 2<Y />² = 4 → <Y /> = ±√2
        <br />→{" "}
        <b className="text-violet-200">
          (√2, √2), (−√2, −√2), (√2, −√2), (−√2, √2) 4쌍
        </b>
      </>
    ),
  },
  {
    q1: <><X /><sup>2</sup> − 4<Y /><sup>2</sup> = 0</>,
    q2: <><X /><sup>2</sup> + <Y /><sup>2</sup> = 5</>,
    ans: 4,
    reason: (
      <>
        (<X /> + 2<Y />)(<X /> − 2<Y />) = 0
        <br />
        각 분기: 5<Y />² = 5 → <Y /> = ±1
        <br />→{" "}
        <b className="text-violet-200">
          (2, 1), (−2, −1), (−2, 1), (2, −1) 4쌍
        </b>
      </>
    ),
  },
  {
    q1: <><X /><sup>2</sup> − <X /><Y /> = 0</>,
    q2: <><X /><sup>2</sup> + <Y /><sup>2</sup> = 5</>,
    ans: 4,
    reason: (
      <>
        <X />(<X /> − <Y />) = 0
        <br />
        <X /> = 0: <Y /> = ±√5 → (0, √5), (0, −√5)
        <br />
        <X /> = <Y />: 2<Y />² = 5 → <Y /> = ±√(5/2)
        <br />→ <b className="text-violet-200">모두 다른 4쌍</b>
      </>
    ),
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── 메인 ─────────────────────────────────────────────────
type TabId = "c" | "q";

export default function SimultaneousQuadraticQuiz() {
  const [tab, setTab] = useState<TabId>("c");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🎯 연립이차방정식 해의 개수 스피드퀴즈</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-violet-200">일차식 포함 여부</b> 와{" "}
          <b className="text-violet-200">이차식의 인수분해 꼴</b> 만 보면 해의 개수를
          판단할 수 있습니다 — 판단 지도를 익히고 60 초 스피드퀴즈로 확인!
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <TabBtn active={tab === "c"} onClick={() => setTab("c")}>
          📋 판단 지도
        </TabBtn>
        <TabBtn active={tab === "q"} onClick={() => setTab("q")}>
          ⚡ 스피드퀴즈
        </TabBtn>
      </div>

      <div className={tab === "c" ? "mt-5" : "mt-5 hidden"}>
        <Tab1Reference onStart={() => setTab("q")} />
      </div>
      <div className={tab === "q" ? "mt-5" : "mt-5 hidden"}>
        <Tab2Game onReference={() => setTab("c")} />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl px-3 py-2.5 text-sm font-bold transition " +
        (active
          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-violet-200")
      }
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 판단 지도
// ═══════════════════════════════════════════════════════════

function Brace({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="self-center font-serif text-4xl leading-none"
      style={{ color }}
    >
      {"{"}
    </span>
  );
}

function Tab1Reference({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-violet-100">
          📋 해의 개수를 판단하는 3 가지 타입
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          연립의 한쪽 식의 모양 (일차식 / 두 일차식의 곱 / 일차식의 제곱) 에 따라
          접근법이 달라집니다.
        </p>
      </div>

      {/* A타입 */}
      <RefCard
        badge="A 타입"
        badgeCls="bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
        braceColor="#34d399"
        cardCls="border-emerald-400/30"
        eqs={[
          { txt: "(일차식) = 0", cls: "text-emerald-200 font-bold" },
          { txt: "(이차식) = 0", cls: "text-slate-200" },
        ]}
        step={
          <>
            대입
            <br />
            <span className="font-serif italic text-amber-200">at² + bt + c = 0</span>
          </>
        }
        result={
          <>
            <span className="text-3xl font-extrabold text-emerald-300">0 · 1 · 2</span>
            <span className="block text-xs text-emerald-200">쌍</span>
          </>
        }
        example={
          <>
            예: <X /> + <Y /> = 3 &amp; <X />² + <Y />² = 5
            <br />→ <X /> = 3 − <Y /> 대입 → 2<Y />² − 6<Y /> + 4 = 0 → (
            <Y /> − 1)(<Y /> − 2) = 0 → <b className="text-emerald-300">2 쌍</b>
          </>
        }
      />

      {/* B₁타입 */}
      <RefCard
        badge="B₁ 타입"
        badgeCls="bg-violet-500/20 text-violet-200 border-violet-400/40"
        braceColor="#a78bfa"
        cardCls="border-violet-400/30"
        eqs={[
          { txt: "(일차₁)(일차₂) = 0", cls: "text-violet-200 font-bold" },
          { txt: "(이차식) = 0", cls: "text-slate-200" },
        ]}
        step={
          <>
            A 타입₁
            <br />
            <span className="text-xs text-slate-500">+</span>
            <br />
            A 타입₂
          </>
        }
        result={
          <>
            <span className="text-3xl font-extrabold text-violet-300">0 ~ 4</span>
            <span className="block text-xs text-violet-200">쌍</span>
          </>
        }
        example={
          <>
            예: <X />² − <Y />² = 0 &amp; <X />² + <Y />² = 4 → (<X /> + <Y />)(<X /> − <Y />) = 0 → 두 A 타입 → <b className="text-violet-300">4 쌍</b>
            <br />
            <span className="text-[11px] text-slate-400">
              ※ 두 분기에 공통해가 생기면 <b className="text-violet-300">3 쌍</b> 이하가 될 수 있어요
            </span>
          </>
        }
      />

      {/* B₂타입 */}
      <RefCard
        badge="B₂ 타입"
        badgeCls="bg-cyan-500/20 text-cyan-200 border-cyan-400/40"
        braceColor="#60a5fa"
        cardCls="border-cyan-400/30"
        eqs={[
          { txt: "(일차식)² = 0", cls: "text-cyan-200 font-bold" },
          { txt: "(이차식) = 0", cls: "text-slate-200" },
        ]}
        step={
          <>
            일차식 = 0<br />
            <span className="text-xs text-cyan-300">= A 타입과 동일</span>
          </>
        }
        result={
          <>
            <span className="text-3xl font-extrabold text-cyan-300">0 · 1 · 2</span>
            <span className="block text-xs text-cyan-200">쌍</span>
          </>
        }
        example={
          <>
            예: (<X /> − <Y />)² = 0 &amp; <X />² + <Y />² = 4
            <br />→ <X /> = <Y /> → 2<Y />² = 4 → <Y /> = ±√2 →{" "}
            <b className="text-cyan-300">2 쌍</b>
          </>
        }
      />

      {/* 판별식 힌트 */}
      <div className="rounded-2xl border border-amber-300/30 bg-amber-300/[0.07] p-4">
        <p className="text-xs font-extrabold text-amber-300">
          ⚠ A 타입 · B₂ 타입 — 대입 후 이차방정식의 판별식 D 확인
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <DiscItem cond="D > 0" result="2 쌍" cls="text-emerald-300" />
          <DiscItem cond="D = 0" result="1 쌍" cls="text-amber-200" />
          <DiscItem cond="D < 0" result="0 쌍" cls="text-rose-300" />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onStart}
          className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110"
        >
          ⚡ 스피드퀴즈 도전하러 가기 →
        </button>
      </div>
    </div>
  );
}

function RefCard({
  badge,
  badgeCls,
  braceColor,
  cardCls,
  eqs,
  step,
  result,
  example,
}: {
  badge: string;
  badgeCls: string;
  braceColor: string;
  cardCls: string;
  eqs: { txt: string; cls: string }[];
  step: ReactNode;
  result: ReactNode;
  example: ReactNode;
}) {
  return (
    <div className={"rounded-2xl border bg-white/[0.04] p-4 " + cardCls}>
      <div className="flex items-center gap-3">
        <span
          className={
            "rounded-full border px-3 py-1 text-xs font-extrabold tracking-wider " +
            badgeCls
          }
        >
          {badge}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:flex-nowrap">
        <div className="flex flex-shrink-0 items-stretch gap-1">
          <Brace color={braceColor} />
          <div className="flex flex-col justify-center gap-1 font-serif text-base">
            {eqs.map((e, i) => (
              <div key={i} className={e.cls}>
                {e.txt}
              </div>
            ))}
          </div>
        </div>
        <div className="text-xl text-slate-500">→</div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs leading-6 text-slate-300">
          {step}
        </div>
        <div className="text-xl text-slate-500">→</div>
        <div className="text-center">{result}</div>
      </div>
      <p className="mt-3 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-xs leading-7 text-slate-300">
        {example}
      </p>
    </div>
  );
}

function DiscItem({
  cond,
  result,
  cls,
}: {
  cond: string;
  result: string;
  cls: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2">
      <p className="font-serif text-sm text-slate-200">{cond}</p>
      <p className="text-xs text-slate-500">→</p>
      <p className={"font-extrabold " + cls}>{result}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 스피드퀴즈
// ═══════════════════════════════════════════════════════════

type Phase = "name" | "game" | "result";

type GameState = {
  name: string;
  timeLeft: number;
  maxTime: number;
  score: number;
  ok: number;
  ng: number;
  total: number;
  qs: Quiz[];
  qi: number;
  qStartMs: number;
  locked: boolean;
};

const BONUS_SECS = 5;

const INITIAL_GS: GameState = {
  name: "",
  timeLeft: 60,
  maxTime: 60,
  score: 0,
  ok: 0,
  ng: 0,
  total: 0,
  qs: [],
  qi: 0,
  qStartMs: 0,
  locked: false,
};

type Feedback =
  | { kind: "ok"; pts: number; bonus: boolean; reason: ReactNode }
  | { kind: "ng"; correct: number; reason: ReactNode };

function Tab2Game({ onReference }: { onReference: () => void }) {
  const [phase, setPhase] = useState<Phase>("name");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [gs, setGs] = useState<GameState>(INITIAL_GS);
  const [fb, setFb] = useState<Feedback | null>(null);
  const [bonusFlash, setBonusFlash] = useState(false);

  const timerRef = useRef<number | null>(null);
  const nextRef = useRef<number | null>(null);

  // cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      if (nextRef.current !== null) window.clearTimeout(nextRef.current);
    };
  }, []);

  function startTicker() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setGs((s) => {
        const next = s.timeLeft - 1;
        if (next <= 0) {
          if (timerRef.current !== null) window.clearInterval(timerRef.current);
          timerRef.current = null;
          window.setTimeout(() => {
            setFb(null);
            setPhase("result");
          }, 200);
          return { ...s, timeLeft: 0, locked: true };
        }
        return { ...s, timeLeft: next };
      });
    }, 1000);
  }

  function startGame() {
    const nm = name.trim();
    if (!nm) {
      setNameError(true);
      window.setTimeout(() => setNameError(false), 900);
      return;
    }
    const qs = shuffle([...POOL, ...shuffle(POOL)]);
    setGs({
      ...INITIAL_GS,
      name: nm,
      qs,
      qStartMs: Date.now(),
    });
    setFb(null);
    setPhase("game");
    startTicker();
  }

  function pick(choice: 0 | 1 | 2 | 3 | 4) {
    if (gs.locked || phase !== "game") return;
    const q = gs.qs[gs.qi];
    const elapsed = (Date.now() - gs.qStartMs) / 1000;
    const correct = choice === q.ans;

    if (correct) {
      const pts = 10 + (elapsed <= 5 ? 5 : 0);
      setGs((s) => ({
        ...s,
        locked: true,
        total: s.total + 1,
        ok: s.ok + 1,
        score: s.score + pts,
        timeLeft: s.timeLeft + BONUS_SECS,
        maxTime: Math.max(s.maxTime, s.timeLeft + BONUS_SECS),
      }));
      setFb({ kind: "ok", pts, bonus: pts > 10, reason: q.reason });
      setBonusFlash(true);
      window.setTimeout(() => setBonusFlash(false), 1100);
    } else {
      setGs((s) => ({
        ...s,
        locked: true,
        total: s.total + 1,
        ng: s.ng + 1,
      }));
      setFb({ kind: "ng", correct: q.ans, reason: q.reason });
    }

    const delay = correct ? 1100 : 1700;
    if (nextRef.current !== null) window.clearTimeout(nextRef.current);
    nextRef.current = window.setTimeout(() => {
      setFb(null);
      setGs((s) => {
        if (s.timeLeft <= 0) return s; // already ended
        let nextIdx = s.qi + 1;
        let nextQs = s.qs;
        if (nextIdx >= s.qs.length) {
          nextQs = shuffle([...POOL, ...shuffle(POOL)]);
          nextIdx = 0;
        }
        return {
          ...s,
          qs: nextQs,
          qi: nextIdx,
          locked: false,
          qStartMs: Date.now(),
        };
      });
    }, delay);
  }

  function restart() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (nextRef.current !== null) window.clearTimeout(nextRef.current);
    nextRef.current = null;
    setPhase("name");
    setGs(INITIAL_GS);
    setFb(null);
  }

  if (phase === "name") {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-transparent p-6 text-center">
          <p className="text-5xl">⚡</p>
          <p className="mt-2 text-xl font-extrabold text-violet-100">스피드퀴즈 도전!</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            연립방정식을 보고{" "}
            <b className="text-fuchsia-300">정확한 해의 쌍의 수</b> 를 고르세요!
            <br />
            기본 <b className="text-amber-300">60 초</b> 에서 시작, 정답마다{" "}
            <b className="text-emerald-300">+5 초!</b>
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") startGame();
            }}
            placeholder="이름 또는 별명"
            maxLength={10}
            aria-label="이름 입력"
            className={
              "mt-4 w-full max-w-xs rounded-lg border-2 bg-slate-950/60 px-4 py-2 text-center text-base text-white outline-none transition " +
              (nameError
                ? "border-rose-400"
                : "border-violet-400/40 focus:border-violet-300 focus:ring-2 focus:ring-violet-300/30")
            }
          />
          <div className="mt-4">
            <button
              type="button"
              onClick={startGame}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-base font-bold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110"
            >
              게임 시작! →
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300">
          <p className="font-extrabold text-violet-200">📋 게임 규칙</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              0 · 1 · 2 · 3 · 4 중{" "}
              <b className="text-violet-100">정확한 해의 쌍의 수</b> 를 선택
            </li>
            <li>
              정답 → <b className="text-emerald-300">+10 점</b> + 타이머{" "}
              <b className="text-emerald-300">+5 초</b>
            </li>
            <li>
              5 초 이내 정답이면 <b className="text-amber-300">⚡ +5 스피드 보너스</b>
            </li>
            <li>오답도 패널티 없어요. 과감하게 도전!</li>
          </ul>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const stars =
      gs.score >= 150
        ? "🌟🌟🌟"
        : gs.score >= 100
        ? "⭐⭐⭐"
        : gs.score >= 60
        ? "⭐⭐"
        : gs.score >= 20
        ? "⭐"
        : "💪";
    const msg =
      gs.score >= 150
        ? "완벽한 실력! 연립이차방정식 마스터!"
        : gs.score >= 100
        ? "훌륭해요! 구조 분석 속도가 빨라지고 있어요!"
        : gs.score >= 60
        ? "잘 하고 있어요! 조금 더 연습하면 더 빨라져요!"
        : gs.score >= 20
        ? "판단 지도를 보고 다시 도전해 보세요!"
        : "개념 정리 탭을 먼저 보고 다시 도전하세요!";

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-violet-400/40 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-transparent p-6 text-center">
          <p className="text-sm text-slate-400">{gs.name} 님의 결과</p>
          <p className="mt-1 text-6xl font-extrabold text-violet-200">{gs.score}</p>
          <p className="text-xs text-slate-500">점</p>
          <p className="mt-2 text-3xl">{stars}</p>
          <p className="mt-2 text-sm text-slate-300">{msg}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <StatCard label="정답" val={gs.ok} cls="border-emerald-400/40 text-emerald-200" />
          <StatCard label="오답" val={gs.ng} cls="border-rose-400/40 text-rose-200" />
          <StatCard
            label="푼 문제"
            val={gs.total}
            cls="border-slate-400/40 text-slate-200"
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={restart}
            className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/20"
          >
            다시 도전 🔄
          </button>
          <button
            type="button"
            onClick={onReference}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            📋 판단 지도
          </button>
        </div>
      </div>
    );
  }

  // === phase === "game"
  const q = gs.qs[gs.qi];
  const pct = Math.max(0, Math.min(100, (gs.timeLeft / gs.maxTime) * 100));
  const timerCls =
    gs.timeLeft <= 5 ? "text-rose-300" : gs.timeLeft <= 10 ? "text-amber-300" : "text-slate-100";
  const barCls =
    gs.timeLeft <= 5
      ? "from-rose-500 to-rose-400"
      : gs.timeLeft <= 10
      ? "from-amber-400 to-orange-500"
      : "from-violet-500 to-fuchsia-500";
  const timeStr = `${Math.floor(gs.timeLeft / 60)}:${String(gs.timeLeft % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      {/* 타이머 바 */}
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <svg viewBox="0 0 100 1" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="sqq-bar" x1="0" x2="1">
              <stop
                offset="0%"
                stopColor={
                  gs.timeLeft <= 5
                    ? "#fb7185"
                    : gs.timeLeft <= 10
                    ? "#fbbf24"
                    : "#8b5cf6"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  gs.timeLeft <= 5
                    ? "#f43f5e"
                    : gs.timeLeft <= 10
                    ? "#fb923c"
                    : "#d946ef"
                }
              />
            </linearGradient>
          </defs>
          <rect x="0" y="0" height="1" width={pct} fill="url(#sqq-bar)" />
        </svg>
      </div>

      {/* HUD */}
      <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4">
        {bonusFlash ? (
          <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce rounded-full bg-emerald-400/30 px-3 py-1 text-xs font-extrabold text-emerald-100 shadow-lg shadow-emerald-500/30">
            +5 초!
          </div>
        ) : null}
        <HudItem label="⏱ 남은 시간" val={<span className={timerCls}>{timeStr}</span>} />
        <HudItem label="🏆 점수" val={gs.score} />
        <HudItem label="✅ 정답" val={gs.ok} cls="text-emerald-300" />
        <HudItem label="❌ 오답" val={gs.ng} cls="text-rose-300" />
      </div>

      {/* 문제 카드 */}
      <div className="rounded-2xl border border-violet-400/30 bg-white/[0.04] p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-violet-300">
          문제 {gs.total + 1}
        </p>
        <div className="mt-3 flex items-stretch justify-center gap-2 rounded-xl border border-violet-300/30 bg-violet-300/[0.06] px-4 py-4">
          <Brace color="#a78bfa" />
          <div className="flex flex-col justify-center gap-1 font-serif text-lg text-amber-100 sm:text-xl">
            <div>{q.q1}</div>
            <div>{q.q2}</div>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">
          이 연립방정식의 실수 해는 정확히 몇 쌍인가요?
        </p>

        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {([0, 1, 2, 3, 4] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => pick(n)}
              disabled={gs.locked}
              className={
                "rounded-lg border-2 px-2 py-3 font-serif text-base font-bold transition disabled:cursor-default " +
                ansBtnCls(n)
              }
            >
              {n} 쌍
            </button>
          ))}
        </div>

        {fb !== null ? (
          <div
            className={
              "mt-4 rounded-xl border px-3 py-3 text-sm leading-7 " +
              (fb.kind === "ok"
                ? "border-emerald-400/55 bg-emerald-400/10 text-emerald-100"
                : "border-rose-400/55 bg-rose-400/10 text-rose-100")
            }
          >
            <p className="font-extrabold">
              {fb.kind === "ok" ? (
                <>
                  ✅ 정답! <span className="text-amber-300">+{fb.pts} 점</span>
                  {fb.bonus ? " ⚡" : ""} <span className="text-emerald-300">+5 초</span>
                </>
              ) : (
                <>
                  ❌ 오답! 정답:{" "}
                  <b className="text-amber-200">{fb.correct} 쌍</b>
                </>
              )}
            </p>
            <p className="mt-1 text-slate-200">{fb.reason}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ansBtnCls(n: 0 | 1 | 2 | 3 | 4): string {
  // 5 보기를 살짝 색 분리 (시각적으로 빠른 인식 도움)
  switch (n) {
    case 0:
      return "border-rose-400/40 bg-rose-400/10 text-rose-200 hover:border-rose-300 hover:bg-rose-400/20 disabled:opacity-50";
    case 1:
      return "border-amber-400/40 bg-amber-400/10 text-amber-200 hover:border-amber-300 hover:bg-amber-400/20 disabled:opacity-50";
    case 2:
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:border-emerald-300 hover:bg-emerald-400/20 disabled:opacity-50";
    case 3:
      return "border-teal-400/40 bg-teal-400/10 text-teal-200 hover:border-teal-300 hover:bg-teal-400/20 disabled:opacity-50";
    case 4:
      return "border-violet-400/40 bg-violet-400/10 text-violet-200 hover:border-violet-300 hover:bg-violet-400/20 disabled:opacity-50";
  }
}

function HudItem({
  label,
  val,
  cls,
}: {
  label: string;
  val: ReactNode;
  cls?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className={"mt-0.5 font-mono text-xl font-extrabold " + (cls ?? "text-slate-100")}>
        {val}
      </p>
    </div>
  );
}

function StatCard({
  label,
  val,
  cls,
}: {
  label: string;
  val: number;
  cls: string;
}) {
  return (
    <div className={"rounded-xl border bg-white/[0.04] p-3 " + cls}>
      <p className="font-mono text-2xl font-extrabold">{val}</p>
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
    </div>
  );
}
