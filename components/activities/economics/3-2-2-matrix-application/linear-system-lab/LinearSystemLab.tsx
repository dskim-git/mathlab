"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CONST_MAX,
  CONST_MIN,
  COEF_MAX,
  COEF_MIN,
  JUDGE_BOX,
  JUDGE_CARDS,
  JUDGE_OPTIONS,
  JUDGE_STEPS,
  KIND_EMOJI,
  KIND_SUB,
  KIND_TITLE,
  LAB_BOX,
  LAB_START,
  LAB_STEPS,
  MISSIONS,
  QUESTS,
  REAL_NOTE,
  SCENES,
  SOLVE_BOX,
  axbTex,
  colsOf,
  constOf,
  detOf,
  detTex,
  fmt,
  inBox,
  inv2,
  invTex,
  isLine,
  kindOf,
  lineSeg,
  matOf,
  matTex,
  missionDone,
  solveSys,
  sysTex,
  type Box,
  type Mat,
  type Piece,
  type Step,
  type Sys,
  type SysKind,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "three",
    prompt:
      "같은 연립방정식을 식·행렬·두 직선 세 가지로 함께 보았어요. 행렬식이 0 이 아닐 때와 0 일 때 그래프에서 무엇이 달라졌는지 쓰고, 세 표현이 서로 어떻게 이어지는지 자기 말로 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 행렬식이 0 이 아니면 두 직선이 한 점에서 만나 해가 하나였고, 0 이면 겹치거나 나란해졌다. 행렬식이 0 이 아니라는 말과 역행렬이 있다는 말과 두 직선이 한 점에서 만난다는 말이 모두 같은 이야기였다.",
  },
  {
    id: "zero",
    prompt:
      "행렬식이 0 일 때도 두 가지로 갈렸어요. 해가 무수히 많은 경우와 해가 없는 경우를 무엇으로 가르는지 쓰고, 그래프에서는 각각 어떻게 보이는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: x와 y의 계수만 비례하면 나란한 두 직선이라 해가 없고, 상수항까지 같은 비로 비례하면 아예 같은 직선이 되어 해가 무수히 많았다.",
  },
  {
    id: "real",
    prompt:
      "실생활 문제에서 해가 없거나 무수히 많은 경우도 만나 보았어요. 그런 결과가 나왔을 때 그것이 무슨 뜻인지, 그리고 값을 알아내려면 무엇이 더 필요한지 예를 들어 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 해가 없다는 것은 주어진 두 조건이 서로 어긋난다는 뜻이고, 해가 무수히 많다는 것은 조건이 사실 하나뿐이라 정보가 모자란다는 뜻이었다. 비율이 다른 새 묶음의 값을 하나 더 알아야 한다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "lab" | "solve" | "judge" | "real";

export default function LinearSystemLab() {
  const [tab, setTab] = useState<Tab>("lab");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">📐 연립방정식과 역행렬</h3>
        <p className="mt-2 leading-7 text-slate-300">
          연립방정식 하나를 <b className="text-sky-200">식</b> · <b className="text-violet-200">행렬</b> ·{" "}
          <b className="text-amber-200">두 직선</b> 세 가지로 함께 봐요. 행렬식이 0 이 아니면 역행렬로 해를 구하고, 0 이면
          그래프가 그 까닭을 알려 줍니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "lab"} onClick={() => setTab("lab")}>① 두 직선 실험실</TabButton>
        <TabButton active={tab === "solve"} onClick={() => setTab("solve")}>② 역행렬로 풀기</TabButton>
        <TabButton active={tab === "judge"} onClick={() => setTab("judge")}>③ 세 갈래 판정</TabButton>
        <TabButton active={tab === "real"} onClick={() => setTab("real")}>④ 실생활 해결</TabButton>
      </div>

      <div className="mt-4">
        {tab === "lab" ? <LabTab /> : null}
        {tab === "solve" ? <SolveTab /> : null}
        {tab === "judge" ? <JudgeTab /> : null}
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
//  공용 — 좌표평면
// ══════════════════════════════════════════════════════════════
const S = 330;
const ML = 30;
const MR = 14;
const MT = 14;
const MB = 26;
const LINE1 = "#38bdf8"; // 첫 식 — 하늘
const LINE2 = "#fbbf24"; // 둘째 식 — 노랑

function Plane({
  sys,
  box,
  uid,
  showPoint = true,
}: {
  sys: Sys;
  box: Box;
  uid: string;
  showPoint?: boolean;
}) {
  const pw = S - ML - MR;
  const ph = S - MT - MB;
  const X = (v: number) => ML + ((v - box.xMin) / (box.xMax - box.xMin)) * pw;
  const Y = (v: number) => S - MB - ((v - box.yMin) / (box.yMax - box.yMin)) * ph;
  const cid = `ls-${uid}`;

  const gx: number[] = [];
  for (let v = Math.ceil(box.xMin / box.grid) * box.grid; v <= box.xMax; v += box.grid) gx.push(v);
  const gy: number[] = [];
  for (let v = Math.ceil(box.yMin / box.grid) * box.grid; v <= box.yMax; v += box.grid) gy.push(v);

  const g1 = lineSeg(sys.a, sys.b, sys.m, box);
  const g2 = lineSeg(sys.c, sys.d, sys.n, box);
  const kind = kindOf(sys);
  const pt = solveSys(sys);
  const ptIn = pt !== null && inBox(pt, box);
  const axisX = box.yMin <= 0 && box.yMax >= 0;
  const axisY = box.xMin <= 0 && box.xMax >= 0;

  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[330px]" role="img" aria-label="두 직선 그래프">
      <defs>
        <clipPath id={cid}>
          <rect x={ML} y={MT} width={pw} height={ph} />
        </clipPath>
      </defs>
      <rect x={ML} y={MT} width={pw} height={ph} fill="#0b1220" stroke="rgba(255,255,255,0.12)" />

      {gx.map((v) => (
        <line key={`gx${v}`} x1={X(v)} y1={MT} x2={X(v)} y2={S - MB} stroke="rgba(255,255,255,0.06)" />
      ))}
      {gy.map((v) => (
        <line key={`gy${v}`} x1={ML} y1={Y(v)} x2={S - MR} y2={Y(v)} stroke="rgba(255,255,255,0.06)" />
      ))}
      {axisX ? <line x1={ML} y1={Y(0)} x2={S - MR} y2={Y(0)} stroke="rgba(255,255,255,0.35)" /> : null}
      {axisY ? <line x1={X(0)} y1={MT} x2={X(0)} y2={S - MB} stroke="rgba(255,255,255,0.35)" /> : null}

      {gx
        .filter((v) => v !== 0)
        .map((v) => (
          <text key={`tx${v}`} x={X(v)} y={S - MB + 13} textAnchor="middle" fontSize="9" fill="#64748b">
            {v}
          </text>
        ))}
      {gy
        .filter((v) => v !== 0)
        .map((v) => (
          <text key={`ty${v}`} x={ML - 5} y={Y(v) + 3} textAnchor="end" fontSize="9" fill="#64748b">
            {v}
          </text>
        ))}

      <g clipPath={`url(#${cid})`}>
        {/* 겹친 경우 아래 직선을 굵게 깔아 두 직선이 포개진 것이 보이게 한다 */}
        {g2 ? (
          <line
            x1={X(g2.x1)}
            y1={Y(g2.y1)}
            x2={X(g2.x2)}
            y2={Y(g2.y2)}
            stroke={LINE2}
            strokeWidth={kind === "many" ? 7 : 2.4}
            strokeOpacity={kind === "many" ? 0.55 : 1}
            strokeLinecap="round"
          />
        ) : null}
        {g1 ? (
          <line x1={X(g1.x1)} y1={Y(g1.y1)} x2={X(g1.x2)} y2={Y(g1.y2)} stroke={LINE1} strokeWidth="2.4" strokeLinecap="round" />
        ) : null}
      </g>

      {/* 점과 이름표는 clipPath 밖에 그린다 */}
      {showPoint && ptIn && pt ? (
        <g>
          <circle cx={X(pt[0])} cy={Y(pt[1])} r="6" fill="none" stroke="#34d399" strokeWidth="2" />
          <circle cx={X(pt[0])} cy={Y(pt[1])} r="3" fill="#34d399" />
          <text
            x={X(pt[0]) + (pt[0] > (box.xMin + box.xMax) / 2 ? -9 : 9)}
            y={Y(pt[1]) + (pt[1] > (box.yMin + box.yMax) / 2 ? 16 : -9)}
            textAnchor={pt[0] > (box.xMin + box.xMax) / 2 ? "end" : "start"}
            fontSize="11"
            fontWeight="bold"
            fill="#6ee7b7"
          >
            ({fmt(pt[0])}, {fmt(pt[1])})
          </text>
        </g>
      ) : null}
    </svg>
  );
}

const KIND_BOX: Record<SysKind, string> = {
  one: "border-emerald-400/50 bg-emerald-400/10",
  many: "border-sky-400/50 bg-sky-400/10",
  none: "border-rose-400/50 bg-rose-400/10",
};
const KIND_TEXT: Record<SysKind, string> = {
  one: "text-emerald-200",
  many: "text-sky-200",
  none: "text-rose-200",
};

function KindBadge({ kind }: { kind: SysKind }) {
  return (
    <div className={"rounded-xl border-2 px-3 py-2 text-center " + KIND_BOX[kind]}>
      <p className={"text-sm font-bold " + KIND_TEXT[kind]}>
        {KIND_EMOJI[kind]} {KIND_TITLE[kind]}
      </p>
      <p className="mt-0.5 text-[11px] text-slate-300">{KIND_SUB[kind]}</p>
    </div>
  );
}

/** 같은 상황을 식 · 행렬 · 그래프 세 가지로 나란히 */
function TriView({ sys, box, uid, showPoint = true }: { sys: Sys; box: Box; uid: string; showPoint?: boolean }) {
  const bad1 = !isLine(sys.a, sys.b);
  const bad2 = !isLine(sys.c, sys.d);
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
      <div className="space-y-2">
        <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.06] p-3">
          <p className="mb-1 text-[10px] font-bold text-sky-300">연립방정식</p>
          <div className="overflow-x-auto overflow-y-hidden py-1">
            <Katex expr={sysTex(sys)} display className="text-slate-100" />
          </div>
        </div>
        <div className="rounded-xl border border-violet-400/25 bg-violet-400/[0.06] p-3">
          <p className="mb-1 text-[10px] font-bold text-violet-300">행렬로 나타내면</p>
          <div className="overflow-x-auto overflow-y-hidden py-1">
            <Katex expr={axbTex(sys)} display className="text-slate-100" />
          </div>
        </div>
        {bad1 || bad2 ? (
          <p className="rounded-xl border-l-4 border-rose-400 bg-rose-400/[0.08] px-3 py-2 text-xs leading-6 text-rose-100">
            {bad1 && bad2 ? "두 식 모두" : bad1 ? "첫 식이" : "둘째 식이"} x와 y의 계수가 모두 0 이라 직선을 나타내지 못해요.
            손잡이를 움직여 보세요.
          </p>
        ) : null}
      </div>
      <div className="flex justify-center">
        <Plane sys={sys} box={box} uid={uid} showPoint={showPoint} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  공용 — 행렬 그리기
// ══════════════════════════════════════════════════════════════
type Tone = "base" | "a" | "b" | "res" | "hit" | "miss";
const CELL_TONE: Record<Tone, string> = {
  base: "border-white/10 bg-white/[0.05] text-slate-100",
  a: "border-sky-400/35 bg-sky-400/10 text-sky-100",
  b: "border-amber-400/35 bg-amber-400/10 text-amber-100",
  res: "border-violet-400/35 bg-violet-400/12 text-violet-100",
  hit: "border-emerald-400/70 bg-emerald-400/20 text-emerald-100",
  miss: "border-rose-400/70 bg-rose-400/20 text-rose-100",
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

function MatrixView({ m, tones, label }: { m: Mat; tones?: Tone[][]; label?: string }) {
  return (
    <div className="inline-flex flex-col items-center gap-1">
      {label ? <span className="text-xs font-bold text-slate-400">{label}</span> : null}
      <div className="flex items-stretch gap-1">
        <Bracket side="l" />
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${colsOf(m)}, minmax(0, 1fr))` }}>
          {m.map((row, i) =>
            row.map((v, j) => (
              <div
                key={`${i}-${j}`}
                className={
                  "flex h-9 min-w-[2.7rem] items-center justify-center rounded-md border px-1.5 font-mono text-sm tabular-nums " +
                  CELL_TONE[tones?.[i]?.[j] ?? "base"]
                }
              >
                {fmt(v)}
              </div>
            )),
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
}: {
  values: string[][];
  onChange: (i: number, j: number, v: string) => void;
  marks?: string[][];
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
                "h-9 w-16 rounded-md border-2 text-center font-mono text-sm tabular-nums outline-none transition " +
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
const sameNum = (s: string, v: number): boolean => cleanNum(s) !== "" && Math.abs(Number(cleanNum(s)) - v) < 1e-9;

function stepDone(s: Step, picks: Record<string, number>, fills: Record<string, string[][]>, nums: Record<string, string>): boolean {
  if (s.kind === "choice") return picks[s.id] === s.answer;
  if (s.kind === "num") return sameNum(nums[s.id] ?? "", s.answer);
  const v = fills[s.id];
  if (!v) return false;
  return s.target.every((row, i) => row.every((t, j) => sameNum(v[i]?.[j] ?? "", t)));
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
    s.kind === "fill" && isGraded ? s.target.map((row, i) => row.map((t, j) => (sameNum(fillVals[i]?.[j] ?? "", t) ? "right" : "wrong"))) : undefined;
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
          <Verdict ok={false}>빨간 칸을 다시 보세요. 부호를 놓치지 않았는지 확인해요.</Verdict>
        ) : isGraded ? (
          <Verdict ok={false}>아직 맞지 않아요. 계산을 다시 한 번 해 보세요.</Verdict>
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
//  탭 ① 두 직선 실험실
// ══════════════════════════════════════════════════════════════
const KNOB_ROWS: { name: keyof Sys; label: string; min: number; max: number; accent: string }[] = [
  { name: "a", label: "a — 첫 식의 x 계수", min: COEF_MIN, max: COEF_MAX, accent: "accent-sky-400" },
  { name: "b", label: "b — 첫 식의 y 계수", min: COEF_MIN, max: COEF_MAX, accent: "accent-sky-400" },
  { name: "m", label: "m — 첫 식의 상수항", min: CONST_MIN, max: CONST_MAX, accent: "accent-sky-400" },
  { name: "c", label: "c — 둘째 식의 x 계수", min: COEF_MIN, max: COEF_MAX, accent: "accent-amber-400" },
  { name: "d", label: "d — 둘째 식의 y 계수", min: COEF_MIN, max: COEF_MAX, accent: "accent-amber-400" },
  { name: "n", label: "n — 둘째 식의 상수항", min: CONST_MIN, max: CONST_MAX, accent: "accent-amber-400" },
];

function Knob({
  label,
  value,
  min,
  max,
  accent,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  accent: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-bold text-slate-300">{label}</span>
        <span className="font-mono text-sm text-slate-100">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-1 w-full " + accent}
      />
    </div>
  );
}

function LabTab() {
  const [sys, setSys] = useState<Sys>(LAB_START);
  const [msi, setMsi] = useState(0);
  const [cleared, setCleared] = useState<Record<string, boolean>>({});

  const k = detOf(sys);
  const kind = kindOf(sys);
  const pt = solveSys(sys);
  const ptIn = pt !== null && inBox(pt, LAB_BOX);
  const ms = MISSIONS[msi];
  const hit = missionDone(ms, sys);
  const doneCount = MISSIONS.filter((z) => cleared[z.id] === true).length;
  const set = (name: keyof Sys, v: number) => setSys((z) => ({ ...z, [name]: v }));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-500/[0.07] to-amber-500/[0.04] p-4">
        <p className="text-sm font-bold text-sky-200">🎛️ 여섯 손잡이로 두 식을 바꿔 보세요</p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {KNOB_ROWS.map((r) => (
              <Knob
                key={r.name}
                label={r.label}
                value={sys[r.name]}
                min={r.min}
                max={r.max}
                accent={r.accent}
                onChange={(v) => set(r.name, v)}
              />
            ))}
          </div>

          <div className="space-y-3">
            <TriView sys={sys} box={LAB_BOX} uid="lab" />

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-center">
                <p className="text-[10px] text-slate-400">행렬식</p>
                <div className="mt-0.5 overflow-x-auto overflow-y-hidden py-1">
                  <Katex expr={detTex(matOf(sys))} className="whitespace-nowrap text-base text-slate-100" />
                </div>
              </div>
              <KindBadge kind={kind} />
            </div>

            <div className="min-h-[54px] rounded-xl border border-white/10 bg-slate-900/50 p-3 text-center">
              {k !== 0 && pt ? (
                <>
                  <div className="overflow-x-auto overflow-y-hidden py-1">
                    <Katex expr={`X = A^{-1}B = ${invTex(matOf(sys))} ${matTex(constOf(sys))}`} className="whitespace-nowrap text-base text-violet-100" />
                  </div>
                  <p className="mt-1 text-sm font-bold text-emerald-200">
                    해는 x = {fmt(pt[0])}, y = {fmt(pt[1])}
                    {!ptIn ? <span className="ml-1 text-[11px] font-normal text-slate-400">(교점이 화면 밖에 있어요)</span> : null}
                  </p>
                </>
              ) : (
                <p className="text-xs leading-6 text-slate-400">
                  행렬식이 0 이라 역행렬이 없어요. 두 직선이 겹쳤는지 나란한지 그래프에서 확인해 보세요.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "행렬식이 0 이 아니면 두 직선이 한 점에서 만나고 해가 하나예요.",
              "행렬식이 0 이면서 두 식이 통째로 비례하면 같은 직선이라 해가 무수히 많아요.",
              "행렬식이 0 인데 상수항만 어긋나면 나란한 두 직선이라 해가 없어요.",
              "식 · 행렬 · 그래프는 같은 이야기를 세 가지 말로 한 것이에요.",
            ]}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-amber-200">🎯 미션 — 손잡이를 맞춰 목표를 이뤄 보세요</p>
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
              {z.emoji} {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-xl border-2 border-amber-400/40 bg-amber-400/10 px-3 py-3 text-center">
          <p className="text-xs text-slate-300">목표</p>
          <p className="mt-1 text-lg font-bold text-amber-100">{ms.goal}</p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCleared((z) => ({ ...z, [ms.id]: hit }))}
            className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition " + ACC_BTN.amber}
          >
            지금 상태로 확인
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
            <Verdict ok>목표를 이뤘어요! 지금 행렬식은 {k} 이고 {KIND_SUB[kind]}.</Verdict>
          ) : (
            <TipBox>{ms.hint}</TipBox>
          )}
        </div>

        {doneCount === MISSIONS.length ? (
          <div className="mt-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3 text-center">
            <p className="text-sm font-bold text-emerald-100">🏆 네 미션을 모두 이뤘어요!</p>
            <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-slate-200">
              두 직선의 놓임새가 곧 행렬식의 이야기라는 것을 손으로 확인했어요.
            </p>
          </div>
        ) : null}
      </div>

      <StepRunner steps={LAB_STEPS} accent="sky" finale="세 표현이 하나로 이어졌어요. 이제 역행렬로 직접 풀어 볼 차례예요!" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 역행렬로 풀기
// ══════════════════════════════════════════════════════════════
function SolveTab() {
  const [qi, setQi] = useState(0);
  const q = QUESTS[qi];
  const k = detOf(q.sys);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {QUESTS.map((z, i) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setQi(i)}
            className={
              "rounded-lg border px-2.5 py-1.5 text-xs font-bold transition " +
              (qi === i ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {z.emoji} {z.title}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <TriView sys={q.sys} box={SOLVE_BOX} uid={`solve-${q.id}`} />
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-center">
            <p className="text-[10px] text-slate-400">행렬식</p>
            <div className="mt-0.5 overflow-x-auto overflow-y-hidden py-1">
              <Katex expr={detTex(matOf(q.sys))} className="whitespace-nowrap text-base text-slate-100" />
            </div>
          </div>
          <KindBadge kind={kindOf(q.sys)} />
        </div>
        {k !== 0 ? (
          <p className="mt-2 text-center text-[11px] leading-5 text-slate-400">
            양변의 왼쪽에 <Katex expr="A^{-1}" className="text-emerald-200" /> 을 곱하면{" "}
            <Katex expr="X = A^{-1}B" className="text-emerald-200" /> 가 돼요.
          </p>
        ) : (
          <p className="mt-2 text-center text-[11px] leading-5 text-rose-200">
            행렬식이 0 이라 <Katex expr="A^{-1}" /> 이 없어요. 이 방법으로는 풀 수 없습니다.
          </p>
        )}
      </div>

      <StepRunner key={q.id} steps={q.steps} accent="violet" finale={q.wrap} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 세 갈래 판정
// ══════════════════════════════════════════════════════════════
function JudgeTab() {
  const [ci, setCi] = useState(0);
  const [picks, setPicks] = useState<Record<string, SysKind>>({});
  const [graded, setGraded] = useState<Record<string, boolean>>({});

  const c = JUDGE_CARDS[ci];
  const truth = kindOf(c.sys);
  const isGraded = graded[c.id] === true;
  const okNow = picks[c.id] === truth;
  const clearedCount = JUDGE_CARDS.filter((z) => graded[z.id] === true && picks[z.id] === kindOf(z.sys)).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.07] to-sky-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-emerald-200">🔍 해가 몇 개일까요? 답하면 그래프가 열려요</p>
          <span className="font-mono text-xs text-slate-300">
            해결 {clearedCount} / {JUDGE_CARDS.length}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {JUDGE_CARDS.map((z, i) => {
            const done = graded[z.id] === true && picks[z.id] === kindOf(z.sys);
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setCi(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (ci === i
                    ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100"
                    : done
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {done ? "✅ " : ""}
                {i + 1}
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
          <div className="space-y-2">
            <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.06] p-3">
              <p className="mb-1 text-[10px] font-bold text-sky-300">연립방정식</p>
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={sysTex(c.sys)} display className="text-slate-100" />
              </div>
            </div>

            <div className="grid gap-1.5">
              {JUDGE_OPTIONS.map((opt, i) => {
                const right = isGraded && opt === truth;
                const wrong = isGraded && picks[c.id] === opt && opt !== truth;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setPicks((z) => ({ ...z, [c.id]: opt }));
                      setGraded((z) => ({ ...z, [c.id]: false }));
                    }}
                    className={
                      "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm font-bold transition " +
                      (right
                        ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                        : wrong
                          ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                          : picks[c.id] === opt
                            ? ACC_CHIP.emerald
                            : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    <span className="shrink-0 text-slate-400">{ABC[i]}</span>
                    <span>
                      {KIND_EMOJI[opt]} {KIND_SUB[opt]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={picks[c.id] === undefined}
                onClick={() => setGraded((z) => ({ ...z, [c.id]: true }))}
                className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.emerald}
              >
                확인
              </button>
              {isGraded && okNow && ci < JUDGE_CARDS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCi(ci + 1)}
                  className="rounded-lg border-2 border-emerald-400/55 bg-emerald-400/15 px-4 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/25"
                >
                  다음 카드 →
                </button>
              ) : null}
            </div>

            <div className="min-h-[38px]">
              {isGraded ? (
                <Verdict ok={okNow}>
                  {KIND_TITLE[truth]} — {c.why}
                </Verdict>
              ) : (
                <TipBox>먼저 행렬식을 머릿속으로 계산해 보세요. 0 이 아니면 곧바로 답이 나와요.</TipBox>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            {isGraded ? (
              <>
                <Plane sys={c.sys} box={JUDGE_BOX} uid={`judge-${c.id}`} />
                <div className="w-full">
                  <KindBadge kind={truth} />
                </div>
              </>
            ) : (
              <div className="flex aspect-square w-full max-w-[330px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-slate-900/40 px-4 text-center">
                <p className="text-xs leading-6 text-slate-500">답을 고르고 확인을 누르면 두 직선이 나타나요.</p>
              </div>
            )}
          </div>
        </div>

        {clearedCount === JUDGE_CARDS.length ? (
          <div className="mt-3 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3 text-center">
            <p className="text-sm font-bold text-emerald-100">🏆 열두 장을 모두 가렸어요!</p>
            <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-slate-200">
              행렬식이 0 이 아니면 한 점, 0 이면 겹치거나 나란함. 세 갈래가 손에 익었어요.
            </p>
          </div>
        ) : null}
      </div>

      <StepRunner steps={JUDGE_STEPS} accent="emerald" finale="이제 실제 상황에서 이 세 갈래를 만나 볼 차례예요!" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 실생활
// ══════════════════════════════════════════════════════════════
function RealTab() {
  const [si, setSi] = useState(0);
  const sc = SCENES[si];
  const k = detOf(sc.sys);
  const kind = kindOf(sc.sys);
  const inv = inv2(matOf(sc.sys));

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

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {sc.facts.map((f, i) => (
            <div key={i} className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2">
              <p className="text-[10px] font-bold text-sky-300">조건 {i + 1}</p>
              <p className="mt-0.5 text-sm leading-6 text-slate-100">{f}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] leading-5 text-slate-400">
          <b className="text-violet-200">x</b> = {sc.names[0]}, <b className="text-violet-200">y</b> = {sc.names[1]} (단위 {sc.unit})
          {sc.note ? <span className="ml-1">· {sc.note}</span> : null}
        </p>

        <div className="mt-3">
          <TriView sys={sc.sys} box={sc.box} uid={`real-${sc.id}`} />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-center">
            <p className="text-[10px] text-slate-400">행렬식</p>
            <div className="mt-0.5 overflow-x-auto overflow-y-hidden py-1">
              <Katex expr={detTex(matOf(sc.sys))} className="whitespace-nowrap text-base text-slate-100" />
            </div>
          </div>
          <KindBadge kind={kind} />
        </div>

        {k !== 0 && inv ? (
          <div className="mt-2 overflow-x-auto overflow-y-hidden py-1 text-center">
            <Katex expr={`A^{-1} = ${invTex(matOf(sc.sys))}`} className="whitespace-nowrap text-base text-violet-100" />
          </div>
        ) : null}
      </div>

      <StepRunner key={sc.id} steps={sc.steps} accent="emerald" finale={sc.wrap} />

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">{REAL_NOTE}</p>
    </div>
  );
}
