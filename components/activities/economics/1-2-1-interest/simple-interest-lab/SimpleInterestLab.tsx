"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  DATA_NOTE,
  MISSIONS,
  PRESETS,
  UNIT_LABEL,
  balanceAt,
  compoundAt,
  interestAt,
  type PeriodUnit,
  type Step,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_line",
    prompt:
      "단리로 계산한 원리합계를 그래프로 그리면 곡선이 아니라 곧은 직선이 되었어요. 왜 그런지 ‘매 기간 붙는 이자’와 연결해 설명하고, 그것이 등차수열과 어떻게 연결되는지도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 단리는 최초 원금에만 이자를 매기므로 매 기간 붙는 이자가 rA로 항상 같다. 같은 양씩 늘어나니 그래프는 직선이고, 원리합계는 공차가 rA인 등차수열이 된다.",
  },
  {
    id: "compare_units",
    prompt:
      "미션 4에서 ‘월이율 0.3%’와 ‘연이율 3%’ 중 실제로 더 유리한 쪽을 찾았어요. 왜 숫자가 작아 보이는 쪽이 오히려 손해였는지 설명하고, 앞으로 금융 상품을 볼 때 무엇을 먼저 확인해야 할지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 월이율 0.3%는 1년이면 12번 붙어 연 3.6%가 되므로 연 3%보다 높다. 이율을 볼 때는 숫자보다 기간 단위를 먼저 확인해야 한다.",
  },
  {
    id: "simple_or_compound",
    prompt:
      "돈을 맡길 때(예금)와 빌릴 때(대출), 단리와 복리 중 나에게 유리한 쪽은 각각 무엇일까요? 같은 이율·같은 기간이라면 어떻게 달라지는지 근거를 들어 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 맡길 때는 이자에 이자가 붙는 복리가, 빌릴 때는 원금에만 이자가 붙는 단리가 나에게 유리하다. 기간이 길수록 그 차이가 커진다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}
function num(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}
function pctText(v: number): string {
  return (Number.isInteger(v) ? v.toString() : v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")) + "%";
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "sim" | "mission";

export default function SimpleInterestLab() {
  const [tab, setTab] = useState<Tab>("sim");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">📈 단리의 원리합계</h3>
        <p className="mt-2 leading-7 text-slate-300">
          단리는 <b className="text-emerald-200">최초 원금에 대해서만</b> 이자를 계산하는 방법이에요. 중간에 생긴 이자가
          다시 이자를 낳지 않죠. 원금과 이율을 바꿔 가며 매 기간의 이자와 원리합계가 어떻게 쌓이는지 표와 그래프로 보고,
          실생활 사례를 단계별로 해결해 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "sim"} onClick={() => setTab("sim")}>① 단리 시뮬레이터</TabButton>
        <TabButton active={tab === "mission"} onClick={() => setTab("mission")}>② 단리 미션 (실생활)</TabButton>
      </div>

      <div className="mt-4">{tab === "sim" ? <SimTab /> : <MissionTab />}</div>

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

// ══════════════════════════════════════════════════════════════
// 탭 ① 단리 시뮬레이터 (sky)
// ══════════════════════════════════════════════════════════════
function SimTab() {
  const [a, setA] = useState(2_000_000);
  const [ratePct, setRatePct] = useState(3.5);
  const [unit, setUnit] = useState<PeriodUnit>("year");
  const [n, setN] = useState(5);
  const [cursor, setCursor] = useState(1);
  const [showCompound, setShowCompound] = useState(false);

  const r = ratePct / 100;
  const u = UNIT_LABEL[unit];
  const perInterest = a * r; // rA — 매 기간 똑같이 붙는 이자
  const k = Math.min(cursor, n);

  function pickUnit(next: PeriodUnit) {
    setUnit(next);
    if (next === "month") { setRatePct(0.3); setN(24); setCursor(6); }
    else { setRatePct(3.5); setN(5); setCursor(1); }
  }
  function pickPreset(i: number) {
    const p = PRESETS[i];
    setA(p.a); setRatePct(p.ratePct); setUnit(p.unit); setN(p.n); setCursor(Math.min(1, p.n));
  }
  function setPeriod(v: number) {
    setN(v);
    if (cursor > v) setCursor(v);
  }

  const rows = Array.from({ length: n + 1 }, (_, i) => ({
    k: i,
    interest: interestAt(a, r, i),
    perInterest: i === 0 ? 0 : perInterest,
    balance: balanceAt(a, r, i),
  }));

  return (
    <div className="space-y-4">
      {/* 설정 */}
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <p className="text-sm font-bold text-sky-200">🎛️ 원금과 이율을 정해 보세요</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p, i) => (
            <button key={p.label} type="button" onClick={() => pickPreset(i)} title={p.note}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10">
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="self-center text-xs font-bold text-slate-400">이율 단위</span>
          {(["year", "month"] as PeriodUnit[]).map((x) => (
            <button key={x} type="button" onClick={() => pickUnit(x)}
              className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (unit === x ? "border-sky-400/60 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
              {UNIT_LABEL[x].rate}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <SliderBox id="a" label="원금 A" value={won(a)} min={100_000} max={20_000_000} step={100_000} v={a} onChange={setA} />
          <SliderBox id="r" label={`이율 r (${u.rate})`} value={pctText(ratePct)}
            min={unit === "month" ? 0.05 : 0.5} max={unit === "month" ? 2 : 20} step={unit === "month" ? 0.05 : 0.1}
            v={ratePct} onChange={setRatePct} />
          <SliderBox id="n" label="기간 n" value={`${n}${u.period}`} min={1} max={unit === "month" ? 60 : 30} step={1} v={n} onChange={setPeriod} />
        </div>
      </div>

      {/* 공식 */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Formula title="매 기간 이자" expr="rA" value={won(perInterest)} sub={`${pctText(ratePct)} × ${won(a)}`} tone="sky" />
        <Formula title={`${n}${u.period} 뒤 이자 총액`} expr="A·r·n" value={won(interestAt(a, r, n))} sub={`${won(a)} × ${r} × ${n}`} tone="amber" />
        <Formula title={`${n}${u.period} 뒤 원리합계`} expr="S = A(1 + rn)" value={won(balanceAt(a, r, n))} sub={`${won(a)} × (1 + ${r} × ${n})`} tone="emerald" />
      </div>

      {/* 그래프 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">📉 시간에 따른 원리합계</p>
          <button type="button" onClick={() => setShowCompound((v) => !v)}
            className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (showCompound ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
            {showCompound ? "✅ 복리와 비교 중" : "복리와 비교하기"}
          </button>
        </div>
        <Chart a={a} r={r} n={n} k={k} unit={unit} showCompound={showCompound} />
        <div className="mt-2">
          <label htmlFor="cursor" className="text-xs font-bold text-slate-300">
            살펴볼 시점: <span className="font-mono text-sky-200">{k}{u.period} 뒤</span>
          </label>
          <input id="cursor" type="range" min={0} max={n} step={1} value={k}
            onChange={(e) => setCursor(Number(e.target.value))}
            className="mt-1.5 w-full accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <Stat label="누적 이자" value={won(interestAt(a, r, k))} />
            <Stat label="원리합계" value={won(balanceAt(a, r, k))} />
            <Stat label="식으로 쓰면" value={k === 0 ? "A" : `A + ${k === 1 ? "" : k}rA`} />
          </div>
        </div>
      </div>

      {/* 표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📋 시점별 이자와 원리합계</p>
        <div className="mt-2 max-h-80 overflow-auto rounded-xl border border-white/5">
          <table className="w-full min-w-[440px] text-sm">
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
                <tr key={row.k} className={"border-t border-white/5 " + (row.k === k ? "bg-sky-400/15" : "")}>
                  <td className="px-2 py-1 text-slate-200">{row.k === 0 ? "현재" : `${row.k}${u.period} 뒤`}</td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-slate-300">{row.k === 0 ? "—" : won(row.perInterest)}</td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-amber-200">{row.k === 0 ? "—" : won(row.interest)}</td>
                  <td className="px-2 py-1 text-right font-mono text-sm font-bold text-emerald-200">{won(row.balance)}</td>
                  <td className="px-2 py-1 text-right font-mono text-[11px] text-slate-500">{row.k === 0 ? "A" : `A + ${row.k === 1 ? "" : row.k}rA`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-4 text-slate-500">
          ※ 발생한 이자가 매 기간 <b className="text-sky-300">rA로 똑같다</b>는 점이 단리의 핵심이에요. 중간에 생긴 이자는 재투자되지 않아요.
        </p>
      </div>

      {/* 등차수열 연결 */}
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🔗 단리의 원리합계는 등차수열</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          매 기간 똑같이 <b className="text-emerald-100">rA = {won(perInterest)}</b>씩 늘어나므로, 시점별 원리합계는{" "}
          <b className="text-emerald-100">첫째항 A + rA = {won(a + perInterest)}</b>,{" "}
          <b className="text-emerald-100">공차 rA = {won(perInterest)}</b>인 등차수열이에요.
        </p>
        <p className="mt-2 overflow-x-auto whitespace-nowrap rounded-lg bg-black/25 px-3 py-2 font-mono text-xs text-slate-200">
          {rows.slice(1, Math.min(rows.length, 6)).map((row) => won(row.balance)).join("  →  ")}{n >= 6 ? "  →  …" : ""}
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          그래서 그래프가 곡선이 아니라 <b className="text-emerald-200">곧은 직선</b>이 돼요. ‘복리와 비교하기’를 눌러 곡선과 견주어 보세요.
        </p>
      </div>
    </div>
  );
}

// ─── 그래프 ───────────────────────────────────────────────────
const CW = 320, CH = 180, PL = 46, PR = 8, PT = 10, PB = 22;

function Chart({ a, r, n, k, unit, showCompound }: {
  a: number; r: number; n: number; k: number; unit: PeriodUnit; showCompound: boolean;
}) {
  const u = UNIT_LABEL[unit];
  const top = Math.max(balanceAt(a, r, n), showCompound ? compoundAt(a, r, n) : 0);
  const yMax = top * 1.05;
  const x = (i: number) => PL + (i / Math.max(n, 1)) * (CW - PL - PR);
  const y = (v: number) => CH - PB - (v / yMax) * (CH - PT - PB);

  const simplePts = Array.from({ length: n + 1 }, (_, i) => `${x(i)},${y(balanceAt(a, r, i))}`).join(" ");
  const compPts = Array.from({ length: n + 1 }, (_, i) => `${x(i)},${y(compoundAt(a, r, i))}`).join(" ");
  const dotStep = Math.max(1, Math.ceil(n / 24));

  return (
    <div className="mt-2 overflow-x-auto">
      <svg viewBox={`0 0 ${CW} ${CH}`} className="h-auto w-full min-w-[320px]" role="img" aria-label="단리 원리합계 그래프">
        <rect x={0} y={0} width={CW} height={CH} fill="#0b1220" rx={8} />
        {/* y축 눈금 */}
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={PL} x2={CW - PR} y1={y(yMax * t)} y2={y(yMax * t)} stroke="rgba(255,255,255,0.08)" strokeWidth={0.6} />
            <text x={PL - 4} y={y(yMax * t) + 3} textAnchor="end" className="fill-slate-500 text-[7px]">
              {Math.round((yMax * t) / 10000).toLocaleString("ko-KR")}만
            </text>
          </g>
        ))}
        {/* 원금 기준선 */}
        <line x1={PL} x2={CW - PR} y1={y(a)} y2={y(a)} stroke="#64748b" strokeWidth={0.8} strokeDasharray="3 2" />
        <text x={CW - PR} y={y(a) - 3} textAnchor="end" className="fill-slate-500 text-[7px]">원금 A</text>

        {/* 이자 영역 */}
        <polygon points={`${x(0)},${y(a)} ${simplePts} ${x(n)},${y(a)}`} fill="rgba(52,211,153,0.15)" />
        {/* 복리 비교 */}
        {showCompound ? (
          <polyline points={compPts} fill="none" stroke="#c084fc" strokeWidth={1.6} strokeDasharray="4 2" />
        ) : null}
        {/* 단리 직선 */}
        <polyline points={simplePts} fill="none" stroke="#34d399" strokeWidth={2} />
        {Array.from({ length: n + 1 }, (_, i) => i).filter((i) => i % dotStep === 0).map((i) => (
          <circle key={i} cx={x(i)} cy={y(balanceAt(a, r, i))} r={1.6} fill="#34d399" />
        ))}
        {/* 선택 시점 */}
        <line x1={x(k)} x2={x(k)} y1={PT} y2={CH - PB} stroke="#38bdf8" strokeWidth={0.8} strokeDasharray="2 2" />
        <circle cx={x(k)} cy={y(balanceAt(a, r, k))} r={3.2} fill="#38bdf8" stroke="#0b1220" strokeWidth={1} />

        {/* x축 */}
        <line x1={PL} x2={CW - PR} y1={CH - PB} y2={CH - PB} stroke="rgba(255,255,255,0.18)" strokeWidth={0.8} />
        {[0, Math.round(n / 2), n].map((i, idx) => (
          <text key={idx} x={x(i)} y={CH - PB + 10} textAnchor="middle" className="fill-slate-500 text-[7px]">{i}{u.period}</text>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-3 text-[11px]">
        <Legend color="#34d399" label="단리 원리합계 (직선)" />
        {showCompound ? <Legend color="#c084fc" label="복리라면 (곡선)" /> : null}
        <Legend color="#64748b" label="원금" />
      </div>
      {showCompound ? (
        <p className="mt-1 text-center text-xs text-slate-400">
          {n}{u.period} 뒤 복리는 <b className="font-mono text-violet-200">{won(compoundAt(a, r, n))}</b>, 단리는{" "}
          <b className="font-mono text-emerald-200">{won(balanceAt(a, r, n))}</b> — 차이 {won(compoundAt(a, r, n) - balanceAt(a, r, n))}
        </p>
      ) : null}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-slate-300">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  );
}

function SliderBox({ id, label, value, min, max, step, v, onChange }: {
  id: string; label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
      <label htmlFor={id} className="text-xs font-bold text-slate-300">
        {label}: <span className="font-mono text-sky-200">{value}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />
    </div>
  );
}

const F_TONE: Record<string, string> = {
  sky: "border-sky-400/35 bg-sky-400/[0.08] text-sky-100",
  amber: "border-amber-400/35 bg-amber-400/[0.08] text-amber-100",
  emerald: "border-emerald-400/35 bg-emerald-400/[0.08] text-emerald-100",
};

function Formula({ title, expr, value, sub, tone }: { title: string; expr: string; value: string; sub: string; tone: string }) {
  return (
    <div className={"rounded-2xl border p-4 " + F_TONE[tone]}>
      <p className="text-xs font-bold opacity-80">{title}</p>
      <p className="mt-0.5 font-mono text-sm opacity-90">{expr}</p>
      <p className="mt-1 font-mono text-xl font-bold">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] text-slate-400">{sub}</p>
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

// ══════════════════════════════════════════════════════════════
// 탭 ② 단리 미션 (violet)
// ══════════════════════════════════════════════════════════════
type StepState = { text: string; correct: boolean; tries: number; hint: boolean; shown: boolean };
const DEFAULT_STEP: StepState = { text: "", correct: false, tries: 0, hint: false, shown: false };

function MissionTab() {
  const [mIdx, setMIdx] = useState(0);
  const [state, setState] = useState<Record<string, StepState>>({});

  const mission = MISSIONS[mIdx];
  const doneCount = MISSIONS.filter((m) => m.steps.every((s) => state[s.id]?.correct)).length;

  function get(id: string): StepState {
    return state[id] ?? DEFAULT_STEP;
  }
  function update(id: string, patch: Partial<StepState>) {
    setState((p) => ({ ...p, [id]: { ...(p[id] ?? DEFAULT_STEP), ...patch } }));
  }
  /** 선택지처럼 값과 채점이 한 번에 일어나는 경우를 위해 값을 직접 넘길 수 있게 한다. */
  function check(step: Step, override?: string) {
    setState((p) => {
      const cur = p[step.id] ?? DEFAULT_STEP;
      const text = override ?? cur.text;
      const ok =
        step.kind === "number"
          ? (() => {
              const v = Number(text.replace(/[,\s원]/g, ""));
              return Number.isFinite(v) && text.trim() !== "" && Math.abs(v - step.answer) < 0.5;
            })()
          : text !== "" && Number(text) === step.answer;
      return { ...p, [step.id]: { ...cur, text, correct: ok, tries: cur.tries + 1 } };
    });
  }

  const firstOpen = mission.steps.findIndex((s) => !get(s.id).correct);
  const missionDone = firstOpen === -1;

  return (
    <div className="space-y-4">
      {/* 미션 선택 */}
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🎯 단리 미션 — 단계별로 풀어 보세요</p>
          <span className="font-mono text-xs text-slate-300">완료 {doneCount} / {MISSIONS.length}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {MISSIONS.map((m, i) => {
            const done = m.steps.every((s) => state[s.id]?.correct);
            return (
              <button key={m.id} type="button" onClick={() => setMIdx(i)}
                className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (mIdx === i ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : done ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
                {done ? "✅ " : ""}{m.emoji} {m.title.replace("미션 ", "").replace(" · ", ". ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* 시나리오 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-base font-bold text-slate-100">{mission.emoji} {mission.title}</p>
        <p className="mt-1.5 text-sm leading-6 text-slate-300">{mission.scenario}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {mission.given.map((g) => (
            <div key={g.label} className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2">
              <p className="text-[11px] text-slate-400">{g.label}</p>
              <p className="mt-0.5 text-sm font-bold text-sky-100">{g.value}</p>
            </div>
          ))}
        </div>
        {mission.source ? <p className="mt-2 text-[11px] text-slate-500">📎 {mission.source}</p> : null}
      </div>

      {/* 단계 */}
      <div className="space-y-2">
        {mission.steps.map((step, i) => {
          const st = get(step.id);
          const open = i <= (firstOpen === -1 ? mission.steps.length - 1 : firstOpen);
          const locked = !open;
          return (
            <div key={step.id}
              className={"rounded-2xl border p-4 transition " + (st.correct ? "border-emerald-400/40 bg-emerald-400/[0.07]" : locked ? "border-white/5 bg-slate-900/20 opacity-50" : "border-violet-400/35 bg-violet-400/[0.06]")}>
              <div className="flex items-start gap-2">
                <span className={"mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold " + (st.correct ? "bg-emerald-400/25 text-emerald-100" : "bg-white/10 text-slate-300")}>
                  {st.correct ? "✓" : i + 1}
                </span>
                <p className="text-sm font-bold leading-6 text-slate-100">{step.ask}</p>
              </div>

              {locked ? (
                <p className="mt-2 pl-8 text-xs text-slate-500">앞 단계를 먼저 풀어 주세요 🔒</p>
              ) : (
                <div className="mt-2 pl-8">
                  {step.kind === "number" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label={step.ask}
                        value={st.text}
                        disabled={st.correct}
                        onChange={(e) => update(step.id, { text: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") check(step); }}
                        placeholder="숫자만 입력"
                        className="w-44 rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-right font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 disabled:opacity-60"
                      />
                      <span className="text-sm text-slate-300">{step.suffix}</span>
                      {!st.correct ? (
                        <button type="button" onClick={() => check(step)}
                          className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25">
                          확인
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {step.options.map((opt, oi) => {
                        const chosen = st.text === String(oi);
                        return (
                          <button key={oi} type="button" disabled={st.correct}
                            onClick={() => check(step, String(oi))}
                            className={"rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition disabled:opacity-70 " + (st.correct && oi === step.answer ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : chosen ? "border-rose-400/60 bg-rose-400/15 text-rose-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 피드백 */}
                  {st.correct ? (
                    <p className="mt-2 rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-1.5 text-xs leading-5 text-emerald-100">
                      정답이에요! ✅ {step.explain}
                    </p>
                  ) : st.tries > 0 ? (
                    <p className="mt-2 rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-1.5 text-xs leading-5 text-amber-100">
                      아직 아니에요. 다시 한 번 계산해 볼까요? {st.tries >= 2 ? "아래 힌트를 열어 보세요." : ""}
                    </p>
                  ) : null}

                  {!st.correct ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => update(step.id, { hint: !st.hint })}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10">
                        💡 힌트 {st.hint ? "닫기" : "보기"}
                      </button>
                      {st.tries >= 3 ? (
                        <button type="button" onClick={() => update(step.id, { shown: true })}
                          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-400 transition hover:bg-white/10">
                          정답 보기
                        </button>
                      ) : null}
                      {st.hint ? <span className="rounded-lg bg-black/25 px-2.5 py-1 font-mono text-[11px] text-slate-300">{step.hint}</span> : null}
                      {st.shown ? (
                        <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">
                          정답: <b className="font-mono text-emerald-200">{step.kind === "number" ? num(step.answer) + step.suffix : step.options[step.answer]}</b> — {step.explain}
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

      {/* 미션 완료 */}
      {missionDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🏅 {mission.badge} 뱃지 획득!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">{mission.wrapUp}</p>
          {mIdx < MISSIONS.length - 1 ? (
            <button type="button" onClick={() => setMIdx(mIdx + 1)}
              className="mt-3 rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25">
              다음 미션으로 →
            </button>
          ) : doneCount === MISSIONS.length ? (
            <p className="mt-3 text-sm font-bold text-amber-200">🎉 모든 미션을 끝냈어요! 이제 단리 계산은 자신 있죠?</p>
          ) : (
            <p className="mt-3 text-xs text-slate-400">아직 풀지 않은 미션이 있어요. 위에서 골라 도전해 보세요.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
