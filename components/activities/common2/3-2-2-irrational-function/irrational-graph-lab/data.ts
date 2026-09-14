// 무리함수의 그래프 — 활동 데이터
//
//  [제곱함수의 역함수] y = x² 는 정의역이 실수 전체이면 수평선과 두 점에서 만나는 곳이 있어
//        일대일이 아니고 역함수가 없다. 정의역을 x ≥ 0 으로 제한하면 일대일대응이 되어
//        역함수 y = √x 를 얻는다. 두 그래프는 직선 y = x 에 대하여 대칭이고 (0, 0), (1, 1) 에서 만난다.
//        거꾸로 y = √(ax) (a > 0) 의 역함수는 y = x²/a (x ≥ 0) 이고,
//        y = −√x 의 역함수는 y = x² (x ≤ 0) 이다.
//
//  [기본형 y = ±√(ax)] a 의 부호는 정의역이 뻗는 쪽을, 근호 앞의 부호는 치역이 놓이는 쪽을 정한다.
//        y = √(ax), a > 0  → 제1사분면, 정의역 x ≥ 0, 치역 y ≥ 0
//        y = √(ax), a < 0  → 제2사분면, 정의역 x ≤ 0, 치역 y ≥ 0
//        y = −√(ax), a < 0 → 제3사분면, 정의역 x ≤ 0, 치역 y ≤ 0
//        y = −√(ax), a > 0 → 제4사분면, 정의역 x ≥ 0, 치역 y ≤ 0
//        네 그래프는 x축·y축·원점에 대하여 서로 대칭이고, |a| 가 커질수록 x축에서 멀어진다.
//        a > 0 일 때 √(ax) = √a·√x 이므로 a > 1 이면 y = √x 보다 위에, 0 < a < 1 이면 아래에 놓인다.
//
//  [평행이동] y = √(a(x−p)) + q 는 y = √(ax) 를 x축으로 p, y축으로 q 만큼 옮긴 것이다.
//        정의역은 a > 0 이면 x ≥ p, a < 0 이면 x ≤ p 이고, 치역은 근호 앞이 + 이면 y ≥ q, − 이면 y ≤ q 다.
//        y = √(ax+b) + c 는 근호 안을 a(x + b/a) 로 묶어 p = −b/a, q = c 로 읽으면 된다.
//        보기를 들어 √(3x+6) − 1 = √(3(x+2)) − 1 이라 p = −2, q = −1 이고,
//        √(4−2x) + 2 = √(−2(x−2)) + 2 라 p = 2, q = 2 이며 정의역이 x ≤ 2 로 왼쪽으로 뻗는다.
//
//  [역함수와의 교점] 무리함수 f 와 그 역함수 f⁻¹ 의 그래프는 y = x 에 대하여 대칭이므로
//        y = x 위의 교점은 f(x) = x 를 풀면 나온다. 그러나 교점이 y = x 위에만 있는 것은 아니다.
//        f 가 증가함수이면 f(α) = β, f(β) = α 이고 α < β 라 하면 f 가 증가하므로 β < α 가 되어 모순이다.
//        그래서 증가하는 무리함수는 교점이 반드시 y = x 위에 있다.
//        f 가 감소함수이면 사정이 다르다. f(x) = √(13 − 4x) 는 f(1) = 3, f(3) = 1 이므로
//        (1, 3) 과 (3, 1) 에서도 만나고 y = x 위의 (√17 − 2, √17 − 2) 까지 모두 세 점에서 만난다.
//        (일반적으로 f(α) = β, f(β) = α 를 풀면 a = α + β, b = α² + αβ + β² 인 f(x) = √(b − ax) 가 나온다.)
//        다만 감소한다고 늘 그런 것은 아니어서 f(x) = √(4 − x) 는 교점이 y = x 위의 한 점뿐이다.
//
//  [사분면 통과] 무리함수의 그래프는 시작점 (p, q) 에서 한쪽으로만 뻗는 단조로운 곡선이라,
//        어떤 사분면을 지나는지는 시작점의 자리와 y = 0 을 가르는 자리로 정해진다.
//        y = √(x+3) + q 는 q < 0 이면 제3사분면을, q < −√3 이면 제4사분면까지 지난다.
//        y = √(x−p) − 2 는 p < 0 이라야 제3사분면을, p < −4 라야 제2사분면까지 지난다.

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

// ══════════════════════════════════════════════════════════════
// 좌표평면과 곡선 그리기
// ══════════════════════════════════════════════════════════════

export type View = { xMin: number; xMax: number; yMin: number; yMax: number };
export type Pt = { x: number; y: number };

export const PLANE = { w: 320, h: 320, pad: 16 };

export function sx(v: View, x: number): number {
  return PLANE.pad + ((x - v.xMin) / (v.xMax - v.xMin)) * (PLANE.w - 2 * PLANE.pad);
}
export function sy(v: View, y: number): number {
  return PLANE.pad + ((v.yMax - y) / (v.yMax - v.yMin)) * (PLANE.h - 2 * PLANE.pad);
}

/** 보기 좋은 눈금 간격 — 0 은 축이 대신하므로 뺀다. */
export function niceTicks(min: number, max: number, target = 6): number[] {
  const raw = (max - min) / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let k = Math.ceil(min / step); k * step <= max + 1e-9; k++) {
    if (k === 0) continue;
    out.push(Number((k * step).toFixed(6)));
  }
  return out;
}

/** 눈금 글자 — 간격에 맞춰 자릿수를 줄인다. */
export function tickLabel(v: number, span: number): string {
  const d = span >= 6 ? 0 : span >= 1.2 ? 1 : span >= 0.3 ? 2 : 3;
  return Number(v.toFixed(d)).toString();
}

/**
 * y = s·√(a(x−p)) + q 를 창 안에서만 잘라 표본으로 뽑는다.
 * v = √(a(x−p)) ≥ 0 로 두면 y = s·v + q 가 v 에 대해 일차라서
 * v 를 고르게 훑으면 y 가 고르게 훑어진다. 꼭짓점 가까이에서 곡선이 거의 수직이므로
 * 이렇게 잡아야 촘촘해지고, 창의 네 변이 주는 제약도 v 구간 하나로 합쳐진다.
 */
export function irrSamples(a: number, p: number, q: number, s: 1 | -1, view: View, n = 200): Pt[] {
  if (a === 0) return [];
  let lo: number;
  let hi: number;
  if (a > 0) {
    if (view.xMax <= p) return [];
    lo = Math.sqrt(a * Math.max(0, view.xMin - p));
    hi = Math.sqrt(a * (view.xMax - p));
  } else {
    if (view.xMin >= p) return [];
    lo = Math.sqrt(-a * Math.max(0, p - view.xMax));
    hi = Math.sqrt(-a * (p - view.xMin));
  }
  const vLo = s === 1 ? view.yMin - q : q - view.yMax;
  const vHi = s === 1 ? view.yMax - q : q - view.yMin;
  lo = Math.max(lo, Math.max(0, vLo));
  hi = Math.min(hi, vHi);
  if (!(hi > lo + 1e-12)) return [];
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const v = lo + ((hi - lo) * i) / n;
    out.push({ x: p + (v * v) / a, y: s * v + q });
  }
  return out;
}

/** 창 안에 드는 점인가 */
function inView(v: View, pt: Pt): boolean {
  return pt.x >= v.xMin - 1e-9 && pt.x <= v.xMax + 1e-9 && pt.y >= v.yMin - 1e-9 && pt.y <= v.yMax + 1e-9;
}

/**
 * 아무 함수나 창 안에서만 잘라 여러 도막으로 뽑는다.
 * 창을 드나드는 자리는 이분법으로 테두리까지 좁혀 잇는다.
 */
export function clipSamples(f: (x: number) => number, xLo: number, xHi: number, view: View, n = 320): Pt[][] {
  const lo = Math.max(xLo, view.xMin);
  const hi = Math.min(xHi, view.xMax);
  if (!(hi > lo)) return [];
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n;
    pts.push({ x, y: f(x) });
  }
  const edge = (a: Pt, b: Pt): Pt => {
    // a 는 창 안, b 는 창 밖 — 테두리까지 이분법으로 좁힌다
    let inx = a.x;
    let outx = b.x;
    for (let k = 0; k < 40; k++) {
      const mx = (inx + outx) / 2;
      if (inView(view, { x: mx, y: f(mx) })) inx = mx;
      else outx = mx;
    }
    return { x: inx, y: f(inx) };
  };
  const segs: Pt[][] = [];
  let cur: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const here = inView(view, pts[i]);
    if (here) {
      if (cur.length === 0 && i > 0) cur.push(edge(pts[i], pts[i - 1]));
      cur.push(pts[i]);
    } else if (cur.length) {
      cur.push(edge(pts[i - 1], pts[i]));
      segs.push(cur);
      cur = [];
    }
  }
  if (cur.length > 1) segs.push(cur);
  return segs.filter((sg) => sg.length > 1);
}

/** 그래프가 지나는 사분면 — 제1·2·3·4 차례 */
export function quadrantsOf(a: number, p: number, q: number, s: 1 | -1): boolean[] {
  const res = [false, false, false, false];
  const lo = a > 0 ? p : -70;
  const hi = a > 0 ? 70 : p;
  const n = 14000;
  for (let i = 0; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n;
    const t = a * (x - p);
    if (t < 0) continue;
    const y = s * Math.sqrt(t) + q;
    if (x > 0 && y > 0) res[0] = true;
    else if (x < 0 && y > 0) res[1] = true;
    else if (x < 0 && y < 0) res[2] = true;
    else if (x > 0 && y < 0) res[3] = true;
  }
  return res;
}

export const QUAD_NAME = ["제1사분면", "제2사분면", "제3사분면", "제4사분면"];

// ══════════════════════════════════════════════════════════════
// 탭 ① 제곱함수를 뒤집으면 √
// ══════════════════════════════════════════════════════════════

export const INV_VIEW: View = { xMin: -2.2, xMax: 4.4, yMin: -2.2, yMax: 4.4 };
export const HLINE = { min: -1, max: 4, step: 0.5, init: 2 };

export const INV_GOALS = [
  "수평선을 올려 y = x² 가 두 점에서 만나는 것 보기",
  "정의역을 x ≥ 0 으로 좁혀 한 점에서만 만나게 하기",
  "역함수를 켜서 y = x 에 대칭인 것 확인하기",
];

export type Quiz = {
  id: string;
  prompt: string;
  choices: Piece[][];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const INV_QUIZ: Quiz[] = [
  {
    id: "i1",
    prompt: "정의역이 실수 전체인 y = x² 에 역함수가 없는 까닭은?",
    choices: [
      [{ pre: "수평선과 두 점에서 만나는 곳이 있어 일대일이 아니기 때문" }],
      [{ pre: "그래프가 곡선이기 때문" }],
      [{ pre: "치역이 실수 전체가 아니기 때문" }],
      [{ pre: "정의역이 실수 전체이기 때문" }],
    ],
    answer: 0,
    choiceWhy: [
      "",
      "곡선이어도 일대일이면 역함수가 있어요. y = √x 가 그렇습니다.",
      "치역이 좁아도 공역을 치역으로 잡으면 됩니다. 문제는 일대일이 아니라는 점이에요.",
      "정의역이 넓은 것 자체가 문제는 아니에요. 서로 다른 두 수가 같은 값을 갖는 것이 문제입니다.",
    ],
    why: "1 과 −1 처럼 서로 다른 두 수가 같은 값 1 을 가지므로 일대일이 아니에요. 수평선이 두 점에서 만나는 것이 그 증거입니다.",
  },
  {
    id: "i2",
    prompt: "y = √x 의 역함수는?",
    choices: [[{ tex: "y=x^2" }], [{ tex: "y=-x^2\\ (x\\geq 0)" }], [{ tex: "y=x^2\\ (x\\geq 0)" }], [{ tex: "y=\\sqrt{x}" }]],
    answer: 2,
    choiceWhy: [
      "정의역을 밝히지 않으면 일대일이 아니라 역함수가 되지 못해요.",
      "y = √x 의 값은 0 이상이므로 역함수의 값도 0 이상이어야 합니다.",
      "",
      "역함수가 자기 자신이 되려면 y = x 에 대칭이어야 하는데 그렇지 않아요.",
    ],
    why: "y = √x 의 치역이 y ≥ 0 이므로 역함수의 정의역이 x ≥ 0 이에요. 양변을 제곱하면 y = x² (x ≥ 0) 입니다.",
  },
  {
    id: "i3",
    prompt: "y = √(4x) 의 역함수는?",
    choices: [
      [{ tex: "y=4x^2\\ (x\\geq 0)" }],
      [{ tex: "y=\\dfrac{x^2}{4}\\ (x\\geq 0)" }],
      [{ tex: "y=\\dfrac{x^2}{4}" }],
      [{ tex: "y=\\sqrt{\\dfrac{x}{4}}" }],
    ],
    answer: 1,
    choiceWhy: [
      "x = √(4y) 를 제곱하면 x² = 4y 이므로 4 로 나누어야 해요.",
      "",
      "정의역을 밝히지 않으면 일대일이 아닌 함수가 됩니다.",
      "근호가 남으면 역함수가 아니라 또 다른 무리함수예요.",
    ],
    why: "x = √(4y) 에서 x² = 4y 이므로 y = x²/4 이고, 치역이 y ≥ 0 이었으므로 정의역은 x ≥ 0 이에요.",
  },
  {
    id: "i4",
    prompt: "y = −√x 의 역함수는?",
    choices: [
      [{ tex: "y=x^2\\ (x\\geq 0)" }],
      [{ tex: "y=-x^2\\ (x\\leq 0)" }],
      [{ tex: "y=-x^2\\ (x\\geq 0)" }],
      [{ tex: "y=x^2\\ (x\\leq 0)" }],
    ],
    answer: 3,
    choiceWhy: [
      "원래 함수의 치역이 y ≤ 0 이므로 역함수의 정의역은 x ≤ 0 이에요.",
      "x = −√y 를 제곱하면 x² = y 라 앞에 음의 부호가 붙지 않아요.",
      "부호와 정의역을 모두 잘못 보았습니다.",
      "",
    ],
    why: "x = −√y 의 양변을 제곱하면 x² = y 예요. 원래 함수의 치역이 y ≤ 0 이었으므로 역함수의 정의역은 x ≤ 0 입니다.",
  },
  {
    id: "i5",
    prompt: "어떤 함수의 그래프와 그 역함수의 그래프는 무엇에 대하여 대칭일까요?",
    choices: [[{ pre: "x축" }], [{ pre: "원점" }], [{ pre: "직선 " }, { tex: "y=x" }], [{ pre: "y축" }]],
    answer: 2,
    choiceWhy: [
      "x축 대칭이면 y 의 부호만 바뀝니다. 역함수는 x 와 y 의 자리를 바꾸는 것이에요.",
      "원점 대칭이면 x 와 y 가 함께 부호만 바뀝니다.",
      "",
      "y축 대칭이면 x 의 부호만 바뀌어요.",
    ],
    why: "역함수는 x 와 y 의 자리를 맞바꾼 것이라 (a, b) 가 있으면 (b, a) 가 있어요. 두 점은 직선 y = x 에 대하여 대칭입니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 네 갈래 기본형 y = ±√(ax)
// ══════════════════════════════════════════════════════════════

export const BASE_VIEW: View = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };
/** a = 0 을 고를 수 없도록 값 목록을 슬라이더 눈금으로 쓴다. */
export const A_LIST = [-4, -3, -2, -1, -0.5, 0.5, 1, 2, 3, 4];
export const A_INIT = 6; // a = 1

export const BASE_GOALS = [
  "a 를 음수로 바꾸어 그래프가 왼쪽으로 뻗는 것 보기",
  "근호 앞의 부호를 바꾸어 아래로 내려가는 것 보기",
  "|a| 를 키워 x축에서 멀어지는 것 보기",
];

/** 사분면 번호 — s = 1 이면 위쪽, a > 0 이면 오른쪽 */
export function baseQuadrant(a: number, s: 1 | -1): number {
  if (s === 1) return a > 0 ? 1 : 2;
  return a > 0 ? 4 : 3;
}

export const BASE_QUIZ: Quiz[] = [
  {
    id: "b1",
    prompt: "y = √(−2x) 의 그래프는 어느 사분면에 놓일까요?",
    choices: [[{ pre: "제1사분면" }], [{ pre: "제3사분면" }], [{ pre: "제2사분면" }], [{ pre: "제4사분면" }]],
    answer: 2,
    choiceWhy: [
      "근호 안 −2x 가 0 이상이려면 x ≤ 0 이라 오른쪽에는 그려지지 않아요.",
      "근호 앞에 음의 부호가 없으므로 값이 0 이상입니다.",
      "",
      "정의역이 x ≤ 0 이므로 오른쪽에는 그려지지 않아요.",
    ],
    why: "−2x ≥ 0 에서 정의역이 x ≤ 0 이고 근호의 값이므로 치역은 y ≥ 0 이에요. 왼쪽 위, 곧 제2사분면입니다.",
  },
  {
    id: "b2",
    prompt: "y = −√(5x) 의 정의역과 치역은?",
    choices: [
      [{ pre: "정의역 ", tex: "x\\geq 0" }, { pre: ", 치역 ", tex: "y\\leq 0" }],
      [{ pre: "정의역 ", tex: "x\\leq 0" }, { pre: ", 치역 ", tex: "y\\leq 0" }],
      [{ pre: "정의역 ", tex: "x\\geq 0" }, { pre: ", 치역 ", tex: "y\\geq 0" }],
      [{ pre: "정의역 ", tex: "x\\geq 5" }, { pre: ", 치역 ", tex: "y\\leq 0" }],
    ],
    answer: 0,
    choiceWhy: [
      "",
      "5x ≥ 0 이려면 x ≥ 0 이에요. 부등호의 방향이 반대입니다.",
      "근호 앞의 음의 부호가 값을 모두 0 이하로 뒤집어요.",
      "근호 안이 5x 라 0 이 되는 자리는 x = 0 입니다.",
    ],
    why: "5x ≥ 0 에서 정의역은 x ≥ 0 이고, 근호 앞의 음의 부호 때문에 치역은 y ≤ 0 이에요.",
  },
  {
    id: "b3",
    prompt: "x = 4 일 때 y = √(2x) 와 y = √(8x) 가운데 x축에서 더 멀리 있는 것은?",
    choices: [[{ tex: "y=\\sqrt{2x}" }], [{ pre: "두 값이 같다" }], [{ pre: "알 수 없다" }], [{ tex: "y=\\sqrt{8x}" }]],
    answer: 3,
    choiceWhy: [
      "√8 > √2 이므로 같은 x 에서 √(8x) 가 더 큽니다.",
      "x = 4 를 넣으면 √8 ≈ 2.83 과 √32 ≈ 5.66 으로 다릅니다.",
      "√(ax) = √a·√x 이므로 a 만 견주면 바로 알 수 있어요.",
      "",
    ],
    why: "√(ax) = √a·√x 이므로 |a| 가 클수록 같은 x 에서 |y| 가 커져 x축에서 멀어져요. x = 4 에서 √8 ≈ 2.83, √32 ≈ 5.66 입니다.",
  },
  {
    id: "b4",
    prompt: "y = √(3x) 의 그래프를 y축에 대하여 대칭이동한 그래프의 식은?",
    choices: [[{ tex: "y=-\\sqrt{3x}" }], [{ tex: "y=\\sqrt{-3x}" }], [{ tex: "y=-\\sqrt{-3x}" }], [{ tex: "y=\\sqrt{3x}" }]],
    answer: 1,
    choiceWhy: [
      "이것은 x축에 대하여 대칭이동한 그래프예요.",
      "",
      "이것은 원점에 대하여 대칭이동한 그래프입니다.",
      "대칭이동하면 그래프가 옮겨가므로 식이 그대로일 수 없어요.",
    ],
    why: "y축 대칭이동은 x 자리에 −x 를 넣는 것이므로 y = √(−3x) 예요. 제1사분면에서 제2사분면으로 건너갑니다.",
  },
  {
    id: "b5",
    prompt: "y = √(3x) 의 그래프를 원점에 대하여 대칭이동한 그래프의 식은?",
    choices: [[{ tex: "y=\\sqrt{-3x}" }], [{ tex: "y=-\\sqrt{3x}" }], [{ tex: "y=-\\sqrt{-3x}" }], [{ tex: "y=-3\\sqrt{x}" }]],
    answer: 2,
    choiceWhy: [
      "x 만 부호를 바꾸면 y축 대칭이에요.",
      "y 만 부호를 바꾸면 x축 대칭입니다.",
      "",
      "근호 밖으로 나온 수의 부호를 바꾸는 것이 아니에요.",
    ],
    why: "원점 대칭이동은 x 자리에 −x 를, y 자리에 −y 를 넣는 것이므로 −y = √(−3x), 곧 y = −√(−3x) 예요. 제1사분면에서 제3사분면으로 건너갑니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 평행이동 y = ±√(a(x−p)) + q
// ══════════════════════════════════════════════════════════════

export const MOVE_VIEW: View = { xMin: -7, xMax: 7, yMin: -7, yMax: 7 };
export const MOVE_A = [-4, -3, -2, -1, 1, 2, 3, 4];
export const MOVE_PQ = { min: -4, max: 4, step: 1 };
export const MOVE_INIT = { ai: 5, p: 0, q: 0 }; // a = 2

export type FormStep = {
  q: string;
  badge: string;
  choices: string[];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export type FormTask = {
  id: string;
  rawTex: string;
  a: number;
  p: number;
  q: number;
  s: 1 | -1;
  formTex: string;
  steps: FormStep[];
  domChoices: Piece[][];
  domAnswer: number;
  domWhy: string[];
  domNote: string;
};

export const FORM_TASKS: FormTask[] = [
  {
    id: "g1",
    rawTex: "y=\\sqrt{3x+6}-1",
    a: 3,
    p: -2,
    q: -1,
    s: 1,
    formTex: "y=\\sqrt{3(x+2)}-1",
    steps: [
      {
        badge: "묶기",
        q: "근호 안을 a(x−p) 꼴로 묶으면?",
        choices: ["\\sqrt{3(x+2)}-1", "\\sqrt{3(x+6)}-1", "\\sqrt{3(x-2)}-1", "3\\sqrt{x+2}-1"],
        answer: 0,
        choiceWhy: [
          "",
          "3 으로 묶으면 6 ÷ 3 = 2 가 남아요.",
          "부호를 반대로 보았어요. 3x+6 = 3(x+2) 입니다.",
          "3 은 근호 안에 있으므로 그대로 밖으로 나올 수 없어요.",
        ],
        why: "3x + 6 = 3(x + 2) 이므로 p = −2, q = −1 이에요. y = √(3x) 를 왼쪽으로 2, 아래로 1 옮긴 그래프입니다.",
      },
    ],
    domChoices: [
      [{ pre: "정의역 ", tex: "x\\geq -2" }, { pre: ", 치역 ", tex: "y\\geq -1" }],
      [{ pre: "정의역 ", tex: "x\\geq 2" }, { pre: ", 치역 ", tex: "y\\geq -1" }],
      [{ pre: "정의역 ", tex: "x\\geq -2" }, { pre: ", 치역 ", tex: "y\\geq 0" }],
      [{ pre: "정의역 ", tex: "x\\leq -2" }, { pre: ", 치역 ", tex: "y\\geq -1" }],
    ],
    domAnswer: 0,
    domWhy: [
      "",
      "3(x+2) ≥ 0 이면 x ≥ −2 예요. 부호에 주의하세요.",
      "뒤에 붙은 −1 만큼 값이 모두 내려가요.",
      "a = 3 이 양수라 정의역은 오른쪽으로 뻗습니다.",
    ],
    domNote: "시작점은 (−2, −1) 이고 오른쪽 위로 뻗어요.",
  },
  {
    id: "g2",
    rawTex: "y=\\sqrt{4-2x}+2",
    a: -2,
    p: 2,
    q: 2,
    s: 1,
    formTex: "y=\\sqrt{-2(x-2)}+2",
    steps: [
      {
        badge: "묶기",
        q: "근호 안을 a(x−p) 꼴로 묶으면?",
        choices: ["\\sqrt{2(x-2)}+2", "\\sqrt{-2(x+2)}+2", "\\sqrt{-2(x-2)}+2", "\\sqrt{-2(2-x)}+2"],
        answer: 2,
        choiceWhy: [
          "x 앞이 −2 이므로 −2 로 묶어야 해요.",
          "−2 로 묶으면 4 ÷ (−2) = −2 이라 x − 2 가 남습니다.",
          "",
          "−2 로 묶은 뒤 안에 남는 것은 2 − x 가 아니라 x − 2 예요.",
        ],
        why: "4 − 2x = −2(x − 2) 이므로 a = −2, p = 2, q = 2 예요. a 가 음수라 그래프가 왼쪽으로 뻗습니다.",
      },
    ],
    domChoices: [
      [{ pre: "정의역 ", tex: "x\\geq 2" }, { pre: ", 치역 ", tex: "y\\geq 2" }],
      [{ pre: "정의역 ", tex: "x\\leq 2" }, { pre: ", 치역 ", tex: "y\\geq 2" }],
      [{ pre: "정의역 ", tex: "x\\leq 2" }, { pre: ", 치역 ", tex: "y\\leq 2" }],
      [{ pre: "정의역 ", tex: "x\\leq 4" }, { pre: ", 치역 ", tex: "y\\geq 2" }],
    ],
    domAnswer: 1,
    domWhy: [
      "a 가 음수이면 정의역이 왼쪽으로 뻗어요.",
      "",
      "근호 앞에 음의 부호가 없으므로 값이 q 보다 커집니다.",
      "4 − 2x ≥ 0 을 풀면 x ≤ 2 예요. 2 로 나누는 것을 잊었습니다.",
    ],
    domNote: "시작점은 (2, 2) 이고 왼쪽 위로 뻗어요.",
  },
  {
    id: "g3",
    rawTex: "y=-\\sqrt{2x+8}+1",
    a: 2,
    p: -4,
    q: 1,
    s: -1,
    formTex: "y=-\\sqrt{2(x+4)}+1",
    steps: [
      {
        badge: "묶기",
        q: "근호 안을 a(x−p) 꼴로 묶으면?",
        choices: ["-\\sqrt{2(x+8)}+1", "-\\sqrt{2(x+4)}+1", "-\\sqrt{2(x-4)}+1", "-2\\sqrt{x+4}+1"],
        answer: 1,
        choiceWhy: [
          "2 로 묶으면 8 ÷ 2 = 4 가 남아요.",
          "",
          "부호를 반대로 보았어요. 2x+8 = 2(x+4) 입니다.",
          "2 는 근호 안에 있으므로 그대로 밖으로 나올 수 없어요.",
        ],
        why: "2x + 8 = 2(x + 4) 이므로 a = 2, p = −4, q = 1 이에요. 근호 앞의 음의 부호 때문에 아래로 뻗습니다.",
      },
    ],
    domChoices: [
      [{ pre: "정의역 ", tex: "x\\geq -4" }, { pre: ", 치역 ", tex: "y\\geq 1" }],
      [{ pre: "정의역 ", tex: "x\\leq -4" }, { pre: ", 치역 ", tex: "y\\leq 1" }],
      [{ pre: "정의역 ", tex: "x\\geq -8" }, { pre: ", 치역 ", tex: "y\\leq 1" }],
      [{ pre: "정의역 ", tex: "x\\geq -4" }, { pre: ", 치역 ", tex: "y\\leq 1" }],
    ],
    domAnswer: 3,
    domWhy: [
      "근호 앞의 음의 부호 때문에 값이 1 보다 커질 수 없어요.",
      "a 가 양수이면 정의역이 오른쪽으로 뻗습니다.",
      "2x + 8 ≥ 0 을 풀면 x ≥ −4 예요. 2 로 나누는 것을 잊었습니다.",
      "",
    ],
    domNote: "시작점은 (−4, 1) 이고 오른쪽 아래로 뻗어요.",
  },
  {
    id: "g4",
    rawTex: "y=-\\sqrt{9-3x}-2",
    a: -3,
    p: 3,
    q: -2,
    s: -1,
    formTex: "y=-\\sqrt{-3(x-3)}-2",
    steps: [
      {
        badge: "묶기",
        q: "근호 안을 a(x−p) 꼴로 묶으면?",
        choices: ["-\\sqrt{-3(x+3)}-2", "-\\sqrt{3(x-3)}-2", "-\\sqrt{-3(3-x)}-2", "-\\sqrt{-3(x-3)}-2"],
        answer: 3,
        choiceWhy: [
          "−3 으로 묶으면 9 ÷ (−3) = −3 이라 x − 3 이 남아요.",
          "x 앞이 −3 이므로 −3 으로 묶어야 합니다.",
          "−3 으로 묶은 뒤 안에 남는 것은 3 − x 가 아니라 x − 3 이에요.",
          "",
        ],
        why: "9 − 3x = −3(x − 3) 이므로 a = −3, p = 3, q = −2 예요. 왼쪽 아래로 뻗는 그래프입니다.",
      },
    ],
    domChoices: [
      [{ pre: "정의역 ", tex: "x\\leq 3" }, { pre: ", 치역 ", tex: "y\\geq -2" }],
      [{ pre: "정의역 ", tex: "x\\geq 3" }, { pre: ", 치역 ", tex: "y\\leq -2" }],
      [{ pre: "정의역 ", tex: "x\\leq 3" }, { pre: ", 치역 ", tex: "y\\leq -2" }],
      [{ pre: "정의역 ", tex: "x\\leq 9" }, { pre: ", 치역 ", tex: "y\\leq -2" }],
    ],
    domAnswer: 2,
    domWhy: [
      "근호 앞의 음의 부호 때문에 값이 −2 보다 커질 수 없어요.",
      "a 가 음수이면 정의역이 왼쪽으로 뻗습니다.",
      "",
      "9 − 3x ≥ 0 을 풀면 x ≤ 3 이에요. 3 으로 나누는 것을 잊었습니다.",
    ],
    domNote: "시작점은 (3, −2) 이고 왼쪽 아래로 뻗어요.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 역함수와의 교점 사냥 — 확대하며 보기
// ══════════════════════════════════════════════════════════════

export const ZOOMS = [4, 2, 1, 0.4, 0.15];
export const ZOOM_INIT = 0;

export type MeetCase = {
  id: string;
  /** f(x) = √(b − ax) (a > 0 이면 감소, a < 0 이면 증가) */
  a: number;
  b: number;
  fnTex: string;
  invTex: string;
  rising: boolean;
  /** 교점 — x 오름차순 */
  meets: Pt[];
  spots: { label: string; cx: number; cy: number }[];
  choices: Piece[][];
  answer: number;
  choiceWhy: string[];
  why: string;
};

/** f(x) = √(b − ax) */
export function meetF(c: MeetCase, x: number): number {
  return Math.sqrt(c.b - c.a * x);
}
/** f 의 역함수 — y = (b − x²)/a, 정의역 x ≥ 0 */
export function meetInv(c: MeetCase, x: number): number {
  return (c.b - x * x) / c.a;
}

const R17 = Math.sqrt(17);
const R2 = (-1 + R17) / 2;

export const MEET_CASES: MeetCase[] = [
  {
    id: "u1",
    a: -1,
    b: 2,
    fnTex: "y=\\sqrt{x+2}",
    invTex: "y=x^2-2\\ (x\\geq 0)",
    rising: true,
    meets: [{ x: 2, y: 2 }],
    spots: [
      { label: "전체", cx: 1, cy: 1 },
      { label: "교점 가까이", cx: 2, cy: 2 },
    ],
    choices: [[{ pre: "0 개" }], [{ pre: "1 개" }], [{ pre: "2 개" }], [{ pre: "3 개" }]],
    answer: 1,
    choiceWhy: [
      "두 그래프는 분명히 한 번 만나요. 확대해서 살펴보세요.",
      "",
      "증가하는 함수는 y = x 밖에서 만날 수 없어 교점이 더 늘지 않아요.",
      "확대해도 다른 교점은 나타나지 않습니다.",
    ],
    why: "증가하는 함수는 f(α) = β, f(β) = α 인 α < β 가 있으면 β < α 가 되어 모순이에요. 그래서 교점이 y = x 위에만 있고, √(x+2) = x 를 풀면 x = 2 하나입니다.",
  },
  {
    id: "u2",
    a: 1,
    b: 4,
    fnTex: "y=\\sqrt{4-x}",
    invTex: "y=4-x^2\\ (x\\geq 0)",
    rising: false,
    meets: [{ x: R2, y: R2 }],
    spots: [
      { label: "전체", cx: 1.6, cy: 1.6 },
      { label: "교점 가까이", cx: R2, cy: R2 },
    ],
    choices: [[{ pre: "1 개" }], [{ pre: "2 개" }], [{ pre: "3 개" }], [{ pre: "4 개" }]],
    answer: 0,
    choiceWhy: [
      "",
      "확대해 보면 두 곡선이 y = x 위에서 한 번만 스칩니다.",
      "감소한다고 늘 세 번 만나는 것은 아니에요.",
      "교점이 그렇게 많지는 않습니다.",
    ],
    why: "감소하는 함수지만 이 경우에는 y = x 위의 한 점에서만 만나요. √(4−x) = x 를 풀면 x = (−1+√17)/2 ≈ 1.56 입니다. 감소한다고 해서 늘 교점이 셋인 것은 아니에요.",
  },
  {
    id: "u3",
    a: 4,
    b: 13,
    fnTex: "y=\\sqrt{13-4x}",
    invTex: "y=\\dfrac{13-x^2}{4}\\ (x\\geq 0)",
    rising: false,
    meets: [
      { x: 1, y: 3 },
      { x: R17 - 2, y: R17 - 2 },
      { x: 3, y: 1 },
    ],
    spots: [
      { label: "전체", cx: 2, cy: 2 },
      { label: "왼쪽 위", cx: 1, cy: 3 },
      { label: "가운데", cx: R17 - 2, cy: R17 - 2 },
      { label: "오른쪽 아래", cx: 3, cy: 1 },
    ],
    choices: [[{ pre: "1 개" }], [{ pre: "2 개" }], [{ pre: "3 개" }], [{ pre: "무수히 많다" }]],
    answer: 2,
    choiceWhy: [
      "y = x 위의 교점 말고도 두 곳에서 더 만나요. 확대해 보세요.",
      "y = x 위에도 교점이 하나 있습니다.",
      "",
      "두 곡선이 겹치는 것이 아니라 세 점에서 스치듯 만납니다.",
    ],
    why: "f(1) = 3, f(3) = 1 이므로 (1, 3) 과 (3, 1) 에서도 만나요. 여기에 y = x 위의 (√17−2, √17−2) 를 더해 모두 세 점입니다.",
  },
];

export const MEET_CONCEPT: Quiz = {
  id: "uc",
  prompt: "증가하는 무리함수 f 와 그 역함수의 교점이 반드시 y = x 위에 있는 까닭은?",
  choices: [
    [{ pre: "그래프가 곡선이기 때문" }],
    [{ pre: "증가함수는 정의역이 반직선이기 때문" }],
    [{ pre: "f(α) = β, f(β) = α 이고 α < β 라면 f 가 증가하므로 β < α 가 되어 모순이기 때문" }],
    [{ pre: "역함수가 언제나 증가함수이기 때문" }],
  ],
  answer: 2,
  choiceWhy: [
    "곡선인지 직선인지는 상관이 없어요. 감소하는 곡선은 y = x 밖에서도 만납니다.",
    "정의역의 모양과는 상관이 없어요.",
    "",
    "역함수가 증가하는 것은 맞지만 그것만으로는 설명이 되지 않아요.",
  ],
  why: "f(α) = β 이면 대칭인 점 (β, α) 가 역함수 위에 있고, 그 점도 교점이라면 f(β) = α 예요. α < β 인데 f 가 증가하면 f(α) < f(β), 곧 β < α 가 되어 모순입니다. 그래서 α = β, 곧 교점이 y = x 위에 있어야 해요.",
};

// ══════════════════════════════════════════════════════════════
// 탭 ⑤ 사분면 통과 미션
// ══════════════════════════════════════════════════════════════

export const MISS_VIEW: View = { xMin: -8, xMax: 8, yMin: -8, yMax: 8 };

export type Mission = {
  id: string;
  /** 고정된 값들 */
  a: number;
  s: 1 | -1;
  /** 움직이는 값이 p 인지 q 인지 */
  knob: "p" | "q";
  fixed: number;
  min: number;
  max: number;
  step: number;
  init: number;
  texOf: (v: number) => string;
  goal: string;
  /** 목표를 이룬 상태인가 */
  hit: (quad: boolean[]) => boolean;
  /** 답인 범위를 만족하는가 — 완전탐색으로 hit 과 맞는지 검사한다 */
  ok: (v: number) => boolean;
  choices: Piece[][];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const MISSIONS: Mission[] = [
  {
    id: "m1",
    a: 1,
    s: 1,
    knob: "q",
    fixed: -3,
    min: -4,
    max: 4,
    step: 0.5,
    init: -2,
    texOf: (q) => `y=\\sqrt{x+3}${q === 0 ? "" : q > 0 ? `+${q}` : `-${-q}`}`,
    goal: "제3사분면과 제4사분면을 지나지 않게",
    hit: (Q) => !Q[2] && !Q[3],
    ok: (q) => q >= 0,
    choices: [[{ tex: "q>0" }], [{ tex: "q\\geq 0" }], [{ tex: "q\\leq 0" }], [{ tex: "q\\geq \\sqrt{3}" }]],
    answer: 1,
    choiceWhy: [
      "q = 0 이면 시작점이 (−3, 0) 이고 그 뒤로는 값이 모두 양수라 아래쪽 사분면을 지나지 않아요.",
      "",
      "q 가 음수이면 시작점이 x축 아래에 놓여 제3사분면을 지납니다.",
      "√3 까지 올릴 필요는 없어요. q = 0 이면 이미 조건을 만족합니다.",
    ],
    why: "시작점 (−3, q) 가 x축 아래에 있으면 곧바로 제3사분면을 지나요. q ≥ 0 이면 모든 값이 0 이상이라 아래쪽 두 사분면을 지나지 않습니다.",
  },
  {
    id: "m2",
    a: 1,
    s: 1,
    knob: "p",
    fixed: -2,
    min: -8,
    max: 2,
    step: 0.5,
    init: 0,
    texOf: (p) => `y=\\sqrt{x${p === 0 ? "" : p > 0 ? `-${p}` : `+${-p}`}}-2`,
    goal: "제1·2·3사분면을 모두 지나게",
    hit: (Q) => Q[0] && Q[1] && Q[2],
    ok: (p) => p < -4,
    choices: [[{ tex: "p<-4" }], [{ tex: "p\\leq -4" }], [{ tex: "p<0" }], [{ tex: "p<-2" }]],
    answer: 0,
    choiceWhy: [
      "",
      "p = −4 이면 값이 양수가 되는 곳이 x > 0 뿐이라 제2사분면을 지나지 않아요.",
      "제2사분면까지 지나려면 y = 0 이 되는 자리가 y축 왼쪽에 있어야 합니다.",
      "p = −3 을 넣어 보면 제2사분면을 지나지 않아요.",
    ],
    why: "y = 0 이 되는 자리는 x = p + 4 예요. 제2사분면을 지나려면 그 자리가 y축보다 왼쪽에 있어야 하므로 p + 4 < 0, 곧 p < −4 입니다.",
  },
  {
    id: "m3",
    a: 1,
    s: -1,
    knob: "q",
    fixed: -4,
    min: -4,
    max: 4,
    step: 0.5,
    init: 2,
    texOf: (q) => `y=-\\sqrt{x+4}${q === 0 ? "" : q > 0 ? `+${q}` : `-${-q}`}`,
    goal: "제2사분면을 지나지 않게",
    hit: (Q) => !Q[1],
    ok: (q) => q <= 0,
    choices: [[{ tex: "q<0" }], [{ tex: "q\\geq 0" }], [{ tex: "q\\leq 0" }], [{ tex: "q\\leq -2" }]],
    answer: 2,
    choiceWhy: [
      "q = 0 이면 시작점이 (−4, 0) 으로 x축 위에 있어 제2사분면을 지나지 않아요.",
      "q 가 양수이면 시작점 (−4, q) 가 곧바로 제2사분면에 놓입니다.",
      "",
      "−2 까지 내릴 필요는 없어요. q = 0 이면 이미 조건을 만족합니다.",
    ],
    why: "이 그래프는 시작점 (−4, q) 에서 오른쪽 아래로만 내려가요. 시작점이 가장 높은 점이므로 q ≤ 0 이면 왼쪽 위 영역에 아예 들어가지 않습니다.",
  },
  {
    id: "m4",
    a: 2,
    s: 1,
    knob: "p",
    fixed: -3,
    min: -8,
    max: 2,
    step: 0.5,
    init: 0,
    texOf: (p) => `y=\\sqrt{2(x${p === 0 ? "" : p > 0 ? `-${p}` : `+${-p}`})}-3`,
    goal: "제4사분면을 지나지 않게",
    hit: (Q) => !Q[3],
    ok: (p) => p <= -4.5,
    choices: [[{ tex: "p\\leq -4" }], [{ tex: "p<-\\dfrac{9}{2}" }], [{ tex: "p\\geq -\\dfrac{9}{2}" }], [{ tex: "p\\leq -\\dfrac{9}{2}" }]],
    answer: 3,
    choiceWhy: [
      "p = −4 이면 y = 0 이 되는 자리가 x = 0.5 라 제4사분면을 지나요.",
      "p = −9/2 이면 y = 0 이 되는 자리가 바로 원점이라 제4사분면을 지나지 않아요. 등호가 들어갑니다.",
      "부등호의 방향이 반대예요. p 가 클수록 그래프가 오른쪽으로 밀립니다.",
      "",
    ],
    why: "y = 0 이 되는 자리는 2(x − p) = 9, 곧 x = p + 4.5 예요. 값이 음수인 구간이 y축 왼쪽에만 있으려면 p + 4.5 ≤ 0, 곧 p ≤ −9/2 입니다.",
  },
];
