"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "subset_pow2n",
    prompt:
      "{x₁, x₂, …, xₙ} 의 모든 부분집합의 개수가 2ⁿ 이고, 동시에 ₙC₀ + ₙC₁ + ⋯ + ₙCₙ = 2ⁿ 입니다. ‘각 원소가 부분집합에 포함될지 말지’ 두 가지 선택으로 보는 시각과 ‘크기 k 짜리 부분집합의 개수를 모두 더한다’ 라는 시각을 연결해 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 원소 n 개에 대해 각자 ‘포함 / 제외’ 두 가지 선택 → 2 × 2 × ⋯ × 2 = 2ⁿ. 한편 부분집합을 ‘크기 별로 묶어서’ 세면 크기 0 인 것 ₙC₀ 개, 크기 1 인 것 ₙC₁ 개, … 모두 더하면 모든 부분집합이 빠짐없이 정확히 한 번씩 세진다. 같은 ‘모든 부분집합의 수’ 를 두 방식으로 센 결과가 같아야 하므로 ₙC₀ + ⋯ + ₙCₙ = 2ⁿ.",
  },
  {
    id: "common_reason_combination",
    prompt:
      "평행사변형 · 부분집합 · 원 위의 삼각형 — 세 상황은 모두 ‘조합’ (순서 없는 선택) 으로 개수를 세고 있습니다. 이 세 상황에서 순열이 아닌 조합을 사용하는 공통된 이유는 무엇인가요?",
    kind: "text",
    placeholder:
      "예: 세 상황 모두 ‘어떤 원소들을 골랐는가’ 만 결과를 결정하고, ‘어떤 순서로 골랐는가’ 는 결과를 바꾸지 않는다. 평행사변형은 가로선 2 개·사선 2 개의 ‘집합’ 이 같으면 같은 평행사변형 / 부분집합은 정의 자체가 ‘원소들의 집합’ / 삼각형은 세 점의 ‘집합’ 이 같으면 같은 삼각형. 그래서 순서를 고려하는 순열 P 가 아니라 순서를 무시하는 조합 C 를 쓴다.",
  },
];

// ─── 공용 유틸 ─────────────────────────────────────────────
function fact(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function C(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  let num = 1;
  for (let i = 0; i < r; i++) num *= n - i;
  return Math.round(num / fact(r));
}
const S0 = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
function sub(n: number): string {
  return String(n)
    .split("")
    .map((c) => S0[+c])
    .join("");
}
function combs<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const [head, ...rest] = arr;
  return [
    ...combs(rest, k - 1).map((c) => [head, ...c]),
    ...combs(rest, k),
  ];
}

// ─── 메인 ─────────────────────────────────────────────────
type MainTab = 0 | 1 | 2;

export default function CombinationApplicationExplorer() {
  const [tab, setTab] = useState<MainTab>(0);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🔺 조합 활용 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b>평행사변형</b> · <b>부분집합</b> · <b>원 위의 삼각형</b> 세 가지 상황에서
          개수를 세어 보고, 그 답이 모두 <b className="text-violet-300">조합</b> 으로
          나오는 까닭을 발견해 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <MainTabBtn active={tab === 0} onClick={() => setTab(0)} emoji="📐" head="평행사변형" sub="ₘC₂ × ₙC₂" />
        <MainTabBtn active={tab === 1} onClick={() => setTab(1)} emoji="🧩" head="부분집합" sub="ₙCₖ → 2ⁿ" />
        <MainTabBtn active={tab === 2} onClick={() => setTab(2)} emoji="🔺" head="원 위의 삼각형" sub="ₙC₃" />
      </div>

      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}>
        <ParallelogramTab />
      </div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <SubsetTab />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <TriangleTab />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function MainTabBtn({
  active,
  onClick,
  emoji,
  head,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  head: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl px-3 py-2.5 text-center font-bold leading-snug transition " +
        (active
          ? "bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/25"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-violet-200")
      }
    >
      <span className="block text-xs sm:text-sm">
        {emoji} {head}
      </span>
      <span
        className={
          "mt-0.5 block font-mono text-[10px] sm:text-[11px] " +
          (active ? "text-violet-50/85" : "text-slate-400")
        }
      >
        {sub}
      </span>
    </button>
  );
}

// ─── 공용 UI ──────────────────────────────────────────────
function TitleSection({ head, sub }: { head: ReactNode; sub: ReactNode }) {
  return (
    <div className="rounded-r-xl border-l-4 border-violet-400/70 bg-gradient-to-r from-violet-500/15 via-cyan-500/10 to-transparent px-4 py-3">
      <p className="text-base font-extrabold text-violet-100">{head}</p>
      <p className="mt-0.5 text-xs leading-7 text-slate-300">{sub}</p>
    </div>
  );
}

function FormulaBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-violet-400/45 bg-gradient-to-br from-violet-500/15 via-indigo-500/10 to-transparent px-4 py-3 text-center font-bold leading-7">
      {children}
    </div>
  );
}

function Val({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-2xl font-extrabold text-amber-300">
      {children}
    </span>
  );
}

function PrimaryBtn({
  onClick,
  children,
  disabled,
  active,
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-full px-4 py-1.5 text-xs font-bold transition disabled:opacity-50 " +
        (active
          ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-400/30"
          : "bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20 hover:brightness-110")
      }
    >
      {children}
    </button>
  );
}

function SecondaryBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

function InfoNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] px-3 py-2 text-center text-xs leading-7 text-slate-200">
      💡 {children}
    </p>
  );
}

function RangeRow({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: ReactNode;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="min-w-[8.5rem] text-slate-300">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        aria-label={typeof label === "string" ? label : "slider"}
        className="flex-1 accent-violet-400"
      />
      <span className="w-9 rounded-md border border-violet-300/40 bg-violet-300 px-1 text-center font-mono text-base font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 0 — 평행사변형 (ₘC₂ × ₙC₂)
// ═══════════════════════════════════════════════════════════

const PARA_W = 560;
const PARA_H = 400;
const SLOPE = 1.75;

function hLinesY(m: number): number[] {
  const mg = PARA_H * 0.14;
  const arr: number[] = [];
  for (let i = 0; i < m; i++) arr.push(mg + ((PARA_H - 2 * mg) * i) / (m - 1));
  return arr;
}
function dLinesX0(n: number): number[] {
  const yMax = PARA_H * 0.86;
  const xEnd = PARA_W - yMax / SLOPE - 8;
  const arr: number[] = [];
  for (let i = 0; i < n; i++) arr.push(60 + ((xEnd - 60) * i) / (n - 1));
  return arr;
}
function ix(y: number, x0: number): number {
  return y / SLOPE + x0;
}

function ParallelogramTab() {
  const [m, setM] = useState(3);
  const [n, setN] = useState(5);
  const [selH, setSelH] = useState<[number, number] | null>(null);
  const [selD, setSelD] = useState<[number, number] | null>(null);
  const [autoIdx, setAutoIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [showStep, setShowStep] = useState<string>("");
  const timerRef = useRef<number | null>(null);

  const combos = useMemo(() => {
    const out: [[number, number], [number, number]][] = [];
    for (let i = 0; i < m - 1; i++)
      for (let j = i + 1; j < m; j++)
        for (let a = 0; a < n - 1; a++)
          for (let b = a + 1; b < n; b++) out.push([[i, j], [a, b]]);
    return out;
  }, [m, n]);

  const mc2 = C(m, 2);
  const nc2 = C(n, 2);
  const totalPara = mc2 * nc2;

  function stopAuto() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
  }
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);
  useEffect(() => {
    // 슬라이더 변경시 초기화
    stopAuto();
    setSelH(null);
    setSelD(null);
    setAutoIdx(0);
    setShowStep("");
  }, [m, n]);

  function showRandom() {
    stopAuto();
    if (combos.length === 0) return;
    const idx = Math.floor(Math.random() * combos.length);
    const [h, d] = combos[idx];
    setSelH(h as [number, number]);
    setSelD(d as [number, number]);
    setShowStep(`선택: 가로선 m${h[0] + 1}, m${h[1] + 1}  ×  사선 n${d[0] + 1}, n${d[1] + 1}`);
  }

  function startAuto() {
    if (running) {
      stopAuto();
      return;
    }
    setRunning(true);
    let idx = 0;
    setAutoIdx(0);
    const step = () => {
      if (idx >= combos.length) {
        stopAuto();
        return;
      }
      const [h, d] = combos[idx];
      setSelH(h as [number, number]);
      setSelD(d as [number, number]);
      setAutoIdx(idx + 1);
      setShowStep(
        `${idx + 1} / ${combos.length}:  m${h[0] + 1},m${h[1] + 1} × n${d[0] + 1},n${d[1] + 1}`,
      );
      idx++;
      timerRef.current = window.setTimeout(step, 550);
    };
    step();
  }

  function reset() {
    stopAuto();
    setSelH(null);
    setSelD(null);
    setAutoIdx(0);
    setShowStep("");
  }

  const hl = useMemo(() => hLinesY(m), [m]);
  const dl = useMemo(() => dLinesX0(n), [n]);

  // 평행사변형 꼭짓점
  let paraPoints: { x: number; y: number }[] | null = null;
  if (selH && selD) {
    const h1 = hl[selH[0]];
    const h2 = hl[selH[1]];
    const d1 = dl[selD[0]];
    const d2 = dl[selD[1]];
    paraPoints = [
      { x: ix(h1, d1), y: h1 },
      { x: ix(h1, d2), y: h1 },
      { x: ix(h2, d2), y: h2 },
      { x: ix(h2, d1), y: h2 },
    ];
  }

  return (
    <div className="space-y-3">
      <TitleSection
        head={<>📐 평행사변형의 개수를 조합으로</>}
        sub={
          <>
            m 개의 가로 평행선과 n 개의 사선 평행선으로 만들어지는 평행사변형의 개수
            = <b className="text-violet-200 font-mono">ₘC₂ × ₙC₂</b>
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <RangeRow label="가로 평행선 m =" min={2} max={6} value={m} onChange={setM} />
        <RangeRow label="사선 평행선 n =" min={2} max={6} value={n} onChange={setN} />
      </div>

      <div className="rounded-xl bg-slate-950/60 p-2">
        <svg
          viewBox={`0 0 ${PARA_W} ${PARA_H}`}
          className="mx-auto block w-full max-w-2xl"
        >
          {/* 평행사변형 (선보다 아래에 그리되, 강조선이 더 잘 보이게 stroke는 위에 별도) */}
          {paraPoints ? (
            <polygon
              points={paraPoints.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="rgba(255,220,50,.3)"
            />
          ) : null}

          {/* 사선 (n개) */}
          {dl.map((x0, i) => {
            const isSel = selD ? selD.includes(i) : false;
            const x1 = ix(-10, x0);
            const y1 = -10;
            const x2 = ix(PARA_H + 10, x0);
            const y2 = PARA_H + 10;
            return (
              <g key={`d${i}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isSel ? "#fb7185" : "rgba(200,90,90,.55)"}
                  strokeWidth={isSel ? 3 : 1.5}
                />
                {isSel ? (
                  <text
                    x={ix(18, x0) - 6}
                    y={28}
                    fill="#fda4af"
                    fontSize="13"
                    fontWeight="bold"
                  >
                    n{i + 1}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* 가로선 (m개) */}
          {hl.map((y, i) => {
            const isSel = selH ? selH.includes(i) : false;
            return (
              <g key={`h${i}`}>
                <line
                  x1={0}
                  y1={y}
                  x2={PARA_W}
                  y2={y}
                  stroke={isSel ? "#34d399" : "rgba(80,190,120,.55)"}
                  strokeWidth={isSel ? 3 : 1.5}
                />
                {isSel ? (
                  <text
                    x={8}
                    y={y - 7}
                    fill="#6ee7b7"
                    fontSize="13"
                    fontWeight="bold"
                  >
                    m{i + 1}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* 교차점 */}
          {hl.map((y, hi) =>
            dl.map((x0, di) => {
              const x = ix(y, x0);
              if (x < 0 || x > PARA_W) return null;
              const on =
                selH && selD && selH.includes(hi) && selD.includes(di);
              return (
                <circle
                  key={`dot-${hi}-${di}`}
                  cx={x}
                  cy={y}
                  r={on ? 6 : 3}
                  fill={on ? "#fbbf24" : "rgba(140,140,200,.55)"}
                />
              );
            }),
          )}

          {/* 평행사변형 윤곽선·꼭짓점 (점 위에) */}
          {paraPoints ? (
            <>
              <polygon
                points={paraPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
              />
              {paraPoints.map((p, i) => (
                <circle key={`pp${i}`} cx={p.x} cy={p.y} r={6} fill="#fbbf24" />
              ))}
            </>
          ) : null}
        </svg>
      </div>

      <FormulaBox>
        <span className="font-mono">
          {sub(m)}C₂ × {sub(n)}C₂ = {mc2} × {nc2} =
        </span>{" "}
        <Val>{totalPara}</Val> 개
      </FormulaBox>

      <div className="flex flex-wrap justify-center gap-2">
        <PrimaryBtn onClick={showRandom}>🎲 랜덤 평행사변형!</PrimaryBtn>
        <PrimaryBtn onClick={startAuto} active={running}>
          {running ? "⏸ 정지" : "▶ 자동 탐색"}
        </PrimaryBtn>
        <SecondaryBtn onClick={reset}>↺ 초기화</SecondaryBtn>
      </div>

      <p className="min-h-[1.25rem] text-center text-xs text-slate-400">
        {showStep}
      </p>
      {running ? (
        <ProgressBar pct={(autoIdx / Math.max(1, combos.length)) * 100} />
      ) : null}

      <InfoNote>
        가로 평행선 2 개를 선택하는 방법 <b className="text-amber-300">ₘC₂</b> 가지,
        사선 평행선 2 개를 선택하는 방법 <b className="text-amber-300">ₙC₂</b> 가지 —
        두 선택의 곱이 평행사변형의 총 개수입니다.
      </InfoNote>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 부분집합 (ₙCₖ, 합 = 2ⁿ)
// ═══════════════════════════════════════════════════════════

const ENAMES = ["a", "b", "c", "d", "e"];
const ECOLORS = [
  { ring: "border-rose-300", glow: "shadow-rose-400/60", bg: "bg-rose-400/70", dim: "bg-rose-400/20", text: "text-rose-200" },
  { ring: "border-teal-300", glow: "shadow-teal-400/60", bg: "bg-teal-400/70", dim: "bg-teal-400/20", text: "text-teal-200" },
  { ring: "border-amber-300", glow: "shadow-amber-400/60", bg: "bg-amber-400/70", dim: "bg-amber-400/20", text: "text-amber-200" },
  { ring: "border-violet-300", glow: "shadow-violet-400/60", bg: "bg-violet-400/70", dim: "bg-violet-400/20", text: "text-violet-200" },
  { ring: "border-sky-300", glow: "shadow-sky-400/60", bg: "bg-sky-400/70", dim: "bg-sky-400/20", text: "text-sky-200" },
];

function SubsetTab() {
  const [n, setN] = useState(4);
  const [k, setK] = useState(2);
  const [cur, setCur] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // n 변경시 k clamp
  function changeN(v: number) {
    setN(v);
    if (k > v) setK(v);
    setCur(0);
    setShowAll(false);
  }
  function changeK(v: number) {
    setK(v);
    setCur(0);
    setShowAll(false);
  }

  const elems = useMemo(() => ENAMES.slice(0, n), [n]);
  const allSubsets = useMemo(
    () =>
      combs(
        Array.from({ length: n }, (_, i) => i),
        k,
      ),
    [n, k],
  );

  const curIdxs = showAll
    ? Array.from({ length: n }, (_, i) => i)
    : allSubsets[cur] ?? [];

  function nextSub() {
    setShowAll(false);
    setCur((p) => (allSubsets.length === 0 ? 0 : (p + 1) % allSubsets.length));
  }
  function reset() {
    setCur(0);
    setShowAll(false);
  }

  const kBarMax = useMemo(() => {
    let mx = 0;
    for (let j = 0; j <= n; j++) mx = Math.max(mx, C(n, j));
    return mx;
  }, [n]);

  return (
    <div className="space-y-3">
      <TitleSection
        head={<>🧩 부분집합의 개수를 조합으로</>}
        sub={
          <>
            n 개의 원소를 가진 집합에서 k 개짜리 부분집합의 개수 ={" "}
            <b className="text-violet-200 font-mono">ₙCₖ</b>, 모든 부분집합의 합 ={" "}
            <b className="text-violet-200 font-mono">2ⁿ</b>
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <RangeRow label="원소의 개수 n =" min={3} max={5} value={n} onChange={changeN} />
        <RangeRow label="부분집합 크기 k =" min={0} max={n} value={k} onChange={changeK} />
      </div>

      {/* 원소 원형 */}
      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <div className="flex flex-wrap justify-center gap-3">
          {elems.map((e, i) => {
            const isOn = curIdxs.includes(i);
            const col = ECOLORS[i];
            return (
              <span
                key={i}
                className={
                  "inline-flex h-14 w-14 items-center justify-center rounded-full border-[3px] text-xl font-extrabold transition-all duration-300 " +
                  col.ring +
                  " " +
                  (isOn
                    ? `${col.bg} text-slate-900 scale-110 shadow-lg ${col.glow}`
                    : `${col.dim} ${col.text} scale-100`)
                }
              >
                {e}
              </span>
            );
          })}
        </div>
      </div>

      <FormulaBox>
        <span className="font-mono">
          집합{" "}
          <span className="text-amber-300">
            {"{"}
            {elems.join(", ")}
            {"}"}
          </span>{" "}
          에서 {sub(n)}C{sub(k)} =
        </span>{" "}
        <Val>{C(n, k)}</Val> 개의 부분집합
      </FormulaBox>

      <div className="flex flex-wrap justify-center gap-2">
        <PrimaryBtn onClick={nextSub}>▶ 다음 부분집합</PrimaryBtn>
        <PrimaryBtn onClick={() => setShowAll(true)} active={showAll}>
          🔍 모두 표시
        </PrimaryBtn>
        <SecondaryBtn onClick={reset}>↺ 초기화</SecondaryBtn>
      </div>

      <p className="min-h-[1.25rem] text-center text-xs text-slate-400">
        {showAll
          ? `총 ${allSubsets.length} 개의 ${sub(n)}C${sub(k)} 부분집합 모두 표시!`
          : allSubsets.length > 0
            ? `${cur + 1} / ${allSubsets.length}:  ${subsetLabel(allSubsets[cur] ?? [], elems)}`
            : ""}
      </p>

      <div className="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/60 p-2">
        <div className="flex flex-wrap gap-1.5">
          {allSubsets.map((s, i) => {
            const on = showAll || (i === cur && !showAll);
            return (
              <span
                key={i}
                className={
                  "rounded-md border px-2.5 py-1 font-mono text-xs transition " +
                  (on
                    ? "border-amber-300/55 bg-amber-300/15 text-amber-100"
                    : "border-white/10 bg-white/5 text-slate-300")
                }
              >
                {subsetLabel(s, elems)}
              </span>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-2 text-center text-sm font-bold text-cyan-300">
          모든 k 에 대한 ₙCₖ — 합산하면 2ⁿ!
        </p>
        <div className="flex h-32 items-end justify-center gap-3">
          {Array.from({ length: n + 1 }, (_, j) => {
            const cnt = C(n, j);
            const h = Math.max(4, (cnt / Math.max(1, kBarMax)) * 100);
            const active = j === k;
            return (
              <div key={j} className="flex flex-col items-center gap-1">
                <span
                  className={
                    "text-xs font-bold " +
                    (active ? "text-amber-300" : "text-violet-300")
                  }
                >
                  {cnt}
                </span>
                <div
                  className={
                    "w-10 rounded-t-md transition-all duration-500 " +
                    (active
                      ? "bg-gradient-to-t from-amber-400 to-rose-500"
                      : "bg-gradient-to-t from-violet-500 to-cyan-400")
                  }
                  style={{ height: `${h}px` }}
                />
                <span
                  className={
                    "text-[11px] " +
                    (active ? "font-bold text-amber-300" : "text-slate-400")
                  }
                >
                  k={j}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-center text-sm font-mono">
          {Array.from({ length: n + 1 }, (_, j) => `${sub(n)}C${sub(j)}`).join(" + ")}{" "}
          = <Val>{Math.pow(2, n)}</Val> = 2<sup>{n}</sup>
        </p>
      </div>
    </div>
  );
}

function subsetLabel(idxs: number[], elems: string[]): string {
  if (idxs.length === 0) return "∅";
  return "{" + idxs.map((i) => elems[i]).join(", ") + "}";
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 원 위의 삼각형 (ₙC₃)
// ═══════════════════════════════════════════════════════════

const TRI_W = 560;
const TRI_H = 460;

function circPts(n: number) {
  const cx = TRI_W / 2;
  const cy = TRI_H / 2;
  const r = Math.min(TRI_W, TRI_H) * 0.38;
  const pts: { x: number; y: number; angle: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), angle: a });
  }
  return { cx, cy, r, pts };
}

const TRI_COLORS = [
  "#fb7185",
  "#34d399",
  "#fbbf24",
  "#a78bfa",
  "#38bdf8",
  "#fb923c",
  "#a8e6cf",
  "#f472b6",
  "#88d8b0",
  "#fde047",
  "#c4b5fd",
  "#f87171",
  "#5eead4",
  "#fcd34d",
  "#7dd3fc",
  "#f9a8d4",
];

function TriangleTab() {
  const [n, setN] = useState(5);
  const [cur, setCur] = useState(0);
  const [allOn, setAllOn] = useState(false);

  const tris = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i < n - 2; i++)
      for (let j = i + 1; j < n - 1; j++)
        for (let k = j + 1; k < n; k++) out.push([i, j, k]);
    return out;
  }, [n]);
  const nc3 = C(n, 3);

  // n 변경시 초기화
  useEffect(() => {
    setCur(0);
    setAllOn(false);
  }, [n]);

  const geom = useMemo(() => circPts(n), [n]);
  const curTri = allOn ? null : tris[cur] ?? null;

  function nextTri() {
    setAllOn(false);
    setCur((p) => (tris.length === 0 ? 0 : (p + 1) % tris.length));
  }
  function toggleAll() {
    setAllOn((p) => !p);
  }
  function reset() {
    setCur(0);
    setAllOn(false);
  }

  const stepText = allOn
    ? `총 ${tris.length} 개 삼각형 모두 표시!`
    : curTri
      ? `${cur + 1} / ${tris.length}:  삼각형 P${curTri[0] + 1}−P${curTri[1] + 1}−P${curTri[2] + 1}`
      : "";

  const progress = allOn
    ? 100
    : curTri
      ? ((cur + 1) / Math.max(1, tris.length)) * 100
      : 0;

  return (
    <div className="space-y-3">
      <TitleSection
        head={<>🔺 원 위의 점으로 만드는 삼각형</>}
        sub={
          <>
            원 위에 서로 다른 n 개의 점이 있을 때, 3 개의 점을 선택하면 삼각형 하나가
            결정됩니다 — 삼각형의 개수 ={" "}
            <b className="text-violet-200 font-mono">ₙC₃</b>
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <RangeRow label="점의 개수 n =" min={4} max={8} value={n} onChange={setN} />
      </div>

      <div className="rounded-xl bg-slate-950/60 p-2">
        <svg
          viewBox={`0 0 ${TRI_W} ${TRI_H}`}
          className="mx-auto block w-full max-w-2xl"
        >
          {/* 원 외곽선 */}
          <circle
            cx={geom.cx}
            cy={geom.cy}
            r={geom.r}
            fill="none"
            stroke="rgba(124,111,255,.35)"
            strokeWidth="1.5"
          />

          {/* 모두 보기: 모든 삼각형 무지개색 */}
          {allOn && tris.length > 0
            ? tris.map((t, i) => {
                const col = TRI_COLORS[i % TRI_COLORS.length];
                return (
                  <polygon
                    key={`bg${i}`}
                    points={`${geom.pts[t[0]].x},${geom.pts[t[0]].y} ${geom.pts[t[1]].x},${geom.pts[t[1]].y} ${geom.pts[t[2]].x},${geom.pts[t[2]].y}`}
                    fill={col + "33"}
                    stroke={col + "88"}
                    strokeWidth="1"
                  />
                );
              })
            : null}

          {/* 현재 삼각형 (강조) */}
          {curTri ? (
            <polygon
              points={`${geom.pts[curTri[0]].x},${geom.pts[curTri[0]].y} ${geom.pts[curTri[1]].x},${geom.pts[curTri[1]].y} ${geom.pts[curTri[2]].x},${geom.pts[curTri[2]].y}`}
              fill="rgba(251,191,36,.32)"
              stroke="#fbbf24"
              strokeWidth="3"
            />
          ) : null}

          {/* 점 + 라벨 */}
          {geom.pts.map((p, i) => {
            const inT = curTri ? curTri.includes(i) : false;
            const lx = geom.cx + (geom.r + 22) * Math.cos(p.angle);
            const ly = geom.cy + (geom.r + 22) * Math.sin(p.angle);
            return (
              <g key={`pt${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={inT ? 9 : 7}
                  fill={inT ? "#fbbf24" : "#7c6fff"}
                  stroke={inT ? "#fff" : "#3ecef7"}
                  strokeWidth="2"
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={inT ? "#fbbf24" : "#cbd5e1"}
                  fontSize={inT ? 15 : 13}
                  fontWeight="bold"
                >
                  P{i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <InfoCard num={n} label="점의 개수 (n)" />
        <InfoCard num={nc3} label="ₙC₃ (삼각형 총수)" />
        <InfoCard num={allOn ? nc3 : curTri ? cur + 1 : 0} label="현재 번호" />
      </div>

      <FormulaBox>
        <span className="font-mono">
          {sub(n)}C₃ =
        </span>{" "}
        <Val>{nc3}</Val> 개의 삼각형
      </FormulaBox>

      <div className="flex flex-wrap justify-center gap-2">
        <PrimaryBtn onClick={nextTri}>▶ 다음 삼각형</PrimaryBtn>
        <PrimaryBtn onClick={toggleAll} active={allOn}>
          {allOn ? "🔲 초기화" : "🌈 모두 보기"}
        </PrimaryBtn>
        <SecondaryBtn onClick={reset}>↺ 초기화</SecondaryBtn>
      </div>

      <p className="min-h-[1.25rem] text-center text-xs text-slate-400">{stepText}</p>
      {progress > 0 ? <ProgressBar pct={progress} /> : null}

      <InfoNote>
        원 위의 서로 다른 n 개의 점에서 3 개를 선택하면 <b>항상 삼각형 하나가
        결정</b> 됩니다 (어떤 3 점도 일직선 위에 놓이지 않으므로).
      </InfoNote>
    </div>
  );
}

function InfoCard({ num, label }: { num: number; label: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center">
      <p className="text-2xl font-extrabold text-violet-300 sm:text-3xl">{num}</p>
      <p className="mt-1 text-[11px] text-slate-400">{label}</p>
    </div>
  );
}
