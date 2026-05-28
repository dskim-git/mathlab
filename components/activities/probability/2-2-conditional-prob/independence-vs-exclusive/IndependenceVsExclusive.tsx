"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

/* ──────────────────────────────────────────────────────────────
   🎯 사건의 독립과 배반 탐구  (3 tabs)
   1) 분류 게임  — 6시나리오 × (배반 / 독립 / 종속) 3지선다
   2) 독립의 성질 — P(A)·P(B) 슬라이더로 확률 사각형 + 4쌍 독립 확인
   3) 비추이성    — 주사위 A,B,C 예시 (A,B 독립 + B,C 독립 ≠ A,C 독립)
   ────────────────────────────────────────────────────────────── */

// ============================================================
// 탭 1 — 분류 게임
// ============================================================

type ClassAns = "r" | "b" | "g"; // r=배반 / b=독립 / g=종속
type Scenario = {
  title: string; ctx: string;
  a: React.ReactNode; b: React.ReactNode;
  info: React.ReactNode;
  ans: ClassAns;
  explain: React.ReactNode;
};
const SCENARIOS: Scenario[] = [
  {
    title: "🎲 시나리오 1", ctx: "주사위 한 번 던지기",
    a: <>A = {"{2, 4, 6}"} <span className="text-slate-500">(짝수)</span></>,
    b: <>B = {"{1, 3, 5}"} <span className="text-slate-500">(홀수)</span></>,
    info: <>A∩B = ∅ &nbsp;|&nbsp; P(A) = 1/2 &nbsp; P(B) = 1/2</>,
    ans: "r",
    explain: <>A∩B = ∅ → <b>배반</b>! P(B|A) = 0 ≠ P(B) = 1/2 이므로 종속입니다.</>,
  },
  {
    title: "🎲 시나리오 2", ctx: "주사위 한 번 던지기",
    a: <>A = {"{2, 4, 6}"} <span className="text-slate-500">(짝수)</span></>,
    b: <>B = {"{3, 6}"} <span className="text-slate-500">(3의 배수)</span></>,
    info: <>A∩B = {"{6}"} &nbsp;|&nbsp; P(A) = 1/2, P(B) = 1/3, P(A∩B) = 1/6</>,
    ans: "b",
    explain: <>P(A∩B) = 1/6 = (1/2)×(1/3) = P(A)P(B) ✓ → 서로 <b>독립</b>!</>,
  },
  {
    title: "🎲 시나리오 3", ctx: "주사위 한 번 던지기",
    a: <>A = {"{1, 2, 3}"} <span className="text-slate-500">(3 이하)</span></>,
    b: <>B = {"{1, 2, 3, 4}"} <span className="text-slate-500">(4 이하)</span></>,
    info: <>A∩B = {"{1, 2, 3}"} &nbsp;|&nbsp; P(A) = 1/2, P(B) = 2/3, P(A∩B) = 1/2</>,
    ans: "g",
    explain: <>P(A∩B) = 1/2 ≠ P(A)P(B) = 1/3 → <b>종속</b>! A⊂B 이므로 A가 일어나면 B는 반드시 일어납니다.</>,
  },
  {
    title: "🪙 시나리오 4", ctx: "동전 한 번 던지기",
    a: <>A = {"{앞면}"}</>, b: <>B = {"{뒷면}"}</>,
    info: <>A∩B = ∅ &nbsp;|&nbsp; P(A) = 1/2, P(B) = 1/2</>,
    ans: "r",
    explain: <>A∩B = ∅ → <b>배반</b>! 앞면이 나오면 뒷면이 절대 나올 수 없습니다 → 종속.</>,
  },
  {
    title: "🃏 시나리오 5", ctx: "트럼프 카드 52장에서 1장 뽑기",
    a: <>A = 하트 <span className="text-slate-500">(13장)</span></>,
    b: <>B = K (킹) <span className="text-slate-500">(4장)</span></>,
    info: <>A∩B = 하트K (1장) &nbsp;|&nbsp; P(A) = 1/4, P(B) = 1/13, P(A∩B) = 1/52</>,
    ans: "b",
    explain: <>P(A∩B) = 1/52 = (1/4)×(1/13) = P(A)P(B) ✓ → <b>독립</b>! 무늬와 숫자는 서로 무관합니다.</>,
  },
  {
    title: "🎲 시나리오 6", ctx: "주사위 한 번 던지기",
    a: <>A = {"{2, 3, 5}"} <span className="text-slate-500">(소수)</span></>,
    b: <>B = {"{2, 4, 6}"} <span className="text-slate-500">(짝수)</span></>,
    info: <>A∩B = {"{2}"} &nbsp;|&nbsp; P(A) = 1/2, P(B) = 1/2, P(A∩B) = 1/6</>,
    ans: "g",
    explain: <>P(A∩B) = 1/6 ≠ P(A)P(B) = 1/4 → <b>종속</b>! 겹치지만(A∩B≠∅) 독립은 아닌 대표 사례!</>,
  },
];

function ClassifyTab() {
  const [picks, setPicks] = useState<Record<number, ClassAns | null>>({});

  function pick(i: number, c: ClassAns) {
    if (picks[i] !== undefined) return;
    setPicks((p) => ({ ...p, [i]: c }));
  }
  function reset() {
    setPicks({});
  }

  const ok = SCENARIOS.reduce((acc, s, i) => acc + (picks[i] === s.ans ? 1 : 0), 0);
  const ng = SCENARIOS.reduce((acc, s, i) => acc + (picks[i] != null && picks[i] !== s.ans ? 1 : 0), 0);
  const allDone = SCENARIOS.every((_, i) => picks[i] != null);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] p-4">
        <h4 className="text-base font-bold text-cyan-300">사건 분류 게임 : 배반? 독립? 종속?</h4>
        <p className="mt-1 text-sm text-slate-400">두 사건 A, B의 관계를 판단하고 버튼을 눌러 보세요!</p>
      </div>

      {/* 스코어바 */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <span className="text-sm text-slate-300">
          점수 <b className="text-lg text-amber-300">{ok}</b> <span className="text-slate-500">/ 6</span>
        </span>
        <span className="text-sm text-slate-300">✅ 정답 <b className="text-emerald-300">{ok}</b></span>
        <span className="text-sm text-slate-300">❌ 오답 <b className="text-red-300">{ng}</b></span>
        <button
          type="button"
          onClick={reset}
          className="ml-auto rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
        >
          🔄 다시하기
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SCENARIOS.map((s, i) => {
          const picked = picks[i] ?? null;
          const correct = picked != null && picked === s.ans;
          const wrong = picked != null && picked !== s.ans;
          const borderCls = correct
            ? "border-emerald-400/55 bg-emerald-400/[0.07]"
            : wrong
            ? "border-red-400/55 bg-red-400/[0.07]"
            : "border-white/12 bg-white/[0.04]";
          return (
            <div key={i} className={`rounded-xl border-2 p-4 transition ${borderCls}`}>
              <div className="text-sm font-bold text-blue-300">{s.title}</div>
              <div className="text-[11px] text-slate-500">{s.ctx}</div>
              <div className="mt-2 rounded-lg bg-slate-900/60 p-3 text-xs leading-7">
                <div className="text-red-300">{s.a}</div>
                <div className="text-blue-300">{s.b}</div>
                <div className="mt-1 text-[11px] text-slate-500">{s.info}</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <AnsBtn label="🔴 배반" tone="red" picked={picked} thisAns="r" correct={s.ans} onClick={() => pick(i, "r")} />
                <AnsBtn label="🔵 독립" tone="blue" picked={picked} thisAns="b" correct={s.ans} onClick={() => pick(i, "b")} />
                <AnsBtn label="⬜ 종속" tone="gray" picked={picked} thisAns="g" correct={s.ans} onClick={() => pick(i, "g")} />
              </div>
              {picked != null ? (
                <div className={`mt-2 rounded-md px-3 py-2 text-xs leading-6 ${
                  correct
                    ? "border border-emerald-400/35 bg-emerald-400/10 text-emerald-200"
                    : "border border-red-400/35 bg-red-400/10 text-red-200"
                }`}>
                  {correct ? "✅ 정답! " : "❌ 틀렸어요. "}{s.explain}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {allDone ? (
        <div className="rounded-xl border border-amber-400/35 bg-amber-400/[0.06] p-4 animate-[fadein_0.4s_ease]">
          <p className="text-sm font-bold text-amber-300">🔑 핵심 정리</p>
          <div className="mt-2 space-y-2">
            <div className="rounded-md border-l-4 border-red-400/60 bg-slate-900/60 p-2.5 text-xs leading-6 text-slate-300">
              <span className="mr-1 inline-block rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">배반</span>
              A∩B = ∅ — 두 사건이 동시에 일어날 수 없다.
              <br />
              → P(B|A) = 0 이므로, P(B) {">"} 0이면 P(B|A) ≠ P(B) <b>→ 배반이면 반드시 종속!</b>
            </div>
            <div className="rounded-md border-l-4 border-blue-400/60 bg-slate-900/60 p-2.5 text-xs leading-6 text-slate-300">
              <span className="mr-1 inline-block rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">독립</span>
              P(A∩B) = P(A)·P(B) — 한 사건이 다른 사건의 확률에 영향 없음.
              <br />
              → A∩B ≠ ∅ 가능! 즉, <b>겹쳐도 됩니다.</b>
            </div>
            <div className="rounded-md border-l-4 border-amber-400/60 bg-slate-900/60 p-2.5 text-xs leading-6 text-slate-300">
              ⚠️ <b>배반 ≠ 독립</b> — 완전히 다른 개념!
              <br />
              배반 → 반드시 종속 &nbsp;|&nbsp; 독립 → 반드시 A∩B ≠ ∅ (P(A), P(B) {">"} 0인 경우)
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AnsBtn({
  label, tone, picked, thisAns, correct, onClick,
}: {
  label: string; tone: "red" | "blue" | "gray";
  picked: ClassAns | null; thisAns: ClassAns; correct: ClassAns;
  onClick: () => void;
}) {
  const decided = picked != null;
  const isPicked = picked === thisAns;
  const isCorrect = decided && thisAns === correct;
  const isWrongPick = decided && isPicked && thisAns !== correct;

  let cls: string;
  if (!decided) {
    cls = tone === "red" ? "border-red-400/45 bg-red-500/12 text-red-200 hover:bg-red-500/25"
      : tone === "blue" ? "border-blue-400/45 bg-blue-500/12 text-blue-200 hover:bg-blue-500/25"
      : "border-slate-400/40 bg-slate-500/12 text-slate-300 hover:bg-slate-500/25";
  } else if (isCorrect) {
    cls = "border-emerald-400 bg-emerald-400 text-slate-950";
  } else if (isWrongPick) {
    cls = "border-red-400 bg-red-400/25 text-red-300";
  } else {
    cls = "border-white/12 bg-white/[0.04] text-slate-500";
  }

  return (
    <button
      type="button"
      disabled={decided}
      onClick={onClick}
      className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition disabled:cursor-default ${cls}`}
    >
      {label}
    </button>
  );
}

// ============================================================
// 탭 2 — 독립의 성질 (확률 사각형)
// ============================================================

function RectTab() {
  const [pa, setPa] = useState(40); // 10~90 (%)
  const [pb, setPb] = useState(30);

  const PA = pa / 100;
  const PB = pb / 100;
  const PAC = 1 - PA;
  const PBC = 1 - PB;

  const pairs = [
    { la: "A, B",      px: PA,  py: PB,  xLabel: "P(A)",   yLabel: "P(B)" },
    { la: "A, Bᶜ",    px: PA,  py: PBC, xLabel: "P(A)",   yLabel: "P(Bᶜ)" },
    { la: "Aᶜ, B",    px: PAC, py: PB,  xLabel: "P(Aᶜ)",  yLabel: "P(B)" },
    { la: "Aᶜ, Bᶜ",  px: PAC, py: PBC, xLabel: "P(Aᶜ)",  yLabel: "P(Bᶜ)" },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] p-4">
        <h4 className="text-base font-bold text-cyan-300">독립의 성질 : 독립이면 4쌍 모두 독립!</h4>
        <p className="mt-1 text-sm text-slate-400">슬라이더로 P(A)와 P(B)를 바꿔 보세요. A와 B가 독립이면 아래 4쌍이 모두 독립입니다.</p>
      </div>

      {/* 슬라이더 */}
      <section className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-2">
        <SliderBox id="ind-pa" label="P(A)" value={PA} sliderValue={pa} onChange={setPa} accent="cyan" />
        <SliderBox id="ind-pb" label="P(B)" value={PB} sliderValue={pb} onChange={setPb} accent="amber" />
      </section>

      {/* 확률 사각형 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <ProbRectangle PA={PA} PB={PB} />
      </section>

      {/* 4쌍 독립 확인 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-cyan-300">📋 4쌍 독립 확인</h5>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {pairs.map((p, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-xs leading-7">
              <p className="font-bold text-amber-300">{p.la} 독립?</p>
              <p className="font-mono text-[11px] text-blue-300">{p.xLabel} × {p.yLabel}</p>
              <p className="font-mono text-[11px] text-slate-400">
                {p.px.toFixed(2)} × {p.py.toFixed(2)} = <b>{(p.px * p.py).toFixed(4)}</b>
              </p>
              <p className="font-bold text-emerald-300">✓ 독립</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-r-xl border-l-4 border-amber-400/55 bg-amber-400/[0.06] p-3 text-xs leading-7 text-slate-200">
        <b className="text-amber-300">💡 확률 사각형 읽는 법</b>
        <br />
        가로 = P(A) 또는 P(Aᶜ), 세로 = P(B) 또는 P(Bᶜ)
        <br />
        각 칸의 <b>넓이 = 가로 × 세로 = 두 사건 각각의 확률의 곱</b>
        <br />
        ⇒ 이 <b>격자 구조</b>가 독립의 본질! 4쌍 모두 자동으로 독립이 됩니다.
      </div>
    </div>
  );
}

function SliderBox({
  id, label, value, sliderValue, onChange, accent,
}: {
  id: string; label: string; value: number; sliderValue: number;
  onChange: (n: number) => void;
  accent: "cyan" | "amber";
}) {
  const accentCls = accent === "cyan" ? "accent-cyan-400" : "accent-amber-400";
  const valTone = accent === "cyan" ? "text-cyan-300" : "text-amber-300";
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <label htmlFor={id} className="font-bold text-slate-300">{label}</label>
        <span className={`font-mono text-lg font-bold ${valTone}`}>{value.toFixed(2)}</span>
      </div>
      <input
        id={id}
        type="range" min={10} max={90} value={sliderValue}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} 슬라이더`}
        className={`mt-1 w-full ${accentCls}`}
      />
    </div>
  );
}

function ProbRectangle({ PA, PB }: { PA: number; PB: number }) {
  // viewBox 360 × 340 (가로/세로 비율 유지) — 각 영역은 직사각형
  const VBW = 360;
  const VBH = 340;
  const xd = PA * VBW; // A 영역 가로폭
  const yd = (1 - PB) * VBH; // B 영역 세로폭(위 영역)
  const PAC = 1 - PA;
  const PBC = 1 - PB;

  // 라벨 위치(영역 중심)
  function labelAt(x: number, y: number, w: number, h: number, text: string, prob: string) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    // 너무 작은 영역은 텍스트 생략
    if (w < 56 || h < 36) return null;
    return (
      <g>
        <text x={cx} y={cy - 5} fontSize={14} fontWeight={700} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.92)">
          {text}
        </text>
        <text x={cx} y={cy + 10} fontSize={11} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.78)">
          {prob}
        </text>
      </g>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-slate-500">※ A와 B가 독립일 때 확률 사각형</p>
      <svg viewBox={`0 0 ${VBW + 90} ${VBH + 30}`} className="block w-full max-w-[640px]" aria-label="확률 사각형">
        {/* Y축 라벨 (왼쪽) */}
        <g>
          <text x={80} y={yd / 2} fontSize={12} fontWeight={700} textAnchor="end" dominantBaseline="central" fill="#fcd34d">
            P(B) = {PB.toFixed(2)}
          </text>
          <text x={80} y={yd + (VBH - yd) / 2} fontSize={12} fontWeight={700} textAnchor="end" dominantBaseline="central" fill="#fcd34d">
            P(Bᶜ) = {PBC.toFixed(2)}
          </text>
        </g>

        {/* 4영역 직사각형 — translate(90, 0) */}
        <g transform="translate(90, 0)">
          <rect x={0} y={0} width={xd} height={yd} fill="#1565c0" stroke="#fff" strokeWidth={1.5} />
          <rect x={xd} y={0} width={VBW - xd} height={yd} fill="#4a148c" stroke="#fff" strokeWidth={1.5} />
          <rect x={0} y={yd} width={xd} height={VBH - yd} fill="#1b5e20" stroke="#fff" strokeWidth={1.5} />
          <rect x={xd} y={yd} width={VBW - xd} height={VBH - yd} fill="#4e342e" stroke="#fff" strokeWidth={1.5} />

          {/* 라벨 */}
          {labelAt(0, 0, xd, yd, "A∩B", (PA * PB).toFixed(3))}
          {labelAt(xd, 0, VBW - xd, yd, "Aᶜ∩B", (PAC * PB).toFixed(3))}
          {labelAt(0, yd, xd, VBH - yd, "A∩Bᶜ", (PA * PBC).toFixed(3))}
          {labelAt(xd, yd, VBW - xd, VBH - yd, "Aᶜ∩Bᶜ", (PAC * PBC).toFixed(3))}

          {/* X축 라벨 (아래) */}
          <text x={xd / 2} y={VBH + 16} fontSize={12} fontWeight={700} textAnchor="middle" fill="#fcd34d">
            P(A) = {PA.toFixed(2)}
          </text>
          <text x={xd + (VBW - xd) / 2} y={VBH + 16} fontSize={12} fontWeight={700} textAnchor="middle" fill="#fcd34d">
            P(Aᶜ) = {PAC.toFixed(2)}
          </text>
        </g>
      </svg>
      <p className="text-center text-[11px] text-slate-500">← A → &nbsp;|&nbsp; ← Aᶜ →</p>
    </div>
  );
}

// ============================================================
// 탭 3 — 비추이성 (주사위 A, B, C)
// ============================================================

type Membership = { n: number; inA: boolean; inB: boolean; inC: boolean };
const MEMBERSHIP: Membership[] = [
  { n: 1, inA: true,  inB: false, inC: false },
  { n: 2, inA: false, inB: false, inC: true  },
  { n: 3, inA: true,  inB: true,  inC: true  },
  { n: 4, inA: false, inB: true,  inC: false },
  { n: 5, inA: true,  inB: false, inC: true  },
  { n: 6, inA: false, inB: false, inC: false },
];
const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function classifyDie(m: Membership): { tone: string; label: React.ReactNode } {
  const inMany = (m.inA ? 1 : 0) + (m.inB ? 1 : 0) + (m.inC ? 1 : 0);
  if (inMany === 0) return { tone: "border-white/15 bg-slate-900/40 text-slate-500", label: <span className="text-slate-500">–</span> };
  // 색 우선순위: ABC > 두 개 교집합 > 단일
  let tone = "";
  if (m.inA && m.inB && m.inC) tone = "border-white/70 bg-slate-600 text-white";
  else if (m.inA && m.inB) tone = "border-purple-400 bg-purple-900/70 text-purple-100";
  else if (m.inB && m.inC) tone = "border-teal-400 bg-teal-900/70 text-teal-100";
  else if (m.inA && m.inC) tone = "border-orange-400 bg-orange-900/70 text-orange-100";
  else if (m.inA) tone = "border-red-400 bg-red-900/70 text-red-100";
  else if (m.inB) tone = "border-blue-400 bg-blue-900/70 text-blue-100";
  else tone = "border-emerald-400 bg-emerald-900/70 text-emerald-100";

  const parts: React.ReactNode[] = [];
  if (m.inA) parts.push(<span key="A" className="text-red-300">A</span>);
  if (m.inB) parts.push(<span key="B" className="text-blue-300">B</span>);
  if (m.inC) parts.push(<span key="C" className="text-emerald-300">C</span>);
  return {
    tone,
    label: (
      <>
        {parts.map((el, i) => (
          <span key={i}>
            {el}
            {i < parts.length - 1 ? <span className="text-slate-500">·</span> : null}
          </span>
        ))}
      </>
    ),
  };
}

type StepKey = 0 | 1 | 2 | 3 | 4;

function NonTransitiveTab() {
  const [step, setStep] = useState<StepKey>(0);

  const stepBtns: { idx: StepKey; label: string }[] = [
    { idx: 0, label: "📋 사건 확인" },
    { idx: 1, label: "① A, B 독립?" },
    { idx: 2, label: "② B, C 독립?" },
    { idx: 3, label: "③ A, C 독립? 🔥" },
    { idx: 4, label: "🔑 결론" },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-violet-400/30 bg-violet-400/[0.06] p-4">
        <h4 className="text-base font-bold text-violet-300">독립의 비추이성 — 삼단논법은 통하지 않는다!</h4>
        <p className="mt-1 text-sm text-slate-400">
          A와 B가 독립이고, B와 C가 독립이라도 → A와 C가 독립이라는 보장은 없습니다.
        </p>
      </div>

      <div className="rounded-xl border border-amber-400/35 bg-amber-400/[0.06] p-3 text-xs leading-7 text-slate-200">
        ⚠️ <b className="text-amber-300">착각 주의!</b>
        <br />
        &nbsp;&nbsp;&ldquo;A와 B가 독립&rdquo; + &ldquo;B와 C가 독립&rdquo; → &ldquo;A와 C도 독립&rdquo;? <b>이건 항상 성립하지 않습니다!</b>
        <br />
        &nbsp;&nbsp;아래 주사위 예시로 직접 확인해 보세요.
      </div>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-violet-300">🎲 주사위 한 번 던지기 — 사건 정의</h5>
        <p className="mt-2 text-xs leading-7 text-slate-300">
          <b className="text-red-300">A = {"{1, 3, 5}"}</b> <span className="text-slate-500">(홀수)</span> &nbsp;|&nbsp;{" "}
          <b className="text-blue-300">B = {"{3, 4}"}</b> <span className="text-slate-500">(3 또는 4)</span> &nbsp;|&nbsp;{" "}
          <b className="text-emerald-300">C = {"{2, 3, 5}"}</b> <span className="text-slate-500">(소수)</span>
        </p>
        <Legend />
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {MEMBERSHIP.map((m, i) => {
            const cls = classifyDie(m);
            return (
              <div key={m.n} className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition ${cls.tone}`}>
                <div className="text-3xl leading-none">{FACES[i]}</div>
                <div className="text-[10px] font-bold">{cls.label}</div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">* 각 눈의 색은 어느 사건에 속하는지 나타냅니다.</p>
      </section>

      {/* 단계 버튼 */}
      <div className="flex flex-wrap gap-1.5">
        {stepBtns.map((b) => (
          <button
            key={b.idx}
            type="button"
            onClick={() => setStep(b.idx)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              step === b.idx
                ? "bg-blue-500 text-white"
                : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* 단계 내용 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-8 text-slate-200">
        {step === 0 ? (
          <>
            <p className="text-sm font-bold text-amber-300">📋 사건 정리</p>
            <p>표본공간 S = {"{1, 2, 3, 4, 5, 6}"}</p>
            <p className="text-red-300"><b>A = {"{1, 3, 5}"}</b> → P(A) = 3/6 = <b>1/2</b></p>
            <p className="text-blue-300"><b>B = {"{3, 4}"}</b> → P(B) = 2/6 = <b>1/3</b></p>
            <p className="text-emerald-300"><b>C = {"{2, 3, 5}"}</b> → P(C) = 3/6 = <b>1/2</b></p>
            <p className="mt-2 text-slate-500">단계별로 독립 여부를 확인해 보세요. ① ② ③ 버튼을 순서대로 눌러 보세요!</p>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <p className="text-sm font-bold text-amber-300">① A와 B는 서로 독립인가?</p>
            <p>A∩B = {"{1, 3, 5}"} ∩ {"{3, 4}"} = <b className="text-amber-300">{"{3}"}</b></p>
            <p>P(A∩B) = 1/6</p>
            <p>P(A) × P(B) = 1/2 × 1/3 = <b className="text-amber-300">1/6</b></p>
            <div className="mt-2 rounded-r-md border-l-[3px] border-emerald-400 bg-emerald-400/[0.08] p-2.5 text-emerald-200">
              P(A∩B) = 1/6 = P(A)·P(B) = 1/6 &nbsp;<b>✓ A와 B는 서로 독립!</b>
            </div>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <p className="text-sm font-bold text-amber-300">② B와 C는 서로 독립인가?</p>
            <p>B∩C = {"{3, 4}"} ∩ {"{2, 3, 5}"} = <b className="text-amber-300">{"{3}"}</b></p>
            <p>P(B∩C) = 1/6</p>
            <p>P(B) × P(C) = 1/3 × 1/2 = <b className="text-amber-300">1/6</b></p>
            <div className="mt-2 rounded-r-md border-l-[3px] border-emerald-400 bg-emerald-400/[0.08] p-2.5 text-emerald-200">
              P(B∩C) = 1/6 = P(B)·P(C) = 1/6 &nbsp;<b>✓ B와 C도 서로 독립!</b>
            </div>
            <p className="mt-2 text-slate-500">✅ A, B 독립 + B, C 독립 → A, C도 독립?? 확인해 봅시다!</p>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <p className="text-sm font-bold text-amber-300">③ A와 C는 서로 독립인가? 🔥</p>
            <p>A∩C = {"{1, 3, 5}"} ∩ {"{2, 3, 5}"} = <b className="text-amber-300">{"{3, 5}"}</b></p>
            <p>P(A∩C) = 2/6 = <b className="text-amber-300">1/3</b></p>
            <p>P(A) × P(C) = 1/2 × 1/2 = <b className="text-amber-300">1/4</b></p>
            <div className="mt-2 rounded-r-md border-l-[3px] border-amber-400 bg-amber-400/[0.10] p-2.5 text-amber-200">
              P(A∩C) = 1/3 &nbsp;≠&nbsp; P(A)·P(C) = 1/4 &nbsp;<b className="text-red-300">✗ A와 C는 종속!</b>
            </div>
            <p className="mt-2 font-bold text-amber-300">😲 A, B 독립 + B, C 독립이어도 A, C는 독립이 아닙니다!</p>
          </>
        ) : null}
        {step === 4 ? (
          <>
            <p className="text-sm font-bold text-amber-300">🔑 핵심 결론</p>
            <div className="mt-2 rounded-r-md border-l-[3px] border-blue-400 bg-blue-400/[0.06] p-2.5">
              <b className="text-slate-100">A와 B가 독립</b> + <b className="text-slate-100">B와 C가 독립</b>이라고 해서 <b className="text-slate-100">A와 C도 독립</b>인 것은 <b>아닙니다!</b>
              <br />
              독립에서는 <b className="text-amber-300">삼단논법이 성립하지 않습니다.</b>
            </div>
            <div className="mt-2 rounded-r-md border-l-[3px] border-amber-400 bg-amber-400/[0.08] p-2.5">
              <b className="text-amber-300">독립은 &ldquo;전파&rdquo;되지 않습니다.</b>
              <br />
              두 쌍 각각의 독립 여부를 항상 직접 P(A∩B) = P(A)P(B) 로 확인해야 합니다!
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              이 예시 : A = {"{홀수}"}, B = {"{3, 4}"}, C = {"{소수}"} → A, B 독립 ✓ &nbsp; B, C 독립 ✓ &nbsp; A, C 종속 ✗
            </p>
          </>
        ) : null}
      </section>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
      <LegendChip dot="bg-red-900 border-red-400">A만</LegendChip>
      <LegendChip dot="bg-blue-900 border-blue-400">B만</LegendChip>
      <LegendChip dot="bg-emerald-900 border-emerald-400">C만</LegendChip>
      <LegendChip dot="bg-purple-900 border-purple-400">A∩B</LegendChip>
      <LegendChip dot="bg-teal-900 border-teal-400">B∩C</LegendChip>
      <LegendChip dot="bg-orange-900 border-orange-400">A∩C</LegendChip>
      <LegendChip dot="bg-slate-600 border-white/70">A∩B∩C</LegendChip>
    </div>
  );
}

function LegendChip({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-sm border ${dot}`} />
      {children}
    </span>
  );
}

// ============================================================
// 메인
// ============================================================

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "exclusive_vs_indep",
    kind: "text",
    prompt: "배반(A∩B=∅)과 독립(P(A∩B)=P(A)P(B))은 어떻게 다른가요? ‘배반이면 종속이다’가 참인 이유를 자신의 말로 설명해 보세요.",
    placeholder: "배반이면 P(B|A) = 0이 되는데...",
  },
  {
    id: "common_confusion",
    kind: "text",
    prompt: "많은 학생들이 배반을 독립과 혼동합니다. 왜 그런 착각이 생길까요?",
    placeholder: "두 개념의 어떤 점이 혼동을 유발하나요?",
  },
  {
    id: "four_pairs",
    kind: "text",
    prompt: "A와 B가 독립이면 (A, Bᶜ), (Aᶜ, B), (Aᶜ, Bᶜ)도 모두 독립입니다. 확률 사각형과 연결 지어 설명해 보세요.",
    placeholder: "격자 구조에서 각 칸의 넓이는...",
  },
  {
    id: "non_transitive",
    kind: "text",
    prompt: "A, B 독립 + B, C 독립이어도 A, C가 종속일 수 있습니다. 주사위 예시에서 왜 그런지 설명해 보세요.",
    placeholder: "A = {홀수}, B = {3, 4}, C = {소수} 에서 A∩C를 계산해 보면...",
  },
];

type TabKey = "classify" | "rect" | "nontrans";

export default function IndependenceVsExclusive() {
  const [tab, setTab] = useState<TabKey>("classify");
  const tabBtn = (active: boolean, color: string) =>
    active
      ? `rounded-lg ${color} px-3 py-2 text-sm font-bold text-slate-950`
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <style>{`@keyframes fadein {from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)}}`}</style>

      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 사건의 독립과 종속</p>
        <h3 className="mt-2 text-2xl font-bold">🎯 사건의 독립과 배반 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-red-300">배반(A∩B=∅)</b>과 <b className="text-blue-300">독립(P(A∩B)=P(A)P(B))</b>은 완전히 다른 개념입니다.{" "}
          분류 게임 · 확률 사각형 · 비추이성 세 가지 활동으로 헷갈리기 쉬운 두 개념의 본질을 발견해 봐요.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "classify", "bg-red-300")} onClick={() => setTab("classify")}>
          🎯 ① 분류 게임
        </button>
        <button type="button" className={tabBtn(tab === "rect", "bg-cyan-300")} onClick={() => setTab("rect")}>
          📐 ② 독립의 성질
        </button>
        <button type="button" className={tabBtn(tab === "nontrans", "bg-violet-300")} onClick={() => setTab("nontrans")}>
          🔄 ③ 비추이성
        </button>
      </div>

      <div className="mt-5">
        {tab === "classify" ? <ClassifyTab /> : tab === "rect" ? <RectTab /> : <NonTransitiveTab />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
