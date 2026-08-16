"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "median_2to1",
    prompt:
      "탭①에서 삼각형을 여러 모양으로 바꿔도 무게중심 G가 중선을 꼭짓점에서부터 항상 2:1로 내분함을 확인했습니다. 이 성질을 내분점 공식(예: G = (2·M + 1·A)/3, M은 대변의 중점)과 연결해 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 무게중심은 중선 AM을 A쪽:M쪽 = 2:1 로 내분한 점이므로, 2:1 내분점 공식에 넣으면 (2M+A)/3 = (A+B+C)/3 가 되어 세 꼭짓점의 평균과 같아진다.",
  },
  {
    id: "min_sum",
    prompt:
      "탭②에서 AP² + BP² + CP² 이 최소가 되는 점을 직접 찾아보았습니다. 히트맵에서 값이 가장 작은(바닥) 위치와 무게중심의 위치를 비교해 관찰한 것을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 값이 가장 낮은 색이 모인 지점이 정확히 무게중심 자리였고, 무게중심에서 멀어질수록 사방으로 값이 커졌다.",
  },
  {
    id: "centroid_invariance",
    prompt:
      "탭③·④에서 중점(또는 각 변을 같은 비로 내분한 점)으로 만든 삼각형의 무게중심이 원래 삼각형의 무게중심과 항상 일치했습니다. 그 이유를 ‘무게중심 = 세 꼭짓점 좌표의 평균’이라는 점과 연결해 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 각 변을 같은 비 s로 내분한 세 점을 더하면 (A+B+C)가 그대로 남아, 그 평균인 무게중심도 원래와 같아지기 때문이다.",
  },
];

// ─── 좌표평면 설정 ────────────────────────────────────────────
const CV = { MINX: -1, MAXX: 9, MINY: -1, MAXY: 9, UNIT: 30, LEFT: 40, TOP: 18 };
const VBW = CV.LEFT + (CV.MAXX - CV.MINX) * CV.UNIT + 20; // 360
const VBH = CV.TOP + (CV.MAXY - CV.MINY) * CV.UNIT + 20; // 338
function sx(v: number): number {
  return CV.LEFT + (v - CV.MINX) * CV.UNIT;
}
function sy(v: number): number {
  return CV.TOP + (CV.MAXY - v) * CV.UNIT;
}

type Pt = { x: number; y: number };

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function range(lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let i = lo; i <= hi; i++) out.push(i);
  return out;
}
function nf(v: number): string {
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}
function centroid(a: Pt, b: Pt, c: Pt): Pt {
  return { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
}
function mid(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function dist2(a: Pt, b: Pt): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** SVG 좌표 → 데이터 좌표(옵션 스냅). */
function svgToData(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
  snap?: number
): Pt {
  const rect = svg.getBoundingClientRect();
  const px = (clientX - rect.left) * (VBW / rect.width);
  const py = (clientY - rect.top) * (VBH / rect.height);
  let x = (px - CV.LEFT) / CV.UNIT + CV.MINX;
  let y = CV.MAXY - (py - CV.TOP) / CV.UNIT;
  if (snap) {
    x = Math.round(x / snap) * snap;
    y = Math.round(y / snap) * snap;
  }
  return { x: clamp(x, CV.MINX, CV.MAXX), y: clamp(y, CV.MINY, CV.MAXY) };
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "median" | "minsum" | "medial" | "general";

export default function CentroidLab() {
  const [tab, setTab] = useState<Tab>("median");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔺 무게중심과 내분</h3>
        <p className="mt-2 leading-7 text-slate-300">
          삼각형의 <b className="text-emerald-200">무게중심</b>이 가진 성질들을 직접 조작하고
          시뮬레이션하며 <b className="text-cyan-200">내분</b>과 연결해 이해해 보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "median"} onClick={() => setTab("median")}>
          ① 중선을 2:1로
        </TabButton>
        <TabButton active={tab === "minsum"} onClick={() => setTab("minsum")}>
          ② AP²+BP²+CP² 최소
        </TabButton>
        <TabButton active={tab === "medial"} onClick={() => setTab("medial")}>
          ③ 중점삼각형
        </TabButton>
        <TabButton active={tab === "general"} onClick={() => setTab("general")}>
          ④ 일반화 ✨
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "median" ? <MedianTab /> : null}
        {tab === "minsum" ? <MinSumTab /> : null}
        {tab === "medial" ? <MedialTab /> : null}
        {tab === "general" ? <GeneralTab /> : null}
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

// ─── 공용: 격자·축 ────────────────────────────────────────────
function PlaneBackground() {
  return (
    <g>
      {range(CV.MINX, CV.MAXX).map((v) => (
        <line
          key={`gx${v}`}
          x1={sx(v)}
          y1={sy(CV.MAXY)}
          x2={sx(v)}
          y2={sy(CV.MINY)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}
      {range(CV.MINY, CV.MAXY).map((v) => (
        <line
          key={`gy${v}`}
          x1={sx(CV.MINX)}
          y1={sy(v)}
          x2={sx(CV.MAXX)}
          y2={sy(v)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}
      <line x1={sx(CV.MINX)} y1={sy(0)} x2={sx(CV.MAXX)} y2={sy(0)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={sx(0)} y1={sy(CV.MINY)} x2={sx(0)} y2={sy(CV.MAXY)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <text x={sx(CV.MAXX) + 4} y={sy(0) + 4} className="fill-slate-400 text-[10px] italic">x</text>
      <text x={sx(0) - 10} y={sy(CV.MAXY) - 2} className="fill-slate-400 text-[10px] italic">y</text>
    </g>
  );
}

function VertexHandle({
  p,
  color,
  label,
  onDown,
}: {
  p: Pt;
  color: string;
  label: string;
  onDown?: () => void;
}) {
  return (
    <g
      className={onDown ? "cursor-grab touch-none" : ""}
      onPointerDown={
        onDown
          ? (e) => {
              e.preventDefault();
              onDown();
            }
          : undefined
      }
    >
      {onDown ? <circle cx={sx(p.x)} cy={sy(p.y)} r={15} fill="transparent" /> : null}
      <circle cx={sx(p.x)} cy={sy(p.y)} r={6} fill={color} stroke="#0f172a" strokeWidth={2} />
      <text x={sx(p.x)} y={sy(p.y) - 11} textAnchor="middle" className="fill-white text-[12px] font-bold">
        {label}
      </text>
    </g>
  );
}

// ─── 탭 ① 중선 2:1 내분 ──────────────────────────────────────
function MedianTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState<Pt>({ x: 4, y: 8 });
  const [b, setB] = useState<Pt>({ x: 1, y: 1 });
  const [c, setC] = useState<Pt>({ x: 8, y: 2 });
  const [dragging, setDragging] = useState<null | "A" | "B" | "C">(null);
  const [quiz, setQuiz] = useState<null | string>(null);

  useEffect(() => {
    if (!dragging) return;
    function move(e: PointerEvent) {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const p = svgToData(svg, e.clientX, e.clientY, 1);
      if (dragging === "A") setA(p);
      else if (dragging === "B") setB(p);
      else setC(p);
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

  const g = centroid(a, b, c);
  const ma = mid(b, c); // A의 대변 중점
  const mb = mid(c, a);
  const mc = mid(a, b);
  const ag = dist(a, g);
  const gm = dist(g, ma);
  const ratio = gm === 0 ? 0 : ag / gm;

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 꼭짓점 <b className="text-cyan-200">A·B·C</b> 를 끌어 삼각형을 바꿔 보세요. 세 중선이
        만나는 <b className="text-emerald-200">무게중심 G</b> 가 각 중선을 꼭짓점에서부터 항상{" "}
        <b className="text-amber-200">2 : 1</b> 로 나눕니다.
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg ref={svgRef} viewBox={`0 0 ${VBW} ${VBH}`} className="mx-auto block w-full max-w-md touch-none select-none" role="img" aria-label="무게중심과 중선 2:1">
          <PlaneBackground />
          {/* 삼각형 */}
          <polygon points={`${sx(a.x)},${sy(a.y)} ${sx(b.x)},${sy(b.y)} ${sx(c.x)},${sy(c.y)}`} fill="rgba(52,211,153,0.08)" stroke="#34d399" strokeWidth={2} />
          {/* 중선들 (B,C 것은 옅게) */}
          <line x1={sx(b.x)} y1={sy(b.y)} x2={sx(mb.x)} y2={sy(mb.y)} stroke="rgba(148,163,184,0.5)" strokeWidth={1.5} />
          <line x1={sx(c.x)} y1={sy(c.y)} x2={sx(mc.x)} y2={sy(mc.y)} stroke="rgba(148,163,184,0.5)" strokeWidth={1.5} />
          {/* 중선 A-Ma 강조 */}
          <line x1={sx(a.x)} y1={sy(a.y)} x2={sx(g.x)} y2={sy(g.y)} stroke="#22d3ee" strokeWidth={3} />
          <line x1={sx(g.x)} y1={sy(g.y)} x2={sx(ma.x)} y2={sy(ma.y)} stroke="#fbbf24" strokeWidth={3} />
          {/* 대변 중점 Ma */}
          <circle cx={sx(ma.x)} cy={sy(ma.y)} r={4} fill="#94a3b8" stroke="#0f172a" strokeWidth={1.5} />
          <text x={sx(ma.x)} y={sy(ma.y) + 16} textAnchor="middle" className="fill-slate-300 text-[10px] font-bold">M</text>
          {/* 무게중심 G */}
          <circle cx={sx(g.x)} cy={sy(g.y)} r={6} fill="#34d399" stroke="#0f172a" strokeWidth={2} className="animate-pulse" />
          <text x={sx(g.x) + 10} y={sy(g.y) - 8} className="fill-emerald-200 text-[12px] font-bold">G</text>
          {/* 세그먼트 길이 라벨 */}
          <text x={(sx(a.x) + sx(g.x)) / 2 + 8} y={(sy(a.y) + sy(g.y)) / 2} className="fill-cyan-200 font-mono text-[10px] font-bold">AG</text>
          <text x={(sx(g.x) + sx(ma.x)) / 2 + 8} y={(sy(g.y) + sy(ma.y)) / 2} className="fill-amber-200 font-mono text-[10px] font-bold">GM</text>
          {/* 꼭짓점 */}
          <VertexHandle p={a} color="#22d3ee" label="A" onDown={() => setDragging("A")} />
          <VertexHandle p={b} color="#a78bfa" label="B" onDown={() => setDragging("B")} />
          <VertexHandle p={c} color="#fb7185" label="C" onDown={() => setDragging("C")} />
        </svg>
      </div>

      <div className="mt-3 rounded-xl border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-4 py-3 font-mono text-sm">
        <p className="text-slate-200">
          G = ((x₁+x₂+x₃)/3, (y₁+y₂+y₃)/3) = ({nf(g.x)}, {nf(g.y)})
        </p>
        <p className="mt-2 text-slate-300">
          AG : GM = {nf(ag)} : {nf(gm)} ={" "}
          <b className="text-amber-200">{nf(ratio)} : 1</b>{" "}
          <span className="text-emerald-300">→ 항상 2 : 1 ✓</span>
        </p>
        <p className="mt-2 text-slate-300">
          즉 <b className="text-white">G = 중선 AM을 2:1로 내분한 점 = (2·M + 1·A) / 3</b>
        </p>
      </div>

      {/* 미니 퀴즈 */}
      <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
        <p className="text-sm font-semibold text-slate-200">
          ❓ 무게중심은 중선을 꼭짓점에서부터 몇 : 몇으로 나눌까요?
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["1 : 1", "2 : 1", "3 : 1", "3 : 2"].map((opt) => {
            const correct = opt === "2 : 1";
            const chosen = quiz === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setQuiz(opt)}
                className={
                  "rounded-lg border-2 px-3 py-1 font-mono text-sm font-bold transition " +
                  (chosen
                    ? correct
                      ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100"
                      : "border-rose-400/60 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {opt}
              </button>
            );
          })}
        </div>
        {quiz ? (
          <p className={"mt-2 text-sm font-bold " + (quiz === "2 : 1" ? "text-emerald-200" : "text-rose-200")}>
            {quiz === "2 : 1" ? "✅ 정답! 꼭짓점 쪽이 2, 중점 쪽이 1입니다." : "❌ 다시 생각해 보세요. 위 그래프의 AG와 GM 길이를 비교해 보세요."}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ─── 탭 ② AP²+BP²+CP² 최소 (히트맵) ──────────────────────────
// 무게중심이 정수 격자점 (4, 3) 이 되도록 선택 → 드래그(0.5 스냅)로도 정확히 도달 가능.
const T2_A: Pt = { x: 1, y: 1 };
const T2_B: Pt = { x: 7, y: 1 };
const T2_C: Pt = { x: 4, y: 7 };

function heatColor(t: number): string {
  const c0 = [34, 197, 94]; // emerald (min)
  const c1 = [251, 191, 36]; // amber
  const c2 = [244, 63, 94]; // rose (max)
  let a: number[];
  let b: number[];
  let f: number;
  if (t < 0.5) {
    a = c0;
    b = c1;
    f = t / 0.5;
  } else {
    a = c1;
    b = c2;
    f = (t - 0.5) / 0.5;
  }
  const r = Math.round(a[0] + (b[0] - a[0]) * f);
  const g = Math.round(a[1] + (b[1] - a[1]) * f);
  const bl = Math.round(a[2] + (b[2] - a[2]) * f);
  return `rgb(${r}, ${g}, ${bl})`;
}

function MinSumTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [p, setP] = useState<Pt>({ x: 2, y: 2 });
  const [dragging, setDragging] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [best, setBest] = useState<number | null>(null);

  const g = centroid(T2_A, T2_B, T2_C);
  const sG = dist2(T2_A, g) + dist2(T2_B, g) + dist2(T2_C, g);
  const sP = dist2(T2_A, p) + dist2(T2_B, p) + dist2(T2_C, p);
  const overPct = sG === 0 ? 0 : Math.round(((sP - sG) / sG) * 100);

  // 히트맵 (삼각형 고정 → 1회 계산)
  const cells = useMemo(() => {
    const step = 0.4;
    const raw: { gx: number; gy: number; s: number }[] = [];
    let lo = Infinity;
    let hi = -Infinity;
    for (let gx = CV.MINX; gx < CV.MAXX; gx += step) {
      for (let gy = CV.MINY; gy < CV.MAXY; gy += step) {
        const cxp = gx + step / 2;
        const cyp = gy + step / 2;
        const cp = { x: cxp, y: cyp };
        const s = dist2(T2_A, cp) + dist2(T2_B, cp) + dist2(T2_C, cp);
        raw.push({ gx, gy, s });
        if (s < lo) lo = s;
        if (s > hi) hi = s;
      }
    }
    return raw.map((r) => ({
      x: sx(r.gx),
      y: sy(r.gy + step),
      w: CV.UNIT * step + 0.6,
      h: CV.UNIT * step + 0.6,
      fill: heatColor((r.s - lo) / (hi - lo)),
    }));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    function move(e: PointerEvent) {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const np = svgToData(svg, e.clientX, e.clientY, 0.5);
      setP(np);
      const s = dist2(T2_A, np) + dist2(T2_B, np) + dist2(T2_C, np);
      setBest((prev) => (prev === null ? s : Math.min(prev, s)));
    }
    function up() {
      setDragging(false);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging]);

  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-indigo-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 삼각형 안팎으로 점 <b className="text-white">P</b> 를 끌어 보세요. 색이 진한
        (초록) 곳일수록 <b className="text-emerald-200">AP² + BP² + CP² 이 작습니다.</b> 값이
        가장 작아지는 자리를 찾아보세요!
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg ref={svgRef} viewBox={`0 0 ${VBW} ${VBH}`} className="mx-auto block w-full max-w-md touch-none select-none" role="img" aria-label="AP²+BP²+CP² 히트맵">
          {/* 히트맵 */}
          {cells.map((cl, i) => (
            <rect key={i} x={cl.x} y={cl.y} width={cl.w} height={cl.h} fill={cl.fill} fillOpacity={0.5} />
          ))}
          <PlaneBackground />
          {/* 삼각형 */}
          <polygon
            points={`${sx(T2_A.x)},${sy(T2_A.y)} ${sx(T2_B.x)},${sy(T2_B.y)} ${sx(T2_C.x)},${sy(T2_C.y)}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={2}
          />
          {/* P에서 세 꼭짓점으로 선 */}
          {[T2_A, T2_B, T2_C].map((v, i) => (
            <line key={i} x1={sx(p.x)} y1={sy(p.y)} x2={sx(v.x)} y2={sy(v.y)} stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeDasharray="3 3" />
          ))}
          <VertexHandle p={T2_A} color="#e2e8f0" label="A" />
          <VertexHandle p={T2_B} color="#e2e8f0" label="B" />
          <VertexHandle p={T2_C} color="#e2e8f0" label="C" />
          {/* 무게중심 (공개 시) */}
          {reveal ? (
            <g>
              <circle cx={sx(g.x)} cy={sy(g.y)} r={7} fill="none" stroke="#34d399" strokeWidth={2.5} className="animate-pulse" />
              <text x={sx(g.x) + 10} y={sy(g.y) - 8} className="fill-emerald-200 text-[11px] font-bold">G(무게중심)</text>
            </g>
          ) : null}
          {/* 점 P (드래그) */}
          <g
            className="cursor-grab touch-none"
            onPointerDown={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
          >
            <circle cx={sx(p.x)} cy={sy(p.y)} r={15} fill="transparent" />
            <circle cx={sx(p.x)} cy={sy(p.y)} r={7} fill="#38bdf8" stroke="#0f172a" strokeWidth={2} />
            <text x={sx(p.x)} y={sy(p.y) - 12} textAnchor="middle" className="fill-sky-200 text-[12px] font-bold">P</text>
          </g>
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">
        <div className="rounded-lg border border-sky-400/25 bg-sky-400/[0.06] px-3 py-2 text-center">
          <p className="text-[11px] text-slate-400">현재 P 에서의 값</p>
          <p className="text-lg font-bold text-sky-100">{nf(sP)}</p>
        </div>
        <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/[0.06] px-3 py-2 text-center">
          <p className="text-[11px] text-slate-400">내 최저 기록</p>
          <p className="text-lg font-bold text-emerald-100">{best === null ? "—" : nf(best)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setReveal((r) => !r)}
          className="rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 px-5 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/25"
        >
          {reveal ? "무게중심 숨기기" : "정답(무게중심) 확인 ✨"}
        </button>
        <button
          type="button"
          onClick={() => {
            setP({ x: g.x, y: g.y });
            setReveal(true);
            setBest((prev) => (prev === null ? sG : Math.min(prev, sG)));
          }}
          className="rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
        >
          P를 무게중심에 놓기
        </button>
      </div>

      {reveal ? (
        <p className="mt-3 rounded-xl border border-emerald-400/45 bg-emerald-400/10 px-4 py-2 text-center text-sm text-emerald-50">
          무게중심 G({nf(g.x)}, {nf(g.y)})에서 값이 <b>{nf(sG)}</b> 로 <b>최소</b>! 지금 P는 그보다{" "}
          <b className="text-amber-200">{overPct > 0 ? `${overPct}% 큼` : "최소와 같음"}</b>.
        </p>
      ) : null}
    </div>
  );
}

// ─── 탭 ③ 중점삼각형 (예제) ──────────────────────────────────
const T3_A: Pt = { x: 1, y: 0 };
const T3_B: Pt = { x: 5, y: 2 };
const T3_C: Pt = { x: 3, y: 4 };

function MedialTab() {
  const P = mid(T3_A, T3_B); // (3,1)
  const Q = mid(T3_B, T3_C); // (4,3)
  const R = mid(T3_C, T3_A); // (2,2)
  const gABC = centroid(T3_A, T3_B, T3_C); // (3,2)
  const gPQR = centroid(P, Q, R); // (3,2)

  const [ax, setAx] = useState("");
  const [ay, setAy] = useState("");
  const [px, setPx] = useState("");
  const [py, setPy] = useState("");
  const [checked, setChecked] = useState(false);

  const abcOk = Number(ax) === gABC.x && Number(ay) === gABC.y && ax !== "" && ay !== "";
  const pqrOk = Number(px) === gPQR.x && Number(py) === gPQR.y && px !== "" && py !== "";
  const bothOk = abcOk && pqrOk;

  // 이 탭 전용 확대 좌표축 — 예제 좌표는 그대로 두고 삼각형에 맞춰 약 2배로 크게 그린다.
  const L = { MINX: 0, MAXX: 5, MINY: -1, MAXY: 4, UNIT: 52, LEFT: 34, TOP: 16 };
  const LVBW = L.LEFT + (L.MAXX - L.MINX) * L.UNIT + 46;
  const LVBH = L.TOP + (L.MAXY - L.MINY) * L.UNIT + 24;
  const lsx = (v: number) => L.LEFT + (v - L.MINX) * L.UNIT;
  const lsy = (v: number) => L.TOP + (L.MAXY - v) * L.UNIT;
  const vtx = (
    pt: Pt,
    color: string,
    label: string,
    ly = -12,
    anchor: "start" | "middle" | "end" = "middle",
    lx = 0
  ) => (
    <g key={label}>
      <circle cx={lsx(pt.x)} cy={lsy(pt.y)} r={7} fill={color} stroke="#0f172a" strokeWidth={2} />
      <text x={lsx(pt.x) + lx} y={lsy(pt.y) + ly} textAnchor={anchor} className="fill-white text-[12px] font-bold">
        {label}
      </text>
    </g>
  );

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        세 점 <b className="text-cyan-200">A(1, 0)</b>, <b className="text-violet-200">B(5, 2)</b>,{" "}
        <b className="text-rose-200">C(3, 4)</b> 로 만든 삼각형에서 세 변의 중점 P, Q, R 로
        <b className="text-amber-200"> 중점삼각형</b> 을 만들었습니다. 두 삼각형의 무게중심이
        같은지 직접 구해 확인해 보세요!
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg viewBox={`0 0 ${LVBW} ${LVBH}`} className="mx-auto block w-full max-w-md select-none" role="img" aria-label="중점삼각형">
          {/* 격자 */}
          {range(L.MINX, L.MAXX).map((v) => (
            <line key={`gx${v}`} x1={lsx(v)} y1={lsy(L.MAXY)} x2={lsx(v)} y2={lsy(L.MINY)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          ))}
          {range(L.MINY, L.MAXY).map((v) => (
            <line key={`gy${v}`} x1={lsx(L.MINX)} y1={lsy(v)} x2={lsx(L.MAXX)} y2={lsy(v)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          ))}
          {/* 축 */}
          <line x1={lsx(L.MINX)} y1={lsy(0)} x2={lsx(L.MAXX)} y2={lsy(0)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
          <line x1={lsx(0)} y1={lsy(L.MINY)} x2={lsx(0)} y2={lsy(L.MAXY)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
          <text x={lsx(L.MAXX) + 4} y={lsy(0) + 4} className="fill-slate-400 text-[10px] italic">x</text>
          <text x={lsx(0) - 10} y={lsy(L.MAXY) - 2} className="fill-slate-400 text-[10px] italic">y</text>
          {/* 삼각형 */}
          <polygon points={`${lsx(T3_A.x)},${lsy(T3_A.y)} ${lsx(T3_B.x)},${lsy(T3_B.y)} ${lsx(T3_C.x)},${lsy(T3_C.y)}`} fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth={2} />
          <polygon points={`${lsx(P.x)},${lsy(P.y)} ${lsx(Q.x)},${lsy(Q.y)} ${lsx(R.x)},${lsy(R.y)}`} fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3" />
          {/* 무게중심 (정답 시) */}
          {checked && bothOk ? (
            <g>
              <circle cx={lsx(gABC.x)} cy={lsy(gABC.y)} r={8} fill="#34d399" stroke="#0f172a" strokeWidth={2} className="animate-pulse" />
              <text x={lsx(gABC.x) + 11} y={lsy(gABC.y) - 9} className="fill-emerald-200 text-[11px] font-bold">G</text>
            </g>
          ) : null}
          {/* 꼭짓점 · 중점 */}
          {vtx(T3_A, "#38bdf8", "A", 18)}
          {vtx(T3_B, "#a78bfa", "B")}
          {vtx(T3_C, "#fb7185", "C", 18)}
          {vtx(P, "#fbbf24", "P", 18)}
          {vtx(Q, "#fbbf24", "Q")}
          {vtx(R, "#fbbf24", "R", -12, "end", -10)}
        </svg>
      </div>

      <p className="mt-3 text-center font-mono text-xs text-slate-400">
        중점 — P(3, 1) = AB의 중점 · Q(4, 3) = BC의 중점 · R(2, 2) = CA의 중점
      </p>

      <div className="mt-3 space-y-3">
        <CoordQuestion
          label="삼각형 ABC의 무게중심 좌표"
          xv={ax} yv={ay} setX={setAx} setY={setAy}
          ok={abcOk} showMark={checked}
        />
        <CoordQuestion
          label="중점삼각형 PQR의 무게중심 좌표"
          xv={px} yv={py} setX={setPx} setY={setPy}
          ok={pqrOk} showMark={checked}
        />
      </div>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25"
        >
          확인하기
        </button>
      </div>

      {checked ? (
        bothOk ? (
          <p className="mt-3 rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-4 py-3 text-center text-sm font-bold text-emerald-100">
            🎉 두 무게중심이 모두 (3, 2)로 <b>일치</b>합니다! 중점삼각형의 무게중심은 원래
            삼각형의 무게중심과 같아요.
          </p>
        ) : (
          <p className="mt-3 rounded-xl border border-rose-400/45 bg-rose-400/15 px-4 py-2 text-center text-sm font-bold text-rose-100">
            ❌ 무게중심 = (세 꼭짓점의 x평균, y평균) 으로 다시 구해 보세요.
          </p>
        )
      ) : null}
    </div>
  );
}

function CoordQuestion({
  label,
  xv,
  yv,
  setX,
  setY,
  ok,
  showMark,
}: {
  label: string;
  xv: string;
  yv: string;
  setX: (v: string) => void;
  setY: (v: string) => void;
  ok: boolean;
  showMark: boolean;
}) {
  const border = !showMark ? "border-white/10" : ok ? "border-emerald-400/55" : "border-rose-400/55";
  const cls =
    "w-16 rounded-lg border-2 bg-slate-900 px-2 py-1.5 text-center font-mono text-white outline-none transition focus:border-cyan-300 " +
    border;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex-1 text-sm text-slate-200">{label}</span>
      <span className="font-mono text-slate-300">(</span>
      <input type="text" inputMode="numeric" value={xv} onChange={(e) => setX(e.target.value.replace(/[^0-9.-]/g, ""))} aria-label={label + " x"} className={cls} placeholder="x" />
      <span className="font-mono text-slate-300">,</span>
      <input type="text" inputMode="numeric" value={yv} onChange={(e) => setY(e.target.value.replace(/[^0-9.-]/g, ""))} aria-label={label + " y"} className={cls} placeholder="y" />
      <span className="font-mono text-slate-300">)</span>
      <span className="w-5 text-center">{showMark ? (ok ? "✅" : "❌") : ""}</span>
    </div>
  );
}

// ─── 탭 ④ 일반화 (각 변 같은 비 내분) ────────────────────────
function GeneralTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState<Pt>({ x: 1, y: 1 });
  const [b, setB] = useState<Pt>({ x: 8, y: 2 });
  const [c, setC] = useState<Pt>({ x: 4, y: 8 });
  const [s, setS] = useState(0.5);
  const [dragging, setDragging] = useState<null | "A" | "B" | "C">(null);

  useEffect(() => {
    if (!dragging) return;
    function move(e: PointerEvent) {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svgToData(svg, e.clientX, e.clientY, 1);
      if (dragging === "A") setA(pt);
      else if (dragging === "B") setB(pt);
      else setC(pt);
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

  // 각 변을 (1-s):s 로 내분 (A→B, B→C, C→A)
  const P = { x: (1 - s) * a.x + s * b.x, y: (1 - s) * a.y + s * b.y };
  const Q = { x: (1 - s) * b.x + s * c.x, y: (1 - s) * b.y + s * c.y };
  const R = { x: (1 - s) * c.x + s * a.x, y: (1 - s) * c.y + s * a.y };
  const gABC = centroid(a, b, c);
  const gPQR = centroid(P, Q, R);
  const areaRatio = 1 - 3 * s * (1 - s); // PQR / ABC

  return (
    <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 세 변을 <b className="text-amber-200">모두 같은 비 s</b> 로 내분한 점 P, Q, R 로 새
        삼각형을 만들어요. 슬라이더로 s를 바꿔 모양이 달라져도{" "}
        <b className="text-emerald-200">무게중심은 그대로</b> 인지 확인해 보세요. (꼭짓점도 끌 수
        있어요.)
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg ref={svgRef} viewBox={`0 0 ${VBW} ${VBH}`} className="mx-auto block w-full max-w-md touch-none select-none" role="img" aria-label="일반화된 내분 삼각형">
          <PlaneBackground />
          <polygon points={`${sx(a.x)},${sy(a.y)} ${sx(b.x)},${sy(b.y)} ${sx(c.x)},${sy(c.y)}`} fill="rgba(251,191,36,0.06)" stroke="#fbbf24" strokeWidth={2} />
          <polygon points={`${sx(P.x)},${sy(P.y)} ${sx(Q.x)},${sy(Q.y)} ${sx(R.x)},${sy(R.y)}`} fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth={2} />
          {[["P", P], ["Q", Q], ["R", R]].map(([lab, pt]) => (
            <circle key={lab as string} cx={sx((pt as Pt).x)} cy={sy((pt as Pt).y)} r={4} fill="#34d399" stroke="#0f172a" strokeWidth={1.5} />
          ))}
          {/* 무게중심 (공유) */}
          <circle cx={sx(gABC.x)} cy={sy(gABC.y)} r={7} fill="#f8fafc" stroke="#0f172a" strokeWidth={2} className="animate-pulse" />
          <text x={sx(gABC.x) + 10} y={sy(gABC.y) - 8} className="fill-white text-[11px] font-bold">G</text>
          <VertexHandle p={a} color="#22d3ee" label="A" onDown={() => setDragging("A")} />
          <VertexHandle p={b} color="#a78bfa" label="B" onDown={() => setDragging("B")} />
          <VertexHandle p={c} color="#fb7185" label="C" onDown={() => setDragging("C")} />
        </svg>
      </div>

      {/* s 슬라이더 + 프리셋 */}
      <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">내분비 s (각 변을 A→B 방향으로)</span>
          <span className="font-mono text-lg font-bold text-amber-200">
            {s.toFixed(2)} <span className="text-xs text-slate-400">(= {nf(Math.round(s * 100))}% 지점)</span>
          </span>
        </div>
        <input type="range" min={0.1} max={0.9} step={0.05} value={s} onChange={(e) => setS(Number(e.target.value))} aria-label="내분비 s" className="mt-1 h-2 w-full cursor-pointer accent-amber-400" />
        <div className="mt-2 flex flex-wrap gap-2">
          {[["중점 1/2", 0.5], ["1/3", 1 / 3], ["1/4", 0.25], ["2/3", 2 / 3]].map(([lab, val]) => (
            <button
              key={lab as string}
              type="button"
              onClick={() => setS(Number(val))}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200 transition hover:bg-white/10"
            >
              {lab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-xl border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-4 py-3 font-mono text-sm">
        <p className="text-slate-200">삼각형 ABC의 무게중심 = ({nf(gABC.x)}, {nf(gABC.y)})</p>
        <p className="mt-1 text-slate-200">삼각형 PQR의 무게중심 = ({nf(gPQR.x)}, {nf(gPQR.y)})</p>
        <p className="mt-2 font-bold text-emerald-200">
          → 두 무게중심이 항상 <b className="text-white">일치</b>합니다! ✓
        </p>
        <p className="mt-2 text-xs text-slate-400">
          (PQR 넓이 ÷ ABC 넓이 = {nf(areaRatio)} · s = 1/2 일 때 1/4 로 가장 작아짐 = 중점삼각형)
        </p>
      </div>
    </div>
  );
}
