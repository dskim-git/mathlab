// 집합 연산 장치 — 활동 데이터
//
//  전체집합 U 와 세 부분집합 A, B, C 를 입력으로 받아 ∩ · ∪ · − 를 수행하는 장치를 만든다.
//  입력 칸을 눌러 U · A · B · C 를 고르고, 연산 단추를 눌러 ∩ · ∪ · − 를 고른 뒤
//  「실행」을 누르면 결과 식이 나타나고 벤 다이어그램이 색칠된다.
//
//  ① 장치 익히기   한 단계 장치를 굴려 보며 U 를 넣었을 때 무슨 일이 생기는지 알아낸다.
//  ② 그림 맞히기   색칠된 그림이 나오도록 한 단계 장치를 맞춘다.
//  ③ 두 단계 장치  앞 결과를 다시 입력으로 넣는 장치를 맞춘다.
//  ④ 두 갈래 장치  두 결과를 마지막에 합치는 장치로 분배법칙·드모르간·대칭차집합을 만든다.
//
//  세 원이 만드는 조각은 비트로 적는다 — 1비트 A · 2비트 B · 4비트 C
//    0 = 세 원 바깥 · 1 = A에만 · 2 = B에만 · 4 = C에만
//    3 = A∩B 만 · 5 = A∩C 만 · 6 = B∩C 만 · 7 = 셋 모두

export type Op = "i" | "u" | "d";
export type Shape = "one" | "chain" | "tree";
/** 입력 칸에 넣을 수 있는 집합 — 0 U · 1 A · 2 B · 3 C */
export type Config = { ins: number[]; ops: Op[] };

export const SRC_LABEL = ["U", "A", "B", "C"];
export const OP_LABEL: Record<Op, string> = { i: "∩", u: "∪", d: "−" };
export const OP_TEX: Record<Op, string> = { i: "\\cap", u: "\\cup", d: "-" };
export const OP_NAME: Record<Op, string> = { i: "교집합", u: "합집합", d: "차집합" };
export const OPS: Op[] = ["i", "u", "d"];

export const ALL_REGIONS = [0, 1, 2, 3, 4, 5, 6, 7];

/** 입력 하나가 덮는 조각 */
export function srcRegions(s: number): number[] {
  if (s === 0) return [...ALL_REGIONS];
  const bit = 1 << (s - 1);
  return ALL_REGIONS.filter((m) => (m & bit) !== 0);
}

export function apply(op: Op, l: number[], r: number[]): number[] {
  if (op === "i") return l.filter((x) => r.includes(x));
  if (op === "u") return ALL_REGIONS.filter((m) => l.includes(m) || r.includes(m));
  return l.filter((x) => !r.includes(x));
}

/** 장치가 내놓는 조각 */
export function runMachine(shape: Shape, c: Config): number[] {
  const S = (i: number) => srcRegions(c.ins[i]);
  if (shape === "one") return apply(c.ops[0], S(0), S(1));
  if (shape === "chain") return apply(c.ops[1], apply(c.ops[0], S(0), S(1)), S(2));
  return apply(c.ops[2], apply(c.ops[0], S(0), S(1)), apply(c.ops[1], S(2), S(3)));
}

/** 장치가 내놓는 식 — 화면에 그대로 쓰는 글자 */
export function machineText(shape: Shape, c: Config): string {
  const S = (i: number) => SRC_LABEL[c.ins[i]];
  const O = (i: number) => OP_LABEL[c.ops[i]];
  if (shape === "one") return `${S(0)}${O(0)}${S(1)}`;
  if (shape === "chain") return `(${S(0)}${O(0)}${S(1)})${O(1)}${S(2)}`;
  return `(${S(0)}${O(0)}${S(1)})${O(2)}(${S(2)}${O(1)}${S(3)})`;
}

/** KaTeX 로 옮긴 식 */
export function machineTex(shape: Shape, c: Config): string {
  const S = (i: number) => SRC_LABEL[c.ins[i]];
  const O = (i: number) => OP_TEX[c.ops[i]];
  if (shape === "one") return `${S(0)} ${O(0)} ${S(1)}`;
  if (shape === "chain") return `(${S(0)} ${O(0)} ${S(1)}) ${O(1)} ${S(2)}`;
  return `(${S(0)} ${O(0)} ${S(1)}) ${O(2)} (${S(2)} ${O(1)} ${S(3)})`;
}

export const SLOT_COUNT: Record<Shape, number> = { one: 2, chain: 3, tree: 4 };
export const OP_COUNT: Record<Shape, number> = { one: 1, chain: 2, tree: 3 };

export function sameSet(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}
export function sameConfig(a: Config, b: Config): boolean {
  return a.ins.length === b.ins.length && a.ins.every((v, i) => v === b.ins[i]) && a.ops.every((v, i) => v === b.ops[i]);
}

// ══════════════════════════════════════════════════════════════
// 벤 다이어그램 자리 (U 사각형 + 세 원)
// ══════════════════════════════════════════════════════════════
export const G = {
  w: 460,
  h: 330,
  box: { x: 8, y: 22, w: 444, h: 300, r: 18 },
  circles: [
    { key: "A", cx: 230, cy: 116, r: 78, lx: 230, ly: 30 },
    { key: "B", cx: 182, cy: 200, r: 78, lx: 100, ly: 296 },
    { key: "C", cx: 278, cy: 200, r: 78, lx: 360, ly: 296 },
  ],
  ul: { x: 28, y: 42 },
  anchor: {
    0: { x: 405, y: 62 },
    1: { x: 230, y: 72 },
    2: { x: 138, y: 246 },
    4: { x: 322, y: 246 },
    3: { x: 182, y: 152 },
    5: { x: 278, y: 152 },
    6: { x: 230, y: 246 },
    7: { x: 230, y: 176 },
  } as Record<number, { x: number; y: number }>,
};

// ══════════════════════════════════════════════════════════════
// 장치 그림 자리 (모양마다)
// ══════════════════════════════════════════════════════════════
export type Wire = { x1: number; y1: number; x2: number; y2: number };
export type Layout = {
  w: number;
  h: number;
  slots: { x: number; y: number; w: number; h: number }[];
  ops: { x: number; y: number; r: number }[];
  /** 중간 결과 상자 (마지막이 최종 결과) */
  boxes: { x: number; y: number; w: number; h: number }[];
  wires: Wire[];
};

export const LAYOUTS: Record<Shape, Layout> = {
  one: {
    w: 300,
    h: 200,
    slots: [
      { x: 60, y: 16, w: 56, h: 44 },
      { x: 184, y: 16, w: 56, h: 44 },
    ],
    ops: [{ x: 150, y: 112, r: 19 }],
    boxes: [{ x: 82, y: 148, w: 136, h: 42 }],
    wires: [
      { x1: 88, y1: 60, x2: 88, y2: 78 },
      { x1: 212, y1: 60, x2: 212, y2: 78 },
      { x1: 88, y1: 78, x2: 212, y2: 78 },
      { x1: 150, y1: 78, x2: 150, y2: 93 },
      { x1: 150, y1: 131, x2: 150, y2: 148 },
    ],
  },
  chain: {
    w: 340,
    h: 285,
    slots: [
      { x: 40, y: 14, w: 52, h: 42 },
      { x: 150, y: 14, w: 52, h: 42 },
      { x: 242, y: 132, w: 52, h: 42 },
    ],
    ops: [
      { x: 121, y: 101, r: 17 },
      { x: 211, y: 195, r: 17 },
    ],
    boxes: [
      { x: 61, y: 132, w: 120, h: 42 },
      { x: 151, y: 226, w: 120, h: 42 },
    ],
    wires: [
      { x1: 66, y1: 56, x2: 66, y2: 72 },
      { x1: 176, y1: 56, x2: 176, y2: 72 },
      { x1: 66, y1: 72, x2: 176, y2: 72 },
      { x1: 121, y1: 72, x2: 121, y2: 84 },
      { x1: 121, y1: 118, x2: 121, y2: 132 },
      { x1: 181, y1: 153, x2: 242, y2: 153 },
      { x1: 211, y1: 153, x2: 211, y2: 178 },
      { x1: 211, y1: 212, x2: 211, y2: 226 },
    ],
  },
  tree: {
    w: 400,
    h: 300,
    slots: [
      { x: 20, y: 14, w: 50, h: 40 },
      { x: 110, y: 14, w: 50, h: 40 },
      { x: 240, y: 14, w: 50, h: 40 },
      { x: 330, y: 14, w: 50, h: 40 },
    ],
    ops: [
      { x: 90, y: 100, r: 16 },
      { x: 310, y: 100, r: 16 },
      { x: 200, y: 214, r: 16 },
    ],
    boxes: [
      { x: 32, y: 128, w: 116, h: 38 },
      { x: 252, y: 128, w: 116, h: 38 },
      { x: 128, y: 242, w: 144, h: 42 },
    ],
    wires: [
      { x1: 45, y1: 54, x2: 45, y2: 68 },
      { x1: 135, y1: 54, x2: 135, y2: 68 },
      { x1: 45, y1: 68, x2: 135, y2: 68 },
      { x1: 90, y1: 68, x2: 90, y2: 84 },
      { x1: 90, y1: 116, x2: 90, y2: 128 },
      { x1: 265, y1: 54, x2: 265, y2: 68 },
      { x1: 355, y1: 54, x2: 355, y2: 68 },
      { x1: 265, y1: 68, x2: 355, y2: 68 },
      { x1: 310, y1: 68, x2: 310, y2: 84 },
      { x1: 310, y1: 116, x2: 310, y2: 128 },
      { x1: 90, y1: 166, x2: 90, y2: 182 },
      { x1: 310, y1: 166, x2: 310, y2: 182 },
      { x1: 90, y1: 182, x2: 310, y2: 182 },
      { x1: 200, y1: 182, x2: 200, y2: 198 },
      { x1: 200, y1: 230, x2: 200, y2: 242 },
    ],
  },
};

/** 중간 결과 상자에 쓸 글자 */
export function boxText(shape: Shape, c: Config, i: number): string {
  const S = (k: number) => SRC_LABEL[c.ins[k]];
  const O = (k: number) => OP_LABEL[c.ops[k]];
  if (shape === "one") return `${S(0)}${O(0)}${S(1)}`;
  if (shape === "chain") return i === 0 ? `${S(0)}${O(0)}${S(1)}` : `(${S(0)}${O(0)}${S(1)})${O(1)}${S(2)}`;
  if (i === 0) return `${S(0)}${O(0)}${S(1)}`;
  if (i === 1) return `${S(2)}${O(1)}${S(3)}`;
  return `(${S(0)}${O(0)}${S(1)})${O(2)}(${S(2)}${O(1)}${S(3)})`;
}
/** 중간 결과 상자가 내놓는 조각 */
export function boxRegions(shape: Shape, c: Config, i: number): number[] {
  const S = (k: number) => srcRegions(c.ins[k]);
  if (shape === "one") return apply(c.ops[0], S(0), S(1));
  if (shape === "chain") return i === 0 ? apply(c.ops[0], S(0), S(1)) : runMachine("chain", c);
  if (i === 0) return apply(c.ops[0], S(0), S(1));
  if (i === 1) return apply(c.ops[1], S(2), S(3));
  return runMachine("tree", c);
}

// ══════════════════════════════════════════════════════════════
// 문제
// ══════════════════════════════════════════════════════════════
export type Task = {
  id: string;
  shape: Shape;
  /** 목표 그림을 만들어 내는 보기 답 (조각은 이것으로 계산한다) */
  goal: Config;
  /** 반드시 입력에 써야 하는 집합 */
  mustUse?: number;
  /** 반드시 그 자리에 놓아야 하는 연산 */
  mustOp?: { idx: number; op: Op };
  tip: string;
  /** 알아낸 것 — KaTeX 로 그대로 쓴다 (탭 ①) */
  discover?: string;
};

// ─── 탭 ① 장치 익히기 ────────────────────────────────
export const LEARN: Task[] = [
  {
    id: "w1",
    shape: "one",
    goal: { ins: [1, 0], ops: ["i"] },
    mustUse: 0,
    tip: "U 는 모든 조각을 덮으므로, 무엇과 겹쳐도 그 무엇이 그대로 남아요.",
    discover: "A \\cap U = A",
  },
  {
    id: "w2",
    shape: "one",
    goal: { ins: [2, 0], ops: ["u"] },
    mustUse: 0,
    tip: "U 는 이미 모든 조각을 덮고 있으니, 무엇을 더해도 U 그대로예요.",
    discover: "B \\cup U = U",
  },
  {
    id: "w3",
    shape: "one",
    goal: { ins: [3, 0], ops: ["d"] },
    mustUse: 0,
    tip: "U 안에 모든 원소가 있으니, U 를 빼면 남는 것이 하나도 없어요.",
    discover: "C - U = \\varnothing",
  },
  {
    id: "w4",
    shape: "one",
    goal: { ins: [0, 1], ops: ["d"] },
    mustUse: 0,
    tip: "여집합 부품이 없어도 괜찮아요. U 에서 A 를 빼면 그것이 바로 A 의 여집합이에요.",
    discover: "U - A = A^{C}",
  },
];

// ─── 탭 ② 그림 맞히기 (한 단계) ──────────────────────
export const ONES: Task[] = [
  { id: "o1", shape: "one", goal: { ins: [1, 3], ops: ["i"] }, tip: "A 와 C 가 함께 덮는 두 조각이에요." },
  { id: "o2", shape: "one", goal: { ins: [2, 1], ops: ["d"] }, tip: "B 안이면서 A 밖 — 빼기의 차례가 중요해요." },
  { id: "o3", shape: "one", goal: { ins: [2, 3], ops: ["u"] }, tip: "아래 두 원을 통째로 덮는 그림이에요." },
  { id: "o4", shape: "one", goal: { ins: [0, 2], ops: ["d"] }, tip: "B 바깥이 모두 칠해졌으니 B 의 여집합이에요. U 에서 빼면 됩니다." },
  { id: "o5", shape: "one", goal: { ins: [1, 3], ops: ["d"] }, tip: "A 안이면서 C 밖 — A 에서 C 를 덜어 낸 그림이에요." },
];

// ─── 탭 ③ 두 단계 장치 ───────────────────────────────
export const CHAINS: Task[] = [
  { id: "c1", shape: "chain", goal: { ins: [1, 2, 3], ops: ["i", "d"] }, tip: "A 와 B 가 겹치는 곳에서 C 에 걸치는 부분만 덜어 냈어요." },
  { id: "c2", shape: "chain", goal: { ins: [2, 3, 1], ops: ["u", "d"] }, tip: "아래 두 원을 합친 뒤 A 와 겹치는 부분을 덜어 냈어요." },
  { id: "c3", shape: "chain", goal: { ins: [1, 2, 3], ops: ["u", "i"] }, tip: "위의 두 원을 합친 것과 C 가 함께 덮는 곳이에요." },
  { id: "c4", shape: "chain", goal: { ins: [0, 1, 3], ops: ["d", "d"] }, tip: "U 에서 A 를 빼면 A 의 여집합, 거기서 C 까지 빼면 A 와 C 를 합친 것의 여집합이 돼요." },
  { id: "c5", shape: "chain", goal: { ins: [1, 2, 3], ops: ["d", "u"] }, tip: "A 에서 B 를 덜어 낸 조각에 C 를 통째로 얹었어요." },
];

// ─── 탭 ④ 두 갈래 장치 ───────────────────────────────
export const TREES: Task[] = [
  {
    id: "t1",
    shape: "tree",
    goal: { ins: [1, 2, 1, 3], ops: ["i", "i", "u"] },
    tip: "A 와 B 가 겹치는 곳, A 와 C 가 겹치는 곳을 각각 구해 합쳤어요. 이것이 바로 A ∩ (B ∪ C) 랍니다 — 분배법칙!",
  },
  {
    id: "t2",
    shape: "tree",
    goal: { ins: [0, 1, 0, 2], ops: ["d", "d", "i"] },
    tip: "A 의 여집합과 B 의 여집합을 겹치면 A ∪ B 의 여집합이 나와요 — 드모르간의 법칙!",
  },
  {
    id: "t3",
    shape: "tree",
    goal: { ins: [1, 2, 2, 1], ops: ["d", "d", "u"] },
    tip: "A 에만 있는 조각과 B 에만 있는 조각을 합친 것 — 둘 중 하나에만 속하는 부분이에요.",
  },
  {
    id: "t4",
    shape: "tree",
    goal: { ins: [1, 2, 1, 2], ops: ["u", "i", "d"] },
    mustOp: { idx: 2, op: "d" },
    tip: "앞 문제와 똑같은 그림인데 장치는 달라요. 합친 뒤 겹치는 곳을 도려내도 같은 조각이 남습니다.",
  },
];
