"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ──────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "substitution_idea",
    prompt:
      "바빌로니아인들은 ax³ + bx² = c 를 y³ + y² = k (k = c·a²/b³) 형태로 바꾸어 풀었습니다. y = (a/b)x 라는 치환의 핵심 아이디어를 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 어떤 ax³ + bx² = c 도 ‘적절한 치환’ 으로 y³ + y² = k 라는 한 가지 표준형으로 줄일 수 있다. 그러면 n³ + n² 라는 단 하나의 표만 가지고 있으면 모든 방정식을 풀 수 있게 된다. ‘식의 형태를 통일해 단 하나의 표만 보면 되게 만든다’ 가 핵심 아이디어.",
  },
  {
    id: "table_vs_modern",
    prompt:
      "n³ + n² 표가 갖는 수학적·실용적 역할은 무엇이며, 오늘날 우리가 배우는 풀이 (인수분해·근의 공식·인수정리) 와 어떤 점이 비슷하고 어떤 점이 다른가요?",
    kind: "text",
    placeholder:
      "예: 표는 ‘미리 계산해 둔 값의 모음’ 이라는 점에서 오늘날의 함숫값 표·계산기·알고리즘과 같은 역할을 한다. 비슷한 점은 식의 ‘구조’ 를 분석해 풀이 전략을 세운다는 것. 다른 점은 바빌로니아는 표에 있는 값에 한해서만 풀 수 있었고, 현대 방법(근의 공식·인수정리)은 표 없이 일반적인 경우에도 풀 수 있다는 것.",
  },
];

// ─── n³ + n² 표 (n = 1 ~ 30) ───────────────────────────────
type BabRow = { n: number; val: number };
const BAB_TABLE: BabRow[] = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  return { n, val: n * n * n + n * n };
});

// ─── 표기 헬퍼 ────────────────────────────────────────────
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}
function fracStr(num: number, den: number): string {
  if (num === 0) return "0";
  const g = gcd(num, den);
  const n = num / g;
  const d = den / g;
  return d === 1 ? `${n}` : `${n}/${d}`;
}
function fmtN(v: number): string {
  if (Number.isInteger(v)) return v.toLocaleString();
  return v.toFixed(4);
}

// ─── 메인 ─────────────────────────────────────────────────
type TabId = 1 | 2 | 3;

export default function BabylonianCubicSolver() {
  const [tab, setTab] = useState<TabId>(1);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* 헤더 */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🏺 바빌로니아인의 방정식 풀이</h3>
        <p className="mt-2 leading-7 text-slate-300">
          4000 년 전 바빌로니아인들이 <b className="text-amber-200">n³ + n²</b> 표를
          사용해 삼차방정식을 풀던 방법을 직접 체험합니다 — 표 탐구 · 5 단계 풀이 · 도전
          문제 5 선.
        </p>
      </div>

      {/* 탭 */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <TabBtn active={tab === 1} onClick={() => setTab(1)}>
          📜 활동 1 · 표 탐구
        </TabBtn>
        <TabBtn active={tab === 2} onClick={() => setTab(2)}>
          🧮 활동 2 · 방정식 풀기
        </TabBtn>
        <TabBtn active={tab === 3} onClick={() => setTab(3)}>
          🏆 활동 3 · 도전 문제
        </TabBtn>
      </div>

      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <Tab1Table />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <Tab2Solve onChallenge={() => setTab(3)} />
      </div>
      <div className={tab === 3 ? "mt-5" : "mt-5 hidden"}>
        <Tab3Quiz />
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
        "rounded-xl px-2 py-2.5 text-xs font-bold transition sm:text-sm " +
        (active
          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-amber-200")
      }
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 표 탐구
// ═══════════════════════════════════════════════════════════

const N_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8, 10];

function buildDistractors(correct: number, count = 3): number[] {
  const pool = new Set<number>();
  let safety = 0;
  while (pool.size < count && safety < 100) {
    const delta = (Math.floor(Math.random() * 10) + 1) * (Math.random() < 0.5 ? 1 : -1);
    const v = correct + delta;
    if (v > 0 && v !== correct) pool.add(v);
    safety++;
  }
  return [...pool];
}

type CalcState = {
  n: number;
  correct: number;
  choices: number[];
  picked: number | null;
};

function Tab1Table() {
  const [calc, setCalc] = useState<CalcState | null>(null);

  function startChallenge(n: number) {
    const correct = n * n * n + n * n;
    const distract = buildDistractors(correct, 3);
    const choices = [correct, ...distract].sort(() => Math.random() - 0.5);
    setCalc({ n, correct, choices, picked: null });
  }

  function pick(v: number) {
    setCalc((prev) => (prev && prev.picked === null ? { ...prev, picked: v } : prev));
  }

  const highlightN = calc?.n ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-amber-100">📜 바빌로니아인의 비밀 표</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          지금으로부터 약 <b className="text-amber-200">4000 년 전</b>, 바빌로니아인들은
          <br />
          <b className="text-amber-200">n³ + n²</b> 의 값을 계산한 표를 남겼습니다.
          <br />
          이 표가 어떻게 삼차방정식을 푸는 데 쓰였는지 탐구해 봅시다!
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
          ① n³ + n² 표 채우기
        </p>
        <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-2 text-sm leading-7 text-amber-100">
          바빌로니아인들은 <b>n = 1 부터 30 까지</b> n³ + n² 의 값을 모두 계산해
          두었습니다. 아래 <b>n 버튼</b> 을 눌러 직접 계산에 도전해 보세요!
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* 입력 영역 */}
          <div>
            <p className="mb-2 text-xs font-bold text-slate-400">
              n 값을 선택하면 계산에 도전!
            </p>
            <div className="flex flex-wrap gap-1.5">
              {N_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => startChallenge(n)}
                  className={
                    "rounded-lg border px-3 py-1.5 font-serif text-sm italic transition " +
                    (calc?.n === n
                      ? "border-amber-300 bg-amber-400/20 text-amber-100"
                      : "border-white/15 bg-white/5 text-slate-300 hover:border-amber-300/50 hover:text-amber-200")
                  }
                >
                  n = {n}
                </button>
              ))}
            </div>

            {calc ? (
              <div className="mt-4 rounded-xl border border-amber-400/30 bg-slate-950/40 p-4">
                <p className="text-xs font-bold text-amber-300">
                  계산 도전 — n = {calc.n}
                </p>
                <p className="mt-2 font-serif text-base italic text-amber-100">
                  {calc.n}
                  <sup>3</sup> + {calc.n}
                  <sup>2</sup> = ?
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  = <span className="text-amber-200">{calc.n ** 3}</span> +{" "}
                  <span className="text-amber-200">{calc.n ** 2}</span> = ?
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {calc.choices.map((c) => {
                    const decided = calc.picked !== null;
                    const isPicked = calc.picked === c;
                    const isCorrect = c === calc.correct;
                    let cls =
                      "border-white/15 bg-white/5 text-slate-200 hover:border-amber-300/50";
                    if (decided) {
                      if (isPicked && isCorrect) {
                        cls = "border-emerald-400/55 bg-emerald-400/15 text-emerald-100";
                      } else if (isPicked && !isCorrect) {
                        cls = "border-rose-400/55 bg-rose-400/15 text-rose-100";
                      } else if (isCorrect) {
                        cls = "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
                      } else {
                        cls = "border-white/10 bg-white/[0.03] text-slate-500";
                      }
                    }
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => pick(c)}
                        disabled={decided}
                        className={
                          "rounded-lg border-2 px-3 py-1.5 font-serif text-sm transition disabled:cursor-default " +
                          cls
                        }
                      >
                        {c.toLocaleString()}
                      </button>
                    );
                  })}
                </div>

                {calc.picked !== null ? (
                  <p
                    className={
                      "mt-3 rounded-lg px-3 py-2 text-xs leading-7 " +
                      (calc.picked === calc.correct
                        ? "bg-emerald-400/10 text-emerald-100"
                        : "bg-rose-400/10 text-rose-100")
                    }
                  >
                    {calc.picked === calc.correct ? (
                      <>
                        ✅ <b>정답!</b> {calc.n}³ + {calc.n}² = {calc.n ** 3} +{" "}
                        {calc.n ** 2} = <b>{calc.correct.toLocaleString()}</b>
                      </>
                    ) : (
                      <>
                        ❌ 오답. 정답은 <b>{calc.correct.toLocaleString()}</b>입니다.
                        <br />
                        {calc.n}³ = {calc.n ** 3}, {calc.n}² = {calc.n ** 2} → 합 ={" "}
                        {calc.correct.toLocaleString()}
                      </>
                    )}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* 완성된 표 */}
          <div>
            <p className="mb-2 text-xs font-bold text-slate-400">n³ + n² 완성 표</p>
            <div className="max-h-[300px] overflow-y-auto rounded-xl border border-amber-400/15">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-amber-400/[0.12] backdrop-blur">
                  <tr>
                    <th className="border-b border-amber-400/20 px-3 py-1.5 text-xs font-bold text-amber-200">
                      n
                    </th>
                    <th className="border-b border-amber-400/20 px-3 py-1.5 text-xs font-bold text-amber-200">
                      n³ + n²
                    </th>
                  </tr>
                </thead>
                <tbody className="text-center font-serif">
                  {BAB_TABLE.map((r) => (
                    <tr
                      key={r.n}
                      className={
                        r.n === highlightN
                          ? "bg-amber-400/[0.15] font-bold text-amber-100"
                          : "text-slate-300"
                      }
                    >
                      <td className="border-b border-white/5 px-3 py-1 italic">{r.n}</td>
                      <td className="border-b border-white/5 px-3 py-1">
                        {r.val.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-center text-[11px] text-slate-500">
              ↕ 스크롤하여 더 보기
            </p>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          표 패턴이 보이나요? 연속된 두 행의 차이를 계산해 보세요!
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 방정식 풀기 (5 단계)
// ═══════════════════════════════════════════════════════════

type Coeffs = { a: number; b: number; c: number };

function Tab2Solve({ onChallenge }: { onChallenge: () => void }) {
  const [coeffs, setCoeffs] = useState<Coeffs>({ a: 25, b: 5, c: 16 });
  const [solveStep, setSolveStep] = useState<number>(-1);
  const [lookupClicked, setLookupClicked] = useState<number | null>(null);
  const [wrongRow, setWrongRow] = useState<number | null>(null);

  function adjust(key: keyof Coeffs, delta: number) {
    const max = key === "c" ? 200 : 30;
    setCoeffs((prev) => ({
      ...prev,
      [key]: Math.max(1, Math.min(max, prev[key] + delta)),
    }));
    setSolveStep(-1);
    setLookupClicked(null);
  }

  const { a, b, c } = coeffs;
  const k = (c * a * a) / (b * b * b);
  const matchRow = BAB_TABLE.find((r) => Math.abs(r.val - k) < 1e-9) ?? null;
  const eqText = `${a === 1 ? "" : a}x³ + ${b === 1 ? "" : b}x² = ${c}`;

  // 풀이용 데이터 (matchRow 있을 때)
  const solve = useMemo(() => {
    if (!matchRow) return null;
    const n = matchRow.n;
    const xFracNum = b * n;
    const xFracDen = a;
    const g = gcd(xFracNum, xFracDen);
    const xn = xFracNum / g;
    const xd = xFracDen / g;
    const xStr = xd === 1 ? `${xn}` : `${xn}/${xd}`;
    const aOnB = fracStr(a, b);
    const bOnA = fracStr(b, a);
    const xVal = xn / xd;
    const lhs = a * xVal ** 3 + b * xVal ** 2;
    const verifyOk = Math.abs(lhs - c) < 1e-6;
    return { n, xn, xd, xStr, aOnB, bOnA, xVal, lhs, verifyOk };
  }, [a, b, c, matchRow]);

  function startSolve() {
    if (!matchRow) return;
    setSolveStep(0);
    setLookupClicked(null);
  }

  function showStep(idx: number) {
    setSolveStep(idx);
  }

  function clickLookup(row: BabRow) {
    if (Math.abs(row.val - k) < 1e-9) {
      setLookupClicked(row.n);
      setWrongRow(null);
    } else {
      setWrongRow(row.n);
      window.setTimeout(() => setWrongRow(null), 800);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-amber-100">
          🧮 바빌로니아인처럼 방정식 풀기
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          삼차방정식 <span className="font-serif italic text-amber-200">ax³ + bx² = c</span>{" "}
          를 바빌로니아인의 방법으로 단계별로 풀어 봅시다!
        </p>
      </div>

      {/* 계수 조절 */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
          ① 방정식 직접 설정하기
        </p>
        <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-2 text-xs leading-7 text-amber-100">
          계수 <b>a</b>, <b>b</b>, <b>c</b> 를 조절해 풀고 싶은 방정식을 만들어 보세요.
          (단, 바빌로니아 표에서 찾을 수 있는 해가 존재해야 풀 수 있습니다)
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <CoeffSpinner
            label="a"
            value={a}
            onMinus={() => adjust("a", -1)}
            onPlus={() => adjust("a", +1)}
          />
          <span className="text-base text-slate-400">x³ +</span>
          <CoeffSpinner
            label="b"
            value={b}
            onMinus={() => adjust("b", -1)}
            onPlus={() => adjust("b", +1)}
          />
          <span className="text-base text-slate-400">x² =</span>
          <CoeffSpinner
            label="c"
            value={c}
            onMinus={() => adjust("c", -1)}
            onPlus={() => adjust("c", +1)}
          />
        </div>

        <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-center font-serif text-xl italic text-amber-100">
          {eqText}
        </div>

        <p
          className={
            "mt-2 text-center text-xs " +
            (matchRow ? "text-emerald-300" : "text-rose-300")
          }
        >
          {matchRow ? (
            <>✅ 바빌로니아 방법으로 풀 수 있습니다! (k = {fmtN(k)})</>
          ) : (
            <>⚠️ k = {fmtN(k)} — 표에 없어 이 방법으로는 풀기 어렵습니다.</>
          )}
        </p>

        <button
          type="button"
          onClick={startSolve}
          disabled={!matchRow}
          className="mt-3 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          🏺 바빌로니아 방식으로 풀기!
        </button>
      </div>

      {/* 풀이 단계 */}
      {solveStep >= 0 && solve ? (
        <>
          {/* Step flow */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
              풀이 진행 단계
            </p>
            <div className="mt-3 flex items-center justify-between">
              {[0, 1, 2, 3, 4].map((i) => {
                const done = i < solveStep;
                const active = i === solveStep;
                return (
                  <div key={i} className="flex flex-1 items-center">
                    <div
                      className={
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition " +
                        (active
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/40"
                          : done
                          ? "bg-emerald-500/30 text-emerald-200"
                          : "bg-white/5 text-slate-500")
                      }
                    >
                      {i + 1}
                    </div>
                    {i < 4 ? (
                      <div
                        className={
                          "mx-1 h-[2px] flex-1 " +
                          (done ? "bg-emerald-400/50" : "bg-white/10")
                        }
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 1: 양변 변환 */}
          {solveStep === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                단계 1 — 양변에 a²/b³ 곱하기
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                방정식{" "}
                <span className="font-serif italic text-amber-200">
                  {a}x³ + {b}x² = {c}
                </span>{" "}
                의 양변에{" "}
                <span className="font-serif italic text-amber-200">
                  a²/b³ = {a ** 2}/{b ** 3}
                </span>{" "}
                을 곱합니다.
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-serif text-sm italic">
                  {a}x³ + {b}x² = {c}
                </div>
                <div className="text-center text-xs text-amber-300">
                  ×<br />
                  <span className="font-serif italic">
                    {a ** 2}/{b ** 3}
                  </span>
                </div>
                <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 font-serif text-sm italic text-amber-100">
                  ({solve.aOnB}x)³ + ({solve.aOnB}x)² = {fmtN(k)}
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-4 py-3 text-center font-serif text-base italic text-amber-100">
                ({solve.aOnB}x)³ + ({solve.aOnB}x)² = {fmtN(k)}
              </div>

              <p className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2 text-xs leading-7 text-slate-200">
                <b className="text-amber-200">핵심:</b>{" "}
                <em>y = {solve.aOnB}x</em> 로 치환하면{" "}
                <b className="text-amber-200">y³ + y² = {fmtN(k)}</b> 형태가 됩니다.
              </p>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => showStep(1)}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-bold text-white"
                >
                  다음 단계 →
                </button>
              </div>
            </div>
          ) : null}

          {/* Step 2: y 치환 */}
          {solveStep === 1 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                단계 2 — y = (a/b)x 로 치환
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                <span className="font-serif italic text-amber-200">
                  y = ({a}/{b})x = {solve.aOnB}x
                </span>{" "}
                로 놓으면 방정식이{" "}
                <b className="text-amber-200">y³ + y² = k</b> 형태가 됩니다.
              </p>

              <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-4 py-3 text-center font-serif text-lg italic text-amber-100">
                y³ + y² = {fmtN(k)}
              </div>

              <div className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2 text-center font-serif text-sm leading-7 text-slate-200">
                k = c · a²/b³ = {c} · {a ** 2}/{b ** 3} ={" "}
                <b className="text-amber-200">{fmtN(k)}</b>
              </div>

              <div className="mt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => showStep(0)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200"
                >
                  ← 이전
                </button>
                <button
                  type="button"
                  onClick={() => showStep(2)}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-bold text-white"
                >
                  다음 단계 →
                </button>
              </div>
            </div>
          ) : null}

          {/* Step 3: 표 lookup */}
          {solveStep === 2 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                단계 3 — n³ + n² 표에서 y 값 찾기
              </p>
              <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-2 text-sm leading-7 text-amber-100">
                <b>k = {fmtN(k)}</b> 가 되는 n 을 표에서 찾습니다. 표에서 n³ + n² = k 인
                행을 <b>클릭</b> 해 보세요!
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_280px]">
                <div>
                  <p className="mb-1 text-xs font-bold text-slate-400">
                    n³ + n² 표 (클릭해서 찾기!)
                  </p>
                  <div className="max-h-[280px] overflow-y-auto rounded-xl border border-amber-400/15">
                    <table className="w-full border-collapse text-sm">
                      <thead className="sticky top-0 bg-amber-400/[0.12] backdrop-blur">
                        <tr>
                          <th className="border-b border-amber-400/20 px-3 py-1.5 text-xs font-bold text-amber-200">
                            n
                          </th>
                          <th className="border-b border-amber-400/20 px-3 py-1.5 text-xs font-bold text-amber-200">
                            n³ + n²
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-center font-serif">
                        {BAB_TABLE.map((r) => {
                          const isFound = lookupClicked === r.n;
                          const isWrong = wrongRow === r.n;
                          return (
                            <tr
                              key={r.n}
                              onClick={() => clickLookup(r)}
                              className={
                                "cursor-pointer transition " +
                                (isFound
                                  ? "bg-emerald-400/25 font-bold text-emerald-100"
                                  : isWrong
                                  ? "bg-rose-400/20 text-rose-100"
                                  : "text-slate-300 hover:bg-amber-400/10")
                              }
                            >
                              <td className="border-b border-white/5 px-3 py-1 italic">
                                {r.n}
                              </td>
                              <td className="border-b border-white/5 px-3 py-1">
                                {r.val.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-1 text-center text-[11px] text-slate-500">
                    ↕ 스크롤하여 찾기
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-bold text-slate-400">찾은 결과</p>
                  {lookupClicked !== null ? (
                    <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] p-4 text-center">
                      <p className="text-xs text-slate-300">
                        n³ + n² ={" "}
                        <b className="text-amber-200">{solve.n ** 3 + solve.n ** 2}</b>
                      </p>
                      <p className="mt-1 font-serif text-2xl font-bold text-emerald-200">
                        n = {solve.n}
                      </p>
                      <p className="mt-1 text-sm font-bold text-amber-200">
                        ∴ y = {solve.n}
                      </p>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-xs leading-7 text-slate-400">
                      {wrongRow !== null
                        ? `n = ${wrongRow} 일 때 n³ + n² = ${(wrongRow ** 3 + wrongRow ** 2).toLocaleString()} ≠ ${fmtN(k)}. 계속 찾아보세요!`
                        : "왼쪽 표에서 k 값과 같은 행을 클릭하세요!"}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => showStep(1)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200"
                >
                  ← 이전
                </button>
                {lookupClicked !== null ? (
                  <button
                    type="button"
                    onClick={() => showStep(3)}
                    className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-bold text-white"
                  >
                    다음 단계 →
                  </button>
                ) : (
                  <span />
                )}
              </div>
            </div>
          ) : null}

          {/* Step 4: x 역산 */}
          {solveStep === 3 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                단계 4 — y 에서 x 역산하기
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                <span className="font-serif italic">y = (a/b)x</span> 이므로{" "}
                <span className="font-serif italic">x = (b/a)y</span>.
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 font-serif text-sm italic text-emerald-100">
                  y = {solve.n}
                </div>
                <div className="text-center text-xs text-amber-300">
                  ×<br />
                  <span className="font-serif italic">{solve.bOnA}</span>
                </div>
                <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 font-serif text-sm italic text-amber-100">
                  x = ({solve.bOnA}) × {solve.n} = {solve.xStr}
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-4 py-3 text-center font-serif text-lg italic text-amber-100">
                x = (b/a) × n = ({b}/{a}) × {solve.n} = <b>{solve.xStr}</b>
              </div>

              <div className="mt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => showStep(2)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200"
                >
                  ← 이전
                </button>
                <button
                  type="button"
                  onClick={() => showStep(4)}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-bold text-white"
                >
                  다음 단계 →
                </button>
              </div>
            </div>
          ) : null}

          {/* Step 5: 검증 */}
          {solveStep === 4 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
                단계 5 — 답 검증하기
              </p>

              <div className="mt-3 rounded-2xl border border-emerald-400/40 bg-emerald-400/[0.08] p-5 text-center">
                <p className="text-sm text-slate-300">최종 답</p>
                <p className="mt-1 font-serif text-3xl font-extrabold text-emerald-200">
                  x = {solve.xStr}
                </p>
                <p
                  className={
                    "mt-2 text-sm " +
                    (solve.verifyOk ? "text-emerald-300" : "text-rose-300")
                  }
                >
                  {solve.verifyOk ? (
                    <>
                      ✅ {a} × ({solve.xStr})³ + {b} × ({solve.xStr})² ={" "}
                      {solve.lhs.toFixed(4)} ≈ {c} (검증 완료!)
                    </>
                  ) : (
                    <>⚠️ 검증 오류</>
                  )}
                </p>
              </div>

              <div className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-3 text-xs leading-7 text-slate-200">
                <p className="font-bold text-amber-300">검증 계산</p>
                <p className="mt-1">
                  <em className="text-amber-200">
                    {a}x³ + {b}x² = {c}
                  </em>{" "}
                  에 x = {solve.xStr} 대입
                </p>
                <p>
                  = {a} × ({solve.xStr})³ + {b} × ({solve.xStr})²
                </p>
                <p>
                  = {a} × {(solve.xVal ** 3).toFixed(4)} + {b} ×{" "}
                  {(solve.xVal ** 2).toFixed(4)}
                </p>
                <p>
                  = {(a * solve.xVal ** 3).toFixed(4)} +{" "}
                  {(b * solve.xVal ** 2).toFixed(4)}
                </p>
                <p>
                  = <b className="text-amber-200">{solve.lhs.toFixed(4)}</b>{" "}
                  {solve.verifyOk ? <>= {c} ✅</> : <>≠ {c} ⚠️</>}
                </p>
              </div>

              <div className="mt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => showStep(3)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200"
                >
                  ← 이전
                </button>
                <button
                  type="button"
                  onClick={onChallenge}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-bold text-white"
                >
                  도전 문제 풀러 가기 →
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function CoeffSpinner({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <>
      <span className="font-serif italic text-base text-slate-300">{label}</span>
      <div className="flex items-center">
        <button
          type="button"
          onClick={onMinus}
          aria-label={`${label} 감소`}
          className="h-8 w-7 rounded-l-md border border-white/15 bg-white/5 text-base font-bold text-slate-200 transition hover:border-amber-300 hover:bg-amber-400/20"
        >
          −
        </button>
        <div className="flex h-8 w-12 items-center justify-center border-y border-white/15 bg-white/[0.03] font-mono text-base font-bold text-amber-200">
          {value}
        </div>
        <button
          type="button"
          onClick={onPlus}
          aria-label={`${label} 증가`}
          className="h-8 w-7 rounded-r-md border border-white/15 bg-white/5 text-base font-bold text-slate-200 transition hover:border-amber-300 hover:bg-amber-400/20"
        >
          +
        </button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 3 — 도전 문제 5 선
// ═══════════════════════════════════════════════════════════

type QzItem = {
  eq: string;
  desc: ReactNode;
  choices: string[];
  answer: number;
  hint: ReactNode;
};

const QZ_DATA: QzItem[] = [
  {
    eq: "x³ + x² = 2",
    desc: <>y = x 로 치환하면 y³ + y² = 2 입니다. 표에서 n 을 찾아 x 를 구하세요.</>,
    choices: ["x = 1", "x = 2", "x = 3", "x = 없음"],
    answer: 0,
    hint: (
      <>
        n = 1 일 때 1³ + 1² = 2 → y = 1 → x = 1<br />
        검증: 1³ + 1² = 2 ✅
      </>
    ),
  },
  {
    eq: "25x³ + 5x² = 16",
    desc: (
      <>교과서 96p 예제입니다. a = 25, b = 5 이므로 y = (25/5)x = 5x 로 치환해 보세요.</>
    ),
    choices: ["x = 4/5", "x = 4", "x = 5", "x = 1/5"],
    answer: 0,
    hint: (
      <>
        y = 5x 로 치환 → (5x)³ + (5x)² = 16 × 25/5³ = 80
        <br />
        n = 4 → 4³ + 4² = 80 → y = 4 → x = 4/5 ✅
      </>
    ),
  },
  {
    eq: "x³ − 8x² + 21x − 270 = 0",
    desc: (
      <>
        이 방정식을 바빌로니아 방법으로 풀 수 있을까요? (ax³ + bx² = c 형태로 변형 가능한
        지 확인하세요)
      </>
    ),
    choices: [
      "x = 6 (풀 수 있음)",
      "x = 10 (풀 수 있음)",
      "이 방법으론 풀 수 없음",
      "x = 3 (풀 수 있음)",
    ],
    answer: 2,
    hint: (
      <>
        이 방정식은 ax³ + bx² = c 형태가 아닙니다.
        <br />
        x 항 (21x) 과 상수항 (−270) 이 포함되어 있어
        <br />
        바빌로니아 방법을 직접 적용하기 어렵습니다.
        <br />
        <span className="text-amber-200">
          → 현대적 방법 (인수정리 + 조립제법) 을 사용해야 합니다!
        </span>
      </>
    ),
  },
  {
    eq: "x³ + x² = 36",
    desc: <>표에서 n³ + n² = 36 이 되는 n 을 찾아 x 를 구하세요.</>,
    choices: ["x = 2", "x = 3", "x = 4", "x = 6"],
    answer: 1,
    hint: (
      <>
        n = 3 → 3³ + 3² = 27 + 9 = 36 ✅<br />y = x (a = b = 1) → x = 3
      </>
    ),
  },
  {
    eq: "x³ + x² = 80",
    desc: <>표에서 n³ + n² = 80 이 되는 n 을 찾아 x 를 구하세요.</>,
    choices: ["x = 3", "x = 4", "x = 5", "x = 6"],
    answer: 1,
    hint: (
      <>
        n = 4 → 4³ + 4² = 64 + 16 = 80 ✅<br />y = x (a = b = 1) → x = 4
        <br />
        검증: 4³ + 4² = 64 + 16 = 80 ✅
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

type QzState = {
  data: QzItem[];
  idx: number;
  correctMap: boolean[];
  picked: number | null;
};

function Tab3Quiz() {
  const [state, setState] = useState<QzState>(() => ({
    data: shuffle(QZ_DATA),
    idx: 0,
    correctMap: [],
    picked: null,
  }));

  const total = state.data.length;
  const score = state.correctMap.filter(Boolean).length;
  const done = state.correctMap.length === total;
  const cur = state.data[state.idx];

  function pick(i: number) {
    if (state.picked !== null || done) return;
    const correct = i === cur.answer;
    setState((s) => ({
      ...s,
      picked: i,
      correctMap: [...s.correctMap, correct],
    }));
  }

  function next() {
    if (state.idx + 1 >= total) {
      setState((s) => ({ ...s, picked: null }));
      return;
    }
    setState((s) => ({ ...s, idx: s.idx + 1, picked: null }));
  }

  function reset() {
    setState({
      data: shuffle(QZ_DATA),
      idx: 0,
      correctMap: [],
      picked: null,
    });
  }

  const progress = state.correctMap.length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-amber-100">
          🏆 바빌로니아인처럼 문제 풀기!
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          이제 직접 방정식을 분석하고 답을 찾아보세요.
          <br />
          바빌로니아 방법이{" "}
          <b className="text-amber-200">통하는지 안 통하는지</b> 도 판단해야 합니다!
        </p>
      </div>

      {/* 진행 막대 + 점수 점 */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <svg viewBox="0 0 100 1" preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id="babQzProg" x1="0" x2="1">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>
            <rect
              x="0"
              y="0"
              height="1"
              width={(progress / total) * 100}
              fill="url(#babQzProg)"
            />
          </svg>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {progress} / {total}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {state.data.map((_, i) => {
          const ans = state.correctMap[i];
          const isCur = i === state.idx && !done;
          return (
            <div
              key={i}
              className={
                "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold transition " +
                (ans === true
                  ? "border-emerald-400/50 bg-emerald-400/20 text-emerald-200"
                  : ans === false
                  ? "border-rose-400/50 bg-rose-400/20 text-rose-200"
                  : isCur
                  ? "border-amber-300/70 bg-amber-400/15 text-amber-200"
                  : "border-white/10 bg-white/5 text-slate-500")
              }
            >
              {ans === true ? "✓" : ans === false ? "✗" : i + 1}
            </div>
          );
        })}
      </div>

      {!done ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
            문제 {state.idx + 1}
          </p>
          <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-4 py-4 text-center font-serif text-xl italic text-amber-100">
            {cur.eq}
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-300">{cur.desc}</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {cur.choices.map((c, i) => {
              const isCorrect = i === cur.answer;
              const isPicked = state.picked === i;
              let cls =
                "border-white/15 bg-white/5 text-slate-200 hover:border-amber-300/50 hover:bg-amber-400/10";
              if (state.picked !== null) {
                if (isCorrect) {
                  cls = "border-emerald-400/55 bg-emerald-400/15 text-emerald-100";
                } else if (isPicked) {
                  cls = "border-rose-400/55 bg-rose-400/15 text-rose-100";
                } else {
                  cls = "border-white/10 bg-white/[0.03] text-slate-500";
                }
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  disabled={state.picked !== null}
                  className={
                    "rounded-lg border-2 px-3 py-2 text-left text-sm font-bold transition disabled:cursor-default " +
                    cls
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>

          {state.picked !== null ? (
            <div
              className={
                "mt-4 rounded-lg border px-3 py-2.5 text-sm leading-7 " +
                (state.picked === cur.answer
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                  : "border-rose-400/40 bg-rose-400/10 text-rose-100")
              }
            >
              <p className="font-bold">
                {state.picked === cur.answer ? "✅ 정답!" : "❌ 오답."}
              </p>
              <p className="mt-1 text-slate-200">{cur.hint}</p>
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            {state.picked !== null ? (
              <button
                type="button"
                onClick={next}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-bold text-white"
              >
                {state.idx + 1 >= total ? "결과 보기 →" : "다음 문제 →"}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <FinalCard score={score} total={total} onReset={reset} />
      )}
    </div>
  );
}

function FinalCard({
  score,
  total,
  onReset,
}: {
  score: number;
  total: number;
  onReset: () => void;
}) {
  const msgs = [
    "다시 도전해봐요! 바빌로니아인도 연습이 필요했을 거예요 💪",
    "조금 더 연습하면 바빌로니아 수학자가 될 수 있어요! 📖",
    "점점 익숙해지고 있어요. 잘 하고 있습니다 👍",
    "훌륭해요! 바빌로니아 방법이 몸에 익었네요 ⭐",
    "완벽! 4000 년 전 수학자들의 지혜를 완전히 이해했어요 🏺",
  ];
  const msg = msgs[Math.min(Math.floor(score / (total / 4)), msgs.length - 1)];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent p-6 text-center">
        <p className="text-2xl">🏺 완료!</p>
        <p className="mt-2 text-5xl font-extrabold text-amber-300">
          {score} / {total}
        </p>
        <p className="mt-2 text-sm text-slate-300">{msg}</p>
        <button
          type="button"
          onClick={onReset}
          className="mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-bold text-white"
        >
          다시 도전 🔄
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
          📌 바빌로니아 방법 핵심 정리
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-8 text-slate-200">
          <li>
            <b className="text-amber-200">ax³ + bx² = c</b> 형태인지 확인
          </li>
          <li>
            양변에 <em className="font-serif text-amber-200">a²/b³</em> 을 곱해{" "}
            <em className="font-serif text-amber-200">y³ + y² = k</em> 로 변환
          </li>
          <li>
            <b className="text-amber-200">n³ + n²</b> 표에서 k 가 되는 n 을 탐색
          </li>
          <li>
            <b className="text-amber-200">x = (b/a) · n</b> 으로 역산
          </li>
        </ol>
        <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/[0.07] px-3 py-2 text-xs leading-7 text-rose-100">
          <b className="text-amber-200">단,</b> k 가 표에 없으면 이 방법으로는 풀 수
          없습니다. 그땐 현대의 인수정리 · 조립제법 같은 방법을 사용해야 합니다.
        </p>
      </div>
    </div>
  );
}
