"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "vertex_meaning",
    prompt:
      "이차함수 y = a(x − h)² + k 에서 꼭짓점 (h, k) 가 아치교와 현수교 각각에서 어떤 물리적 의미를 가지는지 두 경우를 구분하여 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 아치교(아치가 위로 솟은 모양)에서는 a < 0 이므로 꼭짓점이 그래프의 가장 높은 점, 즉 아치의 최고점 높이가 된다. 현수교(케이블이 아래로 처지는 모양)에서는 a > 0 이므로 꼭짓점이 그래프의 가장 낮은 점, 즉 케이블의 최저점 높이가 된다. 어느 경우든 h 는 다리의 중앙(좌우대칭 중심)의 x좌표를 나타낸다.",
  },
  {
    id: "a_sign_role",
    prompt:
      "계수 a 가 양수일 때와 음수일 때 그래프 모양이 어떻게 달라지고, 이것이 최대·최솟값의 존재와 어떻게 연결되는지 다리의 예를 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: a > 0 이면 아래로 볼록 → 꼭짓점이 최솟값 (현수교 케이블 최저점). a < 0 이면 위로 볼록 → 꼭짓점이 최댓값 (아치교 아치 최고점). 다리 모양만 보고도 a 의 부호를 결정할 수 있고, |a| 가 클수록 곡선이 좁고 가팔라진다.",
  },
];

// ─── 다리 설정 ──────────────────────────────────────────────
type BridgeCfg = {
  id: string;
  badge: string;
  badgeCls: string;
  name: string;
  desc: ReactNode;
  imgSrc: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  initA: number;
  initH: number;
  initK: number;
  aMin: number;
  aMax: number;
  aStep: number;
  hMin: number;
  hMax: number;
  hStep: number;
  kMin: number;
  kMax: number;
  kStep: number;
  isArch: boolean; // true → 아치(최댓값), false → 현수교(최솟값)
  color: string;
  colorSoft: string;
  hint: ReactNode;
};

const BRIDGES: BridgeCfg[] = [
  {
    id: "b0",
    badge: "아치교 ▼",
    badgeCls: "border-rose-400/40 bg-rose-400/15 text-rose-200",
    name: "선암사 무지개다리",
    desc: (
      <>
        전남 순천 · 돌로 쌓은 반원형 아치 — <em>아치는 위로 볼록 (a &lt; 0), 꼭짓점 = 최댓값(아치 최고점)</em>
      </>
    ),
    imgSrc: "/assets/commonmath/bridge-1.jpg",
    xMin: 0,
    xMax: 10,
    yMin: -1.2,
    yMax: 6,
    initA: -0.35,
    initH: 5,
    initK: 3.8,
    aMin: -3,
    aMax: 0.5,
    aStep: 0.05,
    hMin: -2,
    hMax: 12,
    hStep: 0.1,
    kMin: -2,
    kMax: 8,
    kStep: 0.1,
    isArch: true,
    color: "#ff6b6b",
    colorSoft: "rgba(255,107,107,0.55)",
    hint: (
      <>
        🔍 <b>힌트:</b> 선암사 무지개다리는 반원에 가까운 아치 구조입니다.
        <br />
        • <b>a &lt; 0</b> — 위로 볼록(최댓값)이어야 아치 모양이 됩니다.
        <br />
        • 좌우 대칭이므로 <b>h ≈ 5</b> 로 시작하고, 아치 최고점 높이로 <b>k</b> 를 조정.
        <br />
        • |a| 가 클수록 아치가 좁고 가팔라집니다.
      </>
    ),
  },
  {
    id: "b1",
    badge: "아치교 ▼",
    badgeCls: "border-amber-400/40 bg-amber-400/15 text-amber-200",
    name: "대전 엑스포교",
    desc: (
      <>
        대전 · 강철 아치 구조 — <em>아치는 위로 볼록 (a &lt; 0), 꼭짓점 = 최댓값(아치 최고점)</em>
      </>
    ),
    imgSrc: "/assets/commonmath/bridge-2.jpg",
    xMin: 0,
    xMax: 10,
    yMin: -1.2,
    yMax: 7,
    initA: -0.4,
    initH: 5,
    initK: 4.5,
    aMin: -3,
    aMax: 0.5,
    aStep: 0.05,
    hMin: -2,
    hMax: 12,
    hStep: 0.1,
    kMin: -2,
    kMax: 9,
    kStep: 0.1,
    isArch: true,
    color: "#f59e0b",
    colorSoft: "rgba(245,158,11,0.55)",
    hint: (
      <>
        🔍 <b>힌트:</b> 대전 엑스포교는 강철로 만든 아치 구조입니다.
        <br />
        • 아치 최고점을 꼭짓점 (h, k) 으로 설정하세요.
        <br />
        • 양 교각 발판이 x축과 만나는 지점을 찾으면 아치 폭을 알 수 있습니다.
        <br />
        • 그 두 점의 중간값이 대칭축 <b>h</b> 가 됩니다.
      </>
    ),
  },
  {
    id: "b2",
    badge: "현수교 ▲",
    badgeCls: "border-emerald-400/40 bg-emerald-400/15 text-emerald-200",
    name: "샌프란시스코 금문교",
    desc: (
      <>
        미국 캘리포니아 · 케이블이 아래로 처지는 현수교 — <em>케이블은 아래로 볼록 (a &gt; 0), 꼭짓점 = 최솟값(케이블 최저점)</em>
      </>
    ),
    imgSrc: "/assets/commonmath/bridge-3.jpg",
    xMin: 0,
    xMax: 10,
    yMin: -0.8,
    yMax: 8,
    initA: 0.1,
    initH: 5,
    initK: 0.8,
    aMin: -0.5,
    aMax: 3,
    aStep: 0.01,
    hMin: -2,
    hMax: 12,
    hStep: 0.1,
    kMin: -1,
    kMax: 7,
    kStep: 0.1,
    isArch: false,
    color: "#60a5fa",
    colorSoft: "rgba(96,165,250,0.55)",
    hint: (
      <>
        🔍 <b>힌트:</b> 금문교의 메인 케이블은 두 탑 사이에서 아래로 처집니다.
        <br />
        • <b>a &gt; 0</b> (양수) — 아래로 볼록(최솟값)이어야 케이블 모양이 됩니다.
        <br />
        • 케이블 최저점(중간 아래처짐)이 꼭짓점 (h, k) 이며, 이것이 <b>최솟값</b>.
        <br />
        • 두 탑의 x좌표 중간값이 대칭축 <b>h</b> 가 됩니다.
      </>
    ),
  },
];

// ─── 수식 유틸 ──────────────────────────────────────────────
function fmt(n: number): string {
  return Number(n.toFixed(2)).toString();
}
function buildEqText(a: number, h: number, k: number): string {
  const aStr = fmt(a);
  const hAbs = fmt(Math.abs(h));
  if (h === 0 && k === 0) return `y = ${aStr}x²`;
  const hPart = h > 0 ? `x − ${hAbs}` : h < 0 ? `x + ${hAbs}` : "x";
  const kPart = k >= 0 ? ` + ${fmt(k)}` : ` − ${fmt(-k)}`;
  if (h === 0) return `y = ${aStr}x²${kPart}`;
  if (k === 0) return `y = ${aStr}(${hPart})²`;
  return `y = ${aStr}(${hPart})²${kPart}`;
}

// ─── 좌표 변환 ──────────────────────────────────────────────
function toPx(
  x: number,
  y: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  W: number,
  H: number,
): [number, number] {
  return [((x - xMin) / (xMax - xMin)) * W, H - ((y - yMin) / (yMax - yMin)) * H];
}

// ─── SVG 그래프 — 다리 + 격자 + 포물선 + 꼭짓점 ────────────
type BridgePlotProps = {
  imgSrc?: string | null;
  imgEmptyMsg?: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  a: number;
  h: number;
  k: number;
  color: string;
  colorSoft: string;
};

function BridgePlot({
  imgSrc,
  imgEmptyMsg,
  xMin,
  xMax,
  yMin,
  yMax,
  a,
  h,
  k,
  color,
  colorSoft,
}: BridgePlotProps) {
  const W = 660;
  const H = 370;

  // 격자 선
  const gridLines: ReactNode[] = [];
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    const [px] = toPx(x, 0, xMin, xMax, yMin, yMax, W, H);
    gridLines.push(
      <line
        key={`vx${x}`}
        x1={px}
        y1={0}
        x2={px}
        y2={H}
        stroke="rgba(100,150,255,0.22)"
        strokeWidth="0.7"
      />,
    );
  }
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    const [, py] = toPx(0, y, xMin, xMax, yMin, yMax, W, H);
    gridLines.push(
      <line
        key={`hy${y}`}
        x1={0}
        y1={py}
        x2={W}
        y2={py}
        stroke="rgba(100,150,255,0.22)"
        strokeWidth="0.7"
      />,
    );
  }

  // 축
  const axes: ReactNode[] = [];
  if (yMin <= 0 && yMax >= 0) {
    const [, py0] = toPx(0, 0, xMin, xMax, yMin, yMax, W, H);
    axes.push(
      <line key="xaxis" x1={0} y1={py0} x2={W} y2={py0} stroke="rgba(160,210,255,0.65)" strokeWidth="1.5" />,
    );
  }
  if (xMin <= 0 && xMax >= 0) {
    const [px0] = toPx(0, 0, xMin, xMax, yMin, yMax, W, H);
    axes.push(
      <line key="yaxis" x1={px0} y1={0} x2={px0} y2={H} stroke="rgba(160,210,255,0.65)" strokeWidth="1.5" />,
    );
  }

  // 눈금 레이블
  const ticks: ReactNode[] = [];
  const [px0lab, py0lab] = toPx(0, 0, xMin, xMax, yMin, yMax, W, H);
  const labelY = Math.min(Math.max(py0lab + 14, 14), H - 3);
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    if (x === 0) continue;
    const [px] = toPx(x, 0, xMin, xMax, yMin, yMax, W, H);
    ticks.push(
      <text key={`tx${x}`} x={px} y={labelY} fill="rgba(180,210,255,0.75)" fontSize="10" textAnchor="middle">
        {x}
      </text>,
    );
  }
  const labelX = Math.min(Math.max(px0lab - 4, 16), W - 4);
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    if (y === 0) continue;
    const [, py] = toPx(0, y, xMin, xMax, yMin, yMax, W, H);
    ticks.push(
      <text key={`ty${y}`} x={labelX} y={py + 4} fill="rgba(180,210,255,0.75)" fontSize="10" textAnchor="end">
        {y}
      </text>,
    );
  }

  // 포물선 경로
  const parabolaPath = useMemo(() => {
    if (a === 0) return "";
    const parts: string[] = [];
    let pen = false;
    for (let px = -2; px <= W + 2; px++) {
      const x = xMin + (px / W) * (xMax - xMin);
      const y = a * (x - h) * (x - h) + k;
      const [cx, cy] = toPx(x, y, xMin, xMax, yMin, yMax, W, H);
      if (cy < -30 || cy > H + 30) {
        pen = false;
        continue;
      }
      if (!pen) {
        parts.push(`M ${cx.toFixed(1)} ${cy.toFixed(1)}`);
        pen = true;
      } else {
        parts.push(`L ${cx.toFixed(1)} ${cy.toFixed(1)}`);
      }
    }
    return parts.join(" ");
  }, [a, h, k, xMin, xMax, yMin, yMax]);

  // 대칭축
  const [vxAxisPx] = toPx(h, 0, xMin, xMax, yMin, yMax, W, H);
  // 꼭짓점
  const [vxCx, vxCy] = toPx(h, k, xMin, xMax, yMin, yMax, W, H);
  const vxVisible = vxCx >= -10 && vxCx <= W + 10 && vxCy >= -10 && vxCy <= H + 10;
  const labelX2 = Math.min(vxCx + 10, W - 70);
  const labelY2 = vxCy < 20 ? vxCy + 16 : vxCy - 10;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto block h-auto w-full max-w-[660px]"
      role="img"
      aria-label="다리 사진 + 이차함수 그래프"
    >
      {imgSrc ? (
        <image href={imgSrc} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <>
          <rect x="0" y="0" width={W} height={H} fill="#0a1428" />
          <text x={W / 2} y={H / 2} fill="#445" fontSize="14" textAnchor="middle">
            {imgEmptyMsg ?? "사진을 올리면 여기에 표시됩니다"}
          </text>
        </>
      )}
      {/* 어둡게 오버레이 */}
      <rect x="0" y="0" width={W} height={H} fill="rgba(0,0,0,0.25)" />
      {gridLines}
      {axes}
      {ticks}
      <text x={Math.min(px0lab - 3, W - 4)} y={Math.min(py0lab + 13, H - 3)} fill="rgba(180,210,255,0.75)" fontSize="10" textAnchor="end">
        O
      </text>
      {/* 대칭축 */}
      <line
        x1={vxAxisPx}
        y1={0}
        x2={vxAxisPx}
        y2={H}
        stroke={colorSoft}
        strokeWidth="1.2"
        strokeDasharray="5 4"
      />
      {/* 포물선 */}
      <path d={parabolaPath} fill="none" stroke={color} strokeWidth="3.2" />
      {/* 꼭짓점 */}
      {vxVisible ? (
        <>
          <circle cx={vxCx} cy={vxCy} r="7" fill={color} stroke="#fff" strokeWidth="2" />
          <text x={labelX2} y={labelY2} fill="rgba(255,255,255,0.85)" fontSize="10" fontWeight="bold">
            ({fmt(h)}, {fmt(k)})
          </text>
        </>
      ) : null}
    </svg>
  );
}

// ─── 메인 ───────────────────────────────────────────────────
type TabId = 0 | 1 | 2 | 3;

export default function QuadBridgeCurveFit() {
  const [tab, setTab] = useState<TabId>(0);
  const [done, setDone] = useState<boolean[]>(() => [false, false, false, false]);

  function markDone(i: TabId) {
    setDone((d) => {
      if (d[i]) return d;
      const n = [...d];
      n[i] = true;
      return n;
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🌉 다리에서 이차함수 찾기</h3>
        <p className="mt-2 leading-7 text-slate-300">
          실제 다리 사진에 이차함수 <b className="text-amber-200">y = a(x − h)² + k</b> 를 직접 맞추며
          꼭짓점(최대·최솟값)과 대칭축을 실생활과 연결해 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { id: 0 as const, label: "① 선암사" },
          { id: 1 as const, label: "② 엑스포교" },
          { id: 2 as const, label: "③ 금문교" },
          { id: 3 as const, label: "📸 내 사진" },
        ].map((t) => {
          const active = tab === t.id;
          const isDone = done[t.id];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                "rounded-xl border-2 px-2 py-2 text-center text-xs font-bold transition " +
                (active
                  ? "border-cyan-400/60 bg-gradient-to-br from-cyan-400/15 to-violet-400/15 text-cyan-100"
                  : isDone
                  ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {t.label}
              {isDone ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      {BRIDGES.map((cfg, i) => (
        <div key={cfg.id} className={tab === i ? "mt-5" : "mt-5 hidden"}>
          <BridgeTab cfg={cfg} onDone={() => markDone(i as TabId)} />
        </div>
      ))}
      <div className={tab === 3 ? "mt-5" : "mt-5 hidden"}>
        <UserPhotoTab onDone={() => markDone(3)} />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 공용 Slider ───────────────────────────────────────────
function Slider({
  label,
  desc,
  min,
  max,
  step,
  value,
  onChange,
  ariaLabel,
}: {
  label: string;
  desc?: ReactNode;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 text-right font-mono text-sm font-bold text-cyan-200">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel}
        className="flex-1 accent-violet-400"
      />
      <span className="min-w-[3rem] text-right font-mono text-sm font-bold text-amber-200">{fmt(value)}</span>
      {desc ? <span className="flex-1 text-xs text-slate-400">{desc}</span> : null}
    </div>
  );
}

// ─── 다리 탭 (3개 공용) ────────────────────────────────────
function BridgeTab({ cfg, onDone }: { cfg: BridgeCfg; onDone: () => void }) {
  const [a, setA] = useState(cfg.initA);
  const [h, setH] = useState(cfg.initH);
  const [k, setK] = useState(cfg.initK);
  const [showHint, setShowHint] = useState(false);
  const [touched, setTouched] = useState({ a: false, h: false, k: false });

  useEffect(() => {
    if (touched.a && touched.h && touched.k) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touched.a, touched.h, touched.k]);

  function reset() {
    setA(cfg.initA);
    setH(cfg.initH);
    setK(cfg.initK);
    setShowHint(false);
  }

  const minMaxLabel = cfg.isArch ? "최댓값 (아치 최고점)" : "최솟값 (케이블 최저점)";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
        <span className={"rounded-md border px-2 py-0.5 text-xs font-bold " + cfg.badgeCls}>
          {cfg.badge}
        </span>
        <span className="text-slate-200">
          <b>{cfg.name}</b> · {cfg.desc}
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr] lg:items-start">
          <div className="space-y-2">
            <div className="overflow-hidden rounded-xl border border-white/10">
              <BridgePlot
                imgSrc={cfg.imgSrc}
                xMin={cfg.xMin}
                xMax={cfg.xMax}
                yMin={cfg.yMin}
                yMax={cfg.yMax}
                a={a}
                h={h}
                k={k}
                color={cfg.color}
                colorSoft={cfg.colorSoft}
              />
            </div>
            <p className="text-center font-mono text-base font-extrabold text-amber-200">
              {buildEqText(a, h, k)}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <Slider
                label="a"
                min={cfg.aMin}
                max={cfg.aMax}
                step={cfg.aStep}
                value={a}
                onChange={(v) => {
                  setA(v);
                  setTouched((t) => ({ ...t, a: true }));
                }}
                ariaLabel="계수 a"
              />
              <Slider
                label="h"
                min={cfg.hMin}
                max={cfg.hMax}
                step={cfg.hStep}
                value={h}
                onChange={(v) => {
                  setH(v);
                  setTouched((t) => ({ ...t, h: true }));
                }}
                ariaLabel="꼭짓점 x좌표 h"
              />
              <Slider
                label="k"
                min={cfg.kMin}
                max={cfg.kMax}
                step={cfg.kStep}
                value={k}
                onChange={(v) => {
                  setK(v);
                  setTouched((t) => ({ ...t, k: true }));
                }}
                ariaLabel="꼭짓점 y좌표 k"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <InfoCard label="꼭짓점" value={`(${fmt(h)}, ${fmt(k)})`} />
              <InfoCard label="대칭축" value={`x = ${fmt(h)}`} />
              <InfoCard label={minMaxLabel} value={fmt(k)} />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowHint((s) => !s)}
                className="flex-1 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-400/20"
              >
                💡 힌트
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
              >
                ↺ 초기화
              </button>
            </div>

            {showHint ? (
              <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-xs leading-6 text-amber-100">
                {cfg.hint}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-2 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">{label}</p>
      <p className="mt-1 font-mono text-sm font-bold text-amber-200">{value}</p>
    </div>
  );
}

// ─── 탭 4: 내 사진 ────────────────────────────────────────
function UserPhotoTab({ onDone }: { onDone: () => void }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [a, setA] = useState(-0.3);
  const [h, setH] = useState(5);
  const [k, setK] = useState(3);
  const [xMax, setXMax] = useState(10);
  const [yMax, setYMax] = useState(7);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (imgSrc) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSrc]);

  function onPickFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = (e.target?.result as string) ?? null;
      if (src) setImgSrc(src);
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onPickFile(f);
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function reset() {
    setA(-0.3);
    setH(5);
    setK(3);
    setXMax(10);
    setYMax(7);
  }

  if (!imgSrc) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
          <span className="rounded-md border border-violet-400/40 bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            직접 탐구
          </span>
          <span className="text-slate-200">
            이차곡선이 보이는 <b>내 사진</b> 을 올려 이차함수를 직접 찾아보세요.
          </span>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-cyan-400/40 bg-cyan-400/5 p-12 text-center hover:bg-cyan-400/10"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f);
            }}
          />
          <p className="text-4xl">📷</p>
          <p className="mt-3 text-sm font-bold text-cyan-200">클릭하거나 사진을 드래그해서 올리세요</p>
          <p className="mt-1 text-xs text-slate-400">
            다리, 분수, 무지개, 포물선 모양 물체 등 이차곡선을 찾아보세요!
          </p>
        </div>
      </div>
    );
  }

  const xMin = 0;
  const yMin = -yMax * 0.12;
  const isArch = a < 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
        <span className="rounded-md border border-violet-400/40 bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
          직접 탐구
        </span>
        <span className="text-slate-200">슬라이더로 이차함수를 사진 위 곡선에 맞춰 보세요.</span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr] lg:items-start">
          <div className="space-y-2">
            <div className="overflow-hidden rounded-xl border border-white/10">
              <BridgePlot
                imgSrc={imgSrc}
                xMin={xMin}
                xMax={xMax}
                yMin={yMin}
                yMax={yMax}
                a={a}
                h={h}
                k={k}
                color="#f59e0b"
                colorSoft="rgba(245,158,11,0.55)"
              />
            </div>
            <p className="text-center font-mono text-base font-extrabold text-amber-200">
              {buildEqText(a, h, k)}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <Slider label="a" min={-3} max={3} step={0.05} value={a} onChange={setA} ariaLabel="계수 a" />
              <Slider label="h" min={-2} max={12} step={0.1} value={h} onChange={setH} ariaLabel="꼭짓점 x좌표 h" />
              <Slider label="k" min={-3} max={10} step={0.1} value={k} onChange={setK} ariaLabel="꼭짓점 y좌표 k" />
              <p className="mt-2 text-xs font-bold text-cyan-300">📏 좌표 범위 조정 (사진에 맞게)</p>
              <Slider label="x" min={5} max={30} step={1} value={xMax} onChange={setXMax} ariaLabel="x축 최대" />
              <Slider label="y" min={3} max={20} step={1} value={yMax} onChange={setYMax} ariaLabel="y축 최대" />
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <InfoCard label="꼭짓점" value={`(${fmt(h)}, ${fmt(k)})`} />
              <InfoCard label="대칭축" value={`x = ${fmt(h)}`} />
              <InfoCard label={isArch ? "최댓값" : "최솟값"} value={fmt(k)} />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={reset}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
              >
                ↺ 초기화
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20"
              >
                🔄 다른 사진
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
