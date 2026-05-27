import type { ComponentType } from "react";
import RepPermPassword from "./rep-perm-password/RepPermPassword";
import RepPermMorse from "./rep-perm-morse/RepPermMorse";
import RepPermTiles from "./rep-perm-tiles/RepPermTiles";
import RepPermDice from "./rep-perm-dice/RepPermDice";
import TricolorFlagPerm from "./tricolor-flag/TricolorFlagPerm";
import CubePathPerm from "./cube-path/CubePathPerm";
import WordDiamondPerm from "./word-diamond/WordDiamondPerm";
import RepCombStarsBars from "./rep-comb-stars-bars/RepCombStarsBars";
import PolyExpandTermCount from "./poly-expand-terms/PolyExpandTermCount";
import FunctionCountLab from "./function-count/FunctionCountLab";
import BinomialCoeffViz from "./binomial-coeff-viz/BinomialCoeffViz";
import BinomialTheoremApply from "./binomial-theorem-apply/BinomialTheoremApply";
import GaltonBoard from "./galton-board/GaltonBoard";

// 이식 완료된 미니활동: activitySlug(임포트된 "<folder>/<slug>") → React 컴포넌트.
// 자체 렌더(추가 props 불필요). 등록되지 않은 슬러그는 ActivityRenderer 가 '준비 중'으로 표시.
// (probability-simulator 는 제출 props 가 많아 ActivityRenderer 에서 별도 처리한다.)
export const ACTIVITY_REGISTRY: Record<string, ComponentType> = {
  "probability_new/mini/rep_perm_password": RepPermPassword,
  "probability_new/mini/rep_perm_morse": RepPermMorse,
  "probability_new/mini/rep_perm_tiles": RepPermTiles,
  "probability_new/mini/rep_perm_dice": RepPermDice,
  "probability_new/mini/tricolor_flag_perm": TricolorFlagPerm,
  "probability_new/mini/cube_path_perm": CubePathPerm,
  "probability_new/mini/word_diamond_perm": WordDiamondPerm,
  "probability_new/mini/rep_comb_stars_bars": RepCombStarsBars,
  "probability_new/mini/poly_expand_term_count": PolyExpandTermCount,
  "probability_new/mini/function_count_lab": FunctionCountLab,
  "probability_new/mini/binomial_coeff_viz": BinomialCoeffViz,
  "probability_new/mini/binomial_theorem_apply": BinomialTheoremApply,
  "probability_new/mini/galton_board": GaltonBoard,
};
