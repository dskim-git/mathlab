"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  LABOR_CASES,
  PLANTS,
  PLANT_QMAX,
  PROBLEMS,
  SHOPS,
  SORT_CAUTION,
  SORT_ITEMS,
  bestPlant,
  costTex,
  fmt,
  laborOf,
  laborTex,
  prodTex,
  varCoef,
  type CostItem,
  type LaborCase,
  type PStep,
  type Shop,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "fixed_vs_var",
    prompt:
      "고정 비용과 가변 비용을 가르는 기준은 ‘생산량이 늘 때 함께 늘어나는가’였어요. 내가 아는 가게나 공장을 하나 떠올려, 그곳의 고정 비용과 가변 비용을 두 가지씩 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 동네 분식집 — 고정 비용은 가게 월세와 냉장고 할부금, 가변 비용은 떡·어묵 재료비와 배달 수수료.",
  },
  {
    id: "avg_cost",
    prompt:
      "같은 가게인데도 많이 만들수록 1개당 비용이 낮아졌어요. 고정 비용과 가변 비용 중 무엇 때문에 이런 일이 생기는지, 그 까닭을 자기 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 고정 비용은 총액이 정해져 있어서 많이 만들수록 한 개가 나눠 지는 몫이 작아진다. 가변 비용은 한 개당 값이 그대로라 변하지 않는다.",
  },
  {
    id: "modeling",
    prompt:
      "생산함수 → 노동함수 → 비용함수로 이어지는 길을 직접 만들어 봤어요. 생산함수가 Q = aL 일 때와 Q = a√L 일 때 비용함수의 모양이 어떻게 달라졌는지, 그것이 회사에 어떤 뜻인지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: Q = aL 이면 비용이 직선으로 늘지만 Q = a√L 이면 이차함수라 많이 만들수록 비용이 훨씬 가파르게 오른다. 그래서 무작정 생산량을 늘리기 어렵다.",
  },
];

type Tab = "shop" | "split" | "labor" | "problem";

export default function CostFunctionLab() {
  const [tab, setTab] = useState<Tab>("shop");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🧾 비용함수</h3>
        <p className="mt-2 leading-7 text-slate-300">
          가게를 열면 손님이 없어도 나가는 돈이 있고, 하나 더 만들 때마다 새로 드는 돈이 있어요. 앞의 것이{" "}
          <b className="text-amber-200">고정 비용</b>, 뒤의 것이 <b className="text-emerald-200">가변 비용</b>입니다.
          생산량 Q에 따라 총비용이 얼마가 되는지 알려 주는 <b className="text-sky-200">비용함수 C = f(Q)</b>를 직접
          만들어 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "shop"} onClick={() => setTab("shop")}>① 우리 가게 비용 시뮬레이터</TabButton>
        <TabButton active={tab === "split"} onClick={() => setTab("split")}>② 비용의 두 얼굴</TabButton>
        <TabButton active={tab === "labor"} onClick={() => setTab("labor")}>③ 노동함수로 비용함수 만들기</TabButton>
        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>④ 단계별 문제</TabButton>
      </div>

      <div className="mt-4">
        {tab === "shop" ? <ShopTab /> : null}
        {tab === "split" ? <SplitTab /> : null}
        {tab === "labor" ? <LaborTab /> : null}
        {tab === "problem" ? <ProblemTab /> : null}
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

/** 수식 한 줄 — 자기 행을 갖고 가로로만 넘칠 수 있게 */
function FormulaLine({ expr, className }: { expr: string; className?: string }) {
  return (
    <div className={"overflow-x-auto overflow-y-hidden py-1 " + (className ?? "")}>
      <Katex expr={expr} display />
    </div>
  );
}

// ─── 공용 포맷 ────────────────────────────────────────────────
function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}
function man(v: number, d = 0): string {
  return (v / 10000).toLocaleString("ko-KR", { maximumFractionDigits: d }) + "만원";
}
function cnt(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}
/** 눈금용 — 단위 글자는 축 이름에 두고 수만 짧게 */
function manTick(v: number): string {
  const x = v / 10000;
  return x.toLocaleString("ko-KR", { maximumFractionDigits: x < 10 ? 1 : 0 });
}

const TONE_ON: Record<string, string> = {
  emerald: "border-emerald-400/60 bg-emerald-400/15",
  sky: "border-sky-400/60 bg-sky-400/15",
  amber: "border-amber-400/60 bg-amber-400/15",
  violet: "border-violet-400/60 bg-violet-400/15",
};
const TONE_TEXT: Record<string, string> = {
  emerald: "text-emerald-200",
  sky: "text-sky-200",
  amber: "text-amber-200",
  violet: "text-violet-200",
};
const TONE_ACCENT: Record<string, string> = {
  emerald: "accent-emerald-400",
  sky: "accent-sky-400",
  amber: "accent-amber-400",
  violet: "accent-violet-400",
};

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  tone,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  tone: "emerald" | "sky" | "amber" | "violet";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold text-slate-300">{label}</p>
        <p className={"font-mono text-sm font-bold " + TONE_TEXT[tone]}>{display}</p>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-1 w-full " + TONE_ACCENT[tone]}
      />
    </div>
  );
}

function Big({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  const cls: Record<string, string> = {
    amber: "border-amber-400/40 bg-amber-400/[0.08] text-amber-100",
    emerald: "border-emerald-400/40 bg-emerald-400/[0.08] text-emerald-100",
    sky: "border-sky-400/40 bg-sky-400/[0.08] text-sky-100",
    violet: "border-violet-400/40 bg-violet-400/[0.08] text-violet-100",
  };
  return (
    <div className={"rounded-xl border-2 px-3 py-2.5 text-center " + cls[tone]}>
      <p className="text-[11px] font-bold opacity-80">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-bold">{value}</p>
      {sub ? <p className="text-[10px] opacity-70">{sub}</p> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 우리 가게 비용 시뮬레이터
// ══════════════════════════════════════════════════════════════
const CW = 380,
  CH = 250,
  PL = 54,
  PR = 16,
  PT = 32,
  PB = 32;

function ShopTab() {
  const [sid, setSid] = useState(SHOPS[0].id);
  const [edit, setEdit] = useState<Record<string, number>>({});
  const [q, setQ] = useState(SHOPS[0].qDefault);
  const [mode, setMode] = useState<"total" | "avg">("total");

  const shop: Shop = SHOPS.find((s) => s.id === sid) ?? SHOPS[0];
  const key = (it: CostItem) => `${shop.id}.${it.id}`;
  const valOf = (it: CostItem) => edit[key(it)] ?? it.value;
  const F = shop.fixed.reduce((s, it) => s + valOf(it), 0);
  const v = shop.variable.reduce((s, it) => s + valOf(it), 0);
  const VC = v * q;
  const C = F + VC;
  const AC = q > 0 ? C / q : 0;

  function pick(next: Shop) {
    setSid(next.id);
    setQ(next.qDefault);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {SHOPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => pick(s)}
            className={
              "rounded-xl border-2 p-3 text-left transition " +
              (sid === s.id ? TONE_ON[s.tone] : "border-white/10 bg-white/5 hover:bg-white/10")
            }
          >
            <p className="text-sm font-bold text-slate-100">
              {s.emoji} {s.name}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-slate-400">{s.hook}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <SwitchBtn on={mode === "total"} onClick={() => setMode("total")}>
              📈 총비용 C
            </SwitchBtn>
            <SwitchBtn on={mode === "avg"} onClick={() => setMode("avg")}>
              🏷️ 1{shop.unit}당 비용
            </SwitchBtn>
          </div>
          {mode === "total" ? (
            <TotalChart F={F} v={v} q={q} qMax={shop.qMax} unit={shop.unit} />
          ) : (
            <AvgChart F={F} v={v} q={q} qMax={shop.qMax} unit={shop.unit} />
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Big label="고정 비용" value={man(F)} tone="amber" />
            <Big label="가변 비용" value={man(VC)} sub={`${won(v)} × ${cnt(q)}${shop.unit}`} tone="emerald" />
            <Big label="총비용 C" value={man(C)} tone="sky" />
            <Big label={`1${shop.unit}당`} value={q > 0 ? won(AC) : "—"} tone="violet" />
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
            <FormulaLine
              expr={`C = ${Math.round(F)} + ${Math.round(v)} \\times ${Math.round(q)} = ${Math.round(C)}`}
              className="text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-bold text-amber-200">🔒 고정 비용 — 한 달에 꼭 나가는 돈</p>
              <p className="font-mono text-sm font-bold text-amber-100">{man(F)}</p>
            </div>
            <div className="mt-2 space-y-1.5">
              {shop.fixed.map((it) => (
                <ItemRow key={it.id} item={it} value={valOf(it)} tone="amber" onChange={(nv) => setEdit((p) => ({ ...p, [key(it)]: nv }))} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-bold text-emerald-200">🔁 가변 비용 — 1{shop.unit} 더 만들 때 드는 돈</p>
              <p className="font-mono text-sm font-bold text-emerald-100">{won(v)}</p>
            </div>
            <div className="mt-2 space-y-1.5">
              {shop.variable.map((it) => (
                <ItemRow key={it.id} item={it} value={valOf(it)} tone="emerald" onChange={(nv) => setEdit((p) => ({ ...p, [key(it)]: nv }))} />
              ))}
            </div>
          </div>

          <Slider
            label={`생산량 Q (${shop.unit})`}
            value={q}
            display={`${cnt(q)}${shop.unit}`}
            min={0}
            max={shop.qMax}
            step={shop.qStep}
            onChange={setQ}
            tone="sky"
          />

          <button
            type="button"
            onClick={() => {
              setEdit({});
              setQ(shop.qDefault);
            }}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 처음 값으로 되돌리기
          </button>
        </div>
      </div>

      <p className="text-[11px] leading-5 text-slate-500">
        금액은 비용의 구조를 이해하기 위해 꾸민 예시예요. 실제 가게의 장부와는 다릅니다.
      </p>
    </div>
  );
}

function SwitchBtn({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " +
        (on ? "border-sky-400/60 bg-sky-400/15 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

function ItemRow({
  item,
  value,
  tone,
  onChange,
}: {
  item: CostItem;
  value: number;
  tone: "amber" | "emerald";
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] text-slate-300">
          {item.emoji} {item.label}
        </p>
        <p className={"font-mono text-[11px] font-bold " + TONE_TEXT[tone]}>{won(value)}</p>
      </div>
      <input
        type="range"
        aria-label={item.label}
        min={item.min}
        max={item.max}
        step={item.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"w-full " + TONE_ACCENT[tone]}
      />
    </div>
  );
}

function ChartFrame({
  yMax,
  xMax,
  xLabel,
  yLabel,
  children,
  yFmt,
}: {
  yMax: number;
  xMax: number;
  xLabel: string;
  yLabel: string;
  yFmt: (v: number) => string;
  children: React.ReactNode;
}) {
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => r * yMax);
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => r * xMax);
  const Y = (val: number) => CH - PB - (yMax <= 0 ? 0 : val / yMax) * (CH - PT - PB);
  const X = (val: number) => PL + (xMax <= 0 ? 0 : val / xMax) * (CW - PL - PR);
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <div className="overflow-x-auto overflow-y-hidden">
        <svg viewBox={`0 0 ${CW} ${CH}`} className="h-auto w-full min-w-[320px]" role="img" aria-label={`${xLabel}에 따른 ${yLabel} 그래프`}>
          <rect x={0} y={0} width={CW} height={CH} rx={10} fill="#0b1220" />
          {yTicks.map((t, i) => (
            <g key={`y${i}`}>
              <line x1={PL} y1={Y(t)} x2={CW - PR} y2={Y(t)} stroke="rgba(148,163,184,0.15)" strokeWidth={0.8} />
              <text x={PL - 6} y={Y(t)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                {yFmt(t)}
              </text>
            </g>
          ))}
          {xTicks.map((t, i) => (
            <g key={`x${i}`}>
              <line x1={X(t)} y1={PT} x2={X(t)} y2={CH - PB} stroke="rgba(148,163,184,0.12)" strokeWidth={0.8} />
              <text x={X(t)} y={CH - PB + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                {fmt(t, 1)}
              </text>
            </g>
          ))}
          {children}
          <line x1={PL} y1={CH - PB} x2={CW - PR} y2={CH - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <line x1={PL} y1={PT} x2={PL} y2={CH - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <text x={CW - PR} y={CH - PB + 25} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            {xLabel}
          </text>
          {/* 세로축 이름은 왼쪽 위 모서리에서 오른쪽으로 적는다 (왼쪽 밖으로 잘리지 않게) */}
          <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            {yLabel}
          </text>
        </svg>
      </div>
    </div>
  );
}

function TotalChart({ F, v, q, qMax, unit }: { F: number; v: number; q: number; qMax: number; unit: string }) {
  const yMax = Math.max(F + v * qMax, 1);
  const Y = (val: number) => CH - PB - (val / yMax) * (CH - PT - PB);
  const X = (val: number) => PL + (val / qMax) * (CW - PL - PR);
  const cx = X(q);
  const cy = Y(F + v * q);
  return (
    <ChartFrame yMax={yMax} xMax={qMax} xLabel={`Q (${unit})`} yLabel="총비용 C (만원)" yFmt={manTick}>
      {/* 고정 비용 띠 */}
      <rect x={PL} y={Y(F)} width={CW - PL - PR} height={Math.max(0, CH - PB - Y(F))} fill="#fbbf24" fillOpacity={0.16} />
      {/* 가변 비용 영역 */}
      <polygon points={`${PL},${Y(F)} ${X(qMax)},${Y(F)} ${X(qMax)},${Y(F + v * qMax)}`} fill="#34d399" fillOpacity={0.18} />
      <line x1={PL} y1={Y(F)} x2={CW - PR} y2={Y(F)} stroke="#fbbf24" strokeWidth={1.4} strokeDasharray="5 3" />
      <line x1={PL} y1={Y(F)} x2={X(qMax)} y2={Y(F + v * qMax)} stroke="#38bdf8" strokeWidth={2.8} strokeLinecap="round" />
      {F > 0 ? (
        <text x={PL + 8} y={(Y(F) + (CH - PB)) / 2} dy={3} fill="#fcd34d" fontSize={10} fontWeight={700}>
          고정 비용
        </text>
      ) : null}
      {v > 0 ? (
        <text x={X(qMax) - 8} y={Math.max(PT + 12, Y(F) - 10)} textAnchor="end" fill="#6ee7b7" fontSize={10} fontWeight={700}>
          가변 비용
        </text>
      ) : null}
      <line x1={cx} y1={cy} x2={cx} y2={CH - PB} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.75} />
      <line x1={PL} y1={cy} x2={cx} y2={cy} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.75} />
      <circle cx={cx} cy={cy} r={5.5} fill="#fff" />
      <circle cx={cx} cy={cy} r={3.4} fill="#f43f5e" />
    </ChartFrame>
  );
}

function AvgChart({ F, v, q, qMax, unit }: { F: number; v: number; q: number; qMax: number; unit: string }) {
  const start = Math.max(qMax / 60, 1);
  const ac = (x: number) => F / x + v;
  const yMax = Math.max(ac(start), v * 1.2, 1);
  const Y = (val: number) => CH - PB - (Math.min(val, yMax) / yMax) * (CH - PT - PB);
  const X = (val: number) => PL + (val / qMax) * (CW - PL - PR);
  const pts = Array.from({ length: 121 }, (_, i) => {
    const x = start + (i / 120) * (qMax - start);
    return `${X(x)},${Y(ac(x))}`;
  }).join(" ");
  const showPt = q >= start;
  return (
    <ChartFrame yMax={yMax} xMax={qMax} xLabel={`Q (${unit})`} yLabel={`1${unit}당 비용 (원)`} yFmt={cnt}>
      <line x1={PL} y1={Y(v)} x2={CW - PR} y2={Y(v)} stroke="#34d399" strokeWidth={1.4} strokeDasharray="5 3" />
      <text x={CW - PR - 6} y={Math.min(CH - PB - 5, Math.max(PT + 12, Y(v) - 6))} textAnchor="end" fill="#6ee7b7" fontSize={10} fontWeight={700}>
        1{unit}당 가변 비용 {won(v)}
      </text>
      <polyline points={pts} fill="none" stroke="#a78bfa" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
      {showPt ? (
        <g>
          <line x1={X(q)} y1={Y(ac(q))} x2={X(q)} y2={CH - PB} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.75} />
          <line x1={PL} y1={Y(ac(q))} x2={X(q)} y2={Y(ac(q))} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.75} />
          <circle cx={X(q)} cy={Y(ac(q))} r={5.5} fill="#fff" />
          <circle cx={X(q)} cy={Y(ac(q))} r={3.4} fill="#f43f5e" />
        </g>
      ) : null}
    </ChartFrame>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 비용의 두 얼굴
// ══════════════════════════════════════════════════════════════
function SplitTab() {
  return (
    <div className="space-y-5">
      <SortGame />
      <EffectLab />
      <PlantLab />
    </div>
  );
}

// ─── ② -A 분류 게임 ───────────────────────────────────────────
function SortGame() {
  const [ans, setAns] = useState<Record<string, "fixed" | "variable">>({});
  const solved = SORT_ITEMS.filter((it) => ans[it.id] === it.kind).length;
  const tried = SORT_ITEMS.filter((it) => ans[it.id] !== undefined).length;
  const allDone = solved === SORT_ITEMS.length;

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-violet-200">🎯 고정 비용일까, 가변 비용일까?</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-300">
            맞힘 {solved} / {SORT_ITEMS.length}
          </span>
          <button
            type="button"
            onClick={() => setAns({})}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 다시
          </button>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${(solved / SORT_ITEMS.length) * 100}%` }} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {SORT_ITEMS.map((it) => {
          const picked = ans[it.id];
          const right = picked === it.kind;
          const wrong = picked !== undefined && !right;
          return (
            <div
              key={it.id}
              className={
                "rounded-xl border p-2.5 transition " +
                (right
                  ? "border-emerald-400/50 bg-emerald-400/[0.09]"
                  : wrong
                    ? "border-rose-400/50 bg-rose-400/[0.09]"
                    : "border-white/10 bg-white/5")
              }
            >
              <p className="text-xs font-bold leading-5 text-slate-100">
                {it.emoji} {it.label}
              </p>
              {right ? (
                <p className="mt-1 text-[11px] leading-5 text-emerald-100">
                  ✅ {it.kind === "fixed" ? "고정 비용" : "가변 비용"} — {it.why}
                </p>
              ) : (
                <div className="mt-1.5 flex gap-1.5">
                  <SortBtn
                    on={picked === "fixed"}
                    wrong={wrong && picked === "fixed"}
                    onClick={() => setAns((p) => ({ ...p, [it.id]: "fixed" }))}
                    tone="amber"
                  >
                    🔒 고정 비용
                  </SortBtn>
                  <SortBtn
                    on={picked === "variable"}
                    wrong={wrong && picked === "variable"}
                    onClick={() => setAns((p) => ({ ...p, [it.id]: "variable" }))}
                    tone="emerald"
                  >
                    🔁 가변 비용
                  </SortBtn>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tried > 0 && !allDone ? (
        <p className="mt-3 rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-2 text-xs leading-5 text-amber-100">
          💡 판단 기준은 하나예요 — <b>생산량이 늘 때 이 비용도 함께 늘어나나요?</b> 함께 늘면 가변 비용, 그대로면
          고정 비용이에요.
        </p>
      ) : null}
      {allDone ? (
        <p className="mt-3 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] px-3 py-2.5 text-center text-sm font-bold text-emerald-100">
          🎉 14개를 모두 분류했어요!
        </p>
      ) : null}
      <p className="mt-2 text-[11px] leading-5 text-slate-500">📎 {SORT_CAUTION}</p>
    </div>
  );
}

function SortBtn({
  on,
  wrong,
  onClick,
  tone,
  children,
}: {
  on: boolean;
  wrong: boolean;
  onClick: () => void;
  tone: "amber" | "emerald";
  children: React.ReactNode;
}) {
  const base: Record<string, string> = {
    amber: "border-amber-400/50 bg-amber-400/15 text-amber-100",
    emerald: "border-emerald-400/50 bg-emerald-400/15 text-emerald-100",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 rounded-lg border-2 px-2 py-1.5 text-[11px] font-bold transition " +
        (wrong ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : on ? base[tone] : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ─── ② -B 그래프에 어떤 영향을 줄까 ──────────────────────────
const BASE_F = 200;
const BASE_V = 2;
const EFF_QMAX = 100;

function EffectLab() {
  const [F, setF] = useState(BASE_F);
  const [v, setV] = useState(BASE_V);
  const yMax = Math.max(BASE_F + BASE_V * EFF_QMAX, F + v * EFF_QMAX, 1);
  const Y = (val: number) => CH - PB - (val / yMax) * (CH - PT - PB);
  const X = (val: number) => PL + (val / EFF_QMAX) * (CW - PL - PR);

  return (
    <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
      <p className="text-sm font-bold text-sky-200">🔬 무엇을 바꾸면 그래프가 어떻게 달라질까?</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        회색 선은 처음 그래프예요. 두 손잡이를 하나씩 움직이며 파란 선이 어떻게 달라지는지 살펴보세요.
      </p>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <ChartFrame yMax={yMax} xMax={EFF_QMAX} xLabel="Q (개)" yLabel="비용(만원)" yFmt={(t) => cnt(t)}>
          <line x1={X(0)} y1={Y(BASE_F)} x2={X(EFF_QMAX)} y2={Y(BASE_F + BASE_V * EFF_QMAX)} stroke="#64748b" strokeWidth={2} strokeDasharray="6 4" />
          <line x1={PL} y1={Y(F)} x2={CW - PR} y2={Y(F)} stroke="#fbbf24" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.8} />
          <line x1={X(0)} y1={Y(F)} x2={X(EFF_QMAX)} y2={Y(F + v * EFF_QMAX)} stroke="#38bdf8" strokeWidth={3} strokeLinecap="round" />
          <circle cx={X(0)} cy={Y(F)} r={5} fill="#fbbf24" />
          <text x={X(0) + 8} y={Math.min(CH - PB - 6, Math.max(PT + 12, Y(F) - 8))} fill="#fcd34d" fontSize={10} fontWeight={700}>
            y절편 = 고정 비용 {cnt(F)}만원
          </text>
          <text x={X(EFF_QMAX) - 6} y={Math.min(CH - PB - 6, Math.max(PT + 12, Y(F + v * EFF_QMAX) - 8))} textAnchor="end" fill="#7dd3fc" fontSize={10} fontWeight={700}>
            기울기 = {fmt(v)}만원
          </text>
        </ChartFrame>

        <div className="space-y-2">
          <Slider label="고정 비용 F" value={F} display={`${cnt(F)}만원`} min={0} max={500} step={25} onChange={setF} tone="amber" />
          <Slider label="1개당 가변 비용" value={v} display={`${fmt(v)}만원`} min={0} max={5} step={0.25} onChange={setV} tone="emerald" />
          <div className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
            <FormulaLine expr={`C = ${fmt(F)} + ${fmt(v)}Q`} className="text-slate-100" />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[11px] leading-5 text-slate-400">
            <p>
              <b className="text-amber-200">고정 비용</b>을 바꾸면 → 기울기는 그대로인 채 그래프가 <b>위아래로 평행이동</b>
            </p>
            <p className="mt-1">
              <b className="text-emerald-200">가변 비용</b>을 바꾸면 → y절편은 그대로인 채 <b>기울기</b>가 달라짐
            </p>
            <p className="mt-1">
              생산량이 0일 때의 비용은 언제나 <b className="text-amber-200">고정 비용</b>이에요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setF(BASE_F);
              setV(BASE_V);
            }}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 처음 그래프로
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        <MiniQuiz
          q="고정 비용만 2배로 늘리면 그래프는 어떻게 될까?"
          options={["위로 평행이동한다", "기울기가 2배가 된다", "그대로다"]}
          answer={0}
          why="고정 비용은 y절편이라 위아래로만 움직여요."
        />
        <MiniQuiz
          q="1개당 가변 비용만 2배로 늘리면?"
          options={["위로 평행이동한다", "기울기가 2배가 된다", "y절편이 2배가 된다"]}
          answer={1}
          why="1개당 가변 비용이 곧 직선의 기울기예요."
        />
        <MiniQuiz
          q="생산량이 0일 때 드는 비용은?"
          options={["0원", "고정 비용", "가변 비용"]}
          answer={1}
          why="아무것도 만들지 않아도 임대료·보험료 같은 고정 비용은 나가요."
        />
      </div>
    </div>
  );
}

function MiniQuiz({ q, options, answer, why }: { q: string; options: string[]; answer: number; why: string }) {
  const [pick, setPick] = useState<number | null>(null);
  const ok = pick === answer;
  return (
    <div
      className={
        "rounded-xl border p-3 transition " +
        (ok ? "border-emerald-400/50 bg-emerald-400/[0.09]" : "border-white/10 bg-white/5")
      }
    >
      <p className="text-xs font-bold leading-5 text-slate-100">❓ {q}</p>
      <div className="mt-1.5 flex flex-col gap-1">
        {options.map((o, i) => {
          const chosen = pick === i;
          return (
            <button
              key={o}
              type="button"
              disabled={ok}
              onClick={() => setPick(i)}
              className={
                "rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-bold transition disabled:opacity-90 " +
                (ok && i === answer
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : chosen && !ok
                    ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              {o}
            </button>
          );
        })}
      </div>
      {ok ? <p className="mt-1.5 text-[11px] leading-5 text-emerald-100">✅ {why}</p> : null}
      {pick !== null && !ok ? <p className="mt-1.5 text-[11px] leading-5 text-rose-200">다시 한 번 생각해 볼까요?</p> : null}
    </div>
  );
}

// ─── ② -C 단기와 장기 ────────────────────────────────────────
function PlantLab() {
  const [q, setQ] = useState(70);
  const best = bestPlant(q);
  const yMax = Math.max(...PLANTS.map((p) => p.F + p.v * PLANT_QMAX));
  const Y = (val: number) => CH - PB - (val / yMax) * (CH - PT - PB);
  const X = (val: number) => PL + (val / PLANT_QMAX) * (CW - PL - PR);
  const env = Array.from({ length: 121 }, (_, i) => {
    const x = (i / 120) * PLANT_QMAX;
    const y = Math.min(...PLANTS.map((p) => p.F + p.v * x));
    return `${X(x)},${Y(y)}`;
  }).join(" ");

  return (
    <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
      <p className="text-sm font-bold text-amber-200">⏳ 단기와 장기 — 설비를 바꿀 수 있다면?</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        <b className="text-slate-200">단기</b>에는 설비를 바꿀 수 없어서 고정 비용이 그대로예요. 하지만{" "}
        <b className="text-slate-200">장기</b>에는 설비까지 바꿀 수 있으니 고정 비용도 결국 내가 고르는 값, 즉 모든 요소가
        가변 비용이 됩니다. 생산량을 움직이며 어느 설비가 가장 싼지 찾아보세요.
      </p>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <ChartFrame yMax={yMax} xMax={PLANT_QMAX} xLabel="Q (개)" yLabel="비용(만원)" yFmt={(t) => cnt(t)}>
          <polyline points={env} fill="none" stroke="#f472b6" strokeWidth={5} strokeOpacity={0.35} strokeLinejoin="round" />
          {PLANTS.map((p) => (
            <line
              key={p.id}
              x1={X(0)}
              y1={Y(p.F)}
              x2={X(PLANT_QMAX)}
              y2={Y(p.F + p.v * PLANT_QMAX)}
              stroke={p.color}
              strokeWidth={p.id === best.id ? 3 : 1.6}
              strokeOpacity={p.id === best.id ? 1 : 0.55}
            />
          ))}
          {[50, 100].map((bp) => (
            <g key={bp}>
              <line x1={X(bp)} y1={PT} x2={X(bp)} y2={CH - PB} stroke="#f472b6" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
              <text x={X(bp)} y={PT + 10} textAnchor="middle" fill="#f9a8d4" fontSize={9} fontFamily="monospace">
                {bp}
              </text>
            </g>
          ))}
          <line x1={X(q)} y1={PT} x2={X(q)} y2={CH - PB} stroke="#f43f5e" strokeWidth={1.2} strokeDasharray="3 3" opacity={0.8} />
          <circle cx={X(q)} cy={Y(best.F + best.v * q)} r={5.5} fill="#fff" />
          <circle cx={X(q)} cy={Y(best.F + best.v * q)} r={3.4} fill="#f43f5e" />
          <text x={CW - PR - 6} y={PT + 12} textAnchor="end" fill="#f9a8d4" fontSize={10} fontWeight={700}>
            분홍 굵은 선 = 장기 비용
          </text>
        </ChartFrame>

        <div className="space-y-2">
          <Slider label="생산량 Q (개)" value={q} display={`${cnt(q)}개`} min={0} max={PLANT_QMAX} step={5} onChange={setQ} tone="violet" />
          <div className="space-y-1.5">
            {PLANTS.map((p) => {
              const c = p.F + p.v * q;
              const isBest = p.id === best.id;
              return (
                <div
                  key={p.id}
                  className={
                    "rounded-xl border px-3 py-2 transition " +
                    (isBest ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-white/10 bg-white/5")
                  }
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-bold text-slate-100">
                      {p.emoji} {p.name} {isBest ? <span className="text-emerald-300">← 가장 쌈</span> : null}
                    </p>
                    <p className="font-mono text-sm font-bold" style={{ color: p.color }}>
                      {cnt(c)}만원
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    고정 {p.F}만원 + 1개당 {p.v}만원 · {p.note}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[11px] leading-5 text-slate-400">
            50개와 100개에서 가장 싼 설비가 바뀌어요. 조금만 만들 땐 <b className="text-emerald-200">소형</b>, 아주 많이
            만들 땐 <b className="text-amber-200">대형</b>이 유리합니다. 장기 비용은 늘 세 직선 중 가장 아래를 따라가요.
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 노동함수로 비용함수 만들기
// ══════════════════════════════════════════════════════════════
function LaborTab() {
  const [cid, setCid] = useState(LABOR_CASES[0].id);
  const c: LaborCase = LABOR_CASES.find((x) => x.id === cid) ?? LABOR_CASES[0];
  const [F, setF] = useState(LABOR_CASES[0].F);
  const [R, setR] = useState(LABOR_CASES[0].R);
  const [q, setQ] = useState(Math.round(LABOR_CASES[0].qMax / 2));

  function pick(next: LaborCase) {
    setCid(next.id);
    setF(next.F);
    setR(next.R);
    setQ(Math.round(next.qMax / 2 / next.qStep) * next.qStep);
  }

  const L = laborOf(c, q);
  const VC = R * L;
  const C = F + VC;
  const k = varCoef(c, R);
  const tex = costTex(c, F, R);
  const lMax = laborOf(c, c.qMax);
  const cMax = F + R * lMax;

  const Yl = (val: number) => CH - PB - (lMax <= 0 ? 0 : val / lMax) * (CH - PT - PB);
  const Yc = (val: number) => CH - PB - (cMax <= 0 ? 0 : val / cMax) * (CH - PT - PB);
  const X = (val: number) => PL + (val / c.qMax) * (CW - PL - PR);
  const lPts = Array.from({ length: 121 }, (_, i) => {
    const x = (i / 120) * c.qMax;
    return `${X(x)},${Yl(laborOf(c, x))}`;
  }).join(" ");
  const cPts = Array.from({ length: 121 }, (_, i) => {
    const x = (i / 120) * c.qMax;
    return `${X(x)},${Yc(F + R * laborOf(c, x))}`;
  }).join(" ");

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {LABOR_CASES.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => pick(x)}
            className={
              "rounded-xl border-2 p-3 text-left transition " +
              (cid === x.id ? TONE_ON[x.tone] : "border-white/10 bg-white/5 hover:bg-white/10")
            }
          >
            <p className="text-sm font-bold text-slate-100">
              {x.emoji} {x.name}
            </p>
            <div className="overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
              <Katex expr={prodTex(x)} />
            </div>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{x.story}</p>
          </button>
        ))}
      </div>

      {/* 네 걸음 유도 */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StepCard n={1} title="생산함수" desc={`노동량 L을 넣으면 생산량 Q가 나와요. (노동 1단위 = ${c.laborUnit})`} tex={prodTex(c)} tone="emerald" />
        <StepCard n={2} title="노동함수 (역함수)" desc="목표 생산량 Q를 만들려면 노동량이 얼마나 필요할까?" tex={laborTex(c)} tone="sky" />
        <StepCard n={3} title="가변 비용" desc="필요한 노동량에 1단위당 임금을 곱해요." tex={`R \\times L(Q)`} tone="violet" />
        <StepCard n={4} title="비용함수" desc="고정 비용을 더하면 완성!" tex={tex.sym} tone="amber" />
      </div>

      <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-400/[0.08] p-4">
        <p className="text-center text-xs font-bold text-amber-200">이 공방의 비용함수</p>
        <FormulaLine expr={tex.num} className="text-slate-100" />
        <p className="mt-1 text-center text-[11px] text-slate-400">
          {c.kind === "linear" ? "생산함수가 일차함수라 비용함수도 일차함수예요." : "생산함수가 무리함수라 비용함수는 이차함수가 돼요."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <ChartFrame yMax={lMax} xMax={c.qMax} xLabel={`Q (${c.unit})`} yLabel="필요한 노동량 L" yFmt={(t) => fmt(t, 1)}>
            <polyline points={lPts} fill="none" stroke="#38bdf8" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
            <line x1={X(q)} y1={Yl(L)} x2={X(q)} y2={CH - PB} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.75} />
            <line x1={PL} y1={Yl(L)} x2={X(q)} y2={Yl(L)} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.75} />
            <circle cx={X(q)} cy={Yl(L)} r={5} fill="#fff" />
            <circle cx={X(q)} cy={Yl(L)} r={3} fill="#f43f5e" />
          </ChartFrame>
          <ChartFrame yMax={cMax} xMax={c.qMax} xLabel={`Q (${c.unit})`} yLabel="총비용 C" yFmt={(t) => cnt(t)}>
            <rect x={PL} y={Yc(F)} width={CW - PL - PR} height={Math.max(0, CH - PB - Yc(F))} fill="#fbbf24" fillOpacity={0.16} />
            <line x1={PL} y1={Yc(F)} x2={CW - PR} y2={Yc(F)} stroke="#fbbf24" strokeWidth={1.4} strokeDasharray="5 3" />
            <polyline points={cPts} fill="none" stroke="#f97316" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
            {F > 0 ? (
              <text x={PL + 8} y={(Yc(F) + (CH - PB)) / 2} dy={3} fill="#fcd34d" fontSize={10} fontWeight={700}>
                고정 비용 {cnt(F)}
              </text>
            ) : null}
            <line x1={X(q)} y1={Yc(C)} x2={X(q)} y2={CH - PB} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.75} />
            <line x1={PL} y1={Yc(C)} x2={X(q)} y2={Yc(C)} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.75} />
            <circle cx={X(q)} cy={Yc(C)} r={5} fill="#fff" />
            <circle cx={X(q)} cy={Yc(C)} r={3} fill="#f43f5e" />
          </ChartFrame>
        </div>

        <div className="space-y-2">
          <Slider label="고정 비용 F" value={F} display={fmt(F)} min={c.Fmin} max={c.Fmax} step={c.Fstep} onChange={setF} tone="amber" />
          <Slider label="노동 1단위당 임금 R" value={R} display={fmt(R)} min={c.Rmin} max={c.Rmax} step={c.Rstep} onChange={setR} tone="violet" />
          <Slider
            label={`목표 생산량 Q (${c.unit})`}
            value={q}
            display={`${cnt(q)}${c.unit}`}
            min={0}
            max={c.qMax}
            step={c.qStep}
            onChange={setQ}
            tone="sky"
          />

          <div className="grid grid-cols-2 gap-2">
            <Big label="필요한 노동량 L(Q)" value={fmt(L, 2)} tone="sky" />
            <Big label="가변 비용 R × L(Q)" value={fmt(VC, 1)} tone="emerald" />
            <Big label="고정 비용 F" value={fmt(F)} tone="amber" />
            <Big label="총비용 C" value={fmt(C, 1)} tone="violet" />
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
            <FormulaLine
              expr={
                c.kind === "linear"
                  ? `C = ${fmt(F)} + ${fmt(R)} \\times \\dfrac{${fmt(q)}}{${c.a}} = ${fmt(C, 1)}`
                  : `C = ${fmt(F)} + ${fmt(R)} \\times \\dfrac{${fmt(q)}^2}{${c.a * c.a}} = ${fmt(C, 1)}`
              }
              className="text-slate-100"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[11px] leading-5 text-slate-400">
            1{c.unit}당 비용은 {q > 0 ? <b className="text-violet-200">{fmt(C / q, 2)}</b> : <b>—</b>} 이고, 가변 비용의
            계수는 <b className="text-emerald-200">{fmt(k, 4)}</b> 예요.{" "}
            {c.kind === "linear"
              ? "임금 R을 올리면 기울기가 커지고, 고정 비용 F를 올리면 그래프가 위로 올라갑니다."
              : "생산량을 2배로 늘리면 가변 비용은 4배가 돼요. Q²에 비례하기 때문이에요."}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({ n, title, desc, tex, tone }: { n: number; title: string; desc: string; tex: string; tone: string }) {
  const cls: Record<string, string> = {
    emerald: "border-emerald-400/35 bg-emerald-400/[0.07]",
    sky: "border-sky-400/35 bg-sky-400/[0.07]",
    violet: "border-violet-400/35 bg-violet-400/[0.07]",
    amber: "border-amber-400/35 bg-amber-400/[0.07]",
  };
  return (
    <div className={"rounded-xl border-2 p-3 " + cls[tone]}>
      <p className="text-xs font-bold text-slate-100">
        <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[10px]">{n}</span>
        {title}
      </p>
      <div className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-slate-100">
        <Katex expr={tex} />
      </div>
      <p className="text-[10px] leading-4 text-slate-400">{desc}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 단계별 문제
// ══════════════════════════════════════════════════════════════
type StepState = { text: string; ok: boolean; tries: number; hint: boolean; shown: boolean };
const DEFAULT_STEP: StepState = { text: "", ok: false, tries: 0, hint: false, shown: false };

function ProblemTab() {
  const [pIdx, setPIdx] = useState(0);
  const [state, setState] = useState<Record<string, StepState>>({});
  const prob = PROBLEMS[pIdx];
  const doneCount = PROBLEMS.filter((p) => p.steps.every((s) => state[s.id]?.ok)).length;

  function get(id: string) {
    return state[id] ?? DEFAULT_STEP;
  }
  function update(id: string, patch: Partial<StepState>) {
    setState((p) => ({ ...p, [id]: { ...(p[id] ?? DEFAULT_STEP), ...patch } }));
  }
  function check(step: PStep, override?: string) {
    setState((p) => {
      const cur = p[step.id] ?? DEFAULT_STEP;
      const text = override ?? cur.text;
      const ok =
        step.kind === "number"
          ? (() => {
              const val = Number(text.replace(/[^0-9.-]/g, ""));
              return text.trim() !== "" && Number.isFinite(val) && Math.abs(val - step.answer) <= (step.tol ?? 0.005);
            })()
          : text !== "" && Number(text) === step.answer;
      return { ...p, [step.id]: { ...cur, text, ok, tries: cur.tries + 1 } };
    });
  }

  const firstOpen = prob.steps.findIndex((s) => !get(s.id).ok);
  const probDone = firstOpen === -1;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🧩 비용함수 단계별 문제</p>
          <span className="font-mono text-xs text-slate-300">
            완료 {doneCount} / {PROBLEMS.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PROBLEMS.map((p, i) => {
            const done = p.steps.every((s) => state[s.id]?.ok);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPIdx(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (pIdx === i
                    ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                    : done
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {done ? "✅ " : ""}
                {p.emoji} {p.title.replace("문제 ", "").replace(" · ", ". ")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-base font-bold text-slate-100">
          {prob.emoji} {prob.title}
        </p>
        <p className="mt-1.5 text-sm leading-7 text-slate-300">{prob.scenario}</p>
        {prob.tex ? <FormulaLine expr={prob.tex} className="mt-1 text-slate-100" /> : null}
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {prob.given.map((gv) => (
            <div key={gv.label} className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2">
              <p className="text-[11px] text-slate-400">{gv.label}</p>
              <p className="mt-0.5 text-sm font-bold text-sky-100">{gv.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {prob.steps.map((step, i) => {
          const ss = get(step.id);
          const locked = i > (firstOpen === -1 ? prob.steps.length - 1 : firstOpen);
          return (
            <div
              key={step.id}
              className={
                "rounded-2xl border p-4 transition " +
                (ss.ok
                  ? "border-emerald-400/40 bg-emerald-400/[0.07]"
                  : locked
                    ? "border-white/5 bg-slate-900/20 opacity-50"
                    : "border-violet-400/35 bg-violet-400/[0.06]")
              }
            >
              <div className="flex items-start gap-2">
                <span
                  className={
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                    (ss.ok ? "bg-emerald-400/25 text-emerald-100" : "bg-white/10 text-slate-300")
                  }
                >
                  {ss.ok ? "✓" : i + 1}
                </span>
                <p className="text-sm font-bold leading-6 text-slate-100">{step.ask}</p>
              </div>

              {locked ? (
                <p className="mt-2 pl-8 text-xs text-slate-500">앞 단계를 먼저 풀어 주세요 🔒</p>
              ) : (
                <div className="mt-2 pl-8">
                  {step.tex ? <FormulaLine expr={step.tex} className="text-slate-100" /> : null}

                  {step.kind === "number" ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label={step.ask}
                        value={ss.text}
                        disabled={ss.ok}
                        onChange={(e) => update(step.id, { text: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") check(step);
                        }}
                        placeholder="숫자만 입력"
                        className="w-40 rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-right font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 disabled:opacity-60"
                      />
                      <span className="text-sm text-slate-300">{step.suffix}</span>
                      {!ss.ok ? (
                        <button
                          type="button"
                          onClick={() => check(step)}
                          className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
                        >
                          확인
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-col gap-1.5">
                      {step.options.map((opt, oi) => {
                        const chosen = ss.text === String(oi);
                        const right = ss.ok && oi === step.answer;
                        const wrong = chosen && !ss.ok;
                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={ss.ok}
                            onClick={() => check(step, String(oi))}
                            className={
                              "rounded-lg border-2 px-3 py-2 text-left text-sm font-bold transition disabled:opacity-80 " +
                              (right
                                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                                : wrong
                                  ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                            }
                          >
                            {opt.tex ? (
                              <span className="inline-block align-middle">
                                <Katex expr={opt.tex} />
                              </span>
                            ) : (
                              opt.text
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {ss.ok ? (
                    <p className="mt-2 rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-1.5 text-xs leading-5 text-emerald-100">
                      정답이에요! ✅ {step.explain}
                    </p>
                  ) : ss.tries > 0 ? (
                    <p className="mt-2 rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-1.5 text-xs leading-5 text-amber-100">
                      아직 아니에요. {ss.tries >= 2 ? "힌트를 열어 보세요." : "단위를 잘 맞췄는지 확인해 볼까요?"}
                    </p>
                  ) : null}

                  {!ss.ok ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => update(step.id, { hint: !ss.hint })}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                      >
                        💡 힌트 {ss.hint ? "닫기" : "보기"}
                      </button>
                      {ss.tries >= 3 ? (
                        <button
                          type="button"
                          onClick={() => update(step.id, { shown: true })}
                          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-400 transition hover:bg-white/10"
                        >
                          정답 보기
                        </button>
                      ) : null}
                      {ss.hint ? (
                        <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">{step.hint}</span>
                      ) : null}
                      {ss.shown ? (
                        <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">
                          정답:{" "}
                          <b className="font-mono text-emerald-200">
                            {step.kind === "number"
                              ? step.answer.toLocaleString("ko-KR") + step.suffix
                              : (step.options[step.answer].text ?? `${step.answer + 1}번`)}
                          </b>{" "}
                          — {step.explain}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {probDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🎉 문제 해결!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">{prob.wrapUp}</p>
          {pIdx < PROBLEMS.length - 1 ? (
            <button
              type="button"
              onClick={() => setPIdx(pIdx + 1)}
              className="mt-3 rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25"
            >
              다음 문제로 →
            </button>
          ) : doneCount === PROBLEMS.length ? (
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 네 문제를 모두 해결했어요! 비용함수 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
