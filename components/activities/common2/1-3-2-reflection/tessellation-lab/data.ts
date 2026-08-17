// 테셀레이션(쪽매 맞춤) — 활동 데이터
//
//  직사각형 한 칸(가로 W, 세로 H)의 변을 변형해 쪽매 조각을 만든다.
//  한쪽에서 잘라낸 만큼 다른 쪽에 그대로 붙이므로 넓이는 언제나 W × H 이다.
//  변을 어떤 이동으로 옮겨 붙이느냐에 따라 평면을 채우는 방법이 달라진다.
//
//   ① 평행이동 방식 : 왼쪽 변을 오른쪽으로, 아래 변을 위로 평행이동해 붙인다
//        → 모든 조각을 평행이동만으로 붙여 나간다
//   ② 점대칭 방식   : 각 변을 그 변의 중점에 대하여 점대칭이 되도록 만든다
//        → 이웃 칸은 180° 회전(점대칭)한 조각이 들어간다
//   ③ 선대칭 방식   : 위·아래 변을 좌우 대칭으로 만들고 좌우 변은 곧게 둔다
//        → 옆 칸은 세로 거울선에 대하여 대칭이동한 조각이 들어간다
//   ④ 미끄럼반사    : 위 변을 아래 변의 거울상으로 만든다
//        → 윗줄은 좌우로 뒤집어 위로 밀어 올린(미끄럼반사) 조각이 들어간다

export type Pt = { x: number; y: number };

/** 기본 칸의 크기 */
export const CELL = { W: 4, H: 3 };

export type Mode = "trans" | "rot" | "mirror" | "glide";

export const MODE_META: Record<
  Mode,
  { emoji: string; name: string; how: string; moves: string[]; color: string; usesLeft: boolean }
> = {
  trans: {
    emoji: "➡️",
    name: "평행이동 방식",
    how: "왼쪽에서 잘라 오른쪽에, 아래에서 잘라 위에 그대로 옮겨 붙여요",
    moves: ["평행이동"],
    color: "#38bdf8",
    usesLeft: true,
  },
  rot: {
    emoji: "🔄",
    name: "점대칭 방식",
    how: "각 변을 그 변의 한가운데를 중심으로 180° 돌린 모양으로 만들어요",
    moves: ["평행이동", "180° 회전"],
    color: "#a78bfa",
    usesLeft: true,
  },
  mirror: {
    emoji: "🪞",
    name: "선대칭 방식",
    how: "위·아래 변을 좌우 대칭으로 만들고 옆 변은 곧게 두어요",
    moves: ["평행이동", "선대칭"],
    color: "#34d399",
    usesLeft: false,
  },
  glide: {
    emoji: "👣",
    name: "미끄럼반사 방식",
    how: "위 변을 아래 변의 거울상으로 만들어요",
    moves: ["평행이동", "미끄럼반사"],
    color: "#fbbf24",
    usesLeft: false,
  },
};
export const MODE_ORDER: Mode[] = ["trans", "rot", "mirror", "glide"];

export type Ctrl = { bx: number; by: number; lx: number; ly: number };

/**
 * 조절점을 마음대로 두면 조각이 스스로 꼬이거나 이웃과 겹칠 수 있다.
 * 아래 범위는 0.5 간격의 모든 조합을 컴퓨터로 훑어 확인한 안전한 구간이다.
 */
export const LIMITS: Record<Mode, { bx: [number, number]; by: [number, number]; lx: [number, number]; ly: [number, number] }> = {
  trans: { bx: [1, 3], by: [-1, 1], lx: [-1, 1], ly: [1, 2] },
  rot: { bx: [1, 3], by: [-1, 1], lx: [-1, 1], ly: [1, 2] },
  mirror: { bx: [0.5, 2], by: [-1, 1], lx: [-1, 1], ly: [1, 2] },
  glide: { bx: [0.5, 3.5], by: [-1, 1], lx: [-1, 1], ly: [1, 2] },
};
export const SNAP = 0.5;

function clamp1(v: number, [lo, hi]: [number, number]): number {
  return Math.max(lo, Math.min(hi, Math.round(v / SNAP) * SNAP));
}
export function clampCtrl(mode: Mode, c: Ctrl): Ctrl {
  const L = LIMITS[mode];
  return { bx: clamp1(c.bx, L.bx), by: clamp1(c.by, L.by), lx: clamp1(c.lx, L.lx), ly: clamp1(c.ly, L.ly) };
}

export const PRESETS: { id: string; emoji: string; name: string; c: Ctrl }[] = [
  { id: "fish", emoji: "🐟", name: "물고기", c: { bx: 1.5, by: -1, lx: 1, ly: 1.5 } },
  { id: "arrow", emoji: "🏹", name: "화살", c: { bx: 2, by: 1, lx: -1, ly: 1.5 } },
  { id: "saw", emoji: "🪚", name: "톱니", c: { bx: 1, by: -0.5, lx: 0.5, ly: 1 } },
  { id: "leaf", emoji: "🍃", name: "나뭇잎", c: { bx: 2, by: -1, lx: -1, ly: 2 } },
];

/** 조각의 꼭짓점 (반시계 방향) */
export function unitPoly(mode: Mode, c: Ctrl): Pt[] {
  const { W, H } = CELL;
  const { bx, by, lx, ly } = c;
  if (mode === "trans") {
    return [
      { x: 0, y: 0 },
      { x: bx, y: by },
      { x: W, y: 0 },
      { x: W + lx, y: ly },
      { x: W, y: H },
      { x: bx, y: by + H },
      { x: 0, y: H },
      { x: lx, y: ly },
    ];
  }
  if (mode === "rot") {
    return [
      { x: 0, y: 0 },
      { x: bx, y: by },
      { x: W - bx, y: -by },
      { x: W, y: 0 },
      { x: W + lx, y: ly },
      { x: W - lx, y: H - ly },
      { x: W, y: H },
      { x: W - bx, y: H - by },
      { x: bx, y: H + by },
      { x: 0, y: H },
      { x: -lx, y: H - ly },
      { x: lx, y: ly },
    ];
  }
  if (mode === "mirror") {
    return [
      { x: 0, y: 0 },
      { x: bx, y: by },
      { x: W - bx, y: by },
      { x: W, y: 0 },
      { x: W, y: H },
      { x: W - bx, y: by + H },
      { x: bx, y: by + H },
      { x: 0, y: H },
    ];
  }
  // glide
  return [
    { x: 0, y: 0 },
    { x: bx, y: by },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: W - bx, y: by + H },
    { x: 0, y: H },
  ];
}

/** 조절점(끌 수 있는 점)과 그에 따라 저절로 정해지는 점 */
export function ctrlPoints(mode: Mode, c: Ctrl): { drag: { id: "b" | "l"; p: Pt }[]; derived: Pt[] } {
  const { W, H } = CELL;
  const { bx, by, lx, ly } = c;
  if (mode === "trans") {
    return {
      drag: [
        { id: "b", p: { x: bx, y: by } },
        { id: "l", p: { x: lx, y: ly } },
      ],
      derived: [
        { x: bx, y: by + H },
        { x: W + lx, y: ly },
      ],
    };
  }
  if (mode === "rot") {
    return {
      drag: [
        { id: "b", p: { x: bx, y: by } },
        { id: "l", p: { x: lx, y: ly } },
      ],
      derived: [
        { x: W - bx, y: -by },
        { x: bx, y: H + by },
        { x: W - bx, y: H - by },
        { x: -lx, y: H - ly },
        { x: W + lx, y: ly },
        { x: W - lx, y: H - ly },
      ],
    };
  }
  if (mode === "mirror") {
    return {
      drag: [{ id: "b", p: { x: bx, y: by } }],
      derived: [
        { x: W - bx, y: by },
        { x: bx, y: by + H },
        { x: W - bx, y: by + H },
      ],
    };
  }
  return {
    drag: [{ id: "b", p: { x: bx, y: by } }],
    derived: [{ x: W - bx, y: by + H }],
  };
}

export type Place = { kind: "trans" | "rot" | "mirror" | "glide"; label: string; detail: string };

/** 칸 (i, j) 에 조각을 놓을 때 쓰는 이동 */
export function placeOf(mode: Mode, i: number, j: number): Place {
  const { W, H } = CELL;
  const tx = i * W;
  const ty = j * H;
  const trans: Place = { kind: "trans", label: "평행이동", detail: `(${tx}, ${ty}) 만큼` };
  if (mode === "trans") return trans;
  if (mode === "rot") {
    if ((i + j) % 2 === 0) return trans;
    return { kind: "rot", label: "180° 회전", detail: `점 (${(i + 1) * W - W / 2}, ${(j + 1) * H - H / 2}) 에 대하여` };
  }
  if (mode === "mirror") {
    if (((i % 2) + 2) % 2 === 0) return trans;
    return { kind: "mirror", label: "선대칭", detail: `직선 x = ${(i + 1) * W} 에 대하여 뒤집고 위로 ${ty}` };
  }
  if (((j % 2) + 2) % 2 === 0) return trans;
  return { kind: "glide", label: "미끄럼반사", detail: `좌우로 뒤집고 위로 ${ty} 만큼` };
}

/** 칸 (i, j) 에 놓이는 조각의 꼭짓점 */
export function tilePoly(mode: Mode, c: Ctrl, i: number, j: number): Pt[] {
  const { W, H } = CELL;
  const u = unitPoly(mode, c);
  const p = placeOf(mode, i, j);
  if (p.kind === "trans") return u.map((q) => ({ x: q.x + i * W, y: q.y + j * H }));
  if (p.kind === "rot") return u.map((q) => ({ x: (i + 1) * W - q.x, y: (j + 1) * H - q.y }));
  if (p.kind === "mirror") return u.map((q) => ({ x: (i + 1) * W - q.x, y: q.y + j * H }));
  return u.map((q) => ({ x: W - q.x + i * W, y: q.y + j * H }));
}

// ─── 다각형 도구 ──────────────────────────────────────────────
/** 신발끈 공식 (부호 없는 넓이) */
export function polyArea(pts: Pt[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}
/** 자기 자신과 교차하지 않는 단순 다각형인가 */
export function isSimple(pts: Pt[]): boolean {
  const n = pts.length;
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const seg = (p1: Pt, p2: Pt, p3: Pt, p4: Pt) => {
    const d1 = cross(p3, p4, p1);
    const d2 = cross(p3, p4, p2);
    const d3 = cross(p1, p2, p3);
    const d4 = cross(p1, p2, p4);
    return ((d1 > 1e-12 && d2 < -1e-12) || (d1 < -1e-12 && d2 > 1e-12)) && ((d3 > 1e-12 && d4 < -1e-12) || (d3 < -1e-12 && d4 > 1e-12));
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i || (i === 0 && j === n - 1) || j === i + 1) continue;
      if (seg(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) return false;
    }
  }
  return true;
}
export function pointInPoly(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

// ─── 손에 든 조각의 자세 ──────────────────────────────────────
//  0 그대로 · 1 칸의 중심에 대한 180° 회전 · 2 칸의 세로 중심선에 대한 선대칭
//  3 칸의 가로 중심선에 대한 선대칭
export type Orient = 0 | 1 | 2 | 3;
export const ORIENT_META: Record<Orient, { icon: string; label: string }> = {
  0: { icon: "🙂", label: "그대로" },
  1: { icon: "🔄", label: "180° 회전" },
  2: { icon: "↔️", label: "좌우 뒤집기" },
  3: { icon: "↕️", label: "위아래 뒤집기" },
};

/** 자세를 바꾸는 조작 (회전·뒤집기는 서로 합성된다) */
export function turn(o: Orient, act: "rot" | "flipH" | "flipV"): Orient {
  const table: Record<"rot" | "flipH" | "flipV", Orient[]> = {
    rot: [1, 0, 3, 2],
    flipH: [2, 3, 0, 1],
    flipV: [3, 2, 1, 0],
  };
  return table[act][o];
}

/** 칸 (i, j) 에 자세 o 로 놓았을 때의 조각 */
export function orientPoly(mode: Mode, c: Ctrl, i: number, j: number, o: Orient): Pt[] {
  const { W, H } = CELL;
  const u = unitPoly(mode, c);
  if (o === 0) return u.map((q) => ({ x: q.x + i * W, y: q.y + j * H }));
  if (o === 1) return u.map((q) => ({ x: (i + 1) * W - q.x, y: (j + 1) * H - q.y }));
  if (o === 2) return u.map((q) => ({ x: (i + 1) * W - q.x, y: q.y + j * H }));
  return u.map((q) => ({ x: q.x + i * W, y: (j + 1) * H - q.y }));
}

/** 칸 (i, j) 에 맞물리는 자세 */
export function neededOrient(mode: Mode, i: number, j: number): Orient {
  if (mode === "trans") return 0;
  if (mode === "rot") return (((i + j) % 2) + 2) % 2 === 0 ? 0 : 1;
  if (mode === "mirror") return (((i % 2) + 2) % 2) === 0 ? 0 : 2;
  return (((j % 2) + 2) % 2) === 0 ? 0 : 2;
}

/** 두 다각형이 같은 자리에 놓인 같은 도형인가 (모양이 대칭이면 여러 자세가 같은 결과를 준다) */
export function sameShape(a: Pt[], b: Pt[]): boolean {
  if (a.length !== b.length) return false;
  const k = (p: Pt) => `${Math.round(p.x * 1e6)},${Math.round(p.y * 1e6)}`;
  const sa = a.map(k).sort();
  const sb = b.map(k).sort();
  return sa.every((v, i) => v === sb[i]);
}

// ─── 탭 ② 격자 ───────────────────────────────────────────────
export const GRID = { cols: 4, rows: 3 };
export function cellList(): { i: number; j: number }[] {
  const out: { i: number; j: number }[] = [];
  for (let j = 0; j < GRID.rows; j++) for (let i = 0; i < GRID.cols; i++) out.push({ i, j });
  return out;
}
/** 시작 칸 (여기에는 원래 조각이 놓여 있다) */
export const START_CELL = { i: 0, j: 0 };
