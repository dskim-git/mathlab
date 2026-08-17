// 아폴로니오스의 원 — 활동 데이터
//
//  두 점 A, B 에서의 거리의 비가 m : n (m ≠ n) 인 점 P 의 자취는 원이다.
//      n·PA = m·PB  ⇔  n²·PA² = m²·PB²
//      n²{(x−a₁)² + (y−b₁)²} = m²{(x−a₂)² + (y−b₂)²}
//      ⇒ (n²−m²)(x²+y²) − 2(n²a₁ − m²a₂)x − 2(n²b₁ − m²b₂)y + (n²|A|² − m²|B|²) = 0
//  이 원의 지름의 양 끝점은 선분 AB 를 m : n 으로 내분·외분하는 점이다.
//  m = n 이면 (n²−m²) = 0 이라 일차식이 남고, 자취는 선분 AB 의 수직이등분선이 된다.
//
//  같은 방식으로 거리 조건을 바꾸면 다른 도형이 나온다.
//      PA² + PB² = k  →  원 (중심은 AB 의 중점)
//      PA² − PB² = k  →  직선 (AB 에 수직)

export type Pt = { x: number; y: number };

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
export function fv(f: Frac): number {
  return f.d === 0 ? Number.NaN : f.n / f.d;
}
export function fracTex(f: Frac): string {
  if (f.d === 1) return String(f.n);
  return f.n < 0 ? `-\\frac{${-f.n}}{${f.d}}` : `\\frac{${f.n}}{${f.d}}`;
}
export function fracPlain(f: Frac): string {
  const s = f.n < 0 ? "−" : "";
  const a = Math.abs(f.n);
  return f.d === 1 ? `${s}${a}` : `${s}${a}/${f.d}`;
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
export function radTex(q: number): string {
  if (q <= 0) return "0";
  const { k, r } = simpRad(q);
  if (r === 1) return String(k);
  return k === 1 ? `\\sqrt{${r}}` : `${k}\\sqrt{${r}}`;
}

// ─── 식 조판 ──────────────────────────────────────────────────
function shiftTex(v: Frac, name: string): string {
  if (v.n === 0) return `${name}^2`;
  const abs: Frac = { n: Math.abs(v.n), d: v.d };
  return v.n > 0 ? `\\left(${name} - ${fracTex(abs)}\\right)^2` : `\\left(${name} + ${fracTex(abs)}\\right)^2`;
}
/** 표준형 (x−a)² + (y−b)² = r² (a, b, r² 는 유리수) */
export function stdTexF(a: Frac, b: Frac, r2: Frac): string {
  return `${shiftTex(a, "x")} + ${shiftTex(b, "y")} = ${fracTex(r2)}`;
}
/** 정수 계수 (k)(x²+y²) + Dx + Ey + F = 0 */
export function genIntTex(k: number, D: number, E: number, F: number): string {
  const lead = k === 1 ? "x^2 + y^2" : `${k}(x^2 + y^2)`;
  const t = (v: number, name: string) => {
    if (v === 0) return "";
    const abs = Math.abs(v);
    const body = name === "" ? `${abs}` : abs === 1 ? name : `${abs}${name}`;
    return (v < 0 ? " - " : " + ") + body;
  };
  return `${lead}${t(D, "x")}${t(E, "y")}${t(F, "")} = 0`;
}
/** ax + by + c = 0 */
export function lineTex(a: number, b: number, c: number): string {
  const first = (v: number, name: string) => {
    const abs = Math.abs(v);
    const body = abs === 1 ? name : `${abs}${name}`;
    return v < 0 ? `-${body}` : body;
  };
  const t = (v: number, name: string) => {
    if (v === 0) return "";
    const abs = Math.abs(v);
    const body = name === "" ? `${abs}` : abs === 1 ? name : `${abs}${name}`;
    return (v < 0 ? " - " : " + ") + body;
  };
  let s = "";
  if (a !== 0) s += first(a, "x");
  if (b !== 0) s += s === "" ? first(b, "y") : t(b, "y");
  if (c !== 0 || s === "") s += s === "" ? String(c) : t(c, "");
  return `${s} = 0`;
}

// ─── 아폴로니오스의 원 ────────────────────────────────────────
export type Apollo =
  | {
      kind: "circle";
      /** 약분한 정수 계수: k(x²+y²) + Dx + Ey + F = 0 */
      k: number;
      D: number;
      E: number;
      F: number;
      center: { x: Frac; y: Frac };
      r2: Frac;
    }
  | { kind: "line"; a: number; b: number; c: number };

/** n·PA = m·PB 를 만족하는 점 P 의 자취. */
export function apolloniusOf(A: Pt, B: Pt, m: number, n: number): Apollo {
  const m2 = m * m;
  const n2 = n * n;
  const k = n2 - m2;
  const D = -2 * (n2 * A.x - m2 * B.x);
  const E = -2 * (n2 * A.y - m2 * B.y);
  const F = n2 * (A.x ** 2 + A.y ** 2) - m2 * (B.x ** 2 + B.y ** 2);

  if (k === 0) {
    // 일차식 Dx + Ey + F = 0 (수직이등분선)
    const g = gcd(gcd(Math.abs(D), Math.abs(E)), Math.abs(F)) || 1;
    let [a, b, c] = [D / g, E / g, F / g];
    const lead = a !== 0 ? a : b;
    if (lead < 0) [a, b, c] = [-a, -b, -c];
    return { kind: "line", a, b, c };
  }

  const g = gcd(gcd(gcd(Math.abs(k), Math.abs(D)), Math.abs(E)), Math.abs(F)) || 1;
  const s = k < 0 ? -1 : 1;
  const kk = (k / g) * s;
  const DD = (D / g) * s;
  const EE = (E / g) * s;
  const FF = (F / g) * s;

  const cx = frac(-DD, 2 * kk);
  const cy = frac(-EE, 2 * kk);
  // r² = cx² + cy² − F/k
  const r2 = frac(cx.n * cx.n * (cy.d * cy.d) * kk + cy.n * cy.n * (cx.d * cx.d) * kk - FF * (cx.d * cx.d) * (cy.d * cy.d), kk * (cx.d * cx.d) * (cy.d * cy.d));
  return { kind: "circle", k: kk, D: DD, E: EE, F: FF, center: { x: cx, y: cy }, r2 };
}

/** 선분 AB 를 m : n 으로 내분하는 점 */
export function internalPoint(A: Pt, B: Pt, m: number, n: number): { x: Frac; y: Frac } {
  return { x: frac(m * B.x + n * A.x, m + n), y: frac(m * B.y + n * A.y, m + n) };
}
/** 선분 AB 를 m : n 으로 외분하는 점 (m ≠ n) */
export function externalPoint(A: Pt, B: Pt, m: number, n: number): { x: Frac; y: Frac } | null {
  if (m === n) return null;
  return { x: frac(m * B.x - n * A.x, m - n), y: frac(m * B.y - n * A.y, m - n) };
}

export function dist2(p: Pt, q: Pt): number {
  return (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
}

/** 비 선택지 — 분자·분모를 1~4 로 제한해 그림이 격자 안에 들어오게 한다. */
export const RATIOS: { m: number; n: number }[] = [
  { m: 1, n: 1 },
  { m: 1, n: 2 },
  { m: 2, n: 1 },
  { m: 1, n: 3 },
  { m: 3, n: 1 },
  { m: 2, n: 3 },
  { m: 3, n: 2 },
  { m: 3, n: 4 },
  { m: 4, n: 3 },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 거리 조건이 만드는 도형
// ══════════════════════════════════════════════════════════════
export type ShapeKind = "ratio" | "sum" | "diff";
export const SHAPE_META: Record<ShapeKind, { emoji: string; title: string; cond: string; result: string; tone: string }> = {
  ratio: { emoji: "⚖️", title: "거리의 비", cond: "PA : PB = m : n", result: "원 (아폴로니오스)", tone: "emerald" },
  sum: { emoji: "➕", title: "거리의 제곱의 합", cond: "PA^2 + PB^2 = k", result: "원 (중심은 AB의 중점)", tone: "sky" },
  diff: { emoji: "➖", title: "거리의 제곱의 차", cond: "PA^2 - PB^2 = k", result: "직선 (AB에 수직)", tone: "violet" },
};

/**
 * PA² + PB² = k 의 자취.
 *   2(x² + y²) − 2(a₁+a₂)x − 2(b₁+b₂)y + |A|² + |B|² − k = 0
 *   ⇒ 중심은 AB 의 중점, r² = k/2 − |AB|²/4
 */
export function sumLocus(A: Pt, B: Pt, k: number): { center: Pt; r2: number } {
  return { center: { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }, r2: k / 2 - dist2(A, B) / 4 };
}

/**
 * PA² − PB² = k 의 자취.
 *   −2(a₁−a₂)x − 2(b₁−b₂)y + |A|² − |B|² − k = 0
 */
export function diffLocus(A: Pt, B: Pt, k: number): { a: number; b: number; c: number } {
  const a = -2 * (A.x - B.x);
  const b = -2 * (A.y - B.y);
  const c = A.x ** 2 + A.y ** 2 - (B.x ** 2 + B.y ** 2) - k;
  const g = gcd(gcd(Math.abs(a), Math.abs(b)), Math.abs(c)) || 1;
  let [x, y, z] = [a / g, b / g, c / g];
  const lead = x !== 0 ? x : y;
  if (lead < 0) [x, y, z] = [-x, -y, -z];
  return { a: x, b: y, c: z };
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 두 원이 만나는 곳
// ══════════════════════════════════════════════════════════════
export type TwoCircleRel = "apart" | "outTouch" | "cross" | "inTouch" | "inside";
export const REL_LABEL: Record<TwoCircleRel, string> = {
  apart: "떨어져 있어요 (만나지 않음)",
  outTouch: "겉에서 한 점에 접해요",
  cross: "두 점에서 만나요",
  inTouch: "안에서 한 점에 접해요",
  inside: "한 원이 다른 원 안에 있어요",
};

export function twoCircleRel(c1: Pt, r1: number, c2: Pt, r2: number): TwoCircleRel {
  const d2 = dist2(c1, c2);
  const sum = (r1 + r2) ** 2;
  const dif = (r1 - r2) ** 2;
  if (d2 > sum) return "apart";
  if (d2 === sum) return "outTouch";
  if (d2 > dif) return "cross";
  if (d2 === dif) return "inTouch";
  return "inside";
}

/** 두 원의 교점(없으면 빈 배열). */
export function circleIntersections(c1: Pt, r1: number, c2: Pt, r2: number): Pt[] {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const d = Math.hypot(dx, dy);
  if (d === 0) return [];
  if (d > r1 + r2 + 1e-9 || d < Math.abs(r1 - r2) - 1e-9) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h2 = r1 * r1 - a * a;
  const h = h2 > 0 ? Math.sqrt(h2) : 0;
  const mx = c1.x + (a * dx) / d;
  const my = c1.y + (a * dy) / d;
  if (h === 0) return [{ x: mx, y: my }];
  return [
    { x: mx + (h * dy) / d, y: my - (h * dx) / d },
    { x: mx - (h * dy) / d, y: my + (h * dx) / d },
  ];
}

/** 두 원의 방정식을 뺀 일차식 (근축 · 만나면 공통현). */
export function radicalAxis(c1: Pt, r1: number, c2: Pt, r2: number): { a: number; b: number; c: number } {
  // (x²+y²−2c1x·x−2c1y·y+|c1|²−r1²) − (…c2…) = 0
  const a = -2 * c1.x + 2 * c2.x;
  const b = -2 * c1.y + 2 * c2.y;
  const c = c1.x ** 2 + c1.y ** 2 - r1 * r1 - (c2.x ** 2 + c2.y ** 2 - r2 * r2);
  const g = gcd(gcd(Math.abs(a), Math.abs(b)), Math.abs(c)) || 1;
  let [x, y, z] = [a / g, b / g, c / g];
  const lead = x !== 0 ? x : y;
  if (lead < 0) [x, y, z] = [-x, -y, -z];
  return { a: x, b: y, c: z };
}

/** 원 (중심 c, 반지름 r) 의 일반형 x²+y²+Dx+Ey+F=0 */
export function circleGen(c: Pt, r: number): { D: number; E: number; F: number } {
  return { D: -2 * c.x, E: -2 * c.y, F: c.x ** 2 + c.y ** 2 - r * r };
}
