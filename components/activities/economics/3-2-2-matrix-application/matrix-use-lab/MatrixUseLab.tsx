"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  FACTORIES,
  FC_SIM_START,
  FC_USER_RANGE,
  FIXED_A,
  FIXED_A2,
  FIXED_DEG,
  FORECASTS,
  MARKETS,
  NET_MISSIONS,
  NET_N,
  NET_PEOPLE,
  NET_POS,
  NET_FIXED,
  NET_START,
  NET_STEPS,
  REAL_NOTE,
  SIM_BOX,
  SIM_KEEP,
  SIM_RANGE,
  SIM_START,
  adjOf,
  afterYears,
  colsOf,
  degreesOf,
  det2,
  detTex,
  edgeKey,
  factoryA,
  factoryB,
  fillM,
  fmt,
  inBox,
  invTex,
  lineSeg,
  lineTex,
  marketA,
  marketB,
  marketPoint,
  matTex,
  mulM,
  netMissionDone,
  steadyState,
  tidy,
  won,
  type Box,
  type Edge,
  type Mat,
  type Piece,
  type Step,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "inverse",
    prompt:
      "균형점을 찾는 일과 쓴 자원에서 생산량을 되짚는 일을 모두 역행렬로 풀었어요. 두 문제가 사실 같은 꼴이라는 것을 자기 말로 설명하고, 어떤 상황에서 '거꾸로 알아내기' 가 쓸모 있을지 하나 들어 보세요.",
    kind: "text",
    placeholder:
      "예: 둘 다 모르는 값이 두 개이고 조건이 두 개라 AX = B 꼴이 되었고, 양변에 A⁻¹ 을 곱하면 X 가 나왔다. 재료 사용량만 남아 있을 때 몇 개를 만들었는지 되짚는 데 쓸 수 있다.",
  },
  {
    id: "power",
    prompt:
      "전이행렬을 거듭 곱해 몇 해 뒤 사용자 수를 예측해 보았어요. 왜 곱하기를 되풀이하는 것이 '해가 지나는 일' 이 되는지 쓰고, 오래 지나면 한 값으로 굳는 까닭도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 한 해가 지날 때마다 같은 비율로 옮겨 가므로 같은 행렬을 한 번 더 곱하면 된다. 빠져나가는 사람 수와 들어오는 사람 수가 같아지는 자리에 이르면 더 움직이지 않는다.",
  },
  {
    id: "network",
    prompt:
      "사람 사이의 관계를 0 과 1 로만 적은 행렬로 친구 수와 두 다리 건너 관계를 읽어 냈어요. 숫자 표 하나로 무엇까지 알 수 있었는지 쓰고, 이런 방법을 우리 반이나 SNS 에서 어디에 써 볼 수 있을지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 가로줄을 더하면 친구 수가, 두 번 곱하면 두 다리로 닿는 길의 수가 나왔다. 소식을 가장 빨리 퍼뜨릴 사람을 고르거나, 아무와도 이어지지 않은 친구를 찾아내는 데 쓸 수 있겠다.",
  },
];

const ABC = ["①", "②", "③", "④"];

type Tab = "market" | "factory" | "forecast" | "network";

export default function MatrixUseLab() {
  const [tab, setTab] = useState<Tab>("market");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🧩 행렬로 푸는 실생활 문제</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-sky-200">균형점 찾기</b>와 <b className="text-emerald-200">생산량 되짚기</b>는 역행렬로,{" "}
          <b className="text-violet-200">사용자 수 예측</b>과 <b className="text-amber-200">사회 연결망</b>은 행렬의 곱으로
          풀어요. 네 가지 모두 직접 움직여 보며 익혀요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "market"} onClick={() => setTab("market")}>① 균형가격 찾기</TabButton>
        <TabButton active={tab === "factory"} onClick={() => setTab("factory")}>② 생산량 되짚기</TabButton>
        <TabButton active={tab === "forecast"} onClick={() => setTab("forecast")}>③ 사용자 수 예측</TabButton>
        <TabButton active={tab === "network"} onClick={() => setTab("network")}>④ 사회 연결망</TabButton>
      </div>

      <div className="mt-4">
        {tab === "market" ? <MarketTab /> : null}
        {tab === "factory" ? <FactoryTab /> : null}
        {tab === "forecast" ? <ForecastTab /> : null}
        {tab === "network" ? <NetworkTab /> : null}
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
//  공용 — 조각 글 · 행렬
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

type Tone = "base" | "a" | "b" | "res" | "hit" | "miss" | "dim";
const CELL_TONE: Record<Tone, string> = {
  base: "border-white/10 bg-white/[0.05] text-slate-100",
  a: "border-sky-400/35 bg-sky-400/10 text-sky-100",
  b: "border-amber-400/35 bg-amber-400/10 text-amber-100",
  res: "border-violet-400/35 bg-violet-400/12 text-violet-100",
  hit: "border-emerald-400/70 bg-emerald-400/20 text-emerald-100",
  miss: "border-rose-400/70 bg-rose-400/20 text-rose-100",
  dim: "border-white/5 bg-white/[0.02] text-slate-500",
};
const CELL_SIZE: Record<string, string> = {
  sm: "h-7 min-w-[1.9rem] px-1 text-[11px]",
  md: "h-9 min-w-[2.7rem] px-1.5 text-sm",
};

function Bracket({ side }: { side: "l" | "r" }) {
  return (
    <svg width="9" viewBox="0 0 9 48" preserveAspectRatio="none" className="self-stretch text-slate-400" aria-hidden="true">
      <path
        d={side === "l" ? "M7.5 1 C2.5 12, 2.5 36, 7.5 47" : "M1.5 1 C6.5 12, 6.5 36, 1.5 47"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MatrixView({ m, tones, label, size = "md" }: { m: Mat; tones?: Tone[][]; label?: string; size?: "sm" | "md" }) {
  return (
    <div className="inline-flex flex-col items-center gap-1">
      {label ? <span className="text-xs font-bold text-slate-400">{label}</span> : null}
      <div className="flex items-stretch gap-1">
        <Bracket side="l" />
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${colsOf(m)}, minmax(0, 1fr))` }}>
          {m.map((row, i) =>
            row.map((v, j) => (
              <div
                key={`${i}-${j}`}
                className={
                  "flex items-center justify-center rounded-md border font-mono tabular-nums " +
                  CELL_SIZE[size] +
                  " " +
                  CELL_TONE[tones?.[i]?.[j] ?? "base"]
                }
              >
                {fmt(v)}
              </div>
            )),
          )}
        </div>
        <Bracket side="r" />
      </div>
    </div>
  );
}

const INPUT_MARK: Record<string, string> = {
  none: "border-white/15 bg-white/[0.06] text-slate-100 focus:border-emerald-400/60",
  right: "border-emerald-400/70 bg-emerald-400/15 text-emerald-100",
  wrong: "border-rose-400/70 bg-rose-400/15 text-rose-100",
};

function MatrixInput({
  values,
  onChange,
  marks,
}: {
  values: string[][];
  onChange: (i: number, j: number, v: string) => void;
  marks?: string[][];
}) {
  const cols = values[0] ? values[0].length : 0;
  return (
    <div className="inline-flex items-stretch gap-1">
      <Bracket side="l" />
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {values.map((row, i) =>
          row.map((v, j) => (
            <input
              key={`${i}-${j}`}
              type="text"
              inputMode="numeric"
              value={v}
              onChange={(e) => onChange(i, j, e.target.value)}
              className={
                "h-9 w-16 rounded-md border-2 text-center font-mono text-sm tabular-nums outline-none transition " +
                INPUT_MARK[marks?.[i]?.[j] ?? "none"]
              }
            />
          )),
        )}
      </div>
      <Bracket side="r" />
    </div>
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

function stepDone(s: Step, picks: Record<string, number>, fills: Record<string, string[][]>, nums: Record<string, string>): boolean {
  if (s.kind === "choice") return picks[s.id] === s.answer;
  if (s.kind === "num") return sameNum(nums[s.id] ?? "", s.answer);
  const v = fills[s.id];
  if (!v) return false;
  return s.target.every((row, i) => row.every((t, j) => sameNum(v[i]?.[j] ?? "", t)));
}
function blankFill(s: Step): string[][] {
  if (s.kind !== "fill") return [];
  return s.target.map((row) => row.map(() => ""));
}

function StepRunner({ steps, accent, finale }: { steps: Step[]; accent: Accent; finale?: string }) {
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [fills, setFills] = useState<Record<string, string[][]>>({});
  const [nums, setNums] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState<Record<string, boolean>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});

  const s = steps[at];
  const isGraded = graded[s.id] === true;
  const okNow = stepDone(s, picks, fills, nums);
  const clearedCount = steps.filter((z) => graded[z.id] === true && stepDone(z, picks, fills, nums)).length;
  const allClear = clearedCount === steps.length;
  const fillVals = s.kind === "fill" ? (fills[s.id] ?? blankFill(s)) : [];
  const marks =
    s.kind === "fill" && isGraded ? s.target.map((row, i) => row.map((t, j) => (sameNum(fillVals[i]?.[j] ?? "", t) ? "right" : "wrong"))) : undefined;
  const canAnswer =
    s.kind === "choice"
      ? picks[s.id] !== undefined
      : s.kind === "num"
        ? cleanNum(nums[s.id] ?? "") !== ""
        : fillVals.some((row) => row.some((v) => v.trim() !== ""));

  return (
    <div className={"space-y-3 rounded-2xl border p-4 " + ACC_PANEL[accent]}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {steps.map((z, i) => {
            const cleared = graded[z.id] === true && stepDone(z, picks, fills, nums);
            const open = i === 0 || (graded[steps[i - 1].id] === true && stepDone(steps[i - 1], picks, fills, nums));
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

      {s.mats?.length ? (
        <div className="flex flex-wrap items-end gap-x-5 gap-y-2 overflow-x-auto overflow-y-hidden py-1">
          {s.mats.map((z, i) => (
            <MatrixView key={i} m={z.m} label={z.label} tones={z.m.map((row) => row.map(() => (i === 0 ? "a" : "b")))} />
          ))}
        </div>
      ) : null}

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
      ) : null}

      {s.kind === "fill" ? (
        <div className="overflow-x-auto overflow-y-hidden py-1">
          <MatrixInput
            values={fillVals}
            marks={marks}
            onChange={(i, j, v) => {
              setFills((z) => {
                const cur = z[s.id] ?? blankFill(s);
                const next = cur.map((row) => [...row]);
                next[i][j] = v;
                return { ...z, [s.id]: next };
              });
              setGraded((z) => ({ ...z, [s.id]: false }));
            }}
          />
          {s.unit ? <span className="ml-2 text-xs text-slate-400">단위 {s.unit}</span> : null}
        </div>
      ) : null}

      {s.kind === "num" ? (
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
      ) : null}

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
        ) : isGraded && s.kind === "fill" ? (
          <Verdict ok={false}>빨간 칸을 다시 보세요. 부호를 놓치지 않았는지 확인해요.</Verdict>
        ) : isGraded ? (
          <Verdict ok={false}>아직 맞지 않아요. 계산을 다시 한 번 해 보세요.</Verdict>
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
//  탭 ① 균형가격 찾기
// ══════════════════════════════════════════════════════════════
const PS = 330;
const PML = 40;
const PMR = 14;
const PMT = 14;
const PMB = 28;
const DEMAND = "#38bdf8";
const SUPPLY = "#fbbf24";

function MarketPlane({
  d,
  q,
  s,
  p,
  box,
  uid,
}: {
  d: number;
  q: number;
  s: number;
  p: number;
  box: Box;
  uid: string;
}) {
  const pw = PS - PML - PMR;
  const ph = PS - PMT - PMB;
  const X = (v: number) => PML + ((v - box.xMin) / (box.xMax - box.xMin)) * pw;
  const Y = (v: number) => PS - PMB - ((v - box.yMin) / (box.yMax - box.yMin)) * ph;
  const cid = `mkt-${uid}`;

  const gx: number[] = [];
  for (let v = box.xMin; v <= box.xMax; v += box.gx) gx.push(v);
  const gy: number[] = [];
  for (let v = box.yMin; v <= box.yMax; v += box.gy) gy.push(v);

  const dg = lineSeg(-d, q, box);
  const sg = lineSeg(s, p, box);
  const pt = marketPoint({ dSlope: d, dInt: q, sSlope: s, sInt: p });
  const ptIn = inBox(pt, box);

  return (
    <svg viewBox={`0 0 ${PS} ${PS}`} className="w-full max-w-[330px]" role="img" aria-label="수요곡선과 공급곡선">
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
        <text key={`tx${v}`} x={X(v)} y={PS - PMB + 13} textAnchor="middle" fontSize="9" fill="#64748b">
          {v}
        </text>
      ))}
      {gy.map((v) => (
        <text key={`ty${v}`} x={PML - 5} y={Y(v) + 3} textAnchor="end" fontSize="9" fill="#64748b">
          {v}
        </text>
      ))}
      <text x={PS - PMR} y={PS - 4} textAnchor="end" fontSize="9" fill="#475569">
        가격
      </text>
      <text x={4} y={PMT + 8} textAnchor="start" fontSize="9" fill="#475569">
        수량
      </text>

      <g clipPath={`url(#${cid})`}>
        {dg ? <line x1={X(dg.x1)} y1={Y(dg.y1)} x2={X(dg.x2)} y2={Y(dg.y2)} stroke={DEMAND} strokeWidth="2.4" strokeLinecap="round" /> : null}
        {sg ? <line x1={X(sg.x1)} y1={Y(sg.y1)} x2={X(sg.x2)} y2={Y(sg.y2)} stroke={SUPPLY} strokeWidth="2.4" strokeLinecap="round" /> : null}
      </g>

      {ptIn ? (
        <g>
          <line x1={X(pt[0])} y1={Y(pt[1])} x2={X(pt[0])} y2={PS - PMB} stroke="rgba(52,211,153,0.35)" strokeDasharray="3 3" />
          <line x1={PML} y1={Y(pt[1])} x2={X(pt[0])} y2={Y(pt[1])} stroke="rgba(52,211,153,0.35)" strokeDasharray="3 3" />
          <circle cx={X(pt[0])} cy={Y(pt[1])} r="6" fill="none" stroke="#34d399" strokeWidth="2" />
          <circle cx={X(pt[0])} cy={Y(pt[1])} r="3" fill="#34d399" />
          <text
            x={X(pt[0]) + (pt[0] > (box.xMin + box.xMax) / 2 ? -9 : 9)}
            y={Y(pt[1]) + (pt[1] > (box.yMin + box.yMax) / 2 ? 16 : -9)}
            textAnchor={pt[0] > (box.xMin + box.xMax) / 2 ? "end" : "start"}
            fontSize="11"
            fontWeight="bold"
            fill="#6ee7b7"
          >
            ({fmt(pt[0])}, {fmt(pt[1])})
          </text>
        </g>
      ) : null}
    </svg>
  );
}

function Knob({
  label,
  value,
  min,
  max,
  step,
  accent,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  accent: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-bold text-slate-300">{label}</span>
        <span className="font-mono text-sm text-slate-100">{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-1 w-full " + accent}
      />
    </div>
  );
}

function MarketTab() {
  const [sim, setSim] = useState(SIM_START);
  const [mi, setMi] = useState(0);

  const mk = MARKETS[mi];
  const simPt = marketPoint(sim);
  const simA = marketA(sim);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-500/[0.07] to-amber-500/[0.04] p-4">
        <p className="text-sm font-bold text-sky-200">🎛️ 수요와 공급을 움직여 균형점이 어디로 가는지 보세요</p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Knob
              label="수요가 값에 민감한 정도"
              value={sim.dSlope}
              min={SIM_RANGE.dSlope.min}
              max={SIM_RANGE.dSlope.max}
              step={SIM_RANGE.dSlope.step}
              accent="accent-sky-400"
              onChange={(v) => setSim((z) => ({ ...z, dSlope: v }))}
            />
            <Knob
              label="값이 0 일 때 사려는 양"
              value={sim.dInt}
              min={SIM_RANGE.dInt.min}
              max={SIM_RANGE.dInt.max}
              step={SIM_RANGE.dInt.step}
              accent="accent-sky-400"
              onChange={(v) => setSim((z) => ({ ...z, dInt: v }))}
            />
            <Knob
              label="공급이 값에 민감한 정도"
              value={sim.sSlope}
              min={SIM_RANGE.sSlope.min}
              max={SIM_RANGE.sSlope.max}
              step={SIM_RANGE.sSlope.step}
              accent="accent-amber-400"
              onChange={(v) => setSim((z) => ({ ...z, sSlope: v }))}
            />
            <Knob
              label="값이 0 일 때 내놓는 양"
              value={sim.sInt}
              min={SIM_RANGE.sInt.min}
              max={SIM_RANGE.sInt.max}
              step={SIM_RANGE.sInt.step}
              accent="accent-amber-400"
              onChange={(v) => setSim((z) => ({ ...z, sInt: v }))}
            />
          </div>

          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2 text-center">
                <p className="text-[10px] font-bold text-sky-300">수요함수</p>
                <Katex expr={lineTex(-sim.dSlope, sim.dInt)} className="text-sm text-slate-100" />
              </div>
              <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2 text-center">
                <p className="text-[10px] font-bold text-amber-300">공급함수</p>
                <Katex expr={lineTex(sim.sSlope, sim.sInt)} className="text-sm text-slate-100" />
              </div>
            </div>

            <div className="flex justify-center">
              <MarketPlane d={sim.dSlope} q={sim.dInt} s={sim.sSlope} p={sim.sInt} box={SIM_BOX} uid="sim" />
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3 text-center">
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex
                  expr={`${matTex(simA)} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = ${matTex(marketB(sim))}`}
                  className="whitespace-nowrap text-base text-slate-100"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                행렬식 <b className="text-amber-200">{fmt(det2(simA))}</b> — 수요 기울기의 크기와 공급 기울기를 더한 값이라 늘
                0 이 아니에요.
              </p>
              <p className="mt-1 text-sm font-bold text-emerald-200">
                균형가격 {fmt(simPt[0])}천원 · 균형거래량 {fmt(simPt[1])}개
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "값이 오르면 사려는 양은 줄고 내놓는 양은 늘어요. 그래서 두 직선이 반대로 기울어요.",
              "두 직선이 만나는 자리가 균형가격과 균형거래량이에요.",
              "수요가 늘면(파란 직선이 위로) 균형가격도 함께 올라가요.",
              "행렬식이 늘 양수라 균형점은 언제나 딱 하나 있어요.",
            ]}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {MARKETS.map((z, i) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setMi(i)}
            className={
              "rounded-lg border px-2.5 py-1.5 text-xs font-bold transition " +
              (mi === i ? "border-sky-400/60 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {z.emoji} {z.title}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-lg font-bold text-slate-100">
          {mk.emoji} {mk.title}
        </p>
        <p className="mt-1 text-xs leading-6 text-slate-300">{mk.lead}</p>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
          <div className="space-y-2">
            <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.06] p-3">
              <p className="mb-1 text-[10px] font-bold text-sky-300">수요함수 · 공급함수</p>
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={lineTex(-mk.dSlope, mk.dInt)} className="mr-4 text-base text-slate-100" />
                <Katex expr={lineTex(mk.sSlope, mk.sInt)} className="text-base text-slate-100" />
              </div>
            </div>
            <div className="rounded-xl border border-violet-400/25 bg-violet-400/[0.06] p-3">
              <p className="mb-1 text-[10px] font-bold text-violet-300">행렬로 나타내면</p>
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex
                  expr={`${matTex(marketA(mk))} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = ${matTex(marketB(mk))}`}
                  className="text-base text-slate-100"
                />
              </div>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                x 는 가격({mk.unitX}), y 는 거래량({mk.unitY})
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-center">
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={detTex(marketA(mk))} className="whitespace-nowrap text-base text-slate-100" />
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <MarketPlane d={mk.dSlope} q={mk.dInt} s={mk.sSlope} p={mk.sInt} box={mk.box} uid={mk.id} />
          </div>
        </div>
      </div>

      <StepRunner key={mk.id} steps={mk.steps} accent="sky" finale={mk.wrap} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 생산량 되짚기
// ══════════════════════════════════════════════════════════════
function FactoryTab() {
  const [fi, setFi] = useState(0);
  const f = FACTORIES[fi];
  const A = factoryA(f);
  const B = factoryB(f);
  const k = det2(A);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {FACTORIES.map((z, i) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setFi(i)}
            className={
              "rounded-lg border px-2.5 py-1.5 text-xs font-bold transition " +
              (fi === i ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {z.emoji} {z.title}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-lg font-bold text-slate-100">
          {f.emoji} {f.title}
        </p>
        <p className="mt-1 text-xs leading-6 text-slate-300">{f.lead}</p>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-sky-400/25 bg-slate-950/50 p-2">
            <p className="mb-1.5 text-[11px] font-bold text-sky-200">1개를 만드는 데 드는 양</p>
            <div className="overflow-x-auto overflow-y-hidden py-1">
              <table className="border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-white/10 px-2 py-1">
                      <span className="block text-right text-[9px] leading-3 text-slate-500">제품</span>
                      <span className="block text-left text-[9px] leading-3 text-slate-500">자원</span>
                    </th>
                    {f.goods.map((g) => (
                      <th key={g} className="whitespace-nowrap border border-white/10 bg-sky-400/[0.14] px-2.5 py-1 text-[11px] font-bold text-sky-100">
                        {g}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {f.resources.map((r, i) => (
                    <tr key={r}>
                      <th className="whitespace-nowrap border border-white/10 bg-sky-400/[0.14] px-2.5 py-1 text-[11px] font-bold text-sky-100">
                        {r} ({f.resUnits[i]})
                      </th>
                      {f.raw[i].map((v, j) => (
                        <td key={j} className="border border-white/10 px-2.5 py-1 text-right font-mono tabular-nums text-slate-100">
                          {won(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-3 py-2">
              <p className="text-[10px] font-bold text-rose-300">실제로 쓴 양</p>
              <p className="mt-0.5 text-sm font-bold text-slate-100">
                {f.resources[0]} {won(f.used[0])}
                {f.resUnits[0]} · {f.resources[1]} {won(f.used[1])}
                {f.resUnits[1]}
              </p>
            </div>
            <div className="rounded-xl border border-violet-400/25 bg-violet-400/[0.06] p-3">
              <p className="mb-1 text-[10px] font-bold text-violet-300">
                가로줄을 {f.scale[0]} 과 {f.scale[1]} 로 나누어 간단히 하면
              </p>
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex
                  expr={`${matTex(A)} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = ${matTex(B)}`}
                  className="text-base text-slate-100"
                />
              </div>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                x 는 {f.goods[0]}, y 는 {f.goods[1]} 의 개수
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-center">
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={detTex(A)} className="whitespace-nowrap text-base text-slate-100" />
              </div>
              {k !== 0 ? (
                <div className="mt-1 overflow-x-auto overflow-y-hidden py-1">
                  <Katex expr={`A^{-1} = ${invTex(A)}`} className="whitespace-nowrap text-base text-violet-100" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <StepRunner key={f.id} steps={f.steps} accent="emerald" finale={f.wrap} />

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">{REAL_NOTE}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 사용자 수 예측
// ══════════════════════════════════════════════════════════════
function UserBars({ a, b, names, max }: { a: number; b: number; names: [string, string]; max: number }) {
  const wa = Math.max(2, (a / max) * 100);
  const wb = Math.max(2, (b / max) * 100);
  return (
    <div className="space-y-1.5">
      {[
        { name: names[0], v: a, w: wa, bar: "bg-violet-400/70", text: "text-violet-100" },
        { name: names[1], v: b, w: wb, bar: "bg-amber-400/70", text: "text-amber-100" },
      ].map((z) => (
        <div key={z.name} className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-right text-[11px] font-bold text-slate-300">{z.name}</span>
          <div className="h-5 flex-1 rounded-md bg-white/[0.04]">
            <div className={"h-5 rounded-md " + z.bar} style={{ width: `${z.w}%` }} />
          </div>
          <span className={"w-16 shrink-0 text-right font-mono text-xs tabular-nums " + z.text}>{fmt(z.v)}</span>
        </div>
      ))}
    </div>
  );
}

function ForecastTab() {
  const [keepA, setKeepA] = useState(FC_SIM_START.keepA);
  const [keepB, setKeepB] = useState(FC_SIM_START.keepB);
  const [userA, setUserA] = useState(FC_SIM_START.userA);
  const [userB, setUserB] = useState(FC_SIM_START.userB);
  const [year, setYear] = useState(0);
  const [fi, setFi] = useState(0);

  const A: Mat = [
    [keepA, tidy(1 - keepA)],
    [tidy(1 - keepB), keepB],
  ];
  const start: [number, number] = [userA, userB];
  const now = afterYears(start, A, year);
  const ss = steadyState(start, A);
  const total = userA + userB;
  const fc = FORECASTS[fi];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.07] to-amber-500/[0.04] p-4">
        <p className="text-sm font-bold text-violet-200">🔮 한 해씩 보내며 사용자 수가 어떻게 움직이는지 보세요</p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Knob
              label="A 앱을 계속 쓸 확률"
              value={keepA}
              min={SIM_KEEP.min}
              max={SIM_KEEP.max}
              step={SIM_KEEP.step}
              accent="accent-violet-400"
              onChange={(v) => {
                setKeepA(Number(v.toFixed(1)));
                setYear(0);
              }}
            />
            <Knob
              label="B 앱을 계속 쓸 확률"
              value={keepB}
              min={SIM_KEEP.min}
              max={SIM_KEEP.max}
              step={SIM_KEEP.step}
              accent="accent-amber-400"
              onChange={(v) => {
                setKeepB(Number(v.toFixed(1)));
                setYear(0);
              }}
            />
            <Knob
              label="처음 A 앱 사용자"
              value={userA}
              min={FC_USER_RANGE.min}
              max={FC_USER_RANGE.max}
              step={FC_USER_RANGE.step}
              accent="accent-violet-400"
              onChange={(v) => {
                setUserA(v);
                setYear(0);
              }}
            />
            <Knob
              label="처음 B 앱 사용자"
              value={userB}
              min={FC_USER_RANGE.min}
              max={FC_USER_RANGE.max}
              step={FC_USER_RANGE.step}
              accent="accent-amber-400"
              onChange={(v) => {
                setUserB(v);
                setYear(0);
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-3 overflow-x-auto overflow-y-hidden py-1">
              <MatrixView
                m={A}
                label="전이행렬 A"
                tones={[
                  ["res", "b"],
                  ["b", "res"],
                ]}
              />
              <div className="text-[10px] leading-5 text-slate-400">
                <p>가로줄 = 올해 쓰던 앱</p>
                <p>세로줄 = 내년에 쓸 앱</p>
                <p className="text-slate-500">가로줄의 합은 늘 1</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-100">{year}년 뒤</p>
                <span className="font-mono text-[11px] text-slate-400">전체 {fmt(total)}명</span>
              </div>
              <div className="mt-2">
                <UserBars a={now[0]} b={now[1]} names={["A 앱", "B 앱"]} max={total} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setYear(year + 1)}
                  className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition " + ACC_BTN.violet}
                >
                  ⏩ 한 해 보내기
                </button>
                <button
                  type="button"
                  onClick={() => setYear(year + 10)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                >
                  ⏭️ 10년 건너뛰기
                </button>
                <button
                  type="button"
                  onClick={() => setYear(0)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                >
                  ↩️ 처음으로
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.08] px-3 py-2 text-center">
              <p className="text-[10px] text-slate-300">아주 오래 지나면 굳는 값</p>
              <p className="mt-0.5 text-sm font-bold text-emerald-200">
                A 앱 {fmt(ss[0])}명 · B 앱 {fmt(ss[1])}명
              </p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                갈아타는 비율 {fmt(tidy(1 - keepA))} 대 {fmt(tidy(1 - keepB))} 의 반대 비로 나뉘어요
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <GoalList
            items={[
              "한 해가 지날 때마다 전이행렬을 한 번씩 더 곱해요.",
              "전체 인원은 늘 그대로이고 두 앱 사이에서만 옮겨 다녀요.",
              "계속 쓸 확률이 높을수록 그 앱의 몫이 커져요.",
              "처음 사용자 수를 바꿔도 오래 지나면 같은 값으로 굳어요.",
            ]}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FORECASTS.map((z, i) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setFi(i)}
            className={
              "rounded-lg border px-2.5 py-1.5 text-xs font-bold transition " +
              (fi === i ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {z.emoji} {z.title}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-lg font-bold text-slate-100">
          {fc.emoji} {fc.title}
        </p>
        <p className="mt-1 text-xs leading-6 text-slate-300">{fc.lead}</p>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-violet-400/25 bg-slate-950/50 p-2">
            <p className="mb-1.5 text-[11px] font-bold text-violet-200">내년에 무엇을 쓸까 (확률)</p>
            <div className="overflow-x-auto overflow-y-hidden py-1">
              <table className="border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-white/10 px-2 py-1">
                      <span className="block text-right text-[9px] leading-3 text-slate-500">내년</span>
                      <span className="block text-left text-[9px] leading-3 text-slate-500">올해</span>
                    </th>
                    {fc.names.map((g) => (
                      <th key={g} className="whitespace-nowrap border border-white/10 bg-violet-400/[0.14] px-2.5 py-1 text-[11px] font-bold text-violet-100">
                        {g}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fc.names.map((r, i) => (
                    <tr key={r}>
                      <th className="whitespace-nowrap border border-white/10 bg-violet-400/[0.14] px-2.5 py-1 text-[11px] font-bold text-violet-100">
                        {r}
                      </th>
                      {fc.A[i].map((v, j) => (
                        <td key={j} className="border border-white/10 px-2.5 py-1 text-right font-mono tabular-nums text-slate-100">
                          {fmt(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <p className="mb-1 text-[10px] font-bold text-slate-400">올해 사용자 수</p>
              <div className="overflow-x-auto overflow-y-hidden py-1">
                <Katex expr={`B = ${matTex([[fc.start[0], fc.start[1]]])}`} className="text-base text-slate-100" />
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                내년은 <Katex expr="BA" className="text-violet-200" />, 내후년은 <Katex expr="BA^2" className="text-violet-200" />,
                n년 뒤는 <Katex expr="BA^n" className="text-violet-200" /> 이에요.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <p className="mb-1.5 text-[10px] font-bold text-slate-400">해마다의 사용자 수</p>
              <div className="space-y-1.5">
                {[0, 1, 2, 3].map((n) => {
                  const p = afterYears(fc.start, fc.A, n);
                  return (
                    <div key={n} className="flex items-center gap-2">
                      <span className="w-12 shrink-0 text-right text-[10px] font-bold text-slate-400">{n}년 뒤</span>
                      <div className="flex-1">
                        <UserBars a={p[0]} b={p[1]} names={fc.names} max={fc.start[0] + fc.start[1]} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StepRunner key={fc.id} steps={fc.steps} accent="violet" finale={fc.wrap} />

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">{REAL_NOTE}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 사회 연결망
// ══════════════════════════════════════════════════════════════
/** 문제용 연결망에서 친구가 가장 많은 사람 — 그림의 강조와 정답이 어긋나지 않게 데이터에서 뽑는다 */
const FIXED_TOP = FIXED_DEG.indexOf(Math.max(...FIXED_DEG));

const NS = 300;
const NR = 108;
const NC = NS / 2;

function NetGraph({ edges, onToggle, highlight }: { edges: Edge[]; onToggle?: (a: number, b: number) => void; highlight: number }) {
  const px = (i: number) => NC + NET_POS[i][0] * NR;
  const py = (i: number) => NC + NET_POS[i][1] * NR;
  const has = (a: number, b: number) => edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const deg = degreesOf(adjOf(NET_N, edges));
  const pairs: Edge[] = [];
  for (let i = 0; i < NET_N; i++) for (let j = i + 1; j < NET_N; j++) pairs.push([i, j]);

  return (
    <svg viewBox={`0 0 ${NS} ${NS}`} className="w-full max-w-[300px]" role="img" aria-label="사회 연결망 그림">
      {pairs.map(([i, j]) => {
        const on = has(i, j);
        if (!on && !onToggle) return null;
        return (
          <line
            key={edgeKey(i, j)}
            x1={px(i)}
            y1={py(i)}
            x2={px(j)}
            y2={py(j)}
            stroke={on ? "#fb7185" : "rgba(255,255,255,0.10)"}
            strokeWidth={on ? 3 : 8}
            strokeDasharray={on ? undefined : "2 6"}
            strokeLinecap="round"
            className={onToggle ? "cursor-pointer" : undefined}
            onClick={onToggle ? () => onToggle(i, j) : undefined}
          />
        );
      })}
      {NET_PEOPLE.map((name, i) => (
        <g key={name}>
          <circle
            cx={px(i)}
            cy={py(i)}
            r="22"
            fill={i === highlight ? "#065f46" : "#1e293b"}
            stroke={i === highlight ? "#34d399" : "rgba(255,255,255,0.25)"}
            strokeWidth="2"
          />
          <text x={px(i)} y={py(i) + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#e2e8f0">
            {name}
          </text>
          <text x={px(i)} y={py(i) + 36} textAnchor="middle" fontSize="10" fill="#94a3b8">
            친구 {deg[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function NetworkTab() {
  const [edges, setEdges] = useState<Edge[]>(NET_START);
  const [msi, setMsi] = useState(0);
  const [cleared, setCleared] = useState<Record<string, boolean>>({});
  const [showA2, setShowA2] = useState(false);

  const A = adjOf(NET_N, edges);
  const deg = degreesOf(A);
  const A2 = mulM(A, A);
  const top = Math.max(...deg);
  const winners = deg.map((v, i) => (v === top ? i : -1)).filter((i) => i >= 0);
  const ms = NET_MISSIONS[msi];
  const hit = netMissionDone(ms, edges);
  const doneCount = NET_MISSIONS.filter((z) => cleared[z.id] === true).length;

  const toggle = (a: number, b: number) => {
    setEdges((z) => (z.some(([x, y]) => (x === a && y === b) || (x === b && y === a)) ? z.filter(([x, y]) => !((x === a && y === b) || (x === b && y === a))) : [...z, [a, b] as Edge]));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.07] to-rose-500/[0.04] p-4">
        <p className="text-sm font-bold text-amber-200">🔗 선을 눌러 이었다 끊었다 하며 행렬이 어떻게 바뀌는지 보세요</p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="flex justify-center">
            <NetGraph edges={edges} onToggle={toggle} highlight={winners.length === 1 ? winners[0] : -1} />
          </div>

          <div className="space-y-2">
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-slate-300">인접행렬</p>
                <button
                  type="button"
                  onClick={() => setShowA2(!showA2)}
                  className={
                    "rounded-lg border px-2.5 py-1 text-[11px] font-bold transition " +
                    (showA2 ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  {showA2 ? "A² 숨기기" : "A² 보기"}
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-start gap-3 overflow-x-auto overflow-y-hidden py-1">
                <div className="flex gap-1">
                  <div className="flex flex-col gap-1 pt-[18px]">
                    {NET_PEOPLE.map((p) => (
                      <span key={p} className="flex h-7 items-center justify-end whitespace-nowrap text-[10px] font-bold text-slate-400">
                        {p}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="grid gap-1 pl-[10px]" style={{ gridTemplateColumns: `repeat(${NET_N}, minmax(0, 1fr))` }}>
                      {NET_PEOPLE.map((p) => (
                        <span key={p} className="whitespace-nowrap text-center text-[9px] font-bold text-slate-500">
                          {p}
                        </span>
                      ))}
                    </div>
                    <MatrixView
                      m={A}
                      size="sm"
                      tones={A.map((row, i) => row.map((v, j) => (i === j ? "dim" : v === 1 ? "hit" : "base")))}
                    />
                  </div>
                </div>

                <div className="flex items-end gap-1.5">
                  <span className="pb-3 text-lg font-bold text-slate-400">·</span>
                  <MatrixView m={fillM(NET_N, 1, 1)} size="sm" label="모두 1" tones={fillM(NET_N, 1, 1).map((r) => r.map(() => "b" as Tone))} />
                  <span className="pb-3 text-lg font-bold text-slate-400">=</span>
                  <MatrixView m={deg.map((d) => [d])} size="sm" label="친구 수" tones={deg.map(() => ["res" as Tone])} />
                </div>
              </div>

              {showA2 ? (
                <div className="mt-2 border-t border-white/10 pt-2">
                  <p className="mb-1 text-[11px] font-bold text-slate-300">A² — 두 다리로 가는 길의 수</p>
                  <div className="overflow-x-auto overflow-y-hidden py-1">
                    <MatrixView
                      m={A2}
                      size="sm"
                      tones={A2.map((row, i) => row.map((v, j) => (i === j ? "b" : v > 0 ? "res" : "dim")))}
                    />
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    노란 대각선은 그 사람의 친구 수와 같아요. 0 인 칸은 두 다리로도 닿지 못한다는 뜻이에요.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
              <p className="text-[11px] leading-5 text-slate-300">
                선 <b className="text-rose-200">{edges.length}개</b> ·{" "}
                {winners.length === 1 ? (
                  <>
                    영향력 1등은 <b className="text-emerald-200">{NET_PEOPLE[winners[0]]}</b> (친구 {top}명)
                  </>
                ) : (
                  <>친구 {top}명인 사람이 {winners.length}명이라 1등이 갈리지 않아요</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-emerald-200">🎯 미션 — 선을 이어 목표를 이뤄 보세요</p>
          <span className="font-mono text-xs text-slate-300">
            해결 {doneCount} / {NET_MISSIONS.length}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {NET_MISSIONS.map((z, i) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setMsi(i)}
              className={
                "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                (msi === i
                  ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100"
                  : cleared[z.id] === true
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {cleared[z.id] === true ? "✅ " : ""}
              {z.emoji} {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-xl border-2 border-emerald-400/40 bg-emerald-400/10 px-3 py-3 text-center">
          <p className="text-xs text-slate-300">목표</p>
          <p className="mt-1 text-base font-bold text-emerald-100">{ms.goal}</p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCleared((z) => ({ ...z, [ms.id]: hit }))}
            className={"rounded-lg border-2 px-4 py-1.5 text-xs font-bold transition " + ACC_BTN.emerald}
          >
            지금 연결망으로 확인
          </button>
          <button
            type="button"
            onClick={() => setEdges(NET_START)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 처음으로
          </button>
          {cleared[ms.id] === true && msi < NET_MISSIONS.length - 1 ? (
            <button
              type="button"
              onClick={() => setMsi(msi + 1)}
              className="rounded-lg border-2 border-emerald-400/55 bg-emerald-400/15 px-4 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/25"
            >
              다음 미션 →
            </button>
          ) : null}
        </div>

        <div className="mt-2 min-h-[38px]">
          {cleared[ms.id] === true ? <Verdict ok>목표를 이뤘어요! 지금 선은 {edges.length}개입니다.</Verdict> : <TipBox>{ms.hint}</TipBox>}
        </div>

        {doneCount === NET_MISSIONS.length ? (
          <div className="mt-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3 text-center">
            <p className="text-sm font-bold text-emerald-100">🏆 네 미션을 모두 이뤘어요!</p>
            <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-slate-200">
              0 과 1 만 적은 표 하나로 누가 중심인지, 누가 외톨이인지, 몇 다리면 닿는지가 모두 드러나요.
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-sm font-bold text-slate-100">📋 아래 문제는 이 연결망으로 풀어요</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="flex justify-center">
            <NetGraph edges={NET_FIXED} highlight={FIXED_TOP} />
          </div>
          <div className="flex flex-wrap items-start gap-3 overflow-x-auto overflow-y-hidden py-1">
            <MatrixView
              m={FIXED_A}
              size="sm"
              label="인접행렬"
              tones={FIXED_A.map((row, i) => row.map((v, j) => (i === j ? "dim" : v === 1 ? "hit" : "base")))}
            />
            <MatrixView
              m={FIXED_A2}
              size="sm"
              label="A²"
              tones={FIXED_A2.map((row, i) => row.map((v, j) => (i === j ? "b" : v > 0 ? "res" : "dim")))}
            />
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-slate-500">
          가로줄과 세로줄의 차례는 {NET_PEOPLE.join(" · ")} 예요.
        </p>
      </div>

      <StepRunner steps={NET_STEPS} accent="amber" finale="관계를 숫자로 바꾸면 눈으로 보이지 않던 것까지 셈으로 알 수 있어요." />
    </div>
  );
}
