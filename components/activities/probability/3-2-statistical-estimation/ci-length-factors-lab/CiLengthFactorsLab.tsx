"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "three_factors",
    prompt:
      "세 슬라이더(σ, n, 신뢰도)를 각각 따로 움직여 보았을 때, 신뢰구간 길이 L 은 어느 요인에는 정비례하고 어느 요인에는 반비례했는지 ‘L vs n / L vs σ / L vs 신뢰도’ 세 그래프의 모양을 근거로 적어 보세요.",
    kind: "text",
    placeholder:
      "예: σ가 커지면 L은 σ에 정비례해서 직선으로 늘었고, n이 커지면 L은 1/√n 모양으로 처음엔 빠르게, 나중엔 천천히 줄었다. 신뢰도를 올리면 z_{α/2}가 커져 L도 늘었고 99.9% 부근에서 가팔라졌다.",
  },
  {
    id: "n_vs_sigma_strategy",
    prompt:
      "‘신뢰구간을 더 짧게 만들고 싶다’면 σ를 줄이거나 n을 키우는 두 전략 중 어느 쪽이 더 현실적이고 효과적이라고 생각하나요? 활동에서 본 모양을 근거로 답해 보세요.",
    kind: "text",
    placeholder:
      "예: 모집단의 σ는 우리가 마음대로 줄일 수 없는 ‘자연이 정한 값’이라 보통은 n을 키운다. 다만 n은 1/√n 으로만 줄어들어서, n을 4배로 늘려야 L이 절반이 되므로 효과가 점점 둔해진다.",
  },
  {
    id: "n_quadruple",
    prompt:
      "n을 2배로 늘렸을 때와 4배로 늘렸을 때, 길이 L 은 각각 몇 배가 되었나요? 그 결과를 보고 ‘표본을 더 모은다’는 것의 의미를 본인 말로 적어 보세요.",
    kind: "text",
    placeholder:
      "예: n을 2배로 늘리면 L은 1/√2 ≈ 0.71 배, 4배로 늘리면 1/2 배가 되었다. 즉 신뢰구간을 반으로 줄이려면 표본을 4배로 모아야 한다.",
  },
];

// ─── 수치 헬퍼 ─────────────────────────────────────────
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
function zHalf(confPct: number): number {
  const a = 1 - confPct / 100;
  return normPpf(1 - a / 2);
}
function lengthOf(sig: number, n: number, confPct: number): number {
  return (2 * zHalf(confPct) * sig) / Math.sqrt(n);
}
function fmt(v: number, d = 3): string {
  if (!isFinite(v)) return "--";
  return Number(v.toFixed(d)).toString();
}

// ─── 메인 ─────────────────────────────────────────────────
export default function CiLengthFactorsLab() {
  const [sig, setSig] = useState(10);
  const [n, setN] = useState(30);
  const [conf, setConf] = useState(95);

  const z = useMemo(() => zHalf(conf), [conf]);
  const se = sig / Math.sqrt(n);
  const L = 2 * z * se;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">📏 신뢰구간 길이를 결정하는 3가지 요인</h3>
        <p className="mt-2 leading-7 text-slate-300">
          모평균 신뢰구간의 길이가{" "}
          <b className="text-pink-300">σ</b> · <b className="text-emerald-300">n</b> ·{" "}
          <b className="text-violet-300">신뢰도</b> 세 가지에 어떻게 영향을 받는지 직접 조작해
          봐요!
        </p>
      </div>

      {/* 공식 */}
      <div className="mt-5 rounded-2xl border-2 border-cyan-400/50 bg-gradient-to-br from-cyan-500/15 to-violet-500/15 p-4 text-center">
        <div className="font-serif text-3xl font-extrabold leading-snug tracking-wide text-cyan-100">
          L &nbsp;=&nbsp; 2 · z<sub className="text-xl">α/2</sub> ·{" "}
          <span className="text-amber-300">σ</span> / √<span className="text-amber-300">n</span>
        </div>
        <div className="mt-1 text-sm text-slate-300">
          신뢰도가 높아질수록 <b className="text-yellow-200">z<sub>α/2</sub></b>가, σ가 커질수록{" "}
          <b className="text-yellow-200">분자</b>가, n이 커질수록{" "}
          <b className="text-yellow-200">분모</b>가 커집니다.
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="mt-3 rounded-2xl border border-violet-400/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-violet-200">
          🎛 세 슬라이더를 자유롭게 움직여 보세요{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            실시간 반영
          </span>
        </h4>
        <div className="space-y-2">
          <CtrlRow
            id="cl-sig"
            tone="pink"
            icon="📐"
            label="모표준편차 σ"
            value={sig}
            min={0.5}
            max={30}
            step={0.1}
            display={fmt(sig, 1)}
            onChange={setSig}
          />
          <CtrlRow
            id="cl-n"
            tone="green"
            icon="🧮"
            label="표본 크기 n"
            value={n}
            min={2}
            max={500}
            step={1}
            display={String(n)}
            onChange={(v) => setN(Math.round(v))}
          />
          <CtrlRow
            id="cl-conf"
            tone="purple"
            icon="🎯"
            label="신뢰도 (%)"
            value={conf}
            min={50}
            max={99.9}
            step={0.1}
            display={`${fmt(conf, 1)}%`}
            onChange={setConf}
          />
        </div>
      </div>

      {/* 길이 막대 */}
      <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-cyan-200">
          📊 지금 설정에서의 신뢰구간 길이{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            길이 L 을 막대로 시각화
          </span>
        </h4>
        <div className="rounded-xl border-[1.5px] border-cyan-400/30 bg-slate-950/55 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-slate-300">
            <span>표본평균을 중심으로 좌우 대칭 신뢰구간</span>
            <span className="text-xl font-extrabold text-amber-300">L = {fmt(L)}</span>
          </div>
          <LengthBarCanvas sig={sig} n={n} conf={conf} L={L} />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <InfoCard
            label={
              <>
                z<sub>α/2</sub>
              </>
            }
            value={fmt(z)}
          />
          <InfoCard label="표준오차 σ/√n" value={fmt(se)} />
          <InfoCard label="반길이 L/2" value={fmt(L / 2)} />
          <InfoCard label="전체 길이 L" value={fmt(L)} />
        </div>
      </div>

      {/* 3 작은 차트 */}
      <div className="mt-3 rounded-2xl border border-violet-400/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-violet-200">
          📈 각 요인을 바꿀 때 길이는 어떤 모양으로 변할까?{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            노란 점 = 현재 설정 위치
          </span>
        </h4>
        <div className="grid gap-3 lg:grid-cols-3">
          <SubChartCard
            tone="green"
            title={<>L vs n (반비례, ∝ 1/√n)</>}
          >
            <SubChartCanvas
              kind="n"
              sig={sig}
              n={n}
              conf={conf}
              color="#22c55e"
            />
          </SubChartCard>
          <SubChartCard tone="pink" title={<>L vs σ (정비례, ∝ σ)</>}>
            <SubChartCanvas
              kind="sig"
              sig={sig}
              n={n}
              conf={conf}
              color="#ec4899"
            />
          </SubChartCard>
          <SubChartCard
            tone="purple"
            title={
              <>
                L vs 신뢰도 (증가, ∝ z<sub>α/2</sub>)
              </>
            }
          >
            <SubChartCanvas
              kind="conf"
              sig={sig}
              n={n}
              conf={conf}
              color="#a855f7"
            />
          </SubChartCard>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-amber-300/45 bg-amber-300/10 p-3 text-sm leading-7 text-amber-50">
          <span className="text-xl">💡</span>
          <span>
            <span className="font-extrabold text-emerald-300">n이 커지면</span> 길이가{" "}
            <b className="text-yellow-200">1/√n</b> 만큼 줄어들어요 → 표본을 많이 모을수록
            정확해집니다.
            <br />
            <span className="font-extrabold text-pink-300">σ가 커지면</span> 길이가 σ에{" "}
            <b className="text-yellow-200">정비례</b>해서 늘어나요 → 자료가 흩어져 있을수록 추정이
            어려워요.
            <br />
            <span className="font-extrabold text-violet-300">신뢰도를 높이면</span>{" "}
            <b className="text-yellow-200">
              z<sub>α/2</sub>
            </b>{" "}
            가 커져서 길이가 늘어나요 → 99.9%로 갈수록 가팔라집니다.
          </span>
        </div>
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <ReflectionForm questions={REFLECTION_QUESTIONS} />
      </div>
    </section>
  );
}

// ─── 컨트롤 로우 ─────────────────────────────────────────
type CtrlTone = "pink" | "green" | "purple";
const CTRL_BG: Record<CtrlTone, string> = {
  pink: "border-pink-400/40 bg-pink-500/10",
  green: "border-emerald-400/40 bg-emerald-500/10",
  purple: "border-violet-400/40 bg-violet-500/10",
};
const CTRL_TEXT: Record<CtrlTone, string> = {
  pink: "text-pink-200",
  green: "text-emerald-200",
  purple: "text-violet-200",
};
const CTRL_ACCENT: Record<CtrlTone, string> = {
  pink: "accent-pink-500",
  green: "accent-emerald-500",
  purple: "accent-violet-500",
};

function CtrlRow({
  id,
  tone,
  icon,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  tone: CtrlTone;
  icon: string;
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-[1.5px] px-3 py-2.5 ${CTRL_BG[tone]}`}
    >
      <label
        htmlFor={id}
        className={`flex min-w-[185px] items-center gap-2 text-base font-extrabold ${CTRL_TEXT[tone]}`}
      >
        <span className="text-xl">{icon}</span>
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
        className={`h-2 flex-1 ${CTRL_ACCENT[tone]}`}
      />
      <span className="min-w-[90px] rounded-md bg-slate-950/70 px-3 py-1 text-center text-xl font-extrabold text-amber-300">
        {display}
      </span>
    </div>
  );
}

function InfoCard({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="rounded-xl border-[1.5px] border-violet-400/35 bg-slate-950/55 p-3 text-center">
      <div className="text-sm font-extrabold tracking-wide text-violet-200">{label}</div>
      <div className="mt-1 text-2xl font-extrabold leading-tight text-amber-100">{value}</div>
    </div>
  );
}

type SubChartTone = "pink" | "green" | "purple";
const SUB_BORDER: Record<SubChartTone, string> = {
  pink: "border-pink-400/45",
  green: "border-emerald-400/45",
  purple: "border-violet-400/45",
};
const SUB_TITLE: Record<SubChartTone, string> = {
  pink: "text-pink-200",
  green: "text-emerald-200",
  purple: "text-violet-200",
};
function SubChartCard({
  tone,
  title,
  children,
}: {
  tone: SubChartTone;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border-[1.5px] bg-slate-950/55 p-3 ${SUB_BORDER[tone]}`}
    >
      <h5
        className={`mb-1.5 text-center text-sm font-extrabold tracking-wide ${SUB_TITLE[tone]}`}
      >
        {title}
      </h5>
      {children}
    </div>
  );
}

// ─── 길이 막대 Canvas ──────────────────────────────────
function LengthBarCanvas({
  sig,
  n,
  conf,
  L,
}: {
  sig: number;
  n: number;
  conf: number;
  L: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 980;
  const H = 140;
  // 정적인 최대 가능 길이(시각화 안정성)
  const Lmax = useMemo(() => lengthOf(30, 2, 99.9), []);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 40;
    const padR = 40;
    const padT = 30;
    const padB = 44;
    const plotW = W - padL - padR;

    const ratio = L / Lmax;
    const cx = padL + plotW / 2;
    const halfPx = (ratio * plotW) / 2;

    // 축
    ctx.strokeStyle = "rgba(148,163,184,.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, H - padB + 8);
    ctx.lineTo(W - padR, H - padB + 8);
    ctx.stroke();

    // 표본평균 점선
    ctx.strokeStyle = "rgba(251,191,36,.6)";
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, padT - 4);
    ctx.lineTo(cx, H - padB + 12);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("표본평균 X̄", cx, padT - 6);

    // 막대 (그라데이션)
    const grad = ctx.createLinearGradient(cx - halfPx, 0, cx + halfPx, 0);
    grad.addColorStop(0, "#22d3ee");
    grad.addColorStop(0.5, "#38bdf8");
    grad.addColorStop(1, "#22d3ee");
    ctx.fillStyle = grad;
    const yMid = padT + 35;
    const barH = 36;
    ctx.fillRect(cx - halfPx, yMid, halfPx * 2, barH);
    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - halfPx, yMid, halfPx * 2, barH);

    // 끝점 막대 (빨강)
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - halfPx, yMid - 8);
    ctx.lineTo(cx - halfPx, yMid + barH + 8);
    ctx.moveTo(cx + halfPx, yMid - 8);
    ctx.lineTo(cx + halfPx, yMid + barH + 8);
    ctx.stroke();

    // 길이 화살표
    ctx.strokeStyle = "#fda4af";
    ctx.lineWidth = 2;
    const yArrow = yMid + barH + 18;
    ctx.beginPath();
    ctx.moveTo(cx - halfPx, yArrow);
    ctx.lineTo(cx + halfPx, yArrow);
    ctx.moveTo(cx - halfPx, yArrow);
    ctx.lineTo(cx - halfPx + 8, yArrow - 5);
    ctx.moveTo(cx - halfPx, yArrow);
    ctx.lineTo(cx - halfPx + 8, yArrow + 5);
    ctx.moveTo(cx + halfPx, yArrow);
    ctx.lineTo(cx + halfPx - 8, yArrow - 5);
    ctx.moveTo(cx + halfPx, yArrow);
    ctx.lineTo(cx + halfPx - 8, yArrow + 5);
    ctx.stroke();

    // L 라벨
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("L = " + fmt(L), cx, yArrow + 5);

    // 좌/우 라벨 — X̄ 위에 직접 윗줄
    ctx.fillStyle = "#fca5a5";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("X̄ − L/2", cx - halfPx - 6, yMid + barH / 2);
    ctx.textAlign = "left";
    ctx.fillText("X̄ + L/2", cx + halfPx + 6, yMid + barH / 2);
  }, [sig, n, conf, L, Lmax]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[140px] w-full rounded-lg bg-slate-950/60"
      aria-label="신뢰구간 길이 막대"
    />
  );
}

// ─── Sub Chart Canvas (L vs n / σ / 신뢰도) ─────────────
function SubChartCanvas({
  kind,
  sig,
  n,
  conf,
  color,
}: {
  kind: "n" | "sig" | "conf";
  sig: number;
  n: number;
  conf: number;
  color: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 600;
  const H = 170;

  const { xs, ys, curX, xFmt, yFmt } = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    let curX = 0;
    let xFmt: (v: number) => string;
    const yFmt: (v: number) => string = (v) => v.toFixed(1);
    if (kind === "n") {
      for (let nn = 2; nn <= 500; nn += 2) {
        xs.push(nn);
        ys.push(lengthOf(sig, nn, conf));
      }
      curX = n;
      xFmt = (v) => String(Math.round(v));
    } else if (kind === "sig") {
      for (let s = 0.5; s <= 30 + 1e-9; s += 0.5) {
        xs.push(s);
        ys.push(lengthOf(s, n, conf));
      }
      curX = sig;
      xFmt = (v) => v.toFixed(0);
    } else {
      for (let c = 50; c <= 99.5 + 1e-9; c += 0.5) {
        xs.push(c);
        ys.push(lengthOf(sig, n, c));
      }
      curX = conf;
      xFmt = (v) => v.toFixed(0) + "%";
    }
    return { xs, ys, curX, xFmt, yFmt };
  }, [kind, sig, n, conf]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 44;
    const padR = 14;
    const padT = 10;
    const padB = 28;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const xMin = xs[0];
    const xMax = xs[xs.length - 1];
    const yMin = 0;
    const yMax = Math.max(...ys) * 1.1;
    const X = (x: number) =>
      padL + ((x - xMin) / Math.max(1e-9, xMax - xMin)) * plotW;
    const Y = (y: number) =>
      padT + plotH - ((y - yMin) / Math.max(1e-9, yMax - yMin)) * plotH;

    // 격자
    ctx.strokeStyle = "rgba(148,163,184,.13)";
    ctx.setLineDash([3, 3]);
    for (let i = 1; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 곡선
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < xs.length; i++) {
      if (i === 0) ctx.moveTo(X(xs[i]), Y(ys[i]));
      else ctx.lineTo(X(xs[i]), Y(ys[i]));
    }
    ctx.stroke();

    // 현재 점 (선형보간)
    let yCur = 0;
    for (let i = 1; i < xs.length; i++) {
      if (xs[i - 1] <= curX && curX <= xs[i]) {
        const t = (curX - xs[i - 1]) / Math.max(1e-9, xs[i] - xs[i - 1]);
        yCur = ys[i - 1] + t * (ys[i] - ys[i - 1]);
        break;
      }
    }
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(X(curX), Y(yCur), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fde047";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(X(curX), padT);
    ctx.lineTo(X(curX), padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // 축
    ctx.strokeStyle = "rgba(148,163,184,.5)";
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    ctx.lineTo(W - padR, padT + plotH);
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.stroke();

    // x 눈금
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const v = xMin + ((xMax - xMin) * i) / ticks;
      ctx.fillText(xFmt(v), X(v), padT + plotH + 4);
    }
    // y 눈금
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      const v = yMin + ((yMax - yMin) * i) / 4;
      ctx.fillText(yFmt(v), padL - 4, padT + plotH - (i / 4) * plotH);
    }
  }, [xs, ys, curX, color, xFmt, yFmt]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[170px] w-full rounded-lg bg-slate-950/60"
      aria-label="요인별 길이 변화 차트"
    />
  );
}
