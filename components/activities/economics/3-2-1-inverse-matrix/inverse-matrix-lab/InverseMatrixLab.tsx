"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  ALPHABET,
  CIPHER_STEPS,
  HUNT_CARDS,
  HUNT_STEPS,
  KEYS,
  KNOB_MAX,
  KNOB_MIN,
  KNOB_START,
  LEARN_STEPS,
  MISSIONS,
  REAL_NOTE,
  SCENES,
  SECRETS,
  adj2,
  charOf,
  cipherOf,
  codeOf,
  colsOf,
  det2,
  detTex,
  encodePair,
  fmt,
  hasInverse,
  inv2,
  invTex,
  matTex,
  missionDone,
  mulM,
  plainOf,
  type Key,
  type Mat,
  type Piece,
  type Secret,
  type Step,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "exist",
    prompt:
      "행렬식 ad − bc 가 0 이면 역행렬이 없었어요. 왜 그런지 역행렬의 식과 이어서 설명하고, 행렬식이 0 이 되는 행렬들이 생김새에서 어떤 공통점을 가졌는지도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 역행렬은 행렬식의 역수를 곱한 꼴이라 행렬식이 0 이면 그 역수를 만들 수 없다. 그런 행렬은 한 가로줄이 다른 가로줄의 몇 배이거나 한 줄이 통째로 0 이어서, 사실 조건이 하나뿐인 셈이었다.",
  },
  {
    id: "solve",
    prompt:
      "모르는 값 두 개를 역행렬로 한꺼번에 구해 보았어요. AX = B 에서 왜 X = A⁻¹B 가 되는지 쓰고, 하나씩 소거해서 푸는 것과 견주어 어떤 점이 좋았는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 양변의 왼쪽에 A⁻¹ 을 곱하면 A⁻¹AX = EX = X 가 되어 X 만 남는다. 조건이 바뀌어도 A 가 같으면 역행렬을 다시 구하지 않고 B 만 갈아 끼우면 되어 편했다.",
  },
  {
    id: "cipher",
    prompt:
      "행렬로 글자를 암호로 바꾸고 역행렬로 되돌려 보았어요. 역행렬이 여기서 무슨 구실을 했는지, 그리고 열쇠의 행렬식을 1 로 고른 까닭을 적은 뒤, 이런 방법을 또 어디에 써 볼 수 있을지 하나 들어 보세요.",
    kind: "text",
    placeholder:
      "예: 열쇠를 곱해 뒤섞은 것을 역행렬이 정확히 되돌려 주는 열쇠 구실을 했다. 행렬식이 1 이라야 역행렬이 정수여서 푼 값이 글자 번호로 딱 떨어진다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "lab" | "real" | "cipher" | "hunt";

export default function InverseMatrixLab() {
  const [tab, setTab] = useState<Tab>("lab");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🔑 역행렬과 행렬식</h3>
        <p className="mt-2 leading-7 text-slate-300">
          곱해서 <b className="text-emerald-200">단위행렬</b>이 되는 짝꿍을 역행렬이라 해요. 그런 짝꿍이 있는지 없는지는{" "}
          <b className="text-amber-200">행렬식 ad − bc</b> 하나가 정합니다. 손잡이로 만들어 보고, 값 알아내기에 써 보고,
          암호까지 풀어 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "lab"} onClick={() => setTab("lab")}>① 역행렬 실험실</TabButton>
        <TabButton active={tab === "real"} onClick={() => setTab("real")}>② 값 알아내기</TabButton>
        <TabButton active={tab === "cipher"} onClick={() => setTab("cipher")}>③ 행렬 암호</TabButton>
        <TabButton active={tab === "hunt"} onClick={() => setTab("hunt")}>④ 행렬식 사냥</TabButton>
      </div>

      <div className="mt-4">
        {tab === "lab" ? <LabTab /> : null}
        {tab === "real" ? <RealTab /> : null}
        {tab === "cipher" ? <CipherTab /> : null}
        {tab === "hunt" ? <HuntTab /> : null}
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
type Tone = "base" | "dim" | "a" | "b" | "res" | "diag" | "off" | "hit" | "miss" | "ghost";

const CELL_TONE: Record<Tone, string> = {
  base: "border-white/10 bg-white/[0.05] text-slate-100",
  dim: "border-white/5 bg-white/[0.02] text-slate-500",
  a: "border-sky-400/35 bg-sky-400/10 text-sky-100",
  b: "border-amber-400/35 bg-amber-400/10 text-amber-100",
  res: "border-violet-400/35 bg-violet-400/12 text-violet-100",
  diag: "border-emerald-400/60 bg-emerald-400/20 text-emerald-100",
  off: "border-fuchsia-400/60 bg-fuchsia-400/20 text-fuchsia-100",
  hit: "border-emerald-400/70 bg-emerald-400/20 text-emerald-100",
  miss: "border-rose-400/70 bg-rose-400/20 text-rose-100",
  ghost: "border-dashed border-white/20 bg-white/[0.02] text-slate-500",
};
const CELL_SIZE: Record<string, string> = {
  sm: "h-8 min-w-[2.1rem] px-1 text-xs",
  md: "h-9 min-w-[2.7rem] px-1.5 text-sm",
  lg: "h-10 min-w-[3.4rem] px-2 text-base",
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
  size = "md",
  label,
  texCell,
}: {
  m: Mat;
  tones?: Tone[][];
  size?: "sm" | "md" | "lg";
  label?: string;
  texCell?: (i: number, j: number) => string;
}) {
  const cols = colsOf(m);
  return (
    <div className="inline-flex flex-col items-center gap-1">
      {label ? <span className="text-xs font-bold text-slate-400">{label}</span> : null}
      <div className="flex items-stretch gap-1">
        <Bracket side="l" />
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {m.map((row, i) =>
            row.map((v, j) => (
              <div
                key={`${i}-${j}`}
                className={
                  "flex items-center justify-center rounded-md border font-mono tabular-nums " +
                  CELL_SIZE[size] +
                  " " +
                  CELL_TONE[tones?.[i]?.[j] ?? "base"]
                }
              >
                {texCell ? <Katex expr={texCell(i, j)} /> : <span>{fmt(v)}</span>}
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
//  탭 ① 역행렬 실험실
// ══════════════════════════════════════════════════════════════
const KNOB_LABEL: Record<string, string> = { a: "a (왼쪽 위)", b: "b (오른쪽 위)", c: "c (왼쪽 아래)", d: "d (오른쪽 아래)" };
const KNOB_ACCENT: Record<string, string> = {
  a: "accent-emerald-400",
  b: "accent-fuchsia-400",
  c: "accent-fuchsia-400",
  d: "accent-emerald-400",
};
/** 대각선은 초록, 나머지는 자홍 — 짝 행렬을 만들 때 하는 일이 다르다 */
const LAB_TONES: Tone[][] = [
  ["diag", "off"],
  ["off", "diag"],
];

function Knob({ name, value, onChange }: { name: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-bold text-slate-300">{KNOB_LABEL[name]}</span>
        <span className="font-mono text-sm text-slate-100">{value}</span>
      </div>
      <input
        type="range"
        min={KNOB_MIN}
        max={KNOB_MAX}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-1 w-full " + KNOB_ACCENT[name]}
      />
    </div>
  );
}

function LabTab() {
  const [a, setA] = useState(KNOB_START.a);
  const [b, setB] = useState(KNOB_START.b);
  const [c, setC] = useState(KNOB_START.c);
  const [d, setD] = useState(KNOB_START.d);
  const [check, setCheck] = useState(false);
  const [msi, setMsi] = useState(0);
  const [cleared, setCleared] = useState<Record<string, boolean>>({});

  const A: Mat = [
    [a, b],
    [c, d],
  ];
  const k = det2(A);
  const inv = inv2(A);
  const ms = MISSIONS[msi];
  const hit = missionDone(ms, A);
  const doneCount = MISSIONS.filter((z) => cleared[z.id] === true).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.07] to-sky-500/[0.04] p-4">
        <p className="text-sm font-bold text-emerald-200">🎛️ 네 손잡이로 행렬을 바꿔 보세요</p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
            <Knob name="a" value={a} onChange={setA} />
            <Knob name="b" value={b} onChange={setB} />
            <Knob name="c" value={c} onChange={setC} />
            <Knob name="d" value={d} onChange={setD} />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-2 overflow-x-auto overflow-y-hidden py-1">
              <MatrixView m={A} label="A" tones={LAB_TONES} size="lg" />
              <div className="flex flex-col items-center gap-1 pb-1">
                <span className="text-[11px] font-bold text-slate-400">짝 행렬</span>
                <span className="text-[10px] leading-4 text-slate-500">초록은 자리 바꿈</span>
                <span className="text-[10px] leading-4 text-slate-500">자홍은 부호 바꿈</span>
              </div>
              <MatrixView m={adj2(A)} tones={LAB_TONES} size="lg" />
            </div>

            <div
              className={
                "rounded-xl border-2 px-3 py-3 text-center " +
                (k === 0 ? "border-rose-400/50 bg-rose-400/10" : "border-emerald-400/50 bg-emerald-400/10")
              }
            >
              <p className="text-[11px] text-slate-300">행렬식</p>
              <div className="mt-1 overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={detTex(A)} className="whitespace-nowrap text-lg text-slate-100" />
              </div>
              <p className={"mt-1 text-sm font-bold " + (k === 0 ? "text-rose-200" : "text-emerald-200")}>
                {k === 0 ? "🚫 역행렬이 없어요" : "✅ 역행렬이 있어요"}
              </p>
            </div>

            <div className="min-h-[70px] rounded-xl border border-white/10 bg-slate-900/50 p-3 text-center">
              {inv ? (
                <div className="overflow-x-auto overflow-y-hidden py-1">
                  <Katex expr={`A^{-1} = ${invTex(A)}`} className="whitespace-nowrap text-lg text-violet-100" />
                </div>
              ) : (
                <p className="text-xs leading-6 text-slate-400">
                  행렬식이 0 이라 역수를 만들 수 없어요. 위 줄과 아래 줄이 서로 같은 방향인지 살펴보세요.
                </p>
              )}
            </div>

            {inv ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setCheck(!check)}
                  className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition " + ACC_BTN.emerald}
                >
                  {check ? "🔍 검산 접기" : "🔍 정말 단위행렬이 될까?"}
                </button>
                {check ? (
                  <div className="flex flex-wrap items-end justify-center gap-x-2 gap-y-2 overflow-x-auto overflow-y-hidden py-1">
                    <MatrixView m={A} tones={LAB_TONES} size="sm" />
                    <span className="pb-2 text-lg font-bold text-slate-300">·</span>
                    <MatrixView m={inv} tones={[["res", "res"], ["res", "res"]]} size="sm" />
                    <span className="pb-2 text-lg font-bold text-slate-300">=</span>
                    <MatrixView m={mulM(A, inv)} tones={[["hit", "hit"], ["hit", "hit"]]} size="sm" label="단위행렬" />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "대각선의 a 와 d 는 자리를 바꾸고, b 와 c 는 부호를 바꾸면 짝 행렬이 돼요.",
              "짝 행렬에 행렬식의 역수를 곱한 것이 역행렬이에요.",
              "행렬식이 0 이면 역수를 만들 수 없어 역행렬이 없어요.",
              "행렬식이 1 이나 -1 이면 역행렬의 성분이 모두 정수로 떨어져요.",
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
            지금 행렬로 확인
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
          {cleared[ms.id] === true ? <Verdict ok>목표를 이뤘어요! 행렬식은 {k} 입니다.</Verdict> : <TipBox>{ms.hint}</TipBox>}
        </div>

        {doneCount === MISSIONS.length ? (
          <div className="mt-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3 text-center">
            <p className="text-sm font-bold text-emerald-100">🏆 네 미션을 모두 이뤘어요!</p>
            <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-slate-200">
              역행렬이 있는지 없는지는 오직 행렬식 하나가 정한다는 것을 손으로 확인했어요.
            </p>
          </div>
        ) : null}
      </div>

      <StepRunner steps={LEARN_STEPS} accent="emerald" finale="역행렬을 구하는 법을 익혔어요. 이제 실제 문제를 풀어 볼 차례예요!" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 값 알아내기
// ══════════════════════════════════════════════════════════════
function RealTab() {
  const [si, setSi] = useState(0);
  const sc = SCENES[si];
  const k = det2(sc.A);

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

        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3">
          <p className="text-[11px] leading-5 text-slate-400">
            <b className="text-violet-200">x</b> = {sc.names[0]}, <b className="text-violet-200">y</b> = {sc.names[1]} 이라 하면 (단위{" "}
            {sc.unit})
          </p>
          <div className="mt-2 overflow-x-auto overflow-y-hidden py-1">
            <Katex
              expr={`${matTex(sc.A)} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = ${matTex(sc.B)}`}
              className="whitespace-nowrap text-lg text-slate-100"
            />
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">
            양변의 왼쪽에 <Katex expr="A^{-1}" className="text-emerald-200" /> 을 곱하면{" "}
            <Katex expr="X = A^{-1}B" className="text-emerald-200" /> 가 돼요. 이 행렬의 행렬식은{" "}
            <b className={k === 0 ? "text-rose-200" : "text-amber-200"}>{k}</b> 입니다.
          </p>
        </div>
      </div>

      <StepRunner key={sc.id} steps={sc.steps} accent="sky" finale={sc.wrap} />

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">{REAL_NOTE}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 행렬 암호
// ══════════════════════════════════════════════════════════════
function CipherMaker() {
  const [ki, setKi] = useState(0);
  const [pick, setPick] = useState<string[]>(["수", "학"]);

  const key = KEYS[ki];
  const ready = pick.length === 2;
  const code = ready ? encodePair(key.m, pick[0], pick[1]) : null;

  const tap = (ch: string) => {
    setPick((z) => (z.length >= 2 ? [ch] : [...z, ch]));
  };

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.07] to-sky-500/[0.04] p-4">
      <p className="text-sm font-bold text-violet-200">🔐 암호 만들기 — 두 글자를 골라 보세요</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {KEYS.map((z, i) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setKi(i)}
            className={
              "flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-xs font-bold transition " +
              (ki === i ? ACC_CHIP.violet : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span>{z.name}</span>
            <Katex expr={matTex(z.m)} />
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-10 gap-1">
        {ALPHABET.map((ch) => {
          const on = pick.includes(ch);
          return (
            <button
              key={ch}
              type="button"
              onClick={() => tap(ch)}
              className={
                "flex h-9 flex-col items-center justify-center rounded-md border text-sm font-bold transition " +
                (on ? "border-violet-400/70 bg-violet-400/25 text-violet-50" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              <span>{ch}</span>
              <span className="font-mono text-[8px] leading-none text-slate-500">{codeOf(ch)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 p-3">
        {ready && code ? (
          <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-2 overflow-x-auto overflow-y-hidden py-1">
            <MatrixView m={key.m} label={key.name} tones={[["a", "a"], ["a", "a"]]} />
            <span className="pb-3 text-xl font-bold text-slate-300">·</span>
            <MatrixView
              m={[[codeOf(pick[0])], [codeOf(pick[1])]]}
              label={`${pick[0]} ${pick[1]}`}
              tones={[["b"], ["b"]]}
            />
            <span className="pb-3 text-xl font-bold text-slate-300">=</span>
            <MatrixView m={[[code[0]], [code[1]]]} label="암호" tones={[["hit"], ["hit"]]} />
          </div>
        ) : (
          <p className="py-3 text-center text-xs text-slate-400">글자를 두 개 누르면 암호 숫자가 만들어져요.</p>
        )}
        {ready && code ? (
          <p className="mt-2 text-center text-xs leading-6 text-slate-300">
            「{pick[0]}{pick[1]}」 의 암호는{" "}
            <b className="font-mono text-emerald-200">
              {code[0]}, {code[1]}
            </b>{" "}
            예요. 이 두 수만 보고는 원래 글자를 알 수 없지요.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CipherSolver() {
  const [si, setSi] = useState(0);
  const [vals, setVals] = useState<Record<string, Record<string, string>>>({});
  const [graded, setGraded] = useState<Record<string, boolean>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});

  const s: Secret = SECRETS[si];
  const key = KEYS.find((z) => z.id === s.keyId) as Key;
  const inv = inv2(key.m) as Mat;
  const cipher = cipherOf(s);
  const plain = plainOf(s);
  const cur = vals[s.id] ?? {};
  const isGraded = graded[s.id] === true;

  const solved = (z: Secret) => {
    const v = vals[z.id] ?? {};
    return plainOf(z).every((p, i) => sameNum(v[`${i},0`] ?? "", p[0]) && sameNum(v[`${i},1`] ?? "", p[1]));
  };
  const okNow = solved(s);
  const clearedCount = SECRETS.filter((z) => graded[z.id] === true && solved(z)).length;
  const filledAny = Object.values(cur).some((v) => v.trim() !== "");

  return (
    <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-amber-200">🕵️ 암호 풀기 — 역행렬을 곱해 원래 글자를 되찾아요</p>
        <span className="font-mono text-xs text-slate-300">
          해결 {clearedCount} / {SECRETS.length}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SECRETS.map((z, i) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setSi(i)}
            className={
              "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
              (si === i
                ? "border-amber-400/60 bg-amber-400/20 text-amber-100"
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
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 overflow-x-auto overflow-y-hidden py-1">
          <div className="flex items-end gap-2">
            <MatrixView m={key.m} label={`${key.name} (암호를 만든 열쇠)`} tones={[["a", "a"], ["a", "a"]]} size="sm" />
          </div>
          <div className="flex items-end gap-2">
            <MatrixView m={inv} label="그 역행렬" tones={[["res", "res"], ["res", "res"]]} size="sm" />
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-slate-300">받은 암호</p>
        <div className="mt-1 flex flex-wrap items-start justify-center gap-4 overflow-x-auto overflow-y-hidden py-1">
          {cipher.map((cpair, i) => {
            const m0 = !isGraded ? "none" : sameNum(cur[`${i},0`] ?? "", plain[i][0]) ? "right" : "wrong";
            const m1 = !isGraded ? "none" : sameNum(cur[`${i},1`] ?? "", plain[i][1]) ? "right" : "wrong";
            const g0 = Number(cleanNum(cur[`${i},0`] ?? ""));
            const g1 = Number(cleanNum(cur[`${i},1`] ?? ""));
            return (
              <div key={i} className="flex items-end gap-2">
                <MatrixView m={[[cpair[0]], [cpair[1]]]} label={`${i + 1}번째`} tones={[["b"], ["b"]]} size="sm" />
                <span className="pb-2 text-lg font-bold text-slate-300">→</span>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-slate-400">글자 번호</span>
                  <div className="flex items-stretch gap-1">
                    <Bracket side="l" />
                    <div className="grid gap-1">
                      {[0, 1].map((j) => (
                        <input
                          key={j}
                          type="text"
                          inputMode="numeric"
                          value={cur[`${i},${j}`] ?? ""}
                          onChange={(e) => {
                            setVals((z) => ({ ...z, [s.id]: { ...(z[s.id] ?? {}), [`${i},${j}`]: e.target.value } }));
                            setGraded((z) => ({ ...z, [s.id]: false }));
                          }}
                          className={
                            "h-8 w-14 rounded-md border-2 text-center font-mono text-sm tabular-nums outline-none transition " +
                            INPUT_MARK[j === 0 ? m0 : m1]
                          }
                        />
                      ))}
                    </div>
                    <Bracket side="r" />
                  </div>
                  <span className="text-lg font-bold text-emerald-200">
                    {isGraded && okNow ? charOf(g0) + charOf(g1) : "??"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!filledAny}
            onClick={() => setGraded((z) => ({ ...z, [s.id]: true }))}
            className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.amber}
          >
            확인
          </button>
          <button
            type="button"
            onClick={() => setHints((z) => ({ ...z, [s.id]: !z[s.id] }))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            💡 힌트
          </button>
          <button
            type="button"
            onClick={() => {
              setVals((z) => ({ ...z, [s.id]: {} }));
              setGraded((z) => ({ ...z, [s.id]: false }));
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 다시
          </button>
          {isGraded && okNow && si < SECRETS.length - 1 ? (
            <button
              type="button"
              onClick={() => setSi(si + 1)}
              className="rounded-lg border-2 border-emerald-400/55 bg-emerald-400/15 px-4 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/25"
            >
              다음 암호 →
            </button>
          ) : null}
        </div>

        {hints[s.id] ? (
          <div className="mt-2">
            <TipBox>{s.hint}</TipBox>
          </div>
        ) : null}

        <div className="mt-2 min-h-[38px]">
          {isGraded && okNow ? (
            <Verdict ok>숨은 말은 「{s.word}」 였어요! 역행렬이 암호를 정확히 되돌려 주었습니다.</Verdict>
          ) : isGraded ? (
            <Verdict ok={false}>빨간 칸을 다시 보세요. 역행렬의 가로줄과 암호의 세로줄을 곱해 더하면 돼요.</Verdict>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-1 text-[11px] font-bold text-slate-400">글자표</p>
        <div className="grid grid-cols-10 gap-1">
          {ALPHABET.map((ch) => (
            <div key={ch} className="flex h-9 flex-col items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-sm font-bold text-slate-200">
              <span>{ch}</span>
              <span className="font-mono text-[8px] leading-none text-slate-500">{codeOf(ch)}</span>
            </div>
          ))}
        </div>
      </div>

      {clearedCount === SECRETS.length ? (
        <div className="mt-3 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3 text-center">
          <p className="text-sm font-bold text-emerald-100">🏆 네 암호를 모두 풀었어요!</p>
          <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-slate-200">
            열쇠를 아는 사람만 되돌릴 수 있다는 것, 그것이 역행렬이 암호에 쓰이는 까닭이에요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CipherTab() {
  return (
    <div className="space-y-4">
      <CipherMaker />
      <CipherSolver />
      <StepRunner steps={CIPHER_STEPS} accent="violet" finale="곱해서 숨기고 역행렬로 되돌리기 — 역행렬의 가장 멋진 쓰임이에요." />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 행렬식 사냥
// ══════════════════════════════════════════════════════════════
function HuntTab() {
  const [bag, setBag] = useState<Record<string, boolean>>({});
  const [graded, setGraded] = useState(false);

  const want = HUNT_CARDS.filter(hasInverse);
  const picked = HUNT_CARDS.filter((c) => bag[c.id]);
  const correct = picked.length === want.length && want.every((c) => bag[c.id]);
  const rightCount = HUNT_CARDS.filter((c) => (bag[c.id] === true) === hasInverse(c)).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-500/[0.07] to-emerald-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-sky-200">🃏 역행렬이 있는 카드만 담아 보세요</p>
          <span className="font-mono text-xs text-slate-300">담은 카드 {picked.length}장</span>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {HUNT_CARDS.map((c) => {
            const on = bag[c.id] === true;
            const yes = hasInverse(c);
            const right = graded && on === yes;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setBag((z) => ({ ...z, [c.id]: !z[c.id] }));
                  setGraded(false);
                }}
                className={
                  "flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2 transition " +
                  (graded
                    ? right
                      ? "border-emerald-400/70 bg-emerald-400/15"
                      : "border-rose-400/60 bg-rose-400/15"
                    : on
                      ? "border-sky-400/60 bg-sky-400/20"
                      : "border-white/10 bg-white/5 hover:bg-white/10")
                }
              >
                <span className="text-[10px] font-bold text-slate-400">{on ? "🎒 담음" : "빈 카드"}</span>
                <Katex expr={matTex(c.m)} className="text-slate-100" />
                {graded ? (
                  <span className={"font-mono text-[11px] " + (yes ? "text-emerald-200" : "text-rose-200")}>det = {det2(c.m)}</span>
                ) : null}
                {graded && !yes ? <span className="text-[10px] leading-4 text-rose-200">{c.why}</span> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() => setGraded(true)}
            className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.sky}
          >
            확인
          </button>
          <button
            type="button"
            onClick={() => {
              setBag({});
              setGraded(false);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 다시
          </button>
        </div>

        <div className="mt-2 min-h-[38px]">
          {graded && correct ? (
            <Verdict ok>여섯 장을 정확히 담았어요! 남은 여섯 장은 모두 행렬식이 0 이에요.</Verdict>
          ) : graded ? (
            <Verdict ok={false}>
              열두 장 가운데 {rightCount}장을 맞게 판단했어요. 초록 테두리는 맞은 것, 빨간 테두리는 틀린 것이에요. 카드마다 적힌
              행렬식을 보고 다시 담아 보세요.
            </Verdict>
          ) : (
            <TipBox>카드마다 ad − bc 를 계산해 보세요. 0 이 아니면 담고, 0 이면 그냥 두면 돼요.</TipBox>
          )}
        </div>
      </div>

      <StepRunner steps={HUNT_STEPS} accent="sky" finale="행렬식 하나로 역행렬이 있는지 없는지 한눈에 가를 수 있게 되었어요." />
    </div>
  );
}
