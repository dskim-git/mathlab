"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CELL,
  GRID,
  LIMITS,
  MODE_META,
  MODE_ORDER,
  ORIENT_META,
  PRESETS,
  SNAP,
  START_CELL,
  cellList,
  clampCtrl,
  ctrlPoints,
  neededOrient,
  orientPoly,
  polyArea,
  sameShape,
  tilePoly,
  turn,
  unitPoly,
  type Ctrl,
  type Mode,
  type Orient,
  type Pt,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "area_same",
    prompt:
      "직사각형의 변을 이리저리 변형해 조각을 만들었는데도 넓이는 늘 그대로였어요. 왜 그런지 ‘잘라내기’와 ‘붙이기’라는 말을 써서 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 한쪽에서 잘라낸 조각을 버리지 않고 반대쪽에 그대로 옮겨 붙였기 때문이다. 이동은 도형의 모양과 크기를 바꾸지 않으므로 잘라낸 넓이와 붙인 넓이가 정확히 같아서 전체 넓이는 처음 직사각형과 같다.",
  },
  {
    id: "which_move",
    prompt:
      "탭②에서 조각을 직접 옮기고 뒤집어 붙여 보았어요. 어떤 칸에 어떤 이동이 필요했는지, 그리고 왜 그 이동이어야 딱 맞물리는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 점대칭 방식에서는 옆 칸으로 갈 때마다 180° 회전이 필요했다. 각 변을 그 변의 한가운데를 중심으로 180° 돌린 모양으로 만들었기 때문에, 조각을 180° 회전시켜야 맞닿는 변의 모양이 정확히 겹쳐 빈틈이 생기지 않는다.",
  },
  {
    id: "around_us",
    prompt:
      "이 단원에서 배운 도형의 이동이 테셀레이션에 어떻게 쓰였는지 정리하고, 주변에서 본 쪽매 맞춤 무늬(보도블록·타일·포장지 등)를 하나 떠올려 어떤 이동이 쓰였을지 추측해 보세요.",
    kind: "text",
    placeholder:
      "예: 조각을 만들 때도, 평면을 채울 때도 평행이동·대칭이동을 썼다. 학교 앞 보도블록은 같은 모양이 좌우로 밀려 있고 한 줄 건너 뒤집혀 있어서 평행이동과 미끄럼반사를 쓴 것 같다.",
  },
];

// ─── 직사각형 좌표계 ──────────────────────────────────────────
const PAD = 22;
const SPAN = 380;
const VB = SPAN + PAD * 2;

type RectView = { u: number; sx: (v: number) => number; sy: (v: number) => number; ix: (px: number) => number; iy: (py: number) => number };

function makeRect(x0: number, x1: number, y0: number, y1: number): RectView {
  const u = Math.min(SPAN / (x1 - x0), SPAN / (y1 - y0));
  const w = (x1 - x0) * u;
  const h = (y1 - y0) * u;
  const ox = PAD + (SPAN - w) / 2;
  const oy = PAD + (SPAN + h) / 2;
  return {
    u,
    sx: (v) => ox + (v - x0) * u,
    sy: (v) => oy - (v - y0) * u,
    ix: (px) => (px - ox) / u + x0,
    iy: (py) => (oy - py) / u + y0,
  };
}

function Board({ cid, svgRef, label, children }: { cid: string; svgRef?: React.Ref<SVGSVGElement>; label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg ref={svgRef} viewBox={`0 0 ${VB} ${VB}`} className="mx-auto block w-full max-w-[460px] touch-none select-none" role="img" aria-label={label}>
        <defs>
          <clipPath id={cid}>
            <rect x={2} y={2} width={VB - 4} height={VB - 4} />
          </clipPath>
        </defs>
        {children}
      </svg>
    </div>
  );
}

function Poly({ view, pts, fill, stroke, width = 2.5, dash, opacity = 1 }: { view: RectView; pts: Pt[]; fill: string; stroke: string; width?: number; dash?: string; opacity?: number }) {
  return (
    <polygon
      points={pts.map((p) => `${view.sx(p.x).toFixed(1)},${view.sy(p.y).toFixed(1)}`).join(" ")}
      fill={fill}
      stroke={stroke}
      strokeWidth={width}
      strokeDasharray={dash}
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
}

function Dot({ view, p, color, onDown, r = 7, hollow }: { view: RectView; p: Pt; color: string; onDown?: () => void; r?: number; hollow?: boolean }) {
  return (
    <g
      className={onDown ? "cursor-grab touch-none" : undefined}
      onPointerDown={
        onDown
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              onDown();
            }
          : undefined
      }
    >
      {onDown ? <circle cx={view.sx(p.x)} cy={view.sy(p.y)} r={18} fill="transparent" /> : null}
      <circle cx={view.sx(p.x)} cy={view.sy(p.y)} r={r} fill={hollow ? "#0f172a" : color} stroke={color} strokeWidth={hollow ? 2.5 : 2} />
    </g>
  );
}

/** 자세별 색 — 무늬 안에서 어떤 이동을 썼는지 한눈에 보인다 */
const O_COLOR: Record<Orient, string> = { 0: "#38bdf8", 1: "#a78bfa", 2: "#34d399", 3: "#fbbf24" };
const O_FILL: Record<Orient, string> = {
  0: "rgba(56,189,248,0.30)",
  1: "rgba(167,139,250,0.30)",
  2: "rgba(52,211,153,0.30)",
  3: "rgba(251,191,36,0.30)",
};

function moveName(mode: Mode, o: Orient): string {
  if (o === 0) return "평행이동";
  if (o === 1) return "180° 회전";
  if (o === 2) return mode === "glide" ? "미끄럼반사" : "선대칭";
  return "위아래 뒤집기";
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "make" | "fill";

export default function TessellationLab() {
  const [tab, setTab] = useState<Tab>("make");
  const [mode, setMode] = useState<Mode>("trans");
  const [ctrl, setCtrl] = useState<Ctrl>(PRESETS[0].c);

  function pickMode(m: Mode) {
    setMode(m);
    setCtrl((c) => clampCtrl(m, c));
  }
  function pickCtrl(c: Ctrl) {
    setCtrl(clampCtrl(mode, c));
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🧩 테셀레이션 (쪽매 맞춤)</h3>
        <p className="mt-2 leading-7 text-slate-300">
          같은 모양을 <b className="text-emerald-200">겹치지도, 틈이 생기지도 않게</b> 이어 붙여 평면을 가득 채우는 것. 배운 <b className="text-sky-200">도형의 이동</b>만으로 만들 수 있어요!
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "make"} onClick={() => setTab("make")}>
          ① 쪽매 조각 만들기 ✂️
        </TabButton>
        <TabButton active={tab === "fill"} onClick={() => setTab("fill")}>
          ② 옮기고 뒤집어 붙이기 🧱
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "make" ? <MakeTab mode={mode} ctrl={ctrl} onMode={pickMode} onCtrl={pickCtrl} onNext={() => setTab("fill")} /> : null}
        {tab === "fill" ? <FillTab mode={mode} ctrl={ctrl} onBack={() => setTab("make")} /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-4 py-2 text-sm font-bold transition " +
        (active ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

function ModePicker({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-4">
      {MODE_ORDER.map((m) => {
        const meta = MODE_META[m];
        const on = m === mode;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onMode(m)}
            className={"rounded-xl border-2 px-2 py-2 text-center transition " + (on ? "" : "border-white/10 bg-white/5 hover:bg-white/10")}
            style={on ? { borderColor: `${meta.color}aa`, background: `${meta.color}22` } : undefined}
          >
            <span className="block text-lg">{meta.emoji}</span>
            <span className={"text-[11px] font-bold " + (on ? "text-white" : "text-slate-300")}>{meta.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 쪽매 조각 만들기
// ══════════════════════════════════════════════════════════════
function MakeTab({ mode, ctrl, onMode, onCtrl, onNext }: { mode: Mode; ctrl: Ctrl; onMode: (m: Mode) => void; onCtrl: (c: Ctrl) => void; onNext: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<"b" | "l" | null>(null);
  const { W, H } = CELL;
  const meta = MODE_META[mode];
  const view = makeRect(-2, W + 2, -2, H + 2);

  const vRef = useRef(view);
  const cRef = useRef(ctrl);
  const oRef = useRef(onCtrl);
  useEffect(() => {
    vRef.current = view;
    cRef.current = ctrl;
    oRef.current = onCtrl;
  });

  useEffect(() => {
    if (!drag) return;
    function move(e: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const v = vRef.current;
      const x = v.ix((e.clientX - rect.left) * (VB / rect.width));
      const y = v.iy((e.clientY - rect.top) * (VB / rect.height));
      const c = cRef.current;
      oRef.current(drag === "b" ? { ...c, bx: x, by: y } : { ...c, lx: x, ly: y });
    }
    function up() {
      setDrag(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag]);

  const poly = unitPoly(mode, ctrl);
  const cps = ctrlPoints(mode, ctrl);
  const area = polyArea(poly);
  const L = LIMITS[mode];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">✂️ 어떤 이동으로 잘라 붙일까요?</p>
        <div className="mt-2">
          <ModePicker mode={mode} onMode={onMode} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-xs leading-6 text-slate-300">
          <b style={{ color: meta.color }}>
            {meta.emoji} {meta.name}
          </b>{" "}
          — {meta.how}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          <Board cid="make-board" svgRef={svgRef} label="쪽매 조각 만들기">
            <g clipPath="url(#make-board)">
              <rect
                x={view.sx(0)}
                y={view.sy(H)}
                width={W * view.u}
                height={H * view.u}
                fill="rgba(148,163,184,0.06)"
                stroke="rgba(148,163,184,0.55)"
                strokeWidth={2}
                strokeDasharray="6 5"
              />
              <Poly view={view} pts={poly} fill={`${meta.color}38`} stroke={meta.color} width={3} />
              {cps.derived.map((p, i) => (
                <Dot key={i} view={view} p={p} color="#94a3b8" r={5} hollow />
              ))}
              {cps.drag.map((d) => (
                <Dot key={d.id} view={view} p={d.p} color="#fbbf24" r={8} onDown={() => setDrag(d.id)} />
              ))}
              <text x={view.sx(W / 2)} y={view.sy(H) - 8} textAnchor="middle" className="fill-slate-500 text-[10px] font-bold">
                가로 {W} · 세로 {H} 인 칸
              </text>
            </g>
          </Board>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 노란 점을 끌어 모양을 바꿔 보세요 (회색 빈 점은 저절로 따라와요)</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 px-4 py-3 text-center">
            <p className="text-[11px] font-bold text-slate-300">잘라낸 만큼 붙였으니 넓이는 그대로!</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-emerald-100">
              {W} × {H} = {W * H}
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-emerald-200">조각의 넓이 = {area.toFixed(2)}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-[11px] font-bold text-slate-400">🎨 미리 만들어 둔 모양</p>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onCtrl(p.c)}
                  className="rounded-xl border-2 border-white/10 bg-white/5 px-1 py-2 text-center transition hover:bg-white/10"
                >
                  <span className="block text-lg">{p.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-300">{p.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Slider label="아래 변 ↔" value={ctrl.bx} min={L.bx[0]} max={L.bx[1]} onChange={(v) => onCtrl({ ...ctrl, bx: v })} accent="accent-amber-400" />
              <Slider label="아래 변 ↕" value={ctrl.by} min={L.by[0]} max={L.by[1]} onChange={(v) => onCtrl({ ...ctrl, by: v })} accent="accent-amber-400" />
              {meta.usesLeft ? (
                <>
                  <Slider label="왼쪽 변 ↔" value={ctrl.lx} min={L.lx[0]} max={L.lx[1]} onChange={(v) => onCtrl({ ...ctrl, lx: v })} accent="accent-sky-400" />
                  <Slider label="왼쪽 변 ↕" value={ctrl.ly} min={L.ly[0]} max={L.ly[1]} onChange={(v) => onCtrl({ ...ctrl, ly: v })} accent="accent-sky-400" />
                </>
              ) : (
                <p className="text-[11px] leading-5 text-slate-500 sm:col-span-2">이 방식에서는 옆 변을 곧게 두어야 이웃과 맞물려요.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-[11px] font-bold text-slate-400">이 조각을 붙일 때 쓰는 이동</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {meta.moves.map((mv) => (
                <span key={mv} className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: `${meta.color}33`, border: `1px solid ${meta.color}77` }}>
                  {mv}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={onNext}
              className="mt-3 w-full rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
            >
              이 조각으로 평면 채우러 가기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, onChange, accent }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; accent: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400">{label}</span>
        <span className="font-mono text-xs font-bold text-slate-100">{value < 0 ? `−${Math.abs(value)}` : value}</span>
      </div>
      <input type="range" min={min} max={max} step={SNAP} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} className={"mt-1 h-1.5 w-full " + accent} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 옮기고 뒤집어 붙이기
// ══════════════════════════════════════════════════════════════
type Piece = { i: number; j: number; o: Orient };

function FillTab({ mode, ctrl, onBack }: { mode: Mode; ctrl: Ctrl; onBack: () => void }) {
  const { W, H } = CELL;
  const cells = cellList();
  const [placed, setPlaced] = useState<Piece[]>([{ i: START_CELL.i, j: START_CELL.j, o: neededOrient(mode, START_CELL.i, START_CELL.j) }]);
  const [hand, setHand] = useState<Piece>({ i: Math.min(1, GRID.cols - 1), j: 0, o: 0 });
  const [tries, setTries] = useState(0);
  const [shake, setShake] = useState(false);
  const [hint, setHint] = useState(false);
  const [clean, setClean] = useState(false);

  const view = makeRect(-1.5, GRID.cols * W + 1.5, -1.5, GRID.rows * H + 1.5);
  const isFilled = (i: number, j: number) => placed.some((p) => p.i === i && p.j === j);
  const done = placed.length === cells.length;

  const handPoly = orientPoly(mode, ctrl, hand.i, hand.j, hand.o);
  const cellTaken = isFilled(hand.i, hand.j);
  const fits = !cellTaken && sameShape(handPoly, tilePoly(mode, ctrl, hand.i, hand.j));

  function step(di: number, dj: number) {
    setHand((h) => ({ ...h, i: Math.max(0, Math.min(GRID.cols - 1, h.i + di)), j: Math.max(0, Math.min(GRID.rows - 1, h.j + dj)) }));
    setShake(false);
  }
  function act(a: "rot" | "flipH" | "flipV") {
    setHand((h) => ({ ...h, o: turn(h.o, a) }));
    setShake(false);
  }
  function drop() {
    if (!fits) {
      setTries((t) => t + 1);
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }
    setPlaced((p) => [...p, { ...hand }]);
    setShake(false);
  }
  function reset() {
    setPlaced([{ i: START_CELL.i, j: START_CELL.j, o: neededOrient(mode, START_CELL.i, START_CELL.j) }]);
    setHand({ i: Math.min(1, GRID.cols - 1), j: 0, o: 0 });
    setTries(0);
  }
  function fillAll() {
    setPlaced(cells.map((c) => ({ i: c.i, j: c.j, o: neededOrient(mode, c.i, c.j) })));
  }

  const usedO = new Set(placed.map((p) => p.o));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">
            🧱 조각을 <b className="text-amber-200">옮기고 · 돌리고 · 뒤집어</b> 빈 칸에 딱 맞춰 붙이세요
          </p>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300">
            {placed.length} / {cells.length} 칸
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={"rounded-2xl border p-3 transition " + (done ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04]")}>
          <Board cid="fill-board" label="평면 채우기">
            <g clipPath="url(#fill-board)">
              {/* 칸 안내선 */}
              {!clean
                ? cells.map((c) => (
                    <rect
                      key={`g${c.i},${c.j}`}
                      x={view.sx(c.i * W)}
                      y={view.sy((c.j + 1) * H)}
                      width={W * view.u}
                      height={H * view.u}
                      fill={isFilled(c.i, c.j) ? "transparent" : "rgba(255,255,255,0.03)"}
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth={1}
                      className={done ? undefined : "cursor-pointer"}
                      onPointerDown={
                        done
                          ? undefined
                          : (e) => {
                              e.preventDefault();
                              setHand((h) => ({ ...h, i: c.i, j: c.j }));
                              setShake(false);
                            }
                      }
                    />
                  ))
                : null}
              {/* 놓인 조각 */}
              {placed.map((p) => (
                <Poly key={`p${p.i},${p.j}`} view={view} pts={orientPoly(mode, ctrl, p.i, p.j, p.o)} fill={O_FILL[p.o]} stroke={O_COLOR[p.o]} width={2} />
              ))}
              {/* 손에 든 조각 */}
              {!done ? (
                <g
                  className="cursor-pointer"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    drop();
                  }}
                >
                  <Poly
                    view={view}
                    pts={handPoly}
                    fill={fits ? "rgba(52,211,153,0.35)" : cellTaken ? "rgba(148,163,184,0.20)" : "rgba(248,113,113,0.28)"}
                    stroke={fits ? "#34d399" : cellTaken ? "#94a3b8" : "#f87171"}
                    width={shake ? 5 : 3.5}
                    dash={fits ? undefined : "7 5"}
                  />
                </g>
              ) : null}
            </g>
          </Board>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold">
            {([0, 1, 2, 3] as Orient[])
              .filter((o) => usedO.has(o))
              .map((o) => (
                <span key={o} className="rounded-full px-2.5 py-1" style={{ background: `${O_COLOR[o]}22`, color: O_COLOR[o] }}>
                  ■ {moveName(mode, o)}
                </span>
              ))}
          </div>
        </div>

        <div className="space-y-3">
          <div
            className={
              "rounded-2xl border-2 px-4 py-3 text-center transition " +
              (done ? "border-emerald-400/60 bg-emerald-400/15" : fits ? "border-emerald-400/55 bg-emerald-400/12" : cellTaken ? "border-white/10 bg-white/5" : "border-rose-400/55 bg-rose-400/12")
            }
          >
            {done ? (
              <>
                <p className="text-base font-extrabold text-emerald-100">🎉 평면을 가득 채웠어요!</p>
                <p className="mt-1 text-[11px] leading-5 text-emerald-200/90">
                  겹친 곳도, 틈도 하나 없죠? 조각 {cells.length}개 × 넓이 {W * H} = {cells.length * W * H}
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-bold text-slate-300">
                  손에 든 조각 — {hand.i + 1}열 {hand.j + 1}행 · {ORIENT_META[hand.o].icon} {ORIENT_META[hand.o].label}
                </p>
                <p className={"mt-1 text-base font-extrabold " + (fits ? "text-emerald-100" : cellTaken ? "text-slate-400" : "text-rose-100")}>
                  {fits ? "✅ 딱 맞아요 — 붙일 수 있어요!" : cellTaken ? "이 칸엔 이미 조각이 있어요" : "❌ 맞물리지 않아요 (틈이 생겨요)"}
                </p>
              </>
            )}
          </div>

          {!done ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
              <p className="text-[11px] font-bold text-slate-400">🔧 조각에 이동 주기</p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                <MoveBtn icon="←" label="왼쪽" onClick={() => step(-1, 0)} tone="#38bdf8" />
                <MoveBtn icon="→" label="오른쪽" onClick={() => step(1, 0)} tone="#38bdf8" />
                <MoveBtn icon="↑" label="위" onClick={() => step(0, 1)} tone="#38bdf8" />
                <MoveBtn icon="↓" label="아래" onClick={() => step(0, -1)} tone="#38bdf8" />
              </div>
              <p className="mt-2 text-[10px] font-bold text-slate-500">↑ 평행이동 (한 칸씩)</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <MoveBtn icon="🔄" label="180° 회전" onClick={() => act("rot")} tone="#a78bfa" />
                <MoveBtn icon="↔️" label="좌우 뒤집기" onClick={() => act("flipH")} tone="#34d399" />
                <MoveBtn icon="↕️" label="위아래 뒤집기" onClick={() => act("flipV")} tone="#fbbf24" />
              </div>
              <button
                type="button"
                onClick={drop}
                className={
                  "mt-3 w-full rounded-xl border-2 px-3 py-2.5 text-sm font-extrabold transition " +
                  (fits
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/30"
                    : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
                }
              >
                📌 여기에 붙이기
              </button>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setHint((v) => !v)}
                  className="flex-1 rounded-xl border border-amber-400/45 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
                >
                  💡 힌트
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                >
                  ↺ 지우기
                </button>
                <button
                  type="button"
                  onClick={fillAll}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                >
                  ⚡ 한 번에
                </button>
              </div>
              {hint ? (
                <p className="mt-2 rounded-lg bg-amber-400/12 px-3 py-2 text-[11px] leading-5 text-amber-100">
                  이 칸에 필요한 자세는 <b>{ORIENT_META[neededOrient(mode, hand.i, hand.j)].icon} {ORIENT_META[neededOrient(mode, hand.i, hand.j)].label}</b> 예요.
                  {mode === "glide" && neededOrient(mode, hand.i, hand.j) === 2 ? " 좌우로 뒤집고 위로 옮겼으니 미끄럼반사랍니다!" : ""}
                </p>
              ) : null}
              {tries > 0 ? <p className="mt-1.5 text-center text-[10px] text-slate-500">맞지 않아 되돌린 횟수 {tries}</p> : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
              <button
                type="button"
                onClick={() => setClean((v) => !v)}
                className="w-full rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-3 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
              >
                {clean ? "칸 선 보이기" : "🖼️ 칸 선 지우고 무늬만 보기"}
              </button>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                >
                  ↺ 다시 하기
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                >
                  ← 조각 바꾸기
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-sm font-bold text-slate-100">🗂️ 네 가지 방식 비교</p>
            <div className="mt-2 space-y-1">
              {MODE_ORDER.map((m) => {
                const mm = MODE_META[m];
                const on = m === mode;
                return (
                  <div
                    key={m}
                    className={"flex items-center gap-2 rounded-xl px-3 py-2 transition " + (on ? "" : "bg-black/25")}
                    style={on ? { background: `${mm.color}1f`, border: `1px solid ${mm.color}66` } : undefined}
                  >
                    <span className="text-base">{mm.emoji}</span>
                    <span className={"w-24 shrink-0 text-[11px] font-bold " + (on ? "text-white" : "text-slate-300")}>{mm.name}</span>
                    <span className="flex flex-wrap gap-1">
                      {mm.moves.map((mv) => (
                        <span key={mv} className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${mm.color}22`, color: mm.color }}>
                          {mv}
                        </span>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[11px] leading-6 text-slate-300">
              같은 조각이라도 <b className="text-white">어떤 이동으로 붙이느냐</b>에 따라 무늬가 달라져요!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoveBtn({ icon, label, onClick, tone }: { icon: string; label: string; onClick: () => void; tone: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border-2 px-1 py-2 text-center transition hover:brightness-125"
      style={{ borderColor: `${tone}66`, background: `${tone}14` }}
    >
      <span className="block text-base">{icon}</span>
      <span className="text-[10px] font-bold text-slate-200">{label}</span>
    </button>
  );
}
