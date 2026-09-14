"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  BACK_CONCEPT,
  BACK_TASKS,
  BEAUFORT,
  DATA_NOTE,
  LIMITS,
  PLOT,
  ROADS,
  SEA_BOX,
  SEA_D,
  SEA_GOALS,
  SEA_MARKS,
  SEA_QUIZ,
  SKID_BOX,
  SKID_D,
  SKID_GOALS,
  SKID_K,
  SKID_QUIZ,
  WIND_BOX,
  WIND_GOALS,
  WIND_QUIZ,
  WIND_X,
  beaufort,
  beaufortLevel,
  px,
  py,
  skidSpeed,
  sqrtSamples,
  tsunamiSpeed,
  windFor,
  type BackTask,
  type Piece,
  type PlotBox,
  type Pt,
  type Quiz,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "skid_reason",
    prompt:
      "스키드 마크의 길이만으로 사고 직전의 속력을 알아낼 수 있는 까닭을 설명하고, 노면의 마찰 계수가 어떤 구실을 하는지 활동에서 본 값으로 써 보세요.",
    kind: "text",
    placeholder:
      "예: 달리던 자동차의 운동에너지가 마찰로 모두 사라진다고 보면 속력이 v = √(254 × 길이 × 마찰 계수) 가 되어 길이를 재면 속력을 거꾸로 알 수 있다. 마찰 계수는 마른 아스팔트 0.8, 젖은 아스팔트 0.5, 빙판 0.1 처럼 노면마다 달라서, 같은 45 m 자국이라도 마른 길이면 약 95.6 km/h, 젖은 길이면 약 75.6 km/h 로 읽힌다. 그래서 사고 조사에서는 노면 상태를 함께 기록한다.",
  },
  {
    id: "wind_gap",
    prompt:
      "보퍼트 풍력 계급이 무리함수로 정해져 있어서 생기는 특징을 설명해 보세요. 계급이 한 단계 오를 때마다 필요한 풍속이 어떻게 달라졌나요?",
    kind: "text",
    placeholder:
      "예: B = 1.5√(x+12.8) − 5.4 는 뒤로 갈수록 완만해지는 무리함수라서, 같은 한 계급을 올리는 데 필요한 풍속이 점점 많이 늘어난다. 0 급에서 1 급까지는 5.2 km/h 면 되지만 8 급에서 9 급까지는 12.4 km/h 가 필요하다. 그래서 낮은 계급은 촘촘하고 높은 계급은 듬성듬성하다. 바람이 세질수록 한 등급의 무게가 커지는 셈이다.",
  },
  {
    id: "inverse_use",
    prompt:
      "무리함수의 역함수를 써서 거꾸로 값을 구해 본 경험을 하나 골라 설명하고, 무리함수의 역함수가 왜 제곱함수가 되는지 써 보세요.",
    kind: "text",
    placeholder:
      "예: 시속 90 km 로 달리다 마른 아스팔트에서 급정지하면 스키드 마크가 몇 m 남는지 구할 때 v = √(254df) 의 양변을 제곱해 d = v²/(254f) 로 되돌려 약 39.9 m 를 얻었다. 근호를 벗기려면 제곱해야 하므로 y = A√(x+C)+D 의 역함수는 x = ((y−D)/A)² − C 라는 제곱함수가 된다. 정의역과 치역도 서로 맞바뀐다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "skid" | "wind" | "sea" | "back";

const ABC = ["①", "②", "③", "④"];

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition " +
        (active ? "border-amber-400/60 bg-amber-400/15 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
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
              ? "border-amber-400/70 bg-amber-400/20 text-amber-100"
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
      className="w-full rounded-xl border-2 border-amber-400/55 bg-amber-400/15 px-3 py-2.5 text-sm font-bold text-amber-100 transition hover:bg-amber-400/25"
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
  accent = "accent-amber-400",
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
    <div className="grid gap-1.5 sm:grid-cols-2">
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

function fmt(v: number, d = 1): string {
  const n = Number(v.toFixed(d));
  const [a, b] = String(n).split(".");
  return a.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (b ? "." + b : "");
}

// ══════════════════════════════════════════════════════════════
// 좌표평면
// ══════════════════════════════════════════════════════════════
type Curve = { pts: Pt[]; color: string; width?: number; dash?: string };
type Mark = { y: number; name: string; color: string };

function pathOf(box: PlotBox, pts: Pt[]): string {
  return "M " + pts.map((p) => `${px(box, p.x).toFixed(2)} ${py(box, p.y).toFixed(2)}`).join(" L ");
}

function Plot({
  box,
  curves,
  point = null,
  marks = [],
  readX = null,
  aria = "실생활 무리함수의 그래프",
}: {
  box: PlotBox;
  curves: Curve[];
  point?: Pt | null;
  marks?: Mark[];
  readX?: number | null;
  aria?: string;
}) {
  return (
    <svg viewBox={`0 0 ${PLOT.w} ${PLOT.h}`} className="mx-auto block w-full" role="img" aria-label={aria}>
      <rect x={0} y={0} width={PLOT.w} height={PLOT.h} fill="#020617" rx={12} />
      {box.yTicks.map((t) => (
        <g key={"y" + t}>
          <line x1={PLOT.left} y1={py(box, t)} x2={PLOT.right} y2={py(box, t)} stroke="#1e293b" strokeWidth={1} />
          <text x={PLOT.left - 6} y={py(box, t) + 4} fontSize={11} textAnchor="end" fill="#64748b" fontFamily="ui-monospace, monospace">
            {t}
          </text>
        </g>
      ))}
      {box.xTicks.map((t) => (
        <g key={"x" + t}>
          <line x1={px(box, t)} y1={PLOT.top} x2={px(box, t)} y2={PLOT.bottom} stroke="#1e293b" strokeWidth={1} />
          <text x={px(box, t)} y={PLOT.bottom + 16} fontSize={11} textAnchor="middle" fill="#64748b" fontFamily="ui-monospace, monospace">
            {t}
          </text>
        </g>
      ))}
      <line x1={PLOT.left} y1={PLOT.top - 6} x2={PLOT.left} y2={PLOT.bottom} stroke="#64748b" strokeWidth={1.6} />
      <line x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right + 6} y2={PLOT.bottom} stroke="#64748b" strokeWidth={1.6} />
      <text x={4} y={14} fontSize={11} fontWeight={700} fill="#94a3b8">
        {box.yName}
      </text>
      <text x={PLOT.right} y={PLOT.h - 6} fontSize={11} fontWeight={700} textAnchor="end" fill="#94a3b8">
        {box.xName}
      </text>

      {marks.map((m) => (
        <g key={m.name}>
          <line x1={PLOT.left} y1={py(box, m.y)} x2={PLOT.right} y2={py(box, m.y)} stroke={m.color} strokeWidth={1.3} strokeDasharray="6 4" />
          <text x={PLOT.right - 4} y={py(box, m.y) - 5} fontSize={10.5} fontWeight={700} textAnchor="end" fill={m.color}>
            {m.name}
          </text>
        </g>
      ))}

      {curves.map((c, i) =>
        c.pts.length > 1 ? (
          <path key={i} d={pathOf(box, c.pts)} fill="none" stroke={c.color} strokeWidth={c.width ?? 2.6} strokeDasharray={c.dash} strokeLinecap="round" />
        ) : null
      )}

      {point ? (
        <g>
          <line x1={px(box, point.x)} y1={py(box, point.y)} x2={px(box, point.x)} y2={PLOT.bottom} stroke="#f472b6" strokeWidth={1.2} strokeDasharray="3 3" />
          <line x1={PLOT.left} y1={py(box, point.y)} x2={px(box, point.x)} y2={py(box, point.y)} stroke="#f472b6" strokeWidth={1.2} strokeDasharray="3 3" />
          <circle cx={px(box, point.x)} cy={py(box, point.y)} r={4.8} fill="#f472b6" stroke="#fff" strokeWidth={1.2} />
        </g>
      ) : null}

      {readX !== null ? (
        <g>
          <circle cx={px(box, readX)} cy={PLOT.bottom} r={4.4} fill="#a3e635" stroke="#020617" strokeWidth={1.2} />
          <text x={px(box, readX)} y={PLOT.bottom - 8} fontSize={11} fontWeight={700} textAnchor="middle" fill="#bef264">
            {fmt(readX, readX >= 100 ? 0 : 1)}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function IrrationalLifeLab() {
  const [tab, setTab] = useState<Tab>("skid");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-amber-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔍 무리함수의 활용</h3>
        <p className="mt-2 leading-7 text-slate-300">
          사고 현장의 <b className="text-amber-200">타이어 자국</b>, 몰아치는 <b className="text-sky-200">바람</b>, 바다를 건너는{" "}
          <b className="text-cyan-200">쓰나미</b> 까지. 근호 하나로 세상을 읽어 보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "skid"} onClick={() => setTab("skid")}>
          ① 스키드 마크 수사대 🚗
        </TabButton>
        <TabButton active={tab === "wind"} onClick={() => setTab("wind")}>
          ② 바람의 세기 🌬️
        </TabButton>
        <TabButton active={tab === "sea"} onClick={() => setTab("sea")}>
          ③ 쓰나미의 속력 🌊
        </TabButton>
        <TabButton active={tab === "back"} onClick={() => setTab("back")}>
          ④ 거꾸로 풀기 🔎
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "skid" ? <SkidTab /> : null}
        {tab === "wind" ? <WindTab /> : null}
        {tab === "sea" ? <SeaTab /> : null}
        {tab === "back" ? <BackTab /> : null}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">📌 {DATA_NOTE}</p>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 스키드 마크 수사대
// ══════════════════════════════════════════════════════════════
function SkidViz({ d, roadName, roadColor }: { d: number; roadName: string; roadColor: string }) {
  const end = 16 + (d / SKID_D.max) * 250;
  return (
    <svg viewBox="0 0 340 140" className="w-full" role="img" aria-label="도로 위의 스키드 마크">
      <rect x={0} y={0} width={340} height={140} fill="#020617" rx={12} />
      <rect x={0} y={26} width={340} height={88} fill="#1f2937" />
      <line x1={0} y1={26} x2={340} y2={26} stroke="#facc15" strokeWidth={2} />
      <line x1={0} y1={114} x2={340} y2={114} stroke="#facc15" strokeWidth={2} />
      <line x1={0} y1={70} x2={340} y2={70} stroke="#94a3b8" strokeWidth={1.6} strokeDasharray="14 12" />
      <rect x={16} y={50} width={end - 16} height={6} rx={3} fill="#0f172a" />
      <rect x={16} y={84} width={end - 16} height={6} rx={3} fill="#0f172a" />
      <g>
        <rect x={end} y={46} width={34} height={48} rx={7} fill="#b91c1c" stroke="#fca5a5" strokeWidth={1.4} />
        <rect x={end + 5} y={54} width={10} height={32} rx={3} fill="#1e293b" />
        <rect x={end + 22} y={56} width={8} height={28} rx={3} fill="#1e293b" />
      </g>
      <text x={16 + (end - 16) / 2} y={106} fontSize={11} fontWeight={700} textAnchor="middle" fill="#e2e8f0">
        {d} m
      </text>
      <text x={10} y={16} fontSize={11} fontWeight={700} fill={roadColor}>
        {roadName}
      </text>
    </svg>
  );
}

function SkidTab() {
  const [di, setDi] = useState(SKID_D.init);
  const [ri, setRi] = useState(0);
  const [li, setLi] = useState(1);
  const [seen, setSeen] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const road = ROADS[ri];
  const limit = LIMITS[li];
  const v = skidSpeed(di, road.mu);
  const over = v > limit;
  const mark = (i: number) => setSeen((s) => (s.includes(String(i)) ? s : [...s, String(i)]));

  const curves: Curve[] = ROADS.map((r) => ({
    pts: sqrtSamples(Math.sqrt(SKID_K * r.mu), 0, 0, SKID_BOX, 220),
    color: r.id === road.id ? r.color : "#334155",
    width: r.id === road.id ? 2.8 : 1.4,
    dash: r.id === road.id ? undefined : "5 4",
  }));

  const q = SKID_QUIZ[qi];
  const doneIds = SKID_QUIZ.filter((x) => pick[x.id] === x.answer).map((x) => x.id);
  const cleared = pick[q.id] === q.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🚗 타이어 자국으로 속력을 밝혀라</p>
        <TipBox>
          📖 급정지할 때 남는 자국의 길이 <Katex expr="d" /> 와 노면의 마찰 계수 <Katex expr="f" /> 를 알면 브레이크를 밟기 직전의 속력이{" "}
          <Katex expr="v=\sqrt{254df}" /> 로 나와요.
        </TipBox>
        <div className="mt-2">
          <SkidViz d={di} roadName={road.name} roadColor={road.color} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <div className="space-y-2 sm:col-span-2">
            <Slider
              label="스키드 마크"
              value={di}
              min={SKID_D.min}
              max={SKID_D.max}
              step={SKID_D.step}
              onChange={(x) => {
                setDi(x);
                if (x >= 4 * SKID_D.min) mark(2);
              }}
              show={`${di} m`}
            />
            <div>
              <p className="mb-1 text-[11px] font-bold text-slate-400">노면</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ROADS.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRi(i);
                      if (r.id === "wet") mark(0);
                      if (r.id === "ice") mark(1);
                    }}
                    className={
                      "rounded-lg border-2 px-2 py-1.5 text-[11px] font-bold transition " +
                      (i === ri ? "border-amber-400/70 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                    }
                  >
                    {r.name} {r.mu}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold text-slate-400">제한속도</p>
              <div className="grid grid-cols-3 gap-1.5">
                {LIMITS.map((L, i) => (
                  <button
                    key={L}
                    type="button"
                    onClick={() => setLi(i)}
                    className={
                      "rounded-lg border-2 px-2 py-1.5 text-[12px] font-bold transition " +
                      (i === li ? "border-rose-400/60 bg-rose-400/15 text-rose-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                    }
                  >
                    {L}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-lg border border-pink-400/40 bg-pink-400/15 px-2.5 py-1.5 text-[12px] font-bold text-pink-100">
                속력 <span className="font-mono text-[15px] text-white">{fmt(v)}</span> km/h
              </span>
              <span
                className={
                  "rounded-lg px-2.5 py-1.5 text-[12px] font-extrabold " + (over ? "bg-rose-400/20 text-rose-100" : "bg-emerald-400/20 text-emerald-100")
                }
              >
                {over ? "🚨 과속!" : "✅ 제한속도 안"}
              </span>
            </div>
          </div>
          <div className="sm:col-span-3">
            <Plot
              box={SKID_BOX}
              curves={curves}
              point={{ x: di, y: v }}
              marks={[{ y: limit, name: `제한속도 ${limit}`, color: "#fb7185" }]}
              aria="스키드 마크와 속력"
            />
            <p className="mt-1 text-center text-[11px] leading-6 text-slate-500">회색 점선은 다른 노면의 곡선이에요. 노면이 미끄러울수록 곡선이 내려앉습니다.</p>
          </div>
        </div>
        <div className="mt-2">
          <GoalList goals={SKID_GOALS} seen={seen} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🕵️ 사고 조사 문제</p>
          <Chips ids={SKID_QUIZ.map((x) => x.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <QuizCard q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < SKID_QUIZ.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((x) => x + 1)} label="다음 문제 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === SKID_QUIZ.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 사고 조사를 모두 마쳤어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            속력이 두 배가 되면 멈추는 데 <b className="text-white">네 배의 거리</b>가 필요해요. 빙판에서는 같은 속력이라도 자국이{" "}
            <b className="text-white">여덟 배</b> 길어집니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 바람의 세기
// ══════════════════════════════════════════════════════════════
function WindViz({ level, color }: { level: number; color: string }) {
  const bend = level * 3.8;
  const topX = 100 + bend;
  const lines = Math.min(5, Math.ceil(level / 2.4));
  return (
    <svg viewBox="0 0 200 170" className="mx-auto block w-full max-w-[200px]" role="img" aria-label="바람에 휘는 나무">
      <rect x={0} y={0} width={200} height={170} fill="#020617" rx={12} />
      <line x1={10} y1={150} x2={190} y2={150} stroke="#334155" strokeWidth={3} />
      {Array.from({ length: lines }, (_, i) => (
        <line
          key={i}
          x1={14}
          y1={44 + i * 20}
          x2={14 + 26 + level * 3}
          y2={44 + i * 20}
          stroke="#38bdf8"
          strokeWidth={1.6}
          strokeOpacity={0.5}
          strokeLinecap="round"
        />
      ))}
      <path d={`M 100 150 Q ${100 + bend * 0.3} 110 ${topX} 74`} fill="none" stroke="#78350f" strokeWidth={7} strokeLinecap="round" />
      <circle cx={topX} cy={64} r={19} fill={color} fillOpacity={0.55} stroke={color} strokeWidth={1.6} />
      <circle cx={topX - 13} cy={74} r={12} fill={color} fillOpacity={0.4} />
      <circle cx={topX + 13} cy={76} r={11} fill={color} fillOpacity={0.4} />
      <text x={100} y={18} fontSize={13} fontWeight={800} textAnchor="middle" fill={color}>
        {level} 급
      </text>
      <text x={100} y={166} fontSize={10} textAnchor="middle" fill="#64748b">
        바람이 셀수록 크게 휘어요
      </text>
    </svg>
  );
}

function WindTab() {
  const [x, setX] = useState(WIND_X.init);
  const [seen, setSeen] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const b = beaufort(x);
  const level = beaufortLevel(x);
  const info = BEAUFORT[level];
  const mark = (i: number) => setSeen((s) => (s.includes(String(i)) ? s : [...s, String(i)]));

  const q = WIND_QUIZ[qi];
  const doneIds = WIND_QUIZ.filter((v) => pick[v.id] === v.answer).map((v) => v.id);
  const cleared = pick[q.id] === q.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🌬️ 풍속을 계급으로 바꾸기</p>
        <TipBox>
          📖 풍속 <Katex expr="x" /> (km/h) 를 계급으로 바꾸는 식이 <Katex expr="B=1.5\sqrt{x+12.8}-5.4" /> 예요. 계급은 이 값을 넘지 않는 가장 큰 정수로 잡습니다.
        </TipBox>

        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <div className="space-y-2 sm:col-span-2">
            <WindViz level={level} color={info.color} />
            <Slider
              label="풍속"
              value={x}
              min={WIND_X.min}
              max={WIND_X.max}
              step={WIND_X.step}
              onChange={(v) => {
                setX(v);
                if (beaufortLevel(v) >= 6) mark(0);
                if (beaufortLevel(v) >= 8) mark(1);
                if (beaufortLevel(v) >= 10) mark(2);
              }}
              accent="accent-sky-400"
              show={`${x} km/h`}
            />
            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
              <p className="flex flex-wrap items-baseline gap-2 text-[13px] font-bold" style={{ color: info.color }}>
                <span className="text-[16px]">{level} 급</span>
                <span className="text-slate-100">{info.name}</span>
              </p>
              <p className="mt-1 text-[12px] leading-6 text-slate-300">{info.land}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Info label="식의 값">
                <span className="font-mono">{b.toFixed(2)}</span>
              </Info>
              {level < 12 ? (
                <Info label="다음 계급까지">
                  <span className="font-mono">{fmt(windFor(level + 1) - x)} km/h</span>
                </Info>
              ) : null}
            </div>
          </div>
          <div className="sm:col-span-3">
            <Plot
              box={WIND_BOX}
              curves={[{ pts: sqrtSamples(1.5, 12.8, -5.4, WIND_BOX, 220), color: "#38bdf8" }]}
              point={{ x, y: b }}
              aria="풍속과 풍력 계급"
            />
            <div className="mt-1 flex gap-[2px]">
              {BEAUFORT.map((v) => (
                <span
                  key={v.level}
                  className={"h-5 flex-1 rounded-[3px] text-center text-[9px] font-bold leading-5 " + (v.level === level ? "text-white" : "text-slate-900")}
                  style={{ backgroundColor: v.color, opacity: v.level === level ? 1 : 0.35 }}
                >
                  {v.level}
                </span>
              ))}
            </div>
            <p className="mt-1 text-center text-[11px] leading-6 text-slate-500">칸 하나가 한 계급이에요. 오른쪽으로 갈수록 칸이 넓어집니다.</p>
          </div>
        </div>
        <div className="mt-2">
          <GoalList goals={WIND_GOALS} seen={seen} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✏️ 확인 문제</p>
          <Chips ids={WIND_QUIZ.map((v) => v.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <QuizCard q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < WIND_QUIZ.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((v) => v + 1)} label="다음 문제 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === WIND_QUIZ.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 바람을 계급으로 읽어 냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            무리함수는 뒤로 갈수록 완만해져서, 한 계급을 올리는 데 필요한 풍속이 <b className="text-white">5.2 → 6.1 → 7.0 …</b> 처럼 점점 커집니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 쓰나미의 속력
// ══════════════════════════════════════════════════════════════
function SeaViz({ d, v }: { d: number; v: number }) {
  const floor = 46 + (d / SEA_D.max) * 100;
  const amp = 8 + 26 * (1 - (d / SEA_D.max) ** 0.25);
  const arrow = 20 + (v / 800) * 150;
  return (
    <svg viewBox="0 0 340 170" className="w-full" role="img" aria-label="바다 단면과 쓰나미">
      <rect x={0} y={0} width={340} height={170} fill="#020617" rx={12} />
      <rect x={0} y={46} width={340} height={124} fill="#0b2545" />
      <path
        d={`M 0 46 L 60 46 Q 100 ${46 - amp} 140 46 L 340 46 L 340 ${floor} L 0 ${floor} Z`}
        fill="#0e7490"
        fillOpacity={0.35}
      />
      <path d={`M 0 46 L 60 46 Q 100 ${46 - amp} 140 46 L 340 46`} fill="none" stroke="#67e8f9" strokeWidth={2.2} />
      <rect x={0} y={floor} width={340} height={170 - floor} fill="#1c1917" />
      <line x1={0} y1={floor} x2={340} y2={floor} stroke="#78716c" strokeWidth={2} />
      <line x1={26} y1={46} x2={26} y2={floor} stroke="#facc15" strokeWidth={1.4} strokeDasharray="4 3" />
      <text x={32} y={(46 + floor) / 2 + 4} fontSize={11} fontWeight={700} fill="#fcd34d">
        {fmt(d, 0)} m
      </text>
      <line x1={170} y1={26} x2={170 + arrow} y2={26} stroke="#f472b6" strokeWidth={2.6} />
      <path d={`M ${170 + arrow} 26 l -9 -5 l 0 10 z`} fill="#f472b6" />
      <text x={170} y={18} fontSize={11} fontWeight={700} fill="#f9a8d4">
        {fmt(v)} km/h
      </text>
      <text x={100} y={164} fontSize={10} textAnchor="middle" fill="#94a3b8">
        수심이 얕을수록 느리고 파고가 높아요
      </text>
    </svg>
  );
}

function SeaTab() {
  const [d, setD] = useState(SEA_D.init);
  const [seen, setSeen] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const v = tsunamiSpeed(d);
  const mark = (i: number) => setSeen((s) => (s.includes(String(i)) ? s : [...s, String(i)]));

  const q = SEA_QUIZ[qi];
  const doneIds = SEA_QUIZ.filter((x) => pick[x.id] === x.answer).map((x) => x.id);
  const cleared = pick[q.id] === q.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🌊 바다를 건너는 속력</p>
        <TipBox>
          📖 파장이 수심보다 훨씬 긴 파도는 속력이 수심 <Katex expr="d" /> 만으로 정해져 <Katex expr="v=3.6\sqrt{9.8d}" /> (km/h) 가 돼요.
        </TipBox>
        <div className="mt-2">
          <SeaViz d={d} v={v} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <div className="space-y-2 sm:col-span-2">
            <Slider
              label="수심"
              value={d}
              min={SEA_D.min}
              max={SEA_D.max}
              step={SEA_D.step}
              onChange={(x) => {
                setD(x);
                if (x >= 4500) mark(0);
                if (x <= 200) mark(1);
                if (x === 4000 || x === 1000) mark(2);
              }}
              accent="accent-cyan-400"
              show={`${fmt(d, 0)} m`}
            />
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-lg border border-pink-400/40 bg-pink-400/15 px-2.5 py-1.5 text-[12px] font-bold text-pink-100">
                속력 <span className="font-mono text-[15px] text-white">{fmt(v)}</span> km/h
              </span>
              <Info label="견주면">
                <span>
                  {v >= 700 ? "제트 여객기" : v >= 250 ? "고속열차" : v >= 90 ? "자동차" : "자전거"} 만큼
                </span>
              </Info>
            </div>
            <TipBox>
              💡 수심이 네 배가 되면 속력은 두 배가 돼요. 근호 안이 네 배가 되기 때문입니다.
            </TipBox>
          </div>
          <div className="sm:col-span-3">
            <Plot
              box={SEA_BOX}
              curves={[{ pts: sqrtSamples(3.6 * Math.sqrt(9.8), 0, 0, SEA_BOX, 220), color: "#22d3ee" }]}
              point={{ x: d, y: v }}
              marks={SEA_MARKS.map((m) => ({ y: m.v, name: m.name, color: m.color }))}
              aria="수심과 쓰나미의 속력"
            />
          </div>
        </div>
        <div className="mt-2">
          <GoalList goals={SEA_GOALS} seen={seen} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✏️ 확인 문제</p>
          <Chips ids={SEA_QUIZ.map((x) => x.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <QuizCard q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < SEA_QUIZ.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((x) => x + 1)} label="다음 문제 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === SEA_QUIZ.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 쓰나미의 비밀을 알아냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            먼바다에서는 <b className="text-white">제트 여객기만큼 빠르지만 파도는 낮고</b>, 해안에 가까워지면 <b className="text-white">느려지면서 높아집니다</b>.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 거꾸로 풀기
// ══════════════════════════════════════════════════════════════
function BackCard({
  task,
  invPick,
  valPick,
  onInv,
  onVal,
}: {
  task: BackTask;
  invPick: number | undefined;
  valPick: number | undefined;
  onInv: (i: number) => void;
  onVal: (i: number) => void;
}) {
  const invOk = invPick === task.invAnswer;
  const valOk = valPick === task.valAnswer;

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
        <p className="text-[13px] font-bold text-slate-100">
          {task.icon} {task.title}
        </p>
        <div className="mt-1 space-y-0.5 text-[12px] leading-6 text-slate-300">
          {task.story.map((s) => (
            <p key={s}>{s}</p>
          ))}
        </div>
        <div className="mt-1.5 flex justify-center py-1 text-[17px]">
          <span className="min-w-0">
            <Katex expr={task.fwdTex} />
          </span>
        </div>
      </div>

      <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="rounded-md border border-amber-400/40 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-100">거꾸로</span>
          <p className="text-[13px] font-bold text-slate-100">이 식을 거꾸로 풀면?</p>
        </div>
        <TexChoices items={task.invChoices} pick={invPick} answer={task.invAnswer} onPick={onInv} />
        {invPick !== undefined ? <Verdict right={invOk} why={task.invNote} hint={task.invWhy[invPick]} /> : null}
      </div>

      {invOk ? (
        <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
          <p className="text-[13px] font-bold text-slate-100">그러면 값은 얼마일까요?</p>
          <MixedChoices items={task.valChoices} pick={valPick} answer={task.valAnswer} onPick={onVal} />
          {valPick !== undefined ? <Verdict right={valOk} why={task.valNote} hint={task.valWhy[valPick]} /> : null}
        </div>
      ) : null}

      {valOk ? (
        <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-3 py-3">
          <Plot
            box={task.box}
            curves={[{ pts: sqrtSamples(task.A, task.C, task.D, task.box, 220), color: "#34d399" }]}
            point={{ x: task.readX, y: task.readY }}
            marks={[{ y: task.readY, name: `${fmt(task.readY, 0)}`, color: "#fbbf24" }]}
            readX={task.readX}
            aria="거꾸로 읽은 그래프"
          />
          <p className="mt-1 text-center text-[11px] leading-6 text-slate-400">
            노란 가로선에서 곡선을 만나 아래로 내려오면 초록 점이 답이에요. 그래프를 거꾸로 읽은 셈입니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function BackTab() {
  const [ti, setTi] = useState(0);
  const [invPicks, setInvPicks] = useState<Record<string, number>>({});
  const [valPicks, setValPicks] = useState<Record<string, number>>({});
  const [cPick, setCPick] = useState<number | undefined>(undefined);

  const task = BACK_TASKS[ti];
  const isDone = (t: BackTask) => invPicks[t.id] === t.invAnswer && valPicks[t.id] === t.valAnswer;
  const doneIds = BACK_TASKS.filter(isDone).map((t) => t.id);
  const cleared = isDone(task);
  const allDone = doneIds.length === BACK_TASKS.length && cPick === BACK_CONCEPT.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔎 값을 알고 조건을 찾기</p>
          <Chips ids={BACK_TASKS.map((t) => t.id)} cur={ti} done={doneIds} onPick={setTi} />
        </div>
        <TipBox>
          📖 앞 탭에서는 조건을 넣어 값을 구했어요. 이번에는 거꾸로 <b className="text-amber-200">값을 알고 조건을 찾습니다</b>. 근호를 벗기려면 양변을 제곱하면 돼요.
        </TipBox>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {BACK_TASKS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTi(i)}
              className={
                "rounded-lg border-2 px-2.5 py-1.5 text-[12px] font-bold transition " +
                (i === ti
                  ? "border-amber-400/70 bg-amber-400/20 text-amber-100"
                  : doneIds.includes(t.id)
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {t.icon} {t.title}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <BackCard
            task={task}
            invPick={invPicks[task.id]}
            valPick={valPicks[task.id]}
            onInv={(i) => setInvPicks((m) => ({ ...m, [task.id]: i }))}
            onVal={(i) => setValPicks((m) => ({ ...m, [task.id]: i }))}
          />
        </div>
        {cleared && ti < BACK_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setTi((v) => v + 1)} label="다음 상황 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === BACK_TASKS.length ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="text-sm font-bold text-slate-100">🧠 셋을 모아 보면</p>
          <div className="mt-2">
            <QuizCard q={BACK_CONCEPT} pick={cPick} onPick={setCPick} />
          </div>
        </div>
      ) : null}

      {allDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 거꾸로도 자유자재로 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            무리함수로 값을 구하고 <b className="text-white">그 역함수인 제곱함수로 조건을 되찾는 것</b>, 이것이 실생활에서 무리함수를 쓰는 두 방향이에요.
          </p>
        </div>
      ) : null}
    </div>
  );
}
