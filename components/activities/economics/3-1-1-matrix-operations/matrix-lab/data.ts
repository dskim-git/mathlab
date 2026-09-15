// 행렬의 연산과 활용 — 활동 데이터
//
//  · 행렬 : 여러 개의 수를 직사각형 모양으로 배열하고 괄호로 묶어 나타낸 것.
//    그것을 이루는 하나하나의 수가 성분이고, 가로줄이 행, 세로줄이 열이다.
//    행이 m개 열이 n개면 m×n 행렬, m = n 이면 n차 정사각행렬이다.
//    (i, j) 성분은 제i행 제j열의 수이고, m×n 행렬의 성분은 모두 mn개다.
//
//  · 덧셈·뺄셈·실수배는 모두 "같은 자리끼리"
//        (A ± B)_ij = a_ij ± b_ij        (두 행렬의 꼴이 같을 때만 정의된다)
//        (kA)_ij    = k · a_ij           (k 는 실수)
//    그래서 B − A 는 A − B 의 모든 성분의 부호를 바꾼 것과 같다.
//
//  · 곱셈만은 자리끼리가 아니다. m×l 행렬 A 와 l×n 행렬 B 에 대하여
//        (AB)_ij = a_i1·b_1j + a_i2·b_2j + … + a_il·b_lj
//    A 의 열 개수와 B 의 행 개수가 같아야 곱할 수 있고, 결과는 m×n 행렬이다.
//    순서를 바꾸면 값이 달라지거나 아예 곱이 정의되지 않는다.
//
// ── 탭 ① 용어 ──────────────────────────────────────────────
//  · 성분 사냥 행렬 (3×4) 의 열두 성분은 서로 모두 다른 값으로 골랐다.
//        (( 7, -2,  5, 13), ( 4, 11,  0, -6), ( 9,  3, -8,  1))
//    그래야 "제2행 제2열" 을 찾다가 우연히 같은 값을 눌러 맞는 일이 없다.
//
// ── 탭 ② 덧셈·뺄셈·실수배 ─────────────────────────────────
//  · 실험실 2×2 : A = ((3,-1),(2,5)),  B = ((-4,6),(1,-2))
//    실험실 3×3 : A = ((2,-3,1),(0,4,-2),(5,1,-6)),  B = ((1,2,-4),(3,-1,0),(-2,5,7))
//    k 는 -3 부터 3 까지 정수. 모든 조합에서 성분이 두 자리를 넘지 않도록 값을 골랐다.
//  · 연습 문제의 답
//        A + B   = (( 6, -4), ( 4,  4))          A = ((5,2),(-3,4)),  B = ((1,-6),(7,0))
//        A − B   = (( 4,  8), (-10, 4))
//        3A − 2B = ((12,-13), (10,  9))          A = ((2,-1),(4,3)),  B = ((-3,5),(1,0))
//        A + B   = ((5,-3,-1),(3,-2,0),(-4,7,2)) A = ((1,0,-2),(3,-4,5),(2,6,-1)),
//        2A − B  = ((-2,3,-5),(6,-10,15),(10,11,-5))  B = ((4,-3,1),(0,2,-5),(-6,1,3))
//
// ── 탭 ③ 곱셈 ──────────────────────────────────────────────
//  · 시각 실험 : A(2×3) = ((2,-1,3),(0,4,-2)),  B(3×2) = ((1,5),(-3,2),(4,-1))
//        (1,1) = 2·1 + (-1)(-3) + 3·4 = 17          (1,2) = 2·5 + (-1)·2 + 3·(-1) = 5
//        (2,1) = 0·1 + 4·(-3) + (-2)·4 = -20        (2,2) = 0·5 + 4·2 + (-2)(-1) = 10
//        AB = ((17, 5), (-20, 10))
//  · 교환법칙 반례 : A = ((1,2),(0,3)),  B = ((2,-1),(4,1))
//        AB = ((10, 1), (12, 3)),   BA = ((2, 1), (4, 11))
//    두 행렬 모두 2차 정사각행렬이라 AB 와 BA 가 둘 다 정의되는데도 값이 다르다.
//  · 연습 문제의 답
//        ((2,1),(3,-1)) · ((1,4),(2,0))        = ((4, 8), (1, 12))
//        ((1,-2,3),(4,0,-1)) · ((2,1),(-1,3),(0,5)) = ((4, 10), (8, -1))
//        ((3,0,2)) · ((4),(-1),(5))            = ((22))        1×3 · 3×1 = 1×1
//
// ── 탭 ④ 스프레드시트 ─────────────────────────────────────
//  · 스프레드시트에서 행렬의 곱은 MMULT 함수 하나로 구한다.
//    결과가 여러 칸이므로 먼저 결과가 들어갈 범위를 끌어 잡고 수식을 넣은 뒤
//    Ctrl + Shift + Enter 로 배열 수식으로 확정한다. (요즘 버전은 Enter 만으로도 채워진다.)
//  · 연습 시트 : A(2×3) = ((2,0,-1),(3,1,4)) 가 B3:D4,  B(3×2) = ((1,5),(-2,3),(4,0)) 가 F3:G5
//        =MMULT(B3:D4, F3:G5)  →  ((-2, 10), (17, 18))  가 I3:J4
//  · 실습 시트 : 편의점 물류창고 세 곳의 상자 수(3×3)와 도매상 세 곳의 상자당 매입가(천원, 3×3)
//        수량 Q = ((120,80,60),(90,140,50),(70,60,150))        행 = 가람·나루·다솔, 열 = 생수·이온음료·커피
//        단가 P = ((13,12,11),(14,16,15),(23,22,25))           행 = 생수·이온음료·커피, 열 = P·Q·R 도매상
//        QP = ((4060,4040,4020),(4280,4420,4340),(5200,5100,5420))   단위 천원
//        → 가람은 P, 나루는 Q, 다솔은 R 에 넘기는 것이 가장 많이 받는다. (창고마다 답이 다르도록 값을 골랐다)
//    수량과 단가는 이 활동을 위해 정한 가상의 값이다.
//
// ── 탭 ⑤ 실생활 ───────────────────────────────────────────
//  · ① 문구점 재고 : 말 재고 = 처음 재고 + 입고 − 판매
//        ((120,300,80),(95,250,140)) + ((60,150,40),(80,200,30)) − ((140,380,70),(110,300,120))
//        = ((40,70,50),(65,150,50))
//  · ② 베이커리 : 평일 D = ((40,24,16),(32,20,12)),  주말 1.5D = ((60,36,24),(48,30,18))
//        한 주 = 5D + 2(1.5D) = 8D = ((320,192,128),(256,160,96))
//  · ③ 동아리 티셔츠 : 주문량 Q(3×3) · 단가 C(3×3) = 동아리별 업체별 총액
//        Q = ((10,20,5),(4,12,24),(22,9,3)),  C = ((8000,9000,9500),(12500,11500,12000),(14000,13500,13000))
//        QC = ((400000,387500,400000),(518000,498000,494000),(330500,342000,356000))
//        → 사진부는 나, 밴드부는 다, 요리부는 가 업체가 가장 싸다. 합하면 1,212,000원.
//  · ④ 카페 원가 : 재료 사용량 U(3×3) · 재료 단가 P(3×1) = 잔당 재료비
//        U = ((18,0,0),(18,200,0),(18,180,20)),  P = ((40),(1),(3))
//        UP = ((720),(920),(960)),  판매가 ((2500),(3500),(4000))
//        바닐라라떼 한 잔의 이익 4000 − 960 = 3040원
//        하루 120·80·50 잔의 재료비 = 120·720 + 80·920 + 50·960 = 208,000원
//  · ⑤ 축제 부스 : 첫날 D1 + 둘째 날 D2 = ((75,55,50),(100,55,40),(80,65,65))
//        단가 ((2000),(3000),(1500)) 를 곱하면 ((390000),(425000),(452500)) → 3반 부스가 가장 많다.
//  · 표마다 행렬 이름을 붙여 문제의 식과 짝이 맞게 했다.
//        ① S 처음 재고 · I 입고 · T 판매      ② D 평일 하루 생산량
//        ③ Q 주문량 · C 단가                  ④ U 재료 사용량 · P 재료 단가 · V 판매가
//        ⑤ D_1 첫날 · D_2 둘째 날 · P 품목 값
//    한 장면 안에서 이름이 겹치지 않게 골랐다.
//    ①~⑤ 의 수량과 값은 모두 이 활동을 위해 정한 가상의 값이다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}
export function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}

// ══════════════════════════════════════════════════════════════
//  행렬 기본
// ══════════════════════════════════════════════════════════════
export type Mat = number[][];
export type Piece = { pre?: string; tex?: string; post?: string };

export const rowsOf = (m: Mat): number => m.length;
export const colsOf = (m: Mat): number => (m[0] ? m[0].length : 0);

export function sameShape(a: Mat, b: Mat): boolean {
  return rowsOf(a) === rowsOf(b) && colsOf(a) === colsOf(b);
}
export function addM(a: Mat, b: Mat): Mat {
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}
export function subM(a: Mat, b: Mat): Mat {
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}
export function scaleM(k: number, a: Mat): Mat {
  return a.map((row) => row.map((v) => k * v));
}
/** pA + qB — 실수배와 덧셈·뺄셈을 한 번에 */
export function combM(p: number, a: Mat, q: number, b: Mat): Mat {
  return a.map((row, i) => row.map((v, j) => p * v + q * b[i][j]));
}
export function canMul(a: Mat, b: Mat): boolean {
  return colsOf(a) === rowsOf(b);
}
export function mulM(a: Mat, b: Mat): Mat {
  const l = colsOf(a);
  return a.map((row, i) =>
    b[0].map((_, j) => {
      let s = 0;
      for (let t = 0; t < l; t++) s += a[i][t] * b[t][j];
      return s;
    }),
  );
}
/** (i, j) 성분을 만드는 곱의 항들 — 시각 실험과 풀이에 함께 쓴다 */
export function mulTerms(a: Mat, b: Mat, i: number, j: number): { x: number; y: number }[] {
  const l = colsOf(a);
  const out: { x: number; y: number }[] = [];
  for (let t = 0; t < l; t++) out.push({ x: a[i][t], y: b[t][j] });
  return out;
}
export function eqM(a: Mat, b: Mat): boolean {
  if (!sameShape(a, b)) return false;
  return a.every((row, i) => row.every((v, j) => Math.abs(v - b[i][j]) < 1e-9));
}

// ══════════════════════════════════════════════════════════════
//  수식 문자열
// ══════════════════════════════════════════════════════════════
function numTex(v: number): string {
  return fmt(v);
}
export function matTex(m: Mat): string {
  const body = m.map((row) => row.map(numTex).join(" & ")).join(" \\\\ ");
  return `\\begin{pmatrix} ${body} \\end{pmatrix}`;
}
export function shapeTex(r: number, c: number): string {
  return `${r} \\times ${c}`;
}
/** 2·1 + (-1)·(-3) + 3·4 처럼 곱의 합을 적는다 */
export function sumProdTex(terms: { x: number; y: number }[]): string {
  return terms
    .map((t, i) => {
      const x = t.x < 0 ? `(${numTex(t.x)})` : numTex(t.x);
      const y = t.y < 0 ? `(${numTex(t.y)})` : numTex(t.y);
      return `${i > 0 ? " + " : ""}${x} \\cdot ${y}`;
    })
    .join("");
}

// ══════════════════════════════════════════════════════════════
//  단계 문제 — 탭 ②③⑤ 가 함께 쓴다
// ══════════════════════════════════════════════════════════════
export type StepBase = {
  id: string;
  ask: string;
  /** 문제에 곁들이는 행렬 */
  mats?: { label: string; m: Mat }[];
  hint?: string;
  done?: string;
};
export type Step = StepBase &
  (
    | { kind: "choice"; options: Piece[][]; answer: number; explains: string[] }
    | { kind: "fill"; target: Mat; unit?: string }
    | { kind: "num"; answer: number; unit?: string }
  );

// ══════════════════════════════════════════════════════════════
//  탭 ① 용어 익히기
// ══════════════════════════════════════════════════════════════
export const SIZE_MIN = 1;
export const SIZE_MAX = 4;
export const SIZE_START = { m: 2, n: 3 };

export const HUNT_MAT: Mat = [
  [7, -2, 5, 13],
  [4, 11, 0, -6],
  [9, 3, -8, 1],
];
/** 제i행 제j열 — 1부터 센다 */
export type Hunt = { id: string; i: number; j: number };
export const HUNTS: Hunt[] = [
  { id: "h1", i: 1, j: 3 },
  { id: "h2", i: 2, j: 2 },
  { id: "h3", i: 3, j: 1 },
  { id: "h4", i: 2, j: 4 },
  { id: "h5", i: 1, j: 2 },
  { id: "h6", i: 3, j: 3 },
];

export type Quiz = {
  id: string;
  ask: string;
  mats?: { label: string; m: Mat }[];
  options: Piece[][];
  answer: number;
  explains: string[];
};

export const TERM_QUIZ: Quiz[] = [
  {
    id: "q1",
    ask: "이 행렬의 꼴은 무엇일까요?",
    mats: [
      {
        label: "A",
        m: [
          [3, -1, 5],
          [0, 4, 2],
        ],
      },
    ],
    options: [[{ tex: shapeTex(3, 2) }], [{ tex: shapeTex(2, 3) }], [{ tex: shapeTex(2, 2) }], [{ tex: shapeTex(3, 3) }]],
    answer: 1,
    explains: [
      "앞이 행, 뒤가 열이에요. 이 행렬은 가로줄이 2개예요.",
      "",
      "세로줄이 3개이니 뒤의 수는 3 이어야 해요.",
      "가로줄은 2개뿐이에요.",
    ],
  },
  {
    id: "q2",
    ask: "다음 중 정사각행렬은 어느 것일까요?",
    options: [
      [{ tex: matTex([[1, 2, 3]]) }],
      [{ tex: matTex([[1], [2], [3]]) }],
      [
        {
          tex: matTex([
            [1, 2],
            [3, 4],
          ]),
        },
      ],
      [
        {
          tex: matTex([
            [1, 2, 3],
            [4, 5, 6],
          ]),
        },
      ],
    ],
    answer: 2,
    explains: [
      "가로줄 1개, 세로줄 3개인 1×3 행렬이에요.",
      "가로줄 3개, 세로줄 1개인 3×1 행렬이에요.",
      "",
      "가로줄 2개, 세로줄 3개라 개수가 달라요.",
    ],
  },
  {
    id: "q3",
    ask: "4×5 행렬의 성분은 모두 몇 개일까요?",
    options: [[{ tex: "20" }], [{ tex: "9" }], [{ tex: "45" }], [{ tex: "16" }]],
    answer: 0,
    explains: [
      "",
      "4 + 5 가 아니라 4 × 5 예요. 가로줄마다 성분이 5개씩 있어요.",
      "두 수를 이어 쓴 것이 아니라 곱해야 해요.",
      "세로줄은 4개가 아니라 5개예요.",
    ],
  },
  {
    id: "q4",
    ask: "3차 정사각행렬이란 어떤 행렬일까요?",
    options: [
      [{ pre: "가로줄 3개, 세로줄 1개인 행렬" }],
      [{ pre: "가로줄 1개, 세로줄 3개인 행렬" }],
      [{ pre: "가로줄이 3개이기만 하면 되는 행렬" }],
      [{ pre: "가로줄도 3개, 세로줄도 3개인 행렬" }],
    ],
    answer: 3,
    explains: [
      "세로줄이 1개면 정사각형 모양이 되지 않아요.",
      "가로줄이 1개면 정사각형 모양이 되지 않아요.",
      "가로줄이 3개여도 세로줄이 3개가 아니면 정사각행렬이 아니에요.",
      "",
    ],
  },
  {
    id: "q5",
    ask: "이 행렬의 (2, 3) 성분은 얼마일까요?",
    mats: [
      {
        label: "B",
        m: [
          [6, -3, 0, 2],
          [1, 8, -5, 4],
          [7, 2, 9, -1],
        ],
      },
    ],
    options: [[{ tex: "4" }], [{ tex: "-5" }], [{ tex: "9" }], [{ tex: "8" }]],
    answer: 1,
    explains: [
      "그것은 (2, 4) 성분이에요. 세로줄을 하나 더 갔어요.",
      "",
      "그것은 (3, 3) 성분이에요. 가로줄을 하나 더 내려갔어요.",
      "그것은 (2, 2) 성분이에요. 세로줄을 하나 덜 갔어요.",
    ],
  },
  {
    id: "q6",
    ask: "다음 행렬과 꼴이 같은 것은 어느 것일까요?",
    mats: [
      {
        label: "C",
        m: [
          [1, 0],
          [2, -3],
          [4, 5],
        ],
      },
    ],
    options: [
      [
        {
          tex: matTex([
            [2, 1],
            [0, 3],
          ]),
        },
      ],
      [
        {
          tex: matTex([
            [1, 2, 3],
            [4, 5, 6],
          ]),
        },
      ],
      [
        {
          tex: matTex([
            [0, 1],
            [5, -2],
            [3, 3],
          ]),
        },
      ],
      [
        {
          tex: matTex([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
          ]),
        },
      ],
    ],
    answer: 2,
    explains: [
      "2×2 행렬이라 가로줄이 하나 모자라요.",
      "가로줄과 세로줄의 개수가 뒤바뀐 2×3 행렬이에요.",
      "",
      "3×3 행렬이라 세로줄이 하나 많아요.",
    ],
  },
  {
    id: "q7",
    ask: "이 단원에서 행렬의 성분으로 다루는 수는 무엇일까요?",
    options: [
      [{ pre: "실수" }],
      [{ pre: "자연수만" }],
      [{ pre: "정수만" }],
      [{ pre: "0 보다 큰 수만" }],
    ],
    answer: 0,
    explains: [
      "",
      "-3 처럼 음수도 얼마든지 성분이 될 수 있어요.",
      "0.5 처럼 정수가 아닌 실수도 성분이 될 수 있어요.",
      "음수와 0 도 성분이 될 수 있어요.",
    ],
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 덧셈·뺄셈·실수배
// ══════════════════════════════════════════════════════════════
export const LAB_A2: Mat = [
  [3, -1],
  [2, 5],
];
export const LAB_B2: Mat = [
  [-4, 6],
  [1, -2],
];
export const LAB_A3: Mat = [
  [2, -3, 1],
  [0, 4, -2],
  [5, 1, -6],
];
export const LAB_B3: Mat = [
  [1, 2, -4],
  [3, -1, 0],
  [-2, 5, 7],
];
export const K_MIN = -3;
export const K_MAX = 3;
export const K_START = 2;

/** p·A + q·B 꼴로 네 가지 연산을 모두 나타낸다 (k 는 슬라이더 값) */
export type LabOp = { id: string; label: string; texOf: (k: number) => string; p: (k: number) => number; q: (k: number) => number };
export const LAB_OPS: LabOp[] = [
  { id: "add", label: "A + B", texOf: () => "A + B", p: () => 1, q: () => 1 },
  { id: "sub", label: "A − B", texOf: () => "A - B", p: () => 1, q: () => -1 },
  { id: "kA", label: "kA", texOf: (k) => `${fmt(k)}A`, p: (k) => k, q: () => 0 },
  { id: "akb", label: "A + kB", texOf: (k) => `A + ${fmt(k)}B`, p: () => 1, q: (k) => k },
];

const P1A: Mat = [
  [5, 2],
  [-3, 4],
];
const P1B: Mat = [
  [1, -6],
  [7, 0],
];
const P3A: Mat = [
  [2, -1],
  [4, 3],
];
const P3B: Mat = [
  [-3, 5],
  [1, 0],
];
const P4A: Mat = [
  [1, 0, -2],
  [3, -4, 5],
  [2, 6, -1],
];
const P4B: Mat = [
  [4, -3, 1],
  [0, 2, -5],
  [-6, 1, 3],
];

export const ADD_STEPS: Step[] = [
  {
    id: "a1",
    kind: "fill",
    ask: "A + B 를 계산해 빈칸을 채워 보세요.",
    mats: [
      { label: "A", m: P1A },
      { label: "B", m: P1B },
    ],
    target: addM(P1A, P1B),
    hint: "같은 자리에 있는 수끼리만 더해요. 왼쪽 위는 5 + 1 이에요.",
    done: "덧셈은 같은 자리끼리! 자리를 옮겨 더할 일은 없어요.",
  },
  {
    id: "a2",
    kind: "fill",
    ask: "이번에는 A − B 를 계산해 보세요.",
    mats: [
      { label: "A", m: P1A },
      { label: "B", m: P1B },
    ],
    target: subM(P1A, P1B),
    hint: "왼쪽 아래는 -3 − 7 이에요. 부호를 조심해요.",
    done: "B − A 를 구하면 모든 성분의 부호만 뒤집힌 행렬이 나와요.",
  },
  {
    id: "a3",
    kind: "fill",
    ask: "3A − 2B 를 계산해 보세요.",
    mats: [
      { label: "A", m: P3A },
      { label: "B", m: P3B },
    ],
    target: combM(3, P3A, -2, P3B),
    hint: "먼저 3A 와 2B 를 따로 구한 다음 같은 자리끼리 빼면 돼요.",
    done: "실수배는 모든 성분에 똑같이 곱해요. 한 성분만 빠뜨리기 쉬우니 조심!",
  },
  {
    id: "a4",
    kind: "fill",
    ask: "3×3 행렬입니다. A + B 를 계산해 보세요.",
    mats: [
      { label: "A", m: P4A },
      { label: "B", m: P4B },
    ],
    target: addM(P4A, P4B),
    hint: "크기가 커져도 하는 일은 똑같아요. 아홉 자리를 하나씩 더해요.",
    done: "꼴만 같으면 크기가 아무리 커도 방법은 그대로예요.",
  },
  {
    id: "a5",
    kind: "fill",
    ask: "마지막으로 2A − B 를 계산해 보세요.",
    mats: [
      { label: "A", m: P4A },
      { label: "B", m: P4B },
    ],
    target: combM(2, P4A, -1, P4B),
    hint: "2A 를 먼저 구하고 B 를 빼요. 왼쪽 위는 2·1 − 4 예요.",
    done: "여기까지가 덧셈·뺄셈·실수배예요. 다음 탭의 곱셈은 규칙이 아주 달라요!",
  },
  {
    id: "a6",
    kind: "choice",
    ask: "2×3 행렬과 3×2 행렬은 더할 수 있을까요?",
    options: [
      [{ pre: "더할 수 있다. 성분의 개수가 6개로 같으니까" }],
      [{ pre: "더할 수 없다. 가로줄과 세로줄의 개수가 서로 다르니까" }],
      [{ pre: "더할 수 있다. 한쪽을 돌려 놓으면 되니까" }],
      [{ pre: "더할 수 있지만 답이 여러 가지다" }],
    ],
    answer: 1,
    explains: [
      "성분의 개수가 같아도 자리가 서로 짝지어지지 않으면 더할 수 없어요.",
      "",
      "행렬은 돌려서 쓰는 것이 아니에요. 자리 자체가 뜻을 가지고 있어요.",
      "덧셈은 정의되거나 정의되지 않거나 둘 중 하나예요.",
    ],
    hint: "덧셈은 같은 자리끼리 하는 일이에요. 짝이 없는 자리가 생기면?",
  },
  {
    id: "a7",
    kind: "choice",
    ask: "A − B 와 B − A 는 어떤 사이일까요?",
    options: [
      [{ pre: "언제나 같다" }],
      [{ pre: "꼴이 서로 달라진다" }],
      [{ pre: "아무 관계도 없다" }],
      [{ pre: "모든 성분의 부호가 반대다" }],
    ],
    answer: 3,
    explains: [
      "5 − 3 과 3 − 5 가 다르듯 성분마다 값이 달라져요.",
      "뺄셈을 해도 꼴은 그대로예요.",
      "각 자리를 보면 a − b 와 b − a 이니 분명한 관계가 있어요.",
      "",
    ],
    hint: "성분 하나만 떼어 보면 a − b 와 b − a 예요.",
    done: "그래서 B − A = −(A − B) 라고 쓸 수 있어요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ③ 곱셈
// ══════════════════════════════════════════════════════════════
export type ShapePuzzle = { id: string; ar: number; ac: number; br: number; bc: number };
export const SHAPE_PUZZLES: ShapePuzzle[] = [
  { id: "s1", ar: 2, ac: 3, br: 3, bc: 2 },
  { id: "s2", ar: 3, ac: 2, br: 3, bc: 2 },
  { id: "s3", ar: 2, ac: 4, br: 4, bc: 1 },
  { id: "s4", ar: 1, ac: 3, br: 3, bc: 3 },
  { id: "s5", ar: 3, ac: 3, br: 2, bc: 3 },
  { id: "s6", ar: 4, ac: 2, br: 2, bc: 5 },
];
export const shapeOk = (p: ShapePuzzle): boolean => p.ac === p.br;
/** 결과 꼴 보기 — 정답과 흔한 오답을 함께 낸다 */
export function shapeOptions(p: ShapePuzzle): { r: number; c: number }[] {
  const raw = [
    { r: p.ar, c: p.bc },
    { r: p.bc, c: p.ar },
    { r: p.ar, c: p.ac },
    { r: p.br, c: p.bc },
  ];
  const out: { r: number; c: number }[] = [];
  for (const z of raw) if (!out.some((w) => w.r === z.r && w.c === z.c)) out.push(z);
  let extra = 1;
  while (out.length < 4) {
    const z = { r: p.ar + extra, c: p.bc + extra };
    if (!out.some((w) => w.r === z.r && w.c === z.c)) out.push(z);
    extra++;
  }
  return out.slice(0, 4);
}

export const VIS_A: Mat = [
  [2, -1, 3],
  [0, 4, -2],
];
export const VIS_B: Mat = [
  [1, 5],
  [-3, 2],
  [4, -1],
];
export const VIS_AB: Mat = mulM(VIS_A, VIS_B);

export const NC_A: Mat = [
  [1, 2],
  [0, 3],
];
export const NC_B: Mat = [
  [2, -1],
  [4, 1],
];
export const NC_AB: Mat = mulM(NC_A, NC_B);
export const NC_BA: Mat = mulM(NC_B, NC_A);

const M1A: Mat = [
  [2, 1],
  [3, -1],
];
const M1B: Mat = [
  [1, 4],
  [2, 0],
];
const M2A: Mat = [
  [1, -2, 3],
  [4, 0, -1],
];
const M2B: Mat = [
  [2, 1],
  [-1, 3],
  [0, 5],
];
const M3A: Mat = [[3, 0, 2]];
const M3B: Mat = [[4], [-1], [5]];

export const MUL_STEPS: Step[] = [
  {
    id: "m1",
    kind: "fill",
    ask: "AB 를 계산해 보세요. 2×2 끼리의 곱이에요.",
    mats: [
      { label: "A", m: M1A },
      { label: "B", m: M1B },
    ],
    target: mulM(M1A, M1B),
    hint: "왼쪽 위 칸은 A 의 제1행과 B 의 제1열, 곧 2·1 + 1·2 예요.",
    done: "칸 하나를 채울 때마다 가로줄 하나와 세로줄 하나를 통째로 쓴다는 것을 기억해요.",
  },
  {
    id: "m2",
    kind: "fill",
    ask: "이번에는 2×3 행렬과 3×2 행렬의 곱이에요. 결과는 몇 칸일까요?",
    mats: [
      { label: "A", m: M2A },
      { label: "B", m: M2B },
    ],
    target: mulM(M2A, M2B),
    hint: "가운데 수 3 이 사라지고 2×2 가 남아요. 한 칸마다 세 개의 곱을 더해요.",
    done: "가운데 수가 같아야 곱할 수 있고, 그 수는 결과에 남지 않아요.",
  },
  {
    id: "m3",
    kind: "fill",
    ask: "1×3 행렬과 3×1 행렬의 곱이에요. 결과는 단 한 칸입니다.",
    mats: [
      { label: "A", m: M3A },
      { label: "B", m: M3B },
    ],
    target: mulM(M3A, M3B),
    hint: "3·4 + 0·(-1) + 2·5 를 계산하면 돼요.",
    done: "가로 한 줄과 세로 한 줄의 곱은 수 하나가 돼요. 뒤에 나올 실생활 문제가 바로 이 꼴이에요.",
  },
  {
    id: "m4",
    kind: "choice",
    ask: "행렬의 곱셈에서 순서를 바꾸면 어떻게 될까요?",
    options: [
      [{ pre: "값이 달라지거나, 아예 곱할 수 없게 되기도 한다" }],
      [{ pre: "언제나 같은 값이 나온다" }],
      [{ pre: "부호만 반대가 된다" }],
      [{ pre: "꼴은 달라져도 값은 같다" }],
    ],
    answer: 0,
    explains: [
      "",
      "수의 곱셈과 달리 행렬은 순서를 바꾸면 값이 달라져요. 위에서 직접 확인했지요.",
      "뺄셈의 성질이에요. 곱셈에서는 값 자체가 아예 달라져요.",
      "2×3 과 3×2 처럼 한쪽 순서로만 곱해지는 경우도 있어요.",
    ],
    hint: "바로 앞에서 본 AB 와 BA 를 떠올려 보세요.",
    done: "그래서 행렬을 다룰 때는 '무엇에 무엇을 곱하는지' 순서를 늘 먼저 정해야 해요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 스프레드시트
// ══════════════════════════════════════════════════════════════
export const SHEET_COLS = 12; // A ~ L
export const SHEET_ROWS = 6;

export const colName = (c: number): string => String.fromCharCode(65 + c);
export const cellName = (c: number, r: number): string => `${colName(c)}${r + 1}`;
export const rangeName = (c: number, r: number, w: number, h: number): string =>
  `${cellName(c, r)}:${cellName(c + w - 1, r + h - 1)}`;

export type SheetBlock = { label: string; col: number; row: number; m: Mat; tone: "a" | "b" };
export type SheetDef = {
  id: string;
  blocks: SheetBlock[];
  result: { label: string; col: number; row: number; m: Mat };
  /** 결과 범위 크기 보기 */
  sizeOptions: { r: number; c: number }[];
  sizeAnswer: number;
  formulaOptions: string[];
  formulaAnswer: number;
  formulaExplains: string[];
};

const SH1_A: Mat = [
  [2, 0, -1],
  [3, 1, 4],
];
const SH1_B: Mat = [
  [1, 5],
  [-2, 3],
  [4, 0],
];
export const SHEET1: SheetDef = {
  id: "sheet1",
  blocks: [
    { label: "A", col: 1, row: 2, m: SH1_A, tone: "a" },
    { label: "B", col: 5, row: 2, m: SH1_B, tone: "b" },
  ],
  result: { label: "AB", col: 8, row: 2, m: mulM(SH1_A, SH1_B) },
  sizeOptions: [
    { r: 3, c: 3 },
    { r: 2, c: 2 },
    { r: 2, c: 3 },
    { r: 3, c: 2 },
  ],
  sizeAnswer: 1,
  formulaOptions: ["=MMULT(F3:G5, B3:D4)", "=SUM(B3:D4, F3:G5)", "=MMULT(B3:D4, F3:G5)", "=B3:D4 * F3:G5"],
  formulaAnswer: 2,
  formulaExplains: [
    "순서가 뒤바뀌었어요. 3×2 와 2×3 을 곱하면 3×3 이 나와 우리가 잡은 범위와 맞지 않아요.",
    "SUM 은 모든 수를 하나로 더해 버려요. 행렬의 곱은 MMULT 예요.",
    "",
    "별표는 같은 자리끼리 곱하라는 뜻이라 행렬의 곱이 되지 않아요.",
  ],
};

export const STORE_NAMES = ["가람 창고", "나루 창고", "다솔 창고"];
export const ITEM_NAMES = ["생수", "이온음료", "커피"];
export const BUYER_NAMES = ["P 도매상", "Q 도매상", "R 도매상"];

export const SH2_QTY: Mat = [
  [120, 80, 60],
  [90, 140, 50],
  [70, 60, 150],
];
export const SH2_PRICE: Mat = [
  [13, 12, 11],
  [14, 16, 15],
  [23, 22, 25],
];
export const SH2_TOTAL: Mat = mulM(SH2_QTY, SH2_PRICE);

export const SHEET2: SheetDef = {
  id: "sheet2",
  blocks: [
    { label: "수량", col: 1, row: 2, m: SH2_QTY, tone: "a" },
    { label: "단가", col: 5, row: 2, m: SH2_PRICE, tone: "b" },
  ],
  result: { label: "총액", col: 9, row: 2, m: SH2_TOTAL },
  sizeOptions: [
    { r: 3, c: 3 },
    { r: 1, c: 3 },
    { r: 3, c: 1 },
    { r: 1, c: 1 },
  ],
  sizeAnswer: 0,
  formulaOptions: ["=MMULT(B3:D5, F3:H5)", "=MMULT(F3:H5, B3:D5)", "=MMULT(B3:D5, F3:H5) / 3", "=B3:D5 + F3:H5"],
  formulaAnswer: 0,
  formulaExplains: [
    "",
    "순서를 바꾸면 가로줄이 품목, 세로줄이 품목이 되어 창고별 총액이 나오지 않아요.",
    "3으로 나눌 까닭이 없어요. 평균이 아니라 합계를 구하는 중이에요.",
    "수량과 값을 더하는 것은 뜻이 없어요. 곱해야 금액이 나와요.",
  ],
};

/** 창고마다 가장 비싸게 사 주는 도매상 — 답이 모두 다르도록 값을 골랐다 */
export function bestBuyer(row: number): number {
  const r = SH2_TOTAL[row];
  let k = 0;
  for (let j = 1; j < r.length; j++) if (r[j] > r[k]) k = j;
  return k;
}

/** 시트로 총액을 구한 다음 답하는 마무리 문항 */
export const SHEET2_STEPS: Step[] = [
  {
    id: "sh2s1",
    kind: "choice",
    ask: "가람 창고의 물건은 어느 도매상에 넘기는 것이 가장 많이 받을까요?",
    options: [[{ pre: "R 도매상" }], [{ pre: "P 도매상" }], [{ pre: "Q 도매상" }], [{ pre: "어디든 같다" }]],
    answer: 1,
    explains: [
      "4,020천원으로 세 곳 가운데 가장 적어요.",
      "",
      "4,040천원이라 P 도매상보다 20천원 적어요.",
      "세 값이 모두 다르게 나와요.",
    ],
    hint: "총액 행렬의 첫 가로줄에서 가장 큰 값을 찾아요.",
  },
  {
    id: "sh2s2",
    kind: "choice",
    ask: "나루 창고는 어디에 넘기는 것이 가장 좋을까요?",
    options: [[{ pre: "P 도매상" }], [{ pre: "Q 도매상" }], [{ pre: "R 도매상" }], [{ pre: "가람 창고와 같은 곳" }]],
    answer: 1,
    explains: [
      "4,280천원으로 가장 적어요.",
      "",
      "4,340천원이라 Q 도매상보다 80천원 적어요.",
      "창고마다 담긴 물건의 비율이 달라 답이 달라져요.",
    ],
    hint: "이온음료가 많은 창고예요. 이온음료를 비싸게 쳐 주는 곳은 어디일까요?",
  },
  {
    id: "sh2s3",
    kind: "choice",
    ask: "다솔 창고는 어디에 넘기는 것이 가장 좋을까요?",
    options: [[{ pre: "Q 도매상" }], [{ pre: "P 도매상" }], [{ pre: "R 도매상" }], [{ pre: "세 곳 모두 같다" }]],
    answer: 2,
    explains: [
      "5,100천원으로 가장 적어요.",
      "5,200천원이라 R 도매상보다 220천원 적어요.",
      "",
      "5,420 · 5,200 · 5,100 으로 모두 달라요.",
    ],
    hint: "커피가 아주 많은 창고예요.",
    done: "세 창고의 답이 모두 달라요. 담긴 물건의 비율이 다르기 때문이에요.",
  },
  {
    id: "sh2s4",
    kind: "num",
    ask: "세 창고가 각각 가장 좋은 곳에 넘기면 모두 얼마일까요? (단위 천원)",
    answer: SH2_TOTAL[0][0] + SH2_TOTAL[1][1] + SH2_TOTAL[2][2],
    unit: "천원",
    hint: "가로줄마다 고른 세 값을 더해요.",
    done: "표 두 개와 수식 한 줄로 아홉 가지 경우를 한꺼번에 견줬어요.",
  },
];

export const SHEET_TIPS: string[] = [
  "결과가 여러 칸이므로 먼저 결과가 들어갈 칸을 통째로 끌어 잡아요.",
  "수식을 적은 다음 Ctrl + Shift + Enter 로 확정하면 잡아 둔 칸이 한꺼번에 채워져요.",
  "MMULT 는 앞 행렬의 세로줄 개수와 뒤 행렬의 가로줄 개수가 다르면 오류를 돌려줘요.",
];

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ 실생활
// ══════════════════════════════════════════════════════════════
export type TableDef = {
  caption: string;
  /** 이 표를 옮긴 행렬의 이름 (문제의 식에 나오는 기호와 같아야 한다) */
  sym: string;
  cornerRow: string;
  cornerCol: string;
  rowLabels: string[];
  colLabels: string[];
  m: Mat;
  tone: "sky" | "amber" | "rose" | "violet" | "emerald";
  unit?: string;
};
export type Scene = {
  id: string;
  emoji: string;
  title: string;
  lead: string;
  tables: TableDef[];
  steps: Step[];
  wrap: string;
};

// ── ① 문구점 재고 ────────────────────────────────────────────
const ST_START: Mat = [
  [120, 300, 80],
  [95, 250, 140],
];
const ST_IN: Mat = [
  [60, 150, 40],
  [80, 200, 30],
];
const ST_OUT: Mat = [
  [140, 380, 70],
  [110, 300, 120],
];
export const ST_END: Mat = subM(addM(ST_START, ST_IN), ST_OUT);

// ── ② 베이커리 ──────────────────────────────────────────────
const BK_DAY: Mat = [
  [40, 24, 16],
  [32, 20, 12],
];
export const BK_WEEKEND: Mat = scaleM(1.5, BK_DAY);
export const BK_WEEK: Mat = scaleM(8, BK_DAY);

// ── ③ 동아리 티셔츠 ─────────────────────────────────────────
const TS_QTY: Mat = [
  [10, 20, 5],
  [4, 12, 24],
  [22, 9, 3],
];
const TS_COST: Mat = [
  [8000, 9000, 9500],
  [12500, 11500, 12000],
  [14000, 13500, 13000],
];
export const TS_TOTAL: Mat = mulM(TS_QTY, TS_COST);
export const TS_CLUBS = ["사진부", "밴드부", "요리부"];
export const TS_MAKERS = ["가 업체", "나 업체", "다 업체"];
export function cheapestMaker(row: number): number {
  const r = TS_TOTAL[row];
  let k = 0;
  for (let j = 1; j < r.length; j++) if (r[j] < r[k]) k = j;
  return k;
}
export const TS_BEST_SUM: number = TS_TOTAL.map((_, i) => TS_TOTAL[i][cheapestMaker(i)]).reduce((a, b) => a + b, 0);

// ── ④ 카페 원가 ─────────────────────────────────────────────
const CF_USE: Mat = [
  [18, 0, 0],
  [18, 200, 0],
  [18, 180, 20],
];
const CF_UNIT: Mat = [[40], [1], [3]];
export const CF_COST: Mat = mulM(CF_USE, CF_UNIT);
const CF_SELL: Mat = [[2500], [3500], [4000]];
const CF_SOLD: Mat = [[120, 80, 50]];
export const CF_DAY_COST: number = mulM(CF_SOLD, CF_COST)[0][0];
export const CF_DAY_SALE: number = mulM(CF_SOLD, CF_SELL)[0][0];

// ── ⑤ 축제 부스 ─────────────────────────────────────────────
const FS_D1: Mat = [
  [40, 25, 30],
  [55, 20, 15],
  [30, 45, 25],
];
const FS_D2: Mat = [
  [35, 30, 20],
  [45, 35, 25],
  [50, 20, 40],
];
export const FS_SUM: Mat = addM(FS_D1, FS_D2);
const FS_PRICE: Mat = [[2000], [3000], [1500]];
export const FS_SALE: Mat = mulM(FS_SUM, FS_PRICE);

export const SCENES: Scene[] = [
  {
    id: "sc1",
    emoji: "📒",
    title: "문구점 재고 맞추기",
    lead: "두 지점의 3월 초 재고와 그 달의 입고·판매 기록이에요. 3월 말에 남은 물건을 행렬로 구해 봐요.",
    tables: [
      {
        caption: "3월 초 재고",
        sym: "S",
        cornerRow: "지점",
        cornerCol: "품목",
        rowLabels: ["중앙점", "호수점"],
        colLabels: ["노트", "볼펜", "파일"],
        m: ST_START,
        tone: "sky",
        unit: "개",
      },
      {
        caption: "3월 입고",
        sym: "I",
        cornerRow: "지점",
        cornerCol: "품목",
        rowLabels: ["중앙점", "호수점"],
        colLabels: ["노트", "볼펜", "파일"],
        m: ST_IN,
        tone: "emerald",
        unit: "개",
      },
      {
        caption: "3월 판매",
        sym: "T",
        cornerRow: "지점",
        cornerCol: "품목",
        rowLabels: ["중앙점", "호수점"],
        colLabels: ["노트", "볼펜", "파일"],
        m: ST_OUT,
        tone: "rose",
        unit: "개",
      },
    ],
    steps: [
      {
        id: "sc1s1",
        kind: "choice",
        ask: "3월 말 재고를 나타내는 식은 무엇일까요?",
        options: [[{ tex: "S + I + T" }], [{ tex: "S - I + T" }], [{ tex: "S - I - T" }], [{ tex: "S + I - T" }]],
        answer: 3,
        explains: [
          "팔린 것은 창고에서 빠져나가니 더하면 안 돼요.",
          "들어온 것을 빼고 나간 것을 더하면 거꾸로예요.",
          "입고된 물건은 재고에 더해져요.",
          "",
        ],
        hint: "들어온 것은 더하고 나간 것은 빼요.",
      },
      {
        id: "sc1s2",
        kind: "fill",
        ask: "S + I − T 를 계산해 3월 말 재고를 채워 보세요.",
        target: ST_END,
        unit: "개",
        hint: "중앙점 노트는 120 + 60 − 140 이에요.",
        done: "표 세 개가 행렬 세 개가 되고, 한 번의 덧셈·뺄셈으로 여섯 칸이 한꺼번에 정리됐어요.",
      },
      {
        id: "sc1s3",
        kind: "num",
        ask: "3월 말에 호수점에 남은 볼펜은 몇 개일까요?",
        answer: ST_END[1][1],
        unit: "개",
        hint: "결과 행렬의 (2, 2) 성분을 읽으면 돼요.",
      },
    ],
    wrap: "표를 행렬로 옮기면 지점과 품목이 늘어나도 계산 방법은 그대로예요.",
  },
  {
    id: "sc2",
    emoji: "🥐",
    title: "빵집 주말 생산 계획",
    lead: "주말에는 평일의 1.5배를 만들어요. 한 주 동안 만드는 양을 행렬로 나타내 봐요.",
    tables: [
      {
        caption: "평일 하루 생산량",
        sym: "D",
        cornerRow: "지점",
        cornerCol: "품목",
        rowLabels: ["본점", "역전점"],
        colLabels: ["식빵", "크루아상", "치즈케이크"],
        m: BK_DAY,
        tone: "amber",
        unit: "개",
      },
    ],
    steps: [
      {
        id: "sc2s1",
        kind: "fill",
        ask: "주말 하루 생산량 1.5D 를 채워 보세요.",
        target: BK_WEEKEND,
        unit: "개",
        hint: "여섯 칸 모두에 1.5 를 곱해요. 40 의 1.5배는 60 이에요.",
        done: "실수배는 빠뜨리는 칸 없이 모든 성분에 곱해요.",
      },
      {
        id: "sc2s2",
        kind: "choice",
        ask: "평일 5일과 주말 2일, 한 주 전체 생산량을 나타내는 식은?",
        options: [[{ tex: "7D" }], [{ tex: "5D + 2D" }], [{ tex: "1.5D \\times 7" }], [{ tex: "5D + 2(1.5D)" }]],
        answer: 3,
        explains: [
          "주말에 더 많이 만드는 것이 빠졌어요.",
          "주말도 평일과 같은 양으로 센 셈이에요.",
          "평일까지 1.5배로 만든 셈이 돼요.",
          "",
        ],
        hint: "평일은 D 가 5번, 주말은 1.5D 가 2번이에요.",
      },
      {
        id: "sc2s3",
        kind: "choice",
        ask: "5D + 2(1.5D) 를 한 항으로 정리하면?",
        options: [[{ tex: "6.5D" }], [{ tex: "7D" }], [{ tex: "8D" }], [{ tex: "9D" }]],
        answer: 2,
        explains: [
          "2 × 1.5 = 3 이니 5 + 3 이에요.",
          "1.5배인 것을 1배로 세었어요.",
          "",
          "5 + 2 × 1.5 를 다시 계산해 보세요.",
        ],
        hint: "실수배끼리는 계수를 그냥 더해도 돼요.",
        done: "숫자를 하나하나 더하지 않아도 8D 한 줄로 끝나요.",
      },
      {
        id: "sc2s4",
        kind: "num",
        ask: "한 주 동안 본점이 만드는 식빵은 몇 개일까요?",
        answer: BK_WEEK[0][0],
        unit: "개",
        hint: "8D 의 (1, 1) 성분이에요.",
      },
    ],
    wrap: "'몇 배' 라는 말이 나오면 실수배를 떠올려요. 계수끼리 먼저 정리하면 계산이 한결 줄어요.",
  },
  {
    id: "sc3",
    emoji: "👕",
    title: "동아리 단체 티셔츠",
    lead: "세 동아리가 사이즈별로 티셔츠를 맞춰요. 업체마다 사이즈별 값이 달라 어디가 싼지 한눈에 보이지 않아요.",
    tables: [
      {
        caption: "동아리별 주문량",
        sym: "Q",
        cornerRow: "동아리",
        cornerCol: "사이즈",
        rowLabels: TS_CLUBS,
        colLabels: ["S", "M", "L"],
        m: TS_QTY,
        tone: "sky",
        unit: "장",
      },
      {
        caption: "업체별 장당 값",
        sym: "C",
        cornerRow: "사이즈",
        cornerCol: "업체",
        rowLabels: ["S", "M", "L"],
        colLabels: TS_MAKERS,
        m: TS_COST,
        tone: "violet",
        unit: "원",
      },
    ],
    steps: [
      {
        id: "sc3s1",
        kind: "choice",
        ask: "동아리별·업체별 총액을 한 번에 얻으려면 어떻게 곱해야 할까요?",
        options: [
          [{ tex: "QC" }, { post: " — 가로줄은 동아리, 세로줄은 업체가 된다" }],
          [{ tex: "CQ" }, { post: " — 가로줄도 사이즈, 세로줄도 사이즈가 된다" }],
          [{ tex: "Q + C" }, { post: " — 같은 자리끼리 더한다" }],
          [{ pre: "둘 다 3×3 이니 " }, { tex: "QC" }, { post: " 와 " }, { tex: "CQ" }, { post: " 가 같다" }],
        ],
        answer: 0,
        explains: [
          "",
          "가운데에서 만나는 것이 사이즈여야 해요. CQ 는 사이즈끼리 만나 뜻이 없는 표가 나와요.",
          "장수와 값을 더하는 것은 뜻이 없어요. 곱해야 금액이 돼요.",
          "꼴이 같아도 값은 달라져요. 순서를 바꾸면 표의 뜻이 바뀌어요.",
        ],
        hint: "앞 행렬의 세로줄과 뒤 행렬의 가로줄이 만나요. 둘 다 사이즈여야 하겠죠?",
      },
      {
        id: "sc3s2",
        kind: "num",
        ask: "사진부가 가 업체에 맞추면 모두 얼마일까요?",
        answer: TS_TOTAL[0][0],
        unit: "원",
        hint: "10 × 8000 + 20 × 12500 + 5 × 14000 을 계산해요.",
      },
      {
        id: "sc3s3",
        kind: "choice",
        ask: "세 동아리가 각각 가장 싸게 맞추려면 어느 업체로 가야 할까요?",
        options: [
          [{ pre: "사진부 가 · 밴드부 나 · 요리부 다" }],
          [{ pre: "사진부 나 · 밴드부 다 · 요리부 가" }],
          [{ pre: "세 동아리 모두 다 업체" }],
          [{ pre: "세 동아리 모두 가 업체" }],
        ],
        answer: 1,
        explains: [
          "가로줄마다 가장 작은 값을 다시 찾아보세요.",
          "",
          "L 이 많은 밴드부에만 다 업체가 유리해요.",
          "S 가 많은 요리부에만 가 업체가 유리해요.",
        ],
        hint: "행렬 QC 의 가로줄마다 가장 작은 값을 찾으면 돼요.",
        done: "주문한 사이즈의 비율이 다르니 동아리마다 유리한 업체가 달라요.",
      },
      {
        id: "sc3s4",
        kind: "num",
        ask: "각자 가장 싼 곳을 골랐다면 세 동아리가 내는 돈은 모두 얼마일까요?",
        answer: TS_BEST_SUM,
        unit: "원",
        hint: "가로줄마다 고른 세 값을 더해요.",
      },
    ],
    wrap: "행렬 하나만 구해 두면 아홉 가지 경우를 한꺼번에 견줄 수 있어요.",
  },
  {
    id: "sc4",
    emoji: "☕",
    title: "카페 한 잔의 원가",
    lead: "메뉴마다 들어가는 재료가 달라요. 재료값을 곱해 한 잔의 원가를 구해 봐요.",
    tables: [
      {
        caption: "한 잔에 쓰는 재료",
        sym: "U",
        cornerRow: "메뉴",
        cornerCol: "재료",
        rowLabels: ["아메리카노", "카페라떼", "바닐라라떼"],
        colLabels: ["원두(g)", "우유(mL)", "시럽(mL)"],
        m: CF_USE,
        tone: "amber",
      },
      {
        caption: "재료 1단위 값",
        sym: "P",
        cornerRow: "재료",
        cornerCol: "값",
        rowLabels: ["원두 1g", "우유 1mL", "시럽 1mL"],
        colLabels: ["원"],
        m: CF_UNIT,
        tone: "rose",
      },
      {
        caption: "한 잔 판매가",
        sym: "V",
        cornerRow: "메뉴",
        cornerCol: "값",
        rowLabels: ["아메리카노", "카페라떼", "바닐라라떼"],
        colLabels: ["원"],
        m: CF_SELL,
        tone: "emerald",
      },
    ],
    steps: [
      {
        id: "sc4s1",
        kind: "choice",
        ask: "한 잔의 재료비를 구하려면 어떻게 곱해야 할까요?",
        options: [
          [{ tex: "PU" }, { post: " — 3×1 에 3×3 을 곱한다" }],
          [{ tex: "U + P" }, { post: " — 같은 자리끼리 더한다" }],
          [{ tex: "UP" }, { post: " — 3×3 에 3×1 을 곱해 3×1 이 나온다" }],
          [{ tex: "UP" }, { post: " — 3×3 에 3×1 을 곱해 1×3 이 나온다" }],
        ],
        answer: 2,
        explains: [
          "앞의 세로줄이 1개, 뒤의 가로줄이 3개라 곱할 수 없어요.",
          "꼴이 달라 더할 수 없고, 더해도 금액이 되지 않아요.",
          "",
          "곱은 맞지만 결과의 꼴은 (앞의 가로줄 수) × (뒤의 세로줄 수) 예요.",
        ],
        hint: "가운데에서 만나는 수가 같아야 해요. 재료가 3가지죠.",
      },
      {
        id: "sc4s2",
        kind: "fill",
        ask: "UP 을 계산해 메뉴별 재료비를 채워 보세요.",
        target: CF_COST,
        unit: "원",
        hint: "아메리카노는 18 × 40 + 0 × 1 + 0 × 3 이에요.",
        done: "우유와 시럽이 0 인 자리는 곱해도 0 이라 값에 영향을 주지 않아요.",
      },
      {
        id: "sc4s3",
        kind: "num",
        ask: "바닐라라떼 한 잔을 팔면 재료비를 뺀 돈은 얼마가 남을까요?",
        answer: 4000 - 960,
        unit: "원",
        hint: "판매가 행렬 V 의 (3, 1) 성분 4,000 에서 재료비 행렬의 (3, 1) 성분을 빼요.",
      },
      {
        id: "sc4s4",
        kind: "num",
        ask: "하루에 아메리카노 120잔, 카페라떼 80잔, 바닐라라떼 50잔을 팔았다면 재료비는 모두 얼마일까요?",
        answer: CF_DAY_COST,
        unit: "원",
        hint: "판매 잔수를 1×3 행렬로 보고 재료비 행렬을 곱하면 한 칸이 나와요.",
        done: "같은 날 매출은 780,000원이었으니 재료비를 뺀 돈은 572,000원이에요.",
      },
    ],
    wrap: "가로 한 줄과 세로 한 줄의 곱이 수 하나가 되는 것, 그것이 이런 합계 계산의 정체예요.",
  },
  {
    id: "sc5",
    emoji: "🎪",
    title: "학교 축제 부스",
    lead: "이틀 동안 세 학급 부스의 판매 기록이에요. 덧셈과 곱셈을 이어서 써 봐요.",
    tables: [
      {
        caption: "첫날 판매량",
        sym: "D_1",
        cornerRow: "부스",
        cornerCol: "품목",
        rowLabels: ["1반", "2반", "3반"],
        colLabels: ["음료", "간식", "굿즈"],
        m: FS_D1,
        tone: "sky",
        unit: "개",
      },
      {
        caption: "둘째 날 판매량",
        sym: "D_2",
        cornerRow: "부스",
        cornerCol: "품목",
        rowLabels: ["1반", "2반", "3반"],
        colLabels: ["음료", "간식", "굿즈"],
        m: FS_D2,
        tone: "violet",
        unit: "개",
      },
      {
        caption: "품목 값",
        sym: "P",
        cornerRow: "품목",
        cornerCol: "값",
        rowLabels: ["음료", "간식", "굿즈"],
        colLabels: ["원"],
        m: FS_PRICE,
        tone: "emerald",
      },
    ],
    steps: [
      {
        id: "sc5s1",
        kind: "fill",
        ask: "이틀 동안의 판매량 D₁ + D₂ 를 채워 보세요.",
        target: FS_SUM,
        unit: "개",
        hint: "1반 음료는 40 + 35 예요.",
        done: "먼저 더해서 하나의 행렬로 만들어 두면 다음 계산이 한 번으로 끝나요.",
      },
      {
        id: "sc5s2",
        kind: "choice",
        ask: "부스별 이틀 매출을 한 번에 구하는 식은?",
        options: [
          [{ tex: "(D_1 + D_2)P" }],
          [{ tex: "P(D_1 + D_2)" }],
          [{ tex: "D_1 P + D_2" }],
          [{ tex: "(D_1 + D_2) + P" }],
        ],
        answer: 0,
        explains: [
          "",
          "3×1 에 3×3 을 곱할 수는 없어요.",
          "둘째 날 판매량에도 값을 곱해야 해요.",
          "개수와 값을 더하면 뜻이 없는 수가 나와요.",
        ],
        hint: "판매량 행렬의 세로줄과 값 행렬의 가로줄이 모두 품목이어야 해요.",
      },
      {
        id: "sc5s3",
        kind: "num",
        ask: "1반 부스의 이틀 매출은 얼마일까요?",
        answer: FS_SALE[0][0],
        unit: "원",
        hint: "75 × 2000 + 55 × 3000 + 50 × 1500 이에요.",
      },
      {
        id: "sc5s4",
        kind: "choice",
        ask: "매출이 가장 많은 부스는 어디일까요?",
        options: [[{ pre: "1반 부스" }], [{ pre: "2반 부스" }], [{ pre: "3반 부스" }], [{ pre: "세 부스가 모두 같다" }]],
        answer: 2,
        explains: [
          "가장 적게 판 부스예요.",
          "3반보다 27,500원 적어요.",
          "",
          "세 값이 모두 다르게 나와요.",
        ],
        hint: "매출 행렬의 세 칸을 견줘 보세요.",
        done: "굿즈를 많이 판 3반이 452,500원으로 가장 많았어요.",
      },
    ],
    wrap: "덧셈으로 자료를 모으고 곱셈으로 금액을 얻는 두 단계, 이것이 행렬을 쓰는 가장 흔한 방법이에요.",
  },
];

export const REAL_NOTE =
  "이 탭과 스프레드시트 탭에 나오는 수량과 값은 계산이 깔끔하게 떨어지도록 이 활동을 위해 정한 가상의 값이다.";
