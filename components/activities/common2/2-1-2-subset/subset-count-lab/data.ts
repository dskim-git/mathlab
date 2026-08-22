// 부분집합의 개수 — 활동 데이터
//
//  ① 갈림길 나무    원소마다 ○(넣기) · ×(빼기) 두 갈래로 갈라지며 2 × 2 × 2 = 8 을 눈으로 본다.
//  ② 스위치 계산기   원소마다 「자유 / 반드시 넣기 / 반드시 빼기」를 정해 2^(n-k-l) 을 만들어 본다.
//  ③ 개수 맞히기    여러 조건이 붙은 부분집합의 개수를 계산한다.
//  ④ 부분집합 사냥   조건에 맞는 부분집합을 직접 모두 만들어 공식이 맞는지 확인한다.
//
//  핵심 — 원소 하나하나가 「넣는다 / 안 넣는다」 두 갈래이므로 부분집합은 2^n 개.
//         반드시 넣기로 못 박은 원소가 k개, 반드시 빼기로 못 박은 원소가 l개면
//         갈래가 남은 원소는 n - k - l 개이므로 2^(n-k-l) 개.

export function pow2(m: number): number {
  return 2 ** m;
}

/** 번호로 부분집합 만들기 — 비트가 1이면 그 원소를 넣는다 */
export function subsetOf(items: string[], mask: number): string[] {
  return items.filter((_, i) => (mask >> i) & 1);
}
export function maskOf(items: string[], picked: string[]): number {
  return items.reduce((m, x, i) => (picked.includes(x) ? m | (1 << i) : m), 0);
}
export function listTex(xs: string[]): string {
  return xs.length ? `\\{${xs.join(",\\; ")}\\}` : "\\varnothing";
}
/** 1부터 n까지의 수를 원소로 하는 집합 */
export function upTo(n: number): string[] {
  return Array.from({ length: n }, (_, i) => String(i + 1));
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 갈림길 나무
// ══════════════════════════════════════════════════════════════
export const TREE_ITEMS = ["a", "b", "c"];

/** 선택의 줄 — 1이면 넣기(○), 0이면 빼기(×) */
export function pathKey(choices: number[]): string {
  return choices.join("");
}
/** 잎이 놓이는 차례 — 넣기(○)를 위쪽으로 */
export function leafOrder(choices: number[]): number {
  return choices.reduce((s, c, i) => s + (1 - c) * 2 ** (choices.length - 1 - i), 0);
}
export function chosenItems(items: string[], choices: number[]): string[] {
  return items.filter((_, i) => choices[i] === 1);
}
/** 길이 n 인 모든 선택의 줄 (위에서 아래 차례로) */
export function allPaths(n: number): number[][] {
  const out: number[][] = [];
  const go = (cur: number[]) => {
    if (cur.length === n) {
      out.push(cur);
      return;
    }
    go([...cur, 1]);
    go([...cur, 0]);
  };
  go([]);
  return out;
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 스위치 계산기
// ══════════════════════════════════════════════════════════════
/** 스위치 상태 — 0 자유 · 1 반드시 넣기 · 2 반드시 빼기 */
export type Sw = 0 | 1 | 2;
export const SW_META: { label: string; mark: string; color: string; hint: string }[] = [
  { label: "자유", mark: "○ 또는 ×", color: "#38bdf8", hint: "넣어도 되고 안 넣어도 돼요" },
  { label: "반드시 넣기", mark: "○", color: "#34d399", hint: "이 원소는 꼭 들어가요" },
  { label: "반드시 빼기", mark: "×", color: "#fb7185", hint: "이 원소는 절대 안 들어가요" },
];

export const N_MIN = 3;
export const N_MAX = 8;

export type Mission = { id: string; n: number; k: number; l: number; ask: string; tip: string };

export const MISSIONS: Mission[] = [
  { id: "m1", n: 4, k: 0, l: 0, ask: "원소가 4개인 집합의 부분집합", tip: "못 박은 원소가 없으니 네 원소가 모두 자유예요.", },
  { id: "m2", n: 5, k: 2, l: 0, ask: "원소가 5개인 집합에서 특정 원소 2개를 반드시 포함하는 부분집합", tip: "못 박은 2개를 빼면 자유로운 원소는 3개예요." },
  { id: "m3", n: 6, k: 0, l: 1, ask: "원소가 6개인 집합에서 특정 원소 1개를 포함하지 않는 부분집합", tip: "빼기로 못 박아도 갈래가 사라지는 것은 마찬가지예요." },
  { id: "m4", n: 7, k: 2, l: 1, ask: "원소가 7개인 집합에서 특정 원소 2개는 포함하고 다른 1개는 포함하지 않는 부분집합", tip: "넣기 2개와 빼기 1개를 빼면 자유로운 원소는 4개예요." },
  { id: "m5", n: 8, k: 3, l: 2, ask: "원소가 8개인 집합에서 특정 원소 3개는 포함하고 다른 2개는 포함하지 않는 부분집합", tip: "8 - 3 - 2 = 3 이니 2의 3제곱이에요." },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 개수 맞히기
// ══════════════════════════════════════════════════════════════
export type CountProblem = {
  id: string;
  items: string[];
  /** 원소나열법으로 보여 줄 때 줄임표를 쓸지 */
  short?: boolean;
  ask: string;
  /** 진부분집합의 개수를 묻는 문제 */
  proper?: boolean;
  must: string[];
  ban: string[];
  answer: number;
  tip: string;
};

export const COUNTS: CountProblem[] = [
  {
    id: "c1",
    items: upTo(5),
    ask: "부분집합의 개수",
    must: [],
    ban: [],
    answer: 32,
    tip: "다섯 원소가 모두 자유로우니 2를 다섯 번 곱해요.",
  },
  {
    id: "c2",
    items: upTo(6),
    short: true,
    ask: "진부분집합의 개수",
    proper: true,
    must: [],
    ban: [],
    answer: 63,
    tip: "부분집합 64개에서 자기 자신 하나를 빼요.",
  },
  {
    id: "c3",
    items: upTo(6),
    short: true,
    ask: "1과 6을 모두 원소로 갖는 부분집합의 개수",
    must: ["1", "6"],
    ban: [],
    answer: 16,
    tip: "1과 6은 못 박혔으니 남은 2, 3, 4, 5 네 개만 자유로워요.",
  },
  {
    id: "c4",
    items: ["a", "b", "c", "d", "e", "f", "g"],
    ask: "a를 원소로 갖지 않는 부분집합의 개수",
    must: [],
    ban: ["a"],
    answer: 64,
    tip: "a 는 빼기로 못 박혔고 나머지 여섯 개가 자유로워요.",
  },
  {
    id: "c5",
    items: upTo(8),
    short: true,
    ask: "2와 3은 원소로 갖고 7은 원소로 갖지 않는 부분집합의 개수",
    must: ["2", "3"],
    ban: ["7"],
    answer: 32,
    tip: "넣기 2개와 빼기 1개를 못 박으면 8 - 2 - 1 = 5 개가 자유로워요.",
  },
  {
    id: "c6",
    items: upTo(7),
    short: true,
    ask: "원소의 최솟값이 3인 부분집합의 개수",
    must: ["3"],
    ban: ["1", "2"],
    answer: 16,
    tip: "가장 작은 원소가 3이려면 3은 반드시 들어가고 1, 2 는 절대 들어가면 안 돼요. 남은 4, 5, 6, 7 이 자유로워요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 부분집합 사냥
// ══════════════════════════════════════════════════════════════
export type HuntRound = {
  id: string;
  items: string[];
  must: string[];
  ban: string[];
  /** 사냥 조건을 사람 말로 */
  rule: string;
  tip: string;
};

export const HUNTS: HuntRound[] = [
  {
    id: "h1",
    items: upTo(4),
    must: ["1", "3"],
    ban: [],
    rule: "1과 3을 모두 원소로 갖는다",
    tip: "1과 3이 못 박히고 2, 4 가 자유로우니 2의 2제곱 = 4개예요.",
  },
  {
    id: "h2",
    items: upTo(4),
    must: ["2"],
    ban: ["4"],
    rule: "2는 원소로 갖고 4는 원소로 갖지 않는다",
    tip: "넣기 1개와 빼기 1개를 못 박으면 1, 3 만 자유로워 2의 2제곱 = 4개예요.",
  },
  {
    id: "h3",
    items: upTo(5),
    must: ["2"],
    ban: ["1"],
    rule: "원소 중 가장 작은 수가 2이다",
    tip: "가장 작은 원소가 2이려면 2는 넣고 1은 빼야 해요. 3, 4, 5 가 자유로우니 2의 3제곱 = 8개예요.",
  },
];

export function huntOk(r: HuntRound, picked: string[]): boolean {
  return r.must.every((x) => picked.includes(x)) && r.ban.every((x) => !picked.includes(x));
}
export function huntCount(r: HuntRound): number {
  return pow2(r.items.length - r.must.length - r.ban.length);
}
