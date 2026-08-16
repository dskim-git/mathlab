"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  DATA_NOTE,
  METHOD_LABEL,
  PRESETS,
  PROBLEMS,
  discountFactor,
  futureValue,
  presentValue,
  type Method,
  type Step,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "rate_vs_discount",
    prompt:
      "이자율과 할인율은 같은 값인데 적용하는 방향만 반대예요. 시뮬레이터에서 ‘현재 → 미래 → 현재’로 한 바퀴 돌려 본 결과를 근거로, 두 비율의 관계를 자기 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 이자율로 곱해서 미래로 갔다가 같은 값의 할인율로 나누면 정확히 원래 금액으로 돌아왔다. 곱하기와 나누기가 서로 되돌리는 관계이기 때문이다.",
  },
  {
    id: "time_shrinks",
    prompt:
      "‘미래 100만 원의 현재가치’ 그래프는 기간이 길어질수록 아래로 내려갔어요. 할인율을 높였을 때 그래프가 어떻게 달라졌는지와 함께, 왜 먼 미래의 돈일수록 지금 가치가 작아지는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 할인율이 높을수록 더 가파르게 떨어졌다. 나누는 수 (1+r)ⁿ이 커지기 때문이고, 지금 돈이 있으면 그동안 이자를 벌 수 있어서 미래의 같은 금액보다 가치가 크기 때문이다.",
  },
  {
    id: "decision",
    prompt:
      "문제 4에서 할인율이 6%일 때와 10%일 때 판단이 뒤집혔어요. 실생활에서 ‘지금 받을까, 나중에 받을까’를 정할 때 나라면 할인율을 무엇으로 잡을지, 그리고 그 까닭을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 내가 그 돈을 은행에 넣었을 때 받을 수 있는 금리나 물가상승률을 할인율로 잡겠다. 그만큼은 기다리는 값으로 받아야 손해가 아니기 때문이다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function won(v: number): string { return Math.round(v).toLocaleString("ko-KR") + "원"; }
function man(v: number, d = 1): string {
  return (v / 10000).toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "만원";
}
function pctText(v: number): string {
  return (Number.isInteger(v) ? v.toString() : v.toFixed(1)) + "%";
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "sim" | "graph" | "problem";

export default function PresentValueLab() {
  const [tab, setTab] = useState<Tab>("sim");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">⏱️ 현재가치와 할인율</h3>
        <p className="mt-2 leading-7 text-slate-300">
          오늘의 100만 원과 1년 뒤의 100만 원은 같은 가치일까요? <b className="text-emerald-200">이자율</b>은 현재가치를
          미래가치로, <b className="text-emerald-200">할인율</b>은 미래가치를 현재가치로 옮겨 줘요. 두 방향을 오가며
          시간과 돈의 값어치를 살펴봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "sim"} onClick={() => setTab("sim")}>① 현재 ⇄ 미래 왕복 시뮬레이터</TabButton>
        <TabButton active={tab === "graph"} onClick={() => setTab("graph")}>② 기간별 그래프</TabButton>
        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>③ 단계별 문제</TabButton>
      </div>

      <div className="mt-4">
        {tab === "sim" ? <SimTab /> : null}
        {tab === "graph" ? <GraphTab /> : null}
        {tab === "problem" ? <ProblemTab /> : null}
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

// ═════════════════════════════════════════════════════════
//  현재가치 ⇄ 미래가치 다이어그램 (교과서 그림 재현)
// ═════════════════════════════════════════════════════════
function ValueBridge({ pv, fv, ratePct, n, dir, method }: {
  pv: number; fv: number; ratePct: number; n: number; dir: "fv" | "pv"; method: Method;
}) {
  const toFuture = dir === "fv";
  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 340 150" className="h-auto w-full min-w-[340px]" role="img" aria-label="현재가치와 미래가치 다이어그램">
        <rect x={0} y={0} width={340} height={150} fill="#0b1220" rx={10} />

        {/* 위쪽: 이자율 화살표 */}
        <text x={170} y={26} textAnchor="middle" className={toFuture ? "fill-emerald-300" : "fill-slate-600"} style={{ fontSize: 9, fontWeight: 700 }}>
          {pctText(ratePct)} 이자율 적용 ({METHOD_LABEL[method].name}, {n}년)
        </text>
        <line x1={92} x2={244} y1={38} y2={38} stroke={toFuture ? "#34d399" : "#334155"} strokeWidth={toFuture ? 2.4 : 1.2} />
        <polygon points="252,38 242,33 242,43" fill={toFuture ? "#34d399" : "#334155"} />

        {/* 가운데: 시간 축 */}
        <line x1={16} x2={324} y1={82} y2={82} stroke="#f472b6" strokeWidth={3} />

        {/* 상자 */}
        <g>
          <rect x={16} y={52} width={78} height={22} rx={5} fill="#052e2b" stroke="#34d399" strokeWidth={1.4} />
          <text x={55} y={67} textAnchor="middle" className="fill-emerald-200" style={{ fontSize: 9, fontWeight: 700 }}>현재가치</text>
          <line x1={55} x2={55} y1={74} y2={86} stroke="#e2e8f0" strokeWidth={0.8} />
          <text x={55} y={99} textAnchor="middle" className={toFuture ? "fill-slate-200" : "fill-emerald-200"} style={{ fontSize: 11, fontWeight: 700 }}>
            {man(pv)}
          </text>
        </g>
        <g>
          <rect x={246} y={52} width={78} height={22} rx={5} fill="#0b2545" stroke="#60a5fa" strokeWidth={1.4} />
          <text x={285} y={67} textAnchor="middle" className="fill-sky-200" style={{ fontSize: 9, fontWeight: 700 }}>미래가치</text>
          <line x1={285} x2={285} y1={74} y2={86} stroke="#e2e8f0" strokeWidth={0.8} />
          <text x={285} y={99} textAnchor="middle" className={toFuture ? "fill-sky-200" : "fill-slate-200"} style={{ fontSize: 11, fontWeight: 700 }}>
            {man(fv)}
          </text>
        </g>

        {/* 아래쪽: 할인율 화살표 */}
        <line x1={96} x2={248} y1={116} y2={116} stroke={!toFuture ? "#fbbf24" : "#334155"} strokeWidth={!toFuture ? 2.4 : 1.2} />
        <polygon points="88,116 98,111 98,121" fill={!toFuture ? "#fbbf24" : "#334155"} />
        <text x={170} y={134} textAnchor="middle" className={!toFuture ? "fill-amber-300" : "fill-slate-600"} style={{ fontSize: 9, fontWeight: 700 }}>
          {pctText(ratePct)} 할인율 적용 ({METHOD_LABEL[method].name}, {n}년)
        </text>
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 왕복 시뮬레이터
// ══════════════════════════════════════════════════════════════
function SimTab() {
  const [dir, setDir] = useState<"fv" | "pv">("fv");
  const [method, setMethod] = useState<Method>("simple");
  const [amount, setAmount] = useState(1_000_000); // 입력 금액(방향에 따라 A 또는 S)
  const [ratePct, setRatePct] = useState(5);
  const [n, setN] = useState(1);
  const [roundTrip, setRoundTrip] = useState(false);

  const r = ratePct / 100;
  const pv = dir === "fv" ? amount : presentValue(amount, r, n, method);
  const fv = dir === "fv" ? futureValue(amount, r, n, method) : amount;
  const factor = method === "simple" ? 1 + r * n : Math.pow(1 + r, n);

  return (
    <div className="space-y-4">
      {/* 용어 */}
      <div className="grid gap-2 sm:grid-cols-3">
        <TermCard emoji="🟢" title="현재가치 (present value)" body="미래 어느 시점에서의 금액과 동일한 가치를 갖는 현재 시점의 금액" tone="emerald" />
        <TermCard emoji="🔵" title="미래가치 (future value)" body="현재 어느 시점에서의 금액과 동일한 가치를 갖는 미래 시점의 금액" tone="sky" />
        <TermCard emoji="🟡" title="할인율 (discount rate)" body="미래가치에서 현재가치를 구할 때 적용되는 이자율" tone="amber" />
      </div>

      {/* 설정 */}
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🎛️ 어느 방향으로 옮길까요?</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" title={p.note}
              onClick={() => { setAmount(p.amount); setRatePct(p.ratePct); setN(p.n); setMethod(p.method); setDir(p.dir); setRoundTrip(false); }}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10">
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="flex gap-1.5">
            <DirBtn on={dir === "fv"} onClick={() => setDir("fv")} tone="emerald">현재 → 미래 (이자율)</DirBtn>
            <DirBtn on={dir === "pv"} onClick={() => setDir("pv")} tone="amber">미래 → 현재 (할인율)</DirBtn>
          </div>
          <div className="flex gap-1.5">
            {(["simple", "compound"] as Method[]).map((m) => (
              <DirBtn key={m} on={method === m} onClick={() => setMethod(m)} tone="sky">{METHOD_LABEL[m].name}</DirBtn>
            ))}
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Slider id="amt" label={dir === "fv" ? "현재가치 A (지금 가진 돈)" : "미래가치 S (나중에 받을 돈)"}
            value={won(amount)} min={100_000} max={100_000_000} step={100_000} v={amount} onChange={setAmount} />
          <Slider id="rt" label={dir === "fv" ? "이자율 r" : "할인율 r"} value={pctText(ratePct)} min={1} max={20} step={0.5} v={ratePct} onChange={setRatePct} />
          <Slider id="nn" label="기간 n" value={`${n}년`} min={1} max={30} step={1} v={n} onChange={setN} />
        </div>
      </div>

      {/* 다이어그램 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <ValueBridge pv={pv} fv={fv} ratePct={ratePct} n={n} dir={dir} method={method} />
      </div>

      {/* 계산 과정 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">🧮 계산 과정</p>
        <div className="mt-2 space-y-2">
          <StepLine n={1} title={method === "simple" ? "곱하거나 나눌 값 (1 + rn)" : "곱하거나 나눌 값 (1 + r)ⁿ"}
            expr={method === "simple" ? `1 + ${r} × ${n}` : `(1 + ${r})^${n}`} value={factor.toFixed(6)} />
          {dir === "fv" ? (
            <StepLine n={2} title="미래가치 = 현재가치 × 그 값" tone="sky"
              expr={`${won(amount)} × ${factor.toFixed(6)}`} value={won(fv)} />
          ) : (
            <StepLine n={2} title="현재가치 = 미래가치 ÷ 그 값" tone="amber"
              expr={`${won(amount)} ÷ ${factor.toFixed(6)}`} value={won(pv)} />
          )}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Big label="현재가치 A" value={won(pv)} tone="emerald" />
          <Big label="미래가치 S" value={won(fv)} tone="sky" />
          <Big label={dir === "fv" ? "늘어난 돈" : "깎인 돈"} value={won(Math.abs(fv - pv))} tone="amber" />
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-200">🔁 한 바퀴 돌면 제자리로 돌아올까?</p>
            <button type="button" onClick={() => setRoundTrip((v) => !v)}
              className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-3 py-1 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25">
              {roundTrip ? "닫기" : "▶ 왕복 확인"}
            </button>
          </div>
          {roundTrip ? (
            <div className="mt-2 space-y-1 font-mono text-xs leading-6 text-slate-300">
              <p>① 현재가치 <span className="text-emerald-200">{won(pv)}</span> × {factor.toFixed(6)} = <span className="text-sky-200">{won(fv)}</span> <span className="text-slate-500">(이자율 적용)</span></p>
              <p>② 미래가치 <span className="text-sky-200">{won(fv)}</span> ÷ {factor.toFixed(6)} = <span className="text-emerald-200">{won(presentValue(fv, r, n, method))}</span> <span className="text-slate-500">(할인율 적용)</span></p>
              <p className="text-amber-200">→ 처음 금액으로 정확히 돌아왔어요. 이자율과 할인율은 같은 값, 방향만 반대!</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">💡 미래 1원의 현재가치 (할인 계수)</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          {n}년 뒤의 <b className="text-amber-100">1원</b>은 지금의{" "}
          <b className="font-mono text-amber-100">{discountFactor(r, n, method).toFixed(4)}원</b>이에요
          (= 1 ÷ {factor.toFixed(4)}). 즉 미래 금액의 약{" "}
          <b className="text-amber-100">{(discountFactor(r, n, method) * 100).toFixed(1)}%</b>만큼이 지금의 값어치예요.
        </p>
      </div>
    </div>
  );
}

function TermCard({ emoji, title, body, tone }: { emoji: string; title: string; body: string; tone: string }) {
  const cls: Record<string, string> = {
    emerald: "border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-200",
    sky: "border-sky-400/30 bg-sky-400/[0.07] text-sky-200",
    amber: "border-amber-400/30 bg-amber-400/[0.07] text-amber-200",
  };
  return (
    <div className={"rounded-xl border px-3 py-2 " + cls[tone]}>
      <p className="text-xs font-bold">{emoji} {title}</p>
      <p className="mt-0.5 text-[11px] leading-4 text-slate-300">{body}</p>
    </div>
  );
}

function DirBtn({ on, onClick, tone, children }: { on: boolean; onClick: () => void; tone: string; children: React.ReactNode }) {
  const active: Record<string, string> = {
    emerald: "border-emerald-400/60 bg-emerald-400/20 text-emerald-100",
    amber: "border-amber-400/60 bg-amber-400/20 text-amber-100",
    sky: "border-sky-400/60 bg-sky-400/20 text-sky-100",
  };
  return (
    <button type="button" onClick={onClick}
      className={"flex-1 rounded-lg border-2 px-2 py-1.5 text-xs font-bold transition " + (on ? active[tone] : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
      {children}
    </button>
  );
}

function Slider({ id, label, value, min, max, step, v, onChange }: {
  id: string; label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
      <label htmlFor={id} className="text-xs font-bold text-slate-300">{label}: <span className="font-mono text-emerald-200">{value}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40" />
    </div>
  );
}

const STEP_TONE: Record<string, string> = {
  slate: "border-white/10 bg-slate-950/40",
  sky: "border-sky-400/30 bg-sky-400/[0.07]",
  amber: "border-amber-400/30 bg-amber-400/[0.07]",
};

function StepLine({ n, title, expr, value, tone = "slate" }: { n: number; title: string; expr: string; value: string; tone?: string }) {
  return (
    <div className={"rounded-xl border px-3 py-2 " + STEP_TONE[tone]}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-slate-100">
          <span className="mr-1.5 rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">{n}</span>{title}
        </span>
        <span className="font-mono text-lg font-bold text-slate-100">{value}</span>
      </div>
      <p className="mt-0.5 font-mono text-[11px] text-slate-400">{expr}</p>
    </div>
  );
}

const BIG_TONE: Record<string, string> = {
  emerald: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  sky: "border-sky-400/40 bg-sky-400/10 text-sky-100",
  amber: "border-amber-400/40 bg-amber-400/10 text-amber-100",
};

function Big({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={"rounded-xl border px-4 py-3 text-center " + BIG_TONE[tone]}>
      <p className="text-xs font-bold opacity-80">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold">{value}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 기간별 그래프
// ══════════════════════════════════════════════════════════════
const CW = 330, CH = 180, PL = 44, PR = 10, PT = 12, PB = 22;

function GraphTab() {
  const [ratePct, setRatePct] = useState(6);
  const [n, setN] = useState(20);
  const [k, setK] = useState(10);
  const r = ratePct / 100;
  const base = 1_000_000; // 100만원 기준
  const cur = Math.min(k, n);

  const fvS = Array.from({ length: n + 1 }, (_, i) => futureValue(base, r, i, "simple"));
  const fvC = Array.from({ length: n + 1 }, (_, i) => futureValue(base, r, i, "compound"));
  // 오른쪽 그래프도 가로축을 '시점'으로 통일한다.
  // n년 뒤에 받을 100만원의 t시점 가치 = 100만 ÷ (남은 기간 n−t 만큼의 할인)
  //  → t = n 에서 정확히 100만원, t = 0 에서 현재가치가 된다.
  const pvS = Array.from({ length: n + 1 }, (_, i) => presentValue(base, r, n - i, "simple"));
  const pvC = Array.from({ length: n + 1 }, (_, i) => presentValue(base, r, n - i, "compound"));
  const todayS = pvS[0];
  const todayC = pvC[0];
  const horizons = [5, 10, 20, 30].filter((h) => h <= 40);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <p className="text-sm font-bold text-sky-200">📊 100만 원을 기준으로 두 방향을 나란히</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          두 그래프 모두 <b className="text-slate-100">가로축은 시점(0년 = 오늘)</b>이에요. 왼쪽은{" "}
          <b className="text-sky-100">지금 가진 100만 원</b>이 시간이 지나며 자라는 모습, 오른쪽은{" "}
          <b className="text-amber-100">{n}년 뒤에 받기로 한 100만 원</b>의 값어치가 시점마다 얼마인지 —{" "}
          그 왼쪽 끝이 바로 <b className="text-amber-100">현재가치</b>예요.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Slider id="gr" label="이자율 = 할인율 r" value={pctText(ratePct)} min={1} max={20} step={0.5} v={ratePct} onChange={setRatePct} />
          <Slider id="gn" label="그래프 기간" value={`${n}년`} min={5} max={40} step={1} v={n} onChange={(v) => { setN(v); if (cur > v) setK(v); }} />
          <Slider id="gk" label="살펴볼 시점" value={`${cur}년`} min={0} max={n} step={1} v={cur} onChange={setK} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-sm font-bold text-sky-200">📈 미래가치 — 지금 100만 원은 n년 뒤에?</p>
          <p className="mt-0.5 font-mono text-[11px] text-slate-400">S = A(1 + rn) / A(1 + r)ⁿ &nbsp;→ 이자율로 <b className="text-sky-200">곱하기</b></p>
          <Chart series={[
            { key: "s", label: "단리", color: "#fb923c", values: fvS },
            { key: "c", label: "복리", color: "#38bdf8", values: fvC },
          ]} n={n} cursor={cur} baseLine={base} />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Mini label={`${cur}년 뒤 (단리)`} value={man(fvS[cur])} tone="orange" />
            <Mini label={`${cur}년 뒤 (복리)`} value={man(fvC[cur])} tone="sky" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-sm font-bold text-amber-200">📉 현재가치 — {n}년 뒤에 받을 100만 원은 지금 얼마?</p>
          <p className="mt-0.5 font-mono text-[11px] text-slate-400">A = S ÷ (1 + rn) / (1 + r)ⁿ &nbsp;→ 할인율로 <b className="text-amber-200">나누기</b></p>
          <Chart series={[
            { key: "s", label: "단리", color: "#fb923c", values: pvS },
            { key: "c", label: "복리", color: "#fbbf24", values: pvC },
          ]} n={n} cursor={cur} baseLine={base} />
          <p className="mt-1 rounded-lg border border-amber-400/30 bg-amber-400/[0.08] px-3 py-1.5 text-center text-[11px] leading-5 text-amber-100">
            ◀ <b>오른쪽에서 왼쪽으로</b> 읽어요. 오른쪽 끝({n}년)이 받게 될 <b>100만 원</b>, 왼쪽 끝(0년)이 그 돈의 <b>오늘 값어치</b>예요.
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Mini label={`오늘의 값어치 (단리)`} value={man(todayS)} tone="orange" />
            <Mini label={`오늘의 값어치 (복리)`} value={man(todayC)} tone="amber" />
          </div>
        </div>
      </div>

      {/* 만기가 길수록 오늘의 값어치는? */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📏 ‘언제 받는가’에 따라 오늘의 값어치는 얼마나 달라질까?</p>
        <p className="mt-1 text-xs text-slate-400">100만 원을 몇 년 뒤에 받느냐에 따른 오늘의 값어치 (할인율 {pctText(ratePct)} 복리)</p>
        <div className="mt-2 space-y-1.5">
          {horizons.map((h) => {
            const v = presentValue(base, r, h, "compound");
            return (
              <div key={h} className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-right text-xs text-slate-300">{h}년 뒤 100만원</span>
                <div className="h-3 flex-1 overflow-hidden rounded bg-white/10">
                  <div className="h-full rounded bg-amber-400" style={{ width: `${(v / base) * 100}%` }} />
                </div>
                <span className="w-24 shrink-0 text-right font-mono text-xs font-bold text-amber-200">{man(v)}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          받는 시점이 멀수록 오늘의 값어치는 빠르게 줄어요. <b className="text-amber-200">할인율을 높여</b> 보면 줄어드는 속도가 더 빨라집니다.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🔎 두 그래프는 거울처럼 짝을 이뤄요</p>
        <ul className="mt-1.5 space-y-1 text-sm leading-6 text-slate-300">
          <li>• 왼쪽은 <b className="text-sky-200">왼쪽 → 오른쪽</b>으로 이자율을 <b className="text-sky-200">곱해 가고</b>, 오른쪽은 <b className="text-amber-200">오른쪽 → 왼쪽</b>으로 할인율로 <b className="text-amber-200">나눠 와요</b>.</li>
          <li>
            • 오른쪽 그래프의 왼쪽 끝: {n}년 뒤의 100만 원은 지금의{" "}
            <b className="font-mono text-amber-200">{man(todayC)}</b>(복리 기준) — 거꾸로 그 돈을 {n}년 굴리면 정확히 100만 원이 돼요.
          </li>
          <li>
            • 커서를 옮겨 보세요. {cur}년 시점에서 그 돈의 값어치는{" "}
            <b className="font-mono text-amber-200">{man(pvC[cur])}</b>이고, 만기까지 남은 {n - cur}년 동안 100만 원으로 자라요.
          </li>
          <li>• 단리와 복리를 비교해 보세요. 같은 r이라도 복리 쪽이 <b className="text-sky-200">더 크게 불어나고</b> <b className="text-amber-200">더 많이 깎여요</b>.</li>
        </ul>
      </div>
    </div>
  );
}

type Series = { key: string; label: string; color: string; values: number[] };

function Chart({ series, n, cursor, baseLine }: { series: Series[]; n: number; cursor: number; baseLine: number }) {
  const all = series.flatMap((s) => s.values);
  const yMax = Math.max(...all, baseLine) * 1.06;
  const X = (i: number) => PL + (i / Math.max(n, 1)) * (CW - PL - PR);
  const Y = (v: number) => CH - PB - (v / yMax) * (CH - PT - PB);
  const pts = (vals: number[]) => vals.map((v, i) => `${X(i)},${Y(v)}`).join(" ");
  return (
    <div className="mt-2 overflow-x-auto">
      <svg viewBox={`0 0 ${CW} ${CH}`} className="h-auto w-full min-w-[330px]" role="img" aria-label="가치 변화 그래프">
        <rect x={0} y={0} width={CW} height={CH} fill="#0b1220" rx={8} />
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={PL} x2={CW - PR} y1={Y(yMax * t)} y2={Y(yMax * t)} stroke="rgba(255,255,255,0.08)" strokeWidth={0.6} />
            <text x={PL - 4} y={Y(yMax * t) + 3} textAnchor="end" className="fill-slate-500" style={{ fontSize: 6 }}>
              {Math.round((yMax * t) / 10000).toLocaleString("ko-KR")}만
            </text>
          </g>
        ))}
        <line x1={PL} x2={CW - PR} y1={Y(baseLine)} y2={Y(baseLine)} stroke="#64748b" strokeWidth={0.8} strokeDasharray="3 2" />
        <text x={CW - PR} y={Y(baseLine) - 3} textAnchor="end" className="fill-slate-500" style={{ fontSize: 6 }}>100만원</text>

        {series.map((s) => (
          <polyline key={s.key} points={pts(s.values)} fill="none" stroke={s.color} strokeWidth={1.8} />
        ))}
        <line x1={X(cursor)} x2={X(cursor)} y1={PT} y2={CH - PB} stroke="#a78bfa" strokeWidth={0.8} strokeDasharray="2 2" />
        {series.map((s) => (
          <circle key={s.key} cx={X(cursor)} cy={Y(s.values[cursor])} r={2.6} fill={s.color} stroke="#0b1220" strokeWidth={0.8} />
        ))}

        <line x1={PL} x2={CW - PR} y1={CH - PB} y2={CH - PB} stroke="rgba(255,255,255,0.2)" strokeWidth={0.8} />
        {[0, Math.round(n / 2), n].map((i, idx) => (
          <text key={idx} x={X(i)} y={CH - PB + 10} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 6 }}>{i}년</text>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-3 text-[11px]">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1 text-slate-300">
            <span className="inline-block h-0.5 w-4" style={{ backgroundColor: s.color }} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const MINI_TONE: Record<string, string> = {
  orange: "border-orange-400/30 bg-orange-400/[0.08] text-orange-100",
  sky: "border-sky-400/30 bg-sky-400/[0.08] text-sky-100",
  amber: "border-amber-400/30 bg-amber-400/[0.08] text-amber-100",
};

function Mini({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={"rounded-lg border px-3 py-1.5 text-center " + MINI_TONE[tone]}>
      <p className="text-[10px] opacity-80">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-bold">{value}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 단계별 문제
// ══════════════════════════════════════════════════════════════
type StepState = { text: string; ok: boolean; tries: number; hint: boolean; shown: boolean };
const DEFAULT_STEP: StepState = { text: "", ok: false, tries: 0, hint: false, shown: false };

function ProblemTab() {
  const [pIdx, setPIdx] = useState(0);
  const [state, setState] = useState<Record<string, StepState>>({});
  const prob = PROBLEMS[pIdx];
  const doneCount = PROBLEMS.filter((p) => p.steps.every((s) => state[s.id]?.ok)).length;

  function get(id: string) { return state[id] ?? DEFAULT_STEP; }
  function update(id: string, patch: Partial<StepState>) {
    setState((p) => ({ ...p, [id]: { ...(p[id] ?? DEFAULT_STEP), ...patch } }));
  }
  function check(step: Step, override?: string) {
    setState((p) => {
      const cur = p[step.id] ?? DEFAULT_STEP;
      const text = override ?? cur.text;
      const ok =
        step.kind === "number"
          ? (() => {
              const v = Number(text.replace(/[,\s원년만%]/g, ""));
              return Number.isFinite(v) && text.trim() !== "" && Math.abs(v - step.answer) <= (step.tol ?? 0.005);
            })()
          : text !== "" && Number(text) === step.answer;
      return { ...p, [step.id]: { ...cur, text, ok, tries: cur.tries + 1 } };
    });
  }

  const firstOpen = prob.steps.findIndex((s) => !get(s.id).ok);
  const probDone = firstOpen === -1;
  const st = prob.setup;
  const rr = st.ratePct / 100;
  const pvNow = presentValue(st.amount, rr, st.n, st.method);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🧩 현재가치·할인율 단계별 문제</p>
          <span className="font-mono text-xs text-slate-300">완료 {doneCount} / {PROBLEMS.length}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PROBLEMS.map((p, i) => {
            const done = p.steps.every((s) => state[s.id]?.ok);
            return (
              <button key={p.id} type="button" onClick={() => setPIdx(i)}
                className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (pIdx === i ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : done ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
                {done ? "✅ " : ""}{p.emoji} {p.title.replace("문제 ", "").replace(" · ", ". ")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-base font-bold text-slate-100">{prob.emoji} {prob.title}</p>
        <p className="mt-1.5 text-sm leading-7 text-slate-300">{prob.scenario}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {prob.given.map((g) => (
            <div key={g.label} className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2">
              <p className="text-[11px] text-slate-400">{g.label}</p>
              <p className="mt-0.5 text-sm font-bold text-sky-100">{g.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 문제 조건의 다이어그램 */}
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🧭 이 문제의 그림</p>
        <div className="mt-2">
          <ValueBridge pv={pvNow} fv={st.amount} ratePct={st.ratePct} n={st.n} dir="pv" method={st.method} />
        </div>
        <p className="mt-1 rounded-lg bg-black/25 px-3 py-2 text-center font-mono text-xs text-slate-200">
          {METHOD_LABEL[st.method].pv}
        </p>
      </div>

      <div className="space-y-2">
        {prob.steps.map((step, i) => {
          const ss = get(step.id);
          const locked = i > (firstOpen === -1 ? prob.steps.length - 1 : firstOpen);
          return (
            <div key={step.id}
              className={"rounded-2xl border p-4 transition " + (ss.ok ? "border-emerald-400/40 bg-emerald-400/[0.07]" : locked ? "border-white/5 bg-slate-900/20 opacity-50" : "border-violet-400/35 bg-violet-400/[0.06]")}>
              <div className="flex items-start gap-2">
                <span className={"mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold " + (ss.ok ? "bg-emerald-400/25 text-emerald-100" : "bg-white/10 text-slate-300")}>
                  {ss.ok ? "✓" : i + 1}
                </span>
                <p className="text-sm font-bold leading-6 text-slate-100">{step.ask}</p>
              </div>
              {locked ? (
                <p className="mt-2 pl-8 text-xs text-slate-500">앞 단계를 먼저 풀어 주세요 🔒</p>
              ) : (
                <div className="mt-2 pl-8">
                  {step.kind === "number" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="text" inputMode="decimal" aria-label={step.ask} value={ss.text} disabled={ss.ok}
                        onChange={(e) => update(step.id, { text: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") check(step); }}
                        placeholder="숫자만 입력"
                        className="w-40 rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-right font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 disabled:opacity-60" />
                      <span className="text-sm text-slate-300">{step.suffix}</span>
                      {!ss.ok ? (
                        <button type="button" onClick={() => check(step)}
                          className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25">확인</button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {step.options.map((opt, oi) => {
                        const chosen = ss.text === String(oi);
                        const right = ss.ok && oi === step.answer;
                        const wrong = chosen && !ss.ok;
                        return (
                          <button key={oi} type="button" disabled={ss.ok} onClick={() => check(step, String(oi))}
                            className={"rounded-lg border-2 px-3 py-2 text-left text-xs font-bold transition disabled:opacity-80 " + (right ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : wrong ? "border-rose-400/60 bg-rose-400/15 text-rose-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {ss.ok ? (
                    <p className="mt-2 rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-1.5 text-xs leading-5 text-emerald-100">정답이에요! ✅ {step.explain}</p>
                  ) : ss.tries > 0 ? (
                    <p className="mt-2 rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-1.5 text-xs leading-5 text-amber-100">
                      아직 아니에요. {ss.tries >= 2 ? "힌트를 열어 보세요." : "그림을 보며 다시 생각해 볼까요?"}
                    </p>
                  ) : null}

                  {!ss.ok ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => update(step.id, { hint: !ss.hint })}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10">
                        💡 힌트 {ss.hint ? "닫기" : "보기"}
                      </button>
                      {ss.tries >= 3 ? (
                        <button type="button" onClick={() => update(step.id, { shown: true })}
                          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-400 transition hover:bg-white/10">정답 보기</button>
                      ) : null}
                      {ss.hint ? <span className="rounded-lg bg-black/25 px-2.5 py-1 font-mono text-[11px] text-slate-300">{step.hint}</span> : null}
                      {ss.shown ? (
                        <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">
                          정답:{" "}
                          <b className="font-mono text-emerald-200">
                            {step.kind === "number" ? step.answer.toLocaleString("ko-KR") + step.suffix : step.options[step.answer]}
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
            <button type="button" onClick={() => setPIdx(pIdx + 1)}
              className="mt-3 rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25">
              다음 문제로 →
            </button>
          ) : doneCount === PROBLEMS.length ? (
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 네 문제를 모두 해결했어요! 현재가치 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
