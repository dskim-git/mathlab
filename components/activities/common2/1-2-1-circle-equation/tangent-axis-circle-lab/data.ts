// 좌표축에 접하는 원 — 활동 데이터
//
//  핵심은 외우는 공식이 아니라 딱 한 줄이다.
//      원이 어떤 직선에 접한다  ⇔  중심에서 그 직선까지의 거리 = 반지름
//  좌표축까지의 거리는 중심의 좌표에서 바로 읽힌다.
//      x축까지의 거리 = |b|,   y축까지의 거리 = |a|
//  그래서
//      x축에 접함        ⇔ |b| = r   (중심의 y좌표가 ±r)
//      y축에 접함        ⇔ |a| = r   (중심의 x좌표가 ±r)
//      두 축에 모두 접함 ⇔ |a| = |b| = r
//  사분면별로 나오는 여덟 가지 식은 이 사실을 중심의 좌표에 그대로 넣은 결과일 뿐이다.

export type Pt = { x: number; y: number };

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
/** 수 대신 기호를 넣는 항. 예: sym = "r", sign = -1 → (x + r)^2 */
function shiftSymTex(sign: number, sym: string, name: string): string {
  return sign > 0 ? `(${name} - ${sym})^2` : `(${name} + ${sym})^2`;
}

/** 표준형 (수치) */
export function stdTex(a: number, b: number, r2: number | string): string {
  return `${shiftTex(a, "x")} + ${shiftTex(b, "y")} = ${r2}`;
}

// ─── 사분면 ───────────────────────────────────────────────────
export type Quad = { n: 1 | 2 | 3 | 4; sx: 1 | -1; sy: 1 | -1; label: string };
export const QUADRANTS: Quad[] = [
  { n: 2, sx: -1, sy: 1, label: "제2사분면" },
  { n: 1, sx: 1, sy: 1, label: "제1사분면" },
  { n: 3, sx: -1, sy: -1, label: "제3사분면" },
  { n: 4, sx: 1, sy: -1, label: "제4사분면" },
];

export type TangentMode = "x" | "y" | "both";
export const MODE_LABEL: Record<TangentMode, string> = {
  x: "x축에 접함",
  y: "y축에 접함",
  both: "두 축에 모두 접함",
};
export const MODE_EMOJI: Record<TangentMode, string> = { x: "↔️", y: "↕️", both: "✳️" };
/** 문장 안에서 이어 쓰는 꼴 — "…에 있고 x축에 접하며, …" */
export const MODE_VERB: Record<TangentMode, string> = {
  x: "x축에 접하며",
  y: "y축에 접하며",
  both: "두 축에 모두 접하며",
};
export const MODE_RULE: Record<TangentMode, string> = {
  x: "중심의 y좌표가 ±r",
  y: "중심의 x좌표가 ±r",
  both: "중심의 x좌표·y좌표가 모두 ±r",
};

/**
 * 중심을 (±a, ±b) 로 자유롭게 두었을 때의 기호 표준형.
 * a = r 이면 x 쪽이, b = r 이면 y 쪽이 저절로 r 로 바뀐다 —
 * 접하는 순간 교과서에 나오는 꼴이 되는 것을 눈으로 보게 하려는 것.
 */
export function symbolTexFree(q: Quad, aIsR: boolean, bIsR: boolean): string {
  const xs = shiftSymTex(q.sx, aIsR ? "r" : "a", "x");
  const ys = shiftSymTex(q.sy, bIsR ? "r" : "b", "y");
  return `${xs} + ${ys} = r^2`;
}

/** 중심을 (±a, ±b) 로 둔 사분면별 중심 좌표. */
export function centerFree(q: Quad, a: number, b: number): Pt {
  return { x: q.sx * a, y: q.sy * b };
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 미션
// ══════════════════════════════════════════════════════════════
export type MissionId = "x" | "y" | "both";
export const MISSIONS: { id: MissionId; emoji: string; text: string }[] = [
  { id: "x", emoji: "↔️", text: "x축에만 접하게 만들기" },
  { id: "y", emoji: "↕️", text: "y축에만 접하게 만들기" },
  { id: "both", emoji: "✳️", text: "두 축에 모두 접하게 만들기" },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 조건에서 원 찾기
// ══════════════════════════════════════════════════════════════
export type AxisStep = { label: string; tex: string; answer: number; sym: string };
export type AxisProblem = {
  id: string;
  title: string;
  mode: TangentMode;
  need: string;
  pts: Pt[];
  /** 답이 둘일 수도 있다. */
  solutions: { center: Pt; r: number }[];
  setup: string;
  steps: AxisStep[];
  explain: string;
};

export const AXIS_PROBLEMS: AxisProblem[] = [
  {
    id: "a1",
    title: "두 축에 모두 접하는 원",
    mode: "both",
    need: "점 1개",
    pts: [{ x: 2, y: 1 }],
    solutions: [
      { center: { x: 1, y: 1 }, r: 1 },
      { center: { x: 5, y: 5 }, r: 5 },
    ],
    setup: "중심이 제1사분면에 있고 두 축에 모두 접하므로 중심을 (r, r) 로 놓을 수 있어요.",
    steps: [
      {
        label: "점 (2, 1) 을 대입해 정리하면 (작은 해부터)",
        tex: "(2-r)^2 + (1-r)^2 = r^2 \\;\\Rightarrow\\; r^2 - 6r + 5 = 0 \\;\\Rightarrow\\; r =",
        answer: 1,
        sym: "r₁",
      },
      { label: "인수분해하면 해가 하나 더 있어요", tex: "(r-1)(r-5) = 0 \\;\\Rightarrow\\; r =", answer: 5, sym: "r₂" },
    ],
    explain:
      "미지수가 r 하나뿐이라 점 하나면 충분했어요. 다만 r 에 대한 이차방정식이라 답이 두 개 나올 수 있습니다 — 작은 원과 큰 원 둘 다 조건을 만족해요!",
  },
  {
    id: "a2",
    title: "x축에 접하는 원",
    mode: "x",
    need: "점 2개",
    pts: [
      { x: 1, y: 1 },
      { x: 7, y: 1 },
    ],
    solutions: [{ center: { x: 4, y: 5 }, r: 5 }],
    setup: "x축에 접하고 중심이 x축 위쪽에 있으므로 중심을 (a, r) 로 놓을 수 있어요.",
    steps: [
      { label: "두 점의 y좌표가 같으니 중심은 두 점의 한가운데", tex: "a = \\frac{1 + 7}{2} =", answer: 4, sym: "a" },
      { label: "점 (1, 1) 을 대입해 r 구하기", tex: "(1-4)^2 + (1-r)^2 = r^2 \\;\\Rightarrow\\; r =", answer: 5, sym: "r" },
    ],
    explain: "x축에 접한다는 조건이 b = r 을 알려 주어 미지수가 a, r 두 개로 줄었어요. 그래서 점 두 개면 충분합니다.",
  },
  {
    id: "a3",
    title: "y축에 접하는 원",
    mode: "y",
    need: "점 2개",
    pts: [
      { x: 1, y: 1 },
      { x: 1, y: 7 },
    ],
    solutions: [{ center: { x: 5, y: 4 }, r: 5 }],
    setup: "y축에 접하고 중심이 y축 오른쪽에 있으므로 중심을 (r, b) 로 놓을 수 있어요.",
    steps: [
      { label: "두 점의 x좌표가 같으니 중심은 두 점의 한가운데", tex: "b = \\frac{1 + 7}{2} =", answer: 4, sym: "b" },
      { label: "점 (1, 1) 을 대입해 r 구하기", tex: "(1-r)^2 + (1-4)^2 = r^2 \\;\\Rightarrow\\; r =", answer: 5, sym: "r" },
    ],
    explain:
      "앞 문제와 x, y 를 바꿔 놓은 데칼코마니예요. 답도 (x−4)²+(y−5)²=25 와 (x−5)²+(y−4)²=25 로 좌표가 뒤바뀐 꼴이 됩니다.",
  },
];

/** 필요한 점의 개수 — 미지수가 몇 개 남는지로 설명한다. */
export const NEED_CARDS: { emoji: string; title: string; unknowns: string; need: string; why: string }[] = [
  {
    emoji: "⭕",
    title: "그냥 원",
    unknowns: "a, b, r  (3개)",
    need: "서로 다른 세 점",
    why: "중심의 좌표와 반지름을 모두 모르니 조건이 세 개 필요해요.",
  },
  {
    emoji: "↔️",
    title: "한 축에 접하는 원",
    unknowns: "a, r  또는  b, r  (2개)",
    need: "서로 다른 두 점",
    why: "접한다는 조건이 |b| = r (또는 |a| = r) 을 알려 주어 미지수가 하나 줄어요.",
  },
  {
    emoji: "✳️",
    title: "두 축에 모두 접하는 원",
    unknowns: "r  (1개)",
    need: "점 한 개",
    why: "중심이 (±r, ±r) 로 정해져 남는 미지수는 r 하나뿐이에요.",
  },
];

export function dist2(p: Pt, q: Pt): number {
  return (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
}
