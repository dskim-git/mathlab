"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  BRACKETS,
  DATA_NOTE,
  JOBS,
  baseFromTax,
  bracketIndex,
  taxableBase,
  taxByBracket,
  taxByDeduction,
  type Deductions,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "two_methods_equal",
    prompt:
      "소득세를 구하는 두 방법 — ‘구간별 누진세율을 각각 적용해 더하기’와 ‘과세표준×세율 − 누진공제액’ — 이 왜 항상 같은 값을 주는지, 누진공제액이 무엇인지로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 누진공제액은 낮은 구간에서 덜 걷은 만큼을 미리 빼 주는 값이라, 최고 구간 세율로 한꺼번에 곱한 뒤 그 차이를 빼면 구간별로 계산한 것과 같아진다.",
  },
  {
    id: "continuity",
    prompt:
      "소득세 함수 T(과세표준) 그래프가 ‘연속’이면서 경계에서 ‘꺾인다’는 것은 각각 무슨 뜻인가요? 과세표준이 커질 때 한계세율(기울기)과 실효세율은 어떻게 변했는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 구간 경계에서 두 방법의 값이 같아 그래프가 끊기지 않고 이어지므로 연속이다. 다만 기울기(세율)가 바뀌어 꺾인다. 실효세율은 한계세율보다 항상 낮고 서서히 커진다.",
  },
  {
    id: "reverse_estimate",
    prompt:
      "낸 소득세로부터 소득(과세표준)을 거꾸로 추정할 수 있는 이유를 함수의 관점(일대일 대응·역함수)에서 설명하고, 건강보험료로 소득을 추정하는 것과 어떤 점이 닮았는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 과세표준이 커지면 소득세도 항상 커지는 일대일 함수라, 세금을 알면 과세표준을 되짚을 수 있다. 건강보험료도 소득에 따라 정해져 거꾸로 소득을 가늠하는 것과 같다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
export function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}
export function manWon(v: number): string {
  return Math.round(v / 10000).toLocaleString("ko-KR") + "만원";
}
export function pct(v: number): string {
  return (v * 100).toFixed(1) + "%";
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "base" | "calc" | "reverse" | "jobs";

export default function IncomeTaxLab() {
  const [tab, setTab] = useState<Tab>("base");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🧮 직접세의 계산 — 소득세</h3>
        <p className="mt-2 leading-7 text-slate-300">
          내 소득에서 <b className="text-emerald-200">과세표준</b>이 어떻게 만들어지고, 거기에 <b className="text-emerald-200">누진세율</b>이
          어떻게 적용되는지 계산해 봐요. 두 가지 계산법이 왜 같은지, 세금으로 소득을 거꾸로 추정하는 방법,
          직업별 소득세까지 탐구해요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "base"} onClick={() => setTab("base")}>① 과세표준 만들기</TabButton>
        <TabButton active={tab === "calc"} onClick={() => setTab("calc")}>② 소득세 계산(두 방법)</TabButton>
        <TabButton active={tab === "reverse"} onClick={() => setTab("reverse")}>③ 세금으로 소득 추정</TabButton>
        <TabButton active={tab === "jobs"} onClick={() => setTab("jobs")}>④ 직업별 소득세</TabButton>
      </div>

      <div className="mt-4">
        {tab === "base" ? <BaseTab /> : tab === "calc" ? <CalcTab /> : tab === "reverse" ? <ReverseTab /> : <JobsTab />}
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

// ══════════════════════════════════════════════════════════════
// 탭 ① 과세표준 만들기 (sky)
// ══════════════════════════════════════════════════════════════
function BaseTab() {
  const [salary, setSalary] = useState(45_000_000);
  const [dependents, setDependents] = useState(0);
  const [pension, setPension] = useState(true);
  const [card, setCard] = useState(0);

  const d: Deductions = { dependents, pension, card };
  const r = useMemo(() => taxableBase(salary, d), [salary, dependents, pension, card]);

  // 워터폴 막대: 총급여를 100%로, 각 공제와 과세표준 비율
  const seg = (v: number) => (salary > 0 ? (v / salary) * 100 : 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <p className="text-sm font-bold text-sky-200">🧾 총급여에서 과세표준까지</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          세금은 총급여 전체가 아니라 여러 <b className="text-sky-100">공제</b>를 뺀 <b className="text-sky-100">과세표준</b>에 매겨요.
          아래를 조절해 과세표준이 어떻게 줄어드는지 살펴보세요.
        </p>
      </div>

      {/* 입력 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <label htmlFor="salary" className="text-sm font-bold text-slate-200">총급여(연봉): <span className="font-mono text-sky-200">{manWon(salary)}</span></label>
          <input id="salary" type="range" min={20_000_000} max={200_000_000} step={1_000_000} value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            className="mt-2 w-full accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <label htmlFor="dep" className="text-sm font-bold text-slate-200">부양가족 수: <span className="font-mono text-sky-200">{dependents}명</span></label>
          <input id="dep" type="range" min={0} max={5} step={1} value={dependents}
            onChange={(e) => setDependents(Number(e.target.value))}
            className="mt-2 w-full accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />
          <p className="mt-1 text-xs text-slate-400">인적공제 = (본인 1명 + 부양가족) × 150만원</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <label htmlFor="card" className="text-sm font-bold text-slate-200">신용카드 등 소득공제: <span className="font-mono text-sky-200">{manWon(card)}</span></label>
          <input id="card" type="range" min={0} max={3_000_000} step={100_000} value={card}
            onChange={(e) => setCard(Number(e.target.value))}
            className="mt-2 w-full accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />
          <p className="mt-1 text-xs text-slate-400">카드·현금 사용액에 따른 공제(단순화)</p>
        </div>
        <div className="flex items-center rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <label htmlFor="pension" className="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-200">
            <input id="pension" type="checkbox" checked={pension} onChange={(e) => setPension(e.target.checked)}
              className="h-4 w-4 accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />
            국민연금 보험료 공제 (총급여의 4.5%)
          </label>
        </div>
      </div>

      {/* 워터폴 막대 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">총급여 {manWon(salary)} 의 구성</p>
        <div className="mt-2 overflow-x-auto">
          <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="h-8 w-full min-w-[320px]" role="img" aria-label="총급여 구성 막대">
            <rect x={0} y={0} width={seg(r.base)} height={12} fill="#34d399" />
            <rect x={seg(r.base)} y={0} width={seg(r.earned)} height={12} fill="#38bdf8" />
            <rect x={seg(r.base) + seg(r.earned)} y={0} width={seg(r.personal)} height={12} fill="#818cf8" />
            <rect x={seg(r.base) + seg(r.earned) + seg(r.personal)} y={0} width={seg(r.pension)} height={12} fill="#c084fc" />
            <rect x={seg(r.base) + seg(r.earned) + seg(r.personal) + seg(r.pension)} y={0} width={seg(r.card)} height={12} fill="#f472b6" />
          </svg>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="text-emerald-300">■ 과세표준 {manWon(r.base)}</span>
          <span className="text-sky-300">■ 근로소득공제 {manWon(r.earned)}</span>
          <span className="text-indigo-300">■ 인적공제 {manWon(r.personal)}</span>
          <span className="text-purple-300">■ 국민연금 {manWon(r.pension)}</span>
          <span className="text-pink-300">■ 신용카드 등 {manWon(r.card)}</span>
        </div>
      </div>

      {/* 단계 요약 */}
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4">
        <div className="space-y-1 text-sm">
          <Row label="총급여" value={manWon(salary)} />
          <Row label="− 근로소득공제" value={manWon(r.earned)} sub />
          <Row label="− 인적공제" value={manWon(r.personal)} sub />
          <Row label="− 국민연금 보험료" value={manWon(r.pension)} sub />
          <Row label="− 신용카드 등 공제" value={manWon(r.card)} sub />
          <div className="my-1 border-t border-white/10" />
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-emerald-100">= 과세표준</span>
            <span className="font-mono text-2xl font-bold text-emerald-200">{manWon(r.base)}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">공제가 클수록 과세표준이 줄어 세금도 줄어요. 이 과세표준으로 계산한 소득세는 탭②에서 확인해요.</p>
      </div>
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={sub ? "text-slate-400" : "text-slate-200"}>{label}</span>
      <span className={"font-mono " + (sub ? "text-slate-300" : "text-slate-100")}>{value}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 소득세 계산 — 두 방법이 같다 (emerald)
// ══════════════════════════════════════════════════════════════
function CalcTab() {
  const [base, setBase] = useState(50_000_000);
  const bi = bracketIndex(base);
  const b = BRACKETS[bi];
  const taxA = taxByBracket(base);
  const taxB = taxByDeduction(base);
  const effRate = base > 0 ? taxA / base : 0;

  // 방법 A 구간별 내역
  const parts: { rate: number; amount: number; tax: number }[] = [];
  let prev = 0;
  for (const br of BRACKETS) {
    const hi = Math.min(base, br.upTo);
    if (hi > prev) parts.push({ rate: br.rate, amount: hi - prev, tax: (hi - prev) * br.rate });
    if (base <= br.upTo) break;
    prev = br.upTo;
  }

  // 그래프
  const XMAX = 300_000_000;
  const YMAX = taxByBracket(XMAX);
  const W = 340, H = 220, L = 44, R = 10, T = 12, B = 28;
  const px = (x: number) => L + (Math.min(x, XMAX) / XMAX) * (W - L - R);
  const py = (y: number) => H - B - (Math.min(y, YMAX) / YMAX) * (H - T - B);
  const nodesX = [0, ...BRACKETS.slice(0, -1).map((br) => br.upTo).filter((x) => x <= XMAX), XMAX];
  const line = nodesX.map((x) => `${px(x)},${py(taxByBracket(x))}`).join(" ");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🧮 같은 소득세, 두 가지 계산법</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          과세표준을 정하면, <b className="text-emerald-100">구간별 누진</b>과 <b className="text-emerald-100">누진공제</b> 두 방법의 결과가
          <b className="text-emerald-100"> 언제나 같아요</b>. 아래 슬라이더를 움직여 확인하고, 소득세 함수 그래프도 살펴보세요.
        </p>
        <label htmlFor="base" className="mt-3 block text-sm font-bold text-slate-200">과세표준: <span className="font-mono text-emerald-200">{manWon(base)}</span></label>
        <input id="base" type="range" min={0} max={XMAX} step={1_000_000} value={base}
          onChange={(e) => setBase(Number(e.target.value))}
          className="mt-2 w-full accent-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40" />
      </div>

      {/* 소득세 함수 그래프 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📈 소득세 함수 T(과세표준)</p>
        <p className="mt-1 text-xs text-slate-400">구간 경계마다 <b className="text-slate-200">기울기(세율)</b>가 커지지만 그래프는 <b className="text-emerald-200">끊기지 않고 이어져요(연속)</b>. 누진공제가 이 ‘이어짐’을 맞춰 줘요.</p>
        <div className="mx-auto mt-2 max-w-[80%] overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[280px]" role="img" aria-label="소득세 함수 그래프">
            <line x1={L} y1={T} x2={L} y2={H - B} stroke="rgba(255,255,255,0.15)" />
            <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="rgba(255,255,255,0.15)" />
            {/* 구간 경계 세로선 */}
            {BRACKETS.slice(0, -1).map((br) => br.upTo).filter((x) => x <= XMAX).map((x, i) => (
              <line key={i} x1={px(x)} y1={T} x2={px(x)} y2={H - B} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
            ))}
            <polyline points={line} fill="none" stroke="#34d399" strokeWidth={1.6} />
            {/* 현재 점 */}
            <line x1={px(base)} y1={py(taxA)} x2={px(base)} y2={H - B} stroke="#fbbf24" strokeWidth={0.8} strokeDasharray="2 2" />
            <circle cx={px(base)} cy={py(taxA)} r={4} fill="#fbbf24" />
            <text x={L} y={H - 4} className="fill-slate-400 text-[9px]">0</text>
            <text x={W - R} y={H - 4} textAnchor="end" className="fill-slate-400 text-[9px]">과세표준 {manWon(XMAX)}</text>
            <text x={L - 4} y={T + 8} textAnchor="end" className="fill-slate-400 text-[9px]">{manWon(YMAX)}</text>
            <text x={L - 4} y={H - B} textAnchor="end" className="fill-slate-400 text-[9px]">0</text>
          </svg>
        </div>
      </div>

      {/* 두 방법 나란히 */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.06] p-4">
          <p className="text-sm font-bold text-sky-200">방법 ⓐ 구간별 누진세율 합산</p>
          <div className="mt-2 space-y-1">
            {parts.map((p, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-slate-300">{manWon(p.amount)} × {(p.rate * 100).toFixed(0)}%</span>
                <span className="font-mono text-slate-100">{won(p.tax)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-white/10 pt-2">
            <span className="font-bold text-sky-100">합계</span>
            <span className="font-mono text-lg font-bold text-sky-200">{won(taxA)}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4">
          <p className="text-sm font-bold text-emerald-200">방법 ⓑ 과세표준 × 세율 − 누진공제액</p>
          <div className="mt-2 space-y-1 text-sm">
            <Row label="과세표준" value={won(base)} />
            <Row label={`× 세율(${(b.rate * 100).toFixed(0)}%)`} value={won(base * b.rate)} sub />
            <Row label="− 누진공제액" value={won(b.deduct)} sub />
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-white/10 pt-2">
            <span className="font-bold text-emerald-100">산출세액</span>
            <span className="font-mono text-lg font-bold text-emerald-200">{won(taxB)}</span>
          </div>
        </div>
      </div>

      <div className={"rounded-xl border-l-4 px-4 py-2.5 text-sm " + (taxA === taxB ? "border-emerald-400 bg-emerald-400/[0.08] text-slate-200" : "border-rose-400 bg-rose-400/[0.08]")}>
        {taxA === taxB
          ? <>✅ 두 방법 모두 <b className="text-emerald-200">{won(taxA)}</b> — 언제나 같아요! (한계세율 {(b.rate * 100).toFixed(0)}% · 실효세율 {pct(effRate)})</>
          : <>두 값이 다릅니다.</>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 세금으로 소득 추정 (amber)
// ══════════════════════════════════════════════════════════════
const REVERSE_PRESETS = [600_000, 3_000_000, 10_000_000, 30_000_000];

function ReverseTab() {
  const [tax, setTax] = useState(3_000_000);
  const base = baseFromTax(tax);
  const bi = bracketIndex(base);
  const b = BRACKETS[bi];
  // 검산: 추정 과세표준으로 다시 세금 계산
  const check = taxByDeduction(base);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">🔎 세금으로 소득을 거꾸로 알아내기</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          소득을 직접 물어보기 어려울 때 <b className="text-amber-100">건강보험료</b>로 소득을 가늠하듯, 배운 소득세로도
          소득(과세표준)을 <b className="text-amber-100">역으로 추정</b>할 수 있어요. 소득세 함수가 <b className="text-amber-100">일대일(역함수 존재)</b>이기 때문이에요.
        </p>
        <label htmlFor="tax" className="mt-3 block text-sm font-bold text-slate-200">낸 소득세(산출세액): <span className="font-mono text-amber-200">{won(tax)}</span></label>
        <input id="tax" type="range" min={0} max={100_000_000} step={100_000} value={tax}
          onChange={(e) => setTax(Number(e.target.value))}
          className="mt-2 w-full accent-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {REVERSE_PRESETS.map((t) => (
            <button key={t} type="button" onClick={() => setTax(t)}
              className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-100 transition hover:bg-amber-400/20">
              {manWon(t)} 낸 사람
            </button>
          ))}
        </div>
      </div>

      {/* 추정 결과 */}
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4 text-center">
        <p className="text-sm text-slate-300">소득세 <b className="text-amber-200">{won(tax)}</b> → 추정 과세표준</p>
        <p className="mt-1 font-mono text-3xl font-bold text-emerald-200">{manWon(base)}</p>
        <p className="mt-1 text-xs text-slate-400">약 {won(base)} · 이 사람은 최고 {(b.rate * 100).toFixed(0)}% 구간에 속해요</p>
      </div>

      {/* 계산 방법 + 검산 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">🧮 어떻게 되짚었을까?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          방법 ⓑ의 식 <span className="font-mono text-slate-100">세금 = 과세표준 × 세율 − 누진공제액</span> 을 과세표준에 대해 풀면{" "}
          <span className="font-mono text-emerald-200">과세표준 = (세금 + 누진공제액) ÷ 세율</span> 이 돼요.
        </p>
        <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 font-mono text-sm text-slate-200">
          과세표준 = ({won(tax)} + {won(b.deduct)}) ÷ {(b.rate * 100).toFixed(0)}% = <b className="text-emerald-200">{won(base)}</b>
        </div>
        <p className="mt-2 text-xs text-slate-400">검산: 추정 과세표준 {manWon(base)} 로 다시 계산한 소득세 = {won(check)} {Math.abs(check - tax) <= 1000 ? "✓ 일치" : ""}</p>
      </div>

      <div className="rounded-xl border-l-4 border-amber-400 bg-amber-400/[0.08] px-4 py-2.5 text-sm text-slate-200">
        💡 실제로 건강보험공단은 소득·재산 자료로 보험료를 매기고, 거꾸로 보험료로 소득 수준을 추정하기도 해요. 세금·보험료처럼 <b className="text-amber-200">소득이 커지면 항상 커지는 값</b>이면 역으로 소득을 가늠할 수 있어요.
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 직업별 소득세 (violet)
// ══════════════════════════════════════════════════════════════
function JobsTab() {
  const [dependents, setDependents] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => JOBS.map((j) => {
    const t = taxableBase(j.salary, { dependents, pension: true, card: 0 });
    const tax = taxByDeduction(t.base);
    return { job: j, base: t.base, tax, eff: j.salary > 0 ? tax / j.salary : 0 };
  }).sort((a, b) => a.job.salary - b.job.salary), [dependents]);

  const maxTax = Math.max(...rows.map((r) => r.tax), 1);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
        <p className="text-sm font-bold text-violet-200">👩‍🔧 직업마다 소득세는 얼마나 다를까?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          여러 직업의 <b className="text-violet-100">평균 연봉</b>으로 소득세를 계산해 비교해요. 연봉이 오를수록 소득세가
          <b className="text-violet-100"> 더 빠르게</b> 늘어나는 누진세의 효과를 확인해 보세요. (1인 가구·표준 공제 가정)
        </p>
        <label htmlFor="jdep" className="mt-3 block text-sm font-bold text-slate-200">부양가족 수(모든 직업 공통): <span className="font-mono text-violet-200">{dependents}명</span></label>
        <input id="jdep" type="range" min={0} max={4} step={1} value={dependents}
          onChange={(e) => setDependents(Number(e.target.value))}
          className="mt-2 w-full accent-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/40" />
      </div>

      <div className="space-y-1.5">
        {rows.map((r) => {
          const open = openId === r.job.id;
          return (
            <div key={r.job.id} className="rounded-xl border border-white/10 bg-slate-900/40">
              <button type="button" onClick={() => setOpenId(open ? null : r.job.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left">
                <span className="w-40 shrink-0 text-sm font-bold text-slate-100">{r.job.emoji} {r.job.name}</span>
                <span className="hidden w-24 shrink-0 text-right font-mono text-xs text-slate-400 sm:inline">연봉 {manWon(r.job.salary)}</span>
                <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-3 flex-1" aria-hidden="true">
                  <rect width={100} height={8} rx={2} fill="rgba(255,255,255,0.06)" />
                  <rect width={Math.max(2, (r.tax / maxTax) * 100)} height={8} rx={2} fill="#a78bfa" />
                </svg>
                <span className="w-20 shrink-0 text-right font-mono text-xs font-bold text-violet-200">{manWon(r.tax)}</span>
              </button>
              {open ? (
                <div className="border-t border-white/10 px-4 py-3 text-sm">
                  <div className="grid gap-1 sm:grid-cols-2">
                    <Row label="평균 연봉(총급여)" value={won(r.job.salary)} />
                    <Row label="과세표준" value={won(r.base)} />
                    <Row label="산출 소득세" value={won(r.tax)} />
                    <Row label="실효세율(세금÷연봉)" value={pct(r.eff)} />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">최고 {(BRACKETS[bracketIndex(r.base)].rate * 100).toFixed(0)}% 구간 · 실효세율은 한계세율보다 낮아요.</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border-l-4 border-violet-400 bg-violet-400/[0.08] px-4 py-2.5 text-sm text-slate-200">
        📊 연봉이 2배가 되어도 소득세는 <b className="text-violet-200">2배보다 더 많이</b> 늘어요(누진세). 각 막대와 실효세율을 비교해 보세요. 연봉은 공신력 통계의 <b className="text-violet-200">평균 개략치</b>라 실제 개인과 다를 수 있어요.
      </div>
    </div>
  );
}
