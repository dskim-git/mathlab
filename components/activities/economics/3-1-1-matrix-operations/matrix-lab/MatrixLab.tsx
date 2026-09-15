"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  ADD_STEPS,
  BUYER_NAMES,
  HUNTS,
  HUNT_MAT,
  ITEM_NAMES,
  K_MAX,
  K_MIN,
  K_START,
  LAB_A2,
  LAB_A3,
  LAB_B2,
  LAB_B3,
  LAB_OPS,
  MUL_STEPS,
  NC_A,
  NC_AB,
  NC_B,
  NC_BA,
  REAL_NOTE,
  SCENES,
  SHAPE_PUZZLES,
  SHEET1,
  SHEET2,
  SHEET2_STEPS,
  SHEET_COLS,
  SHEET_ROWS,
  SHEET_TIPS,
  SIZE_MAX,
  SIZE_MIN,
  SIZE_START,
  STORE_NAMES,
  TERM_QUIZ,
  VIS_A,
  VIS_AB,
  VIS_B,
  cellName,
  colName,
  colsOf,
  combM,
  fmt,
  mulTerms,
  rangeName,
  rowsOf,
  shapeOk,
  shapeOptions,
  shapeTex,
  sumProdTex,
  won,
  type Mat,
  type Piece,
  type SheetDef,
  type Step,
  type TableDef,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "shape",
    prompt:
      "행렬은 표를 괄호로 묶어 놓은 것처럼 생겼어요. 표를 행렬로 옮겨 적으면 무엇이 편해지는지, 그리고 더하거나 뺄 때 '꼴이 같아야 한다'는 조건이 왜 필요한지 자기 말로 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 지점과 품목이 늘어나도 계산 방법은 그대로여서 한 줄로 적을 수 있다. 꼴이 다르면 짝이 없는 자리가 생겨 어느 수와 더해야 할지 정할 수 없다.",
  },
  {
    id: "mul",
    prompt:
      "행렬의 곱셈만 같은 자리끼리 하지 않고 '가로줄과 세로줄'을 곱해 더했어요. 왜 그렇게 정하는 것이 쓸모 있는지, 그리고 순서를 바꾸면 무엇이 달라지는지 예를 들어 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 수량의 가로줄과 값의 세로줄을 곱해 더하면 그것이 바로 총액이 되기 때문이다. AB 와 BA 를 계산해 보니 값이 아예 달랐고, 꼴이 맞지 않아 곱이 안 되는 경우도 있었다.",
  },
  {
    id: "use",
    prompt:
      "스프레드시트로 행렬의 곱을 구해 보고, 실생활 문제도 풀어 보았어요. 사람이 하나씩 계산하는 것과 견주어 무엇이 좋았는지, 그리고 내 주변에서 행렬로 정리하면 좋을 자료를 하나 들어 보세요.",
    kind: "text",
    placeholder:
      "예: 아홉 가지 경우를 한 번에 구해 놓고 견줄 수 있어 어디가 가장 유리한지 바로 보였다. 동아리별 대회 참가비나 급식 재료 주문량도 행렬로 정리하면 좋겠다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "terms" | "add" | "mul" | "sheet" | "real";

export default function MatrixLab() {
  const [tab, setTab] = useState<Tab>("terms");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🔢 행렬의 연산과 활용</h3>
        <p className="mt-2 leading-7 text-slate-300">
          표를 괄호로 묶으면 <b className="text-sky-200">행렬</b>이 돼요. 더하고 빼고 몇 배 하는 일은 자리끼리,{" "}
          <b className="text-violet-200">곱셈</b>만은 가로줄과 세로줄로. 직접 눌러 보고, 스프레드시트로 계산해 보고,
          마지막에는 실제 상황을 풀어 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "terms"} onClick={() => setTab("terms")}>① 행렬 읽기</TabButton>
        <TabButton active={tab === "add"} onClick={() => setTab("add")}>② 더하기·빼기·몇 배</TabButton>
        <TabButton active={tab === "mul"} onClick={() => setTab("mul")}>③ 곱셈의 비밀</TabButton>
        <TabButton active={tab === "sheet"} onClick={() => setTab("sheet")}>④ 스프레드시트</TabButton>
        <TabButton active={tab === "real"} onClick={() => setTab("real")}>⑤ 실생활 해결</TabButton>
      </div>

      <div className="mt-4">
        {tab === "terms" ? <TermsTab /> : null}
        {tab === "add" ? <AddTab /> : null}
        {tab === "mul" ? <MulTab /> : null}
        {tab === "sheet" ? <SheetTab /> : null}
        {tab === "real" ? <RealTab /> : null}
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
  hideValues,
}: {
  m: Mat;
  tones?: Tone[][];
  onCell?: (i: number, j: number) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
  texCell?: (i: number, j: number) => string;
  fmtCell?: (v: number) => string;
  hideValues?: boolean[][];
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
              const body = texCell ? (
                <Katex expr={texCell(i, j)} />
              ) : hideValues?.[i]?.[j] ? (
                <span className="text-slate-500">?</span>
              ) : (
                <span>{fmtCell ? fmtCell(v) : String(v)}</span>
              );
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
    return raw !== "" && Number(raw) === s.answer;
  }
  const v = fills[s.id];
  if (!v) return false;
  return s.target.every((row, i) => row.every((t, j) => cleanNum(v[i]?.[j] ?? "") !== "" && Number(cleanNum(v[i][j])) === t));
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
      ? s.target.map((row, i) => row.map((t, j) => (cleanNum(fillVals[i]?.[j] ?? "") !== "" && Number(cleanNum(fillVals[i][j])) === t ? "right" : "wrong")))
      : undefined;
  const wide = s.kind === "fill" && s.target.some((row) => row.some((v) => Math.abs(v) >= 10000));
  const canAnswer =
    s.kind === "choice" ? picks[s.id] !== undefined : s.kind === "num" ? cleanNum(nums[s.id] ?? "") !== "" : fillVals.some((row) => row.some((v) => v.trim() !== ""));

  const reset = () => {
    setGraded((z) => ({ ...z, [s.id]: false }));
  };

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
          onClick={reset}
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
          <Verdict ok={false}>빨간 칸을 다시 계산해 보세요. 같은 자리끼리만 맞춰 보면 돼요.</Verdict>
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
//  탭 ① 행렬 읽기
// ══════════════════════════════════════════════════════════════
const TERM_STEPS: Step[] = TERM_QUIZ.map((q) => ({ ...q, kind: "choice" as const }));

function TermsTab() {
  const [rows, setRows] = useState(SIZE_START.m);
  const [cols, setCols] = useState(SIZE_START.n);
  const [sel, setSel] = useState<{ i: number; j: number } | null>(null);
  const [found, setFound] = useState(0);
  const [miss, setMiss] = useState<{ i: number; j: number } | null>(null);

  const grid: Mat = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  const pick = sel && sel.i < rows && sel.j < cols ? sel : null;
  const tones: Tone[][] = grid.map((row, i) =>
    row.map((_, j) => (!pick ? "base" : i === pick.i && j === pick.j ? "cross" : i === pick.i ? "row" : j === pick.j ? "col" : "dim")),
  );

  const hunt = HUNTS[found];
  const huntTones: Tone[][] = HUNT_MAT.map((row, i) =>
    row.map((_, j) => {
      if (miss && miss.i === i && miss.j === j) return "miss";
      if (HUNTS.slice(0, found).some((h) => h.i === i + 1 && h.j === j + 1)) return "hit";
      return "base";
    }),
  );

  return (
    <div className="space-y-4">
      {/* 크기 실험실 */}
      <div className="rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-500/[0.07] to-cyan-500/[0.04] p-4">
        <p className="text-sm font-bold text-sky-200">📐 손잡이를 움직여 행렬의 꼴을 바꿔 보세요</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="space-y-3">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-300">가로줄(행)의 개수</span>
                <span className="font-mono text-sm text-sky-200">{rows}</span>
              </div>
              <input
                type="range"
                min={SIZE_MIN}
                max={SIZE_MAX}
                step={1}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="mt-1 w-full accent-sky-400"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-300">세로줄(열)의 개수</span>
                <span className="font-mono text-sm text-amber-200">{cols}</span>
              </div>
              <input
                type="range"
                min={SIZE_MIN}
                max={SIZE_MAX}
                step={1}
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="mt-1 w-full accent-amber-400"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-lg border border-sky-400/40 bg-sky-400/10 px-2.5 py-1 text-xs font-bold text-sky-100">
                <Katex expr={shapeTex(rows, cols)} /> 행렬
              </span>
              <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-200">
                성분 {rows * cols}개
              </span>
              <span
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold " +
                  (rows === cols
                    ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
                    : "border-white/10 bg-white/5 text-slate-400")
                }
              >
                {rows === cols ? `${rows}차 정사각행렬` : "정사각행렬 아님"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="overflow-x-auto overflow-y-hidden py-1">
              <MatrixView m={grid} tones={tones} texCell={(i, j) => `a_{${i + 1}${j + 1}}`} onCell={(i, j) => setSel({ i, j })} />
            </div>
            <p className="min-h-[34px] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-5 text-slate-400">
              {pick ? (
                <>
                  파란 줄이 <b className="text-sky-200">제{pick.i + 1}행</b>, 노란 줄이{" "}
                  <b className="text-amber-200">제{pick.j + 1}열</b>이에요. 둘이 만나는 초록 칸이 (
                  {pick.i + 1}, {pick.j + 1}) 성분입니다.
                </>
              ) : (
                "성분을 하나 눌러 보세요. 그 성분이 몇 번째 행, 몇 번째 열에 있는지 색으로 알려 줘요."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 성분 사냥 */}
      <div className="rounded-2xl border border-violet-400/25 bg-violet-500/[0.06] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🎯 성분 사냥 — 말하는 자리의 성분을 눌러 보세요</p>
          <span className="font-mono text-xs text-slate-300">
            {found} / {HUNTS.length}
          </span>
        </div>
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
          <div className="overflow-x-auto overflow-y-hidden py-1">
            <MatrixView
              m={HUNT_MAT}
              tones={huntTones}
              onCell={(i, j) => {
                if (found >= HUNTS.length) return;
                const h = HUNTS[found];
                if (h.i === i + 1 && h.j === j + 1) {
                  setFound(found + 1);
                  setMiss(null);
                } else {
                  setMiss({ i, j });
                }
              }}
            />
          </div>
          <div className="space-y-2">
            {found < HUNTS.length ? (
              <div className="rounded-xl border-2 border-violet-400/45 bg-violet-400/10 px-3 py-3 text-center">
                <p className="text-xs text-slate-300">찾을 성분</p>
                <p className="mt-1 text-xl font-bold text-violet-100">
                  제{hunt.i}행 제{hunt.j}열
                </p>
                <p className="mt-1 font-mono text-xs text-slate-400">
                  ( {hunt.i}, {hunt.j} ) 성분
                </p>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-emerald-400/45 bg-emerald-400/10 px-3 py-4 text-center">
                <p className="text-lg font-bold text-emerald-100">🏆 여섯 자리 모두 찾았어요!</p>
                <p className="mt-1 text-xs leading-5 text-slate-200">앞의 수가 가로줄, 뒤의 수가 세로줄이라는 것을 잊지 마세요.</p>
              </div>
            )}
            {miss ? (
              <Verdict ok={false}>
                거기는 ({miss.i + 1}, {miss.j + 1}) 성분이에요. 앞의 수가 가로줄, 뒤의 수가 세로줄이에요.
              </Verdict>
            ) : (
              <TipBox>(i, j) 성분은 제i행과 제j열이 만나는 자리예요.</TipBox>
            )}
            {found > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setFound(0);
                  setMiss(null);
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                ↩️ 처음부터
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 용어 퀴즈 */}
      <StepRunner steps={TERM_STEPS} accent="sky" finale="행렬을 읽는 말은 모두 익혔어요. 이제 계산으로 넘어가요!" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 더하기·빼기·몇 배
// ══════════════════════════════════════════════════════════════
const wrapNum = (v: number): string => (v < 0 ? `(${v})` : `${v}`);
function coefTermTex(c: number, v: number): string {
  if (c === 1) return wrapNum(v);
  if (c === -1) return `-${wrapNum(v)}`;
  return `${fmt(c)} \\cdot ${wrapNum(v)}`;
}
function cellCalcTex(p: number, a: number, q: number, b: number): string {
  if (q === 0) return `${coefTermTex(p, a)} = ${p * a}`;
  const tail = q > 0 ? ` + ${coefTermTex(q, b)}` : ` - ${coefTermTex(-q, b)}`;
  return `${coefTermTex(p, a)}${tail} = ${p * a + q * b}`;
}

function Operand({ coef, m, tones, label }: { coef: number; m: Mat; tones: Tone[][]; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {coef !== 1 ? <span className="pb-3 font-mono text-lg font-bold text-slate-200">{fmt(coef)}</span> : null}
      <MatrixView m={m} label={label} tones={tones} />
    </div>
  );
}

function AddTab() {
  const [big, setBig] = useState(false);
  const [opIdx, setOpIdx] = useState(0);
  const [k, setK] = useState(K_START);
  const [cell, setCell] = useState<{ i: number; j: number } | null>(null);

  const A = big ? LAB_A3 : LAB_A2;
  const B = big ? LAB_B3 : LAB_B2;
  const op = LAB_OPS[opIdx];
  const p = op.p(k);
  const q = op.q(k);
  const R = combM(p, A, q, B);
  const n = rowsOf(R);
  const pick = cell && cell.i < n && cell.j < colsOf(R) ? cell : null;
  const needsK = op.id === "kA" || op.id === "akb";

  const rTones: Tone[][] = R.map((row, i) => row.map((_, j) => (pick && pick.i === i && pick.j === j ? "cross" : "res")));
  const aTones: Tone[][] = A.map((row, i) => row.map((_, j) => (pick && pick.i === i && pick.j === j ? "row" : "a")));
  const bTones: Tone[][] = B.map((row, i) => row.map((_, j) => (pick && pick.i === i && pick.j === j ? "col" : "b")));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.07] to-teal-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-emerald-200">🧪 계산 실험실 — 자리끼리 계산하는 모습을 확인해요</p>
          <div className="flex gap-1.5">
            {[false, true].map((z) => (
              <button
                key={String(z)}
                type="button"
                onClick={() => {
                  setBig(z);
                  setCell(null);
                }}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (big === z ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {z ? "3×3" : "2×2"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {LAB_OPS.map((z, i) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setOpIdx(i)}
              className={
                "rounded-lg border-2 px-3 py-1.5 text-sm font-bold transition " +
                (opIdx === i ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              {z.label}
            </button>
          ))}
        </div>

        <div className={"mt-3 " + (needsK ? "" : "opacity-40")}>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-300">실수 k</span>
            <span className="font-mono text-sm text-emerald-200">k = {fmt(k)}</span>
          </div>
          <input
            type="range"
            min={K_MIN}
            max={K_MAX}
            step={1}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            disabled={!needsK}
            className="mt-1 w-full accent-emerald-400"
          />
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 p-3">
          <p className="mb-2 text-center text-lg font-bold text-slate-100">
            <Katex expr={op.texOf(k)} />
          </p>
          <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-2 overflow-x-auto overflow-y-hidden py-1">
            <Operand coef={p} m={A} tones={aTones} label="A" />
            {q !== 0 ? (
              <>
                <span className="pb-3 text-xl font-bold text-slate-300">{q > 0 ? "+" : "−"}</span>
                <Operand coef={Math.abs(q)} m={B} tones={bTones} label="B" />
              </>
            ) : null}
            <span className="pb-3 text-xl font-bold text-slate-300">=</span>
            <MatrixView m={R} tones={rTones} label="결과" onCell={(i, j) => setCell({ i, j })} />
          </div>
        </div>

        <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <p className="min-h-[34px] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-5 text-slate-400">
            {pick ? (
              <>
                결과의 ({pick.i + 1}, {pick.j + 1}) 성분은 A 와 B 의 같은 자리만 써서 만들어져요.
              </>
            ) : (
              "결과 행렬의 칸을 눌러 보세요. 그 칸이 어느 자리에서 왔는지 보여 줘요."
            )}
          </p>
          <div className="flex min-h-[34px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            {pick ? (
              <Katex expr={cellCalcTex(p, A[pick.i][pick.j], q, B[pick.i][pick.j])} className="text-base text-emerald-100" />
            ) : (
              <span className="text-[11px] text-slate-500">여기에 그 칸의 계산이 나타나요</span>
            )}
          </div>
        </div>

      </div>

      <StepRunner steps={ADD_STEPS} accent="emerald" finale="더하기·빼기·몇 배는 모두 같은 자리끼리! 이제 규칙이 아주 다른 곱셈으로 가요." />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 곱셈의 비밀
// ══════════════════════════════════════════════════════════════
/** 꼴 보기는 data 에서 늘 0번이 정답이므로 퍼즐마다 자리를 흩어 놓는다 */
const SHAPE_SHIFT = [2, 0, 3, 1, 0, 2];

function ShapeCard({ r, c, label, lit }: { r: number; c: number; label: string; lit: "none" | "ok" | "no" }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      <div className="flex items-center gap-1 rounded-xl border-2 border-white/10 bg-white/5 px-3 py-2">
        <span className="font-mono text-lg font-bold text-sky-200">{r}</span>
        <span className="text-slate-500">×</span>
        <span
          className={
            "rounded-md px-1.5 py-0.5 font-mono text-lg font-bold " +
            (lit === "ok" ? "bg-emerald-400/25 text-emerald-100" : lit === "no" ? "bg-rose-400/25 text-rose-100" : "text-amber-200")
          }
        >
          {c}
        </span>
      </div>
    </div>
  );
}

function ShapeGame() {
  const [pi, setPi] = useState(0);
  const [canPick, setCanPick] = useState<Record<string, boolean>>({});
  const [canGraded, setCanGraded] = useState<Record<string, boolean>>({});
  const [sizePick, setSizePick] = useState<Record<string, number>>({});
  const [sizeGraded, setSizeGraded] = useState<Record<string, boolean>>({});

  const p = SHAPE_PUZZLES[pi];
  const truth = shapeOk(p);
  const canOk = canGraded[p.id] === true && canPick[p.id] === truth;
  const shift = SHAPE_SHIFT[pi];
  const rawOpts = truth ? shapeOptions(p) : [];
  const opts = rawOpts.map((_, i) => rawOpts[(i - shift + 4) % 4]);
  const sizeAnswer = shift;
  const sizeOk = sizeGraded[p.id] === true && sizePick[p.id] === sizeAnswer;
  const solved = (z: typeof p, idx: number) => {
    const t = shapeOk(z);
    const c = canGraded[z.id] === true && canPick[z.id] === t;
    if (!t) return c;
    return c && sizeGraded[z.id] === true && sizePick[z.id] === SHAPE_SHIFT[idx];
  };
  const cleared = SHAPE_PUZZLES.filter((z, i) => solved(z, i)).length;
  const lit: "none" | "ok" | "no" = canGraded[p.id] === true ? (truth ? "ok" : "no") : "none";

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.07] to-fuchsia-500/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-violet-200">🧩 꼴 맞추기 — 가운데 두 수가 같아야 곱할 수 있어요</p>
        <span className="font-mono text-xs text-slate-300">
          해결 {cleared} / {SHAPE_PUZZLES.length}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SHAPE_PUZZLES.map((z, i) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setPi(i)}
            className={
              "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
              (pi === i
                ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                : solved(z, i)
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {solved(z, i) ? "✅ " : ""}
            {i + 1}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 rounded-xl border border-white/10 bg-slate-900/50 p-4">
        <ShapeCard r={p.ar} c={p.ac} label="앞 행렬 A" lit={lit} />
        <span className="text-2xl font-bold text-slate-500">·</span>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-slate-400">뒤 행렬 B</span>
          <div className="flex items-center gap-1 rounded-xl border-2 border-white/10 bg-white/5 px-3 py-2">
            <span
              className={
                "rounded-md px-1.5 py-0.5 font-mono text-lg font-bold " +
                (lit === "ok" ? "bg-emerald-400/25 text-emerald-100" : lit === "no" ? "bg-rose-400/25 text-rose-100" : "text-amber-200")
              }
            >
              {p.br}
            </span>
            <span className="text-slate-500">×</span>
            <span className="font-mono text-lg font-bold text-sky-200">{p.bc}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-sm font-bold text-slate-100">이 두 행렬을 이 순서로 곱할 수 있을까요?</p>
        <div className="flex flex-wrap gap-2">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => {
                setCanPick((z) => ({ ...z, [p.id]: v }));
                setCanGraded((z) => ({ ...z, [p.id]: false }));
              }}
              className={
                "rounded-xl border-2 px-4 py-2 text-sm font-bold transition " +
                (canGraded[p.id] === true && v === truth
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : canGraded[p.id] === true && canPick[p.id] === v
                    ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                    : canPick[p.id] === v
                      ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              {v ? "⭕ 곱할 수 있다" : "❌ 곱할 수 없다"}
            </button>
          ))}
          <button
            type="button"
            disabled={canPick[p.id] === undefined}
            onClick={() => setCanGraded((z) => ({ ...z, [p.id]: true }))}
            className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.violet}
          >
            확인
          </button>
        </div>

        {canGraded[p.id] === true ? (
          <Verdict ok={canOk}>
            {truth
              ? `앞 행렬의 세로줄이 ${p.ac}개, 뒤 행렬의 가로줄이 ${p.br}개로 같으니 곱할 수 있어요.`
              : `앞 행렬의 세로줄은 ${p.ac}개인데 뒤 행렬의 가로줄은 ${p.br}개예요. 개수가 다르면 곱할 수 없어요.`}
          </Verdict>
        ) : null}

        {canOk && truth ? (
          <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <p className="text-sm font-bold text-slate-100">그러면 결과는 어떤 꼴이 될까요?</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {opts.map((z, i) => {
                const right = sizeGraded[p.id] === true && i === sizeAnswer;
                const wrong = sizeGraded[p.id] === true && sizePick[p.id] === i && i !== sizeAnswer;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSizePick((y) => ({ ...y, [p.id]: i }));
                      setSizeGraded((y) => ({ ...y, [p.id]: false }));
                    }}
                    className={
                      "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold transition " +
                      (right
                        ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                        : wrong
                          ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                          : sizePick[p.id] === i
                            ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                            : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    <span className="text-slate-400">{ABC[i]}</span>
                    <Katex expr={shapeTex(z.r, z.c)} />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={sizePick[p.id] === undefined}
              onClick={() => setSizeGraded((y) => ({ ...y, [p.id]: true }))}
              className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.violet}
            >
              확인
            </button>
            {sizeGraded[p.id] === true ? (
              <Verdict ok={sizeOk}>
                {sizeOk
                  ? `가운데 ${p.ac} 이 사라지고 바깥의 두 수만 남아 ${p.ar}×${p.bc} 행렬이 돼요.`
                  : `가운데에서 만난 ${p.ac} 은 사라져요. 남는 것은 앞의 가로줄 ${p.ar} 과 뒤의 세로줄 ${p.bc} 이에요.`}
              </Verdict>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VisualMul() {
  const [filled, setFilled] = useState<boolean[][]>(() => VIS_AB.map((row) => row.map(() => false)));
  const [sel, setSel] = useState<{ i: number; j: number } | null>(null);

  const doneCount = filled.flat().filter(Boolean).length;
  const total = VIS_AB.length * VIS_AB[0].length;
  const aTones: Tone[][] = VIS_A.map((row, i) => row.map(() => (sel && sel.i === i ? "row" : "a")));
  const bTones: Tone[][] = VIS_B.map((row) => row.map((_, j) => (sel && sel.j === j ? "col" : "b")));
  const rTones: Tone[][] = VIS_AB.map((row, i) =>
    row.map((_, j) => (sel && sel.i === i && sel.j === j ? "cross" : filled[i][j] ? "hit" : "ghost")),
  );
  const hide = VIS_AB.map((row, i) => row.map((_, j) => !filled[i][j]));
  const terms = sel ? mulTerms(VIS_A, VIS_B, sel.i, sel.j) : [];

  return (
    <div className="rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-500/[0.07] to-indigo-500/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-sky-200">🔍 한 칸씩 채우기 — 가로줄과 세로줄이 만나는 곳</p>
        <span className="font-mono text-xs text-slate-300">
          채운 칸 {doneCount} / {total}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-center gap-x-3 gap-y-2 overflow-x-auto overflow-y-hidden py-1">
        <MatrixView m={VIS_A} tones={aTones} label="A (2×3)" />
        <span className="pb-3 text-xl font-bold text-slate-300">·</span>
        <MatrixView m={VIS_B} tones={bTones} label="B (3×2)" />
        <span className="pb-3 text-xl font-bold text-slate-300">=</span>
        <MatrixView m={VIS_AB} tones={rTones} hideValues={hide} label="AB (2×2)" onCell={(i, j) => setSel({ i, j })} />
      </div>

      <div className="mt-2 space-y-2 rounded-xl border border-white/10 bg-slate-900/50 p-3">
        {sel ? (
          <>
            <p className="text-xs leading-6 text-slate-300">
              A 의 <b className="text-sky-200">제{sel.i + 1}행</b> 과 B 의 <b className="text-amber-200">제{sel.j + 1}열</b> 을 차례로
              곱해서 더해요.
            </p>
            <div className="overflow-x-auto overflow-y-hidden py-1">
              <Katex
                expr={filled[sel.i][sel.j] ? `${sumProdTex(terms)} = ${VIS_AB[sel.i][sel.j]}` : sumProdTex(terms)}
                className="whitespace-nowrap text-base text-slate-100"
              />
            </div>
            {!filled[sel.i][sel.j] ? (
              <button
                type="button"
                onClick={() =>
                  setFilled((z) => {
                    const next = z.map((row) => [...row]);
                    next[sel.i][sel.j] = true;
                    return next;
                  })
                }
                className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition " + ACC_BTN.sky}
              >
                이 칸 채우기
              </button>
            ) : null}
          </>
        ) : (
          <p className="text-[11px] leading-5 text-slate-400">
            오른쪽 결과 행렬의 물음표 칸을 눌러 보세요. 그 칸을 만드는 가로줄과 세로줄이 밝아져요.
          </p>
        )}
      </div>

      {doneCount === total ? (
        <div className="mt-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3 text-center">
          <p className="text-sm font-bold text-emerald-100">🎉 네 칸을 모두 채웠어요!</p>
          <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-slate-200">
            2×3 과 3×2 를 곱했더니 가운데 3 은 사라지고 2×2 가 남았어요. 칸 하나마다 세 개의 곱을 더한 셈이에요.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setFilled(VIS_AB.map((row) => row.map(() => false)));
            setSel(null);
          }}
          className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          ↩️ 다시
        </button>
      )}
    </div>
  );
}

function NonCommute() {
  const [pick, setPick] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] p-4">
      <p className="text-sm font-bold text-rose-200">🔄 순서를 바꾸면? — 수의 곱셈과 다른 점</p>
      <div className="mt-3 flex flex-wrap items-end justify-center gap-x-4 gap-y-2 overflow-x-auto overflow-y-hidden py-1">
        <MatrixView m={NC_A} label="A" tones={NC_A.map((row) => row.map(() => "a"))} />
        <MatrixView m={NC_B} label="B" tones={NC_B.map((row) => row.map(() => "b"))} />
      </div>

      {!open ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-bold text-slate-100">두 행렬 모두 2차 정사각행렬이에요. AB 와 BA 는 같을까요?</p>
          <div className="flex flex-wrap gap-2">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setPick(v)}
                className={
                  "rounded-xl border-2 px-4 py-2 text-sm font-bold transition " +
                  (pick === v ? "border-rose-400/60 bg-rose-400/20 text-rose-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                {v ? "같을 것 같다" : "다를 것 같다"}
              </button>
            ))}
            <button
              type="button"
              disabled={pick === null}
              onClick={() => setOpen(true)}
              className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.amber}
            >
              계산해 보기
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-sky-400/30 bg-sky-400/[0.07] p-3 text-center">
              <p className="mb-2 text-xs font-bold text-sky-200">A 에 B 를 곱하면</p>
              <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1">
                <MatrixView m={NC_AB} tones={NC_AB.map((row) => row.map(() => "hit"))} />
              </div>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-3 text-center">
              <p className="mb-2 text-xs font-bold text-amber-200">B 에 A 를 곱하면</p>
              <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1">
                <MatrixView m={NC_BA} tones={NC_BA.map((row) => row.map(() => "miss"))} />
              </div>
            </div>
          </div>
          <Verdict ok={pick === false}>
            {pick === false
              ? "예상한 대로 값이 완전히 달라요. 행렬에서는 곱하는 순서가 뜻까지 바꿉니다."
              : "값이 완전히 달라요. 수에서는 3 × 5 와 5 × 3 이 같지만 행렬은 그렇지 않아요."}
          </Verdict>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setPick(null);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 다시
          </button>
        </div>
      )}
    </div>
  );
}

function MulTab() {
  return (
    <div className="space-y-4">
      <ShapeGame />
      <VisualMul />
      <NonCommute />
      <StepRunner steps={MUL_STEPS} accent="violet" finale="곱셈의 규칙을 익혔어요. 이제 스프레드시트에 시켜 볼 차례예요!" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 스프레드시트
// ══════════════════════════════════════════════════════════════
type SheetCell = { text: string; kind: "labelA" | "labelB" | "labelR" | "dataA" | "dataB" | "res" };
const SHEET_CELL_TONE: Record<string, string> = {
  labelA: "bg-sky-500/20 text-sky-100 font-bold",
  labelB: "bg-amber-500/20 text-amber-100 font-bold",
  labelR: "bg-violet-500/20 text-violet-100 font-bold",
  dataA: "bg-sky-400/[0.10] text-sky-100",
  dataB: "bg-amber-400/[0.10] text-amber-100",
  res: "bg-violet-400/[0.16] text-violet-100",
  empty: "text-slate-600",
};

function buildSheet(def: SheetDef, ran: boolean): Record<string, SheetCell> {
  const map: Record<string, SheetCell> = {};
  def.blocks.forEach((b) => {
    map[`${b.col},${b.row - 1}`] = { text: b.label, kind: b.tone === "a" ? "labelA" : "labelB" };
    b.m.forEach((row, i) =>
      row.forEach((v, j) => {
        map[`${b.col + j},${b.row + i}`] = { text: won(v), kind: b.tone === "a" ? "dataA" : "dataB" };
      }),
    );
  });
  map[`${def.result.col},${def.result.row - 1}`] = { text: def.result.label, kind: "labelR" };
  if (ran) {
    def.result.m.forEach((row, i) =>
      row.forEach((v, j) => {
        map[`${def.result.col + j},${def.result.row + i}`] = { text: won(v), kind: "res" };
      }),
    );
  }
  return map;
}

function SheetGrid({
  def,
  ran,
  sel,
  onPick,
}: {
  def: SheetDef;
  ran: boolean;
  sel: { c: number; r: number; w: number; h: number } | null;
  onPick?: (c: number, r: number) => void;
}) {
  const map = buildSheet(def, ran);
  const inSel = (c: number, r: number) => !!sel && c >= sel.c && c < sel.c + sel.w && r >= sel.r && r < sel.r + sel.h;
  return (
    <div className="overflow-x-auto overflow-y-hidden py-1">
      <div className="inline-block rounded-lg border border-white/15 bg-slate-900/70 p-1">
        <div className="flex">
          <div className="h-6 w-7 shrink-0" />
          {Array.from({ length: SHEET_COLS }, (_, c) => (
            <div key={c} className="flex h-6 w-[54px] shrink-0 items-center justify-center border-b border-white/10 text-[10px] font-bold text-slate-400">
              {colName(c)}
            </div>
          ))}
        </div>
        {Array.from({ length: SHEET_ROWS }, (_, r) => (
          <div key={r} className="flex">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center border-r border-white/10 text-[10px] font-bold text-slate-400">
              {r + 1}
            </div>
            {Array.from({ length: SHEET_COLS }, (_, c) => {
              const cell = map[`${c},${r}`];
              const picked = inSel(c, r);
              const cls =
                "flex h-7 w-[54px] shrink-0 items-center justify-end border-b border-r border-white/[0.07] px-1 font-mono text-[11px] tabular-nums transition " +
                (cell ? SHEET_CELL_TONE[cell.kind] : SHEET_CELL_TONE.empty) +
                (picked ? " outline outline-2 -outline-offset-2 outline-emerald-400/80" : "");
              if (onPick) {
                return (
                  <button key={c} type="button" onClick={() => onPick(c, r)} className={cls + " hover:brightness-150"}>
                    {cell ? cell.text : ""}
                  </button>
                );
              }
              return (
                <div key={c} className={cls}>
                  {cell ? cell.text : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function SheetRunner({ def, accent, intro }: { def: SheetDef; accent: Accent; intro: React.ReactNode }) {
  const [sizePick, setSizePick] = useState<number | null>(null);
  const [sizeGraded, setSizeGraded] = useState(false);
  const [start, setStart] = useState<{ c: number; r: number } | null>(null);
  const [rangeGraded, setRangeGraded] = useState(false);
  const [fPick, setFPick] = useState<number | null>(null);
  const [fGraded, setFGraded] = useState(false);
  const [ran, setRan] = useState(false);

  const sizeOk = sizeGraded && sizePick === def.sizeAnswer;
  const want = def.sizeOptions[def.sizeAnswer];
  const sel = start && sizeOk ? { c: start.c, r: start.r, w: want.c, h: want.r } : null;
  const rangeOk = rangeGraded && !!start && start.c === def.result.col && start.r === def.result.row;
  const overlaps =
    !!sel &&
    def.blocks.some((b) =>
      b.m.some((row, i) =>
        row.some((_, j) => b.col + j >= sel.c && b.col + j < sel.c + sel.w && b.row + i >= sel.r && b.row + i < sel.r + sel.h),
      ),
    );
  const fOk = fGraded && fPick === def.formulaAnswer;
  const formulaText = fPick !== null ? def.formulaOptions[fPick] : "";

  return (
    <div className={"space-y-3 rounded-2xl border p-4 " + ACC_PANEL[accent]}>
      {intro}

      {/* 수식 입력줄 */}
      <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-slate-900/70 px-2 py-1.5">
        <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-300">fx</span>
        <span className="truncate font-mono text-xs text-slate-200">
          {fOk && ran ? formulaText : fPick !== null && fGraded ? formulaText : sel ? rangeName(sel.c, sel.r, sel.w, sel.h) + " 선택됨" : ""}
        </span>
      </div>

      <SheetGrid
        def={def}
        ran={ran && fOk}
        sel={sel}
        onPick={
          sizeOk && !rangeOk
            ? (c, r) => {
                // 잡은 범위가 시트 밖으로 나가지 않도록 왼쪽 위 칸을 안쪽으로 당긴다
                setStart({ c: Math.min(c, SHEET_COLS - want.c), r: Math.min(r, SHEET_ROWS - want.r) });
                setRangeGraded(false);
              }
            : undefined
        }
      />

      {/* 1단계 — 결과의 꼴 */}
      <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/50 p-3">
        <p className="text-sm font-bold text-slate-100">1단계 · 결과는 몇 칸짜리 행렬이 될까요?</p>
        <div className="flex flex-wrap gap-1.5">
          {def.sizeOptions.map((z, i) => {
            const right = sizeGraded && i === def.sizeAnswer;
            const wrong = sizeGraded && sizePick === i && i !== def.sizeAnswer;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSizePick(i);
                  setSizeGraded(false);
                }}
                className={
                  "rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition " +
                  (right
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : wrong
                      ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                      : sizePick === i
                        ? ACC_CHIP[accent]
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                <Katex expr={shapeTex(z.r, z.c)} />
              </button>
            );
          })}
          <button
            type="button"
            disabled={sizePick === null}
            onClick={() => setSizeGraded(true)}
            className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN[accent]}
          >
            확인
          </button>
        </div>
        {sizeGraded ? (
          <Verdict ok={sizeOk}>
            {sizeOk
              ? `앞의 가로줄 ${want.r} 과 뒤의 세로줄 ${want.c} 만 남아 ${want.r}×${want.c} 가 돼요.`
              : "가운데에서 만난 수는 사라지고 바깥의 두 수만 남아요."}
          </Verdict>
        ) : null}
      </div>

      {/* 2단계 — 범위 잡기 */}
      {sizeOk ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/50 p-3">
          <p className="text-sm font-bold text-slate-100">
            2단계 · 결과가 들어갈 {want.r}×{want.c} 칸을 잡아 보세요
          </p>
          <p className="text-[11px] leading-5 text-slate-400">
            시트에서 왼쪽 위가 될 칸을 누르면 {want.r}×{want.c} 만큼 초록 테두리가 잡혀요. {def.result.label} 이라고 적힌 칸 바로
            아래에서 시작해요.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!start}
              onClick={() => setRangeGraded(true)}
              className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN[accent]}
            >
              확인
            </button>
            <span className="self-center font-mono text-xs text-slate-400">
              {sel ? rangeName(sel.c, sel.r, sel.w, sel.h) : "아직 잡지 않았어요"}
            </span>
          </div>
          {rangeGraded ? (
            <Verdict ok={rangeOk}>
              {rangeOk
                ? `${rangeName(def.result.col, def.result.row, want.c, want.r)} 를 잡았어요. 이제 수식을 넣으면 이 칸이 한꺼번에 채워집니다.`
                : overlaps
                  ? `이미 값이 적힌 칸을 덮고 있어요. ${def.result.label} 이라고 적힌 칸 바로 아래의 빈 곳에서 다시 시작해 보세요.`
                  : `${def.result.label} 이라고 적힌 칸 바로 아래, ${cellName(def.result.col, def.result.row)} 에서 시작해 보세요.`}
            </Verdict>
          ) : null}
        </div>
      ) : null}

      {/* 3단계 — 수식 */}
      {rangeOk ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/50 p-3">
          <p className="text-sm font-bold text-slate-100">3단계 · 어떤 수식을 넣어야 할까요?</p>
          <div className="grid gap-1.5">
            {def.formulaOptions.map((f, i) => {
              const right = fGraded && i === def.formulaAnswer;
              const wrong = fGraded && fPick === i && i !== def.formulaAnswer;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setFPick(i);
                    setFGraded(false);
                  }}
                  className={
                    "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left font-mono text-xs font-bold transition " +
                    (right
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : wrong
                        ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                        : fPick === i
                          ? ACC_CHIP[accent]
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  <span className="text-slate-400">{ABC[i]}</span>
                  {f}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={fPick === null}
            onClick={() => setFGraded(true)}
            className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN[accent]}
          >
            확인
          </button>
          {fGraded && !fOk ? <Verdict ok={false}>{def.formulaExplains[fPick ?? 0]}</Verdict> : null}
        </div>
      ) : null}

      {/* 4단계 — 실행 */}
      {fOk ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/50 p-3">
          <p className="text-sm font-bold text-slate-100">4단계 · 배열 수식으로 확정하기</p>
          {!ran ? (
            <button
              type="button"
              onClick={() => setRan(true)}
              className="rounded-xl border-2 border-emerald-400/60 bg-emerald-400/15 px-5 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/25"
            >
              ⌨️ Ctrl + Shift + Enter
            </button>
          ) : (
            <Verdict ok>잡아 둔 칸이 한꺼번에 채워졌어요. 수식 한 줄로 {def.result.m.length * def.result.m[0].length} 칸을 구했습니다.</Verdict>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SheetTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-sm font-bold text-slate-100">📊 스프레드시트는 행렬의 곱을 함수 하나로 구해 줘요</p>
        <p className="mt-1 font-mono text-sm text-emerald-200">=MMULT(앞 행렬 범위, 뒤 행렬 범위)</p>
        <div className="mt-2">
          <GoalList items={SHEET_TIPS} />
        </div>
      </div>

      <SheetRunner
        def={SHEET1}
        accent="sky"
        intro={
          <div>
            <p className="text-sm font-bold text-sky-200">① 연습 시트 — 작은 행렬로 순서를 익혀요</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              B3:D4 에 2×3 행렬 A 가, F3:G5 에 3×2 행렬 B 가 들어 있어요. AB 를 구해 봐요.
            </p>
          </div>
        }
      />

      <SheetRunner
        def={SHEET2}
        accent="amber"
        intro={
          <div>
            <p className="text-sm font-bold text-amber-200">② 실습 시트 — 창고의 물건을 어디에 넘길까</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              왼쪽은 창고별로 쌓여 있는 상자 수({STORE_NAMES.join(" · ")} × {ITEM_NAMES.join(" · ")}), 오른쪽은 도매상이 쳐 주는
              상자당 값({ITEM_NAMES.join(" · ")} × {BUYER_NAMES.join(" · ")})이에요. 단위는 천원입니다.
            </p>
          </div>
        }
      />

      <StepRunner steps={SHEET2_STEPS} accent="amber" finale="같은 물건이라도 어디에 넘기느냐에 따라 받는 돈이 달라져요." />

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">{REAL_NOTE}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ 실생활 해결
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

/** 표의 색을 그 표를 옮긴 행렬의 칸 색으로 잇는다 */
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
            <MatrixView
              m={t.m}
              size="sm"
              fmtCell={won}
              tones={t.m.map((row) => row.map(() => TABLE_CELL_TONE[t.tone]))}
            />
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
            표마다 붙은 이름이 그 표를 옮긴 <b className="text-slate-200">행렬의 이름</b>이에요. 아래 문제의 식에 이 이름이
            그대로 나와요.
          </p>
          <button
            type="button"
            onClick={() => setShowMat(!showMat)}
            className={
              "shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition " +
              (showMat
                ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {showMat ? "🔢 행렬 숨기기" : "🔢 행렬로 보기"}
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-start gap-3">
          {sc.tables.map((t, i) => (
            <DataTable key={i} t={t} showMat={showMat} />
          ))}
        </div>
      </div>

      <StepRunner key={sc.id} steps={sc.steps} accent="emerald" finale={sc.wrap} />

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">{REAL_NOTE}</p>
    </div>
  );
}
