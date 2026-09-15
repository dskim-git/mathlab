"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  C_CHIPS,
  C_START,
  GRADE,
  GRADE_COLS,
  GRADE_ROWS,
  LAB_MATS,
  LEARN_STEPS,
  MACHINE_LABEL,
  MACHINE_STEPS,
  MISSIONS,
  PUZZLES,
  REAL_NOTE,
  SCENES,
  SLOTS,
  cVal,
  colSums,
  colsOf,
  fillM,
  fmt,
  foldTex,
  machineKind,
  machineResult,
  missionDone,
  mulM,
  rowsOf,
  sideValues,
  won,
  type Mat,
  type Piece,
  type Puzzle,
  type Slot,
  type Step,
  type TableDef,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why",
    prompt:
      "성분이 모두 1 인 열행렬을 곱하면 각 행의 합이, 모두 1/n 이면 평균이 나왔어요. 곱셈의 정의를 써서 그 까닭을 설명하고, 여기서 n 이 왜 하필 열의 개수인지도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 곱의 정의대로 하면 a₁₁·1 + a₁₂·1 + … 이 되어 한 줄의 수를 모두 더한 것이 된다. 한 가로줄에 들어 있는 수의 개수가 곧 열의 개수이므로 그 수로 나누어야 평균이 된다.",
  },
  {
    id: "side",
    prompt:
      "같은 행렬인데 왼쪽에서 곱하면 열이, 오른쪽에서 곱하면 행이 하나로 접혔어요. 왜 곱하는 자리에 따라 접히는 방향이 달라지는지, 그리고 양쪽에서 함께 곱하면 왜 수 하나가 남는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 오른쪽에 곱하는 열행렬은 A 의 각 행과 만나므로 행이 접히고, 왼쪽에 곱하는 행행렬은 A 의 각 열과 만나므로 열이 접힌다. 양쪽에서 접으면 1×1 만 남아 수 하나가 된다.",
  },
  {
    id: "use",
    prompt:
      "여러 날·여러 항목으로 흩어진 표를 한 번의 곱셈으로 정리해 보았어요. 하나씩 더하는 것과 견주어 무엇이 좋았는지, 그리고 내 주변에서 이렇게 정리하면 좋을 자료를 하나 들고 그때 곱해야 할 행렬이 어떤 꼴일지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 표가 길어져도 식은 AX 한 줄로 그대로여서 항목이 늘어도 다시 생각할 것이 없었다. 우리 반 일주일 독서 시간을 정리한다면 세로줄이 7개이니 성분이 1/7 인 7×1 행렬을 곱하면 된다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "learn" | "real" | "machine" | "puzzle";

export default function RowSumMeanLab() {
  const [tab, setTab] = useState<Tab>("learn");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🧮 행의 합과 평균을 구하는 행렬</h3>
        <p className="mt-2 leading-7 text-slate-300">
          성분이 모두 <b className="text-sky-200">1</b> 인 열행렬을 곱하면 가로줄이 <b className="text-sky-200">합</b>으로,
          모두 <b className="text-amber-200">1/n</b> 이면 <b className="text-amber-200">평균</b>으로 접혀요. 기계를 직접
          돌려 보고, 실제 표에 써 보고, 앞뒤로 끼워 보고, 지워진 칸까지 되살려 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "learn"} onClick={() => setTab("learn")}>① 합 기계·평균 기계</TabButton>
        <TabButton active={tab === "real"} onClick={() => setTab("real")}>② 실생활 해결</TabButton>
        <TabButton active={tab === "machine"} onClick={() => setTab("machine")}>③ 앞뒤로 끼우기</TabButton>
        <TabButton active={tab === "puzzle"} onClick={() => setTab("puzzle")}>④ 빈칸 탐정</TabButton>
      </div>

      <div className="mt-4">
        {tab === "learn" ? <LearnTab /> : null}
        {tab === "real" ? <RealTab /> : null}
        {tab === "machine" ? <MachineTab /> : null}
        {tab === "puzzle" ? <PuzzleTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3 py-2 text-sm font-bold transition " +
        (active
          ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
//  공용 — 조각 글(한글 + 수식)
// ══════════════════════════════════════════════════════════════
function PieceText({ p }: { p: Piece }) {
  return (
    <>
      {p.pre ? <span>{p.pre}</span> : null}
      {p.tex ? <Katex expr={p.tex} className="mx-0.5" /> : null}
      {p.post ? <span>{p.post}</span> : null}
    </>
  );
}
function PieceLine({ line }: { line: Piece[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-0.5">
      {line.map((p, i) => (
        <PieceText key={i} p={p} />
      ))}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
//  공용 — 행렬 그리기
// ══════════════════════════════════════════════════════════════
type Tone = "base" | "dim" | "a" | "b" | "res" | "row" | "col" | "cross" | "hit" | "miss" | "ghost" | "soft" | "warn";

const CELL_TONE: Record<Tone, string> = {
  base: "border-white/10 bg-white/[0.05] text-slate-100",
  dim: "border-white/5 bg-white/[0.02] text-slate-500",
  a: "border-sky-400/35 bg-sky-400/10 text-sky-100",
  b: "border-amber-400/35 bg-amber-400/10 text-amber-100",
  res: "border-violet-400/35 bg-violet-400/12 text-violet-100",
  row: "border-sky-400/70 bg-sky-400/25 text-sky-50",
  col: "border-amber-400/70 bg-amber-400/25 text-amber-50",
  cross: "border-emerald-400/70 bg-emerald-400/25 text-emerald-50",
  hit: "border-emerald-400/70 bg-emerald-400/20 text-emerald-100",
  miss: "border-rose-400/70 bg-rose-400/20 text-rose-100",
  ghost: "border-dashed border-white/20 bg-white/[0.02] text-slate-500",
  soft: "border-emerald-400/35 bg-emerald-400/10 text-emerald-100",
  warn: "border-rose-400/35 bg-rose-400/10 text-rose-100",
};
const CELL_SIZE: Record<string, string> = {
  sm: "h-8 min-w-[2.1rem] px-1 text-xs",
  md: "h-9 min-w-[2.7rem] px-1.5 text-sm",
  lg: "h-9 min-w-[4.4rem] px-2 text-sm",
};

function Bracket({ side }: { side: "l" | "r" }) {
  return (
    <svg width="9" viewBox="0 0 9 48" preserveAspectRatio="none" className="self-stretch text-slate-400" aria-hidden="true">
      <path
        d={side === "l" ? "M7.5 1 C2.5 12, 2.5 36, 7.5 47" : "M1.5 1 C6.5 12, 6.5 36, 1.5 47"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MatrixView({
  m,
  tones,
  onCell,
  size = "md",
  label,
  texCell,
  fmtCell,
}: {
  m: Mat;
  tones?: Tone[][];
  onCell?: (i: number, j: number) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
  texCell?: (i: number, j: number) => string;
  fmtCell?: (v: number) => string;
}) {
  const cols = colsOf(m);
  return (
    <div className="inline-flex flex-col items-center gap-1">
      {label ? <span className="text-xs font-bold text-slate-400">{label}</span> : null}
      <div className="flex items-stretch gap-1">
        <Bracket side="l" />
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {m.map((row, i) =>
            row.map((v, j) => {
              const tone = tones?.[i]?.[j] ?? "base";
              const cls =
                "flex items-center justify-center rounded-md border font-mono tabular-nums transition " +
                CELL_SIZE[size] +
                " " +
                CELL_TONE[tone];
              const body = texCell ? <Katex expr={texCell(i, j)} /> : <span>{fmtCell ? fmtCell(v) : fmt(v)}</span>;
              if (onCell) {
                return (
                  <button key={`${i}-${j}`} type="button" onClick={() => onCell(i, j)} className={cls + " hover:brightness-125"}>
                    {body}
                  </button>
                );
              }
              return (
                <div key={`${i}-${j}`} className={cls}>
                  {body}
                </div>
              );
            }),
          )}
        </div>
        <Bracket side="r" />
      </div>
    </div>
  );
}

/** 가로·세로 이름표를 두른 행렬 */
function MatrixWithNames({
  m,
  rowNames,
  colNames,
  tones,
  onCell,
  label,
}: {
  m: Mat;
  rowNames: string[];
  colNames: string[];
  tones?: Tone[][];
  onCell?: (i: number, j: number) => void;
  label?: string;
}) {
  return (
    <div className="inline-flex flex-col gap-1">
      {label ? <span className="text-center text-xs font-bold text-slate-400">{label}</span> : null}
      <div className="flex items-start gap-1">
        <div className="flex flex-col gap-1 pt-[22px]">
          {rowNames.map((r) => (
            <span key={r} className="flex h-9 items-center justify-end whitespace-nowrap text-[11px] font-bold text-slate-400">
              {r}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <div className="grid gap-1 pl-[10px]" style={{ gridTemplateColumns: `repeat(${colsOf(m)}, minmax(0, 1fr))` }}>
            {colNames.map((c) => (
              <span key={c} className="whitespace-nowrap text-center text-[11px] font-bold text-slate-400">
                {c}
              </span>
            ))}
          </div>
          <MatrixView m={m} tones={tones} onCell={onCell} />
        </div>
      </div>
    </div>
  );
}

const INPUT_MARK: Record<string, string> = {
  none: "border-white/15 bg-white/[0.06] text-slate-100 focus:border-emerald-400/60",
  right: "border-emerald-400/70 bg-emerald-400/15 text-emerald-100",
  wrong: "border-rose-400/70 bg-rose-400/15 text-rose-100",
};

function MatrixInput({
  values,
  onChange,
  marks,
  wide,
}: {
  values: string[][];
  onChange: (i: number, j: number, v: string) => void;
  marks?: string[][];
  wide?: boolean;
}) {
  const cols = values[0] ? values[0].length : 0;
  return (
    <div className="inline-flex items-stretch gap-1">
      <Bracket side="l" />
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {values.map((row, i) =>
          row.map((v, j) => (
            <input
              key={`${i}-${j}`}
              type="text"
              inputMode="numeric"
              value={v}
              onChange={(e) => onChange(i, j, e.target.value)}
              className={
                "h-9 rounded-md border-2 text-center font-mono text-sm tabular-nums outline-none transition " +
                (wide ? "w-24 " : "w-14 ") +
                INPUT_MARK[marks?.[i]?.[j] ?? "none"]
              }
            />
          )),
        )}
      </div>
      <Bracket side="r" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  공용 — 안내 · 판정 · 보기
// ══════════════════════════════════════════════════════════════
function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-6 text-slate-400">
      💡 {children}
    </p>
  );
}
function GoalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-xs leading-6 text-slate-300">
          <span className="text-slate-500">{ABC[i] ?? "·"}</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
function Verdict({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p
      className={
        "rounded-xl border-l-4 px-3 py-2 text-xs leading-6 " +
        (ok ? "border-emerald-400 bg-emerald-400/[0.08] text-emerald-100" : "border-amber-400 bg-amber-400/[0.08] text-amber-100")
      }
    >
      {ok ? "✅ " : "🤔 "}
      {children}
    </p>
  );
}

type Accent = "sky" | "emerald" | "violet" | "amber";
const ACC_PANEL: Record<Accent, string> = {
  sky: "border-sky-400/25 bg-sky-500/[0.06]",
  emerald: "border-emerald-400/25 bg-emerald-500/[0.06]",
  violet: "border-violet-400/25 bg-violet-500/[0.06]",
  amber: "border-amber-400/25 bg-amber-500/[0.06]",
};
const ACC_BTN: Record<Accent, string> = {
  sky: "border-sky-400/55 bg-sky-400/15 text-sky-100 hover:bg-sky-400/25",
  emerald: "border-emerald-400/55 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25",
  violet: "border-violet-400/55 bg-violet-400/15 text-violet-100 hover:bg-violet-400/25",
  amber: "border-amber-400/55 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25",
};
const ACC_CHIP: Record<Accent, string> = {
  sky: "border-sky-400/60 bg-sky-400/20 text-sky-100",
  emerald: "border-emerald-400/60 bg-emerald-400/20 text-emerald-100",
  violet: "border-violet-400/60 bg-violet-400/20 text-violet-100",
  amber: "border-amber-400/60 bg-amber-400/20 text-amber-100",
};

function ChoiceList({
  options,
  picked,
  graded,
  answer,
  onPick,
  accent,
}: {
  options: Piece[][];
  picked: number | null;
  graded: boolean;
  answer: number;
  onPick: (i: number) => void;
  accent: Accent;
}) {
  return (
    <div className="grid gap-1.5">
      {options.map((line, i) => {
        const right = graded && i === answer;
        const wrong = graded && picked === i && i !== answer;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(i)}
            className={
              "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition " +
              (right
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : wrong
                  ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                  : picked === i
                    ? ACC_CHIP[accent]
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="shrink-0 text-slate-400">{ABC[i]}</span>
            <PieceLine line={line} />
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  공용 — 단계 문제 진행기
// ══════════════════════════════════════════════════════════════
const cleanNum = (s: string): string => s.replace(/[,\s]/g, "");

function stepDone(s: Step, picks: Record<string, number>, fills: Record<string, string[][]>, nums: Record<string, string>): boolean {
  if (s.kind === "choice") return picks[s.id] === s.answer;
  if (s.kind === "num") {
    const raw = cleanNum(nums[s.id] ?? "");
    return raw !== "" && Math.abs(Number(raw) - s.answer) < 1e-9;
  }
  const v = fills[s.id];
  if (!v) return false;
  return s.target.every((row, i) =>
    row.every((t, j) => cleanNum(v[i]?.[j] ?? "") !== "" && Math.abs(Number(cleanNum(v[i][j])) - t) < 1e-9),
  );
}
function blankFill(s: Step): string[][] {
  if (s.kind !== "fill") return [];
  return s.target.map((row) => row.map(() => ""));
}

function StepRunner({ steps, accent, finale }: { steps: Step[]; accent: Accent; finale?: string }) {
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [fills, setFills] = useState<Record<string, string[][]>>({});
  const [nums, setNums] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState<Record<string, boolean>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});

  const s = steps[at];
  const isGraded = graded[s.id] === true;
  const okNow = stepDone(s, picks, fills, nums);
  const clearedCount = steps.filter((z) => graded[z.id] === true && stepDone(z, picks, fills, nums)).length;
  const allClear = clearedCount === steps.length;
  const fillVals = s.kind === "fill" ? (fills[s.id] ?? blankFill(s)) : [];
  const marks =
    s.kind === "fill" && isGraded
      ? s.target.map((row, i) =>
          row.map((t, j) =>
            cleanNum(fillVals[i]?.[j] ?? "") !== "" && Math.abs(Number(cleanNum(fillVals[i][j])) - t) < 1e-9 ? "right" : "wrong",
          ),
        )
      : undefined;
  const wide = s.kind === "fill" && s.target.some((row) => row.some((v) => Math.abs(v) >= 10000));
  const canAnswer =
    s.kind === "choice"
      ? picks[s.id] !== undefined
      : s.kind === "num"
        ? cleanNum(nums[s.id] ?? "") !== ""
        : fillVals.some((row) => row.some((v) => v.trim() !== ""));

  return (
    <div className={"space-y-3 rounded-2xl border p-4 " + ACC_PANEL[accent]}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {steps.map((z, i) => {
            const cleared = graded[z.id] === true && stepDone(z, picks, fills, nums);
            const open = i === 0 || (graded[steps[i - 1].id] === true && stepDone(steps[i - 1], picks, fills, nums));
            return (
              <button
                key={z.id}
                type="button"
                disabled={!open}
                onClick={() => setAt(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition disabled:opacity-35 " +
                  (i === at
                    ? ACC_CHIP[accent]
                    : cleared
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {cleared ? "✅ " : ""}
                {i + 1}단계
              </button>
            );
          })}
        </div>
        <span className="font-mono text-xs text-slate-400">
          해결 {clearedCount} / {steps.length}
        </span>
      </div>

      <p className="text-sm font-bold leading-6 text-slate-100">{s.ask}</p>

      {s.mats?.length ? (
        <div className="flex flex-wrap items-end gap-x-5 gap-y-2 overflow-x-auto overflow-y-hidden py-1">
          {s.mats.map((z, i) => (
            <MatrixView key={i} m={z.m} label={z.label} tones={z.m.map((row) => row.map(() => (i === 0 ? "a" : "b")))} />
          ))}
        </div>
      ) : null}

      {s.kind === "choice" ? (
        <ChoiceList
          options={s.options}
          picked={picks[s.id] ?? null}
          graded={isGraded}
          answer={s.answer}
          accent={accent}
          onPick={(i) => {
            setPicks((z) => ({ ...z, [s.id]: i }));
            setGraded((z) => ({ ...z, [s.id]: false }));
          }}
        />
      ) : null}

      {s.kind === "fill" ? (
        <div className="overflow-x-auto overflow-y-hidden py-1">
          <MatrixInput
            values={fillVals}
            marks={marks}
            wide={wide}
            onChange={(i, j, v) => {
              setFills((z) => {
                const cur = z[s.id] ?? blankFill(s);
                const next = cur.map((row) => [...row]);
                next[i][j] = v;
                return { ...z, [s.id]: next };
              });
              setGraded((z) => ({ ...z, [s.id]: false }));
            }}
          />
          {s.unit ? <span className="ml-2 text-xs text-slate-400">단위 {s.unit}</span> : null}
        </div>
      ) : null}

      {s.kind === "num" ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={nums[s.id] ?? ""}
            onChange={(e) => {
              setNums((z) => ({ ...z, [s.id]: e.target.value }));
              setGraded((z) => ({ ...z, [s.id]: false }));
            }}
            className={
              "h-10 w-40 rounded-xl border-2 px-3 text-center font-mono text-sm tabular-nums outline-none transition " +
              INPUT_MARK[isGraded ? (okNow ? "right" : "wrong") : "none"]
            }
          />
          {s.unit ? <span className="text-sm font-bold text-slate-300">{s.unit}</span> : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canAnswer}
          onClick={() => setGraded((z) => ({ ...z, [s.id]: true }))}
          className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN[accent]}
        >
          확인
        </button>
        {s.hint ? (
          <button
            type="button"
            onClick={() => setHints((z) => ({ ...z, [s.id]: !z[s.id] }))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            💡 힌트
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setGraded((z) => ({ ...z, [s.id]: false }))}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          ↩️ 다시
        </button>
        {isGraded && okNow && at < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setAt(at + 1)}
            className="rounded-lg border-2 border-emerald-400/55 bg-emerald-400/15 px-4 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/25"
          >
            다음 단계 →
          </button>
        ) : null}
      </div>

      {hints[s.id] && s.hint ? <TipBox>{s.hint}</TipBox> : null}

      <div className="min-h-[38px]">
        {isGraded && okNow ? (
          <Verdict ok>{s.done ?? "정답이에요!"}</Verdict>
        ) : isGraded && s.kind === "choice" ? (
          <Verdict ok={false}>{s.explains[picks[s.id] ?? 0]}</Verdict>
        ) : isGraded && s.kind === "fill" ? (
          <Verdict ok={false}>빨간 칸을 다시 계산해 보세요. 가로줄 하나씩 따로 보면 돼요.</Verdict>
        ) : isGraded ? (
          <Verdict ok={false}>아직 맞지 않아요. 숫자를 다시 한 번 확인해 보세요.</Verdict>
        ) : null}
      </div>

      {allClear && finale ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3 text-center">
          <p className="text-sm font-bold text-emerald-100">🎉 모두 해결했어요!</p>
          <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-slate-200">{finale}</p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 합 기계 · 평균 기계
// ══════════════════════════════════════════════════════════════
const KIND_BADGE: Record<string, string> = {
  sum: "border-sky-400/60 bg-sky-400/20 text-sky-100",
  mean: "border-amber-400/60 bg-amber-400/20 text-amber-100",
  other: "border-white/10 bg-white/5 text-slate-300",
};

function LearnTab() {
  const [mi, setMi] = useState(0);
  const [ci, setCi] = useState(C_START);
  const [row, setRow] = useState<number | null>(null);

  const lab = LAB_MATS[mi];
  const A = lab.m;
  const n = colsOf(A);
  const c = C_CHIPS[ci];
  const v = cVal(c);
  const X = fillM(n, 1, v);
  const R = mulM(A, X);
  const kind = machineKind(A, c);
  const pick = row !== null && row < rowsOf(A) ? row : null;

  const aTones: Tone[][] = A.map((r, i) => r.map(() => (pick === i ? "row" : "a")));
  const xTones: Tone[][] = X.map((r) => r.map(() => "b"));
  const rTones: Tone[][] = R.map((r, i) => r.map(() => (pick === i ? "cross" : "res")));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-500/[0.07] to-amber-500/[0.04] p-4">
        <p className="text-sm font-bold text-sky-200">⚙️ 오른쪽에 끼울 수를 바꿔 보세요</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] font-bold text-slate-400">행렬 고르기</p>
            <div className="flex flex-wrap gap-1.5">
              {LAB_MATS.map((z, i) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => {
                    setMi(i);
                    setRow(null);
                  }}
                  className={
                    "rounded-lg border-2 px-3 py-1.5 text-sm font-bold transition " +
                    (mi === i ? "border-sky-400/60 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  {z.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">{lab.caption}</p>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-bold text-slate-400">열행렬에 넣을 수</p>
            <div className="flex flex-wrap gap-1.5">
              {C_CHIPS.map((z, i) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setCi(i)}
                  className={
                    "rounded-lg border-2 px-3 py-1.5 text-base font-bold transition " +
                    (ci === i ? "border-amber-400/60 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  <Katex expr={z.tex} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
            <span className={"rounded-lg border-2 px-3 py-1 text-xs font-bold " + KIND_BADGE[kind]}>
              {kind === "sum" ? "🧺 합을 구하는 기계" : kind === "mean" ? "⚖️ 평균을 구하는 기계" : "🔧 합의 " + fmt(v) + "배"}
            </span>
            {kind === "mean" ? (
              <span className="text-[11px] text-slate-400">세로줄이 {n}개이니 {n}로 나눈 셈이에요</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-2 overflow-x-auto overflow-y-hidden py-1">
            <MatrixView m={A} tones={aTones} label="A" onCell={(i) => setRow(i)} />
            <span className="pb-3 text-xl font-bold text-slate-300">·</span>
            <MatrixView m={X} tones={xTones} label={kind === "mean" ? "Y" : "X"} texCell={() => c.tex} />
            <span className="pb-3 text-xl font-bold text-slate-300">=</span>
            <MatrixView m={R} tones={rTones} label="결과" onCell={(i) => setRow(i)} />
          </div>

          <div className="mt-2 min-h-[40px] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            {pick !== null ? (
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={`${foldTex(A[pick], c.tex)} = ${fmt(R[pick][0])}`} className="whitespace-nowrap text-base text-slate-100" />
              </div>
            ) : (
              <p className="text-[11px] leading-5 text-slate-400">
                왼쪽 행렬의 가로줄이나 결과의 칸을 눌러 보세요. 그 줄이 어떻게 수 하나로 접히는지 보여 줘요.
              </p>
            )}
          </div>
        </div>

        <div className="mt-2">
          <GoalList
            items={[
              "끼운 수가 1 이면 결과는 그 가로줄의 합이에요.",
              "끼운 수가 세로줄 개수의 역수이면 결과는 평균이에요.",
              "그 밖의 수를 끼우면 합에 그 수를 곱한 값이 나와요.",
              "행렬을 바꾸면 평균이 되는 수도 함께 바뀌어요. 세로줄 개수를 보세요.",
            ]}
          />
        </div>
      </div>

      <StepRunner steps={LEARN_STEPS} accent="sky" finale="합 기계와 평균 기계를 익혔어요. 이제 진짜 표에 써 볼 차례예요!" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 실생활
// ══════════════════════════════════════════════════════════════
const TABLE_TONE: Record<string, string> = {
  sky: "border-sky-400/30",
  amber: "border-amber-400/30",
  rose: "border-rose-400/30",
  violet: "border-violet-400/30",
  emerald: "border-emerald-400/30",
};
const TABLE_HEAD: Record<string, string> = {
  sky: "bg-sky-400/[0.14] text-sky-100",
  amber: "bg-amber-400/[0.14] text-amber-100",
  rose: "bg-rose-400/[0.14] text-rose-100",
  violet: "bg-violet-400/[0.14] text-violet-100",
  emerald: "bg-emerald-400/[0.14] text-emerald-100",
};
const TABLE_CELL_TONE: Record<string, Tone> = {
  sky: "a",
  amber: "b",
  rose: "warn",
  violet: "res",
  emerald: "soft",
};

function DataTable({ t, showMat }: { t: TableDef; showMat: boolean }) {
  return (
    <div className={"rounded-xl border bg-slate-900/50 p-2 " + TABLE_TONE[t.tone]}>
      <p className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-300">
        <span className={"rounded-md px-1.5 py-0.5 text-xs " + TABLE_HEAD[t.tone]}>
          <Katex expr={t.sym} />
        </span>
        <span>{t.caption}</span>
        {t.unit ? <span className="font-normal text-slate-500">(단위 {t.unit})</span> : null}
      </p>
      <div className="overflow-x-auto overflow-y-hidden py-1">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-white/10 px-2 py-1">
                <span className="block text-right text-[9px] leading-3 text-slate-500">{t.cornerCol}</span>
                <span className="block text-left text-[9px] leading-3 text-slate-500">{t.cornerRow}</span>
              </th>
              {t.colLabels.map((c) => (
                <th key={c} className={"whitespace-nowrap border border-white/10 px-2.5 py-1 text-[11px] font-bold " + TABLE_HEAD[t.tone]}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rowLabels.map((r, i) => (
              <tr key={r}>
                <th className={"whitespace-nowrap border border-white/10 px-2.5 py-1 text-[11px] font-bold " + TABLE_HEAD[t.tone]}>{r}</th>
                {t.m[i].map((v, j) => (
                  <td key={j} className="border border-white/10 px-2.5 py-1 text-right font-mono tabular-nums text-slate-100">
                    {won(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMat ? (
        <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
          <Katex expr={`${t.sym} =`} className="shrink-0 text-sm text-slate-200" />
          <div className="overflow-x-auto overflow-y-hidden py-1">
            <MatrixView m={t.m} size="sm" fmtCell={won} tones={t.m.map((row) => row.map(() => TABLE_CELL_TONE[t.tone]))} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RealTab() {
  const [si, setSi] = useState(0);
  const [showMat, setShowMat] = useState(true);
  const sc = SCENES[si];
  const n = colsOf(sc.table.m);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {SCENES.map((z, i) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setSi(i)}
            className={
              "rounded-lg border px-2.5 py-1.5 text-xs font-bold transition " +
              (si === i ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {z.emoji} {z.title}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-lg font-bold text-slate-100">
          {sc.emoji} {sc.title}
        </p>
        <p className="mt-1 text-xs leading-6 text-slate-300">{sc.lead}</p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] leading-5 text-slate-400">
            가로줄 하나에 수가 <b className="text-amber-200">{n}개</b> 씩 있어요. 합은{" "}
            <Katex expr="1" className="text-amber-200" /> 을, 평균은 <Katex expr={`\\frac{1}{${n}}`} className="text-amber-200" /> 을
            끼우면 돼요.
          </p>
          <button
            type="button"
            onClick={() => setShowMat(!showMat)}
            className={
              "shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition " +
              (showMat ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {showMat ? "🔢 행렬 숨기기" : "🔢 행렬로 보기"}
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-start gap-3">
          <DataTable t={sc.table} showMat={showMat} />
        </div>
      </div>

      <StepRunner key={sc.id} steps={sc.steps} accent="emerald" finale={sc.wrap} />

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">{REAL_NOTE}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 앞뒤로 끼우기
// ══════════════════════════════════════════════════════════════
const SLOT_NAME: Record<Slot, string> = { none: "끼우지 않음", ones: "모두 1", inv: "개수의 역수" };
const GM = rowsOf(GRADE);
const GN = colsOf(GRADE);
const LEFT_TEX: Record<Slot, string> = { none: "", ones: "1", inv: `\\frac{1}{${GM}}` };
const RIGHT_TEX: Record<Slot, string> = { none: "", ones: "1", inv: `\\frac{1}{${GN}}` };

function SlotPicker({
  title,
  value,
  onPick,
  texOf,
  accent,
}: {
  title: string;
  value: Slot;
  onPick: (s: Slot) => void;
  texOf: Record<Slot, string>;
  accent: Accent;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold text-slate-400">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {SLOTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className={
              "flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-xs font-bold transition " +
              (value === s ? ACC_CHIP[accent] : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            {texOf[s] ? <Katex expr={texOf[s]} /> : null}
            <span>{SLOT_NAME[s]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MachineTab() {
  const [left, setLeft] = useState<Slot>("none");
  const [right, setRight] = useState<Slot>("none");
  const [msi, setMsi] = useState(0);
  const [cleared, setCleared] = useState<Record<string, boolean>>({});

  const R = machineResult(GRADE, left, right);
  const label = MACHINE_LABEL[`${left}|${right}`];
  const ms = MISSIONS[msi];
  const hit = missionDone(ms, left, right);

  const resRows = left === "none" ? GRADE_ROWS : ["합계"];
  const resCols = right === "none" ? GRADE_COLS : ["결과"];
  const doneCount = MISSIONS.filter((z) => cleared[z.id] === true).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.07] to-sky-500/[0.04] p-4">
        <p className="text-sm font-bold text-violet-200">🔀 왼쪽·오른쪽 슬롯에 끼워 보세요</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-400">
          세 반이 네 과목을 본 성적표예요. 오른쪽에 끼우면 가로줄(반)이, 왼쪽에 끼우면 세로줄(과목)이 하나로 접혀요.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <SlotPicker title="왼쪽 슬롯 (1×3 행행렬)" value={left} onPick={setLeft} texOf={LEFT_TEX} accent="violet" />
          <SlotPicker title="오른쪽 슬롯 (4×1 열행렬)" value={right} onPick={setRight} texOf={RIGHT_TEX} accent="violet" />
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 p-3">
          <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-3 overflow-x-auto overflow-y-hidden py-1">
            {left !== "none" ? (
              <MatrixView
                m={fillM(1, GM, 1)}
                label="왼쪽"
                tones={[Array.from({ length: GM }, () => "b" as Tone)]}
                texCell={() => LEFT_TEX[left]}
              />
            ) : null}
            {left !== "none" ? <span className="pb-3 text-xl font-bold text-slate-300">·</span> : null}
            <MatrixWithNames m={GRADE} rowNames={GRADE_ROWS} colNames={GRADE_COLS} label="성적표 G" tones={GRADE.map((r) => r.map(() => "a"))} />
            {right !== "none" ? <span className="pb-3 text-xl font-bold text-slate-300">·</span> : null}
            {right !== "none" ? (
              <MatrixView
                m={fillM(GN, 1, 1)}
                label="오른쪽"
                tones={Array.from({ length: GN }, () => ["b" as Tone])}
                texCell={() => RIGHT_TEX[right]}
              />
            ) : null}
            <span className="pb-3 text-xl font-bold text-slate-300">=</span>
            <MatrixWithNames
              m={R}
              rowNames={resRows.slice(0, rowsOf(R))}
              colNames={resCols.slice(0, colsOf(R))}
              label="결과"
              tones={R.map((r) => r.map(() => "cross"))}
            />
          </div>

          <p className="mt-2 text-center text-sm font-bold text-emerald-200">
            📌 {label} <span className="font-mono text-xs text-slate-400">({rowsOf(R)}×{colsOf(R)})</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-amber-200">🎯 미션 — 목표에 맞게 슬롯을 맞춰 보세요</p>
          <span className="font-mono text-xs text-slate-300">
            해결 {doneCount} / {MISSIONS.length}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {MISSIONS.map((z, i) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setMsi(i)}
              className={
                "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                (msi === i
                  ? "border-amber-400/60 bg-amber-400/20 text-amber-100"
                  : cleared[z.id] === true
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {cleared[z.id] === true ? "✅ " : ""}
              {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-xl border-2 border-amber-400/40 bg-amber-400/10 px-3 py-3 text-center">
          <p className="text-xs text-slate-300">{ms.emoji} 목표</p>
          <p className="mt-1 text-lg font-bold text-amber-100">{ms.goal}</p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCleared((z) => ({ ...z, [ms.id]: hit }))}
            className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition " + ACC_BTN.amber}
          >
            지금 설정으로 확인
          </button>
          {cleared[ms.id] === true && msi < MISSIONS.length - 1 ? (
            <button
              type="button"
              onClick={() => setMsi(msi + 1)}
              className="rounded-lg border-2 border-emerald-400/55 bg-emerald-400/15 px-4 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/25"
            >
              다음 미션 →
            </button>
          ) : null}
        </div>

        <div className="mt-2 min-h-[38px]">
          {cleared[ms.id] === true ? (
            <Verdict ok>지금 설정은 {label} 이에요. 목표를 이뤘습니다!</Verdict>
          ) : (
            <TipBox>{ms.hint}</TipBox>
          )}
        </div>

        {doneCount === MISSIONS.length ? (
          <div className="mt-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3 text-center">
            <p className="text-sm font-bold text-emerald-100">🏆 여섯 미션을 모두 이뤘어요!</p>
            <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-slate-200">
              오른쪽은 가로줄, 왼쪽은 세로줄, 양쪽은 수 하나. 끼우는 수가 1 이면 합, 개수의 역수면 평균이에요.
            </p>
          </div>
        ) : null}
      </div>

      <StepRunner steps={MACHINE_STEPS} accent="violet" finale="접는 방향까지 손에 익었어요. 마지막은 거꾸로 되짚는 퍼즐이에요!" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 빈칸 탐정
// ══════════════════════════════════════════════════════════════
function PuzzleBoard({
  p,
  vals,
  onChange,
  graded,
}: {
  p: Puzzle;
  vals: Record<string, string>;
  onChange: (i: number, j: number, v: string) => void;
  graded: boolean;
}) {
  const n = colsOf(p.m);
  const side = sideValues(p);
  const cs = colSums(p.m);
  const isBlank = (i: number, j: number) => p.blanks.some((b) => b.i === i && b.j === j);

  return (
    <div className="overflow-x-auto overflow-y-hidden py-1">
      <div className="inline-flex flex-col gap-1">
        <div className="flex items-stretch gap-1">
          <Bracket side="l" />
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {p.m.map((row, i) =>
              row.map((v, j) => {
                if (!isBlank(i, j)) {
                  return (
                    <div
                      key={`${i}-${j}`}
                      className={"flex h-9 min-w-[2.7rem] items-center justify-center rounded-md border px-1.5 font-mono text-sm tabular-nums " + CELL_TONE.base}
                    >
                      {v}
                    </div>
                  );
                }
                const raw = vals[`${i},${j}`] ?? "";
                const mark = !graded ? "none" : cleanNum(raw) !== "" && Number(cleanNum(raw)) === v ? "right" : "wrong";
                return (
                  <input
                    key={`${i}-${j}`}
                    type="text"
                    inputMode="numeric"
                    value={raw}
                    onChange={(e) => onChange(i, j, e.target.value)}
                    className={
                      "h-9 w-[2.7rem] rounded-md border-2 text-center font-mono text-sm tabular-nums outline-none transition " + INPUT_MARK[mark]
                    }
                  />
                );
              }),
            )}
          </div>
          <Bracket side="r" />

          <div className="ml-2 flex flex-col justify-center gap-1">
            <span className="mb-0.5 text-center text-[10px] font-bold text-amber-300">{p.side === "mean" ? "평균" : "가로 합"}</span>
            {side.map((z, i) => (
              <span
                key={i}
                className={
                  "flex h-9 min-w-[3rem] items-center justify-center rounded-md border px-2 font-mono text-sm tabular-nums " +
                  (z === null ? "border-dashed border-white/20 bg-white/[0.02] text-slate-500" : "border-amber-400/50 bg-amber-400/15 text-amber-100")
                }
              >
                {z === null ? "?" : fmt(z)}
              </span>
            ))}
          </div>
        </div>

        {p.showColSum ? (
          <div className="flex items-start gap-1">
            <span className="w-[9px]" />
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {cs.map((z, j) => (
                <span
                  key={j}
                  className="flex h-8 min-w-[2.7rem] items-center justify-center rounded-md border border-sky-400/50 bg-sky-400/15 px-1.5 font-mono text-xs tabular-nums text-sky-100"
                >
                  {z}
                </span>
              ))}
            </div>
            <span className="w-[9px]" />
            <span className="ml-2 self-center text-[10px] font-bold text-sky-300">세로 합</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PuzzleTab() {
  const [pi, setPi] = useState(0);
  const [vals, setVals] = useState<Record<string, Record<string, string>>>({});
  const [graded, setGraded] = useState<Record<string, boolean>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});

  const p = PUZZLES[pi];
  const cur = vals[p.id] ?? {};
  const isGraded = graded[p.id] === true;
  const solved = (z: Puzzle) => {
    const v = vals[z.id] ?? {};
    return z.blanks.every((b) => {
      const raw = cleanNum(v[`${b.i},${b.j}`] ?? "");
      return raw !== "" && Number(raw) === z.m[b.i][b.j];
    });
  };
  const okNow = solved(p);
  const clearedCount = PUZZLES.filter((z) => graded[z.id] === true && solved(z)).length;
  const filledAny = p.blanks.some((b) => (cur[`${b.i},${b.j}`] ?? "").trim() !== "");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.07] to-sky-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-emerald-200">🔎 지워진 칸을 되살려 보세요</p>
          <span className="font-mono text-xs text-slate-300">
            해결 {clearedCount} / {PUZZLES.length}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {PUZZLES.map((z, i) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setPi(i)}
              className={
                "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                (pi === i
                  ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100"
                  : graded[z.id] === true && solved(z)
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {graded[z.id] === true && solved(z) ? "✅ " : ""}
              {z.emoji} {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 p-3">
          <p className="text-sm font-bold text-slate-100">
            {p.emoji} {p.title}
          </p>
          <p className="mt-1 text-xs leading-6 text-slate-300">{p.story}</p>

          <div className="mt-3">
            <PuzzleBoard
              p={p}
              vals={cur}
              graded={isGraded}
              onChange={(i, j, v) => {
                setVals((z) => ({ ...z, [p.id]: { ...(z[p.id] ?? {}), [`${i},${j}`]: v } }));
                setGraded((z) => ({ ...z, [p.id]: false }));
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!filledAny}
              onClick={() => setGraded((z) => ({ ...z, [p.id]: true }))}
              className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.emerald}
            >
              확인
            </button>
            <button
              type="button"
              onClick={() => setHints((z) => ({ ...z, [p.id]: !z[p.id] }))}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              💡 힌트
            </button>
            <button
              type="button"
              onClick={() => {
                setVals((z) => ({ ...z, [p.id]: {} }));
                setGraded((z) => ({ ...z, [p.id]: false }));
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↩️ 다시
            </button>
            {isGraded && okNow && pi < PUZZLES.length - 1 ? (
              <button
                type="button"
                onClick={() => setPi(pi + 1)}
                className="rounded-lg border-2 border-emerald-400/55 bg-emerald-400/15 px-4 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/25"
              >
                다음 퍼즐 →
              </button>
            ) : null}
          </div>

          {hints[p.id] ? (
            <div className="mt-2">
              <TipBox>{p.hint}</TipBox>
            </div>
          ) : null}

          <div className="mt-2 min-h-[38px]">
            {isGraded && okNow ? (
              <Verdict ok>
                모두 맞혔어요! 지워진 칸도 가로 합{p.showColSum ? "과 세로 합" : ""}만 있으면 되살릴 수 있어요.
              </Verdict>
            ) : isGraded ? (
              <Verdict ok={false}>
                빨간 칸을 다시 보세요.{" "}
                {p.side === "mean" ? "평균에 세로줄 개수를 곱하면 그 줄의 합이에요." : "가로줄의 합에서 남아 있는 수들을 빼면 돼요."}
              </Verdict>
            ) : null}
          </div>
        </div>
      </div>

      {clearedCount === PUZZLES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🏆 다섯 퍼즐을 모두 풀었어요!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">
            합과 평균은 표를 줄여 주기만 하는 것이 아니라, 거꾸로 사라진 값을 되찾는 단서가 되기도 해요.
          </p>
        </div>
      ) : null}

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">{REAL_NOTE}</p>
    </div>
  );
}
