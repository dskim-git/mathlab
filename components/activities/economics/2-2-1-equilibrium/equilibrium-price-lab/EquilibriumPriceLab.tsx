"use client";

import { useEffect, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  EVENTS,
  ICE,
  MARKETS,
  PROBLEMS,
  demandTex,
  eqOf,
  eventSummary,
  fmt,
  marketOf,
  qd,
  qs,
  supplyTex,
  type Market,
  type MarketEvent,
  type PStep,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_equal",
    prompt:
      "균형가격보다 값이 비싸면 물건이 남고, 싸면 모자랐어요. 시장의 가격이 결국 균형가격으로 다가가는 까닭을 자기 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 물건이 남으면 가게가 값을 내려서 팔려고 하고, 모자라면 값을 올려도 팔리니까 값이 오른다. 그래서 남지도 모자라지도 않는 값으로 모여든다.",
  },
  {
    id: "move_vs_shift",
    prompt:
      "‘수요량의 변화’와 ‘수요의 변화’를 헷갈리지 않으려면 무엇을 먼저 물어봐야 할까요? 내가 찾은 구별 방법을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 달라진 것이 그 물건의 가격인지 아닌지를 먼저 본다. 가격이면 곡선 위에서 점만 움직이고, 날씨·유행·소득처럼 가격이 아닌 것이면 곡선 자체가 움직인다.",
  },
  {
    id: "real_life",
    prompt:
      "요즘 값이 크게 오르거나 내린 물건을 하나 떠올려, 수요와 공급 중 어느 쪽이 어떻게 움직여서 그렇게 되었을지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 여름에 수박값이 오른 것은 더워서 찾는 사람이 늘어난(수요 증가) 데다 비가 많이 와 수확량이 줄어든(공급 감소) 탓인 것 같다.",
  },
];

type Tab = "eq" | "shift" | "problem";

export default function EquilibriumPriceLab() {
  const [tab, setTab] = useState<Tab>("eq");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">⚖️ 균형가격의 결정</h3>
        <p className="mt-2 leading-7 text-slate-300">
          값이 너무 비싸면 물건이 남고, 너무 싸면 모자라요. 사려는 양과 팔려는 양이 딱 맞아떨어지는 곳,{" "}
          <b className="text-amber-200">수요곡선과 공급곡선이 만나는 점</b>에서 <b className="text-amber-200">균형</b>이
          이루어집니다. 직접 값을 매겨 보며 균형점을 찾아봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "eq"} onClick={() => setTab("eq")}>① 균형점 찾기</TabButton>
        <TabButton active={tab === "shift"} onClick={() => setTab("shift")}>② 점이 움직일까, 곡선이 움직일까</TabButton>
        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>③ 단계별 문제</TabButton>
      </div>

      <div className="mt-4">
        {tab === "eq" ? <EqTab /> : null}
        {tab === "shift" ? <ShiftTab /> : null}
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
  H = 290,
  PL = 48,
  PR = 20,
  PT = 34,
  PB = 36;

function MarketChart({
  m,
  dShift = 0,
  sShift = 0,
  price = null,
  base = null,
  only = null,
  showEq = true,
}: {
  m: Market;
  dShift?: number;
  sShift?: number;
  price?: number | null;
  base?: { dShift: number; sShift: number } | null;
  only?: "demand" | null;
  showEq?: boolean;
}) {
  const qTop = Math.max(qd(m, 0, dShift), qs(m, m.xMax, sShift), base ? qd(m, 0, base.dShift) : 0, base ? qs(m, m.xMax, base.sShift) : 0) * 1.1 || 1;
  const X = (v: number) => PL + (v / m.xMax) * (W - PL - PR);
  const Y = (v: number) => H - PB - (v / qTop) * (H - PT - PB);
  const line = (f: (x: number) => number) =>
    Array.from({ length: 121 }, (_, i) => {
      const x = (i / 120) * m.xMax;
      return `${X(x)},${Y(f(x))}`;
    }).join(" ");

  const eq = eqOf(m, dShift, sShift);
  const showBase = base && (base.dShift !== dShift || base.sShift !== sShift);
  const dNow = price === null ? 0 : qd(m, price, dShift);
  const sNow = price === null ? 0 : qs(m, price, sShift);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <div className="overflow-x-auto overflow-y-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[320px]" role="img" aria-label={`${m.name} 시장의 수요곡선과 공급곡선`}>
          <rect x={0} y={0} width={W} height={H} rx={10} fill="#0b1220" />
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <g key={`y${r}`}>
              <line x1={PL} y1={Y(r * qTop)} x2={W - PR} y2={Y(r * qTop)} stroke="rgba(148,163,184,0.13)" strokeWidth={0.8} />
              <text x={PL - 6} y={Y(r * qTop)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                {Math.round(r * qTop)}
              </text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <g key={`x${r}`}>
              <line x1={X(r * m.xMax)} y1={PT} x2={X(r * m.xMax)} y2={H - PB} stroke="rgba(148,163,184,0.12)" strokeWidth={0.8} />
              <text x={X(r * m.xMax)} y={H - PB + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                {fmt(r * m.xMax, 0)}
              </text>
            </g>
          ))}

          {showBase ? (
            <g opacity={0.5}>
              <polyline points={line((x) => qd(m, x, base.dShift))} fill="none" stroke={D_COLOR} strokeWidth={1.8} strokeDasharray="6 4" />
              {only ? null : (
                <polyline points={line((x) => qs(m, x, base.sShift))} fill="none" stroke={S_COLOR} strokeWidth={1.8} strokeDasharray="6 4" />
              )}
            </g>
          ) : null}

          {/* 가격에서의 두 수량 차이 */}
          {price !== null && !only ? (
            <g>
              <line x1={X(price)} y1={PT} x2={X(price)} y2={H - PB} stroke="#f8fafc" strokeWidth={1} strokeDasharray="3 3" opacity={0.45} />
              <line
                x1={X(price)}
                y1={Y(dNow)}
                x2={X(price)}
                y2={Y(sNow)}
                stroke={sNow > dNow ? "#fb923c" : dNow > sNow ? "#38bdf8" : "#fff"}
                strokeWidth={7}
                strokeOpacity={0.45}
                strokeLinecap="round"
              />
            </g>
          ) : null}

          <polyline points={line((x) => qd(m, x, dShift))} fill="none" stroke={D_COLOR} strokeWidth={3} strokeLinecap="round" />
          {only ? null : <polyline points={line((x) => qs(m, x, sShift))} fill="none" stroke={S_COLOR} strokeWidth={3} strokeLinecap="round" />}

          {showEq && !only && eq.x >= 0 && eq.x <= m.xMax ? (
            <g>
              <line x1={X(eq.x)} y1={Y(eq.q)} x2={X(eq.x)} y2={H - PB} stroke="#fbbf24" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.8} />
              <line x1={PL} y1={Y(eq.q)} x2={X(eq.x)} y2={Y(eq.q)} stroke="#fbbf24" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.8} />
              <circle cx={X(eq.x)} cy={Y(eq.q)} r={6.5} fill="#fff" />
              <circle cx={X(eq.x)} cy={Y(eq.q)} r={3.6} fill="#fbbf24" />
              <text x={X(eq.x) + 9} y={Y(eq.q) - 8} fill="#fcd34d" fontSize={10} fontWeight={700}>
                균형점
              </text>
            </g>
          ) : null}

          {price !== null ? (
            <g>
              <circle cx={X(price)} cy={Y(dNow)} r={5} fill={D_COLOR} stroke="#fff" strokeWidth={1.4} />
              {only ? null : <circle cx={X(price)} cy={Y(sNow)} r={5} fill={S_COLOR} stroke="#fff" strokeWidth={1.4} />}
            </g>
          ) : null}

          <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <text x={W - PR} y={H - PB + 27} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            가격 x ({m.priceUnit})
          </text>
          <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            수량 Q ({m.unit})
          </text>
          <text x={W - PR - 4} y={Y(qd(m, m.xMax * 0.86, dShift)) - 7} textAnchor="end" fill={D_COLOR} fontSize={11} fontWeight={700}>
            Qd
          </text>
          {only ? null : (
            <text x={W - PR - 4} y={Y(qs(m, m.xMax * 0.86, sShift)) - 7} textAnchor="end" fill={S_COLOR} fontSize={11} fontWeight={700}>
              Qs
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 균형점 찾기
// ══════════════════════════════════════════════════════════════
function EqTab() {
  const [mid, setMid] = useState(MARKETS[0].id);
  const m = marketOf(mid);
  const eq = eqOf(m);
  const [price, setPrice] = useState(Math.round(MARKETS[0].xMax * 0.7));
  const [anim, setAnim] = useState<{ from: number; to: number; n: number } | null>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!anim) return;
    const t0 = performance.now();
    const dur = 1400;
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / dur);
      const e = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p);
      setPrice(Number((anim.from + (anim.to - anim.from) * e).toFixed(2)));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [anim]);

  function pick(next: Market) {
    setAnim(null);
    setMid(next.id);
    setPrice(Math.round(next.xMax * 0.7));
  }

  const D = qd(m, price);
  const S = qs(m, price);
  const gap = S - D;
  const balanced = Math.abs(gap) < 0.5;
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((r) => Math.round(r * m.xMax));

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border-2 p-3" style={{ borderColor: "rgba(244,114,182,0.4)", background: "rgba(244,114,182,0.07)" }}>
          <p className="text-sm font-bold" style={{ color: D_COLOR }}>
            📉 수요의 법칙 — 우하향
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-300">가격이 오르면 수요량은 감소해요.</p>
          <FormulaLine expr={demandTex(m)} className="text-slate-100" />
        </div>
        <div className="rounded-2xl border-2 p-3" style={{ borderColor: "rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.07)" }}>
          <p className="text-sm font-bold" style={{ color: S_COLOR }}>
            📈 공급의 법칙 — 우상향
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-300">가격이 오르면 공급량은 증가해요.</p>
          <FormulaLine expr={supplyTex(m)} className="text-slate-100" />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {MARKETS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => pick(x)}
            className={
              "rounded-xl border-2 p-3 text-left transition " +
              (mid === x.id ? TONE_ON[x.tone] : "border-white/10 bg-white/5 hover:bg-white/10")
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
        <MarketChart m={m} price={price} />

        <div className="space-y-2">
          <Slider
            label={`내가 매긴 가격 x (${m.priceUnit})`}
            value={price}
            display={`${fmt(price)} ${m.priceUnit}`}
            min={0}
            max={m.xMax}
            step={m.xStep}
            onChange={(v) => {
              setAnim(null);
              setPrice(v);
            }}
            accent="accent-amber-400"
          />

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border-2 px-3 py-2 text-center" style={{ borderColor: "rgba(244,114,182,0.4)", background: "rgba(244,114,182,0.08)" }}>
              <p className="text-[11px] font-bold" style={{ color: D_COLOR }}>
                수요량 Qd
              </p>
              <p className="font-mono text-2xl font-bold text-pink-100">{fmt(D, 1)}</p>
            </div>
            <div className="rounded-xl border-2 px-3 py-2 text-center" style={{ borderColor: "rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.08)" }}>
              <p className="text-[11px] font-bold" style={{ color: S_COLOR }}>
                공급량 Qs
              </p>
              <p className="font-mono text-2xl font-bold text-emerald-100">{fmt(S, 1)}</p>
            </div>
          </div>

          <div
            className={
              "rounded-2xl border-2 p-4 text-center transition " +
              (balanced
                ? "border-amber-400/60 bg-amber-400/[0.12]"
                : gap > 0
                  ? "border-orange-400/50 bg-orange-400/[0.10]"
                  : "border-sky-400/50 bg-sky-400/[0.10]")
            }
          >
            {balanced ? (
              <>
                <p className="text-3xl">🎯</p>
                <p className="mt-1 text-sm font-bold text-amber-100">균형이에요! 남지도 모자라지도 않아요.</p>
                <p className="mt-1 font-mono text-xs text-slate-300">
                  균형가격 {fmt(eq.x)} {m.priceUnit} · 균형거래량 {fmt(eq.q)} {m.unit}
                </p>
              </>
            ) : gap > 0 ? (
              <>
                <p className="text-2xl">{"📦".repeat(Math.min(5, Math.max(1, Math.round(gap / (m.dB / 12)))))}</p>
                <p className="mt-1 text-sm font-bold text-orange-100">
                  초과공급 — 안 팔린 물건이 {fmt(gap, 1)}
                  {m.unit} 남았어요
                </p>
                <p className="mt-0.5 text-[11px] text-slate-300">값이 너무 비싸요. 가게는 값을 내리게 됩니다 ⬇️</p>
              </>
            ) : (
              <>
                <p className="text-2xl">{"🙋".repeat(Math.min(5, Math.max(1, Math.round(-gap / (m.dB / 12)))))}</p>
                <p className="mt-1 text-sm font-bold text-sky-100">
                  초과수요 — 사고 싶어도 못 산 사람이 {fmt(-gap, 1)}
                  {m.unit} 있어요
                </p>
                <p className="mt-0.5 text-[11px] text-slate-300">값이 너무 싸요. 값이 오르게 됩니다 ⬆️</p>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setN(n + 1);
                setAnim({ from: price, to: eq.x, n: n + 1 });
              }}
              className="flex-1 rounded-lg border-2 border-amber-400/55 bg-amber-400/15 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-400/25"
            >
              ⚖️ 시장에 맡겨 보기 (균형으로)
            </button>
            <button
              type="button"
              onClick={() => {
                setAnim(null);
                setPrice(Math.round(m.xMax * 0.7));
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↩️ 처음
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-xs font-bold text-slate-300">🧮 균형은 이렇게 구해요</p>
            <FormulaLine
              expr={`${m.dA}x ${m.dB >= 0 ? "+" : "-"} ${Math.abs(m.dB)} = ${m.sA}x ${m.sB === 0 ? "" : m.sB > 0 ? `+ ${m.sB}` : `- ${Math.abs(m.sB)}`}`}
              className="text-slate-100"
            />
            <FormulaLine expr={`x = ${fmt(eq.x)}, \\qquad Q = ${fmt(eq.q)}`} className="text-slate-100" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">🔢 가격에 따른 수요량과 공급량</p>
        <div className="mt-2 overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[420px] border-collapse text-center font-mono text-xs">
            <tbody>
              <tr>
                <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 text-[10px] font-bold text-white">
                  가격 ({m.priceUnit})
                </th>
                {ticks.map((t) => (
                  <td
                    key={t}
                    className={
                      "border border-white/15 px-2 py-1.5 font-bold " +
                      (Math.abs(t - price) < m.xStep / 2 ? "bg-amber-400/25 text-amber-100" : "bg-white/5 text-slate-300")
                    }
                  >
                    {t}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="border border-white/15 px-2 py-1.5 text-[10px] font-bold text-pink-100" style={{ background: "rgba(244,114,182,0.18)" }}>
                  수요량
                </th>
                {ticks.map((t) => (
                  <td key={t} className="border border-white/15 px-2 py-1.5 text-pink-200">
                    {fmt(qd(m, t), 0)}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="border border-white/15 px-2 py-1.5 text-[10px] font-bold text-emerald-100" style={{ background: "rgba(52,211,153,0.18)" }}>
                  공급량
                </th>
                {ticks.map((t) => (
                  <td key={t} className="border border-white/15 px-2 py-1.5 text-emerald-200">
                    {fmt(qs(m, t), 0)}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="border border-white/15 bg-white/5 px-2 py-1.5 text-[10px] font-bold text-slate-300">차이</th>
                {ticks.map((t) => {
                  const g = qs(m, t) - qd(m, t);
                  return (
                    <td
                      key={t}
                      className={"border border-white/15 px-2 py-1.5 " + (Math.abs(g) < 0.5 ? "bg-amber-400/25 font-bold text-amber-100" : g > 0 ? "text-orange-300" : "text-sky-300")}
                    >
                      {Math.abs(g) < 0.5 ? "0" : (g > 0 ? "+" : "") + fmt(g, 0)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-400">
          <span className="text-orange-300">양수</span>면 물건이 남고(초과공급), <span className="text-sky-300">음수</span>면
          모자라요(초과수요). 차이가 0이 되는 곳이 바로 균형이에요.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 점이 움직일까, 곡선이 움직일까
// ══════════════════════════════════════════════════════════════
function ShiftTab() {
  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-orange-400/40 bg-orange-400/[0.07] p-3">
          <p className="text-sm font-bold text-orange-200">📍 수요량의 변화</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            같은 수요곡선에서 <b className="text-orange-100">가격이 변할 때</b> — 곡선을 따라{" "}
            <b className="text-orange-100">점이 이동</b>해요.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-emerald-400/40 bg-emerald-400/[0.07] p-3">
          <p className="text-sm font-bold text-emerald-200">↔️ 수요의 변화</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            <b className="text-emerald-100">가격 이외의 요인</b>이 변해 모든 가격에서 수요량이 달라질 때 —{" "}
            <b className="text-emerald-100">곡선 자체가 이동</b>해요.
          </p>
        </div>
      </div>

      <TwoKnobs />
      <EventGame />
    </div>
  );
}

// ─── ② -A 두 손잡이 실험 ─────────────────────────────────────
function TwoKnobs() {
  const [price, setPrice] = useState(15);
  const [pop, setPop] = useState(0);
  const [last, setLast] = useState<"price" | "pop" | null>(null);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <p className="text-sm font-bold text-slate-200">🎛️ 손잡이를 하나씩 돌려 보세요</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        아이스크림 수요곡선 하나만 두고, 무엇을 바꾸느냐에 따라 그림이 어떻게 달라지는지 살펴봐요.
      </p>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <MarketChart m={ICE} dShift={pop} price={price} base={{ dShift: 0, sShift: 0 }} only="demand" showEq={false} />

        <div className="space-y-2">
          <div
            className={
              "rounded-xl border-2 px-3 py-2 text-center text-xs font-bold transition " +
              (last === "price"
                ? "border-orange-400/60 bg-orange-400/[0.12] text-orange-100"
                : last === "pop"
                  ? "border-emerald-400/60 bg-emerald-400/[0.12] text-emerald-100"
                  : "border-white/10 bg-white/5 text-slate-400")
            }
          >
            {last === "price"
              ? "📍 수요량의 변화 — 곡선은 그대로, 점만 미끄러졌어요"
              : last === "pop"
                ? "↔️ 수요의 변화 — 곡선 자체가 움직였어요"
                : "손잡이를 돌리면 무엇이 달라졌는지 알려 드릴게요"}
          </div>

          <Slider
            label={`① 아이스크림 값 (${ICE.priceUnit})`}
            value={price}
            display={`${fmt(price)} ${ICE.priceUnit}`}
            min={0}
            max={ICE.xMax}
            step={1}
            onChange={(v) => {
              setPrice(v);
              setLast("price");
            }}
            accent="accent-orange-400"
          />
          <Slider
            label="② 가격 말고 다른 것 (날씨·유행·소득 …)"
            value={pop}
            display={pop === 0 ? "그대로" : pop > 0 ? `+${pop}` : `${pop}`}
            min={-80}
            max={80}
            step={10}
            onChange={(v) => {
              setPop(v);
              setLast("pop");
            }}
            accent="accent-emerald-400"
          />

          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
            <p className="font-mono text-xs text-slate-300">
              가격 <b className="text-slate-100">{fmt(price)}</b> {ICE.priceUnit} → 수요량{" "}
              <b className="text-pink-200">{fmt(qd(ICE, price, pop), 0)}</b> {ICE.unit}
            </p>
            <div className="mt-0.5 text-slate-100">
              <Katex expr={demandTex(ICE, pop)} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPrice(15);
              setPop(0);
              setLast(null);
            }}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 처음으로
          </button>
          <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2 text-[11px] leading-5 text-amber-100">
            💡 구별 방법은 하나예요 — <b>달라진 것이 그 물건의 가격인가?</b> 가격이면 점이 움직이고, 가격이 아니면 곡선이
            움직여요.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── ② -B 실생활 사건 게임 ───────────────────────────────────
function EventGame() {
  const [cur, setCur] = useState<string | null>(null);
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);
  const [solved, setSolved] = useState<Record<string, boolean>>({});

  const eq0 = eqOf(ICE);
  const e: MarketEvent | null = cur ? (EVENTS.find((v) => v.id === cur) ?? null) : null;

  const a1 = e ? (e.kind === "move" ? 0 : 1) : 0;
  const priceUp = e ? e.priceTo > eq0.x : false;
  const a2 = e ? (e.kind === "shift" ? (e.shift > 0 ? 0 : 1) : e.side === "demand" ? (priceUp ? 1 : 0) : priceUp ? 0 : 1) : 0;

  const ok1 = q1 === a1;
  const ok2 = q2 === a2;
  const applied = !!e && ok1 && ok2;

  const dShift = applied && e && e.kind === "shift" && e.side === "demand" ? e.shift : 0;
  const sShift = applied && e && e.kind === "shift" && e.side === "supply" ? e.shift : 0;
  const markPrice = applied && e && e.kind === "move" ? e.priceTo : eq0.x;
  const eq1 = eqOf(ICE, dShift, sShift);

  function open(id: string) {
    setCur(id);
    setQ1(null);
    setQ2(null);
  }

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-violet-200">🍦 아이스크림 가게에 무슨 일이?</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-300">
            해결 {Object.values(solved).filter(Boolean).length} / {EVENTS.length}
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
        {EVENTS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => open(v.id)}
            className={
              "rounded-xl border-2 p-2.5 text-left transition " +
              (cur === v.id
                ? "border-violet-400/60 bg-violet-400/15"
                : solved[v.id]
                  ? "border-emerald-400/40 bg-emerald-400/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10")
            }
          >
            <p className="text-xs font-bold text-slate-100">
              {solved[v.id] ? "✅ " : ""}
              {v.emoji} {v.title}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <MarketChart m={ICE} dShift={dShift} sShift={sShift} price={applied && e?.kind === "move" ? markPrice : null} base={{ dShift: 0, sShift: 0 }} />
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
              <p className="text-[10px] text-slate-400">균형가격</p>
              <p className="font-mono text-lg font-bold text-amber-100">
                {fmt(eq0.x)}
                {applied && dShift + sShift !== 0 ? <span className="text-slate-400"> → {fmt(eq1.x)}</span> : null}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
              <p className="text-[10px] text-slate-400">균형거래량</p>
              <p className="font-mono text-lg font-bold text-amber-100">
                {fmt(eq0.q)}
                {applied && dShift + sShift !== 0 ? <span className="text-slate-400"> → {fmt(eq1.q)}</span> : null}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {!e ? (
            <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-6 text-center text-xs text-slate-400">
              위에서 사건 카드를 하나 골라 보세요.
            </p>
          ) : (
            <>
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
                <p className="text-sm font-bold text-slate-100">
                  {e.emoji} {e.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-300">{e.desc}</p>
                <p className="mt-1 text-[11px] font-bold" style={{ color: e.side === "demand" ? D_COLOR : S_COLOR }}>
                  {e.side === "demand" ? "🙋 사는 쪽(수요) 이야기예요" : "🏭 만드는 쪽(공급) 이야기예요"}
                </p>
              </div>

              <QRow
                n={1}
                ask="그래프에서 무엇이 움직일까요?"
                options={[
                  `📍 ${e.side === "demand" ? "수요량" : "공급량"}의 변화 — 곡선 위에서 점이 이동`,
                  `↔️ ${e.side === "demand" ? "수요" : "공급"}의 변화 — 곡선 자체가 이동`,
                ]}
                answer={a1}
                pick={q1}
                onPick={setQ1}
              />

              {ok1 ? (
                <QRow
                  n={2}
                  ask={e.kind === "shift" ? "어느 쪽으로 움직일까요?" : `그래서 ${e.side === "demand" ? "수요량" : "공급량"}은 어떻게 될까요?`}
                  options={
                    e.kind === "shift"
                      ? ["↗️ 오른쪽 위로 (증가)", "↙️ 왼쪽 아래로 (감소)"]
                      : ["⬆️ 늘어난다", "⬇️ 줄어든다"]
                  }
                  answer={a2}
                  pick={q2}
                  onPick={(v) => {
                    setQ2(v);
                    if (v === a2) setSolved((p) => ({ ...p, [e.id]: true }));
                  }}
                />
              ) : null}

              {applied ? (
                <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3">
                  <p className="text-center text-sm font-bold text-emerald-100">✅ {eventSummary(e)}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-200">{e.why}</p>
                  {e.kind === "shift" ? (
                    <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-center font-mono text-[11px] text-amber-100">
                      균형가격 {fmt(eq0.x)} → {fmt(eq1.x)} {eq1.x > eq0.x ? "⬆️" : "⬇️"} · 균형거래량 {fmt(eq0.q)} →{" "}
                      {fmt(eq1.q)} {eq1.q > eq0.q ? "⬆️" : "⬇️"}
                    </p>
                  ) : (
                    <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-center font-mono text-[11px] text-slate-200">
                      가격 {fmt(eq0.x)} → {fmt(e.priceTo)} {ICE.priceUnit} · 곡선은 그대로!
                    </p>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {Object.values(solved).filter(Boolean).length === EVENTS.length ? (
        <div className="mt-3 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3 text-center">
          <p className="text-sm font-bold text-emerald-100">🎉 여덟 사건을 모두 해결했어요!</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-200">
            수요 증가 → 가격 ⬆️ 거래량 ⬆️ · 수요 감소 → 가격 ⬇️ 거래량 ⬇️ · 공급 증가 → 가격 ⬇️ 거래량 ⬆️ · 공급 감소 →
            가격 ⬆️ 거래량 ⬇️
          </p>
        </div>
      ) : null}
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
          <p className="text-sm font-bold text-violet-200">🧩 균형가격 단계별 문제</p>
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
        {prob.texList ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
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
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 네 문제를 모두 해결했어요! 균형가격 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
