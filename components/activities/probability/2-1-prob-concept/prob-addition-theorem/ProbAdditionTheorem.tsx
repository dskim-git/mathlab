"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

/* ──────────────────────────────────────────────────────────────
   확률의 덧셈정리 탐험  (3 tabs)
   1) 벤다이어그램 시뮬레이터  - P(A), P(B), P(A∩B) 슬라이더 + Canvas
   2) 문제 퀴즈                - 4개 문제 × 2단계(STEP1 배반판정 / STEP2 확률계산)
   3) 배반 분류기              - 6개 사건쌍 분류
   총 14문항(STEP1×4 + STEP2×4 + 분류×6)
   ────────────────────────────────────────────────────────────── */

// ============================================================
// 탭 1 — 벤 다이어그램
// ============================================================

function VennPanel() {
  const cvsRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [pa, setPa] = useState(50); // 0~100 (정수 %)
  const [pb, setPb] = useState(40);
  const [pab, setPab] = useState(15);

  // P(A∩B) 가용 범위: max(0, pa+pb-1) ≤ pab ≤ min(pa, pb)
  const [minAB, maxAB] = useMemo(
    () => [Math.max(0, pa + pb - 100), Math.min(pa, pb)],
    [pa, pb]
  );

  // 슬라이더 범위 밖이면 자동 보정
  useEffect(() => {
    if (pab < minAB) setPab(minAB);
    else if (pab > maxAB) setPab(maxAB);
  }, [minAB, maxAB, pab]);

  const PA = pa / 100;
  const PB = pb / 100;
  const PAB = Math.min(Math.max(pab, minAB), maxAB) / 100;
  const PUNION = PA + PB - PAB;
  const isMutuallyExclusive = PAB < 0.005;

  useEffect(() => {
    const cvs = cvsRef.current;
    const ctx = cvs?.getContext("2d");
    if (!cvs || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = wrapRef.current?.clientWidth ?? 320;
    const W = Math.max(260, Math.min(420, cssW));
    const H = 220;
    cvs.width = Math.round(W * dpr);
    cvs.height = Math.round(H * dpr);
    cvs.style.width = `${W}px`;
    cvs.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 배경
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2 + 12;
    const maxR = Math.min(W, H) * 0.34;
    const rA = maxR * Math.sqrt(PA);
    const rB = maxR * Math.sqrt(PB);
    const overRatio = Math.min(PA, PB) > 0 ? PAB / Math.min(PA, PB) : 0;
    const dMax = rA + rB;
    const dMin = Math.abs(rA - rB);
    let dist = dMax - Math.min(0.95, overRatio * 2.1) * (dMax - dMin);
    dist = Math.max(dMin + 1, Math.min(dMax - 1, dist));
    const xA = cx - dist / 2;
    const xB = cx + dist / 2;

    // A
    ctx.beginPath();
    ctx.arc(xA, cy, rA, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(34, 211, 238, 0.22)"; // cyan-400 톤
    ctx.fill();
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    ctx.stroke();

    // B
    ctx.beginPath();
    ctx.arc(xB, cy, rB, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(244, 114, 182, 0.22)"; // pink-400 톤
    ctx.fill();
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 교집합
    if (PAB > 0.005) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(xA, cy, rA, 0, Math.PI * 2);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(xB, cy, rB, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(167, 139, 250, 0.45)"; // violet-400 톤
      ctx.fill();
      ctx.restore();
    }

    // 라벨
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 13px ui-sans-serif, system-ui";
    ctx.fillStyle = "#67e8f9";
    ctx.fillText("A", xA - rA * 0.5, cy - 5);
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(`P=${PA.toFixed(2)}`, xA - rA * 0.5, cy + 10);

    ctx.font = "bold 13px ui-sans-serif, system-ui";
    ctx.fillStyle = "#fbcfe8";
    ctx.fillText("B", xB + rB * 0.5, cy - 5);
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(`P=${PB.toFixed(2)}`, xB + rB * 0.5, cy + 10);

    if (PAB > 0.01) {
      ctx.font = "bold 10px ui-sans-serif, system-ui";
      ctx.fillStyle = "#ddd6fe";
      ctx.fillText("A∩B", cx, cy - 6);
      ctx.fillText(`=${PAB.toFixed(2)}`, cx, cy + 7);
    }

    ctx.font = "bold 13px ui-sans-serif, system-ui";
    ctx.fillStyle = "#34d399";
    ctx.fillText(`P(A∪B) = ${PUNION.toFixed(2)}`, W / 2, 18);
  }, [PA, PB, PAB, PUNION]);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-slate-400">
        슬라이더로 <b className="text-cyan-300">P(A)</b>, <b className="text-pink-300">P(B)</b>,
        <b className="text-violet-300"> P(A∩B)</b>를 바꿔 보세요.
        P(A∩B)는 확률 조건(0 ≤ P(A∪B) ≤ 1)을 만족하도록 자동으로 범위가 제한됩니다.
      </p>

      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <div ref={wrapRef} className="flex justify-center">
          <canvas ref={cvsRef} className="rounded-xl border border-white/10 bg-slate-950" />
        </div>

        <div className="space-y-3">
          <SliderRow label="P(A)" valueText={PA.toFixed(2)} color="cyan">
            <input
              type="range" min={1} max={99} value={pa}
              onChange={(e) => setPa(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </SliderRow>
          <SliderRow label="P(B)" valueText={PB.toFixed(2)} color="pink">
            <input
              type="range" min={1} max={99} value={pb}
              onChange={(e) => setPb(Number(e.target.value))}
              className="w-full accent-pink-400"
            />
          </SliderRow>
          <SliderRow
            label="P(A∩B)"
            valueText={PAB.toFixed(2)}
            color="violet"
            hint={`[${(minAB / 100).toFixed(2)} ~ ${(maxAB / 100).toFixed(2)}]`}
          >
            <input
              type="range" min={minAB} max={maxAB} value={Math.min(Math.max(pab, minAB), maxAB)}
              onChange={(e) => setPab(Number(e.target.value))}
              className="w-full accent-violet-400"
            />
          </SliderRow>

          <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/[0.07] p-3 font-mono text-sm leading-7 text-amber-200">
            P(A∪B) = {PA.toFixed(2)} + {PB.toFixed(2)} − {PAB.toFixed(2)} ={" "}
            <span className="text-base font-bold text-emerald-300">{PUNION.toFixed(2)}</span>
          </div>

          {isMutuallyExclusive ? (
            <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-center text-sm font-bold text-emerald-300">
              ⊘ 배반사건! &nbsp;P(A∩B) = 0 &nbsp;→&nbsp; P(A∪B) = P(A) + P(B)
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label, valueText, color, hint, children,
}: {
  label: string; valueText: string; color: "cyan" | "pink" | "violet";
  hint?: string; children: React.ReactNode;
}) {
  const valTone = color === "cyan" ? "text-cyan-300" : color === "pink" ? "text-pink-300" : "text-violet-300";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="flex items-center gap-2">
          {hint ? <span className="text-[10px] text-slate-500">{hint}</span> : null}
          <span className={`font-mono text-sm font-bold ${valTone}`}>{valueText}</span>
        </span>
      </div>
      {children}
    </div>
  );
}

// ============================================================
// 탭 2 — 문제 퀴즈 (4문제 × 2STEP)
// ============================================================

type Choice = { label: string; ok: boolean };
type Problem = {
  id: number;
  title: string;
  question: React.ReactNode;
  visual: React.ReactNode;
  step1Label: string;
  isMutuallyExclusive: boolean; // STEP1 정답
  feedback: { ok: string; ng: string };
  hint: React.ReactNode;
  choices: Choice[];
  step2Feedback: React.ReactNode;
};

const PROBLEMS: Problem[] = [
  {
    id: 1,
    title: "🎲 주사위",
    question: (
      <>
        주사위를 한 번 던질 때,
        <br />
        <strong className="text-amber-200">3의 배수이거나 4 이상</strong>인 눈이 나올 확률은?
      </>
    ),
    visual: (
      <div className="space-y-1.5">
        <div className="flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((n) => {
            const inA = n % 3 === 0;
            const inB = n >= 4;
            const cls =
              inA && inB ? "border-violet-400 bg-violet-400/30 text-violet-100"
              : inA ? "border-cyan-400 bg-cyan-400/25 text-cyan-100"
              : inB ? "border-pink-400 bg-pink-400/25 text-pink-100"
              : "border-white/15 bg-white/[0.05] text-slate-200";
            return (
              <div key={n} className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-base font-bold ${cls}`}>
                {n}
              </div>
            );
          })}
        </div>
        <ColorKey
          items={[
            { color: "bg-cyan-400", label: "A: 3의 배수" },
            { color: "bg-pink-400", label: "B: 4 이상" },
            { color: "bg-violet-400", label: "A∩B" },
          ]}
        />
      </div>
    ),
    step1Label: "A = {3, 6}, B = {4, 5, 6} — 두 사건은?",
    isMutuallyExclusive: false,
    feedback: {
      ok: "✅ 비배반사건! {6}이 A와 B 모두에 속해요",
      ng: "❌ 비배반사건이에요! A={3,6}, B={4,5,6}에서 6이 겹쳐요",
    },
    hint: (
      <>
        A = {"{3, 6}"} → P(A) = 2/6<br />
        B = {"{4, 5, 6}"} → P(B) = 3/6<br />
        A∩B = {"{6}"} → P(A∩B) = 1/6<br />
        <strong className="text-amber-300">→ P(A∩B)를 빼야 합니다</strong>
      </>
    ),
    choices: [
      { label: "1/2", ok: false },
      { label: "2/3", ok: true },
      { label: "5/6", ok: false },
      { label: "1", ok: false },
    ],
    step2Feedback: (
      <>
        P(A∪B) = 2/6 + 3/6 − 1/6 = <strong className="text-emerald-200">4/6 = 2/3</strong>
        <br />
        A∪B = {"{3, 4, 5, 6}"} → 4가지 / 6 = 2/3
      </>
    ),
  },

  {
    id: 2,
    title: "🃏 숫자 카드 1~20",
    question: (
      <>
        1~20 카드 중 1장을 뽑을 때,
        <br />
        <strong className="text-amber-200">짝수이거나 3의 배수</strong>인 카드를 뽑을 확률은?
      </>
    ),
    visual: (
      <div className="space-y-1.5">
        <div className="mx-auto grid max-w-[230px] grid-cols-5 gap-1">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => {
            const inA = n % 2 === 0;
            const inB = n % 3 === 0;
            const cls =
              inA && inB ? "border-violet-400 bg-violet-400/30 text-violet-100"
              : inA ? "border-cyan-400 bg-cyan-400/25 text-cyan-100"
              : inB ? "border-emerald-400 bg-emerald-400/25 text-emerald-100"
              : "border-white/10 bg-white/[0.04] text-slate-500";
            return (
              <div key={n} className={`flex aspect-square items-center justify-center rounded-md border text-xs font-bold ${cls}`}>
                {n}
              </div>
            );
          })}
        </div>
        <ColorKey
          items={[
            { color: "bg-cyan-400", label: "A: 짝수" },
            { color: "bg-emerald-400", label: "B: 3의 배수" },
            { color: "bg-violet-400", label: "A∩B" },
          ]}
        />
      </div>
    ),
    step1Label: "A = 짝수, B = 3의 배수 — 두 사건은?",
    isMutuallyExclusive: false,
    feedback: {
      ok: "✅ 비배반사건! {6, 12, 18}이 A와 B 모두에 속해요",
      ng: "❌ 비배반사건이에요! 6, 12, 18이 짝수이면서 3의 배수예요",
    },
    hint: (
      <>
        A = {"{2,4,6,8,10,12,14,16,18,20}"} → P(A) = 10/20<br />
        B = {"{3,6,9,12,15,18}"} → P(B) = 6/20<br />
        A∩B = {"{6,12,18}"} → P(A∩B) = 3/20<br />
        <strong className="text-amber-300">→ 보라색 3개를 빼야 합니다</strong>
      </>
    ),
    choices: [
      { label: "3/5", ok: false },
      { label: "13/20", ok: true },
      { label: "7/10", ok: false },
      { label: "4/5", ok: false },
    ],
    step2Feedback: (
      <>
        P(A∪B) = 10/20 + 6/20 − 3/20 = <strong className="text-emerald-200">13/20</strong>
        <br />
        짝수(10개) + 3의 배수(6개) − 공통 {"{6, 12, 18}"}(3개) = 13개
      </>
    ),
  },

  {
    id: 3,
    title: "🐾 반려동물 조사",
    question: (
      <>
        100가구: 개 40가구, 고양이 20가구, 둘 다 8가구.
        <br />
        임의의 가구가 <strong className="text-amber-200">개 또는 고양이</strong>를 기를 확률은?
      </>
    ),
    visual: (
      <svg viewBox="0 0 246 96" className="mx-auto block w-full max-w-[260px]">
        <ellipse cx={85} cy={52} rx={76} ry={36} fill="rgba(34,211,238,.22)" stroke="#22d3ee" strokeWidth={2} />
        <ellipse cx={161} cy={52} rx={76} ry={36} fill="rgba(52,211,153,.22)" stroke="#34d399" strokeWidth={2} />
        <text x={85} y={16} textAnchor="middle" fill="#67e8f9" fontSize={11} fontWeight={600}>🐕 개 (A)</text>
        <text x={161} y={16} textAnchor="middle" fill="#6ee7b7" fontSize={11} fontWeight={600}>🐱 고양이 (B)</text>
        <text x={50} y={50} textAnchor="middle" fill="#a5f3fc" fontSize={14} fontWeight={700}>32</text>
        <text x={50} y={65} textAnchor="middle" fill="#94a3b8" fontSize={10}>가구</text>
        <text x={123} y={50} textAnchor="middle" fill="#ddd6fe" fontSize={14} fontWeight={700}>8</text>
        <text x={123} y={65} textAnchor="middle" fill="#94a3b8" fontSize={10}>둘 다</text>
        <text x={196} y={50} textAnchor="middle" fill="#a7f3d0" fontSize={14} fontWeight={700}>12</text>
        <text x={196} y={65} textAnchor="middle" fill="#94a3b8" fontSize={10}>가구</text>
      </svg>
    ),
    step1Label: "A = 개 기르는 가구, B = 고양이 기르는 가구 — 두 사건은?",
    isMutuallyExclusive: false,
    feedback: {
      ok: "✅ 비배반사건! 개와 고양이를 함께 기르는 8가구가 겹쳐요",
      ng: "❌ 비배반사건이에요! 개+고양이 함께 기르는 8가구가 있어요",
    },
    hint: (
      <>
        P(A) = 40/100, P(B) = 20/100, P(A∩B) = 8/100<br />
        개만 32 + 고양이만 12 + 둘 다 8 = <strong className="text-amber-300">52가구</strong>
      </>
    ),
    choices: [
      { label: "3/5", ok: false },
      { label: "1/2", ok: false },
      { label: "13/25", ok: true },
      { label: "7/10", ok: false },
    ],
    step2Feedback: (
      <>
        P(A∪B) = 40/100 + 20/100 − 8/100 = <strong className="text-emerald-200">52/100 = 13/25</strong>
      </>
    ),
  },

  {
    id: 4,
    title: "📸 사진 동아리",
    question: (
      <>
        9명 중 2명을 임의로 뽑을 때,
        <br />
        <strong className="text-amber-200">모두 남학생이거나 모두 여학생</strong>일 확률은?
      </>
    ),
    visual: (
      <div className="space-y-1">
        <div className="flex flex-wrap justify-center gap-1 text-2xl">
          {["👦", "👦", "👦", "👦", "👧", "👧", "👧", "👧", "👧"].map((e, i) => (
            <span key={i}>{e}</span>
          ))}
        </div>
        <div className="text-center text-[11px] text-slate-400">
          👦 남학생 4명 + 👧 여학생 5명 → 2명 선발
        </div>
      </div>
    ),
    step1Label: "A = 모두 남학생, B = 모두 여학생 — 두 사건은?",
    isMutuallyExclusive: true,
    feedback: {
      ok: "✅ 배반사건! 동시에 모두 남 + 모두 여는 불가능해요",
      ng: "❌ 배반사건이에요! 모두 남 / 모두 여는 절대 겹치지 않아요",
    },
    hint: (
      <>
        A = {"{모두 남}"} → C(4,2)/C(9,2) = 6/36<br />
        B = {"{모두 여}"} → C(5,2)/C(9,2) = 10/36<br />
        A∩B = ∅ → <strong className="text-amber-300">그냥 더하면 됩니다!</strong>
      </>
    ),
    choices: [
      { label: "1/3", ok: false },
      { label: "4/9", ok: true },
      { label: "5/9", ok: false },
      { label: "2/3", ok: false },
    ],
    step2Feedback: (
      <>
        배반사건 → P(A∪B) = 6/36 + 10/36 = <strong className="text-emerald-200">16/36 = 4/9</strong>
      </>
    ),
  },
];

function ColorKey({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 text-[10px] text-slate-400">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className={`inline-block h-2 w-2 rounded-sm ${it.color}`} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

type Step1State = { chosen: boolean; correct: boolean } | null;
type Step2State = { idx: number; correct: boolean } | null;

function ProblemCard({
  p,
  step1, step2, hintOpen,
  onStep1, onStep2, onToggleHint,
}: {
  p: Problem;
  step1: Step1State;
  step2: Step2State;
  hintOpen: boolean;
  onStep1: (chosen: boolean) => void;
  onStep2: (idx: number) => void;
  onToggleHint: () => void;
}) {
  const step1Done = step1 != null;
  const step2Done = step2 != null;

  const cardBorder =
    step2Done
      ? step2!.correct
        ? "border-emerald-400/70 bg-emerald-400/[0.07]"
        : "border-red-400/70 bg-red-400/[0.07]"
      : "border-white/12 bg-white/[0.04]";

  return (
    <div className={`flex flex-col rounded-2xl border-2 p-4 transition ${cardBorder}`}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        문제 {p.id} · {p.title}
      </div>

      <div className="my-3 flex min-h-[112px] items-center justify-center">{p.visual}</div>

      <p className="mb-3 text-sm leading-6 text-slate-200">{p.question}</p>

      {/* STEP 1 */}
      <div>
        <StepBadge n={1} />
        <div className="mb-2 text-xs text-slate-400">{p.step1Label}</div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <Step1Btn
            label="⊘ 배반사건" tone="red"
            disabled={step1Done}
            highlight={
              step1Done ? (p.isMutuallyExclusive ? "ok" : step1!.chosen ? "ng" : null) : null
            }
            onClick={() => onStep1(true)}
          />
          <Step1Btn
            label="↔ 비배반사건" tone="blue"
            disabled={step1Done}
            highlight={
              step1Done ? (!p.isMutuallyExclusive ? "ok" : !step1!.chosen ? "ng" : null) : null
            }
            onClick={() => onStep1(false)}
          />
        </div>
        {step1Done ? (
          <div
            className={`mb-3 rounded-lg px-3 py-2 text-xs leading-5 ${
              step1!.correct
                ? "border border-emerald-400/35 bg-emerald-400/10 text-emerald-200"
                : "border border-red-400/35 bg-red-400/10 text-red-200"
            }`}
          >
            {step1!.correct ? p.feedback.ok : p.feedback.ng}
          </div>
        ) : null}
      </div>

      {/* STEP 2 (Step1 완료 후 노출) */}
      {step1Done ? (
        <div className="mt-1 border-t border-white/8 pt-3">
          <StepBadge n={2} />
          <button
            type="button"
            onClick={onToggleHint}
            className="mb-2 rounded-md border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200 transition hover:bg-amber-400/20"
          >
            💡 {hintOpen ? "힌트 숨기기" : "힌트 보기"}
          </button>
          {hintOpen ? (
            <div className="mb-2 rounded-md bg-white/[0.06] px-3 py-2 text-xs leading-6 text-slate-300">
              {p.hint}
            </div>
          ) : null}

          <div className="grid grid-cols-4 gap-1.5">
            {p.choices.map((c, i) => {
              const isPicked = step2Done && step2!.idx === i;
              const reveal = step2Done && c.ok;
              let cls = "border-white/20 bg-white/[0.06] text-slate-100 hover:border-cyan-300/60 hover:bg-cyan-300/10";
              if (step2Done) {
                if (isPicked && step2!.correct) cls = "border-emerald-400 bg-emerald-400 text-slate-950";
                else if (isPicked && !step2!.correct) cls = "border-red-400 bg-red-400 text-slate-950";
                else if (reveal) cls = "border-emerald-400 text-emerald-300";
                else cls = "border-white/15 bg-white/[0.04] text-slate-400";
              }
              return (
                <button
                  key={i}
                  type="button"
                  disabled={step2Done}
                  onClick={() => onStep2(i)}
                  className={`rounded-lg border-2 py-1.5 font-mono text-sm font-bold transition disabled:cursor-default ${cls}`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {step2Done ? (
            <div
              className={`mt-2 rounded-lg px-3 py-2 text-xs leading-6 ${
                step2!.correct
                  ? "border border-emerald-400/35 bg-emerald-400/10 text-emerald-100"
                  : "border border-red-400/35 bg-red-400/10 text-red-100"
              }`}
            >
              {step2!.correct ? "✅ " : "❌ "}
              {p.step2Feedback}
              {!step2!.correct ? (
                <div className="mt-1 text-[11px] text-red-200/80">힌트를 확인하고 식을 다시 정리해 봐요.</div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StepBadge({ n }: { n: 1 | 2 }) {
  const tone =
    n === 1
      ? "bg-pink-400/15 text-pink-300 border-pink-400/35"
      : "bg-cyan-400/15 text-cyan-300 border-cyan-400/35";
  return (
    <span className={`mb-1 inline-block rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${tone}`}>
      STEP {n}
    </span>
  );
}

function Step1Btn({
  label, tone, disabled, highlight, onClick,
}: {
  label: string;
  tone: "red" | "blue";
  disabled: boolean;
  highlight: "ok" | "ng" | null;
  onClick: () => void;
}) {
  const base =
    tone === "red"
      ? "border-red-400/60 text-red-300 hover:bg-red-400/15"
      : "border-blue-400/60 text-blue-300 hover:bg-blue-400/15";
  let cls = `border-2 ${base}`;
  if (highlight === "ok") {
    cls = tone === "red" ? "border-red-400 bg-red-400 text-slate-950" : "border-blue-400 bg-blue-400 text-slate-950";
  } else if (highlight === "ng") {
    cls = tone === "red" ? "border-red-400 bg-red-400/20 text-red-300" : "border-blue-400 bg-blue-400/20 text-blue-300";
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition disabled:cursor-default ${cls}`}
    >
      {label}
    </button>
  );
}

// ============================================================
// 탭 3 — 배반 분류기
// ============================================================

type ClassifyItem = {
  ctx: string;
  ev: React.ReactNode;
  mutuallyExclusive: boolean;
  expl: string;
};

const CLS_ITEMS: ClassifyItem[] = [
  { ctx: "🎲 주사위 한 번", ev: <>A = {"{1, 2, 3}"} vs B = {"{4, 5, 6}"}</>, mutuallyExclusive: true, expl: "완전히 분리 → A∩B = ∅" },
  { ctx: "🎲 주사위 한 번", ev: <>A = {"{짝수}"} vs B = {"{소수}"}</>, mutuallyExclusive: false, expl: "2가 짝수이면서 소수 → A∩B = {2} ≠ ∅" },
  { ctx: "🪙 동전 한 번", ev: <>A = {"{앞면}"} vs B = {"{뒷면}"}</>, mutuallyExclusive: true, expl: "앞·뒷면 동시 불가 → A∩B = ∅" },
  { ctx: "🃏 1~30 숫자 카드", ev: <>A = {"{4의 배수}"} vs B = {"{6의 배수}"}</>, mutuallyExclusive: false, expl: "12, 24가 공통 → A∩B ≠ ∅" },
  { ctx: "👥 30명 중 2명 선발", ev: <>A = {"{준우 포함}"} vs B = {"{준우 미포함}"}</>, mutuallyExclusive: true, expl: "준우는 포함·미포함 동시 불가 → A∩B = ∅" },
  { ctx: "🃏 1~12 숫자 카드", ev: <>A = {"{3의 배수}"} vs B = {"{4의 배수}"}</>, mutuallyExclusive: false, expl: "12가 공통 → A∩B = {12} ≠ ∅" },
];

function ClassifierPanel() {
  const [picks, setPicks] = useState<Record<number, boolean | null>>({});
  function pick(i: number, choice: boolean) {
    if (picks[i] != null) return;
    setPicks((p) => ({ ...p, [i]: choice }));
  }
  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-slate-400">
        두 사건이 <b className="text-red-300">배반사건(A∩B = ∅)</b>인지{" "}
        <b className="text-blue-300">비배반사건(A∩B ≠ ∅)</b>인지 판단해 보세요.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CLS_ITEMS.map((d, i) => {
          const picked = picks[i] ?? null;
          const decided = picked !== null;
          const ok = decided && picked === d.mutuallyExclusive;
          const cardBorder = !decided
            ? "border-white/10 bg-white/[0.05]"
            : ok
            ? "border-emerald-400/60 bg-emerald-400/[0.07]"
            : "border-red-400/60 bg-red-400/[0.07]";
          return (
            <div key={i} className={`rounded-xl border-2 p-3 transition ${cardBorder}`}>
              <div className="text-[11px] text-slate-400">{d.ctx}</div>
              <div className="mt-1 text-sm leading-5 text-slate-100">{d.ev}</div>
              <div className="mt-2.5 flex gap-2">
                <ClsBtn
                  label="⊘ 배반사건" tone="red"
                  disabled={decided}
                  state={
                    decided
                      ? d.mutuallyExclusive
                        ? "correct" // 정답 강조
                        : picked === true
                        ? "wrong" // 내가 잘못 고른 것
                        : "dim"
                      : null
                  }
                  onClick={() => pick(i, true)}
                />
                <ClsBtn
                  label="↔ 비배반사건" tone="blue"
                  disabled={decided}
                  state={
                    decided
                      ? !d.mutuallyExclusive
                        ? "correct"
                        : picked === false
                        ? "wrong"
                        : "dim"
                      : null
                  }
                  onClick={() => pick(i, false)}
                />
              </div>
              {decided ? (
                <p className="mt-2 border-t border-white/8 pt-2 text-[11px] leading-5 text-slate-300">
                  {ok ? "✅ " : "❌ "}
                  {d.expl}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClsBtn({
  label, tone, disabled, state, onClick,
}: {
  label: string;
  tone: "red" | "blue";
  disabled: boolean;
  state: "correct" | "wrong" | "dim" | null;
  onClick: () => void;
}) {
  const base =
    tone === "red"
      ? "border-red-400/60 text-red-300 hover:bg-red-400/15"
      : "border-blue-400/60 text-blue-300 hover:bg-blue-400/15";
  let cls = `border-2 ${base}`;
  if (state === "correct") {
    cls = tone === "red" ? "border-red-400 bg-red-400 text-slate-950" : "border-blue-400 bg-blue-400 text-slate-950";
  } else if (state === "wrong") {
    cls = tone === "red" ? "border-red-400 bg-red-400/20 text-red-300" : "border-blue-400 bg-blue-400/20 text-blue-300";
  } else if (state === "dim") {
    cls = "border-white/15 text-slate-500";
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md px-3 py-1 text-[11px] font-extrabold transition disabled:cursor-default ${cls}`}
    >
      {label}
    </button>
  );
}

// ============================================================
// 메인
// ============================================================

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_subtract",
    kind: "text",
    prompt:
      "P(A∪B) = P(A) + P(B) − P(A∩B) 에서 P(A∩B)를 빼야 하는 이유를 자신의 말로 설명해 보세요.",
    placeholder: "A와 B에 동시에 속하는 부분은 P(A)와 P(B) 모두에 포함되므로...",
  },
  {
    id: "mut_vs_nonmut",
    kind: "text",
    prompt:
      "배반사건과 비배반사건의 차이를 설명하고, 일상에서 각각의 예를 하나씩 만들어 보세요.",
    placeholder: "배반사건(A∩B=∅): 예) ...\n비배반사건(A∩B≠∅): 예) ...",
  },
  {
    id: "hardest_problem",
    kind: "text",
    prompt:
      "탐구 2의 4가지 문제 중 가장 어려웠던 것은 무엇이고, 어떻게 해결했나요?",
    placeholder: "문제 번호와 이유, 해결 과정...",
  },
];

type TabKey = "venn" | "quiz" | "classify";

export default function ProbAdditionTheorem() {
  const [tab, setTab] = useState<TabKey>("venn");

  // 탭2 상태
  const [step1, setStep1] = useState<Record<number, Step1State>>({});
  const [step2, setStep2] = useState<Record<number, Step2State>>({});
  const [hintOpen, setHintOpen] = useState<Record<number, boolean>>({});

  // 점수 집계
  const score = useMemo(() => {
    let ok = 0;
    let tot = 0;
    for (const id in step1) {
      const s = step1[id];
      if (s) {
        tot++;
        if (s.correct) ok++;
      }
    }
    for (const id in step2) {
      const s = step2[id];
      if (s) {
        tot++;
        if (s.correct) ok++;
      }
    }
    // 분류기 점수는 별도로 합산 (자체 컴포넌트 상태이므로 ref 없이 단순 14 가이드)
    return { ok, tot };
  }, [step1, step2]);

  function doStep1(p: Problem, chosen: boolean) {
    if (step1[p.id]) return;
    const correct = chosen === p.isMutuallyExclusive;
    setStep1((prev) => ({ ...prev, [p.id]: { chosen, correct } }));
  }
  function doStep2(p: Problem, idx: number) {
    if (step2[p.id]) return;
    const correct = p.choices[idx].ok;
    setStep2((prev) => ({ ...prev, [p.id]: { idx, correct } }));
  }
  function toggleHint(p: Problem) {
    setHintOpen((prev) => ({ ...prev, [p.id]: !prev[p.id] }));
  }

  const tabBtn = (active: boolean, color: string) =>
    active
      ? `rounded-lg ${color} px-3 py-2 text-sm font-bold text-slate-950`
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 확률</p>
        <h3 className="mt-2 text-2xl font-bold">➕ 확률의 덧셈정리 탐험</h3>
        <p className="mt-2 leading-7 text-slate-300">
          벤다이어그램·문제 퀴즈·배반 분류 세 가지 활동으로{" "}
          <b className="text-amber-200">P(A∪B) = P(A) + P(B) − P(A∩B)</b>의 핵심을 체험합니다.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1 font-mono text-xs font-semibold text-cyan-200">
            P(A∪B) = P(A) + P(B) − P(A∩B)
          </span>
          <span className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
            정답 {score.ok} · 풀이 {score.tot} / 8
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "venn", "bg-cyan-300")} onClick={() => setTab("venn")}>
          🔵 탐구 1 · 벤 다이어그램
        </button>
        <button type="button" className={tabBtn(tab === "quiz", "bg-pink-300")} onClick={() => setTab("quiz")}>
          🎯 탐구 2 · 문제 퀴즈
        </button>
        <button type="button" className={tabBtn(tab === "classify", "bg-violet-300")} onClick={() => setTab("classify")}>
          ✂️ 탐구 3 · 배반 분류
        </button>
      </div>

      <div className="mt-5">
        {tab === "venn" ? (
          <VennPanel />
        ) : tab === "quiz" ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-400">
              <b className="text-pink-300">STEP 1</b>에서 두 사건이 배반/비배반인지 먼저 판단한 뒤,{" "}
              <b className="text-cyan-300">STEP 2</b>에서 확률값을 계산하세요.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {PROBLEMS.map((p) => (
                <ProblemCard
                  key={p.id}
                  p={p}
                  step1={step1[p.id] ?? null}
                  step2={step2[p.id] ?? null}
                  hintOpen={!!hintOpen[p.id]}
                  onStep1={(c) => doStep1(p, c)}
                  onStep2={(i) => doStep2(p, i)}
                  onToggleHint={() => toggleHint(p)}
                />
              ))}
            </div>
          </div>
        ) : (
          <ClassifierPanel />
        )}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
