"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "conj_reason",
    prompt:
      "실수 계수 이차방정식에서 한 근이 p + qi (q ≠ 0) 일 때, 다른 한 근이 반드시 p − qi 가 되는 이유를, ‘복소수의 상등 조건’ 과 연결하여 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 실수 계수 이차방정식에 x = p + qi 를 대입하여 정리하면 (실수부) + (허수부)·i = 0 꼴이 된다. 복소수의 상등 조건에 따라 실수부 = 0 이고 허수부 = 0 이어야 한다. 이 두 조건이 만족된 채로 q 의 부호만 바꿔 x = p − qi 를 대입하면, 실수부 조건은 그대로이고 허수부 조건도 부호가 한 번 더 뒤집혀 결국 0 이 되므로 p − qi 도 근이 된다.",
  },
  {
    id: "coef_condition",
    prompt:
      "무리수 켤레근 법칙 (p + q√m ↔ p − q√m) 은 계수가 ‘유리수’ 일 때, 허수 켤레근 법칙 (p + qi ↔ p − qi) 은 계수가 ‘실수’ 일 때만 성립합니다. 조건이 깨지는 반례를 떠올리며, 계수의 조건이 왜 이렇게 중요한지 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 계수에 √2 가 들어간 방정식 x² − √2·x − 1 = 0 은 한 근이 √2 일 때 다른 한 근이 −√2 가 아닐 수 있다(켤레근 법칙이 무너짐). 마찬가지로 계수에 i 가 들어간 방정식 x² − i = 0 은 한 근이 (1+i)/√2 라도 다른 한 근이 (1−i)/√2 가 아닐 수 있다. 켤레근 법칙은 ‘계수가 실수/유리수라서, 대입 결과가 실수부·허수부(또는 유리수부·무리수부) 로 깔끔히 분리된다’ 는 사실에 기대고 있다.",
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

// ─── 수식 유틸 ──────────────────────────────────────────────
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}
function fmtFrac(n: number, d: number): string {
  if (d === 0) return "0";
  const rn = Math.round(n);
  const rd = Math.round(d);
  const g = gcd(Math.abs(rn), Math.abs(rd));
  const num = rn / g;
  const den = rd / g;
  if (den === 1) return String(num);
  if (den === -1) return String(-num);
  return `${num}/${den}`;
}
function isPerfectSquareInt(n: number): boolean {
  if (n < 0) return false;
  const r = Math.round(Math.sqrt(n));
  return r * r === n;
}
function simplifySqrt(D: number): { k: number; m: number } {
  let k = 1;
  for (let i = Math.floor(Math.sqrt(D)); i >= 2; i--) {
    if (D % (i * i) === 0) {
      k = i;
      break;
    }
  }
  return { k, m: D / (k * k) };
}

// ─── 메인 ───────────────────────────────────────────────────
type ScreenId = 1 | 2 | 3 | 4;

export default function ConjugateRootsExplorer() {
  const [screen, setScreen] = useState<ScreenId>(1);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* ─── 헤더 ─── */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🔮 켤레근 탐정단!</h3>
        <p className="mt-2 leading-7 text-slate-300">
          실수 계수 이차방정식의 켤레근(무리수·허수)이 생기는 이유를{" "}
          <b className="text-cyan-200">개념 탐구 → 대입 증명 → 퀴즈 → 역추적</b> 의 4 단계로
          이해해 봅시다.
        </p>
      </div>

      {/* 진행 바 */}
      <StepBar current={screen} />

      <div className={screen === 1 ? "mt-5" : "mt-5 hidden"}>
        <Screen1Concept onNext={() => setScreen(2)} />
      </div>
      <div className={screen === 2 ? "mt-5" : "mt-5 hidden"}>
        <Screen2Substitution onBack={() => setScreen(1)} onNext={() => setScreen(3)} />
      </div>
      <div className={screen === 3 ? "mt-5" : "mt-5 hidden"}>
        <Screen3Quiz onBack={() => setScreen(2)} onNext={() => setScreen(4)} />
      </div>
      <div className={screen === 4 ? "mt-5" : "mt-5 hidden"}>
        <Screen4Reverse onBack={() => setScreen(3)} />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function StepBar({ current }: { current: ScreenId }) {
  return (
    <div className="mt-5 flex gap-1.5">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={
            "h-1.5 flex-1 rounded-full " +
            (s < current
              ? "bg-violet-500/70"
              : s === current
              ? "bg-cyan-400"
              : "bg-white/10")
          }
        />
      ))}
    </div>
  );
}

// ─── 공통 — 네비 ───────────────────────────────────────────
function NavRow({
  label,
  onBack,
  onNext,
  nextLabel,
}: {
  label: string;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
      <div>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            ← 이전
          </button>
        ) : (
          <span />
        )}
      </div>
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <div>
        {onNext ? (
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
          >
            {nextLabel ?? "다음 →"}
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

function SecHeader({ icon, title, desc }: { icon: string; title: string; desc?: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-extrabold text-violet-200">
        {icon} {title}
      </p>
      {desc ? <p className="mt-1 text-sm leading-7 text-slate-300">{desc}</p> : null}
    </div>
  );
}

// ─── SCREEN 1 — 켤레근이란? + 계산기 ──────────────────────
function Screen1Concept({ onNext }: { onNext: () => void }) {
  const [a, setA] = useState("1");
  const [b, setB] = useState("-2");
  const [c, setC] = useState("5");

  const calc = useMemo(() => calcRoots(a, b, c), [a, b, c]);

  return (
    <div className="space-y-4">
      <SecHeader
        icon="🔍"
        title="켤레근이란?"
        desc={
          <>
            이차방정식의 두 근이 서로 <b>켤레 관계</b>에 있다는 건 무슨 뜻일까요?
            계수의 종류에 따라 두 가지 켤레근이 등장합니다.
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
          <span className="rounded-md border border-emerald-400/45 bg-emerald-400/15 px-2 py-0.5 text-xs font-bold text-emerald-100">
            유리수 계수
          </span>
          <p className="mt-2 text-base font-extrabold text-emerald-100">무리수 켤레근</p>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            한 근 = <b className="text-emerald-200">p + q<Sqrt>m</Sqrt></b>
            <br />↓<br />
            다른 근 = <b className="text-cyan-200">p − q<Sqrt>m</Sqrt></b>
          </p>
          <p className="mt-2 text-xs text-emerald-200/80">단, p · q 는 유리수, <Sqrt>m</Sqrt> 은 무리수</p>
        </div>
        <div className="rounded-2xl border border-violet-400/40 bg-violet-400/10 p-4">
          <span className="rounded-md border border-violet-400/45 bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-100">
            실수 계수
          </span>
          <p className="mt-2 text-base font-extrabold text-violet-100">허수 켤레근</p>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            한 근 = <b className="text-emerald-200">p + q<I /></b>
            <br />↓<br />
            다른 근 = <b className="text-cyan-200">p − q<I /></b>
          </p>
          <p className="mt-2 text-xs text-violet-200/80">단, p · q 는 실수, q ≠ 0</p>
        </div>
      </div>

      {/* 계산기 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-bold text-cyan-200">
          🧮 직접 확인해보기 — 계수를 바꿔가며 두 근의 관계를 관찰하세요
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm">a =</span>
          <CoeffInput value={a} onChange={setA} />
          <span className="font-mono text-sm">b =</span>
          <CoeffInput value={b} onChange={setB} />
          <span className="font-mono text-sm">c =</span>
          <CoeffInput value={c} onChange={setC} />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          예시 시도: b = −6, c = 2 (무리수 켤레근) / b = −2, c = 5 (허수 켤레근) / b = −5, c = 4 (유리수 근)
        </p>

        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-4">
          <RootResult calc={calc} />
        </div>
      </div>

      <NavRow label="1 / 4" onNext={onNext} nextLabel="다음: 왜 그럴까? →" />
    </div>
  );
}

function CoeffInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="이차방정식 계수"
      className="w-20 rounded-lg border-2 border-violet-400/40 bg-violet-400/10 px-2 py-1 text-center font-mono text-base font-bold text-violet-100 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-300/40"
    />
  );
}

type Calc =
  | { kind: "zero-a"; note: ReactNode }
  | { kind: "double"; eq: ReactNode; D: number; p: string }
  | { kind: "imag"; D: number; p: string; q: string }
  | { kind: "rational"; D: number; r1: string; r2: string }
  | { kind: "irrational"; D: number; p: string; qStr: string; m: number };

function calcRoots(aStr: string, bStr: string, cStr: string): Calc {
  const a = Number(aStr);
  const b = Number(bStr);
  const c = Number(cStr);
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c) || a === 0) {
    return {
      kind: "zero-a",
      note: <>a ≠ 0 인 정수 계수를 입력해 주세요. (현재 a = {aStr || "?"})</>,
    };
  }
  const D = b * b - 4 * a * c;
  if (D === 0) {
    return {
      kind: "double",
      eq: <>중근</>,
      D,
      p: fmtFrac(-b, 2 * a),
    };
  }
  if (D < 0) {
    const { k, m } = simplifySqrt(-D);
    return {
      kind: "imag",
      D,
      p: fmtFrac(-b, 2 * a),
      q: m === 1 ? fmtFrac(k, 2 * Math.abs(a)) : `${fmtFrac(k, 2 * Math.abs(a))}·√${m}`,
    };
  }
  if (isPerfectSquareInt(D)) {
    const s = Math.round(Math.sqrt(D));
    return {
      kind: "rational",
      D,
      r1: fmtFrac(-b + s, 2 * a),
      r2: fmtFrac(-b - s, 2 * a),
    };
  }
  const { k, m } = simplifySqrt(D);
  return {
    kind: "irrational",
    D,
    p: fmtFrac(-b, 2 * a),
    qStr: fmtFrac(k, 2 * Math.abs(a)),
    m,
  };
}

function RootResult({ calc }: { calc: Calc }) {
  if (calc.kind === "zero-a") {
    return <p className="text-sm text-amber-200">{calc.note}</p>;
  }
  return (
    <>
      <p className="text-xs text-slate-400">
        판별식 <em>D</em> = b² − 4ac ={" "}
        <b className="text-amber-200 font-mono">{calc.D}</b>
      </p>
      <div className="mt-2 text-sm leading-7 text-slate-100">
        {calc.kind === "double" ? (
          <>
            D = 0 → <b className="text-violet-200">중근</b>:{" "}
            <span className="font-mono text-base text-cyan-100">{calc.p}</span>
            <p className="mt-1 text-xs text-slate-400">(두 근이 같으므로 켤레 관계 없음)</p>
          </>
        ) : calc.kind === "imag" ? (
          <>
            <p className="text-xs text-violet-200">
              D &lt; 0 → <b>허수 켤레근</b>
            </p>
            <p className="mt-1 font-mono text-base">
              <span className="text-emerald-200">{calc.p} + {calc.q}<I /></span>{" "}
              &nbsp;와&nbsp;{" "}
              <span className="text-cyan-200">{calc.p} − {calc.q}<I /></span>
            </p>
            <div className="mt-3 rounded-lg border border-violet-400/30 bg-violet-400/10 p-2 text-xs leading-6 text-violet-100">
              ✨ 실수부 <b>{calc.p}</b> 는 같고, 허수부 부호만 반대입니다.
              <br />→ 두 근은 서로 <b>켤레복소수</b> 관계!
            </div>
          </>
        ) : calc.kind === "rational" ? (
          <>
            D &gt; 0, 완전제곱수 → <b className="text-cyan-200">유리수 근</b>:{" "}
            <span className="font-mono">{calc.r1}, {calc.r2}</span>
            <p className="mt-1 text-xs text-slate-400">
              두 근이 유리수이므로 켤레 무리수/복소수 관계는 해당 없음
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-emerald-200">
              D &gt; 0, 완전제곱수 아님 → <b>무리수 켤레근</b>
            </p>
            <p className="mt-1 font-mono text-base">
              <span className="text-emerald-200">
                {calc.p} + {calc.qStr === "1" ? "" : `${calc.qStr}·`}
                <Sqrt>{calc.m}</Sqrt>
              </span>{" "}
              &nbsp;와&nbsp;{" "}
              <span className="text-cyan-200">
                {calc.p} − {calc.qStr === "1" ? "" : `${calc.qStr}·`}
                <Sqrt>{calc.m}</Sqrt>
              </span>
            </p>
            <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-2 text-xs leading-6 text-emerald-100">
              ✨ 유리수 부분 <b>{calc.p}</b> 는 같고, 무리수 부분 부호만 반대입니다.
              <br />→ 두 근은 서로 <b>켤레 무리수</b> 관계!
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── SCREEN 2 — 대입 증명 ──────────────────────────────────
function Screen2Substitution({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [step, setStep] = useState(1);
  const done = step >= 3;

  return (
    <div className="space-y-4">
      <SecHeader
        icon="🔬"
        title="직접 대입해서 확인하기"
        desc={
          <>
            <span className="font-mono">x² − 2x + 5 = 0</span> 의 두 근{" "}
            <b className="text-emerald-200">1 + 2<I /></b> 와{" "}
            <b className="text-cyan-200">1 − 2<I /></b> 를 방정식에 직접 대입해 둘 다 근임을
            확인해 봅시다.
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <SubstitutionColumn
          accent="emerald"
          headerLabel={<>x = <b>1 + 2<I /></b> 대입</>}
          steps={STEPS_PLUS}
          shown={step}
        />
        <SubstitutionColumn
          accent="cyan"
          headerLabel={<>x = <b>1 − 2<I /></b> 대입</>}
          steps={STEPS_MINUS}
          shown={step}
        />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setStep((s) => Math.min(s + 1, 3))}
          disabled={done}
          className={
            "rounded-xl px-5 py-2 text-sm font-bold transition disabled:cursor-default " +
            (done
              ? "border-2 border-emerald-400/55 bg-emerald-400/15 text-emerald-200"
              : "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110")
          }
        >
          {done ? "✅ 모든 단계 완료!" : "▶ 다음 단계 보기"}
        </button>
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="ml-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
          >
            ↻ 처음부터
          </button>
        ) : null}
      </div>

      {done ? (
        <>
          <div className="rounded-2xl border border-amber-400/35 bg-amber-400/5 p-4">
            <p className="text-sm font-extrabold text-amber-200">💡 핵심 발견!</p>
            <p className="mt-1 text-sm leading-7 text-slate-100">
              두 근 <b className="text-emerald-200">1 + 2<I /></b> 와{" "}
              <b className="text-cyan-200">1 − 2<I /></b> 는 실수부(<b className="text-emerald-200">1</b>)
              가 <b>같고</b>, 허수부(<b className="text-violet-200">2</b>) 는{" "}
              <b>부호만 반대</b>입니다.
              <br />
              그래서 실수부끼리는 그대로 0 이 되고, 허수부끼리는 +4<I /> 와 −4<I /> 가 상쇄되어
              역시 0 이 됩니다.
              <br />→ <b>켤레복소수는 ‘실수부 동일 + 허수부 부호 반대’ 구조 때문에 항상 함께
              나타납니다!</b>
            </p>
          </div>
          <div className="rounded-2xl border border-violet-400/35 bg-violet-400/5 p-4">
            <p className="text-sm font-extrabold text-violet-200">📐 일반화</p>
            <p className="mt-1 text-sm leading-7 text-slate-100">
              <b>실수 계수</b> ax² + bx + c = 0 에 x = p + q<I /> 를 대입하면
              <br />
              실수부 조건:{" "}
              <span className="font-mono text-emerald-200">ap² − aq² + bp + c = 0</span>
              <br />
              허수부 조건:{" "}
              <span className="font-mono text-violet-200">2apq + bq = 0</span>
              <br />
              <br />이 두 조건이 만족될 때, x = p − q<I /> 를 대입하면 실수부는 똑같이 0, 허수부는{" "}
              <b>부호만 반대</b> 라 역시 0.
              <br />→ <b>켤레복소수는 항상 쌍으로 근이 됩니다.</b>
            </p>
          </div>
        </>
      ) : null}

      <NavRow label="2 / 4" onBack={onBack} onNext={onNext} nextLabel="다음: 퀴즈 →" />
    </div>
  );
}

type Step = { label: string; eqs: ReactNode[]; final?: boolean };
const STEPS_PLUS: Step[] = [
  {
    label: "STEP 1 — x² 계산",
    eqs: [
      <>(1 + 2<I />)²</>,
      <>= 1 + 4<I /> + 4<I />²</>,
      <>= 1 + 4<I /> + 4·(−1)</>,
      <>= <span className="text-emerald-200 font-bold">−3</span> + <span className="text-violet-200 font-bold">4<I /></span></>,
    ],
  },
  {
    label: "STEP 2 — −2x 계산",
    eqs: [
      <>−2(1 + 2<I />)</>,
      <>= <span className="text-emerald-200 font-bold">−2</span> <span className="text-violet-200 font-bold">−4<I /></span></>,
    ],
  },
  {
    label: "STEP 3 — 합산 (+5 포함)",
    eqs: [
      <>(<span className="text-emerald-200 font-bold">−3</span> + <span className="text-violet-200 font-bold">4<I /></span>) + (<span className="text-emerald-200 font-bold">−2</span><span className="text-violet-200 font-bold">−4<I /></span>) + <span className="text-emerald-200 font-bold">5</span></>,
      <>= (<span className="text-emerald-200 font-bold">−3 − 2 + 5</span>) + (<span className="text-violet-200 font-bold">4 − 4</span>)<I /></>,
      <>= 0 + 0·<I /> = <b>0 ✓</b></>,
    ],
    final: true,
  },
];
const STEPS_MINUS: Step[] = [
  {
    label: "STEP 1 — x² 계산",
    eqs: [
      <>(1 − 2<I />)²</>,
      <>= 1 − 4<I /> + 4<I />²</>,
      <>= 1 − 4<I /> + 4·(−1)</>,
      <>= <span className="text-emerald-200 font-bold">−3</span> <span className="text-violet-200 font-bold">−4<I /></span></>,
    ],
  },
  {
    label: "STEP 2 — −2x 계산",
    eqs: [
      <>−2(1 − 2<I />)</>,
      <>= <span className="text-emerald-200 font-bold">−2</span> + <span className="text-violet-200 font-bold">4<I /></span></>,
    ],
  },
  {
    label: "STEP 3 — 합산 (+5 포함)",
    eqs: [
      <>(<span className="text-emerald-200 font-bold">−3</span><span className="text-violet-200 font-bold">−4<I /></span>) + (<span className="text-emerald-200 font-bold">−2</span> + <span className="text-violet-200 font-bold">4<I /></span>) + <span className="text-emerald-200 font-bold">5</span></>,
      <>= (<span className="text-emerald-200 font-bold">−3 − 2 + 5</span>) + (<span className="text-violet-200 font-bold">−4 + 4</span>)<I /></>,
      <>= 0 + 0·<I /> = <b>0 ✓</b></>,
    ],
    final: true,
  },
];

function SubstitutionColumn({
  accent,
  headerLabel,
  steps,
  shown,
}: {
  accent: "emerald" | "cyan";
  headerLabel: ReactNode;
  steps: Step[];
  shown: number;
}) {
  const titleCls = accent === "emerald" ? "text-emerald-200" : "text-cyan-200";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className={"text-sm font-extrabold " + titleCls}>{headerLabel}</p>
      <div className="mt-3 space-y-3">
        {steps.map((s, i) => {
          const visible = i < shown;
          return (
            <div
              key={i}
              className={
                "rounded-xl border px-3 py-2 transition " +
                (visible
                  ? "border-violet-400/35 bg-violet-400/5"
                  : "border-white/10 bg-white/[0.03] opacity-40")
              }
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300">
                {s.label}
              </p>
              <div className="mt-1 space-y-0.5 font-mono text-sm leading-7 text-amber-100">
                {s.eqs.map((eq, j) => (
                  <div key={j} className={s.final && j === s.eqs.length - 1 ? "font-extrabold text-emerald-300" : ""}>
                    {eq}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SCREEN 3 — 퀴즈 ───────────────────────────────────────
type QQ = { eq: ReactNode; given: ReactNode; choices: ReactNode[]; ans: number; tip: ReactNode };

const QUIZ: QQ[] = [
  {
    eq: <>x² − 4x + 13 = 0</>,
    given: <>한 근: <b className="text-emerald-200">2 + 3<I /></b></>,
    choices: [<>2 − 3<I /></>, <>−2 + 3<I /></>, <>2 + 3<I /></>],
    ans: 0,
    tip: (
      <>
        실수 계수 이차방정식의 허수근은 켤레복소수 쌍으로 나타납니다. 실수부(2) 는 그대로, 허수부
        부호만 반전!
      </>
    ),
  },
  {
    eq: <>x² − 6x + 2 = 0</>,
    given: <>한 근: <b className="text-emerald-200">3 + <Sqrt>7</Sqrt></b></>,
    choices: [<>3 − <Sqrt>7</Sqrt></>, <>−3 + <Sqrt>7</Sqrt></>, <>3 + <Sqrt>7</Sqrt></>],
    ans: 0,
    tip: (
      <>
        유리수 계수 → 무리수 켤레근 법칙. 유리수 부분(3) 은 그대로, 무리수 부분 부호만 반전!
      </>
    ),
  },
  {
    eq: <>x² + 2x + 5 = 0</>,
    given: <>한 근: <b className="text-emerald-200">−1 + 2<I /></b></>,
    choices: [<>1 − 2<I /></>, <>−1 − 2<I /></>, <>1 + 2<I /></>],
    ans: 1,
    tip: (
      <>
        실수부 −1 은 그대로, 허수부 +2<I /> 의 부호만 바뀌어 −1 − 2<I /> 가 켤레근.
      </>
    ),
  },
  {
    eq: <>x² − 8x + 11 = 0</>,
    given: <>한 근: <b className="text-emerald-200">4 + <Sqrt>5</Sqrt></b></>,
    choices: [<>4 − <Sqrt>5</Sqrt></>, <>−4 + <Sqrt>5</Sqrt></>, <>4 + <Sqrt>5</Sqrt></>],
    ans: 0,
    tip: (
      <>
        유리수 부분(4) 은 그대로, 무리수 부분(<Sqrt>5</Sqrt>) 의 부호만 바뀌어 4 − <Sqrt>5</Sqrt>{" "}
        가 켤레근.
      </>
    ),
  },
  {
    eq: <>x² + 4x + 29 = 0</>,
    given: <>한 근: <b className="text-emerald-200">−2 + 5<I /></b></>,
    choices: [<>2 + 5<I /></>, <>2 − 5<I /></>, <>−2 − 5<I /></>],
    ans: 2,
    tip: (
      <>
        실수부 −2 는 그대로, 허수부 +5<I /> 의 부호만 바뀌어 −2 − 5<I /> 가 켤레근.
      </>
    ),
  },
];

function Screen3Quiz({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => QUIZ.map(() => null));

  function pick(qi: number, oi: number) {
    setPicked((arr) => {
      if (arr[qi] !== null) return arr;
      const n = [...arr];
      n[qi] = oi;
      return n;
    });
  }
  function reset() {
    setPicked(QUIZ.map(() => null));
  }

  const score = picked.filter((p, i) => p === QUIZ[i].ans).length;
  const allDone = picked.every((p) => p !== null);

  return (
    <div className="space-y-4">
      <SecHeader
        icon="🎯"
        title="켤레근 맞추기 퀴즈"
        desc="이차방정식과 한 근이 주어졌을 때, 나머지 한 근을 골라 보세요."
      />

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <span className="text-sm font-bold text-violet-200">📊 점수</span>
        <span className="font-mono text-lg font-extrabold text-violet-50">{score} / {QUIZ.length}</span>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200 hover:bg-white/10"
        >
          ↻ 초기화
        </button>
      </div>

      <div className="space-y-3">
        {QUIZ.map((q, qi) => {
          const cur = picked[qi];
          const done = cur !== null;
          const correct = done && cur === q.ans;
          return (
            <div key={qi} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold text-slate-400">문제 {qi + 1} / {QUIZ.length}</p>
              <p className="mt-1 text-sm">
                <b>방정식:</b>{" "}
                <span className="font-mono">{q.eq}</span>
              </p>
              <p className="text-sm leading-7">{q.given}</p>
              <p className="mt-2 text-xs text-slate-400">다른 한 근은?</p>
              <div className="mt-2 flex flex-col gap-2">
                {q.choices.map((c, oi) => {
                  const isAns = oi === q.ans;
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
                      {c}
                    </button>
                  );
                })}
              </div>
              {done ? (
                <p
                  className={
                    "mt-2 text-xs font-bold leading-6 " +
                    (correct ? "text-emerald-200" : "text-rose-200")
                  }
                >
                  {correct ? "✅ 정답! " : "❌ 오답. "}
                  {q.tip}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {allDone ? (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-5 text-center">
          <p className="text-lg font-extrabold text-emerald-100">🎉 퀴즈 완료!</p>
          <p className="mt-1 text-2xl font-extrabold text-white">
            {score} / {QUIZ.length}
          </p>
          <p className="mt-2 text-sm text-emerald-100/85">
            {score === 5
              ? "완벽 정복! 🏆"
              : score === 4
              ? "훌륭해요! ⭐"
              : score === 3
              ? "잘 하고 있어요! 👍"
              : score === 2
              ? "조금 더 연습하면 잘 할 수 있어요! 📖"
              : "다시 한 번 도전해 봐요! 💪"}
          </p>
        </div>
      ) : null}

      <NavRow label="3 / 4" onBack={onBack} onNext={onNext} nextLabel="다음: 역추적 챌린지 →" />
    </div>
  );
}

// ─── SCREEN 4 — 역추적 ─────────────────────────────────────
type Reverse = {
  num: string;
  roots: ReactNode;
  hintSum: ReactNode;
  hintProd: ReactNode;
  ans: { b: number; c: number };
  solution: ReactNode;
};

const REVERSE: Reverse[] = [
  {
    num: "문제 1",
    roots: <><b className="text-emerald-200">1 + 2<I /></b> 와 <b className="text-cyan-200">1 − 2<I /></b></>,
    hintSum: <>두 근의 합: (1 + 2<I />) + (1 − 2<I />) = ?</>,
    hintProd: <>두 근의 곱: (1 + 2<I />)(1 − 2<I />) = 1² + 2² = ?</>,
    ans: { b: 2, c: 5 },
    solution: (
      <>
        합 = 2 → −b = 2 → <b>b = 2</b>, 곱 = 1² + 2² = 5 → <b>c = 5</b>
        <br />
        → x² − 2x + 5 = 0
      </>
    ),
  },
  {
    num: "문제 2",
    roots: <><b className="text-emerald-200">3 + <Sqrt>5</Sqrt></b> 와 <b className="text-cyan-200">3 − <Sqrt>5</Sqrt></b></>,
    hintSum: <>두 근의 합: (3 + <Sqrt>5</Sqrt>) + (3 − <Sqrt>5</Sqrt>) = ?</>,
    hintProd: <>두 근의 곱: (3 + <Sqrt>5</Sqrt>)(3 − <Sqrt>5</Sqrt>) = 3² − (<Sqrt>5</Sqrt>)² = 9 − 5 = ?</>,
    ans: { b: 6, c: 4 },
    solution: (
      <>
        합 = 6 → <b>b = 6</b>, 곱 = 9 − 5 = 4 → <b>c = 4</b>
        <br />
        → x² − 6x + 4 = 0
      </>
    ),
  },
];

function Screen4Reverse({ onBack }: { onBack: () => void }) {
  const [bv, setBv] = useState<string[]>(() => REVERSE.map(() => ""));
  const [cv, setCv] = useState<string[]>(() => REVERSE.map(() => ""));
  const [solved, setSolved] = useState<boolean[]>(() => REVERSE.map(() => false));
  const [errFlag, setErrFlag] = useState<boolean[]>(() => REVERSE.map(() => false));

  function setB(i: number, v: string) {
    setBv((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  }
  function setC(i: number, v: string) {
    setCv((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  }
  function check(i: number) {
    if (solved[i]) return;
    const b = Number(bv[i]);
    const c = Number(cv[i]);
    if (b === REVERSE[i].ans.b && c === REVERSE[i].ans.c) {
      setSolved((arr) => arr.map((x, idx) => (idx === i ? true : x)));
      setErrFlag((arr) => arr.map((x, idx) => (idx === i ? false : x)));
    } else {
      setErrFlag((arr) => arr.map((x, idx) => (idx === i ? true : x)));
      window.setTimeout(() => {
        setErrFlag((arr) => arr.map((x, idx) => (idx === i ? false : x)));
      }, 1400);
    }
  }

  const allDone = solved.every(Boolean);

  return (
    <div className="space-y-4">
      <SecHeader
        icon="🔄"
        title="역추적 챌린지"
        desc={
          <>
            두 켤레근이 주어졌을 때, 이차방정식을 완성하세요.
            <br />
            <span className="text-xs text-slate-400">
              힌트: 두 근의 합 = −b, 두 근의 곱 = c (최고차항 계수 1 일 때)
            </span>
          </>
        }
      />

      <div className="space-y-3">
        {REVERSE.map((r, i) => {
          const isSolved = solved[i];
          const isErr = errFlag[i];
          return (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold text-slate-400">📌 {r.num}</p>
              <p className="mt-1 text-sm leading-7 text-slate-100">
                두 근이 {r.roots} 인 이차방정식 (최고차항 계수 1) 을 구하세요.
              </p>
              <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/40 p-3 text-xs leading-7 text-slate-300">
                {r.hintSum} → x² 앞 계수가 1 이면 <b className="text-amber-200">−b = 합</b>
                <br />
                {r.hintProd} → <b className="text-amber-200">c = 곱</b>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-sm">
                <span>x² −</span>
                <BlankInput
                  value={bv[i]}
                  onChange={(v) => setB(i, v)}
                  status={isSolved ? "ok" : isErr ? "ng" : "neutral"}
                  ariaLabel="b 값"
                  disabled={isSolved}
                />
                <span>x +</span>
                <BlankInput
                  value={cv[i]}
                  onChange={(v) => setC(i, v)}
                  status={isSolved ? "ok" : isErr ? "ng" : "neutral"}
                  ariaLabel="c 값"
                  disabled={isSolved}
                />
                <span>= 0</span>
                <button
                  type="button"
                  onClick={() => check(i)}
                  disabled={isSolved}
                  className={
                    "ml-auto rounded-xl px-4 py-2 text-xs font-bold transition disabled:cursor-default " +
                    (isSolved
                      ? "border-2 border-emerald-400/55 bg-emerald-400/15 text-emerald-200"
                      : "bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:brightness-110")
                  }
                >
                  {isSolved ? "✅ 정답" : "확인"}
                </button>
              </div>
              {isSolved ? (
                <p className="mt-3 rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-2 text-xs leading-6 text-emerald-100">
                  ✅ 정답! {r.solution}
                </p>
              ) : isErr ? (
                <p className="mt-3 rounded-lg border border-rose-400/40 bg-rose-400/10 p-2 text-xs leading-6 text-rose-100">
                  ❌ 다시 시도. 위 힌트를 한 번 더 보고 합·곱을 계산해 보세요.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {allDone ? (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 text-center">
          <p className="text-2xl">🏆</p>
          <p className="mt-1 text-base font-extrabold text-amber-100">모든 챌린지 완료!</p>
          <p className="mt-2 text-sm leading-7 text-amber-100/85">
            켤레근이 항상 쌍으로 나타나는 이유와, 두 켤레근으로 방정식을 역추적하는 방법까지 완전
            정복했어요. 아래 성찰도 꼼꼼히 답해 보세요 💜
          </p>
        </div>
      ) : null}

      <NavRow label="4 / 4" onBack={onBack} />
    </div>
  );
}

function BlankInput({
  value,
  onChange,
  status,
  ariaLabel,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  status: "ok" | "ng" | "neutral";
  ariaLabel: string;
  disabled?: boolean;
}) {
  const cls =
    status === "ok"
      ? "border-emerald-400 bg-emerald-400/20 text-emerald-100"
      : status === "ng"
      ? "border-rose-400 bg-rose-400/20 text-rose-100"
      : "border-violet-400/40 bg-violet-400/10 text-violet-100";
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="?"
      aria-label={ariaLabel}
      disabled={disabled}
      className={
        "w-16 rounded-lg border-2 px-2 py-1 text-center font-mono text-base font-bold outline-none focus:ring-2 focus:ring-violet-300/40 disabled:opacity-90 " +
        cls
      }
    />
  );
}
