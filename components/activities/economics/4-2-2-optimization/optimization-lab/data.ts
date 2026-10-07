// 경제 현상의 최적화 — 활동 데이터
//
// ─── 다루는 개념 ───────────────────────────────────────────
//  최적화(optimization) = 한정된 자원 안에서 효용·생산·이윤 등은 최대화하고
//  비용·손실 등은 최소화하는 의사 결정.
//
//  (1) 미분가능한 함수 f 의 닫힌구간 [a, b] 위에서의 최댓값 찾기 — 다섯 걸음
//        ① 도함수 f'(x) 를 구한다.
//        ② f'(x) = 0 인 x 의 값을 구한다.
//        ③ 범위 안에서 증가·감소와 양 끝의 함숫값을 표로 적고 극값을 구한다.
//        ④ y = f(x) 의 그래프의 개형을 그린다.
//        ⑤ 양 끝의 함숫값과 극댓값을 견주어 최댓값을 고른다.
//      ⑤ 가 이 활동의 핵심이다. 최댓값의 후보는 '극댓값인 자리' 와 '양 끝' 뿐이고,
//      그 안쪽의 다른 점은 올라가거나 내려가는 중이라 가장 높을 수 없다.
//      그래서 범위가 달라지면 같은 함수라도 답이 달라진다 — 탭 ① 의 손잡이가 이것이다.
//
//  (2) 효용함수를 이용한 소비자의 의사 결정
//      소비량 x 에 대한 효용 U(x) 가 최대가 되는 x 가 최적소비량이고, 거기서 U'(x) = 0 이다.
//      U'(x) 는 한계효용 — 한 단위 더 소비할 때 만족이 변하는 정도.
//          U'(x) > 0  한 개 더가 이득   ·   U'(x) < 0  한 개 더는 손해
//
//  (3) 생산함수를 이용한 생산자의 의사 결정
//      노동량 x 에 대한 생산량 P(x) 가 최대가 되는 x 가 최적노동량이고, 거기서 P'(x) = 0 이다.
//      P'(x) 는 한계생산량. 최적노동량을 넘기면 한 명 더 넣을수록 생산이 오히려 줄어든다.
//
//  (4) 이윤함수를 이용한 기업의 의사 결정
//          h(x) = (총수입) - (총비용) = p x - g(x)
//      가 최대가 되는 x 가 최적생산량. h(x) = 0 인 자리는 손익분기점이다.
//
//  (5) 기업의 이윤과 한계비용 (교과서 198p)
//          h(x) = p x - g(x)   ⇒   h'(x) = p - g'(x)
//      이므로 h'(x) = 0 은 곧  g'(x) = p — 한계비용이 가격과 같아지는 자리다.
//      그림으로는 총비용 곡선의 접선이 총수입 직선 y = p x 와 나란해지는 자리이고,
//      그때 두 선의 세로 간격(= 이윤)이 가장 크다.
//      가격 p 를 올리면 그 자리가 오른쪽으로 옮겨가므로, 짝 (x*, p) 를 모으면
//      그것이 바로 한계비용곡선이고 동시에 공급곡선이다. (4-2-1 탄력성 단원과 이어진다.)
//
// ─── 쓴 함수 (수업 자료·앞 활동과 겹치지 않게 새로 골랐다) ──────
//  수업 자료의  -x^3 + 9x^2 (우유) ·  -x^3 + 3x^2 (식혜) ·  -x^3 + 18x^2 (노동량) ·
//  -x^3 + 18x^2 - 33x + 50 (이윤) 은 쓰지 않았고, 상수만 바꾼 -x^3 + ax^2 꼴도 피했다.
//  같은 단원 앞 활동(extremum_lab · graph_shape_lab · marginal_lab)의 함수도 모두 피했다.
//  (검증 스크립트가 그 활동들의 data.ts 를 직접 불러 함수값 지문으로 겹침을 확인한다.)
//
//  탭 ① 최댓값 사냥 — 범위의 오른쪽 끝 b 를 손잡이로 움직인다
//      🏔️ 쌍봉산   f = x^3 - 9x^2 + 15x + 50   f' = 3(x - 1)(x - 5)
//          극대 (1, 57) · 극소 (5, 25) · f(0) = 50
//          f(b) = 57 을 풀면  b^3 - 9b^2 + 15b - 7 = (b - 1)^2 (b - 7) = 0  →  b = 7
//          검산 f(7) = 343 - 441 + 105 + 50 = 57   f(2) = 52   f(9) = 185
//          b < 7 극대가 최대(57) · b = 7 두 자리가 모두 최대 · b > 7 오른쪽 끝이 최대
//      ⛰️ 외봉산   f = -x^3 + 3x^2 + 24x + 10  f' = -3(x - 4)(x + 2)
//          극대 (4, 90) · f(0) = 10 · f(1) = 36 · f(6) = 46
//          f(b) = 90 은  (b - 4)^2 (b + 5) = 0  이라 b = 4 뿐 — 끝이 극대를 넘어서는 일이 없다.
//          b < 4 오른쪽 끝이 최대 · b >= 4 극대(90)가 최대
//      📈 민둥산   f = x^3 + 3x + 10           f' = 3x^2 + 3 > 0
//          f'(x) = 0 인 자리가 아예 없다 → 늘 증가 → 오른쪽 끝이 늘 최대
//          검산 f(1) = 14 · f(3) = 46 · f(5) = 150
//
//  탭 ② 소비자의 선택 — 효용함수 U(x), 최적소비량은 U'(x) = 0 인 자리
//      🍿 팝콘 한 줌   U = -x^3 + 6x^2 + 15x   U' = -3(x - 5)(x + 1)   최적 5, 최대 100
//          U(0..7) = 0 20 46 72 92 100 90 56
//      🚲 자전거 10분  U = -x^3 + 3x^2 + 45x   U' = -3(x - 5)(x + 3)   최적 5, 최대 175
//          U(0..8) = 0 47 94 135 164 175 162 119 40
//      🧁 컵케이크 개  U = -2x^3 + 9x^2 + 24x  U' = -6(x - 4)(x + 1)   최적 4, 최대 112
//          U(0..6) = 0 31 68 99 112 95 36
//      🍫 초콜릿 조각  U = -2x^3 + 15x^2 + 36x U' = -6(x - 6)(x + 1)   최적 6, 최대 324
//          U(0..8) = 0 49 116 189 256 305 324 301 224
//
//  탭 ③ 생산자의 선택 — 생산함수 P(x), 최적노동량은 P'(x) = 0 인 자리
//      🥖 베이커리 제빵사  P = -x^3 + 9x^2 + 48x   P' = -3(x - 8)(x + 2)   최적 8, 최대 448
//          P(0..12) = 0 56 124 198 272 340 396 434 448 432 380 286 144
//      🍓 딸기 농장 일손   P = -x^3 + 6x^2 + 63x   P' = -3(x - 7)(x + 3)   최적 7, 최대 392
//          P(0..11) = 0 68 142 216 284 340 378 392 376 324 230 88
//      🚚 택배 분류장 작업자 P = -x^3 + 3x^2 + 72x  P' = -3(x - 6)(x + 4)   최적 6, 최대 324
//          P(0..10) = 0 74 148 216 272 310 324 308 256 162 20
//      🧵 의류 공방 재봉사  P = -2x^3 + 3x^2 + 72x P' = -6(x - 4)(x + 3)   최적 4, 최대 208
//          P(0..6) = 0 73 140 189 208 185 108
//
//  탭 ④ 기업의 선택 — 이윤 h(x) = p x - g(x)
//      비용함수는 h 를 먼저 정한 뒤  g(x) = p x - h(x)  로 거꾸로 만들었다.
//      그래서 g 는 모두 증가함수(g' > 0)이고 g(0) > 0 (고정비)이며,
//      최적생산량에서 g'(x*) = p 가 정확히 성립한다 — 탭 ⑤ 와 바로 이어진다.
//      🍪 쿠키 공방 (상자)  p = 40
//          g = x^3 - 6x^2 + 25x + 20   g' = 3(x - 2)^2 + 13 > 0   고정비 20
//          h = -x^3 + 6x^2 + 15x - 20  h' = -3(x - 5)(x + 1)      최적 5, 최대이윤 80
//          h(0..7) = -20 0 26 52 72 80 70 36        손익분기 x = 1
//          g(0..7) = 20 40 54 68 88 120 170 244     g'(5) = 75 - 60 + 25 = 40 = p
//      🕯️ 향초 공방 (개)   p = 50
//          g = x^3 - 9x^2 + 29x + 29   g' = 3(x - 3)^2 + 2 > 0    고정비 29
//          h = -x^3 + 9x^2 + 21x - 29  h' = -3(x - 7)(x + 1)      최적 7, 최대이윤 216
//          h(1) = 0 손익분기 · h(10) = 81 · g'(7) = 147 - 126 + 29 = 50 = p
//      🪴 화분 공방 (개)   p = 35
//          g = x^3 - 3x^2 + 11x + 26   g' = 3(x - 1)^2 + 8 > 0    고정비 26
//          h = -x^3 + 3x^2 + 24x - 26  h' = -3(x - 4)(x + 2)      최적 4, 최대이윤 54
//          h(1) = 0 손익분기 · h(6) = 10 · g'(4) = 48 - 24 + 11 = 35 = p
//
//  탭 ⑤ 한계비용 = 가격 — 가격 p 를 손잡이로 움직인다
//      비용함수를 이차로 두어 한계비용 g' 가 직선이 되게 했다.
//      그래야 g'(x) = p 의 해가 p 에 대해 일차식이 되어 짝 (x*, p) 가 직선 위에 또렷이 모인다.
//          g = a x^2 + b x + c  →  g' = 2a x + b  →  x* = (p - b) / (2a)
//          최대이윤  h(x*) = p x* - g(x*) = (p - b)^2 / (4a) - c
//      🍞 식빵 공장 (묶음)  g = x^2 + 10x + 16   g' = 2x + 10   x* = (p - 10)/2
//          최대이윤 (p - 10)^2/4 - 16 → 0 이 되는 가격 p = 18
//          검산 p = 20 → x* = 5,  100 - (25 + 50 + 16) = 9 = 100/4 - 16
//               p = 30 → x* = 10, 300 - (100 + 100 + 16) = 84 = 400/4 - 16
//               p = 18 → x* = 4,  72 - (16 + 40 + 16) = 0
//      🧃 주스 공장 (상자)  g = 2x^2 + 6x + 32   g' = 4x + 6    x* = (p - 6)/4
//          최대이윤 (p - 6)^2/8 - 32 → 0 이 되는 가격 p = 22
//          검산 p = 22 → x* = 4,  88 - (32 + 24 + 32) = 0
//               p = 30 → x* = 6,  180 - (72 + 36 + 32) = 40 = 576/8 - 32
//               p = 50 → x* = 11, 550 - (242 + 66 + 32) = 210 = 1936/8 - 32
//      🧊 얼음 공장 (포대)  g = 3x^2 + 12x + 27  g' = 6x + 12   x* = (p - 12)/6
//          최대이윤 (p - 12)^2/12 - 27 → 0 이 되는 가격 p = 30
//          검산 p = 30 → x* = 3,  90 - (27 + 36 + 27) = 0
//               p = 48 → x* = 6,  288 - (108 + 72 + 27) = 81 = 1296/12 - 27
//               p = 72 → x* = 10, 720 - (300 + 120 + 27) = 273 = 3600/12 - 27
//      손잡이 눈금을 2a 의 배수로 잡아 x* 가 늘 정수로 떨어지게 했다.
//
//  이 활동에 나오는 효용·생산량·금액은 모두 개념을 보여 주기 위해 정한 가상의 값이다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  const r = Number(v.toFixed(d));
  return String(Object.is(r, -0) ? 0 : r);
}

export function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}

export type Piece = { pre?: string; tex?: string; post?: string };
export type Box = { xMin: number; xMax: number; yMin: number; yMax: number; gx: number; gy: number };

export function samplePath(
  fn: (x: number) => number,
  from: number,
  to: number,
  box: Box,
  n = 240,
): [number, number][][] {
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
//  탭 ① 최댓값 사냥
// ══════════════════════════════════════════════════════════════
export type Mountain = {
  id: string;
  emoji: string;
  title: string;
  tex: string;
  dtex: string;
  f: (x: number) => number;
  d1: (x: number) => number;
  bMin: number;
  bMax: number;
  b0: number;
  bStep: number;
  box: Box;
  /** 정의역 안의 극대점 x — 없으면 null */
  peakX: number | null;
  /** 정의역 안의 극소점 x — 없으면 null */
  lowX: number | null;
  /** 극댓값과 오른쪽 끝의 함숫값이 꼭 같아지는 b — 없으면 null */
  tieB: number | null;
  note: string;
};

export const MOUNTAINS: Mountain[] = [
  {
    id: "m1",
    emoji: "🏔️",
    title: "쌍봉산",
    tex: "f(x) = x^3 - 9x^2 + 15x + 50",
    dtex: "f'(x) = 3(x - 1)(x - 5)",
    f: (x) => x * x * x - 9 * x * x + 15 * x + 50,
    d1: (x) => 3 * (x - 1) * (x - 5),
    bMin: 2,
    bMax: 9,
    b0: 4,
    bStep: 0.5,
    box: { xMin: 0, xMax: 9.5, yMin: 0, yMax: 200, gx: 1, gy: 50 },
    peakX: 1,
    lowX: 5,
    tieB: 7,
    note: "봉우리는 1 에, 골짜기는 5 에 있어요. b 를 7 보다 크게 하면 오른쪽 끝이 봉우리를 넘어서요.",
  },
  {
    id: "m2",
    emoji: "⛰️",
    title: "외봉산",
    tex: "f(x) = -x^3 + 3x^2 + 24x + 10",
    dtex: "f'(x) = -3(x - 4)(x + 2)",
    f: (x) => -x * x * x + 3 * x * x + 24 * x + 10,
    d1: (x) => -3 * (x - 4) * (x + 2),
    bMin: 1,
    bMax: 6,
    b0: 2,
    bStep: 0.5,
    box: { xMin: 0, xMax: 6.5, yMin: 0, yMax: 100, gx: 1, gy: 20 },
    peakX: 4,
    lowX: null,
    tieB: null,
    note: "봉우리가 하나뿐이에요. b 가 4 보다 작으면 봉우리에 닿지도 못해 오른쪽 끝이 가장 높지요.",
  },
  {
    id: "m3",
    emoji: "📈",
    title: "민둥산",
    tex: "f(x) = x^3 + 3x + 10",
    dtex: "f'(x) = 3x^2 + 3",
    f: (x) => x * x * x + 3 * x + 10,
    d1: (x) => 3 * x * x + 3,
    bMin: 1,
    bMax: 5,
    b0: 3,
    bStep: 0.5,
    box: { xMin: 0, xMax: 5.5, yMin: 0, yMax: 160, gx: 1, gy: 20 },
    peakX: null,
    lowX: null,
    tieB: null,
    note: "f'(x) = 3x² + 3 은 늘 양수라 평평한 자리가 아예 없어요. 쉬지 않고 오르니 오른쪽 끝이 늘 가장 높아요.",
  },
];

export const MOUNT_GOALS = [
  "오른쪽 끝이 가장 높은 자리 만들기",
  "봉우리(극대)가 가장 높은 자리 만들기",
  "쌍봉산에서 봉우리와 오른쪽 끝의 높이가 같아지는 b 맞히기",
  "f'(x) = 0 인 자리가 하나도 없는 산 찾아보기",
];

export const MOUNT_STEPS: Step[] = [
  {
    id: "mo1",
    kind: "choice",
    ask: "닫힌구간에서 미분가능한 함수의 최댓값이 될 수 있는 자리는 어디일까요?",
    options: [
      [{ pre: "극댓값인 자리뿐이다" }],
      [{ pre: "양 끝뿐이다" }],
      [{ pre: "극댓값인 자리 아니면 양 끝이다" }],
      [{ pre: "어디든 될 수 있어 모든 점을 따져야 한다" }],
    ],
    answer: 2,
    explains: [
      "끝이 더 높을 수 있어요. 쌍봉산에서 b 를 7 보다 크게 해 보세요.",
      "봉우리가 더 높을 수도 있어요. 쌍봉산에서 b 를 7 보다 작게 해 보세요.",
      "",
      "그렇게까지 하지 않아도 돼요. 안쪽의 다른 점은 오르거나 내리는 중이라 가장 높을 수 없어요.",
    ],
    hint: "f'(x) ≠ 0 인 안쪽의 점에서는 바로 옆에 더 높은 자리가 늘 있어요.",
    done: "그래서 (극댓값)과 (양 끝의 함숫값)만 견주면 최댓값이 나와요.",
  },
  {
    id: "mo2",
    kind: "num",
    ask: "쌍봉산 f(x) = x³ - 9x² + 15x + 50 의 극댓값은 얼마일까요?",
    answer: 57,
    hint: "f'(x) = 3(x - 1)(x - 5) 예요. 왼쪽 자리의 함숫값을 구해 보세요.",
    done: "x = 1 에서 f(1) = 1 - 9 + 15 + 50 = 57 이에요.",
  },
  {
    id: "mo3",
    kind: "num",
    ask: "쌍봉산에서 오른쪽 끝의 함숫값이 극댓값과 꼭 같아지는 b 는 얼마일까요?",
    answer: 7,
    hint: "f(b) = 57 을 정리하면 (b - 1)²(b - 7) = 0 이 돼요.",
    done: "b = 7 이에요. f(7) = 343 - 441 + 105 + 50 = 57 로 극댓값과 같고, 이보다 커지면 끝이 이겨요.",
  },
];

export const MOUNT_FINALE =
  "최댓값은 극댓값 아니면 양 끝의 함숫값이에요. 함수가 같아도 범위가 달라지면 답이 달라지지요.";

// ══════════════════════════════════════════════════════════════
//  탭 ② 소비자의 선택 — 효용함수
// ══════════════════════════════════════════════════════════════
export type Util = {
  id: string;
  emoji: string;
  title: string;
  /** 소비 단위 (한글) */
  unit: string;
  /** 넘쳤을 때 띄우는 이모지 */
  tooMuch: string;
  tex: string;
  dtex: string;
  U: (x: number) => number;
  U1: (x: number) => number;
  xMax: number;
  best: number;
  bestU: number;
  box: Box;
  note: string;
};

export const UTILS: Util[] = [
  {
    id: "u1",
    emoji: "🍿",
    title: "영화관 팝콘",
    unit: "줌",
    tooMuch: "🥴",
    tex: "U(x) = -x^3 + 6x^2 + 15x",
    dtex: "U'(x) = -3(x - 5)(x + 1)",
    U: (x) => -x * x * x + 6 * x * x + 15 * x,
    U1: (x) => -3 * (x - 5) * (x + 1),
    xMax: 7,
    best: 5,
    bestU: 100,
    box: { xMin: 0, xMax: 7.3, yMin: 0, yMax: 110, gx: 1, gy: 20 },
    note: "다섯 줌까지는 한 줌 더가 즐겁지만, 여섯 줌째부터는 목이 메어 오히려 만족이 줄어요.",
  },
  {
    id: "u2",
    emoji: "🚲",
    title: "자전거 타기",
    unit: "× 10분",
    tooMuch: "😮‍💨",
    tex: "U(x) = -x^3 + 3x^2 + 45x",
    dtex: "U'(x) = -3(x - 5)(x + 3)",
    U: (x) => -x * x * x + 3 * x * x + 45 * x,
    U1: (x) => -3 * (x - 5) * (x + 3),
    xMax: 8,
    best: 5,
    bestU: 175,
    box: { xMin: 0, xMax: 8.3, yMin: 0, yMax: 190, gx: 1, gy: 50 },
    note: "50 분까지는 상쾌하지만 그 뒤로는 다리가 아파 와요. 더 타는 것이 늘 더 좋지는 않지요.",
  },
  {
    id: "u3",
    emoji: "🧁",
    title: "컵케이크",
    unit: "개",
    tooMuch: "🤢",
    tex: "U(x) = -2x^3 + 9x^2 + 24x",
    dtex: "U'(x) = -6(x - 4)(x + 1)",
    U: (x) => -2 * x * x * x + 9 * x * x + 24 * x,
    U1: (x) => -6 * (x - 4) * (x + 1),
    xMax: 6,
    best: 4,
    bestU: 112,
    box: { xMin: 0, xMax: 6.3, yMin: 0, yMax: 120, gx: 1, gy: 20 },
    note: "네 개째가 가장 좋은 자리예요. 다섯 개째부터는 달아서 만족이 깎여요.",
  },
  {
    id: "u4",
    emoji: "🍫",
    title: "초콜릿",
    unit: "조각",
    tooMuch: "😵",
    tex: "U(x) = -2x^3 + 15x^2 + 36x",
    dtex: "U'(x) = -6(x - 6)(x + 1)",
    U: (x) => -2 * x * x * x + 15 * x * x + 36 * x,
    U1: (x) => -6 * (x - 6) * (x + 1),
    xMax: 8,
    best: 6,
    bestU: 324,
    box: { xMin: 0, xMax: 8.3, yMin: 0, yMax: 340, gx: 1, gy: 50 },
    note: "여섯 조각까지는 한 조각 더가 달콤해요. 일곱 조각째의 한계효용은 음수가 되지요.",
  },
];

export const UTIL_GOALS = [
  "🍿 팝콘의 최적소비량에 서 보기",
  "🚲 자전거의 최적소비량에 서 보기",
  "🧁 컵케이크의 최적소비량에 서 보기",
  "🍫 초콜릿의 최적소비량에 서 보기",
];

export const UTIL_STEPS: Step[] = [
  {
    id: "ut1",
    kind: "choice",
    ask: "한계효용 U'(x) 가 양수라는 것은 무슨 뜻일까요?",
    options: [
      [{ pre: "한 단위 더 소비하면 만족이 더 커진다" }],
      [{ pre: "지금까지 받은 만족이 아주 크다" }],
      [{ pre: "한 단위 더 소비하면 만족이 줄어든다" }],
      [{ pre: "지금이 바로 최적소비량이다" }],
    ],
    answer: 0,
    explains: [
      "",
      "지금까지의 만족은 U(x) 예요. U'(x) 는 '한 단위 더' 일 때의 변화를 재지요.",
      "그것은 U'(x) 가 음수일 때예요.",
      "최적소비량에서는 U'(x) = 0 이에요.",
    ],
    hint: "U'(x) 는 x 가 한 단위 늘 때 U 가 변하는 정도예요.",
    done: "그래서 U'(x) > 0 인 동안은 계속 더 소비하는 것이 이득이에요.",
  },
  {
    id: "ut2",
    kind: "num",
    ask: "팝콘 U(x) = -x³ + 6x² + 15x 의 최적소비량은 몇 줌일까요?",
    answer: 5,
    unit: "줌",
    hint: "U'(x) = -3x² + 12x + 15 = -3(x - 5)(x + 1) 을 0 으로 놓아 보세요.",
    done: "x = 5 에서 U' 가 양에서 음으로 바뀌어요. 다섯 줌이 최적소비량이지요.",
  },
  {
    id: "ut3",
    kind: "num",
    ask: "그때 효용함수의 최댓값은 얼마일까요?",
    answer: 100,
    hint: "U(5) = -125 + 150 + 75 를 셈해 보세요.",
    done: "100 이에요. 양 끝의 U(0) = 0, U(7) = 56 보다 크니 이것이 최댓값이에요.",
  },
];

export const UTIL_FINALE =
  "최적소비량은 한계효용이 0 이 되는 자리예요. 거기까지는 한 단위 더가 이득이고, 넘어가면 손해지요.";

// ══════════════════════════════════════════════════════════════
//  탭 ③ 생산자의 선택 — 생산함수
// ══════════════════════════════════════════════════════════════
export type Prod = {
  id: string;
  emoji: string;
  title: string;
  /** 일손을 부르는 말 */
  worker: string;
  /** 생산물의 단위 */
  unit: string;
  tex: string;
  dtex: string;
  P: (x: number) => number;
  P1: (x: number) => number;
  xMax: number;
  best: number;
  bestP: number;
  box: Box;
  note: string;
};

export const PRODS: Prod[] = [
  {
    id: "p1",
    emoji: "🥖",
    title: "동네 베이커리",
    worker: "제빵사",
    unit: "개",
    tex: "P(x) = -x^3 + 9x^2 + 48x",
    dtex: "P'(x) = -3(x - 8)(x + 2)",
    P: (x) => -x * x * x + 9 * x * x + 48 * x,
    P1: (x) => -3 * (x - 8) * (x + 2),
    xMax: 12,
    best: 8,
    bestP: 448,
    box: { xMin: 0, xMax: 12.4, yMin: 0, yMax: 470, gx: 2, gy: 100 },
    note: "여덟 명까지는 오븐과 반죽대가 쉬지 않아요. 아홉 명째부터는 주방이 비좁아 서로 부딪혀요.",
  },
  {
    id: "p2",
    emoji: "🍓",
    title: "딸기 농장",
    worker: "일손",
    unit: "상자",
    tex: "P(x) = -x^3 + 6x^2 + 63x",
    dtex: "P'(x) = -3(x - 7)(x + 3)",
    P: (x) => -x * x * x + 6 * x * x + 63 * x,
    P1: (x) => -3 * (x - 7) * (x + 3),
    xMax: 11,
    best: 7,
    bestP: 392,
    box: { xMin: 0, xMax: 11.4, yMin: 0, yMax: 410, gx: 2, gy: 100 },
    note: "이랑 수가 정해져 있어요. 일곱 명을 넘기면 서로의 자리를 밟아 수확이 줄어들어요.",
  },
  {
    id: "p3",
    emoji: "🚚",
    title: "택배 분류장",
    worker: "작업자",
    unit: "상자",
    tex: "P(x) = -x^3 + 3x^2 + 72x",
    dtex: "P'(x) = -3(x - 6)(x + 4)",
    P: (x) => -x * x * x + 3 * x * x + 72 * x,
    P1: (x) => -3 * (x - 6) * (x + 4),
    xMax: 10,
    best: 6,
    bestP: 324,
    box: { xMin: 0, xMax: 10.4, yMin: 0, yMax: 340, gx: 2, gy: 50 },
    note: "컨베이어가 한 줄뿐이에요. 여섯 명이 지나면 벨트 앞에서 기다리는 사람이 생겨요.",
  },
  {
    id: "p4",
    emoji: "🧵",
    title: "의류 공방",
    worker: "재봉사",
    unit: "벌",
    tex: "P(x) = -2x^3 + 3x^2 + 72x",
    dtex: "P'(x) = -6(x - 4)(x + 3)",
    P: (x) => -2 * x * x * x + 3 * x * x + 72 * x,
    P1: (x) => -6 * (x - 4) * (x + 3),
    xMax: 6,
    best: 4,
    bestP: 208,
    box: { xMin: 0, xMax: 6.3, yMin: 0, yMax: 220, gx: 1, gy: 50 },
    note: "재봉틀이 네 대예요. 다섯 명째부터는 차례를 기다리느라 전체 생산이 오히려 줄어요.",
  },
];

export const PROD_GOALS = [
  "🥖 베이커리의 최적노동량 찾기",
  "🍓 딸기 농장의 최적노동량 찾기",
  "🚚 택배 분류장의 최적노동량 찾기",
  "🧵 의류 공방의 최적노동량 찾기",
];

export const PROD_STEPS: Step[] = [
  {
    id: "pr1",
    kind: "choice",
    ask: "최적노동량보다 일손을 더 늘리면 생산량은 어떻게 될까요?",
    options: [
      [{ pre: "그대로 머문다" }],
      [{ pre: "계속 늘어난다" }],
      [{ pre: "늘지도 줄지도 않고 들쭉날쭉해진다" }],
      [{ pre: "오히려 줄어든다" }],
    ],
    answer: 3,
    explains: [
      "P'(x) 가 음수가 되므로 머물지 않고 내려가요.",
      "그러면 최대가 아니지요. 최적노동량은 더 늘려도 좋아지지 않는 자리예요.",
      "생산함수는 이어진 곡선이라 들쭉날쭉하지 않아요.",
      "",
    ],
    hint: "최적노동량을 지나면 P'(x) 의 부호가 어떻게 바뀌나요?",
    done: "P'(x) < 0 이 되어 한 명 더 넣을수록 생산이 줄어요.",
  },
  {
    id: "pr2",
    kind: "num",
    ask: "베이커리 P(x) = -x³ + 9x² + 48x 의 최적노동량은 몇 명일까요?",
    answer: 8,
    unit: "명",
    hint: "P'(x) = -3x² + 18x + 48 = -3(x - 8)(x + 2) 를 0 으로 놓아 보세요.",
    done: "여덟 명이에요. 그 앞뒤로 P' 의 부호가 양에서 음으로 바뀌지요.",
  },
  {
    id: "pr3",
    kind: "num",
    ask: "그때 하루 생산량은 몇 개일까요?",
    answer: 448,
    unit: "개",
    hint: "P(8) = -512 + 576 + 384 를 셈해 보세요.",
    done: "448 개예요. 아홉 명으로 늘리면 432 개로 오히려 16 개가 줄어요.",
  },
];

export const PROD_FINALE =
  "최적노동량은 한계생산량이 0 이 되는 자리예요. 사람을 더 넣는 것이 늘 이득은 아니지요.";

// ══════════════════════════════════════════════════════════════
//  탭 ④ 기업의 선택 — 이윤함수
// ══════════════════════════════════════════════════════════════
export type Firm = {
  id: string;
  emoji: string;
  title: string;
  unit: string;
  /** 시장 가격 */
  p: number;
  ftex: string;
  gtex: string;
  htex: string;
  dhtex: string;
  g: (x: number) => number;
  h: (x: number) => number;
  xMax: number;
  best: number;
  bestH: number;
  /** 이윤이 0 이 되는 생산량 */
  breakEven: number;
  fixed: number;
  /** 총수입·총비용을 함께 그리는 창 */
  boxRC: Box;
  /** 이윤함수를 그리는 창 */
  boxH: Box;
  note: string;
};

export const FIRMS: Firm[] = [
  {
    id: "f1",
    emoji: "🍪",
    title: "쿠키 공방",
    unit: "상자",
    p: 40,
    ftex: "f(x) = 40x",
    gtex: "g(x) = x^3 - 6x^2 + 25x + 20",
    htex: "h(x) = -x^3 + 6x^2 + 15x - 20",
    dhtex: "h'(x) = -3(x - 5)(x + 1)",
    g: (x) => x * x * x - 6 * x * x + 25 * x + 20,
    h: (x) => -x * x * x + 6 * x * x + 15 * x - 20,
    xMax: 7,
    best: 5,
    bestH: 80,
    breakEven: 1,
    fixed: 20,
    boxRC: { xMin: 0, xMax: 7.3, yMin: 0, yMax: 290, gx: 1, gy: 50 },
    boxH: { xMin: 0, xMax: 7.3, yMin: -40, yMax: 90, gx: 1, gy: 20 },
    note: "다섯 상자를 넘기면 야근 수당이 붙어 비용 곡선이 가파르게 서요. 그래서 이윤이 다시 줄어요.",
  },
  {
    id: "f2",
    emoji: "🕯️",
    title: "향초 공방",
    unit: "개",
    p: 50,
    ftex: "f(x) = 50x",
    gtex: "g(x) = x^3 - 9x^2 + 29x + 29",
    htex: "h(x) = -x^3 + 9x^2 + 21x - 29",
    dhtex: "h'(x) = -3(x - 7)(x + 1)",
    g: (x) => x * x * x - 9 * x * x + 29 * x + 29,
    h: (x) => -x * x * x + 9 * x * x + 21 * x - 29,
    xMax: 10,
    best: 7,
    bestH: 216,
    breakEven: 1,
    fixed: 29,
    boxRC: { xMin: 0, xMax: 10.4, yMin: 0, yMax: 520, gx: 2, gy: 100 },
    boxH: { xMin: 0, xMax: 10.4, yMin: -40, yMax: 230, gx: 2, gy: 50 },
    note: "일곱 개까지는 한 개 더 만드는 비용이 값 50 보다 쌌어요. 여덟 개째부터는 그 비용이 값을 넘어서요.",
  },
  {
    id: "f3",
    emoji: "🪴",
    title: "화분 공방",
    unit: "개",
    p: 35,
    ftex: "f(x) = 35x",
    gtex: "g(x) = x^3 - 3x^2 + 11x + 26",
    htex: "h(x) = -x^3 + 3x^2 + 24x - 26",
    dhtex: "h'(x) = -3(x - 4)(x + 2)",
    g: (x) => x * x * x - 3 * x * x + 11 * x + 26,
    h: (x) => -x * x * x + 3 * x * x + 24 * x - 26,
    xMax: 6,
    best: 4,
    bestH: 54,
    breakEven: 1,
    fixed: 26,
    boxRC: { xMin: 0, xMax: 6.3, yMin: 0, yMax: 220, gx: 1, gy: 50 },
    boxH: { xMin: 0, xMax: 6.3, yMin: -40, yMax: 70, gx: 1, gy: 20 },
    note: "흙과 가마를 미리 사 두어 고정비가 26 이에요. 한 개도 못 팔면 그만큼이 그대로 적자지요.",
  },
];

export const FIRM_GOALS = [
  "적자가 나는 생산량에 서 보기",
  "이윤이 꼭 0 이 되는 손익분기점 찾기",
  "이윤이 가장 큰 생산량 찾기",
  "세 공방 모두에서 최적생산량 찾기",
];

export const FIRM_STEPS: Step[] = [
  {
    id: "fi1",
    kind: "choice",
    ask: "이윤함수 h(x) 는 어떻게 만들까요?",
    options: [
      [{ pre: "(총수입) + (총비용)" }],
      [{ pre: "(총수입) - (총비용)" }],
      [{ pre: "(총비용) - (총수입)" }],
      [{ pre: "(총수입) ÷ (총비용)" }],
    ],
    answer: 1,
    explains: [
      "번 돈에 쓴 돈을 더하면 이윤이 될 수 없어요.",
      "",
      "부호가 거꾸로예요. 그러면 흑자일 때 음수가 나와요.",
      "이윤은 '남은 금액' 이라 나누기가 아니라 빼기예요.",
    ],
    hint: "총수입은 (가격) × (생산량) 이고, 거기서 들인 돈을 덜어 낸 것이 이윤이에요.",
    done: "h(x) = p x - g(x) 예요. 쿠키 공방은 h(x) = 40x - (x³ - 6x² + 25x + 20) 이지요.",
  },
  {
    id: "fi2",
    kind: "num",
    ask: "쿠키 공방(가격 40)에서 다섯 상자를 만들면 이윤은 얼마일까요?",
    answer: 80,
    hint: "총수입 40 × 5 = 200 에서 총비용 g(5) = 125 - 150 + 125 + 20 을 빼 보세요.",
    done: "200 - 120 = 80 이에요. 이것이 쿠키 공방이 올릴 수 있는 가장 큰 이윤이지요.",
  },
  {
    id: "fi3",
    kind: "num",
    ask: "쿠키 공방에서 이윤이 꼭 0 이 되는 생산량(손익분기점)은 몇 상자일까요?",
    answer: 1,
    unit: "상자",
    hint: "h(x) = -x³ + 6x² + 15x - 20 에 작은 수부터 넣어 보세요.",
    done: "한 상자예요. h(1) = -1 + 6 + 15 - 20 = 0 — 번 돈과 쓴 돈이 꼭 같아지는 자리지요.",
  },
];

export const FIRM_FINALE =
  "최적생산량은 이윤함수의 도함수가 0 이 되는 자리예요. 많이 만들수록 이윤이 느는 것은 아니지요.";

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ 한계비용 = 가격
// ══════════════════════════════════════════════════════════════
export type CostCase = {
  id: string;
  emoji: string;
  title: string;
  unit: string;
  gtex: string;
  dgtex: string;
  g: (x: number) => number;
  g1: (x: number) => number;
  /** g'(x) = p 를 푼 최적생산량 */
  best: (p: number) => number;
  pMin: number;
  pMax: number;
  pStep: number;
  p0: number;
  xMax: number;
  /** 가장 큰 이윤이 꼭 0 이 되는 가격 */
  zeroP: number;
  boxRC: Box;
  boxMC: Box;
  note: string;
};

export const COSTS: CostCase[] = [
  {
    id: "c1",
    emoji: "🍞",
    title: "식빵 공장",
    unit: "묶음",
    gtex: "g(x) = x^2 + 10x + 16",
    dgtex: "g'(x) = 2x + 10",
    g: (x) => x * x + 10 * x + 16,
    g1: (x) => 2 * x + 10,
    best: (p) => (p - 10) / 2,
    pMin: 12,
    pMax: 36,
    pStep: 2,
    p0: 20,
    xMax: 14,
    zeroP: 18,
    boxRC: { xMin: 0, xMax: 14.4, yMin: 0, yMax: 520, gx: 2, gy: 100 },
    boxMC: { xMin: 0, xMax: 14.4, yMin: 0, yMax: 40, gx: 2, gy: 10 },
    note: "한계비용이 2x + 10 이라 가격을 2 올릴 때마다 최적생산량이 꼭 한 묶음씩 늘어요.",
  },
  {
    id: "c2",
    emoji: "🧃",
    title: "주스 공장",
    unit: "상자",
    gtex: "g(x) = 2x^2 + 6x + 32",
    dgtex: "g'(x) = 4x + 6",
    g: (x) => 2 * x * x + 6 * x + 32,
    g1: (x) => 4 * x + 6,
    best: (p) => (p - 6) / 4,
    pMin: 10,
    pMax: 50,
    pStep: 4,
    p0: 22,
    xMax: 12,
    zeroP: 22,
    boxRC: { xMin: 0, xMax: 12.4, yMin: 0, yMax: 620, gx: 2, gy: 100 },
    boxMC: { xMin: 0, xMax: 12.4, yMin: 0, yMax: 60, gx: 2, gy: 10 },
    note: "한계비용이 더 가파르게 올라요. 그래서 같은 값에서도 식빵 공장보다 적게 만드는 것이 낫지요.",
  },
  {
    id: "c3",
    emoji: "🧊",
    title: "얼음 공장",
    unit: "포대",
    gtex: "g(x) = 3x^2 + 12x + 27",
    dgtex: "g'(x) = 6x + 12",
    g: (x) => 3 * x * x + 12 * x + 27,
    g1: (x) => 6 * x + 12,
    best: (p) => (p - 12) / 6,
    pMin: 18,
    pMax: 72,
    pStep: 6,
    p0: 30,
    xMax: 11,
    zeroP: 30,
    boxRC: { xMin: 0, xMax: 11.4, yMin: 0, yMax: 820, gx: 2, gy: 200 },
    boxMC: { xMin: 0, xMax: 11.4, yMin: 0, yMax: 80, gx: 2, gy: 20 },
    note: "값이 12 보다 낮으면 한 포대도 만들지 않는 것이 나아요. 한계비용의 가장 낮은 값이 12 이니까요.",
  },
];

export const MC_GOALS = [
  "가격을 올려 최적생산량을 늘려 보기",
  "가장 큰 이윤이 꼭 0 이 되는 가격 맞히기",
  "가격과 최적생산량의 짝을 다섯 개 모으기",
  "세 공장 모두에서 손잡이를 움직여 보기",
];

export const MC_STEPS: Step[] = [
  {
    id: "mc1",
    kind: "choice",
    ask: "이윤 h(x) = px - g(x) 가 가장 클 때 성립하는 식은 무엇일까요?",
    options: [
      [{ tex: "g'(x) = 0" }],
      [{ tex: "g(x) = px" }],
      [{ tex: "g'(x) = p" }],
      [{ tex: "g'(x) = x" }],
    ],
    answer: 2,
    explains: [
      "그것은 총비용이 가장 작아지는 조건인데, 비용은 많이 만들수록 늘기만 해요.",
      "그것은 번 돈과 쓴 돈이 같아지는 손익분기 조건이에요.",
      "",
      "한계비용과 생산량은 서로 견줄 수 있는 양이 아니에요.",
    ],
    hint: "h'(x) = p - g'(x) 를 0 으로 놓아 보세요.",
    done: "한계비용이 가격과 같아지는 자리까지 만들면 이윤이 가장 커요.",
  },
  {
    id: "mc2",
    kind: "num",
    ask: "식빵 공장 g(x) = x² + 10x + 16 에서 가격이 30 일 때 최적생산량은 몇 묶음일까요?",
    answer: 10,
    unit: "묶음",
    hint: "g'(x) = 2x + 10 을 30 과 같다고 놓아 보세요.",
    done: "열 묶음이에요. 이때 이윤은 300 - (100 + 100 + 16) = 84 지요.",
  },
  {
    id: "mc3",
    kind: "num",
    ask: "식빵 공장에서 가장 큰 이윤이 꼭 0 이 되는 가격은 얼마일까요?",
    answer: 18,
    hint: "가장 큰 이윤은 (p - 10)²/4 - 16 이에요.",
    done: "p = 18 이에요. 값이 이보다 낮으면 생산량을 아무리 잘 맞춰도 적자를 벗어날 수 없어요.",
  },
];

export const MC_FINALE =
  "값이 오르면 한계비용이 값과 같아지는 자리도 오른쪽으로 옮겨가요. 그 짝을 이으면 바로 공급곡선이지요.";

export const REAL_NOTE =
  "이 활동에 나오는 효용함수 · 생산함수 · 비용함수와 금액은 개념을 보여 주기 위해 정한 가상의 값이다.";
