"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  A_INIT,
  A_LIST,
  BASE_GOALS,
  BASE_QUIZ,
  BASE_VIEW,
  FORM_TASKS,
  HLINE,
  INV_GOALS,
  INV_QUIZ,
  INV_VIEW,
  MEET_CASES,
  MEET_CONCEPT,
  MISSIONS,
  MISS_VIEW,
  MOVE_A,
  MOVE_INIT,
  MOVE_PQ,
  MOVE_VIEW,
  PLANE,
  QUAD_NAME,
  ZOOMS,
  ZOOM_INIT,
  baseQuadrant,
  clipSamples,
  irrSamples,
  meetInv,
  niceTicks,
  quadrantsOf,
  sx,
  sy,
  tickLabel,
  type FormTask,
  type MeetCase,
  type Mission,
  type Piece,
  type Pt,
  type Quiz,
  type View,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "square_to_root",
    prompt:
      "y = x² 의 정의역을 x ≥ 0 으로 좁혀야 역함수가 생기는 까닭을 설명하고, y = √x 의 그래프가 그것과 어떤 관계인지 써 보세요.",
    kind: "text",
    placeholder:
      "예: 정의역이 실수 전체이면 1 과 −1 이 같은 값 1 을 가져 일대일이 아니다. 수평선을 그으면 두 점에서 만나는 것이 그 증거다. 정의역을 x ≥ 0 으로 좁히면 수평선이 많아야 한 점에서만 만나 일대일대응이 되고 역함수가 생긴다. 그 역함수가 y = √x 이고, 두 그래프는 직선 y = x 에 대하여 대칭이며 (0, 0) 과 (1, 1) 에서 만난다.",
  },
  {
    id: "shape_and_move",
    prompt:
      "y = ±√(ax) 의 네 가지 그래프가 각각 어느 사분면에 놓이는지와 |a| 가 하는 일을 정리하고, y = √(a(x−p)) + q 의 정의역과 치역이 어떻게 정해지는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: a 의 부호가 정의역이 뻗는 쪽을, 근호 앞의 부호가 치역이 놓이는 쪽을 정한다. a > 0 이고 + 이면 제1사분면, a < 0 이고 + 이면 제2사분면, a < 0 이고 − 이면 제3사분면, a > 0 이고 − 이면 제4사분면이다. |a| 가 커지면 같은 x 에서 |y| 가 커져 x축에서 멀어진다. 평행이동하면 시작점이 (p, q) 로 옮겨가 정의역은 a > 0 이면 x ≥ p, a < 0 이면 x ≤ p 가 되고 치역은 근호 앞이 + 이면 y ≥ q 다.",
  },
  {
    id: "meet_off_line",
    prompt:
      "무리함수와 그 역함수의 교점이 언제나 y = x 위에 있는 것은 아니라는 것을 활동에서 본 예로 설명하고, 증가하는 함수일 때는 왜 반드시 y = x 위에 있는지 써 보세요.",
    kind: "text",
    placeholder:
      "예: y = √(13−4x) 는 f(1) = 3, f(3) = 1 이라 (1, 3) 과 (3, 1) 에서도 만나 교점이 모두 세 개다. 확대해 보면 y = x 에서 떨어진 두 곳에서도 두 곡선이 분명히 스친다. 그런데 f 가 증가함수이면 f(α) = β, f(β) = α 이고 α < β 라 할 때 f 가 증가하므로 β < α 가 되어 모순이다. 그래서 증가하는 함수는 교점이 반드시 y = x 위에 있다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "inv" | "base" | "move" | "meet" | "miss";

const ABC = ["①", "②", "③", "④"];

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition " +
        (active ? "border-violet-400/60 bg-violet-400/15 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

function Chips({ ids, cur, done, onPick }: { ids: string[]; cur: number; done: string[]; onPick: (i: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ids.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => onPick(i)}
          className={
            "h-8 min-w-[2rem] rounded-lg border-2 px-1.5 font-mono text-xs font-bold transition " +
            (i === cur
              ? "border-violet-400/70 bg-violet-400/20 text-violet-100"
              : done.includes(id)
                ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
                : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
          }
        >
          {done.includes(id) && i !== cur ? "✓" : i + 1}
        </button>
      ))}
      <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300">
        {done.length} / {ids.length}
      </span>
    </div>
  );
}

function NextBtn({ onClick, label = "다음 ▶" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-3 py-2.5 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25"
    >
      {label}
    </button>
  );
}

function PieceText({ items }: { items: Piece[] }) {
  return (
    <>
      {items.map((p, i) => (
        <span key={i} className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1">
          {p.pre ? <span>{p.pre}</span> : null}
          {p.tex ? (
            <span className="min-w-0 py-0.5">
              <Katex expr={p.tex} />
            </span>
          ) : null}
          {p.post ? <span>{p.post}</span> : null}
        </span>
      ))}
    </>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">{children}</p>;
}

function Verdict({ right, why, hint }: { right: boolean; why: string; hint: string }) {
  return right ? (
    <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {why}</p>
  ) : (
    <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {hint}</p>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  accent = "accent-violet-400",
  show,
}: {
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  accent?: string;
  show?: string;
}) {
  return (
    <label className="block text-[11px] font-bold text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        {label} <span className="font-mono text-[13px] text-slate-100">{show ?? value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-0.5 w-full " + accent}
      />
    </label>
  );
}

/** 켜진 색은 미리 적어 둔 고정 문자열이어야 한다 (Tailwind 가 훑어 갈 수 있게). */
const TOGGLE_ON: Record<string, string> = {
  violet: "border-violet-400/60 bg-violet-400/15 text-violet-100",
  sky: "border-sky-400/60 bg-sky-400/15 text-sky-100",
  pink: "border-pink-400/60 bg-pink-400/15 text-pink-100",
  slate: "border-slate-400/60 bg-white/10 text-slate-100",
};

function Toggle({ on, onClick, children, tone = "violet" }: { on: boolean; onClick: () => void; children: React.ReactNode; tone?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "w-full rounded-xl border-2 px-3 py-2 text-[12px] font-bold transition " +
        (on ? TOGGLE_ON[tone] : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {on ? "✓ " : ""}
      {children}
    </button>
  );
}

function GoalList({ goals, seen }: { goals: string[]; seen: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className="text-[11px] font-bold text-slate-400">해 볼 것 세 가지</p>
      <div className="mt-1 space-y-1 text-[12px] leading-6">
        {goals.map((g, i) => (
          <p key={g} className={seen.includes(String(i)) ? "text-emerald-200" : "text-slate-400"}>
            {seen.includes(String(i)) ? "✓" : "○"} {g}
          </p>
        ))}
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex min-w-0 flex-wrap items-baseline gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-bold text-slate-200">
      <span className="text-[10px] text-slate-400">{label}</span>
      {children}
    </span>
  );
}

function MixedChoices({
  items,
  pick,
  answer,
  onPick,
}: {
  items: Piece[][];
  pick: number | undefined;
  answer: number;
  onPick: (i: number) => void;
}) {
  const right = pick === answer;
  return (
    <div className="space-y-1.5">
      {items.map((row, i) => {
        const good = pick === i && i === answer;
        const bad = pick === i && i !== answer;
        return (
          <button
            key={row.map((p) => (p.pre ?? "") + (p.tex ?? "") + (p.post ?? "")).join("")}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "flex w-full min-w-0 items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-[13px] font-bold transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : bad
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="shrink-0 text-[11px] text-slate-400">{ABC[i]}</span>
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-1">
              <PieceText items={row} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TexChoices({
  items,
  pick,
  answer,
  onPick,
}: {
  items: string[];
  pick: number | undefined;
  answer: number;
  onPick: (i: number) => void;
}) {
  const right = pick === answer;
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map((s, i) => {
        const good = pick === i && i === answer;
        const bad = pick === i && i !== answer;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "flex min-w-0 items-center gap-1.5 rounded-xl border-2 px-2.5 py-2.5 text-[15px] transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : bad
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="text-[11px] text-slate-400">{ABC[i]}</span>
            <span className="min-w-0 py-0.5">
              <Katex expr={s} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function QuizCard({ q, pick, onPick }: { q: Quiz; pick: number | undefined; onPick: (i: number) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] font-bold text-slate-100">{q.prompt}</p>
      <MixedChoices items={q.choices} pick={pick} answer={q.answer} onPick={onPick} />
      {pick !== undefined ? <Verdict right={pick === q.answer} why={q.why} hint={q.choiceWhy[pick]} /> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 좌표평면
// ══════════════════════════════════════════════════════════════
type Poly = { pts: Pt[]; color: string; width?: number; dash?: string };
type Dot = { x: number; y: number; color: string; label?: string };

function pathOf(view: View, pts: Pt[]): string {
  return "M " + pts.map((p) => `${sx(view, p.x).toFixed(2)} ${sy(view, p.y).toFixed(2)}`).join(" L ");
}

function Plane({
  view,
  polys,
  dots = [],
  diag = false,
  hLine = null,
  aria = "무리함수의 그래프",
}: {
  view: View;
  polys: Poly[];
  dots?: Dot[];
  diag?: boolean;
  hLine?: number | null;
  aria?: string;
}) {
  const W = PLANE.w;
  const H = PLANE.h;
  const pad = PLANE.pad;
  const span = view.xMax - view.xMin;
  const ticks = niceTicks(view.xMin, view.xMax);
  const hasX0 = view.yMin <= 0 && 0 <= view.yMax;
  const hasY0 = view.xMin <= 0 && 0 <= view.xMax;
  const axY = hasX0 ? sy(view, 0) : view.yMin > 0 ? H - pad : pad;
  const axX = hasY0 ? sx(view, 0) : view.xMin > 0 ? pad : W - pad;
  // 눈금 글자는 축이 창 밖으로 밀려도 칸 안에 남도록 가둔다
  const labY = Math.min(Math.max(axY + 13, pad + 10), H - 4);
  const labX = Math.min(Math.max(axX - 6, 30), W - 4);

  // y = x 를 창 안에서 자른 선분
  const d0 = Math.max(view.xMin, view.yMin);
  const d1 = Math.min(view.xMax, view.yMax);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-[340px]" role="img" aria-label={aria}>
      <rect x={0} y={0} width={W} height={H} fill="#020617" rx={12} />
      {ticks.map((t) => (
        <g key={"g" + t}>
          <line x1={sx(view, t)} y1={pad} x2={sx(view, t)} y2={H - pad} stroke="#1e293b" strokeWidth={1} />
          <line x1={pad} y1={sy(view, t)} x2={W - pad} y2={sy(view, t)} stroke="#1e293b" strokeWidth={1} />
        </g>
      ))}
      <line x1={pad} y1={axY} x2={W - pad} y2={axY} stroke="#64748b" strokeWidth={1.6} />
      <line x1={axX} y1={pad} x2={axX} y2={H - pad} stroke="#64748b" strokeWidth={1.6} />
      {ticks.map((t) => (
        <g key={"n" + t}>
          <text x={sx(view, t)} y={labY} fontSize={9.5} textAnchor="middle" fill="#64748b" fontFamily="ui-monospace, monospace">
            {tickLabel(t, span)}
          </text>
          <text x={labX} y={sy(view, t) + 3.5} fontSize={9.5} textAnchor="end" fill="#64748b" fontFamily="ui-monospace, monospace">
            {tickLabel(t, span)}
          </text>
        </g>
      ))}

      {diag && d1 > d0 ? (
        <g>
          <line x1={sx(view, d0)} y1={sy(view, d0)} x2={sx(view, d1)} y2={sy(view, d1)} stroke="#fbbf24" strokeWidth={1.4} strokeDasharray="6 4" />
          <text x={sx(view, d1) - 6} y={sy(view, d1) + 14} fontSize={10.5} fontWeight={700} textAnchor="end" fill="#fcd34d">
            y = x
          </text>
        </g>
      ) : null}

      {hLine !== null && hLine >= view.yMin && hLine <= view.yMax ? (
        <line x1={pad} y1={sy(view, hLine)} x2={W - pad} y2={sy(view, hLine)} stroke="#f472b6" strokeWidth={1.4} strokeDasharray="5 4" />
      ) : null}

      {polys.map((p, i) =>
        p.pts.length > 1 ? (
          <path key={i} d={pathOf(view, p.pts)} fill="none" stroke={p.color} strokeWidth={p.width ?? 2.4} strokeDasharray={p.dash} strokeLinecap="round" />
        ) : null
      )}

      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={sx(view, d.x)} cy={sy(view, d.y)} r={4.6} fill={d.color} stroke="#020617" strokeWidth={1.2} />
          {d.label ? (
            <text x={sx(view, d.x) + 7} y={sy(view, d.y) - 7} fontSize={10} fontWeight={700} fill={d.color}>
              {d.label}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function IrrationalGraphLab() {
  const [tab, setTab] = useState<Tab>("inv");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-violet-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">📈 무리함수의 그래프</h3>
        <p className="mt-2 leading-7 text-slate-300">
          무리함수의 그래프는 <b className="text-violet-200">제곱함수를 y = x 에 비춘 모습</b>입니다. 슬라이더로 곡선을 움직여 보고, 확대해 숨은 교점까지 찾아보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "inv"} onClick={() => setTab("inv")}>
          ① 뒤집으면 √ 🔁
        </TabButton>
        <TabButton active={tab === "base"} onClick={() => setTab("base")}>
          ② 네 갈래 기본형 🧭
        </TabButton>
        <TabButton active={tab === "move"} onClick={() => setTab("move")}>
          ③ 평행이동 🎚️
        </TabButton>
        <TabButton active={tab === "meet"} onClick={() => setTab("meet")}>
          ④ 교점 사냥 🔬
        </TabButton>
        <TabButton active={tab === "miss"} onClick={() => setTab("miss")}>
          ⑤ 사분면 미션 🎯
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "inv" ? <InvTab /> : null}
        {tab === "base" ? <BaseTab /> : null}
        {tab === "move" ? <MoveTab /> : null}
        {tab === "meet" ? <MeetTab /> : null}
        {tab === "miss" ? <MissTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 뒤집으면 √
// ══════════════════════════════════════════════════════════════
function InvTab() {
  const [half, setHalf] = useState(false);
  const [showInv, setShowInv] = useState(false);
  const [c, setC] = useState(HLINE.init);
  const [seen, setSeen] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const V = INV_VIEW;
  const mark = (i: number) => setSeen((s) => (s.includes(String(i)) ? s : [...s, String(i)]));

  const meets: number[] = c < 0 ? [] : c === 0 ? [0] : half ? [Math.sqrt(c)] : [-Math.sqrt(c), Math.sqrt(c)];
  const polys: Poly[] = [
    ...clipSamples((x) => x * x, half ? 0 : -3, 3, V, 360).map((pts) => ({ pts, color: "#38bdf8", width: 2.4 })),
  ];
  if (showInv) polys.push({ pts: irrSamples(1, 0, 0, 1, V, 200), color: "#f472b6", width: 2.4 });

  const dots: Dot[] = meets.map((x) => ({ x, y: c, color: "#a3e635" }));
  if (showInv) {
    dots.push({ x: 0, y: 0, color: "#fbbf24" });
    dots.push({ x: 1, y: 1, color: "#fbbf24" });
  }

  const q = INV_QUIZ[qi];
  const doneIds = INV_QUIZ.filter((v) => pick[v.id] === v.answer).map((v) => v.id);
  const cleared = pick[q.id] === q.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🔁 수평선으로 일대일인지 알아보기</p>
        <TipBox>
          📖 어떤 수평선과도 <b className="text-lime-200">많아야 한 점</b>에서 만나야 일대일이에요. 일대일대응이라야 역함수가 생깁니다.
        </TipBox>
        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <Plane view={V} polys={polys} dots={dots} diag={showInv} hLine={c} aria="제곱함수와 그 역함수" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Slider
              label="수평선 y ="
              value={c}
              min={HLINE.min}
              max={HLINE.max}
              step={HLINE.step}
              onChange={(v) => {
                setC(v);
                if (!half && v > 0) mark(0);
                if (half && v > 0) mark(1);
              }}
              accent="accent-pink-400"
            />
            <div className="flex flex-wrap gap-1.5">
              <span
                className={
                  "rounded-lg px-2.5 py-1.5 text-[12px] font-extrabold " +
                  (meets.length >= 2 ? "bg-rose-400/20 text-rose-100" : "bg-lime-400/20 text-lime-100")
                }
              >
                만나는 점 {meets.length} 개
              </span>
              <Info label="지금">
                <span>{half ? "일대일이에요" : meets.length >= 2 ? "일대일이 아니에요" : "아직 모르겠어요"}</span>
              </Info>
            </div>
            <Toggle
              on={half}
              onClick={() => {
                setHalf((v) => !v);
                if (!half) mark(1);
              }}
              tone="sky"
            >
              정의역을 x ≥ 0 으로 좁히기
            </Toggle>
            <Toggle
              on={showInv}
              onClick={() => {
                setShowInv((v) => !v);
                if (!showInv) mark(2);
              }}
              tone="pink"
            >
              역함수 y = √x 와 y = x 보기
            </Toggle>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
              <span className="rounded-md bg-sky-400/15 px-2 py-1 text-sky-100">
                <Katex expr={half ? "y=x^2\\ (x\\geq 0)" : "y=x^2"} />
              </span>
              {showInv ? (
                <span className="rounded-md bg-pink-400/15 px-2 py-1 text-pink-100">
                  <Katex expr="y=\sqrt{x}" />
                </span>
              ) : null}
            </div>
            {showInv ? (
              <TipBox>
                💡 두 곡선은 <b className="text-amber-200">y = x</b> 에 대칭이고 노란 점 (0, 0), (1, 1) 에서 만나요.
              </TipBox>
            ) : null}
          </div>
        </div>
        <div className="mt-2">
          <GoalList goals={INV_GOALS} seen={seen} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✏️ 확인 문제</p>
          <Chips ids={INV_QUIZ.map((v) => v.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <QuizCard q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < INV_QUIZ.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((v) => v + 1)} label="다음 문제 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === INV_QUIZ.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 다섯 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            무리함수의 그래프는 <b className="text-white">제곱함수의 그래프를 y = x 에 비춘 모습</b>이에요. 정의역을 어떻게 잡느냐가 역함수의 정의역을 정합니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 네 갈래 기본형
// ══════════════════════════════════════════════════════════════
function BaseTab() {
  const [ai, setAi] = useState(A_INIT);
  const [s, setS] = useState<1 | -1>(1);
  const [all, setAll] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const a = A_LIST[ai];
  const V = BASE_VIEW;
  const mark = (i: number) => setSeen((v) => (v.includes(String(i)) ? v : [...v, String(i)]));

  const polys: Poly[] = [];
  if (all) {
    for (const aa of [a, -a])
      for (const ss of [1, -1] as (1 | -1)[])
        if (!(aa === a && ss === s))
          polys.push({ pts: irrSamples(aa, 0, 0, ss, V, 200), color: "#475569", width: 1.6, dash: "5 4" });
  }
  polys.push({ pts: irrSamples(a, 0, 0, s, V, 200), color: s === 1 ? "#38bdf8" : "#f472b6", width: 2.8 });

  const quad = baseQuadrant(a, s);
  const fnTex = `y=${s === -1 ? "-" : ""}\\sqrt{${a}x}`;

  const q = BASE_QUIZ[qi];
  const doneIds = BASE_QUIZ.filter((v) => pick[v.id] === v.answer).map((v) => v.id);
  const cleared = pick[q.id] === q.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🧭 부호 두 개가 사분면을 정해요</p>
        <TipBox>
          📖 <b className="text-sky-200">a 의 부호</b>가 정의역이 뻗는 쪽을, <b className="text-pink-200">근호 앞의 부호</b>가 치역이 놓이는 쪽을 정합니다.
        </TipBox>
        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <Plane view={V} polys={polys} aria="기본형 무리함수" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="flex justify-center rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-[18px]">
              <span className="min-w-0">
                <Katex expr={fnTex} />
              </span>
            </div>
            <Slider
              label={<Katex expr="a=" />}
              value={ai}
              min={0}
              max={A_LIST.length - 1}
              step={1}
              onChange={(v) => {
                setAi(v);
                if (A_LIST[v] < 0) mark(0);
                if (Math.abs(A_LIST[v]) >= 3) mark(2);
              }}
              accent="accent-sky-400"
              show={String(a)}
            />
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setS(1)}
                className={
                  "rounded-xl border-2 px-2 py-2 text-[15px] transition " +
                  (s === 1 ? "border-sky-400/70 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                <Katex expr="+\sqrt{ax}" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setS(-1);
                  mark(1);
                }}
                className={
                  "rounded-xl border-2 px-2 py-2 text-[15px] transition " +
                  (s === -1 ? "border-pink-400/70 bg-pink-400/20 text-pink-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                <Katex expr="-\sqrt{ax}" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-lg border border-violet-400/40 bg-violet-400/15 px-2.5 py-1.5 text-[12px] font-bold text-violet-100">
                {QUAD_NAME[quad - 1]}
              </span>
              <Info label="정의역">
                <Katex expr={a > 0 ? "x\\geq 0" : "x\\leq 0"} />
              </Info>
              <Info label="치역">
                <Katex expr={s === 1 ? "y\\geq 0" : "y\\leq 0"} />
              </Info>
            </div>
            <Toggle on={all} onClick={() => setAll((v) => !v)} tone="slate">
              나머지 세 갈래 겹쳐 보기
            </Toggle>
          </div>
        </div>
        <div className="mt-2">
          <GoalList goals={BASE_GOALS} seen={seen} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✏️ 확인 문제</p>
          <Chips ids={BASE_QUIZ.map((v) => v.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <QuizCard q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < BASE_QUIZ.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((v) => v + 1)} label="다음 문제 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === BASE_QUIZ.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 갈래를 모두 익혔어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            네 그래프는 <b className="text-white">x축·y축·원점에 대하여 서로 대칭</b>이고, <b className="text-white">|a| 가 커질수록 x축에서 멀어져요</b>.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 평행이동
// ══════════════════════════════════════════════════════════════
function FormCard({
  task,
  pick,
  domPick,
  onPick,
  onDomPick,
}: {
  task: FormTask;
  pick: number | undefined;
  domPick: number | undefined;
  onPick: (i: number) => void;
  onDomPick: (i: number) => void;
}) {
  const step = task.steps[0];
  const solved = pick === step.answer;
  const domSolved = domPick === task.domAnswer;

  return (
    <div className="space-y-2">
      <div className="flex min-h-[64px] items-center justify-center rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-[20px]">
        <span className="min-w-0 py-1">
          <Katex expr={task.rawTex} />
        </span>
      </div>
      <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="rounded-md border border-amber-400/40 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-100">{step.badge}</span>
          <p className="text-[13px] font-bold text-slate-100">{step.q}</p>
        </div>
        <TexChoices items={step.choices} pick={pick} answer={step.answer} onPick={onPick} />
        {pick !== undefined ? <Verdict right={solved} why={step.why} hint={step.choiceWhy[pick]} /> : null}
      </div>

      {solved ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
          <p className="text-[13px] font-bold text-slate-100">정의역과 치역은?</p>
          <MixedChoices items={task.domChoices} pick={domPick} answer={task.domAnswer} onPick={onDomPick} />
          {domPick !== undefined ? <Verdict right={domSolved} why={task.domNote} hint={task.domWhy[domPick]} /> : null}
        </div>
      ) : null}

      {domSolved ? (
        <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-3 py-3">
          <Plane
            view={MOVE_VIEW}
            polys={[
              { pts: irrSamples(task.a, 0, 0, task.s, MOVE_VIEW, 200), color: "#475569", width: 1.6, dash: "5 4" },
              { pts: irrSamples(task.a, task.p, task.q, task.s, MOVE_VIEW, 200), color: "#34d399", width: 2.6 },
            ]}
            dots={[{ x: task.p, y: task.q, color: "#fbbf24", label: `(${task.p}, ${task.q})` }]}
            aria="변형한 무리함수의 그래프"
          />
          <p className="mt-1 text-center text-[11px] leading-6 text-slate-400">
            회색 점선이 옮기기 전 곡선이에요. 시작점이 노란 점 <Katex expr={`(${task.p},\\ ${task.q})`} /> 로 옮겨갑니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function MoveTab() {
  const [ai, setAi] = useState(MOVE_INIT.ai);
  const [p, setP] = useState(MOVE_INIT.p);
  const [q, setQ] = useState(MOVE_INIT.q);
  const [s, setS] = useState<1 | -1>(1);
  const [base, setBase] = useState(true);
  const [ti, setTi] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [domPicks, setDomPicks] = useState<Record<string, number>>({});

  const a = MOVE_A[ai];
  const V = MOVE_VIEW;
  const polys: Poly[] = [];
  if (base && (p !== 0 || q !== 0)) polys.push({ pts: irrSamples(a, 0, 0, s, V, 200), color: "#475569", width: 1.6, dash: "5 4" });
  polys.push({ pts: irrSamples(a, p, q, s, V, 200), color: s === 1 ? "#38bdf8" : "#f472b6", width: 2.8 });

  const fnTex = `y=${s === -1 ? "-" : ""}\\sqrt{${a}(x${p === 0 ? "" : p > 0 ? `-${p}` : `+${-p}`})}${q === 0 ? "" : q > 0 ? `+${q}` : `-${-q}`}`;

  const task = FORM_TASKS[ti];
  const isDone = (t: FormTask) => picks[t.id] === t.steps[0].answer && domPicks[t.id] === t.domAnswer;
  const doneIds = FORM_TASKS.filter(isDone).map((t) => t.id);
  const cleared = isDone(task);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🎚️ 시작점을 옮겨 보기</p>
        <TipBox>
          📖 <Katex expr="y=\sqrt{a(x-p)}+q" /> 는 <Katex expr="y=\sqrt{ax}" /> 를 x축으로 <Katex expr="p" />, y축으로 <Katex expr="q" /> 만큼 옮긴 것이에요. 모양은 <Katex expr="a" /> 만 바꿉니다.
        </TipBox>
        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <Plane view={V} polys={polys} dots={[{ x: p, y: q, color: "#fbbf24" }]} aria="평행이동한 무리함수" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex justify-center rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-[16px]">
              <span className="min-w-0">
                <Katex expr={fnTex} />
              </span>
            </div>
            <Slider label={<Katex expr="a=" />} value={ai} min={0} max={MOVE_A.length - 1} step={1} onChange={setAi} accent="accent-sky-400" show={String(a)} />
            <Slider label={<Katex expr="p=" />} value={p} min={MOVE_PQ.min} max={MOVE_PQ.max} step={MOVE_PQ.step} onChange={setP} accent="accent-amber-400" />
            <Slider label={<Katex expr="q=" />} value={q} min={MOVE_PQ.min} max={MOVE_PQ.max} step={MOVE_PQ.step} onChange={setQ} accent="accent-amber-400" />
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setS(1)}
                className={
                  "rounded-xl border-2 px-2 py-1.5 text-[14px] transition " +
                  (s === 1 ? "border-sky-400/70 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                <Katex expr="+\sqrt{\ }" />
              </button>
              <button
                type="button"
                onClick={() => setS(-1)}
                className={
                  "rounded-xl border-2 px-2 py-1.5 text-[14px] transition " +
                  (s === -1 ? "border-pink-400/70 bg-pink-400/20 text-pink-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                <Katex expr="-\sqrt{\ }" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Info label="정의역">
                <Katex expr={a > 0 ? `x\\geq ${p}` : `x\\leq ${p}`} />
              </Info>
              <Info label="치역">
                <Katex expr={s === 1 ? `y\\geq ${q}` : `y\\leq ${q}`} />
              </Info>
            </div>
            <Toggle on={base} onClick={() => setBase((v) => !v)} tone="slate">
              옮기기 전 곡선 겹쳐 보기
            </Toggle>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🏭 근호 안을 묶어 읽기</p>
          <Chips ids={FORM_TASKS.map((t) => t.id)} cur={ti} done={doneIds} onPick={setTi} />
        </div>
        <TipBox>
          📖 <Katex expr="y=\sqrt{ax+b}+c" /> 는 근호 안을 <Katex expr="a\left(x+\dfrac{b}{a}\right)" /> 로 묶으면 시작점이 바로 보여요.
        </TipBox>
        <div className="mt-2">
          <FormCard
            task={task}
            pick={picks[task.id]}
            domPick={domPicks[task.id]}
            onPick={(i) => setPicks((m) => ({ ...m, [task.id]: i }))}
            onDomPick={(i) => setDomPicks((m) => ({ ...m, [task.id]: i }))}
          />
        </div>
        {cleared && ti < FORM_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setTi((v) => v + 1)} label="다음 식 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === FORM_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 식을 모두 읽어 냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <b className="text-white">시작점 (p, q)</b> 와 <b className="text-white">a 의 부호</b>, <b className="text-white">근호 앞의 부호</b> 셋만 읽으면 그래프가 그려집니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 교점 사냥
// ══════════════════════════════════════════════════════════════
function MeetTab() {
  const [ci, setCi] = useState(0);
  const [si, setSi] = useState(0);
  const [zi, setZi] = useState(ZOOM_INIT);
  const [pick, setPick] = useState<Record<string, number>>({});
  const [cPick, setCPick] = useState<number | undefined>(undefined);

  const cs: MeetCase = MEET_CASES[ci];
  const spot = cs.spots[Math.min(si, cs.spots.length - 1)];
  const z = ZOOMS[zi];
  const view: View = { xMin: spot.cx - z, xMax: spot.cx + z, yMin: spot.cy - z, yMax: spot.cy + z };
  const solved = pick[cs.id] === cs.answer;

  const polys: Poly[] = [
    { pts: irrSamples(-cs.a, cs.b / cs.a, 0, 1, view, 240), color: "#38bdf8", width: 2.6 },
    ...clipSamples((x) => meetInv(cs, x), 0, 200, view, 400).map((pts) => ({ pts, color: "#f472b6", width: 2.6 })),
  ];
  const dots: Dot[] = solved
    ? cs.meets
        .filter((m) => m.x >= view.xMin && m.x <= view.xMax && m.y >= view.yMin && m.y <= view.yMax)
        .map((m) => ({ x: m.x, y: m.y, color: "#a3e635" }))
    : [];

  const allDone = MEET_CASES.every((c) => pick[c.id] === c.answer) && cPick === MEET_CONCEPT.answer;
  const doneIds = MEET_CASES.filter((c) => pick[c.id] === c.answer).map((c) => c.id);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔬 확대해서 교점 찾기</p>
          <Chips ids={MEET_CASES.map((c) => c.id)} cur={ci} done={doneIds} onPick={(i) => { setCi(i); setSi(0); setZi(ZOOM_INIT); }} />
        </div>
        <TipBox>
          📖 함수와 그 역함수의 그래프는 <b className="text-amber-200">y = x</b> 에 대칭이에요. 교점이 y = x 위에만 있는지 확대해서 확인해 보세요.
        </TipBox>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {MEET_CASES.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCi(i);
                setSi(0);
                setZi(ZOOM_INIT);
              }}
              className={
                "rounded-lg border-2 px-2.5 py-1.5 text-[13px] transition " +
                (i === ci
                  ? "border-violet-400/70 bg-violet-400/20 text-violet-100"
                  : pick[c.id] === c.answer
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              <span className="min-w-0">
                <Katex expr={c.fnTex} />
              </span>
            </button>
          ))}
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <Plane view={view} polys={polys} dots={dots} diag aria="무리함수와 역함수의 교점" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="flex flex-wrap gap-1.5 text-[12px] font-bold">
              <span className="rounded-md bg-sky-400/15 px-2 py-1 text-sky-100">
                <Katex expr={cs.fnTex} />
              </span>
              <span className="rounded-md bg-pink-400/15 px-2 py-1 text-pink-100">
                <Katex expr={cs.invTex} />
              </span>
            </div>
            <Slider
              label="배율"
              value={zi}
              min={0}
              max={ZOOMS.length - 1}
              step={1}
              onChange={setZi}
              accent="accent-violet-400"
              show={`×${(ZOOMS[0] / z).toFixed(1)}`}
            />
            <div>
              <p className="mb-1 text-[11px] font-bold text-slate-400">볼 곳</p>
              <div className="grid grid-cols-2 gap-1.5">
                {cs.spots.map((sp, i) => (
                  <button
                    key={sp.label}
                    type="button"
                    onClick={() => setSi(i)}
                    className={
                      "rounded-lg border-2 px-2 py-1.5 text-[12px] font-bold transition " +
                      (i === si ? "border-lime-400/60 bg-lime-400/15 text-lime-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                    }
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
              {cs.rising ? "🔼 이 함수는 증가해요." : "🔽 이 함수는 감소해요."} 노란 점선 <Katex expr="y=x" /> 에서 떨어진 곳도 살펴보세요.
            </p>
          </div>
        </div>

        <div className="mt-2 space-y-2">
          <p className="text-[13px] font-bold text-slate-100">두 그래프의 교점은 몇 개일까요?</p>
          <MixedChoices items={cs.choices} pick={pick[cs.id]} answer={cs.answer} onPick={(i) => setPick((m) => ({ ...m, [cs.id]: i }))} />
          {pick[cs.id] !== undefined ? <Verdict right={solved} why={cs.why} hint={cs.choiceWhy[pick[cs.id]]} /> : null}
          {solved ? (
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg bg-lime-400/10 px-3 py-2 text-[12px] leading-6 text-lime-100">
              <span>교점</span>
              {cs.meets.map((m) => (
                <Katex key={`${m.x}`} expr={`(${Number(m.x.toFixed(3))},\\ ${Number(m.y.toFixed(3))})`} />
              ))}
            </p>
          ) : null}
        </div>
      </div>

      {doneIds.length === MEET_CASES.length ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="text-sm font-bold text-slate-100">🧠 왜 그럴까요?</p>
          <div className="mt-2">
            <QuizCard q={MEET_CONCEPT} pick={cPick} onPick={setCPick} />
          </div>
        </div>
      ) : null}

      {allDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 숨은 교점까지 모두 찾았어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <b className="text-white">증가하면 교점은 y = x 위에만</b> 있지만, <b className="text-white">감소하면 y = x 밖에서도</b> 만날 수 있어요. 다만 감소한다고 늘 그런 것은 아닙니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ⑤ 사분면 미션
// ══════════════════════════════════════════════════════════════
function MissionPanel({
  m,
  value,
  onValue,
  pick,
  onPick,
}: {
  m: Mission;
  value: number;
  onValue: (v: number) => void;
  pick: number | undefined;
  onPick: (i: number) => void;
}) {
  const p = m.knob === "p" ? value : m.fixed;
  const q = m.knob === "q" ? value : m.fixed;
  const Q = quadrantsOf(m.a, p, q, m.s);
  const hit = m.hit(Q);
  const solved = pick === m.answer;

  return (
    <div className="space-y-2">
      <div className={"rounded-xl border-2 px-3 py-2.5 " + (hit ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/10 bg-black/25")}>
        <p className="text-[13px] font-bold text-slate-100">🎯 {m.goal}</p>
        <div className="mt-1 flex justify-center py-1 text-[18px]">
          <span className="min-w-0">
            <Katex expr={m.texOf(value)} />
          </span>
        </div>
        <p className={"text-center text-[12px] font-extrabold " + (hit ? "text-emerald-200" : "text-slate-400")}>
          {hit ? "✅ 목표를 이뤘어요!" : "아직이에요"}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-5">
        <div className="sm:col-span-3">
          <Plane
            view={MISS_VIEW}
            polys={[{ pts: irrSamples(m.a, p, q, m.s, MISS_VIEW, 200), color: hit ? "#34d399" : "#38bdf8", width: 2.8 }]}
            dots={[{ x: p, y: q, color: "#fbbf24" }]}
            aria="사분면 미션 그래프"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Slider
            label={<Katex expr={`${m.knob}=`} />}
            value={value}
            min={m.min}
            max={m.max}
            step={m.step}
            onChange={onValue}
            accent="accent-amber-400"
          />
          <div className="grid grid-cols-2 gap-1.5">
            {QUAD_NAME.map((name, i) => (
              <span
                key={name}
                className={
                  "rounded-lg border px-2 py-1.5 text-center text-[11px] font-bold transition " +
                  (Q[i] ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-500")
                }
              >
                {Q[i] ? "●" : "○"} {name}
              </span>
            ))}
          </div>
          <TipBox>
            💡 시작점 <Katex expr="(p,\ q)" /> 와 <Katex expr="y=0" /> 을 가르는 자리가 어디인지 살펴보세요.
          </TipBox>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
        <p className="text-[13px] font-bold text-slate-100">목표를 이루는 값의 범위는?</p>
        <MixedChoices items={m.choices} pick={pick} answer={m.answer} onPick={onPick} />
        {pick !== undefined ? <Verdict right={solved} why={m.why} hint={m.choiceWhy[pick]} /> : null}
      </div>
    </div>
  );
}

function MissTab() {
  const [mi, setMi] = useState(0);
  const [vals, setVals] = useState<Record<string, number>>(() => {
    const o: Record<string, number> = {};
    MISSIONS.forEach((m) => (o[m.id] = m.init));
    return o;
  });
  const [pick, setPick] = useState<Record<string, number>>({});

  const m = MISSIONS[mi];
  const doneIds = MISSIONS.filter((v) => pick[v.id] === v.answer).map((v) => v.id);
  const cleared = pick[m.id] === m.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎯 사분면을 맞춰라</p>
          <Chips ids={MISSIONS.map((v) => v.id)} cur={mi} done={doneIds} onPick={setMi} />
        </div>
        <TipBox>
          📖 무리함수의 그래프는 시작점에서 <b className="text-violet-200">한쪽으로만 뻗는 단조로운 곡선</b>이라, 지나는 사분면이 시작점의 자리로 거의 정해져요.
        </TipBox>
        <div className="mt-2">
          <MissionPanel
            m={m}
            value={vals[m.id]}
            onValue={(v) => setVals((o) => ({ ...o, [m.id]: v }))}
            pick={pick[m.id]}
            onPick={(i) => setPick((o) => ({ ...o, [m.id]: i }))}
          />
        </div>
        {cleared && mi < MISSIONS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setMi((v) => v + 1)} label="다음 미션 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === MISSIONS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 미션을 모두 이뤘어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <b className="text-white">시작점이 어느 쪽에 있는지</b>와 <b className="text-white">y = 0 을 가르는 자리가 y축의 어느 쪽인지</b> 둘만 보면 지나는 사분면이 정해집니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
