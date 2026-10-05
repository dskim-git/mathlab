// 함수의 극한과 그 성질 — 활동 데이터
//
//  · x 의 값이 a 가 아니면서 a 에 한없이 가까워질 때 f(x) 가 일정한 값 L 에
//    한없이 가까워지면 f(x) 는 L 에 수렴한다고 하고 L 을 극한값이라 한다.
//    정의에 "a 가 아니면서" 가 들어 있으므로 x = a 에서의 함숫값은 극한과 상관이 없다.
//    그래서 세 가지가 모두 일어날 수 있다.
//        ㉠ f(a) 가 L 과 같다        (이어진 그래프)
//        ㉡ f(a) 가 아예 없다        (한 점만 뚫린 그래프)
//        ㉢ f(a) 가 L 과 다르다      (한 점만 딴 자리에 찍힌 그래프)
//    셋 다 극한값은 똑같이 L 이다 — 이 활동의 뼈대다.
//
//  · 왼쪽에서 다가간 값과 오른쪽에서 다가간 값이 서로 다르면 '일정한 값에 가까워진다'
//    고 할 수 없으므로 극한이 없다. 계단처럼 뚝 끊긴 그래프가 그런 경우다.
//
//  · 극한의 성질 — lim f = L, lim g = M (L, M 은 실수) 일 때
//        lim (f ± g) = L ± M,   lim cf = cL,   lim fg = LM,
//        lim (f/g) = L/M  (단 M ≠ 0)
//    f 나 g 에 구멍이 있어도 극한값만 있으면 그대로 쓸 수 있다.
//
// ── 탭 ① 한없이 가까이 ────────────────────────────────────
//  · 여섯 함수를 '한 걸음 더 가까이' 단추로 10의 거듭제곱만큼씩 좁혀 가며 본다.
//    k 단계에서 x = a ∓ 10⁻ᵏ 이고, 그래프도 같은 폭으로 확대되어 점이 L 로 모인다.
//        3x - 4            a 2   L  2    이어짐
//        x² - 2x           a 3   L  3    이어짐
//        (x² - 5x + 6)/(x - 2)  a 2   L -1    x = 2 에서 뚫림  [= x - 3]
//        (2x² - 2)/(x - 1)      a 1   L  4    x = 1 에서 뚫림  [= 2(x + 1)]
//        1/x               a 2   L  0.5  이어짐
//        4 (상수함수)      a 1   L  4    x 가 무엇이든 늘 4
//
// ── 탭 ② 구멍이 있어도 ────────────────────────────────────
//  · 같은 극한값을 가지는 세 함수를 나란히 두고 함숫값만 다르다는 것을 본다.
//        세트 1 (a = 2, L = 3)
//            이어짐  x + 1                        f(2) = 3
//            뚫림    (x² - x - 2)/(x - 2)         f(2) 없음   [= x + 1]
//            어긋남  x + 1 (단 x ≠ 2), f(2) = 1   f(2) = 1
//        세트 2 (a = -1, L = -2)
//            이어짐  x - 1                        f(-1) = -2
//            뚫림    (x² - 1)/(x + 1)             f(-1) 없음  [= x - 1]
//            어긋남  x - 1 (단 x ≠ -1), f(-1) = 1 f(-1) = 1
//
// ── 탭 ③ 극한의 성질 ──────────────────────────────────────
//  · a = 2 에서 극한을 가지는 다섯 함수를 f 와 g 로 골라 조합한다.
//        x + 1                 L 3
//        x²                    L 4
//        5                     L 5
//        (x² - x - 2)/(x - 2)  L 3   (x = 2 에서 뚫림 — 구멍이 있어도 성질은 그대로)
//        x - 2                 L 0   (나눗셈에서 분모가 되면 성질 (4)를 쓸 수 없다)
//    실제로 x 를 2 에 가까이 보내 얻은 값과 성질로 예측한 값이 같은지 화면에서 견준다.
//
// ── 탭 ④ 그래프 탐정 ──────────────────────────────────────
//  · 그래프 여덟 장을 보고 극한값과 함숫값을 따로 답한다.
//    이어짐 2 · 뚫림 3 · 어긋남 1 · 끊김(극한 없음) 2 로 섞었다.
//    끊김 하나와 뚫림 하나는 실생활에서 가져왔다.
//        택배 요금  무게 2kg 을 경계로 3,000원에서 4,000원으로 뛴다 → 극한 없음
//        평균 속도  s(t) = t² + t 일 때 2초부터의 평균 속도는 (s(t) - s(2))/(t - 2) = t + 3
//                   t = 2 에서는 0 으로 나누게 되어 값이 없지만 극한은 5 — 순간 속도다
//    교통 요금과 거리의 수치는 이 활동을 위해 정한 가상의 값이다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}
export function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}

export type Piece = { pre?: string; tex?: string; post?: string };

// ══════════════════════════════════════════════════════════════
//  좌표평면
// ══════════════════════════════════════════════════════════════
export type Box = { xMin: number; xMax: number; yMin: number; yMax: number; gx: number; gy: number };

/** 그래프를 상자 안에서만 샘플링해 끊긴 조각들로 돌려준다 (1/x 처럼 치솟는 곳은 끊는다) */
export function samplePath(fn: (x: number) => number, from: number, to: number, box: Box, n = 160): [number, number][][] {
  const out: [number, number][][] = [];
  let cur: [number, number][] = [];
  const lo = Math.max(from, box.xMin);
  const hi = Math.min(to, box.xMax);
  if (hi <= lo) return out;
  for (let i = 0; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n;
    const y = fn(x);
    if (!Number.isFinite(y) || y < box.yMin || y > box.yMax) {
      if (cur.length > 1) out.push(cur);
      cur = [];
      continue;
    }
    cur.push([x, y]);
  }
  if (cur.length > 1) out.push(cur);
  return out;
}
/** 구간에서 함수가 지나는 y 범위를 보고 보기 좋은 상자를 만든다 */
export function zoomBox(fn: (x: number) => number, a: number, r: number, skip?: number): Box {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= 80; i++) {
    const x = a - r + (2 * r * i) / 80;
    if (skip !== undefined && Math.abs(x - skip) < r / 400) continue;
    const y = fn(x);
    if (!Number.isFinite(y)) continue;
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = -1;
    hi = 1;
  }
  const mid = (lo + hi) / 2;
  const half = Math.max((hi - lo) / 2, r / 4) * 1.6;
  return { xMin: a - r, xMax: a + r, yMin: mid - half, yMax: mid + half, gx: r / 2, gy: half / 2 };
}

// ══════════════════════════════════════════════════════════════
//  단계 문제
// ══════════════════════════════════════════════════════════════
export type StepBase = { id: string; ask: string; hint?: string; done?: string };
export type Step = StepBase &
  (
    | { kind: "choice"; options: Piece[][]; answer: number; explains: string[] }
    | { kind: "num"; answer: number; unit?: string }
  );

// ══════════════════════════════════════════════════════════════
//  탭 ① 한없이 가까이
// ══════════════════════════════════════════════════════════════
export type ZoomFn = {
  id: string;
  emoji: string;
  title: string;
  tex: string;
  fn: (x: number) => number;
  a: number;
  L: number;
  /** x = a 에서 함숫값이 있는가 */
  defined: boolean;
  note: string;
};

export const ZOOM_FNS: ZoomFn[] = [
  {
    id: "z1",
    emoji: "📈",
    title: "일차함수",
    tex: "f(x) = 3x - 4",
    fn: (x) => 3 * x - 4,
    a: 2,
    L: 2,
    defined: true,
    note: "끊긴 데 없이 이어진 그래프라 f(2) 가 그대로 극한값이에요.",
  },
  {
    id: "z2",
    emoji: "🏹",
    title: "이차함수",
    tex: "f(x) = x^2 - 2x",
    fn: (x) => x * x - 2 * x,
    a: 3,
    L: 3,
    defined: true,
    note: "휘어진 그래프여도 확대하면 거의 곧은 선처럼 보이고 한 점으로 모여요.",
  },
  {
    id: "z3",
    emoji: "🕳️",
    title: "구멍이 있는 식",
    tex: "f(x) = \\dfrac{x^2 - 5x + 6}{x - 2}",
    fn: (x) => (x * x - 5 * x + 6) / (x - 2),
    a: 2,
    L: -1,
    defined: false,
    note: "x = 2 를 넣으면 분모가 0 이라 값이 없어요. 그래도 가까이 가면 -1 에 모입니다.",
  },
  {
    id: "z4",
    emoji: "🕳️",
    title: "구멍이 있는 식 2",
    tex: "f(x) = \\dfrac{2x^2 - 2}{x - 1}",
    fn: (x) => (2 * x * x - 2) / (x - 1),
    a: 1,
    L: 4,
    defined: false,
    note: "약분하면 2(x + 1) 이에요. x = 1 한 점만 빼고 똑같은 그래프지요.",
  },
  {
    id: "z5",
    emoji: "➗",
    title: "분수함수",
    tex: "f(x) = \\dfrac{1}{x}",
    fn: (x) => 1 / x,
    a: 2,
    L: 0.5,
    defined: true,
    note: "x = 0 근처에서는 치솟지만 x = 2 근처에서는 얌전히 이어져 있어요.",
  },
  {
    id: "z6",
    emoji: "➖",
    title: "상수함수",
    tex: "f(x) = 4",
    fn: () => 4,
    a: 1,
    L: 4,
    defined: true,
    note: "x 가 무엇이든 값이 늘 4 라서 a 가 어떤 수든 극한값은 4 예요.",
  },
];

export const ZOOM_MAX_STEP = 5;
/** k 단계에서 a 로부터 떨어진 거리 */
export const zoomGap = (k: number): number => Math.pow(10, -k);

export const ZOOM_STEPS: Step[] = [
  {
    id: "zs1",
    kind: "choice",
    ask: "x 를 a 에 한없이 가까이 보낼 때, x 가 a 와 같아지기도 하나요?",
    options: [
      [{ pre: "가까워지기만 할 뿐 a 가 되지는 않는다" }],
      [{ pre: "마지막에는 결국 a 가 된다" }],
      [{ pre: "a 보다 큰 쪽에서만 가까워진다" }],
      [{ pre: "a 와 같아져야 극한을 말할 수 있다" }],
    ],
    answer: 0,
    explains: [
      "",
      "아무리 좁혀도 x 와 a 사이에는 늘 틈이 남아요. 표의 값이 1.99999 까지 가도 2 는 아니지요.",
      "왼쪽과 오른쪽 양쪽에서 함께 가까워져요.",
      "극한은 'a 가 아니면서 a 에 가까워질 때' 를 보는 것이에요.",
    ],
    hint: "표의 x 칸을 보세요. a 와 같은 수가 한 번이라도 나왔나요?",
    done: "그래서 x = a 에서 값이 있든 없든 극한에는 아무 영향이 없어요.",
  },
  {
    id: "zs2",
    kind: "choice",
    ask: "구멍이 있는 함수에서도 극한값을 말할 수 있었어요. 왜 그럴까요?",
    options: [
      [{ pre: "구멍이 있으면 극한도 없다고 보아야 한다" }],
      [{ pre: "구멍을 메워서 생각하기로 약속했기 때문" }],
      [{ pre: "분모가 0 이 되는 점은 그래프에 없기 때문" }],
      [{ pre: "극한은 a 가 아닌 점들만 보기 때문" }],
    ],
    answer: 3,
    explains: [
      "구멍이 있어도 가까운 값들이 한 수로 모이면 극한은 있어요.",
      "약속이 아니라 정의에서 이미 a 를 빼고 보기 때문이에요.",
      "그래프에 없는 것은 맞지만, 그것이 극한이 있는 까닭을 설명해 주지는 않아요.",
      "",
    ],
    hint: "극한의 뜻에서 'x 의 값이 a 가 아니면서' 라는 말을 떠올려 보세요.",
  },
  {
    id: "zs3",
    kind: "num",
    ask: "상수함수 f(x) = 4 에서 x 가 100 에 한없이 가까워질 때의 극한값은 얼마일까요?",
    answer: 4,
    hint: "x 가 무엇이든 f(x) 는 늘 4 예요.",
    done: "a 가 어떤 수든 상수함수의 극한값은 그 상수 그대로예요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 구멍이 있어도
// ══════════════════════════════════════════════════════════════
export type HoleKind = "join" | "hole" | "off";
export const HOLE_LABEL: Record<HoleKind, string> = {
  join: "이어짐",
  hole: "뚫림",
  off: "어긋남",
};
export const HOLE_EMOJI: Record<HoleKind, string> = { join: "🔗", hole: "🕳️", off: "📍" };

export type HoleItem = {
  kind: HoleKind;
  tex: string;
  fn: (x: number) => number;
  /** x = a 에서의 함숫값 (없으면 null) */
  valueAt: number | null;
};
export type HoleSet = {
  id: string;
  title: string;
  a: number;
  L: number;
  box: Box;
  items: HoleItem[];
  wrap: string;
};

export const HOLE_SETS: HoleSet[] = [
  {
    id: "h1",
    title: "x 가 2 에 가까워질 때",
    a: 2,
    L: 3,
    box: { xMin: -1, xMax: 5, yMin: -1, yMax: 6, gx: 1, gy: 1 },
    items: [
      { kind: "join", tex: "f(x) = x + 1", fn: (x) => x + 1, valueAt: 3 },
      { kind: "hole", tex: "g(x) = \\dfrac{x^2 - x - 2}{x - 2}", fn: (x) => (x * x - x - 2) / (x - 2), valueAt: null },
      { kind: "off", tex: "h(x) = x + 1 \\ (x \\neq 2), \\ h(2) = 1", fn: (x) => x + 1, valueAt: 1 },
    ],
    wrap: "세 그래프의 x = 2 자리만 다를 뿐, 가까이 갈 때 모이는 값은 모두 3 이에요.",
  },
  {
    id: "h2",
    title: "x 가 -1 에 가까워질 때",
    a: -1,
    L: -2,
    box: { xMin: -4, xMax: 2, yMin: -5, yMax: 2, gx: 1, gy: 1 },
    items: [
      { kind: "join", tex: "f(x) = x - 1", fn: (x) => x - 1, valueAt: -2 },
      { kind: "hole", tex: "g(x) = \\dfrac{x^2 - 1}{x + 1}", fn: (x) => (x * x - 1) / (x + 1), valueAt: null },
      { kind: "off", tex: "h(x) = x - 1 \\ (x \\neq -1), \\ h(-1) = 1", fn: (x) => x - 1, valueAt: 1 },
    ],
    wrap: "a 가 음수여도 달라지는 것은 없어요. 극한은 그 점을 빼고 둘레만 봅니다.",
  },
];

export const HOLE_STEPS: Step[] = [
  {
    id: "hs1",
    kind: "choice",
    ask: "세 함수의 극한값을 견주면 어떤가요?",
    options: [
      [{ pre: "이어진 함수만 극한값이 있다" }],
      [{ pre: "셋 다 극한값이 같다" }],
      [{ pre: "함숫값이 있는 둘만 극한값이 같다" }],
      [{ pre: "셋 다 극한값이 다르다" }],
    ],
    answer: 1,
    explains: [
      "뚫린 함수도 가까운 값들이 한 수로 모이면 극한값이 있어요.",
      "",
      "뚫린 함수도 같은 값으로 모여요.",
      "x = a 한 점만 다를 뿐 나머지는 완전히 같은 그래프예요.",
    ],
    hint: "x = a 를 뺀 나머지 자리에서 세 함수의 그래프가 어떻게 생겼는지 보세요.",
  },
  {
    id: "hs2",
    kind: "choice",
    ask: "그러면 극한값과 함숫값의 사이는 어떻게 말해야 할까요?",
    options: [
      [{ pre: "극한값은 늘 함숫값과 같다" }],
      [{ pre: "함숫값이 있어야만 극한값이 있다" }],
      [{ pre: "극한값은 함숫값과 같을 수도, 다를 수도, 함숫값이 아예 없을 수도 있다" }],
      [{ pre: "극한값이 있으면 함숫값은 반드시 없다" }],
    ],
    answer: 2,
    explains: [
      "어긋난 함수에서는 극한값 3 과 함숫값 1 이 달랐어요.",
      "뚫린 함수는 함숫값이 없는데도 극한값이 있었어요.",
      "",
      "이어진 함수는 둘이 함께 있고 값도 같았어요.",
    ],
    hint: "세 가지 경우를 하나씩 떠올려 보세요.",
    done: "극한은 그 점에 '도착했을 때' 가 아니라 '가까이 갈 때' 의 이야기예요.",
  },
  {
    id: "hs3",
    kind: "num",
    ask: "어긋난 함수 h 에서 x 가 2 에 한없이 가까워질 때의 극한값은 얼마일까요?",
    answer: 3,
    hint: "h(2) = 1 은 잊고, 2 를 뺀 둘레의 값들이 어디로 모이는지만 보세요.",
    done: "h(2) = 1 이라는 사실은 극한에 아무 영향을 주지 않아요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ③ 극한의 성질
// ══════════════════════════════════════════════════════════════
export const PROP_A = 2;
export type PropFn = { id: string; tex: string; fn: (x: number) => number; L: number; hole: boolean };

export const PROP_FNS: PropFn[] = [
  { id: "p1", tex: "x + 1", fn: (x) => x + 1, L: 3, hole: false },
  { id: "p2", tex: "x^2", fn: (x) => x * x, L: 4, hole: false },
  { id: "p3", tex: "5", fn: () => 5, L: 5, hole: false },
  { id: "p4", tex: "\\dfrac{x^2 - x - 2}{x - 2}", fn: (x) => (x * x - x - 2) / (x - 2), L: 3, hole: true },
  { id: "p5", tex: "x - 2", fn: (x) => x - 2, L: 0, hole: false },
];

export type PropOp = {
  id: string;
  label: string;
  /** 보여 줄 식 (c 가 들어가면 숫자를 끼워 넣는다) */
  texOf: (c: number) => string;
  combine: (f: number, g: number, c: number) => number;
  /** 성질로 예측한 극한값 */
  predict: (L: number, M: number, c: number) => number;
  /** 쓸 수 있는지 (나눗셈은 M ≠ 0 일 때만) */
  usable: (L: number, M: number) => boolean;
};
export const PROP_OPS: PropOp[] = [
  {
    id: "add",
    label: "f + g",
    texOf: () => "f(x) + g(x)",
    combine: (f, g) => f + g,
    predict: (L, M) => L + M,
    usable: () => true,
  },
  {
    id: "sub",
    label: "f − g",
    texOf: () => "f(x) - g(x)",
    combine: (f, g) => f - g,
    predict: (L, M) => L - M,
    usable: () => true,
  },
  {
    id: "scale",
    label: "c · f",
    texOf: (c) => `${fmt(c)} f(x)`,
    combine: (f, _g, c) => c * f,
    predict: (L, _M, c) => c * L,
    usable: () => true,
  },
  {
    id: "mul",
    label: "f × g",
    texOf: () => "f(x) \\, g(x)",
    combine: (f, g) => f * g,
    predict: (L, M) => L * M,
    usable: () => true,
  },
  {
    id: "div",
    label: "f ÷ g",
    texOf: () => "\\dfrac{f(x)}{g(x)}",
    combine: (f, g) => f / g,
    predict: (L, M) => L / M,
    usable: (_L, M) => M !== 0,
  },
];

export const PROP_C_MIN = -3;
export const PROP_C_MAX = 3;
export const PROP_START = { fi: 0, gi: 1, op: 0, c: 2 };

export const PROP_STEPS: Step[] = [
  {
    id: "ps1",
    kind: "choice",
    ask: "lim f(x) = 3, lim g(x) = -2 일 때 lim { f(x) + g(x) } 는 얼마일까요?",
    options: [[{ tex: "-6" }], [{ tex: "5" }], [{ tex: "1" }], [{ tex: "-1.5" }]],
    answer: 2,
    explains: [
      "그것은 두 극한값을 곱한 값이에요.",
      "두 극한값을 뺀 값이에요. 지금은 더해야 해요.",
      "",
      "그것은 두 극한값을 나눈 값이에요.",
    ],
    hint: "성질 (1) 그대로 두 극한값을 더하면 돼요.",
  },
  {
    id: "ps2",
    kind: "num",
    ask: "같은 f, g 에 대하여 lim { 2f(x) - 3g(x) } 는 얼마일까요?",
    answer: 2 * 3 - 3 * -2,
    hint: "2 곱하기 3 에서 3 곱하기 -2 를 빼요. 음수를 빼면 더하는 셈이에요.",
    done: "상수배와 뺄셈을 차례로 쓰면 돼요.",
  },
  {
    id: "ps3",
    kind: "num",
    ask: "lim f(x) g(x) 는 얼마일까요?",
    answer: 3 * -2,
    hint: "두 극한값을 그대로 곱해요.",
  },
  {
    id: "ps4",
    kind: "choice",
    ask: "lim g(x) = 0 인 함수로 나누려고 하면 어떻게 될까요?",
    options: [
      [{ pre: "성질 (4)를 쓸 수 없다. 조건이 M ≠ 0 이기 때문" }],
      [{ pre: "답이 0 이 된다" }],
      [{ pre: "답이 L 이 된다" }],
      [{ pre: "성질 (4)를 그대로 써도 된다" }],
    ],
    answer: 0,
    explains: [
      "",
      "0 으로 나누는 것이라 값이 정해지지 않아요.",
      "분모가 1 일 때의 이야기예요.",
      "성질 (4)에는 M ≠ 0 이라는 단서가 붙어 있어요.",
    ],
    hint: "성질 (4)의 괄호 안을 다시 읽어 보세요.",
    done: "실험실에서 g 로 x - 2 를 고르고 나눗셈을 눌러 보면 안내가 뜰 거예요.",
  },
  {
    id: "ps5",
    kind: "num",
    ask: "이번에는 실제 식이에요. x 가 1 에 가까워질 때 (2x² + 3)(x - 4) 의 극한값은 얼마일까요?",
    answer: (2 * 1 * 1 + 3) * (1 - 4),
    hint: "두 덩어리의 극한값을 따로 구하면 5 와 -3 이에요. 성질 (3)으로 곱해요.",
    done: "덩어리마다 극한을 구해 두고 성질로 이어 붙이면 복잡한 식도 쉬워져요.",
  },
  {
    id: "ps6",
    kind: "choice",
    ask: "구멍이 있는 함수에도 극한의 성질을 쓸 수 있을까요?",
    options: [
      [{ pre: "쓸 수 없다. 함숫값이 없기 때문" }],
      [{ pre: "쓸 수 있다. 성질은 극한값만 있으면 되기 때문" }],
      [{ pre: "구멍을 메운 뒤에만 쓸 수 있다" }],
      [{ pre: "덧셈에만 쓸 수 있다" }],
    ],
    answer: 1,
    explains: [
      "성질의 조건은 '극한값이 실수로 있을 것' 이지 '함숫값이 있을 것' 이 아니에요.",
      "",
      "메울 필요 없이 그대로 쓸 수 있어요.",
      "네 가지 성질 모두 쓸 수 있어요.",
    ],
    hint: "성질을 쓰는 조건에 함숫값 이야기가 나오는지 보세요.",
    done: "실험실에서 구멍이 있는 함수를 골라도 예측값과 실제 값이 그대로 맞아떨어져요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 그래프 탐정
// ══════════════════════════════════════════════════════════════
export type Branch = { from: number; to: number; fn: (x: number) => number };
export type Dot = { x: number; y: number; filled: boolean };
export type GraphCard = {
  id: string;
  emoji: string;
  title: string;
  story: string;
  branches: Branch[];
  dots: Dot[];
  a: number;
  /** 극한값 — 없으면 null */
  limit: number | null;
  /** 함숫값 — 정의되지 않으면 null */
  value: number | null;
  box: Box;
  why: string;
  /** 축 이름 (실생활 카드에서 쓴다) */
  axis?: [string, string];
};

export const GRAPH_CARDS: GraphCard[] = [
  {
    id: "g1",
    emoji: "📈",
    title: "곧게 이어진 그래프",
    story: "끊긴 데도 뚫린 데도 없는 직선이에요.",
    branches: [{ from: -1, to: 5, fn: (x) => 2 * x - 1 }],
    dots: [],
    a: 2,
    limit: 3,
    value: 3,
    box: { xMin: -1, xMax: 5, yMin: -3, yMax: 9, gx: 1, gy: 2 },
    why: "이어진 그래프라 극한값과 함숫값이 둘 다 3 이에요.",
  },
  {
    id: "g2",
    emoji: "🕳️",
    title: "한 점이 뚫린 그래프",
    story: "x = 2 자리만 속이 빈 동그라미예요.",
    branches: [{ from: -1, to: 5, fn: (x) => x + 1 }],
    dots: [{ x: 2, y: 3, filled: false }],
    a: 2,
    limit: 3,
    value: null,
    box: { xMin: -1, xMax: 5, yMin: -1, yMax: 7, gx: 1, gy: 1 },
    why: "x = 2 에서 값이 없지만 둘레의 값들이 3 으로 모이니 극한값은 3 이에요.",
  },
  {
    id: "g3",
    emoji: "📍",
    title: "한 점만 딴 자리",
    story: "x = 2 자리가 비어 있고, 대신 아래쪽에 점이 하나 찍혀 있어요.",
    branches: [{ from: -1, to: 5, fn: (x) => x + 1 }],
    dots: [
      { x: 2, y: 3, filled: false },
      { x: 2, y: 1, filled: true },
    ],
    a: 2,
    limit: 3,
    value: 1,
    box: { xMin: -1, xMax: 5, yMin: -1, yMax: 7, gx: 1, gy: 1 },
    why: "둘레는 3 으로 모이니 극한값은 3 이고, 찍힌 점이 함숫값이라 f(2) = 1 이에요.",
  },
  {
    id: "g4",
    emoji: "✂️",
    title: "뚝 끊긴 그래프",
    story: "x = 1 을 지나면서 높이가 갑자기 바뀌어요.",
    branches: [
      { from: -1, to: 1, fn: () => 1 },
      { from: 1, to: 4, fn: () => 3 },
    ],
    dots: [
      { x: 1, y: 1, filled: false },
      { x: 1, y: 3, filled: true },
    ],
    a: 1,
    limit: null,
    value: 3,
    box: { xMin: -1, xMax: 4, yMin: -1, yMax: 5, gx: 1, gy: 1 },
    why: "왼쪽에서 가면 1 로, 오른쪽에서 가면 3 으로 가요. 한 값에 모이지 않으니 극한이 없어요.",
  },
  {
    id: "g5",
    emoji: "🏹",
    title: "포물선의 바닥",
    story: "아래로 가장 낮은 자리를 지나가요.",
    branches: [{ from: 0, to: 4, fn: (x) => x * x - 4 * x + 5 }],
    dots: [],
    a: 2,
    limit: 1,
    value: 1,
    box: { xMin: 0, xMax: 4, yMin: 0, yMax: 6, gx: 0.5, gy: 1 },
    why: "휘어 있어도 끊긴 데가 없으니 극한값과 함숫값이 모두 1 이에요.",
  },
  {
    id: "g6",
    emoji: "🕳️",
    title: "뚫린 포물선",
    story: "곡선인데 x = 1 한 자리만 비어 있어요.",
    branches: [{ from: -2, to: 2.5, fn: (x) => x * x }],
    dots: [{ x: 1, y: 1, filled: false }],
    a: 1,
    limit: 1,
    value: null,
    box: { xMin: -2, xMax: 2.5, yMin: -1, yMax: 6, gx: 0.5, gy: 1 },
    why: "구멍이 곡선 위에 있어도 둘레가 1 로 모이니 극한값은 1 이에요.",
  },
  {
    id: "g7",
    emoji: "📦",
    title: "택배 요금",
    story: "2kg 미만은 3,000원, 2kg 부터 5kg 미만은 4,000원이에요. 무게가 2kg 에 가까워지면 요금은?",
    branches: [
      { from: 0, to: 2, fn: () => 3000 },
      { from: 2, to: 5, fn: () => 4000 },
      { from: 5, to: 7, fn: () => 6000 },
    ],
    dots: [
      { x: 2, y: 3000, filled: false },
      { x: 2, y: 4000, filled: true },
      { x: 5, y: 4000, filled: false },
      { x: 5, y: 6000, filled: true },
    ],
    a: 2,
    limit: null,
    value: 4000,
    box: { xMin: 0, xMax: 7, yMin: 0, yMax: 7500, gx: 1, gy: 1500 },
    why: "2kg 바로 아래는 3,000원, 2kg 부터는 4,000원이라 한 값으로 모이지 않아요. 그래서 극한이 없어요.",
    axis: ["무게(kg)", "요금(원)"],
  },
  {
    id: "g8",
    emoji: "🏃",
    title: "평균 속도",
    story: "거리가 s(t) = t² + t 일 때, 2초부터 t초까지의 평균 속도예요. t = 2 에서는 0 으로 나누게 돼요.",
    branches: [{ from: 0, to: 4, fn: (t) => t + 3 }],
    dots: [{ x: 2, y: 5, filled: false }],
    a: 2,
    limit: 5,
    value: null,
    box: { xMin: 0, xMax: 4, yMin: 0, yMax: 8, gx: 0.5, gy: 1 },
    why: "t = 2 에서는 값이 없지만 가까이 갈수록 5 로 모여요. 이것이 2초 순간의 속도랍니다.",
    axis: ["시각(초)", "평균 속도(m/s)"],
  },
];

export const GRAPH_STEPS: Step[] = [
  {
    id: "gs1",
    kind: "num",
    ask: "여덟 장 가운데 극한값이 없는 그래프는 몇 장이었을까요?",
    answer: GRAPH_CARDS.filter((c) => c.limit === null).length,
    unit: "장",
    hint: "왼쪽과 오른쪽에서 다가간 값이 달랐던 그래프를 세어 보세요.",
  },
  {
    id: "gs2",
    kind: "choice",
    ask: "극한이 없다고 판단한 그래프들의 공통점은 무엇일까요?",
    options: [
      [{ pre: "곡선이 아니라 직선이었다" }],
      [{ pre: "함숫값이 정의되지 않았다" }],
      [{ pre: "그 점에 빈 동그라미가 있었다" }],
      [{ pre: "그래프가 뚝 끊겨 왼쪽과 오른쪽이 다른 높이로 갔다" }],
    ],
    answer: 3,
    explains: [
      "직선이어도 이어져 있으면 극한이 있어요.",
      "거꾸로예요. 끊긴 그래프에서는 오히려 함숫값이 있었어요.",
      "빈 동그라미만 있는 그래프는 극한이 멀쩡히 있었어요.",
      "",
    ],
    hint: "끊긴 그래프에서 왼쪽으로 다가갈 때와 오른쪽으로 다가갈 때를 견주어 보세요.",
    done: "'일정한 값 하나' 로 모여야 극한이에요. 두 값으로 갈라지면 극한이 없습니다.",
  },
  {
    id: "gs3",
    kind: "choice",
    ask: "평균 속도 그래프에서 t = 2 의 값이 없는데도 극한을 구한 것은 무슨 뜻이었을까요?",
    options: [
      [{ pre: "2초 순간의 속도를 알아낸 것" }],
      [{ pre: "2초까지 달린 거리를 알아낸 것" }],
      [{ pre: "평균 속도가 틀렸다는 뜻" }],
      [{ pre: "2초에는 멈춰 있었다는 뜻" }],
    ],
    answer: 0,
    explains: [
      "",
      "그래프의 세로축은 거리가 아니라 평균 속도예요.",
      "값이 없는 것은 0 으로 나누기 때문이지 계산이 틀려서가 아니에요.",
      "극한값이 5 이니 멈춰 있던 것이 아니에요.",
    ],
    hint: "구간을 점점 짧게 줄인 평균 속도가 무엇에 가까워질지 생각해 보세요.",
    done: "'한 점에서의 값' 을 극한으로 붙잡는 이 방법이 다음 단원에서 미분이 됩니다.",
  },
];

export const REAL_NOTE =
  "택배 요금과 거리의 수치는 개념을 보여 주기 위해 이 활동에서 정한 가상의 값이다.";
