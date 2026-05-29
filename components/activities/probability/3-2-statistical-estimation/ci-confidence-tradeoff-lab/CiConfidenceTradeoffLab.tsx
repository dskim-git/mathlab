"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_symmetric_shortest",
    prompt:
      "같은 신뢰도(파란 면적)를 유지한 채 왼쪽 꼬리 비율 α_L/α 를 좌우로 움직여 보았을 때 신뢰구간 길이는 어떻게 변했나요? 어떤 위치에서 길이가 가장 짧았고, 왜 그렇게 된다고 생각하나요?",
    kind: "text",
    placeholder:
      "예: 정확히 0.5(좌우 꼬리가 같은 비율)일 때 가장 짧았다. 양쪽 꼬리를 α/2로 똑같이 잘라낼 때 z_R − z_L 이 가장 작아진다.",
  },
  {
    id: "ci_length_tradeoff",
    prompt:
      "신뢰도를 50% → 95% → 99%로 올리는 동안 막대(길이 L)는 어떻게 변했나요? 95%에서 99%로 가는 마지막 4%p 구간의 ΔL(빨간 막대)이 다른 구간과 어떻게 달랐는지도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 50~95%까지는 ΔL이 천천히 늘었지만, 95~99% 구간은 ΔL이 가파르게 늘어났다. 그래서 95%가 ‘적당한 정확도와 신뢰도’ 사이의 절충점이라 표준으로 자주 쓰인다.",
  },
  {
    id: "alpha_half",
    prompt:
      "활동을 마치고 보면, 왜 우리가 신뢰구간을 만들 때 α(=1−신뢰도)를 ‘반으로 나누어’ 양쪽 꼬리에 똑같이 두는지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 같은 신뢰도 면적을 유지하면서 구간을 가장 짧게(=가장 정확하게) 만들려면 두 꼬리를 똑같이 α/2씩 잘라야 한다. 그래서 ±z_{α/2}로 대칭 신뢰구간을 쓴다.",
  },
];

// ─── 표준정규 분위수 (Acklam 근사) ─────────────────────
function normPpf(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const plow = 0.02425;
  const phigh = 1 - plow;
  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}
function pdf(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp((-x * x) / 2);
}
function fmt(v: number, d = 3): string {
  if (!isFinite(v)) return "--";
  return Number(v.toFixed(d)).toString();
}

// ─── X̄ 표기 (불필요하나 일관성 위해 유지) ─────────────
// (이 활동에선 X̄ 안 씀)

// ─── 메인 ─────────────────────────────────────────────────
export default function CiConfidenceTradeoffLab() {
  const [conf, setConf] = useState(0.95);
  const [share, setShare] = useState(0.5);

  const alpha = 1 - conf;
  const eps = 1e-6;
  const aL = alpha * (eps + (1 - 2 * eps) * share);
  const aR = alpha - aL;
  const zl = useMemo(() => normPpf(aL), [aL]);
  const zr = useMemo(() => normPpf(1 - aR), [aR]);
  const zSym = useMemo(() => normPpf(1 - alpha / 2), [alpha]);

  const curLen = zr - zl;
  const symLen = 2 * zSym;
  const diffLen = curLen - symLen;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">
          🎯 신뢰도와 신뢰구간 길이의 트레이드오프
        </h3>
        <p className="mt-2 leading-7 text-slate-300">
          같은 신뢰도에서 <b className="text-amber-300">대칭 신뢰구간</b>이 최단이 되는 이유를
          보고, 신뢰도를 <b className="text-amber-300">1%p</b> 올릴 때마다 길이가 얼마나
          늘어나는지 비교해 봐요!
        </p>
      </div>

      {/* Part 1 */}
      <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex flex-wrap items-center gap-2 text-base font-bold text-violet-200">
          ① 같은 신뢰도에서 <span className="text-amber-300">대칭</span>이 왜 최단일까?
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            표준정규 N(0, 1) 위에서 비교
          </span>
        </h4>

        <div className="rounded-xl border-2 border-cyan-400/40 bg-gradient-to-br from-cyan-500/15 to-violet-500/15 p-3 text-center">
          <div className="font-serif text-2xl font-extrabold tracking-wide text-cyan-300">
            L = (z<sub className="text-base">R</sub> − z<sub className="text-base">L</sub>) ×
            σ/√n
          </div>
          <div className="mt-1 text-sm text-slate-300">
            파란 면적(=신뢰도)을 그대로 둔 채로 양쪽 경계만 움직여 봅니다.
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <RangeRow
            id="ci-conf"
            label="신뢰도 (1−α)"
            value={conf}
            min={0.5}
            max={0.999}
            step={0.001}
            display={`${(conf * 100).toFixed(1)}%`}
            onChange={setConf}
          />
          <RangeRow
            id="ci-share"
            label={
              <>
                왼쪽 꼬리 비율 α<sub>L</sub>/α
              </>
            }
            value={share}
            min={0.001}
            max={0.999}
            step={0.001}
            display={share.toFixed(3)}
            onChange={setShare}
          />
        </div>

        <div className="mt-3 rounded-xl border-[1.5px] border-cyan-400/30 bg-slate-950/55 p-3">
          <NormCurveCanvas conf={conf} zl={zl} zr={zr} zSym={zSym} />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <MetricCard tone="default" label="현재 길이 L (단위: σ/√n)" value={fmt(curLen)} />
          <MetricCard
            tone="best"
            label={
              <>
                대칭 길이 L<sub>min</sub>
              </>
            }
            value={fmt(symLen)}
          />
          <MetricCard tone="diff" label="길이 차이 (현재 − 대칭)" value={fmt(diffLen)} />
        </div>

        <div className="mt-3 rounded-xl border-[1.5px] border-violet-400/35 bg-slate-950/55 p-3">
          <h5 className="mb-1 text-sm font-extrabold tracking-wide text-violet-200">
            📈 왼쪽 꼬리 비율을 0 → 1 로 바꿀 때 길이 L 의 변화
          </h5>
          <LengthMiniCanvas conf={conf} share={share} />
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-amber-300/45 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
          <span className="text-xl">💡</span>
          <span>
            파란 면적(신뢰도)을 그대로 둔 채로 양쪽 꼬리를 비대칭으로 만들면 길이가 길어져요.
            길이가 가장 짧은 지점은 항상{" "}
            <b className="text-yellow-200">왼쪽 꼬리 = 오른쪽 꼬리 = α/2</b>인{" "}
            <em className="font-extrabold not-italic text-rose-300">대칭</em>이에요!
          </span>
        </div>
      </div>

      {/* Part 2 */}
      <div className="mt-3 rounded-2xl border border-rose-400/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex flex-wrap items-center gap-2 text-base font-bold text-violet-200">
          ② 신뢰도를 1%p 올리면 <span className="text-rose-300">길이(정확도)</span>는 얼마나
          희생될까?
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            대칭 신뢰구간 기준
          </span>
        </h4>

        <div className="rounded-xl border-[1.5px] border-cyan-400/30 bg-slate-950/55 p-3">
          <StepChartCanvas conf={conf} />
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm text-slate-300">
            <LegendSwatch className="bg-cyan-400">신뢰구간 길이 L</LegendSwatch>
            <LegendSwatch className="bg-rose-500">직전 단계 대비 늘어난 ΔL</LegendSwatch>
            <LegendSwatch className="bg-amber-300">현재 선택한 신뢰도</LegendSwatch>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-amber-300/45 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
          <span className="text-xl">⚖️</span>
          <span>
            50%에서 95%까지 1%p씩 올리는 데 들어가는 비용은{" "}
            <b className="text-yellow-200">천천히</b> 늘어나지만, 95% → 99%로 가는 마지막 4%p는
            길이가 <em className="font-extrabold not-italic text-rose-300">가파르게</em>{" "}
            늘어나요.
            <br />→ 학교 통계에서 <b className="text-yellow-200">95%</b>를 표준처럼 쓰는 이유 중
            하나예요!
          </span>
        </div>
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <ReflectionForm questions={REFLECTION_QUESTIONS} />
      </div>
    </section>
  );
}

// ─── 빌딩블록 ──────────────────────────────────────────
function RangeRow({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-cyan-400/30 bg-cyan-500/10 px-3 py-2">
      <label htmlFor={id} className="min-w-[170px] text-sm font-extrabold text-cyan-200">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 flex-1 accent-cyan-400"
      />
      <span className="min-w-[84px] rounded-md bg-slate-950/70 px-3 py-1 text-center text-lg font-extrabold text-amber-300">
        {display}
      </span>
    </div>
  );
}

type MetricTone = "default" | "best" | "diff";
const METRIC_VAL_CLASS: Record<MetricTone, string> = {
  default: "text-amber-100",
  best: "text-emerald-300",
  diff: "text-rose-300",
};
function MetricCard({
  tone,
  label,
  value,
}: {
  tone: MetricTone;
  label: React.ReactNode;
  value: string;
}) {
  return (
    <div className="rounded-xl border-[1.5px] border-violet-400/40 bg-slate-950/55 p-3 text-center">
      <div className="text-sm font-extrabold tracking-wide text-violet-200">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${METRIC_VAL_CLASS[tone]}`}>{value}</div>
    </div>
  );
}

function LegendSwatch({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-5 rounded-sm ${className}`} />
      {children}
    </span>
  );
}

// ─── Norm 곡선 Canvas (Part 1) ──────────────────────────
function NormCurveCanvas({
  conf,
  zl,
  zr,
  zSym,
}: {
  conf: number;
  zl: number;
  zr: number;
  zSym: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 980;
  const H = 320;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 44;
    const padR = 22;
    const padT = 22;
    const padB = 44;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const xMin = -4;
    const xMax = 4;
    const yMaxPdf = 0.42;
    const X = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
    const Y = (y: number) => padT + plotH - (y / yMaxPdf) * plotH;

    // 격자
    ctx.strokeStyle = "rgba(148,163,184,.13)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 면적 채우기
    ctx.fillStyle = "rgba(56,189,248,.32)";
    ctx.beginPath();
    ctx.moveTo(X(zl), Y(0));
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const x = zl + ((zr - zl) * i) / steps;
      ctx.lineTo(X(x), Y(pdf(x)));
    }
    ctx.lineTo(X(zr), Y(0));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(56,189,248,.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 정규분포 곡선
    ctx.strokeStyle = "#a5b4fc";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 400; i++) {
      const x = xMin + ((xMax - xMin) * i) / 400;
      if (i === 0) ctx.moveTo(X(x), Y(pdf(x)));
      else ctx.lineTo(X(x), Y(pdf(x)));
    }
    ctx.stroke();

    // 대칭 경계 (참조)
    ctx.strokeStyle = "rgba(134,239,172,.85)";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    for (const z of [-zSym, zSym]) {
      ctx.beginPath();
      ctx.moveTo(X(z), padT);
      ctx.lineTo(X(z), padT + plotH);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = "#86efac";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("대칭 −z", X(-zSym), padT - 2);
    ctx.fillText("대칭 +z", X(zSym), padT - 2);

    // 현재 경계
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 3;
    for (const z of [zl, zr]) {
      ctx.beginPath();
      ctx.moveTo(X(z), padT + 8);
      ctx.lineTo(X(z), padT + plotH);
      ctx.stroke();
    }
    ctx.fillStyle = "#fda4af";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("z_L=" + fmt(zl, 2), X(zl), padT + 8);
    ctx.fillText("z_R=" + fmt(zr, 2), X(zr), padT + 8);

    // x축
    ctx.strokeStyle = "rgba(148,163,184,.5)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    ctx.lineTo(W - padR, padT + plotH);
    ctx.stroke();
    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let v = -4; v <= 4; v++) {
      const x = X(v);
      ctx.strokeStyle = "rgba(148,163,184,.4)";
      ctx.beginPath();
      ctx.moveTo(x, padT + plotH);
      ctx.lineTo(x, padT + plotH + 5);
      ctx.stroke();
      ctx.fillText(String(v), x, padT + plotH + 8);
    }
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("Z (표준화)", W / 2, H - 14);

    // 면적 라벨
    ctx.fillStyle = "#7dd3fc";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "면적 = " + fmt(conf * 100, 1) + "%",
      X((zl + zr) / 2),
      Y(pdf((zl + zr) / 2) * 0.55)
    );
  }, [conf, zl, zr, zSym]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[320px] w-full rounded-lg bg-slate-950/60"
      aria-label="표준정규분포와 신뢰구간 면적"
    />
  );
}

// ─── 길이 미니 곡선 Canvas (Part 1 보조) ────────────────
function LengthMiniCanvas({ conf, share }: { conf: number; share: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 980;
  const H = 170;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 44;
    const padR = 22;
    const padT = 18;
    const padB = 34;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const alpha = 1 - conf;
    const eps = 1e-6;

    const N = 201;
    const rs: number[] = [];
    const Ls: number[] = [];
    for (let i = 0; i < N; i++) {
      const r = i / (N - 1);
      const aL = alpha * (eps + (1 - 2 * eps) * r);
      const aR = alpha - aL;
      const zl = normPpf(aL);
      const zr = normPpf(1 - aR);
      rs.push(r);
      Ls.push(zr - zl);
    }
    const lmin = Math.min(...Ls);
    const lmax = Math.max(...Ls);
    const X = (r: number) => padL + r * plotW;
    const Y = (L: number) =>
      padT + plotH - ((L - lmin) / Math.max(1e-9, lmax - lmin)) * plotH * 0.9 - 6;

    ctx.strokeStyle = "rgba(148,163,184,.5)";
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    ctx.lineTo(W - padR, padT + plotH);
    ctx.stroke();

    ctx.strokeStyle = "#a5b4fc";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      if (i === 0) ctx.moveTo(X(rs[i]), Y(Ls[i]));
      else ctx.lineTo(X(rs[i]), Y(Ls[i]));
    }
    ctx.stroke();

    // 대칭 최단 위치 (0.5)
    ctx.strokeStyle = "#86efac";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X(0.5), padT);
    ctx.lineTo(X(0.5), padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#86efac";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("대칭(최단)", X(0.5), padT + 2);

    // 현재 위치
    const aL2 = alpha * (eps + (1 - 2 * eps) * share);
    const aR2 = alpha - aL2;
    const Lcur = normPpf(1 - aR2) - normPpf(aL2);
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(X(share), Y(Lcur), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fde047";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X(share), padT);
    ctx.lineTo(X(share), padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // x 라벨
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const r of [0, 0.25, 0.5, 0.75, 1]) {
      ctx.fillText(r.toFixed(2), X(r), padT + plotH + 6);
    }
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("왼쪽 꼬리 비율  α_L / α", W / 2, H - 14);
  }, [conf, share]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[170px] w-full rounded-lg bg-slate-950/60"
      aria-label="왼쪽 꼬리 비율에 따른 길이 변화"
    />
  );
}

// ─── Step Chart Canvas (Part 2) ─────────────────────────
function StepChartCanvas({ conf }: { conf: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 980;
  const H = 380;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 52;
    const padR = 22;
    const padT = 28;
    const padB = 64;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const CLs: number[] = [];
    const Ls: number[] = [];
    for (let p = 50; p <= 99; p++) {
      const a = 1 - p / 100;
      const z = normPpf(1 - a / 2);
      CLs.push(p);
      Ls.push(2 * z);
    }
    const Lmax = Math.max(...Ls);
    const bw = plotW / CLs.length;
    const X = (i: number) => padL + i * bw;
    const Y = (L: number) => padT + plotH - (L / Lmax) * plotH * 0.96;

    // 격자
    ctx.strokeStyle = "rgba(148,163,184,.13)";
    ctx.setLineDash([3, 3]);
    for (let i = 1; i <= 5; i++) {
      const y = padT + (i / 5) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 막대 (L)
    for (let i = 0; i < CLs.length; i++) {
      const x = X(i);
      const y = Y(Ls[i]);
      ctx.fillStyle = "rgba(56,189,248,.6)";
      ctx.fillRect(x + 1, y, bw - 2, padT + plotH - y);
    }
    // ΔL — 빨강
    for (let i = 1; i < CLs.length; i++) {
      const dL = Ls[i] - Ls[i - 1];
      if (dL <= 0) continue;
      const x = X(i);
      const yT = Y(Ls[i]);
      const yB = Y(Ls[i] - dL);
      ctx.fillStyle = "rgba(244,63,94,.85)";
      ctx.fillRect(x + 1, yT, bw - 2, yB - yT);
    }

    // 현재 선택 강조
    const sel = Math.round(conf * 100);
    const selIdx = sel - 50;
    if (selIdx >= 0 && selIdx < CLs.length) {
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 3;
      const x = X(selIdx);
      const y = Y(Ls[selIdx]);
      ctx.strokeRect(x, y - 2, bw, padT + plotH - y + 2);
      ctx.fillStyle = "#fde047";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("L=" + fmt(Ls[selIdx], 2), x + bw / 2, y - 4);
    }

    // x축
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const p of [50, 60, 70, 80, 90, 95, 99]) {
      const i = p - 50;
      ctx.fillText(p + "%", X(i) + bw / 2, padT + plotH + 6);
    }
    ctx.strokeStyle = "rgba(148,163,184,.5)";
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    ctx.lineTo(W - padR, padT + plotH);
    ctx.stroke();

    // y축
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 5; i++) {
      const L = Lmax * (i / 5);
      const y = padT + plotH - (L / Lmax) * plotH * 0.96;
      ctx.fillText(L.toFixed(1), padL - 6, y);
    }

    // 제목
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("신뢰도 (%)", W / 2, H - 22);
    ctx.save();
    ctx.translate(14, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("구간 길이 L (단위: σ/√n)", 0, 0);
    ctx.restore();
  }, [conf]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[380px] w-full rounded-lg bg-slate-950/60"
      aria-label="1%p 신뢰도 증가에 따른 길이 변화 막대"
    />
  );
}
