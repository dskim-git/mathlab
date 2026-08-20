"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  LAB_PRESETS,
  LAB_RANGE,
  LAB_START,
  PROBLEMS,
  RULE_STEPS,
  TABLE_FN,
  TABLE_TAXES,
  demandAt,
  demandTex,
  eqOf,
  fmt,
  priceRate,
  qtyRate,
  supplyAt,
  supplyChoices,
  supplyTex,
  taxedTex,
  taxedTidyTex,
  type Fn,
  type PStep,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "tool",
    prompt:
      "손잡이를 움직이면 그래프와 교점이 곧바로 다시 계산되었어요. 손으로 하나하나 풀 때와 견주어 공학도구가 좋았던 점과, 그래도 손으로 풀어 봐야 하는 까닭을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 세금을 바꿀 때마다 균형이 바로 보여서 규칙을 빨리 찾을 수 있었다. 하지만 왜 x 자리에 x − a 를 넣는지는 손으로 식을 세워 봐야 알 수 있었다.",
  },
  {
    id: "rule",
    prompt:
      "표에서 세금 a와 균형가격·균형거래량 사이의 규칙을 찾아 식으로 나타냈어요. 표만 볼 때와 식을 세웠을 때 무엇이 달라지는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 표에는 네 칸밖에 없지만 식이 있으면 a가 150일 때처럼 표에 없는 값도 바로 구할 수 있고, 거꾸로 원하는 거래량을 만드는 세금도 찾을 수 있다.",
  },
  {
    id: "locus",
    prompt:
      "세금을 바꿀 때 균형점이 수요곡선을 따라 미끄러졌어요. 왜 그런지 자기 말로 설명하고, 반대로 소득이 변해 수요곡선이 움직인다면 균형점은 어느 곡선을 따라 움직일지 예상해 보세요.",
    kind: "text",
    placeholder:
      "예: 세금은 공급함수만 바꾸니까 균형점은 늘 수요곡선 위에 있다. 반대로 수요곡선이 움직이면 공급곡선은 그대로니까 균형점은 공급곡선을 따라 움직일 것 같다.",
  },
];

type Tab = "lab" | "table" | "rule" | "problem";

export default function TaxExplorerLab() {
  const [tab, setTab] = useState<Tab>("lab");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🧮 공학도구로 균형 찾기</h3>
        <p className="mt-2 leading-7 text-slate-300">
          식을 손잡이로 바꾸면 그래프가 다시 그려지고 <b className="text-amber-200">교점(균형점)</b>이 저절로 계산돼요.
          세금 손잡이를 움직이며 균형이 어디로 가는지 눈으로 본 뒤, 표로 정리하고 <b className="text-emerald-200">규칙</b>
          까지 찾아봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "lab"} onClick={() => setTab("lab")}>① 공학도구 실험실</TabButton>
        <TabButton active={tab === "table"} onClick={() => setTab("table")}>② 표 채우기</TabButton>
        <TabButton active={tab === "rule"} onClick={() => setTab("rule")}>③ 규칙 찾기</TabButton>
        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>④ 단계별 문제</TabButton>
      </div>

      <div className="mt-4">
        {tab === "lab" ? <LabTab /> : null}
        {tab === "table" ? <TableTab /> : null}
        {tab === "rule" ? <RuleTab /> : null}
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

const D_COLOR = "#f472b6";
const S_COLOR = "#34d399";

/** 공학도구의 계수 손잡이 */
function Knob({
  label,
  value,
  min,
  max,
  step,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[11px] font-bold text-slate-400">{label}</span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"w-full " + accent}
      />
      <span className="w-12 shrink-0 text-right font-mono text-xs font-bold text-slate-100">{fmt(value)}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  공학도구 그래프
// ══════════════════════════════════════════════════════════════
const W = 410,
  H = 320,
  PL = 54,
  PR = 22,
  PT = 32,
  PB = 40;

function ToolChart({
  f,
  a,
  locus = false,
  locusMax = 180,
  marks = [],
}: {
  f: Fn;
  a: number;
  locus?: boolean;
  locusMax?: number;
  marks?: number[];
}) {
  const xMax = Math.ceil(-f.dB / f.dA / 50) * 50;
  const qTop = f.dB * 1.05;
  const X = (v: number) => PL + (v / xMax) * (W - PL - PR);
  const Y = (v: number) => H - PB - (v / qTop) * (H - PT - PB);
  const seg = (fn: (x: number) => number) => `${X(0)},${Y(fn(0))} ${X(xMax)},${Y(fn(xMax))}`;

  const e = eqOf(f, a);
  const alive = e.q > 0 && e.x > 0 && e.x <= xMax;
  const e0 = eqOf(f, 0);
  const eEnd = eqOf(f, locusMax);
  const cid = `tool-clip-${f.dA}-${f.dB}-${f.sA}-${f.sB}`;

  const locusPts = marks
    .map((t) => ({ t, e: eqOf(f, t) }))
    .filter((p) => p.e.q > 0 && p.e.x <= xMax);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <div className="overflow-x-auto overflow-y-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[320px]" role="img" aria-label="수요곡선과 공급곡선, 그리고 교점">
          <defs>
            <clipPath id={cid}>
              <rect x={PL} y={PT} width={W - PL - PR} height={H - PT - PB} />
            </clipPath>
          </defs>
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
              <line x1={X(r * xMax)} y1={PT} x2={X(r * xMax)} y2={H - PB} stroke="rgba(148,163,184,0.1)" strokeWidth={0.8} />
              <text x={X(r * xMax)} y={H - PB + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                {Math.round(r * xMax)}
              </text>
            </g>
          ))}

          <g clipPath={`url(#${cid})`}>
            {/* 균형점의 자취 — 수요곡선의 일부 */}
            {locus ? (
              <line
                x1={X(e0.x)}
                y1={Y(e0.q)}
                x2={X(Math.min(eEnd.x, xMax))}
                y2={Y(Math.max(0, eEnd.q))}
                stroke="#fbbf24"
                strokeWidth={9}
                strokeOpacity={0.28}
                strokeLinecap="round"
              />
            ) : null}
            {/* 수요곡선 */}
            <polyline points={seg((x) => demandAt(f, x))} fill="none" stroke={D_COLOR} strokeWidth={3} />
            {/* 원래 공급곡선 */}
            {a !== 0 ? (
              <polyline points={seg((x) => supplyAt(f, x, 0))} fill="none" stroke={S_COLOR} strokeWidth={1.8} strokeDasharray="6 4" strokeOpacity={0.55} />
            ) : null}
            {/* 세금을 넣은 공급곡선 */}
            <polyline points={seg((x) => supplyAt(f, x, a))} fill="none" stroke={S_COLOR} strokeWidth={3.2} />
            {/* 자취 위의 점들 */}
            {locus
              ? locusPts.map((p) => (
                  <circle key={p.t} cx={X(p.e.x)} cy={Y(p.e.q)} r={3.4} fill="#fbbf24" fillOpacity={0.9} />
                ))
              : null}
          </g>

          {/* 교점 — clip 밖에 그려 잘리지 않게 */}
          {alive ? (
            <g>
              <line x1={X(e.x)} y1={Y(e.q)} x2={X(e.x)} y2={H - PB} stroke="#fbbf24" strokeWidth={1.1} strokeDasharray="4 3" opacity={0.85} />
              <line x1={PL} y1={Y(e.q)} x2={X(e.x)} y2={Y(e.q)} stroke="#fbbf24" strokeWidth={1.1} strokeDasharray="4 3" opacity={0.85} />
              <circle cx={X(e.x)} cy={Y(e.q)} r={6.5} fill="#fff" />
              <circle cx={X(e.x)} cy={Y(e.q)} r={3.6} fill="#fbbf24" />
              <text x={X(e.x) + 9} y={Y(e.q) - 8} fill="#fcd34d" fontSize={10.5} fontWeight={700}>
                ({fmt(e.x, 1)}, {fmt(e.q, 1)})
              </text>
            </g>
          ) : (
            <text x={W / 2} y={H / 2} textAnchor="middle" fill="#fca5a5" fontSize={11} fontWeight={700}>
              이 세금에서는 거래가 이루어지지 않아요
            </text>
          )}

          <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <text x={W - PR} y={H - PB + 32} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            가격 x
          </text>
          <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            수량 Q
          </text>
          <text x={W - PR - 4} y={Y(demandAt(f, xMax * 0.9)) - 7} textAnchor="end" fill={D_COLOR} fontSize={11} fontWeight={700}>
            f
          </text>
          <text x={W - PR - 4} y={Math.max(PT + 12, Y(supplyAt(f, xMax * 0.86, a)) - 7)} textAnchor="end" fill={S_COLOR} fontSize={11} fontWeight={700}>
            {a === 0 ? "g" : "gₐ"}
          </text>
        </svg>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 공학도구 실험실
// ══════════════════════════════════════════════════════════════
function LabTab() {
  const [f, setF] = useState<Fn>(LAB_START);
  const [a, setA] = useState(0);
  const [locus, setLocus] = useState(false);

  const e = eqOf(f, a);
  const e0 = eqOf(f, 0);
  const rate = priceRate(f);
  const qRate = qtyRate(f);
  const set = (patch: Partial<Fn>) => setF((p) => ({ ...p, ...patch }));

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {LAB_PRESETS.map((p) => {
          const on = p.f.dA === f.dA && p.f.dB === f.dB && p.f.sA === f.sA && p.f.sB === f.sB;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setF(p.f);
                setA(0);
              }}
              className={"rounded-xl border-2 p-3 text-left transition " + (on ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5 hover:bg-white/10")}
            >
              <p className="text-sm font-bold text-slate-100">
                {p.emoji} {p.name}
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{p.note}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <ToolChart f={f} a={a} locus={locus} locusMax={LAB_RANGE.a.max} marks={[0, 30, 60, 90, 120, 150, 180]} />

        <div className="space-y-2">
          {/* 함수 입력 패널 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
            <p className="text-[11px] font-bold text-slate-400">📥 함수 입력</p>
            <div className="mt-1.5 space-y-2">
              <div className="rounded-xl border p-2" style={{ borderColor: "rgba(244,114,182,0.35)", background: "rgba(244,114,182,0.06)" }}>
                <div className="overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
                  <Katex expr={demandTex(f)} />
                </div>
                <div className="mt-1 space-y-1">
                  <Knob label="기울기" value={f.dA} min={LAB_RANGE.dA.min} max={LAB_RANGE.dA.max} step={LAB_RANGE.dA.step} onChange={(v) => set({ dA: v })} accent="accent-pink-400" />
                  <Knob label="절편" value={f.dB} min={LAB_RANGE.dB.min} max={LAB_RANGE.dB.max} step={LAB_RANGE.dB.step} onChange={(v) => set({ dB: v })} accent="accent-pink-400" />
                </div>
              </div>
              <div className="rounded-xl border p-2" style={{ borderColor: "rgba(52,211,153,0.35)", background: "rgba(52,211,153,0.06)" }}>
                <div className="overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
                  <Katex expr={supplyTex(f)} />
                </div>
                <div className="mt-1 space-y-1">
                  <Knob label="기울기" value={f.sA} min={LAB_RANGE.sA.min} max={LAB_RANGE.sA.max} step={LAB_RANGE.sA.step} onChange={(v) => set({ sA: v })} accent="accent-emerald-400" />
                  <Knob label="절편" value={f.sB} min={LAB_RANGE.sB.min} max={LAB_RANGE.sB.max} step={LAB_RANGE.sB.step} onChange={(v) => set({ sB: v })} accent="accent-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* 세금 손잡이 */}
          <div className="rounded-2xl border-2 border-amber-400/45 bg-amber-400/[0.08] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-bold text-amber-200">🧾 세금 a (1단위당)</p>
              <p className="font-mono text-xl font-bold text-amber-100">{a}</p>
            </div>
            <input
              type="range"
              aria-label="세금 a"
              min={LAB_RANGE.a.min}
              max={LAB_RANGE.a.max}
              step={LAB_RANGE.a.step}
              value={a}
              onChange={(e2) => setA(Number(e2.target.value))}
              className="mt-1 w-full accent-amber-400"
            />
            <div className="mt-1 rounded-lg bg-black/25 px-2 py-1">
              <div className="overflow-x-auto overflow-y-hidden py-0.5 text-center text-slate-100">
                <Katex expr={taxedTex(f, a)} />
              </div>
              {a !== 0 ? (
                <div className="overflow-x-auto overflow-y-hidden py-0.5 text-center text-slate-400">
                  <Katex expr={taxedTidyTex(f, a)} />
                </div>
              ) : null}
            </div>
          </div>

          {/* 자동 계산 */}
          <div className="rounded-2xl border-2 border-white/15 bg-slate-900/60 p-3">
            <p className="text-[11px] font-bold text-slate-400">🎯 교점 자동 계산</p>
            <p className="mt-0.5 text-center font-mono text-2xl font-bold text-amber-100">
              ({fmt(e.x, 2)}, {fmt(e.q, 2)})
            </p>
            <div className="mt-1 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5">
                <p className="text-[10px] text-slate-400">균형가격</p>
                <p className="font-mono text-sm font-bold text-slate-100">
                  {fmt(e0.x, 1)} <span className="text-slate-500">→</span> {fmt(e.x, 1)}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5">
                <p className="text-[10px] text-slate-400">균형거래량</p>
                <p className="font-mono text-sm font-bold text-slate-100">
                  {fmt(e0.q, 1)} <span className="text-slate-500">→</span> {fmt(e.q, 1)}
                </p>
              </div>
            </div>
            <p className="mt-1.5 text-center text-[11px] text-slate-400">
              세금 1당 균형가격 <b className="text-amber-200">+{fmt(rate, 3)}</b> · 균형거래량{" "}
              <b className="text-sky-200">−{fmt(qRate, 3)}</b>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setLocus(!locus)}
            className={
              "w-full rounded-xl border-2 px-3 py-2 text-xs font-bold transition " +
              (locus ? "border-amber-400/60 bg-amber-400/15 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            🧭 균형점의 자취 {locus ? "숨기기" : "보기"}
          </button>

          {locus ? (
            <p className="rounded-xl border border-amber-400/30 bg-amber-400/[0.07] px-3 py-2 text-[11px] leading-5 text-amber-100">
              세금을 0에서 {LAB_RANGE.a.max}까지 늘릴 때 균형점이 지나는 길이에요. 놀랍게도 <b>수요곡선 위</b>를 그대로
              미끄러지죠? 세금은 공급함수만 바꾸고 <b>수요함수는 그대로</b>이기 때문이에요.
            </p>
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] leading-5 text-slate-400">
              💡 손잡이를 움직이면 그래프와 교점이 곧바로 다시 계산돼요. 세금 손잡이를 천천히 밀면서 균형점이 어디로
              가는지 눈으로 따라가 보세요.
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setF(LAB_START);
              setA(0);
              setLocus(false);
            }}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 처음으로
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 표 채우기
// ══════════════════════════════════════════════════════════════
function TableTab() {
  const f = TABLE_FN;
  const [sup, setSup] = useState<Record<number, number | null>>({});
  const [price, setPrice] = useState<Record<number, string>>({});
  const [qty, setQty] = useState<Record<number, string>>({});
  const [graded, setGraded] = useState(false);
  const [peek, setPeek] = useState<number | null>(null);

  const open = TABLE_TAXES.slice(1);
  const num = (s: string) => Number((s ?? "").replace(/[^0-9.-]/g, ""));
  const okSup = (t: number) => {
    const i = sup[t];
    return i !== null && i !== undefined && supplyChoices(t)[i].ok;
  };
  const okPrice = (t: number) => (price[t] ?? "").trim() !== "" && Math.abs(num(price[t]) - eqOf(f, t).x) < 0.005;
  const okQty = (t: number) => (qty[t] ?? "").trim() !== "" && Math.abs(num(qty[t]) - eqOf(f, t).q) < 0.005;
  const score = open.reduce((n, t) => n + (okSup(t) ? 1 : 0) + (okPrice(t) ? 1 : 0) + (okQty(t) ? 1 : 0), 0);
  const total = open.length * 3;
  const allDone = graded && score === total;

  const cell = (ok: boolean) =>
    graded ? (ok ? "border-emerald-400/70 text-emerald-100" : "border-rose-400/60 text-rose-100") : "border-white/15 text-slate-100";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">📋 세금을 바꿔 가며 표를 채워 보자</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          어떤 상품의 가격 x에 대한 수요함수와 공급함수가 아래와 같아요. 정부가 상품 1단위에 대하여 공급자에게 세금을
          각각 30, 60, 90만큼 부과할 때의 균형가격과 균형거래량을 구해 봐요.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border px-3 py-2" style={{ borderColor: "rgba(244,114,182,0.35)", background: "rgba(244,114,182,0.06)" }}>
            <p className="text-[11px] font-bold" style={{ color: D_COLOR }}>
              수요함수
            </p>
            <div className="overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
              <Katex expr={demandTex(f)} />
            </div>
          </div>
          <div className="rounded-xl border px-3 py-2" style={{ borderColor: "rgba(52,211,153,0.35)", background: "rgba(52,211,153,0.06)" }}>
            <p className="text-[11px] font-bold" style={{ color: S_COLOR }}>
              공급함수
            </p>
            <div className="overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
              <Katex expr={supplyTex(f)} />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden">
        <table className="w-full min-w-[640px] border-collapse text-center text-xs">
          <tbody>
            <tr>
              <th className="w-28 border border-white/15 bg-blue-600/70 px-2 py-2 font-bold text-white">
                세금 (<Katex expr="a" />)
              </th>
              {TABLE_TAXES.map((t) => (
                <td key={t} className="border border-white/15 bg-white/5 px-2 py-2 font-mono text-base font-bold text-slate-100">
                  {t}
                </td>
              ))}
            </tr>
            <tr>
              <th className="border border-white/15 bg-blue-600/70 px-2 py-2 font-bold text-white">공급함수</th>
              {TABLE_TAXES.map((t) =>
                t === 0 ? (
                  <td key={t} className="border border-white/15 bg-emerald-400/[0.07] px-2 py-2 text-slate-200">
                    <Katex expr={supplyTex(f)} />
                  </td>
                ) : (
                  <td key={t} className="border border-white/15 p-1">
                    {okSup(t) && graded ? (
                      <div className="rounded-lg border-2 border-emerald-400/70 bg-emerald-400/15 px-1 py-1.5 text-emerald-100">
                        <Katex expr={taxedTex(f, t)} />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {supplyChoices(t).map((c, i) => (
                          <button
                            key={c.tex}
                            type="button"
                            onClick={() => {
                              setSup((p) => ({ ...p, [t]: i }));
                              setGraded(false);
                            }}
                            className={
                              "rounded-lg border px-1.5 py-1 text-[10px] transition " +
                              (sup[t] === i
                                ? graded
                                  ? c.ok
                                    ? "border-emerald-400/70 bg-emerald-400/20"
                                    : "border-rose-400/60 bg-rose-400/15"
                                  : "border-sky-400/60 bg-sky-400/15"
                                : "border-white/10 bg-white/5 hover:bg-white/10")
                            }
                          >
                            <span className="text-slate-100">
                              <Katex expr={c.tex} />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                ),
              )}
            </tr>
            <tr>
              <th className="border border-white/15 bg-blue-600/70 px-2 py-2 font-bold text-white">균형가격</th>
              {TABLE_TAXES.map((t) =>
                t === 0 ? (
                  <td key={t} className="border border-white/15 bg-amber-400/[0.10] px-2 py-2 font-mono text-base font-bold text-amber-100">
                    {fmt(eqOf(f, 0).x)}
                  </td>
                ) : (
                  <td key={t} className="border border-white/15 p-1.5">
                    <input
                      type="text"
                      inputMode="text"
                      aria-label={`세금 ${t}일 때의 균형가격`}
                      value={price[t] ?? ""}
                      onChange={(ev) => {
                        setPrice((p) => ({ ...p, [t]: ev.target.value }));
                        setGraded(false);
                      }}
                      className={"w-full rounded-lg border-2 bg-slate-950 px-2 py-1.5 text-center font-mono text-sm outline-none transition focus:border-violet-300 " + cell(okPrice(t))}
                    />
                    {graded && !okPrice(t) ? <p className="mt-0.5 font-mono text-[10px] text-emerald-200">{fmt(eqOf(f, t).x)}</p> : null}
                  </td>
                ),
              )}
            </tr>
            <tr>
              <th className="border border-white/15 bg-blue-600/70 px-2 py-2 font-bold text-white">균형거래량</th>
              {TABLE_TAXES.map((t) =>
                t === 0 ? (
                  <td key={t} className="border border-white/15 bg-amber-400/[0.10] px-2 py-2 font-mono text-base font-bold text-amber-100">
                    {fmt(eqOf(f, 0).q)}
                  </td>
                ) : (
                  <td key={t} className="border border-white/15 p-1.5">
                    <input
                      type="text"
                      inputMode="text"
                      aria-label={`세금 ${t}일 때의 균형거래량`}
                      value={qty[t] ?? ""}
                      onChange={(ev) => {
                        setQty((p) => ({ ...p, [t]: ev.target.value }));
                        setGraded(false);
                      }}
                      className={"w-full rounded-lg border-2 bg-slate-950 px-2 py-1.5 text-center font-mono text-sm outline-none transition focus:border-violet-300 " + cell(okQty(t))}
                    />
                    {graded && !okQty(t) ? <p className="mt-0.5 font-mono text-[10px] text-emerald-200">{fmt(eqOf(f, t).q)}</p> : null}
                  </td>
                ),
              )}
            </tr>
            <tr>
              <th className="border border-white/15 bg-white/5 px-2 py-1.5 text-[10px] font-bold text-slate-400">공학도구</th>
              {TABLE_TAXES.map((t) => (
                <td key={t} className="border border-white/15 p-1">
                  <button
                    type="button"
                    onClick={() => setPeek(peek === t ? null : t)}
                    className={
                      "w-full rounded-lg border px-1.5 py-1 text-[10px] font-bold transition " +
                      (peek === t ? "border-amber-400/60 bg-amber-400/15 text-amber-100" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
                    }
                  >
                    🔧 {peek === t ? "닫기" : "그래프"}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setGraded(true)}
          className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
        >
          채점하기
        </button>
        <button
          type="button"
          onClick={() => {
            setSup({});
            setPrice({});
            setQty({});
            setGraded(false);
          }}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          ↩️ 다시
        </button>
        {graded ? (
          <span className={"text-xs font-bold " + (allDone ? "text-emerald-200" : "text-amber-200")}>
            {score} / {total} 정답
          </span>
        ) : null}
        <span className="ml-auto text-[11px] text-slate-500">공급함수는 보기에서 고르고, 값은 직접 계산해 넣어요</span>
      </div>

      {peek !== null ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-amber-200">🔧 공학도구로 확인 — 세금 a = {peek}</p>
          <ToolChart f={f} a={peek} />
        </div>
      ) : null}

      {allDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4">
          <p className="text-center text-sm font-bold text-emerald-100">🎉 표를 모두 채웠어요!</p>
          <p className="mt-1 text-center text-[11px] leading-5 text-slate-200">
            세금이 30씩 늘 때 균형가격은 <b className="text-amber-200">10씩</b> 오르고 균형거래량은{" "}
            <b className="text-sky-200">20씩</b> 줄었어요. 규칙이 보이나요? 다음 탭에서 식으로 만들어 봐요.
          </p>
          <div className="mt-2">
            <ToolChart f={f} a={0} locus locusMax={90} marks={TABLE_TAXES} />
          </div>
          <p className="mt-1 text-center text-[11px] text-slate-400">
            네 개의 균형점이 모두 <b className="text-fuchsia-200">수요곡선 위</b>에 나란히 놓여 있어요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 규칙 찾기
// ══════════════════════════════════════════════════════════════
function RuleTab() {
  const f = TABLE_FN;
  const [state, setState] = useState<Record<string, StepState>>({});
  const rows = TABLE_TAXES.map((t) => ({ t, ...eqOf(f, t) }));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🔍 표에서 규칙을 찾아 식으로</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          공학도구가 계산해 준 값을 나란히 놓으면 규칙이 보여요. 규칙을 식으로 만들면 표에 없는 값도 구할 수 있고, 거꾸로
          원하는 결과를 만드는 세금도 정할 수 있습니다.
        </p>
      </div>

      <div className="overflow-x-auto overflow-y-hidden">
        <table className="w-full min-w-[520px] border-collapse text-center text-xs">
          <tbody>
            <tr>
              <th className="w-32 border border-white/15 bg-blue-600/70 px-2 py-2 font-bold text-white">
                세금 <Katex expr="a" />
              </th>
              {rows.map((r) => (
                <td key={r.t} className="border border-white/15 bg-white/5 px-2 py-2 font-mono text-base font-bold text-slate-100">
                  {r.t}
                </td>
              ))}
            </tr>
            <tr>
              <th className="border border-white/15 bg-amber-500/25 px-2 py-2 font-bold text-amber-50">균형가격</th>
              {rows.map((r) => (
                <td key={r.t} className="border border-white/15 px-2 py-2 font-mono text-base font-bold text-amber-100">
                  {fmt(r.x)}
                </td>
              ))}
            </tr>
            <tr>
              <th className="border border-white/15 bg-white/5 px-2 py-1.5 text-[10px] font-bold text-slate-400">가격의 변화</th>
              <td className="border border-white/15 px-2 py-1.5 text-slate-600">—</td>
              {rows.slice(1).map((r, i) => (
                <td key={r.t} className="border border-white/15 px-2 py-1.5 font-mono text-[11px] font-bold text-orange-200">
                  +{fmt(r.x - rows[i].x)}
                </td>
              ))}
            </tr>
            <tr>
              <th className="border border-white/15 bg-sky-500/25 px-2 py-2 font-bold text-sky-50">균형거래량</th>
              {rows.map((r) => (
                <td key={r.t} className="border border-white/15 px-2 py-2 font-mono text-base font-bold text-sky-100">
                  {fmt(r.q)}
                </td>
              ))}
            </tr>
            <tr>
              <th className="border border-white/15 bg-white/5 px-2 py-1.5 text-[10px] font-bold text-slate-400">거래량의 변화</th>
              <td className="border border-white/15 px-2 py-1.5 text-slate-600">—</td>
              {rows.slice(1).map((r, i) => (
                <td key={r.t} className="border border-white/15 px-2 py-1.5 font-mono text-[11px] font-bold text-sky-300">
                  {fmt(r.q - rows[i].q)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <StepList steps={RULE_STEPS} state={state} setState={setState} />

      <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.06] p-4">
        <p className="text-sm font-bold text-violet-200">🧠 한 걸음 더 — 왜 하필 1/3 일까?</p>
        <p className="mt-1 text-xs leading-6 text-slate-300">
          세금이 1 늘 때 균형가격이 오르는 양은 두 기울기로 정해져요.
        </p>
        <FormulaLine expr="\dfrac{\Delta x_0}{\Delta a} = \dfrac{s_A}{s_A - d_A}" className="text-slate-100" />
        <div className="mt-1 grid gap-2 sm:grid-cols-3">
          {LAB_PRESETS.map((p) => (
            <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
              <p className="text-[11px] font-bold text-slate-200">
                {p.emoji} {p.name}
              </p>
              <p className="font-mono text-[10px] text-slate-500">
                dA = {p.f.dA} · sA = {p.f.sA}
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold text-amber-100">+{fmt(priceRate(p.f), 3)}</p>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
          공학도구 탭에서 기울기 손잡이를 바꿔 가며 이 값이 정말 맞는지 확인해 보세요. 수요가 값에 민감할수록(기울기가
          가파를수록) 세금이 가격에 덜 반영된답니다.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  단계별 문제 공용
// ══════════════════════════════════════════════════════════════
type StepState = { text: string; ok: boolean; tries: number; hint: boolean; shown: boolean };
const DEFAULT_STEP: StepState = { text: "", ok: false, tries: 0, hint: false, shown: false };

function StepList({
  steps,
  state,
  setState,
}: {
  steps: PStep[];
  state: Record<string, StepState>;
  setState: React.Dispatch<React.SetStateAction<Record<string, StepState>>>;
}) {
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
  const firstOpen = steps.findIndex((s) => !get(s.id).ok);

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const ss = get(step.id);
        const locked = i > (firstOpen === -1 ? steps.length - 1 : firstOpen);
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
                    아직 아니에요. {ss.tries >= 2 ? "힌트를 열어 보세요." : "표를 다시 살펴볼까요?"}
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
                    {ss.hint ? <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">{step.hint}</span> : null}
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
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 단계별 문제
// ══════════════════════════════════════════════════════════════
function ProblemTab() {
  const [pIdx, setPIdx] = useState(0);
  const [state, setState] = useState<Record<string, StepState>>({});
  const prob = PROBLEMS[pIdx];
  const doneCount = PROBLEMS.filter((p) => p.steps.every((s) => state[s.id]?.ok)).length;
  const probDone = prob.steps.every((s) => state[s.id]?.ok);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🧩 균형 찾기 단계별 문제</p>
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

      <StepList steps={prob.steps} state={state} setState={setState} />

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
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 네 문제를 모두 해결했어요! 공학도구 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
