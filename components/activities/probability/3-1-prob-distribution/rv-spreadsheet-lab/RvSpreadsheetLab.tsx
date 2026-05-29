"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 문제 데이터 ──────────────────────────────────────────
type Problem = {
  id: string;
  label: string;     // 버튼에 표시
  formula: string;   // "Y = 3X + 2"
  info: string;
  X: number[];
  Y: number[];
  P: number[];
  /** B2 의 정답 수식 (예 "=3*B1+2") */
  B2formula: string;
  hintB2: string;
  /** Y·P(Y) 각 항(행 4) */
  YP: number[];
  /** Y²·P(Y) 각 항(행 5) */
  Y2P: number[];
  EY: number;
  EY2: number;
  VY: number;
  sY: number;
};

const PROBS: Problem[] = [
  {
    id: "p1",
    label: "📌 문제 1 : Y = 3X+2",
    formula: "Y = 3X + 2",
    info: "X의 값 : 2, 4, 6, 8  |  P(Y) = {0.4, 0.3, 0.2, 0.1}",
    X: [2, 4, 6, 8], Y: [8, 14, 20, 26], P: [0.4, 0.3, 0.2, 0.1],
    B2formula: "=3*B1+2",
    hintB2: "Y = 3X+2 이므로 =3*B1+2",
    YP: [3.2, 4.2, 4.0, 2.6], Y2P: [25.6, 58.8, 80.0, 67.6],
    EY: 14, EY2: 232, VY: 36, sY: 6,
  },
  {
    id: "p2",
    label: "📌 문제 2 : Y = 2X−1",
    formula: "Y = 2X − 1",
    info: "X의 값 : 1, 2, 3, 4  |  P(Y) = {0.3, 0.3, 0.2, 0.2}",
    X: [1, 2, 3, 4], Y: [1, 3, 5, 7], P: [0.3, 0.3, 0.2, 0.2],
    B2formula: "=2*B1-1",
    hintB2: "Y = 2X−1 이므로 =2*B1-1",
    YP: [0.3, 0.9, 1.0, 1.4], Y2P: [0.3, 2.7, 5.0, 9.8],
    EY: 3.6, EY2: 17.8, VY: 4.84, sY: 2.2,
  },
  {
    id: "p3",
    label: "📌 문제 3 : Y = 2X+3",
    formula: "Y = 2X + 3",
    info: "X의 값 : 1, 2, 3, 4  |  P(Y) = {0.1, 0.3, 0.4, 0.2}",
    X: [1, 2, 3, 4], Y: [5, 7, 9, 11], P: [0.1, 0.3, 0.4, 0.2],
    B2formula: "=2*B1+3",
    hintB2: "Y = 2X+3 이므로 =2*B1+3",
    YP: [0.5, 2.1, 3.6, 2.2], Y2P: [2.5, 14.7, 32.4, 24.2],
    EY: 8.4, EY2: 73.8, VY: 3.24, sY: 1.8,
  },
];

// ─── 단계 정의 ────────────────────────────────────────────
type Step =
  | { type: "formula"; cell: "B2" | "B4" | "B5" | "F7" | "F8" }
  | { type: "fill"; row: 2 | 4 | 5 }
  | { type: "sum"; row: 4 | 5 };

const STEPS: Step[] = [
  { type: "formula", cell: "B2" },
  { type: "fill", row: 2 },
  { type: "formula", cell: "B4" },
  { type: "fill", row: 4 },
  { type: "sum", row: 4 },
  { type: "formula", cell: "B5" },
  { type: "fill", row: 5 },
  { type: "sum", row: 5 },
  { type: "formula", cell: "F7" },
  { type: "formula", cell: "F8" },
];

const TOTAL_STEPS = STEPS.length;

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "fill_handle_pattern",
    prompt:
      "‘채우기 핸들’로 수식을 옆 셀로 복사할 때 셀 주소(B1·B2·B3 …)가 어떻게 자동으로 바뀌었는지 직접 본 결과를 적어 보세요.",
    kind: "text",
    placeholder: "예: B2의 =3*B1+2 를 E2까지 드래그하니 C2=3*C1+2, D2=3*D1+2 처럼 열 글자(B→C→D→E)만 같이 바뀌었다.",
  },
  {
    id: "ax_b_predict_check",
    prompt:
      "직접 구한 E(Y), V(Y), σ(Y) 값을 공식 E(aX+b)=a·E(X)+b, V(aX+b)=a²·V(X) 로 예측한 값과 비교해 보세요. 일치했나요?",
    kind: "text",
    placeholder: "예: 문제 1에서 E(X)=4, V(X)=4 이고 a=3, b=2 → E(Y)=3·4+2=14, V(Y)=9·4=36. 시트에서 구한 값과 정확히 같았다.",
  },
];

// ─── 셀 표시용 상태 ───────────────────────────────────────
type CellState = "empty" | "formula" | "computed" | "sum" | "result";

type SheetState = {
  // 입력 시트 표시값 (display)
  d2b: string; d2c: string; d2d: string; d2e: string;
  d4b: string; d4c: string; d4d: string; d4e: string;
  d5b: string; d5c: string; d5d: string; d5e: string;
  // 합/결과
  r4f: string; r4fState: CellState;
  r5f: string; r5fState: CellState;
  r7f: string;
  r8f: string;
  // 셀 상태 (input/formula/sum 등)
  r2bFilled: boolean; r2cFilled: boolean; r2dFilled: boolean; r2eFilled: boolean;
  r4bFilled: boolean; r4cFilled: boolean; r4dFilled: boolean; r4eFilled: boolean;
  r5bFilled: boolean; r5cFilled: boolean; r5dFilled: boolean; r5eFilled: boolean;
  /** 컴퓨티드 모드(채우기 완료 후 실제 값으로 교체) */
  r4Computed: boolean;
  r5Computed: boolean;
  // 수식 기록 시트
  fr2b: string; fr2c: string; fr2d: string; fr2e: string;
  fr4b: string; fr4c: string; fr4d: string; fr4e: string;
  fr5b: string; fr5c: string; fr5d: string; fr5e: string;
  fr4f: string;
  fr5f: string;
  fr7f: string;
  fr8f: string;
};

function emptySheet(): SheetState {
  return {
    d2b: "?", d2c: "—", d2d: "—", d2e: "—",
    d4b: "?", d4c: "—", d4d: "—", d4e: "—",
    d5b: "?", d5c: "—", d5d: "—", d5e: "—",
    r4f: "", r4fState: "empty",
    r5f: "", r5fState: "empty",
    r7f: "",
    r8f: "",
    r2bFilled: false, r2cFilled: false, r2dFilled: false, r2eFilled: false,
    r4bFilled: false, r4cFilled: false, r4dFilled: false, r4eFilled: false,
    r5bFilled: false, r5cFilled: false, r5dFilled: false, r5eFilled: false,
    r4Computed: false,
    r5Computed: false,
    fr2b: "—", fr2c: "—", fr2d: "—", fr2e: "—",
    fr4b: "—", fr4c: "—", fr4d: "—", fr4e: "—",
    fr5b: "—", fr5c: "—", fr5d: "—", fr5e: "—",
    fr4f: "—",
    fr5f: "—",
    fr7f: "—",
    fr8f: "—",
  };
}

// ─── 메인 ─────────────────────────────────────────────────
export default function RvSpreadsheetLab() {
  const [probIdx, setProbIdx] = useState(0);
  const [tab, setTab] = useState<"guide" | "practice">("guide");
  const [stepIdx, setStepIdx] = useState(0);
  const [sheet, setSheet] = useState<SheetState>(emptySheet);
  const [input, setInput] = useState("");
  const [inputState, setInputState] = useState<"" | "ok" | "err">("");
  const [feedback, setFeedback] = useState<{ tone: "info" | "ok" | "ng"; msg: string }>({
    tone: "info", msg: "← 수식을 입력하고 확인 버튼을 누르세요",
  });
  // 입력 셰이크 트리거(잘못 입력 시 key 변경으로 animation 재실행).
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const p = PROBS[probIdx];
  const step = stepIdx < TOTAL_STEPS ? STEPS[stepIdx] : null;
  const completed = stepIdx >= TOTAL_STEPS;

  // 문제 변경 시 시트·진행 초기화 (사용자 액션 → 핸들러에서 직접 처리).
  function selectProb(i: number) {
    if (i === probIdx) return;
    setProbIdx(i);
    resetPractice();
  }

  function resetPractice() {
    setStepIdx(0);
    setSheet(emptySheet());
    setInput("");
    setInputState("");
    setFeedback({ tone: "info", msg: "← 수식을 입력하고 확인 버튼을 누르세요" });
  }

  // 단계 진행 시 입력 포커스 — 외부 시스템(DOM)이라 useEffect 적절.
  useEffect(() => {
    if (step?.type === "formula" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [stepIdx, step?.type]);

  const norm = (s: string) => s.replace(/\s/g, "").toUpperCase();

  function expectedFormula(cell: "B2" | "B4" | "B5" | "F7" | "F8") {
    if (cell === "B2") return p.B2formula;
    if (cell === "B4") return "=B2*B3";
    if (cell === "B5") return "=B2^2*B3";
    if (cell === "F7") return "=F5-F4^2";
    return "=SQRT(F7)";
  }

  function applyFormulaCorrect(cell: "B2" | "B4" | "B5" | "F7" | "F8") {
    setSheet((s) => {
      const next = { ...s };
      if (cell === "B2") {
        next.d2b = p.B2formula;
        next.r2bFilled = true;
        next.fr2b = p.B2formula;
      } else if (cell === "B4") {
        next.d4b = "=B2*B3";
        next.r4bFilled = true;
        next.fr4b = "=B2*B3";
      } else if (cell === "B5") {
        next.d5b = "=B2^2*B3";
        next.r5bFilled = true;
        next.fr5b = "=B2^2*B3";
      } else if (cell === "F7") {
        next.r7f = fmtNumber(p.VY);
        next.fr7f = "=F5-F4^2";
      } else if (cell === "F8") {
        next.r8f = fmtNumber(p.sY);
        next.fr8f = "=SQRT(F7)";
      }
      return next;
    });

    if (cell === "B2") setFeedback({ tone: "ok", msg: `✓ 정확해요! B2 = ${p.Y[0]}  채우기 핸들로 E2까지 드래그하세요.` });
    else if (cell === "B4") setFeedback({ tone: "ok", msg: "✓ 정확해요! 채우기 핸들로 E4까지 드래그하세요." });
    else if (cell === "B5") setFeedback({ tone: "ok", msg: "✓ 정확해요! 채우기 핸들로 E5까지 드래그하세요." });
    else if (cell === "F7") setFeedback({ tone: "ok", msg: `✓ V(Y) = ${fmtNumber(p.VY)}  분산을 구했습니다! 이제 표준편차를 구하세요.` });
    else if (cell === "F8") setFeedback({ tone: "ok", msg: `✓ σ(Y) = ${fmtNumber(p.sY)}  표준편차까지 구했습니다! 🎊` });
  }

  function checkFormula() {
    if (!step || step.type !== "formula") return;
    const val = input.trim();
    const exp = expectedFormula(step.cell);
    if (norm(val) === norm(exp)) {
      setInputState("ok");
      applyFormulaCorrect(step.cell);
      setStepIdx((i) => i + 1);
      setInput("");
    } else {
      setInputState("err");
      setShakeKey((k) => k + 1);
      if (!val.startsWith("=")) {
        setFeedback({ tone: "ng", msg: "❌ 수식은 = 기호로 시작해야 합니다." });
      } else if (step.cell === "B5" && norm(val).includes("B2*B3") && !norm(val).includes("^2")) {
        setFeedback({ tone: "ng", msg: "❌ 제곱을 잊었어요! Y² 는 B2^2 으로 표현합니다: =B2^2*B3" });
      } else {
        setFeedback({ tone: "ng", msg: "❌ 수식이 다릅니다. 힌트 버튼을 눌러보세요." });
      }
    }
  }

  function doFill() {
    if (!step || step.type !== "fill") return;
    const rn = step.row;
    const cols: ("c" | "d" | "e")[] = ["c", "d", "e"];
    const colChars = ["C", "D", "E"];
    const srcFmt = rn === 2 ? p.B2formula : rn === 4 ? "=B2*B3" : "=B2^2*B3";
    const newFormulas = colChars.map((C) => srcFmt.replace(/B/g, C));

    setSheet((s) => {
      const next = { ...s };
      cols.forEach((c, i) => {
        if (rn === 2) {
          (next as Record<string, unknown>)[`d2${c}`] = newFormulas[i];
          (next as Record<string, unknown>)[`r2${c}Filled`] = true;
          (next as Record<string, unknown>)[`fr2${c}`] = newFormulas[i];
        } else if (rn === 4) {
          (next as Record<string, unknown>)[`d4${c}`] = newFormulas[i];
          (next as Record<string, unknown>)[`r4${c}Filled`] = true;
          (next as Record<string, unknown>)[`fr4${c}`] = newFormulas[i];
        } else {
          (next as Record<string, unknown>)[`d5${c}`] = newFormulas[i];
          (next as Record<string, unknown>)[`r5${c}Filled`] = true;
          (next as Record<string, unknown>)[`fr5${c}`] = newFormulas[i];
        }
      });
      return next;
    });

    if (rn === 2) setFeedback({ tone: "ok", msg: `✓ Y 값 채우기 완료! (${p.Y.join(", ")})  이제 B4 수식을 입력하세요.` });
    else setFeedback({ tone: "ok", msg: "✓ 채우기 완료! Σ 합계 구하기 버튼을 클릭하세요." });
    setStepIdx((i) => i + 1);
  }

  function doSum() {
    if (!step || step.type !== "sum") return;
    const rn = step.row;
    setSheet((s) => {
      const next = { ...s };
      if (rn === 4) {
        next.d4b = fmtNumber(p.YP[0]); next.d4c = fmtNumber(p.YP[1]);
        next.d4d = fmtNumber(p.YP[2]); next.d4e = fmtNumber(p.YP[3]);
        next.r4Computed = true;
        next.r4f = fmtNumber(p.EY);
        next.r4fState = "sum";
        next.fr4f = "Σ=" + fmtNumber(p.EY);
      } else {
        next.d5b = fmtNumber(p.Y2P[0]); next.d5c = fmtNumber(p.Y2P[1]);
        next.d5d = fmtNumber(p.Y2P[2]); next.d5e = fmtNumber(p.Y2P[3]);
        next.r5Computed = true;
        next.r5f = fmtNumber(p.EY2);
        next.r5fState = "sum";
        next.fr5f = "Σ=" + fmtNumber(p.EY2);
      }
      return next;
    });

    if (rn === 4) setFeedback({ tone: "ok", msg: `✓ E(Y) = ${fmtNumber(p.EY)}  기댓값(평균)을 구했습니다! 🎊` });
    else setFeedback({ tone: "ok", msg: `✓ E(Y²) = ${fmtNumber(p.EY2)}  이제 분산 수식을 입력하세요!` });
    setStepIdx((i) => i + 1);
  }

  function showHint() {
    if (!step || step.type !== "formula") return;
    const h: Record<string, string> = {
      B2: `💡 힌트: ${p.hintB2}`,
      B4: "💡 B4 = Y×P(Y) → =B2*B3",
      B5: "💡 B5 = Y²×P(Y) → =B2^2*B3  ( ^는 거듭제곱 )",
      F7: "💡 V(Y) = E(Y²)−{E(Y)}² = F5−F4² → =F5-F4^2",
      F8: "💡 σ(Y) = √V(Y) = SQRT(분산) → =SQRT(F7)",
    };
    setFeedback({ tone: "info", msg: h[step.cell] || "" });
  }

  // 현재 단계 안내 메시지(좌측 인스트럭션 박스).
  const instruction = useMemo(() => buildInstruction(step, p), [step, p]);
  const activeCellId = step?.type === "formula"
    ? ({ B2: "r2b", B4: "r4b", B5: "r5b", F7: "r7f", F8: "r8f" } as const)[step.cell]
    : null;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">📊 스프레드시트로 확률변수 분석</h3>
        <p className="mt-2 leading-7 text-slate-300">
          엑셀 수식을 단계별로 입력해 <b className="text-amber-300">Y=aX+b</b> 변환부터{" "}
          <b className="text-amber-300">기댓값·분산·표준편차</b>까지 직접 구해보세요.
        </p>
      </div>

      {/* 문제 선택 */}
      <div className="mt-5 flex flex-wrap gap-2">
        {PROBS.map((pr, i) => {
          const active = i === probIdx;
          return (
            <button
              key={pr.id}
              type="button"
              onClick={() => selectProb(i)}
              className={
                active
                  ? "rounded-xl border-2 border-sky-400 bg-sky-500/15 px-4 py-2 text-sm font-bold text-sky-200"
                  : "rounded-xl border-2 border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10"
              }
            >
              {pr.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-xl border border-sky-400/30 bg-sky-500/[0.06] px-4 py-3">
        <p className="font-mono text-base font-extrabold italic text-sky-300">{p.formula}</p>
        <p className="mt-0.5 text-xs text-slate-400">{p.info}</p>
      </div>

      {/* 탭 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("guide")}
          className={tab === "guide"
            ? "rounded-lg border-2 border-sky-400 bg-sky-500/15 px-4 py-1.5 text-sm font-bold text-sky-200"
            : "rounded-lg border-2 border-white/15 bg-white/5 px-4 py-1.5 text-sm font-bold text-slate-300 hover:bg-white/10"}
        >
          📋 단계 설명
        </button>
        <button
          type="button"
          onClick={() => setTab("practice")}
          className={tab === "practice"
            ? "rounded-lg border-2 border-sky-400 bg-sky-500/15 px-4 py-1.5 text-sm font-bold text-sky-200"
            : "rounded-lg border-2 border-white/15 bg-white/5 px-4 py-1.5 text-sm font-bold text-slate-300 hover:bg-white/10"}
        >
          🧮 직접 해보기
        </button>
      </div>

      {/* ─── 가이드 탭 ─── */}
      <div className={tab === "guide" ? "mt-4" : "mt-4 hidden"}>
        <GuideTab p={p} />
      </div>

      {/* ─── 실습 탭 ─── */}
      <div className={tab === "practice" ? "mt-4" : "mt-4 hidden"}>
        {/* 진행도 점 */}
        <StepProgress current={stepIdx} total={TOTAL_STEPS} />

        {/* 레전드 */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
          <LegendDot color="bg-sky-500/40 border border-sky-400/50" label="주어진 데이터" />
          <LegendDot color="bg-emerald-700/30 border border-dashed border-emerald-400/60" label="수식 입력 셀" />
          <LegendDot color="bg-emerald-900/40 border border-emerald-600/50" label="계산된 값" />
          <LegendDot color="bg-purple-900/40 border border-purple-500/50" label="합계 (Σ)" />
          <LegendDot color="bg-amber-900/40 border border-amber-600/50" label="결과 (V, σ)" />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {/* 입력 시트 */}
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="mb-2 rounded-md border border-white/10 bg-slate-900/60 px-2 py-1 text-center text-xs font-bold text-slate-300">
              🧮 직접 입력하기
            </p>
            <InputSheet p={p} sheet={sheet} activeCellId={activeCellId} />
          </div>
          {/* 수식 기록 시트 */}
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="mb-2 rounded-md border border-white/10 bg-slate-900/60 px-2 py-1 text-center text-xs font-bold text-slate-400">
              📝 수식 기록 (내가 입력한 수식)
            </p>
            <FormulaSheet sheet={sheet} />
          </div>
        </div>

        {/* 안내 박스 */}
        {!completed ? (
          <div className="mt-3 rounded-xl border-2 border-sky-700/60 bg-sky-950/40 px-4 py-3 text-sm leading-7 text-slate-200">
            {instruction}
          </div>
        ) : null}

        {/* 수식 입력 바 */}
        {step?.type === "formula" && !completed ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-sky-700/60 bg-sky-950/60 px-3 py-2 font-mono text-sm font-bold text-sky-300">
              {step.cell}
            </span>
            <input
              key={shakeKey}
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setInputState(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") checkFormula(); }}
              placeholder="수식을 입력하세요 (예: =3*B1+2)"
              className={`min-w-[180px] flex-1 rounded-lg border-2 bg-slate-950 px-3 py-2 font-mono text-sm text-emerald-200 outline-none transition placeholder:text-slate-600 ${
                inputState === "err" ? "border-rose-500 animate-[shake_0.4s_ease]" : inputState === "ok" ? "border-emerald-400" : "border-emerald-700"
              } focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-300/40`}
              spellCheck={false}
              autoCorrect="off"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={checkFormula}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500"
            >
              ✓ 확인
            </button>
            <button
              type="button"
              onClick={showHint}
              className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-600"
            >
              💡 힌트
            </button>
          </div>
        ) : null}

        {/* 액션 버튼 */}
        {!completed ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={doFill}
              disabled={step?.type !== "fill"}
              className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ▶ {step?.type === "fill" ? `채우기 핸들로 E${step.row}까지 드래그` : "채우기 핸들로 드래그"}
            </button>
            <button
              type="button"
              onClick={doSum}
              disabled={step?.type !== "sum"}
              className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Σ 합계 구하기
            </button>
            <button
              type="button"
              onClick={resetPractice}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 처음부터
            </button>
          </div>
        ) : null}

        {/* 피드백 */}
        <div className={
          "mt-3 rounded-lg border px-3 py-2 text-sm font-bold " +
          (feedback.tone === "ok"
            ? "border-emerald-700 bg-emerald-950/40 text-emerald-300"
            : feedback.tone === "ng"
            ? "border-rose-700 bg-rose-950/40 text-rose-300"
            : "border-sky-700 bg-sky-950/40 text-sky-300")
        }>
          {feedback.msg}
        </div>

        {/* 완성 패널 */}
        {completed ? (
          <div className="mt-4 rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-400/[0.12] to-emerald-400/[0.08] px-6 py-5 text-center">
            <p className="text-4xl">🎉</p>
            <h4 className="mt-1 text-2xl font-black text-amber-300">완성!</h4>
            <p className="mt-1 text-sm text-slate-400">스프레드시트로 확률변수의 통계량을 모두 구했습니다.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <ResultBox lbl="기댓값 E(Y)" val={fmtNumber(p.EY)} />
              <ResultBox lbl="분산 V(Y)" val={fmtNumber(p.VY)} />
              <ResultBox lbl="표준편차 σ(Y)" val={fmtNumber(p.sY)} />
            </div>
            <p className="mt-3 text-xs text-slate-400">다른 문제도 도전해 보세요! 🚀</p>
            <button
              type="button"
              onClick={resetPractice}
              className="mt-3 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10"
            >
              ↺ 같은 문제 다시
            </button>
          </div>
        ) : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 보조 컴포넌트 ────────────────────────────────────────
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-sm ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function ResultBox({ lbl, val }: { lbl: string; val: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-3 text-center">
      <p className="text-[11px] text-slate-400">{lbl}</p>
      <p className="mt-0.5 text-xl font-black text-amber-300">{val}</p>
    </div>
  );
}

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const cur = i === current;
        const cls = done
          ? "border-emerald-500 bg-emerald-900/60 text-emerald-200"
          : cur
          ? "border-sky-400 bg-sky-900/60 text-sky-200 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          : "border-white/15 bg-slate-900 text-slate-600";
        return (
          <div key={i} className="flex items-center gap-1">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold ${cls}`}>
              {done ? "✓" : i + 1}
            </span>
            {i < total - 1 ? (
              <span className={`h-0.5 w-3 sm:w-4 rounded-sm ${i < current ? "bg-emerald-500" : "bg-white/10"}`} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ─── 입력 시트 (학생이 채우는 쪽) ──────────────────────────
function InputSheet({
  p, sheet, activeCellId,
}: { p: Problem; sheet: SheetState; activeCellId: string | null }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <ThNum />
            <ThCol>A</ThCol><ThCol>B</ThCol><ThCol>C</ThCol><ThCol>D</ThCol><ThCol>E</ThCol><ThCol>F</ThCol>
          </tr>
        </thead>
        <tbody>
          {/* row 1: X */}
          <tr>
            <Rn>1</Rn>
            <Lbl>X</Lbl>
            {p.X.map((v, i) => <Given key={i}>{v}</Given>)}
            <Empty />
          </tr>
          {/* row 2: Y */}
          <tr>
            <Rn>2</Rn>
            <Lbl>Y</Lbl>
            <FormulaCell id="r2b" active={activeCellId === "r2b"} filled={sheet.r2bFilled}>{sheet.d2b}</FormulaCell>
            <FormulaCell id="r2c" filled={sheet.r2cFilled}>{sheet.d2c}</FormulaCell>
            <FormulaCell id="r2d" filled={sheet.r2dFilled}>{sheet.d2d}</FormulaCell>
            <FormulaCell id="r2e" filled={sheet.r2eFilled}>{sheet.d2e}</FormulaCell>
            <Empty />
          </tr>
          {/* row 3: P(Y) */}
          <tr>
            <Rn>3</Rn>
            <Lbl>P(Y)</Lbl>
            {p.P.map((v, i) => <Given key={i}>{v}</Given>)}
            <SumLbl>합계</SumLbl>
          </tr>
          {/* row 4: Y·P(Y) */}
          <tr>
            <Rn>4</Rn>
            <Lbl tight>Y·P(Y)</Lbl>
            {sheet.r4Computed ? (
              <>
                <Computed>{sheet.d4b}</Computed>
                <Computed>{sheet.d4c}</Computed>
                <Computed>{sheet.d4d}</Computed>
                <Computed>{sheet.d4e}</Computed>
              </>
            ) : (
              <>
                <FormulaCell id="r4b" active={activeCellId === "r4b"} filled={sheet.r4bFilled}>{sheet.d4b}</FormulaCell>
                <FormulaCell id="r4c" filled={sheet.r4cFilled}>{sheet.d4c}</FormulaCell>
                <FormulaCell id="r4d" filled={sheet.r4dFilled}>{sheet.d4d}</FormulaCell>
                <FormulaCell id="r4e" filled={sheet.r4eFilled}>{sheet.d4e}</FormulaCell>
              </>
            )}
            <ResultCell state={sheet.r4fState}>{sheet.r4f}</ResultCell>
          </tr>
          {/* row 5: Y²·P(Y) */}
          <tr>
            <Rn>5</Rn>
            <Lbl tight>Y²·P(Y)</Lbl>
            {sheet.r5Computed ? (
              <>
                <Computed>{sheet.d5b}</Computed>
                <Computed>{sheet.d5c}</Computed>
                <Computed>{sheet.d5d}</Computed>
                <Computed>{sheet.d5e}</Computed>
              </>
            ) : (
              <>
                <FormulaCell id="r5b" active={activeCellId === "r5b"} filled={sheet.r5bFilled}>{sheet.d5b}</FormulaCell>
                <FormulaCell id="r5c" filled={sheet.r5cFilled}>{sheet.d5c}</FormulaCell>
                <FormulaCell id="r5d" filled={sheet.r5dFilled}>{sheet.d5d}</FormulaCell>
                <FormulaCell id="r5e" filled={sheet.r5eFilled}>{sheet.d5e}</FormulaCell>
              </>
            )}
            <ResultCell state={sheet.r5fState}>{sheet.r5f}</ResultCell>
          </tr>
          {/* row 6: 빈 */}
          <tr>
            <Rn>6</Rn><Empty /><Empty /><Empty /><Empty /><Empty /><Empty />
          </tr>
          {/* row 7: V(Y) */}
          <tr>
            <Rn>7</Rn><Empty /><Empty /><Empty /><Empty /><Lbl>V(Y)</Lbl>
            <ResultCell state={sheet.r7f ? "result" : "empty"} active={activeCellId === "r7f"}>{sheet.r7f}</ResultCell>
          </tr>
          {/* row 8: σ(Y) */}
          <tr>
            <Rn>8</Rn><Empty /><Empty /><Empty /><Empty /><Lbl>σ(Y)</Lbl>
            <ResultCell state={sheet.r8f ? "result" : "empty"} active={activeCellId === "r8f"}>{sheet.r8f}</ResultCell>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ThNum() {
  return <th aria-label="행 번호" className="border border-slate-800 bg-slate-950 px-2 py-1 text-xs" />;
}
function ThCol({ children }: { children: React.ReactNode }) {
  return <th className="border border-slate-800 bg-sky-950/60 px-2 py-1 text-xs font-bold text-sky-300">{children}</th>;
}
function Rn({ children }: { children: React.ReactNode }) {
  return <td className="border border-slate-800 bg-sky-950/60 px-2 py-1 text-center text-[10px] font-bold text-sky-300">{children}</td>;
}
function Lbl({ children, tight = false }: { children: React.ReactNode; tight?: boolean }) {
  return (
    <td className={`border border-slate-800 bg-slate-950 px-2 py-1 text-center font-bold text-amber-300 ${tight ? "text-[10px]" : "text-xs"}`}>
      {children}
    </td>
  );
}
function Given({ children }: { children: React.ReactNode }) {
  return <td className="border border-slate-800 bg-sky-950/40 px-2 py-1 text-center font-mono text-sm font-bold text-sky-200">{children}</td>;
}
function SumLbl({ children }: { children: React.ReactNode }) {
  return <td className="border border-slate-800 bg-purple-950/40 px-2 py-1 text-center text-[10px] font-bold text-violet-300">{children}</td>;
}
function Empty() {
  return <td className="border border-slate-800 bg-slate-950 px-2 py-1" />;
}
function FormulaCell({
  id, active = false, filled = false, children,
}: { id?: string; active?: boolean; filled?: boolean; children: React.ReactNode }) {
  const base = "border px-1.5 py-1 text-center font-mono text-[10px] text-emerald-300";
  const tone = active
    ? "border-emerald-400 bg-emerald-950/50 animate-[pulseG_1.6s_ease-in-out_infinite]"
    : filled
    ? "border-emerald-700 bg-emerald-950/60"
    : "border-dashed border-emerald-700/60 bg-emerald-950/30";
  return <td id={id} className={`${base} ${tone}`}>{children}</td>;
}
function Computed({ children }: { children: React.ReactNode }) {
  return <td className="border border-emerald-700/60 bg-emerald-950/50 px-2 py-1 text-center font-mono text-sm font-bold text-emerald-300">{children}</td>;
}
function ResultCell({
  children, state, active = false,
}: { children: React.ReactNode; state: CellState; active?: boolean }) {
  if (state === "empty") {
    const cls = active
      ? "border-2 border-amber-400 bg-amber-950/40 animate-[pulseY_1.6s_ease-in-out_infinite]"
      : "border border-dashed border-slate-600";
    return <td className={`${cls} bg-slate-950 px-2 py-1 text-center font-mono`}>{children}</td>;
  }
  if (state === "sum") {
    return <td className="border border-violet-700 bg-purple-950/40 px-2 py-1 text-center font-mono text-sm font-bold text-violet-300">{children}</td>;
  }
  // result
  return <td className="border border-amber-700 bg-amber-950/40 px-2 py-1 text-center font-mono text-sm font-bold text-amber-300">{children}</td>;
}

// ─── 수식 기록 시트 ───────────────────────────────────────
function frClass(text: string) {
  if (text === "—") return "bg-slate-950 text-slate-700";
  if (text.startsWith("Σ=")) return "bg-violet-950/40 text-violet-300 font-bold";
  if (text.startsWith("=")) return "bg-emerald-950/40 text-emerald-300";
  return "bg-sky-950/40 text-sky-300 font-semibold";
}
function FrCell({ text }: { text: string }) {
  return (
    <td className={`border border-slate-800 px-1.5 py-1 text-center font-mono text-[9px] ${frClass(text)}`}>
      {text}
    </td>
  );
}
function FormulaSheet({ sheet }: { sheet: SheetState }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <ThNum />
            <ThCol>A</ThCol><ThCol>B</ThCol><ThCol>C</ThCol><ThCol>D</ThCol><ThCol>E</ThCol><ThCol>F</ThCol>
          </tr>
        </thead>
        <tbody>
          <tr><Rn>1</Rn><Lbl tight>X</Lbl><FrCell text="given" /><FrCell text="given" /><FrCell text="given" /><FrCell text="given" /><FrCell text="—" /></tr>
          <tr><Rn>2</Rn><Lbl tight>Y</Lbl><FrCell text={sheet.fr2b} /><FrCell text={sheet.fr2c} /><FrCell text={sheet.fr2d} /><FrCell text={sheet.fr2e} /><FrCell text="—" /></tr>
          <tr><Rn>3</Rn><Lbl tight>P(Y)</Lbl><FrCell text="given" /><FrCell text="given" /><FrCell text="given" /><FrCell text="given" /><SumLbl>합계</SumLbl></tr>
          <tr><Rn>4</Rn><Lbl tight>Y·P</Lbl><FrCell text={sheet.fr4b} /><FrCell text={sheet.fr4c} /><FrCell text={sheet.fr4d} /><FrCell text={sheet.fr4e} /><FrCell text={sheet.fr4f} /></tr>
          <tr><Rn>5</Rn><Lbl tight>Y²·P</Lbl><FrCell text={sheet.fr5b} /><FrCell text={sheet.fr5c} /><FrCell text={sheet.fr5d} /><FrCell text={sheet.fr5e} /><FrCell text={sheet.fr5f} /></tr>
          <tr><Rn>6</Rn><Empty /><Empty /><Empty /><Empty /><Empty /><Empty /></tr>
          <tr><Rn>7</Rn><Empty /><Empty /><Empty /><Empty /><Lbl tight>V(Y)</Lbl><FrCell text={sheet.fr7f} /></tr>
          <tr><Rn>8</Rn><Empty /><Empty /><Empty /><Empty /><Lbl tight>σ(Y)</Lbl><FrCell text={sheet.fr8f} /></tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── 가이드 탭 ────────────────────────────────────────────
function GuideTab({ p }: { p: Problem }) {
  const cols: ("B" | "C" | "D" | "E")[] = ["B", "C", "D", "E"];
  const fillFormulas = cols.map((col) => p.B2formula.replace(/B/g, col));
  const eySquared = Math.round(p.EY * p.EY * 10000) / 10000;

  return (
    <div className="space-y-3">
      <GuideCard num="(1)" title="1행(X)과 3행(P(Y))에 주어진 값 입력">
        <p>
          1행에 확률변수 X 값을, 3행에 P(Y) 값을 입력합니다.
          <span className="ml-2 inline-block rounded-md bg-amber-950/60 px-2 py-0.5 text-xs font-bold text-amber-300">
            {p.formula}, X ∈ {"{"}{p.X.join(",")}{"}"}, P(Y) = {"{"}{p.P.join(", ")}{"}"}
          </span>
        </p>
        <MiniTable
          headers={["", "A", "B", "C", "D", "E"]}
          rows={[
            ["1", "X", ...p.X.map(String)],
            ["3", "P(Y)", ...p.P.map(String)],
          ]}
        />
      </GuideCard>

      <GuideCard num="(2)" title={<>셀 B2에 <FBadge>{p.B2formula}</FBadge> 입력 → 채우기 핸들로 E2까지</>}>
        <p>
          {p.formula} 이므로 셀 B2에 <FBadge>{p.B2formula}</FBadge>를 입력하고 E2까지 채우기 핸들을 드래그합니다.
        </p>
        <MiniTable
          headers={["", "A", "B", "C", "D", "E"]}
          rows={[
            ["2", "Y", ...fillFormulas],
            ["", "", ...p.Y.map(String)],
          ]}
          formulaCells={{ 0: [2, 3, 4, 5] }}
          computedCells={{ 1: [2, 3, 4, 5] }}
        />
        <p className="mt-1 text-xs text-sky-300">✦ B2 수식을 드래그하면 B1→C1→D1→E1로 자동 변경됩니다.</p>
      </GuideCard>

      <GuideCard num="(3)" title={<>셀 B4에 <FBadge>=B2*B3</FBadge> → 채우기 핸들 → Σ → E(Y)</>}>
        <p>B4에 <FBadge>=B2*B3</FBadge> 입력 후 E4까지 채우기 핸들, Σ 클릭 → F4에 E(Y) = {fmtNumber(p.EY)}</p>
        <MiniTable
          headers={["", "A", "B", "C", "D", "E", "F"]}
          rows={[
            ["4", "Y·P(Y)", "=B2*B3", "=C2*C3", "=D2*D3", "=E2*E3", fmtNumber(p.EY)],
          ]}
          formulaCells={{ 0: [2, 3, 4, 5] }}
          sumCells={{ 0: [6] }}
        />
      </GuideCard>

      <GuideCard num="(4)" title={<>셀 B5에 <FBadge>=B2^2*B3</FBadge> → 채우기 핸들 → Σ → E(Y²)</>}>
        <p>B5에 <FBadge>=B2^2*B3</FBadge> 입력 후 같은 방법으로 F5에 E(Y²) = {fmtNumber(p.EY2)}</p>
        <MiniTable
          headers={["", "A", "B", "C", "D", "E", "F"]}
          rows={[
            ["5", "Y²·P(Y)", "=B2^2*B3", "=C2^2*C3", "=D2^2*D3", "=E2^2*E3", fmtNumber(p.EY2)],
          ]}
          formulaCells={{ 0: [2, 3, 4, 5] }}
          sumCells={{ 0: [6] }}
        />
      </GuideCard>

      <GuideCard num="(5)" title={<>F7에 <FBadge>=F5-F4^2</FBadge>, F8에 <FBadge>=SQRT(F7)</FBadge></>}>
        <p>분산 V(Y) = E(Y²) − {"{"}E(Y){"}"}² 와 표준편차 σ(Y) = √V(Y) 를 셀 수식으로 입력합니다.</p>
        <MiniTable
          headers={["", "E", "F"]}
          rows={[
            ["7", "V(Y)", "=F5-F4^2"],
            ["8", "σ(Y)", "=SQRT(F7)"],
          ]}
          formulaCells={{ 0: [2], 1: [2] }}
        />
        <div className="mt-2 rounded-lg border border-emerald-700 bg-emerald-950/30 px-3 py-2 text-sm leading-7 text-emerald-300">
          📐 V(Y) = E(Y²) − {"{"}E(Y){"}"}² = F5 − (F4)² = {fmtNumber(p.EY2)} − {fmtNumber(eySquared)} ={" "}
          <strong className="text-amber-300">{fmtNumber(p.VY)}</strong><br />
          📐 σ(Y) = √V(Y) = SQRT(F7) = √{fmtNumber(p.VY)} ={" "}
          <strong className="text-amber-300">{fmtNumber(p.sY)}</strong>
        </div>
      </GuideCard>
    </div>
  );
}

function GuideCard({ num, title, children }: { num: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-sky-700/40 bg-slate-900/40 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-sky-400 bg-sky-950/60 text-sm font-bold text-sky-300">
          {num}
        </span>
        <p className="text-sm font-bold text-slate-200">{title}</p>
      </div>
      <div className="space-y-2 pl-9 text-sm leading-7 text-slate-400">{children}</div>
    </div>
  );
}

function FBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-emerald-700 bg-emerald-950/40 px-1.5 py-0.5 font-mono text-xs font-bold text-emerald-300">
      {children}
    </span>
  );
}

function MiniTable({
  headers, rows, formulaCells = {}, computedCells = {}, sumCells = {},
}: {
  headers: string[];
  rows: string[][];
  formulaCells?: Record<number, number[]>;
  computedCells?: Record<number, number[]>;
  sumCells?: Record<number, number[]>;
}) {
  function cellCls(rowIdx: number, colIdx: number, isLabel: boolean, isRowNum: boolean) {
    if (isRowNum) return "border border-slate-800 bg-sky-950/60 px-1.5 py-1 text-center text-[10px] font-bold text-sky-300";
    if (isLabel) return "border border-slate-800 bg-slate-950 px-1.5 py-1 text-center text-[10px] font-bold text-amber-300";
    if (formulaCells[rowIdx]?.includes(colIdx)) return "border border-dashed border-emerald-700 bg-emerald-950/30 px-1.5 py-1 text-center font-mono text-[10px] text-emerald-300";
    if (computedCells[rowIdx]?.includes(colIdx)) return "border border-emerald-700 bg-emerald-950/40 px-1.5 py-1 text-center font-mono text-[10px] font-bold text-emerald-300";
    if (sumCells[rowIdx]?.includes(colIdx)) return "border border-violet-700 bg-purple-950/40 px-1.5 py-1 text-center font-mono text-[10px] font-bold text-violet-300";
    return "border border-slate-800 bg-sky-950/40 px-1.5 py-1 text-center font-mono text-[10px] text-sky-200";
  }
  return (
    <table className="mt-2 w-full border-collapse">
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th
              key={i}
              aria-label={h || "행 번호"}
              className="border border-slate-800 bg-sky-950/60 px-1.5 py-1 text-center text-[10px] font-bold text-sky-300"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rIdx) => (
          <tr key={rIdx}>
            {row.map((cell, cIdx) => (
              <td key={cIdx} className={cellCls(rIdx, cIdx, cIdx === 1, cIdx === 0)}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── 안내 메시지 빌더 ─────────────────────────────────────
function buildInstruction(step: Step | null, p: Problem): React.ReactNode {
  if (!step) return null;
  if (step.type === "formula") {
    const map: Record<string, React.ReactNode> = {
      B2: (
        <>
          <Badge n="(2)" /> 셀 <Tcell>B2</Tcell> 에 Y와 X의 관계를 수식으로 입력하세요.
          <p className="mt-1 text-xs text-sky-300">
            ✦ {p.formula} 이므로 B1(X값)을 사용한 수식을 입력합니다.
            <span className="ml-1 text-amber-300">(예: Y = aX+b → =a*B1+b)</span>
          </p>
        </>
      ),
      B4: (
        <>
          <Badge n="(3)" /> 셀 <Tcell>B4</Tcell> 에 수식 <Tform>=B2*B3</Tform> 를 입력하세요.
          <p className="mt-1 text-xs text-sky-300">✦ Y×확률 P(Y) → Y·P(Y) 의 첫 번째 값</p>
        </>
      ),
      B5: (
        <>
          <Badge n="(4)" /> 셀 <Tcell>B5</Tcell> 에 수식 <Tform>=B2^2*B3</Tform> 를 입력하세요.
          <p className="mt-1 text-xs text-sky-300">✦ Y²×확률 P(Y) <span className="ml-1 text-amber-300">( ^2 는 제곱 )</span></p>
        </>
      ),
      F7: (
        <>
          <Badge n="(5)" /> 셀 <Tcell>F7</Tcell> 에 수식 <Tform>=F5-F4^2</Tform> 를 입력하세요.
          <p className="mt-1 text-xs text-sky-300">✦ 분산 V(Y) = E(Y²)−{"{"}E(Y){"}"}² = <span className="text-violet-300">F5</span>−(<span className="text-violet-300">F4</span>)²</p>
        </>
      ),
      F8: (
        <>
          <Badge n="(5)" /> 셀 <Tcell>F8</Tcell> 에 수식 <Tform>=SQRT(F7)</Tform> 를 입력하세요.
          <p className="mt-1 text-xs text-sky-300">✦ 표준편차 σ(Y) = √V(Y) = SQRT(F7)</p>
        </>
      ),
    };
    return map[step.cell] ?? null;
  }
  if (step.type === "fill") {
    const sb = step.row === 2 ? "(2)" : step.row === 4 ? "(3)" : "(4)";
    return (
      <>
        <Badge n={sb} /> ‘채우기 핸들’로 <Tcell>{`B${step.row}`}</Tcell> 수식을 <Tcell>{`E${step.row}`}</Tcell> 까지 드래그하세요.
        <p className="mt-1 text-xs text-sky-300">✦ 드래그하면 B→C→D→E로 자동 변경됩니다.</p>
      </>
    );
  }
  // sum
  const sb = step.row === 4 ? "(3)" : "(4)";
  const rl = step.row === 4 ? "Y·P(Y)" : "Y²·P(Y)";
  const cl = step.row === 4 ? "F4" : "F5";
  return (
    <>
      <Badge n={sb} /> <strong>Σ</strong> 버튼으로 {rl} 의 합계를 구하세요.
      <p className="mt-1 text-xs text-sky-300">
        ✦ B{step.row}:E{step.row} 의 합이 <Tcell>{cl}</Tcell> 에 기록됩니다.
      </p>
    </>
  );
}
function Badge({ n }: { n: string }) {
  return (
    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-700 text-xs font-bold text-white">
      {n.replace(/[()]/g, "")}
    </span>
  );
}
function Tcell({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-slate-800 px-1.5 py-0.5 font-mono text-sky-300">{children}</span>;
}
function Tform({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md border border-emerald-700 bg-emerald-950/40 px-1.5 py-0.5 font-mono text-emerald-300">{children}</span>;
}

// ─── 숫자 포매팅 ─────────────────────────────────────────
function fmtNumber(x: number): string {
  const v = Math.round(x * 10000) / 10000;
  if (Number.isInteger(v)) return v.toLocaleString("ko-KR");
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
}
