"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  GRAPH_CARDS,
  GRAPH_STEPS,
  HOLE_EMOJI,
  HOLE_LABEL,
  HOLE_SETS,
  HOLE_STEPS,
  PROP_A,
  PROP_C_MAX,
  PROP_C_MIN,
  PROP_FNS,
  PROP_OPS,
  PROP_START,
  PROP_STEPS,
  REAL_NOTE,
  ZOOM_FNS,
  ZOOM_MAX_STEP,
  ZOOM_STEPS,
  OVER_R,
  fmt,
  samplePath,
  won,
  zoomOverview,
  zoomGap,
  type Box,
  type GraphCard,
  type HoleKind,
  type Piece,
  type Step,
  type ZoomFn,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "meaning",
    prompt:
      "x 를 a 에 한없이 가까이 보내며 f(x) 를 지켜보았어요. '한없이 가까워진다' 가 무슨 뜻인지 자기 말로 쓰고, x = a 에서의 함숫값이 극한과 상관없는 까닭도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 아무리 좁혀도 x 는 a 가 되지 않고 가까워지기만 했는데, 그때 f(x) 가 한 수에 점점 붙었다. 극한의 뜻에 'a 가 아니면서' 가 들어 있어 a 에서의 값은 아예 보지 않는다.",
  },
  {
    id: "three",
    prompt:
      "이어진 그래프 · 한 점이 뚫린 그래프 · 한 점만 딴 자리에 찍힌 그래프를 비교해 보았어요. 셋의 극한값과 함숫값이 어떻게 같고 달랐는지 정리하고, 극한이 아예 없던 경우는 무엇이 달랐는지도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 셋 다 둘레는 똑같아서 극한값이 같았고 x = a 에서의 값만 달랐다. 극한이 없던 그래프는 왼쪽에서 간 값과 오른쪽에서 간 값이 서로 달라 한 값으로 모이지 않았다.",
  },
  {
    id: "property",
    prompt:
      "극한의 성질로 두 함수를 더하고 곱하고 나눠 보았어요. 각 함수의 극한값만 알면 되는 것이 왜 편한지 쓰고, 나눗셈에만 조건이 붙는 까닭도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 복잡한 식도 덩어리마다 극한을 구해 이어 붙이면 되어서 계산이 훨씬 짧아졌다. 나눗셈은 분모의 극한값이 0 이면 0 으로 나누는 셈이라 값을 정할 수 없어 M ≠ 0 조건이 붙는다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "zoom" | "hole" | "prop" | "graph";

export default function LimitLab() {
  const [tab, setTab] = useState<Tab>("zoom");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🔍 함수의 극한과 그 성질</h3>
        <p className="mt-2 leading-7 text-slate-300">
          x 를 <b className="text-sky-200">한없이 가까이</b> 보내면 f(x) 는 어디로 갈까요? 확대해 가며 눈으로 보고, 구멍이
          있어도 극한이 있다는 것을 확인하고, <b className="text-violet-200">극한의 성질</b>로 조립까지 해 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "zoom"} onClick={() => setTab("zoom")}>① 한없이 가까이</TabButton>
        <TabButton active={tab === "hole"} onClick={() => setTab("hole")}>② 구멍이 있어도</TabButton>
        <TabButton active={tab === "prop"} onClick={() => setTab("prop")}>③ 극한의 성질</TabButton>
        <TabButton active={tab === "graph"} onClick={() => setTab("graph")}>④ 그래프 탐정</TabButton>
      </div>

      <div className="mt-4">
        {tab === "zoom" ? <ZoomTab /> : null}
        {tab === "hole" ? <HoleTab /> : null}
        {tab === "prop" ? <PropTab /> : null}
        {tab === "graph" ? <GraphTab /> : null}
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

export type Mark = { x: number; y: number; filled: boolean; tone: "dot" | "goal" | "live" };
const MARK_COLOR: Record<string, string> = { dot: "#e2e8f0", goal: "#34d399", live: "#f472b6" };

function Plot({
  box,
  paths,
  marks = [],
  guideX,
  guideY,
  uid,
  axis,
  yFmt,
}: {
  box: Box;
  paths: [number, number][][];
  marks?: Mark[];
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
  const cid = `lm-${uid}`;
  const fy = yFmt ?? ((v: number) => fmt(v, 4));

  const gx: number[] = [];
  for (let i = 0; i <= 12; i++) {
    const v = Math.ceil(box.xMin / box.gx) * box.gx + i * box.gx;
    if (v > box.xMax + 1e-9) break;
    gx.push(Number(v.toFixed(10)));
  }
  const gy: number[] = [];
  for (let i = 0; i <= 12; i++) {
    const v = Math.ceil(box.yMin / box.gy) * box.gy + i * box.gy;
    if (v > box.yMax + 1e-9) break;
    gy.push(Number(v.toFixed(10)));
  }
  const axisX = box.yMin <= 0 && box.yMax >= 0;
  const axisY = box.xMin <= 0 && box.xMax >= 0;

  return (
    <svg viewBox={`0 0 ${PS} ${PS}`} className="w-full max-w-[320px]" role="img" aria-label="함수의 그래프">
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
      {axisX ? <line x1={PML} y1={Y(0)} x2={PS - PMR} y2={Y(0)} stroke="rgba(255,255,255,0.3)" /> : null}
      {axisY ? <line x1={X(0)} y1={PMT} x2={X(0)} y2={PS - PMB} stroke="rgba(255,255,255,0.3)" /> : null}

      {gx.map((v) => (
        <text key={`tx${v}`} x={X(v)} y={PS - PMB + 14} textAnchor="middle" fontSize="11" fill="#94a3b8">
          {fmt(v, 4)}
        </text>
      ))}
      {gy.map((v) => (
        <text key={`ty${v}`} x={PML - 4} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
          {fy(v)}
        </text>
      ))}
      {axis ? (
        <>
          <text x={PS - PMR} y={PS - 3} textAnchor="end" fontSize="10" fill="#94a3b8">
            {axis[0]}
          </text>
          <text x={2} y={PMT - 7} textAnchor="start" fontSize="10" fill="#94a3b8">
            {axis[1]}
          </text>
        </>
      ) : null}

      <g clipPath={`url(#${cid})`}>
        {guideY !== undefined ? (
          <line x1={PML} y1={Y(guideY)} x2={PS - PMR} y2={Y(guideY)} stroke="rgba(52,211,153,0.45)" strokeDasharray="4 3" />
        ) : null}
        {guideX !== undefined ? (
          <line x1={X(guideX)} y1={PMT} x2={X(guideX)} y2={PS - PMB} stroke="rgba(148,163,184,0.45)" strokeDasharray="4 3" />
        ) : null}
        {paths.map((p, i) => (
          <polyline
            key={i}
            points={p.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")}
            fill="none"
            stroke="#38bdf8"
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
          <circle
            key={i}
            cx={X(m.x)}
            cy={Y(m.y)}
            r={m.tone === "live" ? 4.5 : 5}
            fill={m.filled ? MARK_COLOR[m.tone] : "#0b1220"}
            stroke={MARK_COLOR[m.tone]}
            strokeWidth="2"
          />
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
//  탭 ① 한없이 가까이
// ══════════════════════════════════════════════════════════════
/** 두 수가 앞에서부터 몇 글자나 같은지 — 수렴을 눈에 띄게 하려고 쓴다 */
function sharedPrefix(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

function ValueCell({ value, goal }: { value: number; goal: string }) {
  const s = fmt(value, 8);
  const n = sharedPrefix(s, goal);
  return (
    <span className="font-mono text-base tabular-nums">
      <span className="font-bold text-emerald-300">{s.slice(0, n)}</span>
      <span className="text-slate-400">{s.slice(n)}</span>
    </span>
  );
}

// ── 돋보기 — 왼쪽 전체 그림의 작은 원 안을 오른쪽 큰 원에 같은 비율로 키워 보여 준다 ──
type ScopeLayout = { id: string; w: number; h: number; ol: number; ot: number; os: number; mx: number; my: number; mr: number };
const SCOPE_WIDE: ScopeLayout = { id: "w", w: 640, h: 330, ol: 48, ot: 30, os: 240, mx: 480, my: 165, mr: 146 };
const SCOPE_TALL: ScopeLayout = { id: "t", w: 340, h: 640, ol: 60, ot: 28, os: 240, mx: 170, my: 472, mr: 150 };

/** 한 번 누를 때 걸리는 시간과, 그 앞부분 중 '점이 모이는' 몫 (나머지는 줌인) */
const SCOPE_MS = 1500;
const GATHER = 0.35;
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** pos 는 단계를 실수로 늘인 값 — k 에서 k + 1 로 가는 동안 ① 점이 모이고 ② 창이 줌인된다 */
function scopeAt(pos: number): { gap: number; r: number } {
  const base = Math.floor(pos + 1e-9);
  const u = pos - base;
  const p1 = easeInOut(Math.min(u / GATHER, 1));
  const p2 = easeInOut(Math.max((u - GATHER) / (1 - GATHER), 0));
  return { gap: Math.pow(10, -(base + p1)), r: OVER_R * Math.pow(10, -(base + p2)) };
}

/** 원 안에 그릴 격자선 자리 (가운데에서 간격만큼씩) */
function gridOffsets(spacing: number, reach: number): number[] {
  const out: number[] = [];
  const n = Math.ceil(reach / spacing);
  for (let j = -n; j <= n; j++) out.push(j * spacing);
  return out;
}

function ZoomScope({ z, ob, pos, lay }: { z: ZoomFn; ob: Box; pos: number; lay: ScopeLayout }) {
  const { gap, r } = scopeAt(pos);
  const { ol, ot, os, mx, my, mr } = lay;
  const OX = (x: number) => ol + ((x - ob.xMin) / (ob.xMax - ob.xMin)) * os;
  const OY = (y: number) => ot + os - ((y - ob.yMin) / (ob.yMax - ob.yMin)) * os;
  const sx = os / (ob.xMax - ob.xMin);
  const sy = os / (ob.yMax - ob.yMin);
  // 돋보기 창의 세로 반폭 — 전체 그림과 가로세로 비율이 같아야 원이 원으로 커진다
  const ry = (r * sx) / sy;
  const MX = (x: number) => mx + ((x - z.a) / r) * mr;
  const MY = (y: number) => my - ((y - z.L) / ry) * mr;

  const ox = OX(z.a);
  const oy = OY(z.L);
  const rho = Math.max(r * sx, 3);
  const len = Math.hypot(mx - ox, my - oy);
  const nx = -(my - oy) / len;
  const ny = (mx - ox) / len;
  const cone = [
    [ox + nx * rho, oy + ny * rho],
    [mx + nx * mr, my + ny * mr],
    [mx - nx * mr, my - ny * mr],
    [ox - nx * rho, oy - ny * rho],
  ]
    .map(([a, b]) => a + "," + b)
    .join(" ");

  const overPaths = samplePath(z.fn, ob.xMin, ob.xMax, ob);
  const tx: number[] = [];
  for (let v = Math.ceil(ob.xMin); v <= ob.xMax + 1e-9; v++) tx.push(v);
  const ty: number[] = [];
  for (let v = Math.ceil(ob.yMin / ob.gy) * ob.gy; v <= ob.yMax + 1e-9; v += ob.gy) ty.push(Number(v.toFixed(10)));

  // 창 안의 곡선 — 가운데(x = a)를 밟지 않도록 반 칸씩 비켜 잡는다
  const magPaths: string[] = [];
  let cur: string[] = [];
  const N = 200;
  for (let i = 0; i < N; i++) {
    const x = z.a + r * (-1 + (2 * (i + 0.5)) / N);
    const y = z.fn(x);
    const py = MY(y);
    if (!Number.isFinite(py) || Math.abs(py - my) > 3 * mr) {
      if (cur.length > 1) magPaths.push(cur.join(" "));
      cur = [];
      continue;
    }
    cur.push(MX(x) + "," + py);
  }
  if (cur.length > 1) magPaths.push(cur.join(" "));

  // 격자는 10 의 거듭제곱 간격 — 줌인하면 벌어지다가 다음 자릿수의 잔 격자가 서서히 나타난다
  const lr = Math.log10(r);
  const frac = lr - Math.floor(lr);
  const major = mr * Math.pow(10, -frac);
  const minor = major / 10;
  const minorOp = Math.min(Math.max((0.5 - frac) * 2, 0), 1);

  const live = [z.a - gap, z.a + gap];
  const zoomRate = Math.round(OVER_R / r).toLocaleString("ko-KR");
  const ovId = "zo-" + lay.id + "-" + z.id;
  const mgId = "zm-" + lay.id + "-" + z.id;

  return (
    <svg viewBox={"0 0 " + lay.w + " " + lay.h} className="w-full" role="img" aria-label="돋보기로 확대한 그래프">
      <defs>
        <clipPath id={ovId}>
          <rect x={ol} y={ot} width={os} height={os} />
        </clipPath>
        <clipPath id={mgId}>
          <circle cx={mx} cy={my} r={mr} />
        </clipPath>
      </defs>

      {/* 전체 그림 */}
      <rect x={ol} y={ot} width={os} height={os} fill="#0b1220" stroke="rgba(255,255,255,0.12)" />
      {tx.map((v) => (
        <line key={"ox" + v} x1={OX(v)} y1={ot} x2={OX(v)} y2={ot + os} stroke="rgba(255,255,255,0.06)" />
      ))}
      {ty.map((v) => (
        <line key={"oy" + v} x1={ol} y1={OY(v)} x2={ol + os} y2={OY(v)} stroke="rgba(255,255,255,0.06)" />
      ))}
      {ob.yMin <= 0 && ob.yMax >= 0 ? <line x1={ol} y1={OY(0)} x2={ol + os} y2={OY(0)} stroke="rgba(255,255,255,0.3)" /> : null}
      {ob.xMin <= 0 && ob.xMax >= 0 ? <line x1={OX(0)} y1={ot} x2={OX(0)} y2={ot + os} stroke="rgba(255,255,255,0.3)" /> : null}
      {tx.map((v) => (
        <text key={"otx" + v} x={OX(v)} y={ot + os + 15} textAnchor="middle" fontSize="11" fill="#94a3b8">
          {fmt(v, 4)}
        </text>
      ))}
      {ty.map((v) => (
        <text key={"oty" + v} x={ol - 5} y={OY(v) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
          {fmt(v, 4)}
        </text>
      ))}
      <g clipPath={"url(#" + ovId + ")"}>
        {overPaths.map((p, i) => (
          <polyline
            key={i}
            points={p.map(([x, y]) => OX(x) + "," + OY(y)).join(" ")}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>

      {/* 돋보기 원뿔 — 작은 원과 큰 원을 잇는다 */}
      <polygon points={cone} fill="rgba(56,189,248,0.07)" stroke="rgba(56,189,248,0.35)" strokeWidth="1" strokeDasharray="4 3" />

      {/* 전체 그림 위의 렌즈 (점은 clipPath 밖에) */}
      <circle cx={ox} cy={oy} r={rho} fill="rgba(56,189,248,0.12)" stroke="#7dd3fc" strokeWidth="1.8" />
      <line
        x1={ox + rho * 0.71}
        y1={oy + rho * 0.71}
        x2={ox + rho * 0.71 + 11}
        y2={oy + rho * 0.71 + 11}
        stroke="#7dd3fc"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {live.map((x) => (
        <circle key={"ol" + x} cx={OX(x)} cy={OY(z.fn(x))} r="2.6" fill="#f472b6" />
      ))}
      <circle cx={ox} cy={oy} r="2.6" fill={z.defined ? "#34d399" : "#0b1220"} stroke="#34d399" strokeWidth="1.4" />

      {/* 돋보기 창 */}
      <circle cx={mx} cy={my} r={mr} fill="#0b1220" />
      <g clipPath={"url(#" + mgId + ")"}>
        {minorOp > 0.02
          ? gridOffsets(minor, mr).map((d) => (
              <g key={"mn" + d} opacity={minorOp}>
                <line x1={mx + d} y1={my - mr} x2={mx + d} y2={my + mr} stroke="rgba(255,255,255,0.07)" />
                <line x1={mx - mr} y1={my + d} x2={mx + mr} y2={my + d} stroke="rgba(255,255,255,0.07)" />
              </g>
            ))
          : null}
        {gridOffsets(major, mr).map((d) => (
          <g key={"mj" + d}>
            <line x1={mx + d} y1={my - mr} x2={mx + d} y2={my + mr} stroke="rgba(255,255,255,0.13)" />
            <line x1={mx - mr} y1={my + d} x2={mx + mr} y2={my + d} stroke="rgba(255,255,255,0.13)" />
          </g>
        ))}
        <line x1={mx} y1={my - mr} x2={mx} y2={my + mr} stroke="rgba(148,163,184,0.5)" strokeDasharray="4 3" />
        <line x1={mx - mr} y1={my} x2={mx + mr} y2={my} stroke="rgba(52,211,153,0.5)" strokeDasharray="4 3" />
        {magPaths.map((p, i) => (
          <polyline key={i} points={p} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </g>
      <circle cx={mx} cy={my} r={mr} fill="none" stroke="rgba(125,211,252,0.55)" strokeWidth="6" />
      <circle cx={mx} cy={my} r={mr - 4} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

      {/* 창 안의 점 — 테두리에서 잘리지 않게 clipPath 밖에 */}
      {live.map((x) => (
        <circle key={"ml" + x} cx={MX(x)} cy={MY(z.fn(x))} r="6" fill="#f472b6" stroke="#fdf2f8" strokeWidth="1.5" />
      ))}
      <circle cx={mx} cy={my} r="7" fill={z.defined ? "#34d399" : "#0b1220"} stroke="#34d399" strokeWidth="2.4" />

      <rect x={mx - 42} y={my - mr + 14} width="84" height="26" rx="13" fill="rgba(15,23,42,0.9)" stroke="rgba(125,211,252,0.6)" />
      <text x={mx} y={my - mr + 32} textAnchor="middle" fontSize="15" fontWeight="bold" fill="#e0f2fe">
        ×{zoomRate}
      </text>
      <rect x={mx - 92} y={my + mr - 42} width="184" height="24" rx="12" fill="rgba(15,23,42,0.85)" />
      <text x={mx} y={my + mr - 25} textAnchor="middle" fontSize="12" fill="#cbd5e1">
        x : {fmt(z.a - r, 7)} ~ {fmt(z.a + r, 7)}
      </text>
    </svg>
  );
}

function ZoomTab() {
  const [zi, setZi] = useState(0);
  const [pos, setPos] = useState(1);
  const rafRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const z = ZOOM_FNS[zi];
  const ob = zoomOverview(z);
  const k = Math.ceil(pos - 1e-9);
  const busy = !Number.isInteger(pos);
  const goal = fmt(z.L, 8);

  const stop = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };
  const stepIn = () => {
    stop();
    const from = k;
    const to = k + 1;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPos(to);
      return;
    }
    const start = performance.now();
    const tick = (t: number) => {
      const u = Math.min((t - start) / SCOPE_MS, 1);
      if (u >= 1) {
        rafRef.current = null;
        setPos(to);
        return;
      }
      setPos(from + u);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };
  const reset = () => {
    stop();
    setPos(1);
  };

  const rows = [];
  for (let i = 1; i <= k; i++) {
    const g = zoomGap(i);
    rows.push({ i, lx: z.a - g, ly: z.fn(z.a - g), rx: z.a + g, ry: z.fn(z.a + g) });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-500/[0.07] to-emerald-500/[0.04] p-4">
        <p className="text-sm font-bold text-sky-200">🔎 한 걸음씩 가까이 가며 f(x) 가 어디로 가는지 보세요</p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {ZOOM_FNS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                stop();
                setZi(i);
                setPos(1);
              }}
              className={
                "rounded-lg border px-2.5 py-1.5 text-xs font-bold transition " +
                (zi === i ? "border-sky-400/60 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {v.emoji} {v.title}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-center">
          <Katex expr={z.tex} className="text-lg text-slate-100" />
          <p className="mt-1 text-sm text-slate-400">
            x 가 <b className="text-amber-200">{fmt(z.a)}</b> 에 한없이 가까워질 때
          </p>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
          <div className="mx-auto hidden max-w-[680px] sm:block">
            <ZoomScope z={z} ob={ob} pos={pos} lay={SCOPE_WIDE} />
          </div>
          <div className="mx-auto max-w-[360px] sm:hidden">
            <ZoomScope z={z} ob={ob} pos={pos} lay={SCOPE_TALL} />
          </div>
          <p className="mt-1 text-center text-xs leading-5 text-slate-400">
            작은 원이 돋보기를 댄 자리 · 큰 원은 그 안을 키운 모습 · 분홍 점이 양쪽에서 다가가는 x · 초록 점이 ({fmt(z.a)},{" "}
            {fmt(z.L)}){z.defined ? "" : " — 속이 빈 것은 값이 없다는 뜻"}
          </p>
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="space-y-2">
            <div className="overflow-x-auto overflow-y-hidden py-1">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-white/10 bg-sky-400/[0.14] px-3 py-2 text-sm font-bold text-sky-100">
                      왼쪽에서 x
                    </th>
                    <th className="border border-white/10 bg-sky-400/[0.14] px-3 py-2 text-sm font-bold text-sky-100">f(x)</th>
                    <th className="border border-white/10 bg-amber-400/[0.14] px-3 py-2 text-sm font-bold text-amber-100">
                      오른쪽에서 x
                    </th>
                    <th className="border border-white/10 bg-amber-400/[0.14] px-3 py-2 text-sm font-bold text-amber-100">f(x)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r2) => (
                    <tr key={r2.i}>
                      <td className="border border-white/10 px-3 py-2 text-right font-mono text-base tabular-nums text-slate-200">
                        {fmt(r2.lx, 6)}
                      </td>
                      <td className="border border-white/10 px-3 py-2 text-right">
                        <ValueCell value={r2.ly} goal={goal} />
                      </td>
                      <td className="border border-white/10 px-3 py-2 text-right font-mono text-base tabular-nums text-slate-200">
                        {fmt(r2.rx, 6)}
                      </td>
                      <td className="border border-white/10 px-3 py-2 text-right">
                        <ValueCell value={r2.ry} goal={goal} />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-white/10 bg-emerald-400/[0.10] px-3 py-2 text-right font-mono text-base font-bold text-emerald-200">
                      ↓ {fmt(z.a)}
                    </td>
                    <td className="border border-white/10 bg-emerald-400/[0.10] px-3 py-2 text-right font-mono text-base font-bold text-emerald-200">
                      ↓ {goal}
                    </td>
                    <td className="border border-white/10 bg-emerald-400/[0.10] px-3 py-2 text-right font-mono text-base font-bold text-emerald-200">
                      {fmt(z.a)} ↓
                    </td>
                    <td className="border border-white/10 bg-emerald-400/[0.10] px-3 py-2 text-right font-mono text-base font-bold text-emerald-200">
                      {goal} ↓
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy || k >= ZOOM_MAX_STEP}
                onClick={stepIn}
                className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.sky}
              >
                🔎 한 걸음 더 가까이
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                ↩️ 처음으로
              </button>
              <span className="font-mono text-xs text-slate-400">
                {k} / {ZOOM_MAX_STEP} 단계 · a 와의 거리 {zoomGap(k).toExponential(0)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-xl border-2 border-emerald-400/45 bg-emerald-400/[0.08] px-3 py-2 text-center">
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex
                  expr={`\\lim_{x \\to ${fmt(z.a)}} f(x) = ${fmt(z.L)}`}
                  className="whitespace-nowrap text-lg text-emerald-100"
                />
              </div>
              <p className="mt-1 text-sm text-slate-300">
                {z.defined ? (
                  <>
                    x = {fmt(z.a)} 에서의 함숫값도 <b className="text-emerald-200">{fmt(z.L)}</b> 이에요
                  </>
                ) : (
                  <>
                    x = {fmt(z.a)} 에서의 <b className="text-rose-200">함숫값은 없어요</b> — 그래도 극한은 있습니다
                  </>
                )}
              </p>
            </div>
            <TipBox>{z.note}</TipBox>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "한 걸음 갈 때마다 x 는 a 에 10배씩 가까워지고 돋보기도 10배씩 더 키워 보여 줘요.",
              "f(x) 의 앞자리가 초록으로 바뀌는 만큼 극한값과 같아진 것이에요.",
              "아무리 좁혀도 x 가 a 와 같아지지는 않아요.",
              "그래서 x = a 에서 값이 있든 없든 극한에는 영향이 없어요.",
            ]}
          />
        </div>
      </div>

      <StepRunner steps={ZOOM_STEPS} accent="sky" finale="극한이 '가까이 갈 때' 의 이야기라는 것을 잡았어요. 이제 구멍을 들여다봐요!" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 구멍이 있어도
// ══════════════════════════════════════════════════════════════
const KIND_RING: Record<HoleKind, string> = {
  join: "border-emerald-400/50 bg-emerald-400/[0.08]",
  hole: "border-sky-400/50 bg-sky-400/[0.08]",
  off: "border-rose-400/50 bg-rose-400/[0.08]",
};
const KIND_TEXT: Record<HoleKind, string> = {
  join: "text-emerald-200",
  hole: "text-sky-200",
  off: "text-rose-200",
};

function HoleTab() {
  const [si, setSi] = useState(0);
  const [reveal, setReveal] = useState(false);
  const set = HOLE_SETS[si];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.07] to-sky-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🕳️ 세 그래프는 x = {fmt(set.a)} 자리만 달라요</p>
          <div className="flex gap-1.5">
            {HOLE_SETS.map((z, i) => (
              <button
                key={z.id}
                type="button"
                onClick={() => {
                  setSi(i);
                  setReveal(false);
                }}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (si === i ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {z.title}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {set.items.map((it) => {
            const paths = samplePath(it.fn, set.box.xMin, set.box.xMax, set.box);
            const marks: Mark[] = [{ x: set.a, y: set.L, filled: it.kind === "join", tone: "goal" }];
            if (it.valueAt !== null && it.kind === "off") marks.push({ x: set.a, y: it.valueAt, filled: true, tone: "dot" });
            return (
              <div key={it.kind} className={"space-y-2 rounded-xl border-2 p-3 " + KIND_RING[it.kind]}>
                <p className={"text-center text-sm font-bold " + KIND_TEXT[it.kind]}>
                  {HOLE_EMOJI[it.kind]} {HOLE_LABEL[it.kind]}
                </p>
                <div className="overflow-x-auto overflow-y-hidden py-1 text-center">
                  <Katex expr={it.tex} className="text-sm text-slate-100" />
                </div>
                <div className="flex justify-center">
                  <Plot
                    box={set.box}
                    paths={paths}
                    marks={marks}
                    guideX={set.a}
                    guideY={set.L}
                    uid={`hole-${set.id}-${it.kind}`}
                    yFmt={(v) => fmt(v, 2)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <div className="rounded-lg border border-white/10 bg-slate-950/60 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-slate-400">극한값</p>
                    <p className="font-mono text-sm font-bold text-emerald-200">
                      {reveal ? fmt(set.L) : "?"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/60 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-slate-400">x = {fmt(set.a)} 에서의 함숫값</p>
                    <p className={"font-mono text-sm font-bold " + (it.valueAt === null ? "text-rose-300" : "text-slate-100")}>
                      {reveal ? (it.valueAt === null ? "없음" : fmt(it.valueAt)) : "?"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setReveal(!reveal)}
            className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition " + ACC_BTN.violet}
          >
            {reveal ? "🙈 값 가리기" : "👀 극한값과 함숫값 보기"}
          </button>
          <span className="text-[11px] text-slate-400">
            먼저 세 그래프를 눈으로 견주어 보고 눌러 보세요.
          </span>
        </div>

        {reveal ? (
          <div className="mt-2">
            <Verdict ok>{set.wrap}</Verdict>
          </div>
        ) : null}

        <div className="mt-3">
          <GoalList
            items={[
              "세 그래프를 포개면 x = a 한 점만 빼고 완전히 같아요.",
              "극한은 그 한 점을 빼고 둘레만 보기 때문에 셋 다 같은 값이에요.",
              "속이 빈 동그라미는 '그 자리에 값이 없다', 채운 점은 '여기가 함숫값' 이라는 뜻이에요.",
            ]}
          />
        </div>
      </div>

      <StepRunner steps={HOLE_STEPS} accent="violet" finale="극한값과 함숫값은 따로 노는 두 가지라는 것을 익혔어요!" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 극한의 성질
// ══════════════════════════════════════════════════════════════
const PROP_BOX: Box = { xMin: 0, xMax: 4, yMin: -6, yMax: 14, gx: 0.5, gy: 2 };

function PropTab() {
  const [fi, setFi] = useState(PROP_START.fi);
  const [gi, setGi] = useState(PROP_START.gi);
  const [opi, setOpi] = useState(PROP_START.op);
  const [c, setC] = useState(PROP_START.c);

  const f = PROP_FNS[fi];
  const g = PROP_FNS[gi];
  const op = PROP_OPS[opi];
  const usable = op.usable(f.L, g.L);
  const combo = (x: number) => op.combine(f.fn(x), g.fn(x), c);
  const predicted = op.predict(f.L, g.L, c);
  // 실제로 가까이 가서 얻은 값
  const near = combo(PROP_A + 1e-6);
  const paths = usable ? samplePath(combo, PROP_BOX.xMin, PROP_BOX.xMax, PROP_BOX) : [];
  const marks: Mark[] = usable && predicted >= PROP_BOX.yMin && predicted <= PROP_BOX.yMax
    ? [{ x: PROP_A, y: predicted, filled: false, tone: "goal" }]
    : [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.07] to-violet-500/[0.04] p-4">
        <p className="text-sm font-bold text-emerald-200">
          🧪 두 함수를 골라 조합하면 극한도 그대로 조합돼요 (x → {fmt(PROP_A)})
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { label: "f 고르기", idx: fi, set: setFi, tone: "border-sky-400/60 bg-sky-400/20 text-sky-100" },
            { label: "g 고르기", idx: gi, set: setGi, tone: "border-amber-400/60 bg-amber-400/20 text-amber-100" },
          ].map((row) => (
            <div key={row.label}>
              <p className="mb-1 text-[11px] font-bold text-slate-400">{row.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {PROP_FNS.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => row.set(i)}
                    className={
                      "rounded-lg border-2 px-2.5 py-1.5 text-sm font-bold transition " +
                      (row.idx === i ? row.tone : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    <Katex expr={v.tex} />
                    {v.hole ? <span className="ml-1 text-[9px] text-rose-300">구멍</span> : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] font-bold text-slate-400">무엇을 할까요</p>
            <div className="flex flex-wrap gap-1.5">
              {PROP_OPS.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setOpi(i)}
                  className={
                    "rounded-lg border-2 px-3 py-1.5 text-sm font-bold transition " +
                    (opi === i ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className={op.id === "scale" ? "" : "opacity-40"}>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-bold text-slate-300">상수 c</span>
              <span className="font-mono text-sm text-slate-100">{fmt(c)}</span>
            </div>
            <input
              type="range"
              min={PROP_C_MIN}
              max={PROP_C_MAX}
              step={1}
              value={c}
              onChange={(e) => setC(Number(e.target.value))}
              disabled={op.id !== "scale"}
              className="mt-1 w-full accent-emerald-400"
            />
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2 text-center">
                <p className="text-[10px] font-bold text-sky-300">f 의 극한</p>
                <div className="overflow-x-auto overflow-y-hidden py-1">
                  <Katex expr={`\\lim_{x \\to ${PROP_A}} \\left( ${f.tex} \\right) = ${fmt(f.L)}`} className="whitespace-nowrap text-sm text-slate-100" />
                </div>
              </div>
              <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2 text-center">
                <p className="text-[10px] font-bold text-amber-300">g 의 극한</p>
                <div className="overflow-x-auto overflow-y-hidden py-1">
                  <Katex expr={`\\lim_{x \\to ${PROP_A}} \\left( ${g.tex} \\right) = ${fmt(g.L)}`} className="whitespace-nowrap text-sm text-slate-100" />
                </div>
              </div>
            </div>

            {usable ? (
              <>
                <div className="rounded-xl border-2 border-emerald-400/45 bg-emerald-400/[0.08] px-3 py-3 text-center">
                  <p className="text-[10px] text-slate-300">성질로 예측한 값</p>
                  <div className="mt-1 overflow-x-auto overflow-y-hidden py-1">
                    <Katex
                      expr={`\\lim_{x \\to ${PROP_A}} \\left( ${op.texOf(c)} \\right) = ${fmt(predicted)}`}
                      className="whitespace-nowrap text-lg text-emerald-100"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-center">
                  <p className="text-[10px] text-slate-400">
                    실제로 x 에 {fmt(PROP_A)} 바로 옆 값을 넣어 보면
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-slate-100">{fmt(near, 6)}</p>
                  <p className="mt-0.5 text-[10px] text-emerald-300">예측한 값과 같아요</p>
                </div>
              </>
            ) : (
              <div className="rounded-xl border-2 border-rose-400/45 bg-rose-400/[0.08] px-3 py-3 text-center">
                <p className="text-sm font-bold text-rose-200">🚫 이 조합에는 성질 (4)를 쓸 수 없어요</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-300">
                  g 의 극한값이 0 이라 0 으로 나누는 셈이 돼요. 성질 (4)에는 M ≠ 0 이라는 단서가 붙어 있습니다.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              {usable ? (
                <Plot box={PROP_BOX} paths={paths} marks={marks} guideX={PROP_A} guideY={predicted} uid={`prop-${f.id}-${g.id}-${op.id}-${c}`} yFmt={(v) => fmt(v, 2)} />
              ) : (
                <div className="flex aspect-square w-full max-w-[320px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-slate-900/40 px-4 text-center">
                  <p className="text-xs leading-6 text-slate-500">분모의 극한값이 0 이라 그래프를 그리지 않아요.</p>
                </div>
              )}
            </div>
            {usable ? (
              <p className="text-center text-[10px] leading-4 text-slate-500">
                조합한 함수의 그래프예요. x = {fmt(PROP_A)} 에서 초록 동그라미로 모여요.
              </p>
            ) : null}
            {f.hole || g.hole ? (
              <TipBox>고른 함수에 구멍이 있어도 예측값과 실제 값이 그대로 맞아떨어져요.</TipBox>
            ) : null}
          </div>
        </div>
      </div>

      <StepRunner steps={PROP_STEPS} accent="emerald" finale="성질을 쓰면 복잡한 식도 덩어리로 나눠 풀 수 있어요!" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 그래프 탐정
// ══════════════════════════════════════════════════════════════
type Answer = { none: boolean; text: string };
const blankAns = (): Answer => ({ none: false, text: "" });

function answerOk(a: Answer | undefined, truth: number | null): boolean {
  if (!a) return false;
  if (truth === null) return a.none;
  if (a.none) return false;
  return sameNum(a.text, truth);
}

function AnswerBox({
  label,
  noneLabel,
  value,
  onChange,
  graded,
  ok,
  accent,
}: {
  label: string;
  noneLabel: string;
  value: Answer;
  onChange: (a: Answer) => void;
  graded: boolean;
  ok: boolean;
  accent: Accent;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
      <p className="mb-1.5 text-[11px] font-bold text-slate-300">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={value.none ? "" : value.text}
          disabled={value.none}
          onChange={(e) => onChange({ none: false, text: e.target.value })}
          className={
            "h-9 w-28 rounded-lg border-2 px-2 text-center font-mono text-sm tabular-nums outline-none transition disabled:opacity-40 " +
            INPUT_MARK[graded ? (ok ? "right" : "wrong") : "none"]
          }
        />
        <button
          type="button"
          onClick={() => onChange({ none: !value.none, text: "" })}
          className={
            "rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " +
            (value.none ? ACC_CHIP[accent] : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
          }
        >
          {noneLabel}
        </button>
      </div>
    </div>
  );
}

function CardPlot({ card }: { card: GraphCard }) {
  const paths: [number, number][][] = [];
  for (const br of card.branches) for (const p of samplePath(br.fn, br.from, br.to, card.box)) paths.push(p);
  const marks: Mark[] = card.dots.map((d) => ({ x: d.x, y: d.y, filled: d.filled, tone: "dot" as const }));
  const big = card.box.yMax >= 1000;
  return (
    <Plot
      box={card.box}
      paths={paths}
      marks={marks}
      guideX={card.a}
      uid={`card-${card.id}`}
      axis={card.axis}
      yFmt={big ? (v) => won(v) : (v) => fmt(v, 2)}
    />
  );
}

function GraphTab() {
  const [ci, setCi] = useState(0);
  const [lim, setLim] = useState<Record<string, Answer>>({});
  const [val, setVal] = useState<Record<string, Answer>>({});
  const [graded, setGraded] = useState<Record<string, boolean>>({});

  const card = GRAPH_CARDS[ci];
  const la = lim[card.id] ?? blankAns();
  const va = val[card.id] ?? blankAns();
  const limOk = answerOk(la, card.limit);
  const valOk = answerOk(va, card.value);
  const isGraded = graded[card.id] === true;
  const bothOk = limOk && valOk;
  const solved = (z: GraphCard) => answerOk(lim[z.id], z.limit) && answerOk(val[z.id], z.value);
  const clearedCount = GRAPH_CARDS.filter((z) => graded[z.id] === true && solved(z)).length;
  const filled = (la.none || la.text.trim() !== "") && (va.none || va.text.trim() !== "");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.07] to-rose-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-amber-200">🕵️ 그래프를 보고 극한값과 함숫값을 따로 읽어 보세요</p>
          <span className="font-mono text-xs text-slate-300">
            해결 {clearedCount} / {GRAPH_CARDS.length}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {GRAPH_CARDS.map((z, i) => {
            const done = graded[z.id] === true && solved(z);
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setCi(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (ci === i
                    ? "border-amber-400/60 bg-amber-400/20 text-amber-100"
                    : done
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {done ? "✅ " : ""}
                {z.emoji} {i + 1}
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="space-y-2">
            <div className="flex justify-center">
              <CardPlot card={card} />
            </div>
            <p className="text-center text-[10px] leading-4 text-slate-500">
              점선이 x = {fmt(card.a)} 자리예요
            </p>
          </div>

          <div className="space-y-2">
            <div className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2">
              <p className="text-sm font-bold text-slate-100">
                {card.emoji} {card.title}
              </p>
              <p className="mt-1 text-xs leading-6 text-slate-300">{card.story}</p>
            </div>

            <AnswerBox
              label={`x 가 ${fmt(card.a)} 에 한없이 가까워질 때의 극한값은?`}
              noneLabel="극한이 없어요"
              value={la}
              onChange={(a) => {
                setLim((z) => ({ ...z, [card.id]: a }));
                setGraded((z) => ({ ...z, [card.id]: false }));
              }}
              graded={isGraded}
              ok={limOk}
              accent="amber"
            />
            <AnswerBox
              label={`x = ${fmt(card.a)} 에서의 함숫값은?`}
              noneLabel="값이 없어요"
              value={va}
              onChange={(a) => {
                setVal((z) => ({ ...z, [card.id]: a }));
                setGraded((z) => ({ ...z, [card.id]: false }));
              }}
              graded={isGraded}
              ok={valOk}
              accent="amber"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!filled}
                onClick={() => setGraded((z) => ({ ...z, [card.id]: true }))}
                className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition disabled:opacity-40 " + ACC_BTN.amber}
              >
                확인
              </button>
              <button
                type="button"
                onClick={() => {
                  setLim((z) => ({ ...z, [card.id]: blankAns() }));
                  setVal((z) => ({ ...z, [card.id]: blankAns() }));
                  setGraded((z) => ({ ...z, [card.id]: false }));
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                ↩️ 다시
              </button>
              {isGraded && bothOk && ci < GRAPH_CARDS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCi(ci + 1)}
                  className="rounded-lg border-2 border-emerald-400/55 bg-emerald-400/15 px-4 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/25"
                >
                  다음 그래프 →
                </button>
              ) : null}
            </div>

            <div className="min-h-[38px]">
              {isGraded ? (
                <Verdict ok={bothOk}>{card.why}</Verdict>
              ) : (
                <TipBox>
                  속이 빈 동그라미는 그 자리에 값이 없다는 뜻이에요. 왼쪽과 오른쪽에서 각각 다가가 보세요.
                </TipBox>
              )}
            </div>
          </div>
        </div>

        {clearedCount === GRAPH_CARDS.length ? (
          <div className="mt-3 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3 text-center">
            <p className="text-sm font-bold text-emerald-100">🏆 여덟 장을 모두 읽어 냈어요!</p>
            <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-slate-200">
              극한값과 함숫값은 서로 다른 물음이고, 양쪽에서 간 값이 갈라지면 극한은 아예 없다는 것까지 익혔어요.
            </p>
          </div>
        ) : null}
      </div>

      <StepRunner steps={GRAPH_STEPS} accent="amber" finale="그래프만 보고도 극한을 읽을 수 있게 되었어요!" />

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">{REAL_NOTE}</p>
    </div>
  );
}
