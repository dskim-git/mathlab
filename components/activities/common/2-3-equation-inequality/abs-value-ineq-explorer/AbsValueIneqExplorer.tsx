"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "distance_meaning",
    prompt:
      "|x − a| 가 수직선 위에서 어떤 의미를 가지는지 설명하고, 이것이 절댓값 부등식 풀이에서 왜 핵심이 되는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: |x − a| 는 수직선 위에서 점 x 와 점 a 사이의 거리이다. 그래서 |x − a| < r 은 ‘a 와의 거리가 r 보다 작은 점’ 의 집합 = a 를 중심으로 좌우 r 만큼 떨어진 구간 (a − r, a + r) 가 자연스럽게 보인다. 거리로 해석하면 공식이 외울 게 아니라 그림으로 보여서 자동으로 답이 나온다.",
  },
  {
    id: "split_intervals",
    prompt:
      "|x + 1| + |x − 4| 처럼 절댓값 기호가 두 개 이상일 때 왜 구간을 나누어야 하나요? ‘임계점’ 이 무엇인지 포함해서 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 절댓값 안의 식이 양수냐 음수냐에 따라 절댓값을 벗기는 방식이 달라진다. 그래서 각 절댓값 안의 식 = 0 이 되는 x 값 (= 임계점) 을 기준으로 수직선을 구간으로 나누고, 각 구간에서 부호가 바뀌지 않으므로 절댓값을 일관되게 벗겨 일반 일차부등식으로 풀 수 있다.",
  },
];

// ─── 표기 헬퍼 ────────────────────────────────────────────
function X() {
  return <em className="font-serif italic text-amber-200">x</em>;
}

// ─── 메인 ─────────────────────────────────────────────────
type TabId = 1 | 2 | 3;

export default function AbsValueIneqExplorer() {
  const [tab, setTab] = useState<TabId>(1);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">📐 절댓값 부등식 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          절댓값을 <b className="text-amber-200">거리</b> 로 시각화하고, |<X />| &lt;
          a · |<X />| &gt; a 공식을 수직선에서 탐구한 뒤, 범위를 나누는 실전 문제를
          단계별로 풀어 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <TabBtn active={tab === 1} onClick={() => setTab(1)}>
          📏 거리 탐구
        </TabBtn>
        <TabBtn active={tab === 2} onClick={() => setTab(2)}>
          🔭 공식 탐구
        </TabBtn>
        <TabBtn active={tab === 3} onClick={() => setTab(3)}>
          🎯 실전 풀기
        </TabBtn>
      </div>

      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <Tab1Distance />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <Tab2Formula />
      </div>
      <div className={tab === 3 ? "mt-5" : "mt-5 hidden"}>
        <Tab3Problems />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl px-2 py-2.5 text-xs font-bold transition sm:text-sm " +
        (active
          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-amber-200")
      }
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  공용 — SVG 수직선 (axis + ticks)
// ═══════════════════════════════════════════════════════════

function NumberAxis({
  W,
  y,
  xMin,
  xMax,
  showTickLabels = true,
}: {
  W: number;
  y: number;
  xMin: number;
  xMax: number;
  showTickLabels?: boolean;
}) {
  const ticks: number[] = [];
  for (let i = xMin + 1; i < xMax; i++) ticks.push(i);
  const tx = (v: number) => ((v - xMin) / (xMax - xMin)) * W;

  return (
    <g>
      <line x1={0} x2={W} y1={y} y2={y} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <polygon
        points={`${W},${y} ${W - 8},${y - 4} ${W - 8},${y + 4}`}
        fill="rgba(255,255,255,0.2)"
      />
      {ticks.map((i) => (
        <g key={i}>
          <line
            x1={tx(i)}
            x2={tx(i)}
            y1={y - 3}
            y2={y + 3}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
          {showTickLabels && i % 2 === 0 ? (
            <text
              x={tx(i)}
              y={y + 16}
              fontSize="10"
              textAnchor="middle"
              fill="rgba(255,255,255,0.35)"
            >
              {i}
            </text>
          ) : null}
        </g>
      ))}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 거리 탐구
// ═══════════════════════════════════════════════════════════

function Tab1Distance() {
  const [x, setX] = useState(3);
  const [a, setA] = useState(0);
  const dist = Math.abs(x - a);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-amber-100">
          📏 절댓값 = 수직선 위의 거리!
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          슬라이더로 <b className="text-amber-300">x</b> 와{" "}
          <b className="text-cyan-300">a</b> 를 움직이면서 <b>|x − a|</b> 가 두 점 사이의
          거리임을 확인하세요.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <SliderRow
          label="점 x"
          color="text-amber-300"
          min={-9}
          max={9}
          value={x}
          onChange={setX}
        />
        <SliderRow
          label="점 a"
          color="text-cyan-300"
          min={-5}
          max={5}
          value={a}
          onChange={setA}
        />

        {/* 거리 표시 */}
        <div className="mt-3 rounded-xl border border-amber-300/40 bg-amber-300/[0.08] p-4 text-center">
          <p className="font-mono text-4xl font-extrabold text-amber-200">{dist}</p>
          <p className="mt-1 font-serif text-base italic text-amber-100">
            |{x} − {a === 0 ? "0" : a}| = {dist}
          </p>
        </div>

        <DistanceCanvas x={x} a={a} />

        <div className="mt-3 grid gap-2 text-sm leading-7 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-300/30 bg-amber-300/[0.06] p-3">
            <p className="text-xs font-bold text-amber-300">a = 0 일 때</p>
            <p className="mt-1 font-serif italic text-amber-100">
              |x| = x 와 원점 0 사이의 거리
            </p>
          </div>
          <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/[0.06] p-3">
            <p className="text-xs font-bold text-cyan-300">a ≠ 0 일 때</p>
            <p className="mt-1 font-serif italic text-amber-100">
              |x − a| = x 와 점 a 사이의 거리
            </p>
          </div>
        </div>
      </div>

      {/* 핵심 정리 */}
      <div className="rounded-2xl border border-amber-300/30 bg-white/[0.04] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
          🔑 핵심 정리
        </p>
        <ol className="mt-2 space-y-2 text-sm leading-7 text-slate-200">
          <li>
            <b className="text-amber-300">①</b> |x| ≥ 0 → 절댓값은 항상{" "}
            <b className="text-amber-200">0 이상</b>.
          </li>
          <li>
            <b className="text-amber-300">②</b> |x| ={" "}
            <span className="font-serif italic text-amber-100">x</span> (x ≥ 0),{" "}
            <span className="font-serif italic text-amber-100">−x</span> (x &lt; 0).
          </li>
          <li>
            <b className="text-amber-300">③</b> 절댓값 기호 안의 식 = 0 이 되는 x 의 값이{" "}
            <b className="text-amber-200">범위를 나누는 기준</b> (임계점).
          </li>
        </ol>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  color,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  color: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className={"text-xs font-bold " + color}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        aria-label={label}
        className="flex-1 accent-amber-400"
      />
      <span className={"w-6 text-center font-mono text-sm " + color}>{value}</span>
    </div>
  );
}

function DistanceCanvas({ x, a }: { x: number; a: number }) {
  const W = 600;
  const H = 140;
  const xMin = -10;
  const xMax = 10;
  const tx = (v: number) => ((v - xMin) / (xMax - xMin)) * W;
  const y = 70;

  const xa = Math.min(tx(x), tx(a));
  const xb = Math.max(tx(x), tx(a));
  const arcR = (xb - xa) / 2;
  const dist = Math.abs(x - a);
  const arcMid = (xa + xb) / 2;

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label="x 와 a 사이의 거리"
      >
        <NumberAxis W={W} y={y} xMin={xMin} xMax={xMax} />

        {/* 거리 바 */}
        {xb > xa ? (
          <rect
            x={xa}
            y={y - 10}
            width={xb - xa}
            height={20}
            fill="#f59e0b"
            opacity="0.25"
          />
        ) : null}

        {/* 위쪽 arc */}
        {xb > xa ? (
          <path
            d={`M ${xa} ${y} A ${arcR} ${arcR} 0 0 1 ${xb} ${y}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
          />
        ) : null}

        {/* 거리 라벨 (arc 위) */}
        {dist > 0 ? (
          <text
            x={arcMid}
            y={y - arcR - 6}
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
            fill="#fbbf24"
          >
            {dist}
          </text>
        ) : null}

        {/* 점 a */}
        <circle
          cx={tx(a)}
          cy={y}
          r={7}
          fill={a === 0 ? "rgba(255,255,255,0.6)" : "#60a5fa"}
          stroke="#fff"
          strokeWidth="2"
        />
        <text
          x={tx(a)}
          y={y + 28}
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          fill={a === 0 ? "rgba(255,255,255,0.9)" : "#93c5fd"}
        >
          {a === 0 ? "0" : `a = ${a}`}
        </text>

        {/* 점 x */}
        <circle cx={tx(x)} cy={y} r={8} fill="#f59e0b" stroke="#fde68a" strokeWidth="2" />
        <text
          x={tx(x)}
          y={y + 28}
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
          fill="#fde68a"
        >
          x = {x}
        </text>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 공식 탐구
// ═══════════════════════════════════════════════════════════

function Tab2Formula() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-orange-100">
          🔭 공식 탐구 — |x| &lt; a / |x| &gt; a 와 |x − a| 확장
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          거리 관점으로 두 가지 형태의 공식을 시각화한 뒤, 중심 a 와 반지름 r 을
          움직여 가며 직접 확인하세요.
        </p>
      </div>

      {/* 정리 카드 — |x| < a / |x| > a */}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormulaCard
          tag="① < 형"
          tagCls="border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
          main={
            <>
              |x| &lt; a &nbsp;(a &gt; 0)
            </>
          }
          arrow="⬇ 원점에서 거리가 a 미만"
          sol="−a < x < a"
          solCls="bg-emerald-400/10 text-emerald-200 border-emerald-400/30"
          memo="수직선: −a 와 a 사이의 구간 (경계 포함 여부 — ≤ 이면 경계 포함)"
        />
        <FormulaCard
          tag="② > 형"
          tagCls="border-rose-400/40 bg-rose-400/15 text-rose-200"
          main={
            <>
              |x| &gt; a &nbsp;(a &gt; 0)
            </>
          }
          arrow="⬇ 원점에서 거리가 a 초과"
          sol="x < −a 또는 x > a"
          solCls="bg-rose-400/10 text-rose-200 border-rose-400/30"
          memo="수직선: −a 왼쪽 + a 오른쪽 두 구간 (경계 포함 여부 — ≥ 이면 경계 포함)"
        />
      </div>

      {/* 인터랙티브 1 — |x| {op} a */}
      <BasicInteractive />

      {/* 정리 카드 — |x − a| 확장 */}
      <div className="rounded-2xl border border-amber-300/30 bg-amber-300/[0.04] p-4">
        <p className="text-sm font-extrabold text-amber-300">
          💡 |x − a| 로 확장 — 중심 a 가 0 이 아니어도 같은 원리!
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <FormulaCard
            tag="① < 형"
            tagCls="border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
            main={<>|x − a| &lt; r</>}
            arrow="⬇ 점 a 에서 거리 r 미만"
            sol="a − r < x < a + r"
            solCls="bg-emerald-400/10 text-emerald-200 border-emerald-400/30"
          />
          <FormulaCard
            tag="② > 형"
            tagCls="border-rose-400/40 bg-rose-400/15 text-rose-200"
            main={<>|x − a| &gt; r</>}
            arrow="⬇ 점 a 에서 거리 r 초과"
            sol="x < a − r 또는 x > a + r"
            solCls="bg-rose-400/10 text-rose-200 border-rose-400/30"
          />
        </div>
      </div>

      {/* 인터랙티브 2 — |x − a| {op} r */}
      <ExtendedInteractive />
    </div>
  );
}

function FormulaCard({
  tag,
  tagCls,
  main,
  arrow,
  sol,
  solCls,
  memo,
}: {
  tag: string;
  tagCls: string;
  main: ReactNode;
  arrow: string;
  sol: string;
  solCls: string;
  memo?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <span
        className={
          "inline-block rounded-md border px-2 py-0.5 text-[10px] font-extrabold " + tagCls
        }
      >
        {tag}
      </span>
      <p className="mt-2 text-center font-serif text-base italic text-amber-100">{main}</p>
      <p className="mt-1 text-center text-[11px] text-slate-400">{arrow}</p>
      <p
        className={
          "mt-2 rounded-md border px-2 py-1.5 text-center font-serif text-sm font-bold " + solCls
        }
      >
        {sol}
      </p>
      {memo ? (
        <p className="mt-2 text-[11px] leading-6 text-slate-400">{memo}</p>
      ) : null}
    </div>
  );
}

type Mode = "lt" | "gt";

function BasicInteractive() {
  const [mode, setMode] = useState<Mode>("lt");
  const [a, setA] = useState(3);
  const exprText = mode === "lt" ? `|x| < ${a}` : `|x| > ${a}`;
  const solText =
    mode === "lt" ? `−${a} < x < ${a}` : `x < −${a} 또는 x > ${a}`;
  const solCls =
    mode === "lt"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
      : "border-rose-400/40 bg-rose-400/10 text-rose-200";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-sm font-bold text-orange-200">🔭 수직선으로 직접 확인!</p>
      <p className="mt-1 text-xs leading-6 text-slate-400">
        a 값과 부등호 방향을 바꿔가면서 수직선의 해가 어떻게 달라지는지 관찰하세요.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <ModeBtn active={mode === "lt"} onClick={() => setMode("lt")} tone="emerald">
          |x| &lt; a &nbsp;(−a &lt; x &lt; a)
        </ModeBtn>
        <ModeBtn active={mode === "gt"} onClick={() => setMode("gt")} tone="rose">
          |x| &gt; a &nbsp;(x &lt; −a 또는 x &gt; a)
        </ModeBtn>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400">a</span>
        <input
          type="range"
          min={1}
          max={8}
          step={1}
          value={a}
          onChange={(e) => setA(parseInt(e.target.value, 10))}
          aria-label="a 값"
          className="flex-1 accent-amber-400"
        />
        <span className="w-6 text-center font-mono text-sm text-amber-300">{a}</span>
      </div>

      <p className="mt-2 text-sm leading-7 text-slate-300">
        <span className="font-serif text-base italic text-amber-100">{exprText}</span>{" "}
        의 해 :{" "}
        <span className="font-serif font-bold text-emerald-200">{solText}</span>
      </p>

      <BasicCanvas mode={mode} a={a} />

      <p
        className={
          "mt-2 rounded-md border px-3 py-1.5 text-center text-sm font-bold " + solCls
        }
      >
        해: {solText}
      </p>
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone: "emerald" | "rose";
  children: ReactNode;
}) {
  const activeCls =
    tone === "emerald"
      ? "border-emerald-300 bg-emerald-400/20 text-emerald-100"
      : "border-rose-300 bg-rose-400/20 text-rose-100";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-lg border-2 px-2 py-1.5 text-xs font-bold transition " +
        (active
          ? activeCls
          : "border-white/15 bg-white/5 text-slate-300 hover:border-white/25")
      }
    >
      {children}
    </button>
  );
}

function BasicCanvas({ mode, a }: { mode: Mode; a: number }) {
  const W = 600;
  const H = 90;
  const xMin = -10;
  const xMax = 10;
  const tx = (v: number) => ((v - xMin) / (xMax - xMin)) * W;
  const y = 50;
  const col = mode === "lt" ? "#34d399" : "#f87171";

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label="|x| 부등식 해 수직선"
      >
        <NumberAxis W={W} y={y} xMin={xMin} xMax={xMax} />

        {mode === "lt" ? (
          <rect
            x={tx(-a)}
            y={y - 8}
            width={tx(a) - tx(-a)}
            height={16}
            fill={col}
            opacity="0.3"
          />
        ) : (
          <>
            <rect x={0} y={y - 8} width={tx(-a)} height={16} fill={col} opacity="0.3" />
            <rect
              x={tx(a)}
              y={y - 8}
              width={W - tx(a)}
              height={16}
              fill={col}
              opacity="0.3"
            />
          </>
        )}

        {/* 경계점 (열림 원, < 형) */}
        <EndDot x={tx(-a)} y={y} color={col} filled={false} label={-a} />
        <EndDot x={tx(a)} y={y} color={col} filled={false} label={a} />
      </svg>
    </div>
  );
}

function EndDot({
  x,
  y,
  color,
  filled,
  label,
}: {
  x: number;
  y: number;
  color: string;
  filled: boolean;
  label: number;
}) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={5}
        fill={filled ? color : "#0d0800"}
        stroke={color}
        strokeWidth="2"
      />
      <text
        x={x}
        y={y - 12}
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
        fill={color}
      >
        {label}
      </text>
    </g>
  );
}

function ExtendedInteractive() {
  const [mode, setMode] = useState<Mode>("lt");
  const [a, setA] = useState(2);
  const [r, setR] = useState(5);
  const lo = a - r;
  const hi = a + r;
  const aStr = a >= 0 ? `${a}` : `(${a})`;
  const opSym = mode === "lt" ? "<" : ">";
  const solText =
    mode === "lt" ? `${lo} < x < ${hi}` : `x < ${lo} 또는 x > ${hi}`;
  const solCls =
    mode === "lt"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
      : "border-rose-400/40 bg-rose-400/10 text-rose-200";

  return (
    <div className="rounded-2xl border border-amber-300/30 bg-white/[0.04] p-4">
      <p className="text-sm font-bold text-amber-200">
        🎚️ |x − a| 인터랙티브 — 기준 a 와 반지름 r 을 바꿔가며 확인
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <ModeBtn active={mode === "lt"} onClick={() => setMode("lt")} tone="emerald">
          |x − a| &lt; r
        </ModeBtn>
        <ModeBtn active={mode === "gt"} onClick={() => setMode("gt")} tone="rose">
          |x − a| &gt; r
        </ModeBtn>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-bold text-cyan-300">기준 a</span>
        <input
          type="range"
          min={-5}
          max={5}
          step={1}
          value={a}
          onChange={(e) => setA(parseInt(e.target.value, 10))}
          aria-label="기준 a"
          className="flex-1 accent-cyan-400"
        />
        <span className="w-6 text-center font-mono text-sm text-cyan-300">{a}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs font-bold text-orange-300">반지름 r</span>
        <input
          type="range"
          min={1}
          max={7}
          step={1}
          value={r}
          onChange={(e) => setR(parseInt(e.target.value, 10))}
          aria-label="반지름 r"
          className="flex-1 accent-orange-400"
        />
        <span className="w-6 text-center font-mono text-sm text-orange-300">{r}</span>
      </div>

      {/* 수식 전개 */}
      <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-center text-sm leading-8">
        <span className="font-serif text-base italic text-amber-100">
          |x − {aStr}| {opSym} {r}
        </span>
        <span className="mx-2 text-slate-500">→</span>
        <span className="font-serif text-slate-400">
          {aStr} − {r} {opSym} x {opSym} {aStr} + {r}
        </span>
        <span className="mx-2 text-slate-500">→</span>
        <span
          className={
            "font-serif font-bold " +
            (mode === "lt" ? "text-emerald-300" : "text-rose-300")
          }
        >
          {solText}
        </span>
      </div>

      <ExtendedCanvas mode={mode} a={a} r={r} />

      <p
        className={
          "mt-2 rounded-md border px-3 py-1.5 text-center text-sm font-bold " + solCls
        }
      >
        해: {solText}
      </p>
    </div>
  );
}

function ExtendedCanvas({ mode, a, r }: { mode: Mode; a: number; r: number }) {
  const W = 600;
  const H = 120;
  const xMin = -12;
  const xMax = 12;
  const tx = (v: number) => ((v - xMin) / (xMax - xMin)) * W;
  const y = 70;
  const col = mode === "lt" ? "#34d399" : "#f87171";
  const lo = a - r;
  const hi = a + r;

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label="|x − a| 부등식 해 수직선"
      >
        <NumberAxis W={W} y={y} xMin={xMin} xMax={xMax} />

        {mode === "lt" ? (
          <rect
            x={tx(lo)}
            y={y - 8}
            width={tx(hi) - tx(lo)}
            height={16}
            fill={col}
            opacity="0.3"
          />
        ) : (
          <>
            <rect x={0} y={y - 8} width={tx(lo)} height={16} fill={col} opacity="0.3" />
            <rect
              x={tx(hi)}
              y={y - 8}
              width={W - tx(hi)}
              height={16}
              fill={col}
              opacity="0.3"
            />
          </>
        )}

        {/* 중심 a 표시 */}
        <line
          x1={tx(a)}
          x2={tx(a)}
          y1={y - 16}
          y2={y + 16}
          stroke="#60a5fa"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <text
          x={tx(a)}
          y={y + 30}
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          fill="#60a5fa"
        >
          a = {a}
        </text>

        {/* 경계점 */}
        <EndDot x={tx(lo)} y={y} color={col} filled={false} label={lo} />
        <EndDot x={tx(hi)} y={y} color={col} filled={false} label={hi} />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 3 — 실전 4 문제
// ═══════════════════════════════════════════════════════════

type Choice = { v: string; label: ReactNode };
type Step = {
  title: string;
  desc: ReactNode;
  choices: Choice[];
  correct: string;
  hints: Record<string, ReactNode>;
};
type Prob = {
  num: number;
  eq: ReactNode;
  intro?: ReactNode;
  steps: Step[];
  done: ReactNode;
};

const PROBLEMS: Prob[] = [
  {
    num: 1,
    eq: <>|x − 3| &lt; 5</>,
    steps: [
      {
        title: "STEP 1 — 유형 파악",
        desc: <>이 부등식은 |x − a| &lt; r 꼴입니다. a 와 r 의 값은?</>,
        choices: [
          { v: "A", label: <>a = 3, r = 5</> },
          { v: "B", label: <>a = −3, r = 5</> },
          { v: "C", label: <>a = 5, r = 3</> },
        ],
        correct: "A",
        hints: {
          A: "✓ 정답! 절댓값 안이 (x − 3) 이므로 a = 3, 우변이 r = 5.",
          B: "✗ 절댓값 안이 (x − 3) 이지 (x + 3) 이 아니에요.",
          C: "✗ a 와 r 의 위치가 바뀌었어요. 절댓값 안의 ‘기준값’ 이 a 입니다.",
        },
      },
      {
        title: "STEP 2 — 공식 적용",
        desc: <>|x − 3| &lt; 5 → 3 − 5 &lt; x &lt; 3 + 5. 따라서 해는?</>,
        choices: [
          { v: "A", label: <>−8 &lt; x &lt; 8</> },
          { v: "B", label: <>−2 &lt; x &lt; 8</> },
          { v: "C", label: <>−2 &lt; x &lt; 2</> },
        ],
        correct: "B",
        hints: {
          A: "✗ a − r = 3 − 5 = −2, a + r = 3 + 5 = 8 이에요.",
          B: "✓ 정답! −2 < x < 8 — 점 3 에서 거리 5 미만인 구간.",
          C: "✗ 중심이 0 이 아니라 3 이에요.",
        },
      },
    ],
    done: (
      <>
        |x − 3| &lt; 5 → <b className="text-emerald-300">−2 &lt; x &lt; 8</b>{" "}
        (점 3 에서 거리 5 미만인 구간)
      </>
    ),
  },
  {
    num: 2,
    eq: <>|2x − 6| ≥ 4</>,
    steps: [
      {
        title: "STEP 1 — |2x − 6| 을 |2(x − 3)| 로 변형",
        desc: (
          <>
            |2x − 6| = |2| · |x − 3| = 2|x − 3|. 따라서 원래 부등식과 동치인 것은?
          </>
        ),
        choices: [
          { v: "A", label: <>|x − 3| ≥ 2</> },
          { v: "B", label: <>|x − 3| ≥ 4</> },
          { v: "C", label: <>|x − 3| ≥ 8</> },
        ],
        correct: "A",
        hints: {
          A: "✓ 정답! 2|x − 3| ≥ 4 → 양변 ÷ 2 → |x − 3| ≥ 2.",
          B: "✗ 양변을 2 로 나눠야 해요. r = 4/2 = 2.",
          C: "✗ 양변을 곱하지 말고 나눠야 해요.",
        },
      },
      {
        title: "STEP 2 — |x − 3| ≥ 2 풀기",
        desc: (
          <>
            |x − a| ≥ r → x ≤ a − r 또는 x ≥ a + r. a = 3, r = 2 를 대입하면?
          </>
        ),
        choices: [
          { v: "A", label: <>1 ≤ x ≤ 5</> },
          { v: "B", label: <>x ≤ 1 또는 x ≥ 5</> },
          { v: "C", label: <>x ≤ −1 또는 x ≥ 1</> },
        ],
        correct: "B",
        hints: {
          A: "✗ ≥ 형은 ‘바깥’ 두 구간이에요.",
          B: "✓ 정답! a − r = 1, a + r = 5 → x ≤ 1 또는 x ≥ 5.",
          C: "✗ 중심이 0 이 아니라 3 이에요.",
        },
      },
    ],
    done: (
      <>
        2|x − 3| ≥ 4 → |x − 3| ≥ 2 →{" "}
        <b className="text-rose-300">x ≤ 1 또는 x ≥ 5</b>
      </>
    ),
  },
  {
    num: 3,
    eq: <>|x − 1| ≥ 2x − 5</>,
    intro: (
      <>
        💡 우변에 x 가 있으면 <b className="text-amber-300">공식 직접 적용 불가</b>.
        <br />
        임계점 <b className="text-amber-300">x = 1</b> 을 기준으로 경우를 나눕니다.
      </>
    ),
    steps: [
      {
        title: "STEP 1 — x ≥ 1 일 때 풀기",
        desc: <>|x − 1| = x − 1 이므로 x − 1 ≥ 2x − 5, 이항하면?</>,
        choices: [
          { v: "A", label: <>x ≤ 4 &nbsp;→ 교집합: 1 ≤ x ≤ 4</> },
          { v: "B", label: <>x ≥ 4 &nbsp;→ 교집합: x ≥ 4</> },
          { v: "C", label: <>x ≤ −4 &nbsp;→ 교집합: 없음</> },
        ],
        correct: "A",
        hints: {
          A: "✓ 정답! x − 2x ≥ −5 + 1 → −x ≥ −4 → x ≤ 4. 가정 x ≥ 1 과 교집합: 1 ≤ x ≤ 4.",
          B: "✗ −x ≥ −4 에서 양변에 −1 곱하면 부등호 방향 바뀜 → x ≤ 4.",
          C: "✗ −5 + 1 = −4 이에요.",
        },
      },
      {
        title: "STEP 2 — x < 1 일 때 풀기",
        desc: (
          <>|x − 1| = −(x − 1) = 1 − x 이므로 1 − x ≥ 2x − 5, 이항하면?</>
        ),
        choices: [
          { v: "A", label: <>x ≤ 2 &nbsp;→ 교집합: x &lt; 1</> },
          { v: "B", label: <>x ≥ 2 &nbsp;→ 교집합: 없음</> },
          { v: "C", label: <>x ≤ −2 &nbsp;→ 교집합: x &lt; −2</> },
        ],
        correct: "A",
        hints: {
          A: "✓ 정답! 1 + 5 ≥ 2x + x → 6 ≥ 3x → x ≤ 2. 가정 x < 1 과 교집합: x < 1.",
          B: "✗ 부등호 방향이 반대예요.",
          C: "✗ 1 + 5 = 6, 6/3 = 2 → x ≤ 2.",
        },
      },
      {
        title: "STEP 3 — 합집합 (최종 답)",
        desc: <>① 1 ≤ x ≤ 4 &nbsp;② x &lt; 1 을 합치면?</>,
        choices: [
          { v: "A", label: <>x ≤ 4</> },
          { v: "B", label: <>1 ≤ x ≤ 4</> },
          { v: "C", label: <>x &lt; 4</> },
        ],
        correct: "A",
        hints: {
          A: "✓ 정답! 두 구간을 합치면 x ≤ 4 전체.",
          B: "✗ ② 구간 (x < 1) 이 빠졌어요.",
          C: "✗ x = 4 도 ① 에 포함되므로 ≤ 4 입니다.",
        },
      },
    ],
    done: (
      <>
        ① 1 ≤ x ≤ 4 &nbsp;② x &lt; 1 → 합집합:{" "}
        <b className="text-emerald-300">x ≤ 4</b>
      </>
    ),
  },
  {
    num: 4,
    eq: <>|x + 1| + |x − 4| &lt; 7</>,
    intro: (
      <>
        💡 임계점: <b className="text-amber-300">x = −1</b> (x + 1 = 0) 과{" "}
        <b className="text-amber-300">x = 4</b> (x − 4 = 0)
        <br />→ 세 구간으로 나눕니다: x &lt; −1 / −1 ≤ x &lt; 4 / x ≥ 4
      </>
    ),
    steps: [
      {
        title: "STEP 1 — x < −1 일 때",
        desc: (
          <>
            |x + 1| = −(x + 1), |x − 4| = −(x − 4) → −(x + 1) − (x − 4) = −2x + 3 &lt; 7,
            이항하면?
          </>
        ),
        choices: [
          { v: "A", label: <>x &gt; −2 &nbsp;→ 교집합: −2 &lt; x &lt; −1</> },
          { v: "B", label: <>x &gt; 2 &nbsp;→ 교집합: 없음</> },
          { v: "C", label: <>x &gt; −5 &nbsp;→ 교집합: −5 &lt; x &lt; −1</> },
        ],
        correct: "A",
        hints: {
          A: "✓ 정답! −2x < 4 → x > −2. 가정 x < −1 과 교집합: −2 < x < −1.",
          B: "✗ −2x + 3 < 7 → −2x < 4 → x > −2 (음수 나눔 → 부등호 방향 바뀜).",
          C: "✗ 4/(−2) = −2 이에요.",
        },
      },
      {
        title: "STEP 2 — −1 ≤ x < 4 일 때",
        desc: (
          <>
            |x + 1| = x + 1, |x − 4| = 4 − x → (x + 1) + (4 − x) = 5 &lt; 7. 항상 참!
            <br />이 구간 전체가 해인가요?
          </>
        ),
        choices: [
          { v: "A", label: <>예, 전체 구간: −1 ≤ x &lt; 4</> },
          { v: "B", label: <>아니요, 해 없음</> },
          { v: "C", label: <>일부만 해: −1 ≤ x ≤ 0</> },
        ],
        correct: "A",
        hints: {
          A: "✓ 정답! 5 < 7 은 x 와 무관하게 항상 참이므로 가정 구간 −1 ≤ x < 4 전체가 해.",
          B: "✗ 5 < 7 은 거짓이 아니라 참이에요.",
          C: "✗ 5 < 7 은 x 값과 무관하게 참이라 일부만 해가 아니에요.",
        },
      },
      {
        title: "STEP 3 — x ≥ 4 일 때",
        desc: (
          <>
            |x + 1| = x + 1, |x − 4| = x − 4 → (x + 1) + (x − 4) = 2x − 3 &lt; 7,
            이항하면?
          </>
        ),
        choices: [
          { v: "A", label: <>x &lt; 5 &nbsp;→ 교집합: 4 ≤ x &lt; 5</> },
          { v: "B", label: <>x &lt; 2 &nbsp;→ 교집합: 없음</> },
          { v: "C", label: <>x &lt; 10 &nbsp;→ 교집합: 4 ≤ x &lt; 10</> },
        ],
        correct: "A",
        hints: {
          A: "✓ 정답! 2x < 10 → x < 5. 가정 x ≥ 4 와 교집합: 4 ≤ x < 5.",
          B: "✗ 2x − 3 < 7 → 2x < 10 → x < 5.",
          C: "✗ 10/2 = 5 입니다.",
        },
      },
      {
        title: "STEP 4 — 세 구간 합집합 (최종 답)",
        desc: (
          <>
            ① −2 &lt; x &lt; −1 &nbsp;② −1 ≤ x &lt; 4 &nbsp;③ 4 ≤ x &lt; 5 를 합치면?
          </>
        ),
        choices: [
          { v: "A", label: <>−2 &lt; x &lt; 5</> },
          { v: "B", label: <>−1 ≤ x &lt; 4</> },
          { v: "C", label: <>−2 &lt; x &lt; 4</> },
        ],
        correct: "A",
        hints: {
          A: "✓ 정답! 세 구간이 연속으로 이어져 −2 < x < 5.",
          B: "✗ ① 과 ③ 구간이 빠졌어요.",
          C: "✗ ③ 구간 (4 ≤ x < 5) 이 빠졌어요.",
        },
      },
    ],
    done: (
      <>
        세 구간 합집합 → <b className="text-emerald-300">−2 &lt; x &lt; 5</b>
      </>
    ),
  },
];

function Tab3Problems() {
  const [probIdx, setProbIdx] = useState(0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-orange-100">🎯 실전 풀기 — 4 문제</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          기본 공식 → 계수 분리 → 범위 나누기 → 절댓값 2 개 — 난이도 단계적으로 올라갑니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROBLEMS.map((p, i) => (
          <button
            key={p.num}
            type="button"
            onClick={() => setProbIdx(i)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-bold transition " +
              (probIdx === i
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            문제 {p.num}
          </button>
        ))}
      </div>

      <ProblemCard
        key={probIdx}
        problem={PROBLEMS[probIdx]}
        onNext={
          probIdx + 1 < PROBLEMS.length ? () => setProbIdx(probIdx + 1) : undefined
        }
      />
    </div>
  );
}

function ProblemCard({
  problem,
  onNext,
}: {
  problem: Prob;
  onNext?: () => void;
}) {
  const [picked, setPicked] = useState<Record<number, string>>({});

  function pick(stepIdx: number, v: string) {
    if (picked[stepIdx] !== undefined) return;
    setPicked((prev) => ({ ...prev, [stepIdx]: v }));
  }

  const allDone =
    problem.steps.every((_, i) => picked[i] !== undefined) &&
    problem.steps.every((s, i) => picked[i] === s.correct);

  return (
    <div className="space-y-3">
      {/* 문제 헤더 */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-bold text-amber-200">
          📝 문제 {problem.num} — 부등식을 푸시오.
        </p>
        <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-4 py-3 text-center font-serif text-xl italic text-amber-100">
          {problem.eq}
        </div>
        {problem.intro ? (
          <p className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-sm leading-7 text-slate-200">
            {problem.intro}
          </p>
        ) : null}
      </div>

      {/* STEPS */}
      {problem.steps.map((step, idx) => {
        const sel = picked[idx];
        const decided = sel !== undefined;
        const correct = sel === step.correct;
        return (
          <div
            key={idx}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <p className="text-sm font-bold text-orange-200">{step.title}</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">{step.desc}</p>

            <div className="mt-3 flex flex-col gap-2">
              {step.choices.map((c) => {
                let cls =
                  "border-white/15 bg-white/5 text-slate-200 hover:border-amber-300/50 hover:bg-amber-400/10";
                if (decided) {
                  if (c.v === step.correct) {
                    cls = "border-emerald-400/55 bg-emerald-400/15 text-emerald-100";
                  } else if (c.v === sel) {
                    cls = "border-rose-400/55 bg-rose-400/15 text-rose-100";
                  } else {
                    cls = "border-white/10 bg-white/[0.03] text-slate-500";
                  }
                }
                return (
                  <button
                    key={c.v}
                    type="button"
                    onClick={() => pick(idx, c.v)}
                    disabled={decided}
                    className={
                      "rounded-lg border-2 px-3 py-2 text-left font-serif text-sm transition disabled:cursor-default " +
                      cls
                    }
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {decided ? (
              <p
                className={
                  "mt-3 rounded-lg px-3 py-2 text-xs leading-7 " +
                  (correct
                    ? "bg-emerald-400/10 text-emerald-100"
                    : "bg-rose-400/10 text-rose-100")
                }
              >
                {step.hints[sel] ?? (correct ? <>✓ 정답!</> : <>✗ 다시 시도!</>)}
              </p>
            ) : null}
          </div>
        );
      })}

      {allDone ? (
        <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent p-5 text-center">
          <p className="text-3xl">{problem.num === 4 ? "🏆" : "🎉"}</p>
          <p className="mt-1 text-base font-bold text-amber-200">
            {problem.num === 4 ? "4 문제 완료! 대단해요!" : "완료!"}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-300">{problem.done}</p>
          {onNext ? (
            <button
              type="button"
              onClick={onNext}
              className="mt-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-bold text-white"
            >
              다음 문제 →
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
