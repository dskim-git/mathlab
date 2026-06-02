"use client";

import { useEffect, useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "recurrence_meaning",
    prompt:
      "조립제법의 핵심 점화식 b_{k−1} = a_k + α · b_k 이 ‘계수 비교’ 과정에서 왜 그렇게 나오는지, 그 의미를 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: (x−α)Q(x)에서 x^k 의 계수를 모으면 ‘현재 b_{k−1} − α·b_k’ 가 되는데, 이를 P(x) 의 a_k 와 비교하면 b_{k−1} = a_k + α·b_k 가 된다. 즉 ‘앞 b 에 α를 곱해서 다음 a 에 더한다.’",
  },
  {
    id: "table_meaning",
    prompt:
      "조립제법 표의 2행(α × 이전 b)과 3행(1행 + 2행)이 점화식의 어떤 단계와 대응되는지, 그리고 마지막 칸이 왜 나머지 R 인지 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 2행은 α·b_k 를 미리 계산해 두는 칸, 3행은 a_k + α·b_k = b_{k−1} 을 적는 칸이다. 마지막 칸은 R = a_0 + α·b_0 이므로 나머지가 된다.",
  },
];

// ─── 유틸 ───────────────────────────────────────────────────
const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
function sup(n: number) {
  return String(n)
    .split("")
    .map((c) => SUP[Number(c)] ?? c)
    .join("");
}
function fmtNum(n: number | null | undefined) {
  if (n === null || n === undefined) return "";
  return n < 0 ? `−${Math.abs(n)}` : String(n);
}

// 다항식 문자열 (계수 배열, 내림차순 가정)
function polyStr(coeffs: number[]): string {
  const n = coeffs.length;
  const parts: string[] = [];
  coeffs.forEach((c, i) => {
    if (c === 0) return;
    const exp = n - 1 - i;
    const abs = Math.abs(c);
    const sign = c < 0 ? "−" : parts.length > 0 ? "+" : "";
    const num = abs === 1 && exp > 0 ? "" : String(abs);
    const v = exp === 0 ? "" : exp === 1 ? "x" : `x${sup(exp)}`;
    parts.push(`${sign}${num}${v}`);
  });
  return parts.join(" ") || "0";
}

// 조립제법 표 열 개수에 따른 grid-cols 클래스 분기.
// (PROBS / Step 5 예시 모두 n ∈ {3,4,5})
function synthColsClass(n: number, w: 72 | 80): string {
  if (w === 72) {
    if (n === 3) return "grid grid-cols-[repeat(3,72px)]";
    if (n === 4) return "grid grid-cols-[repeat(4,72px)]";
    if (n === 5) return "grid grid-cols-[repeat(5,72px)]";
  }
  if (w === 80) {
    if (n === 3) return "grid grid-cols-[repeat(3,80px)]";
    if (n === 4) return "grid grid-cols-[repeat(4,80px)]";
    if (n === 5) return "grid grid-cols-[repeat(5,80px)]";
  }
  return "grid";
}

// 점화식 적용: r3[0] = coeffs[0], r2[i] = α·r3[i−1], r3[i] = coeffs[i] + r2[i]
function computeSynth(coeffs: number[], alpha: number) {
  const r2: (number | null)[] = new Array(coeffs.length).fill(null);
  const r3: number[] = [coeffs[0]];
  for (let i = 1; i < coeffs.length; i++) {
    const v2 = alpha * r3[i - 1];
    r2[i] = v2;
    r3.push(coeffs[i] + v2);
  }
  return { r2, r3 };
}

// ─── 메인 ───────────────────────────────────────────────────
type Tab = "theory" | "practice";

export default function SyntheticDivPrinciple() {
  const [tab, setTab] = useState<Tab>("theory");
  const [solved, setSolved] = useState<Set<number>>(new Set());

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* 헤더 */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">🔢 조립제법 원리 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-cyan-200">계수 비교법</b>으로 조립제법 공식이 어떻게 만들어지는지
          5 단계로 따라가며 확인하고, 직접 표를 완성해 보세요.
        </p>
      </div>

      {/* 진행 + 탭 */}
      <div className="mt-5 flex items-center gap-3">
        <ProgressBar done={solved.size} total={5} />
        <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-4 py-1 font-mono text-sm font-bold text-cyan-100">
          연습 {solved.size} / 5
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <TabBtn active={tab === "theory"} onClick={() => setTab("theory")}>
          📖 원리 이해
        </TabBtn>
        <TabBtn active={tab === "practice"} onClick={() => setTab("practice")}>
          ✏️ 조립제법 연습
        </TabBtn>
      </div>

      <div className="mt-4">
        {tab === "theory" ? (
          <TheorySection />
        ) : (
          <PracticeSection solved={solved} onSolve={(i) => {
            setSolved((s) => {
              const n = new Set(s);
              n.add(i);
              return n;
            });
          }} />
        )}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const ratio = total === 0 ? 0 : Math.min(1, done / total);
  return (
    <svg
      viewBox="0 0 100 4"
      preserveAspectRatio="none"
      className="h-2 flex-1"
      role="img"
      aria-label={`진행률 ${Math.round(ratio * 100)}%`}
    >
      <defs>
        <linearGradient id="sdpProgGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="0" y="0" width={ratio * 100} height="4" rx="2" fill="url(#sdpProgGrad)" />
    </svg>
  );
}

function TabBtn({
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
        "rounded-xl border-2 px-5 py-2 text-sm font-bold transition " +
        (active
          ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ─── Theory Section ────────────────────────────────────────
function TheorySection() {
  const [step, setStep] = useState(0);
  const totalSteps = 5;
  return (
    <div className="space-y-4">
      {/* Step 네비게이션 */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          단계
        </span>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition " +
                (i < step
                  ? "border-cyan-400/55 bg-cyan-400/15 text-cyan-200"
                  : i === step
                  ? "scale-110 border-cyan-300 bg-cyan-400/25 text-cyan-50 shadow-lg shadow-cyan-400/30"
                  : "border-white/15 bg-white/5 text-slate-400 hover:bg-white/10")
              }
              aria-label={`Step ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ◀ 이전
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
            disabled={step === totalSteps - 1}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            다음 ▶
          </button>
        </div>
      </div>

      {/* Step 본문 */}
      <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/[0.04] p-4">
        {step === 0 ? <Step1 /> : null}
        {step === 1 ? <Step2 /> : null}
        {step === 2 ? <Step3 /> : null}
        {step === 3 ? <Step4 /> : null}
        {step === 4 ? <Step5 /> : null}
      </div>
    </div>
  );
}

function StepHeader({ idx, title }: { idx: number; title: string }) {
  return (
    <p className="mb-3 text-sm font-bold uppercase tracking-wider text-cyan-300">
      📌 Step {idx} · {title}
    </p>
  );
}

function MathBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-2 overflow-x-auto rounded-xl border border-sky-400/30 bg-sky-400/[0.05] px-4 py-3 text-center font-mono text-base font-bold text-sky-100">
      {children}
    </div>
  );
}

function Step1() {
  return (
    <div>
      <StepHeader idx={1} title="나눗셈의 기본 식" />
      <p className="text-sm leading-7 text-slate-300">
        차수가 <b className="text-amber-200">n</b> 인 다항식 P(x) 를 일차식{" "}
        <b className="text-rose-200">(x − α)</b> 로 나눌 때, 몫 Q(x) 의 차수는{" "}
        <b className="text-emerald-200">n−1</b> 이고 나머지 R 은 상수입니다.
      </p>
      <MathBlock>P(x) = (x − α) · Q(x) + R</MathBlock>
      <ul className="ml-4 mt-2 list-disc space-y-1 font-mono text-sm text-slate-300">
        <li>P(x) = aₙxⁿ + aₙ₋₁xⁿ⁻¹ + ⋯ + a₁x + a₀</li>
        <li>Q(x) = bₙ₋₁xⁿ⁻¹ + bₙ₋₂xⁿ⁻² + ⋯ + b₁x + b₀</li>
        <li>R : 나머지(상수)</li>
      </ul>
      <p className="mt-3 text-xs text-slate-400">
        💡 우리의 목표: 주어진 <b className="text-amber-200">a 계수</b>로부터{" "}
        <b className="text-emerald-200">b 계수와 R</b> 을 효율적으로 계산하는 방법을 찾는 것!
      </p>
    </div>
  );
}

function Step2() {
  return (
    <div>
      <StepHeader idx={2} title="우변을 전개" />
      <p className="text-sm leading-7 text-slate-300">
        Q(x) = bₙ₋₁xⁿ⁻¹ + bₙ₋₂xⁿ⁻² + ⋯ + b₁x + b₀ 로 놓고 (x − α)Q(x) 를 전개하면:
      </p>
      <MathBlock>
        (x − α)Q(x) = bₙ₋₁xⁿ + (bₙ₋₂ − α·bₙ₋₁)xⁿ⁻¹ + (bₙ₋₃ − α·bₙ₋₂)xⁿ⁻² + ⋯ + (b₀ − α·b₁)x − α·b₀
      </MathBlock>
      <p className="mt-2 text-sm leading-7 text-slate-300">
        여기에 나머지 R 을 더하면 다음과 같이 정리됩니다:
      </p>
      <MathBlock>
        (x − α)Q(x) + R = bₙ₋₁xⁿ + (bₙ₋₂ − α·bₙ₋₁)xⁿ⁻¹ + ⋯ + (b₀ − α·b₁)x + (R − α·b₀)
      </MathBlock>
      <p className="mt-2 text-xs text-slate-400">
        🔑 핵심: 각 차수의 계수는 <b className="text-emerald-200">현재 b</b> 와{" "}
        <b className="text-sky-200">α × 이전 b</b> 의 조합으로 표현됩니다.
      </p>
    </div>
  );
}

function Step3() {
  const rows: { deg: string; aSide: string; rhs: string; concl: string }[] = [
    { deg: "xⁿ", aSide: "aₙ", rhs: "bₙ₋₁", concl: "bₙ₋₁ = aₙ" },
    { deg: "xⁿ⁻¹", aSide: "aₙ₋₁", rhs: "bₙ₋₂ − α·bₙ₋₁", concl: "bₙ₋₂ = aₙ₋₁ + α·bₙ₋₁" },
    { deg: "xⁿ⁻²", aSide: "aₙ₋₂", rhs: "bₙ₋₃ − α·bₙ₋₂", concl: "bₙ₋₃ = aₙ₋₂ + α·bₙ₋₂" },
    { deg: "⋮", aSide: "⋮", rhs: "⋮", concl: "⋮" },
    { deg: "x", aSide: "a₁", rhs: "b₀ − α·b₁", concl: "b₀ = a₁ + α·b₁" },
    { deg: "1 (상수)", aSide: "a₀", rhs: "R − α·b₀", concl: "R = a₀ + α·b₀" },
  ];
  return (
    <div>
      <StepHeader idx={3} title="계수 비교" />
      <p className="text-sm leading-7 text-slate-300">
        P(x) = (x − α)Q(x) + R 의 양변에서 같은 차수의 계수를 비교하면:
      </p>
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-cyan-300">
              {["차수", "P(x) 계수", "우변 계수", "결론"].map((h) => (
                <th key={h} scope="col" className="border-b border-white/10 px-3 py-2 text-left font-mono text-xs font-bold uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isLast = i === rows.length - 1;
              return (
                <tr key={i} className="border-b border-white/5 last:border-none">
                  <td className="px-3 py-2 font-mono text-slate-300">{r.deg}</td>
                  <td className="px-3 py-2 font-mono font-bold text-amber-300">{r.aSide}</td>
                  <td className="px-3 py-2 font-mono text-slate-300">{r.rhs}</td>
                  <td
                    className={
                      "px-3 py-2 font-mono font-bold " +
                      (isLast ? "text-rose-300" : "text-emerald-300")
                    }
                  >
                    {r.concl}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Step4() {
  return (
    <div>
      <StepHeader idx={4} title="점화식 정리" />
      <p className="text-sm leading-7 text-slate-300">
        결론을 점화식 형태로 정리하면 모든 b<sub>k</sub> 와 R 을 단계적으로 계산할 수 있습니다:
      </p>
      <div className="mt-3 space-y-2.5">
        {[
          {
            num: "①",
            formula: "bₙ₋₁ = aₙ",
            text: "맨 앞 계수는 그대로 내려씁니다.",
            tone: "emerald" as const,
          },
          {
            num: "②",
            formula: "bₖ₋₁ = aₖ + α · bₖ   (k = n−1, n−2, …, 1)",
            text: "앞의 b 에 α 를 곱해서 다음 a 계수에 더합니다.",
            tone: "cyan" as const,
          },
          {
            num: "③",
            formula: "R = a₀ + α · b₀",
            text: "마지막으로 나머지 R 을 구합니다.",
            tone: "rose" as const,
          },
        ].map((it) => (
          <div
            key={it.num}
            className={
              "flex items-start gap-3 rounded-2xl border p-3 " +
              (it.tone === "emerald"
                ? "border-emerald-400/40 bg-emerald-400/[0.06]"
                : it.tone === "cyan"
                ? "border-cyan-400/40 bg-cyan-400/[0.06]"
                : "border-rose-400/40 bg-rose-400/[0.06]")
            }
          >
            <span
              className={
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold " +
                (it.tone === "emerald"
                  ? "bg-emerald-400/30 text-emerald-100"
                  : it.tone === "cyan"
                  ? "bg-cyan-400/30 text-cyan-100"
                  : "bg-rose-400/30 text-rose-100")
              }
            >
              {it.num}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={
                  "font-mono text-sm font-bold " +
                  (it.tone === "emerald"
                    ? "text-emerald-100"
                    : it.tone === "cyan"
                    ? "text-cyan-100"
                    : "text-rose-100")
                }
              >
                {it.formula}
              </p>
              <p className="mt-0.5 text-xs text-slate-300">{it.text}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        💡 이 계산을 표로 정리한 것이 <b className="text-cyan-200">조립제법 표</b> 입니다 — 다음
        단계에서 실제 예시를 확인해 보세요.
      </p>
    </div>
  );
}

// Step 5 — 애니메이션 조립제법 표
function Step5() {
  const EX_COEFFS = [3, -2, 1, -4];
  const EX_ALPHA = 2;
  const { r2, r3 } = useMemo(() => computeSynth(EX_COEFFS, EX_ALPHA), []);
  // 0: 1행만, 1: b[0], 2: r2[1], 3: b[1], 4: r2[2], 5: b[2], 6: r2[3], 7: b[3]=R
  const [anim, setAnim] = useState(0);
  const maxAnim = 7;

  const ANIM_MSGS = [
    "① α = 2, 계수 [3, −2, 1, −4] 를 1행에 씁니다.",
    "② b₂ = a₃ = 3 (맨 앞 계수 그대로 내려씁니다)",
    "③ 2 × b₂ = 2 × 3 = 6 → 2행에 기록",
    "④ b₁ = a₂ + 6 = −2 + 6 = 4 → 3행에 기록",
    "⑤ 2 × b₁ = 2 × 4 = 8 → 2행에 기록",
    "⑥ b₀ = a₁ + 8 = 1 + 8 = 9 → 3행에 기록",
    "⑦ 2 × b₀ = 2 × 9 = 18 → 2행에 기록",
    "⑧ R = a₀ + 18 = −4 + 18 = 14 → 나머지!  ✅ 몫: 3x² + 4x + 9,  나머지: 14",
  ];

  // 셀별 노출 조건
  // r3 셀: r3[0] @ anim≥1, r3[1] @ anim≥3, r3[2] @ anim≥5, r3[3] @ anim≥7
  // r2 셀: r2[1] @ anim≥2, r2[2] @ anim≥4, r2[3] @ anim≥6
  const showR3 = (i: number) => anim >= 1 + i * 2;
  const showR2 = (i: number) => anim >= 2 + (i - 1) * 2;

  return (
    <div>
      <StepHeader idx={5} title="조립제법 표 (애니메이션)" />
      <p className="text-sm leading-7 text-slate-300">
        예시: <b className="text-amber-200">3x³ − 2x² + x − 4</b> 를{" "}
        <b className="text-rose-200">x − 2</b> 로 나눌 때 (α = 2). 아래 버튼을 눌러 표가 채워지는
        과정을 단계별로 확인하세요.
      </p>

      <SynthTable
        alpha={EX_ALPHA}
        coeffs={EX_COEFFS}
        row2={r2.map((v, i) => (showR2(i) ? v : null))}
        row3={r3.map((v, i) => (showR3(i) ? v : null))}
        className="mt-3"
      />

      <p className="mt-3 min-h-[24px] text-sm font-bold text-slate-200">
        {ANIM_MSGS[anim]}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAnim((s) => Math.max(0, s - 1))}
          disabled={anim === 0}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ◀ 이전
        </button>
        <button
          type="button"
          onClick={() => setAnim((s) => Math.min(maxAnim, s + 1))}
          disabled={anim === maxAnim}
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ▶ 다음 계산
        </button>
        <button
          type="button"
          onClick={() => setAnim(0)}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↺ 처음
        </button>
      </div>
    </div>
  );
}

// ─── 조립제법 표 시각화 ─────────────────────────────────────
function SynthTable({
  alpha,
  coeffs,
  row2,
  row3,
  className = "",
}: {
  alpha: number;
  coeffs: number[];
  row2: (number | null)[];
  row3: (number | null)[];
  className?: string;
}) {
  const n = coeffs.length;
  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="inline-flex">
        {/* 첫 열: α (rowspan 3 효과) */}
        <div className="flex w-[56px] flex-col items-stretch border-2 border-amber-400/55 bg-amber-400/15">
          <div className="flex flex-1 items-center justify-center border-r-4 border-amber-400 px-2 font-mono text-lg font-extrabold text-amber-200">
            {fmtNum(alpha)}
          </div>
        </div>

        {/* 나머지 열: 3행 그리드 */}
        <div className={synthColsClass(n, 72)}>
          {/* Row 1 */}
          {coeffs.map((c, i) => (
            <div
              key={`r1-${i}`}
              className="flex h-[44px] items-center justify-center border border-white/15 bg-white/5 font-mono text-base font-bold text-amber-200"
            >
              {fmtNum(c)}
            </div>
          ))}
          {/* Row 2 */}
          {Array.from({ length: n }, (_, i) => (
            <div
              key={`r2-${i}`}
              className="flex h-[44px] items-center justify-center border border-white/10 bg-slate-900/40 font-mono text-base text-sky-200"
            >
              {i === 0 ? "" : fmtNum(row2[i])}
            </div>
          ))}
          {/* Row 3 */}
          {Array.from({ length: n }, (_, i) => {
            const isR = i === n - 1;
            return (
              <div
                key={`r3-${i}`}
                className={
                  "flex h-[44px] items-center justify-center border-t-2 border-l border-r border-b font-mono text-base font-bold " +
                  (isR
                    ? "border-rose-400/55 bg-rose-400/15 text-rose-100"
                    : "border-emerald-400/45 bg-emerald-400/10 text-emerald-100")
                }
              >
                {fmtNum(row3[i])}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Practice Section ──────────────────────────────────────
type Problem = {
  label: string;
  coeffs: number[];
  alpha: number;
  divisor: string;
};

const PROBS: Problem[] = [
  { label: "문제 ①", coeffs: [3, -2, 1, -4], alpha: 2, divisor: "x − 2" },
  { label: "문제 ②", coeffs: [2, 1, -3], alpha: -1, divisor: "x + 1" },
  { label: "문제 ③", coeffs: [1, 0, 0, -8], alpha: 2, divisor: "x − 2" },
  { label: "문제 ④", coeffs: [1, -4, 5, -2], alpha: 1, divisor: "x − 1" },
  { label: "문제 ⑤", coeffs: [2, -3, 0, 4, -1], alpha: 3, divisor: "x − 3" },
];

function PracticeSection({
  solved,
  onSolve,
}: {
  solved: Set<number>;
  onSolve: (i: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          문제 선택
        </span>
        <div className="flex flex-wrap gap-2">
          {PROBS.map((p, i) => {
            const isCur = i === idx;
            const isDone = solved.has(i);
            const cls = isCur
              ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
              : isDone
              ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-200"
              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10";
            return (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition ${cls}`}
              >
                {p.label}
                {isDone ? " ✓" : ""}
              </button>
            );
          })}
        </div>
      </div>

      <PracticeRunner key={idx} idx={idx} onSolve={onSolve} />
    </div>
  );
}

function PracticeRunner({
  idx,
  onSolve,
}: {
  idx: number;
  onSolve: (i: number) => void;
}) {
  const p = PROBS[idx];
  const { r2: ansR2, r3: ansR3 } = useMemo(
    () => computeSynth(p.coeffs, p.alpha),
    [p.coeffs, p.alpha],
  );
  const n = p.coeffs.length;
  const [row2, setRow2] = useState<string[]>(() => new Array(n).fill(""));
  const [row3, setRow3] = useState<string[]>(() => new Array(n).fill("")); // [0]는 자동
  const [row2Ok, setRow2Ok] = useState<(boolean | null)[]>(() => new Array(n).fill(null));
  const [row3Ok, setRow3Ok] = useState<(boolean | null)[]>(() => new Array(n).fill(null));
  const [fb, setFb] = useState<{ tone: "ok" | "ng"; message: string } | null>(null);
  const [done, setDone] = useState(false);

  // 첫 칸은 자동
  useEffect(() => {
    setRow3((arr) => arr.map((v, i) => (i === 0 ? String(ansR3[0]) : v)));
  }, [ansR3]);

  function handleCheck() {
    let ok = true;
    let wrong = 0;
    const r2Status = row2.map((v, i) => {
      if (i === 0) return null;
      const n2 = Number(v);
      const good = v.trim() !== "" && !Number.isNaN(n2) && n2 === ansR2[i];
      if (!good) {
        ok = false;
        wrong++;
      }
      return good;
    });
    const r3Status = row3.map((v, i) => {
      if (i === 0) return true; // 자동
      const n3 = Number(v);
      const good = v.trim() !== "" && !Number.isNaN(n3) && n3 === ansR3[i];
      if (!good) {
        ok = false;
        wrong++;
      }
      return good;
    });
    setRow2Ok(r2Status);
    setRow3Ok(r3Status);
    if (ok) {
      setFb({ tone: "ok", message: "🎉 모두 정답입니다!" });
      if (!done) {
        setDone(true);
        onSolve(idx);
      }
    } else {
      setFb({ tone: "ng", message: `❌ ${wrong}개 틀렸습니다. 다시 확인해 보세요.` });
    }
  }

  // 결과(몫, 나머지)
  const quotientCoeffs = ansR3.slice(0, -1);
  const remainder = ansR3[ansR3.length - 1];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
        ✏️ <span className="font-mono">{polyStr(p.coeffs)}</span> ÷ ({p.divisor})
      </p>
      <p className="mt-2 text-sm text-slate-400">
        α ={" "}
        <b className="text-amber-300">
          {p.alpha < 0 ? `(${fmtNum(p.alpha)})` : p.alpha}
        </b>{" "}
        | 차수: {p.coeffs.length - 1}차
      </p>
      <p className="mt-2 rounded-lg border border-amber-400/35 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-100">
        💡 빈 칸에 값을 입력하고 채점 버튼을 눌러보세요. <br />
        · 2행: α × (바로 앞 3행의 값) <br />
        · 3행: 1행 + 2행 (맨 앞은 자동으로 채워져 있음)
      </p>

      <div className="mt-4 overflow-x-auto">
        <PracticeTable
          alpha={p.alpha}
          coeffs={p.coeffs}
          row2={row2}
          row3={row3}
          row2Ok={row2Ok}
          row3Ok={row3Ok}
          onRow2Change={(i, v) =>
            setRow2((arr) => arr.map((x, k) => (k === i ? v : x)))
          }
          onRow3Change={(i, v) =>
            setRow3((arr) => arr.map((x, k) => (k === i ? v : x)))
          }
        />
      </div>

      {fb ? (
        <p
          className={`mt-3 text-sm font-bold ${
            fb.tone === "ok" ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {fb.message}
        </p>
      ) : null}

      <div className="mt-3">
        <button
          type="button"
          onClick={handleCheck}
          disabled={done}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {done ? "✅ 완료" : "✅ 채점하기"}
        </button>
      </div>

      {done ? (
        <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-100">
          <p className="font-bold">정답!</p>
          <p className="mt-1 font-mono">
            <b>몫</b>: Q(x) = {polyStr(quotientCoeffs)}
          </p>
          <p className="mt-1 font-mono">
            <b>나머지</b>: R = {fmtNum(remainder)}
          </p>
          <p className="mt-1 font-mono text-emerald-200/80">
            확인: {polyStr(p.coeffs)} = ({p.divisor})({polyStr(quotientCoeffs)}) +{" "}
            {remainder < 0 ? `(${fmtNum(remainder)})` : fmtNum(remainder)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function PracticeTable({
  alpha,
  coeffs,
  row2,
  row3,
  row2Ok,
  row3Ok,
  onRow2Change,
  onRow3Change,
}: {
  alpha: number;
  coeffs: number[];
  row2: string[];
  row3: string[];
  row2Ok: (boolean | null)[];
  row3Ok: (boolean | null)[];
  onRow2Change: (i: number, v: string) => void;
  onRow3Change: (i: number, v: string) => void;
}) {
  const n = coeffs.length;
  return (
    <div className="inline-flex">
      {/* 첫 열: α */}
      <div className="flex w-[56px] flex-col border-2 border-amber-400/55 bg-amber-400/15">
        <div className="flex flex-1 items-center justify-center border-r-4 border-amber-400 px-2 font-mono text-lg font-extrabold text-amber-200">
          {fmtNum(alpha)}
        </div>
      </div>

      <div className={synthColsClass(n, 80)}>
        {/* Row 1 (계수) */}
        {coeffs.map((c, i) => (
          <div
            key={`r1-${i}`}
            className="flex h-[48px] items-center justify-center border border-white/15 bg-white/5 font-mono text-base font-bold text-amber-200"
          >
            {fmtNum(c)}
          </div>
        ))}

        {/* Row 2 입력 */}
        {Array.from({ length: n }, (_, i) => (
          <div
            key={`r2-${i}`}
            className="flex h-[48px] items-center justify-center border border-white/10 bg-slate-900/40"
          >
            {i === 0 ? (
              <span className="text-slate-600">·</span>
            ) : (
              <InputCell
                value={row2[i]}
                ok={row2Ok[i]}
                onChange={(v) => onRow2Change(i, v)}
              />
            )}
          </div>
        ))}

        {/* Row 3 — 첫 칸은 자동, 나머지 입력 */}
        {Array.from({ length: n }, (_, i) => {
          const isR = i === n - 1;
          const baseBox = isR
            ? "border-rose-400/55 bg-rose-400/10"
            : "border-emerald-400/45 bg-emerald-400/[0.07]";
          return (
            <div
              key={`r3-${i}`}
              className={`flex h-[48px] items-center justify-center border-t-2 border-l border-r border-b font-mono text-base font-bold ${baseBox}`}
            >
              {i === 0 ? (
                <span
                  className={`font-mono text-base font-bold ${
                    isR ? "text-rose-200" : "text-emerald-200"
                  }`}
                >
                  {row3[0]}
                </span>
              ) : (
                <InputCell
                  value={row3[i]}
                  ok={row3Ok[i]}
                  onChange={(v) => onRow3Change(i, v)}
                  tone={isR ? "rose" : "emerald"}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InputCell({
  value,
  ok,
  onChange,
  tone,
}: {
  value: string;
  ok: boolean | null;
  onChange: (v: string) => void;
  tone?: "emerald" | "rose";
}) {
  const base = tone === "rose" ? "text-rose-100" : tone === "emerald" ? "text-emerald-100" : "text-slate-100";
  const okCls =
    ok === true
      ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-100"
      : ok === false
      ? "border-rose-400/70 bg-rose-400/15 text-rose-100"
      : `border-white/15 bg-slate-900/50 ${base}`;
  return (
    <input
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="?"
      className={`h-[34px] w-[56px] rounded-md border-2 text-center font-mono text-base font-bold outline-none transition focus:ring-2 focus:ring-cyan-400/40 ${okCls}`}
    />
  );
}
