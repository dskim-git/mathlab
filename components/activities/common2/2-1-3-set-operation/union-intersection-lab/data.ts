// 합집합과 교집합 — 활동 데이터
//
//  ① 영역 색칠      벤 다이어그램의 세 영역을 칠해 A ∪ B 와 A ∩ B 를 만든다.
//  ② 서로소 짝짓기   교집합이 공집합이 되는 두 집합의 짝을 모두 찾는다.
//  ③ 개수 계산기     n(A ∪ B) = n(A) + n(B) - n(A ∩ B) 를 슬라이더로 발견하고 문제를 푼다.
//  ④ 최대와 최소     겹침을 움직여 n(A ∩ B) 가 가질 수 있는 값의 범위를 찾는다.

export type SetSpec = {
  name: string;
  items: string[];
  /** 조건제시법으로 보여 줄 때의 조건 (없으면 원소나열법) */
  cond?: string;
  condTex?: string;
  condPre?: string;
  condPost?: string;
};

export function union(a: string[], b: string[]): string[] {
  return [...a, ...b.filter((x) => !a.includes(x))];
}
export function inter(a: string[], b: string[]): string[] {
  return a.filter((x) => b.includes(x));
}
export function onlyIn(a: string[], b: string[]): string[] {
  return a.filter((x) => !b.includes(x));
}
export function listTex(xs: string[]): string {
  return xs.length ? `\\{${xs.join(",\\; ")}\\}` : "\\varnothing";
}
/** 원소에 한글이 섞여 있으면 KaTeX 로 그릴 수 없다 — HTML 로 나타내야 한다 */
export function hasHangul(xs: string[]): boolean {
  return xs.some((x) => /[ㄱ-ㆎ가-힣]/.test(x));
}

// ══════════════════════════════════════════════════════════════
// 벤 다이어그램 두 원 — 자리
// ══════════════════════════════════════════════════════════════
export const V2 = {
  w: 460,
  h: 270,
  a: { cx: 175, cy: 135, r: 100 },
  b: { cx: 285, cy: 135, r: 100 },
  /** 영역마다 원소를 모아 놓을 자리 */
  anchor: {
    A: { x: 122, y: 135, perRow: 2 },
    both: { x: 230, y: 135, perRow: 1 },
    B: { x: 338, y: 135, perRow: 2 },
  },
};

export type Region = "A" | "both" | "B";
export const REGIONS: Region[] = ["A", "both", "B"];

/** 영역 안에 원소를 늘어놓을 자리 */
export function slots(an: { x: number; y: number; perRow: number }, n: number, dx = 42, dy = 34): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const rows = Math.ceil(n / an.perRow) || 1;
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / an.perRow);
    const cnt = Math.min(an.perRow, n - r * an.perRow);
    const c = i % an.perRow;
    out.push({ x: an.x + (c - (cnt - 1) / 2) * dx, y: an.y + (r - (rows - 1) / 2) * dy });
  }
  return out;
}

/** 세 원 벤 다이어그램 — 자리 */
export const V3 = {
  w: 460,
  h: 300,
  a: { cx: 230, cy: 105, r: 85 },
  b: { cx: 180, cy: 190, r: 85 },
  c: { cx: 280, cy: 190, r: 85 },
  anchor: {
    A: { x: 230, y: 70 },
    B: { x: 135, y: 215 },
    C: { x: 325, y: 215 },
    AB: { x: 180, y: 145 },
    AC: { x: 280, y: 145 },
    BC: { x: 230, y: 220 },
    ABC: { x: 230, y: 168 },
  },
};

// ══════════════════════════════════════════════════════════════
// 탭 ① 영역 색칠
// ══════════════════════════════════════════════════════════════
export type Op = "union" | "inter";
export type OpProblem = { id: string; A: SetSpec; B: SetSpec; op: Op; tip: string };

export const OPS: OpProblem[] = [
  {
    id: "o1",
    A: { name: "A", items: ["코딩", "미술", "농구"], cond: "지훈이가 듣는 방과후 수업" },
    B: { name: "B", items: ["코딩", "농구", "밴드"], cond: "서연이가 듣는 방과후 수업" },
    op: "inter",
    tip: "두 사람이 함께 듣는 수업 — 두 원이 겹치는 자리예요.",
  },
  {
    id: "o2",
    A: { name: "A", items: ["코딩", "미술", "농구"], cond: "지훈이가 듣는 방과후 수업" },
    B: { name: "B", items: ["코딩", "농구", "밴드"], cond: "서연이가 듣는 방과후 수업" },
    op: "union",
    tip: "둘 중 한 사람이라도 듣는 수업 — 두 원을 모두 칠해요. 겹치는 자리도 빠뜨리면 안 돼요!",
  },
  {
    id: "o3",
    A: { name: "A", items: ["1", "2", "3", "6"], cond: "6의 약수" },
    B: { name: "B", items: ["2", "4", "6", "8"], cond: "10보다 작은 짝수" },
    op: "inter",
    tip: "6의 약수이면서 동시에 짝수인 수는 2와 6이에요.",
  },
  {
    id: "o4",
    A: { name: "A", items: ["1", "2", "3", "4", "6", "12"], cond: "12의 약수" },
    B: { name: "B", items: ["1", "2", "3", "6", "9", "18"], cond: "18의 약수" },
    op: "inter",
    tip: "두 수의 공약수가 바로 교집합이에요. 가장 큰 원소 6이 최대공약수랍니다.",
  },
  {
    id: "o5",
    A: { name: "A", items: ["4", "8", "12", "16", "20"], cond: "20 이하의 4의 배수" },
    B: { name: "B", items: ["6", "12", "18"], cond: "20 이하의 6의 배수" },
    op: "union",
    tip: "겹치는 12는 한 번만 써요. 원소나열법에서 같은 원소는 중복해서 쓰지 않으니까요.",
  },
  {
    id: "o6",
    A: { name: "A", items: ["-2", "3"], condPre: "방정식 ", condTex: "x^2 - x - 6 = 0", condPost: " 의 해" },
    B: { name: "B", items: ["-2", "0", "2"] },
    op: "union",
    tip: "방정식을 풀면 x = -2 또는 x = 3 이에요. 합집합에서 -2 는 한 번만 씁니다.",
  },
];

/** 그 연산이 나타내는 영역 */
export function opRegions(op: Op): Region[] {
  return op === "union" ? ["A", "both", "B"] : ["both"];
}
export function opResult(p: OpProblem): string[] {
  return p.op === "union" ? union(p.A.items, p.B.items) : inter(p.A.items, p.B.items);
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 서로소 짝짓기
// ══════════════════════════════════════════════════════════════
export type Card = { key: string; cond: string; items: string[] };

export const CARDS: Card[] = [
  { key: "A", cond: "3 이하의 자연수", items: ["1", "2", "3"] },
  { key: "B", cond: "4 이상 6 이하의 자연수", items: ["4", "5", "6"] },
  { key: "C", cond: "6 이하의 짝수", items: ["2", "4", "6"] },
  { key: "D", cond: "6 이하의 홀수", items: ["1", "3", "5"] },
  { key: "E", cond: "10보다 작은 3의 배수", items: ["3", "6", "9"] },
  { key: "F", cond: "5 이상 12 이하의 소수", items: ["5", "7", "11"] },
];

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join("");
}
/** 서로소인 짝을 모두 찾는다 */
export function coprimePairs(): string[] {
  const out: string[] = [];
  for (let i = 0; i < CARDS.length; i++)
    for (let j = i + 1; j < CARDS.length; j++)
      if (inter(CARDS[i].items, CARDS[j].items).length === 0) out.push(pairKey(CARDS[i].key, CARDS[j].key));
  return out;
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 합집합의 원소의 개수
// ══════════════════════════════════════════════════════════════
export const SIM_MAX = 12;

export type CountProblem = {
  id: string;
  /** 무엇을 구하는가 */
  find: "union" | "inter" | "union3";
  story?: string;
  /** 집합에 붙일 이름표 (실생활 사례일 때) */
  labelA?: string;
  labelB?: string;
  labelC?: string;
  nA: number;
  nB: number;
  nC?: number;
  nAB?: number;
  nBC?: number;
  nAC?: number;
  nABC?: number;
  nAuB?: number;
  /** 서로소로 주어진 문제 */
  disjoint?: boolean;
  answer: number;
  tip: string;
};

export const COUNTS: CountProblem[] = [
  {
    id: "n1",
    find: "union",
    nA: 7,
    nB: 9,
    nAB: 4,
    answer: 12,
    tip: "7 + 9 를 하면 겹치는 4개를 두 번 세게 되니 한 번 빼 줘요.",
  },
  {
    id: "n2",
    find: "inter",
    nA: 12,
    nB: 9,
    nAuB: 17,
    answer: 4,
    tip: "12 + 9 = 21 인데 실제 합집합은 17 이니, 두 번 센 만큼이 21 - 17 = 4 예요.",
  },
  {
    id: "n3",
    find: "union",
    nA: 6,
    nB: 8,
    nAB: 0,
    disjoint: true,
    answer: 14,
    tip: "서로소이면 겹치는 원소가 없으니 그냥 더하면 돼요.",
  },
  {
    id: "n4",
    find: "union3",
    nA: 10,
    nB: 12,
    nC: 9,
    nAB: 5,
    nBC: 4,
    nAC: 3,
    nABC: 2,
    answer: 21,
    tip: "셋을 더하고, 두 개씩 겹친 것을 빼고, 셋 다 겹친 것을 다시 더해요 — 포함·배제의 원리예요.",
  },
  {
    id: "n5",
    find: "union",
    story: "어느 반 학생 30명에게 물었더니 등산을 좋아하는 학생이 18명, 자전거를 좋아하는 학생이 15명, 둘 다 좋아하는 학생이 9명이었어요. 둘 중 적어도 하나를 좋아하는 학생은 몇 명일까요?",
    labelA: "등산",
    labelB: "자전거",
    nA: 18,
    nB: 15,
    nAB: 9,
    answer: 24,
    tip: "18 + 15 - 9 = 24 명이에요. 그러니 둘 다 좋아하지 않는 학생은 30 - 24 = 6 명이랍니다.",
  },
];

export function unionCount(p: CountProblem): number {
  return p.nA + p.nB - (p.nAB ?? 0);
}
export function union3Count(p: CountProblem): number {
  return p.nA + p.nB + (p.nC ?? 0) - (p.nAB ?? 0) - (p.nBC ?? 0) - (p.nAC ?? 0) + (p.nABC ?? 0);
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 교집합의 원소의 개수의 최대·최소
// ══════════════════════════════════════════════════════════════
export type MinMax = { id: string; story: string; labelA: string; labelB: string; nU: number; nA: number; nB: number; tip: string };

export const MINMAXES: MinMax[] = [
  {
    id: "x1",
    story: "어느 반 학생 30명에게 물었더니 강아지를 좋아하는 학생이 19명, 고양이를 좋아하는 학생이 16명이었어요.",
    labelA: "강아지",
    labelB: "고양이",
    nU: 30,
    nA: 19,
    nB: 16,
    tip: "고양이를 좋아하는 16명이 모두 강아지도 좋아하면 최대 16명, 반 전체 30명이 적어도 하나를 좋아하면 19 + 16 - 30 = 5 명으로 최소가 돼요.",
  },
  {
    id: "x2",
    story: "어느 동아리 회원 24명에게 물었더니 축구를 해 본 회원이 15명, 농구를 해 본 회원이 13명이었어요.",
    labelA: "축구",
    labelB: "농구",
    nU: 24,
    nA: 15,
    nB: 13,
    tip: "적은 쪽인 13명이 통째로 겹치면 최대 13명, 24명 모두가 적어도 하나를 해 봤다면 15 + 13 - 24 = 4 명으로 최소가 돼요.",
  },
  {
    id: "x3",
    story: "어느 학년 학생 32명에게 물었더니 영화를 좋아하는 학생이 20명, 뮤지컬을 좋아하는 학생이 9명이었어요.",
    labelA: "영화",
    labelB: "뮤지컬",
    nU: 32,
    nA: 20,
    nB: 9,
    tip: "20 + 9 = 29 로 전체 32명보다 작아서, 겹치지 않게 앉힐 수 있어요. 그래서 최솟값이 0 — 두 집합이 서로소가 될 수도 있답니다.",
  },
];

export function maxInter(p: MinMax): number {
  return Math.min(p.nA, p.nB);
}
export function minInter(p: MinMax): number {
  return Math.max(0, p.nA + p.nB - p.nU);
}
