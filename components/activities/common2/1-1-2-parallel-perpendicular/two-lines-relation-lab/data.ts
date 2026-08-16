// 두 직선의 위치 관계 — 활동 데이터
//
//  표준형  y = mx + n,  y = m'x + n'
//    · m = m', n = n'  ⇔ 일치
//    · m = m', n ≠ n'  ⇔ 평행
//    · m ≠ m'          ⇔ 한 점에서 만남 (그중 mm' = −1 이면 수직)
//
//  일반형  ax + by + c = 0,  a'x + b'y + c' = 0   (abc ≠ 0, a'b'c' ≠ 0)
//    · 일치  a/a' = b/b' = c/c'
//    · 평행  a/a' = b/b' ≠ c/c'
//    · 교차  a/a' ≠ b/b'
//    · 수직  aa' + bb' = 0
//
//  이 활동은 b = 0(세로선)·c = 0(원점을 지나는 직선)까지 다루기 위해
//  나눗셈 대신 곱셈꼴 판정을 쓴다 — 비례식과 같은 뜻이면서 0에서도 안전하다.
//    ab' − a'b = 0  ⇔ 두 직선의 기울기가 같다(평행 또는 일치)
//    ac' − a'c = 0 이고 bc' − b'c = 0 이면 일치
//    aa' + bb' = 0  ⇔ 수직

// ─── 분수 ─────────────────────────────────────────────────────
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

/** 화면용 — 마이너스는 유니코드 −. 예: 3, −2, 3/4 */
export function fracPlain(f: Frac): string {
  const sign = f.n < 0 ? "−" : "";
  const a = Math.abs(f.n);
  return f.d === 1 ? `${sign}${a}` : `${sign}${a}/${f.d}`;
}

export function fracTex(f: Frac): string {
  if (f.d === 1) return String(f.n);
  return f.n < 0 ? `-\\frac{${-f.n}}{${f.d}}` : `\\frac{${f.n}}{${f.d}}`;
}

// ─── 직선 ─────────────────────────────────────────────────────
/** 표준형 y = mx + n */
export type StdLine = { form: "std"; m: Frac; n: Frac };
/** 일반형 ax + by + c = 0 (정수 계수) */
export type GenLine = { form: "gen"; a: number; b: number; c: number };
export type Line = StdLine | GenLine;

export type Gen = { a: number; b: number; c: number };

function reduce3(a: number, b: number, c: number): Gen {
  const g = gcd(gcd(Math.abs(a), Math.abs(b)), Math.abs(c)) || 1;
  let [x, y, z] = [a / g, b / g, c / g];
  // 보기 좋게: 첫 0 아닌 계수가 음수면 전체 부호를 뒤집는다.
  const lead = x !== 0 ? x : y;
  if (lead < 0) [x, y, z] = [-x, -y, -z];
  return { a: x, b: y, c: z };
}

/** 어떤 형태든 정수 계수 일반형으로. y = (p/q)x + (r/s) → (p·s)x − (q·s)y + (q·r) = 0 */
export function toGen(l: Line): Gen {
  if (l.form === "gen") return reduce3(l.a, l.b, l.c);
  const { m, n } = l;
  return reduce3(m.n * n.d, -m.d * n.d, m.d * n.n);
}

/** 일반형 → 표준형(기울기·y절편). b = 0 이면 기울기가 없다(null). */
export function toStd(g: Gen): { m: Frac; n: Frac } | null {
  if (g.b === 0) return null;
  return { m: mkFrac(-g.a, g.b), n: mkFrac(-g.c, g.b) };
}

export type Relation = "same" | "parallel" | "perp" | "cross";

export function relationOf(g1: Gen, g2: Gen): Relation {
  const det = g1.a * g2.b - g2.a * g1.b;
  if (det !== 0) return g1.a * g2.a + g1.b * g2.b === 0 ? "perp" : "cross";
  const sameLine = g1.a * g2.c - g2.a * g1.c === 0 && g1.b * g2.c - g2.b * g1.c === 0;
  return sameLine ? "same" : "parallel";
}

/** 두 직선의 교점(만나지 않으면 null). */
export function intersectionOf(g1: Gen, g2: Gen): { x: number; y: number } | null {
  const det = g1.a * g2.b - g2.a * g1.b;
  if (det === 0) return null;
  return {
    x: (g1.b * g2.c - g1.c * g2.b) / det,
    y: (g1.c * g2.a - g1.a * g2.c) / det,
  };
}

export const RELATION_META: Record<
  Relation,
  { label: string; short: string; emoji: string; tone: "violet" | "sky" | "rose" | "emerald"; hex: string }
> = {
  same: { label: "일치한다", short: "일치", emoji: "🟰", tone: "violet", hex: "#a78bfa" },
  parallel: { label: "평행하다", short: "평행", emoji: "🛤️", tone: "sky", hex: "#38bdf8" },
  perp: { label: "수직으로 만난다", short: "수직", emoji: "📐", tone: "rose", hex: "#fb7185" },
  cross: { label: "한 점에서 만난다", short: "교차", emoji: "✖️", tone: "emerald", hex: "#34d399" },
};

/** 보기 순서(퀴즈 4지선다에서 항상 같은 순서로 보여 준다). */
export const RELATION_ORDER: Relation[] = ["same", "parallel", "cross", "perp"];

// ─── LaTeX ────────────────────────────────────────────────────
function coefTermTex(k: Frac | number, v: string, first: boolean): string {
  const f: Frac = typeof k === "number" ? { n: k, d: 1 } : k;
  if (f.n === 0) return "";
  const neg = f.n < 0;
  const abs: Frac = { n: Math.abs(f.n), d: f.d };
  const body = abs.d === 1 && abs.n === 1 ? v : `${fracTex(abs)}${v}`;
  if (first) return neg ? `-${body}` : body;
  return neg ? ` - ${body}` : ` + ${body}`;
}

function constTermTex(k: Frac | number, first: boolean): string {
  const f: Frac = typeof k === "number" ? { n: k, d: 1 } : k;
  if (f.n === 0) return first ? "0" : "";
  const neg = f.n < 0;
  const abs: Frac = { n: Math.abs(f.n), d: f.d };
  if (first) return neg ? `-${fracTex(abs)}` : fracTex(abs);
  return (neg ? " - " : " + ") + fracTex(abs);
}

export function stdTex(m: Frac, n: Frac): string {
  if (m.n === 0) return `y = ${fracTex(n)}`;
  return `y = ${coefTermTex(m, "x", true)}${constTermTex(n, false)}`;
}

export function genTex(g: Gen): string {
  let s = "";
  let first = true;
  if (g.a !== 0) {
    s += coefTermTex(g.a, "x", first);
    first = false;
  }
  if (g.b !== 0) {
    s += coefTermTex(g.b, "y", first);
    first = false;
  }
  if (g.c !== 0 || first) {
    s += constTermTex(g.c, first);
  }
  return `${s} = 0`;
}

export function lineTex(l: Line): string {
  return l.form === "std" ? stdTex(l.m, l.n) : genTex({ a: l.a, b: l.b, c: l.c });
}

export const FORM_LABEL: Record<Line["form"], string> = {
  std: "표준형",
  gen: "일반형",
};

// ══════════════════════════════════════════════════════════════
// 탭 ② 위치 관계 퀴즈 — 10문제 (정답은 node 로 검산)
// ══════════════════════════════════════════════════════════════
export type QuizItem = { id: string; l1: Line; l2: Line; answer: Relation; explain: string };

const S = (mn: number, md: number, nn: number, nd: number): StdLine => ({
  form: "std",
  m: mkFrac(mn, md),
  n: mkFrac(nn, nd),
});
const Gn = (a: number, b: number, c: number): GenLine => ({ form: "gen", a, b, c });

export const QUIZ: QuizItem[] = [
  {
    id: "q1",
    l1: S(2, 1, 1, 1),
    l2: S(2, 1, -3, 1),
    answer: "parallel",
    explain: "기울기가 2로 같고 y절편이 1과 −3으로 다르므로 평행해요. (m = m', n ≠ n')",
  },
  {
    id: "q2",
    l1: S(3, 1, -2, 1),
    l2: S(-1, 3, 4, 1),
    answer: "perp",
    explain: "기울기의 곱이 3 × (−1/3) = −1 이므로 수직으로 만나요. (mm' = −1)",
  },
  {
    id: "q3",
    l1: Gn(2, -1, 3),
    l2: Gn(4, -2, 6),
    answer: "same",
    explain: "2/4 = (−1)/(−2) = 3/6 = 1/2 — a, b, c 의 비가 모두 같으므로 두 직선은 완전히 겹쳐요.",
  },
  {
    id: "q4",
    l1: Gn(1, 2, -4),
    l2: Gn(2, 4, 3),
    answer: "parallel",
    explain: "1/2 = 2/4 이지만 (−4)/3 은 다르므로 평행해요. (a/a' = b/b' ≠ c/c')",
  },
  {
    id: "q5",
    l1: S(1, 1, 1, 1),
    l2: Gn(2, -1, 1),
    answer: "cross",
    explain: "2x − y + 1 = 0 은 y = 2x + 1 이에요. 기울기가 1과 2로 다르니 한 점에서 만나고, 곱이 2 라서 수직은 아니에요.",
  },
  {
    id: "q6",
    l1: Gn(3, 4, -8),
    l2: S(4, 3, -2, 1),
    answer: "perp",
    explain: "3x + 4y − 8 = 0 의 기울기는 −3/4. (−3/4) × (4/3) = −1 이므로 수직이에요.",
  },
  {
    id: "q7",
    l1: Gn(2, 3, -6),
    l2: Gn(3, -2, 1),
    answer: "perp",
    explain: "aa' + bb' = 2×3 + 3×(−2) = 6 − 6 = 0 이므로 수직이에요. 일반형에서는 이 식이 가장 빨라요.",
  },
  {
    id: "q8",
    l1: S(-2, 1, 5, 1),
    l2: S(1, 1, -1, 1),
    answer: "cross",
    explain: "기울기가 −2와 1로 다르므로 한 점에서 만나요. 곱이 −2 이라 수직은 아니에요.",
  },
  {
    id: "q9",
    l1: Gn(1, 0, -3),
    l2: Gn(0, 1, -4),
    answer: "perp",
    explain:
      "x − 3 = 0 은 x = 3 (y축에 평행한 세로선), y − 4 = 0 은 y = 4 (x축에 평행한 가로선)이라 서로 수직이에요. aa' + bb' = 1×0 + 0×1 = 0 으로도 확인돼요.",
  },
  {
    id: "q10",
    l1: S(1, 2, -2, 1),
    l2: Gn(1, -2, -4),
    answer: "same",
    explain: "x − 2y − 4 = 0 을 정리하면 y = ½x − 2 — 두 식이 같은 직선이에요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 스피드 퀴즈 — 무작위 문제 생성
// ══════════════════════════════════════════════════════════════
export const SPEED_SECONDS = 60;
/** 오답 시 깎이는 시간(초) — 찍기 방지 */
export const WRONG_PENALTY = 3;
export const SPEED_MODE = "speed60";

function randInt(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 일반형 계수를 그 관계가 되도록 생성. */
function makePair(kind: Relation): [Gen, Gen] {
  let a = 0;
  let b = 0;
  while (a === 0 && b === 0) {
    a = randInt(-4, 4);
    b = randInt(-4, 4);
  }
  const c = randInt(-6, 6);
  let A: number;
  let B: number;
  let C: number;
  if (kind === "same") {
    const k = pick([2, 3, -1, -2]);
    [A, B, C] = [k * a, k * b, k * c];
  } else if (kind === "parallel") {
    const k = pick([1, 2, 3, -1, -2]);
    [A, B] = [k * a, k * b];
    C = k * c + pick([1, -1, 2, -2, 3]);
  } else if (kind === "perp") {
    const k = pick([1, 1, 2, -1]);
    [A, B, C] = [-k * b, k * a, randInt(-6, 6)];
  } else {
    do {
      A = randInt(-4, 4);
      B = randInt(-4, 4);
    } while ((A === 0 && B === 0) || a * B - A * b === 0 || a * A + b * B === 0);
    C = randInt(-6, 6);
  }
  // 첫 직선만 기약꼴로 다듬는다. 둘째 직선까지 약분하면 '일치' 문제의 두 식이
  // 똑같이 보여(2x−y+3=0 / 2x−y+3=0) 문제가 되지 않는다.
  return [reduce3(a, b, c), { a: A, b: B, c: C }];
}

/**
 * 일반형 Gen 을 화면에 보여 줄 형태로. 표준형은 기울기·y절편의 분모가 2 이하일 때만 —
 * 스피드 퀴즈에서 y = 5/7 x − 3/7 같은 식이 나오면 읽는 데만 시간이 걸린다.
 */
function asLine(g: Gen, preferStd: boolean): Line {
  if (preferStd) {
    const s = toStd(g);
    if (s && s.m.d <= 2 && s.n.d <= 2) return { form: "std", m: s.m, n: s.n };
  }
  return { form: "gen", a: g.a, b: g.b, c: g.c };
}

export type SpeedItem = { l1: Line; l2: Line; answer: Relation };

/** 무작위 문제 1개. 표준형·일반형을 섞어서 낸다. (클라이언트에서만 호출) */
export function makeSpeedItem(): SpeedItem {
  for (let tries = 0; tries < 24; tries++) {
    const kind = pick<Relation>(["same", "parallel", "perp", "cross", "perp", "cross"]);
    const [g1, g2] = makePair(kind);
    const answer = relationOf(g1, g2);
    const s1 = Math.random() < 0.5;
    // 일치는 두 식을 서로 다른 형태로 보여 준다 — 같은 형태면 글자까지 똑같아져 문제가 안 된다.
    const s2 = answer === "same" ? !s1 : Math.random() < 0.5;
    const l1 = asLine(g1, s1);
    const l2 = asLine(g2, s2);
    if (lineTex(l1) !== lineTex(l2)) return { l1, l2, answer };
  }
  // 안전망 — 두 식이 계속 같아 보이면 둘째 직선을 2배 한 일반형으로 낸다(같은 직선, 다른 식).
  const [g1, g2] = makePair("same");
  return {
    l1: asLine(g1, true),
    l2: { form: "gen", a: g2.a * 2, b: g2.b * 2, c: g2.c * 2 },
    answer: "same",
  };
}
