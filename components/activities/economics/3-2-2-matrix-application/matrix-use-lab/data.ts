// 행렬로 푸는 실생활 문제 — 활동 데이터
//
//  · 네 가지 쓰임을 다룬다.
//        ① 수요·공급의 균형점    — 두 직선의 교점을 X = A⁻¹B 로 구한다
//        ② 생산량 거꾸로 알아내기 — 쓴 자원에서 만든 개수를 역행렬로 되짚는다
//        ③ 사용자 수 예측        — 전이행렬을 거듭 곱해 해마다의 변화를 본다
//        ④ 사회 연결망           — 인접행렬로 친구 수와 두 다리 건너 관계를 읽는다
//    ①②는 역행렬, ③④는 행렬의 곱이 주인공이다.
//
// ── 탭 ① 균형가격과 균형거래량 ────────────────────────────
//  · 수요 y = -d·x + q 와 공급 y = s·x + p 를 행렬로 옮기면
//        d·x + y = q,   -s·x + y = p        A = ((d, 1), (-s, 1)),  B = (q, p)
//    행렬식은 d·1 - 1·(-s) = d + s 로 늘 양수이고(수요는 내려가고 공급은 올라가므로),
//    그래서 균형점은 언제나 딱 하나 있다.
//        균형가격 x₀ = (q - p) / (d + s),   균형거래량 y₀ = (d·p + s·q) / (d + s)
//    y₀ 는 p 와 q 의 가중평균이라 늘 두 절편 사이에 놓인다 — 시뮬레이션의 세로 범위를
//    잡을 때 이 사실을 썼다.
//  · 네 문제의 답 (가격은 천원, 거래량은 개)
//        y = -20x + 300, y = 30x + 100   det 50   → (4, 220)
//        y = -15x + 400, y = 25x +  80   det 40   → (8, 280)
//        y = -35x + 710, y = 25x + 110   det 60   → (10, 360)
//        y = -12x + 510, y = 18x + 180   det 30   → (11, 378)
//
// ── 탭 ② 생산량 거꾸로 알아내기 ───────────────────────────
//  · 제품 1개에 드는 자원을 모아 A 를 만들고, 쓴 자원 총량을 B 로 두면 AX = B 다.
//    자원마다 단위가 커서 양변을 같은 수로 나누어 계수를 줄인 뒤 역행렬을 쓴다.
//        빵집     밀가루 (300,200) ÷100 → (3,2)=46,  버터 (20,80) ÷20 → (1,4)=32
//                 det 10  → 식빵 12개, 케이크 5개
//        가구     목재 (4,9)=84,           나사 (20,30) ÷10 → (2,3)=30
//                 det -6  → 의자 3개, 책상 8개
//        음료     과즙 (200,100) ÷100 → (2,1)=65, 설탕 (10,30) ÷10 → (1,3)=70
//                 det  5  → 주스 25병, 에이드 15병
//        도자기   흙 (500,600) ÷100 → (5,6)=108,  유약 (40,50) ÷10 → (4,5)=88
//                 det  1  → 컵 12개, 접시 8개
//
// ── 탭 ③ 사용자 수 예측 ───────────────────────────────────
//  · 전이행렬 A 의 (i, j) 성분은 '올해 i 를 쓰던 사람이 내년에 j 로 갈 확률' 이다.
//    가로줄의 합이 1 이어야 하고, 올해 사용자 수를 가로행렬 B 로 두면
//        내년 = BA,   내후년 = BA²,   n년 뒤 = BAⁿ
//  · A = ((p, 1-p), (q, 1-q)) 일 때 오래 지나면 비율이 q : (1-p) 로 굳는다.
//        a(1-p) = b·q 에서 a : b = q : (1-p)
//        배달앱 A = ((0.8,0.2),(0.3,0.7)), 처음 (500,300) → 1년 (490,310), 2년 (485,315),
//               오래 지나면 (480,320)      [ 0.3 : 0.2 = 3 : 2, 합 800 ]
//        음원앱 A = ((0.9,0.1),(0.4,0.6)), 처음 (600,400) → 1년 (700,300), 2년 (750,250),
//               3년 (775,225), 오래 지나면 (800,200)   [ 0.4 : 0.1 = 4 : 1, 합 1000 ]
//
// ── 탭 ④ 사회 연결망 ──────────────────────────────────────
//  · 사람 다섯을 꼭짓점으로 두고 친한 사이면 1, 아니면 0 을 적은 것이 인접행렬이다.
//    서로 친한 사이이므로 행렬은 대각선을 기준으로 대칭이고 대각선은 모두 0 이다.
//        A 에 성분이 모두 1 인 열행렬을 곱하면 각자의 친구 수가 나온다.
//        A² 의 (i, j) 성분은 i 에서 j 로 가는 두 다리짜리 길의 수다.
//          특히 A² 의 대각선은 그 사람의 친구 수와 같다(친구에게 갔다 돌아오는 길).
//        A 와 A² 를 함께 보면 두 다리 안에 닿는지 알 수 있다.
//  · 문제용 연결망의 친구 수는 하준 1, 서연 4, 도윤 3, 지우 3, 은채 3 으로
//    영향력 1등이 서연 하나뿐이다.
//  · 조작판의 시작 상태는 하준-서연-도윤-지우가 한 줄로 이어지고 은채는 혼자인
//    모습이라 네 미션 가운데 어느 것도 처음부터 풀려 있지 않다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  return String(Number(v.toFixed(d)));
}
export function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}
/** 소수 곱셈에서 생기는 부스러기만 털어 낸다 (0.1+0.2 꼴). 자릿수를 줄이면
    나눗셈의 정확도가 깎여 여러 번 곱할 때 값이 밀리므로 9자리를 쓴다 */
export const tidy = (v: number): number => Number(v.toFixed(9));

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
      return tidy(s);
    }),
  );
}
export function powM(a: Mat, k: number): Mat {
  let out: Mat = a.map((row, i) => row.map((_, j) => (i === j ? 1 : 0)));
  for (let t = 0; t < k; t++) out = mulM(out, a);
  return out;
}
export function eqM(a: Mat, b: Mat): boolean {
  if (rowsOf(a) !== rowsOf(b) || colsOf(a) !== colsOf(b)) return false;
  return a.every((row, i) => row.every((v, j) => Math.abs(v - b[i][j]) < 1e-9));
}
export function det2(m: Mat): number {
  return tidy(m[0][0] * m[1][1] - m[0][1] * m[1][0]);
}
export function adj2(m: Mat): Mat {
  return [
    [m[1][1], -m[0][1]],
    [-m[1][0], m[0][0]],
  ];
}
export function inv2(m: Mat): Mat | null {
  const k = det2(m);
  if (k === 0) return null;
  // 나눗셈 결과는 그대로 둔다 — 1/7 처럼 끝나지 않는 소수를 자르면 검산이 어긋난다
  return adj2(m).map((row) => row.map((v) => v / k));
}
/** X = A⁻¹B — 짝 행렬을 먼저 곱해야 오차가 생기지 않는다 */
export function solveAXB(A: Mat, B: Mat): Mat | null {
  const k = det2(A);
  if (k === 0) return null;
  return mulM(adj2(A), B).map((row) => row.map((v) => v / k));
}
export function fillM(r: number, c: number, v: number): Mat {
  return Array.from({ length: r }, () => Array.from({ length: c }, () => v));
}

export function matTex(m: Mat): string {
  const body = m.map((row) => row.map((v) => fmt(v)).join(" & ")).join(" \\\\ ");
  return `\\begin{pmatrix} ${body} \\end{pmatrix}`;
}
export function detTex(m: Mat): string {
  const w = (v: number) => (v < 0 ? `(${fmt(v)})` : fmt(v));
  return `${w(m[0][0])} \\cdot ${w(m[1][1])} - ${w(m[0][1])} \\cdot ${w(m[1][0])} = ${fmt(det2(m))}`;
}
export function invTex(m: Mat): string {
  const k = det2(m);
  if (k === 0) return "";
  if (Math.abs(k) === 1) return matTex(inv2(m) as Mat);
  return `\\frac{1}{${fmt(k)}} ${matTex(adj2(m))}`;
}
/** y = -20x + 300 처럼 읽는 꼴 */
export function lineTex(slope: number, intercept: number): string {
  const s = slope === 1 ? "x" : slope === -1 ? "-x" : `${fmt(slope)}x`;
  const b = intercept === 0 ? "" : intercept < 0 ? ` - ${fmt(-intercept)}` : ` + ${fmt(intercept)}`;
  return `y = ${s}${b}`;
}

// ══════════════════════════════════════════════════════════════
//  좌표평면
// ══════════════════════════════════════════════════════════════
export type Box = { xMin: number; xMax: number; yMin: number; yMax: number; gx: number; gy: number };
export type Seg = { x1: number; y1: number; x2: number; y2: number };

/** y = slope·x + intercept 를 상자 안으로 자른다 */
export function lineSeg(slope: number, intercept: number, box: Box): Seg | null {
  const E = 1e-9;
  const pts: [number, number][] = [];
  const add = (x: number, y: number) => {
    if (x < box.xMin - E || x > box.xMax + E || y < box.yMin - E || y > box.yMax + E) return;
    if (pts.some((p) => Math.abs(p[0] - x) < 1e-7 && Math.abs(p[1] - y) < 1e-7)) return;
    pts.push([x, y]);
  };
  add(box.xMin, slope * box.xMin + intercept);
  add(box.xMax, slope * box.xMax + intercept);
  if (slope !== 0) {
    add((box.yMin - intercept) / slope, box.yMin);
    add((box.yMax - intercept) / slope, box.yMax);
  }
  if (pts.length < 2) return null;
  let best: [number, number][] = [pts[0], pts[1]];
  let far = -1;
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const dd = (pts[i][0] - pts[j][0]) ** 2 + (pts[i][1] - pts[j][1]) ** 2;
      if (dd > far) {
        far = dd;
        best = [pts[i], pts[j]];
      }
    }
  return { x1: best[0][0], y1: best[0][1], x2: best[1][0], y2: best[1][1] };
}
export function inBox(p: [number, number], box: Box): boolean {
  return p[0] >= box.xMin && p[0] <= box.xMax && p[1] >= box.yMin && p[1] <= box.yMax;
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
//  탭 ① 균형가격과 균형거래량
// ══════════════════════════════════════════════════════════════
/** 수요 y = -dSlope·x + dInt, 공급 y = sSlope·x + sInt (dSlope, sSlope > 0) */
export type Market = {
  id: string;
  emoji: string;
  title: string;
  lead: string;
  dSlope: number;
  dInt: number;
  sSlope: number;
  sInt: number;
  unitX: string;
  unitY: string;
  box: Box;
  steps: Step[];
  wrap: string;
};

export const marketA = (m: { dSlope: number; sSlope: number }): Mat => [
  [m.dSlope, 1],
  [-m.sSlope, 1],
];
export const marketB = (m: { dInt: number; sInt: number }): Mat => [[m.dInt], [m.sInt]];
export function marketPoint(m: { dSlope: number; dInt: number; sSlope: number; sInt: number }): [number, number] {
  const X = solveAXB(marketA(m), marketB(m)) as Mat;
  return [X[0][0], X[1][0]];
}

// 시뮬레이션 손잡이
export const SIM_START = { dSlope: 20, dInt: 300, sSlope: 30, sInt: 100 };
export const SIM_RANGE = {
  dSlope: { min: 10, max: 50, step: 5 },
  dInt: { min: 200, max: 500, step: 20 },
  sSlope: { min: 10, max: 50, step: 5 },
  sInt: { min: 0, max: 150, step: 10 },
};
export const SIM_BOX: Box = { xMin: 0, xMax: 30, yMin: 0, yMax: 600, gx: 5, gy: 100 };

const MK1 = { dSlope: 20, dInt: 300, sSlope: 30, sInt: 100 };
const MK2 = { dSlope: 15, dInt: 400, sSlope: 25, sInt: 80 };
const MK3 = { dSlope: 35, dInt: 710, sSlope: 25, sInt: 110 };
const MK4 = { dSlope: 12, dInt: 510, sSlope: 18, sInt: 180 };
const pointCol = (m: { dSlope: number; dInt: number; sSlope: number; sInt: number }): Mat => {
  const p = marketPoint(m);
  return [[p[0]], [p[1]]];
};

export const MARKETS: Market[] = [
  {
    id: "mk1",
    emoji: "🧃",
    title: "과일주스",
    lead: "값이 오르면 사려는 양은 줄고 내놓는 양은 늘어요. 두 직선이 만나는 곳이 균형입니다.",
    ...MK1,
    unitX: "천원",
    unitY: "개",
    box: { xMin: 0, xMax: 12, yMin: 0, yMax: 320, gx: 2, gy: 40 },
    steps: [
      {
        id: "mk1s1",
        kind: "choice",
        ask: "두 함수를 AX = B 로 옮기면 A 는 어느 것일까요?",
        options: [
          [{ tex: matTex([[20, 1], [-30, 1]]) }],
          [{ tex: matTex([[-20, 1], [30, 1]]) }],
          [{ tex: matTex([[20, 30], [1, 1]]) }],
          [{ tex: matTex([[300], [100]]) }],
        ],
        answer: 0,
        explains: [
          "",
          "y = -20x + 300 을 옮기면 20x + y = 300 이에요. 부호가 바뀌어야 해요.",
          "가로줄 하나가 한 식이어야 해요. 지금은 세로줄에 식이 들어갔어요.",
          "그것은 상수항이 모인 B 예요.",
        ],
        hint: "y = -20x + 300 에서 x 항을 왼쪽으로 옮기면 20x + y = 300 이 돼요.",
      },
      {
        id: "mk1s2",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요?",
        answer: det2(marketA(MK1)),
        hint: "20 곱하기 1 에서 1 곱하기 -30 을 빼요. 음수를 빼면 더하는 셈이에요.",
        done: "수요는 내려가고 공급은 올라가니 행렬식이 늘 양수예요. 그래서 균형점은 언제나 하나 있습니다.",
      },
      {
        id: "mk1s3",
        kind: "fill",
        ask: "균형가격과 균형거래량을 구해 보세요. (위 칸이 가격, 아래 칸이 거래량)",
        target: pointCol(MK1),
        hint: "짝 행렬을 B 에 곱하면 200 과 11000 이 나와요. 그것을 50 으로 나눠요.",
        done: "균형가격 4천원, 균형거래량 220개예요. 그래프의 교점과 같지요.",
      },
    ],
    wrap: "수요와 공급이 만나는 자리는 두 직선의 교점이고, 그것이 곧 역행렬로 푸는 연립방정식이에요.",
  },
  {
    id: "mk2",
    emoji: "🧦",
    title: "수면양말",
    lead: "겨울마다 잘 팔리는 수면양말의 균형점을 찾아봐요.",
    ...MK2,
    unitX: "천원",
    unitY: "개",
    box: { xMin: 0, xMax: 20, yMin: 0, yMax: 420, gx: 4, gy: 60 },
    steps: [
      {
        id: "mk2s1",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요?",
        answer: det2(marketA(MK2)),
        hint: "수요 기울기의 크기 15 와 공급 기울기 25 를 더하면 돼요.",
      },
      {
        id: "mk2s2",
        kind: "fill",
        ask: "분수 뒤에 곱할 짝 행렬을 채워 보세요.",
        target: adj2(marketA(MK2)),
        hint: "대각선의 15 와 1 은 자리를 바꾸고, 1 과 -25 는 부호를 바꿔요.",
      },
      {
        id: "mk2s3",
        kind: "fill",
        ask: "균형가격과 균형거래량을 구해 보세요.",
        target: pointCol(MK2),
        hint: "짝 행렬을 B 에 곱하면 320 과 11200 이 나와요. 그것을 40 으로 나눠요.",
        done: "균형가격 8천원, 균형거래량 280개예요.",
      },
    ],
    wrap: "행렬식이 클수록 두 직선이 가파르게 엇갈려 균형가격이 낮게 정해져요.",
  },
  {
    id: "mk3",
    emoji: "🎧",
    title: "무선 이어폰",
    lead: "값에 민감한 상품이에요. 수요 기울기가 가파른 경우를 봐요.",
    ...MK3,
    unitX: "천원",
    unitY: "개",
    box: { xMin: 0, xMax: 20, yMin: 0, yMax: 720, gx: 4, gy: 120 },
    steps: [
      {
        id: "mk3s1",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요?",
        answer: det2(marketA(MK3)),
        hint: "35 와 25 를 더하면 돼요.",
      },
      {
        id: "mk3s2",
        kind: "fill",
        ask: "균형가격과 균형거래량을 구해 보세요.",
        target: pointCol(MK3),
        hint: "짝 행렬을 B 에 곱하면 600 과 21600 이 나와요. 그것을 60 으로 나눠요.",
        done: "균형가격 10천원, 균형거래량 360개예요.",
      },
      {
        id: "mk3s3",
        kind: "choice",
        ask: "값이 12천원이라면 시장에서는 무슨 일이 벌어질까요?",
        options: [
          [{ pre: "사려는 양이 내놓는 양보다 많아 값이 더 오른다" }],
          [{ pre: "내놓는 양이 사려는 양보다 많아 값이 내려간다" }],
          [{ pre: "두 양이 같아 아무 일도 없다" }],
          [{ pre: "사려는 양과 내놓는 양이 모두 0 이 된다" }],
        ],
        answer: 1,
        explains: [
          "값이 오르면 사려는 양은 오히려 줄어요. 12천원에서는 290개뿐이에요.",
          "",
          "두 양이 같아지는 것은 균형가격 10천원일 때예요.",
          "12천원에서도 사려는 양 290개, 내놓는 양 410개로 둘 다 0 이 아니에요.",
        ],
        hint: "12천원을 두 식에 각각 넣어 수요와 공급을 비교해 보세요.",
        done: "남는 물건이 생기면 값이 내려가 균형가격 쪽으로 되돌아와요.",
      },
    ],
    wrap: "균형에서 벗어나면 남거나 모자라서, 값이 저절로 균형 쪽으로 움직여요.",
  },
  {
    id: "mk4",
    emoji: "🪴",
    title: "화분 세트",
    lead: "마지막이에요. 이번에는 두 직선이 완만하게 만나요.",
    ...MK4,
    unitX: "천원",
    unitY: "개",
    box: { xMin: 0, xMax: 24, yMin: 0, yMax: 540, gx: 4, gy: 90 },
    steps: [
      {
        id: "mk4s1",
        kind: "num",
        ask: "A 의 행렬식은 얼마일까요?",
        answer: det2(marketA(MK4)),
        hint: "12 와 18 을 더하면 돼요.",
      },
      {
        id: "mk4s2",
        kind: "fill",
        ask: "균형가격과 균형거래량을 구해 보세요.",
        target: pointCol(MK4),
        hint: "짝 행렬을 B 에 곱하면 330 과 11340 이 나와요. 그것을 30 으로 나눠요.",
        done: "균형가격 11천원, 균형거래량 378개예요.",
      },
      {
        id: "mk4s3",
        kind: "num",
        ask: "만약 사람들이 더 좋아하게 되어 수요함수가 y = -12x + 600 으로 바뀌면 균형가격은 얼마가 될까요?",
        answer: marketPoint({ ...MK4, dInt: 600 })[0],
        unit: "천원",
        hint: "상수항만 510 에서 600 으로 바뀌어요. 행렬식은 그대로 30 이에요.",
        done: "균형가격이 11천원에서 14천원으로 올랐어요. 인기가 오르면 값도 오릅니다.",
      },
    ],
    wrap: "A 가 그대로면 역행렬을 다시 구할 필요 없이 B 만 갈아 끼우면 돼요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 생산량 거꾸로 알아내기
// ══════════════════════════════════════════════════════════════
export type Factory = {
  id: string;
  emoji: string;
  title: string;
  lead: string;
  goods: [string, string];
  resources: [string, string];
  resUnits: [string, string];
  /** 제품 1개에 드는 자원 (행 = 자원, 열 = 제품) */
  raw: Mat;
  /** 쓴 자원 총량 */
  used: [number, number];
  /** 가로줄마다 나눈 수 */
  scale: [number, number];
  steps: Step[];
  wrap: string;
};

export const factoryA = (f: Factory): Mat => f.raw.map((row, i) => row.map((v) => v / f.scale[i]));
export const factoryB = (f: Factory): Mat => f.used.map((v, i) => [v / f.scale[i]]);
export const factoryX = (f: Factory): Mat => solveAXB(factoryA(f), factoryB(f)) as Mat;

const FT_BAKERY: Omit<Factory, "steps" | "wrap"> = {
  id: "ft1",
  emoji: "🍞",
  title: "빵집",
  lead: "어제 쓴 밀가루와 버터의 양만 적혀 있어요. 식빵과 케이크를 몇 개씩 구웠을까요?",
  goods: ["식빵", "케이크"],
  resources: ["밀가루", "버터"],
  resUnits: ["g", "g"],
  raw: [
    [300, 200],
    [20, 80],
  ],
  used: [4600, 640],
  scale: [100, 20],
};
const FT_FURN: Omit<Factory, "steps" | "wrap"> = {
  id: "ft2",
  emoji: "🪑",
  title: "가구 공방",
  lead: "창고에서 나간 목재와 나사의 수로 의자와 책상의 개수를 되짚어 봐요.",
  goods: ["의자", "책상"],
  resources: ["목재", "나사"],
  resUnits: ["장", "개"],
  raw: [
    [4, 9],
    [20, 30],
  ],
  used: [84, 300],
  scale: [1, 10],
};
const FT_DRINK: Omit<Factory, "steps" | "wrap"> = {
  id: "ft3",
  emoji: "🥤",
  title: "음료 공장",
  lead: "과즙과 설탕을 얼마나 썼는지만 알아도 병 수를 알 수 있어요.",
  goods: ["주스", "에이드"],
  resources: ["과즙", "설탕"],
  resUnits: ["mL", "g"],
  raw: [
    [200, 100],
    [10, 30],
  ],
  used: [6500, 700],
  scale: [100, 10],
};
const FT_POT: Omit<Factory, "steps" | "wrap"> = {
  id: "ft4",
  emoji: "🏺",
  title: "도자기 공방",
  lead: "흙과 유약의 사용량으로 컵과 접시의 개수를 알아내 봐요.",
  goods: ["컵", "접시"],
  resources: ["흙", "유약"],
  resUnits: ["g", "g"],
  raw: [
    [500, 600],
    [40, 50],
  ],
  used: [10800, 880],
  scale: [100, 10],
};

export const FACTORIES: Factory[] = [
  {
    ...FT_BAKERY,
    steps: [
      {
        id: "ft1s1",
        kind: "choice",
        ask: "밀가루에 대한 식은 어느 것일까요? (식빵 x개, 케이크 y개)",
        options: [
          [{ tex: "300x + 20y = 4600" }],
          [{ tex: "300x + 200y = 640" }],
          [{ tex: "300x + 200y = 4600" }],
          [{ tex: "200x + 300y = 4600" }],
        ],
        answer: 2,
        explains: [
          "20 은 식빵의 버터 양이에요. 밀가루 식에는 케이크의 밀가루 200 이 들어가요.",
          "640 은 버터를 쓴 양이에요.",
          "",
          "식빵이 300g, 케이크가 200g 이에요. 순서가 바뀌었어요.",
        ],
        hint: "표의 밀가루 가로줄을 그대로 읽으면 돼요.",
      },
      {
        id: "ft1s2",
        kind: "choice",
        ask: "계수가 크니 양변을 나누어 간단히 해요. 두 식을 각각 무엇으로 나눌까요?",
        options: [
          [{ pre: "밀가루 식은 100 으로, 버터 식은 20 으로" }],
          [{ pre: "두 식 모두 100 으로" }],
          [{ pre: "두 식 모두 20 으로" }],
          [{ pre: "밀가루 식은 20 으로, 버터 식은 100 으로" }],
        ],
        answer: 0,
        explains: [
          "",
          "버터 식을 100 으로 나누면 0.2 같은 소수가 나와요.",
          "밀가루 식을 20 으로 나누면 15 와 10 이 되어 더 줄일 수 있어요.",
          "각 식에서 가장 크게 줄일 수 있는 수가 서로 달라요.",
        ],
        hint: "가로줄마다 세 수의 공통인수를 찾아요. 밀가루 줄은 300, 200, 4600 이에요.",
        done: "밀가루 줄은 3x + 2y = 46, 버터 줄은 x + 4y = 32 가 돼요.",
      },
      {
        id: "ft1s3",
        kind: "num",
        ask: "간단히 한 A 의 행렬식은 얼마일까요?",
        answer: det2(factoryA(FT_BAKERY as Factory)),
        hint: "3 곱하기 4 에서 2 곱하기 1 을 빼요.",
      },
      {
        id: "ft1s4",
        kind: "fill",
        ask: "식빵과 케이크의 개수를 구해 보세요.",
        target: factoryX(FT_BAKERY as Factory),
        unit: "개",
        hint: "짝 행렬을 (46, 32) 에 곱하면 120 과 50 이 나와요. 그것을 10 으로 나눠요.",
        done: "식빵 12개, 케이크 5개예요. 밀가루 3600 + 1000 = 4600g 이 맞지요.",
      },
    ],
    wrap: "만든 개수를 몰라도 쓴 자원만 알면 역행렬이 거꾸로 알려 줘요.",
  },
  {
    ...FT_FURN,
    steps: [
      {
        id: "ft2s1",
        kind: "num",
        ask: "나사 식 20x + 30y = 300 을 10 으로 나눈 뒤, A 의 행렬식을 구해 보세요.",
        answer: det2(factoryA(FT_FURN as Factory)),
        hint: "A 는 ((4, 9), (2, 3)) 이에요. 4 곱하기 3 에서 9 곱하기 2 를 빼요.",
        done: "행렬식이 음수예요. 0 만 아니면 되니 걱정하지 않아도 돼요.",
      },
      {
        id: "ft2s2",
        kind: "fill",
        ask: "분수 뒤에 곱할 짝 행렬을 채워 보세요.",
        target: adj2(factoryA(FT_FURN as Factory)),
        hint: "4 와 3 은 자리를 바꾸고, 9 와 2 는 부호를 바꿔요.",
      },
      {
        id: "ft2s3",
        kind: "fill",
        ask: "의자와 책상의 개수를 구해 보세요.",
        target: factoryX(FT_FURN as Factory),
        unit: "개",
        hint: "짝 행렬을 (84, 30) 에 곱하면 -18 과 -48 이 나와요. 그것을 -6 으로 나눠요.",
        done: "의자 3개, 책상 8개예요. 목재 12 + 72 = 84장이 맞지요.",
      },
    ],
    wrap: "행렬식이 음수여도 나누는 방법은 똑같아요. 부호만 조심하면 됩니다.",
  },
  {
    ...FT_DRINK,
    steps: [
      {
        id: "ft3s1",
        kind: "choice",
        ask: "과즙 식과 설탕 식을 간단히 하면 어떻게 될까요?",
        options: [
          [{ tex: "\\begin{cases} 2x + y = 65 \\\\ x + 3y = 70 \\end{cases}" }],
          [{ tex: "\\begin{cases} 2x + y = 6500 \\\\ x + 3y = 700 \\end{cases}" }],
          [{ tex: "\\begin{cases} 2x + y = 70 \\\\ x + 3y = 65 \\end{cases}" }],
          [{ tex: "\\begin{cases} x + 2y = 65 \\\\ 3x + y = 70 \\end{cases}" }],
        ],
        answer: 0,
        explains: [
          "",
          "오른쪽도 함께 나눠야 해요. 6500 을 100 으로 나누면 65 예요.",
          "과즙 식의 오른쪽은 65, 설탕 식의 오른쪽은 70 이에요. 서로 바뀌었어요.",
          "주스가 과즙 200mL, 에이드가 100mL 이니 2x + y 예요. 순서가 바뀌었어요.",
        ],
        hint: "과즙 줄은 100 으로, 설탕 줄은 10 으로 나눠요.",
      },
      {
        id: "ft3s2",
        kind: "num",
        ask: "간단히 한 A 의 행렬식은 얼마일까요?",
        answer: det2(factoryA(FT_DRINK as Factory)),
        hint: "2 곱하기 3 에서 1 곱하기 1 을 빼요.",
      },
      {
        id: "ft3s3",
        kind: "fill",
        ask: "주스와 에이드의 병 수를 구해 보세요.",
        target: factoryX(FT_DRINK as Factory),
        unit: "병",
        hint: "짝 행렬을 (65, 70) 에 곱하면 125 와 75 가 나와요. 그것을 5 로 나눠요.",
        done: "주스 25병, 에이드 15병이에요.",
      },
    ],
    wrap: "단위가 제각각이어도 가로줄마다 알맞은 수로 나누면 깔끔해져요.",
  },
  {
    ...FT_POT,
    steps: [
      {
        id: "ft4s1",
        kind: "num",
        ask: "흙 줄은 100 으로, 유약 줄은 10 으로 나눈 뒤 행렬식을 구해 보세요.",
        answer: det2(factoryA(FT_POT as Factory)),
        hint: "A 는 ((5, 6), (4, 5)) 예요. 5 곱하기 5 에서 6 곱하기 4 를 빼요.",
        done: "행렬식이 1 이라 역행렬의 성분이 모두 정수로 떨어져요.",
      },
      {
        id: "ft4s2",
        kind: "fill",
        ask: "A 의 역행렬을 채워 보세요.",
        target: inv2(factoryA(FT_POT as Factory)) as Mat,
        hint: "행렬식이 1 이니 짝 행렬이 곧 역행렬이에요.",
      },
      {
        id: "ft4s3",
        kind: "fill",
        ask: "컵과 접시의 개수를 구해 보세요.",
        target: factoryX(FT_POT as Factory),
        unit: "개",
        hint: "역행렬을 (108, 88) 에 곱하면 돼요. 나누는 일이 없어요.",
        done: "컵 12개, 접시 8개예요. 흙 6000 + 4800 = 10,800g 이 맞지요.",
      },
    ],
    wrap: "행렬식이 1 이면 나누는 단계가 사라져 계산이 가장 편해요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ③ 사용자 수 예측
// ══════════════════════════════════════════════════════════════
export type Forecast = {
  id: string;
  emoji: string;
  title: string;
  lead: string;
  names: [string, string];
  /** 전이행렬 — 행이 올해, 열이 내년 */
  A: Mat;
  start: [number, number];
  unit: string;
  steps: Step[];
  wrap: string;
};

/** 올해 사용자 수(가로행렬)에 전이행렬을 n번 곱한다 */
export function afterYears(start: [number, number], A: Mat, n: number): [number, number] {
  const B = mulM([[start[0], start[1]]], powM(A, n));
  return [B[0][0], B[0][1]];
}
/** 오래 지났을 때 굳는 비율 — a : b = q : (1-p) */
export function steadyState(start: [number, number], A: Mat): [number, number] {
  const total = start[0] + start[1];
  const stay = A[0][0];
  const come = A[1][0];
  const denom = come + (1 - stay);
  if (Math.abs(denom) < 1e-12) return start;
  const a = tidy((total * come) / denom);
  return [a, tidy(total - a)];
}

export const SIM_KEEP = { min: 0.1, max: 0.9, step: 0.1 };
export const FC_SIM_START = { keepA: 0.8, keepB: 0.7, userA: 500, userB: 300 };
export const FC_USER_RANGE = { min: 100, max: 900, step: 50 };

const FC1_A: Mat = [
  [0.8, 0.2],
  [0.3, 0.7],
];
const FC2_A: Mat = [
  [0.9, 0.1],
  [0.4, 0.6],
];
const FC1_START: [number, number] = [500, 300];
const FC2_START: [number, number] = [600, 400];
const yearRow = (start: [number, number], A: Mat, n: number): Mat => {
  const p = afterYears(start, A, n);
  return [[p[0], p[1]]];
};

export const FORECASTS: Forecast[] = [
  {
    id: "fc1",
    emoji: "🛵",
    title: "배달앱 두 곳",
    lead: "해마다 얼마쯤은 다른 앱으로 갈아타요. 그 비율을 행렬로 적어 두면 내년을 예측할 수 있어요.",
    names: ["빠름배달", "든든배달"],
    A: FC1_A,
    start: FC1_START,
    unit: "명",
    steps: [
      {
        id: "fc1s1",
        kind: "choice",
        ask: "전이행렬의 (1, 2) 성분 0.2 는 무슨 뜻일까요?",
        options: [
          [{ pre: "빠름배달을 쓰던 사람이 내년에도 빠름배달을 쓸 확률" }],
          [{ pre: "든든배달을 쓰던 사람이 내년에 빠름배달로 갈아탈 확률" }],
          [{ pre: "빠름배달을 쓰던 사람이 내년에 든든배달로 갈아탈 확률" }],
          [{ pre: "내년에 빠름배달을 쓰는 사람의 비율" }],
        ],
        answer: 2,
        explains: [
          "그것은 (1, 1) 성분 0.8 이에요.",
          "그것은 (2, 1) 성분 0.3 이에요.",
          "",
          "전이행렬은 사람 수가 아니라 옮겨 가는 비율만 담아요.",
        ],
        hint: "가로줄은 올해 무엇을 썼는지, 세로줄은 내년에 무엇을 쓸지를 나타내요.",
        done: "가로줄의 합이 1 이 되는 까닭도 여기에 있어요. 쓰던 사람은 남거나 갈아타거나 둘 중 하나니까요.",
      },
      {
        id: "fc1s2",
        kind: "fill",
        ask: "내년의 사용자 수를 구해 보세요. (왼쪽이 빠름배달, 오른쪽이 든든배달)",
        target: yearRow(FC1_START, FC1_A, 1),
        unit: "명",
        hint: "왼쪽 칸은 500 곱하기 0.8 에 300 곱하기 0.3 을 더한 값이에요.",
        done: "빠름배달이 10명 줄고 든든배달이 10명 늘었어요. 전체 800명은 그대로예요.",
      },
      {
        id: "fc1s3",
        kind: "fill",
        ask: "내후년의 사용자 수를 구해 보세요. 방금 구한 값에 다시 곱하면 돼요.",
        target: yearRow(FC1_START, FC1_A, 2),
        unit: "명",
        hint: "(490, 310) 에 전이행렬을 한 번 더 곱해요.",
        done: "BA² 를 구한 셈이에요. 몇 년 뒤든 그만큼 곱하면 됩니다.",
      },
      {
        id: "fc1s4",
        kind: "fill",
        ask: "아주 오랜 시간이 지나면 사용자 수는 어떤 값으로 굳을까요?",
        target: [[steadyState(FC1_START, FC1_A)[0], steadyState(FC1_START, FC1_A)[1]]],
        unit: "명",
        hint: "빠져나가는 사람과 들어오는 사람이 같아지면 멈춰요. 0.2 대 0.3 의 반대 비인 3 : 2 로 나눠 보세요.",
        done: "480명과 320명에서 더 움직이지 않아요. 두 앱의 뺏고 뺏기는 힘이 같아진 자리예요.",
      },
    ],
    wrap: "전이행렬을 거듭 곱하면 몇 해 뒤든 예측할 수 있고, 오래 지나면 한 값으로 굳어요.",
  },
  {
    id: "fc2",
    emoji: "🎵",
    title: "음원앱 두 곳",
    lead: "이번에는 한쪽이 훨씬 잘 붙잡아요. 결과가 어떻게 달라지는지 봐요.",
    names: ["멜로디", "사운드"],
    A: FC2_A,
    start: FC2_START,
    unit: "명",
    steps: [
      {
        id: "fc2s1",
        kind: "fill",
        ask: "내년의 사용자 수를 구해 보세요.",
        target: yearRow(FC2_START, FC2_A, 1),
        unit: "명",
        hint: "왼쪽 칸은 600 곱하기 0.9 에 400 곱하기 0.4 를 더한 값이에요.",
      },
      {
        id: "fc2s2",
        kind: "fill",
        ask: "3년 뒤의 사용자 수를 구해 보세요. 전이행렬을 세 번 곱하는 셈이에요.",
        target: yearRow(FC2_START, FC2_A, 3),
        unit: "명",
        hint: "1년 뒤 (700, 300) → 2년 뒤 (750, 250) → 한 번 더 곱해요.",
        done: "해가 갈수록 멜로디가 늘지만 늘어나는 폭은 점점 줄어들어요.",
      },
      {
        id: "fc2s3",
        kind: "fill",
        ask: "오랜 시간이 지나면 어떤 값으로 굳을까요?",
        target: [[steadyState(FC2_START, FC2_A)[0], steadyState(FC2_START, FC2_A)[1]]],
        unit: "명",
        hint: "0.1 대 0.4 의 반대 비인 4 : 1 로 1000명을 나눠 보세요.",
        done: "800명과 200명이에요. 사운드가 사라지지는 않고 일정한 몫을 지켜요.",
      },
      {
        id: "fc2s4",
        kind: "choice",
        ask: "굳는 값은 처음 사용자 수에 따라 달라질까요?",
        options: [
          [{ pre: "달라진다. 처음 많은 쪽이 끝까지 많다" }],
          [{ pre: "전체 인원이 같다면 처음이 어떻든 같은 값으로 굳는다" }],
          [{ pre: "달라진다. 처음 적은 쪽이 결국 커진다" }],
          [{ pre: "굳지 않고 끝없이 오르내린다" }],
        ],
        answer: 1,
        explains: [
          "처음 (100, 900) 에서 시작해도 결국 (800, 200) 으로 갑니다.",
          "",
          "처음이 어떻든 같은 자리로 모여요.",
          "옮겨 가는 비율이 고정되어 있으면 한 값으로 모여요.",
        ],
        hint: "시뮬레이션에서 시작 인원만 바꾸고 여러 해를 보내 보세요.",
        done: "굳는 자리는 전이행렬이 정하고 처음 값은 가는 길만 바꿔요.",
      },
    ],
    wrap: "붙잡는 힘이 셀수록 더 큰 몫을 가져가지만, 끌어오는 힘이 있는 한 한쪽이 다 가져가지는 않아요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 사회 연결망
// ══════════════════════════════════════════════════════════════
export const NET_PEOPLE = ["하준", "서연", "도윤", "지우", "은채"];
export const NET_N = NET_PEOPLE.length;

/** 꼭짓점을 원 위에 놓는다 (그림에서 쓰는 자리) */
export const NET_POS: [number, number][] = [
  [0, -1],
  [0.951, -0.309],
  [0.588, 0.809],
  [-0.588, 0.809],
  [-0.951, -0.309],
];

export type Edge = [number, number];
export const edgeKey = (a: number, b: number): string => (a < b ? `${a}-${b}` : `${b}-${a}`);

export function adjOf(n: number, edges: Edge[]): Mat {
  const A = fillM(n, n, 0);
  for (const [i, j] of edges) {
    A[i][j] = 1;
    A[j][i] = 1;
  }
  return A;
}
export function degreesOf(A: Mat): number[] {
  return A.map((row) => row.reduce((a, b) => a + b, 0));
}
/** 두 다리 안에 서로 닿는지 (자기 자신은 빼고 본다) */
export function allWithinTwo(A: Mat): boolean {
  const n = A.length;
  const A2 = mulM(A, A);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (A[i][j] === 0 && A2[i][j] === 0) return false;
    }
  return true;
}
/** 모두 하나로 이어져 있는지 */
export function isConnected(A: Mat): boolean {
  const n = A.length;
  const seen = [0];
  for (let t = 0; t < n; t++)
    for (const i of [...seen])
      for (let j = 0; j < n; j++) if (A[i][j] === 1 && !seen.includes(j)) seen.push(j);
  return seen.length === n;
}

/** 조작판의 시작 — 넷이 한 줄로 이어지고 한 명은 혼자 */
export const NET_START: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
];
/** 문제용 연결망 — 친구 수 1 · 4 · 3 · 3 · 3 */
export const NET_FIXED: Edge[] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 3],
  [2, 4],
  [3, 4],
];
export const FIXED_A = adjOf(NET_N, NET_FIXED);
export const FIXED_A2 = mulM(FIXED_A, FIXED_A);
export const FIXED_DEG = degreesOf(FIXED_A);

export type NetMission = { id: string; emoji: string; goal: string; hint: string; test: (edges: Edge[]) => boolean };
export const NET_MISSIONS: NetMission[] = [
  {
    id: "nm1",
    emoji: "🤝",
    goal: "혼자인 사람이 없게 만들기 (모두 친구가 1명 이상)",
    hint: "친구 수 막대가 0 인 사람을 찾아 선을 이어 주세요.",
    test: (e) => degreesOf(adjOf(NET_N, e)).every((d) => d >= 1),
  },
  {
    id: "nm2",
    emoji: "🌳",
    goal: "선을 딱 4개만 써서 다섯 명을 모두 잇기",
    hint: "다섯 명을 하나로 잇는 데 필요한 가장 적은 선의 수가 4개예요. 한 줄로 늘어놓아도 되고 별 모양이어도 돼요.",
    test: (e) => e.length === 4 && isConnected(adjOf(NET_N, e)),
  },
  {
    id: "nm3",
    emoji: "📣",
    goal: "누구든 두 다리 안에 서로 닿게 만들기",
    hint: "한 사람을 모두와 잇는 것이 가장 쉬운 방법이에요. 그러면 그 사람을 거쳐 두 다리면 닿아요.",
    test: (e) => allWithinTwo(adjOf(NET_N, e)),
  },
  {
    id: "nm4",
    emoji: "👑",
    goal: "친구가 가장 많은 사람이 딱 한 명이 되게 만들기",
    hint: "친구 수 막대에서 1등이 둘 이상이면 안 돼요. 한 사람에게만 선을 더 이어 주세요.",
    test: (e) => {
      const d = degreesOf(adjOf(NET_N, e));
      const top = Math.max(...d);
      return top > 0 && d.filter((v) => v === top).length === 1;
    },
  },
];
export function netMissionDone(ms: NetMission, edges: Edge[]): boolean {
  return ms.test(edges);
}

export const NET_STEPS: Step[] = [
  {
    id: "nt1",
    kind: "choice",
    ask: "각자의 친구 수를 한 번에 구하려면 어떻게 할까요?",
    options: [
      [{ pre: "인접행렬의 대각선을 읽는다" }],
      [{ pre: "인접행렬에 성분이 모두 1 인 열행렬을 곱한다" }],
      [{ pre: "인접행렬의 역행렬을 구한다" }],
      [{ pre: "인접행렬을 두 번 곱한다" }],
    ],
    answer: 1,
    explains: [
      "대각선은 모두 0 이에요. 자기 자신과는 친구로 세지 않으니까요.",
      "",
      "역행렬은 친구 수와 상관이 없어요.",
      "두 번 곱하면 두 다리 건너 이어지는 길의 수가 나와요.",
    ],
    hint: "가로줄의 합을 구하는 방법을 떠올려 보세요.",
    done: "가로줄 하나를 더하면 그 사람이 1 을 적어 둔 사람의 수, 곧 친구 수예요.",
  },
  {
    id: "nt2",
    kind: "fill",
    ask: "다섯 사람의 친구 수를 구해 보세요. (위에서부터 하준·서연·도윤·지우·은채)",
    target: FIXED_DEG.map((d) => [d]),
    unit: "명",
    hint: "인접행렬의 가로줄마다 1 의 개수를 세면 돼요.",
    done: "서연이 4명으로 가장 많아요.",
  },
  {
    id: "nt3",
    kind: "choice",
    ask: "이 모임에서 소식을 퍼뜨리기에 가장 좋은 사람은 누구일까요?",
    options: [[{ pre: "하준" }], [{ pre: "도윤" }], [{ pre: "은채" }], [{ pre: "서연" }]],
    answer: 3,
    explains: [
      "친구가 서연 한 명뿐이에요.",
      "친구가 3명이라 서연보다 적어요.",
      "친구가 3명이라 서연보다 적어요.",
      "",
    ],
    hint: "친구 수가 가장 많은 사람을 고르면 돼요.",
  },
  {
    id: "nt4",
    kind: "num",
    ask: "인접행렬을 두 번 곱한 행렬에서 하준과 은채가 만나는 자리의 값은 얼마일까요?",
    answer: FIXED_A2[0][4],
    hint: "하준에서 은채까지 두 다리로 가는 길이 몇 가지인지 세어 보세요.",
    done: "하준 — 서연 — 은채 한 가지뿐이라 1 이에요. 서연이 없으면 하준은 아무에게도 닿지 못해요.",
  },
  {
    id: "nt5",
    kind: "choice",
    ask: "두 번 곱한 행렬의 대각선에는 무엇이 나타날까요?",
    options: [
      [{ pre: "모두 0 이 된다" }],
      [{ pre: "모두 1 이 된다" }],
      [{ pre: "전체 사람 수와 같다" }],
      [{ pre: "그 사람의 친구 수와 같다" }],
    ],
    answer: 3,
    explains: [
      "친구에게 갔다가 되돌아오는 길이 있으니 0 이 아니에요.",
      "친구가 여럿이면 되돌아오는 길도 여럿이에요.",
      "친구가 아닌 사람을 거쳐서는 올 수 없어요.",
      "",
    ],
    hint: "자기 자신에게 두 다리로 돌아오려면 친구를 한 명 거쳤다가 되돌아와야 해요.",
    done: "친구 한 명마다 갔다 오는 길이 하나씩 있으니 친구 수와 같아집니다.",
  },
];

export const REAL_NOTE =
  "이 활동에 나오는 값·인원·사용량은 계산이 깔끔하게 떨어지도록 이 활동을 위해 정한 가상의 값이다.";
