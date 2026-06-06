"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TabKey = "trace" | "stage" | "cloud";
type VertexKey = "L" | "T" | "R";
type Pt = { x: number; y: number };

const W = 620;
const H = 420;
const VL: Pt = { x: 90, y: 360 };
const VT: Pt = { x: 310, y: 42 };
const VR: Pt = { x: 530, y: 360 };
const V: Record<VertexKey, Pt> = { L: VL, T: VT, R: VR };
const VCOLORS: Record<VertexKey, string> = {
  L: "#f59e0b",
  T: "#38bdf8",
  R: "#f43f5e",
};

function midpoint(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function randomPointInTriangle(): Pt {
  let u = Math.random();
  let v = Math.random();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  const w = 1 - u - v;
  return {
    x: u * VL.x + v * VT.x + w * VR.x,
    y: u * VL.y + v * VT.y + w * VR.y,
  };
}

function addressTriangle(seq: VertexKey[]): [Pt, Pt, Pt] {
  let tri: [Pt, Pt, Pt] = [VL, VT, VR];
  for (const ch of seq) {
    const v = V[ch];
    tri = [midpoint(tri[0], v), midpoint(tri[1], v), midpoint(tri[2], v)];
  }
  return tri;
}

function mulberry32(a: number): () => number {
  let s = a;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function ChaosgameAddress() {
  const [tab, setTab] = useState<TabKey>("trace");
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-5 text-center">
        <h2 className="text-2xl font-extrabold text-white">
          🎲 카오스 게임으로 이해하는 시에르핀스키 삼각형
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          L · T · R 주소와 중점 이동 규칙을 따라가며 카오스 게임의 결과가 왜
          시에르핀스키 삼각형이 되는지 탐구합니다.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {(
          [
            { key: "trace", label: "① 주소 추적" },
            { key: "stage", label: "② 단계와 주소" },
            { key: "cloud", label: "③ 무작위 실험" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              "rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition " +
              (tab === t.key
                ? "border-teal-400 bg-teal-600 text-white"
                : "border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-900")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className={tab === "trace" ? "" : "hidden"}>
        <TraceTab />
      </section>
      <section className={tab === "stage" ? "" : "hidden"}>
        <StageTab />
      </section>
      <section className={tab === "cloud" ? "" : "hidden"}>
        <CloudTab />
      </section>
    </div>
  );
}

// ─── 탭 1: 주소 추적 ──────────────────────────────────────────
function TraceTab() {
  const [startPoint, setStartPoint] = useState<Pt>(() => randomPointInTriangle());
  const [seq, setSeq] = useState<VertexKey[]>([]);

  const history = useMemo<Pt[]>(() => {
    const out: Pt[] = [startPoint];
    let cur = startPoint;
    for (const ch of seq) {
      cur = midpoint(cur, V[ch]);
      out.push(cur);
    }
    return out;
  }, [startPoint, seq]);

  const tri = useMemo(() => addressTriangle(seq), [seq]);

  function addStep(ch: VertexKey) {
    setSeq((s) => [...s, ch]);
  }
  function undo() {
    setSeq((s) => s.slice(0, -1));
  }
  function clear() {
    setSeq([]);
  }
  function resetStart() {
    setStartPoint(randomPointInTriangle());
    setSeq([]);
  }
  function preset(s: string) {
    setStartPoint(startPoint);
    setSeq(s.split("") as VertexKey[]);
  }

  const addr = seq.length ? seq.join("") : "없음";
  let msg = "아직 이동하지 않았으므로 점은 큰 삼각형 전체 어디에나 있을 수 있습니다.";
  if (seq.length === 1) {
    msg = `첫 이동이 ${seq[0]} 이면, 새 점은 항상 ${seq[0]} 주소의 절반 삼각형 안에 들어갑니다. 즉 무작위 이동이 아니라 첫 글자가 점의 위치를 즉시 제한합니다.`;
  } else if (seq.length >= 2) {
    msg = `주소 ${addr} 는 길이 ${seq.length} 의 선택 기록입니다. 점은 이제 ${seq.length} 번 연속으로 절반씩 잘린 ${addr} 영역 안에 있어야 합니다. 주소가 길어질수록 가능한 영역이 더 작아지고, 이 중첩이 시에르핀스키 삼각형을 만듭니다.`;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-teal-400/30 bg-teal-500/5 p-5">
        <div className="mb-2 text-base font-bold text-teal-200">
          주소 L, T, R 를 따라가면 점의 위치가 계속 좁혀진다
        </div>
        <p className="text-sm leading-relaxed text-slate-300">
          시작점은 삼각형 내부의 임의의 점입니다. 이후 꼭짓점 쪽으로{" "}
          <b className="text-amber-300">중점 이동</b>을 반복하면, 점은 무작위로
          움직이는 것처럼 보여도 사실은 <b className="text-amber-300">주소</b>가
          정한 작은 삼각형 안으로 계속 들어갑니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
          <DiceBadge label="주사위 1, 2 →" k="L" />
          <DiceBadge label="주사위 3, 4 →" k="T" />
          <DiceBadge label="주사위 5, 6 →" k="R" />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <ToolBtn onClick={resetStart}>새 시작점</ToolBtn>
          <ToolBtn onClick={undo} disabled={seq.length === 0}>
            한 단계 뒤로
          </ToolBtn>
          <ToolBtn onClick={clear} disabled={seq.length === 0}>
            주소 초기화
          </ToolBtn>
          <ToolBtn onClick={() => preset("R")}>예시 R</ToolBtn>
          <ToolBtn onClick={() => preset("LR")}>예시 LR</ToolBtn>
          <ToolBtn onClick={() => preset("TLR")}>예시 TLR</ToolBtn>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <VertexBtn k="L" onClick={() => addStep("L")} />
          <VertexBtn k="T" onClick={() => addStep("T")} />
          <VertexBtn k="R" onClick={() => addStep("R")} />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <TraceSvg history={history} tri={tri} />
          <div className="space-y-3">
            <StatBox label="현재 주소" value={addr} color="text-teal-200" />
            <StatBox label="이동 횟수" value={String(seq.length)} color="text-sky-300" />
            <StatBox
              label="가능 영역"
              value={`${Math.pow(3, seq.length)} 개`}
              color="text-amber-300"
            />
            <div className="rounded-md border border-white/10 bg-slate-900/60 p-3 text-xs leading-relaxed text-slate-300">
              {msg}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiceBadge({ label, k }: { label: string; k: VertexKey }) {
  return (
    <span className="flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/60 px-2 py-1">
      {label}
      <span
        className="rounded-md px-1.5 font-extrabold text-slate-900"
        style={{ background: VCOLORS[k] }}
      >
        {k}
      </span>
    </span>
  );
}

function ToolBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function VertexBtn({ k, onClick }: { k: VertexKey; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:opacity-90"
      style={{ background: VCOLORS[k] }}
    >
      {k} 로 이동
    </button>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-900/60 p-3">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={"text-lg font-extrabold " + color}>{value}</div>
    </div>
  );
}

function TraceSvg({
  history,
  tri,
}: {
  history: Pt[];
  tri: [Pt, Pt, Pt];
}) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-lg border border-white/10 bg-slate-950">
      <polygon
        points={`${VL.x},${VL.y} ${VT.x},${VT.y} ${VR.x},${VR.y}`}
        fill="#111827"
        stroke="#475569"
        strokeWidth={2}
      />
      <polygon
        points={tri.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="rgba(20,184,166,0.28)"
        stroke="#2dd4bf"
        strokeWidth={2.2}
      />
      <line x1={VL.x} y1={VL.y} x2={VT.x} y2={VT.y} stroke="#64748b" strokeWidth={1.4} />
      <line x1={VT.x} y1={VT.y} x2={VR.x} y2={VR.y} stroke="#64748b" strokeWidth={1.4} />
      <line x1={VR.x} y1={VR.y} x2={VL.x} y2={VL.y} stroke="#64748b" strokeWidth={1.4} />
      {history.slice(0, -1).map((p, i) => (
        <line
          key={`l${i}`}
          x1={p.x}
          y1={p.y}
          x2={history[i + 1].x}
          y2={history[i + 1].y}
          stroke="#a3e635"
          strokeWidth={2.2}
          opacity={0.85}
        />
      ))}
      {history.map((p, i) => {
        const isLast = i === history.length - 1;
        const isStart = i === 0;
        return (
          <circle
            key={`d${i}`}
            cx={p.x}
            cy={p.y}
            r={isLast ? 6.2 : 5.3}
            fill={isStart ? "#fde047" : isLast ? "#2563eb" : "#facc15"}
            stroke="#0f172a"
            strokeWidth={1.5}
          />
        );
      })}
      <circle cx={VL.x} cy={VL.y} r={7} fill={VCOLORS.L} />
      <circle cx={VT.x} cy={VT.y} r={7} fill={VCOLORS.T} />
      <circle cx={VR.x} cy={VR.y} r={7} fill={VCOLORS.R} />
      <text x={VL.x - 20} y={VL.y + 6} fontSize={22} fontWeight={800} fill="#f8fafc">
        L
      </text>
      <text x={VT.x - 7} y={VT.y - 16} fontSize={22} fontWeight={800} fill="#f8fafc">
        T
      </text>
      <text x={VR.x + 16} y={VR.y + 6} fontSize={22} fontWeight={800} fill="#f8fafc">
        R
      </text>
    </svg>
  );
}

// ─── 탭 2: 단계와 주소 ────────────────────────────────────────
function StageTab() {
  const [n, setN] = useState(0);
  // 각 삼각형의 꼭짓점 + 주소(L/T/R 누적) — a 가까이가 L, b 가까이가 T, c 가까이가 R.
  const items = useMemo(() => {
    function recurse(
      tri: [Pt, Pt, Pt],
      depth: number,
      addr: string,
    ): { tri: [Pt, Pt, Pt]; addr: string }[] {
      if (depth === n) return [{ tri, addr }];
      const [a, b, c] = tri;
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ac = midpoint(a, c);
      return [
        ...recurse([a, ab, ac], depth + 1, addr + "L"),
        ...recurse([ab, b, bc], depth + 1, addr + "T"),
        ...recurse([ac, bc, c], depth + 1, addr + "R"),
      ];
    }
    return recurse([VL, VT, VR], 0, "");
  }, [n]);

  // 한 변 길이 ~ 440 / 2^n. 폰트는 변의 약 15%.
  const sideApprox = 440 / Math.pow(2, n);
  const labelFontSize = sideApprox * 0.18;
  const showLabel = labelFontSize >= 4 && n > 0;

  const cnt = Math.pow(3, n);
  const sideStr = n === 0 ? "1" : `1/${Math.pow(2, n)}`;
  const areaStr = n === 0 ? "1" : `${Math.pow(3, n)}/${Math.pow(4, n)}`;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-teal-400/30 bg-teal-500/5 p-5">
        <div className="mb-2 text-base font-bold text-teal-200">
          주소 길이가 n 이면 가능한 작은 삼각형은 3ⁿ 개
        </div>
        <p className="text-sm leading-relaxed text-slate-300">
          길이 1 의 주소는 L, T, R 세 개이고, 길이 2 의 주소는 LL, LT, LR, …,
          RR 처럼 9 개가 됩니다. 즉, 단계가 하나 늘 때마다 가능한 주소가 3 배로
          늘어나고, 각 삼각형의 한 변 길이는 1/2 배가 됩니다.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-300">단계 n</span>
          <input
            type="range"
            min={0}
            max={6}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="flex-1 accent-teal-400"
            aria-label="단계 n"
          />
          <span className="min-w-[2rem] rounded-md bg-teal-500/20 px-2 py-0.5 text-center font-bold text-teal-200">
            {n}
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-lg border border-white/10">
          <rect x={0} y={0} width={W} height={H} fill="#0f172a" rx={14} />
          {items.map((item, i) => {
            const cx = (item.tri[0].x + item.tri[1].x + item.tri[2].x) / 3;
            const cy = (item.tri[0].y + item.tri[1].y + item.tri[2].y) / 3;
            return (
              <g key={i}>
                <polygon
                  points={item.tri.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="#b59a46"
                  stroke="#0f172a"
                  strokeWidth={0.8}
                />
                {showLabel ? (
                  <text
                    x={cx}
                    y={cy + labelFontSize * 0.35}
                    fontSize={labelFontSize}
                    fontWeight={700}
                    fill="#1f2937"
                    textAnchor="middle"
                  >
                    {item.addr}
                  </text>
                ) : null}
              </g>
            );
          })}
          <circle cx={VL.x} cy={VL.y} r={5.6} fill={VCOLORS.L} />
          <circle cx={VT.x} cy={VT.y} r={5.6} fill={VCOLORS.T} />
          <circle cx={VR.x} cy={VR.y} r={5.6} fill={VCOLORS.R} />
          <text x={VL.x - 18} y={VL.y + 6} fontSize={19} fontWeight={800} fill="#f8fafc">
            L
          </text>
          <text x={VT.x - 6} y={VT.y - 14} fontSize={19} fontWeight={800} fill="#f8fafc">
            T
          </text>
          <text x={VR.x + 14} y={VR.y + 6} fontSize={19} fontWeight={800} fill="#f8fafc">
            R
          </text>
        </svg>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatBox label="주소 개수" value={cnt.toLocaleString()} color="text-sky-300" />
          <StatBox label="한 변 길이" value={sideStr} color="text-emerald-300" />
          <StatBox label="남는 넓이" value={areaStr} color="text-amber-300" />
        </div>
        <p className="mt-3 rounded-md border border-white/10 bg-slate-900/60 p-3 text-xs leading-relaxed text-slate-300">
          단계 {n} 에서는 길이 {n} 의 주소가 모두 등장합니다. 주소 하나는 작은
          삼각형 하나에 대응하므로 총 {cnt.toLocaleString()} 개의 삼각형이
          남고, 각 삼각형의 한 변 길이는 1/{Math.pow(2, n)} 입니다. 따라서 남는
          넓이는 (3/4)^{n} 입니다.
        </p>
      </div>
    </div>
  );
}

// ─── 탭 3: 무작위 실험 ────────────────────────────────────────
function CloudTab() {
  const [total, setTotal] = useState<number>(1000);
  const [seed, setSeed] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(280, wrap.clientWidth);
    const scale = cssW / W;
    const cssH = Math.round(H * scale);
    cv.width = cssW * dpr;
    cv.height = cssH * dpr;
    cv.style.width = cssW + "px";
    cv.style.height = cssH + "px";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr * scale, dpr * scale);
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(VL.x, VL.y);
    ctx.lineTo(VT.x, VT.y);
    ctx.lineTo(VR.x, VR.y);
    ctx.closePath();
    ctx.stroke();

    const rand = mulberry32(seed);
    let p = randomPointInTriangle();
    const warmup = 20;
    for (let i = 0; i < total + warmup; i++) {
      const r = rand();
      const ch: VertexKey = r < 1 / 3 ? "L" : r < 2 / 3 ? "T" : "R";
      p = midpoint(p, V[ch]);
      if (i >= warmup) {
        ctx.fillStyle =
          ch === "L"
            ? "rgba(245,158,11,0.72)"
            : ch === "T"
              ? "rgba(56,189,248,0.72)"
              : "rgba(244,63,94,0.72)";
        const sz = total >= 5000 ? 1.4 : 2.2;
        ctx.fillRect(p.x, p.y, sz, sz);
      }
    }
    ctx.fillStyle = VCOLORS.L;
    ctx.beginPath();
    ctx.arc(VL.x, VL.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = VCOLORS.T;
    ctx.beginPath();
    ctx.arc(VT.x, VT.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = VCOLORS.R;
    ctx.beginPath();
    ctx.arc(VR.x, VR.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("L", VL.x - 20, VL.y + 8);
    ctx.fillText("T", VT.x - 7, VT.y - 15);
    ctx.fillText("R", VR.x + 15, VR.y + 8);
  }, [total, seed]);

  useEffect(() => {
    draw();
    const wrap = wrapRef.current;
    let ro: ResizeObserver | null = null;
    if (wrap && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => draw());
      ro.observe(wrap);
    }
    function onResize() {
      draw();
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
    };
  }, [draw]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-teal-400/30 bg-teal-500/5 p-5">
        <div className="mb-2 text-base font-bold text-teal-200">
          무작위로 던져도 점들은 시에르핀스키 삼각형 영역으로 끌려든다
        </div>
        <p className="text-sm leading-relaxed text-slate-300">
          아래 실험은 무작위로 L, T, R 를 선택해 중점 이동을 반복한 결과입니다.
          처음에는 흩어져 보이지만, 충분히 반복하면 점들이 특정 주소 삼각형들
          안에만 남게 됩니다.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {[200, 1000, 5000, 15000].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTotal(t)}
              className={
                "rounded-md px-3 py-1.5 text-xs font-bold transition " +
                (total === t
                  ? "bg-teal-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600")
              }
            >
              {t.toLocaleString()} 개
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-amber-400"
          >
            🎲 다시 생성
          </button>
        </div>
        <div ref={wrapRef} className="w-full">
          <canvas ref={canvasRef} className="block w-full rounded-lg border border-white/10" />
        </div>
        <div className="mt-3 rounded-md border border-amber-400/30 bg-amber-500/10 p-3 text-sm leading-relaxed text-amber-100">
          <b className="text-amber-300">핵심 해석</b>:{" "}
          {total.toLocaleString()} 개의 점을 찍어도 가운데 큰 역삼각형과 그 안의
          작은 빈틈들은 계속 비어 있습니다. 이는 각 점이 매번 L, T, R 중 한 주소
          삼각형으로 절반씩 들어가며, 결코 제거된 중앙 구멍 영역으로는 들어가지
          못하기 때문입니다.
        </div>
      </div>
    </div>
  );
}
