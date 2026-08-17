// 미니활동 카탈로그 — 교과·단원별로 묶어 콘텐츠 블록 편집기 드롭다운에 표시.
// 그룹·순서는 components/activities/registry.ts 의 import 그룹 주석과 동일 구조.
// (단원 신설/활동 이식 시 양쪽 함께 갱신.)

export type ActivityGroup = {
  subject: string;
  unit?: string;
  slugs: string[];
};

export const ACTIVITY_CATALOG: ActivityGroup[] = [
  {
    subject: "기타",
    unit: "임시 시뮬레이터",
    slugs: ["probability-simulator"],
  },
  {
    subject: "공통수학1",
    unit: "1-1 다항식의 연산",
    slugs: [
      "common/mini/poly_sort_game",
      "common/mini/poly_add_sub_game",
      "common/mini/poly_mul_expand",
      "common/mini/algebra_tile_formulas",
      "common/mini/gelosia_mul",
      "common/mini/synthetic_div_principle",
      "common/mini/remainder_same_expressions",
      "common/mini/synthetic_div_spreadsheet",
      "common/mini/gelosia_div",
    ],
  },
  {
    subject: "공통수학1",
    unit: "1-2 나머지정리와 인수분해",
    slugs: [
      "common/mini/identity_game",
      "common/mini/undefined_coefficients",
      "common/mini/power_remainder_booster",
      "common/mini/factor_candidate_radar",
      "common/mini/prime_composite_lock",
      "common/mini/factor_pathfinder_arcade",
    ],
  },
  {
    subject: "공통수학1",
    unit: "2-1 복소수와 이차방정식",
    slugs: [
      "common/mini/complex_number_terms",
      "common/mini/complex_arithmetic_game",
      "common/mini/imaginary_unit_cycle",
      "common/mini/negative_sqrt_trap",
      "common/mini/conjugate_roots_explorer",
      "common/mini/vieta_roots_game",
    ],
  },
  {
    subject: "공통수학1",
    unit: "2-2 이차방정식과 이차함수",
    slugs: [
      "common/mini/quad_func_equation_explorer",
      "common/mini/quad_line_position_explorer",
      "common/mini/quad_maxmin_explorer",
      "common/mini/quad_maxmin_reallife",
      "common/mini/quad_bridge_curve_fit",
    ],
  },
  {
    subject: "공통수학1",
    unit: "2-3 여러 가지 방정식과 부등식",
    slugs: [
      "common/mini/cubic_quartic_equation_explorer",
      "common/mini/equation_history_flash",
      "common/mini/omega_law_explorer",
      "common/mini/babylonian_cubic_solver",
      "common/mini/simultaneous_quadratic_quiz",
      "common/mini/linear_ineq_system_explorer",
      "common/mini/abs_value_ineq_explorer",
      "common/mini/quad_ineq_graph_explorer",
      "common/mini/quad_ineq_maxmin_reallife",
    ],
  },
  {
    subject: "공통수학1",
    unit: "3-1 경우의 수",
    slugs: [
      "common/mini/dice_counting_explorer",
      "common/mini/addition_multiplication_rule",
      "common/mini/permutation_reallife_explorer",
      "common/mini/permutation_identity_explorer",
      "common/mini/combination_reallife_explorer",
      "common/mini/perm_comb_growth_race",
      "common/mini/combination_identity_explorer",
      "common/mini/combination_application_explorer",
      "common/mini/counting_daily_sumin",
      "common/mini/map_coloring_explorer",
    ],
  },
  {
    subject: "공통수학1",
    unit: "4-1 행렬",
    slugs: [
      "common/mini/matrix_pixel_explorer",
      "common/mini/matrix_equality_game",
      "common/mini/matrix_ops_explore",
      "common/mini/matrix_mul_reallife",
      "common/mini/matrix_card_dice_game",
      "common/mini/matrix_cipher_explorer",
      "common/mini/matrix_population_migration",
    ],
  },
  {
    subject: "공통수학2",
    unit: "1-1-1 평면좌표·선분의 내분",
    slugs: [
      "common2/mini/two_point_distance",
      "common2/mini/internal_division_lab",
      "common2/mini/centroid_lab",
      "common2/mini/block_stacking_lab",
    ],
  },
  {
    subject: "공통수학2",
    unit: "1-1-2 두 직선의 평행과 수직",
    slugs: ["common2/mini/line_equation_lab", "common2/mini/two_lines_relation_lab"],
  },
  {
    subject: "공통수학2",
    unit: "1-1-3 점과 직선 사이의 거리",
    slugs: ["common2/mini/point_line_distance_lab", "common2/mini/parallel_perp_lab"],
  },
  {
    subject: "공통수학2",
    unit: "1-2-1 원의 방정식",
    slugs: [
      "common2/mini/circle_equation_lab",
      "common2/mini/circle_general_form_lab",
      "common2/mini/tangent_axis_circle_lab",
      "common2/mini/apollonius_circle_lab",
    ],
  },
  {
    subject: "공통수학2",
    unit: "1-2-2 원과 직선의 위치 관계",
    slugs: ["common2/mini/circle_line_relation_lab", "common2/mini/circle_tangent_line_lab"],
  },
  {
    subject: "공통수학2",
    unit: "1-3-1 평행이동",
    slugs: ["common2/mini/translation_lab"],
  },
  {
    subject: "경제수학",
    unit: "1-1-1 생활 속 경제지표",
    slugs: ["economics/mini/stock_index_lab", "economics/mini/gdp_growth_lab", "economics/mini/percentage_point_lab", "economics/mini/employment_lab"],
  },
  {
    subject: "경제수학",
    unit: "1-1-2 환율",
    slugs: ["economics/mini/exchange_rate_lab", "economics/mini/exchange_impact_lab", "economics/mini/bigmac_index_lab", "economics/mini/exchange_smart_lab"],
  },
  {
    subject: "경제수학",
    unit: "1-1-3 세금",
    slugs: ["economics/mini/tax_lab", "economics/mini/tax_rates_lab", "economics/mini/income_tax_lab", "economics/mini/corporate_tax_lab", "economics/mini/vat_lab", "economics/mini/excise_tax_lab", "economics/mini/customs_lab"],
  },
  {
    subject: "경제수학",
    unit: "1-2-1 이자와 원리합계",
    slugs: ["economics/mini/interest_rate_lab", "economics/mini/simple_interest_lab", "economics/mini/compound_interest_lab", "economics/mini/rule_of_72_lab", "economics/mini/continuous_compound_lab", "economics/mini/installment_savings_lab"],
  },
  {
    subject: "경제수학",
    unit: "1-2-2 현재가치와 할인율",
    slugs: ["economics/mini/present_value_lab"],
  },
  {
    subject: "경제수학",
    unit: "1-2-3 연금",
    slugs: ["economics/mini/pension_lab", "economics/mini/budget_life_lab"],
  },
  {
    subject: "확률과통계",
    unit: "1-1 순열과 조합",
    slugs: [
      "probability_new/mini/rep_perm_password",
      "probability_new/mini/rep_perm_morse",
      "probability_new/mini/rep_perm_tiles",
      "probability_new/mini/rep_perm_dice",
      "probability_new/mini/tricolor_flag_perm",
      "probability_new/mini/cube_path_perm",
      "probability_new/mini/word_diamond_perm",
      "probability_new/mini/rep_comb_stars_bars",
      "probability_new/mini/poly_expand_term_count",
      "probability_new/mini/function_count_lab",
    ],
  },
  {
    subject: "확률과통계",
    unit: "1-2 이항정리",
    slugs: [
      "probability_new/mini/binomial_coeff_viz",
      "probability_new/mini/binomial_theorem_apply",
      "probability_new/mini/galton_board",
      "probability_new/mini/pascal_triangle_properties",
      "probability_new/mini/polygon_count_circles",
      "probability_new/mini/pascal_fractal",
      "probability_new/mini/morra_game",
    ],
  },
  {
    subject: "확률과통계",
    unit: "2-1 확률의 개념과 활용",
    slugs: [
      "probability_new/mini/trial_event_vocab_game",
      "probability_new/mini/weird_dice_sim",
      "probability_new/mini/statistical_prob_sim",
      "probability_new/mini/stat_prob_experiment",
      "probability/mini/dice_lab",
      "probability_new/mini/buffon_needle_mini",
      "probability_new/mini/bertrand_paradox_mini",
      "probability_new/mini/prob_basic_properties",
    ],
  },
  {
    subject: "확률과통계",
    unit: "2-1-2 확률의 덧셈정리",
    slugs: [
      "probability_new/mini/prob_addition_theorem",
      "probability_new/mini/birthday_paradox_mini",
      "probability_new/mini/simpsons_paradox_mini",
    ],
  },
  {
    subject: "확률과통계",
    unit: "2-2-1 조건부확률",
    slugs: [
      "probability/mini/odd_prime_conditional",
      "probability_new/mini/conditional_prob_explorer",
      "probability_new/mini/bayes_theorem_mini",
      "probability/mini/monty_hall_mini",
      "probability_new/mini/nontransitive_dice",
    ],
  },
  {
    subject: "확률과통계",
    unit: "2-2-2 사건의 독립과 종속",
    slugs: [
      "probability_new/mini/independence_vs_exclusive",
      "probability_new/mini/de_mere_letter",
      "probability_new/mini/independent_trial_apply",
      "probability_new/mini/random_response_survey",
      "probability_new/mini/monte_carlo_sim",
    ],
  },
  {
    subject: "확률과통계",
    unit: "3-1 확률분포",
    slugs: [
      "probability_new/mini/rv_classify_game",
      "probability_new/mini/distribution_zoo",
      "probability_new/mini/seunggyeongdo_sim",
      "probability_new/mini/axb_number_line_lab",
      "probability_new/mini/rv_mean_var_lab",
      "probability_new/mini/rv_spreadsheet_lab",
      "probability_new/mini/binomial_mean_var_explorer",
      "probability_new/mini/binomial_graph_sim",
      "probability_new/mini/lln_binomial_simple",
      "probability_new/mini/hardy_weinberg_mini",
      "probability_new/mini/normal_compare_p5",
      "probability_new/mini/std_normal_table_quiz",
      "probability_new/mini/binom_normal_approx",
    ],
  },
  {
    subject: "확률과통계",
    unit: "3-2 통계적 추정",
    slugs: [
      "probability_new/mini/census_or_sample_quiz",
      "probability_new/mini/random_sampling_lab",
      "probability_new/mini/sampling_methods_lab",
      "probability_new/mini/pop_sample_mean_lab",
      "probability_new/mini/sample_variance_n1_lab",
      "probability_new/mini/sample_mean_dist_lab",
      "probability_new/mini/sampling_mean_relation_lab",
      "probability_new/mini/ci_confidence_tradeoff_lab",
      "probability_new/mini/ci_meaning_lab",
      "probability_new/mini/ci_length_factors_lab",
      "probability_new/mini/sample_proportion_dist_lab",
      "probability_new/mini/ci_proportion_lab",
      "probability_new/mini/ci_proportion_news_lab",
    ],
  },
  {
    subject: "확률과통계",
    unit: "X 교육과정 외",
    slugs: [
      "probability/mini/circular_perm_anchor_p5",
      "probability/mini/polygon_edge_arrangements_p5",
    ],
  },
  {
    subject: "영재",
    unit: "1 기이한 소수의 세계",
    slugs: [
      "gifted/sieve_eratosthenes",
      "gifted/multiplicative_functions",
      "gifted/zeta_explorer",
      "gifted/zeta_arithmetic",
    ],
  },
  {
    subject: "영재",
    unit: "2 시어핀스키 삼각형과 카오스 게임",
    slugs: [
      "gifted/double_pendulum",
      "gifted/lorenz_butterfly",
      "gifted/lorenz_attractor",
      "gifted/fractal_dimensions",
      "gifted/sierpinski_props",
      "gifted/chaosgame_address",
      "etc/chaosgame",
      "gifted/galton_board",
      "gifted/pascal_triangle_props",
      "gifted/pascal_fractal",
    ],
  },
  {
    subject: "영재",
    unit: "3 사진과 그림을 활용한 시선",
    slugs: [
      "gifted/vanishing_point_draw",
      "gifted/measuring_point_distance",
      "gifted/ambassadors_skull",
      "gifted/perspective_projection",
      "gifted/harmonic_perspective",
      "gifted/trinity_distance",
    ],
  },
  {
    subject: "영재",
    unit: "4 작도 게임",
    slugs: [
      "gifted/euclidea_warmup",
      "gifted/euclidea_tool_steps",
      "gifted/euclidea_bingo",
    ],
  },
];

/** 카탈로그 전체에서 등록된 슬러그 set. */
export function getAllCatalogSlugs(): Set<string> {
  const s = new Set<string>();
  for (const g of ACTIVITY_CATALOG) {
    for (const slug of g.slugs) s.add(slug);
  }
  return s;
}
