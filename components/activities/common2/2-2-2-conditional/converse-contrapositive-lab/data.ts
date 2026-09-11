// 명제의 역과 대우 — 활동 데이터
//
//  명제 p → q 에 대하여
//      q → p        : 역
//      ~p → ~q      : 이 (가정과 결론을 그대로 두고 둘 다 부정한 것)
//      ~q → ~p      : 대우
//  네 명제는 「자리 바꾸기」와 「둘 다 부정하기」 두 개의 스위치로 모두 만들어진다.
//      자리 바꾸기만 → 역 · 부정만 → 이 · 둘 다 → 대우
//  그래서 역의 역은 자신이고 대우의 대우도 자신이다.
//
//  조건 p, q 의 진리집합을 P, Q 라 하면
//      p → q 가 참   ⟺ P ⊂ Q ⟺ Qᶜ ⊂ Pᶜ ⟺ ~q → ~p 가 참   (명제와 대우는 참·거짓이 일치)
//      q → p 가 참   ⟺ Q ⊂ P ⟺ Pᶜ ⊂ Qᶜ ⟺ ~p → ~q 가 참   (역과 이는 참·거짓이 일치)
//  P ⊂ Q 와 Q ⊂ P 는 서로 얽매이지 않으므로 명제의 참·거짓과 역의 참·거짓은 관련이 없다.
//  실제로 P = Q · P ⊊ Q · Q ⊊ P · 어느 쪽도 아님 네 가지가 모두 일어난다.

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
export function sameNums(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}
export function isSubset(A: number[], B: number[]): boolean {
  return A.every((n) => B.includes(n));
}
/** A 에는 있고 B 에는 없는 원소 */
export function outside(A: number[], B: number[]): number[] {
  return A.filter((n) => !B.includes(n));
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 역·대우 조립기
// ══════════════════════════════════════════════════════════════
/** 한 조건이 문장 안에서 취하는 네 가지 꼴 */
export type Side = {
  /** 「…이면」 자리 · 긍정 */
  ifYes: Piece[];
  /** 「…이면」 자리 · 부정 */
  ifNo: Piece[];
  /** 「…이다」 자리 · 긍정 */
  thenYes: Piece[];
  /** 「…이다」 자리 · 부정 */
  thenNo: Piece[];
};

export type ConvTask = {
  id: string;
  p: Side;
  q: Side;
  /** 조건 이름표에 쓸 짧은 설명 */
  pName: Piece[];
  qName: Piece[];
  tip: string;
  why: string;
};

/** 두 스위치의 상태 — swap: 자리 바꾸기, neg: 둘 다 부정하기 */
export type Form = "origin" | "converse" | "inverse" | "contra";
export function formOf(swap: boolean, neg: boolean): Form {
  if (!swap && !neg) return "origin";
  if (swap && !neg) return "converse";
  if (!swap && neg) return "inverse";
  return "contra";
}
export const FORM_LABEL: Record<Form, string> = {
  origin: "원래 명제",
  converse: "역",
  inverse: "이",
  contra: "대우",
};
export const FORM_TEX: Record<Form, string> = {
  origin: "p \\to q",
  converse: "q \\to p",
  inverse: "\\sim p \\to \\sim q",
  contra: "\\sim q \\to \\sim p",
};

/** 스위치 상태에 따라 문장을 조립한다. */
export function buildSentence(t: ConvTask, swap: boolean, neg: boolean): Piece[] {
  const head = swap ? t.q : t.p;
  const tail = swap ? t.p : t.q;
  return [...(neg ? head.ifNo : head.ifYes), ...(neg ? tail.thenNo : tail.thenYes)];
}

export const CONVS: ConvTask[] = [
  {
    id: "v1",
    pName: [{ tex: "x^2 = y^2" }],
    qName: [{ tex: "x = y" }],
    p: {
      ifYes: [{ tex: "x^2 = y^2", post: "이면" }],
      ifNo: [{ tex: "x^2 \\ne y^2", post: "이면" }],
      thenYes: [{ tex: "x^2 = y^2", post: "이다" }],
      thenNo: [{ tex: "x^2 \\ne y^2", post: "이다" }],
    },
    q: {
      ifYes: [{ tex: "x = y", post: "이면" }],
      ifNo: [{ tex: "x \\ne y", post: "이면" }],
      thenYes: [{ tex: "x = y", post: "이다" }],
      thenNo: [{ tex: "x \\ne y", post: "이다" }],
    },
    tip: "역은 가정과 결론의 자리만 바꾸고, 대우는 자리를 바꾼 뒤 둘 다 부정해요.",
    why: "등호의 부정은 ≠ 예요. 대우에서는 결론이던 것이 가정 자리로 오면서 부정까지 붙었어요.",
  },
  {
    id: "v2",
    pName: [{ tex: "x" }, { pre: "가 4의 배수" }],
    qName: [{ tex: "x" }, { pre: "가 짝수" }],
    p: {
      ifYes: [{ pre: "x가 4의 배수이면" }],
      ifNo: [{ pre: "x가 4의 배수가 아니면" }],
      thenYes: [{ pre: "x는 4의 배수이다" }],
      thenNo: [{ pre: "x는 4의 배수가 아니다" }],
    },
    q: {
      ifYes: [{ pre: "x가 짝수이면" }],
      ifNo: [{ pre: "x가 짝수가 아니면" }],
      thenYes: [{ pre: "x는 짝수이다" }],
      thenNo: [{ pre: "x는 짝수가 아니다" }],
    },
    tip: "「…가 아니면」, 「…가 아니다」를 붙이면 부정이 돼요.",
    why: "원래 명제는 참이에요. 대우도 참이지만 역은 거짓이랍니다(2는 짝수지만 4의 배수가 아니에요).",
  },
  {
    id: "v3",
    pName: [{ tex: "a = 0" }, { pre: "또는" }, { tex: "b = 0" }],
    qName: [{ tex: "ab = 0" }],
    p: {
      ifYes: [{ tex: "a = 0" }, { pre: "또는" }, { tex: "b = 0", post: "이면" }],
      ifNo: [{ tex: "a \\ne 0" }, { pre: "이고" }, { tex: "b \\ne 0", post: "이면" }],
      thenYes: [{ tex: "a = 0" }, { pre: "또는" }, { tex: "b = 0", post: "이다" }],
      thenNo: [{ tex: "a \\ne 0" }, { pre: "이고" }, { tex: "b \\ne 0", post: "이다" }],
    },
    q: {
      ifYes: [{ tex: "ab = 0", post: "이면" }],
      ifNo: [{ tex: "ab \\ne 0", post: "이면" }],
      thenYes: [{ tex: "ab = 0", post: "이다" }],
      thenNo: [{ tex: "ab \\ne 0", post: "이다" }],
    },
    tip: "「또는」이 든 조건을 부정하면 「그리고」로 바뀌어요(드모르간의 법칙).",
    why: "「a = 0 또는 b = 0」의 부정은 「a ≠ 0 이고 b ≠ 0」이에요. 「또는」이 「그리고」로 바뀌는 것을 놓치지 마세요.",
  },
  {
    id: "v4",
    pName: [{ tex: "x" }, { pre: "가 정사각형" }],
    qName: [{ tex: "x" }, { pre: "가 마름모" }],
    p: {
      ifYes: [{ pre: "x가 정사각형이면" }],
      ifNo: [{ pre: "x가 정사각형이 아니면" }],
      thenYes: [{ pre: "x는 정사각형이다" }],
      thenNo: [{ pre: "x는 정사각형이 아니다" }],
    },
    q: {
      ifYes: [{ pre: "x가 마름모이면" }],
      ifNo: [{ pre: "x가 마름모가 아니면" }],
      thenYes: [{ pre: "x는 마름모이다" }],
      thenNo: [{ pre: "x는 마름모가 아니다" }],
    },
    tip: "도형에 대한 명제도 자리를 바꾸고 부정을 붙이면 돼요.",
    why: "원래 명제와 대우는 참, 역과 이는 거짓이에요. 마름모 중에는 정사각형이 아닌 것도 있으니까요.",
  },
  {
    id: "v5",
    pName: [{ tex: "x > 3" }],
    qName: [{ tex: "x > 1" }],
    p: {
      ifYes: [{ tex: "x > 3", post: "이면" }],
      ifNo: [{ tex: "x \\le 3", post: "이면" }],
      thenYes: [{ tex: "x > 3", post: "이다" }],
      thenNo: [{ tex: "x \\le 3", post: "이다" }],
    },
    q: {
      ifYes: [{ tex: "x > 1", post: "이면" }],
      ifNo: [{ tex: "x \\le 1", post: "이면" }],
      thenYes: [{ tex: "x > 1", post: "이다" }],
      thenNo: [{ tex: "x \\le 1", post: "이다" }],
    },
    tip: "부등호의 부정은 방향만 바꾸는 것이 아니라 등호까지 챙겨야 해요.",
    why: "「> 3」의 부정은 「< 3」이 아니라 「≤ 3」이에요. 등호를 빠뜨리면 x = 3 이 어느 쪽에도 들어가지 않아요.",
  },
  {
    id: "v6",
    pName: [{ pre: "비가 온다" }],
    qName: [{ pre: "소풍을 가지 않는다" }],
    p: {
      ifYes: [{ pre: "비가 오면" }],
      ifNo: [{ pre: "비가 오지 않으면" }],
      thenYes: [{ pre: "비가 온다" }],
      thenNo: [{ pre: "비가 오지 않는다" }],
    },
    q: {
      ifYes: [{ pre: "소풍을 가지 않으면" }],
      ifNo: [{ pre: "소풍을 가면" }],
      thenYes: [{ pre: "소풍을 가지 않는다" }],
      thenNo: [{ pre: "소풍을 간다" }],
    },
    tip: "결론에 이미 「않는다」가 붙어 있어요. 그것을 부정하면 「간다」가 된답니다.",
    why: "이미 부정이 붙은 조건을 부정하면 부정이 떨어져 나가요. 대우는 「소풍을 가면 비가 오지 않는다」예요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 진리집합 시뮬레이터
// ══════════════════════════════════════════════════════════════
export const SIM = {
  w: 480,
  h: 300,
  box: { x: 8, y: 14, w: 464, h: 272, r: 20 },
  /** 고정된 진리집합 P */
  P: { cx: 170, cy: 150, r: 68 },
  /** 움직이는 진리집합 Q */
  qMin: 26,
  qMax: 100,
  init: { cx: 300, cy: 150, r: 58 },
  /** 판정 여유 (픽셀) */
  eps: 3,
};

export type Rel = "equal" | "pInQ" | "qInP" | "cross" | "apart";
export const REL_LABEL: Record<Rel, string> = {
  equal: "P = Q",
  pInQ: "P 가 Q 안에",
  qInP: "Q 가 P 안에",
  cross: "서로 걸쳐 있음",
  apart: "떨어져 있음",
};

export function relOf(qx: number, qy: number, qr: number): Rel {
  const d = Math.hypot(qx - SIM.P.cx, qy - SIM.P.cy);
  const pIn = d + SIM.P.r <= qr + SIM.eps;
  const qIn = d + qr <= SIM.P.r + SIM.eps;
  if (pIn && qIn) return "equal";
  if (pIn) return "pInQ";
  if (qIn) return "qInP";
  if (d >= SIM.P.r + qr - SIM.eps) return "apart";
  return "cross";
}

/** 네 명제의 참·거짓 — 명제·대우는 P ⊂ Q, 역·이는 Q ⊂ P */
export function truthsOf(rel: Rel): Record<Form, boolean> {
  const pIn = rel === "equal" || rel === "pInQ";
  const qIn = rel === "equal" || rel === "qInP";
  return { origin: pIn, converse: qIn, inverse: qIn, contra: pIn };
}

/** 명제와 역의 참·거짓 조합 — 네 가지가 모두 일어난다 */
export type ComboId = "TT" | "TF" | "FT" | "FF";
export function comboOf(rel: Rel): ComboId {
  const t = truthsOf(rel);
  return `${t.origin ? "T" : "F"}${t.converse ? "T" : "F"}` as ComboId;
}
export const COMBOS: { id: ComboId; label: string; hint: string }[] = [
  { id: "TT", label: "명제 참 · 역 참", hint: "두 진리집합이 완전히 같아지도록 맞춰 보세요." },
  { id: "TF", label: "명제 참 · 역 거짓", hint: "P 가 Q 안에 쏙 들어가되 Q 가 더 크도록 해 보세요." },
  { id: "FT", label: "명제 거짓 · 역 참", hint: "Q 를 작게 줄여 P 안으로 넣어 보세요." },
  { id: "FF", label: "명제 거짓 · 역 거짓", hint: "두 원이 걸치거나 아예 떨어지게 해 보세요." },
];

export const PRESETS: { id: string; label: string; cx: number; cy: number; r: number }[] = [
  { id: "eq", label: "P = Q", cx: 170, cy: 150, r: 68 },
  { id: "pq", label: "P ⊂ Q", cx: 180, cy: 150, r: 96 },
  { id: "qp", label: "Q ⊂ P", cx: 180, cy: 150, r: 38 },
  { id: "cr", label: "걸치게", cx: 258, cy: 150, r: 58 },
  { id: "ap", label: "떨어지게", cx: 340, cy: 150, r: 48 },
];

// ── 적용 퀴즈 ────────────────────────────────────────────────
export type ApplyTask = {
  id: string;
  /** 참이라고 주어진 명제 */
  given: string;
  choices: string[];
  answer: number;
  choiceWhy: string[];
};

export const APPLIES: ApplyTask[] = [
  {
    id: "a1",
    given: "\\sim p \\to q",
    choices: ["q \\to \\sim p", "\\sim q \\to p", "p \\to q", "\\sim p \\to \\sim q"],
    answer: 1,
    choiceWhy: [
      "가정과 결론의 자리만 바꾼 역이에요. 역의 참·거짓은 원래 명제와 관련이 없답니다.",
      "",
      "가정의 부정만 떼어 낸 것이라 역도 이도 대우도 아니에요.",
      "결론만 부정한 것이에요. 대우는 자리를 바꾸고 둘 다 부정해야 해요.",
    ],
  },
  {
    id: "a2",
    given: "p \\to \\sim q",
    choices: ["q \\to \\sim p", "\\sim q \\to p", "\\sim p \\to q", "p \\to q"],
    answer: 0,
    choiceWhy: [
      "",
      "자리를 바꾸기만 한 역이에요.",
      "가정과 결론을 그대로 두고 둘 다 부정한 이예요. 자리도 바꿔야 대우가 된답니다.",
      "결론의 부정만 떼어 낸 것이에요.",
    ],
  },
  {
    id: "a3",
    given: "\\sim p \\to \\sim q",
    choices: ["q \\to p", "p \\to q", "\\sim q \\to \\sim p", "q \\to \\sim p"],
    answer: 0,
    choiceWhy: [
      "",
      "가정과 결론에서 부정만 떼어 낸 이예요.",
      "자리만 바꾼 역이에요.",
      "자리를 바꾸었지만 부정이 한쪽에만 남아 있어요.",
    ],
  },
];

/** 「~q → ~p」 를 실제로 만들어 보는 검산용 — 기호를 뒤집는다 */
export function contraTex(gp: boolean, gq: boolean): string {
  // gp, gq 는 가정·결론에 부정이 붙어 있는가
  const s = (neg: boolean, name: string) => (neg ? `\\sim ${name}` : name);
  return `${s(!gq, "q")} \\to ${s(!gp, "p")}`;
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 어느 쪽으로 따질까
// ══════════════════════════════════════════════════════════════
export type PickTask = {
  id: string;
  /** 조건이 놓인 범위 */
  scope: string;
  origin: Piece[];
  contra: Piece[];
  /** 따지기 편한 쪽 */
  easier: "origin" | "contra";
  easyWhy: string;
  hardWhy: string;
  /** 명제(=대우)의 참·거짓 */
  truth: boolean;
  /** 편한 쪽으로 따지는 과정 */
  steps: Piece[][];
  note: string;
};

export const PICKS: PickTask[] = [
  {
    id: "w1",
    scope: "x는 자연수",
    origin: [{ pre: "x가 6의 배수이면 x는 3의 배수이다." }],
    contra: [{ pre: "x가 3의 배수가 아니면 x는 6의 배수가 아니다." }],
    easier: "origin",
    easyWhy: "원래 명제의 가정은 ", // 화면에서 뒤에 식을 이어 붙인다
    hardWhy: "대우는 「3의 배수가 아니다」라는 부정에서 출발해 오히려 멀리 돌아가요.",
    truth: true,
    steps: [
      [{ pre: "가정에서 " }, { tex: "x = 6k", post: " (k는 자연수)" }],
      [{ pre: "그러면 " }, { tex: "x = 6k = 3 \\times 2k" }],
      [{ pre: "따라서 x는 3의 배수 — 명제는 참" }],
    ],
    note: "가정을 식으로 바로 옮길 수 있으면 원래 명제 쪽이 편해요.",
  },
  {
    id: "w2",
    scope: "n은 자연수",
    origin: [{ tex: "n^2", post: "이 짝수이면 n은 짝수이다." }],
    contra: [{ pre: "n이 홀수이면" }, { tex: "n^2", post: "은 홀수이다." }],
    easier: "contra",
    easyWhy: "대우의 가정 「n이 홀수」는 ",
    hardWhy: "원래 명제의 가정 「n²이 짝수」는 n 에 대한 식으로 옮기기가 어려워요.",
    truth: true,
    steps: [
      [{ pre: "가정에서 " }, { tex: "n = 2k + 1", post: " (k는 0 이상의 정수)" }],
      [{ tex: "n^2 = (2k+1)^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1" }],
      [{ pre: "따라서 n²은 홀수 — 대우가 참이므로 원래 명제도 참" }],
    ],
    note: "가정을 식으로 쓰기 어려울 때는 대우로 바꾸면 길이 열려요.",
  },
  {
    id: "w3",
    scope: "x는 실수",
    origin: [{ tex: "x \\ne 2", post: "이면" }, { tex: "x^2 \\ne 4", post: "이다." }],
    contra: [{ tex: "x^2 = 4", post: "이면" }, { tex: "x = 2", post: "이다." }],
    easier: "contra",
    easyWhy: "대우의 가정 x² = 4 는 ",
    hardWhy: "원래 명제의 가정 「x ≠ 2」는 2를 뺀 실수 전체라서 하나씩 따져 볼 수가 없어요.",
    truth: false,
    steps: [
      [{ pre: "가정을 풀면 " }, { tex: "x^2 = 4 \\Rightarrow x = 2" }, { pre: "또는" }, { tex: "x = -2" }],
      [{ tex: "x = -2", post: "는 가정을 만족하지만 결론 " }, { tex: "x = 2", post: "를 만족하지 않는다" }],
      [{ pre: "대우가 거짓이므로 원래 명제도 거짓 (반례 " }, { tex: "x = -2", post: ")" }],
    ],
    note: "가정을 풀어 해가 몇 개 안 되면 반례를 바로 찾을 수 있어요.",
  },
  {
    id: "w4",
    scope: "x는 자연수",
    origin: [{ pre: "x가 5의 배수이면 x는 10의 배수이다." }],
    contra: [{ pre: "x가 10의 배수가 아니면 x는 5의 배수가 아니다." }],
    easier: "origin",
    easyWhy: "원래 명제의 가정 「5의 배수」는 ",
    hardWhy: "대우는 부정이 둘이나 붙어 있어 무엇을 찾아야 할지 가늠하기 어려워요.",
    truth: false,
    steps: [
      [{ pre: "가정을 만족하는 수를 작은 것부터: " }, { tex: "5,\\; 10,\\; 15,\\; \\dots" }],
      [{ tex: "x = 5", post: "는 5의 배수지만 10의 배수가 아니다" }],
      [{ pre: "반례가 있으므로 명제는 거짓 (반례 " }, { tex: "x = 5", post: ")" }],
    ],
    note: "가정을 만족하는 수를 쉽게 나열할 수 있으면 원래 명제 쪽이 빨라요.",
  },
  {
    id: "w5",
    scope: "a, b는 자연수",
    origin: [{ pre: "a + b가 홀수이면 a, b 중 적어도 하나는 짝수이다." }],
    contra: [{ pre: "a, b가 모두 홀수이면 a + b는 짝수이다." }],
    easier: "contra",
    easyWhy: "대우의 가정 「둘 다 홀수」는 ",
    hardWhy: "원래 명제의 결론 「적어도 하나는 짝수」는 경우를 나눠 따져야 해서 번거로워요.",
    truth: true,
    steps: [
      [{ pre: "가정에서 " }, { tex: "a = 2m + 1,\\; b = 2n + 1" }],
      [{ tex: "a + b = 2m + 2n + 2 = 2(m + n + 1)" }],
      [{ pre: "따라서 a + b 는 짝수 — 대우가 참이므로 원래 명제도 참" }],
    ],
    note: "「적어도 하나는」이 든 결론을 부정하면 「모두 …가 아니다」가 되어 다루기 쉬워져요.",
  },
  {
    id: "w6",
    scope: "a, b는 정수",
    origin: [{ pre: "ab가 홀수이면 a와 b는 모두 홀수이다." }],
    contra: [{ pre: "a 또는 b가 짝수이면 ab는 짝수이다." }],
    easier: "contra",
    easyWhy: "대우의 가정 「둘 중 하나가 짝수」는 ",
    hardWhy: "원래 명제의 가정 「ab가 홀수」만으로는 a, b 각각을 바로 알 수 없어요.",
    truth: true,
    steps: [
      [{ pre: "a가 짝수라면 " }, { tex: "a = 2k", post: "이므로 " }, { tex: "ab = 2(kb)" }],
      [{ pre: "b가 짝수인 경우도 같은 방법으로 " }, { tex: "ab = 2(ak')" }],
      [{ pre: "어느 쪽이든 ab 는 짝수 — 대우가 참이므로 원래 명제도 참" }],
    ],
    note: "「모두 …이다」가 든 결론을 부정하면 「하나라도 …가 아니다」가 되어 식을 세우기 쉬워져요.",
  },
];

/** 편한 쪽을 고를 때 화면에 함께 보여 줄 짧은 근거 */
export const EASY_TAIL: Record<string, string> = {
  w1: "x = 6k 로 바로 쓸 수 있어요.",
  w2: "n = 2k + 1 로 바로 쓸 수 있어요.",
  w3: "풀면 x = 2 또는 x = −2 로 딱 두 개예요.",
  w4: "5, 10, 15 … 로 쉽게 나열할 수 있어요.",
  w5: "a = 2m + 1, b = 2n + 1 로 바로 쓸 수 있어요.",
  w6: "a = 2k 로 놓고 곱해 보면 끝나요.",
};

// ══════════════════════════════════════════════════════════════
// 탭 ④ 명제 카드게임
// ══════════════════════════════════════════════════════════════
export const GAME_U = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let f = 2; f * f <= n; f++) if (n % f === 0) return false;
  return true;
};

export type GameCard = {
  id: string;
  kind: "p" | "q";
  cond: Piece[];
  test: (n: number) => boolean;
  tip: string;
};

export const GAME_CARDS: GameCard[] = [
  { id: "ㄱ", kind: "p", cond: [{ pre: "x는 5 이하의 자연수" }], test: (n) => n <= 5, tip: "1부터 5까지예요." },
  { id: "ㄴ", kind: "p", cond: [{ tex: "(x-1)(x-2) = 0" }], test: (n) => (n - 1) * (n - 2) === 0, tip: "곱이 0이 되려면 두 괄호 중 하나가 0이어야 해요." },
  { id: "ㄷ", kind: "p", cond: [{ tex: "2x - 3 = 13" }], test: (n) => 2 * n - 3 === 13, tip: "양변에 3을 더하고 2로 나눠 보세요." },
  { id: "ㄹ", kind: "p", cond: [{ pre: "x는 10 미만의 소수" }], test: (n) => isPrime(n) && n < 10, tip: "1은 소수가 아니에요." },
  { id: "ㅁ", kind: "q", cond: [{ tex: "(x-8)^2 = 0" }], test: (n) => (n - 8) ** 2 === 0, tip: "제곱이 0이 되는 수는 하나뿐이에요." },
  { id: "ㅂ", kind: "q", cond: [{ pre: "x는 6의 약수" }], test: (n) => 6 % n === 0, tip: "6을 나누어떨어지게 하는 수예요." },
  { id: "ㅅ", kind: "q", cond: [{ tex: "x^2 - 5x + 4 = 0" }], test: (n) => n * n - 5 * n + 4 === 0, tip: "인수분해하면 (x−1)(x−4) 예요." },
  { id: "ㅇ", kind: "q", cond: [{ tex: "|x - 8| = 1" }], test: (n) => Math.abs(n - 8) === 1, tip: "8과의 거리가 1인 수예요." },
];

export const P_CARDS = GAME_CARDS.filter((c) => c.kind === "p");
export const Q_CARDS = GAME_CARDS.filter((c) => c.kind === "q");

export function truthSetOf(c: GameCard): number[] {
  return GAME_U.filter((n) => c.test(n));
}
export function cardById(id: string): GameCard {
  return GAME_CARDS.find((c) => c.id === id) as GameCard;
}

/** 가정 카드 a, 결론 카드 b 로 만든 명제의 참·거짓 (명제=대우, 역=이) */
export function pairTruth(a: GameCard, b: GameCard): { prop: boolean; conv: boolean } {
  const A = truthSetOf(a);
  const B = truthSetOf(b);
  return { prop: isSubset(A, B), conv: isSubset(B, A) };
}

export type Goal = { id: string; label: string; conv: boolean; contra: boolean; hint: string };

export const GOALS: Goal[] = [
  { id: "g1", label: "역도 참 · 대우도 참", conv: true, contra: true, hint: "대우가 참이면 원래 명제도 참이에요. 역까지 참이려면 두 진리집합이 서로를 품어야 하지요." },
  { id: "g2", label: "역은 참 · 대우는 거짓", conv: true, contra: false, hint: "결론의 진리집합이 가정의 진리집합 안에 쏙 들어가되, 그보다 작아야 해요." },
  { id: "g3", label: "역은 거짓 · 대우는 참", conv: false, contra: true, hint: "가정의 진리집합이 결론의 진리집합 안에 쏙 들어가되, 그보다 작아야 해요." },
  { id: "g4", label: "역도 거짓 · 대우도 거짓", conv: false, contra: false, hint: "두 진리집합이 서로를 품지 못하게 하세요." },
];

/** 카드를 한 번씩만 써서 네 목표를 모두 만족시키는 배정을 모두 찾는다(완전탐색). */
export function solveGame(): { goal: string; p: string; q: string }[][] {
  const found: { goal: string; p: string; q: string }[][] = [];
  const ps = P_CARDS;
  const qs = Q_CARDS;
  const walk = (gi: number, usedP: boolean[], usedQ: boolean[], acc: { goal: string; p: string; q: string }[]) => {
    if (gi === GOALS.length) {
      found.push([...acc]);
      return;
    }
    const g = GOALS[gi];
    for (let i = 0; i < ps.length; i++) {
      if (usedP[i]) continue;
      for (let j = 0; j < qs.length; j++) {
        if (usedQ[j]) continue;
        const { prop, conv } = pairTruth(ps[i], qs[j]);
        // 대우의 참·거짓은 원래 명제와 같다
        if (prop !== g.contra || conv !== g.conv) continue;
        usedP[i] = true;
        usedQ[j] = true;
        acc.push({ goal: g.id, p: ps[i].id, q: qs[j].id });
        walk(gi + 1, usedP, usedQ, acc);
        acc.pop();
        usedP[i] = false;
        usedQ[j] = false;
      }
    }
  };
  walk(0, new Array(ps.length).fill(false), new Array(qs.length).fill(false), []);
  return found;
}
