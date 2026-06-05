"use client";

// 빙고 셀의 작도 풀이 화면.
//
// 라운드 C-3 부터 — PROBLEM_SEEDS 에 spec 이 등록된 문제는 자체 시드 + L/E/V 카운트 + 정답 검증.
// 등록되지 않은 문제는 빈 시드 + "구현 준비 중" 안내 (점진적 추가).
//
// 작도 도구는 PDF p.8 표 그대로 — 점·선·원·수직이등분선·수선·각의 이등분선·평행선 (교차는 자동).
// 작도창 아래에 도구별 L·E 표를 항상 함께 표시 (학생 참고).

import { useState } from "react";
import ConstructionBoard, {
  type Board,
  type Seed,
} from "@/components/activities/gifted/4-euclidea/euclidea-warmup/ConstructionBoard";
import { PROBLEMS } from "@/lib/bingo/data";
import { PROBLEM_SEEDS, type ProblemSpec } from "@/lib/bingo/problemSeeds";

const ALL_TOOLS = [
  "point",
  "line",
  "circle",
  "perpBisector",
  "perpLine",
  "parallel",
  "angleBisector",
] as const;

const EMPTY_SEED: Seed = { points: [], lines: [], circles: [] };

type Props = {
  num: number;
  /** 방장(교사)일 때만 전달 — 학생은 undefined → "빙고판으로" 버튼이 안 보임. */
  onBack?: () => void;
};

export default function ProblemView({ num, onBack }: Props) {
  const problem = PROBLEMS[num];
  const spec: ProblemSpec | undefined = PROBLEM_SEEDS[num];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            문제 #{num} · 작도 화면
          </div>
          <h3 className="mt-1 flex items-center gap-2 text-lg font-bold text-white">
            {spec ? spec.title : "작도"}
            <span className="rounded-md border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 text-xs font-extrabold text-cyan-200">
              목표 {problem.L}L · {problem.E}E
              {spec ? ` · ${spec.variantCount}V` : ""}
            </span>
          </h3>
        </div>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            ◀ 빙고판으로
          </button>
        ) : (
          <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-bold text-cyan-300">
            교사 화면 따라가는 중
          </span>
        )}
      </header>

      {spec ? <ProblemBody spec={spec} problemL={problem.L} problemE={problem.E} /> : <UnimplementedBody />}

      <ToolTable />

      {problem.geogebraUrl ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-500/[0.06] px-4 py-3">
          <div className="text-xs text-slate-300">
            원본 GeoGebra 풀이 페이지로 이동해 별도 작도를 확인할 수 있어요.
          </div>
          <a
            href={problem.geogebraUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/25"
          >
            🔗 GeoGebra 풀이 페이지로
          </a>
        </div>
      ) : null}
    </div>
  );
}

// ─── 본문: spec 기반 ───────────────────────────────────────
function ProblemBody({ spec, problemL, problemE }: { spec: ProblemSpec; problemL: number; problemE: number }) {
  const [board, setBoard] = useState<Board | null>(null);

  const found = board ? spec.findVariants(board) : [];
  const usedL = board ? board.lines.length + board.circles.length : 0;
  const usedE = board?.events ?? 0;
  const usedV = found.length;

  const targetL = problemL;
  const targetE = problemE;
  const targetV = spec.variantCount;

  const lOk = usedL <= targetL && usedL > 0;
  const eOk = usedE <= targetE && usedE > 0;
  const vOk = usedV === targetV;

  const fullSolved = lOk && eOk && vOk;

  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <p className="mb-3 text-sm leading-relaxed text-slate-300">{spec.description}</p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <CountChip label="L" used={usedL} target={targetL} active={board != null} />
        <CountChip label="E" used={usedE} target={targetE} active={board != null} />
        <CountChip label="V" used={usedV} target={targetV} active={board != null} />
      </div>

      <ConstructionBoard
        seed={spec.seed}
        allowedTools={[...ALL_TOOLS]}
        onChange={setBoard}
        solvedBadge={
          fullSolved ? (
            <div className="rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-3 py-2 text-sm font-bold text-emerald-200">
              🏆 완전 정답! {targetL}L · {targetE}E · {targetV}V 조건을 모두 만족합니다.
            </div>
          ) : usedV > 0 ? (
            <div className="rounded-lg border border-amber-400/50 bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-200">
              ✨ 변형 {usedV}/{targetV} 발견 — {lOk ? "L✓" : "L"} · {eOk ? "E✓" : "E"} ·{" "}
              {vOk ? "V✓" : "V"}
            </div>
          ) : null
        }
      />
    </section>
  );
}

function CountChip({
  label,
  used,
  target,
  active,
}: {
  label: string;
  used: number;
  target: number;
  active: boolean;
}) {
  if (!active) {
    return (
      <span className="rounded-md border border-white/10 bg-slate-900/60 px-2 py-0.5 text-xs font-semibold text-slate-500">
        목표 {label} {target}
      </span>
    );
  }
  const ok = used <= target;
  const palette = ok
    ? label === "L"
      ? "text-cyan-300 border-cyan-400/40"
      : label === "E"
      ? "text-violet-300 border-violet-400/40"
      : "text-amber-300 border-amber-400/40"
    : "text-rose-300 border-rose-400/40";
  return (
    <span className={`rounded-md border bg-slate-900/60 px-2 py-0.5 text-xs font-semibold ${palette}`}>
      {label} {used}/{target}
    </span>
  );
}

// ─── 본문: spec 없는 문제 ────────────────────────────────────
function UnimplementedBody() {
  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <p className="mb-3 text-sm text-slate-400">
        🚧 이 문제는 자체 시드/검증이 아직 추가되지 않았습니다 (점진적으로 추가 중). 지금은 자유 작도 모드입니다.
      </p>
      <ConstructionBoard seed={EMPTY_SEED} allowedTools={[...ALL_TOOLS]} />
    </section>
  );
}

// ─── PDF p.8 도구 표 ──────────────────────────────────────
const TOOL_TABLE_ROWS: { name: string; desc: string; le: string }[] = [
  { name: "점", desc: "평면 위의 한 점을 찍는다.", le: "0L 0E" },
  { name: "선", desc: "서로 다른 두 점을 연결하여 눈금 없는 자로 선을 긋는다.", le: "1L 1E" },
  { name: "원", desc: "한 점을 중심으로 하고 다른 한 점을 지나는 원을 컴퍼스로 그린다.", le: "1L 1E" },
  { name: "수직이등분선", desc: "서로 다른 두 점 사이의 수직이등분선을 그린다.", le: "1L 3E" },
  { name: "수선", desc: "한 직선에 수직이고 평면 위의 한 점을 지나는 직선을 그린다.", le: "1L 3E" },
  { name: "각의 이등분선", desc: "주어진 각을 이등분하는 직선을 그린다.", le: "1L 4E" },
  { name: "평행선", desc: "한 직선에 평행하고 그 직선 위에 있지 않은 한 점을 지나는 직선을 그린다.", le: "1L 4E" },
  { name: "교차", desc: "서로 다른 두 선이 만나 생기는 교점을 찍는다 (자동).", le: "0L 0E" },
];

function ToolTable() {
  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        📐 작도 도구표 (PDF p.8)
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="px-2 py-1.5 text-left font-semibold">도구</th>
              <th className="px-2 py-1.5 text-left font-semibold">설명</th>
              <th className="px-2 py-1.5 text-right font-semibold">L · E</th>
            </tr>
          </thead>
          <tbody>
            {TOOL_TABLE_ROWS.map((row) => (
              <tr key={row.name} className="border-b border-white/5">
                <td className="px-2 py-1.5 font-bold text-slate-200">{row.name}</td>
                <td className="px-2 py-1.5 text-slate-400">{row.desc}</td>
                <td className="px-2 py-1.5 text-right font-mono font-bold text-cyan-300">{row.le}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
