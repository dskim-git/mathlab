// 행의 합과 평균을 구하는 행렬 — 활동 데이터
//
//  · m×n 행렬 A 의 오른쪽에 열행렬을 곱하면 가로줄(행)이 하나의 수로 접힌다.
//        X : 모든 성분이 1 인 n×1 행렬  →  AX 는 각 행의 성분의 합
//        Y : 모든 성분이 1/n 인 n×1 행렬 →  AY 는 각 행의 성분의 평균
//    까닭은 곱의 정의 그대로다.
//        (AX)_i1 = a_i1·1 + a_i2·1 + … + a_in·1 = (제i행의 합)
//        (AY)_i1 = a_i1·(1/n) + … + a_in·(1/n) = (제i행의 합)/n
//    성분을 모두 c 로 두면 결과는 (제i행의 합)×c 이므로, c = 1 이면 합,
//    c = 1/n 이면 평균이 된다. 여기서 n 은 반드시 A 의 열 개수여야 한다
//    (그래야 A 의 열 개수와 X 의 행 개수가 같아 곱이 정의된다).
//
//  · 거꾸로 왼쪽에 행행렬을 곱하면 세로줄(열)이 접힌다.
//        L : 모든 성분이 1 인 1×m 행렬  →  LA 는 각 열의 합
//        L : 모든 성분이 1/m 인 1×m 행렬 →  LA 는 각 열의 평균
//    양쪽에서 함께 곱하면 1×1 행렬, 곧 수 하나가 남는다.
//        (모두 1)A(모두 1)     = 모든 성분의 합
//        (모두 1/m)A(모두 1/n) = 모든 성분의 평균
//
// ── 탭 ① 합 기계·평균 기계 ────────────────────────────────
//  · 세 행렬의 열 개수를 3·4·5 로 달리해 "1/n 의 n 은 열 개수" 를 스스로 찾게 했다.
//        M1 (2×3) ((12,8,10),(6,9,21))            행합 30·36   평균 10·12
//        M2 (3×4) ((8,12,4,16),(20,6,10,8),(14,10,18,6))
//                                                  행합 40·44·48 평균 10·11·12
//        M3 (3×5) ((10,15,20,5,25),(12,8,16,24,20),(18,22,14,26,10))
//                                                  행합 75·80·90 평균 15·16·18
//    세 행렬 모두 행의 합이 열 개수로 나누어떨어져 평균이 정수로 떨어진다.
//  · 연습 : A = ((7,11,6),(15,4,8)) 의 합 ((24),(27)) 과 평균 ((8),(9))
//           A = ((9,5,13,5),(6,14,2,18),(11,7,12,14)) 의 합 ((32),(40),(44))
//
// ── 탭 ② 실생활 ───────────────────────────────────────────
//  · 다섯 장면 모두 행의 합이 열 개수로 나누어떨어지도록 값을 골랐다.
//        급식 만족도 (3×5) 행합 40·45·35   평균 8·9·7      → 2반이 가장 높다
//        연습 시간   (4×5) 행합 250·240·300·220 평균 50·48·60·44
//        매점 판매   (3×4) 행합 520·800·400 평균 130·200·100
//        텃밭 수확   (3×4) 행합 60·104·44   평균 15·26·11
//        게임 대회   (4×3) 행합 255·273·240·261 평균 85·91·80·87 → B팀 우승
//    수량과 점수는 모두 이 활동을 위해 정한 가상의 값이다.
//
// ── 탭 ③ 앞뒤로 끼우기 ────────────────────────────────────
//  · 성적표 G (3×4) = ((84,90,78,88),(72,69,90,81),(90,84,81,89))
//        행합 340·312·344  → 행평균 85·78·86      (4로 나누어떨어진다)
//        열합 246·243·249·258 → 열평균 82·81·83·86 (3으로 나누어떨어진다)
//        전체 합 996, 전체 평균 996/12 = 83
//    왼쪽 슬롯과 오른쪽 슬롯에 무엇을 끼우느냐로 아홉 가지 결과가 모두 뜻을 가진다.
//
// ── 탭 ④ 빈칸 탐정 ────────────────────────────────────────
//  · 지워진 칸을 가로 합(또는 평균)과 세로 합으로 되살리는 퍼즐 다섯.
//    다섯 문제 모두 0 이상 40 이하의 정수 범위를 완전탐색해 답이 하나뿐임을 확인했다.
//        P1 (2×3) ((5,7,8),(9,4,6))                  지운 칸 (1,2) (2,3)
//        P2 (3×3) ((6,7,9),(8,5,4),(3,10,7))         지운 칸 (1,2) (2,1) (3,3)
//        P3 (3×3) ((8,9,10),(12,6,6),(9,14,7))       평균만 주어짐
//        P4 (3×4) ((7,9,5,12),(4,8,11,6),(10,3,9,6)) 가로·세로 합 모두 주어짐
//        P5 (3×3) ((8,6,11),(9,7,4),(5,12,7))        첫 행의 합까지 지워 세로 합으로 되짚게 했다

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
export function rowSums(a: Mat): number[] {
  return a.map((row) => row.reduce((x, y) => x + y, 0));
}
export function colSums(a: Mat): number[] {
  return (a[0] ?? []).map((_, j) => a.reduce((s, row) => s + row[j], 0));
}
/** 모든 성분이 v 인 r×c 행렬 */
export function fillM(r: number, c: number, v: number): Mat {
  return Array.from({ length: r }, () => Array.from({ length: c }, () => v));
}

// ══════════════════════════════════════════════════════════════
//  수식 문자열
// ══════════════════════════════════════════════════════════════
export function matTex(m: Mat): string {
  const body = m.map((row) => row.map((v) => fmt(v)).join(" & ")).join(" \\\\ ");
  return `\\begin{pmatrix} ${body} \\end{pmatrix}`;
}
/** 모든 칸이 같은 식인 열행렬 · 행행렬 */
export function colVecTex(n: number, tex: string): string {
  return `\\begin{pmatrix} ${Array.from({ length: n }, () => tex).join(" \\\\ ")} \\end{pmatrix}`;
}
export function rowVecTex(n: number, tex: string): string {
  return `\\begin{pmatrix} ${Array.from({ length: n }, () => tex).join(" & ")} \\end{pmatrix}`;
}
export function shapeTex(r: number, c: number): string {
  return `${r} \\times ${c}`;
}
/** 12·1 + 8·1 + 10·1 처럼 한 행이 접히는 과정을 적는다 */
export function foldTex(row: number[], cTex: string): string {
  return row.map((v, i) => `${i > 0 ? " + " : ""}${v < 0 ? `(${v})` : v} \\cdot ${cTex}`).join("");
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
//  탭 ① 합 기계 · 평균 기계
// ══════════════════════════════════════════════════════════════
export type LabMat = { id: string; label: string; caption: string; m: Mat };

export const LAB_MATS: LabMat[] = [
  {
    id: "m1",
    label: "2×3",
    caption: "가로줄 2개 · 세로줄 3개",
    m: [
      [12, 8, 10],
      [6, 9, 21],
    ],
  },
  {
    id: "m2",
    label: "3×4",
    caption: "가로줄 3개 · 세로줄 4개",
    m: [
      [8, 12, 4, 16],
      [20, 6, 10, 8],
      [14, 10, 18, 6],
    ],
  },
  {
    id: "m3",
    label: "3×5",
    caption: "가로줄 3개 · 세로줄 5개",
    m: [
      [10, 15, 20, 5, 25],
      [12, 8, 16, 24, 20],
      [18, 22, 14, 26, 10],
    ],
  },
];

/** 열행렬에 넣을 수 — 분수는 KaTeX 로, 글자 이름은 따로 둔다 */
export type Frac = { id: string; num: number; den: number; tex: string; name: string };
export const C_CHIPS: Frac[] = [
  { id: "c1", num: 1, den: 1, tex: "1", name: "1" },
  { id: "c2", num: 1, den: 2, tex: "\\frac{1}{2}", name: "2분의 1" },
  { id: "c3", num: 1, den: 3, tex: "\\frac{1}{3}", name: "3분의 1" },
  { id: "c4", num: 1, den: 4, tex: "\\frac{1}{4}", name: "4분의 1" },
  { id: "c5", num: 1, den: 5, tex: "\\frac{1}{5}", name: "5분의 1" },
  { id: "c6", num: 2, den: 1, tex: "2", name: "2" },
];
export const cVal = (c: Frac): number => c.num / c.den;
export const C_START = 0;

/** 지금 고른 수가 그 행렬에서 무슨 기계가 되는지 */
export function machineKind(m: Mat, c: Frac): "sum" | "mean" | "other" {
  const v = cVal(c);
  if (Math.abs(v - 1) < 1e-9) return "sum";
  if (Math.abs(v - 1 / colsOf(m)) < 1e-9) return "mean";
  return "other";
}

const T1A: Mat = [
  [7, 11, 6],
  [15, 4, 8],
];
const T1B: Mat = [
  [9, 5, 13, 5],
  [6, 14, 2, 18],
  [11, 7, 12, 14],
];

export const LEARN_STEPS: Step[] = [
  {
    id: "l1",
    kind: "choice",
    ask: "성분이 모두 1 인 열행렬을 오른쪽에 곱하면 무엇이 나올까요?",
    options: [
      [{ pre: "각 열의 합" }],
      [{ pre: "각 행의 합" }],
      [{ pre: "모든 성분의 합" }],
      [{ pre: "각 행의 평균" }],
    ],
    answer: 1,
    explains: [
      "열의 합을 얻으려면 왼쪽에 행행렬을 곱해야 해요.",
      "",
      "그것은 양쪽에서 함께 곱했을 때예요. 지금은 결과가 여러 칸이에요.",
      "평균이 되려면 1 이 아니라 열 개수의 역수를 곱해야 해요.",
    ],
    hint: "곱의 정의를 그대로 써 보면 a₁₁·1 + a₁₂·1 + … 이에요.",
  },
  {
    id: "l2",
    kind: "choice",
    ask: "세로줄이 4개인 행렬에서 각 행의 평균을 구하려면 열행렬의 성분을 얼마로 해야 할까요?",
    options: [
      [{ tex: "\\frac{1}{3}" }],
      [{ tex: "4" }],
      [{ tex: "\\frac{1}{4}" }],
      [{ tex: "\\frac{1}{2}" }],
    ],
    answer: 2,
    explains: [
      "가로줄 개수가 아니라 세로줄 개수로 나눠야 해요. 한 줄에 수가 4개씩 있어요.",
      "나누어야 하는데 곱하면 오히려 4배가 돼요.",
      "",
      "2로 나누면 절반일 뿐 평균이 아니에요.",
    ],
    hint: "평균은 (합) ÷ (수의 개수)예요. 한 가로줄에 수가 몇 개 있나요?",
  },
  {
    id: "l3",
    kind: "choice",
    ask: "3×5 행렬 A 에 오른쪽에서 곱할 열행렬의 꼴은 무엇일까요?",
    options: [
      [{ tex: shapeTex(3, 1) }],
      [{ tex: shapeTex(1, 5) }],
      [{ tex: shapeTex(5, 5) }],
      [{ tex: shapeTex(5, 1) }],
    ],
    answer: 3,
    explains: [
      "A 의 세로줄이 5개이니 곱할 행렬의 가로줄도 5개여야 해요.",
      "그것은 행행렬이라 왼쪽에서 곱할 때 쓰는 꼴이에요.",
      "결과가 3×5 가 되어 수 하나로 접히지 않아요.",
      "",
    ],
    hint: "가운데에서 만나는 두 수가 같아야 곱할 수 있어요.",
    done: "결과는 3×1, 곧 가로줄마다 수가 하나씩 남은 행렬이 돼요.",
  },
  {
    id: "l4",
    kind: "fill",
    ask: "이 행렬의 각 행의 합을 구해 보세요. (성분이 모두 1 인 열행렬을 곱한 것과 같아요)",
    mats: [{ label: "A", m: T1A }],
    target: mulM(T1A, fillM(3, 1, 1)),
    hint: "첫 줄은 7 + 11 + 6 이에요.",
    done: "결과가 2×1 이 되었어요. 가로줄 하나가 수 하나로 접혔지요.",
  },
  {
    id: "l5",
    kind: "fill",
    ask: "이번에는 각 행의 평균을 구해 보세요.",
    mats: [{ label: "A", m: T1A }],
    target: mulM(T1A, fillM(3, 1, 1 / 3)),
    hint: "방금 구한 합을 세로줄 개수 3 으로 나누면 돼요.",
    done: "합을 구하는 기계와 평균을 구하는 기계는 곱하는 수만 다를 뿐이에요.",
  },
  {
    id: "l6",
    kind: "fill",
    ask: "세로줄이 4개인 행렬이에요. 각 행의 합을 구해 보세요.",
    mats: [{ label: "B", m: T1B }],
    target: mulM(T1B, fillM(4, 1, 1)),
    hint: "첫 줄은 9 + 5 + 13 + 5 예요.",
  },
  {
    id: "l7",
    kind: "num",
    ask: "그 행렬의 두 번째 행의 평균은 얼마일까요?",
    mats: [{ label: "B", m: T1B }],
    answer: rowSums(T1B)[1] / 4,
    hint: "두 번째 줄의 합을 4로 나눠요.",
    done: "세로줄이 몇 개든 그 개수로 나누면 평균이에요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 실생활
// ══════════════════════════════════════════════════════════════
export type TableDef = {
  caption: string;
  /** 이 표를 옮긴 행렬의 이름 */
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
  table: TableDef;
  steps: Step[];
  wrap: string;
};

const LUNCH: Mat = [
  [8, 7, 9, 6, 10],
  [9, 9, 8, 10, 9],
  [7, 6, 8, 7, 7],
];
const PRACTICE: Mat = [
  [40, 60, 50, 70, 30],
  [30, 30, 60, 60, 60],
  [50, 50, 50, 80, 70],
  [20, 40, 60, 40, 60],
];
const SHOP: Mat = [
  [120, 135, 110, 155],
  [200, 180, 220, 200],
  [90, 105, 95, 110],
];
const GARDEN: Mat = [
  [12, 15, 18, 15],
  [20, 24, 28, 32],
  [8, 10, 14, 12],
];
const ESPORTS: Mat = [
  [85, 92, 78],
  [90, 88, 95],
  [76, 84, 80],
  [95, 79, 87],
];

const meanCol = (m: Mat): Mat => mulM(m, fillM(colsOf(m), 1, 1 / colsOf(m)));
const sumCol = (m: Mat): Mat => mulM(m, fillM(colsOf(m), 1, 1));

export const SCENES: Scene[] = [
  {
    id: "sc1",
    emoji: "🍚",
    title: "급식 만족도 조사",
    lead: "세 학급이 닷새 동안 급식에 매긴 점수예요. 어느 반이 가장 만족했을까요?",
    table: {
      caption: "급식 만족도",
      sym: "S",
      cornerRow: "학급",
      cornerCol: "요일",
      rowLabels: ["1반", "2반", "3반"],
      colLabels: ["월", "화", "수", "목", "금"],
      m: LUNCH,
      tone: "amber",
      unit: "점",
    },
    steps: [
      {
        id: "sc1s1",
        kind: "choice",
        ask: "반별 평균 점수를 한 번에 구하려면 오른쪽에 무엇을 곱해야 할까요?",
        options: [
          [{ pre: "성분이 모두 " }, { tex: "\\frac{1}{3}" }, { post: " 인 3×1 행렬" }],
          [{ pre: "성분이 모두 " }, { tex: "\\frac{1}{5}" }, { post: " 인 5×1 행렬" }],
          [{ pre: "성분이 모두 " }, { tex: "1" }, { post: " 인 5×1 행렬" }],
          [{ pre: "성분이 모두 " }, { tex: "\\frac{1}{5}" }, { post: " 인 3×1 행렬" }],
        ],
        answer: 1,
        explains: [
          "반의 개수가 아니라 요일의 개수로 나눠야 해요. 한 반이 점수를 다섯 번 받았어요.",
          "",
          "그것은 닷새 점수의 합이에요. 평균이 되려면 5로 나눠야 해요.",
          "3×1 을 곱하면 5×5 가 아니라 꼴이 맞지 않아 곱할 수 없어요.",
        ],
        hint: "한 반이 며칠 동안 점수를 받았는지 세어 보세요.",
      },
      {
        id: "sc1s2",
        kind: "fill",
        ask: "반별 평균 점수를 채워 보세요.",
        target: meanCol(LUNCH),
        unit: "점",
        hint: "1반은 8 + 7 + 9 + 6 + 10 을 5로 나눠요.",
        done: "표 열다섯 칸이 세 칸으로 줄었어요. 이제 견주기 쉽지요.",
      },
      {
        id: "sc1s3",
        kind: "choice",
        ask: "가장 만족도가 높은 반은 어디일까요?",
        options: [[{ pre: "1반" }], [{ pre: "2반" }], [{ pre: "3반" }], [{ pre: "세 반이 모두 같다" }]],
        answer: 1,
        explains: [
          "평균 8점으로 가운데예요.",
          "",
          "평균 7점으로 가장 낮아요.",
          "8 · 9 · 7 로 모두 달라요.",
        ],
        hint: "평균 행렬의 세 칸을 견줘 보세요.",
        done: "닷새 내내 고르게 높았던 2반이 평균 9점으로 가장 높아요.",
      },
    ],
    wrap: "점수가 여러 날 흩어져 있어도 평균 기계를 한 번 돌리면 곧바로 견줄 수 있어요.",
  },
  {
    id: "sc2",
    emoji: "🎸",
    title: "밴드부 연습 시간",
    lead: "네 사람이 닷새 동안 연습한 시간이에요. 누가 가장 꾸준히 했을까요?",
    table: {
      caption: "연습 시간",
      sym: "T",
      cornerRow: "이름",
      cornerCol: "요일",
      rowLabels: ["민서", "준호", "하린", "시우"],
      colLabels: ["월", "화", "수", "목", "금"],
      m: PRACTICE,
      tone: "violet",
      unit: "분",
    },
    steps: [
      {
        id: "sc2s1",
        kind: "fill",
        ask: "닷새 동안의 연습 시간 합계를 채워 보세요.",
        target: sumCol(PRACTICE),
        unit: "분",
        hint: "민서는 40 + 60 + 50 + 70 + 30 이에요.",
      },
      {
        id: "sc2s2",
        kind: "fill",
        ask: "이번에는 하루 평균 연습 시간을 채워 보세요.",
        target: meanCol(PRACTICE),
        unit: "분",
        hint: "방금 구한 합을 5로 나누면 돼요.",
        done: "합을 구해 두었다면 평균은 5로 나누기만 하면 되지요.",
      },
      {
        id: "sc2s3",
        kind: "num",
        ask: "하린이는 준호보다 하루 평균 몇 분 더 연습했을까요?",
        answer: meanCol(PRACTICE)[2][0] - meanCol(PRACTICE)[1][0],
        unit: "분",
        hint: "평균 행렬에서 하린이의 칸과 준호의 칸을 빼요.",
        done: "합만 보면 50분 차이지만, 하루로 따지면 12분 차이예요.",
      },
    ],
    wrap: "합은 '얼마나 많이', 평균은 '하루에 얼마나' 를 말해 줘요. 묻는 것에 따라 골라 쓰면 돼요.",
  },
  {
    id: "sc3",
    emoji: "🏪",
    title: "학교 매점 네 주 판매",
    lead: "네 주 동안 팔린 개수예요. 품목별로 얼마나 팔렸는지 한 번에 구해 봐요.",
    table: {
      caption: "품목별 판매량",
      sym: "P",
      cornerRow: "품목",
      cornerCol: "주",
      rowLabels: ["샌드위치", "음료", "과자"],
      colLabels: ["1주", "2주", "3주", "4주"],
      m: SHOP,
      tone: "sky",
      unit: "개",
    },
    steps: [
      {
        id: "sc3s1",
        kind: "choice",
        ask: "품목별 네 주 합계를 구하는 식은 무엇일까요?",
        options: [
          [{ tex: "PX" }, { post: " — X 는 성분이 모두 1 인 4×1 행렬" }],
          [{ tex: "XP" }, { post: " — X 는 성분이 모두 1 인 1×3 행렬" }],
          [{ tex: "PY" }, { post: " — Y 는 성분이 모두 " }, { tex: "\\frac{1}{4}" }, { post: " 인 4×1 행렬" }],
          [{ tex: "P + X" }, { post: " — 같은 자리끼리 더한다" }],
        ],
        answer: 0,
        explains: [
          "",
          "왼쪽에서 곱하면 가로줄이 아니라 세로줄, 곧 주별 합계가 나와요.",
          "그것은 주당 평균이에요. 합계를 구하려면 1 을 곱해야 해요.",
          "꼴이 달라 더할 수 없고, 더해도 합계가 되지 않아요.",
        ],
        hint: "가로줄을 접으려면 오른쪽에서 곱해요.",
      },
      {
        id: "sc3s2",
        kind: "fill",
        ask: "품목별 네 주 합계를 채워 보세요.",
        target: sumCol(SHOP),
        unit: "개",
        hint: "샌드위치는 120 + 135 + 110 + 155 예요.",
      },
      {
        id: "sc3s3",
        kind: "num",
        ask: "가장 많이 팔린 품목은 한 주에 평균 몇 개씩 팔렸을까요?",
        answer: meanCol(SHOP)[1][0],
        unit: "개",
        hint: "합계가 가장 큰 품목을 찾아 4로 나눠요.",
        done: "음료가 네 주에 800개, 한 주에 평균 200개씩 팔렸어요.",
      },
    ],
    wrap: "합계 행렬 하나면 어떤 품목을 더 들여놓아야 할지 바로 보여요.",
  },
  {
    id: "sc4",
    emoji: "🥬",
    title: "학교 텃밭 수확량",
    lead: "네 주 동안 거둔 작물의 무게예요. 작물마다 한 주에 평균 얼마나 났을까요?",
    table: {
      caption: "작물별 수확량",
      sym: "H",
      cornerRow: "작물",
      cornerCol: "주",
      rowLabels: ["상추", "방울토마토", "오이"],
      colLabels: ["1주", "2주", "3주", "4주"],
      m: GARDEN,
      tone: "emerald",
      unit: "kg",
    },
    steps: [
      {
        id: "sc4s1",
        kind: "fill",
        ask: "작물별 네 주 수확량의 합을 채워 보세요.",
        target: sumCol(GARDEN),
        unit: "kg",
        hint: "상추는 12 + 15 + 18 + 15 예요.",
      },
      {
        id: "sc4s2",
        kind: "num",
        ask: "방울토마토는 한 주에 평균 몇 kg 씩 났을까요?",
        answer: meanCol(GARDEN)[1][0],
        unit: "kg",
        hint: "방울토마토의 합을 4로 나눠요.",
      },
      {
        id: "sc4s3",
        kind: "choice",
        ask: "만약 다섯째 주까지 거두어 5주로 표가 늘어난다면, 평균을 구할 때 곱하는 성분은 어떻게 달라질까요?",
        options: [
          [{ pre: "그대로 " }, { tex: "\\frac{1}{4}" }, { post: " 을 쓴다" }],
          [{ pre: "가로줄이 3개이니 " }, { tex: "\\frac{1}{3}" }, { post: " 로 바뀐다" }],
          [{ tex: "\\frac{1}{5}" }, { post: " 로 바뀌고 행렬도 5×1 이 된다" }],
          [{ pre: "평균은 곱셈으로 구할 수 없게 된다" }],
        ],
        answer: 2,
        explains: [
          "수가 다섯 개가 되었으니 5로 나눠야 해요.",
          "나누는 수는 가로줄이 아니라 세로줄의 개수예요.",
          "",
          "세로줄이 몇 개든 그 개수의 역수를 곱하면 돼요.",
        ],
        hint: "나누는 수는 한 가로줄에 들어 있는 수의 개수예요.",
        done: "세로줄이 n개면 곱할 열행렬은 언제나 성분이 1/n 인 n×1 행렬이에요.",
      },
    ],
    wrap: "표가 길어져도 규칙은 그대로예요. 세로줄 개수만 보면 됩니다.",
  },
  {
    id: "sc5",
    emoji: "🎮",
    title: "게임 대회 결승",
    lead: "네 팀이 세 판을 치렀어요. 평균 점수로 순위를 매겨 봐요.",
    table: {
      caption: "팀별 라운드 점수",
      sym: "G",
      cornerRow: "팀",
      cornerCol: "라운드",
      rowLabels: ["A팀", "B팀", "C팀", "D팀"],
      colLabels: ["1라운드", "2라운드", "3라운드"],
      m: ESPORTS,
      tone: "rose",
      unit: "점",
    },
    steps: [
      {
        id: "sc5s1",
        kind: "fill",
        ask: "팀별 평균 점수를 채워 보세요.",
        target: meanCol(ESPORTS),
        unit: "점",
        hint: "A팀은 85 + 92 + 78 을 3으로 나눠요.",
      },
      {
        id: "sc5s2",
        kind: "choice",
        ask: "우승 팀은 어디일까요?",
        options: [[{ pre: "A팀" }], [{ pre: "C팀" }], [{ pre: "B팀" }], [{ pre: "D팀" }]],
        answer: 2,
        explains: [
          "평균 85점으로 3위예요.",
          "평균 80점으로 가장 낮아요.",
          "",
          "평균 87점으로 2위예요.",
        ],
        hint: "평균 행렬에서 가장 큰 칸을 찾아요.",
      },
      {
        id: "sc5s3",
        kind: "num",
        ask: "1위 팀과 꼴찌 팀의 평균 점수 차는 얼마일까요?",
        answer: meanCol(ESPORTS)[1][0] - meanCol(ESPORTS)[2][0],
        unit: "점",
        hint: "가장 큰 칸에서 가장 작은 칸을 빼요.",
        done: "세 판을 다 더해 보지 않아도 평균 행렬만으로 순위가 정해져요.",
      },
    ],
    wrap: "판 수가 같을 때는 합으로도 순위가 같지만, 판 수가 다르면 평균이라야 공평해요.",
  },
];

export const REAL_NOTE =
  "이 활동에 나오는 점수·시간·수량은 계산이 깔끔하게 떨어지도록 이 활동을 위해 정한 가상의 값이다.";

// ══════════════════════════════════════════════════════════════
//  탭 ③ 앞뒤로 끼우기
// ══════════════════════════════════════════════════════════════
export const GRADE: Mat = [
  [84, 90, 78, 88],
  [72, 69, 90, 81],
  [90, 84, 81, 89],
];
export const GRADE_ROWS = ["1반", "2반", "3반"];
export const GRADE_COLS = ["국어", "영어", "수학", "과학"];

export type Slot = "none" | "ones" | "inv";
export const SLOTS: Slot[] = ["none", "ones", "inv"];

/** 왼쪽 행행렬 (1×m) · 오른쪽 열행렬 (n×1) */
export function leftVec(a: Mat, s: Slot): Mat | null {
  const m = rowsOf(a);
  if (s === "none") return null;
  return fillM(1, m, s === "ones" ? 1 : 1 / m);
}
export function rightVec(a: Mat, s: Slot): Mat | null {
  const n = colsOf(a);
  if (s === "none") return null;
  return fillM(n, 1, s === "ones" ? 1 : 1 / n);
}
export function machineResult(a: Mat, l: Slot, r: Slot): Mat {
  let out = a;
  const L = leftVec(a, l);
  if (L) out = mulM(L, out);
  const R = rightVec(a, r);
  if (R) out = mulM(out, R);
  return out;
}
/** 아홉 가지 조합이 저마다 무슨 뜻인지 */
export const MACHINE_LABEL: Record<string, string> = {
  "none|none": "원래 표 그대로",
  "none|ones": "각 반의 총점",
  "none|inv": "각 반의 평균",
  "ones|none": "각 과목의 총점",
  "inv|none": "각 과목의 평균",
  "ones|ones": "모든 점수의 합",
  "ones|inv": "모든 점수의 합을 과목 수로 나눈 값",
  "inv|ones": "모든 점수의 합을 반 수로 나눈 값",
  "inv|inv": "전체 평균",
};

export type Mission = { id: string; emoji: string; goal: string; left: Slot; right: Slot; hint: string };
export const MISSIONS: Mission[] = [
  { id: "ms1", emoji: "🎯", goal: "각 반의 총점 구하기", left: "none", right: "ones", hint: "가로줄을 접으려면 오른쪽에 끼워요." },
  { id: "ms2", emoji: "🎯", goal: "각 반의 평균 구하기", left: "none", right: "inv", hint: "한 반이 본 과목은 네 개예요." },
  { id: "ms3", emoji: "🎯", goal: "각 과목의 총점 구하기", left: "ones", right: "none", hint: "세로줄을 접으려면 왼쪽에 끼워요." },
  { id: "ms4", emoji: "🎯", goal: "각 과목의 평균 구하기", left: "inv", right: "none", hint: "한 과목을 본 반은 세 개예요." },
  { id: "ms5", emoji: "🏆", goal: "모든 점수의 합을 수 하나로 만들기", left: "ones", right: "ones", hint: "양쪽에서 함께 접으면 1×1 이 남아요." },
  { id: "ms6", emoji: "🏆", goal: "전체 평균을 수 하나로 만들기", left: "inv", right: "inv", hint: "양쪽 모두 개수의 역수를 끼워요." },
];
export function missionDone(ms: Mission, l: Slot, r: Slot): boolean {
  return ms.left === l && ms.right === r;
}

export const MACHINE_STEPS: Step[] = [
  {
    id: "mc1",
    kind: "choice",
    ask: "왼쪽에서 곱하는 것과 오른쪽에서 곱하는 것은 무엇이 다를까요?",
    options: [
      [{ pre: "왼쪽은 세로줄을, 오른쪽은 가로줄을 하나로 접는다" }],
      [{ pre: "왼쪽은 가로줄을, 오른쪽은 세로줄을 하나로 접는다" }],
      [{ pre: "어느 쪽에서 곱하든 결과가 같다" }],
      [{ pre: "왼쪽에서는 곱할 수 없다" }],
    ],
    answer: 0,
    explains: [
      "",
      "거꾸로예요. 오른쪽에 열행렬을 곱하면 가로줄이 접혀 반별 점수가 나왔지요.",
      "직접 끼워 보면 결과의 꼴부터 달라요. 3×1 과 1×4 이지요.",
      "가로줄 개수와 맞는 1×3 행행렬이면 왼쪽에서도 곱할 수 있어요.",
    ],
    hint: "기계에 하나씩만 끼워 보고 결과의 꼴을 견줘 보세요.",
  },
  {
    id: "mc2",
    kind: "num",
    ask: "양쪽에 성분이 모두 1 인 행렬을 끼우면 수 하나가 남아요. 그 수는 얼마일까요?",
    answer: machineResult(GRADE, "ones", "ones")[0][0],
    unit: "점",
    hint: "열두 칸을 모두 더한 값이에요.",
  },
  {
    id: "mc3",
    kind: "num",
    ask: "그러면 이 성적표의 전체 평균은 몇 점일까요?",
    answer: machineResult(GRADE, "inv", "inv")[0][0],
    unit: "점",
    hint: "모든 점수의 합을 칸의 개수 12 로 나눠요.",
    done: "양쪽에서 접으면 1×1, 곧 수 하나가 남아요.",
  },
  {
    id: "mc4",
    kind: "choice",
    ask: "각 반의 평균을 모두 더한 값과, 각 과목의 평균을 모두 더한 값은 어떤 사이일까요?",
    options: [
      [{ pre: "반 평균의 합이 언제나 더 크다" }],
      [{ pre: "서로 아무 관계도 없다" }],
      [{ pre: "과목 평균의 합이 언제나 더 크다" }],
      [{ pre: "같은 전체 합을 서로 다른 수로 나눈 것이라 대개 다르다" }],
    ],
    answer: 3,
    explains: [
      "반이 몇 개인지 과목이 몇 개인지에 따라 달라져요.",
      "둘 다 전체 합에서 나온 값이라 분명한 관계가 있어요.",
      "이 표에서는 그렇지만, 나누는 수가 바뀌면 뒤집힐 수 있어요.",
      "",
    ],
    hint: "반 평균의 합은 전체 합 ÷ 4, 과목 평균의 합은 전체 합 ÷ 3 이에요.",
    done: "전체 합 996 을 4로 나누면 249, 3으로 나누면 332 예요. 나누는 수가 다르니 값도 달라요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 빈칸 탐정
// ══════════════════════════════════════════════════════════════
export type Puzzle = {
  id: string;
  emoji: string;
  title: string;
  story: string;
  /** 정답이 들어 있는 완성 행렬 */
  m: Mat;
  /** 지운 자리 (0부터 센다) */
  blanks: { i: number; j: number }[];
  /** 오른쪽에 보여 줄 것 */
  side: "sum" | "mean";
  /** 오른쪽 값을 감춘 가로줄 */
  hiddenRows: number[];
  showColSum: boolean;
  hint: string;
};

export const PUZZLES: Puzzle[] = [
  {
    id: "p1",
    emoji: "💧",
    title: "물에 젖은 재고표",
    story: "매점 재고표에 물이 튀어 두 칸이 지워졌어요. 오른쪽 합계를 보고 되살려 보세요.",
    m: [
      [5, 7, 8],
      [9, 4, 6],
    ],
    blanks: [
      { i: 0, j: 1 },
      { i: 1, j: 2 },
    ],
    side: "sum",
    hiddenRows: [],
    showColSum: false,
    hint: "가로줄의 합에서 남아 있는 수들을 빼면 지워진 수가 나와요.",
  },
  {
    id: "p2",
    emoji: "📓",
    title: "장부의 세 칸",
    story: "동아리 장부에서 세 칸이 지워졌어요. 가로 합과 세로 합이 모두 남아 있으니 서로 맞춰 볼 수 있어요.",
    m: [
      [6, 7, 9],
      [8, 5, 4],
      [3, 10, 7],
    ],
    blanks: [
      { i: 0, j: 1 },
      { i: 1, j: 0 },
      { i: 2, j: 2 },
    ],
    side: "sum",
    hiddenRows: [],
    showColSum: true,
    hint: "가로 합으로 구한 값을 세로 합으로 다시 맞춰 보면 틀리지 않았는지 알 수 있어요.",
  },
  {
    id: "p3",
    emoji: "📊",
    title: "평균만 남은 성적표",
    story: "합계는 지워지고 평균만 남았어요. 평균에 세로줄 개수를 곱하면 합이 되지요.",
    m: [
      [8, 9, 10],
      [12, 6, 6],
      [9, 14, 7],
    ],
    blanks: [
      { i: 0, j: 1 },
      { i: 1, j: 2 },
      { i: 2, j: 0 },
    ],
    side: "mean",
    hiddenRows: [],
    showColSum: false,
    hint: "평균 × 3 이 그 가로줄의 합이에요.",
  },
  {
    id: "p4",
    emoji: "🗓️",
    title: "번진 네 주 기록",
    story: "네 주 동안의 기록인데 세 칸이 번졌어요. 가로 합과 세로 합을 모두 써서 찾아보세요.",
    m: [
      [7, 9, 5, 12],
      [4, 8, 11, 6],
      [10, 3, 9, 6],
    ],
    blanks: [
      { i: 0, j: 1 },
      { i: 1, j: 2 },
      { i: 2, j: 3 },
    ],
    side: "sum",
    hiddenRows: [],
    showColSum: true,
    hint: "세 칸이 서로 다른 가로줄에 있으니 가로 합만으로도 하나씩 구할 수 있어요.",
  },
  {
    id: "p5",
    emoji: "🕵️",
    title: "합계까지 지워진 표",
    story: "첫 줄은 합계마저 지워졌어요. 세로 합부터 써야 첫 줄의 빈칸을 찾을 수 있어요.",
    m: [
      [8, 6, 11],
      [9, 7, 4],
      [5, 12, 7],
    ],
    blanks: [
      { i: 0, j: 0 },
      { i: 1, j: 1 },
      { i: 2, j: 2 },
    ],
    side: "sum",
    hiddenRows: [0],
    showColSum: true,
    hint: "첫 칸은 첫 세로줄의 합에서 아래 두 수를 빼면 나와요.",
  },
];

/** 퍼즐에서 오른쪽에 보여 줄 값 (감춘 줄은 null) */
export function sideValues(p: Puzzle): (number | null)[] {
  const n = colsOf(p.m);
  return rowSums(p.m).map((s, i) => (p.hiddenRows.includes(i) ? null : p.side === "mean" ? s / n : s));
}
