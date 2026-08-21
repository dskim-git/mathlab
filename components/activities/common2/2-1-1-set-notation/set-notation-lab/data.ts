// 집합의 뜻과 표현 — 활동 데이터
//
//  ① 집합일까?      기준이 분명한 모임(집합)과 그렇지 않은 모임을 갈라 담고, 집합이면 원소를 골라낸다.
//  ② 기호 바구니     주어진 집합에 대하여 각 수를 ∈ 바구니와 ∉ 바구니로 나누어 담는다.
//  ③ 표현 바꾸기     원소나열법 ↔ 조건제시법 을 서로 바꾸어 나타낸다.
//  ④ 집합 탐정       숨은 조건을 가진 집합에 수를 하나씩 물어보며 정체를 알아낸다.

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

export function divisors(n: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= n; d++) if (n % d === 0) out.push(d);
  return out;
}

/** 원소나열법 KaTeX — listTex([1,2,3]) → "\{1,\; 2,\; 3\}" */
export function listTex(xs: (number | string)[]): string {
  return `\\{${xs.join(",\\; ")}\\}`;
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 집합일까?
// ══════════════════════════════════════════════════════════════
export type SetCard = {
  id: string;
  /** 카드 문구 — 수식이 있으면 pre + tex + post 로 나뉜다 */
  pre: string;
  tex?: string;
  post?: string;
  isSet: boolean;
  why: string;
  /** 집합일 때의 원소 (집합이 아니면 빈 배열) */
  members: string[];
  /** 원소 고르기 후보 */
  pool: string[];
};

export const CARDS: SetCard[] = [
  {
    id: "c1",
    pre: "15의 약수의 모임",
    isSet: true,
    why: "15를 나누어떨어지게 하는 수는 누가 세어도 똑같아요. 대상이 분명하니 집합이에요.",
    members: ["1", "3", "5", "15"],
    pool: ["1", "2", "3", "4", "5", "6", "10", "15"],
  },
  {
    id: "c2",
    pre: "키가 큰 학생의 모임",
    isSet: false,
    why: "몇 cm부터 '큰' 걸까요? 기준이 사람마다 달라 대상을 분명히 정할 수 없으니 집합이 아니에요.",
    members: [],
    pool: [],
  },
  {
    id: "c3",
    pre: "방정식 ",
    tex: "x^2 - 5x + 6 = 0",
    post: " 의 해의 모임",
    isSet: true,
    why: "풀면 x = 2 또는 x = 3 — 답이 딱 정해지니 집합이에요.",
    members: ["2", "3"],
    pool: ["1", "2", "3", "4", "5", "6"],
  },
  {
    id: "c4",
    pre: "맛이 좋은 과일의 모임",
    isSet: false,
    why: "'맛이 좋다'는 사람마다 다르게 느껴요. 어느 과일이 들어갈지 정할 수 없으니 집합이 아니에요.",
    members: [],
    pool: [],
  },
  {
    id: "c5",
    pre: "20보다 작은 소수의 모임",
    isSet: true,
    why: "소수의 뜻이 분명하므로 20보다 작은 소수도 모두 정확히 가려낼 수 있어요.",
    members: ["2", "3", "5", "7", "11", "13", "17", "19"],
    pool: ["1", "2", "3", "5", "7", "9", "11", "13", "15", "17", "19", "21"],
  },
  {
    id: "c6",
    pre: "0에 가까운 정수의 모임",
    isSet: false,
    why: "'가깝다'의 기준이 없어요. 3은 가까운가요? 10은요? 대상을 정할 수 없으니 집합이 아니에요.",
    members: [],
    pool: [],
  },
  {
    id: "c7",
    pre: "MATH 에 쓰인 알파벳의 모임",
    isSet: true,
    why: "M, A, T, H 네 글자로 분명해요. 같은 글자가 여러 번 나와도 원소로는 한 번만 씁니다.",
    members: ["M", "A", "T", "H"],
    pool: ["M", "A", "T", "H", "S", "E", "N"],
  },
  {
    id: "c8",
    pre: "한 자리 자연수 중 3의 배수의 모임",
    isSet: true,
    why: "한 자리 자연수는 1부터 9까지, 그중 3의 배수는 딱 정해져요.",
    members: ["3", "6", "9"],
    pool: ["1", "3", "5", "6", "9", "12"],
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 기호 바구니 (∈ / ∉)
// ══════════════════════════════════════════════════════════════
export type BallRound = {
  id: string;
  /** 집합의 이름 (대문자) */
  name: string;
  /** 조건제시법의 조건 부분 */
  cond: string;
  /** 집합의 모든 원소 */
  all: number[];
  /** 바구니에 나누어 담을 수들 */
  balls: number[];
};

export const BALL_ROUNDS: BallRound[] = [
  { id: "b1", name: "A", cond: "18의 약수", all: [1, 2, 3, 6, 9, 18], balls: [1, 2, 4, 6, 8, 9, 12, 18] },
  { id: "b2", name: "B", cond: "20보다 작은 소수", all: [2, 3, 5, 7, 11, 13, 17, 19], balls: [2, 7, 9, 13, 15, 17, 21] },
  { id: "b3", name: "C", cond: "24의 약수 중 짝수", all: [2, 4, 6, 8, 12, 24], balls: [2, 3, 6, 8, 9, 12, 16, 24] },
  { id: "b4", name: "D", cond: "30 이하의 4의 배수", all: [4, 8, 12, 16, 20, 24, 28], balls: [4, 6, 12, 14, 20, 26, 28] },
];

export function inSet(r: BallRound, n: number): boolean {
  return r.all.includes(n);
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 표현 바꾸기
// ══════════════════════════════════════════════════════════════
export type Range = { key: string; label: string; max: number };
export type Pred = { key: string; label: string; f: (n: number) => boolean };

export const RANGES: Range[] = [
  { key: "le10", label: "10 이하의", max: 10 },
  { key: "lt10", label: "10보다 작은", max: 9 },
  { key: "le20", label: "20 이하의", max: 20 },
  { key: "lt20", label: "20보다 작은", max: 19 },
  { key: "le30", label: "30 이하의", max: 30 },
  { key: "le40", label: "40 이하의", max: 40 },
];

export const PREDS: Pred[] = [
  { key: "nat", label: "자연수", f: () => true },
  { key: "even", label: "짝수", f: (n) => n % 2 === 0 },
  { key: "odd", label: "홀수", f: (n) => n % 2 === 1 },
  { key: "prime", label: "소수", f: isPrime },
  { key: "m3", label: "3의 배수", f: (n) => n % 3 === 0 },
  { key: "m4", label: "4의 배수", f: (n) => n % 4 === 0 },
  { key: "m5", label: "5의 배수", f: (n) => n % 5 === 0 },
  { key: "m6", label: "6의 배수", f: (n) => n % 6 === 0 },
];

/** 범위 + 조건으로 만들어지는 집합 */
export function buildSet(r: Range, p: Pred): number[] {
  const out: number[] = [];
  for (let n = 1; n <= r.max; n++) if (p.f(n)) out.push(n);
  return out;
}

export function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const x = [...a].sort((s, t) => s - t);
  const y = [...b].sort((s, t) => s - t);
  return x.every((v, i) => v === y[i]);
}

export type ConvToCond = {
  id: string;
  kind: "toCond";
  /** 원소나열법으로 주어진 집합 */
  target: number[];
  hint: string;
};

export type ConvToList = {
  id: string;
  kind: "toList";
  /** 조건제시법의 조건 부분 (수식이 있으면 pre + tex + post) */
  condPre: string;
  condTex?: string;
  condPost?: string;
  answer: number[];
  pool: number[];
  hint: string;
};

export type Conv = ConvToCond | ConvToList;

export const CONVS: Conv[] = [
  {
    id: "v1",
    kind: "toCond",
    target: [2, 3, 5, 7],
    hint: "1은 소수가 아니라는 점을 떠올려 보세요. 범위를 두 가지로 잡아도 같은 집합이 될 수 있어요.",
  },
  {
    id: "v2",
    kind: "toList",
    condPre: "24의 약수",
    answer: [1, 2, 3, 4, 6, 8, 12, 24],
    pool: [1, 2, 3, 4, 5, 6, 8, 9, 12, 16, 18, 24],
    hint: "24 = 1 × 24 = 2 × 12 = 3 × 8 = 4 × 6 — 짝을 지어 찾으면 빠짐없이 찾을 수 있어요.",
  },
  {
    id: "v3",
    kind: "toCond",
    target: [4, 8, 12, 16, 20],
    hint: "가장 큰 원소가 20이에요. '20보다 작은'으로 잡으면 20이 빠져 버려요.",
  },
  {
    id: "v4",
    kind: "toList",
    condPre: "15보다 작은 소수",
    answer: [2, 3, 5, 7, 11, 13],
    pool: [1, 2, 3, 5, 7, 9, 11, 13, 14, 15],
    hint: "9 = 3 × 3, 15 = 3 × 5 — 약수가 셋 이상이면 소수가 아니에요.",
  },
  {
    id: "v5",
    kind: "toCond",
    target: [6, 12, 18, 24, 30, 36],
    hint: "가장 큰 원소가 36이니 범위가 30이면 모자라요.",
  },
  {
    id: "v6",
    kind: "toList",
    condPre: "방정식 ",
    condTex: "x^2 - 7x + 12 = 0",
    condPost: " 의 해",
    answer: [3, 4],
    pool: [1, 2, 3, 4, 6, 12],
    hint: "곱해서 12, 더해서 7이 되는 두 수를 찾아보세요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 집합 탐정
// ══════════════════════════════════════════════════════════════
export const DETECTIVE_MAX = 24;

export type Mystery = {
  id: string;
  f: (n: number) => boolean;
  choices: string[];
  ans: number;
  /** 이 정도 질문이면 훌륭 */
  par: number;
  tip: string;
};

export const MYSTERIES: Mystery[] = [
  {
    id: "d1",
    f: (n) => n % 4 === 0,
    choices: ["x는 짝수", "x는 4의 배수", "x는 8의 약수", "x는 4의 약수"],
    ans: 1,
    par: 6,
    tip: "2와 6은 원소가 아니고 4, 8, 12, 16, 20, 24 가 원소예요 — 4의 배수랍니다.",
  },
  {
    id: "d2",
    f: isPrime,
    choices: ["x는 홀수", "x는 3의 배수", "x는 소수", "x는 24의 약수"],
    ans: 2,
    par: 8,
    tip: "1과 9는 원소가 아닌데 2는 원소예요. 홀수도 배수도 아닌 — 소수의 모임이에요.",
  },
  {
    id: "d3",
    f: (n) => 24 % n === 0,
    choices: ["x는 12의 약수", "x는 24의 약수", "x는 6의 배수", "x는 짝수"],
    ans: 1,
    par: 7,
    tip: "8과 24가 원소인데 5, 7은 아니에요. 24를 나누어떨어지게 하는 수의 모임이에요.",
  },
  {
    id: "d4",
    f: (n) => Number.isInteger(Math.sqrt(n)),
    choices: ["x는 홀수", "x는 4의 약수", "x는 어떤 자연수의 제곱", "x는 3의 약수"],
    ans: 2,
    par: 6,
    tip: "1, 4, 9, 16 만 원소예요 — 1², 2², 3², 4² 이지요.",
  },
];

export function mysterySet(m: Mystery): number[] {
  const out: number[] = [];
  for (let n = 1; n <= DETECTIVE_MAX; n++) if (m.f(n)) out.push(n);
  return out;
}
