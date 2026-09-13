// 대우법과 귀류법 — 활동 데이터
//
//  두 방법은 모두 「결론의 부정 ~q」에서 출발한다는 점이 같다. 하지만
//      [대우법]  ~q 만 가지고 출발해 ~p 를 이끌어낸다.
//                ~q → ~p 가 참이면 그 대우인 p → q 도 참이기 때문이다.
//                원래 가정 p 는 쓰지 않는다.
//      [귀류법]  가정 p 와 ~q 를 함께 놓고 따라가다 모순을 이끌어낸다.
//                배중률(q 와 ~q 중 하나는 반드시 성립)에 의해 ~q 가 틀렸으니 q 가 참이다.
//  즉 목적지가 다르다 — 대우법은 ~p 에 닿는 것이 목적이고, 귀류법은 모순에 닿는 것이 목적이다.

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

export type Way = "contra" | "absurd";
export const WAY_META: Record<Way, { label: string; emoji: string; goal: string; usesP: boolean; tone: string; ring: string; soft: string }> = {
  contra: {
    label: "대우법",
    emoji: "↩️",
    goal: "가정의 부정 ~p 에 닿는 것",
    usesP: false,
    tone: "text-violet-100",
    ring: "border-violet-400/55",
    soft: "bg-violet-400/12",
  },
  absurd: {
    label: "귀류법",
    emoji: "💥",
    goal: "모순에 닿는 것",
    usesP: true,
    tone: "text-rose-100",
    ring: "border-rose-400/55",
    soft: "bg-rose-400/12",
  },
};

// ══════════════════════════════════════════════════════════════
// 탭 ① 대우 다리 건너기
// ══════════════════════════════════════════════════════════════
export type ContraTask = {
  id: string;
  scope: string;
  claim: Piece[];
  p: Piece[];
  q: Piece[];
  /** 대우 4지선다 */
  choices: Piece[][];
  answer: number;
  choiceWhy: string[];
  /** 대우의 가정 ~q · 결론 ~p */
  negQ: Piece[];
  negP: Piece[];
  /** 건널 돌 (올바른 차례) */
  stones: Piece[][];
  /** 밟으면 안 되는 돌 */
  fakes: { text: Piece[]; why: string }[];
  /** 돌을 흩어 놓는 차례 (stones 뒤에 fakes 를 이은 배열의 순열) */
  scatter: number[];
  tip: string;
  why: string;
};

export const CONTRAS: ContraTask[] = [
  {
    id: "c1",
    scope: "n은 자연수",
    claim: [{ tex: "n^2" }, { pre: "이 짝수이면" }, { tex: "n" }, { pre: "도 짝수이다." }],
    p: [{ tex: "n^2" }, { pre: "이 짝수이다" }],
    q: [{ tex: "n" }, { pre: "이 짝수이다" }],
    choices: [
      [{ tex: "n" }, { pre: "이 홀수이면" }, { tex: "n^2" }, { pre: "도 홀수이다." }],
      [{ tex: "n" }, { pre: "이 짝수이면" }, { tex: "n^2" }, { pre: "도 짝수이다." }],
      [{ tex: "n^2" }, { pre: "이 홀수이면" }, { tex: "n" }, { pre: "도 홀수이다." }],
      [{ tex: "n^2" }, { pre: "이 짝수가 아니면" }, { tex: "n" }, { pre: "은 짝수이다." }],
    ],
    answer: 0,
    choiceWhy: ["", "가정과 결론의 자리만 바꾼 역이에요. 둘 다 부정해야 대우가 됩니다.", "자리를 그대로 두고 둘 다 부정한 이예요.", "부정이 한쪽에만 붙었어요."],
    negQ: [{ tex: "n" }, { pre: "이 홀수이다" }],
    negP: [{ tex: "n^2" }, { pre: "이 홀수이다" }],
    stones: [
      [{ tex: "n" }, { pre: "이 홀수이므로" }, { tex: "n = 2k+1" }, { pre: "(" }, { tex: "k" }, { pre: "는 0 이상의 정수) 로 놓을 수 있다." }],
      [{ tex: "n^2 = (2k+1)^2 = 4k^2 + 4k + 1" }],
      [{ tex: "= 2(2k^2 + 2k) + 1" }],
      [{ tex: "2k^2 + 2k" }, { pre: "는 정수이므로" }, { tex: "n^2" }, { pre: "은 홀수이다." }],
    ],
    fakes: [
      { text: [{ tex: "n" }, { pre: "이 짝수이므로" }, { tex: "n = 2k" }, { pre: "로 놓자." }], why: "대우의 가정은 「n 이 홀수」예요. 증명하려는 것을 출발점으로 삼으면 안 됩니다." },
      { text: [{ tex: "n = 4" }, { pre: "이면" }, { tex: "n^2 = 16" }, { pre: "으로 둘 다 짝수이다." }], why: "사례 하나를 확인한 것은 증명이 아니에요." },
    ],
    scatter: [4, 1, 0, 5, 3, 2],
    tip: "홀수는 2로 나눈 나머지가 1이에요. 식으로 먼저 옮겨 적어 보세요.",
    why: "대우 「n 이 홀수이면 n² 도 홀수」가 참임을 보였어요. 명제와 대우는 참·거짓이 같으니 원래 명제도 참입니다.",
  },
  {
    id: "c2",
    scope: "n은 자연수",
    claim: [{ tex: "n^2" }, { pre: "이 3의 배수이면" }, { tex: "n" }, { pre: "도 3의 배수이다." }],
    p: [{ tex: "n^2" }, { pre: "이 3의 배수이다" }],
    q: [{ tex: "n" }, { pre: "이 3의 배수이다" }],
    choices: [
      [{ tex: "n" }, { pre: "이 3의 배수가 아니면" }, { tex: "n^2" }, { pre: "도 3의 배수가 아니다." }],
      [{ tex: "n" }, { pre: "이 3의 배수이면" }, { tex: "n^2" }, { pre: "도 3의 배수이다." }],
      [{ tex: "n^2" }, { pre: "이 3의 배수가 아니면" }, { tex: "n" }, { pre: "도 3의 배수가 아니다." }],
      [{ tex: "n" }, { pre: "이 3의 배수가 아니면" }, { tex: "n^2" }, { pre: "은 3의 배수이다." }],
    ],
    answer: 0,
    choiceWhy: ["", "자리만 바꾼 역이에요.", "자리를 그대로 두고 둘 다 부정한 이예요.", "부정이 한쪽에만 붙었어요."],
    negQ: [{ tex: "n" }, { pre: "이 3의 배수가 아니다" }],
    negP: [{ tex: "n^2" }, { pre: "이 3의 배수가 아니다" }],
    stones: [
      [{ tex: "n" }, { pre: "이 3의 배수가 아니므로" }, { tex: "n = 3k \\pm 1" }, { pre: "(" }, { tex: "k" }, { pre: "는 정수) 로 놓을 수 있다." }],
      [{ tex: "n^2 = (3k \\pm 1)^2 = 9k^2 \\pm 6k + 1" }],
      [{ tex: "= 3(3k^2 \\pm 2k) + 1" }],
      [{ pre: "3으로 나눈 나머지가 1이므로" }, { tex: "n^2" }, { pre: "은 3의 배수가 아니다." }],
    ],
    fakes: [
      { text: [{ tex: "n = 3k" }, { pre: "로 놓을 수 있다." }], why: "3의 배수가 「아니라」는 가정인데 3의 배수 꼴로 놓아 버렸어요." },
      { text: [{ tex: "n^2" }, { pre: "이 3의 배수가 아니므로" }, { tex: "n" }, { pre: "도 3의 배수가 아니다." }], why: "보여야 할 결론을 그대로 가져다 썼어요." },
    ],
    scatter: [5, 0, 3, 1, 4, 2],
    tip: "3의 배수가 아닌 수는 3으로 나눈 나머지가 1 또는 2예요. 3k + 1 과 3k − 1 로 한꺼번에 쓸 수 있습니다.",
    why: "대우가 참임을 보였으니 원래 명제도 참이에요. 「3k ± 1」로 두 경우를 한 번에 다룬 것이 깔끔하지요.",
  },
  {
    id: "c3",
    scope: "a, b는 정수",
    claim: [{ tex: "ab" }, { pre: "가 홀수이면" }, { tex: "a, b" }, { pre: "는 모두 홀수이다." }],
    p: [{ tex: "ab" }, { pre: "가 홀수이다" }],
    q: [{ tex: "a, b" }, { pre: "가 모두 홀수이다" }],
    choices: [
      [{ tex: "a" }, { pre: "또는" }, { tex: "b" }, { pre: "가 짝수이면" }, { tex: "ab" }, { pre: "는 짝수이다." }],
      [{ tex: "a, b" }, { pre: "가 모두 짝수이면" }, { tex: "ab" }, { pre: "는 짝수이다." }],
      [{ tex: "a, b" }, { pre: "가 모두 홀수이면" }, { tex: "ab" }, { pre: "는 홀수이다." }],
      [{ tex: "ab" }, { pre: "가 짝수이면" }, { tex: "a, b" }, { pre: "는 모두 짝수이다." }],
    ],
    answer: 0,
    choiceWhy: [
      "",
      "「모두 홀수」의 부정은 「모두 짝수」가 아니라 「하나라도 짝수」예요(드모르간).",
      "자리만 바꾼 역이에요.",
      "자리를 그대로 두고 둘 다 부정한 이인데, 게다가 부정도 틀렸어요.",
    ],
    negQ: [{ tex: "a" }, { pre: "또는" }, { tex: "b" }, { pre: "가 짝수이다" }],
    negP: [{ tex: "ab" }, { pre: "가 짝수이다" }],
    stones: [
      [{ tex: "a" }, { pre: "가 짝수라 하면" }, { tex: "a = 2k" }, { pre: "(" }, { tex: "k" }, { pre: "는 정수) 이다." }],
      [{ tex: "ab = 2kb = 2(kb)" }],
      [{ tex: "kb" }, { pre: "는 정수이므로" }, { tex: "ab" }, { pre: "는 짝수이다." }],
      [{ tex: "b" }, { pre: "가 짝수인 경우도 같은 방법으로" }, { tex: "ab" }, { pre: "는 짝수이다." }],
    ],
    fakes: [
      { text: [{ tex: "a" }, { pre: "와" }, { tex: "b" }, { pre: "가 모두 짝수라 하자." }], why: "대우의 가정은 「a 또는 b 가 짝수」예요. 둘 다 짝수인 경우로 좁히면 빠뜨리는 경우가 생깁니다." },
      { text: [{ tex: "ab" }, { pre: "가 짝수이므로" }, { tex: "ab = 2m" }, { pre: "으로 놓자." }], why: "보여야 할 결론을 출발점으로 삼아 버렸어요." },
    ],
    scatter: [3, 5, 1, 4, 0, 2],
    tip: "「또는」이므로 어느 한쪽이 짝수인 경우를 먼저 잡고, 나머지 경우는 같은 방법이라고 적으면 돼요.",
    why: "「모두 …이다」가 든 결론은 부정하면 「하나라도 …가 아니다」가 되어 훨씬 다루기 쉬워져요.",
  },
  {
    id: "c4",
    scope: "a, b는 자연수",
    claim: [{ tex: "a + b" }, { pre: "가 홀수이면" }, { tex: "a, b" }, { pre: "중 적어도 하나는 짝수이다." }],
    p: [{ tex: "a + b" }, { pre: "가 홀수이다" }],
    q: [{ tex: "a, b" }, { pre: "중 적어도 하나가 짝수이다" }],
    choices: [
      [{ tex: "a, b" }, { pre: "가 모두 홀수이면" }, { tex: "a + b" }, { pre: "는 짝수이다." }],
      [{ tex: "a, b" }, { pre: "중 적어도 하나가 홀수이면" }, { tex: "a + b" }, { pre: "는 짝수이다." }],
      [{ tex: "a, b" }, { pre: "중 적어도 하나가 짝수이면" }, { tex: "a + b" }, { pre: "는 홀수이다." }],
      [{ tex: "a + b" }, { pre: "가 짝수이면" }, { tex: "a, b" }, { pre: "는 모두 짝수이다." }],
    ],
    answer: 0,
    choiceWhy: [
      "",
      "「적어도 하나가 짝수」의 부정은 「모두 홀수」예요. 「적어도 하나가 홀수」가 아니랍니다.",
      "자리만 바꾼 역이에요.",
      "자리를 그대로 두고 부정한 이인데, 부정도 정확하지 않아요.",
    ],
    negQ: [{ tex: "a, b" }, { pre: "가 모두 홀수이다" }],
    negP: [{ tex: "a + b" }, { pre: "가 짝수이다" }],
    stones: [
      [{ tex: "a, b" }, { pre: "가 모두 홀수이므로" }, { tex: "a = 2m+1,\\ b = 2n+1" }, { pre: "로 놓을 수 있다." }],
      [{ tex: "a + b = (2m+1) + (2n+1) = 2m + 2n + 2" }],
      [{ tex: "= 2(m + n + 1)" }],
      [{ tex: "m + n + 1" }, { pre: "은 정수이므로" }, { tex: "a+b" }, { pre: "는 짝수이다." }],
    ],
    fakes: [
      { text: [{ tex: "3 + 5 = 8" }, { pre: "이므로 참이다." }], why: "사례 하나를 확인한 것은 증명이 아니에요." },
      { text: [{ tex: "a + b" }, { pre: "가 짝수이므로" }, { tex: "a + b = 2s" }, { pre: "로 놓자." }], why: "보여야 할 결론을 출발점으로 삼아 버렸어요." },
    ],
    scatter: [1, 4, 0, 5, 3, 2],
    tip: "「적어도 하나는 짝수」의 부정은 「둘 다 홀수」예요.",
    why: "「적어도 하나」가 든 결론을 부정하면 「모두 …」가 되어 두 수를 한꺼번에 식으로 놓을 수 있게 돼요.",
  },
  {
    id: "c5",
    scope: "x, y는 실수",
    claim: [{ tex: "x + y > 2" }, { pre: "이면" }, { tex: "x > 1" }, { pre: "또는" }, { tex: "y > 1" }, { pre: "이다." }],
    p: [{ tex: "x + y > 2" }],
    q: [{ tex: "x > 1" }, { pre: "또는" }, { tex: "y > 1" }],
    choices: [
      [{ tex: "x \\le 1" }, { pre: "이고" }, { tex: "y \\le 1" }, { pre: "이면" }, { tex: "x + y \\le 2" }, { pre: "이다." }],
      [{ tex: "x < 1" }, { pre: "이고" }, { tex: "y < 1" }, { pre: "이면" }, { tex: "x + y < 2" }, { pre: "이다." }],
      [{ tex: "x \\le 1" }, { pre: "또는" }, { tex: "y \\le 1" }, { pre: "이면" }, { tex: "x + y \\le 2" }, { pre: "이다." }],
      [{ tex: "x > 1" }, { pre: "또는" }, { tex: "y > 1" }, { pre: "이면" }, { tex: "x + y > 2" }, { pre: "이다." }],
    ],
    answer: 0,
    choiceWhy: [
      "",
      "「크다」의 부정은 「작다」가 아니라 「작거나 같다」예요. 등호를 빠뜨렸습니다.",
      "「또는」의 부정은 「그리고」예요(드모르간). 「또는」이 그대로 남아 있습니다.",
      "자리만 바꾼 역이에요.",
    ],
    negQ: [{ tex: "x \\le 1" }, { pre: "이고" }, { tex: "y \\le 1" }],
    negP: [{ tex: "x + y \\le 2" }],
    stones: [
      [{ tex: "x \\le 1" }, { pre: "이고" }, { tex: "y \\le 1" }, { pre: "이다." }],
      [{ pre: "두 부등식의 양변을 각각 더하면" }, { tex: "x + y \\le 1 + 1" }],
      [{ pre: "즉" }, { tex: "x + y \\le 2" }, { pre: "이다." }],
      [{ pre: "따라서" }, { tex: "x + y > 2" }, { pre: "가 아니다." }],
    ],
    fakes: [
      { text: [{ tex: "x = 0,\\ y = 0" }, { pre: "이면" }, { tex: "x + y = 0 \\le 2" }, { pre: "이다." }], why: "사례 하나를 확인한 것은 증명이 아니에요." },
      { text: [{ tex: "x > 1" }, { pre: "또는" }, { tex: "y > 1" }, { pre: "이 아니므로" }, { tex: "x < 1" }, { pre: "이고" }, { tex: "y < 1" }, { pre: "이다." }], why: "등호를 빠뜨렸어요. 부정은 x ≤ 1 이고 y ≤ 1 입니다." },
    ],
    scatter: [4, 2, 0, 5, 1, 3],
    tip: "부등호의 부정에서 등호를 빠뜨리지 마세요. 그리고 「또는」은 「그리고」로 바뀝니다.",
    why: "부등식을 변끼리 더하는 것은 이미 아는 기본 성질이에요. 대우를 잡으니 한 줄 계산으로 끝났습니다.",
  },
];

export function contraAll(t: ContraTask): { text: Piece[]; idx: number; fakeWhy?: string }[] {
  const out: { text: Piece[]; idx: number; fakeWhy?: string }[] = [];
  t.stones.forEach((s, i) => out.push({ text: s, idx: i }));
  t.fakes.forEach((f, i) => out.push({ text: f.text, idx: t.stones.length + i, fakeWhy: f.why }));
  return out;
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 모순 감지기 (귀류법)
// ══════════════════════════════════════════════════════════════
export type AbsurdTask = {
  id: string;
  claim: Piece[];
  /** 귀류법의 출발 가정 4지선다 */
  starts: Piece[][];
  startAnswer: number;
  startWhy: string[];
  /** 따라갈 줄들 */
  lines: Piece[][];
  /** 모순이 드러나는 줄 (0부터) */
  clashAt: number;
  /** 무엇과 모순인지 4지선다 */
  against: string[];
  againstAnswer: number;
  /** 너무 일찍 눌렀을 때의 안내 */
  early: string;
  why: string;
};

export const ABSURDS: AbsurdTask[] = [
  {
    id: "a1",
    claim: [{ pre: "가장 큰 자연수는 없다." }],
    starts: [
      [{ pre: "가장 큰 자연수가 있다고 하자." }],
      [{ pre: "자연수가 무한히 많다고 하자." }],
      [{ pre: "가장 작은 자연수가 있다고 하자." }],
      [{ pre: "모든 자연수가 1보다 크다고 하자." }],
    ],
    startAnswer: 0,
    startWhy: ["", "이것은 결론을 부정한 것이 아니라 보이려는 것과 같은 말이에요.", "「크다」를 「작다」로 바꿔 버렸어요.", "명제와 상관없는 가정이에요."],
    lines: [
      [{ pre: "가장 큰 자연수가 있다고 하고, 그것을" }, { tex: "N" }, { pre: "이라 하자." }],
      [{ tex: "N + 1" }, { pre: "도 자연수이다." }],
      [{ tex: "N + 1 > N" }, { pre: "이므로" }, { tex: "N" }, { pre: "보다 큰 자연수가 있다." }],
    ],
    clashAt: 2,
    against: ["N 이 가장 큰 자연수라는 가정", "자연수가 무한히 많다는 사실", "N + 1 이 자연수라는 사실", "덧셈의 교환법칙"],
    againstAnswer: 0,
    early: "아직이에요. 한 줄 더 따라가 보세요.",
    why: "N 보다 큰 자연수를 찾아냈으니 「N 이 가장 크다」는 처음 가정이 무너졌어요. 그래서 가장 큰 자연수는 없습니다.",
  },
  {
    id: "a2",
    claim: [{ tex: "\\sqrt{2}" }, { pre: "가 무리수일 때" }, { tex: "1 + \\sqrt{2}" }, { pre: "도 무리수이다." }],
    starts: [
      [{ tex: "1 + \\sqrt{2}" }, { pre: "가 유리수라고 하자." }],
      [{ tex: "\\sqrt{2}" }, { pre: "가 유리수라고 하자." }],
      [{ tex: "1 + \\sqrt{2}" }, { pre: "가 무리수라고 하자." }],
      [{ tex: "1" }, { pre: "이 무리수라고 하자." }],
    ],
    startAnswer: 0,
    startWhy: ["", "부정해야 할 것은 결론인 「1 + √2 가 무리수」예요.", "결론을 그대로 가정한 것이라 아무 소용이 없어요.", "명제와 상관없는 가정이에요."],
    lines: [
      [{ tex: "1 + \\sqrt{2}" }, { pre: "가 유리수라고 하고, 그 값을" }, { tex: "r" }, { pre: "이라 하자." }],
      [{ tex: "\\sqrt{2} = r - 1" }, { pre: "이다." }],
      [{ pre: "유리수끼리 빼면 유리수이므로" }, { tex: "r - 1" }, { pre: "은 유리수이다." }],
      [{ pre: "따라서" }, { tex: "\\sqrt{2}" }, { pre: "가 유리수이다." }],
    ],
    clashAt: 3,
    against: ["√2 가 무리수라는 사실", "1 이 유리수라는 사실", "r 이 유리수라는 가정", "유리수의 뺄셈 성질"],
    againstAnswer: 0,
    early: "아직이에요. 유리수라는 것이 어디에 부딪히는지 끝까지 따라가 보세요.",
    why: "이미 참으로 알고 있는 「√2 는 무리수」와 정면으로 부딪혔어요. 그래서 처음 가정이 틀린 것입니다.",
  },
  {
    id: "a3",
    claim: [{ pre: "자연수" }, { tex: "n" }, { pre: "에 대하여" }, { tex: "n^2" }, { pre: "이 짝수이면" }, { tex: "n" }, { pre: "도 짝수이다." }],
    starts: [
      [{ tex: "n^2" }, { pre: "이 짝수인데" }, { tex: "n" }, { pre: "이 홀수라고 하자." }],
      [{ tex: "n" }, { pre: "이 짝수라고 하자." }],
      [{ tex: "n^2" }, { pre: "이 홀수라고 하자." }],
      [{ tex: "n^2" }, { pre: "이 짝수이고" }, { tex: "n" }, { pre: "도 짝수라고 하자." }],
    ],
    startAnswer: 0,
    startWhy: [
      "",
      "결론을 그대로 가정했어요. 귀류법은 결론을 부정해야 합니다.",
      "가정 쪽을 부정해 버렸어요. 부정할 것은 결론이에요.",
      "결론을 부정하지 않았으니 모순이 나올 리가 없어요.",
    ],
    lines: [
      [{ tex: "n^2" }, { pre: "이 짝수인데" }, { tex: "n" }, { pre: "이 홀수라고 하자." }],
      [{ tex: "n" }, { pre: "이 홀수이므로" }, { tex: "n = 2k+1" }, { pre: "로 놓을 수 있다." }],
      [{ tex: "n^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1" }],
      [{ pre: "따라서" }, { tex: "n^2" }, { pre: "은 홀수이다." }],
    ],
    clashAt: 3,
    against: ["n² 이 짝수라는 처음 가정", "n 이 홀수라는 가정", "짝수의 정의", "n 이 자연수라는 사실"],
    againstAnswer: 0,
    early: "아직이에요. n² 이 어떤 수인지 밝혀질 때까지 따라가 보세요.",
    why: "여기서 모순이 부딪힌 상대는 「원래 명제의 가정 p」 예요. 귀류법은 이렇게 가정 p 와 결론의 부정 ~q 를 함께 씁니다.",
  },
  {
    id: "a4",
    claim: [{ tex: "\\sqrt{2}" }, { pre: "는 유리수가 아니다." }],
    starts: [
      [{ tex: "\\sqrt{2}" }, { pre: "가 유리수라고 하자." }],
      [{ tex: "\\sqrt{2}" }, { pre: "가 무리수라고 하자." }],
      [{ tex: "2" }, { pre: "가 유리수라고 하자." }],
      [{ tex: "\\sqrt{2}" }, { pre: "가 정수라고 하자." }],
    ],
    startAnswer: 0,
    startWhy: ["", "보이려는 것을 그대로 가정한 것이라 모순이 나올 수 없어요.", "명제와 상관없는 가정이에요.", "유리수보다 훨씬 좁은 가정이라 증명이 되지 못해요."],
    lines: [
      [{ tex: "\\sqrt{2}" }, { pre: "가 유리수라고 하면 서로소인 두 자연수" }, { tex: "p, q" }, { pre: "에 대하여" }, { tex: "\\sqrt{2} = \\dfrac{q}{p}" }, { pre: "로 놓을 수 있다." }],
      [{ pre: "양변을 제곱하면" }, { tex: "q^2 = 2p^2" }, { pre: "이므로" }, { tex: "q^2" }, { pre: "은 짝수이고, 따라서" }, { tex: "q" }, { pre: "도 짝수이다." }],
      [{ tex: "q = 2r" }, { pre: "로 놓으면" }, { tex: "4r^2 = 2p^2" }, { pre: ", 곧" }, { tex: "p^2 = 2r^2" }, { pre: "이므로" }, { tex: "p" }, { pre: "도 짝수이다." }],
      [{ tex: "p" }, { pre: "와" }, { tex: "q" }, { pre: "가 모두 짝수이므로 둘은 공약수" }, { tex: "2" }, { pre: "를 갖는다." }],
    ],
    clashAt: 3,
    against: ["p 와 q 가 서로소라는 처음 설정", "√2 가 무리수라는 사실", "짝수의 정의", "제곱근의 성질"],
    againstAnswer: 0,
    early: "아직이에요. p 와 q 가 어떤 수인지 둘 다 밝혀질 때까지 따라가 보세요.",
    why: "귀류법에서 모순은 대개 처음에 붙여 둔 조건과 부딪히며 드러나요. 여기서는 「서로소」가 그 조건이었습니다.",
  },
  {
    id: "a5",
    claim: [{ pre: "소수는 무한히 많다." }],
    starts: [
      [{ pre: "소수가 유한개뿐이라고 하자." }],
      [{ pre: "소수가 무한히 많다고 하자." }],
      [{ pre: "가장 큰 소수가 없다고 하자." }],
      [{ pre: "모든 자연수가 소수라고 하자." }],
    ],
    startAnswer: 0,
    startWhy: ["", "보이려는 것을 그대로 가정했어요.", "「무한히 많다」와 같은 말이라 부정이 아니에요.", "명제와 상관없는 가정이에요."],
    lines: [
      [{ pre: "소수가" }, { tex: "p_1, p_2, \\dots, p_n" }, { pre: "유한개뿐이라고 하자." }],
      [{ tex: "N = p_1 p_2 \\cdots p_n + 1" }, { pre: "을 생각하자." }],
      [{ tex: "N" }, { pre: "을" }, { tex: "p_1, \\dots, p_n" }, { pre: "중 어느 것으로 나누어도 나머지가 1이다." }],
      [{ tex: "N > 1" }, { pre: "이므로" }, { tex: "N" }, { pre: "은 소수인 약수를 갖는데, 그 소수는" }, { tex: "p_1, \\dots, p_n" }, { pre: "중에 없다." }],
    ],
    clashAt: 3,
    against: ["소수가 p₁, …, pₙ 뿐이라는 가정", "N 이 1보다 크다는 사실", "나눗셈의 나머지 성질", "소수의 정의"],
    againstAnswer: 0,
    early: "아직이에요. 새로 만든 수가 어떤 소수를 약수로 갖는지까지 따라가 보세요.",
    why: "유클리드가 『원론』에 남긴 증명이에요. 목록에 없는 소수를 만들어 내며 「이게 전부」라는 가정을 무너뜨립니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 두 갈래 길 — 대우법과 귀류법의 차이
// ══════════════════════════════════════════════════════════════
export type TraitAnswer = "contra" | "absurd" | "both";

export type Trait = { id: string; text: string; answer: TraitAnswer; why: string };

export const TRAITS: Trait[] = [
  { id: "t1", text: "결론의 부정 ~q 에서 출발한다.", answer: "both", why: "두 방법의 공통점이에요. 그래서 헷갈리기 쉽습니다." },
  { id: "t2", text: "원래 가정 p 를 함께 사용한다.", answer: "absurd", why: "대우법은 ~q 만 가지고 출발해요. 가정 p 는 쓰지 않습니다." },
  { id: "t3", text: "도착점이 가정의 부정 ~p 이다.", answer: "contra", why: "~q 에서 ~p 에 닿으면 대우 ~q → ~p 가 참이 되고, 그 대우인 p → q 도 참이 돼요." },
  { id: "t4", text: "도착점이 모순이다.", answer: "absurd", why: "p 와 ~q 를 함께 놓았더니 서로 부딪히는 것 — 그것이 귀류법의 목적지예요." },
  { id: "t5", text: "명제와 대우의 참·거짓이 같다는 성질을 쓴다.", answer: "contra", why: "이 성질이 있기에 원래 명제 대신 대우를 증명해도 되는 것이랍니다." },
  { id: "t6", text: "q 와 ~q 중 하나는 반드시 성립한다는 배중률을 쓴다.", answer: "absurd", why: "~q 가 모순을 낳아 버렸으니 남은 q 가 참이라고 결론짓는 것이에요." },
  { id: "t7", text: "명제를 곧바로 가정에서 결론으로 밀고 나간다.", answer: "both", why: "둘 다 간접증명법이라 그렇게 하지 않아요. 이건 직접증명법의 방식입니다.", },
];

export type JudgeTask = { id: string; claim: Piece[]; first: Piece[]; last: Piece[]; way: Way; why: string };

export const JUDGES: JudgeTask[] = [
  {
    id: "j1",
    claim: [{ tex: "n^2" }, { pre: "이 짝수이면" }, { tex: "n" }, { pre: "도 짝수이다." }],
    first: [{ tex: "n" }, { pre: "이 홀수라 하면" }, { tex: "n = 2k+1" }, { pre: "이다." }],
    last: [{ pre: "따라서" }, { tex: "n^2" }, { pre: "은 홀수이다. 대우가 참이므로 원래 명제도 참이다." }],
    way: "contra",
    why: "가정 「n² 이 짝수」를 한 번도 쓰지 않고, 도착점이 ~p 인 「n² 은 홀수」예요. 대우법입니다.",
  },
  {
    id: "j2",
    claim: [{ tex: "n^2" }, { pre: "이 짝수이면" }, { tex: "n" }, { pre: "도 짝수이다." }],
    first: [{ tex: "n^2" }, { pre: "이 짝수인데" }, { tex: "n" }, { pre: "이 홀수라 하자." }],
    last: [{ tex: "n^2" }, { pre: "이 홀수가 되어 처음 가정에 모순이다." }],
    way: "absurd",
    why: "가정 「n² 이 짝수」를 함께 놓고 출발해 그것과 부딪혔어요. 도착점이 모순이니 귀류법입니다.",
  },
  {
    id: "j3",
    claim: [{ tex: "\\sqrt{2}" }, { pre: "는 무리수이다." }],
    first: [{ tex: "\\sqrt{2}" }, { pre: "가 유리수라 하면 서로소인" }, { tex: "p, q" }, { pre: "로 나타낼 수 있다." }],
    last: [{ tex: "p, q" }, { pre: "가 모두 짝수가 되어 서로소라는 것에 모순이다." }],
    way: "absurd",
    why: "처음에 붙여 둔 조건과 부딪혔어요. 도착점이 모순이니 귀류법입니다.",
  },
  {
    id: "j4",
    claim: [{ tex: "ab" }, { pre: "가 홀수이면" }, { tex: "a, b" }, { pre: "는 모두 홀수이다." }],
    first: [{ tex: "a" }, { pre: "또는" }, { tex: "b" }, { pre: "가 짝수라 하면" }, { tex: "a = 2k" }, { pre: "로 놓을 수 있다." }],
    last: [{ tex: "ab = 2(kb)" }, { pre: "이므로 짝수이다. 대우가 참이므로 원래 명제도 참이다." }],
    way: "contra",
    why: "가정 「ab 가 홀수」를 쓰지 않았고 도착점이 ~p 인 「ab 가 짝수」예요. 대우법입니다.",
  },
  {
    id: "j5",
    claim: [{ pre: "가장 큰 자연수는 없다." }],
    first: [{ pre: "가장 큰 자연수를" }, { tex: "N" }, { pre: "이라 하자." }],
    last: [{ tex: "N+1" }, { pre: "이 더 크므로" }, { tex: "N" }, { pre: "이 가장 크다는 것에 모순이다." }],
    way: "absurd",
    why: "도착점이 모순이에요. 게다가 이 명제는 「…이면」 꼴이 아니라 대우를 만들 것도 없지요.",
  },
  {
    id: "j6",
    claim: [{ tex: "x + y > 2" }, { pre: "이면" }, { tex: "x > 1" }, { pre: "또는" }, { tex: "y > 1" }, { pre: "이다." }],
    first: [{ tex: "x \\le 1" }, { pre: "이고" }, { tex: "y \\le 1" }, { pre: "이라 하자." }],
    last: [{ pre: "변끼리 더하면" }, { tex: "x + y \\le 2" }, { pre: "이다. 대우가 참이므로 원래 명제도 참이다." }],
    way: "contra",
    why: "가정 「x + y > 2」를 쓰지 않고 곧장 ~p 인 「x + y ≤ 2」에 닿았어요. 대우법입니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 송편 논리 퍼즐
// ══════════════════════════════════════════════════════════════
export type Person = { id: string; name: string; color: string };

export const PEOPLE: Person[] = [
  { id: "jaeho", name: "재호", color: "#38bdf8" },
  { id: "huijeong", name: "희정", color: "#f472b6" },
  { id: "minguk", name: "민국", color: "#a78bfa" },
  { id: "yejin", name: "예진", color: "#34d399" },
];

export const POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8];

/** 1~4 는 반달 모양, 5~8 은 꽃 모양 */
export function shapeOf(pos: number): "half" | "flower" {
  return pos <= 4 ? "half" : "flower";
}
/** 홀수 번째는 호박 반죽, 짝수 번째는 모시 반죽 */
export function doughOf(pos: number): "pumpkin" | "mosi" {
  return pos % 2 === 1 ? "pumpkin" : "mosi";
}
export const DOUGH_META = {
  pumpkin: { label: "호박 반죽", fill: "#fbbf24", edge: "#d97706" },
  mosi: { label: "모시 반죽", fill: "#4ade80", edge: "#15803d" },
};

export type Assign = Record<number, string | null>;

export const EMPTY_ASSIGN: Assign = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null };

/** 어떤 사람이 만든 송편 자리 */
export function posOf(a: Assign, person: string): number[] {
  return POSITIONS.filter((p) => a[p] === person);
}

export type ClueState = "ok" | "bad" | "unknown";

export type Clue = { id: string; who: string; text: string; check: (a: Assign) => ClueState };

/** 각자 반달 하나와 꽃 하나를 만들었다는 기본 규칙을 어겼는지 */
export function tooMany(a: Assign, person: string): boolean {
  const half = POSITIONS.filter((p) => p <= 4 && a[p] === person).length;
  const flower = POSITIONS.filter((p) => p > 4 && a[p] === person).length;
  return half > 1 || flower > 1;
}

export const CLUES: Clue[] = [
  {
    id: "cl1",
    who: "재호",
    text: "나는 한 종류의 반죽만 사용해서 송편을 만들었어.",
    check: (a) => {
      const ps = posOf(a, "jaeho");
      if (ps.length < 2) return "unknown";
      return doughOf(ps[0]) === doughOf(ps[1]) ? "ok" : "bad";
    },
  },
  {
    id: "cl2",
    who: "희정",
    text: "내가 만든 반달 모양 송편은 민국이가 만든 반달 모양 송편보다 오른쪽에 놓여 있어.",
    check: (a) => {
      const h = POSITIONS.find((p) => p <= 4 && a[p] === "huijeong");
      const m = POSITIONS.find((p) => p <= 4 && a[p] === "minguk");
      if (h === undefined || m === undefined) return "unknown";
      return h > m ? "ok" : "bad";
    },
  },
  {
    id: "cl3",
    who: "민국",
    text: "내가 만든 두 송편은 모두 재호가 만든 두 송편 사이에 놓여 있어.",
    check: (a) => {
      const j = posOf(a, "jaeho");
      const m = posOf(a, "minguk");
      if (j.length < 2) return m.every((x) => j.every((y) => x !== y)) ? "unknown" : "unknown";
      const lo = Math.min(...j);
      const hi = Math.max(...j);
      if (m.some((x) => x <= lo || x >= hi)) return "bad";
      return m.length === 2 ? "ok" : "unknown";
    },
  },
  {
    id: "cl4",
    who: "예진",
    text: "내가 만든 두 송편은 모두 호박 반죽으로 만들었고, 첫 번째에 놓인 송편은 내가 만들지 않았어.",
    check: (a) => {
      const y = posOf(a, "yejin");
      if (a[1] === "yejin") return "bad";
      if (y.some((p) => doughOf(p) !== "pumpkin")) return "bad";
      return y.length === 2 && a[1] !== null ? "ok" : "unknown";
    },
  },
];

/** 모든 배정을 완전탐색해 네 단서를 모두 만족하는 것을 찾는다. */
export function solveSongpyeon(): Assign[] {
  const ids = PEOPLE.map((p) => p.id);
  const perms: string[][] = [];
  const walk = (rest: string[], acc: string[]) => {
    if (rest.length === 0) {
      perms.push([...acc]);
      return;
    }
    for (let i = 0; i < rest.length; i++) walk(rest.filter((_, k) => k !== i), [...acc, rest[i]]);
  };
  walk(ids, []);

  const found: Assign[] = [];
  for (const half of perms) {
    for (const flower of perms) {
      const a: Assign = { ...EMPTY_ASSIGN };
      half.forEach((id, i) => (a[i + 1] = id));
      flower.forEach((id, i) => (a[i + 5] = id));
      if (CLUES.every((c) => c.check(a) === "ok")) found.push(a);
    }
  }
  return found;
}

export type PuzzleQ = { id: string; ask: string; choices: string[]; answer: number; why: string };

export const PUZZLE_QS: PuzzleQ[] = [
  {
    id: "pq1",
    ask: "세 번째에 놓인 송편은 누가 만들었을까요?",
    choices: ["재호", "희정", "민국", "예진"],
    answer: 3,
    why: "예진이의 두 송편은 모두 호박 반죽이라 홀수 번째에 놓여야 하고, 첫 번째는 예진이가 아니라고 했어요. 반달 모양 중 남은 홀수 자리는 세 번째뿐입니다.",
  },
  {
    id: "pq2",
    ask: "희정이가 만든 두 송편은 각각 몇 번째에 놓여 있을까요?",
    choices: ["첫 번째와 다섯 번째", "두 번째와 여섯 번째", "세 번째와 일곱 번째", "네 번째와 여덟 번째"],
    answer: 3,
    why: "희정이의 반달은 민국이의 반달보다 오른쪽이어야 하므로 네 번째, 남은 꽃 자리는 여덟 번째예요.",
  },
];

export const PUZZLE_HINTS: string[] = [
  "예진이의 두 송편은 모두 호박 반죽 — 곧 홀수 번째예요. 게다가 첫 번째는 아니라고 했지요.",
  "재호가 한 종류의 반죽만 썼다는 말은, 두 송편이 모두 홀수 번째이거나 모두 짝수 번째라는 뜻이에요.",
  "민국이의 두 송편이 재호의 두 송편 「사이」에 있으려면, 재호의 반달이 민국이의 반달보다 왼쪽이어야 해요.",
  "예진이의 반달이 세 번째라면, 재호의 반달이 홀수이면서 첫 번째일 수밖에 없어요.",
];
