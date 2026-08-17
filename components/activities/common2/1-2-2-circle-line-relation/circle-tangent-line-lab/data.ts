// 원의 접선의 방정식 — 활동 데이터
//
//  ① 기울기가 주어진 접선
//     원 x² + y² = r² 에 접하고 기울기가 m 인 직선을 y = mx + n 이라 하면
//         (m²+1)x² + 2mnx + n² − r² = 0,   D/4 = (m²+1)r² − n² = 0
//     ⇒ n = ±r√(m²+1)     ⇒  y = mx ± r√(m²+1)
//     중심이 (a, b) 인 원이면 X = x−a, Y = y−b 로 옮겨 같은 결과를 얻는다.
//         Y = mX ± r√(m²+1)  ⇒  y − b = m(x − a) ± r√(m²+1)
//     (거리로 보면 |ma − b + n| / √(m²+1) = r 에서 바로 나온다.)
//
//  ② 접점이 주어진 접선
//     원 x² + y² = r² 위의 점 P(x₁, y₁) 에서의 접선은  x₁x + y₁y = r²
//     중심이 (a, b) 이면  (x₁−a)(x−a) + (y₁−b)(y−b) = r²
//     (x₁ = a 또는 y₁ = b 인 경우, 즉 수평·수직 접선일 때도 그대로 성립한다.)
//
//  ③ 원 밖의 한 점에서 그은 접선 — 언제나 2개
//     접점을 (x₁, y₁) 이라 하면 접선은 x₁x + y₁y = r² 이고,
//     이 접선이 원 밖의 점 A(p, q) 를 지나므로   p·x₁ + q·y₁ = r²   … 일차식
//     또 (x₁, y₁) 은 원 위의 점이므로            x₁² + y₁² = r²    … 이차식
//     두 식을 연립해 접점을 구한 뒤 접선의 식에 대입한다.
//     ※ 교과서 슬라이드에는 이 이차식이 x₁² + y₂² = r² 로 인쇄되어 있으나
//       아래첨자 오기이며 x₁² + y₁² = r² 가 맞다.
//     ※ 덤: A(p, q) 를 대입해 만든 일차식 px + qy = r² 는
//       두 접점을 지나는 직선(극선)이 된다.

export type Pt = { x: number; y: number };
/** ax + by + c = 0 */
export type Line = { a: number; b: number; c: number };

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

// ─── 식 조판 ──────────────────────────────────────────────────
/** m x + n */
export function mxnTex(m: number, n: number): string {
  const mm = m === 0 ? "" : m === 1 ? "x" : m === -1 ? "-x" : `${m}x`;
  if (n === 0) return mm === "" ? "0" : mm;
  if (mm === "") return String(n);
  return `${mm} ${n > 0 ? "+" : "-"} ${Math.abs(n)}`;
}
/** y = mx + n */
export function yEqTex(m: number, n: number): string {
  return `y = ${mxnTex(m, n)}`;
}
/** ax + by = c */
export function xyEqTex(a: number, b: number, c: number): string {
  const head = (v: number, name: string) => {
    const abs = Math.abs(v);
    const body = abs === 1 ? name : `${abs}${name}`;
    return v < 0 ? `-${body}` : body;
  };
  const tail = (v: number, name: string) => {
    if (v === 0) return "";
    const abs = Math.abs(v);
    const body = abs === 1 ? name : `${abs}${name}`;
    return (v < 0 ? " - " : " + ") + body;
  };
  let s = "";
  if (a !== 0) s += head(a, "x");
  if (b !== 0) s += s === "" ? head(b, "y") : tail(b, "y");
  if (s === "") s = "0";
  return `${s} = ${c}`;
}
/** ax + by + c = 0 */
export function lineTex(L: Line): string {
  return xyEqTex(L.a, L.b, -L.c);
}
/** (x−a)² + (y−b)² = r² */
export function circleStdTex(a: number, b: number, r2: number): string {
  const t = (v: number, name: string) => (v === 0 ? `${name}^2` : `(${name} ${v > 0 ? "-" : "+"} ${Math.abs(v)})^2`);
  return `${t(a, "x")} + ${t(b, "y")} = ${r2}`;
}
/** k(x − a) 꼴 — 계수·평행이동을 함께 조판 */
function shiftTermTex(k: number, name: string, s: number): string {
  const inner = s === 0 ? name : `(${name} ${s > 0 ? "-" : "+"} ${Math.abs(s)})`;
  if (k === 1) return inner;
  if (k === -1) return `-${inner}`;
  return `${k}${inner}`;
}
/** (x₁−a)(x−a) + (y₁−b)(y−b) = r² 에 수를 넣은 모습 */
export function shiftedTangentTex(cx: number, cy: number, a: number, b: number, r2: number): string {
  const t1 = cx === 0 ? "" : shiftTermTex(cx, "x", a);
  const t2 = cy === 0 ? "" : shiftTermTex(cy, "y", b);
  if (t1 === "") return `${t2} = ${r2}`;
  if (t2 === "") return `${t1} = ${r2}`;
  return `${t1} ${cy > 0 ? "+" : "-"} ${shiftTermTex(Math.abs(cy), "y", b)} = ${r2}`;
}
/** a·t² + b·t + c = 0 */
export function quadTex(a: number, b: number, c: number, name: string): string {
  const head = a === 1 ? `${name}^2` : a === -1 ? `-${name}^2` : `${a}${name}^2`;
  const tail = (v: number, unit: string) => {
    if (v === 0) return "";
    const abs = Math.abs(v);
    const body = unit === "" ? `${abs}` : abs === 1 ? unit : `${abs}${unit}`;
    return (v < 0 ? " - " : " + ") + body;
  };
  return `${head}${tail(b, name)}${tail(c, "")} = 0`;
}
export function ptTex(p: Pt): string {
  return `(${p.x}, ${p.y})`;
}
export function nx(v: number): string {
  const r = Math.round(v * 100) / 100;
  return r < 0 ? `−${Math.abs(r)}` : String(r);
}

// ─── 기하 ─────────────────────────────────────────────────────
export function distToLine(L: Line, p: Pt): number {
  return Math.abs(L.a * p.x + L.b * p.y + L.c) / Math.hypot(L.a, L.b);
}
export function footOf(L: Line, p: Pt): Pt {
  const t = (L.a * p.x + L.b * p.y + L.c) / (L.a * L.a + L.b * L.b);
  return { x: p.x - L.a * t, y: p.y - L.b * t };
}

/** 중심 C, 반지름 r 인 원에 접하고 기울기가 m 인 두 직선 (위쪽 먼저) */
export function tangentsWithSlope(C: Pt, r: number, m: number): { n: number; L: Line; T: Pt }[] {
  const k = r * Math.sqrt(m * m + 1);
  const base = -m * C.x + C.y;
  return [1, -1].map((s) => {
    const n = base + s * k;
    const L: Line = { a: m, b: -1, c: n };
    const t = (s * r) / Math.sqrt(m * m + 1);
    return { n, L, T: { x: C.x - t * m, y: C.y + t } };
  });
}

/** 원 위의 점 P 에서의 접선 : (x₁−a)(x−a) + (y₁−b)(y−b) = r² */
export function tangentAtPoint(C: Pt, r2: number, P: Pt): Line {
  const cx = P.x - C.x;
  const cy = P.y - C.y;
  return { a: cx, b: cy, c: -(cx * C.x + cy * C.y + r2) };
}

/** 원 밖의 점 A 에서 그은 두 접선의 접점 (없으면 빈 배열) */
export function tangentPointsFrom(C: Pt, r: number, A: Pt): Pt[] {
  const vx = A.x - C.x;
  const vy = A.y - C.y;
  const d = Math.hypot(vx, vy);
  if (d <= r + 1e-9) return [];
  const th = Math.atan2(vy, vx);
  const al = Math.acos(Math.min(1, r / d));
  return [th + al, th - al].map((t) => ({ x: C.x + r * Math.cos(t), y: C.y + r * Math.sin(t) }));
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 기울기가 주어진 접선
// ══════════════════════════════════════════════════════════════
export type SlopeQ = {
  id: string;
  center: Pt;
  r2: number;
  m: number;
  /** m² + 1 */
  m2p1: number;
  /** r√(m²+1) — 문제는 모두 정수가 되도록 골랐다 */
  k: number;
  /** 두 y절편 (큰 값 먼저) */
  ns: [number, number];
};

function mkSlope(id: string, center: Pt, r2: number, m: number): SlopeQ {
  const m2p1 = m * m + 1;
  const k = Math.round(Math.sqrt(r2 * m2p1));
  const base = -m * center.x + center.y;
  return { id, center, r2, m, m2p1, k, ns: [base + k, base - k] };
}

export const SLOPE_QS: SlopeQ[] = [
  mkSlope("m1", { x: 0, y: 0 }, 2, 1),
  mkSlope("m2", { x: 0, y: 0 }, 5, 2),
  mkSlope("m3", { x: 0, y: 0 }, 10, -3),
  mkSlope("m4", { x: 2, y: -1 }, 8, 1),
  mkSlope("m5", { x: -1, y: 3 }, 2, 1),
  mkSlope("m6", { x: 3, y: 1 }, 5, 2),
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 접점이 주어진 접선
// ══════════════════════════════════════════════════════════════
export type PointQ = {
  id: string;
  center: Pt;
  r2: number;
  P: Pt;
  /** 접선 : coefX·x + coefY·y = rhs (정리한 모습) */
  coefX: number;
  coefY: number;
  rhs: number;
};

function mkPoint(id: string, center: Pt, r2: number, P: Pt): PointQ {
  const coefX = P.x - center.x;
  const coefY = P.y - center.y;
  return { id, center, r2, P, coefX, coefY, rhs: r2 + coefX * center.x + coefY * center.y };
}

export const POINT_QS: PointQ[] = [
  mkPoint("p1", { x: 0, y: 0 }, 25, { x: 3, y: 4 }),
  mkPoint("p2", { x: 0, y: 0 }, 13, { x: 2, y: -3 }),
  mkPoint("p3", { x: 0, y: 0 }, 9, { x: 0, y: -3 }),
  mkPoint("p4", { x: 1, y: 2 }, 25, { x: 4, y: 6 }),
  mkPoint("p5", { x: -2, y: 1 }, 13, { x: 0, y: 4 }),
  mkPoint("p6", { x: 3, y: -1 }, 10, { x: 4, y: 2 }),
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 원 밖의 한 점에서 그은 접선
// ══════════════════════════════════════════════════════════════
export type ExtQ = {
  id: string;
  center: Pt;
  r2: number;
  A: Pt;
  /** 대입해 만든 일차식 cA·x₁ + cB·y₁ = r² (평행이동한 좌표에서) */
  cA: number;
  cB: number;
  /** 접점 두 개 (x좌표가 작은 것 먼저) */
  Ts: [Pt, Pt];
  /** 접선 두 개 */
  Ls: [Line, Line];
  /** 연립해서 얻는 이차방정식 (약분한 정수 계수) */
  quad: { a: number; b: number; c: number };
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function mkExt(id: string, center: Pt, r2: number, A: Pt): ExtQ {
  const cA = A.x - center.x;
  const cB = A.y - center.y;
  // X² + Y² = r², cA·X + cB·Y = r²  를 연립
  const a2 = cA * cA + cB * cB;
  const b2 = -2 * cA * r2;
  const c2 = r2 * r2 - r2 * cB * cB;
  const disc = b2 * b2 - 4 * a2 * c2;
  const s = Math.sqrt(disc);
  const Xs = [(-b2 - s) / (2 * a2), (-b2 + s) / (2 * a2)];
  const Ts = Xs.map((X) => ({ x: X + center.x, y: (r2 - cA * X) / cB + center.y })) as [Pt, Pt];
  const Ls = Ts.map((T) => tangentAtPoint(center, r2, T)) as [Line, Line];
  const g = gcd(gcd(Math.abs(a2), Math.abs(b2)), Math.abs(c2)) || 1;
  return { id, center, r2, A, cA, cB, Ts, Ls, quad: { a: a2 / g, b: b2 / g, c: c2 / g } };
}

export const EXT_QS: ExtQ[] = [
  mkExt("e1", { x: 0, y: 0 }, 5, { x: 3, y: 1 }),
  mkExt("e2", { x: 0, y: 0 }, 25, { x: 7, y: 1 }),
  mkExt("e3", { x: 1, y: 2 }, 5, { x: 4, y: 3 }),
  mkExt("e4", { x: -2, y: 1 }, 10, { x: 2, y: 3 }),
];
