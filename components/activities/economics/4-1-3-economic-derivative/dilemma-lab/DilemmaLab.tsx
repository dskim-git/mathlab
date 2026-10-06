"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  DOM_STEPS,
  DUEL_STEPS,
  ESCAPE_STEPS,
  FINE_GAME,
  FINE_MAX,
  GAMES,
  KNOB_MAX,
  KNOB_MIN,
  KNOB_START,
  KNOB_STEP,
  LEAGUE_STEPS,
  REAL_NOTE,
  RIVALS,
  ROUNDS,
  STRATEGIES,
  duel,
  judge,
  league,
  payoff,
  won,
  type Game,
  type Move,
  type Piece,
  type Step,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_bad",
    prompt:
      "두 사람이 각자 가장 똑똑한 선택을 했는데도 둘 다 손해를 보았어요. 그런 일이 왜 생기는지 보수표를 근거로 자기 말로 설명하고, 활동에서 다룬 다섯 상황 가운데 하나를 골라 그 구조를 짚어 보세요.",
    kind: "text",
    placeholder:
      "예: 상대가 협력해도 배신해도 내 보수는 배신 쪽이 커서 둘 다 배신을 고른다. 그런데 둘 다 배신한 칸의 값이 둘 다 협력한 칸보다 작아 결국 손해가 된다. 바다 싹쓸이가 꼭 그랬다.",
  },
  {
    id: "repeat",
    prompt:
      "한 판만 할 때와 여러 판을 되풀이할 때 좋은 선택이 달라졌어요. 리그에서 관찰한 전략들의 성적을 근거로, 되풀이하는 사이에서 어떤 태도가 살아남았는지 쓰고 그 까닭도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 늘 협력은 늘 배신에게 계속 당했고, 맞대응은 첫 판만 당하고 그 뒤로 갚아 주어 손해가 작았다. 먼저 배신하지 않되 당하면 갚는 태도가 다시 만나는 사이에서는 유리했다.",
  },
  {
    id: "rule",
    prompt:
      "보수를 바꾸거나 벌금을 매기자 지배전략 자체가 바뀌었어요. 사람의 마음을 바꾸지 않고 규칙만 바꿔도 결과가 달라지는 까닭을 쓰고, 우리 주변에서 그런 규칙의 예를 하나 들어 보세요.",
    kind: "text",
    placeholder:
      "예: 벌금이 배신의 유혹보다 커지자 배신 칸의 값이 낮아져 협력이 지배전략이 되었다. 사람은 똑같이 자기에게 좋은 쪽을 고르는데 보수가 달라진 것이다. 쓰레기 무단 투기 과태료가 그런 예다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "dom" | "duel" | "league" | "escape";

export default function DilemmaLab() {
  const [tab, setTab] = useState<Tab>("dom");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🤝 죄수의 딜레마</h3>
        <p className="mt-2 leading-7 text-slate-300">
          둘 다 <b className="text-sky-200">가장 똑똑하게</b> 골랐는데 왜 둘 다 손해일까요? 보수표를 읽고, 직접 겨뤄 보고,
          전략끼리 <b className="text-amber-200">리그</b>를 열어 보고, 규칙을 바꿔 딜레마를 빠져나와 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "dom"} onClick={() => setTab("dom")}>① 딜레마 실험실</TabButton>
        <TabButton active={tab === "duel"} onClick={() => setTab("duel")}>② 한 판 승부</TabButton>
        <TabButton active={tab === "league"} onClick={() => setTab("league")}>③ 전략 리그</TabButton>
        <TabButton active={tab === "escape"} onClick={() => setTab("escape")}>④ 조건과 탈출</TabButton>
      </div>

      <div className="mt-4">
        {tab === "dom" ? <DomTab /> : null}
        {tab === "duel" ? <DuelTab /> : null}
        {tab === "league" ? <LeagueTab /> : null}
        {tab === "escape" ? <EscapeTab /> : null}
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
//  공용 — 조각 글
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
//  공용 — 보수표
// ══════════════════════════════════════════════════════════════
const GW = 380;
const GH = 330;
const GX = 124;
const GY = 86;
const CW = 122;
const CH = 108;

type Pay = { R: number; T: number; P: number; S: number };

/** 내 수 · 상대 수 → [내 보수, 상대 보수] */
function cellPay(p: Pay, mine: Move, theirs: Move): [number, number] {
  return [payoff(p, mine, theirs), payoff(p, theirs, mine)];
}

function PayoffGrid({
  p,
  coopLabel,
  defectLabel,
  meName,
  youName,
  /** 상대의 수를 고정해 그 줄만 밝힌다 */
  lockTheirs,
  /** 균형 칸을 반짝인다 */
  equilibrium,
  /** 내게 더 나은 칸에 체크를 붙인다 */
  showBetter,
}: {
  p: Pay;
  coopLabel: string;
  defectLabel: string;
  meName: string;
  youName: string;
  lockTheirs?: Move;
  equilibrium?: [Move, Move] | null;
  showBetter?: boolean;
}) {
  const cols: Move[] = ["C", "D"];
  const rows: Move[] = ["C", "D"];
  const label = (m: Move) => (m === "C" ? coopLabel : defectLabel);

  const better: Move | null =
    showBetter && lockTheirs
      ? payoff(p, "C", lockTheirs) === payoff(p, "D", lockTheirs)
        ? null
        : payoff(p, "C", lockTheirs) > payoff(p, "D", lockTheirs)
          ? "C"
          : "D"
      : null;

  return (
    <svg viewBox={"0 0 " + GW + " " + GH} className="w-full max-w-[380px]" role="img" aria-label="보수표">
      {/* 머리말 */}
      <rect x={GX} y={10} width={CW * 2} height={22} rx={6} fill="rgba(251,191,36,0.16)" stroke="rgba(251,191,36,0.5)" />
      <text x={GX + CW} y={25} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fcd34d">
        {meName}의 선택
      </text>
      <rect x={4} y={GY + CH - 11} width={110} height={22} rx={6} fill="rgba(56,189,248,0.16)" stroke="rgba(56,189,248,0.5)" />
      <text x={59} y={GY + CH + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#7dd3fc">
        {youName}의 선택
      </text>

      {cols.map((c, j) => (
        <text key={"ch" + j} x={GX + CW * j + CW / 2} y={GY - 10} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#e2e8f0">
          {label(c)}
        </text>
      ))}
      {rows.map((r, i) => (
        <text key={"rh" + i} x={GX - 8} y={GY + CH * i + CH / 2 + 4} textAnchor="end" fontSize="12" fontWeight="bold" fill="#e2e8f0">
          {label(r)}
        </text>
      ))}

      {rows.map((r, i) =>
        cols.map((c, j) => {
          const x = GX + CW * j;
          const y = GY + CH * i;
          const [mine, theirs] = cellPay(p, c, r);
          const dim = lockTheirs !== undefined && lockTheirs !== r;
          const isEq = equilibrium !== null && equilibrium !== undefined && equilibrium[0] === c && equilibrium[1] === r;
          const isBetter = better !== null && lockTheirs === r && better === c;
          return (
            <g key={"c" + i + j} opacity={dim ? 0.3 : 1}>
              <polygon
                points={`${x},${y} ${x + CW},${y} ${x + CW},${y + CH}`}
                fill="rgba(251,191,36,0.14)"
                stroke="rgba(255,255,255,0.08)"
              />
              <polygon
                points={`${x},${y} ${x},${y + CH} ${x + CW},${y + CH}`}
                fill="rgba(56,189,248,0.14)"
                stroke="rgba(255,255,255,0.08)"
              />
              {/* 칸을 가르는 대각선은 왼쪽 위 → 오른쪽 아래 하나뿐이다 (두 폴리곤이 맞닿는 선) */}
              <line x1={x} y1={y} x2={x + CW} y2={y + CH} stroke="rgba(255,255,255,0.35)" />
              <rect
                x={x}
                y={y}
                width={CW}
                height={CH}
                fill="none"
                stroke={isEq ? "#f472b6" : isBetter ? "#34d399" : "rgba(255,255,255,0.22)"}
                strokeWidth={isEq || isBetter ? 3 : 1.2}
                className={isEq ? "animate-pulse" : undefined}
              />
              <text x={x + CW - 10} y={y + 28} textAnchor="end" fontSize="16" fontWeight="bold" fill="#fcd34d">
                {won(mine)}
              </text>
              <text x={x + 10} y={y + CH - 14} textAnchor="start" fontSize="16" fontWeight="bold" fill="#7dd3fc">
                {won(theirs)}
              </text>
              {/* 체크는 대각선 위가 아니라 내 쪽(오른쪽 위) 삼각형 안에 둔다 */}
              {isBetter ? (
                <text x={x + CW * 0.74} y={y + CH * 0.58} textAnchor="middle" fontSize="20" fill="#34d399">
                  ✓
                </text>
              ) : null}
            </g>
          );
        }),
      )}

      <text x={GX} y={GH - 8} textAnchor="start" fontSize="10" fill="#fcd34d">
        ◥ 오른쪽 위 노랑 = {meName}
      </text>
      <text x={GX + CW * 2} y={GH - 8} textAnchor="end" fontSize="10" fill="#7dd3fc">
        왼쪽 아래 파랑 = {youName} ◣
      </text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
//  공용 — 안내 · 판정 · 보기 · 손잡이
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

type Accent = "sky" | "emerald" | "violet" | "amber" | "rose";
const ACC_PANEL: Record<Accent, string> = {
  sky: "border-sky-400/25 bg-sky-500/[0.06]",
  emerald: "border-emerald-400/25 bg-emerald-500/[0.06]",
  violet: "border-violet-400/25 bg-violet-500/[0.06]",
  amber: "border-amber-400/25 bg-amber-500/[0.06]",
  rose: "border-rose-400/25 bg-rose-500/[0.06]",
};
const ACC_BTN: Record<Accent, string> = {
  sky: "border-sky-400/55 bg-sky-400/15 text-sky-100 hover:bg-sky-400/25",
  emerald: "border-emerald-400/55 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25",
  violet: "border-violet-400/55 bg-violet-400/15 text-violet-100 hover:bg-violet-400/25",
  amber: "border-amber-400/55 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25",
  rose: "border-rose-400/55 bg-rose-400/15 text-rose-100 hover:bg-rose-400/25",
};
const ACC_CHIP: Record<Accent, string> = {
  sky: "border-sky-400/60 bg-sky-400/20 text-sky-100",
  emerald: "border-emerald-400/60 bg-emerald-400/20 text-emerald-100",
  violet: "border-violet-400/60 bg-violet-400/20 text-violet-100",
  amber: "border-amber-400/60 bg-amber-400/20 text-amber-100",
  rose: "border-rose-400/60 bg-rose-400/20 text-rose-100",
};
const KNOB_ACC: Record<Accent, string> = {
  sky: "accent-sky-400",
  emerald: "accent-emerald-400",
  violet: "accent-violet-400",
  amber: "accent-amber-400",
  rose: "accent-rose-400",
};

function PickRow({
  items,
  at,
  accent,
  onPick,
}: {
  items: { id: string; emoji: string; title: string }[];
  at: number;
  accent: Accent;
  onPick: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((v, i) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onPick(i)}
          className={
            "rounded-lg border px-2.5 py-1.5 text-xs font-bold transition " +
            (at === i ? ACC_CHIP[accent] : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
          }
        >
          {v.emoji} {v.title}
        </button>
      ))}
    </div>
  );
}

function Knob({
  label,
  value,
  min,
  max,
  step,
  accent,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  accent: Accent;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-bold text-slate-300">{label}</span>
        <span className="font-mono text-sm text-slate-100">
          {won(value)}
          {suffix ? <span className="ml-0.5 text-[10px] text-slate-400">{suffix}</span> : null}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-1 w-full " + KNOB_ACC[accent]}
      />
    </div>
  );
}

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
const INPUT_MARK: Record<string, string> = {
  none: "border-white/15 bg-white/[0.06] text-slate-100 focus:border-emerald-400/60",
  right: "border-emerald-400/70 bg-emerald-400/15 text-emerald-100",
  wrong: "border-rose-400/70 bg-rose-400/15 text-rose-100",
};

function stepDone(s: Step, picks: Record<string, number>, nums: Record<string, string>): boolean {
  if (s.kind === "choice") return picks[s.id] === s.answer;
  return sameNum(nums[s.id] ?? "", s.answer);
}

function StepRunner({ steps, accent, finale }: { steps: Step[]; accent: Accent; finale?: string }) {
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [nums, setNums] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState<Record<string, boolean>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});

  const s = steps[at];
  const isGraded = graded[s.id] === true;
  const okNow = stepDone(s, picks, nums);
  const clearedCount = steps.filter((z) => graded[z.id] === true && stepDone(z, picks, nums)).length;
  const allClear = clearedCount === steps.length;
  const canAnswer = s.kind === "choice" ? picks[s.id] !== undefined : cleanNum(nums[s.id] ?? "") !== "";

  return (
    <div className={"space-y-3 rounded-2xl border p-4 " + ACC_PANEL[accent]}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {steps.map((z, i) => {
            const cleared = graded[z.id] === true && stepDone(z, picks, nums);
            const open = i === 0 || (graded[steps[i - 1].id] === true && stepDone(steps[i - 1], picks, nums));
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
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="text"
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
      )}

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
        ) : isGraded ? (
          <Verdict ok={false}>아직 맞지 않아요. 다시 한 번 살펴보세요.</Verdict>
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
//  탭 ① 딜레마 실험실
// ══════════════════════════════════════════════════════════════
function DomTab() {
  const [gi, setGi] = useState(0);
  const [lock, setLock] = useState<Move | null>(null);
  const [seen, setSeen] = useState<Record<string, boolean>>({});

  const g: Game = GAMES[gi];
  const both = seen.C === true && seen.D === true;

  const look = (m: Move) => {
    setLock(m);
    setSeen((z) => ({ ...z, [m]: true }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-500/[0.07] to-amber-500/[0.04] p-4">
        <p className="text-sm font-bold text-sky-200">🔍 상대의 선택을 하나씩 고정해 두고 내 두 선택을 견주어 보세요</p>

        <div className="mt-2">
          <PickRow
            items={GAMES}
            at={gi}
            accent="sky"
            onPick={(i) => {
              setGi(i);
              setLock(null);
              setSeen({});
            }}
          />
        </div>

        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-6 text-slate-300">
          {g.emoji} {g.story} <span className="text-slate-500">(숫자가 클수록 좋아요 · 단위 {g.unit})</span>
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="flex justify-center">
            <PayoffGrid
              p={g}
              coopLabel={g.coop}
              defectLabel={g.defect}
              meName={g.me}
              youName={g.you}
              lockTheirs={lock ?? undefined}
              showBetter={lock !== null}
              equilibrium={both ? ["D", "D"] : null}
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => look("C")}
                className={
                  "rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " +
                  (lock === "C" ? ACC_CHIP.sky : ACC_BTN.sky)
                }
              >
                {g.you}가 「{g.coop}」 한다면
              </button>
              <button
                type="button"
                onClick={() => look("D")}
                className={
                  "rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " +
                  (lock === "D" ? ACC_CHIP.rose : ACC_BTN.rose)
                }
              >
                {g.you}가 「{g.defect}」 한다면
              </button>
              <button
                type="button"
                onClick={() => {
                  setLock(null);
                  setSeen({});
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                ↩️ 처음으로
              </button>
            </div>

            {lock !== null ? (
              <div className="rounded-xl border-2 border-emerald-400/45 bg-emerald-400/[0.08] px-3 py-3">
                <p className="text-[11px] font-bold text-emerald-200">
                  {g.you}가 「{lock === "C" ? g.coop : g.defect}」 할 때 {g.me}의 보수
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                  <div
                    className={
                      "rounded-lg border-2 px-2 py-2 " +
                      (payoff(g, "C", lock) > payoff(g, "D", lock)
                        ? "border-emerald-400/70 bg-emerald-400/15"
                        : "border-white/10 bg-white/5")
                    }
                  >
                    <p className="text-[10px] text-slate-400">{g.coop}</p>
                    <p className="font-mono text-lg font-bold text-amber-100">{won(payoff(g, "C", lock))}</p>
                  </div>
                  <div
                    className={
                      "rounded-lg border-2 px-2 py-2 " +
                      (payoff(g, "D", lock) > payoff(g, "C", lock)
                        ? "border-emerald-400/70 bg-emerald-400/15"
                        : "border-white/10 bg-white/5")
                    }
                  >
                    <p className="text-[10px] text-slate-400">{g.defect}</p>
                    <p className="font-mono text-lg font-bold text-amber-100">{won(payoff(g, "D", lock))}</p>
                  </div>
                </div>
                <p className="mt-2 text-center text-xs font-bold text-emerald-100">
                  → 「{payoff(g, "D", lock) > payoff(g, "C", lock) ? g.defect : g.coop}」 가 {" "}
                  {won(Math.abs(payoff(g, "D", lock) - payoff(g, "C", lock)))} {g.unit} 더 이득
                </p>
              </div>
            ) : (
              <TipBox>위의 두 단추를 차례로 눌러 보세요. 상대의 선택마다 내게 더 좋은 쪽이 밝아집니다.</TipBox>
            )}

            {both ? (
              <div className="space-y-2 rounded-2xl border-2 border-rose-400/50 bg-rose-400/[0.10] p-3">
                <p className="text-sm font-bold text-rose-100">😮 상대가 무엇을 하든 「{g.defect}」 가 이득이었어요</p>
                <p className="text-xs leading-6 text-slate-200">
                  이렇게 상대의 선택과 상관없이 늘 더 나은 선택을 <b className="text-rose-200">지배전략</b>이라고 해요. 둘 다
                  그렇게 고르면 분홍 칸에 닿아 각자 <b className="text-rose-200">{won(g.P)}</b> {g.unit} — 둘 다 「{g.coop}」
                  했다면 <b className="text-emerald-200">{won(g.R)}</b> {g.unit} 였을 텐데요.
                </p>
                <p className="text-xs font-bold text-amber-200">
                  각자 가장 똑똑하게 골랐는데 둘 다 {won(g.R - g.P)} {g.unit} 씩 손해 — 이것이 죄수의 딜레마예요.
                </p>
              </div>
            ) : null}

            <TipBox>{g.note}</TipBox>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "칸마다 위쪽 노랑이 내 보수, 아래쪽 파랑이 상대의 보수예요.",
              "상대의 선택을 고정하면 내가 견줄 수는 둘뿐이에요.",
              "두 경우 모두 배신이 나으면 배신이 지배전략이에요.",
              "그래서 둘 다 배신하는데, 그 결과가 둘 다 협력했을 때보다 못합니다.",
            ]}
          />
        </div>
      </div>

      <StepRunner steps={DOM_STEPS} accent="sky" finale="보수표를 읽는 법을 익혔어요. 이제 직접 겨뤄 봐요!" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 한 판 승부
// ══════════════════════════════════════════════════════════════
type Phase = "idle" | "thinking" | "reveal";
type Log = { n: number; mine: Move; theirs: Move; got: number; lost: number };

function MoveChip({ m, coop, defect }: { m: Move; coop: string; defect: string }) {
  return (
    <span
      className={
        "inline-block rounded-lg border px-2 py-0.5 text-[11px] font-bold " +
        (m === "C" ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100" : "border-rose-400/55 bg-rose-400/15 text-rose-100")
      }
    >
      {m === "C" ? "🤝 " + coop : "😈 " + defect}
    </span>
  );
}

function DuelTab() {
  const [gi, setGi] = useState(0);
  const [ri, setRi] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [cur, setCur] = useState<{ mine: Move; theirs: Move } | null>(null);
  const [log, setLog] = useState<Log[]>([]);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const g = GAMES[gi];
  const rv = RIVALS[ri];
  const myTotal = log.reduce((s, r) => s + r.got, 0);
  const theirTotal = log.reduce((s, r) => s + r.lost, 0);

  const reset = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setPhase("idle");
    setCur(null);
    setLog([]);
  };

  const pick = (mine: Move) => {
    if (phase === "thinking") return;
    setPhase("thinking");
    setCur(null);
    timer.current = window.setTimeout(() => {
      const theirs: Move = rv.mirror
        ? log.length === 0
          ? "C"
          : log[log.length - 1].mine
        : Math.random() < rv.coopRate
          ? "C"
          : "D";
      setCur({ mine, theirs });
      setLog((z) => [
        ...z,
        { n: z.length + 1, mine, theirs, got: payoff(g, mine, theirs), lost: payoff(g, theirs, mine) },
      ]);
      setPhase("reveal");
      timer.current = null;
    }, 850);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.07] to-emerald-500/[0.04] p-4">
        <p className="text-sm font-bold text-violet-200">🎮 상대를 고르고 직접 겨뤄 보세요 — 상대의 선택은 누른 뒤에 정해져요</p>

        <div className="mt-2 space-y-2">
          <PickRow items={GAMES} at={gi} accent="violet" onPick={(i) => { setGi(i); reset(); }} />
          <div className="flex flex-wrap gap-1.5">
            {RIVALS.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setRi(i);
                  reset();
                }}
                className={
                  "rounded-lg border px-2.5 py-1.5 text-xs font-bold transition " +
                  (ri === i ? ACC_CHIP.emerald : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {v.emoji} {v.name}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-6 text-slate-300">
          {g.emoji} {g.story} · 상대는 {rv.emoji} <b className="text-emerald-200">{rv.name}</b> — {rv.desc}
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="space-y-3">
            <div className="rounded-2xl border-2 border-white/10 bg-slate-900/60 p-4 text-center">
              <div className="grid grid-cols-3 items-center gap-2">
                <div>
                  <p className="text-[11px] font-bold text-amber-200">{g.me}</p>
                  <p className="mt-1 text-3xl">🙂</p>
                  <div className="mt-1 min-h-[24px]">
                    {phase === "reveal" && cur ? <MoveChip m={cur.mine} coop={g.coop} defect={g.defect} /> : null}
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-500">VS</p>
                <div>
                  <p className="text-[11px] font-bold text-sky-200">{rv.name}</p>
                  <p className="mt-1 text-3xl">{rv.emoji}</p>
                  <div className="mt-1 min-h-[24px]">
                    {phase === "thinking" ? (
                      <span className="inline-block animate-pulse rounded-lg border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                        고민 중 · · ·
                      </span>
                    ) : phase === "reveal" && cur ? (
                      <MoveChip m={cur.theirs} coop={g.coop} defect={g.defect} />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-3 min-h-[52px]">
                {phase === "reveal" && cur ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border-2 border-amber-400/50 bg-amber-400/[0.12] px-2 py-2">
                      <p className="text-[10px] text-slate-400">{g.me} 이번 판</p>
                      <p className="font-mono text-xl font-bold text-amber-100">
                        +{won(payoff(g, cur.mine, cur.theirs))}
                      </p>
                    </div>
                    <div className="rounded-xl border-2 border-sky-400/50 bg-sky-400/[0.12] px-2 py-2">
                      <p className="text-[10px] text-slate-400">{rv.name} 이번 판</p>
                      <p className="font-mono text-xl font-bold text-sky-100">
                        +{won(payoff(g, cur.theirs, cur.mine))}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="pt-4 text-xs text-slate-500">아래에서 내 선택을 고르면 상대도 동시에 고릅니다</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={phase === "thinking"}
                onClick={() => pick("C")}
                className={"rounded-lg border-2 px-4 py-2 text-sm font-bold transition disabled:opacity-40 " + ACC_BTN.emerald}
              >
                🤝 {g.coop}
              </button>
              <button
                type="button"
                disabled={phase === "thinking"}
                onClick={() => pick("D")}
                className={"rounded-lg border-2 px-4 py-2 text-sm font-bold transition disabled:opacity-40 " + ACC_BTN.rose}
              >
                😈 {g.defect}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                🧹 처음부터
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border-2 border-amber-400/50 bg-amber-400/[0.10] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-amber-200">{g.me} 누적</p>
                <p className="mt-0.5 font-mono text-2xl font-bold text-amber-100">
                  {won(myTotal)} <span className="text-[11px] font-normal text-slate-400">{g.unit}</span>
                </p>
              </div>
              <div className="rounded-xl border-2 border-sky-400/50 bg-sky-400/[0.10] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-sky-200">{rv.name} 누적</p>
                <p className="mt-0.5 font-mono text-2xl font-bold text-sky-100">
                  {won(theirTotal)} <span className="text-[11px] font-normal text-slate-400">{g.unit}</span>
                </p>
              </div>
            </div>

            {log.length > 0 ? (
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] font-bold text-slate-200">판</th>
                      <th className="border border-white/10 bg-amber-400/[0.12] px-2 py-1 text-[11px] font-bold text-amber-100">
                        {g.me}
                      </th>
                      <th className="border border-white/10 bg-sky-400/[0.12] px-2 py-1 text-[11px] font-bold text-sky-100">
                        {rv.name}
                      </th>
                      <th className="border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] font-bold text-slate-200">
                        점수
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.slice(-8).map((r) => (
                      <tr key={r.n}>
                        <td className="border border-white/10 px-2 py-1 text-center font-mono text-[11px] text-slate-400">{r.n}</td>
                        <td className="border border-white/10 px-2 py-1 text-center">
                          <MoveChip m={r.mine} coop={g.coop} defect={g.defect} />
                        </td>
                        <td className="border border-white/10 px-2 py-1 text-center">
                          <MoveChip m={r.theirs} coop={g.coop} defect={g.defect} />
                        </td>
                        <td className="border border-white/10 px-2 py-1 text-center font-mono text-[11px] text-slate-200">
                          {won(r.got)} : {won(r.lost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <PayoffGrid
                p={g}
                coopLabel={g.coop}
                defectLabel={g.defect}
                meName={g.me}
                youName={rv.name}
                equilibrium={phase === "reveal" && cur ? [cur.mine, cur.theirs] : null}
              />
            </div>
            <p className="text-center text-[10px] leading-4 text-slate-500">
              이번 판이 닿은 칸이 분홍으로 반짝여요
            </p>
            <TipBox>
              {rv.mirror
                ? "거울이는 내가 직전 판에 한 것을 그대로 따라 해요. 한 번 배신하면 그 대가가 다음 판에 돌아옵니다."
                : "상대의 선택은 내가 고른 뒤에 정해져요. 미리 알 수 없다는 것이 이 게임의 핵심입니다."}
            </TipBox>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "두 사람은 서로의 선택을 모른 채 동시에 골라요.",
              "한 판뿐이라면 상대가 무엇을 하든 배신이 이득이에요.",
              "거울이처럼 되갚는 상대와는 이야기가 달라집니다.",
              "다시 만날 사이인지 아닌지가 선택을 바꿉니다.",
            ]}
          />
        </div>
      </div>

      <StepRunner steps={DUEL_STEPS} accent="violet" finale="되풀이하면 달라진다는 것을 느꼈어요. 전략끼리 리그를 열어 봐요!" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 전략 리그
// ══════════════════════════════════════════════════════════════
const MEDAL = ["🥇", "🥈", "🥉"];

/** 같은 점수는 같은 등수로 매긴다 */
function ranksOf(tot: number[]): number[] {
  return tot.map((v) => 1 + tot.filter((w) => w > v).length);
}

// 막대는 폭이 수에 따라 달라지므로 SVG 속성으로 그린다 (인라인 style 을 쓰지 않는다)
const SB_W = 320;
const SB_ROW = 34;
const SB_L = 4;
const SB_R = 4;
const BAR_FILL: Record<string, string> = { a: "rgba(251,191,36,0.75)", b: "rgba(56,189,248,0.75)" };
const BAR_TEXT: Record<string, string> = { a: "#fcd34d", b: "#7dd3fc" };

function ScoreBars({
  rows,
  max,
  unit,
}: {
  rows: { key: string; label: string; value: number; tone: string }[];
  max: number;
  unit: string;
}) {
  const w = SB_W - SB_L - SB_R;
  const h = SB_ROW * rows.length;
  return (
    <svg viewBox={"0 0 " + SB_W + " " + h} className="w-full" role="img" aria-label="누적 점수 막대">
      {rows.map((r, i) => {
        const y = SB_ROW * i;
        const bw = Math.max((r.value / max) * w, 0);
        return (
          <g key={r.key}>
            <text x={SB_L} y={y + 11} fontSize="10" fontWeight="bold" fill={BAR_TEXT[r.tone]}>
              {r.label}
            </text>
            <text x={SB_W - SB_R} y={y + 11} textAnchor="end" fontSize="10" fontWeight="bold" fill={BAR_TEXT[r.tone]}>
              {won(r.value)} {unit}
            </text>
            <rect x={SB_L} y={y + 16} width={w} height={10} rx={5} fill="rgba(255,255,255,0.06)" />
            <rect x={SB_L} y={y + 16} width={bw} height={10} rx={5} fill={BAR_FILL[r.tone]} />
          </g>
        );
      })}
    </svg>
  );
}

function LeagueTab() {
  const [gi, setGi] = useState(0);
  const [ai, setAi] = useState(2);
  const [bi, setBi] = useState(1);
  const [at, setAt] = useState(0);
  const [running, setRunning] = useState(false);
  const [openLeague, setOpenLeague] = useState(false);
  const timer = useRef<number | null>(null);

  const stop = () => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  };
  useEffect(() => stop, []);

  const g = GAMES[gi];
  const A = STRATEGIES[ai];
  const B = STRATEGIES[bi];
  const full = duel(g, A, B);
  const shown = full.moves.slice(0, at);
  const sa = shown.reduce((s, [x, y]) => s + payoff(g, x, y), 0);
  const sb = shown.reduce((s, [x, y]) => s + payoff(g, y, x), 0);
  const maxScore = Math.max(full.scoreA, full.scoreB, 1);

  const reset = () => {
    stop();
    setRunning(false);
    setAt(0);
  };

  const auto = () => {
    if (timer.current !== null) return;
    let k = 0;
    setAt(0);
    setRunning(true);
    timer.current = window.setInterval(() => {
      k += 1;
      setAt(k);
      if (k >= ROUNDS) {
        stop();
        setRunning(false);
      }
    }, 420);
  };

  const tot = league(g);
  const rk = ranksOf(tot);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.07] to-sky-500/[0.04] p-4">
        <p className="text-sm font-bold text-amber-200">🏆 전략 둘을 골라 {ROUNDS}판을 붙여 보고, 리그도 열어 보세요</p>

        <div className="mt-2">
          <PickRow items={GAMES} at={gi} accent="amber" onPick={(i) => { setGi(i); reset(); }} />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-400/35 bg-amber-400/[0.06] p-2">
            <p className="text-[11px] font-bold text-amber-200">🅰️ 전략</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {STRATEGIES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={running}
                  onClick={() => {
                    setAi(i);
                    reset();
                  }}
                  className={
                    "rounded-lg border px-2 py-1 text-[11px] font-bold transition disabled:opacity-40 " +
                    (ai === i ? ACC_CHIP.amber : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  {s.emoji} {s.name}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-400">{A.desc}</p>
          </div>
          <div className="rounded-xl border border-sky-400/35 bg-sky-400/[0.06] p-2">
            <p className="text-[11px] font-bold text-sky-200">🅱️ 전략</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {STRATEGIES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={running}
                  onClick={() => {
                    setBi(i);
                    reset();
                  }}
                  className={
                    "rounded-lg border px-2 py-1 text-[11px] font-bold transition disabled:opacity-40 " +
                    (bi === i ? ACC_CHIP.sky : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  {s.emoji} {s.name}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-400">{B.desc}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={running || at >= ROUNDS}
            onClick={() => setAt(at + 1)}
            className={"rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.amber}
          >
            ▶️ 한 판씩
          </button>
          <button
            type="button"
            disabled={running}
            onClick={auto}
            className={"rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.emerald}
          >
            ⏩ 자동으로 쭉
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 처음으로
          </button>
          <span className="font-mono text-[11px] text-slate-400">
            {at} / {ROUNDS} 판
          </span>
        </div>

        <div className="mt-3 overflow-x-auto overflow-y-hidden py-1">
          <div className="flex gap-1">
            {full.moves.map(([x, y], i) => {
              const on = i < at;
              return (
                <div
                  key={i}
                  className={
                    "w-12 shrink-0 rounded-lg border px-1 py-1 text-center transition " +
                    (on ? "border-white/20 bg-white/[0.06]" : "border-white/5 bg-white/[0.02] opacity-30")
                  }
                >
                  <p className="text-[9px] text-slate-500">{i + 1}판</p>
                  <p className={"text-base " + (on && x === "C" ? "text-emerald-300" : on ? "text-rose-300" : "text-slate-700")}>
                    {on ? (x === "C" ? "🤝" : "😈") : "·"}
                  </p>
                  <p className={"text-base " + (on && y === "C" ? "text-emerald-300" : on ? "text-rose-300" : "text-slate-700")}>
                    {on ? (y === "C" ? "🤝" : "😈") : "·"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3">
          <ScoreBars
            rows={[
              { key: "a", label: A.emoji + " " + A.name, value: sa, tone: "a" },
              { key: "b", label: B.emoji + " " + B.name, value: sb, tone: "b" },
            ]}
            max={maxScore}
            unit={g.unit}
          />
        </div>

        {at >= ROUNDS ? (
          <div className="mt-3">
            <Verdict ok={sa >= sb}>
              {ROUNDS}판이 끝났어요 — {A.name} {won(full.scoreA)} 대 {B.name} {won(full.scoreB)}.{" "}
              {full.scoreA === full.scoreB ? "비겼습니다." : (full.scoreA > full.scoreB ? A.name : B.name) + " 가 앞섰어요."}
            </Verdict>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-slate-200">🏟️ 리그 — 여섯 전략이 모두 서로 겨룬 총점</p>
            <button
              type="button"
              onClick={() => setOpenLeague(!openLeague)}
              className={"rounded-lg border-2 px-3 py-1.5 text-[11px] font-bold transition " + ACC_BTN.sky}
            >
              {openLeague ? "리그 접기" : "리그 열기"}
            </button>
          </div>

          {openLeague ? (
            <div className="mt-2 space-y-2">
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-slate-200">
                        전략 \ 상대
                      </th>
                      {STRATEGIES.map((s) => (
                        <th key={s.id} className="border border-white/10 bg-white/[0.04] px-1 py-1 text-[14px]">
                          <span title={s.name}>{s.emoji}</span>
                        </th>
                      ))}
                      <th className="border border-white/10 bg-amber-400/[0.14] px-2 py-1 text-[10px] font-bold text-amber-100">
                        총점
                      </th>
                      <th className="border border-white/10 bg-emerald-400/[0.14] px-2 py-1 text-[10px] font-bold text-emerald-100">
                        순위
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {STRATEGIES.map((a, i) => (
                      <tr key={a.id}>
                        <td className="border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-200">
                          {a.emoji} {a.name}
                        </td>
                        {STRATEGIES.map((b) => (
                          <td
                            key={b.id}
                            className="border border-white/10 px-1 py-1 text-right font-mono text-[11px] tabular-nums text-slate-300"
                          >
                            {won(duel(g, a, b).scoreA)}
                          </td>
                        ))}
                        <td className="border border-white/10 bg-amber-400/[0.08] px-2 py-1 text-right font-mono text-[11px] font-bold text-amber-100">
                          {won(tot[i])}
                        </td>
                        <td className="border border-white/10 bg-emerald-400/[0.08] px-2 py-1 text-center text-[11px] font-bold text-emerald-100">
                          {MEDAL[rk[i] - 1] ?? ""}
                          {rk[i]}등
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TipBox>
                상황을 바꿔 가며 리그를 다시 열어 보세요. 배신해서 얻는 몫({g.T - g.R})과 혼자 손해({g.P - g.S})가 작을수록
                협력하는 전략이 위로 올라옵니다.
              </TipBox>
            </div>
          ) : null}
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "같은 전략이라도 누구와 만나느냐에 따라 성적이 달라져요.",
              "늘 협력은 늘 배신에게 끝까지 당하지만, 맞대응은 첫 판만 당하고 갚아 줍니다.",
              "먼저 배신하지 않되 당하면 갚는 전략이 되풀이하는 판에서 강해요.",
              "상황의 보수를 바꾸면 순위가 통째로 뒤집히기도 합니다.",
            ]}
          />
        </div>
      </div>

      <StepRunner steps={LEAGUE_STEPS} accent="amber" finale="되풀이가 협력을 만든다는 것을 보았어요. 이제 규칙 자체를 바꿔 봐요!" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 조건과 탈출
// ══════════════════════════════════════════════════════════════
function EscapeTab() {
  const [k, setK] = useState({ ...KNOB_START });
  const [fine, setFine] = useState(0);

  const v = judge(k);
  const fg = FINE_GAME;
  const fined = { R: fg.R, T: fg.T - fine, P: fg.P - fine, S: fg.S };
  const fv = judge(fined);
  const eq: [Move, Move] | null = v.defectDominant ? ["D", "D"] : v.coopDominant ? ["C", "C"] : null;
  const feq: [Move, Move] | null = fv.defectDominant ? ["D", "D"] : fv.coopDominant ? ["C", "C"] : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.07] to-rose-500/[0.04] p-4">
        <p className="text-sm font-bold text-emerald-200">🔧 네 수를 바꿔 가며 어떤 판일 때 딜레마가 되는지 찾아보세요</p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Knob label="R — 둘 다 협력" value={k.R} min={KNOB_MIN} max={KNOB_MAX} step={KNOB_STEP} accent="emerald" onChange={(z) => setK({ ...k, R: z })} />
              <Knob label="T — 나만 배신 (유혹)" value={k.T} min={KNOB_MIN} max={KNOB_MAX} step={KNOB_STEP} accent="rose" onChange={(z) => setK({ ...k, T: z })} />
              <Knob label="P — 둘 다 배신" value={k.P} min={KNOB_MIN} max={KNOB_MAX} step={KNOB_STEP} accent="amber" onChange={(z) => setK({ ...k, P: z })} />
              <Knob label="S — 나만 협력 (손해)" value={k.S} min={KNOB_MIN} max={KNOB_MAX} step={KNOB_STEP} accent="sky" onChange={(z) => setK({ ...k, S: z })} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div
                className={
                  "rounded-xl border-2 px-3 py-2 " +
                  (k.T > k.R ? "border-rose-400/55 bg-rose-400/[0.10]" : "border-emerald-400/55 bg-emerald-400/[0.10]")
                }
              >
                <p className="text-[11px] font-bold text-slate-300">상대가 협력할 때</p>
                <p className={"mt-0.5 text-sm font-bold " + (k.T > k.R ? "text-rose-100" : "text-emerald-100")}>
                  {k.T > k.R ? "배신이 유리 (T > R)" : k.T < k.R ? "협력이 유리 (R > T)" : "똑같음 (R = T)"}
                </p>
              </div>
              <div
                className={
                  "rounded-xl border-2 px-3 py-2 " +
                  (k.P > k.S ? "border-rose-400/55 bg-rose-400/[0.10]" : "border-emerald-400/55 bg-emerald-400/[0.10]")
                }
              >
                <p className="text-[11px] font-bold text-slate-300">상대가 배신할 때</p>
                <p className={"mt-0.5 text-sm font-bold " + (k.P > k.S ? "text-rose-100" : "text-emerald-100")}>
                  {k.P > k.S ? "배신이 유리 (P > S)" : k.P < k.S ? "협력이 유리 (S > P)" : "똑같음 (P = S)"}
                </p>
              </div>
            </div>

            <div
              className={
                "rounded-2xl border-2 px-3 py-3 text-center " +
                (v.dilemma ? "border-rose-400/55 bg-rose-400/[0.12]" : "border-emerald-400/50 bg-emerald-400/[0.10]")
              }
            >
              <p className={"text-base font-bold " + (v.dilemma ? "text-rose-100" : "text-emerald-100")}>
                {v.dilemma ? "⚠️ " : "🕊️ "}
                {v.label}
              </p>
              <p className="mt-1 text-xs leading-6 text-slate-200">{v.why}</p>
              <div className="mt-2 overflow-x-auto overflow-y-hidden py-1">
                <Katex expr="T > R > P > S" className="whitespace-nowrap text-base text-slate-300" />
              </div>
              <p className="text-[11px] text-slate-400">
                지금은 T {k.T} · R {k.R} · P {k.P} · S {k.S}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-xs font-bold text-slate-200">🎯 미션 — 협력이 지배전략인 판을 만들어 보세요</p>
              <div className="mt-2">
                {v.coopDominant ? (
                  <Verdict ok>
                    해냈어요! R &gt; T 이고 S &gt; P 라서 상대가 무엇을 하든 협력이 나아요. 서로 믿을 필요도 없이 협력이
                    이루어집니다.
                  </Verdict>
                ) : (
                  <Verdict ok={false}>
                    아직이에요. 상대가 협력할 때도 배신할 때도 협력이 유리해지도록 두 배지를 모두 초록으로 만들어 보세요.
                  </Verdict>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <PayoffGrid
                p={k}
                coopLabel="협력"
                defectLabel="배신"
                meName="나"
                youName="상대"
                equilibrium={eq}
              />
            </div>
            <p className="text-center text-[10px] leading-4 text-slate-500">
              지배전략이 있으면 둘이 닿는 칸이 분홍으로 반짝여요
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-400/25 bg-gradient-to-br from-rose-500/[0.07] to-emerald-500/[0.04] p-4">
        <p className="text-sm font-bold text-rose-200">
          💰 벌금으로 빠져나오기 — 「{fg.defect}」 를 하면 벌금을 내게 하면 어떻게 될까요?
        </p>
        <p className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-6 text-slate-300">
          {fg.emoji} {fg.title} (R {fg.R} · T {fg.T} · P {fg.P} · S {fg.S}) 를 그대로 두고, 「{fg.defect}」 를 고른 쪽만 벌금을
          냅니다.
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <div className="space-y-3">
            <Knob label="벌금" value={fine} min={0} max={FINE_MAX} step={1} accent="rose" suffix={fg.unit} onChange={setFine} />

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-slate-300">나만 배신했을 때</p>
                <p className="mt-0.5 font-mono text-lg font-bold text-amber-100">
                  {won(fg.T)} - {won(fine)} = {won(fined.T)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-slate-300">둘 다 배신했을 때</p>
                <p className="mt-0.5 font-mono text-lg font-bold text-amber-100">
                  {won(fg.P)} - {won(fine)} = {won(fined.P)}
                </p>
              </div>
            </div>

            <div
              className={
                "rounded-2xl border-2 px-3 py-3 text-center " +
                (fv.dilemma ? "border-rose-400/55 bg-rose-400/[0.12]" : "border-emerald-400/50 bg-emerald-400/[0.10]")
              }
            >
              <p className={"text-base font-bold " + (fv.dilemma ? "text-rose-100" : "text-emerald-100")}>
                {fv.dilemma ? "⚠️ " : "🕊️ "}
                {fv.label}
              </p>
              <p className="mt-1 text-xs leading-6 text-slate-200">{fv.why}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-xs font-bold text-slate-200">🎯 미션 — 「{fg.coop}」 가 지배전략이 되게 만들어 보세요</p>
              <div className="mt-2">
                {fv.coopDominant ? (
                  <Verdict ok>
                    벌금 {won(fine)} {fg.unit} 으로 빠져나왔어요! 벌금이 배신의 유혹 {fg.T - fg.R} 보다 커지는 순간
                    「{fg.coop}」 가 지배전략이 됩니다.
                  </Verdict>
                ) : (
                  <Verdict ok={false}>
                    아직이에요. 벌금을 올려 보세요 — 「{fg.coop}」 쪽 수가 「{fg.defect}」 쪽보다 커져야 합니다.
                  </Verdict>
                )}
              </div>
            </div>

            <TipBox>
              사람의 마음을 바꾸지 않고 보수만 바꿔도 결과가 달라져요. 과태료·계약·평판이 모두 이런 구실을 합니다.
            </TipBox>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <PayoffGrid
                p={fined}
                coopLabel={fg.coop}
                defectLabel={fg.defect}
                meName={fg.me}
                youName={fg.you}
                equilibrium={feq}
              />
            </div>
            <p className="text-center text-[10px] leading-4 text-slate-500">벌금을 올리면 분홍 칸이 옮겨 갑니다</p>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "T > R > P > S 일 때가 죄수의 딜레마예요.",
              "R > T 이고 S > P 가 되면 협력이 지배전략이 됩니다.",
              "벌금은 배신했을 때의 보수만 깎아 부등호를 뒤집어요.",
              "규칙을 바꾸면 사람을 설득하지 않아도 결과가 달라집니다.",
            ]}
          />
        </div>
      </div>

      <StepRunner steps={ESCAPE_STEPS} accent="emerald" finale="딜레마를 읽고, 겨뤄 보고, 빠져나오는 길까지 모두 살펴봤어요!" />

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">
        {REAL_NOTE}
      </p>
    </div>
  );
}
