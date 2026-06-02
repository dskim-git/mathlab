"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "diag_means_dividend",
    prompt:
      "갤로시아 나눗셈 격자에서 각 셀이 B[r]·q[c] 가 되고, 대각선(↘) 방향의 합이 피제식의 한 항의 계수가 되는 이유를 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 몫×나누는식 = (q[c] x^… )·(B[r] x^…) 를 모두 더하면 각 차수의 계수가 모이는데, 같은 차수의 항들은 r+c 가 일정한 셀들에 대응된다. 그래서 한 대각선의 합이 피제식의 그 차수 계수와 같아진다.",
  },
  {
    id: "compare_synthetic",
    prompt:
      "갤로시아 나눗셈과 조립제법(합성제법)의 공통점·차이점을 한두 가지씩 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 두 방법 모두 ‘앞에서 구한 몫에 나누는 식을 곱해 현재 계수에서 빼는’ 점화식 구조를 따른다. 조립제법은 일차 단항 (x − α) 전용이라 한 줄로 줄어들지만, 갤로시아는 나누는 식 차수가 2 이상일 때도 같은 방식으로 격자가 확장된다.",
  },
];

// ─── 데이터 ───────────────────────────────────────────────
type PolyProblem = {
  label: string;
  title: string;
  A: number[];
  B: number[];
  dividendStr: string;
  divisorStr: string;
};

const POLY_PROBS: PolyProblem[] = [
  {
    label: "① (2x³−3x²+x+4) ÷ (2x+3)",
    title: "(2x³ − 3x² + x + 4) ÷ (2x + 3)",
    A: [2, -3, 1, 4],
    B: [2, 3],
    dividendStr: "2x³ − 3x² + x + 4",
    divisorStr: "2x + 3",
  },
  {
    label: "② (x³ − x² − 5x − 3) ÷ (x + 1)",
    title: "(x³ − x² − 5x − 3) ÷ (x + 1)",
    A: [1, -1, -5, -3],
    B: [1, 1],
    dividendStr: "x³ − x² − 5x − 3",
    divisorStr: "x + 1",
  },
  {
    label: "③ (x³ − 5x + 6) ÷ (x − 2)",
    title: "(x³ − 5x + 6) ÷ (x − 2)",
    A: [1, 0, -5, 6],
    B: [1, -2],
    dividendStr: "x³ − 5x + 6",
    divisorStr: "x − 2",
  },
  {
    label: "④ (2x³ + x² − 5x + 3) ÷ (x − 1)",
    title: "(2x³ + x² − 5x + 3) ÷ (x − 1)",
    A: [2, 1, -5, 3],
    B: [1, -1],
    dividendStr: "2x³ + x² − 5x + 3",
    divisorStr: "x − 1",
  },
  {
    label: "⑤ (x³ + 2x² − 4x + 6) ÷ (x² + x − 2)",
    title: "(x³ + 2x² − 4x + 6) ÷ (x² + x − 2)",
    A: [1, 2, -4, 6],
    B: [1, 1, -2],
    dividendStr: "x³ + 2x² − 4x + 6",
    divisorStr: "x² + x − 2",
  },
  {
    label: "⑥ (2x⁴ + x³ − 3x + 1) ÷ (2x − 1)",
    title: "(2x⁴ + x³ − 3x + 1) ÷ (2x − 1)",
    A: [2, 1, 0, -3, 1],
    B: [2, -1],
    dividendStr: "2x⁴ + x³ − 3x + 1",
    divisorStr: "2x − 1",
  },
];

// ─── 유틸 ───────────────────────────────────────────────────
const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
function sup(n: number) {
  return String(n)
    .split("")
    .map((c) => SUP[Number(c)] ?? c)
    .join("");
}
function roundFmt(v: number): number {
  const r = Math.round(v * 1e9) / 1e9;
  const ri = Math.round(r);
  return Math.abs(r - ri) < 1e-7 ? ri : parseFloat(r.toFixed(4));
}
function fmtN(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return n < 0 ? `−${Math.abs(n)}` : String(n);
}
function polyStrFromCoef(coeffs: number[]): string {
  let arr = [...coeffs];
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

// 갤로시아 나눗셈 알고리즘 — 몫 + 셀(B[r]·q[c]) + 나머지 + 대각선 합 표시값.
function computeDivision(A: number[], B: number[]) {
  const nCols = A.length;
  const nRows = B.length;
  const quotLen = nCols - nRows + 1;
  const q = new Array<number>(quotLen).fill(0);

  for (let c = 0; c < quotLen; c++) {
    let s = A[c];
    for (let r = 1; r < nRows; r++) {
      if (c - r >= 0) s -= B[r] * q[c - r];
    }
    q[c] = roundFmt(s / B[0]);
  }

  // cell[r][c] = B[r] · q[c]  (c < quotLen 인 경우만; 나머지 열은 null)
  const cells: (number | null)[][] = [];
  for (let r = 0; r < nRows; r++) {
    const row: (number | null)[] = [];
    for (let c = 0; c < nCols; c++) {
      row.push(c < quotLen ? roundFmt(B[r] * q[c]) : null);
    }
    cells.push(row);
  }

  // 나머지 계수: c ≥ quotLen 열의 대각선 합 보정
  const remCoeffs: number[] = [];
  for (let c = quotLen; c < nCols; c++) {
    let s = A[c];
    for (let r = 1; r < nRows; r++) {
      const cc = c - r;
      if (cc >= 0 && cc < quotLen) s -= cells[r][cc] ?? 0;
    }
    remCoeffs.push(roundFmt(s));
  }

  // 아래 대각선 표시값 = A[nRows-1 ..] (검증·시각 정보)
  const diagSums: number[] = [];
  for (let i = 0; i < quotLen; i++) diagSums.push(A[nRows - 1 + i]);

  return { q, cells, remCoeffs, diagSums, quotLen, nCols, nRows };
}

// 격자 colcount 분기 (POLY_PROBS 의 nCols ∈ {4, 5}).
function gridColsClass(C: number) {
  if (C === 4) return "grid grid-cols-[repeat(4,90px)]";
  if (C === 5) return "grid grid-cols-[repeat(5,90px)]";
  return "grid";
}

// ─── 메인 ───────────────────────────────────────────────────
export default function GelosiaDiv() {
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const [idx, setIdx] = useState(0);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-violet-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">➗ 갤로시아 나눗셈 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          격자(갤로시아) 방식으로 다항식 나눗셈의 <b className="text-emerald-200">몫</b> 과{" "}
          <b className="text-orange-200">나머지</b> 를 직접 구해 보세요. 각 셀은 B[행] × q[열] 이고,
          대각선(↘) 방향의 합이 피제식의 한 항 계수와 같습니다.
        </p>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <ProgressBar done={solved.size} total={POLY_PROBS.length} />
        <span className="rounded-full border border-violet-400/45 bg-violet-400/15 px-4 py-1 font-mono text-sm font-bold text-violet-100">
          해결 {solved.size} / {POLY_PROBS.length}
        </span>
      </div>

      <IntroBox />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
          문제 선택
        </span>
        <div className="flex flex-wrap gap-2">
          {POLY_PROBS.map((p, i) => {
            const isCur = i === idx;
            const isDone = solved.has(i);
            const cls = isCur
              ? "border-violet-400/60 bg-violet-400/15 text-violet-100"
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

      <ProblemRunner
        key={idx}
        idx={idx}
        onSolve={(i) =>
          setSolved((s) => {
            const n = new Set(s);
            n.add(i);
            return n;
          })
        }
      />

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
        <linearGradient id="gdProgGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="0" y="0" width={ratio * 100} height="4" rx="2" fill="url(#gdProgGrad)" />
    </svg>
  );
}

function IntroBox() {
  return (
    <div className="mt-4 rounded-2xl border border-violet-400/30 bg-violet-400/[0.05] p-4">
      <p className="text-sm font-bold text-violet-200">🔹 갤로시아 나눗셈 격자 구조</p>
      <p className="mt-2 text-sm leading-7 text-slate-300">
        <b className="text-violet-200">직사각형 크기</b> — 행 수 = 나누는 식 차수 + 1, 열 수 =
        피제식 항 수.
      </p>
      <ul className="ml-4 mt-1 list-disc space-y-1 text-sm leading-7 text-slate-300">
        <li>
          <b className="text-amber-200">왼쪽·아래</b>: 피제식 계수 (반시계 방향, 주어진 값)
        </li>
        <li>
          <b className="text-sky-200">오른쪽</b>: 나누는 식 계수 B[0], B[1], … (주어진 값)
        </li>
        <li>
          <b className="text-emerald-200">위쪽</b>: 몫의 계수 — 학생이 직접 구합니다.
        </li>
        <li>각 셀 = B[r] × q[c] (학생이 입력)</li>
        <li>대각선(↘) 합 = 왼쪽·아래에 표시된 피제식의 각 항 계수</li>
        <li>
          <b className="text-orange-200">마지막 (행수−1) 열</b>: 나머지 계수
        </li>
      </ul>
    </div>
  );
}

function ProblemRunner({
  idx,
  onSolve,
}: {
  idx: number;
  onSolve: (i: number) => void;
}) {
  const p = POLY_PROBS[idx];
  const data = useMemo(() => computeDivision(p.A, p.B), [p.A, p.B]);
  const { q, cells, remCoeffs, diagSums, quotLen, nCols, nRows } = data;

  // 입력 상태
  // 몫: quotLen 개 (key="q-c")
  // 셀: nRows × quotLen 개 (key="cell-r-c", c < quotLen)
  // 나머지: remCoeffs.length 개 (key="rem-i", remIdx = 0..remLen-1)
  const inputKeys = useMemo(() => {
    const keys: string[] = [];
    for (let c = 0; c < quotLen; c++) keys.push(`q-${c}`);
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < quotLen; c++) keys.push(`cell-${r}-${c}`);
    }
    for (let i = 0; i < remCoeffs.length; i++) keys.push(`rem-${i}`);
    return keys;
  }, [quotLen, nRows, remCoeffs.length]);

  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    inputKeys.forEach((k) => (init[k] = ""));
    return init;
  });
  const [status, setStatus] = useState<Record<string, boolean | null>>(() => {
    const init: Record<string, boolean | null> = {};
    inputKeys.forEach((k) => (init[k] = null));
    return init;
  });
  const [fb, setFb] = useState<{ tone: "ok" | "ng"; text: string } | null>(null);
  const [done, setDone] = useState(false);

  function expected(key: string): number {
    if (key.startsWith("q-")) {
      const c = Number(key.slice(2));
      return q[c];
    }
    if (key.startsWith("cell-")) {
      const [, rStr, cStr] = key.split("-");
      const r = Number(rStr);
      const c = Number(cStr);
      return (cells[r][c] as number) ?? 0;
    }
    if (key.startsWith("rem-")) {
      const i = Number(key.slice(4));
      return remCoeffs[i];
    }
    return 0;
  }

  function handleChange(key: string, v: string) {
    setInputs((arr) => ({ ...arr, [key]: v }));
    setStatus((arr) => ({ ...arr, [key]: null }));
    setFb(null);
  }

  function handleCheck() {
    let ok = true;
    let wrong = 0;
    const newStatus: Record<string, boolean | null> = { ...status };
    inputKeys.forEach((k) => {
      const raw = inputs[k].trim().replace(/−/g, "-");
      const exp = expected(k);
      const val = Number(raw);
      const good = raw !== "" && Number.isFinite(val) && Math.abs(val - exp) <= 1e-2;
      newStatus[k] = good;
      if (!good) {
        ok = false;
        wrong++;
      }
    });
    setStatus(newStatus);
    if (ok) {
      setFb({ tone: "ok", text: "🎉 모두 정답입니다!" });
      if (!done) {
        setDone(true);
        onSolve(idx);
      }
    } else {
      setFb({ tone: "ng", text: `❌ 틀린 칸이 ${wrong}개 있어요. 다시 확인해보세요.` });
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
        ✏️ {p.title}
      </p>
      <div className="mt-2 rounded-xl border border-violet-400/30 bg-violet-400/[0.06] px-3 py-2 text-sm leading-7 text-slate-200">
        피제식: <b className="font-mono text-amber-300">{p.dividendStr}</b> &nbsp;|&nbsp; 나누는 식:{" "}
        <b className="font-mono text-violet-200">{p.divisorStr}</b> <br />
        격자:{" "}
        <b className="text-sky-200">
          {nRows} 행 × {nCols} 열
        </b>{" "}
        (행수 = 나누는 식 차수+1, 열수 = 피제식 항수). 위쪽 초록 {quotLen} 칸이 몫,
        마지막 {nCols - quotLen} 칸이 나머지.
      </div>

      <Legend />

      <div className="mt-4 overflow-x-auto">
        <DivGrid
          problem={p}
          data={data}
          inputs={inputs}
          status={status}
          onChange={handleChange}
        />
      </div>

      {fb ? (
        <p
          className={`mt-3 text-sm font-bold ${
            fb.tone === "ok" ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {fb.text}
        </p>
      ) : null}

      <div className="mt-3">
        <button
          type="button"
          onClick={handleCheck}
          disabled={done}
          className="rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {done ? "✅ 완료" : "✅ 채점하기"}
        </button>
      </div>

      {done ? (
        <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-100">
          <p className="font-bold">🎉 갤로시아 격자 나눗셈 완성!</p>
          <p className="mt-1 font-mono">
            몫: <b className="text-emerald-300">{polyStrFromCoef(q)}</b> <br />
            나머지: <b className="text-orange-300">{polyStrFromCoef(remCoeffs)}</b>
          </p>
          <p className="mt-1 text-xs text-emerald-200/70">
            (확인) {p.dividendStr} = ({p.divisorStr})({polyStrFromCoef(q)}) +{" "}
            {polyStrFromCoef(remCoeffs) || "0"}
          </p>
          <p className="mt-2 text-xs">
            아래 대각선 표시값 [{diagSums.join(", ")}] 는 피제식 계수 A[{nRows - 1}..] 와
            대응됩니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Legend() {
  const items: { color: string; text: string }[] = [
    { color: "bg-amber-400/55 border-amber-400", text: "노랑(왼쪽·아래) = 피제식 계수 (주어짐)" },
    { color: "bg-sky-400/55 border-sky-400", text: "파랑(오른쪽) = 나누는 식 계수 (주어짐)" },
    { color: "bg-emerald-400/55 border-emerald-400", text: "초록(위) = 몫의 계수 (입력)" },
    { color: "bg-slate-200/45 border-slate-200", text: "흰색(격자) = B[r]×q[c] (입력)" },
    { color: "bg-orange-400/55 border-orange-400", text: "주황(나머지 열) = 나머지 계수 (입력)" },
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded-sm border ${it.color}`} aria-hidden />
          {it.text}
        </span>
      ))}
    </div>
  );
}

// ─── 격자 ──────────────────────────────────────────────────
function DivGrid({
  problem,
  data,
  inputs,
  status,
  onChange,
}: {
  problem: PolyProblem;
  data: ReturnType<typeof computeDivision>;
  inputs: Record<string, string>;
  status: Record<string, boolean | null>;
  onChange: (key: string, v: string) => void;
}) {
  const { quotLen, nCols, nRows, diagSums } = data;

  return (
    <div className="inline-flex flex-col items-start">
      {/* 위쪽 행: 좌 spacer + nCols 개 몫/나머지 라벨 */}
      <div className="flex">
        <div className="w-[40px]" aria-hidden />
        {Array.from({ length: nCols }, (_, c) => {
          const isRem = c >= quotLen;
          return (
            <div key={c} className="flex w-[90px] flex-col items-center justify-end pb-1">
              {isRem ? (
                <span className="text-[10px] font-bold text-slate-500">나머지</span>
              ) : (
                <CellInput
                  k={`q-${c}`}
                  value={inputs[`q-${c}`] ?? ""}
                  status={status[`q-${c}`]}
                  onChange={(v) => onChange(`q-${c}`, v)}
                  tone="quot"
                  small
                />
              )}
            </div>
          );
        })}
        <div className="w-[40px]" aria-hidden />
      </div>

      {/* 중간: 왼쪽 라벨 + 격자 + 오른쪽 라벨 */}
      <div className="flex">
        {/* 왼쪽 라벨 (피제식 계수 r>0 만; r=0 비움) */}
        <div className="flex w-[40px] flex-col items-end justify-around">
          {Array.from({ length: nRows }, (_, r) => (
            <div
              key={r}
              className="flex h-[72px] items-center justify-end pr-1 font-mono text-base font-extrabold text-amber-300"
            >
              {r === 0 ? "" : fmtN(problem.A[r - 1])}
            </div>
          ))}
        </div>

        {/* 격자 */}
        <div className="flex flex-col border-[3px] border-sky-500">
          {Array.from({ length: nRows }, (_, r) => (
            <div key={r} className={gridColsClass(nCols)}>
              {Array.from({ length: nCols }, (_, c) => {
                const isRem = c >= quotLen;
                const isFirstRem = isRem && r === 0;
                return (
                  <DivCell
                    key={c}
                    inputKey={
                      isRem
                        ? isFirstRem
                          ? `rem-${c - quotLen}`
                          : null
                        : `cell-${r}-${c}`
                    }
                    value={
                      !isRem
                        ? inputs[`cell-${r}-${c}`] ?? ""
                        : isFirstRem
                        ? inputs[`rem-${c - quotLen}`] ?? ""
                        : ""
                    }
                    status={
                      !isRem
                        ? status[`cell-${r}-${c}`]
                        : isFirstRem
                        ? status[`rem-${c - quotLen}`]
                        : null
                    }
                    tone={isRem ? (isFirstRem ? "rem" : "blank") : "cell"}
                    onChange={(v) => {
                      if (!isRem) onChange(`cell-${r}-${c}`, v);
                      else if (isFirstRem) onChange(`rem-${c - quotLen}`, v);
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* 오른쪽 라벨 (B[r]) */}
        <div className="flex w-[40px] flex-col items-start justify-around">
          {Array.from({ length: nRows }, (_, r) => (
            <div
              key={r}
              className="flex h-[72px] items-center pl-1 font-mono text-base font-extrabold text-sky-300"
            >
              {fmtN(problem.B[r])}
            </div>
          ))}
        </div>
      </div>

      {/* 아래 합산: spacer + quotLen 개 표시값 */}
      <div className="flex pt-1">
        <div className="w-[40px]" aria-hidden />
        {diagSums.map((v, i) => (
          <div
            key={i}
            className="flex w-[90px] items-start justify-center pt-1 font-mono text-base font-extrabold text-amber-300"
          >
            {fmtN(v)}
          </div>
        ))}
        {Array.from({ length: nCols - quotLen }, (_, i) => (
          <div key={`pad-${i}`} className="w-[90px]" aria-hidden />
        ))}
        <div className="w-[40px]" aria-hidden />
      </div>
    </div>
  );
}

function DivCell({
  inputKey,
  value,
  status,
  tone,
  onChange,
}: {
  inputKey: string | null;
  value: string;
  status?: boolean | null;
  tone: "cell" | "rem" | "blank";
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative h-[72px] w-[90px] overflow-hidden border border-sky-500 bg-slate-900/60">
      <svg
        viewBox="0 0 90 72"
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        {/* \ 방향 대각선 (왼쪽 위 → 오른쪽 아래) */}
        <line x1="0" y1="0" x2="90" y2="72" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />
        <polygon points="0,0 90,0 90,72" fill="rgba(59,130,246,0.04)" />
      </svg>
      {inputKey === null || tone === "blank" ? null : (
        <CellInput
          k={inputKey}
          value={value}
          status={status}
          onChange={onChange}
          tone={tone === "rem" ? "rem" : "cell"}
        />
      )}
    </div>
  );
}

function CellInput({
  k,
  value,
  status,
  onChange,
  tone,
  small = false,
}: {
  k: string;
  value: string;
  status: boolean | null | undefined;
  onChange: (v: string) => void;
  tone: "quot" | "cell" | "rem";
  small?: boolean;
}) {
  void k;
  const toneCls =
    tone === "quot"
      ? "border-emerald-400/55 text-emerald-100 bg-emerald-400/[0.08]"
      : tone === "rem"
      ? "border-orange-400/55 text-orange-100 bg-orange-400/[0.08]"
      : "border-white/15 text-slate-100 bg-slate-900/50";
  const okCls =
    status === true
      ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-100"
      : status === false
      ? "border-rose-400/70 bg-rose-400/15 text-rose-100"
      : toneCls;
  const sizeCls = small ? "h-[28px] w-[48px]" : "h-[30px] w-[48px]";
  const placeCls = small
    ? ""
    : "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";
  return (
    <input
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="?"
      className={`${placeCls} ${sizeCls} rounded-md border-2 text-center font-mono text-sm font-bold outline-none transition focus:ring-2 focus:ring-violet-400/40 ${okCls}`}
    />
  );
}
