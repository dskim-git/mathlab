"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─────────────────────────────────────────────────────────────
//  상수 · 수학 유틸
// ─────────────────────────────────────────────────────────────
const CW = 520;
const CH = 500;
const PAD_TOP = 36;
const PAD_SIDE = 28;
const BUCKET_AREA_H = 110;

type SpeedKey = "slow" | "normal" | "fast";
const STEP: Record<SpeedKey, number> = { slow: 0.022, normal: 0.05, fast: 0.11 };
const AUTO_INTERVAL: Record<SpeedKey, number> = { slow: 700, normal: 300, fast: 120 };

function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}
function binomProb(n: number, k: number, p: number): number {
  return comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

// ── 레이아웃 ──
type Nail = { r: number; c: number; x: number; y: number };
type Layout = {
  W: number; H: number; rowH: number; nails: Nail[];
  bucketTop: number; bucketW: number; bucketMaxH: number;
};

function getLayout(rows: number): Layout {
  const W = CW, H = CH;
  const boardH = H - PAD_TOP - BUCKET_AREA_H;
  const rowH = boardH / (rows + 0.5);
  const nails: Nail[] = [];
  for (let r = 0; r <= rows; r++) {
    const cnt = r + 1;
    const rowY = PAD_TOP + r * rowH;
    const span = W - PAD_SIDE * 2;
    const gap = cnt > 1 ? span / (cnt - 1) : 0;
    const startX = cnt === 1 ? W / 2 : PAD_SIDE;
    for (let c = 0; c <= r; c++) nails.push({ r, c, x: startX + c * gap, y: rowY });
  }
  const bucketTop = PAD_TOP + (rows + 0.5) * rowH;
  const bucketW = (W - PAD_SIDE * 2) / (rows + 1);
  const bucketMaxH = H - bucketTop - 8;
  return { W, H, rowH, nails, bucketTop, bucketW, bucketMaxH };
}
function nailAt(layout: Layout, r: number, c: number): Nail {
  return layout.nails.find((n) => n.r === r && n.c === c)!;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

// ── 구슬 ──
class Ball {
  col = 0;
  pathIdx = 0;
  phase: "fall" | "done" = "fall";
  t = 0;
  x = 0;
  y = 0;
  fromX = 0; fromY = 0; toX = 0; toY = 0;
  path: ("L" | "R")[];
  finalCol: number;
  color: string;

  constructor(layout: Layout, rows: number, p: number) {
    this.path = Array.from({ length: rows }, () => (Math.random() < p ? "R" : "L"));
    this.finalCol = this.path.filter((d) => d === "R").length;
    this.color = `hsl(${35 + Math.random() * 30},95%,${55 + Math.random() * 15}%)`;
    this._setNextTarget(layout, rows);
  }

  _setNextTarget(layout: Layout, rows: number) {
    if (this.pathIdx === 0) {
      this.fromX = layout.W / 2;
      this.fromY = PAD_TOP - 18;
      const n = nailAt(layout, 0, 0);
      this.toX = n.x; this.toY = n.y;
    } else if (this.pathIdx <= rows) {
      const dir = this.path[this.pathIdx - 1];
      const fromCol = this.col - (dir === "R" ? 1 : 0);
      const pn = nailAt(layout, this.pathIdx - 1, fromCol);
      this.fromX = pn.x; this.fromY = pn.y;
      if (this.pathIdx === rows) {
        this.toX = PAD_SIDE + this.finalCol * layout.bucketW + layout.bucketW / 2;
        this.toY = layout.bucketTop + 14;
      } else {
        const nn = nailAt(layout, this.pathIdx, this.col);
        this.toX = nn.x; this.toY = nn.y;
      }
    }
    this.t = 0;
  }

  // 반환: 버킷에 도착했으면 그 칸 번호, 아니면 null
  update(layout: Layout, rows: number, speed: SpeedKey): number | null {
    if (this.phase === "done") return null;
    this.t = Math.min(1, this.t + (STEP[speed] ?? 0.05));
    const et = easeInOut(this.t);
    this.x = this.fromX + (this.toX - this.fromX) * et;
    this.y = this.fromY + (this.toY - this.fromY) * et + Math.sin(Math.PI * this.t) * 5;
    if (this.t >= 1) {
      this.x = this.toX; this.y = this.toY;
      this.pathIdx++;
      if (this.pathIdx > rows) {
        this.phase = "done";
        return this.finalCol;
      }
      const dir = this.path[this.pathIdx - 1];
      if (dir === "R") this.col++;
      this._setNextTarget(layout, rows);
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.phase === "done") return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ── 보드 그리기 ──
function drawBoard(ctx: CanvasRenderingContext2D, layout: Layout, rows: number, p: number, buckets: number[], balls: Ball[]) {
  const { W, H, nails, bucketTop, bucketW, bucketMaxH } = layout;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0f172a");
  bg.addColorStop(1, "#1e293b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 버킷
  const maxBucket = Math.max(1, ...buckets);
  for (let i = 0; i <= rows; i++) {
    const bx = PAD_SIDE + i * bucketW;
    const bh = (buckets[i] / maxBucket) * bucketMaxH;
    const thH = binomProb(rows, i, p) * bucketMaxH * (rows + 1);

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 1, bucketTop, bucketW - 2, bucketMaxH);

    const thBarH = Math.min(thH, bucketMaxH);
    ctx.fillStyle = "rgba(34,211,238,0.28)"; // 이론(cyan)
    ctx.fillRect(bx + 2, bucketTop + bucketMaxH - thBarH, bucketW - 4, thBarH);

    if (bh > 0) {
      const grad = ctx.createLinearGradient(0, bucketTop + bucketMaxH - bh, 0, bucketTop + bucketMaxH);
      grad.addColorStop(0, "#fcd34d");
      grad.addColorStop(1, "#d97706");
      ctx.fillStyle = grad; // 경험(amber)
      ctx.fillRect(bx + 2, bucketTop + bucketMaxH - bh, bucketW - 4, bh);
    }

    ctx.fillStyle = "#64748b";
    ctx.font = `${Math.max(9, 11 - rows * 0.3)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(String(i), bx + bucketW / 2, bucketTop + bucketMaxH + 13);

    if (buckets[i] > 0) {
      ctx.fillStyle = "#fbbf24";
      ctx.font = `bold ${Math.max(8, 10 - rows * 0.3)}px system-ui, sans-serif`;
      ctx.fillText(String(buckets[i]), bx + bucketW / 2, bucketTop + bucketMaxH - bh - 3);
    }
  }

  // 파스칼 연결선
  ctx.strokeStyle = "rgba(100,116,139,0.35)";
  ctx.lineWidth = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= r; c++) {
      const curr = nailAt(layout, r, c);
      const left = nailAt(layout, r + 1, c);
      const right = nailAt(layout, r + 1, c + 1);
      if (left) { ctx.beginPath(); ctx.moveTo(curr.x, curr.y); ctx.lineTo(left.x, left.y); ctx.stroke(); }
      if (right) { ctx.beginPath(); ctx.moveTo(curr.x, curr.y); ctx.lineTo(right.x, right.y); ctx.stroke(); }
    }
  }

  // 못
  const nailR = Math.max(3.5, 5.5 - rows * 0.15);
  for (const nail of nails) {
    ctx.beginPath();
    ctx.arc(nail.x, nail.y, nailR, 0, Math.PI * 2);
    ctx.fillStyle = "#cbd5e1";
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.stroke();
    if (rows <= 8) {
      ctx.fillStyle = "rgba(148,163,184,0.7)";
      ctx.font = `${Math.max(7, 9 - rows * 0.3)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(String(comb(nail.r, nail.c)), nail.x, nail.y - nailR - 3);
    }
  }

  // 구슬
  for (const ball of balls) ball.draw(ctx);

  // 입구 화살표
  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("▼", W / 2, PAD_TOP - 20);
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "center_peak",
    prompt:
      "p=0.5일 때 구슬이 가운데 칸에 가장 많이 쌓이는 이유를, 이항분포 B(n, p)의 기댓값 np 관점에서 설명해 보세요.",
    kind: "text",
  },
  {
    id: "p_shift",
    prompt:
      "p를 0.3이나 0.7로 바꾸면 분포의 봉우리가 어느 쪽으로 이동하나요? 그 이유를 적어 보세요.",
    kind: "text",
  },
  {
    id: "n_normal",
    prompt:
      "줄 수 n을 늘릴수록 분포 모양이 어떻게 변하는지 관찰하고, 그것이 무엇을 의미하는지(정규분포 근사) 설명해 보세요.",
    kind: "text",
  },
];

// ── 분포 비교 막대(SVG — 동적 너비는 속성으로) ──
function CompareBar({ k, thW, empW }: { k: number; thW: number; empW: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-right text-[11px] text-slate-400">{k}</span>
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-2.5 flex-1 rounded bg-slate-700/70" aria-hidden>
        <rect x="0" y="0" width={thW} height="10" className="fill-cyan-400/55" />
        <rect x="0" y="0" width={empW} height="10" className="fill-amber-400/90" />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  메인
// ═══════════════════════════════════════════════════════════════
export default function GaltonBoard() {
  const [rows, setRows] = useState(7);
  const [p, setP] = useState(0.5);
  const [speed, setSpeed] = useState<SpeedKey>("normal");
  const [auto, setAuto] = useState(false);
  const [stats, setStats] = useState<{ buckets: number[]; total: number }>({ buckets: new Array(8).fill(0), total: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rowsRef = useRef(rows);
  const pRef = useRef(p);
  const speedRef = useRef(speed);
  const ballsRef = useRef<Ball[]>([]);
  const bucketsRef = useRef<number[]>(new Array(rows + 1).fill(0));
  const totalRef = useRef(0);

  const syncStats = useCallback(() => {
    setStats({ buckets: [...bucketsRef.current], total: totalRef.current });
  }, []);

  // 시뮬 초기화(줄 수가 바뀌면 버킷 크기도 갱신)
  const resetSim = useCallback((nextRows: number) => {
    setAuto(false);
    bucketsRef.current = new Array(nextRows + 1).fill(0);
    ballsRef.current = [];
    totalRef.current = 0;
    syncStats();
  }, [syncStats]);

  function dropBall() {
    const r = rowsRef.current;
    if (ballsRef.current.length < 25) {
      ballsRef.current.push(new Ball(getLayout(r), r, pRef.current));
    }
  }

  function drop100() {
    setAuto(false);
    const r = rowsRef.current, pp = pRef.current;
    for (let i = 0; i < 100; i++) {
      let c = 0;
      for (let j = 0; j < r; j++) if (Math.random() < pp) c++;
      bucketsRef.current[c]++;
      totalRef.current++;
    }
    syncStats();
  }

  // 애니메이션 루프(마운트 1회)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const loop = () => {
      const r = rowsRef.current, pp = pRef.current, sp = speedRef.current;
      const layout = getLayout(r);
      let landed = false;
      for (const ball of ballsRef.current) {
        const fc = ball.update(layout, r, sp);
        if (fc !== null) { bucketsRef.current[fc]++; totalRef.current++; landed = true; }
      }
      if (ballsRef.current.some((b) => b.phase === "done")) {
        ballsRef.current = ballsRef.current.filter((b) => b.phase !== "done");
      }
      drawBoard(ctx, layout, r, pp, bucketsRef.current, ballsRef.current);
      if (landed) syncStats();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [syncStats]);

  // 자동 투하
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      if (ballsRef.current.length < 18) dropBall();
    }, AUTO_INTERVAL[speed] ?? 300);
    return () => clearInterval(id);
  }, [auto, speed]);

  const mean = rows * p;
  const total = stats.total;
  const maxThP = binomProb(rows, Math.round(rows * p), p) || 0.001;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 이항정리 / 이항분포</p>
        <h3 className="mt-2 text-2xl font-bold">🎰 갈톤보드 시뮬레이션</h3>
        <p className="mt-2 leading-7 text-slate-300">
          구슬이 각 못에서 좌(L) 또는 우(R)로 떨어지며, 최종 위치의 분포는 <b className="text-cyan-300">이항분포 B(n, p)</b>를 따릅니다.
          못의 숫자는 파스칼의 삼각형(이항계수)입니다.
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-white/10 bg-slate-900 p-4">
        <div className="flex items-center gap-2">
          <label htmlFor="gb-rows" className="text-xs text-slate-400">줄 수 n</label>
          <input id="gb-rows" type="range" min={3} max={12} step={1} value={rows}
            onChange={(e) => { const v = Number(e.target.value); rowsRef.current = v; setRows(v); resetSim(v); }}
            className="w-24 accent-amber-400" />
          <span className="min-w-[28px] rounded-md bg-stone-800 px-1.5 py-0.5 text-center text-sm font-bold text-amber-300">{rows}</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="gb-p" className="text-xs text-slate-400">우측 확률 p</label>
          <input id="gb-p" type="range" min={0.1} max={0.9} step={0.05} value={p}
            onChange={(e) => { const v = Number(e.target.value); pRef.current = v; setP(v); resetSim(rowsRef.current); }}
            className="w-24 accent-amber-400" />
          <span className="min-w-[36px] rounded-md bg-stone-800 px-1.5 py-0.5 text-center text-sm font-bold text-amber-300">{p.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="gb-speed" className="text-xs text-slate-400">속도</label>
          <select id="gb-speed" value={speed}
            onChange={(e) => { const v = e.target.value as SpeedKey; speedRef.current = v; setSpeed(v); }}
            className="rounded-md border border-white/15 bg-slate-800 px-2 py-1 text-sm text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40">
            <option value="slow">느리게</option>
            <option value="normal">보통</option>
            <option value="fast">빠르게</option>
          </select>
        </div>
        <div className="h-6 w-px bg-white/10" />
        <button type="button" onClick={dropBall} className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-bold text-stone-900 transition hover:brightness-110">구슬 1개 ▼</button>
        <button type="button" onClick={() => setAuto((a) => !a)} className={`rounded-lg px-3 py-1.5 text-sm font-bold text-white transition hover:brightness-110 ${auto ? "bg-violet-500" : "bg-blue-500"}`}>{auto ? "■ 자동 정지" : "▶ 자동 투하"}</button>
        <button type="button" onClick={drop100} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-bold text-white transition hover:brightness-110">100개 즉시</button>
        <button type="button" onClick={() => resetSim(rowsRef.current)} className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-bold text-white transition hover:brightness-110">초기화</button>
      </div>

      {/* 보드 + 통계 */}
      <div className="mt-4 flex flex-wrap items-start gap-4">
        <div className="w-full max-w-[520px] flex-[0_0_auto]">
          <canvas ref={canvasRef} width={CW} height={CH} className="h-auto w-full rounded-xl" />
        </div>

        <div className="flex min-w-[220px] flex-1 flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-900 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">총 투하 구슬</span>
              <span className="text-xl font-extrabold text-amber-300">{total.toLocaleString()}</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              p = <b className="text-emerald-300">{p.toFixed(2)}</b> &nbsp; 기대값 np = <b className="text-emerald-300">{mean.toFixed(2)}</b>
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900 p-3.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">칸별 분포</h4>
            <table className="mt-1.5 w-full text-xs">
              <thead>
                <tr className="text-slate-500">
                  <th className="border-b border-white/10 px-1 py-1 font-semibold">k</th>
                  <th className="border-b border-white/10 px-1 py-1 font-semibold">개수</th>
                  <th className="border-b border-white/10 px-1 py-1 font-semibold">비율%</th>
                  <th className="border-b border-white/10 px-1 py-1 font-semibold">이론%</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rows + 1 }, (_, i) => {
                  const thP = binomProb(rows, i, p) * 100;
                  const empP = total > 0 ? (stats.buckets[i] / total) * 100 : null;
                  return (
                    <tr key={i} className={i % 2 ? "bg-white/[0.02]" : ""}>
                      <td className="px-1 py-0.5 text-center font-semibold text-slate-400">{i}</td>
                      <td className="px-1 py-0.5 text-center font-bold text-amber-300">{stats.buckets[i] ?? 0}</td>
                      <td className="px-1 py-0.5 text-center text-amber-200">{empP === null ? "—" : empP.toFixed(1)}</td>
                      <td className="px-1 py-0.5 text-center text-cyan-300">{thP.toFixed(1)}</td>
                    </tr>
                  );
                })}
                <tr className="italic text-slate-500">
                  <td className="border-t border-white/10 px-1 py-0.5 text-center">합계</td>
                  <td className="border-t border-white/10 px-1 py-0.5 text-center font-bold text-amber-300">{total}</td>
                  <td className="border-t border-white/10 px-1 py-0.5 text-center">{total > 0 ? "100.0" : "—"}</td>
                  <td className="border-t border-white/10 px-1 py-0.5 text-center">100.0</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900 p-3.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">분포 비교</h4>
            <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />경험(노랑)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />이론(파랑)</span>
            </div>
            <div className="mt-2 space-y-1">
              {Array.from({ length: rows + 1 }, (_, i) => {
                const thP = binomProb(rows, i, p);
                const empP = total > 0 ? stats.buckets[i] / total : 0;
                return (
                  <CompareBar key={i} k={i}
                    thW={Math.min(100, (thP / maxThP) * 85)}
                    empW={Math.min(100, (empP / maxThP) * 85)} />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 활동 안내 */}
      <details className="mt-4 rounded-2xl border border-white/10 bg-slate-900 p-4">
        <summary className="cursor-pointer text-sm font-bold text-cyan-300">💡 활동 안내</summary>
        <div className="mt-3 space-y-3 text-sm leading-7 text-slate-300">
          <div>
            <p className="font-bold text-slate-200">갈톤보드란?</p>
            <p>영국 통계학자 프랜시스 갈톤이 고안한 장치로, 구슬이 각 못에서 좌·우로 떨어지며 최종 위치의 분포가 <b className="text-cyan-300">이항분포 B(n, p)</b>를 따릅니다.</p>
          </div>
          <div>
            <p className="font-bold text-slate-200">탐구 방법</p>
            <ol className="ml-4 list-decimal">
              <li>n = 7, p = 0.5로 시작 → 구슬을 여러 개 투하해 분포 관찰</li>
              <li>p를 0.3, 0.7로 바꿔 분포가 어떻게 달라지는지 비교</li>
              <li>n을 늘릴수록 분포가 정규분포에 가까워지는지 확인 (중심극한정리!)</li>
            </ol>
          </div>
          <div>
            <p className="font-bold text-slate-200">파스칼의 삼각형과의 연결</p>
            <p>각 못의 숫자(이항계수 ₙCᵣ)는 그 경로를 지나는 구슬의 상대적 빈도를 나타내며, n번째 줄 이항계수의 합 = 2ⁿ (전체 경로의 수)입니다.</p>
          </div>
        </div>
      </details>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
