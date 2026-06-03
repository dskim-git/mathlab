"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "table_helps",
    prompt:
      "주사위 2 개의 36 가지 결과를 6 × 6 표 로, 3 개의 216 가지 결과를 ‘파랑 주사위 값별 6 × 6 표 6 개’ 로 나누어 보았습니다. 이렇게 ‘표/그림으로 정리해서 헤아리는 방법’ 의 좋은 점과 한계는 무엇인가요?",
    kind: "text",
    placeholder:
      "예: 좋은 점 — 조건에 맞는 경우를 ‘눈으로 직접’ 셀 수 있어 빠진 경우나 중복이 잘 보인다. 합·곱·최솟값 같은 조건도 칸 하나하나 확인하면 헷갈리지 않는다. 한계 — 주사위 수가 늘면 (3 개 → 216 칸, 4 개 → 1296 칸) 그림이 폭발해 손으로 그릴 수 없게 된다. 그래서 ‘합의 법칙·곱의 법칙·여사건’ 같은 ‘세는 도구’ 가 필요해진다.",
  },
  {
    id: "complement_strategy",
    prompt:
      "‘세 눈 중 적어도 하나가 6 인 경우 = 전체 216 − 세 눈 모두 6 이 아닌 경우 (5³ = 125) = 91’ 처럼 ‘전체에서 반대 경우를 빼는 전략 (여사건)’ 이 왜 편리한지, 직접 세는 방법과 비교해 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: ‘적어도 하나가 6’ 을 직접 세려면 (6 하나만 / 6 두 개 / 6 세 개) 로 나누어 각각 세어 합쳐야 한다 (3·5² + 3·5 + 1 = 91). 분기가 많고 실수하기 쉽다. 반대 사건 ‘세 눈 모두 6 이 아님’ 은 ‘각 자리 모두 5 가지’ 라 곱의 법칙으로 5³ 단번에 계산된다. ‘적어도’ 가 들어가면 여사건이 거의 항상 더 짧다.",
  },
];

// ─── 표기 ─────────────────────────────────────────────────
const DIE_FACES: Record<number, string> = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅",
};

// ─── 메인 ─────────────────────────────────────────────────
type TabId = 1 | 2 | 3;

export default function DiceCountingExplorer() {
  const [tab, setTab] = useState<TabId>(1);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 주사위로 경우의 수 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          주사위 1 ~ 3 개를 던졌을 때의 결과를{" "}
          <b className="text-violet-200">표·그림</b> 으로 정리하고, 조건에 맞는 경우의
          수를 직접 헤아려 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <TabBtn active={tab === 1} onClick={() => setTab(1)}>
          🎲 주사위 1 개
        </TabBtn>
        <TabBtn active={tab === 2} onClick={() => setTab(2)}>
          🎲🎲 주사위 2 개
        </TabBtn>
        <TabBtn active={tab === 3} onClick={() => setTab(3)}>
          🎲🎲🎲 주사위 3 개
        </TabBtn>
      </div>

      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <Tab1OneDie />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <Tab2TwoDice />
      </div>
      <div className={tab === 3 ? "mt-5" : "mt-5 hidden"}>
        <Tab3ThreeDice />
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
          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-violet-200")
      }
    >
      {children}
    </button>
  );
}

// ─── 공용: 질문 리스트 + 결과 박스 ────────────────────────

function QuestionList({
  items,
  selected,
  onSelect,
}: {
  items: { q: string }[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={
            "rounded-lg border-2 px-3 py-2 text-left text-sm leading-6 transition " +
            (selected === i
              ? "border-violet-300 bg-violet-400/20 text-violet-100"
              : "border-white/10 bg-white/5 text-slate-300 hover:border-violet-300/50 hover:bg-violet-400/[0.08]")
          }
        >
          Q{i + 1}. {item.q}
        </button>
      ))}
    </div>
  );
}

function ResultBox({
  show,
  count,
  hint,
}: {
  show: boolean;
  count: number;
  hint: string;
}) {
  if (!show) return null;
  return (
    <div className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.08] px-4 py-3">
      <p className="font-mono text-2xl font-extrabold text-amber-200">
        {count} 가지
      </p>
      <p className="mt-1 text-xs leading-7 text-amber-100">{hint}</p>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded border border-emerald-400/50 bg-emerald-400/25" />
        조건에 맞는 경우
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded border border-white/10 bg-white/[0.03]" />
        조건에 맞지 않는 경우
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 주사위 1 개 (6 칸)
// ═══════════════════════════════════════════════════════════

type Q1Item = { q: string; cond: (d: number) => boolean; answer: number; hint: string };

const Q1: Q1Item[] = [
  {
    q: "짝수의 눈이 나오는 경우는?",
    cond: (d) => d % 2 === 0,
    answer: 3,
    hint: "해당: {2, 4, 6} → 3 가지",
  },
  {
    q: "홀수의 눈이 나오는 경우는?",
    cond: (d) => d % 2 === 1,
    answer: 3,
    hint: "해당: {1, 3, 5} → 3 가지",
  },
  {
    q: "소수의 눈이 나오는 경우는?",
    cond: (d) => [2, 3, 5].includes(d),
    answer: 3,
    hint: "해당: {2, 3, 5} → 3 가지 (1 은 소수가 아니에요!)",
  },
  {
    q: "4 이상의 눈이 나오는 경우는?",
    cond: (d) => d >= 4,
    answer: 3,
    hint: "해당: {4, 5, 6} → 3 가지",
  },
  {
    q: "3 의 배수의 눈이 나오는 경우는?",
    cond: (d) => d % 3 === 0,
    answer: 2,
    hint: "해당: {3, 6} → 2 가지",
  },
  {
    q: "짝수이거나 3 의 배수인 눈이 나오는 경우는? (합의 법칙 적용!)",
    cond: (d) => d % 2 === 0 || d % 3 === 0,
    answer: 4,
    hint: "짝수 {2,4,6} 3 가지, 3 의 배수 {3,6} 2 가지, 공통 {6} → 3 + 2 − 1 = 4 가지",
  },
];

function Tab1OneDie() {
  const [sel, setSel] = useState(0);
  const q = Q1[sel];

  return (
    <div className="space-y-4">
      <QuestionList items={Q1} selected={sel} onSelect={setSel} />
      <ResultBox show count={q.answer} hint={q.hint} />

      {/* 6 칸 dice row */}
      <div className="flex flex-wrap justify-center gap-2">
        {[1, 2, 3, 4, 5, 6].map((d) => {
          const matched = q.cond(d);
          return (
            <div
              key={d}
              className={
                "flex h-20 w-16 flex-col items-center justify-center rounded-xl border-2 transition sm:h-24 sm:w-20 " +
                (matched
                  ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100 shadow-lg shadow-emerald-500/20"
                  : "border-white/10 bg-white/[0.03] text-slate-500 opacity-60")
              }
            >
              <span className="text-3xl">{DIE_FACES[d]}</span>
              <span className="mt-1 text-[10px]">눈 {d}</span>
            </div>
          );
        })}
      </div>

      <Legend />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 주사위 2 개 (6×6 표)
// ═══════════════════════════════════════════════════════════

type Mode = "sum" | "prod" | "min" | "max";
const MODE_LABEL: Record<Mode, string> = {
  sum: "⊕ 두 눈의 합",
  prod: "✕ 두 눈의 곱",
  min: "↓ 최솟값",
  max: "↑ 최댓값",
};
const MODE_FN: Record<Mode, (a: number, b: number) => number> = {
  sum: (a, b) => a + b,
  prod: (a, b) => a * b,
  min: (a, b) => Math.min(a, b),
  max: (a, b) => Math.max(a, b),
};

type Q2Item = {
  q: string;
  cond: (a: number, b: number) => boolean;
  answer: number;
  hint: string;
};

const Q2_BY_MODE: Record<Mode, Q2Item[]> = {
  sum: [
    {
      q: "두 눈의 합이 7 인 경우는?",
      cond: (a, b) => a + b === 7,
      answer: 6,
      hint: "(1,6)(2,5)(3,4)(4,3)(5,2)(6,1) → 6 가지",
    },
    {
      q: "두 눈의 합이 5 이하인 경우는?",
      cond: (a, b) => a + b <= 5,
      answer: 10,
      hint: "(1,1)(1,2)(1,3)(1,4)(2,1)(2,2)(2,3)(3,1)(3,2)(4,1) → 10 가지",
    },
    {
      q: "두 눈의 합이 짝수인 경우는?",
      cond: (a, b) => (a + b) % 2 === 0,
      answer: 18,
      hint: "둘 다 짝수(3×3 = 9) 또는 둘 다 홀수(3×3 = 9) → 9 + 9 = 18 가지",
    },
    {
      q: "두 눈의 합이 10 이상인 경우는?",
      cond: (a, b) => a + b >= 10,
      answer: 6,
      hint: "(4,6)(5,5)(5,6)(6,4)(6,5)(6,6) → 6 가지",
    },
  ],
  prod: [
    {
      q: "두 눈의 곱이 12 인 경우는?",
      cond: (a, b) => a * b === 12,
      answer: 4,
      hint: "(2,6)(3,4)(4,3)(6,2) → 4 가지",
    },
    {
      q: "두 눈의 곱이 6 이하인 경우는?",
      cond: (a, b) => a * b <= 6,
      answer: 14,
      hint: "(1,1~6) 6 + (2,1~3) 3 + (3,1~2) 2 + (4,1)(5,1)(6,1) → 14 가지",
    },
    {
      q: "두 눈의 곱이 홀수인 경우는?",
      cond: (a, b) => (a * b) % 2 === 1,
      answer: 9,
      hint: "두 눈 모두 홀수여야 함 → {1,3,5}×{1,3,5} = 9 가지",
    },
    {
      q: "두 눈의 곱이 완전제곱수인 경우는?",
      cond: (a, b) => [1, 4, 9, 16, 25, 36].includes(a * b),
      answer: 14,
      hint: "곱이 1, 4, 9, 16, 25, 36 인 경우를 표에서 세어 보세요 → 14 가지",
    },
  ],
  min: [
    {
      q: "두 눈의 최솟값이 3 인 경우는?",
      cond: (a, b) => Math.min(a, b) === 3,
      answer: 7,
      hint: "(3,3)(3,4)(3,5)(3,6)(4,3)(5,3)(6,3) → 7 가지",
    },
    {
      q: "두 눈의 최솟값이 4 이상인 경우는?",
      cond: (a, b) => Math.min(a, b) >= 4,
      answer: 9,
      hint: "두 눈 모두 4 이상 → {4,5,6}×{4,5,6} = 9 가지",
    },
    {
      q: "두 눈의 최솟값이 2 이하인 경우는?",
      cond: (a, b) => Math.min(a, b) <= 2,
      answer: 20,
      hint: "전체 36 − 최솟값이 3 이상인 경우(4×4 = 16) = 36 − 16 = 20 가지 (여사건)",
    },
    {
      q: "두 눈의 최솟값과 최댓값이 같은 경우는?",
      cond: (a, b) => a === b,
      answer: 6,
      hint: "두 눈이 같은 경우 → (1,1)(2,2)(3,3)(4,4)(5,5)(6,6) → 6 가지",
    },
  ],
  max: [
    {
      q: "두 눈의 최댓값이 4 인 경우는?",
      cond: (a, b) => Math.max(a, b) === 4,
      answer: 7,
      hint: "(4,1)(4,2)(4,3)(4,4)(1,4)(2,4)(3,4) → 7 가지",
    },
    {
      q: "두 눈의 최댓값이 3 이하인 경우는?",
      cond: (a, b) => Math.max(a, b) <= 3,
      answer: 9,
      hint: "두 눈 모두 3 이하 → {1,2,3}×{1,2,3} = 9 가지",
    },
    {
      q: "두 눈의 최댓값이 5 이상인 경우는?",
      cond: (a, b) => Math.max(a, b) >= 5,
      answer: 20,
      hint: "전체 36 − 최댓값이 4 이하인 경우(4×4 = 16) = 36 − 16 = 20 가지 (여사건)",
    },
    {
      q: "두 눈의 최댓값이 최솟값의 2 배 이상인 경우는?",
      cond: (a, b) => Math.max(a, b) >= 2 * Math.min(a, b),
      answer: 17,
      hint: "표를 보며 해당 칸을 세어 보세요 → 17 가지",
    },
  ],
};

function Tab2TwoDice() {
  const [mode, setMode] = useState<Mode>("sum");
  const [sel, setSel] = useState(0);
  const items = Q2_BY_MODE[mode];
  const q = items[sel];
  const fn = MODE_FN[mode];

  function chooseMode(m: Mode) {
    setMode(m);
    setSel(0);
  }

  return (
    <div className="space-y-4">
      {/* 모드 선택 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => chooseMode(m)}
            className={
              "rounded-lg border-2 px-3 py-2 text-sm font-bold transition " +
              (mode === m
                ? "border-violet-300 bg-violet-400/20 text-violet-100"
                : "border-white/15 bg-white/5 text-slate-300 hover:border-violet-300/50 hover:bg-violet-400/[0.08]")
            }
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      <QuestionList items={items} selected={sel} onSelect={setSel} />
      <ResultBox show count={q.answer} hint={q.hint} />

      {/* 6×6 표 — 정사각형 + 중앙 정렬 */}
      <div className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 p-2">
        <table className="h-full w-full border-collapse text-center text-sm">
          <thead>
            <tr>
              <th className="border border-white/10 bg-white/[0.03] px-1 py-1 text-[10px] leading-3 text-slate-500">
                보라
                <br />
                ──
                <br />
                파랑
              </th>
              {[1, 2, 3, 4, 5, 6].map((c) => (
                <th
                  key={c}
                  className="border border-white/10 bg-white/[0.06] px-1 py-1 font-bold text-amber-300"
                >
                  {DIE_FACES[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map((r) => (
              <tr key={r}>
                <th className="border border-white/10 bg-white/[0.06] px-1 py-1 font-bold text-violet-300">
                  {DIE_FACES[r]}
                </th>
                {[1, 2, 3, 4, 5, 6].map((c) => {
                  const matched = q.cond(r, c);
                  return (
                    <td
                      key={c}
                      className={
                        "border border-white/10 px-1 py-1 font-mono transition " +
                        (matched
                          ? "bg-emerald-400/25 font-bold text-emerald-100"
                          : "bg-white/[0.02] text-slate-500")
                      }
                    >
                      {fn(r, c)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        보라 주사위 ↔ 행, 파랑 주사위 ↔ 열. 표 안의 숫자 = 선택한 모드의 결과.
      </p>
      <Legend />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 3 — 주사위 3 개 (파랑 = 6 별 6×6 표)
// ═══════════════════════════════════════════════════════════

type Q3Item = {
  q: string;
  cond: (a: number, b: number, c: number) => boolean;
  answer: number;
  hint: string;
};

const Q3: Q3Item[] = [
  {
    q: "세 눈이 모두 같은 경우는?",
    cond: (a, b, c) => a === b && b === c,
    answer: 6,
    hint: "(1,1,1)(2,2,2)(3,3,3)(4,4,4)(5,5,5)(6,6,6) → 6 가지",
  },
  {
    q: "세 눈의 합이 15 이상인 경우는?",
    cond: (a, b, c) => a + b + c >= 15,
    answer: 20,
    hint: "합 15: 10, 합 16: 6, 합 17: 3, 합 18: 1 → 20 가지",
  },
  {
    q: "세 눈의 최솟값이 4 인 경우는?",
    cond: (a, b, c) => Math.min(a, b, c) === 4,
    answer: 19,
    hint: "모두 ≥ 4 (3³ = 27) − 모두 ≥ 5 (2³ = 8) = 19 가지",
  },
  {
    q: "세 눈의 최댓값이 3 인 경우는?",
    cond: (a, b, c) => Math.max(a, b, c) === 3,
    answer: 19,
    hint: "모두 ≤ 3 (3³ = 27) − 모두 ≤ 2 (2³ = 8) = 19 가지",
  },
  {
    q: "세 눈 중 적어도 하나가 6 인 경우는?",
    cond: (a, b, c) => a === 6 || b === 6 || c === 6,
    answer: 91,
    hint: "전체 216 − 모두 6 이 아닌 경우(5³ = 125) = 91 가지 (여사건)",
  },
];

function Tab3ThreeDice() {
  const [sel, setSel] = useState(0);
  const q = Q3[sel];

  // 각 파랑 값 k 에 대한 매칭 카운트
  const perK = useMemo(() => {
    const cnts: number[] = [];
    let total = 0;
    for (let k = 1; k <= 6; k++) {
      let cnt = 0;
      for (let r = 1; r <= 6; r++) {
        for (let c = 1; c <= 6; c++) {
          if (q.cond(k, r, c)) cnt++;
        }
      }
      cnts.push(cnt);
      total += cnt;
    }
    return { cnts, total };
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.07] px-4 py-2.5 text-xs leading-7 text-slate-200">
        <b className="text-cyan-300">파랑 주사위</b> 값에 따라 6 개의 6 × 6 표로
        나눴습니다. 각 표에서{" "}
        <b className="text-violet-300">보라(행)</b> 와{" "}
        <b className="text-amber-300">노랑(열)</b> 의 결과를 확인하세요. 전체 경우의 수:{" "}
        <b className="text-amber-200">6 × 6 × 6 = 216</b> 가지.
      </div>

      <QuestionList items={Q3} selected={sel} onSelect={setSel} />
      <ResultBox show count={perK.total} hint={q.hint} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((k, idx) => (
          <div
            key={k}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2"
          >
            <p className="mb-1 text-center text-xs font-bold text-cyan-200">
              파랑 = <span className="text-base text-cyan-100">{DIE_FACES[k]}</span> ({k})
            </p>
            <table className="w-full border-collapse text-center text-[10px]">
              <thead>
                <tr>
                  <th className="border border-white/10 bg-white/[0.03] px-0.5 py-0.5 text-slate-500">
                    ·
                  </th>
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <th
                      key={c}
                      className="border border-white/10 bg-white/[0.06] px-0.5 py-0.5 font-bold text-amber-300"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6].map((r) => (
                  <tr key={r}>
                    <th className="border border-white/10 bg-white/[0.06] px-0.5 py-0.5 font-bold text-violet-300">
                      {r}
                    </th>
                    {[1, 2, 3, 4, 5, 6].map((c) => {
                      const matched = q.cond(k, r, c);
                      return (
                        <td
                          key={c}
                          className={
                            "border border-white/5 px-0.5 py-0.5 transition " +
                            (matched
                              ? "bg-emerald-400/30"
                              : "bg-white/[0.02]")
                          }
                        >
                          {matched ? "●" : " "}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1 text-center text-[10px] text-slate-400">
              해당:{" "}
              <span className="font-mono font-bold text-emerald-300">
                {perK.cnts[idx]}
              </span>{" "}
              칸
            </p>
          </div>
        ))}
      </div>

      <Legend />
    </div>
  );
}
