"use client";

// 빙고판 (presentational) — state·Realtime 은 부모(EuclideaBingo.RoomView) 에서 관리.
//
// 학생 연습 모드 (state.practiceMode=true):
//   학생도 셀을 자유 클릭해 작도 화면에 들어갈 수 있음. 진입은 자기 local studentLocalNav.
//   교사 nav 강제 따라가기는 비활성. 연습 모드 OFF 가 되면 학생 local nav 자동 reset.

import { useEffect, useMemo, useState } from "react";
import {
  GRID,
  PROBLEMS,
  TEAMS,
  TEAM_IDS,
  type Team,
  type TeamId,
} from "@/lib/bingo/data";
import {
  type BingoState,
  type CondKey,
  effectiveOwner,
  getBingoLines,
  getCell,
  getNav,
  getTeamStats,
  isCellComplete,
  isPractice,
} from "@/lib/bingo/state";
import { type BingoRoom } from "@/lib/bingo/rooms";
import ProblemView from "./ProblemView";

type Props = {
  room: BingoRoom;
  canEdit: boolean;
  state: BingoState;
  onChangeCond: (num: number, key: CondKey, team: TeamId | null) => Promise<void>;
  onGoToProblem: (num: number | null) => Promise<void>;
  onReset: () => Promise<void>;
};

export default function BingoBoard({
  room: _room,
  canEdit,
  state,
  onChangeCond,
  onGoToProblem,
  onReset,
}: Props) {
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [studentLocalNav, setStudentLocalNav] = useState<number | null>(null);

  const serverNav = getNav(state).problemNum;
  const practice = isPractice(state);

  // 연습 모드 OFF 시 학생 local nav 강제 reset → 교사 화면을 따라감.
  useEffect(() => {
    if (!canEdit && !practice) setStudentLocalNav(null);
  }, [canEdit, practice]);

  // 현재 보여줄 작도 화면 번호 — 교사·기본 학생은 server nav, 연습 모드 학생만 local.
  const effectiveProblemNum: number | null = canEdit
    ? serverNav
    : practice
    ? studentLocalNav
    : serverNav;

  const lines = useMemo(() => getBingoLines(state), [state]);

  // 작도 화면 — 교사/학생 분기:
  //   교사: onBack = onGoToProblem(null) (서버 nav 해제, 학생 동시 복귀)
  //   학생 + practice: onBack = setStudentLocalNav(null) (자기만 복귀)
  //   학생 + 비practice: onBack undefined → "교사 화면 따라가는 중" 배지
  if (effectiveProblemNum != null) {
    const handleBack = canEdit
      ? () => onGoToProblem(null)
      : practice
      ? () => setStudentLocalNav(null)
      : undefined;
    return <ProblemView num={effectiveProblemNum} onBack={handleBack} />;
  }

  // 셀의 작도 화면 진입 — 교사는 서버 nav, 학생+연습은 자기 local.
  function openProblem(num: number) {
    setSelectedCell(null);
    if (canEdit) onGoToProblem(num);
    else if (practice) setStudentLocalNav(num);
  }

  const canOpenProblem = canEdit || practice;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* 빙고판 + 라인 */}
        <div className="space-y-3">
          <BingoGrid state={state} canEdit={canEdit} onCellClick={setSelectedCell} />
          <LinesStrip linesText={lines.map((l) => `${TEAMS[l.team].name} ${l.type}`)} lines={lines} />
        </div>

        {/* 팀 카드 */}
        <div className="space-y-2">
          {TEAM_IDS.map((tid) => (
            <TeamCard key={tid} state={state} teamId={tid} />
          ))}
          {canEdit ? (
            <button
              type="button"
              onClick={() => onReset()}
              className="mt-2 w-full rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25"
            >
              🗑 빙고 초기화
            </button>
          ) : null}
        </div>
      </div>

      {selectedCell != null ? (
        <CellModal
          num={selectedCell}
          state={state}
          canEdit={canEdit}
          canOpenProblem={canOpenProblem}
          onClose={() => setSelectedCell(null)}
          onChangeCond={onChangeCond}
          onOpenProblem={openProblem}
        />
      ) : null}
    </div>
  );
}

// ─── 그리드 ────────────────────────────────────────────────
function BingoGrid({
  state,
  canEdit,
  onCellClick,
}: {
  state: BingoState;
  canEdit: boolean;
  onCellClick: (num: number) => void;
}) {
  return (
    <div className="rounded-xl border border-cyan-900/50 bg-slate-950/60 p-2">
      <div className="grid grid-cols-5 gap-1.5">
        {GRID.flat().map((num) => (
          <Cell key={num} num={num} state={state} canEdit={canEdit} onClick={() => onCellClick(num)} />
        ))}
      </div>
    </div>
  );
}

function Cell({
  num,
  state,
  canEdit,
  onClick,
}: {
  num: number;
  state: BingoState;
  canEdit: boolean;
  onClick: () => void;
}) {
  const cell = getCell(state, num);
  const owner = effectiveOwner(cell);
  const perm = isCellComplete(cell);
  const ownerTeam: Team | null = owner ? TEAMS[owner] : null;
  const problem = PROBLEMS[num];

  const style: React.CSSProperties = ownerTeam
    ? {
        background: ownerTeam.bg,
        borderColor: ownerTeam.color,
        boxShadow: perm
          ? `0 0 14px #fbbf2455, 0 0 6px ${ownerTeam.color}44`
          : `0 0 8px ${ownerTeam.color}33`,
      }
    : {};

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex aspect-square min-h-[78px] flex-col items-stretch justify-between rounded-lg border-2 border-cyan-900/60 bg-slate-950 p-1.5 text-left transition " +
        (canEdit ? "cursor-pointer hover:border-cyan-400" : "cursor-pointer hover:border-cyan-500")
      }
      style={style}
      aria-label={`문제 ${num}`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[10px] font-bold text-slate-500">{num}</span>
        {ownerTeam ? (
          <span
            className="rounded px-1 text-[9px] font-extrabold"
            style={{ background: ownerTeam.bg, color: ownerTeam.color }}
          >
            {ownerTeam.name}
            {perm ? "🔒" : ""}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-base font-extrabold text-sky-300">{problem.L}L</span>
        <span className="text-[11px] font-bold text-slate-400">{problem.E}E</span>
      </div>
      <div className="flex items-center justify-center gap-0.5">
        {(["L", "E", "V"] as CondKey[]).map((k) => (
          <CondDot key={k} k={k} team={cell[k]} />
        ))}
      </div>
    </button>
  );
}

function CondDot({ k, team }: { k: CondKey; team: TeamId | null }) {
  if (!team) {
    return (
      <span className="rounded border border-slate-700 bg-slate-900 px-1 text-[8px] font-bold text-slate-600">
        {k}
      </span>
    );
  }
  const t = TEAMS[team];
  return (
    <span
      className="rounded border px-1 text-[8px] font-extrabold"
      style={{ background: t.bg, color: t.color, borderColor: t.border }}
    >
      {k}
    </span>
  );
}

// ─── 팀 카드 ──────────────────────────────────────────────
function TeamCard({ state, teamId }: { state: BingoState; teamId: TeamId }) {
  const team = TEAMS[teamId];
  const stats = getTeamStats(state, teamId);
  return (
    <div
      className="rounded-lg border-2 px-3 py-2"
      style={{ borderColor: team.border, background: team.bg }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-extrabold" style={{ color: team.color }}>
          {team.name}
        </span>
        <span>
          <span className="text-xl font-extrabold" style={{ color: team.color }}>
            {stats.score}
          </span>
          <span className="ml-1 text-[10px] font-bold text-slate-400">점</span>
        </span>
      </div>
      <div className="mt-0.5 text-[10px] text-slate-400">
        조건 {stats.condCount}개 · 소유 {stats.ownedCells}칸
        {stats.bingoCount > 0 ? ` · 🎊 빙고 ${stats.bingoCount}줄` : ""}
      </div>
    </div>
  );
}

// ─── 라인 스트립 ──────────────────────────────────────────
function LinesStrip({
  linesText,
  lines,
}: {
  linesText: string[];
  lines: { team: TeamId; type: string }[];
}) {
  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-xs text-slate-500">
        아직 완성된 빙고가 없어요.
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2">
      {lines.map((l, i) => {
        const t = TEAMS[l.team];
        return (
          <span
            key={`${l.team}-${l.type}-${i}`}
            className="rounded-md border px-2 py-0.5 text-[11px] font-extrabold"
            style={{ background: t.bg, color: t.color, borderColor: t.border }}
            title={linesText[i]}
          >
            🎊 {t.name} {l.type}
          </span>
        );
      })}
    </div>
  );
}

// ─── 셀 모달: L/E/V 팀 배정 (잠금 시 보기 전용) ──────────────────
function CellModal({
  num,
  state,
  canEdit,
  canOpenProblem,
  onClose,
  onChangeCond,
  onOpenProblem,
}: {
  num: number;
  state: BingoState;
  canEdit: boolean;
  canOpenProblem: boolean;
  onClose: () => void;
  onChangeCond: (num: number, key: CondKey, team: TeamId | null) => Promise<void>;
  onOpenProblem: (num: number) => void;
}) {
  const cell = getCell(state, num);
  const problem = PROBLEMS[num];
  const owner = effectiveOwner(cell);
  const ownerTeam = owner ? TEAMS[owner] : null;
  const interactive = canEdit && !cell.locked;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-5 text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
              문제 #{num}
            </div>
            <h3 className="mt-1 text-xl font-bold">
              목표 {problem.L}L · {problem.E}E
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/10 hover:text-slate-100"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        {canOpenProblem ? (
          <button
            type="button"
            onClick={() => onOpenProblem(num)}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/30"
          >
            🛠️ 작도 화면으로
          </button>
        ) : null}

        {cell.locked && ownerTeam ? (
          <div
            className="mt-3 rounded-lg border-2 px-3 py-2 text-sm font-bold"
            style={{ background: ownerTeam.bg, borderColor: ownerTeam.color, color: ownerTeam.color }}
          >
            🔒 잠김 — 모든 조건이 채워졌습니다. <span>{ownerTeam.name}</span> 의 칸으로 확정.
          </div>
        ) : ownerTeam ? (
          <div className="mt-3 text-xs text-slate-400">
            현재 색: <span className="font-bold" style={{ color: ownerTeam.color }}>{ownerTeam.name}</span> · 다른 조가 다음 조건을 차지하면 색이 바뀝니다.
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {(["L", "E", "V"] as CondKey[]).map((k) => (
            <CondRow
              key={k}
              k={k}
              value={cell[k]}
              canEdit={interactive}
              onSet={(t) => onChangeCond(num, k, t)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CondRow({
  k,
  value,
  canEdit,
  onSet,
}: {
  k: CondKey;
  value: TeamId | null;
  canEdit: boolean;
  onSet: (t: TeamId | null) => void;
}) {
  const label = k === "L" ? "L 조건" : k === "E" ? "E 조건" : "🌟 V 조건";
  return (
    <div>
      <div className="text-xs font-semibold text-slate-300">{label}</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <TeamPill
          active={value == null}
          disabled={!canEdit}
          onClick={() => onSet(null)}
          label="미정"
          color="#94a3b8"
        />
        {TEAM_IDS.map((tid) => {
          const t = TEAMS[tid];
          return (
            <TeamPill
              key={tid}
              active={value === tid}
              disabled={!canEdit}
              onClick={() => onSet(tid)}
              label={t.name}
              color={t.color}
              bg={t.bg}
            />
          );
        })}
      </div>
    </div>
  );
}

function TeamPill({
  active,
  disabled,
  onClick,
  label,
  color,
  bg,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  color: string;
  bg?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-md border px-2.5 py-1 text-xs font-bold transition disabled:cursor-default " +
        (active ? "" : "opacity-50 hover:opacity-100")
      }
      style={{
        borderColor: color,
        color: active ? "#0f172a" : color,
        background: active ? color : bg ?? "transparent",
      }}
    >
      {label}
    </button>
  );
}
