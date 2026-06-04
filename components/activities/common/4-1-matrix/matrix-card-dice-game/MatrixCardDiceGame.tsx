"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (게임 1 + 탐색 1) ─────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "noncommutative_round",
    prompt:
      "게임 중 가장 인상 깊었던 라운드를 골라 적어 보세요. 특히 주사위가 ‘×’ 또는 ‘−’ 였을 때 ‘나의 A×B 또는 A−B’ 와 ‘친구의 B×A 또는 B−A’ 의 점수가 달랐던 경우, 이 차이가 행렬곱의 비가환성 (A×B ≠ B×A) 이나 뺄셈의 비대칭성 (A−B ≠ B−A) 과 어떻게 연결되는지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: ‘나 = (1×2 카드 (1 0))’, ‘친구 = (2×1 카드 [[1],[4]])’ 일 때 주사위 ×. 내 점수 = A×B = (1×1+0×4) = [[1]] → 1 점. 친구 점수 = B×A = [[1×1, 1×0],[4×1, 4×0]] = [[1,0],[4,0]] → 합 5 점. 같은 카드 둘인데 곱하는 순서만 바꿨더니 결과 행렬의 크기조차 1×1 vs 2×2 로 달랐다. 즉 곱셈은 ‘누가 앞에 오느냐’ 가 결과를 완전히 바꾸는 비가환 연산이라는 걸 점수로 직접 체감했다.",
  },
  {
    id: "strategy_choice",
    prompt:
      "12 장의 카드 중 어떤 형태 (2×2 / 1×2 / 2×1) + 주사위 면 (+ / − / × / 0 / ½ / 2) 의 조합이 ‘점수를 크게 만들기’ 또는 ‘상대보다 유리하기’ 에 도움이 되었나요? 자신만의 전략을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 큰 점수가 필요할 때는 주사위 ‘×’ 가 나오기를 기대하면서, 내 카드를 1×2 작은 카드 + 친구 카드는 2×1 행렬로 만들어 ‘내 A×B = 1×1 작은 결과’ 보다 ‘친구 B×A = 2×2 큰 결과’ 가 되도록 유도했다 (반대로 내가 2×1 을 들면 내가 2×2 큰 결과). 반대로 안전한 점수는 + (양쪽 동일) 로 큰 값 카드 둘 다 잡는 것이 유리. − 는 음수가 나오면 0 점이라 위험.",
  },
];

// ─── 데이터 ────────────────────────────────────────────────
type Mat = { data: number[][]; shape: [number, number] };
type Card = { id: number; data: number[][]; shape: [number, number] };

const CARDS: Card[] = [
  { id: 0, data: [[2, 0], [1, 3]], shape: [2, 2] },
  { id: 1, data: [[0, 2]], shape: [1, 2] },
  { id: 2, data: [[1], [1]], shape: [2, 1] },
  { id: 3, data: [[4, 0], [3, 1]], shape: [2, 2] },
  { id: 4, data: [[3], [1]], shape: [2, 1] },
  { id: 5, data: [[1, 3], [2, 5]], shape: [2, 2] },
  { id: 6, data: [[1, 0]], shape: [1, 2] },
  { id: 7, data: [[3, 2]], shape: [1, 2] },
  { id: 8, data: [[3, 1]], shape: [1, 2] },
  { id: 9, data: [[1], [4]], shape: [2, 1] },
  { id: 10, data: [[2, 0], [1, 2]], shape: [2, 2] },
  { id: 11, data: [[3], [5]], shape: [2, 1] },
];

type Face = "+" | "−" | "×" | "0" | "½" | "2";
const FACES: Face[] = ["+", "−", "×", "0", "½", "2"];
const TOTAL_ROUNDS = 6;

// ─── 행렬 유틸 ─────────────────────────────────────────────
function matMul(A: Mat, B: Mat): Mat | null {
  const [rA, cA] = A.shape;
  const [rB, cB] = B.shape;
  if (cA !== rB) return null;
  const res: number[][] = [];
  for (let i = 0; i < rA; i++) {
    const row: number[] = [];
    for (let j = 0; j < cB; j++) {
      let s = 0;
      for (let k = 0; k < cA; k++) s += A.data[i][k] * B.data[k][j];
      row.push(s);
    }
    res.push(row);
  }
  return { data: res, shape: [rA, cB] };
}
function matAddSub(A: Mat, B: Mat, op: "+" | "−"): Mat | null {
  if (A.shape[0] !== B.shape[0] || A.shape[1] !== B.shape[1]) return null;
  const s = op === "+" ? 1 : -1;
  return {
    data: A.data.map((row, i) => row.map((v, j) => v + s * B.data[i][j])),
    shape: A.shape,
  };
}
function sumElems(m: Mat): number {
  return m.data.reduce((a, row) => a + row.reduce((b, v) => b + v, 0), 0);
}

// ─── 메인 ─────────────────────────────────────────────────
export default function MatrixCardDiceGame() {
  const [tab, setTab] = useState<"rule" | "game">("rule");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 행렬 카드 주사위 게임</h3>
        <p className="mt-2 leading-7 text-slate-300">
          12 장의 행렬 카드와 6 면 주사위로{" "}
          <b className="text-cyan-300">6 라운드 점수 게임</b> — 행렬 연산을 직접
          체험하며 합 · 차 · 곱의 비가환성을 발견해 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <TabBtn active={tab === "rule"} onClick={() => setTab("rule")}>
          📖 게임 규칙
        </TabBtn>
        <TabBtn active={tab === "game"} onClick={() => setTab("game")}>
          🎮 게임 시작
        </TabBtn>
      </div>

      <div className={tab === "rule" ? "mt-5" : "mt-5 hidden"}>
        <RulePanel onStart={() => setTab("game")} />
      </div>
      <div className={tab === "game" ? "mt-5" : "mt-5 hidden"}>
        <GamePanel />
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
        "rounded-xl px-3 py-2.5 text-center text-sm font-bold transition " +
        (active
          ? "bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/25"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ─── 공용 행렬 UI ─────────────────────────────────────────
function MatrixBracket({
  children,
  n,
  cellH = 28,
  gap = 2,
}: {
  children: ReactNode;
  n: number;
  cellH?: number;
  gap?: number;
}) {
  const h = n * cellH + (n - 1) * gap + 4;
  return (
    <span className="inline-flex items-stretch gap-0.5">
      <svg width={8} height={h} viewBox={`0 0 8 ${h}`} aria-hidden>
        <path
          d={`M 6 1 L 1 1 L 1 ${h - 1} L 6 ${h - 1}`}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </svg>
      <span>{children}</span>
      <svg width={8} height={h} viewBox={`0 0 8 ${h}`} aria-hidden>
        <path
          d={`M 2 1 L 7 1 L 7 ${h - 1} L 2 ${h - 1}`}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function MiniMat({ m, color = "#cbd5e1" }: { m: Mat; color?: string }) {
  const [rows, cols] = m.shape;
  return (
    <MatrixBracket n={rows}>
      <span
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${cols}, 26px)` }}
      >
        {m.data.flat().map((v, i) => (
          <span
            key={i}
            className="flex h-7 items-center justify-center rounded-sm border border-white/10 bg-slate-900 font-mono text-xs font-bold"
            style={{ color }}
          >
            {v}
          </span>
        ))}
      </span>
    </MatrixBracket>
  );
}

// ═══════════════════════════════════════════════════════════
//  RULE PANEL
// ═══════════════════════════════════════════════════════════

function RulePanel({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-300/35 bg-amber-300/[0.08] p-4">
        <p className="text-base font-extrabold text-amber-200">
          🎲 행렬 카드 주사위 게임 규칙
        </p>

        {/* 주사위 6면 */}
        <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/60 p-3">
          <p className="mb-2 text-xs font-bold text-slate-400">주사위 6 면</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["+", "−", "×"].map((op) => (
              <DieFace key={op} kind="op">
                {op}
              </DieFace>
            ))}
            {["0", "½", "2"].map((n) => (
              <DieFace key={n} kind="num">
                {n}
              </DieFace>
            ))}
          </div>
          <p className="mt-2 text-center text-xs leading-7 text-slate-300">
            <b className="text-amber-300">+ · − · ×</b> → 두 카드로 행렬 연산 ·{" "}
            <b className="text-violet-300">0 · ½ · 2</b> → 자신의 카드에 실수배
          </p>
        </div>

        {/* 규칙 */}
        <ol className="mt-3 space-y-3">
          <RuleItem n="①">
            매 라운드, <b className="text-sky-300">나</b> 와{" "}
            <b className="text-pink-300">친구</b> 가 행렬 카드를 각각 1 장씩
            선택한다. 한 번 선택한 카드는 다시 선택할 수 없다.
          </RuleItem>
          <RuleItem n="②">
            주사위를 굴려 <b className="text-amber-300">+, −, ×</b> 중 하나가 나오면
            행렬 연산을 수행한다.
            <ul className="mt-2 ml-3 space-y-1 text-xs">
              <li>
                <b className="text-amber-300">+</b>: 양쪽 모두 A+B 결과의 성분 합을
                점수로 한다.
              </li>
              <li>
                <b className="text-amber-300">−</b>: 나 = A−B, 친구 = B−A 결과의
                성분 합을 점수로 한다.
              </li>
              <li>
                <b className="text-amber-300">×</b>: 나 = A×B, 친구 = B×A 결과의
                성분 합을 점수로 한다.
              </li>
              <li>연산이 불가능하거나 음수 합이 나오면 0 점.</li>
            </ul>
          </RuleItem>
          <RuleItem n="③">
            주사위가 <b className="text-violet-300">0, ½, 2</b> 중 하나가 나오면 각자
            자신의 카드에 그 수를 실수배 한다.
            <br />나: k × (내 카드 성분 합), 친구: k × (친구 카드 성분 합)
          </RuleItem>
          <RuleItem n="④">
            이 과정을 <b className="text-amber-300">6 라운드</b> 반복하여{" "}
            <b className="text-amber-300">최종 합산 점수가 큰 쪽</b> 이 이긴다!
          </RuleItem>
        </ol>

        <div className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.06] px-3 py-2 text-xs leading-7 text-slate-200">
          💡 <b>핵심 포인트</b>: 행렬 곱셈에서 A×B 와 B×A 는 크기도, 값도 다를 수
          있습니다! − 연산도 A−B 와 B−A 는 부호가 반대입니다. 어떤 카드를 선택하느냐에
          따라 점수가 달라집니다.
        </div>

        {/* 예시 표 */}
        <div className="mt-4">
          <p className="text-xs font-bold text-slate-400">
            📌 예시 — 주사위: ×, 나: (1×2), 친구: (2×1)
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/60">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="px-2 py-2 text-left">계산자</th>
                  <th className="px-2 py-2 text-left">계산식</th>
                  <th className="px-2 py-2 text-left">결과</th>
                  <th className="px-2 py-2 text-left">점수</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="px-2 py-2 font-bold text-sky-300">👤 나</td>
                  <td className="px-2 py-2 font-mono">
                    <span className="text-amber-300">(1 0)</span> ×{" "}
                    <span className="text-violet-300">[[1],[4]]</span>
                  </td>
                  <td className="px-2 py-2 font-mono text-emerald-300">
                    [[1]] <span className="text-[10px] text-slate-500">(1×1)</span>
                  </td>
                  <td className="px-2 py-2 font-bold text-sky-300">1 점</td>
                </tr>
                <tr>
                  <td className="px-2 py-2 font-bold text-pink-300">👥 친구</td>
                  <td className="px-2 py-2 font-mono">
                    <span className="text-violet-300">[[1],[4]]</span> ×{" "}
                    <span className="text-amber-300">(1 0)</span>
                  </td>
                  <td className="px-2 py-2 font-mono text-emerald-300">
                    [[1,0],[4,0]]{" "}
                    <span className="text-[10px] text-slate-500">(2×2)</span>
                  </td>
                  <td className="px-2 py-2 font-bold text-pink-300">5 점</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            → 같은 카드 두 장이라도 순서에 따라 결과가 완전히 달라집니다!
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onStart}
          className="rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110"
        >
          🎮 게임 시작하기 ▶
        </button>
      </div>
    </div>
  );
}

function DieFace({ children, kind }: { children: ReactNode; kind: "op" | "num" }) {
  const cls =
    kind === "op"
      ? "border-amber-300/55 bg-amber-300/15 text-amber-100"
      : "border-violet-300/55 bg-violet-400/15 text-violet-100";
  return (
    <span
      className={
        "flex h-10 w-10 items-center justify-center rounded-md border-2 font-mono text-base font-extrabold " +
        cls
      }
    >
      {children}
    </span>
  );
}

function RuleItem({ n, children }: { n: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-xs leading-7 text-slate-300">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300/20 font-bold text-amber-200">
        {n}
      </span>
      <div>{children}</div>
    </li>
  );
}

// ═══════════════════════════════════════════════════════════
//  GAME PANEL
// ═══════════════════════════════════════════════════════════

type PickState = "me" | "fr" | "done";
type Winner = "me" | "fr" | "tie";
type HistRow = { round: number; face: Face; me: number; fr: number; winner: Winner };
type RoundCalc = {
  scoreMe: number;
  scoreFr: number;
  bodyMe: ReactNode;
  bodyFr: ReactNode;
  ctx: string;
};

function GamePanel() {
  const [round, setRound] = useState(1);
  const [totalMe, setTotalMe] = useState(0);
  const [totalFr, setTotalFr] = useState(0);
  const [winsMe, setWinsMe] = useState(0);
  const [winsFr, setWinsFr] = useState(0);
  const [usedCards, setUsedCards] = useState<Set<number>>(new Set());
  const [selMe, setSelMe] = useState<number | null>(null);
  const [selFr, setSelFr] = useState<number | null>(null);
  const [pickState, setPickState] = useState<PickState>("me");

  // 주사위
  const [dieFace, setDieFace] = useState<string>("?");
  const [dieKind, setDieKind] = useState<"idle" | "rolling" | "op" | "num">("idle");
  const [currentFace, setCurrentFace] = useState<Face | null>(null);
  const rollTimerRef = useRef<number | null>(null);

  // 라운드 결과
  const [roundCalc, setRoundCalc] = useState<RoundCalc | null>(null);
  const [roundWinner, setRoundWinner] = useState<Winner | null>(null);
  const [roundDone, setRoundDone] = useState(false);
  const [confirmedRounds, setConfirmedRounds] = useState<number>(0);

  // 기록
  const [history, setHistory] = useState<HistRow[]>([]);

  // 최종
  const [finalShown, setFinalShown] = useState(false);

  // cleanup
  useEffect(() => {
    return () => {
      if (rollTimerRef.current !== null) window.clearTimeout(rollTimerRef.current);
    };
  }, []);

  function selectCard(id: number) {
    if (usedCards.has(id) || roundDone) return;
    if (pickState === "me") {
      setSelMe(id);
      setPickState("fr");
    } else if (pickState === "fr") {
      if (id === selMe) return;
      setSelFr(id);
      setPickState("done");
    }
  }

  function rollDice() {
    if (pickState !== "done" || dieKind === "rolling") return;
    setDieKind("rolling");
    let t = 0;
    const tick = () => {
      const f = FACES[Math.floor(Math.random() * 6)];
      setDieFace(f);
      t++;
      if (t > 12) {
        const final = FACES[Math.floor(Math.random() * 6)];
        setDieFace(final);
        setCurrentFace(final);
        const isOp = final === "+" || final === "−" || final === "×";
        setDieKind(isOp ? "op" : "num");
        computeResult(final);
      } else {
        rollTimerRef.current = window.setTimeout(tick, 70);
      }
    };
    tick();
  }

  function computeResult(face: Face) {
    if (selMe === null || selFr === null) return;
    const A = CARDS[selMe];
    const B = CARDS[selFr];
    const calc = doRound(A, B, face);
    setRoundCalc(calc);
    const w: Winner =
      calc.scoreMe > calc.scoreFr ? "me" : calc.scoreFr > calc.scoreMe ? "fr" : "tie";
    setRoundWinner(w);
    setTotalMe((p) => p + calc.scoreMe);
    setTotalFr((p) => p + calc.scoreFr);
    if (w === "me") setWinsMe((p) => p + 1);
    else if (w === "fr") setWinsFr((p) => p + 1);
    setRoundDone(true);
  }

  function confirmRound() {
    if (!roundCalc || !roundWinner || currentFace === null) return;
    setHistory((prev) => [
      ...prev,
      {
        round,
        face: currentFace,
        me: roundCalc.scoreMe,
        fr: roundCalc.scoreFr,
        winner: roundWinner,
      },
    ]);
    setConfirmedRounds(round);
    if (round >= TOTAL_ROUNDS) {
      setTimeout(() => setFinalShown(true), 500);
    }
  }

  function nextRound() {
    if (selMe !== null) {
      setUsedCards((prev) => {
        const next = new Set(prev);
        next.add(selMe);
        if (selFr !== null) next.add(selFr);
        return next;
      });
    }
    setSelMe(null);
    setSelFr(null);
    setPickState("me");
    setCurrentFace(null);
    setDieFace("?");
    setDieKind("idle");
    setRoundCalc(null);
    setRoundWinner(null);
    setRoundDone(false);
    setRound((r) => r + 1);
  }

  function restart() {
    if (rollTimerRef.current !== null) window.clearTimeout(rollTimerRef.current);
    rollTimerRef.current = null;
    setRound(1);
    setTotalMe(0);
    setTotalFr(0);
    setWinsMe(0);
    setWinsFr(0);
    setUsedCards(new Set());
    setSelMe(null);
    setSelFr(null);
    setPickState("me");
    setDieFace("?");
    setDieKind("idle");
    setCurrentFace(null);
    setRoundCalc(null);
    setRoundWinner(null);
    setRoundDone(false);
    setHistory([]);
    setConfirmedRounds(0);
    setFinalShown(false);
  }

  const ctxText = (() => {
    if (currentFace === null) return "카드를 2 장 선택한 후 주사위를 굴리세요.";
    return CTX_MAP[currentFace] ?? "";
  })();

  return (
    <div className="space-y-3">
      {/* 스코어보드 */}
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <ScoreCard side="me" name="👤 나" score={totalMe} wins={winsMe} />
        <div className="flex flex-col items-center justify-center">
          <p className="rounded-md border border-amber-300/45 bg-amber-300/15 px-2 py-0.5 font-mono text-xs font-bold text-amber-100">
            라운드 {round} / {TOTAL_ROUNDS}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {pickState === "me"
              ? "내 카드 선택"
              : pickState === "fr"
                ? "친구 카드 선택"
                : currentFace
                  ? "결과 확인"
                  : "주사위를 굴리세요"}
          </p>
        </div>
        <ScoreCard side="fr" name="👥 친구" score={totalFr} wins={winsFr} />
      </div>

      {/* 카드 그리드 */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <p className="mb-2 text-xs font-bold text-slate-300">
          🃏 행렬 카드 — 먼저{" "}
          <span className="text-sky-300">나</span> 의 카드, 다음에{" "}
          <span className="text-pink-300">친구</span> 의 카드를 선택하세요
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {CARDS.map((card) => {
            const used = usedCards.has(card.id);
            const isMe = selMe === card.id;
            const isFr = selFr === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => selectCard(card.id)}
                disabled={used || roundDone}
                className={
                  "flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition disabled:cursor-not-allowed " +
                  (used
                    ? "border-white/5 bg-white/[0.02] opacity-30"
                    : isMe
                      ? "border-sky-300/70 bg-sky-400/15"
                      : isFr
                        ? "border-pink-300/70 bg-pink-400/15"
                        : "border-white/10 bg-slate-900 hover:bg-slate-800")
                }
              >
                <p
                  className={
                    "text-[10px] font-bold " +
                    (isMe
                      ? "text-sky-300"
                      : isFr
                        ? "text-pink-300"
                        : "text-slate-400")
                  }
                >
                  {isMe ? "👤 나" : isFr ? "👥 친구" : `카드 ${card.id + 1}`}
                </p>
                <MiniMat
                  m={card as Mat}
                  color={isMe ? "#7dd3fc" : isFr ? "#f9a8d4" : "#cbd5e1"}
                />
                <p className="text-[10px] text-slate-500">{card.shape.join("×")}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 액션 존 */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* 주사위 */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={
                "flex h-16 w-16 items-center justify-center rounded-xl border-4 font-mono text-3xl font-extrabold transition " +
                (dieKind === "rolling"
                  ? "animate-pulse border-cyan-300/70 bg-cyan-400/15 text-cyan-100"
                  : dieKind === "op"
                    ? "border-amber-300/70 bg-amber-300/15 text-amber-100"
                    : dieKind === "num"
                      ? "border-violet-300/70 bg-violet-400/15 text-violet-100"
                      : "border-white/15 bg-slate-900 text-slate-500")
              }
            >
              {dieFace}
            </div>
            <p className="text-[10px] font-bold text-slate-400">
              {dieKind === "op"
                ? "연산 주사위"
                : dieKind === "num"
                  ? "실수배 주사위"
                  : "주사위"}
            </p>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-center text-xs text-slate-300">{ctxText}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={rollDice}
                disabled={pickState !== "done" || roundDone}
                className="rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 disabled:opacity-50"
              >
                🎲 주사위 굴리기
              </button>
              <button
                type="button"
                onClick={confirmRound}
                disabled={!roundDone || confirmedRounds >= round}
                className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:opacity-50"
              >
                ✅ 라운드 확정
              </button>
              {confirmedRounds >= round && round < TOTAL_ROUNDS ? (
                <button
                  type="button"
                  onClick={nextRound}
                  className="rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:brightness-110"
                >
                  다음 라운드 ▶
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* 계산 결과 */}
      {roundCalc ? (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] p-4">
          <p className="text-sm font-extrabold text-cyan-200">
            📐 이번 라운드 계산 결과
          </p>
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-sky-400/35 bg-sky-400/[0.06] p-3">
              <p className="text-xs font-bold text-sky-300">👤 나의 계산</p>
              <div className="mt-2 text-xs leading-7 text-slate-200">
                {roundCalc.bodyMe}
              </div>
              <p className="mt-2 text-right font-mono text-base font-extrabold text-sky-200">
                +{roundCalc.scoreMe} 점
              </p>
            </div>
            <div className="rounded-lg border border-pink-400/35 bg-pink-400/[0.06] p-3">
              <p className="text-xs font-bold text-pink-300">👥 친구의 계산</p>
              <div className="mt-2 text-xs leading-7 text-slate-200">
                {roundCalc.bodyFr}
              </div>
              <p className="mt-2 text-right font-mono text-base font-extrabold text-pink-200">
                +{roundCalc.scoreFr} 점
              </p>
            </div>
          </div>
          {roundWinner ? (
            <p
              className={
                "mt-3 rounded-lg border px-3 py-2 text-center text-sm font-bold " +
                (roundWinner === "me"
                  ? "border-sky-400/55 bg-sky-400/15 text-sky-100"
                  : roundWinner === "fr"
                    ? "border-pink-400/55 bg-pink-400/15 text-pink-100"
                    : "border-amber-300/55 bg-amber-300/15 text-amber-100")
              }
            >
              {roundWinner === "me"
                ? "👤 나의 라운드!"
                : roundWinner === "fr"
                  ? "👥 친구의 라운드!"
                  : "🤝 이번 라운드 동점!"}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* 기록 */}
      {history.length > 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs font-bold text-slate-300">📋 라운드 기록</p>
          <div className="mt-2 space-y-1">
            {history.map((h) => (
              <div
                key={h.round}
                className="flex items-center gap-2 rounded-md border border-white/10 bg-slate-950/40 px-2 py-1 text-[11px]"
              >
                <span className="rounded-md bg-amber-300/15 px-1.5 font-mono font-bold text-amber-200">
                  R{h.round}
                </span>
                <span className="rounded-md bg-cyan-400/15 px-1.5 font-mono font-bold text-cyan-200">
                  {h.face}
                </span>
                <span className="text-slate-500">나</span>
                <span className="font-mono font-bold text-sky-300">{h.me} pt</span>
                <span className="text-slate-500">친구</span>
                <span className="font-mono font-bold text-pink-300">{h.fr} pt</span>
                <span
                  className={
                    "ml-auto rounded-md px-1.5 font-bold " +
                    (h.winner === "me"
                      ? "bg-sky-400/20 text-sky-200"
                      : h.winner === "fr"
                        ? "bg-pink-400/20 text-pink-200"
                        : "bg-amber-300/20 text-amber-200")
                  }
                >
                  {h.winner === "me" ? "내 승" : h.winner === "fr" ? "친구 승" : "동점"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 최종 결과 */}
      {finalShown ? (
        <FinalCard
          totalMe={totalMe}
          totalFr={totalFr}
          winsMe={winsMe}
          winsFr={winsFr}
          onRestart={restart}
        />
      ) : null}
    </div>
  );
}

const CTX_MAP: Record<Face, string> = {
  "+": "덧셈: A+B (양쪽 동일)",
  "−": "뺄셈: 나 = A−B, 친구 = B−A",
  "×": "곱셈: 나 = A×B, 친구 = B×A",
  "0": "실수배 0: 모든 성분 × 0",
  "½": "실수배 ½: 모든 성분 × 0.5",
  "2": "실수배 2: 모든 성분 × 2",
};

function ScoreCard({
  side,
  name,
  score,
  wins,
}: {
  side: "me" | "fr";
  name: string;
  score: number;
  wins: number;
}) {
  const tone =
    side === "me"
      ? { border: "border-sky-400/40", text: "text-sky-300", bg: "bg-sky-400/[0.08]" }
      : {
          border: "border-pink-400/40",
          text: "text-pink-300",
          bg: "bg-pink-400/[0.08]",
        };
  return (
    <div
      className={`rounded-lg border ${tone.border} ${tone.bg} px-3 py-2 text-center`}
    >
      <p className={`text-xs font-bold ${tone.text}`}>{name}</p>
      <p className={`font-mono text-2xl font-extrabold ${tone.text}`}>{score}</p>
      <p className="text-[10px] text-slate-400">{wins} 승</p>
    </div>
  );
}

function FinalCard({
  totalMe,
  totalFr,
  winsMe,
  winsFr,
  onRestart,
}: {
  totalMe: number;
  totalFr: number;
  winsMe: number;
  winsFr: number;
  onRestart: () => void;
}) {
  const { trophy, title, tone } =
    totalMe > totalFr
      ? { trophy: "🏆", title: "내가 승리!", tone: "text-sky-300" }
      : totalFr > totalMe
        ? { trophy: "🥈", title: "친구의 승리!", tone: "text-pink-300" }
        : { trophy: "🤝", title: "무승부!", tone: "text-amber-300" };

  return (
    <div className="rounded-2xl border-2 border-amber-300/55 bg-amber-300/15 p-5 text-center">
      <div className="text-5xl">{trophy}</div>
      <p className={`mt-2 text-2xl font-extrabold ${tone}`}>{title}</p>
      <p className="mt-1 font-mono text-lg font-bold text-slate-100">
        {totalMe} : {totalFr}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-sky-400/45 bg-sky-400/[0.08] px-3 py-2">
          <p className="text-xs font-bold text-sky-300">👤 나</p>
          <p className="font-mono text-xl font-extrabold text-sky-200">{totalMe}</p>
          <p className="text-[10px] text-slate-400">{winsMe} 라운드 승</p>
        </div>
        <div className="rounded-lg border border-pink-400/45 bg-pink-400/[0.08] px-3 py-2">
          <p className="text-xs font-bold text-pink-300">👥 친구</p>
          <p className="font-mono text-xl font-extrabold text-pink-200">{totalFr}</p>
          <p className="text-[10px] text-slate-400">{winsFr} 라운드 승</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRestart}
        className="mt-4 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:brightness-110"
      >
        🔄 다시 하기
      </button>
    </div>
  );
}

// ─── 라운드 계산 함수 ─────────────────────────────────────
function doRound(A: Card, B: Card, face: Face): RoundCalc {
  const ctx = CTX_MAP[face];
  if (face === "+") {
    const r = matAddSub(A as Mat, B as Mat, "+");
    if (!r) {
      const msg = (
        <span className="text-rose-300">
          크기 불일치: {A.shape.join("×")} + {B.shape.join("×")} → 불가{" "}
          <span className="text-slate-500">(0 점)</span>
        </span>
      );
      return { scoreMe: 0, scoreFr: 0, bodyMe: msg, bodyFr: msg, ctx };
    }
    const s = sumElems(r);
    const body = (
      <>
        <EqRow
          left={<MiniMat m={A as Mat} color="#fbbf24" />}
          op="+"
          right={<MiniMat m={B as Mat} color="#c4b5fd" />}
          result={<MiniMat m={r} color="#4ade80" />}
        />
        <p className="mt-1">
          성분의 합 ={" "}
          <span className="font-mono font-extrabold text-emerald-300">{s}</span> 점{" "}
          <span className="text-[10px] text-slate-500">(+ 는 양쪽 동일)</span>
        </p>
      </>
    );
    return { scoreMe: s, scoreFr: s, bodyMe: body, bodyFr: body, ctx };
  }
  if (face === "−") {
    const rAB = matAddSub(A as Mat, B as Mat, "−");
    if (!rAB) {
      const msg = (
        <span className="text-rose-300">
          크기 불일치 → 불가 <span className="text-slate-500">(0 점)</span>
        </span>
      );
      return { scoreMe: 0, scoreFr: 0, bodyMe: msg, bodyFr: msg, ctx };
    }
    const rBA = matAddSub(B as Mat, A as Mat, "−")!;
    const sAB = sumElems(rAB);
    const sBA = sumElems(rBA);
    const bodyMe = (
      <>
        <EqRow
          left={<MiniMat m={A as Mat} color="#fbbf24" />}
          op="−"
          right={<MiniMat m={B as Mat} color="#c4b5fd" />}
          result={<MiniMat m={rAB} color="#4ade80" />}
        />
        <p className="mt-1">
          성분의 합 ={" "}
          <span className="font-mono font-extrabold text-emerald-300">{sAB}</span>
          {sAB < 0 ? (
            <span className="text-[10px] text-slate-500"> → 음수라 0 점</span>
          ) : null}
        </p>
      </>
    );
    const bodyFr = (
      <>
        <EqRow
          left={<MiniMat m={B as Mat} color="#fbbf24" />}
          op="−"
          right={<MiniMat m={A as Mat} color="#c4b5fd" />}
          result={<MiniMat m={rBA} color="#4ade80" />}
        />
        <p className="mt-1">
          성분의 합 ={" "}
          <span className="font-mono font-extrabold text-emerald-300">{sBA}</span>
          {sBA < 0 ? (
            <span className="text-[10px] text-slate-500"> → 음수라 0 점</span>
          ) : null}
        </p>
      </>
    );
    return {
      scoreMe: Math.max(0, sAB),
      scoreFr: Math.max(0, sBA),
      bodyMe,
      bodyFr,
      ctx,
    };
  }
  if (face === "×") {
    const AB = matMul(A as Mat, B as Mat);
    const BA = matMul(B as Mat, A as Mat);
    const sAB = AB ? sumElems(AB) : 0;
    const sBA = BA ? sumElems(BA) : 0;
    const bodyMe = AB ? (
      <>
        <EqRow
          left={<MiniMat m={A as Mat} color="#fbbf24" />}
          op="×"
          right={<MiniMat m={B as Mat} color="#c4b5fd" />}
          result={<MiniMat m={AB} color="#4ade80" />}
        />
        <p className="mt-1">
          결과 크기:{" "}
          <span className="text-slate-500">{AB.shape.join("×")}</span> · 성분의 합 ={" "}
          <span className="font-mono font-extrabold text-emerald-300">{sAB}</span> 점
        </p>
      </>
    ) : (
      <span className="text-rose-300">
        나 ({A.shape.join("×")}) × 친구 ({B.shape.join("×")}): 열수 ≠ 행수 → 곱셈
        불가 <span className="text-slate-500">(0 점)</span>
      </span>
    );
    const bodyFr = BA ? (
      <>
        <EqRow
          left={<MiniMat m={B as Mat} color="#fbbf24" />}
          op="×"
          right={<MiniMat m={A as Mat} color="#c4b5fd" />}
          result={<MiniMat m={BA} color="#4ade80" />}
        />
        <p className="mt-1">
          결과 크기:{" "}
          <span className="text-slate-500">{BA.shape.join("×")}</span> · 성분의 합 ={" "}
          <span className="font-mono font-extrabold text-emerald-300">{sBA}</span> 점
        </p>
      </>
    ) : (
      <span className="text-rose-300">
        친구 ({B.shape.join("×")}) × 나 ({A.shape.join("×")}): 열수 ≠ 행수 → 곱셈
        불가 <span className="text-slate-500">(0 점)</span>
      </span>
    );
    return { scoreMe: sAB, scoreFr: sBA, bodyMe, bodyFr, ctx };
  }
  // scalar: 0, ½, 2
  const k = face === "0" ? 0 : face === "½" ? 0.5 : 2;
  const sMe = sumElems(A as Mat);
  const sFr = sumElems(B as Mat);
  const scoreMe = Math.round(k * sMe * 100) / 100;
  const scoreFr = Math.round(k * sFr * 100) / 100;
  const bodyMe = (
    <>
      <span className="font-mono">
        <span className="rounded-md bg-violet-400/20 px-1 font-bold text-violet-200">
          {face}
        </span>{" "}
        × <MiniMat m={A as Mat} color="#fbbf24" />
      </span>
      <p className="mt-1">
        {face} × (성분 합 {sMe}) ={" "}
        <span className="font-mono font-extrabold text-emerald-300">{scoreMe}</span> 점
      </p>
    </>
  );
  const bodyFr = (
    <>
      <span className="font-mono">
        <span className="rounded-md bg-violet-400/20 px-1 font-bold text-violet-200">
          {face}
        </span>{" "}
        × <MiniMat m={B as Mat} color="#fbbf24" />
      </span>
      <p className="mt-1">
        {face} × (성분 합 {sFr}) ={" "}
        <span className="font-mono font-extrabold text-emerald-300">{scoreFr}</span> 점
      </p>
    </>
  );
  return { scoreMe, scoreFr, bodyMe, bodyFr, ctx };
}

function EqRow({
  left,
  op,
  right,
  result,
}: {
  left: ReactNode;
  op: string;
  right: ReactNode;
  result: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
      {left}
      <span className="font-bold text-slate-400">{op}</span>
      {right}
      <span className="font-bold text-slate-400">=</span>
      {result}
    </div>
  );
}
