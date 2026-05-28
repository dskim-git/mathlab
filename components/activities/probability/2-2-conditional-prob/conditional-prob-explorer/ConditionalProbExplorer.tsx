"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

/* ──────────────────────────────────────────────────────────────
   🔍 조건부확률 탐험기  (3 scenarios)
   주사위 · 상자 속 공 · 숫자 카드 — 사건 A, B 직접 선택 후
   P(A), P(B), P(A∩B), P(B|A), P(A|B) 비교 + 벤다이어그램 + 동적 인사이트.
   ────────────────────────────────────────────────────────────── */

// ============================================================
// 시나리오 데이터
// ============================================================

type EventDef = { label: string; desc: string; elems: number[] };
type Scenario = { id: number; icon: string; name: string; situation: React.ReactNode; n: number; elems: number[]; events: EventDef[] };

const SCENARIOS: Scenario[] = [
  {
    id: 0,
    icon: "🎲",
    name: "주사위",
    situation: (
      <>
        주사위 한 개를 던지는 시행을 생각해 봐요.
        <br />
        표본공간 <b className="text-amber-200">S = {"{1, 2, 3, 4, 5, 6}"}</b>, n(S) = 6 으로 모든 결과가 동일한 확률로 나타납니다.
      </>
    ),
    n: 6,
    elems: [1, 2, 3, 4, 5, 6],
    events: [
      { label: "홀수",     desc: "{1, 3, 5}",    elems: [1, 3, 5] },
      { label: "짝수",     desc: "{2, 4, 6}",    elems: [2, 4, 6] },
      { label: "소수",     desc: "{2, 3, 5}",    elems: [2, 3, 5] },
      { label: "3의 배수", desc: "{3, 6}",       elems: [3, 6] },
      { label: "4 이상",   desc: "{4, 5, 6}",    elems: [4, 5, 6] },
      { label: "6의 약수", desc: "{1, 2, 3, 6}", elems: [1, 2, 3, 6] },
    ],
  },
  {
    id: 1,
    icon: "🎱",
    name: "상자 속 공",
    situation: (
      <>
        상자에 1부터 15까지 자연수가 적힌 <b className="text-amber-200">공 15개</b>가 들어 있습니다.
        <br />
        임의로 공 1개를 꺼내는 시행에서 표본공간 <b className="text-amber-200">S = {"{1, 2, …, 15}"}</b>, n(S) = 15 입니다.
      </>
    ),
    n: 15,
    elems: Array.from({ length: 15 }, (_, i) => i + 1),
    events: [
      { label: "홀수",      desc: "{1,3,5,7,9,11,13,15}", elems: [1, 3, 5, 7, 9, 11, 13, 15] },
      { label: "소수",      desc: "{2,3,5,7,11,13}",       elems: [2, 3, 5, 7, 11, 13] },
      { label: "3의 배수",  desc: "{3,6,9,12,15}",          elems: [3, 6, 9, 12, 15] },
      { label: "5의 배수",  desc: "{5,10,15}",              elems: [5, 10, 15] },
      { label: "12의 약수", desc: "{1,2,3,4,6,12}",         elems: [1, 2, 3, 4, 6, 12] },
      { label: "10 이하",   desc: "{1,2,…,10}",             elems: Array.from({ length: 10 }, (_, i) => i + 1) },
    ],
  },
  {
    id: 2,
    icon: "🃏",
    name: "숫자 카드",
    situation: (
      <>
        1부터 20까지 자연수가 적힌 <b className="text-amber-200">카드 20장</b> 중에서 1장을 임의로 뽑습니다.
        <br />
        표본공간 <b className="text-amber-200">S = {"{1, 2, …, 20}"}</b>, n(S) = 20 입니다.
      </>
    ),
    n: 20,
    elems: Array.from({ length: 20 }, (_, i) => i + 1),
    events: [
      { label: "홀수",       desc: "{1,3,5,…,19}",          elems: Array.from({ length: 10 }, (_, i) => 2 * i + 1) },
      { label: "짝수",       desc: "{2,4,6,…,20}",          elems: Array.from({ length: 10 }, (_, i) => 2 * (i + 1)) },
      { label: "4의 배수",   desc: "{4,8,12,16,20}",        elems: [4, 8, 12, 16, 20] },
      { label: "소수",       desc: "{2,3,5,7,11,13,17,19}", elems: [2, 3, 5, 7, 11, 13, 17, 19] },
      { label: "5의 배수",   desc: "{5,10,15,20}",          elems: [5, 10, 15, 20] },
      { label: "완전제곱수", desc: "{1,4,9,16}",            elems: [1, 4, 9, 16] },
      { label: "10 이하",    desc: "{1,2,…,10}",            elems: Array.from({ length: 10 }, (_, i) => i + 1) },
    ],
  },
];

// ============================================================
// 보조 — 분수 표기 (gcd 약분)
// ============================================================

function gcd(a: number, b: number): number {
  while (b) { const t = b; b = a % b; a = t; }
  return a;
}
function frac(n: number, d: number): string {
  if (d === 0) return "—";
  if (n === 0) return "0";
  const g = gcd(n, d);
  const a = n / g, b = d / g;
  return b === 1 ? `${a}` : `${a}/${b}`;
}
function dec(n: number, d: number): string {
  if (d === 0) return "";
  return ` ≈ ${(n / d).toFixed(3)}`;
}

// ============================================================
// 확률 + 인사이트 계산
// ============================================================

type Probs = {
  nA: number; nB: number; nAB: number; n: number;
  pA: string; pAd: string;
  pB: string; pBd: string;
  pAB: string; pABd: string;
  pBgA: string | null; pBgAd: string;
  pAgB: string | null; pAgBd: string;
  isIndep: boolean;
};

function compute(sc: Scenario, aIdx: number, bIdx: number): Probs {
  const eA = sc.events[aIdx];
  const eB = sc.events[bIdx];
  const sB = new Set(eB.elems);
  const nA = eA.elems.length;
  const nB = eB.elems.length;
  const nAB = eA.elems.filter((x) => sB.has(x)).length;
  const n = sc.n;
  return {
    nA, nB, nAB, n,
    pA: frac(nA, n),   pAd: dec(nA, n),
    pB: frac(nB, n),   pBd: dec(nB, n),
    pAB: frac(nAB, n), pABd: dec(nAB, n),
    pBgA: nA > 0 ? frac(nAB, nA) : null,
    pBgAd: nA > 0 ? dec(nAB, nA) : "",
    pAgB: nB > 0 ? frac(nAB, nB) : null,
    pAgBd: nB > 0 ? dec(nAB, nB) : "",
    isIndep: nA > 0 && nAB * n === nB * nA,
  };
}

type InsightKind = "zero" | "same" | "diff" | "info";
type Insight = { kind: InsightKind; html: React.ReactNode };

function makeInsights(p: Probs): Insight[] {
  const out: Insight[] = [];
  if (p.nAB === 0) {
    out.push({
      kind: "zero",
      html: (
        <>
          ⊘ A∩B = ∅ → 두 사건은 <strong>배반사건</strong>! P(B|A) = 0, P(A|B) = 0이에요.
        </>
      ),
    });
    return out;
  }
  if (p.isIndep) {
    out.push({
      kind: "same",
      html: (
        <>
          ✓ P(B|A) = {p.pBgA} = P(B) = {p.pB} → <strong>사건 A, B는 서로 독립!</strong> A가 일어나도 B의 확률이 변하지 않아요.
        </>
      ),
    });
  } else {
    out.push({
      kind: "diff",
      html: (
        <>
          ⚡ P(B|A) = {p.pBgA} ≠ P(B) = {p.pB} → <strong>사건 A가 일어나면 B의 확률이 달라져요!</strong> 이것이 조건부확률이 필요한 이유예요.
        </>
      ),
    });
  }
  const pAgBeq = p.nB > 0 && p.nAB * p.n === p.nA * p.nB;
  if (pAgBeq) {
    out.push({
      kind: "same",
      html: (
        <>
          ✓ P(A|B) = {p.pAgB} = P(A) = {p.pA} → B가 일어나도 A의 확률이 변하지 않아요.
        </>
      ),
    });
  } else {
    out.push({
      kind: "diff",
      html: (
        <>
          ⚡ P(A|B) = {p.pAgB} ≠ P(A) = {p.pA} → B 조건 하에서 A의 확률도 달라져요!
        </>
      ),
    });
  }
  if (p.nA === p.nB) {
    out.push({
      kind: "info",
      html: (
        <>
          💡 P(A|B) = P(B|A) = {p.pBgA} — n(A) = n(B)라 우연히 같아졌어요. <strong>일반적으로 P(A|B) ≠ P(B|A)</strong> 임을 기억하세요!
        </>
      ),
    });
  } else {
    out.push({
      kind: "info",
      html: (
        <>
          💡 P(A|B) = {p.pAgB}, &nbsp;P(B|A) = {p.pBgA} → <strong>조건 순서가 바뀌면 조건부확률도 달라져요!</strong>
        </>
      ),
    });
  }
  return out;
}

// ============================================================
// 시나리오 패널
// ============================================================

type Selection = { a: number | null; b: number | null };

function ScenarioPanel({ sc }: { sc: Scenario }) {
  const [sel, setSel] = useState<Selection>({ a: null, b: null });

  function pickEvent(idx: number, which: "A" | "B") {
    setSel((prev) => {
      // 같은 사건 동시선택 차단
      if (which === "A" && prev.b === idx) return prev;
      if (which === "B" && prev.a === idx) return prev;
      if (which === "A") return { ...prev, a: prev.a === idx ? null : idx };
      return { ...prev, b: prev.b === idx ? null : idx };
    });
  }
  function resetOne(which: "A" | "B") {
    setSel((prev) => ({ ...prev, [which.toLowerCase() as "a" | "b"]: null }));
  }

  // 표본공간 셀 분류 (memo)
  const cellTones = useMemo(() => {
    const setA = sel.a !== null ? new Set(sc.events[sel.a].elems) : null;
    const setB = sel.b !== null ? new Set(sc.events[sel.b].elems) : null;
    return sc.elems.map((x) => {
      const inA = setA?.has(x) ?? false;
      const inB = setB?.has(x) ?? false;
      if (inA && inB) return "ab";
      if (inA) return "a";
      if (inB) return "b";
      return "none";
    });
  }, [sc, sel]);

  const ready = sel.a !== null && sel.b !== null;
  const probs = ready ? compute(sc, sel.a!, sel.b!) : null;
  const insights = probs ? makeInsights(probs) : [];

  return (
    <div className="space-y-4">
      {/* 상황 */}
      <div className="rounded-xl border border-white/12 bg-white/[0.04] p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-violet-300">📌 시행 상황</div>
        <p className="mt-2 text-sm leading-7 text-slate-100">{sc.situation}</p>
      </div>

      {/* 사건 선택 */}
      <div className="rounded-xl border border-white/12 bg-white/[0.04] p-4">
        <div className="text-sm font-bold text-violet-300">🎯 사건 선택</div>
        <p className="mt-1 text-xs leading-6 text-slate-400">
          <strong className="text-blue-300">사건 A</strong>와 <strong className="text-orange-300">사건 B</strong>를 각각 하나씩 고르세요.
          같은 사건은 동시에 선택할 수 없어요. 선택 후 확률 변화를 관찰하세요!
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <EventColumn
            label="🔵 사건 A 선택"
            color="A"
            events={sc.events}
            picked={sel.a}
            disabledIdx={sel.b}
            onPick={(i) => pickEvent(i, "A")}
            onReset={() => resetOne("A")}
          />
          <EventColumn
            label="🟠 사건 B 선택"
            color="B"
            events={sc.events}
            picked={sel.b}
            disabledIdx={sel.a}
            onPick={(i) => pickEvent(i, "B")}
            onReset={() => resetOne("B")}
          />
        </div>
      </div>

      {/* 표본공간 */}
      <div className="rounded-xl border border-white/12 bg-white/[0.04] p-4">
        <div className="text-sm font-bold text-amber-200">📦 표본공간 S — {sc.n}개 결과</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sc.elems.map((x, i) => (
            <CellBox key={x} value={x} tone={cellTones[i]} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
          <LegendDot color="A" label="A만 속함" />
          <LegendDot color="B" label="B만 속함" />
          <LegendDot color="AB" label="A와 B 모두 (A∩B)" />
          <LegendDot color="none" label="어디에도 없음" />
        </div>
      </div>

      {/* 결과 */}
      {ready && probs ? (
        <ResultsPanel sc={sc} sel={sel} probs={probs} insights={insights} />
      ) : (
        <div className="rounded-xl border-2 border-dashed border-white/12 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
          👆 사건 A와 B를 모두 선택하면<br />확률 계산 결과와 벤다이어그램이 나타납니다.
        </div>
      )}
    </div>
  );
}

function EventColumn({
  label, color, events, picked, disabledIdx, onPick, onReset,
}: {
  label: string;
  color: "A" | "B";
  events: EventDef[];
  picked: number | null;
  disabledIdx: number | null;
  onPick: (i: number) => void;
  onReset: () => void;
}) {
  const headTone = color === "A"
    ? "border-blue-400/40 bg-blue-400/15 text-blue-300"
    : "border-orange-400/40 bg-orange-400/15 text-orange-300";
  return (
    <div>
      <div className={`rounded-md border px-3 py-1.5 text-center text-xs font-bold ${headTone}`}>{label}</div>
      <div className="mt-2 space-y-1.5">
        {events.map((ev, i) => {
          const isPicked = picked === i;
          const isDisabled = disabledIdx === i;
          const pickedCls = color === "A"
            ? "border-blue-400 bg-blue-400/25 text-blue-200"
            : "border-orange-400 bg-orange-400/25 text-orange-100";
          const cls = isDisabled
            ? "border-white/10 bg-white/[0.02] text-slate-600 cursor-not-allowed"
            : isPicked
            ? pickedCls
            : "border-white/14 bg-white/[0.05] text-slate-200 hover:border-white/30 hover:bg-white/10";
          return (
            <button
              key={i}
              type="button"
              disabled={isDisabled}
              onClick={() => onPick(i)}
              className={`w-full rounded-lg border-2 px-3 py-1.5 text-left text-xs font-semibold transition ${cls}`}
            >
              <span className="block font-bold">{ev.label}</span>
              <span className={`mt-0.5 block font-mono text-[11px] ${isPicked ? "" : "text-slate-500"}`}>{ev.desc}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 w-full rounded-md border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
      >
        ↺ {color} 선택 취소
      </button>
    </div>
  );
}

function CellBox({ value, tone }: { value: number; tone: "a" | "b" | "ab" | "none" }) {
  const cls =
    tone === "ab" ? "border-violet-400 bg-violet-400/30 text-violet-100"
    : tone === "a" ? "border-blue-400 bg-blue-400/25 text-blue-100"
    : tone === "b" ? "border-orange-400 bg-orange-400/25 text-orange-100"
    : "border-white/12 bg-white/[0.04] text-slate-600";
  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-md border-2 text-sm font-bold transition-colors ${cls}`}>
      {value}
    </div>
  );
}

function LegendDot({ color, label }: { color: "A" | "B" | "AB" | "none"; label: string }) {
  const cls =
    color === "A" ? "border-blue-400 bg-blue-400/30"
    : color === "B" ? "border-orange-400 bg-orange-400/30"
    : color === "AB" ? "border-violet-400 bg-violet-400/35"
    : "border-white/20 bg-white/5";
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-sm border-2 ${cls}`} />
      {label}
    </span>
  );
}

// ============================================================
// 결과 패널 (벤다이어그램 + 확률 카드 + 인사이트)
// ============================================================

function ResultsPanel({
  sc, sel, probs, insights,
}: { sc: Scenario; sel: Selection; probs: Probs; insights: Insight[] }) {
  const eA = sc.events[sel.a!];
  const eB = sc.events[sel.b!];

  return (
    <div className="rounded-xl border border-violet-400/35 bg-violet-400/[0.07] p-4 animate-[fadein_0.4s_ease]">
      <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-violet-300">
        📊 계산 결과
        <span className="text-[11px] font-normal text-slate-400">
          사건 A = <span className="text-blue-300">{eA.label}</span> / 사건 B = <span className="text-orange-300">{eB.label}</span>
        </span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[230px_1fr]">
        <div className="mx-auto w-full max-w-[230px]">
          <VennSVG probs={probs} />
        </div>

        <div className="space-y-1.5">
          <ProbCard label="P(A) = P(같은 색 A)" value={probs.pA} approx={probs.pAd} />
          <ProbCard label="P(B) = P(같은 색 B)" value={probs.pB} approx={probs.pBd} />
          <ProbCard label="P(A∩B)" value={probs.pAB} approx={probs.pABd} />
          <ProbCard
            label="P(B|A) = P(A∩B) / P(A)"
            value={probs.pBgA ?? "—"}
            approx={probs.pBgAd}
            highlight="violet"
          />
          <ProbCard
            label="P(A|B) = P(A∩B) / P(B)"
            value={probs.pAgB ?? "—"}
            approx={probs.pAgBd}
            highlight="amber"
          />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {insights.map((ins, i) => (
          <InsightCard key={i} insight={ins} />
        ))}
      </div>
    </div>
  );
}

function ProbCard({
  label, value, approx, highlight,
}: { label: string; value: string; approx: string; highlight?: "violet" | "amber" }) {
  const border =
    highlight === "violet" ? "border-violet-400/45 bg-violet-400/[0.12]"
    : highlight === "amber" ? "border-amber-400/40 bg-amber-400/[0.08]"
    : "border-white/12 bg-white/[0.055]";
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg border-2 px-3 py-1.5 ${border}`}>
      <span className="font-mono text-[11px] text-slate-400">{label}</span>
      <span className="whitespace-nowrap font-mono text-sm font-bold text-amber-200">
        {value}
        <span className="ml-1 font-mono text-[10px] text-slate-500">{approx}</span>
      </span>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const cls =
    insight.kind === "zero" ? "border-slate-400/30 bg-slate-400/[0.07] text-slate-200"
    : insight.kind === "same" ? "border-emerald-400/35 bg-emerald-400/[0.08] text-emerald-100"
    : insight.kind === "diff" ? "border-red-400/35 bg-red-400/[0.07] text-red-100"
    : "border-amber-400/35 bg-amber-400/[0.07] text-amber-100";
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs leading-6 ${cls}`}>
      {insight.html}
    </div>
  );
}

// ============================================================
// 벤다이어그램 SVG
// ============================================================

function VennSVG({ probs }: { probs: Probs }) {
  const W = 230, H = 170;
  const cx = W / 2, cy = H / 2 + 8;
  const maxR = 48;
  const rA = maxR * Math.sqrt(probs.nA / probs.n) + 10;
  const rB = maxR * Math.sqrt(probs.nB / probs.n) + 10;

  let dist: number;
  if (probs.nAB === 0) dist = rA + rB + 5;
  else if (probs.nAB === Math.min(probs.nA, probs.nB)) dist = Math.abs(rA - rB) + 3;
  else {
    const dMax = rA + rB;
    const dMin = Math.abs(rA - rB) + 5;
    const ov = probs.nA > 0 ? probs.nAB / probs.nA : 0;
    let d = dMax - ov * (dMax - dMin) * 1.7;
    d = Math.max(dMin, Math.min(dMax - 3, d));
    dist = d;
  }
  const xA = cx - dist / 2;
  const xB = cx + dist / 2;
  const clipId = `clipA_${Math.round(rA)}_${Math.round(rB)}_${Math.round(dist)}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-lg border border-white/10 bg-slate-950">
      {/* S 사각형 */}
      <rect x={7} y={7} width={W - 14} height={H - 14} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth={1.5} />
      <text x={W - 10} y={9} fontSize={11} textAnchor="end" dominantBaseline="hanging" fill="rgba(255,255,255,0.3)">S</text>

      {/* A 원 */}
      <circle cx={xA} cy={cy} r={rA} fill="rgba(59,130,246,0.22)" stroke="#3b82f6" strokeWidth={2} />
      {/* B 원 */}
      <circle cx={xB} cy={cy} r={rB} fill="rgba(249,115,22,0.22)" stroke="#f97316" strokeWidth={2} />

      {/* A∩B (clip 이용) */}
      {probs.nAB > 0 ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <circle cx={xA} cy={cy} r={rA} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <circle cx={xB} cy={cy} r={rB} fill="rgba(139,92,246,0.45)" stroke="#8b5cf6" strokeWidth={1.5} />
          </g>
        </>
      ) : null}

      {/* 라벨 */}
      <g textAnchor="middle" dominantBaseline="middle">
        <text x={xA - rA * 0.46} y={cy - 5} fontSize={13} fontWeight={700} fill="#93c5fd">A</text>
        <text x={xA - rA * 0.46} y={cy + 9} fontSize={10} fontFamily="ui-monospace, monospace" fill="#93c5fd">{probs.pA}</text>
        <text x={xB + rB * 0.46} y={cy - 5} fontSize={13} fontWeight={700} fill="#fdba74">B</text>
        <text x={xB + rB * 0.46} y={cy + 9} fontSize={10} fontFamily="ui-monospace, monospace" fill="#fdba74">{probs.pB}</text>
        {probs.nAB > 0 ? (
          <>
            <text x={(xA + xB) / 2} y={cy - 6} fontSize={9} fontWeight={700} fill="#ddd6fe">A∩B</text>
            <text x={(xA + xB) / 2} y={cy + 7} fontSize={9} fontFamily="ui-monospace, monospace" fill="#ddd6fe">{probs.pAB}</text>
          </>
        ) : null}
      </g>
    </svg>
  );
}

// ============================================================
// 메인
// ============================================================

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "cond_vs_prob",
    kind: "text",
    prompt: "P(B|A)와 P(B)가 다른 경우를 하나 골라 소개하고, 왜 다른지 자신의 말로 설명해 보세요.",
    placeholder: "예) 주사위에서 A = 홀수, B = 소수로 선택했을 때 P(B) = 3/6 인데 P(B|A) = ...",
  },
  {
    id: "order_matters",
    kind: "text",
    prompt: "P(A|B)와 P(B|A)가 다른 예를 찾고, 왜 조건의 순서가 중요한지 설명해 보세요.",
    placeholder: "조건 사건에 따라 표본공간이 달라지기 때문에...",
  },
  {
    id: "independence_found",
    kind: "text",
    prompt: "P(B|A) = P(B)가 되는 경우(독립사건)를 탐구 중 발견했나요? 어떤 상황이었는지 적어 보세요.",
    placeholder: "예) 상황 1에서 A = 홀수, B = 3의 배수를 골랐더니...",
  },
  {
    id: "intersection_vs_conditional",
    kind: "text",
    prompt: "P(A∩B)와 P(B|A)는 어떻게 다른가요? 수식과 함께 설명해 보세요.",
    placeholder: "P(A∩B) = n(A∩B)/n(S) 이고, P(B|A) = n(A∩B)/n(A) 이므로...",
  },
];

type TabKey = "s0" | "s1" | "s2";

export default function ConditionalProbExplorer() {
  const [tab, setTab] = useState<TabKey>("s0");
  const tabBtn = (active: boolean, color: string) =>
    active
      ? `rounded-lg ${color} px-3 py-2 text-sm font-bold text-slate-950`
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <style>{`@keyframes fadein {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 조건부확률</p>
        <h3 className="mt-2 text-2xl font-bold">🔍 조건부확률 탐험기</h3>
        <p className="mt-2 leading-7 text-slate-300">
          세 가지 시행 상황에서 사건 <b className="text-blue-300">A</b>와 <b className="text-orange-300">B</b>를 직접 선택하고,{" "}
          <b className="text-amber-200">P(A), P(B), P(A∩B), P(B|A), P(A|B)</b>를 비교하며 조건부확률의 의미를 발견합니다.
        </p>
        <div className="mt-3 inline-block rounded-md border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 font-mono text-xs font-semibold text-cyan-200">
          P(B|A) = P(A∩B) / P(A) &nbsp; (단, P(A) ≠ 0)
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SCENARIOS.map((sc) => {
          const key = `s${sc.id}` as TabKey;
          const color = sc.id === 0 ? "bg-violet-300" : sc.id === 1 ? "bg-cyan-300" : "bg-amber-300";
          return (
            <button
              key={sc.id}
              type="button"
              className={tabBtn(tab === key, color)}
              onClick={() => setTab(key)}
            >
              {sc.icon} 상황 {sc.id + 1} · {sc.name}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {/* tab 키 자체로 remount → 시나리오 전환 시 선택 상태 자동 초기화 */}
        {SCENARIOS.map((sc) => {
          const key = `s${sc.id}` as TabKey;
          if (tab !== key) return null;
          return <ScenarioPanel key={sc.id} sc={sc} />;
        })}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
