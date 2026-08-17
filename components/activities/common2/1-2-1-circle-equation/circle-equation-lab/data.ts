// 원의 방정식 — 활동 데이터
//
//  중심 C(a, b), 반지름 r 인 원 위의 점 P(x, y) 는 CP = r 을 만족하므로
//      √{(x−a)² + (y−b)²} = r   ⇒   (x−a)² + (y−b)² = r²      (표준형)
//  중심이 원점이면 x² + y² = r².
//
//  점 Q(x, y) 의 위치 판정 — (x−a)² + (y−b)² 를 r² 과 비교한다.
//      작으면 내부 · 같으면 원 위 · 크면 외부

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

/** √q 를 LaTeX 로. 예: 25 → 5, 20 → 2√5 */
export function radTex(q: number): string {
  if (q === 0) return "0";
  const { k, r } = simpRad(q);
  if (r === 1) return String(k);
  return k === 1 ? `\\sqrt{${r}}` : `${k}\\sqrt{${r}}`;
}

/** √q 를 화면용 문자열로. 예: 25 → 5, 20 → 2√5 */
export function radPlain(q: number): string {
  if (q === 0) return "0";
  const { k, r } = simpRad(q);
  if (r === 1) return String(k);
  return k === 1 ? `√${r}` : `${k}√${r}`;
}

/** (x − a)² 같은 항. a = 0 이면 x². */
function shiftTex(v: number, name: string): string {
  if (v === 0) return `${name}^2`;
  return v > 0 ? `(${name} - ${v})^2` : `(${name} + ${-v})^2`;
}

/** 표준형 (x−a)² + (y−b)² = r² 을 LaTeX 로. */
export function circleTex(a: number, b: number, r2: number | string): string {
  return `${shiftTex(a, "x")} + ${shiftTex(b, "y")} = ${r2}`;
}

/** 두 점의 거리의 제곱(정수 좌표면 정수). */
export function dist2(p: Pt, q: Pt): number {
  return (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
}

export type Verdict = "in" | "on" | "out";
export function verdictOf(q: Pt, c: Pt, r2: number): Verdict {
  const v = dist2(q, c);
  return v < r2 ? "in" : v === r2 ? "on" : "out";
}
export const VERDICT_LABEL: Record<Verdict, string> = { in: "원의 내부", on: "원 위", out: "원의 외부" };
export const VERDICT_SIGN: Record<Verdict, string> = { in: "<", on: "=", out: ">" };

// ══════════════════════════════════════════════════════════════
// 탭 ① 실생활 상황
// ══════════════════════════════════════════════════════════════
export type Probe = { p: Pt; name: string };
export type Scenario = {
  id: string;
  emoji: string;
  name: string;
  story: string;
  unit: string;
  centerName: string;
  center: Pt;
  r: number;
  inLabel: string;
  outLabel: string;
  onLabel: string;
  probes: Probe[];
};

/** 상황 설정은 모두 활동을 위해 정한 가상의 값이다(실측 자료가 아님). */
export const SCENARIOS: Scenario[] = [
  {
    id: "wifi",
    emoji: "📡",
    name: "교실 와이파이",
    story: "교실 한가운데 공유기를 두었더니 6 m 안쪽에서만 신호가 잡혀요.",
    unit: "m",
    centerName: "공유기",
    center: { x: 0, y: 0 },
    r: 6,
    inLabel: "신호가 잡혀요 📶",
    onLabel: "딱 경계! 신호가 끊길락 말락 😵",
    outLabel: "신호가 안 잡혀요 📵",
    probes: [
      { p: { x: 3, y: 4 }, name: "내 자리" },
      { p: { x: 0, y: -6 }, name: "교실 뒷문" },
      { p: { x: 5, y: 5 }, name: "복도 끝" },
    ],
  },
  {
    id: "delivery",
    emoji: "🛵",
    name: "배달 가능 지역",
    story: "가게에서 5 km 안까지만 배달해 줘요. 우리 집은 배달이 될까요?",
    unit: "km",
    centerName: "가게",
    center: { x: 3, y: 1 },
    r: 5,
    inLabel: "배달 가능! 🛵",
    onLabel: "딱 경계 — 배달 가능 지역의 끝 🛑",
    outLabel: "배달 불가 😢",
    probes: [
      { p: { x: 0, y: 1 }, name: "우리 집" },
      { p: { x: 0, y: 5 }, name: "학교" },
      { p: { x: 7, y: 5 }, name: "이모네" },
    ],
  },
  {
    id: "lighthouse",
    emoji: "🌊",
    name: "등대 불빛",
    story: "등대의 불빛은 6 km 떨어진 곳까지 닿아요. 배에서 불빛이 보일까요?",
    unit: "km",
    centerName: "등대",
    center: { x: -2, y: 2 },
    r: 6,
    inLabel: "불빛이 보여요 ✨",
    onLabel: "불빛이 겨우 닿는 자리 🔦",
    outLabel: "불빛이 닿지 않아요 🌑",
    probes: [
      { p: { x: -2, y: 8 }, name: "고깃배" },
      { p: { x: 1, y: 4 }, name: "여객선" },
      { p: { x: 4, y: 5 }, name: "화물선" },
    ],
  },
  {
    id: "dog",
    emoji: "🐕",
    name: "강아지 목줄",
    story: "말뚝에 4 m 목줄로 묶인 강아지! 강아지가 갈 수 있는 곳은 어디까지일까요?",
    unit: "m",
    centerName: "말뚝",
    center: { x: 2, y: -3 },
    r: 4,
    inLabel: "강아지가 갈 수 있어요 🐶",
    onLabel: "목줄이 팽팽하게 당겨진 자리 🦴",
    outLabel: "목줄이 닿지 않아요 🚫",
    probes: [
      { p: { x: 2, y: 1 }, name: "밥그릇" },
      { p: { x: 0, y: -2 }, name: "나무 그늘" },
      { p: { x: 6, y: 0 }, name: "고양이" },
    ],
  },
  {
    id: "tower",
    emoji: "📶",
    name: "기지국 통화권",
    story: "기지국에서 5 km 안이면 통화가 돼요. 캠핑장에서 전화를 걸 수 있을까요?",
    unit: "km",
    centerName: "기지국",
    center: { x: -3, y: -3 },
    r: 5,
    inLabel: "통화 가능 ☎️",
    onLabel: "통화권 경계 — 지직지직 📞",
    outLabel: "통화권 이탈 📵",
    probes: [
      { p: { x: 0, y: 1 }, name: "캠핑장" },
      { p: { x: -1, y: -2 }, name: "주차장" },
      { p: { x: 2, y: 1 }, name: "산 정상" },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 중심·반지름 ⇄ 방정식
// ══════════════════════════════════════════════════════════════
/** toEq : 중심·반지름 → 방정식 고르기 / toCR : 방정식 → 중심·반지름 구하기 */
export type CircleQ = {
  id: string;
  kind: "toEq" | "toCR";
  a: number;
  b: number;
  r2: number;
  /** toEq 전용 — 보기 */
  choices?: string[];
  answer?: number;
  /** toCR 전용 — 반지름 보기 */
  rChoices?: string[];
  rAnswer?: number;
  hint: string;
};

export const CIRCLE_QUIZ: CircleQ[] = [
  {
    id: "c1",
    kind: "toEq",
    a: 2,
    b: 3,
    r2: 16,
    choices: ["(x - 2)^2 + (y - 3)^2 = 16", "(x + 2)^2 + (y + 3)^2 = 16", "(x - 2)^2 + (y - 3)^2 = 4", "(x - 3)^2 + (y - 2)^2 = 16"],
    answer: 0,
    hint: "중심의 좌표는 빼 주고, 오른쪽에는 반지름의 제곱을 씁니다.",
  },
  {
    id: "c2",
    kind: "toCR",
    a: 3,
    b: -1,
    r2: 25,
    rChoices: ["5", "25", "\\sqrt{5}", "10"],
    rAnswer: 0,
    hint: "(y + 1)² 은 (y − (−1))² 이라는 뜻이에요. 부호에 주의!",
  },
  {
    id: "c3",
    kind: "toEq",
    a: -1,
    b: 4,
    r2: 9,
    choices: ["(x + 1)^2 + (y - 4)^2 = 9", "(x - 1)^2 + (y + 4)^2 = 9", "(x + 1)^2 + (y - 4)^2 = 3", "(x + 1)^2 + (y + 4)^2 = 9"],
    answer: 0,
    hint: "중심의 x좌표가 −1 이므로 (x − (−1))² = (x + 1)² 이 됩니다.",
  },
  {
    id: "c4",
    kind: "toCR",
    a: -4,
    b: 2,
    r2: 9,
    rChoices: ["3", "9", "\\sqrt{3}", "4"],
    rAnswer: 0,
    hint: "(x + 4)² 이므로 중심의 x좌표는 −4 예요.",
  },
  {
    id: "c5",
    kind: "toEq",
    a: 0,
    b: 0,
    r2: 36,
    choices: ["x^2 + y^2 = 36", "x^2 + y^2 = 6", "(x - 6)^2 + (y - 6)^2 = 36", "x^2 + y^2 = 12"],
    answer: 0,
    hint: "중심이 원점이면 a = b = 0 이라 x² + y² = r² 이 됩니다.",
  },
  {
    id: "c6",
    kind: "toCR",
    a: 0,
    b: -6,
    r2: 12,
    rChoices: ["2\\sqrt{3}", "12", "6", "4\\sqrt{3}"],
    rAnswer: 0,
    hint: "r² = 12 이므로 r = √12 를 간단히 하면 됩니다.",
  },
  {
    id: "c7",
    kind: "toEq",
    a: 0,
    b: -5,
    r2: 7,
    choices: ["x^2 + (y + 5)^2 = 7", "x^2 + (y - 5)^2 = 7", "x^2 + (y + 5)^2 = \\sqrt{7}", "(x + 5)^2 + y^2 = 7"],
    answer: 0,
    hint: "반지름이 √7 이면 오른쪽에는 (√7)² = 7 을 씁니다.",
  },
  {
    id: "c8",
    kind: "toCR",
    a: 1,
    b: 0,
    r2: 50,
    rChoices: ["5\\sqrt{2}", "50", "25", "2\\sqrt{5}"],
    rAnswer: 0,
    hint: "y² 은 (y − 0)² 이므로 중심의 y좌표는 0 이에요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 지름의 양 끝점 → 원의 방정식
// ══════════════════════════════════════════════════════════════
export type DiameterQ = {
  id: string;
  A: Pt;
  B: Pt;
  choices: string[];
  answer: number;
  hint: string;
};

export const DIAMETER_QUIZ: DiameterQ[] = [
  {
    id: "d1",
    A: { x: 1, y: 3 },
    B: { x: 5, y: -1 },
    choices: ["(x - 3)^2 + (y - 1)^2 = 8", "(x - 3)^2 + (y - 1)^2 = 32", "(x - 6)^2 + (y - 2)^2 = 8", "(x - 3)^2 + (y - 1)^2 = 4"],
    answer: 0,
    hint: "중심은 두 점의 중점, 반지름은 AB 길이의 절반이에요.",
  },
  {
    id: "d2",
    A: { x: -2, y: 4 },
    B: { x: 4, y: -4 },
    choices: ["(x - 1)^2 + y^2 = 25", "(x - 1)^2 + y^2 = 100", "(x + 1)^2 + y^2 = 25", "(x - 1)^2 + (y - 4)^2 = 25"],
    answer: 0,
    hint: "중점의 y좌표가 0 이면 (y − 0)² = y² 로 씁니다.",
  },
  {
    id: "d3",
    A: { x: -1, y: 2 },
    B: { x: 5, y: 2 },
    choices: ["(x - 2)^2 + (y - 2)^2 = 9", "(x - 2)^2 + (y - 2)^2 = 36", "(x - 2)^2 + (y - 2)^2 = 3", "(x + 2)^2 + (y + 2)^2 = 9"],
    answer: 0,
    hint: "두 점의 y좌표가 같아 지름이 가로로 놓였어요. 지름의 길이가 바로 보이죠?",
  },
  {
    id: "d4",
    A: { x: 2, y: -3 },
    B: { x: -2, y: 5 },
    choices: ["x^2 + (y - 1)^2 = 20", "x^2 + (y - 1)^2 = 80", "x^2 + (y + 1)^2 = 20", "x^2 + (y - 1)^2 = 5"],
    answer: 0,
    hint: "AB 길이의 제곱을 4로 나누면 반지름의 제곱이 됩니다.",
  },
];

/** 중점 */
export function midpoint(A: Pt, B: Pt): Pt {
  return { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
}
