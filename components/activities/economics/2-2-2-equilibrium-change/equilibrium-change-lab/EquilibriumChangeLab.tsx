"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CARD_MKT,
  CARD_SHIFT,
  DEMAND_CARDS,
  INCOME_MARKETS,
  INCOME_MAX,
  INCOME_STEP,
  PROBLEMS,
  RESULT_OPTIONS,
  SUMMARY_LINES,
  SUPPLY_CARDS,
  TAX_MARKETS,
  TAX_MAX,
  TAX_STEP,
  demandTex,
  eqOf,
  fmt,
  incomeShift,
  qd,
  qs,
  resultAnswer,
  supplyTex,
  taxResult,
  type Card,
  type IncomeMkt,
  type Mkt,
  type PStep,
  type TaxResult,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "tax_burden",
    prompt:
      "제품에 세금을 매기면 공급자만 손해를 볼 것 같지만 소비자도 함께 부담했어요. 왜 그런지, 그리고 어떤 상품일 때 소비자가 더 많이 부담하게 되는지 자기 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 세금 때문에 공급이 줄어 균형가격이 올라가므로 소비자도 더 비싼 값을 낸다. 값이 올라도 어쩔 수 없이 사야 하는 상품(휘발유 같은)일수록 소비자가 더 많이 부담한다.",
  },
  {
    id: "demand_supply",
    prompt:
      "수요가 움직일 때와 공급이 움직일 때 균형가격과 균형거래량의 변화 방향이 달랐어요. 그 차이를 헷갈리지 않게 기억하는 나만의 방법을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 수요가 움직이면 가격과 거래량이 같은 방향으로 가고, 공급이 움직이면 반대 방향으로 간다. 사려는 사람이 늘면 비싸지고 많이 팔리지만, 파는 사람이 늘면 싸지고 많이 팔린다고 외웠다.",
  },
  {
    id: "real",
    prompt:
      "요즘 값이 크게 오르거나 내린 물건을 하나 떠올려, 수요와 공급 가운데 어느 쪽이 어떤 요인 때문에 움직였는지 이 활동에서 배운 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 여름에 수박값이 오른 것은 더위로 수요가 늘어난 데다 장마로 수확량이 줄어 공급이 줄어든 탓인 것 같다.",
  },
];

type Tab = "tax" | "income" | "demand" | "supply" | "problem";

export default function EquilibriumChangeLab() {
  const [tab, setTab] = useState<Tab>("tax");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🔀 균형가격의 변화</h3>
        <p className="mt-2 leading-7 text-slate-300">
          세금이 오르거나, 소득이 늘거나, 날씨가 바뀌면 시장의 <b className="text-amber-200">균형점 자체</b>가
          옮겨 가요. 무엇이 <b className="text-fuchsia-200">수요곡선</b>을 움직이고 무엇이{" "}
          <b className="text-emerald-200">공급곡선</b>을 움직이는지, 그 결과 가격과 거래량이 어디로 가는지 직접 움직여
          보며 알아봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "tax"} onClick={() => setTab("tax")}>① 세금과 균형점</TabButton>
        <TabButton active={tab === "income"} onClick={() => setTab("income")}>② 소득과 균형점</TabButton>
        <TabButton active={tab === "demand"} onClick={() => setTab("demand")}>③ 수요를 움직이는 것들</TabButton>
        <TabButton active={tab === "supply"} onClick={() => setTab("supply")}>④ 공급을 움직이는 것들</TabButton>
        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>⑤ 단계별 문제</TabButton>
      </div>

      <div className="mt-4">
        {tab === "tax" ? <TaxTab /> : null}
        {tab === "income" ? <IncomeTab /> : null}
        {tab === "demand" ? <CardGame side="demand" cards={DEMAND_CARDS} /> : null}
        {tab === "supply" ? <CardGame side="supply" cards={SUPPLY_CARDS} /> : null}
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

function FormulaLine({ expr, className }: { expr: string; className?: string }) {
  return (
    <div className={"overflow-x-auto overflow-y-hidden py-1 " + (className ?? "")}>
      <Katex expr={expr} display />
    </div>
  );
}

const TONE_ON: Record<string, string> = {
  emerald: "border-emerald-400/60 bg-emerald-400/15",
  sky: "border-sky-400/60 bg-sky-400/15",
  amber: "border-amber-400/60 bg-amber-400/15",
  violet: "border-violet-400/60 bg-violet-400/15",
};

const D_COLOR = "#f472b6";
const S_COLOR = "#34d399";

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold text-slate-300">{label}</p>
        <p className="font-mono text-base font-bold text-slate-100">{display}</p>
      </div>
      <input
        type="range"
        aria-label={label}
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

/**
 * 흐름도 — 손잡이가 0일 때도 자리를 그대로 차지하도록 늘 같은 높이로 그린다.
 * (칸이 사라지면 아래의 그래프·슬라이더가 위로 밀려 조작이 튀어 보인다.)
 */
function Flow({ steps, tone }: { steps: string[]; tone: "amber" | "sky" | "muted" }) {
  const cls: Record<string, string> = {
    amber: "border-amber-400/50 bg-amber-400/[0.10] text-amber-100",
    sky: "border-sky-400/50 bg-sky-400/[0.10] text-sky-100",
    muted: "border-white/10 bg-white/[0.03] text-slate-500",
  };
  return (
    <div className="grid gap-1.5 sm:grid-cols-4">
      {steps.map((s, i) => (
        <div
          key={s}
          className={
            "flex min-h-[3.6rem] items-center justify-center rounded-xl border-2 px-3 py-2 text-center text-[11px] font-bold leading-5 transition-colors " +
            cls[tone]
          }
        >
          {i === steps.length - 1 && tone !== "muted" ? "🎯 " : ""}
          {s}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  수요·공급 그래프 (가로축 가격 x, 세로축 수량 Q)
// ══════════════════════════════════════════════════════════════
const W = 400,
  H = 310,
  PL = 52,
  PR = 22,
  PT = 34,
  PB = 40;

function ShiftChart({
  m,
  dShift = 0,
  sShift = 0,
  tax = null,
}: {
  m: Mkt;
  dShift?: number;
  sShift?: number;
  tax?: TaxResult | null;
}) {
  const qTop =
    Math.max(qd(m, 0), qd(m, 0, dShift), qs(m, m.xMax), qs(m, m.xMax, sShift)) * 1.08 || 1;
  const X = (v: number) => PL + (v / m.xMax) * (W - PL - PR);
  const Y = (v: number) => H - PB - (v / qTop) * (H - PT - PB);
  const line = (f: (x: number) => number) =>
    Array.from({ length: 121 }, (_, i) => {
      const x = (i / 120) * m.xMax;
      return `${X(x)},${Y(f(x))}`;
    }).join(" ");

  const e0 = eqOf(m);
  const e1 = eqOf(m, dShift, sShift);
  const moved = dShift !== 0 || sShift !== 0;
  const showTax = tax !== null && tax.x1 > tax.x0 + 1e-9;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <div className="overflow-x-auto overflow-y-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[320px]" role="img" aria-label={`${m.name} 시장의 균형점 변화`}>
          <rect x={0} y={0} width={W} height={H} rx={10} fill="#0b1220" />
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <g key={`y${r}`}>
              <line x1={PL} y1={Y(r * qTop)} x2={W - PR} y2={Y(r * qTop)} stroke="rgba(148,163,184,0.11)" strokeWidth={0.8} />
              <text x={PL - 6} y={Y(r * qTop)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                {Math.round(r * qTop)}
              </text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <g key={`x${r}`}>
              <line x1={X(r * m.xMax)} y1={PT} x2={X(r * m.xMax)} y2={H - PB} stroke="rgba(148,163,184,0.1)" strokeWidth={0.8} />
              <text x={X(r * m.xMax)} y={H - PB + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                {fmt(r * m.xMax, 0)}
              </text>
            </g>
          ))}

          {/* 세금 부담 영역 */}
          {showTax && tax ? (
            <g>
              <rect x={X(tax.xs)} y={Y(tax.q1)} width={Math.max(0, X(tax.x0) - X(tax.xs))} height={Math.max(0, H - PB - Y(tax.q1))} fill="#e879f9" fillOpacity={0.3} />
              <rect x={X(tax.x0)} y={Y(tax.q1)} width={Math.max(0, X(tax.x1) - X(tax.x0))} height={Math.max(0, H - PB - Y(tax.q1))} fill="#facc15" fillOpacity={0.3} />
              <polygon points={`${X(tax.xs)},${Y(tax.q1)} ${X(tax.x1)},${Y(tax.q1)} ${X(tax.x0)},${Y(tax.q0)}`} fill="#60a5fa" fillOpacity={0.45} />
            </g>
          ) : null}

          {/* 원래 곡선 */}
          <polyline points={line((x) => qd(m, x))} fill="none" stroke={D_COLOR} strokeWidth={moved && dShift !== 0 ? 2 : 3} strokeDasharray={moved && dShift !== 0 ? "6 4" : undefined} strokeOpacity={moved && dShift !== 0 ? 0.6 : 1} />
          <polyline points={line((x) => qs(m, x))} fill="none" stroke={S_COLOR} strokeWidth={moved && sShift !== 0 ? 2 : 3} strokeDasharray={moved && sShift !== 0 ? "6 4" : undefined} strokeOpacity={moved && sShift !== 0 ? 0.6 : 1} />
          {/* 옮겨진 곡선 */}
          {dShift !== 0 ? <polyline points={line((x) => qd(m, x, dShift))} fill="none" stroke={D_COLOR} strokeWidth={3.2} /> : null}
          {sShift !== 0 ? <polyline points={line((x) => qs(m, x, sShift))} fill="none" stroke={S_COLOR} strokeWidth={3.2} /> : null}

          {/* 이동 화살표 */}
          {dShift !== 0
            ? [0.3, 0.55].map((r) => {
                const x = m.xMax * r;
                return (
                  <line key={`da${r}`} x1={X(x)} y1={Y(qd(m, x))} x2={X(x)} y2={Y(qd(m, x, dShift))} stroke="#fb923c" strokeWidth={1.6} opacity={0.85} />
                );
              })
            : null}
          {sShift !== 0
            ? [0.45, 0.7].map((r) => {
                const x = m.xMax * r;
                return <line key={`sa${r}`} x1={X(x)} y1={Y(qs(m, x))} x2={X(x)} y2={Y(qs(m, x, sShift))} stroke="#fb923c" strokeWidth={1.6} opacity={0.85} />;
              })
            : null}

          {/* 균형점 */}
          <g>
            <line x1={X(e0.x)} y1={Y(e0.q)} x2={X(e0.x)} y2={H - PB} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
            <line x1={PL} y1={Y(e0.q)} x2={X(e0.x)} y2={Y(e0.q)} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
            <circle cx={X(e0.x)} cy={Y(e0.q)} r={5.5} fill="#fff" />
            <text x={X(e0.x) - 8} y={Y(e0.q) - 8} textAnchor="end" fill="#e2e8f0" fontSize={11} fontWeight={700}>
              E₀
            </text>
          </g>
          {moved ? (
            <g>
              <line x1={X(e1.x)} y1={Y(e1.q)} x2={X(e1.x)} y2={H - PB} stroke="#fbbf24" strokeWidth={1.1} strokeDasharray="4 3" opacity={0.85} />
              <line x1={PL} y1={Y(e1.q)} x2={X(e1.x)} y2={Y(e1.q)} stroke="#fbbf24" strokeWidth={1.1} strokeDasharray="4 3" opacity={0.85} />
              <circle cx={X(e1.x)} cy={Y(e1.q)} r={6} fill="#fff" />
              <circle cx={X(e1.x)} cy={Y(e1.q)} r={3.4} fill="#fbbf24" />
              <text x={X(e1.x) + 9} y={Y(e1.q) + 12} fill="#fcd34d" fontSize={11} fontWeight={700}>
                E₁
              </text>
            </g>
          ) : null}

          <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <text x={W - PR} y={H - PB + 34} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            가격 x ({m.priceUnit})
          </text>
          <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            수량 Q ({m.unit})
          </text>
          <text x={W - PR - 4} y={Y(qd(m, m.xMax * 0.88, dShift)) - 7} textAnchor="end" fill={D_COLOR} fontSize={11} fontWeight={700}>
            Qd
          </text>
          <text x={W - PR - 4} y={Y(qs(m, m.xMax * 0.88, sShift)) - 7} textAnchor="end" fill={S_COLOR} fontSize={11} fontWeight={700}>
            Qs
          </text>
          {showTax && tax ? (
            <text x={X(tax.xs) + 2} y={H - PB + 25} textAnchor="start" fill="#f0abfc" fontSize={9} fontWeight={700}>
              생산자가 받는 값
            </text>
          ) : null}
        </svg>
      </div>
      {showTax && tax ? (
        <div className="flex flex-wrap justify-center gap-2 px-1 pb-1 text-[10px]">
          <Legend color="#facc15">소비자 부담</Legend>
          <Legend color="#e879f9">공급자 부담</Legend>
          <Legend color="#60a5fa">세금으로 인한 사회적 손실</Legend>
        </div>
      ) : null}
    </div>
  );
}

function Legend({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-slate-300">
      <span className="inline-block h-2.5 w-4 rounded-sm" style={{ background: color, opacity: 0.6 }} />
      {children}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 세금과 균형점
// ══════════════════════════════════════════════════════════════
function TaxTab() {
  const [mid, setMid] = useState(TAX_MARKETS[0].id);
  const m = TAX_MARKETS.find((x) => x.id === mid) ?? TAX_MARKETS[0];
  const [t, setT] = useState(20);
  const r = taxResult(m, t);
  const up = t > 0;
  const cShare = t !== 0 ? Math.abs(r.cPer / t) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {TAX_MARKETS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setMid(x.id)}
            className={"rounded-xl border-2 p-3 text-left transition " + (mid === x.id ? TONE_ON[x.tone] : "border-white/10 bg-white/5 hover:bg-white/10")}
          >
            <p className="text-sm font-bold text-slate-100">
              {x.emoji} {x.name}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{x.story}</p>
          </button>
        ))}
      </div>

      <Flow
        steps={
          t === 0
            ? ["제품에 부과되는 세금 변화", "생산 비용에 주는 효과", "균형점 이동 E₀ ⇒ E₁", "세금 손잡이를 움직여 보세요"]
            : up
              ? ["제품에 부과되는 세금 증가", "생산 비용 증가 효과 (공급곡선 이동)", "균형점 이동 E₀ ⇒ E₁", "균형가격 상승 · 균형거래량 감소"]
              : ["제품에 부과되는 세금 감소", "생산 비용 감소 효과 (공급곡선 이동)", "균형점 이동 E₀ ⇒ E₁", "균형가격 하락 · 균형거래량 증가"]
        }
        tone={t === 0 ? "muted" : up ? "amber" : "sky"}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <ShiftChart m={m} sShift={r.sShift} tax={r} />

        <div className="space-y-2">
          <Slider
            label={`1개당 세금 (${m.priceUnit})`}
            value={t}
            display={t === 0 ? "없음" : `${t > 0 ? "+" : ""}${fmt(t)}`}
            min={-TAX_MAX}
            max={TAX_MAX}
            step={TAX_STEP}
            onChange={setT}
            accent="accent-amber-400"
          />

          <div className="grid grid-cols-2 gap-2">
            <MoveCard label="균형가격" from={r.x0} to={r.x1} unit={m.priceUnit} />
            <MoveCard label="균형거래량" from={r.q0} to={r.q1} unit={m.unit} />
          </div>

          {t > 0 ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
                <p className="text-xs font-bold text-slate-300">🧾 1개당 세금 {fmt(t)}은 누가 얼마나 부담할까?</p>
                <div className="mt-2 flex h-7 overflow-hidden rounded-lg">
                  <div className="flex items-center justify-center bg-yellow-400/45 text-[11px] font-bold text-yellow-50" style={{ width: `${cShare * 100}%` }}>
                    {cShare >= 0.18 ? `소비자 ${Math.round(cShare * 100)}%` : ""}
                  </div>
                  <div className="flex items-center justify-center bg-fuchsia-400/45 text-[11px] font-bold text-fuchsia-50" style={{ width: `${(1 - cShare) * 100}%` }}>
                    {1 - cShare >= 0.18 ? `공급자 ${Math.round((1 - cShare) * 100)}%` : ""}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg border border-yellow-400/35 bg-yellow-400/[0.08] px-2 py-1.5">
                    <p className="text-[10px] text-slate-400">소비자 (1개당)</p>
                    <p className="font-mono text-sm font-bold text-yellow-100">{fmt(r.cPer)}</p>
                    <p className="text-[10px] text-slate-500">총 {fmt(r.cTotal, 0)}</p>
                  </div>
                  <div className="rounded-lg border border-fuchsia-400/35 bg-fuchsia-400/[0.08] px-2 py-1.5">
                    <p className="text-[10px] text-slate-400">공급자 (1개당)</p>
                    <p className="font-mono text-sm font-bold text-fuchsia-100">{fmt(r.pPer)}</p>
                    <p className="text-[10px] text-slate-500">총 {fmt(r.pTotal, 0)}</p>
                  </div>
                </div>
                <p className="mt-1.5 text-center text-[11px] text-slate-400">
                  생산자가 실제로 받는 값 <b className="text-fuchsia-200">{fmt(r.xs)}</b> · 소비자가 내는 값{" "}
                  <b className="text-yellow-200">{fmt(r.x1)}</b>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-emerald-400/35 bg-emerald-400/[0.08] px-3 py-2 text-center">
                  <p className="text-[10px] text-slate-400">정부가 걷는 세금</p>
                  <p className="font-mono text-lg font-bold text-emerald-100">{fmt(r.revenue, 0)}</p>
                </div>
                <div className="rounded-xl border border-blue-400/35 bg-blue-400/[0.08] px-3 py-2 text-center">
                  <p className="text-[10px] text-slate-400">사회적 손실</p>
                  <p className="font-mono text-lg font-bold text-blue-100">{fmt(r.dwl, 0)}</p>
                </div>
              </div>

              <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2 text-[11px] leading-5 text-amber-100">
                💡 세금의 피해는 <b>공급자만 받지 않아요</b>. 값에 덜 민감한 쪽이 더 많이 지게 됩니다. 게다가 거래 자체가
                줄어드는 <b>사회적 손실</b>도 생기니, 세금 부과가 좋은 구매 억제 정책이라고만 볼 수는 없어요.
              </p>
            </>
          ) : t < 0 ? (
            <p className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2 text-[11px] leading-5 text-sky-100">
              세금을 줄이면 생산 비용이 줄어드는 효과가 생겨 공급곡선이 반대로 움직여요. 균형가격은 내려가고 균형거래량은
              늘어납니다.
            </p>
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs text-slate-400">
              세금 손잡이를 움직여 보세요. 오른쪽으로 밀면 세금 인상, 왼쪽으로 밀면 세금 인하예요.
            </p>
          )}

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <FormulaLine expr={demandTex(m)} className="text-slate-100" />
            <FormulaLine expr={supplyTex(m, r.sShift)} className="text-slate-100" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">⚖️ 같은 세금인데 부담이 다르다고?</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {TAX_MARKETS.map((x) => {
            const rr = taxResult(x, 20);
            const share = rr.cPer / 20;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => {
                  setMid(x.id);
                  setT(20);
                }}
                className={"rounded-xl border p-2.5 text-left transition " + (mid === x.id ? TONE_ON[x.tone] : "border-white/10 bg-white/5 hover:bg-white/10")}
              >
                <p className="text-xs font-bold text-slate-100">
                  {x.emoji} {x.name}
                </p>
                <div className="mt-1 flex h-4 overflow-hidden rounded">
                  <div className="bg-yellow-400/50" style={{ width: `${share * 100}%` }} />
                  <div className="bg-fuchsia-400/50" style={{ width: `${(1 - share) * 100}%` }} />
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                  소비자 {Math.round(share * 100)}% · 공급자 {Math.round((1 - share) * 100)}%
                </p>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-400">
          값이 올라도 어쩔 수 없이 사야 하는 상품(휘발유)일수록 <b className="text-yellow-200">소비자</b>가 더 많이
          부담하고, 값이 오르면 쉽게 안 사는 상품(자동차)일수록 <b className="text-fuchsia-200">공급자</b>가 더 많이
          부담해요.
        </p>
      </div>
    </div>
  );
}

function MoveCard({ label, from, to, unit }: { label: string; from: number; to: number; unit: string }) {
  const same = Math.abs(from - to) < 1e-9;
  const up = to > from;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="font-mono text-sm">
        <span className="text-slate-400">{fmt(from, 0)}</span>
        {same ? null : (
          <>
            <span className="mx-1 text-slate-500">→</span>
            <b className={up ? "text-orange-200" : "text-sky-200"}>{fmt(to, 0)}</b>
            <span className={"ml-0.5 " + (up ? "text-orange-300" : "text-sky-300")}>{up ? "⬆️" : "⬇️"}</span>
          </>
        )}
      </p>
      <p className="text-[10px] text-slate-500">{unit}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 소득과 균형점
// ══════════════════════════════════════════════════════════════
function IncomeTab() {
  const [mid, setMid] = useState(INCOME_MARKETS[0].id);
  const m: IncomeMkt = INCOME_MARKETS.find((x) => x.id === mid) ?? INCOME_MARKETS[0];
  const [income, setIncome] = useState(40);
  const shift = incomeShift(m, income);
  const e0 = eqOf(m);
  const e1 = eqOf(m, shift, 0);
  const up = income > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {INCOME_MARKETS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setMid(x.id)}
            className={"rounded-xl border-2 p-3 text-left transition " + (mid === x.id ? TONE_ON[x.tone] : "border-white/10 bg-white/5 hover:bg-white/10")}
          >
            <p className="text-sm font-bold text-slate-100">
              {x.emoji} {x.name}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{x.story}</p>
            <p className={"mt-1 text-[11px] font-bold " + (x.inferior ? "text-rose-200" : "text-emerald-200")}>{x.note}</p>
          </button>
        ))}
      </div>

      <Flow
        steps={
          income === 0
            ? ["수요자의 소득 변화", "구매력에 주는 효과", "균형점 이동 E₀ ⇒ E₁", "소득 손잡이를 움직여 보세요"]
            : [
                up ? "수요자의 소득 증가" : "수요자의 소득 감소",
                (up ? "구매력 증가" : "구매력 감소") + " 효과" + (m.inferior ? " (열등재라 반대!)" : ""),
                "균형점 이동 E₀ ⇒ E₁",
                shift > 0 ? "균형가격 상승 · 균형거래량 증가" : "균형가격 하락 · 균형거래량 감소",
              ]
        }
        tone={income === 0 ? "muted" : shift > 0 ? "amber" : "sky"}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <ShiftChart m={m} dShift={shift} />

        <div className="space-y-2">
          <Slider
            label="수요자의 소득 변화"
            value={income}
            display={income === 0 ? "그대로" : `${income > 0 ? "+" : ""}${income}`}
            min={-INCOME_MAX}
            max={INCOME_MAX}
            step={INCOME_STEP}
            onChange={setIncome}
            accent={m.inferior ? "accent-rose-400" : "accent-emerald-400"}
          />

          <div className="grid grid-cols-2 gap-2">
            <MoveCard label="균형가격" from={e0.x} to={e1.x} unit={m.priceUnit} />
            <MoveCard label="균형거래량" from={e0.q} to={e1.q} unit={m.unit} />
          </div>

          <div
            className={
              // 손잡이가 0일 때도 높이가 그대로 유지되도록 최소 높이를 준다
              "flex min-h-[6rem] flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-colors " +
              (income === 0
                ? "border-white/10 bg-white/5"
                : shift > 0
                  ? "border-amber-400/50 bg-amber-400/[0.10]"
                  : "border-sky-400/50 bg-sky-400/[0.10]")
            }
          >
            {income === 0 ? (
              <p className="text-xs text-slate-400">소득 손잡이를 움직여 보세요.</p>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-100">
                  {up ? "💰 소득 증가" : "🪙 소득 감소"} → {shift > 0 ? "수요 증가 ↗️" : "수요 감소 ↘️"}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-300">
                  {m.inferior
                    ? "열등재예요! 소득이 늘면 오히려 다른 상품으로 옮겨 가 수요가 줄어듭니다."
                    : "같은 가격에서도 사려는 양이 달라져 수요곡선 자체가 움직여요."}
                </p>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <FormulaLine expr={demandTex(m, shift)} className="text-slate-100" />
            <FormulaLine expr={supplyTex(m)} className="text-slate-100" />
          </div>

          <p className="rounded-xl border border-violet-400/25 bg-violet-400/[0.06] px-3 py-2 text-[11px] leading-5 text-violet-100">
            💡 세금은 <b>공급곡선</b>을, 소득은 <b>수요곡선</b>을 움직여요. 그래서 결과도 다릅니다 — 수요가 늘면 가격과
            거래량이 <b>함께</b> 오르지만, 공급이 늘면 가격은 내리고 거래량만 늘어요.
          </p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③·④ 실생활 사례 게임
// ══════════════════════════════════════════════════════════════
function CardGame({ side, cards }: { side: "demand" | "supply"; cards: Card[] }) {
  const [cur, setCur] = useState<string | null>(null);
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);
  const [solved, setSolved] = useState<Record<string, boolean>>({});

  const c = cur ? (cards.find((v) => v.id === cur) ?? null) : null;
  const a1 = c ? (c.dir === "up" ? 0 : 1) : 0;
  const a2 = c ? resultAnswer(side, c.dir) : 0;
  const ok1 = q1 === a1;
  const ok2 = q2 === a2;
  const applied = !!c && ok1 && ok2;

  const shift = applied && c ? (c.dir === "up" ? CARD_SHIFT : -CARD_SHIFT) : 0;
  const dShift = side === "demand" ? shift : 0;
  const sShift = side === "supply" ? shift : 0;
  const e0 = eqOf(CARD_MKT);
  const e1 = eqOf(CARD_MKT, dShift, sShift);

  const isD = side === "demand";
  const word = isD ? "수요" : "공급";
  const doneCount = Object.values(solved).filter(Boolean).length;

  function open(id: string) {
    setCur(id);
    setQ1(null);
    setQ2(null);
  }

  return (
    <div className="space-y-4">
      <div className={"rounded-2xl border-2 p-4 " + (isD ? "border-fuchsia-400/40 bg-fuchsia-400/[0.07]" : "border-emerald-400/40 bg-emerald-400/[0.07]")}>
        <p className={"text-sm font-bold " + (isD ? "text-fuchsia-200" : "text-emerald-200")}>
          {isD ? "🙋 수요곡선을 움직이는 것들" : "🏭 공급곡선을 움직이는 것들"}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          {isD
            ? "소득, 기호와 유행, 대체재·보완재의 가격, 수요자의 수, 앞으로의 가격 기대… 가격 말고 이런 것들이 달라지면 수요곡선 자체가 움직여요."
            : "원자재 가격, 생산 기술, 생산자의 수, 세금과 보조금, 자연재해… 가격 말고 이런 것들이 달라지면 공급곡선 자체가 움직여요."}
        </p>
      </div>

      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🗞️ 사건 카드를 골라 균형점의 변화를 예측해 보세요</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-300">
              해결 {doneCount} / {cards.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setSolved({});
                setCur(null);
                setQ1(null);
                setQ2(null);
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↩️ 다시
            </button>
          </div>
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => open(v.id)}
              className={
                "rounded-xl border-2 p-2.5 text-left transition " +
                (cur === v.id ? "border-violet-400/60 bg-violet-400/15" : solved[v.id] ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/10 bg-white/5 hover:bg-white/10")
              }
            >
              <p className="text-xs font-bold text-slate-100">
                {solved[v.id] ? "✅ " : ""}
                {v.emoji} {v.title}
              </p>
              <p className="text-[10px] text-slate-400">{v.product} 시장</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <ShiftChart m={CARD_MKT} dShift={dShift} sShift={sShift} />
          <div className="grid grid-cols-2 gap-2">
            <MoveCard label="균형가격" from={e0.x} to={e1.x} unit={CARD_MKT.priceUnit} />
            <MoveCard label="균형거래량" from={e0.q} to={e1.q} unit={CARD_MKT.unit} />
          </div>
        </div>

        <div className="space-y-2">
          {!c ? (
            <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-6 text-center text-xs text-slate-400">
              위에서 사건 카드를 하나 골라 보세요.
            </p>
          ) : (
            <>
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
                <p className="text-sm font-bold text-slate-100">
                  {c.emoji} {c.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-300">{c.desc}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">📦 {c.product} 시장의 이야기</p>
              </div>

              <QRow
                n={1}
                ask={`이 일로 ${word}는 어떻게 될까요?`}
                options={[`↗️ ${word} 증가 — 곡선이 오른쪽 위로`, `↘️ ${word} 감소 — 곡선이 왼쪽 아래로`]}
                answer={a1}
                pick={q1}
                onPick={setQ1}
              />

              {ok1 ? (
                <QRow
                  n={2}
                  ask="그 결과 균형가격과 균형거래량은?"
                  options={RESULT_OPTIONS}
                  answer={a2}
                  pick={q2}
                  onPick={(v) => {
                    setQ2(v);
                    if (v === a2) setSolved((p) => ({ ...p, [c.id]: true }));
                  }}
                />
              ) : null}

              {applied ? (
                <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3">
                  <p className="text-center text-sm font-bold text-emerald-100">
                    ✅ {word} {c.dir === "up" ? "증가" : "감소"} · 요인은 <span className="text-amber-200">{c.kind}</span>
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-200">{c.why}</p>
                  <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-center font-mono text-[11px] text-amber-100">
                    균형가격 {fmt(e0.x)} → {fmt(e1.x)} {e1.x > e0.x ? "⬆️" : "⬇️"} · 균형거래량 {fmt(e0.q)} → {fmt(e1.q)}{" "}
                    {e1.q > e0.q ? "⬆️" : "⬇️"}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {doneCount === cards.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4">
          <p className="text-center text-sm font-bold text-emerald-100">🎉 여덟 사건을 모두 해결했어요!</p>
          <div className="mx-auto mt-2 grid max-w-2xl gap-1.5 sm:grid-cols-2">
            {SUMMARY_LINES.map((s) => (
              <div key={s.k} className="rounded-lg border border-white/10 bg-black/25 px-3 py-1.5 text-center text-[11px] text-slate-200">
                <b className="text-amber-200">{s.k}</b> → {s.v}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2 text-[11px] leading-5 text-amber-100">
          💡 <b>수요</b>가 움직이면 가격과 거래량이 <b>같은 방향</b>으로, <b>공급</b>이 움직이면 <b>반대 방향</b>으로
          달라져요.
        </p>
      )}
    </div>
  );
}

function QRow({
  n,
  ask,
  options,
  answer,
  pick,
  onPick,
}: {
  n: number;
  ask: string;
  options: string[];
  answer: number;
  pick: number | null;
  onPick: (v: number) => void;
}) {
  const ok = pick === answer;
  return (
    <div className={"rounded-xl border p-3 transition " + (ok ? "border-emerald-400/50 bg-emerald-400/[0.09]" : "border-white/10 bg-white/5")}>
      <p className="text-xs font-bold leading-5 text-slate-100">
        <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/15 text-[9px]">{n}</span>
        {ask}
      </p>
      <div className="mt-1.5 flex flex-col gap-1">
        {options.map((o, i) => {
          const chosen = pick === i;
          return (
            <button
              key={o}
              type="button"
              disabled={ok}
              onClick={() => onPick(i)}
              className={
                "rounded-lg border-2 px-2.5 py-1.5 text-left text-[11px] font-bold transition disabled:opacity-90 " +
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
      {pick !== null && !ok ? <p className="mt-1.5 text-[11px] text-rose-200">다시 생각해 볼까요?</p> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ 단계별 문제
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
          <p className="text-sm font-bold text-violet-200">🧩 균형가격의 변화 단계별 문제</p>
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
        {prob.texList ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {prob.texList.map((t) => (
              <div key={t.label} className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2">
                <p className="text-[11px] font-bold text-sky-200">{t.label}</p>
                <div className="overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
                  <Katex expr={t.tex} />
                </div>
              </div>
            ))}
          </div>
        ) : null}
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
                        inputMode="text"
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
                      아직 아니에요. {ss.tries >= 2 ? "힌트를 열어 보세요." : "식을 다시 세워 볼까요?"}
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
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 네 문제를 모두 해결했어요! 균형 변화 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
