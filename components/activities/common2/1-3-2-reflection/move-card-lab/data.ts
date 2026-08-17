// 이동 카드 놀이 — 활동 데이터
//
//  네 장의 행동 카드로 좌표평면 위의 점을 옮긴다.
//    ① x축의 방향으로 1만큼 평행이동하기 (n회 반복)   (x, y) → (x + n, y)
//    ② y축의 방향으로 1만큼 평행이동하기 (n회 반복)   (x, y) → (x, y + n)
//    ③ 원점에 대하여 대칭이동하기                     (x, y) → (−x, −y)
//    ④ 직선 y = x 에 대하여 대칭이동하기              (x, y) → (y, x)
//
//  규칙 : ①② 중 적어도 한 장, ③④ 중 적어도 한 장을 반드시 쓴다.
//         반복 횟수는 자연수이므로 평행이동은 언제나 오른쪽·위쪽으로만 간다.
//         왼쪽이나 아래로 가려면 대칭 카드로 방향을 바꿔야 한다.
//
//  덧붙임 : 대칭 카드 ③④ 를 이어 하면
//         (x, y) → (−x, −y) → (−y, −x)  이므로 직선 y = −x 에 대한 대칭과 같다.
//         곧 대칭 카드만으로 갈 수 있는 자리는 최대 네 군데뿐이다.

export type Pt = { x: number; y: number };

export type CardKind = "tx" | "ty" | "so" | "sd";
export type Card = { kind: CardKind; n: number };

export const CARD_META: Record<CardKind, { no: number; title: string; sub: string; rule: string; color: string; repeat: boolean }> = {
  tx: { no: 1, title: "x축의 방향으로", sub: "1만큼 평행이동하기", rule: "(x + n, y)", color: "#38bdf8", repeat: true },
  ty: { no: 2, title: "y축의 방향으로", sub: "1만큼 평행이동하기", rule: "(x, y + n)", color: "#34d399", repeat: true },
  so: { no: 3, title: "원점에 대하여", sub: "대칭이동하기", rule: "(-x, -y)", color: "#a78bfa", repeat: false },
  sd: { no: 4, title: "직선 y = x 에 대하여", sub: "대칭이동하기", rule: "(y, x)", color: "#fbbf24", repeat: false },
};
export const CARD_ORDER: CardKind[] = ["tx", "ty", "so", "sd"];
export const MAX_REPEAT = 9;
export const MAX_CARDS = 6;

export function isMove(k: CardKind): boolean {
  return k === "tx" || k === "ty";
}

/** 카드 한 장을 적용한 결과 */
export function applyCard(p: Pt, c: Card): Pt {
  if (c.kind === "tx") return { x: p.x + c.n, y: p.y };
  if (c.kind === "ty") return { x: p.x, y: p.y + c.n };
  if (c.kind === "so") return { x: -p.x, y: -p.y };
  return { x: p.y, y: p.x };
}

/** 카드를 한 칸씩(평행이동은 1만큼씩) 펼친 낱낱의 걸음 */
export function expandSteps(cards: Card[]): { kind: CardKind; idx: number }[] {
  const out: { kind: CardKind; idx: number }[] = [];
  cards.forEach((c, idx) => {
    if (isMove(c.kind)) for (let k = 0; k < Math.max(1, c.n); k++) out.push({ kind: c.kind, idx });
    else out.push({ kind: c.kind, idx });
  });
  return out;
}

/** 걸음마다의 점 위치 (0번째는 출발점) */
export function walk(start: Pt, cards: Card[]): Pt[] {
  const pts: Pt[] = [start];
  let cur = start;
  for (const s of expandSteps(cards)) {
    cur = applyCard(cur, s.kind === "tx" || s.kind === "ty" ? { kind: s.kind, n: 1 } : { kind: s.kind, n: 0 });
    pts.push(cur);
  }
  return pts;
}

/** 카드를 한 장씩 적용한 결과 (카드 단위) */
export function runCards(start: Pt, cards: Card[]): Pt[] {
  const pts: Pt[] = [start];
  let cur = start;
  for (const c of cards) {
    cur = applyCard(cur, c);
    pts.push(cur);
  }
  return pts;
}

/** 규칙을 지켰는가 — 평행이동 카드 1장 이상 + 대칭 카드 1장 이상 */
export function ruleOk(cards: Card[]): boolean {
  return cards.some((c) => isMove(c.kind)) && cards.some((c) => !isMove(c.kind));
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 미션
// ══════════════════════════════════════════════════════════════
export type Mission = {
  id: string;
  start: Pt;
  goal: Pt;
  /** 규칙을 지키면서 쓸 수 있는 가장 적은 카드 수 (너비 우선 탐색으로 확인) */
  min: number;
  hint: string;
};

export const MISSIONS: Mission[] = [
  { id: "m1", start: { x: 1, y: 1 }, goal: { x: 4, y: 1 }, min: 2, hint: "먼저 위로 올라간 뒤 y = x 에 비추면?" },
  { id: "m2", start: { x: 2, y: 3 }, goal: { x: -5, y: -3 }, min: 2, hint: "오른쪽으로 간 다음 원점에 비춰 보세요." },
  { id: "m3", start: { x: -3, y: -1 }, goal: { x: 1, y: 4 }, min: 3, hint: "원점 대칭으로 방향을 뒤집어 놓고 시작해 보세요." },
  { id: "m4", start: { x: 0, y: 0 }, goal: { x: 3, y: -2 }, min: 3, hint: "아래로 내려가려면 대칭 카드의 힘을 빌려야 해요." },
  { id: "m5", start: { x: -4, y: 2 }, goal: { x: 2, y: -4 }, min: 3, hint: "y = x 대칭이 좌표를 통째로 바꿔 준다는 점을 떠올려 보세요." },
  { id: "m6", start: { x: -1, y: 5 }, goal: { x: -3, y: 6 }, min: 4, hint: "가까워 보여도 왼쪽으로는 갈 수 없어요. 대칭 카드를 두 번 써야 할지도?" },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 순서를 바꾸면?
// ══════════════════════════════════════════════════════════════
export type Pair = { id: string; a: Card; b: Card; same: boolean; why: string };

export const PAIRS: Pair[] = [
  {
    id: "p1",
    a: { kind: "tx", n: 3 },
    b: { kind: "sd", n: 0 },
    same: false,
    why: "평행이동을 먼저 하면 옮긴 뒤의 좌표가 뒤바뀌고, 대칭을 먼저 하면 뒤바뀐 좌표에서 옮겨요.",
  },
  {
    id: "p2",
    a: { kind: "so", n: 0 },
    b: { kind: "sd", n: 0 },
    same: true,
    why: "두 대칭을 어떤 차례로 해도 결국 (−y, −x) — 직선 y = −x 에 대한 대칭이 돼요.",
  },
  {
    id: "p3",
    a: { kind: "tx", n: 2 },
    b: { kind: "ty", n: 3 },
    same: true,
    why: "오른쪽으로 간 뒤 위로 가나, 위로 간 뒤 오른쪽으로 가나 도착하는 곳은 같아요.",
  },
  {
    id: "p4",
    a: { kind: "ty", n: 2 },
    b: { kind: "so", n: 0 },
    same: false,
    why: "대칭을 먼저 하면 위로 가던 방향이 반대편에서 시작돼요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 대칭 카드의 비밀
// ══════════════════════════════════════════════════════════════
/** 대칭 카드만으로 갈 수 있는 네 자리 */
export type SymState = "I" | "O" | "D" | "N";
export const SYM_STATE_META: Record<SymState, { label: string; tex: string; color: string }> = {
  I: { label: "처음 자리", tex: "(x,\\; y)", color: "#e2e8f0" },
  O: { label: "원점 대칭", tex: "(-x,\\; -y)", color: "#a78bfa" },
  D: { label: "y = x 대칭", tex: "(y,\\; x)", color: "#fbbf24" },
  N: { label: "y = −x 대칭", tex: "(-y,\\; -x)", color: "#f472b6" },
};
export const SYM_STATES: SymState[] = ["I", "O", "D", "N"];

/** 대칭 카드를 눌렀을 때의 자리 바뀜 (클라인 사원군) */
export const SYM_MOVE: Record<SymState, { so: SymState; sd: SymState }> = {
  I: { so: "O", sd: "D" },
  O: { so: "I", sd: "N" },
  D: { so: "N", sd: "I" },
  N: { so: "D", sd: "O" },
};

export function symPos(p: Pt, s: SymState): Pt {
  if (s === "I") return p;
  if (s === "O") return { x: -p.x, y: -p.y };
  if (s === "D") return { x: p.y, y: p.x };
  return { x: -p.y, y: -p.x };
}

export const SYM_QUIZ = {
  prompt: "원점 대칭 다음에 y = x 대칭을 하면, 어떤 대칭 한 번과 같을까요?",
  choices: ["x축에 대한 대칭", "y축에 대한 대칭", "직선 y = −x 에 대한 대칭", "제자리 (움직이지 않음)"],
  ans: 2,
  tip: "(x, y) → (−x, −y) → (−y, −x) 이고, 이는 직선 y = −x 에 대한 대칭과 같아요.",
};
