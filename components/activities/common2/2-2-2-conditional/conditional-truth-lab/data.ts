// 명제 p → q 의 참과 거짓 — 활동 데이터
//
//  두 조건 p, q 에 대해 「p이면 q이다」를 p → q 로 쓰고, p 를 가정, q 를 결론이라 한다.
//  조건 p, q 의 진리집합을 각각 P, Q 라 하면
//      명제 p → q 가 참   ⟺  P 의 모든 원소가 Q 에 속한다  ⟺  P ⊂ Q
//      명제 p → q 가 거짓 ⟺  P 의 어떤 원소가 Q 에 속하지 않는다  ⟺  P ⊄ Q
//  이고, 그 어떤 원소가 바로 반례다. 반례는 P 안에 있으면서 Q 밖에 있기만 하면 되므로
//  두 원의 위치 관계가 어떻든(떨어져 있든, 겹치든, Q 가 P 안에 있든) 생길 수 있다.
//
//  [삼단논법]  p → q 와 q → r 가 모두 참이면 p → r 도 참이다.
//      P ⊂ Q 이고 Q ⊂ R 이면 P ⊂ R 이기 때문이다.
//
//  [대우]  p → q 가 참 ⟺ P ⊂ Q ⟺ Qᶜ ⊂ Pᶜ ⟺ ~q → ~p 가 참.
//      탭 ④ 의 「뒤집기」가 이것이다. 이름은 다음 소단원에서 배우지만
//      진리집합 그림만으로도 왜 성립하는지 볼 수 있다.

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

// ══════════════════════════════════════════════════════════════
// 탭 ① 가정과 결론 나누기
// ══════════════════════════════════════════════════════════════
export type SplitTask = {
  id: string;
  /** 일상어 문장 — 조건문 꼴로 고쳐 써야 하는 문제만 채운다 */
  raw?: string;
  /** 고쳐 쓴 문장 4지선다 */
  rewrites?: string[];
  rewriteAnswer?: number;
  rewriteWhy?: string[];
  /** 조건문을 어절로 쪼갠 것 — 토큰 사이에서 자른다 */
  tokens: Piece[];
  /** 정답으로 자르는 자리 (앞 cut개가 가정) */
  cut: number;
  /** 가정 p 를 문장으로 다듬은 것 */
  pText: Piece[];
  /** 결론 q 를 문장으로 다듬은 것 */
  qText: Piece[];
  tip: string;
  why: string;
};

export const SPLITS: SplitTask[] = [
  {
    id: "t1",
    raw: "6의 약수는 12의 약수이다.",
    rewrites: [
      "x가 6의 약수이면 x는 12의 약수이다.",
      "x가 12의 약수이면 x는 6의 약수이다.",
      "x가 6의 약수이면 x는 6의 배수이다.",
      "x는 6의 약수이고 12의 약수이다.",
    ],
    rewriteAnswer: 0,
    rewriteWhy: [
      "",
      "앞뒤를 맞바꾼 문장이에요. 무엇이 조건이고 무엇이 결과인지 뒤바뀌었어요.",
      "약수를 배수로 바꿔 버렸어요.",
      "「이면」이 없어요. 두 조건을 그냥 나란히 놓은 문장이랍니다.",
    ],
    tokens: [{ pre: "x가" }, { pre: "6의" }, { pre: "약수이면" }, { pre: "x는" }, { pre: "12의" }, { pre: "약수이다." }],
    cut: 3,
    pText: [{ pre: "x가 6의 약수이다" }],
    qText: [{ pre: "x는 12의 약수이다" }],
    tip: "「…이면」으로 끝나는 데까지가 가정이에요.",
    why: "「이면」 앞이 가정 p, 뒤가 결론 q 예요. 가정은 조건이고 결론은 그로부터 따라 나오는 것이지요.",
  },
  {
    id: "t2",
    tokens: [{ tex: "x + 1 = 3", post: "이면" }, { tex: "x = 2", post: "이다." }],
    cut: 1,
    pText: [{ tex: "x + 1 = 3" }],
    qText: [{ tex: "x = 2" }],
    tip: "식으로 된 명제도 똑같아요. 「이면」 앞뒤를 보세요.",
    why: "가정도 결론도 식일 수 있어요. 식이라고 해서 나누는 방법이 달라지지는 않아요.",
  },
  {
    id: "t3",
    raw: "√2는 무리수이다.",
    rewrites: [
      "x가 √2이면 x는 무리수이다.",
      "x가 무리수이면 x는 √2이다.",
      "x가 √2이면 x는 유리수이다.",
      "x는 √2이고 무리수이다.",
    ],
    rewriteAnswer: 0,
    rewriteWhy: [
      "",
      "앞뒤를 맞바꾼 문장이에요. 무리수는 √2 말고도 많답니다.",
      "무리수를 유리수로 바꿔 버렸어요.",
      "「이면」이 없어요.",
    ],
    tokens: [{ pre: "x가" }, { tex: "\\sqrt{2}", post: "이면" }, { pre: "x는" }, { pre: "무리수이다." }],
    cut: 2,
    pText: [{ pre: "x가 " }, { tex: "\\sqrt{2}", post: "이다" }],
    qText: [{ pre: "x는 무리수이다" }],
    tip: "가정이 겉으로 드러나 있지 않은 문장이에요. 「x가 …이면」을 앞에 세워 보세요.",
    why: "가정이 숨어 있는 명제도 조건문 꼴로 고쳐 쓰면 가정과 결론이 또렷해져요.",
  },
  {
    id: "t4",
    raw: "정사각형은 마름모이다.",
    rewrites: [
      "x가 정사각형이면 x는 마름모이다.",
      "x가 마름모이면 x는 정사각형이다.",
      "x가 정사각형이면 x는 직사각형이다.",
      "x는 정사각형이고 마름모이다.",
    ],
    rewriteAnswer: 0,
    rewriteWhy: [
      "",
      "앞뒤를 맞바꾼 문장이에요. 마름모 중에는 정사각형이 아닌 것도 있지요.",
      "결론을 다른 도형으로 바꿔 버렸어요.",
      "「이면」이 없어요.",
    ],
    tokens: [{ pre: "x가" }, { pre: "정사각형이면" }, { pre: "x는" }, { pre: "마름모이다." }],
    cut: 2,
    pText: [{ pre: "x가 정사각형이다" }],
    qText: [{ pre: "x는 마름모이다" }],
    tip: "도형에 대한 명제도 「x가 …이면 x는 …이다」 꼴로 쓸 수 있어요.",
    why: "「A는 B이다」 꼴은 대개 「x가 A이면 x는 B이다」라는 뜻이에요.",
  },
  {
    id: "t5",
    tokens: [{ pre: "비가" }, { pre: "오면" }, { pre: "땅이" }, { pre: "젖는다." }],
    cut: 2,
    pText: [{ pre: "비가 온다" }],
    qText: [{ pre: "땅이 젖는다" }],
    tip: "「오면」까지가 가정이에요.",
    why: "일상의 문장도 가정과 결론으로 나눌 수 있어요. 비가 오는 것이 조건, 땅이 젖는 것이 결과지요.",
  },
  {
    id: "t6",
    tokens: [{ pre: "x가" }, { pre: "4의" }, { pre: "배수이면" }, { pre: "x는" }, { pre: "짝수이다." }],
    cut: 3,
    pText: [{ pre: "x가 4의 배수이다" }],
    qText: [{ pre: "x는 짝수이다" }],
    tip: "「배수이면」까지가 가정이에요.",
    why: "가정과 결론을 나눠 두면 다음 탭에서 진리집합을 만들 때 바로 쓸 수 있어요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 진리집합 비교기
// ══════════════════════════════════════════════════════════════
export type Cond = { cond: Piece; test: (n: number) => boolean };

export type SubsetTask = {
  id: string;
  U: number[];
  p: Cond;
  q: Cond;
  tipP: string;
  tipQ: string;
  why: string;
};

const U12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let f = 2; f * f <= n; f++) if (n % f === 0) return false;
  return true;
};

export const SUBSETS: SubsetTask[] = [
  {
    id: "u1",
    U: U12,
    p: { cond: { pre: "x는 6의 약수이다" }, test: (n) => 6 % n === 0 },
    q: { cond: { pre: "x는 12의 약수이다" }, test: (n) => 12 % n === 0 },
    tipP: "6을 나누어떨어지게 하는 수를 모두 찾아보세요.",
    tipQ: "12를 나누어떨어지게 하는 수를 모두 찾아보세요.",
    why: "6의 약수는 12의 약수이기도 해요. P 의 원소가 하나도 빠짐없이 Q 안에 있으니 명제는 참이에요.",
  },
  {
    id: "u2",
    U: U12,
    p: { cond: { pre: "x는 4의 배수이다" }, test: (n) => n % 4 === 0 },
    q: { cond: { pre: "x는 짝수이다" }, test: (n) => n % 2 === 0 },
    tipP: "4씩 뛰어 세어 보세요.",
    tipQ: "2로 나누어떨어지는 수를 모두 찾아보세요.",
    why: "4의 배수는 4 = 2×2 이므로 반드시 2로도 나누어떨어져요. P ⊂ Q 이니 명제는 참이에요.",
  },
  {
    id: "u3",
    U: U12,
    p: { cond: { pre: "x는 짝수이다" }, test: (n) => n % 2 === 0 },
    q: { cond: { pre: "x는 4의 배수이다" }, test: (n) => n % 4 === 0 },
    tipP: "2로 나누어떨어지는 수를 모두 찾아보세요.",
    tipQ: "4씩 뛰어 세어 보세요.",
    why: "앞 문제의 가정과 결론을 맞바꾼 명제예요. 이번에는 Q 가 P 안에 들어가 버려서 P ⊂ Q 가 아니에요. 2, 6, 10 이 반례랍니다.",
  },
  {
    id: "u4",
    U: U12,
    p: { cond: { pre: "x는 소수이다" }, test: isPrime },
    q: { cond: { pre: "x는 홀수이다" }, test: (n) => n % 2 === 1 },
    tipP: "1과 자기 자신만을 약수로 갖는 수예요. 1은 소수가 아니랍니다.",
    tipQ: "2로 나누어떨어지지 않는 수예요.",
    why: "소수는 대부분 홀수지만 2 하나가 짝수예요. 반례가 딱 하나만 있어도 명제는 거짓이 돼요.",
  },
  {
    id: "u5",
    U: U12,
    p: { cond: { tex: "x > 8", post: "이다" }, test: (n) => n > 8 },
    q: { cond: { tex: "x \\ge 6", post: "이다" }, test: (n) => n >= 6 },
    tipP: "8은 들어가지 않아요.",
    tipQ: "6은 들어가요.",
    why: "8보다 큰 수는 모두 6 이상이에요. 수직선에서 좁은 범위가 넓은 범위 안에 들어가는 셈이지요.",
  },
  {
    id: "u6",
    U: U12,
    p: { cond: { pre: "x는 3의 배수이다" }, test: (n) => n % 3 === 0 },
    q: { cond: { pre: "x는 9의 약수이다" }, test: (n) => 9 % n === 0 },
    tipP: "3씩 뛰어 세어 보세요.",
    tipQ: "9를 나누어떨어지게 하는 수예요. 1도 빠뜨리지 마세요.",
    why: "두 집합이 겹치기는 하지만 어느 쪽도 다른 쪽을 품지 못해요. 6과 12 가 P 안에 있으면서 Q 밖에 있으니 반례랍니다.",
  },
];

export function truthSetOf(t: SubsetTask, which: "p" | "q"): number[] {
  return t.U.filter((n) => (which === "p" ? t.p : t.q).test(n));
}
export function isSubset(P: number[], Q: number[]): boolean {
  return P.every((n) => Q.includes(n));
}
/** 반례 — P 에는 있고 Q 에는 없는 원소 */
export function counterOf(P: number[], Q: number[]): number[] {
  return P.filter((n) => !Q.includes(n));
}

// ── 벤 다이어그램 자리 ────────────────────────────────────────
export type VennKind = "pInQ" | "qInP" | "cross";

export function vennKind(P: number[], Q: number[]): VennKind {
  if (isSubset(P, Q)) return "pInQ";
  if (isSubset(Q, P)) return "qInP";
  return "cross";
}

export type Slot = { x: number; y: number };

export const VENN = {
  w: 480,
  h: 300,
  box: { x: 8, y: 14, w: 464, h: 272, r: 20 },
  chipR: 13,
  uLabel: { x: 30, y: 34 },
  /** 한쪽이 다른 쪽을 품을 때 — 큰 원 안에 작은 원 */
  nested: {
    outer: { cx: 172, cy: 150, r: 118, lx: 76, ly: 78 },
    inner: { cx: 152, cy: 164, r: 70, lx: 108, ly: 214 },
    innerSlots: [
      { x: 122, y: 144 },
      { x: 152, y: 138 },
      { x: 182, y: 144 },
      { x: 122, y: 186 },
      { x: 152, y: 192 },
      { x: 182, y: 186 },
    ] as Slot[],
    ringSlots: [
      { x: 140, y: 62 },
      { x: 200, y: 64 },
      { x: 250, y: 100 },
      { x: 258, y: 150 },
      { x: 248, y: 202 },
      { x: 206, y: 240 },
    ] as Slot[],
    outSlots: [
      { x: 332, y: 64 },
      { x: 390, y: 64 },
      { x: 448, y: 64 },
      { x: 332, y: 124 },
      { x: 390, y: 124 },
      { x: 448, y: 124 },
      { x: 332, y: 184 },
      { x: 390, y: 184 },
      { x: 448, y: 184 },
      { x: 332, y: 244 },
      { x: 390, y: 244 },
      { x: 448, y: 244 },
    ] as Slot[],
  },
  /** 어느 쪽도 다른 쪽을 품지 못할 때 — 두 원이 겹친다 */
  cross: {
    a: { cx: 166, cy: 136, r: 96, lx: 100, ly: 78 },
    b: { cx: 270, cy: 136, r: 96, lx: 336, ly: 78 },
    aOnlySlots: [
      { x: 104, y: 136 },
      { x: 104, y: 176 },
      { x: 144, y: 112 },
      { x: 144, y: 160 },
      { x: 144, y: 208 },
    ] as Slot[],
    bothSlots: [
      { x: 218, y: 76 },
      { x: 218, y: 106 },
      { x: 218, y: 136 },
      { x: 218, y: 166 },
      { x: 218, y: 196 },
    ] as Slot[],
    bOnlySlots: [
      { x: 332, y: 136 },
      { x: 332, y: 176 },
      { x: 292, y: 112 },
      { x: 292, y: 160 },
      { x: 292, y: 208 },
    ] as Slot[],
    outSlots: [
      { x: 424, y: 70 },
      { x: 424, y: 130 },
      { x: 424, y: 190 },
      { x: 110, y: 260 },
      { x: 180, y: 260 },
      { x: 250, y: 260 },
      { x: 320, y: 260 },
      { x: 390, y: 260 },
    ] as Slot[],
  },
};

/** 원소를 벤 다이어그램의 어느 자리에 놓을지 정한다. */
export function placeChips(U: number[], P: number[], Q: number[]): { n: number; x: number; y: number; zone: string }[] {
  const kind = vennKind(P, Q);
  const out: { n: number; x: number; y: number; zone: string }[] = [];
  const put = (nums: number[], slots: Slot[], zone: string) => {
    nums.forEach((n, i) => {
      const s = slots[Math.min(i, slots.length - 1)];
      out.push({ n, x: s.x, y: s.y, zone });
    });
  };
  if (kind === "cross") {
    const c = VENN.cross;
    put(P.filter((n) => !Q.includes(n)), c.aOnlySlots, "aOnly");
    put(P.filter((n) => Q.includes(n)), c.bothSlots, "both");
    put(Q.filter((n) => !P.includes(n)), c.bOnlySlots, "bOnly");
    put(U.filter((n) => !P.includes(n) && !Q.includes(n)), c.outSlots, "out");
  } else {
    const c = VENN.nested;
    const inner = kind === "pInQ" ? P : Q;
    const big = kind === "pInQ" ? Q : P;
    put(inner, c.innerSlots, "inner");
    put(big.filter((n) => !inner.includes(n)), c.ringSlots, "ring");
    put(U.filter((n) => !big.includes(n)), c.outSlots, "out");
  }
  return out;
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 삼단논법 — 진리집합 사슬 잇기
// ══════════════════════════════════════════════════════════════
export type Ring = { id: string; label: string };

export type ChainTask = {
  id: string;
  emoji: string;
  theme: string;
  /** 좁은 것부터 넓은 것 순서 */
  rings: Ring[];
  /** 카드가 처음 놓이는 순서(무작위를 쓰지 않아 서버 렌더와 어긋나지 않는다) */
  scramble: number[];
  /** 사슬을 완성한 뒤 판정할 명제들 */
  quiz: { from: string; to: string; ok: boolean; why: string }[];
  note: string;
};

export const CHAINS: ChainTask[] = [
  {
    id: "c1",
    emoji: "🔢",
    theme: "수 체계",
    rings: [
      { id: "nat", label: "자연수" },
      { id: "int", label: "정수" },
      { id: "rat", label: "유리수" },
      { id: "real", label: "실수" },
    ],
    scramble: [2, 0, 3, 1],
    quiz: [
      { from: "nat", to: "rat", ok: true, why: "자연수 → 정수 → 유리수 로 이어지니 삼단논법으로 참이에요." },
      { from: "rat", to: "int", ok: false, why: "0.5 는 유리수지만 정수가 아니에요. 넓은 쪽에서 좁은 쪽으로는 갈 수 없어요." },
      { from: "int", to: "real", ok: true, why: "정수 → 유리수 → 실수 로 이어지니 참이에요." },
      { from: "real", to: "nat", ok: false, why: "√2 는 실수지만 자연수가 아니에요." },
    ],
    note: "안쪽에서 바깥쪽으로 가는 화살표만 참이에요. 거꾸로 가려 하면 반례가 생깁니다.",
  },
  {
    id: "c2",
    emoji: "✖️",
    theme: "배수",
    rings: [
      { id: "m12", label: "12의 배수" },
      { id: "m4", label: "4의 배수" },
      { id: "even", label: "짝수" },
    ],
    scramble: [1, 2, 0],
    quiz: [
      { from: "m12", to: "even", ok: true, why: "12의 배수 → 4의 배수 → 짝수 로 이어지니 참이에요." },
      { from: "even", to: "m4", ok: false, why: "2 는 짝수지만 4의 배수가 아니에요." },
      { from: "m4", to: "even", ok: true, why: "4 = 2×2 이므로 4의 배수는 반드시 짝수예요." },
    ],
    note: "12 = 4×3 이고 4 = 2×2 예요. 약수가 많은 쪽일수록 배수의 집합은 좁아집니다.",
  },
  {
    id: "c3",
    emoji: "⬜",
    theme: "사각형",
    rings: [
      { id: "sq", label: "정사각형" },
      { id: "rh", label: "마름모" },
      { id: "pa", label: "평행사변형" },
      { id: "tr", label: "사다리꼴" },
    ],
    scramble: [3, 1, 0, 2],
    quiz: [
      { from: "sq", to: "pa", ok: true, why: "정사각형 → 마름모 → 평행사변형 으로 이어지니 참이에요." },
      { from: "tr", to: "rh", ok: false, why: "평행한 변이 한 쌍뿐인 사다리꼴은 마름모가 아니에요." },
      { from: "rh", to: "tr", ok: true, why: "마름모 → 평행사변형 → 사다리꼴 로 이어지니 참이에요." },
    ],
    note: "네 변이 모두 같으면 마름모, 두 쌍의 대변이 평행하면 평행사변형, 한 쌍만 평행해도 사다리꼴이에요.",
  },
  {
    id: "c4",
    emoji: "🐶",
    theme: "동물",
    rings: [
      { id: "jin", label: "진돗개" },
      { id: "dog", label: "개" },
      { id: "mam", label: "포유류" },
      { id: "ver", label: "척추동물" },
    ],
    scramble: [2, 3, 1, 0],
    quiz: [
      { from: "jin", to: "mam", ok: true, why: "진돗개 → 개 → 포유류 로 이어지니 참이에요." },
      { from: "mam", to: "dog", ok: false, why: "고양이는 포유류지만 개가 아니에요." },
      { from: "dog", to: "ver", ok: true, why: "개 → 포유류 → 척추동물 로 이어지니 참이에요." },
    ],
    note: "생물의 분류도 진리집합의 포함 관계로 볼 수 있어요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 사슬 퍼즐 — 삼단논법과 뒤집기(대우)
// ══════════════════════════════════════════════════════════════
export type CondRef = { id: string; neg: boolean };

export type CondDef = {
  id: string;
  /** 배지에 쓸 짧은 이름 */
  nameYes: string;
  nameNo: string;
  /** 「…이면」 자리에 오는 말 */
  ifYes: string;
  ifNo: string;
  /** 「…이다」 자리에 오는 말 */
  thenYes: string;
  thenNo: string;
};

export type Stmt = { key: string; from: CondRef; to: CondRef };

export type PuzzleTask = {
  id: string;
  emoji: string;
  title: string;
  conds: CondDef[];
  /** 참이라고 주어진 명제들 */
  cards: Stmt[];
  /** 참임을 보여야 할 명제 */
  goal: Stmt;
  hint: string;
  note: string;
};

export function flipRef(r: CondRef): CondRef {
  return { id: r.id, neg: !r.neg };
}
export function sameRef(a: CondRef, b: CondRef): boolean {
  return a.id === b.id && a.neg === b.neg;
}
/** 뒤집기(대우) — p → q 를 ~q → ~p 로 */
export function contra(s: Stmt): Stmt {
  return { key: s.key, from: flipRef(s.to), to: flipRef(s.from) };
}
export function condName(c: CondDef, neg: boolean): string {
  return neg ? c.nameNo : c.nameYes;
}
export function condIf(c: CondDef, neg: boolean): string {
  return neg ? c.ifNo : c.ifYes;
}
export function condThen(c: CondDef, neg: boolean): string {
  return neg ? c.thenNo : c.thenYes;
}
export function findCond(t: PuzzleTask, id: string): CondDef {
  return t.conds.find((c) => c.id === id) as CondDef;
}

export const PUZZLES: PuzzleTask[] = [
  {
    id: "z1",
    emoji: "🌨️",
    title: "눈 오는 날",
    conds: [
      { id: "snow", nameYes: "눈이 온다", nameNo: "눈이 오지 않는다", ifYes: "눈이 오면", ifNo: "눈이 오지 않으면", thenYes: "눈이 온다", thenNo: "눈이 오지 않는다" },
      {
        id: "slip",
        nameYes: "길이 미끄럽다",
        nameNo: "길이 미끄럽지 않다",
        ifYes: "길이 미끄러우면",
        ifNo: "길이 미끄럽지 않으면",
        thenYes: "길이 미끄럽다",
        thenNo: "길이 미끄럽지 않다",
      },
      { id: "late", nameYes: "학교에 늦는다", nameNo: "학교에 늦지 않는다", ifYes: "학교에 늦으면", ifNo: "학교에 늦지 않으면", thenYes: "학교에 늦는다", thenNo: "학교에 늦지 않는다" },
    ],
    cards: [
      { key: "a", from: { id: "snow", neg: false }, to: { id: "slip", neg: false } },
      { key: "b", from: { id: "slip", neg: false }, to: { id: "late", neg: false } },
    ],
    goal: { key: "goal", from: { id: "snow", neg: false }, to: { id: "late", neg: false } },
    hint: "두 카드를 그대로 이어 붙이면 끝나요. 뒤집을 필요가 없어요.",
    note: "가장 기본이 되는 삼단논법이에요. 앞 카드의 결론과 뒤 카드의 가정이 같으면 이어집니다.",
  },
  {
    id: "z2",
    emoji: "🚲",
    title: "지수의 하루",
    conds: [
      { id: "weekday", nameYes: "평일이다", nameNo: "휴일이다", ifYes: "평일이면", ifNo: "휴일이면", thenYes: "평일이다", thenNo: "휴일이다" },
      {
        id: "bike",
        nameYes: "자전거를 탄다",
        nameNo: "자전거를 타지 않는다",
        ifYes: "지수가 자전거를 타면",
        ifNo: "지수가 자전거를 타지 않으면",
        thenYes: "지수는 자전거를 탄다",
        thenNo: "지수는 자전거를 타지 않는다",
      },
      {
        id: "shoes",
        nameYes: "운동화를 신는다",
        nameNo: "운동화를 신지 않는다",
        ifYes: "지수가 운동화를 신으면",
        ifNo: "지수가 운동화를 신지 않으면",
        thenYes: "지수는 운동화를 신는다",
        thenNo: "지수는 운동화를 신지 않는다",
      },
    ],
    cards: [
      { key: "a", from: { id: "weekday", neg: false }, to: { id: "bike", neg: true } },
      { key: "b", from: { id: "weekday", neg: true }, to: { id: "shoes", neg: false } },
    ],
    goal: { key: "goal", from: { id: "shoes", neg: true }, to: { id: "bike", neg: true } },
    hint: "출발은 「운동화를 신지 않는다」예요. 이 말로 시작하는 카드를 만들려면 한 장을 뒤집어야 해요.",
    note: "하루는 평일 아니면 휴일이에요. 그래서 「휴일이 아니다」와 「평일이다」는 같은 말이랍니다.",
  },
  {
    id: "z3",
    emoji: "📘",
    title: "숙제와 게임",
    conds: [
      {
        id: "hw",
        nameYes: "숙제를 한다",
        nameNo: "숙제를 하지 않는다",
        ifYes: "수학 숙제를 하면",
        ifNo: "수학 숙제를 하지 않으면",
        thenYes: "수학 숙제를 한다",
        thenNo: "수학 숙제를 하지 않는다",
      },
      { id: "game", nameYes: "게임을 한다", nameNo: "게임을 하지 않는다", ifYes: "게임을 하면", ifNo: "게임을 하지 않으면", thenYes: "게임을 한다", thenNo: "게임을 하지 않는다" },
      { id: "sleep", nameYes: "일찍 잔다", nameNo: "일찍 자지 않는다", ifYes: "일찍 자면", ifNo: "일찍 자지 않으면", thenYes: "일찍 잔다", thenNo: "일찍 자지 않는다" },
    ],
    cards: [
      { key: "a", from: { id: "hw", neg: false }, to: { id: "game", neg: true } },
      { key: "b", from: { id: "game", neg: true }, to: { id: "sleep", neg: false } },
    ],
    goal: { key: "goal", from: { id: "sleep", neg: true }, to: { id: "hw", neg: true } },
    hint: "이번에는 두 장 모두 뒤집어야 해요. 목표 명제의 가정에서 거꾸로 거슬러 올라가 보세요.",
    note: "두 장을 모두 뒤집으면 사슬의 방향이 통째로 뒤집혀요. 이것이 다음 시간에 배울 「대우」랍니다.",
  },
  {
    id: "z4",
    emoji: "⬜",
    title: "도형 거슬러 올라가기",
    conds: [
      {
        id: "sq",
        nameYes: "정사각형이다",
        nameNo: "정사각형이 아니다",
        ifYes: "x가 정사각형이면",
        ifNo: "x가 정사각형이 아니면",
        thenYes: "x는 정사각형이다",
        thenNo: "x는 정사각형이 아니다",
      },
      { id: "rh", nameYes: "마름모이다", nameNo: "마름모가 아니다", ifYes: "x가 마름모이면", ifNo: "x가 마름모가 아니면", thenYes: "x는 마름모이다", thenNo: "x는 마름모가 아니다" },
      {
        id: "pa",
        nameYes: "평행사변형이다",
        nameNo: "평행사변형이 아니다",
        ifYes: "x가 평행사변형이면",
        ifNo: "x가 평행사변형이 아니면",
        thenYes: "x는 평행사변형이다",
        thenNo: "x는 평행사변형이 아니다",
      },
    ],
    cards: [
      { key: "a", from: { id: "sq", neg: false }, to: { id: "rh", neg: false } },
      { key: "b", from: { id: "rh", neg: false }, to: { id: "pa", neg: false } },
    ],
    goal: { key: "goal", from: { id: "pa", neg: true }, to: { id: "sq", neg: true } },
    hint: "평행사변형이 아니면 마름모도 될 수 없어요. 두 장을 모두 뒤집어 보세요.",
    note: "탭③의 포함 관계를 떠올려 보세요. 바깥 원 밖에 있는 것은 안쪽 원 밖에도 있답니다.",
  },
];

/** 카드를 한 번씩 모두 써서 목표에 닿는 방법을 모두 찾는다(완전탐색). */
export function solvePuzzle(t: PuzzleTask): { card: number; flip: boolean }[][] {
  const found: { card: number; flip: boolean }[][] = [];
  const n = t.cards.length;
  const walk = (at: CondRef, used: boolean[], acc: { card: number; flip: boolean }[]) => {
    if (acc.length === n) {
      if (sameRef(at, t.goal.to)) found.push([...acc]);
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      for (const flip of [false, true]) {
        const s = flip ? contra(t.cards[i]) : t.cards[i];
        if (!sameRef(s.from, at)) continue;
        used[i] = true;
        acc.push({ card: i, flip });
        walk(s.to, used, acc);
        acc.pop();
        used[i] = false;
      }
    }
  };
  walk(t.goal.from, new Array(n).fill(false), []);
  return found;
}
