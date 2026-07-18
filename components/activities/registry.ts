import type { ComponentType } from "react";

// ─── 공통수학 ──────────────────────────────────────────────
// [1] 다항식 — (1) 다항식의 연산
import PolySortGame from "./common/1-1-polynomials/poly-sort-game/PolySortGame";
import PolyAddSubGame from "./common/1-1-polynomials/poly-add-sub-game/PolyAddSubGame";
import PolyMulExpand from "./common/1-1-polynomials/poly-mul-expand/PolyMulExpand";
import GelosiaMul from "./common/1-1-polynomials/gelosia-mul/GelosiaMul";
import AlgebraTileFormulas from "./common/1-1-polynomials/algebra-tile-formulas/AlgebraTileFormulas";
import SyntheticDivPrinciple from "./common/1-1-polynomials/synthetic-div-principle/SyntheticDivPrinciple";
import RemainderSameExpressions from "./common/1-1-polynomials/remainder-same-expressions/RemainderSameExpressions";
import SyntheticDivSpreadsheet from "./common/1-1-polynomials/synthetic-div-spreadsheet/SyntheticDivSpreadsheet";
import GelosiaDiv from "./common/1-1-polynomials/gelosia-div/GelosiaDiv";
// [1] 다항식 — (2) 나머지정리와 인수분해
import IdentityGame from "./common/1-2-remainder-factorize/identity-game/IdentityGame";
import UndefinedCoefficients from "./common/1-2-remainder-factorize/undefined-coefficients/UndefinedCoefficients";
import PowerRemainderBooster from "./common/1-2-remainder-factorize/power-remainder-booster/PowerRemainderBooster";
import FactorCandidateRadar from "./common/1-2-remainder-factorize/factor-candidate-radar/FactorCandidateRadar";
import PrimeCompositeLock from "./common/1-2-remainder-factorize/prime-composite-lock/PrimeCompositeLock";
import FactorPathfinderArcade from "./common/1-2-remainder-factorize/factor-pathfinder-arcade/FactorPathfinderArcade";
// [2] 방정식과 부등식 — (1) 복소수와 이차방정식
import ComplexNumberTerms from "./common/2-1-complex-numbers/complex-number-terms/ComplexNumberTerms";
import ComplexArithmeticGame from "./common/2-1-complex-numbers/complex-arithmetic-game/ComplexArithmeticGame";
import ImaginaryUnitCycle from "./common/2-1-complex-numbers/imaginary-unit-cycle/ImaginaryUnitCycle";
import NegativeSqrtTrap from "./common/2-1-complex-numbers/negative-sqrt-trap/NegativeSqrtTrap";
import ConjugateRootsExplorer from "./common/2-1-complex-numbers/conjugate-roots-explorer/ConjugateRootsExplorer";
import VietaRootsGame from "./common/2-1-complex-numbers/vieta-roots-game/VietaRootsGame";
// [2] 방정식과 부등식 — (2) 이차방정식과 이차함수
import QuadFuncEquationExplorer from "./common/2-2-quadratic-function/quad-func-equation-explorer/QuadFuncEquationExplorer";
import QuadLinePositionExplorer from "./common/2-2-quadratic-function/quad-line-position-explorer/QuadLinePositionExplorer";
import QuadMaxminExplorer from "./common/2-2-quadratic-function/quad-maxmin-explorer/QuadMaxminExplorer";
import QuadMaxminReallife from "./common/2-2-quadratic-function/quad-maxmin-reallife/QuadMaxminReallife";
import QuadBridgeCurveFit from "./common/2-2-quadratic-function/quad-bridge-curve-fit/QuadBridgeCurveFit";
// [2] 방정식과 부등식 — (3) 여러 가지 방정식과 부등식
import CubicQuarticEquationExplorer from "./common/2-3-equation-inequality/cubic-quartic-equation-explorer/CubicQuarticEquationExplorer";
import EquationHistoryFlash from "./common/2-3-equation-inequality/equation-history-flash/EquationHistoryFlash";
import OmegaLawExplorer from "./common/2-3-equation-inequality/omega-law-explorer/OmegaLawExplorer";
import BabylonianCubicSolver from "./common/2-3-equation-inequality/babylonian-cubic-solver/BabylonianCubicSolver";
import SimultaneousQuadraticQuiz from "./common/2-3-equation-inequality/simultaneous-quadratic-quiz/SimultaneousQuadraticQuiz";
import LinearIneqSystemExplorer from "./common/2-3-equation-inequality/linear-ineq-system-explorer/LinearIneqSystemExplorer";
import AbsValueIneqExplorer from "./common/2-3-equation-inequality/abs-value-ineq-explorer/AbsValueIneqExplorer";
import QuadIneqGraphExplorer from "./common/2-3-equation-inequality/quad-ineq-graph-explorer/QuadIneqGraphExplorer";
import QuadIneqMaxminReallife from "./common/2-3-equation-inequality/quad-ineq-maxmin-reallife/QuadIneqMaxminReallife";
// [3] 경우의 수 — (1) 경우의 수
import DiceCountingExplorer from "./common/3-1-counting/dice-counting-explorer/DiceCountingExplorer";
import AdditionMultiplicationRule from "./common/3-1-counting/addition-multiplication-rule/AdditionMultiplicationRule";
import PermutationReallifeExplorer from "./common/3-1-counting/permutation-reallife-explorer/PermutationReallifeExplorer";
import PermutationIdentityExplorer from "./common/3-1-counting/permutation-identity-explorer/PermutationIdentityExplorer";
import CombinationReallifeExplorer from "./common/3-1-counting/combination-reallife-explorer/CombinationReallifeExplorer";
import PermCombGrowthRace from "./common/3-1-counting/perm-comb-growth-race/PermCombGrowthRace";
import CombinationIdentityExplorer from "./common/3-1-counting/combination-identity-explorer/CombinationIdentityExplorer";
import CombinationApplicationExplorer from "./common/3-1-counting/combination-application-explorer/CombinationApplicationExplorer";
import CountingDailySumin from "./common/3-1-counting/counting-daily-sumin/CountingDailySumin";
import MapColoringExplorer from "./common/3-1-counting/map-coloring-explorer/MapColoringExplorer";
import MatrixPixelExplorer from "./common/4-1-matrix/matrix-pixel-explorer/MatrixPixelExplorer";
import MatrixEqualityGame from "./common/4-1-matrix/matrix-equality-game/MatrixEqualityGame";
import MatrixOpsExplore from "./common/4-1-matrix/matrix-ops-explore/MatrixOpsExplore";
import MatrixMulReallife from "./common/4-1-matrix/matrix-mul-reallife/MatrixMulReallife";
import MatrixCardDiceGame from "./common/4-1-matrix/matrix-card-dice-game/MatrixCardDiceGame";
import MatrixCipherExplorer from "./common/4-1-matrix/matrix-cipher-explorer/MatrixCipherExplorer";
import MatrixPopulationMigration from "./common/4-1-matrix/matrix-population-migration/MatrixPopulationMigration";

// ─── 공통수학2 ──────────────────────────────────────────────
// [1] 도형의 방정식 — (1) 평면좌표 · 선분의 내분
import TwoPointDistanceLab from "./common2/1-1-segment-division/two-point-distance/TwoPointDistanceLab";
import InternalDivisionLab from "./common2/1-1-segment-division/internal-division-lab/InternalDivisionLab";
import CentroidLab from "./common2/1-1-segment-division/centroid-lab/CentroidLab";
import BlockStackingLab from "./common2/1-1-segment-division/block-stacking-lab/BlockStackingLab";

// ─── 경제수학 ──────────────────────────────────────────────
// [1] 수와 생활 속 경제 — 1-1 생활 속 경제지표
import StockIndexLab from "./economics/1-1-economic-indicators/stock-index-lab/StockIndexLab";
import GdpGrowthLab from "./economics/1-1-economic-indicators/gdp-growth-lab/GdpGrowthLab";

// ─── 확률과통계 ────────────────────────────────────────────
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
import MorraGame from "./probability/1-2-binomial-theorem/morra-game/MorraGame";

// 2-1 확률의 개념과 활용
import TrialEventVocabGame from "./probability/2-1-prob-concept/trial-event-vocab-game/TrialEventVocabGame";
import WeirdDiceSim from "./probability/2-1-prob-concept/weird-dice-sim/WeirdDiceSim";
import StatisticalProbSim from "./probability/2-1-prob-concept/statistical-prob-sim/StatisticalProbSim";
import StatProbExperiment from "./probability/2-1-prob-concept/stat-prob-experiment/StatProbExperiment";
import DiceLab from "./probability/2-1-prob-concept/dice-lab/DiceLab";
import BuffonNeedle from "./probability/2-1-prob-concept/buffon-needle/BuffonNeedle";
import BertrandParadox from "./probability/2-1-prob-concept/bertrand-paradox/BertrandParadox";
import ProbBasicProperties from "./probability/2-1-prob-concept/prob-basic-properties/ProbBasicProperties";

// 2-1-2 확률의 덧셈정리
import ProbAdditionTheorem from "./probability/2-1-prob-concept/prob-addition-theorem/ProbAdditionTheorem";
import BirthdayParadoxMini from "./probability/2-1-prob-concept/birthday-paradox-mini/BirthdayParadoxMini";
import SimpsonsParadoxMini from "./probability/2-1-prob-concept/simpsons-paradox-mini/SimpsonsParadoxMini";

// 2-2-1 조건부확률
import OddPrimeConditional from "./probability/2-2-conditional-prob/odd-prime-conditional/OddPrimeConditional";
import ConditionalProbExplorer from "./probability/2-2-conditional-prob/conditional-prob-explorer/ConditionalProbExplorer";
import BayesTheoremMini from "./probability/2-2-conditional-prob/bayes-theorem-mini/BayesTheoremMini";
import MontyHallMini from "./probability/2-2-conditional-prob/monty-hall-mini/MontyHallMini";
import NontransitiveDice from "./probability/2-2-conditional-prob/nontransitive-dice/NontransitiveDice";

// 2-2-2 사건의 독립과 종속
import IndependenceVsExclusive from "./probability/2-2-conditional-prob/independence-vs-exclusive/IndependenceVsExclusive";
import DeMereLetter from "./probability/2-2-conditional-prob/de-mere-letter/DeMereLetter";
import IndependentTrialApply from "./probability/2-2-conditional-prob/independent-trial-apply/IndependentTrialApply";
import RandomResponseSurvey from "./probability/2-2-conditional-prob/random-response-survey/RandomResponseSurvey";
import MonteCarloSim from "./probability/2-2-conditional-prob/monte-carlo-sim/MonteCarloSim";

// 3-1-1 확률변수와 확률분포
import RvClassifyGame from "./probability/3-1-prob-distribution/rv-classify-game/RvClassifyGame";
import DistributionZoo from "./probability/3-1-prob-distribution/distribution-zoo/DistributionZoo";

// 3-1-2 이산확률변수의 기댓값과 표준편차
import SeunggyeongdoSim from "./probability/3-1-prob-distribution/seunggyeongdo-sim/SeunggyeongdoSim";
import AxbNumberLineLab from "./probability/3-1-prob-distribution/axb-number-line-lab/AxbNumberLineLab";
import RvMeanVarLab from "./probability/3-1-prob-distribution/rv-mean-var-lab/RvMeanVarLab";
import RvSpreadsheetLab from "./probability/3-1-prob-distribution/rv-spreadsheet-lab/RvSpreadsheetLab";

// 3-1-3 이항분포
import BinomialMeanVarExplorer from "./probability/3-1-prob-distribution/binomial-mean-var-explorer/BinomialMeanVarExplorer";
import BinomialGraphSim from "./probability/3-1-prob-distribution/binomial-graph-sim/BinomialGraphSim";
import LlnBinomialSimple from "./probability/3-1-prob-distribution/lln-binomial-simple/LlnBinomialSimple";
import HardyWeinbergMini from "./probability/3-1-prob-distribution/hardy-weinberg-mini/HardyWeinbergMini";

// 3-1-4 정규분포
import NormalCompareP5 from "./probability/3-1-prob-distribution/normal-compare-p5/NormalCompareP5";
import StdNormalTableQuiz from "./probability/3-1-prob-distribution/std-normal-table-quiz/StdNormalTableQuiz";
import BinomNormalApprox from "./probability/3-1-prob-distribution/binom-normal-approx/BinomNormalApprox";

// 3-2-1 모집단과 표본
import CensusOrSampleQuiz from "./probability/3-2-statistical-estimation/census-or-sample-quiz/CensusOrSampleQuiz";
import RandomSamplingLab from "./probability/3-2-statistical-estimation/random-sampling-lab/RandomSamplingLab";
import SamplingMethodsLab from "./probability/3-2-statistical-estimation/sampling-methods-lab/SamplingMethodsLab";

// 3-2-2 모평균의 추정
import PopSampleMeanLab from "./probability/3-2-statistical-estimation/pop-sample-mean-lab/PopSampleMeanLab";
import SampleVarianceN1Lab from "./probability/3-2-statistical-estimation/sample-variance-n1-lab/SampleVarianceN1Lab";
import SampleMeanDistLab from "./probability/3-2-statistical-estimation/sample-mean-dist-lab/SampleMeanDistLab";
import SamplingMeanRelationLab from "./probability/3-2-statistical-estimation/sampling-mean-relation-lab/SamplingMeanRelationLab";
import CiConfidenceTradeoffLab from "./probability/3-2-statistical-estimation/ci-confidence-tradeoff-lab/CiConfidenceTradeoffLab";
import CiMeaningLab from "./probability/3-2-statistical-estimation/ci-meaning-lab/CiMeaningLab";
import CiLengthFactorsLab from "./probability/3-2-statistical-estimation/ci-length-factors-lab/CiLengthFactorsLab";

// 3-2-3 모비율의 추정
import SampleProportionDistLab from "./probability/3-2-statistical-estimation/sample-proportion-dist-lab/SampleProportionDistLab";
import CiProportionLab from "./probability/3-2-statistical-estimation/ci-proportion-lab/CiProportionLab";
import CiProportionNewsLab from "./probability/3-2-statistical-estimation/ci-proportion-news-lab/CiProportionNewsLab";

// 교육과정 외(X) — 원순열·분할
import CircularPermAnchor from "./probability/X-extracurricular/circular-perm-anchor/CircularPermAnchor";
import PolygonEdgeArrangements from "./probability/X-extracurricular/polygon-edge-arrangements/PolygonEdgeArrangements";

// ─── 영재 ──────────────────────────────────────────────────
// [1] 기이한 소수의 세계
import SieveEratosthenes from "./gifted/1-primes/sieve-eratosthenes/SieveEratosthenes";
import MultiplicativeFunctions from "./gifted/1-primes/multiplicative-functions/MultiplicativeFunctions";
import ZetaExplorer from "./gifted/1-primes/zeta-explorer/ZetaExplorer";
import ZetaArithmetic from "./gifted/1-primes/zeta-arithmetic/ZetaArithmetic";
// [2] 시어핀스키 삼각형과 카오스 게임
import DoublePendulum from "./gifted/2-sierpinski-chaos/double-pendulum/DoublePendulum";
import LorenzButterfly from "./gifted/2-sierpinski-chaos/lorenz-butterfly/LorenzButterfly";
import LorenzAttractor from "./gifted/2-sierpinski-chaos/lorenz-attractor/LorenzAttractor";
import FractalDimensions from "./gifted/2-sierpinski-chaos/fractal-dimensions/FractalDimensions";
import SierpinskiProps from "./gifted/2-sierpinski-chaos/sierpinski-props/SierpinskiProps";
import ChaosgameAddress from "./gifted/2-sierpinski-chaos/chaosgame-address/ChaosgameAddress";
import ChaosgameBu from "./gifted/2-sierpinski-chaos/chaosgame-bu/ChaosgameBu";
// [3] 사진과 그림을 활용한 시선
import VanishingPointDraw from "./gifted/3-perspective-art/vanishing-point-draw/VanishingPointDraw";
import MeasuringPointDistance from "./gifted/3-perspective-art/measuring-point-distance/MeasuringPointDistance";
import AmbassadorsSkull from "./gifted/3-perspective-art/ambassadors-skull/AmbassadorsSkull";
import PerspectiveProjection from "./gifted/3-perspective-art/perspective-projection/PerspectiveProjection";
import HarmonicPerspective from "./gifted/3-perspective-art/harmonic-perspective/HarmonicPerspective";
import TrinityDistance from "./gifted/3-perspective-art/trinity-distance/TrinityDistance";
// [4] 작도 게임
import EuclideaWarmup from "./gifted/4-euclidea/euclidea-warmup/EuclideaWarmup";
import EuclideaToolSteps from "./gifted/4-euclidea/euclidea-tool-steps/EuclideaToolSteps";
import EuclideaBingo from "./gifted/4-euclidea/euclidea-bingo/EuclideaBingo";

// 이식 완료된 미니활동: activitySlug(임포트된 "<folder>/<slug>") → React 컴포넌트.
// 자체 렌더(추가 props 불필요). 등록되지 않은 슬러그는 ActivityRenderer 가 '준비 중'으로 표시.
// (probability-simulator 는 제출 props 가 많아 ActivityRenderer 에서 별도 처리한다.)
// 파일은 교과/중단원 폴더로 정리: components/activities/<교과>/<중단원>/<활동>/.
export const ACTIVITY_REGISTRY: Record<string, ComponentType> = {
  // ── 공통수학 ──
  "common/mini/poly_sort_game": PolySortGame,
  "common/mini/poly_add_sub_game": PolyAddSubGame,
  "common/mini/poly_mul_expand": PolyMulExpand,
  "common/mini/algebra_tile_formulas": AlgebraTileFormulas,
  "common/mini/gelosia_mul": GelosiaMul,
  "common/mini/synthetic_div_principle": SyntheticDivPrinciple,
  "common/mini/remainder_same_expressions": RemainderSameExpressions,
  "common/mini/synthetic_div_spreadsheet": SyntheticDivSpreadsheet,
  "common/mini/gelosia_div": GelosiaDiv,
  "common/mini/identity_game": IdentityGame,
  "common/mini/undefined_coefficients": UndefinedCoefficients,
  "common/mini/power_remainder_booster": PowerRemainderBooster,
  "common/mini/factor_candidate_radar": FactorCandidateRadar,
  "common/mini/prime_composite_lock": PrimeCompositeLock,
  "common/mini/factor_pathfinder_arcade": FactorPathfinderArcade,
  "common/mini/complex_number_terms": ComplexNumberTerms,
  "common/mini/complex_arithmetic_game": ComplexArithmeticGame,
  "common/mini/imaginary_unit_cycle": ImaginaryUnitCycle,
  "common/mini/negative_sqrt_trap": NegativeSqrtTrap,
  "common/mini/conjugate_roots_explorer": ConjugateRootsExplorer,
  "common/mini/vieta_roots_game": VietaRootsGame,
  "common/mini/quad_func_equation_explorer": QuadFuncEquationExplorer,
  "common/mini/quad_line_position_explorer": QuadLinePositionExplorer,
  "common/mini/quad_maxmin_explorer": QuadMaxminExplorer,
  "common/mini/quad_maxmin_reallife": QuadMaxminReallife,
  "common/mini/quad_bridge_curve_fit": QuadBridgeCurveFit,
  "common/mini/cubic_quartic_equation_explorer": CubicQuarticEquationExplorer,
  "common/mini/equation_history_flash": EquationHistoryFlash,
  "common/mini/omega_law_explorer": OmegaLawExplorer,
  "common/mini/babylonian_cubic_solver": BabylonianCubicSolver,
  "common/mini/simultaneous_quadratic_quiz": SimultaneousQuadraticQuiz,
  "common/mini/linear_ineq_system_explorer": LinearIneqSystemExplorer,
  "common/mini/abs_value_ineq_explorer": AbsValueIneqExplorer,
  "common/mini/quad_ineq_graph_explorer": QuadIneqGraphExplorer,
  "common/mini/quad_ineq_maxmin_reallife": QuadIneqMaxminReallife,
  "common/mini/dice_counting_explorer": DiceCountingExplorer,
  "common/mini/addition_multiplication_rule": AdditionMultiplicationRule,
  "common/mini/permutation_reallife_explorer": PermutationReallifeExplorer,
  "common/mini/permutation_identity_explorer": PermutationIdentityExplorer,
  "common/mini/combination_reallife_explorer": CombinationReallifeExplorer,
  "common/mini/perm_comb_growth_race": PermCombGrowthRace,
  "common/mini/combination_identity_explorer": CombinationIdentityExplorer,
  "common/mini/combination_application_explorer": CombinationApplicationExplorer,
  "common/mini/counting_daily_sumin": CountingDailySumin,
  "common/mini/map_coloring_explorer": MapColoringExplorer,
  "common/mini/matrix_pixel_explorer": MatrixPixelExplorer,
  "common/mini/matrix_equality_game": MatrixEqualityGame,
  "common/mini/matrix_ops_explore": MatrixOpsExplore,
  "common/mini/matrix_mul_reallife": MatrixMulReallife,
  "common/mini/matrix_card_dice_game": MatrixCardDiceGame,
  "common/mini/matrix_cipher_explorer": MatrixCipherExplorer,
  "common/mini/matrix_population_migration": MatrixPopulationMigration,

  // ── 공통수학2 ──
  "common2/mini/two_point_distance": TwoPointDistanceLab,
  "common2/mini/internal_division_lab": InternalDivisionLab,
  "common2/mini/centroid_lab": CentroidLab,
  "common2/mini/block_stacking_lab": BlockStackingLab,

  // ── 경제수학 ──
  "economics/mini/stock_index_lab": StockIndexLab,
  "economics/mini/gdp_growth_lab": GdpGrowthLab,

  // ── 확률과통계 ──
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
  "probability_new/mini/morra_game": MorraGame,
  "probability_new/mini/trial_event_vocab_game": TrialEventVocabGame,
  "probability_new/mini/weird_dice_sim": WeirdDiceSim,
  "probability_new/mini/statistical_prob_sim": StatisticalProbSim,
  "probability_new/mini/stat_prob_experiment": StatProbExperiment,
  // ⚠️ dice_lab 은 커리큘럼에서 구 교과 슬러그(probability/mini/...)로 임포트됨
  "probability/mini/dice_lab": DiceLab,
  "probability_new/mini/buffon_needle_mini": BuffonNeedle,
  "probability_new/mini/bertrand_paradox_mini": BertrandParadox,
  "probability_new/mini/prob_basic_properties": ProbBasicProperties,
  "probability_new/mini/prob_addition_theorem": ProbAdditionTheorem,
  "probability_new/mini/birthday_paradox_mini": BirthdayParadoxMini,
  "probability_new/mini/simpsons_paradox_mini": SimpsonsParadoxMini,
  // ⚠️ odd_prime_conditional 은 커리큘럼에서 구 교과 슬러그(probability/mini/...)로 임포트됨
  "probability/mini/odd_prime_conditional": OddPrimeConditional,
  "probability_new/mini/conditional_prob_explorer": ConditionalProbExplorer,
  "probability_new/mini/bayes_theorem_mini": BayesTheoremMini,
  // ⚠️ monty_hall_mini 는 커리큘럼에서 구 교과 슬러그(probability/mini/...)로 임포트됨
  "probability/mini/monty_hall_mini": MontyHallMini,
  "probability_new/mini/nontransitive_dice": NontransitiveDice,
  "probability_new/mini/independence_vs_exclusive": IndependenceVsExclusive,
  "probability_new/mini/de_mere_letter": DeMereLetter,
  "probability_new/mini/independent_trial_apply": IndependentTrialApply,
  "probability_new/mini/random_response_survey": RandomResponseSurvey,
  "probability_new/mini/monte_carlo_sim": MonteCarloSim,
  "probability_new/mini/rv_classify_game": RvClassifyGame,
  "probability_new/mini/distribution_zoo": DistributionZoo,
  "probability_new/mini/seunggyeongdo_sim": SeunggyeongdoSim,
  "probability_new/mini/axb_number_line_lab": AxbNumberLineLab,
  "probability_new/mini/rv_mean_var_lab": RvMeanVarLab,
  "probability_new/mini/rv_spreadsheet_lab": RvSpreadsheetLab,
  "probability_new/mini/binomial_mean_var_explorer": BinomialMeanVarExplorer,
  "probability_new/mini/binomial_graph_sim": BinomialGraphSim,
  "probability_new/mini/lln_binomial_simple": LlnBinomialSimple,
  "probability_new/mini/hardy_weinberg_mini": HardyWeinbergMini,
  "probability_new/mini/normal_compare_p5": NormalCompareP5,
  "probability_new/mini/std_normal_table_quiz": StdNormalTableQuiz,
  "probability_new/mini/binom_normal_approx": BinomNormalApprox,
  "probability_new/mini/census_or_sample_quiz": CensusOrSampleQuiz,
  "probability_new/mini/random_sampling_lab": RandomSamplingLab,
  "probability_new/mini/sampling_methods_lab": SamplingMethodsLab,
  "probability_new/mini/pop_sample_mean_lab": PopSampleMeanLab,
  "probability_new/mini/sample_variance_n1_lab": SampleVarianceN1Lab,
  "probability_new/mini/sample_mean_dist_lab": SampleMeanDistLab,
  "probability_new/mini/sampling_mean_relation_lab": SamplingMeanRelationLab,
  "probability_new/mini/ci_confidence_tradeoff_lab": CiConfidenceTradeoffLab,
  "probability_new/mini/ci_meaning_lab": CiMeaningLab,
  "probability_new/mini/ci_length_factors_lab": CiLengthFactorsLab,
  "probability_new/mini/sample_proportion_dist_lab": SampleProportionDistLab,
  "probability_new/mini/ci_proportion_lab": CiProportionLab,
  "probability_new/mini/ci_proportion_news_lab": CiProportionNewsLab,
  // 교육과정 외(X) — subject="probability"(구) 슬러그로 임포트됨
  "probability/mini/circular_perm_anchor_p5": CircularPermAnchor,
  "probability/mini/polygon_edge_arrangements_p5": PolygonEdgeArrangements,

  // ── 영재 ──
  // ⚠️ 영재 _units.py 는 slug 가 평문(예: "euclidea_warmup") 이라 SQL 임포트 결과가
  // "gifted/<slug>" 형식 (확통·공통수학의 "<subject>/mini/<slug>" 와 다름).
  "gifted/sieve_eratosthenes": SieveEratosthenes,
  "gifted/multiplicative_functions": MultiplicativeFunctions,
  "gifted/zeta_explorer": ZetaExplorer,
  "gifted/zeta_arithmetic": ZetaArithmetic,
  "gifted/double_pendulum": DoublePendulum,
  "gifted/lorenz_butterfly": LorenzButterfly,
  "gifted/lorenz_attractor": LorenzAttractor,
  "gifted/fractal_dimensions": FractalDimensions,
  "gifted/sierpinski_props": SierpinskiProps,
  "gifted/chaosgame_address": ChaosgameAddress,
  // 카오스 게임(BU) — 영재 _units.py 에서 subject="etc", slug="chaosgame"
  // → SQL 임포트 결과 슬러그 "etc/chaosgame".
  "etc/chaosgame": ChaosgameBu,
  // 확률통계와 컴포넌트 공유 — ReflectionForm 이 gifted/ slug 면 자동 생략.
  "gifted/galton_board": GaltonBoard,
  "gifted/pascal_triangle_props": PascalTriangleProperties,
  "gifted/pascal_fractal": PascalFractal,
  "gifted/vanishing_point_draw": VanishingPointDraw,
  "gifted/measuring_point_distance": MeasuringPointDistance,
  "gifted/ambassadors_skull": AmbassadorsSkull,
  "gifted/perspective_projection": PerspectiveProjection,
  "gifted/harmonic_perspective": HarmonicPerspective,
  "gifted/trinity_distance": TrinityDistance,
  "gifted/euclidea_warmup": EuclideaWarmup,
  "gifted/euclidea_tool_steps": EuclideaToolSteps,
  "gifted/euclidea_bingo": EuclideaBingo,
};
