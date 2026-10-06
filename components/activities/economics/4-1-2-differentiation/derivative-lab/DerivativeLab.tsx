"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  AVG_FNS,
  AVG_STEPS,
  DERIV_FNS,
  DERIV_STEPS,
  ECO_SCENES,
  ECO_STEPS,
  POLY_KNOBS,
  POLY_START,
  POLY_X,
  POW_CONSTS,
  POW_MAX,
  POW_STEPS,
  REAL_NOTE,
  TAN_FNS,
  TAN_GAPS,
  TAN_STEPS,
  autoBox,
  fmt,
  samplePath,
  won,
  type Box,
  type Piece,
  type Step,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "avg_to_inst",
    prompt:
      "Δx 를 좁혀 가며 할선이 접선으로 바뀌는 것을 보았어요. 평균변화율과 미분계수가 어떻게 다른지 자기 말로 쓰고, Δx 를 아예 0 으로 두지 못하는 까닭도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 평균변화율은 떨어진 두 점을 이은 직선의 기울기이고, 미분계수는 한 점에서의 기울기였다. Δx 를 0 으로 두면 분모가 0 이 되어 계산이 안 되므로 0 에 한없이 가까이 보낸 극한으로 정한다.",
  },
  {
    id: "collect",
    prompt:
      "미분계수를 자리마다 찍어 모으니 새로운 함수가 나타났어요. 미분계수 f'(a) 와 도함수 f'(x) 가 어떻게 다른지 쓰고, 원래 함수의 차수와 도함수의 차수 사이에서 찾은 규칙도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: f'(a) 는 한 자리에서의 기울기라 수 하나이고, f'(x) 는 모든 자리의 기울기를 모은 함수였다. 삼차는 이차로, 이차는 일차로, 일차는 상수로 차수가 하나씩 내려갔다.",
  },
  {
    id: "economy",
    prompt:
      "비용 · 매출 · 구독자 수 · 중고차 값의 순간변화율을 읽어 보았어요. 네 장면 가운데 하나를 골라, 변화율의 부호와 크기가 그 상황에서 무엇을 알려 주는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 광고 장면에서 R' 이 양수인 동안은 더 쓸수록 매출이 늘지만 30 만원을 넘으면 음수가 되어 오히려 줄었다. 부호는 늘지 줄지를, 크기는 얼마나 빠르게 변하는지를 알려 준다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "avg" | "tan" | "deriv" | "pow" | "eco";

export default function DerivativeLab() {
  const [tab, setTab] = useState<Tab>("avg");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">📐 평균변화율에서 도함수까지</h3>
        <p className="mt-2 leading-7 text-slate-300">
          두 점을 이은 <b className="text-sky-200">할선</b>을 좁히면 <b className="text-emerald-200">접선</b>이 되고, 그
          기울기를 자리마다 모으면 <b className="text-amber-200">도함수</b>가 됩니다. 직접 움직여 보며 따라가 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "avg"} onClick={() => setTab("avg")}>① 증분과 평균변화율</TabButton>
        <TabButton active={tab === "tan"} onClick={() => setTab("tan")}>② 할선에서 접선으로</TabButton>
        <TabButton active={tab === "deriv"} onClick={() => setTab("deriv")}>③ 미분계수 모으기</TabButton>
        <TabButton active={tab === "pow"} onClick={() => setTab("pow")}>④ 미분 공식</TabButton>
        <TabButton active={tab === "eco"} onClick={() => setTab("eco")}>⑤ 경제 속 순간변화율</TabButton>
      </div>

      <div className="mt-4">
        {tab === "avg" ? <AvgTab /> : null}
        {tab === "tan" ? <TanTab /> : null}
        {tab === "deriv" ? <DerivTab /> : null}
        {tab === "pow" ? <PowTab /> : null}
        {tab === "eco" ? <EcoTab /> : null}
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
//  공용 — 그래프판
// ══════════════════════════════════════════════════════════════
const PS = 320;
const PML = 46;
const PMR = 14;
const PMT = 16;
const PMB = 30;

type LineTone = "sec" | "tan" | "ghost";
type PlotLine = { m: number; x0: number; y0: number; tone: LineTone };
const LINE_COLOR: Record<LineTone, string> = {
  sec: "#f472b6",
  tan: "#34d399",
  ghost: "rgba(244,114,182,0.28)",
};
const LINE_WIDTH: Record<LineTone, number> = { sec: 2.2, tan: 2.4, ghost: 1.4 };

type MarkTone = "a" | "b" | "tan" | "dot" | "ghost";
type PlotMark = { x: number; y: number; tone: MarkTone; open?: boolean };
const MARK_COLOR: Record<MarkTone, string> = {
  a: "#e2e8f0",
  b: "#f472b6",
  tan: "#34d399",
  dot: "#fb923c",
  ghost: "rgba(251,146,60,0.45)",
};
const MARK_R: Record<MarkTone, number> = { a: 5, b: 5, tan: 5.5, dot: 3.4, ghost: 2.6 };

type DeltaBox = { x1: number; y1: number; x2: number; y2: number };

function Plot({
  box,
  paths,
  curve = "f",
  lines = [],
  marks = [],
  delta,
  guideX,
  guideY,
  uid,
  axis,
  yFmt,
}: {
  box: Box;
  paths: [number, number][][];
  curve?: "f" | "d";
  lines?: PlotLine[];
  marks?: PlotMark[];
  delta?: DeltaBox;
  guideX?: number;
  guideY?: number;
  uid: string;
  axis?: [string, string];
  yFmt?: (v: number) => string;
}) {
  const pw = PS - PML - PMR;
  const ph = PS - PMT - PMB;
  const X = (v: number) => PML + ((v - box.xMin) / (box.xMax - box.xMin)) * pw;
  const Y = (v: number) => PS - PMB - ((v - box.yMin) / (box.yMax - box.yMin)) * ph;
  const cid = "dv-" + uid;
  const fy = yFmt ?? ((v: number) => fmt(v, 4));

  const gx: number[] = [];
  for (let i = 0; i <= 14; i++) {
    const v = Math.ceil(box.xMin / box.gx) * box.gx + i * box.gx;
    if (v > box.xMax + 1e-9) break;
    gx.push(Number(v.toFixed(10)));
  }
  const gy: number[] = [];
  for (let i = 0; i <= 14; i++) {
    const v = Math.ceil(box.yMin / box.gy) * box.gy + i * box.gy;
    if (v > box.yMax + 1e-9) break;
    gy.push(Number(v.toFixed(10)));
  }
  const axisX = box.yMin <= 0 && box.yMax >= 0;
  const axisY = box.xMin <= 0 && box.xMax >= 0;
  const stroke = curve === "d" ? "#fb923c" : "#38bdf8";

  return (
    <svg viewBox={"0 0 " + PS + " " + PS} className="w-full max-w-[320px]" role="img" aria-label="함수의 그래프">
      <defs>
        <clipPath id={cid}>
          <rect x={PML} y={PMT} width={pw} height={ph} />
        </clipPath>
      </defs>
      <rect x={PML} y={PMT} width={pw} height={ph} fill="#0b1220" stroke="rgba(255,255,255,0.12)" />

      {gx.map((v) => (
        <line key={"gx" + v} x1={X(v)} y1={PMT} x2={X(v)} y2={PS - PMB} stroke="rgba(255,255,255,0.06)" />
      ))}
      {gy.map((v) => (
        <line key={"gy" + v} x1={PML} y1={Y(v)} x2={PS - PMR} y2={Y(v)} stroke="rgba(255,255,255,0.06)" />
      ))}
      {axisX ? <line x1={PML} y1={Y(0)} x2={PS - PMR} y2={Y(0)} stroke="rgba(255,255,255,0.3)" /> : null}
      {axisY ? <line x1={X(0)} y1={PMT} x2={X(0)} y2={PS - PMB} stroke="rgba(255,255,255,0.3)" /> : null}

      {gx.map((v) => (
        <text key={"tx" + v} x={X(v)} y={PS - PMB + 12} textAnchor="middle" fontSize="8" fill="#64748b">
          {fmt(v, 4)}
        </text>
      ))}
      {gy.map((v) => (
        <text key={"ty" + v} x={PML - 4} y={Y(v) + 3} textAnchor="end" fontSize="8" fill="#64748b">
          {fy(v)}
        </text>
      ))}
      {axis ? (
        <>
          <text x={PS - PMR} y={PS - 3} textAnchor="end" fontSize="8" fill="#475569">
            {axis[0]}
          </text>
          <text x={2} y={PMT - 5} textAnchor="start" fontSize="8" fill="#475569">
            {axis[1]}
          </text>
        </>
      ) : null}

      <g clipPath={"url(#" + cid + ")"}>
        {guideY !== undefined ? (
          <line x1={PML} y1={Y(guideY)} x2={PS - PMR} y2={Y(guideY)} stroke="rgba(52,211,153,0.4)" strokeDasharray="4 3" />
        ) : null}
        {guideX !== undefined ? (
          <line x1={X(guideX)} y1={PMT} x2={X(guideX)} y2={PS - PMB} stroke="rgba(148,163,184,0.4)" strokeDasharray="4 3" />
        ) : null}

        {delta ? (
          <>
            <line x1={X(delta.x1)} y1={Y(delta.y1)} x2={X(delta.x2)} y2={Y(delta.y1)} stroke="#2dd4bf" strokeWidth="2" />
            <line x1={X(delta.x2)} y1={Y(delta.y1)} x2={X(delta.x2)} y2={Y(delta.y2)} stroke="#a78bfa" strokeWidth="2" />
          </>
        ) : null}

        {lines.map((ln, i) => (
          <line
            key={i}
            x1={X(box.xMin)}
            y1={Y(ln.m * (box.xMin - ln.x0) + ln.y0)}
            x2={X(box.xMax)}
            y2={Y(ln.m * (box.xMax - ln.x0) + ln.y0)}
            stroke={LINE_COLOR[ln.tone]}
            strokeWidth={LINE_WIDTH[ln.tone]}
          />
        ))}

        {paths.map((p, i) => (
          <polyline
            key={i}
            points={p.map(([x, y]) => X(x) + "," + Y(y)).join(" ")}
            fill="none"
            stroke={stroke}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* 점·이름표는 clipPath 밖에 그린다 */}
      {delta && delta.x1 >= box.xMin && delta.x2 <= box.xMax ? (
        <>
          <text x={(X(delta.x1) + X(delta.x2)) / 2} y={Y(delta.y1) + 13} textAnchor="middle" fontSize="9" fill="#5eead4">
            Δx
          </text>
          <text x={X(delta.x2) + 6} y={(Y(delta.y1) + Y(delta.y2)) / 2 + 3} textAnchor="start" fontSize="9" fill="#c4b5fd">
            Δy
          </text>
        </>
      ) : null}

      {marks
        .filter((m) => m.x >= box.xMin && m.x <= box.xMax && m.y >= box.yMin && m.y <= box.yMax)
        .map((m, i) => (
          <circle
            key={i}
            cx={X(m.x)}
            cy={Y(m.y)}
            r={MARK_R[m.tone]}
            fill={m.open ? "#0b1220" : MARK_COLOR[m.tone]}
            stroke={MARK_COLOR[m.tone]}
            strokeWidth="2"
          />
        ))}
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

const KNOB_ACC: Record<Accent, string> = {
  sky: "accent-sky-400",
  emerald: "accent-emerald-400",
  violet: "accent-violet-400",
  amber: "accent-amber-400",
  rose: "accent-rose-400",
};

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
          {fmt(value)}
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
//  탭 ① 증분과 평균변화율
// ══════════════════════════════════════════════════════════════
function AvgTab() {
  const [vi, setVi] = useState(0);
  const [a, setA] = useState(AVG_FNS[0].a0);
  const [b, setB] = useState(AVG_FNS[0].b0);

  const v = AVG_FNS[vi];
  const fa = v.fn(a);
  const fb = v.fn(b);
  const dx = b - a;
  const dy = fb - fa;
  const same = Math.abs(dx) < 1e-9;
  const rate = same ? 0 : dy / dx;

  const paths = samplePath(v.fn, v.box);
  const lines: PlotLine[] = same ? [] : [{ m: rate, x0: a, y0: fa, tone: "sec" }];
  const marks: PlotMark[] = [
    { x: a, y: fa, tone: "a" },
    { x: b, y: fb, tone: "b" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-500/[0.07] to-teal-500/[0.04] p-4">
        <p className="text-sm font-bold text-sky-200">📐 a 와 b 를 움직여 Δx · Δy 와 직선 AB 를 살펴보세요</p>

        <div className="mt-2">
          <PickRow
            items={AVG_FNS}
            at={vi}
            accent="sky"
            onPick={(i) => {
              setVi(i);
              setA(AVG_FNS[i].a0);
              setB(AVG_FNS[i].b0);
            }}
          />
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-center">
          <Katex expr={v.tex} className="text-lg text-slate-100" />
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Knob label="시작 자리 a" value={a} min={v.knobMin} max={v.knobMax} step={v.knobStep} accent="sky" onChange={setA} />
              <Knob label="끝 자리 b" value={b} min={v.knobMin} max={v.knobMax} step={v.knobStep} accent="rose" onChange={setB} />
            </div>

            {same ? (
              <div className="rounded-xl border-2 border-amber-400/50 bg-amber-400/[0.10] px-3 py-2 text-xs leading-6 text-amber-100">
                🤔 a 와 b 가 같아져 Δx = 0 이 되었어요. 분모가 0 이라 평균변화율을 말할 수 없습니다. 손잡이를 조금 움직여 보세요.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-teal-400/40 bg-teal-400/[0.08] px-3 py-2">
                    <p className="text-[11px] font-bold text-teal-200">x 의 증분</p>
                    <div className="mt-0.5 overflow-x-auto overflow-y-hidden py-1">
                      <Katex
                        expr={"\\Delta x = " + fmt(b) + " - (" + fmt(a) + ") = " + fmt(dx)}
                        className="whitespace-nowrap text-sm text-teal-100"
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-violet-400/40 bg-violet-400/[0.08] px-3 py-2">
                    <p className="text-[11px] font-bold text-violet-200">y 의 증분</p>
                    <div className="mt-0.5 overflow-x-auto overflow-y-hidden py-1">
                      <Katex
                        expr={"\\Delta y = " + fmt(fb) + " - (" + fmt(fa) + ") = " + fmt(dy)}
                        className="whitespace-nowrap text-sm text-violet-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-emerald-400/45 bg-emerald-400/[0.08] px-3 py-3 text-center">
                  <div className="overflow-x-auto overflow-y-hidden py-1">
                    <Katex
                      expr={
                        "\\dfrac{\\Delta y}{\\Delta x} = \\dfrac{f(b) - f(a)}{b - a} = \\dfrac{" +
                        fmt(dy) +
                        "}{" +
                        fmt(dx) +
                        "} = " +
                        fmt(rate)
                      }
                      className="whitespace-nowrap text-lg text-emerald-100"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300">
                    이 값이 곧 두 점 A, B 를 지나는 <b className="text-emerald-200">직선 AB 의 기울기</b>예요
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center">
                  <div className="overflow-x-auto overflow-y-hidden py-1">
                    <Katex expr={v.rateTex} className="whitespace-nowrap text-sm text-slate-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <Plot
                box={v.box}
                paths={paths}
                lines={lines}
                marks={marks}
                delta={same ? undefined : { x1: a, y1: fa, x2: b, y2: fb }}
                uid={"avg-" + v.id}
                axis={["x", "y"]}
              />
            </div>
            <p className="text-center text-[10px] leading-4 text-slate-500">
              흰 점 A({fmt(a)}, {fmt(fa)}) · 분홍 점 B({fmt(b)}, {fmt(fb)}) · 분홍 직선이 할선 AB
            </p>
            <TipBox>{v.note}</TipBox>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "Δx 는 가로로 간 거리, Δy 는 세로로 오른 높이예요. 직각삼각형이 바로 그것이에요.",
              "평균변화율 Δy/Δx 는 두 점을 이은 직선의 기울기와 똑같아요.",
              "같은 함수라도 어느 구간을 잡느냐에 따라 평균변화율이 달라져요.",
              "a 와 b 를 같게 두면 Δx = 0 이라 아예 계산할 수 없어요.",
            ]}
          />
        </div>
      </div>

      <StepRunner
        steps={AVG_STEPS}
        accent="sky"
        finale="평균변화율이 할선의 기울기라는 것을 잡았어요. 이제 두 점을 바짝 붙여 봐요!"
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 할선에서 접선으로
// ══════════════════════════════════════════════════════════════
function slopeAt(fn: (x: number) => number, a: number, h: number): number {
  return (fn(a + h) - fn(a)) / h;
}

function TanTab() {
  const [ti, setTi] = useState(0);
  const [a, setA] = useState(TAN_FNS[0].a0);
  const [k, setK] = useState(0);

  const t = TAN_FNS[ti];
  const fa = t.fn(a);
  const h = TAN_GAPS[k];
  const mR = slopeAt(t.fn, a, h);
  const mT = t.d(a);

  const paths = samplePath(t.fn, t.box);
  const lines: PlotLine[] = [];
  for (let i = 0; i < k; i++) lines.push({ m: slopeAt(t.fn, a, TAN_GAPS[i]), x0: a, y0: fa, tone: "ghost" });
  lines.push({ m: mT, x0: a, y0: fa, tone: "tan" });
  lines.push({ m: mR, x0: a, y0: fa, tone: "sec" });

  const marks: PlotMark[] = [
    { x: a + h, y: t.fn(a + h), tone: "b" },
    { x: a - h, y: t.fn(a - h), tone: "b", open: true },
    { x: a, y: fa, tone: "tan" },
  ];

  const rows = [];
  for (let i = 0; i <= k; i++) {
    const g = TAN_GAPS[i];
    rows.push({ i, g, r: slopeAt(t.fn, a, g), l: slopeAt(t.fn, a, -g) });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.07] to-emerald-500/[0.04] p-4">
        <p className="text-sm font-bold text-violet-200">🔭 Δx 를 좁혀 가며 할선이 어디로 눕는지 보세요</p>

        <div className="mt-2">
          <PickRow
            items={TAN_FNS}
            at={ti}
            accent="violet"
            onPick={(i) => {
              setTi(i);
              setA(TAN_FNS[i].a0);
              setK(0);
            }}
          />
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-center">
          <Katex expr={t.tex} className="text-lg text-slate-100" />
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="space-y-3">
            <Knob
              label="접점의 자리 a"
              value={a}
              min={t.aMin}
              max={t.aMax}
              step={t.aStep}
              accent="violet"
              onChange={(z) => {
                setA(z);
                setK(0);
              }}
            />

            <div className="overflow-x-auto overflow-y-hidden py-1">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-slate-200">Δx</th>
                    <th className="border border-white/10 bg-rose-400/[0.14] px-2 py-1 text-[10px] font-bold text-rose-100">
                      오른쪽 할선의 기울기
                    </th>
                    <th className="border border-white/10 bg-sky-400/[0.14] px-2 py-1 text-[10px] font-bold text-sky-100">
                      왼쪽 할선의 기울기
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.i}>
                      <td className="border border-white/10 px-2 py-1 text-right font-mono text-[11px] tabular-nums text-slate-300">
                        {fmt(r.g, 4)}
                      </td>
                      <td className="border border-white/10 px-2 py-1 text-right font-mono text-[11px] tabular-nums text-rose-100">
                        {fmt(r.r, 4)}
                      </td>
                      <td className="border border-white/10 px-2 py-1 text-right font-mono text-[11px] tabular-nums text-sky-100">
                        {fmt(r.l, 4)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-white/10 bg-emerald-400/[0.10] px-2 py-1 text-right font-mono text-[11px] font-bold text-emerald-200">
                      ↓ 0
                    </td>
                    <td className="border border-white/10 bg-emerald-400/[0.10] px-2 py-1 text-right font-mono text-[11px] font-bold text-emerald-200">
                      ↓ {fmt(mT, 4)}
                    </td>
                    <td className="border border-white/10 bg-emerald-400/[0.10] px-2 py-1 text-right font-mono text-[11px] font-bold text-emerald-200">
                      ↓ {fmt(mT, 4)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={k >= TAN_GAPS.length - 1}
                onClick={() => setK(k + 1)}
                className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.violet}
              >
                🔭 Δx 를 더 좁히기
              </button>
              <button
                type="button"
                onClick={() => setK(0)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                ↩️ 처음으로
              </button>
              <span className="font-mono text-[11px] text-slate-400">
                {k + 1} / {TAN_GAPS.length} 단계 · Δx = {fmt(h, 4)}
              </span>
            </div>

            <div className="rounded-xl border-2 border-emerald-400/45 bg-emerald-400/[0.08] px-3 py-3 text-center">
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex
                  expr={
                    "f'(" +
                    fmt(a) +
                    ") = \\lim_{\\Delta x \\to 0} \\dfrac{f(" +
                    fmt(a) +
                    " + \\Delta x) - f(" +
                    fmt(a) +
                    ")}{\\Delta x} = " +
                    fmt(mT)
                  }
                  className="whitespace-nowrap text-base text-emerald-100"
                />
              </div>
              <div className="mt-1 overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={t.dTex} className="whitespace-nowrap text-sm text-slate-300" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <Plot box={t.box} paths={paths} lines={lines} marks={marks} uid={"tan-" + t.id} axis={["x", "y"]} />
            </div>
            <p className="text-center text-[10px] leading-4 text-slate-500">
              초록 점 P({fmt(a)}, {fmt(fa)}) · 분홍 점 Q 가 다가오는 중 · 흐린 분홍은 지나온 할선 · 초록 직선이 접선
            </p>
            <TipBox>{t.note}</TipBox>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "Q 가 P 에 다가갈수록 할선이 접선 쪽으로 눕습니다.",
              "오른쪽에서 간 값과 왼쪽에서 간 값이 같은 수로 모여요.",
              "그 모인 값이 미분계수 f'(a) 이고, 접선의 기울기입니다.",
              "Δx 는 0 에 가까워질 뿐 0 이 되지는 않아요.",
            ]}
          />
        </div>
      </div>

      <StepRunner
        steps={TAN_STEPS}
        accent="violet"
        finale="한 점에서의 기울기를 붙잡았어요. 이제 이 기울기를 자리마다 모아 봐요!"
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 미분계수 모으기
// ══════════════════════════════════════════════════════════════
const JOIN_MIN = 8;

function DerivTab() {
  const [gi, setGi] = useState(0);
  const [a, setA] = useState(DERIV_FNS[0].a0);
  const [pts, setPts] = useState<number[]>([]);
  const [joined, setJoined] = useState(false);
  const [scanning, setScanning] = useState(false);
  const timer = useRef<number | null>(null);

  const stop = () => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  };
  useEffect(() => stop, []);

  const g = DERIV_FNS[gi];
  const fa = g.fn(a);
  const da = g.d(a);

  const fPaths = samplePath(g.fn, g.fBox);
  const dPaths = joined ? samplePath(g.d, g.dBox) : [];
  const fLines: PlotLine[] = [{ m: da, x0: a, y0: fa, tone: "tan" }];
  const fMarks: PlotMark[] = [{ x: a, y: fa, tone: "tan" }];
  const dMarks: PlotMark[] = pts.map((x) => ({ x, y: g.d(x), tone: "ghost" as const }));
  dMarks.push({ x: a, y: da, tone: "dot" });

  const reset = (i: number) => {
    stop();
    setScanning(false);
    setGi(i);
    setA(DERIV_FNS[i].a0);
    setPts([]);
    setJoined(false);
  };

  const scan = () => {
    if (timer.current !== null) return;
    let cur = g.xMin;
    setA(cur);
    setPts([cur]);
    setJoined(false);
    setScanning(true);
    timer.current = window.setInterval(() => {
      cur = Number((cur + g.scanStep).toFixed(6));
      if (cur > g.xMax + 1e-9) {
        stop();
        setScanning(false);
        return;
      }
      const at = cur;
      setA(at);
      setPts((z) => [...z, at]);
    }, 70);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.07] to-amber-500/[0.04] p-4">
        <p className="text-sm font-bold text-emerald-200">📍 접선을 끌고 다니며 기울기를 아래 평면에 찍어 모아 보세요</p>

        <div className="mt-2">
          <PickRow items={DERIV_FNS} at={gi} accent="emerald" onPick={reset} />
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-center">
          <Katex expr={g.tex} className="text-lg text-slate-100" />
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="space-y-2">
            <div className="flex justify-center">
              <Plot box={g.fBox} paths={fPaths} lines={fLines} marks={fMarks} uid={"dv-f-" + g.id} axis={["x", "y"]} />
            </div>
            <p className="text-center text-[11px] font-bold text-sky-200">
              위 — 원래 함수 <span className="text-slate-400">({g.deg})</span>
            </p>
            <div className="flex justify-center">
              <Plot box={g.dBox} paths={dPaths} curve="d" marks={dMarks} uid={"dv-d-" + g.id} axis={["x", "f'(x)"]} />
            </div>
            <p className="text-center text-[11px] font-bold text-amber-200">
              아래 — 모은 기울기 {joined ? <span className="text-slate-400">({g.dDeg})</span> : null}
            </p>
          </div>

          <div className="space-y-3">
            <Knob
              label="접점의 자리 a"
              value={a}
              min={g.xMin}
              max={g.xMax}
              step={g.scanStep}
              accent="emerald"
              onChange={(z) => {
                stop();
                setScanning(false);
                setA(z);
              }}
            />

            <div className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-center">
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex
                  expr={"a = " + fmt(a) + " \\quad\\Rightarrow\\quad f'(" + fmt(a) + ") = " + fmt(da)}
                  className="whitespace-nowrap text-base text-emerald-100"
                />
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                아래 평면의 ({fmt(a)}, {fmt(da)}) 자리에 찍힙니다
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={scanning}
                onClick={() => setPts((z) => (z.includes(a) ? z : [...z, a]))}
                className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.emerald}
              >
                📍 여기 찍기
              </button>
              <button
                type="button"
                disabled={scanning}
                onClick={scan}
                className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.amber}
              >
                ⏩ 자동으로 쭉 찍기
              </button>
              <button
                type="button"
                onClick={() => {
                  stop();
                  setScanning(false);
                  setPts([]);
                  setJoined(false);
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                🧹 지우기
              </button>
              <span className="font-mono text-[11px] text-slate-400">찍은 점 {pts.length}개</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={pts.length < JOIN_MIN || scanning}
                onClick={() => setJoined(!joined)}
                className={
                  "rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.sky
                }
              >
                {joined ? "✏️ 곡선 숨기기" : "✏️ 점을 이어 보기"}
              </button>
              {pts.length < JOIN_MIN ? (
                <span className="text-[11px] text-slate-400">점을 {JOIN_MIN}개 넘게 찍으면 이어 볼 수 있어요</span>
              ) : null}
            </div>

            {joined ? (
              <div className="rounded-xl border-2 border-amber-400/45 bg-amber-400/[0.08] px-3 py-3 text-center">
                <p className="text-[11px] font-bold text-amber-200">모은 기울기가 만든 새 함수 — 도함수</p>
                <div className="mt-1 overflow-x-auto overflow-y-hidden py-1">
                  <Katex expr={g.dTex} className="whitespace-nowrap text-lg text-amber-100" />
                </div>
                <p className="mt-1 text-[11px] text-slate-300">
                  <b className="text-sky-200">{g.deg}</b> 의 도함수는 <b className="text-amber-200">{g.dDeg}</b> 가 되었어요
                </p>
              </div>
            ) : null}

            <TipBox>{g.note}</TipBox>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "접점을 옮길 때마다 접선의 기울기가 바뀌어요. 그 값을 아래 평면에 세로 자리로 찍습니다.",
              "자리마다 하나씩 정해지므로 이것도 하나의 함수예요 — 그것이 도함수 f'(x) 입니다.",
              "네 함수를 모두 해 보면 차수가 하나씩 내려가는 것이 보여요.",
              "도함수에 x = a 를 넣은 함숫값이 바로 미분계수 f'(a) 입니다.",
            ]}
          />
        </div>
      </div>

      <StepRunner
        steps={DERIV_STEPS}
        accent="emerald"
        finale="도함수가 어디서 왔는지 보았어요. 이제 매번 모으지 않고 바로 구하는 공식을 찾아봐요!"
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 미분 공식
// ══════════════════════════════════════════════════════════════
function termTex(c: number, p: number): string {
  if (c === 0) return "0";
  if (p === 0) return fmt(c);
  const co = c === 1 ? "" : c === -1 ? "-" : fmt(c);
  return co + (p === 1 ? "x" : "x^{" + p + "}");
}
function polyTex(ts: { c: number; p: number }[]): string {
  const parts = ts.filter((t) => t.c !== 0);
  if (parts.length === 0) return "0";
  let out = termTex(parts[0].c, parts[0].p);
  for (let i = 1; i < parts.length; i++) {
    const t = parts[i];
    out += t.c < 0 ? " - " + termTex(-t.c, t.p) : " + " + termTex(t.c, t.p);
  }
  return out;
}

const TERM_RING = [
  "border-sky-400/50 bg-sky-400/[0.10]",
  "border-violet-400/50 bg-violet-400/[0.10]",
  "border-teal-400/50 bg-teal-400/[0.10]",
  "border-rose-400/50 bg-rose-400/[0.10]",
];
const TERM_TEXT = ["text-sky-200", "text-violet-200", "text-teal-200", "text-rose-200"];

function PowTab() {
  const [n, setN] = useState(2);
  const [ci, setCi] = useState(1);
  const [poly, setPoly] = useState<Record<"p" | "q" | "r" | "s", number>>({ ...POLY_START });
  const [open, setOpen] = useState<number | null>(null);

  const rows = [];
  for (let i = 1; i <= n; i++) rows.push(i);

  const terms = [
    { c: poly.p, p: 3 },
    { c: poly.q, p: 2 },
    { c: poly.r, p: 1 },
    { c: poly.s, p: 0 },
  ];
  const dTerms = terms.map((t) => ({ c: t.p === 0 ? 0 : t.c * t.p, p: t.p === 0 ? 0 : t.p - 1 }));
  const fn = (x: number) => poly.p * x * x * x + poly.q * x * x + poly.r * x + poly.s;
  const dfn = (x: number) => 3 * poly.p * x * x + 2 * poly.q * x + poly.r;
  const fBox = autoBox(fn, POLY_X[0], POLY_X[1], 1);
  const dBox = autoBox(dfn, POLY_X[0], POLY_X[1], 1);

  const WHY = [
    "x³ 의 지수 3 이 앞으로 내려와 계수에 곱해지고, 지수는 2 로 줄어요.",
    "x² 의 지수 2 가 앞으로 내려와 계수에 곱해지고, 지수는 1 로 줄어요.",
    "x 는 x¹ 이에요. 지수 1 이 내려와 계수만 남고 x 는 사라집니다.",
    "상수항은 아무리 커도 그래프를 위아래로 옮길 뿐이라 기울기를 바꾸지 않아요. 그래서 0 입니다.",
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.07] to-sky-500/[0.04] p-4">
        <p className="text-sm font-bold text-amber-200">🔑 지수가 앞으로 내려오는 규칙을 하나씩 밝혀 보세요</p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <Knob label="지수 n" value={n} min={1} max={POW_MAX} step={1} accent="amber" onChange={setN} />

            <div className="rounded-xl border-2 border-amber-400/45 bg-amber-400/[0.08] px-3 py-3 text-center">
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={"f(x) = " + (n === 1 ? "x" : "x^{" + n + "}")} className="whitespace-nowrap text-xl text-slate-100" />
              </div>
              <div className="my-1 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-lg border border-emerald-400/50 bg-emerald-400/15 px-2 py-0.5 text-[11px] font-bold text-emerald-100">
                  ⤵ 지수 {n} 이 앞으로
                </span>
                <span className="rounded-lg border border-violet-400/50 bg-violet-400/15 px-2 py-0.5 text-[11px] font-bold text-violet-100">
                  ⤵ 지수는 {n - 1} 로
                </span>
              </div>
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={"f'(x) = " + termTex(n, n - 1)} className="whitespace-nowrap text-xl text-amber-100" />
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-hidden py-1">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-slate-200">n</th>
                    <th className="border border-white/10 bg-sky-400/[0.14] px-2 py-1 text-[10px] font-bold text-sky-100">f(x)</th>
                    <th className="border border-white/10 bg-amber-400/[0.14] px-2 py-1 text-[10px] font-bold text-amber-100">
                      f&apos;(x)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((i) => (
                    <tr key={i}>
                      <td className="border border-white/10 px-2 py-1 text-center font-mono text-[11px] text-slate-300">{i}</td>
                      <td className="border border-white/10 px-2 py-1 text-center">
                        <Katex expr={termTex(1, i)} className="text-sm text-sky-100" />
                      </td>
                      <td className="border border-white/10 px-2 py-1 text-center">
                        <Katex expr={termTex(i, i - 1)} className="text-sm text-amber-100" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-rose-400/35 bg-rose-400/[0.07] px-3 py-2">
              <p className="text-[11px] font-bold text-rose-200">상수함수는 어떨까요?</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {POW_CONSTS.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCi(i)}
                    className={
                      "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                      (ci === i ? ACC_CHIP.rose : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                    }
                  >
                    c = {c}
                  </button>
                ))}
              </div>
              <div className="mt-2 overflow-x-auto overflow-y-hidden py-1 text-center">
                <Katex
                  expr={"f(x) = " + fmt(POW_CONSTS[ci]) + " \\quad\\Rightarrow\\quad f'(x) = 0"}
                  className="whitespace-nowrap text-base text-rose-100"
                />
              </div>
              <p className="mt-0.5 text-center text-[11px] text-slate-400">
                어떤 수를 골라도 0 이에요 — 값이 변하지 않으니까요
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold text-sky-200">🧱 항을 조립해 한꺼번에 미분해 보세요</p>

            <div className="grid gap-3 sm:grid-cols-2">
              {POLY_KNOBS.map((kb) => (
                <Knob
                  key={kb.id}
                  label={kb.label}
                  value={poly[kb.id]}
                  min={kb.min}
                  max={kb.max}
                  step={1}
                  accent="sky"
                  onChange={(z) => setPoly((v) => ({ ...v, [kb.id]: z }))}
                />
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-center">
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={"f(x) = " + polyTex(terms)} className="whitespace-nowrap text-lg text-sky-100" />
              </div>
              <div className="mt-1 overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={"f'(x) = " + polyTex(dTerms)} className="whitespace-nowrap text-lg text-amber-100" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {terms.map((t, i) => (
                <button
                  key={POLY_KNOBS[i].id}
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  className={
                    "rounded-xl border-2 px-1 py-2 text-center transition " +
                    (t.c === 0 ? "border-white/10 bg-white/[0.03] opacity-50" : TERM_RING[i])
                  }
                >
                  <Katex expr={termTex(t.c, t.p)} className={"block text-sm " + TERM_TEXT[i]} />
                  <span className="block text-[10px] text-slate-500">↓</span>
                  <Katex expr={termTex(dTerms[i].c, dTerms[i].p)} className="block text-sm text-amber-100" />
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] text-slate-500">항 카드를 누르면 왜 그렇게 되는지 나와요</p>
            {open !== null ? <TipBox>{WHY[open]}</TipBox> : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="flex justify-center">
                  <Plot box={fBox} paths={samplePath(fn, fBox)} uid="pow-f" axis={["x", "f(x)"]} />
                </div>
                <p className="text-center text-[11px] font-bold text-sky-200">원래 함수 f(x)</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-center">
                  <Plot box={dBox} paths={samplePath(dfn, dBox)} curve="d" uid="pow-d" axis={["x", "f'(x)"]} />
                </div>
                <p className="text-center text-[11px] font-bold text-amber-200">도함수 f&apos;(x)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "지수가 계수 자리로 내려오고 지수는 1 줄어듭니다 — 이것이 (xⁿ)′ = n xⁿ⁻¹ 이에요.",
              "실수배는 그대로 따라가고, 합과 차는 항마다 따로 미분해 이어 붙입니다.",
              "상수항은 어떤 값이어도 0 이 되어 사라져요.",
              "f 가 삼차면 f′ 은 이차 — 탭 ③ 에서 본 그대로입니다.",
            ]}
          />
        </div>
      </div>

      <StepRunner
        steps={POW_STEPS}
        accent="amber"
        finale="이제 식만 보고도 바로 미분할 수 있어요. 마지막으로 경제 장면에서 써 봐요!"
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ 경제 속 순간변화율
// ══════════════════════════════════════════════════════════════
function EcoTab() {
  const [ei, setEi] = useState(0);
  const [x, setX] = useState(ECO_SCENES[0].x0);

  const e = ECO_SCENES[ei];
  const fx = e.fn(x);
  const dx1 = e.d(x);
  const nextX = Math.min(x + 1, e.xMax);
  const realDiff = e.fn(nextX) - fx;
  const up = dx1 > 0;

  // 광고비·생산량 같은 값은 음수가 없으므로 정의역 밖은 아예 그리지 않는다
  const inDomain = (fn: (v: number) => number) => (v: number) =>
    v < e.xMin - 1e-9 || v > e.xMax + 1e-9 ? NaN : fn(v);
  const fPaths = samplePath(inDomain(e.fn), e.fBox);
  const dPaths = samplePath(inDomain(e.d), e.dBox);
  const fLines: PlotLine[] = [{ m: dx1, x0: x, y0: fx, tone: "tan" }];
  const fMarks: PlotMark[] = [{ x, y: fx, tone: "tan" }];
  const dMarks: PlotMark[] = [{ x, y: dx1, tone: "dot" }];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-rose-400/25 bg-gradient-to-br from-rose-500/[0.07] to-amber-500/[0.04] p-4">
        <p className="text-sm font-bold text-rose-200">💼 도함수가 그 장면에서 무엇을 알려 주는지 읽어 보세요</p>

        <div className="mt-2">
          <PickRow
            items={ECO_SCENES}
            at={ei}
            accent="rose"
            onPick={(i) => {
              setEi(i);
              setX(ECO_SCENES[i].x0);
            }}
          />
        </div>

        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-6 text-slate-300">
          {e.emoji} {e.story}
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-center">
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={e.tex} className="whitespace-nowrap text-base text-sky-100" />
              </div>
              <div className="mt-1 overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={e.dTex} className="whitespace-nowrap text-base text-amber-100" />
              </div>
            </div>

            <Knob
              label={e.xLabel}
              value={x}
              min={e.xMin}
              max={e.xMax}
              step={e.xStep}
              accent="rose"
              suffix={e.xUnit}
              onChange={setX}
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-sky-400/40 bg-sky-400/[0.08] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-sky-200">{e.yLabel}</p>
                <p className="mt-0.5 font-mono text-lg font-bold text-sky-100">
                  {won(fx)} <span className="text-[11px] font-normal text-slate-400">{e.yUnit}</span>
                </p>
              </div>
              <div className="rounded-xl border-2 border-amber-400/50 bg-amber-400/[0.10] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-amber-200">{e.rateName}</p>
                <p className="mt-0.5 font-mono text-lg font-bold text-amber-100">
                  {fmt(dx1)} <span className="text-[11px] font-normal text-slate-400">{e.rateUnit}</span>
                </p>
              </div>
            </div>

            <div
              className={
                "rounded-xl border-l-4 px-3 py-2 text-xs leading-6 " +
                (up ? "border-emerald-400 bg-emerald-400/[0.08] text-emerald-100" : "border-rose-400 bg-rose-400/[0.08] text-rose-100")
              }
            >
              {up ? "📈 " : "📉 "}
              {e.xLabel} 이(가) {fmt(x)}
              {e.xUnit} 일 때, {up ? e.up : e.down}은 약{" "}
              <b>
                {won(Math.abs(dx1))} {e.yUnit}
              </b>{" "}
              입니다.
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="text-[11px] font-bold text-slate-300">접선의 기울기와 실제로 1 만큼 간 변화를 견주어 보면</p>
              <div className="mt-1 grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-slate-500">순간변화율 (접선의 기울기)</p>
                  <p className="font-mono text-sm font-bold text-amber-100">{fmt(dx1)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">
                    실제 변화 f({fmt(nextX)}) - f({fmt(x)})
                  </p>
                  <p className="font-mono text-sm font-bold text-slate-200">{fmt(realDiff)}</p>
                </div>
              </div>
              <p className="mt-1 text-[10px] leading-5 text-slate-500">
                1 만큼 간 것은 Δx = 1 일 때의 평균변화율이라 순간변화율과 조금 다릅니다. Δx 가 작을수록 둘이 가까워져요.
              </p>
            </div>

            <TipBox>{e.note}</TipBox>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <Plot
                box={e.fBox}
                paths={fPaths}
                lines={fLines}
                marks={fMarks}
                uid={"eco-f-" + e.id}
                axis={[e.xLabel + " (" + e.xUnit + ")", e.yLabel]}
                yFmt={(v) => won(v)}
              />
            </div>
            <p className="text-center text-[11px] font-bold text-sky-200">원래 함수 · 초록 직선이 접선</p>
            <div className="flex justify-center">
              <Plot
                box={e.dBox}
                paths={dPaths}
                curve="d"
                marks={dMarks}
                guideY={0}
                uid={"eco-d-" + e.id}
                axis={[e.xLabel + " (" + e.xUnit + ")", e.rateName]}
                yFmt={(v) => won(v)}
              />
            </div>
            <p className="text-center text-[11px] font-bold text-amber-200">도함수 · 주황 점이 지금 자리</p>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "도함수의 값은 '1 만큼 더 갈 때 얼마나 변하는가' 를 알려 줍니다.",
              "부호가 양수면 늘고 있는 중, 음수면 줄고 있는 중이에요.",
              "값이 0 이 되는 자리는 접선이 가로로 눕는 곳 — 최댓값이나 최솟값이 있는 자리입니다.",
              "비용에서는 이것을 한계비용이라 부르고, 얼마나 더 만들지 정할 때 씁니다.",
            ]}
          />
        </div>
      </div>

      <StepRunner
        steps={ECO_STEPS}
        accent="rose"
        finale="평균변화율에서 출발해 도함수까지, 그리고 경제 판단까지 이어 보았어요!"
      />

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">
        {REAL_NOTE}
      </p>
    </div>
  );
}
