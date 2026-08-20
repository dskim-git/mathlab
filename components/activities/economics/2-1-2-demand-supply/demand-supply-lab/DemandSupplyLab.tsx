"use client";

import { useEffect, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  DEMAND_CASES,
  FLIP_IDS,
  FLIP_QUIZZES,
  PROBLEMS,
  SUPPLY_CASES,
  caseOf,
  fmt,
  fnTex,
  invTex,
  qMaxOf,
  qOf,
  substTex,
  type MarketCase,
  type PStep,
  type Side,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "law",
    prompt:
      "수요곡선은 오른쪽 아래로, 공급곡선은 오른쪽 위로 향했어요. 내가 사거나 팔아 본 물건을 하나 떠올려, 값이 오르내릴 때 사려는 마음과 팔려는 마음이 어떻게 달라지는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 좋아하는 과자가 1,500원에서 2,500원이 되니 잘 안 사게 됐다. 반대로 중고로 팔 때는 값을 더 쳐 준다고 하면 더 내놓고 싶어진다.",
  },
  {
    id: "shape",
    prompt:
      "같은 ‘우하향’이라도 직선인 사례와 반비례 곡선인 사례는 모습이 달랐어요. 두 사례에서 가격이 2배가 될 때 수요량이 어떻게 달라졌는지 비교해 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 직선인 영화 티켓은 값이 오른 만큼 일정하게 줄었는데, 반비례인 운동화는 값이 2배가 되니 수요량이 정확히 절반이 되었다.",
  },
  {
    id: "flip",
    prompt:
      "경제학에서는 가격을 세로축, 수량을 가로축에 놓아 수학과 반대로 그렸어요. 두 그래프가 왜 y = x에 대칭인지, 그리고 축을 바꿔도 변하지 않는 것은 무엇인지 자기 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 가로와 세로에 넣는 값을 서로 맞바꾼 것이라 y = x에 대칭이 된다. 축을 바꿔도 ‘값이 오르면 수요량이 준다’는 관계 자체는 그대로다.",
  },
];

type Tab = "demand" | "supply" | "flip" | "problem";

export default function DemandSupplyLab() {
  const [tab, setTab] = useState<Tab>("demand");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🏷️ 수요함수와 공급함수</h3>
        <p className="mt-2 leading-7 text-slate-300">
          값이 오르면 사려는 사람은 줄고, 팔려는 사람은 늘어요. 가격 <b className="text-slate-100">x</b>에 따라{" "}
          <b className="text-emerald-200">수요량 Qd</b>와 <b className="text-sky-200">공급량 Qs</b>가 어떻게 정해지는지
          여러 사례로 만나 보고, 경제학이 그래프를 뒤집어 그리는 까닭까지 알아봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "demand"} onClick={() => setTab("demand")}>① 수요함수</TabButton>
        <TabButton active={tab === "supply"} onClick={() => setTab("supply")}>② 공급함수</TabButton>
        <TabButton active={tab === "flip"} onClick={() => setTab("flip")}>③ 경제학은 왜 뒤집어 그릴까</TabButton>
        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>④ 단계별 문제</TabButton>
      </div>

      <div className="mt-4">
        {tab === "demand" ? <MarketTab side="demand" /> : null}
        {tab === "supply" ? <MarketTab side="supply" /> : null}
        {tab === "flip" ? <FlipTab /> : null}
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
const CURVE_COLOR: Record<string, string> = {
  emerald: "#34d399",
  sky: "#38bdf8",
  amber: "#fbbf24",
  violet: "#a78bfa",
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
        <p className={"font-mono text-base font-bold " + TONE_TEXT[tone]}>{display}</p>
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

// ══════════════════════════════════════════════════════════════
//  좌표평면 (수학식 — 가로축 가격, 세로축 수량)
// ══════════════════════════════════════════════════════════════
const CW = 380,
  CH = 260,
  PL = 54,
  PR = 18,
  PT = 34,
  PB = 36;

function CurveChart({ c, x }: { c: MarketCase; x: number }) {
  const qMax = qMaxOf(c) * 1.06;
  const X = (v: number) => PL + (v / c.xMax) * (CW - PL - PR);
  const Y = (v: number) => CH - PB - (v / qMax) * (CH - PT - PB);
  const pts = Array.from({ length: 121 }, (_, i) => {
    const v = c.xMin + (i / 120) * (c.xMax - c.xMin);
    return `${X(v)},${Y(Math.max(0, qOf(c, v)))}`;
  }).join(" ");
  const q = qOf(c, x);
  const color = CURVE_COLOR[c.tone];
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <div className="overflow-x-auto overflow-y-hidden">
        <svg viewBox={`0 0 ${CW} ${CH}`} className="h-auto w-full min-w-[320px]" role="img" aria-label={`${c.name}의 ${c.side === "demand" ? "수요곡선" : "공급곡선"}`}>
          <rect x={0} y={0} width={CW} height={CH} rx={10} fill="#0b1220" />
          {ticks.map((r) => (
            <g key={`y${r}`}>
              <line x1={PL} y1={Y(r * qMax)} x2={CW - PR} y2={Y(r * qMax)} stroke="rgba(148,163,184,0.15)" strokeWidth={0.8} />
              <text x={PL - 6} y={Y(r * qMax)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                {Math.round(r * qMax).toLocaleString("ko-KR")}
              </text>
            </g>
          ))}
          {ticks.map((r) => (
            <g key={`x${r}`}>
              <line x1={X(r * c.xMax)} y1={PT} x2={X(r * c.xMax)} y2={CH - PB} stroke="rgba(148,163,184,0.12)" strokeWidth={0.8} />
              <text x={X(r * c.xMax)} y={CH - PB + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                {fmt(r * c.xMax, 1)}
              </text>
            </g>
          ))}
          <polyline points={pts} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          <line x1={X(x)} y1={Y(Math.max(0, q))} x2={X(x)} y2={CH - PB} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.75} />
          <line x1={PL} y1={Y(Math.max(0, q))} x2={X(x)} y2={Y(Math.max(0, q))} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.75} />
          <circle cx={X(x)} cy={Y(Math.max(0, q))} r={6} fill="#fff" />
          <circle cx={X(x)} cy={Y(Math.max(0, q))} r={3.6} fill="#f43f5e" />
          <line x1={PL} y1={CH - PB} x2={CW - PR} y2={CH - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <line x1={PL} y1={PT} x2={PL} y2={CH - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <text x={CW - PR} y={CH - PB + 27} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            가격 x ({c.priceUnit})
          </text>
          {/* 세로축 이름은 왼쪽 위에서 오른쪽으로 (왼쪽 밖으로 잘리지 않게) */}
          <text x={10} y={17} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            {c.side === "demand" ? "수요량 Qd" : "공급량 Qs"} ({c.qtyUnit})
          </text>
        </svg>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 수요함수 · 탭 ② 공급함수
// ══════════════════════════════════════════════════════════════
function MarketTab({ side }: { side: Side }) {
  const list = side === "demand" ? DEMAND_CASES : SUPPLY_CASES;
  const [cid, setCid] = useState(list[0].id);
  const c = caseOf(cid);
  const [x, setX] = useState(list[0].x0);
  const [prev, setPrev] = useState<{ x: number; q: number } | null>(null);

  const q = qOf(c, x);
  const isD = side === "demand";
  const bumpBy = Math.max(c.xStep, Math.round(((c.xMax - c.xMin) / 8 / c.xStep)) * c.xStep);

  function pick(next: MarketCase) {
    setCid(next.id);
    setX(next.x0);
    setPrev(null);
  }
  function bump(d: number) {
    const nx = Math.min(c.xMax, Math.max(c.xMin, Number((x + d).toFixed(4))));
    if (nx === x) return;
    setPrev({ x, q: qOf(c, x) });
    setX(nx);
  }

  const dq = prev ? q - prev.q : 0;

  return (
    <div className="space-y-4">
      {/* 개념 */}
      <div className="grid gap-2 sm:grid-cols-2">
        <TermCard
          emoji={isD ? "🙋" : "🏭"}
          title={isD ? "수요 (Demand)" : "공급 (Supply)"}
          body={isD ? "소비자가 주어진 가격으로 상품을 구입하고자 하는 욕구" : "생산자가 주어진 가격으로 상품을 판매하고자 하는 욕구"}
          tone={isD ? "emerald" : "sky"}
        />
        <TermCard
          emoji="🔢"
          title={isD ? "수요량 (Quantity of Demand)" : "공급량 (Quantity of Supply)"}
          body={isD ? "그 가격에서 구입하고자 하는 상품의 양" : "그 가격에서 판매하고자 하는 상품의 양"}
          tone={isD ? "emerald" : "sky"}
        />
      </div>

      <div className={"rounded-2xl border-2 p-4 " + (isD ? "border-emerald-400/40 bg-emerald-400/[0.07]" : "border-sky-400/40 bg-sky-400/[0.07]")}>
        <p className={"text-sm font-bold " + (isD ? "text-emerald-200" : "text-sky-200")}>
          📜 {isD ? "수요의 법칙" : "공급의 법칙"}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          가격이 오르면 {isD ? "수요량은 줄고" : "공급량은 늘고"}, 가격이 내리면 {isD ? "수요량은 늘어요" : "공급량은 줄어요"}. 그래서{" "}
          {isD ? "수요곡선" : "공급곡선"}은 <b className={isD ? "text-emerald-100" : "text-sky-100"}>{isD ? "오른쪽 아래로 (우하향)" : "오른쪽 위로 (우상향)"}</b>{" "}
          향합니다. 가격 말고 다른 조건은 모두 그대로라고 보고 그린 그래프예요.
        </p>
      </div>

      {/* 사례 */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => pick(m)}
            className={
              "rounded-xl border-2 p-3 text-left transition " +
              (cid === m.id ? TONE_ON[m.tone] : "border-white/10 bg-white/5 hover:bg-white/10")
            }
          >
            <p className="text-sm font-bold text-slate-100">
              {m.emoji} {m.name}
            </p>
            <div className="mt-0.5 overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
              <Katex expr={fnTex(m)} />
            </div>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{m.story}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <CurveChart c={c} x={x} />
          <p className="text-center text-[11px] text-slate-400">
            📐 {c.shape} · 가로축 가격, 세로축 {isD ? "수요량" : "공급량"} (수학에서 그리는 방식)
          </p>
        </div>

        <div className="space-y-2">
          <Slider
            label={`가격 x (${c.priceUnit})`}
            value={x}
            display={`${fmt(x)} ${c.priceUnit}`}
            min={c.xMin}
            max={c.xMax}
            step={c.xStep}
            onChange={(v) => {
              setPrev(null);
              setX(v);
            }}
            tone={c.tone}
          />

          <div className={"rounded-2xl border-2 p-4 text-center " + (isD ? "border-emerald-400/40 bg-emerald-400/[0.08]" : "border-sky-400/40 bg-sky-400/[0.08]")}>
            <p className={"text-xs font-bold " + (isD ? "text-emerald-200" : "text-sky-200")}>
              {isD ? "수요량" : "공급량"} {isD ? "Qd" : "Qs"}
            </p>
            <p className={"mt-0.5 font-mono text-4xl font-bold " + (isD ? "text-emerald-100" : "text-sky-100")}>
              {fmt(Math.max(0, q), 1)}
              <span className="ml-1 text-base">{c.qtyUnit}</span>
            </p>
            <FormulaLine expr={substTex(c, x)} className="mt-1 text-slate-100" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-xs font-bold text-slate-300">🧪 값을 바꿔 보면?</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => bump(-bumpBy)}
                className="flex-1 rounded-lg border-2 border-sky-400/50 bg-sky-400/12 px-3 py-2 text-xs font-bold text-sky-100 transition hover:bg-sky-400/22"
              >
                ⬇️ 값 내리기 (−{fmt(bumpBy)} {c.priceUnit})
              </button>
              <button
                type="button"
                onClick={() => bump(bumpBy)}
                className="flex-1 rounded-lg border-2 border-rose-400/50 bg-rose-400/12 px-3 py-2 text-xs font-bold text-rose-100 transition hover:bg-rose-400/22"
              >
                ⬆️ 값 올리기 (+{fmt(bumpBy)} {c.priceUnit})
              </button>
            </div>
            {prev ? (
              <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
                <p className="font-mono text-xs text-slate-300">
                  가격 {fmt(prev.x)} → <b className="text-slate-100">{fmt(x)}</b> {c.priceUnit}
                </p>
                <p className="mt-0.5 font-mono text-sm">
                  <span className="text-slate-400">{fmt(Math.max(0, prev.q), 1)}</span>
                  <span className="mx-1 text-slate-500">→</span>
                  <b className="text-slate-100">{fmt(Math.max(0, q), 1)}</b>
                  <span className="text-slate-400"> {c.qtyUnit}</span>
                </p>
                <p className={"mt-0.5 text-xs font-bold " + (dq < 0 ? "text-rose-200" : dq > 0 ? "text-emerald-200" : "text-slate-400")}>
                  {dq < 0 ? "▼" : dq > 0 ? "▲" : "—"} {fmt(Math.abs(dq), 1)}
                  {c.qtyUnit} {dq < 0 ? "감소" : dq > 0 ? "증가" : "변화 없음"}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-center text-[11px] text-slate-500">
                버튼을 눌러 {isD ? "수요의 법칙" : "공급의 법칙"}이 정말 그런지 확인해 보세요.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 값 표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">🔢 가격에 따른 {isD ? "수요량" : "공급량"}</p>
        <div className="mt-2 overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[380px] border-collapse text-center font-mono text-xs">
            <tbody>
              <tr>
                <th className="border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-bold text-slate-400">
                  가격 ({c.priceUnit})
                </th>
                {c.table.map((p) => (
                  <td
                    key={p}
                    className={
                      "border border-white/10 px-2 py-1.5 font-bold " +
                      (Math.abs(p - x) < c.xStep / 2 ? "bg-amber-400/25 text-amber-100" : "bg-white/5 text-slate-300")
                    }
                  >
                    {fmt(p)}
                  </td>
                ))}
              </tr>
              <tr>
                <th className={"border border-white/10 px-2 py-1.5 text-[10px] font-bold " + (isD ? "bg-emerald-400/10 text-emerald-200" : "bg-sky-400/10 text-sky-200")}>
                  {isD ? "수요량" : "공급량"} ({c.qtyUnit})
                </th>
                {c.table.map((p) => (
                  <td
                    key={p}
                    className={
                      "border border-white/10 px-2 py-1.5 " +
                      (Math.abs(p - x) < c.xStep / 2 ? "bg-amber-400/25 font-bold text-amber-100" : "text-slate-300")
                    }
                  >
                    {fmt(qOf(c, p), 1)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-400">
          표를 왼쪽에서 오른쪽으로 읽어 보세요. 가격이 커질수록 {isD ? "수요량은 계속 줄어듭니다" : "공급량은 계속 늘어납니다"}.
        </p>
      </div>
    </div>
  );
}

function TermCard({ emoji, title, body, tone }: { emoji: string; title: string; body: string; tone: string }) {
  const cls: Record<string, string> = {
    emerald: "border-emerald-400/30 bg-emerald-400/[0.06]",
    sky: "border-sky-400/30 bg-sky-400/[0.06]",
  };
  return (
    <div className={"rounded-2xl border p-3 " + cls[tone]}>
      <p className="text-sm font-bold text-slate-100">
        {emoji} {title}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-300">{body}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 경제학은 왜 뒤집어 그릴까
// ══════════════════════════════════════════════════════════════
const FW = 350,
  FH = 336,
  FL = 54,
  FT = 34,
  PLOT = 250;

function FlipTab() {
  const [cid, setCid] = useState(FLIP_IDS[0]);
  const c = caseOf(cid);
  const [x, setX] = useState(caseOf(FLIP_IDS[0]).x0);
  const [t, setT] = useState(0);
  const [anim, setAnim] = useState<{ from: number; to: number; n: number } | null>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!anim) return;
    const started = performance.now();
    const dur = 900;
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - started) / dur);
      // 부드럽게 (ease-in-out)
      const e = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p);
      setT(anim.from + (anim.to - anim.from) * e);
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [anim]);

  function pick(next: MarketCase) {
    setAnim(null);
    setCid(next.id);
    setX(next.x0);
  }
  function flip() {
    setN(n + 1);
    setAnim({ from: t, to: t < 0.5 ? 1 : 0, n: n + 1 });
  }

  const qMax = qMaxOf(c) * 1.06;
  const q = Math.max(0, qOf(c, x));
  const color = CURVE_COLOR[c.tone];
  const isD = c.side === "demand";

  const P = (u: number, w: number) => ({
    x: FL + ((1 - t) * u + t * w) * PLOT,
    y: FT + PLOT - ((1 - t) * w + t * u) * PLOT,
  });
  const pts = Array.from({ length: 121 }, (_, i) => {
    const v = c.xMin + (i / 120) * (c.xMax - c.xMin);
    const p = P(v / c.xMax, Math.max(0, qOf(c, v)) / qMax);
    return `${p.x},${p.y}`;
  }).join(" ");
  const cur = P(x / c.xMax, q / qMax);
  const mathOp = Math.max(0, 1 - 2 * t);
  const econOp = Math.max(0, 2 * t - 1);
  const rs = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-sky-400/35 bg-sky-400/[0.07] p-3">
          <p className="text-sm font-bold text-sky-200">📐 수학에서는</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            수요량·공급량이 <b className="text-slate-100">가격의 함수</b>이므로, 가격을 <b className="text-sky-100">x축</b>에,
            수량을 <b className="text-sky-100">y축</b>에 놓습니다.
          </p>
          <AxisMini xName="가격" yName="수량" tone="#38bdf8" />
        </div>
        <div className="rounded-2xl border-2 border-amber-400/35 bg-amber-400/[0.07] p-3">
          <p className="text-sm font-bold text-amber-200">💹 경제학에서는</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            반대로 가격을 <b className="text-amber-100">y축</b>에, 수량을 <b className="text-amber-100">x축</b>에 놓고
            그립니다. 경제학자 Alfred Marshall이 그렇게 그린 뒤로 굳어진 관습이에요.
          </p>
          <AxisMini xName="수량" yName="가격" tone="#fbbf24" />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {FLIP_IDS.map((id) => {
          const m = caseOf(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => pick(m)}
              className={
                "rounded-xl border-2 p-2.5 text-left transition " +
                (cid === id ? TONE_ON[m.tone] : "border-white/10 bg-white/5 hover:bg-white/10")
              }
            >
              <p className="text-xs font-bold text-slate-200">
                {m.emoji} {m.name} <span className="text-slate-500">· {m.side === "demand" ? "수요" : "공급"}</span>
              </p>
              <div className="overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
                <Katex expr={fnTex(m)} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
          <div className="overflow-x-auto overflow-y-hidden">
            <svg viewBox={`0 0 ${FW} ${FH}`} className="h-auto w-full min-w-[320px]" role="img" aria-label="축을 맞바꾸는 그래프">
              <rect x={0} y={0} width={FW} height={FH} rx={10} fill="#0b1220" />
              {/* 대칭축 y = x */}
              <line x1={FL} y1={FT + PLOT} x2={FL + PLOT} y2={FT} stroke="#f472b6" strokeWidth={1.2} strokeDasharray="5 4" opacity={0.55} />
              <text x={FL + PLOT - 4} y={FT + 12} textAnchor="end" fill="#f9a8d4" fontSize={10} fontWeight={700}>
                대칭축 y = x
              </text>

              {/* 눈금 */}
              {rs.map((r) => (
                <g key={`g${r}`}>
                  <line x1={FL + r * PLOT} y1={FT} x2={FL + r * PLOT} y2={FT + PLOT} stroke="rgba(148,163,184,0.12)" strokeWidth={0.8} />
                  <line x1={FL} y1={FT + PLOT - r * PLOT} x2={FL + PLOT} y2={FT + PLOT - r * PLOT} stroke="rgba(148,163,184,0.12)" strokeWidth={0.8} />
                  {/* 가로축 눈금 — 수학이면 가격, 경제학이면 수량 */}
                  <text x={FL + r * PLOT} y={FT + PLOT + 14} textAnchor="middle" fill="#7dd3fc" fontSize={9} fontFamily="monospace" opacity={mathOp}>
                    {fmt(r * c.xMax, 1)}
                  </text>
                  <text x={FL + r * PLOT} y={FT + PLOT + 14} textAnchor="middle" fill="#fcd34d" fontSize={9} fontFamily="monospace" opacity={econOp}>
                    {Math.round(r * qMax).toLocaleString("ko-KR")}
                  </text>
                  {/* 세로축 눈금 */}
                  <text x={FL - 6} y={FT + PLOT - r * PLOT} dy={3} textAnchor="end" fill="#7dd3fc" fontSize={9} fontFamily="monospace" opacity={mathOp}>
                    {Math.round(r * qMax).toLocaleString("ko-KR")}
                  </text>
                  <text x={FL - 6} y={FT + PLOT - r * PLOT} dy={3} textAnchor="end" fill="#fcd34d" fontSize={9} fontFamily="monospace" opacity={econOp}>
                    {fmt(r * c.xMax, 1)}
                  </text>
                </g>
              ))}

              <polyline points={pts} fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
              <line x1={cur.x} y1={cur.y} x2={cur.x} y2={FT + PLOT} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.75} />
              <line x1={FL} y1={cur.y} x2={cur.x} y2={cur.y} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.75} />
              <circle cx={cur.x} cy={cur.y} r={6} fill="#fff" />
              <circle cx={cur.x} cy={cur.y} r={3.6} fill="#f43f5e" />

              <line x1={FL} y1={FT + PLOT} x2={FL + PLOT} y2={FT + PLOT} stroke="#94a3b8" strokeWidth={1.2} />
              <line x1={FL} y1={FT} x2={FL} y2={FT + PLOT} stroke="#94a3b8" strokeWidth={1.2} />

              {/* 축 이름 — 크로스페이드 */}
              <text x={FL + PLOT} y={FT + PLOT + 30} textAnchor="end" fill="#7dd3fc" fontSize={11} fontWeight={700} opacity={mathOp}>
                가격 x ({c.priceUnit})
              </text>
              <text x={FL + PLOT} y={FT + PLOT + 30} textAnchor="end" fill="#fcd34d" fontSize={11} fontWeight={700} opacity={econOp}>
                {isD ? "수요량 Qd" : "공급량 Qs"} ({c.qtyUnit})
              </text>
              <text x={10} y={17} textAnchor="start" fill="#7dd3fc" fontSize={11} fontWeight={700} opacity={mathOp}>
                {isD ? "수요량 Qd" : "공급량 Qs"} ({c.qtyUnit})
              </text>
              <text x={10} y={17} textAnchor="start" fill="#fcd34d" fontSize={11} fontWeight={700} opacity={econOp}>
                가격 x ({c.priceUnit})
              </text>
            </svg>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 px-1 pb-1">
            <button
              type="button"
              onClick={flip}
              className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-3 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
            >
              🔄 {t < 0.5 ? "경제학식으로 뒤집기" : "수학식으로 되돌리기"}
            </button>
            <span className="ml-auto font-mono text-[10px] text-slate-500">
              {t < 0.02 ? "📐 수학식" : t > 0.98 ? "💹 경제학식" : `뒤집는 중 ${Math.round(t * 100)}%`}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Slider
            label="뒤집기"
            value={Math.round(t * 100)}
            display={`${Math.round(t * 100)} %`}
            min={0}
            max={100}
            step={1}
            onChange={(v) => {
              setAnim(null);
              setT(v / 100);
            }}
            tone="violet"
          />
          <Slider
            label={`가격 x (${c.priceUnit})`}
            value={x}
            display={`${fmt(x)} ${c.priceUnit}`}
            min={c.xMin}
            max={c.xMax}
            step={c.xStep}
            onChange={setX}
            tone={c.tone}
          />
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
            <p className="font-mono text-sm text-slate-200">
              (가격 <b className="text-slate-100">{fmt(x)}</b>, {isD ? "수요량" : "공급량"}{" "}
              <b className="text-slate-100">{fmt(q, 1)}</b>)
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              두 그림에서 빨간 점이 가리키는 값은 똑같아요. 자리만 바뀔 뿐이죠.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-sky-400/35 bg-sky-400/[0.07] p-3" style={{ opacity: 0.45 + 0.55 * (1 - t) }}>
            <p className="text-xs font-bold text-sky-200">📐 수학식 — 수량을 가격의 함수로</p>
            <FormulaLine expr={fnTex(c)} className="text-slate-100" />
          </div>
          <div className="rounded-2xl border-2 border-amber-400/35 bg-amber-400/[0.07] p-3" style={{ opacity: 0.45 + 0.55 * t }}>
            <p className="text-xs font-bold text-amber-200">💹 경제학식 — 가격을 수량의 함수로 (역함수)</p>
            <FormulaLine expr={invTex(c)} className="text-slate-100" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.06] p-4">
        <p className="text-sm font-bold text-violet-200">🔍 무엇이 바뀌고, 무엇이 그대로일까?</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] leading-5 text-slate-300">
            <b className="text-rose-200">바뀌는 것</b> — 가로축과 세로축에 무엇을 놓느냐. 그래서 그래프는 대각선{" "}
            <b className="text-slate-100">y = x</b>에 대칭으로 접힌 모습이 됩니다. 이것이 바로{" "}
            <b className="text-slate-100">역함수의 그래프</b>예요.
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] leading-5 text-slate-300">
            <b className="text-emerald-200">그대로인 것</b> — 가격과 수량이 짝지어지는 관계 그 자체. 그래서 수요곡선은
            어느 쪽으로 그려도 <b className="text-slate-100">우하향</b>, 공급곡선은 <b className="text-slate-100">우상향</b>입니다.
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {FLIP_QUIZZES.map((z) => (
          <MiniQuiz key={z.id} q={z.q} options={z.options} answer={z.answer} why={z.why} />
        ))}
      </div>
    </div>
  );
}

function AxisMini({ xName, yName, tone }: { xName: string; yName: string; tone: string }) {
  return (
    <div className="mt-2 overflow-x-auto overflow-y-hidden">
      <svg viewBox="0 0 200 110" className="h-auto w-full min-w-[180px]" role="img" aria-label={`가로축 ${xName}, 세로축 ${yName}`}>
        <rect x={0} y={0} width={200} height={110} rx={8} fill="#0b1220" />
        <line x1={30} y1={88} x2={186} y2={88} stroke="#94a3b8" strokeWidth={1.4} />
        <line x1={30} y1={16} x2={30} y2={88} stroke="#94a3b8" strokeWidth={1.4} />
        <path d="M186,88 l-6,-3 l0,6 z" fill="#94a3b8" />
        <path d="M30,16 l-3,6 l6,0 z" fill="#94a3b8" />
        <text x={186} y={102} textAnchor="end" fill={tone} fontSize={11} fontWeight={700}>
          {xName}
        </text>
        <text x={8} y={13} textAnchor="start" fill={tone} fontSize={11} fontWeight={700}>
          {yName}
        </text>
      </svg>
    </div>
  );
}

function MiniQuiz({ q, options, answer, why }: { q: string; options: string[]; answer: number; why: string }) {
  const [pick, setPick] = useState<number | null>(null);
  const ok = pick === answer;
  return (
    <div className={"rounded-xl border p-3 transition " + (ok ? "border-emerald-400/50 bg-emerald-400/[0.09]" : "border-white/10 bg-white/5")}>
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
          <p className="text-sm font-bold text-violet-200">🧩 수요·공급함수 단계별 문제</p>
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
        <div className="mt-1.5 grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            <p className="text-sm leading-7 text-slate-300">{prob.scenario}</p>
            <FormulaLine expr={prob.tex} className="mt-1 text-slate-100" />
          </div>
          {prob.table ? (
            <div className="overflow-x-auto overflow-y-hidden">
              <table className="w-full min-w-[200px] border-collapse text-center text-xs">
                <thead>
                  <tr>
                    {prob.table.head.map((h) => (
                      <th key={h} className="border border-white/15 bg-sky-500/25 px-2 py-1.5 font-bold text-sky-50">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prob.table.rows.map((r) => (
                    <tr key={r[0]}>
                      {r.map((v) => (
                        <td key={v} className="border border-white/15 px-2 py-1.5 font-mono text-slate-200">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
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
                      아직 아니에요. {ss.tries >= 2 ? "힌트를 열어 보세요." : "식에 값을 넣어 다시 계산해 볼까요?"}
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
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 네 문제를 모두 해결했어요! 수요·공급함수 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
