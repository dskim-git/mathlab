"use client";

// 빙고 셀의 작도 풀이 화면 (교사 전용 진입).
//
// 헤더 (문제 번호 + 목표 L·E + 돌아가기) + 자체 ConstructionBoard 자유 작도 영역 +
// 하단 GeoGebra 보조 링크.
//
// 25문제별 시드/정답 검증은 후속 라운드 C-3 에서 추가. 이번 라운드에선 빈 캔버스로
// 모든 도구(점·선·원·수직이등분선) 사용 가능한 자유 작도 모드.

import ConstructionBoard, {
  type Seed,
} from "@/components/activities/gifted/4-euclidea/euclidea-warmup/ConstructionBoard";
import { PROBLEMS } from "@/lib/bingo/data";

const EMPTY_SEED: Seed = { points: [], lines: [], circles: [] };

type Props = {
  num: number;
  /** 방장(교사)일 때만 전달 — 학생은 undefined → "빙고판으로" 버튼이 안 보임. */
  onBack?: () => void;
};

export default function ProblemView({ num, onBack }: Props) {
  const problem = PROBLEMS[num];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            문제 #{num} · 작도 화면
          </div>
          <h3 className="mt-1 flex items-center gap-2 text-lg font-bold text-white">
            목표
            <span className="rounded-md border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 text-xs font-extrabold text-cyan-200">
              {problem.L}L · {problem.E}E
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

      <ConstructionBoard seed={EMPTY_SEED} allowedTools={["point", "line", "circle", "perpBisector"]} />

      <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/40 px-4 py-3 text-xs text-slate-500">
        🚧 문제 {num} 의 시드/정답 검증은 라운드 C-3 에서 추가됩니다. 지금은 자유 작도 모드입니다.
      </div>

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
