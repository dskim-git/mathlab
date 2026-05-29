"use client";

import { useId, useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 데이터 ──────────────────────────────────────────────
type Scenario = {
  id: string;
  name: string;
  icon: string;
  context: string;
  unit: string;
  xlabel: string;
  values: number[];
  probs: number[];
  /** 막대 hex 색(불투명) */
  color: string;
  /** 막대 fill 색(반투명, 같은 색 35% 알파 정도) */
  colorAlpha: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "store",
    name: "편의점 뽑기",
    icon: "🏪",
    context:
      "🏪 한 편의점에서 500원짜리 뽑기를 운영합니다. 뽑기 한 번에 기대할 수 있는 당첨 금액은 얼마일까요? 뽑기를 500원에 사도 이득일까요?",
    unit: "원",
    xlabel: "당첨 금액 X (원)",
    values: [0, 500, 1000, 3000, 5000],
    probs: [0.4, 0.3, 0.15, 0.1, 0.05],
    color: "#fbbf24",
    colorAlpha: "rgba(251,191,36,0.55)",
  },
  {
    id: "umbrella",
    name: "우산 판매",
    icon: "☔",
    context:
      "☔ 어느 상점의 하루 우산 판매량 X의 확률분포입니다. 날씨가 맑으면 적게, 비가 오면 많이 팔립니다. 평균 판매량과 판매량의 변동성을 알아볼까요?",
    unit: "개",
    xlabel: "하루 판매량 X (개)",
    values: [0, 1, 2, 3, 4],
    probs: [0.1, 0.2, 0.4, 0.2, 0.1],
    color: "#38bdf8",
    colorAlpha: "rgba(56,189,248,0.55)",
  },
  {
    id: "game",
    name: "게임 보상",
    icon: "🎮",
    context:
      "🎮 RPG 게임에서 몬스터를 처치할 때 얻는 포인트 X의 확률분포입니다. 평균적으로 얼마를 획득할 수 있을까요? 포인트가 들쭉날쭉한 정도는?",
    unit: "pt",
    xlabel: "획득 포인트 X",
    values: [10, 20, 50, 100, 200],
    probs: [0.35, 0.3, 0.2, 0.1, 0.05],
    color: "#a78bfa",
    colorAlpha: "rgba(167,139,250,0.55)",
  },
];

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "expectation_meaning",
    prompt:
      "기댓값 E(X)가 어떤 의미인지 자신의 말로 설명하고, 이 활동의 시나리오나 일상에서 새로운 사례 하나를 들어 보세요.",
    kind: "text",
    placeholder: "예: E(X)는 '많이 반복했을 때의 평균'. 편의점 뽑기에서 E(X)=625원이면 500원에 사도 평균적으론 이득이라는 뜻이다.",
  },
  {
    id: "variance_vs_std",
    prompt:
      "분산 V(X)와 표준편차 σ(X)의 차이는 무엇이고, 둘 중 표준편차가 더 직관적으로 쓰이는 까닭은 무엇인가요?",
    kind: "text",
    placeholder: "예: V(X)는 편차의 제곱 평균이라 단위가 원²이지만, σ는 √V라 원래 단위로 돌아와 ‘평균에서 ±얼마 정도 흔들리는가’를 바로 읽을 수 있다.",
  },
  {
    id: "axb_b_no_effect",
    prompt:
      "aX+b 변환에서 b를 아무리 크게 바꿔도 분산이 변하지 않는 이유를 슬라이더 실험으로 관찰한 결과와 함께 설명해 보세요.",
    kind: "text",
    placeholder: "예: b는 모든 값을 같은 크기로 평행이동시키므로 평균은 b만큼 이동하지만 값 사이의 간격(편차)이 그대로라 분산이 안 바뀐다.",
  },
];

// ─── 수학 ────────────────────────────────────────────────
function calcStats(values: number[], probs: number[]) {
  const E = values.reduce((s, x, i) => s + x * probs[i], 0);
  const E2 = values.reduce((s, x, i) => s + x * x * probs[i], 0);
  const V = E2 - E * E;
  const S = Math.sqrt(V < 1e-12 ? 0 : V);
  return { E, E2, V, S };
}

function r3(x: number) {
  return Math.round(x * 1000) / 1000;
}
function fmt(x: number) {
  const v = r3(x);
  if (Number.isInteger(v)) return v.toLocaleString("ko-KR");
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 3 });
}

// ─── 메인 ─────────────────────────────────────────────────
export default function RvMeanVarLab() {
  const [scIdx, setScIdx] = useState(0);
  const [tab, setTab] = useState<"result" | "steps">("result");
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  // 시나리오 바뀔 때 통계 카드가 살짝 강조되는 펄스용 key.
  const [popKey, setPopKey] = useState(0);

  const sc = SCENARIOS[scIdx];
  const stats = useMemo(() => calcStats(sc.values, sc.probs), [sc]);

  function selectScenario(i: number) {
    if (i === scIdx) return;
    setScIdx(i);
    setPopKey((k) => k + 1);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">📊 이산확률변수의 기댓값 · 분산 · 표준편차</h3>
        <p className="mt-2 leading-7 text-slate-300">
          실생활 시나리오를 골라 확률분포 X의 <b className="text-amber-300">E(X)</b> ·{" "}
          <b className="text-amber-300">V(X)</b> · <b className="text-amber-300">σ(X)</b>를 계산해 보고,
          <b className="text-violet-300"> aX + b 변환</b>이 평균과 분산을 어떻게 바꾸는지 슬라이더로 직접 실험합니다.
        </p>
      </div>

      {/* ① 시나리오 선택 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">🌍 실생활 시나리오 선택</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {SCENARIOS.map((s, i) => {
            const active = i === scIdx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => selectScenario(i)}
                className={
                  active
                    ? "rounded-2xl border-2 border-amber-400 bg-amber-400/15 px-3 py-3 text-center shadow-[0_0_18px_rgba(251,191,36,0.22)] transition"
                    : "rounded-2xl border-2 border-white/10 bg-white/[0.04] px-3 py-3 text-center transition hover:-translate-y-0.5 hover:border-amber-400/35 hover:bg-amber-400/5"
                }
              >
                <p className="text-3xl">{s.icon}</p>
                <p className="mt-1 text-sm font-bold text-amber-200">{s.name}</p>
                <p className="text-xs text-slate-400">{i === 0 ? "당첨 금액의 기댓값" : i === 1 ? "날씨별 하루 판매량" : "몬스터 처치 포인트"}</p>
              </button>
            );
          })}
        </div>

        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300">
          {sc.context}
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-white/10 bg-amber-400/10 px-2 py-2 text-amber-200">X</th>
                {sc.values.map((v) => (
                  <th key={v} className="border border-white/10 bg-amber-400/10 px-2 py-2 text-amber-200">
                    {v.toLocaleString()}
                  </th>
                ))}
                <th className="border border-white/10 bg-amber-400/10 px-2 py-2 text-amber-200">합계</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-white/10 bg-white/[0.04] px-2 py-2 text-center font-mono font-bold text-amber-200">P</td>
                {sc.probs.map((p, i) => (
                  <td key={i} className="border border-white/10 bg-white/[0.04] px-2 py-2 text-center font-mono text-slate-200">
                    {p}
                  </td>
                ))}
                <td className="border border-white/10 bg-indigo-400/15 px-2 py-2 text-center font-mono font-bold text-indigo-200">1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ② 분포 차트 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">📈 확률분포 그래프</p>
        <p className="mt-1 text-xs text-slate-500">노란 점선 = E(X) (평균) 위치</p>
        <div className="mt-3">
          <DistChartSVG sc={sc} mean={stats.E} />
        </div>
      </div>

      {/* ③ 통계량 카드 + 탭 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">🔢 기댓값 · 분산 · 표준편차</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("result")}
            className={tab === "result"
              ? "rounded-lg border border-amber-400/45 bg-amber-400/15 px-3 py-1.5 text-sm font-bold text-amber-200"
              : "rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-bold text-slate-300 hover:bg-white/10"}
          >
            📐 결과 보기
          </button>
          <button
            type="button"
            onClick={() => setTab("steps")}
            className={tab === "steps"
              ? "rounded-lg border border-amber-400/45 bg-amber-400/15 px-3 py-1.5 text-sm font-bold text-amber-200"
              : "rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-bold text-slate-300 hover:bg-white/10"}
          >
            🪜 계산 과정
          </button>
        </div>

        <div className={tab === "result" ? "mt-3" : "mt-3 hidden"}>
          <div className="grid grid-cols-3 gap-2">
            <StatCard popKey={popKey} lbl="기댓값 E(X)" val={`${fmt(stats.E)} ${sc.unit}`} fml="Σ xᵢ·pᵢ" />
            <StatCard popKey={popKey} lbl="분산 V(X)" val={fmt(stats.V)} fml="E(X²) − {E(X)}²" />
            <StatCard popKey={popKey} lbl="표준편차 σ(X)" val={`${fmt(stats.S)} ${sc.unit}`} fml="√V(X)" />
          </div>
        </div>

        <div className={tab === "steps" ? "mt-3" : "mt-3 hidden"}>
          <CalcSteps sc={sc} />
        </div>
      </div>

      {/* ④ aX+b 변환 */}
      <div className="mt-4 rounded-2xl border border-violet-400/30 bg-violet-400/[0.04] p-5">
        <p className="text-base font-bold text-violet-300">🔄 aX + b 변환 실험실</p>
        <p className="mt-1 text-sm text-slate-400">슬라이더로 a, b를 바꿔 평균·분산·표준편차가 어떻게 달라지는지 확인하세요.</p>

        <div className="mt-3 space-y-3">
          <TransformSlider label="a" value={a} min={-4} max={5} step={0.5} onChange={setA} />
          <TransformSlider label="b" value={b} min={-20} max={30} step={1} onChange={setB} />
        </div>

        <div className="mt-4 grid items-stretch gap-3 sm:grid-cols-[1fr_44px_1fr]">
          <div className="rounded-xl border border-indigo-400/30 bg-indigo-400/10 px-4 py-3 text-center">
            <p className="text-xs text-slate-400">X 의 통계량</p>
            <p className="mt-1 font-mono text-sm leading-7 text-indigo-200">E(X) = {fmt(stats.E)}</p>
            <p className="font-mono text-sm leading-7 text-indigo-200">V(X) = {fmt(stats.V)}</p>
            <p className="font-mono text-sm leading-7 text-indigo-200">σ(X) = {fmt(stats.S)}</p>
          </div>
          <div className="flex items-center justify-center text-2xl font-black text-amber-300">⟹</div>
          <div className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-3 text-center">
            <p className="text-xs text-slate-400">{a}X + {b} 의 통계량</p>
            <p className="mt-1 font-mono text-sm leading-7 text-violet-200">
              E = {a < 0 ? `(${a})` : a}·{fmt(stats.E)} + {b} = <b>{fmt(a * stats.E + b)}</b>
            </p>
            <p className="font-mono text-sm leading-7 text-violet-200">
              V = {a < 0 ? `(${a})` : a}²·{fmt(stats.V)} = <b>{fmt(a * a * stats.V)}</b>
            </p>
            <p className="font-mono text-sm leading-7 text-violet-200">
              σ = |{a}|·{fmt(stats.S)} = <b>{fmt(Math.abs(a) * stats.S)}</b>
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <FormulaChip>E(aX+b) = a·E(X) + b</FormulaChip>
          <FormulaChip>V(aX+b) = a²·V(X)</FormulaChip>
          <FormulaChip>σ(aX+b) = |a|·σ(X)</FormulaChip>
        </div>

        <div className="mt-4">
          <TransformChartSVG sc={sc} a={a} b={b} />
          <p className="mt-2 text-center text-[11px] text-slate-500">
            막대 색·높이(확률)는 같지만 가로 위치(X 값)가 {a < 0 || a > 1 ? "스케일링+" : ""}
            {b !== 0 ? "평행이동 " : ""}됩니다.
          </p>
        </div>
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 통계 카드 ────────────────────────────────────────────
function StatCard({
  popKey, lbl, val, fml,
}: { popKey: number; lbl: string; val: string; fml: string }) {
  return (
    <div
      key={popKey}
      className="animate-[pulseR_0.45s_ease] rounded-xl border border-amber-400/45 bg-amber-400/12 px-3 py-3 text-center"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{lbl}</p>
      <p className="mt-1 break-all font-mono text-xl font-black text-amber-300">{val}</p>
      <p className="mt-1 text-[10px] text-slate-500">{fml}</p>
    </div>
  );
}

// ─── 계산 과정 ────────────────────────────────────────────
function CalcSteps({ sc }: { sc: Scenario }) {
  const { E, E2, V, S } = calcStats(sc.values, sc.probs);
  const pe = sc.values.map((x, i) => `${x.toLocaleString()}×${sc.probs[i]}`).join(" + ");
  const pe2 = sc.values.map((x, i) => `${(x * x).toLocaleString()}×${sc.probs[i]}`).join(" + ");

  const items = [
    { n: "① E(X)", t: `E(X) = Σ xᵢpᵢ = ${pe}` },
    { n: "   =", t: `= ${fmt(E)} (${sc.unit})` },
    { n: "② E(X²)", t: `E(X²) = Σ xᵢ²pᵢ = ${pe2}` },
    { n: "   =", t: `= ${fmt(E2)}` },
    { n: "③ V(X)", t: `V(X) = E(X²) − {E(X)}² = ${fmt(E2)} − (${fmt(E)})² = ${fmt(V)}` },
    { n: "④ σ(X)", t: `σ(X) = √V(X) = √${fmt(V)} ≈ ${fmt(S)} (${sc.unit})` },
  ];

  return (
    <div className="space-y-1.5">
      {items.map((s, i) => (
        <div
          key={i}
          className="animate-[fadeIn_0.32s_ease_both] rounded-r-lg border-l-4 border-indigo-400/55 bg-white/[0.03] px-3 py-2 text-sm font-mono text-slate-300"
        >
          <span className="mr-2 inline-block min-w-[56px] rounded-md bg-indigo-400/30 px-1.5 py-0.5 text-center text-xs font-bold text-indigo-200">
            {s.n}
          </span>
          <span>{s.t}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 슬라이더 ─────────────────────────────────────────────
function TransformSlider({
  label, value, min, max, step, onChange,
}: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor={id} className="min-w-[60px] font-mono text-sm font-extrabold text-slate-200">
        {label} =
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 min-w-[180px] flex-1 cursor-pointer accent-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
      />
      <span
        key={value}
        className="min-w-[58px] animate-[pulseR_0.35s_ease] rounded-lg border border-violet-400/55 bg-gradient-to-r from-indigo-500/30 to-violet-500/30 px-3 py-1 text-center font-mono text-lg font-black text-white"
      >
        {value}
      </span>
    </div>
  );
}

function FormulaChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-center font-mono text-xs text-amber-200">
      {children}
    </div>
  );
}

// ─── 확률분포 SVG 차트 (E(X) 수직선 포함) ───────────────────
function DistChartSVG({ sc, mean }: { sc: Scenario; mean: number }) {
  const W = 700, H = 240, PL = 50, PR = 16, PT = 28, PB = 56;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const maxP = Math.max(0.5, Math.max(...sc.probs) * 1.18);
  const n = sc.values.length;
  const cellW = innerW / n;
  const barW = cellW * 0.62;

  // E(X)는 가로축 X-값 기준. 막대 중앙은 i번째 인덱스에 위치한다고 가정해 보간.
  const xValues = sc.values;
  function xToPixel(xVal: number): number | null {
    if (xVal <= xValues[0]) return PL + cellW / 2;
    if (xVal >= xValues[n - 1]) return PL + cellW * (n - 1) + cellW / 2;
    for (let i = 0; i < n - 1; i++) {
      if (xVal >= xValues[i] && xVal <= xValues[i + 1]) {
        const t = (xVal - xValues[i]) / (xValues[i + 1] - xValues[i]);
        return PL + cellW * (i + t) + cellW / 2;
      }
    }
    return null;
  }
  const meanX = xToPixel(mean);

  const uid = useId().replace(/[:]/g, "");
  const idGrad = `g_${uid}`;

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="확률분포 막대 차트">
        <defs>
          <linearGradient id={idGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={sc.color} stopOpacity={0.95} />
            <stop offset="1" stopColor={sc.color} stopOpacity={0.45} />
          </linearGradient>
        </defs>

        {/* y 그리드 */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].filter((v) => v <= maxP).map((p) => {
          const y = PT + innerH - (p / maxP) * innerH;
          return (
            <g key={p}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.06)" />
              <text x={PL - 6} y={y + 3} textAnchor="end" fontSize={10} fill="rgba(148,163,184,0.7)">
                {p.toFixed(p < 1 ? 1 : 0)}
              </text>
            </g>
          );
        })}

        {/* 막대 */}
        {sc.values.map((v, i) => {
          const p = sc.probs[i];
          const h = (p / maxP) * innerH;
          const cx = PL + i * cellW + cellW / 2;
          const x = cx - barW / 2;
          const y = PT + innerH - h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} rx={5} fill={`url(#${idGrad})`} stroke={sc.color} strokeWidth={1.5} />
              <text x={cx} y={y - 5} textAnchor="middle" fontSize={11} fontWeight={700} fill={sc.color}>
                {p}
              </text>
              <text x={cx} y={PT + innerH + 18} textAnchor="middle" fontSize={11} fill="rgba(203,213,225,0.85)">
                {v.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* E(X) 수직선 */}
        {meanX !== null ? (
          <g>
            <line x1={meanX} y1={PT - 2} x2={meanX} y2={PT + innerH} stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="6 4" />
            <rect x={meanX - 50} y={PT - 16} width={100} height={16} rx={3} fill="#0f2027" />
            <text x={meanX} y={PT - 4} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fbbf24">
              E(X) = {fmt(mean)} {sc.unit}
            </text>
          </g>
        ) : null}

        {/* 축 라벨 */}
        <text x={PL + innerW / 2} y={H - 16} textAnchor="middle" fontSize={11.5} fill="rgba(148,163,184,0.85)">
          {sc.xlabel}
        </text>
        <text x={14} y={PT + innerH / 2} textAnchor="middle" fontSize={11} fill="rgba(148,163,184,0.85)" transform={`rotate(-90 14 ${PT + innerH / 2})`}>
          확률 P
        </text>
      </svg>
    </div>
  );
}

// ─── aX+b 변환 차트 ──────────────────────────────────────
// 같은 확률 분포지만 X 값(라벨)이 변환된 모습을 비교 — 위 줄=X, 아래 줄=aX+b.
function TransformChartSVG({ sc, a, b }: { sc: Scenario; a: number; b: number }) {
  const W = 700, H = 200, PL = 50, PR = 16, PT = 20, PB = 56;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const maxP = Math.max(0.5, Math.max(...sc.probs) * 1.18);
  const n = sc.values.length;
  const cellW = innerW / n;
  const barW = cellW * 0.32;
  const newValues = sc.values.map((x) => r3(a * x + b));

  const uid = useId().replace(/[:]/g, "");
  const idOrig = `tfo_${uid}`;
  const idTrsf = `tft_${uid}`;

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="aX+b 변환 비교 차트">
        <defs>
          <linearGradient id={idOrig} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={sc.color} stopOpacity={0.85} />
            <stop offset="1" stopColor={sc.color} stopOpacity={0.35} />
          </linearGradient>
          <linearGradient id={idTrsf} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f472b6" stopOpacity={0.85} />
            <stop offset="1" stopColor="#f472b6" stopOpacity={0.35} />
          </linearGradient>
        </defs>

        {[0, 0.2, 0.4, 0.6, 0.8, 1].filter((v) => v <= maxP).map((p) => {
          const y = PT + innerH - (p / maxP) * innerH;
          return (
            <g key={p}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.05)" />
              <text x={PL - 6} y={y + 3} textAnchor="end" fontSize={10} fill="rgba(148,163,184,0.7)">
                {p.toFixed(p < 1 ? 1 : 0)}
              </text>
            </g>
          );
        })}

        {sc.values.map((v, i) => {
          const p = sc.probs[i];
          const h = (p / maxP) * innerH;
          const cx = PL + i * cellW + cellW / 2;
          const xOrig = cx - barW - 2;
          const xTrsf = cx + 2;
          const y = PT + innerH - h;
          return (
            <g key={i}>
              <rect x={xOrig} y={y} width={barW} height={h} rx={4} fill={`url(#${idOrig})`} stroke={sc.color} strokeWidth={1.3} />
              <rect x={xTrsf} y={y} width={barW} height={h} rx={4} fill={`url(#${idTrsf})`} stroke="#f472b6" strokeWidth={1.3} />
              <text x={cx} y={PT + innerH + 18} textAnchor="middle" fontSize={10.5} fill="rgba(203,213,225,0.85)">
                {v.toLocaleString()}
              </text>
              <text x={cx} y={PT + innerH + 32} textAnchor="middle" fontSize={10.5} fill="rgba(249,168,212,0.95)">
                → {newValues[i].toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* 범례 */}
        <g transform={`translate(${PL + 4}, ${H - 12})`}>
          <rect x={0} y={-8} width={10} height={10} fill={sc.color} />
          <text x={14} y={1} fontSize={10} fill="rgba(203,213,225,0.9)">X 원본</text>
          <rect x={62} y={-8} width={10} height={10} fill="#f472b6" />
          <text x={76} y={1} fontSize={10} fill="rgba(203,213,225,0.9)">aX + b 변환</text>
        </g>
      </svg>
    </div>
  );
}

