"use client";

import { useEffect, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CONT_LABEL,
  CYCLES,
  DATA_NOTE,
  PRESETS,
  QUESTS,
  compoundM,
  contMultiplyTime,
  continuous,
  effectiveAnnual,
  simple,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_converge",
    prompt:
      "이자 계산 주기를 연 → 분기 → 월 → 일 → 초로 쪼갤수록 원리합계가 커졌지만, 어느 값을 넘지 못하고 멈췄어요. 왜 무한히 커지지 않는지 자기 말로 설명하고, 그 한계값이 무엇이었는지 식으로 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 주기를 쪼개면 이율도 함께 1/m로 작아지기 때문에 늘어나는 양이 점점 줄어든다. 그래서 (1+r/m)^(mn)은 A·e^(rn)에 수렴한다.",
  },
  {
    id: "diminishing",
    prompt:
      "연 10% 100만원 1년 기준으로 연 → 분기에서는 0.38만원이 늘었는데, 일 → 초에서는 거의 늘지 않았어요. 이렇게 ‘쪼갤수록 효과가 줄어드는’ 현상을 표나 그래프에서 관찰한 대로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 처음 몇 번 쪼갤 때는 눈에 띄게 늘지만 금세 한계값에 가까워져, 일 단위만 되어도 연속복리와 거의 같아진다.",
  },
  {
    id: "which_better",
    prompt:
      "같은 원금·이율·기간에서 단리 < 복리 < 연속복리 순으로 원리합계가 커졌어요. 은행이 예금과 대출에 각각 어떤 방식을 쓰고 싶어 할지 생각해 보고, 우리가 금융 상품을 고를 때 무엇을 확인해야 할지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 예금에는 이자를 적게 주는 방식을, 대출에는 이자를 많이 받는 방식을 쓰고 싶어 할 것이다. 그래서 이율뿐 아니라 ‘이자를 몇 번 계산하는지’도 확인해야 한다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function won(v: number): string { return Math.round(v).toLocaleString("ko-KR") + "원"; }
function man(v: number, d = 2): string {
  return (v / 10000).toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "만원";
}
function pctText(v: number, d = 0): string { return v.toFixed(d) + "%"; }
function fmtM(m: number): string {
  return Number.isFinite(m) ? (Number.isInteger(m) ? m.toLocaleString("ko-KR") : m.toFixed(2)) : "∞";
}
function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "sim" | "compare" | "quest";

export default function ContinuousCompoundLab() {
  const [tab, setTab] = useState<Tab>("sim");
  const [a, setA] = useState(1_000_000);
  const [ratePct, setRatePct] = useState(10);
  const [years, setYears] = useState(1);
  const setup = { a, setA, ratePct, setRatePct, years, setYears };

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">♾️ 연속복리</h3>
        <p className="mt-2 leading-7 text-slate-300">
          복리에서 <b className="text-emerald-200">이자 계산 주기를 점점 짧게</b> 하면 원리합계는 어떻게 될까요? 연 → 분기 →
          월 → 일 → 시 → 분 → 초로 쪼개 보면, 끝없이 커지지 않고 한 값에 다가가요. 바로{" "}
          <b className="text-emerald-200">S = A·e<sup>rn</sup></b> 입니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "sim"} onClick={() => setTab("sim")}>① 주기를 쪼개 보기</TabButton>
        <TabButton active={tab === "compare"} onClick={() => setTab("compare")}>② 단리·복리·연속복리</TabButton>
        <TabButton active={tab === "quest"} onClick={() => setTab("quest")}>③ 도전 문제</TabButton>
      </div>

      <div className="mt-4">
        {tab === "sim" ? <SimTab {...setup} /> : null}
        {tab === "compare" ? <CompareTab {...setup} /> : null}
        {tab === "quest" ? <QuestTab /> : null}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">📌 {DATA_NOTE}</p>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={"rounded-xl border-2 px-3 py-2 text-sm font-bold transition " + (active ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
      {children}
    </button>
  );
}

type Setup = {
  a: number; setA: (v: number) => void;
  ratePct: number; setRatePct: (v: number) => void;
  years: number; setYears: (v: number) => void;
};

function SetupBox({ a, setA, ratePct, setRatePct, years, setYears, accent }: Setup & { accent: string }) {
  return (
    <div className={"rounded-2xl border p-4 " + (accent === "sky" ? "border-sky-400/25 bg-sky-400/[0.06]" : "border-violet-400/25 bg-violet-400/[0.06]")}>
      <p className={"text-sm font-bold " + (accent === "sky" ? "text-sky-200" : "text-violet-200")}>🎛️ 원금과 이율을 정해 보세요</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" title={p.note}
            onClick={() => { setA(p.a); setRatePct(p.ratePct); setYears(p.years); }}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10">
            {p.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Slider id="ca" label="원금 A" value={man(a, 0)} min={100_000} max={20_000_000} step={100_000} v={a} onChange={setA} accent={accent} />
        <Slider id="cr" label="연이율 r" value={pctText(ratePct)} min={1} max={20} step={1} v={ratePct} onChange={setRatePct} accent={accent} />
        <Slider id="cy" label="기간 n" value={`${years}년`} min={1} max={30} step={1} v={years} onChange={setYears} accent={accent} />
      </div>
    </div>
  );
}

function Slider({ id, label, value, min, max, step, v, onChange, accent = "sky" }: {
  id: string; label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void; accent?: string;
}) {
  const color = accent === "sky" ? "text-sky-200" : "text-violet-200";
  const range = accent === "sky" ? "accent-sky-400 focus-visible:ring-sky-300/40" : "accent-violet-400 focus-visible:ring-violet-300/40";
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
      <label htmlFor={id} className="text-xs font-bold text-slate-300">{label}: <span className={"font-mono " + color}>{value}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-2 w-full focus-visible:outline-none focus-visible:ring-2 " + range} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 주기를 쪼개 보기 (sky)
// ══════════════════════════════════════════════════════════════
const LAST = CYCLES.length; // 연속복리 인덱스

function SimTab(setup: Setup) {
  const { a, ratePct, years } = setup;
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(false);
  const r = ratePct / 100;

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setIdx((i) => (i >= LAST ? i : i + 1)), 850);
    const stop = setTimeout(() => setAuto(false), 850 * (LAST + 1));
    return () => { clearInterval(id); clearTimeout(stop); };
  }, [auto]);

  const isCont = idx >= LAST;
  const cyc = isCont ? null : CYCLES[idx];
  const m = isCont ? Infinity : cyc!.m;
  const value = isCont ? continuous(a, r, years) : compoundM(a, r, m, years);

  const vYear = compoundM(a, r, 1, years);
  const vCont = continuous(a, r, years);
  const progress = vCont > vYear ? clamp01((value - vYear) / (vCont - vYear)) : 1;

  const rows = [
    ...CYCLES.map((c) => ({ key: c.key, emoji: c.emoji, label: c.label, m: c.m, v: compoundM(a, r, c.m, years) })),
    { key: "cont", emoji: CONT_LABEL.emoji, label: CONT_LABEL.label, m: Infinity, v: vCont },
  ];
  const lo = vYear;
  const hi = vCont;
  const span = hi - lo || 1;

  return (
    <div className="space-y-4">
      <SetupBox {...setup} accent="sky" />

      {/* 공식 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-sky-400/35 bg-sky-400/[0.08] p-4 text-center">
          <p className="text-xs font-bold text-sky-200">연 m회 복리</p>
          <p className="mt-1 font-mono text-xl font-bold text-sky-100">S<sub>m</sub> = A(1 + r/m)<sup>mn</sup></p>
        </div>
        <div className="rounded-2xl border border-emerald-400/35 bg-emerald-400/[0.08] p-4 text-center">
          <p className="text-xs font-bold text-emerald-200">m → ∞ 이면 (연속복리)</p>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-100">S = A·e<sup>rn</sup></p>
        </div>
      </div>

      {/* 주기 선택 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">⏱️ 이자 계산 주기를 골라 보세요</p>
          <button type="button" onClick={() => { setIdx(0); setAuto(true); }} disabled={auto}
            className="rounded-lg border-2 border-sky-400/55 bg-sky-400/15 px-3 py-1 text-xs font-bold text-sky-100 transition hover:bg-sky-400/25 disabled:opacity-50">
            {auto ? "쪼개는 중…" : "▶ 자동으로 쪼개 보기"}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CYCLES.map((c, i) => (
            <button key={c.key} type="button" onClick={() => { setAuto(false); setIdx(i); }}
              className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (idx === i ? "border-sky-400/60 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
              {c.emoji} {c.short}
            </button>
          ))}
          <button type="button" onClick={() => { setAuto(false); setIdx(LAST); }}
            className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (isCont ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
            {CONT_LABEL.emoji} {CONT_LABEL.short}
          </button>
        </div>

        {/* 계산식 전개 */}
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
          <p className="text-xs font-bold text-slate-400">
            {isCont ? `${CONT_LABEL.emoji} ${CONT_LABEL.label}` : `${cyc!.emoji} ${cyc!.label} (m = ${fmtM(m)})`}
          </p>
          <p className="mt-1 overflow-x-auto whitespace-nowrap font-mono text-sm text-slate-200">
            {isCont ? (
              <>{man(a, 0)} × e<sup>{r} × {years}</sup> = {man(a, 0)} × {Math.exp(r * years).toFixed(5)}</>
            ) : (
              <>
                {man(a, 0)} × (1 + {ratePct}/{fmtM(m)} ÷ 100)<sup>{fmtM(m)}×{years}</sup> = {man(a, 0)} × ({(1 + r / m).toFixed(6)})<sup>{fmtM(m * years)}</sup>
              </>
            )}
          </p>
          <p className="mt-2 text-center font-mono text-3xl font-bold text-sky-100">{man(value)}</p>
          <p className="mt-0.5 text-center font-mono text-xs text-slate-400">{won(value)}</p>
        </div>

        {/* 수렴 게이지 */}
        <div className="mt-3">
          <div className="flex items-baseline justify-between text-[11px] text-slate-400">
            <span>연 1회 {man(vYear)}</span>
            <span className="font-bold text-emerald-300">연속복리 {man(vCont)}</span>
          </div>
          <div className="relative mt-1 h-4 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-1 text-center text-xs text-slate-300">
            연속복리까지 <b className="font-mono text-emerald-200">{(progress * 100).toFixed(1)}%</b> 도달
            {!isCont ? <> · 연속복리와의 차이 <b className="font-mono text-amber-200">{won(vCont - value)}</b></> : null}
          </p>
        </div>
      </div>

      {/* 확대 막대 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📊 주기별 원리합계 (확대해서 보기)</p>
        <p className="mt-1 text-[11px] text-slate-500">
          값들이 너무 가까워서 0부터 그리면 구분이 안 돼요. 연 1회({man(lo)})부터 연속복리({man(hi)})까지만 잘라 크게 늘여 그렸어요.
        </p>
        <div className="mt-2 space-y-1">
          {rows.map((row, i) => {
            const w = clamp01((row.v - lo) / span) * 100;
            const on = (isCont && row.key === "cont") || (!isCont && row.key === cyc!.key);
            return (
              <div key={row.key} className={"flex items-center gap-2 rounded-lg px-1.5 py-0.5 " + (on ? "bg-sky-400/15" : "")}>
                <span className={"w-32 shrink-0 truncate text-xs " + (row.key === "cont" ? "font-bold text-emerald-200" : "text-slate-300")}>
                  {row.emoji} {row.label}
                </span>
                <span className="w-16 shrink-0 text-right font-mono text-[10px] text-slate-500">m={fmtM(row.m)}</span>
                <div className="h-3 flex-1 overflow-hidden rounded bg-white/10">
                  <div className="h-full rounded transition-all duration-500"
                    style={{ width: `${Math.max(1.2, w)}%`, backgroundColor: row.key === "cont" ? "#34d399" : `hsl(${200 - i * 4} 85% ${58 - i * 1.5}%)` }} />
                </div>
                <span className={"w-24 shrink-0 text-right font-mono text-xs " + (row.key === "cont" ? "font-bold text-emerald-200" : "text-slate-200")}>{man(row.v)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📋 자세한 값</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="px-2 py-1.5 text-left font-semibold">계산 주기</th>
                <th className="px-2 py-1.5 text-right font-semibold">m</th>
                <th className="px-2 py-1.5 text-right font-semibold">1 + r/m</th>
                <th className="px-2 py-1.5 text-right font-semibold">원리합계</th>
                <th className="px-2 py-1.5 text-right font-semibold">직전보다 늘어난 돈</th>
                <th className="px-2 py-1.5 text-right font-semibold">실효 연이율</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const on = (isCont && row.key === "cont") || (!isCont && row.key === cyc!.key);
                const gain = i === 0 ? null : row.v - rows[i - 1].v;
                return (
                  <tr key={row.key} className={"border-t border-white/5 " + (on ? "bg-sky-400/15" : row.key === "cont" ? "bg-emerald-400/10" : "")}>
                    <td className={"px-2 py-1 " + (row.key === "cont" ? "font-bold text-emerald-200" : "text-slate-200")}>{row.emoji} {row.label}</td>
                    <td className="px-2 py-1 text-right font-mono text-xs text-slate-400">{fmtM(row.m)}</td>
                    <td className="px-2 py-1 text-right font-mono text-xs text-slate-400">
                      {Number.isFinite(row.m) ? (1 + r / row.m).toFixed(8) : "—"}
                    </td>
                    <td className="px-2 py-1 text-right font-mono text-sm font-bold text-slate-100">{man(row.v)}</td>
                    <td className="px-2 py-1 text-right font-mono text-xs text-amber-200">{gain == null ? "—" : "+" + won(gain)}</td>
                    <td className="px-2 py-1 text-right font-mono text-xs text-slate-300">
                      {(effectiveAnnual(r, row.m) * 100).toFixed(4)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          ‘직전보다 늘어난 돈’ 열을 보세요. 처음에는 눈에 띄게 늘지만 <b className="text-amber-200">갈수록 늘어나는 양이 급격히 줄어</b>{" "}
          하루 단위만 되어도 연속복리와 거의 같아져요.
        </p>
      </div>

      {/* e */}
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">♾️ 그 한계값이 바로 e</p>
        <p className="mt-1 text-sm leading-7 text-slate-300">
          주기를 쪼개면 이자를 붙이는 횟수 m은 커지지만 한 번에 붙는 이율 r/m은 작아져요. 그래서 원리합계는 끝없이 커지지 않고
          한 값에 다가갑니다.
        </p>
        <div className="mt-2 space-y-1 overflow-x-auto rounded-lg bg-black/25 px-3 py-2 font-mono text-xs text-slate-200">
          <p>lim<sub>m→∞</sub> (1 + r/m)<sup>m/r</sup> = e = 2.718281…</p>
          <p>S<sub>m</sub> = A(1 + r/m)<sup>mn</sup> → S = A·e<sup>rn</sup></p>
          <p className="text-emerald-200">
            = {man(a, 0)} × e<sup>{r}×{years}</sup> = {man(vCont)}
          </p>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          이런 복리를 <b className="text-emerald-200">연속복리</b>라고 해요. 연속복리에서는 원금이 k배가 되는 시간도 딱 떨어져요 —{" "}
          n = ln k ÷ r. 지금 이율({ratePct}%)이라면 두 배가 되는 데{" "}
          <b className="font-mono text-emerald-200">{contMultiplyTime(r, 2).toFixed(2)}년</b>이 걸려요.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 단리·복리·연속복리 (violet)
// ══════════════════════════════════════════════════════════════
const CW = 340, CH = 200, PL = 46, PR = 10, PT = 12, PB = 24;

function CompareTab(setup: Setup) {
  const { a, ratePct, years } = setup;
  const [cursor, setCursor] = useState(Math.min(10, years));
  const r = ratePct / 100;
  const n = Math.max(years, 2);
  const k = Math.min(cursor, n);

  const sVals = Array.from({ length: n + 1 }, (_, i) => simple(a, r, i));
  const cVals = Array.from({ length: n + 1 }, (_, i) => compoundM(a, r, 1, i));
  const eVals = Array.from({ length: n + 1 }, (_, i) => continuous(a, r, i));

  const yMax = Math.max(eVals[n], 1) * 1.06;
  const X = (i: number) => PL + (i / Math.max(n, 1)) * (CW - PL - PR);
  const Y = (v: number) => CH - PB - (v / yMax) * (CH - PT - PB);
  const pts = (vals: number[]) => vals.map((v, i) => `${X(i)},${Y(v)}`).join(" ");

  const marks = Array.from(new Set([1, Math.round(n / 6), Math.round(n / 3), Math.round(n / 2), Math.round((2 * n) / 3), Math.round((5 * n) / 6), n]))
    .filter((x) => x >= 1 && x <= n).sort((x, y) => x - y);

  return (
    <div className="space-y-4">
      <SetupBox {...setup} accent="violet" />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📈 세 가지 방식을 한 그래프에</p>
        <div className="mt-1 grid gap-1.5 text-xs sm:grid-cols-3">
          <p className="rounded-lg border border-orange-400/30 bg-orange-400/[0.08] px-2.5 py-1.5 font-mono text-orange-200">
            단리 : A(1 + rn)
          </p>
          <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/[0.08] px-2.5 py-1.5 font-mono text-emerald-200">
            복리 : A(1 + r)ⁿ
          </p>
          <p className="rounded-lg border border-pink-400/30 bg-pink-400/[0.08] px-2.5 py-1.5 font-mono text-pink-200">
            연속복리 : A·e<sup>rn</sup>
          </p>
        </div>

        <div className="mt-2 overflow-x-auto">
          <svg viewBox={`0 0 ${CW} ${CH}`} className="h-auto w-full min-w-[340px]" role="img" aria-label="단리·복리·연속복리 비교 그래프">
            <rect x={0} y={0} width={CW} height={CH} fill="#0b1220" rx={8} />
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line x1={PL} x2={CW - PR} y1={Y(yMax * t)} y2={Y(yMax * t)} stroke="rgba(255,255,255,0.08)" strokeWidth={0.6} strokeDasharray="2 2" />
                <text x={PL - 4} y={Y(yMax * t) + 3} textAnchor="end" className="fill-slate-500" style={{ fontSize: 6 }}>
                  {Math.round((yMax * t) / 10000).toLocaleString("ko-KR")}
                </text>
              </g>
            ))}
            <text x={PL - 4} y={PT - 3} textAnchor="end" className="fill-slate-500" style={{ fontSize: 5.5 }}>(만원)</text>

            <polyline points={pts(sVals)} fill="none" stroke="#fb923c" strokeWidth={1.8} />
            <polyline points={pts(cVals)} fill="none" stroke="#34d399" strokeWidth={1.8} />
            <polyline points={pts(eVals)} fill="none" stroke="#f472b6" strokeWidth={1.8} />
            {marks.map((i) => (
              <g key={i}>
                <circle cx={X(i)} cy={Y(sVals[i])} r={1.5} fill="#fb923c" />
                <circle cx={X(i)} cy={Y(cVals[i])} r={1.5} fill="#34d399" />
                <circle cx={X(i)} cy={Y(eVals[i])} r={1.5} fill="#f472b6" />
              </g>
            ))}

            <line x1={X(k)} x2={X(k)} y1={PT} y2={CH - PB} stroke="#a78bfa" strokeWidth={0.8} strokeDasharray="2 2" />
            <circle cx={X(k)} cy={Y(eVals[k])} r={2.6} fill="#f472b6" stroke="#0b1220" strokeWidth={0.8} />
            <circle cx={X(k)} cy={Y(cVals[k])} r={2.6} fill="#34d399" stroke="#0b1220" strokeWidth={0.8} />
            <circle cx={X(k)} cy={Y(sVals[k])} r={2.6} fill="#fb923c" stroke="#0b1220" strokeWidth={0.8} />

            <line x1={PL} x2={CW - PR} y1={CH - PB} y2={CH - PB} stroke="rgba(255,255,255,0.2)" strokeWidth={0.8} />
            {[0, Math.round(n / 2), n].map((i, idx) => (
              <text key={idx} x={X(i)} y={CH - PB + 10} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 6 }}>{i}년</text>
            ))}
          </svg>
        </div>
        <div className="mt-1 flex flex-wrap justify-center gap-3 text-[11px]">
          <Legend color="#fb923c" label="단리" />
          <Legend color="#34d399" label="복리" />
          <Legend color="#f472b6" label="연속복리" />
        </div>

        <label htmlFor="cc" className="mt-2 block text-xs font-bold text-slate-300">
          살펴볼 시점: <span className="font-mono text-violet-200">{k}년 뒤</span>
        </label>
        <input id="cc" type="range" min={0} max={n} step={1} value={k}
          onChange={(e) => setCursor(Number(e.target.value))}
          className="mt-1.5 w-full accent-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/40" />

        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <Card label="단리" value={man(sVals[k])} tone="orange" />
          <Card label="복리 (연 1회)" value={man(cVals[k])} tone="emerald" />
          <Card label="연속복리" value={man(eVals[k])} tone="pink" />
        </div>
        <p className="mt-2 text-center text-xs text-slate-400">
          연속복리 − 단리 = <b className="font-mono text-amber-200">{won(eVals[k] - sVals[k])}</b> ·
          연속복리 − 복리 = <b className="font-mono text-pink-200">{won(eVals[k] - cVals[k])}</b>
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📋 시점별 비교 (만원)</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[460px] text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="px-2 py-1.5 text-left font-semibold">시점</th>
                <th className="px-2 py-1.5 text-right font-semibold text-orange-300">단리</th>
                <th className="px-2 py-1.5 text-right font-semibold text-emerald-300">복리</th>
                <th className="px-2 py-1.5 text-right font-semibold text-pink-300">연속복리</th>
                <th className="px-2 py-1.5 text-right font-semibold">연속복리 − 단리</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((i) => (
                <tr key={i} className={"border-t border-white/5 " + (i === k ? "bg-violet-400/15" : "")}>
                  <td className="px-2 py-1 text-slate-200">{i}년</td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-orange-200">{man(sVals[i], 1)}</td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-emerald-200">{man(cVals[i], 1)}</td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-pink-200">{man(eVals[i], 1)}</td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-amber-200">{man(eVals[i] - sVals[i], 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          언제나 <b className="text-orange-200">단리</b> &lt; <b className="text-emerald-200">복리</b> &lt; <b className="text-pink-200">연속복리</b>{" "}
          순서예요. 기간이 길수록, 이율이 높을수록 간격이 크게 벌어져요 — 이율을 20%로 올려 보세요!
        </p>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-slate-300">
      <span className="inline-block h-0.5 w-4" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  );
}

const C_TONE: Record<string, string> = {
  orange: "border-orange-400/40 bg-orange-400/10 text-orange-100",
  emerald: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  pink: "border-pink-400/40 bg-pink-400/10 text-pink-100",
};

function Card({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={"rounded-xl border px-4 py-3 text-center " + C_TONE[tone]}>
      <p className="text-xs font-bold opacity-80">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold">{value}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 도전 문제 (amber)
// ══════════════════════════════════════════════════════════════
type StepState = { text: string; ok: boolean; tries: number; hint: boolean; shown: boolean };
const DEFAULT_STEP: StepState = { text: "", ok: false, tries: 0, hint: false, shown: false };

function QuestTab() {
  const [qIdx, setQIdx] = useState(0);
  const [state, setState] = useState<Record<string, StepState>>({});
  const quest = QUESTS[qIdx];
  const doneCount = QUESTS.filter((q) => q.steps.every((s) => state[s.id]?.ok)).length;

  function get(id: string) { return state[id] ?? DEFAULT_STEP; }
  function update(id: string, patch: Partial<StepState>) {
    setState((p) => ({ ...p, [id]: { ...(p[id] ?? DEFAULT_STEP), ...patch } }));
  }
  function check(id: string, answer: number) {
    setState((p) => {
      const cur = p[id] ?? DEFAULT_STEP;
      const v = Number(cur.text.replace(/[,\s원년만]/g, ""));
      const tol = Math.max(0.005, Math.abs(answer) * 1e-9);
      return { ...p, [id]: { ...cur, ok: Number.isFinite(v) && cur.text.trim() !== "" && Math.abs(v - answer) <= tol, tries: cur.tries + 1 } };
    });
  }

  const firstOpen = quest.steps.findIndex((s) => !get(s.id).ok);
  const questDone = firstOpen === -1;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-amber-200">🏆 연속복리 도전 문제</p>
          <span className="font-mono text-xs text-slate-300">완료 {doneCount} / {QUESTS.length}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUESTS.map((q, i) => {
            const done = q.steps.every((s) => state[s.id]?.ok);
            return (
              <button key={q.id} type="button" onClick={() => setQIdx(i)}
                className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (qIdx === i ? "border-amber-400/60 bg-amber-400/20 text-amber-100" : done ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
                {done ? "✅ " : ""}{q.emoji} {q.title.replace("문제 ", "").replace(" · ", ". ")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-base font-bold text-slate-100">{quest.emoji} {quest.title}</p>
        <p className="mt-1.5 text-sm leading-7 text-slate-300">{quest.scenario}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {quest.given.map((g) => (
            <div key={g.label} className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2">
              <p className="text-[11px] text-slate-400">{g.label}</p>
              <p className="mt-0.5 text-sm font-bold text-sky-100">{g.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {quest.steps.map((step, i) => {
          const st = get(step.id);
          const locked = i > (firstOpen === -1 ? quest.steps.length - 1 : firstOpen);
          return (
            <div key={step.id}
              className={"rounded-2xl border p-4 transition " + (st.ok ? "border-emerald-400/40 bg-emerald-400/[0.07]" : locked ? "border-white/5 bg-slate-900/20 opacity-50" : "border-amber-400/35 bg-amber-400/[0.06]")}>
              <div className="flex items-start gap-2">
                <span className={"mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold " + (st.ok ? "bg-emerald-400/25 text-emerald-100" : "bg-white/10 text-slate-300")}>
                  {st.ok ? "✓" : i + 1}
                </span>
                <p className="text-sm font-bold leading-6 text-slate-100">{step.ask}</p>
              </div>
              {locked ? (
                <p className="mt-2 pl-8 text-xs text-slate-500">앞 단계를 먼저 풀어 주세요 🔒</p>
              ) : (
                <div className="mt-2 pl-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="text" inputMode="decimal" aria-label={step.ask} value={st.text} disabled={st.ok}
                      onChange={(e) => update(step.id, { text: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") check(step.id, step.answer); }}
                      placeholder="숫자만 입력"
                      className="w-44 rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-right font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-300 focus-visible:ring-2 focus-visible:ring-amber-300/40 disabled:opacity-60" />
                    <span className="text-sm text-slate-300">{step.suffix}</span>
                    {!st.ok ? (
                      <button type="button" onClick={() => check(step.id, step.answer)}
                        className="rounded-lg border-2 border-amber-400/55 bg-amber-400/15 px-4 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-400/25">확인</button>
                    ) : null}
                  </div>

                  {st.ok ? (
                    <p className="mt-2 rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-1.5 text-xs leading-5 text-emerald-100">정답이에요! ✅ {step.explain}</p>
                  ) : st.tries > 0 ? (
                    <p className="mt-2 rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-1.5 text-xs leading-5 text-amber-100">
                      아직 아니에요. {st.tries >= 2 ? "힌트를 열어 보세요." : "다시 계산해 볼까요?"}
                    </p>
                  ) : null}

                  {!st.ok ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => update(step.id, { hint: !st.hint })}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10">
                        💡 힌트 {st.hint ? "닫기" : "보기"}
                      </button>
                      {st.tries >= 3 ? (
                        <button type="button" onClick={() => update(step.id, { shown: true })}
                          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-400 transition hover:bg-white/10">정답 보기</button>
                      ) : null}
                      {st.hint ? <span className="rounded-lg bg-black/25 px-2.5 py-1 font-mono text-[11px] text-slate-300">{step.hint}</span> : null}
                      {st.shown ? (
                        <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">
                          정답: <b className="font-mono text-emerald-200">{step.answer.toLocaleString("ko-KR")}{step.suffix}</b> — {step.explain}
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

      {questDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🎉 {quest.title.split(" · ")[1]} 해결!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">{quest.wrapUp}</p>
          {qIdx < QUESTS.length - 1 ? (
            <button type="button" onClick={() => setQIdx(qIdx + 1)}
              className="mt-3 rounded-xl border-2 border-amber-400/55 bg-amber-400/15 px-6 py-2 text-sm font-bold text-amber-100 transition hover:bg-amber-400/25">
              다음 문제로 →
            </button>
          ) : doneCount === QUESTS.length ? (
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 모든 문제를 해결했어요! 연속복리 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
