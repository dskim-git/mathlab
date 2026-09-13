"use client";

import { useId, useMemo, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  ASSOC,
  ASSOC_FN,
  CH,
  COMB,
  COMM_GOALS,
  COUPONS,
  COUPON_GOALS,
  COUPON_TASKS,
  DEF_TASKS,
  F_LIST,
  G_LIST,
  L1_DIA,
  LAWS,
  LIFE_CASES,
  PRICE,
  PV,
  PV_TICKS,
  SWAP_CHOICES,
  TRACE,
  ZERO_FS,
  amountFirst,
  chGeom,
  chRowY,
  gapOf,
  pvX,
  pvY,
  rateFirst,
  svgPath,
  traceFn,
  won,
  type Coupon,
  type CouponTask,
  type DefTask,
  type LifeCase,
  type Piece,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_order",
    prompt:
      "g ∘ f 는 f 를 먼저 쓰고 g 를 나중에 쓰는데 기호는 거꾸로 적습니다. 이 표기가 왜 헷갈리는지, 그리고 f 의 치역이 g 의 정의역에 들어가야 하는 까닭은 무엇인지 써 보세요.",
    kind: "text",
    placeholder:
      "예: (g∘f)(x) = g(f(x)) 라서 안쪽 괄호부터 계산하는데 기호는 g 가 앞에 있어 g 를 먼저 쓰는 것으로 착각하기 쉽다. 또 f(x) 가 g 에 넣을 수 없는 값이면 g(f(x)) 를 정할 수 없으므로 f 의 치역이 g 의 정의역 안에 들어가야 한다. f(x)=2x, g(x)=1/(x−4) 일 때 x=2 에서 g(4) 가 되어 합성이 안 되는 것을 보았다.",
  },
  {
    id: "vs_product",
    prompt:
      "함수의 합성을 수의 곱에 견주었을 때 닮은 점과 다른 점을 정리해 보세요. 특히 항등함수와 영함수가 어떤 구실을 하는지 함께 써 보세요.",
    kind: "text",
    placeholder:
      "예: 결합법칙은 수의 곱처럼 늘 성립하지만 교환법칙은 성립하지 않는다. 항등함수 I 는 f∘I = I∘f = f 라서 수 1 의 구실을 한다. 영함수 O 는 O∘f = O 로 한쪽은 0 과 같지만, f∘O 는 f(0) 인 상수함수라 f(0) ≠ 0 이면 영함수가 아니다. 수에서 a×0 = 0×a = 0 인 것과 여기서 갈라진다.",
  },
  {
    id: "coupon_rule",
    prompt:
      "쿠폰을 쓰는 순서에서 알아낸 규칙을 합성함수의 말로 설명해 보세요. 두 방법의 차이가 왜 물건값과 관계없이 일정한지도 함께 써 보세요.",
    kind: "text",
    placeholder:
      "예: 정액 할인은 f(x) = x − a, 정률 할인은 g(x) = (1−p)x 이고 두 방법은 (g∘f)(x) 와 (f∘g)(x) 다. 두 값의 차는 a − (1−p)a = ap 로 x 가 사라지므로 물건값과 관계없이 일정하다. 그래서 정률 쿠폰을 먼저 쓰는 쪽이 늘 ap 원만큼 싸다. 정률끼리나 정액끼리는 순서를 바꾸어도 같았다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "intro" | "laws" | "coupon" | "life";

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

function Slider({ label, value, min, max, step, onChange, accent = "accent-cyan-400", show }: { label: React.ReactNode; value: number; min: number; max: number; step: number; onChange: (v: number) => void; accent?: string; show?: string }) {
  return (
    <label className="block text-[11px] font-bold text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        {label} <span className="font-mono text-[13px] text-slate-100">{show ?? value}</span>
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

function arrowHead(x1: number, y1: number, x2: number, y2: number): string {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const L = 9.5;
  const W = 4.6;
  const bx = x2 - L * Math.cos(a);
  const by = y2 - L * Math.sin(a);
  return `${x2},${y2} ${bx + W * Math.sin(a)},${by - W * Math.cos(a)} ${bx - W * Math.sin(a)},${by + W * Math.cos(a)}`;
}

// ══════════════════════════════════════════════════════════════
// 여러 집합을 잇는 대응도
// ══════════════════════════════════════════════════════════════
type ChainProps = {
  cols: string[][];
  /** 칸 이름 (X, Y, Z …) */
  names: string[];
  /** 화살표 이름 (f, g, h …) */
  maps: string[];
  /** maps[i] 에 해당하는 대응 — cols[i] 첨자 → cols[i+1] 첨자 */
  links: number[][];
  /** 밝게 표시할 화살표 — [단계, 출발 첨자] */
  lit?: [number, number][];
  litColor?: string;
  /** 두 번째 갈래 (결합법칙에서 쓴다) */
  lit2?: [number, number][];
  lit2Color?: string;
  /** 밝게 표시할 원소 — [칸, 첨자] */
  dots?: [number, number][];
  /** 맨 앞에서 맨 뒤로 잇는 합성 화살표 */
  composite?: { from: number; to: number; label: string; color: string } | null;
  fontPx?: number;
  onPickX?: (i: number) => void;
  selX?: number | null;
};

function ChainDia({ cols, names, maps, links, lit, litColor = "#fbbf24", lit2, lit2Color = "#f472b6", dots, composite = null, fontPx = 14, onPickX, selX = null }: ChainProps) {
  const counts = cols.map((c) => c.length);
  const g = chGeom(counts, Boolean(composite));
  const isLit = (s: number, i: number, arr?: [number, number][]) => Boolean(arr?.some(([a, b]) => a === s && b === i));
  const isDot = (c: number, i: number) => Boolean(dots?.some(([a, b]) => a === c && b === i));

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${g.w} ${g.h}`} className="mx-auto block w-full touch-none select-none" role="img" aria-label="여러 집합을 차례로 잇는 대응 그림">
        {cols.map((col, c) => (
          <g key={`col${c}`}>
            <ellipse cx={g.cxs[c]} cy={g.cy} rx={CH.rx} ry={g.rys[c]} fill="rgba(255,255,255,0.03)" stroke="rgba(226,232,240,0.55)" strokeWidth={2} />
            <text x={g.cxs[c]} y={g.cy - g.rys[c] - 9} textAnchor="middle" className="fill-slate-300 text-[13px] font-bold">
              {names[c]}
            </text>
          </g>
        ))}

        {/* 위쪽 이름표 화살표 */}
        {maps.map((m, s) => (
          <g key={`map${s}`}>
            <line x1={g.cxs[s] + 26} y1={22} x2={g.cxs[s + 1] - 26} y2={22} stroke="rgba(226,232,240,0.45)" strokeWidth={1.6} />
            <polygon points={arrowHead(g.cxs[s] + 26, 22, g.cxs[s + 1] - 26, 22)} fill="rgba(226,232,240,0.45)" />
            <text x={(g.cxs[s] + g.cxs[s + 1]) / 2} y={14} textAnchor="middle" className="fill-slate-300 text-[12px] font-bold italic">
              {m}
            </text>
          </g>
        ))}

        {/* 대응 화살표 */}
        {links.map((lk, s) =>
          lk.map((to, i) => {
            const y1 = chRowY(i, counts[s], g.cy);
            const y2 = chRowY(to, counts[s + 1], g.cy);
            const x1 = g.cxs[s] + CH.inset;
            const x2 = g.cxs[s + 1] - CH.inset;
            const on1 = isLit(s, i, lit);
            const on2 = isLit(s, i, lit2);
            const col = on1 ? litColor : on2 ? lit2Color : "rgba(226,232,240,0.32)";
            const wdt = on1 || on2 ? 2.8 : 1.6;
            return (
              <g key={`a${s}_${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={wdt} />
                <polygon points={arrowHead(x1, y1, x2, y2)} fill={col} />
              </g>
            );
          }),
        )}

        {/* 합성 화살표 — 아래로 크게 돌아간다 */}
        {composite ? (
          <g>
            <path
              d={`M${g.cxs[0]},${g.cy + g.rys[0] + 6} Q${(g.cxs[0] + g.cxs[cols.length - 1]) / 2},${g.h - 8} ${g.cxs[cols.length - 1]},${g.cy + g.rys[cols.length - 1] + 6}`}
              fill="none"
              stroke={composite.color}
              strokeWidth={2.4}
            />
            <polygon
              points={arrowHead(
                (g.cxs[0] + g.cxs[cols.length - 1]) / 2,
                g.h - 14,
                g.cxs[cols.length - 1] - 3,
                g.cy + g.rys[cols.length - 1] + 9,
              )}
              fill={composite.color}
            />
            <text x={(g.cxs[0] + g.cxs[cols.length - 1]) / 2} y={g.h - 16} textAnchor="middle" style={{ fill: composite.color }} className="text-[12px] font-bold italic">
              {composite.label}
            </text>
          </g>
        ) : null}

        {/* 원소 */}
        {cols.map((col, c) =>
          col.map((s, i) => {
            const y = chRowY(i, counts[c], g.cy);
            const on = isDot(c, i);
            const sel = c === 0 && selX === i;
            const clickable = c === 0 && Boolean(onPickX);
            return (
              <g
                key={`n${c}_${i}`}
                className={clickable ? "cursor-pointer" : undefined}
                onPointerDown={clickable ? (e) => { e.preventDefault(); onPickX?.(i); } : undefined}
              >
                <circle
                  cx={g.cxs[c]}
                  cy={y}
                  r={15}
                  fill={sel ? "rgba(34,211,238,0.3)" : on ? "rgba(52,211,153,0.25)" : clickable ? "rgba(255,255,255,0.07)" : "transparent"}
                  stroke={sel ? "#22d3ee" : on ? "#34d399" : "transparent"}
                  strokeWidth={2}
                />
                <text x={g.cxs[c]} y={y + fontPx * 0.36} textAnchor="middle" style={{ fontSize: fontPx }} className="fill-slate-100 font-semibold">
                  {s}
                </text>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function CompositeFunctionLab() {
  const [tab, setTab] = useState<Tab>("intro");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔗 합성함수</h3>
        <p className="mt-2 leading-7 text-slate-300">
          함수를 <b className="text-violet-200">이어 붙이는 일</b>입니다. 두 번 거쳐 가는 길을 한 번에 가는 길로 바꾸어 보고, 순서를 바꾸면 무엇이 달라지는지 살펴보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "intro"} onClick={() => setTab("intro")}>
          ① 합성함수란 🔗
        </TabButton>
        <TabButton active={tab === "laws"} onClick={() => setTab("laws")}>
          ② 합성의 성질 ⚖️
        </TabButton>
        <TabButton active={tab === "coupon"} onClick={() => setTab("coupon")}>
          ③ 쿠폰 쓰는 순서 🎟️
        </TabButton>
        <TabButton active={tab === "life"} onClick={() => setTab("life")}>
          ④ 일상 속 합성 🏭
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "intro" ? <IntroTab /> : null}
        {tab === "laws" ? <LawsTab /> : null}
        {tab === "coupon" ? <CouponTab /> : null}
        {tab === "life" ? <LifeTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 합성함수란
// ══════════════════════════════════════════════════════════════
function PickRow({ items, picked, answer, onPick, tone }: { items: string[]; picked: number | undefined; answer: number; onPick: (i: number) => void; tone: string }) {
  const right = picked === answer;
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {items.map((s, i) => {
        const good = picked === i && i === answer;
        const badPick = picked === i && i !== answer;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "rounded-xl border-2 px-2 py-2 font-mono text-[15px] font-bold transition disabled:cursor-default " +
              (good ? tone : badPick ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

function DefCard({ q, pick, onPick }: { q: DefTask; pick: boolean | undefined; onPick: (v: boolean) => void }) {
  const right = pick === q.ok;
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-violet-400/35 bg-violet-400/8 px-3 py-2.5">
          <p className="text-[11px] font-bold text-violet-200">먼저 쓰는 함수</p>
          <p className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-[15px] text-slate-100">
            <Katex expr={q.fTex} />
          </p>
          <p className="mt-1 flex flex-wrap items-baseline gap-1.5 text-[12px] text-slate-300">
            <span className="font-bold text-emerald-200">치역</span>
            <PieceLine ps={q.fRange} />
          </p>
        </div>
        <div className="rounded-xl border-2 border-sky-400/35 bg-sky-400/8 px-3 py-2.5">
          <p className="text-[11px] font-bold text-sky-200">나중에 쓰는 함수</p>
          <p className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-[15px] text-slate-100">
            <Katex expr={q.gTex} />
          </p>
          <p className="mt-1 flex flex-wrap items-baseline gap-1.5 text-[12px] text-slate-300">
            <span className="font-bold text-amber-200">정의역</span>
            <PieceLine ps={q.gDom} />
          </p>
        </div>
      </div>

      <p className="text-center text-[13px] font-bold text-slate-100">
        <Katex expr="g \circ f" /> 를 만들 수 있을까요?
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {[true, false].map((v) => {
          const good = pick === v && v === q.ok;
          const badPick = pick === v && v !== q.ok;
          return (
            <button
              key={String(v)}
              type="button"
              onClick={() => onPick(v)}
              disabled={right}
              className={
                "rounded-xl border-2 px-2 py-2.5 text-[13px] font-bold transition disabled:cursor-default " +
                (good
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : badPick
                    ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              {v ? "만들 수 있다" : "만들 수 없다"}
            </button>
          );
        })}
      </div>
      {pick !== undefined ? (
        right ? (
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {q.why}</p>
        ) : (
          <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
            ❌ <b>f 의 치역</b>이 <b>g 의 정의역</b> 안에 온전히 들어가는지만 따지면 됩니다. 하나라도 삐져나오면 만들 수 없어요.
          </p>
        )
      ) : null}
    </div>
  );
}

function IntroTab() {
  const [xi, setXi] = useState(0);
  const [fPick, setFPick] = useState<Record<number, number>>({});
  const [gPick, setGPick] = useState<Record<number, number>>({});

  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, boolean>>({});

  const fAns = TRACE.f[xi];
  const gAns = TRACE.g[fAns];
  const fOk = fPick[xi] === fAns;
  const gOk = gPick[xi] === gAns;
  const doneX = TRACE.xs.map((_, i) => fPick[i] === TRACE.f[i] && gPick[i] === TRACE.g[TRACE.f[i]]);
  const allX = doneX.every(Boolean);

  const lit: [number, number][] = [];
  if (fPick[xi] !== undefined || true) lit.push([0, xi]);
  if (fOk) lit.push([1, fAns]);

  const q = DEF_TASKS[qi];
  const doneIds = DEF_TASKS.filter((t) => pick[t.id] === t.ok).map((t) => t.id);
  const cleared = pick[q.id] === q.ok;

  return (
    <div className="space-y-4">
      {/* 따라가기 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🚶 두 번 거쳐 가는 길을 따라가 보세요</p>
        <p className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-center text-[15px] leading-8 text-slate-100">
          <Katex expr="(g \circ f)(x) = g(f(x))" />
        </p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          왼쪽 원소를 고른 뒤 <b className="text-amber-200">f 로 가는 곳</b>과 <b className="text-pink-200">g 로 가는 곳</b>을 차례로 골라 보세요.
        </p>

        <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
          <ChainDia
            cols={[TRACE.xs, TRACE.ys, TRACE.zs]}
            names={["X", "Y", "Z"]}
            maps={["f", "g"]}
            links={[TRACE.f, TRACE.g]}
            lit={lit}
            litColor={gOk ? "#34d399" : "#fbbf24"}
            dots={[[0, xi], ...(fOk ? ([[1, fAns]] as [number, number][]) : []), ...(gOk ? ([[2, gAns]] as [number, number][]) : [])]}
            composite={allX ? { from: 0, to: 2, label: "g∘f", color: "#34d399" } : null}
            onPickX={(i) => setXi(i)}
            selX={xi}
          />

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {TRACE.xs.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setXi(i)}
                  className={
                    "h-8 min-w-[2.2rem] rounded-lg border-2 px-1.5 font-mono text-xs font-bold transition " +
                    (i === xi
                      ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100"
                      : doneX[i]
                        ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
                  }
                >
                  {doneX[i] && i !== xi ? "✓" : s}
                </button>
              ))}
              <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300">
                {doneX.filter(Boolean).length} / {TRACE.xs.length}
              </span>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
              <p className="text-[12px] font-bold text-amber-200">
                1단계 · <Katex expr={`f(${TRACE.xs[xi]})`} /> 은 얼마일까요?
              </p>
              <div className="mt-1.5">
                <PickRow items={TRACE.ys} picked={fPick[xi]} answer={fAns} onPick={(i) => setFPick((m) => ({ ...m, [xi]: i }))} tone="border-amber-400/70 bg-amber-400/20 text-amber-100" />
              </div>
            </div>

            <div className={"rounded-xl border px-3 py-2.5 transition " + (fOk ? "border-white/10 bg-black/25" : "pointer-events-none border-white/10 bg-black/25 opacity-40")}>
              <p className="text-[12px] font-bold text-pink-200">
                2단계 · <Katex expr={`g(${fOk ? TRACE.ys[fAns] : "\\ \\ "})`} /> 은 얼마일까요?
              </p>
              {!fOk ? <p className="mt-1 text-[11px] text-slate-500">1단계를 맞히면 열려요.</p> : null}
              <div className="mt-1.5">
                <PickRow items={TRACE.zs} picked={gPick[xi]} answer={gAns} onPick={(i) => setGPick((m) => ({ ...m, [xi]: i }))} tone="border-pink-400/70 bg-pink-400/20 text-pink-100" />
              </div>
            </div>

            {fOk && gOk ? (
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-emerald-400/12 px-3 py-2.5 text-center text-[14px] leading-8 text-emerald-100">
                <Katex expr={`(g \\circ f)(${TRACE.xs[xi]}) = g(f(${TRACE.xs[xi]})) = g(${TRACE.ys[fAns]}) = ${TRACE.zs[gAns]}`} />
              </p>
            ) : null}
          </div>
        </div>

        {allX ? (
          <div className="mt-2 rounded-xl border-2 border-emerald-400/50 bg-emerald-400/12 p-3">
            <p className="text-center text-[13px] font-extrabold text-emerald-100">🎉 세 원소를 모두 따라갔어요!</p>
            <div className="mt-2 overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 py-1">
              <table className="w-full min-w-[260px] text-center font-mono text-[13px]">
                <thead>
                  <tr className="text-slate-400">
                    <th className="px-2 py-1 font-bold">x</th>
                    {TRACE.xs.map((s) => (
                      <th key={s} className="px-2 py-1 font-bold text-slate-200">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/10">
                    <td className="px-2 py-1 font-bold text-amber-300">f(x)</td>
                    {TRACE.xs.map((s, i) => (
                      <td key={s} className="px-2 py-1 text-slate-100">
                        {TRACE.ys[TRACE.f[i]]}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="px-2 py-1 font-bold text-emerald-300">(g∘f)(x)</td>
                    {TRACE.xs.map((s, i) => (
                      <td key={s} className="px-2 py-1 text-slate-100">
                        {TRACE.zs[TRACE.g[TRACE.f[i]]]}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-7 text-slate-300">
              아래쪽 초록 화살표가 <Katex expr="g \circ f" /> 예요. 두 번 거쳐 가던 길이 <b className="text-white">한 번에 가는 길</b>이 되었습니다. 1 과 3 이 모두 10 으로 가듯, 합성함수도 서로 다른 x 가 같은 곳으로 갈 수 있어요.
            </p>
          </div>
        ) : null}
      </div>

      {/* 합성이 될까 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔎 합성할 수 있을까?</p>
          <Chips ids={DEF_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <p className="mt-1 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
          📖 <b className="text-slate-300">따질 것은 하나뿐</b> — <Katex expr="f" /> 가 내놓는 값을 <Katex expr="g" /> 에 넣을 수 있어야 합니다. 곧 <Katex expr="f" /> 의 치역이 <Katex expr="g" /> 의 정의역에 온전히 들어가야 해요.
        </p>
        <div className="mt-2">
          <DefCard q={q} pick={pick[q.id]} onPick={(v) => setPick((m) => ({ ...m, [q.id]: v }))} />
        </div>
        {cleared && qi < DEF_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === DEF_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <Katex expr="g \circ f" /> 는 <b className="text-white">f 를 먼저</b>, g 를 나중에 쓰는데 기호는 거꾸로 적습니다. 안쪽 괄호부터 계산한다고 생각하면 헷갈리지 않아요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 합성의 성질
// ══════════════════════════════════════════════════════════════
function CompPlane({ gf, fg, x, same }: { gf: (v: number) => number; fg: (v: number) => number; x: number; same: boolean }) {
  const uid = useId().replace(/:/g, "");
  const p1 = useMemo(() => traceFn(gf), [gf]);
  const p2 = useMemo(() => traceFn(fg), [fg]);
  const y1 = gf(x);
  const y2 = fg(x);
  const inBox = (v: number) => v >= PV.min && v <= PV.max;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${PV.size} ${PV.size}`} className="mx-auto block w-full max-w-[300px]" role="img" aria-label="두 합성함수를 한 좌표평면에 겹쳐 그린 그래프">
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
          <line x1={pvX(x)} y1={PV.pad} x2={pvX(x)} y2={PV.size - PV.pad} stroke="rgba(226,232,240,0.25)" strokeWidth={1.4} strokeDasharray="5 4" />
          {p2.map((poly, k) => (
            <path key={`b${k}`} d={svgPath(poly)} fill="none" stroke="#38bdf8" strokeWidth={same ? 5.2 : 2.8} strokeLinecap="round" opacity={same ? 0.55 : 1} />
          ))}
          {p1.map((poly, k) => (
            <path key={`a${k}`} d={svgPath(poly)} fill="none" stroke="#f472b6" strokeWidth={2.6} strokeLinecap="round" />
          ))}
        </g>

        {inBox(y2) ? <circle cx={pvX(x)} cy={pvY(y2)} r={5.5} fill="#38bdf8" stroke="#0f172a" strokeWidth={2} /> : null}
        {inBox(y1) ? <circle cx={pvX(x)} cy={pvY(y1)} r={5.5} fill="#f472b6" stroke="#0f172a" strokeWidth={2} /> : null}
        <text x={PV.size - PV.pad + 1} y={pvY(0) - 6} textAnchor="end" className="fill-slate-500 text-[10px] font-bold italic">
          x
        </text>
        <text x={pvX(0) + 7} y={PV.pad + 9} className="fill-slate-500 text-[10px] font-bold italic">
          y
        </text>
      </svg>
    </div>
  );
}

function LawRowCard({ id, name, numTex, fnTex, holds, why, pick, onPick }: { id: string; name: string; numTex: string; fnTex: string; holds: boolean; why: string; pick: boolean | undefined; onPick: (v: boolean) => void }) {
  const right = pick === holds;
  return (
    <div className={"rounded-xl border-2 px-3 py-2.5 transition " + (right ? (holds ? "border-emerald-400/45 bg-emerald-400/10" : "border-rose-400/45 bg-rose-400/10") : pick !== undefined ? "border-amber-400/45 bg-amber-400/10" : "border-white/10 bg-black/25")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-bold text-slate-200">{name}</p>
        <div className="flex gap-1.5">
          {[true, false].map((v) => {
            const good = pick === v && v === holds;
            const badPick = pick === v && v !== holds;
            return (
              <button
                key={String(v)}
                type="button"
                onClick={() => onPick(v)}
                disabled={right}
                className={
                  "rounded-lg border-2 px-3 py-1.5 text-[12px] font-bold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : badPick
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                {v ? "성립" : "성립 안 함"}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
        <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-white/5 px-2.5 py-1.5 text-center text-[13px] leading-7 text-sky-100">
          <Katex expr={numTex} />
        </p>
        <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-white/5 px-2.5 py-1.5 text-center text-[13px] leading-7 text-violet-100">
          <Katex expr={fnTex} />
        </p>
      </div>
      {right ? <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">{holds ? "✅" : "⚠️"} {why}</p> : null}
      {pick !== undefined && !right ? (
        <p className="mt-1.5 rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">🤔 다시 생각해 보세요. 구체적인 함수를 하나 넣어 두 쪽을 직접 계산해 보면 금방 드러납니다.</p>
      ) : null}
      <span className="sr-only">{id}</span>
    </div>
  );
}

function LawsTab() {
  const [fi, setFi] = useState(0);
  const [gi, setGi] = useState(1);
  const [cx, setCx] = useState(1);
  const [seen, setSeen] = useState<string[]>([]);

  const [ai, setAi] = useState(0);
  const [ax, setAx] = useState(2);

  const [lawPick, setLawPick] = useState<Record<string, boolean>>({});
  const [zi, setZi] = useState(0);

  const f = F_LIST[fi];
  const g = G_LIST[gi];
  const c = COMB[`${f.id}:${g.id}`];

  /** 고른 짝을 체크리스트에 반영한다 — 같은 짝은 몇 가지를 찾았는지도 센다 */
  const note = (nf: number, ng: number) => {
    const cc = COMB[`${F_LIST[nf].id}:${G_LIST[ng].id}`];
    setSeen((s) => {
      const next = new Set(s);
      if (cc.same) {
        next.add("1");
        next.add(`p${nf}${ng}`);
      } else {
        next.add("0");
      }
      if ([...next].filter((v) => v.startsWith("p")).length >= 3) next.add("2");
      return [...next];
    });
  };

  const A = ASSOC;
  const aGf = A.g[A.f[ai]];
  const aEnd = A.h[aGf];
  const path1: [number, number][] = [
    [0, ai],
    [1, A.f[ai]],
  ];
  const path2: [number, number][] = [[2, aGf]];

  const law = LAWS;
  const lawDone = law.filter((r) => lawPick[r.id] === r.holds).length;
  const z = ZERO_FS[zi];
  const z0 = z.fn(0);

  return (
    <div className="space-y-4">
      {/* 교환법칙 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🔄 순서를 바꾸면 달라질까?</p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          <Katex expr="f" /> 와 <Katex expr="g" /> 를 골라 <Katex expr="g \circ f" /> 와 <Katex expr="f \circ g" /> 를 견주어 보세요.
        </p>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] font-bold text-pink-200">먼저 쓰는 함수 f</p>
            <div className="grid grid-cols-2 gap-1.5">
              {F_LIST.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => { setFi(i); note(i, gi); }}
                  className={
                    "rounded-lg border-2 px-2 py-1.5 text-[13px] font-bold transition " +
                    (i === fi ? "border-pink-400/70 bg-pink-400/20 text-pink-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  <Katex expr={v.tex} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold text-sky-200">나중에 쓰는 함수 g</p>
            <div className="grid grid-cols-2 gap-1.5">
              {G_LIST.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => { setGi(i); note(fi, i); }}
                  className={
                    "rounded-lg border-2 px-2 py-1.5 text-[13px] font-bold transition " +
                    (i === gi ? "border-sky-400/70 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  <Katex expr={v.tex} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <CompPlane gf={c.gfEval} fg={c.fgEval} x={cx} same={c.same} />
          <div className="space-y-2">
            <div className="space-y-1.5">
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-pink-400/10 px-3 py-2 text-center text-[14px] leading-8 text-pink-100">
                <Katex expr={`(g \\circ f)(x) = ${c.gfTex}`} />
              </p>
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-sky-400/10 px-3 py-2 text-center text-[14px] leading-8 text-sky-100">
                <Katex expr={`(f \\circ g)(x) = ${c.fgTex}`} />
              </p>
            </div>
            <Slider label={<Katex expr="x" />} value={cx} min={-5} max={5} step={0.5} onChange={setCx} accent="accent-violet-400" />
            <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-white/10 bg-black/25 py-1">
              <table className="w-full min-w-[220px] text-center font-mono text-[12px]">
                <tbody>
                  <tr>
                    <td className="px-2 py-1 font-bold text-pink-300">(g∘f)({cx})</td>
                    <td className="px-2 py-1 text-slate-100">{Math.round(c.gfEval(cx) * 1000) / 1000}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="px-2 py-1 font-bold text-sky-300">(f∘g)({cx})</td>
                    <td className="px-2 py-1 text-slate-100">{Math.round(c.fgEval(cx) * 1000) / 1000}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className={"rounded-lg px-3 py-2 text-center text-[13px] font-extrabold " + (c.same ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-400/15 text-rose-100")}>
              {c.same ? "두 합성이 같아요 (그래프가 포개집니다)" : "두 합성이 달라요"}
            </p>
            <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">🔍 {c.note}</p>
            <GoalList goals={COMM_GOALS} seen={seen} />
          </div>
        </div>
      </div>

      {/* 결합법칙 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🔁 묶는 방법을 바꾸면 달라질까?</p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          왼쪽 원소를 눌러 <b className="text-amber-200">먼저 g∘f 로 묶은 길</b>과 <b className="text-pink-200">먼저 h∘g 로 묶은 길</b>을 견주어 보세요. 도착하는 곳이 같습니다.
        </p>

        <div className="mt-2">
          <ChainDia
            cols={[A.xs, A.ys, A.zs, A.ws]}
            names={["X", "Y", "Z", "W"]}
            maps={["f", "g", "h"]}
            links={[A.f, A.g, A.h]}
            lit={path1}
            litColor="#fbbf24"
            lit2={path2}
            lit2Color="#f472b6"
            dots={[
              [0, ai],
              [1, A.f[ai]],
              [2, aGf],
              [3, aEnd],
            ]}
            onPickX={setAi}
            selX={ai}
          />
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-amber-400/35 bg-amber-400/8 px-3 py-2.5">
            <p className="text-[11px] font-bold text-amber-200">먼저 g∘f 로 묶기</p>
            <p className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-[13px] leading-8 text-slate-100">
              <Katex expr={`(h \\circ (g \\circ f))(${A.xs[ai]}) = h(${A.zs[aGf]}) = ${A.ws[aEnd]}`} />
            </p>
          </div>
          <div className="rounded-xl border-2 border-pink-400/35 bg-pink-400/8 px-3 py-2.5">
            <p className="text-[11px] font-bold text-pink-200">먼저 h∘g 로 묶기</p>
            <p className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-[13px] leading-8 text-slate-100">
              <Katex expr={`((h \\circ g) \\circ f)(${A.xs[ai]}) = (h \\circ g)(${A.ys[A.f[ai]]}) = ${A.ws[aEnd]}`} />
            </p>
          </div>
        </div>
        <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-center text-[13px] font-bold text-emerald-100">
          두 길 모두 <span className="font-mono">{A.ws[aEnd]}</span> 에 닿습니다
        </p>

        <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
          <p className="text-[11px] font-bold text-slate-400">식으로도 확인해 보기</p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] text-slate-200">
            <Katex expr={ASSOC_FN.fTex} />
            <Katex expr={ASSOC_FN.gTex} />
            <Katex expr={ASSOC_FN.hTex} />
          </p>
          <div className="mt-1.5">
            <Slider label={<Katex expr="x" />} value={ax} min={-5} max={5} step={1} onChange={setAx} accent="accent-emerald-400" />
          </div>
          <div className="mt-1 overflow-x-auto overflow-y-hidden rounded-lg bg-white/5 py-1">
            <table className="w-full min-w-[260px] text-center font-mono text-[12px]">
              <tbody>
                <tr>
                  <td className="px-2 py-1 font-bold text-amber-300">h((g∘f)(x))</td>
                  <td className="px-2 py-1 text-slate-100">{ASSOC_FN.h(ASSOC_FN.g(ASSOC_FN.f(ax)))}</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-2 py-1 font-bold text-pink-300">(h∘g)(f(x))</td>
                  <td className="px-2 py-1 text-slate-100">{ASSOC_FN.h(ASSOC_FN.g(ASSOC_FN.f(ax)))}</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="px-2 py-1 font-bold text-emerald-300">두 식 모두</td>
                  <td className="px-2 py-1 text-emerald-200">
                    <Katex expr={ASSOC_FN.bothTex} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 수의 곱과 견주기 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✖️ 수의 곱과 견주어 보기</p>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300">
            {lawDone} / {law.length}
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          함수의 합성을 <b className="text-sky-200">수의 곱</b>으로, 항등함수 <Katex expr="I" /> 를 <b className="text-sky-200">1</b> 로, 영함수 <Katex expr="O" /> 를 <b className="text-sky-200">0</b> 으로 생각해 보세요. 왼쪽은 모두 성립하는데 오른쪽은 어떨까요?
        </p>
        <div className="mt-2 grid gap-1.5 text-center text-[11px] font-bold sm:grid-cols-2">
          <p className="rounded-lg bg-sky-400/10 py-1 text-sky-200">수의 곱</p>
          <p className="rounded-lg bg-violet-400/10 py-1 text-violet-200">함수의 합성</p>
        </div>
        <div className="mt-1.5 space-y-1.5">
          {law.map((r) => (
            <LawRowCard
              key={r.id}
              id={r.id}
              name={r.name}
              numTex={r.numTex}
              fnTex={r.fnTex}
              holds={r.holds}
              why={r.why}
              pick={lawPick[r.id]}
              onPick={(v) => setLawPick((m) => ({ ...m, [r.id]: v }))}
            />
          ))}
        </div>

        <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
          <p className="text-[11px] font-bold text-slate-400">직접 확인해 보기</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {ZERO_FS.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setZi(i)}
                className={
                  "rounded-lg border-2 px-2.5 py-1.5 text-[13px] font-bold transition " +
                  (i === zi ? "border-violet-400/70 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                <Katex expr={v.tex} />
              </button>
            ))}
          </div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-emerald-400/10 px-3 py-2 text-center text-[13px] leading-8 text-emerald-100">
              <Katex expr={`(f \\circ I)(x) = (I \\circ f)(x) = f(x)`} />
            </p>
            <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-emerald-400/10 px-3 py-2 text-center text-[13px] leading-8 text-emerald-100">
              <Katex expr={`(O \\circ f)(x) = 0`} />
            </p>
            <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-rose-400/10 px-3 py-2 text-center text-[13px] leading-8 text-rose-100 sm:col-span-2">
              <Katex expr={`(f \\circ O)(x) = f(0) = ${z0}`} />
            </p>
          </div>
          <p className="mt-1.5 rounded-lg bg-white/5 px-3 py-2 text-[12px] leading-6 text-slate-300">
            ⚠️ <Katex expr={`f \\circ O`} /> 는 값이 늘 <span className="font-mono text-white">{z0}</span> 인 상수함수예요. <span className="font-mono text-white">{z0}</span> 가 0 이 아니니 영함수가 아닙니다. 수에서 <Katex expr="a \times 0 = 0" /> 이던 것이 여기서 갈라집니다.
          </p>
        </div>
      </div>

      {lawDone === law.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 다섯 성질을 모두 가려냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            함수의 합성은 수의 곱과 꽤 닮았지만 <b className="text-white">교환법칙</b>과 <b className="text-white">f ∘ O</b> 두 군데에서 갈라집니다. 닮은 점만 믿고 순서를 바꾸면 틀리게 되는 까닭이에요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 쿠폰 쓰는 순서
// ══════════════════════════════════════════════════════════════
/**
 * 막대 그림의 자리.
 *  · 금액은 오른쪽 끝에 맞춰 쓰므로 막대가 아무리 길어도 글자가 상자를 넘지 않는다.
 *  · 막대는 valX 앞의 valW 만큼을 비워 두고 끝나므로 금액 글자와 겹치지 않는다.
 *  · 아래 문구는 마지막 줄이 끝난 뒤 충분히 내려 그린다.
 */
const BAR = { w: 320, h: 136, pad: 10, rowH: 30, barX: 66, barH: 16, valX: 314, valW: 46, lineY: 104, noteY: 122 };
const BAR_MAX = BAR.valX - BAR.valW - BAR.barX;

function PriceBars({ x, c }: { x: number; c: Coupon }) {
  const a = amountFirst(x, c);
  const r = rateFirst(x, c);
  const max = Math.max(x, a, r);
  const bw = (v: number) => Math.max(2, (BAR_MAX * v) / max);
  const rows: { name: string; v: number; color: string }[] = [
    { name: "원래 값", v: x, color: "rgba(226,232,240,0.35)" },
    { name: "정액 먼저", v: a, color: "#fbbf24" },
    { name: "정률 먼저", v: r, color: "#34d399" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${BAR.w} ${BAR.h}`} className="mx-auto block w-full max-w-[330px]" role="img" aria-label="두 순서로 계산한 금액 비교 막대">
        {rows.map((row, i) => {
          const y = BAR.pad + i * BAR.rowH;
          return (
            <g key={row.name}>
              <text x={BAR.pad} y={y + 15} className="fill-slate-400 text-[10px] font-bold">
                {row.name}
              </text>
              <rect x={BAR.barX} y={y + 3} width={bw(row.v)} height={BAR.barH} rx={4} fill={row.color} />
              <text x={BAR.valX} y={y + 15} textAnchor="end" className="fill-slate-200 font-mono text-[10px] font-bold">
                {won(row.v)}
              </text>
            </g>
          );
        })}
        <line x1={BAR.barX} y1={BAR.lineY} x2={BAR.valX} y2={BAR.lineY} stroke="rgba(226,232,240,0.15)" strokeWidth={1} />
        <text x={BAR.w / 2} y={BAR.noteY} textAnchor="middle" className="fill-emerald-300 text-[11px] font-bold">
          정률을 먼저 쓰면 {won(gapOf(c))}원 더 싸다
        </text>
      </svg>
    </div>
  );
}

function CouponCard({ q, pick, onPick }: { q: CouponTask; pick: number | undefined; onPick: (i: number) => void }) {
  const items = q.choices;
  const right = pick === q.answer;
  return (
    <div className="space-y-2">
      <p className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] leading-7 text-slate-100">{q.story}</p>
      <div className={"grid gap-1.5 " + (items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {items.map((s, i) => {
          const good = pick === i && i === q.answer;
          const badPick = pick === i && i !== q.answer;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onPick(i)}
              disabled={right}
              className={
                "rounded-xl border-2 px-2.5 py-2 text-left text-[13px] font-bold transition disabled:cursor-default " +
                (good
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : badPick
                    ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              <span className="mr-1 text-slate-400">{ABC[i] ?? i + 1}</span>
              {s}
            </button>
          );
        })}
      </div>
      {pick !== undefined ? (
        right ? (
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {q.why}</p>
        ) : (
          <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {q.choiceWhy[pick]}</p>
        )
      ) : null}
    </div>
  );
}

function CouponTab() {
  const [ci, setCi] = useState(0);
  const [price, setPrice] = useState(PRICE.init);
  const [seen, setSeen] = useState<string[]>([]);

  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const c = COUPONS[ci];
  const a = amountFirst(price, c);
  const r = rateFirst(price, c);
  const gap = gapOf(c);
  const rate = c.rate / 100;

  const q = COUPON_TASKS[qi];
  const doneIds = COUPON_TASKS.filter((t) => pick[t.id] === t.answer).map((t) => t.id);
  const cleared = pick[q.id] === q.answer;

  const movePrice = (v: number) => {
    setPrice(v);
    setSeen((s) => [...new Set([...s, "0", "1"])]);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🎟️ 쿠폰 두 장, 어느 것을 먼저 쓸까?</p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          정액 할인은 <Katex expr="f(x)=x-a" />, 정률 할인은 <Katex expr="g(x)=(1-p)x" /> 예요. 두 순서는 곧 <Katex expr="g \circ f" /> 와 <Katex expr="f \circ g" /> 입니다.
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {COUPONS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => { setCi(i); setSeen((s) => [...new Set([...s, "2"])]); }}
              className={
                "rounded-lg border-2 px-2.5 py-1.5 text-[12px] font-bold transition " +
                (i === ci ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {v.label} · {won(v.amount)}원 + {v.rate}%
            </button>
          ))}
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="space-y-2">
            <PriceBars x={price} c={c} />
            <Slider label="물건값" value={price} min={PRICE.min} max={PRICE.max} step={PRICE.step} onChange={movePrice} accent="accent-emerald-400" show={`${won(price)}원`} />
          </div>

          <div className="space-y-2">
            <div className="space-y-1.5">
              <div className="rounded-xl border-2 border-amber-400/35 bg-amber-400/8 px-3 py-2">
                <p className="text-[11px] font-bold text-amber-200">정액 먼저 — 쿠폰을 빼고 나서 할인율 적용</p>
                <p className="mt-0.5 overflow-x-auto overflow-y-hidden py-1 text-[13px] leading-8 text-slate-100">
                  <Katex expr={`(g \\circ f)(x) = ${1 - rate}(x - ${c.amount})`} />
                </p>
                <p className="mt-0.5 font-mono text-[14px] font-bold text-amber-100">{won(a)}원</p>
              </div>
              <div className="rounded-xl border-2 border-emerald-400/35 bg-emerald-400/8 px-3 py-2">
                <p className="text-[11px] font-bold text-emerald-200">정률 먼저 — 할인율 적용하고 나서 쿠폰을 뺌</p>
                <p className="mt-0.5 overflow-x-auto overflow-y-hidden py-1 text-[13px] leading-8 text-slate-100">
                  <Katex expr={`(f \\circ g)(x) = ${1 - rate}x - ${c.amount}`} />
                </p>
                <p className="mt-0.5 font-mono text-[14px] font-bold text-emerald-100">{won(r)}원</p>
              </div>
            </div>
            <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[13px] font-extrabold text-slate-100">
              차이 <span className="text-emerald-300">{won(gap)}원</span>
              <span className="ml-2 text-[11px] font-bold text-slate-400">
                = {won(c.amount)} × {c.rate}%
              </span>
            </p>
            <GoalList goals={COUPON_GOALS} seen={seen} />
            <p className="rounded-lg bg-violet-400/10 px-3 py-2 text-[12px] leading-6 text-violet-100">
              🔍 물건값을 아무리 바꾸어도 차이는 그대로예요. 두 식을 빼 보면 <Katex expr="x" /> 가 사라지고 <Katex expr="a \times p" /> 만 남기 때문입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧾 어느 쪽이 이득일까?</p>
          <Chips ids={COUPON_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <CouponCard q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < COUPON_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === COUPON_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            정률끼리는 곱셈이라, 정액끼리는 뺄셈이라 순서가 상관없어요. <b className="text-white">섞일 때만</b> 순서가 문제가 되고, 그때는 늘 <b className="text-white">정률을 먼저</b> 쓰는 쪽이 (할인권 액수) × (할인율) 만큼 쌉니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 일상 속 합성
// ══════════════════════════════════════════════════════════════
function ChainBoxes({ c, reveal }: { c: LifeCase; reveal: boolean }) {
  const cells = [c.input, reveal ? c.mid : "?", reveal ? c.out : "?"];
  const tones = ["border-slate-400/40 bg-white/5 text-slate-100", "border-amber-400/50 bg-amber-400/12 text-amber-100", "border-emerald-400/50 bg-emerald-400/12 text-emerald-100"];
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {cells.map((v, i) => (
          <div key={c.boxes[i]} className="flex items-center gap-1.5">
            {i > 0 ? (
              <div className="flex flex-col items-center px-0.5">
                <span className="font-mono text-[11px] font-bold italic text-slate-400">{i === 1 ? "f" : "g"}</span>
                <span className="text-[15px] leading-4 text-slate-500">→</span>
              </div>
            ) : null}
            <div className={"min-w-[84px] rounded-xl border-2 px-2.5 py-2 text-center " + tones[i]}>
              <p className="text-[10px] font-bold opacity-70">{c.boxes[i]}</p>
              <p className="mt-0.5 font-mono text-[14px] font-bold">{v}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 grid gap-1 text-[11px] leading-6 text-slate-400 sm:grid-cols-2">
        <p>
          <span className="font-mono font-bold italic text-slate-300">f</span> · {c.fName}
        </p>
        <p>
          <span className="font-mono font-bold italic text-slate-300">g</span> · {c.gName}
        </p>
      </div>
    </div>
  );
}

function LifeCard({ c, pick, swapPick, onPick, onSwap }: { c: LifeCase; pick: number | undefined; swapPick: number | undefined; onPick: (i: number) => void; onSwap: (i: number) => void }) {
  const right = pick === c.answer;
  const swapRight = swapPick === c.swap;

  return (
    <div className="space-y-2">
      <p className="text-[13px] font-bold leading-7 text-slate-100">
        <span className="mr-1.5 text-lg">{c.icon}</span>
        {c.title}
      </p>

      {c.id === "L1" ? (
        <ChainDia
          cols={[L1_DIA.xs, L1_DIA.ys, L1_DIA.zs]}
          names={["학생", "반", "색"]}
          maps={["f", "g"]}
          links={[L1_DIA.f, L1_DIA.g]}
          dots={right ? [[0, 1], [1, L1_DIA.f[1]], [2, L1_DIA.g[L1_DIA.f[1]]]] : [[0, 1]]}
          composite={right ? { from: 0, to: 2, label: "g∘f", color: "#34d399" } : null}
          fontPx={12}
        />
      ) : (
        <ChainBoxes c={c} reveal={right} />
      )}

      <p className="text-center text-[13px] font-bold text-slate-100">
        <Katex expr="g \circ f" /> 로 <span className="font-mono text-cyan-200">{c.input}</span> 을(를) 보내면?
      </p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {c.choices.map((s, i) => {
          const good = pick === i && i === c.answer;
          const badPick = pick === i && i !== c.answer;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onPick(i)}
              disabled={right}
              className={
                "rounded-xl border-2 px-2.5 py-2 text-left text-[13px] font-bold transition disabled:cursor-default " +
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
      {pick !== undefined ? (
        right ? (
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {c.why}</p>
        ) : (
          <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {c.choiceWhy[pick]}</p>
        )
      ) : null}

      <div className={"rounded-xl border-2 p-3 transition " + (right ? "border-white/10 bg-slate-900/40" : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
        <p className="text-[13px] font-bold text-slate-100">
          그럼 <Katex expr="f \circ g" /> 로 순서를 바꾸면 어떻게 될까요?
        </p>
        {!right ? <p className="mt-1 text-[11px] text-slate-500">앞 문제를 맞히면 열려요.</p> : null}
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-3">
          {SWAP_CHOICES.map((s, i) => {
            const good = swapPick === i && i === c.swap;
            const badPick = swapPick === i && i !== c.swap;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onSwap(i)}
                disabled={swapRight}
                className={
                  "rounded-xl border-2 px-2 py-2 text-[12px] font-bold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : badPick
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                {s}
              </button>
            );
          })}
        </div>
        {swapRight ? <p className="mt-1.5 rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {c.swapWhy}</p> : null}
        {swapPick !== undefined && !swapRight ? (
          <p className="mt-1.5 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
            ❌ 다시 생각해 보세요. <b>g 가 내놓는 것을 f 에 넣을 수 있는지</b>부터 따지고, 넣을 수 있다면 값을 실제로 셈해 견주면 됩니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LifeTab() {
  const [ci, setCi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});
  const [swapPick, setSwapPick] = useState<Record<string, number>>({});

  const c = LIFE_CASES[ci];
  const done = LIFE_CASES.filter((q) => pick[q.id] === q.answer && swapPick[q.id] === q.swap).map((q) => q.id);
  const cleared = pick[c.id] === c.answer && swapPick[c.id] === c.swap;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🏭 일상생활에서 두 번 거쳐 가는 일 찾기</p>
          <Chips ids={LIFE_CASES.map((q) => q.id)} cur={ci} done={done} onPick={setCi} />
        </div>
        <div className="mt-2">
          <LifeCard
            c={c}
            pick={pick[c.id]}
            swapPick={swapPick[c.id]}
            onPick={(i) => setPick((m) => ({ ...m, [c.id]: i }))}
            onSwap={(i) => setSwapPick((m) => ({ ...m, [c.id]: i }))}
          />
        </div>
        {cleared && ci < LIFE_CASES.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setCi((k) => k + 1)} label="다음 사례 ▶" />
          </div>
        ) : null}
      </div>

      {done.length === LIFE_CASES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여덟 사례를 모두 살폈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            순서를 바꾸었을 때는 <b className="text-white">셋 중 하나</b>가 일어납니다. 값이 같거나, 값이 달라지거나, 아예 넣을 수 없어 합성 자체가 안 되거나. 마지막 경우가 바로 <b className="text-white">치역과 정의역이 맞지 않는</b> 때예요.
          </p>
        </div>
      ) : null}
    </div>
  );
}
