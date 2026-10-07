"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  COSTS,
  FIRMS,
  FIRM_FINALE,
  FIRM_GOALS,
  FIRM_STEPS,
  MC_FINALE,
  MC_GOALS,
  MC_STEPS,
  MOUNTAINS,
  MOUNT_FINALE,
  MOUNT_GOALS,
  MOUNT_STEPS,
  PRODS,
  PROD_FINALE,
  PROD_GOALS,
  PROD_STEPS,
  REAL_NOTE,
  UTILS,
  UTIL_FINALE,
  UTIL_GOALS,
  UTIL_STEPS,
  fmt,
  samplePath,
  won,
  type Box,
  type CostCase,
  type Firm,
  type Mountain,
  type Piece,
  type Prod,
  type Step,
  type Util,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "max_candidates",
    prompt:
      "①에서 범위의 오른쪽 끝 b 를 움직이자 가장 높은 자리가 봉우리와 끝 사이를 오갔어요. 미분가능한 함수의 최댓값을 찾을 때 왜 '극댓값'과 '양 끝의 함숫값'만 견주면 되는지 자기 말로 써 보세요.",
    kind: "text",
    placeholder:
      "예: 안쪽의 점에서 f′(x)가 0이 아니면 그 점은 올라가거나 내려가는 중이라 바로 옆에 더 높은 자리가 있다. 그래서 가장 높을 수 있는 자리는 f′이 0이 되는 극대점이거나, 더 갈 수 없어 멈추는 양 끝뿐이다.",
  },
  {
    id: "marginal_zero",
    prompt:
      "②와 ③에서 최적소비량과 최적노동량은 모두 도함수가 0 이 되는 자리였어요. 한계효용(또는 한계생산량)이 0 이 된다는 것이 '한 단위 더'의 관점에서 무슨 뜻인지, 그 자리를 넘어가면 왜 손해인지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 한 단위 더 늘릴 때 늘어나는 양이 0이 된다는 뜻이라, 더 해도 좋아지지 않는 자리다. 그 자리를 넘으면 도함수가 음수가 되어 한 단위 더할 때마다 오히려 줄어들기 때문에 손해다.",
  },
  {
    id: "mc_equals_price",
    prompt:
      "⑤에서 가격을 올릴 때마다 최적생산량이 오른쪽으로 옮겨갔어요. 이윤이 가장 클 때 g′(x) = p 가 되는 까닭을 식으로 설명하고, 가격과 최적생산량의 짝이 왜 공급곡선이 되는지도 써 보세요.",
    kind: "text",
    placeholder:
      "예: h(x) = px − g(x)이므로 h′(x) = p − g′(x)이고, 이것이 0이 되는 자리가 g′(x) = p다. 가격마다 기업이 가장 많이 남기는 생산량이 하나씩 정해지므로, 그 짝 (생산량, 가격)을 모두 이으면 가격에 따라 얼마를 공급할지 알려 주는 공급곡선이 된다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "mount" | "util" | "prod" | "firm" | "mc";

export default function OptimizationLab() {
  const [tab, setTab] = useState<Tab>("mount");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🎯 경제 현상의 최적화</h3>
        <p className="mt-2 leading-7 text-slate-300">
          한정된 자원 안에서 <b className="text-amber-200">효용 · 생산 · 이윤</b>을 가장 크게 만드는 자리를 찾아요.
          손잡이를 움직여 <b className="text-rose-200">도함수가 0 이 되는 자리</b>를 직접 찾고, 마지막에는{" "}
          <b className="text-sky-200">한계비용과 가격</b>이 만나는 곳까지 가 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "mount"} onClick={() => setTab("mount")}>① 최댓값 사냥</TabButton>
        <TabButton active={tab === "util"} onClick={() => setTab("util")}>② 소비자의 선택</TabButton>
        <TabButton active={tab === "prod"} onClick={() => setTab("prod")}>③ 생산자의 선택</TabButton>
        <TabButton active={tab === "firm"} onClick={() => setTab("firm")}>④ 기업의 선택</TabButton>
        <TabButton active={tab === "mc"} onClick={() => setTab("mc")}>⑤ 한계비용 = 가격</TabButton>
      </div>

      <div className="mt-4">
        {tab === "mount" ? <MountTab /> : null}
        {tab === "util" ? <UtilTab /> : null}
        {tab === "prod" ? <ProdTab /> : null}
        {tab === "firm" ? <FirmTab /> : null}
        {tab === "mc" ? <McTab /> : null}
      </div>

      <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">
        {REAL_NOTE}
      </p>

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
      {p.tex ? <Katex expr={p.tex} /> : null}
      {p.post ? <span>{p.post}</span> : null}
    </>
  );
}

function PieceLine({ line }: { line: Piece[] }) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
      {line.map((p, i) => (
        <PieceText key={i} p={p} />
      ))}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
//  공용 — 좌표평면
// ══════════════════════════════════════════════════════════════
const PS = 320;
const PML = 46;
const PMR = 14;
const PMT = 14;
const PMB = 28;

type Stroke = "curve" | "ghost" | "tangent" | "revenue" | "cost" | "marginal" | "profit";
const STROKE_COLOR: Record<Stroke, string> = {
  curve: "#38bdf8",
  ghost: "rgba(148,163,184,0.35)",
  tangent: "#fbbf24",
  revenue: "#34d399",
  cost: "#fb7185",
  marginal: "#fb923c",
  profit: "#c084fc",
};

type DotTone = "live" | "peak" | "low" | "end" | "best" | "pin";
const DOT_COLOR: Record<DotTone, string> = {
  live: "#f472b6",
  peak: "#fbbf24",
  low: "#64748b",
  end: "#94a3b8",
  best: "#34d399",
  pin: "#c084fc",
};

type RuleTone = "guide" | "hot" | "goal";
const RULE_COLOR: Record<RuleTone, string> = {
  guide: "rgba(148,163,184,0.45)",
  hot: "rgba(251,191,36,0.75)",
  goal: "rgba(52,211,153,0.7)",
};

type GapTone = "profit" | "loss";
const GAP_COLOR: Record<GapTone, string> = { profit: "#34d399", loss: "#fb7185" };

type PlotSeg = { tone: Stroke; pts: [number, number][]; dash?: boolean };
type PlotDot = { x: number; y: number; tone: DotTone; label?: string; filled?: boolean; small?: boolean };
type PlotRule = { at: number; tone: RuleTone; solid?: boolean };
type PlotGap = { x: number; y0: number; y1: number; tone: GapTone };

function Plot({
  box,
  segs,
  dots = [],
  gaps = [],
  vlines = [],
  hlines = [],
  uid,
  axis,
}: {
  box: Box;
  segs: PlotSeg[];
  dots?: PlotDot[];
  gaps?: PlotGap[];
  vlines?: PlotRule[];
  hlines?: PlotRule[];
  uid: string;
  axis?: [string, string];
}) {
  const pw = PS - PML - PMR;
  const ph = PS - PMT - PMB;
  const X = (v: number) => PML + ((v - box.xMin) / (box.xMax - box.xMin)) * pw;
  const Y = (v: number) => PS - PMB - ((v - box.yMin) / (box.yMax - box.yMin)) * ph;
  const cid = `op-${uid}`;

  const gx: number[] = [];
  for (let i = 0; i <= 30; i++) {
    const v = Math.ceil(box.xMin / box.gx - 1e-9) * box.gx + i * box.gx;
    if (v > box.xMax + 1e-9) break;
    gx.push(Number(v.toFixed(10)));
  }
  const gy: number[] = [];
  for (let i = 0; i <= 30; i++) {
    const v = Math.ceil(box.yMin / box.gy - 1e-9) * box.gy + i * box.gy;
    if (v > box.yMax + 1e-9) break;
    gy.push(Number(v.toFixed(10)));
  }

  return (
    <svg viewBox={`0 0 ${PS} ${PS}`} className="w-full" role="img" aria-label="그래프">
      <defs>
        <clipPath id={cid}>
          <rect x={PML} y={PMT} width={pw} height={ph} />
        </clipPath>
      </defs>
      <rect x={PML} y={PMT} width={pw} height={ph} fill="#0b1220" stroke="rgba(255,255,255,0.12)" />

      {gx.map((v) => (
        <line key={`gx${v}`} x1={X(v)} y1={PMT} x2={X(v)} y2={PS - PMB} stroke="rgba(255,255,255,0.06)" />
      ))}
      {gy.map((v) => (
        <line key={`gy${v}`} x1={PML} y1={Y(v)} x2={PS - PMR} y2={Y(v)} stroke="rgba(255,255,255,0.06)" />
      ))}
      {gx.map((v) => (
        <text key={`tx${v}`} x={X(v)} y={PS - PMB + 12} textAnchor="middle" fontSize="8" fill="#64748b">
          {fmt(v, 4)}
        </text>
      ))}
      {gy.map((v) => (
        <text key={`ty${v}`} x={PML - 4} y={Y(v) + 3} textAnchor="end" fontSize="8" fill="#64748b">
          {fmt(v, 4)}
        </text>
      ))}
      {axis ? (
        <>
          <text x={PS - PMR} y={PS - 3} textAnchor="end" fontSize="8" fill="#475569">
            {axis[0]}
          </text>
          <text x={2} y={PMT - 3} textAnchor="start" fontSize="8" fill="#475569">
            {axis[1]}
          </text>
        </>
      ) : null}

      <g clipPath={`url(#${cid})`}>
        {hlines.map((h, i) => (
          <line
            key={`hl${i}`}
            x1={PML}
            y1={Y(h.at)}
            x2={PS - PMR}
            y2={Y(h.at)}
            stroke={RULE_COLOR[h.tone]}
            strokeWidth={h.solid ? 2 : 1}
            strokeDasharray={h.solid ? undefined : "4 3"}
          />
        ))}
        {vlines.map((v, i) => (
          <line
            key={`vl${i}`}
            x1={X(v.at)}
            y1={PMT}
            x2={X(v.at)}
            y2={PS - PMB}
            stroke={RULE_COLOR[v.tone]}
            strokeWidth={v.solid ? 2 : 1}
            strokeDasharray={v.solid ? undefined : "4 3"}
          />
        ))}
        {gaps.map((g, i) => (
          <line
            key={`gp${i}`}
            x1={X(g.x)}
            y1={Y(g.y0)}
            x2={X(g.x)}
            y2={Y(g.y1)}
            stroke={GAP_COLOR[g.tone]}
            strokeWidth="9"
            strokeLinecap="round"
            opacity="0.5"
          />
        ))}
        {segs.map((s, i) => (
          <polyline
            key={`sg${i}`}
            points={s.pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")}
            fill="none"
            stroke={STROKE_COLOR[s.tone]}
            strokeWidth={s.tone === "ghost" ? 1.6 : 2.6}
            strokeDasharray={s.dash ? "5 4" : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* 점·이름표는 clipPath 밖에 그린다 */}
      {dots
        .filter((d) => d.x >= box.xMin && d.x <= box.xMax && d.y >= box.yMin && d.y <= box.yMax)
        .map((d, i) => (
          <g key={`dt${i}`}>
            <circle
              cx={X(d.x)}
              cy={Y(d.y)}
              r={d.small ? 2.8 : 5}
              fill={d.filled === false ? "#0b1220" : DOT_COLOR[d.tone]}
              stroke={DOT_COLOR[d.tone]}
              strokeWidth={d.small ? 0 : 2}
            />
            {d.label ? (
              <text x={X(d.x)} y={Y(d.y) - 10} textAnchor="middle" fontSize="11" fill={DOT_COLOR[d.tone]}>
                {d.label}
              </text>
            ) : null}
          </g>
        ))}
    </svg>
  );
}

function lines(paths: [number, number][][], tone: Stroke, dash = false): PlotSeg[] {
  return paths.map((pts) => ({ tone, pts, dash }));
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

function GoalList({ items, done }: { items: string[]; done: boolean[] }) {
  return (
    <ul className="space-y-1">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-xs leading-6 text-slate-300">
          <span className={done[i] ? "text-emerald-300" : "text-slate-500"}>{done[i] ? "✅" : (ABC[i] ?? "·")}</span>
          <span className={done[i] ? "text-emerald-200" : undefined}>{t}</span>
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
        (ok
          ? "border-emerald-400 bg-emerald-400/[0.08] text-emerald-100"
          : "border-amber-400 bg-amber-400/[0.08] text-amber-100")
      }
    >
      {ok ? "✅ " : "🤔 "}
      {children}
    </p>
  );
}

type Accent = "sky" | "amber" | "violet" | "emerald" | "rose";
const ACC_PANEL: Record<Accent, string> = {
  sky: "border-sky-400/25 bg-sky-500/[0.06]",
  amber: "border-amber-400/25 bg-amber-500/[0.06]",
  violet: "border-violet-400/25 bg-violet-500/[0.06]",
  emerald: "border-emerald-400/25 bg-emerald-500/[0.06]",
  rose: "border-rose-400/25 bg-rose-500/[0.06]",
};
const ACC_BTN: Record<Accent, string> = {
  sky: "border-sky-400/55 bg-sky-400/15 text-sky-100 hover:bg-sky-400/25",
  amber: "border-amber-400/55 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25",
  violet: "border-violet-400/55 bg-violet-400/15 text-violet-100 hover:bg-violet-400/25",
  emerald: "border-emerald-400/55 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25",
  rose: "border-rose-400/55 bg-rose-400/15 text-rose-100 hover:bg-rose-400/25",
};
const ACC_CHIP: Record<Accent, string> = {
  sky: "border-sky-400/60 bg-sky-400/20 text-sky-100",
  amber: "border-amber-400/60 bg-amber-400/20 text-amber-100",
  violet: "border-violet-400/60 bg-violet-400/20 text-violet-100",
  emerald: "border-emerald-400/60 bg-emerald-400/20 text-emerald-100",
  rose: "border-rose-400/60 bg-rose-400/20 text-rose-100",
};
const ACC_RANGE: Record<Accent, string> = {
  sky: "accent-sky-400",
  amber: "accent-amber-400",
  violet: "accent-violet-400",
  emerald: "accent-emerald-400",
  rose: "accent-rose-400",
};
const RANGE_BASE = "h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 ";

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

function PickButton({
  active,
  onClick,
  accent,
  children,
}: {
  active: boolean;
  onClick: () => void;
  accent: Accent;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3 py-2 text-left text-xs font-bold transition " +
        (active ? ACC_CHIP[accent] : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
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
            inputMode="decimal"
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
//  공용 — 한계 배지 · 막대 · 이모지 줄
// ══════════════════════════════════════════════════════════════
type MTone = "up" | "zero" | "down";
const M_CHIP: Record<MTone, string> = {
  up: "border-emerald-400/60 bg-emerald-400/15 text-emerald-100",
  zero: "border-amber-400/60 bg-amber-400/20 text-amber-100",
  down: "border-rose-400/60 bg-rose-400/15 text-rose-100",
};
const M_EMOJI: Record<MTone, string> = { up: "📈", zero: "🏆", down: "📉" };

function MarginalBadge({
  v,
  label,
  up,
  zero,
  down,
}: {
  v: number;
  label: string;
  up: string;
  zero: string;
  down: string;
}) {
  const t: MTone = Math.abs(v) < 1e-9 ? "zero" : v > 0 ? "up" : "down";
  return (
    <div className={"rounded-xl border-2 px-3 py-2 text-center " + M_CHIP[t]}>
      <p className="text-[11px] font-bold opacity-80">{label}</p>
      <p className="font-mono text-2xl font-black">
        {M_EMOJI[t]} {fmt(v, 1)}
      </p>
      <p className="mt-0.5 text-xs leading-5">{t === "zero" ? zero : t === "up" ? up : down}</p>
    </div>
  );
}

const BAR_FILL: Record<"amber" | "emerald" | "violet", string> = {
  amber: "#fbbf24",
  emerald: "#34d399",
  violet: "#c084fc",
};

function LevelBar({
  ratio,
  text,
  tone,
}: {
  ratio: number;
  text: string;
  tone: "amber" | "emerald" | "violet";
}) {
  const w = Math.max(0, Math.min(1, ratio)) * 268;
  return (
    <svg viewBox="0 0 300 40" className="w-full" role="img" aria-label={text}>
      <rect x="16" y="9" width="268" height="22" rx="7" fill="rgba(255,255,255,0.07)" />
      <rect x="16" y="9" width={w} height="22" rx="7" fill={BAR_FILL[tone]} opacity="0.75" />
      <text x="150" y="25" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#f8fafc">
        {text}
      </text>
    </svg>
  );
}

function EmojiRow({ emoji, over, n, limit }: { emoji: string; over: string; n: number; limit: number }) {
  const items: number[] = [];
  for (let i = 0; i < n; i++) items.push(i);
  return (
    <div className="flex min-h-[44px] flex-wrap items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2">
      {n === 0 ? <span className="text-xs text-slate-500">아직 하나도 없어요</span> : null}
      {items.map((i) =>
        i < limit ? (
          <span key={i} className="text-2xl">
            {emoji}
          </span>
        ) : (
          <span key={i} className="text-2xl opacity-45 grayscale">
            {over}
          </span>
        ),
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 최댓값 사냥
// ══════════════════════════════════════════════════════════════
/** 범위 [0, b] 에서 최댓값이 나오는 자리 */
function bestSpot(m: Mountain, b: number): number {
  const cands = [0, b];
  if (m.peakX !== null && m.peakX <= b + 1e-9) cands.push(m.peakX);
  let bx = cands[0];
  for (const c of cands) if (m.f(c) > m.f(bx) + 1e-9) bx = c;
  return bx;
}

function SignStrip({ m, b }: { m: Mountain; b: number }) {
  const cuts: number[] = [];
  for (const c of [m.peakX, m.lowX]) if (c !== null && c > 1e-9 && c < b - 1e-9) cuts.push(c);
  cuts.sort((a, z) => a - z);
  const edges = [0, ...cuts, b];
  const segs: { from: number; to: number; up: boolean }[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const mid = (edges[i] + edges[i + 1]) / 2;
    segs.push({ from: edges[i], to: edges[i + 1], up: m.d1(mid) > 0 });
  }
  const px = (v: number) => 16 + (v / b) * 268;
  return (
    <svg viewBox="0 0 300 52" className="w-full" role="img" aria-label="도함수의 부호">
      {segs.map((s, i) => (
        <g key={i}>
          <rect
            x={px(s.from) + 1}
            y="12"
            width={Math.max(2, px(s.to) - px(s.from) - 2)}
            height="20"
            rx="4"
            fill={s.up ? "rgba(52,211,153,0.3)" : "rgba(251,113,133,0.3)"}
          />
          <text
            x={px((s.from + s.to) / 2)}
            y="27"
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill={s.up ? "#6ee7b7" : "#fda4af"}
          >
            {s.up ? "+" : "-"}
          </text>
        </g>
      ))}
      <text x={px(0)} y="46" textAnchor="middle" fontSize="9" fill="#64748b">
        0
      </text>
      {cuts.map((c) => (
        <text key={c} x={px(c)} y="46" textAnchor="middle" fontSize="9" fill="#fbbf24">
          {fmt(c)}
        </text>
      ))}
      <text x={px(b)} y="46" textAnchor="middle" fontSize="9" fill="#e2e8f0">
        {fmt(b)}
      </text>
    </svg>
  );
}

function MountTab() {
  const [mi, setMi] = useState(0);
  const [b, setB] = useState(MOUNTAINS[0].b0);
  const [endWin, setEndWin] = useState(false);
  const [peakWin, setPeakWin] = useState(false);
  const [tieHit, setTieHit] = useState(false);
  const [sawFlat, setSawFlat] = useState(false);

  const m = MOUNTAINS[mi];

  const mark = (mm: Mountain, bb: number) => {
    const bx = bestSpot(mm, bb);
    const peakInside = mm.peakX !== null && mm.peakX < bb - 1e-9;
    const peakTop = peakInside && Math.abs(mm.f(mm.peakX as number) - mm.f(bx)) < 1e-9;
    const endTop = Math.abs(mm.f(bb) - mm.f(bx)) < 1e-9;
    if (endTop && !peakTop) setEndWin(true);
    if (peakTop && !endTop) setPeakWin(true);
    if (endTop && peakTop) setTieHit(true);
    if (mm.peakX === null && mm.lowX === null) setSawFlat(true);
  };

  const bx = bestSpot(m, b);
  const goals = [endWin, peakWin, tieHit, sawFlat];

  const segs: PlotSeg[] = [
    ...lines(samplePath(m.f, 0, b, m.box), "curve"),
    ...lines(samplePath(m.f, b, m.box.xMax, m.box), "ghost", true),
  ];
  const dots: PlotDot[] = [
    { x: 0, y: m.f(0), tone: "end" },
    { x: b, y: m.f(b), tone: "end" },
  ];
  if (m.peakX !== null && m.peakX <= b + 1e-9) dots.push({ x: m.peakX, y: m.f(m.peakX), tone: "peak", filled: false });
  if (m.lowX !== null && m.lowX <= b + 1e-9) dots.push({ x: m.lowX, y: m.f(m.lowX), tone: "low", filled: false });
  dots.push({ x: bx, y: m.f(bx), tone: "best", label: "🏆 최대" });

  const cands: { at: number; name: string }[] = [{ at: 0, name: "왼쪽 끝" }];
  if (m.peakX !== null && m.peakX <= b + 1e-9) cands.push({ at: m.peakX, name: "극대" });
  cands.push({ at: b, name: "오른쪽 끝" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {MOUNTAINS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === mi}
            accent="rose"
            onClick={() => {
              setMi(i);
              setB(z.b0);
              mark(z, z.b0);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
          </PickButton>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-sky-200">
            <Katex expr={m.tex} />
          </p>
          <Plot
            box={m.box}
            uid={`mt-${m.id}`}
            segs={segs}
            dots={dots}
            vlines={[{ at: b, tone: "hot", solid: true }]}
            axis={["x", "f(x)"]}
          />
          <p className="text-center text-[11px] text-slate-400">
            노란 세로선이 범위의 오른쪽 끝 <b className="text-amber-200">b</b> 예요. 점선은 범위 밖이지요.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-3 rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] p-4">
            <p className="flex justify-between text-xs font-bold text-slate-300">
              <span>범위를 늘였다 줄였다 해 보세요</span>
              <span className="font-mono text-slate-100">0 ≤ x ≤ {fmt(b)}</span>
            </p>
            <input
              type="range"
              min={m.bMin}
              max={m.bMax}
              step={m.bStep}
              value={b}
              onChange={(ev) => {
                const nb = Number(ev.target.value);
                setB(nb);
                mark(m, nb);
              }}
              className={RANGE_BASE + ACC_RANGE.rose}
            />
            <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 p-3 text-center">
              <p className="text-[11px] font-bold text-emerald-200">이 범위에서의 최댓값</p>
              <p className="font-mono text-3xl font-black text-emerald-100">{fmt(m.f(bx), 2)}</p>
              <p className="mt-0.5 text-xs text-slate-300">
                {bx === 0 ? "왼쪽 끝" : m.peakX !== null && bx === m.peakX ? "봉우리(극대)" : "오른쪽 끝"} x ={" "}
                {fmt(bx)} 에서
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-bold text-slate-300">📋 다섯 걸음</p>
            <ol className="space-y-1 text-xs leading-6 text-slate-300">
              <li>
                <b className="text-slate-400">① 도함수</b>{" "}
                <span className="text-amber-200">
                  <Katex expr={m.dtex} />
                </span>
              </li>
              <li>
                <b className="text-slate-400">② </b>
                <Katex expr="f'(x) = 0" />
                <b className="text-slate-400"> 인 자리</b>{" "}
                {m.peakX === null && m.lowX === null ? (
                  <span className="text-rose-200">없음 — 늘 증가해요</span>
                ) : (
                  <span className="font-mono text-amber-200">
                    {[m.peakX, m.lowX].filter((v): v is number => v !== null).map((v) => fmt(v)).join(", ")}
                  </span>
                )}
              </li>
              <li>
                <b className="text-slate-400">③ 증가와 감소</b>
              </li>
            </ol>
            <SignStrip m={m} b={b} />
            <p className="text-xs leading-6 text-slate-300">
              <b className="text-slate-400">④ 개형</b> ← 왼쪽 그림
            </p>
            <p className="text-xs leading-6 text-slate-300">
              <b className="text-slate-400">⑤ 양 끝과 극댓값 견주기</b>
            </p>
            <div className="grid gap-1">
              {cands.map((c) => {
                const top = Math.abs(m.f(c.at) - m.f(bx)) < 1e-9;
                return (
                  <div
                    key={c.name}
                    className={
                      "flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs " +
                      (top
                        ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
                        : "border-white/10 bg-white/[0.03] text-slate-300")
                    }
                  >
                    <span className="font-bold">
                      {c.name} <span className="font-mono text-slate-400">x = {fmt(c.at)}</span>
                    </span>
                    <span className="font-mono font-black">
                      {fmt(m.f(c.at), 2)} {top ? "🏆" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <TipBox>{m.note}</TipBox>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={MOUNT_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner steps={MOUNT_STEPS} accent="rose" finale={MOUNT_FINALE} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 소비자의 선택
// ══════════════════════════════════════════════════════════════
function UtilTab() {
  const [ui, setUi] = useState(0);
  const [x, setX] = useState(0);
  const [found, setFound] = useState<Record<string, boolean>>({});

  const u = UTILS[ui];
  const mark = (uu: Util, nx: number) => {
    if (nx === uu.best) setFound((z) => (z[uu.id] ? z : { ...z, [uu.id]: true }));
  };

  const val = u.U(x);
  const mu = u.U1(x);
  const half = (u.box.xMax - u.box.xMin) * 0.3;
  const segs: PlotSeg[] = [
    ...lines(samplePath(u.U, 0, u.xMax, u.box), "curve"),
    {
      tone: "tangent",
      pts: [
        [x - half, val - mu * half],
        [x + half, val + mu * half],
      ],
    },
  ];
  const dots: PlotDot[] = [
    { x: u.best, y: u.bestU, tone: "peak", filled: false },
    { x, y: val, tone: "live", label: x === u.best ? "🏆" : undefined },
  ];
  const goals = UTILS.map((z) => found[z.id] === true);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {UTILS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === ui}
            accent="amber"
            onClick={() => {
              setUi(i);
              setX(0);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
          </PickButton>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-sky-200">
            <Katex expr={u.tex} />
          </p>
          <Plot
            box={u.box}
            uid={`ut-${u.id}`}
            segs={segs}
            dots={dots}
            vlines={[{ at: x, tone: "guide" }]}
            axis={["소비량", "효용"]}
          />
          <p className="text-center text-[11px] text-slate-400">
            노란 직선은 그 점에서의 <b className="text-amber-200">접선</b> — 기울기가 바로 한계효용이에요.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-3 rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
            <p className="flex justify-between text-xs font-bold text-slate-300">
              <span>얼마나 소비해 볼까요?</span>
              <span className="font-mono text-slate-100">
                {x} {u.unit}
              </span>
            </p>
            <input
              type="range"
              min={0}
              max={u.xMax}
              step={1}
              value={x}
              onChange={(ev) => {
                const nx = Number(ev.target.value);
                setX(nx);
                mark(u, nx);
              }}
              className={RANGE_BASE + ACC_RANGE.amber}
            />
            <EmojiRow emoji={u.emoji} over={u.tooMuch} n={x} limit={u.best} />
            <LevelBar ratio={val / u.bestU} text={`만족도 ${fmt(val, 0)}`} tone="amber" />
            <MarginalBadge
              v={mu}
              label="한계효용 U'(x)"
              up={`한 ${u.unit} 더 하면 만족이 더 커져요`}
              zero="딱 여기! 더 해도 좋아지지 않아요"
              down={`한 ${u.unit} 더 하면 오히려 만족이 줄어요`}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <p className="text-[11px] text-slate-400">지금 효용</p>
              <p className="font-mono text-lg font-black text-slate-100">{fmt(val, 0)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <p className="text-[11px] text-slate-400">
                <Katex expr={u.dtex} />
              </p>
              <p className="font-mono text-lg font-black text-amber-200">{fmt(mu, 1)}</p>
            </div>
            <div
              className={
                "rounded-xl border p-2 text-center " +
                (x === u.best ? "border-emerald-400/55 bg-emerald-400/15" : "border-white/10 bg-white/[0.03]")
              }
            >
              <p className="text-[11px] text-slate-400">최적소비량</p>
              <p className="font-mono text-lg font-black text-emerald-200">
                {x === u.best ? `${u.best} ${u.unit} 🏆` : "???"}
              </p>
            </div>
          </div>

          <TipBox>{u.note}</TipBox>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={UTIL_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner steps={UTIL_STEPS} accent="amber" finale={UTIL_FINALE} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 생산자의 선택
// ══════════════════════════════════════════════════════════════
function ProdTab() {
  const [pi, setPi] = useState(0);
  const [x, setX] = useState(0);
  const [found, setFound] = useState<Record<string, boolean>>({});

  const p = PRODS[pi];
  const mark = (pp: Prod, nx: number) => {
    if (nx === pp.best) setFound((z) => (z[pp.id] ? z : { ...z, [pp.id]: true }));
  };

  const val = p.P(x);
  const mp = p.P1(x);
  const nextGain = x < p.xMax ? p.P(x + 1) - p.P(x) : null;
  const half = (p.box.xMax - p.box.xMin) * 0.3;
  const segs: PlotSeg[] = [
    ...lines(samplePath(p.P, 0, p.xMax, p.box), "curve"),
    {
      tone: "tangent",
      pts: [
        [x - half, val - mp * half],
        [x + half, val + mp * half],
      ],
    },
  ];
  const dots: PlotDot[] = [
    { x: p.best, y: p.bestP, tone: "peak", filled: false },
    { x, y: val, tone: "live", label: x === p.best ? "🏆" : undefined },
  ];
  const goals = PRODS.map((z) => found[z.id] === true);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PRODS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === pi}
            accent="emerald"
            onClick={() => {
              setPi(i);
              setX(0);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
          </PickButton>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-sky-200">
            <Katex expr={p.tex} />
          </p>
          <Plot
            box={p.box}
            uid={`pd-${p.id}`}
            segs={segs}
            dots={dots}
            vlines={[{ at: x, tone: "guide" }]}
            axis={["노동량", "생산량"]}
          />
          <p className="text-center text-[11px] text-slate-400">
            접선이 <b className="text-emerald-200">오른쪽 위</b>를 보면 아직 늘릴 때, <b className="text-rose-200">
            오른쪽 아래
            </b>
            를 보면 너무 많이 넣은 때예요.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-4">
            <p className="flex justify-between text-xs font-bold text-slate-300">
              <span>{p.worker}를 몇 명 넣어 볼까요?</span>
              <span className="font-mono text-slate-100">{x} 명</span>
            </p>
            <input
              type="range"
              min={0}
              max={p.xMax}
              step={1}
              value={x}
              onChange={(ev) => {
                const nx = Number(ev.target.value);
                setX(nx);
                mark(p, nx);
              }}
              className={RANGE_BASE + ACC_RANGE.emerald}
            />
            <EmojiRow emoji="🧑‍🏭" over="😵‍💫" n={x} limit={p.best} />
            <LevelBar ratio={val / p.bestP} text={`생산량 ${fmt(val, 0)} ${p.unit}`} tone="emerald" />
            <MarginalBadge
              v={mp}
              label="한계생산량 P'(x)"
              up="한 명 더 넣으면 생산이 늘어요"
              zero="딱 여기! 더 넣어도 늘지 않아요"
              down="한 명 더 넣으면 오히려 줄어요"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <p className="text-[11px] text-slate-400">지금 생산량</p>
              <p className="font-mono text-lg font-black text-slate-100">{fmt(val, 0)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <p className="text-[11px] text-slate-400">한 명 더 넣으면</p>
              <p
                className={
                  "font-mono text-lg font-black " +
                  (nextGain === null ? "text-slate-500" : nextGain >= 0 ? "text-emerald-200" : "text-rose-200")
                }
              >
                {nextGain === null ? "—" : (nextGain >= 0 ? "+" : "") + fmt(nextGain, 0)}
              </p>
            </div>
            <div
              className={
                "rounded-xl border p-2 text-center " +
                (x === p.best ? "border-emerald-400/55 bg-emerald-400/15" : "border-white/10 bg-white/[0.03]")
              }
            >
              <p className="text-[11px] text-slate-400">최적노동량</p>
              <p className="font-mono text-lg font-black text-emerald-200">
                {x === p.best ? `${p.best} 명 🏆` : "???"}
              </p>
            </div>
          </div>

          <TipBox>{p.note}</TipBox>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={PROD_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner steps={PROD_STEPS} accent="emerald" finale={PROD_FINALE} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 기업의 선택
// ══════════════════════════════════════════════════════════════
function FirmTab() {
  const [fi, setFi] = useState(0);
  const [x, setX] = useState(0);
  const [sawLoss, setSawLoss] = useState(false);
  const [sawEven, setSawEven] = useState(false);
  const [sawBest, setSawBest] = useState(false);
  const [bestOf, setBestOf] = useState<Record<string, boolean>>({});

  const f = FIRMS[fi];
  const mark = (ff: Firm, nx: number) => {
    const hv = ff.h(nx);
    if (hv < -1e-9) setSawLoss(true);
    if (Math.abs(hv) < 1e-9) setSawEven(true);
    if (nx === ff.best) {
      setSawBest(true);
      setBestOf((z) => (z[ff.id] ? z : { ...z, [ff.id]: true }));
    }
  };

  const rev = f.p * x;
  const cost = f.g(x);
  const profit = f.h(x);
  const goals = [sawLoss, sawEven, sawBest, FIRMS.every((z) => bestOf[z.id] === true)];

  const rcSegs: PlotSeg[] = [
    ...lines(samplePath((t) => f.p * t, 0, f.xMax, f.boxRC), "revenue"),
    ...lines(samplePath(f.g, 0, f.xMax, f.boxRC), "cost"),
  ];
  const rcDots: PlotDot[] = [
    { x, y: rev, tone: "best", small: true },
    { x, y: cost, tone: "live", small: true },
  ];
  const rcGaps: PlotGap[] = [
    {
      x,
      y0: Math.min(rev, cost),
      y1: Math.max(rev, cost),
      tone: profit >= 0 ? "profit" : "loss",
    },
  ];

  const hSegs: PlotSeg[] = lines(samplePath(f.h, 0, f.xMax, f.boxH), "profit");
  const hDots: PlotDot[] = [
    { x: f.best, y: f.bestH, tone: "peak", filled: false },
    { x: f.breakEven, y: 0, tone: "end", filled: false },
    { x, y: profit, tone: "live", label: x === f.best ? "🏆" : undefined },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FIRMS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === fi}
            accent="violet"
            onClick={() => {
              setFi(i);
              setX(0);
              mark(z, 0);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
            <span className="ml-1 font-mono text-[10px] text-slate-400">값 {z.p}</span>
          </PickButton>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-xs font-bold text-slate-300">총수입과 총비용</p>
          <Plot
            box={f.boxRC}
            uid={`fr-${f.id}`}
            segs={rcSegs}
            dots={rcDots}
            gaps={rcGaps}
            vlines={[{ at: x, tone: "guide" }]}
            axis={["생산량", "금액"]}
          />
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
            <span className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 font-bold text-emerald-200">
              초록 = 총수입 {f.p}x
            </span>
            <span className="rounded-lg border border-rose-400/50 bg-rose-400/10 px-2 py-0.5 font-bold text-rose-200">
              빨강 = 총비용
            </span>
          </div>
          <p className="text-center text-[11px] text-slate-400">두 선 사이의 굵은 세로 막대가 바로 이윤이에요.</p>
        </div>

        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-xs font-bold text-slate-300">이윤함수</p>
          <Plot
            box={f.boxH}
            uid={`fh-${f.id}`}
            segs={hSegs}
            dots={hDots}
            vlines={[{ at: x, tone: "guide" }]}
            hlines={[{ at: 0, tone: "guide", solid: true }]}
            axis={["생산량", "이윤"]}
          />
          <p className="text-center text-sm font-bold text-violet-200">
            <Katex expr={f.htex} />
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="space-y-3 rounded-2xl border border-violet-400/25 bg-violet-500/[0.06] p-4">
          <p className="flex justify-between text-xs font-bold text-slate-300">
            <span>몇 {f.unit} 만들어 팔까요?</span>
            <span className="font-mono text-slate-100">
              {x} {f.unit}
            </span>
          </p>
          <input
            type="range"
            min={0}
            max={f.xMax}
            step={1}
            value={x}
            onChange={(ev) => {
              const nx = Number(ev.target.value);
              setX(nx);
              mark(f, nx);
            }}
            className={RANGE_BASE + ACC_RANGE.violet}
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.07] p-2 text-center">
              <p className="text-[11px] text-slate-400">총수입 {f.p} × {x}</p>
              <p className="font-mono text-lg font-black text-emerald-200">{won(rev)}</p>
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-400/[0.07] p-2 text-center">
              <p className="text-[11px] text-slate-400">총비용 g({x})</p>
              <p className="font-mono text-lg font-black text-rose-200">{won(cost)}</p>
            </div>
            <div
              className={
                "rounded-xl border-2 p-2 text-center " +
                (profit > 1e-9
                  ? "border-emerald-400/60 bg-emerald-400/15"
                  : profit < -1e-9
                    ? "border-rose-400/60 bg-rose-400/15"
                    : "border-amber-400/60 bg-amber-400/20")
              }
            >
              <p className="text-[11px] text-slate-300">
                이윤 {profit > 1e-9 ? "흑자 😀" : profit < -1e-9 ? "적자 😣" : "본전 😐"}
              </p>
              <p className="font-mono text-xl font-black text-slate-50">{won(profit)}</p>
            </div>
          </div>
          <div
            className={
              "rounded-xl border-2 p-3 text-center " +
              (x === f.best ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/[0.03]")
            }
          >
            <p className="text-[11px] text-slate-400">최적생산량</p>
            <p className="font-mono text-2xl font-black text-emerald-200">
              {x === f.best ? `${f.best} ${f.unit} 🏆 (이윤 ${f.bestH})` : "???"}
            </p>
          </div>
          <TipBox>{f.note}</TipBox>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-6 text-slate-300">
            <p className="font-bold text-slate-200">🧾 이 공방의 장부</p>
            <p>
              총수입 <Katex expr={f.ftex} />
            </p>
            <p>
              총비용 <Katex expr={f.gtex} />
            </p>
            <p>
              이윤 <Katex expr={f.htex} />
            </p>
            <p>
              <Katex expr={f.dhtex} />
            </p>
            <p className="text-slate-400">
              고정비 {f.fixed} · 손익분기 {f.breakEven} {f.unit}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={FIRM_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner steps={FIRM_STEPS} accent="violet" finale={FIRM_FINALE} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ 한계비용 = 가격
// ══════════════════════════════════════════════════════════════
function McTab() {
  const [ci, setCi] = useState(0);
  const [p, setP] = useState(COSTS[0].p0);
  const [pins, setPins] = useState<Record<string, number[]>>({});
  const [zeroHit, setZeroHit] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const c = COSTS[ci];
  const mark = (cc: CostCase, np: number) => {
    setTouched((z) => (z[cc.id] ? z : { ...z, [cc.id]: true }));
    setPins((z) => {
      const old = z[cc.id] ?? [];
      return old.includes(np) ? z : { ...z, [cc.id]: [...old, np] };
    });
    if (np === cc.zeroP) setZeroHit(true);
  };

  const xs = c.best(p);
  const maxProfit = p * xs - c.g(xs);
  const myPins = pins[c.id] ?? [];
  const spots = new Set(myPins.map((pp) => c.best(pp)));
  const goals = [spots.size >= 2, zeroHit, myPins.length >= 5, COSTS.every((z) => touched[z.id] === true)];

  const half = (c.boxRC.xMax - c.boxRC.xMin) * 0.28;
  const rcSegs: PlotSeg[] = [
    ...lines(samplePath((t) => p * t, 0, c.xMax, c.boxRC), "revenue"),
    ...lines(samplePath(c.g, 0, c.xMax, c.boxRC), "cost"),
    {
      tone: "tangent",
      dash: true,
      pts: [
        [xs - half, c.g(xs) - p * half],
        [xs + half, c.g(xs) + p * half],
      ],
    },
  ];
  const rcGaps: PlotGap[] = [
    {
      x: xs,
      y0: Math.min(p * xs, c.g(xs)),
      y1: Math.max(p * xs, c.g(xs)),
      tone: maxProfit >= 0 ? "profit" : "loss",
    },
  ];
  const rcDots: PlotDot[] = [
    { x: xs, y: c.g(xs), tone: "live", small: true },
    { x: xs, y: p * xs, tone: "best", small: true },
  ];

  const mcSegs: PlotSeg[] = lines(samplePath(c.g1, 0, c.xMax, c.boxMC), "marginal");
  const mcDots: PlotDot[] = [
    ...myPins.map((pp): PlotDot => ({ x: c.best(pp), y: pp, tone: "pin", small: true })),
    { x: xs, y: p, tone: "best", label: "★" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {COSTS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === ci}
            accent="sky"
            onClick={() => {
              setCi(i);
              setP(z.p0);
              mark(z, z.p0);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
          </PickButton>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-xs font-bold text-slate-300">총수입과 총비용</p>
          <Plot
            box={c.boxRC}
            uid={`mr-${c.id}`}
            segs={rcSegs}
            dots={rcDots}
            gaps={rcGaps}
            vlines={[{ at: xs, tone: "goal", solid: true }]}
            axis={["생산량", "금액"]}
          />
          <p className="text-center text-[11px] text-slate-400">
            노란 <b className="text-amber-200">점선(접선)</b>이 초록 수입 직선과 나란해지는 자리예요. 거기서 두 선의
            간격이 가장 벌어지지요.
          </p>
        </div>

        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-xs font-bold text-slate-300">한계비용과 가격</p>
          <Plot
            box={c.boxMC}
            uid={`mm-${c.id}`}
            segs={mcSegs}
            dots={mcDots}
            hlines={[{ at: p, tone: "goal", solid: true }]}
            vlines={[{ at: xs, tone: "guide" }]}
            axis={["생산량", "금액"]}
          />
          <p className="text-center text-sm font-bold text-orange-200">
            <Katex expr={c.dgtex} />
          </p>
          <p className="text-center text-[11px] text-slate-400">
            모은 보라색 점이 모두 주황 한계비용 직선 위에 올라앉아요 — 그것이 곧 공급곡선이에요.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="space-y-3 rounded-2xl border border-sky-400/25 bg-sky-500/[0.06] p-4">
          <p className="flex justify-between text-xs font-bold text-slate-300">
            <span>시장 가격을 움직여 보세요</span>
            <span className="font-mono text-slate-100">p = {p}</span>
          </p>
          <input
            type="range"
            min={c.pMin}
            max={c.pMax}
            step={c.pStep}
            value={p}
            onChange={(ev) => {
              const np = Number(ev.target.value);
              setP(np);
              mark(c, np);
            }}
            className={RANGE_BASE + ACC_RANGE.sky}
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <p className="text-[11px] text-slate-400">
                <Katex expr={`g'(x) = ${p}`} />
              </p>
              <p className="font-mono text-lg font-black text-orange-200">풀면 x = {fmt(xs)}</p>
            </div>
            <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 p-2 text-center">
              <p className="text-[11px] text-slate-400">최적생산량</p>
              <p className="font-mono text-lg font-black text-emerald-200">
                {fmt(xs)} {c.unit}
              </p>
            </div>
            <div
              className={
                "rounded-xl border-2 p-2 text-center " +
                (maxProfit > 1e-9
                  ? "border-emerald-400/60 bg-emerald-400/15"
                  : maxProfit < -1e-9
                    ? "border-rose-400/60 bg-rose-400/15"
                    : "border-amber-400/60 bg-amber-400/20")
              }
            >
              <p className="text-[11px] text-slate-300">
                가장 큰 이윤 {maxProfit > 1e-9 ? "😀" : maxProfit < -1e-9 ? "😣" : "본전 😐"}
              </p>
              <p className="font-mono text-xl font-black text-slate-50">{won(maxProfit)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1.5 text-xs font-bold text-slate-300">
              📍 모은 짝 (생산량, 가격) — {myPins.length} 개
            </p>
            <div className="flex flex-wrap gap-1.5">
              {myPins.length === 0 ? (
                <span className="text-xs text-slate-500">손잡이를 움직이면 짝이 쌓여요</span>
              ) : null}
              {[...myPins]
                .sort((a, z) => a - z)
                .map((pp) => (
                  <span
                    key={pp}
                    className="rounded-lg border border-violet-400/50 bg-violet-400/15 px-2 py-0.5 font-mono text-[11px] font-bold text-violet-100"
                  >
                    ({fmt(c.best(pp))}, {pp})
                  </span>
                ))}
            </div>
          </div>
          <TipBox>{c.note}</TipBox>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-6 text-slate-300">
            <p className="font-bold text-slate-200">🧮 왜 그럴까요?</p>
            <p>
              <Katex expr="h(x) = px - g(x)" />
            </p>
            <p>
              <Katex expr="h'(x) = p - g'(x)" />
            </p>
            <p>
              <Katex expr="h'(x) = 0 \iff g'(x) = p" />
            </p>
            <p className="text-slate-400">
              총비용 <Katex expr={c.gtex} />
            </p>
            <p className="text-slate-400">
              한계비용 <Katex expr={c.dgtex} />
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={MC_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner steps={MC_STEPS} accent="sky" finale={MC_FINALE} />
    </div>
  );
}
