"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "two_formulas_equal",
    prompt:
      "직순열에서 중복을 나눠 주는 식 M!/d 과 원순열에 기준 자리 수를 곱하는 식 (M−1)!·(M/d) 이 항상 같은 값이 나오는 이유를 본인의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: M! = M·(M−1)! 이므로 M!/d = (M−1)!·(M/d). 즉 ‘선형 배치 M! 에서 같은 배치로 보이는 가짓수 d 만큼 중복 제거’와 ‘원순열 (M−1)! 에 기준 자리(앵커) 수 M/d 를 곱하기’는 같은 식의 두 표현일 뿐이다.",
  },
  {
    id: "rot_vs_ref",
    prompt:
      "변별 원 개수 배열을 [3,2,3,2] 또는 [4,1,4,1] 로 바꿔 보면 ‘회전으로 같은 가짓수’와 ‘거울로 뒤집어도 같은가’가 어떻게 변하나요?",
    kind: "text",
    placeholder:
      "예: [3,2,3,2] 같은 2주기 배열은 180° 회전해도 같으므로 회전으로 같은 가짓수가 2이고, 거울로 뒤집어도 같은 모양이라서 d = 2×2 = 4 가 됐다. [4,1,4,1] 도 비슷한 결과.",
  },
  {
    id: "regular_vs_irregular",
    prompt:
      "정다각형(모든 변 같은 k) 일 때와 비정다각형(변마다 다른 k) 일 때 d 값이 어떻게 다른가요? n=6 같은 예에서 정·비정을 비교해 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 정다각형은 모든 변의 원 수가 같아 n 가지 회전이 모두 같은 모양 → d 가 가장 크고 중복이 많다. 비정다각형은 배열이 깨질수록 회전 가짓수가 줄어 d=1 까지 작아지고, 배열 수가 단순히 M! 에 가까워진다.",
  },
];

// ─── 수학 유틸 ──────────────────────────────────────────
function gcd(a: number, b: number): number {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}
function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function log10Factorial(n: number): number {
  if (n <= 1) return 0;
  if (n <= 5000) {
    let s = 0;
    for (let i = 2; i <= n; i++) s += Math.log10(i);
    return s;
  }
  // Stirling 근사
  return (
    n * (Math.log10(n) - Math.log10(Math.E)) +
    0.5 * Math.log10(2 * Math.PI * n)
  );
}
function sciFromLog10(log10x: number): string {
  if (log10x < -6) return "≈ 0";
  const exp = Math.floor(log10x);
  const mant = 10 ** (log10x - exp);
  return `≈ ${mant.toFixed(3)}×10^${exp}`;
}

function rotCount(counts: number[]): number {
  const n = counts.length;
  let c = 0;
  for (let s = 0; s < n; s++) {
    let eq = true;
    for (let i = 0; i < n; i++) {
      if (counts[(i + s) % n] !== counts[i]) {
        eq = false;
        break;
      }
    }
    if (eq) c++;
  }
  return c;
}
function hasReflection(counts: number[]): boolean {
  const n = counts.length;
  for (let s = 0; s < n; s++) {
    let okV = true;
    let okE = true;
    for (let i = 0; i < n; i++) {
      const idxL = ((s - i) % n + n) % n;
      const idxE = ((s - i - 1) % n + n) % n;
      if (counts[(s + i) % n] !== counts[idxL]) okV = false;
      if (counts[(s + i) % n] !== counts[idxE]) okE = false;
      if (!okV && !okE) break;
    }
    if (okV || okE) return true;
  }
  return false;
}
function stabilizerSize(counts: number[], useReflection: boolean): number {
  const R = rotCount(counts);
  const has = hasReflection(counts);
  return Math.max(1, R * (useReflection && has ? 2 : 1));
}

// ─── 시드 RNG (라벨 셔플 — 시드 가능) ───────────────────
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 시드 기반 다각형 꼭짓점 jitter
function noise01(rng: () => number): number {
  return rng();
}

// ─── 메인 ─────────────────────────────────────────────────
export default function PolygonEdgeArrangements() {
  const [nSides, setNSides] = useState(8);
  const [isRegular, setIsRegular] = useState(true);
  const [regK, setRegK] = useState(3);
  const [irregCounts, setIrregCounts] = useState<number[]>(() =>
    Array.from({ length: 8 }, () => 2)
  );
  const [considerReflection, setConsiderReflection] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState<number>(() =>
    Math.floor(Date.now() & 0xffffffff)
  );
  // 다각형 모양 jitter (재섞기 시 함께 바뀜)
  const polyJitterSeed = shuffleSeed;

  // edge_counts = regular ? 모두 k : 비정 입력값(앞 n 개만)
  const counts = useMemo<number[]>(() => {
    if (isRegular) return Array.from({ length: nSides }, () => regK);
    const arr = irregCounts.slice(0, nSides);
    while (arr.length < nSides) arr.push(0);
    return arr;
  }, [isRegular, nSides, regK, irregCounts]);

  const M = counts.reduce((a, b) => a + b, 0);
  const R = useMemo(() => rotCount(counts), [counts]);
  const hasRef = useMemo(() => hasReflection(counts), [counts]);
  const H = useMemo(
    () => stabilizerSize(counts, considerReflection),
    [counts, considerReflection]
  );
  const g = M > 0 ? gcd(M, H) : 1;

  // 결과값
  const showExact = M <= 20;
  const valA: { exact: number; sci: null } | { exact: null; sci: string } = showExact
    ? { exact: factorial(M) / H, sci: null }
    : { exact: null, sci: sciFromLog10(log10Factorial(M) - Math.log10(H)) };
  const valB: { exact: number; sci: null } | { exact: null; sci: string } = showExact
    ? { exact: (factorial(M - 1) * M) / H, sci: null }
    : {
        exact: null,
        sci: sciFromLog10(
          log10Factorial(M - 1) + Math.log10(M) - Math.log10(H)
        ),
      };

  // n 변경 → 비정 counts 길이 맞춤
  function handleNChange(newN: number) {
    setNSides(newN);
    setIrregCounts((prev) => {
      const a = prev.slice();
      while (a.length < newN) a.push(2);
      return a.slice(0, newN);
    });
  }
  function updateIrregAt(i: number, v: number) {
    setIrregCounts((prev) => {
      const a = prev.slice();
      a[i] = v;
      return a;
    });
  }
  function fillAll(v: number) {
    setIrregCounts(Array.from({ length: nSides }, () => v));
  }
  function reshuffle() {
    setShuffleSeed(Math.floor(Math.random() * 0xffffffff));
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 교육과정 외</p>
        <h3 className="mt-2 text-2xl font-bold">
          ⚪ 다각형 변 위 원(칩) 배열 — 대칭을 고려한 경우의수
        </h3>
        <p className="mt-2 leading-7 text-slate-300">
          정·비정다각형의 변마다 다른 개수의 원(칩)을 두고, 변 개수 배열을{" "}
          <b className="text-amber-300">회전·뒤집기</b> 했을 때 같은 모양으로 보이는 가짓수{" "}
          <b className="text-amber-300">d</b> 를 자동 판단해{" "}
          <b className="text-amber-300">M!/d</b> (직순열÷중복) ={" "}
          <b className="text-amber-300">(M−1)!·(M/d)</b> (원순열×기준) 을 비교합니다.
        </p>
      </div>

      {/* d 정의 박스 — 학생용 친절 설명 */}
      <div className="mt-5 rounded-2xl border-2 border-cyan-400/45 bg-cyan-500/10 p-4 text-sm leading-7 text-cyan-50">
        <div className="mb-1 text-base font-extrabold text-cyan-200">
          💡 여기서 <span className="text-amber-300">d</span> 가 무엇인가요?
        </div>
        <div>
          <b className="text-amber-200">d</b> = 같은 배치인데 단지{" "}
          <b className="text-yellow-200">회전·뒤집기</b> 만으로 다른 것처럼 보이는 가짓수.
          예를 들어 정육각형(n=6)에 모든 변의 원 수가 같다면 시계 방향으로 1~6칸 돌린 6가지 모양이
          모두 같은 배치라서 <b className="text-amber-200">d = 6</b>. 거울로 뒤집은 것도 같은 배치로
          본다면 <b className="text-amber-200">d = 6 × 2 = 12</b>.
        </div>
      </div>

      {/* 설정 */}
      <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 text-base font-bold text-cyan-200">⚙️ 설정</h4>

        <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-cyan-400/30 bg-cyan-500/10 px-3 py-2">
          <label
            htmlFor="pea-n"
            className="min-w-[120px] text-sm font-extrabold text-cyan-200"
          >
            다각형 변의 수 n
          </label>
          <input
            id="pea-n"
            type="range"
            min={3}
            max={12}
            step={1}
            value={nSides}
            onChange={(e) => handleNChange(parseInt(e.target.value, 10))}
            className="h-1.5 flex-1 accent-cyan-400"
          />
          <span className="min-w-[64px] rounded-md bg-slate-950/70 px-3 py-1 text-center text-xl font-extrabold tabular-nums text-amber-300">
            {nSides}
          </span>
        </div>

        <label className="mt-2 flex items-center gap-3 rounded-xl border-[1.5px] border-violet-400/35 bg-violet-500/10 px-3 py-2 text-sm font-extrabold text-violet-200">
          <input
            type="checkbox"
            checked={isRegular}
            onChange={(e) => setIsRegular(e.target.checked)}
            className="h-4 w-4 accent-violet-400"
          />
          정다각형 (모든 변 동일 개수)
        </label>

        {isRegular ? (
          <div className="mt-2 flex items-center gap-3 rounded-xl border-[1.5px] border-amber-400/35 bg-amber-500/10 px-3 py-2">
            <label
              htmlFor="pea-k"
              className="min-w-[120px] text-sm font-extrabold text-amber-200"
            >
              한 변의 원 개수 k
            </label>
            <input
              id="pea-k"
              type="range"
              min={1}
              max={12}
              step={1}
              value={regK}
              onChange={(e) => setRegK(parseInt(e.target.value, 10))}
              className="h-1.5 flex-1 accent-amber-400"
            />
            <span className="min-w-[64px] rounded-md bg-slate-950/70 px-3 py-1 text-center text-xl font-extrabold tabular-nums text-amber-300">
              {regK}
            </span>
          </div>
        ) : (
          <IrregInputs
            n={nSides}
            counts={irregCounts}
            onChange={updateIrregAt}
            onFillAll={fillAll}
          />
        )}

        <label className="mt-2 flex items-center gap-3 rounded-xl border-[1.5px] border-pink-400/35 bg-pink-500/10 px-3 py-2 text-sm font-extrabold text-pink-200">
          <input
            type="checkbox"
            checked={considerReflection}
            onChange={(e) => setConsiderReflection(e.target.checked)}
            className="h-4 w-4 accent-pink-400"
          />
          거울대칭(반사)도 같은 배열로 본다
        </label>

        <button
          type="button"
          onClick={reshuffle}
          className="mt-2 w-full rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-cyan-400 hover:to-cyan-600 active:scale-95"
        >
          🔀 원(칩) 번호 재배열 (다각형 모양도 함께 변경)
        </button>
      </div>

      {/* 세팅 요약 */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="총 원 수 M" value={String(M)} tone="amber" />
        <SummaryCard
          label="회전으로 같은 가짓수 R"
          value={String(R)}
          tone="cyan"
        />
        <SummaryCard
          label="거울로 뒤집어도 같음?"
          value={hasRef ? "예" : "아니오"}
          tone={hasRef ? "pink" : "slate"}
        />
        <SummaryCard
          label="같은 배치로 보이는 가짓수 d"
          value={String(H)}
          tone="emerald"
        />
      </div>

      {/* 변별 원 개수 표시 */}
      <div className="mt-3 rounded-xl border-[1.5px] border-slate-400/25 bg-slate-900/40 p-3 text-sm">
        <span className="font-extrabold text-slate-300">변별 원 개수 배열:</span>{" "}
        <span className="font-extrabold tabular-nums text-amber-200">
          [{counts.join(", ")}]
        </span>
      </div>

      {/* A) 직순열 ÷ 중복 */}
      <div className="mt-3 rounded-2xl border border-violet-400/25 bg-slate-900/40 p-4">
        <h4 className="mb-2 text-base font-bold text-violet-200">
          A) 직순열로 보고 중복을 나눠주기
        </h4>
        <div className="space-y-2">
          <FormulaBox
            expr={String.raw`\text{서로 다른 배열 수} \;=\; \dfrac{M!}{d}`}
          />
          <FormulaBox
            expr={String.raw`=\;\dfrac{${M}!}{${H}}\;=\;\dfrac{${M}\cdot(${
              M - 1
            })!}{${H}}\;=\;\left(\dfrac{${M}}{${H}}\right)(${M - 1})!`}
          />
          {g > 1 && (
            <FormulaBox
              expr={String.raw`=\;\left(\dfrac{${M / g}}{${H / g}}\right)(${
                M - 1
              })!\quad(\text{${g}로 약분})`}
            />
          )}
        </div>
        <CodeResult value={valA} />
      </div>

      {/* B) 원순열 × 기준 */}
      <div className="mt-3 rounded-2xl border border-emerald-400/25 bg-slate-900/40 p-4">
        <h4 className="mb-2 text-base font-bold text-emerald-200">
          B) 원순열로 보고 기준(앵커) 자리 수를 곱하기
        </h4>
        <div className="space-y-2">
          <FormulaBox
            expr={String.raw`\text{서로 다른 배열 수} \;=\; (M-1)!\times\dfrac{M}{d}`}
          />
          <FormulaBox
            expr={String.raw`=\;(${M - 1})!\times\dfrac{${M}}{${H}}`}
          />
          {g > 1 && (
            <FormulaBox
              expr={String.raw`=\;(${M - 1})!\times\dfrac{${M / g}}{${
                H / g
              }}\quad(\text{${g}로 약분})`}
            />
          )}
        </div>
        <CodeResult value={valB} />
        <p className="mt-2 text-center text-xs text-slate-400">
          두 값은 항상 같습니다 — <code>M! = M·(M−1)!</code> 이므로{" "}
          <code>M!/d = (M−1)!·(M/d)</code> 가 자동으로 성립.
        </p>
      </div>

      {/* 시각화 */}
      <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-slate-900/40 p-4">
        <h4 className="mb-2 text-base font-bold text-cyan-200">
          🔺 다각형 + 변 위 원(라벨 1..M)
        </h4>
        <div className="rounded-xl border-[1.5px] border-cyan-400/30 bg-slate-950/55 p-3">
          <PolygonCanvas
            nSides={nSides}
            counts={counts}
            seed={shuffleSeed}
            polyJitterSeed={polyJitterSeed}
          />
          <p className="mt-2 text-center text-xs text-slate-400">
            • 변 수 n = <b className="text-amber-200">{nSides}</b> · 변별 원 수 ={" "}
            <b className="text-amber-200">[{counts.join(", ")}]</b> · 총 원 수 M ={" "}
            <b className="text-amber-200">{M}</b> · d ={" "}
            <b className="text-amber-200">{H}</b>
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-amber-300/45 bg-amber-300/10 p-3 text-sm leading-7 text-amber-50">
        <span className="text-xl">💡</span>
        <span>
          비정다각형이라도 변별 원 개수 배열이 <b className="text-yellow-200">주기</b>를
          가지거나 <b className="text-yellow-200">거울 대칭</b>이면 d 가 1보다 커집니다. 예:{" "}
          <b className="text-yellow-200">[3, 2, 3, 2]</b> 는 180° 회전해도 같으므로 회전 R=2,
          거울로 뒤집어도 같은 모양이면 d = 2×2 = 4. 이 대칭을 자동으로 세어 M!/d 로 중복을
          제거합니다.
        </span>
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <ReflectionForm questions={REFLECTION_QUESTIONS} />
      </div>
    </section>
  );
}

// ─── 빌딩블록 ──────────────────────────────────────────
function IrregInputs({
  n,
  counts,
  onChange,
  onFillAll,
}: {
  n: number;
  counts: number[];
  onChange: (i: number, v: number) => void;
  onFillAll: (v: number) => void;
}) {
  const [seedAll, setSeedAll] = useState(2);
  return (
    <div className="mt-2 rounded-xl border-[1.5px] border-amber-400/35 bg-amber-500/10 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-extrabold text-amber-200">
        <span>비정다각형: 변마다 다른 개수 입력</span>
        <span className="flex-1" />
        <label htmlFor="pea-fill" className="text-xs font-bold">
          모두 동일로 채우기 ({seedAll})
        </label>
        <input
          id="pea-fill"
          type="number"
          min={0}
          max={12}
          value={seedAll}
          onChange={(e) =>
            setSeedAll(
              Math.max(0, Math.min(12, parseInt(e.target.value || "0", 10)))
            )
          }
          className="h-7 w-16 rounded-md border border-amber-400/40 bg-slate-950/70 px-2 text-center text-sm font-bold text-amber-100"
        />
        <button
          type="button"
          onClick={() => onFillAll(seedAll)}
          className="rounded-md bg-amber-500/30 px-2 py-1 text-xs font-extrabold text-amber-100 hover:bg-amber-500/45"
        >
          ⬇ 채우기
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: n }, (_, i) => (
          <label
            key={i}
            className="flex items-center gap-2 rounded-md border border-amber-400/30 bg-slate-950/40 px-2 py-1.5"
          >
            <span className="text-xs font-bold text-amber-200">변 {i + 1}</span>
            <input
              type="number"
              min={0}
              max={12}
              value={counts[i] ?? 0}
              onChange={(e) =>
                onChange(
                  i,
                  Math.max(0, Math.min(12, parseInt(e.target.value || "0", 10)))
                )
              }
              className="h-7 w-14 rounded-md border border-amber-400/40 bg-slate-950/70 px-2 text-center text-sm font-bold text-amber-100"
              aria-label={`변 ${i + 1} 원 개수`}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

type SumTone = "amber" | "cyan" | "pink" | "emerald" | "slate";
const SUM_CLS: Record<SumTone, string> = {
  amber: "border-amber-400/50 bg-amber-500/10 text-amber-100",
  cyan: "border-cyan-400/50 bg-cyan-500/10 text-cyan-100",
  pink: "border-pink-400/50 bg-pink-500/10 text-pink-100",
  emerald: "border-emerald-400/55 bg-emerald-500/10 text-emerald-100",
  slate: "border-slate-400/35 bg-slate-700/30 text-slate-200",
};
const SUM_LBL: Record<SumTone, string> = {
  amber: "text-amber-300",
  cyan: "text-cyan-300",
  pink: "text-pink-300",
  emerald: "text-emerald-300",
  slate: "text-slate-400",
};
function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: SumTone;
}) {
  return (
    <div className={`rounded-xl border-[1.5px] p-3 text-center ${SUM_CLS[tone]}`}>
      <div className={`text-sm font-extrabold ${SUM_LBL[tone]}`}>{label}</div>
      <div className="mt-0.5 text-2xl font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

function FormulaBox({ expr }: { expr: string }) {
  return (
    <div className="w-full overflow-x-auto rounded-md border border-amber-300/30 bg-slate-950/60 px-3 py-2 text-amber-100">
      <Katex display expr={expr} />
    </div>
  );
}

function CodeResult({
  value,
}: {
  value: { exact: number; sci: null } | { exact: null; sci: string };
}) {
  let text: string;
  if (value.exact !== null) {
    text =
      Number.isInteger(value.exact)
        ? `= ${value.exact.toLocaleString()}`
        : `= ${value.exact.toPrecision(6)}`;
  } else {
    text = value.sci;
  }
  return (
    <div className="mt-2 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-center font-mono text-base font-extrabold text-emerald-200">
      {text}
    </div>
  );
}

// ─── 다각형 + 변 위 원 Canvas ────────────────────────
function PolygonCanvas({
  nSides,
  counts,
  seed,
  polyJitterSeed,
}: {
  nSides: number;
  counts: number[];
  seed: number;
  polyJitterSeed: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 960;
  const H = 560;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(15,23,42,0.4)";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2, H / 2);

    // 꼭짓점 (시드 기반 jitter)
    const Rbase = 180;
    const jrng = mulberry32(polyJitterSeed);
    const verts: { x: number; y: number }[] = [];
    for (let i = 0; i < nSides; i++) {
      const ang = -Math.PI / 2 + (Math.PI * 2 * i) / nSides;
      const r = Rbase * (0.88 + 0.22 * noise01(jrng));
      verts.push({ x: r * Math.cos(ang), y: r * Math.sin(ang) });
    }

    // 중심
    let cx0 = 0;
    let cy0 = 0;
    for (const v of verts) {
      cx0 += v.x;
      cy0 += v.y;
    }
    cx0 /= verts.length;
    cy0 /= verts.length;

    // 다각형 외곽
    ctx.strokeStyle = "rgba(148,163,184,.85)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    verts.forEach((v, i) => {
      if (i === 0) ctx.moveTo(v.x, v.y);
      else ctx.lineTo(v.x, v.y);
    });
    ctx.closePath();
    ctx.stroke();

    // 변 번호 (중앙)
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (let i = 0; i < nSides; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % nSides];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      // 변 번호는 중심에서 바깥쪽으로 약간
      const dx = mx - cx0;
      const dy = my - cy0;
      const len = Math.hypot(dx, dy) || 1;
      ctx.fillText(String(i + 1), mx + (dx / len) * 12, my + (dy / len) * 12);
    }

    // 변 위 원(칩) 배치
    type Chip = { x: number; y: number };
    const chips: Chip[] = [];
    for (let i = 0; i < nSides; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % nSides];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const ex = b.x - a.x;
      const ey = b.y - a.y;
      let nx = -ey;
      let ny = ex;
      const nlen = Math.hypot(nx, ny) || 1;
      nx /= nlen;
      ny /= nlen;
      // 바깥쪽 방향
      const vx = mx - cx0;
      const vy = my - cy0;
      if (nx * vx + ny * vy < 0) {
        nx = -nx;
        ny = -ny;
      }
      const k = counts[i];
      for (let j = 0; j < k; j++) {
        const t = (j + 1) / (k + 1);
        const px = a.x * (1 - t) + b.x * t + nx * 24;
        const py = a.y * (1 - t) + b.y * t + ny * 24;
        chips.push({ x: px, y: py });
      }
    }

    // 라벨 1..M 무작위 셔플
    const M = chips.length;
    const labels = shuffleWithSeed(
      Array.from({ length: M }, (_, i) => i + 1),
      seed
    );

    // 칩 그리기
    for (let i = 0; i < chips.length; i++) {
      const c = chips[i];
      ctx.fillStyle = "rgba(56,189,248,.18)";
      ctx.beginPath();
      ctx.arc(c.x, c.y, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(56,189,248,.85)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = "#e0f2fe";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(labels[i] ?? ""), c.x, c.y + 1);
    }

    ctx.restore();
  }, [nSides, counts, seed, polyJitterSeed]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-auto w-full rounded-lg bg-slate-950/60"
      aria-label="다각형 변 위 원 배열"
    />
  );
}
