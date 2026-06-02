"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (게임 1 + 탐색 1) ──────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "classify_criterion",
    prompt:
      "삼·사차방정식을 풀 때 ‘인수분해 공식 (합·차·치환)’ 을 쓸지, ‘인수정리 + 조립제법’ 을 쓸지 어떻게 판단하나요? 자신만의 판단 기준을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 식의 모양이 a³ ± b³ / 완전세제곱 / t = x² 치환이 깔끔하게 되면 공식 우선, 그게 아니면 상수항의 약수 ±1, ±2, … 를 차례로 대입해 0 이 되는 값을 찾고 조립제법으로 인수를 분리한다.",
  },
  {
    id: "fundamental_finding",
    prompt:
      "‘대수학의 기본정리’ 탐구에서 계수를 여러 가지로 바꿔보며 발견한 규칙을 적어 보세요. (예: 실수 계수 방정식에서 허근이 나타날 때 어떤 모양으로 나오는지)",
    kind: "text",
    placeholder:
      "예: 차수만큼 정확히 그 개수의 근(중복 포함)이 나왔다. 계수를 모두 실수로 두면 허근은 항상 짝수 개 나오고, 짝지어 켤레 쌍을 이뤘다. 차수가 홀수이면 실근이 반드시 하나는 있었다.",
  },
];

// ─── 표기 헬퍼 ─────────────────────────────────────────────
function I() {
  return <em className="font-serif italic text-pink-300">i</em>;
}

// ─── 색 / 상수 ─────────────────────────────────────────────
const ROOT_COLORS = ["#f87171", "#34d399", "#60a5fa", "#fbbf24"];

// ─── 메인 ───────────────────────────────────────────────────
type TabId = 0 | 1;

export default function CubicQuarticEquationExplorer() {
  const [tab, setTab] = useState<TabId>(0);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* 헤더 */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🔢 삼·사차방정식 풀이 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          풀이 전략을 분류하는 카드 게임과, 계수를 바꿔가며 모든 근을 확인하는{" "}
          <b className="text-cyan-200">대수학의 기본정리</b> 탐구로 삼·사차방정식을 깊이
          이해해 봅시다.
        </p>
      </div>

      {/* 탭 */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <TabButton active={tab === 0} onClick={() => setTab(0)}>
          🃏 활동 1 — 풀이 전략 분류
        </TabButton>
        <TabButton active={tab === 1} onClick={() => setTab(1)}>
          🔮 활동 2 — 대수학의 기본정리
        </TabButton>
      </div>

      {/* 두 탭 모두 마운트 유지 → 점수·계수 상태가 탭 이동 후에도 보존 */}
      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}>
        <ClassifyGame />
      </div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <FundamentalTheorem />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl px-3 py-2.5 text-sm font-bold transition " +
        (active
          ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-violet-200")
      }
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 풀이 전략 분류 게임
// ═══════════════════════════════════════════════════════════

type ClassType = "formula" | "synthetic";
type QData = { eq: string; type: ClassType; hint: React.ReactNode };

const EQ_DATA: QData[] = [
  // 인수분해 공식
  {
    eq: "x³ − 8 = 0",
    type: "formula",
    hint: (
      <>
        <b>8 = 2³</b> → a³ − b³ 공식!
        <br />
        (x − 2)(x² + 2x + 4) = 0
        <br />
        ∴ x = 2, <span className="text-violet-300">x = −1 ± √3 <I /></span>
      </>
    ),
  },
  {
    eq: "x³ − 64 = 0",
    type: "formula",
    hint: (
      <>
        <b>64 = 4³</b> → a³ − b³ 공식!
        <br />
        (x − 4)(x² + 4x + 16) = 0
        <br />
        ∴ x = 4, <span className="text-violet-300">x = −2 ± 2√3 <I /></span>
      </>
    ),
  },
  {
    eq: "x³ + 27 = 0",
    type: "formula",
    hint: (
      <>
        <b>27 = 3³</b> → a³ + b³ 공식!
        <br />
        (x + 3)(x² − 3x + 9) = 0
        <br />
        ∴ x = −3, <span className="text-violet-300">x = (3 ± 3√3 <I />) / 2</span>
      </>
    ),
  },
  {
    eq: "x³ + 3x² + 3x + 1 = 0",
    type: "formula",
    hint: (
      <>
        계수 1·3·3·1 → <b>완전세제곱!</b>
        <br />
        (x + 1)³ = 0<br />∴ x = −1 (삼중근)
      </>
    ),
  },
  {
    eq: "x⁴ − 2x² − 8 = 0",
    type: "formula",
    hint: (
      <>
        <b>t = x²</b> 치환 → t² − 2t − 8 = 0<br />
        (t − 4)(t + 2) = 0 → (x² − 4)(x² + 2) = 0
        <br />
        ∴ x = ±2, <span className="text-violet-300">x = ±√2 <I /></span>
      </>
    ),
  },
  {
    eq: "x⁴ + x² − 6 = 0",
    type: "formula",
    hint: (
      <>
        <b>t = x²</b> 치환 → t² + t − 6 = 0<br />
        (t + 3)(t − 2) = 0 → (x² + 3)(x² − 2) = 0
        <br />
        ∴ x = ±√2, <span className="text-violet-300">x = ±√3 <I /></span>
      </>
    ),
  },
  // 인수정리 + 조립제법
  {
    eq: "x³ − 3x² + 4x − 2 = 0",
    type: "synthetic",
    hint: (
      <>
        f(1) = 1 − 3 + 4 − 2 = <b>0</b> → x = 1 이 근!
        <br />
        조립제법: (x − 1)(x² − 2x + 2) = 0
        <br />
        ∴ x = 1, <span className="text-violet-300">x = 1 ± <I /></span>
      </>
    ),
  },
  {
    eq: "x³ + x² − 3x − 6 = 0",
    type: "synthetic",
    hint: (
      <>
        f(2) = 8 + 4 − 6 − 6 = <b>0</b> → x = 2 가 근!
        <br />
        조립제법: (x − 2)(x² + 3x + 3) = 0
        <br />
        ∴ x = 2, <span className="text-violet-300">x = (−3 ± √3 <I />) / 2</span>
      </>
    ),
  },
  {
    eq: "x³ + 2x² − 5x − 6 = 0",
    type: "synthetic",
    hint: (
      <>
        f(−1) = −1 + 2 + 5 − 6 = <b>0</b> → x = −1 이 근!
        <br />
        조립제법: (x + 1)(x² + x − 6) = (x + 1)(x + 3)(x − 2) = 0
        <br />
        ∴ x = −1, −3, 2
      </>
    ),
  },
  {
    eq: "x³ − x² − x − 2 = 0",
    type: "synthetic",
    hint: (
      <>
        f(2) = 8 − 4 − 2 − 2 = <b>0</b> → x = 2 가 근!
        <br />
        조립제법: (x − 2)(x² + x + 1) = 0
        <br />
        ∴ x = 2, <span className="text-violet-300">x = (−1 ± √3 <I />) / 2</span>
      </>
    ),
  },
  {
    eq: "x⁴ + 5x³ + 5x² − 5x − 6 = 0",
    type: "synthetic",
    hint: (
      <>
        f(1) = 0 → x = 1 이 근! 조립제법 후
        <br />
        f₁(−6) = 0 → x = −6 도 근!
        <br />
        ∴ x = 1, −6, <span className="text-violet-300">−1 ± <I /></span>{" "}
        (4 개의 근)
      </>
    ),
  },
  {
    eq: "x⁴ − x³ − 7x² + x + 6 = 0",
    type: "synthetic",
    hint: (
      <>
        f(1) = 0, f(−1) = 0 두 근 발견!
        <br />
        조립제법 반복: (x − 1)(x + 1)(x² − x − 6) = (x − 1)(x + 1)(x − 3)(x + 2) = 0
        <br />
        ∴ x = 1, −1, 3, −2 (모두 실근)
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

type ClassifyState = {
  idx: number;
  answered: boolean;
  picked: ClassType | null;
  correctMap: boolean[]; // 각 문제별 정오 (length === data.length 만큼 차례로 push)
};

function ClassifyGame() {
  const [data, setData] = useState<QData[]>(() => shuffle(EQ_DATA));
  const [state, setState] = useState<ClassifyState>({
    idx: 0,
    answered: false,
    picked: null,
    correctMap: [],
  });

  const total = data.length;
  const score = state.correctMap.filter(Boolean).length;
  const done = state.correctMap.length === total;
  const cur = data[state.idx];

  function pick(choice: ClassType) {
    if (state.answered || done) return;
    const correct = cur.type === choice;
    setState((s) => ({
      ...s,
      answered: true,
      picked: choice,
      correctMap: [...s.correctMap, correct],
    }));
  }

  function next() {
    if (state.idx + 1 >= total) {
      // 모두 풀이 완료 — 결과 화면으로
      setState((s) => ({ ...s, answered: false, picked: null }));
      return;
    }
    setState((s) => ({ ...s, idx: s.idx + 1, answered: false, picked: null }));
  }

  function reset() {
    setData(shuffle(EQ_DATA));
    setState({ idx: 0, answered: false, picked: null, correctMap: [] });
  }

  const progress = state.correctMap.length;

  return (
    <div className="space-y-4">
      {/* 안내 */}
      <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-cyan-100">
          🃏 삼·사차방정식 풀이 전략 분류 게임
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          아래 방정식을 보고, 어떤 방법으로 풀지 골라 보세요!
          <br />
          <span className="font-semibold text-emerald-300">인수분해 공식</span>
          <span className="text-slate-500"> · </span>
          <span className="font-semibold text-violet-300">인수정리 + 조립제법</span>
        </p>
      </div>

      {/* 진행 막대 + 점수 점 */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <svg viewBox="0 0 100 1" preserveAspectRatio="none" className="h-full w-full">
            <rect
              x="0"
              y="0"
              height="1"
              width={(progress / total) * 100}
              fill="url(#progGrad)"
            />
            <defs>
              <linearGradient id="progGrad" x1="0" x2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {progress} / {total}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {data.map((_, i) => {
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
                  ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-200"
                  : "border-white/10 bg-white/5 text-slate-500")
              }
            >
              {ans === true ? "✓" : ans === false ? "✗" : i + 1}
            </div>
          );
        })}
      </div>

      {!done ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-300">
            문제 {state.idx + 1}
          </p>
          <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-5 text-center font-serif text-2xl italic tracking-wide text-amber-100">
            {cur.eq}
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            이 방정식의 풀이 방법은?
          </p>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <ClsButton
              tone="emerald"
              locked={state.answered}
              picked={state.picked === "formula"}
              correct={cur.type === "formula"}
              onClick={() => pick("formula")}
            >
              <span className="text-base">✅ 인수분해 공식</span>
              <span className="mt-1 block text-[11px] font-normal text-slate-300">
                합·차 공식 / 치환 이용
              </span>
            </ClsButton>
            <ClsButton
              tone="violet"
              locked={state.answered}
              picked={state.picked === "synthetic"}
              correct={cur.type === "synthetic"}
              onClick={() => pick("synthetic")}
            >
              <span className="text-base">🔢 인수정리 + 조립제법</span>
              <span className="mt-1 block text-[11px] font-normal text-slate-300">
                유리근 찾고 나눗셈
              </span>
            </ClsButton>
          </div>

          {state.answered && state.picked ? (
            <div
              className={
                "mt-4 rounded-xl border p-3 text-sm leading-7 " +
                (state.picked === cur.type
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                  : "border-rose-400/40 bg-rose-400/10 text-rose-100")
              }
            >
              {state.picked === cur.type ? (
                <p className="font-extrabold">✅ 정답!</p>
              ) : (
                <p className="font-extrabold">
                  ❌ 오답! 정답:{" "}
                  {cur.type === "formula" ? (
                    <span className="text-emerald-200">인수분해 공식</span>
                  ) : (
                    <span className="text-violet-200">인수정리 + 조립제법</span>
                  )}
                </p>
              )}
              <div className="mt-2 text-slate-200">{cur.hint}</div>
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            {state.answered ? (
              <button
                type="button"
                onClick={next}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
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

function ClsButton({
  tone,
  locked,
  picked,
  correct,
  onClick,
  children,
}: {
  tone: "emerald" | "violet";
  locked: boolean;
  picked: boolean;
  correct: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  // 잠긴 상태에서 — 내가 고른 버튼은 정/오답 색, 안 고른 버튼은 흐림.
  let cls: string;
  if (locked) {
    if (picked) {
      cls = correct
        ? "border-emerald-300 bg-emerald-400/30 text-emerald-50"
        : "border-rose-300 bg-rose-400/30 text-rose-50";
    } else {
      // 못 고른 정답이라면 살짝 강조
      cls = correct
        ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-200"
        : "border-white/10 bg-white/5 text-slate-500";
    }
  } else if (tone === "emerald") {
    cls =
      "border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20 hover:border-emerald-300";
  } else {
    cls =
      "border-violet-400/40 bg-violet-400/10 text-violet-200 hover:bg-violet-400/20 hover:border-violet-300";
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      className={
        "rounded-xl border-2 px-3 py-3 text-center font-bold leading-6 transition disabled:cursor-default " +
        cls
      }
    >
      {children}
    </button>
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
    "다시 한번 도전해봐요! 💪",
    "조금 더 연습하면 잘 할 수 있어요! 📖",
    "점점 잘 되고 있어요! 👍",
    "훌륭해요! 풀이 전략이 잡히고 있어요 ⭐",
    "완벽에 가까워요! 아주 잘 했어요 🌟",
    "완벽 정복! 방정식 전문가 🏆",
  ];
  const msg = msgs[Math.min(Math.floor(score / (total / msgs.length)), msgs.length - 1)];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 via-violet-500/10 to-transparent p-6 text-center">
        <p className="text-2xl">🏆 게임 완료!</p>
        <p className="mt-2 text-5xl font-extrabold text-cyan-300">
          {score} / {total}
        </p>
        <p className="mt-2 text-sm text-slate-300">{msg}</p>
        <button
          type="button"
          onClick={onReset}
          className="mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
        >
          다시 도전 🔄
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-300">
          📌 핵심 정리
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.07] p-4">
            <p className="font-bold text-emerald-200">인수분해 공식 이용</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-300">
              <li>
                <span className="font-serif italic text-amber-200">a³ ± b³</span> 형태
              </li>
              <li>완전세제곱 패턴</li>
              <li>
                <span className="font-serif italic text-amber-200">t = x²</span> 치환이
                깔끔한 식
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-violet-400/30 bg-violet-400/[0.07] p-4">
            <p className="font-bold text-violet-200">인수정리 + 조립제법</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-300">
              <li>공식이 바로 보이지 않을 때</li>
              <li>상수항의 약수로 유리근 후보 탐색</li>
              <li>0 이 되는 값을 찾아 조립제법으로 인수 분리</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 대수학의 기본정리 탐구
// ═══════════════════════════════════════════════════════════

type Complex = { r: number; i: number };

const DEFAULT3 = [1, -3, 4, -2];
const DEFAULT4 = [1, -2, -3, 4, 4];
const TERM_LABELS3 = ["x³", "x²", "x", ""];
const TERM_LABELS4 = ["x⁴", "x³", "x²", "x", ""];

function FundamentalTheorem() {
  const [degree, setDegree] = useState<3 | 4>(3);
  const [coeffs3, setCoeffs3] = useState<number[]>(DEFAULT3);
  const [coeffs4, setCoeffs4] = useState<number[]>(DEFAULT4);
  const [solved, setSolved] = useState(false);

  const coeffs = degree === 3 ? coeffs3 : coeffs4;
  const labels = degree === 3 ? TERM_LABELS3 : TERM_LABELS4;

  function setCoeffs(next: number[]) {
    if (degree === 3) setCoeffs3(next);
    else setCoeffs4(next);
    setSolved(false);
  }

  function adjust(i: number, delta: number) {
    const next = [...coeffs];
    let v = next[i] + delta;
    if (i === 0 && v === 0) v = delta > 0 ? 1 : -1; // 최고차항 0 금지
    v = Math.max(-9, Math.min(9, v));
    next[i] = v;
    setCoeffs(next);
  }

  function switchDegree(d: 3 | 4) {
    setDegree(d);
    setSolved(false);
  }

  const roots = useMemo(
    () => (solved ? sortRoots(durandKerner(coeffs)) : []),
    [solved, coeffs],
  );

  const previewText = useMemo(() => buildEqText(coeffs, labels), [coeffs, labels]);
  const realCnt = roots.filter((r) => Math.abs(r.i) < 5e-7).length;
  const cmplxCnt = roots.length - realCnt;

  return (
    <div className="space-y-4">
      {/* 안내 */}
      <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-cyan-100">
          🔮 대수학의 기본정리 탐구
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          계수를 직접 조작해 방정식의 모든 근을 확인하세요.
          <br />
          복소수 범위에서{" "}
          <b className="text-cyan-200">n 차방정식은 정확히 n 개의 근</b> 을 가집니다!
        </p>
      </div>

      {/* 차수 선택 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-300">
          ① 방정식 차수 선택
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <DegreeButton active={degree === 3} onClick={() => switchDegree(3)}>
            <div className="text-base font-bold">3 차방정식</div>
            <div className="text-[11px] font-normal text-slate-300">
              ax³ + bx² + cx + d = 0
            </div>
          </DegreeButton>
          <DegreeButton active={degree === 4} onClick={() => switchDegree(4)}>
            <div className="text-base font-bold">4 차방정식</div>
            <div className="text-[11px] font-normal text-slate-300">
              ax⁴ + bx³ + cx² + dx + e = 0
            </div>
          </DegreeButton>
        </div>

        {/* 계수 조정 */}
        <p className="mt-4 text-[11px] font-extrabold uppercase tracking-widest text-cyan-300">
          ② 계수 설정 (정수, −9 ~ +9)
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950/40 p-3">
          {coeffs.map((c, i) => (
            <CoeffControl
              key={`${degree}-${i}`}
              value={c}
              label={labels[i]}
              showOp={i > 0}
              onMinus={() => adjust(i, -1)}
              onPlus={() => adjust(i, +1)}
            />
          ))}
          <span className="px-1 text-base text-slate-400">= 0</span>
        </div>

        <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-4 text-center font-serif text-lg italic text-amber-100">
          {previewText}
        </div>

        <button
          type="button"
          onClick={() => setSolved(true)}
          className="mt-3 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
        >
          🔍 모든 근 구하기
        </button>
      </div>

      {/* 결과 */}
      {solved ? (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-300">
              ③ 근 탐색 결과
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {roots.map((r, i) => {
                const { str, type } = fmtRoot(r);
                return (
                  <div
                    key={i}
                    className={
                      "rounded-xl border-l-4 px-3 py-2.5 " +
                      (type === "real"
                        ? "border-emerald-400 bg-emerald-400/[0.06]"
                        : "border-violet-400 bg-violet-400/[0.06]")
                    }
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      근 {i + 1}
                    </p>
                    <p
                      className={
                        "mt-0.5 font-serif text-lg italic " +
                        (type === "real" ? "text-emerald-200" : "text-violet-200")
                      }
                    >
                      <span className="not-italic font-bold">x</span> = {str}
                    </p>
                    <span
                      className={
                        "mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold " +
                        (type === "real"
                          ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
                          : "border-violet-400/40 bg-violet-400/15 text-violet-200")
                      }
                    >
                      {type === "real" ? "실근" : "허근"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 via-violet-500/10 to-transparent p-4 text-center">
              <p className="text-xl">✅</p>
              <p className="mt-1 text-base font-extrabold text-cyan-100">
                이 {degree} 차방정식은 복소수 범위에서
                <br />
                정확히{" "}
                <span className="font-serif italic text-cyan-300">{degree}</span> 개의
                근을 가집니다!
              </p>
              <p className="mt-2 text-sm text-slate-300">
                실근 <b className="text-emerald-200">{realCnt}</b> 개 &nbsp;+&nbsp; 허근{" "}
                <b className="text-violet-200">{cmplxCnt}</b> 개
              </p>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                ※ 대수학의 기본정리: 복소수 계수 n 차방정식은 중복을 포함하여 정확히
                n 개의 근을 가집니다.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-300">
              ④ 복소 평면에서 근의 위치
            </p>
            <p className="mt-1 text-xs text-slate-400">
              가로축: 실수부 (Re) &nbsp;|&nbsp; 세로축: 허수부 (Im)
              &nbsp;|&nbsp; 점의 색 = 근 번호
            </p>
            <ComplexPlane roots={roots} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function DegreeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3 py-2.5 text-center transition " +
        (active
          ? "border-cyan-300 bg-cyan-400/15 text-cyan-100"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-slate-100")
      }
    >
      {children}
    </button>
  );
}

function CoeffControl({
  value,
  label,
  showOp,
  onMinus,
  onPlus,
}: {
  value: number;
  label: string;
  showOp: boolean;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <>
      {showOp ? (
        <span className="text-base text-slate-400">{value >= 0 ? "+" : "−"}</span>
      ) : null}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onMinus}
          aria-label="감소"
          className="h-8 w-7 rounded-l-md border border-white/15 bg-white/5 text-base font-bold text-slate-200 transition hover:border-cyan-300 hover:bg-cyan-400/20"
        >
          −
        </button>
        <div className="flex h-8 w-10 items-center justify-center border-y border-white/15 bg-white/[0.03] font-mono text-base font-bold text-amber-200">
          {showOp ? Math.abs(value) : value}
        </div>
        <button
          type="button"
          onClick={onPlus}
          aria-label="증가"
          className="h-8 w-7 rounded-r-md border border-white/15 bg-white/5 text-base font-bold text-slate-200 transition hover:border-cyan-300 hover:bg-cyan-400/20"
        >
          +
        </button>
      </div>
      <span className="font-serif italic text-base text-slate-300">{label}</span>
    </>
  );
}

// ─── 수식 문자열 빌드 ──────────────────────────────────────
function buildEqText(coeffs: number[], labels: string[]): string {
  const n = coeffs.length;
  let s = "";
  let first = true;
  for (let i = 0; i < n; i++) {
    const c = coeffs[i];
    const lbl = labels[i];
    if (c === 0 && i < n - 1) continue; // 중간 0 항 생략 (상수항이 0 이면 표시)
    const absC = Math.abs(c);
    if (first) {
      // 첫 항
      if (lbl) {
        s += c < 0 ? "−" : "";
        if (absC !== 1) s += absC;
      } else {
        s += c < 0 ? `−${absC}` : `${absC}`;
      }
    } else {
      s += c < 0 ? " − " : " + ";
      if (lbl) {
        if (absC !== 1) s += absC;
      } else {
        s += absC;
      }
    }
    s += lbl;
    first = false;
  }
  if (!s) s = "0";
  return `${s} = 0`;
}

// ─── Durand–Kerner 다항식 근 풀이 ──────────────────────────
function durandKerner(coeffs: number[]): Complex[] {
  const n = coeffs.length - 1;
  if (n === 0) return [];
  if (n === 1) return [{ r: -coeffs[1] / coeffs[0], i: 0 }];
  const a = coeffs[0];
  const p = coeffs.map((c) => c / a);

  function evPoly(z: Complex): Complex {
    let re = p[0];
    let im = 0;
    for (let k = 1; k <= n; k++) {
      const nr = re * z.r - im * z.i + p[k];
      const ni = re * z.i + im * z.r;
      re = nr;
      im = ni;
    }
    return { r: re, i: im };
  }

  // 초기값: w = 0.4 + 0.9i 의 거듭제곱
  const WR = 0.4;
  const WI = 0.9;
  const roots: Complex[] = [];
  let wr = 1;
  let wi = 0;
  for (let k = 0; k < n; k++) {
    roots.push({ r: wr, i: wi });
    const nr = wr * WR - wi * WI;
    const ni = wr * WI + wi * WR;
    wr = nr;
    wi = ni;
  }

  for (let iter = 0; iter < 600; iter++) {
    let maxD = 0;
    for (let i = 0; i < n; i++) {
      const fz = evPoly(roots[i]);
      let dr = 1;
      let di = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const qr = roots[i].r - roots[j].r;
        const qi = roots[i].i - roots[j].i;
        const nr = dr * qr - di * qi;
        const ni = dr * qi + di * qr;
        dr = nr;
        di = ni;
      }
      const d2 = dr * dr + di * di;
      if (d2 < 1e-300) continue;
      const delR = (fz.r * dr + fz.i * di) / d2;
      const delI = (fz.i * dr - fz.r * di) / d2;
      roots[i].r -= delR;
      roots[i].i -= delI;
      maxD = Math.max(maxD, Math.sqrt(delR * delR + delI * delI));
    }
    if (maxD < 1e-13) break;
  }
  return roots;
}

function sortRoots(roots: Complex[]): Complex[] {
  return [...roots].sort((a, b) => {
    const EPS = 5e-7;
    const ia = Math.abs(a.i) < EPS;
    const ib = Math.abs(b.i) < EPS;
    if (ia && !ib) return -1;
    if (!ia && ib) return 1;
    if (ia && ib) return a.r - b.r;
    return b.i - a.i;
  });
}

function fmtRoot(z: Complex): { str: string; type: "real" | "complex" } {
  const EPS = 5e-7;
  const re = Math.abs(z.r) < EPS ? 0 : Math.round(z.r * 10000) / 10000;
  const im = Math.abs(z.i) < EPS ? 0 : Math.round(z.i * 10000) / 10000;
  if (im === 0) return { str: String(re), type: "real" };
  const aim = Math.abs(im);
  const aimStr = aim === 1 ? "i" : `${aim}i`;
  if (re === 0) {
    return { str: im < 0 ? `−${aimStr}` : aimStr, type: "complex" };
  }
  const sign = im > 0 ? " + " : " − ";
  return { str: `${re}${sign}${aimStr}`, type: "complex" };
}

// ─── 복소 평면 SVG ──────────────────────────────────────────
function ComplexPlane({ roots }: { roots: Complex[] }) {
  // 자동 범위
  let m = 1.5;
  roots.forEach((r) => {
    m = Math.max(m, Math.abs(r.r), Math.abs(r.i));
  });
  const range = Math.ceil(m * 1.2);
  const step = range > 5 ? 2 : range > 2 ? 1 : 0.5;

  const W = 480;
  const H = 380;
  const PAD = 36;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const OX = W / 2;
  const OY = H / 2;
  const sc = Math.min(innerW, innerH) / (range * 2);

  function toX(re: number) {
    return OX + re * sc;
  }
  function toY(im: number) {
    return OY - im * sc;
  }

  const gridLines: React.ReactElement[] = [];
  for (let v = -range; v <= range + 1e-9; v += step) {
    if (Math.abs(v) < 1e-9) continue;
    gridLines.push(
      <line
        key={`gv-${v}`}
        x1={toX(v)}
        x2={toX(v)}
        y1={toY(-range)}
        y2={toY(range)}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.8"
      />,
    );
    gridLines.push(
      <line
        key={`gh-${v}`}
        x1={toX(-range)}
        x2={toX(range)}
        y1={toY(v)}
        y2={toY(v)}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="0.8"
      />,
    );
  }

  const ticks: number[] = [];
  for (let v = -Math.floor(range); v <= Math.floor(range); v++) {
    if (v !== 0) ticks.push(v);
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950/50">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label="복소 평면 위 근의 위치"
      >
        <rect width={W} height={H} fill="url(#planeGrad)" />
        <defs>
          <linearGradient id="planeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#040b1a" />
            <stop offset="100%" stopColor="#080d1e" />
          </linearGradient>
        </defs>
        {gridLines}
        {/* 축 */}
        <line
          x1={toX(-range)}
          x2={toX(range)}
          y1={OY}
          y2={OY}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5"
        />
        <line
          x1={OX}
          x2={OX}
          y1={toY(-range)}
          y2={toY(range)}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5"
        />
        {/* 축 라벨 */}
        <text
          x={toX(range) - 4}
          y={OY - 8}
          textAnchor="end"
          className="font-serif"
          fontSize="13"
          fontStyle="italic"
          fill="rgba(255,255,255,0.55)"
        >
          Re
        </text>
        <text
          x={OX + 8}
          y={toY(range) + 12}
          textAnchor="start"
          className="font-serif"
          fontSize="13"
          fontStyle="italic"
          fill="rgba(255,255,255,0.55)"
        >
          Im
        </text>
        {/* 눈금 라벨 */}
        {ticks.map((v) => (
          <text
            key={`tx-${v}`}
            x={toX(v)}
            y={OY + 14}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(255,255,255,0.4)"
          >
            {v}
          </text>
        ))}
        {ticks.map((v) => (
          <text
            key={`ty-${v}`}
            x={OX - 6}
            y={toY(v) + 3}
            textAnchor="end"
            fontSize="10"
            fill="rgba(255,255,255,0.4)"
          >
            {v}
          </text>
        ))}
        {/* 근 점들 */}
        {roots.map((r, i) => {
          const px = toX(r.r);
          const py = toY(r.i);
          const col = ROOT_COLORS[i % ROOT_COLORS.length];
          const labelOff = r.i >= 0 ? -16 : 18;
          return (
            <g key={`root-${i}`}>
              <circle cx={px} cy={py} r="12" fill="none" stroke={col} strokeWidth="1.2" opacity="0.45" />
              <circle
                cx={px}
                cy={py}
                r="6.5"
                fill={col}
                style={{ filter: `drop-shadow(0 0 6px ${col})` }}
              />
              <text
                x={px}
                y={py + labelOff}
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill={col}
              >
                근 {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="px-3 py-2 text-center text-xs text-slate-400">
        실근(Re 축 위): {roots.filter((r) => Math.abs(r.i) < 5e-7).length} 개 | 허근(Re
        축 밖): {roots.filter((r) => Math.abs(r.i) >= 5e-7).length} 개
      </p>
    </div>
  );
}
