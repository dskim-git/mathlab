// 합성함수 — 활동 데이터
//
//  [합성함수] 두 함수 f : X → Y, g : Y → Z 에 대하여
//        X 의 임의의 원소 x 에 Z 의 원소 g(f(x)) 를 대응시키면 X 에서 Z 로의 함수가 된다.
//        이를 f 와 g 의 합성함수라 하고  g ∘ f : X → Z,  (g ∘ f)(x) = g(f(x))  로 쓴다.
//        f 를 먼저 쓰고 g 를 나중에 쓰는데 기호는 g ∘ f 로 거꾸로 적는다는 점에 주의한다.
//
//  [합성이 되기 위한 조건] f 의 치역이 g 의 정의역의 부분집합이어야 한다.
//        그렇지 않으면 g(f(x)) 를 정할 수 없는 x 가 생겨 g ∘ f 가 함수가 되지 못한다.
//
//  [성질] 함수의 합성을 수의 곱에 견주어 보면 무엇이 같고 무엇이 다른지가 또렷해진다.
//        교환법칙  a × b = b × a 는 늘 성립하지만  f ∘ g = g ∘ f 는 일반적으로 성립하지 않는다.
//        결합법칙  (a × b) × c = a × (b × c) 처럼  (f ∘ g) ∘ h = f ∘ (g ∘ h) 는 늘 성립한다.
//              (h ∘ (g ∘ f))(x) = h((g ∘ f)(x)) = h(g(f(x))) = (h ∘ g)(f(x)) = ((h ∘ g) ∘ f)(x)
//        항등원  a × 1 = 1 × a = a 처럼  f ∘ I = I ∘ f = f  (I 는 항등함수)
//              곧 항등함수는 함수의 합성에서 수 1 의 구실을 한다.
//        영원(零元) 은 한쪽만 닮는다. 영함수 O(x) = 0 에 대하여
//              O ∘ f = O 는 성립하지만  f ∘ O 는 f(0) 을 값으로 갖는 상수함수이므로
//              f(0) ≠ 0 이면 영함수가 아니다. 수에서 a × 0 = 0 × a = 0 인 것과 다른 대목이다.
//
//  [쿠폰 순서] 정액 할인 f(x) = x − a 와 정률 할인 g(x) = (1 − p)x 를 견주면
//        (g ∘ f)(x) = (1 − p)(x − a) = (1 − p)x − (1 − p)a   … 정액을 먼저 쓴 값
//        (f ∘ g)(x) = (1 − p)x − a                            … 정률을 먼저 쓴 값
//        두 값의 차는 (g ∘ f)(x) − (f ∘ g)(x) = a − (1 − p)a = ap 로 x 에 관계없이 일정하다.
//        ap > 0 이므로 정률 할인을 먼저 쓰는 쪽이 언제나 ap 원만큼 싸다.
//        정률 둘끼리는 (1−p)(1−q)x 로, 정액 둘끼리는 x − a − b 로 순서를 바꾸어도 같다.

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

export type Pt = [number, number];

// ══════════════════════════════════════════════════════════════
// 여러 집합을 잇는 대응도 — 공용 좌표
// ══════════════════════════════════════════════════════════════
export const CH = { rowH: 36, rx: 52, headH: 46, pad: 28, botPad: 18, inset: 30, gap: 56 };

export function chGeom(counts: number[], withComposite = false) {
  const maxN = Math.max(...counts);
  const ryMax = ((maxN - 1) * CH.rowH) / 2 + CH.pad;
  const cy = CH.headH + ryMax;
  const h = cy + ryMax + CH.botPad + (withComposite ? 44 : 0);
  const w = 40 + counts.length * 2 * CH.rx + (counts.length - 1) * CH.gap;
  const cxs = counts.map((_, i) => 20 + CH.rx + i * (2 * CH.rx + CH.gap));
  const rys = counts.map((n) => ((n - 1) * CH.rowH) / 2 + CH.pad);
  return { cy, h, w, cxs, rys, ryMax };
}

export function chRowY(i: number, n: number, cy: number): number {
  return cy + (i - (n - 1) / 2) * CH.rowH;
}

// ══════════════════════════════════════════════════════════════
// 좌표평면 — 탭 ② 에서 두 합성함수를 겹쳐 그린다
// ══════════════════════════════════════════════════════════════
export const PV = { size: 280, min: -6, max: 6, pad: 18 };

export function pvX(v: number): number {
  return PV.pad + ((v - PV.min) / (PV.max - PV.min)) * (PV.size - 2 * PV.pad);
}
export function pvY(v: number): number {
  return PV.pad + ((PV.max - v) / (PV.max - PV.min)) * (PV.size - 2 * PV.pad);
}
export const PV_TICKS = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];

const inWin = (y: number) => y >= PV.min && y <= PV.max;

/**
 * 함수를 창 안의 꺾은선 조각들로 바꾼다.
 * 창을 벗어나는 자리는 이분법으로 테두리까지만 이어 붙이므로 좌표가 언제나 그림 상자 안에 들어온다.
 */
export function traceFn(fn: (x: number) => number): Pt[][] {
  const N = 900;
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  let px: number | null = null;
  let py: number | null = null;

  const edgePoint = (xIn: number, xOut: number): Pt => {
    let a = xIn;
    let b = xOut;
    for (let k = 0; k < 40; k++) {
      const m = (a + b) / 2;
      const ym = fn(m);
      if (!Number.isFinite(ym) || !inWin(ym)) b = m;
      else a = m;
    }
    const ya = fn(a);
    return [a, Number.isFinite(ya) ? Math.max(PV.min, Math.min(PV.max, ya)) : PV.min];
  };

  const flush = () => {
    if (cur.length > 1) out.push(cur);
    cur = [];
  };

  for (let i = 0; i <= N; i++) {
    const x = PV.min + ((PV.max - PV.min) * i) / N;
    const yr = fn(x);
    const y = Number.isFinite(yr) ? yr : null;
    const good = y !== null && inWin(y) && (py === null || Math.abs(y - py) <= 6);
    if (good) {
      if (cur.length === 0 && px !== null && py !== null) cur.push(edgePoint(x, px));
      cur.push([x, y as number]);
    } else {
      if (cur.length > 0 && px !== null && py !== null) cur.push(edgePoint(px, x));
      flush();
    }
    px = x;
    py = y;
  }
  flush();
  return out;
}

export function svgPath(poly: Pt[]): string {
  return "M" + poly.map(([x, y]) => `${pvX(x).toFixed(2)},${pvY(y).toFixed(2)}`).join(" L");
}

/** 소수점이 지저분하지 않게 */
export function nx(v: number): string {
  const r = Math.round(v * 1000) / 1000;
  return r < 0 ? "−" + String(Math.abs(r)) : String(r);
}

/** 돈은 천 단위로 끊어 읽는다 */
export function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 합성함수란
// ══════════════════════════════════════════════════════════════
// ── 따라가기 ─────────────────────────────────────────────────
//   f : 1→5, 2→4, 3→5     g : 4→30, 5→10, 6→20
//   (g∘f)(1) = g(5) = 10,  (g∘f)(2) = g(4) = 30,  (g∘f)(3) = g(5) = 10
export const TRACE = {
  xs: ["1", "2", "3"],
  ys: ["4", "5", "6"],
  zs: ["10", "20", "30"],
  /** x 첨자 → y 첨자 */
  f: [1, 0, 1],
  /** y 첨자 → z 첨자 */
  g: [2, 0, 1],
};

// ── 합성이 될까? ─────────────────────────────────────────────
export type DefTask = {
  id: string;
  fTex: string;
  gTex: string;
  /** f 의 치역 */
  fRange: Piece[];
  /** g 의 정의역 */
  gDom: Piece[];
  ok: boolean;
  why: string;
};

const REAL: Piece[] = [{ pre: "실수 전체의 집합" }];

export const DEF_TASKS: DefTask[] = [
  {
    id: "e1",
    fTex: "f : X \\to Y",
    gTex: "g : Y' \\to Z",
    fRange: [{ tex: "\\{2,\\ 4,\\ 6\\}" }],
    gDom: [{ tex: "\\{2,\\ 4,\\ 6,\\ 8\\}" }],
    ok: true,
    why: "치역의 원소 2, 4, 6 이 모두 g 의 정의역 안에 있어요. g 의 정의역에 쓰이지 않는 8 이 남아 있어도 상관없습니다.",
  },
  {
    id: "e2",
    fTex: "f : X \\to Y",
    gTex: "g : Y' \\to Z",
    fRange: [{ tex: "\\{1,\\ 3,\\ 5\\}" }],
    gDom: [{ tex: "\\{1,\\ 3\\}" }],
    ok: false,
    why: "5 가 g 의 정의역 밖이에요. f(x) = 5 가 되는 x 에서 g(f(x)) 를 정할 수 없으니 합성함수가 되지 못합니다.",
  },
  {
    id: "e3",
    fTex: "f(x)=x^2+1",
    gTex: "g(x)=\\sqrt{x-1}",
    fRange: [{ tex: "\\{y \\mid y \\ge 1\\}" }],
    gDom: [{ tex: "\\{x \\mid x \\ge 1\\}" }],
    ok: true,
    why: "제곱에 1 을 더했으니 f 의 값은 늘 1 이상이고, g 는 1 이상에서 정의돼요. 두 집합이 꼭 맞아떨어집니다.",
  },
  {
    id: "e4",
    fTex: "f(x)=x-3",
    gTex: "g(x)=\\sqrt{x}",
    fRange: REAL,
    gDom: [{ tex: "\\{x \\mid x \\ge 0\\}" }],
    ok: false,
    why: "x = 0 이면 f(0) = -3 이라 g(-3) 을 정할 수 없어요. 정의역을 x ≥ 3 으로 좁히면 그때는 합성할 수 있습니다.",
  },
  {
    id: "e5",
    fTex: "f(x)=|x|+3",
    gTex: "g(x)=\\dfrac{1}{x-1}",
    fRange: [{ tex: "\\{y \\mid y \\ge 3\\}" }],
    gDom: [{ tex: "\\{x \\mid x \\ne 1\\}" }],
    ok: true,
    why: "f 의 값은 늘 3 이상이라 1 이 되는 일이 없어요. g 가 정의되지 않는 자리를 비켜 갑니다.",
  },
  {
    id: "e6",
    fTex: "f(x)=2x",
    gTex: "g(x)=\\dfrac{1}{x-4}",
    fRange: REAL,
    gDom: [{ tex: "\\{x \\mid x \\ne 4\\}" }],
    ok: false,
    why: "x = 2 이면 f(2) = 4 라 분모가 0 이 돼요. 딱 한 자리가 걸려도 합성함수가 되지 못합니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 합성함수의 성질
// ══════════════════════════════════════════════════════════════
export type Fn1 = { id: string; tex: string; fn: (x: number) => number };

export const F_LIST: Fn1[] = [
  { id: "f1", tex: "f(x)=x+2", fn: (x) => x + 2 },
  { id: "f2", tex: "f(x)=2x", fn: (x) => 2 * x },
  { id: "f3", tex: "f(x)=x^2", fn: (x) => x * x },
  { id: "f4", tex: "f(x)=-x", fn: (x) => -x },
];

export const G_LIST: Fn1[] = [
  { id: "g1", tex: "g(x)=x+5", fn: (x) => x + 5 },
  { id: "g2", tex: "g(x)=3x", fn: (x) => 3 * x },
  { id: "g3", tex: "g(x)=x-1", fn: (x) => x - 1 },
  { id: "g4", tex: "g(x)=x^2", fn: (x) => x * x },
];

export type Comb = {
  /** (g∘f)(x) 의 우변 */
  gfTex: string;
  /** (f∘g)(x) 의 우변 */
  fgTex: string;
  /** 적어 둔 우변을 그대로 계산하는 식 — 데이터가 식과 어긋나지 않는지 검산하는 데 쓴다 */
  gfEval: (x: number) => number;
  fgEval: (x: number) => number;
  same: boolean;
  note: string;
};

export const COMB: Record<string, Comb> = {
  "f1:g1": { gfTex: "x+7", fgTex: "x+7", gfEval: (x) => x + 7, fgEval: (x) => x + 7, same: true, note: "옮기는 일끼리는 순서를 바꾸어도 옮긴 거리의 합이 같아요. 2 만큼, 5 만큼 옮기면 어느 쪽이든 7 만큼 옮긴 셈입니다." },
  "f1:g2": { gfTex: "3x+6", fgTex: "3x+2", gfEval: (x) => 3 * x + 6, fgEval: (x) => 3 * x + 2, same: false, note: "먼저 2 를 더한 뒤 3 배 하면 더한 2 까지 3 배가 돼요. 순서가 바뀌면 그 2 가 그대로 남습니다." },
  "f1:g3": { gfTex: "x+1", fgTex: "x+1", gfEval: (x) => x + 1, fgEval: (x) => x + 1, same: true, note: "2 를 더하고 1 을 빼나, 1 을 빼고 2 를 더하나 결국 1 을 더한 것입니다." },
  "f1:g4": { gfTex: "(x+2)^2", fgTex: "x^2+2", gfEval: (x) => (x + 2) * (x + 2), fgEval: (x) => x * x + 2, same: false, note: "더한 뒤 제곱하는 것과 제곱한 뒤 더하는 것은 전혀 다른 일이에요." },
  "f2:g1": { gfTex: "2x+5", fgTex: "2x+10", gfEval: (x) => 2 * x + 5, fgEval: (x) => 2 * x + 10, same: false, note: "5 를 나중에 더하면 5 만 더해지고, 먼저 더하면 그 5 까지 2 배가 됩니다." },
  "f2:g2": { gfTex: "6x", fgTex: "6x", gfEval: (x) => 6 * x, fgEval: (x) => 6 * x, same: true, note: "곱하는 일끼리는 순서를 바꾸어도 곱한 값이 같아요. 2 배와 3 배는 어느 쪽이든 6 배입니다." },
  "f2:g3": { gfTex: "2x-1", fgTex: "2x-2", gfEval: (x) => 2 * x - 1, fgEval: (x) => 2 * x - 2, same: false, note: "1 을 먼저 빼면 그 1 까지 2 배가 되어 2 가 빠집니다." },
  "f2:g4": { gfTex: "4x^2", fgTex: "2x^2", gfEval: (x) => 4 * x * x, fgEval: (x) => 2 * x * x, same: false, note: "2 배 한 뒤 제곱하면 4 배가 되지만, 제곱한 뒤 2 배 하면 2 배 그대로예요." },
  "f3:g1": { gfTex: "x^2+5", fgTex: "(x+5)^2", gfEval: (x) => x * x + 5, fgEval: (x) => (x + 5) * (x + 5), same: false, note: "제곱한 뒤 더하는 것과 더한 뒤 제곱하는 것은 다릅니다." },
  "f3:g2": { gfTex: "3x^2", fgTex: "9x^2", gfEval: (x) => 3 * x * x, fgEval: (x) => 9 * x * x, same: false, note: "3 배를 먼저 하면 제곱되면서 9 배가 됩니다." },
  "f3:g3": { gfTex: "x^2-1", fgTex: "(x-1)^2", gfEval: (x) => x * x - 1, fgEval: (x) => (x - 1) * (x - 1), same: false, note: "제곱한 뒤 1 을 빼는 것과 1 을 뺀 뒤 제곱하는 것은 다릅니다." },
  "f3:g4": { gfTex: "x^4", fgTex: "x^4", gfEval: (x) => x ** 4, fgEval: (x) => x ** 4, same: true, note: "똑같은 함수를 두 번 합성했으니 당연히 순서가 없어요." },
  "f4:g1": { gfTex: "-x+5", fgTex: "-x-5", gfEval: (x) => -x + 5, fgEval: (x) => -x - 5, same: false, note: "부호를 먼저 바꾸면 5 가 그대로 더해지고, 나중에 바꾸면 그 5 까지 부호가 뒤집힙니다." },
  "f4:g2": { gfTex: "-3x", fgTex: "-3x", gfEval: (x) => -3 * x, fgEval: (x) => -3 * x, same: true, note: "부호를 바꾸는 것도 -1 을 곱하는 일이에요. 곱하는 일끼리라 순서를 바꾸어도 같습니다." },
  "f4:g3": { gfTex: "-x-1", fgTex: "-x+1", gfEval: (x) => -x - 1, fgEval: (x) => -x + 1, same: false, note: "1 을 먼저 빼면 그 1 까지 부호가 뒤집혀 도리어 더해집니다." },
  "f4:g4": { gfTex: "x^2", fgTex: "-x^2", gfEval: (x) => x * x, fgEval: (x) => -(x * x), same: false, note: "제곱하면 부호가 사라지지만, 제곱한 뒤 부호를 바꾸면 늘 음수가 됩니다." },
};

export const COMM_GOALS = ["교환법칙이 깨지는 짝 찾기", "교환법칙이 성립하는 짝 찾기", "성립하는 짝을 세 가지 찾기"];

// ── 결합법칙 ─────────────────────────────────────────────────
//   f : 1→4, 2→3   g : 3→6, 4→5   h : 5→8, 6→7
//   (h∘(g∘f))(1) = h(g(4)) = h(5) = 8 = ((h∘g)∘f)(1)
export const ASSOC = {
  xs: ["1", "2"],
  ys: ["3", "4"],
  zs: ["5", "6"],
  ws: ["7", "8"],
  f: [1, 0],
  g: [1, 0],
  h: [1, 0],
};

/** 식으로도 확인 — f(x)=x+1, g(x)=2x, h(x)=x-3 */
export const ASSOC_FN = {
  fTex: "f(x)=x+1",
  gTex: "g(x)=2x",
  hTex: "h(x)=x-3",
  f: (x: number) => x + 1,
  g: (x: number) => 2 * x,
  h: (x: number) => x - 3,
  /** (h∘g)∘f 와 h∘(g∘f) 는 모두 2x-1 */
  bothTex: "2x-1",
  both: (x: number) => 2 * x - 1,
};

// ── 수의 곱과 견주기 ─────────────────────────────────────────
export type LawRow = {
  id: string;
  name: string;
  numTex: string;
  fnTex: string;
  /** 함수의 합성에서도 성립하는가 */
  holds: boolean;
  why: string;
};

export const LAWS: LawRow[] = [
  {
    id: "L1",
    name: "교환법칙",
    numTex: "a \\times b = b \\times a",
    fnTex: "f \\circ g = g \\circ f",
    holds: false,
    why: "f(x) = x+2, g(x) = 3x 이면 (g∘f)(x) = 3x+6 이고 (f∘g)(x) = 3x+2 라 서로 다릅니다. 수의 곱과 달리 순서를 마음대로 바꿀 수 없어요.",
  },
  {
    id: "L2",
    name: "결합법칙",
    numTex: "(a \\times b) \\times c = a \\times (b \\times c)",
    fnTex: "(f \\circ g) \\circ h = f \\circ (g \\circ h)",
    holds: true,
    why: "어느 쪽이든 결국 f(g(h(x))) 를 차례로 계산하는 일이라 같아요. 묶는 방법만 다를 뿐 거쳐 가는 길은 하나입니다.",
  },
  {
    id: "L3",
    name: "항등원",
    numTex: "a \\times 1 = 1 \\times a = a",
    fnTex: "f \\circ I = I \\circ f = f",
    holds: true,
    why: "항등함수 I 는 넣은 것을 그대로 내놓으므로 앞에 붙이든 뒤에 붙이든 f 가 그대로 남아요. 항등함수는 합성에서 수 1 의 구실을 합니다.",
  },
  {
    id: "L4",
    name: "영함수 · 나중에",
    numTex: "0 \\times a = 0",
    fnTex: "O \\circ f = O",
    holds: true,
    why: "f 가 무엇을 내놓든 O 가 모두 0 으로 보내므로 결과는 늘 영함수예요. 0 을 곱하면 0 이 되는 것과 같습니다.",
  },
  {
    id: "L5",
    name: "영함수 · 먼저",
    numTex: "a \\times 0 = 0",
    fnTex: "f \\circ O = O",
    holds: false,
    why: "O 가 모든 것을 0 으로 보낸 뒤 f 를 씌우면 값이 f(0) 이 돼요. f(x) = 2x+3 이면 (f∘O)(x) = 3 인 상수함수라 영함수가 아닙니다. 수의 곱과 달라지는 유일한 대목이에요.",
  },
];

export type ZeroFn = { id: string; tex: string; fn: (x: number) => number };

export const ZERO_FS: ZeroFn[] = [
  { id: "z1", tex: "f(x)=2x+3", fn: (x) => 2 * x + 3 },
  { id: "z2", tex: "f(x)=x^2-1", fn: (x) => x * x - 1 },
  { id: "z3", tex: "f(x)=-x+4", fn: (x) => -x + 4 },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 쿠폰을 쓰는 순서
// ══════════════════════════════════════════════════════════════
export type Coupon = { id: string; label: string; amount: number; rate: number };

export const COUPONS: Coupon[] = [
  { id: "c1", label: "문구점", amount: 2000, rate: 20 },
  { id: "c2", label: "서점", amount: 5000, rate: 10 },
  { id: "c3", label: "카페", amount: 3000, rate: 25 },
  { id: "c4", label: "분식집", amount: 1500, rate: 15 },
];

export const PRICE = { min: 10000, max: 60000, step: 1000, init: 30000 };

/** 정액을 먼저 쓴 값 — (g∘f)(x) = (1-p)(x-a) */
export function amountFirst(x: number, c: Coupon): number {
  return (1 - c.rate / 100) * (x - c.amount);
}
/** 정률을 먼저 쓴 값 — (f∘g)(x) = (1-p)x - a */
export function rateFirst(x: number, c: Coupon): number {
  return (1 - c.rate / 100) * x - c.amount;
}
/** 두 값의 차 — x 에 관계없이 a × p 로 일정하다 */
export function gapOf(c: Coupon): number {
  return (c.amount * c.rate) / 100;
}

export const COUPON_GOALS = [
  "정률 쿠폰을 먼저 쓰는 쪽이 싼지 확인하기",
  "가격을 바꾸어도 차이가 그대로인지 확인하기",
  "쿠폰을 바꾸면 차이가 얼마가 되는지 확인하기",
];

export type CouponTask = {
  id: string;
  story: string;
  /** 보기가 순서 고르기인지 값 고르기인지 — 늘어놓는 모양만 다르다 */
  kind: "order" | "value";
  /**
   * 보기는 문제마다 따로 둔다.
   * 같은 종류의 쿠폰 두 장을 쓰는 문제에서는 「정액 / 정률」로 가를 수 없으므로
   * 그 문제에 실제로 나오는 두 쿠폰의 이름을 그대로 보기로 쓴다.
   */
  choices: string[];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const COUPON_TASKS: CouponTask[] = [
  {
    id: "q1",
    story: "문구점에서 30,000원어치를 사면서 2,000원 할인권과 20% 할인권을 모두 씁니다. 어느 순서가 쌀까요?",
    kind: "order",
    choices: ["2,000원 할인권을 먼저", "20% 할인권을 먼저", "어느 쪽이든 같다"],
    answer: 1,
    choiceWhy: [
      "2,000원을 먼저 빼면 20% 할인이 28,000원에만 걸려 22,400원이 돼요. 400원을 더 냅니다.",
      "",
      "22,400원과 22,000원으로 400원이 차이 납니다.",
    ],
    why: "정률을 먼저 쓰면 24,000원에서 2,000원을 빼 22,000원, 정액을 먼저 쓰면 28,000원의 80%인 22,400원이에요. 400원 차이입니다.",
  },
  {
    id: "q2",
    story: "온라인 서점에서 20% 쿠폰과 10% 쿠폰을 함께 씁니다. 어느 순서가 쌀까요?",
    kind: "order",
    choices: ["20% 쿠폰을 먼저", "10% 쿠폰을 먼저", "어느 쪽이든 같다"],
    answer: 2,
    choiceWhy: [
      "둘 다 정률이라 곱하는 일끼리예요. 0.8 × 0.9 든 0.9 × 0.8 이든 0.72 로 같습니다.",
      "둘 다 정률이라 곱하는 일끼리예요. 0.8 × 0.9 든 0.9 × 0.8 이든 0.72 로 같습니다.",
      "",
    ],
    why: "정률 쿠폰끼리는 곱셈이라 순서를 바꾸어도 0.72 배로 같아요. 참고로 20% 와 10% 를 합쳐도 30% 할인이 아니라 28% 할인입니다.",
  },
  {
    id: "q3",
    story: "서점에서 5,000원 할인권과 10% 할인권을 함께 쓸 때, 순서를 잘 고르면 얼마를 아낄 수 있을까요?",
    kind: "value",
    choices: ["500원", "1,000원", "4,500원", "5,000원"],
    answer: 0,
    choiceWhy: [
      "",
      "5,000원 전체에 걸리는 것이 아니라 그 가운데 10% 만큼만 차이가 납니다.",
      "4,500원은 정액 쿠폰이 실제로 깎아 준 몫이지 두 방법의 차이가 아니에요.",
      "5,000원은 할인권의 액수 그대로입니다. 차이는 그보다 훨씬 작아요.",
    ],
    why: "차이는 언제나 (할인권 액수) × (할인율) 이에요. 5,000 × 0.1 = 500원입니다.",
  },
  {
    id: "q4",
    story: "편의점에서 2,000원 할인권과 3,000원 할인권을 함께 씁니다. 어느 순서가 쌀까요?",
    kind: "order",
    choices: ["2,000원 할인권을 먼저", "3,000원 할인권을 먼저", "어느 쪽이든 같다"],
    answer: 2,
    choiceWhy: [
      "둘 다 정액이라 빼는 일끼리예요. 어느 쪽을 먼저 빼도 모두 5,000원이 빠집니다.",
      "둘 다 정액이라 빼는 일끼리예요. 어느 쪽을 먼저 빼도 모두 5,000원이 빠집니다.",
      "",
    ],
    why: "정액 쿠폰끼리는 덧셈·뺄셈이라 순서를 바꾸어도 같아요. 순서가 문제가 되는 것은 정액과 정률이 섞일 때뿐입니다.",
  },
  {
    id: "q5",
    story: "카페에서 3,000원 할인권과 25% 할인권을 함께 씁니다. 두 방법의 금액 차이는 얼마일까요?",
    kind: "value",
    choices: ["250원", "300원", "750원", "3,000원"],
    answer: 2,
    choiceWhy: [
      "할인율을 10% 로 잘못 본 값이에요. 25% 로 다시 셈해 보세요.",
      "할인권 액수와 할인율을 곱해야 하는데 자릿수가 어긋났어요.",
      "",
      "3,000원은 할인권 액수 그대로입니다. 차이는 그 가운데 25% 예요.",
    ],
    why: "3,000 × 0.25 = 750원이에요. 이 값은 산 물건의 값과 아무 관계가 없습니다.",
  },
  {
    id: "q6",
    story: "정률 쿠폰을 먼저 쓰는 쪽이 언제나 유리한 까닭은 무엇일까요?",
    kind: "value",
    choices: [
      "정률 쿠폰의 할인율이 정액 쿠폰보다 늘 크기 때문",
      "정액을 먼저 빼면 정률 할인이 이미 줄어든 금액에만 걸리기 때문",
      "정액 쿠폰은 원래 값에만 쓸 수 있기 때문",
      "정률 쿠폰이 먼저 쓰도록 정해져 있기 때문",
    ],
    answer: 1,
    choiceWhy: [
      "할인율이 크고 작고의 문제가 아니에요. 어떤 값이든 정률을 먼저 쓰는 쪽이 쌉니다.",
      "",
      "정액 쿠폰은 어느 금액에나 쓸 수 있어요. 문제는 걸리는 차례입니다.",
      "규칙으로 정해진 것이 아니라 셈을 해 보면 그렇게 나옵니다.",
    ],
    why: "정액을 먼저 빼면 그만큼 줄어든 금액에 정률 할인이 걸려 깎이는 몫이 작아져요. 그 손해가 바로 (할인권 액수) × (할인율) 입니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 일상 속 합성함수
// ══════════════════════════════════════════════════════════════
export const SWAP_CHOICES = ["결과가 같다", "결과가 달라진다", "아예 합성할 수 없다"];

export type LifeCase = {
  id: string;
  icon: string;
  title: string;
  /** 세 칸의 이름 */
  boxes: [string, string, string];
  fName: string;
  gName: string;
  /** 보기로 물을 입력값과 중간값·최종값 */
  input: string;
  mid: string;
  out: string;
  choices: string[];
  answer: number;
  choiceWhy: string[];
  why: string;
  swap: 0 | 1 | 2;
  swapWhy: string;
};

export const LIFE_CASES: LifeCase[] = [
  {
    id: "L1",
    icon: "🏫",
    title: "학생 → 반 → 반 티셔츠 색",
    boxes: ["학생", "반", "티셔츠 색"],
    fName: "그 학생의 반",
    gName: "그 반의 티셔츠 색",
    input: "서연",
    mid: "1반",
    out: "빨강",
    choices: ["빨강", "파랑", "노랑", "초록"],
    answer: 0,
    choiceWhy: [
      "",
      "파랑은 2반의 색이에요. 서연은 1반입니다.",
      "노랑은 3반의 색이에요.",
      "초록 티셔츠를 입는 반은 없습니다.",
    ],
    why: "서연은 1반이고 1반의 티셔츠는 빨강이에요. 학생에게 바로 색을 짝지어 주는 함수가 g ∘ f 입니다.",
    swap: 2,
    swapWhy: "색에는 「그 학생의 반」을 물을 수 없어요. f 의 정의역이 학생이라 색을 넣을 수 없으니 f ∘ g 는 아예 만들어지지 않습니다.",
  },
  {
    id: "L2",
    icon: "📸",
    title: "사진 밝기 → 밝게 → 대비 올리기",
    boxes: ["원래 밝기", "밝기 +20", "밝기 2배"],
    fName: "밝기를 20 올리기",
    gName: "밝기를 2배로",
    input: "30",
    mid: "50",
    out: "100",
    choices: ["60", "80", "100", "130"],
    answer: 2,
    choiceWhy: [
      "2배만 한 값이에요. 20 을 올리는 것을 빠뜨렸습니다.",
      "순서를 바꾼 값이에요. 2배를 먼저 하면 80 이 됩니다.",
      "",
      "20 을 더한 뒤 다시 100 을 더한 셈이에요.",
    ],
    why: "30 에 20 을 더해 50, 그것을 2배 해 100 이 됩니다.",
    swap: 1,
    swapWhy: "2배를 먼저 하면 60 이 되고 거기에 20 을 더해 80 이에요. 더한 20 이 2배가 되느냐 아니냐로 20 만큼 갈립니다.",
  },
  {
    id: "L3",
    icon: "💱",
    title: "달러 → 원 → 수수료 뗀 금액",
    boxes: ["달러", "원", "받는 금액"],
    fName: "1달러를 1,300원으로",
    gName: "수수료 2% 떼기",
    input: "200달러",
    mid: "260,000원",
    out: "254,800원",
    choices: ["254,800원", "260,000원", "265,200원", "249,000원"],
    answer: 0,
    choiceWhy: [
      "",
      "수수료를 떼기 전의 금액이에요.",
      "수수료를 떼는 대신 붙인 값입니다.",
      "2% 가 아니라 다른 비율로 뗀 값이에요.",
    ],
    why: "200 × 1,300 = 260,000원이고 그 98% 인 254,800원을 받습니다.",
    swap: 0,
    swapWhy: "둘 다 곱하는 일이라 순서를 바꾸어도 같아요. 달러에서 2% 를 먼저 떼고 환전해도 254,800원입니다.",
  },
  {
    id: "L4",
    icon: "🖼️",
    title: "사진 크기 → 2배 확대 → 절반 축소",
    boxes: ["원래 가로", "2배", "절반"],
    fName: "가로를 2배로",
    gName: "가로를 절반으로",
    input: "400px",
    mid: "800px",
    out: "400px",
    choices: ["200px", "400px", "800px", "1600px"],
    answer: 1,
    choiceWhy: [
      "절반만 한 값이에요. 2배로 늘린 것을 빠뜨렸습니다.",
      "",
      "2배만 한 값이에요. 절반으로 줄이는 것이 남았습니다.",
      "2배를 두 번 한 값이에요.",
    ],
    why: "2배로 늘렸다가 절반으로 줄이면 처음으로 돌아와요. g ∘ f 가 항등함수가 되는 경우입니다.",
    swap: 0,
    swapWhy: "절반으로 줄였다가 2배로 늘려도 처음으로 돌아와요. 이렇게 서로를 되돌리는 두 함수를 다음에 역함수라는 이름으로 만나게 됩니다.",
  },
  {
    id: "L5",
    icon: "🔐",
    title: "글자 → 번호 → 번호에 3 더하기",
    boxes: ["글자", "번호", "바뀐 번호"],
    fName: "A를 1, B를 2 … Z를 26으로",
    gName: "번호에 3 더하기 (26을 넘으면 26 빼기)",
    input: "W (23번)",
    mid: "26",
    out: "Z",
    choices: ["X", "Y", "A", "Z"],
    answer: 3,
    choiceWhy: [
      "1 만 더한 값이에요.",
      "2 만 더한 값입니다.",
      "26 을 넘지 않았으니 처음으로 돌아가지 않아요. 23 + 3 = 26 이라 Z 입니다.",
      "",
    ],
    why: "W 는 23번이고 3 을 더하면 26번, 곧 Z 예요. 이렇게 만든 것이 시저 암호입니다.",
    swap: 2,
    swapWhy: "번호에는 「글자를 번호로 바꾸기」를 쓸 수 없어요. f 의 정의역이 글자라서 f ∘ g 는 만들어지지 않습니다.",
  },
  {
    id: "L6",
    icon: "📦",
    title: "주문 개수 → 상품값 → 배송비 더하기",
    boxes: ["개수", "상품값", "낼 금액"],
    fName: "한 개에 4,500원",
    gName: "배송비 3,000원 더하기",
    input: "4개",
    mid: "18,000원",
    out: "21,000원",
    choices: ["18,000원", "21,000원", "30,000원", "21,500원"],
    answer: 1,
    choiceWhy: [
      "배송비를 더하지 않은 금액이에요.",
      "",
      "개수에 배송비를 먼저 더해 버린 값이에요.",
      "배송비를 3,500원으로 본 값입니다.",
    ],
    why: "4 × 4,500 = 18,000원에 배송비 3,000원을 더해 21,000원입니다.",
    swap: 2,
    swapWhy: "배송비를 개수에 먼저 더할 수는 없어요. g 의 값은 금액이고 f 의 정의역은 개수라서 f ∘ g 는 뜻이 통하지 않습니다.",
  },
  {
    id: "L7",
    icon: "🏦",
    title: "예금 → 10,000원 넣기 → 이자 5%",
    boxes: ["지금 잔액", "입금 뒤", "이자 뒤"],
    fName: "10,000원 넣기",
    gName: "이자 5% 붙이기",
    input: "200,000원",
    mid: "210,000원",
    out: "220,500원",
    choices: ["210,000원", "220,000원", "220,500원", "230,000원"],
    answer: 2,
    choiceWhy: [
      "이자가 아직 붙지 않은 금액이에요.",
      "순서를 바꾼 값이에요. 이자를 먼저 받고 넣으면 220,000원이 됩니다.",
      "",
      "이자를 10% 로 본 값입니다.",
    ],
    why: "210,000원의 5% 인 10,500원이 붙어 220,500원이 돼요.",
    swap: 1,
    swapWhy: "이자를 먼저 받으면 210,000원이고 거기에 10,000원을 넣어 220,000원이에요. 넣은 10,000원에도 이자가 붙느냐로 500원이 갈립니다.",
  },
  {
    id: "L8",
    icon: "🎮",
    title: "점수 → 보너스 100점 → 2배",
    boxes: ["기본 점수", "보너스 뒤", "2배 뒤"],
    fName: "보너스 100점 더하기",
    gName: "점수를 2배로",
    input: "350점",
    mid: "450점",
    out: "900점",
    choices: ["700점", "800점", "450점", "900점"],
    answer: 3,
    choiceWhy: [
      "보너스를 빼고 2배만 한 값이에요.",
      "순서를 바꾼 값이에요. 2배를 먼저 하면 800점이 됩니다.",
      "보너스만 더하고 2배를 빠뜨렸습니다.",
      "",
    ],
    why: "350 + 100 = 450점을 2배 해 900점이 됩니다.",
    swap: 1,
    swapWhy: "2배를 먼저 하면 700점이고 거기에 100점을 더해 800점이에요. 보너스가 2배를 받느냐 아니냐로 100점이 갈립니다.",
  },
];

/** 탭 ④ 첫 사례의 유한집합 대응도 */
export const L1_DIA = {
  xs: ["지훈", "서연", "민재"],
  ys: ["1반", "2반", "3반"],
  zs: ["빨강", "파랑", "노랑"],
  f: [1, 0, 2],
  g: [0, 1, 2],
};
