"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  DATA_NOTE,
  PREDICTS,
  PRESETS,
  SPLIT_ROWS,
  UNIT_LABEL,
  compoundAt,
  compoundSplit,
  compoundStepInterest,
  doubleTimeCompound,
  doubleTimeSimple,
  effectiveAnnual,
  simpleAt,
  type PeriodUnit,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_curve",
    prompt:
      "단리 그래프는 직선이었는데 복리 그래프는 위로 휘어 오르는 곡선이었어요. 매 기간 새로 붙는 이자가 어떻게 달라지는지와 연결해 그 까닭을 설명하고, 등차수열과 등비수열이라는 말로도 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 단리는 매번 rA로 같은 이자가 붙어 공차가 rA인 등차수열이라 직선이지만, 복리는 늘어난 원리합계에 이자가 붙어 이자 자체가 점점 커지고 공비가 1+r인 등비수열이라 곡선이 된다.",
  },
  {
    id: "gap_grows",
    prompt:
      "탭②에서 기간을 늘려 보면 단리와 복리의 차이가 어떻게 변했나요? 처음에는 차이가 거의 없다가 나중에 크게 벌어지는 까닭과, 이것이 저축·대출을 할 때 우리에게 주는 교훈을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 초반에는 붙은 이자가 적어 차이가 작지만, 이자가 이자를 낳는 효과가 쌓여 기간이 길수록 격차가 급격히 커진다. 그래서 저축은 일찍 오래, 빚은 되도록 빨리 갚는 것이 좋다.",
  },
  {
    id: "unit_change",
    prompt:
      "이율의 기간 단위를 연에서 월로 바꾸었을 때 단리는 원리합계가 그대로였지만 복리는 달라졌어요. 왜 그런 차이가 생기는지 식 A(1+rn)과 A(1+r)ⁿ을 이용해 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 단리는 A(1 + r·n)에서 이율을 12로 나누고 기간을 12배 하면 곱 rn이 그대로라 값이 같다. 복리는 (1+r)ⁿ에서 지수가 12배로 늘어 (1+r/12)^(12n)이 되어 이자가 붙는 횟수가 늘어난 만큼 커진다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}
function pctText(v: number): string {
  return (Number.isInteger(v) ? v.toString() : v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")) + "%";
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "sim" | "compare" | "unit";

export default function CompoundInterestLab() {
  const [tab, setTab] = useState<Tab>("sim");
  // 탭 ①·②가 같은 조건을 공유하도록 위에서 관리
  const [a, setA] = useState(2_000_000);
  const [ratePct, setRatePct] = useState(3.5);
  const [unit, setUnit] = useState<PeriodUnit>("year");
  const [n, setN] = useState(10);

  const setup = { a, setA, ratePct, setRatePct, unit, setUnit, n, setN };

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🚀 복리의 원리합계</h3>
        <p className="mt-2 leading-7 text-slate-300">
          복리는 <b className="text-emerald-200">생긴 이자를 원금에 더해</b> 다음 기간의 이자를 계산해요. 이자가 다시
          이자를 낳는 거죠. 매 기간의 이자와 원리합계를 표·그래프로 보고, 단리와 나란히 견주어 본 뒤, 이율의 기간 단위를
          바꾸면 어떤 일이 생기는지 실험해 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "sim"} onClick={() => setTab("sim")}>① 복리 시뮬레이터</TabButton>
        <TabButton active={tab === "compare"} onClick={() => setTab("compare")}>② 단리 vs 복리</TabButton>
        <TabButton active={tab === "unit"} onClick={() => setTab("unit")}>③ 이율 단위를 바꾸면?</TabButton>
      </div>

      <div className="mt-4">
        {tab === "sim" ? <SimTab {...setup} /> : null}
        {tab === "compare" ? <CompareTab {...setup} /> : null}
        {tab === "unit" ? <UnitTab /> : null}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">📌 {DATA_NOTE}</p>

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
        (active ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ─── 공용 그래프 ──────────────────────────────────────────────
const CW = 340, CH = 190, PL = 48, PR = 10, PT = 12, PB = 24;

type Series = { key: string; label: string; color: string; dashed?: boolean; values: number[] };

function LineChart({ series, n, periodLabel, cursor, base, fillBetween, zoom, yFloor }: {
  series: Series[];
  n: number;
  periodLabel: string;
  cursor?: number;
  base?: number; // 원금 기준선
  fillBetween?: [string, string]; // 두 계열 사이를 칠함
  zoom?: boolean; // 세로축을 자료 범위에 맞춰 잘라 그림(차이를 크게 보기)
  yFloor?: number; // 세로축 최솟값을 고정하고 싶을 때(예: 0)
}) {
  const all = series.flatMap((s) => s.values);
  const dataMax = Math.max(...all);
  const dataMin = Math.min(...all);
  let yLo = 0;
  let yHi = Math.max(dataMax, base ?? 0) * 1.05;
  if (zoom) {
    const pad = (dataMax - dataMin) * 0.18 || Math.max(dataMax * 0.01, 1);
    yLo = dataMin - pad;
    yHi = dataMax + pad;
  }
  if (yFloor != null) {
    yLo = yFloor;
    yHi = Math.max(dataMax * 1.1, yFloor + 1);
  }
  const span = yHi - yLo || 1;
  const x = (i: number) => PL + (i / Math.max(n, 1)) * (CW - PL - PR);
  const y = (v: number) => CH - PB - ((v - yLo) / span) * (CH - PT - PB);
  const pts = (vals: number[]) => vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const axisText = (v: number) => {
    if (span < 100_000) return Math.round(v).toLocaleString("ko-KR"); // 원 단위
    if (span < 1_000_000) return (v / 10000).toFixed(1) + "만";
    return Math.round(v / 10000).toLocaleString("ko-KR") + "만";
  };
  // 영역을 닫기 위해 뒤에서부터 되짚는 점 목록
  const backPts = (vals: number[]) =>
    vals.map((v, i) => ({ v, i })).reverse().map(({ v, i }) => `${x(i)},${y(v)}`).join(" ");

  const lo = fillBetween ? series.find((s) => s.key === fillBetween[0]) : undefined;
  const hi = fillBetween ? series.find((s) => s.key === fillBetween[1]) : undefined;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${CW} ${CH}`} className="h-auto w-full min-w-[340px]" role="img" aria-label="원리합계 그래프">
        <rect x={0} y={0} width={CW} height={CH} fill="#0b1220" rx={8} />
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={PL} x2={CW - PR} y1={y(yLo + span * t)} y2={y(yLo + span * t)} stroke="rgba(255,255,255,0.08)" strokeWidth={0.6} />
            <text x={PL - 4} y={y(yLo + span * t) + 3} textAnchor="end" className="fill-slate-500 text-[7px]">
              {axisText(yLo + span * t)}
            </text>
          </g>
        ))}
        {base != null && base >= yLo && base <= yHi ? (
          <>
            <line x1={PL} x2={CW - PR} y1={y(base)} y2={y(base)} stroke="#64748b" strokeWidth={0.8} strokeDasharray="3 2" />
            <text x={CW - PR} y={y(base) - 3} textAnchor="end" className="fill-slate-500 text-[7px]">원금 A</text>
          </>
        ) : null}

        {lo && hi ? (
          <polygon points={`${pts(lo.values)} ${backPts(hi.values)}`} fill="rgba(192,132,252,0.18)" />
        ) : null}

        {series.map((s) => (
          <polyline key={s.key} points={pts(s.values)} fill="none" stroke={s.color} strokeWidth={s.dashed ? 1.7 : 2}
            strokeDasharray={s.dashed ? "5 3" : undefined} />
        ))}

        {cursor != null ? (
          <>
            <line x1={x(cursor)} x2={x(cursor)} y1={PT} y2={CH - PB} stroke="#38bdf8" strokeWidth={0.8} strokeDasharray="2 2" />
            {series.map((s) => (
              <circle key={s.key} cx={x(cursor)} cy={y(s.values[cursor])} r={3} fill={s.color} stroke="#0b1220" strokeWidth={1} />
            ))}
          </>
        ) : null}

        <line x1={PL} x2={CW - PR} y1={CH - PB} y2={CH - PB} stroke="rgba(255,255,255,0.18)" strokeWidth={0.8} />
        {[0, Math.round(n / 2), n].map((i, idx) => (
          <text key={idx} x={x(i)} y={CH - PB + 10} textAnchor="middle" className="fill-slate-500 text-[7px]">{i}{periodLabel}</text>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-3 text-[11px]">
        {series.map((s) => <Legend key={s.key} color={s.color} label={s.label} dashed={s.dashed} />)}
      </div>
    </div>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1 text-slate-300">
      <span className="inline-block h-0.5 w-4" style={{ backgroundColor: dashed ? "transparent" : color, backgroundImage: dashed ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)` : undefined }} aria-hidden="true" />
      {label}
    </span>
  );
}

function SliderBox({ id, label, value, min, max, step, v, onChange, accent = "emerald" }: {
  id: string; label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void; accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
      <label htmlFor={id} className="text-xs font-bold text-slate-300">
        {label}: <span className={"font-mono " + (accent === "emerald" ? "text-emerald-200" : "text-sky-200")}>{value}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-2 w-full focus-visible:outline-none focus-visible:ring-2 " + (accent === "emerald" ? "accent-emerald-400 focus-visible:ring-emerald-300/40" : "accent-sky-400 focus-visible:ring-sky-300/40")} />
    </div>
  );
}

const F_TONE: Record<string, string> = {
  sky: "border-sky-400/35 bg-sky-400/[0.08] text-sky-100",
  amber: "border-amber-400/35 bg-amber-400/[0.08] text-amber-100",
  emerald: "border-emerald-400/35 bg-emerald-400/[0.08] text-emerald-100",
  violet: "border-violet-400/35 bg-violet-400/[0.08] text-violet-100",
};

function Card({ title, expr, value, sub, tone }: { title: string; expr?: string; value: string; sub?: string; tone: string }) {
  return (
    <div className={"rounded-2xl border p-4 " + F_TONE[tone]}>
      <p className="text-xs font-bold opacity-80">{title}</p>
      {expr ? <p className="mt-0.5 font-mono text-sm opacity-90">{expr}</p> : null}
      <p className="mt-1 font-mono text-xl font-bold">{value}</p>
      {sub ? <p className="mt-0.5 font-mono text-[10px] text-slate-400">{sub}</p> : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-0.5 font-mono text-base font-bold text-slate-100">{value}</p>
    </div>
  );
}

// ─── 조건 설정 (탭 ①·② 공유) ─────────────────────────────────
type Setup = {
  a: number; setA: (v: number) => void;
  ratePct: number; setRatePct: (v: number) => void;
  unit: PeriodUnit; setUnit: (v: PeriodUnit) => void;
  n: number; setN: (v: number) => void;
};

function SetupBox({ a, setA, ratePct, setRatePct, unit, setUnit, n, setN, tone }: Setup & { tone: string }) {
  const u = UNIT_LABEL[unit];
  function pickUnit(next: PeriodUnit) {
    setUnit(next);
    if (next === "month") { setRatePct(0.3); setN(36); }
    else { setRatePct(3.5); setN(10); }
  }
  return (
    <div className={"rounded-2xl border p-4 " + (tone === "emerald" ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-sky-400/25 bg-sky-400/[0.06]")}>
      <p className={"text-sm font-bold " + (tone === "emerald" ? "text-emerald-200" : "text-sky-200")}>🎛️ 조건을 정해 보세요</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" title={p.note}
            onClick={() => { setA(p.a); setRatePct(p.ratePct); setUnit(p.unit); setN(p.n); }}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10">
            {p.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="self-center text-xs font-bold text-slate-400">이율 단위</span>
        {(["year", "month"] as PeriodUnit[]).map((x) => (
          <button key={x} type="button" onClick={() => pickUnit(x)}
            className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (unit === x ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
            {UNIT_LABEL[x].rate}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <SliderBox id="a" label="원금 A" value={won(a)} min={100_000} max={20_000_000} step={100_000} v={a} onChange={setA} />
        <SliderBox id="r" label={`이율 r (${u.rate})`} value={pctText(ratePct)}
          min={unit === "month" ? 0.05 : 0.5} max={unit === "month" ? 2 : 20} step={unit === "month" ? 0.05 : 0.1}
          v={ratePct} onChange={setRatePct} />
        <SliderBox id="n" label="기간 n" value={`${n}${u.period}`} min={1} max={unit === "month" ? 60 : 40} step={1} v={n} onChange={setN} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 복리 시뮬레이터 (emerald)
// ══════════════════════════════════════════════════════════════
function SimTab(setup: Setup) {
  const { a, ratePct, unit, n } = setup;
  const [cursor, setCursor] = useState(1);
  const r = ratePct / 100;
  const u = UNIT_LABEL[unit];
  const k = Math.min(cursor, n);

  const values = Array.from({ length: n + 1 }, (_, i) => compoundAt(a, r, i));
  const rows = Array.from({ length: n + 1 }, (_, i) => ({
    k: i,
    step: compoundStepInterest(a, r, i),
    acc: compoundAt(a, r, i) - a,
    bal: compoundAt(a, r, i),
  }));

  return (
    <div className="space-y-4">
      <SetupBox {...setup} tone="emerald" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card title={`1${u.period} 뒤 붙는 이자`} expr="rA" value={won(a * r)} sub={`${pctText(ratePct)} × ${won(a)}`} tone="sky" />
        <Card title={`${n}${u.period}째에 붙는 이자`} expr="r · A(1+r)^(n−1)" value={won(compoundStepInterest(a, r, n))}
          sub="점점 커져요 — 이자가 이자를 낳아요" tone="amber" />
        <Card title={`${n}${u.period} 뒤 원리합계`} expr="S = A(1+r)ⁿ" value={won(compoundAt(a, r, n))}
          sub={`${won(a)} × ${(1 + r).toFixed(4)}^${n}`} tone="emerald" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📈 시간에 따른 원리합계 (복리)</p>
        <div className="mt-2">
          <LineChart
            n={n}
            periodLabel={u.period}
            base={a}
            cursor={k}
            series={[{ key: "c", label: "복리 원리합계 (곡선)", color: "#34d399", values }]}
          />
        </div>
        <label htmlFor="cur" className="mt-2 block text-xs font-bold text-slate-300">
          살펴볼 시점: <span className="font-mono text-sky-200">{k}{u.period} 뒤</span>
        </label>
        <input id="cur" type="range" min={0} max={n} step={1} value={k}
          onChange={(e) => setCursor(Number(e.target.value))}
          className="mt-1.5 w-full accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <Stat label="이번 기간에 붙은 이자" value={won(compoundStepInterest(a, r, k))} />
          <Stat label="원리합계" value={won(compoundAt(a, r, k))} />
          <Stat label="식으로 쓰면" value={k === 0 ? "A" : k === 1 ? "A(1+r)" : `A(1+r)^${k}`} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📋 시점별 이자와 원리합계</p>
        <div className="mt-2 max-h-80 overflow-auto rounded-xl border border-white/5">
          <table className="w-full min-w-[460px] text-sm">
            <thead className="sticky top-0 bg-slate-900">
              <tr className="text-slate-300">
                <th className="px-2 py-1.5 text-left font-semibold">시점</th>
                <th className="px-2 py-1.5 text-right font-semibold">발생한 이자</th>
                <th className="px-2 py-1.5 text-right font-semibold">누적 이자</th>
                <th className="px-2 py-1.5 text-right font-semibold">원리합계</th>
                <th className="px-2 py-1.5 text-right font-semibold">식</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.k} className={"border-t border-white/5 " + (row.k === k ? "bg-emerald-400/15" : "")}>
                  <td className="px-2 py-1 text-slate-200">{row.k === 0 ? "현재" : `${row.k}${u.period} 뒤`}</td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-sky-200">{row.k === 0 ? "—" : won(row.step)}</td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-amber-200">{row.k === 0 ? "—" : won(row.acc)}</td>
                  <td className="px-2 py-1 text-right font-mono text-sm font-bold text-emerald-200">{won(row.bal)}</td>
                  <td className="px-2 py-1 text-right font-mono text-[11px] text-slate-500">
                    {row.k === 0 ? "A" : row.k === 1 ? "A(1+r)" : `A(1+r)^${row.k}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-4 text-slate-500">
          ※ 단리와 달리 <b className="text-sky-300">발생한 이자가 매 기간 조금씩 커져요</b>. 직전 원리합계 전체에 이율을 곱하기 때문이에요.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🔗 복리의 원리합계는 등비수열</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          매 기간 원리합계에 <b className="text-emerald-100">(1+r) = {(1 + r).toFixed(4)}</b>를 곱하므로, 시점별 원리합계는{" "}
          <b className="text-emerald-100">첫째항 A(1+r) = {won(a * (1 + r))}</b>,{" "}
          <b className="text-emerald-100">공비 (1+r) = {(1 + r).toFixed(4)}</b>인 등비수열이에요.
        </p>
        <p className="mt-2 overflow-x-auto whitespace-nowrap rounded-lg bg-black/25 px-3 py-2 font-mono text-xs text-slate-200">
          {rows.slice(1, Math.min(rows.length, 6)).map((row) => won(row.bal)).join("  →  ")}{n >= 6 ? "  →  …" : ""}
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          단리는 같은 값을 <b className="text-slate-200">더해</b> 직선(등차수열), 복리는 같은 값을 <b className="text-emerald-200">곱해</b> 곡선(등비수열)이 돼요.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 단리 vs 복리 (violet)
// ══════════════════════════════════════════════════════════════
function CompareTab(setup: Setup) {
  const { a, ratePct, unit, n } = setup;
  const [cursor, setCursor] = useState(Math.min(5, n));
  const r = ratePct / 100;
  const u = UNIT_LABEL[unit];
  const k = Math.min(cursor, n);

  const sVals = Array.from({ length: n + 1 }, (_, i) => simpleAt(a, r, i));
  const cVals = Array.from({ length: n + 1 }, (_, i) => compoundAt(a, r, i));
  const gap = cVals[k] - sVals[k];
  const gapEnd = cVals[n] - sVals[n];
  const dS = doubleTimeSimple(r);
  const dC = doubleTimeCompound(r);

  return (
    <div className="space-y-4">
      <SetupBox {...setup} tone="sky" />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">⚔️ 같은 조건, 두 가지 계산 방법</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          원금 <b className="text-slate-100">{won(a)}</b>, 이율 <b className="text-slate-100">{u.rate} {pctText(ratePct)}</b>로
          똑같이 시작했는데 {n}{u.period} 뒤에는 얼마나 벌어질까요?
        </p>
        <div className="mt-3">
          <LineChart
            n={n}
            periodLabel={u.period}
            base={a}
            cursor={k}
            fillBetween={["simple", "compound"]}
            series={[
              { key: "simple", label: "단리 (직선)", color: "#38bdf8", values: sVals },
              { key: "compound", label: "복리 (곡선)", color: "#c084fc", values: cVals },
            ]}
          />
        </div>
        <label htmlFor="ccur" className="mt-2 block text-xs font-bold text-slate-300">
          살펴볼 시점: <span className="font-mono text-violet-200">{k}{u.period} 뒤</span>
        </label>
        <input id="ccur" type="range" min={0} max={n} step={1} value={k}
          onChange={(e) => setCursor(Number(e.target.value))}
          className="mt-1.5 w-full accent-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/40" />
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <Stat label="단리 원리합계" value={won(sVals[k])} />
          <Stat label="복리 원리합계" value={won(cVals[k])} />
          <Stat label="차이" value={won(gap)} />
          <Stat label="이자 비교" value={`${sVals[k] > a ? ((cVals[k] - a) / (sVals[k] - a)).toFixed(2) : "1.00"}배`} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card title={`${n}${u.period} 뒤 단리`} expr="A(1 + rn)" value={won(sVals[n])} tone="sky" />
        <Card title={`${n}${u.period} 뒤 복리`} expr="A(1 + r)ⁿ" value={won(cVals[n])} tone="violet" />
        <Card title="복리가 더 받는 돈" value={won(gapEnd)} sub={`원금의 ${((gapEnd / a) * 100).toFixed(1)}%`} tone="amber" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📋 시점별 비교</p>
        <div className="mt-2 max-h-72 overflow-auto rounded-xl border border-white/5">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="sticky top-0 bg-slate-900">
              <tr className="text-slate-300">
                <th className="px-2 py-1.5 text-left font-semibold">시점</th>
                <th className="px-2 py-1.5 text-right font-semibold text-sky-300">단리</th>
                <th className="px-2 py-1.5 text-right font-semibold text-violet-300">복리</th>
                <th className="px-2 py-1.5 text-right font-semibold text-amber-300">차이</th>
              </tr>
            </thead>
            <tbody>
              {sVals.map((sv, i) => (
                <tr key={i} className={"border-t border-white/5 " + (i === k ? "bg-violet-400/15" : "")}>
                  <td className="px-2 py-1 text-slate-200">{i === 0 ? "현재" : `${i}${u.period} 뒤`}</td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-sky-200">{won(sv)}</td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-violet-200">{won(cVals[i])}</td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-amber-200">{i === 0 ? "—" : won(cVals[i] - sv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
          <p className="text-sm font-bold text-amber-200">⏱️ 원금이 2배가 되는 데 걸리는 시간</p>
          <div className="mt-2 space-y-1.5 text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-sky-200">단리 (n = 1/r)</span>
              <span className="font-mono font-bold text-slate-100">{dS === Infinity ? "—" : `${dS.toFixed(1)}${u.period}`}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-violet-200">복리 (n = log2 / log(1+r))</span>
              <span className="font-mono font-bold text-slate-100">{dC === Infinity ? "—" : `${dC.toFixed(1)}${u.period}`}</span>
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            복리가 {dS === Infinity ? "—" : `${(dS - dC).toFixed(1)}${u.period}`} 빨리 2배가 돼요. 이율이 높을수록 격차가 커집니다.
          </p>
        </div>
        <div className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
          <p className="text-sm font-bold text-violet-200">🔎 관찰해 보세요</p>
          <ul className="mt-1.5 space-y-1 text-xs leading-5 text-slate-300">
            <li>• 기간이 짧을 때는 두 값이 거의 붙어 있어요. 1{u.period} 뒤 차이는 <b className="font-mono text-amber-200">{won(cVals[1] - sVals[1])}</b>뿐이에요.</li>
            <li>• 기간을 늘릴수록 보라색 곡선이 <b className="text-violet-200">위로 휘며 멀어져요</b> — 이자가 이자를 낳기 때문이에요.</li>
            <li>• 이율을 높여 보세요. 이율이 클수록 벌어지는 속도가 훨씬 빨라져요.</li>
            <li>• 빚에도 똑같이 적용돼요. 높은 이율의 빚을 오래 두면 복리로 눈덩이처럼 불어나요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 이율 단위를 바꾸면? (amber)
// ══════════════════════════════════════════════════════════════
function UnitTab() {
  const [a, setA] = useState(1_000_000);
  const [annualPct, setAnnualPct] = useState(6);
  const [years, setYears] = useState(3);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [zoom, setZoom] = useState(true);
  const revealed = PREDICTS.every((p) => picked[p.id] !== undefined);

  const r = annualPct / 100;
  const monthly = r / 12;

  const simpleYear = simpleAt(a, r, years);
  const simpleMonth = simpleAt(a, monthly, years * 12);
  const compYear = compoundAt(a, r, years);
  const compMonth = compoundAt(a, monthly, years * 12);

  const sY = Array.from({ length: years + 1 }, (_, i) => simpleAt(a, r, i));
  const sM = Array.from({ length: years + 1 }, (_, i) => simpleAt(a, monthly, i * 12));
  const cY = Array.from({ length: years + 1 }, (_, i) => compoundAt(a, r, i));
  const cM = Array.from({ length: years + 1 }, (_, i) => compoundAt(a, monthly, i * 12));
  // 월 단위 계산 − 연 단위 계산 (단리는 항상 0, 복리는 점점 커짐)
  const dS = sM.map((v, i) => v - sY[i]);
  const dC = cM.map((v, i) => v - cY[i]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">🔬 같은 이율을 다른 단위로 말하면 결과가 달라질까?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          <b className="text-amber-100">연이율 {pctText(annualPct)}</b>을 12로 나누면{" "}
          <b className="text-amber-100">월이율 {pctText(annualPct / 12)}</b>이고, <b className="text-amber-100">{years}년</b>은{" "}
          <b className="text-amber-100">{years * 12}개월</b>이에요. 같은 이율을 단위만 바꿔 계산하면 원리합계가 같을까요?
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <SliderBox id="ua" label="원금 A" value={won(a)} min={100_000} max={10_000_000} step={100_000} v={a} onChange={setA} accent="sky" />
          <SliderBox id="ur" label="연이율 r" value={pctText(annualPct)} min={1} max={24} step={0.5} v={annualPct} onChange={setAnnualPct} accent="sky" />
          <SliderBox id="uy" label="기간" value={`${years}년 (= ${years * 12}개월)`} min={1} max={20} step={1} v={years} onChange={setYears} accent="sky" />
        </div>
      </div>

      {/* 예측 */}
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <p className="text-sm font-bold text-violet-200">🤔 먼저 예상해 볼까요?</p>
        <div className="mt-2 space-y-3">
          {PREDICTS.map((p) => {
            const sel = picked[p.id];
            return (
              <div key={p.id}>
                <p className="text-sm leading-6 text-slate-200">{p.ask}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {p.options.map((opt, i) => {
                    const chosen = sel === i;
                    const right = sel !== undefined && i === p.answer;
                    const wrong = chosen && i !== p.answer;
                    return (
                      <button key={i} type="button" disabled={sel !== undefined}
                        onClick={() => setPicked((v) => ({ ...v, [p.id]: i }))}
                        className={"rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition disabled:opacity-80 " + (right ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : wrong ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")}>
                        {opt}{right ? " ✓" : wrong ? " ✕" : ""}
                      </button>
                    );
                  })}
                </div>
                {sel !== undefined ? (
                  <p className="mt-1.5 rounded-lg border-l-4 border-violet-400 bg-violet-400/[0.08] px-3 py-1.5 text-xs leading-5 text-slate-200">
                    {p.explain}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        {!revealed ? <p className="mt-2 text-xs text-slate-500">두 문제를 모두 고르면 아래에서 실제 계산 결과를 확인할 수 있어요.</p> : null}
      </div>

      {revealed ? (
        <>
          {/* 결과표 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-sm font-bold text-slate-100">🧾 {years}년 뒤 원리합계 — 네 가지 계산</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-slate-400">
                    <th className="px-2 py-1.5 text-left font-semibold">계산 방법</th>
                    <th className="px-2 py-1.5 text-right font-semibold">연 단위 ({pctText(annualPct)} × {years}년)</th>
                    <th className="px-2 py-1.5 text-right font-semibold">월 단위 ({pctText(annualPct / 12)} × {years * 12}개월)</th>
                    <th className="px-2 py-1.5 text-right font-semibold">차이</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/5">
                    <td className="px-2 py-2 font-bold text-sky-200">단리<br /><span className="font-mono text-[10px] font-normal text-slate-500">A(1+rn)</span></td>
                    <td className="px-2 py-2 text-right font-mono text-slate-100">{won(simpleYear)}</td>
                    <td className="px-2 py-2 text-right font-mono text-slate-100">{won(simpleMonth)}</td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-emerald-300">{won(Math.abs(simpleMonth - simpleYear))} (같음)</td>
                  </tr>
                  <tr className="border-t border-white/5">
                    <td className="px-2 py-2 font-bold text-violet-200">복리<br /><span className="font-mono text-[10px] font-normal text-slate-500">A(1+r)ⁿ</span></td>
                    <td className="px-2 py-2 text-right font-mono text-slate-100">{won(compYear)}</td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-amber-200">{won(compMonth)}</td>
                    <td className="px-2 py-2 text-right font-mono font-bold text-rose-300">+{won(compMonth - compYear)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-sky-400/30 bg-sky-400/[0.08] px-3 py-2">
                <p className="text-xs font-bold text-sky-200">단리는 왜 같을까?</p>
                <p className="mt-1 font-mono text-[11px] leading-5 text-slate-200">
                  A(1 + r·n) = A(1 + (r/12)·(12n))<br />
                  이율을 12로 나눈 만큼 기간을 12배 → 곱 r·n 은 그대로
                </p>
              </div>
              <div className="rounded-xl border border-violet-400/30 bg-violet-400/[0.08] px-3 py-2">
                <p className="text-xs font-bold text-violet-200">복리는 왜 다를까?</p>
                <p className="mt-1 font-mono text-[11px] leading-5 text-slate-200">
                  A(1+r)ⁿ ≠ A(1 + r/12)<sup>12n</sup><br />
                  이자 붙는 횟수가 {years}번 → {years * 12}번으로 늘어 재투자가 빨라짐
                </p>
              </div>
            </div>
          </div>

          {/* 그래프 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-100">📊 네 그래프를 겹쳐 보기</p>
              <button type="button" onClick={() => setZoom((v) => !v)}
                className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (zoom ? "border-amber-400/60 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
                {zoom ? "🔍 확대해서 보는 중" : "🔍 확대해서 보기"}
              </button>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              단리 두 선(파랑·흰 점선)은 <b className="text-sky-200">완전히 포개져 하나로 보이고</b>, 복리 두 선(초록·보라 점선)은{" "}
              <b className="text-violet-200">점점 벌어져요</b>.
            </p>
            <div className="mt-2">
              <LineChart
                n={years}
                periodLabel="년"
                base={zoom ? undefined : a}
                zoom={zoom}
                series={[
                  { key: "sy", label: "단리 · 연 단위", color: "#38bdf8", values: sY },
                  { key: "sm", label: "단리 · 월 단위", color: "#e2e8f0", dashed: true, values: sM },
                  { key: "cy", label: "복리 · 연 단위", color: "#34d399", values: cY },
                  { key: "cm", label: "복리 · 월 단위", color: "#c084fc", dashed: true, values: cM },
                ]}
              />
            </div>
            <p className="mt-1.5 rounded-lg border-l-4 border-amber-400/70 bg-amber-400/[0.08] px-3 py-1.5 text-[11px] leading-5 text-slate-300">
              {zoom
                ? "⚠️ 세로축이 0에서 시작하지 않아요. 네 값이 몰려 있는 구간만 잘라 크게 늘여 그렸기 때문에, 실제 차이보다 훨씬 벌어져 보인다는 점을 기억하세요."
                : "네 선이 거의 붙어 보이나요? ‘확대해서 보기’를 누르면 값이 몰려 있는 구간만 잘라 크게 늘여 그려 줘요."}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Stat label={`${years}년 뒤 단리 두 값의 차이`} value={won(Math.abs(sM[years] - sY[years]))} />
              <Stat label={`${years}년 뒤 복리 두 값의 차이`} value={won(cM[years] - cY[years])} />
            </div>
          </div>

          {/* 차이만 따로 보기 */}
          <div className="rounded-2xl border border-rose-400/25 bg-rose-400/[0.06] p-4">
            <p className="text-sm font-bold text-rose-200">📐 ‘월 단위 − 연 단위’ 차이만 따로 그려 보기</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              두 계산 방식의 <b className="text-rose-100">차이만</b> 뽑아 0에서부터 그린 그래프예요. 단리는 계속{" "}
              <b className="text-sky-200">0원에 딱 붙어 있고</b>, 복리만 <b className="text-violet-200">위로 자라나요</b>.
            </p>
            <div className="mt-2">
              <LineChart
                n={years}
                periodLabel="년"
                yFloor={0}
                series={[
                  { key: "ds", label: "단리 차이 (항상 0원)", color: "#38bdf8", values: dS },
                  { key: "dc", label: "복리 차이", color: "#c084fc", values: dC },
                ]}
              />
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <Stat label="1년 뒤 복리 차이" value={won(dC[Math.min(1, years)])} />
              <Stat label={`${years}년 뒤 복리 차이`} value={won(dC[years])} />
              <Stat label="원금 대비" value={((dC[years] / a) * 100).toFixed(2) + "%"} />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">
              기간을 늘리거나 이율을 높여 보세요. 파란 선은 <b className="text-sky-200">아무리 바꿔도 0인 채로</b> 있지만, 보라 곡선은
              점점 가팔라져요. 이것이 “단리는 단위를 바꿔도 그대로, 복리는 달라진다”의 그림이에요.
            </p>
          </div>

          {/* 쪼갤수록 */}
          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
            <p className="text-sm font-bold text-amber-200">⚡ 더 잘게 쪼개면 끝없이 커질까?</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              연이율 {pctText(annualPct)}는 그대로 두고 이자를 붙이는 횟수만 늘려 봤어요. {won(a)}이 {years}년 뒤 얼마가 될까요?
            </p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-slate-400">
                    <th className="px-2 py-1.5 text-left font-semibold">이자를 붙이는 주기</th>
                    <th className="px-2 py-1.5 text-right font-semibold">실효 연이율</th>
                    <th className="px-2 py-1.5 text-right font-semibold">{years}년 뒤 원리합계</th>
                  </tr>
                </thead>
                <tbody>
                  {SPLIT_ROWS.map((s) => {
                    const eff = s.m == null ? Math.exp(r) - 1 : effectiveAnnual(r, s.m);
                    const amt = s.m == null ? a * Math.exp(r * years) : compoundSplit(a, r, s.m, years);
                    return (
                      <tr key={s.key} className={"border-t border-white/5 " + (s.m == null ? "bg-amber-400/10" : "")}>
                        <td className={"px-2 py-1 " + (s.m == null ? "font-bold text-amber-100" : "text-slate-200")}>{s.label}</td>
                        <td className="px-2 py-1 text-right font-mono text-xs text-slate-300">{(eff * 100).toFixed(4)}%</td>
                        <td className="px-2 py-1 text-right font-mono text-sm font-bold text-slate-100">{won(amt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              잘게 쪼갤수록 커지지만 끝없이 커지지는 않고 <span className="font-mono text-amber-200">A·e^(r·n)</span>에 가까워져요.
              (1 + r/m)<sup>m</sup> → e<sup>r</sup> 이기 때문이에요. e = 2.718281828…
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
            <p className="text-sm font-bold text-emerald-200">✅ 오늘의 결론</p>
            <ul className="mt-1.5 space-y-1 text-sm leading-6 text-slate-300">
              <li>• <b className="text-sky-200">단리</b>는 이율의 기간 단위를 바꿔도 원리합계가 <b className="text-emerald-200">달라지지 않아요</b> — 이자가 기간에 정비례하니까요.</li>
              <li>• <b className="text-violet-200">복리</b>는 단위를 잘게 나눌수록 원리합계가 <b className="text-rose-200">커져요</b> — 이자를 붙이는 횟수가 늘어 재투자가 빨라지니까요.</li>
              <li>• 그래서 금융 상품을 볼 때는 이율뿐 아니라 <b className="text-amber-200">‘복리를 몇 번 계산하는지(월복리·일복리)’</b>도 함께 확인해야 해요.</li>
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
