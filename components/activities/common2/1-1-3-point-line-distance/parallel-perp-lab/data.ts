// 한 점을 지나는 평행선·수직선 (공학 도구 활동) — 활동 데이터
//
//  두 점 A(x₁,y₁), B(x₂,y₂) 를 지나는 직선을 일반형으로 두면
//      (y₂−y₁)x − (x₂−x₁)y + (x₂y₁ − x₁y₂) = 0
//  이 되고, 이 식은 AB 가 세로선(x₁ = x₂)일 때도 그대로 성립한다.
//
//  직선 ax + by + c = 0 에 대하여 점 C(p, q) 를 지나는
//      평행선 : ax + by − (ap + bq) = 0        (기울기가 같다)
//      수직선 : −bx + ay + (bp − aq) = 0        (법선벡터를 90° 돌린 것)
//  로 두면 기울기가 없는 경우(세로선)까지 한 번에 처리된다.

export type Pt = { x: number; y: number };
export type Gen = { a: number; b: number; c: number };
export type Frac = { n: number; d: number };

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function mkFrac(n: number, d: number): Frac {
  if (d === 0) return { n, d: 0 };
  const s = d < 0 ? -1 : 1;
  const nn = n * s;
  const dd = d * s;
  const g = gcd(Math.abs(nn), dd) || 1;
  return { n: nn / g, d: dd / g };
}
export function fracVal(f: Frac): number {
  return f.d === 0 ? Number.NaN : f.n / f.d;
}
export function fracPlain(f: Frac): string {
  const sign = f.n < 0 ? "−" : "";
  const a = Math.abs(f.n);
  return f.d === 1 ? `${sign}${a}` : `${sign}${a}/${f.d}`;
}
export function fracTex(f: Frac): string {
  if (f.d === 1) return String(f.n);
  return f.n < 0 ? `-\\frac{${-f.n}}{${f.d}}` : `\\frac{${f.n}}{${f.d}}`;
}

/** 정수 계수를 약분하고, 첫 0 아닌 계수가 음수면 전체 부호를 뒤집는다. */
export function reduce3(a: number, b: number, c: number): Gen {
  const g = gcd(gcd(Math.abs(a), Math.abs(b)), Math.abs(c)) || 1;
  let [x, y, z] = [a / g, b / g, c / g];
  const lead = x !== 0 ? x : y;
  if (lead < 0) [x, y, z] = [-x, -y, -z];
  return { a: x, b: y, c: z };
}

/** 두 점을 지나는 직선. 두 점이 같으면 null. */
export function lineThrough(A: Pt, B: Pt): Gen | null {
  if (A.x === B.x && A.y === B.y) return null;
  return reduce3(B.y - A.y, -(B.x - A.x), B.x * A.y - A.x * B.y);
}

/** 직선 g 에 평행하고 점 C 를 지나는 직선. */
export function parallelThrough(g: Gen, C: Pt): Gen {
  return reduce3(g.a, g.b, -(g.a * C.x + g.b * C.y));
}

/** 직선 g 에 수직이고 점 C 를 지나는 직선. */
export function perpThrough(g: Gen, C: Pt): Gen {
  return reduce3(-g.b, g.a, g.b * C.x - g.a * C.y);
}

/** 기울기 −a/b. 세로선(b = 0)이면 null. */
export function slopeOf(g: Gen): Frac | null {
  if (g.b === 0) return null;
  return mkFrac(-g.a, g.b);
}

/** 두 직선의 교점(평행하면 null). */
export function intersectionOf(g1: Gen, g2: Gen): Pt | null {
  const det = g1.a * g2.b - g2.a * g1.b;
  if (det === 0) return null;
  return {
    x: (g1.b * g2.c - g1.c * g2.b) / det,
    y: (g1.c * g2.a - g1.a * g2.c) / det,
  };
}

export function distancePointLine(p: Pt, g: Gen): number {
  return Math.abs(g.a * p.x + g.b * p.y + g.c) / Math.sqrt(g.a * g.a + g.b * g.b);
}

/** √n = k√r 로 분리. */
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
  const { k, r } = simpRad(q);
  if (r === 1) return String(k);
  return k === 1 ? `\\sqrt{${r}}` : `${k}\\sqrt{${r}}`;
}
/** p/√q 를 유리화·약분해 LaTeX 로. */
export function distTex(p: number, q: number): string {
  if (p === 0) return "0";
  const { k, r } = simpRad(q);
  if (r === 1) {
    const g = gcd(p, k) || 1;
    const den = k / g;
    return den === 1 ? `${p / g}` : `\\frac{${p / g}}{${den}}`;
  }
  const den0 = k * r;
  const g = gcd(p, den0) || 1;
  const num = p / g;
  const den = den0 / g;
  const numTex = num === 1 ? `\\sqrt{${r}}` : `${num}\\sqrt{${r}}`;
  return den === 1 ? numTex : `\\frac{${numTex}}{${den}}`;
}

// ─── LaTeX ────────────────────────────────────────────────────
function coefTerm(k: number, v: string, first: boolean): string {
  if (k === 0) return "";
  const neg = k < 0;
  const abs = Math.abs(k);
  const body = abs === 1 ? v : `${abs}${v}`;
  if (first) return neg ? `-${body}` : body;
  return neg ? ` - ${body}` : ` + ${body}`;
}

export function genTex(g: Gen): string {
  let s = "";
  let first = true;
  if (g.a !== 0) {
    s += coefTerm(g.a, "x", first);
    first = false;
  }
  if (g.b !== 0) {
    s += coefTerm(g.b, "y", first);
    first = false;
  }
  if (g.c !== 0 || first) s += first ? String(g.c) : g.c < 0 ? ` - ${-g.c}` : ` + ${g.c}`;
  return `${s} = 0`;
}

/** y = mx + n 또는 x = k 꼴. */
export function slopeTex(g: Gen): string {
  if (g.b === 0) {
    const k = mkFrac(-g.c, g.a);
    return `x = ${fracTex(k)}`;
  }
  const m = mkFrac(-g.a, g.b);
  const n = mkFrac(-g.c, g.b);
  if (m.n === 0) return `y = ${fracTex(n)}`;
  const mt = m.d === 1 && m.n === 1 ? "x" : m.d === 1 && m.n === -1 ? "-x" : `${fracTex(m)}x`;
  if (n.n === 0) return `y = ${mt}`;
  const abs: Frac = { n: Math.abs(n.n), d: n.d };
  return `y = ${mt}${n.n < 0 ? " - " : " + "}${fracTex(abs)}`;
}

/** 기울기를 사람이 읽는 문자열로. 세로선이면 '없음'. */
export function slopeLabel(g: Gen): string {
  const m = slopeOf(g);
  return m === null ? "없음" : fracPlain(m);
}

// ══════════════════════════════════════════════════════════════
// 프리셋 · 활동 데이터
// ══════════════════════════════════════════════════════════════
/** 교과서 예시 — A(−2,1), B(2,3), C(1,−1) */
export const TEXTBOOK = {
  A: { x: -2, y: 1 } as Pt,
  B: { x: 2, y: 3 } as Pt,
  C: { x: 1, y: -1 } as Pt,
};

/** 교과서 활동 — A(−3,6), B(1,−4), C(a,b) 는 학생이 정한다. */
export const TASK = {
  A: { x: -3, y: 6 } as Pt,
  B: { x: 1, y: -4 } as Pt,
};

/**
 * 삼각형 ABC 의 넓이 (신발끈 공식).
 * A(−3,6), B(1,−4) 일 때는 |5·Cx + 2·Cy + 3| 과 같아 C 가 정수점이면 넓이도 정수가 된다.
 */
export function triangleArea(A: Pt, B: Pt, C: Pt): number {
  return Math.abs(A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) / 2;
}

/** 탭③ 넓이 미션 목표값 */
export const AREA_TARGETS = [6, 10, 15];
