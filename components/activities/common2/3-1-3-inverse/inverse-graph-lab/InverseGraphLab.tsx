"use client";

import { useId, useMemo, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  AB,
  AB_GOALS,
  AB_TASKS,
  CROSS_CHOICES,
  CROSS_FNS,
  CROSS_TASKS,
  GRAPH_TASKS,
  MV,
  PT_TASKS,
  PV,
  PV_TICKS,
  SMALL,
  SYM_FNS,
  SYM_STEP,
  abKind,
  abPoint,
  mvX,
  mvY,
  nx,
  pvX,
  pvY,
  svgPath,
  traceFn,
  tx,
  type CrossFn,
  type CrossTask,
  type GraphTask,
  type Piece,
  type Pt,
  type PtTask,
  type SymFn,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_symmetric",
    prompt:
      "두 그래프가 직선 y = x 에 대하여 대칭인 까닭을 점 (a, b) 와 (b, a) 를 들어 설명해 보세요. 탭①에서 점을 옮겨 보며 눈에 띈 것도 함께 써 보세요.",
    kind: "text",
    placeholder:
      "예: (a, b) 가 y = f(x) 위에 있으면 f(a) = b 이므로 f⁻¹(b) = a 가 되어 (b, a) 가 y = f⁻¹(x) 위에 있다. 두 점의 중점은 좌표가 모두 (a+b)/2 라 늘 y = x 위에 있고, 두 점을 이은 선분의 기울기는 −1 이라 y = x 와 수직이다. 그래서 y = x 가 수직이등분선이 되어 대칭이다. 점을 끝에서 끝까지 훑으니 역함수 그래프가 저절로 그려졌다.",
  },
  {
    id: "cross_counterexample",
    prompt:
      "「함수와 역함수의 교점은 언제나 직선 y = x 위에 있다」는 말이 왜 틀렸는지 반례를 들어 설명하고, 그래도 이 방법을 자주 쓰는 까닭도 함께 써 보세요.",
    kind: "text",
    placeholder:
      "예: f(x) = −x³ 은 (0, 0) 말고도 (1, −1), (−1, 1) 에서 역함수와 만나는데 뒤의 둘은 y = x 위가 아니다. f(x) = 6 − x 처럼 역함수가 자기 자신이면 그래프가 통째로 겹쳐 교점이 무수히 많다. 다만 f 가 증가함수이면 교점이 반드시 y = x 위에 있으므로, 증가함수일 때는 f 와 y = x 의 교점을 찾는 방법이 옳다.",
  },
  {
    id: "slope_condition",
    prompt:
      "y = ax + b 와 그 역함수의 교점이 어떤 자리에 있는지를 a 와 b 로 나누어 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: a 가 1 도 −1 도 아니면 교점이 하나뿐이고 늘 y = x 위에 있다. a = −1 이면 역함수가 자기 자신이라 두 그래프가 통째로 겹쳐 y = x 밖에도 교점이 생긴다. a = 1 이고 b ≠ 0 이면 평행하여 교점이 없고, a = 1, b = 0 이면 두 그래프가 모두 y = x 다. 내리는 직선이어도 a = −3 처럼 −1 이 아니면 교점은 y = x 위에 하나뿐이었다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "sym" | "cross" | "pick" | "slope";

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition " +
        (active ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
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
              ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100"
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

function NextBtn({ onClick, label = "다음 문제 ▶" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
    >
      {label}
    </button>
  );
}

/** 문장 조각 — 한글은 HTML, 식은 KaTeX (KaTeX 안에 한글을 넣을 수 없다) */
function PieceText({ p }: { p: Piece }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1">
      {p.pre}
      {p.tex ? <Katex expr={p.tex} /> : null}
      {p.post}
    </span>
  );
}
function PieceLine({ ps }: { ps: Piece[] }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
      {ps.map((p, i) => (
        <PieceText key={i} p={p} />
      ))}
    </span>
  );
}

function Slider({ label, value, min, max, step, onChange, accent = "accent-cyan-400" }: { label: React.ReactNode; value: number; min: number; max: number; step: number; onChange: (v: number) => void; accent?: string }) {
  return (
    <label className="block text-[11px] font-bold text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        {label} <span className="font-mono text-[13px] text-slate-100">{nx(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={"mt-0.5 w-full " + accent} />
    </label>
  );
}

const ABC = ["①", "②", "③", "④"];

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

function TexChoices({ items, pick, answer, onPick }: { items: string[]; pick: number | undefined; answer: number; onPick: (i: number) => void }) {
  const right = pick === answer;
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {items.map((s, i) => {
        const good = pick === i && i === answer;
        const badPick = pick === i && i !== answer;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "overflow-x-auto overflow-y-hidden rounded-xl border-2 px-2.5 py-2 text-[14px] font-bold transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : badPick
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="mr-1 text-[12px] text-slate-400">{ABC[i]}</span>
            <Katex expr={s} />
          </button>
        );
      })}
    </div>
  );
}

/** 교점이 어디에 있는지 고르는 세 보기 */
function KindChoices({ pick, answer, onPick }: { pick: number | undefined; answer: number; onPick: (i: number) => void }) {
  const right = pick === answer;
  return (
    <div className="grid gap-1.5 sm:grid-cols-3">
      {CROSS_CHOICES.map((s, i) => {
        const good = pick === i && i === answer;
        const badPick = pick === i && i !== answer;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "rounded-xl border-2 px-2.5 py-2 text-[12px] font-bold leading-6 transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : badPick
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="mr-1 text-slate-400">{ABC[i]}</span>
            {s}
          </button>
        );
      })}
    </div>
  );
}

function Verdict({ right, why, hint }: { right: boolean; why: string; hint: string }) {
  return right ? (
    <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {why}</p>
  ) : (
    <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {hint}</p>
  );
}

// ══════════════════════════════════════════════════════════════
// 좌표평면 — 큰 것과 작은 것
// ══════════════════════════════════════════════════════════════
type PlaneProps = {
  /** 그릴 곡선들 */
  curves: { fn: (x: number) => number | null; dom: [number, number]; color: string; width?: number; dash?: string }[];
  /** 찍을 점들 */
  dots?: { p: Pt; color: string; r?: number; ring?: boolean }[];
  /** 이을 선분 */
  segs?: { a: Pt; b: Pt; color: string; dash?: string }[];
  /** 자취로 남긴 점들 */
  trail?: Pt[];
  trailColor?: string;
  /** 직선 y = x 를 그릴지 */
  diag?: boolean;
  label?: string;
};

function Plane({ curves, dots, segs, trail, trailColor = "#f472b6", diag = true, label }: PlaneProps) {
  const uid = useId().replace(/:/g, "");
  const polys = useMemo(() => curves.map((c) => traceFn(c.fn, c.dom)), [curves]);
  const inBox = (p: Pt) => p[0] >= PV.min && p[0] <= PV.max && p[1] >= PV.min && p[1] <= PV.max;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${PV.size} ${PV.size}`} className="mx-auto block w-full max-w-[320px]" role="img" aria-label="함수와 역함수의 그래프">
        <defs>
          <clipPath id={`cp-${uid}`}>
            <rect x={PV.pad - 1} y={PV.pad - 1} width={PV.size - 2 * PV.pad + 2} height={PV.size - 2 * PV.pad + 2} />
          </clipPath>
        </defs>
        <rect x={PV.pad} y={PV.pad} width={PV.size - 2 * PV.pad} height={PV.size - 2 * PV.pad} fill="rgba(255,255,255,0.02)" />
        {PV_TICKS.map((v) => (
          <g key={`t${v}`}>
            <line x1={pvX(v)} y1={PV.pad} x2={pvX(v)} y2={PV.size - PV.pad} stroke="rgba(226,232,240,0.06)" strokeWidth={1} />
            <line x1={PV.pad} y1={pvY(v)} x2={PV.size - PV.pad} y2={pvY(v)} stroke="rgba(226,232,240,0.06)" strokeWidth={1} />
          </g>
        ))}
        <line x1={PV.pad} y1={pvY(0)} x2={PV.size - PV.pad} y2={pvY(0)} stroke="rgba(226,232,240,0.5)" strokeWidth={1.6} />
        <line x1={pvX(0)} y1={PV.pad} x2={pvX(0)} y2={PV.size - PV.pad} stroke="rgba(226,232,240,0.5)" strokeWidth={1.6} />

        <g clipPath={`url(#cp-${uid})`}>
          {diag ? (
            <line x1={pvX(PV.min)} y1={pvY(PV.min)} x2={pvX(PV.max)} y2={pvY(PV.max)} stroke="rgba(226,232,240,0.32)" strokeWidth={1.6} strokeDasharray="6 4" />
          ) : null}
          {(segs ?? []).map((s, k) => (
            <line key={`s${k}`} x1={pvX(s.a[0])} y1={pvY(s.a[1])} x2={pvX(s.b[0])} y2={pvY(s.b[1])} stroke={s.color} strokeWidth={1.6} strokeDasharray={s.dash} />
          ))}
          {polys.map((list, ci) =>
            list.map((poly, k) => (
              <path
                key={`c${ci}_${k}`}
                d={svgPath(poly)}
                fill="none"
                stroke={curves[ci].color}
                strokeWidth={curves[ci].width ?? 2.6}
                strokeDasharray={curves[ci].dash}
                strokeLinecap="round"
              />
            )),
          )}
        </g>

        {/* 점과 이름표는 잘라 내기 밖에 그린다 */}
        {(trail ?? []).filter(inBox).map(([x, y]) => (
          <circle key={`tr${x}_${y}`} cx={pvX(x)} cy={pvY(y)} r={2.6} fill={trailColor} opacity={0.85} />
        ))}
        {(dots ?? []).filter((d) => inBox(d.p)).map((d, k) => (
          <circle
            key={`d${k}`}
            cx={pvX(d.p[0])}
            cy={pvY(d.p[1])}
            r={d.r ?? 5.5}
            fill={d.ring ? "#0f172a" : d.color}
            stroke={d.ring ? d.color : "#0f172a"}
            strokeWidth={2.2}
          />
        ))}
        <text x={PV.size - PV.pad + 1} y={pvY(0) - 6} textAnchor="end" className="fill-slate-500 text-[10px] font-bold italic">
          x
        </text>
        <text x={pvX(0) + 7} y={PV.pad + 9} className="fill-slate-500 text-[10px] font-bold italic">
          y
        </text>
        {diag ? (
          <text x={PV.size - PV.pad - 2} y={PV.pad + 13} textAnchor="end" className="fill-slate-500 text-[10px] font-bold italic">
            y=x
          </text>
        ) : null}
        {label ? (
          <text x={PV.size / 2} y={PV.size - 4} textAnchor="middle" className="fill-slate-400 text-[10px] font-bold">
            {label}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

function MiniPlane({ fn, dom, color, tone }: { fn: (x: number) => number | null; dom: [number, number]; color: string; tone: string }) {
  const polys = useMemo(() => traceFn(fn, dom, SMALL), [fn, dom]);
  return (
    <svg viewBox={`0 0 ${MV.size} ${MV.size}`} className={"mx-auto block w-full max-w-[150px] rounded-lg border " + tone} role="img" aria-label="보기 그래프">
      <line x1={MV.pad} y1={mvY(0)} x2={MV.size - MV.pad} y2={mvY(0)} stroke="rgba(226,232,240,0.4)" strokeWidth={1.2} />
      <line x1={mvX(0)} y1={MV.pad} x2={mvX(0)} y2={MV.size - MV.pad} stroke="rgba(226,232,240,0.4)" strokeWidth={1.2} />
      <line x1={mvX(MV.min)} y1={mvY(MV.min)} x2={mvX(MV.max)} y2={mvY(MV.max)} stroke="rgba(226,232,240,0.22)" strokeWidth={1.1} strokeDasharray="4 3" />
      {polys.map((poly, k) => (
        <path key={k} d={svgPath(poly, SMALL)} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function InverseGraphLab() {
  const [tab, setTab] = useState<Tab>("sym");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🪞 역함수의 그래프</h3>
        <p className="mt-2 leading-7 text-slate-300">
          역함수의 그래프는 <b className="text-pink-200">직선 y = x 로 접은 모습</b>입니다. 점을 하나씩 옮겨 보며 그 까닭을 찾고, 흔히 하는 오해도 반례로 깨뜨려 보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "sym"} onClick={() => setTab("sym")}>
          ① 점을 하나씩 🪞
        </TabButton>
        <TabButton active={tab === "cross"} onClick={() => setTab("cross")}>
          ② 교점은 어디에? 🎯
        </TabButton>
        <TabButton active={tab === "pick"} onClick={() => setTab("pick")}>
          ③ 역함수 그래프 고르기 🧩
        </TabButton>
        <TabButton active={tab === "slope"} onClick={() => setTab("slope")}>
          ④ 기울기가 정한다 📐
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "sym" ? <SymTab /> : null}
        {tab === "cross" ? <CrossTab /> : null}
        {tab === "pick" ? <PickTab /> : null}
        {tab === "slope" ? <SlopeTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 점을 하나씩 옮겨 보기
// ══════════════════════════════════════════════════════════════
function stepsOf(s: SymFn): number {
  return Math.round((s.dom[1] - s.dom[0]) / SYM_STEP) + 1;
}

function PtCard({ q, pick, onPick }: { q: PtTask; pick: number | undefined; onPick: (i: number) => void }) {
  const right = pick === q.answer;
  return (
    <div className="space-y-2">
      <p className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center text-[14px] font-bold leading-9 text-slate-100">
        <PieceLine ps={q.prompt} />
      </p>
      <TexChoices items={q.choices} pick={pick} answer={q.answer} onPick={onPick} />
      {pick !== undefined ? <Verdict right={right} why={q.why} hint={q.choiceWhy[pick]} /> : null}
    </div>
  );
}

function SymTab() {
  const [si, setSi] = useState(0);
  const [aMap, setAMap] = useState<Record<string, number>>({});
  const [trail, setTrail] = useState<Record<string, number[]>>({});
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const s = SYM_FNS[si];
  const a = aMap[s.id] ?? s.dom[0];
  const b = s.f(a);
  const seen = trail[s.id] ?? [];
  const total = stepsOf(s);
  const ratio = seen.length / total;
  const doneTrail = ratio >= 0.85;

  const move = (v: number) => {
    const r = Math.round(v * 1000) / 1000;
    setAMap((m) => ({ ...m, [s.id]: r }));
    setTrail((m) => {
      const cur = m[s.id] ?? [];
      return cur.includes(r) ? m : { ...m, [s.id]: [...cur, r] };
    });
  };

  const trailPts: Pt[] = seen.map((v) => [s.f(v), v]);
  const curves = [
    { fn: (x: number) => s.f(x), dom: s.dom, color: "#38bdf8" },
    ...(doneTrail ? [{ fn: (x: number) => s.inv(x), dom: s.invDom, color: "#f472b6", dash: "5 4" }] : []),
  ];

  const q = PT_TASKS[qi];
  const doneIds = PT_TASKS.filter((t) => pick[t.id] === t.answer).map((t) => t.id);
  const cleared = pick[q.id] === q.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🪞 점 하나를 옮기면 짝도 함께 움직여요</p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          슬라이더를 왼쪽 끝에서 오른쪽 끝까지 천천히 훑어 보세요. 분홍 점이 지나간 자리가 그대로 <b className="text-pink-200">역함수의 그래프</b>가 됩니다.
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {SYM_FNS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSi(i)}
              className={
                "rounded-lg border-2 px-2.5 py-1.5 text-[13px] font-bold transition " +
                (i === si ? "border-sky-400/70 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              <Katex expr={v.fTex} />
            </button>
          ))}
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <Plane
            curves={curves}
            trail={trailPts}
            segs={[{ a: [a, b], b: [b, a], color: "rgba(226,232,240,0.45)", dash: "4 3" }]}
            dots={[
              { p: [a, b], color: "#38bdf8" },
              { p: [b, a], color: "#f472b6" },
              { p: [(a + b) / 2, (a + b) / 2], color: "#e2e8f0", r: 3.2 },
            ]}
            label={doneTrail ? "역함수의 그래프가 드러났어요" : "분홍 점이 지나간 자리를 보세요"}
          />

          <div className="space-y-2">
            <Slider label={<Katex expr="a" />} value={a} min={s.dom[0]} max={s.dom[1]} step={SYM_STEP} onChange={move} accent="accent-sky-400" />
            <div className="space-y-1">
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-sky-400/10 px-3 py-2 text-center text-[14px] leading-8 text-sky-100">
                <Katex expr={`P(${tx(a)},\\ ${tx(b)})`} />
              </p>
              <p className="text-center text-[11px] font-bold text-slate-400">좌표를 맞바꾸면</p>
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-pink-400/10 px-3 py-2 text-center text-[14px] leading-8 text-pink-100">
                <Katex expr={`P'(${tx(b)},\\ ${tx(a)})`} />
              </p>
            </div>

            <div className="space-y-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-[12px] leading-7 text-slate-300">
              <p>
                두 점의 중점 <Katex expr={`\\left(${tx((a + b) / 2)},\\ ${tx((a + b) / 2)}\\right)`} /> 은 <Katex expr="y=x" /> 위에 있어요
              </p>
              <p>
                선분 <Katex expr="PP'" /> 의 기울기는 언제나 <Katex expr="-1" /> 이라 <Katex expr="y=x" /> 와 수직입니다
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>훑은 자리</span>
                <span className="font-mono text-slate-200">
                  {seen.length} / {total}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-pink-400 transition-all" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
              </div>
              {doneTrail ? (
                <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">🎉 {s.note}</p>
              ) : (
                <p className="mt-2 text-[11px] leading-6 text-slate-500">슬라이더를 끝에서 끝까지 훑으면 역함수의 그래프가 나타나요.</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => { setTrail((m) => ({ ...m, [s.id]: [] })); setAMap((m) => ({ ...m, [s.id]: s.dom[0] })); }}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 자취 지우기
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔎 좌표를 맞바꿔 보기</p>
          <Chips ids={PT_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <PtCard q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < PT_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === PT_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            역함수의 그래프를 다루는 일은 결국 <b className="text-white">좌표를 맞바꾸는 일</b>이에요. <Katex expr="y" />절편이 <Katex expr="x" />절편이 되는 것도 그 때문입니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 교점은 어디에?
// ══════════════════════════════════════════════════════════════
function crossCurves(c: CrossFn | CrossTask, sameColor = false) {
  return [
    { fn: c.f, dom: c.dom, color: "#38bdf8", width: sameColor ? 5.6 : 2.6 },
    { fn: c.inv, dom: c.invDom, color: "#f472b6", width: 2.6 },
  ];
}

function crossDots(c: CrossFn | CrossTask) {
  return c.pts.map((p) => ({
    p,
    color: Math.abs(p[0] - p[1]) < 1e-9 ? "#34d399" : "#fbbf24",
    r: 6,
  }));
}

function CrossTaskCard({ c, pick, onPick }: { c: CrossTask; pick: number | undefined; onPick: (i: number) => void }) {
  const right = pick === c.answer;
  return (
    <div className="space-y-2">
      <p className="overflow-x-auto overflow-y-hidden rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center text-[17px] font-bold leading-9 text-slate-100">
        <Katex expr={c.fTex} />
      </p>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <Plane
          curves={crossCurves(c, c.same)}
          dots={right ? crossDots(c) : undefined}
          label={right ? (c.same ? "두 그래프가 통째로 겹쳐요" : c.pts.length === 0 ? "만나는 점이 없어요" : "노란 점이 y = x 를 벗어난 교점") : "파랑이 f, 분홍이 f⁻¹"}
        />
        <div className="space-y-2">
          <p className="text-[13px] font-bold text-slate-100">두 그래프의 교점은 어디에 있을까요?</p>
          <KindChoices pick={pick} answer={c.answer} onPick={onPick} />
          {pick !== undefined ? <Verdict right={right} why={c.why} hint={c.choiceWhy[pick]} /> : null}
        </div>
      </div>
    </div>
  );
}

function CrossTab() {
  const [ci, setCi] = useState(0);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const c = CROSS_FNS[ci];
  const q = CROSS_TASKS[qi];
  const doneIds = CROSS_TASKS.filter((t) => pick[t.id] === t.answer).map((t) => t.id);
  const cleared = pick[q.id] === q.answer;
  const onCount = c.pts.filter((p) => Math.abs(p[0] - p[1]) < 1e-9).length;
  const offCount = c.pts.filter((p) => Math.abs(p[0] - p[1]) > 1e-9).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🎯 교점이 늘 직선 y = x 위에 있을까?</p>
        <p className="mt-1 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
          📖 <Katex expr="y=f(x)" /> 와 <Katex expr="y=x" /> 의 교점은 언제나 <Katex expr="y=f^{-1}(x)" /> 위에도 있어요. 그래서 교점을 찾을 때 <Katex expr="f(x)=x" /> 를 풀곤 합니다. 그런데 <b className="text-slate-300">그 방법으로 모든 교점을 찾을 수 있을까요?</b>
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {CROSS_FNS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setCi(i)}
              className={
                "rounded-lg border-2 px-2.5 py-1.5 text-[13px] font-bold transition " +
                (i === ci ? "border-violet-400/70 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              <Katex expr={v.fTex} />
            </button>
          ))}
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <Plane
            curves={crossCurves(c, c.same)}
            dots={crossDots(c)}
            label={c.same ? "두 그래프가 통째로 겹쳐요" : c.pts.length === 0 ? "만나는 점이 없어요" : "초록은 y=x 위, 노랑은 벗어난 교점"}
          />
          <div className="space-y-2">
            <div className="grid gap-1.5 sm:grid-cols-2">
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-sky-400/10 px-3 py-2 text-center text-[13px] leading-8 text-sky-100">
                <Katex expr={c.fTex} />
              </p>
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-pink-400/10 px-3 py-2 text-center text-[13px] leading-8 text-pink-100">
                <Katex expr={c.invTex} />
              </p>
            </div>
            <div className="space-y-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-[12px] leading-7 text-slate-300">
              <p>
                <span className="font-bold text-slate-400">모양</span> · {c.rising ? "쭉 오르는 함수" : "쭉 내리는 함수"}
              </p>
              <p>
                <span className="font-bold text-slate-400">교점</span> ·{" "}
                {c.same ? (
                  <span className="text-amber-200">무수히 많음 (그래프가 통째로 겹침)</span>
                ) : c.pts.length === 0 ? (
                  <span className="text-slate-400">없음</span>
                ) : (
                  <>
                    <span className="text-emerald-200">
                      <Katex expr="y=x" /> 위 {onCount}개
                    </span>
                    {offCount > 0 ? <span className="text-amber-200"> · 벗어난 것 {offCount}개</span> : null}
                  </>
                )}
              </p>
            </div>
            <p className={"rounded-lg px-3 py-2 text-center text-[13px] font-extrabold " + (c.kind === 1 ? "bg-amber-400/15 text-amber-100" : c.kind === 0 ? "bg-emerald-400/15 text-emerald-100" : "bg-white/5 text-slate-300")}>
              {CROSS_CHOICES[c.kind]}
            </p>
            <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">🔍 {c.why}</p>
          </div>
        </div>

        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-[12px] leading-6 text-emerald-100">
            ↗ <b>쭉 오르는 함수</b>면 교점은 반드시 <Katex expr="y=x" /> 위에 있어요.
          </p>
          <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">
            ↘ <b>쭉 내리는 함수</b>면 <Katex expr="y=x" /> 를 벗어난 교점이 생길 수 있어요.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧭 직접 가려내 보기</p>
          <Chips ids={CROSS_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <CrossTaskCard c={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < CROSS_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === CROSS_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <Katex expr="f(x)=x" /> 를 풀어 찾은 것은 <b className="text-white">언제나 교점이 맞지만 그것이 전부는 아닐 수 있어요.</b> 내리는 함수라면 <Katex expr="y=x" /> 를 벗어난 교점이 있는지 꼭 살펴야 합니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 역함수 그래프 고르기
// ══════════════════════════════════════════════════════════════
function PickCard({ t, pick, onPick }: { t: GraphTask; pick: number | undefined; onPick: (i: number) => void }) {
  const right = pick === t.answer;
  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
        <div className="space-y-1.5">
          <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-sky-400/10 px-3 py-2 text-center text-[14px] leading-8 text-sky-100">
            <Katex expr={t.fTex} />
          </p>
          <MiniPlane fn={t.f} dom={t.dom} color="#38bdf8" tone="border-sky-400/40 bg-slate-950/70" />
          <p className="text-center text-[11px] font-bold text-slate-400">주어진 함수</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-bold text-slate-100">
            이 함수의 <Katex expr="y=f^{-1}(x)" /> 그래프는 어느 것일까요?
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {t.choices.map((c, i) => {
              const good = pick === i && i === t.answer;
              const badPick = pick === i && i !== t.answer;
              return (
                <button
                  key={c.tex}
                  type="button"
                  onClick={() => onPick(i)}
                  disabled={right}
                  className={
                    "rounded-xl border-2 p-1.5 transition disabled:cursor-default " +
                    (good
                      ? "border-emerald-400/70 bg-emerald-400/15"
                      : badPick
                        ? "border-rose-400/70 bg-rose-400/15"
                        : "border-white/10 bg-white/5 hover:bg-white/10")
                  }
                >
                  <p className="text-left text-[11px] font-bold text-slate-400">{ABC[i]}</p>
                  <MiniPlane fn={c.g} dom={c.dom} color={good ? "#34d399" : badPick ? "#fb7185" : "#f472b6"} tone="border-white/10 bg-slate-950/70" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {pick !== undefined ? (
        <div className="space-y-1.5">
          {right ? (
            <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-emerald-400/12 px-3 py-2 text-center text-[15px] leading-9 text-emerald-100">
              <Katex expr={t.choices[t.answer].tex} />
            </p>
          ) : null}
          <Verdict right={right} why={t.why} hint={t.choiceWhy[pick]} />
        </div>
      ) : (
        <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
          💡 네 그림 모두 점선 <Katex expr="y=x" /> 가 함께 그려져 있어요. <b className="text-slate-300">그 선으로 접었을 때 주어진 그래프와 포개지는 것</b>을 고르면 됩니다.
        </p>
      )}
    </div>
  );
}

function PickTab() {
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const t = GRAPH_TASKS[qi];
  const doneIds = GRAPH_TASKS.filter((v) => pick[v.id] === v.answer).map((v) => v.id);
  const cleared = pick[t.id] === t.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧩 접으면 포개지는 그래프 찾기</p>
          <Chips ids={GRAPH_TASKS.map((v) => v.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <PickCard t={t} pick={pick[t.id]} onPick={(i) => setPick((m) => ({ ...m, [t.id]: i }))} />
        </div>
        {cleared && qi < GRAPH_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === GRAPH_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 다섯 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <Katex expr="x" />축·<Katex expr="y" />축·원점에 대한 대칭과 헷갈리지 마세요. 역함수는 <b className="text-white">직선 <Katex expr="y=x" /> 에 대한 대칭</b>이라 가파른 것이 완만해지고 절편이 축을 바꿔 탑니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 기울기가 정한다
// ══════════════════════════════════════════════════════════════
function SlopeTab() {
  const [a, setA] = useState(AB.aInit);
  const [b, setB] = useState(AB.bInit);
  const [seen, setSeen] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const kind = abKind(a, b);
  const point = abPoint(a, b);
  const same = Math.abs(a + 1) < 1e-9 || (Math.abs(a - 1) < 1e-9 && Math.abs(b) < 1e-9);

  const note = (na: number, nb: number) => {
    const k = abKind(na, nb);
    if (k === null) return;
    setSeen((s) => [...new Set([...s, String(k)])]);
  };

  const curves =
    kind === null
      ? [{ fn: (x: number) => a * x + b, dom: [-5, 5] as [number, number], color: "#38bdf8" }]
      : [
          { fn: (x: number) => a * x + b, dom: [-5, 5] as [number, number], color: "#38bdf8", width: same ? 5.6 : 2.6 },
          { fn: (x: number) => (x - b) / a, dom: [-5, 5] as [number, number], color: "#f472b6", width: 2.6 },
        ];

  const q = AB_TASKS[qi];
  const doneIds = AB_TASKS.filter((t) => pick[t.id] === t.answer).map((t) => t.id);
  const cleared = pick[q.id] === q.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">📐 기울기를 바꾸면 교점이 어떻게 될까?</p>
        <p className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-center text-[15px] leading-8 text-slate-100">
          <Katex expr="y = ax + b \quad (a \ne 0)" />
        </p>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <Plane
            curves={curves}
            dots={point ? [{ p: point, color: "#34d399", r: 6 }] : undefined}
            label={kind === null ? "a = 0 이면 역함수가 없어요" : same ? "두 그래프가 통째로 겹쳐요" : kind === 2 ? "두 직선이 나란해요" : "초록 점이 교점"}
          />

          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <Slider label={<Katex expr="a" />} value={a} min={AB.aMin} max={AB.aMax} step={AB.step} onChange={(v) => { setA(v); note(v, b); }} accent="accent-sky-400" />
              <Slider label={<Katex expr="b" />} value={b} min={AB.bMin} max={AB.bMax} step={AB.step} onChange={(v) => { setB(v); note(a, v); }} accent="accent-pink-400" />
            </div>

            <div className="grid gap-1.5 sm:grid-cols-2">
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-sky-400/10 px-3 py-2 text-center text-[13px] leading-8 text-sky-100">
                <Katex expr={`y = ${tx(a)}x ${b < 0 ? "-" : "+"} ${tx(Math.abs(b))}`} />
              </p>
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-pink-400/10 px-3 py-2 text-center text-[13px] leading-8 text-pink-100">
                {kind === null ? "역함수가 없어요" : <Katex expr={`y = \\dfrac{x ${b < 0 ? "+" : "-"} ${tx(Math.abs(b))}}{${tx(a)}}`} />}
              </p>
            </div>

            <p className={"rounded-lg px-3 py-2 text-center text-[13px] font-extrabold " + (kind === null ? "bg-white/5 text-slate-300" : kind === 1 ? "bg-amber-400/15 text-amber-100" : kind === 0 ? "bg-emerald-400/15 text-emerald-100" : "bg-white/5 text-slate-300")}>
              {kind === null ? "기울기가 0 이라 역함수가 없어요" : CROSS_CHOICES[kind]}
            </p>
            {point ? (
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2 text-center text-[13px] leading-8 text-slate-200">
                <Katex expr={`\\text{cross} = (${tx(point[0])},\\ ${tx(point[1])})`} />
              </p>
            ) : null}

            <GoalList goals={AB_GOALS} seen={seen} />
          </div>
        </div>

        <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
          <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-[12px] leading-6 text-emerald-100">
            <Katex expr="a \ne 1,\ a \ne -1" /> 이면 교점이 하나뿐이고 늘 <Katex expr="y=x" /> 위
          </p>
          <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">
            <Katex expr="a = -1" /> 이면 두 그래프가 통째로 겹쳐 <Katex expr="y=x" /> 밖에도 교점
          </p>
          <p className="rounded-lg bg-white/5 px-3 py-2 text-[12px] leading-6 text-slate-300">
            <Katex expr="a = 1,\ b \ne 0" /> 이면 나란해서 교점이 없음
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔎 값을 보고 가려내 보기</p>
          <Chips ids={AB_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2 space-y-2">
          <p className="overflow-x-auto overflow-y-hidden rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center text-[17px] font-bold leading-9 text-slate-100">
            <Katex expr={`y = ${tx(q.a)}x ${q.b < 0 ? "-" : "+"} ${tx(Math.abs(q.b))}`} />
          </p>
          <p className="text-[13px] font-bold text-slate-100">이 함수와 그 역함수의 교점은 어디에 있을까요?</p>
          <KindChoices pick={pick[q.id]} answer={q.answer} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
          {pick[q.id] !== undefined ? (
            <Verdict right={cleared} why={q.why} hint={q.choiceWhy[pick[q.id]]} />
          ) : null}
        </div>
        {cleared && qi < AB_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === AB_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            일차함수에서 <Katex expr="y=x" /> 를 벗어난 교점이 생기는 것은 <b className="text-white"><Katex expr="a=-1" /> 일 때뿐</b>이에요. <Katex expr="a=-3" /> 처럼 내리는 직선이어도 교점은 <Katex expr="y=x" /> 위에 하나뿐이었습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
