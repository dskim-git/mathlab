"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "vieta_reason",
    prompt:
      "이차방정식 ax² + bx + c = 0 의 두 근을 α, β 라 할 때, α + β 와 αβ 를 a, b, c 로 나타내고, 이 관계가 성립하는 이유를 인수분해 형태와 연결하여 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 양변을 a 로 나누면 x² + (b/a)x + (c/a) = 0. 두 근이 α, β 이면 인수분해로 (x − α)(x − β) = 0 인데 전개하면 x² − (α + β)x + αβ = 0. 같은 다항식이므로 계수 비교에서 α + β = −b/a, αβ = c/a 가 된다.",
  },
  {
    id: "reverse_make",
    prompt:
      "두 수 p, q 를 근으로 하고 x² 의 계수가 1 인 이차방정식을 만들 때, ‘두 근의 합’ 과 ‘두 근의 곱’ 이 각각 어떤 계수가 되는지 설명하고, 이것이 근과 계수의 관계와 어떻게 연결되는지 서술해 보세요.",
    kind: "text",
    placeholder:
      "예: 인수분해 (x − p)(x − q) = x² − (p + q)x + pq = 0. 두 근의 합 (p + q) 가 x 의 계수에 −부호를 붙여 들어가고, 두 근의 곱 (pq) 가 상수항에 그대로 들어간다. 이것은 근과 계수의 관계 α + β = −b/a (a = 1), αβ = c/a (a = 1) 와 정확히 같은 식이다.",
  },
];

// ─── 표기 헬퍼 ─────────────────────────────────────────────
function I() {
  return <em className="font-serif italic text-pink-300">i</em>;
}
function Sqrt({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap">
      √<span className="border-t border-current px-[1px]">{children}</span>
    </span>
  );
}

// ─── 분수 입력 파서 ────────────────────────────────────────
function normalizeFrac(input: string): number {
  const s = input.trim().replace(/\s/g, "").replace(/[−]/g, "-");
  const m = /^(-?\d+)\/(-?\d+)$/.exec(s);
  if (m) {
    const num = Number(m[1]);
    const den = Number(m[2]);
    if (den === 0) return NaN;
    return num / den;
  }
  return Number(s);
}

// ─── 메인 ───────────────────────────────────────────────────
type TabId = 0 | 1 | 2 | 3;
const TABS: { id: TabId; emoji: string; main: string; sub: string }[] = [
  { id: 0, emoji: "🔍", main: "1단계", sub: "비밀 발견" },
  { id: 1, emoji: "🧮", main: "2단계", sub: "계산 도장" },
  { id: 2, emoji: "🏗", main: "3단계", sub: "방정식 건축" },
  { id: 3, emoji: "⚡", main: "4단계", sub: "스피드 퀴즈" },
];

export default function VietaRootsGame() {
  const [tab, setTab] = useState<TabId>(0);
  const [done, setDone] = useState<boolean[]>(() => [false, false, false, false]);

  function markDone(i: TabId) {
    setDone((d) => {
      if (d[i]) return d;
      const n = [...d];
      n[i] = true;
      return n;
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* ─── 헤더 ─── */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🔑 근과 계수의 관계 탐정단</h3>
        <p className="mt-2 leading-7 text-slate-300">
          이차방정식의 두 근과 계수가 어떻게 연결되는지를 4 단계 — <b>비밀 발견 → 계산 도장 →
          방정식 건축 → 스피드 퀴즈</b> — 로 탐구해 봅시다.
        </p>
      </div>

      {/* 탭 바 */}
      <div className="mt-5 grid grid-cols-4 gap-2">
        {TABS.map((t) => {
          const active = tab === t.id;
          const isDone = done[t.id];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                "rounded-xl border-2 px-2 py-2 text-center text-xs font-bold transition " +
                (active
                  ? "border-cyan-400/60 bg-gradient-to-br from-cyan-400/15 to-violet-400/15 text-cyan-100"
                  : isDone
                  ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              <p className="text-sm">
                {t.emoji} {t.main}
                {isDone ? " ✓" : ""}
              </p>
              <p className="mt-0.5 text-[10px] font-normal opacity-80">{t.sub}</p>
            </button>
          );
        })}
      </div>

      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}>
        <Stage0Discovery onDone={() => markDone(0)} onNext={() => setTab(1)} />
      </div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <Stage1Calculation onDone={() => markDone(1)} onBack={() => setTab(0)} onNext={() => setTab(2)} />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <Stage2Building onDone={() => markDone(2)} onBack={() => setTab(1)} onNext={() => setTab(3)} />
      </div>
      <div className={tab === 3 ? "mt-5" : "mt-5 hidden"}>
        <Stage3Quiz onDone={() => markDone(3)} onBack={() => setTab(2)} />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 공통 — 셀션 헤더 + 네비 ───────────────────────────────
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

function NextBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="mt-4 flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
      >
        {label}
      </button>
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
    >
      ← 이전 단계
    </button>
  );
}

// ─── STAGE 0 — 비밀 발견 ───────────────────────────────────
const FACTOR_STEPS: { eq: ReactNode; final?: boolean }[] = [
  {
    eq: (
      <>
        <span className="text-violet-200">ax² + bx + c</span> = 0
      </>
    ),
  },
  {
    eq: (
      <>
        <span className="text-amber-200">a</span>
        <span className="text-slate-200">(</span>
        <span className="text-violet-200">x²</span> +{" "}
        <span className="text-amber-200">(b/a)</span>·x +{" "}
        <span className="text-amber-200">(c/a)</span>
        <span className="text-slate-200">) = 0</span>
      </>
    ),
  },
  {
    eq: (
      <>
        <span className="text-amber-200">a</span>(x − <span className="text-emerald-300">α</span>)(x −{" "}
        <span className="text-pink-300">β</span>) = 0
      </>
    ),
  },
  {
    eq: (
      <>
        <span className="text-amber-200">a</span>[ x² − (
        <span className="text-emerald-300">α</span> + <span className="text-pink-300">β</span>)x +{" "}
        <span className="text-emerald-300">α</span>
        <span className="text-pink-300">β</span> ] = 0
      </>
    ),
    final: true,
  },
];

function Stage0Discovery({ onDone, onNext }: { onDone: () => void; onNext: () => void }) {
  const [revealed, setRevealed] = useState(1); // first eq always shown
  const [sumStr, setSumStr] = useState("");
  const [prodStr, setProdStr] = useState("");
  const [sumOk, setSumOk] = useState(false);
  const [prodOk, setProdOk] = useState(false);
  const [sumFb, setSumFb] = useState<{ tone: "ok" | "ng"; msg: string } | null>(null);
  const [prodFb, setProdFb] = useState<{ tone: "ok" | "ng"; msg: string } | null>(null);

  function checkSum() {
    const v = normalizeFrac(sumStr);
    if (Math.abs(v - 1.5) < 0.01) {
      setSumOk(true);
      setSumFb({ tone: "ok", msg: "✅ 정확! α + β = −(−3)/2 = 3/2" });
    } else {
      setSumFb({ tone: "ng", msg: "❌ 다시 생각해 보세요. α + β = −b/a = −(−3)/2 = ?" });
    }
  }
  function checkProd() {
    const v = normalizeFrac(prodStr);
    if (Math.abs(v - -3) < 0.01) {
      setProdOk(true);
      setProdFb({ tone: "ok", msg: "✅ 맞아요! αβ = c/a = (−6)/2 = −3" });
    } else {
      setProdFb({ tone: "ng", msg: "❌ 다시 생각해 보세요. αβ = c/a = (−6)/2 = ?" });
    }
  }

  const both = sumOk && prodOk;
  useEffect(() => {
    if (sumOk && prodOk) onDone();
    // markDone 은 idempotent 이라 onDone 의존성 누락 안전
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sumOk, prodOk]);

  return (
    <div className="space-y-4">
      <SecHeader
        icon="🔍"
        title="이차방정식 속 숨겨진 비밀!"
        desc={
          <>
            두 근 α, β 가 방정식의 계수와 연결되어 있다? 인수분해 과정을 따라가며 비밀을 발견해
            봅시다.
          </>
        }
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
          🧩 인수분해로 비밀 찾기
        </p>
        <p className="mt-1 text-sm text-slate-300">
          이차방정식 <b className="text-violet-200">ax² + bx + c = 0</b> 의 두 근이 α, β 이면,
          인수분해하면 어떻게 될까요? 버튼을 눌러 단계별로 확인하세요.
        </p>
        <div className="mt-3 space-y-2">
          {FACTOR_STEPS.map((step, i) => {
            const shown = i < revealed;
            return (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={
                    "w-full rounded-xl border px-3 py-2 text-center font-mono text-base leading-7 transition " +
                    (shown
                      ? step.final
                        ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-50"
                        : "border-violet-400/30 bg-violet-400/5 text-slate-100"
                      : "border-white/10 bg-white/[0.03] opacity-30")
                  }
                >
                  {step.eq}
                </div>
                {i < FACTOR_STEPS.length - 1 ? (
                  <span
                    className={
                      "py-1 text-violet-300 transition " + (i + 1 < revealed ? "opacity-100" : "opacity-30")
                    }
                  >
                    ↓
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
        {revealed >= FACTOR_STEPS.length ? (
          <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm leading-7 text-emerald-100">
            ✅ <b>계수 비교 → 근과 계수의 관계 완성!</b>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-violet-400/40 bg-violet-400/10 px-3 py-2 text-center font-mono text-base text-violet-50">
                <span className="text-emerald-300">α + β</span> = −<span className="text-amber-200">b/a</span>
              </div>
              <div className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-center font-mono text-base text-cyan-50">
                <span className="text-emerald-300">αβ</span> = <span className="text-amber-200">c/a</span>
              </div>
            </div>
            <p className="mt-2 text-xs leading-6 text-emerald-200">
              두 근의 합 = −(x 의 계수)/(x² 의 계수) &nbsp;|&nbsp; 두 근의 곱 = (상수항)/(x² 의 계수)
            </p>
          </div>
        ) : (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setRevealed((r) => Math.min(r + 1, FACTOR_STEPS.length))}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
            >
              ▶ 다음 단계
            </button>
          </div>
        )}
      </div>

      {/* 직접 확인 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
          ✏️ 직접 확인해보기
        </p>
        <p className="mt-1 text-sm text-slate-300">
          이차방정식 <b className="text-amber-200">2x² − 3x − 6 = 0</b> 에서 a = 2, b = −3, c = −6
          일 때, 근과 계수의 관계로 두 근의 합과 곱을 구해 보세요.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <p className="font-mono text-sm text-slate-100">α + β = −b/a = −(?)/(?)</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-sm text-slate-400">α + β =</span>
              <input
                type="text"
                inputMode="decimal"
                value={sumStr}
                onChange={(e) => setSumStr(e.target.value)}
                placeholder="분수 (예: 3/2)"
                disabled={sumOk}
                aria-label="α + β 값"
                className={
                  "w-32 rounded-lg border-2 px-2 py-1 text-center font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-violet-300/40 disabled:opacity-90 " +
                  (sumOk
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-100"
                    : sumFb?.tone === "ng"
                    ? "border-rose-400 bg-rose-400/15 text-rose-100"
                    : "border-violet-400/40 bg-violet-400/10 text-violet-100")
                }
              />
              <button
                type="button"
                onClick={checkSum}
                disabled={sumOk}
                className="rounded-lg border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
              >
                확인
              </button>
            </div>
            {sumFb ? (
              <p
                className={
                  "mt-1 text-xs font-bold leading-6 " +
                  (sumFb.tone === "ok" ? "text-emerald-200" : "text-rose-200")
                }
              >
                {sumFb.msg}
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <p className="font-mono text-sm text-slate-100">αβ = c/a = (?)/(?)</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-sm text-slate-400">αβ =</span>
              <input
                type="text"
                inputMode="decimal"
                value={prodStr}
                onChange={(e) => setProdStr(e.target.value)}
                placeholder="값 (예: −3)"
                disabled={prodOk}
                aria-label="αβ 값"
                className={
                  "w-32 rounded-lg border-2 px-2 py-1 text-center font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-violet-300/40 disabled:opacity-90 " +
                  (prodOk
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-100"
                    : prodFb?.tone === "ng"
                    ? "border-rose-400 bg-rose-400/15 text-rose-100"
                    : "border-violet-400/40 bg-violet-400/10 text-violet-100")
                }
              />
              <button
                type="button"
                onClick={checkProd}
                disabled={prodOk}
                className="rounded-lg border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
              >
                확인
              </button>
            </div>
            {prodFb ? (
              <p
                className={
                  "mt-1 text-xs font-bold leading-6 " +
                  (prodFb.tone === "ok" ? "text-emerald-200" : "text-rose-200")
                }
              >
                {prodFb.msg}
              </p>
            ) : null}
          </div>
        </div>
        {both ? (
          <p className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-2 text-center text-sm font-bold leading-6 text-emerald-100">
            🎉 완벽! α + β = 3/2, αβ = −3 을 기억하세요. 2 단계에서 활용합니다.
          </p>
        ) : null}
      </div>

      {both ? <NextBtn label="2단계로 →" onClick={onNext} /> : null}
    </div>
  );
}

// ─── STAGE 1 — 계산 도장 ───────────────────────────────────
type CalcItem = {
  num: string;
  expr: ReactNode;
  hint: ReactNode;
  ans: number;
  ansStr: string;
  solution: string;
};

const CALC_ITEMS: CalcItem[] = [
  {
    num: "(1)",
    expr: <>(α + 1)(β + 1) = αβ + α + β + 1</>,
    hint: <>αβ + (α + β) + 1 = (−3) + (3/2) + 1 = ?</>,
    ans: -0.5,
    ansStr: "−1/2",
    solution: "αβ + (α + β) + 1 = (−3) + (3/2) + 1 = −3 + 5/2 = −1/2",
  },
  {
    num: "(2)",
    expr: <>β/α + α/β = (α² + β²)/(αβ) = [(α + β)² − 2αβ] / (αβ)</>,
    hint: (
      <>
        α² + β² = (α + β)² − 2αβ = (3/2)² − 2 × (−3) = 9/4 + 6 = 33/4
        <br />
        αβ = −3 이므로 (33/4) / (−3) = ?
      </>
    ),
    ans: -2.75,
    ansStr: "−11/4",
    solution: "(α² + β²)/(αβ) = [(3/2)² − 2 × (−3)] / (−3) = [9/4 + 6] / (−3) = (33/4) / (−3) = −11/4",
  },
  {
    num: "(3)",
    expr: <>(α − β)² = (α + β)² − 4αβ</>,
    hint: <>(3/2)² − 4 × (−3) = 9/4 + 12 = 9/4 + 48/4 = ?</>,
    ans: 14.25,
    ansStr: "57/4",
    solution: "(α + β)² − 4αβ = (3/2)² − 4 × (−3) = 9/4 + 12 = 57/4",
  },
  {
    num: "(4)",
    expr: <>α³ + β³ = (α + β)³ − 3αβ(α + β)</>,
    hint: <>(3/2)³ − 3 × (−3) × (3/2) = 27/8 + 27/2 = 27/8 + 108/8 = ?</>,
    ans: 16.875,
    ansStr: "135/8",
    solution: "(α + β)³ − 3αβ(α + β) = (3/2)³ − 3 × (−3) × (3/2) = 27/8 + 27/2 = 135/8",
  },
];

function Stage1Calculation({
  onDone,
  onBack,
  onNext,
}: {
  onDone: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<string[]>(() => CALC_ITEMS.map(() => ""));
  const [ok, setOk] = useState<boolean[]>(() => CALC_ITEMS.map(() => false));
  const [fb, setFb] = useState<({ tone: "ok" | "ng"; msg: string } | null)[]>(() =>
    CALC_ITEMS.map(() => null),
  );
  const [hint, setHint] = useState<boolean[]>(() => CALC_ITEMS.map(() => false));

  function setVal(i: number, v: string) {
    setPicked((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  }
  function check(i: number) {
    if (ok[i]) return;
    const v = normalizeFrac(picked[i]);
    const item = CALC_ITEMS[i];
    if (Math.abs(v - item.ans) < 0.02) {
      setOk((arr) => arr.map((x, idx) => (idx === i ? true : x)));
      setFb((arr) =>
        arr.map((x, idx) =>
          idx === i ? { tone: "ok", msg: `✅ 정답! ${item.ansStr} — ${item.solution}` } : x,
        ),
      );
    } else {
      setFb((arr) =>
        arr.map((x, idx) =>
          idx === i ? { tone: "ng", msg: "❌ 틀렸어요. 힌트를 참고해 다시 계산해 보세요!" } : x,
        ),
      );
    }
  }

  const allDone = ok.every(Boolean);
  useEffect(() => {
    if (allDone) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  return (
    <div className="space-y-4">
      <SecHeader
        icon="🧮"
        title="계산 도장 깨기!"
        desc={
          <>
            <b className="text-amber-200">2x² − 3x − 6 = 0</b> 의 두 근 α, β 에 대해{" "}
            <b className="text-cyan-200">α + β = 3/2, αβ = −3</b> 을 이용해 아래 식을 구하세요.
          </>
        }
      />

      <div className="space-y-3">
        {CALC_ITEMS.map((item, i) => {
          const f = fb[i];
          return (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold text-violet-300">📌 {item.num}</p>
              <p className="mt-1 rounded-lg border border-violet-400/30 bg-violet-400/5 px-3 py-2 font-mono text-sm leading-7 text-slate-100">
                {item.expr}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHint((arr) => arr.map((x, idx) => (idx === i ? !x : x)))}
                  className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-100 hover:bg-amber-400/20"
                >
                  💡 힌트 {hint[i] ? "숨기기" : "보기"}
                </button>
              </div>
              {hint[i] ? (
                <p className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/5 p-2 text-xs leading-6 text-amber-100">
                  {item.hint}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm text-slate-300">{item.num.replace(/[()]/g, "")} 답 =</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={picked[i]}
                  onChange={(e) => setVal(i, e.target.value)}
                  placeholder="분수 (예: −1/2)"
                  disabled={ok[i]}
                  aria-label={`${item.num} 답`}
                  className={
                    "w-36 rounded-lg border-2 px-2 py-1 text-center font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-violet-300/40 disabled:opacity-90 " +
                    (ok[i]
                      ? "border-emerald-400 bg-emerald-400/20 text-emerald-100"
                      : f?.tone === "ng"
                      ? "border-rose-400 bg-rose-400/15 text-rose-100"
                      : "border-violet-400/40 bg-violet-400/10 text-violet-100")
                  }
                />
                <button
                  type="button"
                  onClick={() => check(i)}
                  disabled={ok[i]}
                  className="rounded-lg border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
                >
                  확인
                </button>
              </div>
              {f ? (
                <p
                  className={
                    "mt-2 text-xs font-bold leading-6 " +
                    (f.tone === "ok" ? "text-emerald-200" : "text-rose-200")
                  }
                >
                  {f.msg}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {allDone ? (
        <p className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-center text-sm font-bold leading-6 text-emerald-100">
          🎉 4문제 모두 풀었어요! 근과 계수의 관계로 직접 근을 구하지 않아도 답이 나오네요!
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <BackBtn onClick={onBack} />
        {allDone ? (
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
          >
            3단계로 →
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

// ─── STAGE 2 — 방정식 건축 ─────────────────────────────────
type MakeItem = {
  num: string;
  roots: ReactNode;
  hint: ReactNode;
  ans: { s: number; p: number };
  explain: ReactNode;
};

const MAKE_ITEMS: MakeItem[] = [
  {
    num: "문제 1",
    roots: <><b className="text-emerald-200">−4</b> 와 <b className="text-cyan-200">3</b></>,
    hint: <>합: (−4) + 3 = <b className="text-amber-200">?</b> &nbsp;|&nbsp; 곱: (−4) × 3 = <b className="text-emerald-300">?</b></>,
    ans: { s: -1, p: -12 },
    explain: (
      <>
        합 = −1, 곱 = −12 → x² − (−1)x + (−12) = 0, 즉 <b>x² + x − 12 = 0</b>
      </>
    ),
  },
  {
    num: "문제 2",
    roots: <><b className="text-emerald-200">2 + <Sqrt>5</Sqrt></b> 와 <b className="text-cyan-200">2 − <Sqrt>5</Sqrt></b></>,
    hint: <>합: (2 + <Sqrt>5</Sqrt>) + (2 − <Sqrt>5</Sqrt>) = <b className="text-amber-200">?</b> &nbsp;|&nbsp; 곱: (2 + <Sqrt>5</Sqrt>)(2 − <Sqrt>5</Sqrt>) = 4 − 5 = <b className="text-emerald-300">?</b></>,
    ans: { s: 4, p: -1 },
    explain: (
      <>
        합 = 4, 곱 = −1 → x² − 4x + (−1) = 0, 즉 <b>x² − 4x − 1 = 0</b>
      </>
    ),
  },
  {
    num: "문제 3",
    roots: <><b className="text-emerald-200">1 + 3<I /></b> 와 <b className="text-cyan-200">1 − 3<I /></b></>,
    hint: <>합: (1 + 3<I />) + (1 − 3<I />) = <b className="text-amber-200">?</b> &nbsp;|&nbsp; 곱: (1 + 3<I />)(1 − 3<I />) = 1 + 9 = <b className="text-emerald-300">?</b></>,
    ans: { s: 2, p: 10 },
    explain: (
      <>
        합 = 2, 곱 = 10 → <b>x² − 2x + 10 = 0</b>
      </>
    ),
  },
];

function Stage2Building({
  onDone,
  onBack,
  onNext,
}: {
  onDone: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [sv, setSv] = useState<string[]>(() => MAKE_ITEMS.map(() => ""));
  const [pv, setPv] = useState<string[]>(() => MAKE_ITEMS.map(() => ""));
  const [ok, setOk] = useState<boolean[]>(() => MAKE_ITEMS.map(() => false));
  const [errFlag, setErrFlag] = useState<boolean[]>(() => MAKE_ITEMS.map(() => false));

  function setS(i: number, v: string) {
    setSv((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  }
  function setP(i: number, v: string) {
    setPv((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  }
  function check(i: number) {
    if (ok[i]) return;
    const sNum = Number(sv[i]);
    const pNum = Number(pv[i]);
    const ans = MAKE_ITEMS[i].ans;
    if (sNum === ans.s && pNum === ans.p) {
      setOk((arr) => arr.map((x, idx) => (idx === i ? true : x)));
      setErrFlag((arr) => arr.map((x, idx) => (idx === i ? false : x)));
    } else {
      setErrFlag((arr) => arr.map((x, idx) => (idx === i ? true : x)));
      window.setTimeout(() => {
        setErrFlag((arr) => arr.map((x, idx) => (idx === i ? false : x)));
      }, 1400);
    }
  }

  const allDone = ok.every(Boolean);
  useEffect(() => {
    if (allDone) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  return (
    <div className="space-y-4">
      <SecHeader
        icon="🏗"
        title="방정식 건축가!"
        desc={
          <>
            이번엔 역방향! 두 수가 주어졌을 때{" "}
            <b className="text-violet-200">x² − (두 근의 합)x + (두 근의 곱) = 0</b> 공식을
            이용해 이차방정식을 완성하세요.
          </>
        }
      />

      <div className="rounded-2xl border border-violet-400/40 bg-violet-400/10 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-300">📐 공식 정리</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-2 text-center text-sm">
            두 근의 합 = <b className="text-amber-200">S</b> = α + β
          </div>
          <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-2 text-center text-sm">
            두 근의 곱 = <b className="text-emerald-200">P</b> = αβ
          </div>
        </div>
        <p className="mt-3 rounded-lg border border-cyan-400/40 bg-cyan-400/10 p-2 text-center font-mono text-base font-extrabold text-cyan-50">
          x² − <span className="text-amber-200">S</span>x + <span className="text-emerald-200">P</span> = 0
        </p>
      </div>

      <div className="space-y-3">
        {MAKE_ITEMS.map((m, i) => {
          const isOk = ok[i];
          const isErr = errFlag[i];
          return (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold text-slate-400">📌 {m.num}</p>
              <p className="mt-1 text-sm leading-7 text-slate-100">
                두 수 {m.roots} 를 근으로 하고 x² 의 계수가 1 인 이차방정식
              </p>
              <p className="mt-2 rounded-lg border border-white/10 bg-slate-950/40 p-2 text-xs leading-6 text-slate-300">
                {m.hint}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-sm">
                <span>x² − (</span>
                <input
                  type="number"
                  value={sv[i]}
                  onChange={(e) => setS(i, e.target.value)}
                  placeholder="S"
                  disabled={isOk}
                  aria-label={`${m.num} S 값`}
                  className={
                    "w-16 rounded-lg border-2 px-2 py-1 text-center font-mono text-base font-bold outline-none focus:ring-2 focus:ring-violet-300/40 disabled:opacity-90 " +
                    (isOk
                      ? "border-emerald-400 bg-emerald-400/20 text-emerald-100"
                      : isErr
                      ? "border-rose-400 bg-rose-400/20 text-rose-100"
                      : "border-amber-400/40 bg-amber-400/10 text-amber-100")
                  }
                />
                <span>)x + (</span>
                <input
                  type="number"
                  value={pv[i]}
                  onChange={(e) => setP(i, e.target.value)}
                  placeholder="P"
                  disabled={isOk}
                  aria-label={`${m.num} P 값`}
                  className={
                    "w-16 rounded-lg border-2 px-2 py-1 text-center font-mono text-base font-bold outline-none focus:ring-2 focus:ring-violet-300/40 disabled:opacity-90 " +
                    (isOk
                      ? "border-emerald-400 bg-emerald-400/20 text-emerald-100"
                      : isErr
                      ? "border-rose-400 bg-rose-400/20 text-rose-100"
                      : "border-emerald-400/40 bg-emerald-400/10 text-emerald-100")
                  }
                />
                <span>) = 0</span>
                <button
                  type="button"
                  onClick={() => check(i)}
                  disabled={isOk}
                  className={
                    "ml-auto rounded-xl px-4 py-2 text-xs font-bold transition disabled:cursor-default " +
                    (isOk
                      ? "border-2 border-emerald-400/55 bg-emerald-400/15 text-emerald-200"
                      : "bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:brightness-110")
                  }
                >
                  {isOk ? "✅ 정답" : "확인"}
                </button>
              </div>
              {isOk ? (
                <p className="mt-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-2 text-xs leading-6 text-emerald-100">
                  ✅ 정확! {m.explain}
                </p>
              ) : isErr ? (
                <p className="mt-2 rounded-lg border border-rose-400/40 bg-rose-400/10 p-2 text-xs leading-6 text-rose-100">
                  ❌ 다시 계산해 보세요. S (합) 과 P (곱) 를 먼저 구해 보세요.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {allDone ? (
        <p className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-center text-sm font-bold leading-6 text-emerald-100">
          🏆 3 문제 모두 완성! 이제 두 근 → 방정식을 자유자재로 만들 수 있어요!
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <BackBtn onClick={onBack} />
        {allDone ? (
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
          >
            마지막 퀴즈 →
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

// ─── STAGE 3 — 스피드 퀴즈 ─────────────────────────────────
type QuizQ = { q: ReactNode; choices: ReactNode[]; ans: number; tip: ReactNode };

const QUIZ: QuizQ[] = [
  {
    q: <>이차방정식 x² − 5x + 6 = 0 의 두 근을 α, β 라 할 때, α + β 의 값은?</>,
    choices: ["5", "−5", "6", "−6"],
    ans: 0,
    tip: <>근과 계수의 관계: α + β = −b/a = −(−5)/1 = <b>5</b></>,
  },
  {
    q: <>이차방정식 3x² + 6x − 9 = 0 의 두 근의 곱 (αβ) 은?</>,
    choices: ["−3", "3", "−2", "2"],
    ans: 0,
    tip: <>αβ = c/a = (−9)/3 = <b>−3</b></>,
  },
  {
    q: <>두 수 −2 와 5 를 근으로 하는 이차방정식 (x² 의 계수 = 1) 은?</>,
    choices: ["x² − 3x − 10 = 0", "x² + 3x − 10 = 0", "x² − 3x + 10 = 0", "x² + 3x + 10 = 0"],
    ans: 0,
    tip: <>합: (−2) + 5 = 3, 곱: (−2) × 5 = −10 → x² − 3x + (−10) = 0, 즉 <b>x² − 3x − 10 = 0</b></>,
  },
  {
    q: <>x² + 4x + 1 = 0 의 두 근 α, β 에 대해 α² + β² 의 값은?</>,
    choices: ["14", "16", "18", "20"],
    ans: 0,
    tip: <>α + β = −4, αβ = 1 → α² + β² = (α + β)² − 2αβ = 16 − 2 = <b>14</b></>,
  },
  {
    q: <>두 수 3 + <I /> 와 3 − <I /> 를 근으로 하는 이차방정식 (x² 의 계수 = 1) 에서 상수항은?</>,
    choices: ["10", "9", "8", "6"],
    ans: 0,
    tip: <>곱: (3 + <I />)(3 − <I />) = 9 + 1 = <b>10</b> → 상수항 = αβ = 10</>,
  },
];

function Stage3Quiz({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
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
  const answered = picked.filter((p) => p !== null).length;
  const allDone = answered === QUIZ.length;
  useEffect(() => {
    if (allDone) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  const pct = Math.round((score / QUIZ.length) * 100);
  const msg =
    pct === 100
      ? "🌟 완벽한 점수! 근과 계수의 관계 마스터!"
      : pct >= 80
      ? "🎉 훌륭해요! 거의 다 맞췄어요."
      : pct >= 60
      ? "👍 잘했어요! 틀린 부분을 복습해 봐요."
      : "💪 다시 도전해 봐요!";

  return (
    <div className="space-y-4">
      <SecHeader icon="⚡" title="스피드 퀴즈!" desc="배운 내용을 총정리해 봐요. 각 문제를 빠르게 맞춰 보세요." />

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <span className="text-xs text-slate-400">진행도</span>
        <svg
          viewBox="0 0 100 4"
          preserveAspectRatio="none"
          className="h-2 flex-1"
          role="img"
          aria-label={`진행도 ${answered} / ${QUIZ.length}`}
        >
          <defs>
            <linearGradient id="vrgProgGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
          <rect x="0" y="0" width={(answered / QUIZ.length) * 100} height="4" rx="2" fill="url(#vrgProgGrad)" />
        </svg>
        <span className="font-mono text-sm font-extrabold text-cyan-100">
          {score} / {QUIZ.length}
        </span>
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
              <p className="text-xs font-bold text-slate-400">📌 문제 {qi + 1} / {QUIZ.length}</p>
              <p className="mt-1 text-sm leading-7 text-slate-100">{q.q}</p>
              <div className="mt-3 grid gap-2">
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
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 text-center">
          <p className="text-3xl">⭐</p>
          <p className="mt-1 text-lg font-extrabold text-amber-100">{msg}</p>
          <p className="mt-2 text-sm text-amber-100/85">
            {score} / {QUIZ.length} 정답 ({pct}%) — 오답은 풀이를 다시 확인하세요.
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <BackBtn onClick={onBack} />
        <span />
      </div>
    </div>
  );
}
