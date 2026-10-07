"use client";

import { useEffect, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CARD_BOX,
  CARD_GOALS,
  CARD_STEPS,
  CARD_TARGETS,
  CARD_XS,
  COEF_RANGE,
  DETECT_GOALS,
  DETECT_QS,
  DETECT_STEPS,
  FACTORY_FNS,
  FACTORY_GOALS,
  FACTORY_STEPS,
  FLAG_EMOJI,
  FLAG_LABEL,
  MATCH_GOALS,
  MATCH_ITEMS,
  MATCH_LEFT_ORDER,
  MATCH_RIGHT_ORDER,
  MATCH_STEPS,
  TOOL_MISSIONS,
  TOOL_PRESETS,
  TOOL_STEPS,
  VIEW_GAP,
  VIEW_MAX,
  VIEW_MIN,
  cardKinds,
  critPoints,
  derivPoly,
  evalPoly,
  factorTex,
  fitBox,
  flatPoints,
  fmt,
  missionDone,
  parsePoly,
  polyDegree,
  polySrc,
  polyTex,
  samplePath,
  signCells,
  sketchCurve,
  type Box,
  type FlagKind,
  type Piece,
  type Poly,
  type Sign,
  type Step,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_second_step",
    prompt:
      "②의 개형 공장에서 네 단계를 직접 밟아 보았어요. f′(x) = 0 인 x 를 먼저 구하는 까닭을 자기 말로 쓰고, 그것만으로는 왜 극값인지 알 수 없는지도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 방향이 바뀌려면 f′ 가 0 을 지나야 하니까 바뀔 수 있는 자리를 먼저 모은 것이다. 하지만 0 이 되었다가 다시 같은 부호로 돌아가면 잠깐 평평할 뿐이라, 좌우 부호를 적어 봐야 극대·극소가 가려진다.",
  },
  {
    id: "table_tells",
    prompt:
      "①과 ④에서는 식 없이 증감표(부호)만 보고 개형을 가려내고 그려 보았어요. 증감표가 알려 주는 것과 알려 주지 않는 것을 나누어 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 어디서 올라가고 내려가는지, 극값이 몇 개 어디에 있는지는 알려 준다. 하지만 그래프가 x 축과 몇 번 만나는지나 정확한 모양은 알려 주지 않는다. ④에서 같은 부호라도 곡선을 위아래로 옮길 수 있었다.",
  },
  {
    id: "tool_vs_hand",
    prompt:
      "③의 공학도구는 식만 넣으면 그래프와 특징점을 바로 보여 주었어요. 그런데도 손으로 증감표를 만들어 보는 것이 어떤 점에서 도움이 되었는지, 도구를 쓰면 좋은 때는 언제인지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 도구는 결과만 보여 주는데 증감표를 만들면 왜 거기서 꺾이는지 알 수 있었다. 계수를 바꿔 가며 모양이 어떻게 달라지는지 빠르게 살펴볼 때는 도구가 훨씬 편했다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "detect" | "factory" | "tool" | "card" | "match";

export default function ShapeLab() {
  const [tab, setTab] = useState<Tab>("detect");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">📈 도함수로 그리는 그래프의 개형</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-sky-200">증감표</b>만 보고 그래프를 알아맞히고, 네 단계를 직접 밟아 개형을 그려 봐요.{" "}
          <b className="text-emerald-200">공학도구</b>로 식을 넣어 확인한 뒤, 부호 카드로 원하는 모양을 직접 만들어 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "detect"} onClick={() => setTab("detect")}>① 증감표 탐정</TabButton>
        <TabButton active={tab === "factory"} onClick={() => setTab("factory")}>② 개형 공장</TabButton>
        <TabButton active={tab === "tool"} onClick={() => setTab("tool")}>③ 공학도구 그래프판</TabButton>
        <TabButton active={tab === "card"} onClick={() => setTab("card")}>④ 부호 카드 퍼즐</TabButton>
        <TabButton active={tab === "match"} onClick={() => setTab("match")}>⑤ 짝 맞추기</TabButton>
      </div>

      <div className="mt-4">
        {tab === "detect" ? <DetectTab /> : null}
        {tab === "factory" ? <FactoryTab /> : null}
        {tab === "tool" ? <ToolTab /> : null}
        {tab === "card" ? <CardTab /> : null}
        {tab === "match" ? <MatchTab /> : null}
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
const PMT = 14;
const PMB = 28;
const CML = 22;
const CMR = 10;
const CMT = 10;
const CMB = 18;

type Stroke = "line" | "deriv" | "ghost" | "up" | "down";
const STROKE_COLOR: Record<Stroke, string> = {
  line: "#38bdf8",
  deriv: "#c084fc",
  ghost: "rgba(148,163,184,0.35)",
  up: "#34d399",
  down: "#fb7185",
};

type DotTone = "max" | "min" | "none" | "live";
const DOT_COLOR: Record<DotTone, string> = {
  max: "#fbbf24",
  min: "#38bdf8",
  none: "#94a3b8",
  live: "#f472b6",
};

type RuleTone = "guide" | "hot";
const RULE_COLOR: Record<RuleTone, string> = {
  guide: "rgba(148,163,184,0.45)",
  hot: "rgba(251,191,36,0.6)",
};

type PlotSeg = { tone: Stroke; pts: [number, number][] };
type PlotDot = { x: number; y: number; tone: DotTone; label?: string; filled?: boolean };
type PlotRule = { at: number; tone: RuleTone; solid?: boolean };

function Plot({
  box,
  segs,
  dots = [],
  vlines = [],
  hlines = [],
  uid,
  axis,
  compact = false,
  bare = false,
}: {
  box: Box;
  segs: PlotSeg[];
  dots?: PlotDot[];
  vlines?: PlotRule[];
  hlines?: PlotRule[];
  uid: string;
  axis?: [string, string];
  compact?: boolean;
  bare?: boolean;
}) {
  const ml = compact ? CML : PML;
  const mr = compact ? CMR : PMR;
  const mt = compact ? CMT : PMT;
  const mb = compact ? CMB : PMB;
  const pw = PS - ml - mr;
  const ph = PS - mt - mb;
  const X = (v: number) => ml + ((v - box.xMin) / (box.xMax - box.xMin)) * pw;
  const Y = (v: number) => PS - mb - ((v - box.yMin) / (box.yMax - box.yMin)) * ph;
  const cid = `sh-${uid}`;
  const fs = compact ? 7 : 8;

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

      {gx.map((v) => (
        <line key={`gx${v}`} x1={X(v)} y1={mt} x2={X(v)} y2={PS - mb} stroke="rgba(255,255,255,0.06)" />
      ))}
      {gy.map((v) => (
        <line key={`gy${v}`} x1={ml} y1={Y(v)} x2={PS - mr} y2={Y(v)} stroke="rgba(255,255,255,0.06)" />
      ))}
      {axisX ? <line x1={ml} y1={Y(0)} x2={PS - mr} y2={Y(0)} stroke="rgba(255,255,255,0.34)" /> : null}
      {axisY ? <line x1={X(0)} y1={mt} x2={X(0)} y2={PS - mb} stroke="rgba(255,255,255,0.34)" /> : null}

      {bare
        ? null
        : gx.map((v) => (
            <text key={`tx${v}`} x={X(v)} y={PS - mb + 12} textAnchor="middle" fontSize={fs} fill="#64748b">
              {fmt(v, 4)}
            </text>
          ))}
      {bare
        ? null
        : gy.map((v) => (
            <text key={`ty${v}`} x={ml - 4} y={Y(v) + 3} textAnchor="end" fontSize={fs} fill="#64748b">
              {fmt(v, 4)}
            </text>
          ))}
      {axis && !bare ? (
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
            stroke={RULE_COLOR[h.tone]}
            strokeDasharray={h.solid ? undefined : "4 3"}
          />
        ))}
        {vlines.map((v, i) => (
          <line
            key={`vl${i}`}
            x1={X(v.at)}
            y1={mt}
            x2={X(v.at)}
            y2={PS - mb}
            stroke={RULE_COLOR[v.tone]}
            strokeDasharray={v.solid ? undefined : "4 3"}
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
      </g>

      {/* 점·이름표는 clipPath 밖에 그린다 */}
      {dots
        .filter((d) => d.x >= box.xMin && d.x <= box.xMax && d.y >= box.yMin && d.y <= box.yMax)
        .map((d, i) => (
          <g key={`dt${i}`}>
            <circle
              cx={X(d.x)}
              cy={Y(d.y)}
              r="5"
              fill={d.filled === false ? "#0b1220" : DOT_COLOR[d.tone]}
              stroke={DOT_COLOR[d.tone]}
              strokeWidth="2"
            />
            {d.label ? (
              <text
                x={X(d.x)}
                y={Y(d.y) - 10}
                textAnchor="middle"
                fontSize={compact ? 9 : 11}
                fill={DOT_COLOR[d.tone]}
              >
                {d.label}
              </text>
            ) : null}
          </g>
        ))}
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
//  공용 — 증감표
// ══════════════════════════════════════════════════════════════
const KIND_TEXT: Record<FlagKind, string> = {
  max: "text-amber-200",
  min: "text-sky-200",
  none: "text-slate-400",
};

function SignTable({
  cuts,
  signs,
  vals,
  kinds,
  xName = "x",
  yName = "f(x)",
}: {
  cuts: number[];
  signs: Sign[];
  vals: (number | null)[];
  kinds: FlagKind[];
  xName?: string;
  yName?: string;
}) {
  const n = cuts.length;
  const cols: { gap: boolean; i: number }[] = [];
  for (let i = 0; i <= n; i++) {
    cols.push({ gap: true, i });
    if (i < n) cols.push({ gap: false, i });
  }
  return (
    <div className="overflow-x-auto overflow-y-hidden py-1">
      <table className="w-full min-w-[420px] border-collapse text-center text-base">
        <tbody>
          <tr className="border-b border-white/10">
            <th className="w-16 border-r border-white/10 px-3 py-2 font-mono font-bold text-slate-400">{xName}</th>
            {cols.map((c, k) =>
              c.gap ? (
                <td key={k} className="px-4 py-2 text-slate-500">
                  ⋯
                </td>
              ) : (
                <td key={k} className="px-3 py-2 font-mono font-bold text-slate-100">
                  {fmt(cuts[c.i])}
                </td>
              ),
            )}
          </tr>
          <tr className="border-b border-white/10">
            <th className="border-r border-white/10 px-3 py-2 font-mono font-bold text-slate-400">f&apos;</th>
            {cols.map((c, k) =>
              c.gap ? (
                <td
                  key={k}
                  className={
                    "px-4 py-2 text-lg font-black " + (signs[c.i] > 0 ? "text-emerald-300" : "text-rose-300")
                  }
                >
                  {signs[c.i] > 0 ? "+" : "-"}
                </td>
              ) : (
                <td key={k} className="px-3 py-2 font-mono font-bold text-violet-200">
                  0
                </td>
              ),
            )}
          </tr>
          <tr>
            <th className="border-r border-white/10 px-3 py-2 font-mono font-bold text-slate-400">{yName}</th>
            {cols.map((c, k) =>
              c.gap ? (
                <td key={k} className={"px-4 py-2 text-lg " + (signs[c.i] > 0 ? "text-emerald-300" : "text-rose-300")}>
                  {signs[c.i] > 0 ? "↗" : "↘"}
                </td>
              ) : (
                <td key={k} className={"px-3 py-2 font-mono font-bold " + KIND_TEXT[kinds[c.i]]}>
                  {vals[c.i] === null ? "?" : fmt(vals[c.i] as number)}
                  <span className="ml-1 text-xs font-bold">{FLAG_LABEL[kinds[c.i]]}</span>
                </td>
              ),
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function critKinds(cuts: number[], signs: Sign[]): FlagKind[] {
  const out: FlagKind[] = [];
  for (let i = 0; i < cuts.length; i++) {
    const a = signs[i];
    const b = signs[i + 1];
    out.push(a > 0 && b < 0 ? "max" : a < 0 && b > 0 ? "min" : "none");
  }
  return out;
}

function lines(paths: [number, number][][], tone: Stroke): PlotSeg[] {
  return paths.map((pts) => ({ tone, pts }));
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 증감표 탐정
// ══════════════════════════════════════════════════════════════
function DetectTab() {
  const [qi, setQi] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});

  const q = DETECT_QS[qi];
  const ansOpt = q.options[q.answer];
  const cells = signCells(ansOpt.c, q.cuts, q.from, q.to);
  const signs = cells.map((z) => z.sign) as Sign[];
  const kinds = critKinds(q.cuts, signs);
  const vals = q.cuts.map((x) => evalPoly(ansOpt.c, x));
  const pick = picks[q.id];
  const ok = pick === q.answer;
  const solved = DETECT_QS.filter((z) => picks[z.id] === z.answer).length;
  const goals = [solved === DETECT_QS.length, picks["dq3"] === DETECT_QS[2].answer];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {DETECT_QS.map((z, i) => (
            <PickButton key={z.id} active={i === qi} accent="sky" onClick={() => setQi(i)}>
              <span className="mr-1">{z.emoji}</span>
              {i + 1}. {z.title}
              {picks[z.id] === z.answer ? <span className="ml-1 text-emerald-300">✅</span> : null}
            </PickButton>
          ))}
        </div>
        <span className="font-mono text-xs text-slate-400">
          맞힌 문제 {solved} / {DETECT_QS.length}
        </span>
      </div>

      <div className="rounded-2xl border border-sky-400/25 bg-sky-500/[0.06] p-4">
        <p className="mb-2 text-sm font-bold text-sky-200">🔍 이 증감표에 맞는 그래프는 어느 것일까요?</p>
        <SignTable cuts={q.cuts} signs={signs} vals={vals} kinds={kinds} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {q.options.map((o, i) => {
          const box = fitBox(o.c, o.from, o.to);
          const chosen = pick === i;
          const right = pick !== undefined && i === q.answer;
          const wrong = chosen && i !== q.answer;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setPicks((z) => ({ ...z, [q.id]: i }))}
              className={
                "rounded-2xl border-2 p-2 text-left transition " +
                (right
                  ? "border-emerald-400/70 bg-emerald-400/[0.12]"
                  : wrong
                    ? "border-rose-400/60 bg-rose-400/[0.10]"
                    : chosen
                      ? ACC_CHIP.sky
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]")
              }
            >
              <p className="mb-1 text-center text-xs font-bold text-slate-300">
                {ABC[i]} {right ? "✅" : wrong ? "❌" : ""}
              </p>
              <Plot
                box={box}
                uid={`det-${q.id}-${i}`}
                compact
                segs={lines(samplePath((x) => evalPoly(o.c, x), o.from, o.to, box), "line")}
              />
            </button>
          );
        })}
      </div>

      <div className="min-h-[44px]">
        {pick !== undefined ? (
          <Verdict ok={ok}>
            {ok
              ? "맞아요! 표의 부호 차례와 극값의 자리·값이 모두 들어맞는 그래프예요."
              : q.options[pick].why}
          </Verdict>
        ) : (
          <TipBox>네 그래프의 눈금 숫자를 보고 극값이 생기는 x 와 그때의 함숫값을 표와 견줘 보세요.</TipBox>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
        <GoalList items={DETECT_GOALS} done={goals} />
      </div>

      <StepRunner
        steps={DETECT_STEPS}
        accent="sky"
        finale="증감표의 f′ 칸은 어디서 오르고 내리는지를, 부호가 바뀌는 자리는 극값을 알려 줘요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 개형 공장 — 네 단계
// ══════════════════════════════════════════════════════════════
const STEP_TITLE = ["① 도함수 구하기", "② f′ = 0 인 x 찾기", "③ 좌우 부호 적기", "④ 극값 구하기"];

function FactoryTab() {
  const [fi, setFi] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [nums, setNums] = useState<string[]>([]);
  const [signs, setSigns] = useState<Sign[]>([]);
  const [vals, setVals] = useState<string[]>([]);
  const [shown, setShown] = useState([false, false, false, false]);
  const [at, setAt] = useState(0);
  const [cleared, setCleared] = useState<Record<string, boolean>>({});
  const [draw, setDraw] = useState(0);

  const f = FACTORY_FNS[fi];
  const trueCells = signCells(f.c, f.cuts, f.from, f.to);
  const trueSigns = trueCells.map((z) => z.sign) as Sign[];

  const ok1 = pick === f.dAnswer;
  const ok2 = f.cuts.every((c, i) => sameNum(nums[i] ?? "", c));
  const ok3 = signs.length === trueSigns.length && trueSigns.every((s, i) => signs[i] === s);
  const ok4 = f.cuts.every((c, i) => sameNum(vals[i] ?? "", evalPoly(f.c, c)));
  const oks = [ok1, ok2, ok3, ok4];
  const prog = oks.findIndex((v) => !v) === -1 ? 4 : oks.findIndex((v) => !v);
  const allClear = prog === 4;

  const reset = (idx: number) => {
    setFi(idx);
    setPick(null);
    setNums([]);
    setSigns(FACTORY_FNS[idx].cuts.map(() => 1 as Sign).concat([1 as Sign]));
    setVals([]);
    setShown([false, false, false, false]);
    setAt(0);
    setDraw(0);
  };

  useEffect(() => {
    if (!allClear) return;
    let v = 0;
    const id = window.setInterval(() => {
      v = Math.min(1, v + 0.035);
      setDraw(v);
      if (v >= 1) window.clearInterval(id);
    }, 24);
    return () => window.clearInterval(id);
  }, [allClear, fi]);

  // 처음 들어왔을 때 부호 칸을 함수에 맞춰 둔다
  const sgn: Sign[] = signs.length === f.cuts.length + 1 ? signs : f.cuts.map(() => 1 as Sign).concat([1 as Sign]);

  const box = fitBox(f.c, f.from, f.to);
  const drawn = f.from + (f.to - f.from) * draw;
  const segs: PlotSeg[] = allClear
    ? lines(samplePath((x) => evalPoly(f.c, x), f.from, drawn, box), "line")
    : [];
  const dots: PlotDot[] =
    allClear && draw >= 0.999
      ? f.cuts.map((c, i) => ({
          x: c,
          y: evalPoly(f.c, c),
          tone: critKinds(f.cuts, trueSigns)[i] as DotTone,
          label: `(${fmt(c)}, ${fmt(evalPoly(f.c, c))})`,
        }))
      : [];
  const vlines: PlotRule[] = prog >= 2 ? f.cuts.map((c) => ({ at: c, tone: "guide" as RuleTone })) : [];

  const doneCount = FACTORY_FNS.filter((z) => cleared[z.id]).length;
  const goals = [allClear || doneCount > 0, doneCount === FACTORY_FNS.length];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FACTORY_FNS.map((z, i) => (
          <PickButton key={z.id} active={i === fi} accent="emerald" onClick={() => reset(i)}>
            <span className="mr-1">{z.emoji}</span>
            {z.title}
            {cleared[z.id] ? <span className="ml-1 text-emerald-300">✅</span> : null}
          </PickButton>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-emerald-200">
            <Katex expr={polyTex(f.c)} />
          </p>
          <Plot box={box} uid={`fac-${f.id}`} segs={segs} dots={dots} vlines={vlines} axis={["x", "f(x)"]} />
          <p className="text-center text-[11px] leading-5 text-slate-400">
            {allClear
              ? "네 단계를 모두 밟아 개형을 그렸어요."
              : prog >= 2
                ? "점선이 f′ = 0 인 자리예요. 남은 단계를 마치면 곡선이 그려져요."
                : "단계를 밟으면 여기에 개형이 그려집니다."}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {STEP_TITLE.map((t, i) => (
              <button
                key={t}
                type="button"
                disabled={i > prog}
                onClick={() => setAt(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition disabled:opacity-35 " +
                  (i === at
                    ? ACC_CHIP.emerald
                    : oks[i]
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {oks[i] ? "✅ " : ""}
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-4">
            {at === 0 ? (
              <>
                <p className="text-sm font-bold text-slate-100">f(x) 를 미분한 f′(x) 는 어느 것일까요?</p>
                <ChoiceList
                  options={f.dOptions.map((d) => [{ tex: polyTex(d, "f'(x)") }])}
                  picked={pick}
                  graded={shown[0]}
                  answer={f.dAnswer}
                  accent="emerald"
                  onPick={(i) => {
                    setPick(i);
                    setShown((z) => [false, z[1], z[2], z[3]]);
                  }}
                />
              </>
            ) : null}

            {at >= 1 ? (
              <div className="rounded-xl border border-emerald-400/35 bg-emerald-400/[0.08] px-3 py-2">
                <p className="text-[11px] font-bold text-emerald-300">✅ 1단계에서 구한 도함수</p>
                <p className="mt-0.5 text-sm font-bold text-emerald-100">
                  <Katex expr={polyTex(f.dOptions[f.dAnswer], "f'(x)")} />
                </p>
                {at >= 2 ? (
                  <p className="mt-1 font-mono text-[11px] text-emerald-200">
                    2단계에서 찾은 자리 : x = {f.cuts.map((c) => fmt(c)).join(" , ")}
                  </p>
                ) : null}
              </div>
            ) : null}

            {at === 1 ? (
              <>
                <p className="text-sm font-bold text-slate-100">
                  f′(x) = 0 인 x 를 작은 것부터 적어 보세요. ({f.cuts.length}개)
                </p>
                <div className="flex flex-wrap gap-2">
                  {f.cuts.map((c, i) => (
                    <input
                      key={i}
                      type="text"
                      inputMode="numeric"
                      value={nums[i] ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNums((z) => {
                          const n = [...z];
                          n[i] = v;
                          return n;
                        });
                        setShown((z) => [z[0], false, z[2], z[3]]);
                      }}
                      className={
                        "h-10 w-24 rounded-xl border-2 px-3 text-center font-mono text-sm tabular-nums outline-none transition " +
                        INPUT_MARK[shown[1] ? (sameNum(nums[i] ?? "", c) ? "right" : "wrong") : "none"]
                      }
                    />
                  ))}
                </div>
                <TipBox>
                  1단계에서 고른 f′(x) 를 0 으로 놓고 풀어 보세요. 인수분해하면 바로 보여요.
                </TipBox>
              </>
            ) : null}

            {at === 2 ? (
              <>
                <p className="text-sm font-bold text-slate-100">각 구간에서 f′(x) 의 부호를 정해 보세요.</p>
                <div className="flex flex-wrap items-center gap-2">
                  {sgn.map((s, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="font-mono text-[11px] text-slate-400">
                        {i === 0 ? `x < ${fmt(f.cuts[0])}` : i === f.cuts.length ? `x > ${fmt(f.cuts[i - 1])}` : `${fmt(f.cuts[i - 1])} ~ ${fmt(f.cuts[i])}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSigns(sgn.map((z, k) => (k === i ? ((z > 0 ? -1 : 1) as Sign) : z)));
                          setShown((z) => [z[0], z[1], false, z[3]]);
                        }}
                        className={
                          "h-9 w-9 rounded-lg border-2 text-lg font-black transition " +
                          (s > 0
                            ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
                            : "border-rose-400/60 bg-rose-400/15 text-rose-100")
                        }
                      >
                        {s > 0 ? "+" : "-"}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                  <SignTable
                    cuts={f.cuts}
                    signs={sgn}
                    vals={f.cuts.map(() => null)}
                    kinds={critKinds(f.cuts, sgn)}
                  />
                </div>
                <TipBox>각 구간에서 아무 x 나 하나 골라 f′(x) 에 넣어 보면 부호를 알 수 있어요.</TipBox>
              </>
            ) : null}

            {at === 3 ? (
              <>
                <p className="text-sm font-bold text-slate-100">각 자리의 극값 f(x) 를 구해 보세요.</p>
                <div className="flex flex-wrap gap-2">
                  {f.cuts.map((c, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="font-mono text-xs text-slate-400">f({fmt(c)}) =</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={vals[i] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setVals((z) => {
                            const n = [...z];
                            n[i] = v;
                            return n;
                          });
                          setShown((z) => [z[0], z[1], z[2], false]);
                          setDraw(0);
                        }}
                        className={
                          "h-10 w-24 rounded-xl border-2 px-3 text-center font-mono text-sm tabular-nums outline-none transition " +
                          INPUT_MARK[shown[3] ? (sameNum(vals[i] ?? "", evalPoly(f.c, c)) ? "right" : "wrong") : "none"]
                        }
                      />
                    </div>
                  ))}
                </div>
                <TipBox>2단계에서 찾은 x 를 처음 식 f(x) 에 넣으면 돼요.</TipBox>
              </>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShown((z) => z.map((v, i) => (i === at ? true : v)));
                  if (at === 3 && ok4) setCleared((z) => (z[f.id] ? z : { ...z, [f.id]: true }));
                }}
                className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition " + ACC_BTN.emerald}
              >
                확인
              </button>
              {oks[at] && at < 3 ? (
                <button
                  type="button"
                  onClick={() => setAt(at + 1)}
                  className="rounded-lg border-2 border-emerald-400/55 bg-emerald-400/15 px-4 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/25"
                >
                  다음 단계 →
                </button>
              ) : null}
            </div>

            <div className="min-h-[38px]">
              {shown[at] ? (
                <Verdict ok={oks[at]}>
                  {oks[at]
                    ? at === 0
                      ? "맞아요. 각 항의 지수를 앞에 곱하고 지수를 하나 줄였어요."
                      : at === 1
                        ? "맞아요. 이 x 들이 극값의 후보예요."
                        : at === 2
                          ? "맞아요. 부호가 바뀌는 자리가 극값이 돼요."
                          : "맞아요! 이제 개형을 그릴 수 있어요."
                    : at === 0
                      ? f.dExplains[pick ?? 0]
                      : at === 1
                        ? (
                            <>
                              f′(x) = 0 을 풀어 작은 것부터 차례로 적어 보세요. 인수분해하면{" "}
                              <Katex expr={factorTex(f.dFactor.k, f.dFactor.roots)} /> 예요.
                            </>
                          )
                        : at === 2
                          ? "각 구간에서 x 를 하나 골라 f′(x) 에 넣어 부호를 확인해 보세요."
                          : "2단계에서 찾은 x 를 f(x) 에 넣어 계산해 보세요."}
                </Verdict>
              ) : null}
            </div>
          </div>

          {allClear ? (
            <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3">
              <p className="text-center text-sm font-bold text-emerald-100">📋 완성된 증감표</p>
              <SignTable
                cuts={f.cuts}
                signs={trueSigns}
                vals={f.cuts.map((c) => evalPoly(f.c, c))}
                kinds={critKinds(f.cuts, trueSigns)}
              />
              <p className="text-center text-xs leading-6 text-slate-200">{f.note}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 flex items-center justify-between text-xs font-bold text-slate-300">
              <span>🎯 미션</span>
              <span className="font-mono text-slate-400">
                완성 {doneCount} / {FACTORY_FNS.length}
              </span>
            </p>
            <GoalList items={FACTORY_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner
        steps={FACTORY_STEPS}
        accent="emerald"
        finale="도함수 → f′ = 0 인 x → 좌우 부호 → 극값 → 개형. 이 네 단계가 그래프를 그리는 길이에요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 공학도구 그래프판
// ══════════════════════════════════════════════════════════════
const COEF_LABEL = ["상수항", "x 의 계수", "x² 의 계수", "x³ 의 계수", "x⁴ 의 계수"];

/** 계수 배열을 늘 5칸(사차까지)으로 맞춘다 */
function pad5(c: Poly): Poly {
  const out: Poly = [0, 0, 0, 0, 0];
  for (let i = 0; i < Math.min(5, c.length); i++) out[i] = c[i];
  return out;
}

function ToolTab() {
  const [coef, setCoef] = useState<Poly>(pad5(TOOL_PRESETS[0].c));
  const [draft, setDraft] = useState(polySrc(TOOL_PRESETS[0].c));
  const [err, setErr] = useState<string | null>(null);
  const [from, setFrom] = useState(TOOL_PRESETS[0].from);
  const [to, setTo] = useState(TOOL_PRESETS[0].to);
  const [showPts, setShowPts] = useState(false);
  const [mode, setMode] = useState<"src" | "coef">("src");
  const [done, setDone] = useState<Record<string, boolean>>({});

  const box = fitBox(coef, from, to);
  const crits = critPoints(coef, from, to);
  const flats = flatPoints(coef, from, to);
  const deg = polyDegree(coef);
  const d1 = derivPoly(coef);

  const remember = (c: Poly, lo: number, hi: number) => {
    const cr = critPoints(c, lo, hi);
    setDone((old) => {
      let next = old;
      for (const m of TOOL_MISSIONS) {
        if (!old[m.id] && missionDone(m.id, c, cr)) {
          if (next === old) next = { ...old };
          next[m.id] = true;
        }
      }
      return next;
    });
  };

  const apply = (c: Poly, lo = from, hi = to) => {
    setCoef(c);
    setDraft(polySrc(c));
    setErr(null);
    setFrom(lo);
    setTo(hi);
    remember(c, lo, hi);
  };

  const cuts = crits.map((z) => z.x).concat(flats).sort((a, b) => a - b);
  const cells = cuts.length > 0 ? signCells(coef, cuts, from, to) : [];
  const signs = cells.map((z) => z.sign) as Sign[];
  const goals = TOOL_MISSIONS.map((m) => done[m.id] === true);

  const segs: PlotSeg[] = lines(samplePath((x) => evalPoly(coef, x), from, to, box), "line");
  const dots: PlotDot[] = showPts
    ? crits
        .map((z) => ({ x: z.x, y: z.y, tone: z.kind as DotTone, label: `(${fmt(z.x)}, ${fmt(z.y)})` }))
        .concat(flats.map((x) => ({ x, y: evalPoly(coef, x), tone: "none" as DotTone, label: "평평" })))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400">불러오기</span>
        {TOOL_PRESETS.map((p) => (
          <PickButton key={p.id} active={false} accent="violet" onClick={() => apply(pad5(p.c), p.from, p.to)}>
            {p.label}
          </PickButton>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-violet-200">
            <Katex expr={polyTex(coef)} />
          </p>
          <Plot box={box} uid="tool" segs={segs} dots={dots} axis={["x", "f(x)"]} />
          <p className="text-center text-[11px] text-slate-400">
            보는 범위 {fmt(from)} ~ {fmt(to)}
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-3 rounded-2xl border border-violet-400/25 bg-violet-500/[0.06] p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode("src")}
                className={
                  "rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " +
                  (mode === "src" ? ACC_CHIP.violet : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                ⌨️ 식 입력
              </button>
              <button
                type="button"
                onClick={() => setMode("coef")}
                className={
                  "rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " +
                  (mode === "coef" ? ACC_CHIP.violet : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                🎚️ 계수 손잡이
              </button>
            </div>

            {mode === "src" ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft(v);
                    const r = parsePoly(v);
                    if (r.ok) {
                      setCoef(r.c);
                      setErr(null);
                      remember(r.c, from, to);
                    } else setErr(r.why);
                  }}
                  className={
                    "h-11 w-full rounded-xl border-2 px-3 font-mono text-sm outline-none transition " +
                    INPUT_MARK[err ? "wrong" : "none"]
                  }
                />
                <p className="text-[11px] leading-5 text-slate-400">
                  {err ? <span className="text-rose-200">{err}</span> : "보기처럼 입력하세요 : x^3 + 6x^2 + 9x + 2"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {[4, 3, 2, 1, 0].map((d) => (
                  <div key={d}>
                    <p className="mb-1 flex justify-between text-[11px] font-bold text-slate-300">
                      <span>{COEF_LABEL[d]}</span>
                      <span className="font-mono text-slate-100">{fmt(coef[d])}</span>
                    </p>
                    <input
                      type="range"
                      min={COEF_RANGE[d][0]}
                      max={COEF_RANGE[d][1]}
                      step={1}
                      value={coef[d]}
                      onChange={(e) => {
                        const n = [...coef];
                        n[d] = Number(e.target.value);
                        apply(n);
                      }}
                      className={RANGE_BASE + ACC_RANGE.violet}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="flex justify-between text-[11px] font-bold text-slate-300">
                <span>보는 범위 — 좌우 끝을 따로 잡아요</span>
                <span className="font-mono text-slate-100">
                  {fmt(from)} ~ {fmt(to)}
                </span>
              </p>
              <div>
                <p className="mb-1 flex justify-between text-[11px] text-slate-400">
                  <span>왼쪽 끝 x</span>
                  <span className="font-mono text-slate-200">{fmt(from)}</span>
                </p>
                <input
                  type="range"
                  min={VIEW_MIN}
                  max={VIEW_MAX - VIEW_GAP}
                  step={1}
                  value={from}
                  onChange={(e) => {
                    const lo = Math.min(Number(e.target.value), to - VIEW_GAP);
                    setFrom(lo);
                    remember(coef, lo, to);
                  }}
                  className={RANGE_BASE + ACC_RANGE.violet}
                />
              </div>
              <div>
                <p className="mb-1 flex justify-between text-[11px] text-slate-400">
                  <span>오른쪽 끝 x</span>
                  <span className="font-mono text-slate-200">{fmt(to)}</span>
                </p>
                <input
                  type="range"
                  min={VIEW_MIN + VIEW_GAP}
                  max={VIEW_MAX}
                  step={1}
                  value={to}
                  onChange={(e) => {
                    const hi = Math.max(Number(e.target.value), from + VIEW_GAP);
                    setTo(hi);
                    remember(coef, from, hi);
                  }}
                  className={RANGE_BASE + ACC_RANGE.violet}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPts(!showPts)}
              className={"w-full rounded-xl border-2 px-4 py-2 text-sm font-bold transition " + ACC_BTN.violet}
            >
              {showPts ? "🔆 특징점 숨기기" : "✨ 특징점 보기"}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-2 text-xs font-bold text-slate-300">
              <Katex expr={polyTex(d1, "f'(x)")} />
            </p>
            {crits.length === 0 && flats.length === 0 ? (
              <p className="text-xs leading-6 text-slate-400">
                이 범위에서 f′ 의 부호가 바뀌지 않아요 — 극값이 없습니다. {deg}차함수예요.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {crits.map((z, i) => (
                    <span
                      key={`c${i}`}
                      className={
                        "rounded-lg border-2 px-2 py-1 font-mono text-[11px] font-bold " +
                        (z.kind === "max"
                          ? "border-amber-400/60 bg-amber-400/15 text-amber-100"
                          : "border-sky-400/60 bg-sky-400/15 text-sky-100")
                      }
                    >
                      {FLAG_EMOJI[z.kind]} {FLAG_LABEL[z.kind]} ({fmt(z.x)}, {fmt(z.y)})
                    </span>
                  ))}
                  {flats.map((x, i) => (
                    <span
                      key={`f${i}`}
                      className="rounded-lg border-2 border-white/15 bg-white/5 px-2 py-1 font-mono text-[11px] font-bold text-slate-300"
                    >
                      ▫️ 평평 ({fmt(x)}, {fmt(evalPoly(coef, x))})
                    </span>
                  ))}
                </div>
                {cuts.length > 0 ? (
                  <div className="mt-2">
                    <SignTable
                      cuts={cuts}
                      signs={signs}
                      vals={cuts.map((x) => evalPoly(coef, x))}
                      kinds={critKinds(cuts, signs)}
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션 — 식이나 손잡이로 만들어 보세요</p>
            <GoalList items={TOOL_MISSIONS.map((m) => m.label)} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner
        steps={TOOL_STEPS}
        accent="violet"
        finale="공학도구는 결과를 빠르게 보여 주고, 증감표는 왜 그 모양이 되는지를 보여 줘요. 둘을 함께 쓰면 좋아요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 부호 카드 퍼즐
// ══════════════════════════════════════════════════════════════
function CardTab() {
  const [signs, setSigns] = useState<Sign[]>([1, 1, 1, 1]);
  const [ti, setTi] = useState(0);
  const [solved, setSolved] = useState<Record<string, boolean>>({});

  const target = CARD_TARGETS[ti];
  const kinds = cardKinds(signs);
  const ok = target.signs.every((s, i) => signs[i] === s);
  const madeFlat = Object.keys(solved).length > 0 && kinds.includes("none");

  const put = (i: number, v: Sign) => {
    const next = signs.map((z, k) => (k === i ? v : z));
    setSigns(next);
    if (CARD_TARGETS[ti].signs.every((s, k) => next[k] === s)) {
      setSolved((z) => (z[CARD_TARGETS[ti].id] ? z : { ...z, [CARD_TARGETS[ti].id]: true }));
    }
  };

  const mine = sketchCurve(signs);
  const goal = sketchCurve(target.signs);
  const goals = [CARD_TARGETS.every((t) => solved[t.id]), madeFlat || CARD_TARGETS.some((t) => solved[t.id] && cardKinds(t.signs).includes("none"))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {CARD_TARGETS.map((t, i) => (
            <PickButton key={t.id} active={i === ti} accent="rose" onClick={() => setTi(i)}>
              <span className="mr-1">{t.emoji}</span>
              목표 {i + 1}
              {solved[t.id] ? <span className="ml-1 text-emerald-300">✅</span> : null}
            </PickButton>
          ))}
        </div>
        <span className="font-mono text-xs text-slate-400">
          맞춘 목표 {CARD_TARGETS.filter((t) => solved[t.id]).length} / {CARD_TARGETS.length}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-amber-400/35 bg-amber-400/[0.06] p-3">
          <p className="mb-1 text-center text-sm font-bold text-amber-200">🎯 목표 — {target.label}</p>
          <Plot box={CARD_BOX} uid={`card-goal-${target.id}`} segs={[{ tone: "ghost", pts: goal }]} bare />
        </div>
        <div
          className={
            "rounded-2xl border-2 p-3 " +
            (ok ? "border-emerald-400/55 bg-emerald-400/[0.10]" : "border-white/10 bg-white/[0.03]")
          }
        >
          <p className={"mb-1 text-center text-sm font-bold " + (ok ? "text-emerald-200" : "text-slate-300")}>
            {ok ? "✅ 내가 만든 모양 — 목표와 같아요!" : "✏️ 내가 만든 모양"}
          </p>
          <Plot
            box={CARD_BOX}
            uid="card-mine"
            segs={[{ tone: ok ? "up" : "line", pts: mine }]}
            vlines={CARD_XS.map((x) => ({ at: x, tone: "guide" as RuleTone }))}
            bare
          />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] p-4">
        <p className="text-sm font-bold text-rose-100">
          임계점은 {CARD_XS.map((x) => fmt(x)).join(", ")} 입니다. 네 구간에 부호 카드를 놓아 보세요.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          {signs.map((s, i) => (
            <div key={i} className="text-center">
              <p className="mb-1 font-mono text-[11px] text-slate-400">
                {i === 0
                  ? `x < ${fmt(CARD_XS[0])}`
                  : i === CARD_XS.length
                    ? `x > ${fmt(CARD_XS[i - 1])}`
                    : `${fmt(CARD_XS[i - 1])} ~ ${fmt(CARD_XS[i])}`}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => put(i, 1)}
                  className={
                    "h-11 w-11 rounded-xl border-2 text-xl font-black transition " +
                    (s > 0
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
                  }
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => put(i, -1)}
                  className={
                    "h-11 w-11 rounded-xl border-2 text-xl font-black transition " +
                    (s < 0
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
                  }
                >
                  -
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
          <SignTable cuts={CARD_XS} signs={signs} vals={CARD_XS.map(() => null)} kinds={kinds} />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {kinds.map((k, i) => (
            <span
              key={i}
              className={
                "rounded-lg border-2 px-2.5 py-1 text-[11px] font-bold " +
                (k === "max"
                  ? "border-amber-400/60 bg-amber-400/15 text-amber-100"
                  : k === "min"
                    ? "border-sky-400/60 bg-sky-400/15 text-sky-100"
                    : "border-white/15 bg-white/5 text-slate-300")
              }
            >
              x = {fmt(CARD_XS[i])} : {FLAG_EMOJI[k]} {FLAG_LABEL[k]}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
        <GoalList items={CARD_GOALS} done={goals} />
      </div>

      <StepRunner
        steps={CARD_STEPS}
        accent="rose"
        finale="부호의 배열 하나가 개형 하나를 정해요. 부호가 바뀌는 자리에서만 극값이 생기지요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ f 와 f′ 짝 맞추기
// ══════════════════════════════════════════════════════════════
function MatchTab() {
  const [pickL, setPickL] = useState<number | null>(null);
  const [pickR, setPickR] = useState<number | null>(null);
  const [matched, setMatched] = useState<Record<string, boolean>>({});
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState<{ ok: boolean; why: string } | null>(null);

  const judge = (l: number, r: number) => {
    if (l === r) {
      setMatched((z) => ({ ...z, [MATCH_ITEMS[l].id]: true }));
      setFlash({ ok: true, why: MATCH_ITEMS[l].why });
      setPickL(null);
      setPickR(null);
    } else {
      setPickL(l);
      setPickR(r);
      setMisses((n) => n + 1);
      setFlash({ ok: false, why: "짝이 아니에요. f′ 이 x 축과 만나는 자리와 f 가 꺾이는 자리를 견줘 보세요." });
    }
  };

  const tapL = (i: number) => {
    setFlash(null);
    if (pickR !== null) judge(i, pickR);
    else setPickL(i);
  };
  const tapR = (i: number) => {
    setFlash(null);
    if (pickL !== null) judge(pickL, i);
    else setPickR(i);
  };

  const okCount = MATCH_ITEMS.filter((m) => matched[m.id]).length;
  const allOk = okCount === MATCH_ITEMS.length;
  const goals = [allOk, allOk && misses <= 2];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
        <p className="text-sm font-bold text-amber-100">
          🃏 왼쪽의 f 와 오른쪽의 f′ 을 한 장씩 눌러 짝지어 보세요. 눈금 숫자는 일부러 지웠어요.
        </p>
        <span className="font-mono text-xs text-slate-300">
          맞춘 짝 {okCount} / {MATCH_ITEMS.length} · 틀린 횟수 {misses}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-sky-200">f 의 그래프</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {MATCH_LEFT_ORDER.map((idx, pos) => {
              const it = MATCH_ITEMS[idx];
              const box = fitBox(it.c, it.from, it.to);
              const isOk = matched[it.id];
              return (
                <button
                  key={it.id}
                  type="button"
                  disabled={isOk}
                  onClick={() => tapL(idx)}
                  className={
                    "rounded-xl border-2 p-1.5 transition disabled:opacity-45 " +
                    (isOk
                      ? "border-emerald-400/60 bg-emerald-400/[0.12]"
                      : pickL === idx
                        ? ACC_CHIP.sky
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]")
                  }
                >
                  <p className="text-center text-[11px] font-bold text-slate-400">
                    {isOk ? "✅" : String.fromCharCode(65 + pos)}
                  </p>
                  <Plot
                    box={box}
                    uid={`mf-${it.id}`}
                    compact
                    bare
                    segs={lines(samplePath((x) => evalPoly(it.c, x), it.from, it.to, box), "line")}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-violet-200">f&apos; 의 그래프</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {MATCH_RIGHT_ORDER.map((idx, pos) => {
              const it = MATCH_ITEMS[idx];
              const d = derivPoly(it.c);
              const box = fitBox(d, it.from, it.to);
              const isOk = matched[it.id];
              return (
                <button
                  key={it.id}
                  type="button"
                  disabled={isOk}
                  onClick={() => tapR(idx)}
                  className={
                    "rounded-xl border-2 p-1.5 transition disabled:opacity-45 " +
                    (isOk
                      ? "border-emerald-400/60 bg-emerald-400/[0.12]"
                      : pickR === idx
                        ? ACC_CHIP.violet
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]")
                  }
                >
                  <p className="text-center text-[11px] font-bold text-slate-400">{isOk ? "✅" : `${pos + 1}`}</p>
                  <Plot
                    box={box}
                    uid={`md-${it.id}`}
                    compact
                    bare
                    segs={lines(samplePath((x) => evalPoly(d, x), it.from, it.to, box), "deriv")}
                    hlines={[{ at: 0, tone: "hot", solid: true }]}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="min-h-[44px]">
        {flash ? <Verdict ok={flash.ok}>{flash.why}</Verdict> : <TipBox>f′ 이 x 축을 가로지르는 횟수와 f 가 방향을 바꾸는 횟수를 세어 보세요.</TipBox>}
      </div>

      {allOk ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-sm font-bold text-emerald-100">🎉 다섯 쌍을 모두 맞췄어요!</p>
          <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-slate-200">
            f′ 의 부호가 f 의 증감을, f′ 과 x 축이 만나면서 부호가 바뀌는 자리가 f 의 극값을 정해요. 닿기만 하고 넘어가지
            않으면 극값이 되지 못하지요.
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
        <GoalList items={MATCH_GOALS} done={goals} />
      </div>

      <StepRunner
        steps={MATCH_STEPS}
        accent="amber"
        finale="f′ 의 그래프 한 장이면 f 의 개형을 거의 다 알 수 있어요. 남는 것은 위아래로 얼마나 옮겨져 있는지뿐이지요."
      />
    </div>
  );
}
