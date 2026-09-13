// 절대부등식 — 활동 데이터
//
//  [절대부등식] 문자에 어떤 실수를 대입해도 늘 성립하는 부등식.  진리집합 = 실수 전체
//  [조건부등식] 특정 실수를 대입할 때만 성립하는 부등식.        진리집합 ⊊ 실수 전체
//
//  절대부등식의 증명에는 실수의 성질 여덟 가지가 쓰인다. 그 가운데 특히
//      a² ≥ 0 (제곱은 음수가 될 수 없다)      → 완전제곱꼴로 묶어 0 이상임을 보인다
//      a > b ⟺ a − b > 0                     → 큰 쪽에서 작은 쪽을 빼서 부호를 본다
//      a ≥ 0, b ≥ 0 일 때 a ≥ b ⟺ a² ≥ b²    → 근호·절댓값이 있으면 제곱해서 견준다
//  이 세 가지가 기둥이 된다.
//
//  대표적인 절대부등식
//      산술·기하·조화평균  a, b > 0 일 때 (a+b)/2 ≥ √(ab) ≥ 2ab/(a+b), 등호는 a = b
//      코시-슈바르츠       (a²+b²)(x²+y²) ≥ (ax+by)², 등호는 ay = bx

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

export function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function nx(v: number): string {
  const r = Math.round(v * 100) / 100;
  return r < 0 ? "−" + String(Math.abs(r)) : String(r);
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 절대부등식 탐지기
// ══════════════════════════════════════════════════════════════
export const NL = { w: 640, h: 128, x0: 46, x1: 594, from: -5, to: 5, axY: 78, barY: 44, barH: 16 };

export function nlX(v: number): number {
  return NL.x0 + ((v - NL.from) / (NL.to - NL.from)) * (NL.x1 - NL.x0);
}
export function nlV(px: number): number {
  return NL.from + ((px - NL.x0) / (NL.x1 - NL.x0)) * (NL.to - NL.from);
}

export type AbsTask = {
  id: string;
  tex: string;
  test: (x: number) => boolean;
  absolute: boolean;
  /** 성립하지 않는 x 가 콕 집어 있을 때 그 자리 (구멍) */
  holes: number[];
  /** 진리집합을 말로 쓴 것 */
  solution: string;
  tip: string;
  why: string;
};

export const ABS_TASKS: AbsTask[] = [
  {
    id: "s1",
    tex: "x + 3 > x",
    test: (x) => x + 3 > x,
    absolute: true,
    holes: [],
    solution: "실수 전체",
    tip: "양변에서 x 를 빼 보면 어떤 식이 남을까요?",
    why: "양변에서 x 를 빼면 3 > 0 이 남아요. x 가 사라졌으니 어떤 실수를 넣어도 늘 성립합니다.",
  },
  {
    id: "s2",
    tex: "2x + 1 > 0",
    test: (x) => 2 * x + 1 > 0,
    absolute: false,
    holes: [],
    solution: "x > −1/2",
    tip: "x 를 왼쪽으로 크게 움직여 보세요.",
    why: "x = −1 을 넣으면 −1 > 0 이 되어 성립하지 않아요. 특정 범위에서만 성립하니 조건부등식입니다.",
  },
  {
    id: "s3",
    tex: "x^2 + 1 > 0",
    test: (x) => x * x + 1 > 0,
    absolute: true,
    holes: [],
    solution: "실수 전체",
    tip: "제곱은 아무리 작아도 0이에요. 거기에 1을 더하면?",
    why: "x² ≥ 0 이므로 x² + 1 ≥ 1 > 0 이에요. 실수의 성질 「제곱은 음수가 될 수 없다」가 근거입니다.",
  },
  {
    id: "s4",
    tex: "x^2 > 0",
    test: (x) => x * x > 0,
    absolute: false,
    holes: [0],
    solution: "x ≠ 0 인 실수 전체",
    tip: "딱 한 곳에서만 무너져요. 어디일까요?",
    why: "x = 0 에서 0 > 0 이 되어 성립하지 않아요. 단 한 점이라도 빠지면 절대부등식이 아닙니다.",
  },
  {
    id: "s5",
    tex: "(x+1)^2 \\ge 0",
    test: (x) => (x + 1) * (x + 1) >= 0,
    absolute: true,
    holes: [],
    solution: "실수 전체",
    tip: "등호가 붙어 있다는 점에 주목하세요.",
    why: "제곱은 0 이상이므로 늘 성립해요. x = −1 에서 등호가 성립하지만 부등식 자체는 무너지지 않습니다.",
  },
  {
    id: "s6",
    tex: "(x+1)^2 > 0",
    test: (x) => (x + 1) * (x + 1) > 0,
    absolute: false,
    holes: [-1],
    solution: "x ≠ −1 인 실수 전체",
    tip: "앞 문제와 등호 하나만 다릅니다. 그 차이가 어디서 드러날까요?",
    why: "x = −1 에서 0 > 0 이 되어 무너져요. 등호가 있느냐 없느냐로 절대부등식과 조건부등식이 갈립니다.",
  },
  {
    id: "s7",
    tex: "x^2 - 4x + 3 < 0",
    test: (x) => x * x - 4 * x + 3 < 0,
    absolute: false,
    holes: [],
    solution: "1 < x < 3",
    tip: "인수분해하면 (x−1)(x−3) 이에요.",
    why: "1 과 3 사이에서만 성립해요. 그 바깥에서는 두 인수의 부호가 같아 곱이 양수가 됩니다.",
  },
  {
    id: "s8",
    tex: "|x| \\ge x",
    test: (x) => Math.abs(x) >= x,
    absolute: true,
    holes: [],
    solution: "실수 전체",
    tip: "x 가 음수일 때 절댓값은 어떻게 될까요?",
    why: "x ≥ 0 이면 |x| = x 로 등호가, x < 0 이면 |x| > 0 > x 예요. 실수의 성질 |a| ≥ a 그 자체입니다.",
  },
  {
    id: "s9",
    tex: "|x| > x",
    test: (x) => Math.abs(x) > x,
    absolute: false,
    holes: [],
    solution: "x < 0",
    tip: "등호를 뺐더니 무너지는 자리가 절반이나 생겼어요.",
    why: "x ≥ 0 이면 |x| = x 라서 성립하지 않아요. 0 이상인 모든 곳이 반례입니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 실수의 성질 여덟 가지
// ══════════════════════════════════════════════════════════════
export type RealProp = {
  id: string;
  no: number;
  tex: string;
  name: string;
  note: string;
  /** 실험대에서 견줄 두 값 */
  lhsTex: string;
  rhsTex: string;
  lhs: (a: number, b: number) => number;
  rhs: (a: number, b: number) => number;
  /** 견주는 방식 */
  cmp: "ge" | "gt" | "eq";
  /** 성질이 두 부분으로 되어 있을 때 두 번째로 견줄 값 */
  lhs2Tex?: string;
  rhs2Tex?: string;
  lhs2?: (a: number, b: number) => number;
  rhs2?: (a: number, b: number) => number;
  cmp2?: "ge" | "gt" | "eq";
  /** 두 판정을 합치는 방식 — and: 둘 다 성립해야 함 · iff: 두 판정이 같아야 함 */
  mode?: "and" | "iff";
  /** 필요한 조건 (있으면 실험대에서 껐다 켤 수 있다) */
  needs?: string;
  /** 조건을 껐을 때 깨지는 자리 */
  breakAt?: { a: number; b: number; why: string };
  /** b 를 쓰지 않는 성질 */
  oneVar?: boolean;
};

export const PROPS: RealProp[] = [
  {
    id: "p1",
    no: 1,
    tex: "a > 0,\\ b > 0 \\iff a + b > 0,\\ ab > 0",
    name: "두 양수의 합과 곱",
    note: "두 수가 모두 양수이면 더해도 곱해도 양수예요. 거꾸로 합과 곱이 모두 양수이면 두 수는 양수랍니다.",
    lhsTex: "a + b",
    rhsTex: "0",
    lhs: (a, b) => a + b,
    rhs: () => 0,
    cmp: "gt",
    lhs2Tex: "ab",
    rhs2Tex: "0",
    lhs2: (a, b) => a * b,
    rhs2: () => 0,
    cmp2: "gt",
    mode: "and",
    needs: "a > 0, b > 0",
    breakAt: { a: -3, b: 1, why: "a 가 음수이면 a + b 가 양수라는 보장이 없어요. (−3) + 1 = −2 입니다." },
  },
  {
    id: "p2",
    no: 2,
    tex: "a > b \\iff a - b > 0",
    name: "빼서 부호 보기",
    note: "두 수의 대소를 견줄 때 빼서 부호를 보면 돼요. 절대부등식 증명의 출발점이 되는 성질입니다.",
    lhsTex: "a - b",
    rhsTex: "0",
    lhs: (a, b) => a - b,
    rhs: () => 0,
    cmp: "gt",
    needs: "a > b",
    breakAt: { a: 1, b: 4, why: "a 가 b 보다 작으면 a − b 는 음수예요. 1 − 4 = −3 입니다." },
  },
  {
    id: "p3",
    no: 3,
    tex: "a^2 \\ge 0,\\quad a^2 + b^2 \\ge 0",
    name: "제곱은 음수가 아니다",
    note: "절대부등식 증명에서 가장 많이 쓰이는 성질이에요. 완전제곱꼴로 묶기만 하면 곧바로 0 이상이 됩니다.",
    lhsTex: "a^2",
    rhsTex: "0",
    lhs: (a) => a * a,
    rhs: () => 0,
    cmp: "ge",
    lhs2Tex: "a^2 + b^2",
    rhs2Tex: "0",
    lhs2: (a, b) => a * a + b * b,
    rhs2: () => 0,
    cmp2: "ge",
    mode: "and",
  },
  {
    id: "p4",
    no: 4,
    tex: "|a| \\ge a",
    name: "절댓값은 자기 자신보다 작지 않다",
    note: "a 가 0 이상이면 등호가, 음수이면 진짜로 커져요. 절댓값이 든 부등식에서 자주 쓰입니다.",
    lhsTex: "|a|",
    rhsTex: "a",
    lhs: (a) => Math.abs(a),
    rhs: (a) => a,
    cmp: "ge",
    oneVar: true,
  },
  {
    id: "p5",
    no: 5,
    tex: "a^2 + b^2 = 0 \\iff a = 0,\\ b = 0",
    name: "제곱의 합이 0이 되려면",
    note: "0 이상인 두 수를 더해 0이 되려면 둘 다 0이어야 해요. 등호 조건을 찾을 때 요긴합니다.",
    lhsTex: "a^2 + b^2",
    rhsTex: "0",
    lhs: (a, b) => a * a + b * b,
    rhs: () => 0,
    cmp: "eq",
    needs: "a = 0, b = 0",
    breakAt: { a: 2, b: 0, why: "둘 중 하나라도 0이 아니면 제곱의 합은 0보다 커요. 2² + 0² = 4 입니다." },
  },
  {
    id: "p6",
    no: 6,
    tex: "|a|^2 = a^2",
    name: "절댓값을 제곱하면",
    note: "제곱하면 부호가 사라지므로 절댓값 기호를 떼어 낼 수 있어요. 제곱 비교의 열쇠랍니다.",
    lhsTex: "|a|^2",
    rhsTex: "a^2",
    lhs: (a) => Math.abs(a) ** 2,
    rhs: (a) => a * a,
    cmp: "eq",
    oneVar: true,
  },
  {
    id: "p7",
    no: 7,
    tex: "|ab| = |a||b|",
    name: "곱의 절댓값",
    note: "절댓값은 곱셈과 사이좋게 지내요. 곱을 통째로 씌우든 따로 씌우든 같습니다.",
    lhsTex: "|ab|",
    rhsTex: "|a||b|",
    lhs: (a, b) => Math.abs(a * b),
    rhs: (a, b) => Math.abs(a) * Math.abs(b),
    cmp: "eq",
  },
  {
    id: "p8",
    no: 8,
    tex: "a \\ge 0,\\ b \\ge 0 \\ \\Rightarrow\\ (a \\ge b \\iff a^2 \\ge b^2)",
    name: "제곱해서 견주기",
    note: "양변이 0 이상이면 제곱해도 대소가 그대로예요. 근호나 절댓값이 있어 직접 견주기 어려울 때 씁니다.",
    lhsTex: "a",
    rhsTex: "b",
    lhs: (a) => a,
    rhs: (_a, b) => b,
    cmp: "ge",
    lhs2Tex: "a^2",
    rhs2Tex: "b^2",
    lhs2: (a) => a * a,
    rhs2: (_a, b) => b * b,
    cmp2: "ge",
    mode: "iff",
    needs: "a \\ge 0, b \\ge 0",
    breakAt: { a: -3, b: 2, why: "a 가 음수이면 a < b 인데도 a² > b² 가 될 수 있어요. (−3)² = 9 > 4 = 2² 입니다." },
  },
];

export function propById(id: string): RealProp {
  return PROPS.find((p) => p.id === id) as RealProp;
}

// ── 증명에서 어떤 성질을 썼을까 ───────────────────────────────
export type PropProof = {
  id: string;
  claim: Piece[];
  cond?: string;
  lines: { text: Piece[]; propId: string }[];
  eq: string;
  note: string;
};

export const PROP_PROOFS: PropProof[] = [
  {
    id: "q1",
    claim: [{ tex: "a^2 + b^2 \\ge ab" }],
    lines: [
      [
        { pre: "두 식의 차를 정리하면" },
        { tex: "a^2 + b^2 - ab = \\left(a - \\dfrac{b}{2}\\right)^2 + \\dfrac{3}{4}b^2" },
      ],
      [{ pre: "두 제곱이 모두 0 이상이므로 그 합도 0 이상이다." }],
      [{ pre: "차가 0 이상이므로" }, { tex: "a^2 + b^2 \\ge ab" }, { pre: "이다." }],
    ].map((text, i) => ({ text, propId: ["p3", "p3", "p2"][i] })),
    eq: "a = b = 0 일 때 (두 제곱이 동시에 0)",
    note: "완전제곱꼴로 묶어 0 이상임을 보이고, 차의 부호로 대소를 말하는 것 — 절대부등식 증명의 기본 틀이에요.",
  },
  {
    id: "q2",
    claim: [{ tex: "a^2 + 2ab + 2b^2 \\ge 0" }],
    lines: [
      [{ pre: "좌변을 묶으면" }, { tex: "a^2 + 2ab + b^2 + b^2 = (a+b)^2 + b^2" }],
      [{ pre: "두 제곱이 모두 0 이상이므로 그 합도 0 이상이다." }],
      [{ pre: "등호가 성립하려면" }, { tex: "(a+b)^2 + b^2 = 0" }, { pre: ", 곧" }, { tex: "a + b = 0" }, { pre: "이고" }, { tex: "b = 0" }, { pre: "이어야 한다." }],
    ].map((text, i) => ({ text, propId: ["p3", "p3", "p5"][i] })),
    eq: "a = b = 0",
    note: "남는 항을 쪼개어 완전제곱을 만들어 내는 것이 요령이에요. 등호 조건은 제곱의 합이 0이 되는 자리에서 나옵니다.",
  },
  {
    id: "q3",
    claim: [{ tex: "a^2 > b^2" }],
    cond: "a > b > 0",
    lines: [
      [{ pre: "두 식의 차를 인수분해하면" }, { tex: "a^2 - b^2 = (a+b)(a-b)" }],
      [{ tex: "a > 0,\\ b > 0" }, { pre: "이므로" }, { tex: "a + b > 0" }, { pre: "이다." }],
      [{ tex: "a > b" }, { pre: "이므로" }, { tex: "a - b > 0" }, { pre: "이다." }],
      [{ pre: "두 양수의 곱은 양수이므로" }, { tex: "(a+b)(a-b) > 0" }, { pre: "이다." }],
      [{ pre: "차가 양수이므로" }, { tex: "a^2 > b^2" }, { pre: "이다." }],
    ].map((text, i) => ({ text, propId: ["p2", "p1", "p2", "p1", "p2"][i] })),
    eq: "없음 (부등호에 등호가 없다)",
    note: "이 결과가 바로 성질 8 「제곱해서 견주기」의 뿌리예요. 탭③에서 이것을 무기로 씁니다.",
  },
  {
    id: "q4",
    claim: [{ tex: "|a| + |b| \\ge |a+b|" }],
    lines: [
      [{ pre: "양변이 모두 0 이상이므로 제곱해서 견주어도 된다." }],
      [{ tex: "(|a|+|b|)^2 - |a+b|^2 = a^2 + 2|a||b| + b^2 - (a+b)^2" }],
      [{ pre: "정리하면" }, { tex: "2|a||b| - 2ab = 2|ab| - 2ab" }, { pre: "이다." }],
      [{ tex: "|ab| \\ge ab" }, { pre: "이므로" }, { tex: "2|ab| - 2ab \\ge 0" }, { pre: "이다." }],
      [{ pre: "제곱한 값의 대소가 그대로 원래 값의 대소가 되므로" }, { tex: "|a| + |b| \\ge |a+b|" }, { pre: "이다." }],
    ].map((text, i) => ({ text, propId: ["p8", "p6", "p7", "p4", "p8"][i] })),
    eq: "ab ≥ 0 일 때 (a 와 b 의 부호가 같거나 하나가 0)",
    note: "삼각부등식이라 부르는 유명한 절대부등식이에요. 절댓값이 있으니 제곱해서 견주는 길을 택했습니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 제곱해서 견주기
// ══════════════════════════════════════════════════════════════
export type SquareTask = {
  id: string;
  cond: string;
  claim: Piece[];
  aTex: string;
  bTex: string;
  /** 양변이 0 이상인 까닭 */
  nonneg: string;
  /** A² − B² 를 정리한 결과 4지선다 */
  choices: string[];
  answer: number;
  choiceWhy: string[];
  /** 정리한 결과가 0 이상인 까닭 */
  conclude: string;
  eq: string;
  A: (a: number, b: number) => number;
  B: (a: number, b: number) => number;
  diff: (a: number, b: number) => number;
  /** 슬라이더 범위 — 근호가 있으면 0 이상만 */
  nonnegVars: boolean;
};

export const SQUARES: SquareTask[] = [
  {
    id: "w1",
    cond: "a, b는 실수",
    claim: [{ tex: "|a| + |b| \\ge |a+b|" }],
    aTex: "|a| + |b|",
    bTex: "|a+b|",
    nonneg: "절댓값은 언제나 0 이상이므로 양변이 모두 0 이상이에요.",
    choices: ["2|ab| - 2ab", "2ab - 2|ab|", "(a-b)^2", "a^2 + b^2"],
    answer: 0,
    choiceWhy: ["", "부호가 뒤집혔어요. 큰 쪽에서 작은 쪽을 빼야 합니다.", "전개를 다시 해 보세요. 절댓값 항이 남습니다.", "교차항 2ab 를 빠뜨렸어요."],
    conclude: "|ab| ≥ ab 이므로 2|ab| − 2ab ≥ 0 이에요.",
    eq: "ab ≥ 0 일 때 (a 와 b 의 부호가 같거나 하나가 0)",
    A: (a, b) => Math.abs(a) + Math.abs(b),
    B: (a, b) => Math.abs(a + b),
    diff: (a, b) => 2 * Math.abs(a * b) - 2 * a * b,
    nonnegVars: false,
  },
  {
    id: "w2",
    cond: "a ≥ 0, b ≥ 0",
    claim: [{ tex: "\\sqrt{a} + \\sqrt{b} \\ge \\sqrt{a+b}" }],
    aTex: "\\sqrt{a} + \\sqrt{b}",
    bTex: "\\sqrt{a+b}",
    nonneg: "근호 안이 0 이상이므로 두 근호값도, 그 합도 0 이상이에요.",
    choices: ["2\\sqrt{ab}", "\\sqrt{ab}", "a + b", "2ab"],
    answer: 0,
    choiceWhy: ["", "전개할 때 교차항에 2가 붙는 것을 놓쳤어요.", "a 와 b 는 서로 지워집니다.", "근호가 남아야 해요."],
    conclude: "a, b 가 0 이상이므로 2√(ab) ≥ 0 이에요.",
    eq: "ab = 0 일 때 (a = 0 또는 b = 0)",
    A: (a, b) => Math.sqrt(a) + Math.sqrt(b),
    B: (a, b) => Math.sqrt(a + b),
    diff: (a, b) => 2 * Math.sqrt(a * b),
    nonnegVars: true,
  },
  {
    id: "w3",
    cond: "a, b는 실수",
    claim: [{ tex: "|a| + |b| \\ge \\sqrt{a^2 + b^2}" }],
    aTex: "|a| + |b|",
    bTex: "\\sqrt{a^2+b^2}",
    nonneg: "절댓값도 근호값도 0 이상이므로 양변이 모두 0 이상이에요.",
    choices: ["2|ab|", "2ab", "(a-b)^2", "a^2 + b^2"],
    answer: 0,
    choiceWhy: ["", "절댓값을 빠뜨렸어요. |a||b| = |ab| 입니다.", "완전제곱이 아니라 교차항만 남아요.", "a² 과 b² 은 서로 지워집니다."],
    conclude: "절댓값은 0 이상이므로 2|ab| ≥ 0 이에요.",
    eq: "ab = 0 일 때 (a = 0 또는 b = 0)",
    A: (a, b) => Math.abs(a) + Math.abs(b),
    B: (a, b) => Math.sqrt(a * a + b * b),
    diff: (a, b) => 2 * Math.abs(a * b),
    nonnegVars: false,
  },
  {
    id: "w4",
    cond: "a ≥ 0, b ≥ 0",
    claim: [{ tex: "a + b \\ge 2\\sqrt{ab}" }],
    aTex: "a + b",
    bTex: "2\\sqrt{ab}",
    nonneg: "a, b 가 0 이상이므로 합도, 근호값의 2배도 0 이상이에요.",
    choices: ["(a-b)^2", "(a+b)^2", "a^2 + b^2", "4ab"],
    answer: 0,
    choiceWhy: ["", "차를 구하는 것이므로 4ab 를 빼야 해요.", "교차항 2ab 가 빠졌어요.", "이것은 빼는 쪽의 값이에요."],
    conclude: "제곱은 0 이상이므로 (a − b)² ≥ 0 이에요.",
    eq: "a = b 일 때",
    A: (a, b) => a + b,
    B: (a, b) => 2 * Math.sqrt(a * b),
    diff: (a, b) => (a - b) ** 2,
    nonnegVars: true,
  },
  {
    id: "w5",
    cond: "a, b는 실수",
    claim: [{ tex: "\\sqrt{2(a^2+b^2)} \\ge |a+b|" }],
    aTex: "\\sqrt{2(a^2+b^2)}",
    bTex: "|a+b|",
    nonneg: "근호 안이 0 이상이고 절댓값도 0 이상이므로 양변이 모두 0 이상이에요.",
    choices: ["(a-b)^2", "(a+b)^2", "2ab", "a^2 + b^2"],
    answer: 0,
    choiceWhy: ["", "전개하면 부호가 달라져요.", "완전제곱꼴로 묶이는 것을 놓쳤어요.", "교차항 −2ab 가 남아야 해요."],
    conclude: "제곱은 0 이상이므로 (a − b)² ≥ 0 이에요.",
    eq: "a = b 일 때",
    A: (a, b) => Math.sqrt(2 * (a * a + b * b)),
    B: (a, b) => Math.abs(a + b),
    diff: (a, b) => (a - b) ** 2,
    nonnegVars: false,
  },
];

/** 제곱 비교가 언제 되는지 살펴보는 실험 — 조건을 빼면 깨진다 */
export const SQUARE_TRAPS: { a: number; b: number; ok: boolean; why: string }[] = [
  { a: 5, b: 3, ok: true, why: "둘 다 0 이상이고 5 ≥ 3, 25 ≥ 9 — 대소가 그대로예요." },
  { a: 3, b: 5, ok: true, why: "둘 다 0 이상이고 3 < 5, 9 < 25 — 이번에도 그대로예요." },
  { a: -3, b: 2, ok: false, why: "−3 < 2 인데 9 > 4 예요. 음수가 끼면 제곱이 대소를 뒤집어 버립니다." },
  { a: -5, b: -2, ok: false, why: "−5 < −2 인데 25 > 4 예요. 둘 다 음수여도 뒤집힙니다." },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 산술·기하·조화평균
// ══════════════════════════════════════════════════════════════
export const MEAN_MIN = 0.5;
export const MEAN_MAX = 9;
export const MEAN_STEP = 0.5;

export function meansOf(a: number, b: number): { A: number; G: number; H: number } {
  return { A: (a + b) / 2, G: Math.sqrt(a * b), H: (2 * a * b) / (a + b) };
}

export type GeoProof = {
  id: string;
  emoji: string;
  title: string;
  reads: Piece[];
  steps: Piece[][];
  eq: string;
  quiz: { ask: string; choices: string[]; answer: number; why: string };
};

export const GEO_PROOFS: GeoProof[] = [
  {
    id: "g1",
    emoji: "🟧",
    title: "정사각형 퍼즐",
    reads: [{ tex: "(a+b)^2 \\ge 4ab" }],
    steps: [
      [{ pre: "한 변의 길이가" }, { tex: "a+b" }, { pre: "인 정사각형 안에 가로" }, { tex: "a" }, { pre: ", 세로" }, { tex: "b" }, { pre: "인 직사각형 네 개를 돌려 가며 놓는다." }],
      [{ pre: "가운데에는 한 변이" }, { tex: "|a-b|" }, { pre: "인 정사각형이 남는다." }],
      [{ pre: "넓이를 견주면" }, { tex: "(a+b)^2 = 4ab + (a-b)^2 \\ge 4ab" }],
      [{ pre: "양변이 0 이상이므로 제곱근을 취하면" }, { tex: "a + b \\ge 2\\sqrt{ab}" }],
    ],
    eq: "a = b 일 때 — 가운데 정사각형이 사라지는 순간",
    quiz: {
      ask: "가운데 파란 정사각형의 한 변의 길이는?",
      choices: ["|a − b|", "a + b", "√(ab)", "(a+b)/2"],
      answer: 0,
      why: "큰 정사각형의 한 변 a+b 에서 a 와 b 를 각각 빼고 남은 길이예요. a 와 b 중 어느 쪽이 크든 |a − b| 가 됩니다.",
    },
  },
  {
    id: "g2",
    emoji: "🌗",
    title: "반원과 수선",
    reads: [{ tex: "\\dfrac{a+b}{2} \\ge \\sqrt{ab}" }],
    steps: [
      [{ pre: "지름이" }, { tex: "\\overline{AB} = a + b" }, { pre: "인 반원을 그리고," }, { tex: "\\overline{AE} = a,\\ \\overline{EB} = b" }, { pre: "가 되는 점" }, { tex: "E" }, { pre: "를 잡는다." }],
      [{ tex: "E" }, { pre: "에서 지름에 수직인 선을 올려 반원과 만나는 점을" }, { tex: "D" }, { pre: "라 하자." }],
      [{ pre: "지름에 대한 원주각은 직각이므로 직각삼각형의 닮음에서" }, { tex: "\\overline{DE} = \\sqrt{ab}" }, { pre: "이다." }],
      [{ pre: "반지름" }, { tex: "\\overline{OD} = \\dfrac{a+b}{2}" }, { pre: "는 직각삼각형" }, { tex: "ODE" }, { pre: "의 빗변이므로" }, { tex: "\\overline{OD} \\ge \\overline{DE}" }],
    ],
    eq: "a = b 일 때 — 점 E 가 중심 O 와 겹치는 순간",
    quiz: {
      ask: "선분 DE 의 길이는?",
      choices: ["√(ab)", "(a+b)/2", "|a − b|/2", "2ab/(a+b)"],
      answer: 0,
      why: "직각삼각형 ADE 와 DBE 가 닮음이므로 DE : a = b : DE, 곧 DE² = ab 예요. 그래서 DE = √(ab) 입니다.",
    },
  },
  {
    id: "g3",
    emoji: "⭕",
    title: "맞닿은 두 원",
    reads: [{ tex: "\\dfrac{a+b}{2} \\ge \\sqrt{ab}" }],
    steps: [
      [{ pre: "반지름이" }, { tex: "\\dfrac{a}{2}" }, { pre: "인 원과" }, { tex: "\\dfrac{b}{2}" }, { pre: "인 원을 한 직선 위에 나란히 놓고 서로 맞닿게 한다." }],
      [{ pre: "두 중심을 이으면 그 길이는 두 반지름의 합" }, { tex: "\\dfrac{a}{2} + \\dfrac{b}{2} = \\dfrac{a+b}{2}" }, { pre: "이다." }],
      [{ pre: "두 중심의 높이 차는" }, { tex: "\\left|\\dfrac{a}{2} - \\dfrac{b}{2}\\right|" }, { pre: "이므로 피타고라스 정리에서 가로 거리는" }, { tex: "\\sqrt{ab}" }, { pre: "이다." }],
      [{ pre: "빗변은 밑변보다 짧을 수 없으므로" }, { tex: "\\dfrac{a+b}{2} \\ge \\sqrt{ab}" }],
    ],
    eq: "a = b 일 때 — 두 원의 크기가 같아 높이 차가 0이 되는 순간",
    quiz: {
      ask: "두 중심을 잇는 선분이 빗변인 직각삼각형에서 밑변(가로 거리)의 길이는?",
      choices: ["√(ab)", "(a+b)/2", "|a − b|/2", "a + b"],
      answer: 0,
      why: "빗변이 (a+b)/2, 높이가 |a−b|/2 이므로 밑변² = ((a+b)/2)² − ((a−b)/2)² = ab 예요. 그래서 밑변은 √(ab) 입니다.",
    },
  },
];

export type MeanUse = {
  id: string;
  cond: string;
  ask: Piece[];
  /** 산술기하를 적용하는 꼴 */
  setup: string;
  choices: string[];
  answer: number;
  eqAt: string;
  why: string;
};

export const MEAN_USES: MeanUse[] = [
  {
    id: "m1",
    cond: "x > 0",
    ask: [{ tex: "x + \\dfrac{4}{x}" }, { pre: "의 최솟값은?" }],
    setup: "x + \\dfrac{4}{x} \\ge 2\\sqrt{x \\cdot \\dfrac{4}{x}} = 2\\sqrt{4}",
    choices: ["2", "8", "4", "16"],
    answer: 2,
    eqAt: "x = 2",
    why: "두 항의 곱이 4로 일정하므로 산술기하평균을 쓸 수 있어요. 등호는 x = 4/x, 곧 x = 2 일 때 성립합니다.",
  },
  {
    id: "m2",
    cond: "x > 0",
    ask: [{ tex: "x + \\dfrac{9}{x}" }, { pre: "의 최솟값은?" }],
    setup: "x + \\dfrac{9}{x} \\ge 2\\sqrt{x \\cdot \\dfrac{9}{x}} = 2\\sqrt{9}",
    choices: ["18", "6", "3", "9"],
    answer: 1,
    eqAt: "x = 3",
    why: "곱이 9로 일정하므로 최솟값은 2√9 = 6 이에요. 등호는 x = 9/x, 곧 x = 3 일 때입니다.",
  },
  {
    id: "m3",
    cond: "a > 0, b > 0, ab = 16",
    ask: [{ tex: "a + b" }, { pre: "의 최솟값은?" }],
    setup: "a + b \\ge 2\\sqrt{ab} = 2\\sqrt{16}",
    choices: ["4", "16", "32", "8"],
    answer: 3,
    eqAt: "a = b = 4",
    why: "곱이 16으로 정해져 있으니 합의 최솟값은 2√16 = 8 이에요. 등호는 a = b = 4 일 때입니다.",
  },
  {
    id: "m4",
    cond: "x > 0",
    ask: [{ tex: "\\dfrac{(x+1)(x+4)}{x}" }, { pre: "의 최솟값은?" }],
    setup: "\\dfrac{(x+1)(x+4)}{x} = x + \\dfrac{4}{x} + 5 \\ge 2\\sqrt{4} + 5",
    choices: ["5", "9", "13", "4"],
    answer: 1,
    eqAt: "x = 2",
    why: "먼저 전개해 x + 4/x + 5 로 고친 뒤 앞의 두 항에 산술기하평균을 씁니다. 4 + 5 = 9 예요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ⑤ 코시-슈바르츠 부등식
// ══════════════════════════════════════════════════════════════
export const CS_STEPS: Piece[][] = [
  [{ tex: "(a^2+b^2)(x^2+y^2) - (ax+by)^2" }],
  [{ tex: "= (a^2x^2 + a^2y^2 + b^2x^2 + b^2y^2) - (a^2x^2 + 2abxy + b^2y^2)" }],
  [{ tex: "= (ay)^2 + (bx)^2 - 2 \\times ay \\times bx" }],
  [{ tex: "= (ay - bx)^2 \\ge 0" }],
  [{ pre: "따라서" }, { tex: "(a^2+b^2)(x^2+y^2) \\ge (ax+by)^2" }, { pre: "이다." }],
];

export const CS_FAKES: { text: Piece[]; why: string }[] = [
  { text: [{ tex: "= (ax)^2 + (by)^2 - 2 \\times ax \\times by" }], why: "짝을 잘못 지었어요. 남는 항은 a²y² 과 b²x² 이라 (ay)² 과 (bx)² 으로 묶여요." },
  { text: [{ pre: "두 값을 몇 개 넣어 보니 늘 성립했다." }], why: "사례를 확인한 것은 증명이 아니에요." },
];

export const CS_SCATTER = [5, 1, 3, 0, 6, 2, 4];

export function csAll(): { text: Piece[]; idx: number; fakeWhy?: string }[] {
  const out: { text: Piece[]; idx: number; fakeWhy?: string }[] = [];
  CS_STEPS.forEach((s, i) => out.push({ text: s, idx: i }));
  CS_FAKES.forEach((f, i) => out.push({ text: f.text, idx: CS_STEPS.length + i, fakeWhy: f.why }));
  return out;
}

export const CS_RANGE = { min: -5, max: 5, step: 0.5 };

export function csLeft(a: number, b: number, x: number, y: number): number {
  return (a * a + b * b) * (x * x + y * y);
}
export function csRight(a: number, b: number, x: number, y: number): number {
  return (a * x + b * y) ** 2;
}
export function csGap(a: number, b: number, x: number, y: number): number {
  return (a * y - b * x) ** 2;
}

export type CSUse = {
  id: string;
  given: string;
  ask: Piece[];
  setup: string;
  choices: string[];
  answer: number;
  choiceWhy: string[];
  eqAt: string;
  why: string;
};

export const CS_USES: CSUse[] = [
  {
    id: "c1",
    given: "a^2 + b^2 = 10,\\quad x^2 + y^2 = 40",
    ask: [{ tex: "ax + by" }, { pre: "의 최댓값은?" }],
    setup: "(ax+by)^2 \\le (a^2+b^2)(x^2+y^2) = 10 \\times 40 = 400",
    choices: ["400", "20", "10", "50"],
    answer: 1,
    choiceWhy: ["제곱한 값이에요. 제곱근을 취해야 합니다.", "", "한쪽 값만 보았어요.", "두 값을 더해 버렸어요."],
    eqAt: "ay = bx 일 때",
    why: "(ax+by)² ≤ 400 이므로 |ax+by| ≤ 20 이에요. 최댓값은 20 입니다.",
  },
  {
    id: "c2",
    given: "x + 2y = 5",
    ask: [{ tex: "x^2 + y^2" }, { pre: "의 최솟값은?" }],
    setup: "(1^2+2^2)(x^2+y^2) \\ge (x + 2y)^2 = 25",
    choices: ["\\dfrac{25}{2}", "1", "5", "25"],
    answer: 2,
    choiceWhy: ["나누는 수를 잘못 잡았어요. 1² + 2² = 5 입니다.", "너무 작아요. 조건을 만족하는 점이 없습니다.", "", "5로 나누는 것을 빠뜨렸어요."],
    eqAt: "x = 1, y = 2 일 때",
    why: "계수 1과 2를 골라 (1²+2²)(x²+y²) ≥ (x+2y)² 로 놓으면 5(x²+y²) ≥ 25, 곧 x²+y² ≥ 5 예요.",
  },
  {
    id: "c3",
    given: "x^2 + y^2 = 1",
    ask: [{ tex: "3x + 4y" }, { pre: "의 최댓값은?" }],
    setup: "(3x+4y)^2 \\le (3^2+4^2)(x^2+y^2) = 25 \\times 1",
    choices: ["25", "7", "1", "5"],
    answer: 3,
    choiceWhy: ["제곱한 값이에요.", "계수를 그냥 더해 버렸어요.", "조건의 값을 그대로 답했어요.", ""],
    eqAt: "x = 3/5, y = 4/5 일 때",
    why: "(3x+4y)² ≤ 25 이므로 |3x+4y| ≤ 5 예요. 최댓값은 5 입니다.",
  },
  {
    id: "c4",
    given: "2x + 3y = 13",
    ask: [{ tex: "x^2 + y^2" }, { pre: "의 최솟값은?" }],
    setup: "(2^2+3^2)(x^2+y^2) \\ge (2x + 3y)^2 = 169",
    choices: ["26", "13", "169", "\\dfrac{169}{5}"],
    answer: 1,
    choiceWhy: ["두 배로 잡았어요.", "", "13으로 나누는 것을 빠뜨렸어요.", "나누는 수를 잘못 잡았어요. 2² + 3² = 13 입니다."],
    eqAt: "x = 2, y = 3 일 때",
    why: "13(x²+y²) ≥ 169 이므로 x²+y² ≥ 13 이에요. 등호는 3x = 2y 이면서 2x+3y = 13 일 때, 곧 x=2, y=3 입니다.",
  },
];
