"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  E_EMOJI,
  E_LABEL,
  E_WHY,
  GOODS,
  GOODS_GOALS,
  GOODS_STEPS,
  GOODS_UP,
  JUDGE_FNS,
  JUDGE_GOALS,
  JUDGE_STEPS,
  LIMIT_FNS,
  LIMIT_GOALS,
  LIMIT_RATES,
  LIMIT_STEPS,
  REAL_NOTE,
  REV_FNS,
  REV_GOALS,
  REV_STEPS,
  SALE_GOALS,
  SALE_ITEMS,
  SALE_RATES,
  SALE_STEPS,
  arcE,
  eKind,
  fmt,
  pct,
  pointE,
  samplePath,
  won,
  type Box,
  type EKind,
  type Piece,
  type Step,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "two_formulas",
    prompt:
      "②에서 할인폭을 0.1%까지 줄였더니 구간 탄력성이 한 수에 모였어요. 그 수가 왜 −x f′(x)/f(x) 가 되는지 자기 말로 쓰고, '곧은 수요'는 왜 처음부터 그 값과 같았는지도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 두 변화율의 비를 (Δq/Δx)×(x₀/q₀) 로 고쳐 쓰면, 할인폭을 줄일 때 Δq/Δx 가 접선의 기울기 f′(x₀) 로 가까워져서 그 식이 된다. 일차함수는 Δq/Δx 가 폭과 상관없이 기울기 그대로라 처음부터 같았다.",
  },
  {
    id: "same_good_differs",
    prompt:
      "③에서 같은 수요함수인데도 가격에 따라 탄력적이 되기도 비탄력적이 되기도 했어요. 그 까닭을 식으로 설명하고, ④에서 수입이 가장 커지는 가격이 e = 1 인 가격과 같았던 까닭도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: e 식에 x 와 f(x) 가 들어 있어서 값이 오르면 분자는 커지고 분모는 작아져 e 가 커진다. 수입 R = x f(x) 를 미분하면 f(x)(1 − e) 라서, e 가 1 을 지나는 자리에서 기울기가 0 이 되어 꼭대기가 된다.",
  },
  {
    id: "substitutes",
    prompt:
      "⑤에서 여덟 가지를 탄력·비탄력으로 갈라 보았어요. 대체재가 많으면 왜 탄력적이 되는지 쓰고, 내 주변에서 비탄력적이라고 생각하는 것을 하나 들어 그 까닭을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 값이 오르면 바꿔 탈 데가 있으니 사람들이 쉽게 떠나서 수요량이 크게 준다. 나는 학교 급식비가 비탄력적이라고 생각하는데, 다른 데서 점심을 해결하기 어렵기 때문이다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "sale" | "limit" | "judge" | "rev" | "goods";

export default function ElasticityLab() {
  const [tab, setTab] = useState<Tab>("sale");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🎈 수요의 가격 탄력성</h3>
        <p className="mt-2 leading-7 text-slate-300">
          값을 내리면 얼마나 더 팔릴까요? <b className="text-sky-200">두 변화율의 비</b>로 민감함을 재어 보고, 할인폭을
          좁혀 <b className="text-violet-200">미분을 쓴 식</b>에 닿은 뒤, 사장님이 되어{" "}
          <b className="text-emerald-200">가장 많이 버는 가격</b>을 찾아봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "sale"} onClick={() => setTab("sale")}>① 할인 실험실</TabButton>
        <TabButton active={tab === "limit"} onClick={() => setTab("limit")}>② 좁혀 보기</TabButton>
        <TabButton active={tab === "judge"} onClick={() => setTab("judge")}>③ 탄력성 판별기</TabButton>
        <TabButton active={tab === "rev"} onClick={() => setTab("rev")}>④ 사장님의 선택</TabButton>
        <TabButton active={tab === "goods"} onClick={() => setTab("goods")}>⑤ 대체재 창고</TabButton>
      </div>

      <div className="mt-4">
        {tab === "sale" ? <SaleTab /> : null}
        {tab === "limit" ? <LimitTab /> : null}
        {tab === "judge" ? <JudgeTab /> : null}
        {tab === "rev" ? <RevTab /> : null}
        {tab === "goods" ? <GoodsTab /> : null}
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

type Stroke = "line" | "elastic" | "inelastic" | "rev" | "ghost";
const STROKE_COLOR: Record<Stroke, string> = {
  line: "#38bdf8",
  elastic: "#fb7185",
  inelastic: "#38bdf8",
  rev: "#34d399",
  ghost: "rgba(148,163,184,0.35)",
};

type DotTone = "live" | "unit" | "best" | "ghost";
const DOT_COLOR: Record<DotTone, string> = {
  live: "#f472b6",
  unit: "#fbbf24",
  best: "#34d399",
  ghost: "#94a3b8",
};

type RuleTone = "guide" | "hot";
const RULE_COLOR: Record<RuleTone, string> = {
  guide: "rgba(148,163,184,0.45)",
  hot: "rgba(251,191,36,0.6)",
};

type PlotSeg = { tone: Stroke; pts: [number, number][] };
type PlotDot = { x: number; y: number; tone: DotTone; label?: string; filled?: boolean };
type PlotRule = { at: number; tone: RuleTone };

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
  const cid = `el-${uid}`;

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
    <svg viewBox={`0 0 ${PS} ${PS}`} className="w-full" role="img" aria-label="수요곡선">
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
          <line key={`hl${i}`} x1={PML} y1={Y(h.at)} x2={PS - PMR} y2={Y(h.at)} stroke={RULE_COLOR[h.tone]} strokeDasharray="4 3" />
        ))}
        {vlines.map((v, i) => (
          <line key={`vl${i}`} x1={X(v.at)} y1={PMT} x2={X(v.at)} y2={PS - PMB} stroke={RULE_COLOR[v.tone]} strokeDasharray="4 3" />
        ))}
        {segs.map((s, i) => (
          <polyline
            key={`sg${i}`}
            points={s.pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")}
            fill="none"
            stroke={STROKE_COLOR[s.tone]}
            strokeWidth={s.tone === "ghost" ? 1.6 : 2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>

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
//  공용 — 탄력성 배지 · 저울
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
const E_FILL: Record<EKind, string> = {
  elastic: "#fb7185",
  unit: "#fbbf24",
  inelastic: "#38bdf8",
};

function EBadge({ e }: { e: number }) {
  const k = eKind(e);
  return (
    <span className={"rounded-xl border-2 px-3 py-1.5 text-sm font-black " + E_CHIP[k]}>
      {E_EMOJI[k]} {E_LABEL[k]}
    </span>
  );
}

/** 1 을 기준으로 삼는 탄력성 저울 */
function EGauge({ e }: { e: number }) {
  const k = eKind(e);
  const EMAX = 4;
  const X = (v: number) => 20 + (Math.min(EMAX, Math.max(0, v)) / EMAX) * 260;
  return (
    <svg viewBox="0 0 300 62" className="w-full" role="img" aria-label="탄력성 저울">
      <rect x={X(0)} y="22" width={X(1) - X(0)} height="14" rx="3" fill="rgba(56,189,248,0.35)" />
      <rect x={X(1)} y="22" width={X(EMAX) - X(1)} height="14" rx="3" fill="rgba(251,113,133,0.35)" />
      <line x1={X(1)} y1="16" x2={X(1)} y2="42" stroke="#fbbf24" strokeWidth="2.5" />
      <text x={X(1)} y="54" textAnchor="middle" fontSize="9" fill="#fbbf24">
        1
      </text>
      <text x={X(0)} y="54" textAnchor="middle" fontSize="9" fill="#64748b">
        0
      </text>
      <text x={X(EMAX)} y="54" textAnchor="middle" fontSize="9" fill="#64748b">
        {EMAX}+
      </text>
      <text x={X(0.5)} y="15" textAnchor="middle" fontSize="9" fill="#7dd3fc">
        비탄력적
      </text>
      <text x={X(2.5)} y="15" textAnchor="middle" fontSize="9" fill="#fda4af">
        탄력적
      </text>
      <polygon points={`${X(e)},18 ${X(e) - 6},6 ${X(e) + 6},6`} fill={E_FILL[k]} />
      <circle cx={X(e)} cy="29" r="6" fill={E_FILL[k]} stroke="#0b1220" strokeWidth="2" />
    </svg>
  );
}

/** 가격과 판매량이 얼마나 움직였는지 막대로 */
function ChangeBars({ dPrice, dQty }: { dPrice: number; dQty: number }) {
  const base = 70;
  const y0 = 150;
  const bar = (x: number, ratio: number, fill: string) => {
    const h = Math.max(2, base * ratio);
    return <rect x={x} y={y0 - h} width="34" height={h} rx="3" fill={fill} />;
  };
  const pr = 1 + dPrice;
  const qr = 1 + dQty;
  return (
    <svg viewBox="0 0 300 180" className="w-full max-w-[320px]" role="img" aria-label="가격과 판매량의 변화">
      <line x1="10" y1={y0} x2="290" y2={y0} stroke="rgba(255,255,255,0.2)" />
      {bar(28, 1, "rgba(56,189,248,0.35)")}
      {bar(72, pr, "#38bdf8")}
      {bar(178, 1, "rgba(251,146,60,0.35)")}
      {bar(222, qr, "#fb923c")}
      <text x="62" y="168" textAnchor="middle" fontSize="11" fill="#7dd3fc">
        가격
      </text>
      <text x="212" y="168" textAnchor="middle" fontSize="11" fill="#fdba74">
        판매량
      </text>
      <text x="45" y={y0 - base - 6} textAnchor="middle" fontSize="8" fill="#64748b">
        전
      </text>
      <text x="195" y={y0 - base - 6} textAnchor="middle" fontSize="8" fill="#64748b">
        전
      </text>
      <text x="89" y={y0 - Math.max(2, base * pr) - 8} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#38bdf8">
        {pct(dPrice)}
      </text>
      <text x="239" y={y0 - Math.max(2, base * qr) - 8} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fb923c">
        {pct(dQty)}
      </text>
      <text x="132" y="96" textAnchor="middle" fontSize="20" fill="#38bdf8">
        ↓
      </text>
      <text x="282" y="96" textAnchor="middle" fontSize="20" fill="#fb923c">
        ↑
      </text>
    </svg>
  );
}

function lines(paths: [number, number][][], tone: Stroke): PlotSeg[] {
  return paths.map((pts) => ({ tone, pts }));
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 할인 실험실
// ══════════════════════════════════════════════════════════════
function SaleTab() {
  const [si, setSi] = useState(0);
  const [ri, setRi] = useState(1);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [rates, setRates] = useState<Record<string, boolean>>({});

  const it = SALE_ITEMS[si];
  const rate = SALE_RATES[ri];
  const x0 = it.x0;
  const x1 = Number((x0 * (1 - rate / 100)).toFixed(4));
  const q0 = it.f(x0);
  const q1 = it.f(x1);
  const dPrice = (x1 - x0) / x0;
  const dQty = (q1 - q0) / q0;
  const e = arcE(it.f, x0, x1);
  const k = eKind(e);

  const mark = (idx: number, r: number) => {
    const z = SALE_ITEMS[idx];
    const ee = arcE(z.f, z.x0, z.x0 * (1 - r / 100));
    setSeen((old) => (old[eKind(ee)] ? old : { ...old, [eKind(ee)]: true }));
    setRates((old) => (old[`${z.id}:${r}`] ? old : { ...old, [`${z.id}:${r}`]: true }));
  };

  const tried = SALE_RATES.filter((r) => rates[`${it.id}:${r}`]).length;
  const goals = [seen.elastic === true, seen.inelastic === true, seen.unit === true, tried >= 2];

  const segs: PlotSeg[] = lines(samplePath(it.f, 0, it.box.xMax, it.box), "line");
  const dots: PlotDot[] = [
    { x: x0, y: q0, tone: "ghost", filled: false, label: "할인 전" },
    { x: x1, y: q1, tone: "live", label: "할인 후" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SALE_ITEMS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === si}
            accent="sky"
            onClick={() => {
              setSi(i);
              mark(i, rate);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
          </PickButton>
        ))}
      </div>

      <div className="rounded-2xl border border-sky-400/25 bg-sky-500/[0.06] p-4">
        <p className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-sky-200">
          <span>얼마나 깎아 볼까요?</span>
          <span className="font-mono text-slate-100">
            {fmt(x0)} → {fmt(x1)} 천원
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {SALE_RATES.map((r, i) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRi(i);
                mark(si, r);
              }}
              className={
                "rounded-xl border-2 px-4 py-2 text-sm font-bold transition " +
                (i === ri ? ACC_CHIP.sky : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {r}% 할인
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-sky-200">
            <Katex expr={it.tex} />
          </p>
          <Plot
            box={it.box}
            uid={`sale-${it.id}`}
            segs={segs}
            dots={dots}
            vlines={[{ at: x1, tone: "guide" }]}
            axis={["가격 (천원)", "수요량 (개)"]}
          />
          <div className="flex justify-center">
            <ChangeBars dPrice={dPrice} dQty={dQty} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-bold text-slate-300">🧮 두 변화율을 견줘 봐요</p>
            <table className="w-full border-collapse text-left text-sm">
              <tbody>
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-2 font-normal text-slate-400">가격</th>
                  <td className="py-2 font-mono text-slate-200">
                    {fmt(x0)} → {fmt(x1)}
                  </td>
                  <td className="py-2 text-right font-mono font-bold text-sky-200">{pct(dPrice)}</td>
                </tr>
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-2 font-normal text-slate-400">판매량</th>
                  <td className="py-2 font-mono text-slate-200">
                    {fmt(q0)} → {fmt(q1)}
                  </td>
                  <td className="py-2 text-right font-mono font-bold text-orange-300">{pct(dQty)}</td>
                </tr>
                <tr>
                  <th className="py-2 pr-2 font-normal text-slate-400">
                    <Katex expr="\varepsilon_d" />
                  </th>
                  <td className="py-2 font-mono text-xs text-slate-400">
                    -({pct(dQty, 2)}) ÷ ({pct(dPrice, 2)})
                  </td>
                  <td className={"py-2 text-right font-mono text-2xl font-black " + E_TEXT[k]}>{fmt(e, 3)}</td>
                </tr>
              </tbody>
            </table>
            <EGauge e={e} />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <EBadge e={e} />
              <span className="text-xs leading-6 text-slate-300">{E_WHY[k]}</span>
            </div>
          </div>

          <TipBox>{it.note}</TipBox>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={SALE_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner
        steps={SALE_STEPS}
        accent="sky"
        finale="수요의 가격 탄력성은 '수요량이 몇 % 움직였나' 를 '가격이 몇 % 움직였나' 로 나눈 값이에요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 좁혀 보기
// ══════════════════════════════════════════════════════════════
/** 두 수가 앞에서부터 몇 글자나 같은지 — 수렴을 눈에 띄게 하려고 쓴다 */
function sharedPrefix(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

function ValueCell({ value, goal }: { value: number; goal: string }) {
  const s = fmt(value, 6);
  const n = sharedPrefix(s, goal);
  return (
    <span className="font-mono text-[11px] tabular-nums">
      <span className="font-bold text-emerald-300">{s.slice(0, n)}</span>
      <span className="text-slate-400">{s.slice(n)}</span>
    </span>
  );
}

function LimitTab() {
  const [li, setLi] = useState(1);
  const [step, setStep] = useState(1);
  const [deep, setDeep] = useState<Record<string, boolean>>({});

  const g = LIMIT_FNS[li];
  const pe = pointE(g.f, g.d1, g.x0);
  const goal = fmt(pe, 6);

  const rows = LIMIT_RATES.slice(0, step).map((r) => {
    const x1 = g.x0 * (1 - r / 100);
    return { r, x1, q1: g.f(x1), e: arcE(g.f, g.x0, x1) };
  });
  const last = rows[rows.length - 1];

  const flat = LIMIT_FNS.filter((z) => Math.abs(arcE(z.f, z.x0, z.x0 * 0.8) - pointE(z.f, z.d1, z.x0)) < 1e-9);
  const goals = [
    step >= LIMIT_RATES.length,
    Object.keys(deep).some((id) => flat.some((z) => z.id === id)),
    LIMIT_FNS.every((z) => deep[z.id]),
  ];

  const segs: PlotSeg[] = lines(samplePath(g.f, g.from, g.to, g.box), "line");
  const dots: PlotDot[] = [
    { x: g.x0, y: g.f(g.x0), tone: "unit", label: "x₀" },
    { x: last.x1, y: last.q1, tone: "live" },
  ];

  const widen = (n: number) => {
    setStep(n);
    if (n >= LIMIT_RATES.length) setDeep((z) => (z[g.id] ? z : { ...z, [g.id]: true }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {LIMIT_FNS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === li}
            accent="violet"
            onClick={() => {
              setLi(i);
              setStep(1);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
            {deep[z.id] ? <span className="ml-1 text-emerald-300">✅</span> : null}
          </PickButton>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-violet-200">
            <Katex expr={g.tex} />
          </p>
          <Plot
            box={g.box}
            uid={`lim-${g.id}`}
            segs={segs}
            dots={dots}
            vlines={[{ at: g.x0, tone: "hot" }]}
            axis={["가격 (천원)", "수요량 (개)"]}
          />
          <p className="text-center font-mono text-[11px] text-slate-400">
            x₀ = {fmt(g.x0)} · f(x₀) = {fmt(g.f(g.x0), 3)}
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-3 rounded-2xl border border-violet-400/25 bg-violet-500/[0.06] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={step >= LIMIT_RATES.length}
                onClick={() => widen(step + 1)}
                className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.violet}
              >
                🔎 할인폭을 더 줄이기
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                ↩️ 처음부터
              </button>
              <span className="font-mono text-xs text-slate-400">
                {step} / {LIMIT_RATES.length} 단계
              </span>
            </div>

            <div className="overflow-x-auto overflow-y-hidden py-1">
              <table className="w-full min-w-[420px] border-collapse text-center text-xs">
                <tbody>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="px-2 py-1.5 font-normal">할인폭</th>
                    <th className="px-2 py-1.5 font-normal">가격 변화율</th>
                    <th className="px-2 py-1.5 font-normal">수요량 변화율</th>
                    <th className="px-2 py-1.5 font-normal">두 변화율의 비</th>
                  </tr>
                  {rows.map((z) => (
                    <tr key={z.r} className="border-b border-white/5">
                      <td className="px-2 py-1.5 font-mono text-slate-300">{fmt(z.r, 2)}%</td>
                      <td className="px-2 py-1.5 font-mono text-[11px] text-sky-200">{pct(-z.r / 100, 2)}</td>
                      <td className="px-2 py-1.5 font-mono text-[11px] text-orange-300">
                        {pct((z.q1 - g.f(g.x0)) / g.f(g.x0), 3)}
                      </td>
                      <td className="px-2 py-1.5">
                        <ValueCell value={z.e} goal={goal} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border-2 border-violet-400/45 bg-violet-400/[0.10] p-3 text-center">
              <p className="text-xs text-slate-300">미분으로 구한 점 탄력성</p>
              <p className="mt-1 text-sm font-bold text-violet-100">
                <Katex expr={`\\varepsilon_d = -\\dfrac{x f'(x)}{f(x)}`} />
              </p>
              <p className="mt-1 font-mono text-[11px] text-slate-400">
                <Katex expr={g.dtex} />
              </p>
              <p className="mt-1 font-mono text-2xl font-black text-violet-200">{fmt(pe, 4)}</p>
            </div>
          </div>

          <TipBox>{g.note}</TipBox>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={LIMIT_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner
        steps={LIMIT_STEPS}
        accent="violet"
        finale="두 변화율의 비를 (Δq/Δx)×(x₀/q₀) 로 고쳐 쓰고 Δx 를 0 으로 보내면 미분을 쓴 식이 나와요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 탄력성 판별기
// ══════════════════════════════════════════════════════════════
function JudgeTab() {
  const [ji, setJi] = useState(0);
  const [x, setX] = useState(JUDGE_FNS[0].from);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [sawConst, setSawConst] = useState(false);

  const g = JUDGE_FNS[ji];
  const e = pointE(g.f, g.d1, x);
  const k = eKind(e);

  const mark = (fn: typeof g, nx: number) => {
    const ee = pointE(fn.f, fn.d1, nx);
    setSeen((old) => (old[eKind(ee)] ? old : { ...old, [eKind(ee)]: true }));
    if (fn.constE !== null) setSawConst(true);
  };

  const goals = [seen.elastic === true, seen.inelastic === true, seen.unit === true, sawConst];

  const segs: PlotSeg[] =
    g.unitX !== null
      ? [
          ...lines(samplePath(g.f, g.from, g.unitX, g.box), "inelastic"),
          ...lines(samplePath(g.f, g.unitX, g.to, g.box), "elastic"),
        ]
      : lines(samplePath(g.f, g.from, g.to, g.box), g.constE !== null && g.constE > 1 ? "elastic" : "line");
  const dots: PlotDot[] = [{ x, y: g.f(x), tone: "live" }];
  if (g.unitX !== null) dots.push({ x: g.unitX, y: g.f(g.unitX), tone: "unit", filled: false, label: "e = 1" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {JUDGE_FNS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === ji}
            accent="amber"
            onClick={() => {
              setJi(i);
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
          <p className="text-center text-sm font-bold text-amber-200">
            <Katex expr={g.tex} />
          </p>
          <Plot
            box={g.box}
            uid={`jud-${g.id}`}
            segs={segs}
            dots={dots}
            vlines={[{ at: x, tone: "guide" }]}
            axis={["가격 (천원)", "수요량 (개)"]}
          />
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
            <span className="rounded-lg border border-sky-400/50 bg-sky-400/10 px-2 py-0.5 font-bold text-sky-200">
              파란 구간 = 비탄력적
            </span>
            <span className="rounded-lg border border-rose-400/50 bg-rose-400/10 px-2 py-0.5 font-bold text-rose-200">
              붉은 구간 = 탄력적
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-3 rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
            <p className="flex justify-between text-xs font-bold text-slate-300">
              <span>가격을 움직여 보세요</span>
              <span className="font-mono text-slate-100">x = {fmt(x)} 천원</span>
            </p>
            <input
              type="range"
              min={g.from}
              max={g.to}
              step={1}
              value={x}
              onChange={(ev) => {
                const nx = Number(ev.target.value);
                setX(nx);
                mark(g, nx);
              }}
              className={RANGE_BASE + ACC_RANGE.amber}
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
                <p className="text-[11px] text-slate-400">수요량 f(x)</p>
                <p className="font-mono text-lg font-black text-slate-100">{fmt(g.f(x), 2)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
                <p className="text-[11px] text-slate-400">판매액 x f(x)</p>
                <p className="font-mono text-lg font-black text-slate-100">{won(x * g.f(x))}</p>
              </div>
              <div className={"rounded-xl border-2 p-2 text-center " + E_CHIP[k]}>
                <p className="text-[11px] opacity-80">
                  <Katex expr="\varepsilon_d" />
                </p>
                <p className="font-mono text-lg font-black">{fmt(e, 3)}</p>
              </div>
            </div>
            <EGauge e={e} />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <EBadge e={e} />
              <span className="text-xs leading-6 text-slate-300">{E_WHY[k]}</span>
            </div>
          </div>

          <TipBox>{g.note}</TipBox>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={JUDGE_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner
        steps={JUDGE_STEPS}
        accent="amber"
        finale="일차 수요함수에서는 가격이 쌀수록 비탄력적, 비쌀수록 탄력적이고 꼭 한 점에서만 단위 탄력적이에요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 사장님의 선택
// ══════════════════════════════════════════════════════════════
function RevTab() {
  const [ri, setRi] = useState(0);
  const [x, setX] = useState(REV_FNS[0].from);
  const [best, setBest] = useState<Record<string, boolean>>({});

  const g = REV_FNS[ri];
  const e = pointE(g.f, g.d1, x);
  const k = eKind(e);
  const r = x * g.f(x);

  const move = (fn: typeof g, nx: number) => {
    if (Math.abs(nx - fn.best) < 1e-9) setBest((z) => (z[fn.id] ? z : { ...z, [fn.id]: true }));
  };

  const found = REV_FNS.filter((z) => best[z.id]).length;
  const goals = [found === REV_FNS.length, best[g.id] === true, Math.abs(e - 1) > 1e-9];

  const dSegs: PlotSeg[] = [
    ...lines(samplePath(g.f, g.from, g.best, g.box), "inelastic"),
    ...lines(samplePath(g.f, g.best, g.to, g.box), "elastic"),
  ];
  const rSegs: PlotSeg[] = lines(samplePath((v) => v * g.f(v), g.from, g.to, g.rbox), "rev");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {REV_FNS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === ri}
            accent="emerald"
            onClick={() => {
              setRi(i);
              setX(z.from);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
            {best[z.id] ? <span className="ml-1 text-emerald-300">✅</span> : null}
          </PickButton>
        ))}
      </div>

      <div className="space-y-3">
        <div className="space-y-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-4">
          <p className="flex flex-wrap justify-between gap-2 text-xs font-bold text-slate-300">
            <span>값을 매겨 보세요 — 가장 많이 버는 가격은?</span>
            <span className="font-mono text-slate-100">x = {fmt(x)} 천원</span>
          </p>
          <input
            type="range"
            min={g.from}
            max={g.to}
            step={1}
            value={x}
            onChange={(ev) => {
              const nx = Number(ev.target.value);
              setX(nx);
              move(g, nx);
            }}
            className={RANGE_BASE + ACC_RANGE.emerald}
          />
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <p className="text-[11px] text-slate-400">수요량</p>
              <p className="font-mono text-lg font-black text-slate-100">{fmt(g.f(x))}</p>
            </div>
            <div
              className={
                "rounded-xl border-2 p-2 text-center " +
                (Math.abs(x - g.best) < 1e-9
                  ? "border-emerald-400/70 bg-emerald-400/[0.15]"
                  : "border-white/10 bg-white/[0.03]")
              }
            >
              <p className="text-[11px] text-slate-400">수입 R = x f(x)</p>
              <p className="font-mono text-lg font-black text-emerald-200">{won(r)}</p>
            </div>
            <div className={"rounded-xl border-2 p-2 text-center " + E_CHIP[k]}>
              <p className="text-[11px] opacity-80">
                <Katex expr="\varepsilon_d" />
              </p>
              <p className="font-mono text-lg font-black">{fmt(e, 3)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <p className="text-[11px] text-slate-400">값을 올리면 수입은</p>
              <p className={"text-lg font-black " + E_TEXT[k]}>
                {k === "elastic" ? "줄어요 ↓" : k === "unit" ? "꼭대기 ⛰️" : "늘어요 ↑"}
              </p>
            </div>
          </div>
          <EGauge e={e} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-center text-sm font-bold text-sky-200">
              <Katex expr={g.tex} />
            </p>
            <div className="mx-auto w-4/5">
              <Plot
                box={g.box}
                uid={`rev-d-${g.id}`}
                segs={dSegs}
                dots={[
                  { x, y: g.f(x), tone: "live" },
                  { x: g.best, y: g.f(g.best), tone: "unit", filled: false, label: "e = 1" },
                ]}
                vlines={[{ at: x, tone: "guide" }]}
                axis={["가격 (천원)", "수요량 (개)"]}
              />
            </div>
            <p className="text-center text-[11px] text-slate-400">파란 구간 비탄력적 · 붉은 구간 탄력적</p>
          </div>
          <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-center text-sm font-bold text-emerald-200">
              <Katex expr={g.rtex} />
            </p>
            <div className="mx-auto w-4/5">
              <Plot
                box={g.rbox}
                uid={`rev-r-${g.id}`}
                segs={rSegs}
                dots={[
                  { x, y: r, tone: "live" },
                  { x: g.best, y: g.bestR, tone: "best", filled: false, label: `최대 ${won(g.bestR)}` },
                ]}
                vlines={[{ at: x, tone: "guide" }]}
                axis={["가격 (천원)", "수입"]}
              />
            </div>
            <p className="text-center text-[11px] text-slate-400">수입의 꼭대기가 e = 1 인 자리와 같아요</p>
          </div>
        </div>

        <TipBox>{g.note}</TipBox>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="mb-1 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>🎯 미션</span>
            <span className="font-mono text-slate-400">
              찾은 상품 {found} / {REV_FNS.length}
            </span>
          </p>
          <GoalList items={REV_GOALS} done={goals} />
        </div>
      </div>

      <StepRunner
        steps={REV_STEPS}
        accent="emerald"
        finale="R′(x) = f(x)(1 − e) 이므로 수입의 꼭대기는 언제나 e = 1 인 가격이에요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ 대체재 창고
// ══════════════════════════════════════════════════════════════
function GoodsTab() {
  const [picks, setPicks] = useState<Record<string, "elastic" | "inelastic">>({});
  const [misses, setMisses] = useState(0);

  const okCount = GOODS.filter((g) => picks[g.id] === eKind(-g.dq / GOODS_UP)).length;
  const allOk = okCount === GOODS.length;
  const goals = [allOk, allOk && misses <= 2];

  const choose = (id: string, v: "elastic" | "inelastic", truth: EKind) => {
    setPicks((z) => ({ ...z, [id]: v }));
    if (v !== truth && picks[id] !== v) setMisses((n) => n + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] p-4">
        <p className="text-sm font-bold text-rose-100">
          🏷️ 값을 <b className="text-amber-200">10% 올렸더니</b> 수요량이 이렇게 변했어요. 탄력적일까요, 비탄력적일까요?
        </p>
        <span className="font-mono text-xs text-slate-300">
          맞게 가른 것 {okCount} / {GOODS.length} · 틀린 횟수 {misses}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {GOODS.map((g) => {
          const e = -g.dq / GOODS_UP;
          const truth = eKind(e);
          const pick = picks[g.id];
          const ok = pick === truth;
          const dRev = 1.1 * (1 + g.dq) - 1;
          return (
            <div key={g.id} className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-100">
                  <span className="mr-1 text-lg">{g.emoji}</span>
                  {g.title}
                </p>
                <span className="rounded-lg border border-orange-400/50 bg-orange-400/10 px-2 py-0.5 font-mono text-xs font-bold text-orange-200">
                  수요량 {pct(g.dq, 0)}
                </span>
              </div>

              {pick ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="text-center font-mono text-xs text-slate-300">
                    <Katex expr="\varepsilon_d" /> = {fmt(-g.dq, 2)} ÷ 0.1 ={" "}
                    <b className={E_TEXT[truth]}>{fmt(e, 2)}</b>
                  </p>
                  <EGauge e={e} />
                </div>
              ) : null}

              <div className="flex gap-1.5">
                {(["elastic", "inelastic"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => choose(g.id, v, truth)}
                    className={
                      "flex-1 rounded-xl border-2 px-2 py-2 text-xs font-bold transition " +
                      (pick === v
                        ? v === truth
                          ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                          : "border-rose-400/60 bg-rose-400/15 text-rose-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                    }
                  >
                    {E_EMOJI[v]} {E_LABEL[v]}
                  </button>
                ))}
              </div>

              <div className="min-h-[34px]">
                {pick ? (
                  <Verdict ok={ok}>
                    {ok
                      ? `${g.why} 값을 10% 올리면 수입은 ${pct(dRev, 1)} — ${truth === "elastic" ? "줄어요" : "늘어요"}.`
                      : "수요량이 10% 보다 크게 움직였는지 작게 움직였는지 견줘 보세요."}
                  </Verdict>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {allOk ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-sm font-bold text-emerald-100">🎉 여덟 가지를 모두 갈랐어요!</p>
          <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-slate-200">
            바꿔 탈 데가 많은 상품일수록 탄력적이고, 대신할 것이 없는 상품일수록 비탄력적이에요. 그래서 탄력적인 상품은
            값을 올리면 수입이 줄고, 비탄력적인 상품은 값을 올리면 수입이 늘어요.
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
        <GoalList items={GOODS_GOALS} done={goals} />
      </div>

      <StepRunner
        steps={GOODS_STEPS}
        accent="rose"
        finale="대체재가 많으면 탄력적, 없으면 비탄력적. 그래서 값을 올려야 할 상품과 내려야 할 상품이 갈려요."
      />
    </div>
  );
}
