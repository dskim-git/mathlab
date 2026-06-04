"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "mul_pattern_explanation",
    prompt:
      "행렬곱 AB 의 (i, j) 성분은 ‘A 의 i 행 × B 의 j 열’ 패턴으로 계산됩니다. 탭 ① 카페 시나리오에서 (AB) 의 (1, 1) 성분 = ‘A 반이 카페 P 에 낼 금액’ 이 ‘아메리카노 3 잔 × 3000 원 + 라떼 5 잔 × 2500 원’ 으로 계산되는 이유를, ‘A 의 1 행 = A 반의 음료 수량’ 과 ‘B 의 1 열 = 카페 P 의 음료 가격’ 의 곱으로 어떻게 자연스럽게 나오는지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: A 의 1 행 [3, 5] 는 ‘A 반이 아메리카노 3 잔, 라떼 5 잔 주문’ 을 뜻하고, B 의 1 열 [3000, 4500] 은 ‘카페 P 의 아메리카노 가격, 라떼 가격’ 을 뜻한다. 두 벡터를 각 음료별로 짝지어 곱하고 (= 3×3000, 5×4500), 모두 더하면 ‘A 반이 카페 P 에서 결제할 총 금액’ 이 나온다. 즉 행렬곱은 ‘공통된 음료라는 축을 따라 수량 × 단가를 합산’ 하는 자연스러운 표현이다.",
  },
  {
    id: "mul_dimension_condition",
    prompt:
      "행렬곱 A × B 가 정의되려면 ‘A 의 열 수 = B 의 행 수’ 라는 조건이 필요합니다. 세 시나리오 (카페 · 운동 · 독서) 에서 ‘무엇이 A 의 열 = B 의 행 으로 짝지어졌는지’ 각각 적어 보고, 만약 이 조건이 맞지 않으면 어떤 문제가 생기는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: ① 카페: A 의 열 = 음료 종류 (아메리카노, 라떼), B 의 행 = 음료 종류 → 같음 ✓. ② 운동: A 의 열 = 운동 종목 (줄넘기, 수영), B 의 행 = 운동 종목 → 같음 ✓. ③ 독서: A 의 열 = 책 종류 (소설, 과학책), B 의 행 = 책 종류 → 같음 ✓. 만약 A 의 열 수와 B 의 행 수가 다르면 ‘짝지어 곱할 대응 항목’ 이 어긋나서 계산이 정의되지 않는다. (예: A 행이 ‘음료 2 종류’ 인데 B 행이 ‘교통 3 종류’ 면 의미 있는 합산이 불가능)",
  },
];

// ─── 데이터 (3 시나리오) ───────────────────────────────────
type Scenario = {
  id: number;
  icon: string;
  title: string;
  tone: {
    text: string; // tailwind text class
    bg: string;
    border: string;
    grad: string; // tab active gradient
  };
  story: ReactNode;
  A: {
    data: number[][];
    rowLabels: string[];
    colLabels: string[];
    subdesc: string;
  };
  B: {
    data: number[][];
    rowLabels: string[];
    colLabels: string[];
    subdesc: string;
  };
  R: {
    data: number[][];
    rowLabels: string[];
    colLabels: string[];
    unit: string;
    meanings: string[][]; // [r][c]
  };
  ch: { r: number; c: number };
  chQ: ReactNode;
};

const SCENARIOS: Scenario[] = [
  {
    id: 0,
    icon: "☕",
    title: "카페 주문 분석",
    tone: {
      text: "text-amber-300",
      bg: "bg-amber-500/12",
      border: "border-amber-500/30",
      grad: "from-amber-700 to-amber-500",
    },
    story: (
      <>
        A 반과 B 반이 현장학습 후 카페를 방문했어요.
        <br />두 반이 카페 P, Q 중 어디서 주문하면 얼마를 내야 할까요?
      </>
    ),
    A: {
      data: [
        [3, 5],
        [4, 2],
      ],
      rowLabels: ["A 반", "B 반"],
      colLabels: ["아메리카노", "라떼"],
      subdesc: "주문 수량 (잔)",
    },
    B: {
      data: [
        [3000, 2500],
        [4500, 4000],
      ],
      rowLabels: ["아메리카노", "라떼"],
      colLabels: ["카페 P", "카페 Q"],
      subdesc: "음료 가격 (원)",
    },
    R: {
      data: [
        [31500, 27500],
        [21000, 18000],
      ],
      rowLabels: ["A 반", "B 반"],
      colLabels: ["카페 P", "카페 Q"],
      unit: "원",
      meanings: [
        ["A 반이 카페 P 에 낼 금액", "A 반이 카페 Q 에 낼 금액"],
        ["B 반이 카페 P 에 낼 금액", "B 반이 카페 Q 에 낼 금액"],
      ],
    },
    ch: { r: 0, c: 1 },
    chQ: (
      <>
        (AB) 의 (1 행, 2 열) 은 <b>A 반이 카페 Q 에서 낼 총 금액</b> 이에요.
        <br />
        아메리카노 3 잔 × 2500 원 + 라떼 5 잔 × 4000 원을 계산해보세요!
      </>
    ),
  },
  {
    id: 1,
    icon: "🏃",
    title: "운동 효과 분석",
    tone: {
      text: "text-emerald-300",
      bg: "bg-emerald-500/12",
      border: "border-emerald-500/30",
      grad: "from-emerald-700 to-emerald-500",
    },
    story: (
      <>
        지현과 태오가 일주일 동안 줄넘기와 수영을 꾸준히 했어요.
        <br />각자 얼마나 칼로리를 소모하고 심폐 능력이 향상될까요?
      </>
    ),
    A: {
      data: [
        [4, 3],
        [2, 5],
      ],
      rowLabels: ["지현", "태오"],
      colLabels: ["줄넘기", "수영"],
      subdesc: "주간 운동 시간 (h)",
    },
    B: {
      data: [
        [600, 3],
        [500, 4],
      ],
      rowLabels: ["줄넘기", "수영"],
      colLabels: ["칼로리 (kcal)", "심폐지수"],
      subdesc: "1시간당 효과",
    },
    R: {
      data: [
        [3900, 24],
        [3700, 26],
      ],
      rowLabels: ["지현", "태오"],
      colLabels: ["칼로리 (kcal)", "심폐지수"],
      unit: "",
      meanings: [
        ["지현의 주간 칼로리 소모", "지현의 심폐지수 향상"],
        ["태오의 주간 칼로리 소모", "태오의 심폐지수 향상"],
      ],
    },
    ch: { r: 1, c: 1 },
    chQ: (
      <>
        (AB) 의 (2 행, 2 열) 은 <b>태오의 심폐지수 향상</b> 이에요.
        <br />
        줄넘기 2 h × 3 + 수영 5 h × 4 를 계산해보세요!
      </>
    ),
  },
  {
    id: 2,
    icon: "📚",
    title: "독서 효과 분석",
    tone: {
      text: "text-violet-300",
      bg: "bg-violet-500/12",
      border: "border-violet-500/30",
      grad: "from-violet-700 to-violet-500",
    },
    story: (
      <>
        수아와 준호는 매주 소설과 과학책을 읽어요.
        <br />이 독서 습관이 국어 · 과학 점수에 얼마나 도움이 될까요?
      </>
    ),
    A: {
      data: [
        [5, 3],
        [2, 7],
      ],
      rowLabels: ["수아", "준호"],
      colLabels: ["소설", "과학책"],
      subdesc: "주간 독서 시간 (h)",
    },
    B: {
      data: [
        [8, 2],
        [3, 9],
      ],
      rowLabels: ["소설", "과학책"],
      colLabels: ["국어점수", "과학점수"],
      subdesc: "시간당 점수 향상 (점/h)",
    },
    R: {
      data: [
        [49, 37],
        [37, 67],
      ],
      rowLabels: ["수아", "준호"],
      colLabels: ["국어 향상", "과학 향상"],
      unit: "점",
      meanings: [
        ["수아의 국어 점수 향상", "수아의 과학 점수 향상"],
        ["준호의 국어 점수 향상", "준호의 과학 점수 향상"],
      ],
    },
    ch: { r: 0, c: 0 },
    chQ: (
      <>
        (AB) 의 (1 행, 1 열) 은 <b>수아의 국어 점수 향상</b> 이에요.
        <br />
        소설 5 h × 8 점 + 과학책 3 h × 3 점을 계산해보세요!
      </>
    ),
  },
];

// ─── 메인 ─────────────────────────────────────────────────
export default function MatrixMulReallife() {
  const [tab, setTab] = useState<0 | 1 | 2>(0);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🛒 행렬 곱셈 실생활 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          세 가지 실생활 상황에서 행렬곱{" "}
          <b className="font-mono text-cyan-300">A × B</b> 가 어떻게 자연스럽게
          나오는지 탐구해 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {SCENARIOS.map((s, i) => (
          <ScenarioTabBtn
            key={s.id}
            active={tab === i}
            tone={s.tone}
            onClick={() => setTab(i as 0 | 1 | 2)}
          >
            <span className="text-lg leading-none">{s.icon}</span>
            <span className="mt-1 block text-[11px] sm:text-xs">{s.title}</span>
          </ScenarioTabBtn>
        ))}
      </div>

      {SCENARIOS.map((s, i) => (
        <div key={s.id} className={tab === i ? "mt-5" : "mt-5 hidden"}>
          <ScenarioPanel key={s.id} sc={s} />
        </div>
      ))}

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function ScenarioTabBtn({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: Scenario["tone"];
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl px-3 py-2.5 text-center font-bold transition " +
        (active
          ? `bg-gradient-to-br ${tone.grad} text-white shadow-lg`
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ─── 공용 UI ──────────────────────────────────────────────
function MatrixBracket({
  children,
  n,
  cellH = 36,
  gap = 4,
}: {
  children: ReactNode;
  n: number;
  cellH?: number;
  gap?: number;
}) {
  const h = n * cellH + (n - 1) * gap + 4;
  return (
    <div className="flex items-stretch gap-1">
      <svg width={10} height={h} viewBox={`0 0 10 ${h}`} aria-hidden>
        <path
          d={`M 8 1 L 1 1 L 1 ${h - 1} L 8 ${h - 1}`}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
      <div>{children}</div>
      <svg width={10} height={h} viewBox={`0 0 10 ${h}`} aria-hidden>
        <path
          d={`M 2 1 L 9 1 L 9 ${h - 1} L 2 ${h - 1}`}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// ─── 시나리오 패널 ────────────────────────────────────────
function ScenarioPanel({ sc }: { sc: Scenario }) {
  // 클릭하여 reveal 된 결과 셀들 + 챌린지 정답 여부
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [chInput, setChInput] = useState<string>("");
  const [chStatus, setChStatus] = useState<"idle" | "ok" | "bad">("idle");
  const [showCalc, setShowCalc] = useState<{ r: number; c: number } | null>(null);

  function clickResult(r: number, c: number) {
    // 챌린지 셀이면 무시 (직접 입력해야 함)
    if (r === sc.ch.r && c === sc.ch.c) return;
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(`${r}-${c}`);
      return next;
    });
    setShowCalc({ r, c });
  }

  function revealAll() {
    const all = new Set<string>();
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 2; c++) all.add(`${r}-${c}`);
    setRevealed(all);
    // 챌린지 셀도 채점 (정답으로)
    setChInput(String(sc.R.data[sc.ch.r][sc.ch.c]));
    setChStatus("ok");
    setShowCalc({ r: sc.ch.r, c: sc.ch.c });
  }

  function checkCh() {
    if (chInput.trim() === "") return;
    const v = parseFloat(chInput.replace("−", "-"));
    const target = sc.R.data[sc.ch.r][sc.ch.c];
    if (Number.isFinite(v) && v === target) {
      setChStatus("ok");
      setRevealed((prev) => {
        const next = new Set(prev);
        next.add(`${sc.ch.r}-${sc.ch.c}`);
        return next;
      });
      setShowCalc({ r: sc.ch.r, c: sc.ch.c });
    } else {
      setChStatus("bad");
    }
  }

  const allDone =
    revealed.size === 4 && (chStatus === "ok" || revealed.has(`${sc.ch.r}-${sc.ch.c}`));

  return (
    <div className="space-y-3">
      {/* 스토리 카드 */}
      <div className={`rounded-xl border ${sc.tone.border} ${sc.tone.bg} p-4`}>
        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none">{sc.icon}</span>
          <div>
            <p className={`text-base font-extrabold ${sc.tone.text}`}>{sc.title}</p>
            <p className="mt-1 text-sm leading-7 text-slate-300">{sc.story}</p>
          </div>
        </div>
      </div>

      {/* 안내 */}
      <p className="rounded-lg border border-cyan-400/30 bg-cyan-400/[0.06] px-3 py-2 text-center text-xs leading-7 text-slate-200">
        💡 <b className="text-amber-300">노란 테두리 칸</b> 의 값을 직접 계산해서
        입력해 보세요! 나머지 칸을 클릭하면 계산 과정을 확인할 수 있어요.
      </p>

      {/* A × B = AB */}
      <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
        <div className="flex flex-wrap items-end justify-center gap-3">
          <LabeledMatrix
            name="A"
            color="#38bdf8"
            data={sc.A.data}
            rowLabels={sc.A.rowLabels}
            colLabels={sc.A.colLabels}
            subdesc={sc.A.subdesc}
          />
          <OpSym>×</OpSym>
          <LabeledMatrix
            name="B"
            color="#a78bfa"
            data={sc.B.data}
            rowLabels={sc.B.rowLabels}
            colLabels={sc.B.colLabels}
            subdesc={sc.B.subdesc}
          />
          <OpSym>=</OpSym>
          <ResultMatrix sc={sc} revealed={revealed} onClickCell={clickResult} />
        </div>
      </div>

      {/* 계산 과정 패널 */}
      {showCalc ? (
        <CalcPanel
          sc={sc}
          r={showCalc.r}
          c={showCalc.c}
          onClose={() => setShowCalc(null)}
        />
      ) : null}

      {/* 직접 계산 챌린지 */}
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-extrabold text-amber-200">✏️ 직접 계산해보기</p>
        <p className="mt-1 text-xs leading-7 text-slate-300">{sc.chQ}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <input
            type="number"
            value={chInput}
            onChange={(e) => {
              setChInput(e.target.value);
              if (chStatus !== "idle") setChStatus("idle");
            }}
            onKeyDown={(e) => e.key === "Enter" && checkCh()}
            placeholder="답 입력"
            disabled={chStatus === "ok"}
            className={
              "w-36 rounded-md border bg-slate-900 px-3 py-1.5 text-center font-mono text-sm font-bold text-slate-100 [color-scheme:dark] " +
              (chStatus === "ok"
                ? "border-emerald-400/60"
                : chStatus === "bad"
                  ? "border-rose-400/60"
                  : "border-white/15")
            }
            aria-label="챌린지 답"
          />
          <button
            type="button"
            onClick={checkCh}
            disabled={chStatus === "ok"}
            className="rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 disabled:opacity-60"
          >
            ✓ 확인
          </button>
        </div>
        {chStatus === "ok" ? (
          <p className="mt-2 rounded-lg border border-emerald-400/45 bg-emerald-400/15 px-3 py-2 text-center text-sm font-bold text-emerald-100">
            🎯 정답! 행렬곱의 원리를 정확히 이해했어요!
          </p>
        ) : chStatus === "bad" ? (
          <p className="mt-2 rounded-lg border border-rose-400/45 bg-rose-400/15 px-3 py-2 text-center text-sm font-bold text-rose-100">
            ❌ 다시 계산해 보세요. 위 식대로 곱한 뒤 더하면 됩니다.
          </p>
        ) : null}
      </div>

      {/* 전체 결과 확인 */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={revealAll}
          className="rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:brightness-110"
        >
          🔓 전체 결과 확인하기
        </button>
      </div>

      {allDone ? (
        <p className="rounded-lg border border-amber-300/45 bg-amber-300/10 px-3 py-2 text-center text-sm font-bold text-amber-100">
          🎉 모든 결과 칸이 채워졌어요! 다른 시나리오 탭도 탐험해 보세요.
        </p>
      ) : null}
    </div>
  );
}

function OpSym({ children }: { children: ReactNode }) {
  return (
    <span className="self-center text-2xl font-bold text-slate-400">{children}</span>
  );
}

// ─── 레이블 있는 행렬 (A·B 용) ───────────────────────────
function LabeledMatrix({
  name,
  color,
  data,
  rowLabels,
  colLabels,
  subdesc,
}: {
  name: string;
  color: string;
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  subdesc: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-sm font-extrabold" style={{ color }}>
        {name}
      </span>
      {/* 열 라벨 */}
      <div className="ml-8 flex gap-1">
        {colLabels.map((cl, i) => (
          <div
            key={i}
            className="flex h-5 w-14 items-center justify-center text-[9px] font-bold leading-tight text-slate-400"
            style={{ wordBreak: "keep-all" }}
          >
            {cl}
          </div>
        ))}
      </div>
      {/* 행 라벨 + 행렬 */}
      <div className="flex items-center gap-1">
        <div className="flex flex-col gap-1">
          {rowLabels.map((rl, i) => (
            <div
              key={i}
              className="flex h-9 w-7 items-center justify-end text-[10px] font-bold text-slate-400"
            >
              {rl}
            </div>
          ))}
        </div>
        <MatrixBracket n={2}>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(2, 56px)` }}
          >
            {data.flat().map((v, i) => (
              <div
                key={i}
                className="flex h-9 items-center justify-center rounded-sm border border-white/10 bg-slate-900 font-mono text-sm font-bold"
                style={{ color }}
              >
                {v}
              </div>
            ))}
          </div>
        </MatrixBracket>
      </div>
      <p className="mt-1 text-[10px] text-slate-500">{subdesc}</p>
    </div>
  );
}

// ─── 결과 행렬 (AB) ───────────────────────────────────────
function ResultMatrix({
  sc,
  revealed,
  onClickCell,
}: {
  sc: Scenario;
  revealed: Set<string>;
  onClickCell: (r: number, c: number) => void;
}) {
  const color = "#22c55e";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-sm font-extrabold" style={{ color }}>
        AB
      </span>
      {/* 열 라벨 */}
      <div className="ml-9 flex gap-1">
        {sc.R.colLabels.map((cl, i) => (
          <div
            key={i}
            className="flex h-5 w-16 items-center justify-center text-[9px] font-bold leading-tight text-emerald-300/80"
            style={{ wordBreak: "keep-all" }}
          >
            {cl}
          </div>
        ))}
      </div>
      {/* 행 라벨 + 행렬 */}
      <div className="flex items-center gap-1">
        <div className="flex flex-col gap-1">
          {sc.R.rowLabels.map((rl, i) => (
            <div
              key={i}
              className="flex h-9 w-7 items-center justify-end text-[10px] font-bold text-emerald-300/80"
            >
              {rl}
            </div>
          ))}
        </div>
        <MatrixBracket n={2}>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(2, 64px)` }}>
            {Array.from({ length: 4 }, (_, i) => {
              const r = Math.floor(i / 2);
              const c = i % 2;
              const isCh = r === sc.ch.r && c === sc.ch.c;
              const isRevealed = revealed.has(`${r}-${c}`);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onClickCell(r, c)}
                  className={
                    "flex h-9 cursor-pointer items-center justify-center rounded-sm border font-mono text-sm font-bold transition " +
                    (isCh && !isRevealed
                      ? "border-amber-300/60 bg-amber-300/15 text-amber-200"
                      : isRevealed
                        ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
                        : "border-white/15 bg-slate-900 text-slate-500 hover:bg-slate-800")
                  }
                >
                  {isRevealed
                    ? sc.R.data[r][c]
                    : isCh
                      ? "?"
                      : "?"}
                </button>
              );
            })}
          </div>
        </MatrixBracket>
      </div>
      <p className="mt-1 text-[10px] text-slate-500">
        ← 클릭해서 계산 과정 확인!
      </p>
    </div>
  );
}

// ─── 계산 과정 패널 ──────────────────────────────────────
function CalcPanel({
  sc,
  r,
  c,
  onClose,
}: {
  sc: Scenario;
  r: number;
  c: number;
  onClose: () => void;
}) {
  const a1 = sc.A.data[r][0];
  const a2 = sc.A.data[r][1];
  const b1 = sc.B.data[0][c];
  const b2 = sc.B.data[1][c];
  const t1 = a1 * b1;
  const t2 = a2 * b2;
  const total = t1 + t2;
  const meaning = sc.R.meanings[r][c];
  const unit = sc.R.unit;

  return (
    <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-cyan-200">
          📐 (AB) 의 ({r + 1}, {c + 1}) 성분 계산 과정
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-bold text-slate-300 hover:bg-white/10"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-300">
        의미: <b className="text-emerald-300">{meaning}</b>
      </p>
      <p className="mt-2 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-center font-mono text-sm text-slate-100">
        ({sc.A.rowLabels[r]}) <span className="text-sky-300">[{a1}, {a2}]</span>{" "}
        · ({sc.B.colLabels[c]})
        <span className="text-violet-300"> [{b1}, {b2}]</span>
        <br />
        <span className="text-amber-300">
          = {a1} × {b1} + {a2} × {b2}
        </span>
        <br />
        <span className="text-amber-300">
          = {t1} + {t2}
        </span>{" "}
        ={" "}
        <span className="font-extrabold text-emerald-300">
          {total}
          {unit ? " " + unit : ""}
        </span>
      </p>
    </div>
  );
}
