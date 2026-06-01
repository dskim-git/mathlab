"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "diag_meaning",
    prompt:
      "갤로시아 격자에서 한 대각선에 모이는 칸들이 의미하는 것이 무엇인지(수 버전: 같은 자릿수, 다항식 버전: 같은 차수) 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 수 버전에서는 (10ⁱ × 10ⁱ′) 같은 자릿값끼리, 다항식에서는 같은 차수의 항끼리 한 대각선에 모인다. 그래서 대각선 합이 그 자릿값(차수)의 최종 계수가 된다.",
  },
  {
    id: "compare_standard",
    prompt:
      "갤로시아 곱셈 방법과 평소에 쓰던 세로 곱셈(필산)이 어떻게 연결되는지, 공통점·차이점을 한두 가지씩 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 두 방법 모두 자릿수끼리 곱한 뒤 같은 자릿값을 모아 더한다는 점은 같다. 다만 세로 곱셈은 올림을 그때그때 처리하지만, 갤로시아는 격자에 다 채운 뒤 마지막에 한꺼번에 올림을 처리한다.",
  },
];

// ─── 문제 데이터 ───────────────────────────────────────────
type NumProblem = {
  label: string;
  title: string;
  numA: number[];
  numB: number[];
};

const NUM_PROBS: NumProblem[] = [
  { label: "① 61 × 45", title: "61 × 45 를 갤로시아 격자로", numA: [6, 1], numB: [4, 5] },
  { label: "② 73 × 28", title: "73 × 28 를 갤로시아 격자로", numA: [7, 3], numB: [2, 8] },
  { label: "③ 94 × 37", title: "94 × 37 를 갤로시아 격자로", numA: [9, 4], numB: [3, 7] },
  { label: "④ 328 × 45", title: "328 × 45 를 갤로시아 격자로", numA: [3, 2, 8], numB: [4, 5] },
  {
    label: "⑤ 156 × 237",
    title: "156 × 237 를 갤로시아 격자로",
    numA: [1, 5, 6],
    numB: [2, 3, 7],
  },
];

type PolyProblem = {
  label: string;
  title: string;
  coeffA: number[];
  coeffB: number[];
  labelsA: string[];
  labelsB: string[];
  degA: number;
  degB: number;
};

const POLY_PROBS: PolyProblem[] = [
  {
    label: "① (2x+3)(x−1)",
    title: "(2x+3)(x−1) 를 갤로시아 격자로",
    coeffA: [2, 3],
    coeffB: [1, -1],
    labelsA: ["2x", "3"],
    labelsB: ["x", "−1"],
    degA: 1,
    degB: 1,
  },
  {
    label: "② (3x+1)(2x²−5x+4)",
    title: "(3x+1)(2x²−5x+4) 를 갤로시아 격자로",
    coeffA: [3, 1],
    coeffB: [2, -5, 4],
    labelsA: ["3x", "1"],
    labelsB: ["2x²", "−5x", "4"],
    degA: 1,
    degB: 2,
  },
  {
    label: "③ (x²−3x+2)(x+4)",
    title: "(x²−3x+2)(x+4) 를 갤로시아 격자로",
    coeffA: [1, -3, 2],
    coeffB: [1, 4],
    labelsA: ["x²", "−3x", "2"],
    labelsB: ["x", "4"],
    degA: 2,
    degB: 1,
  },
  {
    label: "④ (2x²−x+3)(x²+2x−1)",
    title: "(2x²−x+3)(x²+2x−1) 를 갤로시아 격자로",
    coeffA: [2, -1, 3],
    coeffB: [1, 2, -1],
    labelsA: ["2x²", "−x", "3"],
    labelsB: ["x²", "2x", "−1"],
    degA: 2,
    degB: 2,
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
function termStr(coef: number, deg: number, leading: boolean): string {
  if (coef === 0) return "";
  const abs = Math.abs(coef);
  const sign = coef < 0 ? "−" : leading ? "" : "+";
  const num = abs === 1 && deg > 0 ? "" : String(abs);
  const v = deg === 0 ? "" : deg === 1 ? "x" : `x${sup(deg)}`;
  return `${sign}${num}${v}`;
}

// 격자 셀 96px; 열 개수에 따라 grid-cols arbitrary class 분기.
function gridColsClass(C: number) {
  if (C === 2) return "grid grid-cols-[repeat(2,96px)]";
  if (C === 3) return "grid grid-cols-[repeat(3,96px)]";
  return "grid";
}

// ─── 메인 ───────────────────────────────────────────────────
type Tab = "num" | "poly";

export default function GelosiaMul() {
  const [tab, setTab] = useState<Tab>("num");
  const [solvedNum, setSolvedNum] = useState<Set<number>>(new Set());
  const [solvedPoly, setSolvedPoly] = useState<Set<number>>(new Set());

  const total = NUM_PROBS.length + POLY_PROBS.length;
  const done = solvedNum.size + solvedPoly.size;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* ─── 헤더 ─── */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">✖️ 갤로시아 곱셈 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          12세기 인도 수학자 <b className="text-cyan-200">바스카라</b>의 《릴라바티》에 소개된{" "}
          <b className="text-cyan-200">격자 곱셈법</b>으로 정수 곱셈과 다항식 곱셈을 직접 체험해
          보세요. 한 대각선에 모이는 칸들이 어떤 의미를 가지는지 관찰해 보세요.
        </p>
      </div>

      {/* ─── 진행 ─── */}
      <div className="mt-5 flex items-center gap-3">
        <ProgressBar done={done} total={total} />
        <span className="rounded-full border border-emerald-400/45 bg-emerald-400/15 px-4 py-1 font-mono text-sm font-bold text-emerald-100">
          해결 {done} / {total}
        </span>
      </div>

      {/* ─── 탭 ─── */}
      <div className="mt-4 flex flex-wrap gap-2">
        <TabBtn active={tab === "num"} onClick={() => setTab("num")}>
          🔢 수 버전
        </TabBtn>
        <TabBtn active={tab === "poly"} onClick={() => setTab("poly")}>
          📐 다항식 버전
        </TabBtn>
      </div>

      <div className="mt-4">
        {tab === "num" ? (
          <NumSection
            solved={solvedNum}
            onSolve={(i) =>
              setSolvedNum((s) => {
                const n = new Set(s);
                n.add(i);
                return n;
              })
            }
          />
        ) : (
          <PolySection
            solved={solvedPoly}
            onSolve={(i) =>
              setSolvedPoly((s) => {
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
        <linearGradient id="gelosiaProgGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="0" y="0" width={ratio * 100} height="4" rx="2" fill="url(#gelosiaProgGrad)" />
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
          ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ─── 수 버전 ────────────────────────────────────────────────
function NumSection({
  solved,
  onSolve,
}: {
  solved: Set<number>;
  onSolve: (i: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="space-y-4">
      <InfoBox title="🔹 갤로시아 곱셈 방법 (수 버전)">
        <ul className="ml-4 list-disc space-y-1 text-sm leading-relaxed text-slate-300">
          <li>
            각 자릿수끼리의 곱을 <b className="text-amber-200">십의 자리</b>(왼쪽 위 삼각형)와{" "}
            <b className="text-sky-200">일의 자리</b>(오른쪽 아래 삼각형)로 나누어 씁니다.
          </li>
          <li>
            셀을 모두 채운 뒤 <b className="text-emerald-200">대각선 방향의 합</b>을 구합니다.
          </li>
          <li>대각선 합이 10 이상이면 올림(carry)을 합니다.</li>
          <li>결과를 위 → 아래, 왼쪽 → 오른쪽 순서로 읽으면 최종 곱이 됩니다.</li>
        </ul>
      </InfoBox>

      <ProblemSelector
        problems={NUM_PROBS.map((q) => q.label)}
        cur={idx}
        solved={solved}
        onPick={setIdx}
      />

      {/* key={idx}: 문제 변경 시 상태 자동 리셋, 차원 불일치 race condition 회피. */}
      <NumProblemRunner key={idx} idx={idx} onSolve={onSolve} />
    </div>
  );
}

function NumProblemRunner({
  idx,
  onSolve,
}: {
  idx: number;
  onSolve: (i: number) => void;
}) {
  const p = NUM_PROBS[idx];
  const R = p.numB.length;
  const C = p.numA.length;
  const nDiag = R + C;

  // 정답 사전 계산
  const cellAns = useMemo(() => {
    const out: { u: number; l: number }[][] = [];
    for (let r = 0; r < R; r++) {
      const row: { u: number; l: number }[] = [];
      for (let c = 0; c < C; c++) {
        const prod = p.numB[r] * p.numA[c];
        row.push({ u: Math.floor(prod / 10), l: prod % 10 });
      }
      out.push(row);
    }
    return out;
  }, [R, C, p.numA, p.numB]);

  const diagAns = useMemo(() => {
    const arr = new Array(nDiag).fill(0);
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        arr[r + c] += cellAns[r][c].u;
        arr[r + c + 1] += cellAns[r][c].l;
      }
    }
    return arr;
  }, [R, C, cellAns, nDiag]);

  const finalAns = useMemo(() => {
    const aN = p.numA.reduce((acc, d) => acc * 10 + d, 0);
    const bN = p.numB.reduce((acc, d) => acc * 10 + d, 0);
    return aN * bN;
  }, [p.numA, p.numB]);

  // 초기 상태 — key 가 idx 마다 새로 마운트하므로 useEffect 불필요.
  const [cells, setCells] = useState<{ u: string; l: string }[][]>(() =>
    Array.from({ length: R }, () => Array.from({ length: C }, () => ({ u: "", l: "" }))),
  );
  const [diags, setDiags] = useState<string[]>(() => new Array(nDiag).fill(""));
  const [cellOk, setCellOk] = useState<{ u: boolean | null; l: boolean | null }[][]>(() =>
    Array.from({ length: R }, () => Array.from({ length: C }, () => ({ u: null, l: null }))),
  );
  const [diagOk, setDiagOk] = useState<(boolean | null)[]>(() => new Array(nDiag).fill(null));
  const [fb, setFb] = useState<{ tone: "ok" | "ng"; message: string } | null>(null);
  const [done, setDone] = useState(false);

  function handleCheck() {
    let ok = true;
    let wrong = 0;
    const nc = cells.map((row, r) =>
      row.map((cell, c) => {
        const expU = cellAns[r][c].u;
        const expL = cellAns[r][c].l;
        const u = Number(cell.u);
        const l = Number(cell.l);
        const okU = cell.u.trim() !== "" && !Number.isNaN(u) && u === expU;
        const okL = cell.l.trim() !== "" && !Number.isNaN(l) && l === expL;
        if (!okU) {
          ok = false;
          wrong++;
        }
        if (!okL) {
          ok = false;
          wrong++;
        }
        return { u: okU, l: okL };
      }),
    );
    const nd = diags.map((v, i) => {
      const n = Number(v);
      const good = v.trim() !== "" && !Number.isNaN(n) && n === diagAns[i];
      if (!good) {
        ok = false;
        wrong++;
      }
      return good;
    });
    setCellOk(nc);
    setDiagOk(nd);
    if (ok) {
      setFb({ tone: "ok", message: `🎉 모두 정답입니다! 최종 결과: ${finalAns}` });
      if (!done) {
        setDone(true);
        onSolve(idx);
      }
    } else {
      setFb({ tone: "ng", message: `❌ 틀린 칸이 ${wrong}개 있습니다. 빨간 칸을 다시 확인하세요.` });
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
        ✏️ {p.title}
      </p>
      <p className="mt-2 text-sm text-slate-400">
        ① <b className="text-amber-200">{p.numA.join("")}</b> 의 각 자릿수(열) ×{" "}
        <b className="text-orange-200">{p.numB.join("")}</b> 의 각 자릿수(행) 곱을 셀에
        입력하세요. ② 십의 자리는 ▲, 일의 자리는 ▼ 위치에. ③ 대각선 합 칸에 합을 입력하세요
        (올림 처리 전 값).
      </p>

      <div className="mt-4 overflow-x-auto">
        <NumGrid
          p={p}
          cells={cells}
          diags={diags}
          cellOk={cellOk}
          diagOk={diagOk}
          onCellChange={(r, c, key, v) =>
            setCells((arr) =>
              arr.map((row, ri) =>
                ri === r
                  ? row.map((cell, ci) => (ci === c ? { ...cell, [key]: v } : cell))
                  : row,
              ),
            )
          }
          onDiagChange={(i, v) =>
            setDiags((arr) => arr.map((x, k) => (k === i ? v : x)))
          }
        />
      </div>

      {fb ? (
        <p
          className={`mt-3 text-sm font-bold ${fb.tone === "ok" ? "text-emerald-300" : "text-rose-300"}`}
        >
          {fb.message}
        </p>
      ) : null}

      <div className="mt-3">
        <button
          type="button"
          onClick={handleCheck}
          disabled={done}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {done ? "✅ 완료" : "✅ 채점하기"}
        </button>
      </div>

      {done ? (
        <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-100">
          <b className="text-cyan-200">{p.numA.join("")}</b> ×{" "}
          <b className="text-orange-200">{p.numB.join("")}</b> ={" "}
          <b className="text-amber-200">{finalAns}</b>
          <p className="mt-1 text-xs text-emerald-200/70">
            올림 전 대각선 합: {diagAns.join(" / ")} → 올림 처리 후 위 결과
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ─── 수 버전 격자 ───────────────────────────────────────────
function NumGrid({
  p,
  cells,
  diags,
  cellOk,
  diagOk,
  onCellChange,
  onDiagChange,
}: {
  p: NumProblem;
  cells: { u: string; l: string }[][];
  diags: string[];
  cellOk: { u: boolean | null; l: boolean | null }[][];
  diagOk: (boolean | null)[];
  onCellChange: (r: number, c: number, key: "u" | "l", v: string) => void;
  onDiagChange: (i: number, v: string) => void;
}) {
  const R = p.numB.length;
  const C = p.numA.length;
  // 차원 안전 가드 — 부모에서 key={idx} 로 리셋하므로 평상시엔 통과.
  if (cells.length !== R || cells[0]?.length !== C || diags.length !== R + C) return null;

  return (
    <div className="inline-flex flex-col items-start">
      {/* 위쪽 열 라벨 */}
      <div className="flex h-[32px]">
        <div className="w-[68px]" aria-hidden />
        {p.numA.map((d, i) => (
          <div
            key={i}
            className="flex w-[96px] items-end justify-center text-lg font-extrabold text-amber-300"
          >
            {d}
          </div>
        ))}
        <div className="w-[48px]" aria-hidden />
      </div>

      {/* 격자 행 */}
      {Array.from({ length: R }, (_, r) => (
        <div key={r} className="flex">
          <DiagSlotLeft
            label={`대각${r + 1}`}
            value={diags[r] ?? ""}
            ok={diagOk[r]}
            onChange={(v) => onDiagChange(r, v)}
          />
          <div className={gridColsClass(C)}>
            {Array.from({ length: C }, (_, c) => (
              <NumCell
                key={c}
                u={cells[r][c].u}
                l={cells[r][c].l}
                okU={cellOk[r][c].u}
                okL={cellOk[r][c].l}
                onChange={(key, v) => onCellChange(r, c, key, v)}
              />
            ))}
          </div>
          <div className="flex h-[96px] w-[48px] items-center justify-center text-lg font-extrabold text-orange-300">
            {p.numB[r]}
          </div>
        </div>
      ))}

      {/* 아래쪽 대각선 입력 (d = R..R+C-1) */}
      <div className="flex">
        <div className="w-[68px]" aria-hidden />
        {Array.from({ length: C }, (_, c) => (
          <DiagSlotBottom
            key={c}
            label={`대각${R + c + 1}`}
            value={diags[R + c] ?? ""}
            ok={diagOk[R + c]}
            onChange={(v) => onDiagChange(R + c, v)}
          />
        ))}
        <div className="w-[48px]" aria-hidden />
      </div>
    </div>
  );
}

function NumCell({
  u,
  l,
  okU,
  okL,
  onChange,
}: {
  u: string;
  l: string;
  okU: boolean | null;
  okL: boolean | null;
  onChange: (key: "u" | "l", v: string) => void;
}) {
  return (
    <div className="relative h-[96px] w-[96px] overflow-hidden border border-sky-400/40 bg-slate-900/60">
      <svg
        viewBox="0 0 96 96"
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <polygon points="0,0 96,0 0,96" fill="rgba(251,191,36,0.05)" />
        <polygon points="96,96 96,0 0,96" fill="rgba(56,189,248,0.06)" />
        <line x1="96" y1="0" x2="0" y2="96" stroke="rgba(96,165,250,0.5)" strokeWidth="1" />
      </svg>
      <TinyInput
        value={u}
        ok={okU}
        title="십의 자리"
        onChange={(v) => onChange("u", v)}
        placement="topLeft"
      />
      <TinyInput
        value={l}
        ok={okL}
        title="일의 자리"
        onChange={(v) => onChange("l", v)}
        placement="bottomRight"
      />
    </div>
  );
}

function TinyInput({
  value,
  ok,
  onChange,
  title,
  placement,
}: {
  value: string;
  ok: boolean | null;
  onChange: (v: string) => void;
  title?: string;
  placement: "topLeft" | "bottomRight";
}) {
  const okCls =
    ok === true
      ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-100"
      : ok === false
      ? "border-rose-400/70 bg-rose-400/15 text-rose-100"
      : "border-white/15 bg-slate-900/50 text-slate-100";
  const placeCls =
    placement === "topLeft"
      ? "absolute left-2 top-2"
      : "absolute bottom-2 right-2";
  return (
    <input
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="?"
      title={title}
      className={`h-[30px] w-[38px] rounded-md border-2 text-center font-mono text-base font-bold outline-none transition focus:ring-2 focus:ring-cyan-400/40 ${placeCls} ${okCls}`}
    />
  );
}

function DiagInput({
  value,
  ok,
  onChange,
}: {
  value: string;
  ok: boolean | null;
  onChange: (v: string) => void;
}) {
  const okCls =
    ok === true
      ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-100"
      : ok === false
      ? "border-rose-400/70 bg-rose-400/15 text-rose-100"
      : "border-white/15 bg-slate-900/50 text-slate-100";
  return (
    <input
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="?"
      className={`h-[30px] w-[50px] rounded-md border-2 text-center font-mono text-base font-bold outline-none transition focus:ring-2 focus:ring-cyan-400/40 ${okCls}`}
    />
  );
}

function DiagSlotLeft({
  label,
  value,
  ok,
  onChange,
}: {
  label: string;
  value: string;
  ok: boolean | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex h-[96px] w-[68px] flex-col items-center justify-center gap-1">
      <span className="text-[10px] font-bold text-emerald-300">{label}</span>
      <DiagInput value={value} ok={ok} onChange={onChange} />
    </div>
  );
}

function DiagSlotBottom({
  label,
  value,
  ok,
  onChange,
}: {
  label: string;
  value: string;
  ok: boolean | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex h-[64px] w-[96px] flex-col items-center justify-center gap-1">
      <span className="text-[10px] font-bold text-emerald-300">{label}</span>
      <DiagInput value={value} ok={ok} onChange={onChange} />
    </div>
  );
}

// ─── 다항식 버전 ────────────────────────────────────────────
function PolySection({
  solved,
  onSolve,
}: {
  solved: Set<number>;
  onSolve: (i: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="space-y-4">
      <InfoBox title="🔹 갤로시아 곱셈 방법 (다항식 버전)">
        <ul className="ml-4 list-disc space-y-1 text-sm leading-relaxed text-slate-300">
          <li>
            수 버전과 똑같은 격자 구조! 각 셀에 <b className="text-amber-200">두 항 계수의 곱</b>을
            씁니다 (부호 포함).
          </li>
          <li>
            같은 대각선 = <b className="text-emerald-200">같은 차수</b>의 항.
          </li>
          <li>대각선 합 = 해당 차수의 최종 계수 → 모으면 결과 다항식이 완성됩니다.</li>
        </ul>
      </InfoBox>

      <ProblemSelector
        problems={POLY_PROBS.map((q) => q.label)}
        cur={idx}
        solved={solved}
        onPick={setIdx}
      />

      <PolyProblemRunner key={idx} idx={idx} onSolve={onSolve} />
    </div>
  );
}

function PolyProblemRunner({
  idx,
  onSolve,
}: {
  idx: number;
  onSolve: (i: number) => void;
}) {
  const p = POLY_PROBS[idx];
  const R = p.coeffB.length;
  const C = p.coeffA.length;
  const nDiag = R + C - 1;

  const cellAns = useMemo(() => {
    const out: number[][] = [];
    for (let r = 0; r < R; r++) {
      const row: number[] = [];
      for (let c = 0; c < C; c++) row.push(p.coeffB[r] * p.coeffA[c]);
      out.push(row);
    }
    return out;
  }, [R, C, p.coeffA, p.coeffB]);

  const diagAns = useMemo(() => {
    const arr = new Array(nDiag).fill(0);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) arr[r + c] += cellAns[r][c];
    return arr;
  }, [R, C, cellAns, nDiag]);

  const resultText = useMemo(() => {
    const maxDeg = p.degA + p.degB;
    let acc = "";
    for (let d = 0; d < nDiag; d++) {
      const coef = diagAns[d];
      const deg = maxDeg - d;
      if (coef === 0) continue;
      acc += termStr(coef, deg, acc === "");
    }
    return acc || "0";
  }, [diagAns, nDiag, p.degA, p.degB]);

  const [cells, setCells] = useState<string[][]>(() =>
    Array.from({ length: R }, () => new Array(C).fill("")),
  );
  const [diags, setDiags] = useState<string[]>(() => new Array(nDiag).fill(""));
  const [cellOk, setCellOk] = useState<(boolean | null)[][]>(() =>
    Array.from({ length: R }, () => new Array(C).fill(null)),
  );
  const [diagOk, setDiagOk] = useState<(boolean | null)[]>(() => new Array(nDiag).fill(null));
  const [fb, setFb] = useState<{ tone: "ok" | "ng"; message: string } | null>(null);
  const [done, setDone] = useState(false);

  function handleCheck() {
    let ok = true;
    let wrong = 0;
    const nc = cells.map((row, r) =>
      row.map((v, c) => {
        const n = Number(v);
        const good = v.trim() !== "" && !Number.isNaN(n) && n === cellAns[r][c];
        if (!good) {
          ok = false;
          wrong++;
        }
        return good;
      }),
    );
    const nd = diags.map((v, i) => {
      const n = Number(v);
      const good = v.trim() !== "" && !Number.isNaN(n) && n === diagAns[i];
      if (!good) {
        ok = false;
        wrong++;
      }
      return good;
    });
    setCellOk(nc);
    setDiagOk(nd);
    if (ok) {
      setFb({ tone: "ok", message: `🎉 모두 정답! 결과 다항식: ${resultText}` });
      if (!done) {
        setDone(true);
        onSolve(idx);
      }
    } else {
      setFb({ tone: "ng", message: `❌ 틀린 칸이 ${wrong}개 있습니다. 부호도 확인하세요.` });
    }
  }

  const maxDeg = p.degA + p.degB;
  function degLabel(d: number) {
    const deg = maxDeg - d;
    if (deg > 1) return `x${sup(deg)}항`;
    if (deg === 1) return "x항";
    return "상수";
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
        ✏️ {p.title}
      </p>
      <p className="mt-2 text-sm text-slate-400">
        ① 열: <b className="text-amber-200">{p.labelsA.join(", ")}</b> ② 행:{" "}
        <b className="text-orange-200">{p.labelsB.join(", ")}</b> ③ 각 셀에 두 항{" "}
        <b className="text-cyan-200">계수의 곱</b>(부호 포함)을 입력하세요.
      </p>

      <div className="mt-4 overflow-x-auto">
        <PolyGrid
          p={p}
          cells={cells}
          diags={diags}
          cellOk={cellOk}
          diagOk={diagOk}
          degLabel={degLabel}
          onCellChange={(r, c, v) =>
            setCells((arr) =>
              arr.map((row, ri) =>
                ri === r ? row.map((x, ci) => (ci === c ? v : x)) : row,
              ),
            )
          }
          onDiagChange={(i, v) =>
            setDiags((arr) => arr.map((x, k) => (k === i ? v : x)))
          }
        />
      </div>

      {fb ? (
        <p
          className={`mt-3 text-sm font-bold ${fb.tone === "ok" ? "text-emerald-300" : "text-rose-300"}`}
        >
          {fb.message}
        </p>
      ) : null}

      <div className="mt-3">
        <button
          type="button"
          onClick={handleCheck}
          disabled={done}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {done ? "✅ 완료" : "✅ 채점하기"}
        </button>
      </div>

      {done ? (
        <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-100">
          <p className="font-bold">결과 다항식</p>
          <p className="mt-1 font-mono text-base text-amber-200">{resultText}</p>
        </div>
      ) : null}
    </div>
  );
}

// ─── 다항식 격자 ────────────────────────────────────────────
function PolyGrid({
  p,
  cells,
  diags,
  cellOk,
  diagOk,
  degLabel,
  onCellChange,
  onDiagChange,
}: {
  p: PolyProblem;
  cells: string[][];
  diags: string[];
  cellOk: (boolean | null)[][];
  diagOk: (boolean | null)[];
  degLabel: (d: number) => string;
  onCellChange: (r: number, c: number, v: string) => void;
  onDiagChange: (i: number, v: string) => void;
}) {
  const R = p.coeffB.length;
  const C = p.coeffA.length;
  if (cells.length !== R || cells[0]?.length !== C || diags.length !== R + C - 1) return null;

  return (
    <div className="inline-flex flex-col items-start">
      {/* 위쪽 열 라벨 */}
      <div className="flex h-[32px]">
        <div className="w-[68px]" aria-hidden />
        {p.labelsA.map((l, i) => (
          <div
            key={i}
            className="flex w-[96px] items-end justify-center text-sm font-bold text-amber-300"
          >
            {l}
          </div>
        ))}
        <div className="w-[48px]" aria-hidden />
      </div>

      {/* 격자 행 */}
      {Array.from({ length: R }, (_, r) => (
        <div key={r} className="flex">
          <DiagSlotLeftPoly
            label={degLabel(r)}
            value={diags[r] ?? ""}
            ok={diagOk[r]}
            onChange={(v) => onDiagChange(r, v)}
          />
          <div className={gridColsClass(C)}>
            {Array.from({ length: C }, (_, c) => (
              <PolyCell
                key={c}
                value={cells[r][c]}
                ok={cellOk[r][c]}
                onChange={(v) => onCellChange(r, c, v)}
              />
            ))}
          </div>
          <div className="flex h-[96px] w-[48px] items-center justify-center text-sm font-bold text-orange-300">
            {p.labelsB[r]}
          </div>
        </div>
      ))}

      {/* 아래쪽 대각선 입력: c=1..C-1 → d=R-1+c */}
      {C > 1 ? (
        <div className="flex">
          <div className="w-[68px]" aria-hidden />
          <div className="w-[96px]" aria-hidden />
          {Array.from({ length: C - 1 }, (_, k) => {
            const c = k + 1;
            const d = R - 1 + c;
            return (
              <DiagSlotBottomPoly
                key={d}
                label={degLabel(d)}
                value={diags[d] ?? ""}
                ok={diagOk[d]}
                onChange={(v) => onDiagChange(d, v)}
              />
            );
          })}
          <div className="w-[48px]" aria-hidden />
        </div>
      ) : null}
    </div>
  );
}

function DiagSlotLeftPoly({
  label,
  value,
  ok,
  onChange,
}: {
  label: string;
  value: string;
  ok: boolean | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex h-[96px] w-[68px] flex-col items-center justify-center gap-1">
      <span className="text-center text-[10px] font-bold text-cyan-300">{label}</span>
      <DiagInput value={value} ok={ok} onChange={onChange} />
    </div>
  );
}

function DiagSlotBottomPoly({
  label,
  value,
  ok,
  onChange,
}: {
  label: string;
  value: string;
  ok: boolean | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex h-[64px] w-[96px] flex-col items-center justify-center gap-1">
      <span className="text-center text-[10px] font-bold text-cyan-300">{label}</span>
      <DiagInput value={value} ok={ok} onChange={onChange} />
    </div>
  );
}

function PolyCell({
  value,
  ok,
  onChange,
}: {
  value: string;
  ok: boolean | null;
  onChange: (v: string) => void;
}) {
  const cls =
    ok === true
      ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-100"
      : ok === false
      ? "border-rose-400/70 bg-rose-400/15 text-rose-100"
      : "border-white/15 bg-slate-900/50 text-slate-100";
  return (
    <div className="relative h-[96px] w-[96px] overflow-hidden border border-sky-400/40 bg-slate-900/60">
      <svg
        viewBox="0 0 96 96"
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <line x1="96" y1="0" x2="0" y2="96" stroke="rgba(96,165,250,0.5)" strokeWidth="1" />
      </svg>
      <input
        inputMode="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="?"
        className={`absolute left-1/2 top-1/2 h-[32px] w-[60px] -translate-x-1/2 -translate-y-1/2 rounded-md border-2 px-1 py-1 text-center font-mono text-base font-bold outline-none transition focus:ring-2 focus:ring-cyan-400/40 ${cls}`}
      />
    </div>
  );
}

// ─── 공용 ───────────────────────────────────────────────────
function InfoBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/[0.04] p-4">
      <p className="mb-2 text-sm font-bold text-cyan-300">{title}</p>
      {children}
    </div>
  );
}

function ProblemSelector({
  problems,
  cur,
  solved,
  onPick,
}: {
  problems: string[];
  cur: number;
  solved: Set<number>;
  onPick: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {problems.map((label, i) => {
        const isCur = i === cur;
        const isDone = solved.has(i);
        const cls = isCur
          ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
          : isDone
          ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10";
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(i)}
            className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition ${cls}`}
          >
            {label}
            {isDone ? " ✓" : ""}
          </button>
        );
      })}
    </div>
  );
}
