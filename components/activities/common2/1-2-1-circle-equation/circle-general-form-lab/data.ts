// 원의 방정식의 표준형과 일반형 — 활동 데이터
//
//  표준형  (x−a)² + (y−b)² = r²
//  일반형  x² + y² + Ax + By + C = 0        (A² + B² − 4C > 0 일 때 원)
//
//  표준형 → 일반형 :  A = −2a,  B = −2b,  C = a² + b² − r²
//  일반형 → 표준형 :  (x + A/2)² + (y + B/2)² = (A² + B² − 4C)/4
//                    ⇒ 중심 (−A/2, −B/2),  r² = (A² + B² − 4C)/4
//
//  A² + B² − 4C = 0 이면 한 점, < 0 이면 나타내는 도형이 없다.

export type Pt = { x: number; y: number };

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
  if (q <= 0) return "0";
  const { k, r } = simpRad(q);
  if (r === 1) return String(k);
  return k === 1 ? `\\sqrt{${r}}` : `${k}\\sqrt{${r}}`;
}
export function radPlain(q: number): string {
  if (q <= 0) return "0";
  const { k, r } = simpRad(q);
  if (r === 1) return String(k);
  return k === 1 ? `√${r}` : `${k}√${r}`;
}

/** (x − a)² 항. a = 0 이면 x². */
function shiftTex(v: number, name: string): string {
  if (v === 0) return `${name}^2`;
  return v > 0 ? `(${name} - ${v})^2` : `(${name} + ${-v})^2`;
}

/** 표준형 LaTeX */
export function stdTex(a: number, b: number, r2: number | string): string {
  return `${shiftTex(a, "x")} + ${shiftTex(b, "y")} = ${r2}`;
}

/** 1차항·상수항을 부호와 함께. 0이면 생략. */
function term(k: number, v: string): string {
  if (k === 0) return "";
  const abs = Math.abs(k);
  const body = v === "" ? `${abs}` : abs === 1 ? v : `${abs}${v}`;
  return (k < 0 ? " - " : " + ") + body;
}

/** 일반형 LaTeX */
export function genTex(A: number, B: number, C: number): string {
  return `x^2 + y^2${term(A, "x")}${term(B, "y")}${term(C, "")} = 0`;
}

/** 일차식 pa·x + pb·y + pc = 0 을 LaTeX 로(변수 이름 지정 가능). 0인 항은 생략. */
export function linearTex(pa: number, pb: number, pc: number, xn = "x", yn = "y"): string {
  let s = "";
  const first = (k: number, v: string) => {
    const abs = Math.abs(k);
    const body = abs === 1 ? v : `${abs}${v}`;
    return k < 0 ? `-${body}` : body;
  };
  if (pa !== 0) s += first(pa, xn);
  if (pb !== 0) s += s === "" ? first(pb, yn) : term(pb, yn);
  if (pc !== 0 || s === "") s += s === "" ? String(pc) : term(pc, "");
  return `${s} = 0`;
}

/** 표준형 → 일반형 계수 */
export function toGeneral(a: number, b: number, r2: number): { A: number; B: number; C: number } {
  return { A: -2 * a, B: -2 * b, C: a * a + b * b - r2 };
}
/** 일반형 → 표준형 (판별값 D = A² + B² − 4C) */
export function toStandard(A: number, B: number, C: number): { a: number; b: number; r2: number; D: number } {
  const D = A * A + B * B - 4 * C;
  return { a: -A / 2, b: -B / 2, r2: D / 4, D };
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 표준형·일반형·원이 아닌 것 분류
// ══════════════════════════════════════════════════════════════
export type Kind = "std" | "gen" | "no";
export const KIND_LABEL: Record<Kind, string> = { std: "표준형", gen: "일반형", no: "원이 아님" };
export const KIND_EMOJI: Record<Kind, string> = { std: "🟢", gen: "🔵", no: "🚫" };

export type ClassifyCard = {
  id: string;
  tex: string;
  kind: Kind;
  /** 원일 때만 — 그래프용 */
  center?: Pt;
  r2?: number;
  explain: string;
};

export const CLASSIFY_CARDS: ClassifyCard[] = [
  {
    id: "k1",
    tex: "(x - 1)^2 + (y + 2)^2 = 9",
    kind: "std",
    center: { x: 1, y: -2 },
    r2: 9,
    explain: "(x−a)² + (y−b)² = r² 꼴 그대로예요. 중심 (1, −2), 반지름 3.",
  },
  {
    id: "k2",
    tex: "x^2 + y^2 - 4x + 6y + 4 = 0",
    kind: "gen",
    center: { x: 2, y: -3 },
    r2: 9,
    explain: "A = −4, B = 6, C = 4 → A²+B²−4C = 16+36−16 = 36 > 0 이라 원이에요. 중심 (2, −3), 반지름 3.",
  },
  {
    id: "k3",
    tex: "x^2 + y^2 = 16",
    kind: "std",
    center: { x: 0, y: 0 },
    r2: 16,
    explain: "중심이 원점인 표준형 x² + y² = r² 이에요. 반지름 4.",
  },
  {
    id: "k4",
    tex: "x^2 + y^2 + 2x - 4y + 9 = 0",
    kind: "no",
    explain: "A²+B²−4C = 4 + 16 − 36 = −16 < 0. 오른쪽이 음수가 되어 이 식을 만족하는 점이 하나도 없어요.",
  },
  {
    id: "k5",
    tex: "x^2 + y^2 - 6x + 2y + 10 = 0",
    kind: "no",
    explain: "A²+B²−4C = 36 + 4 − 40 = 0. (x−3)² + (y+1)² = 0 이라 점 (3, −1) 하나뿐이에요 — 원이 아니에요.",
  },
  {
    id: "k6",
    tex: "x^2 + y^2 + 8x - 2y - 8 = 0",
    kind: "gen",
    center: { x: -4, y: 1 },
    r2: 25,
    explain: "A = 8, B = −2, C = −8 → 64 + 4 + 32 = 100 > 0. 중심 (−4, 1), 반지름 5.",
  },
  {
    id: "k7",
    tex: "x^2 + 2y^2 - 4x = 0",
    kind: "no",
    explain: "x² 의 계수는 1인데 y² 의 계수가 2예요. 두 계수가 같아야 원이 될 수 있어요.",
  },
  {
    id: "k8",
    tex: "x^2 + y^2 + xy - 2 = 0",
    kind: "no",
    explain: "xy 항이 들어 있어요. 원의 방정식에는 xy 항이 없어야 해요.",
  },
  {
    id: "k9",
    tex: "(x - 4)^2 + y^2 = 5",
    kind: "std",
    center: { x: 4, y: 0 },
    r2: 5,
    explain: "y² 은 (y − 0)² 이니 중심 (4, 0), 반지름 √5 인 표준형이에요.",
  },
  {
    id: "k10",
    tex: "2x^2 + 2y^2 - 4x + 8y - 6 = 0",
    kind: "gen",
    center: { x: 1, y: -2 },
    r2: 8,
    explain:
      "x², y² 의 계수가 2로 같으니 양변을 2로 나누면 x² + y² − 2x + 4y − 3 = 0. 4 + 16 + 12 = 32 > 0 이라 원이에요. 중심 (1, −2), 반지름 2√2.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 표준형 ⇄ 일반형 변환
// ══════════════════════════════════════════════════════════════
export type ConvertQ = {
  id: string;
  dir: "toGen" | "toStd";
  a: number;
  b: number;
  r2: number;
  hint: string;
};

export const CONVERT_QUIZ: ConvertQ[] = [
  { id: "v1", dir: "toGen", a: 2, b: -3, r2: 16, hint: "(x−2)² = x² − 4x + 4, (y+3)² = y² + 6y + 9 로 전개해 보세요." },
  { id: "v2", dir: "toStd", a: 3, b: -4, r2: 16, hint: "x² − 6x 를 (x−3)² − 9 로, y² + 8y 를 (y+4)² − 16 으로 바꿔 보세요." },
  { id: "v3", dir: "toGen", a: -1, b: 2, r2: 9, hint: "A = −2a 이므로 a = −1 이면 A = 2 예요. 부호에 주의!" },
  { id: "v4", dir: "toStd", a: -2, b: 1, r2: 9, hint: "중심은 (−A/2, −B/2) 예요. A = 4 이면 중심의 x좌표는 −2." },
  { id: "v5", dir: "toGen", a: 0, b: 5, r2: 7, hint: "a = 0 이면 A = 0 이라 x 항이 사라져요." },
  { id: "v6", dir: "toStd", a: 1, b: -3, r2: 4, hint: "r² = (A² + B² − 4C) ÷ 4 로 한 번에 구할 수도 있어요." },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 세 점을 지나는 원 — 두 가지 방법
// ══════════════════════════════════════════════════════════════
/** 일반형에 대입해 A, B, C 를 차례로 구하는 단계 */
export type GenStep = { label: string; tex: string; answer: number; sym: string };

export type ThreePointProblem = {
  id: string;
  title: string;
  pts: [Pt, Pt, Pt];
  names: [string, string, string];
  center: Pt;
  r2: number;
  A: number;
  B: number;
  C: number;
  /** 원점을 지나면 일반형에서 C = 0 으로 시작할 수 있다. */
  throughOrigin: boolean;
  genSteps: GenStep[];
};

export const MAIN_PROBLEM: ThreePointProblem = {
  id: "m1",
  title: "세 점을 지나는 원 찾기",
  pts: [
    { x: 0, y: 0 },
    { x: 0, y: 2 },
    { x: 4, y: -2 },
  ],
  names: ["O", "P", "Q"],
  center: { x: 3, y: 1 },
  r2: 10,
  A: -6,
  B: -2,
  C: 0,
  throughOrigin: true,
  genSteps: [
    { label: "원점 O(0, 0) 을 대입", tex: "0 + 0 + 0 + 0 + C = 0 \\;\\Rightarrow\\; C =", answer: 0, sym: "C" },
    { label: "점 P(0, 2) 를 대입", tex: "0 + 4 + 0 + 2B + C = 0 \\;\\Rightarrow\\; B =", answer: -2, sym: "B" },
    { label: "점 Q(4, −2) 를 대입", tex: "16 + 4 + 4A - 2B + C = 0 \\;\\Rightarrow\\; A =", answer: -6, sym: "A" },
  ],
};

export const CHALLENGE_PROBLEM: ThreePointProblem = {
  id: "m2",
  title: "도전! 원점을 지나지 않는 원",
  pts: [
    { x: 1, y: 1 },
    { x: 5, y: 1 },
    { x: 1, y: 5 },
  ],
  names: ["A", "B", "C"],
  center: { x: 3, y: 3 },
  r2: 8,
  A: -6,
  B: -6,
  C: 10,
  throughOrigin: false,
  genSteps: [
    { label: "세 점을 대입한 식 ②에서 ①을 빼면", tex: "(26 + 5A + B + C) - (2 + A + B + C) = 0 \\;\\Rightarrow\\; A =", answer: -6, sym: "A" },
    { label: "식 ③에서 ①을 빼면", tex: "(26 + A + 5B + C) - (2 + A + B + C) = 0 \\;\\Rightarrow\\; B =", answer: -6, sym: "B" },
    { label: "구한 A, B 를 식 ①에 넣으면", tex: "2 + (-6) + (-6) + C = 0 \\;\\Rightarrow\\; C =", answer: 10, sym: "C" },
  ],
};

export function dist2(p: Pt, q: Pt): number {
  return (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
}

/** 두 점을 잇는 선분의 수직이등분선 ax + by + c = 0 (정수 계수). */
export function perpBisector(p: Pt, q: Pt): { a: number; b: number; c: number } {
  // |PX|² = |QX|² ⇒ 2(qx−px)x + 2(qy−py)y + (px²+py²−qx²−qy²) = 0
  const a = 2 * (q.x - p.x);
  const b = 2 * (q.y - p.y);
  const c = p.x ** 2 + p.y ** 2 - q.x ** 2 - q.y ** 2;
  const g = gcd3(Math.abs(a), Math.abs(b), Math.abs(c)) || 1;
  let [A, B, C] = [a / g, b / g, c / g];
  const lead = A !== 0 ? A : B;
  if (lead < 0) [A, B, C] = [-A, -B, -C];
  return { a: A, b: B, c: C };
}
function gcd2(a: number, b: number): number {
  return b === 0 ? a : gcd2(b, a % b);
}
function gcd3(a: number, b: number, c: number): number {
  return gcd2(gcd2(a, b), c);
}
