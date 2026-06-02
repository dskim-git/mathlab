"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "formula_correspondence",
    prompt:
      "조립제법의 점화식(맨 앞은 =B1, 2행은 α×앞 b, 3행은 1행+2행)과 스프레드시트의 셀 수식이 어떻게 1:1로 대응되는지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 점화식 b_{k−1} = a_k + α·b_k 는 ‘3행 = 1행 + 2행’ 그리고 ‘2행 = α × 앞의 3행’ 두 셀 수식으로 쪼개진다. 셀 주소가 곧 점화식의 인덱스 역할을 한다.",
  },
  {
    id: "dependency_idea",
    prompt:
      "스프레드시트는 한 셀이 다른 셀을 참조하면 자동으로 값을 갱신합니다. 이 ‘셀 참조의 자동 갱신’이 조립제법처럼 단계적으로 값이 결정되는 계산에 어떻게 잘 어울리는지 생각을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 한 셀의 값이 앞 셀에서만 결정되도록 식을 적어 두면, α 만 바꿔도 모든 칸이 한 번에 다시 계산된다. 다른 다항식을 풀고 싶을 땐 1행 계수만 바꿔도 같은 시트가 그대로 동작한다.",
  },
];

// ─── 데이터 ───────────────────────────────────────────────
type Problem = {
  label: string;
  alpha: number;
  coeffs: number[]; // 내림차순
  divisor: string;
};

const PROBS: Problem[] = [
  { label: "문제 ①", alpha: 2, coeffs: [3, -2, 1, -4], divisor: "x − 2" },
  { label: "문제 ②", alpha: -1, coeffs: [2, 1, -3], divisor: "x + 1" },
  { label: "문제 ③", alpha: 2, coeffs: [1, 0, 0, -8], divisor: "x − 2" },
  { label: "문제 ④", alpha: 1, coeffs: [2, -3, 0, 4, -1], divisor: "x − 1" },
];

const COL_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];

// ─── 유틸 ───────────────────────────────────────────────────
const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
function sup(n: number) {
  return String(n)
    .split("")
    .map((c) => SUP[Number(c)] ?? c)
    .join("");
}
function fmtN(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return n < 0 ? `−${Math.abs(n)}` : String(n);
}
function polyStr(coeffs: number[]): string {
  const arr = [...coeffs];
  while (arr.length > 1 && arr[0] === 0) arr.shift();
  const n = arr.length;
  const parts: string[] = [];
  arr.forEach((c, i) => {
    if (c === 0) return;
    const exp = n - 1 - i;
    const abs = Math.abs(c);
    const sign = c < 0 ? "−" : parts.length > 0 ? "+" : "";
    const num = abs === 1 && exp > 0 ? "" : String(abs);
    const v = exp === 0 ? "" : exp === 1 ? "x" : `x${sup(exp)}`;
    parts.push(`${sign}${num}${v}`);
  });
  return parts.join(" ") || "0";
}
function synDiv(coeffs: number[], alpha: number): { r2: number[]; r3: number[] } {
  const n = coeffs.length;
  const r2 = new Array<number>(n).fill(0);
  const r3 = new Array<number>(n).fill(0);
  r3[0] = coeffs[0];
  for (let i = 1; i < n; i++) {
    r2[i] = alpha * r3[i - 1];
    r3[i] = coeffs[i] + r2[i];
  }
  return { r2, r3 };
}

// (row, col) → 정답 수식 + 설명
function cellFormulaHint(row: number, col: number, alpha: number) {
  if (row === 3 && col === 1) {
    return { formula: "=B1", desc: "맨 앞 계수 그대로 내려쓰기 (bₙ₋₁ = aₙ)" };
  }
  if (row === 2 && col >= 2) {
    const prev = COL_LETTERS[col - 1];
    return { formula: `=A1*${prev}3`, desc: `α(=${alpha}) × ${prev}3` };
  }
  if (row === 3 && col >= 2) {
    const cur = COL_LETTERS[col];
    return { formula: `=${cur}1+${cur}2`, desc: "1행 계수 + 2행 값" };
  }
  return { formula: "", desc: "" };
}

// ─── 안전한 수식 평가 ───────────────────────────────────────
// 입력: "=B1", "=A1*B3", "=C1+C2", "3", "−5" 등
// cells: row → col → number|null
function evalFormula(
  raw: string,
  cells: Record<number, Record<number, number | null>>,
): number | null {
  if (!raw) return null;
  const f = raw.trim();
  if (f === "") return null;
  if (!f.startsWith("=")) {
    // 직접 숫자 입력 (−5, 3 등) — −는 minus 로 처리
    const norm = f.replace(/−/g, "-");
    const n = Number(norm);
    return Number.isFinite(n) ? n : null;
  }
  let expr = f.slice(1).trim().replace(/−/g, "-");
  // whitelist: 글자, 숫자, +, -, *, 공백, ()
  if (!/^[A-Za-z0-9+\-*\s()]+$/.test(expr)) return null;
  // 셀 참조 치환: 알파벳 1자 + 1~3 행번호
  let bad = false;
  expr = expr.replace(/([A-Za-z])([1-3])\b/g, (_m, col: string, row: string) => {
    const colIdx = col.toUpperCase().charCodeAt(0) - 65;
    const rowIdx = parseInt(row);
    if (colIdx < 0 || colIdx > 6) {
      bad = true;
      return "0";
    }
    const v = cells[rowIdx]?.[colIdx];
    if (v === null || v === undefined) {
      bad = true;
      return "0";
    }
    return `(${v})`;
  });
  if (bad) return null;
  // 치환 후 허용 문자만 남았는지 재확인
  if (!/^[\d+\-*\s().]+$/.test(expr)) return null;
  try {
    // 보안 가드: whitelist 통과 후이므로 Function 사용 안전.
    const r = new Function('"use strict"; return (' + expr + ")")();
    if (typeof r !== "number" || !Number.isFinite(r)) return null;
    return Math.round(r * 1e9) / 1e9;
  } catch {
    return null;
  }
}

// ─── 메인 ───────────────────────────────────────────────────
type Tab = "guide" | "practice";

export default function SyntheticDivSpreadsheet() {
  const [tab, setTab] = useState<Tab>("guide");
  const [solved, setSolved] = useState<Set<number>>(new Set());

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">📊 스프레드시트로 조립제법 구현</h3>
        <p className="mt-2 leading-7 text-slate-300">
          엑셀/구글 시트의 <b className="text-emerald-200">셀 수식</b> 구조로 조립제법을 직접
          구현해 보세요. 한 셀이 다른 셀을 참조하면 자동으로 값이 갱신되는 원리를 활용합니다.
        </p>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <ProgressBar done={solved.size} total={PROBS.length} />
        <span className="rounded-full border border-emerald-400/45 bg-emerald-400/15 px-4 py-1 font-mono text-sm font-bold text-emerald-100">
          해결 {solved.size} / {PROBS.length}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <TabBtn active={tab === "guide"} onClick={() => setTab("guide")}>
          📋 구현 방법 설명
        </TabBtn>
        <TabBtn active={tab === "practice"} onClick={() => setTab("practice")}>
          🧮 직접 구현해보기
        </TabBtn>
      </div>

      <div className="mt-4">
        {tab === "guide" ? (
          <GuideSection />
        ) : (
          <PracticeSection
            solved={solved}
            onSolve={(i) =>
              setSolved((s) => {
                const n = new Set(s);
                n.add(i);
                return n;
              })
            }
          />
        )}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const ratio = total === 0 ? 0 : Math.min(1, done / total);
  return (
    <svg
      viewBox="0 0 100 4"
      preserveAspectRatio="none"
      className="h-2 flex-1"
      role="img"
      aria-label={`진행률 ${Math.round(ratio * 100)}%`}
    >
      <defs>
        <linearGradient id="sdsProgGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="0" y="0" width={ratio * 100} height="4" rx="2" fill="url(#sdsProgGrad)" />
    </svg>
  );
}

function TabBtn({
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
        "rounded-xl border-2 px-5 py-2 text-sm font-bold transition " +
        (active
          ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ─── 가이드 ────────────────────────────────────────────────
function GuideSection() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.05] p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
          📋 스프레드시트로 조립제법 구현하기
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          <b className="text-amber-200">3x³ − 2x² + x − 4</b> 를{" "}
          <b className="text-rose-200">x − 2</b> 로 나눌 때 스프레드시트에서 다음과 같이 구현할 수
          있습니다.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-bold text-emerald-300">① 셀 입력 규칙</p>
        <ol className="mt-3 space-y-2">
          {[
            <>
              셀 <b>A1</b> 에 <b>α (나누는 수)</b> 입력. 예: A1 ={" "}
              <Mono>2</Mono>
            </>,
            <>
              셀 <b>B1, C1, D1, E1, …</b> 에 다항식의{" "}
              <b>최고차항부터 차례로 계수</b> 입력. 예: B1 = <Mono>3</Mono>, C1 ={" "}
              <Mono>-2</Mono>, D1 = <Mono>1</Mono>, E1 = <Mono>-4</Mono>
            </>,
            <>
              셀 <b>B3</b> 에 <Mono>=B1</Mono>. <br />
              <span className="text-slate-400">→ 맨 앞 계수 그대로 (bₙ₋₁ = aₙ)</span>
            </>,
            <>
              C2 = <Mono>=A1*B3</Mono> &nbsp;(α × 앞 계수) <br />
              C3 = <Mono>=C1+C2</Mono> &nbsp;(1행 + 2행) <br />
              D2 = <Mono>=A1*C3</Mono>, D3 = <Mono>=D1+D2</Mono> <br />
              E2 = <Mono>=A1*D3</Mono>, E3 = <Mono>=E1+E2</Mono>{" "}
              <span className="text-rose-300">← 마지막: 나머지 R</span>
            </>,
          ].map((item, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-white/10 bg-slate-900/40 p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-bold text-emerald-200">
                {i + 1}
              </span>
              <span className="text-sm leading-7 text-slate-200">{item}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-bold text-emerald-300">② 완성된 표 예시</p>
        <p className="mt-2 text-sm text-slate-400">
          위 규칙대로 입력하면 아래와 같은 표가 만들어집니다:
        </p>
        <div className="mt-3 overflow-x-auto">
          <GuideExampleTable />
        </div>
        <p className="mt-3 text-sm text-slate-300">
          ✅ <b>3행 마지막 칸 E3 = 14</b> 가 <b className="text-rose-300">나머지 R</b>, 나머지 앞
          칸들 B3, C3, D3 = 3, 4, 9 가{" "}
          <b className="text-emerald-300">몫 Q(x) = 3x² + 4x + 9</b> 의 계수.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-bold text-emerald-300">③ 수식 패턴 정리</p>
        <p className="mt-2 text-sm text-slate-300">
          계수의 수가 n+1 개인 n 차 다항식을 (x − α) 로 나눌 때:
        </p>
        <ul className="ml-4 mt-2 list-disc space-y-1 text-sm text-slate-300">
          <li>A1 = α</li>
          <li>B1 ~ (n+2)1 = 계수 aₙ, …, a₀</li>
          <li>
            <b className="text-emerald-200">3행 첫 번째</b>: <Mono>=B1</Mono> (그대로 내려쓰기)
          </li>
          <li>
            <b className="text-sky-200">2행 k 번째</b> (k ≥ 2): <Mono>=A1 × (k−1번째 3행)</Mono>
          </li>
          <li>
            <b className="text-emerald-200">3행 k 번째</b> (k ≥ 2):{" "}
            <Mono>=k번째 1행 + k번째 2행</Mono>
          </li>
        </ul>
      </div>
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-emerald-400/30 bg-emerald-400/[0.06] px-1.5 py-0.5 font-mono text-xs text-emerald-200">
      {children}
    </span>
  );
}

// 가이드용 정적 예시 표
function GuideExampleTable() {
  const alpha = 2;
  const coeffs = [3, -2, 1, -4];
  const { r2, r3 } = synDiv(coeffs, alpha);
  const n = coeffs.length;
  return (
    <table className="border-collapse">
      <thead>
        <tr>
          <th scope="col"><span className="sr-only">row</span></th>
          {Array.from({ length: n + 1 }, (_, i) => (
            <th
              key={i}
              scope="col"
              className="min-w-[88px] border border-sky-400/30 bg-sky-400/15 px-3 py-1.5 font-mono text-sm font-bold text-sky-100"
            >
              {COL_LETTERS[i]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* Row 1 */}
        <tr>
          <th scope="row" className="border border-sky-400/30 bg-sky-400/15 px-3 py-1.5 font-mono text-sm font-bold text-sky-100">
            1
          </th>
          <td className="h-[48px] border border-amber-400/45 bg-amber-400/15 text-center font-mono text-base font-extrabold text-amber-200">
            {fmtN(alpha)}
          </td>
          {coeffs.map((c, i) => (
            <td
              key={i}
              className="h-[48px] border border-sky-400/30 bg-sky-400/[0.08] text-center font-mono text-base font-bold text-sky-100"
            >
              {fmtN(c)}
            </td>
          ))}
        </tr>
        {/* Row 2 */}
        <tr>
          <th scope="row" className="border border-sky-400/30 bg-sky-400/15 px-3 py-1.5 font-mono text-sm font-bold text-sky-100">
            2
          </th>
          <td className="h-[64px] border border-white/10 bg-slate-900/40" />
          <td className="h-[64px] border border-white/10 bg-slate-900/40" />
          {Array.from({ length: n - 1 }, (_, k) => {
            const col = k + 2;
            const prev = COL_LETTERS[col - 1];
            return (
              <td
                key={col}
                className="h-[64px] border border-white/10 bg-slate-900/40 text-center"
              >
                <span className="block font-mono text-[10px] text-sky-300">
                  =A1×{prev}3
                </span>
                <span className="block font-mono text-base font-bold text-sky-200">
                  {fmtN(r2[col - 1])}
                </span>
              </td>
            );
          })}
        </tr>
        {/* Row 3 */}
        <tr>
          <th scope="row" className="border border-sky-400/30 bg-sky-400/15 px-3 py-1.5 font-mono text-sm font-bold text-sky-100">
            3
          </th>
          <td className="h-[64px] border border-white/10 bg-slate-900/40" />
          <td className="h-[64px] border border-emerald-400/45 bg-emerald-400/[0.07] text-center">
            <span className="block font-mono text-[10px] text-emerald-300">=B1</span>
            <span className="block font-mono text-base font-bold text-emerald-200">
              {fmtN(r3[0])}
            </span>
          </td>
          {Array.from({ length: n - 1 }, (_, k) => {
            const col = k + 2;
            const cur = COL_LETTERS[col];
            const isR = col === n;
            return (
              <td
                key={col}
                className={
                  "h-[64px] border text-center " +
                  (isR
                    ? "border-rose-400/55 bg-rose-400/10"
                    : "border-emerald-400/45 bg-emerald-400/[0.07]")
                }
              >
                <span
                  className={
                    "block font-mono text-[10px] " + (isR ? "text-rose-300" : "text-emerald-300")
                  }
                >
                  ={cur}1+{cur}2
                </span>
                <span
                  className={
                    "block font-mono text-base font-bold " +
                    (isR ? "text-rose-200" : "text-emerald-200")
                  }
                >
                  {fmtN(r3[col - 1])}
                </span>
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
}

// ─── 실습 ──────────────────────────────────────────────────
function PracticeSection({
  solved,
  onSolve,
}: {
  solved: Set<number>;
  onSolve: (i: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sky-400/30 bg-sky-400/[0.05] px-4 py-3 text-sm leading-7 text-slate-200">
        📝 <b className="text-emerald-300">위 표 (수식 입력)</b> 의 초록 빈 칸에 엑셀 수식을 직접
        입력하세요. (예: <Mono>=B1</Mono> <Mono>=A1*B3</Mono> <Mono>=C1+C2</Mono>) <br />
        📊 <b className="text-sky-300">아래 표 (계산 결과)</b> 에는 입력한 수식의 계산 결과값이
        자동으로 표시됩니다.
      </div>

      {/* 문제 선택 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
          문제 선택
        </span>
        <div className="flex flex-wrap gap-2">
          {PROBS.map((p, i) => {
            const isCur = i === idx;
            const isDone = solved.has(i);
            const cls = isCur
              ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
              : isDone
              ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-200"
              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10";
            return (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition ${cls}`}
              >
                {p.label}
                {isDone ? " ✓" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <LegendDot tone="amber" /> α (주어짐)
        <LegendDot tone="sky" /> 계수 (주어짐)
        <LegendDot tone="emerald-dashed" /> 수식 입력 칸
        <LegendDot tone="emerald" /> 올바른 계산 결과
      </div>

      <PracticeRunner key={idx} idx={idx} onSolve={onSolve} />
    </div>
  );
}

function LegendDot({ tone }: { tone: "amber" | "sky" | "emerald" | "emerald-dashed" }) {
  const cls =
    tone === "amber"
      ? "border-amber-400/55 bg-amber-400/15"
      : tone === "sky"
      ? "border-sky-400/55 bg-sky-400/15"
      : tone === "emerald"
      ? "border-emerald-400/55 bg-emerald-400/15"
      : "border-emerald-400/55 bg-emerald-400/[0.04] border-dashed";
  return <span className={`inline-block h-3 w-3 rounded-sm border ${cls}`} aria-hidden />;
}

function PracticeRunner({
  idx,
  onSolve,
}: {
  idx: number;
  onSolve: (i: number) => void;
}) {
  const p = PROBS[idx];
  const n = p.coeffs.length;
  const ans = useMemo(() => synDiv(p.coeffs, p.alpha), [p.coeffs, p.alpha]);

  // input keys: "2-2", "2-3", ..., "3-1", "3-2", ...
  const inputKeys = useMemo(() => {
    const keys: { row: 2 | 3; col: number; key: string }[] = [];
    keys.push({ row: 3, col: 1, key: "3-1" });
    for (let c = 2; c <= n; c++) {
      keys.push({ row: 2, col: c, key: `2-${c}` });
      keys.push({ row: 3, col: c, key: `3-${c}` });
    }
    return keys;
  }, [n]);

  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    inputKeys.forEach((k) => (init[k.key] = ""));
    return init;
  });
  const [focused, setFocused] = useState<{ row: number; col: number } | null>(null);
  const [fb, setFb] = useState<{ tone: "ok" | "ng" | "hint"; text: string } | null>(null);
  const [done, setDone] = useState(false);

  // cells 매트릭스 계산: row 1 주어진 값 + row 2/3 평가된 값
  const cells = useMemo(() => {
    const m: Record<number, Record<number, number | null>> = {
      1: {},
      2: {},
      3: {},
    };
    // row 1
    m[1][0] = p.alpha;
    p.coeffs.forEach((c, i) => (m[1][i + 1] = c));
    // row 3 col 1
    m[3][1] = evalFormula(inputs["3-1"], m);
    // col 2..n: r2 then r3
    for (let c = 2; c <= n; c++) {
      m[2][c] = evalFormula(inputs[`2-${c}`], m);
      m[3][c] = evalFormula(inputs[`3-${c}`], m);
    }
    return m;
  }, [p.alpha, p.coeffs, inputs, n]);

  function handleChange(key: string, v: string) {
    setInputs((arr) => ({ ...arr, [key]: v }));
    setFb(null);
  }

  function handleCheck() {
    let ok = true;
    let hasFormula = true;
    let wrong = 0;
    for (const k of inputKeys) {
      const raw = inputs[k.key].trim();
      if (raw === "") {
        ok = false;
        wrong++;
        continue;
      }
      if (!raw.startsWith("=")) hasFormula = false;
      const val = cells[k.row]?.[k.col];
      const expected = k.row === 2 ? ans.r2[k.col - 1] : ans.r3[k.col - 1];
      if (val === null || val === undefined || Math.abs(val - expected) > 1e-6) {
        ok = false;
        wrong++;
      }
    }
    if (ok) {
      setFb({
        tone: hasFormula ? "ok" : "hint",
        text: hasFormula
          ? "🎉 모든 수식이 올바릅니다!"
          : "✅ 값은 모두 맞습니다! = 로 시작하는 수식으로 작성하면 더욱 완벽해요.",
      });
      if (!done) {
        setDone(true);
        onSolve(idx);
      }
    } else {
      setFb({
        tone: "ng",
        text: `❌ 맞지 않는 칸이 ${wrong}개 있어요. 아래 결과 표의 빨간 셀을 확인하세요.`,
      });
    }
  }

  function handleHint() {
    for (const k of inputKeys) {
      const val = cells[k.row]?.[k.col];
      const expected = k.row === 2 ? ans.r2[k.col - 1] : ans.r3[k.col - 1];
      const isCorrect =
        inputs[k.key].trim() !== "" &&
        val !== null &&
        val !== undefined &&
        Math.abs(val - expected) <= 1e-6;
      if (!isCorrect) {
        const fi = cellFormulaHint(k.row, k.col, p.alpha);
        setInputs((arr) => ({ ...arr, [k.key]: fi.formula }));
        setFb({
          tone: "hint",
          text: `💡 ${COL_LETTERS[k.col]}${k.row} 에 수식 ${fi.formula} 를 채워 넣었습니다.`,
        });
        return;
      }
    }
    setFb({ tone: "ok", text: "✅ 이미 모두 완성되었습니다!" });
  }

  function handleSolveAll() {
    const filled: Record<string, string> = {};
    for (const k of inputKeys) {
      filled[k.key] = cellFormulaHint(k.row, k.col, p.alpha).formula;
    }
    setInputs(filled);
    setFb({ tone: "hint", text: "🔮 정답 수식을 모두 표시했습니다." });
    if (!done) {
      setDone(true);
      onSolve(idx);
    }
  }

  function handleReset() {
    const init: Record<string, string> = {};
    inputKeys.forEach((k) => (init[k.key] = ""));
    setInputs(init);
    setFb(null);
    setFocused(null);
  }

  const focusedHint = focused ? cellFormulaHint(focused.row, focused.col, p.alpha) : null;

  return (
    <>
      {/* 문제 헤더 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          ✏️ <span className="font-mono">{polyStr(p.coeffs)}</span> ÷ ({p.divisor})
        </p>
        <p className="mt-2 text-sm text-slate-400">
          α ={" "}
          <b className="text-amber-300">
            {p.alpha < 0 ? `(${fmtN(p.alpha)})` : p.alpha}
          </b>
        </p>

        {/* Formula bar */}
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-sky-400/30 bg-sky-400/[0.05] px-3 py-2">
          <span className="rounded-md bg-amber-400/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-200">
            {focused ? `${COL_LETTERS[focused.col]}${focused.row}` : "—"}
          </span>
          <span className="text-xs text-slate-400">힌트:</span>
          <span className="flex-1 font-mono text-xs text-emerald-200">
            {focusedHint
              ? focusedHint.formula
                ? `${focusedHint.formula}${focusedHint.desc ? "  →  " + focusedHint.desc : ""}`
                : "수식 셀이 아닙니다."
              : "셀을 클릭하면 해당 칸의 수식 힌트가 표시됩니다."}
          </span>
        </div>

        {/* 수식 입력 표 */}
        <p className="mt-4 inline-flex items-center rounded-md border border-emerald-400/40 bg-emerald-400/[0.06] px-3 py-1 text-xs font-bold text-emerald-200">
          📝 수식 입력 표 — 엑셀 수식으로 채워보세요
        </p>
        <div className="mt-2 overflow-x-auto">
          <FormulaTable
            problem={p}
            inputs={inputs}
            inputKeys={inputKeys}
            onChange={handleChange}
            onFocus={(row, col) => setFocused({ row, col })}
          />
        </div>

        {/* 계산 결과 표 */}
        <p className="mt-5 inline-flex items-center rounded-md border border-sky-400/40 bg-sky-400/[0.06] px-3 py-1 text-xs font-bold text-sky-200">
          📊 계산 결과 표 — 수식 입력 즉시 자동 업데이트
        </p>
        <div className="mt-2 overflow-x-auto">
          <PreviewTable problem={p} cells={cells} ans={ans} />
        </div>

        {fb ? (
          <p
            className={
              "mt-3 text-sm font-bold " +
              (fb.tone === "ok"
                ? "text-emerald-300"
                : fb.tone === "ng"
                ? "text-rose-300"
                : "text-sky-300")
            }
          >
            {fb.text}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCheck}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
          >
            ✅ 채점하기
          </button>
          <button
            type="button"
            onClick={handleHint}
            className="rounded-xl border border-sky-400/45 bg-sky-400/10 px-5 py-2 text-sm font-bold text-sky-200 transition hover:bg-sky-400/20"
          >
            💡 힌트 (한 칸)
          </button>
          <button
            type="button"
            onClick={handleSolveAll}
            className="rounded-xl border border-violet-400/45 bg-violet-400/10 px-5 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/20"
          >
            🔮 정답 보기
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            ↩ 초기화
          </button>
        </div>

        {done ? (
          <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-100">
            <p className="font-bold">🎉 완성!</p>
            <p className="mt-1 font-mono">
              <b>{polyStr(p.coeffs)}</b> ÷ <b>({p.divisor})</b>
            </p>
            <p className="mt-1 font-mono">
              몫 Q(x) = <b className="text-emerald-300">{polyStr(ans.r3.slice(0, -1))}</b>{" "}
              | 나머지 R = <b className="text-amber-300">{fmtN(ans.r3[n - 1])}</b>
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}

// ─── 수식 입력 표 ──────────────────────────────────────────
function FormulaTable({
  problem,
  inputs,
  inputKeys,
  onChange,
  onFocus,
}: {
  problem: Problem;
  inputs: Record<string, string>;
  inputKeys: { row: 2 | 3; col: number; key: string }[];
  onChange: (key: string, v: string) => void;
  onFocus: (row: number, col: number) => void;
}) {
  const n = problem.coeffs.length;
  const inputSet = new Set(inputKeys.map((k) => k.key));

  return (
    <table className="border-collapse">
      <thead>
        <tr>
          <th scope="col"><span className="sr-only">row</span></th>
          {Array.from({ length: n + 1 }, (_, i) => (
            <th
              key={i}
              scope="col"
              className="min-w-[100px] border border-sky-400/30 bg-sky-400/15 px-3 py-1.5 font-mono text-sm font-bold text-sky-100"
            >
              {COL_LETTERS[i]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* Row 1 (주어짐) */}
        <tr>
          <th scope="row" className="border border-sky-400/30 bg-sky-400/15 px-3 py-1.5 font-mono text-sm font-bold text-sky-100">
            1
          </th>
          <td className="h-[48px] min-w-[100px] border border-amber-400/45 bg-amber-400/15 text-center font-mono text-base font-extrabold text-amber-200">
            {fmtN(problem.alpha)}
          </td>
          {problem.coeffs.map((c, i) => (
            <td
              key={i}
              className="h-[48px] min-w-[100px] border border-sky-400/30 bg-sky-400/[0.08] text-center font-mono text-base font-bold text-sky-100"
            >
              {fmtN(c)}
            </td>
          ))}
        </tr>
        {/* Row 2 */}
        <tr>
          <th scope="row" className="border border-sky-400/30 bg-sky-400/15 px-3 py-1.5 font-mono text-sm font-bold text-sky-100">
            2
          </th>
          <td className="h-[48px] min-w-[100px] border border-white/10 bg-slate-900/40" />
          <td className="h-[48px] min-w-[100px] border border-white/10 bg-slate-900/40" />
          {Array.from({ length: n - 1 }, (_, k) => {
            const col = k + 2;
            const key = `2-${col}`;
            return (
              <td
                key={col}
                className="h-[48px] min-w-[100px] border-2 border-dashed border-emerald-400/40 bg-emerald-400/[0.04]"
              >
                <FormulaInput
                  value={inputs[key] ?? ""}
                  placeholder={inputSet.has(key) ? "수식" : ""}
                  onChange={(v) => onChange(key, v)}
                  onFocus={() => onFocus(2, col)}
                />
              </td>
            );
          })}
        </tr>
        {/* Row 3 */}
        <tr>
          <th scope="row" className="border border-sky-400/30 bg-sky-400/15 px-3 py-1.5 font-mono text-sm font-bold text-sky-100">
            3
          </th>
          <td className="h-[48px] min-w-[100px] border border-white/10 bg-slate-900/40" />
          {Array.from({ length: n }, (_, k) => {
            const col = k + 1;
            const key = `3-${col}`;
            const isR = col === n;
            return (
              <td
                key={col}
                className={
                  "h-[48px] min-w-[100px] border-2 border-dashed " +
                  (isR
                    ? "border-rose-400/45 bg-rose-400/[0.06]"
                    : "border-emerald-400/40 bg-emerald-400/[0.04]")
                }
              >
                <FormulaInput
                  value={inputs[key] ?? ""}
                  placeholder="수식"
                  onChange={(v) => onChange(key, v)}
                  onFocus={() => onFocus(3, col)}
                />
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
}

function FormulaInput({
  value,
  placeholder,
  onChange,
  onFocus,
}: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onFocus: () => void;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      className="h-full w-full bg-transparent px-2 text-center font-mono text-sm font-bold text-emerald-200 placeholder:text-emerald-300/30 placeholder:italic focus:outline-none"
    />
  );
}

// ─── 계산 결과 표 ──────────────────────────────────────────
function PreviewTable({
  problem,
  cells,
  ans,
}: {
  problem: Problem;
  cells: Record<number, Record<number, number | null>>;
  ans: { r2: number[]; r3: number[] };
}) {
  const n = problem.coeffs.length;

  function cellTone(val: number | null | undefined, expected: number) {
    if (val === null || val === undefined) return "empty";
    return Math.abs(val - expected) <= 1e-6 ? "ok" : "ng";
  }

  function cellClass(tone: string, isR: boolean = false) {
    if (tone === "empty") return "border-white/10 bg-slate-900/40 text-slate-600";
    if (tone === "ok")
      return isR
        ? "border-rose-400/55 bg-rose-400/15 text-rose-100"
        : "border-emerald-400/55 bg-emerald-400/15 text-emerald-100";
    return "border-rose-400/70 bg-rose-400/20 text-rose-100";
  }

  return (
    <table className="border-collapse">
      <thead>
        <tr>
          <th scope="col"><span className="sr-only">row</span></th>
          {Array.from({ length: n + 1 }, (_, i) => (
            <th
              key={i}
              scope="col"
              className="min-w-[100px] border border-sky-400/30 bg-sky-400/15 px-3 py-1.5 font-mono text-sm font-bold text-sky-100"
            >
              {COL_LETTERS[i]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* Row 1 — 그대로 */}
        <tr>
          <th scope="row" className="border border-sky-400/30 bg-sky-400/15 px-3 py-1.5 font-mono text-sm font-bold text-sky-100">
            1
          </th>
          <td className="h-[44px] min-w-[100px] border border-amber-400/45 bg-amber-400/15 text-center font-mono text-base font-extrabold text-amber-200">
            {fmtN(problem.alpha)}
          </td>
          {problem.coeffs.map((c, i) => (
            <td
              key={i}
              className="h-[44px] min-w-[100px] border border-sky-400/30 bg-sky-400/[0.08] text-center font-mono text-base font-bold text-sky-100"
            >
              {fmtN(c)}
            </td>
          ))}
        </tr>
        {/* Row 2 */}
        <tr>
          <th scope="row" className="border border-sky-400/30 bg-sky-400/15 px-3 py-1.5 font-mono text-sm font-bold text-sky-100">
            2
          </th>
          <td className="h-[44px] min-w-[100px] border border-white/10 bg-slate-900/40" />
          <td className="h-[44px] min-w-[100px] border border-white/10 bg-slate-900/40" />
          {Array.from({ length: n - 1 }, (_, k) => {
            const col = k + 2;
            const v = cells[2]?.[col];
            const tone = cellTone(v, ans.r2[col - 1]);
            return (
              <td
                key={col}
                className={`h-[44px] min-w-[100px] border-2 text-center font-mono text-base font-bold ${cellClass(tone)}`}
              >
                {v === null || v === undefined ? "?" : fmtN(v)}
              </td>
            );
          })}
        </tr>
        {/* Row 3 */}
        <tr>
          <th scope="row" className="border border-sky-400/30 bg-sky-400/15 px-3 py-1.5 font-mono text-sm font-bold text-sky-100">
            3
          </th>
          <td className="h-[44px] min-w-[100px] border border-white/10 bg-slate-900/40" />
          {Array.from({ length: n }, (_, k) => {
            const col = k + 1;
            const v = cells[3]?.[col];
            const tone = cellTone(v, ans.r3[col - 1]);
            const isR = col === n;
            return (
              <td
                key={col}
                className={`h-[44px] min-w-[100px] border-2 text-center font-mono text-base font-bold ${cellClass(tone, isR)}`}
              >
                {v === null || v === undefined ? "?" : fmtN(v)}
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
}
