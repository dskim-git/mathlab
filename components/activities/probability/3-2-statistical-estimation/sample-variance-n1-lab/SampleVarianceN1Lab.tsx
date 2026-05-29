"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_n_minus_1",
    prompt:
      "이번 활동에서 알게 된, 표본분산을 (n−1)로 나누는 이유를 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 표본평균 X̄ 기준으로 잰 퍼짐은 모평균 m 기준 퍼짐보다 항상 작거나 같다. 그래서 1/n으로 나누면 σ²보다 (n−1)/n 만큼 작게 나와 과소추정이 된다. 이를 보정하기 위해 (n−1)로 나누면 평균이 σ²과 같아져 불편추정량이 된다.",
  },
  {
    id: "xbar_minimum",
    prompt:
      "‘X̄ 기준 퍼짐이 m 기준 퍼짐보다 항상 작거나 같다’는 사실을 c값을 직접 움직여 본 경험을 바탕으로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: c값을 어디로 옮겨도 Σ(Xᵢ − c)² 의 최솟값이 c = X̄ 일 때 나왔다. 그래서 m이 X̄과 다른 값일 경우 m 기준 합은 X̄ 기준 합보다 항상 크거나 같다.",
  },
  {
    id: "race_observation",
    prompt:
      "‘추정량 경주’ 탭에서 1/n 추정량과 1/(n−1) 추정량의 평균이 시행 수가 늘어남에 따라 어떻게 다르게 움직였나요? 그리고 n을 작게 했을 때 차이가 어땠나요?",
    kind: "text",
    placeholder:
      "예: 1/n 곡선은 σ² 아래에 머물러 과소추정했고 1/(n−1) 곡선은 σ²에 정확히 수렴했다. n이 작을수록 두 곡선의 간격이 더 크게 벌어졌다.",
  },
];

// ─── 공통 모집단 (1차원 30명, σ² 고정) ───────────────────
const POP = [
  52, 54, 56, 57, 59, 60, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74,
  75, 76, 77, 78, 80, 81, 83, 85, 87, 90, 93,
];
const POP_MEAN = POP.reduce((a, b) => a + b, 0) / POP.length; // 70.7
const POP_VAR =
  POP.reduce((s, v) => s + (v - POP_MEAN) ** 2, 0) / POP.length;

const PMIN = 45;
const PMAX = 100;

function sampleFromPop(n: number): number[] {
  const pool = POP.slice();
  const out: number[] = [];
  const k = Math.min(n, pool.length);
  for (let i = 0; i < k; i++) {
    const j = Math.floor(Math.random() * pool.length);
    out.push(pool[j]);
    pool.splice(j, 1);
  }
  return out;
}

// ─── 메인 ─────────────────────────────────────────────────
type TabKey = "compare" | "race" | "secret";

export default function SampleVarianceN1Lab() {
  const [tab, setTab] = useState<TabKey>("compare");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">
          ✨ 표본분산을 n−1로 나누는 이유 (베셀 보정)
        </h3>
        <p className="mt-2 leading-7 text-slate-300">
          표본평균 X̄ 기준으로 잰 퍼짐은 모평균 <b className="text-rose-300">m</b> 기준
          퍼짐보다 <b className="text-amber-300">항상 작거나 같다</b>는 사실에서 출발해,
          그 모자란 양을 정확히 <b className="text-emerald-300">(n−1)</b>로 보정하는 과정을
          시각적으로 탐구합니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabBtn active={tab === "compare"} tone="cyan" onClick={() => setTab("compare")}>
          🔍 거리 비교
        </TabBtn>
        <TabBtn active={tab === "race"} tone="pink" onClick={() => setTab("race")}>
          🏁 추정량 경주
        </TabBtn>
        <TabBtn active={tab === "secret"} tone="amber" onClick={() => setTab("secret")}>
          ✨ (n−1)의 비밀
        </TabBtn>
      </div>

      <div className={tab === "compare" ? "mt-4" : "mt-4 hidden"}>
        <CompareTab />
      </div>
      <div className={tab === "race" ? "mt-4" : "mt-4 hidden"}>
        <RaceTab />
      </div>
      <div className={tab === "secret" ? "mt-4" : "mt-4 hidden"}>
        <SecretTab />
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <ReflectionForm questions={REFLECTION_QUESTIONS} />
      </div>
    </section>
  );
}

type Tone = "cyan" | "pink" | "amber";
const TAB_ACTIVE: Record<Tone, string> = {
  cyan: "bg-cyan-300 text-slate-900",
  pink: "bg-pink-300 text-slate-900",
  amber: "bg-amber-300 text-slate-900",
};
const TAB_INACTIVE: Record<Tone, string> = {
  cyan: "border border-cyan-300/30 text-cyan-200 hover:bg-cyan-300/10",
  pink: "border border-pink-300/30 text-pink-200 hover:bg-pink-300/10",
  amber: "border border-amber-300/30 text-amber-200 hover:bg-amber-300/10",
};

function TabBtn({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: Tone;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const cls = active ? TAB_ACTIVE[tone] : TAB_INACTIVE[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${cls}`}
    >
      {children}
    </button>
  );
}

// =================================================================
// TAB 1 — 거리 비교 (Canvas 수직선, c값 드래그)
// =================================================================
const NL_W = 900;
const NL_H = 320;
const NL_PAD_L = 50;
const NL_PAD_R = 30;

function valueToPx(v: number): number {
  return NL_PAD_L + ((v - PMIN) / (PMAX - PMIN)) * (NL_W - NL_PAD_L - NL_PAD_R);
}
function pxToValue(px: number): number {
  return PMIN + ((px - NL_PAD_L) / (NL_W - NL_PAD_L - NL_PAD_R)) * (PMAX - PMIN);
}

type AnimMode = null | "m" | "x";

function CompareTab() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [n, setN] = useState(6);
  const [sample, setSample] = useState<number[]>(() => sampleFromPop(6));
  const [testMode, setTestMode] = useState(false);
  const [testC, setTestC] = useState<number>(POP_MEAN);
  const [animMode, setAnimMode] = useState<AnimMode>(null);
  const animStartRef = useRef<number>(0);
  const ANIM_DUR = 900;

  const xbar = useMemo(
    () => (sample.length ? sample.reduce((a, b) => a + b, 0) / sample.length : 0),
    [sample]
  );
  const sumFromM = useMemo(
    () => sample.reduce((s, v) => s + (v - POP_MEAN) ** 2, 0),
    [sample]
  );
  const sumFromXbar = useMemo(
    () => sample.reduce((s, v) => s + (v - xbar) ** 2, 0),
    [sample, xbar]
  );
  const sumFromC = useMemo(
    () => sample.reduce((s, v) => s + (v - testC) ** 2, 0),
    [sample, testC]
  );

  // 캔버스 그리기 (rAF 필요한 anim 진행도는 ref 기반)
  const drawCanvas = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const w = cv.width;
    const h = cv.height;
    ctx.clearRect(0, 0, w, h);

    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(30,41,59,0)");
    g.addColorStop(1, "rgba(15,23,42,0.5)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const baseY = h - 60;

    ctx.strokeStyle = "rgba(203,213,225,0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(valueToPx(PMIN), baseY);
    ctx.lineTo(valueToPx(PMAX), baseY);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    for (let v = 50; v <= 100; v += 10) {
      const px = valueToPx(v);
      ctx.strokeStyle = "rgba(148,163,184,0.45)";
      ctx.beginPath();
      ctx.moveTo(px, baseY - 4);
      ctx.lineTo(px, baseY + 4);
      ctx.stroke();
      ctx.fillText(String(v), px, baseY + 18);
    }

    // 모집단 점들 (배경)
    for (const v of POP) {
      const px = valueToPx(v);
      ctx.beginPath();
      ctx.arc(px, baseY - 8, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(148,163,184,0.35)";
      ctx.fill();
    }

    // 모평균 m 선
    const mX = valueToPx(POP_MEAN);
    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(mX, 22);
    ctx.lineTo(mX, baseY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fb7185";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("m=" + POP_MEAN.toFixed(1), mX, 14);

    if (sample.length === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText('🎲 위에서 "표본 새로 뽑기"를 눌러보세요', w / 2, h / 2);
      return;
    }

    // X̄ 또는 c 선
    const lineV = testMode ? testC : xbar;
    const xX = valueToPx(lineV);
    const xColor = testMode ? "#a855f7" : "#38bdf8";
    ctx.strokeStyle = xColor;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(xX, 38);
    ctx.lineTo(xX, baseY);
    ctx.stroke();
    ctx.setLineDash([]);
    if (testMode) {
      ctx.fillStyle = xColor;
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("c=" + testC.toFixed(1), xX, 30);
    } else {
      ctx.font = "bold 13px sans-serif";
      ctx.fillStyle = xColor;
      ctx.textAlign = "center";
      ctx.fillText("X̄=" + xbar.toFixed(1), xX, 30);
    }

    const now = performance.now();
    const t = animMode ? Math.min(1, (now - animStartRef.current) / ANIM_DUR) : 0;

    // 거리선/사각형
    for (const v of sample) {
      const px = valueToPx(v);
      if (animMode === "m") {
        ctx.strokeStyle = `rgba(251,113,133,${0.55 + 0.35 * t})`;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px, baseY - 8);
        ctx.lineTo(mX, baseY - 8);
        ctx.stroke();
        ctx.setLineDash([]);
        if (t > 0.4) {
          const side = Math.abs(px - mX) * (0.25 + 0.55 * t);
          const cx = (px + mX) / 2 - side / 2;
          const cy = baseY - 8 - side - 4;
          ctx.fillStyle = `rgba(251,113,133,${0.18 * t})`;
          ctx.strokeStyle = `rgba(251,113,133,${0.7 * t})`;
          ctx.lineWidth = 1.2;
          ctx.fillRect(cx, cy, side, side);
          ctx.strokeRect(cx, cy, side, side);
        }
      }
      if (animMode === "x") {
        ctx.strokeStyle = `rgba(56,189,248,${0.55 + 0.35 * t})`;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px, baseY - 8);
        ctx.lineTo(xX, baseY - 8);
        ctx.stroke();
        ctx.setLineDash([]);
        if (t > 0.4) {
          const side = Math.abs(px - xX) * (0.25 + 0.55 * t);
          const cx = (px + xX) / 2 - side / 2;
          const cy = baseY - 8 - side - 4;
          ctx.fillStyle = `rgba(56,189,248,${0.18 * t})`;
          ctx.strokeStyle = `rgba(56,189,248,${0.7 * t})`;
          ctx.lineWidth = 1.2;
          ctx.fillRect(cx, cy, side, side);
          ctx.strokeRect(cx, cy, side, side);
        }
      }
      if (testMode) {
        ctx.strokeStyle = "rgba(168,85,247,.5)";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px, baseY - 8);
        ctx.lineTo(xX, baseY - 8);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 표본 점
      ctx.beginPath();
      ctx.arc(px, baseY - 8, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 값 라벨
      ctx.fillStyle = "#fef3c7";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(v), px, baseY - 22);
    }

    // 하단 라벨
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("모집단 30명 (희미한 점) · 표본 (노란 점)", 12, h - 8);
  }, [sample, xbar, testMode, testC, animMode]);

  // 정적 1회 그리기
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // 애니메이션 — rAF 루프
  useEffect(() => {
    if (!animMode) return;
    let raf = 0;
    const loop = () => {
      drawCanvas();
      const t = (performance.now() - animStartRef.current) / ANIM_DUR;
      if (t < 1) {
        raf = requestAnimationFrame(loop);
      } else {
        setAnimMode(null);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [animMode, drawCanvas]);

  function drawSample() {
    setTestMode(false);
    setSample(sampleFromPop(n));
  }

  function startAnim() {
    if (sample.length === 0) {
      setSample(sampleFromPop(n));
    }
    animStartRef.current = performance.now();
    setAnimMode("m");
    window.setTimeout(() => {
      animStartRef.current = performance.now();
      setAnimMode("x");
    }, ANIM_DUR + 200);
  }

  function toggleTestMode() {
    if (sample.length === 0) setSample(sampleFromPop(n));
    setTestMode((prev) => {
      const next = !prev;
      if (next) setTestC(xbar);
      return next;
    });
  }

  // 드래그로 c 조절
  const draggingRef = useRef(false);
  function getCanvasX(ev: React.PointerEvent<HTMLCanvasElement>): number {
    const cv = canvasRef.current;
    if (!cv) return 0;
    const rect = cv.getBoundingClientRect();
    return ((ev.clientX - rect.left) / rect.width) * cv.width;
  }
  function onPointerDown(ev: React.PointerEvent<HTMLCanvasElement>) {
    if (!testMode) return;
    draggingRef.current = true;
    canvasRef.current?.setPointerCapture(ev.pointerId);
    const v = Math.max(PMIN + 2, Math.min(PMAX - 2, pxToValue(getCanvasX(ev))));
    setTestC(v);
    ev.preventDefault();
  }
  function onPointerMove(ev: React.PointerEvent<HTMLCanvasElement>) {
    if (!testMode || !draggingRef.current) return;
    const v = Math.max(PMIN + 2, Math.min(PMAX - 2, pxToValue(getCanvasX(ev))));
    setTestC(v);
    ev.preventDefault();
  }
  function onPointerUp(ev: React.PointerEvent<HTMLCanvasElement>) {
    draggingRef.current = false;
    canvasRef.current?.releasePointerCapture(ev.pointerId);
  }

  // 카드 비교용 값 / 우측 카드는 testMode일 때 c 기준으로 전환
  const rightVal = testMode ? sumFromC : sumFromXbar;
  const maxV = Math.max(sumFromM, rightVal, 0.001);
  const barMPct = (sumFromM / maxV) * 100;
  const barXPct = (rightVal / maxV) * 100;
  const winnerM = sumFromM < rightVal && sample.length > 0;
  const winnerX = rightVal <= sumFromM && sample.length > 0;

  return (
    <div>
      <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/40 p-4">
        <h4 className="mb-2 text-base font-bold text-cyan-200">
          📏 수직선 위에서 표본 관찰하기
        </h4>
        <div className="relative w-full overflow-hidden rounded-xl border border-cyan-300/25 bg-slate-900 aspect-[2.8]">
          <canvas
            ref={canvasRef}
            width={NL_W}
            height={NL_H}
            className={`block h-full w-full ${testMode ? "cursor-grab touch-none" : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label="수직선 표본 시각화"
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label htmlFor="varN" className="min-w-[90px] text-sm font-bold text-cyan-200">
            표본 크기 n
          </label>
          <input
            id="varN"
            type="range"
            min={3}
            max={20}
            value={n}
            onChange={(e) => setN(parseInt(e.target.value, 10))}
            className="flex-1 accent-amber-300"
          />
          <span className="min-w-[42px] rounded-md bg-slate-900 px-2 py-1 text-center text-base font-extrabold text-amber-300">
            {n}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={drawSample}
            className="flex-1 min-w-[140px] rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-blue-400 hover:to-blue-600 active:scale-95"
          >
            🎲 표본 새로 뽑기
          </button>
          <button
            type="button"
            onClick={startAnim}
            className="flex-1 min-w-[140px] rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-violet-400 hover:to-violet-600 active:scale-95"
          >
            📐 거리 측정 애니메이션
          </button>
          <button
            type="button"
            onClick={toggleTestMode}
            className="flex-1 min-w-[140px] rounded-xl border border-slate-400/30 bg-slate-700/50 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-700/80 active:scale-95"
          >
            {testMode ? "✋ c값 움직이기 끄기" : "🧪 c값 직접 움직이기"}
          </button>
        </div>
      </div>

      {/* 비교 박스 */}
      <div className="mt-3 rounded-2xl border border-cyan-300/15 bg-slate-900/40 p-4">
        <h4 className="mb-2 text-base font-bold text-cyan-200">
          ⚖️ 두 기준의 편차제곱합 비교
        </h4>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {/* m 카드 */}
          <div
            className={`relative rounded-xl border-[1.5px] border-rose-400/50 bg-rose-500/10 p-3 text-center ${
              winnerM ? "ring-2 ring-amber-300/60" : ""
            }`}
          >
            {winnerM && (
              <div className="absolute -right-2 -top-3 text-2xl [filter:drop-shadow(0_2px_4px_rgba(251,191,36,.6))] [animation:popCrown_0.35s_ease]">
                👑
              </div>
            )}
            <h5 className="text-sm font-extrabold text-rose-300">모평균 m 기준</h5>
            <div className="mt-1 text-2xl font-extrabold text-rose-300">
              {sample.length ? sumFromM.toFixed(2) : "--"}
            </div>
            <div className="text-xs text-slate-400">Σ(Xᵢ − m)²</div>
            <BarSVG pct={barMPct} tone="rose" />

            <div className="mt-2 inline-block rounded-md border border-dashed border-violet-400/40 bg-slate-950/40 px-3 py-1 text-xs text-slate-300">
              m = <b className="text-amber-300">{POP_MEAN.toFixed(2)}</b>
            </div>
          </div>

          {/* X̄ 또는 c 카드 */}
          <div
            className={`relative rounded-xl border-[1.5px] border-cyan-400/50 bg-cyan-500/10 p-3 text-center ${
              winnerX ? "ring-2 ring-amber-300/60" : ""
            }`}
          >
            {winnerX && (
              <div className="absolute -right-2 -top-3 text-2xl [filter:drop-shadow(0_2px_4px_rgba(251,191,36,.6))] [animation:popCrown_0.35s_ease]">
                👑
              </div>
            )}
            <h5 className="text-sm font-extrabold text-cyan-300">
              {testMode ? (
                "c 기준 (직접 조절)"
              ) : (
                <>
                  표본평균 X̄ 기준
                </>
              )}
            </h5>
            <div className="mt-1 text-2xl font-extrabold text-cyan-300">
              {sample.length ? rightVal.toFixed(2) : "--"}
            </div>
            <div className="text-xs text-slate-400">
              {testMode ? (
                "Σ(Xᵢ − c)²"
              ) : (
                <>
                  Σ(Xᵢ − X̄)²
                </>
              )}
            </div>
            <BarSVG pct={barXPct} tone="cyan" />

            <div className="mt-2 inline-block rounded-md border border-dashed border-violet-400/40 bg-slate-950/40 px-3 py-1 text-xs text-slate-300">
              {testMode ? (
                <>c = <b className="text-amber-300">{testC.toFixed(2)}</b></>
              ) : (
                <>
                  X̄ = <b className="text-amber-300">{xbar.toFixed(2)}</b>
                </>
              )}
            </div>
          </div>
        </div>

        {testMode && (
          <div className="mt-3 rounded-xl border-[1.5px] border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-center text-sm font-bold text-cyan-200 [animation:slideDown_0.35s_ease]">
            💡 X̄은 Σ(Xᵢ − c)² 를 <b className="text-amber-300">최소</b>로 만드는 c 값입니다!
            → 그래서 어떤 표본이라도 X̄ 기준 퍼짐이 m 기준보다 항상 작거나 같습니다.
          </div>
        )}

        <div className="mt-3 flex items-start gap-2 rounded-xl border-[1.5px] border-violet-400/40 bg-violet-500/10 p-3 text-sm leading-6 text-violet-100">
          <span className="text-xl">✨</span>
          <div>
            <b className="text-yellow-200">관찰해 봐요:</b>
            <br />• 표본을 여러 번 새로 뽑아도 거의 항상{" "}
            <b>
              X̄ 기준 퍼짐이 더 작다
            </b>
            는 사실!
            <br />• 그래서 X̄ 기준으로 잰 퍼짐을{" "}
            <b>n으로 나누면 σ²보다 작게</b> 나오는 거예요. → 이게 바로 편향(bias)!
          </div>
        </div>
      </div>
    </div>
  );
}

// width 가 동적인 막대는 Tailwind 정적 클래스로 불가 → SVG rect width 어트리뷰트.
function BarSVG({ pct, tone }: { pct: number; tone: "rose" | "cyan" }) {
  const w = Math.max(0, Math.min(100, pct));
  const id = useId().replace(/[:]/g, "");
  const colorFrom = tone === "rose" ? "#e11d48" : "#0891b2";
  const colorTo = tone === "rose" ? "#fb7185" : "#22d3ee";
  const gradId = `bar-${id}`;
  return (
    <div className="mt-2 h-4 overflow-hidden rounded-lg border border-white/10 bg-slate-950/70">
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="block h-full w-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={colorFrom} />
            <stop offset="100%" stopColor={colorTo} />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="0"
          width={w}
          height="10"
          rx="1.4"
          fill={`url(#${gradId})`}
        />
      </svg>
    </div>
  );
}

// =================================================================
// TAB 2 — 추정량 경주 (1/n vs 1/(n-1))
// =================================================================
type RaceState = {
  bias: number[];
  unb: number[];
  runBiasMean: number[];
  runUnbMean: number[];
  sumBias: number;
  sumUnb: number;
};
const EMPTY_RACE: RaceState = {
  bias: [],
  unb: [],
  runBiasMean: [],
  runUnbMean: [],
  sumBias: 0,
  sumUnb: 0,
};

function trialOnce(n: number): { bias: number; unb: number } {
  const s = sampleFromPop(n);
  const xb = s.reduce((a, b) => a + b, 0) / n;
  const ssq = s.reduce((a, v) => a + (v - xb) ** 2, 0);
  return { bias: ssq / n, unb: n > 1 ? ssq / (n - 1) : 0 };
}

function RaceTab() {
  const [n, setN] = useState(5);
  const [race, setRace] = useState<RaceState>(EMPTY_RACE);
  const [flash, setFlash] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const autoRef = useRef(false);

  function runOne(state: RaceState, nn: number): RaceState {
    const r = trialOnce(nn);
    const sumBias = state.sumBias + r.bias;
    const sumUnb = state.sumUnb + r.unb;
    const trials = state.bias.length + 1;
    return {
      bias: [...state.bias, r.bias],
      unb: [...state.unb, r.unb],
      runBiasMean: [...state.runBiasMean, sumBias / trials],
      runUnbMean: [...state.runUnbMean, sumUnb / trials],
      sumBias,
      sumUnb,
    };
  }

  function handleOne() {
    setRace((prev) => runOne(prev, n));
    setFlash(true);
    window.setTimeout(() => setFlash(false), 350);
  }

  function handleMany(times: number) {
    if (autoRef.current) return;
    autoRef.current = true;
    setAutoRunning(true);
    let done = 0;
    const step = () => {
      if (!autoRef.current) {
        autoRef.current = false;
        setAutoRunning(false);
        return;
      }
      const batch = Math.min(50, times - done);
      setRace((prev) => {
        let cur = prev;
        for (let k = 0; k < batch; k++) cur = runOne(cur, n);
        return cur;
      });
      done += batch;
      if (done < times) {
        requestAnimationFrame(step);
      } else {
        autoRef.current = false;
        setAutoRunning(false);
      }
    };
    requestAnimationFrame(step);
  }

  function handleReset() {
    autoRef.current = false;
    setAutoRunning(false);
    setRace(EMPTY_RACE);
  }

  function handleNChange(newN: number) {
    setN(newN);
    handleReset();
  }

  const trials = race.bias.length;
  const lastBias = trials ? race.bias[trials - 1] : null;
  const lastUnb = trials ? race.unb[trials - 1] : null;
  const meanBias = trials ? race.sumBias / trials : null;
  const meanUnb = trials ? race.sumUnb / trials : null;

  return (
    <div>
      <div className="mb-3 rounded-xl border-[1.5px] border-amber-400/45 bg-amber-400/10 p-3 text-center">
        <div className="text-xs font-bold tracking-wide text-slate-300">
          진짜 모분산 σ² (정답)
        </div>
        <div className="text-3xl font-extrabold text-amber-300">{POP_VAR.toFixed(3)}</div>
        <div className="text-xs text-slate-400">모집단 30명에서 계산한 고정값</div>
      </div>

      <div className="rounded-2xl border border-pink-300/15 bg-slate-900/40 p-4">
        <h4 className="mb-2 text-base font-bold text-violet-200">🎮 시뮬레이션 컨트롤</h4>

        <div className="flex items-center gap-3">
          <label htmlFor="raceN" className="min-w-[88px] text-sm font-bold text-violet-200">
            표본 크기 n
          </label>
          <input
            id="raceN"
            type="range"
            min={2}
            max={20}
            value={n}
            onChange={(e) => handleNChange(parseInt(e.target.value, 10))}
            className="flex-1 accent-pink-400"
            disabled={autoRunning}
          />
          <span className="min-w-[55px] rounded-md bg-slate-900 px-2 py-1 text-center text-base font-extrabold text-amber-300">
            {n}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleOne}
            disabled={autoRunning}
            className="flex-1 min-w-[110px] rounded-xl bg-gradient-to-br from-pink-500 to-pink-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-pink-400 hover:to-pink-600 active:scale-95 disabled:opacity-40"
          >
            🎲 1회
          </button>
          <button
            type="button"
            onClick={() => handleMany(100)}
            disabled={autoRunning}
            className="flex-1 min-w-[110px] rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-violet-400 hover:to-violet-600 active:scale-95 disabled:opacity-40"
          >
            ⚡ 100회
          </button>
          <button
            type="button"
            onClick={() => handleMany(1000)}
            disabled={autoRunning}
            className="flex-1 min-w-[110px] rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-violet-400 hover:to-violet-600 active:scale-95 disabled:opacity-40"
          >
            🚀 1000회
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 min-w-[110px] rounded-xl border border-slate-400/30 bg-slate-700/50 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-700/80 active:scale-95"
          >
            🔄 리셋
          </button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <RacerCard
            tone="biased"
            title="① 1/n 으로 나눔"
            formula="S² = (1/n) Σ (Xᵢ − X̄)²"
            current={lastBias}
            mean={meanBias}
            flash={flash}
          />
          <RacerCard
            tone="unbiased"
            title="② 1/(n−1) 로 나눔 ✨"
            formula="S² = (1/(n−1)) Σ (Xᵢ − X̄)²"
            current={lastUnb}
            mean={meanUnb}
            flash={flash}
          />
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-pink-300/15 bg-slate-900/40 p-4">
        <h4 className="mb-2 text-base font-bold text-violet-200">
          📈 추정량의 평균이 σ²에 수렴하는 모습
        </h4>

        <div className="rounded-xl border border-cyan-300/20 bg-slate-900/50 p-3">
          <div className="mb-1.5 flex items-center justify-between text-sm font-bold text-slate-300">
            <span>누적 평균 (E[S²]의 추정)</span>
            <span>
              총 <span className="font-extrabold text-amber-300">{trials}</span>회 시행
            </span>
          </div>
          <ConvergenceCanvas
            biasMean={race.runBiasMean}
            unbMean={race.runUnbMean}
          />
          <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-slate-300">
            <span>
              <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-rose-400 align-middle" />
              1/n 추정량 평균
            </span>
            <span>
              <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-emerald-400 align-middle" />
              1/(n−1) 추정량 평균
            </span>
            <span>
              <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-amber-300 align-middle" />
              진짜 σ²
            </span>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-cyan-300/20 bg-slate-900/50 p-3">
          <div className="mb-1.5 text-sm font-bold text-slate-300">
            추정값들의 분포 (히스토그램)
          </div>
          <HistogramCanvas
            bias={race.bias}
            unb={race.unb}
            meanBias={meanBias}
            meanUnb={meanUnb}
          />
        </div>

        <div className="mt-3 rounded-xl border-[1.5px] border-violet-400/40 bg-violet-500/10 p-3 text-sm leading-6 text-violet-100">
          💡 <b className="text-yellow-200">관찰 포인트!</b>
          <br />• <span className="font-extrabold text-rose-300">빨간색 (1/n)</span> 곡선은
          σ²보다 <b>아래</b>에 자리잡아요 → <b>과소추정</b>!
          <br />• <span className="font-extrabold text-emerald-300">초록색 (1/(n−1))</span>{" "}
          곡선은 σ²에 <b>딱 맞춰서</b> 수렴해요 → <b>불편추정량</b>!
          <br />• n이 작을수록 두 곡선의 차이가 더 크게 보입니다.
        </div>
      </div>
    </div>
  );
}

function RacerCard({
  tone,
  title,
  formula,
  current,
  mean,
  flash,
}: {
  tone: "biased" | "unbiased";
  title: string;
  formula: string;
  current: number | null;
  mean: number | null;
  flash: boolean;
}) {
  const cls =
    tone === "biased"
      ? "border-rose-400/55 bg-rose-500/10"
      : "border-emerald-400/55 bg-emerald-500/10";
  const titleCls = tone === "biased" ? "text-rose-300" : "text-emerald-300";
  const valCls = tone === "biased" ? "text-rose-300" : "text-emerald-300";
  const verdictCls =
    tone === "biased"
      ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
      : "border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
  return (
    <div
      className={`relative rounded-2xl border-2 p-3 text-center transition ${cls} ${
        flash ? "ring-2 ring-amber-300/60" : ""
      }`}
    >
      <div
        className={`absolute right-2 top-2 text-base transition ${
          flash ? "opacity-100 [animation:starSpin_0.6s_ease]" : "opacity-0"
        }`}
      >
        ⭐
      </div>
      <h5 className={`text-base font-extrabold ${titleCls}`}>{title}</h5>
      <div className="text-xs text-slate-400">{formula.replace(/X̄/g, "X̄")}</div>
      <div className={`mt-1 text-2xl font-extrabold ${valCls}`}>
        {current !== null ? current.toFixed(3) : "--"}
      </div>
      <div className="text-xs text-slate-400">현재 표본의 추정값</div>
      <div
        className={`mt-2 inline-block rounded-md border px-3 py-1 text-xs font-extrabold ${verdictCls}`}
      >
        평균 = {mean !== null ? mean.toFixed(3) : "--"}
      </div>
    </div>
  );
}

function ConvergenceCanvas({
  biasMean,
  unbMean,
}: {
  biasMean: number[];
  unbMean: number[];
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 700;
  const H = 220;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 42;
    const padR = 14;
    const padT = 14;
    const padB = 30;
    const pw = W - padL - padR;
    const ph = H - padT - padB;

    const sig = POP_VAR;
    const slice = (arr: number[]) => arr.slice(-200);
    const allVals: number[] = [sig, ...slice(biasMean), ...slice(unbMean)];
    const mn = Math.min(...allVals, sig * 0.5);
    const mx = Math.max(...allVals, sig * 1.5);
    const ymn = mn - (mx - mn) * 0.15;
    const ymx = mx + (mx - mn) * 0.15;

    ctx.strokeStyle = "rgba(148,163,184,0.13)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (ph * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      const v = ymx - (ymx - ymn) * (i / 4);
      ctx.fillStyle = "#64748b";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(v.toFixed(1), padL - 4, y + 3);
    }

    const sy = padT + (1 - (sig - ymn) / (ymx - ymn)) * ph;
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, sy);
    ctx.lineTo(W - padR, sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`σ²=${sig.toFixed(2)}`, W - padR - 58, sy - 4);

    if (biasMean.length > 0) {
      const drawLine = (arr: number[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        const n = arr.length;
        arr.forEach((v, i) => {
          const x = padL + (i / Math.max(n - 1, 1)) * pw;
          const y = padT + (1 - (v - ymn) / (ymx - ymn)) * ph;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      };
      drawLine(biasMean, "#fb7185");
      drawLine(unbMean, "#22c55e");
    } else {
      ctx.fillStyle = "#64748b";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🎲 위에서 시뮬레이션을 실행하세요", W / 2, H / 2);
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("시행 횟수", W / 2, H - 8);
  }, [biasMean, unbMean]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[220px] w-full rounded-lg bg-slate-950/60"
      aria-label="누적 평균 수렴 그래프"
    />
  );
}

function HistogramCanvas({
  bias,
  unb,
  meanBias,
  meanUnb,
}: {
  bias: number[];
  unb: number[];
  meanBias: number | null;
  meanUnb: number | null;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 700;
  const H = 220;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 42;
    const padR = 14;
    const padT = 14;
    const padB = 28;
    const pw = W - padL - padR;
    const ph = H - padT - padB;

    if (bias.length === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🎲 시행을 추가하면 두 추정량의 분포가 보입니다", W / 2, H / 2);
      return;
    }

    const sig = POP_VAR;
    const all = bias.concat(unb);
    const lo = Math.min(0, ...all);
    const hi = Math.max(sig * 2.2, ...all);
    const nBins = 40;
    const binW = (hi - lo) / nBins;
    const binsB = new Array<number>(nBins).fill(0);
    const binsU = new Array<number>(nBins).fill(0);
    for (const v of bias) {
      let bi = Math.floor((v - lo) / binW);
      if (bi < 0) bi = 0;
      if (bi >= nBins) bi = nBins - 1;
      binsB[bi]++;
    }
    for (const v of unb) {
      let bi = Math.floor((v - lo) / binW);
      if (bi < 0) bi = 0;
      if (bi >= nBins) bi = nBins - 1;
      binsU[bi]++;
    }
    const maxB = Math.max(1, ...binsB, ...binsU);

    ctx.strokeStyle = "rgba(148,163,184,0.13)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (ph * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
    }

    const bw = pw / nBins - 1;
    for (let i = 0; i < nBins; i++) {
      const x = padL + (i / nBins) * pw;
      const hB = (binsB[i] / maxB) * ph;
      ctx.fillStyle = "rgba(251,113,133,0.55)";
      ctx.fillRect(x, padT + ph - hB, bw, hB);
      const hU = (binsU[i] / maxB) * ph;
      ctx.fillStyle = "rgba(34,197,94,0.55)";
      ctx.fillRect(x, padT + ph - hU, bw, hU);
    }

    // σ² 세로선
    const sigX = padL + ((sig - lo) / (hi - lo)) * pw;
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(sigX, padT);
    ctx.lineTo(sigX, padT + ph);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`σ²=${sig.toFixed(2)}`, sigX, padT - 2);

    const drawArrow = (v: number, color: string, label: string) => {
      const x = padL + ((v - lo) / (hi - lo)) * pw;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, padT + ph + 2);
      ctx.lineTo(x - 6, padT + ph + 12);
      ctx.lineTo(x + 6, padT + ph + 12);
      ctx.closePath();
      ctx.fill();
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, x, padT + ph + 24);
    };
    if (meanBias !== null) drawArrow(meanBias, "#fb7185", "평균");
    if (meanUnb !== null) drawArrow(meanUnb, "#22c55e", "평균");

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("빈도", 6, padT + ph / 2);
    ctx.textAlign = "center";
    ctx.fillText("추정값", W / 2, H - 4);
  }, [bias, unb, meanBias, meanUnb]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[220px] w-full rounded-lg bg-slate-950/60"
      aria-label="추정값 분포 히스토그램"
    />
  );
}

// =================================================================
// TAB 3 — (n−1)의 비밀: 5단계 가이드
// =================================================================
type Step = {
  title: React.ReactNode;
  body: React.ReactNode;
  hasDiagram: boolean;
};

const STEPS: Step[] = [
  {
    title: <>① 두 가지 퍼짐을 비교해 봅시다</>,
    body: (
      <>
        <p>표본의 각 값 Xᵢ에 대해 두 가지 ‘퍼짐’을 잴 수 있어요.</p>
        <ul className="ml-5 list-disc leading-7">
          <li>
            <span className="font-extrabold text-rose-300">진짜 모평균 m에서 잰 퍼짐</span> —
            우리가 <b>알고 싶은 것</b> (모분산 σ²)
          </li>
          <li>
            <span className="font-extrabold text-sky-300">
              표본평균 X̄에서 잰 퍼짐
            </span>{" "}
            — 우리가 <b>실제로 계산할 수 있는 것</b>
          </li>
        </ul>
      </>
    ),
    hasDiagram: true,
  },
  {
    title: <>② 피타고라스처럼 분해됩니다</>,
    body: (
      <>
        <p>놀랍게도 모평균 m 기준 퍼짐의 <b>기댓값</b>은 두 부분으로 깔끔하게 나뉩니다.</p>
        <Eqn>
          E[<span className="font-extrabold text-rose-300">Σ(Xᵢ − m)²/n</span>] = E[
          <span className="font-extrabold text-sky-300">
            Σ(Xᵢ − X̄)²/n
          </span>
          ] + <span className="font-extrabold text-yellow-300">V(X̄)</span>
        </Eqn>
        <ul className="ml-5 list-disc leading-7">
          <li>
            <span className="font-extrabold text-rose-300">표본 ⇄ m 까지의 퍼짐</span> ={" "}
            <span className="font-extrabold text-sky-300">
              표본 ⇄ X̄ 까지의 퍼짐
            </span>{" "}
            +{" "}
            <span className="font-extrabold text-yellow-300">
              X̄ ⇄ m 까지의 흔들림
            </span>
          </li>
        </ul>
        <p className="text-sm text-slate-300">📐 마치 직각삼각형의 빗변² = 밑변² + 높이² 처럼!</p>
      </>
    ),
    hasDiagram: true,
  },
  {
    title: <>③ 기댓값 양변을 정리합니다</>,
    body: (
      <>
        <p>
          왼쪽 항은 정확히 <b>모분산 σ²</b>입니다. 왜냐하면 각 Xᵢ가 모집단에서 뽑힌 값이므로
          E[(Xᵢ−m)²] = σ² 이고, 평균을 내도 그대로 σ²이거든요.
        </p>
        <Eqn>
          <span className="font-extrabold text-yellow-300">σ²</span> = E[
          <span className="font-extrabold text-sky-300">
            Σ(Xᵢ − X̄)²/n
          </span>
          ] + V(X̄)
        </Eqn>
        <p>
          여기서 우리가 알고 싶은 부분(X̄ 기준 퍼짐의 기댓값)만 옮겨 봅시다.
        </p>
        <Eqn>
          E[
          <span className="font-extrabold text-sky-300">
            Σ(Xᵢ − X̄)²/n
          </span>
          ] = <span className="font-extrabold text-yellow-300">σ²</span> − V(X̄)
        </Eqn>
      </>
    ),
    hasDiagram: false,
  },
  {
    title: (
      <>
        ④ V(X̄) = σ²/n을 대입!
      </>
    ),
    body: (
      <>
        <p>
          이미 배웠죠? <b>표본평균의 분산</b>은 V(X̄) = σ²/n 입니다.
        </p>
        <Eqn>
          E[
          <span className="font-extrabold text-sky-300">
            Σ(Xᵢ − X̄)²/n
          </span>
          ] = σ² − <span className="text-rose-300">σ²/n</span>
        </Eqn>
        <Eqn>
          = <span className="font-extrabold text-emerald-300">(n − 1)/n · σ²</span>
        </Eqn>
        <p>
          👉 1/n으로 나눈 추정량의 평균은 σ²보다 <b>(n−1)/n 만큼 작게</b> 나옵니다. 그래서
          살짝 모자라요!
        </p>
      </>
    ),
    hasDiagram: false,
  },
  {
    title: <>⑤ 비밀 공개 — 양변에 n/(n−1)을 곱하자!</>,
    body: (
      <>
        <p>
          모자란 만큼을 정확히 메꾸려면 양변에 <b>n/(n−1)</b>을 곱하면 됩니다.
        </p>
        <Eqn>
          n/(n−1) · E[
          <span className="font-extrabold text-sky-300">
            Σ(Xᵢ − X̄)²/n
          </span>
          ] = n/(n−1) · (n−1)/n · σ² ={" "}
          <span className="font-extrabold text-yellow-300">σ²</span>
        </Eqn>
        <Eqn>
          ⟹ E[
          <span className="font-extrabold text-emerald-300">
            Σ(Xᵢ − X̄)²/(n−1)
          </span>
          ] = <span className="font-extrabold text-yellow-300">σ²</span> ✅
        </Eqn>
        <div className="mt-3 rounded-2xl border-2 border-emerald-400/55 bg-gradient-to-br from-emerald-500/20 to-amber-400/10 p-4 text-center">
          <div className="text-base font-extrabold text-yellow-200">💎 결론</div>
          <div className="my-2 text-xl font-extrabold tracking-wide text-emerald-200">
            S² = <span className="text-[1.1em]">1/(n−1)</span> · Σ(Xᵢ − X̄)²
          </div>
          <div className="text-sm leading-6 text-slate-200">
            이렇게 정의해야 <b>E(S²) = σ²</b>가 되어 <b>불편추정량</b>이 됩니다.
            <br />
            이게 바로 <b>베셀 보정 (Bessel’s correction)</b>이에요!
          </div>
          <div className="mt-3 inline-block rounded-full bg-emerald-500 px-4 py-1 text-sm font-extrabold tracking-wide text-white">
            🎉 미션 완료!
          </div>
        </div>
      </>
    ),
    hasDiagram: false,
  },
];

function Eqn({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-2 rounded-lg border border-amber-300/30 bg-slate-950/70 px-3 py-2.5 text-center text-base text-amber-50 [animation:fadeIn_0.4s_ease]">
      {children}
    </div>
  );
}

function SecretTab() {
  const [curr, setCurr] = useState(0);

  function goPrev() {
    if (curr > 0) setCurr(curr - 1);
  }
  function goNext() {
    if (curr < STEPS.length - 1) setCurr(curr + 1);
  }

  const s = STEPS[curr];

  return (
    <div>
      <div className="rounded-2xl border border-amber-300/15 bg-slate-900/40 p-4">
        {/* 칩 */}
        <div className="mb-3 flex flex-wrap justify-center gap-1.5">
          {STEPS.map((stp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurr(i)}
              className={`rounded-full border-[1.5px] px-3 py-1.5 text-xs font-extrabold transition ${
                i === curr
                  ? "scale-105 border-amber-300 bg-gradient-to-br from-amber-300 to-orange-500 text-slate-900 shadow-md"
                  : i < curr
                  ? "border-emerald-400/45 bg-emerald-400/15 text-emerald-200"
                  : "border-slate-400/25 bg-slate-700/40 text-slate-400"
              }`}
            >
              {stp.title}
            </button>
          ))}
        </div>

        {/* 본문 */}
        <div className="min-h-[340px] rounded-xl border-[1.5px] border-cyan-300/20 bg-slate-950/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-base font-extrabold text-yellow-300">
            🌟 {s.title}
          </div>
          <div className="space-y-2 text-sm leading-7 text-slate-200">{s.body}</div>
          {s.hasDiagram && (
            <div className="mt-3 rounded-xl border border-cyan-300/20 bg-slate-900/70 p-2">
              <DecompCanvas />
            </div>
          )}
        </div>

        {/* 네비 */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={curr === 0}
            className="flex-1 rounded-xl border border-slate-400/30 bg-slate-700/70 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-700 active:scale-95 disabled:opacity-40"
          >
            ⬅ 이전
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={curr === STEPS.length - 1}
            className="flex-1 rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 px-3 py-2.5 text-sm font-extrabold text-slate-900 shadow-md transition hover:from-amber-200 hover:to-orange-400 active:scale-95 disabled:opacity-40"
          >
            {curr === STEPS.length - 1 ? "🎉 끝!" : "다음 ➡"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DecompCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 700;
  const H = 310;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const baseY = H - 65;
    const padL = 50;
    const padR = 40;
    const xmin = 0;
    const xmax = 100;
    const X = (v: number) => padL + ((v - xmin) / (xmax - xmin)) * (W - padL - padR);

    ctx.strokeStyle = "rgba(203,213,225,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X(xmin), baseY);
    ctx.lineTo(X(xmax), baseY);
    ctx.stroke();

    const samp = [42, 48, 53, 60, 67];
    const xbar = samp.reduce((a, b) => a + b, 0) / samp.length;
    const m = 50;

    const mx = X(m);
    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(mx, 24);
    ctx.lineTo(mx, baseY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fb7185";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("m", mx, 16);

    const xx = X(xbar);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(xx, 44);
    ctx.lineTo(xx, baseY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "center";
    ctx.fillText("X̄", xx, 36);

    for (const v of samp) {
      const px = X(v);
      // m까지 (빨강)
      ctx.strokeStyle = "rgba(251,113,133,.45)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(px, baseY - 8);
      ctx.lineTo(mx, baseY - 8);
      ctx.stroke();
      // X̄까지 (파랑)
      ctx.strokeStyle = "rgba(56,189,248,.85)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(px, baseY - 28);
      ctx.lineTo(xx, baseY - 28);
      ctx.stroke();
      // 점
      ctx.beginPath();
      ctx.arc(px, baseY - 8, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 범례
    const lgY1 = H - 38;
    const lgY2 = H - 18;
    ctx.fillStyle = "#fb7185";
    ctx.fillRect(8, lgY1 - 3, 14, 3);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("━━ 표본 → m (모분산 기여)", 28, lgY1);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(8, lgY2 - 3, 14, 3);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("━━ 표본 → X̄ (계산 가능)", 28, lgY2);
  }, []);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[310px] w-full rounded-lg"
      aria-label="분해 다이어그램"
    />
  );
}
