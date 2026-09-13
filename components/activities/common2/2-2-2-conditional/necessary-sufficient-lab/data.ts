// 충분조건과 필요조건 — 활동 데이터
//
//  명제 p → q 가 참일 때 p ⇒ q 로 쓰고
//      p 는 q 이기 위한 충분조건,  q 는 p 이기 위한 필요조건
//  이라고 한다. 조건 p, q 의 진리집합을 P, Q 라 하면
//      p ⇒ q  ⟺  P ⊂ Q
//  이므로 충분조건 쪽이 좁고(강하고) 필요조건 쪽이 넓다(약하다).
//      P 에 들어가면 Q 는 저절로 따라온다        → 충분해서 줄 수 있다
//      Q 에 들어가야 P 에 들어갈 가능성이 생긴다 → 필요해서 받는다
//  P ⊂ Q 이고 Q ⊂ P 이면, 즉 P = Q 이면 p 는 q 이기 위한 필요충분조건이고 p ⇔ q 로 쓴다.
//  이때 p 와 q 는 표현만 다를 뿐 같은 뜻의 조건이다.

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

export function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 네 가지 관계 ─────────────────────────────────────────────
export type RelKind = "suf" | "nec" | "iff" | "none";

export const REL_ORDER: RelKind[] = ["suf", "nec", "iff", "none"];

export const REL_META: Record<RelKind, { label: string; short: string; arrow: string; set: string; emoji: string; tone: string; ring: string; soft: string }> = {
  suf: {
    label: "충분조건",
    short: "충분",
    arrow: "p \\Rightarrow q",
    set: "P \\subset Q",
    emoji: "🎁",
    tone: "text-sky-100",
    ring: "border-sky-400/60",
    soft: "bg-sky-400/15",
  },
  nec: {
    label: "필요조건",
    short: "필요",
    arrow: "q \\Rightarrow p",
    set: "Q \\subset P",
    emoji: "🛡️",
    tone: "text-amber-100",
    ring: "border-amber-400/60",
    soft: "bg-amber-400/15",
  },
  iff: {
    label: "필요충분조건",
    short: "필요충분",
    arrow: "p \\Leftrightarrow q",
    set: "P = Q",
    emoji: "🤝",
    tone: "text-emerald-100",
    ring: "border-emerald-400/60",
    soft: "bg-emerald-400/15",
  },
  none: {
    label: "아무 조건도 아님",
    short: "아무것도",
    arrow: "p \\ne q",
    set: "P \\not\\subset Q",
    emoji: "🚫",
    tone: "text-rose-100",
    ring: "border-rose-400/60",
    soft: "bg-rose-400/15",
  },
};

/** p 는 q 이기 위한 무슨 조건인가 — 진리집합의 포함 관계로 정한다. */
export function relOfSets(P: number[], Q: number[]): RelKind {
  const pq = P.every((n) => Q.includes(n));
  const qp = Q.every((n) => P.includes(n));
  if (pq && qp) return "iff";
  if (pq) return "suf";
  if (qp) return "nec";
  return "none";
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 화살표 놓기
// ══════════════════════════════════════════════════════════════
export type ArrowTask = {
  id: string;
  /** 조건이 놓인 범위 */
  scope: string;
  p: Piece[];
  q: Piece[];
  rel: RelKind;
  /** p 는 만족하지만 q 는 만족하지 않는 예 (p ⇒ q 가 거짓일 때) */
  pqCounter?: string;
  /** q 는 만족하지만 p 는 만족하지 않는 예 (q ⇒ p 가 거짓일 때) */
  qpCounter?: string;
  tip: string;
  why: string;
};

export const ARROWS: ArrowTask[] = [
  {
    id: "t1",
    scope: "x는 실수",
    p: [{ tex: "x = 2" }],
    q: [{ tex: "x^2 = 4" }],
    rel: "suf",
    qpCounter: "x = −2 는 q 를 만족하지만 p 를 만족하지 않아요.",
    tip: "x = 2 를 제곱하면 반드시 4가 돼요. 거꾸로도 그럴까요?",
    why: "P = {2} 가 Q = {2, −2} 안에 쏙 들어가요. 좁은 쪽이 충분조건, 넓은 쪽이 필요조건이랍니다.",
  },
  {
    id: "t2",
    scope: "x는 실수",
    p: [{ tex: "|x| \\le 1" }],
    q: [{ tex: "-2 \\le x \\le 2" }],
    rel: "suf",
    qpCounter: "x = 1.5 는 q 를 만족하지만 p 를 만족하지 않아요.",
    tip: "|x| ≤ 1 은 −1 ≤ x ≤ 1 과 같은 말이에요. 두 구간을 수직선에 그려 보세요.",
    why: "좁은 구간이 넓은 구간 안에 들어가요. 좁은 조건이 넓은 조건의 충분조건이 됩니다.",
  },
  {
    id: "t3",
    scope: "x는 실수",
    p: [{ tex: "x = 0" }, { pre: "또는" }, { tex: "x = 1" }],
    q: [{ tex: "x^2 - x = 0" }],
    rel: "iff",
    tip: "q 를 인수분해하면 x(x − 1) = 0 이에요.",
    why: "두 진리집합이 {0, 1} 로 완전히 같아요. 표현만 다를 뿐 같은 뜻의 조건이랍니다.",
  },
  {
    id: "t4",
    scope: "x는 자연수",
    p: [{ pre: "x는 짝수이다" }],
    q: [{ pre: "x는 4의 배수이다" }],
    rel: "nec",
    pqCounter: "x = 2 는 짝수지만 4의 배수가 아니에요.",
    tip: "이번에는 어느 쪽이 더 넓은 조건인지 잘 살펴보세요.",
    why: "4의 배수는 모두 짝수이므로 Q 가 P 안에 들어가요. 넓은 쪽인 p 가 필요조건이 됩니다.",
  },
  {
    id: "t5",
    scope: "x는 자연수",
    p: [{ pre: "x는 소수이다" }],
    q: [{ pre: "x는 홀수이다" }],
    rel: "none",
    pqCounter: "x = 2 는 소수지만 홀수가 아니에요.",
    qpCounter: "x = 9 는 홀수지만 소수가 아니에요.",
    tip: "양쪽으로 반례를 하나씩 찾아보세요.",
    why: "어느 쪽도 다른 쪽을 품지 못해요. 두 방향 모두 반례가 있으니 아무 조건도 되지 못합니다.",
  },
  {
    id: "t6",
    scope: "x는 삼각형",
    p: [{ pre: "x는 정삼각형이다" }],
    q: [{ pre: "x는 이등변삼각형이다" }],
    rel: "suf",
    qpCounter: "두 변만 길이가 같은 이등변삼각형은 정삼각형이 아니에요.",
    tip: "세 변이 모두 같으면 두 변도 당연히 같지요.",
    why: "정삼각형은 모두 이등변삼각형이지만 그 반대는 아니에요. 좁은 쪽이 충분조건입니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 범위 실험실 — 수직선 위의 두 구간
// ══════════════════════════════════════════════════════════════
export const NL = {
  w: 640,
  h: 176,
  x0: 46,
  x1: 594,
  from: -6,
  to: 6,
  /** 조건 p 의 막대 · 조건 q 의 막대 · 수직선 */
  pY: 46,
  qY: 84,
  axY: 126,
  barH: 16,
};

/** 고정된 조건 q 의 구간 */
export const Q_RANGE = { lo: -2, hi: 2 };
// 슬라이더 양끝을 모두 밀어도 구간이 수직선 [−6, 6] 안에 머물도록 잡았다
export const C_MIN = -3;
export const C_MAX = 3;
export const W_MIN = 0;
export const W_MAX = 3;
export const STEP = 0.5;

export function nlX(v: number): number {
  return NL.x0 + ((v - NL.from) / (NL.to - NL.from)) * (NL.x1 - NL.x0);
}

const EPS = 1e-9;

/** p : c − w ≤ x ≤ c + w 가 q : −2 ≤ x ≤ 2 에 대해 무슨 조건인가 */
export function relOfRange(c: number, w: number): RelKind {
  const lo = c - w;
  const hi = c + w;
  const pInQ = lo >= Q_RANGE.lo - EPS && hi <= Q_RANGE.hi + EPS;
  const qInP = lo <= Q_RANGE.lo + EPS && hi >= Q_RANGE.hi - EPS;
  if (pInQ && qInP) return "iff";
  if (pInQ) return "suf";
  if (qInP) return "nec";
  return "none";
}

export function inP(x: number, c: number, w: number): boolean {
  return x >= c - w - EPS && x <= c + w + EPS;
}
export function inQ(x: number): boolean {
  return x >= Q_RANGE.lo - EPS && x <= Q_RANGE.hi + EPS;
}

export const RANGE_PRESETS: { id: string; label: string; c: number; w: number }[] = [
  { id: "r1", label: "|x| ≤ 1", c: 0, w: 1 },
  { id: "r2", label: "|x| ≤ 2", c: 0, w: 2 },
  { id: "r3", label: "|x| ≤ 3", c: 0, w: 3 },
  { id: "r4", label: "0 ≤ x ≤ 4", c: 2, w: 2 },
];

/** 숫자를 화면 글자로 (음수는 유니코드 빼기표) */
export function num(v: number): string {
  const r = Math.round(v * 10) / 10;
  const s = Number.isInteger(r) ? String(Math.abs(r)) : String(Math.abs(r));
  return r < 0 ? "−" + s : s;
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 같은 뜻 짝 찾기 (필요충분조건)
// ══════════════════════════════════════════════════════════════
export type MatchCard = {
  id: string;
  pairId: string;
  side: "L" | "R";
  cond: Piece[];
  test: (x: number) => boolean;
};

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

export const MATCHES: MatchCard[] = [
  { id: "L1", pairId: "m1", side: "L", cond: [{ tex: "x^2 - x = 0" }], test: (x) => near(x * x - x, 0) },
  { id: "L2", pairId: "m2", side: "L", cond: [{ tex: "|x| \\le 1" }], test: (x) => Math.abs(x) <= 1 + 1e-9 },
  { id: "L3", pairId: "m3", side: "L", cond: [{ tex: "x^2 = 4" }], test: (x) => near(x * x, 4) },
  { id: "L4", pairId: "m4", side: "L", cond: [{ tex: "x^3 = 8" }], test: (x) => near(x * x * x, 8) },
  { id: "L5", pairId: "m5", side: "L", cond: [{ tex: "(x-1)(x-3) < 0" }], test: (x) => (x - 1) * (x - 3) < -1e-9 },
  { id: "L6", pairId: "m6", side: "L", cond: [{ tex: "x + 2 > 5" }], test: (x) => x + 2 > 5 + 1e-9 },

  { id: "R1", pairId: "m1", side: "R", cond: [{ tex: "x = 0" }, { pre: "또는" }, { tex: "x = 1" }], test: (x) => near(x, 0) || near(x, 1) },
  { id: "R2", pairId: "m2", side: "R", cond: [{ tex: "-1 \\le x \\le 1" }], test: (x) => x >= -1 - 1e-9 && x <= 1 + 1e-9 },
  { id: "R3", pairId: "m3", side: "R", cond: [{ tex: "x = 2" }, { pre: "또는" }, { tex: "x = -2" }], test: (x) => near(x, 2) || near(x, -2) },
  { id: "R4", pairId: "m4", side: "R", cond: [{ tex: "x = 2" }], test: (x) => near(x, 2) },
  { id: "R5", pairId: "m5", side: "R", cond: [{ tex: "1 < x < 3" }], test: (x) => x > 1 + 1e-9 && x < 3 - 1e-9 },
  { id: "R6", pairId: "m6", side: "R", cond: [{ tex: "x > 3" }], test: (x) => x > 3 + 1e-9 },
];

export const MATCH_L = MATCHES.filter((c) => c.side === "L");
export const MATCH_R = MATCHES.filter((c) => c.side === "R");

/** 두 조건이 갈리는 x 를 찾아 준다(짝이 아님을 보여 주는 반례). */
export const SAMPLE_X: number[] = (() => {
  const xs: number[] = [];
  for (let v = -600; v <= 600; v += 25) xs.push(v / 100);
  return xs;
})();

export function splitAt(a: MatchCard, b: MatchCard): { x: number; inA: boolean } | null {
  for (const x of SAMPLE_X) {
    const ta = a.test(x);
    const tb = b.test(x);
    if (ta !== tb) return { x, inA: ta };
  }
  return null;
}

/** 왼쪽 카드가 세로로 놓이는 차례 · 오른쪽 카드가 놓이는 차례 (무작위를 쓰지 않아 서버 렌더와 어긋나지 않는다) */
export const MATCH_L_ORDER = [0, 1, 2, 3, 4, 5];
export const MATCH_R_ORDER = [3, 0, 5, 2, 4, 1];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 충분·필요 스피드 판정
// ══════════════════════════════════════════════════════════════
export const SPEED_SECONDS = 60;
export const SPEED_PENALTY = 5;
export const SPEED_MODE = "speed60";

export const SPEED_U = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let f = 2; f * f <= n; f++) if (n % f === 0) return false;
  return true;
};

export type SpeedCond = { id: string; cond: Piece[]; test: (n: number) => boolean };

export const SPEED_CONDS: SpeedCond[] = [
  { id: "even", cond: [{ pre: "x는 짝수이다" }], test: (n) => n % 2 === 0 },
  { id: "odd", cond: [{ pre: "x는 홀수이다" }], test: (n) => n % 2 === 1 },
  { id: "m4", cond: [{ pre: "x는 4의 배수이다" }], test: (n) => n % 4 === 0 },
  { id: "m3", cond: [{ pre: "x는 3의 배수이다" }], test: (n) => n % 3 === 0 },
  { id: "m6", cond: [{ pre: "x는 6의 배수이다" }], test: (n) => n % 6 === 0 },
  { id: "d12", cond: [{ pre: "x는 12의 약수이다" }], test: (n) => 12 % n === 0 },
  { id: "d8", cond: [{ pre: "x는 8의 약수이다" }], test: (n) => 8 % n === 0 },
  { id: "prime", cond: [{ pre: "x는 소수이다" }], test: isPrime },
  { id: "sq", cond: [{ pre: "x는 제곱수이다" }], test: (n) => Number.isInteger(Math.sqrt(n)) },
  { id: "gt6", cond: [{ tex: "x > 6" }], test: (n) => n > 6 },
  { id: "ge7", cond: [{ tex: "x \\ge 7" }], test: (n) => n >= 7 },
  { id: "lt5", cond: [{ tex: "x < 5" }], test: (n) => n < 5 },
  { id: "le4", cond: [{ tex: "x \\le 4" }], test: (n) => n <= 4 },
  { id: "even3", cond: [{ pre: "x는 짝수이면서 3의 배수이다" }], test: (n) => n % 2 === 0 && n % 3 === 0 },
  { id: "even4", cond: [{ pre: "x는 2의 배수이면서 4의 배수이다" }], test: (n) => n % 2 === 0 && n % 4 === 0 },
  { id: "m12", cond: [{ pre: "x는 12의 배수이다" }], test: (n) => n % 12 === 0 },
  { id: "d4", cond: [{ pre: "x는 4의 약수이다" }], test: (n) => 4 % n === 0 },
  { id: "d9", cond: [{ pre: "x는 9의 약수이다" }], test: (n) => 9 % n === 0 },
  { id: "lt3", cond: [{ tex: "x < 3" }], test: (n) => n < 3 },
  { id: "ge10", cond: [{ tex: "x \\ge 10" }], test: (n) => n >= 10 },
  { id: "pow2", cond: [{ pre: "x는 2의 거듭제곱이다" }], test: (n) => Number.isInteger(Math.log2(n)) },
];

export function speedSet(c: SpeedCond): number[] {
  return SPEED_U.filter((n) => c.test(n));
}

export type SpeedItem = { key: string; p: SpeedCond; q: SpeedCond; answer: RelKind };

/** 모든 순서쌍을 답의 종류별로 미리 갈라 둔다 — 네 가지가 고르게 나오도록. */
export const SPEED_BUCKETS: Record<RelKind, SpeedItem[]> = (() => {
  const out: Record<RelKind, SpeedItem[]> = { suf: [], nec: [], iff: [], none: [] };
  for (const p of SPEED_CONDS) {
    for (const q of SPEED_CONDS) {
      if (p.id === q.id) continue;
      const rel = relOfSets(speedSet(p), speedSet(q));
      out[rel].push({ key: `${p.id}>${q.id}`, p, q, answer: rel });
    }
  }
  return out;
})();

export function makeSpeedItem(prevKey?: string): SpeedItem {
  for (let guard = 0; guard < 200; guard++) {
    const kind = REL_ORDER[Math.floor(Math.random() * REL_ORDER.length)];
    const bucket = SPEED_BUCKETS[kind];
    if (bucket.length === 0) continue;
    const it = bucket[Math.floor(Math.random() * bucket.length)];
    if (it.key === prevKey) continue;
    return it;
  }
  return SPEED_BUCKETS.suf[0];
}
