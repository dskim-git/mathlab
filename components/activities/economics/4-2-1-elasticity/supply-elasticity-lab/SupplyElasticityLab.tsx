"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  A_MAX,
  A_MIN,
  B_MAX,
  B_STEP,
  E_EMOJI,
  E_LABEL,
  E_WHY,
  GOODS,
  GOODS_GOALS,
  GOODS_STEPS,
  GOODS_UP,
  LIMIT_FNS,
  LIMIT_GOALS,
  LIMIT_RATES,
  LIMIT_STEPS,
  MAKERS,
  MAKER_GOALS,
  MAKER_STEPS,
  REAL_NOTE,
  SLOPE_GOALS,
  SLOPE_STEPS,
  SPANS,
  TIME_GOALS,
  TIME_GOODS,
  TIME_STEPS,
  TIME_UP,
  UP_RATES,
  X_VIEW,
  arcEs,
  bFloor,
  eKind,
  fmt,
  lineFromE,
  pct,
  pointEs,
  priceFloor,
  samplePath,
  supplyBox,
  type Box,
  type EKind,
  type Piece,
  type Step,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "no_minus",
    prompt:
      "수요의 가격 탄력성에는 앞에 음의 부호를 붙였는데 공급에는 붙이지 않았어요. 그 까닭을 자기 말로 쓰고, 두 탄력성이 '1을 기준으로 판별한다'는 점에서는 왜 같은지도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 값이 오르면 수요량은 줄고 공급량은 늘어서, 수요는 두 변화율의 부호가 반대라 음수가 되지만 공급은 이미 양수다. 둘 다 '가격이 움직인 것보다 양이 더 많이 움직였나'를 묻는 것이라 1과 견주는 것은 같다.",
  },
  {
    id: "intercept",
    prompt:
      "②에서 b를 움직였더니 판정이 통째로 바뀌었고, 가격을 아무리 바꿔도 판정은 그대로였어요. 일차 공급함수에서 판정이 b의 부호만으로 정해지는 까닭을 식으로 설명하고, 일차 수요함수와 무엇이 달랐는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: e = ax/(ax+b) 에서 b가 양수면 분모가 분자보다 커서 늘 1보다 작고, b가 음수면 분모가 더 작아 늘 1보다 크다. x가 분자와 분모에 함께 있어 약분되듯 사라지는 셈이다. 수요에서는 분모의 부호가 반대로 작용해 가격마다 판정이 달라졌다.",
  },
  {
    id: "time",
    prompt:
      "④에서 같은 상품인데 하루에서 한 해로 갈수록 공급곡선이 기준점을 축으로 가팔라졌어요. 그 까닭을 쓰고, 내 주변에서 '시간이 지나야 공급을 늘릴 수 있는 것'을 하나 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 시간이 있어야 심고 짓고 사람을 늘릴 수 있어서 같은 가격 변화에도 공급량을 더 크게 바꿀 수 있기 때문이다. 우리 동네 수영장 강습 자리는 강사를 더 뽑아야 늘어나서 당장은 비탄력적이다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "maker" | "slope" | "limit" | "time" | "goods";

export default function SupplyElasticityLab() {
  const [tab, setTab] = useState<Tab>("maker");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🚚 공급의 가격 탄력성</h3>
        <p className="mt-2 leading-7 text-slate-300">
          값이 오르면 얼마나 더 만들어 낼까요? <b className="text-sky-200">음의 부호가 없는 까닭</b>을 확인하고,{" "}
          <b className="text-amber-200">절편 하나</b>가 판정을 통째로 정한다는 공급만의 성질을 찾아낸 뒤,{" "}
          <b className="text-emerald-200">시간이 흐르면</b> 같은 상품도 탄력적이 되는 것을 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "maker"} onClick={() => setTab("maker")}>① 공장 실험실</TabButton>
        <TabButton active={tab === "slope"} onClick={() => setTab("slope")}>② 절편의 비밀</TabButton>
        <TabButton active={tab === "limit"} onClick={() => setTab("limit")}>③ 좁혀 보기</TabButton>
        <TabButton active={tab === "time"} onClick={() => setTab("time")}>④ 시간이 흐르면</TabButton>
        <TabButton active={tab === "goods"} onClick={() => setTab("goods")}>⑤ 조절 속도 창고</TabButton>
      </div>

      <div className="mt-4">
        {tab === "maker" ? <MakerTab /> : null}
        {tab === "slope" ? <SlopeTab /> : null}
        {tab === "limit" ? <LimitTab /> : null}
        {tab === "time" ? <TimeTab /> : null}
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

type Stroke = "line" | "ray" | "past" | "ghost" | "hot";
const STROKE_COLOR: Record<Stroke, string> = {
  line: "#34d399",
  ray: "#fbbf24",
  past: "rgba(52,211,153,0.28)",
  ghost: "rgba(148,163,184,0.35)",
  hot: "#f472b6",
};

type DotTone = "live" | "base" | "ghost";
const DOT_COLOR: Record<DotTone, string> = {
  live: "#f472b6",
  base: "#fbbf24",
  ghost: "#94a3b8",
};

type RuleTone = "guide" | "hot";
const RULE_COLOR: Record<RuleTone, string> = {
  guide: "rgba(148,163,184,0.45)",
  hot: "rgba(251,191,36,0.6)",
};

type PlotSeg = { tone: Stroke; pts: [number, number][]; dash?: boolean };
type PlotDot = { x: number; y: number; tone: DotTone; label?: string; filled?: boolean };
type PlotRule = { at: number; tone: RuleTone };

function Plot({
  box,
  segs,
  dots = [],
  vlines = [],
  uid,
  axis,
}: {
  box: Box;
  segs: PlotSeg[];
  dots?: PlotDot[];
  vlines?: PlotRule[];
  uid: string;
  axis?: [string, string];
}) {
  const pw = PS - PML - PMR;
  const ph = PS - PMT - PMB;
  const X = (v: number) => PML + ((v - box.xMin) / (box.xMax - box.xMin)) * pw;
  const Y = (v: number) => PS - PMB - ((v - box.yMin) / (box.yMax - box.yMin)) * ph;
  const cid = `sp-${uid}`;

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
    <svg viewBox={`0 0 ${PS} ${PS}`} className="w-full" role="img" aria-label="공급곡선">
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
        {vlines.map((v, i) => (
          <line key={`vl${i}`} x1={X(v.at)} y1={PMT} x2={X(v.at)} y2={PS - PMB} stroke={RULE_COLOR[v.tone]} strokeDasharray="4 3" />
        ))}
        {segs.map((s, i) => (
          <polyline
            key={`sg${i}`}
            points={s.pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")}
            fill="none"
            stroke={STROKE_COLOR[s.tone]}
            strokeWidth={s.tone === "ghost" || s.tone === "past" ? 1.8 : 2.6}
            strokeDasharray={s.dash ? "5 4" : undefined}
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
//  공용 — 탄력성 배지 · 저울 · 막대
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

/** 가격과 공급량이 얼마나 움직였는지 막대로 */
const BAR_BASE = 60;
function ChangeBars({ dPrice, dQty }: { dPrice: number; dQty: number }) {
  const y0 = 150;
  const bar = (x: number, ratio: number, fill: string) => {
    const h = Math.max(2, BAR_BASE * ratio);
    return <rect x={x} y={y0 - h} width="34" height={h} rx="3" fill={fill} />;
  };
  const pr = 1 + dPrice;
  const qr = 1 + dQty;
  return (
    <svg viewBox="0 0 300 180" className="w-full max-w-[320px]" role="img" aria-label="가격과 공급량의 변화">
      <line x1="10" y1={y0} x2="290" y2={y0} stroke="rgba(255,255,255,0.2)" />
      {bar(28, 1, "rgba(56,189,248,0.35)")}
      {bar(72, pr, "#38bdf8")}
      {bar(178, 1, "rgba(52,211,153,0.35)")}
      {bar(222, qr, "#34d399")}
      <text x="62" y="168" textAnchor="middle" fontSize="11" fill="#7dd3fc">
        가격
      </text>
      <text x="212" y="168" textAnchor="middle" fontSize="11" fill="#6ee7b7">
        공급량
      </text>
      <text x="45" y={y0 - BAR_BASE - 6} textAnchor="middle" fontSize="8" fill="#64748b">
        전
      </text>
      <text x="195" y={y0 - BAR_BASE - 6} textAnchor="middle" fontSize="8" fill="#64748b">
        전
      </text>
      <text x="89" y={y0 - Math.max(2, BAR_BASE * pr) - 8} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#38bdf8">
        {pct(dPrice)}
      </text>
      <text x="239" y={y0 - Math.max(2, BAR_BASE * qr) - 8} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#34d399">
        {pct(dQty)}
      </text>
      <text x="132" y="96" textAnchor="middle" fontSize="20" fill="#38bdf8">
        ↑
      </text>
      <text x="282" y="96" textAnchor="middle" fontSize="20" fill="#34d399">
        ↑
      </text>
    </svg>
  );
}

function lines(paths: [number, number][][], tone: Stroke, dash = false): PlotSeg[] {
  return paths.map((pts) => ({ tone, pts, dash }));
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 공장 실험실
// ══════════════════════════════════════════════════════════════
function MakerTab() {
  const [mi, setMi] = useState(0);
  const [ri, setRi] = useState(1);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [rates, setRates] = useState<Record<string, boolean>>({});

  const it = MAKERS[mi];
  const rate = UP_RATES[ri];
  const x0 = it.x0;
  const x1 = Number((x0 * (1 + rate / 100)).toFixed(4));
  const q0 = it.f(x0);
  const q1 = it.f(x1);
  const dPrice = (x1 - x0) / x0;
  const dQty = (q1 - q0) / q0;
  const e = arcEs(it.f, x0, x1);
  const k = eKind(e);

  const mark = (idx: number, r: number) => {
    const z = MAKERS[idx];
    const ee = arcEs(z.f, z.x0, z.x0 * (1 + r / 100));
    setSeen((old) => (old[eKind(ee)] ? old : { ...old, [eKind(ee)]: true }));
    setRates((old) => (old[`${z.id}:${r}`] ? old : { ...old, [`${z.id}:${r}`]: true }));
  };

  const tried = UP_RATES.filter((r) => rates[`${it.id}:${r}`]).length;
  const goals = [seen.elastic === true, seen.inelastic === true, seen.unit === true, tried >= 2];

  const segs: PlotSeg[] = lines(samplePath(it.f, it.from, it.to, it.box), "line");
  const dots: PlotDot[] = [
    { x: x0, y: q0, tone: "ghost", filled: false, label: "인상 전" },
    { x: x1, y: q1, tone: "live", label: "인상 후" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {MAKERS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === mi}
            accent="sky"
            onClick={() => {
              setMi(i);
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
          <span>값을 얼마나 올려 볼까요?</span>
          <span className="font-mono text-slate-100">
            {fmt(x0)} → {fmt(x1)} 천원
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {UP_RATES.map((r, i) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRi(i);
                mark(mi, r);
              }}
              className={
                "rounded-xl border-2 px-4 py-2 text-sm font-bold transition " +
                (i === ri ? ACC_CHIP.sky : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {r}% 인상
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-emerald-200">
            <Katex expr={it.tex} />
          </p>
          <Plot
            box={it.box}
            uid={`mk-${it.id}`}
            segs={segs}
            dots={dots}
            vlines={[{ at: x1, tone: "guide" }]}
            axis={["가격 (천원)", "공급량 (개)"]}
          />
          <div className="flex justify-center">
            <ChangeBars dPrice={dPrice} dQty={dQty} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-bold text-slate-300">🧮 두 변화율을 견줘 봐요 — 둘 다 양수예요</p>
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
                  <th className="py-2 pr-2 font-normal text-slate-400">공급량</th>
                  <td className="py-2 font-mono text-slate-200">
                    {fmt(q0)} → {fmt(q1)}
                  </td>
                  <td className="py-2 text-right font-mono font-bold text-emerald-300">{pct(dQty)}</td>
                </tr>
                <tr>
                  <th className="py-2 pr-2 font-normal text-slate-400">
                    <Katex expr="\varepsilon_s" />
                  </th>
                  <td className="py-2 font-mono text-xs text-slate-400">
                    ({pct(dQty, 2)}) ÷ ({pct(dPrice, 2)})
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
            <GoalList items={MAKER_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner
        steps={MAKER_STEPS}
        accent="sky"
        finale="공급의 가격 탄력성은 두 변화율을 그냥 나눈 값이에요. 부호가 이미 같아 음의 부호가 필요 없지요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 절편의 비밀
// ══════════════════════════════════════════════════════════════
const B_SIGN_TEXT: Record<string, string> = {
  neg: "b < 0 — 공급선이 가격축을 양수에서 잘라요",
  zero: "b = 0 — 공급선이 원점을 지나요",
  pos: "b > 0 — 공급선이 공급량축을 양수에서 잘라요",
};

function SlopeTab() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(-30);
  const [x, setX] = useState(20);
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [sweep, setSweep] = useState<{ key: string; lo: number; hi: number }>({ key: "3:-30", lo: 20, hi: 20 });

  const f = (v: number) => a * v + b;
  const lo = priceFloor(a, b);
  const px = Math.max(x, lo);
  const q = f(px);
  const e = (a * px) / q;
  const k = eKind(e);
  const box = supplyBox(a, b);
  const sign = b < 0 ? "neg" : b > 0 ? "pos" : "zero";

  const mark = (na: number, nb: number, nx: number) => {
    const nq = na * nx + nb;
    if (nq <= 0) return;
    const ne = (na * nx) / nq;
    setSeen((old) => (old[eKind(ne)] ? old : { ...old, [eKind(ne)]: true }));
    const key = `${na}:${nb}`;
    setSweep((old) =>
      old.key === key ? { key, lo: Math.min(old.lo, nx), hi: Math.max(old.hi, nx) } : { key, lo: nx, hi: nx },
    );
  };

  const goals = [
    seen.elastic === true,
    seen.inelastic === true,
    seen.unit === true,
    sweep.hi - sweep.lo >= 15 && b !== 0,
  ];

  const rayTo = Math.min(box.xMax, px * 1.6);
  const segs: PlotSeg[] = [
    ...lines(samplePath(f, 0, box.xMax, box), "line"),
    { tone: "ray", pts: [[0, 0], [rayTo, (q / px) * rayTo]], dash: true },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-emerald-200">
            <Katex expr={`f(x) = ${a}x ${b < 0 ? "-" : "+"} ${Math.abs(b)}`} />
          </p>
          <Plot
            box={box}
            uid="slope"
            segs={segs}
            dots={[{ x: px, y: q, tone: "live" }]}
            vlines={[{ at: px, tone: "guide" }]}
            axis={["가격 (천원)", "공급량 (개)"]}
          />
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
            <span className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 font-bold text-emerald-200">
              초록 = 공급선 (기울기 {fmt(a)})
            </span>
            <span className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 font-bold text-amber-200">
              노랑 = 원점선 (기울기 {fmt(q / px, 2)})
            </span>
          </div>
          <p className="text-center text-[11px] leading-5 text-slate-400">
            두 기울기의 비가 곧 탄력성이에요 — 공급선이 더 가파르면 탄력적이지요.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-3 rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
            <div>
              <p className="mb-1 flex justify-between text-xs font-bold text-slate-300">
                <span>기울기 a</span>
                <span className="font-mono text-slate-100">{fmt(a)}</span>
              </p>
              <input
                type="range"
                min={A_MIN}
                max={A_MAX}
                step={1}
                value={a}
                onChange={(ev) => {
                  const na = Number(ev.target.value);
                  const nb = Math.max(bFloor(na), b);
                  const nx = Math.max(priceFloor(na, nb), px);
                  setA(na);
                  setB(nb);
                  setX(nx);
                  mark(na, nb, nx);
                }}
                className={RANGE_BASE + ACC_RANGE.amber}
              />
            </div>
            <div>
              <p className="mb-1 flex justify-between text-xs font-bold text-slate-300">
                <span>절편 b</span>
                <span className="font-mono text-slate-100">{fmt(b)}</span>
              </p>
              <input
                type="range"
                min={bFloor(a)}
                max={B_MAX}
                step={B_STEP}
                value={b}
                onChange={(ev) => {
                  const nb = Number(ev.target.value);
                  const nx = Math.max(priceFloor(a, nb), px);
                  setB(nb);
                  setX(nx);
                  mark(a, nb, nx);
                }}
                className={RANGE_BASE + ACC_RANGE.amber}
              />
            </div>
            <div>
              <p className="mb-1 flex justify-between text-xs font-bold text-slate-300">
                <span>가격 x</span>
                <span className="font-mono text-slate-100">{fmt(px)} 천원</span>
              </p>
              <input
                type="range"
                min={lo}
                max={X_VIEW}
                step={1}
                value={px}
                onChange={(ev) => {
                  const nx = Number(ev.target.value);
                  setX(nx);
                  mark(a, b, nx);
                }}
                className={RANGE_BASE + ACC_RANGE.amber}
              />
            </div>
          </div>

          <div className={"rounded-2xl border-2 p-3 text-center " + E_CHIP[k]}>
            <p className="text-xs font-bold opacity-90">{B_SIGN_TEXT[sign]}</p>
            <p className="mt-1 font-mono text-sm">
              <Katex expr={`\\varepsilon_s = \\dfrac{${a} \\times ${fmt(px)}}{${fmt(q, 2)}}`} />
            </p>
            <p className="mt-1 font-mono text-3xl font-black">{fmt(e, 3)}</p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <EBadge e={e} />
            </div>
          </div>

          <EGauge e={e} />

          <div className="grid gap-2 sm:grid-cols-3">
            {(["neg", "zero", "pos"] as const).map((s) => (
              <div
                key={s}
                className={
                  "rounded-xl border-2 p-2 text-center text-[11px] leading-5 " +
                  (sign === s
                    ? s === "neg"
                      ? "border-rose-400/60 bg-rose-400/[0.12] text-rose-100"
                      : s === "zero"
                        ? "border-amber-400/60 bg-amber-400/[0.12] text-amber-100"
                        : "border-sky-400/60 bg-sky-400/[0.12] text-sky-100"
                    : "border-white/10 bg-white/[0.03] text-slate-400")
                }
              >
                <p className="font-mono font-bold">{s === "neg" ? "b < 0" : s === "zero" ? "b = 0" : "b > 0"}</p>
                <p className="mt-0.5 font-bold">
                  {s === "neg" ? "늘 탄력적" : s === "zero" ? "늘 단위 탄력적" : "늘 비탄력적"}
                </p>
              </div>
            ))}
          </div>

          <TipBox>
            b 를 그대로 둔 채 가격 손잡이를 끝에서 끝까지 끌어 보세요. 판정이 한 번이라도 바뀌나요?
          </TipBox>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={SLOPE_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner
        steps={SLOPE_STEPS}
        accent="amber"
        finale="공급에서는 '어디를 자르느냐(b)' 가 판정을 정해요. 가격을 아무리 바꿔도 판정은 그대로지요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 좁혀 보기
// ══════════════════════════════════════════════════════════════
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
  const [li, setLi] = useState(2);
  const [step, setStep] = useState(1);
  const [deep, setDeep] = useState<Record<string, boolean>>({});

  const g = LIMIT_FNS[li];
  const pe = pointEs(g.f, g.d1, g.x0);
  const goal = fmt(pe, 6);

  const rows = LIMIT_RATES.slice(0, step).map((r) => {
    const x1 = g.x0 * (1 + r / 100);
    return { r, x1, q1: g.f(x1), e: arcEs(g.f, g.x0, x1) };
  });
  const last = rows[rows.length - 1];

  const flat = LIMIT_FNS.filter((z) => Math.abs(arcEs(z.f, z.x0, z.x0 * 1.2) - pointEs(z.f, z.d1, z.x0)) < 1e-9);
  const goals = [
    step >= LIMIT_RATES.length,
    Object.keys(deep).some((id) => flat.some((z) => z.id === id)),
    LIMIT_FNS.every((z) => deep[z.id]),
  ];

  const segs: PlotSeg[] = lines(samplePath(g.f, g.from, g.to, g.box), "line");
  const dots: PlotDot[] = [
    { x: g.x0, y: g.f(g.x0), tone: "base", label: "x₀" },
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
            axis={["가격 (천원)", "공급량 (개)"]}
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
                🔎 인상폭을 더 줄이기
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
                    <th className="px-2 py-1.5 font-normal">인상폭</th>
                    <th className="px-2 py-1.5 font-normal">가격 변화율</th>
                    <th className="px-2 py-1.5 font-normal">공급량 변화율</th>
                    <th className="px-2 py-1.5 font-normal">두 변화율의 비</th>
                  </tr>
                  {rows.map((z) => (
                    <tr key={z.r} className="border-b border-white/5">
                      <td className="px-2 py-1.5 font-mono text-slate-300">{fmt(z.r, 2)}%</td>
                      <td className="px-2 py-1.5 font-mono text-[11px] text-sky-200">{pct(z.r / 100, 2)}</td>
                      <td className="px-2 py-1.5 font-mono text-[11px] text-emerald-300">
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
                <Katex expr={`\\varepsilon_s = \\dfrac{x f'(x)}{f(x)}`} />
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
        finale="수요와 똑같은 방법인데 음의 부호만 없어요. 멱함수라면 지수가 그대로 탄력성이 되지요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 시간이 흐르면
// ══════════════════════════════════════════════════════════════
function TimeTab() {
  const [gi, setGi] = useState(0);
  const [si, setSi] = useState(0);
  const [seen, setSeen] = useState<Record<string, boolean>>({});

  const g = TIME_GOODS[gi];
  const e = g.es[si];
  const k = eKind(e);
  const { a, b } = lineFromE(g.x0, g.q0, e);
  const f = (v: number) => a * v + b;
  const x1 = g.x0 * (1 + TIME_UP);
  const dQty = (f(x1) - g.q0) / g.q0;

  const mark = (gid: string, idx: number) => setSeen((z) => (z[`${gid}:${idx}`] ? z : { ...z, [`${gid}:${idx}`]: true }));

  const sawFull = TIME_GOODS.some((z) => seen[`${z.id}:${SPANS.length - 1}`]);
  const crossIdx = g.es.findIndex((v, i) => v >= 1 && (i === 0 || g.es[i - 1] < 1));
  const sawCross = TIME_GOODS.some((z) => {
    const c = z.es.findIndex((v, i) => v >= 1 && (i === 0 || z.es[i - 1] < 1));
    return c >= 0 && seen[`${z.id}:${c}`];
  });
  const sawStiff = TIME_GOODS.some((z) => z.es[SPANS.length - 1] < 1 && seen[`${z.id}:${SPANS.length - 1}`]);
  const sawAll = TIME_GOODS.every((z) => SPANS.some((_, i) => seen[`${z.id}:${i}`]));
  const goals = [sawFull, sawCross, sawStiff, sawAll];

  const segs: PlotSeg[] = [];
  g.es.forEach((ee, i) => {
    const c = lineFromE(g.x0, g.q0, ee);
    const fn = (v: number) => c.a * v + c.b;
    if (i !== si) segs.push(...lines(samplePath(fn, 0, g.box.xMax, g.box), "past"));
  });
  segs.push(...lines(samplePath(f, 0, g.box.xMax, g.box), "line"));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TIME_GOODS.map((z, i) => (
          <PickButton
            key={z.id}
            active={i === gi}
            accent="emerald"
            onClick={() => {
              setGi(i);
              setSi(0);
              mark(z.id, 0);
            }}
          >
            <span className="mr-1">{z.emoji}</span>
            {z.title}
          </PickButton>
        ))}
      </div>

      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-4">
        <p className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-emerald-200">
          <span>값이 20% 올랐어요. 얼마나 시간이 흘렀을까요?</span>
          <span className="font-mono text-slate-100">
            {fmt(g.x0)} → {fmt(x1)} 천원
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {SPANS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSi(i);
                mark(g.id, i);
              }}
              className={
                "rounded-xl border-2 px-4 py-2 text-sm font-bold transition " +
                (i === si ? ACC_CHIP.emerald : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {s}
              {i === crossIdx ? " 🚀" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-center text-sm font-bold text-emerald-200">
            <Katex expr={`f(x) = ${fmt(a)}x ${b < 0 ? "-" : "+"} ${fmt(Math.abs(b))}`} />
          </p>
          <Plot
            box={g.box}
            uid={`tm-${g.id}-${si}`}
            segs={segs}
            dots={[
              { x: g.x0, y: g.q0, tone: "base", label: "기준" },
              { x: x1, y: f(x1), tone: "live" },
            ]}
            vlines={[{ at: x1, tone: "guide" }]}
            axis={["가격 (천원)", "공급량 (개)"]}
          />
          <p className="text-center text-[11px] leading-5 text-slate-400">
            흐린 선은 다른 기간의 공급곡선이에요. 기준점을 축으로 점점 가팔라지지요.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-center text-sm font-bold text-slate-100">
              {g.emoji} {g.title} · {SPANS[si]} 뒤
            </p>
            <p className="text-center text-xs leading-6 text-slate-300">{g.says[si]}</p>
            <div className="flex justify-center">
              <ChangeBars dPrice={TIME_UP} dQty={dQty} />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
                <p className="text-[11px] text-slate-400">공급량</p>
                <p className="font-mono text-lg font-black text-slate-100">
                  {fmt(g.q0)} → {fmt(f(x1), 1)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
                <p className="text-[11px] text-slate-400">공급량 변화율</p>
                <p className="font-mono text-lg font-black text-emerald-300">{pct(dQty)}</p>
              </div>
              <div className={"rounded-xl border-2 p-2 text-center " + E_CHIP[k]}>
                <p className="text-[11px] opacity-80">
                  <Katex expr="\varepsilon_s" />
                </p>
                <p className="font-mono text-lg font-black">{fmt(e, 2)}</p>
              </div>
            </div>
            <EGauge e={e} />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <EBadge e={e} />
              <span className="text-xs leading-6 text-slate-300">{E_WHY[k]}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-2 text-xs font-bold text-slate-300">⏱️ 기간별 탄력성</p>
            <div className="flex flex-wrap gap-1.5">
              {g.es.map((v, i) => (
                <span
                  key={i}
                  className={
                    "rounded-lg border-2 px-2.5 py-1 font-mono text-[11px] font-bold " +
                    (i === si ? E_CHIP[eKind(v)] : "border-white/10 bg-white/5 text-slate-400")
                  }
                >
                  {SPANS[i]} {fmt(v, 2)}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-xs font-bold text-slate-300">🎯 미션</p>
            <GoalList items={TIME_GOALS} done={goals} />
          </div>
        </div>
      </div>

      <StepRunner
        steps={TIME_STEPS}
        accent="emerald"
        finale="공급의 탄력성은 '얼마나 빨리 조절할 수 있나' 가 정해요. 그래서 시간이 길어질수록 탄력적이 돼요."
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ 조절 속도 창고
// ══════════════════════════════════════════════════════════════
function GoodsTab() {
  const [picks, setPicks] = useState<Record<string, "elastic" | "inelastic">>({});
  const [misses, setMisses] = useState(0);

  const okCount = GOODS.filter((g) => picks[g.id] === eKind(g.dq / GOODS_UP)).length;
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
          🏭 값을 <b className="text-amber-200">10% 올렸더니</b> 공급량이 이렇게 늘었어요. 탄력적일까요, 비탄력적일까요?
        </p>
        <span className="font-mono text-xs text-slate-300">
          맞게 가른 것 {okCount} / {GOODS.length} · 틀린 횟수 {misses}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {GOODS.map((g) => {
          const e = g.dq / GOODS_UP;
          const truth = eKind(e);
          const pick = picks[g.id];
          const ok = pick === truth;
          return (
            <div key={g.id} className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-100">
                  <span className="mr-1 text-lg">{g.emoji}</span>
                  {g.title}
                </p>
                <span className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 font-mono text-xs font-bold text-emerald-200">
                  공급량 {pct(g.dq, 1)}
                </span>
              </div>

              {pick ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="text-center font-mono text-xs text-slate-300">
                    <Katex expr="\varepsilon_s" /> = {fmt(g.dq, 3)} ÷ 0.1 ={" "}
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
                    {ok ? g.why : "공급량이 10% 보다 크게 늘었는지 작게 늘었는지 견줘 보세요."}
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
            공급량을 빨리 늘릴 수 있는 상품일수록 탄력적이고, 만드는 데 오래 걸리거나 아예 늘릴 수 없는 상품일수록
            비탄력적이에요. 수요 쪽이 「바꿔 탈 데가 있나」 였다면 공급 쪽은 「빨리 더 만들 수 있나」 예요.
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
        finale="빨리 늘릴 수 있으면 탄력적, 그렇지 못하면 비탄력적. 공급 탄력성은 '조절 속도' 가 정해요."
      />
    </div>
  );
}
