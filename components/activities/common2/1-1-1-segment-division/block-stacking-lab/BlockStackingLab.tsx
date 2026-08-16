"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "overhang_growth",
    prompt:
      "탭①에서 블록 개수 n을 늘릴 때 빠져나온 전체 길이 L_n 이 어떻게 변하는지, 그리고 맨 위 블록이 책상 모서리 밖으로 완전히 나가는 것이 어떻게 가능한지(무게중심 관점) 관찰한 것을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: n이 커질수록 L_n은 계속 커지지만 늘어나는 양은 점점 작아졌다. 아래 블록들 전체의 무게중심이 책상 모서리 안쪽에 있으면 넘어지지 않으므로, 위 블록은 책상 밖으로 완전히 나갈 수 있었다.",
  },
  {
    id: "harmonic_slow",
    prompt:
      "탭②의 L_n = 6(1 + 1/2 + ... + 1/n) 그래프에서, n을 아주 크게 해도 L_n 이 잘 늘어나지 않는 까닭과, 원하는 만큼 멀리 밀려면 왜 엄청나게 많은 블록이 필요한지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 더해지는 항 1/n 이 점점 작아져 증가가 느리다. 그래도 합은 멈추지 않고 무한히 커지지만, 조금 더 멀리 밀려면 블록 수가 폭발적으로 많아져야 한다.",
  },
  {
    id: "lever_division",
    prompt:
      "이 문제에서 ‘두 블록(또는 여러 블록) 전체의 무게중심이 아래 블록 모서리를 넘지 않아야 한다’는 조건은, 무게중심이 각 블록의 무게중심을 잇는 선분을 무게 비로 내분한다는 사실과 연결됩니다. 이 연결을 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 지렛대의 원리처럼, 두 블록 전체의 무게중심은 두 무게중심 G1, G2 를 잇는 선분을 무게의 비로 내분한 점이므로, 그 내분점이 받침(모서리) 위에 오도록 밀면 균형이 유지된다.",
  },
];

// ─── 공용 ─────────────────────────────────────────────────────
const BLOCK_LEN = 12; // l (cm)
const HALF_L = BLOCK_LEN / 2; // 6

function harmonic(n: number): number {
  let s = 0;
  for (let k = 1; k <= n; k++) s += 1 / k;
  return s;
}
function overhang(n: number): number {
  return HALF_L * harmonic(n); // L_n = (l/2)·H_n
}
function nf(v: number, d = 2): string {
  const r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  return Number.isInteger(r) ? String(r) : r.toFixed(d);
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "sim" | "graph" | "quiz";

export default function BlockStackingLab() {
  const [tab, setTab] = useState<Tab>("sim");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🧱 블록 밀기 — 얼마나 멀리?</h3>
        <p className="mt-2 leading-7 text-slate-300">
          같은 블록을 책상 위에 쌓아 밖으로 밀 때, 무너지지 않고 가장 멀리 밀 수 있는 거리{" "}
          <b className="text-cyan-200">L_n</b> 은 얼마일까요? 무게중심(내분)의 원리로 블록은
          생각보다 훨씬 멀리 나갈 수 있어요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "sim"} onClick={() => setTab("sim")}>
          ① 블록 밀기 시뮬레이션
        </TabButton>
        <TabButton active={tab === "graph"} onClick={() => setTab("graph")}>
          ② n–L_n 그래프
        </TabButton>
        <TabButton active={tab === "quiz"} onClick={() => setTab("quiz")}>
          ③ 퀴즈
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "sim" ? <SimTab /> : null}
        {tab === "graph" ? <GraphTab /> : null}
        {tab === "quiz" ? <QuizTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3 py-2 text-sm font-bold transition " +
        (active
          ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ─── 탭 ① 시뮬레이션 ─────────────────────────────────────────
const SIM = {
  K: 6, // px per cm
  CM_MIN: -30,
  LEFTPAD: 16,
  TABLE_TOP_Y: 250,
  BH: 8, // block height px
  VBH: 312,
};
function simX(cm: number): number {
  return SIM.LEFTPAD + (cm - SIM.CM_MIN) * SIM.K;
}
const SIM_VBW = SIM.LEFTPAD + (34 - SIM.CM_MIN) * SIM.K + 4; // cm 범위 [-30, 34]

function SimTab() {
  const [n, setN] = useState(6);

  const H = harmonic(n);
  const Ln = HALF_L * H;
  const edgeX = simX(0);

  // 각 블록 k(1=맨 위 … n=맨 아래)의 오른쪽 끝 R_k = 6·(H_n − H_{k-1})
  const blocks = useMemo(() => {
    const arr: { k: number; left: number; right: number }[] = [];
    let suffix = 0; // sum_{j=k}^{n} 1/j, k 감소하며 누적
    for (let k = n; k >= 1; k--) {
      suffix += 1 / k;
      const right = HALF_L * suffix; // R_k (cm)
      arr.push({ k, left: right - BLOCK_LEN, right });
    }
    return arr; // k = n..1
  }, [n]);

  const fullyOut = blocks.filter((b) => b.left > 0).length;
  const topFullyOut = fullyOut >= 1;

  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-indigo-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 슬라이더로 블록 개수 <b className="text-white">n</b> 을 바꿔 보세요. 각 블록을 아래
        블록보다 <b className="text-cyan-200">최대로</b> 밀었을 때(무너지기 직전) 모습이에요.
        위쪽 블록일수록 더 많이 나갑니다!
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg viewBox={`0 0 ${SIM_VBW} ${SIM.VBH}`} className="w-full select-none" role="img" aria-label="블록 밀기 시뮬레이션">
          {/* 책상 */}
          <rect x={simX(SIM.CM_MIN)} y={SIM.TABLE_TOP_Y} width={edgeX - simX(SIM.CM_MIN)} height={14} fill="#5b4636" />
          <rect x={simX(-26)} y={SIM.TABLE_TOP_Y + 14} width={10} height={48} fill="#4a3729" />
          <rect x={edgeX - 22} y={SIM.TABLE_TOP_Y + 14} width={10} height={48} fill="#4a3729" />
          {/* 책상 모서리 기준선 */}
          <line x1={edgeX} y1={30} x2={edgeX} y2={SIM.TABLE_TOP_Y + 14} stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeDasharray="3 3" />
          <text x={edgeX - 4} y={26} textAnchor="end" className="fill-slate-400 text-[10px]">책상 모서리</text>

          {/* 블록들 */}
          {blocks.map((b) => {
            const f = n === 1 ? 0 : (n - b.k) / (n - 1); // 0 아래 … 1 위
            const hue = Math.round(220 * (1 - f)); // 파랑(아래) → 빨강(위)
            const yTop = SIM.TABLE_TOP_Y - (n - b.k + 1) * SIM.BH;
            const out = b.left > 0;
            return (
              <rect
                key={b.k}
                x={simX(b.left)}
                y={yTop}
                width={BLOCK_LEN * SIM.K}
                height={SIM.BH - 1}
                rx={1}
                fill={`hsl(${hue}, 68%, 55%)`}
                stroke={out ? "#fde047" : "rgba(0,0,0,0.35)"}
                strokeWidth={out ? 1.5 : 0.5}
              />
            );
          })}

          {/* L_n 측정 */}
          <line x1={simX(Ln)} y1={SIM.TABLE_TOP_Y - n * SIM.BH - 4} x2={simX(Ln)} y2={SIM.TABLE_TOP_Y + 30} stroke="#34d399" strokeWidth={1} strokeDasharray="3 3" />
          <line x1={edgeX} y1={SIM.TABLE_TOP_Y + 30} x2={simX(Ln)} y2={SIM.TABLE_TOP_Y + 30} stroke="#34d399" strokeWidth={1.5} />
          <path d={`M ${edgeX} ${SIM.TABLE_TOP_Y + 30} l 5 -3 l 0 6 z`} fill="#34d399" />
          <path d={`M ${simX(Ln)} ${SIM.TABLE_TOP_Y + 30} l -5 -3 l 0 6 z`} fill="#34d399" />
          <text x={(edgeX + simX(Ln)) / 2} y={SIM.TABLE_TOP_Y + 44} textAnchor="middle" className="fill-emerald-200 font-mono text-[11px] font-bold">
            L_{"{"}n{"}"} = {nf(Ln)} cm
          </text>
        </svg>
      </div>

      {/* 슬라이더 */}
      <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">블록 개수 n</span>
          <span className="font-mono text-lg font-bold text-cyan-200">{n}개</span>
        </div>
        <input type="range" min={1} max={25} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="블록 개수 n" className="mt-1 h-2 w-full cursor-pointer accent-cyan-400" />
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 4, 10, 25].map((v) => (
            <button key={v} type="button" onClick={() => setN(v)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200 transition hover:bg-white/10">
              {v}개
            </button>
          ))}
        </div>
      </div>

      {/* 결과 */}
      <div className="mt-3 rounded-xl border-l-4 border-cyan-400 bg-cyan-400/[0.08] px-4 py-3 font-mono text-sm">
        <p className="text-slate-200">
          L_n = (l/2)(1 + 1/2 + ⋯ + 1/{n}) = 6 × {nf(H, 3)} ={" "}
          <b className="text-white">{nf(Ln)} cm</b>
        </p>
        <p className="mt-1 text-slate-300">
          = 블록 길이(12cm)의 <b className="text-cyan-200">{nf(Ln / BLOCK_LEN)}</b> 배 · 책상 밖으로
          완전히 나간 블록: <b className="text-amber-200">{fullyOut}개</b>
        </p>
        {topFullyOut ? (
          <p className="mt-2 rounded-lg border border-amber-400/45 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100">
            🎉 놀랍게도 맨 위 블록이 책상 모서리 밖으로 <b>완전히</b> 나갔어요! (블록 4개면 이미
            가능)
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-400">
            💭 블록을 조금 더 쌓으면 맨 위 블록이 책상 밖으로 완전히 나갈 수 있을까요? (힌트: L_n 이
            12를 넘으면!)
          </p>
        )}
      </div>
    </div>
  );
}

// ─── 탭 ② 그래프 ─────────────────────────────────────────────
const GR = {
  X0: 44,
  Y0: 214,
  W: 320,
  H: 180,
  NMAX: 100,
  LMAX: 32,
  VBW: 384,
  VBH: 250,
};
function grX(nv: number): number {
  return GR.X0 + (nv / GR.NMAX) * GR.W;
}
function grY(lv: number): number {
  return GR.Y0 - (lv / GR.LMAX) * GR.H;
}

// 목표 도달에 필요한 블록 수(놀라운 사실)
const MILESTONES: { label: string; blocks: string }[] = [
  { label: "12 cm (블록 1개분, 맨 위가 완전히 밖으로)", blocks: "4개" },
  { label: "24 cm (블록 2개분)", blocks: "31개" },
  { label: "36 cm (블록 3개분)", blocks: "227개" },
  { label: "60 cm (블록 5개분)", blocks: "약 12,367개" },
  { label: "120 cm (블록 10개분 = 1.2 m)", blocks: "약 2억 7천만개" },
];

function GraphTab() {
  const [n, setN] = useState(20);
  const H = harmonic(n);
  const Ln = HALF_L * H;
  const harmExpr =
    n === 1
      ? "1"
      : n === 2
        ? "1 + 1/2"
        : n === 3
          ? "1 + 1/2 + 1/3"
          : `1 + 1/2 + ⋯ + 1/${n}`;

  const path = useMemo(() => {
    const pts: string[] = [];
    for (let k = 1; k <= GR.NMAX; k++) {
      pts.push(`${grX(k).toFixed(1)} ${grY(overhang(k)).toFixed(1)}`);
    }
    return "M " + pts.join(" L ");
  }, []);

  return (
    <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 블록 개수 <b className="text-white">n</b> 에 따른 최대 거리{" "}
        <b className="text-amber-200">L_n</b> 의 그래프예요. 슬라이더로 n을 바꿔 보세요. 곡선이
        점점 <b className="text-amber-100">완만</b>해지지만, 멈추지 않고 계속 올라갑니다.
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg viewBox={`0 0 ${GR.VBW} ${GR.VBH}`} className="w-full select-none" role="img" aria-label="n에 따른 L_n 그래프">
          {/* 축 */}
          <line x1={GR.X0} y1={GR.Y0} x2={GR.X0 + GR.W} y2={GR.Y0} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
          <line x1={GR.X0} y1={GR.Y0} x2={GR.X0} y2={GR.Y0 - GR.H} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
          {/* y 눈금 (cm) */}
          {[0, 8, 16, 24, 32].map((v) => (
            <g key={v}>
              <line x1={GR.X0 - 3} y1={grY(v)} x2={GR.X0 + GR.W} y2={grY(v)} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
              <text x={GR.X0 - 6} y={grY(v) + 3} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">{v}</text>
            </g>
          ))}
          {/* x 눈금 */}
          {[0, 20, 40, 60, 80, 100].map((v) => (
            <text key={v} x={grX(v)} y={GR.Y0 + 14} textAnchor="middle" className="fill-slate-400 font-mono text-[9px]">{v}</text>
          ))}
          <text x={GR.X0 + GR.W} y={GR.Y0 + 26} textAnchor="end" className="fill-slate-400 text-[10px]">블록 수 n</text>
          <text x={GR.X0 + 4} y={GR.Y0 - GR.H - 7} className="fill-slate-400 text-[10px]">L_n (cm)</text>

          {/* 12cm(블록 1개분) 기준선 */}
          <line x1={GR.X0} y1={grY(12)} x2={GR.X0 + GR.W} y2={grY(12)} stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.6} />
          <text x={GR.X0 + GR.W - 2} y={grY(12) - 3} textAnchor="end" className="fill-amber-300/80 text-[9px]">블록 1개분(12cm)</text>

          {/* 곡선 */}
          <path d={path} fill="none" stroke="#fbbf24" strokeWidth={2.5} />

          {/* 현재 n 마커 */}
          {n <= GR.NMAX ? (
            <g>
              <line x1={grX(n)} y1={GR.Y0} x2={grX(n)} y2={grY(Ln)} stroke="#34d399" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={grX(n)} cy={grY(Ln)} r={5} fill="#34d399" stroke="#0f172a" strokeWidth={1.5} />
            </g>
          ) : null}
        </svg>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">블록 개수 n</span>
          <span className="font-mono text-lg font-bold text-amber-200">{n}개</span>
        </div>
        <input type="range" min={1} max={GR.NMAX} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="블록 개수 n" className="mt-1 h-2 w-full cursor-pointer accent-amber-400" />
      </div>

      {/* 현재 n 의 계산식 */}
      <div className="mt-3 rounded-xl border-l-4 border-amber-400 bg-amber-400/[0.08] px-4 py-3 font-mono text-sm">
        <p className="text-slate-200">
          L_n = 6({harmExpr}) = 6 × {nf(H, 3)} = <b className="text-white">{nf(Ln)} cm</b>
        </p>
        <p className="mt-1 text-slate-300">
          = 블록 길이(12cm)의 <b className="text-amber-200">{nf(Ln / BLOCK_LEN)}</b> 배
        </p>
      </div>

      {/* 놀라운 사실 */}
      <div className="mt-3 rounded-xl border border-rose-400/25 bg-rose-400/[0.06] p-3">
        <p className="text-sm font-bold text-rose-200">😮 이만큼 밀려면 블록이 몇 개 필요할까?</p>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-rose-100">
                <th className="border-b border-white/10 px-2 py-1 text-left text-xs">밀어낸 거리 L_n</th>
                <th className="border-b border-white/10 px-2 py-1 text-right text-xs">필요한 블록 수</th>
              </tr>
            </thead>
            <tbody>
              {MILESTONES.map((m) => (
                <tr key={m.label} className="border-b border-white/5 last:border-none">
                  <td className="px-2 py-1 text-slate-300">{m.label}</td>
                  <td className="px-2 py-1 text-right font-mono font-bold text-amber-200">{m.blocks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          → 조금 더 멀리 밀수록 필요한 블록 수가 <b className="text-rose-200">폭발적으로</b> 늘어나요.
          그래도 L_n 은 어떤 값에서 멈추지 않고 <b className="text-amber-200">무한히</b> 커집니다(조화급수의 발산).
        </p>
      </div>
    </div>
  );
}

// ─── 탭 ③ 퀴즈 ───────────────────────────────────────────────
type Q =
  | { kind: "input"; id: string; prompt: string; answer: number; unit?: string; hint: string }
  | { kind: "mc"; id: string; prompt: string; options: string[]; answer: number; hint: string };

const QUESTIONS: Q[] = [
  {
    kind: "input",
    id: "q1",
    prompt: "블록 길이 l = 12cm 일 때, 블록 2개로 밀 수 있는 최대 거리 L₂ 는? (단위 cm)",
    answer: 9,
    unit: "cm",
    hint: "L₂ = 6 × (1 + 1/2) = 6 × 1.5",
  },
  {
    kind: "mc",
    id: "q2",
    prompt: "맨 위 블록이 책상 모서리 밖으로 ‘완전히’ 나가려면 블록이 최소 몇 개 필요할까?",
    options: ["2개", "3개", "4개", "5개"],
    answer: 2,
    hint: "L_n 이 블록 길이 12cm 를 처음으로 넘는 n. L₄ = 6 × (25/12) = 12.5cm",
  },
  {
    kind: "mc",
    id: "q3",
    prompt: "L_n 은 다음 중 어떤 합과 관련이 있을까?",
    options: [
      "1 + 2 + 3 + ⋯ + n",
      "1 + 1/2 + 1/3 + ⋯ + 1/n (조화급수)",
      "1 + 1/2 + 1/4 + ⋯ (등비급수)",
      "1² + 2² + ⋯ + n²",
    ],
    answer: 1,
    hint: "L_n = (l/2)(1 + 1/2 + 1/3 + ⋯ + 1/n)",
  },
  {
    kind: "mc",
    id: "q4",
    prompt: "블록 수 n 을 한없이 크게 하면 L_n 은 어떻게 될까?",
    options: ["어떤 값에 가까워진다(수렴)", "한없이 커진다(발산)", "12cm 를 넘지 못한다"],
    answer: 1,
    hint: "조화급수 1 + 1/2 + 1/3 + ⋯ 은 무한히 커진다(발산).",
  },
];

function QuizTab() {
  const [ans, setAns] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  function isCorrect(q: Q): boolean {
    const a = ans[q.id];
    if (a === undefined || a === "") return false;
    if (q.kind === "input") return Number(a) === q.answer;
    return Number(a) === q.answer;
  }
  const score = QUESTIONS.filter(isCorrect).length;

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 시뮬레이션과 그래프에서 배운 내용을 확인해 볼까요? (블록 길이 l = 12cm)
      </p>

      <div className="mt-3 space-y-3">
        {QUESTIONS.map((q, i) => {
          const ok = isCorrect(q);
          return (
            <div key={q.id} className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
              <p className="text-sm font-semibold text-slate-100">
                {i + 1}. {q.prompt}
              </p>
              {q.kind === "input" ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={ans[q.id] ?? ""}
                    onChange={(e) => setAns((s) => ({ ...s, [q.id]: e.target.value.replace(/[^0-9.]/g, "") }))}
                    aria-label={q.prompt}
                    className={
                      "w-24 rounded-lg border-2 bg-slate-900 px-3 py-1.5 text-center font-mono text-white outline-none transition focus:border-cyan-300 " +
                      (!checked ? "border-white/10" : ok ? "border-emerald-400/55" : "border-rose-400/55")
                    }
                    placeholder="?"
                  />
                  <span className="text-sm text-slate-400">{q.unit}</span>
                  {checked ? <span>{ok ? "✅" : "❌"}</span> : null}
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.options.map((opt, oi) => {
                    const chosen = Number(ans[q.id]) === oi && ans[q.id] !== undefined && ans[q.id] !== "";
                    const showRight = checked && oi === q.answer;
                    const showWrong = checked && chosen && oi !== q.answer;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAns((s) => ({ ...s, [q.id]: String(oi) }))}
                        className={
                          "rounded-lg border-2 px-3 py-1 text-sm font-bold transition " +
                          (showRight
                            ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100"
                            : showWrong
                              ? "border-rose-400/60 bg-rose-400/20 text-rose-100"
                              : chosen
                                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
                                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                        }
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {checked && !ok ? (
                <p className="mt-2 text-xs text-amber-200/90">💡 {q.hint}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25"
        >
          채점하기
        </button>
        {checked ? (
          <span className="rounded-full border border-emerald-400/45 bg-emerald-400/15 px-4 py-1 font-mono text-sm font-bold text-emerald-100">
            {score} / {QUESTIONS.length} 정답
          </span>
        ) : null}
      </div>

      {checked && score === QUESTIONS.length ? (
        <p className="mt-3 rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-4 py-2 text-center text-sm font-bold text-emerald-100">
          🎉 모두 정답! 블록 밀기 속 조화급수와 무게중심(내분)의 원리를 잘 이해했어요.
        </p>
      ) : null}
    </div>
  );
}
