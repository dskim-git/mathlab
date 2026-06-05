"use client";

// 빙고판 + 팀 카드 + 셀 제어 모달 + Realtime 동기화.
//
// - 방의 state(JSONB) 가 진실 source. 교사가 update → DB → Realtime postgres_changes
//   이벤트 → 모든 참여자 화면 자동 갱신.
// - 셀 클릭: 교사·관리자만 모달 열림 + 편집 가능. 학생은 클릭해도 모달은 보기 전용.
// - 모달 내 변경 시 즉시 DB save (낙관적 update — 실패하면 alert).

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
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
  applyCondChange,
  effectiveOwner,
  emptyState,
  getBingoLines,
  getCell,
  getTeamStats,
  isCellComplete,
} from "@/lib/bingo/state";
import { type BingoRoom, updateRoomState } from "@/lib/bingo/rooms";

type Props = {
  room: BingoRoom;
  canEdit: boolean;
};

export default function BingoBoard({ room, canEdit }: Props) {
  const initialState = useMemo<BingoState>(() => {
    const s = room.state as Partial<BingoState>;
    return s && typeof s === "object" && "probs" in s ? (s as BingoState) : emptyState();
  }, [room.state]);

  const [state, setState] = useState<BingoState>(initialState);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [error, setError] = useState("");

  // ── Realtime 구독: 이 방의 state 변경을 모든 참여자에게 전파 ────────
  useEffect(() => {
    const channel = supabase
      .channel(`bingo_room_${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bingo_rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const newRow = payload.new as { state?: BingoState };
          if (newRow?.state && typeof newRow.state === "object") {
            setState(newRow.state);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id]);

  // ── 조건 변경(L/E/V): applyCondChange 가 lastTeam·locked 자동 처리.
  const changeCond = useCallback(
    async (num: number, key: CondKey, team: TeamId | null) => {
      const prev = getCell(state, num);
      const nextCell = applyCondChange(prev, key, team);
      if (nextCell === prev) return; // 잠금 등 변화 없음
      const nextState: BingoState = {
        ...state,
        probs: { ...state.probs, [num]: nextCell },
      };
      setState(nextState);
      try {
        await updateRoomState(supabase, room.id, nextState as unknown as Record<string, unknown>);
      } catch (e) {
        setError((e as Error).message);
        setState(state);
      }
    },
    [room.id, state],
  );

  const handleReset = useCallback(async () => {
    if (!confirm("이 빙고 방의 모든 진행 상태를 초기화하시겠어요?")) return;
    const empty = emptyState();
    setState(empty);
    try {
      await updateRoomState(supabase, room.id, empty as unknown as Record<string, unknown>);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [room.id]);

  const lines = useMemo(() => getBingoLines(state), [state]);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
          ⚠️ {error}
        </div>
      ) : null}

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
              onClick={handleReset}
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
          onClose={() => setSelectedCell(null)}
          onChangeCond={changeCond}
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
  onClose,
  onChangeCond,
}: {
  num: number;
  state: BingoState;
  canEdit: boolean;
  onClose: () => void;
  onChangeCond: (num: number, key: CondKey, team: TeamId | null) => Promise<void>;
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

        {problem.geogebraUrl ? (
          <a
            href={problem.geogebraUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/25"
          >
            🔗 GeoGebra 풀이 페이지로
          </a>
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
