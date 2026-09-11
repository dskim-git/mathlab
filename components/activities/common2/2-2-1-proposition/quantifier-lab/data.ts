// '모든'과 '어떤'이 있는 명제 — 활동 데이터
//
//  조건 p 의 진리집합을 P, 전체집합을 U 라 하면
//      「모든 x에 대하여 p이다」가 참  ⟺  P = U
//      「어떤 x에 대하여 p이다」가 참  ⟺  P ≠ ∅
//  이다. 「모든 …」을 거짓으로 만드는 x 를 반례라 하고, 반례 하나만 찾으면 거짓임을
//  보일 수 있다. 반대로 「어떤 …」은 사례 하나만 찾으면 참임을 보일 수 있다.
//
//  부정은 한정어와 조건을 함께 뒤집는다.
//      ~(모든 x에 대하여 p)  =  어떤 x에 대하여 ~p       P = U 의 부정이 P ≠ U ⟺ Pᶜ ≠ ∅
//      ~(어떤 x에 대하여 p)  =  모든 x에 대하여 ~p       P ≠ ∅ 의 부정이 P = ∅ ⟺ Pᶜ = U
//
//  U 가 비어 있지 않으면 P = U 에서 P ≠ ∅ 가 따라 나오므로
//  「모든이 참인데 어떤이 거짓」인 경우는 절대로 생기지 않는다.

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

export type Elem = { id: string; label: string; emoji?: string };

export type Quant = "all" | "some";
export const QUANT_WORD: Record<Quant, string> = { all: "모든", some: "어떤" };
export const QUANT_FLIP: Record<Quant, Quant> = { all: "some", some: "all" };

export function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 진리집합 스캐너
// ══════════════════════════════════════════════════════════════
const SEA: Elem[] = [
  { id: "dolphin", label: "돌고래", emoji: "🐬" },
  { id: "shark", label: "상어", emoji: "🦈" },
  { id: "salmon", label: "연어", emoji: "🐟" },
  { id: "puffer", label: "복어", emoji: "🐡" },
  { id: "octopus", label: "문어", emoji: "🐙" },
  { id: "shrimp", label: "새우", emoji: "🦐" },
  { id: "crab", label: "게", emoji: "🦀" },
  { id: "turtle", label: "바다거북", emoji: "🐢" },
];

const INT7: Elem[] = [
  { id: "m3", label: "−3" },
  { id: "m2", label: "−2" },
  { id: "m1", label: "−1" },
  { id: "z0", label: "0" },
  { id: "p1", label: "1" },
  { id: "p2", label: "2" },
  { id: "p3", label: "3" },
];
const INT_ALL = INT7.map((e) => e.id);

export type ScanTask = {
  id: string;
  /** 전체집합을 말로 설명한 것 */
  uLabel: string;
  universe: Elem[];
  /** 조건 p 의 내용 */
  cond: Piece;
  /** 조건을 참이 되게 하는 원소 = 진리집합 P */
  inP: string[];
  tip: string;
  /** 「모든 …」 판정 해설 */
  allWhy: string;
  /** 「어떤 …」 판정 해설 */
  someWhy: string;
  /** 다 풀면 덧붙일 한 줄 */
  note?: string;
};

export const SCANS: ScanTask[] = [
  {
    id: "s1",
    uLabel: "바다에 사는 친구 8마리",
    universe: SEA,
    cond: { pre: "x는 물에서 산다" },
    inP: SEA.map((e) => e.id),
    tip: "여덟 마리를 하나씩 살펴보세요. 물 밖에서 사는 친구가 한 마리라도 있나요?",
    allWhy: "여덟 마리 모두 물에서 살아요. 진리집합 P 가 전체집합 U 와 같으니 「모든 …」은 참이에요.",
    someWhy: "P 가 비어 있지 않으니 「어떤 …」도 참이에요. 돌고래 한 마리만 보여 줘도 충분하지요.",
  },
  {
    id: "s2",
    uLabel: "바다에 사는 친구 8마리",
    universe: SEA,
    cond: { pre: "x는 물고기이다" },
    inP: ["shark", "salmon", "puffer"],
    tip: "돌고래는 새끼를 낳아 젖을 먹이는 포유류, 문어는 연체동물, 새우와 게는 갑각류, 바다거북은 파충류예요.",
    allWhy: "돌고래처럼 물고기가 아닌 친구가 있어요. 이렇게 「모든 …」을 거짓으로 만드는 x 를 반례라고 해요.",
    someWhy: "상어·연어·복어가 물고기예요. 이런 사례를 하나만 찾아도 「어떤 …」은 참이 된답니다.",
    note: "반례는 하나만 있어도 「모든 …」이 무너져요. 여러 개를 찾을 필요가 없지요.",
  },
  {
    id: "s3",
    uLabel: "−3부터 3까지의 정수",
    universe: INT7,
    cond: { tex: "x^2 + 1 > 0", post: "이다" },
    inP: INT_ALL,
    tip: "제곱은 0보다 작아질 수 없어요. 거기에 1을 더하면 어떻게 될까요?",
    allWhy: "어떤 수를 제곱해도 0 이상이라 1을 더하면 반드시 양수예요. P = U 이니 「모든 …」은 참이에요.",
    someWhy: "P 가 비어 있지 않으니 「어떤 …」도 당연히 참이에요.",
    note: "전체집합을 실수 전체로 넓혀도 결과는 그대로예요. 어떤 실수를 넣어도 x² + 1 은 양수니까요.",
  },
  {
    id: "s4",
    uLabel: "−3부터 3까지의 정수",
    universe: INT7,
    cond: { tex: "x^2 > 0", post: "이다" },
    inP: INT_ALL.filter((id) => id !== "z0"),
    tip: "0을 빠뜨리지 마세요. 0의 제곱은 얼마인가요?",
    allWhy: "0을 넣으면 0² = 0 이라 「0보다 크다」가 거짓이에요. x = 0 이 반례랍니다.",
    someWhy: "0을 뺀 나머지는 제곱이 모두 양수예요. 사례가 있으니 「어떤 …」은 참이에요.",
    note: "전체집합을 실수 전체로 넓혀도 반례는 여전히 x = 0 하나뿐이에요.",
  },
  {
    id: "s5",
    uLabel: "−3부터 3까지의 정수",
    universe: INT7,
    cond: { tex: "x^2 \\le 0", post: "이다" },
    inP: ["z0"],
    tip: "제곱해서 0보다 작아지는 수는 없어요. 그렇다면 0과 같아지는 수는요?",
    allWhy: "−3을 넣으면 9 ≤ 0 이 되어 거짓이에요. 반례가 여럿이니 「모든 …」은 거짓이에요.",
    someWhy: "x = 0 이면 0 ≤ 0 이 참이에요. 사례가 딱 하나뿐이어도 「어떤 …」은 참이랍니다.",
    note: "P 의 원소가 하나뿐이어도 P ≠ ∅ 이므로 「어떤 …」은 참이에요.",
  },
  {
    id: "s6",
    uLabel: "−3부터 3까지의 정수",
    universe: INT7,
    cond: { tex: "x^2 + 1 = 0", post: "이다" },
    inP: [],
    tip: "x² = −1 이 되어야 해요. 제곱해서 음수가 되는 수가 있을까요?",
    allWhy: "조건을 만족하는 수가 하나도 없어요. P = ∅ 이니 P ≠ U 이고 「모든 …」은 거짓이에요.",
    someWhy: "P 가 비어 있으니 보여 줄 사례가 없어요. 그래서 「어떤 …」도 거짓이에요.",
    note: "전체집합을 실수 전체로 넓혀도 x² + 1 = 0 을 만족하는 실수는 없어요.",
  },
];

/** P = U 인가 (「모든 …」의 참) */
export function allTrue(t: ScanTask): boolean {
  return t.inP.length === t.universe.length;
}
/** P ≠ ∅ 인가 (「어떤 …」의 참) */
export function someTrue(t: ScanTask): boolean {
  return t.inP.length > 0;
}
/** 반례 — 「모든 …」을 거짓으로 만드는 원소 */
export function counterExamples(t: ScanTask): Elem[] {
  return t.universe.filter((e) => !t.inP.includes(e.id));
}
/** 사례 — 「어떤 …」을 참으로 만드는 원소 */
export function witnesses(t: ScanTask): Elem[] {
  return t.universe.filter((e) => t.inP.includes(e.id));
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 부정 램프 — 진리집합의 크기를 다이얼로 돌려 본다
// ══════════════════════════════════════════════════════════════
export const U2_SIZE = 8;

export type LampId = "L1" | "L2" | "L3" | "L4";

export type LampDef = {
  id: LampId;
  q: Quant;
  neg: boolean;
  /** 집합으로 옮긴 조건 */
  setCond: string;
  /** 같은 뜻을 개수 k 로 쓴 것 */
  altCond: string;
  /** |P| = k 일 때 참인가 */
  on: (k: number) => boolean;
};

export const LAMPS: LampDef[] = [
  { id: "L1", q: "all", neg: false, setCond: "P = U", altCond: "k = 8", on: (k) => k === U2_SIZE },
  { id: "L2", q: "some", neg: false, setCond: "P ≠ ∅", altCond: "k ≥ 1", on: (k) => k >= 1 },
  { id: "L3", q: "all", neg: true, setCond: "Pᶜ = U", altCond: "k = 0", on: (k) => k === 0 },
  { id: "L4", q: "some", neg: true, setCond: "Pᶜ ≠ ∅", altCond: "k ≤ 7", on: (k) => k <= U2_SIZE - 1 },
];

export function lampOf(id: LampId): LampDef {
  return LAMPS.find((l) => l.id === id) as LampDef;
}

/** 언제나 반대로 켜지는 짝 — 서로가 서로의 부정이다. */
export const NEG_PAIRS: [LampId, LampId][] = [
  ["L1", "L4"],
  ["L2", "L3"],
];

export function isNegPair(a: LampId, b: LampId): boolean {
  return NEG_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}
export function pairKey(a: LampId, b: LampId): string {
  return [a, b].sort().join("-");
}
/** 두 램프가 같이 켜지거나 같이 꺼지는 k — 짝이 아님을 보여 주는 반례 */
export function sameAtK(a: LampDef, b: LampDef): number | null {
  for (let k = 0; k <= U2_SIZE; k++) if (a.on(k) === b.on(k)) return k;
  return null;
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 부정 조립기
// ══════════════════════════════════════════════════════════════
export type NegTask = {
  id: string;
  /** 원래 명제의 한정어 */
  q: Quant;
  /** 「모든 …」일 때의 앞머리 */
  headAll: string;
  /** 「어떤 …」일 때의 앞머리 */
  headSome: string;
  /** 원래 술어 */
  predYes: Piece;
  /** 술어의 부정 */
  predNo: Piece;
  /** 원래 명제의 참·거짓 */
  truth: boolean;
  truthWhy: string;
  /** 부정을 맞힌 뒤 보여 줄 해설 */
  negWhy: string;
  tip: string;
};

export const NEGS: NegTask[] = [
  {
    id: "n1",
    q: "all",
    headAll: "모든 자연수는",
    headSome: "어떤 자연수는",
    predYes: { pre: "홀수이다" },
    predNo: { pre: "홀수가 아니다" },
    truth: false,
    truthWhy: "자연수 2는 홀수가 아니에요. 반례가 있으니 거짓이지요.",
    negWhy: "한정어가 「모든」에서 「어떤」으로, 술어가 「홀수이다」에서 「홀수가 아니다」로 함께 뒤집혔어요.",
    tip: "한정어와 술어를 둘 다 뒤집어야 해요. 하나만 뒤집으면 부정이 아니랍니다.",
  },
  {
    id: "n2",
    q: "all",
    headAll: "모든 자연수 x에 대하여",
    headSome: "어떤 자연수 x에 대하여",
    predYes: { tex: "x + 1 > 0", post: "이다" },
    predNo: { tex: "x + 1 \\le 0", post: "이다" },
    truth: true,
    truthWhy: "자연수는 1 이상이라 x + 1 은 2 이상이에요. 반례가 없으니 참이에요.",
    negWhy: "부등호의 부정은 방향만 바꾸는 것이 아니라 등호까지 함께 챙겨야 해요. > 의 부정은 ≤ 랍니다.",
    tip: "「크다」의 부정은 「작다」가 아니라 「작거나 같다」예요.",
  },
  {
    id: "n3",
    q: "all",
    headAll: "모든 휘문고 학생은",
    headSome: "어떤 휘문고 학생은",
    predYes: { pre: "남자이다" },
    predNo: { pre: "남자가 아니다" },
    truth: true,
    truthWhy: "휘문고등학교는 남자고등학교라 반례가 되는 학생을 찾을 수 없어요.",
    negWhy: "부정이 참이 되려면 남자가 아닌 학생이 단 한 명만 있으면 돼요. 그런 학생이 없으니 부정은 거짓이에요.",
    tip: "「모든 …」의 부정은 「하나라도 어긋나는 것이 있다」는 뜻이에요.",
  },
  {
    id: "n4",
    q: "some",
    headAll: "모든 실수 x에 대하여",
    headSome: "어떤 실수 x에 대하여",
    predYes: { tex: "x^2 < 0", post: "이다" },
    predNo: { tex: "x^2 \\ge 0", post: "이다" },
    truth: false,
    truthWhy: "실수를 제곱하면 절대로 음수가 되지 않아요. 사례가 하나도 없으니 거짓이에요.",
    negWhy: "「어떤」의 부정은 「모든」이에요. 사례가 하나도 없다는 말은 전부 어긋난다는 말이니까요.",
    tip: "이번에는 「어떤」이 「모든」으로 바뀌어요.",
  },
  {
    id: "n5",
    q: "some",
    headAll: "모든 삼각형은",
    headSome: "어떤 삼각형은",
    predYes: { pre: "정삼각형이다" },
    predNo: { pre: "정삼각형이 아니다" },
    truth: true,
    truthWhy: "세 변의 길이가 모두 같은 삼각형을 하나만 그려도 참이 돼요.",
    negWhy: "「어떤 삼각형은 정삼각형이다」의 부정은 「모든 삼각형은 정삼각형이 아니다」예요. 정삼각형이 실제로 있으니 부정은 거짓이지요.",
    tip: "사례가 하나라도 있으면 「어떤 …」은 참이에요.",
  },
  {
    id: "n6",
    q: "all",
    headAll: "모든 소수는",
    headSome: "어떤 소수는",
    predYes: { pre: "홀수가 아니다" },
    predNo: { pre: "홀수이다" },
    truth: false,
    truthWhy: "3은 소수이면서 홀수예요. 반례가 있으니 거짓이에요.",
    negWhy: "술어에 이미 「아니다」가 붙어 있으면 그것을 떼어 내는 것이 부정이에요. 「아니다」를 한 번 더 붙이는 것이 아니랍니다.",
    tip: "이미 부정이 붙은 술어를 다시 부정하면 원래대로 돌아와요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 반례 사냥 — 문제를 그때그때 만들어 낸다
// ══════════════════════════════════════════════════════════════
export const HUNT_SECONDS = 60;
export const HUNT_PENALTY = 5;
export const HUNT_MODE = "hunt60";

export type Pred = { id: string; cond: Piece; test: (n: number) => boolean };

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let f = 2; f * f <= n; f++) if (n % f === 0) return false;
  return true;
}

export const PREDS: Pred[] = [
  { id: "even", cond: { pre: "x는 짝수이다" }, test: (n) => n % 2 === 0 },
  { id: "odd", cond: { pre: "x는 홀수이다" }, test: (n) => n % 2 === 1 },
  { id: "prime", cond: { pre: "x는 소수이다" }, test: isPrime },
  { id: "mul3", cond: { pre: "x는 3의 배수이다" }, test: (n) => n % 3 === 0 },
  { id: "div12", cond: { pre: "x는 12의 약수이다" }, test: (n) => 12 % n === 0 },
  { id: "gt6", cond: { tex: "x > 6", post: "이다" }, test: (n) => n > 6 },
  { id: "lt5", cond: { tex: "x < 5", post: "이다" }, test: (n) => n < 5 },
  { id: "ge9", cond: { tex: "x \\ge 9", post: "이다" }, test: (n) => n >= 9 },
];

/** 전체집합을 뽑아 오는 수 풀 */
export const HUNT_POOL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
/** 한 문제의 전체집합 크기 */
export const HUNT_U = 4;

export type HuntItem = {
  key: string;
  q: Quant;
  predId: string;
  cond: Piece;
  /** 전체집합 U */
  nums: number[];
  /** 조건을 참이 되게 하는 원소 = P */
  inP: number[];
};

/** 이 명제가 참인가 */
export function huntTruth(it: HuntItem): boolean {
  return it.q === "all" ? it.inP.length === it.nums.length : it.inP.length > 0;
}
/** 증거가 되는 원소 — 「모든」이면 반례, 「어떤」이면 사례. 없으면 빈 배열. */
export function huntEvidence(it: HuntItem): number[] {
  return it.q === "all" ? it.nums.filter((n) => !it.inP.includes(n)) : [...it.inP];
}

function pick<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}
function sample<T>(xs: T[], k: number): T[] {
  return shuffled(xs).slice(0, k);
}

/**
 * 네 가지 상황이 고르게 나오도록 답을 먼저 정하고 전체집합을 만든다.
 *   모든 · 참   → P = U   (반례 없음)
 *   모든 · 거짓 → P ⊊ U   (반례 있음)
 *   어떤 · 참   → P ≠ ∅   (사례 있음)
 *   어떤 · 거짓 → P = ∅   (사례 없음)
 * 그래서 「그런 수는 없어요」 버튼이 답인 문제와 원소를 눌러야 하는 문제가 반반씩 나온다.
 */
export function makeHuntItem(prevKey?: string): HuntItem {
  for (let guard = 0; guard < 200; guard++) {
    const p = pick(PREDS);
    const yes = HUNT_POOL.filter((n) => p.test(n));
    const no = HUNT_POOL.filter((n) => !p.test(n));
    if (yes.length < HUNT_U || no.length < HUNT_U) continue;

    const q: Quant = Math.random() < 0.5 ? "all" : "some";
    const truth = Math.random() < 0.5;

    let nums: number[];
    if (q === "all" && truth) nums = sample(yes, HUNT_U);
    else if (q === "some" && !truth) nums = sample(no, HUNT_U);
    else {
      // 사례도 반례도 함께 있는 전체집합 — P 의 크기가 1 이상 U 미만이 된다
      const k = 1 + Math.floor(Math.random() * (HUNT_U - 1));
      nums = [...sample(yes, k), ...sample(no, HUNT_U - k)];
    }
    nums.sort((a, b) => a - b);

    const inP = nums.filter((n) => p.test(n));
    const key = `${q}:${p.id}:${nums.join(",")}`;
    if (key === prevKey) continue;
    return { key, q, predId: p.id, cond: p.cond, nums, inP };
  }
  // 여기까지 오는 일은 없지만 형을 맞추기 위한 마지막 수단
  const p = PREDS[0];
  const nums = [2, 4, 6, 8];
  return { key: "fallback", q: "all", predId: p.id, cond: p.cond, nums, inP: nums };
}
