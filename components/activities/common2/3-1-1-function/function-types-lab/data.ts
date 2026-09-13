// 함수의 그래프와 여러 가지 함수 — 활동 데이터
//
//  [함수의 그래프] 함수 f : X → Y 에 대하여
//        G = { (x, f(x)) | x ∈ X }
//        곧 정의역의 원소 x 와 그에 대응되는 함숫값 f(x) 의 순서쌍 전체의 집합이 f 의 그래프다.
//        그래프는 본디 「집합」이고, 좌표평면에 점을 찍어 나타낸 그림은 그 집합의 기하학적 표현이다.
//        정의역이 유한집합이면 그래프는 유한개의 점으로, 정의역이 실수의 구간이면 곡선이나 직선으로 나타난다.
//
//  [세로선 판정] 정의역의 각 원소 a 에 대하여 함수의 그래프는 y축에 평행한 직선 x = a 와 오직 한 점에서 만난다.
//        두 점에서 만나면 f(a) = b, f(a) = c (b ≠ c) 가 되어 「짝은 오직 하나」라는 함수의 조건이 무너진다.
//        반대로 x = a 와 한 점도 만나지 않으면 a 가 짝을 찾지 못한 것이다.
//
//  [일대일함수] 정의역의 임의의 두 원소 x₁, x₂ 에 대하여
//        x₁ ≠ x₂  ⇒  f(x₁) ≠ f(x₂)      (대우를 써서 f(x₁) = f(x₂) ⇒ x₁ = x₂ 로 보여도 된다)
//        거꾸로 쓴 x₁ = x₂ ⇒ f(x₁) = f(x₂) 는 일대일함수가 아니라 그냥 「함수」의 정의임에 주의한다.
//  [일대일대응] 일대일함수이면서 치역과 공역이 같은 함수. 곧 f(X) = Y.
//        대응 ⊃ 함수 ⊃ 일대일함수 ⊃ 일대일대응 의 차례로 조건이 하나씩 더 붙는다.
//        정의역의 원소가 공역의 원소보다 많으면 일대일함수가 될 수 없고,
//        적으면 일대일함수는 되어도 일대일대응은 될 수 없다.
//
//  [가로선 판정] x축에 평행한 모든 직선이 그래프와 최대 한 점에서 만나면 일대일함수다.
//        y = b 와 두 점에서 만나면 x₁ ≠ x₂ 인데 f(x₁) = b = f(x₂) 가 되어 조건이 무너진다.
//        (공역은 그림에 나타나지 않으므로 그래프만으로는 일대일대응인지까지는 알 수 없다.)
//
//  [항등함수] f : X → X 에서 모든 x ∈ X 에 대하여 f(x) = x 인 함수. 정의역 X 마다 오직 하나뿐이다.
//        항등함수는 언제나 일대일대응이다. 정의역과 공역이 같아야 하므로 그 둘이 다르면 아무리 f(x) = x 라도 항등함수가 아니다.
//  [상수함수] f : X → Y 에서 모든 x ∈ X 에 대하여 f(x) = c 인 함수. 치역의 원소가 오직 하나다.
//        정의역의 원소가 둘 이상이면 상수함수는 일대일함수가 아니다.
//        정의역의 원소가 하나뿐이면 그 함수는 상수함수이면서 동시에 항등함수일 수도 있다.

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

export type Edge = [number, number];
export type Pt = [number, number];

// ══════════════════════════════════════════════════════════════
// 화살표 대응도 — 공용 좌표
// ══════════════════════════════════════════════════════════════
export const DG = {
  w: 340,
  rowH: 38,
  cxX: 88,
  cxY: 252,
  rx: 56,
  headH: 42,
  pad: 30,
  botPad: 16,
  inset: 34,
};

export function dgGeom(nx: number, ny: number) {
  const maxN = Math.max(nx, ny);
  const ryMax = ((maxN - 1) * DG.rowH) / 2 + DG.pad;
  const cy = DG.headH + ryMax;
  return {
    cy,
    h: cy + ryMax + DG.botPad,
    ryX: ((nx - 1) * DG.rowH) / 2 + DG.pad,
    ryY: ((ny - 1) * DG.rowH) / 2 + DG.pad,
  };
}

export function dgRowY(i: number, n: number, cy: number): number {
  return cy + (i - (n - 1) / 2) * DG.rowH;
}

// ── 대응 판정 헬퍼 ────────────────────────────────────────────
export function outDeg(edges: Edge[], nx: number): number[] {
  const d = Array.from({ length: nx }, () => 0);
  for (const [a] of edges) d[a] += 1;
  return d;
}

export function imageIdx(edges: Edge[]): number[] {
  const s = new Set<number>();
  for (const [, b] of edges) s.add(b);
  return [...s].sort((p, q) => p - q);
}

export function isFunction(edges: Edge[], nx: number): boolean {
  return outDeg(edges, nx).every((d) => d === 1);
}

/** 함수일 때 x 첨자마다 대응되는 y 첨자 */
export function fMap(edges: Edge[], nx: number): number[] | null {
  if (!isFunction(edges, nx)) return null;
  const m = Array.from({ length: nx }, () => -1);
  for (const [a, b] of edges) m[a] = b;
  return m;
}

export function isInjective(edges: Edge[], nx: number): boolean {
  const m = fMap(edges, nx);
  if (!m) return false;
  return new Set(m).size === m.length;
}

export function isOnto(edges: Edge[], nx: number, ny: number): boolean {
  return fMap(edges, nx) !== null && imageIdx(edges).length === ny;
}

export function isBijection(edges: Edge[], nx: number, ny: number): boolean {
  return isInjective(edges, nx) && isOnto(edges, nx, ny);
}

export function isConstant(edges: Edge[], nx: number): boolean {
  return fMap(edges, nx) !== null && imageIdx(edges).length === 1;
}

/** 항등함수 — 공역이 정의역과 같은 집합이고 모든 x 가 자기 자신으로 간다 */
export function isIdentity(edges: Edge[], xs: string[], ys: string[]): boolean {
  if (xs.length !== ys.length || xs.some((s, i) => s !== ys[i])) return false;
  const m = fMap(edges, xs.length);
  return m !== null && m.every((v, i) => v === i);
}

/** 대응이 함수가 아닐 때 어긴 조건 — 0: 빠진 원소, 1: 짝이 둘 이상, 2: 둘 다 */
export function failKind(edges: Edge[], nx: number): 0 | 1 | 2 | null {
  const d = outDeg(edges, nx);
  const miss = d.some((v) => v === 0);
  const many = d.some((v) => v >= 2);
  if (miss && many) return 2;
  if (miss) return 0;
  if (many) return 1;
  return null;
}

// ══════════════════════════════════════════════════════════════
// 좌표평면 — 공용 좌표
// ══════════════════════════════════════════════════════════════
export const PV = { size: 296, min: -5, max: 5, pad: 18 };

export function pvX(v: number): number {
  return PV.pad + ((v - PV.min) / (PV.max - PV.min)) * (PV.size - 2 * PV.pad);
}
export function pvY(v: number): number {
  return PV.pad + ((PV.max - v) / (PV.max - PV.min)) * (PV.size - 2 * PV.pad);
}

export const PV_TICKS = [-4, -3, -2, -1, 1, 2, 3, 4];

/** 곡선 한 가지 — 정의역 밖이나 값이 없는 자리는 null 을 돌려준다 */
export type Branch = { fn: (x: number) => number | null; dom: [number, number] };

const inWin = (y: number) => y >= PV.min && y <= PV.max;

/**
 * 한 가지를 창 안의 꺾은선 조각들로 바꾼다.
 * 창을 벗어나는 자리는 이분법으로 테두리까지만 이어 붙이므로 좌표가 언제나 그림 상자 안에 들어온다.
 */
export function traceBranch(br: Branch): Pt[][] {
  const N = 900;
  const lo = Math.max(br.dom[0], PV.min);
  const hi = Math.min(br.dom[1], PV.max);
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  let px: number | null = null;
  let py: number | null = null;

  const edgePoint = (xIn: number, xOut: number): Pt => {
    let a = xIn;
    let b = xOut;
    for (let k = 0; k < 40; k++) {
      const m = (a + b) / 2;
      const ym = br.fn(m);
      if (ym === null || !Number.isFinite(ym) || !inWin(ym)) b = m;
      else a = m;
    }
    const ya = br.fn(a);
    const y = ya === null || !Number.isFinite(ya) ? PV.min : Math.max(PV.min, Math.min(PV.max, ya));
    return [a, y];
  };

  const flush = () => {
    if (cur.length > 1) out.push(cur);
    cur = [];
  };

  for (let i = 0; i <= N; i++) {
    const x = lo + ((hi - lo) * i) / N;
    const yr = br.fn(x);
    const y = yr === null || !Number.isFinite(yr) ? null : yr;
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

const EPS = 1e-9;

/** 서로 가까운 값은 하나로 본다 */
function dedup(vs: number[]): number[] {
  const out: number[] = [];
  for (const v of [...vs].sort((a, b) => a - b)) {
    if (out.length === 0 || Math.abs(out[out.length - 1] - v) > 1e-6) out.push(v);
  }
  return out;
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 함수의 그래프
// ══════════════════════════════════════════════════════════════
// ── 순서쌍으로 그래프 만들기 ──────────────────────────────────
export const GRID_X = [1, 2, 3];
export const GRID_Y = [1, 2, 3, 4];
export const GV = { size: 250, x0: -0.6, x1: 4.2, y0: -0.6, y1: 5.0, pad: 16 };

export function gvX(v: number): number {
  return GV.pad + ((v - GV.x0) / (GV.x1 - GV.x0)) * (GV.size - 2 * GV.pad);
}
export function gvY(v: number): number {
  return GV.pad + ((GV.y1 - v) / (GV.y1 - GV.y0)) * (GV.size - 2 * GV.pad);
}

export const GRAPH_GOALS = [
  "함수의 그래프를 하나 만들어 보기",
  "한 x 위에 점을 둘 찍어 보기",
  "어떤 x 위에 점을 하나도 찍지 않아 보기",
];

// ── 세로선 판정 ──────────────────────────────────────────────
export type Shape = {
  id: string;
  label: Piece[];
  /** 그림이 어디까지 그려져 있는지 — 정의역을 밝혀 주어야 판정이 또렷해진다 */
  note: Piece[];
  branches: Branch[];
  /** 정의역이 거기서 끝남을 알리는 끝점 (상자 안에서 그림이 끝나는 자리) */
  ends?: Pt[];
  dots?: Pt[];
  /** y축에 평행한 직선 그 자체일 때 그 x 값 */
  vertical?: number;
  isFunc: boolean;
  why: string;
  hint: string;
};

/** 세로선 x = a 와 만나는 점의 y 값들. 무수히 많으면 "many" */
export function cutV(s: Shape, a: number): number[] | "many" {
  if (s.vertical !== undefined) return Math.abs(a - s.vertical) < 1e-6 ? "many" : [];
  const ys: number[] = [];
  for (const br of s.branches) {
    if (a < br.dom[0] - EPS || a > br.dom[1] + EPS) continue;
    const y = br.fn(a);
    if (y !== null && Number.isFinite(y) && inWin(y)) ys.push(y);
  }
  for (const [dx, dy] of s.dots ?? []) if (Math.abs(dx - a) < 1e-6) ys.push(dy);
  return dedup(ys);
}

const sq = (x: number) => x * x;

export const SHAPES: Shape[] = [
  {
    id: "v1",
    label: [{ tex: "y = x^2 - 2" }],
    note: [{ pre: "모든 실수 " }, { tex: "x" }, { pre: " 에서 그려진다. 위쪽은 상자 밖으로 이어진다." }],
    branches: [{ fn: (x) => sq(x) - 2, dom: [-5, 5] }],
    isFunc: true,
    why: "어느 자리에 세로선을 놓아도 딱 한 점에서 만나요. 위로 열린 포물선은 함수의 그래프입니다.",
    hint: "세로선을 이리저리 옮겨 보아도 만나는 점이 늘 하나인지 살펴보세요.",
  },
  {
    id: "v2",
    label: [{ tex: "x = y^2" }],
    note: [{ pre: "모든 실수 " }, { tex: "y" }, { pre: " 에서 그려진다. 오른쪽은 상자 밖으로 이어진다." }],
    branches: [
      { fn: (x) => (x < 0 ? null : Math.sqrt(x)), dom: [0, 5] },
      { fn: (x) => (x < 0 ? null : -Math.sqrt(x)), dom: [0, 5] },
    ],
    isFunc: false,
    why: "x = 1 에 세로선을 놓으면 y = 1 과 y = -1 두 점에서 만나요. 하나의 x 에 두 개의 y 가 붙으니 함수가 아닙니다.",
    hint: "세로선을 0 보다 오른쪽으로 옮겨 보세요. 위아래로 두 점이 잡힙니다.",
  },
  {
    id: "v3",
    label: [{ tex: "|x| + |y| = 3" }],
    note: [{ pre: "닫힌 도형이라 이 그림이 전부다." }],
    branches: [
      { fn: (x) => (Math.abs(x) > 3 ? null : 3 - Math.abs(x)), dom: [-3, 3] },
      { fn: (x) => (Math.abs(x) > 3 ? null : Math.abs(x) - 3), dom: [-3, 3] },
    ],
    isFunc: false,
    why: "마름모의 위쪽 변과 아래쪽 변이 같은 x 를 나누어 가져요. x = 0 에서는 y = 3 과 y = -3 두 점에서 만납니다.",
    hint: "-3 과 3 사이에 세로선을 놓아 보세요.",
  },
  {
    id: "v4",
    label: [{ tex: "y = x^3 - 3x" }],
    note: [{ pre: "모든 실수 " }, { tex: "x" }, { pre: " 에서 그려진다. 위아래는 상자 밖으로 이어진다." }],
    branches: [{ fn: (x) => x ** 3 - 3 * x, dom: [-5, 5] }],
    isFunc: true,
    why: "구불구불해도 세로선과는 늘 한 점에서 만나요. 굽이가 몇 개든 세로선 판정과는 관계가 없습니다.",
    hint: "굽이진 자리에 세로선을 놓아도 점이 하나뿐인지 보세요.",
  },
  {
    id: "v5",
    label: [{ tex: "x = 2" }],
    note: [{ pre: "위아래로 끝없이 이어지는 직선이다." }],
    branches: [],
    vertical: 2,
    isFunc: false,
    why: "세로선을 x = 2 에 포개면 그래프 전체와 겹쳐 무수히 많은 점에서 만나요. x = 2 하나에 모든 y 가 붙은 셈입니다.",
    hint: "세로선을 2 에 정확히 맞춰 보세요.",
  },
  {
    id: "v6",
    label: [{ pre: "네 점 " }, { tex: "(-2,\\,1),\\ (0,\\,3),\\ (1,\\,-1),\\ (3,\\,2)" }],
    note: [{ pre: "이 네 점이 전부다. " }, { tex: "x" }, { pre: " 가 놓인 자리는 " }, { tex: "-2,\\ 0,\\ 1,\\ 3" }, { pre: " 뿐이다." }],
    branches: [],
    dots: [
      [-2, 1],
      [0, 3],
      [1, -1],
      [3, 2],
    ],
    isFunc: true,
    why: "정의역이 유한집합이면 그래프는 이렇게 유한개의 점이 돼요. 네 점의 x 가 모두 달라 세로선과 한 점씩만 만납니다.",
    hint: "점이 놓인 x 자리마다 세로선을 세워 보세요.",
  },
  {
    id: "v7",
    label: [{ pre: "네 점 " }, { tex: "(-1,\\,2),\\ (1,\\,1),\\ (1,\\,3),\\ (2,\\,-2)" }],
    note: [{ pre: "이 네 점이 전부다. " }, { tex: "x" }, { pre: " 가 놓인 자리는 " }, { tex: "-1,\\ 1,\\ 2" }, { pre: " 뿐이다." }],
    branches: [],
    dots: [
      [-1, 2],
      [1, 1],
      [1, 3],
      [2, -2],
    ],
    isFunc: false,
    why: "x = 1 위에 점이 둘 있어요. 점이 단 두 개만 겹쳐도 함수의 그래프가 되지 못합니다.",
    hint: "세로선을 1 에 맞춰 보세요.",
  },
  {
    id: "v8",
    label: [{ tex: "y = \\sqrt{4-x^2}" }],
    note: [{ tex: "-2 \\le x \\le 2" }, { pre: " 에서만 그려진다. 양 끝의 점이 그 끝이다." }],
    branches: [{ fn: (x) => (Math.abs(x) > 2 ? null : Math.sqrt(4 - sq(x))), dom: [-2, 2] }],
    ends: [
      [-2, 0],
      [2, 0],
    ],
    isFunc: true,
    why: "위쪽 반원만 있으니 세로선과 한 점에서만 만나요. 정의역은 그림이 놓인 -2 이상 2 이하이고, 그 밖에서는 아예 만나지 않습니다.",
    hint: "-2 와 2 사이에 세로선을 놓아 보세요.",
  },
  {
    id: "v9",
    label: [{ tex: "y = \\dfrac{1}{x}" }],
    note: [{ tex: "x \\ne 0" }, { pre: " 인 모든 실수에서 그려진다. 네 방향 모두 상자 밖으로 이어진다." }],
    branches: [{ fn: (x) => (Math.abs(x) < 1e-7 ? null : 1 / x), dom: [-5, 5] }],
    isFunc: true,
    why: "가운데가 끊겨 있어도 세로선과 두 점에서 만나는 일은 없어요. x = 0 에서는 아예 만나지 않는데, 그 자리는 정의역에서 빠져 있기 때문입니다.",
    hint: "0 에 세로선을 놓으면 어떻게 되는지도 살펴보세요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 일대일함수와 일대일대응
// ══════════════════════════════════════════════════════════════
export const ONE_X = ["1", "2", "3"];
export const ONE_Y3 = ["a", "b", "c"];
export const ONE_Y4 = ["a", "b", "c", "d"];

export const ONE_GOALS = [
  "함수이지만 일대일함수는 아니게 만들기",
  "일대일함수이지만 일대일대응은 아니게 만들기",
  "일대일대응 만들기",
];

/** 포함 관계 — 안으로 들어갈수록 조건이 하나씩 더 붙는다 */
export const NEST = [
  { id: "corr", name: "대응", color: "#94a3b8" },
  { id: "func", name: "함수", color: "#34d399" },
  { id: "inj", name: "일대일함수", color: "#fbbf24" },
  { id: "bij", name: "일대일대응", color: "#f472b6" },
];

// ── 가로선 판정 ──────────────────────────────────────────────
export type HShape = {
  id: string;
  label: Piece[];
  /** 정의역을 말로 밝혀 둔다 — 그래프만으로는 어디까지가 정의역인지 알 수 없기 때문이다 */
  note: Piece[];
  branches: Branch[];
  ends?: Pt[];
  dots?: Pt[];
  one2one: boolean;
  why: string;
  hint: string;
};

/** 가로선 y = b 와 만나는 점의 x 값들. 무수히 많으면 "many" */
export function cutH(s: HShape, b: number): number[] | "many" {
  const xs: number[] = [];
  for (const br of s.branches) {
    const lo = Math.max(br.dom[0], PV.min);
    const hi = Math.min(br.dom[1], PV.max);
    const N = 2000;
    let flat = 0;
    let prevX: number | null = null;
    let prevG: number | null = null;
    for (let i = 0; i <= N; i++) {
      const x = lo + ((hi - lo) * i) / N;
      const y = br.fn(x);
      if (y === null || !Number.isFinite(y)) {
        prevX = null;
        prevG = null;
        continue;
      }
      const g = y - b;
      if (Math.abs(g) < 1e-9) flat += 1;
      if (prevX !== null && prevG !== null) {
        if (prevG === 0) xs.push(prevX);
        else if (prevG * g < 0) {
          let lo2 = prevX;
          let hi2 = x;
          for (let k = 0; k < 50; k++) {
            const m = (lo2 + hi2) / 2;
            const ym = br.fn(m);
            if (ym === null || !Number.isFinite(ym)) break;
            if ((ym - b) * prevG > 0) lo2 = m;
            else hi2 = m;
          }
          xs.push((lo2 + hi2) / 2);
        }
      }
      prevX = x;
      prevG = g;
    }
    if (flat > N / 20) return "many";
    if (prevG !== null && Math.abs(prevG) < 1e-9 && prevX !== null) xs.push(prevX);
  }
  for (const [dx, dy] of s.dots ?? []) if (Math.abs(dy - b) < 1e-6) xs.push(dx);
  return dedup(xs.filter((x) => x >= PV.min - EPS && x <= PV.max + EPS));
}

export const HSHAPES: HShape[] = [
  {
    id: "h1",
    label: [{ tex: "y = 2x - 1" }],
    note: [{ pre: "정의역은 실수 전체 — 그림은 상자 밖으로도 이어진다" }],
    branches: [{ fn: (x) => 2 * x - 1, dom: [-5, 5] }],
    one2one: true,
    why: "쭉 올라가기만 하는 직선은 같은 높이를 두 번 지나지 않아요. 가로선과 늘 한 점에서만 만납니다.",
    hint: "가로선을 위아래로 끝까지 옮겨 보아도 점이 하나인지 보세요.",
  },
  {
    id: "h2",
    label: [{ tex: "y = x^2 - 2x" }],
    note: [{ pre: "정의역은 실수 전체 — 그림은 상자 밖으로도 이어진다" }],
    branches: [{ fn: (x) => sq(x) - 2 * x, dom: [-5, 5] }],
    one2one: false,
    why: "y = 0 에 가로선을 놓으면 x = 0 과 x = 2 두 점에서 만나요. 서로 다른 두 x 의 함숫값이 같으니 일대일함수가 아닙니다.",
    hint: "가로선을 꼭짓점보다 위쪽에 놓아 보세요.",
  },
  {
    id: "h3",
    label: [{ tex: "y = x^3" }],
    note: [{ pre: "정의역은 실수 전체 — 그림은 상자 밖으로도 이어진다" }],
    branches: [{ fn: (x) => x ** 3, dom: [-5, 5] }],
    one2one: true,
    why: "계속 올라가기만 하므로 같은 높이를 두 번 지나지 않아요. 삼차식이라고 모두 일대일함수가 아닌 것은 아닙니다.",
    hint: "가로선을 어디에 놓아도 점이 하나인지 보세요.",
  },
  {
    id: "h4",
    label: [{ tex: "y = x^3 - 3x" }],
    note: [{ pre: "정의역은 실수 전체 — 그림은 상자 밖으로도 이어진다" }],
    branches: [{ fn: (x) => x ** 3 - 3 * x, dom: [-5, 5] }],
    one2one: false,
    why: "y = 0 에 가로선을 놓으면 세 점에서 만나요. 올라갔다 내려갔다 하면 같은 높이를 여러 번 지나게 됩니다.",
    hint: "가로선을 -2 와 2 사이, 특히 0 근처에 놓아 보세요.",
  },
  {
    id: "h5",
    label: [{ tex: "y = 3" }],
    note: [{ pre: "정의역은 실수 전체 — 그림은 상자 밖으로도 이어진다" }],
    branches: [{ fn: () => 3, dom: [-5, 5] }],
    one2one: false,
    why: "가로선을 y = 3 에 포개면 그래프와 통째로 겹쳐요. 상수함수는 정의역의 원소가 둘 이상이면 결코 일대일함수가 될 수 없습니다.",
    hint: "가로선을 3 에 정확히 맞춰 보세요.",
  },
  {
    id: "h6",
    label: [{ tex: "y = \\dfrac{1}{x}" }],
    note: [{ pre: "정의역은 " }, { tex: "x \\ne 0" }, { pre: " 인 실수 전체 — 그림은 상자 밖으로도 이어진다" }],
    branches: [{ fn: (x) => (Math.abs(x) < 1e-7 ? null : 1 / x), dom: [-5, 5] }],
    one2one: true,
    why: "두 조각으로 나뉘어 있지만 한쪽은 모두 양수, 다른 쪽은 모두 음수라 높이가 겹치지 않아요. y = 0 에서는 아예 만나지 않습니다.",
    hint: "가로선을 0 위쪽과 아래쪽에 각각 놓아 보세요.",
  },
  {
    id: "h7",
    label: [{ pre: "세 점 " }, { tex: "(1,\\,2),\\ (2,\\,4),\\ (3,\\,1)" }],
    note: [{ pre: "정의역은 " }, { tex: "\\{1,\\ 2,\\ 3\\}" }, { pre: " — 이 세 점이 전부다" }],
    branches: [],
    dots: [
      [1, 2],
      [2, 4],
      [3, 1],
    ],
    one2one: true,
    why: "세 점의 y 가 모두 달라요. 유한개의 점일 때는 높이가 같은 점이 있는지만 살피면 됩니다.",
    hint: "점이 놓인 높이마다 가로선을 맞춰 보세요.",
  },
  {
    id: "h8",
    label: [{ pre: "세 점 " }, { tex: "(-1,\\,3),\\ (1,\\,2),\\ (3,\\,3)" }],
    note: [{ pre: "정의역은 " }, { tex: "\\{-1,\\ 1,\\ 3\\}" }, { pre: " — 이 세 점이 전부다" }],
    branches: [],
    dots: [
      [-1, 3],
      [1, 2],
      [3, 3],
    ],
    one2one: false,
    why: "y = 3 인 점이 둘이에요. f(-1) = f(3) = 3 인데 -1 과 3 은 다른 수이니 일대일함수가 아닙니다.",
    hint: "가로선을 3 에 맞춰 보세요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 항등함수와 상수함수
// ══════════════════════════════════════════════════════════════
export const IC_X = ["1", "2", "3", "4"];
export const IC_Y_SAME = ["1", "2", "3", "4"];
export const IC_Y_OTHER = ["5", "6", "7", "8"];

export const IC_GOALS = ["항등함수 만들기", "상수함수 만들기", "둘 다 아닌 함수 만들기"];

export const IC_CHOICES = ["항등함수", "상수함수", "항등함수이면서 상수함수", "둘 다 아니다"];

export type IcTask = {
  id: string;
  domain: number[];
  domainTex: string;
  codoTex: string;
  /** 공역이 정의역과 같은 집합인가 */
  codoSame: boolean;
  ruleTex: string;
  fn: (x: number) => number;
  answer: 0 | 1 | 2 | 3;
  why: string;
};

export const IC_TASKS: IcTask[] = [
  {
    id: "c1",
    domain: [1, 2, 3],
    domainTex: "\\{1,\\ 2,\\ 3\\}",
    codoTex: "\\{1,\\ 2,\\ 3\\}",
    codoSame: true,
    ruleTex: "f(x)=x",
    fn: (x) => x,
    answer: 0,
    why: "정의역과 공역이 같고 모든 원소가 자기 자신으로 가요. 항등함수의 가장 기본이 되는 꼴입니다.",
  },
  {
    id: "c2",
    domain: [1, 2, 3],
    domainTex: "\\{1,\\ 2,\\ 3\\}",
    codoTex: "\\{1,\\ 2,\\ 3,\\ 4,\\ 5\\}",
    codoSame: false,
    ruleTex: "f(x)=4",
    fn: () => 4,
    answer: 1,
    why: "셋 모두 4 한 곳으로 가니 상수함수예요. 정의역과 공역이 다르므로 항등함수는 될 수 없습니다.",
  },
  {
    id: "c3",
    domain: [0, 1],
    domainTex: "\\{0,\\ 1\\}",
    codoTex: "\\{0,\\ 1\\}",
    codoSame: true,
    ruleTex: "f(x)=x^2",
    fn: (x) => x * x,
    answer: 0,
    why: "0 과 1 은 제곱해도 자기 자신이에요. 식이 x 가 아니어도 값이 자기 자신이면 항등함수입니다.",
  },
  {
    id: "c4",
    domain: [1, 2, 3],
    domainTex: "\\{1,\\ 2,\\ 3\\}",
    codoTex: "\\{1,\\ 2,\\ 3\\}",
    codoSame: true,
    ruleTex: "f(x)=|x|",
    fn: (x) => Math.abs(x),
    answer: 0,
    why: "정의역이 모두 양수라 절댓값을 씌워도 그대로예요. 정의역을 음수까지 넓히면 더 이상 항등함수가 아닙니다.",
  },
  {
    id: "c5",
    domain: [-1, 0, 1],
    domainTex: "\\{-1,\\ 0,\\ 1\\}",
    codoTex: "\\{-1,\\ 0,\\ 1\\}",
    codoSame: true,
    ruleTex: "f(x)=x^3",
    fn: (x) => x ** 3,
    answer: 0,
    why: "-1, 0, 1 은 세제곱해도 자기 자신이에요. 정의역이 이 세 수뿐이라 항등함수가 됩니다.",
  },
  {
    id: "c6",
    domain: [1, 2],
    domainTex: "\\{1,\\ 2\\}",
    codoTex: "\\{1,\\ 2,\\ 3\\}",
    codoSame: false,
    ruleTex: "f(x)=(x-1)(x-2)+3",
    fn: (x) => (x - 1) * (x - 2) + 3,
    answer: 1,
    why: "1 과 2 를 넣으면 앞의 곱이 0 이 되어 둘 다 3 이에요. 치역의 원소가 하나뿐이니 상수함수입니다.",
  },
  {
    id: "c7",
    domain: [1, 2, 3],
    domainTex: "\\{1,\\ 2,\\ 3\\}",
    codoTex: "\\{2,\\ 4,\\ 6\\}",
    codoSame: false,
    ruleTex: "f(x)=2x",
    fn: (x) => 2 * x,
    answer: 3,
    why: "값이 저마다 다르니 상수함수가 아니고, 자기 자신으로 가지도 않으니 항등함수도 아니에요. 다만 일대일대응이기는 합니다.",
  },
  {
    id: "c8",
    domain: [1, 2, 3, 4],
    domainTex: "\\{1,\\ 2,\\ 3,\\ 4\\}",
    codoTex: "\\{1,\\ 2,\\ 3,\\ 4\\}",
    codoSame: true,
    ruleTex: "f(x)=5-x",
    fn: (x) => 5 - x,
    answer: 3,
    why: "정의역과 공역이 같다고 항등함수가 되지는 않아요. 1 이 4 로, 2 가 3 으로 자리를 바꾸니 f(x) = x 가 아닙니다.",
  },
  {
    id: "c9",
    domain: [0, 1],
    domainTex: "\\{0,\\ 1\\}",
    codoTex: "\\{0,\\ 1\\}",
    codoSame: true,
    ruleTex: "f(x)=x^2-x+1",
    fn: (x) => x * x - x + 1,
    answer: 1,
    why: "0 을 넣어도 1, 1 을 넣어도 1 이에요. 정의역과 공역이 같지만 값이 자기 자신이 아니므로 상수함수일 뿐입니다.",
  },
  {
    id: "c10",
    domain: [3],
    domainTex: "\\{3\\}",
    codoTex: "\\{3\\}",
    codoSame: true,
    ruleTex: "f(x)=x",
    fn: (x) => x,
    answer: 2,
    why: "정의역의 원소가 하나뿐이면 자기 자신으로 가는 동시에 늘 같은 값으로 가는 셈이에요. 항등함수이면서 상수함수인 드문 경우입니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 일상 속에서 찾기
// ══════════════════════════════════════════════════════════════
export const KIND_CHOICES = [
  "함수가 아니다",
  "함수이지만 아래 어느 것도 아니다",
  "일대일함수 (일대일대응은 아님)",
  "일대일대응",
  "상수함수",
  "항등함수",
];

/** 대응도에서 실제 갈래를 셈한다 — 항등 > 상수 > 일대일대응 > 일대일함수 > 그 밖 */
export function kindOf(xs: string[], ys: string[], edges: Edge[]): number {
  if (!isFunction(edges, xs.length)) return 0;
  if (isIdentity(edges, xs, ys)) return 5;
  if (isConstant(edges, xs.length)) return 4;
  if (isBijection(edges, xs.length, ys.length)) return 3;
  if (isInjective(edges, xs.length)) return 2;
  return 1;
}

export type LifeCase = {
  id: string;
  icon: string;
  from: string;
  to: string;
  rule: string;
  xs: string[];
  ys: string[];
  edges: Edge[];
  answer: number;
  why: string;
};

export const LIFE_CASES: LifeCase[] = [
  {
    id: "L1",
    icon: "📚",
    from: "학생",
    to: "과목",
    rule: "학생에게 그 학생이 좋아하는 과목을 짝지어 준다 (여러 과목을 좋아해도 된다)",
    xs: ["민수", "서아", "지호"],
    ys: ["국어", "수학", "체육"],
    edges: [
      [0, 1],
      [0, 2],
      [1, 0],
      [2, 1],
    ],
    answer: 0,
    why: "민수가 두 과목을 좋아해 짝이 둘이 되었어요. 「오직 하나」라는 조건이 무너져 함수가 아닙니다.",
  },
  {
    id: "L2",
    icon: "☂️",
    from: "꽂이 자리",
    to: "우산",
    rule: "우산꽂이의 자리에 그 자리에 꽂힌 우산을 짝지어 준다 (빈자리가 있다)",
    xs: ["1번", "2번", "3번"],
    ys: ["빨강", "파랑"],
    edges: [
      [0, 0],
      [2, 1],
    ],
    answer: 0,
    why: "2번 자리가 비어 있어 짝을 찾지 못했어요. 「빠짐없이」라는 조건이 무너져 함수가 아닙니다.",
  },
  {
    id: "L3",
    icon: "🩸",
    from: "학생",
    to: "혈액형",
    rule: "학생에게 그 학생의 혈액형을 짝지어 준다",
    xs: ["윤아", "태민", "하루"],
    ys: ["A형", "B형", "O형"],
    edges: [
      [0, 0],
      [1, 2],
      [2, 0],
    ],
    answer: 1,
    why: "빠짐없이 하나씩 정해지니 함수예요. 다만 윤아와 하루가 같은 A형이라 일대일함수는 아닙니다.",
  },
  {
    id: "L4",
    icon: "🔤",
    from: "학생",
    to: "첫 글자",
    rule: "학생에게 그 학생 이름의 첫 글자를 짝지어 준다",
    xs: ["강민", "고은", "나래"],
    ys: ["ㄱ", "ㄴ"],
    edges: [
      [0, 0],
      [1, 0],
      [2, 1],
    ],
    answer: 1,
    why: "함수이기는 하지만 강민과 고은의 첫 글자가 같아요. 서로 다른 것이 같은 곳으로 가니 일대일함수가 아닙니다.",
  },
  {
    id: "L5",
    icon: "⚽",
    from: "선수",
    to: "등번호",
    rule: "선수에게 그 선수의 등번호를 짝지어 준다 (등번호는 겹치지 않고, 쓰지 않는 번호도 있다)",
    xs: ["가람", "나린", "다온"],
    ys: ["7번", "10번", "14번", "28번"],
    edges: [
      [0, 0],
      [1, 2],
      [2, 3],
    ],
    answer: 2,
    why: "번호가 겹치지 않으니 일대일함수예요. 그런데 10번을 쓰는 선수가 없어 치역이 공역보다 작으니 일대일대응은 아닙니다.",
  },
  {
    id: "L6",
    icon: "🗄️",
    from: "학생",
    to: "사물함",
    rule: "학생에게 그 학생의 사물함을 짝지어 준다 (사물함이 학생보다 많다)",
    xs: ["소윤", "재하"],
    ys: ["1번", "2번", "3번"],
    edges: [
      [0, 1],
      [1, 2],
    ],
    answer: 2,
    why: "저마다 다른 사물함을 쓰니 일대일함수예요. 남는 사물함이 있어 공역이 치역보다 크므로 일대일대응은 아닙니다.",
  },
  {
    id: "L7",
    icon: "🎭",
    from: "좌석",
    to: "관객",
    rule: "좌석에 그 자리에 앉은 관객을 짝지어 준다 (표가 모두 팔렸다)",
    xs: ["A1", "A2", "A3"],
    ys: ["지우", "민재", "선호"],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
    answer: 3,
    why: "빈자리도 없고 서서 보는 사람도 없어요. 좌석과 관객이 하나씩 짝을 이루니 일대일대응입니다.",
  },
  {
    id: "L8",
    icon: "🔑",
    from: "자물쇠",
    to: "열쇠",
    rule: "자물쇠에 그 자물쇠를 여는 열쇠를 짝지어 준다 (남는 열쇠가 없다)",
    xs: ["가", "나", "다"],
    ys: ["A", "B", "C"],
    edges: [
      [0, 2],
      [1, 0],
      [2, 1],
    ],
    answer: 3,
    why: "자물쇠마다 열쇠가 하나씩이고 남는 열쇠도 없어요. 치역과 공역이 같으므로 일대일대응입니다.",
  },
  {
    id: "L9",
    icon: "🏫",
    from: "학생",
    to: "학교",
    rule: "우리 반 학생에게 그 학생이 다니는 학교를 짝지어 준다",
    xs: ["도윤", "시아", "은찬"],
    ys: ["한빛고"],
    edges: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    answer: 4,
    why: "모두 같은 학교 한 곳으로 가요. 치역의 원소가 하나뿐이니 상수함수입니다.",
  },
  {
    id: "L10",
    icon: "🎁",
    from: "참가자",
    to: "기념품",
    rule: "대회 참가자에게 받는 기념품을 짝지어 준다 (모두에게 같은 것을 준다)",
    xs: ["101", "102", "103"],
    ys: ["텀블러", "에코백"],
    edges: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    answer: 4,
    why: "받지 못한 에코백이 공역에 남아 있어도 상관없어요. 모두 텀블러 하나로 가니 상수함수입니다.",
  },
  {
    id: "L11",
    icon: "🪞",
    from: "사람",
    to: "사람",
    rule: "사람에게 거울에 비친 자기 자신을 짝지어 준다",
    xs: ["가은", "나현", "다솜"],
    ys: ["가은", "나현", "다솜"],
    edges: [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    answer: 5,
    why: "정의역과 공역이 같은 집합이고 모두 자기 자신으로 가요. 항등함수이고, 항등함수는 언제나 일대일대응이기도 합니다.",
  },
  {
    id: "L12",
    icon: "➕",
    from: "자연수",
    to: "자연수",
    rule: "수에 그 수에 0 을 더한 값을 짝지어 준다",
    xs: ["1", "2", "3"],
    ys: ["1", "2", "3"],
    edges: [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    answer: 5,
    why: "0 을 더해도 값이 그대로라 자기 자신으로 가요. 식이 x + 0 이어도 결국 f(x) = x 이므로 항등함수입니다.",
  },
];
