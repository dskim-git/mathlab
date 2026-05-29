"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "rotation_equivalence",
    prompt:
      "사람 수 n을 6으로 두고 ‘무작위 섞기’를 한 다음 좌/우 회전을 눌러 보았을 때, 바깥 원의 사람 1이 맨 위에 도달하기까지 몇 칸을 돌렸나요? 이렇게 같은 배치가 회전으로 ‘몇 가지 다른 모습’으로 보일 수 있는지 본인 말로 적어 보세요.",
    kind: "text",
    placeholder:
      "예: n=6일 때 사람 1이 어디에 있든 6칸 안에서 맨 위로 갈 수 있었다. 즉 같은 원배치 하나가 회전으로 6가지 선형 배치로 보인다. 그래서 선형 n! 을 n 으로 나눈 (n−1)! 이 원배치 수가 된다.",
  },
  {
    id: "why_anchor",
    prompt:
      "안쪽 원처럼 ‘사람 1번을 항상 맨 위에 고정’하는 것이 ‘회전 중복을 없애는 것’과 어떻게 같은 의미인지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 사람 1번 자리를 맨 위로 고정하면 회전해도 1번 자리는 그대로이므로 같은 배치를 한 가지 모양으로만 셀 수 있다. 그래서 회전 중복이 자동으로 사라진다.",
  },
  {
    id: "n_factorial_minus_1",
    prompt:
      "KPI 카드에서 n이 커질수록 ‘선형 배치 수 n!’과 ‘원배치 수 (n−1)!’의 차이가 점점 커집니다. 두 수의 관계 n! / n = (n−1)! 을 본인의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 같은 원배치 하나가 n가지 선형 배치를 만들기 때문에, 모든 선형 배치 n! 을 n 으로 나누면 서로 다른 원배치 수 (n−1)! 이 된다.",
  },
];

// ─── 메인 ─────────────────────────────────────────────────
type RotDir = null | "L" | "R";

export default function CircularPermAnchor() {
  const [n, setN] = useState(6);
  // seating: 시계방향 좌석에 앉은 사람 라벨 (길이 = n)
  const [seating, setSeating] = useState<number[]>(() =>
    Array.from({ length: 6 }, (_, i) => i + 1)
  );
  const [rotDir, setRotDir] = useState<RotDir>(null);

  // n 변경 시 seating 초기화 — useEffect 가 아니라 핸들러에서 직접
  function handleNChange(newN: number) {
    setN(newN);
    setSeating(Array.from({ length: newN }, (_, i) => i + 1));
    setRotDir(null);
  }

  function shuffle() {
    setSeating((prev) => {
      const a = [...prev];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    });
    setRotDir(null);
  }
  function rotateBy(k: number, dir: RotDir) {
    setSeating((prev) => {
      const len = prev.length;
      const m = (((k % len) + len) % len);
      return [...prev.slice(-m), ...prev.slice(0, -m)];
    });
    setRotDir(dir);
  }

  // 정준형 (사람 1을 index 0으로)
  const canon = useMemo(() => {
    const idx = seating.indexOf(1);
    const k = seating.length - idx;
    const len = seating.length;
    const m = (((k % len) + len) % len);
    return [...seating.slice(-m), ...seating.slice(0, -m)];
  }, [seating]);

  const linCount = useMemo(() => factorial(n), [n]);
  const cirCount = useMemo(() => factorial(n - 1), [n]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 교육과정 외</p>
        <h3 className="mt-2 text-2xl font-bold">
          🔁 원순열 — ‘한 자리(한 사람) 고정’의 의미
        </h3>
        <p className="mt-2 leading-7 text-slate-300">
          원형 자리 배치에서 회전은 같은 배치로 봐요. 중복을 없애려면{" "}
          <b className="text-amber-300">한 사람을 고정</b>하면 됩니다. 사람{" "}
          <b className="text-amber-300">1번</b>을 항상 맨 위에 두고, 나머지 사람의 순서만 바꿔
          봐요.
        </p>
      </div>

      {/* 공식 */}
      <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-amber-300/55 bg-slate-900/55 p-4">
        <span className="text-base font-extrabold text-amber-300">
          📐 서로 다른 원배치 수
        </span>
        <div className="w-full overflow-x-auto rounded-md border border-amber-300/45 bg-amber-300/10 px-4 py-3 text-amber-100">
          <Katex
            display
            expr={String.raw`\text{서로 다른 원배치 수}\;=\;\dfrac{n!}{n}\;=\;(n-1)!`}
          />
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 text-base font-bold text-cyan-200">🎛 컨트롤</h4>
        <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-cyan-400/30 bg-cyan-500/10 px-3 py-2">
          <label
            htmlFor="cpa-n"
            className="min-w-[100px] text-sm font-extrabold text-cyan-200"
          >
            사람 수 n
          </label>
          <input
            id="cpa-n"
            type="range"
            min={3}
            max={12}
            step={1}
            value={n}
            onChange={(e) => handleNChange(parseInt(e.target.value, 10))}
            className="h-1.5 flex-1 accent-cyan-400"
          />
          <span className="min-w-[64px] rounded-md bg-slate-950/70 px-3 py-1 text-center text-xl font-extrabold tabular-nums text-amber-300">
            {n}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={shuffle}
            className="flex-1 min-w-[140px] rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-cyan-400 hover:to-cyan-600 active:scale-95"
          >
            🎲 무작위 섞기
          </button>
          <button
            type="button"
            onClick={() => rotateBy(+1, "L")}
            className="flex-1 min-w-[120px] rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-violet-400 hover:to-violet-600 active:scale-95"
          >
            ↶ 좌회전
          </button>
          <button
            type="button"
            onClick={() => rotateBy(-1, "R")}
            className="flex-1 min-w-[120px] rounded-xl bg-gradient-to-br from-pink-500 to-pink-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-pink-400 hover:to-pink-600 active:scale-95"
          >
            ↷ 우회전
          </button>
        </div>
      </div>

      {/* 두 원 시각화 */}
      <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 text-base font-bold text-cyan-200">🎯 두 원 비교</h4>
        <div className="rounded-xl border-[1.5px] border-cyan-400/30 bg-slate-950/55 p-3">
          <RingsCanvas seating={seating} canon={canon} rotDir={rotDir} />
          <p className="mt-2 text-center text-xs text-slate-400">
            바깥 원: 현재 배치 · 안쪽 원: 사람 1을 위로 고정한 정준형(회전 중복 제거)
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <KpiCard
          label={
            <>
              선형 배치 수 <span className="text-slate-400">(n!)</span>
            </>
          }
          value={linCount.toLocaleString()}
        />
        <KpiCard
          label={
            <>
              서로 다른 원배치 수 <span className="text-slate-400">((n−1)!)</span>
            </>
          }
          value={cirCount.toLocaleString()}
          tone="emerald"
        />
      </div>

      {/* 인사이트 */}
      <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-amber-300/45 bg-amber-300/10 p-3 text-sm leading-7 text-amber-50">
        <span className="text-xl">💡</span>
        <span>
          시각화에서 같은 원배치 하나가 <b className="text-yellow-200">n개의 회전 모습</b>으로
          보인다는 점을 확인해 보세요. 그래서 선형 n!을 n으로 나눈{" "}
          <b className="text-yellow-200">(n−1)!</b> 이 서로 다른 원배치 수예요.
        </span>
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <ReflectionForm questions={REFLECTION_QUESTIONS} />
      </div>
    </section>
  );
}

// ─── 헬퍼 ──────────────────────────────────────────────
function factorial(k: number): number {
  let r = 1;
  for (let i = 2; i <= k; i++) r *= i;
  return r;
}

function KpiCard({
  label,
  value,
  tone = "cyan",
}: {
  label: React.ReactNode;
  value: string;
  tone?: "cyan" | "emerald";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-400/55 bg-emerald-500/10 text-emerald-100"
      : "border-cyan-400/55 bg-cyan-500/10 text-cyan-100";
  const labelCls = tone === "emerald" ? "text-emerald-300" : "text-cyan-300";
  return (
    <div className={`rounded-2xl border-2 p-4 text-center ${cls}`}>
      <div className="text-3xl font-extrabold tabular-nums">{value}</div>
      <div className={`mt-1 text-sm font-bold ${labelCls}`}>{label}</div>
    </div>
  );
}

// ─── Rings Canvas ──────────────────────────────────────
function RingsCanvas({
  seating,
  canon,
  rotDir,
}: {
  seating: number[];
  canon: number[];
  rotDir: RotDir;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 960;
  const H = 560;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    // 배경
    ctx.fillStyle = "rgba(15,23,42,0.4)";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2, H / 2);

    const R1 = 210;
    const R2 = 140;
    const startAng = -Math.PI / 2;
    const len = seating.length;
    const angStep = (Math.PI * 2) / len;

    // 시작 좌석 마커 (위쪽)
    ctx.strokeStyle = "rgba(148,163,184,.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -R1 - 10);
    ctx.lineTo(0, -R1 + 8);
    ctx.stroke();
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("시작 좌석", 0, -R1 - 14);

    // 바깥 원
    ctx.strokeStyle = "rgba(99,102,241,.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, R1, 0, Math.PI * 2);
    ctx.stroke();
    drawSeating(ctx, seating, R1, startAng, "#cbd5e1", "#475569", false);

    // 안쪽 원
    ctx.strokeStyle = "rgba(56,189,248,.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, R2, 0, Math.PI * 2);
    ctx.stroke();
    drawSeating(ctx, canon, R2, startAng, "#fef3c7", "#0e7490", true);

    // 회전 힌트
    const idx1 = seating.indexOf(1);
    if (idx1 !== 0 && rotDir !== null) {
      const aCur = startAng + angStep * idx1;
      const aTop = startAng;
      const arcR = R1 * 0.9;

      ctx.strokeStyle = "rgba(251,146,60,.9)";
      ctx.lineWidth = 2.5;

      const angles: number[] = [];
      if (rotDir === "L") {
        let e = aTop;
        if (e < aCur) e += Math.PI * 2;
        const steps = 64;
        for (let t = 0; t <= 1; t += 1 / steps) {
          angles.push(aCur + t * (e - aCur));
        }
      } else {
        let e = aTop;
        if (e > aCur) e -= Math.PI * 2;
        const steps = 64;
        for (let t = 0; t <= 1; t += 1 / steps) {
          angles.push(aCur + t * (e - aCur));
        }
      }

      ctx.beginPath();
      angles.forEach((a, i) => {
        const x = arcR * Math.cos(a);
        const y = arcR * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 화살촉
      const hx = arcR * Math.cos(aTop);
      const hy = arcR * Math.sin(aTop);
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(aTop + (rotDir === "L" ? -Math.PI / 2 : Math.PI / 2));
      ctx.fillStyle = "rgba(251,146,60,.95)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-8, -12);
      ctx.lineTo(8, -12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 칸 수 캡션
      const need = rotDir === "L" ? (len - idx1) % len : idx1;
      const amid = angles[Math.floor(angles.length / 2)];
      ctx.fillStyle = "#fb923c";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(
        `${rotDir === "L" ? "좌회전" : "우회전"} ${need}칸`,
        arcR * Math.cos(amid),
        arcR * Math.sin(amid) + 4
      );
    }

    ctx.restore();

    // 정렬 완료 뱃지
    if (seating.indexOf(1) === 0) {
      ctx.fillStyle = "#86efac";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("✅ 사람 1번이 정렬된 상태입니다 — 정준형과 동일!", W / 2, H - 14);
    }
  }, [seating, canon, rotDir]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-auto w-full rounded-lg bg-slate-950/60"
      aria-label="원순열 두 원 시각화"
    />
  );
}

function drawSeating(
  ctx: CanvasRenderingContext2D,
  arr: number[],
  R: number,
  startAng: number,
  labelColor: string,
  diskColor: string,
  bold: boolean
) {
  const angStep = (Math.PI * 2) / arr.length;
  const r = bold ? 20 : 16;

  for (let i = 0; i < arr.length; i++) {
    const a = startAng + angStep * i;
    const x = R * Math.cos(a);
    const y = R * Math.sin(a);

    // 좌석 표시
    ctx.strokeStyle = "rgba(148,163,184,.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(0.92 * x, 0.92 * y);
    ctx.stroke();

    // 사람(원)
    ctx.fillStyle = diskColor;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // 라벨
    ctx.fillStyle = labelColor;
    ctx.font = `bold ${bold ? 16 : 14}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(arr[i]), x, y + 1);
  }

  // 사람 1 강조 링
  const idx1 = arr.indexOf(1);
  if (idx1 >= 0) {
    const a1 = startAng + angStep * idx1;
    const x1 = R * Math.cos(a1);
    const y1 = R * Math.sin(a1);
    ctx.strokeStyle = "rgba(34,211,238,.95)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x1, y1, bold ? 26 : 22, 0, Math.PI * 2);
    ctx.stroke();
  }
}
