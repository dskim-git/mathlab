// 직선의 방정식 — 활동 데이터
//
//  · 한 점 (x₁, y₁)을 지나고 기울기가 m 인 직선:  y − y₁ = m(x − x₁)
//  · 기울기가 0 인 직선:                        y = y₁      (x축에 평행)
//  · y축에 평행한 직선:                          x = x₁      (기울기 없음)
//  · 서로 다른 두 점을 지나는 직선:
//        x₁ ≠ x₂ 일 때  y − y₁ = {(y₂−y₁)/(x₂−x₁)}(x − x₁)
//        x₁ = x₂ 일 때  x = x₁

// ─── 분수 ─────────────────────────────────────────────────────
export type Frac = { n: number; d: number };
export type Pt = { x: number; y: number };

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** 기약분수로 정규화(분모는 항상 양수). 분모가 0이면 d = 0 으로 두어 “정할 수 없음”을 나타낸다. */
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

/** 소수(0.5 단위 등)를 분수로. */
export function fromDecimal(v: number): Frac {
  return mkFrac(Math.round(v * 12), 12);
}

/** 화면용 문자열. 예: 3, −2, 3/4 (마이너스는 유니코드 −) */
export function fracPlain(f: Frac): string {
  const sign = f.n < 0 ? "−" : "";
  const a = Math.abs(f.n);
  return f.d === 1 ? `${sign}${a}` : `${sign}${a}/${f.d}`;
}

/** LaTeX 문자열. */
export function fracTex(f: Frac): string {
  if (f.d === 1) return String(f.n);
  return f.n < 0 ? `-\\frac{${-f.n}}{${f.d}}` : `\\frac{${f.n}}{${f.d}}`;
}

// ─── 직선 ─────────────────────────────────────────────────────
export type LineSpec =
  | { kind: "h"; k: number } // y = k   (x축에 평행)
  | { kind: "v"; k: number } // x = k   (y축에 평행)
  | { kind: "s"; m: Frac; b: Frac }; // y = mx + b

/** n = y₁ − m·x₁ */
export function interceptOf(x1: number, y1: number, m: Frac): Frac {
  return mkFrac(y1 * m.d - m.n * x1, m.d);
}

/** 두 점을 지나는 직선의 기울기. 세로선이면 d = 0. */
export function slopeOf(a: Pt, b: Pt): Frac {
  return mkFrac(b.y - a.y, b.x - a.x);
}

/** y = mx + n 의 오른쪽 항 (m ≠ 0). */
function slopeTermTex(m: Frac): string {
  if (m.d === 1) {
    if (m.n === 1) return "x";
    if (m.n === -1) return "-x";
    return `${m.n}x`;
  }
  return `${fracTex(m)}x`;
}

function constTermTex(b: Frac): string {
  if (b.n === 0) return "";
  const abs: Frac = { n: Math.abs(b.n), d: b.d };
  return (b.n < 0 ? " - " : " + ") + fracTex(abs);
}

/** y = mx + n 전체. */
export function lineTex(m: Frac, b: Frac): string {
  if (m.n === 0) return `y = ${fracTex(b)}`;
  return `y = ${slopeTermTex(m)}${constTermTex(b)}`;
}

export function lineSpecTex(s: LineSpec): string {
  if (s.kind === "h") return `y = ${s.k}`;
  if (s.kind === "v") return `x = ${s.k}`;
  return lineTex(s.m, s.b);
}

/** 대입한 그대로의 점기울기 꼴. 예: y - (-1) = (-3)(x - (2)) */
export function pointSlopeSubTex(x1: number, y1: number, m: Frac): string {
  const wrap = (v: number) => (v < 0 ? `(${v})` : `${v}`);
  const mm = m.d === 1 ? wrap(m.n) : fracTex(m);
  return `y - ${wrap(y1)} = ${mm}(x - ${wrap(x1)})`;
}

/** 부호를 정리한 점기울기 꼴. 예: y + 1 = -3(x - 2) */
export function pointSlopeTidyTex(x1: number, y1: number, m: Frac): string {
  const left = y1 === 0 ? "y" : y1 > 0 ? `y - ${y1}` : `y + ${-y1}`;
  const right = x1 === 0 ? "x" : x1 > 0 ? `x - ${x1}` : `x + ${-x1}`;
  const coef =
    m.d === 1 ? (m.n === 1 ? "" : m.n === -1 ? "-" : `${m.n}`) : fracTex(m);
  return `${left} = ${coef}(${right})`;
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 한 점과 기울기 — 식 세우기 연습
// ══════════════════════════════════════════════════════════════
export type PsProblem = {
  id: string;
  story: string;
  x1: number;
  y1: number;
  m: Frac;
  hint: string;
  explain: string;
};

export const PS_PROBLEMS: PsProblem[] = [
  {
    id: "p1",
    story: "점 A(2, 3)을 지나고 기울기가 2인 직선",
    x1: 2,
    y1: 3,
    m: { n: 2, d: 1 },
    hint: "y − y₁ = m(x − x₁) 에 x₁ = 2, y₁ = 3, m = 2 를 그대로 넣어 보세요.",
    explain:
      "y − 3 = 2(x − 2) → y − 3 = 2x − 4 → y = 2x − 1. x = 2를 넣으면 y = 3 이므로 정말 점 A를 지나요.",
  },
  {
    id: "p2",
    story: "점 B(−1, 4)를 지나고 기울기가 −3인 직선",
    x1: -1,
    y1: 4,
    m: { n: -3, d: 1 },
    hint: "x₁ = −1 이므로 (x − x₁) = (x − (−1)) = (x + 1) 이 됩니다. 부호에 주의!",
    explain:
      "y − 4 = −3{x − (−1)} = −3(x + 1) → y − 4 = −3x − 3 → y = −3x + 1. x = −1을 넣으면 y = 4 예요.",
  },
  {
    id: "p3",
    story: "점 C(4, −2)를 지나고 기울기가 1/2 인 직선",
    x1: 4,
    y1: -2,
    m: { n: 1, d: 2 },
    hint: "y₁ = −2 이므로 왼쪽은 y − (−2) = y + 2 가 됩니다. 기울기는 1/2 로 그대로 두세요.",
    explain:
      "y + 2 = ½(x − 4) → y + 2 = ½x − 2 → y = ½x − 4. x = 4를 넣으면 y = −2 예요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 특별한 직선 — 직선 맞히기 퀴즈
// ══════════════════════════════════════════════════════════════
export type LineQuiz = {
  id: string;
  mode: "graph" | "cond"; // graph: 직선을 보고 식 고르기 / cond: 조건을 보고 식 고르기
  prompt: string;
  point?: Pt; // cond 형에서 먼저 보여 줄 점
  line: LineSpec;
  choices: string[]; // LaTeX
  answer: number;
  explain: string;
};

export const LINE_QUIZ: LineQuiz[] = [
  {
    id: "q1",
    mode: "graph",
    prompt: "초록색 직선의 방정식은 무엇일까요?",
    line: { kind: "h", k: 3 },
    choices: ["y = 3", "x = 3", "y = 3x", "x + y = 3"],
    answer: 0,
    explain:
      "직선 위 점들의 y좌표가 모두 3으로 일정해요. 기울기가 0이므로 y − 3 = 0(x − x₁) → y = 3 (x축에 평행).",
  },
  {
    id: "q2",
    mode: "graph",
    prompt: "초록색 직선의 방정식은 무엇일까요?",
    line: { kind: "v", k: -2 },
    choices: ["y = -2", "x = -2", "y = -2x", "x - y = -2"],
    answer: 1,
    explain:
      "직선 위 점들의 x좌표가 모두 −2로 일정해요. y축에 평행해서 기울기가 없으므로 x = −2 로 나타냅니다.",
  },
  {
    id: "q3",
    mode: "cond",
    prompt: "점 A(4, −1)을 지나고 x축에 평행한 직선",
    point: { x: 4, y: -1 },
    line: { kind: "h", k: -1 },
    choices: ["y = -1", "x = 4", "y = 4", "x = -1"],
    answer: 0,
    explain:
      "x축에 평행 ⇒ 기울기 0. y − (−1) = 0(x − 4) → y = −1. 지나는 점의 y좌표가 그대로 답이 돼요.",
  },
  {
    id: "q4",
    mode: "cond",
    prompt: "점 A(4, −1)을 지나고 y축에 평행한 직선",
    point: { x: 4, y: -1 },
    line: { kind: "v", k: 4 },
    choices: ["y = -1", "x = 4", "y = 4", "x = -1"],
    answer: 1,
    explain:
      "y축에 평행 ⇒ 기울기가 없어 점기울기 꼴을 못 써요. 대신 모든 점의 x좌표가 4 이므로 x = 4.",
  },
  {
    id: "q5",
    mode: "cond",
    prompt: "점 B(−3, 2)를 지나고 기울기가 0인 직선",
    point: { x: -3, y: 2 },
    line: { kind: "h", k: 2 },
    choices: ["x = -3", "y = 2", "y = 2x", "y = -3"],
    answer: 1,
    explain: "y − 2 = 0(x + 3) → y − 2 = 0 → y = 2. 기울기 0은 x축에 평행한 직선이에요.",
  },
  {
    id: "q6",
    mode: "graph",
    prompt: "초록색 직선의 방정식은 무엇일까요? (점 (−1, 3)을 지나요)",
    line: { kind: "s", m: { n: -1, d: 1 }, b: { n: 2, d: 1 } },
    choices: ["y = -x + 2", "y = x + 2", "y = -x - 2", "y = 2x + 2"],
    answer: 0,
    explain:
      "오른쪽으로 1칸 갈 때 아래로 1칸 내려가므로 m = −1. y − 3 = −{x − (−1)} = −(x + 1) → y = −x + 2.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 두 점을 지나는 직선 — 별 잇기 미션
// ══════════════════════════════════════════════════════════════
export type StarRound = {
  id: string;
  name: string;
  emoji: string;
  a: Pt;
  b: Pt;
  hint: string;
  explain: string;
};

/** 정답은 모두 node 로 검산해 두었다(주석의 값). */
export const STAR_ROUNDS: StarRound[] = [
  {
    id: "r1",
    name: "쌍둥이자리",
    emoji: "✨",
    a: { x: 1, y: 2 },
    b: { x: 4, y: 8 }, // m = 2, n = 0 → y = 2x
    hint: "기울기 = (y좌표의 차) ÷ (x좌표의 차) 예요. 8 − 2 와 4 − 1 을 각각 구해 보세요.",
    explain: "m = (8−2)/(4−1) = 6/3 = 2, y − 2 = 2(x − 1) → y = 2x. 원점도 지나는 직선이에요.",
  },
  {
    id: "r2",
    name: "별똥별자리",
    emoji: "☄️",
    a: { x: -2, y: 5 },
    b: { x: 2, y: -3 }, // m = -2, n = 1 → y = -2x + 1
    hint: "y좌표가 5에서 −3으로 줄었으니 기울기는 음수예요. 5 − (−3) 이 아니라 (−3) − 5 입니다.",
    explain:
      "m = (−3−5)/(2−(−2)) = −8/4 = −2, y − 5 = −2{x − (−2)} = −2(x + 2) → y = −2x + 1.",
  },
  {
    id: "r3",
    name: "나란히자리",
    emoji: "⭐",
    a: { x: -3, y: 4 },
    b: { x: 2, y: 4 }, // m = 0 → y = 4
    hint: "두 별의 y좌표가 같아요. 그러면 y좌표의 차가 0이 되겠죠?",
    explain: "m = (4−4)/(2−(−3)) = 0/5 = 0. 기울기가 0이므로 x축에 평행한 직선 y = 4 예요.",
  },
  {
    id: "r4",
    name: "곧추자리",
    emoji: "🌠",
    a: { x: 3, y: -4 },
    b: { x: 3, y: 2 }, // x좌표가 같음 → 기울기 없음 → x = 3
    hint: "두 별의 x좌표가 같아요. 기울기를 구하려면 0으로 나눠야 하는데… 가능할까요?",
    explain:
      "x좌표의 차가 0이라 (y의 차)÷0 은 정할 수 없어요 ⇒ 기울기가 없습니다. 두 점의 x좌표가 모두 3이므로 x = 3.",
  },
  {
    id: "r5",
    name: "은하수길",
    emoji: "🌌",
    a: { x: -4, y: -3 },
    b: { x: 2, y: 3 }, // m = 1, n = 1 → y = x + 1
    hint: "음수끼리의 뺄셈에 주의하세요. 3 − (−3) 과 2 − (−4) 를 구하면 됩니다.",
    explain: "m = (3−(−3))/(2−(−4)) = 6/6 = 1, y − (−3) = 1·{x − (−4)} → y = x + 1.",
  },
];
