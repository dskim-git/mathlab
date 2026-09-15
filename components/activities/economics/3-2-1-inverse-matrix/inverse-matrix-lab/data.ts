// 역행렬과 행렬식 — 활동 데이터
//
//  · 이차정사각행렬 A = ((a,b),(c,d)) 에 대하여 AX = XA = E 를 만족하는 X 를
//    A 의 역행렬이라 하고 A⁻¹ 로 쓴다. AX = E 를 성분으로 풀면
//        (ad - bc)x = d,  (ad - bc)z = -c,  (ad - bc)y = -b,  (ad - bc)w = a
//    이므로 ad - bc ≠ 0 일 때만 X 가 정해지고
//        A⁻¹ = 1/(ad - bc) · ((d, -b), (-c, a))
//    ad - bc = 0 이면 위 네 식에서 a = b = c = d = 0 이어야 하는데 이는 A ≠ O 에
//    어긋나므로 역행렬이 없다. ad - bc 를 A 의 행렬식이라 하고 det(A) 로 쓴다.
//
//  · 대각선 두 성분은 자리를 바꾸고(a ↔ d) 나머지 두 성분은 부호를 바꾼( b, c )
//    행렬 ((d,-b),(-c,a)) 를 이 활동에서는 '짝 행렬' 이라 부르고, 여기에
//    1/det(A) 를 곱한 것이 역행렬이다. det(A) 가 1 또는 -1 이면 역행렬의 성분이
//    모두 정수로 떨어진다.
//
//  · det(A) = 0 인 것은 한 가로줄이 다른 가로줄의 실수배이거나 한 줄이 통째로
//    0 인 경우다. 곧 두 줄이 서로 '같은 방향' 이라 정보가 하나뿐인 셈이다.
//
// ── 탭 ① 역행렬 실험실 ────────────────────────────────────
//  · a, b, c, d 를 -5 부터 5 까지 움직인다. 시작은 A = ((2,3),(1,4)), det = 5.
//    미션은 det = 0 만들기 / det = 1 만들기 / det = -4 만들기 / A⁻¹ = A 만들기.
//    A⁻¹ = A 는 A² = E 와 같은 말이고, 범위 안의 해를 완전탐색으로 세어 두었다.
//    시작 행렬은 어느 미션도 처음부터 풀려 있지 않도록 골랐다.
//  · 연습 문제의 답
//        det((4,7),(1,2)) = 1      A⁻¹ = (( 2,-7),(-1, 4))
//        det((7,3),(4,2)) = 2      짝 행렬 (( 2,-3),(-4, 7))
//        det((2,5),(1,3)) = 1      A⁻¹ = (( 3,-5),(-1, 2))
//
// ── 탭 ② 실생활 ───────────────────────────────────────────
//  · 모두 AX = B 를 X = A⁻¹B 로 푸는 문제다. 행렬식을 1 · 5 · -1 · -2 · 10 으로
//    골고루 두어 '역행렬이 정수인 경우' 와 '1/det 를 앞에 빼야 하는 경우' 를 함께 다룬다.
//        분식집   A = ((2,1),(3,2))   det  1   B = (11, 18)    X = (4, 3)    천원
//        영화관   A = ((3,2),(2,3))   det  5   B = (46, 44)    X = (10, 8)   천원
//        문구점   A = ((4,3),(3,2))   det -1   B = (11,  8)    X = (2, 1)    천원
//        티셔츠   A = ((6,4),(5,3))   det -2   B = (118, 95)   X = (13, 10)  천원
//        비료배합 A = ((4,2),(1,3))   det 10   B = (100,100)   X = (10, 30)  kg
//    다섯 문제 모두 해가 양의 정수로 떨어지도록 값을 골랐다.
//    금액과 함량은 이 활동을 위해 정한 가상의 값이다.
//
// ── 탭 ③ 행렬 암호 ────────────────────────────────────────
//  · 글자표의 번호 두 개를 열행렬 v 로 보고 열쇠 K 를 곱해 암호 c = Kv 를 만든다.
//    받는 쪽은 K⁻¹c = v 로 되돌린다. 열쇠는 det(K) = 1 인 것만 써서 K⁻¹ 이
//    정수 행렬이 되게 했다. det 가 1 이 아니면 복호한 값이 분수가 되어 글자 번호가
//    되지 못한다 — 이 점을 활동 안에서 짚는다.
//        K1 = ((2,1),(3,2))  det 1   K1⁻¹ = (( 2,-1),(-3, 2))
//        K2 = ((3,2),(4,3))  det 1   K2⁻¹ = (( 3,-2),(-4, 3))
//    수학(18,33) → K1 → (69,120)      친구(28,2)  → K1 → (58, 88)
//    사랑(16, 7) → K1 → (39, 62)      행렬(34,9)  → K2 → (120,163)
//    암호(20,36) → K2 → (132,188)
//
// ── 탭 ④ 행렬식 사냥 ──────────────────────────────────────
//  · 카드 열두 장 가운데 역행렬이 있는 것(det ≠ 0)만 골라 담는다.
//    det = 0 인 여섯 장은 한 가로줄이 다른 가로줄의 실수배이거나 한 줄이 0 인 것들이다.

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
export function eqM(a: Mat, b: Mat): boolean {
  if (rowsOf(a) !== rowsOf(b) || colsOf(a) !== colsOf(b)) return false;
  return a.every((row, i) => row.every((v, j) => Math.abs(v - b[i][j]) < 1e-9));
}

/** 이차정사각행렬의 행렬식 ad - bc */
export function det2(m: Mat): number {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}
/** 대각선은 자리를 바꾸고 나머지는 부호를 바꾼 '짝 행렬' ((d,-b),(-c,a)) */
export function adj2(m: Mat): Mat {
  return [
    [m[1][1], -m[0][1]],
    [-m[1][0], m[0][0]],
  ];
}
/** 역행렬 — 행렬식이 0 이면 null */
export function inv2(m: Mat): Mat | null {
  const k = det2(m);
  if (k === 0) return null;
  return adj2(m).map((row) => row.map((v) => v / k));
}
export const EYE: Mat = [
  [1, 0],
  [0, 1],
];
/** 역행렬의 성분이 모두 정수인가 (행렬식이 1 또는 -1) */
export function invIsInteger(m: Mat): boolean {
  return Math.abs(det2(m)) === 1;
}

// ══════════════════════════════════════════════════════════════
//  수식 문자열
// ══════════════════════════════════════════════════════════════
export function matTex(m: Mat): string {
  const body = m.map((row) => row.map((v) => fmt(v)).join(" & ")).join(" \\\\ ");
  return `\\begin{pmatrix} ${body} \\end{pmatrix}`;
}
export function shapeTex(r: number, c: number): string {
  return `${r} \\times ${c}`;
}
/** ad - bc 를 실제 수로 적는다 */
export function detTex(m: Mat): string {
  const w = (v: number) => (v < 0 ? `(${v})` : `${v}`);
  return `${w(m[0][0])} \\cdot ${w(m[1][1])} - ${w(m[0][1])} \\cdot ${w(m[1][0])} = ${det2(m)}`;
}
/** 역행렬을 사람이 읽는 꼴로 — 행렬식이 ±1 이면 분수를 앞에 붙이지 않는다 */
export function invTex(m: Mat): string {
  const k = det2(m);
  if (k === 0) return "";
  const inv = inv2(m) as Mat;
  if (Math.abs(k) === 1) return matTex(inv);
  return `\\frac{1}{${k}} ${matTex(adj2(m))}`;
}

// ══════════════════════════════════════════════════════════════
//  단계 문제 — 모든 탭이 함께 쓴다
// ══════════════════════════════════════════════════════════════
export type StepBase = {
  id: string;
  ask: string;
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
//  탭 ① 역행렬 실험실
// ══════════════════════════════════════════════════════════════
export const KNOB_MIN = -5;
export const KNOB_MAX = 5;
export const KNOB_START = { a: 2, b: 3, c: 1, d: 4 };

export type Mission = {
  id: string;
  emoji: string;
  goal: string;
  hint: string;
  test: (m: Mat) => boolean;
};
export const MISSIONS: Mission[] = [
  {
    id: "mi1",
    emoji: "🚫",
    goal: "역행렬이 없는 행렬 만들기",
    hint: "행렬식이 0 이 되면 돼요. 아래 가로줄을 위 가로줄의 몇 배로 맞춰 보세요.",
    test: (m) => det2(m) === 0,
  },
  {
    id: "mi2",
    emoji: "🎯",
    goal: "행렬식이 1 인 행렬 만들기",
    hint: "ad 가 bc 보다 딱 1 만큼 크면 돼요.",
    test: (m) => det2(m) === 1,
  },
  {
    id: "mi3",
    emoji: "🎯",
    goal: "행렬식이 -4 인 행렬 만들기",
    hint: "이번에는 bc 가 ad 보다 4 만큼 커야 해요.",
    test: (m) => det2(m) === -4,
  },
  {
    id: "mi4",
    emoji: "🪞",
    goal: "자기 자신이 역행렬인 행렬 만들기",
    hint: "A 를 두 번 곱해 단위행렬이 되면 돼요. 대각선의 두 수를 서로 반대 부호로 맞춰 보는 것도 방법이에요.",
    test: (m) => det2(m) !== 0 && eqM(mulM(m, m), EYE),
  },
];
export function missionDone(ms: Mission, m: Mat): boolean {
  return ms.test(m);
}

const L1: Mat = [
  [4, 7],
  [1, 2],
];
const L2: Mat = [
  [7, 3],
  [4, 2],
];
const L3: Mat = [
  [2, 5],
  [1, 3],
];

export const LEARN_STEPS: Step[] = [
  {
    id: "l1",
    kind: "num",
    ask: "이 행렬의 행렬식을 구해 보세요.",
    mats: [{ label: "A", m: L1 }],
    answer: det2(L1),
    hint: "대각선끼리 곱해서 빼요. 4 곱하기 2 에서 7 곱하기 1 을 빼면 돼요.",
  },
  {
    id: "l2",
    kind: "fill",
    ask: "행렬식이 1 이니 역행렬의 성분이 모두 정수예요. A 의 역행렬을 채워 보세요.",
    mats: [{ label: "A", m: L1 }],
    target: inv2(L1) as Mat,
    hint: "대각선의 두 수는 자리를 바꾸고, 나머지 두 수는 부호를 바꿔요.",
    done: "행렬식이 1 이면 짝 행렬이 곧 역행렬이에요.",
  },
  {
    id: "l3",
    kind: "choice",
    ask: "다음 중 역행렬이 존재하지 않는 행렬은 어느 것일까요?",
    options: [
      [
        {
          tex: matTex([
            [3, 1],
            [5, 2],
          ]),
        },
      ],
      [
        {
          tex: matTex([
            [2, 6],
            [3, 9],
          ]),
        },
      ],
      [
        {
          tex: matTex([
            [1, 4],
            [2, 7],
          ]),
        },
      ],
      [
        {
          tex: matTex([
            [5, 2],
            [7, 3],
          ]),
        },
      ],
    ],
    answer: 1,
    explains: [
      "행렬식이 6 − 5 = 1 이라 역행렬이 있어요.",
      "",
      "행렬식이 7 − 8 = −1 이라 역행렬이 있어요.",
      "행렬식이 15 − 14 = 1 이라 역행렬이 있어요.",
    ],
    hint: "네 행렬의 행렬식을 차례로 계산해 보세요. 0 이 되는 것이 하나 있어요.",
    done: "오른쪽 세로줄이 왼쪽 세로줄의 꼭 3배예요. 이렇게 두 줄이 같은 방향이면 행렬식이 0 이 됩니다.",
  },
  {
    id: "l4",
    kind: "num",
    ask: "이번 행렬의 행렬식은 얼마일까요?",
    mats: [{ label: "B", m: L2 }],
    answer: det2(L2),
    hint: "7 곱하기 2 에서 3 곱하기 4 를 빼요.",
  },
  {
    id: "l5",
    kind: "fill",
    ask: "행렬식이 1 이 아니므로 앞에 분수를 뺍니다. 분수 뒤에 곱할 행렬(짝 행렬)을 채워 보세요.",
    mats: [{ label: "B", m: L2 }],
    target: adj2(L2),
    hint: "대각선의 7 과 2 는 자리를 바꾸고, 3 과 4 는 부호를 바꿔요.",
    done: "여기에 행렬식의 역수를 곱한 것이 역행렬이에요.",
  },
  {
    id: "l6",
    kind: "fill",
    ask: "마지막이에요. 이 행렬의 역행렬을 채워 보세요.",
    mats: [{ label: "C", m: L3 }],
    target: inv2(L3) as Mat,
    hint: "먼저 행렬식을 구해 보세요. 1 이 나오면 짝 행렬이 그대로 역행렬이에요.",
  },
  {
    id: "l7",
    kind: "choice",
    ask: "행렬식이 0 이면 왜 역행렬이 없을까요?",
    options: [
      [{ pre: "행렬식이 음수가 되어 계산할 수 없기 때문에" }],
      [{ pre: "행렬이 정사각행렬이 아니기 때문에" }],
      [{ pre: "성분이 모두 0 인 행렬이기 때문에" }],
      [{ pre: "0 으로 나누는 셈이 되어 역행렬을 정할 수 없기 때문에" }],
    ],
    answer: 3,
    explains: [
      "행렬식이 음수여도 역행렬은 잘 있어요. 0 일 때만 없어요.",
      "정사각행렬이라도 행렬식이 0 이면 역행렬이 없어요.",
      "성분이 0 이 아니어도 두 줄이 같은 방향이면 행렬식이 0 이 돼요.",
      "",
    ],
    hint: "역행렬의 식에서 행렬식이 어디에 놓여 있는지 보세요.",
    done: "역행렬은 행렬식의 역수를 곱한 꼴이라, 행렬식이 0 이면 그 역수를 만들 수 없어요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 실생활
// ══════════════════════════════════════════════════════════════
export type Scene = {
  id: string;
  emoji: string;
  title: string;
  lead: string;
  /** 두 가지 조건을 사람 말로 */
  facts: string[];
  /** 구하는 것의 이름 */
  names: [string, string];
  unit: string;
  A: Mat;
  B: Mat;
  X: Mat;
  steps: Step[];
  wrap: string;
};

/** X = A⁻¹B — 1/det 를 먼저 곱하면 오차가 생기므로 짝 행렬을 곱한 뒤 나눈다 */
const solve = (A: Mat, B: Mat): Mat => {
  const k = det2(A);
  return mulM(adj2(A), B).map((row) => row.map((v) => v / k));
};

const SC1_A: Mat = [
  [2, 1],
  [3, 2],
];
const SC1_B: Mat = [[11], [18]];
const SC2_A: Mat = [
  [3, 2],
  [2, 3],
];
const SC2_B: Mat = [[46], [44]];
const SC3_A: Mat = [
  [4, 3],
  [3, 2],
];
const SC3_B: Mat = [[11], [8]];
const SC4_A: Mat = [
  [6, 4],
  [5, 3],
];
const SC4_B: Mat = [[118], [95]];
const SC5_A: Mat = [
  [4, 2],
  [1, 3],
];
const SC5_B: Mat = [[100], [100]];

export const SCENES: Scene[] = [
  {
    id: "sc1",
    emoji: "🍢",
    title: "분식집 가격 알아내기",
    lead: "가격표가 지워졌어요. 두 사람이 낸 값만 보고 떡볶이와 순대의 값을 알아내 봐요.",
    facts: ["떡볶이 2인분과 순대 1인분에 11,000원", "떡볶이 3인분과 순대 2인분에 18,000원"],
    names: ["떡볶이 1인분", "순대 1인분"],
    unit: "천원",
    A: SC1_A,
    B: SC1_B,
    X: solve(SC1_A, SC1_B),
    steps: [
      {
        id: "sc1s1",
        kind: "choice",
        ask: "두 조건을 AX = B 로 나타낼 때 A 는 어느 것일까요?",
        options: [
          [
            {
              tex: matTex([
                [2, 1],
                [3, 2],
              ]),
            },
          ],
          [
            {
              tex: matTex([
                [2, 3],
                [1, 2],
              ]),
            },
          ],
          [
            {
              tex: matTex([
                [1, 2],
                [2, 3],
              ]),
            },
          ],
          [
            {
              tex: matTex([
                [11, 18],
                [2, 1],
              ]),
            },
          ],
        ],
        answer: 0,
        explains: [
          "",
          "가로줄과 세로줄이 뒤바뀌었어요. 한 가로줄이 한 사람의 주문이어야 해요.",
          "두 사람의 주문 순서가 바뀌었어요. 첫 줄은 떡볶이 2인분이에요.",
          "낸 돈은 A 가 아니라 B 에 들어가요.",
        ],
        hint: "가로줄 하나가 한 사람의 주문이에요. 첫 줄은 떡볶이 2, 순대 1 이지요.",
      },
      {
        id: "sc1s2",
        kind: "num",
        ask: "그 A 의 행렬식은 얼마일까요?",
        answer: det2(SC1_A),
        hint: "2 곱하기 2 에서 1 곱하기 3 을 빼요.",
        done: "행렬식이 0 이 아니니 역행렬이 있어요. 답을 구할 수 있다는 뜻이에요.",
      },
      {
        id: "sc1s3",
        kind: "fill",
        ask: "행렬식이 1 이니 역행렬의 성분이 모두 정수예요. A 의 역행렬을 채워 보세요.",
        target: inv2(SC1_A) as Mat,
        hint: "대각선은 자리를 바꾸고 나머지는 부호를 바꿔요.",
      },
      {
        id: "sc1s4",
        kind: "fill",
        ask: "역행렬을 B 에 곱해 떡볶이와 순대의 값을 구해 보세요. (단위 천원)",
        target: solve(SC1_A, SC1_B),
        unit: "천원",
        hint: "위 칸은 2 곱하기 11 에서 18 을 뺀 값이에요.",
        done: "떡볶이 4,000원, 순대 3,000원이에요. 가격표 없이도 알아냈네요!",
      },
    ],
    wrap: "모르는 값이 둘이고 조건이 둘이면 역행렬 한 번으로 한꺼번에 풀려요.",
  },
  {
    id: "sc2",
    emoji: "🎬",
    title: "영화관 표값 알아내기",
    lead: "어른 표와 청소년 표의 값이 궁금해요. 두 가족이 낸 값으로 알아봐요.",
    facts: ["어른 3장과 청소년 2장에 46,000원", "어른 2장과 청소년 3장에 44,000원"],
    names: ["어른 표", "청소년 표"],
    unit: "천원",
    A: SC2_A,
    B: SC2_B,
    X: solve(SC2_A, SC2_B),
    steps: [
      {
        id: "sc2s1",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요?",
        mats: [{ label: "A", m: SC2_A }],
        answer: det2(SC2_A),
        hint: "3 곱하기 3 에서 2 곱하기 2 를 빼요.",
      },
      {
        id: "sc2s2",
        kind: "fill",
        ask: "이번에는 행렬식이 1 이 아니에요. 분수 뒤에 곱할 짝 행렬을 채워 보세요.",
        mats: [{ label: "A", m: SC2_A }],
        target: adj2(SC2_A),
        hint: "대각선의 3 과 3 은 자리를 바꾸고, 2 와 2 는 부호를 바꿔요.",
        done: "여기에 5분의 1 을 곱한 것이 역행렬이에요.",
      },
      {
        id: "sc2s3",
        kind: "fill",
        ask: "역행렬을 B 에 곱해 표값을 구해 보세요. (단위 천원)",
        target: solve(SC2_A, SC2_B),
        unit: "천원",
        hint: "짝 행렬을 곱한 다음 마지막에 5로 나누면 돼요.",
        done: "어른 10,000원, 청소년 8,000원이에요.",
      },
      {
        id: "sc2s4",
        kind: "choice",
        ask: "행렬식이 5 인데도 답이 정수로 나왔어요. 왜 그럴까요?",
        options: [
          [{ pre: "행렬식이 5 이면 답은 언제나 정수가 된다" }],
          [{ pre: "역행렬의 성분이 모두 정수이기 때문" }],
          [{ pre: "표값을 천원 단위로 바꿨기 때문" }],
          [{ pre: "짝 행렬을 B 에 곱한 값이 마침 5의 배수였기 때문" }],
        ],
        answer: 3,
        explains: [
          "B 가 달라지면 분수가 나올 수도 있어요.",
          "역행렬의 성분은 5분의 3 처럼 분수예요. 정수가 아니에요.",
          "단위를 바꿔도 5로 나누는 것은 그대로예요.",
          "",
        ],
        hint: "짝 행렬을 B 에 곱해서 나온 두 수를 다시 보세요.",
        done: "50 과 40 이 나왔고 둘 다 5로 나누어떨어져 정수가 되었어요.",
      },
    ],
    wrap: "행렬식이 1 이 아니어도 괜찮아요. 마지막에 그 수로 나누기만 하면 됩니다.",
  },
  {
    id: "sc3",
    emoji: "✏️",
    title: "문구점 영수증",
    lead: "영수증에 품목별 값이 안 찍혔어요. 두 장의 영수증으로 알아내 봐요.",
    facts: ["공책 4권과 볼펜 3자루에 11,000원", "공책 3권과 볼펜 2자루에 8,000원"],
    names: ["공책 한 권", "볼펜 한 자루"],
    unit: "천원",
    A: SC3_A,
    B: SC3_B,
    X: solve(SC3_A, SC3_B),
    steps: [
      {
        id: "sc3s1",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요? 부호를 조심하세요.",
        mats: [{ label: "A", m: SC3_A }],
        answer: det2(SC3_A),
        hint: "4 곱하기 2 는 8, 3 곱하기 3 은 9 예요. 8에서 9를 빼면?",
        done: "행렬식이 음수예요. 음수여도 0 만 아니면 역행렬은 잘 있습니다.",
      },
      {
        id: "sc3s2",
        kind: "fill",
        ask: "행렬식이 -1 이니 역행렬도 정수예요. A 의 역행렬을 채워 보세요.",
        mats: [{ label: "A", m: SC3_A }],
        target: inv2(SC3_A) as Mat,
        hint: "짝 행렬을 만든 다음 -1 로 나누면 모든 성분의 부호가 뒤집혀요.",
      },
      {
        id: "sc3s3",
        kind: "fill",
        ask: "공책과 볼펜의 값을 구해 보세요. (단위 천원)",
        target: solve(SC3_A, SC3_B),
        unit: "천원",
        hint: "위 칸은 -2 곱하기 11 에 3 곱하기 8 을 더한 값이에요.",
        done: "공책 2,000원, 볼펜 1,000원이에요.",
      },
    ],
    wrap: "행렬식이 -1 이면 짝 행렬의 부호만 모두 뒤집으면 역행렬이 돼요.",
  },
  {
    id: "sc4",
    emoji: "👕",
    title: "동아리 단체 주문",
    lead: "두 학기의 주문 기록만 남았어요. 티셔츠와 모자의 값을 알아내 봐요.",
    facts: ["티셔츠 6장과 모자 4개에 118,000원", "티셔츠 5장과 모자 3개에 95,000원"],
    names: ["티셔츠 한 장", "모자 한 개"],
    unit: "천원",
    A: SC4_A,
    B: SC4_B,
    X: solve(SC4_A, SC4_B),
    steps: [
      {
        id: "sc4s1",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요?",
        mats: [{ label: "A", m: SC4_A }],
        answer: det2(SC4_A),
        hint: "6 곱하기 3 은 18, 4 곱하기 5 는 20 이에요.",
      },
      {
        id: "sc4s2",
        kind: "fill",
        ask: "분수 뒤에 곱할 짝 행렬을 채워 보세요.",
        mats: [{ label: "A", m: SC4_A }],
        target: adj2(SC4_A),
        hint: "6 과 3 은 자리를 바꾸고, 4 와 5 는 부호를 바꿔요.",
        done: "여기에 -2분의 1 을 곱한 것이 역행렬이에요.",
      },
      {
        id: "sc4s3",
        kind: "fill",
        ask: "티셔츠와 모자의 값을 구해 보세요. (단위 천원)",
        target: solve(SC4_A, SC4_B),
        unit: "천원",
        hint: "짝 행렬을 곱하면 -26 과 -20 이 나와요. 그것을 -2 로 나눠요.",
        done: "티셔츠 13,000원, 모자 10,000원이에요.",
      },
    ],
    wrap: "음수로 나눌 때 부호를 놓치기 쉬워요. 마지막에 답을 원래 식에 넣어 확인하는 버릇을 들여요.",
  },
  {
    id: "sc5",
    emoji: "🌱",
    title: "텃밭 비료 섞기",
    lead: "A 비료와 B 비료를 섞어 질소 100단위와 인 100단위를 딱 맞추려고 해요. 몇 kg 씩 섞어야 할까요?",
    facts: [
      "질소 100단위 — A 비료 1kg 에 4단위, B 비료 1kg 에 2단위",
      "인 100단위 — A 비료 1kg 에 1단위, B 비료 1kg 에 3단위",
    ],
    names: ["A 비료", "B 비료"],
    unit: "kg",
    A: SC5_A,
    B: SC5_B,
    X: solve(SC5_A, SC5_B),
    steps: [
      {
        id: "sc5s1",
        kind: "choice",
        ask: "질소 100단위와 인 100단위를 맞추려고 해요. 이 상황의 A 는 어느 것일까요?",
        options: [
          [
            {
              tex: matTex([
                [4, 1],
                [2, 3],
              ]),
            },
          ],
          [
            {
              tex: matTex([
                [1, 3],
                [4, 2],
              ]),
            },
          ],
          [
            {
              tex: matTex([
                [4, 2],
                [1, 3],
              ]),
            },
          ],
          [
            {
              tex: matTex([
                [100, 100],
                [4, 2],
              ]),
            },
          ],
        ],
        answer: 2,
        explains: [
          "가로줄이 영양소, 세로줄이 비료여야 해요. 첫 줄은 질소 조건이에요.",
          "질소 조건과 인 조건의 순서가 바뀌었어요.",
          "",
          "목표량은 A 가 아니라 B 에 들어가요.",
        ],
        hint: "첫 가로줄은 질소에 대한 식이에요. A 비료에서 4, B 비료에서 2 씩 나오지요.",
      },
      {
        id: "sc5s2",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요?",
        answer: det2(SC5_A),
        hint: "4 곱하기 3 에서 2 곱하기 1 을 빼요.",
      },
      {
        id: "sc5s3",
        kind: "fill",
        ask: "분수 뒤에 곱할 짝 행렬을 채워 보세요.",
        target: adj2(SC5_A),
        hint: "4 와 3 은 자리를 바꾸고, 2 와 1 은 부호를 바꿔요.",
      },
      {
        id: "sc5s4",
        kind: "fill",
        ask: "두 비료를 몇 kg 씩 섞어야 할까요? (단위 kg)",
        target: solve(SC5_A, SC5_B),
        unit: "kg",
        hint: "짝 행렬을 곱하면 100 과 300 이 나와요. 그것을 10 으로 나눠요.",
        done: "A 비료 10kg, B 비료 30kg 이에요. 원래 식에 넣어 확인해 보세요.",
      },
    ],
    wrap: "값을 구하는 문제만이 아니라 '얼마씩 섞을까' 같은 배합 문제도 같은 방법으로 풀려요.",
  },
];

export const REAL_NOTE =
  "이 활동에 나오는 값과 함량은 계산이 깔끔하게 떨어지도록 이 활동을 위해 정한 가상의 값이다.";

// ══════════════════════════════════════════════════════════════
//  탭 ③ 행렬 암호
// ══════════════════════════════════════════════════════════════
/** 글자표 — 번호는 1부터 센다 */
export const ALPHABET = [
  "가", "구", "나", "다", "답", "라", "랑", "래", "렬", "리",
  "마", "문", "미", "바", "반", "사", "삶", "수", "아", "암",
  "역", "열", "우", "자", "정", "지", "차", "친", "카", "타",
  "파", "하", "학", "행", "혜", "호", "꿈", "별", "빛", "힘",
];
export const codeOf = (ch: string): number => ALPHABET.indexOf(ch) + 1;
export const charOf = (n: number): string => (n >= 1 && n <= ALPHABET.length ? ALPHABET[n - 1] : "?");

export type Key = { id: string; name: string; m: Mat };
export const KEYS: Key[] = [
  {
    id: "k1",
    name: "열쇠 1",
    m: [
      [2, 1],
      [3, 2],
    ],
  },
  {
    id: "k2",
    name: "열쇠 2",
    m: [
      [3, 2],
      [4, 3],
    ],
  },
];

/** 두 글자를 열쇠로 묶어 암호 두 수를 만든다 */
export function encodePair(key: Mat, a: string, b: string): [number, number] {
  const v: Mat = [[codeOf(a)], [codeOf(b)]];
  const c = mulM(key, v);
  return [c[0][0], c[1][0]];
}

export type Secret = { id: string; emoji: string; word: string; keyId: string; hint: string };
export const SECRETS: Secret[] = [
  { id: "s1", emoji: "📗", word: "수학", keyId: "k1", hint: "열쇠 1 의 역행렬은 성분이 모두 정수예요. 그것을 암호에 곱해 보세요." },
  { id: "s2", emoji: "📘", word: "친구", keyId: "k1", hint: "같은 열쇠예요. 역행렬도 그대로 쓰면 돼요." },
  { id: "s3", emoji: "📙", word: "수학사랑", keyId: "k1", hint: "네 글자라 암호도 두 쌍이에요. 쌍마다 따로 풀어요." },
  { id: "s4", emoji: "📕", word: "행렬암호", keyId: "k2", hint: "열쇠가 바뀌었어요. 열쇠 2 의 역행렬을 다시 구해야 해요." },
];

/** 한 비밀의 암호 숫자쌍들 */
export function cipherOf(s: Secret): [number, number][] {
  const key = (KEYS.find((k) => k.id === s.keyId) as Key).m;
  const out: [number, number][] = [];
  for (let i = 0; i < s.word.length; i += 2) out.push(encodePair(key, s.word[i], s.word[i + 1]));
  return out;
}
/** 그 비밀의 정답 — 글자 번호 쌍들 */
export function plainOf(s: Secret): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < s.word.length; i += 2) out.push([codeOf(s.word[i]), codeOf(s.word[i + 1])]);
  return out;
}

export const CIPHER_STEPS: Step[] = [
  {
    id: "cp1",
    kind: "choice",
    ask: "암호를 만들 때 c = Kv 로 곱했어요. 받은 사람이 v 를 되찾으려면 무엇을 해야 할까요?",
    options: [
      [{ pre: "암호에 다시 K 를 곱한다" }],
      [{ pre: "암호를 K 의 성분으로 나눈다" }],
      [{ pre: "암호에 K 의 역행렬을 곱한다" }],
      [{ pre: "암호에서 K 를 뺀다" }],
    ],
    answer: 2,
    explains: [
      "한 번 더 곱하면 더 뒤엉킬 뿐이에요.",
      "행렬은 성분끼리 나누는 것이 아니에요.",
      "",
      "곱해서 만든 것은 빼서 되돌릴 수 없어요.",
    ],
    hint: "수에서 3을 곱한 것을 되돌리려면 3분의 1 을 곱하지요. 행렬에서는 무엇이 그 구실을 할까요?",
    done: "K⁻¹(Kv) = (K⁻¹K)v = Ev = v 이므로 원래 글자 번호가 그대로 돌아와요.",
  },
  {
    id: "cp2",
    kind: "choice",
    ask: "이 활동의 열쇠는 모두 행렬식이 1 이에요. 왜 그런 열쇠만 골랐을까요?",
    options: [
      [{ pre: "역행렬의 성분이 정수라야 푼 값이 글자 번호가 되기 때문에" }],
      [{ pre: "행렬식이 1 이어야 역행렬이 존재하기 때문에" }],
      [{ pre: "행렬식이 1 이면 암호가 더 커지기 때문에" }],
      [{ pre: "행렬식이 1 이어야 곱셈을 할 수 있기 때문에" }],
    ],
    answer: 0,
    explains: [
      "",
      "행렬식이 0 만 아니면 역행렬은 있어요. 1 일 필요까지는 없어요.",
      "암호의 크기와 행렬식은 상관이 없어요.",
      "곱셈은 행렬식과 상관없이 꼴만 맞으면 돼요.",
    ],
    hint: "행렬식이 2 인 열쇠로 풀면 답이 2분의 1 같은 분수로 나올 수 있어요.",
    done: "글자 번호는 정수여야 하니, 역행렬이 정수가 되는 행렬식 1 짜리 열쇠를 골랐어요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 행렬식 사냥
// ══════════════════════════════════════════════════════════════
export type HuntCard = { id: string; m: Mat; why: string };
export const HUNT_CARDS: HuntCard[] = [
  { id: "h1", m: [[2, 3], [4, 6]], why: "아래 줄이 위 줄의 2배" },
  { id: "h2", m: [[1, 2], [3, 4]], why: "" },
  { id: "h3", m: [[5, 2], [10, 4]], why: "아래 줄이 위 줄의 2배" },
  { id: "h4", m: [[3, 1], [2, 4]], why: "" },
  { id: "h5", m: [[0, 4], [0, 7]], why: "왼쪽 세로줄이 모두 0" },
  { id: "h6", m: [[2, 0], [0, 3]], why: "" },
  { id: "h7", m: [[6, 9], [2, 3]], why: "위 줄이 아래 줄의 3배" },
  { id: "h8", m: [[1, 1], [1, 1]], why: "두 줄이 똑같음" },
  { id: "h9", m: [[4, 3], [5, 4]], why: "" },
  { id: "h10", m: [[7, 2], [3, 1]], why: "" },
  { id: "h11", m: [[0, 0], [5, 3]], why: "위 가로줄이 모두 0" },
  { id: "h12", m: [[2, 5], [1, 3]], why: "" },
];
export const hasInverse = (c: HuntCard): boolean => det2(c.m) !== 0;

export const HUNT_STEPS: Step[] = [
  {
    id: "hs1",
    kind: "choice",
    ask: "역행렬이 없던 카드들의 공통점은 무엇일까요?",
    options: [
      [{ pre: "성분에 0 이 들어 있다" }],
      [{ pre: "한 가로줄이 다른 가로줄의 실수배이거나, 한 줄이 통째로 0 이다" }],
      [{ pre: "성분이 모두 양수다" }],
      [{ pre: "성분의 합이 짝수다" }],
    ],
    answer: 1,
    explains: [
      "0 이 들어 있어도 역행렬이 있는 카드가 있었어요.",
      "",
      "양수만 있어도 역행렬이 있는 카드가 많았어요.",
      "합이 짝수여도 역행렬이 있는 카드가 있었어요.",
    ],
    hint: "역행렬이 없던 카드들의 위 줄과 아래 줄을 견주어 보세요.",
    done: "두 줄이 같은 방향이면 사실 조건이 하나뿐인 셈이라, 답을 하나로 정할 수 없어요.",
  },
  {
    id: "hs2",
    kind: "choice",
    ask: "AB = E 임을 확인했다면 BA 는 어떻게 될까요?",
    options: [
      [{ pre: "BA 는 O 가 된다" }],
      [{ pre: "BA 는 계산할 수 없다" }],
      [{ pre: "BA 는 A 가 된다" }],
      [{ pre: "BA 도 E 가 된다" }],
    ],
    answer: 3,
    explains: [
      "영행렬이 되려면 성분이 모두 0 이어야 해요.",
      "둘 다 2차 정사각행렬이라 어느 순서로도 곱할 수 있어요.",
      "그렇다면 B 가 단위행렬이어야 하는데 그런 경우만 있는 것은 아니에요.",
      "",
    ],
    hint: "행렬의 곱은 순서를 바꾸면 달라지지만, 역행렬만은 예외예요.",
    done: "역행렬에서는 AA⁻¹ = A⁻¹A = E 로 교환법칙이 성립해요.",
  },
  {
    id: "hs3",
    kind: "num",
    ask: "행렬식이 0 인 카드는 열두 장 가운데 몇 장이었을까요?",
    answer: HUNT_CARDS.filter((c) => !hasInverse(c)).length,
    unit: "장",
    hint: "담지 않고 남겨 둔 카드의 수예요.",
    done: "절반인 여섯 장이었어요. 행렬식만 보면 한눈에 가를 수 있지요.",
  },
];
