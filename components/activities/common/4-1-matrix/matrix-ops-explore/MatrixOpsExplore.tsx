"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 1 + 게임 1) ────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "ops_common_diff",
    prompt:
      "탭 ① 에서 살펴본 세 연산 — 실수배 kA, 합 A+B, 차 A−B — 의 공통점은 무엇이고, 결정적으로 다른 점은 무엇인가요? ‘성분별 (i, j) 위치에서 무엇을 하는지’ 를 기준으로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 세 연산 모두 ‘같은 (i, j) 위치의 성분끼리만 처리’ 하는 점이 공통이다. 다른 점은 — kA 는 행렬 하나의 모든 성분에 상수 k 를 곱하는 ‘1 항 연산’ 이라 행렬 B 가 필요 없다. 반면 A+B, A−B 는 두 행렬의 같은 위치 성분을 더하거나 빼는 ‘2 항 연산’ 이라 두 행렬이 반드시 같은 꼴 (크기) 이어야 한다. 결국 모두 ‘성분별 연산’ 이지만, 사용하는 행렬 개수와 ‘크기 일치’ 조건이 다르다.",
  },
  {
    id: "challenge_strategy",
    prompt:
      "탭 ② 계산 챌린지에서 가장 헷갈렸던 미션을 골라, 어떤 부분에서 실수하기 쉬웠는지 + 다음 번엔 어떻게 부호를 정확히 처리할지 자신만의 전략을 적어 보세요. (특히 a − (−b) = a + b 처럼 음수 빼기)",
    kind: "text",
    placeholder:
      "예: 4 번 미션 (A − B 음수 주의) 가 가장 헷갈렸다. (−1) − 3 을 −2 로 잘못 썼다 (정답은 −4). 전략: 빼기에서는 ‘B 의 부호를 먼저 뒤집어 더하기’ 로 바꿔 푼다. 즉 (−1) − 3 → (−1) + (−3) = −4. 그리고 4 − (−2) → 4 + 2 = 6. 일단 모든 ‘− (음수)’ 를 ‘+ (양수)’ 로 변환해서 처음부터 덧셈만 하면 부호 실수가 거의 사라진다.",
  },
];

// ─── 데이터 ────────────────────────────────────────────────
const PA: Record<string, number[][]> = {
  "A₁": [
    [2, 1, -1],
    [0, 3, 2],
    [-1, 1, 4],
  ],
  "A₂": [
    [3, 0, 2],
    [1, -2, 1],
    [0, 3, -1],
  ],
  "A₃": [
    [-1, 2, 0],
    [4, -1, 3],
    [2, 0, -2],
  ],
};
const PB: Record<string, number[][]> = {
  "B₁": [
    [1, 2, 3],
    [1, 1, 0],
    [2, -1, 1],
  ],
  "B₂": [
    [-2, 1, 0],
    [3, -1, 2],
    [0, 1, -3],
  ],
  "B₃": [
    [2, -1, 2],
    [0, 2, 1],
    [1, 0, 2],
  ],
};
const KVALS = [-2, -1, 0, 0.5, 1, 2, 3];
const K_TICKS = ["−2", "−1", "0", "½", "1", "2", "3"];
const KDEF = 4; // index of k=1

type Op = "kA" | "add" | "sub";

// 챌린지 6 미션 (2×2)
type Chal =
  | {
      type: "add" | "sub";
      label: string;
      story: string;
      title: string;
      A: number[][];
      B: number[][];
      ans: number[][];
      hint: string;
    }
  | {
      type: "scalar";
      k: number;
      label: string;
      story: string;
      title: string;
      A: number[][];
      ans: number[][];
      hint: string;
    };

const CHAL: Chal[] = [
  {
    type: "add",
    label: "➕ 행렬의 합",
    story: "두 행렬을 더하세요. 같은 행·열 위치의 성분끼리 더합니다.",
    title: "A + B = ?",
    A: [
      [3, 1],
      [2, 4],
    ],
    B: [
      [1, 5],
      [3, 2],
    ],
    ans: [
      [4, 6],
      [5, 6],
    ],
    hint: "C[i][j] = A[i][j] + B[i][j] → 3+1=4, 1+5=6, 2+3=5, 4+2=6",
  },
  {
    type: "add",
    label: "➕ 행렬의 합 (음수 포함)",
    story: "음수 성분이 섞인 덧셈입니다. 부호를 꼼꼼히 확인하세요.",
    title: "A + B = ?",
    A: [
      [5, -2],
      [0, 7],
    ],
    B: [
      [-3, 4],
      [1, -5],
    ],
    ans: [
      [2, 2],
      [1, 2],
    ],
    hint: "5+(−3)=2, (−2)+4=2, 0+1=1, 7+(−5)=2",
  },
  {
    type: "sub",
    label: "➖ 행렬의 차",
    story: "두 행렬을 빼세요. 같은 위치의 성분끼리 뺍니다.",
    title: "A − B = ?",
    A: [
      [7, 3],
      [5, 9],
    ],
    B: [
      [2, 1],
      [3, 4],
    ],
    ans: [
      [5, 2],
      [2, 5],
    ],
    hint: "C[i][j] = A[i][j] − B[i][j] → 7-2=5, 3-1=2, 5-3=2, 9-4=5",
  },
  {
    type: "sub",
    label: "➖ 행렬의 차 (음수 주의)",
    story: "a − (−b) = a + b 임을 잊지 마세요!",
    title: "A − B = ?",
    A: [
      [4, -1],
      [0, 6],
    ],
    B: [
      [-2, 3],
      [4, -2],
    ],
    ans: [
      [6, -4],
      [-4, 8],
    ],
    hint: "4−(−2)=6, (−1)−3=−4, 0−4=−4, 6−(−2)=8",
  },
  {
    type: "scalar",
    k: 3,
    label: "✖️ 실수배 (k=3)",
    story: "행렬의 모든 성분에 k=3 을 곱하세요. 이것이 실수배입니다.",
    title: "3A = ?",
    A: [
      [2, -1],
      [0, 4],
    ],
    ans: [
      [6, -3],
      [0, 12],
    ],
    hint: "3×2=6, 3×(−1)=−3, 3×0=0, 3×4=12",
  },
  {
    type: "scalar",
    k: -1,
    label: "✖️ 실수배 (k=−1)",
    story: "(−1)A 는 모든 성분의 부호를 반전해 −A 를 만듭니다.",
    title: "(−1)A = ?",
    A: [
      [4, 2],
      [-3, 1],
    ],
    ans: [
      [-4, -2],
      [3, -1],
    ],
    hint: "(−1)×4=−4, (−1)×2=−2, (−1)×(−3)=3, (−1)×1=−1",
  },
];

// ─── 메인 ─────────────────────────────────────────────────
export default function MatrixOpsExplore() {
  const [tab, setTab] = useState<0 | 1>(0);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🔢 행렬 연산 탐험</h3>
        <p className="mt-2 leading-7 text-slate-300">
          행렬의 <b className="text-cyan-300">합 · 차 · 실수배</b> 를 슬라이더와
          행렬 선택으로 직접 만들어 보고, 계산 챌린지로 정복해 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <MainTabBtn active={tab === 0} onClick={() => setTab(0)}>
          🔢 행렬 연산 탐험
        </MainTabBtn>
        <MainTabBtn active={tab === 1} onClick={() => setTab(1)}>
          ✏️ 계산 챌린지
        </MainTabBtn>
      </div>

      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}>
        <ExploreTab />
      </div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <ChallengeTab />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function MainTabBtn({
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
        "rounded-xl px-3 py-2.5 text-center text-xs font-bold transition sm:text-sm " +
        (active
          ? "bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg shadow-cyan-500/25"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-cyan-200")
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

function MatBlock({
  label,
  color,
  mat,
  resHL = false,
}: {
  label: ReactNode;
  color: string;
  mat: number[][];
  resHL?: boolean;
}) {
  const rows = mat.length;
  const cols = mat[0].length;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-xs font-extrabold" style={{ color }}>
        {label}
      </span>
      <MatrixBracket n={rows}>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${cols}, 40px)` }}
        >
          {mat.flat().map((v, i) => (
            <div
              key={i}
              className={
                "flex h-9 items-center justify-center rounded-sm border font-mono text-sm font-bold transition " +
                (resHL
                  ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
                  : "border-white/10 bg-slate-900 text-slate-100")
              }
              style={resHL ? undefined : { color }}
            >
              {fmtNum(v)}
            </div>
          ))}
        </div>
      </MatrixBracket>
    </div>
  );
}

function fmtNum(v: number): string {
  if (Number.isInteger(v)) return String(v);
  // 0.5 같은 소수는 그대로
  return String(Math.round(v * 100) / 100);
}

// ═══════════════════════════════════════════════════════════
//  TAB 0 — 탐험
// ═══════════════════════════════════════════════════════════

function ExploreTab() {
  const [op, setOp] = useState<Op>("kA");
  const [aKey, setAKey] = useState<keyof typeof PA>("A₁");
  const [bKey, setBKey] = useState<keyof typeof PB>("B₁");
  const [kIdx, setKIdx] = useState<number>(KDEF);

  const A = PA[aKey];
  const B = PB[bKey];
  const k = KVALS[kIdx];

  const C: number[][] = A.map((row, r) =>
    row.map((v, c) => {
      if (op === "kA") return Math.round(k * v * 100) / 100;
      if (op === "add") return v + B[r][c];
      return v - B[r][c];
    }),
  );

  const rows = A.length;
  const cols = A[0].length;

  return (
    <div className="space-y-3">
      {/* 연산 선택 */}
      <div className="flex flex-wrap gap-2">
        <OpBtn active={op === "kA"} onClick={() => setOp("kA")}>k × A</OpBtn>
        <OpBtn active={op === "add"} onClick={() => setOp("add")}>A + B</OpBtn>
        <OpBtn active={op === "sub"} onClick={() => setOp("sub")}>A − B</OpBtn>
      </div>

      {/* A 선택 */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <p className="text-xs font-bold text-slate-300">행렬 A 선택</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(PA) as Array<keyof typeof PA>).map((key) => (
            <PresetBtn
              key={key}
              active={aKey === key}
              activeClass="border-sky-300/55 bg-sky-400/15 text-sky-100"
              onClick={() => setAKey(key)}
            >
              <span className="block font-mono font-bold">{key}</span>
              <span className="block text-[10px] text-slate-400">
                [{PA[key][0].join(", ")} …]
              </span>
            </PresetBtn>
          ))}
        </div>
      </div>

      {/* B 선택 또는 k 슬라이더 */}
      {op === "kA" ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-slate-300">스칼라 k 값 조절</p>
            <span className="rounded-md border border-amber-300/45 bg-amber-300/15 px-2 py-0.5 font-mono text-sm font-bold text-amber-100">
              k = {fmtNum(k)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={KVALS.length - 1}
            step={1}
            value={kIdx}
            onChange={(e) => setKIdx(parseInt(e.target.value, 10))}
            className="mt-2 w-full accent-cyan-400"
            aria-label="스칼라 k"
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            {K_TICKS.map((t, i) => (
              <span
                key={i}
                className={i === kIdx ? "font-bold text-cyan-300" : ""}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs font-bold text-slate-300">
            {op === "add" ? "더할 행렬 B 선택" : "뺄 행렬 B 선택"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(PB) as Array<keyof typeof PB>).map((key) => (
              <PresetBtn
                key={key}
                active={bKey === key}
                activeClass="border-violet-300/55 bg-violet-400/15 text-violet-100"
                onClick={() => setBKey(key)}
              >
                <span className="block font-mono font-bold">{key}</span>
                <span className="block text-[10px] text-slate-400">
                  [{PB[key][0].join(", ")} …]
                </span>
              </PresetBtn>
            ))}
          </div>
        </div>
      )}

      {/* 행렬 식 */}
      <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {op === "kA" ? (
            <>
              <span className="rounded-md border border-amber-300/45 bg-amber-300/15 px-3 py-1 font-mono text-base font-extrabold text-amber-100">
                k = {fmtNum(k)}
              </span>
              <span className="text-2xl font-bold text-slate-400">×</span>
              <MatBlock label="A" color="#38bdf8" mat={A} />
              <span className="text-2xl font-bold text-slate-400">=</span>
              <MatBlock label="C = kA" color="#22c55e" mat={C} resHL />
            </>
          ) : (
            <>
              <MatBlock label="A" color="#38bdf8" mat={A} />
              <span className="text-2xl font-bold text-slate-400">
                {op === "add" ? "+" : "−"}
              </span>
              <MatBlock label="B" color="#a78bfa" mat={B} />
              <span className="text-2xl font-bold text-slate-400">=</span>
              <MatBlock
                label={op === "add" ? "C = A+B" : "C = A−B"}
                color="#22c55e"
                mat={C}
                resHL
              />
            </>
          )}
        </div>
      </div>

      {/* 성분별 계산 단계 */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-extrabold text-cyan-200">📐 성분별 계산 과정</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {Array.from({ length: rows * cols }, (_, idx) => {
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            const av = A[r][c];
            const cv = C[r][c];
            let calc: ReactNode;
            if (op === "kA") {
              calc = (
                <>
                  {fmtNum(k)} × {fmtNum(av)} ={" "}
                  <span className="font-bold text-emerald-300">{fmtNum(cv)}</span>
                </>
              );
            } else {
              const bv = B[r][c];
              const sign = op === "add" ? "+" : "−";
              const bShow = op === "sub" && bv < 0 ? `(${bv})` : `${bv}`;
              calc = (
                <>
                  {fmtNum(av)} {sign} {bShow} ={" "}
                  <span className="font-bold text-emerald-300">{fmtNum(cv)}</span>
                </>
              );
            }
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-slate-900/70 px-2 py-1.5 text-[11px] font-mono"
              >
                <span className="text-slate-400">
                  C[{r + 1}][{c + 1}]
                </span>
                <span className="text-slate-200">{calc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 정의 공식 */}
      <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] px-4 py-3 text-center font-mono text-sm leading-7 text-cyan-100">
        {op === "kA" ? (
          <>
            <b className="text-amber-300">정의</b>: (
            <span className="text-amber-300">k</span>A)<sub>ij</sub> ={" "}
            <span className="text-amber-300">k</span> · a<sub>ij</sub> · 현재 k ={" "}
            <span className="text-amber-300">{fmtNum(k)}</span> · 분배법칙: k(A+B) =
            kA + kB
          </>
        ) : op === "add" ? (
          <>
            <b className="text-amber-300">정의</b>: (A
            <span className="text-amber-300">+</span>B)<sub>ij</sub> = a<sub>ij</sub>{" "}
            <span className="text-amber-300">+</span> b<sub>ij</sub> · 같은 꼴 (크기)
            의 행렬끼리만 덧셈 가능
          </>
        ) : (
          <>
            <b className="text-amber-300">정의</b>: (A
            <span className="text-amber-300">−</span>B)<sub>ij</sub> = a<sub>ij</sub>{" "}
            <span className="text-amber-300">−</span> b<sub>ij</sub> · A − B = A + (
            <span className="text-amber-300">−1</span>)B
          </>
        )}
      </div>
    </div>
  );
}

function OpBtn({
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
        "rounded-full px-4 py-1.5 text-sm font-bold transition " +
        (active
          ? "bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg shadow-cyan-500/25"
          : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

function PresetBtn({
  active,
  activeClass,
  onClick,
  children,
}: {
  active: boolean;
  activeClass: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-lg border px-3 py-1.5 text-left transition " +
        (active ? activeClass : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 챌린지
// ═══════════════════════════════════════════════════════════

function ChallengeTab() {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState<Set<number>>(new Set());

  function next() {
    if (idx < CHAL.length - 1) setIdx(idx + 1);
  }
  function markSolved() {
    setSolved((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  }

  const allDone = solved.size === CHAL.length;

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <span className="rounded-md border border-amber-300/45 bg-amber-300/15 px-2 py-0.5 font-mono text-xs font-bold text-amber-100">
          미션 {idx + 1} / {CHAL.length}
        </span>
        <div className="flex gap-1.5">
          {CHAL.map((_, i) => (
            <span
              key={i}
              className={
                "h-2.5 w-2.5 rounded-full transition " +
                (solved.has(i)
                  ? "bg-emerald-400"
                  : i === idx
                    ? "bg-cyan-400 ring-2 ring-cyan-300/40"
                    : "bg-white/15")
              }
            />
          ))}
        </div>
      </div>

      {allDone ? (
        <div className="rounded-2xl border-2 border-amber-300/55 bg-amber-300/15 p-5 text-center">
          <div className="text-4xl">🏅</div>
          <p className="mt-2 text-xl font-extrabold text-amber-100">
            전체 챌린지 클리어!
          </p>
          <p className="mt-1 text-sm text-amber-50/85">
            행렬의 합 · 차 · 실수배를 모두 정복했습니다!
          </p>
        </div>
      ) : null}

      {/* 미션 — key 로 input 자동 리셋 */}
      <ChallengeMission
        key={idx}
        chal={CHAL[idx]}
        onSolve={markSolved}
        onNext={next}
        isLast={idx === CHAL.length - 1}
      />
    </div>
  );
}

type CellStatus = "idle" | "ok" | "bad";

function ChallengeMission({
  chal,
  onSolve,
  onNext,
  isLast,
}: {
  chal: Chal;
  onSolve: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const rows = chal.ans.length;
  const cols = chal.ans[0].length;

  // 입력값 (rows × cols 2D array of strings)
  const [inputs, setInputs] = useState<string[][]>(() =>
    Array.from({ length: rows }, () => Array(cols).fill("")),
  );
  const [status, setStatus] = useState<CellStatus[][]>(() =>
    Array.from({ length: rows }, () => Array(cols).fill("idle" as CellStatus)),
  );
  const [result, setResult] = useState<"ok" | "bad" | null>(null);
  const [showHint, setShowHint] = useState(false);

  function setCell(r: number, c: number, val: string) {
    setInputs((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = val;
      return next;
    });
    // 입력이 바뀌면 상태 초기화 (해당 셀)
    setStatus((prev) => {
      if (prev[r][c] === "idle") return prev;
      const next = prev.map((row) => [...row]);
      next[r][c] = "idle";
      return next;
    });
  }

  function check() {
    let allOk = true;
    const nextStatus: CellStatus[][] = inputs.map((row) => row.map(() => "idle" as CellStatus));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const raw = inputs[r][c].trim().replace("−", "-");
        const v = parseFloat(raw);
        if (Number.isFinite(v) && v === chal.ans[r][c]) {
          nextStatus[r][c] = "ok";
        } else {
          nextStatus[r][c] = "bad";
          allOk = false;
        }
      }
    }
    setStatus(nextStatus);
    setResult(allOk ? "ok" : "bad");
    if (allOk) {
      onSolve();
      setShowHint(false);
    } else {
      setShowHint(true);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const nextIdx = r * cols + c + 1;
      if (nextIdx < rows * cols) {
        const nr = Math.floor(nextIdx / cols);
        const nc = nextIdx % cols;
        const el = document.getElementById(`ans-${nr}-${nc}`);
        if (el) (el as HTMLInputElement).focus();
      } else {
        check();
      }
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm font-extrabold text-cyan-200">
        <span className="mr-2 rounded-md bg-cyan-400/15 px-2 py-0.5 text-xs">
          {chal.label}
        </span>
        {chal.story}
      </p>
      <p className="mt-2 text-center text-base font-bold text-violet-200">
        {chal.title}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        {chal.type === "scalar" ? (
          <>
            <span className="rounded-md border border-amber-300/45 bg-amber-300/15 px-3 py-1 font-mono text-base font-extrabold text-amber-100">
              k = {chal.k}
            </span>
            <span className="text-2xl font-bold text-slate-400">×</span>
            <MatBlock label="A" color="#38bdf8" mat={chal.A} />
          </>
        ) : (
          <>
            <MatBlock label="A" color="#38bdf8" mat={chal.A} />
            <span className="text-2xl font-bold text-slate-400">
              {chal.type === "add" ? "+" : "−"}
            </span>
            <MatBlock label="B" color="#a78bfa" mat={chal.B} />
          </>
        )}
        <span className="text-2xl font-bold text-slate-400">=</span>

        {/* 답 입력 행렬 */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-xs font-extrabold text-emerald-300">?</span>
          <MatrixBracket n={rows}>
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${cols}, 48px)` }}
            >
              {Array.from({ length: rows * cols }, (_, i) => {
                const r = Math.floor(i / cols);
                const c = i % cols;
                const st = status[r][c];
                const ring =
                  st === "ok"
                    ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
                    : st === "bad"
                      ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                      : "border-white/15 bg-slate-900 text-slate-100";
                return (
                  <input
                    key={i}
                    id={`ans-${r}-${c}`}
                    type="text"
                    inputMode="numeric"
                    value={inputs[r][c]}
                    onChange={(e) => setCell(r, c, e.target.value)}
                    onKeyDown={(e) => handleKey(e, r, c)}
                    autoFocus={i === 0}
                    aria-label={`답 ${r + 1} 행 ${c + 1} 열`}
                    className={
                      "h-9 w-12 rounded-sm border text-center font-mono text-sm font-bold transition [color-scheme:dark] " +
                      ring
                    }
                  />
                );
              })}
            </div>
          </MatrixBracket>
        </div>
      </div>

      {/* 결과 메시지 */}
      {result ? (
        <p
          className={
            "mt-3 rounded-lg border px-3 py-2 text-center text-sm font-bold " +
            (result === "ok"
              ? "border-emerald-400/45 bg-emerald-400/15 text-emerald-100"
              : "border-rose-400/45 bg-rose-400/15 text-rose-100")
          }
        >
          {result === "ok" ? "🎯 정답! 완벽합니다!" : "❌ 빨간 칸을 다시 확인하세요."}
        </p>
      ) : null}

      {/* 힌트 */}
      {showHint && result === "bad" ? (
        <p className="mt-2 rounded-lg border border-amber-300/45 bg-amber-300/10 px-3 py-2 text-center text-xs font-mono text-amber-100">
          💡 {chal.hint}
        </p>
      ) : null}

      {/* 액션 */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {result === "ok" ? (
          <button
            type="button"
            onClick={onNext}
            disabled={isLast}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:opacity-50"
          >
            {isLast ? "🏅 마지막 미션" : "다음 문제 ▶"}
          </button>
        ) : (
          <button
            type="button"
            onClick={check}
            className="rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110"
          >
            ✓ 정답 확인
          </button>
        )}
      </div>
    </div>
  );
}
