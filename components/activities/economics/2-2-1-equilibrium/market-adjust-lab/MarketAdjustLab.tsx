"use client";

import { useEffect, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  FLOW_OVER,
  FLOW_SHORT,
  NEWS,
  NEWS_WRAP,
  PROBLEMS,
  SHOPS,
  demandTex,
  eqOf,
  excessOf,
  fmt,
  nextPrice,
  qd,
  qs,
  shopOf,
  supplyTex,
  type PStep,
  type Shop,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "converge",
    prompt:
      "아무도 시키지 않았는데 시장가격이 스스로 균형가격을 찾아갔어요. 누가 어떤 마음으로 값을 움직였기에 그렇게 되는지, 초과 공급과 초과 수요를 나누어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 물건이 남으면 가게가 손해를 보기 싫어 값을 내리고, 물건이 모자라면 더 비싸게 사겠다는 사람이 나타나 값이 오른다. 그래서 남지도 모자라지도 않는 값으로 모인다.",
  },
  {
    id: "news",
    prompt:
      "‘완판·웃돈’ 뉴스와 ‘재고·떨이’ 뉴스를 보고 시장 상태를 읽어 봤어요. 최근에 본 뉴스나 내 경험 중 하나를 골라 초과 수요인지 초과 공급인지 판단하고 그 까닭을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 인기 아이돌 굿즈가 몇 초 만에 품절되고 중고로 두 배에 팔리는 걸 봤다. 정가가 균형가격보다 낮아 초과 수요가 생긴 것 같다.",
  },
  {
    id: "distance",
    prompt:
      "시장가격이 균형가격에서 멀수록 남거나 모자라는 양이 커졌어요. 이 사실이 시장가격이 균형으로 돌아오는 속도와 어떤 관계가 있을지 자기 생각을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 많이 남을수록 값을 크게 내리게 되니 처음에는 값이 확 움직이고, 균형에 가까워질수록 조금씩만 움직여 천천히 다가간다.",
  },
];

type Tab = "gap" | "journey" | "problem";

export default function MarketAdjustLab() {
  const [tab, setTab] = useState<Tab>("gap");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🧭 시장가격과 균형가격</h3>
        <p className="mt-2 leading-7 text-slate-300">
          가게가 매긴 <b className="text-fuchsia-200">시장가격</b>이 <b className="text-amber-200">균형가격</b>과 다르면
          물건이 남거나 모자라요. 그러면 아무도 시키지 않아도 값이 저절로 움직이기 시작합니다. 그 여정을 하루씩 따라가
          봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "gap"} onClick={() => setTab("gap")}>① 남을까, 모자랄까</TabButton>
        <TabButton active={tab === "journey"} onClick={() => setTab("journey")}>② 균형을 찾아가는 여정</TabButton>
        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>③ 단계별 문제</TabButton>
      </div>

      <div className="mt-4">
        {tab === "gap" ? <GapTab /> : null}
        {tab === "journey" ? <JourneyTab /> : null}
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

// ══════════════════════════════════════════════════════════════
//  수요·공급 그래프 (가로축 가격 x, 세로축 수량 Q — 교과서와 같은 방식)
// ══════════════════════════════════════════════════════════════
const W = 400,
  H = 300,
  PL = 52,
  PR = 22,
  PT = 34,
  PB = 38;

function GapChart({ s, price, trail = [] }: { s: Shop; price: number; trail?: number[] }) {
  const eq = eqOf(s);
  const qTop = Math.max(qd(s, 0), qs(s, s.xMax)) * 1.08 || 1;
  const X = (v: number) => PL + (v / s.xMax) * (W - PL - PR);
  const Y = (v: number) => H - PB - (v / qTop) * (H - PT - PB);
  const line = (f: (x: number) => number) =>
    Array.from({ length: 121 }, (_, i) => {
      const x = (i / 120) * s.xMax;
      return `${X(x)},${Y(f(x))}`;
    }).join(" ");

  const D = qd(s, price);
  const S = qs(s, price);
  const over = S > D;
  const balanced = Math.abs(S - D) < 0.5;
  const top = Math.max(D, S);
  const bot = Math.min(D, S);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <div className="overflow-x-auto overflow-y-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[320px]" role="img" aria-label={`${s.name} 시장의 시장가격과 균형가격`}>
          <rect x={0} y={0} width={W} height={H} rx={10} fill="#0b1220" />
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <line key={`g${r}`} x1={PL} y1={Y(r * qTop)} x2={W - PR} y2={Y(r * qTop)} stroke="rgba(148,163,184,0.11)" strokeWidth={0.8} />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <g key={`x${r}`}>
              <line x1={X(r * s.xMax)} y1={PT} x2={X(r * s.xMax)} y2={H - PB} stroke="rgba(148,163,184,0.1)" strokeWidth={0.8} />
              <text x={X(r * s.xMax)} y={H - PB + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                {fmt(r * s.xMax, 0)}
              </text>
            </g>
          ))}

          {/* 균형 */}
          <line x1={X(eq.x)} y1={Y(eq.q)} x2={X(eq.x)} y2={H - PB} stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 3" opacity={0.75} />
          <line x1={PL} y1={Y(eq.q)} x2={X(eq.x)} y2={Y(eq.q)} stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 3" opacity={0.75} />
          <text x={PL - 6} y={Y(eq.q)} dy={3} textAnchor="end" fill="#fcd34d" fontSize={9} fontFamily="monospace">
            {fmt(eq.q, 0)}
          </text>

          {/* 시장가격에서의 두 수량 */}
          {!balanced ? (
            <>
              <line x1={PL} y1={Y(top)} x2={X(price)} y2={Y(top)} stroke="#f8fafc" strokeWidth={0.9} strokeDasharray="3 3" opacity={0.5} />
              <line x1={PL} y1={Y(bot)} x2={X(price)} y2={Y(bot)} stroke="#f8fafc" strokeWidth={0.9} strokeDasharray="3 3" opacity={0.5} />
              <text x={PL - 6} y={Y(top)} dy={3} textAnchor="end" fill="#e2e8f0" fontSize={9} fontFamily="monospace">
                {fmt(top, 0)}
              </text>
              <text x={PL - 6} y={Y(bot)} dy={3} textAnchor="end" fill="#e2e8f0" fontSize={9} fontFamily="monospace">
                {fmt(bot, 0)}
              </text>
            </>
          ) : null}
          <line x1={X(price)} y1={PT} x2={X(price)} y2={H - PB} stroke="#e879f9" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.85} />

          <polyline points={line((x) => qd(s, x))} fill="none" stroke={D_COLOR} strokeWidth={3} strokeLinecap="round" />
          <polyline points={line((x) => qs(s, x))} fill="none" stroke={S_COLOR} strokeWidth={3} strokeLinecap="round" />

          {/* 초과량 양방향 화살표 */}
          {!balanced ? (
            <g>
              <line x1={X(price)} y1={Y(top) + 6} x2={X(price)} y2={Y(bot) - 6} stroke="#fff" strokeWidth={1.8} />
              <path d={`M${X(price)},${Y(top)} l-4,7 l8,0 z`} fill="#fff" />
              <path d={`M${X(price)},${Y(bot)} l-4,-7 l8,0 z`} fill="#fff" />
              <rect x={X(price) + 8} y={(Y(top) + Y(bot)) / 2 - 10} width={70} height={19} rx={5} fill={over ? "rgba(251,146,60,0.9)" : "rgba(56,189,248,0.9)"} />
              <text x={X(price) + 43} y={(Y(top) + Y(bot)) / 2 + 3} textAnchor="middle" fill="#0b1220" fontSize={10} fontWeight={700}>
                {over ? "초과 공급량" : "초과 수요량"}
              </text>
            </g>
          ) : null}

          {/* 지나온 가격 자취 */}
          {trail.map((t, i) => (
            <circle key={i} cx={X(t)} cy={H - PB} r={3} fill="#e879f9" opacity={0.25 + (0.5 * i) / Math.max(1, trail.length - 1)} />
          ))}

          <circle cx={X(eq.x)} cy={Y(eq.q)} r={6} fill="#fff" />
          <circle cx={X(eq.x)} cy={Y(eq.q)} r={3.4} fill="#fbbf24" />
          <circle cx={X(price)} cy={Y(D)} r={5} fill={D_COLOR} stroke="#fff" strokeWidth={1.4} />
          <circle cx={X(price)} cy={Y(S)} r={5} fill={S_COLOR} stroke="#fff" strokeWidth={1.4} />

          <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <text x={X(eq.x)} y={H - PB + 25} textAnchor="middle" fill="#fcd34d" fontSize={9.5} fontWeight={700}>
            균형가격
          </text>
          {!balanced ? (
            <text x={X(price)} y={H - PB + 25} textAnchor="middle" fill="#f0abfc" fontSize={9.5} fontWeight={700}>
              시장가격
            </text>
          ) : null}
          <text x={W - PR} y={H - PB + 34} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            가격 x ({s.priceUnit})
          </text>
          <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            수량 Q ({s.unit})
          </text>
          <text x={W - PR - 4} y={Y(qd(s, s.xMax * 0.88)) - 7} textAnchor="end" fill={D_COLOR} fontSize={11} fontWeight={700}>
            Qd
          </text>
          <text x={W - PR - 4} y={Y(qs(s, s.xMax * 0.88)) - 7} textAnchor="end" fill={S_COLOR} fontSize={11} fontWeight={700}>
            Qs
          </text>
        </svg>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 남을까, 모자랄까
// ══════════════════════════════════════════════════════════════
function GapTab() {
  const [sid, setSid] = useState(SHOPS[0].id);
  const s = shopOf(sid);
  const eq = eqOf(s);
  const [price, setPrice] = useState(SHOPS[0].startHigh);

  const gap = excessOf(s, price);
  const over = gap > 0.5;
  const short = gap < -0.5;

  function pick(next: Shop) {
    setSid(next.id);
    setPrice(next.startHigh);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-orange-400/45 bg-orange-400/[0.08] p-3">
          <p className="text-sm font-bold text-orange-200">📦 (시장가격) &gt; (균형가격)</p>
          <p className="mt-1 text-sm font-bold text-orange-100">⇒ 초과 공급 발생</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-300">팔리지 않은 물건이 남아요.</p>
        </div>
        <div className="rounded-2xl border-2 border-sky-400/45 bg-sky-400/[0.08] p-3">
          <p className="text-sm font-bold text-sky-200">🙋 (시장가격) &lt; (균형가격)</p>
          <p className="mt-1 text-sm font-bold text-sky-100">⇒ 초과 수요 발생</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-300">사고 싶어도 못 사는 사람이 생겨요.</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {SHOPS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => pick(x)}
            className={
              "rounded-xl border-2 p-3 text-left transition " +
              (sid === x.id ? TONE_ON[x.tone] : "border-white/10 bg-white/5 hover:bg-white/10")
            }
          >
            <p className="text-sm font-bold text-slate-100">
              {x.emoji} {x.name}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{x.story}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <GapChart s={s} price={price} />

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-amber-400/40 bg-amber-400/[0.08] px-3 py-2 text-center">
              <p className="text-[10px] text-slate-400">균형가격</p>
              <p className="font-mono text-lg font-bold text-amber-100">
                {fmt(eq.x)} {s.priceUnit}
              </p>
            </div>
            <div className="rounded-xl border border-fuchsia-400/40 bg-fuchsia-400/[0.08] px-3 py-2 text-center">
              <p className="text-[10px] text-slate-400">내가 매긴 시장가격</p>
              <p className="font-mono text-lg font-bold text-fuchsia-100">
                {fmt(price)} {s.priceUnit}
              </p>
            </div>
          </div>

          <Slider
            label={`시장가격 (${s.priceUnit})`}
            value={price}
            display={`${fmt(price)} ${s.priceUnit}`}
            min={0}
            max={s.xMax}
            step={s.xStep}
            onChange={setPrice}
            accent="accent-fuchsia-400"
          />

          <div
            className={
              "rounded-2xl border-2 p-4 text-center " +
              (over
                ? "border-orange-400/55 bg-orange-400/[0.10]"
                : short
                  ? "border-sky-400/55 bg-sky-400/[0.10]"
                  : "border-amber-400/60 bg-amber-400/[0.12]")
            }
          >
            {over ? (
              <>
                <p className="text-2xl">📦📦📦</p>
                <p className="mt-1 text-sm font-bold text-orange-100">
                  초과 공급 — {s.surplusWord} {fmt(gap, 0)}
                  {s.unit}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-300">
                  공급량 {fmt(qs(s, price), 0)} − 수요량 {fmt(qd(s, price), 0)} = {fmt(gap, 0)}
                </p>
                <p className="mt-1 text-[11px] font-bold text-orange-200">값을 내리게 됩니다 ⬇️</p>
              </>
            ) : short ? (
              <>
                <p className="text-2xl">🙋🙋🙋</p>
                <p className="mt-1 text-sm font-bold text-sky-100">
                  초과 수요 — {s.shortageWord} {fmt(-gap, 0)}
                  {s.unit}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-300">
                  수요량 {fmt(qd(s, price), 0)} − 공급량 {fmt(qs(s, price), 0)} = {fmt(-gap, 0)}
                </p>
                <p className="mt-1 text-[11px] font-bold text-sky-200">값이 오르게 됩니다 ⬆️</p>
              </>
            ) : (
              <>
                <p className="text-3xl">🎯</p>
                <p className="mt-1 text-sm font-bold text-amber-100">시장가격 = 균형가격 — 남지도 모자라지도 않아요!</p>
                <p className="mt-0.5 text-[11px] text-slate-300">
                  균형거래량 {fmt(eq.q, 0)}
                  {s.unit}이 그대로 유지됩니다.
                </p>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <FormulaLine expr={demandTex(s)} className="text-slate-100" />
            <FormulaLine expr={supplyTex(s)} className="text-slate-100" />
            <p className="text-center text-[11px] leading-5 text-slate-400">
              초과량 = 두 기울기의 차이 <b className="text-slate-200">{fmt(s.sA - s.dA)}</b> × 균형가격에서 떨어진 거리{" "}
              <b className="text-slate-200">{fmt(Math.abs(price - eq.x))}</b> ={" "}
              <b className="text-slate-100">{fmt(Math.abs(gap), 0)}</b>
            </p>
          </div>
        </div>
      </div>

      <NewsGame />
    </div>
  );
}

function NewsGame() {
  const [ans, setAns] = useState<Record<string, "over" | "short">>({});
  const solved = NEWS.filter((n) => ans[n.id] === n.state).length;
  const allDone = solved === NEWS.length;

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-violet-200">📰 뉴스만 보고 시장 상태를 맞혀 보세요</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-300">
            맞힘 {solved} / {NEWS.length}
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
        <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${(solved / NEWS.length) * 100}%` }} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {NEWS.map((n) => {
          const picked = ans[n.id];
          const right = picked === n.state;
          const wrong = picked !== undefined && !right;
          return (
            <div
              key={n.id}
              className={
                "rounded-xl border p-3 transition " +
                (right ? "border-emerald-400/50 bg-emerald-400/[0.09]" : wrong ? "border-rose-400/50 bg-rose-400/[0.09]" : "border-white/10 bg-white/5")
              }
            >
              <p className="text-xs font-bold leading-5 text-slate-100">
                {n.emoji} {n.head}
              </p>
              {right ? (
                <p className="mt-1.5 text-[11px] leading-5 text-emerald-100">
                  ✅ {n.state === "over" ? "초과 공급 (시장가격 > 균형가격)" : "초과 수요 (시장가격 < 균형가격)"} — {n.why}
                </p>
              ) : (
                <div className="mt-1.5 flex gap-1.5">
                  <NewsBtn on={picked === "over"} wrong={wrong && picked === "over"} tone="orange" onClick={() => setAns((p) => ({ ...p, [n.id]: "over" }))}>
                    📦 초과 공급
                  </NewsBtn>
                  <NewsBtn on={picked === "short"} wrong={wrong && picked === "short"} tone="sky" onClick={() => setAns((p) => ({ ...p, [n.id]: "short" }))}>
                    🙋 초과 수요
                  </NewsBtn>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allDone ? (
        <div className="mt-3 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3 text-center">
          <p className="text-sm font-bold text-emerald-100">🎉 여덟 뉴스를 모두 읽어 냈어요!</p>
          <p className="mx-auto mt-1 max-w-2xl text-[11px] leading-5 text-slate-200">{NEWS_WRAP}</p>
        </div>
      ) : null}
    </div>
  );
}

function NewsBtn({
  on,
  wrong,
  tone,
  onClick,
  children,
}: {
  on: boolean;
  wrong: boolean;
  tone: "orange" | "sky";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const base: Record<string, string> = {
    orange: "border-orange-400/50 bg-orange-400/15 text-orange-100",
    sky: "border-sky-400/50 bg-sky-400/15 text-sky-100",
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

// ══════════════════════════════════════════════════════════════
//  탭 ② 균형을 찾아가는 여정
// ══════════════════════════════════════════════════════════════
function JourneyTab() {
  const [sid, setSid] = useState(SHOPS[0].id);
  const s = shopOf(sid);
  const eq = eqOf(s);
  const [hist, setHist] = useState<number[]>([SHOPS[0].startHigh]);
  const [playing, setPlaying] = useState(false);

  const price = hist[hist.length - 1];
  const atEq = Math.abs(price - eq.x) < 1e-9;
  const startedOver = excessOf(s, hist[0]) > 0;
  const flow = startedOver ? FLOW_OVER : FLOW_SHORT;
  const stage = atEq ? 3 : Math.min(2, hist.length - 1);

  useEffect(() => {
    if (!playing) return;
    const last = hist[hist.length - 1];
    if (Math.abs(last - eq.x) < 1e-9) return;
    const id = setTimeout(() => {
      setHist((h) => {
        const l = h[h.length - 1];
        const nx = nextPrice(s, l);
        return nx === l ? h : [...h, nx];
      });
    }, 700);
    return () => clearTimeout(id);
  }, [playing, hist, eq.x, s]);

  function reset(shop: Shop, high: boolean) {
    setPlaying(false);
    setSid(shop.id);
    setHist([high ? shop.startHigh : shop.startLow]);
  }
  function step() {
    setPlaying(false);
    setHist((h) => {
      const l = h[h.length - 1];
      const nx = nextPrice(s, l);
      return nx === l ? h : [...h, nx];
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {SHOPS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => reset(x, true)}
            className={
              "rounded-xl border-2 px-3 py-2 text-left transition " +
              (sid === x.id ? TONE_ON[x.tone] : "border-white/10 bg-white/5 hover:bg-white/10")
            }
          >
            <p className="text-xs font-bold text-slate-100">
              {x.emoji} {x.name}
            </p>
            <p className="font-mono text-[10px] text-slate-400">
              균형 {fmt(eqOf(x).x)}
              {x.priceUnit} · {fmt(eqOf(x).q, 0)}
              {x.unit}
            </p>
          </button>
        ))}
      </div>

      {/* 흐름도 */}
      <div className="grid gap-1.5 sm:grid-cols-4">
        {flow.map((f, i) => (
          <div
            key={f}
            className={
              "rounded-xl border-2 px-3 py-2 text-center text-[11px] font-bold transition " +
              (i < stage
                ? "border-white/10 bg-white/5 text-slate-400"
                : i === stage
                  ? startedOver
                    ? "border-orange-400/60 bg-orange-400/15 text-orange-100"
                    : "border-sky-400/60 bg-sky-400/15 text-sky-100"
                  : "border-white/5 bg-slate-900/30 text-slate-600")
            }
          >
            {i === 3 ? "🎯 " : ""}
            {f}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <GapChart s={s} price={price} trail={hist.slice(0, -1)} />
          <PriceTimeline s={s} hist={hist} />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => reset(s, true)}
              className="flex-1 rounded-lg border-2 border-orange-400/50 bg-orange-400/12 px-3 py-2 text-xs font-bold text-orange-100 transition hover:bg-orange-400/22"
            >
              💸 비싸게 시작
            </button>
            <button
              type="button"
              onClick={() => reset(s, false)}
              className="flex-1 rounded-lg border-2 border-sky-400/50 bg-sky-400/12 px-3 py-2 text-xs font-bold text-sky-100 transition hover:bg-sky-400/22"
            >
              🪙 싸게 시작
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={atEq}
              onClick={step}
              className="flex-1 rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 px-3 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/25 disabled:opacity-40"
            >
              🗓️ 하루 지나기
            </button>
            <button
              type="button"
              disabled={atEq}
              onClick={() => setPlaying(!playing)}
              className="rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-3 py-2.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25 disabled:opacity-40"
            >
              {playing ? "⏸️ 멈춤" : "⏩ 끝까지"}
            </button>
          </div>

          <div
            className={
              "rounded-2xl border-2 p-4 text-center " +
              (atEq ? "border-amber-400/60 bg-amber-400/[0.12]" : startedOver ? "border-orange-400/50 bg-orange-400/[0.10]" : "border-sky-400/50 bg-sky-400/[0.10]")
            }
          >
            <p className="text-[11px] text-slate-400">
              {hist.length - 1}일째 · 지금 값
            </p>
            <p className={"font-mono text-4xl font-bold " + (atEq ? "text-amber-100" : "text-fuchsia-100")}>
              {fmt(price)}
              <span className="ml-1 text-base">{s.priceUnit}</span>
            </p>
            {atEq ? (
              <p className="mt-1 text-sm font-bold text-amber-100">
                🎉 균형점 도달! 균형거래량 {fmt(eq.q, 0)}
                {s.unit}
              </p>
            ) : (
              <p className="mt-1 text-xs font-bold text-slate-200">
                {excessOf(s, price) > 0
                  ? `${s.surplusWord} ${fmt(excessOf(s, price), 0)}${s.unit} → 내일은 값을 내려요 ⬇️`
                  : `${s.shortageWord} ${fmt(-excessOf(s, price), 0)}${s.unit} → 내일은 값이 올라요 ⬆️`}
              </p>
            )}
          </div>

          <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
            {hist.map((p, i) => {
              const g = excessOf(s, p);
              const done = i < hist.length - 1;
              const bal = Math.abs(g) < 0.5;
              return (
                <div
                  key={i}
                  className={
                    "rounded-xl border px-3 py-2 " +
                    (bal ? "border-amber-400/45 bg-amber-400/[0.10]" : done ? "border-white/10 bg-white/[0.03]" : "border-white/15 bg-white/[0.07]")
                  }
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <p className="text-[11px] font-bold text-slate-200">🗓️ {i}일째</p>
                    <p className="font-mono text-xs font-bold text-fuchsia-100">
                      {fmt(p)} {s.priceUnit}
                      {i > 0 ? (
                        <span className={"ml-1 " + (p < hist[i - 1] ? "text-sky-300" : "text-orange-300")}>
                          {p < hist[i - 1] ? "⬇️" : "⬆️"} {fmt(Math.abs(p - hist[i - 1]))}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <p className="font-mono text-[10px] text-slate-400">
                    사려는 양 {fmt(qd(s, p), 0)} · 팔려는 양 {fmt(qs(s, p), 0)}
                  </p>
                  <p className={"text-[11px] font-bold " + (bal ? "text-amber-200" : g > 0 ? "text-orange-200" : "text-sky-200")}>
                    {bal
                      ? "🎯 딱 맞았어요 — 값을 바꿀 까닭이 없어요"
                      : g > 0
                        ? `📦 ${s.surplusWord} ${fmt(g, 0)}${s.unit}`
                        : `🙋 ${s.shortageWord} ${fmt(-g, 0)}${s.unit}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2.5 text-[11px] leading-5 text-amber-100">
        💡 처음에는 남거나 모자라는 양이 커서 값이 크게 움직이고, 균형에 가까워질수록 조금씩만 움직여요. 아무도 값을
        정해 주지 않았는데도 시장가격이 스스로 균형가격을 찾아갑니다.
      </p>
    </div>
  );
}

const TW = 380,
  TH = 170,
  TL = 46,
  TR = 16,
  TT = 30,
  TB = 30;

function PriceTimeline({ s, hist }: { s: Shop; hist: number[] }) {
  const eq = eqOf(s);
  const n = Math.max(6, hist.length - 1);
  const X = (i: number) => TL + (i / n) * (TW - TL - TR);
  const Y = (v: number) => TH - TB - (v / s.xMax) * (TH - TT - TB);
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <div className="overflow-x-auto overflow-y-hidden">
        <svg viewBox={`0 0 ${TW} ${TH}`} className="h-auto w-full min-w-[320px]" role="img" aria-label="날짜에 따른 시장가격의 변화">
          <rect x={0} y={0} width={TW} height={TH} rx={10} fill="#0b1220" />
          {[0, 0.5, 1].map((r) => (
            <g key={r}>
              <line x1={TL} y1={Y(r * s.xMax)} x2={TW - TR} y2={Y(r * s.xMax)} stroke="rgba(148,163,184,0.12)" strokeWidth={0.8} />
              <text x={TL - 5} y={Y(r * s.xMax)} dy={3} textAnchor="end" fill="#64748b" fontSize={8.5} fontFamily="monospace">
                {fmt(r * s.xMax, 0)}
              </text>
            </g>
          ))}
          <line x1={TL} y1={Y(eq.x)} x2={TW - TR} y2={Y(eq.x)} stroke="#fbbf24" strokeWidth={1.4} strokeDasharray="5 4" />
          <text x={TW - TR - 4} y={Y(eq.x) - 5} textAnchor="end" fill="#fcd34d" fontSize={9.5} fontWeight={700}>
            균형가격 {fmt(eq.x)}
          </text>
          <polyline points={hist.map((p, i) => `${X(i)},${Y(p)}`).join(" ")} fill="none" stroke="#e879f9" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
          {hist.map((p, i) => (
            <g key={i}>
              <circle cx={X(i)} cy={Y(p)} r={i === hist.length - 1 ? 5 : 3.2} fill={i === hist.length - 1 ? "#fff" : "#e879f9"} />
              {i === hist.length - 1 ? <circle cx={X(i)} cy={Y(p)} r={3} fill="#e879f9" /> : null}
            </g>
          ))}
          {Array.from({ length: n + 1 }, (_, i) => (
            <text key={i} x={X(i)} y={TH - TB + 12} textAnchor="middle" fill="#64748b" fontSize={8.5} fontFamily="monospace">
              {i}
            </text>
          ))}
          <line x1={TL} y1={TH - TB} x2={TW - TR} y2={TH - TB} stroke="#94a3b8" strokeWidth={1.1} />
          <line x1={TL} y1={TT} x2={TL} y2={TH - TB} stroke="#94a3b8" strokeWidth={1.1} />
          <text x={TW - TR} y={TH - TB + 24} textAnchor="end" fill="#94a3b8" fontSize={9}>
            일째
          </text>
          <text x={10} y={15} textAnchor="start" fill="#cbd5e1" fontSize={9.5} fontWeight={700}>
            시장가격 ({s.priceUnit})
          </text>
        </svg>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 단계별 문제
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
          <p className="text-sm font-bold text-violet-200">🧩 시장가격 단계별 문제</p>
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
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 네 문제를 모두 해결했어요! 시장가격 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
