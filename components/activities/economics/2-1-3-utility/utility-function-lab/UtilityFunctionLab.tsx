"use client";

import { useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CASES,
  DRAW_ITEMS,
  DRAW_NMAX,
  DRAW_STEP,
  DRAW_UMAX,
  FRIENDS,
  PROBLEMS,
  caseOf,
  fmt,
  fnTex,
  muOf,
  peakOf,
  substTex,
  uOf,
  uRange,
  type PStep,
  type UtilCase,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "subjective",
    prompt:
      "효용은 사람마다 다른 ‘주관적인 지표’였어요. 친구와 내가 같은 상품에 대해 아주 다른 효용을 느낀 경험이 있다면 무엇인지, 왜 그렇게 달랐을지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 나는 매운 음식을 두 입만 먹어도 힘든데 친구는 계속 맛있어한다. 매운맛을 견디는 정도가 달라서 같은 떡볶이라도 효용함수의 모양이 다른 것 같다.",
  },
  {
    id: "diminishing",
    prompt:
      "한 개씩 더 소비할 때 늘어나는 효용(한계효용)이 점점 작아지는 것을 확인했어요. 내 일상에서 한계효용 체감을 느낀 순간을 하나 떠올려 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 목이 마를 때 첫 잔의 물이 가장 시원하고, 두 잔째부터는 그만큼 좋지 않았다. 세 잔째는 배만 불렀다.",
  },
  {
    id: "shape",
    prompt:
      "효용함수의 모양은 계속 증가하는 것도 있고, 올라갔다 내려오는 것도 있었어요. 어떤 상품이 어떤 모양이 될지 스스로 예를 들어 보고, 그렇게 생각한 까닭을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 좋아하는 노래는 몇 번을 들어도 똑같이 좋아서 직선에 가깝고, 케이크는 두세 조각까지는 좋지만 그 뒤로는 물려서 올라갔다 내려오는 곡선이 될 것 같다.",
  },
];

type Tab = "fn" | "mu" | "draw" | "problem";

export default function UtilityFunctionLab() {
  const [tab, setTab] = useState<Tab>("fn");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">😋 효용함수</h3>
        <p className="mt-2 leading-7 text-slate-300">
          피자 한 조각은 행복하지만 열 조각은? 소비할 때 느끼는 <b className="text-amber-200">만족도</b>를 수로 나타낸
          것이 <b className="text-amber-200">효용</b>이고, 소비량 x에 따라 효용 U가 어떻게 달라지는지 알려 주는 것이{" "}
          <b className="text-emerald-200">효용함수 U = f(x)</b>예요. 직접 먹어 보며 그 모양을 찾아봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "fn"} onClick={() => setTab("fn")}>① 효용과 효용함수</TabButton>
        <TabButton active={tab === "mu"} onClick={() => setTab("mu")}>② 한계효용 체감의 법칙</TabButton>
        <TabButton active={tab === "draw"} onClick={() => setTab("draw")}>③ 나의 효용 곡선 그리기</TabButton>
        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>④ 단계별 문제</TabButton>
      </div>

      <div className="mt-4">
        {tab === "fn" ? <FnTab /> : null}
        {tab === "mu" ? <MuTab /> : null}
        {tab === "draw" ? <DrawTab /> : null}
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
const TONE_ACCENT: Record<string, string> = {
  emerald: "accent-emerald-400",
  sky: "accent-sky-400",
  amber: "accent-amber-400",
  violet: "accent-violet-400",
};
const CURVE: Record<string, string> = {
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

function CasePicker({ cid, onPick }: { cid: string; onPick: (c: UtilCase) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {CASES.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onPick(c)}
          className={
            "rounded-xl border-2 p-3 text-left transition " +
            (cid === c.id ? TONE_ON[c.tone] : "border-white/10 bg-white/5 hover:bg-white/10")
          }
        >
          <p className="text-sm font-bold text-slate-100">
            {c.emoji} {c.name}
          </p>
          <div className="mt-0.5 overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
            <Katex expr={fnTex(c)} />
          </div>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{c.story}</p>
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 효용과 효용함수
// ══════════════════════════════════════════════════════════════
const W = 380,
  H = 264,
  PL = 48,
  PR = 18,
  PT = 32,
  PB = 34;

function FnTab() {
  const [cid, setCid] = useState(CASES[0].id);
  const c = caseOf(cid);
  const [x, setX] = useState(CASES[0].x0);

  const { lo, hi } = uRange(c);
  const yLo = Math.min(0, lo) * 1.1;
  const yHi = hi * 1.1 || 1;
  const X = (v: number) => PL + (v / c.xMax) * (W - PL - PR);
  const Y = (v: number) => H - PB - ((v - yLo) / (yHi - yLo)) * (H - PT - PB);
  const pts = Array.from({ length: 121 }, (_, i) => {
    const v = (i / 120) * c.xMax;
    return `${X(v)},${Y(uOf(c, v))}`;
  }).join(" ");
  const u = uOf(c, x);
  const peak = peakOf(c);
  const ints = Array.from({ length: c.nMax + 1 }, (_, i) => i);

  function pick(next: UtilCase) {
    setCid(next.id);
    setX(next.x0);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-3 sm:col-span-3">
          <p className="text-sm font-bold text-amber-200">🍽️ 효용 (Utility)</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            소비자가 어떤 재화나 서비스를 소비할 때 얻는 <b className="text-amber-100">주관적인 만족도</b>예요.
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] leading-5 text-slate-300">
              <b className="text-amber-200">1)</b> 효용이 클수록 만족도가 높아요.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] leading-5 text-slate-300">
              <b className="text-amber-200">2)</b> 같은 상품이라도 사람마다 만족도가 다르므로 효용은{" "}
              <b className="text-amber-100">주관적인 지표</b>예요.
            </div>
          </div>
        </div>
      </div>

      <CasePicker cid={cid} onPick={pick} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
            <div className="overflow-x-auto overflow-y-hidden">
              <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[320px]" role="img" aria-label={`${c.name}의 효용함수 그래프`}>
                <rect x={0} y={0} width={W} height={H} rx={10} fill="#0b1220" />
                {[0, 0.25, 0.5, 0.75, 1].map((r) => (
                  <g key={`y${r}`}>
                    <line x1={PL} y1={Y(yLo + r * (yHi - yLo))} x2={W - PR} y2={Y(yLo + r * (yHi - yLo))} stroke="rgba(148,163,184,0.14)" strokeWidth={0.8} />
                    <text x={PL - 6} y={Y(yLo + r * (yHi - yLo))} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                      {fmt(yLo + r * (yHi - yLo), 1)}
                    </text>
                  </g>
                ))}
                {ints.map((i) => (
                  <g key={`x${i}`}>
                    <line x1={X(i)} y1={PT} x2={X(i)} y2={H - PB} stroke="rgba(148,163,184,0.1)" strokeWidth={0.7} />
                    <text x={X(i)} y={H - PB + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                      {i}
                    </text>
                  </g>
                ))}
                {/* U = 0 선 */}
                <line x1={PL} y1={Y(0)} x2={W - PR} y2={Y(0)} stroke="#94a3b8" strokeWidth={1.2} />
                <polyline points={pts} fill="none" stroke={CURVE[c.tone]} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                {peak ? (
                  <g>
                    <line x1={X(peak.x)} y1={Y(peak.u)} x2={X(peak.x)} y2={Y(0)} stroke="#f472b6" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
                    <circle cx={X(peak.x)} cy={Y(peak.u)} r={4} fill="#f472b6" />
                    <text x={X(peak.x)} y={Y(peak.u) - 9} textAnchor="middle" fill="#f9a8d4" fontSize={10} fontWeight={700}>
                      최대 {fmt(peak.u)}
                    </text>
                  </g>
                ) : null}
                <line x1={X(x)} y1={Y(u)} x2={X(x)} y2={Y(0)} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
                <line x1={PL} y1={Y(u)} x2={X(x)} y2={Y(u)} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
                <circle cx={X(x)} cy={Y(u)} r={6} fill="#fff" />
                <circle cx={X(x)} cy={Y(u)} r={3.6} fill="#f43f5e" />
                <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke="#94a3b8" strokeWidth={1.2} />
                <text x={W - PR} y={H - PB + 26} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                  소비량 x ({c.unit})
                </text>
                <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                  효용 U
                </text>
              </svg>
            </div>
            <p className="px-1 pb-1 text-center text-[11px] text-slate-400">📐 {c.shape}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Slider
            label={`소비량 x (${c.unit})`}
            value={x}
            display={`${fmt(x)} ${c.unit}`}
            min={0}
            max={c.xMax}
            step={c.xStep}
            onChange={setX}
            accent={TONE_ACCENT[c.tone]}
          />
          <div className={"rounded-2xl border-2 p-4 text-center " + (u >= 0 ? "border-amber-400/40 bg-amber-400/[0.08]" : "border-rose-400/50 bg-rose-400/[0.10]")}>
            <p className={"text-xs font-bold " + (u >= 0 ? "text-amber-200" : "text-rose-200")}>효용 U</p>
            <p className={"mt-0.5 font-mono text-4xl font-bold " + (u >= 0 ? "text-amber-100" : "text-rose-100")}>{fmt(u)}</p>
            <FormulaLine expr={substTex(c, x)} className="mt-1 text-slate-100" />
            {u < 0 ? <p className="text-[11px] font-bold text-rose-200">효용이 음수예요 — 먹지 않느니만 못한 상태!</p> : null}
          </div>
          {peak ? (
            <div className="rounded-xl border border-pink-400/30 bg-pink-400/[0.07] px-3 py-2 text-[11px] leading-5 text-slate-300">
              🌸 <b className="text-pink-200">{fmt(peak.x)}{c.unit}</b>에서 효용이 <b className="text-pink-200">{fmt(peak.u)}</b>로
              가장 커요. 그보다 더 소비하면 오히려 만족도가 떨어집니다.
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.07] px-3 py-2 text-[11px] leading-5 text-slate-300">
              🌱 소비량이 늘수록 효용이 <b className="text-emerald-200">계속 커지는</b> 모양이에요.
            </div>
          )}

          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[320px] border-collapse text-center font-mono text-xs">
              <tbody>
                <tr>
                  <th className="border border-white/15 bg-sky-500/25 px-2 py-1.5 text-[10px] font-bold text-sky-50">
                    x ({c.unit})
                  </th>
                  {ints.map((i) => (
                    <td
                      key={i}
                      className={
                        "border border-white/15 px-1.5 py-1.5 font-bold " +
                        (Math.abs(i - x) < c.xStep / 2 ? "bg-amber-400/25 text-amber-100" : "bg-white/5 text-slate-300")
                      }
                    >
                      {i}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="border border-white/15 bg-sky-500/25 px-2 py-1.5 text-[10px] font-bold text-sky-50">U</th>
                  {ints.map((i) => (
                    <td
                      key={i}
                      className={
                        "border border-white/15 px-1.5 py-1.5 " +
                        (Math.abs(i - x) < c.xStep / 2
                          ? "bg-amber-400/25 font-bold text-amber-100"
                          : uOf(c, i) < 0
                            ? "text-rose-300"
                            : "text-slate-300")
                      }
                    >
                      {fmt(uOf(c, i), 1)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 한계효용 체감의 법칙
// ══════════════════════════════════════════════════════════════
function MuTab() {
  const [cid, setCid] = useState(CASES[0].id);
  const c = caseOf(cid);
  const [n, setN] = useState(0);

  const ints = Array.from({ length: c.nMax + 1 }, (_, i) => i);
  const uMax = Math.max(...ints.map((i) => uOf(c, i)), 1);
  const uMin = Math.min(...ints.map((i) => uOf(c, i)), 0);
  const mus = ints.slice(1).map((i) => muOf(c, i));
  const muMax = Math.max(...mus, 0.5);
  const muMin = Math.min(...mus, 0);
  const nextMu = n < c.nMax ? muOf(c, n + 1) : null;

  function pick(next: UtilCase) {
    setCid(next.id);
    setN(0);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.06] p-4">
        <p className="text-sm font-bold text-violet-200">➕ 한계효용이란?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          <b className="text-violet-100">한 단위를 더 소비할 때 늘어나는 효용</b>이에요. 예를 들어 빵 한 개를 먹을 때의
          효용이 4, 두 개를 먹을 때의 효용이 7이라면 두 번째 빵의 한계효용은 7 − 4 = 3 이 됩니다.
        </p>
        <FormulaLine expr="MU(n) = U(n) - U(n-1)" className="text-slate-100" />
      </div>

      <CasePicker cid={cid} onPick={pick} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <BarChart
            label={`총효용 U — ${c.emoji} ${c.name}을(를) 먹은 만큼`}
            xs={ints}
            values={ints.map((i) => uOf(c, i))}
            hi={uMax}
            lo={uMin}
            active={n}
            color={CURVE[c.tone]}
            unit={c.unit}
          />
          <BarChart
            label="한계효용 MU — 한 개 더 먹을 때 늘어난 만큼"
            xs={ints.slice(1)}
            values={mus}
            hi={muMax}
            lo={muMin}
            active={n}
            color="#f472b6"
            unit={c.unit}
          />
        </div>

        <div className="space-y-2">
          <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-400/[0.08] p-4 text-center">
            <p className="text-6xl leading-none">{c.emoji}</p>
            <p className="mt-2 font-mono text-3xl font-bold text-amber-100">
              {n} <span className="text-base">{c.unit}</span>
            </p>
            <p className="text-[11px] text-slate-400">지금까지 먹은 양</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-black/25 px-2 py-1.5">
                <p className="text-[10px] text-slate-400">총효용 U</p>
                <p className="font-mono text-lg font-bold text-emerald-200">{fmt(uOf(c, n), 1)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-2 py-1.5">
                <p className="text-[10px] text-slate-400">마지막 한 개의 MU</p>
                <p className={"font-mono text-lg font-bold " + (n === 0 ? "text-slate-500" : muOf(c, n) >= 0 ? "text-pink-200" : "text-rose-300")}>
                  {n === 0 ? "—" : (muOf(c, n) >= 0 ? "+" : "") + fmt(muOf(c, n), 1)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={n >= c.nMax}
              onClick={() => setN(n + 1)}
              className="flex-1 rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 px-3 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/25 disabled:opacity-40"
            >
              {c.emoji} 한 {c.unit} 더!
            </button>
            <button
              type="button"
              disabled={n <= 0}
              onClick={() => setN(n - 1)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
            >
              ↩️ 하나 빼기
            </button>
            <button
              type="button"
              onClick={() => setN(0)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              처음
            </button>
          </div>

          {nextMu !== null ? (
            <div
              className={
                "rounded-xl border-2 px-3 py-2 text-center text-xs font-bold " +
                (nextMu > 0
                  ? "border-emerald-400/40 bg-emerald-400/[0.08] text-emerald-100"
                  : nextMu === 0
                    ? "border-amber-400/40 bg-amber-400/[0.08] text-amber-100"
                    : "border-rose-400/50 bg-rose-400/[0.10] text-rose-100")
              }
            >
              {nextMu > 0
                ? `다음 한 ${c.unit}을 먹으면 만족이 ${fmt(nextMu, 1)}만큼 늘어요`
                : nextMu === 0
                  ? `다음 한 ${c.unit}은 만족을 하나도 더해 주지 않아요 — 지금이 딱 좋아요!`
                  : `다음 한 ${c.unit}을 먹으면 만족이 ${fmt(-nextMu, 1)}만큼 줄어요 — 이제 그만! 🙅`}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-bold text-slate-300">
              더는 먹을 수 없어요.
            </div>
          )}

          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[320px] border-collapse text-center font-mono text-xs">
              <tbody>
                <tr>
                  <th className="border border-white/15 bg-sky-500/25 px-2 py-1.5 text-[10px] font-bold text-sky-50">n</th>
                  {ints.map((i) => (
                    <td key={i} className={"border border-white/15 px-1.5 py-1.5 font-bold " + (i === n ? "bg-amber-400/25 text-amber-100" : "bg-white/5 text-slate-300")}>
                      {i}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="border border-white/15 bg-emerald-500/20 px-2 py-1.5 text-[10px] font-bold text-emerald-100">U</th>
                  {ints.map((i) => (
                    <td key={i} className={"border border-white/15 px-1.5 py-1.5 " + (i === n ? "bg-amber-400/25 font-bold text-amber-100" : "text-slate-300")}>
                      {fmt(uOf(c, i), 1)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="border border-white/15 bg-pink-500/20 px-2 py-1.5 text-[10px] font-bold text-pink-100">MU</th>
                  <td className="border border-white/15 px-1.5 py-1.5 text-slate-600">—</td>
                  {ints.slice(1).map((i) => (
                    <td
                      key={i}
                      className={
                        "border border-white/15 px-1.5 py-1.5 " +
                        (i === n ? "bg-amber-400/25 font-bold text-amber-100" : muOf(c, i) < 0 ? "text-rose-300" : "text-pink-200")
                      }
                    >
                      {fmt(muOf(c, i), 1)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">🔎 네 사례의 한계효용을 견주어 보면</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CASES.map((m) => {
            const list = Array.from({ length: m.nMax }, (_, i) => muOf(m, i + 1));
            const dec = list.every((v, i) => i === 0 || v < list[i - 1] + 1e-9);
            const flat = list.every((v) => Math.abs(v - list[0]) < 1e-9);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => pick(m)}
                className={"rounded-xl border p-2.5 text-left transition " + (cid === m.id ? TONE_ON[m.tone] : "border-white/10 bg-white/5 hover:bg-white/10")}
              >
                <p className="text-xs font-bold text-slate-100">
                  {m.emoji} {m.name}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-slate-400">{list.slice(0, 6).map((v) => fmt(v, 1)).join(" · ")}{m.nMax > 6 ? " …" : ""}</p>
                <p className={"mt-1 text-[11px] font-bold " + (flat ? "text-emerald-200" : dec ? "text-pink-200" : "text-slate-300")}>
                  {flat ? "한계효용이 변하지 않아요" : dec ? "한계효용 체감 ✅" : "들쭉날쭉해요"}
                </p>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-400">
          대부분의 상품은 소비량이 늘수록 한계효용이 작아져요(<b className="text-pink-200">한계효용 체감의 법칙</b>).
          한계효용이 0이 되는 지점에서 총효용이 가장 크고, 그 뒤로 음수가 되면 더 소비할수록 손해예요.
        </p>
      </div>
    </div>
  );
}

const BW = 380,
  BH = 190,
  BL = 44,
  BR = 14,
  BT = 30,
  BB = 28;

function BarChart({
  label,
  xs,
  values,
  hi,
  lo,
  active,
  color,
  unit,
}: {
  label: string;
  xs: number[];
  values: number[];
  hi: number;
  lo: number;
  active: number;
  color: string;
  unit: string;
}) {
  const top = hi * 1.12 || 1;
  const bottom = Math.min(0, lo * 1.12);
  const Y = (v: number) => BH - BB - ((v - bottom) / (top - bottom)) * (BH - BT - BB);
  const slot = (BW - BL - BR) / Math.max(xs.length, 1);
  const bw = Math.min(slot * 0.62, 26);
  const zero = Y(0);
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <p className="px-1 pt-1 text-[11px] font-bold text-slate-300">{label}</p>
      <div className="overflow-x-auto overflow-y-hidden">
        <svg viewBox={`0 0 ${BW} ${BH}`} className="h-auto w-full min-w-[320px]" role="img" aria-label={label}>
          <rect x={0} y={0} width={BW} height={BH} rx={10} fill="#0b1220" />
          {[0, 0.5, 1].map((r) => (
            <g key={r}>
              <line x1={BL} y1={Y(bottom + r * (top - bottom))} x2={BW - BR} y2={Y(bottom + r * (top - bottom))} stroke="rgba(148,163,184,0.14)" strokeWidth={0.8} />
              <text x={BL - 5} y={Y(bottom + r * (top - bottom))} dy={3} textAnchor="end" fill="#64748b" fontSize={8.5} fontFamily="monospace">
                {fmt(bottom + r * (top - bottom), 1)}
              </text>
            </g>
          ))}
          {xs.map((k, i) => {
            const v = values[i];
            const cx = BL + slot * i + slot / 2;
            const on = k <= active;
            return (
              <g key={k}>
                <rect
                  x={cx - bw / 2}
                  y={Math.min(Y(v), zero)}
                  width={bw}
                  height={Math.abs(Y(v) - zero)}
                  rx={2}
                  fill={v < 0 ? "#f43f5e" : color}
                  fillOpacity={on ? 0.95 : 0.22}
                  stroke={k === active ? "#fff" : "none"}
                  strokeWidth={k === active ? 1.6 : 0}
                />
                {on ? (
                  <text x={cx} y={v >= 0 ? Y(v) - 4 : Y(v) + 11} textAnchor="middle" fill={v < 0 ? "#fda4af" : "#e2e8f0"} fontSize={8.5} fontFamily="monospace" fontWeight={700}>
                    {fmt(v, 1)}
                  </text>
                ) : null}
                <text x={cx} y={BH - BB + 12} textAnchor="middle" fill="#64748b" fontSize={8.5} fontFamily="monospace">
                  {k}
                </text>
              </g>
            );
          })}
          <line x1={BL} y1={zero} x2={BW - BR} y2={zero} stroke="#94a3b8" strokeWidth={1.2} />
          <line x1={BL} y1={BT} x2={BL} y2={BH - BB} stroke="#94a3b8" strokeWidth={1.2} />
          <text x={BW - BR} y={BH - BB + 22} textAnchor="end" fill="#94a3b8" fontSize={9}>
            {unit}
          </text>
        </svg>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 나의 효용 곡선 그리기
// ══════════════════════════════════════════════════════════════
const DW = 400,
  DH = 320,
  DL = 46,
  DR = 18,
  DT = 30,
  DB = 36;

function DrawTab() {
  const [item, setItem] = useState(DRAW_ITEMS[0].id);
  const [vals, setVals] = useState<(number | null)[]>(Array(DRAW_NMAX + 1).fill(null));
  const [showFriends, setShowFriends] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const painting = useRef(false);

  const it = DRAW_ITEMS.find((d) => d.id === item) ?? DRAW_ITEMS[0];
  const X = (v: number) => DL + (v / DRAW_NMAX) * (DW - DL - DR);
  const Y = (v: number) => DH - DB - (v / DRAW_UMAX) * (DH - DT - DB);

  function put(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    if (r.width === 0) return;
    const sx = ((e.clientX - r.left) / r.width) * DW;
    const sy = ((e.clientY - r.top) / r.height) * DH;
    const ix = Math.round(((sx - DL) / (DW - DL - DR)) * DRAW_NMAX);
    if (ix < 1 || ix > DRAW_NMAX) return;
    const raw = ((DH - DB - sy) / (DH - DT - DB)) * DRAW_UMAX;
    const v = Math.min(DRAW_UMAX, Math.max(0, Math.round(raw / DRAW_STEP) * DRAW_STEP));
    setVals((prev) => {
      const next = [...prev];
      next[ix] = v;
      return next;
    });
  }

  const filled = vals.map((v, i) => (i === 0 ? 0 : v));
  const done = filled.every((v) => v !== null);
  const mine = filled.map((v) => (v === null ? null : v));
  const myMu = done ? Array.from({ length: DRAW_NMAX }, (_, i) => (mine[i + 1] as number) - (mine[i] as number)) : [];
  const decreasing = done && myMu.every((v, i) => i === 0 || v < myMu[i - 1] + 1e-9);
  const firstUp = done ? myMu.findIndex((v, i) => i > 0 && v > myMu[i - 1] + 1e-9) : -1;

  function poly(list: (number | null)[]) {
    const seg: string[] = [];
    let cur: string[] = [];
    list.forEach((v, i) => {
      if (v === null) {
        if (cur.length > 1) seg.push(cur.join(" "));
        cur = [];
      } else cur.push(`${X(i)},${Y(v)}`);
    });
    if (cur.length > 1) seg.push(cur.join(" "));
    return seg;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">✏️ 내 효용 곡선을 직접 그려 보자</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          좋아하는 것을 하나 고르고, <b className="text-emerald-100">개수마다 내가 느낄 만족도를 좌표평면에 콕 찍어</b>{" "}
          보세요. 점을 찍으면 선으로 이어져 나만의 효용 곡선이 완성돼요. 정답은 없어요 — 효용은 주관적이니까요!
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {DRAW_ITEMS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              setItem(d.id);
              setVals(Array(DRAW_NMAX + 1).fill(null));
            }}
            className={
              "rounded-xl border-2 px-3 py-2.5 text-center text-sm font-bold transition " +
              (item === d.id ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {d.emoji} {d.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
          <div className="overflow-x-auto overflow-y-hidden">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${DW} ${DH}`}
              className="h-auto w-full min-w-[320px] cursor-crosshair touch-none select-none"
              style={{ touchAction: "none" }}
              role="img"
              aria-label="내 효용 곡선 그리기"
              onPointerDown={(e) => {
                svgRef.current?.setPointerCapture(e.pointerId);
                painting.current = true;
                put(e);
              }}
              onPointerMove={(e) => {
                if (painting.current) put(e);
              }}
              onPointerUp={() => {
                painting.current = false;
              }}
              onPointerCancel={() => {
                painting.current = false;
              }}
            >
              <rect x={0} y={0} width={DW} height={DH} rx={10} fill="#0b1220" />
              {Array.from({ length: DRAW_UMAX + 1 }, (_, i) => (
                <g key={`gy${i}`}>
                  <line x1={DL} y1={Y(i)} x2={DW - DR} y2={Y(i)} stroke="rgba(148,163,184,0.13)" strokeWidth={0.8} />
                  <text x={DL - 6} y={Y(i)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                    {i}
                  </text>
                </g>
              ))}
              {Array.from({ length: DRAW_NMAX + 1 }, (_, i) => (
                <g key={`gx${i}`}>
                  <line x1={X(i)} y1={DT} x2={X(i)} y2={DH - DB} stroke="rgba(148,163,184,0.13)" strokeWidth={0.8} />
                  <text x={X(i)} y={DH - DB + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                    {i}
                  </text>
                </g>
              ))}

              {showFriends
                ? FRIENDS.map((f) => (
                    <polyline
                      key={f.id}
                      points={f.values.map((v, i) => `${X(i)},${Y(v)}`).join(" ")}
                      fill="none"
                      stroke={f.color}
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      opacity={0.75}
                    />
                  ))
                : null}

              {poly(mine).map((s, i) => (
                <polyline key={`me${i}`} points={s} fill="none" stroke="#34d399" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              ))}

              <line x1={DL} y1={DH - DB} x2={DW - DR} y2={DH - DB} stroke="#94a3b8" strokeWidth={1.2} />
              <line x1={DL} y1={DT} x2={DL} y2={DH - DB} stroke="#94a3b8" strokeWidth={1.2} />

              {mine.map((v, i) =>
                v === null ? (
                  <circle key={`h${i}`} cx={X(i)} cy={DH - DB} r={3} fill="#475569" />
                ) : (
                  <g key={`p${i}`}>
                    <circle cx={X(i)} cy={Y(v)} r={6} fill="#fff" />
                    <circle cx={X(i)} cy={Y(v)} r={3.6} fill="#34d399" />
                  </g>
                ),
              )}

              <text x={DW - DR} y={DH - DB + 27} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                {it.name} ({it.unit})
              </text>
              <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                효용 U
              </text>
            </svg>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-1 pb-1">
            <span className="text-[10px] text-slate-500">그래프를 눌러(끌어) 만족도를 찍어 보세요 (0.5 단위)</span>
            <button
              type="button"
              onClick={() => setVals(Array(DRAW_NMAX + 1).fill(null))}
              className="ml-auto rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↩️ 지우기
            </button>
            <button
              type="button"
              onClick={() => setShowFriends(!showFriends)}
              className={
                "rounded-lg border px-2.5 py-1 text-[11px] font-bold transition " +
                (showFriends ? "border-sky-400/50 bg-sky-400/15 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              👥 친구 곡선 {showFriends ? "숨기기" : "겹쳐 보기"}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[300px] border-collapse text-center font-mono text-xs">
              <tbody>
                <tr>
                  <th className="border border-white/15 bg-sky-500/25 px-2 py-1.5 text-[10px] font-bold text-sky-50">
                    {it.name} ({it.unit})
                  </th>
                  {Array.from({ length: DRAW_NMAX + 1 }, (_, i) => (
                    <td key={i} className="border border-white/15 bg-white/5 px-1.5 py-1.5 font-bold text-slate-300">
                      {i}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="border border-white/15 bg-emerald-500/20 px-2 py-1.5 text-[10px] font-bold text-emerald-100">효용 U</th>
                  {mine.map((v, i) => (
                    <td key={i} className={"border border-white/15 px-1.5 py-1.5 " + (v === null ? "text-slate-600" : "text-emerald-100")}>
                      {v === null ? "?" : fmt(v, 1)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="border border-white/15 bg-pink-500/20 px-2 py-1.5 text-[10px] font-bold text-pink-100">MU</th>
                  <td className="border border-white/15 px-1.5 py-1.5 text-slate-600">—</td>
                  {Array.from({ length: DRAW_NMAX }, (_, i) => {
                    const a = mine[i],
                      b = mine[i + 1];
                    const v = a === null || b === null ? null : b - a;
                    return (
                      <td key={i} className={"border border-white/15 px-1.5 py-1.5 " + (v === null ? "text-slate-600" : v < 0 ? "text-rose-300" : "text-pink-200")}>
                        {v === null ? "?" : fmt(v, 1)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {done ? (
            <div
              className={
                "rounded-2xl border-2 p-4 text-center " +
                (decreasing ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-amber-400/50 bg-amber-400/[0.10]")
              }
            >
              <p className={"text-sm font-bold " + (decreasing ? "text-emerald-100" : "text-amber-100")}>
                {decreasing ? "🎉 한계효용 체감의 법칙을 따르는 곡선이에요!" : "🤔 한계효용이 중간에 다시 커졌어요"}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-300">
                {decreasing
                  ? "한 개씩 더 먹을 때 늘어나는 만족이 계속 작아지고 있어요. 대부분의 상품이 이런 모양이랍니다."
                  : `${firstUp + 1}${it.unit}째에서 앞보다 만족이 더 크게 늘었어요. 그런 상품이 있을 수도 있지만 흔하지는 않아요 — 왜 그렇게 느꼈는지 이야기해 볼까요?`}
              </p>
              <p className="mt-1 font-mono text-[11px] text-slate-400">
                총효용 {fmt(mine[DRAW_NMAX] as number, 1)} · 한계효용 {myMu.map((v) => fmt(v, 1)).join(" · ")}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center text-xs text-slate-400">
              {mine.filter((v) => v !== null).length - 1} / {DRAW_NMAX} 개를 찍었어요. 모두 찍으면 한계효용을 자동으로
              살펴봐 드릴게요.
            </div>
          )}

          {showFriends ? (
            <div className="space-y-1.5">
              {FRIENDS.map((f) => (
                <div key={f.id} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <p className="text-xs font-bold" style={{ color: f.color }}>
                    {f.emoji} {f.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-400">{f.values.map((v) => fmt(v, 1)).join(" · ")}</p>
                  <p className="text-[11px] leading-4 text-slate-400">{f.note}</p>
                </div>
              ))}
              <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2 text-[11px] leading-5 text-amber-100">
                같은 상품인데 곡선의 모양이 저마다 다르죠? 효용이 <b>주관적인 지표</b>라는 뜻이에요.
              </p>
            </div>
          ) : null}
        </div>
      </div>
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
          <p className="text-sm font-bold text-violet-200">🧩 효용함수 단계별 문제</p>
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
        {prob.table ? (
          <div className="mt-2 overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[300px] border-collapse text-center text-xs">
              <tbody>
                <tr>
                  {prob.table.head.map((h, i) => (
                    <th
                      key={h + i}
                      className={
                        "border border-white/15 px-2 py-1.5 font-bold " +
                        (i === 0 ? "bg-sky-500/25 text-sky-50" : "bg-white/5 font-mono text-slate-200")
                      }
                    >
                      {h}
                    </th>
                  ))}
                </tr>
                {prob.table.rows.map((r) => (
                  <tr key={r[0]}>
                    {r.map((v, i) => (
                      <td
                        key={v + i}
                        className={
                          "border border-white/15 px-2 py-1.5 " +
                          (i === 0 ? "bg-sky-500/25 font-bold text-sky-50" : "font-mono text-slate-200")
                        }
                      >
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
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 네 문제를 모두 해결했어요! 효용함수 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
