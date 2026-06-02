"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "term_distinction",
    prompt:
      "‘−4 의 제곱근’ 과 ‘√(−4)’ 의 차이를 자신의 말로 설명하고, 각각의 값을 구해 보세요. 두 표현이 가리키는 값의 개수가 어떻게 달라지는지도 함께 짚어 주세요.",
    kind: "text",
    placeholder:
      "예: ‘−4 의 제곱근’ 은 x² = −4 를 만족하는 x 의 값 전체이므로 2i 와 −2i 두 개이다. 반면 ‘√(−4)’ 는 그중 정해진 하나(√4·i = 2i) 의 값을 가리킨다. 같은 음수를 두고도 표현에 따라 값의 개수가 다르다.",
  },
  {
    id: "wrong_root_product",
    prompt:
      "‘√(−2) × √(−3) = √6’ 이라는 계산이 왜 틀렸는지 설명하고, 올바른 계산 과정을 단계별로 써 보세요. (힌트: √(−a) = √a · i 변환 후 i² = −1 적용)",
    kind: "text",
    placeholder:
      "예: √a·√b = √(ab) 는 a > 0, b > 0 일 때만 성립하는 공식이라, 두 수가 모두 음수이면 그대로 쓰면 안 된다. 올바른 계산은 √(−2) = √2·i, √(−3) = √3·i 로 먼저 변환한 뒤, (√2·i)(√3·i) = √6 · i² = √6 · (−1) = −√6 이다.",
  },
];

// ─── 표기 ───────────────────────────────────────────────────
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

// ─── 메인 ───────────────────────────────────────────────────
type TabId = "t1" | "t2" | "t3" | "t4";

const TABS: { id: TabId; label: string }[] = [
  { id: "t1", label: "📚 용어 구분" },
  { id: "t2", label: "🔍 함정 탐구" },
  { id: "t3", label: "🔎 오답 찾기" },
  { id: "t4", label: "🏆 도전 문제" },
];

export default function NegativeSqrtTrap() {
  const [tab, setTab] = useState<TabId>("t1");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* ─── 헤더 ─── */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🚨 음수의 제곱근 함정 탈출!</h3>
        <p className="mt-2 leading-7 text-slate-300">
          ‘<b className="text-rose-200">a 의 제곱근</b>’ 과{" "}
          <b className="text-rose-200"><Sqrt>a</Sqrt></b> 의 차이, 음수를 포함한 제곱근의 곱셈·나눗셈에서 빠지기
          쉬운 함정을 카드 뒤집기·단계별 탐구·오답 찾기·도전 문제로 정복해 봅시다.
        </p>
      </div>

      {/* 탭 바 */}
      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              "rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition " +
              (tab === t.id
                ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={tab === "t1" ? "mt-5" : "mt-5 hidden"}>
        <Tab1Terms />
      </div>
      <div className={tab === "t2" ? "mt-5" : "mt-5 hidden"}>
        <Tab2Investigation />
      </div>
      <div className={tab === "t3" ? "mt-5" : "mt-5 hidden"}>
        <Tab3FindError />
      </div>
      <div className={tab === "t4" ? "mt-5" : "mt-5 hidden"}>
        <Tab4Challenge />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 공통 — 셀션 헤더 ──────────────────────────────────────
function SecHeader({ title, desc }: { title: ReactNode; desc?: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-extrabold text-violet-200">{title}</p>
      {desc ? <p className="mt-1 text-sm leading-7 text-slate-300">{desc}</p> : null}
    </div>
  );
}

// ─── 공통 — 박스 (concept / safe / danger / warn) ──────────
function ConceptBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-violet-400/40 bg-violet-400/10 px-4 py-3 text-sm leading-7 text-violet-100">
      {children}
    </div>
  );
}
function SafeBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm leading-7 text-emerald-100">
      {children}
    </div>
  );
}
function DangerBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm leading-7 text-rose-100">
      {children}
    </div>
  );
}
function WarnBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm leading-7 text-amber-100">
      {children}
    </div>
  );
}

// ─── TAB 1 — 용어 구분 ────────────────────────────────────
type FlipData = { front: ReactNode; answer: ReactNode; reason: ReactNode };
const FLIPS: FlipData[] = [
  {
    front: <>−9 의 제곱근</>,
    answer: <>+3<I /> 와 −3<I /></>,
    reason: <>x² = −9 → x = ±3<I /> (두 개의 허수)</>,
  },
  {
    front: <><Sqrt>−9</Sqrt></>,
    answer: <>3<I /></>,
    reason: <><Sqrt>−9</Sqrt> = <Sqrt>9</Sqrt>·<I /> = 3<I /> (하나의 값)</>,
  },
  {
    front: <>−16 의 제곱근</>,
    answer: <>+4<I /> 와 −4<I /></>,
    reason: <>x² = −16 → x = ±4<I /> (두 개의 허수)</>,
  },
  {
    front: <><Sqrt>−16</Sqrt></>,
    answer: <>4<I /></>,
    reason: <><Sqrt>−16</Sqrt> = <Sqrt>16</Sqrt>·<I /> = 4<I /> (하나의 값)</>,
  },
  {
    front: <>−2 의 제곱근</>,
    answer: <>+<Sqrt>2</Sqrt>·<I /> 와 −<Sqrt>2</Sqrt>·<I /></>,
    reason: <>x² = −2 → x = ±<Sqrt>2</Sqrt>·<I /> (두 개의 허수)</>,
  },
  {
    front: <><Sqrt>−6</Sqrt></>,
    answer: <><Sqrt>6</Sqrt>·<I /></>,
    reason: <><Sqrt>−6</Sqrt> = <Sqrt>6</Sqrt>·<I /> (하나의 값)</>,
  },
];

type QuickQ = {
  q: ReactNode;
  options: { label: ReactNode; correct: boolean }[];
  ok: ReactNode;
  no: ReactNode;
};
const QUICK: QuickQ[] = [
  {
    q: <>① −25 의 제곱근을 모두 고르면?</>,
    options: [
      { label: "5", correct: false },
      { label: <>5<I /></>, correct: false },
      { label: <>5<I /> 와 −5<I /></>, correct: true },
      { label: <>−5<I /></>, correct: false },
    ],
    ok: <>✅ 맞아요! −25 의 제곱근은 x² = −25 의 해 → x = ±5<I />, 두 개입니다.</>,
    no: <>❌ −25 의 제곱근은 x² = −25 를 만족하는 x 이므로 5<I /> 와 −5<I /> 두 개입니다.</>,
  },
  {
    q: <>② <Sqrt>−25</Sqrt> 의 값은?</>,
    options: [
      { label: "5", correct: false },
      { label: <>5<I /></>, correct: true },
      { label: <>±5<I /></>, correct: false },
      { label: <>−5<I /></>, correct: false },
    ],
    ok: <>✅ 정확! <Sqrt>−25</Sqrt> = <Sqrt>25</Sqrt>·<I /> = 5<I />. 하나의 확정된 값입니다.</>,
    no: <>❌ <Sqrt>−25</Sqrt> = <Sqrt>25</Sqrt>·<I /> = 5<I />, 하나의 값이에요. ±5<I /> 가 아닙니다!</>,
  },
  {
    q: <>③ ‘−3 의 제곱근’ 과 ‘<Sqrt>−3</Sqrt>’ 은 같은가?</>,
    options: [
      { label: <>같다 — 둘 다 <Sqrt>3</Sqrt>·<I /></>, correct: false },
      { label: "다르다 — 개수가 다름", correct: true },
      { label: "음수라서 둘 다 없다", correct: false },
    ],
    ok: <>✅ 맞아요! −3 의 제곱근은 ±<Sqrt>3</Sqrt><I /> (두 개), <Sqrt>−3</Sqrt> 은 <Sqrt>3</Sqrt><I /> (하나). 개수가 다릅니다.</>,
    no: <>❌ 다시 생각해 봅시다. −3 의 제곱근은 두 개, <Sqrt>−3</Sqrt> 은 하나입니다!</>,
  },
];

function Tab1Terms() {
  const [flipped, setFlipped] = useState<boolean[]>(() => FLIPS.map(() => false));
  const [picked, setPicked] = useState<(number | null)[]>(() => QUICK.map(() => null));

  function toggle(i: number) {
    setFlipped((arr) => arr.map((v, idx) => (idx === i ? !v : v)));
  }
  function pick(qi: number, oi: number) {
    setPicked((arr) => {
      if (arr[qi] !== null) return arr;
      const n = [...arr];
      n[qi] = oi;
      return n;
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <SecHeader title="📌 핵심 개념 비교" />
        <ConceptBox>
          <p>
            <b>a 의 제곱근</b> → x² = a 를 만족하는 <span className="text-rose-200">모든</span> x 의 값
          </p>
          <p className="mt-1 text-xs text-violet-300">
            −4 의 제곱근: x² = −4 ⟹ x = 2<I /> 또는 x = −2<I /> &nbsp;<b>(두 개)</b>
          </p>
        </ConceptBox>
        <ConceptBox>
          <p>
            <b><Sqrt>a</Sqrt> (제곱근 a)</b> → a 의 제곱근 중 정해진{" "}
            <span className="text-rose-200">하나</span> 의 값
          </p>
          <p className="mt-1 text-xs text-violet-300">
            <Sqrt>−4</Sqrt> = 2<I /> &nbsp;&nbsp;(단, a &lt; 0 이면 <Sqrt>−a</Sqrt>·<I /> 로 변환) &nbsp;<b>(하나)</b>
          </p>
        </ConceptBox>
        <DangerBox>
          <p className="font-extrabold text-rose-200">⚠️ 혼동 주의!</p>
          <p className="mt-1">
            <b>−9 의 제곱근</b> 은 3<I /> 와 −3<I /> <b>(두 개)</b>
          </p>
          <p>
            <b><Sqrt>−9</Sqrt></b> = 3<I /> &nbsp;<b>(하나, −3<I /> 가 아님)</b>
          </p>
        </DangerBox>
      </div>

      <div className="space-y-3">
        <SecHeader title="🃏 카드 뒤집기 — 클릭하여 답 확인" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLIPS.map((f, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className={
                "min-h-[120px] rounded-xl border-2 p-4 text-center transition " +
                (flipped[i]
                  ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
                  : "border-violet-400/45 bg-violet-400/15 text-violet-100 hover:bg-violet-400/25")
              }
            >
              {flipped[i] ? (
                <>
                  <p className="text-lg font-extrabold text-emerald-200">{f.answer}</p>
                  <p className="mt-2 text-xs leading-6 text-emerald-100/80">{f.reason}</p>
                </>
              ) : (
                <>
                  <p className="text-base font-extrabold">{f.front}</p>
                  <p className="mt-3 text-xs text-violet-300">👆 클릭해서 확인</p>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SecHeader title="❓ 빠른 확인 퀴즈" />
        <div className="space-y-3">
          {QUICK.map((q, qi) => {
            const cur = picked[qi];
            const done = cur !== null;
            const correctAfter = done && q.options[cur!].correct;
            return (
              <div key={qi} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-bold text-slate-100">{q.q}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.options.map((o, oi) => {
                    const isAns = o.correct;
                    const isChosen = cur === oi;
                    const showCorrect = done && isAns;
                    const showWrong = isChosen && !isAns;
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={done}
                        onClick={() => pick(qi, oi)}
                        className={
                          "rounded-lg border-2 px-3 py-1.5 text-sm font-bold transition disabled:cursor-default " +
                          (showCorrect
                            ? "border-emerald-400 bg-emerald-400/20 text-emerald-100 ring-4 ring-emerald-300/55"
                            : showWrong
                            ? "border-rose-400 bg-rose-400/20 text-rose-100 ring-4 ring-rose-300/55"
                            : "border-violet-400/35 bg-white/5 text-slate-100 hover:bg-violet-400/15")
                        }
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                {done ? (
                  <p
                    className={
                      "mt-2 text-xs font-bold leading-6 " +
                      (correctAfter ? "text-emerald-200" : "text-rose-200")
                    }
                  >
                    {correctAfter ? q.ok : q.no}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2 — 함정 탐구 ────────────────────────────────────
type Step = { eq: ReactNode; why: ReactNode; final?: boolean };
type Invest = {
  title: ReactNode;
  wrong: ReactNode;
  steps: Step[];
};
const INVESTS: Invest[] = [
  {
    title: <>🔬 단계별 탐구 ① &nbsp; <Sqrt>−4</Sqrt> × <Sqrt>−9</Sqrt> = ?</>,
    wrong: (
      <>
        <Sqrt>−4</Sqrt> × <Sqrt>−9</Sqrt> = <Sqrt>(−4) × (−9)</Sqrt> = <Sqrt>36</Sqrt> = 6 ← a, b &lt; 0 인데 공식 그대로 사용!
      </>
    ),
    steps: [
      {
        eq: <><Sqrt>−4</Sqrt> = <Sqrt>4</Sqrt>· <I /> = <em className="not-italic font-bold text-violet-200">2<I /></em></>,
        why: <><Sqrt>−a</Sqrt> = <Sqrt>a</Sqrt> · <I /> (a &gt; 0) 규칙 적용</>,
      },
      {
        eq: <><Sqrt>−9</Sqrt> = <Sqrt>9</Sqrt> ·<I /> = <em className="not-italic font-bold text-violet-200">3<I /></em></>,
        why: <>마찬가지로 변환</>,
      },
      {
        eq: <>2<I /> × 3<I /> = <em className="not-italic font-bold text-violet-200">6<I />²</em></>,
        why: <>실수끼리, <I /> 끼리 묶어 계산</>,
      },
      {
        eq: <>6<I />² = 6 × (−1) = <span className="text-emerald-200">−6 ✓</span></>,
        why: (
          <>
            <I />² = −1 대입. 정답은 6 이 아닌 <b className="text-emerald-200">−6</b>!
          </>
        ),
        final: true,
      },
    ],
  },
  {
    title: <>🔬 단계별 탐구 ② &nbsp; <Sqrt>8</Sqrt> / <Sqrt>−4</Sqrt> = ?</>,
    wrong: (
      <>
        <Sqrt>8</Sqrt> / <Sqrt>−4</Sqrt> = <Sqrt>8 / (−4)</Sqrt> = <Sqrt>−2</Sqrt> = <Sqrt>2</Sqrt>·<I /> ← b &lt; 0 인데 공식 그대로 사용!
      </>
    ),
    steps: [
      {
        eq: <><Sqrt>8</Sqrt> = 2<Sqrt>2</Sqrt>, &nbsp; <Sqrt>−4</Sqrt> = <em className="not-italic font-bold text-violet-200">2<I /></em></>,
        why: <>각각 변환하여 준비</>,
      },
      {
        eq: <>2<Sqrt>2</Sqrt> / 2<I /> = <em className="not-italic font-bold text-violet-200"><Sqrt>2</Sqrt> / <I /></em></>,
        why: <>분자·분모 공약수 2 로 약분</>,
      },
      {
        eq: <><Sqrt>2</Sqrt> / <I /> = <Sqrt>2</Sqrt>·<I /> / (<I /> · <I />) = <em className="not-italic font-bold text-violet-200"><Sqrt>2</Sqrt>·<I /> / <I />²</em></>,
        why: <>분모 유리화: 분자·분모에 <I /> 곱하기</>,
      },
      {
        eq: <><Sqrt>2</Sqrt>·<I /> / (−1) = <span className="text-emerald-200">−<Sqrt>2</Sqrt>·<I /> ✓</span></>,
        why: (
          <>
            <I />² = −1. 정답은 <Sqrt>2</Sqrt><I /> 가 아닌 <b className="text-emerald-200">−<Sqrt>2</Sqrt><I /></b>!
          </>
        ),
        final: true,
      },
    ],
  },
  {
    title: <>🔬 단계별 탐구 ③ &nbsp; <Sqrt>−2</Sqrt> × <Sqrt>−3</Sqrt> = ?</>,
    wrong: (
      <>
        <Sqrt>−2</Sqrt> × <Sqrt>−3</Sqrt> = <Sqrt>(−2) × (−3)</Sqrt> = <Sqrt>6</Sqrt> ← 음수끼리 공식 그대로 사용!
      </>
    ),
    steps: [
      {
        eq: <><Sqrt>−2</Sqrt> = <Sqrt>2</Sqrt>·<I />, &nbsp; <Sqrt>−3</Sqrt> = <em className="not-italic font-bold text-violet-200"><Sqrt>3</Sqrt>·<I /></em></>,
        why: <><I /> 를 이용해 각각 변환</>,
      },
      {
        eq: <>(<Sqrt>2</Sqrt>·<I />)(<Sqrt>3</Sqrt>·<I />) = <em className="not-italic font-bold text-violet-200"><Sqrt>6</Sqrt> · <I />²</em></>,
        why: <>실수끼리(<Sqrt>2</Sqrt>·<Sqrt>3</Sqrt> =<Sqrt>6</Sqrt>), <I /> 끼리(<I />·<I /> = <I />²) 묶기</>,
      },
      {
        eq: <><Sqrt>6</Sqrt> · (−1) = <span className="text-emerald-200">−<Sqrt>6</Sqrt> ✓</span></>,
        why: (
          <>
            <I />² = −1. 정답은 +<Sqrt>6</Sqrt> 이 아닌 <b className="text-emerald-200">−<Sqrt>6</Sqrt></b>!
          </>
        ),
        final: true,
      },
    ],
  },
];

function Tab2Investigation() {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <SecHeader title="⚠️ 공식 사용의 조건!" />
        <SafeBox>
          <p className="font-extrabold text-emerald-200">✅ a &gt; 0, b &gt; 0 일 때만 성립</p>
          <p className="mt-1 text-center font-mono"><Sqrt>a</Sqrt> · <Sqrt>b</Sqrt> = <Sqrt>ab</Sqrt> &nbsp;&nbsp;&nbsp;&nbsp; <Sqrt>a</Sqrt> / <Sqrt>b</Sqrt> = <Sqrt>a/b</Sqrt></p>
        </SafeBox>
        <DangerBox>
          <p className="font-extrabold text-rose-200">❌ a &lt; 0 또는 b &lt; 0 이면 위 공식 직접 사용 금지!</p>
          <p className="mt-1">
            반드시 <b><Sqrt>−a</Sqrt> = <Sqrt>a</Sqrt> · <I /></b> 로 변환한 뒤 계산해야 합니다.
          </p>
        </DangerBox>
        <WarnBox>
          <p className="font-extrabold text-amber-200">📐 음수 포함 시 성립하는 공식</p>
          <p className="mt-1">
            <b>a &lt; 0, b &lt; 0</b> 이면 &nbsp; <Sqrt>a</Sqrt> · <Sqrt>b</Sqrt> = <b>−<Sqrt>ab</Sqrt></b> &nbsp; (부호 뒤집힘!)
          </p>
          <p>
            <b>a &gt; 0, b &lt; 0</b> 이면 &nbsp; <Sqrt>a</Sqrt> / <Sqrt>b</Sqrt> = <b>−<Sqrt>a/b</Sqrt></b> &nbsp; (부호 뒤집힘!)
          </p>
        </WarnBox>
      </div>

      {INVESTS.map((inv, idx) => (
        <StepReveal key={idx} invest={inv} />
      ))}
    </div>
  );
}

function StepReveal({ invest }: { invest: Invest }) {
  const max = invest.steps.length;
  const [revealed, setRevealed] = useState(0);
  const done = revealed >= max;
  return (
    <div className="space-y-3">
      <SecHeader title={invest.title} />
      <DangerBox>
        <p className="text-xs font-extrabold text-rose-200">⛔ 잘못된 계산</p>
        <p className="mt-1 text-xs leading-6">{invest.wrong}</p>
      </DangerBox>
      <ol className="space-y-2">
        {invest.steps.map((s, i) => {
          const shown = i < revealed;
          return (
            <li
              key={i}
              className={
                "flex items-start gap-3 rounded-xl border px-3 py-3 transition " +
                (shown
                  ? "border-violet-400/35 bg-violet-400/10"
                  : "border-white/10 bg-white/5 opacity-40")
              }
            >
              <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-violet-400/30 text-xs font-extrabold text-violet-100">
                {i + 1}
              </span>
              <div className="text-sm leading-7 text-slate-100">
                <div className={s.final ? "font-extrabold text-emerald-200" : "font-semibold"}>
                  {s.eq}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{s.why}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRevealed((r) => Math.min(r + 1, max))}
          disabled={done}
          className={
            "rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-default " +
            (done
              ? "border-2 border-emerald-400/55 bg-emerald-400/15 text-emerald-200"
              : "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110")
          }
        >
          {done ? "✅ 완료!" : "▶ 다음 단계 보기"}
        </button>
        {revealed > 0 ? (
          <button
            type="button"
            onClick={() => setRevealed(0)}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
          >
            ↻ 처음부터
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─── TAB 3 — 오답 찾기 ────────────────────────────────────
type ErrorCalc = {
  title: ReactNode;
  steps: ReactNode[]; // step lines as-rendered
  wrongIdx: number; // index of the wrong step
  solution: ReactNode;
  solutionNote: ReactNode;
};

const ERROR_CALCS: ErrorCalc[] = [
  {
    title: <>① <Sqrt>−4</Sqrt> × <Sqrt>−9</Sqrt> 계산</>,
    steps: [
      <><Sqrt>−4</Sqrt> × <Sqrt>−9</Sqrt></>,
      <>= <Sqrt>(−4) × (−9)</Sqrt></>,
      <>= <Sqrt>36</Sqrt></>,
      <>= 6</>,
    ],
    wrongIdx: 1,
    solution: (
      <>
        <Sqrt>−4</Sqrt> × <Sqrt>−9</Sqrt> = 2<I /> × 3<I /> = 6<I />² = 6 × (−1) ={" "}
        <b className="text-emerald-200">−6</b>
      </>
    ),
    solutionNote: (
      <>
        <Sqrt>−4</Sqrt> = 2<I />, <Sqrt>−9</Sqrt> = 3<I /> 로 먼저 변환 후 곱하기. 정답은 6 이 아닌 <b>−6</b>!
      </>
    ),
  },
  {
    title: <>② <Sqrt>8</Sqrt> / <Sqrt>−4</Sqrt> 계산</>,
    steps: [
      <><Sqrt>8</Sqrt> / <Sqrt>−4</Sqrt></>,
      <>= <Sqrt>8 / (−4)</Sqrt></>,
      <>= <Sqrt>−2</Sqrt></>,
      <>= <Sqrt>2</Sqrt> · <I /></>,
    ],
    wrongIdx: 1,
    solution: (
      <>
        <Sqrt>8</Sqrt> / <Sqrt>−4</Sqrt> = 2<Sqrt>2</Sqrt> / 2<I /> = <Sqrt>2</Sqrt> / <I /> = <Sqrt>2</Sqrt>·<I /> / <I />² = <Sqrt>2</Sqrt>·<I /> / (−1) ={" "}
        <b className="text-emerald-200">−<Sqrt>2</Sqrt>·<I /></b>
      </>
    ),
    solutionNote: (
      <>
        <Sqrt>−4</Sqrt> = 2<I /> 로 변환 후 분모 유리화. 정답은 <Sqrt>2</Sqrt><I /> 가 아닌 <b>−<Sqrt>2</Sqrt><I /></b>!
      </>
    ),
  },
];

function Tab3FindError() {
  // per-calc state: chosen step idx | null, "wrong but not yet solved" shake idx
  const [solved, setSolved] = useState<boolean[]>(() => ERROR_CALCS.map(() => false));
  const [shake, setShake] = useState<(number | null)[]>(() => ERROR_CALCS.map(() => null));

  function clickStep(ci: number, si: number) {
    if (solved[ci]) return;
    if (si === ERROR_CALCS[ci].wrongIdx) {
      setSolved((arr) => arr.map((v, i) => (i === ci ? true : v)));
    } else {
      setShake((arr) => arr.map((v, i) => (i === ci ? si : v)));
      window.setTimeout(() => {
        setShake((arr) => arr.map((v, i) => (i === ci && v === si ? null : v)));
      }, 1200);
    }
  }

  function reset() {
    setSolved(ERROR_CALCS.map(() => false));
    setShake(ERROR_CALCS.map(() => null));
  }

  const allSolved = solved.every(Boolean);

  return (
    <div className="space-y-4">
      <SecHeader title="🔎 잘못된 계산, 네가 찾아라!" />
      <WarnBox>
        아래 두 계산에는 각각 틀린 단계가 하나씩 있습니다. 잘못된 계산이{" "}
        <b>처음 시작된 단계</b>를 클릭하여 찾아보세요. (힌트: 규칙을 잘못 적용한 단계가 어디일까요?)
      </WarnBox>

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">풀이 진행:</span>
        {ERROR_CALCS.map((_, i) => (
          <span
            key={i}
            className={
              "inline-block h-3 w-3 rounded-full " +
              (solved[i] ? "bg-emerald-400" : "bg-white/15")
            }
          />
        ))}
        <button
          type="button"
          onClick={reset}
          className="ml-auto rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200 hover:bg-white/10"
        >
          ↻ 초기화
        </button>
      </div>

      {ERROR_CALCS.map((ec, ci) => {
        const isSolved = solved[ci];
        const shakingIdx = shake[ci];
        return (
          <div key={ci} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-bold text-slate-400">{ec.title}</p>
            <div className="mt-2 space-y-1.5">
              {ec.steps.map((s, si) => {
                const isWrong = si === ec.wrongIdx;
                const isShaking = shakingIdx === si;
                const showWrongLocked = isSolved && isWrong;
                return (
                  <button
                    key={si}
                    type="button"
                    onClick={() => clickStep(ci, si)}
                    disabled={isSolved}
                    className={
                      "flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition disabled:cursor-default " +
                      (showWrongLocked
                        ? "border-rose-400/65 bg-rose-400/15 text-rose-100"
                        : isSolved
                        ? "border-white/10 bg-white/5 text-slate-300 opacity-70"
                        : isShaking
                        ? "border-rose-400/55 bg-rose-400/10 text-rose-100"
                        : "border-white/10 bg-white/5 text-slate-100 hover:border-violet-400/45 hover:bg-violet-400/10")
                    }
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-400/30 text-[10px] font-extrabold text-violet-100">
                      {showWrongLocked ? "✗" : "·"}
                    </span>
                    <span className="font-mono">{s}</span>
                  </button>
                );
              })}
            </div>
            {isSolved ? (
              <p className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm font-bold leading-7 text-emerald-100">
                🎉 정확히 찾았어요! 음수가 포함되어 있는데 <Sqrt>a</Sqrt> · <Sqrt>b</Sqrt> = <Sqrt>ab</Sqrt> 공식을 그대로 쓴 게
                문제입니다.
              </p>
            ) : shakingIdx !== null ? (
              <p className="mt-3 rounded-xl border border-rose-400/40 bg-rose-400/10 p-3 text-sm font-bold leading-7 text-rose-100">
                ❌ 이 단계는 옳아요. 공식을 잘못 적용한 단계를 찾아보세요!
              </p>
            ) : null}
          </div>
        );
      })}

      {allSolved ? (
        <div className="rounded-2xl border border-violet-400/40 bg-violet-400/10 p-4">
          <p className="text-sm font-extrabold text-violet-100">✅ 올바른 풀이 공개!</p>
          {ERROR_CALCS.map((ec, ci) => (
            <div key={ci} className="mt-3">
              <p className="text-xs font-bold text-amber-200">{ec.title} 의 올바른 계산</p>
              <p className="mt-1 rounded-lg border border-violet-400/35 bg-violet-400/10 px-3 py-2 text-center text-sm font-bold leading-7 text-violet-50">
                {ec.solution}
              </p>
              <p className="mt-1 text-xs leading-6 text-slate-400">{ec.solutionNote}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── TAB 4 — 도전 문제 ────────────────────────────────────
type ChalQ = {
  num: string;
  q: ReactNode;
  options: ReactNode[];
  correct: number;
  okMsg: ReactNode;
  noMsg: ReactNode;
};

const CHALLENGES: ChalQ[] = [
  {
    num: "문제 1",
    q: <>−36 의 제곱근을 모두 구하면?</>,
    options: ["① 6", <>② 6<I /></>, <>③ 6<I /> 와 −6<I /></>, "④ ±6"],
    correct: 2,
    okMsg: <>✅ 맞아요! −36 의 제곱근 → x² = −36 → x = ±6<I />, 두 개입니다.</>,
    noMsg: <>❌ −36 의 제곱근은 x² = −36 의 해이므로 6<I /> 와 −6<I />, 두 개입니다.</>,
  },
  {
    num: "문제 2",
    q: <><Sqrt>−3</Sqrt> × <Sqrt>−12</Sqrt> 를 계산하면?</>,
    options: ["① 6", "② −6", <>③ 6<I /></>, <>④ −6<I /></>],
    correct: 1,
    okMsg: <>✅ 정확! <Sqrt>−3</Sqrt> = <Sqrt>3</Sqrt><I />, <Sqrt>−12</Sqrt> = 2<Sqrt>3</Sqrt><I /> → <Sqrt>3</Sqrt><I /> · 2<Sqrt>3</Sqrt><I /> = 2 · 3 · <I />² = −6</>,
    noMsg: <>❌ <Sqrt>−3</Sqrt>·<Sqrt>−12</Sqrt> = <Sqrt>3</Sqrt><I /> · 2<Sqrt>3</Sqrt><I /> = 6<I />² = −6. 음수끼리는 부호가 뒤집혀요!</>,
  },
  {
    num: "문제 3",
    q: <><Sqrt>12</Sqrt> / <Sqrt>−3</Sqrt> 를 계산하면?</>,
    options: [<>① 2<I /></>, <>② −2<I /></>, "③ 2", "④ −2"],
    correct: 1,
    okMsg: (
      <>✅ 맞아요! <Sqrt>12</Sqrt> / <Sqrt>−3</Sqrt> = 2<Sqrt>3</Sqrt> / (<Sqrt>3</Sqrt>·<I />) = 2 / <I /> = 2<I /> / <I />² = −2<I /></>
    ),
    noMsg: (
      <>
        ❌ <Sqrt>−3</Sqrt> = <Sqrt>3</Sqrt>·<I /> 변환 후: 2<Sqrt>3</Sqrt> / (<Sqrt>3</Sqrt>·<I />) = 2 / <I /> → 분모 유리화하면 −2<I /> 입니다.
      </>
    ),
  },
  {
    num: "문제 4",
    q: <><Sqrt>−2</Sqrt> × <Sqrt>−8</Sqrt> + <Sqrt>−1</Sqrt> × <Sqrt>−9</Sqrt> 를 계산하면?</>,
    options: ["① 7", "② −7", "③ −1", "④ 1"],
    correct: 1,
    okMsg: (
      <>
        ✅ 정확! <Sqrt>−2</Sqrt>·<Sqrt>−8</Sqrt> = <Sqrt>2</Sqrt><I /> · 2<Sqrt>2</Sqrt><I /> = 4<I />² = −4, &nbsp; <Sqrt>−1</Sqrt>·<Sqrt>−9</Sqrt> = <I /> · 3<I />{" "}
        = −3 → 합 = −7
      </>
    ),
    noMsg: (
      <>
        ❌ 각각: <Sqrt>−2</Sqrt>·<Sqrt>−8</Sqrt> = −4, <Sqrt>−1</Sqrt>·<Sqrt>−9</Sqrt> = <I /> · 3<I /> = 3<I />² = −3. 합은 −7 이에요.
      </>
    ),
  },
  {
    num: "문제 5 (옳지 않은 것 찾기)",
    q: <>다음 중 옳지 않은 것은?</>,
    options: [
      <>① <Sqrt>−4</Sqrt> = 2<I /></>,
      <>② −9 의 제곱근은 3<I /> 와 −3<I /> 이다</>,
      <>③ <Sqrt>−2</Sqrt> × <Sqrt>−3</Sqrt> = <Sqrt>6</Sqrt></>,
      <>④ <Sqrt>6</Sqrt> / <Sqrt>−2</Sqrt> = −<Sqrt>3</Sqrt>·<I /></>,
    ],
    correct: 2,
    okMsg: (
      <>
        ✅ 찾았어요! <Sqrt>−2</Sqrt>·<Sqrt>−3</Sqrt> = <Sqrt>2</Sqrt><I /> · <Sqrt>3</Sqrt><I /> = <Sqrt>6</Sqrt> · <I />² = −<Sqrt>6</Sqrt>. <Sqrt>6</Sqrt> 이 아닙니다!
      </>
    ),
    noMsg: (
      <>
        ❌ ①②④ 는 모두 옳습니다. ③ 이 틀렸어요: <Sqrt>−2</Sqrt>·<Sqrt>−3</Sqrt> = −<Sqrt>6</Sqrt> 이어야 해요.
      </>
    ),
  },
];

function Tab4Challenge() {
  const [picked, setPicked] = useState<(number | null)[]>(() => CHALLENGES.map(() => null));

  function pick(qi: number, oi: number) {
    setPicked((arr) => {
      if (arr[qi] !== null) return arr;
      const n = [...arr];
      n[qi] = oi;
      return n;
    });
  }

  function reset() {
    setPicked(CHALLENGES.map(() => null));
  }

  const score = picked.filter((p, i) => p === CHALLENGES[i].correct).length;
  const allDone = picked.every((p) => p !== null);

  const completeMsg =
    score === 5
      ? "🏆 완벽한 점수! 음수의 제곱근 함정을 완전히 정복했어요!"
      : score === 4
      ? "🥈 훌륭해요! 거의 다 왔어요. 틀린 문제를 한 번 더 확인해 보세요."
      : score === 3
      ? "👍 좋아요! 함정 탐구 탭을 다시 보며 개념을 다져보세요."
      : score === 2
      ? "💪 조금 더 연습이 필요해요. 탐구 탭부터 다시 복습해 봐요!"
      : score === 1
      ? "📚 음수의 제곱근 변환부터 차근차근 다시 해봐요."
      : "🔄 탭 1 부터 다시 탐구해 보면 잘 이해될 거예요!";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-violet-400/40 bg-violet-400/10 px-4 py-3">
        <span className="text-sm font-bold text-violet-100">🎯 맞힌 문제</span>
        <span className="font-mono text-lg font-extrabold text-violet-50">{score} / 5</span>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200 hover:bg-white/10"
        >
          ↻ 초기화
        </button>
      </div>

      <div className="space-y-3">
        {CHALLENGES.map((c, qi) => {
          const cur = picked[qi];
          const done = cur !== null;
          const correctAfter = done && cur === c.correct;
          return (
            <div key={qi} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold text-slate-400">{c.num}</p>
              <p className="mt-1 text-sm font-bold text-slate-100">{c.q}</p>
              <div className="mt-3 grid gap-2">
                {c.options.map((opt, oi) => {
                  const isAns = oi === c.correct;
                  const isChosen = cur === oi;
                  const showCorrect = done && isAns;
                  const showWrong = isChosen && !isAns;
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={done}
                      onClick={() => pick(qi, oi)}
                      className={
                        "rounded-xl border-2 px-3 py-2 text-left text-sm font-bold transition disabled:cursor-default " +
                        (showCorrect
                          ? "border-emerald-400 bg-emerald-400/20 text-emerald-100 ring-2 ring-emerald-300/55"
                          : showWrong
                          ? "border-rose-400 bg-rose-400/20 text-rose-100 ring-2 ring-rose-300/55"
                          : "border-white/10 bg-white/5 text-slate-100 hover:border-violet-400/45 hover:bg-violet-400/10")
                      }
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {done ? (
                <p
                  className={
                    "mt-3 text-xs font-bold leading-6 " +
                    (correctAfter ? "text-emerald-200" : "text-rose-200")
                  }
                >
                  {correctAfter ? c.okMsg : c.noMsg}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {allDone ? (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-5 text-center">
          <p className="text-lg font-extrabold text-emerald-100">🎉 모든 문제 완료!</p>
          <p className="mt-1 text-sm leading-7 text-emerald-100/85">{completeMsg}</p>
        </div>
      ) : null}
    </div>
  );
}
