"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TabKey = "menger" | "koch" | "cantor" | "dimension";

function fmt(n: number): string {
  return n.toLocaleString();
}

export default function FractalDimensions() {
  const [tab, setTab] = useState<TabKey>("menger");
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-5 text-center">
        <h2 className="text-2xl font-extrabold text-white">
          📐 프랙털 — 길이·넓이·부피와 차원 탐구
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          멩거 스펀지·코흐 곡선·칸토어 집합의 단계별 측정값을 계산하며 프랙털
          차원을 탐구합니다.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {(
          [
            { key: "menger", label: "🧊 멩거 스펀지" },
            { key: "koch", label: "❄️ 코흐 곡선" },
            { key: "cantor", label: "📏 칸토어 집합" },
            { key: "dimension", label: "🔢 프랙털 차원" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              "rounded-lg border px-3 py-1.5 text-sm font-semibold transition " +
              (tab === t.key
                ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
                : "border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-900")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className={tab === "menger" ? "" : "hidden"}>
        <MengerTab />
      </section>
      <section className={tab === "koch" ? "" : "hidden"}>
        <KochTab />
      </section>
      <section className={tab === "cantor" ? "" : "hidden"}>
        <CantorTab />
      </section>
      <section className={tab === "dimension" ? "" : "hidden"}>
        <DimensionTab />
      </section>
    </div>
  );
}

// ─── 멩거 스펀지 ────────────────────────────────────────────
type MengerRow = { n: number; cnt: number; sa: number; vol: number };

function computeMenger(maxN: number): MengerRow[] {
  const arr: MengerRow[] = [];
  for (let n = 0; n <= maxN; n++) {
    const cnt = Math.pow(20, n);
    const sa = 2 * Math.pow(20 / 9, n) + 4 * Math.pow(8 / 9, n);
    const vol = Math.pow(20 / 27, n);
    arr.push({ n, cnt, sa, vol });
  }
  return arr;
}

function MengerTab() {
  return (
    <div className="space-y-4">
      <MengerIntro />
      <MengerCalcCard />
      <MengerSliceCard />
      <Menger3DCard />
      <MengerQuiz />
    </div>
  );
}

function MengerIntro() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-2 text-base font-bold text-white">🧊 멩거 스펀지란?</h3>
      <p className="text-sm leading-relaxed text-slate-300">
        정육면체를 27개의 작은 정육면체로 나누고,{" "}
        <b className="text-amber-300">중앙 1개</b>와{" "}
        <b className="text-amber-300">각 면의 가운데 6개</b>를 제거합니다 → 20개
        남음. 이 과정을 각 작은 정육면체에 반복하면 멩거 스펀지가 만들어집니다.
      </p>
      <div className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm leading-7 text-slate-200">
        <div className="mb-1 font-bold text-cyan-300">핵심 규칙</div>
        27개 중 7개 제거 → <b className="text-amber-300">20개 유지</b>
        <br />한 변의 길이 비율: 1 → 1/3 (3분의 1로 축소)
        <br />n 단계 정육면체 수: <b className="text-amber-300">20ⁿ</b>
        <br />작은 정육면체 한 변 길이:{" "}
        <b className="text-amber-300">(1/3)ⁿ</b>
      </div>
    </div>
  );
}

function MengerCalcCard() {
  const [n, setN] = useState(0);
  const rows = useMemo(() => computeMenger(5), []);
  const cur = rows[n];
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">📊 단계별 계산</h3>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-300">단계 n =</label>
        <input
          type="range"
          min={0}
          max={5}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="flex-1 accent-sky-400"
          aria-label="단계 n"
        />
        <span className="min-w-[2rem] rounded-md bg-sky-500/20 px-2 py-0.5 text-center font-bold text-sky-200">
          {n}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-2 py-1.5 text-center">단계</th>
                <th className="px-2 py-1.5 text-right">정육면체 수</th>
                <th className="px-2 py-1.5 text-right">겉넓이</th>
                <th className="px-2 py-1.5 text-right">부피</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.n}
                  className={
                    "border-b border-white/5 " +
                    (r.n === n ? "bg-sky-500/20" : "bg-slate-900/30")
                  }
                >
                  <td className="px-2 py-1.5 text-center font-bold text-slate-100">{r.n}</td>
                  <td className="px-2 py-1.5 text-right font-bold text-sky-300">{fmt(r.cnt)}</td>
                  <td className="px-2 py-1.5 text-right font-bold text-emerald-300">{r.sa.toFixed(3)}</td>
                  <td className="px-2 py-1.5 text-right font-bold text-amber-300">{r.vol.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
          <div className="mb-2 text-sm font-bold text-blue-300">
            n = {n} 단계
          </div>
          <div className="space-y-2.5">
            <Big
              label="정육면체 수"
              value={fmt(cur.cnt)}
              expr={`= 20^${n} = ${fmt(cur.cnt)}`}
              color="text-sky-300"
            />
            <Big
              label="겉넓이 (한 변 = 1 기준)"
              value={cur.sa.toFixed(4)}
              expr={`≈ 2×(20/9)^${n} + 4×(8/9)^${n}`}
              color="text-emerald-300"
            />
            <Big
              label="부피 (한 변 = 1 기준)"
              value={cur.vol.toFixed(5)}
              expr={`= (20/27)^${n}`}
              color="text-amber-300"
              badge={
                n === 0
                  ? null
                  : cur.vol < 0.001
                    ? { text: "거의 0!", color: "bg-emerald-500/30 text-emerald-100" }
                    : { text: "0을 향해 수렴 중", color: "bg-slate-700/50 text-slate-200" }
              }
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm leading-7 text-slate-200">
        <div className="mb-1 font-bold text-cyan-300">n 단계 공식</div>
        겉넓이 = <b className="text-emerald-300">2·(20/9)ⁿ + 4·(8/9)ⁿ</b>{" "}
        (발산 → ∞)
        <br />
        부피 = <b className="text-amber-300">(20/27)ⁿ</b> (수렴 → 0)
      </div>
    </div>
  );
}

function Big({
  label,
  value,
  expr,
  color,
  badge,
}: {
  label: string;
  value: string;
  expr: string;
  color: string;
  badge?: { text: string; color: string } | null;
}) {
  return (
    <div>
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={"text-2xl font-extrabold " + color}>{value}</div>
      <div className="text-[11px] text-slate-500">{expr}</div>
      {badge ? (
        <span
          className={
            "mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold " + badge.color
          }
        >
          {badge.text}
        </span>
      ) : null}
    </div>
  );
}

// 2D 단면 시각화 — 1단계 정면 단면의 격자.
function isMengerSliceHole(x: number, y: number, size: number): boolean {
  let s = size;
  while (s >= 3) {
    const sub = s / 3;
    const xi = Math.floor(x / sub);
    const yi = Math.floor(y / sub);
    x -= xi * sub;
    y -= yi * sub;
    // 중앙 + 4면 가운데
    if (
      (xi === 1 && yi === 1) ||
      (xi === 0 && yi === 1) ||
      (xi === 1 && yi === 0) ||
      (xi === 2 && yi === 1) ||
      (xi === 1 && yi === 2)
    ) {
      return true;
    }
    s = sub;
  }
  return false;
}

function MengerSliceCard() {
  const [n, setN] = useState(0);
  const [animating, setAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  function draw(level: number) {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(200, Math.min(wrap.clientWidth, 360));
    cv.width = W * dpr;
    cv.height = W * dpr;
    cv.style.width = W + "px";
    cv.style.height = W + "px";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, W);
    const sz = Math.pow(3, level);
    const cell = W / sz;
    for (let row = 0; row < sz; row++) {
      for (let col = 0; col < sz; col++) {
        if (isMengerSliceHole(col, row, sz)) {
          ctx.fillStyle = "#0f172a";
        } else {
          const t = level / 4;
          const r = Math.floor(59 + t * (200 - 59));
          const g = Math.floor(130 + t * (30 - 130));
          const b = Math.floor(246 + t * (50 - 246));
          ctx.fillStyle = `rgb(${r},${g},${b})`;
        }
        ctx.fillRect(col * cell, row * cell, cell - 0.5, cell - 0.5);
      }
    }
  }

  useEffect(() => {
    draw(n);
    function onResize() {
      draw(n);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  // 0~4 단계 차례로 700ms 간격 애니메이션.
  useEffect(() => {
    if (!animating) return;
    let k = 0;
    setN(0);
    const t = setInterval(() => {
      k++;
      if (k > 4) {
        clearInterval(t);
        setAnimating(false);
        return;
      }
      setN(k);
    }, 700);
    return () => clearInterval(t);
  }, [animating]);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">🎨 단면 시각화 (2D 격자)</h3>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-300">단계 n =</label>
        <input
          type="range"
          min={0}
          max={4}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          disabled={animating}
          className="flex-1 accent-sky-400 disabled:opacity-50"
          aria-label="단계 n"
        />
        <span className="min-w-[2rem] rounded-md bg-sky-500/20 px-2 py-0.5 text-center font-bold text-sky-200">
          {n}
        </span>
        <button
          type="button"
          onClick={() => setAnimating(true)}
          disabled={animating}
          className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ▶ 애니메이션
        </button>
      </div>
      <div ref={wrapRef} className="mx-auto max-w-sm">
        <canvas ref={canvasRef} className="block rounded-lg border border-white/10" />
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        정면에서 본 멩거 스펀지 단면 (중앙과 4면 가운데가 뚫려 있음)
      </p>
    </div>
  );
}

// ─── 멩거 3D 등각 투영 ──────────────────────────────────────
type Face = {
  shade: number;
  normal: [number, number, number];
  corners: { x: number; y: number; z: number }[];
};

type MengerGeo = { sz: number; faces: Face[] };

function isMengerHole3D(cx: number, cy: number, cz: number, sz: number): boolean {
  let x = cx,
    y = cy,
    z = cz,
    s = sz;
  while (s >= 3) {
    const ds = s / 3;
    const xi = Math.floor(x / ds);
    const yi = Math.floor(y / ds);
    const zi = Math.floor(z / ds);
    // 두 축 이상이 가운데(1) 이면 cross hole.
    let cnt = 0;
    if (xi === 1) cnt++;
    if (yi === 1) cnt++;
    if (zi === 1) cnt++;
    if (cnt >= 2) return true;
    x -= xi * ds;
    y -= yi * ds;
    z -= zi * ds;
    s = ds;
  }
  return false;
}

const FACE_DEFS: {
  delta: [number, number, number];
  shade: number;
  normal: [number, number, number];
  corners: [number, number, number][];
}[] = [
  { delta: [1, 0, 0], shade: 0.86, normal: [1, 0, 0], corners: [[1, 0, 0], [1, 0, 1], [1, 1, 1], [1, 1, 0]] },
  { delta: [-1, 0, 0], shade: 0.6, normal: [-1, 0, 0], corners: [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]] },
  { delta: [0, 1, 0], shade: 1.0, normal: [0, 1, 0], corners: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]] },
  { delta: [0, -1, 0], shade: 0.52, normal: [0, -1, 0], corners: [[0, 0, 0], [0, 0, 1], [1, 0, 1], [1, 0, 0]] },
  { delta: [0, 0, 1], shade: 0.74, normal: [0, 0, 1], corners: [[0, 0, 1], [0, 1, 1], [1, 1, 1], [1, 0, 1]] },
  { delta: [0, 0, -1], shade: 0.58, normal: [0, 0, -1], corners: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]] },
];

function buildMengerGeometry(n: number): MengerGeo {
  const sz = Math.pow(3, n);
  const cubes: { cx: number; cy: number; cz: number }[] = [];
  for (let cx = 0; cx < sz; cx++)
    for (let cy = 0; cy < sz; cy++)
      for (let cz = 0; cz < sz; cz++)
        if (!isMengerHole3D(cx, cy, cz, sz)) cubes.push({ cx, cy, cz });
  const cubeSet = new Set(cubes.map((c) => `${c.cx},${c.cy},${c.cz}`));
  const faces: Face[] = [];
  for (const { cx, cy, cz } of cubes) {
    for (const f of FACE_DEFS) {
      const nx = cx + f.delta[0];
      const ny = cy + f.delta[1];
      const nz = cz + f.delta[2];
      // 인접 큐브가 있으면 face 가려짐.
      if (cubeSet.has(`${nx},${ny},${nz}`)) continue;
      faces.push({
        shade: f.shade,
        normal: f.normal,
        corners: f.corners.map(([dx, dy, dz]) => ({ x: cx + dx, y: cy + dy, z: cz + dz })),
      });
    }
  }
  return { sz, faces };
}

const mengerCache = new Map<number, MengerGeo>();
function getMengerGeometry(n: number): MengerGeo {
  let g = mengerCache.get(n);
  if (g) return g;
  g = buildMengerGeometry(n);
  mengerCache.set(n, g);
  return g;
}

function Menger3DCard() {
  const [n, setN] = useState(0);
  const [angleY, setAngleY] = useState(Math.PI / 6);
  const [autoRotate, setAutoRotate] = useState(false);
  const [animating, setAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const angleRef = useRef(angleY);
  useEffect(() => {
    angleRef.current = angleY;
  }, [angleY]);

  function render() {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(300, wrap.clientWidth);
    const H = Math.min(460, Math.round(W * 0.62));
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);
    const { sz, faces } = getMengerGeometry(n);
    const scale = (Math.min(W, H) * 0.6) / sz;
    const cosY = Math.cos(angleRef.current);
    const sinY = Math.sin(angleRef.current);
    const angleX = 0.45;
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    function proj(x: number, y: number, z: number) {
      const ccx = x - sz / 2;
      const ccy = y - sz / 2;
      const ccz = z - sz / 2;
      const rx = ccx * cosY + ccz * sinY;
      const rz = -ccx * sinY + ccz * cosY;
      const ry2 = ccy * cosX - rz * sinX;
      const rz2 = ccy * sinX + rz * cosX;
      return { sx: W / 2 + rx * scale, sy: H / 2 - ry2 * scale, depth: rz2 };
    }
    function rotVec(x: number, y: number, z: number) {
      const rx = x * cosY + z * sinY;
      const rz = -x * sinY + z * cosY;
      const ry2 = y * cosX - rz * sinX;
      const rz2 = y * sinX + rz * cosX;
      return { x: rx, y: ry2, z: rz2 };
    }
    type Rendered = {
      pts: { sx: number; sy: number }[];
      depth: number;
      shade: number;
    };
    const rendered: Rendered[] = [];
    for (const f of faces) {
      const rn = rotVec(f.normal[0], f.normal[1], f.normal[2]);
      if (rn.z <= 0.001) continue; // back-face cull
      const pts = f.corners.map((c) => proj(c.x, c.y, c.z));
      const depth = pts.reduce((s, p) => s + p.depth, 0) / pts.length;
      rendered.push({ pts: pts.map((p) => ({ sx: p.sx, sy: p.sy })), depth, shade: f.shade });
    }
    rendered.sort((a, b) => a.depth - b.depth);
    for (const f of rendered) {
      const r = Math.min(255, Math.floor((60 + n * 30) * f.shade));
      const g = Math.min(255, Math.floor((100 + n * 20) * f.shade));
      const b = Math.min(255, Math.floor((200 + n * 10) * f.shade));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      f.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  useEffect(() => {
    render();
    function onResize() {
      render();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, angleY]);

  // 자동 회전.
  useEffect(() => {
    if (!autoRotate) return;
    let raf: number | null = null;
    let lastTs: number | null = null;
    function loop(ts: number) {
      if (lastTs === null) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      setAngleY((a) => a + dt * 0.6);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [autoRotate]);

  // 0→3 애니메이션 (900ms).
  useEffect(() => {
    if (!animating) return;
    let k = 0;
    setN(0);
    const t = setInterval(() => {
      k++;
      if (k > 3) {
        clearInterval(t);
        setAnimating(false);
        return;
      }
      setN(k);
    }, 900);
    return () => clearInterval(t);
  }, [animating]);

  const cubeCount = Math.pow(20, n);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-2 text-base font-bold text-white">🧊 3D 시뮬레이션</h3>
      <p className="mb-3 text-xs text-slate-400">
        등각 투영법(isometric)으로 멩거 스펀지를 3D로 표현. 단계가 올라갈수록
        뚫린 구멍이 많아집니다.
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-sm font-semibold text-slate-300">단계 n =</label>
        <input
          type="range"
          min={0}
          max={3}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          disabled={animating}
          className="flex-1 accent-sky-400 disabled:opacity-50"
          aria-label="3D 단계 n"
        />
        <span className="min-w-[2rem] rounded-md bg-sky-500/20 px-2 py-0.5 text-center font-bold text-sky-200">
          {n}
        </span>
        <button
          type="button"
          onClick={() => setAnimating(true)}
          disabled={animating}
          className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ▶ 애니메이션
        </button>
        <button
          type="button"
          onClick={() => setAutoRotate((r) => !r)}
          className={
            "rounded-md px-3 py-1.5 text-xs font-bold text-white transition " +
            (autoRotate ? "bg-emerald-500 hover:bg-emerald-400" : "bg-slate-700 hover:bg-slate-600")
          }
        >
          🔄 {autoRotate ? "회전 중" : "자동 회전"}
        </button>
      </div>
      <div ref={wrapRef} className="w-full">
        <canvas ref={canvasRef} className="block w-full rounded-lg border border-white/10" />
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        {n} 단계 멩거 스펀지 — 작은 정육면체 {fmt(cubeCount)}개
      </p>
    </div>
  );
}

// 멩거 퀴즈
type MengerQ = {
  q: string;
  opts: string[];
  correctIdx: number;
  fb: string;
};

const MENGER_QS: MengerQ[] = [
  {
    q: "Q1. 3단계 멩거 스펀지의 정육면체 개수는?",
    opts: ["400개", "8,000개", "27,000개", "729개"],
    correctIdx: 1,
    fb: "20³ = 8,000개. 매 단계마다 정육면체가 20배씩 늘어납니다.",
  },
  {
    q: "Q2. 단계를 무한히 반복하면 멩거 스펀지의 부피는?",
    opts: ["1에 수렴한다", "0에 수렴한다", "무한히 커진다", "변하지 않는다"],
    correctIdx: 1,
    fb: "(20/27)ⁿ → 0. 매 단계마다 부피가 20/27 = 0.74 배씩 줄어듭니다.",
  },
  {
    q: "Q3. 단계를 무한히 반복하면 멩거 스펀지의 겉넓이는?",
    opts: [
      "6으로 수렴한다",
      "0에 수렴한다",
      "무한히 커진다 (발산)",
      "20에 수렴한다",
    ],
    correctIdx: 2,
    fb: "2·(20/9)ⁿ + 4·(8/9)ⁿ — 첫 항 (20/9 > 1) 이 지배해 발산.",
  },
];

function MengerQuiz() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">🧩 확인 문제</h3>
      <div className="space-y-3">
        {MENGER_QS.map((q, i) => (
          <QuizItem key={i} q={q} />
        ))}
      </div>
    </div>
  );
}

function QuizItem({ q }: { q: MengerQ }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const done = chosen != null;
  const correct = done && chosen === q.correctIdx;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/60 p-4">
      <div className="mb-2 text-sm font-bold text-white">{q.q}</div>
      <div className="grid grid-cols-2 gap-2">
        {q.opts.map((opt, i) => {
          let cls =
            "border border-white/10 bg-slate-900 text-slate-200 hover:bg-slate-800";
          if (done) {
            if (i === q.correctIdx) {
              cls = "border-emerald-400/60 bg-emerald-500/20 text-emerald-200";
            } else if (i === chosen) {
              cls = "border-rose-400/60 bg-rose-500/20 text-rose-200";
            } else {
              cls = "border-white/10 bg-slate-900/40 text-slate-500";
            }
          }
          return (
            <button
              key={i}
              type="button"
              disabled={done}
              onClick={() => setChosen(i)}
              className={
                "rounded-md px-3 py-2 text-sm font-semibold transition " +
                cls +
                (done ? " cursor-not-allowed" : " cursor-pointer")
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
      {done ? (
        <div
          className={
            "mt-2 rounded-md p-2 text-sm " +
            (correct
              ? "bg-emerald-500/15 text-emerald-100"
              : "bg-rose-500/15 text-rose-100")
          }
        >
          {correct ? "✅ 정답! " : "❌ 오답. "}
          {q.fb}
        </div>
      ) : null}
    </div>
  );
}

// ─── 탭 2: 코흐 곡선 ────────────────────────────────────────
type KochMode = "curve" | "snow";
type Pt = { x: number; y: number };

function kochSubdiv(a: Pt, b: Pt, turn: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const pA = { x: a.x + dx / 3, y: a.y + dy / 3 };
  const pB = { x: a.x + (2 * dx) / 3, y: a.y + (2 * dy) / 3 };
  const mx = (pA.x + pB.x) / 2;
  const my = (pA.y + pB.y) / 2;
  const offX = ((Math.sqrt(3) / 2) * (pB.y - pA.y)) * turn;
  const offY = -((Math.sqrt(3) / 2) * (pB.x - pA.x)) * turn;
  return { a: pA, peak: { x: mx + offX, y: my + offY }, b: pB };
}

function kochPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  n: number,
  turn: number,
): Pt[] {
  if (n === 0) return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
  const { a, peak, b } = kochSubdiv({ x: x1, y: y1 }, { x: x2, y: y2 }, turn);
  return [
    ...kochPoints(x1, y1, a.x, a.y, n - 1, turn).slice(0, -1),
    ...kochPoints(a.x, a.y, peak.x, peak.y, n - 1, turn).slice(0, -1),
    ...kochPoints(peak.x, peak.y, b.x, b.y, n - 1, turn).slice(0, -1),
    ...kochPoints(b.x, b.y, x2, y2, n - 1, turn),
  ];
}

function kochOutwardSign(a: Pt, b: Pt, center: Pt): number {
  const up = kochSubdiv(a, b, 1).peak;
  const dn = kochSubdiv(a, b, -1).peak;
  const upD = (up.x - center.x) ** 2 + (up.y - center.y) ** 2;
  const dnD = (dn.x - center.x) ** 2 + (dn.y - center.y) ** 2;
  return upD >= dnD ? 1 : -1;
}

function kochSnowArea(n: number): number {
  const A0 = Math.sqrt(3) / 4;
  let area = A0;
  let triangles = 3;
  let side = 1 / 3;
  for (let i = 1; i <= n; i++) {
    area += triangles * (Math.sqrt(3) / 4) * side * side;
    triangles *= 4;
    side /= 3;
  }
  return area;
}

function KochTab() {
  const [mode, setMode] = useState<KochMode>("curve");
  return (
    <div className="space-y-4">
      <KochIntro />
      <KochCalcCard mode={mode} setMode={setMode} />
      <KochVisCard mode={mode} setMode={setMode} />
      <KochQuiz />
    </div>
  );
}

function KochIntro() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-2 text-base font-bold text-white">❄️ 코흐 곡선이란?</h3>
      <p className="text-sm leading-relaxed text-slate-300">
        선분을 3등분하고, 가운데 구간을{" "}
        <b className="text-amber-300">정삼각형</b> 모양으로 교체합니다. 새로 생긴
        4개 선분에 같은 과정을 반복하면 코흐 곡선, 3 개의 코흐 곡선을 정삼각형
        모양으로 이어 붙이면 <b className="text-amber-300">코흐 눈송이</b>가
        됩니다.
      </p>
      <div className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm leading-7 text-slate-200">
        <div className="mb-1 font-bold text-cyan-300">핵심 규칙</div>
        선분 1개 → 선분 4개 (각 길이 1/3)
        <br />n 단계 선분 수: <b className="text-amber-300">4ⁿ</b>
        <br />선분 하나의 길이: <b className="text-amber-300">(1/3)ⁿ</b>
        <br />총 둘레 길이: <b className="text-amber-300">(4/3)ⁿ</b>
      </div>
    </div>
  );
}

function KochCalcCard({
  mode,
  setMode,
}: {
  mode: KochMode;
  setMode: (m: KochMode) => void;
}) {
  const [n, setN] = useState(0);
  const segs = Math.pow(4, n);
  const perim = Math.pow(4 / 3, n);
  const area = kochSnowArea(n);
  const rows: {
    n: number;
    segs: number;
    segLen: number;
    perim: number;
    area: number;
  }[] = [];
  for (let i = 0; i <= n; i++) {
    rows.push({
      n: i,
      segs: Math.pow(4, i),
      segLen: Math.pow(1 / 3, i),
      perim: Math.pow(4 / 3, i),
      area: kochSnowArea(i),
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">📊 단계별 계산</h3>
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBtn label="코흐 곡선" active={mode === "curve"} onClick={() => setMode("curve")} />
        <ModeBtn label="코흐 눈송이" active={mode === "snow"} onClick={() => setMode("snow")} />
      </div>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-300">단계 n =</label>
        <input
          type="range"
          min={0}
          max={6}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="flex-1 accent-sky-400"
          aria-label="단계 n"
        />
        <span className="min-w-[2rem] rounded-md bg-sky-500/20 px-2 py-0.5 text-center font-bold text-sky-200">
          {n}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-2 py-1.5 text-center">단계</th>
                <th className="px-2 py-1.5 text-right">선분 수</th>
                <th className="px-2 py-1.5 text-right">선분 길이</th>
                <th className="px-2 py-1.5 text-right">총 둘레</th>
                {mode === "snow" ? (
                  <th className="px-2 py-1.5 text-right">눈송이 넓이</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.n}
                  className={
                    "border-b border-white/5 " +
                    (r.n === n ? "bg-sky-500/20" : "bg-slate-900/30")
                  }
                >
                  <td className="px-2 py-1.5 text-center font-bold text-slate-100">{r.n}</td>
                  <td className="px-2 py-1.5 text-right font-bold text-sky-300">
                    {fmt(r.segs)}
                  </td>
                  <td className="px-2 py-1.5 text-right text-slate-300">
                    {r.segLen.toFixed(5)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-bold text-emerald-300">
                    {r.perim.toFixed(5)}
                  </td>
                  {mode === "snow" ? (
                    <td className="px-2 py-1.5 text-right font-bold text-amber-300">
                      {r.area.toFixed(5)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
          <div className="mb-2 text-sm font-bold text-cyan-300">n = {n} 단계</div>
          <div className="space-y-2.5">
            <Big
              label="선분 수"
              value={fmt(segs)}
              expr={`= 4^${n} = ${fmt(segs)}`}
              color="text-sky-300"
            />
            <Big
              label="총 둘레 길이"
              value={perim.toFixed(5)}
              expr={`= (4/3)^${n}`}
              color="text-emerald-300"
              badge={{ text: "발산 → ∞", color: "bg-rose-500/30 text-rose-100" }}
            />
            {mode === "snow" ? (
              <Big
                label="눈송이 넓이"
                value={area.toFixed(5)}
                expr="A₀ + Σ (덧붙인 삼각형)"
                color="text-amber-300"
                badge={{
                  text: "수렴 → (8/5)·A₀",
                  color: "bg-emerald-500/30 text-emerald-100",
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm leading-7 text-slate-200">
        <div className="mb-1 font-bold text-cyan-300">
          n 단계 {mode === "snow" ? "코흐 눈송이" : "코흐 곡선"} 공식
        </div>
        {mode === "snow" ? (
          <>
            한 변 선분 수 = <b className="text-amber-300">4ⁿ</b>
            <br />총 둘레 = <b className="text-emerald-300">(4/3)ⁿ × 3</b> (발산)
            <br />
            넓이 = <b className="text-amber-300">A₀ + Σ 덧붙인 삼각형</b> →
            (8/5)·A₀ 로 수렴
          </>
        ) : (
          <>
            선분 수 = <b className="text-sky-300">4ⁿ</b>
            <br />선분 길이 = <b className="text-amber-300">(1/3)ⁿ</b>
            <br />총 둘레 = <b className="text-emerald-300">(4/3)ⁿ</b> (발산)
          </>
        )}
      </div>
    </div>
  );
}

function ModeBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md px-3 py-1.5 text-xs font-bold transition " +
        (active
          ? "bg-blue-500 text-white"
          : "bg-slate-700 text-slate-300 hover:bg-slate-600")
      }
    >
      {label}
    </button>
  );
}

function KochVisCard({
  mode,
  setMode,
}: {
  mode: KochMode;
  setMode: (m: KochMode) => void;
}) {
  const [n, setN] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  function draw() {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(280, wrap.clientWidth);
    const H = Math.round(W * 0.65);
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = Math.max(1, 2 - n * 0.25);

    if (mode === "snow") {
      const pad = W * 0.1;
      let sideLen = W - 2 * pad;
      let triH = (sideLen * Math.sqrt(3)) / 2;
      const maxSide = ((H * 0.75) / Math.sqrt(3)) * 2;
      if (sideLen > maxSide) {
        sideLen = maxSide;
        triH = (sideLen * Math.sqrt(3)) / 2;
      }
      const cx = W / 2;
      const cyy = H * 0.52;
      const p0 = { x: cx, y: cyy - (triH * 2) / 3 };
      const p1 = { x: cx + sideLen / 2, y: cyy + triH / 3 };
      const p2 = { x: cx - sideLen / 2, y: cyy + triH / 3 };
      const center = {
        x: (p0.x + p1.x + p2.x) / 3,
        y: (p0.y + p1.y + p2.y) / 3,
      };
      const sides: [Pt, Pt][] = [
        [p0, p1],
        [p1, p2],
        [p2, p0],
      ];
      const all: Pt[] = [];
      for (const [a, b] of sides) {
        const turn = kochOutwardSign(a, b, center);
        const seg = kochPoints(a.x, a.y, b.x, b.y, n, turn);
        all.push(...seg.slice(0, -1));
      }
      ctx.beginPath();
      ctx.strokeStyle = "#1e40af";
      ctx.fillStyle = "#dbeafe";
      all.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      const margin = W * 0.07;
      const baseY = H * 0.78;
      const pts = kochPoints(margin, baseY, W - margin, baseY, n, 1);
      ctx.beginPath();
      ctx.strokeStyle = "#3b82f6";
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }
  }

  useEffect(() => {
    draw();
    function onResize() {
      draw();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, mode]);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">🎨 코흐 곡선 시각화</h3>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-sm font-semibold text-slate-300">단계 n =</label>
        <input
          type="range"
          min={0}
          max={6}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="flex-1 accent-sky-400"
          aria-label="단계 n"
        />
        <span className="min-w-[2rem] rounded-md bg-sky-500/20 px-2 py-0.5 text-center font-bold text-sky-200">
          {n}
        </span>
        <ModeBtn label="코흐 곡선" active={mode === "curve"} onClick={() => setMode("curve")} />
        <ModeBtn label="눈송이" active={mode === "snow"} onClick={() => setMode("snow")} />
      </div>
      <div ref={wrapRef} className="w-full">
        <canvas ref={canvasRef} className="block w-full rounded-lg border border-white/10" />
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        {n} 단계 {mode === "snow" ? "코흐 눈송이" : "코흐 곡선"}
      </p>
    </div>
  );
}

const KOCH_QS: MengerQ[] = [
  {
    q: "Q1. 코흐 곡선의 총 둘레 길이를 무한히 반복하면?",
    opts: [
      "1에 수렴한다",
      "무한히 커진다 (발산)",
      "4/3에 수렴한다",
      "0에 수렴한다",
    ],
    correctIdx: 1,
    fb: "(4/3)ⁿ — 비율 4/3 > 1 이므로 발산.",
  },
  {
    q: "Q2. 코흐 눈송이의 넓이를 무한히 반복하면?",
    opts: [
      "어떤 값에 수렴한다",
      "무한히 커진다",
      "0에 수렴한다",
      "3에 수렴한다",
    ],
    correctIdx: 0,
    fb: "둘레는 발산하지만 넓이는 (8/5)·A₀ 로 수렴!",
  },
  {
    q: "Q3. 4단계 코흐 곡선의 선분 개수는?",
    opts: ["16개", "64개", "256개", "1,024개"],
    correctIdx: 2,
    fb: "4⁴ = 256 개.",
  },
];

function KochQuiz() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">🧩 확인 문제</h3>
      <div className="space-y-3">
        {KOCH_QS.map((q, i) => (
          <QuizItem key={i} q={q} />
        ))}
      </div>
    </div>
  );
}

// ─── 탭 3: 칸토어 집합 ──────────────────────────────────────
function CantorTab() {
  return (
    <div className="space-y-4">
      <CantorIntro />
      <CantorCalcCard />
      <CantorVisCard />
      <CantorQuiz />
    </div>
  );
}

function CantorIntro() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-2 text-base font-bold text-white">📏 칸토어 집합이란?</h3>
      <p className="text-sm leading-relaxed text-slate-300">
        [0, 1] 구간을 3등분하고 가운데 열린 구간 (1/3, 2/3) 를 제거합니다. 남은
        두 구간에 같은 과정을 반복합니다. 이를 무한히 반복하면 칸토어 집합이
        됩니다.
      </p>
      <div className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm leading-7 text-slate-200">
        <div className="mb-1 font-bold text-cyan-300">핵심 규칙</div>
        선분 1개 → 2개 (각 길이 1/3)
        <br />n 단계 선분 수: <b className="text-amber-300">2ⁿ</b>
        <br />선분 하나의 길이: <b className="text-amber-300">(1/3)ⁿ</b>
        <br />총 길이: <b className="text-amber-300">(2/3)ⁿ</b>
      </div>
    </div>
  );
}

function CantorCalcCard() {
  const [n, setN] = useState(0);
  const cnt = Math.pow(2, n);
  const segLen = Math.pow(1 / 3, n);
  const total = Math.pow(2 / 3, n);
  const rows: { n: number; cnt: number; segLen: number; total: number }[] = [];
  for (let i = 0; i <= n; i++) {
    rows.push({
      n: i,
      cnt: Math.pow(2, i),
      segLen: Math.pow(1 / 3, i),
      total: Math.pow(2 / 3, i),
    });
  }
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">📊 단계별 계산</h3>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-300">단계 n =</label>
        <input
          type="range"
          min={0}
          max={7}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="flex-1 accent-pink-400"
          aria-label="단계 n"
        />
        <span className="min-w-[2rem] rounded-md bg-pink-500/20 px-2 py-0.5 text-center font-bold text-pink-200">
          {n}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-2 py-1.5 text-center">단계</th>
                <th className="px-2 py-1.5 text-right">선분 수</th>
                <th className="px-2 py-1.5 text-right">선분 길이</th>
                <th className="px-2 py-1.5 text-right">총 길이</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.n}
                  className={
                    "border-b border-white/5 " +
                    (r.n === n ? "bg-pink-500/20" : "bg-slate-900/30")
                  }
                >
                  <td className="px-2 py-1.5 text-center font-bold text-slate-100">{r.n}</td>
                  <td className="px-2 py-1.5 text-right font-bold text-sky-300">
                    {fmt(r.cnt)}
                  </td>
                  <td className="px-2 py-1.5 text-right text-slate-300">
                    {r.segLen.toFixed(5)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-bold text-emerald-300">
                    {r.total.toFixed(5)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl border border-pink-400/30 bg-pink-500/10 p-4">
          <div className="mb-2 text-sm font-bold text-pink-300">n = {n} 단계</div>
          <div className="space-y-2.5">
            <Big
              label="선분 수"
              value={fmt(cnt)}
              expr={`= 2^${n} = ${fmt(cnt)}`}
              color="text-sky-300"
            />
            <Big
              label="선분 하나의 길이"
              value={segLen.toFixed(5)}
              expr={`= (1/3)^${n}`}
              color="text-pink-300"
            />
            <Big
              label="총 길이"
              value={total.toFixed(5)}
              expr={`= (2/3)^${n}`}
              color="text-emerald-300"
              badge={{ text: "수렴 → 0", color: "bg-emerald-500/30 text-emerald-100" }}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm leading-7 text-slate-200">
        <div className="mb-1 font-bold text-cyan-300">n 단계 공식</div>
        선분 수 = <b className="text-sky-300">2ⁿ</b>
        <br />
        선분 길이 = <b className="text-pink-300">(1/3)ⁿ</b>
        <br />
        총 길이 = <b className="text-emerald-300">(2/3)ⁿ</b> → 0 수렴
        <br />
        <span className="text-[11px] text-slate-400">
          길이는 0으로 수렴하지만, 점은 무수히 많이 남는 것이 칸토어 집합의
          역설!
        </span>
      </div>
    </div>
  );
}

function CantorVisCard() {
  const [n, setN] = useState(0);
  const [animating, setAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  function draw() {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(280, wrap.clientWidth);
    const levels = n + 1;
    const rowH = Math.max(18, Math.min(30, 220 / levels));
    const H = rowH * levels + 20;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    function drawLevel(segs: [number, number][], row: number) {
      const y = row * rowH + 10;
      const barH = rowH * 0.5;
      // 제거된 구간 = 어두운 배경
      ctx!.fillStyle = "#1e293b";
      ctx!.fillRect(0, y, W, barH);
      // 남은 구간 = 파랑
      for (const seg of segs) {
        const x1 = seg[0] * W;
        const x2 = seg[1] * W;
        ctx!.fillStyle = "#3b82f6";
        ctx!.fillRect(x1 + 1, y + 1, x2 - x1 - 2, barH - 2);
      }
      ctx!.fillStyle = "#475569";
      ctx!.font = `${Math.min(11, rowH * 0.4)}px sans-serif`;
      ctx!.textAlign = "right";
      ctx!.fillText(`n=${row}`, W - 4, y + barH * 0.7 + 2);
    }

    let segs: [number, number][] = [[0, 1]];
    drawLevel(segs, 0);
    for (let i = 1; i <= n; i++) {
      const next: [number, number][] = [];
      for (const s of segs) {
        const len = (s[1] - s[0]) / 3;
        next.push([s[0], s[0] + len]);
        next.push([s[0] + 2 * len, s[1]]);
      }
      segs = next;
      drawLevel(segs, i);
    }
  }

  useEffect(() => {
    draw();
    function onResize() {
      draw();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useEffect(() => {
    if (!animating) return;
    let k = 0;
    setN(0);
    const t = setInterval(() => {
      k++;
      if (k > 7) {
        clearInterval(t);
        setAnimating(false);
        return;
      }
      setN(k);
    }, 600);
    return () => clearInterval(t);
  }, [animating]);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">🎨 칸토어 집합 시각화</h3>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-sm font-semibold text-slate-300">단계 n =</label>
        <input
          type="range"
          min={0}
          max={7}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          disabled={animating}
          className="flex-1 accent-pink-400 disabled:opacity-50"
          aria-label="단계 n"
        />
        <span className="min-w-[2rem] rounded-md bg-pink-500/20 px-2 py-0.5 text-center font-bold text-pink-200">
          {n}
        </span>
        <button
          type="button"
          onClick={() => setAnimating(true)}
          disabled={animating}
          className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ▶ 애니메이션
        </button>
      </div>
      <div ref={wrapRef} className="w-full">
        <canvas ref={canvasRef} className="block w-full rounded-lg border border-white/10" />
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        각 행이 한 단계씩 — 어두운 부분이 제거되고 파란 선이 남습니다
      </p>
    </div>
  );
}

const CANTOR_QS: MengerQ[] = [
  {
    q: "Q1. 칸토어 집합에서 총 길이 (2/3)ⁿ 은 n → ∞ 일 때?",
    opts: ["0에 수렴한다", "1에 수렴한다", "무한히 커진다", "2/3에 수렴한다"],
    correctIdx: 0,
    fb: "(2/3)ⁿ — 비율 2/3 < 1 이므로 0 으로 수렴.",
  },
  {
    q: "Q2. 칸토어 집합에서 5단계의 선분 수는?",
    opts: ["10개", "32개", "64개", "16개"],
    correctIdx: 1,
    fb: "2⁵ = 32 개.",
  },
  {
    q: "Q3. 칸토어 집합은 총 길이가 0이지만 왜 점이 무수히 많은가?",
    opts: [
      "매 단계 점이 추가되기 때문",
      "점이 유한히 많기 때문",
      "유한 번 제거만 하므로 끝점/경계점이 무한히 남기 때문",
      "구간이 점으로 쪼개지기 때문",
    ],
    correctIdx: 2,
    fb: "끝점/경계점은 절대 제거되지 않기에 무수히 남아 있습니다.",
  },
];

function CantorQuiz() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">🧩 확인 문제</h3>
      <div className="space-y-3">
        {CANTOR_QS.map((q, i) => (
          <QuizItem key={i} q={q} />
        ))}
      </div>
    </div>
  );
}

// ─── 탭 4: 프랙털 차원 ──────────────────────────────────────
type DimKind = "menger" | "koch" | "cantor";

const FRACTAL_DIM_INFO: Record<
  DimKind,
  {
    title: string;
    desc: string;
    k: number;
    N: number;
    d: number;
    dStr: string;
    range: { low: number; lowLbl: string; hi: number; hiLbl: string };
    summary: string;
  }
> = {
  menger: {
    title: "🧊 멩거 스펀지의 차원",
    desc: "3배 키우면 → 20개의 복사본이 생깁니다 (27개 중 7개 제거)",
    k: 3,
    N: 20,
    d: Math.log(20) / Math.log(3),
    dStr: "2.727...",
    range: { low: 2, lowLbl: "일반 넓이", hi: 3, hiLbl: "일반 부피" },
    summary: "2차원과 3차원 사이 — 면보다 복잡하고, 부피는 없다!",
  },
  koch: {
    title: "❄️ 코흐 곡선의 차원",
    desc: "3배 키우면 → 4개의 복사본이 생깁니다",
    k: 3,
    N: 4,
    d: Math.log(4) / Math.log(3),
    dStr: "1.262...",
    range: { low: 1, lowLbl: "일반 선", hi: 2, hiLbl: "일반 넓이" },
    summary: "1차원과 2차원 사이 — 선보다 복잡하고, 넓이는 없다!",
  },
  cantor: {
    title: "📏 칸토어 집합의 차원",
    desc: "3배 키우면 → 2개의 복사본이 생깁니다",
    k: 3,
    N: 2,
    d: Math.log(2) / Math.log(3),
    dStr: "0.630...",
    range: { low: 0, lowLbl: "점", hi: 1, hiLbl: "일반 선" },
    summary: "0차원과 1차원 사이 — 점보다 많고, 선보다 적다!",
  },
};

function DimensionTab() {
  return (
    <div className="space-y-4">
      <DimIntro />
      <NormalShapesCard />
      <FractalDimCard />
      <DimCalculator />
      <DimCompareTable />
    </div>
  );
}

function DimIntro() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-2 text-base font-bold text-white">🔢 자기 닮음 차원이란?</h3>
      <p className="text-sm leading-relaxed text-slate-300">
        일반적인 도형은 크기를 k 배 키우면, 넓이는 k² 배, 부피는 k³ 배가 됩니다.
        <br />
        프랙털에서는 k 배 키울 때 <b className="text-amber-300">N 배</b> 가 된다면,{" "}
        <b className="text-amber-300">kᵈ = N</b> 이 되는 d 를{" "}
        <b className="text-amber-300">프랙털 차원(자기 닮음 차원)</b>이라
        합니다.
      </p>
      <div className="mt-3 rounded-lg border border-violet-400/30 bg-violet-500/10 p-3 text-sm leading-7 text-slate-200">
        <div className="mb-1 font-bold text-violet-300">프랙털 차원 공식</div>
        <div className="text-center text-lg font-extrabold text-amber-300">
          d = log(N) / log(k)
        </div>
        <div className="mt-2 text-xs text-slate-400">
          여기서 N = 축소 복사본의 개수 · k = 각 복사본의 확대 비율 (= 1 / 축소
          비율)
        </div>
      </div>
    </div>
  );
}

function NormalShapesCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">
        📐 일반 도형은 차원이 정수!
      </h3>
      <div className="grid gap-3 md:grid-cols-2">
        <NormalShapeCard
          title="🟥 정사각형"
          desc="2배로 키우면 → 4배 많아짐"
          eq="k=2, N=4"
          formula="d = log 4 / log 2 = 2"
          d="2"
        />
        <NormalShapeCard
          title="🧊 정육면체"
          desc="2배로 키우면 → 8배 많아짐"
          eq="k=2, N=8"
          formula="d = log 8 / log 2 = 3"
          d="3"
        />
      </div>
    </div>
  );
}

function NormalShapeCard({
  title,
  desc,
  eq,
  formula,
  d,
}: {
  title: string;
  desc: string;
  eq: string;
  formula: string;
  d: string;
}) {
  return (
    <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-4 text-center">
      <div className="mb-2 text-base font-bold text-violet-200">{title}</div>
      <div className="mb-2 text-xs text-violet-100">{desc}</div>
      <div className="mb-2 rounded-md bg-slate-900/60 px-3 py-2 text-base font-extrabold text-amber-300">
        {eq}
      </div>
      <div className="text-xs text-violet-100">{formula}</div>
      <div className="mt-1 text-2xl font-extrabold text-emerald-300">d = {d}</div>
    </div>
  );
}

function FractalDimCard() {
  const [kind, setKind] = useState<DimKind>("menger");
  const info = FRACTAL_DIM_INFO[kind];
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">
        📐 프랙털의 차원 계산해보기
      </h3>
      <div className="mb-4 flex flex-wrap gap-2">
        <ModeBtn
          label="🧊 멩거 스펀지"
          active={kind === "menger"}
          onClick={() => setKind("menger")}
        />
        <ModeBtn
          label="❄️ 코흐 곡선"
          active={kind === "koch"}
          onClick={() => setKind("koch")}
        />
        <ModeBtn
          label="📏 칸토어 집합"
          active={kind === "cantor"}
          onClick={() => setKind("cantor")}
        />
      </div>
      <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-5">
        <div className="mb-2 text-center text-base font-bold text-violet-200">
          {info.title}
        </div>
        <p className="mb-3 text-center text-sm text-violet-100">{info.desc}</p>
        <div className="mb-2 rounded-md bg-slate-900/60 px-3 py-2 text-center text-lg font-extrabold text-amber-300">
          k = {info.k}, N = {info.N}
        </div>
        <div className="mb-1 text-center text-sm text-violet-100">
          d = log({info.N}) / log({info.k}) ≈
        </div>
        <div className="mb-3 text-center text-4xl font-extrabold text-violet-300">
          {info.dStr}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <Pil value={String(info.range.low)} lbl={info.range.lowLbl} color="text-emerald-300" />
          <Pil value={info.dStr.replace("...", "")} lbl="프랙털" color="text-violet-300" />
          <Pil value={String(info.range.hi)} lbl={info.range.hiLbl} color="text-rose-300" />
        </div>
        <div className="mt-3 text-center text-xs text-slate-400">{info.summary}</div>
      </div>
    </div>
  );
}

function Pil({ value, lbl, color }: { value: string; lbl: string; color: string }) {
  return (
    <div className="rounded-md bg-slate-900/60 p-2">
      <div className={"text-lg font-extrabold " + color}>{value}</div>
      <div className="text-[10px] text-slate-400">{lbl}</div>
    </div>
  );
}

function DimCalculator() {
  const [k, setK] = useState(3);
  const [N, setN] = useState(20);
  const d = Math.log(N) / Math.log(k);
  // bar position 0~3 영역 중 d 위치
  const barPct = Math.min(100, Math.max(0, (d / 3) * 100));
  let interp = "";
  if (d <= 0.1) interp = "→ 거의 점 (0차원에 가까움)";
  else if (d < 1) interp = "→ 0과 1 사이 — 점보다 많고 선보다 적은 모양";
  else if (d < 2) interp = "→ 1과 2 사이 — 선보다 복잡하고 넓이는 없음";
  else if (d < 3) interp = "→ 2와 3 사이 — 면보다 복잡하고 부피는 없음";
  else interp = "→ 거의 부피 (3차원에 가까움)";
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-2 text-base font-bold text-white">🧮 프랙털 차원 계산기</h3>
      <p className="mb-3 text-xs text-slate-400">
        k 배 크기를 키울 때 N 개의 복사본이 생기는 프랙털의 차원을 계산해보자!
      </p>
      <div className="mb-3 grid gap-3 md:grid-cols-2">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-300 whitespace-nowrap">
            k (확대 배율) =
          </label>
          <input
            type="range"
            min={2}
            max={10}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="flex-1 accent-violet-400"
            aria-label="k 확대 배율"
          />
          <span className="min-w-[2rem] rounded-md bg-violet-500/20 px-2 py-0.5 text-center font-bold text-violet-200">
            {k}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-300 whitespace-nowrap">
            N (복사본 수) =
          </label>
          <input
            type="range"
            min={2}
            max={50}
            value={N}
            onChange={(e) => setN(Number(e.target.value))}
            className="flex-1 accent-violet-400"
            aria-label="N 복사본 수"
          />
          <span className="min-w-[2rem] rounded-md bg-violet-500/20 px-2 py-0.5 text-center font-bold text-violet-200">
            {N}
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm text-slate-400">
          d = log({N}) / log({k}) =
        </div>
        <div className="my-2 text-5xl font-extrabold text-violet-300">
          {d.toFixed(3)}
        </div>
        <div className="text-xs text-slate-500">{interp}</div>
      </div>
      <div className="relative mt-4 h-6 overflow-hidden rounded-full bg-slate-900">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${barPct}%`,
            background: "linear-gradient(90deg, #4ade80, #a78bfa, #f87171)",
          }}
        />
        <div className="pointer-events-none absolute inset-x-1 inset-y-0 flex items-center justify-between text-[10px] text-slate-300">
          <span>0 (점)</span>
          <span>1 (선)</span>
          <span>2 (면)</span>
          <span>3 (부피)</span>
        </div>
      </div>
    </div>
  );
}

function DimCompareTable() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">
        📋 세 프랙털 한눈에 비교
      </h3>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="px-2 py-2 text-left">프랙털</th>
              <th className="px-2 py-2 text-center">축소 비율</th>
              <th className="px-2 py-2 text-center">복사본 N</th>
              <th className="px-2 py-2 text-center">확대 k</th>
              <th className="px-2 py-2 text-center">차원 d</th>
              <th className="px-2 py-2 text-center">측도</th>
            </tr>
          </thead>
          <tbody>
            <CompareRow
              name="📏 칸토어 집합"
              ratio="1/3씩"
              N="2"
              k="3"
              d="≈ 0.630"
              measureBadge="bg-emerald-500/30 text-emerald-100"
              measureLabel="길이 → 0"
            />
            <CompareRow
              name="❄️ 코흐 곡선"
              ratio="1/3씩"
              N="4"
              k="3"
              d="≈ 1.262"
              measureBadge="bg-rose-500/30 text-rose-100"
              measureLabel="둘레 → ∞"
            />
            <CompareRow
              name="🧊 멩거 스펀지"
              ratio="1/3씩"
              N="20"
              k="3"
              d="≈ 2.727"
              measureBadge="bg-rose-500/30 text-rose-100"
              measureLabel="겉넓이 → ∞ / 부피 → 0"
            />
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        세 도형 모두 같은 축소 비율(1/3)을 쓰지만 복사본 수가 다르기에 차원이
        제각각 — 정수가 아닌 차원이 곧 프랙털의 매력!
      </p>
    </div>
  );
}

function CompareRow({
  name,
  ratio,
  N,
  k,
  d,
  measureBadge,
  measureLabel,
}: {
  name: string;
  ratio: string;
  N: string;
  k: string;
  d: string;
  measureBadge: string;
  measureLabel: string;
}) {
  return (
    <tr className="border-b border-white/5 odd:bg-slate-900/20 even:bg-slate-900/40">
      <td className="px-2 py-2 font-bold text-slate-100">{name}</td>
      <td className="px-2 py-2 text-center text-slate-300">{ratio}</td>
      <td className="px-2 py-2 text-center font-bold text-sky-300">{N}</td>
      <td className="px-2 py-2 text-center font-bold text-sky-300">{k}</td>
      <td className="px-2 py-2 text-center font-bold text-amber-300">{d}</td>
      <td className="px-2 py-2 text-center">
        <span
          className={"rounded-full px-2 py-0.5 text-[11px] font-bold " + measureBadge}
        >
          {measureLabel}
        </span>
      </td>
    </tr>
  );
}
