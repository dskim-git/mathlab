"use client";

import { useState } from "react";
import ConstructionBoard, {
  distance,
  pointById,
  type Board,
  type Pt,
  type Seed,
} from "./ConstructionBoard";

// ─── 문제 ① 2배 연장선 (컴퍼스 전용, 3L 3E 2V) ──────────────
const PROB1_SEED: Seed = {
  points: [
    { id: "A", x: 280, y: 220, label: "A" },
    { id: "B", x: 380, y: 220, label: "B" },
  ],
  lines: [],
  circles: [],
};
const PROB1_TARGET = { L: 3, E: 3, V: 2 };

const EPS_COLINEAR = 1.5;
const EPS_LENGTH = 3.0;
const EPS_CENTER = 5.0;

function isCollinear(a: { x: number; y: number }, b: { x: number; y: number }, p: { x: number; y: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cross = Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx);
  return cross / len < EPS_COLINEAR;
}

type Sol1 = { sideB: Pt | null; sideA: Pt | null };

function findSolution1(board: Board): Sol1 {
  const A = pointById(board, "A");
  const B = pointById(board, "B");
  if (!A || !B) return { sideB: null, sideA: null };
  const ab = distance(A, B);
  let sideB: Pt | null = null;
  let sideA: Pt | null = null;
  for (const p of board.points) {
    if (p.hidden) continue;
    if (p.id === "A" || p.id === "B") continue;
    if (!isCollinear(A, B, p)) continue;
    const ac = distance(A, p);
    if (Math.abs(ac - 2 * ab) > EPS_LENGTH) continue;
    const dot = (p.x - A.x) * (B.x - A.x) + (p.y - A.y) * (B.y - A.y);
    if (dot > 0 && !sideB) sideB = p;
    else if (dot < 0 && !sideA) sideA = p;
  }
  return { sideB, sideA };
}

// ─── 문제 ② 원의 중심 (2L 5E) ──────────────────────────────
// 시드: 원만(점 없음, 중심도 hidden). 학생은 점 도구로 원 위 점부터 찍어 작도 시작.
const C2_CX = 360;
const C2_CY = 220;
const C2_R = 130;
const PROB2_SEED: Seed = {
  points: [
    { id: "O", x: C2_CX, y: C2_CY, hidden: true }, // 숨겨진 중심
    { id: "anchor", x: C2_CX + C2_R, y: C2_CY, hidden: true }, // 원 정의용 hidden anchor
  ],
  lines: [],
  circles: [{ id: "given", center: "O", through: "anchor" }],
};
const PROB2_TARGET = { L: 2, E: 5 };

function findSolution2(board: Board) {
  const O = pointById(board, "O");
  if (!O) return null;
  for (const p of board.points) {
    if (p.hidden) continue;
    if (distance(p, O) < EPS_CENTER) return p;
  }
  return null;
}

// ─── 카운트 비교 칩 ─────────────────────────────────────────
function CountChip({ label, used, target, color }: { label: string; used: number; target: number; color: "cyan" | "violet" | "amber" }) {
  const ok = used <= target;
  const palette = {
    cyan: ok ? "text-cyan-300 border-cyan-400/40" : "text-rose-300 border-rose-400/40",
    violet: ok ? "text-violet-300 border-violet-400/40" : "text-rose-300 border-rose-400/40",
    amber: ok ? "text-amber-300 border-amber-400/40" : "text-rose-300 border-rose-400/40",
  }[color];
  return (
    <span className={`rounded-md border bg-slate-900/60 px-2 py-0.5 text-xs font-semibold ${palette}`}>
      {label} {used}/{target}
    </span>
  );
}

// ─── 탭 UI ──────────────────────────────────────────────────
const TABS = [
  { id: "prob1", label: "① 2배 연장선" },
  { id: "prob2", label: "② 원의 중심" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function EuclideaWarmup() {
  const [tab, setTab] = useState<TabId>("prob1");
  const [board1, setBoard1] = useState<Board | null>(null);
  const [board2, setBoard2] = useState<Board | null>(null);

  const sol1 = board1 ? findSolution1(board1) : { sideB: null, sideA: null };
  const variants1 = (sol1.sideB ? 1 : 0) + (sol1.sideA ? 1 : 0);
  const solved2 = board2 ? findSolution2(board2) : null;

  const usedL1 = board1 ? board1.lines.length + board1.circles.length : 0; // 시드 없음
  const usedE1 = board1?.events ?? 0;
  const usedL2 = board2
    ? board2.lines.length + (board2.circles.length - PROB2_SEED.circles.length)
    : 0;
  const usedE2 = board2?.events ?? 0;

  const fullSolved1 = variants1 === PROB1_TARGET.V && usedL1 <= PROB1_TARGET.L && usedE1 <= PROB1_TARGET.E;
  const fullSolved2 = solved2 != null && usedL2 <= PROB2_TARGET.L && usedE2 <= PROB2_TARGET.E;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-5">
        <h2 className="text-2xl font-bold text-white">🧩 작도 몸풀기 게임</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          <span className="font-bold text-cyan-300">L (Line)</span> = 작도 결과로 나타난 선과 원의 총 개수
          <span className="mx-1">·</span>
          <span className="font-bold text-violet-300">E (Event)</span> = 자·컴퍼스 동작 횟수
          <span className="mx-1">·</span>
          <span className="font-bold text-amber-300">V (Variation)</span> = 조건을 만족하는 도형의 가짓수
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const on = t.id === tab;
          const done = (t.id === "prob1" && (sol1.sideB || sol1.sideA)) || (t.id === "prob2" && solved2);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                "rounded-xl px-4 py-2 text-sm font-semibold transition " +
                (on
                  ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40"
                  : "bg-slate-900 text-slate-400 ring-1 ring-white/10 hover:text-slate-200")
              }
            >
              {t.label} {done ? <span className="ml-1 text-emerald-400">✓</span> : null}
            </button>
          );
        })}
      </div>

      {/* 두 섹션 항상 mount — ConstructionBoard state 격리 + 작도 진행 유지 */}
      <section className={"rounded-xl border border-white/10 bg-slate-900/40 p-5 " + (tab === "prob1" ? "" : "hidden")}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-bold text-white">① 2배 연장선</h3>
          <span className="rounded-md border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
            목표 3L · 3E · 2V
          </span>
          {board1 ? (
            <span className="ml-auto flex flex-wrap gap-1.5">
              <CountChip label="L" used={usedL1} target={PROB1_TARGET.L} color="cyan" />
              <CountChip label="E" used={usedE1} target={PROB1_TARGET.E} color="violet" />
              <CountChip label="V" used={variants1} target={PROB1_TARGET.V} color="amber" />
            </span>
          ) : null}
        </div>

        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          <span className="font-bold text-amber-300">컴퍼스만</span> 사용하여{" "}
          <span className="font-mono font-semibold text-amber-300">AC = 2 · AB</span> 가 되도록
          직선 AB 위에 점 <span className="font-bold">C</span> 를 작도하세요.
          조건을 만족하는 점 C 는 <span className="text-amber-300 font-semibold">두 곳 (B 너머 · A 너머)</span> 에 있어요 (V=2).
        </p>

        <ConstructionBoard
          seed={PROB1_SEED}
          allowedTools={["point", "circle"]}
          onChange={setBoard1}
          solvedBadge={
            fullSolved1 ? (
              <div className="rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-3 py-2 text-sm font-bold text-emerald-200">
                🏆 완전 정답! 3L · 3E · 2V 조건을 모두 만족합니다.
              </div>
            ) : variants1 > 0 ? (
              <div className="rounded-lg border border-amber-400/50 bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-200">
                ✨ 변형 {variants1}/2 발견 — {sol1.sideB ? "B 너머 ✓ " : "B 너머 — "}
                {sol1.sideA ? "A 너머 ✓" : "A 너머 —"}
                <span className="ml-2 text-xs font-normal text-amber-200/80">반대편 정답도 작도해 V=2 를 채워보세요.</span>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
                💡 힌트: A 중심 반지름 AB 원 → B 중심 반지름 BA 원 → 두 원의 교점 중 하나를 중심으로 또 다른 원. 세 원으로 3L 3E.
              </div>
            )
          }
        />
      </section>

      <section className={"rounded-xl border border-white/10 bg-slate-900/40 p-5 " + (tab === "prob2" ? "" : "hidden")}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-bold text-white">② 원의 중심</h3>
          <span className="rounded-md border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
            목표 2L · 5E
          </span>
          {board2 ? (
            <span className="ml-auto flex flex-wrap gap-1.5">
              <CountChip label="L" used={usedL2} target={PROB2_TARGET.L} color="cyan" />
              <CountChip label="E" used={usedE2} target={PROB2_TARGET.E} color="violet" />
            </span>
          ) : null}
        </div>

        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          주어진 원의 <span className="font-bold text-amber-300">중심</span> 을 작도하세요.
          시작 점이 없어요 — <span className="font-semibold text-amber-300">📍 점 도구</span> 로 원 위에 직접 점을 찍어가며 풀어 보세요.
        </p>

        <ConstructionBoard
          seed={PROB2_SEED}
          allowedTools={["point", "line", "circle", "perpBisector"]}
          onChange={setBoard2}
          solvedBadge={
            fullSolved2 ? (
              <div className="rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-3 py-2 text-sm font-bold text-emerald-200">
                🏆 완전 정답! 2L · 5E 목표 안에서 중심을 찾았습니다.
              </div>
            ) : solved2 ? (
              <div className="rounded-lg border border-amber-400/50 bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-200">
                ✨ 중심 발견! 다만 L 또는 E 가 목표를 넘었어요 — L과 E 가 동시에 만족되지 않는 풀이도 있다는 게 이번 문제의 핵심이에요.
                <span className="ml-2 text-xs font-normal text-amber-200/80">기본 도구만으로는 5L 5E, 수직이등분선 도구 두 번이면 2L 6E.</span>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
                💡 힌트: 원 위 두 점의 <span className="text-slate-300">📏 수직이등분선</span> 은 항상 중심을 지나요. 두 번 그어 두 직선의 교점을 찾아 보세요 (2L 6E). 또는 기본 도구로 5L 5E.
              </div>
            )
          }
        />
      </section>
    </div>
  );
}
