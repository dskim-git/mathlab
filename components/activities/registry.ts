import type { ComponentType } from "react";

// 1-1 순열과 조합
import RepPermPassword from "./probability/1-1-permutations-combinations/rep-perm-password/RepPermPassword";
import RepPermMorse from "./probability/1-1-permutations-combinations/rep-perm-morse/RepPermMorse";
import RepPermTiles from "./probability/1-1-permutations-combinations/rep-perm-tiles/RepPermTiles";
import RepPermDice from "./probability/1-1-permutations-combinations/rep-perm-dice/RepPermDice";
import TricolorFlagPerm from "./probability/1-1-permutations-combinations/tricolor-flag/TricolorFlagPerm";
import CubePathPerm from "./probability/1-1-permutations-combinations/cube-path/CubePathPerm";
import WordDiamondPerm from "./probability/1-1-permutations-combinations/word-diamond/WordDiamondPerm";
import RepCombStarsBars from "./probability/1-1-permutations-combinations/rep-comb-stars-bars/RepCombStarsBars";
import PolyExpandTermCount from "./probability/1-1-permutations-combinations/poly-expand-terms/PolyExpandTermCount";
import FunctionCountLab from "./probability/1-1-permutations-combinations/function-count/FunctionCountLab";

// 1-2 이항정리
import BinomialCoeffViz from "./probability/1-2-binomial-theorem/binomial-coeff-viz/BinomialCoeffViz";
import BinomialTheoremApply from "./probability/1-2-binomial-theorem/binomial-theorem-apply/BinomialTheoremApply";
import GaltonBoard from "./probability/1-2-binomial-theorem/galton-board/GaltonBoard";
import PascalTriangleProperties from "./probability/1-2-binomial-theorem/pascal-triangle-properties/PascalTriangleProperties";
import PolygonCountCircles from "./probability/1-2-binomial-theorem/polygon-count-circles/PolygonCountCircles";
import PascalFractal from "./probability/1-2-binomial-theorem/pascal-fractal/PascalFractal";

// 이식 완료된 미니활동: activitySlug(임포트된 "<folder>/<slug>") → React 컴포넌트.
// 자체 렌더(추가 props 불필요). 등록되지 않은 슬러그는 ActivityRenderer 가 '준비 중'으로 표시.
// (probability-simulator 는 제출 props 가 많아 ActivityRenderer 에서 별도 처리한다.)
// 파일은 교과/중단원 폴더로 정리: components/activities/<교과>/<중단원>/<활동>/.
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
  "probability_new/mini/pascal_triangle_properties": PascalTriangleProperties,
  "probability_new/mini/polygon_count_circles": PolygonCountCircles,
  "probability_new/mini/pascal_fractal": PascalFractal,
};
