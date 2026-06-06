"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Vec3 = { x: number; y: number; z: number };

const MAX_HIST = 600;

function lorenzDeriv(s: Vec3, sigma: number, rho: number, beta: number) {
  return {
    dx: sigma * (s.y - s.x),
    dy: s.x * (rho - s.z) - s.y,
    dz: s.x * s.y - beta * s.z,
  };
}

function rk4(s: Vec3, dt: number, sigma: number, rho: number, beta: number): Vec3 {
  const k1 = lorenzDeriv(s, sigma, rho, beta);
  const s2 = { x: s.x + (dt / 2) * k1.dx, y: s.y + (dt / 2) * k1.dy, z: s.z + (dt / 2) * k1.dz };
  const k2 = lorenzDeriv(s2, sigma, rho, beta);
  const s3 = { x: s.x + (dt / 2) * k2.dx, y: s.y + (dt / 2) * k2.dy, z: s.z + (dt / 2) * k2.dz };
  const k3 = lorenzDeriv(s3, sigma, rho, beta);
  const s4 = { x: s.x + dt * k3.dx, y: s.y + dt * k3.dy, z: s.z + dt * k3.dz };
  const k4 = lorenzDeriv(s4, sigma, rho, beta);
  return {
    x: s.x + (dt / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx),
    y: s.y + (dt / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy),
    z: s.z + (dt / 6) * (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz),
  };
}

export default function LorenzButterfly() {
  const [deltaExp, setDeltaExp] = useState(-3); // δ = 10^deltaExp
  const [sigma, setSigma] = useState(10);
  const [rho, setRho] = useState(28);
  const [beta, setBeta] = useState(2.67);
  const [running, setRunning] = useState(false);

  const delta = Math.pow(10, deltaExp);

  const state1Ref = useRef<Vec3>({ x: 0.1, y: 0, z: 0.5 });
  const state2Ref = useRef<Vec3>({ x: 0.1 + delta, y: 0, z: 0.5 });
  const zHist1Ref = useRef<number[]>([]);
  const zHist2Ref = useRef<number[]>([]);
  const diffHistRef = useRef<number[]>([]);
  const tRef = useRef(0);
  const lyapTimeRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const animRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const [diff, setDiff] = useState(0);
  const [meter, setMeter] = useState<{ pct: number; label: string; color: string }>({
    pct: 0,
    label: "시뮬레이션을 시작하세요",
    color: "#22c55e",
  });
  const [lyapLabel, setLyapLabel] = useState<string>("—");

  const zCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const initStates = useCallback(() => {
    state1Ref.current = { x: 0.1, y: 0, z: 0.5 };
    state2Ref.current = { x: 0.1 + delta, y: 0, z: 0.5 };
    zHist1Ref.current = [];
    zHist2Ref.current = [];
    diffHistRef.current = [];
    tRef.current = 0;
    lyapTimeRef.current = null;
    setLyapLabel("—");
    setDiff(0);
    setMeter({ pct: 0, label: "시뮬레이션을 시작하세요", color: "#22c55e" });
  }, [delta]);

  function fitCanvas(cv: HTMLCanvasElement, h: number) {
    const wrap = cv.parentElement;
    if (!wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(280, wrap.clientWidth);
    cv.width = w * dpr;
    cv.height = h * dpr;
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    const ctx = cv.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  }

  function fitAll() {
    if (zCanvasRef.current) fitCanvas(zCanvasRef.current, 300);
    if (diffCanvasRef.current) fitCanvas(diffCanvasRef.current, 200);
  }

  const drawZGraph = useCallback(() => {
    const cv = zCanvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#475569";
    ctx.font = "11px sans-serif";
    ctx.fillText("z (대류 강도)", 8, 14);

    function line(data: number[], color: string) {
      if (data.length < 2) return;
      const min = Math.min(...data) - 3;
      const max = Math.max(...data) + 3;
      ctx!.beginPath();
      data.forEach((v, i) => {
        const x = (i / (MAX_HIST - 1)) * (w - 20) + 10;
        const y = h - 20 - ((v - min) / (max - min)) * (h - 30);
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      });
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 1.5;
      ctx!.globalAlpha = 0.85;
      ctx!.stroke();
      ctx!.globalAlpha = 1;
    }
    line(zHist2Ref.current, "#f472b6");
    line(zHist1Ref.current, "#38bdf8");

    ctx.fillStyle = "#475569";
    ctx.font = "10px sans-serif";
    ctx.fillText(`t = ${tRef.current.toFixed(1)}`, w - 60, h - 6);
  }, []);

  const drawDiffGraph = useCallback(() => {
    const cv = diffCanvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#475569";
    ctx.font = "11px sans-serif";
    ctx.fillText("두 궤적의 차이 |Δx|", 8, 14);
    const hist = diffHistRef.current;
    if (hist.length < 2) return;
    const maxD = Math.max(...hist, 0.01);
    ctx.beginPath();
    hist.forEach((v, i) => {
      const x = (i / (MAX_HIST - 1)) * (w - 20) + 10;
      const y = h - 16 - (v / maxD) * (h - 24);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    const grad = ctx.createLinearGradient(10, 0, w - 10, 0);
    grad.addColorStop(0, "#22c55e");
    grad.addColorStop(0.5, "#f59e0b");
    grad.addColorStop(1, "#ef4444");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  const draw = useCallback(() => {
    drawZGraph();
    drawDiffGraph();
  }, [drawZGraph, drawDiffGraph]);

  const step = useCallback(
    (dt: number) => {
      const substeps = 10;
      const h = dt / substeps;
      let s1 = state1Ref.current;
      let s2 = state2Ref.current;
      for (let i = 0; i < substeps; i++) {
        s1 = rk4(s1, h, sigma, rho, beta);
        s2 = rk4(s2, h, sigma, rho, beta);
        tRef.current += h;
      }
      state1Ref.current = s1;
      state2Ref.current = s2;
      zHist1Ref.current.push(s1.z);
      if (zHist1Ref.current.length > MAX_HIST) zHist1Ref.current.shift();
      zHist2Ref.current.push(s2.z);
      if (zHist2Ref.current.length > MAX_HIST) zHist2Ref.current.shift();
      const d = Math.abs(s1.x - s2.x);
      diffHistRef.current.push(d);
      if (diffHistRef.current.length > MAX_HIST) diffHistRef.current.shift();
      if (lyapTimeRef.current === null && d > delta * 10) {
        lyapTimeRef.current = tRef.current;
        setLyapLabel(`t ≈ ${tRef.current.toFixed(1)}`);
      }
      setDiff(d);
      const ratio = Math.min(d / 20, 1);
      const pct = Math.round(ratio * 100);
      const color = ratio < 0.2 ? "#22c55e" : ratio < 0.55 ? "#f59e0b" : "#ef4444";
      const label =
        ratio < 0.05
          ? "거의 차이 없음 — 예측 가능"
          : ratio < 0.2
            ? "조금씩 벌어지는 중..."
            : ratio < 0.55
              ? "차이가 커졌어요!"
              : "완전히 달라진 예측!";
      setMeter({ pct, label, color });
    },
    [sigma, rho, beta, delta],
  );

  const loop = useCallback(
    (ts: number) => {
      if (!runningRef.current) return;
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const elapsed = Math.min(ts - lastTsRef.current, 50);
      lastTsRef.current = ts;
      step(elapsed / 1000);
      draw();
      animRef.current = requestAnimationFrame(loop);
    },
    [step, draw],
  );

  function start() {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    lastTsRef.current = null;
    animRef.current = requestAnimationFrame(loop);
  }

  function stop() {
    runningRef.current = false;
    setRunning(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }

  function reset() {
    stop();
    initStates();
    draw();
  }

  useEffect(() => {
    fitAll();
    initStates();
    draw();
    function onResize() {
      fitAll();
      draw();
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 파라미터 변경 시 정지 + 초기화 (running 중엔 무시).
  useEffect(() => {
    if (running) return;
    initStates();
    draw();
  }, [deltaExp, sigma, rho, beta, running, initStates, draw]);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-4 text-center">
        <h2 className="text-2xl font-extrabold text-white">🦋 나비효과 — 로렌츠의 기상 모델</h2>
        <p className="mt-1 text-sm text-slate-400">
          소수점 몇 자리의 차이가 기상 예보를 어떻게 바꾸는지 관찰해보세요.
        </p>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-[280px] flex-1 space-y-3">
          <div>
            <canvas
              ref={zCanvasRef}
              className="block w-full rounded-xl border border-white/10"
            />
          </div>
          <div>
            <canvas
              ref={diffCanvasRef}
              className="block w-full rounded-xl border border-white/10"
            />
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
            <Legend dot="#38bdf8" label="원본 (x₀ = 0.1)" />
            <Legend dot="#f472b6" label={`미세 변화 (x₀ = 0.1 + ${delta.toExponential(0)})`} />
            <Legend dot="#fb923c" label="두 궤적의 차이" />
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-80">
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              🔧 방정식 파라미터
            </h3>
            <SliderRow
              label="초기 x 차이 (δ)"
              value={deltaExp}
              min={-6}
              max={-1}
              step={0.5}
              onChange={setDeltaExp}
              format={() => delta.toPrecision(2)}
            />
            <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
              두 시뮬레이션의 <b className="text-slate-300">시작 조건 차이</b>.<br />
              예) 0.001 = 소수점 셋째 자리 반올림 오차
            </p>
            <SliderRow
              label="σ — 공기 혼합 정도"
              value={sigma}
              min={5}
              max={20}
              step={0.5}
              onChange={setSigma}
            />
            <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
              공기가 얼마나 빠르게 <b className="text-slate-300">섞이는지</b> (보통 10).
            </p>
            <SliderRow
              label="ρ — 위아래 온도 차이"
              value={rho}
              min={10}
              max={50}
              step={1}
              onChange={setRho}
            />
            <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
              지표·상공 <b className="text-slate-300">온도 차</b>. 클수록 대류 강함.
              <br />
              <span className="font-bold text-rose-300">※ ρ ≈ 24.7 이상에서 카오스!</span>
            </p>
            <SliderRow
              label="β — 대기층 모양"
              value={beta}
              min={1}
              max={5}
              step={0.1}
              onChange={setBeta}
              format={(v) => v.toFixed(2)}
            />
            <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
              대기층 폭/높이 비율. 지구 대기 기본값 8/3 ≈ 2.67.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={start}
                disabled={running}
                className="flex-1 rounded-md bg-emerald-500 px-2 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-400 disabled:bg-emerald-500/40 disabled:cursor-not-allowed"
              >
                ▶ 시작
              </button>
              <button
                type="button"
                onClick={stop}
                disabled={!running}
                className="flex-1 rounded-md bg-amber-500 px-2 py-1.5 text-xs font-bold text-white transition hover:bg-amber-400 disabled:bg-amber-500/40 disabled:cursor-not-allowed"
              >
                ⏸
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex-1 rounded-md border border-rose-400/40 bg-rose-500/15 px-2 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-500/25"
              >
                ↺
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              📏 현재 차이
            </h3>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-pink-300">
                {diff.toFixed(4)}
              </div>
              <div className="text-[11px] text-slate-400">두 x 값의 차이</div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${meter.pct}%`, background: meter.color }}
              />
            </div>
            <p className="mt-1 text-center text-[11px] text-slate-400">{meter.label}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-center">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              ⏱ 예측 한계
            </h3>
            <div className="text-[11px] leading-relaxed text-slate-300">
              두 궤적 차이가 <b className="text-white">10배</b> 될 때까지:
            </div>
            <div className="mt-1 text-xl font-extrabold text-pink-300">{lyapLabel}</div>
            <div className="text-[10px] text-slate-500">리아푸노프 시간 (예측 한계)</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-100">
        <div className="mb-1 font-bold text-amber-300">📖 로렌츠의 발견 (1961년)</div>
        로렌츠는 기상 시뮬레이션을 다시 실행하기 위해 중간 결과를 소수점{" "}
        <b className="text-white">3자리</b>만 입력했습니다 (원래는 6자리). 그런데 컴퓨터
        결과는 처음과 <b className="text-white">완전히 달랐습니다</b>.
        <br />
        <br />
        단순한 반올림 오차가 기상 예보 전체를 바꿔버린 것. 이것이{" "}
        <b className="text-white">나비효과(Butterfly Effect)</b>의 출발점입니다.
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: dot }} />
      {label}
    </span>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span className="font-bold text-sky-300">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sky-400"
        aria-label={label}
      />
    </div>
  );
}
