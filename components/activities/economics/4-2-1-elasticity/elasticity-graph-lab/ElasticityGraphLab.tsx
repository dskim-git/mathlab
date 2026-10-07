"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CURVES,
  CURVE_GOALS,
  CURVE_STEPS,
  E_EMOJI,
  E_LABEL,
  MID_A0,
  MID_A_MAX,
  MID_A_MIN,
  MID_B0,
  MID_BOX,
  MID_B_STEP,
  MID_GOALS,
  MID_STEPS,
  MID_T_STEP,
  RANGES,
  RANGE_GOALS,
  RANGE_STEP,
  RANGE_STEPS,
  REAL_NOTE,
  TRACE_FNS,
  TRACE_GOALS,
  TRACE_STEP,
  TRACE_STEPS,
  bHi,
  bLo,
  eKind,
  fmt,
  pointE,
  samplePath,
  type Box,
  type EKind,
  type Piece,
  type Step,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "two_slopes",
    prompt:
      "①에서 접선과 원점선의 기울기를 견주어 탄력성을 판별했어요. ε = x f′(x)/f(x) 가 왜 '두 기울기의 비' 가 되는지 자기 말로 쓰고, 두 선이 포개질 때 왜 단위 탄력적인지도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: f(x)/x 가 원점과 그 점을 잇는 직선의 기울기라서, x f′/f 를 f′ ÷ (f/x) 로 고쳐 쓰면 두 기울기를 나눈 값이 된다. 두 선이 포개지면 기울기가 같아 나눈 값이 1 이 되므로 단위 탄력적이다.",
  },
  {
    id: "midpoint",
    prompt:
      "②에서 a 와 b 를 아무리 바꿔도 단위 탄력점이 늘 선분 AB의 중점이었어요. 왜 그런지 식으로 설명하고, 중점을 기준으로 왼쪽과 오른쪽이 갈리는 까닭도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: ax/(b−ax) = 1 을 풀면 x = b/(2a) 이고, A(b/a, 0)과 B(0, b)의 중점도 (b/(2a), b/2) 라 똑같다. 가격이 오르면 분자는 커지고 분모는 작아져 탄력성이 계속 커지므로, 1이 되는 중점을 지나는 순간 비탄력에서 탄력으로 넘어간다.",
  },
  {
    id: "trace",
    prompt:
      "③에서 탄력성을 하나의 곡선(자취)으로 그려 보았어요. 그 자취가 y = 1 과 만나는 점의 뜻을 쓰고, 함수의 그래프와 탄력성의 자취가 무엇이 다른지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 자취가 1을 지나는 x가 단위 탄력 가격이고, 그 아래는 비탄력·위는 탄력 구간이다. 함수의 그래프는 세로축이 수요량이지만 자취는 세로축이 탄력성이라, 같은 가로축 위에 전혀 다른 것을 그린 그림이다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "curve" | "mid" | "trace" | "range";

export default function ElasticityGraphLab() {
  const [tab, setTab] = useState<Tab>("curve");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">📐 그래프로 보는 탄력성</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-rose-200">접선</b>과 <b className="text-amber-200">원점선</b> 가운데 어느 쪽이 더 가파른지만
          봐도 탄력성을 알 수 있어요. 단위 탄력점이 늘 <b className="text-sky-200">중점</b>인 것을 확인하고, 탄력성을{" "}
          <b className="text-violet-200">하나의 곡선</b>으로 그려 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "curve"} onClick={() => setTab("curve")}>① 두 기울기 재판소</TabButton>
        <TabButton active={tab === "mid"} onClick={() => setTab("mid")}>② 중점의 비밀</TabButton>
        <TabButton active={tab === "trace"} onClick={() => setTab("trace")}>③ 탄력성 자취 그리기</TabButton>
        <TabButton active={tab === "range"} onClick={() => setTab("range")}>④ 탄력성 사격장</TabButton>
      </div>

      <div className="mt-4">
        {tab === "curve" ? <CurveTab /> : null}
        {tab === "mid" ? <MidTab /> : null}
        {tab === "trace" ? <TraceTab /> : null}
        {tab === "range" ? <RangeTab /> : null}
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

type Stroke = "curve" | "tangent" | "ray" | "elastic" | "inelastic" | "trace" | "ghost";
const STROKE_COLOR: Record<Stroke, string> = {
  curve: "#38bdf8",
  tangent: "#fb7185",
  ray: "#fbbf24",
  elastic: "#fb7185",
  inelastic: "#38bdf8",
  trace: "#c084fc",
  ghost: "rgba(148,163,184,0.35)",
};

type DotTone = "live" | "unit" | "mark" | "goal" | "trace";
const DOT_COLOR: Record<DotTone, string> = {
  live: "#f472b6",
  unit: "#fbbf24",
  mark: "#94a3b8",
  goal: "#34d399",
  trace: "#c084fc",
};

type RuleTone = "guide" | "hot" | "goal";
const RULE_COLOR: Record<RuleTone, string> = {
  guide: "rgba(148,163,184,0.45)",
  hot: "rgba(251,191,36,0.75)",
  goal: "rgba(52,211,153,0.7)",
};

type PlotSeg = { tone: Stroke; pts: [number, number][]; dash?: boolean };
type PlotDot = { x: number; y: number; tone: DotTone; label?: string; filled?: boolean; small?: boolean };
type PlotRule = { at: number; tone: RuleTone; solid?: boolean };

function Plot({
  box,
  segs,
  dots = [],
  vlines = [],
  hlines = [],
  uid,
  axis,
}: {
  box: Box;
  segs: PlotSeg[];
  dots?: PlotDot[];
  vlines?: PlotRule[];
  hlines?: PlotRule[];
  uid: string;
  axis?: [string, string];
}) {
  const pw = PS - PML - PMR;
  const ph = PS - PMT - PMB;
  const X = (v: number) => PML + ((v - box.xMin) / (box.xMax - box.xMin)) * pw;
  const Y = (v: number) => PS - PMB - ((v - box.yMin) / (box.yMax - box.yMin)) * ph;
  const cid = `eg-${uid}`;

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
              r={d.small ? 2.6 : 5}
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
//  공용 — 탄력성 배지 · 두 기울기 저울
// ══════════════════════════════════════════════════════════════
const E_CHIP: Record<EKind, string> = {
  elastic: "border-rose-400/60 bg-rose-400/15 text-rose-100",
  unit: "border-amber-400/60 bg-amber-400/15 text-amber-100",
  inelastic: "border-sky-400/60 bg-sky-400/15 text-sky-100",
};
const E_TEXT: Record<EKind, string> = {
  elastic: "text-rose-200",
  unit: "text-amber-200",
  inelastic: "text-sky-200",
};

function EBadge({ e }: { e: number }) {
  const k = eKind(e);
  return (
    <span className={"rounded-xl border-2 px-3 py-1.5 text-sm font-black " + E_CHIP[k]}>
      {E_EMOJI[k]} {E_LABEL[k]}
    </span>
  );
}

/** 접선의 기울기와 원점선의 기울기를 막대로 견준다 */
function SlopeBars({ tan, ray }: { tan: number; ray: number }) {
  const top = Math.max(tan, ray, 1e-9);
  const w = (v: number) => Math.max(2, (v / top) * 170);
  return (
    <svg viewBox="0 0 300 92" className="w-full" role="img" aria-label="두 기울기 견주기">
      <text x="8" y="26" fontSize="10" fill="#fda4af">
        접선
      </text>
      <rect x="54" y="14" width={w(tan)} height="18" rx="4" fill="#fb7185" />
      <text x={58 + w(tan)} y="27" fontSize="11" fontWeight="bold" fill="#fda4af">
        {fmt(tan, 2)}
      </text>
      <text x="8" y="60" fontSize="10" fill="#fcd34d">
        원점선
      </text>
      <rect x="54" y="48" width={w(ray)} height="18" rx="4" fill="#fbbf24" />
      <text x={58 + w(ray)} y="61" fontSize="11" fontWeight="bold" fill="#fcd34d">
        {fmt(ray, 2)}
      </text>
      <text x="150" y="86" textAnchor="middle" fontSize="10" fill="#64748b">
        {tan > ray + 1e-9
          ? "접선이 더 가파르다 → 탄력적"
          : tan < ray - 1e-9
            ? "원점선이 더 가파르다 → 비탄력적"
            : "두 기울기가 같다 → 단위 탄력적"}
      </text>
    </svg>
  );
}

function lines(paths: [number, number][][], tone: Stroke, dash = false): PlotSeg[] {
  return paths.map((pts) => ({ tone, pts, dash }));
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 두 기울기 재판소
// ══════════════════════════════════════════════════════════════
function CurveTab() {
  const [ci, setCi] = useState(0);
  const [x, setX] = useState(CURVES[0].from);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [sawConst, setSawConst] = useState(false);

  const g = CURVES[ci];
  const q = g.f(x);
  const tan = g.d1(x);
  const ray = q / x;
  const e = tan / ray;
  const k = eKind(e);

  const mark = (fn: typeof g, nx: number) => {
    const ee = fn.d1(nx) / (fn.f(nx) / nx);
    setSeen((old) => (old[eKind(ee)] ? old : { ...old, [eKind(ee)]: true }));
    if (fn.constE !== null) setSawConst(true);
  };

  const goals = [seen.elastic === true, seen.inelastic === true, seen.unit === true, sawConst];

  const half = (g.box.xMax - g.box.xMin) * 0.42;
  const segs: PlotSeg[] = [
    ...lines(samplePath(g.f, g.from, g.to, g.box), "curve"),
    { tone: "ray", pts: [[0, 0], [g.box.xMax, ray * g.box.xMax]] },
    {
      tone: "tangent",
      pts: [
        [x - half, q - tan * half],
        [x + half, q + tan * half],
      ],
    },
  ];
  const dots: PlotDot[] = [{ x, y: q, tone: "live", label: "A" }];
  if (g.unitX !== null) dots.push({ x: g.unitX, y: g.f(g.unitX), tone: "unit", filled: false });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CURVES.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === ci}
            accent="rose"
            onClick={() => {
              setCi(i);
              setX(z.from);
              mark(z, z.from);
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
            <Katex expr={g.tex} />
          </p>
          <Plot
            box={g.box}
            uid={`cv-${g.id}`}
            segs={segs}
            dots={dots}
            vlines={[{ at: x, tone: "guide" }]}
            axis={["가격 (천원)", "공급량 (개)"]}
          />
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
            <span className="rounded-lg border border-rose-400/50 bg-rose-400/10 px-2 py-0.5 font-bold text-rose-200">
              분홍 = 접선
            </span>
            <span className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 font-bold text-amber-200">
              노랑 = 원점선
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-3 rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] p-4">
            <p className="flex justify-between text-xs font-bold text-slate-300">
              <span>점 A 를 움직여 보세요</span>
              <span className="font-mono text-slate-100">x = {fmt(x)} 천원</span>
            </p>
            <input
              type="range"
              min={g.from}
              max={g.to}
              step={0.1}
              value={x}
              onChange={(ev) => {
                const nx = Number(ev.target.value);
                setX(nx);
                mark(g, nx);
              }}
              className={RANGE_BASE + ACC_RANGE.rose}
            />
            <SlopeBars tan={tan} ray={ray} />
            <div className={"rounded-xl border-2 p-3 text-center " + E_CHIP[k]}>
              <p className="font-mono text-sm">
                <Katex expr={`\\varepsilon = \\dfrac{${fmt(tan, 2)}}{${fmt(ray, 2)}}`} />
              </p>
              <p className="mt-1 font-mono text-3xl font-black">{fmt(e, 3)}</p>
              <div className="mt-1 flex justify-center">
                <EBadge e={e} />
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <p className="text-[11px] text-slate-400">
                <Katex expr="f'(x)" />
              </p>
              <p className="font-mono text-lg font-black text-rose-200">{fmt(tan, 2)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <p className="text-[11px] text-slate-400">
                <Katex expr="\dfrac{f(x)}{x}" />
              </p>
              <p className="font-mono text-lg font-black text-amber-200">{fmt(ray, 2)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <p className="text-[11px] text-slate-400">공급량 f(x)</p>
              <p className="font-mono text-lg font-black text-slate-100">{fmt(q, 1)}</p>
            </div>
          </div>

          <TipBox>{g.note}</TipBox>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={CURVE_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner
        steps={CURVE_STEPS}
        accent="rose"
        finale="탄력성은 접선의 기울기를 원점선의 기울기로 나눈 값이에요. 어느 쪽이 더 가파른지만 봐도 판정할 수 있지요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 중점의 비밀
// ══════════════════════════════════════════════════════════════
function MidTab() {
  const [a, setA] = useState(MID_A0);
  const [b, setB] = useState(MID_B0);
  const [t, setT] = useState(0.3);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [pairs, setPairs] = useState<Record<string, boolean>>({});

  const f = (v: number) => -a * v + b;
  const xi = b / a;
  const mx = b / (2 * a);
  const my = b / 2;
  const x = Number((t * xi).toFixed(6));
  const q = f(x);
  const e = (a * x) / q;
  const k = eKind(e);
  const box = MID_BOX;

  const mark = (na: number, nb: number, nt: number) => {
    const nx = nt * (nb / na);
    const ne = (na * nx) / (-na * nx + nb);
    setSeen((old) => (old[eKind(ne)] ? old : { ...old, [eKind(ne)]: true }));
    if (Math.abs(nt - 0.5) < 1e-9) setPairs((old) => (old[`${na}:${nb}`] ? old : { ...old, [`${na}:${nb}`]: true }));
  };

  const goals = [
    seen.unit === true,
    seen.inelastic === true,
    seen.elastic === true,
    Object.keys(pairs).length >= 3,
  ];

  const segs: PlotSeg[] = [
    ...lines(samplePath(f, 0, mx, box), "inelastic"),
    ...lines(samplePath(f, mx, xi, box), "elastic"),
  ];
  const dots: PlotDot[] = [
    { x: xi, y: 0, tone: "mark", filled: false, label: "A" },
    { x: 0, y: b, tone: "mark", filled: false, label: "B" },
    { x: mx, y: my, tone: "unit", label: "C 중점" },
    { x, y: q, tone: "live" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-sky-200">
            <Katex expr={`f(x) = -${a}x + ${b}`} />
          </p>
          <Plot
            box={box}
            uid="md"
            segs={segs}
            dots={dots}
            vlines={[{ at: x, tone: "guide" }]}
            axis={["가격 (천원)", "수요량 (개)"]}
          />
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
            <span className="rounded-lg border border-sky-400/50 bg-sky-400/10 px-2 py-0.5 font-bold text-sky-200">
              왼쪽 절반 = 비탄력적
            </span>
            <span className="rounded-lg border border-rose-400/50 bg-rose-400/10 px-2 py-0.5 font-bold text-rose-200">
              오른쪽 절반 = 탄력적
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-3 rounded-2xl border border-sky-400/25 bg-sky-500/[0.06] p-4">
            <div>
              <p className="mb-1 flex justify-between text-xs font-bold text-slate-300">
                <span>기울기 a</span>
                <span className="font-mono text-slate-100">{fmt(a)}</span>
              </p>
              <input
                type="range"
                min={MID_A_MIN}
                max={MID_A_MAX}
                step={1}
                value={a}
                onChange={(ev) => {
                  const na = Number(ev.target.value);
                  const nb = Math.min(bHi(na), Math.max(bLo(na), b));
                  setA(na);
                  setB(nb);
                  mark(na, nb, t);
                }}
                className={RANGE_BASE + ACC_RANGE.sky}
              />
            </div>
            <div>
              <p className="mb-1 flex justify-between text-xs font-bold text-slate-300">
                <span>세로 절편 b</span>
                <span className="font-mono text-slate-100">{fmt(b)}</span>
              </p>
              <input
                type="range"
                min={bLo(a)}
                max={bHi(a)}
                step={MID_B_STEP}
                value={b}
                onChange={(ev) => {
                  const nb = Number(ev.target.value);
                  setB(nb);
                  mark(a, nb, t);
                }}
                className={RANGE_BASE + ACC_RANGE.sky}
              />
            </div>
            <div>
              <p className="mb-1 flex justify-between text-xs font-bold text-slate-300">
                <span>가격 (x 절편 대비 t)</span>
                <span className="font-mono text-slate-100">
                  t = {fmt(t, 2)} · x = {fmt(x)}
                </span>
              </p>
              <input
                type="range"
                min={MID_T_STEP}
                max={1 - MID_T_STEP}
                step={MID_T_STEP}
                value={t}
                onChange={(ev) => {
                  const nt = Number(ev.target.value);
                  setT(nt);
                  mark(a, b, nt);
                }}
                className={RANGE_BASE + ACC_RANGE.sky}
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <p className="text-[11px] text-slate-400">A (x 절편)</p>
              <p className="font-mono text-sm font-black text-slate-100">({fmt(xi)}, 0)</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <p className="text-[11px] text-slate-400">B (y 절편)</p>
              <p className="font-mono text-sm font-black text-slate-100">(0, {fmt(b)})</p>
            </div>
            <div className="rounded-xl border-2 border-amber-400/60 bg-amber-400/[0.12] p-2 text-center">
              <p className="text-[11px] text-amber-200">C (AB 의 중점)</p>
              <p className="font-mono text-sm font-black text-amber-100">
                ({fmt(mx)}, {fmt(my)})
              </p>
            </div>
          </div>

          <div className={"rounded-2xl border-2 p-3 text-center " + E_CHIP[k]}>
            <p className="font-mono text-sm">
              <Katex expr={`\\varepsilon_d = \\dfrac{${a} \\times ${fmt(x)}}{${fmt(q, 2)}}`} />
            </p>
            <p className="mt-1 font-mono text-3xl font-black">{fmt(e, 3)}</p>
            <div className="mt-1 flex justify-center">
              <EBadge e={e} />
            </div>
            <p className={"mt-1 text-xs font-bold " + E_TEXT[k]}>
              {Math.abs(t - 0.5) < 1e-9
                ? "t = 0.5 — 바로 중점이에요!"
                : t < 0.5
                  ? "중점보다 왼쪽이에요"
                  : "중점보다 오른쪽이에요"}
            </p>
          </div>

          <TipBox>
            a 나 b 를 바꿔도 t = 0.5 이면 늘 단위 탄력적이에요. 세 가지 이상의 수요곡선에서 확인해 보세요.
          </TipBox>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 flex items-center justify-between text-xs font-bold text-slate-300">
              <span>🎯 미션</span>
              <span className="font-mono text-slate-400">중점 확인 {Object.keys(pairs).length} 가지</span>
            </p>
            <GoalList items={MID_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner
        steps={MID_STEPS}
        accent="sky"
        finale="일차 수요곡선의 단위 탄력점은 늘 선분 AB 의 중점이에요. 왼쪽 절반은 비탄력적, 오른쪽 절반은 탄력적이지요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 탄력성 자취 그리기
// ══════════════════════════════════════════════════════════════
function TraceTab() {
  const [ti, setTi] = useState(0);
  const [t, setT] = useState(TRACE_FNS[0].from);
  const [reach, setReach] = useState<Record<string, number>>({});
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(TRACE_FNS[0].from);

  const g = TRACE_FNS[ti];
  const e = pointE(g.side, g.f, g.d1, t);
  const far = Math.max(reach[g.id] ?? g.from, g.from);
  const full = far >= g.to - 1e-9;

  const gid = g.id;
  const gTo = g.to;
  const gFrom = g.from;
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const nv = Math.min(gTo, Number((tRef.current + TRACE_STEP).toFixed(4)));
      tRef.current = nv;
      setT(nv);
      setReach((z) => ({ ...z, [gid]: Math.max(z[gid] ?? gFrom, nv) }));
      if (nv >= gTo - 1e-9) setPlaying(false);
    }, 70);
    return () => window.clearInterval(id);
  }, [playing, gid, gTo, gFrom]);

  const advance = (nt: number) => {
    tRef.current = nt;
    setT(nt);
    setReach((z) => ({ ...z, [g.id]: Math.max(z[g.id] ?? g.from, nt) }));
  };

  const eAt = (v: number) => pointE(g.side, g.f, g.d1, v);
  const traceDots: PlotDot[] = [];
  for (let v = g.from; v <= far + 1e-9; v += TRACE_STEP * 2) {
    const y = eAt(v);
    if (y >= g.ebox.yMin && y <= g.ebox.yMax) traceDots.push({ x: Number(v.toFixed(4)), y, tone: "trace", small: true });
  }
  traceDots.push({ x: t, y: e, tone: "live" });

  const crossed = g.unitX !== null && far >= g.unitX - 1e-9;
  const noCross = TRACE_FNS.some((z) => z.unitX === null && (reach[z.id] ?? z.from) >= z.to - 1e-9);
  const goals = [
    full,
    TRACE_FNS.some((z) => z.unitX !== null && (reach[z.id] ?? z.from) >= z.unitX - 1e-9),
    noCross,
    TRACE_FNS.every((z) => (reach[z.id] ?? z.from) >= z.to - 1e-9),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TRACE_FNS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === ti}
            accent="violet"
            onClick={() => {
              setTi(i);
              setT(z.from);
              tRef.current = z.from;
              setPlaying(false);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
            {(reach[z.id] ?? z.from) >= z.to - 1e-9 ? <span className="ml-1 text-emerald-300">✅</span> : null}
          </PickButton>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-violet-400/25 bg-violet-500/[0.06] p-4">
        <p className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-300">
          <span>가격 t 를 끌면 점 B(t, ε(t)) 가 자취를 남겨요</span>
          <span className="font-mono text-slate-100">
            t = {fmt(t)} · ε = {fmt(e, 3)}
          </span>
        </p>
        <input
          type="range"
          min={g.from}
          max={g.to}
          step={TRACE_STEP}
          value={t}
          onChange={(ev) => {
            setPlaying(false);
            advance(Number(ev.target.value));
          }}
          className={RANGE_BASE + ACC_RANGE.violet}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!playing && t >= g.to - 1e-9) {
                setT(g.from);
                tRef.current = g.from;
              }
              setPlaying(!playing);
            }}
            className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition " + ACC_BTN.violet}
          >
            {playing ? "⏸ 멈춤" : t >= g.to - 1e-9 ? "↩️ 처음부터" : "▶ 자동으로 그리기"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setT(g.from);
              tRef.current = g.from;
              setReach((z) => ({ ...z, [g.id]: g.from }));
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            🧽 자취 지우기
          </button>
          <span className="font-mono text-xs text-slate-400">
            자취 {Math.round(((far - g.from) / (g.to - g.from)) * 100)}%
          </span>
          {crossed ? <span className="text-xs font-bold text-amber-300">⚖️ 자취가 y = 1 을 지났어요</span> : null}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-sky-200">
            <Katex expr={g.tex} />
          </p>
          <div className="mx-auto w-4/5">
            <Plot
              box={g.box}
              uid={`tf-${g.id}`}
              segs={lines(samplePath(g.f, g.from, g.to, g.box), "curve")}
              dots={[{ x: t, y: g.f(t), tone: "live", label: "A" }]}
              vlines={[{ at: t, tone: "guide" }]}
              axis={["가격", g.side === "demand" ? "수요량" : "공급량"]}
            />
          </div>
          <p className="text-center text-[11px] text-slate-400">점 A 는 곡선 위를 움직여요</p>
        </div>
        <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-violet-200">
            <Katex expr={`\\varepsilon(x) = ${g.side === "demand" ? "-" : ""}\\dfrac{x f'(x)}{f(x)}`} />
          </p>
          <div className="mx-auto w-4/5">
            <Plot
              box={g.ebox}
              uid={`te-${g.id}`}
              segs={[]}
              dots={traceDots}
              vlines={[{ at: t, tone: "guide" }]}
              hlines={[{ at: 1, tone: "hot", solid: true }]}
              axis={["가격", "탄력성"]}
            />
          </div>
          <p className="text-center text-[11px] text-slate-400">점 B 가 남긴 자취 · 노란 선이 y = 1</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <EBadge e={e} />
        <span className="font-mono text-sm text-slate-300">
          <Katex expr={g.dtex} />
        </span>
      </div>

      <TipBox>{g.note}</TipBox>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
        <GoalList items={TRACE_GOALS} done={goals} />
      </div>

      <StepRunner
        steps={TRACE_STEPS}
        accent="violet"
        finale="탄력성도 가격에 대한 하나의 함수예요. 그 그래프가 y = 1 과 만나는 자리가 단위 탄력 가격이지요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 탄력성 사격장
// ══════════════════════════════════════════════════════════════
function RangeTab() {
  const [ri, setRi] = useState(0);
  const [gi, setGi] = useState(0);
  const [x, setX] = useState(RANGES[0].from);
  const [hits, setHits] = useState<Record<string, boolean>>({});

  const g = RANGES[ri];
  const target = g.targets[Math.min(gi, g.targets.length - 1)];
  const e = pointE(g.side, g.f, g.d1, x);
  const k = eKind(e);
  const hit = Math.abs(x - target.x) < 1e-6;

  const shoot = (fn: typeof g, idx: number, nx: number) => {
    if (Math.abs(nx - fn.targets[idx].x) < 1e-6) {
      setHits((z) => (z[`${fn.id}:${idx}`] ? z : { ...z, [`${fn.id}:${idx}`]: true }));
    }
  };

  const mine = g.targets.filter((_, i) => hits[`${g.id}:${i}`]).length;
  const total = RANGES.reduce((n, z) => n + z.targets.filter((_, i) => hits[`${z.id}:${i}`]).length, 0);
  const allN = RANGES.reduce((n, z) => n + z.targets.length, 0);
  const goals = [mine === g.targets.length, total === allN];

  const eAt = (v: number) => pointE(g.side, g.f, g.d1, v);
  const traceDots: PlotDot[] = [];
  for (let v = g.from; v <= g.to + 1e-9; v += RANGE_STEP * 2) {
    const y = eAt(v);
    if (y >= g.ebox.yMin && y <= g.ebox.yMax) traceDots.push({ x: Number(v.toFixed(4)), y, tone: "trace", small: true });
  }
  traceDots.push({ x, y: e, tone: hit ? "goal" : "live" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((z, i) => (
            <PickButton
              key={z.id}
              active={i === ri}
              accent="emerald"
              onClick={() => {
                setRi(i);
                setGi(0);
                setX(z.from);
              }}
            >
              <span className="mr-1">{z.emoji}</span>
              {z.title}
              {z.targets.every((_, j) => hits[`${z.id}:${j}`]) ? <span className="ml-1 text-emerald-300">✅</span> : null}
            </PickButton>
          ))}
        </div>
        <span className="font-mono text-xs text-slate-400">
          명중 {total} / {allN}
        </span>
      </div>

      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-4">
        <p className="mb-2 text-xs font-bold text-emerald-200">🎯 목표 탄력성을 고르고 그 가격을 맞혀 보세요</p>
        <div className="flex flex-wrap gap-2">
          {g.targets.map((z, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setGi(i)}
              className={
                "rounded-xl border-2 px-4 py-2 font-mono text-sm font-bold transition " +
                (hits[`${g.id}:${i}`]
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : i === gi
                    ? ACC_CHIP.emerald
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {hits[`${g.id}:${i}`] ? "✅ " : ""}
              ε = {fmt(z.e, 2)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-sky-200">
            <Katex expr={g.tex} />
          </p>
          <div className="mx-auto w-4/5">
            <Plot
              box={g.box}
              uid={`rf-${g.id}`}
              segs={lines(samplePath(g.f, g.from, g.to, g.box), "curve")}
              dots={[{ x, y: g.f(x), tone: hit ? "goal" : "live" }]}
              vlines={[{ at: x, tone: "guide" }]}
              axis={["가격", g.side === "demand" ? "수요량" : "공급량"]}
            />
          </div>
        </div>
        <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-violet-200">탄력성의 자취</p>
          <div className="mx-auto w-4/5">
            <Plot
              box={g.ebox}
              uid={`re-${g.id}`}
              segs={[]}
              dots={traceDots}
              vlines={[{ at: x, tone: "guide" }]}
              hlines={[
                { at: 1, tone: "hot", solid: true },
                { at: target.e, tone: "goal", solid: true },
              ]}
              axis={["가격", "탄력성"]}
            />
          </div>
          <p className="text-center text-[11px] text-slate-400">초록 선이 목표 · 노란 선이 y = 1</p>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="flex flex-wrap justify-between gap-2 text-xs font-bold text-slate-300">
          <span>가격을 움직여 목표에 맞춰 보세요</span>
          <span className="font-mono text-slate-100">x = {fmt(x)}</span>
        </p>
        <input
          type="range"
          min={g.from}
          max={g.to}
          step={RANGE_STEP}
          value={x}
          onChange={(ev) => {
            const nx = Number(ev.target.value);
            setX(nx);
            shoot(g, gi, nx);
          }}
          className={RANGE_BASE + ACC_RANGE.emerald}
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
            <p className="text-[11px] text-slate-400">목표</p>
            <p className="font-mono text-lg font-black text-emerald-300">{fmt(target.e, 2)}</p>
          </div>
          <div className={"rounded-xl border-2 p-2 text-center " + E_CHIP[k]}>
            <p className="text-[11px] opacity-80">지금</p>
            <p className="font-mono text-lg font-black">{fmt(e, 3)}</p>
          </div>
          <div
            className={
              "rounded-xl border-2 p-2 text-center " +
              (hit ? "border-emerald-400/70 bg-emerald-400/[0.15]" : "border-white/10 bg-white/[0.03]")
            }
          >
            <p className="text-[11px] text-slate-400">조준</p>
            <p className={"text-lg font-black " + (hit ? "text-emerald-200" : "text-slate-300")}>
              {hit ? "🎯 명중!" : e < target.e ? "➡️ 올리기" : "⬅️ 내리기"}
            </p>
          </div>
        </div>
        <div className="min-h-[34px]">
          {hit ? (
            <Verdict ok>
              x = {fmt(target.x)} 에서 ε = {fmt(target.e, 2)} 예요. 자취가 초록 선과 만나는 자리지요.
            </Verdict>
          ) : (
            <TipBox>오른쪽 자취에서 초록 선과 만나는 점의 가로 좌표를 읽어 보세요.</TipBox>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
        <GoalList items={RANGE_GOALS} done={goals} />
      </div>

      <StepRunner
        steps={RANGE_STEPS}
        accent="emerald"
        finale="탄력성의 자취를 읽을 수 있으면 '어느 가격에서 얼마나 민감한가' 를 한눈에 알 수 있어요."
      />
    </div>
  );
}
