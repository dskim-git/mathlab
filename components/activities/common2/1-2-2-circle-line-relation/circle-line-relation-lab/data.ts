// 원과 직선의 위치 관계 — 활동 데이터
//
//  원 x² + y² = r² 과 직선 y = mx + n 을 연립하면
//      x² + (mx + n)² = r²  ⇒  (m² + 1)x² + 2mnx + (n² − r²) = 0   … (*)
//  (*) 의 판별식
//      D/4 = (mn)² − (m² + 1)(n² − r²) = (m² + 1)r² − n²
//
//  한편 원의 중심 O(0, 0) 과 직선 mx − y + n = 0 사이의 거리는
//      d = |n| / √(m² + 1)      ⇒  n² = d²(m² + 1)
//  이므로
//      D/4 = (m² + 1)(r² − d²)
//  → D 의 부호와 r − d 의 부호가 언제나 일치한다. 두 판정법이 같은 답을 주는 이유.
//
//  현의 길이 : 중심에서 현 AB 에 내린 수선의 발을 H 라 하면
//      AH = √(r² − d²),   AB = 2·AH = 2√(r² − d²)
//  ※ 교과서 슬라이드의 3) 은 AB = 2AH = √(r²−d²) 로 적혀 있으나
//    계수 2 가 빠진 오기이다 (AB = 2√(r²−d²)). 활동 안에서 바로잡는다.

export type Pt = { x: number; y: number };
/** ax + by + c = 0 */
export type Line = { a: number; b: number; c: number };
export type Rel = "two" | "tangent" | "none";

// ─── 위치 관계 메타 ───────────────────────────────────────────
export const REL_META: Record<
  Rel,
  { label: string; short: string; emoji: string; color: string; count: number; box: string; text: string }
> = {
  two: {
    label: "서로 다른 두 점에서 만난다",
    short: "두 점에서 만남",
    emoji: "✌️",
    color: "#fb7185",
    count: 2,
    box: "border-rose-400/60 bg-rose-400/15",
    text: "text-rose-100",
  },
  tangent: {
    label: "한 점에서 만난다 (접한다)",
    short: "접한다",
    emoji: "🤝",
    color: "#34d399",
    count: 1,
    box: "border-emerald-400/60 bg-emerald-400/15",
    text: "text-emerald-100",
  },
  none: {
    label: "만나지 않는다",
    short: "만나지 않음",
    emoji: "🚫",
    color: "#fb923c",
    count: 0,
    box: "border-orange-400/60 bg-orange-400/15",
    text: "text-orange-100",
  },
};
export const REL_ORDER: Rel[] = ["two", "tangent", "none"];

// ─── 유리수 ───────────────────────────────────────────────────
export type Frac = { n: number; d: number };

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
export function frac(n: number, d: number): Frac {
  if (d === 0) return { n, d: 0 };
  const s = d < 0 ? -1 : 1;
  const nn = n * s;
  const dd = d * s;
  const g = gcd(Math.abs(nn), dd) || 1;
  return { n: nn / g, d: dd / g };
}
export function fracTex(f: Frac): string {
  if (f.d === 1) return String(f.n);
  return f.n < 0 ? `-\\frac{${-f.n}}{${f.d}}` : `\\frac{${f.n}}{${f.d}}`;
}

// ─── 근호 ─────────────────────────────────────────────────────
export function simpRad(n: number): { k: number; r: number } {
  let k = 1;
  let r = n;
  for (let f = 2; f * f <= r; f++) {
    while (r % (f * f) === 0) {
      r /= f * f;
      k *= f;
    }
  }
  return { k, r };
}
/** c·√q 를 간단히 한 TeX */
export function mulRadTex(c: number, q: number): string {
  if (q < 0) return "?";
  if (q === 0 || c === 0) return "0";
  const { k, r } = simpRad(q);
  const co = c * k;
  if (r === 1) return String(co);
  return co === 1 ? `\\sqrt{${r}}` : `${co}\\sqrt{${r}}`;
}
/** num / √den2 를 간단히 한 TeX */
export function distTex(num: number, den2: number): string {
  if (num === 0) return "0";
  const { k, r } = simpRad(den2);
  if (r === 1) return fracTex(frac(num, k));
  const f = frac(num, k * r);
  if (f.d === 1) return f.n === 1 ? `\\sqrt{${r}}` : `${f.n}\\sqrt{${r}}`;
  return f.n === 1 ? `\\frac{\\sqrt{${r}}}{${f.d}}` : `\\frac{${f.n}\\sqrt{${r}}}{${f.d}}`;
}

// ─── 식 조판 ──────────────────────────────────────────────────
/** m x + n (m, n 은 정수) */
export function mxnTex(m: number, n: number): string {
  const mm = m === 0 ? "" : m === 1 ? "x" : m === -1 ? "-x" : `${m}x`;
  if (n === 0) return mm === "" ? "0" : mm;
  if (mm === "") return String(n);
  return `${mm} ${n > 0 ? "+" : "-"} ${Math.abs(n)}`;
}
/** ax + by + c = 0 */
export function lineTex(a: number, b: number, c: number): string {
  const head = (v: number, name: string) => {
    const abs = Math.abs(v);
    const body = abs === 1 ? name : `${abs}${name}`;
    return v < 0 ? `-${body}` : body;
  };
  const tail = (v: number, name: string) => {
    if (v === 0) return "";
    const abs = Math.abs(v);
    const body = name === "" ? `${abs}` : abs === 1 ? name : `${abs}${name}`;
    return (v < 0 ? " - " : " + ") + body;
  };
  let s = "";
  if (a !== 0) s += head(a, "x");
  if (b !== 0) s += s === "" ? head(b, "y") : tail(b, "y");
  if (c !== 0 || s === "") s += s === "" ? String(c) : tail(c, "");
  return `${s} = 0`;
}
/** (x−p)² + (y−q)² = r² */
export function circleStdTex(p: number, q: number, r2: number): string {
  const t = (v: number, name: string) => (v === 0 ? `${name}^2` : `(${name} ${v > 0 ? "-" : "+"} ${Math.abs(v)})^2`);
  return `${t(p, "x")} + ${t(q, "y")} = ${r2}`;
}
/** ax² + bx + c = 0 */
export function quadTex(a: number, b: number, c: number): string {
  const head = a === 1 ? "x^2" : a === -1 ? "-x^2" : `${a}x^2`;
  const tail = (v: number, name: string) => {
    if (v === 0) return "";
    const abs = Math.abs(v);
    const body = name === "" ? `${abs}` : abs === 1 ? name : `${abs}${name}`;
    return (v < 0 ? " - " : " + ") + body;
  };
  return `${head}${tail(b, "x")}${tail(c, "")} = 0`;
}

// ─── 기하 ─────────────────────────────────────────────────────
/** y = mx + n  →  mx − y + n = 0 */
export function lineFromSlope(m: number, n: number): Line {
  return { a: m, b: -1, c: n };
}
export function distToLine(L: Line, p: Pt): number {
  return Math.abs(L.a * p.x + L.b * p.y + L.c) / Math.hypot(L.a, L.b);
}
/** 중심에서 직선에 내린 수선의 발 */
export function footOf(L: Line, p: Pt): Pt {
  const t = (L.a * p.x + L.b * p.y + L.c) / (L.a * L.a + L.b * L.b);
  return { x: p.x - L.a * t, y: p.y - L.b * t };
}
export function relOf(d: number, r: number, eps = 1e-9): Rel {
  if (d < r - eps) return "two";
  if (d > r + eps) return "none";
  return "tangent";
}
/** 원(중심 c, 반지름 r) 과 직선의 교점 */
export function lineCirclePts(L: Line, c: Pt, r: number, eps = 1e-9): Pt[] {
  const d = distToLine(L, c);
  if (d > r + eps) return [];
  const H = footOf(L, c);
  if (d > r - eps) return [H];
  const h2 = r * r - d * d;
  const h = h2 > 0 ? Math.sqrt(h2) : 0;
  const len = Math.hypot(L.a, L.b);
  const ux = -L.b / len;
  const uy = L.a / len;
  return [
    { x: H.x + h * ux, y: H.y + h * uy },
    { x: H.x - h * ux, y: H.y - h * uy },
  ];
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 교과서 그림 재현용 (원 x²+y²=9, 기울기 1 인 세 직선)
// ══════════════════════════════════════════════════════════════
export const GALLERY_R = 3;
export const GALLERY_M = 1;
export const GALLERY: { n: number; rel: Rel; note: string }[] = [
  { n: 1.5, rel: "two", note: "직선이 원을 가로질러요" },
  { n: 3 * Math.SQRT2, rel: "tangent", note: "딱 스치듯 닿아요" },
  { n: 7, rel: "none", note: "원을 비껴가요" },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 연립 → 판별식
// ══════════════════════════════════════════════════════════════
export type SubQ = {
  id: string;
  /** 원 x² + y² = r2 */
  r2: number;
  /** 직선 y = m x + n */
  m: number;
  n: number;
  /** 정리된 이차방정식 a x² + b x + c = 0 */
  a: number;
  b: number;
  c: number;
  /** D/4 */
  dq: number;
  rel: Rel;
  pts: Pt[];
};

function mkSub(id: string, r2: number, m: number, n: number): SubQ {
  const a = m * m + 1;
  const b = 2 * m * n;
  const c = n * n - r2;
  const dq = (m * n) ** 2 - a * c;
  const rel: Rel = dq > 0 ? "two" : dq === 0 ? "tangent" : "none";
  const pts: Pt[] = [];
  if (dq >= 0) {
    const s = Math.sqrt(dq);
    const xs = dq === 0 ? [(-m * n) / a] : [(-m * n + s) / a, (-m * n - s) / a];
    for (const x of xs) pts.push({ x, y: m * x + n });
  }
  return { id, r2, m, n, a, b, c, dq, rel, pts };
}

export const SUB_QS: SubQ[] = [
  mkSub("s1", 5, 1, 1),
  mkSub("s2", 10, 3, 10),
  mkSub("s3", 4, 1, 4),
  mkSub("s4", 25, 2, -5),
  mkSub("s5", 8, 1, 4),
  mkSub("s6", 9, -1, 3),
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 거리로 판정
// ══════════════════════════════════════════════════════════════
export type DistQ = {
  id: string;
  center: Pt;
  r2: number;
  L: Line;
  /** |a·p + b·q + c| */
  num: number;
  /** a² + b² */
  den2: number;
  rel: Rel;
};

function mkDist(id: string, center: Pt, r2: number, L: Line): DistQ {
  const num = Math.abs(L.a * center.x + L.b * center.y + L.c);
  const den2 = L.a * L.a + L.b * L.b;
  // d² 와 r² 을 정수로 비교 (오차 없음)
  const lhs = num * num;
  const rhs = r2 * den2;
  const rel: Rel = lhs < rhs ? "two" : lhs > rhs ? "none" : "tangent";
  return { id, center, r2, L, num, den2, rel };
}

export const DIST_QS: DistQ[] = [
  mkDist("d1", { x: 0, y: 0 }, 4, { a: 1, b: 1, c: -4 }),
  mkDist("d2", { x: 2, y: 1 }, 5, { a: 2, b: -1, c: -5 }),
  mkDist("d3", { x: 0, y: 0 }, 9, { a: 4, b: 3, c: -15 }),
  mkDist("d4", { x: 1, y: -2 }, 9, { a: 3, b: -4, c: 5 }),
  mkDist("d5", { x: -1, y: 3 }, 8, { a: 1, b: 1, c: -6 }),
  mkDist("d6", { x: 3, y: -1 }, 10, { a: 1, b: -3, c: -4 }),
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 현의 길이
// ══════════════════════════════════════════════════════════════
export type ChordQ = {
  id: string;
  center: Pt;
  r2: number;
  L: Line;
  num: number;
  den2: number;
  /** d² (정수) */
  d2: number;
  /** r² − d²  (= AH²) */
  half2: number;
  choices: string[];
  ans: number;
  tip: string;
};

function mkChord(id: string, center: Pt, r2: number, L: Line, choices: string[], ans: number, tip: string): ChordQ {
  const num = Math.abs(L.a * center.x + L.b * center.y + L.c);
  const den2 = L.a * L.a + L.b * L.b;
  const d2 = (num * num) / den2;
  return { id, center, r2, L, num, den2, d2, half2: r2 - d2, choices, ans, tip };
}

export const CHORD_QS: ChordQ[] = [
  mkChord("c1", { x: 0, y: 0 }, 25, { a: 3, b: 4, c: -15 }, ["4", "8", "16", "2\\sqrt{34}"], 1, "d = 3, r = 5 인 직각삼각형이에요."),
  mkChord("c2", { x: 2, y: 1 }, 25, { a: 3, b: 4, c: -30 }, ["2\\sqrt{41}", "3", "6", "9"], 2, "중심이 원점이 아니어도 방법은 똑같아요."),
  mkChord("c3", { x: 0, y: 0 }, 9, { a: 1, b: 0, c: -2 }, ["\\sqrt{5}", "5", "2\\sqrt{5}", "2\\sqrt{13}"], 2, "x = 2 는 세로선, 중심까지의 거리는 2 예요."),
  mkChord("c4", { x: 1, y: -2 }, 9, { a: 0, b: 1, c: 2 }, ["3", "9", "6", "2\\sqrt{3}"], 2, "직선이 중심을 지나면 d = 0 이에요."),
];

/** 도전 문제 — 현의 길이가 주어졌을 때 상수 구하기 */
export const CHORD_BONUS = {
  r2: 25,
  chord: 8,
  choices: ["k = \\pm 4", "k = \\pm 3", "k = \\pm 5", "k = \\pm 6"],
  ans: 1,
};
