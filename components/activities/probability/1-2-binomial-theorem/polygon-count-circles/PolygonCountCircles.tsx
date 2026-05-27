"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

type Shape = { name: string; r: number; icon: string; stroke: string; fill: string | null; sel: string };
const SHAPES: Shape[] = [
  { name: "점", r: 1, icon: "⚪", stroke: "#86efac", fill: null, sel: "border-emerald-400 bg-emerald-400/15" },
  { name: "선분", r: 2, icon: "─", stroke: "rgba(251,191,36,0.85)", fill: null, sel: "border-amber-400 bg-amber-400/15" },
  { name: "삼각형", r: 3, icon: "△", stroke: "rgba(52,211,153,0.85)", fill: "rgba(52,211,153,0.15)", sel: "border-emerald-400 bg-emerald-400/15" },
  { name: "사각형", r: 4, icon: "□", stroke: "rgba(96,165,250,0.85)", fill: "rgba(96,165,250,0.15)", sel: "border-blue-400 bg-blue-400/15" },
  { name: "오각형", r: 5, icon: "⬠", stroke: "rgba(167,139,250,0.85)", fill: "rgba(167,139,250,0.18)", sel: "border-violet-400 bg-violet-400/15" },
];
const N_MAX = 8;
const CSIZE = 300;

// 0..n-1 에서 r개를 무작위로 골라 오름차순 정렬(원 둘레 순서 = 볼록 도형)
function randomCombination(n: number, r: number): number[] | null {
  if (r > n) return null;
  const pool = Array.from({ length: n }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, r).sort((a, b) => a - b);
}

function drawCircle(ctx: CanvasRenderingContext2D, n: number, shape: Shape | null, indices: number[] | null) {
  const cx = CSIZE / 2, cy = CSIZE / 2;
  const radius = CSIZE / 2 - 30;
  ctx.clearRect(0, 0, CSIZE, CSIZE);

  ctx.strokeStyle = "rgba(99,102,241,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.stroke();

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * ((2 * Math.PI) / n);
    pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
  }

  const name = shape?.name ?? null;
  if (name === "점") {
    ctx.fillStyle = "#86efac";
    for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 8, 0, 2 * Math.PI); ctx.fill(); }
  } else if (shape && indices && indices.length === shape.r && shape.r >= 2) {
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.r === 2 ? 3 : 2.5;
    ctx.beginPath();
    ctx.moveTo(pts[indices[0]].x, pts[indices[0]].y);
    for (let i = 1; i < indices.length; i++) ctx.lineTo(pts[indices[i]].x, pts[indices[i]].y);
    if (shape.r >= 3) ctx.closePath();
    if (shape.fill) { ctx.fillStyle = shape.fill; ctx.fill(); }
    ctx.stroke();
  }

  // 선택 점 강조
  if (indices && indices.length > 0) {
    ctx.fillStyle = "#fbbf24";
    for (const idx of indices) { ctx.beginPath(); ctx.arc(pts[idx].x, pts[idx].y, 7, 0, 2 * Math.PI); ctx.fill(); }
  }
  // 모든 점 + 번호
  ctx.fillStyle = "#fbbf24";
  for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 6, 0, 2 * Math.PI); ctx.fill(); }
  ctx.fillStyle = "rgba(15,23,42,0.95)";
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < n; i++) ctx.fillText(String(i + 1), pts[i].x, pts[i].y);
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "shape_is_comb",
    prompt:
      "점 n개에서 r개를 선택해 만든 도형(선분=2개, 삼각형=3개, 사각형=4개…)의 개수가 C(n, r)인 이유를 설명해 보세요.",
    kind: "text",
  },
  {
    id: "pascal_law_meaning",
    prompt:
      "표를 완성하면 나타나는 파스칼의 삼각형에서, 한 칸의 수가 위 두 칸의 합이 되는 성질(파스칼 법칙)을 ‘도형 선택’의 관점에서 설명해 보세요.",
    kind: "text",
  },
];

export default function PolygonCountCircles() {
  const [n, setN] = useState(3);
  const [selected, setSelected] = useState<Shape | null>(null);
  const [indices, setIndices] = useState<number[] | null>(null);
  const [inputs, setInputs] = useState<Record<number, Record<string, number | undefined>>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawCircle(ctx, n, selected, indices);
  }, [n, selected, indices]);

  function pickShape(shape: Shape) {
    setSelected(shape);
    setIndices(shape.name === "점" ? Array.from({ length: n }, (_, i) => i) : randomCombination(n, shape.r));
  }
  function onN(v: number) {
    setN(v);
    if (selected) setIndices(selected.name === "점" ? Array.from({ length: v }, (_, i) => i) : randomCombination(v, selected.r));
  }
  function setCell(row: number, shape: string, raw: string) {
    setInputs((prev) => ({
      ...prev,
      [row]: { ...prev[row], [shape]: raw === "" ? undefined : parseInt(raw, 10) },
    }));
  }
  function fillCorrect() {
    const next: Record<number, Record<string, number>> = {};
    for (let row = 1; row <= N_MAX; row++) {
      next[row] = {};
      for (const s of SHAPES) next[row][s.name] = comb(row, s.r);
    }
    setInputs(next);
  }

  const allCorrect = (() => {
    for (let row = 1; row <= N_MAX; row++)
      for (const s of SHAPES) if (inputs[row]?.[s.name] !== comb(row, s.r)) return false;
    return true;
  })();

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 이항정리 / 조합</p>
        <h3 className="mt-2 text-2xl font-bold">🔵 원 위의 점으로 만든 도형 — 파스칼의 삼각형 발견</h3>
        <p className="mt-2 leading-7 text-slate-300">
          원 위에 등간격으로 배치된 점들을 이어 만든 선분·삼각형·사각형·오각형의 개수를 표로 정리하면{" "}
          <b className="text-amber-300">파스칼의 삼각형</b>이 나타납니다. 직접 채워 보며 발견해 보세요!
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">📌 활동 규칙</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">1️⃣ 원 위의 점 개수를 선택<br />2️⃣ 각 도형(선분·삼각형·사각형·오각형)의 개수를 입력<br />3️⃣ 표를 완성하면 파스칼의 삼각형을 발견!</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">💡 핵심 개념</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">r개의 도형 = r개의 점을 선택하는 경우의 수 = C(n, r)<br />n개 중 r개를 선택하는 이항계수가 각 행에 나타납니다.</p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
        💡 <b>팁:</b> 선분은 2개, 삼각형은 3개, 사각형은 4개, 오각형은 5개의 점을 선택할 때 만들어집니다.
      </div>

      {/* 컨트롤 */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-slate-900 p-3">
        <label htmlFor="poly-n" className="text-sm font-bold text-slate-200">점의 개수:</label>
        <input id="poly-n" type="range" min={1} max={N_MAX} step={1} value={n}
          onChange={(e) => onN(Number(e.target.value))} className="w-36 accent-amber-400" />
        <span className="min-w-[28px] text-right text-lg font-black text-amber-300">{n}</span>
        <span className="text-sm text-slate-400">개</span>
      </div>

      {/* 캔버스 */}
      <div className="mt-3 flex items-center justify-center rounded-xl border border-indigo-400/25 bg-slate-900 p-5">
        <canvas ref={canvasRef} width={CSIZE} height={CSIZE} className="h-auto w-full max-w-[220px]" />
      </div>

      {/* 도형 카드 */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {SHAPES.map((s) => {
          const isSel = selected?.name === s.name;
          return (
            <button key={s.name} type="button" onClick={() => pickShape(s)}
              className={`rounded-xl border-2 p-3 text-center transition ${isSel ? s.sel : "border-white/12 bg-slate-900 hover:border-white/30"}`}>
              <div className="text-2xl">{s.icon}</div>
              <div className="mt-1 text-sm font-bold text-slate-100">{s.name}</div>
              <div className="text-xs text-slate-500">C(n, {s.r})</div>
            </button>
          );
        })}
      </div>

      {/* 버튼 */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={fillCorrect} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110">💾 정답 확인</button>
        <button type="button" onClick={() => setInputs({})} className="rounded-lg border border-white/15 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10">🔄 초기화</button>
      </div>

      {allCorrect ? (
        <div className="mt-3 animate-[fadeIn_0.3s_ease] rounded-xl border-2 border-emerald-400/40 bg-emerald-400/10 p-4 text-center">
          <p className="text-lg font-black text-emerald-300">✅ 파스칼의 삼각형을 발견했습니다!</p>
          <p className="mt-1.5 text-sm leading-6 text-emerald-100/90">각 행의 수가 파스칼의 삼각형의 이항계수와 일치합니다. 이는 <b>n개의 점 중 r개를 선택해 만든 도형의 개수 = C(n, r)</b>이기 때문입니다!</p>
        </div>
      ) : null}

      {/* 표 */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-900 p-3.5">
        <p className="mb-2 text-center text-sm font-bold text-amber-300">📊 파스칼의 삼각형과 원 위의 도형 개수</p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-amber-300">
              <th className="border-b-2 border-indigo-400/40 px-2 py-2">n (점)</th>
              {SHAPES.map((s) => (
                <th key={s.name} className="border-b-2 border-indigo-400/40 px-2 py-2">{s.icon} ({s.name})</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: N_MAX }, (_, i) => i + 1).map((row) => (
              <tr key={row}>
                <td className="border-b border-white/10 px-2 py-1.5 text-center font-bold text-amber-300">n = {row}</td>
                {SHAPES.map((s) => {
                  const v = inputs[row]?.[s.name];
                  const correct = v === comb(row, s.r);
                  return (
                    <td key={s.name} className={`border-b border-white/10 px-2 py-1.5 ${v !== undefined && correct ? "bg-emerald-400/15" : ""}`}>
                      <input
                        type="number"
                        inputMode="numeric"
                        aria-label={`n=${row} ${s.name} 개수`}
                        value={v === undefined ? "" : v}
                        placeholder="?"
                        onChange={(e) => setCell(row, s.name, e.target.value)}
                        className={`w-full rounded-md border bg-slate-950 px-2 py-1 text-center font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300/40 ${v !== undefined && correct ? "border-emerald-400/50 text-emerald-300" : "border-indigo-400/30 text-amber-300"}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
