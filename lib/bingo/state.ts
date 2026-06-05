// 작도 빙고의 진행 상태 — bingo_rooms.state JSONB 에 그대로 저장.
//
// 모델:
//   state.probs[num] = { L, E, V, lastTeam, locked }
//   - L, E, V: TeamId | null (각 조건을 차지한 팀)
//   - lastTeam: 가장 최근에 어떤 조건을 차지한 팀 — 셀 색·owner 가 이걸 따름.
//     (예: 1조가 L 차지 → lastTeam=1; 그 후 2조가 E 차지 → lastTeam=2; …)
//   - locked: 모든 조건(L+E+V) 이 채워진 순간 true. 그 이후엔 조건 변경 불가
//     → owner(=lastTeam) 가 영구 고정.
//
// 점수: L/E/V 각 10점, 빙고 라인(행·열·대각선) 50점.

import { GRID, type TeamId } from "./data";

export type CondKey = "L" | "E" | "V";

export type CellState = {
  L: TeamId | null;
  E: TeamId | null;
  V: TeamId | null;
  /** 가장 최근에 조건을 채운 팀. 셀 색·owner 표시·빙고 라인 계산의 기준. */
  lastTeam: TeamId | null;
  /** 모든 조건이 채워진 시점에 true → 그 이후 변경 불가, owner 영구 고정. */
  locked: boolean;
};

export type BingoNav = {
  /** null = 빙고판, number = 그 문제의 작도 화면. 모든 참여자가 같은 화면을 봄. */
  problemNum: number | null;
};

export type BingoState = {
  probs: Record<number, CellState>;
  /** 방장이 어느 화면을 보고 있는지 — Realtime 으로 모든 참여자에게 전파. */
  nav?: BingoNav;
};

export function emptyState(): BingoState {
  return { probs: {}, nav: { problemNum: null } };
}

export function getNav(state: BingoState): BingoNav {
  return state.nav ?? { problemNum: null };
}

export function emptyCell(): CellState {
  return { L: null, E: null, V: null, lastTeam: null, locked: false };
}

export function getCell(state: BingoState, num: number): CellState {
  const c = state.probs[num];
  if (!c) return emptyCell();
  // 옛 스키마(owner) 호환 — lastTeam 없이 저장된 행도 안전하게 읽기.
  return {
    L: c.L ?? null,
    E: c.E ?? null,
    V: c.V ?? null,
    lastTeam: c.lastTeam ?? null,
    locked: c.locked ?? false,
  };
}

export function effectiveOwner(cell: CellState): TeamId | null {
  return cell.lastTeam;
}

/** 모든 조건(L/E/V) 이 채워진 상태. */
export function isCellComplete(cell: CellState): boolean {
  return cell.L != null && cell.E != null && cell.V != null;
}

/**
 * 한 조건을 팀(또는 미정)으로 설정한 결과 셀을 계산.
 * - locked 면 그대로 반환 (변경 불가).
 * - 팀을 설정한 경우 lastTeam = 그 팀 (가장 최근 활동).
 * - 미정으로 되돌리는 경우 lastTeam 유지 (의미 있는 "취소").
 * - 변경 결과 모든 조건이 채워지면 locked = true.
 */
export function applyCondChange(
  cell: CellState,
  key: CondKey,
  team: TeamId | null,
): CellState {
  if (cell.locked) return cell;
  const next: CellState = { ...cell, [key]: team };
  if (team != null) next.lastTeam = team;
  if (isCellComplete(next)) next.locked = true;
  return next;
}

export type BingoLine = {
  team: TeamId;
  /** "1행" / "3열" / "↘대각선" / "↗대각선" */
  type: string;
};

export function getBingoLines(state: BingoState): BingoLine[] {
  const lines: BingoLine[] = [];
  const ownerOf = (n: number) => effectiveOwner(getCell(state, n));

  GRID.forEach((row, r) => {
    const os = row.map(ownerOf);
    if (os[0] != null && os.every((o) => o === os[0])) {
      lines.push({ team: os[0] as TeamId, type: `${r + 1}행` });
    }
  });
  for (let c = 0; c < 5; c++) {
    const os = GRID.map((row) => ownerOf(row[c]));
    if (os[0] != null && os.every((o) => o === os[0])) {
      lines.push({ team: os[0] as TeamId, type: `${c + 1}열` });
    }
  }
  {
    const os = GRID.map((row, i) => ownerOf(row[i]));
    if (os[0] != null && os.every((o) => o === os[0])) {
      lines.push({ team: os[0] as TeamId, type: "↘대각선" });
    }
  }
  {
    const os = GRID.map((row, i) => ownerOf(row[4 - i]));
    if (os[0] != null && os.every((o) => o === os[0])) {
      lines.push({ team: os[0] as TeamId, type: "↗대각선" });
    }
  }
  return lines;
}

export type TeamStats = {
  team: TeamId;
  score: number;
  condCount: number;
  ownedCells: number;
  bingoCount: number;
};

export function getTeamStats(state: BingoState, team: TeamId): TeamStats {
  let condCount = 0;
  let ownedCells = 0;
  for (const cell of Object.values(state.probs)) {
    const c = getCell({ probs: { 0: cell } } as BingoState, 0); // 옛 호환 정규화
    if (c.L === team) condCount++;
    if (c.E === team) condCount++;
    if (c.V === team) condCount++;
    if (effectiveOwner(c) === team) ownedCells++;
  }
  const bingoCount = getBingoLines(state).filter((l) => l.team === team).length;
  const score = condCount * 10 + bingoCount * 50;
  return { team, score, condCount, ownedCells, bingoCount };
}
