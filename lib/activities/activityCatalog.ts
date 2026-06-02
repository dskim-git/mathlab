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
    unit: "3-1 경우의 수",
    slugs: ["common/mini/perm_comb_growth_race"],
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
];

/** 카탈로그 전체에서 등록된 슬러그 set. */
export function getAllCatalogSlugs(): Set<string> {
  const s = new Set<string>();
  for (const g of ACTIVITY_CATALOG) {
    for (const slug of g.slugs) s.add(slug);
  }
  return s;
}
