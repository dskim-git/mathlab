"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// 보스턴 대학교(BU) 카오스 게임 재현 — 무작위로 정해진 작은 삼각형에 점을 넣는 퍼즐.

type Vertex = { x: number; y: number; color: string };
type Pt = { x: number; y: number };

const W = 500;
const H = 500;
const VERTICES: Vertex[] = [
  { x: 250, y: 40, color: "#e74c3c" }, // T (Red)
  { x: 50, y: 380, color: "#3498db" }, // L (Blue)
  { x: 450, y: 380, color: "#2ecc71" }, // R (Green)
];
const LABELS = ["T", "L", "R"] as const;

function midpoint(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function buildTriangles(
  v1: Pt,
  v2: Pt,
  v3: Pt,
  depth: number,
): [Pt, Pt, Pt][] {
  if (depth === 0) return [[v1, v2, v3]];
  const m1 = midpoint(v1, v2);
  const m2 = midpoint(v2, v3);
  const m3 = midpoint(v3, v1);
  return [
    ...buildTriangles(v1, m1, m3, depth - 1),
    ...buildTriangles(m1, v2, m2, depth - 1),
    ...buildTriangles(m3, m2, v3, depth - 1),
  ];
}

function isInside(p: Pt, tri: [Pt, Pt, Pt]): boolean {
  const [p0, p1, p2] = tri;
  const A =
    0.5 *
    (-p1.y * p2.x +
      p0.y * (-p1.x + p2.x) +
      p0.x * (p1.y - p2.y) +
      p1.x * p2.y);
  const sign = A < 0 ? -1 : 1;
  const s =
    (p0.y * p2.x -
      p0.x * p2.y +
      (p2.y - p0.y) * p.x +
      (p0.x - p2.x) * p.y) *
    sign;
  const t =
    (p0.x * p1.y -
      p0.y * p1.x +
      (p0.y - p1.y) * p.x +
      (p1.x - p0.x) * p.y) *
    sign;
  return s > 0 && t > 0 && s + t < 2 * Math.abs(A);
}

type Level = 2 | 3 | 4;

export default function ChaosgameBu() {
  const [level, setLevel] = useState<Level>(2);
  const [round, setRound] = useState(0); // 새 라운드 트리거.
  const [pos, setPos] = useState<Pt>({ x: 450, y: 380 });
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<string>("");
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const target = useMemo<[Pt, Pt, Pt]>(() => {
    const all = buildTriangles(
      VERTICES[0],
      VERTICES[1],
      VERTICES[2],
      level,
    );
    return all[Math.floor(Math.random() * all.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, round]);

  // 새 라운드 시작 시 점 위치 초기화.
  useEffect(() => {
    setPos({ x: VERTICES[2].x, y: VERTICES[2].y });
    setScore(0);
    setHistory("");
    setGameOver(false);
  }, [level, round]);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(280, Math.min(wrap.clientWidth, 500));
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
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, W, H);
    // 큰 삼각형 테두리
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(VERTICES[0].x, VERTICES[0].y);
    ctx.lineTo(VERTICES[1].x, VERTICES[1].y);
    ctx.lineTo(VERTICES[2].x, VERTICES[2].y);
    ctx.closePath();
    ctx.stroke();
    // 타겟 삼각형 (반투명 초록)
    ctx.fillStyle = "#2ecc71";
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(target[0].x, target[0].y);
    ctx.lineTo(target[1].x, target[1].y);
    ctx.lineTo(target[2].x, target[2].y);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    // 꼭짓점 점
    for (const v of VERTICES) {
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.arc(v.x, v.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    // 현재 점
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
    ctx.fill();
    // 꼭짓점 라벨
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("T", VERTICES[0].x, VERTICES[0].y - 16);
    ctx.fillText("L", VERTICES[1].x - 16, VERTICES[1].y + 4);
    ctx.fillText("R", VERTICES[2].x + 16, VERTICES[2].y + 4);
  }, [pos, target]);

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

  function move(idx: number) {
    if (gameOver) return;
    const v = VERTICES[idx];
    const next = midpoint(pos, v);
    setPos(next);
    setScore((s) => s + 1);
    setHistory((h) => h + LABELS[idx]);
    if (isInside(next, target)) {
      setGameOver(true);
    }
  }

  function restart() {
    setRound((r) => r + 1);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-4 text-center">
        <h2 className="text-2xl font-extrabold text-white">
          🎮 카오스 게임 (BU Edition)
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          보스턴 대학교(BU)의 카오스 게임 퍼즐. 현재 점을 꼭짓점 쪽으로 중점 이동
          시켜 <b className="text-emerald-300">초록 타겟 삼각형</b> 안에 넣으세요!
        </p>
      </header>

      <div className="mb-3 flex flex-wrap justify-center gap-2">
        {([2, 3, 4] as Level[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            className={
              "rounded-md px-4 py-1.5 text-sm font-bold transition " +
              (level === l
                ? "bg-blue-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600")
            }
          >
            {l === 2 ? "Easy" : l === 3 ? "Medium" : "Hard"}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap justify-center gap-6 text-sm">
        <div>
          이동 횟수:{" "}
          <span className="text-lg font-extrabold text-amber-300">{score}</span>
        </div>
        <div>
          목표 단계:{" "}
          <span className="text-lg font-extrabold text-sky-300">{level + 2}</span>
        </div>
      </div>

      <div ref={wrapRef} className="mx-auto flex max-w-[500px] justify-center">
        <canvas
          ref={canvasRef}
          className="block rounded-lg border border-white/10 bg-white"
        />
      </div>

      <div className="my-3 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => move(0)}
          disabled={gameOver}
          className="rounded-md bg-rose-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-400 disabled:bg-rose-500/40 disabled:cursor-not-allowed"
        >
          Red (T)
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={gameOver}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-400 disabled:bg-blue-500/40 disabled:cursor-not-allowed"
        >
          Blue (L)
        </button>
        <button
          type="button"
          onClick={() => move(2)}
          disabled={gameOver}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:bg-emerald-500/40 disabled:cursor-not-allowed"
        >
          Green (R)
        </button>
      </div>

      <div className="mx-auto max-w-md rounded-md bg-slate-900/60 px-3 py-2 text-center font-mono text-base font-bold text-slate-200">
        {history || <span className="text-slate-500">클릭 기록 없음</span>}
      </div>

      <div
        className={
          "mt-3 min-h-[28px] text-center text-base font-bold " +
          (gameOver ? "text-emerald-300" : "text-amber-300")
        }
      >
        {gameOver
          ? `🎉 성공! ${score} 번 만에 타겟에 도착했습니다.`
          : ""}
      </div>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={restart}
          className="rounded-md bg-slate-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-600"
        >
          ↺ 다시 시작
        </button>
      </div>
    </div>
  );
}
