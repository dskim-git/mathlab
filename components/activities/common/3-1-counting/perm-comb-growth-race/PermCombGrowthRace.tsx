"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 수학 헬퍼 ─────────────────────────────────────────────
function fact(n: number): number {
  let v = 1;
  for (let i = 2; i <= n; i++) v *= i;
  return v;
}
function perm(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  let v = 1;
  for (let i = 0; i < r; i++) v *= n - i;
  return v;
}
function comb(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  return Math.round(perm(n, r) / fact(r));
}
function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}
function sub(n: number): string {
  return String(n)
    .split("")
    .map((d) => "₀₁₂₃₄₅₆₇₈₉"[Number(d)])
    .join("");
}

const PLAY_INTERVAL_MS = 750;

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "shape_difference",
    prompt:
      "r이 0에서 n까지 커질 때 ₙPᵣ과 ₙCᵣ의 막대 모양이 어떻게 달라지는지 자신의 말로 비교해 설명해 보세요.",
    kind: "text",
    placeholder: "예: 순열은 r이 커질수록 계속 증가하지만 증가폭은 줄어든다. 조합은 가운데(r ≈ n/2)에서 최댓값을 찍고 좌우 대칭으로 다시 줄어든다.",
  },
  {
    id: "symmetry_reason",
    prompt:
      "조합 그래프가 좌우 대칭(산 모양)이 되는 까닭을 ₙCᵣ = ₙCₙ₋ᵣ 의 의미와 연결해 설명해 보세요.",
    kind: "text",
    placeholder: "예: n명 중 r명을 뽑는 경우의 수와 n−r명을 '안 뽑는' 경우의 수가 같으므로, r 자리와 (n−r) 자리의 값이 같아져 대칭이 된다.",
  },
];

export default function PermCombGrowthRace() {
  const [n, setN] = useState(6);
  const [r, setR] = useState(3);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef<number | null>(null);
  const aliveRef = useRef(true);
  const nRef = useRef(n);
  nRef.current = n;

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (playRef.current !== null) window.clearTimeout(playRef.current);
    };
  }, []);

  function setN_clamped(next: number) {
    stopPlay();
    setN(next);
    if (r > next) setR(next);
  }

  function setR_clamped(next: number) {
    stopPlay();
    setR(next);
  }

  function startPlay() {
    if (playing) return;
    setPlaying(true);
    setR(0);
    const tick = () => {
      if (!aliveRef.current) return;
      // rRef는 setR 후 다음 렌더에 갱신되므로, 여기서는 함수형 업데이트 사용.
      setR((curR) => {
        const nv = nRef.current;
        if (curR >= nv) {
          stopPlay();
          return curR;
        }
        return curR + 1;
      });
      playRef.current = window.setTimeout(tick, PLAY_INTERVAL_MS);
    };
    playRef.current = window.setTimeout(tick, PLAY_INTERVAL_MS);
  }

  function stopPlay() {
    if (playRef.current !== null) {
      window.clearTimeout(playRef.current);
      playRef.current = null;
    }
    setPlaying(false);
  }

  function reset() {
    stopPlay();
    setN(6);
    setR(3);
  }

  const P = useMemo(() => perm(n, r), [n, r]);
  const C = useMemo(() => comb(n, r), [n, r]);
  const R_FACT = useMemo(() => fact(r), [r]);
  const permValues = useMemo(() => Array.from({ length: n + 1 }, (_, i) => perm(n, i)), [n]);
  const combValues = useMemo(() => Array.from({ length: n + 1 }, (_, i) => comb(n, i)), [n]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">🏁 순열 vs 조합 — r 증가 레이스</h3>
        <p className="mt-2 leading-7 text-slate-300">
          같은 n에서 <b className="text-cyan-200">r을 0 → n으로</b> 늘릴 때 순열 ₙPᵣ과 조합 ₙCᵣ가 어떻게 달라지는지
          막대그래프로 함께 비교해 보세요.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <span className="rounded-full border border-blue-400/45 bg-blue-400/10 px-4 py-1.5 font-mono text-sm font-bold text-blue-200">
            ₙPᵣ = n × (n−1) × ⋯ × (n−r+1)
          </span>
          <span className="rounded-full border border-amber-400/45 bg-amber-400/10 px-4 py-1.5 font-mono text-sm font-bold text-amber-200">
            ₙCᵣ = ₙPᵣ ÷ r!
          </span>
        </div>
      </div>

      {/* ─── 컨트롤 ─── */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid items-center gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <Slider label="n =" min={3} max={10} value={n} onChange={setN_clamped} tone="emerald" />
          <Slider label="r =" min={0} max={n} value={r} onChange={setR_clamped} tone="pink" pulse />
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={playing ? stopPlay : startPlay}
              className={
                playing
                  ? "rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
                  : "rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
              }
            >
              {playing ? "■ 정지" : "▶ r 자동 재생"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-violet-400/45 bg-violet-400/10 px-4 py-2 text-sm font-bold text-violet-200 transition hover:bg-violet-400/20"
            >
              ↻ 초기화
            </button>
          </div>
        </div>
      </div>

      {/* ─── 순열 차트 ─── */}
      <div className="mt-4 rounded-2xl border border-blue-400/30 bg-gradient-to-b from-blue-400/[0.06] to-white/[0.02] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-black text-blue-300">🔵 순열 ₙPᵣ</p>
          <span className="rounded-lg border border-blue-400/35 bg-blue-400/10 px-3 py-1 font-mono text-xs font-bold text-blue-100">
            r ↑ ⇒ 값 계속 ↑  |  곱하는 수는 ×n → ×1 로 ↓
          </span>
        </div>
        <RaceChartSVG kind="P" n={n} r={r} values={permValues} />
      </div>

      {/* ─── 조합 차트 ─── */}
      <div className="mt-4 rounded-2xl border border-amber-400/30 bg-gradient-to-b from-amber-400/[0.06] to-white/[0.02] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-black text-amber-300">🟡 조합 ₙCᵣ</p>
          <span className="rounded-lg border border-amber-400/35 bg-amber-400/10 px-3 py-1 font-mono text-xs font-bold text-amber-100">
            r ↑ ⇒ 증가 → 최댓값 → 감소  |  좌우 대칭 (산 모양!)
          </span>
        </div>
        <RaceChartSVG kind="C" n={n} r={r} values={combValues} />
      </div>

      {/* ─── 비교 패널 ─── */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 flex items-center gap-2 text-base font-bold text-slate-100">
          📍 지금 선택한 r 에서
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <CompareCell
            tone="perm"
            label={
              <span>
                {sub(n)}P{sub(r)}{" "}
                <span className="text-xs font-normal text-slate-400">(순열)</span>
              </span>
            }
            value={fmt(P)}
            formula={
              r === 0
                ? "= 1 (약속)"
                : r === 1
                ? `${n}`
                : Array.from({ length: r }, (_, i) => n - i).join(" × ")
            }
          />
          <CompareCell
            tone="comb"
            label={
              <span>
                {sub(n)}C{sub(r)}{" "}
                <span className="text-xs font-normal text-slate-400">(조합)</span>
              </span>
            }
            value={fmt(C)}
            formula={r === 0 ? "= 1 (약속)" : `${fmt(P)} ÷ ${r}!`}
          />
          <CompareCell
            tone="ratio"
            label={<span>ₙPᵣ ÷ ₙCᵣ = r!</span>}
            value={fmt(R_FACT)}
            formula={`= ${r}!`}
          />
        </div>
        <div className="mt-3 rounded-xl border border-dashed border-violet-400/50 bg-gradient-to-r from-blue-400/[0.06] via-violet-400/[0.1] to-amber-400/[0.06] px-4 py-3 text-center font-mono text-base font-bold leading-7">
          <span className="text-blue-300">
            {sub(n)}P{sub(r)}
          </span>{" "}
          = <span className="text-pink-300">{r}!</span> ×{" "}
          <span className="text-amber-300">
            {sub(n)}C{sub(r)}
          </span>
          {"  ⟶  "}
          <span className="text-blue-300">{fmt(P)}</span> ={" "}
          <span className="text-pink-300">{fmt(R_FACT)}</span> ×{" "}
          <span className="text-amber-300">{fmt(C)}</span> ✓
        </div>
      </div>

      {/* ─── 인사이트 카드 2개 ─── */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border-l-4 border-blue-400 bg-gradient-to-r from-blue-400/[0.07] to-white/[0.02] p-4">
          <p className="mb-2 text-base font-black text-blue-300">🔵 순열의 패턴</p>
          <p className="text-sm leading-7 text-slate-300">
            매번 곱하는 수: <PermMulList n={n} r={r} />
            <br />→ <b className="text-white">점점 작은 수</b>를 곱하므로
            <br />값은 커지지만 <b className="text-white">증가하는 비율은 점점 ↓</b>
          </p>
        </div>
        <div className="rounded-2xl border-l-4 border-amber-400 bg-gradient-to-r from-amber-400/[0.07] to-white/[0.02] p-4">
          <p className="mb-2 text-base font-black text-amber-300">🟡 조합의 패턴</p>
          <p className="text-sm leading-7 text-slate-300">
            이전 항과 비율: <CombRatioBadge n={n} r={r} />
            <br />→ <b className="text-white">비율 &gt; 1</b> 이면 증가,
            <br /><b className="text-white">비율 &lt; 1</b> 이면 감소 (보통 r &gt; n/2)
          </p>
        </div>
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 슬라이더 ─────────────────────────────────────────────
function Slider({
  label,
  min,
  max,
  value,
  onChange,
  tone,
  pulse = false,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  tone: "emerald" | "pink";
  /** value 가 바뀔 때마다 배지에 펄스 애니메이션을 다시 트리거. */
  pulse?: boolean;
}) {
  const accent = tone === "emerald" ? "accent-emerald-400" : "accent-pink-500";
  const badge =
    tone === "emerald"
      ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-200"
      : "border-pink-400/55 bg-pink-400/15 text-pink-200";
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="whitespace-nowrap font-mono text-base font-extrabold text-slate-300">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-2 min-w-[120px] flex-1 cursor-pointer ${accent} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40`}
      />
      {/* pulse=true 면 value 가 바뀔 때 key 가 바뀌어 배지가 재마운트 → CSS animation 재실행. */}
      <span
        key={pulse ? value : undefined}
        className={`min-w-[58px] rounded-xl border-2 px-3 py-1 text-center font-mono text-2xl font-black tabular-nums ${badge} ${pulse ? "animate-[pulseR_0.45s_ease]" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── 비교 셀 ──────────────────────────────────────────────
function CompareCell({
  tone,
  label,
  value,
  formula,
}: {
  tone: "perm" | "comb" | "ratio";
  label: React.ReactNode;
  value: string;
  formula: string;
}) {
  const cls =
    tone === "perm"
      ? { box: "border-blue-400/40 bg-blue-400/10", val: "text-blue-300" }
      : tone === "comb"
      ? { box: "border-amber-400/40 bg-amber-400/10", val: "text-amber-300" }
      : { box: "border-violet-400/40 bg-violet-400/10", val: "text-violet-300" };
  return (
    <div className={`rounded-xl border-2 px-3 py-3 text-center ${cls.box}`}>
      <p className="font-mono text-sm font-bold text-slate-300">{label}</p>
      <p className={`mt-1 font-mono text-3xl font-black tabular-nums ${cls.val}`}>{value}</p>
      <p className="mt-1 break-words font-mono text-xs leading-5 text-slate-400">{formula}</p>
    </div>
  );
}

function PermMulList({ n, r }: { n: number; r: number }) {
  if (r === 0) return <span className="text-slate-400">(아직 곱한 수 없음)</span>;
  const limit = Math.min(r, 7);
  const list = Array.from({ length: limit }, (_, i) => `×${n - i}`);
  if (r > 7) list.push("…");
  return (
    <span className="ml-1 inline-block rounded-md bg-white/15 px-2 py-0.5 font-mono text-sm font-bold text-white">
      {list.join(" ")}
    </span>
  );
}

function CombRatioBadge({ n, r }: { n: number; r: number }) {
  if (r === 0)
    return (
      <span className="ml-1 inline-block rounded-md bg-white/15 px-2 py-0.5 font-mono text-sm font-bold text-white">
        (시작점)
      </span>
    );
  const num = n - r + 1;
  const den = r;
  const val = num / den;
  return (
    <span className="ml-1 inline-block rounded-md bg-white/15 px-2 py-0.5 font-mono text-sm font-bold text-white">
      ×{num}/{den} = {val.toFixed(2)}
    </span>
  );
}

// ─── SVG 막대 차트 ─────────────────────────────────────────
function RaceChartSVG({
  kind,
  n,
  r,
  values,
}: {
  kind: "P" | "C";
  n: number;
  r: number;
  values: number[];
}) {
  const isP = kind === "P";
  const CW = 780, CH = 380;
  const PL = 55, PR = 22, PT = 48, PB = 130;
  const PW = CW - PL - PR;
  const PH = CH - PT - PB;
  const cellW = PW / (n + 1);
  const barW = cellW * 0.66;
  const maxV = Math.max(...values, 1);

  // useId 로 안전한 gradient/filter id 생성(공백·콜론 제거).
  const uid = useId().replace(/[:]/g, "");
  const idAct = `act_${uid}`;
  const idDim = `dim_${uid}`;
  const idGlow = `glow_${uid}`;

  const stopsAct = isP
    ? ["#bfdbfe", "#60a5fa", "#1d4ed8"]
    : ["#fef08a", "#fbbf24", "#b45309"];
  const stopsDim = isP
    ? ["rgba(96,165,250,0.5)", "rgba(37,99,235,0.22)"]
    : ["rgba(251,191,36,0.5)", "rgba(180,83,9,0.22)"];
  const activeStroke = isP ? "#60a5fa" : "#fbbf24";
  const activeText = isP ? "#dbeafe" : "#fef3c7";

  return (
    <div className="overflow-x-auto rounded-xl bg-slate-900/40">
      <svg viewBox={`0 0 ${CW} ${CH}`} className="mx-auto block w-full min-w-[560px] max-w-[760px]" role="img" aria-label={isP ? "순열 막대 차트" : "조합 막대 차트"}>
        <defs>
          <linearGradient id={idAct} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={stopsAct[0]} />
            <stop offset="0.5" stopColor={stopsAct[1]} />
            <stop offset="1" stopColor={stopsAct[2]} />
          </linearGradient>
          <linearGradient id={idDim} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={stopsDim[0]} />
            <stop offset="1" stopColor={stopsDim[1]} />
          </linearGradient>
          <filter id={idGlow} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* baseline */}
        <line x1={PL} y1={PT + PH} x2={PL + PW} y2={PT + PH} stroke="rgba(255,255,255,0.28)" strokeWidth={1.5} />

        {/* bars + labels */}
        {values.map((v, i) => {
          const cx = PL + i * cellW + cellW / 2;
          const x = cx - barW / 2;
          const h = Math.max((v / maxV) * PH, 2);
          const y = PT + PH - h;
          const active = i === r;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={5}
                ry={5}
                fill={`url(#${active ? idAct : idDim})`}
                stroke={active ? activeStroke : "none"}
                strokeWidth={active ? 2.8 : 0}
                filter={active ? `url(#${idGlow})` : undefined}
              />
              {active ? (
                <text
                  x={cx}
                  y={y - 12}
                  textAnchor="middle"
                  fontSize={18}
                  fontWeight={900}
                  fill={activeText}
                  fontFamily="Courier New,monospace"
                  paintOrder="stroke"
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth={3}
                >
                  {fmt(v)}
                </text>
              ) : h > 30 ? (
                <text
                  x={cx}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize={11.5}
                  fontWeight={700}
                  fill="rgba(255,255,255,0.6)"
                  fontFamily="Courier New,monospace"
                >
                  {fmt(v)}
                </text>
              ) : null}
              <text
                x={cx}
                y={PT + PH + 24}
                textAnchor="middle"
                fontSize={active ? 17 : 14}
                fontWeight={active ? 900 : 700}
                fill={active ? "#fff" : "rgba(255,255,255,0.62)"}
                fontFamily="Courier New,monospace"
              >
                r={i}
              </text>
            </g>
          );
        })}

        {/* multipliers (배지) */}
        {Array.from({ length: n }, (_, j) => {
          const i = j + 1; // 1..n
          const cxPrev = PL + (i - 1) * cellW + cellW / 2;
          const cxCurr = PL + i * cellW + cellW / 2;
          const midX = (cxPrev + cxCurr) / 2;
          const mulRaw = isP ? n - i + 1 : (n - i + 1) / i;
          const mulText = isP ? `×${n - i + 1}` : `×${n - i + 1}/${i}`;
          const isActive = i === r;
          const color = mulRaw >= 1 ? "#34d399" : "#fb7185";
          const opacity = isActive ? 1 : 0.55;
          const mulY = PT + PH + 62;
          return (
            <g key={`m${i}`}>
              {isActive ? (
                <rect
                  x={midX - 30}
                  y={mulY - 13}
                  width={60}
                  height={22}
                  rx={11}
                  fill="rgba(255,255,255,0.15)"
                  stroke={color}
                  strokeWidth={1.8}
                />
              ) : null}
              <text
                x={midX}
                y={mulY + 4}
                textAnchor="middle"
                fontSize={isActive ? 14 : 11.5}
                fontWeight={isActive ? 900 : 800}
                fill={color}
                opacity={opacity}
                fontFamily="Courier New,monospace"
              >
                {mulText}
              </text>
            </g>
          );
        })}

        {/* axis caption */}
        <text
          x={PL + PW / 2}
          y={PT + PH + 98}
          textAnchor="middle"
          fontSize={13.5}
          fill="rgba(255,255,255,0.55)"
          fontStyle="italic"
        >
          선택할 개수 r  (아래 배지 = 이전 항 → 다음 항으로 곱하는 비율)
        </text>
      </svg>
    </div>
  );
}
