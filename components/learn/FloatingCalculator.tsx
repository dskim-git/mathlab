"use client";

import { useEffect, useRef, useState } from "react";
import { evaluate, fmt, looksLikeDegPiMistake, smartBackspace, withComma } from "./calcEngine";

/**
 * 교과 학습 화면 전용 떠 있는 공학용 계산기 + 메모.
 *  · 평소에는 동그란 버튼만 떠 있고, 누르면 계산기가 펼쳐진다.
 *  · 계산기의 ‘최소화(−)’를 누르면 다시 동그란 버튼으로 돌아간다.
 *  · 헤더의 ‘📝’ 로 옆에 메모장을 펼칠 수 있다(계산 결과를 적어 두고 나중에 합산).
 *  · 동그란 버튼도, 계산기도 드래그해서 화면 안 아무 곳에나 둘 수 있다.
 * 수업 내용(스크롤·탭)과 무관하게 화면에 고정되어 동작하며, 메모는 저장되지 않는다.
 */

type Pos = { x: number; y: number };

const FAB = 56;
const PANEL_W = 300;
const MEMO_W = 240;
const PANEL_H_SCI = 486;
const PANEL_H_BASIC = 392;
const EDGE = 8;

type Mode = "sci" | "basic";

function clampPos(p: Pos, w: number, h: number): Pos {
  const maxX = Math.max(EDGE, window.innerWidth - w - EDGE);
  const maxY = Math.max(EDGE, window.innerHeight - h - EDGE);
  return { x: Math.min(Math.max(p.x, EDGE), maxX), y: Math.min(Math.max(p.y, EDGE), maxY) };
}

/** 메모 안에 적힌 숫자를 모두 찾아 더한다(쉼표·소수점·음수 인식). */
function sumNumbers(text: string): { sum: number; count: number } {
  const found = text.match(/-?\d[\d,]*(?:\.\d+)?/g) ?? [];
  let sum = 0;
  for (const t of found) {
    const v = Number(t.replace(/,/g, ""));
    if (Number.isFinite(v)) sum += v;
  }
  return { sum, count: found.length };
}

export default function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  // null 이면 기본 위치(오른쪽 아래, CSS 로 배치). 드래그하면 좌표를 갖는다.
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const [memo, setMemo] = useState("");

  // 계산기 상태 — 최소화해도 유지되도록 여기서 관리
  const [expr, setExpr] = useState("");
  const [ans, setAns] = useState(0);
  const [justEq, setJustEq] = useState(false);
  const [deg, setDeg] = useState(true);
  const [second, setSecond] = useState(false);
  const [err, setErr] = useState("");
  const [mode, setMode] = useState<Mode>("sci");

  const shellRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  // 지금 식의 값(미리보기). 식이 아직 완성되지 않았으면 null.
  let preview: number | null = null;
  if (expr.trim()) {
    try { preview = evaluate(expr, { deg, ans }); } catch { preview = null; }
  }
  const shownResult = err ? err : preview !== null ? fmt(preview) : justEq ? fmt(ans) : "";

  function estSize(isOpen: boolean, withMemo: boolean, m: Mode) {
    if (!isOpen) return { w: FAB, h: FAB };
    return { w: PANEL_W + (withMemo ? MEMO_W + 8 : 0), h: m === "sci" ? PANEL_H_SCI : PANEL_H_BASIC };
  }

  useEffect(() => {
    function onResize() {
      const { w, h } = estSize(open, showMemo, mode);
      setPos((p) => (p ? clampPos(p, w, h) : p));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, showMemo, mode]);

  // ─── 드래그 ───────────────────────────────────────────
  function startDrag(e: React.PointerEvent) {
    const el = shellRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, moved: false };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setPos({ x: rect.left, y: rect.top });
    setDragging(true);
  }
  function onDrag(e: React.PointerEvent) {
    const d = dragRef.current;
    const el = shellRef.current;
    if (!d || !el) return;
    const rect = el.getBoundingClientRect();
    const nx = e.clientX - d.dx;
    const ny = e.clientY - d.dy;
    if (!d.moved && (Math.abs(nx - rect.left) > 3 || Math.abs(ny - rect.top) > 3)) d.moved = true;
    setPos(clampPos({ x: nx, y: ny }, el.offsetWidth, el.offsetHeight));
  }
  function endDrag(e: React.PointerEvent) {
    const d = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    return d?.moved ?? false;
  }

  function reflow(nextOpen: boolean, nextMemo: boolean, nextMode: Mode = mode) {
    const { w, h } = estSize(nextOpen, nextMemo, nextMode);
    setPos((p) => (p ? clampPos(p, w, h) : p));
  }
  function toggleOpen(next: boolean) { setOpen(next); reflow(next, showMemo); }
  function toggleMemo() { const next = !showMemo; setShowMemo(next); reflow(open, next); }
  function toggleMode() {
    const next: Mode = mode === "sci" ? "basic" : "sci";
    setMode(next);
    setSecond(false);
    reflow(open, showMemo, next);
  }

  // ─── 입력 ─────────────────────────────────────────────
  /** kind: "value" = 숫자·상수·함수(= 뒤엔 새 식) / "op" = 연산자(= 뒤엔 결과에 이어서) */
  function push(text: string, kind: "value" | "op" = "value") {
    setErr("");
    setExpr((cur) => {
      const base = justEq ? (kind === "op" ? fmt(ans) : "") : cur;
      return base + text;
    });
    setJustEq(false);
  }
  function clearAll() { setExpr(""); setErr(""); setJustEq(false); }
  function backspace() {
    setErr("");
    if (justEq) { setJustEq(false); setExpr(""); return; }
    setExpr((cur) => smartBackspace(cur));
  }
  function equals() {
    if (!expr.trim()) return;
    try {
      const v = evaluate(expr, { deg, ans });
      if (Number.isNaN(v)) { setErr("정의되지 않음"); return; }
      setAns(v);
      setJustEq(true);
      setErr("");
    } catch (e) {
      setErr((e as Error).message || "식이 이상해요");
    }
  }

  function addToMemo() {
    const text = err ? "" : preview !== null ? fmt(preview) : justEq ? fmt(ans) : "";
    if (!text) return;
    setShowMemo(true);
    reflow(open, true);
    setMemo((m) => (m ? m.replace(/\s*$/, "") + "\n" : "") + withComma(text));
  }

  const { sum, count } = sumNumbers(memo);
  const style: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
    : { right: 20, bottom: 20 };

  return (
    <div ref={shellRef} style={style} className={"fixed z-[70] " + (dragging ? "select-none" : "")}>
      {open ? (
        // 화면(특히 폰)이 짧으면 안에서 스크롤 — 화면 밖으로 잘려 나가지 않게
        <div className="flex max-h-[calc(100dvh-16px)] flex-col items-end gap-2 overflow-y-auto overscroll-contain sm:flex-row sm:items-stretch">
          {/* 메모장 */}
          {showMemo ? (
            <div className="flex h-[220px] w-[300px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl shadow-black/60 sm:h-[486px] sm:w-[240px]">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-slate-800/70 px-3 py-2">
                <span className="text-xs font-bold text-slate-200">📝 메모</span>
                <button type="button" onClick={() => setMemo("")}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-300 transition hover:bg-white/15">
                  지우기
                </button>
              </div>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder={"계산 결과를 적어 두세요.\n\n예)\n이자 305,400\n원금 4,800,000"}
                aria-label="계산 메모"
                className="flex-1 resize-none bg-slate-950 px-3 py-2 font-mono text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600"
              />
              <div className="border-t border-white/10 bg-slate-900 px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] text-slate-400">숫자 {count}개 합계</span>
                  <span className="font-mono text-sm font-bold text-emerald-200">{withComma(fmt(sum))}</span>
                </div>
                <button type="button" disabled={count === 0}
                  onClick={() => { setExpr(fmt(sum)); setJustEq(false); setErr(""); }}
                  className="mt-1.5 w-full rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[11px] font-bold text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-40">
                  합계를 계산기로 →
                </button>
              </div>
            </div>
          ) : null}

          {/* 계산기 */}
          <div className="w-[300px] overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl shadow-black/60">
            {/* 헤더 = 드래그 손잡이 */}
            <div
              onPointerDown={startDrag}
              onPointerMove={onDrag}
              onPointerUp={endDrag}
              className="flex cursor-grab touch-none items-center justify-between gap-2 border-b border-white/10 bg-slate-800/70 px-3 py-2 active:cursor-grabbing"
            >
              <span className="text-xs font-bold text-slate-200">🧮 계산기</span>
              <span className="flex items-center gap-1">
                <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={toggleMode}
                  aria-label={mode === "sci" ? "일반 계산기로 바꾸기" : "공학용 계산기로 바꾸기"}
                  title={mode === "sci" ? "일반 계산기로 바꾸기" : "공학용 계산기로 바꾸기"}
                  className={"flex h-6 items-center rounded-md border px-2 text-[10px] font-bold transition " +
                    (mode === "sci"
                      ? "border-violet-400/50 bg-violet-400/20 text-violet-100 hover:bg-violet-400/30"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/15")}>
                  {mode === "sci" ? "공학용" : "일반"}
                </button>
                <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={toggleMemo}
                  aria-label={showMemo ? "메모 닫기" : "메모 열기"} title={showMemo ? "메모 닫기" : "메모 열기"}
                  className={"flex h-6 w-6 items-center justify-center rounded-md border text-xs transition " +
                    (showMemo ? "border-emerald-400/50 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/15")}>
                  📝
                </button>
                <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => toggleOpen(false)}
                  aria-label="계산기 최소화"
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-bold text-slate-300 transition hover:bg-white/15">
                  −
                </button>
              </span>
            </div>

            <div className="p-2.5">
              {/* 화면 */}
              <div className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-right">
                <p className="h-5 overflow-x-auto whitespace-nowrap font-mono text-sm text-slate-300">
                  {expr || <span className="text-slate-600">0</span>}
                </p>
                <p className={"h-8 overflow-x-auto whitespace-nowrap font-mono text-2xl font-bold " + (err ? "text-rose-300" : "text-emerald-200")}
                  aria-live="polite">
                  {shownResult ? (err ? shownResult : withComma(shownResult)) : ""}
                </p>
              </div>

              {/* DEG 인데 π 를 쓴 흔한 실수 안내 */}
              {mode === "sci" && looksLikeDegPiMistake(expr, deg) ? (
                <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 py-1.5">
                  <p className="flex-1 text-[10px] leading-4 text-amber-100">
                    π는 <b>라디안</b> 값인데 지금은 <b>DEG(도)</b> 모드예요. RAD로 바꾸면 sin(π)=0
                  </p>
                  <button type="button" onClick={() => setDeg(false)}
                    className="shrink-0 rounded-md border border-amber-300/50 bg-amber-300/20 px-2 py-0.5 text-[10px] font-bold text-amber-100 transition hover:bg-amber-300/30">
                    RAD로
                  </button>
                </div>
              ) : null}

              <div className="mt-1.5 flex items-center gap-1.5">
                {mode === "sci" ? (
                  <button type="button" onClick={() => setDeg((d) => !d)}
                    aria-label="각도 단위 바꾸기"
                    className="flex-1 rounded-lg border border-sky-400/40 bg-sky-400/10 px-2 py-1.5 text-[11px] font-bold text-sky-100 transition hover:bg-sky-400/20">
                    {deg ? "DEG (도)" : "RAD (라디안)"}
                  </button>
                ) : null}
                <button type="button" onClick={addToMemo}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/15">
                  📌 메모에 적기
                </button>
              </div>

              {/* 공학 함수 자판 (공학용 모드에서만) */}
              <div className={"mt-1.5 grid-cols-5 gap-1 " + (mode === "sci" ? "grid" : "hidden")}>
                {second ? (
                  <>
                    <Key sm onClick={() => push("asin(")} tone="fn">sin⁻¹</Key>
                    <Key sm onClick={() => push("acos(")} tone="fn">cos⁻¹</Key>
                    <Key sm onClick={() => push("atan(")} tone="fn">tan⁻¹</Key>
                    <Key sm onClick={() => push("(")} tone="fn">(</Key>
                    <Key sm onClick={() => push(")", "op")} tone="fn">)</Key>

                    <Key sm onClick={() => push("10^(")} tone="fn">10ˣ</Key>
                    <Key sm onClick={() => push("e^(")} tone="fn">eˣ</Key>
                    <Key sm onClick={() => push("^2", "op")} tone="fn">x²</Key>
                    <Key sm onClick={() => push("∛(")} tone="fn">∛</Key>
                    <Key sm onClick={() => push("e")} tone="const">e</Key>

                    <Key sm onClick={() => push("abs(")} tone="fn">|x|</Key>
                    <Key sm onClick={() => push("×10^(", "op")} tone="fn">×10ⁿ</Key>
                    <Key sm onClick={() => push("%", "op")} tone="fn">%</Key>
                    <Key sm onClick={() => push("^(-1)", "op")} tone="fn">1/x</Key>
                    <Key sm onClick={() => push("Ans")} tone="const">Ans</Key>
                  </>
                ) : (
                  <>
                    <Key sm onClick={() => push("sin(")} tone="fn">sin</Key>
                    <Key sm onClick={() => push("cos(")} tone="fn">cos</Key>
                    <Key sm onClick={() => push("tan(")} tone="fn">tan</Key>
                    <Key sm onClick={() => push("(")} tone="fn">(</Key>
                    <Key sm onClick={() => push(")", "op")} tone="fn">)</Key>

                    <Key sm onClick={() => push("log(")} tone="fn">log</Key>
                    <Key sm onClick={() => push("ln(")} tone="fn">ln</Key>
                    <Key sm onClick={() => push("^", "op")} tone="fn">xʸ</Key>
                    <Key sm onClick={() => push("√(")} tone="fn">√</Key>
                    <Key sm onClick={() => push("π")} tone="const">π</Key>

                    <Key sm onClick={() => push("!", "op")} tone="fn">n!</Key>
                    <Key sm onClick={() => push("P", "op")} tone="fn">nPr</Key>
                    <Key sm onClick={() => push("C", "op")} tone="fn">nCr</Key>
                    <Key sm onClick={() => push("^(-1)", "op")} tone="fn">1/x</Key>
                    <Key sm onClick={() => push("Ans")} tone="const">Ans</Key>
                  </>
                )}
              </div>

              {/* 숫자·사칙 자판 */}
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                <Key onClick={clearAll} tone="rose" label="전체 지우기">AC</Key>
                <Key onClick={backspace} tone="fn" label="한 자리 지우기">←</Key>
                {mode === "sci" ? (
                  <Key onClick={() => setSecond((s) => !s)} tone={second ? "eq" : "fn"} label="다른 기능">2nd</Key>
                ) : (
                  <Key onClick={() => push("%", "op")} tone="fn" label="퍼센트 (÷100)">%</Key>
                )}
                <Key onClick={() => push("÷", "op")} tone="op" label="나누기">÷</Key>

                <Key onClick={() => push("7")}>7</Key>
                <Key onClick={() => push("8")}>8</Key>
                <Key onClick={() => push("9")}>9</Key>
                <Key onClick={() => push("×", "op")} tone="op" label="곱하기">×</Key>

                <Key onClick={() => push("4")}>4</Key>
                <Key onClick={() => push("5")}>5</Key>
                <Key onClick={() => push("6")}>6</Key>
                <Key onClick={() => push("-", "op")} tone="op" label="빼기">−</Key>

                <Key onClick={() => push("1")}>1</Key>
                <Key onClick={() => push("2")}>2</Key>
                <Key onClick={() => push("3")}>3</Key>
                <Key onClick={() => push("+", "op")} tone="op" label="더하기">+</Key>

                <Key onClick={() => push("(-")} tone="fn" label="음수">(-</Key>
                <Key onClick={() => push("0")}>0</Key>
                <Key onClick={() => push(".")} label="소수점">.</Key>
                <Key onClick={equals} tone="eq" label="계산">=</Key>
              </div>

              <p className="mt-1.5 text-center text-[10px] leading-4 text-slate-500">
                {mode === "sci"
                  ? "괄호는 닫지 않아도 = 를 누르면 자동으로 닫혀요 · 2π, 3(4+1) 처럼 곱셈 생략 가능"
                  : "더 많은 기능이 필요하면 위의 ‘일반’을 눌러 공학용으로 바꾸세요"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onPointerDown={startDrag}
          onPointerMove={onDrag}
          onPointerUp={(e) => { const moved = endDrag(e); if (!moved) toggleOpen(true); }}
          aria-label="계산기 열기"
          title="공학용 계산기 (끌어서 이동)"
          className="flex h-14 w-14 touch-none items-center justify-center rounded-full border-2 border-emerald-400/50 bg-slate-900/95 text-2xl shadow-2xl shadow-black/60 transition hover:scale-105 hover:border-emerald-300/70 active:cursor-grabbing"
        >
          🧮
        </button>
      )}
    </div>
  );
}

const KEY_TONE: Record<string, string> = {
  num: "border-white/10 bg-slate-800 text-slate-100 hover:bg-slate-700",
  fn: "border-white/10 bg-white/5 text-slate-300 hover:bg-white/15",
  const: "border-violet-400/40 bg-violet-400/15 text-violet-100 hover:bg-violet-400/25",
  op: "border-amber-400/40 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25",
  eq: "border-emerald-400/50 bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/30",
  rose: "border-rose-400/40 bg-rose-400/15 text-rose-100 hover:bg-rose-400/25",
};

function Key({ onClick, children, tone = "num", label, sm }: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: string;
  label?: string;
  sm?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={
        "select-none rounded-lg border text-center font-mono font-bold transition active:scale-95 " +
        (sm ? "py-2 text-[12px] " : "py-3 text-base ") +
        KEY_TONE[tone]
      }
    >
      {children}
    </button>
  );
}
