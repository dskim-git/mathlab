"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "abs_vs_sqrt",
    prompt:
      "두 점 사이의 거리를 구할 때, 수직선(1차원)에서는 절댓값을, 좌표평면(2차원)에서는 제곱근을 쓰는 이유는 무엇인지, 두 경우의 공통점과 차이점을 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 수직선은 좌표의 차만으로 거리가 정해지지만 방향에 따라 부호가 생겨 절댓값이 필요하고, 좌표평면은 가로·세로 차이를 두 변으로 하는 직각삼각형의 빗변이라 피타고라스 정리로 제곱근이 나온다.",
  },
  {
    id: "pythagoras_link",
    prompt:
      "좌표평면 탭에서 두 점을 여러 위치로 옮겨 보며, 직각삼각형의 가로 길이 |x₂−x₁|·세로 길이 |y₂−y₁| 와 두 점 사이의 거리 사이에 어떤 관계가 있는지 관찰한 것을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 가로·세로 길이를 두 변으로 하면 두 점 사이의 거리가 항상 그 직각삼각형의 빗변이 되어, 거리의 제곱이 가로² + 세로² 와 같았다.",
  },
  {
    id: "map_realworld",
    prompt:
      "마을 지도 활동에서 두 장소 사이의 거리를 구한 과정을 한 가지 예로 설명하고, 실생활에서 이런 ‘직선 거리(최단 거리)’ 계산이 필요한 상황을 떠올려 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 공원(−4, 0)과 도서관(0, 3)은 가로 4, 세로 3 차이라 거리가 5였다. 드론 배달이나 지도 앱의 직선거리 표시에 이런 계산이 쓰일 것 같다.",
  },
];

// ─── 공용 유틸 ────────────────────────────────────────────────
function fmtNum(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : String(n);
}

/** √n 을 a√b 꼴로 단순화. */
function simplifyRadical(n: number): { coef: number; rad: number } {
  if (n <= 0) return { coef: 0, rad: 1 };
  let coef = 1;
  let rad = n;
  for (let f = 2; f * f <= rad; f++) {
    while (rad % (f * f) === 0) {
      rad /= f * f;
      coef *= f;
    }
  }
  return { coef, rad };
}

/** √n 을 사람이 읽는 문자열로. 예: 25→"5", 8→"2√2", 5→"√5" */
function radicalText(n: number): string {
  if (n === 0) return "0";
  const { coef, rad } = simplifyRadical(n);
  if (rad === 1) return String(coef);
  if (coef === 1) return `√${rad}`;
  return `${coef}√${rad}`;
}

function range(lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let i = lo; i <= hi; i++) out.push(i);
  return out;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "line" | "plane" | "map";

export default function TwoPointDistanceLab() {
  const [tab, setTab] = useState<Tab>("line");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* 헤더 */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">📏 두 점 사이의 거리</h3>
        <p className="mt-2 leading-7 text-slate-300">
          점을 직접 끌어 움직이며 <b className="text-cyan-200">수직선</b>과{" "}
          <b className="text-amber-200">좌표평면</b>에서 두 점 사이의 거리가 어떻게
          계산되는지 살펴보고, 마지막에는 <b className="text-emerald-200">마을 지도</b>에서
          거리를 직접 구해 보세요.
        </p>
      </div>

      {/* 탭 */}
      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "line"} onClick={() => setTab("line")}>
          ① 수직선 (1차원)
        </TabButton>
        <TabButton active={tab === "plane"} onClick={() => setTab("plane")}>
          ② 좌표평면 (2차원)
        </TabButton>
        <TabButton active={tab === "map"} onClick={() => setTab("map")}>
          ③ 마을 지도 게임 🚁
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "line" ? <NumberLineTab /> : null}
        {tab === "plane" ? <PlaneTab /> : null}
        {tab === "map" ? <MapGameTab /> : null}
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
        "rounded-xl border-2 px-4 py-2 text-sm font-bold transition " +
        (active
          ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ─── 탭 ① 수직선 ──────────────────────────────────────────────
const NL = {
  MINV: -9,
  MAXV: 9,
  LEFT: 40,
  UNIT: 20,
  LINE_Y: 150,
  VB_W: 440,
  VB_H: 210,
};

function nlScaleX(v: number): number {
  return NL.LEFT + (v - NL.MINV) * NL.UNIT;
}

function NumberLineTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ax, setAx] = useState(-3);
  const [bx, setBx] = useState(5);
  const [dragging, setDragging] = useState<null | "A" | "B">(null);

  useEffect(() => {
    if (!dragging) return;
    function clientToVal(clientX: number): number | null {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const sx = (clientX - rect.left) * (NL.VB_W / rect.width);
      const v = Math.round((sx - NL.LEFT) / NL.UNIT + NL.MINV);
      return clamp(v, NL.MINV, NL.MAXV);
    }
    function move(e: PointerEvent) {
      e.preventDefault();
      const v = clientToVal(e.clientX);
      if (v === null) return;
      if (dragging === "A") setAx(v);
      else setBx(v);
    }
    function up() {
      setDragging(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging]);

  const dist = Math.abs(bx - ax);
  const caseOne = ax <= bx; // x₁ ≤ x₂
  const lo = Math.min(ax, bx);
  const hi = Math.max(ax, bx);

  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 파란 점 <b className="text-cyan-200">A(x₁)</b> 과 노란 점{" "}
        <b className="text-amber-200">B(x₂)</b> 를 좌우로 끌어 보세요. 두 점 사이의 거리가
        어떻게 정해지는지 관찰해 보세요.
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${NL.VB_W} ${NL.VB_H}`}
          className="w-full touch-none select-none"
          role="img"
          aria-label="수직선 위의 두 점과 거리"
        >
          {/* 눈금 */}
          {range(NL.MINV, NL.MAXV).map((v) => (
            <g key={v}>
              <line
                x1={nlScaleX(v)}
                y1={NL.LINE_Y - 5}
                x2={nlScaleX(v)}
                y2={NL.LINE_Y + 5}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1}
              />
              <text
                x={nlScaleX(v)}
                y={NL.LINE_Y + 20}
                textAnchor="middle"
                className="fill-slate-500 font-mono text-[9px]"
              >
                {v}
              </text>
            </g>
          ))}

          {/* 수직선 축 */}
          <line
            x1={nlScaleX(NL.MINV)}
            y1={NL.LINE_Y}
            x2={nlScaleX(NL.MAXV)}
            y2={NL.LINE_Y}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={2}
          />

          {/* 거리 구간 강조 */}
          <line
            x1={nlScaleX(lo)}
            y1={NL.LINE_Y}
            x2={nlScaleX(hi)}
            y2={NL.LINE_Y}
            stroke="#34d399"
            strokeWidth={4}
          />

          {/* 거리 브래킷 (위쪽) */}
          <path
            d={`M ${nlScaleX(lo)} ${NL.LINE_Y - 30}
                L ${nlScaleX(lo)} ${NL.LINE_Y - 42}
                L ${nlScaleX(hi)} ${NL.LINE_Y - 42}
                L ${nlScaleX(hi)} ${NL.LINE_Y - 30}`}
            fill="none"
            stroke="#34d399"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <text
            x={(nlScaleX(lo) + nlScaleX(hi)) / 2}
            y={NL.LINE_Y - 48}
            textAnchor="middle"
            className="fill-emerald-200 font-mono text-sm font-bold"
          >
            거리 {dist}
          </text>

          {/* 점 A */}
          <DragPoint
            cx={nlScaleX(ax)}
            cy={NL.LINE_Y}
            color="#22d3ee"
            label="A"
            sub={`x₁=${fmtNum(ax)}`}
            onDown={() => setDragging("A")}
          />
          {/* 점 B */}
          <DragPoint
            cx={nlScaleX(bx)}
            cy={NL.LINE_Y}
            color="#fbbf24"
            label="B"
            sub={`x₂=${fmtNum(bx)}`}
            onDown={() => setDragging("B")}
          />
        </svg>
      </div>

      {/* 계산 패널 */}
      <div className="mt-3 rounded-xl border-l-4 border-cyan-400 bg-cyan-400/[0.08] px-4 py-3">
        <p className="font-mono text-sm text-slate-200">
          x₁ = <b className="text-cyan-200">{fmtNum(ax)}</b>, x₂ ={" "}
          <b className="text-amber-200">{fmtNum(bx)}</b>
        </p>
        <p className="mt-2 font-mono text-sm text-slate-300">
          {caseOne ? (
            <>
              x₁ ≤ x₂ 이므로{" "}
              <b className="text-white">
                AB = x₂ − x₁ = {fmtNum(bx)} − ({fmtNum(ax)}) = {dist}
              </b>
            </>
          ) : (
            <>
              x₂ &lt; x₁ 이므로{" "}
              <b className="text-white">
                AB = x₁ − x₂ = {fmtNum(ax)} − ({fmtNum(bx)}) = {dist}
              </b>
            </>
          )}
        </p>
        <p className="mt-2 font-mono text-base font-bold text-emerald-200">
          ∴ AB = |x₂ − x₁| = {dist}
        </p>
      </div>
    </div>
  );
}

/** SVG 위 드래그 가능한 점 (원 + 라벨). */
function DragPoint({
  cx,
  cy,
  color,
  label,
  sub,
  onDown,
}: {
  cx: number;
  cy: number;
  color: string;
  label: string;
  sub: string;
  onDown: () => void;
}) {
  return (
    <g
      className="cursor-grab touch-none"
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
    >
      {/* 넓은 히트 영역 */}
      <circle cx={cx} cy={cy} r={16} fill="transparent" />
      <circle cx={cx} cy={cy} r={7} fill={color} stroke="#0f172a" strokeWidth={2} />
      <text
        x={cx}
        y={cy - 14}
        textAnchor="middle"
        className="fill-white text-[13px] font-bold"
      >
        {label}
      </text>
      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        className="fill-slate-300 font-mono text-[10px]"
      >
        {sub}
      </text>
    </g>
  );
}

// ─── 탭 ② 좌표평면 ────────────────────────────────────────────
const PL = {
  MINX: -1,
  MAXX: 9,
  MINY: -1,
  MAXY: 9,
  UNIT: 28,
  LEFTX: 44,
  TOP: 16,
  VB_W: 340,
  VB_H: 320,
};

function plScaleX(v: number): number {
  return PL.LEFTX + (v - PL.MINX) * PL.UNIT;
}
function plScaleY(v: number): number {
  return PL.TOP + (PL.MAXY - v) * PL.UNIT;
}

type Pt = { x: number; y: number };

function PlaneTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState<Pt>({ x: 1, y: 2 });
  const [b, setB] = useState<Pt>({ x: 6, y: 5 });
  const [dragging, setDragging] = useState<null | "A" | "B">(null);

  useEffect(() => {
    if (!dragging) return;
    function clientToXY(clientX: number, clientY: number): Pt | null {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const sx = (clientX - rect.left) * (PL.VB_W / rect.width);
      const sy = (clientY - rect.top) * (PL.VB_H / rect.height);
      const vx = Math.round((sx - PL.LEFTX) / PL.UNIT + PL.MINX);
      const vy = Math.round(PL.MAXY - (sy - PL.TOP) / PL.UNIT);
      return {
        x: clamp(vx, PL.MINX, PL.MAXX),
        y: clamp(vy, PL.MINY, PL.MAXY),
      };
    }
    function move(e: PointerEvent) {
      e.preventDefault();
      const p = clientToXY(e.clientX, e.clientY);
      if (!p) return;
      if (dragging === "A") setA(p);
      else setB(p);
    }
    function up() {
      setDragging(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging]);

  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  const ab2 = dx * dx + dy * dy;
  const c: Pt = { x: b.x, y: a.y }; // 직각 꼭짓점

  return (
    <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 <b className="text-cyan-200">A(x₁, y₁)</b> 와{" "}
        <b className="text-amber-200">B(x₂, y₂)</b> 를 격자 위 아무 곳으로 끌어 보세요. 두 점을
        빗변으로 하는 직각삼각형과 <b className="text-emerald-200">피타고라스 정리</b>로 거리가
        정해집니다.
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${PL.VB_W} ${PL.VB_H}`}
          className="mx-auto block w-full max-w-md touch-none select-none"
          role="img"
          aria-label="좌표평면 위의 두 점과 거리"
        >
          {/* 격자 */}
          {range(PL.MINX, PL.MAXX).map((v) => (
            <line
              key={`gx${v}`}
              x1={plScaleX(v)}
              y1={plScaleY(PL.MAXY)}
              x2={plScaleX(v)}
              y2={plScaleY(PL.MINY)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          ))}
          {range(PL.MINY, PL.MAXY).map((v) => (
            <line
              key={`gy${v}`}
              x1={plScaleX(PL.MINX)}
              y1={plScaleY(v)}
              x2={plScaleX(PL.MAXX)}
              y2={plScaleY(v)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          ))}

          {/* 축 */}
          <line
            x1={plScaleX(PL.MINX)}
            y1={plScaleY(0)}
            x2={plScaleX(PL.MAXX)}
            y2={plScaleY(0)}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1.5}
          />
          <line
            x1={plScaleX(0)}
            y1={plScaleY(PL.MINY)}
            x2={plScaleX(0)}
            y2={plScaleY(PL.MAXY)}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1.5}
          />
          <text
            x={plScaleX(PL.MAXX) + 4}
            y={plScaleY(0) + 4}
            className="fill-slate-400 text-[10px] italic"
          >
            x
          </text>
          <text
            x={plScaleX(0) - 10}
            y={plScaleY(PL.MAXY) - 2}
            className="fill-slate-400 text-[10px] italic"
          >
            y
          </text>

          {/* 직각삼각형 다리 */}
          <line
            x1={plScaleX(a.x)}
            y1={plScaleY(a.y)}
            x2={plScaleX(c.x)}
            y2={plScaleY(c.y)}
            stroke="#38bdf8"
            strokeWidth={2}
            strokeDasharray="5 3"
          />
          <line
            x1={plScaleX(c.x)}
            y1={plScaleY(c.y)}
            x2={plScaleX(b.x)}
            y2={plScaleY(b.y)}
            stroke="#fbbf24"
            strokeWidth={2}
            strokeDasharray="5 3"
          />
          {/* 빗변 */}
          <line
            x1={plScaleX(a.x)}
            y1={plScaleY(a.y)}
            x2={plScaleX(b.x)}
            y2={plScaleY(b.y)}
            stroke="#34d399"
            strokeWidth={3}
          />

          {/* 다리 길이 라벨 */}
          {dx > 0 ? (
            <text
              x={(plScaleX(a.x) + plScaleX(c.x)) / 2}
              y={plScaleY(a.y) + 16}
              textAnchor="middle"
              className="fill-sky-300 font-mono text-[11px] font-bold"
            >
              {dx}
            </text>
          ) : null}
          {dy > 0 ? (
            <text
              x={plScaleX(c.x) + 10}
              y={(plScaleY(c.y) + plScaleY(b.y)) / 2 + 4}
              textAnchor="middle"
              className="fill-amber-300 font-mono text-[11px] font-bold"
            >
              {dy}
            </text>
          ) : null}

          {/* 직각 표시 */}
          {dx > 0 && dy > 0 ? (
            <rect
              x={plScaleX(c.x) - (b.x > a.x ? 10 : 0)}
              y={plScaleY(c.y) - (b.y > a.y ? 10 : 0)}
              width={10}
              height={10}
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1}
            />
          ) : null}

          {/* 점 C */}
          <circle
            cx={plScaleX(c.x)}
            cy={plScaleY(c.y)}
            r={4}
            fill="#64748b"
            stroke="#0f172a"
            strokeWidth={1.5}
          />

          {/* 점 A, B (드래그) */}
          <PlaneDragPoint
            px={plScaleX(a.x)}
            py={plScaleY(a.y)}
            color="#22d3ee"
            label={`A(${fmtNum(a.x)}, ${fmtNum(a.y)})`}
            onDown={() => setDragging("A")}
          />
          <PlaneDragPoint
            px={plScaleX(b.x)}
            py={plScaleY(b.y)}
            color="#fbbf24"
            label={`B(${fmtNum(b.x)}, ${fmtNum(b.y)})`}
            onDown={() => setDragging("B")}
          />
        </svg>
      </div>

      {/* 계산 패널 */}
      <div className="mt-3 rounded-xl border-l-4 border-amber-400 bg-amber-400/[0.08] px-4 py-3">
        <p className="font-mono text-sm text-slate-200">
          가로 = |x₂ − x₁| = <b className="text-sky-300">{dx}</b> &nbsp;·&nbsp; 세로 = |y₂ −
          y₁| = <b className="text-amber-300">{dy}</b>
        </p>
        <p className="mt-2 font-mono text-sm text-slate-300">
          AB² = 가로² + 세로² = {dx}² + {dy}² = {dx * dx} + {dy * dy} ={" "}
          <b className="text-white">{ab2}</b>
        </p>
        <p className="mt-2 font-mono text-base font-bold text-emerald-200">
          ∴ AB = √(AB²) = √{ab2} = {radicalText(ab2)}
        </p>
      </div>
    </div>
  );
}

function PlaneDragPoint({
  px,
  py,
  color,
  label,
  onDown,
}: {
  px: number;
  py: number;
  color: string;
  label: string;
  onDown: () => void;
}) {
  return (
    <g
      className="cursor-grab touch-none"
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
    >
      <circle cx={px} cy={py} r={15} fill="transparent" />
      <circle cx={px} cy={py} r={6} fill={color} stroke="#0f172a" strokeWidth={2} />
      <text
        x={px}
        y={py - 12}
        textAnchor="middle"
        className="fill-white font-mono text-[10px] font-bold"
      >
        {label}
      </text>
    </g>
  );
}

// ─── 탭 ③ 마을 지도 게임 ──────────────────────────────────────
type Place = {
  id: string;
  name: string;
  emoji: string;
  x: number;
  y: number;
  color: string; // 정적 Tailwind 클래스
};

const PLACES: Place[] = [
  { id: "school", name: "학교", emoji: "🏫", x: 0, y: 0, color: "border-slate-300/50 bg-slate-300/15 text-slate-100" },
  { id: "park", name: "공원", emoji: "🌳", x: -4, y: 0, color: "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" },
  { id: "library", name: "도서관", emoji: "📚", x: 0, y: 3, color: "border-sky-400/50 bg-sky-400/15 text-sky-100" },
  { id: "cafe", name: "카페", emoji: "☕", x: 2, y: 2, color: "border-amber-400/50 bg-amber-400/15 text-amber-100" },
  { id: "store", name: "편의점", emoji: "🏪", x: 6, y: 0, color: "border-rose-400/50 bg-rose-400/15 text-rose-100" },
  { id: "playground", name: "놀이터", emoji: "🎠", x: 6, y: 6, color: "border-violet-400/50 bg-violet-400/15 text-violet-100" },
];

const ROUNDS: { a: string; b: string }[] = [
  { a: "park", b: "library" }, // 4,3 → 25 → 5
  { a: "school", b: "store" }, // 6,0 → 36 → 6
  { a: "school", b: "cafe" }, // 2,2 → 8 → 2√2
  { a: "library", b: "store" }, // 6,3 → 45 → 3√5
  { a: "cafe", b: "playground" }, // 4,4 → 32 → 4√2
];

const MP = {
  MINX: -5,
  MAXX: 7,
  MINY: -2,
  MAXY: 8,
  UNIT: 28,
  LEFT: 36,
  TOP: 14,
  VB_W: 400,
  VB_H: 310,
};
function mpX(v: number): number {
  return MP.LEFT + (v - MP.MINX) * MP.UNIT;
}
function mpY(v: number): number {
  return MP.TOP + (MP.MAXY - v) * MP.UNIT;
}
function placeById(id: string): Place {
  return PLACES.find((p) => p.id === id)!;
}

function MapGameTab() {
  const [roundIdx, setRoundIdx] = useState(0);
  const [dxIn, setDxIn] = useState("");
  const [dyIn, setDyIn] = useState("");
  const [ab2In, setAb2In] = useState("");
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [solved, setSolved] = useState<Set<number>>(new Set());

  const finished = roundIdx >= ROUNDS.length;

  if (finished) {
    return (
      <MapSummary
        score={solved.size}
        total={ROUNDS.length}
        onReset={() => {
          setRoundIdx(0);
          setSolved(new Set());
          resetInputs();
        }}
      />
    );
  }

  const round = ROUNDS[roundIdx];
  const pa = placeById(round.a);
  const pb = placeById(round.b);
  const cDx = Math.abs(pb.x - pa.x);
  const cDy = Math.abs(pb.y - pa.y);
  const cAb2 = cDx * cDx + cDy * cDy;

  function resetInputs() {
    setDxIn("");
    setDyIn("");
    setAb2In("");
    setChecked(false);
    setRevealed(false);
  }

  const dxOk = Number(dxIn) === cDx && dxIn.trim() !== "";
  const dyOk = Number(dyIn) === cDy && dyIn.trim() !== "";
  const ab2Ok = Number(ab2In) === cAb2 && ab2In.trim() !== "";
  const allOk = dxOk && dyOk && ab2Ok;

  function handleCheck() {
    setChecked(true);
    if (dxOk && dyOk && ab2Ok) {
      setRevealed(true);
      setSolved((s) => new Set(s).add(roundIdx));
    }
  }

  function handleNext() {
    setRoundIdx((i) => i + 1);
    resetInputs();
  }

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
          🚁 마을 배달 드론 · 문제 {roundIdx + 1} / {ROUNDS.length}
        </p>
        <span className="rounded-full border border-emerald-400/45 bg-emerald-400/15 px-3 py-1 font-mono text-xs font-bold text-emerald-100">
          해결 {solved.size} / {ROUNDS.length}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-300">
        드론이{" "}
        <b className={"rounded px-1 " + chipText(pa.color)}>
          {pa.emoji} {pa.name}
        </b>{" "}
        에서{" "}
        <b className={"rounded px-1 " + chipText(pb.color)}>
          {pb.emoji} {pb.name}
        </b>{" "}
        까지 <b className="text-emerald-200">직선</b>으로 날아갑니다. 비행 거리를 구해 주세요!
      </p>

      {/* 지도 */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg
          viewBox={`0 0 ${MP.VB_W} ${MP.VB_H}`}
          className="w-full select-none"
          role="img"
          aria-label="마을 지도"
        >
          {/* 격자 */}
          {range(MP.MINX, MP.MAXX).map((v) => (
            <line
              key={`mx${v}`}
              x1={mpX(v)}
              y1={mpY(MP.MAXY)}
              x2={mpX(v)}
              y2={mpY(MP.MINY)}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          ))}
          {range(MP.MINY, MP.MAXY).map((v) => (
            <line
              key={`my${v}`}
              x1={mpX(MP.MINX)}
              y1={mpY(v)}
              x2={mpX(MP.MAXX)}
              y2={mpY(v)}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          ))}
          {/* 축 */}
          <line
            x1={mpX(MP.MINX)}
            y1={mpY(0)}
            x2={mpX(MP.MAXX)}
            y2={mpY(0)}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1.5}
          />
          <line
            x1={mpX(0)}
            y1={mpY(MP.MINY)}
            x2={mpX(0)}
            y2={mpY(MP.MAXY)}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1.5}
          />

          {/* 활동 중인 두 점 사이: 직각 다리 + 빗변 */}
          <line
            x1={mpX(pa.x)}
            y1={mpY(pa.y)}
            x2={mpX(pb.x)}
            y2={mpY(pa.y)}
            stroke="rgba(148,163,184,0.7)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <line
            x1={mpX(pb.x)}
            y1={mpY(pa.y)}
            x2={mpX(pb.x)}
            y2={mpY(pb.y)}
            stroke="rgba(148,163,184,0.7)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <line
            x1={mpX(pa.x)}
            y1={mpY(pa.y)}
            x2={mpX(pb.x)}
            y2={mpY(pb.y)}
            stroke="#34d399"
            strokeWidth={2.5}
            className="animate-pulse"
          />

          {/* 건물 칩 */}
          {PLACES.map((p) => {
            const active = p.id === pa.id || p.id === pb.id;
            return (
              <foreignObject
                key={p.id}
                x={mpX(p.x) - 30}
                y={mpY(p.y) - 22}
                width={60}
                height={44}
              >
                <div
                  className={
                    "flex flex-col items-center justify-center rounded-lg border px-1 py-0.5 text-center " +
                    p.color +
                    (active ? " ring-2 ring-emerald-300/70" : " opacity-70")
                  }
                >
                  <span className="text-base leading-none">{p.emoji}</span>
                  <span className="mt-0.5 text-[8px] font-bold leading-none">{p.name}</span>
                  <span className="text-[7px] font-mono leading-none opacity-80">
                    ({fmtNum(p.x)}, {fmtNum(p.y)})
                  </span>
                </div>
              </foreignObject>
            );
          })}
        </svg>
      </div>

      {/* 단계별 입력 */}
      <div className="mt-3 space-y-2">
        <StepInput
          label={`① 가로 차이  |x₂ − x₁|`}
          value={dxIn}
          onChange={setDxIn}
          ok={dxOk}
          showMark={checked}
          disabled={revealed}
        />
        <StepInput
          label={`② 세로 차이  |y₂ − y₁|`}
          value={dyIn}
          onChange={setDyIn}
          ok={dyOk}
          showMark={checked}
          disabled={revealed}
        />
        <StepInput
          label={`③ AB² = 가로² + 세로²`}
          value={ab2In}
          onChange={setAb2In}
          ok={ab2Ok}
          showMark={checked}
          disabled={revealed}
        />
      </div>

      {/* 피드백 / 결과 */}
      {checked && !allOk && !revealed ? (
        <p className="mt-3 rounded-xl border border-rose-400/45 bg-rose-400/15 px-3 py-2 text-center text-sm font-bold text-rose-100">
          ❌ 빨간 칸을 다시 확인해 보세요. 두 점의 좌표를 지도에서 읽어 차이를 구해 보세요.
        </p>
      ) : null}

      {revealed ? (
        <div className="mt-3 rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-4 py-3 text-center">
          <p className="text-sm font-bold text-emerald-100">✅ 정답! 드론이 무사히 도착했어요.</p>
          <p className="mt-1 font-mono text-base font-bold text-white">
            두 점 사이의 거리 = √{cAb2} = {radicalText(cAb2)}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex justify-center gap-2">
        {!revealed ? (
          <button
            type="button"
            onClick={handleCheck}
            className="rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 px-6 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/25"
          >
            거리 확인 🚁
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-6 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
          >
            {roundIdx + 1 < ROUNDS.length ? "다음 배달 →" : "결과 보기 🎉"}
          </button>
        )}
      </div>
    </div>
  );
}

/** 지도 칩 색 클래스에서 text-* 부분만 뽑아 인라인 강조에 재사용. */
function chipText(color: string): string {
  const m = color.match(/text-[a-z]+-\d+/);
  return m ? m[0] : "text-slate-100";
}

function StepInput({
  label,
  value,
  onChange,
  ok,
  showMark,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  ok: boolean;
  showMark: boolean;
  disabled: boolean;
}) {
  const border = !showMark
    ? "border-white/10"
    : ok
      ? "border-emerald-400/55"
      : "border-rose-400/55";
  return (
    <div className="flex items-center gap-2">
      <label className="flex-1 font-mono text-sm text-slate-200">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9-]/g, ""))}
        disabled={disabled}
        className={
          "w-24 rounded-lg border-2 bg-slate-900 px-3 py-1.5 text-center font-mono text-white outline-none transition focus:border-cyan-300 disabled:opacity-60 " +
          border
        }
        placeholder="?"
      />
      <span className="w-5 text-center text-base">
        {showMark ? (ok ? "✅" : "❌") : ""}
      </span>
    </div>
  );
}

function MapSummary({
  score,
  total,
  onReset,
}: {
  score: number;
  total: number;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-emerald-400/45 bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 p-5 text-center">
      <p className="text-3xl">🎉</p>
      <p className="mt-2 text-xl font-extrabold text-emerald-200">모든 배달 완료!</p>
      <p className="mt-2 font-mono text-lg font-bold text-emerald-100">
        해결한 문제: {score} / {total}
      </p>
      <p className="mt-3 text-sm text-emerald-100">
        가로·세로 차이로 직각삼각형을 만들고 피타고라스 정리로 거리를 구하는 방법, 이제
        익숙해졌나요? 아래 성찰도 완성해 보세요. ✏️
      </p>
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↻ 처음부터 다시
        </button>
      </div>
    </div>
  );
}
