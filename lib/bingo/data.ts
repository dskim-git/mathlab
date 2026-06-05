// 작도 빙고 정적 데이터: 25문제 메타 + 4팀 + GeoGebra 보조 링크.
//
// 원본: c:/git-math/math/activities/gifted/euclidea_bingo.py (PROBLEMS / TEAMS / GEOGEBRA_CALC_URLS).
// 자체 ConstructionBoard 시드/검증은 별도 라운드(C-3) 에서 추가.

export type TeamId = 1 | 2 | 3 | 4;

export type Team = {
  id: TeamId;
  name: string;
  /** 진한 색 — 텍스트·테두리·점수 */
  color: string;
  /** 부드러운 배경 (rgba) */
  bg: string;
  /** 칩 테두리 */
  border: string;
};

export const TEAMS: Record<TeamId, Team> = {
  1: { id: 1, name: "1조", color: "#f87171", bg: "rgba(248,113,113,0.18)", border: "#f87171" },
  2: { id: 2, name: "2조", color: "#38bdf8", bg: "rgba(56,189,248,0.18)", border: "#38bdf8" },
  3: { id: 3, name: "3조", color: "#4ade80", bg: "rgba(74,222,128,0.18)", border: "#4ade80" },
  4: { id: 4, name: "4조", color: "#c084fc", bg: "rgba(192,132,252,0.18)", border: "#c084fc" },
};
export const TEAM_IDS: TeamId[] = [1, 2, 3, 4];

export type Problem = {
  num: number;
  /** 목표 도형(선·원 합) 개수 */
  L: number;
  /** 목표 동작 횟수 */
  E: number;
  /** 보조 GeoGebra 풀이 링크 */
  geogebraUrl?: string;
};

export const PROBLEMS: Record<number, Problem> = {
  1:  { num: 1,  L: 4, E: 8,  geogebraUrl: "https://www.geogebra.org/calculator/ga8pkmee" },
  2:  { num: 2,  L: 3, E: 5,  geogebraUrl: "https://www.geogebra.org/calculator/ep7wjv4f" },
  3:  { num: 3,  L: 2, E: 4,  geogebraUrl: "https://www.geogebra.org/calculator/segp6e92" },
  4:  { num: 4,  L: 3, E: 3,  geogebraUrl: "https://www.geogebra.org/calculator/x7xmayph" },
  5:  { num: 5,  L: 5, E: 7,  geogebraUrl: "https://www.geogebra.org/calculator/cacmctnz" },
  6:  { num: 6,  L: 6, E: 7,  geogebraUrl: "https://www.geogebra.org/calculator/byu9dcq3" },
  7:  { num: 7,  L: 4, E: 10, geogebraUrl: "https://www.geogebra.org/calculator/kbb4musk" },
  8:  { num: 8,  L: 3, E: 6,  geogebraUrl: "https://www.geogebra.org/calculator/zn7ygwrr" },
  9:  { num: 9,  L: 2, E: 5,  geogebraUrl: "https://www.geogebra.org/calculator/xgycthvh" },
  10: { num: 10, L: 6, E: 11, geogebraUrl: "https://www.geogebra.org/calculator/ckbdj36s" },
  11: { num: 11, L: 6, E: 7,  geogebraUrl: "https://www.geogebra.org/calculator/wvzvn7cp" },
  12: { num: 12, L: 2, E: 6,  geogebraUrl: "https://www.geogebra.org/calculator/ytgu62dp" },
  13: { num: 13, L: 3, E: 6,  geogebraUrl: "https://www.geogebra.org/calculator/hrjv42r8" },
  14: { num: 14, L: 3, E: 3,  geogebraUrl: "https://www.geogebra.org/calculator/eszrzhgu" },
  15: { num: 15, L: 6, E: 10, geogebraUrl: "https://www.geogebra.org/calculator/eqgakujy" },
  16: { num: 16, L: 3, E: 5,  geogebraUrl: "https://www.geogebra.org/calculator/vhnahfmd" },
  17: { num: 17, L: 2, E: 3,  geogebraUrl: "https://www.geogebra.org/calculator/msrr3zvu" },
  18: { num: 18, L: 5, E: 6,  geogebraUrl: "https://www.geogebra.org/calculator/h99jdexn" },
  19: { num: 19, L: 3, E: 6,  geogebraUrl: "https://www.geogebra.org/calculator/uzrvbykv" },
  20: { num: 20, L: 3, E: 5,  geogebraUrl: "https://www.geogebra.org/calculator/rca2tyje" },
  21: { num: 21, L: 7, E: 10, geogebraUrl: "https://www.geogebra.org/calculator/zdepjgnt" },
  22: { num: 22, L: 3, E: 5,  geogebraUrl: "https://www.geogebra.org/calculator/mahcyjng" },
  23: { num: 23, L: 4, E: 6,  geogebraUrl: "https://www.geogebra.org/calculator/aaccjjxn" },
  24: { num: 24, L: 3, E: 3,  geogebraUrl: "https://www.geogebra.org/calculator/zt9ekaw9" },
  25: { num: 25, L: 7, E: 8,  geogebraUrl: "https://www.geogebra.org/calculator/gfjjqazq" },
};

export const GRID: number[][] = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25],
];
