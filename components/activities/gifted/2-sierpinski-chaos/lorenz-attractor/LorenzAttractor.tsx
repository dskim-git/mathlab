"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Vec3 = { x: number; y: number; z: number };

const MAX_TRAIL = 5000;
const DT_BASE = 0.005;

const COLOR_THEMES = [
  { name: "cyan", stops: ["#0ea5e9", "#6366f1", "#a855f7"] },
  { name: "fire", stops: ["#ef4444", "#f97316", "#facc15"] },
  { name: "forest", stops: ["#22c55e", "#84cc16", "#ecfccb"] },
  { name: "rose", stops: ["#f472b6", "#e879f9", "#c084fc"] },
  { name: "ocean", stops: ["#06b6d4", "#0891b2", "#0e7490"] },
  { name: "gold", stops: ["#fbbf24", "#f59e0b", "#d97706"] },
] as const;

const VIEW_PRESETS = [
  { label: "정면 (XZ)", rx: 0, ry: 0 },
  { label: "측면 (YZ)", rx: Math.PI / 2, ry: 0 },
  { label: "위 (XY)", rx: 0, ry: Math.PI / 2 },
  { label: "3D 사선", rx: 0.5, ry: 0.4 },
];

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

function lerpColor(c1: string, c2: string, t: number): string {
  const hex = (h: string) => parseInt(h.slice(1), 16);
  const a = hex(c1);
  const b = hex(c2);
  const r1 = (a >> 16) & 0xff;
  const g1 = (a >> 8) & 0xff;
  const b1 = a & 0xff;
  const r2 = (b >> 16) & 0xff;
  const g2 = (b >> 8) & 0xff;
  const b2 = b & 0xff;
  const r = Math.round(r1 + t * (r2 - r1));
  const g = Math.round(g1 + t * (g2 - g1));
  const bv = Math.round(b1 + t * (b2 - b1));
  return `rgb(${r},${g},${bv})`;
}

export default function LorenzAttractor() {
  const [sigma, setSigma] = useState(10);
  const [rho, setRho] = useState(28);
  const [beta, setBeta] = useState(2.67);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [colorTheme, setColorTheme] = useState(0);

  // 통계 + HUD
  const [hud, setHud] = useState({
    x: 0,
    y: 0,
    z: 0,
    pts: 0,
    wings: 0,
  });

  // 시뮬레이션 상태 (ref — 매 프레임 갱신).
  const stateRef = useRef<Vec3>({ x: 0.1, y: 0, z: 0.5 });
  const trailRef = useRef<Vec3[]>([]);
  const wingCountRef = useRef(0);
  const lastWingRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const playingRef = useRef(true);

  // 3D 회전·줌
  const rotRef = useRef({ x: 0.3, y: 0.2, z: 0 });
  const zoomRef = useRef(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef({ w: 500, h: 460 });

  function fitCanvas() {
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(280, wrap.clientWidth);
    const h = Math.round((w * 460) / 500);
    cv.width = w * dpr;
    cv.height = h * dpr;
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    const ctx = cv.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    sizeRef.current = { w, h };
  }

  // 회전 + 원근 투영.
  function project(p: Vec3): { sx: number; sy: number; depth: number } {
    const { x: rotX, y: rotY, z: rotZ } = rotRef.current;
    const nx = p.x / 25;
    const ny = p.y / 25;
    const nz = (p.z - 25) / 25;
    // rotX
    const y1 = ny * Math.cos(rotX) - nz * Math.sin(rotX);
    const z1 = ny * Math.sin(rotX) + nz * Math.cos(rotX);
    // rotY
    const x2 = nx * Math.cos(rotY) + z1 * Math.sin(rotY);
    const z2 = -nx * Math.sin(rotY) + z1 * Math.cos(rotY);
    // rotZ
    const x3 = x2 * Math.cos(rotZ) - y1 * Math.sin(rotZ);
    const y3 = x2 * Math.sin(rotZ) + y1 * Math.cos(rotZ);
    const fov = 3;
    const scale = (fov / (fov + z2)) * 200 * zoomRef.current;
    const { w, h } = sizeRef.current;
    return { sx: w / 2 + x3 * scale, sy: h / 2 - y3 * scale, depth: z2 };
  }

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    ctx.fillStyle = "#050a14";
    ctx.fillRect(0, 0, w, h);
    const trail = trailRef.current;
    if (trail.length < 2) return;
    const theme = COLOR_THEMES[colorTheme];
    const n = trail.length;
    for (let i = 1; i < n; i++) {
      const ratio = i / n;
      let stroke: string;
      if (ratio < 0.5) {
        stroke = lerpColor(theme.stops[0], theme.stops[1], ratio * 2);
      } else {
        stroke = lerpColor(theme.stops[1], theme.stops[2], (ratio - 0.5) * 2);
      }
      const p0 = project(trail[i - 1]);
      const p1 = project(trail[i]);
      ctx.beginPath();
      ctx.moveTo(p0.sx, p0.sy);
      ctx.lineTo(p1.sx, p1.sy);
      ctx.strokeStyle = stroke;
      ctx.globalAlpha = 0.5 + ratio * 0.5;
      ctx.lineWidth = ratio > 0.97 ? 2.5 : 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const last = trail[n - 1];
    const proj = project(last);
    ctx.beginPath();
    ctx.arc(proj.sx, proj.sy, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(proj.sx, proj.sy, 7, 0, Math.PI * 2);
    ctx.strokeStyle = "#f8fafc50";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [colorTheme]);

  const step = useCallback(
    (wallDt: number) => {
      const steps = Math.max(1, Math.round(speed * 8));
      let s = stateRef.current;
      for (let i = 0; i < steps; i++) {
        s = rk4(s, DT_BASE * speed, sigma, rho, beta);
        trailRef.current.push({ ...s });
        if (trailRef.current.length > MAX_TRAIL) trailRef.current.shift();
        const w = s.x > 0 ? 1 : -1;
        if (w !== lastWingRef.current && lastWingRef.current !== 0) wingCountRef.current++;
        lastWingRef.current = w;
      }
      stateRef.current = s;
      void wallDt;
      setHud({
        x: s.x,
        y: s.y,
        z: s.z,
        pts: trailRef.current.length,
        wings: wingCountRef.current,
      });
    },
    [speed, sigma, rho, beta],
  );

  const loop = useCallback(
    (ts: number) => {
      if (!playingRef.current) return;
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const wallDt = Math.min(ts - lastTsRef.current, 50) / 1000;
      lastTsRef.current = ts;
      step(wallDt);
      draw();
      animRef.current = requestAnimationFrame(loop);
    },
    [step, draw],
  );

  function togglePlay() {
    const next = !playingRef.current;
    playingRef.current = next;
    setPlaying(next);
    if (next) {
      lastTsRef.current = null;
      animRef.current = requestAnimationFrame(loop);
    } else if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }
  }

  function reset() {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    stateRef.current = { x: 0.1, y: 0, z: 0.5 };
    trailRef.current = [];
    wingCountRef.current = 0;
    lastWingRef.current = 0;
    lastTsRef.current = null;
    setHud({ x: 0, y: 0, z: 0, pts: 0, wings: 0 });
    playingRef.current = true;
    setPlaying(true);
    animRef.current = requestAnimationFrame(loop);
  }

  function setView(rx: number, ry: number) {
    rotRef.current = { x: rx, y: ry, z: 0 };
    if (!playingRef.current) draw();
  }

  // Pointer Events 회전 + wheel zoom.
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* 무시 */
    }
    dragRef.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    rotRef.current.y += dx * 0.008;
    rotRef.current.x += dy * 0.008;
    dragRef.current = { x: e.clientX, y: e.clientY };
    if (!playingRef.current) draw();
  }
  function onPointerUp() {
    dragRef.current = null;
  }
  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    zoomRef.current = Math.max(0.3, Math.min(3, zoomRef.current - e.deltaY * 0.001));
    if (!playingRef.current) draw();
  }

  // 슬라이더 변경 → 자동 reset (DT 변동 + 새 파라미터 적용).
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigma, rho, beta]);

  // 초기화 + resize (ResizeObserver — mount 직후 layout 도 정확히 잡음).
  useEffect(() => {
    fitCanvas();
    draw();
    const wrap = wrapRef.current;
    let ro: ResizeObserver | null = null;
    if (wrap && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        fitCanvas();
        draw();
      });
      ro.observe(wrap);
    }
    function onResize() {
      fitCanvas();
      draw();
    }
    window.addEventListener("resize", onResize);
    playingRef.current = true;
    animRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-4 text-center">
        <h2 className="text-2xl font-extrabold text-white">🌀 로렌츠 끌개 — 불규칙 속의 규칙성</h2>
        <p className="mt-1 text-sm text-slate-400">
          예측 불가능한 카오스 궤적이 그려내는 아름다운 나비 모양 구조.
        </p>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-[280px] flex-1">
          <div ref={wrapRef} className="w-full">
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
              style={{ touchAction: "none", cursor: dragRef.current ? "grabbing" : "grab" }}
              className="block w-full rounded-xl border border-white/10"
            />
          </div>
          <p className="mt-1 text-center text-xs text-slate-500">
            🖱 드래그로 3D 회전 · 스크롤로 줌
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-80">
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              ⚙️ 파라미터
            </h3>
            <SliderRow
              label="σ — 공기 혼합 속도"
              value={sigma}
              min={1}
              max={20}
              step={0.5}
              onChange={setSigma}
              format={(v) => v.toFixed(1)}
            />
            <SliderRow
              label="ρ — 위아래 온도차"
              value={rho}
              min={10}
              max={60}
              step={0.5}
              onChange={setRho}
              format={(v) => v.toFixed(1)}
            />
            <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
              <span className="text-emerald-300">▶ ~24 이하</span>: 일정한 패턴 수렴
              <br />
              <span className="text-rose-300">▶ 24.7 이상</span>: 카오스 시작! 나비 모양
            </p>
            <SliderRow
              label="β — 대기층 모양"
              value={beta}
              min={0.5}
              max={6}
              step={0.1}
              onChange={setBeta}
              format={(v) => v.toFixed(2)}
            />
            <SliderRow
              label="속도"
              value={speed}
              min={0.1}
              max={5}
              step={0.1}
              onChange={setSpeed}
              format={(v) => v.toFixed(1) + "x"}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={togglePlay}
                className={
                  "flex-1 rounded-md px-2 py-1.5 text-xs font-bold text-white transition " +
                  (playing
                    ? "bg-amber-500 hover:bg-amber-400"
                    : "bg-emerald-500 hover:bg-emerald-400")
                }
              >
                {playing ? "⏸ 일시정지" : "▶ 재생"}
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
              🎨 색상 테마
            </h3>
            <div className="flex flex-wrap gap-2">
              {COLOR_THEMES.map((t, i) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => {
                    setColorTheme(i);
                    if (!playingRef.current) draw();
                  }}
                  className={
                    "h-8 w-8 rounded-md border-2 transition " +
                    (i === colorTheme
                      ? "border-white ring-2 ring-white/30"
                      : "border-white/20 hover:border-white/50")
                  }
                  style={{
                    background: `linear-gradient(135deg, ${t.stops[0]}, ${t.stops[2]})`,
                  }}
                  title={t.name}
                  aria-label={`색상 테마 ${t.name}`}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              📐 시점 선택
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {VIEW_PRESETS.map((v) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => setView(v.rx, v.ry)}
                  className="rounded-md border border-white/10 bg-slate-800 px-2 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              📊 현재 상태
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="x" value={hud.x.toFixed(1)} color="text-sky-300" />
              <Stat label="y" value={hud.y.toFixed(1)} color="text-pink-300" />
              <Stat label="z" value={hud.z.toFixed(1)} color="text-emerald-300" />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <Stat label="점의 수" value={String(hud.pts)} color="text-slate-200" />
              <Stat label="날개 전환" value={String(hud.wings)} color="text-amber-300" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-violet-400/30 bg-violet-500/10 p-4 text-sm leading-relaxed text-violet-100">
        <div className="mb-1 font-bold text-violet-300">🔍 끌개(Attractor)란?</div>
        로렌츠는 세 가지 관계를 자분방정식으로 표현했습니다:
        <br />· <b>x</b>: 대류 회전 속도 · <b>y</b>: 수평 온도 차 · <b>z</b>: 수직 온도 차
        <br />
        이 세 값을 3차원 공간에 점으로 찍으면 바로 이 그림이 나옵니다.
        <br />
        <br />
        카오스 구역(ρ ≥ 24.7)에서는 궤적이{" "}
        <b className="text-white">예측 불가능</b>하지만, 항상 이{" "}
        <b className="text-white">나비 모양 끌개 안에서만</b> 움직입니다.
        <br />
        같은 경로를 절대 반복하지 않으면서도 특정 영역 밖으로는 나가지 않는 것.
        <br />
        <br />
        <b className="text-white">불규칙 속의 규칙성</b> — 이것이 카오스의 숨겨진
        아름다움입니다.
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-md bg-slate-900/60 p-2">
      <div className={"text-lg font-extrabold " + color}>{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
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
