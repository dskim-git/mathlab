// 선형계획법 — 활동 데이터
//
//  · 제약 조건을 부등식으로 옮겨 영역을 그리고, 그 영역에서 일차식
//        f(x, y) = ax + by
//    의 최댓값(이익)이나 최솟값(비용)을 찾는다.
//    f(x, y) = k 로 놓은 직선을 밀 때 마지막으로 걸리는 자리가 답이고,
//    영역이 볼록한 다각형이면 그 자리는 반드시 꼭짓점이다.
//
//  · 부등식은 ax + by ≤ c 또는 ax + by ≥ c 꼴로 주고 std() 로 y에 대하여 정리한다.
//
//  · 탭 ①② 목공방
//        목재비  5x + 3y ≤ 210,  도색비  2x + 4y ≤ 140,  x ≥ 0,  y ≥ 0
//        꼭짓점 (0,0), (42,0), (30,20), (0,35)
//        이익 8x + 12y → 0, 336, 480, 420  ⇒ 최대 480 at (30, 20)
//
//  · 탭 ③ 사료 배합 (최소화)
//        단백질 20x + 10y ≥ 200,  칼슘 10x + 30y ≥ 300,  x ≥ 0,  y ≥ 0
//        꼭짓점 (0,20), (6,8), (30,0)
//        비용 3x + 4y → 80, 50, 90  ⇒ 최소 50 at (6, 8)
//        영역이 위로 끝없이 뻗으므로 최댓값은 없다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}
export function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}

// ══════════════════════════════════════════════════════════════
//  부등식
// ══════════════════════════════════════════════════════════════
/** 0 : >   1 : ≥   2 : <   3 : ≤ */
export type Op = 0 | 1 | 2 | 3;
export const OP_TEX = [">", "\\ge", "<", "\\le"] as const;
export const OP_SOLID = [false, true, false, true] as const;

export type Ineq = { kind: "line"; a: number; b: number; op: Op } | { kind: "vline"; c: number; op: Op };
export type Pt = [number, number];
export type Box = { xMin: number; xMax: number; yMin: number; yMax: number };

const EPS = 1e-9;

/** ax + by ≤ c (le = true) 또는 ax + by ≥ c 를 y에 대하여 정리한다 */
export function std(a: number, b: number, c: number, le: boolean): Ineq {
  if (b === 0) {
    const isLe = a < 0 ? !le : le;
    return { kind: "vline", c: c / a, op: isLe ? 3 : 1 };
  }
  const isLe = b > 0 ? le : !le;
  return { kind: "line", a: -a / b, b: c / b, op: isLe ? 3 : 1 };
}

export function slack(q: Ineq, x: number, y: number): number {
  const raw = q.kind === "line" ? y - (q.a * x + q.b) : x - q.c;
  return q.op < 2 ? raw : -raw;
}
export function satisfies(q: Ineq, x: number, y: number): boolean {
  const v = slack(q, x, y);
  return OP_SOLID[q.op] ? v >= -EPS : v > EPS;
}
export function satisfiesAll(qs: Ineq[], x: number, y: number): boolean {
  return qs.every((q) => satisfies(q, x, y));
}

export function clipPoly(poly: Pt[], q: Ineq): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i];
    const B = poly[(i + 1) % poly.length];
    const va = slack(q, A[0], A[1]);
    const vb = slack(q, B[0], B[1]);
    if (va >= 0) out.push(A);
    if (va >= 0 !== vb >= 0) {
      const t = va / (va - vb);
      out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
    }
  }
  return out;
}
export function boxPoly(b: Box): Pt[] {
  return [
    [b.xMin, b.yMin],
    [b.xMax, b.yMin],
    [b.xMax, b.yMax],
    [b.xMin, b.yMax],
  ];
}
export function regionPoly(qs: Ineq[], b: Box): Pt[] {
  let poly = boxPoly(b);
  for (const q of qs) poly = clipPoly(poly, q);
  const out: Pt[] = [];
  for (const p of poly) {
    const r: Pt = [Number(p[0].toFixed(6)), Number(p[1].toFixed(6))];
    if (!out.some((z) => Math.abs(z[0] - r[0]) < 1e-6 && Math.abs(z[1] - r[1]) < 1e-6)) out.push(r);
  }
  return out;
}

// ══════════════════════════════════════════════════════════════
//  목적식 f(x, y) = ax + by
// ══════════════════════════════════════════════════════════════
export type Obj = { tex: string; kTex: string; a: number; b: number };
export function objAt(o: { a: number; b: number }, x: number, y: number): number {
  return o.a * x + o.b * y;
}
/** f(x, y) = k 를 그리기 위한 두 끝점 */
export function kLine(o: { a: number; b: number }, k: number, box: Box): { x1: number; y1: number; x2: number; y2: number } {
  if (o.b === 0) return { x1: k / o.a, y1: box.yMin, x2: k / o.a, y2: box.yMax };
  return { x1: box.xMin, y1: (k - o.a * box.xMin) / o.b, x2: box.xMax, y2: (k - o.a * box.xMax) / o.b };
}
export function bestOf(corners: Pt[], o: { a: number; b: number }, wantMax: boolean): { value: number; at: Pt[] } {
  const vals = corners.map((p) => objAt(o, p[0], p[1]));
  const v = wantMax ? Math.max(...vals) : Math.min(...vals);
  return { value: v, at: corners.filter((_, i) => Math.abs(vals[i] - v) < 1e-9) };
}

// ══════════════════════════════════════════════════════════════
//  탭 ①② 목공방
// ══════════════════════════════════════════════════════════════
export const SHOP_BOX: Box = { xMin: -4, xMax: 48, yMin: -4, yMax: 48 };
export const SHOP = {
  x: { emoji: "🪑", name: "스툴", wood: 5, paint: 2 },
  y: { emoji: "🗄️", name: "선반", wood: 3, paint: 4 },
  budget: { wood: 210, paint: 140 },
  price: { x: 8, y: 12 },
};
export const SHOP_IDS = ["wood", "paint", "sign"] as const;
export const SHOP_INEQS: Ineq[] = [
  std(SHOP.x.wood, SHOP.y.wood, SHOP.budget.wood, true),
  std(SHOP.x.paint, SHOP.y.paint, SHOP.budget.paint, true),
  std(1, 0, 0, false),
  std(0, 1, 0, false),
];
export const SHOP_CORNERS: Pt[] = [
  [0, 0],
  [42, 0],
  [30, 20],
  [0, 35],
];
export const SHOP_OBJ: Obj = { tex: "8x + 12y", kTex: "8x + 12y = k", a: 8, b: 12 };
export const SHOP_PRICE_RANGE = { x: { min: 4, max: 16, step: 2 }, y: { min: 4, max: 20, step: 2 } };

export type Choice = { text?: string; tex?: string };
export type SetupStep =
  | { kind: "choice"; id: string; ask: string; options: Choice[]; answer: number; hint: string; explain: string }
  | { kind: "number"; id: string; ask: string; tex?: string; answer: number; suffix: string; hint: string; explain: string };

export const SHOP_STEPS: SetupStep[] = [
  {
    kind: "choice",
    id: "wood",
    ask: "목재비 예산을 나타내는 부등식은?",
    options: [
      { tex: "5x + 3y \\le 210" },
      { tex: "5x + 3y \\ge 210" },
      { tex: "3x + 5y \\le 210" },
      { tex: "5x + 2y \\le 210" },
    ],
    answer: 0,
    hint: "스툴 한 개에 5천원, 선반 한 개에 3천원이 들고 예산은 210천원까지예요.",
    explain: "쓴 돈이 예산을 넘을 수 없으니 5x + 3y ≤ 210 이에요.",
  },
  {
    kind: "choice",
    id: "paint",
    ask: "도색비 예산을 나타내는 부등식은?",
    options: [
      { tex: "2x + 4y \\ge 140" },
      { tex: "2x + 4y \\le 140" },
      { tex: "4x + 2y \\le 140" },
      { tex: "5x + 3y \\le 140" },
    ],
    answer: 1,
    hint: "표에서 스툴의 도색비는 2, 선반의 도색비는 4 예요. x의 계수와 y의 계수를 바꿔 쓰지 않도록 주의!",
    explain: "2x + 4y ≤ 140 이에요. 양변을 2로 나누면 x + 2y ≤ 70 으로 간단해집니다.",
  },
  {
    kind: "choice",
    id: "sign",
    ask: "빠뜨리기 쉬운 조건이 하나 더 있어요. 무엇일까요?",
    options: [
      { tex: "x > 0, \\; y > 0" },
      { tex: "x \\le 0, \\; y \\le 0" },
      { tex: "x \\ge 0, \\; y \\ge 0" },
      { text: "더 필요한 조건은 없다" },
    ],
    answer: 2,
    hint: "만드는 개수가 음수가 될 수 있을까요? 하나도 만들지 않는 것은 될까요?",
    explain: "개수는 음수가 될 수 없고 0개도 될 수 있으니 x ≥ 0, y ≥ 0 이에요. 이 조건이 있어야 영역이 1사분면에 갇힙니다.",
  },
  {
    kind: "number",
    id: "cx",
    ask: "두 경계선이 만나는 꼭짓점의 x좌표(스툴 개수)는?",
    tex: "5x + 3y = 210, \\quad 2x + 4y = 140",
    answer: 30,
    suffix: "개",
    hint: "아래 식을 2로 나누면 x + 2y = 70 이에요. 여기서 x = 70 - 2y 를 위 식에 넣어 보세요.",
    explain: "x = 30 이에요.",
  },
  {
    kind: "number",
    id: "cy",
    ask: "그 꼭짓점의 y좌표(선반 개수)는?",
    tex: "x + 2y = 70",
    answer: 20,
    suffix: "개",
    hint: "x = 30 을 x + 2y = 70 에 넣어 보세요.",
    explain: "y = 20 이에요. 꼭짓점은 (30, 20) 이고 이때 두 예산을 남김없이 씁니다.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ③ 사료 배합 (비용 최소화)
// ══════════════════════════════════════════════════════════════
export const FEED_BOX: Box = { xMin: -4, xMax: 36, yMin: -4, yMax: 36 };
export const FEED = {
  x: { emoji: "🥫", name: "A 사료", protein: 20, calcium: 10, price: 3 },
  y: { emoji: "🥣", name: "B 사료", protein: 10, calcium: 30, price: 4 },
  need: { protein: 200, calcium: 300 },
};
export const FEED_INEQS: Ineq[] = [
  std(FEED.x.protein, FEED.y.protein, FEED.need.protein, false),
  std(FEED.x.calcium, FEED.y.calcium, FEED.need.calcium, false),
  std(1, 0, 0, false),
  std(0, 1, 0, false),
];
export const FEED_TEX = ["20x + 10y \\ge 200", "10x + 30y \\ge 300", "x \\ge 0", "y \\ge 0"];
export const FEED_CORNERS: Pt[] = [
  [0, 20],
  [6, 8],
  [30, 0],
];
export const FEED_OBJ: Obj = { tex: "3x + 4y", kTex: "3x + 4y = k", a: 3, b: 4 };

export const FEED_QUIZ: { id: string; ask: string; options: Choice[]; answer: number; explain: string }[] = [
  {
    id: "fq",
    ask: "이 영역에서 비용의 최댓값도 구할 수 있을까요?",
    options: [
      { text: "구할 수 있다 — 꼭짓점 가운데 가장 큰 값이 최댓값이다" },
      { text: "구할 수 없다 — 영역이 끝없이 뻗어 있어 비용을 얼마든지 크게 만들 수 있다" },
      { text: "구할 수 있다 — 원점에서 가장 먼 꼭짓점이 최댓값이다" },
    ],
    answer: 1,
    explain:
      "사료를 얼마든지 더 살 수 있으니 영역이 오른쪽 위로 끝없이 뻗어 있어요. 비용 직선을 위로 계속 밀 수 있으므로 최댓값은 없습니다. 최솟값만 꼭짓점에서 나와요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 실전 문제
// ══════════════════════════════════════════════════════════════
export type PStep =
  | {
      kind: "number";
      id: string;
      ask: string;
      tex?: string;
      hint: string;
      answer: number;
      suffix: string;
      explain: string;
      tol?: number;
    }
  | { kind: "choice"; id: string; ask: string; tex?: string; hint: string; options: Choice[]; answer: number; explain: string };

export type Drill = {
  id: string;
  emoji: string;
  title: string;
  scenario: string;
  /** 표 — [행 이름, 값1, 값2] */
  tableHead: string[];
  tableRows: { name: string; emoji: string; cells: number[] }[];
  budgetNote: string;
  texList: string[];
  ineqs: Ineq[];
  corners: Pt[];
  obj: Obj;
  objLabel: string;
  wantMax: boolean;
  box: Box;
  steps: PStep[];
  wrapUp: string;
};

export const DRILLS: Drill[] = [
  {
    id: "d1",
    emoji: "🥐",
    title: "베이커리의 하루",
    scenario:
      "어느 베이커리에서 마들렌과 스콘을 한 판씩 굽는 데 드는 밀가루값과 오븐 사용료가 표와 같다. 한 판을 팔아 얻는 이익은 마들렌 5천원, 스콘 6천원이고 구운 것은 모두 팔린다고 하자.",
    tableHead: ["(단위: 천원)", "밀가루값", "오븐 사용료"],
    tableRows: [
      { name: "마들렌 1판", emoji: "🧁", cells: [3, 4] },
      { name: "스콘 1판", emoji: "🥐", cells: [6, 2] },
    ],
    budgetNote: "밀가루값 180천원, 오븐 사용료 120천원까지 쓸 수 있어요.",
    texList: ["3x + 6y \\le 180", "4x + 2y \\le 120", "x \\ge 0", "y \\ge 0"],
    ineqs: [std(3, 6, 180, true), std(4, 2, 120, true), std(1, 0, 0, false), std(0, 1, 0, false)],
    corners: [
      [0, 0],
      [30, 0],
      [20, 20],
      [0, 30],
    ],
    obj: { tex: "5x + 6y", kTex: "5x + 6y = k", a: 5, b: 6 },
    objLabel: "이익",
    wantMax: true,
    box: { xMin: -3, xMax: 36, yMin: -3, yMax: 36 },
    steps: [
      {
        kind: "choice",
        id: "d1s1",
        ask: "밀가루값 예산을 나타내는 부등식은?",
        hint: "마들렌 한 판에 3천원, 스콘 한 판에 6천원이 들어요.",
        options: [{ tex: "3x + 6y \\le 180" }, { tex: "6x + 3y \\le 180" }, { tex: "3x + 6y \\ge 180" }, { tex: "3x + 4y \\le 180" }],
        answer: 0,
        explain: "3x + 6y ≤ 180 이고, 3으로 나누면 x + 2y ≤ 60 으로 간단해져요.",
      },
      {
        kind: "number",
        id: "d1s2",
        ask: "두 경계선이 만나는 꼭짓점의 x좌표(마들렌 판 수)는?",
        tex: "x + 2y = 60, \\quad 2x + y = 60",
        hint: "두 식을 연립해 풀어 보세요. 위 식에 2를 곱하면 x를 맞출 수 있어요.",
        answer: 20,
        suffix: "판",
        explain: "x = 20, y = 20 이에요. 두 예산을 남김없이 쓰는 계획입니다.",
      },
      {
        kind: "number",
        id: "d1s3",
        ask: "네 꼭짓점을 모두 살펴볼 때 얻을 수 있는 최대 이익은?",
        tex: "5x + 6y",
        hint: "(0,0), (30,0), (20,20), (0,30) 네 곳의 값을 각각 구해 보세요.",
        answer: 220,
        suffix: "천원",
        explain: "차례대로 0 · 150 · 220 · 180 천원이므로 최대는 220천원(22만원)이에요.",
      },
    ],
    wrapUp:
      "두 예산을 남김없이 쓰는 (20, 20) 에서 이익이 가장 커요. 마들렌과 스콘을 20판씩 구우면 됩니다.",
  },
  {
    id: "d2",
    emoji: "🌱",
    title: "텃밭의 비료 배합",
    scenario:
      "텃밭에 질소 30kg 이상, 인 20kg 이상을 주어야 한다. A 비료와 B 비료 한 포대에 들어 있는 양과 값이 표와 같을 때 비료값을 가장 적게 들이는 방법을 찾아보자.",
    tableHead: ["한 포대에", "질소(kg)", "인(kg)"],
    tableRows: [
      { name: "A 비료", emoji: "🟩", cells: [3, 1] },
      { name: "B 비료", emoji: "🟦", cells: [1, 2] },
    ],
    budgetNote: "A 비료는 한 포대 5천원, B 비료는 4천원이에요. 질소는 30kg 이상, 인은 20kg 이상 필요합니다.",
    texList: ["3x + y \\ge 30", "x + 2y \\ge 20", "x \\ge 0", "y \\ge 0"],
    ineqs: [std(3, 1, 30, false), std(1, 2, 20, false), std(1, 0, 0, false), std(0, 1, 0, false)],
    corners: [
      [0, 30],
      [8, 6],
      [20, 0],
    ],
    obj: { tex: "5x + 4y", kTex: "5x + 4y = k", a: 5, b: 4 },
    objLabel: "비용",
    wantMax: false,
    box: { xMin: -3, xMax: 36, yMin: -3, yMax: 36 },
    steps: [
      {
        kind: "choice",
        id: "d2s1",
        ask: "질소가 30kg 이상이어야 한다는 조건을 나타내는 부등식은?",
        hint: "A 비료 한 포대에 질소 3kg, B 비료 한 포대에 1kg 이 들어 있어요. '이상'이라는 말에 주의하세요.",
        options: [{ tex: "3x + y \\le 30" }, { tex: "x + 3y \\ge 30" }, { tex: "3x + y \\ge 30" }, { tex: "3x + 2y \\ge 30" }],
        answer: 2,
        explain: "모자라면 안 되므로 3x + y ≥ 30 이에요. 이번에는 부등호의 방향이 반대라는 점이 앞 문제와 다릅니다.",
      },
      {
        kind: "number",
        id: "d2s2",
        ask: "두 경계선이 만나는 꼭짓점의 x좌표(A 비료 포대 수)는?",
        tex: "3x + y = 30, \\quad x + 2y = 20",
        hint: "위 식에서 y = 30 - 3x 를 아래 식에 넣어 보세요.",
        answer: 8,
        suffix: "포대",
        explain: "x = 8, y = 6 이에요.",
      },
      {
        kind: "number",
        id: "d2s3",
        ask: "세 꼭짓점을 모두 살펴볼 때 가장 적게 드는 비료값은?",
        tex: "5x + 4y",
        hint: "(0,30), (8,6), (20,0) 세 곳의 값을 각각 구해 보세요.",
        answer: 64,
        suffix: "천원",
        explain: "차례대로 120 · 64 · 100 천원이므로 최소는 64천원이에요. A 비료 8포대와 B 비료 6포대를 사면 됩니다.",
      },
    ],
    wrapUp:
      "'이상' 조건이라 영역이 오른쪽 위로 끝없이 뻗지만, 비용의 최솟값은 여전히 꼭짓점에서 나와요. 대신 최댓값은 없습니다.",
  },
  {
    id: "d3",
    emoji: "🎨",
    title: "동아리 굿즈 만들기",
    scenario:
      "동아리에서 스티커와 뱃지를 만들어 팔려고 한다. 한 묶음(개)을 만드는 데 드는 재료비와 인쇄비가 표와 같고, 팔아서 얻는 이익은 스티커 한 묶음 3천원, 뱃지 하나 4천원이다.",
    tableHead: ["(단위: 천원)", "재료비", "인쇄비"],
    tableRows: [
      { name: "스티커 1묶음", emoji: "🌟", cells: [1, 2] },
      { name: "뱃지 1개", emoji: "🎖️", cells: [3, 3] },
    ],
    budgetNote: "재료비 60천원, 인쇄비 90천원까지 쓸 수 있어요.",
    texList: ["x + 3y \\le 60", "2x + 3y \\le 90", "x \\ge 0", "y \\ge 0"],
    ineqs: [std(1, 3, 60, true), std(2, 3, 90, true), std(1, 0, 0, false), std(0, 1, 0, false)],
    corners: [
      [0, 0],
      [45, 0],
      [30, 10],
      [0, 20],
    ],
    obj: { tex: "3x + 4y", kTex: "3x + 4y = k", a: 3, b: 4 },
    objLabel: "이익",
    wantMax: true,
    box: { xMin: -4, xMax: 48, yMin: -4, yMax: 48 },
    steps: [
      {
        kind: "number",
        id: "d3s1",
        ask: "두 경계선이 만나는 꼭짓점의 x좌표(스티커 묶음 수)는?",
        tex: "x + 3y = 60, \\quad 2x + 3y = 90",
        hint: "아래 식에서 위 식을 빼면 y가 한 번에 사라져요.",
        answer: 30,
        suffix: "묶음",
        explain: "빼면 x = 30 이고, 넣어 보면 y = 10 이에요. 꼭짓점은 (30, 10) 입니다.",
      },
      {
        kind: "number",
        id: "d3s2",
        ask: "그 꼭짓점 (30, 10) 에서의 이익은?",
        tex: "3 \\times 30 + 4 \\times 10",
        hint: "90 + 40",
        answer: 130,
        suffix: "천원",
        explain: "130천원이에요. 그런데 이것이 정말 가장 큰 값일까요?",
      },
      {
        kind: "number",
        id: "d3s3",
        ask: "네 꼭짓점 (0,0) · (45,0) · (30,10) · (0,20) 을 모두 살펴볼 때 최대 이익은?",
        tex: "3x + 4y",
        hint: "(45, 0) 도 꼭짓점이에요. 거기서의 값도 구해 보세요.",
        answer: 135,
        suffix: "천원",
        explain: "차례대로 0 · 135 · 130 · 80 천원이므로 최대는 135천원! 두 경계가 만나는 교점이 아니라 가로축 위의 꼭짓점에서 나왔어요.",
      },
      {
        kind: "choice",
        id: "d3s4",
        ask: "이 문제에서 알 수 있는 것은?",
        hint: "이익 직선의 기울기와 경계선의 기울기를 견주어 보세요.",
        options: [
          { text: "최댓값은 늘 두 경계선이 만나는 교점에서 나온다" },
          { text: "최댓값은 꼭짓점에서 나오지만, 그 꼭짓점이 교점이 아닐 수도 있다" },
          { text: "최댓값은 영역의 한가운데에서 나온다" },
          { text: "꼭짓점을 하나만 확인해도 충분하다" },
        ],
        answer: 1,
        explain:
          "답은 늘 꼭짓점에서 나오지만 어느 꼭짓점인지는 일차식의 기울기에 달려 있어요. 그래서 꼭짓점을 하나도 빠뜨리지 않고 모두 확인해야 합니다.",
      },
    ],
    wrapUp:
      "교점만 보고 답하면 틀리는 문제였어요. 축 위의 꼭짓점도 빠뜨리지 말고 모두 확인하는 습관을 들여요.",
  },
];
