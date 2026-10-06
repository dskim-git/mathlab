"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  COST_SCENES,
  COST_STEPS,
  PROD_SCENES,
  PROD_STEPS,
  REAL_NOTE,
  REV_SCENES,
  REV_STEPS,
  UTIL_GAPS,
  UTIL_GAP_TEX,
  UTIL_SCENES,
  UTIL_STEPS,
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
    id: "common_frame",
    prompt:
      "효용 · 비용 · 생산량 · 수입 네 가지 모두에서 '한 단위 더' 를 도함수로 나타냈어요. 네 가지 한계 개념에 공통으로 들어 있는 틀을 자기 말로 정리하고, 왜 모두 미분으로 표현되는지도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 네 가지 모두 Δy/Δx 를 구한 뒤 Δx 를 0 으로 보낸 것이었다. '한 단위 더 늘릴 때 얼마나 변하는가' 를 묻는 것이라서, 그 답이 곧 순간변화율인 도함수가 된다.",
  },
  {
    id: "decreasing",
    prompt:
      "한계효용은 계속 줄었고, 한계비용은 줄다가 늘었으며, 한계생산량은 늘다가 줄어 음수까지 갔어요. 셋 가운데 하나를 골라 그 변화가 현실에서 무슨 뜻인지 설명하고, 한계값이 0 이 되는 자리가 무엇을 알려 주는지도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 빵집에서 한계생산량이 12명에서 0 이 되었는데, 주방과 오븐이 정해져 있어 그 위로는 사람이 늘어도 더 못 만든다는 뜻이다. 0 이 되는 자리가 생산량이 가장 많아지는 자리였다.",
  },
  {
    id: "decision",
    prompt:
      "한계수입 탭에서 값을 올리면 판매량이 줄어 수입이 포물선을 그렸어요. 내가 가게 주인이라면 값(또는 생산량 · 고용 인원)을 정할 때 어떤 값을 보고 판단하겠는지 근거와 함께 써 보세요.",
    kind: "text",
    placeholder:
      "예: 한계수입의 부호를 보겠다. 양수면 아직 올릴 여지가 있고 음수면 이미 지나친 것이므로, 0 이 되는 자리를 찾아 그 값으로 매기겠다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "util" | "cost" | "prod" | "rev";

export default function MarginalLab() {
  const [tab, setTab] = useState<Tab>("util");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">📊 경제함수의 미분 — 네 가지 한계</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-violet-200">한계효용</b> · <b className="text-amber-200">한계비용</b> ·{" "}
          <b className="text-emerald-200">한계생산량</b> · <b className="text-sky-200">한계수입</b> — 이름은 달라도 모두
          &ldquo;한 단위 더&rdquo; 를 묻는 같은 물음이에요. 직접 움직여 확인해 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "util"} onClick={() => setTab("util")}>① 한계효용</TabButton>
        <TabButton active={tab === "cost"} onClick={() => setTab("cost")}>② 한계비용</TabButton>
        <TabButton active={tab === "prod"} onClick={() => setTab("prod")}>③ 한계생산량</TabButton>
        <TabButton active={tab === "rev"} onClick={() => setTab("rev")}>④ 한계수입</TabButton>
      </div>

      <div className="mt-4">
        {tab === "util" ? <UtilTab /> : null}
        {tab === "cost" ? <CostTab /> : null}
        {tab === "prod" ? <ProdTab /> : null}
        {tab === "rev" ? <RevTab /> : null}
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
const PML = 48;
const PMR = 14;
const PMT = 16;
const PMB = 30;

type LineTone = "tan" | "zero";
type PlotLine = { m: number; x0: number; y0: number; tone: LineTone };
const LINE_COLOR: Record<LineTone, string> = { tan: "#34d399", zero: "#f472b6" };

type MarkTone = "tan" | "dot" | "mid";
type PlotMark = { x: number; y: number; tone: MarkTone };
const MARK_COLOR: Record<MarkTone, string> = { tan: "#34d399", dot: "#fb923c", mid: "#fde047" };
const MARK_R: Record<MarkTone, number> = { tan: 5.5, dot: 5, mid: 3.4 };

export type PlotBar = { x0: number; x1: number; y: number };

function Plot({
  box,
  paths,
  curve = "f",
  bars = [],
  lines = [],
  marks = [],
  guideX,
  guideY,
  uid,
  axis,
  yFmt,
}: {
  box: Box;
  paths: [number, number][][];
  curve?: "f" | "d";
  bars?: PlotBar[];
  lines?: PlotLine[];
  marks?: PlotMark[];
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
  const cid = "mg-" + uid;
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
        {bars.map((b, i) => (
          <rect
            key={i}
            x={X(b.x0) + 1}
            y={Y(Math.max(b.y, 0))}
            width={Math.max(X(b.x1) - X(b.x0) - 2, 1)}
            height={Math.max(Math.abs(Y(b.y) - Y(0)), 1)}
            fill={b.y >= 0 ? "rgba(167,139,250,0.28)" : "rgba(244,114,182,0.28)"}
            stroke={b.y >= 0 ? "#a78bfa" : "#f472b6"}
            strokeWidth="1.2"
          />
        ))}
        {guideY !== undefined ? (
          <line x1={PML} y1={Y(guideY)} x2={PS - PMR} y2={Y(guideY)} stroke="rgba(52,211,153,0.4)" strokeDasharray="4 3" />
        ) : null}
        {guideX !== undefined ? (
          <line x1={X(guideX)} y1={PMT} x2={X(guideX)} y2={PS - PMB} stroke="rgba(148,163,184,0.45)" strokeDasharray="4 3" />
        ) : null}
        {lines.map((ln, i) => (
          <line
            key={i}
            x1={X(box.xMin)}
            y1={Y(ln.m * (box.xMin - ln.x0) + ln.y0)}
            x2={X(box.xMax)}
            y2={Y(ln.m * (box.xMax - ln.x0) + ln.y0)}
            stroke={LINE_COLOR[ln.tone]}
            strokeWidth="2.3"
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

      {/* 점은 clipPath 밖에 그린다 */}
      {marks
        .filter((m) => m.x >= box.xMin && m.x <= box.xMax && m.y >= box.yMin && m.y <= box.yMax)
        .map((m, i) => (
          <circle key={i} cx={X(m.x)} cy={Y(m.y)} r={MARK_R[m.tone]} fill={MARK_COLOR[m.tone]} stroke={MARK_COLOR[m.tone]} strokeWidth="2" />
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
//  탭 ① 한계효용 — 총효용 막대
// ══════════════════════════════════════════════════════════════
const UB_W = 320;
const UB_H = 320;
const UB_L = 48;
const UB_R = 14;
const UB_T = 24;
const UB_B = 30;

function UtilBars({ vals, shown, top }: { vals: number[]; shown: number; top: number }) {
  const n = vals.length;
  const pw = UB_W - UB_L - UB_R;
  const ph = UB_H - UB_T - UB_B;
  const slot = pw / n;
  const bw = slot * 0.62;
  const Y = (v: number) => UB_H - UB_B - (v / top) * ph;

  return (
    <svg viewBox={"0 0 " + UB_W + " " + UB_H} className="w-full max-w-[320px]" role="img" aria-label="총효용 막대">
      <rect x={UB_L} y={UB_T} width={pw} height={ph} fill="#0b1220" stroke="rgba(255,255,255,0.12)" />
      <line x1={UB_L} y1={UB_H - UB_B} x2={UB_W - UB_R} y2={UB_H - UB_B} stroke="rgba(255,255,255,0.3)" />
      <line x1={UB_L} y1={UB_T} x2={UB_L} y2={UB_H - UB_B} stroke="rgba(255,255,255,0.3)" />
      {vals.map((v, i) => {
        const cx = UB_L + slot * i + slot / 2;
        const on = i <= shown;
        if (!on) return null;
        const h = Math.max(Y(0) - Y(v), 0);
        return (
          <g key={i}>
            <rect
              x={cx - bw / 2}
              y={Y(v)}
              width={bw}
              height={h}
              fill={i === shown ? "rgba(52,211,153,0.35)" : "rgba(56,189,248,0.22)"}
              stroke={i === shown ? "#34d399" : "#38bdf8"}
              strokeWidth="1.2"
            />
            <text x={cx} y={Y(v) - 4} textAnchor="middle" fontSize="9" fill={i === shown ? "#6ee7b7" : "#94a3b8"}>
              {v}
            </text>
            <text x={cx} y={UB_H - UB_B + 11} textAnchor="middle" fontSize="9" fill="#64748b">
              {i}
            </text>
          </g>
        );
      })}
      {shown > 0 ? (
        <g>
          <line
            x1={UB_L + slot * (shown - 1) + slot / 2}
            y1={Y(vals[shown - 1])}
            x2={UB_L + slot * shown + slot / 2}
            y2={Y(vals[shown - 1])}
            stroke="#fde047"
            strokeDasharray="3 2"
          />
          <line
            x1={UB_L + slot * shown + slot / 2}
            y1={Y(vals[shown - 1])}
            x2={UB_L + slot * shown + slot / 2}
            y2={Y(vals[shown])}
            stroke="#fde047"
            strokeWidth="2.4"
          />
          <text x={UB_L + slot * shown + slot / 2 + 5} y={(Y(vals[shown - 1]) + Y(vals[shown])) / 2 + 3} fontSize="10" fill="#fde047">
            {vals[shown] - vals[shown - 1] >= 0 ? "+" : ""}
            {vals[shown] - vals[shown - 1]}
          </text>
        </g>
      ) : null}
      <text x={2} y={UB_T - 8} fontSize="8" fill="#475569">
        총효용
      </text>
      <text x={UB_W - UB_R} y={UB_H - 3} textAnchor="end" fontSize="8" fill="#475569">
        소비량
      </text>
    </svg>
  );
}

function UtilTab() {
  const [si, setSi] = useState(0);
  const [n, setN] = useState(1);
  const [x0, setX0] = useState(3);
  const [gk, setGk] = useState(0);

  const s = UTIL_SCENES[si];
  const vals: number[] = [];
  for (let i = 0; i <= s.nMax; i++) vals.push(s.fn(i));
  const top = Math.max(...vals) * 1.15;

  const bars: PlotBar[] = [];
  const mids: PlotMark[] = [];
  for (let k = 0; k < n; k++) {
    const inc = vals[k + 1] - vals[k];
    bars.push({ x0: k, x1: k + 1, y: inc });
    mids.push({ x: k + 0.5, y: inc, tone: "mid" });
  }

  // Δx 가 2 의 거듭제곱의 역수라 Δy 는 소수 여덟 자리 안에서 반올림 없이 딱 떨어진다
  const rows = [];
  for (let i = 0; i <= gk; i++) {
    const h = UTIL_GAPS[i];
    const ua = s.fn(x0);
    const ub = s.fn(x0 + h);
    const hs = fmt(h, 8);
    rows.push({
      i,
      h,
      rate: (ub - ua) / h,
      expr:
        "\\dfrac{\\Delta y}{\\Delta x} = \\dfrac{U(" +
        fmt(x0 + h, 8) +
        ") - U(" +
        fmt(x0, 8) +
        ")}{" +
        hs +
        "} = \\dfrac{" +
        fmt(ub - ua, 8) +
        "}{" +
        hs +
        "} = " +
        fmt((ub - ua) / h, 8),
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.07] to-sky-500/[0.04] p-4">
        <p className="text-sm font-bold text-violet-200">🥤 한 개씩 더 소비하며 만족이 얼마나 늘어나는지 보세요</p>

        <div className="mt-2">
          <PickRow
            items={UTIL_SCENES}
            at={si}
            accent="violet"
            onPick={(i) => {
              setSi(i);
              setN(1);
              setX0(3);
              setGk(0);
            }}
          />
        </div>

        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-6 text-slate-300">
          {s.emoji} {s.story}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={n >= s.nMax}
            onClick={() => setN(n + 1)}
            className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.violet}
          >
            ➕ 한 {s.unit} 더
          </button>
          <button
            type="button"
            onClick={() => setN(1)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 처음으로
          </button>
          <span className="font-mono text-[11px] text-slate-400">
            지금까지 {n} {s.unit} · 총효용 {vals[n]} · 방금 얻은 만족 {vals[n] - vals[n - 1] >= 0 ? "+" : ""}
            {vals[n] - vals[n - 1]}
          </span>
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex justify-center">
              <UtilBars vals={vals} shown={n} top={top} />
            </div>
            <p className="text-center text-[10px] leading-4 text-slate-500">
              막대는 지금까지 쌓인 총효용 · 노란 화살표가 방금 한 {s.unit} 으로 늘어난 몫(한계효용)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <Plot
                box={s.mBox}
                paths={samplePath(s.d, s.mBox)}
                curve="d"
                bars={bars}
                marks={mids}
                uid={"util-m-" + s.id}
                axis={["소비량", "한계효용"]}
              />
            </div>
            <p className="text-center text-[10px] leading-4 text-slate-500">
              보라 막대가 한 {s.unit} 씩의 한계효용 · 주황 직선이 한계효용함수 · 노란 점은 막대 한가운데
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-sky-400/40 bg-sky-400/[0.08] px-3 py-2 text-center">
            <p className="text-[11px] font-bold text-sky-200">효용함수</p>
            <div className="mt-0.5 overflow-x-auto overflow-y-hidden py-1">
              <Katex expr={s.tex} className="whitespace-nowrap text-sm text-sky-100" />
            </div>
          </div>
          <div className="rounded-xl border-2 border-amber-400/50 bg-amber-400/[0.10] px-3 py-2 text-center">
            <p className="text-[11px] font-bold text-amber-200">한계효용함수</p>
            <div className="mt-0.5 overflow-x-auto overflow-y-hidden py-1">
              <Katex expr={s.dTex} className="whitespace-nowrap text-sm text-amber-100" />
            </div>
          </div>
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] px-3 py-2 text-center">
            <p className="text-[11px] font-bold text-emerald-200">지금 자리의 한계효용</p>
            <p className="mt-0.5 font-mono text-lg font-bold text-emerald-100">{fmt(s.d(n))}</p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="text-xs font-bold text-slate-200">
            🔭 한 번에 소비하는 양 Δx 를 줄여 가면 — 평균변화율이 한계효용으로 바뀝니다
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
            <Knob label={"기준 소비량 x"} value={x0} min={0} max={s.nMax - 1} step={1} accent="violet" suffix={s.unit} onChange={(z) => { setX0(z); setGk(0); }} />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={gk >= UTIL_GAPS.length - 1}
                onClick={() => setGk(gk + 1)}
                className={"rounded-lg border-2 px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-40 " + ACC_BTN.sky}
              >
                🔎 Δx 를 반으로
              </button>
              <button
                type="button"
                onClick={() => setGk(0)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                ↩️ 되돌리기
              </button>
            </div>
          </div>

          <div className="mt-2 overflow-x-auto overflow-y-hidden py-1">
            <table className="w-full border-collapse text-base">
              <thead>
                <tr>
                  <th className="w-28 border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-slate-200">
                    Δx
                  </th>
                  <th className="border border-white/10 bg-violet-400/[0.14] px-3 py-2 text-sm font-bold text-violet-100">
                    평균변화율 Δy / Δx
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.i}>
                    <td className="border border-white/10 px-3 py-2 text-center">
                      <Katex expr={UTIL_GAP_TEX[r.i]} className="text-xl text-slate-100" />
                    </td>
                    <td className="border border-white/10 px-3 py-2">
                      <div className="overflow-x-auto overflow-y-hidden py-1">
                        <Katex expr={r.expr} className="whitespace-nowrap text-lg text-violet-100" />
                      </div>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="border border-white/10 bg-emerald-400/[0.10] px-3 py-2 text-center text-lg font-bold text-emerald-200">
                    ↓ 0
                  </td>
                  <td className="border border-white/10 bg-emerald-400/[0.10] px-3 py-2">
                    <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden py-1">
                      <span className="text-lg font-bold text-emerald-200">↓</span>
                      <Katex
                        expr={"U'(" + fmt(x0, 8) + ") = " + fmt(s.d(x0), 8)}
                        className="whitespace-nowrap text-xl text-emerald-100"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-2 rounded-xl border-2 border-emerald-400/45 bg-emerald-400/[0.08] px-3 py-2 text-center">
            <div className="overflow-x-auto overflow-y-hidden py-1">
              <Katex
                expr={"U'(" + fmt(x0) + ") = \\lim_{\\Delta x \\to 0} \\dfrac{\\Delta y}{\\Delta x} = " + fmt(s.d(x0))}
                className="whitespace-nowrap text-base text-emerald-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-3">
          <TipBox>{s.note}</TipBox>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "한 개씩 더 소비할 때 늘어나는 만족이 한계효용이에요 — 노란 화살표의 길이입니다.",
              "막대가 계단처럼 낮아져요. 같은 것을 거듭 쓰면 새로 얻는 만족이 줄어듭니다.",
              "Δx 를 반으로 줄여 가면 평균변화율이 한계효용함수의 값으로 다가가요.",
              "그래서 한계효용함수는 효용함수의 도함수 U'(x) 입니다.",
            ]}
          />
        </div>
      </div>

      <StepRunner
        steps={UTIL_STEPS}
        accent="violet"
        finale="'한 단위 더' 를 도함수로 붙잡았어요. 같은 틀을 비용에도 써 봐요!"
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 한계비용
// ══════════════════════════════════════════════════════════════
function CostTab() {
  const [ci, setCi] = useState(0);
  const [x, setX] = useState(COST_SCENES[0].x0);

  const c = COST_SCENES[ci];
  const dom: [number, number] = [c.xMin, c.xMax];
  const cx = c.fn(x);
  const mc = c.d(x);
  const nextX = Math.min(x + 1, c.xMax);
  const real = c.fn(nextX) - cx;
  const hit = c.best !== null && Math.abs(x - c.best) < 1e-9;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.07] to-rose-500/[0.04] p-4">
        <p className="text-sm font-bold text-amber-200">🏭 한 개를 더 만들 때 비용이 얼마나 더 드는지 보세요</p>

        <div className="mt-2">
          <PickRow
            items={COST_SCENES}
            at={ci}
            accent="amber"
            onPick={(i) => {
              setCi(i);
              setX(COST_SCENES[i].x0);
            }}
          />
        </div>

        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-6 text-slate-300">
          {c.emoji} {c.story}
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-sky-400/40 bg-sky-400/[0.08] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-sky-200">비용함수</p>
                <div className="mt-0.5 overflow-x-auto overflow-y-hidden py-1">
                  <Katex expr={c.tex} className="whitespace-nowrap text-sm text-sky-100" />
                </div>
              </div>
              <div className="rounded-xl border-2 border-amber-400/50 bg-amber-400/[0.10] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-amber-200">한계비용함수</p>
                <div className="mt-0.5 overflow-x-auto overflow-y-hidden py-1">
                  <Katex expr={c.dTex} className="whitespace-nowrap text-sm text-amber-100" />
                </div>
              </div>
            </div>

            <Knob label={"생산량 x"} value={x} min={c.xMin} max={c.xMax} step={c.xStep} accent="amber" suffix={c.unit} onChange={setX} />

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-slate-300">지금까지 든 비용 C(x)</p>
                <p className="mt-0.5 font-mono text-lg font-bold text-sky-100">
                  {won(cx)} <span className="text-[11px] font-normal text-slate-400">천원</span>
                </p>
              </div>
              <div className="rounded-xl border-2 border-amber-400/50 bg-amber-400/[0.10] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-amber-200">한계비용 C&apos;(x)</p>
                <p className="mt-0.5 font-mono text-lg font-bold text-amber-100">
                  {fmt(mc)} <span className="text-[11px] font-normal text-slate-400">천원/{c.unit}</span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="text-[11px] font-bold text-slate-300">한 {c.unit} 를 실제로 더 만들어 보면</p>
              <div className="mt-1 grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-slate-500">한계비용 (접선의 기울기)</p>
                  <p className="font-mono text-sm font-bold text-amber-100">{fmt(mc)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">
                    실제 C({fmt(nextX)}) - C({fmt(x)})
                  </p>
                  <p className="font-mono text-sm font-bold text-slate-200">{fmt(real)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-xs font-bold text-slate-200">🎯 미션 — 한계비용이 가장 작아지는 자리를 찾아보세요</p>
              <div className="mt-2">
                {c.best === null ? (
                  <Verdict ok={false}>
                    이 장면은 한계비용이 줄곧 늘기만 해요. 가장 작은 자리는 아예 만들지 않을 때(0)뿐입니다. 다른 장면에서
                    찾아보세요.
                  </Verdict>
                ) : hit ? (
                  <Verdict ok>
                    찾았어요! {c.unit === "kg" ? "" : ""}
                    {fmt(c.best)} {c.unit} 에서 한계비용이 {fmt(c.d(c.best))} 천원으로 가장 쌉니다. 여기를 지나면 다시
                    비싸져요.
                  </Verdict>
                ) : (
                  <Verdict ok={false}>
                    아직이에요. 아래 주황 그래프에서 가장 낮은 자리로 손잡이를 옮겨 보세요.
                  </Verdict>
                )}
              </div>
            </div>

            <TipBox>{c.note}</TipBox>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <Plot
                box={c.fBox}
                paths={samplePath(c.fn, c.fBox, dom)}
                lines={[{ m: mc, x0: x, y0: cx, tone: "tan" }]}
                marks={[{ x, y: cx, tone: "tan" }]}
                uid={"cost-f-" + c.id}
                axis={["생산량 (" + c.unit + ")", "비용"]}
                yFmt={(v) => won(v)}
              />
            </div>
            <p className="text-center text-[11px] font-bold text-sky-200">비용함수 · 초록 직선이 접선</p>
            <div className="flex justify-center">
              <Plot
                box={c.dBox}
                paths={samplePath(c.d, c.dBox, dom)}
                curve="d"
                marks={[{ x, y: mc, tone: "dot" }]}
                guideX={c.best ?? undefined}
                uid={"cost-d-" + c.id}
                axis={["생산량 (" + c.unit + ")", "한계비용"]}
                yFmt={(v) => won(v)}
              />
            </div>
            <p className="text-center text-[11px] font-bold text-amber-200">한계비용함수 · 주황 점이 지금 자리</p>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "한계비용은 '한 개 더' 만들 때 늘어나는 비용이에요 — 비용함수의 접선의 기울기입니다.",
              "접선의 기울기와 실제로 한 개 더 만든 비용은 가깝지만 똑같지는 않아요.",
              "한계비용이 줄다가 늘어나는 U 자 모양이 흔해요. 가장 낮은 자리가 가장 싸게 만드는 자리입니다.",
              "고정비(상수항)는 미분하면 사라져 한계비용에 영향을 주지 않아요.",
            ]}
          />
        </div>
      </div>

      <StepRunner
        steps={COST_STEPS}
        accent="amber"
        finale="비용도 같은 틀이었어요. 이번엔 사람을 더 뽑는 쪽을 봐요!"
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 한계생산량
// ══════════════════════════════════════════════════════════════
const WORKER_EMOJI: Record<string, string> = { p1: "👨‍🍳", p2: "🧑‍🌾", p3: "🧑‍🔧" };

function ProdTab() {
  const [pi, setPi] = useState(0);
  const [x, setX] = useState(PROD_SCENES[0].x0);

  const p = PROD_SCENES[pi];
  const dom: [number, number] = [p.xMin, p.xMax];
  const px = p.fn(x);
  const mp = p.d(x);
  const nextX = Math.min(x + 1, p.xMax);
  const real = p.fn(nextX) - px;
  const hit = p.zero !== null && Math.abs(x - p.zero) < 1e-9;
  const crew = [];
  for (let i = 0; i < x; i++) crew.push(i);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.07] to-amber-500/[0.04] p-4">
        <p className="text-sm font-bold text-emerald-200">🧑‍🍳 일손을 한 명씩 늘려 가며 생산이 얼마나 늘어나는지 보세요</p>

        <div className="mt-2">
          <PickRow
            items={PROD_SCENES}
            at={pi}
            accent="emerald"
            onPick={(i) => {
              setPi(i);
              setX(PROD_SCENES[i].x0);
            }}
          />
        </div>

        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-6 text-slate-300">
          {p.emoji} {p.story}
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-sky-400/40 bg-sky-400/[0.08] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-sky-200">생산함수</p>
                <div className="mt-0.5 overflow-x-auto overflow-y-hidden py-1">
                  <Katex expr={p.tex} className="whitespace-nowrap text-sm text-sky-100" />
                </div>
              </div>
              <div className="rounded-xl border-2 border-amber-400/50 bg-amber-400/[0.10] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-amber-200">한계생산함수</p>
                <div className="mt-0.5 overflow-x-auto overflow-y-hidden py-1">
                  <Katex expr={p.dTex} className="whitespace-nowrap text-sm text-amber-100" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2">
              <div className="flex min-h-[28px] flex-wrap gap-0.5">
                {crew.map((i) => (
                  <span key={i} className={i === x - 1 ? "text-xl" : "text-xl opacity-55"}>
                    {WORKER_EMOJI[p.id] ?? "🧑"}
                  </span>
                ))}
                {x === 0 ? <span className="text-[11px] text-slate-500">아직 아무도 없어요</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={x >= p.xMax}
                onClick={() => setX(x + 1)}
                className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.emerald}
              >
                ➕ 한 명 더 뽑기
              </button>
              <button
                type="button"
                disabled={x <= p.xMin}
                onClick={() => setX(x - 1)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
              >
                ➖ 한 명 줄이기
              </button>
            </div>

            <Knob label={"일손 x"} value={x} min={p.xMin} max={p.xMax} step={p.xStep} accent="emerald" suffix={p.unit} onChange={setX} />

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-slate-300">하루 생산량 P(x)</p>
                <p className="mt-0.5 font-mono text-lg font-bold text-sky-100">
                  {won(px)} <span className="text-[11px] font-normal text-slate-400">{p.outUnit}</span>
                </p>
              </div>
              <div
                className={
                  "rounded-xl border-2 px-3 py-2 text-center " +
                  (mp >= 0 ? "border-amber-400/50 bg-amber-400/[0.10]" : "border-rose-400/55 bg-rose-400/[0.12]")
                }
              >
                <p className={"text-[11px] font-bold " + (mp >= 0 ? "text-amber-200" : "text-rose-200")}>한계생산량 P&apos;(x)</p>
                <p className={"mt-0.5 font-mono text-lg font-bold " + (mp >= 0 ? "text-amber-100" : "text-rose-100")}>
                  {fmt(mp)} <span className="text-[11px] font-normal text-slate-400">{p.outUnit}/{p.unit}</span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="text-[11px] font-bold text-slate-300">한 명을 실제로 더 뽑아 보면</p>
              <div className="mt-1 grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-slate-500">한계생산량 (접선의 기울기)</p>
                  <p className="font-mono text-sm font-bold text-amber-100">{fmt(mp)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">
                    실제 P({fmt(nextX)}) - P({fmt(x)})
                  </p>
                  <p className="font-mono text-sm font-bold text-slate-200">{fmt(real)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-xs font-bold text-slate-200">🎯 미션 — 한계생산량이 0 이 되는 자리를 찾아보세요</p>
              <div className="mt-2">
                {p.zero === null ? (
                  <Verdict ok={false}>
                    이 장면은 한계생산량이 늘 25 로 일정해서 0 이 되는 자리가 없어요. 다른 장면에서 찾아보세요.
                  </Verdict>
                ) : hit ? (
                  <Verdict ok>
                    찾았어요! {fmt(p.zero)} {p.unit} 에서 한계생산량이 0 이고, 바로 그 자리에서 생산량이 {won(p.fn(p.zero))}{" "}
                    {p.outUnit} 로 가장 많아요. 더 뽑으면 오히려 줄어듭니다.
                  </Verdict>
                ) : (
                  <Verdict ok={false}>아직이에요. 아래 주황 그래프가 가로축을 지나는 자리로 옮겨 보세요.</Verdict>
                )}
              </div>
            </div>

            <TipBox>{p.note}</TipBox>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <Plot
                box={p.fBox}
                paths={samplePath(p.fn, p.fBox, dom)}
                lines={[{ m: mp, x0: x, y0: px, tone: "tan" }]}
                marks={[{ x, y: px, tone: "tan" }]}
                uid={"prod-f-" + p.id}
                axis={["일손 (" + p.unit + ")", "생산량"]}
                yFmt={(v) => won(v)}
              />
            </div>
            <p className="text-center text-[11px] font-bold text-sky-200">생산함수 · 초록 직선이 접선</p>
            <div className="flex justify-center">
              <Plot
                box={p.dBox}
                paths={samplePath(p.d, p.dBox, dom)}
                curve="d"
                marks={[{ x, y: mp, tone: "dot" }]}
                guideX={p.zero ?? undefined}
                uid={"prod-d-" + p.id}
                axis={["일손 (" + p.unit + ")", "한계생산량"]}
                yFmt={(v) => won(v)}
              />
            </div>
            <p className="text-center text-[11px] font-bold text-amber-200">한계생산함수 · 주황 점이 지금 자리</p>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "한계생산량은 '한 명 더' 뽑을 때 늘어나는 생산량이에요.",
              "함께 쓰는 주방과 밭이 정해져 있어 사람이 늘수록 한 사람이 보태는 몫이 줄어요(수확체감).",
              "한계생산량이 0 이 되는 자리에서 생산량이 가장 많아집니다.",
              "그 뒤로 더 뽑으면 한계생산량이 음수가 되어 오히려 생산이 줄어요.",
            ]}
          />
        </div>
      </div>

      <StepRunner
        steps={PROD_STEPS}
        accent="emerald"
        finale="사람을 몇 명까지 뽑을지도 도함수가 알려 주었어요. 마지막은 값을 매기는 문제예요!"
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 한계수입 — 가격 × 판매량 직사각형
// ══════════════════════════════════════════════════════════════
const RB_W = 320;
const RB_H = 230;
const RB_L = 40;
const RB_R = 14;
const RB_T = 20;
const RB_B = 28;

function RevenueRect({
  qty,
  price,
  qMax,
  pMax,
  bestQty,
  bestPrice,
  rev,
  best,
}: {
  qty: number;
  price: number;
  qMax: number;
  pMax: number;
  bestQty: number;
  bestPrice: number;
  rev: number;
  best: boolean;
}) {
  const pw = RB_W - RB_L - RB_R;
  const ph = RB_H - RB_T - RB_B;
  const X = (v: number) => RB_L + (v / qMax) * pw;
  const Y = (v: number) => RB_H - RB_B - (v / pMax) * ph;

  return (
    <svg viewBox={"0 0 " + RB_W + " " + RB_H} className="w-full max-w-[320px]" role="img" aria-label="수입 직사각형">
      <rect x={RB_L} y={RB_T} width={pw} height={ph} fill="#0b1220" stroke="rgba(255,255,255,0.12)" />
      <line x1={RB_L} y1={RB_H - RB_B} x2={RB_W - RB_R} y2={RB_H - RB_B} stroke="rgba(255,255,255,0.3)" />
      <line x1={RB_L} y1={RB_T} x2={RB_L} y2={RB_H - RB_B} stroke="rgba(255,255,255,0.3)" />

      <rect
        x={RB_L}
        y={Y(bestPrice)}
        width={Math.max(X(bestQty) - RB_L, 0)}
        height={Math.max(RB_H - RB_B - Y(bestPrice), 0)}
        fill="none"
        stroke="rgba(253,224,71,0.55)"
        strokeDasharray="4 3"
      />
      <rect
        x={RB_L}
        y={Y(price)}
        width={Math.max(X(qty) - RB_L, 0)}
        height={Math.max(RB_H - RB_B - Y(price), 0)}
        fill={best ? "rgba(52,211,153,0.26)" : "rgba(56,189,248,0.20)"}
        stroke={best ? "#34d399" : "#38bdf8"}
        strokeWidth="2"
      />

      {qty > 0 && price > 0 ? (
        <text
          x={(RB_L + X(qty)) / 2}
          y={(RB_H - RB_B + Y(price)) / 2 + 3}
          textAnchor="middle"
          fontSize="11"
          fill={best ? "#6ee7b7" : "#bae6fd"}
        >
          {won(rev)}
        </text>
      ) : null}

      <text x={X(qty)} y={RB_H - RB_B + 11} textAnchor="middle" fontSize="8" fill="#94a3b8">
        {won(qty)}
      </text>
      <text x={RB_L - 4} y={Y(price) + 3} textAnchor="end" fontSize="8" fill="#94a3b8">
        {fmt(price)}
      </text>
      <text x={RB_W - RB_R} y={RB_H - 3} textAnchor="end" fontSize="8" fill="#475569">
        판매량
      </text>
      <text x={2} y={RB_T - 6} textAnchor="start" fontSize="8" fill="#475569">
        가격
      </text>
    </svg>
  );
}

function RevTab() {
  const [ri, setRi] = useState(0);
  const [x, setX] = useState(REV_SCENES[0].x0);

  const r = REV_SCENES[ri];
  const dom: [number, number] = [r.xMin, r.xMax];
  const qty = r.q(x);
  const rev = r.g(x);
  const mr = r.d(x);
  const best = Math.abs(x - r.best) < 1e-9;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-500/[0.07] to-emerald-500/[0.04] p-4">
        <p className="text-sm font-bold text-sky-200">💰 값을 올리면 판매량이 줄어요 — 직사각형이 가장 넓어지는 자리는?</p>

        <div className="mt-2">
          <PickRow
            items={REV_SCENES}
            at={ri}
            accent="sky"
            onPick={(i) => {
              setRi(i);
              setX(REV_SCENES[i].x0);
            }}
          />
        </div>

        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-6 text-slate-300">
          {r.emoji} {r.story}
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-center">
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={r.qTex} className="whitespace-nowrap text-sm text-slate-200" />
              </div>
              <div className="mt-1 overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={r.gFactorTex + " = " + r.gTex.replace("g(x) = ", "")} className="whitespace-nowrap text-base text-sky-100" />
              </div>
              <div className="mt-1 overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={r.dTex} className="whitespace-nowrap text-base text-amber-100" />
              </div>
            </div>

            <Knob label={"가격 x"} value={x} min={r.xMin} max={r.xMax} step={r.xStep} accent="sky" suffix={r.priceUnit} onChange={setX} />

            <div className="flex justify-center">
              <RevenueRect
                qty={qty}
                price={x}
                qMax={r.qMax}
                pMax={r.xMax}
                bestQty={r.q(r.best)}
                bestPrice={r.best}
                rev={rev}
                best={best}
              />
            </div>
            <p className="text-center text-[10px] leading-4 text-slate-500">
              가로가 판매량, 세로가 가격 — 직사각형의 넓이가 곧 수입이에요 · 노란 점선이 가장 넓은 모양
            </p>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-slate-300">판매량 f(x)</p>
                <p className="mt-0.5 font-mono text-base font-bold text-slate-100">
                  {won(qty)} <span className="text-[10px] font-normal text-slate-400">{r.qtyUnit}</span>
                </p>
              </div>
              <div className="rounded-xl border border-sky-400/40 bg-sky-400/[0.08] px-3 py-2 text-center">
                <p className="text-[11px] font-bold text-sky-200">수입 g(x)</p>
                <p className="mt-0.5 font-mono text-base font-bold text-sky-100">
                  {won(rev)} <span className="text-[10px] font-normal text-slate-400">{r.revUnit}</span>
                </p>
              </div>
              <div
                className={
                  "rounded-xl border-2 px-3 py-2 text-center " +
                  (mr >= 0 ? "border-amber-400/50 bg-amber-400/[0.10]" : "border-rose-400/55 bg-rose-400/[0.12]")
                }
              >
                <p className={"text-[11px] font-bold " + (mr >= 0 ? "text-amber-200" : "text-rose-200")}>한계수입 g&apos;(x)</p>
                <p className={"mt-0.5 font-mono text-base font-bold " + (mr >= 0 ? "text-amber-100" : "text-rose-100")}>
                  {fmt(mr)}
                </p>
              </div>
            </div>

            <div
              className={
                "rounded-xl border-l-4 px-3 py-2 text-xs leading-6 " +
                (mr > 0
                  ? "border-emerald-400 bg-emerald-400/[0.08] text-emerald-100"
                  : mr < 0
                    ? "border-rose-400 bg-rose-400/[0.08] text-rose-100"
                    : "border-amber-400 bg-amber-400/[0.08] text-amber-100")
              }
            >
              {mr > 0 ? "📈 " : mr < 0 ? "📉 " : "🎯 "}
              {mr > 0
                ? "값을 1 " + r.priceUnit + " 더 올리면 수입이 약 " + won(Math.abs(mr)) + " " + r.revUnit + " 늘어요. 아직 올릴 여지가 있어요."
                : mr < 0
                  ? "값을 1 " + r.priceUnit + " 더 올리면 수입이 약 " + won(Math.abs(mr)) + " " + r.revUnit + " 줄어요. 너무 비싸게 매겼어요."
                  : "한계수입이 0 이에요 — 바로 여기가 수입이 가장 큰 값입니다."}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-xs font-bold text-slate-200">🎯 미션 — 수입이 가장 커지는 값을 찾아보세요</p>
              <div className="mt-2">
                {best ? (
                  <Verdict ok>
                    찾았어요! {fmt(r.best)} {r.priceUnit} 에 {won(r.q(r.best))} {r.qtyUnit} 를 팔아 {won(r.g(r.best))}{" "}
                    {r.revUnit} — 한계수입이 꼭 0 이 되는 자리예요.
                  </Verdict>
                ) : (
                  <Verdict ok={false}>
                    아직이에요. 한계수입의 부호를 보세요 — 양수면 더 올리고, 음수면 내려야 합니다.
                  </Verdict>
                )}
              </div>
            </div>

            <TipBox>{r.note}</TipBox>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <Plot
                box={r.gBox}
                paths={samplePath(r.g, r.gBox, dom)}
                lines={[{ m: mr, x0: x, y0: rev, tone: "tan" }]}
                marks={[{ x, y: rev, tone: "tan" }]}
                uid={"rev-g-" + r.id}
                axis={["가격 (" + r.priceUnit + ")", "수입"]}
                yFmt={(v) => won(v)}
              />
            </div>
            <p className="text-center text-[11px] font-bold text-sky-200">수입함수 · 초록 직선이 접선</p>
            <div className="flex justify-center">
              <Plot
                box={r.dBox}
                paths={samplePath(r.d, r.dBox, dom)}
                curve="d"
                marks={[{ x, y: mr, tone: "dot" }]}
                guideX={r.best}
                uid={"rev-d-" + r.id}
                axis={["가격 (" + r.priceUnit + ")", "한계수입"]}
                yFmt={(v) => won(v)}
              />
            </div>
            <p className="text-center text-[11px] font-bold text-amber-200">한계수입함수 · 가로축을 지나는 자리가 답</p>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "수입은 가격 × 판매량이라 g(x) = x · f(x) 예요. 전개하면 이차함수가 됩니다.",
              "값을 올리면 세로는 길어지고 가로는 짧아져요. 넓이가 가장 커지는 자리가 따로 있습니다.",
              "한계수입이 양수면 더 올리고, 음수면 내리고, 0 이면 그 자리가 가장 좋은 값이에요.",
              "값을 두 배로 올려도 수입이 두 배가 되지는 않아요.",
            ]}
          />
        </div>
      </div>

      <StepRunner
        steps={REV_STEPS}
        accent="sky"
        finale="효용 · 비용 · 생산량 · 수입 — 이름만 다를 뿐 모두 도함수였어요!"
      />

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">
        {REAL_NOTE}
      </p>
    </div>
  );
}
