"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Pendulum = {
  a1: number; // 라디안
  a2: number;
  w1: number;
  w2: number;
  l1: number;
  l2: number;
  m1: number;
  m2: number;
  trail: { x: number; y: number }[];
  color: string;
};

const G = 9.8;
const PALETTE = ["#38bdf8", "#ff6b35", "#a3e635", "#c084fc", "#34d399", "#fbbf24"];
const MAX_TRAIL = 400;

function makePendulum(a1Deg: number, a2Deg: number, l1: number, l2: number, color: string): Pendulum {
  return {
    a1: (a1Deg * Math.PI) / 180,
    a2: (a2Deg * Math.PI) / 180,
    w1: 0,
    w2: 0,
    l1,
    l2,
    m1: 1,
    m2: 1,
    trail: [],
    color,
  };
}

type State = { a1: number; a2: number; w1: number; w2: number };
type Deriv = { da1: number; da2: number; dw1: number; dw2: number };

function derivatives(p: Pendulum, s: State): Deriv {
  const { a1, a2, w1, w2 } = s;
  const { l1, l2, m1, m2 } = p;
  const d = a1 - a2;
  const M = m1 + m2;
  const num1 =
    -G * (2 * m1 + m2) * Math.sin(a1) -
    m2 * G * Math.sin(a1 - 2 * a2) -
    2 * Math.sin(d) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(d));
  const den1 = l1 * (2 * M - m2 * Math.cos(2 * d));
  const dw1 = num1 / den1;
  const num2 =
    2 *
    Math.sin(d) *
    (w1 * w1 * l1 * M + G * M * Math.cos(a1) + w2 * w2 * l2 * m2 * Math.cos(d));
  const den2 = l2 * (2 * M - m2 * Math.cos(2 * d));
  const dw2 = num2 / den2;
  return { da1: w1, da2: w2, dw1, dw2 };
}

function rk4Step(p: Pendulum, dt: number) {
  const s0: State = { a1: p.a1, a2: p.a2, w1: p.w1, w2: p.w2 };
  const k1 = derivatives(p, s0);
  const k2 = derivatives(p, {
    a1: s0.a1 + (dt / 2) * k1.da1,
    a2: s0.a2 + (dt / 2) * k1.da2,
    w1: s0.w1 + (dt / 2) * k1.dw1,
    w2: s0.w2 + (dt / 2) * k1.dw2,
  });
  const k3 = derivatives(p, {
    a1: s0.a1 + (dt / 2) * k2.da1,
    a2: s0.a2 + (dt / 2) * k2.da2,
    w1: s0.w1 + (dt / 2) * k2.dw1,
    w2: s0.w2 + (dt / 2) * k2.dw2,
  });
  const k4 = derivatives(p, {
    a1: s0.a1 + dt * k3.da1,
    a2: s0.a2 + dt * k3.da2,
    w1: s0.w1 + dt * k3.dw1,
    w2: s0.w2 + dt * k3.dw2,
  });
  p.a1 += (dt / 6) * (k1.da1 + 2 * k2.da1 + 2 * k3.da1 + k4.da1);
  p.a2 += (dt / 6) * (k1.da2 + 2 * k2.da2 + 2 * k3.da2 + k4.da2);
  p.w1 += (dt / 6) * (k1.dw1 + 2 * k2.dw1 + 2 * k3.dw1 + k4.dw1);
  p.w2 += (dt / 6) * (k1.dw2 + 2 * k2.dw2 + 2 * k3.dw2 + k4.dw2);
}

function getPos(p: Pendulum, cw: number, ch: number) {
  const cx = cw / 2;
  const cy = ch / 2;
  const x1 = cx + p.l1 * Math.sin(p.a1);
  const y1 = cy + p.l1 * Math.cos(p.a1);
  const x2 = x1 + p.l2 * Math.sin(p.a2);
  const y2 = y1 + p.l2 * Math.cos(p.a2);
  return { cx, cy, x1, y1, x2, y2 };
}

export default function DoublePendulum() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pendulumsRef = useRef<Pendulum[]>([]);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const [l1, setL1] = useState(120);
  const [l2, setL2] = useState(100);
  const [a1Deg, setA1Deg] = useState(150);
  const [a2Deg, setA2Deg] = useState(90);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [meter, setMeter] = useState<{ pct: number; label: string; color: string }>({
    pct: 0,
    label: "비교 궤적을 추가하세요",
    color: "#22c55e",
  });
  const [ghostCount, setGhostCount] = useState(0);

  // 캔버스 사이즈 + DPR.
  const sizeRef = useRef({ w: 500, h: 460 });
  function fitCanvas() {
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;
    const dpr = window.devicePixelRatio || 1;
    const wCss = Math.max(280, wrap.clientWidth);
    const hCss = Math.min(460, Math.round(wCss * 0.85));
    cv.width = wCss * dpr;
    cv.height = hCss * dpr;
    cv.style.width = wCss + "px";
    cv.style.height = hCss + "px";
    const ctx = cv.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    sizeRef.current = { w: wCss, h: hCss };
  }

  const initMain = useCallback(() => {
    pendulumsRef.current = [makePendulum(a1Deg, a2Deg, l1, l2, PALETTE[0])];
    setGhostCount(0);
  }, [a1Deg, a2Deg, l1, l2]);

  const updateMeter = useCallback(() => {
    const pend = pendulumsRef.current;
    if (pend.length < 2) {
      setMeter({ pct: 0, label: "비교 궤적을 추가하세요", color: "#22c55e" });
      return;
    }
    const sz = sizeRef.current;
    const p0 = pend[0];
    const p1 = pend[1];
    const pos0 = getPos(p0, sz.w, sz.h);
    const pos1 = getPos(p1, sz.w, sz.h);
    const dist = Math.hypot(pos0.x2 - pos1.x2, pos0.y2 - pos1.y2);
    const ratio = Math.min(dist / 300, 1);
    const pct = Math.round(ratio * 100);
    const color = ratio < 0.3 ? "#22c55e" : ratio < 0.65 ? "#f59e0b" : "#ef4444";
    const label =
      ratio < 0.05
        ? "거의 같은 궤적 (초기 단계)"
        : ratio < 0.3
          ? `조금씩 달라지는 중... (${pct}%)`
          : ratio < 0.65
            ? `많이 달라졌어요! (${pct}%)`
            : `완전히 다른 궤적! 카오스! (${pct}%)`;
    setMeter({ pct, label, color });
  }, []);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#64748b";
    ctx.fill();

    const pend = pendulumsRef.current;
    for (let i = pend.length - 1; i >= 0; i--) {
      const p = pend[i];
      const isMain = i === 0;
      const pos = getPos(p, w, h);
      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let j = 1; j < p.trail.length; j++) ctx.lineTo(p.trail[j].x, p.trail[j].y);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = isMain ? 0.45 : 0.7;
        ctx.lineWidth = isMain ? 1.5 : 2.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.globalAlpha = isMain ? 1 : 0.9;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = isMain ? 3 : 2.5;
      ctx.beginPath();
      ctx.moveTo(pos.cx, pos.cy);
      ctx.lineTo(pos.x1, pos.y1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x1, pos.y1);
      ctx.lineTo(pos.x2, pos.y2);
      ctx.stroke();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(pos.x1, pos.y1, isMain ? 9 : 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pos.x2, pos.y2, isMain ? 9 : 8, 0, Math.PI * 2);
      ctx.fill();
      if (!isMain) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pos.x2, pos.y2, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    updateMeter();
  }, [updateMeter]);

  // 초기화 + 슬라이더 변경시 재렌더 (정지 상태에서만).
  useEffect(() => {
    fitCanvas();
    initMain();
    draw();
    function onResize() {
      fitCanvas();
      draw();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (running) return;
    initMain();
    draw();
  }, [l1, l2, a1Deg, a2Deg, running, initMain, draw]);

  // 시뮬레이션 루프.
  const loop = useCallback(
    (ts: number) => {
      if (!runningRef.current) return;
      if (lastTimeRef.current === null) lastTimeRef.current = ts;
      const elapsed = Math.min(ts - lastTimeRef.current, 50);
      lastTimeRef.current = ts;
      const substeps = 8;
      const dt = (elapsed / 1000) * speed / substeps;
      for (let i = 0; i < substeps; i++) {
        for (const p of pendulumsRef.current) {
          rk4Step(p, dt);
          const sz = sizeRef.current;
          const pos = getPos(p, sz.w, sz.h);
          p.trail.push({ x: pos.x2, y: pos.y2 });
          if (p.trail.length > MAX_TRAIL) p.trail.shift();
        }
      }
      draw();
      animRef.current = requestAnimationFrame(loop);
    },
    [speed, draw],
  );

  function start() {
    if (runningRef.current) return;
    if (pendulumsRef.current.length === 0) initMain();
    runningRef.current = true;
    setRunning(true);
    lastTimeRef.current = null;
    animRef.current = requestAnimationFrame(loop);
  }

  function pause() {
    runningRef.current = false;
    setRunning(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }

  function reset() {
    pause();
    initMain();
    lastTimeRef.current = null;
    draw();
  }

  function addGhost() {
    const main = pendulumsRef.current[0];
    if (!main) {
      initMain();
      return;
    }
    const offset = 0.5;
    const color = PALETTE[Math.min(pendulumsRef.current.length, PALETTE.length - 1)];
    const ghost = makePendulum(
      (main.a1 * 180) / Math.PI + offset,
      (main.a2 * 180) / Math.PI,
      main.l1,
      main.l2,
      color,
    );
    ghost.a1 = main.a1 + (offset * Math.PI) / 180;
    ghost.a2 = main.a2;
    ghost.w1 = main.w1;
    ghost.w2 = main.w2;
    pendulumsRef.current.push(ghost);
    setGhostCount(pendulumsRef.current.length - 1);
    draw();
  }

  function clearGhosts() {
    pendulumsRef.current = pendulumsRef.current.slice(0, 1);
    setGhostCount(0);
    draw();
  }

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-4 text-center">
        <h2 className="text-2xl font-extrabold text-white">🌀 이중진자와 카오스</h2>
        <p className="mt-1 text-sm text-slate-400">
          초기 조건의 작은 차이가 완전히 다른 결과를 만들어냅니다.
        </p>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div ref={wrapRef} className="min-w-[280px] flex-1">
          <canvas ref={canvasRef} className="block w-full rounded-xl border border-white/10" />
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-72">
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              ⚙️ 초기 조건
            </h3>
            <SliderRow label="첫째 팔 길이" value={l1} min={60} max={160} step={5} onChange={setL1} />
            <SliderRow label="둘째 팔 길이" value={l2} min={60} max={160} step={5} onChange={setL2} />
            <SliderRow label="팔 1 초기 각도°" value={a1Deg} min={30} max={175} step={1} onChange={setA1Deg} />
            <SliderRow label="팔 2 초기 각도°" value={a2Deg} min={30} max={175} step={1} onChange={setA2Deg} />
            <SliderRow
              label="시뮬레이션 속도"
              value={speed}
              min={0.2}
              max={5}
              step={0.2}
              onChange={setSpeed}
              format={(v) => v.toFixed(1) + "x"}
            />
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
                onClick={pause}
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
                ↺ 리셋
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              🎨 나비효과 직접 보기
            </h3>
            <div className="mb-3 rounded-md bg-slate-900 p-2 text-xs leading-relaxed text-slate-300">
              버튼을 누르면 같은 시작 위치에서
              <br />팔 1 각도만{" "}
              <b className="text-amber-300">딱 0.5° 다른</b> 진자가 추가됩니다.
              <br />
              <br />
              <span className="text-sky-400">● 파란 진자</span> — 기준
              <br />
              <span style={{ color: "#ff6b35" }}>● 주황 진자</span> — 0.5° 차이
              <br />
              <br />
              처음엔 거의 겹쳐 움직이다가, 시간이 지나면{" "}
              <b className="text-white">완전히 다른 방향</b>으로 갑니다!
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={addGhost}
                className="flex-1 rounded-md bg-orange-500 px-2 py-1.5 text-xs font-bold text-white transition hover:bg-orange-400"
              >
                + 비교 진자 추가
              </button>
              <button
                type="button"
                onClick={clearGhosts}
                disabled={ghostCount === 0}
                className="flex-1 rounded-md border border-slate-500/40 bg-slate-700/40 px-2 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ✕ 지우기
              </button>
            </div>
            {ghostCount > 0 ? (
              <div className="mt-2 text-[11px] text-slate-400">비교 진자 {ghostCount}개</div>
            ) : null}
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              📊 혼돈 지수
            </h3>
            <div className="text-[11px] text-slate-300">두 궤적이 얼마나 달라졌나?</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${meter.pct}%`, background: meter.color }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">{meter.label}</p>
          </div>

          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
            <div className="mb-1 font-bold text-amber-300">💡 카오스란?</div>
            초기 조건의 아주 작은 차이가 시간이 지나면서{" "}
            <b className="text-white">완전히 다른</b> 결과를 낳는 현상.
            <br />이것이 바로 <b className="text-white">나비효과</b>입니다!
          </div>
        </div>
      </div>
    </div>
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
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span className="font-bold text-sky-300">
          {format ? format(value) : value}
        </span>
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
