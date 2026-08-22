// 부분집합과 포함관계 — 활동 데이터
//
//  ① 원소 검문소     A 의 원소를 하나씩 B 에 대어 보며 A ⊂ B 인지 A ⊄ B 인지 가린다.
//  ② 상등과 진부분집합  A ⊂ B 이고 B ⊂ A 이면 A = B · 부분집합을 모두 모아 2ⁿ 을 확인한다.
//  ③ 벤 다이어그램     원소를 끌어다 알맞은 영역에 놓아 벤 다이어그램을 완성한다.
//  ④ 포함관계 네 가지   두 기호의 참·거짓을 정하면 그림이 정해진다.

export type SetSpec = {
  name: string;
  items: string[];
  /** 조건제시법으로 보여 줄 때의 조건 (없으면 원소나열법으로 보여 준다) */
  condPre?: string;
  condTex?: string;
  condPost?: string;
};

export function isSubset(a: string[], b: string[]): boolean {
  return a.every((x) => b.includes(x));
}
export function sameSet(a: string[], b: string[]): boolean {
  return isSubset(a, b) && isSubset(b, a);
}
export function inter(a: string[], b: string[]): string[] {
  return a.filter((x) => b.includes(x));
}
/** 원소나열법 KaTeX — 원소가 없으면 공집합 기호 */
export function listTex(xs: string[]): string {
  return xs.length ? `\\{${xs.join(",\\; ")}\\}` : "\\varnothing";
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 원소 검문소
// ══════════════════════════════════════════════════════════════
export type SubProblem = { id: string; A: SetSpec; B: SetSpec; tip: string };

export const SUBSETS: SubProblem[] = [
  {
    id: "u1",
    A: { name: "A", items: ["1", "3"] },
    B: { name: "B", items: ["1", "2", "3", "4"] },
    tip: "1도 3도 모두 B 안에 있으니 A 의 모든 원소가 B 에 속해요.",
  },
  {
    id: "u2",
    A: { name: "A", items: ["2", "5", "9"] },
    B: { name: "B", items: ["2", "4", "6", "8"] },
    tip: "5와 9는 B 에 없어요. B 에 속하지 않는 원소가 하나라도 있으면 부분집합이 아니에요.",
  },
  {
    id: "u3",
    A: { name: "A", items: ["1", "3", "9"], condPre: "9의 약수" },
    B: { name: "B", items: ["1", "2", "3", "6", "9", "18"], condPre: "18의 약수" },
    tip: "9가 18의 약수이므로 9의 약수는 모두 18의 약수예요.",
  },
  {
    id: "u4",
    A: { name: "A", items: ["1", "4"], condTex: "x^2 - 5x + 4 = 0", condPre: "방정식 ", condPost: " 의 해" },
    B: { name: "B", items: ["2", "4", "6"] },
    tip: "방정식을 풀면 x = 1 또는 x = 4 인데, 1이 B 에 없어요.",
  },
  {
    id: "u5",
    A: { name: "A", items: [] },
    B: { name: "B", items: ["a", "b", "c"] },
    tip: "공집합에는 원소가 없으니 「B 에 속하지 않는 원소」도 있을 수 없어요. 그래서 공집합은 모든 집합의 부분집합이에요.",
  },
  {
    id: "u6",
    A: { name: "A", items: ["5", "10", "15"] },
    B: { name: "B", items: ["5", "10", "15"], condPre: "15 이하의 5의 배수" },
    tip: "두 집합의 원소가 똑같아요. 자기 자신도 자기 자신의 부분집합이에요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 상등
// ══════════════════════════════════════════════════════════════
export type EqProblem = { id: string; A: SetSpec; B: SetSpec; tip: string };

export const EQUALS: EqProblem[] = [
  {
    id: "e1",
    A: { name: "A", items: ["1", "2", "4", "8"], condPre: "8의 약수" },
    B: { name: "B", items: ["1", "2", "4"] },
    tip: "B 의 원소는 모두 A 에 있지만 A 의 8이 B 에 없어요. 한쪽만 성립하면 같은 집합이 아니에요.",
  },
  {
    id: "e2",
    A: { name: "A", items: ["3", "5", "7"] },
    B: { name: "B", items: ["3", "5", "7"], condPre: "10보다 작은 홀수인 소수" },
    tip: "10보다 작은 홀수인 소수는 3, 5, 7 — 두 집합의 원소가 똑같아요.",
  },
  {
    id: "e3",
    A: { name: "A", items: ["-3", "3"], condTex: "x^2 = 9", condPre: "" },
    B: { name: "B", items: ["3", "-3"] },
    tip: "원소를 적는 차례는 상관없어요. 들어 있는 원소가 같으면 같은 집합이에요.",
  },
  {
    id: "e4",
    A: { name: "A", items: ["a", "b", "c"] },
    B: { name: "B", items: ["a", "b", "c", "d"] },
    tip: "A ⊂ B 는 맞지만 B 의 d 가 A 에 없어서 B ⊂ A 는 아니에요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 진부분집합 모으기
// ══════════════════════════════════════════════════════════════
export const POWER_BASE = ["1", "2", "4"];

/** 원소를 넣고 뺀 결과를 나타내는 열쇠 — "101" 처럼 */
export function maskKey(base: string[], picked: string[]): string {
  return base.map((x) => (picked.includes(x) ? "1" : "0")).join("");
}
export function allMasks(n: number): string[] {
  const out: string[] = [];
  for (let k = 0; k < 1 << n; k++) out.push(k.toString(2).padStart(n, "0"));
  return out;
}
export function maskItems(base: string[], key: string): string[] {
  return base.filter((_, i) => key[i] === "1");
}

// ══════════════════════════════════════════════════════════════
// 벤 다이어그램 배치
// ══════════════════════════════════════════════════════════════
export type Layout = "single" | "AinB" | "BinA" | "cross" | "apart" | "equal";

export type Region = "A" | "B" | "both" | "out";

export type Circle = { key: "A" | "B"; cx: number; cy: number; r: number; label: string };
export type LayoutSpec = {
  circles: Circle[];
  /** 영역마다 원소를 모아 놓을 자리 */
  anchors: Partial<Record<Region, { x: number; y: number; perRow: number }>>;
};

export const VB_W = 440;
export const VB_H = 280;

export const LAYOUTS: Record<Layout, LayoutSpec> = {
  single: {
    circles: [{ key: "A", cx: 150, cy: 140, r: 100, label: "A" }],
    anchors: { A: { x: 150, y: 140, perRow: 3 }, out: { x: 360, y: 140, perRow: 2 } },
  },
  AinB: {
    circles: [
      { key: "B", cx: 220, cy: 140, r: 125, label: "B" },
      { key: "A", cx: 220, cy: 168, r: 68, label: "A" },
    ],
    anchors: { both: { x: 220, y: 172, perRow: 3 }, B: { x: 220, y: 68, perRow: 4 } },
  },
  BinA: {
    circles: [
      { key: "A", cx: 220, cy: 140, r: 125, label: "A" },
      { key: "B", cx: 220, cy: 168, r: 68, label: "B" },
    ],
    anchors: { both: { x: 220, y: 172, perRow: 3 }, A: { x: 220, y: 68, perRow: 4 } },
  },
  cross: {
    circles: [
      { key: "A", cx: 160, cy: 140, r: 100, label: "A" },
      { key: "B", cx: 280, cy: 140, r: 100, label: "B" },
    ],
    anchors: { A: { x: 108, y: 140, perRow: 2 }, both: { x: 220, y: 140, perRow: 1 }, B: { x: 332, y: 140, perRow: 2 } },
  },
  apart: {
    circles: [
      { key: "A", cx: 118, cy: 140, r: 92, label: "A" },
      { key: "B", cx: 322, cy: 140, r: 92, label: "B" },
    ],
    anchors: { A: { x: 118, y: 140, perRow: 2 }, B: { x: 322, y: 140, perRow: 2 } },
  },
  equal: {
    circles: [{ key: "A", cx: 220, cy: 140, r: 110, label: "A = B" }],
    anchors: { both: { x: 220, y: 140, perRow: 3 } },
  },
};

/** 두 집합의 실제 원소로부터 그림 모양을 정한다 */
export function layoutOf(a: string[], b: string[]): Layout {
  if (sameSet(a, b)) return "equal";
  if (isSubset(a, b)) return "AinB";
  if (isSubset(b, a)) return "BinA";
  return inter(a, b).length ? "cross" : "apart";
}

/** 원소가 놓여야 할 영역 */
export function regionOf(x: string, a: string[], b: string[]): Region {
  const ia = a.includes(x);
  const ib = b.includes(x);
  if (ia && ib) return "both";
  if (ia) return "A";
  if (ib) return "B";
  return "out";
}

/** 점이 어느 영역에 있는가 — 이름이 아니라 자리로 판정한다 */
export function regionAt(spec: LayoutSpec, x: number, y: number): Region {
  const inA = spec.circles.some((c) => c.key === "A" && Math.hypot(x - c.cx, y - c.cy) <= c.r);
  const inB = spec.circles.some((c) => c.key === "B" && Math.hypot(x - c.cx, y - c.cy) <= c.r);
  const single = spec.circles.length === 1;
  if (single) {
    const c = spec.circles[0];
    const inside = Math.hypot(x - c.cx, y - c.cy) <= c.r;
    if (c.label === "A = B") return inside ? "both" : "out";
    return inside ? "A" : "out";
  }
  if (inA && inB) return "both";
  if (inA) return "A";
  if (inB) return "B";
  return "out";
}

/** 영역 안에 원소를 늘어놓을 자리 */
export function slots(anchor: { x: number; y: number; perRow: number }, n: number, dx = 40, dy = 34): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const rows = Math.ceil(n / anchor.perRow) || 1;
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / anchor.perRow);
    const cnt = Math.min(anchor.perRow, n - r * anchor.perRow);
    const c = i % anchor.perRow;
    out.push({ x: anchor.x + (c - (cnt - 1) / 2) * dx, y: anchor.y + (r - (rows - 1) / 2) * dy });
  }
  return out;
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 벤 다이어그램 만들기
// ══════════════════════════════════════════════════════════════
export type VennTask = { id: string; layout: Layout; A: SetSpec; B?: SetSpec; pool: string[]; tip: string };

export const VENN_TASKS: VennTask[] = [
  {
    id: "v1",
    layout: "single",
    A: { name: "A", items: ["1", "2", "4", "8"], condPre: "8의 약수" },
    pool: ["1", "2", "3", "4", "6", "8"],
    tip: "8의 약수는 1, 2, 4, 8 이에요. 3과 6은 원 밖에 두어야 해요.",
  },
  {
    id: "v2",
    layout: "AinB",
    A: { name: "A", items: ["1", "3", "9"], condPre: "9의 약수" },
    B: { name: "B", items: ["1", "2", "3", "6", "9", "18"], condPre: "18의 약수" },
    pool: ["1", "2", "3", "6", "9", "18"],
    tip: "A 의 원소는 안쪽 원에, B 에만 있는 2 · 6 · 18 은 두 원 사이에 놓아요.",
  },
  {
    id: "v3",
    layout: "cross",
    A: { name: "A", items: ["1", "2", "3", "6"], condPre: "6의 약수" },
    B: { name: "B", items: ["2", "4", "6", "8"], condPre: "10보다 작은 짝수" },
    pool: ["1", "2", "3", "4", "6", "8"],
    tip: "2와 6은 두 집합에 모두 들어 있으니 겹치는 부분에 놓아요.",
  },
  {
    id: "v4",
    layout: "apart",
    A: { name: "A", items: ["1", "4", "9"] },
    B: { name: "B", items: ["2", "3", "5"] },
    pool: ["1", "2", "3", "4", "5", "9"],
    tip: "두 집합에 함께 들어 있는 원소가 하나도 없어서 원을 떨어뜨려 그려요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 포함관계 네 가지
// ══════════════════════════════════════════════════════════════
export type RelProblem = { id: string; A: SetSpec; B: SetSpec; tip: string };

export const RELATIONS: RelProblem[] = [
  {
    id: "r1",
    A: { name: "A", items: ["1", "2"] },
    B: { name: "B", items: ["1", "2", "3", "4"] },
    tip: "A 의 원소는 모두 B 에 있지만 B 의 3 · 4 는 A 에 없어요 — B 안에 A 가 들어간 그림이에요.",
  },
  {
    id: "r2",
    A: { name: "A", items: ["1", "2", "3", "4", "6", "12"], condPre: "12의 약수" },
    B: { name: "B", items: ["1", "2", "4"] },
    tip: "이번에는 방향이 반대예요. B 의 원소가 모두 A 에 있으니 A 안에 B 가 들어가요.",
  },
  {
    id: "r3",
    A: { name: "A", items: ["1", "3", "5"] },
    B: { name: "B", items: ["3", "5", "7"] },
    tip: "서로 상대에게 없는 원소를 가지고 있지만 3 · 5 는 함께 가지고 있어요 — 두 원이 겹칩니다.",
  },
  {
    id: "r4",
    A: { name: "A", items: ["2", "4", "6"] },
    B: { name: "B", items: ["2", "4", "6"], condPre: "7보다 작은 짝수인 자연수" },
    tip: "양쪽 모두 성립하므로 두 집합은 같아요. 원 하나로 그립니다.",
  },
  {
    id: "r5",
    A: { name: "A", items: ["1", "2"] },
    B: { name: "B", items: ["5", "6"] },
    tip: "앞 문제와 기호는 똑같이 둘 다 ⊄ 이지만, 함께 가진 원소가 하나도 없어서 원이 떨어져요.",
  },
];

/** 탭 ④ 에서 고르는 그림 후보 */
export const PICK_LAYOUTS: { key: Layout; label: string }[] = [
  { key: "AinB", label: "B 안에 A" },
  { key: "BinA", label: "A 안에 B" },
  { key: "cross", label: "두 원이 겹침" },
  { key: "apart", label: "두 원이 떨어짐" },
  { key: "equal", label: "원 하나 (A = B)" },
];
