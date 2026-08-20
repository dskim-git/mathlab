"use client";

import { useMemo, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  KMAX,
  LMAX,
  PROBLEMS,
  PRESETS,
  fmt,
  presetOf,
  qMaxOf,
  type PStep,
  type Preset,
  type PresetId,
  type Shape,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "two_var",
    prompt:
      "생산함수 Q = f(L, K)는 값을 하나 정하려면 노동량과 자본량을 모두 정해야 하는 이변수함수예요. 3차원 그래프를 돌려 보면서 이변수함수가 ‘곡면’으로 그려지는 까닭을 자기 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: (L, K) 한 쌍마다 Q가 하나씩 정해지니까, 바닥의 모든 점 위에 높이가 하나씩 생겨서 면이 만들어진다.",
  },
  {
    id: "section",
    prompt:
      "노동량이나 자본량 중 하나를 고정하면 곡면을 칼로 자른 단면이 나타나고, 그것이 우리가 아는 일변수함수가 됐어요. 고등학교에서 생산함수를 다룰 때 한 요소를 고정하는 것이 왜 편리한지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 자본량을 정해 두면 Q = 2√L 처럼 아는 함수가 되어 그래프를 그리거나 값을 거꾸로 구할 수 있다.",
  },
  {
    id: "shape",
    prompt:
      "곱셈형·제곱근형·덧셈형·짝 맞추기형 네 가지 생산함수의 모습은 서로 많이 달랐어요. 내가 사장이라면 어떤 모양의 생산함수를 가진 공장을 운영하고 싶은지, 그 까닭과 함께 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 짝 맞추기형은 한쪽만 늘리면 전혀 소용이 없어서 관리가 까다로울 것 같다. 나는 한쪽이 부족해도 다른 쪽으로 메울 수 있는 덧셈형이 마음 편할 것 같다.",
  },
];

type Tab = "surface" | "section" | "problem";

export default function ProductionFunctionLab() {
  const [tab, setTab] = useState<Tab>("surface");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🏭 생산함수</h3>
        <p className="mt-2 leading-7 text-slate-300">
          상품을 만들려면 <b className="text-emerald-200">노동(L)</b>과 <b className="text-sky-200">자본(K)</b>을 투입해야
          해요. 두 값을 정하면 생산량 <b className="text-amber-200">Q</b>가 하나로 정해지는데, 이 관계가 바로{" "}
          <b className="text-emerald-200">생산함수 Q = f(L, K)</b>예요. 두 손잡이를 직접 돌려 가며 생산함수의 생김새를
          만나 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "surface"} onClick={() => setTab("surface")}>① 두 변수를 함께 움직이기</TabButton>
        <TabButton active={tab === "section"} onClick={() => setTab("section")}>② 하나를 고정하면 — 단면</TabButton>
        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>③ 단계별 문제</TabButton>
      </div>

      <div className="mt-4">
        {tab === "surface" ? <SurfaceTab /> : null}
        {tab === "section" ? <SectionTab /> : null}
        {tab === "problem" ? <ProblemTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3 py-2 text-sm font-bold transition " +
        (active
          ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

/** 수식 한 줄 — 자기 행을 갖고 가로로만 넘칠 수 있게 */
function FormulaLine({ expr, className }: { expr: string; className?: string }) {
  return (
    <div className={"overflow-x-auto overflow-y-hidden py-1 " + (className ?? "")}>
      <Katex expr={expr} display />
    </div>
  );
}

function Slider({
  label,
  sub,
  value,
  min,
  max,
  step,
  onChange,
  tone,
}: {
  label: string;
  sub: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  tone: "emerald" | "sky" | "amber" | "violet";
}) {
  const text: Record<string, string> = {
    emerald: "text-emerald-200",
    sky: "text-sky-200",
    amber: "text-amber-200",
    violet: "text-violet-200",
  };
  const accent: Record<string, string> = {
    emerald: "accent-emerald-400",
    sky: "accent-sky-400",
    amber: "accent-amber-400",
    violet: "accent-violet-400",
  };
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold text-slate-300">
          <span className={text[tone]}>{label}</span> <span className="text-slate-500">{sub}</span>
        </p>
        <p className={"font-mono text-lg font-bold " + text[tone]}>{fmt(value)}</p>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-1.5 w-full " + accent[tone]}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  3차원 곡면 그리기 (인라인 SVG · 화가 알고리즘)
// ══════════════════════════════════════════════════════════════════
const D2R = Math.PI / 180;
const W3 = 430;
const H3 = 360;
const MESH = 16;

type Proj = { x: number; y: number; d: number };

/** 정규화 좌표 (u, v, w ∈ [0,1]) 를 화면 좌표로 */
function makeProject(az: number, el: number) {
  const ca = Math.cos(az * D2R);
  const sa = Math.sin(az * D2R);
  const cf = Math.cos(el * D2R);
  const sf = Math.sin(el * D2R);
  // 화면 오른쪽 r, 화면 위 u, 카메라 방향 e
  const rx = -sa,
    ry = ca;
  const ux = -sf * ca,
    uy = -sf * sa,
    uz = cf;
  const ex = cf * ca,
    ey = cf * sa,
    ez = sf;
  const S = Math.min((W3 - 54) / 1.44, (H3 - 46) / 1.76);
  const ox = W3 / 2;
  const oy = H3 / 2 + 10;
  return (u: number, v: number, w: number): Proj => {
    const x = u - 0.5,
      y = v - 0.5,
      z = w - 0.5;
    return {
      x: ox + (x * rx + y * ry) * S,
      y: oy - (x * ux + y * uy + z * uz) * S,
      d: x * ex + y * ey + z * ez,
    };
  };
}

function hexToRgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function rampColor(ramp: [string, string, string], t: number, shade: number): string {
  const c0 = hexToRgb(ramp[0]);
  const c1 = hexToRgb(ramp[1]);
  const c2 = hexToRgb(ramp[2]);
  const tt = Math.max(0, Math.min(1, t));
  const base = tt < 0.5 ? mix(c0, c1, tt * 2) : mix(c1, c2, (tt - 0.5) * 2);
  const k = 0.6 + 0.4 * shade;
  return `rgb(${Math.round(base[0] * k)},${Math.round(base[1] * k)},${Math.round(base[2] * k)})`;
}

type Face = { key: string; pts: string; fill: string; op: number; d: number };

type Curve = { pts: { L: number; K: number }[]; color: string; width: number };

function Surface3D({
  preset,
  az,
  el,
  setAz,
  setEl,
  marker,
  curves,
  plane,
  dim,
}: {
  preset: Preset;
  az: number;
  el: number;
  setAz: (v: number) => void;
  setEl: (v: number) => void;
  marker?: { L: number; K: number } | null;
  curves?: Curve[];
  plane?: { axis: "L" | "K"; value: number } | null;
  dim?: boolean;
}) {
  const drag = useRef<{ x: number; y: number; az: number; el: number } | null>(null);
  const qMax = qMaxOf(preset);
  const P = useMemo(() => makeProject(az, el), [az, el]);

  const wOf = (L: number, K: number) => (qMax <= 0 ? 0 : Math.max(0, Math.min(1, preset.f(L, K) / qMax)));
  const at = (L: number, K: number, w?: number) => P(L / LMAX, K / KMAX, w ?? wOf(L, K));

  const faces = useMemo<Face[]>(() => {
    const out: Face[] = [];
    const light = [0.35, 0.28, 0.9];
    for (let i = 0; i < MESH; i += 1) {
      for (let j = 0; j < MESH; j += 1) {
        const l0 = (i / MESH) * LMAX;
        const l1 = ((i + 1) / MESH) * LMAX;
        const k0 = (j / MESH) * KMAX;
        const k1 = ((j + 1) / MESH) * KMAX;
        const w00 = wOf(l0, k0);
        const w10 = wOf(l1, k0);
        const w11 = wOf(l1, k1);
        const w01 = wOf(l0, k1);
        const p00 = P(i / MESH, j / MESH, w00);
        const p10 = P((i + 1) / MESH, j / MESH, w10);
        const p11 = P((i + 1) / MESH, (j + 1) / MESH, w11);
        const p01 = P(i / MESH, (j + 1) / MESH, w01);
        // 법선(정규화 좌표계) — 대각선 두 개의 외적
        const ax = 1 / MESH,
          ay = 1 / MESH;
        const d1 = [ax, ay, w11 - w00];
        const d2 = [-ax, ay, w01 - w10];
        const nx = d1[1] * d2[2] - d1[2] * d2[1];
        const ny = d1[2] * d2[0] - d1[0] * d2[2];
        const nz = d1[0] * d2[1] - d1[1] * d2[0];
        const nl = Math.hypot(nx, ny, nz) || 1;
        const shade = Math.abs((nx * light[0] + ny * light[1] + nz * light[2]) / nl);
        const t = (w00 + w10 + w11 + w01) / 4;
        out.push({
          key: `s${i}-${j}`,
          pts: `${p00.x},${p00.y} ${p10.x},${p10.y} ${p11.x},${p11.y} ${p01.x},${p01.y}`,
          fill: rampColor(preset.ramp, t, shade),
          op: dim ? 0.5 : 0.95,
          d: (p00.d + p10.d + p11.d + p01.d) / 4,
        });
      }
    }
    if (plane) {
      for (let j = 0; j < MESH; j += 1) {
        const t0 = j / MESH;
        const t1 = (j + 1) / MESH;
        const a = plane.axis === "L" ? plane.value / LMAX : plane.value / KMAX;
        const q0 = plane.axis === "L" ? P(a, t0, 0) : P(t0, a, 0);
        const q1 = plane.axis === "L" ? P(a, t1, 0) : P(t1, a, 0);
        const q2 = plane.axis === "L" ? P(a, t1, 1) : P(t1, a, 1);
        const q3 = plane.axis === "L" ? P(a, t0, 1) : P(t0, a, 1);
        out.push({
          key: `p${j}`,
          pts: `${q0.x},${q0.y} ${q1.x},${q1.y} ${q2.x},${q2.y} ${q3.x},${q3.y}`,
          fill: "#fbbf24",
          op: 0.14,
          d: (q0.d + q1.d + q2.d + q3.d) / 4,
        });
      }
    }
    out.sort((p, q) => p.d - q.d);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, az, el, plane?.axis, plane?.value, dim]);

  // 바닥 격자
  const grid: string[] = [];
  for (let i = 0; i <= 5; i += 1) {
    const a = P(i / 5, 0, 0);
    const b = P(i / 5, 1, 0);
    grid.push(`M${a.x},${a.y} L${b.x},${b.y}`);
    const c = P(0, i / 5, 0);
    const d = P(1, i / 5, 0);
    grid.push(`M${c.x},${c.y} L${d.x},${d.y}`);
  }

  const O = P(0, 0, 0);
  const AL = P(1.02, 0, 0);
  const AK = P(0, 1.02, 0);
  const AQ = P(0, 0, 1.05);

  /** 축 눈금 라벨 위치 — 바깥쪽으로 살짝 밀어낸다 */
  function tickPos(u: number, v: number, ou: number, ov: number, px: number) {
    const a = P(u, v, 0);
    const b = P(u + ou, v + ov, 0);
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const n = Math.hypot(dx, dy) || 1;
    return { x: a.x + (dx / n) * px, y: a.y + (dy / n) * px };
  }

  function polyOf(c: Curve) {
    return c.pts.map((p) => { const q = at(p.L, p.K); return `${q.x},${q.y}`; }).join(" ");
  }

  const mk = marker ? at(marker.L, marker.K) : null;
  const mkBase = marker ? at(marker.L, marker.K, 0) : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <div className="overflow-x-auto overflow-y-hidden">
        <svg
          viewBox={`0 0 ${W3} ${H3}`}
          className="h-auto w-full min-w-[320px] cursor-grab touch-none select-none active:cursor-grabbing"
          style={{ touchAction: "none" }}
          role="img"
          aria-label="생산함수의 3차원 그래프"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, az, el };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            setAz(d.az - (e.clientX - d.x) * 0.45);
            setEl(Math.max(8, Math.min(85, d.el + (e.clientY - d.y) * 0.35)));
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
        >
          <rect x={0} y={0} width={W3} height={H3} rx={12} fill="#0b1220" />

          {/* 바닥 (L-K 평면) */}
          <polygon
            points={[P(0, 0, 0), P(1, 0, 0), P(1, 1, 0), P(0, 1, 0)].map((p) => `${p.x},${p.y}`).join(" ")}
            fill="rgba(148,163,184,0.07)"
          />
          {grid.map((d, i) => (
            <path key={`g${i}`} d={d} stroke="rgba(148,163,184,0.22)" strokeWidth={0.8} fill="none" />
          ))}

          {/* 곡면 + (있다면) 자르는 평면 */}
          {faces.map((f) => (
            <polygon
              key={f.key}
              points={f.pts}
              fill={f.fill}
              fillOpacity={f.op}
              stroke="rgba(255,255,255,0.13)"
              strokeWidth={0.4}
            />
          ))}

          {/* 자르는 평면의 테두리 */}
          {plane ? (
            <polygon
              points={(plane.axis === "L"
                ? [P(plane.value / LMAX, 0, 0), P(plane.value / LMAX, 1, 0), P(plane.value / LMAX, 1, 1), P(plane.value / LMAX, 0, 1)]
                : [P(0, plane.value / KMAX, 0), P(1, plane.value / KMAX, 0), P(1, plane.value / KMAX, 1), P(0, plane.value / KMAX, 1)]
              )
                .map((p) => `${p.x},${p.y}`)
                .join(" ")}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={1.4}
              strokeDasharray="5 3"
              opacity={0.75}
            />
          ) : null}

          {/* 단면 곡선 */}
          {(curves ?? []).map((c, i) => (
            <polyline key={`c${i}`} points={polyOf(c)} fill="none" stroke={c.color} strokeWidth={c.width} strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {/* 축 */}
          <path d={`M${O.x},${O.y} L${AL.x},${AL.y}`} stroke="#34d399" strokeWidth={1.6} />
          <path d={`M${O.x},${O.y} L${AK.x},${AK.y}`} stroke="#38bdf8" strokeWidth={1.6} />
          <path d={`M${O.x},${O.y} L${AQ.x},${AQ.y}`} stroke="#fbbf24" strokeWidth={1.6} />
          <text x={AL.x} y={AL.y} dy={4} textAnchor="middle" fill="#6ee7b7" fontSize={12} fontWeight={700}>L</text>
          <text x={AK.x} y={AK.y} dy={4} textAnchor="middle" fill="#7dd3fc" fontSize={12} fontWeight={700}>K</text>
          <text x={AQ.x} y={AQ.y - 6} textAnchor="middle" fill="#fcd34d" fontSize={12} fontWeight={700}>Q</text>

          {/* 눈금 */}
          {[1, 2, 3, 4, 5].map((i) => {
            const t = tickPos(i / 5, 0, 0, 0.1, 11);
            return (
              <text key={`tl${i}`} x={t.x} y={t.y} dy={3.5} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                {i}
              </text>
            );
          })}
          {[1, 2, 3, 4, 5].map((i) => {
            const t = tickPos(0, i / 5, 0.1, 0, 11);
            return (
              <text key={`tk${i}`} x={t.x} y={t.y} dy={3.5} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                {i}
              </text>
            );
          })}
          <text x={AQ.x - 12} y={P(0, 0, 1).y} dy={3} textAnchor="end" fill="#94a3b8" fontSize={9}>
            {fmt(qMax, 1)}
          </text>

          {/* 현재 점 */}
          {mk && mkBase ? (
            <g>
              <path d={`M${mkBase.x},${mkBase.y} L${mk.x},${mk.y}`} stroke="#f8fafc" strokeWidth={1.2} strokeDasharray="3 3" opacity={0.8} />
              <circle cx={mkBase.x} cy={mkBase.y} r={3} fill="#f8fafc" opacity={0.65} />
              <circle cx={mk.x} cy={mk.y} r={6.5} fill="#fff" />
              <circle cx={mk.x} cy={mk.y} r={4} fill="#f43f5e" />
            </g>
          ) : null}

          <text x={12} y={H3 - 10} fill="#64748b" fontSize={10}>
            그래프를 끌어서 돌려 보세요
          </text>
        </svg>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-1.5 px-1 pb-1">
        <ViewBtn onClick={() => { setAz(-135); setEl(26); }}>🔄 기본</ViewBtn>
        <ViewBtn onClick={() => { setAz(-180); setEl(10); }}>👁️ 정면(L)</ViewBtn>
        <ViewBtn onClick={() => { setAz(-90); setEl(10); }}>👁️ 정면(K)</ViewBtn>
        <ViewBtn onClick={() => { setAz(-135); setEl(84); }}>⬆️ 위에서</ViewBtn>
        <span className="ml-auto font-mono text-[10px] text-slate-500">
          방향 {Math.round(az)}° · 높이 {Math.round(el)}°
        </span>
      </div>
    </div>
  );
}

function ViewBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════
//  탭 ① 두 변수를 함께 움직이기
// ══════════════════════════════════════════════════════════════════
function SurfaceTab() {
  const [pid, setPid] = useState<PresetId>("mul");
  const [L, setL] = useState(3);
  const [K, setK] = useState(2);
  const [az, setAz] = useState(-135);
  const [el, setEl] = useState(26);

  const preset = presetOf(pid);
  const Q = preset.f(L, K);

  const curveL: Curve = {
    pts: Array.from({ length: 41 }, (_, i) => ({ L: (i / 40) * LMAX, K })),
    color: "#34d399",
    width: 3,
  };
  const curveK: Curve = {
    pts: Array.from({ length: 41 }, (_, i) => ({ L, K: (i / 40) * KMAX })),
    color: "#38bdf8",
    width: 3,
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-400/20 bg-slate-400/[0.05] p-4">
        <p className="text-sm font-bold text-slate-200">🧰 생산 요소</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          어떤 상품을 생산하기 위해 투입하는 투입물을 <b className="text-slate-200">생산 요소</b>라고 해요. 인적 자본,
          자연 자원처럼 다른 요소들도 있지만, 간단히 살펴보기 위해 <b className="text-emerald-200">노동 L</b>과{" "}
          <b className="text-sky-200">자본 K</b> 두 가지만 생각합니다.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPid(p.id)}
            className={
              "rounded-xl border-2 p-3 text-left transition " +
              (pid === p.id ? TONE_ON[p.tone] : "border-white/10 bg-white/5 hover:bg-white/10")
            }
          >
            <p className="text-sm font-bold text-slate-100">
              {p.emoji} {p.name}
            </p>
            <div className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-slate-100">
              <Katex expr={p.tex} />
            </div>
            <p className="mt-1 text-[11px] leading-4 text-slate-400">{p.story}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <Surface3D
          preset={preset}
          az={az}
          el={el}
          setAz={setAz}
          setEl={setEl}
          marker={{ L, K }}
          curves={[curveL, curveK]}
        />

        <div className="space-y-3">
          <Slider label="노동량 L" sub="(0 ~ 5)" value={L} min={0} max={LMAX} step={0.25} onChange={setL} tone="emerald" />
          <Slider label="자본량 K" sub="(0 ~ 5)" value={K} min={0} max={KMAX} step={0.25} onChange={setK} tone="sky" />

          <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-400/[0.08] p-4 text-center">
            <p className="text-xs font-bold text-amber-200">생산량 Q</p>
            <p className="mt-1 font-mono text-4xl font-bold text-amber-100">{fmt(Q)}</p>
            <FormulaLine expr={preset.subst(L, K)} className="mt-1 text-slate-100" />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <p className="text-xs font-bold text-slate-300">🎨 그래프 읽는 법</p>
            <ul className="mt-1.5 space-y-1 text-[11px] leading-5 text-slate-400">
              <li>
                <span className="font-bold text-emerald-300">초록 선</span> — 자본량을 지금 값으로 묶어 두고 노동량만
                움직였을 때의 생산량
              </li>
              <li>
                <span className="font-bold text-sky-300">파란 선</span> — 노동량을 묶어 두고 자본량만 움직였을 때의
                생산량
              </li>
              <li>
                <span className="font-bold text-rose-300">빨간 점</span> — 지금 고른 (L, K)에서의 생산량 Q. 바닥의 점
                위로 Q만큼 올라가 있어요.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-bold text-slate-200">🔢 생산량 표 — (L, K) 한 쌍마다 Q가 하나씩</p>
          <span className="text-[11px] text-slate-500">노란 칸이 지금 고른 값에 가장 가까운 칸이에요</span>
        </div>
        <ValueTable preset={preset} L={L} K={K} />
        <p className="mt-2 text-[11px] leading-5 text-slate-400">
          표의 <b className="text-emerald-200">가로 한 줄</b>은 노동량을 고정한 채 자본량만 바꾼 것이고,{" "}
          <b className="text-sky-200">세로 한 줄</b>은 자본량을 고정한 채 노동량만 바꾼 것이에요. 이렇게 한 줄만
          떼어 내면 일변수함수가 됩니다 — 다음 탭에서 이어서 살펴봐요.
        </p>
      </div>
    </div>
  );
}

const TONE_ON: Record<string, string> = {
  emerald: "border-emerald-400/60 bg-emerald-400/15",
  sky: "border-sky-400/60 bg-sky-400/15",
  amber: "border-amber-400/60 bg-amber-400/15",
  violet: "border-violet-400/60 bg-violet-400/15",
};

function ValueTable({ preset, L, K }: { preset: Preset; L: number; K: number }) {
  const li = Math.round(L);
  const ki = Math.round(K);
  const ints = [0, 1, 2, 3, 4, 5];
  return (
    <div className="mt-2 overflow-x-auto overflow-y-hidden">
      <table className="w-full min-w-[380px] border-collapse text-center font-mono text-xs">
        <thead>
          <tr>
            <th className="border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-bold text-slate-400">
              L \ K
            </th>
            {ints.map((k) => (
              <th
                key={k}
                className={
                  "border border-white/10 px-2 py-1.5 font-bold " +
                  (k === ki ? "bg-sky-400/20 text-sky-100" : "bg-white/5 text-sky-300/70")
                }
              >
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ints.map((l) => (
            <tr key={l}>
              <th
                className={
                  "border border-white/10 px-2 py-1.5 font-bold " +
                  (l === li ? "bg-emerald-400/20 text-emerald-100" : "bg-white/5 text-emerald-300/70")
                }
              >
                {l}
              </th>
              {ints.map((k) => {
                const hit = l === li && k === ki;
                const row = l === li || k === ki;
                return (
                  <td
                    key={k}
                    className={
                      "border border-white/10 px-2 py-1.5 " +
                      (hit
                        ? "bg-amber-400/25 font-bold text-amber-100"
                        : row
                          ? "bg-white/[0.06] text-slate-200"
                          : "text-slate-400")
                    }
                  >
                    {fmt(preset.f(l, k), 1)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  탭 ② 하나를 고정하면 — 단면
// ══════════════════════════════════════════════════════════════════
function SectionTab() {
  const [pid, setPid] = useState<PresetId>("mul");
  const [fixed, setFixed] = useState<"L" | "K">("L");
  const [fixVal, setFixVal] = useState(1);
  const [t, setT] = useState(3);
  const [az, setAz] = useState(-135);
  const [el, setEl] = useState(26);

  const preset = presetOf(pid);
  const qMax = qMaxOf(preset);
  const sec = fixed === "L" ? preset.fixL(fixVal) : preset.fixK(fixVal);
  const freeName = fixed === "L" ? "K" : "L";
  const freeKo = fixed === "L" ? "자본량" : "노동량";
  const fixKo = fixed === "L" ? "노동량" : "자본량";
  const g = (x: number) => (fixed === "L" ? preset.f(fixVal, x) : preset.f(x, fixVal));
  const curPt = fixed === "L" ? { L: fixVal, K: t } : { L: t, K: fixVal };

  const cutCurve: Curve = {
    pts: Array.from({ length: 121 }, (_, i) => {
      const x = (i / 120) * (fixed === "L" ? KMAX : LMAX);
      return fixed === "L" ? { L: fixVal, K: x } : { L: x, K: fixVal };
    }),
    color: "#fbbf24",
    width: 3.4,
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">🔪 곡면을 칼로 자르면?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          생산함수 Q = f(L, K)는 변수가 둘인 이변수함수라 그래프가 <b className="text-amber-100">면</b>으로 그려져요.
          그런데 둘 중 하나를 <b className="text-amber-100">고정</b>하면 그 자리에서 면이 잘려 <b className="text-amber-100">선</b>{" "}
          하나가 남습니다. 그 선이 바로 우리가 아는 <b className="text-amber-100">일변수함수</b>의 그래프예요.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPid(p.id)}
            className={
              "rounded-xl border-2 px-3 py-2 text-left transition " +
              (pid === p.id ? TONE_ON[p.tone] : "border-white/10 bg-white/5 hover:bg-white/10")
            }
          >
            <p className="text-xs font-bold text-slate-200">
              {p.emoji} {p.name}
            </p>
            <div className="overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
              <Katex expr={p.tex} />
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setFixed("L")}
          className={
            "rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition " +
            (fixed === "L"
              ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
          }
        >
          🔒 노동량 L을 고정 → Q는 K에 대한 함수
        </button>
        <button
          type="button"
          onClick={() => setFixed("K")}
          className={
            "rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition " +
            (fixed === "K"
              ? "border-sky-400/60 bg-sky-400/15 text-sky-100"
              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
          }
        >
          🔒 자본량 K를 고정 → Q는 L에 대한 함수
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <Surface3D
          preset={preset}
          az={az}
          el={el}
          setAz={setAz}
          setEl={setEl}
          marker={curPt}
          curves={[cutCurve]}
          plane={{ axis: fixed, value: fixVal }}
          dim
        />

        <div className="space-y-3">
          <Slider
            label={`고정할 ${fixKo} ${fixed}`}
            sub="(0 ~ 5)"
            value={fixVal}
            min={0}
            max={5}
            step={0.5}
            onChange={setFixVal}
            tone={fixed === "L" ? "emerald" : "sky"}
          />

          <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-400/[0.08] p-4">
            <p className="text-center text-xs font-bold text-amber-200">
              잘라서 얻은 {freeKo} {freeName}의 일변수함수
            </p>
            <FormulaLine expr={sec.tex} className="mt-1 text-slate-100" />
            <p className="mt-1 text-center text-xs font-bold text-amber-100">📐 {sec.shape}</p>
          </div>

          <Section2D preset={preset} g={g} qMax={qMax} t={t} freeName={freeName} />

          <Slider
            label={`${freeKo} ${freeName}`}
            sub="(0 ~ 5)"
            value={t}
            min={0}
            max={5}
            step={0.25}
            onChange={setT}
            tone="amber"
          />

          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
            <p className="text-xs text-slate-400">
              {fixKo} {fixed} = <b className="text-slate-100">{fmt(fixVal)}</b>, {freeKo} {freeName} ={" "}
              <b className="text-slate-100">{fmt(t)}</b>
            </p>
            <p className="mt-0.5 font-mono text-2xl font-bold text-amber-100">Q = {fmt(g(t))}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">
          🔢 단면 위의 값 — {fixKo} {fixed} = {fmt(fixVal)} 로 고정했을 때
        </p>
        <div className="mt-2 overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[380px] border-collapse text-center font-mono text-xs">
            <tbody>
              <tr>
                <th className="border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-bold text-slate-400">
                  {freeName}
                </th>
                {[0, 1, 2, 3, 4, 5].map((x) => (
                  <td key={x} className="border border-white/10 bg-white/5 px-2 py-1.5 font-bold text-slate-300">
                    {x}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="border border-white/10 bg-amber-400/10 px-2 py-1.5 text-[10px] font-bold text-amber-200">
                  Q
                </th>
                {[0, 1, 2, 3, 4, 5].map((x) => (
                  <td
                    key={x}
                    className={
                      "border border-white/10 px-2 py-1.5 " +
                      (Math.round(t) === x ? "bg-amber-400/25 font-bold text-amber-100" : "text-slate-300")
                    }
                  >
                    {fmt(g(x), 1)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {pid === "mul" ? (
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
          <p className="text-sm font-bold text-emerald-200">📖 교과서 예시로 확인해 보기</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            생산함수가 Q = LK 일 때, 아래 두 경우를 눌러 그래프가 정말 직선이 되는지 확인해 보세요.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setFixed("L"); setFixVal(1); }}
              className="rounded-lg border-2 border-emerald-400/45 bg-emerald-400/12 px-3 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/22"
            >
              노동량이 1로 고정되면 → Q = K
            </button>
            <button
              type="button"
              onClick={() => { setFixed("K"); setFixVal(2); }}
              className="rounded-lg border-2 border-sky-400/45 bg-sky-400/12 px-3 py-1.5 text-xs font-bold text-sky-100 transition hover:bg-sky-400/22"
            >
              자본량이 2로 고정되면 → Q = 2L
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── 단면의 2차원 그래프 ───────────────────────────────────────
const CW = 340,
  CH = 232,
  PL = 40,
  PR = 16,
  PT = 16,
  PB = 30;

function Section2D({
  preset,
  g,
  qMax,
  t,
  freeName,
}: {
  preset: Preset;
  g: (x: number) => number;
  qMax: number;
  t: number;
  freeName: string;
}) {
  const X = (x: number) => PL + (x / 5) * (CW - PL - PR);
  const Y = (q: number) => CH - PB - (qMax <= 0 ? 0 : q / qMax) * (CH - PT - PB);
  const pts = Array.from({ length: 121 }, (_, i) => {
    const x = (i / 120) * 5;
    return `${X(x)},${Y(g(x))}`;
  }).join(" ");
  const px = X(t);
  const py = Y(g(t));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => r * qMax);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <div className="overflow-x-auto overflow-y-hidden">
        <svg viewBox={`0 0 ${CW} ${CH}`} className="h-auto w-full min-w-[300px]" role="img" aria-label="단면으로 얻은 일변수함수의 그래프">
          <rect x={0} y={0} width={CW} height={CH} rx={10} fill="#0b1220" />
          {yTicks.map((q, i) => (
            <g key={`y${i}`}>
              <line x1={PL} y1={Y(q)} x2={CW - PR} y2={Y(q)} stroke="rgba(148,163,184,0.16)" strokeWidth={0.8} />
              <text x={PL - 6} y={Y(q)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                {fmt(q, 1)}
              </text>
            </g>
          ))}
          {[0, 1, 2, 3, 4, 5].map((x) => (
            <g key={`x${x}`}>
              <line x1={X(x)} y1={PT} x2={X(x)} y2={CH - PB} stroke="rgba(148,163,184,0.13)" strokeWidth={0.8} />
              <text x={X(x)} y={CH - PB + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                {x}
              </text>
            </g>
          ))}
          <line x1={PL} y1={CH - PB} x2={CW - PR} y2={CH - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <line x1={PL} y1={PT} x2={PL} y2={CH - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <text x={CW - PR} y={CH - PB + 22} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            {freeName}
          </text>
          <text x={PL - 4} y={PT - 4} textAnchor="end" fill="#fcd34d" fontSize={10} fontWeight={700}>
            Q
          </text>

          <polyline points={pts} fill="none" stroke={preset.ramp[2]} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />

          <line x1={px} y1={py} x2={px} y2={CH - PB} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
          <line x1={PL} y1={py} x2={px} y2={py} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
          <circle cx={px} cy={py} r={5.5} fill="#fff" />
          <circle cx={px} cy={py} r={3.4} fill="#f43f5e" />
        </svg>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  탭 ③ 단계별 문제
// ══════════════════════════════════════════════════════════════════
const SHAPE_PATH: Record<Shape, string> = {
  line: "M10,58 L84,10",
  sqrt: "M10,58 C 22,24 42,15 84,11",
  parab: "M10,58 C 44,56 66,42 84,10",
  inv: "M16,12 C 30,46 46,55 84,57",
  kink: "M10,58 L48,22 L84,22",
  flat: "M10,34 L84,34",
};

function ShapeThumb({ shape }: { shape: Shape }) {
  return (
    <svg viewBox="0 0 94 68" className="h-16 w-[94px]" role="img" aria-label="그래프 모양 후보">
      <rect x={0} y={0} width={94} height={68} rx={7} fill="#0b1220" />
      <line x1={10} y1={62} x2={88} y2={62} stroke="#64748b" strokeWidth={1} />
      <line x1={10} y1={6} x2={10} y2={62} stroke="#64748b" strokeWidth={1} />
      <path d={SHAPE_PATH[shape]} fill="none" stroke="#fbbf24" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type StepState = { text: string; ok: boolean; tries: number; hint: boolean; shown: boolean };
const DEFAULT_STEP: StepState = { text: "", ok: false, tries: 0, hint: false, shown: false };

function ProblemTab() {
  const [pIdx, setPIdx] = useState(0);
  const [state, setState] = useState<Record<string, StepState>>({});
  const prob = PROBLEMS[pIdx];
  const doneCount = PROBLEMS.filter((p) => p.steps.every((s) => state[s.id]?.ok)).length;

  function get(id: string) {
    return state[id] ?? DEFAULT_STEP;
  }
  function update(id: string, patch: Partial<StepState>) {
    setState((p) => ({ ...p, [id]: { ...(p[id] ?? DEFAULT_STEP), ...patch } }));
  }
  function check(step: PStep, override?: string) {
    setState((p) => {
      const cur = p[step.id] ?? DEFAULT_STEP;
      const text = override ?? cur.text;
      const ok =
        step.kind === "number"
          ? (() => {
              const v = Number(text.replace(/[^0-9.-]/g, ""));
              return text.trim() !== "" && Number.isFinite(v) && Math.abs(v - step.answer) <= (step.tol ?? 0.005);
            })()
          : text !== "" && Number(text) === step.answer;
      return { ...p, [step.id]: { ...cur, text, ok, tries: cur.tries + 1 } };
    });
  }

  const firstOpen = prob.steps.findIndex((s) => !get(s.id).ok);
  const probDone = firstOpen === -1;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🧩 생산함수 단계별 문제</p>
          <span className="font-mono text-xs text-slate-300">
            완료 {doneCount} / {PROBLEMS.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PROBLEMS.map((p, i) => {
            const done = p.steps.every((s) => state[s.id]?.ok);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPIdx(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (pIdx === i
                    ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                    : done
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {done ? "✅ " : ""}
                {p.emoji} {p.title.replace("문제 ", "").replace(" · ", ". ")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-base font-bold text-slate-100">
          {prob.emoji} {prob.title}
        </p>
        <p className="mt-1.5 text-sm leading-7 text-slate-300">{prob.scenario}</p>
        <FormulaLine expr={prob.tex} className="mt-1 text-slate-100" />
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {prob.given.map((gv) => (
            <div key={gv.label} className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2">
              <p className="text-[11px] text-slate-400">{gv.label}</p>
              <p className="mt-0.5 text-sm font-bold text-sky-100">{gv.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {prob.steps.map((step, i) => {
          const ss = get(step.id);
          const locked = i > (firstOpen === -1 ? prob.steps.length - 1 : firstOpen);
          return (
            <div
              key={step.id}
              className={
                "rounded-2xl border p-4 transition " +
                (ss.ok
                  ? "border-emerald-400/40 bg-emerald-400/[0.07]"
                  : locked
                    ? "border-white/5 bg-slate-900/20 opacity-50"
                    : "border-violet-400/35 bg-violet-400/[0.06]")
              }
            >
              <div className="flex items-start gap-2">
                <span
                  className={
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                    (ss.ok ? "bg-emerald-400/25 text-emerald-100" : "bg-white/10 text-slate-300")
                  }
                >
                  {ss.ok ? "✓" : i + 1}
                </span>
                <p className="text-sm font-bold leading-6 text-slate-100">{step.ask}</p>
              </div>

              {locked ? (
                <p className="mt-2 pl-8 text-xs text-slate-500">앞 단계를 먼저 풀어 주세요 🔒</p>
              ) : (
                <div className="mt-2 pl-8">
                  {step.tex ? <FormulaLine expr={step.tex} className="text-slate-100" /> : null}

                  {step.kind === "number" ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label={step.ask}
                        value={ss.text}
                        disabled={ss.ok}
                        onChange={(e) => update(step.id, { text: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") check(step);
                        }}
                        placeholder="숫자만 입력"
                        className="w-40 rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-right font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 disabled:opacity-60"
                      />
                      <span className="text-sm text-slate-300">{step.suffix}</span>
                      {!ss.ok ? (
                        <button
                          type="button"
                          onClick={() => check(step)}
                          className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
                        >
                          확인
                        </button>
                      ) : null}
                    </div>
                  ) : step.kind === "choice" ? (
                    <div className="mt-1 flex flex-col gap-1.5">
                      {step.options.map((opt, oi) => {
                        const chosen = ss.text === String(oi);
                        const right = ss.ok && oi === step.answer;
                        const wrong = chosen && !ss.ok;
                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={ss.ok}
                            onClick={() => check(step, String(oi))}
                            className={
                              "rounded-lg border-2 px-3 py-2 text-left text-sm font-bold transition disabled:opacity-80 " +
                              (right
                                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                                : wrong
                                  ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                            }
                          >
                            {opt.tex ? (
                              <span className="inline-block align-middle">
                                <Katex expr={opt.tex} />
                              </span>
                            ) : (
                              opt.text
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {step.options.map((sh, oi) => {
                        const chosen = ss.text === String(oi);
                        const right = ss.ok && oi === step.answer;
                        const wrong = chosen && !ss.ok;
                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={ss.ok}
                            onClick={() => check(step, String(oi))}
                            className={
                              "rounded-xl border-2 p-1.5 transition disabled:opacity-80 " +
                              (right
                                ? "border-emerald-400/70 bg-emerald-400/20"
                                : wrong
                                  ? "border-rose-400/60 bg-rose-400/15"
                                  : "border-white/10 bg-white/5 hover:bg-white/10")
                            }
                          >
                            <ShapeThumb shape={sh} />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {ss.ok ? (
                    <p className="mt-2 rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-1.5 text-xs leading-5 text-emerald-100">
                      정답이에요! ✅ {step.explain}
                    </p>
                  ) : ss.tries > 0 ? (
                    <p className="mt-2 rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-1.5 text-xs leading-5 text-amber-100">
                      아직 아니에요. {ss.tries >= 2 ? "힌트를 열어 보세요." : "식에 값을 하나씩 넣어 볼까요?"}
                    </p>
                  ) : null}

                  {!ss.ok ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => update(step.id, { hint: !ss.hint })}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                      >
                        💡 힌트 {ss.hint ? "닫기" : "보기"}
                      </button>
                      {ss.tries >= 3 ? (
                        <button
                          type="button"
                          onClick={() => update(step.id, { shown: true })}
                          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-400 transition hover:bg-white/10"
                        >
                          정답 보기
                        </button>
                      ) : null}
                      {ss.hint ? (
                        <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">{step.hint}</span>
                      ) : null}
                      {ss.shown ? (
                        <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">
                          정답:{" "}
                          <b className="font-mono text-emerald-200">
                            {step.kind === "number"
                              ? step.answer.toLocaleString("ko-KR") + step.suffix
                              : step.kind === "choice"
                                ? (step.options[step.answer].text ?? `${step.answer + 1}번`)
                                : `${step.answer + 1}번 그래프`}
                          </b>{" "}
                          — {step.explain}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {probDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🎉 문제 해결!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">{prob.wrapUp}</p>
          {pIdx < PROBLEMS.length - 1 ? (
            <button
              type="button"
              onClick={() => setPIdx(pIdx + 1)}
              className="mt-3 rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25"
            >
              다음 문제로 →
            </button>
          ) : doneCount === PROBLEMS.length ? (
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 네 문제를 모두 해결했어요! 생산함수 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
