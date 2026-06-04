"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (게임 1 + 탐색 1) ─────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "matrix_reading_concepts",
    prompt:
      "탭 ① 행렬 읽기 퀴즈에서 ‘m × n 행렬의 꼴’ / ‘(i, j) 성분’ / ‘정사각행렬’ 세 가지 질문 타입 중 가장 헷갈렸던 것을 골라, 그 개념을 자신의 말로 설명해 보세요. (예: ‘(2, 3) 성분’ 은 어디인지, 왜 헷갈렸는지)",
    kind: "text",
    placeholder:
      "예: (i, j) 성분 질문이 가장 헷갈렸다. ‘행이 먼저, 열이 나중’ 이라는 약속을 자꾸 잊었다. (2, 3) 성분 = 제 2 행과 제 3 열이 만나는 성분 = 위에서 두 번째 줄, 왼쪽에서 세 번째 칸. 1 번째 인덱스가 행이라는 점을 ‘영화관 좌석 표기 같이 (열 = column 보다 행 = row 가 먼저 오는 것이 수학 규칙)’ 로 외웠다.",
  },
  {
    id: "equality_solving_strategy",
    prompt:
      "탭 ② 상등 탐정에서 미지수가 여러 개일 때 (특히 난이도 3 ~ 5), 어떤 성분 방정식부터 풀어야 효율적일까요? 자신이 시도한 풀이 순서를 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 난이도 3 (x + y = 5, x − y = 1, z − 1 = 3) 의 경우, ‘미지수 1 개’ 인 z − 1 = 3 부터 풀면 z = 4 가 바로 나온다. 그 다음 ‘연립이 필요한’ x + y = 5 와 x − y = 1 을 더하면 2x = 6 → x = 3, y = 2. 일반적으로 ‘식 하나에 미지수 하나’ 인 것을 먼저 찾고, 그 결과를 다른 식에 대입해 미지수를 줄여나가는 게 효율적.",
  },
];

// ─── 공용 유틸 ─────────────────────────────────────────────
function ri(a: number, b: number): number {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

// ─── 메인 ─────────────────────────────────────────────────
export default function MatrixEqualityGame() {
  const [tab, setTab] = useState<0 | 1>(0);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🕵️ 행렬 상등 탐정 게임</h3>
        <p className="mt-2 leading-7 text-slate-300">
          행렬의 뜻과 <b className="text-cyan-300">상등 (A = B)</b> 개념을 게임으로
          완벽하게 익혀보자!
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <MainTabBtn active={tab === 0} onClick={() => setTab(0)}>
          🔍 행렬 읽기 퀴즈
        </MainTabBtn>
        <MainTabBtn active={tab === 1} onClick={() => setTab(1)}>
          🕵️ 상등 탐정
        </MainTabBtn>
      </div>

      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}>
        <ReadingQuiz />
      </div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <DetectiveTab />
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
          ? "bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/25"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-violet-200")
      }
    >
      {children}
    </button>
  );
}

// ─── 공용 UI ──────────────────────────────────────────────
function ConceptCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/12 via-cyan-500/8 to-transparent p-3 text-xs leading-7 text-slate-200">
      <span className="mr-2 inline-flex items-center rounded-md border border-amber-300/40 bg-amber-300/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
        핵심 개념
      </span>
      {children}
    </div>
  );
}

function MatrixBracket({ children, n }: { children: ReactNode; n: number }) {
  const h = n * 40 + (n - 1) * 4;
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

// ═══════════════════════════════════════════════════════════
//  TAB 0 — 행렬 읽기 퀴즈
// ═══════════════════════════════════════════════════════════

type QuizType = "size" | "entry" | "square";
type CurMat = { r: number; c: number; d: number[] };
type CurQ =
  | { type: "size"; ans: string; mat: CurMat; hlIdx: -1 }
  | { type: "entry"; ans: number; mat: CurMat; hlIdx: number; row: number; col: number }
  | { type: "square"; ans: "예" | "아니오"; mat: CurMat; hlIdx: -1 };

const TARGET = 8;

function genMat(): CurMat {
  const r = ri(2, 3);
  const c = ri(2, 3);
  const d: number[] = [];
  for (let i = 0; i < r * c; i++) d.push(ri(-9, 9));
  return { r, c, d };
}

function buildQ(rotIdx: number): CurQ {
  const mat = genMat();
  const { r, c, d } = mat;
  const type: QuizType = (["size", "entry", "square"] as const)[rotIdx % 3];
  if (type === "size") {
    return { type: "size", ans: `${r}×${c}`, mat, hlIdx: -1 };
  }
  if (type === "entry") {
    const idx = ri(0, r * c - 1);
    const row = Math.floor(idx / c) + 1;
    const col = (idx % c) + 1;
    return { type: "entry", ans: d[idx], mat, hlIdx: idx, row, col };
  }
  return {
    type: "square",
    ans: r === c ? "예" : "아니오",
    mat,
    hlIdx: -1,
  };
}

function ReadingQuiz() {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [rot, setRot] = useState(0);
  // lazy init: 첫 렌더 시점에 1회만 buildQ 실행
  const [q, setQ] = useState<CurQ>(() => buildQ(0));
  const [picked, setPicked] = useState<string | null>(null); // 4지선다 / 예아니오 선택
  const [entryInput, setEntryInput] = useState<string>("");
  const [entrySubmitted, setEntrySubmitted] = useState(false);
  const [fb, setFb] = useState<{ ok: boolean; correct: string } | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setScore(0);
    setStreak(0);
    setTotal(0);
    setRot(0);
    setPicked(null);
    setEntryInput("");
    setEntrySubmitted(false);
    setFb(null);
    setDone(false);
    setQ(buildQ(0));
  }

  function nextQ() {
    setPicked(null);
    setEntryInput("");
    setEntrySubmitted(false);
    setFb(null);
    const nextRot = rot + 1;
    setRot(nextRot);
    setQ(buildQ(nextRot));
  }

  function processAnswer(ok: boolean, correctStr: string) {
    setTotal((t) => t + 1);
    if (ok) {
      setScore((s) => s + 10);
      setStreak((s) => {
        const ns = s + 1;
        if (ns >= TARGET) {
          // 8연속 정답 → 완료 모달
          setTimeout(() => setDone(true), 800);
        }
        return ns;
      });
    } else {
      setStreak(0);
    }
    setFb({ ok, correct: correctStr });
    if (!ok || streak + 1 < TARGET) {
      setTimeout(() => {
        if (!done) nextQ();
      }, 1050);
    }
  }

  function pickChoice(ch: string, correct: string) {
    if (picked) return;
    setPicked(ch);
    processAnswer(ch === correct, correct);
  }

  function submitEntry() {
    if (entrySubmitted) return;
    if (q?.type !== "entry") return;
    if (entryInput.trim() === "") return;
    setEntrySubmitted(true);
    const v = parseInt(entryInput, 10);
    processAnswer(v === q.ans, String(q.ans));
  }

  if (done) {
    return (
      <div className="space-y-3">
        <ConceptCard>
          <strong>m × n 행렬</strong>: 행이 m 개, 열이 n 개인 행렬 ·{" "}
          <strong>(i, j) 성분</strong>: 제 i 행과 제 j 열이 만나는 성분 ·{" "}
          <strong>정사각행렬</strong>: 행의 수 = 열의 수
        </ConceptCard>
        <div className="rounded-2xl border-2 border-amber-300/55 bg-amber-300/15 p-5 text-center">
          <div className="text-4xl">🎉</div>
          <p className="mt-2 text-xl font-extrabold text-amber-100">
            8 연속 정답 달성!
          </p>
          <p className="mt-1 text-sm text-amber-50/85">
            총 {total} 문제 풀이 · 최종 점수: <b>{score} 점</b> 🏆
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:brightness-110"
          >
            다시 도전!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ConceptCard>
        <strong>m × n 행렬</strong>: 행이 m 개, 열이 n 개인 행렬 ·{" "}
        <strong>(i, j) 성분</strong>: 제 i 행과 제 j 열이 만나는 성분 ·{" "}
        <strong>정사각행렬</strong>: 행의 수 = 열의 수
      </ConceptCard>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-extrabold text-violet-200">🔍 행렬 읽기 퀴즈</p>
        <p className="mt-1 text-xs text-slate-400">
          랜덤 행렬을 보고 질문에 답하세요!{" "}
          <span className="text-amber-300">{TARGET} 문제 연속 정답</span> 이 목표!
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="점수" value={score} />
          <Stat label="연속 정답" value={`${streak} / ${TARGET}`} />
          <Stat label="총 문제 수" value={total} />
        </div>

        <>
          <div className="mt-4 flex justify-center">
            <MatrixGrid mat={q.mat} hlIdx={q.hlIdx} />
          </div>

            <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-center text-sm font-bold text-slate-100">
              {questionText(q)}
            </div>

            <div className="mt-3">
              {q.type === "entry" ? (
                <div className="flex justify-center gap-2">
                  <input
                    type="number"
                    value={entryInput}
                    onChange={(e) => setEntryInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitEntry()}
                    disabled={entrySubmitted}
                    placeholder="숫자 입력"
                    aria-label="성분 값 입력"
                    className="w-32 rounded-md border border-white/15 bg-slate-900 px-3 py-1.5 text-center text-sm font-mono text-slate-100 disabled:opacity-60 [color-scheme:dark]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={submitEntry}
                    disabled={entrySubmitted || entryInput.trim() === ""}
                    className="rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 disabled:opacity-60"
                  >
                    확인
                  </button>
                </div>
              ) : (
                <Choices
                  choices={q.type === "size" ? sizeChoices(q.ans) : ["예", "아니오"]}
                  correct={q.type === "size" ? q.ans : q.ans}
                  picked={picked}
                  onPick={(ch) =>
                    pickChoice(ch, q.type === "size" ? q.ans : q.ans)
                  }
                />
              )}
            </div>

            {fb ? (
              <p
                className={
                  "mt-3 rounded-lg border px-3 py-2 text-center text-sm font-bold " +
                  (fb.ok
                    ? "border-emerald-400/45 bg-emerald-400/15 text-emerald-100"
                    : "border-rose-400/45 bg-rose-400/15 text-rose-100")
                }
              >
                {fb.ok
                  ? `✅ 정답! +10 점 (연속: ${streak} / ${TARGET})`
                  : `❌ 오답. 정답: ${fb.correct}`}
              </p>
            ) : null}
          </>
      </div>
    </div>
  );
}

function questionText(q: CurQ): ReactNode {
  if (q.type === "size") return <>이 행렬의 꼴 (m × n) 은?</>;
  if (q.type === "entry")
    return (
      <>
        <span className="text-amber-300">강조된 칸</span> 의 값은?{" "}
        <span className="text-slate-400 text-xs">
          ({q.row}, {q.col}) 성분
        </span>
      </>
    );
  return (
    <>
      이 행렬은 <span className="text-amber-300">정사각행렬</span> 인가요?
    </>
  );
}

function sizeChoices(correct: string): string[] {
  const all = ["1×2", "1×3", "2×1", "2×2", "2×3", "3×1", "3×2", "3×3"];
  const wrongs = all.filter((x) => x !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
  return [correct, ...wrongs].sort(() => Math.random() - 0.5);
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2 text-center">
      <p className="font-mono text-xl font-extrabold text-cyan-200">{value}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}

function MatrixGrid({ mat, hlIdx }: { mat: CurMat; hlIdx: number }) {
  const { r, c, d } = mat;
  return (
    <MatrixBracket n={r}>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${c}, 48px)` }}
      >
        {d.map((v, i) => (
          <div
            key={i}
            className={
              "flex h-10 items-center justify-center rounded-md border text-sm font-mono font-bold transition " +
              (i === hlIdx
                ? "border-amber-300/70 bg-amber-300/25 text-amber-100"
                : "border-white/10 bg-slate-900 text-slate-100")
            }
          >
            {v}
          </div>
        ))}
      </div>
    </MatrixBracket>
  );
}

function Choices({
  choices,
  correct,
  picked,
  onPick,
}: {
  choices: string[];
  correct: string;
  picked: string | null;
  onPick: (ch: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {choices.map((ch) => {
        let cls =
          "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10";
        if (picked) {
          if (ch === correct) cls = "border-emerald-400/60 bg-emerald-400/20 text-emerald-100";
          else if (ch === picked) cls = "border-rose-400/60 bg-rose-400/20 text-rose-100";
          else cls = "border-white/10 bg-white/[0.02] text-slate-500";
        }
        return (
          <button
            key={ch}
            type="button"
            onClick={() => onPick(ch)}
            disabled={!!picked}
            className={
              "rounded-full px-4 py-1.5 text-sm font-bold font-mono transition " + cls
            }
          >
            {ch}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 상등 탐정
// ═══════════════════════════════════════════════════════════

type Cell = { d: string; u: 0 | 1 };
type Prob = {
  lv: number;
  stars: string;
  name: string;
  size: [number, number];
  A: Cell[];
  B: number[];
  vars: { n: string; v: number }[];
  hint: string;
};

const PROBS: Prob[] = [
  {
    lv: 1,
    stars: "⭐",
    name: "난이도 1 · 2×2",
    size: [2, 2],
    A: [
      { d: "x", u: 1 },
      { d: "3", u: 0 },
      { d: "2", u: 0 },
      { d: "y", u: 1 },
    ],
    B: [5, 3, 2, -4],
    vars: [
      { n: "x", v: 5 },
      { n: "y", v: -4 },
    ],
    hint: "A = B 이면 같은 위치의 성분이 같아요. (1, 1) 성분: x = 5, (2, 2) 성분: y = −4",
  },
  {
    lv: 2,
    stars: "⭐⭐",
    name: "난이도 2 · 2×2",
    size: [2, 2],
    A: [
      { d: "2a", u: 1 },
      { d: "b+1", u: 1 },
      { d: "-3", u: 0 },
      { d: "c", u: 1 },
    ],
    B: [6, 4, -3, 7],
    vars: [
      { n: "a", v: 3 },
      { n: "b", v: 3 },
      { n: "c", v: 7 },
    ],
    hint: "2a = 6 → a = 3 / b + 1 = 4 → b = 3 / c = 7",
  },
  {
    lv: 3,
    stars: "⭐⭐⭐",
    name: "난이도 3 · 2×3",
    size: [2, 3],
    A: [
      { d: "x+y", u: 1 },
      { d: "2", u: 0 },
      { d: "z-1", u: 1 },
      { d: "4", u: 0 },
      { d: "x-y", u: 1 },
      { d: "8", u: 0 },
    ],
    B: [5, 2, 3, 4, 1, 8],
    vars: [
      { n: "x", v: 3 },
      { n: "y", v: 2 },
      { n: "z", v: 4 },
    ],
    hint: "x + y = 5, x − y = 1 → 더하면 2x = 6 → x = 3, y = 2. z − 1 = 3 → z = 4",
  },
  {
    lv: 4,
    stars: "⭐⭐⭐⭐",
    name: "난이도 4 · 2×3",
    size: [2, 3],
    A: [
      { d: "2p-q", u: 1 },
      { d: "p+q", u: 1 },
      { d: "5", u: 0 },
      { d: "3r", u: 1 },
      { d: "r+2s", u: 1 },
      { d: "8", u: 0 },
    ],
    B: [3, 6, 5, 9, 5, 8],
    vars: [
      { n: "p", v: 3 },
      { n: "q", v: 3 },
      { n: "r", v: 3 },
      { n: "s", v: 1 },
    ],
    hint: "2p − q = 3, p + q = 6 → 더하면 3p = 9 → p = 3, q = 3. 3r = 9 → r = 3, r + 2s = 5 → s = 1",
  },
  {
    lv: 5,
    stars: "⭐⭐⭐⭐⭐",
    name: "난이도 5 · 3×2",
    size: [3, 2],
    A: [
      { d: "a+b", u: 1 },
      { d: "a-b", u: 1 },
      { d: "c", u: 1 },
      { d: "2c+1", u: 1 },
      { d: "a-c", u: 1 },
      { d: "4", u: 0 },
    ],
    B: [8, 2, 3, 7, 2, 4],
    vars: [
      { n: "a", v: 5 },
      { n: "b", v: 3 },
      { n: "c", v: 3 },
    ],
    hint: "a + b = 8, a − b = 2 → 더하면 2a = 10 → a = 5, b = 3. c = 3, a − c = 5 − 3 = 2 (✓)",
  },
];

type CheckResult = { kind: "ok" } | { kind: "ng" } | { kind: "hint"; text: string };

function DetectiveTab() {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState<Set<number>>(new Set());

  function markSolved(i: number) {
    setSolved((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  }
  function move(dir: -1 | 1) {
    const nx = idx + dir;
    if (nx < 0 || nx >= PROBS.length) return;
    setIdx(nx);
  }

  return (
    <div className="space-y-3">
      <ConceptCard>
        두 행렬 A, B 가 <strong>같은 꼴</strong> 이고{" "}
        <strong>대응하는 모든 성분이 같으면</strong> A = B 라고 합니다. 미지수가 있는
        성분 방정식을 세워 풀면 됩니다.
      </ConceptCard>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-extrabold text-violet-200">🕵️ 상등 탐정</p>
        <p className="mt-1 text-xs text-slate-400">
          A = B 를 만족하는 미지수를 찾아라!{" "}
          <span className="text-amber-300">노란 칸</span> 이 미지수가 포함된 식이에요.
        </p>

        {/* idx 가 바뀌면 key 가 바뀌어 DetectivePuzzle 의 모든 입력 상태가 자동 리셋 */}
        <DetectivePuzzle
          key={idx}
          idx={idx}
          solved={solved}
          onSolve={() => markSolved(idx)}
          onMove={move}
        />
      </div>
    </div>
  );
}

function DetectivePuzzle({
  idx,
  solved,
  onSolve,
  onMove,
}: {
  idx: number;
  solved: Set<number>;
  onSolve: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const prob = PROBS[idx];
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [varStatus, setVarStatus] = useState<Record<string, "idle" | "ok" | "ng">>(
    {},
  );
  const [result, setResult] = useState<CheckResult | null>(null);

  function check() {
    let allOk = true;
    const nextStatus: Record<string, "idle" | "ok" | "ng"> = {};
    for (const v of prob.vars) {
      const s = inputs[v.n];
      if (!s || s.trim() === "") {
        allOk = false;
        nextStatus[v.n] = "ng";
        continue;
      }
      const num = parseFloat(s);
      const ok = Number.isFinite(num) && Math.abs(num - v.v) < 0.001;
      nextStatus[v.n] = ok ? "ok" : "ng";
      if (!ok) allOk = false;
    }
    setVarStatus(nextStatus);
    if (allOk) {
      setResult({ kind: "ok" });
      onSolve();
    } else {
      setResult({ kind: "ng" });
    }
  }

  function reset() {
    setInputs({});
    setVarStatus({});
    setResult(null);
  }

  function showHint() {
    setResult({ kind: "hint", text: prob.hint });
  }

  const [rows, cols] = prob.size;

  return (
    <>
      {/* 난이도 + 진행 dot */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-bold text-amber-300">{prob.stars}</p>
          <p className="text-[11px] text-slate-400">{prob.name}</p>
        </div>
        <div className="flex gap-1.5">
          {PROBS.map((_, i) => {
            const isSolved = solved.has(i);
            const isCur = i === idx;
            return (
              <span
                key={i}
                className={
                  "h-2.5 w-2.5 rounded-full transition " +
                  (isSolved
                    ? "bg-emerald-400"
                    : isCur
                      ? "bg-violet-400 ring-2 ring-violet-300/40"
                      : "bg-white/15")
                }
              />
            );
          })}
        </div>
        <p className="text-xs font-bold text-slate-300">
          <span className="text-violet-200">{idx + 1}</span> / {PROBS.length}
        </p>
      </div>

      {/* A = B */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <span className="text-lg font-extrabold text-violet-200">A</span>
        <MatrixBracket n={rows}>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cols}, 64px)` }}
          >
            {prob.A.map((cell, i) => (
              <div
                key={i}
                className={
                  "flex h-10 items-center justify-center rounded-md border text-sm font-mono font-bold " +
                  (cell.u
                    ? "border-amber-300/60 bg-amber-300/20 text-amber-100"
                    : "border-white/10 bg-slate-900 text-slate-100")
                }
              >
                {cell.d}
              </div>
            ))}
          </div>
        </MatrixBracket>

        <span className="text-2xl font-bold text-slate-400">=</span>

        <span className="text-lg font-extrabold text-emerald-300">B</span>
        <MatrixBracket n={rows}>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cols}, 64px)` }}
          >
            {prob.B.map((v, i) => (
              <div
                key={i}
                className="flex h-10 items-center justify-center rounded-md border border-emerald-400/40 bg-emerald-400/15 text-sm font-mono font-bold text-emerald-100"
              >
                {v}
              </div>
            ))}
          </div>
        </MatrixBracket>
      </div>

      <p className="mt-2 text-center text-[11px] text-slate-500">
        📌 꼴: {rows} × {cols} 행렬 · 미지수:{" "}
        <b className="text-amber-300">{prob.vars.map((v) => v.n).join(", ")}</b>
      </p>

      {/* 변수 입력 */}
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {prob.vars.map((v) => {
          const status = varStatus[v.n] ?? "idle";
          const ring =
            status === "ok"
              ? "border-emerald-400/60"
              : status === "ng"
                ? "border-rose-400/60"
                : "border-white/15";
          return (
            <div key={v.n} className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-amber-300">
                {v.n} =
              </span>
              <input
                type="number"
                step="any"
                value={inputs[v.n] ?? ""}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, [v.n]: e.target.value }))
                }
                aria-label={`${v.n} 값`}
                placeholder="?"
                className={
                  "w-20 rounded-md border bg-slate-900 px-2 py-1 text-center text-sm font-mono text-slate-100 [color-scheme:dark] " +
                  ring
                }
              />
            </div>
          );
        })}
      </div>

      {/* 액션 버튼 */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={check}
          className="rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:brightness-110"
        >
          ✅ 정답 확인
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
        >
          🔄 초기화
        </button>
        <button
          type="button"
          onClick={showHint}
          className="rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-amber-400/25 hover:brightness-110"
        >
          💡 힌트
        </button>
      </div>

      {/* 결과 메시지 */}
      {result ? (
        <p
          className={
            "mt-3 rounded-lg border px-3 py-2 text-center text-sm font-bold " +
            (result.kind === "ok"
              ? "border-emerald-400/45 bg-emerald-400/15 text-emerald-100"
              : result.kind === "ng"
                ? "border-rose-400/45 bg-rose-400/15 text-rose-100"
                : "border-amber-300/45 bg-amber-300/10 text-amber-100")
          }
        >
          {result.kind === "ok"
            ? "🎉 완벽합니다! 모든 미지수를 정확히 찾았어요!"
            : result.kind === "ng"
              ? "❌ 틀린 값이 있어요. 성분 방정식을 다시 확인해보세요!"
              : `💡 힌트: ${result.text}`}
        </p>
      ) : null}

      {/* 네비 */}
      <div className="mt-3 flex justify-between gap-2">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={idx === 0}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:opacity-40"
        >
          ◀ 이전
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={idx === PROBS.length - 1}
          className="rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 disabled:opacity-40"
        >
          {idx === PROBS.length - 1 ? "🏆 마지막" : "다음 ▶"}
        </button>
      </div>

      {solved.size === PROBS.length ? (
        <div className="mt-3 rounded-2xl border-2 border-amber-300/55 bg-amber-300/15 p-4 text-center">
          <p className="text-base font-extrabold text-amber-100">
            🏆 5 문제 모두 해결!
          </p>
          <p className="mt-1 text-xs text-amber-50/85">
            상등 탐정의 자격을 얻었어요. 행렬 상등의 핵심 원리를 완벽히 익혔습니다.
          </p>
        </div>
      ) : null}
    </>
  );
}

