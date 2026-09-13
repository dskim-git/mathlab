// 역함수의 그래프 — 활동 데이터
//
//  [대칭] f 가 일대일대응이면  y = f(x) ⟺ x = f⁻¹(y) 이므로
//        점 (a, b) 가 y = f(x) 위에 있으면 점 (b, a) 는 y = f⁻¹(x) 위에 있다.
//        두 점 (a, b), (b, a) 의 중점은 ((a+b)/2, (a+b)/2) 로 늘 직선 y = x 위에 있고,
//        두 점을 이은 선분의 기울기는 (a−b)/(b−a) = −1 로 y = x 와 수직이다.
//        곧 y = x 가 선분 PP' 의 수직이등분선이므로 두 그래프는 직선 y = x 에 대하여 대칭이다.
//
//  [교점] y = f(x) 와 y = x 의 교점 (a, a) 는 f(a) = a 이므로 f⁻¹(a) = a 이고,
//        따라서 y = f⁻¹(x) 위에도 있다. 그래서 「f 와 y = x 의 교점」은 늘 「f 와 f⁻¹ 의 교점」이다.
//        그러나 그 역은 참이 아니다. f 와 f⁻¹ 의 교점이 직선 y = x 위에만 있는 것은 아니다.
//
//        · f 가 증가함수이면 교점은 반드시 y = x 위에 있다.
//          (f(a) = b, f(b) = a 이고 a < b 라 하면 f 가 증가하므로 b = f(a) < f(b) = a 가 되어 모순)
//        · f 가 감소함수이면 y = x 밖에서도 만날 수 있다.
//          f(x) = −x³ 은 f⁻¹(x) = −∛x 이고 두 그래프는 (0, 0) 말고도 (1, −1), (−1, 1) 에서 만난다.
//          f(x) = 6 − x 나 f(x) = 4/x 처럼 f = f⁻¹ 인 함수는 그래프가 통째로 겹쳐
//          교점이 무수히 많고 그 가운데 y = x 위의 점은 하나뿐이다.
//
//  [일차함수 y = ax + b (a ≠ 0)] f⁻¹(x) = (x − b)/a 이므로
//        · a ≠ 1, a ≠ −1 : ax + b = (x − b)/a 를 풀면 x = −b/(a − 1) 이고 그때 y = x 다.
//                          교점이 하나뿐이며 언제나 직선 y = x 위에 있다.
//        · a = −1        : f(x) = −x + b 의 역함수도 −x + b 라 두 그래프가 통째로 겹친다.
//                          교점이 무수히 많고 y = x 위의 것은 (b/2, b/2) 하나뿐이다.
//        · a = 1, b ≠ 0  : f⁻¹(x) = x − b 로 기울기가 같아 평행하므로 교점이 없다.
//        · a = 1, b = 0  : f 와 f⁻¹ 이 모두 y = x 라 그래프가 y = x 와 완전히 같다.

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

export type Pt = [number, number];

// ══════════════════════════════════════════════════════════════
// 좌표평면 — 공용
// ══════════════════════════════════════════════════════════════
export const PV = { size: 300, min: -5, max: 5, pad: 18 };

export function pvX(v: number): number {
  return PV.pad + ((v - PV.min) / (PV.max - PV.min)) * (PV.size - 2 * PV.pad);
}
export function pvY(v: number): number {
  return PV.pad + ((PV.max - v) / (PV.max - PV.min)) * (PV.size - 2 * PV.pad);
}
export const PV_TICKS = [-4, -3, -2, -1, 1, 2, 3, 4];

/** 작은 좌표평면 — 탭 ③ 의 보기 그림 */
export const MV = { size: 136, min: -5, max: 5, pad: 8 };
export function mvX(v: number): number {
  return MV.pad + ((v - MV.min) / (MV.max - MV.min)) * (MV.size - 2 * MV.pad);
}
export function mvY(v: number): number {
  return MV.pad + ((MV.max - v) / (MV.max - MV.min)) * (MV.size - 2 * MV.pad);
}

type Box = { min: number; max: number; toX: (v: number) => number; toY: (v: number) => number };
export const BIG: Box = { min: PV.min, max: PV.max, toX: pvX, toY: pvY };
export const SMALL: Box = { min: MV.min, max: MV.max, toX: mvX, toY: mvY };

/**
 * 함수를 창 안의 꺾은선 조각들로 바꾼다.
 * 창을 벗어나는 자리는 이분법으로 테두리까지만 이어 붙이므로 좌표가 언제나 그림 상자 안에 들어온다.
 */
export function traceFn(fn: (x: number) => number | null, dom: [number, number], box: Box = BIG): Pt[][] {
  const N = 900;
  const lo = Math.max(dom[0], box.min);
  const hi = Math.min(dom[1], box.max);
  const inWin = (y: number) => y >= box.min && y <= box.max;
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  let px: number | null = null;
  let py: number | null = null;

  const edgePoint = (xIn: number, xOut: number): Pt => {
    let a = xIn;
    let b = xOut;
    for (let k = 0; k < 40; k++) {
      const m = (a + b) / 2;
      const ym = fn(m);
      if (ym === null || !Number.isFinite(ym) || !inWin(ym)) b = m;
      else a = m;
    }
    const ya = fn(a);
    const y = ya === null || !Number.isFinite(ya) ? box.min : Math.max(box.min, Math.min(box.max, ya));
    return [a, y];
  };

  const flush = () => {
    if (cur.length > 1) out.push(cur);
    cur = [];
  };

  for (let i = 0; i <= N; i++) {
    const x = lo + ((hi - lo) * i) / N;
    const yr = fn(x);
    const y = yr === null || !Number.isFinite(yr) ? null : yr;
    const good = y !== null && inWin(y) && (py === null || Math.abs(y - py) <= 6);
    if (good) {
      if (cur.length === 0 && px !== null && py !== null) cur.push(edgePoint(x, px));
      cur.push([x, y as number]);
    } else {
      if (cur.length > 0 && px !== null && py !== null) cur.push(edgePoint(px, x));
      flush();
    }
    px = x;
    py = y;
  }
  flush();
  return out;
}

export function svgPath(poly: Pt[], box: Box = BIG): string {
  return "M" + poly.map(([x, y]) => `${box.toX(x).toFixed(2)},${box.toY(y).toFixed(2)}`).join(" L");
}

export function nx(v: number): string {
  const r = Math.round(v * 100) / 100;
  return r < 0 ? "−" + String(Math.abs(r)) : String(r);
}
/** KaTeX 에 넣을 수 있도록 ASCII 음수 기호로 */
export function tx(v: number): string {
  return String(Math.round(v * 100) / 100);
}

export const cbrt = (x: number) => Math.cbrt(x);
export const root5 = (x: number) => Math.sign(x) * Math.abs(x) ** (1 / 5);

// ══════════════════════════════════════════════════════════════
// 탭 ① 점을 하나씩 옮겨 보기
// ══════════════════════════════════════════════════════════════
export type SymFn = {
  id: string;
  fTex: string;
  invTex: string;
  f: (x: number) => number;
  inv: (x: number) => number;
  /** 슬라이더가 움직일 범위 */
  dom: [number, number];
  /** 역함수 그래프를 그릴 범위 */
  invDom: [number, number];
  note: string;
};

export const SYM_FNS: SymFn[] = [
  {
    id: "g1",
    fTex: "f(x)=3x-1",
    invTex: "f^{-1}(x)=\\dfrac{x+1}{3}",
    f: (x) => 3 * x - 1,
    inv: (x) => (x + 1) / 3,
    dom: [-1.25, 2],
    invDom: [-4.75, 5],
    note: "가파른 직선의 역함수는 완만한 직선이 돼요. 기울기 3 이 기울기 1/3 로 뒤집힙니다.",
  },
  {
    id: "g2",
    fTex: "f(x)=\\dfrac{1}{2}x+2",
    invTex: "f^{-1}(x)=2x-4",
    f: (x) => x / 2 + 2,
    inv: (x) => 2 * x - 4,
    dom: [-5, 5],
    invDom: [-0.5, 4.5],
    note: "y절편 2 가 역함수에서는 x절편 2 가 돼요. 축이 뒤바뀌기 때문입니다.",
  },
  {
    id: "g3",
    fTex: "f(x)=x^2 \\ (x \\ge 0)",
    invTex: "f^{-1}(x)=\\sqrt{x}",
    f: (x) => x * x,
    inv: (x) => Math.sqrt(x),
    dom: [0, 2],
    invDom: [0, 4],
    note: "정의역을 0 이상으로 좁혔더니 일대일대응이 되었고, 그 역함수가 바로 제곱근이에요. 곡선도 똑같이 대칭이 됩니다.",
  },
  {
    id: "g4",
    fTex: "f(x)=-x+4",
    invTex: "f^{-1}(x)=-x+4",
    f: (x) => -x + 4,
    inv: (x) => -x + 4,
    dom: [-1, 5],
    invDom: [-1, 5],
    note: "역함수가 자기 자신이라 두 그래프가 완전히 겹쳐요. 그래프가 이미 직선 y = x 에 대하여 대칭이기 때문입니다.",
  },
];

export const SYM_STEP = 0.25;

export type PtTask = {
  id: string;
  prompt: Piece[];
  choices: string[];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const PT_TASKS: PtTask[] = [
  {
    id: "p1",
    prompt: [{ tex: "y=f(x)" }, { pre: " 의 그래프가 점 " }, { tex: "(3,\\ 7)" }, { pre: " 을 지날 때 " }, { tex: "y=f^{-1}(x)" }, { pre: " 의 그래프가 반드시 지나는 점은?" }],
    choices: ["(3,\\ 7)", "(7,\\ 3)", "(-3,\\ -7)", "(-7,\\ -3)"],
    answer: 1,
    choiceWhy: [
      "그대로 옮겨 적으면 안 돼요. 두 좌표를 맞바꾸어야 합니다.",
      "",
      "부호를 바꾸는 것은 원점에 대한 대칭이에요.",
      "좌표를 바꾸고 부호까지 바꾸어 버렸습니다.",
    ],
    why: "f(3) = 7 은 f⁻¹(7) = 3 과 같은 말이에요. 그래서 (7, 3) 을 지납니다.",
  },
  {
    id: "p2",
    prompt: [{ tex: "y=f^{-1}(x)" }, { pre: " 의 그래프가 점 " }, { tex: "(-2,\\ 5)" }, { pre: " 를 지날 때 " }, { tex: "y=f(x)" }, { pre: " 의 그래프가 지나는 점은?" }],
    choices: ["(2,\\ -5)", "(-5,\\ 2)", "(5,\\ -2)", "(-2,\\ 5)"],
    answer: 2,
    choiceWhy: [
      "부호를 바꾸는 것이 아니라 좌표를 맞바꾸어야 해요.",
      "좌표를 바꾸면서 부호까지 옮겨 버렸습니다.",
      "",
      "그대로 옮겨 적었어요. 두 좌표를 맞바꾸어야 합니다.",
    ],
    why: "f⁻¹(-2) = 5 는 f(5) = -2 와 같은 말이에요. 되돌리는 방향도 좌표를 맞바꾸면 됩니다.",
  },
  {
    id: "p3",
    prompt: [{ tex: "f(1)=1" }, { pre: " 일 때 점 " }, { tex: "(1,\\ 1)" }, { pre: " 에 대하여 옳은 것은?" }],
    choices: [
      "y=f(x) \\ \\text{only}",
      "y=f^{-1}(x) \\ \\text{only}",
      "\\text{neither}",
      "\\text{both}",
    ],
    answer: 3,
    choiceWhy: [
      "f⁻¹(1) = 1 이기도 하므로 역함수의 그래프 위에도 있어요.",
      "f(1) = 1 이니 처음 함수의 그래프 위에도 있습니다.",
      "두 그래프 위에 모두 있어요.",
      "",
    ],
    why: "f(1) = 1 이면 f⁻¹(1) = 1 이기도 해요. 좌표를 맞바꿔도 (1, 1) 그대로라 두 그래프 위에 모두 있고, 직선 y = x 위의 점입니다.",
  },
  {
    id: "p4",
    prompt: [{ tex: "y=f(x)" }, { pre: " 의 " }, { tex: "y" }, { pre: "절편이 " }, { tex: "4" }, { pre: " 일 때 " }, { tex: "y=f^{-1}(x)" }, { pre: " 에 대하여 알 수 있는 것은?" }],
    choices: [
      "y \\text{-intercept} = 4",
      "x \\text{-intercept} = 4",
      "y \\text{-intercept} = -4",
      "x \\text{-intercept} = -4",
    ],
    answer: 1,
    choiceWhy: [
      "축이 뒤바뀌므로 y절편이 그대로 옮겨 가지 않아요.",
      "",
      "부호가 바뀌는 것이 아닙니다.",
      "부호가 바뀔 까닭이 없어요.",
    ],
    why: "y절편이 4 라는 것은 그래프가 점 (0, 4) 를 지난다는 뜻이에요. 좌표를 맞바꾸면 (4, 0) 이므로 역함수의 x절편이 4 가 됩니다.",
  },
  {
    id: "p5",
    prompt: [{ pre: "두 그래프가 모두 점 " }, { tex: "(2,\\ 2)" }, { pre: " 를 지날 때 그 점이 놓인 직선은?" }],
    choices: ["y=-x", "y=2x", "y=x", "x=2"],
    answer: 2,
    choiceWhy: [
      "두 좌표의 부호가 서로 반대여야 이 직선 위에 놓입니다.",
      "x 가 2 일 때 y 가 4 가 되어야 이 직선 위예요.",
      "",
      "x = 2 는 세로선일 뿐이라 두 좌표가 같다는 사실을 담지 못해요.",
    ],
    why: "x좌표와 y좌표가 같은 점이 놓이는 직선이 y = x 예요. 좌표를 맞바꾸어도 같은 점이라 두 그래프가 함께 지납니다.",
  },
  {
    id: "p6",
    prompt: [{ pre: "점 " }, { tex: "(a,\\ b)" }, { pre: " 와 점 " }, { tex: "(b,\\ a)" }, { pre: " 를 이은 선분의 중점은 어디에 있을까요?" }],
    choices: ["\\text{on } y=x", "\\text{on } y=-x", "\\text{at the origin}", "\\text{nowhere fixed}"],
    answer: 0,
    choiceWhy: [
      "",
      "두 좌표를 더해 반으로 나눈 값이 x좌표와 y좌표 모두에 같이 나타납니다.",
      "a 와 b 가 0 일 때만 원점이 돼요.",
      "언제나 한 직선 위에 놓입니다.",
    ],
    why: "중점의 좌표는 두 좌표가 모두 (a + b)/2 로 같아요. 그래서 a, b 가 무엇이든 늘 직선 y = x 위에 있습니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 교점은 어디에?
// ══════════════════════════════════════════════════════════════
/** 교점이 놓인 자리 — 0: y=x 위에만, 1: y=x 밖에도, 2: 교점 없음 */
export const CROSS_CHOICES = ["직선 y = x 위에만 있다", "직선 y = x 밖에도 있다", "교점이 없다"];

export type CrossFn = {
  id: string;
  fTex: string;
  invTex: string;
  f: (x: number) => number | null;
  inv: (x: number) => number | null;
  dom: [number, number];
  invDom: [number, number];
  /** 오르는 함수인가 내리는 함수인가 */
  rising: boolean;
  kind: 0 | 1 | 2;
  /** 그림에 찍을 교점 (그래프가 통째로 겹칠 때는 비워 둔다) */
  pts: Pt[];
  /** 두 그래프가 완전히 겹치는가 */
  same: boolean;
  why: string;
};

export const CROSS_FNS: CrossFn[] = [
  {
    id: "c1",
    fTex: "f(x)=3x-1",
    invTex: "f^{-1}(x)=\\dfrac{x+1}{3}",
    f: (x) => 3 * x - 1,
    inv: (x) => (x + 1) / 3,
    dom: [-5, 5],
    invDom: [-5, 5],
    rising: true,
    kind: 0,
    pts: [[0.5, 0.5]],
    same: false,
    why: "오르는 함수라 교점은 반드시 직선 y = x 위에 있어요. 한 점 (0.5, 0.5) 에서 만납니다.",
  },
  {
    id: "c2",
    fTex: "f(x)=x^3",
    invTex: "f^{-1}(x)=\\sqrt[3]{x}",
    f: (x) => x ** 3,
    inv: (x) => Math.cbrt(x),
    dom: [-5, 5],
    invDom: [-5, 5],
    rising: true,
    kind: 0,
    pts: [
      [-1, -1],
      [0, 0],
      [1, 1],
    ],
    same: false,
    why: "교점이 셋이나 되지만 모두 직선 y = x 위예요. 오르는 함수는 아무리 많이 만나도 y = x 를 벗어나지 않습니다.",
  },
  {
    id: "c3",
    fTex: "f(x)=6-x",
    invTex: "f^{-1}(x)=6-x",
    f: (x) => 6 - x,
    inv: (x) => 6 - x,
    dom: [-5, 5],
    invDom: [-5, 5],
    rising: false,
    kind: 1,
    pts: [],
    same: true,
    why: "역함수가 자기 자신이라 두 그래프가 통째로 겹쳐요. 교점이 무수히 많고 그 가운데 y = x 위의 점은 (3, 3) 하나뿐입니다.",
  },
  {
    id: "c4",
    fTex: "f(x)=-x^3",
    invTex: "f^{-1}(x)=-\\sqrt[3]{x}",
    f: (x) => -(x ** 3),
    inv: (x) => -Math.cbrt(x),
    dom: [-5, 5],
    invDom: [-5, 5],
    rising: false,
    kind: 1,
    pts: [
      [-1, 1],
      [0, 0],
      [1, -1],
    ],
    same: false,
    why: "교점이 셋인데 (0, 0) 만 y = x 위에 있고 (1, -1) 과 (-1, 1) 은 벗어나 있어요. 내리는 함수에서는 이런 일이 생깁니다.",
  },
  {
    id: "c5",
    fTex: "f(x)=\\dfrac{4}{x} \\ (x>0)",
    invTex: "f^{-1}(x)=\\dfrac{4}{x}",
    f: (x) => (x <= 0.05 ? null : 4 / x),
    inv: (x) => (x <= 0.05 ? null : 4 / x),
    dom: [0.05, 5],
    invDom: [0.05, 5],
    rising: false,
    kind: 1,
    pts: [],
    same: true,
    why: "이 함수도 역함수가 자기 자신이에요. 곡선 전체가 교점이고 y = x 위의 점은 (2, 2) 하나뿐입니다.",
  },
  {
    id: "c6",
    fTex: "f(x)=x+3",
    invTex: "f^{-1}(x)=x-3",
    f: (x) => x + 3,
    inv: (x) => x - 3,
    dom: [-5, 5],
    invDom: [-5, 5],
    rising: true,
    kind: 2,
    pts: [],
    same: false,
    why: "기울기가 같아 두 직선이 평행해요. 만나는 점이 하나도 없습니다.",
  },
];

export type CrossTask = {
  id: string;
  fTex: string;
  f: (x: number) => number | null;
  inv: (x: number) => number | null;
  dom: [number, number];
  invDom: [number, number];
  pts: Pt[];
  same: boolean;
  answer: 0 | 1 | 2;
  choiceWhy: string[];
  why: string;
};

export const CROSS_TASKS: CrossTask[] = [
  {
    id: "q1",
    fTex: "f(x)=2x+1",
    f: (x) => 2 * x + 1,
    inv: (x) => (x - 1) / 2,
    dom: [-5, 5],
    invDom: [-5, 5],
    pts: [[-1, -1]],
    same: false,
    answer: 0,
    choiceWhy: [
      "",
      "오르는 함수라 y = x 를 벗어난 교점은 생기지 않아요.",
      "기울기가 달라 두 직선이 반드시 만납니다.",
    ],
    why: "오르는 직선이라 교점은 y = x 위에 있어요. 2x + 1 = x 를 풀면 x = -1 이고 교점은 (-1, -1) 입니다.",
  },
  {
    id: "q2",
    fTex: "f(x)=x-4",
    f: (x) => x - 4,
    inv: (x) => x + 4,
    dom: [-5, 5],
    invDom: [-5, 5],
    pts: [],
    same: false,
    answer: 2,
    choiceWhy: [
      "만나는 점이 아예 없어요.",
      "만나는 점이 아예 없습니다.",
      "",
    ],
    why: "기울기가 둘 다 1 이라 두 직선이 평행해요. 기울기가 1 이면서 y절편이 다르면 교점이 없습니다.",
  },
  {
    id: "q3",
    fTex: "f(x)=-x",
    f: (x) => -x,
    inv: (x) => -x,
    dom: [-5, 5],
    invDom: [-5, 5],
    pts: [],
    same: true,
    answer: 1,
    choiceWhy: [
      "y = x 위의 점은 원점 하나뿐이고 나머지 교점은 모두 벗어나 있어요.",
      "",
      "두 그래프가 통째로 겹쳐 교점이 무수히 많습니다.",
    ],
    why: "역함수가 자기 자신이라 직선 전체가 교점이에요. 그 가운데 y = x 위의 점은 원점 하나뿐이고 나머지는 모두 벗어나 있습니다.",
  },
  {
    id: "q4",
    fTex: "f(x)=\\dfrac{1}{3}x",
    f: (x) => x / 3,
    inv: (x) => 3 * x,
    dom: [-5, 5],
    invDom: [-5, 5],
    pts: [[0, 0]],
    same: false,
    answer: 0,
    choiceWhy: [
      "",
      "오르는 함수라 y = x 를 벗어난 교점이 없어요.",
      "두 직선이 원점에서 만납니다.",
    ],
    why: "기울기가 1/3 과 3 인 두 직선이 원점에서 만나요. 오르는 함수이므로 교점은 y = x 위에 있습니다.",
  },
  {
    id: "q5",
    fTex: "f(x)=-x^5",
    f: (x) => -(x ** 5),
    inv: (x) => -(Math.sign(x) * Math.abs(x) ** (1 / 5)),
    dom: [-5, 5],
    invDom: [-5, 5],
    pts: [
      [-1, 1],
      [0, 0],
      [1, -1],
    ],
    same: false,
    answer: 1,
    choiceWhy: [
      "(1, -1) 과 (-1, 1) 은 y = x 위의 점이 아니에요.",
      "",
      "원점에서도 만나고 다른 두 곳에서도 만납니다.",
    ],
    why: "내리는 함수라 y = x 를 벗어난 교점이 생겨요. (0, 0) 말고도 (1, -1), (-1, 1) 에서 만납니다.",
  },
  {
    id: "q6",
    fTex: "f(x)=x+5",
    f: (x) => x + 5,
    inv: (x) => x - 5,
    dom: [-5, 5],
    invDom: [-5, 5],
    pts: [],
    same: false,
    answer: 2,
    choiceWhy: [
      "만나는 점이 없어요.",
      "만나는 점이 없습니다.",
      "",
    ],
    why: "기울기가 같은 두 직선이라 평행해요. 아무리 멀리 가도 만나지 않습니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 역함수의 그래프 고르기
// ══════════════════════════════════════════════════════════════
export type GraphChoice = {
  tex: string;
  g: (x: number) => number | null;
  dom: [number, number];
};

export type GraphTask = {
  id: string;
  fTex: string;
  f: (x: number) => number | null;
  dom: [number, number];
  choices: GraphChoice[];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const GRAPH_TASKS: GraphTask[] = [
  {
    id: "r1",
    fTex: "f(x)=2x+2",
    f: (x) => 2 * x + 2,
    dom: [-5, 5],
    choices: [
      { tex: "y=-2x-2", g: (x) => -2 * x - 2, dom: [-5, 5] },
      { tex: "y=\\dfrac{1}{2}x-1", g: (x) => x / 2 - 1, dom: [-5, 5] },
      { tex: "y=-2x+2", g: (x) => -2 * x + 2, dom: [-5, 5] },
      { tex: "y=2x-2", g: (x) => 2 * x - 2, dom: [-5, 5] },
    ],
    answer: 1,
    choiceWhy: [
      "x축에 대하여 뒤집은 그래프예요. y = x 대칭이 아닙니다.",
      "",
      "y축에 대하여 뒤집은 그래프입니다.",
      "원점에 대하여 뒤집은 그래프예요.",
    ],
    why: "기울기 2 가 1/2 로 뒤집히고 y절편 2 가 x절편 2 로 옮겨 가요. 직선 y = x 에 대하여 접은 모습입니다.",
  },
  {
    id: "r2",
    fTex: "f(x)=x^2 \\ (x \\ge 0)",
    f: (x) => (x < 0 ? null : x * x),
    dom: [0, 5],
    choices: [
      { tex: "y=x^2 \\ (x \\le 0)", g: (x) => (x > 0 ? null : x * x), dom: [-5, 0] },
      { tex: "y=-x^2 \\ (x \\ge 0)", g: (x) => (x < 0 ? null : -(x * x)), dom: [0, 5] },
      { tex: "y=\\sqrt{x}", g: (x) => (x < 0 ? null : Math.sqrt(x)), dom: [0, 5] },
      { tex: "y=-x^2 \\ (x \\le 0)", g: (x) => (x > 0 ? null : -(x * x)), dom: [-5, 0] },
    ],
    answer: 2,
    choiceWhy: [
      "y축에 대하여 뒤집은 그래프예요.",
      "x축에 대하여 뒤집은 그래프입니다.",
      "",
      "원점에 대하여 뒤집은 그래프예요.",
    ],
    why: "오른쪽으로 열린 반쪽 포물선이 눕는 모습이 제곱근의 그래프예요. 정의역을 0 이상으로 좁혔기에 역함수가 생겼습니다.",
  },
  {
    id: "r3",
    fTex: "f(x)=3-x",
    f: (x) => 3 - x,
    dom: [-5, 5],
    choices: [
      { tex: "y=x-3", g: (x) => x - 3, dom: [-5, 5] },
      { tex: "y=x+3", g: (x) => x + 3, dom: [-5, 5] },
      { tex: "y=-x-3", g: (x) => -x - 3, dom: [-5, 5] },
      { tex: "y=3-x", g: (x) => 3 - x, dom: [-5, 5] },
    ],
    answer: 3,
    choiceWhy: [
      "x축에 대하여 뒤집은 그래프예요.",
      "y축에 대하여 뒤집은 그래프입니다.",
      "원점에 대하여 뒤집은 그래프예요.",
      "",
    ],
    why: "역함수가 처음 함수와 똑같아요. 이 직선은 이미 y = x 에 대하여 대칭이라 접어도 제자리입니다.",
  },
  {
    id: "r4",
    fTex: "f(x)=\\dfrac{1}{2}x-2",
    f: (x) => x / 2 - 2,
    dom: [-5, 5],
    choices: [
      { tex: "y=2x+4", g: (x) => 2 * x + 4, dom: [-5, 5] },
      { tex: "y=-\\dfrac{1}{2}x+2", g: (x) => -x / 2 + 2, dom: [-5, 5] },
      { tex: "y=\\dfrac{1}{2}x+2", g: (x) => x / 2 + 2, dom: [-5, 5] },
      { tex: "y=-\\dfrac{1}{2}x-2", g: (x) => -x / 2 - 2, dom: [-5, 5] },
    ],
    answer: 0,
    choiceWhy: [
      "",
      "x축에 대하여 뒤집은 그래프예요.",
      "원점에 대하여 뒤집은 그래프입니다.",
      "y축에 대하여 뒤집은 그래프예요.",
    ],
    why: "완만한 직선의 역함수는 가파른 직선이 돼요. 기울기 1/2 이 2 로, x절편 4 가 y절편 4 로 옮겨 갑니다.",
  },
  {
    id: "r5",
    fTex: "f(x)=x^3+1",
    f: (x) => x ** 3 + 1,
    dom: [-5, 5],
    choices: [
      { tex: "y=-x^3+1", g: (x) => -(x ** 3) + 1, dom: [-5, 5] },
      { tex: "y=x^3-1", g: (x) => x ** 3 - 1, dom: [-5, 5] },
      { tex: "y=-x^3-1", g: (x) => -(x ** 3) - 1, dom: [-5, 5] },
      { tex: "y=\\sqrt[3]{x-1}", g: (x) => Math.cbrt(x - 1), dom: [-5, 5] },
    ],
    answer: 3,
    choiceWhy: [
      "y축에 대하여 뒤집은 그래프예요.",
      "원점에 대하여 뒤집은 그래프입니다.",
      "x축에 대하여 뒤집은 그래프예요.",
      "",
    ],
    why: "가파르게 서 있던 곡선이 누운 모습이 돼요. 점 (0, 1) 이 (1, 0) 으로 옮겨 간 것을 보면 알 수 있습니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 기울기가 정하는 교점
// ══════════════════════════════════════════════════════════════
export const AB = { aMin: -3, aMax: 3, bMin: -4, bMax: 4, step: 0.5, aInit: 2, bInit: 2 };

/** y = ax + b 와 그 역함수의 교점이 어떤 자리에 있는지 — 0: y=x 위에만, 1: 밖에도, 2: 없음, null: 역함수 없음 */
export function abKind(a: number, b: number): 0 | 1 | 2 | null {
  if (Math.abs(a) < 1e-9) return null;
  if (Math.abs(a + 1) < 1e-9) return 1;
  if (Math.abs(a - 1) < 1e-9) return Math.abs(b) < 1e-9 ? 0 : 2;
  return 0;
}

/** 교점이 하나뿐일 때 그 자리 */
export function abPoint(a: number, b: number): Pt | null {
  const k = abKind(a, b);
  if (k !== 0) return null;
  if (Math.abs(a - 1) < 1e-9) return null; // f = f⁻¹ = x 라 직선 전체가 교점
  const x = -b / (a - 1);
  return [x, x];
}

export const AB_GOALS = [
  "교점이 직선 y = x 위에만 있게 만들기",
  "교점이 직선 y = x 밖에도 있게 만들기",
  "교점이 아예 없게 만들기",
];

export type AbTask = {
  id: string;
  a: number;
  b: number;
  answer: 0 | 1 | 2;
  choiceWhy: string[];
  why: string;
};

export const AB_TASKS: AbTask[] = [
  {
    id: "t1",
    a: 2,
    b: 3,
    answer: 0,
    choiceWhy: [
      "",
      "기울기가 -1 일 때에만 y = x 를 벗어난 교점이 생겨요.",
      "기울기가 1 이 아니므로 두 직선이 반드시 만납니다.",
    ],
    why: "기울기가 1 도 -1 도 아니면 교점은 하나뿐이고 늘 y = x 위에 있어요. -b/(a-1) = -3 이므로 (-3, -3) 입니다.",
  },
  {
    id: "t2",
    a: -1,
    b: 4,
    answer: 1,
    choiceWhy: [
      "y = x 위의 점은 (2, 2) 하나뿐이고 나머지 교점은 모두 벗어나 있어요.",
      "",
      "두 그래프가 통째로 겹쳐 교점이 무수히 많습니다.",
    ],
    why: "기울기가 -1 이면 역함수가 자기 자신이라 두 그래프가 통째로 겹쳐요. 교점이 무수히 많고 y = x 위의 것은 (2, 2) 하나뿐입니다.",
  },
  {
    id: "t3",
    a: 1,
    b: -2,
    answer: 2,
    choiceWhy: [
      "만나는 점이 없어요.",
      "만나는 점이 없습니다.",
      "",
    ],
    why: "기울기가 1 이고 y절편이 0 이 아니면 역함수의 그래프와 평행해져요. 교점이 하나도 없습니다.",
  },
  {
    id: "t4",
    a: -3,
    b: 0,
    answer: 0,
    choiceWhy: [
      "",
      "내리는 직선이어도 기울기가 -1 이 아니면 y = x 를 벗어난 교점은 생기지 않아요.",
      "기울기가 다르므로 두 직선이 만납니다.",
    ],
    why: "내리는 직선이지만 기울기가 -1 이 아니라 교점은 원점 하나뿐이고 y = x 위에 있어요. 「내리면 무조건 벗어난다」가 아닙니다.",
  },
  {
    id: "t5",
    a: 1,
    b: 5,
    answer: 2,
    choiceWhy: [
      "만나는 점이 없어요.",
      "만나는 점이 없습니다.",
      "",
    ],
    why: "역함수가 y = x - 5 라 기울기가 같아요. 두 직선이 나란히 놓여 만나지 않습니다.",
  },
  {
    id: "t6",
    a: -1,
    b: -2,
    answer: 1,
    choiceWhy: [
      "y = x 위의 점은 (-1, -1) 하나뿐이고 나머지 교점은 모두 벗어나 있어요.",
      "",
      "두 그래프가 통째로 겹쳐 교점이 무수히 많습니다.",
    ],
    why: "기울기가 -1 이라 역함수가 자기 자신이에요. 직선 전체가 교점이고 y = x 위의 것은 (-1, -1) 하나뿐입니다.",
  },
];
