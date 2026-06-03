"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "a_sign_and_parabola",
    prompt:
      "a > 0 일 때와 a < 0 일 때 포물선의 모양이 어떻게 다르고, 이것이 이차부등식 ax² + bx + c > 0 / < 0 의 해에 어떤 영향을 미치는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: a > 0 이면 아래로 볼록(∪) — y > 0 인 구간이 두 근의 ‘바깥쪽’, y < 0 인 구간이 ‘사이’. a < 0 이면 위로 볼록(∩) — 반대로 y > 0 이 사이, y < 0 이 바깥쪽이 된다. 즉 a 의 부호가 ‘바깥/사이’ 를 뒤집는다.",
  },
  {
    id: "disc_and_solution",
    prompt:
      "판별식 D = b² − 4ac 의 값(D > 0, D = 0, D < 0)에 따라 이차부등식 ax² + bx + c > 0 의 해가 어떻게 달라지는지 구체적으로 설명해 보세요. (a 의 부호도 함께 고려)",
    kind: "text",
    placeholder:
      "예: D > 0 (서로 다른 두 실근) → 그래프가 x축과 두 점에서 만남 → ‘바깥/사이’ 구간이 명확히 갈림. D = 0 (중근) → x축에 접함 → a > 0 일 때 y > 0 의 해는 ‘x ≠ 중근인 모든 실수’, y < 0 의 해는 없음. D < 0 (실근 없음) → 그래프가 x축과 만나지 않음 → a > 0 이면 항상 y > 0 (모든 실수), y < 0 의 해는 없음.",
  },
];

// ─── 유틸 ─────────────────────────────────────────────────
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildEqText(a: number, b: number, c: number): string {
  const ra = round2(a);
  const rb = round2(b);
  const rc = round2(c);
  if (Math.abs(ra) < 0.001) {
    if (Math.abs(rb) < 0.001) return `y = ${rc}`;
    const sx =
      rb === 1
        ? "x"
        : rb === -1
        ? "−x"
        : rb < 0
        ? `−${round2(-rb)}x`
        : `${rb}x`;
    if (rc === 0) return `y = ${sx}`;
    return `y = ${sx}${rc > 0 ? ` + ${rc}` : ` − ${round2(-rc)}`}`;
  }
  let s = "y = ";
  if (ra === 1) s += "x²";
  else if (ra === -1) s += "−x²";
  else if (ra < 0) s += `−${round2(-ra)}x²`;
  else s += `${ra}x²`;
  if (Math.abs(rb) > 0.001) {
    if (rb === 1) s += " + x";
    else if (rb === -1) s += " − x";
    else if (rb > 0) s += ` + ${rb}x`;
    else s += ` − ${round2(-rb)}x`;
  }
  if (Math.abs(rc) > 0.001) {
    s += rc > 0 ? ` + ${rc}` : ` − ${round2(-rc)}`;
  }
  return s;
}

type IneqOp = ">" | "≥" | "<" | "≤";
const INEQ_OPS: IneqOp[] = [">", "≥", "<", "≤"];

function solveQuadIneq(a: number, b: number, c: number, op: IneqOp): string {
  if (Math.abs(a) < 0.001) return "(a ≠ 0 으로 설정해 주세요)";
  const D = b * b - 4 * a * c;
  if (Math.abs(D) < 1e-9) {
    // D = 0
    const x0 = round2(-b / (2 * a));
    if (a > 0) {
      if (op === ">") return `x ≠ ${x0} 인 모든 실수`;
      if (op === "≥") return "모든 실수";
      if (op === "<") return "해가 없습니다";
      return `x = ${x0} 만 해당`;
    } else {
      if (op === ">") return "해가 없습니다";
      if (op === "≥") return `x = ${x0} 만 해당`;
      if (op === "<") return `x ≠ ${x0} 인 모든 실수`;
      return "모든 실수";
    }
  }
  if (D > 1e-9) {
    const sqD = Math.sqrt(D);
    const x1 = round2((-b - sqD) / (2 * a));
    const x2 = round2((-b + sqD) / (2 * a));
    const [lo, hi] = x1 < x2 ? [x1, x2] : [x2, x1];
    if (a > 0) {
      if (op === ">") return `x < ${lo} 또는 x > ${hi}`;
      if (op === "≥") return `x ≤ ${lo} 또는 x ≥ ${hi}`;
      if (op === "<") return `${lo} < x < ${hi}`;
      return `${lo} ≤ x ≤ ${hi}`;
    } else {
      if (op === ">") return `${lo} < x < ${hi}`;
      if (op === "≥") return `${lo} ≤ x ≤ ${hi}`;
      if (op === "<") return `x < ${lo} 또는 x > ${hi}`;
      return `x ≤ ${lo} 또는 x ≥ ${hi}`;
    }
  }
  // D < 0
  if (a > 0) {
    if (op === ">" || op === "≥") return "모든 실수";
    return "해가 없습니다";
  } else {
    if (op === ">" || op === "≥") return "해가 없습니다";
    return "모든 실수";
  }
}

// ─── 메인 ─────────────────────────────────────────────────
type TabId = 1 | 2;

export default function QuadIneqGraphExplorer() {
  const [tab, setTab] = useState<TabId>(1);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">📊 이차부등식과 그래프 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          이차함수{" "}
          <span className="font-serif italic text-amber-200">y = ax² + bx + c</span> 의
          그래프에서 <b className="text-amber-200">y &gt; 0</b> · <b>y &lt; 0</b> 인 x 의
          범위를 슬라이더로 직접 조작하며 발견해 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <TabBtn active={tab === 1} onClick={() => setTab(1)}>
          🔍 탐구 1 · 그래프 조작
        </TabBtn>
        <TabBtn active={tab === 2} onClick={() => setTab(2)}>
          🎯 탐구 2 · 부등식 풀기
        </TabBtn>
      </div>

      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <Tab1Graph />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <Tab2Quiz />
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
        "rounded-xl px-3 py-2.5 text-xs font-bold transition sm:text-sm " +
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
//  TAB 1 — 그래프 조작
// ═══════════════════════════════════════════════════════════

function Tab1Graph() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);
  const [c, setC] = useState(-4);
  const [op, setOp] = useState<IneqOp>(">");

  const eqText = useMemo(() => buildEqText(a, b, c), [a, b, c]);
  const D = b * b - 4 * a * c;
  const sol = useMemo(() => solveQuadIneq(a, b, c, op), [a, b, c, op]);

  const discBadge = D > 1e-9 ? "D > 0" : D > -1e-9 ? "D = 0" : "D < 0";
  const discMeaning =
    D > 1e-9 ? "서로 다른 두 실근" : D > -1e-9 ? "중근" : "실근 없음";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent p-4">
        <p className="text-sm leading-7 text-slate-300">
          💡 슬라이더로 이차함수 그래프를 조작해 보세요. <b>노란색(양수) 영역</b> 과{" "}
          <b className="text-rose-300">주황색(음수) 영역</b> 을 보며 y &gt; 0, y &lt; 0
          인 x 의 범위를 발견합니다.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
          📐 이차함수 그래프 조작
        </p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
          {/* 왼쪽 — 그래프 */}
          <div>
            <ParabolaSvg a={a} b={b} c={c} op={op} />
          </div>

          {/* 오른쪽 — 식 + 슬라이더 + 경고 */}
          <div>
            <div className="rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-4 py-3 text-center font-serif text-base italic text-amber-100 sm:text-lg">
              {eqText}
            </div>

            <div className="mt-3">
              <CoeffSlider label="a" min={-2} max={2} step={0.25} value={a} onChange={setA} />
              <CoeffSlider label="b" min={-6} max={6} step={0.5} value={b} onChange={setB} />
              <CoeffSlider label="c" min={-6} max={6} step={0.5} value={c} onChange={setC} />
            </div>

            {Math.abs(a) < 0.001 ? (
              <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                ⚠️ a = 0 이면 이차함수가 아닙니다.
              </p>
            ) : null}

            {/* 부등식 선택 — 슬라이더 아래에 통합 */}
            <p className="mt-4 text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
              🔤 부등식 선택
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {INEQ_OPS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOp(o)}
                  className={
                    "rounded-lg border-2 px-2 py-2 font-serif text-sm font-bold transition " +
                    (op === o
                      ? "border-amber-300 bg-amber-400/20 text-amber-100"
                      : "border-white/15 bg-white/5 text-slate-300 hover:border-amber-300/50 hover:bg-amber-400/10")
                  }
                >
                  y {o} 0
                </button>
              ))}
            </div>

            {/* 해의 범위 — 부등식 선택 결과 즉시 표시 */}
            <div className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.08] px-3 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
                해의 범위
              </p>
              <p className="mt-1 font-serif text-sm font-bold text-emerald-100 sm:text-base">
                {sol}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 핵심 정리 */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
          📌 a 의 부호에 따른 해의 범위
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] p-3">
            <p className="text-sm font-bold text-emerald-200">a &gt; 0 (아래로 볼록 ∪)</p>
            <p className="mt-1 text-xs leading-7 text-slate-300">
              <span className="font-serif italic text-amber-200">y &gt; 0</span> : 양 옆
              <br />
              <span className="font-serif italic text-rose-300">y &lt; 0</span> : 사이
            </p>
          </div>
          <div className="rounded-xl border border-violet-400/30 bg-violet-400/[0.06] p-3">
            <p className="text-sm font-bold text-violet-200">a &lt; 0 (위로 볼록 ∩)</p>
            <p className="mt-1 text-xs leading-7 text-slate-300">
              <span className="font-serif italic text-amber-200">y &gt; 0</span> : 사이
              <br />
              <span className="font-serif italic text-rose-300">y &lt; 0</span> : 양 옆
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] p-3">
          <p className="flex items-center justify-between text-sm">
            <span>
              판별식{" "}
              <span className="font-serif italic text-amber-200">D = b² − 4ac</span>
            </span>
            <span
              className={
                "rounded-md border px-2 py-0.5 text-xs font-bold " +
                (D > 1e-9
                  ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
                  : D > -1e-9
                  ? "border-amber-400/40 bg-amber-400/15 text-amber-200"
                  : "border-rose-400/40 bg-rose-400/15 text-rose-200")
              }
            >
              {discBadge}
            </span>
          </p>
          <p className="mt-2 text-xs leading-7 text-slate-300">
            판별식{" "}
            <span className="font-serif italic text-amber-200">D = {round2(D)}</span> →{" "}
            {discMeaning} ({a > 0 ? "a > 0" : a < 0 ? "a < 0" : "a = 0"})
          </p>
        </div>
      </div>
    </div>
  );
}

function CoeffSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <span className="w-4 text-center font-serif italic text-base text-slate-300">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={`${label} 슬라이더`}
        className="flex-1 accent-amber-400"
      />
      <span className="w-12 text-center font-mono text-sm font-bold text-amber-300">
        {value}
      </span>
    </div>
  );
}

// ─── 포물선 SVG ───────────────────────────────────────────
function ParabolaSvg({
  a,
  b,
  c,
  op,
}: {
  a: number;
  b: number;
  c: number;
  op: IneqOp;
}) {
  const W = 460;
  const H = 380;
  const SC = 38; // 단위 길이 (px / unit)
  const OX = W / 2;
  const OY = H / 2;

  const xMin = (-OX / SC) - 0.2;
  const xMax = (W - OX) / SC + 0.2;
  const f = (x: number) => a * x * x + b * x + c;
  const tx = (x: number) => OX + x * SC;
  const ty = (y: number) => OY - y * SC;

  // 격자 라인
  const gridLines: React.ReactElement[] = [];
  const gMinX = Math.floor(-OX / SC);
  const gMaxX = Math.ceil((W - OX) / SC);
  const gMinY = Math.floor(-(H - OY) / SC);
  const gMaxY = Math.ceil(OY / SC);
  for (let x = gMinX; x <= gMaxX; x++) {
    gridLines.push(
      <line
        key={`gx${x}`}
        x1={tx(x)}
        x2={tx(x)}
        y1={0}
        y2={H}
        stroke="rgba(255,255,255,0.065)"
        strokeWidth="0.8"
      />,
    );
  }
  for (let y = gMinY; y <= gMaxY; y++) {
    gridLines.push(
      <line
        key={`gy${y}`}
        x1={0}
        x2={W}
        y1={ty(y)}
        y2={ty(y)}
        stroke="rgba(255,255,255,0.065)"
        strokeWidth="0.8"
      />,
    );
  }

  // 눈금 라벨
  const xTicks: number[] = [];
  for (let x = gMinX + 1; x < gMaxX; x++) {
    if (x !== 0) xTicks.push(x);
  }
  const yTicks: number[] = [];
  for (let y = gMinY + 1; y < gMaxY; y++) {
    if (y !== 0) yTicks.push(y);
  }

  // 포물선 path 와 음영
  const valid = Math.abs(a) >= 0.001;
  const steps = 280;
  const curvePts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const x = xMin + ((xMax - xMin) * i) / steps;
    const y = f(x);
    curvePts.push([tx(x), ty(y)]);
  }

  // 곡선 path (out-of-bounds 지점에서 끊기)
  const curvePath = useMemo(() => {
    if (!valid) return "";
    const parts: string[] = [];
    let pen = false;
    for (const [px, py] of curvePts) {
      if (py < -30 || py > H + 30) {
        pen = false;
        continue;
      }
      parts.push(pen ? `L ${px} ${py}` : `M ${px} ${py}`);
      pen = true;
    }
    return parts.join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b, c]);

  // 음영 polygons (포물선과 x축 사이 영역)
  // 각 step 마다 사다리꼴 (px1, OY) - (px1, py1) - (px2, py2) - (px2, OY) 생성
  const isMatchY = (y: number) => {
    if (op === ">") return y > 1e-9;
    if (op === "≥") return y > -1e-9;
    if (op === "<") return y < -1e-9;
    return y < 1e-9;
  };
  const shadeColor =
    op === ">" || op === "≥" ? "rgba(253,230,138,0.18)" : "rgba(248,113,113,0.18)";

  const shadePolys: React.ReactElement[] = [];
  if (valid) {
    for (let i = 0; i < steps; i++) {
      const x1 = xMin + ((xMax - xMin) * i) / steps;
      const y1 = f(x1);
      if (!isMatchY(y1)) continue;
      const x2 = xMin + ((xMax - xMin) * (i + 1)) / steps;
      const y2 = f(x2);
      const points = `${tx(x1)},${OY} ${tx(x1)},${ty(y1)} ${tx(x2)},${ty(
        y2,
      )} ${tx(x2)},${OY}`;
      shadePolys.push(
        <polygon
          key={`sh${i}`}
          points={points}
          fill={shadeColor}
          stroke="none"
        />,
      );
    }
  }

  // x절편 (D ≥ 0)
  const D = b * b - 4 * a * c;
  const intercepts: number[] = [];
  if (valid && D >= -1e-9) {
    const sqD = Math.sqrt(Math.max(0, D));
    const x1 = (-b - sqD) / (2 * a);
    const x2 = (-b + sqD) / (2 * a);
    if (Math.abs(x1 - x2) < 1e-9) intercepts.push(x1);
    else {
      intercepts.push(Math.min(x1, x2));
      intercepts.push(Math.max(x1, x2));
    }
  }

  const curveColor = op === ">" || op === "≥" ? "#34d399" : "#f87171";

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-gradient-to-br from-slate-950 to-slate-900 p-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label="이차함수 그래프"
      >
        {/* 격자 */}
        {gridLines}

        {/* 음영 */}
        {shadePolys}

        {/* 축 */}
        <line
          x1={6}
          x2={W - 6}
          y1={OY}
          y2={OY}
          stroke="rgba(255,255,255,0.32)"
          strokeWidth="1.5"
        />
        <line
          x1={OX}
          x2={OX}
          y1={6}
          y2={H - 6}
          stroke="rgba(255,255,255,0.32)"
          strokeWidth="1.5"
        />
        {/* 화살표 */}
        <polygon
          points={`${W - 6},${OY} ${W - 14},${OY - 4} ${W - 14},${OY + 4}`}
          fill="rgba(255,255,255,0.32)"
        />
        <polygon
          points={`${OX},6 ${OX - 4},14 ${OX + 4},14`}
          fill="rgba(255,255,255,0.32)"
        />
        <text
          x={W - 8}
          y={OY - 7}
          fontSize="13"
          fontStyle="italic"
          fontFamily="Times New Roman, serif"
          textAnchor="end"
          fill="rgba(255,255,255,0.5)"
        >
          x
        </text>
        <text
          x={OX + 12}
          y={14}
          fontSize="13"
          fontStyle="italic"
          fontFamily="Times New Roman, serif"
          textAnchor="middle"
          fill="rgba(255,255,255,0.5)"
        >
          y
        </text>

        {/* 눈금 라벨 */}
        {xTicks.map((x) => (
          <text
            key={`tx${x}`}
            x={tx(x)}
            y={OY + 13}
            fontSize="10"
            textAnchor="middle"
            fill="rgba(255,255,255,0.32)"
          >
            {x}
          </text>
        ))}
        {yTicks.map((y) => (
          <text
            key={`ty${y}`}
            x={OX - 5}
            y={ty(y) + 4}
            fontSize="10"
            textAnchor="end"
            fill="rgba(255,255,255,0.32)"
          >
            {y}
          </text>
        ))}

        {/* 포물선 곡선 */}
        {valid ? (
          <path
            d={curvePath}
            fill="none"
            stroke={curveColor}
            strokeWidth="2.8"
            style={{ filter: `drop-shadow(0 0 6px ${curveColor})` }}
          />
        ) : null}

        {/* x절편 */}
        {intercepts.map((x, i) => (
          <g key={`xi${i}`}>
            <circle
              cx={tx(x)}
              cy={OY}
              r={9}
              fill="none"
              stroke="rgba(253,230,138,0.35)"
              strokeWidth="2"
            />
            <circle
              cx={tx(x)}
              cy={OY}
              r={5}
              fill="#fde68a"
              style={{ filter: "drop-shadow(0 0 6px #fde68a)" }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 부등식 풀기 (5문제)
// ═══════════════════════════════════════════════════════════

type QuizItem = {
  expr: string;
  ineq: string;
  choices: string[];
  ans: number;
  hint: ReactNode;
};

const INEQ_QUIZ: QuizItem[] = [
  {
    expr: "x² − 4x + 3",
    ineq: ">",
    choices: ["x < 1 또는 x > 3", "1 < x < 3", "1 ≤ x ≤ 3", "모든 실수"],
    ans: 0,
    hint: (
      <>
        (x − 1)(x − 3) &gt; 0: <b>a &gt; 0</b> 이므로 두 근 1, 3 의{" "}
        <b className="text-amber-200">양 옆</b> 이 해. → x &lt; 1 또는 x &gt; 3.
      </>
    ),
  },
  {
    expr: "x² − 2x − 8",
    ineq: "≤",
    choices: [
      "x < −2 또는 x > 4",
      "−2 ≤ x ≤ 4",
      "x ≤ −2 또는 x ≥ 4",
      "모든 실수",
    ],
    ans: 1,
    hint: (
      <>
        (x + 2)(x − 4) ≤ 0: <b>a &gt; 0</b> 이므로 두 근 −2, 4 의{" "}
        <b className="text-amber-200">사이</b> 가 해. → −2 ≤ x ≤ 4.
      </>
    ),
  },
  {
    expr: "−x² + 6x − 5",
    ineq: "<",
    choices: [
      "1 < x < 5",
      "−1 < x < 5",
      "x < 1 또는 x > 5",
      "1 ≤ x ≤ 5",
    ],
    ans: 2,
    hint: (
      <>
        −(x − 1)(x − 5) &lt; 0 ⇔ (x − 1)(x − 5) &gt; 0: <b>a &lt; 0</b> 이고{" "}
        <span className="font-serif italic text-amber-200">y &lt; 0</span> 이면{" "}
        <b className="text-amber-200">양 옆</b> 이 해. → x &lt; 1 또는 x &gt; 5.
      </>
    ),
  },
  {
    expr: "−x² + 4",
    ineq: "≥",
    choices: [
      "x < −2 또는 x > 2",
      "−2 ≤ x ≤ 2",
      "x 는 모든 실수",
      "−2 < x < 2",
    ],
    ans: 1,
    hint: (
      <>
        −(x² − 4) ≥ 0 ⇔ (x − 2)(x + 2) ≤ 0: <b>a &lt; 0</b> 이고{" "}
        <span className="font-serif italic text-amber-200">y ≥ 0</span> 이면{" "}
        <b className="text-amber-200">사이</b> 가 해. → −2 ≤ x ≤ 2.
      </>
    ),
  },
  {
    expr: "x² + 2x + 2",
    ineq: ">",
    choices: ["해가 없습니다", "−1", "x = −1 만", "모든 실수"],
    ans: 3,
    hint: (
      <>
        판별식 D = 4 − 8 = −4 &lt; 0 → 실근 없음. <b>a &gt; 0</b> 이고 그래프가 x축과
        만나지 않으므로 항상 y &gt; 0 → <b className="text-amber-200">모든 실수</b>.
      </>
    ),
  },
];

type QzState = {
  idx: number;
  correctMap: boolean[];
  picked: number | null;
};

function Tab2Quiz() {
  const [state, setState] = useState<QzState>({
    idx: 0,
    correctMap: [],
    picked: null,
  });

  const total = INEQ_QUIZ.length;
  const score = state.correctMap.filter(Boolean).length;
  const done = state.correctMap.length === total;
  const cur = INEQ_QUIZ[state.idx];

  function pick(i: number) {
    if (state.picked !== null || done) return;
    const correct = i === cur.ans;
    setState((s) => ({
      ...s,
      picked: i,
      correctMap: [...s.correctMap, correct],
    }));
  }

  function next() {
    if (state.idx + 1 >= total) {
      setState((s) => ({ ...s, picked: null }));
      return;
    }
    setState((s) => ({ ...s, idx: s.idx + 1, picked: null }));
  }

  function reset() {
    setState({ idx: 0, correctMap: [], picked: null });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-amber-100">🎯 부등식 풀이 5 선</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          그래프 탐구에서 익힌 ‘a 부호 + 판별식’ 으로 풀어 보세요.
        </p>
      </div>

      {/* 점수 점 + 진행 */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <svg viewBox="0 0 100 1" preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id="qigProg" x1="0" x2="1">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>
            <rect
              x="0"
              y="0"
              height="1"
              width={(state.correctMap.length / total) * 100}
              fill="url(#qigProg)"
            />
          </svg>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {state.correctMap.length} / {total}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {INEQ_QUIZ.map((_, i) => {
          const ans = state.correctMap[i];
          const isCur = i === state.idx && !done;
          return (
            <div
              key={i}
              className={
                "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold transition " +
                (ans === true
                  ? "border-emerald-400/50 bg-emerald-400/20 text-emerald-200"
                  : ans === false
                  ? "border-rose-400/50 bg-rose-400/20 text-rose-200"
                  : isCur
                  ? "border-amber-300/70 bg-amber-400/15 text-amber-200"
                  : "border-white/10 bg-white/5 text-slate-500")
              }
            >
              {ans === true ? "✓" : ans === false ? "✗" : i + 1}
            </div>
          );
        })}
      </div>

      {!done ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
            문제 {state.idx + 1}
          </p>
          <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-4 py-4 text-center font-serif text-xl italic text-amber-100">
            {cur.expr} {cur.ineq} 0
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            다음 부등식을 풀어 정답을 선택하세요.
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {cur.choices.map((c, i) => {
              const isCorrect = i === cur.ans;
              const isPicked = state.picked === i;
              let cls =
                "border-white/15 bg-white/5 text-slate-200 hover:border-amber-300/50 hover:bg-amber-400/10";
              if (state.picked !== null) {
                if (isCorrect) {
                  cls = "border-emerald-400/55 bg-emerald-400/15 text-emerald-100";
                } else if (isPicked) {
                  cls = "border-rose-400/55 bg-rose-400/15 text-rose-100";
                } else {
                  cls = "border-white/10 bg-white/[0.03] text-slate-500";
                }
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  disabled={state.picked !== null}
                  className={
                    "rounded-lg border-2 px-3 py-2 text-left font-serif text-sm font-bold transition disabled:cursor-default " +
                    cls
                  }
                >
                  {["①", "②", "③", "④"][i]} {c}
                </button>
              );
            })}
          </div>

          {state.picked !== null ? (
            <div
              className={
                "mt-4 rounded-lg border px-3 py-2.5 text-sm leading-7 " +
                (state.picked === cur.ans
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                  : "border-rose-400/40 bg-rose-400/10 text-rose-100")
              }
            >
              <p className="font-bold">
                {state.picked === cur.ans ? "🎉 정답!" : "💡 틀렸어요."}
              </p>
              <p className="mt-1 text-slate-200">{cur.hint}</p>
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            {state.picked !== null ? (
              <button
                type="button"
                onClick={next}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-bold text-white"
              >
                {state.idx + 1 >= total ? "결과 보기 →" : "다음 →"}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <FinalCard score={score} total={total} onReset={reset} />
      )}
    </div>
  );
}

function FinalCard({
  score,
  total,
  onReset,
}: {
  score: number;
  total: number;
  onReset: () => void;
}) {
  const msgs = [
    "더 열심히 풀어보세요 💪",
    "좋은 시작입니다!",
    "절반 이상 맞혔어요! 잘하고 있어요 😊",
    "훌륭해요! 거의 다 왔어요 👍",
    "완벽해요! 부등식 마스터 🏆",
  ];
  const msg = msgs[Math.min(score, msgs.length - 1)];

  return (
    <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent p-6 text-center">
      <p className="text-2xl">🏆 퀴즈 완료!</p>
      <p className="mt-2 text-5xl font-extrabold text-amber-300">
        {score} / {total}
      </p>
      <p className="mt-2 text-sm text-slate-300">{msg}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-bold text-white"
      >
        다시 도전 🔄
      </button>
    </div>
  );
}
