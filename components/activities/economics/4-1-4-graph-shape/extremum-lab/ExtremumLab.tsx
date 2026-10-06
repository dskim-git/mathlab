"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  COURSES,
  arcRatio,
  FLAG_EMOJI,
  FLAG_LABEL,
  FLAT_CARDS,
  FLAT_PROBE,
  FLAT_STEPS,
  LENS_FNS,
  LENS_GOALS,
  LENS_STEPS,
  LENS_W_MAX,
  LENS_W_MIN,
  PAIR_FNS,
  PAIR_GOALS,
  PAIR_STEPS,
  REAL_NOTE,
  RIDE_GOALS,
  RIDE_STEPS,
  SLOPE_FNS,
  SLOPE_GOALS,
  SLOPE_STEPS,
  SPAN_EMOJI,
  SPAN_LABEL,
  fmt,
  samplePath,
  signCells,
  spanVerdict,
  tonedPath,
  windowStat,
  type Box,
  type FlagKind,
  type Piece,
  type SpanCheck,
  type SpanKind,
  type Step,
  type TonedSeg,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "two_points",
    prompt:
      "①에서는 두 함숫값만 견주어 증가·감소를 가렸고, ④에서는 도함수의 부호만 보고 같은 답을 얻었어요. 두 방법이 왜 같은 결론에 닿는지 자기 말로 쓰고, 그래도 ①의 정의가 먼저 필요한 까닭도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 오르막이면 두 점 중 오른쪽이 늘 높고, 그 오르막을 숫자로 나타낸 것이 접선의 기울기라서 부호만 봐도 된다. 하지만 '증가' 의 뜻 자체는 두 함숫값의 비교로 정해져 있어서, 미분할 수 없는 함수에도 쓰려면 정의가 먼저여야 한다.",
  },
  {
    id: "local_vs_global",
    prompt:
      "③의 돋보기 창을 좁혔다 넓혔다 해 보았어요. 극대의 정의에 나오는 '어떤 열린구간' 이 무슨 뜻인지 쓰고, 극댓값 2 가 최댓값 8.125 보다 작아도 괜찮았던 까닭을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 그런 구간이 하나라도 있으면 된다는 뜻이라, 창을 좁히기만 하면 조건을 맞출 수 있었다. 극대는 그 근처에서만 가장 높으면 되는 자리라서 멀리 떨어진 더 높은 곳과는 상관이 없다.",
  },
  {
    id: "flat_not_extreme",
    prompt:
      "⑤에서 f'(a) = 0 인 여덟 자리를 분류했더니 둘은 극값이 아니었어요. 그 두 자리가 다른 여섯과 무엇이 달랐는지 쓰고, 극값을 판정하려면 무엇을 더 확인해야 하는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 평평한 것은 똑같은데 좌우의 부호가 둘 다 같아서 올라가던 방향이 그대로 이어졌다. 그래서 f'(a) = 0 만으로는 모자라고 a 의 좌우에서 부호가 실제로 바뀌는지 봐야 한다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "pair" | "ride" | "lens" | "slope" | "flat";

export default function ExtremumLab() {
  const [tab, setTab] = useState<Tab>("pair");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🎢 함수의 증가·감소와 극값</h3>
        <p className="mt-2 leading-7 text-slate-300">
          두 점을 끌어 <b className="text-sky-200">증가·감소의 정의</b>를 확인하고, 그래프 위를 롤러코스터로 달리며 정상과
          골짜기를 찾아요. 돋보기 창으로 <b className="text-violet-200">극대·극소의 정의</b>를 들여다본 뒤, 접선과{" "}
          <b className="text-emerald-200">도함수의 부호</b>만으로 같은 답에 닿는지 확인해요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "pair"} onClick={() => setTab("pair")}>① 두 점 재판소</TabButton>
        <TabButton active={tab === "ride"} onClick={() => setTab("ride")}>② 롤러코스터</TabButton>
        <TabButton active={tab === "lens"} onClick={() => setTab("lens")}>③ 돋보기 창</TabButton>
        <TabButton active={tab === "slope"} onClick={() => setTab("slope")}>④ 경사계와 증감표</TabButton>
        <TabButton active={tab === "flat"} onClick={() => setTab("flat")}>⑤ 평평한 자리 분류소</TabButton>
      </div>

      <div className="mt-4">
        {tab === "pair" ? <PairTab /> : null}
        {tab === "ride" ? <RideTab /> : null}
        {tab === "lens" ? <LensTab /> : null}
        {tab === "slope" ? <SlopeTab /> : null}
        {tab === "flat" ? <FlatTab /> : null}
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
const PML = 44;
const PMR = 14;
const PMT = 14;
const PMB = 28;
const CML = 30;
const CMR = 10;
const CMT = 10;
const CMB = 22;

/** 가로·세로 배율이 달라 실제 기울기와 화면 기울기가 다르다 — Plot 과 같은 식을 쓴다 */
function screenSlopeDeg(box: Box, slope: number, compact = false): number {
  const kx = (PS - (compact ? CML : PML) - (compact ? CMR : PMR)) / (box.xMax - box.xMin);
  const ky = (PS - (compact ? CMT : PMT) - (compact ? CMB : PMB)) / (box.yMax - box.yMin);
  return (Math.atan2(-slope * ky, kx) * 180) / Math.PI;
}

type Stroke = "line" | "up" | "down" | "deriv" | "ghost";
const STROKE_COLOR: Record<Stroke, string> = {
  line: "#38bdf8",
  up: "#34d399",
  down: "#fb7185",
  deriv: "#c084fc",
  ghost: "rgba(148,163,184,0.35)",
};

type DotTone = "live" | "max" | "min" | "none" | "pair" | "zero";
const DOT_COLOR: Record<DotTone, string> = {
  live: "#f472b6",
  max: "#fbbf24",
  min: "#38bdf8",
  none: "#94a3b8",
  pair: "#e2e8f0",
  zero: "#c084fc",
};

type ShadeTone = "span" | "lens" | "seen";
const SHADE_COLOR: Record<ShadeTone, string> = {
  span: "rgba(56,189,248,0.10)",
  lens: "rgba(167,139,250,0.16)",
  seen: "rgba(52,211,153,0.07)",
};

type LineTone = "guide" | "hot" | "cool";
const GUIDE_COLOR: Record<LineTone, string> = {
  guide: "rgba(148,163,184,0.45)",
  hot: "rgba(251,191,36,0.55)",
  cool: "rgba(56,189,248,0.55)",
};

export type PlotSeg = { tone: Stroke; pts: [number, number][] };
export type PlotDot = { x: number; y: number; tone: DotTone; filled?: boolean; label?: string };
export type PlotShade = { from: number; to: number; tone: ShadeTone };
export type PlotRule = { at: number; tone: LineTone; dash?: boolean };
export type PlotTangent = { x: number; y: number; slope: number; half: number };
export type PlotCart = { x: number; y: number; slope: number; text: string };

function Plot({
  box,
  segs,
  dots = [],
  shades = [],
  vlines = [],
  hlines = [],
  tangent,
  cart,
  uid,
  axis,
  compact = false,
}: {
  box: Box;
  segs: PlotSeg[];
  dots?: PlotDot[];
  shades?: PlotShade[];
  vlines?: PlotRule[];
  hlines?: PlotRule[];
  tangent?: PlotTangent;
  cart?: PlotCart;
  uid: string;
  axis?: [string, string];
  compact?: boolean;
}) {
  const ml = compact ? CML : PML;
  const mr = compact ? CMR : PMR;
  const mt = compact ? CMT : PMT;
  const mb = compact ? CMB : PMB;
  const pw = PS - ml - mr;
  const ph = PS - mt - mb;
  const X = (v: number) => ml + ((v - box.xMin) / (box.xMax - box.xMin)) * pw;
  const Y = (v: number) => PS - mb - ((v - box.yMin) / (box.yMax - box.yMin)) * ph;
  const cid = `ex-${uid}`;
  const fs = compact ? 7 : 8;

  const gx: number[] = [];
  for (let i = 0; i <= 24; i++) {
    const v = Math.ceil(box.xMin / box.gx - 1e-9) * box.gx + i * box.gx;
    if (v > box.xMax + 1e-9) break;
    gx.push(Number(v.toFixed(10)));
  }
  const gy: number[] = [];
  for (let i = 0; i <= 24; i++) {
    const v = Math.ceil(box.yMin / box.gy - 1e-9) * box.gy + i * box.gy;
    if (v > box.yMax + 1e-9) break;
    gy.push(Number(v.toFixed(10)));
  }
  const axisX = box.yMin <= 0 && box.yMax >= 0;
  const axisY = box.xMin <= 0 && box.xMax >= 0;

  return (
    <svg viewBox={`0 0 ${PS} ${PS}`} className="w-full" role="img" aria-label="함수의 그래프">
      <defs>
        <clipPath id={cid}>
          <rect x={ml} y={mt} width={pw} height={ph} />
        </clipPath>
      </defs>
      <rect x={ml} y={mt} width={pw} height={ph} fill="#0b1220" stroke="rgba(255,255,255,0.12)" />

      <g clipPath={`url(#${cid})`}>
        {shades.map((s, i) => (
          <rect
            key={`sh${i}`}
            x={X(Math.max(s.from, box.xMin))}
            y={mt}
            width={Math.max(0, X(Math.min(s.to, box.xMax)) - X(Math.max(s.from, box.xMin)))}
            height={ph}
            fill={SHADE_COLOR[s.tone]}
          />
        ))}
      </g>

      {gx.map((v) => (
        <line key={`gx${v}`} x1={X(v)} y1={mt} x2={X(v)} y2={PS - mb} stroke="rgba(255,255,255,0.06)" />
      ))}
      {gy.map((v) => (
        <line key={`gy${v}`} x1={ml} y1={Y(v)} x2={PS - mr} y2={Y(v)} stroke="rgba(255,255,255,0.06)" />
      ))}
      {axisX ? <line x1={ml} y1={Y(0)} x2={PS - mr} y2={Y(0)} stroke="rgba(255,255,255,0.32)" /> : null}
      {axisY ? <line x1={X(0)} y1={mt} x2={X(0)} y2={PS - mb} stroke="rgba(255,255,255,0.32)" /> : null}

      {gx.map((v) => (
        <text key={`tx${v}`} x={X(v)} y={PS - mb + 12} textAnchor="middle" fontSize={fs} fill="#64748b">
          {fmt(v, 4)}
        </text>
      ))}
      {gy.map((v) => (
        <text key={`ty${v}`} x={ml - 4} y={Y(v) + 3} textAnchor="end" fontSize={fs} fill="#64748b">
          {fmt(v, 4)}
        </text>
      ))}
      {axis ? (
        <>
          <text x={PS - mr} y={PS - 3} textAnchor="end" fontSize={fs} fill="#475569">
            {axis[0]}
          </text>
          <text x={2} y={mt - 3} textAnchor="start" fontSize={fs} fill="#475569">
            {axis[1]}
          </text>
        </>
      ) : null}

      <g clipPath={`url(#${cid})`}>
        {hlines.map((h, i) => (
          <line
            key={`hl${i}`}
            x1={ml}
            y1={Y(h.at)}
            x2={PS - mr}
            y2={Y(h.at)}
            stroke={GUIDE_COLOR[h.tone]}
            strokeDasharray={h.dash === false ? undefined : "4 3"}
          />
        ))}
        {vlines.map((v, i) => (
          <line
            key={`vl${i}`}
            x1={X(v.at)}
            y1={mt}
            x2={X(v.at)}
            y2={PS - mb}
            stroke={GUIDE_COLOR[v.tone]}
            strokeDasharray={v.dash === false ? undefined : "4 3"}
          />
        ))}
        {segs.map((s, i) => (
          <polyline
            key={`sg${i}`}
            points={s.pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")}
            fill="none"
            stroke={STROKE_COLOR[s.tone]}
            strokeWidth={s.tone === "ghost" ? 1.6 : 2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {tangent ? (
          <line
            x1={X(tangent.x - tangent.half)}
            y1={Y(tangent.y - tangent.slope * tangent.half)}
            x2={X(tangent.x + tangent.half)}
            y2={Y(tangent.y + tangent.slope * tangent.half)}
            stroke="#fbbf24"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        ) : null}
      </g>

      {/* 점·이름표·카트는 clipPath 밖에 그린다 */}
      {dots
        .filter((d) => d.x >= box.xMin && d.x <= box.xMax && d.y >= box.yMin && d.y <= box.yMax)
        .map((d, i) => (
          <g key={`dt${i}`}>
            <circle
              cx={X(d.x)}
              cy={Y(d.y)}
              r={d.tone === "live" ? 4.5 : 5}
              fill={d.filled === false ? "#0b1220" : DOT_COLOR[d.tone]}
              stroke={DOT_COLOR[d.tone]}
              strokeWidth="2"
            />
            {d.label ? (
              <text
                x={X(d.x)}
                y={Y(d.y) - 10}
                textAnchor="middle"
                fontSize={compact ? 10 : 12}
                fill={DOT_COLOR[d.tone]}
              >
                {d.label}
              </text>
            ) : null}
          </g>
        ))}
      {cart && cart.x >= box.xMin && cart.x <= box.xMax && cart.y >= box.yMin && cart.y <= box.yMax ? (
        <g transform={`translate(${X(cart.x)} ${Y(cart.y)}) rotate(${screenSlopeDeg(box, cart.slope, compact)})`}>
          <text x={0} y={-7} textAnchor="middle" fontSize="18">
            {cart.text}
          </text>
        </g>
      ) : null}
    </svg>
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
//  공용 — 고르개 단추
// ══════════════════════════════════════════════════════════════
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

const VERDICT_CHIP: Record<SpanKind, string> = {
  up: "border-emerald-400/60 bg-emerald-400/15 text-emerald-100",
  down: "border-rose-400/60 bg-rose-400/15 text-rose-100",
  mix: "border-amber-400/60 bg-amber-400/15 text-amber-100",
};

// ══════════════════════════════════════════════════════════════
//  탭 ① 두 점 재판소
// ══════════════════════════════════════════════════════════════
function PairTab() {
  const [fi, setFi] = useState(0);
  const [si, setSi] = useState(0);
  const [t1, setT1] = useState(0.25);
  const [t2, setT2] = useState(0.75);
  const [checked, setChecked] = useState<Record<string, SpanCheck>>({});

  const f = PAIR_FNS[fi];
  const span = f.spans[Math.min(si, f.spans.length - 1)];
  const w = span.hi - span.lo;
  const va = Number((span.lo + t1 * w).toFixed(2));
  const vb = Number((span.lo + t2 * w).toFixed(2));
  const x1 = Math.min(va, vb);
  const x2 = Math.max(va, vb);
  const y1 = f.fn(x1);
  const y2 = f.fn(x2);
  const same = Math.abs(x1 - x2) < 1e-9;

  const res = checked[span.id];
  const found = (k: SpanKind) => Object.entries(checked).some(([, c]) => c.kind === k);
  const goals = [found("up"), found("down"), found("mix")];

  const segs: PlotSeg[] = [
    ...ghost(samplePath(f.fn, f.from, f.to, f.box)),
    ...samplePath(f.fn, span.lo, span.hi, f.box).map((pts) => ({ tone: "line" as Stroke, pts })),
  ];
  const dots: PlotDot[] = [
    { x: x1, y: y1, tone: "pair", label: "x₁" },
    { x: x2, y: y2, tone: "live", label: "x₂" },
  ];
  if (res?.kind === "mix" && res.badUp) {
    dots.push({ x: res.badUp[0], y: f.fn(res.badUp[0]), tone: "none", filled: false });
    dots.push({ x: res.badUp[1], y: f.fn(res.badUp[1]), tone: "none", filled: false });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PAIR_FNS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === fi}
            accent="sky"
            onClick={() => {
              setFi(i);
              setSi(0);
              setT1(0.25);
              setT2(0.75);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
          </PickButton>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="mb-1 text-center text-sm font-bold text-sky-200">
            <Katex expr={f.tex} />
          </p>
          <Plot
            box={f.box}
            uid={`pair-${f.id}-${span.id}`}
            segs={segs}
            dots={dots}
            shades={[{ from: span.lo, to: span.hi, tone: "span" }]}
            hlines={[
              { at: y1, tone: "guide" },
              { at: y2, tone: "cool" },
            ]}
            axis={["x", "f(x)"]}
          />
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-sky-400/25 bg-sky-500/[0.06] p-4">
            <p className="text-xs font-bold text-sky-200">검사할 구간을 고르세요</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {f.spans.map((z, i) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => {
                    setSi(i);
                    setT1(0.25);
                    setT2(0.75);
                  }}
                  className={
                    "rounded-lg border-2 px-3 py-1.5 font-mono text-xs font-bold transition " +
                    (i === si
                      ? ACC_CHIP.sky
                      : checked[z.id]
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  ({fmt(z.lo)}, {fmt(z.hi)})
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="mb-1 flex justify-between text-xs font-bold text-slate-300">
                  <span>점 A</span>
                  <span className="font-mono text-slate-100">{fmt(va)}</span>
                </p>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.002}
                  value={t1}
                  onChange={(e) => setT1(Number(e.target.value))}
                  className={RANGE_BASE + ACC_RANGE.sky}
                />
              </div>
              <div>
                <p className="mb-1 flex justify-between text-xs font-bold text-slate-300">
                  <span>점 B</span>
                  <span className="font-mono text-slate-100">{fmt(vb)}</span>
                </p>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.002}
                  value={t2}
                  onChange={(e) => setT2(Number(e.target.value))}
                  className={RANGE_BASE + ACC_RANGE.sky}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-center gap-3 text-center">
              <div>
                <p className="font-mono text-[11px] text-slate-400">x₁ = {fmt(x1)}</p>
                <p className="font-mono text-sm font-bold text-slate-100">f(x₁) = {fmt(y1, 3)}</p>
              </div>
              <p className="text-2xl font-black text-amber-300">{same ? "=" : y1 < y2 ? "<" : y1 > y2 ? ">" : "="}</p>
              <div>
                <p className="font-mono text-[11px] text-slate-400">x₂ = {fmt(x2)}</p>
                <p className="font-mono text-sm font-bold text-slate-100">f(x₂) = {fmt(y2, 3)}</p>
              </div>
            </div>
            <p className="mt-2 text-center text-xs leading-6 text-slate-300">
              {same
                ? "두 점을 서로 다르게 잡아야 비교할 수 있어요."
                : y1 < y2
                  ? "x₁ < x₂ 인데 f(x₁) < f(x₂) — 이 쌍은 '증가' 쪽 증거예요."
                  : y1 > y2
                    ? "x₁ < x₂ 인데 f(x₁) > f(x₂) — 이 쌍은 '감소' 쪽 증거예요."
                    : "두 함숫값이 같아요 — 증가도 감소도 아닌 쌍이에요."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setChecked((z) => ({ ...z, [span.id]: spanVerdict(f.fn, span.lo, span.hi) }))}
            className={"w-full rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition " + ACC_BTN.sky}
          >
            🔎 이 구간의 모든 쌍 검사하기
          </button>

          {res ? (
            <div className={"rounded-2xl border-2 p-4 " + VERDICT_CHIP[res.kind]}>
              <p className="text-center text-sm font-black">
                {SPAN_EMOJI[res.kind]} {res.pairs}쌍을 모두 견준 결과 — 이 구간에서 {SPAN_LABEL[res.kind]}
              </p>
              {res.kind === "mix" ? (
                <div className="mt-2 space-y-1 text-center font-mono text-[11px] text-slate-200">
                  {res.badUp ? (
                    <p>
                      증가를 깨는 쌍 : x₁ = {fmt(res.badUp[0])} , x₂ = {fmt(res.badUp[1])} → f(x₁) = {fmt(f.fn(res.badUp[0]), 3)} ≥ f(x₂) = {fmt(f.fn(res.badUp[1]), 3)}
                    </p>
                  ) : null}
                  {res.badDown ? (
                    <p>
                      감소를 깨는 쌍 : x₁ = {fmt(res.badDown[0])} , x₂ = {fmt(res.badDown[1])} → f(x₁) = {fmt(f.fn(res.badDown[0]), 3)} ≤ f(x₂) = {fmt(f.fn(res.badDown[1]), 3)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <TipBox>구간을 고르고 단추를 누르면 그 구간을 45 등분해 990 쌍을 한꺼번에 견줘요.</TipBox>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={PAIR_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner
        steps={PAIR_STEPS}
        accent="sky"
        finale="증가·감소는 '두 함숫값의 크기 비교' 로만 정해지는 성질이고, 함수가 아니라 구간마다 따로 정해져요."
      />
    </div>
  );
}

/** 바탕(회색) 그래프 — 끊긴 조각을 모두 그린다 */
function ghost(paths: [number, number][][]): PlotSeg[] {
  return paths.map((pts) => ({ tone: "ghost" as Stroke, pts }));
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 롤러코스터
// ══════════════════════════════════════════════════════════════
const LEAN_WORD = (slope: number): { word: string; tone: "up" | "down" | "flat"; cab: string } => {
  if (slope > 0.12)
    return { word: "오르막", tone: "up", cab: "트랙이 수평선보다 위를 향해요 — 하늘만 보이고 몸이 뒤로 젖혀져요." };
  if (slope < -0.12)
    return { word: "내리막", tone: "down", cab: "트랙이 수평선 아래로 떨어져요 — 땅이 다가오고 몸이 앞으로 쏠려요." };
  return { word: "평평", tone: "flat", cab: "트랙이 수평선과 나란해요 — 잠깐 평평해졌어요." };
};
const LEAN_TEXT: Record<"up" | "down" | "flat", string> = {
  up: "text-emerald-200",
  down: "text-rose-200",
  flat: "text-amber-200",
};
const LEAN_PANEL: Record<"up" | "down" | "flat", string> = {
  up: "border-emerald-400/45 bg-emerald-400/[0.10]",
  down: "border-rose-400/45 bg-rose-400/[0.10]",
  flat: "border-amber-400/45 bg-amber-400/[0.10]",
};

/**
 * 경사계 — 바늘이 트랙이 나아가는 방향 그대로를 가리킨다.
 * 위쪽 끝(-90°)이 가파른 오르막, 가운데(0°)가 평평, 아래쪽 끝(+90°)이 가파른 내리막이다.
 */
const GA_CX = 44;
const GA_CY = 72;
const GA_R = 52;
const gaPt = (d: number, r = GA_R): [number, number] => [
  GA_CX + r * Math.cos((d * Math.PI) / 180),
  GA_CY + r * Math.sin((d * Math.PI) / 180),
];

function Gauge({ deg, word, tone }: { deg: number; word: string; tone: "up" | "down" | "flat" }) {
  const [ax, ay] = gaPt(-90);
  const [bx, by] = gaPt(-6);
  const [cx, cy] = gaPt(6);
  const [dx, dy] = gaPt(90);
  const [nx, ny] = gaPt(Math.max(-88, Math.min(88, deg)));
  return (
    <svg viewBox="0 0 150 158" className="w-full max-w-[160px]" role="img" aria-label="경사계">
      <text x="6" y="12" textAnchor="start" fontSize="9" fill="#64748b">
        경사계
      </text>
      <path d={`M ${ax} ${ay} A ${GA_R} ${GA_R} 0 0 1 ${bx} ${by}`} fill="none" stroke="#34d399" strokeWidth="8" />
      <path d={`M ${bx} ${by} A ${GA_R} ${GA_R} 0 0 1 ${cx} ${cy}`} fill="none" stroke="#fbbf24" strokeWidth="8" />
      <path d={`M ${cx} ${cy} A ${GA_R} ${GA_R} 0 0 1 ${dx} ${dy}`} fill="none" stroke="#fb7185" strokeWidth="8" />
      <text x={gaPt(-58, 66)[0] + 2} y={gaPt(-58, 66)[1] + 3} textAnchor="start" fontSize="8" fill="#6ee7b7">
        오르막
      </text>
      <text x={gaPt(0, 66)[0] + 2} y={gaPt(0, 66)[1] + 3} textAnchor="start" fontSize="8" fill="#fcd34d">
        평평
      </text>
      <text x={gaPt(58, 66)[0] + 2} y={gaPt(58, 66)[1] + 3} textAnchor="start" fontSize="8" fill="#fda4af">
        내리막
      </text>
      <line x1={GA_CX} y1={GA_CY} x2={nx} y2={ny} stroke="#e2e8f0" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx={GA_CX} cy={GA_CY} r="5.5" fill="#0b1220" stroke="#e2e8f0" strokeWidth="2.5" />
      <text
        x="75"
        y="150"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill={STROKE_COLOR[tone === "flat" ? "ghost" : tone]}
      >
        {word}
      </text>
    </svg>
  );
}

/**
 * 차창 뷰의 움직임
 *  · TIE_N  한 화면에 둘 침목 수,  TIE_K  원근 세기(클수록 완만)
 *  · TIE_FLOW  코스를 한 번 달리는 동안 지나가는 침목 수
 * 먼 산과 구름은 좌우로 흐르지 않는다(산만해진다) — 수평선을 따라 위아래로만 움직인다.
 */
const TIE_N = 12;
const TIE_K = 1.5;
const TIE_FLOW = 11;

/** 깊이 d 를 화면 비율 e 로 — d 가 0 에 가까울수록(가까울수록) 화면 아래로 온다 */
const depthToE = (d: number): number => d / (d + TIE_K);

const RAIL_COLOR: Record<"up" | "down" | "flat", string> = {
  up: "#34d399",
  down: "#fb7185",
  flat: "#fbbf24",
};
const BED_COLOR: Record<"up" | "down" | "flat", string> = {
  up: "rgba(52,211,153,0.16)",
  down: "rgba(251,113,133,0.16)",
  flat: "rgba(251,191,36,0.16)",
};

/**
 * 카트에서 본 앞쪽.
 * 카트는 트랙 위에 있으므로 트랙의 소실점은 늘 화면 한가운데(정면)에 고정되고,
 * 대신 '수평선' 이 오르막에서는 아래로, 내리막에서는 위로 움직인다.
 * 그래서 트랙이 수평선 위를 향하면 오르막, 아래를 향하면 내리막으로 읽힌다.
 * travel(0~1, 지나온 트랙의 길이)이 늘면 침목이 앞으로 다가온다.
 */
function CabView({ deg, tone, travel }: { deg: number; tone: "up" | "down" | "flat"; travel: number }) {
  const VX = 120;
  const VY = 74;
  const pitch = -deg; // 화면 각도는 오르막일 때 음수다
  const h = Math.max(-40, Math.min(190, VY + pitch * 0.72));
  const rail = RAIL_COLOR[tone];

  const flow = ((travel * TIE_FLOW) % 1 + 1) % 1;
  const ties = [];
  for (let i = 0; i < TIE_N; i++) ties.push(depthToE(i + 1 - flow));

  return (
    <svg viewBox="0 0 240 158" className="w-full max-w-[300px]" role="img" aria-label="카트에서 본 앞쪽 풍경">
      <defs>
        <clipPath id="ex-cab">
          <rect x="10" y="10" width="220" height="128" rx="7" />
        </clipPath>
      </defs>

      <g clipPath="url(#ex-cab)">
        {/* 하늘과 땅 — 수평선이 움직이면 둘의 넓이가 바뀐다 */}
        <rect x="10" y="-60" width="220" height={Math.max(0, h + 60)} fill="#0a1426" />
        <rect x="10" y={h} width="220" height={Math.max(0, 200 - h)} fill="#1c2639" />

        {/* 구름 — 제자리에서 수평선을 따라 오르내린다 */}
        <g fill="rgba(148,163,184,0.22)">
          <ellipse cx="58" cy={h - 54} rx="15" ry="6" />
          <ellipse cx="70" cy={h - 59} rx="11" ry="6" />
          <ellipse cx="182" cy={h - 38} rx="13" ry="5" />
          <ellipse cx="192" cy={h - 42} rx="9" ry="5" />
        </g>

        {/* 먼 산 — 수평선 위에 얹혀 함께 오르내린다 */}
        <path
          d={
            `M 4 ${h + 70} L 4 ${h} L 32 ${h - 16} L 58 ${h - 4} L 88 ${h - 22} L 116 ${h - 7}` +
            ` L 152 ${h - 19} L 184 ${h - 5} L 212 ${h - 14} L 236 ${h} L 236 ${h + 70} Z`
          }
          fill="#27354c"
        />

        {/* 수평선 */}
        <line x1="10" y1={h} x2="230" y2={h} stroke="rgba(226,232,240,0.55)" strokeWidth="1.4" strokeDasharray="5 4" />
        <text x="226" y={h - 5} textAnchor="end" fontSize="8" fill="#94a3b8">
          수평선
        </text>

        {/* 트랙 — 소실점은 늘 정면에 고정되고 침목만 앞으로 다가온다 */}
        <polygon points={`58,146 182,146 ${VX},${VY}`} fill={BED_COLOR[tone]} />
        {ties.map((e, i) => (
          <line
            key={i}
            x1={58 + (VX - 58) * e}
            y1={146 + (VY - 146) * e}
            x2={182 + (VX - 182) * e}
            y2={146 + (VY - 146) * e}
            stroke="#cbd5e1"
            strokeOpacity={0.25 + 0.55 * (1 - e)}
            strokeWidth={3.2 * (1 - e) + 0.4}
          />
        ))}
        <line x1="58" y1="146" x2={VX} y2={VY} stroke={rail} strokeWidth="3.2" strokeLinecap="round" />
        <line x1="182" y1="146" x2={VX} y2={VY} stroke={rail} strokeWidth="3.2" strokeLinecap="round" />
        <circle cx={VX} cy={VY} r="3" fill={rail} />
      </g>

      {/* 창틀과 카트 앞머리 — 화면에 고정 */}
      <rect x="10" y="10" width="220" height="128" rx="7" fill="none" stroke="rgba(255,255,255,0.14)" />
      <path d="M 44 138 L 196 138 L 176 118 L 64 118 Z" fill="#334155" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
      <circle cx="78" cy="128" r="4" fill="#fde68a" />
      <circle cx="162" cy="128" r="4" fill="#fde68a" />
      <rect x="6" y="6" width="228" height="146" rx="12" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      <text x="120" y="152" textAnchor="middle" fontSize="9" fill="#64748b">
        카트에서 본 앞쪽
      </text>
    </svg>
  );
}

function RideTab() {
  const [ci, setCi] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [runs, setRuns] = useState<Record<string, number>>({});
  const [picks, setPicks] = useState<Record<string, FlagKind>>({});
  const tRef = useRef(0);

  const c = COURSES[ci];
  const span = c.to - c.from;
  const x = Number((c.from + t * span).toFixed(3));
  const y = c.fn(x);
  const slope = c.d1(x);
  const lean = LEAN_WORD(slope);
  const run = runs[c.id] ?? 0;
  const seenHi = c.from + run * span;
  const cleared = run >= 0.999;

  const cid = c.id;
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const nv = Math.min(1, tRef.current + 0.006);
      tRef.current = nv;
      setT(nv);
      setRuns((r) => ({ ...r, [cid]: Math.max(r[cid] ?? 0, nv) }));
      if (nv >= 1) setPlaying(false);
    }, 28);
    return () => window.clearInterval(id);
  }, [playing, cid]);

  const toned: TonedSeg[] = tonedPath(c.fn, c.d1, c.from, Math.max(c.from, seenHi));
  const segs: PlotSeg[] = [
    ...ghost(samplePath(c.fn, c.from, c.to, c.box)),
    ...toned.map((s) => ({ tone: s.tone as Stroke, pts: s.pts })),
  ];
  const dots: PlotDot[] = cleared
    ? c.flags.map((fg) => ({
        x: fg.x,
        y: fg.y,
        tone: (picks[fg.id] === fg.kind ? fg.kind : "none") as DotTone,
        label: picks[fg.id] === fg.kind ? FLAG_EMOJI[fg.kind] : "?",
      }))
    : [];

  const allFlags = COURSES.flatMap((z) => z.flags);
  const okFlags = allFlags.filter((fg) => picks[fg.id] === fg.kind).length;
  const goals = [
    cleared,
    cleared && c.flags.every((fg) => picks[fg.id] === fg.kind),
    COURSES.every((z) => (runs[z.id] ?? 0) >= 0.999),
  ];

  const screenDeg = screenSlopeDeg(c.box, slope);
  const travel = arcRatio(c.d1, c.from, c.to, x);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {COURSES.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === ci}
            accent="amber"
            onClick={() => {
              setCi(i);
              setT(0);
              tRef.current = 0;
              setPlaying(false);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
            {(runs[z.id] ?? 0) >= 0.999 ? <span className="ml-1 text-emerald-300">완주</span> : null}
          </PickButton>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="mb-1 text-center text-sm font-bold text-amber-200">
            <Katex expr={c.tex} />
          </p>
          <Plot
            box={c.box}
            uid={`ride-${c.id}`}
            segs={segs}
            dots={dots}
            vlines={[{ at: x, tone: "guide" }]}
            cart={{ x, y, slope, text: "🛷" }}
            axis={["x", "f(x)"]}
          />
          <p className="mt-1 text-center font-mono text-[11px] text-slate-400">
            x = {fmt(x)} · 높이 = {fmt(y, 3)}
          </p>
        </div>

        <div className="space-y-3">
          <div className={"grid gap-3 rounded-2xl border-2 p-3 sm:grid-cols-[minmax(0,1fr)_150px] " + LEAN_PANEL[lean.tone]}>
            <div className="flex flex-col items-center justify-center gap-1">
              <CabView deg={screenDeg} tone={lean.tone} travel={travel} />
              <p className={"text-center text-xs font-bold leading-5 " + LEAN_TEXT[lean.tone]}>{lean.cab}</p>
            </div>
            <div className="flex items-center justify-center">
              <Gauge deg={screenDeg} word={lean.word} tone={lean.tone} />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!playing && t >= 1) {
                    tRef.current = 0;
                    setT(0);
                  }
                  setPlaying(!playing);
                }}
                className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition " + ACC_BTN.amber}
              >
                {playing ? "⏸ 멈춤" : t >= 1 ? "↩️ 처음부터" : "▶ 출발"}
              </button>
              <span className="font-mono text-xs text-slate-400">완주 {Math.round(run * 100)}%</span>
              {cleared ? <span className="text-xs font-bold text-emerald-300">🏁 깃발 자리가 드러났어요</span> : null}
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.002}
              value={t}
              onChange={(e) => {
                const v = Number(e.target.value);
                tRef.current = v;
                setT(v);
                setPlaying(false);
                setRuns((r) => ({ ...r, [c.id]: Math.max(r[c.id] ?? 0, v) }));
              }}
              className={"mt-3 " + RANGE_BASE + ACC_RANGE.amber}
            />
          </div>

          {cleared ? (
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-bold text-slate-300">🚩 드러난 자리를 분류하세요</p>
              {c.flags.map((fg) => {
                const pick = picks[fg.id];
                const ok = pick === fg.kind;
                return (
                  <div key={fg.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="font-mono text-xs text-slate-300">
                      x = {fmt(fg.x)} , 높이 = {fmt(fg.y)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(["max", "min", "none"] as FlagKind[]).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setPicks((z) => ({ ...z, [fg.id]: k }))}
                          className={
                            "rounded-lg border-2 px-2.5 py-1 text-[11px] font-bold transition " +
                            (pick === k
                              ? k === fg.kind
                                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                                : "border-rose-400/60 bg-rose-400/15 text-rose-100"
                              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                          }
                        >
                          {FLAG_EMOJI[k]} {FLAG_LABEL[k]}
                        </button>
                      ))}
                    </div>
                    {pick ? <div className="mt-2"><Verdict ok={ok}>{ok ? fg.why : "다시 생각해 보세요. 이 자리 앞뒤로 오르막·내리막이 어떻게 바뀌었나요?"}</Verdict></div> : null}
                  </div>
                );
              })}
              <TipBox>{c.note}</TipBox>
            </div>
          ) : (
            <TipBox>출발 단추를 누르거나 손잡이를 끝까지 끌어 코스를 완주하면 깃발 자리가 드러나요.</TipBox>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 flex items-center justify-between text-xs font-bold text-slate-300">
              <span>🎯 미션</span>
              <span className="font-mono text-slate-400">
                바르게 분류 {okFlags} / {allFlags.length}
              </span>
            </p>
            <GoalList items={RIDE_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner
        steps={RIDE_STEPS}
        accent="amber"
        finale="트랙이 평평해지는 자리는 정상·골짜기의 후보일 뿐이에요. 앞뒤로 방향이 실제로 바뀌어야 깃발을 꽂을 수 있어요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 돋보기 창
// ══════════════════════════════════════════════════════════════
const LENS_STEP = 0.05;

function LensTab() {
  const [li, setLi] = useState(0);
  const [aIdx, setAIdx] = useState(20);
  const [wIdx, setWIdx] = useState(30);
  const [marks, setMarks] = useState<Record<string, FlagKind>>({});
  const [sawBreak, setSawBreak] = useState(false);
  const [sawNone, setSawNone] = useState(false);

  const g = LENS_FNS[li];
  const aLo = g.from + g.aPad;
  const aHi = g.to - g.aPad;
  const aMax = Math.round((aHi - aLo) / LENS_STEP);
  const a = Number((aLo + Math.min(aIdx, aMax) * LENS_STEP).toFixed(2));
  const w = Number((wIdx / 10).toFixed(1));
  const fa = g.fn(a);
  const st = windowStat(g.fn, g.from, g.to, a, w);
  const topY = g.fn(g.topX);
  const botY = g.fn(g.botX);

  const spot = g.spots.find((s) => Math.abs(s.x - a) < 1e-9);
  const key = `${g.id}:${fmt(a)}`;
  const mark = marks[key];

  // 판정이 성립한 순간을 기록한다 (렌더 중이 아니라 손잡이를 움직일 때)
  const remember = (nextA: number, nextW: number) => {
    const s2 = windowStat(g.fn, g.from, g.to, nextA, nextW);
    const k2 = `${g.id}:${fmt(nextA)}`;
    const sp = g.spots.find((s) => Math.abs(s.x - nextA) < 1e-9);
    if (s2.isMax && !s2.isMin) setMarks((z) => (z[k2] === "max" ? z : { ...z, [k2]: "max" }));
    else if (s2.isMin && !s2.isMax) setMarks((z) => (z[k2] === "min" ? z : { ...z, [k2]: "min" }));
    if (sp?.kind === "max" && !s2.isMax) setSawBreak(true);
    if (sp?.kind === "none" && nextW <= 0.4 && !s2.isMax && !s2.isMin) setSawNone(true);
  };

  const found = (k: FlagKind) =>
    LENS_FNS.some((z) =>
      z.spots.some((s) => s.kind === k && marks[`${z.id}:${fmt(s.x)}`] === k),
    );
  const goals = [found("max"), found("min"), sawBreak, sawNone];

  const segs: PlotSeg[] = [
    ...ghost(samplePath(g.fn, g.from, g.to, g.box)),
    ...samplePath(g.fn, st.wLo, st.wHi, g.box).map((pts) => ({ tone: "line" as Stroke, pts })),
  ];
  const dots: PlotDot[] = [
    { x: a, y: fa, tone: "live", label: "a" },
    { x: g.topX, y: topY, tone: "max", filled: false },
    { x: g.botX, y: botY, tone: "min", filled: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {LENS_FNS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === li}
            accent="violet"
            onClick={() => {
              setLi(i);
              setAIdx(Math.round((z.to - z.from - 2 * z.aPad) / LENS_STEP / 2));
              setWIdx(30);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
          </PickButton>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="mb-1 text-center text-sm font-bold text-violet-200">
            <Katex expr={g.tex} />
          </p>
          <Plot
            box={g.box}
            uid={`lens-${g.id}`}
            segs={segs}
            dots={dots}
            shades={[{ from: st.wLo, to: st.wHi, tone: "lens" }]}
            hlines={[
              { at: fa, tone: "hot" },
              { at: st.hi, tone: "guide" },
              { at: st.lo, tone: "guide" },
            ]}
            vlines={[{ at: a, tone: "guide" }]}
            axis={["x", "f(x)"]}
          />
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-violet-400/25 bg-violet-500/[0.06] p-4">
            <div className="space-y-3">
              <div>
                <p className="mb-1 flex justify-between text-xs font-bold text-slate-300">
                  <span>자리 a</span>
                  <span className="font-mono text-slate-100">a = {fmt(a)}</span>
                </p>
                <input
                  type="range"
                  min={0}
                  max={aMax}
                  step={1}
                  value={Math.min(aIdx, aMax)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setAIdx(v);
                    remember(Number((aLo + v * LENS_STEP).toFixed(2)), w);
                  }}
                  className={RANGE_BASE + ACC_RANGE.violet}
                />
              </div>
              <div>
                <p className="mb-1 flex justify-between text-xs font-bold text-slate-300">
                  <span>창의 반폭 w</span>
                  <span className="font-mono text-slate-100">
                    ({fmt(st.wLo)}, {fmt(st.wHi)}) · w = {fmt(w)}
                  </span>
                </p>
                <input
                  type="range"
                  min={LENS_W_MIN * 10}
                  max={LENS_W_MAX * 10}
                  step={1}
                  value={wIdx}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setWIdx(v);
                    remember(a, Number((v / 10).toFixed(1)));
                  }}
                  className={RANGE_BASE + ACC_RANGE.violet}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div
              className={
                "rounded-2xl border-2 p-3 text-center " +
                (st.isMax ? "border-amber-400/55 bg-amber-400/[0.12]" : "border-white/10 bg-white/[0.03]")
              }
            >
              <p className="text-[11px] text-slate-400">창 안에서 가장 높은 값</p>
              <p className="font-mono text-lg font-black text-slate-100">{fmt(st.hi, 3)}</p>
              <p className={"mt-1 text-xs font-bold " + (st.isMax ? "text-amber-200" : "text-slate-500")}>
                {st.isMax ? "✅ f(a) 가 창 안 최고예요" : "f(a) 보다 높은 곳이 창 안에 있어요"}
              </p>
            </div>
            <div
              className={
                "rounded-2xl border-2 p-3 text-center " +
                (st.isMin ? "border-sky-400/55 bg-sky-400/[0.12]" : "border-white/10 bg-white/[0.03]")
              }
            >
              <p className="text-[11px] text-slate-400">창 안에서 가장 낮은 값</p>
              <p className="font-mono text-lg font-black text-slate-100">{fmt(st.lo, 3)}</p>
              <p className={"mt-1 text-xs font-bold " + (st.isMin ? "text-sky-200" : "text-slate-500")}>
                {st.isMin ? "✅ f(a) 가 창 안 최저예요" : "f(a) 보다 낮은 곳이 창 안에 있어요"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="font-mono text-sm text-slate-200">
              f({fmt(a)}) = {fmt(fa, 3)}
            </p>
            <p className="mt-1 text-sm font-bold">
              {mark === "max" ? (
                <span className="text-amber-200">🚩 x = {fmt(a)} 에서 극대 · 극댓값 {fmt(fa, 3)}</span>
              ) : mark === "min" ? (
                <span className="text-sky-200">⛳ x = {fmt(a)} 에서 극소 · 극솟값 {fmt(fa, 3)}</span>
              ) : spot?.kind === "none" ? (
                <span className="text-slate-300">🪧 평평해도 창 안 최고도 최저도 아니에요 — 극값이 아니에요</span>
              ) : (
                <span className="text-slate-400">창을 좁혀 가며 최고나 최저가 되는 자리를 찾아보세요</span>
              )}
            </p>
            <p className="mt-2 font-mono text-[11px] text-slate-400">
              구간 전체의 최댓값 {fmt(topY, 3)} (x = {fmt(g.topX)}) · 최솟값 {fmt(botY, 3)} (x = {fmt(g.botX)})
            </p>
          </div>

          <TipBox>{g.note}</TipBox>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={LENS_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner
        steps={LENS_STEPS}
        accent="violet"
        finale="극대·극소는 '어떤 열린구간' 안에서만 가장 높거나 낮으면 되는 자리예요. 구간 전체의 최대·최소와는 다른 말이에요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 경사계와 증감표
// ══════════════════════════════════════════════════════════════
const SLOPE_STEP = 0.05;

function SignBar({ box, from, to, seenHi, d1, uid }: { box: Box; from: number; to: number; seenHi: number; d1: (x: number) => number; uid: string }) {
  const pw = PS - PML - PMR;
  const X = (v: number) => PML + ((v - box.xMin) / (box.xMax - box.xMin)) * pw;
  const n = 180;
  const cells: { x0: number; x1: number; sign: number }[] = [];
  const hi = Math.min(to, seenHi);
  for (let i = 0; i < n; i++) {
    const x0 = from + ((hi - from) * i) / n;
    const x1 = from + ((hi - from) * (i + 1)) / n;
    if (x1 <= x0) continue;
    cells.push({ x0, x1, sign: d1((x0 + x1) / 2) > 0 ? 1 : -1 });
  }
  return (
    <svg viewBox={`0 0 ${PS} 34`} className="w-full" role="img" aria-label="도함수의 부호 띠" data-uid={uid}>
      <rect x={PML} y={8} width={pw} height={16} rx="4" fill="#0b1220" stroke="rgba(255,255,255,0.12)" />
      {cells.map((c, i) => (
        <rect
          key={i}
          x={X(c.x0)}
          y={8}
          width={Math.max(0.6, X(c.x1) - X(c.x0))}
          height={16}
          fill={c.sign > 0 ? "rgba(52,211,153,0.55)" : "rgba(251,113,133,0.55)"}
        />
      ))}
      <text x={PML - 4} y={20} textAnchor="end" fontSize="8" fill="#64748b">
        f&apos;
      </text>
    </svg>
  );
}

function SlopeTab() {
  const [si, setSi] = useState(0);
  const [xIdx, setXIdx] = useState(0);
  const [seen, setSeen] = useState<Record<string, number>>({});

  const s = SLOPE_FNS[si];
  const nMax = Math.round((s.to - s.from) / SLOPE_STEP);
  const x = Number((s.from + Math.min(xIdx, nMax) * SLOPE_STEP).toFixed(2));
  const y = s.fn(x);
  const d = s.d1(x);
  const lean = LEAN_WORD(d);
  const seenHi = Math.max(s.from, seen[s.id] ?? s.from);
  const ratio = Math.min(1, (seenHi - s.from) / (s.to - s.from));
  const full = ratio >= 0.995;

  const toned = tonedPath(s.fn, s.d1, s.from, seenHi);
  const segs: PlotSeg[] = [
    ...ghost(samplePath(s.fn, s.from, s.to, s.box)),
    ...toned.map((z) => ({ tone: z.tone as Stroke, pts: z.pts })),
  ];
  const dots: PlotDot[] = [{ x, y, tone: "live" }];
  for (const c of s.crits) {
    if (c.x <= seenHi + 1e-9) dots.push({ x: c.x, y: c.y, tone: c.kind as DotTone, label: FLAG_EMOJI[c.kind] });
  }

  const dSegs: PlotSeg[] = samplePath(s.d1, s.from, s.to, s.dbox).map((pts) => ({ tone: "deriv" as Stroke, pts }));
  const dDots: PlotDot[] = [{ x, y: d, tone: "live" }];
  for (const c of s.crits) {
    if (c.x <= seenHi + 1e-9) dDots.push({ x: c.x, y: 0, tone: "zero", filled: false });
  }

  const cells = signCells(s);
  const cuts = [s.from, ...s.crits.map((c) => c.x), s.to];
  const goals = [
    full,
    SLOPE_FNS.some((z) => z.crits.length > 0 && (seen[z.id] ?? z.from) >= z.to - 1e-6),
    SLOPE_FNS.every((z) => (seen[z.id] ?? z.from) >= z.to - 1e-6),
  ];

  const half = (s.box.xMax - s.box.xMin) * 0.11;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SLOPE_FNS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === si}
            accent="emerald"
            onClick={() => {
              setSi(i);
              setXIdx(0);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
          </PickButton>
        ))}
      </div>

      <div className="space-y-3">
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-4">
            <p className="mb-1 flex justify-between text-xs font-bold text-slate-300">
              <span>접선을 끌어 보세요</span>
              <span className="font-mono text-slate-100">
                {s.xName} = {fmt(x)}
              </span>
            </p>
            <input
              type="range"
              min={0}
              max={nMax}
              step={1}
              value={Math.min(xIdx, nMax)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setXIdx(v);
                const nx = s.from + v * SLOPE_STEP;
                setSeen((z) => ({ ...z, [s.id]: Math.max(z[s.id] ?? s.from, nx) }));
              }}
              className={RANGE_BASE + ACC_RANGE.emerald}
            />
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-2 w-full" role="img" aria-label="탐사율">
                  <rect x="0" y="0" width={ratio * 100} height="8" fill="#34d399" />
                </svg>
              </div>
              <span className="font-mono text-xs text-slate-400">탐사율 {Math.round(ratio * 100)}%</span>
            </div>
          </div>

          <div className={"grid gap-2 rounded-2xl border-2 p-3 sm:grid-cols-3 " + LEAN_PANEL[lean.tone]}>
            <div className="text-center">
              <p className="text-[11px] text-slate-400">접선의 기울기</p>
              <p className="font-mono text-lg font-black text-slate-100">{fmt(d, 2)}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-slate-400">부호</p>
              <p className={"text-lg font-black " + LEAN_TEXT[lean.tone]}>{d > 0.0001 ? "+" : d < -0.0001 ? "-" : "0"}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-slate-400">그래프</p>
              <p className={"text-lg font-black " + LEAN_TEXT[lean.tone]}>
                {lean.tone === "up" ? "증가 ↗" : lean.tone === "down" ? "감소 ↘" : "평평 →"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-center text-sm font-bold text-emerald-200">
                <Katex expr={s.tex} />
              </p>
              <div className="mx-auto w-4/5">
                <Plot
                  box={s.box}
                  uid={`slope-${s.id}`}
                  segs={segs}
                  dots={dots}
                  shades={[{ from: s.from, to: seenHi, tone: "seen" }]}
                  vlines={[{ at: x, tone: "guide" }]}
                  tangent={{ x, y, slope: d, half }}
                  axis={[s.xName, s.yName]}
                />
                <SignBar box={s.box} from={s.from} to={s.to} seenHi={seenHi} d1={s.d1} uid={s.id} />
              </div>
              <p className="text-center text-[11px] leading-5 text-slate-400">
                노란 접선을 끌면 그래프가 오르막(초록) · 내리막(분홍)으로 칠해져요.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-center text-sm font-bold text-violet-200">
                <Katex expr={s.dtex} />
              </p>
              <div className="mx-auto w-4/5">
                <Plot
                  box={s.dbox}
                  uid={`slope-d-${s.id}`}
                  segs={dSegs}
                  dots={dDots}
                  vlines={[{ at: x, tone: "guide" }]}
                  hlines={[{ at: 0, tone: "hot", dash: false }]}
                  axis={[s.xName, "f'(x)"]}
                />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 py-1">
                <span className="rounded-lg border-2 border-emerald-400/60 bg-emerald-400/15 px-2 py-0.5 text-[11px] font-bold text-emerald-100">
                  x축 위 = f&apos; &gt; 0 = 증가
                </span>
                <span className="rounded-lg border-2 border-rose-400/60 bg-rose-400/15 px-2 py-0.5 text-[11px] font-bold text-rose-100">
                  x축 아래 = f&apos; &lt; 0 = 감소
                </span>
              </div>
              <p className="text-center text-[11px] leading-5 text-slate-400">
                점이 x축을 가로지르는 곳이 바로 극값 자리예요.
              </p>
            </div>
          </div>

          {full ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="mb-2 text-sm font-bold text-emerald-200">📋 증감표가 완성됐어요</p>
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <table className="w-full min-w-[480px] border-collapse text-center text-base">
                  <tbody>
                    <tr className="border-b border-white/10">
                      <th className="border-r border-white/10 px-3 py-2 font-mono font-bold text-slate-400">{s.xName}</th>
                      {cuts.map((c, i) => (
                        <ColPair
                          key={`x${i}`}
                          head={fmt(c)}
                          tail={i < cells.length ? "⋯" : undefined}
                          headClass="font-mono font-bold text-slate-100"
                          tailClass="text-slate-500"
                        />
                      ))}
                    </tr>
                    <tr className="border-b border-white/10">
                      <th className="border-r border-white/10 px-3 py-2 font-mono font-bold text-slate-400">f&apos;</th>
                      {cuts.map((c, i) => {
                        const isCrit = s.crits.some((z) => Math.abs(z.x - c) < 1e-9);
                        const sign = i < cells.length ? cells[i].sign : undefined;
                        return (
                          <ColPair
                            key={`d${i}`}
                            head={isCrit ? "0" : ""}
                            tail={sign === undefined ? undefined : sign > 0 ? "+" : "-"}
                            headClass="font-mono font-bold text-violet-200"
                            tailClass={sign === undefined ? "" : sign > 0 ? "text-lg font-black text-emerald-300" : "text-lg font-black text-rose-300"}
                          />
                        );
                      })}
                    </tr>
                    <tr>
                      <th className="border-r border-white/10 px-3 py-2 font-mono font-bold text-slate-400">{s.yName}</th>
                      {cuts.map((c, i) => {
                        const crit = s.crits.find((z) => Math.abs(z.x - c) < 1e-9);
                        const sign = i < cells.length ? cells[i].sign : undefined;
                        return (
                          <ColPair
                            key={`y${i}`}
                            head={crit ? `${fmt(crit.y)}` : fmt(s.fn(c))}
                            sub={crit ? (crit.kind === "max" ? "극대" : "극소") : undefined}
                            tail={sign === undefined ? undefined : sign > 0 ? "↗" : "↘"}
                            headClass={
                              crit
                                ? crit.kind === "max"
                                  ? "font-mono font-bold text-amber-200"
                                  : "font-mono font-bold text-sky-200"
                                : "font-mono text-slate-300"
                            }
                            tailClass={sign === undefined ? "" : sign > 0 ? "text-lg text-emerald-300" : "text-lg text-rose-300"}
                          />
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-center text-sm leading-6 text-slate-300">
                {s.crits.length === 0
                  ? "부호가 한 번도 바뀌지 않았어요 — 극값이 없습니다."
                  : `부호가 바뀌는 자리가 ${s.crits.length} 곳 — 그 자리마다 극값이 생겨요.`}
              </p>
            </div>
          ) : (
            <TipBox>손잡이를 오른쪽 끝까지 끌면 부호 띠가 모두 칠해지고 증감표가 완성돼요.</TipBox>
          )}

          <TipBox>{s.note}</TipBox>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={SLOPE_GOALS} done={goals} />
          </div>
      </div>

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">{REAL_NOTE}</p>

      <StepRunner
        steps={SLOPE_STEPS}
        accent="emerald"
        finale="f' 의 부호만 읽으면 증가·감소가 가려지고, 부호가 바뀌는 자리에서 극값이 생겨요. 정의를 일일이 따지지 않아도 됩니다."
      />
    </div>
  );
}

function ColPair({
  head,
  sub,
  tail,
  headClass,
  tailClass,
}: {
  head: string;
  sub?: string;
  tail?: string;
  headClass: string;
  tailClass: string;
}) {
  return (
    <>
      <td className={"px-3 py-2 " + headClass}>
        {head}
        {sub ? <span className="ml-1 text-xs font-bold">{sub}</span> : null}
      </td>
      {tail !== undefined ? <td className={"px-4 py-2 " + tailClass}>{tail}</td> : null}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ 평평한 자리 분류소
// ══════════════════════════════════════════════════════════════
const SIGN_CHIP: Record<"plus" | "minus", string> = {
  plus: "border-emerald-400/60 bg-emerald-400/15 text-emerald-100",
  minus: "border-rose-400/60 bg-rose-400/15 text-rose-100",
};

function FlatTab() {
  const [picks, setPicks] = useState<Record<string, FlagKind>>({});
  const [probes, setProbes] = useState<Record<string, boolean>>({});

  const okCount = FLAT_CARDS.filter((c) => picks[c.id] === c.kind).length;
  const allOk = okCount === FLAT_CARDS.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] p-4">
        <p className="text-sm font-bold text-rose-100">
          🔍 여덟 자리 모두 f&apos;(a) = 0 이에요. 그런데 판정은 같지 않아요.
        </p>
        <span className="font-mono text-xs text-slate-300">
          바르게 분류 {okCount} / {FLAT_CARDS.length}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {FLAT_CARDS.map((c) => {
          const pick = picks[c.id];
          const ok = pick === c.kind;
          const open = probes[c.id] === true;
          const lv = c.d1(c.a - FLAT_PROBE);
          const rv = c.d1(c.a + FLAT_PROBE);
          const dots: PlotDot[] = [{ x: c.a, y: c.fn(c.a), tone: pick ? (ok ? (c.kind as DotTone) : "none") : "live" }];
          if (open) {
            dots.push({ x: c.a - FLAT_PROBE, y: c.fn(c.a - FLAT_PROBE), tone: "pair", filled: false });
            dots.push({ x: c.a + FLAT_PROBE, y: c.fn(c.a + FLAT_PROBE), tone: "pair", filled: false });
          }
          const halfT = (c.box.xMax - c.box.xMin) * 0.16;
          return (
            <div key={c.id} className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-200">
                  <span className="mr-1">{c.emoji}</span>
                  {c.title}
                </p>
                <p className="font-mono text-[11px] text-slate-400">
                  a = {fmt(c.a)} , f(a) = {fmt(c.fn(c.a), 2)}
                </p>
              </div>
              <p className="text-center text-xs font-bold text-slate-300">
                <Katex expr={c.tex} />
              </p>
              <Plot
                box={c.box}
                uid={`flat-${c.id}`}
                compact
                segs={samplePath(c.fn, c.box.xMin, c.box.xMax, c.box).map((pts) => ({ tone: "line" as Stroke, pts }))}
                dots={dots}
                tangent={{ x: c.a, y: c.fn(c.a), slope: 0, half: halfT }}
                vlines={[{ at: c.a, tone: "guide" }]}
              />

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setProbes((z) => ({ ...z, [c.id]: !z[c.id] }))}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                >
                  🔍 좌우 부호 {open ? "숨기기" : "보기"}
                </button>
                {open ? (
                  <>
                    <span className={"rounded-lg border-2 px-2 py-1 font-mono text-[11px] font-bold " + SIGN_CHIP[lv > 0 ? "plus" : "minus"]}>
                      왼쪽 f&apos; = {fmt(lv, 2)}
                    </span>
                    <span className={"rounded-lg border-2 px-2 py-1 font-mono text-[11px] font-bold " + SIGN_CHIP[rv > 0 ? "plus" : "minus"]}>
                      오른쪽 f&apos; = {fmt(rv, 2)}
                    </span>
                  </>
                ) : null}
              </div>

              <div className="flex flex-wrap justify-center gap-1.5">
                {(["max", "min", "none"] as FlagKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPicks((z) => ({ ...z, [c.id]: k }))}
                    className={
                      "rounded-lg border-2 px-2.5 py-1 text-[11px] font-bold transition " +
                      (pick === k
                        ? k === c.kind
                          ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                          : "border-rose-400/60 bg-rose-400/15 text-rose-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                    }
                  >
                    {FLAG_EMOJI[k]} {FLAG_LABEL[k]}
                  </button>
                ))}
              </div>

              <div className="min-h-[34px]">
                {pick ? <Verdict ok={ok}>{ok ? c.why : "좌우 부호를 열어 보세요. 부호가 바뀌었나요, 그대로였나요?"}</Verdict> : null}
              </div>
            </div>
          );
        })}
      </div>

      {allOk ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-sm font-bold text-emerald-100">🎉 여덟 자리를 모두 분류했어요!</p>
          <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-slate-200">
            극대 3 곳 · 극소 3 곳 · 극값 아님 2 곳이었어요. f&apos;(a) = 0 은 극값이 되기 위해 꼭 필요하지만 그것만으로는
            모자라요. a 의 좌우에서 f&apos; 의 부호가 실제로 바뀌어야 극값이 됩니다.
          </p>
        </div>
      ) : null}

      <StepRunner
        steps={FLAT_STEPS}
        accent="rose"
        finale="'f'(x) > 0 이면 증가' 는 참이지만 그 역은 거짓이고, 'f'(a) = 0 이면 극값' 도 거짓이에요. 부호가 바뀌는지까지 봐야 해요."
      />
    </div>
  );
}
