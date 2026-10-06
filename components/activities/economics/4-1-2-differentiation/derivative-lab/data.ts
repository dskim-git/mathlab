// 평균변화율에서 도함수까지 — 활동 데이터
//
//  · x 의 값이 a 에서 b 까지 변할 때
//        x 의 증분  Δx = b - a,   y 의 증분  Δy = f(b) - f(a) = f(a + Δx) - f(a)
//        평균변화율 Δy/Δx = (f(b) - f(a))/(b - a) = (f(a + Δx) - f(a))/Δx
//    이는 두 점 A(a, f(a)), B(b, f(b)) 를 지나는 직선 AB 의 기울기와 같은 식이다.
//
//  · Δx → 0 일 때 평균변화율이 다가가는 값이 미분계수(순간변화율)이고
//        f'(a) = lim_{Δx→0} (f(a + Δx) - f(a))/Δx
//    이것은 점 (a, f(a)) 에서의 접선의 기울기다. Δx 를 아예 0 으로 둘 수는 없다
//    (분모가 0 이 된다) — 가까이 보낼 뿐이라는 점이 앞 단원의 극한과 그대로 이어진다.
//
//  · 정의역의 모든 x 에 f'(x) 를 대응시킨 새 함수가 도함수다.
//        f'(x) = lim_{Δx→0} (f(x + Δx) - f(x))/Δx
//    미분계수 f'(a) 는 도함수 f'(x) 에 x = a 를 넣은 함숫값이다.
//
//  · 다항함수의 미분법
//        (x^n)' = n x^(n-1)  (n 은 2 이상의 정수),  (x)' = 1,  (c)' = 0
//        (cf)' = cf',  (f ± g)' = f' ± g'
//    그래서 n 차 다항함수의 도함수는 (n-1) 차 다항함수가 된다 — 탭 ③ 의 결론이다.
//
// ── 탭 ① 증분과 평균변화율 ────────────────────────────────
//  · 네 함수에서 a 와 b 를 손잡이로 잡고 Δx·Δy 직각삼각형과 직선 AB 를 본다.
//        f(x) = 2x - 1          평균변화율 2            (a, b 와 상관없이 일정)
//        f(x) = -x^2 + 2x + 3   평균변화율 -(a + b) + 2
//        f(x) = x^3 - 3x        평균변화율 a^2 + ab + b^2 - 3
//        f(x) = 3               평균변화율 0            (Δy 가 늘 0)
//    위 세 식은 모두 (f(b) - f(a))/(b - a) 를 인수분해해서 얻었다.
//        b^2 - a^2 = (b - a)(b + a),  b^3 - a^3 = (b - a)(b^2 + ab + a^2)
//  · 단계 문제의 값
//        -x^2 + 2x + 3 에서 0 → 2 : f(0) = 3, f(2) = 3 이라 Δy = 0, 평균변화율 0
//        x^3 - 3x 에서 -1 → 1    : f(-1) = 2, f(1) = -2 이라 Δy = -4, Δx = 2 → -2
//
// ── 탭 ② 할선에서 접선으로 ────────────────────────────────
//  · Δx 를 1 → 0.5 → 0.2 → 0.1 → 0.05 → 0.02 → 0.01 → 0.001 로 좁히며 할선을 잔상으로 남긴다.
//    오른쪽(+Δx)과 왼쪽(-Δx) 의 할선 기울기가 양쪽에서 같은 값으로 모인다.
//        f(x) = x^2 - 4x + 5   오른쪽 2a + h - 4       왼쪽 2a - h - 4      f'(a) = 2a - 4
//        f(x) = x^3 - 3x       3a^2 + 3ah + h^2 - 3   3a^2 - 3ah + h^2 - 3  f'(a) = 3a^2 - 3
//        f(x) = -0.5x^2 + 3x   -a - h/2 + 3           -a + h/2 + 3          f'(a) = -a + 3
//        f(x) = 2x + 1         2                      2                     f'(a) = 2
//    일차함수는 Δx 가 무엇이든 할선이 곧 자기 자신이라 처음부터 접선과 겹친다.
//    좌우의 할선 기울기는 이차함수에서만 f'(a) 를 사이에 두고 대칭이고(오차 ±h),
//    삼차함수에서는 오른쪽 오차 3ah + h^2, 왼쪽 오차 -3ah + h^2 로 크기가 다르다.
//  · 손잡이가 멈추는 모든 자리에서 점 Q(a ± 1) 까지 창 안에 들어오도록 상자를 넓히고
//    a 의 범위를 정했다 (x^2 - 4x + 5 는 a ∈ [0.5, 3.5], x^3 - 3x 는 a ∈ [-1, 1]).
//
// ── 탭 ③ 미분계수 모으기 ──────────────────────────────────
//  · 접점을 끌고 다니며 (a, f'(a)) 를 아래 평면에 찍어 모으면 도함수의 그래프가 된다.
//        x^3 - 3x   →  3x^2 - 3    삼차 → 이차
//        x^2 - 4x + 5 →  2x - 4    이차 → 일차
//        2x - 1     →  2           일차 → 상수
//        3          →  0           상수 → 0
//    차수가 하나씩 내려가는 것이 눈에 보이도록 네 함수를 이 순서로 골랐다.
//  · 단계 문제의 값: f(x) = x^3 - 3x 에서 f'(2) = 3·4 - 3 = 9,
//    접선이 수평이 되는 자리는 3x^2 - 3 = 0 → x = ±1 두 군데.
//
// ── 탭 ④ 미분 공식 ────────────────────────────────────────
//  · (x^n)' = n x^(n-1) 을 n = 1~5 로 하나씩 밝힌다.
//        (x)' = 1, (x^2)' = 2x, (x^3)' = 3x^2, (x^4)' = 4x^3, (x^5)' = 5x^4
//  · 이어 f(x) = p x^3 + q x^2 + r x + s 의 네 계수를 손잡이로 잡고
//        f'(x) = 3p x^2 + 2q x + r
//    항 카드를 하나씩 짝지어 보여 준다. 상수항 s 는 어떤 값이어도 0 으로 사라진다.
//  · 단계 문제의 값
//        (x^5)' = 5x^4
//        f(x) = 4x^3 - 2x^2 + 7   → f'(x) = 12x^2 - 4x,  f'(1) = 12 - 4 = 8
//        f(x) = -5 (상수)          → f'(x) = 0
//        f(x) = x^4 - 2x^3 + 5x   → f'(x) = 4x^3 - 6x^2 + 5,  f'(1) = 4 - 6 + 5 = 3
//        f(x) = 3x^2 - 12x + 7    → f'(x) = 6x - 12 = 0 → x = 2
//
// ── 탭 ⑤ 경제 속 순간변화율 ───────────────────────────────
//  · 네 장면 모두 다항함수이고 도함수가 그 상황에서 무엇을 뜻하는지 읽는다.
//        쿠키 공방 비용   C(x) = x^2 + 20x + 300 (천원)   C'(x) = 2x + 20
//            C'(10) = 40,  실제 C(11) - C(10) = 641 - 600 = 41
//            → 한계비용은 '한 개 더' 의 비용에 아주 가깝다 (Δx = 1 이 0 이 아니라 1 만큼 차이)
//        광고비와 매출    R(x) = -2x^2 + 120x (만원)      R'(x) = -4x + 120
//            R'(30) = 0 에서 매출이 가장 크고 R(30) = 1800, 그 뒤로는 R' 이 음수
//        구독자 수        N(t) = t^3 - 12t^2 + 60t (명)   N'(t) = 3t^2 - 24t + 60
//            N' 의 최솟값은 t = 4 에서 12 로 늘 양수 → 계속 늘지만 느려졌다 다시 빨라진다
//        중고차 값        V(t) = 10t^2 - 300t + 2000 (만원) V'(t) = 20t - 300
//            V'(0) = -300, V'(5) = -200, V'(8) = -140 → 줄곧 떨어지되 속도는 느려진다
//    네 장면 모두 x 가 음수인 자리는 뜻이 없으므로 곡선을 정의역 안에서만 그린다
//    (R(-1) = -122, N(-0.3) = -19.1 처럼 상자 아래로 떨어지는 자리가 생기기 때문이다).
//    금액·인원은 모두 계산이 깔끔하게 떨어지도록 이 활동에서 정한 가상의 값이다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  const r = Number(v.toFixed(d));
  return String(Object.is(r, -0) ? 0 : r);
}
export function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}
export type Piece = { pre?: string; tex?: string; post?: string };

// ══════════════════════════════════════════════════════════════
//  좌표평면
// ══════════════════════════════════════════════════════════════
export type Box = { xMin: number; xMax: number; yMin: number; yMax: number; gx: number; gy: number };

/** 그래프를 상자 안에서만 샘플링해 끊긴 조각들로 돌려준다 */
export function samplePath(fn: (x: number) => number, box: Box, n = 180): [number, number][][] {
  const out: [number, number][][] = [];
  let cur: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = box.xMin + ((box.xMax - box.xMin) * i) / n;
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

const NICE = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
/** 세로 범위를 함수에 맞춰 잡고 눈금 간격도 보기 좋은 수로 고른다 */
export function autoBox(fn: (x: number) => number, xMin: number, xMax: number, gx: number): Box {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= 120; i++) {
    const y = fn(xMin + ((xMax - xMin) * i) / 120);
    if (!Number.isFinite(y)) continue;
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = -1;
    hi = 1;
  }
  if (hi - lo < 1e-9) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * 0.18;
  const yMin = lo - pad;
  const yMax = hi + pad;
  const want = (yMax - yMin) / 5;
  let gy = NICE[NICE.length - 1];
  for (const v of NICE) {
    if (v >= want) {
      gy = v;
      break;
    }
  }
  return { xMin, xMax, yMin, yMax, gx, gy };
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
//  탭 ① 증분과 평균변화율
// ══════════════════════════════════════════════════════════════
export type AvgFn = {
  id: string;
  emoji: string;
  title: string;
  tex: string;
  fn: (x: number) => number;
  /** 손잡이가 움직이는 범위 */
  knobMin: number;
  knobMax: number;
  knobStep: number;
  a0: number;
  b0: number;
  box: Box;
  /** 평균변화율을 a, b 로 정리한 식 */
  rateTex: string;
  note: string;
};

export const AVG_FNS: AvgFn[] = [
  {
    id: "v1",
    emoji: "📏",
    title: "일차함수",
    tex: "f(x) = 2x - 1",
    fn: (x) => 2 * x - 1,
    knobMin: -2,
    knobMax: 3,
    knobStep: 0.5,
    a0: -1,
    b0: 2,
    box: { xMin: -2.4, xMax: 3.4, yMin: -6, yMax: 6, gx: 1, gy: 2 },
    rateTex: "\\dfrac{\\Delta y}{\\Delta x} = 2",
    note: "a 와 b 를 아무리 바꿔도 2 예요. 직선은 어디를 잘라 보아도 기울기가 같으니까요.",
  },
  {
    id: "v2",
    emoji: "🌉",
    title: "이차함수",
    tex: "f(x) = -x^2 + 2x + 3",
    fn: (x) => -x * x + 2 * x + 3,
    knobMin: -2,
    knobMax: 3,
    knobStep: 0.5,
    a0: 0,
    b0: 2.5,
    box: { xMin: -2.4, xMax: 3.4, yMin: -8, yMax: 5, gx: 1, gy: 2 },
    rateTex: "\\dfrac{\\Delta y}{\\Delta x} = -(a + b) + 2",
    note: "같은 함수인데도 어느 구간을 잡느냐에 따라 평균변화율이 양수도 음수도 0 도 돼요.",
  },
  {
    id: "v3",
    emoji: "🎢",
    title: "삼차함수",
    tex: "f(x) = x^3 - 3x",
    fn: (x) => x * x * x - 3 * x,
    knobMin: -2,
    knobMax: 2,
    knobStep: 0.5,
    a0: -1.5,
    b0: 0.5,
    box: { xMin: -2.3, xMax: 2.3, yMin: -6, yMax: 6, gx: 1, gy: 2 },
    rateTex: "\\dfrac{\\Delta y}{\\Delta x} = a^2 + ab + b^2 - 3",
    note: "오르락내리락하는 그래프라도 평균변화율은 양 끝 두 점만 보고 정해져요.",
  },
  {
    id: "v4",
    emoji: "➖",
    title: "상수함수",
    tex: "f(x) = 3",
    fn: () => 3,
    knobMin: -2,
    knobMax: 3,
    knobStep: 0.5,
    a0: -1,
    b0: 2,
    box: { xMin: -2.4, xMax: 3.4, yMin: -2, yMax: 6, gx: 1, gy: 2 },
    rateTex: "\\dfrac{\\Delta y}{\\Delta x} = 0",
    note: "y 가 아예 변하지 않으니 Δy 가 늘 0 이에요. 변화가 없으면 변화율도 0 입니다.",
  },
];

export const AVG_STEPS: Step[] = [
  {
    id: "as1",
    kind: "choice",
    ask: "일차함수 f(x) = 2x - 1 에서는 a 와 b 를 어떻게 바꾸어도 평균변화율이 늘 2 였어요. 왜 그럴까요?",
    options: [
      [{ pre: "그래프가 직선이라 어느 두 점을 지나는 직선도 그 직선 자신이기 때문" }],
      [{ pre: "Δx 와 Δy 가 늘 같은 값이기 때문" }],
      [{ pre: "Δy 가 어떤 구간에서도 늘 2 이기 때문" }],
      [{ pre: "손잡이가 0.5 씩만 움직이기 때문" }],
    ],
    answer: 0,
    explains: [
      "",
      "Δy 는 Δx 의 2배라서 둘이 같지는 않아요. 둘의 비가 늘 2 인 것이지요.",
      "Δx 가 2 이면 Δy 는 4 예요. Δy 자체는 구간에 따라 달라집니다.",
      "손잡이를 더 잘게 움직여도 결과는 같아요. 직선이라는 점이 까닭이에요.",
    ],
    hint: "직선 위의 두 점을 이으면 그 직선과 겹쳐요. 그 기울기는 어디서나 같지요.",
    done: "평균변화율은 직선 AB 의 기울기예요. 직선 함수에서는 AB 가 늘 자기 자신이고요.",
  },
  {
    id: "as2",
    kind: "num",
    ask: "f(x) = -x² + 2x + 3 에서 x 의 값이 0 에서 2 까지 변할 때의 평균변화율을 구해 보세요.",
    answer: 0,
    hint: "f(0) 과 f(2) 를 각각 구해 Δy 부터 알아보세요.",
    done: "f(0) 과 f(2) 가 똑같이 3 이라 Δy = 0 이에요. 중간에 4 까지 올랐다 내려왔지만 평균변화율은 양 끝만 봅니다.",
  },
  {
    id: "as3",
    kind: "num",
    ask: "f(x) = x³ - 3x 에서 x 의 값이 -1 에서 1 까지 변할 때의 평균변화율을 구해 보세요.",
    answer: -2,
    hint: "f(-1) = 2, f(1) = -2 예요. Δy 를 Δx 로 나누면 됩니다.",
    done: "Δy = -4, Δx = 2 이므로 -2 예요. 그래프에서 A 와 B 를 이은 직선이 아래로 기울어 있지요.",
  },
  {
    id: "as4",
    kind: "choice",
    ask: "평균변화율이 두 점 A(a, f(a)), B(b, f(b)) 를 지나는 직선 AB 의 기울기와 같은 까닭은 무엇일까요?",
    options: [
      [{ pre: "두 점이 모두 그래프 위에 있기 때문" }],
      [{ pre: "Δx 가 1 일 때에만 둘이 같아지기 때문" }],
      [{ pre: "평균변화율은 언제나 양수이기 때문" }],
      [{ pre: "직선의 기울기를 구하는 식과 평균변화율의 식이 똑같기 때문" }],
    ],
    answer: 3,
    explains: [
      "그래프 위에 있다는 것만으로는 기울기가 같다고 말할 수 없어요.",
      "Δx 가 얼마든 두 값은 늘 같아요.",
      "평균변화율은 음수도 0 도 될 수 있어요. 앞 문제에서 직접 보았지요.",
      "",
    ],
    hint: "직선의 기울기는 (y 의 증가량) ÷ (x 의 증가량) 이었어요. 평균변화율은 Δy ÷ Δx 고요.",
    done: "두 식이 글자만 다를 뿐 똑같아요. 그래서 평균변화율을 '할선의 기울기' 라고 불러도 됩니다.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 할선에서 접선으로
// ══════════════════════════════════════════════════════════════
export type TanFn = {
  id: string;
  emoji: string;
  title: string;
  tex: string;
  fn: (x: number) => number;
  d: (x: number) => number;
  dTex: string;
  aMin: number;
  aMax: number;
  aStep: number;
  a0: number;
  box: Box;
  note: string;
};

export const TAN_FNS: TanFn[] = [
  {
    id: "t1",
    emoji: "🥣",
    title: "이차함수",
    tex: "f(x) = x^2 - 4x + 5",
    fn: (x) => x * x - 4 * x + 5,
    d: (x) => 2 * x - 4,
    dTex: "f'(a) = 2a - 4",
    aMin: 0.5,
    aMax: 3.5,
    aStep: 0.5,
    a0: 1,
    box: { xMin: -0.7, xMax: 4.7, yMin: -1, yMax: 9, gx: 1, gy: 2 },
    note: "a = 2 로 두면 접선이 가로로 눕습니다. 포물선의 꼭짓점이지요.",
  },
  {
    id: "t2",
    emoji: "🎢",
    title: "삼차함수",
    tex: "f(x) = x^3 - 3x",
    fn: (x) => x * x * x - 3 * x,
    d: (x) => 3 * x * x - 3,
    dTex: "f'(a) = 3a^2 - 3",
    aMin: -1,
    aMax: 1,
    aStep: 0.5,
    a0: 0.5,
    box: { xMin: -2.2, xMax: 2.2, yMin: -5, yMax: 5, gx: 1, gy: 2 },
    note: "a 를 -1 과 1 에 두면 접선이 가로로 누워요. 봉우리와 골짜기가 있는 자리입니다.",
  },
  {
    id: "t3",
    emoji: "⛰️",
    title: "위로 볼록한 이차함수",
    tex: "f(x) = -\\dfrac{1}{2}x^2 + 3x",
    fn: (x) => -0.5 * x * x + 3 * x,
    d: (x) => -x + 3,
    dTex: "f'(a) = -a + 3",
    aMin: 0,
    aMax: 5,
    aStep: 0.5,
    a0: 1,
    box: { xMin: -1.2, xMax: 6.2, yMin: -5, yMax: 5.5, gx: 1, gy: 2 },
    note: "a 가 커질수록 접선이 점점 눕다가 3 을 지나면 아래로 기울어요.",
  },
  {
    id: "t4",
    emoji: "📏",
    title: "일차함수",
    tex: "f(x) = 2x + 1",
    fn: (x) => 2 * x + 1,
    d: () => 2,
    dTex: "f'(a) = 2",
    aMin: -2,
    aMax: 2,
    aStep: 0.5,
    a0: 0,
    box: { xMin: -3.2, xMax: 3.2, yMin: -6, yMax: 8, gx: 1, gy: 2 },
    note: "할선이 처음부터 접선과 겹쳐 있어요. 좁힐 것도 없이 늘 기울기가 2 입니다.",
  },
];

/** Δx 를 좁혀 가는 단계 */
export const TAN_GAPS = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.001];

export const TAN_STEPS: Step[] = [
  {
    id: "ts1",
    kind: "choice",
    ask: "Δx 를 아주 작게 만들었어요. 그러면 아예 Δx = 0 으로 두면 되지 않을까요?",
    options: [
      [{ pre: "그러면 평균변화율이 0 이 된다" }],
      [{ pre: "두 점이 같아져 기울기가 1 이 된다" }],
      [{ pre: "분모가 0 이 되어 계산할 수 없다 — 가까이 보낼 수만 있다" }],
      [{ pre: "0 으로 두어야 접선의 기울기가 정확히 나온다" }],
    ],
    answer: 2,
    explains: [
      "분자 Δy 도 0 이 되어 0 ÷ 0 이 되는데, 이것은 값을 정할 수 없는 꼴이에요.",
      "두 점이 같아지면 직선이 하나로 정해지지 않아요.",
      "",
      "0 을 넣는 것이 아니라 0 에 한없이 가까이 보낸 극한으로 정합니다.",
    ],
    hint: "Δy/Δx 에서 Δx 자리에 0 을 넣으면 무엇이 되나요?",
    done: "그래서 f'(a) 는 '넣어서' 가 아니라 '한없이 가까이 보낸 극한' 으로 정의합니다.",
  },
  {
    id: "ts2",
    kind: "num",
    ask: "f(x) = x² - 4x + 5 의 x = 3 에서의 미분계수 f'(3) 은 얼마일까요?",
    answer: 2,
    hint: "화면에서 함수를 이차함수로, a 를 3 으로 두고 Δx 를 좁혀 보세요.",
    done: "f'(a) = 2a - 4 이므로 f'(3) = 2 예요. 점 (3, 2) 에서 그은 접선의 기울기지요.",
  },
  {
    id: "ts3",
    kind: "num",
    ask: "같은 함수 f(x) = x² - 4x + 5 에서 접선이 가로로 눕는(기울기가 0 이 되는) 자리의 x 값은 얼마일까요?",
    answer: 2,
    hint: "2a - 4 = 0 이 되는 a 를 찾아보세요.",
    done: "x = 2 — 포물선의 꼭짓점이에요. 다음 단원에서 최댓값·최솟값을 찾을 때 쓰게 됩니다.",
  },
  {
    id: "ts4",
    kind: "num",
    ask: "일차함수 f(x) = 2x + 1 에서 f'(-1) 은 얼마일까요?",
    answer: 2,
    hint: "일차함수는 Δx 를 좁히기도 전에 할선이 접선과 겹쳐 있었어요.",
    done: "a 가 무엇이든 2 예요. 직선의 기울기가 어디서나 같기 때문입니다.",
  },
  {
    id: "ts5",
    kind: "choice",
    ask: "미분계수 f'(a) 가 그래프에서 뜻하는 것은 무엇일까요?",
    options: [
      [{ pre: "점 (a, f(a)) 에서 그은 접선의 기울기" }],
      [{ pre: "x = a 에서의 함숫값" }],
      [{ pre: "a 부터 b 까지의 평균변화율" }],
      [{ pre: "그래프가 x 축과 만나는 자리" }],
    ],
    answer: 0,
    explains: [
      "",
      "함숫값은 f(a) 예요. f'(a) 는 그 점에서 그래프가 기운 정도입니다.",
      "평균변화율은 떨어진 두 점 사이의 이야기예요. 미분계수는 한 점에서의 이야기고요.",
      "x 축과 만나는 자리는 f(x) = 0 인 x 예요. 기울기와는 다른 이야기입니다.",
    ],
    hint: "할선을 좁혀 갔을 때 마지막에 남은 초록 직선이 무엇이었나요?",
    done: "그래서 미분계수를 '그 점에서의 기울기' 라고 읽어도 됩니다.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ③ 미분계수 모으기
// ══════════════════════════════════════════════════════════════
export type DerivFn = {
  id: string;
  emoji: string;
  title: string;
  tex: string;
  fn: (x: number) => number;
  d: (x: number) => number;
  dTex: string;
  deg: string;
  dDeg: string;
  xMin: number;
  xMax: number;
  scanStep: number;
  a0: number;
  fBox: Box;
  dBox: Box;
  note: string;
};

export const DERIV_FNS: DerivFn[] = [
  {
    id: "g1",
    emoji: "🎢",
    title: "삼차함수",
    tex: "f(x) = x^3 - 3x",
    fn: (x) => x * x * x - 3 * x,
    d: (x) => 3 * x * x - 3,
    dTex: "f'(x) = 3x^2 - 3",
    deg: "삼차함수",
    dDeg: "이차함수",
    xMin: -2,
    xMax: 2,
    scanStep: 0.25,
    a0: -2,
    fBox: { xMin: -2.3, xMax: 2.3, yMin: -6, yMax: 6, gx: 1, gy: 2 },
    dBox: { xMin: -2.3, xMax: 2.3, yMin: -5, yMax: 14, gx: 1, gy: 4 },
    note: "봉우리(-1)와 골짜기(1)에서 점이 x 축에 닿아요. 그 자리의 접선이 가로로 눕기 때문이에요.",
  },
  {
    id: "g2",
    emoji: "🥣",
    title: "이차함수",
    tex: "f(x) = x^2 - 4x + 5",
    fn: (x) => x * x - 4 * x + 5,
    d: (x) => 2 * x - 4,
    dTex: "f'(x) = 2x - 4",
    deg: "이차함수",
    dDeg: "일차함수",
    xMin: 0,
    xMax: 4,
    scanStep: 0.25,
    a0: 0,
    fBox: { xMin: -0.4, xMax: 4.4, yMin: -1, yMax: 8, gx: 1, gy: 2 },
    dBox: { xMin: -0.4, xMax: 4.4, yMin: -6, yMax: 6, gx: 1, gy: 2 },
    note: "왼쪽에서는 내려가니 기울기가 음수, 오른쪽에서는 올라가니 양수. 점들이 곧은 선으로 늘어서요.",
  },
  {
    id: "g3",
    emoji: "📏",
    title: "일차함수",
    tex: "f(x) = 2x - 1",
    fn: (x) => 2 * x - 1,
    d: () => 2,
    dTex: "f'(x) = 2",
    deg: "일차함수",
    dDeg: "상수함수",
    xMin: -2,
    xMax: 3,
    scanStep: 0.25,
    a0: -2,
    fBox: { xMin: -2.4, xMax: 3.4, yMin: -6, yMax: 6, gx: 1, gy: 2 },
    dBox: { xMin: -2.4, xMax: 3.4, yMin: -2, yMax: 5, gx: 1, gy: 1 },
    note: "어느 자리에서 접선을 그어도 기울기가 2 라서 점들이 가로선 하나에 모두 올라앉아요.",
  },
  {
    id: "g4",
    emoji: "➖",
    title: "상수함수",
    tex: "f(x) = 3",
    fn: () => 3,
    d: () => 0,
    dTex: "f'(x) = 0",
    deg: "상수함수",
    dDeg: "0",
    xMin: -2,
    xMax: 3,
    scanStep: 0.25,
    a0: -2,
    fBox: { xMin: -2.4, xMax: 3.4, yMin: -2, yMax: 6, gx: 1, gy: 2 },
    dBox: { xMin: -2.4, xMax: 3.4, yMin: -3, yMax: 3, gx: 1, gy: 1 },
    note: "그래프가 가로로 누워 있으니 기울기가 늘 0 이에요. 점들이 x 축 위에 줄줄이 놓입니다.",
  },
];

export const DERIV_STEPS: Step[] = [
  {
    id: "ds1",
    kind: "choice",
    ask: "삼차함수 f(x) = x³ - 3x 의 미분계수를 자리마다 찍어 모았더니 점들이 어떤 모양으로 늘어섰나요?",
    options: [
      [{ pre: "다시 삼차함수 모양" }],
      [{ pre: "포물선 — 이차함수 모양" }],
      [{ pre: "곧은 직선 — 일차함수 모양" }],
      [{ pre: "가로로 뻗은 직선 — 상수함수 모양" }],
    ],
    answer: 1,
    explains: [
      "차수가 그대로 남지는 않았어요. 아래 평면의 점들을 다시 보세요.",
      "",
      "곧은 직선이 된 것은 이차함수를 골랐을 때예요.",
      "가로선이 된 것은 일차함수를 골랐을 때예요.",
    ],
    hint: "아래 평면에서 점들이 아래로 볼록한 곡선을 그렸지요. f'(x) = 3x² - 3 이고요.",
    done: "삼차 → 이차, 이차 → 일차, 일차 → 상수. 차수가 하나씩 내려갑니다.",
  },
  {
    id: "ds2",
    kind: "choice",
    ask: "f(x) = 2x - 1 의 도함수 그래프가 가로선 y = 2 가 된 까닭은 무엇일까요?",
    options: [
      [{ pre: "f(x) 의 상수항이 -1 이기 때문" }],
      [{ pre: "도함수는 언제나 상수함수가 되기 때문" }],
      [{ pre: "어느 자리에서 접선을 그어도 기울기가 늘 2 이기 때문" }],
      [{ pre: "x = 2 에서만 접선을 그었기 때문" }],
    ],
    answer: 2,
    explains: [
      "상수항은 그래프를 위아래로 옮길 뿐 기울기를 바꾸지 않아요.",
      "삼차함수의 도함수는 이차함수였어요. 늘 상수함수가 되는 것은 아닙니다.",
      "",
      "자동 스캔은 왼쪽 끝부터 오른쪽 끝까지 모든 자리를 훑어요.",
    ],
    hint: "직선 위에서는 어디를 짚어도 기울어진 정도가 같지요.",
    done: "f'(x) 의 값이 x 와 상관없이 2 라서 가로선이 되었어요.",
  },
  {
    id: "ds3",
    kind: "choice",
    ask: "도함수 f'(x) 와 미분계수 f'(a) 는 어떤 사이일까요?",
    options: [
      [{ pre: "f'(x) 는 함숫값 f(a) 를 모아 만든 것이다" }],
      [{ pre: "미분계수를 모아 만든 것이 원래 함수 f(x) 다" }],
      [{ pre: "둘은 아무 관계가 없는 서로 다른 것이다" }],
      [{ pre: "도함수 f'(x) 에 x = a 를 넣은 함숫값이 미분계수 f'(a) 다" }],
    ],
    answer: 3,
    explains: [
      "모은 것은 기울기 f'(a) 이지 함숫값 f(a) 가 아니에요.",
      "미분계수를 모아 만든 것은 도함수 f'(x) 예요. f(x) 는 처음부터 있던 함수고요.",
      "미분계수 하나하나를 모은 것이 도함수예요. 아주 가까운 사이입니다.",
      "",
    ],
    hint: "점을 찍을 때 가로 자리는 a, 세로 자리는 f'(a) 였어요.",
    done: "그래서 도함수를 한 번 구해 두면 어느 자리의 미분계수든 넣기만 하면 나옵니다.",
  },
  {
    id: "ds4",
    kind: "num",
    ask: "f(x) = x³ - 3x 의 도함수는 f'(x) = 3x² - 3 이었어요. 그렇다면 f'(2) 는 얼마일까요?",
    answer: 9,
    hint: "도함수의 식에 x 대신 2 를 넣어 보세요.",
    done: "3 × 4 - 3 = 9 예요. x = 2 에서 그래프가 꽤 가파르게 올라간다는 뜻이지요.",
  },
  {
    id: "ds5",
    kind: "num",
    ask: "f(x) = x³ - 3x 의 그래프에서 접선이 가로로 눕는 자리는 모두 몇 군데일까요?",
    answer: 2,
    hint: "아래 평면에서 점이 x 축에 닿는 자리를 세어 보세요. 3x² - 3 = 0 을 풀어도 됩니다.",
    done: "x = -1 과 x = 1 두 군데 — 봉우리와 골짜기예요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 미분 공식
// ══════════════════════════════════════════════════════════════
export const POW_MAX = 5;
export const POW_CONSTS = [-3, 0, 2, 7];

export type PolyKnob = { id: "p" | "q" | "r" | "s"; label: string; tex: string; min: number; max: number };
export const POLY_KNOBS: PolyKnob[] = [
  { id: "p", label: "x³ 의 계수", tex: "p", min: -3, max: 3 },
  { id: "q", label: "x² 의 계수", tex: "q", min: -3, max: 3 },
  { id: "r", label: "x 의 계수", tex: "r", min: -3, max: 3 },
  { id: "s", label: "상수항", tex: "s", min: -5, max: 5 },
];
export const POLY_START = { p: 2, q: -3, r: 1, s: 4 };
export const POLY_X: [number, number] = [-2.2, 2.2];

export const POW_STEPS: Step[] = [
  {
    id: "ps1",
    kind: "choice",
    ask: "공식 (xⁿ)' = n xⁿ⁻¹ 을 써서 x⁵ 을 미분하면 무엇이 될까요?",
    options: [
      [{ tex: "5x^4" }],
      [{ tex: "x^4" }],
      [{ tex: "5x^5" }],
      [{ tex: "4x^5" }],
    ],
    answer: 0,
    explains: [
      "",
      "지수 5 를 앞으로 내려오게 하는 것을 빠뜨렸어요.",
      "지수를 1 줄이는 것을 빠뜨렸어요.",
      "내려오는 것은 원래 지수 5 이고, 남는 지수가 4 예요. 자리가 바뀌었습니다.",
    ],
    hint: "지수가 앞으로 내려오고, 지수 자리에는 1 이 줄어든 수가 남아요.",
    done: "손잡이를 n = 5 에 두면 화면에서도 똑같이 보여요.",
  },
  {
    id: "ps2",
    kind: "choice",
    ask: "f(x) = 4x³ - 2x² + 7 을 미분하면 f'(x) 는 무엇일까요?",
    options: [
      [{ tex: "12x^2 - 2x" }],
      [{ tex: "12x^2 - 4x + 7" }],
      [{ tex: "12x^2 - 4x" }],
      [{ tex: "4x^2 - 2x" }],
    ],
    answer: 2,
    explains: [
      "-2x² 에서 지수 2 를 앞으로 내리면 -4x 예요. 계수가 그대로 남았습니다.",
      "상수항 7 은 미분하면 0 이 되어 사라져요.",
      "",
      "4x³ 에서 지수 3 을 앞으로 내리면 12x² 예요.",
    ],
    hint: "항마다 따로 미분해서 더하거나 빼면 돼요. 상수항은 0 이 됩니다.",
    done: "실수배·합·차의 미분법 덕분에 항을 하나씩 따로 다루면 됩니다.",
  },
  {
    id: "ps3",
    kind: "num",
    ask: "위의 f(x) = 4x³ - 2x² + 7 에서 f'(1) 의 값을 구해 보세요.",
    answer: 8,
    hint: "f'(x) = 12x² - 4x 에 x = 1 을 넣으세요.",
    done: "12 - 4 = 8 이에요. 도함수를 한 번 구해 두니 미분계수가 바로 나오지요.",
  },
  {
    id: "ps4",
    kind: "choice",
    ask: "상수함수 f(x) = -5 의 도함수는 무엇일까요?",
    options: [
      [{ tex: "f'(x) = -5" }],
      [{ tex: "f'(x) = 0" }],
      [{ tex: "f'(x) = -5x" }],
      [{ tex: "f'(x) = 1" }],
    ],
    answer: 1,
    explains: [
      "상수항은 그대로 남지 않고 사라져요.",
      "",
      "미분은 x 를 곱하는 것이 아니에요.",
      "f'(x) = 1 이 되는 것은 f(x) = x 일 때예요.",
    ],
    hint: "상수함수의 그래프는 가로로 누운 직선이에요. 그 기울기는 얼마인가요?",
    done: "값이 변하지 않으니 변화율이 0 이에요. 상수항의 크기와도 상관없습니다.",
  },
  {
    id: "ps5",
    kind: "num",
    ask: "f(x) = x⁴ - 2x³ + 5x 일 때 f'(1) 의 값을 구해 보세요.",
    answer: 3,
    hint: "먼저 f'(x) = 4x³ - 6x² + 5 를 구하고 x = 1 을 넣으세요.",
    done: "4 - 6 + 5 = 3 이에요. 항이 많아져도 하나씩 미분해서 이어 붙이면 됩니다.",
  },
  {
    id: "ps6",
    kind: "num",
    ask: "f(x) = 3x² - 12x + 7 에서 f'(x) = 0 이 되는 x 의 값을 구해 보세요.",
    answer: 2,
    hint: "f'(x) = 6x - 12 예요. 이것이 0 이 되는 x 를 찾으면 됩니다.",
    done: "x = 2 — 접선이 가로로 눕는 자리이자 이 포물선의 꼭짓점이에요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ 경제 속 순간변화율
// ══════════════════════════════════════════════════════════════
export type EcoScene = {
  id: string;
  emoji: string;
  title: string;
  story: string;
  /** 원래 함수 */
  tex: string;
  fn: (x: number) => number;
  /** 도함수 */
  dTex: string;
  d: (x: number) => number;
  xLabel: string;
  xUnit: string;
  yLabel: string;
  yUnit: string;
  /** 변화율을 부르는 이름 */
  rateName: string;
  rateUnit: string;
  xMin: number;
  xMax: number;
  xStep: number;
  x0: number;
  fBox: Box;
  dBox: Box;
  /** 변화율이 양수일 때 / 음수일 때 읽는 말 */
  up: string;
  down: string;
  note: string;
};

export const ECO_SCENES: EcoScene[] = [
  {
    id: "e1",
    emoji: "🍪",
    title: "수제 쿠키 공방",
    story: "쿠키를 x 상자 만들 때 드는 비용이 C(x) 천원이에요. 한 상자를 더 만들면 비용이 얼마나 늘까요?",
    tex: "C(x) = x^2 + 20x + 300",
    fn: (x) => x * x + 20 * x + 300,
    dTex: "C'(x) = 2x + 20",
    d: (x) => 2 * x + 20,
    xLabel: "생산량",
    xUnit: "상자",
    yLabel: "비용",
    yUnit: "천원",
    rateName: "한계비용",
    rateUnit: "천원/상자",
    xMin: 0,
    xMax: 30,
    xStep: 1,
    x0: 10,
    fBox: { xMin: -1, xMax: 31, yMin: 0, yMax: 1900, gx: 5, gy: 300 },
    dBox: { xMin: -1, xMax: 31, yMin: 0, yMax: 90, gx: 5, gy: 20 },
    up: "한 상자를 더 만들 때 드는 비용",
    down: "한 상자를 더 만들 때 줄어드는 비용",
    note: "많이 만들수록 한계비용이 커져요. 재료를 급히 더 사고 야근을 하게 되는 셈이지요.",
  },
  {
    id: "e2",
    emoji: "📣",
    title: "온라인 광고",
    story: "광고비를 x 만원 쓸 때 매출이 R(x) 만원이에요. 광고비를 1 만원 더 쓰면 매출이 얼마나 늘까요?",
    tex: "R(x) = -2x^2 + 120x",
    fn: (x) => -2 * x * x + 120 * x,
    dTex: "R'(x) = -4x + 120",
    d: (x) => -4 * x + 120,
    xLabel: "광고비",
    xUnit: "만원",
    yLabel: "매출",
    yUnit: "만원",
    rateName: "한계매출",
    rateUnit: "만원/만원",
    xMin: 0,
    xMax: 50,
    xStep: 1,
    x0: 10,
    fBox: { xMin: -1, xMax: 52, yMin: 0, yMax: 2000, gx: 10, gy: 400 },
    dBox: { xMin: -1, xMax: 52, yMin: -120, yMax: 140, gx: 10, gy: 40 },
    up: "광고비를 1 만원 더 쓸 때 늘어나는 매출",
    down: "광고비를 1 만원 더 쓸 때 줄어드는 매출",
    note: "광고비 30 만원을 넘기면 변화율이 음수가 돼요. 더 써 봐야 매출이 오히려 줄어듭니다.",
  },
  {
    id: "e3",
    emoji: "📱",
    title: "앱 구독자 수",
    story: "앱을 연 지 t 개월이 지났을 때 구독자가 N(t) 명이에요. 한 달에 몇 명씩 늘고 있을까요?",
    tex: "N(t) = t^3 - 12t^2 + 60t",
    fn: (t) => t * t * t - 12 * t * t + 60 * t,
    dTex: "N'(t) = 3t^2 - 24t + 60",
    d: (t) => 3 * t * t - 24 * t + 60,
    xLabel: "지난 개월",
    xUnit: "개월",
    yLabel: "구독자",
    yUnit: "명",
    rateName: "증가 속도",
    rateUnit: "명/개월",
    xMin: 0,
    xMax: 10,
    xStep: 0.5,
    x0: 2,
    fBox: { xMin: -0.3, xMax: 10.3, yMin: 0, yMax: 450, gx: 1, gy: 100 },
    dBox: { xMin: -0.3, xMax: 10.3, yMin: 0, yMax: 140, gx: 1, gy: 20 },
    up: "한 달 동안 늘어나는 구독자 수",
    down: "한 달 동안 줄어드는 구독자 수",
    note: "구독자는 계속 늘지만 4 개월째에 가장 더디게 늘다가 다시 빨라져요. 변화율도 변합니다.",
  },
  {
    id: "e4",
    emoji: "🚗",
    title: "중고차 값",
    story: "새 차를 산 지 t 해가 지났을 때 값이 V(t) 만원이에요. 한 해에 얼마씩 떨어지고 있을까요?",
    tex: "V(t) = 10t^2 - 300t + 2000",
    fn: (t) => 10 * t * t - 300 * t + 2000,
    dTex: "V'(t) = 20t - 300",
    d: (t) => 20 * t - 300,
    xLabel: "지난 해",
    xUnit: "해",
    yLabel: "중고차 값",
    yUnit: "만원",
    rateName: "값이 변하는 속도",
    rateUnit: "만원/해",
    xMin: 0,
    xMax: 8,
    xStep: 0.5,
    x0: 2,
    fBox: { xMin: -0.3, xMax: 8.3, yMin: 0, yMax: 2200, gx: 1, gy: 400 },
    dBox: { xMin: -0.3, xMax: 8.3, yMin: -340, yMax: 40, gx: 1, gy: 60 },
    up: "한 해 동안 오르는 값",
    down: "한 해 동안 떨어지는 값",
    note: "변화율이 줄곧 음수예요. 다만 해가 갈수록 0 에 가까워져 떨어지는 속도가 느려집니다.",
  },
];

export const ECO_STEPS: Step[] = [
  {
    id: "es1",
    kind: "num",
    ask: "쿠키 공방에서 C(x) = x² + 20x + 300 일 때 C'(10) 은 얼마일까요? (단위: 천원)",
    answer: 40,
    unit: "천원",
    hint: "C'(x) = 2x + 20 에 x = 10 을 넣으세요.",
    done: "40 천원이에요. 실제로 C(11) - C(10) = 641 - 600 = 41 천원이니 아주 가깝지요.",
  },
  {
    id: "es2",
    kind: "choice",
    ask: "한계비용 C'(10) = 40 (천원) 이 뜻하는 것은 무엇일까요?",
    options: [
      [{ pre: "10 상자를 만드는 데 드는 전체 비용이 40 천원이다" }],
      [{ pre: "10 상자를 만들고 있을 때 한 상자를 더 만드는 데 드는 비용이 약 40 천원이다" }],
      [{ pre: "쿠키 한 상자의 판매 가격이 40 천원이다" }],
      [{ pre: "10 상자까지의 평균 비용이 40 천원이다" }],
    ],
    answer: 1,
    explains: [
      "전체 비용은 C(10) = 600 천원이에요. C' 은 '늘어나는 몫' 입니다.",
      "",
      "비용과 판매 가격은 다른 이야기예요. 이 함수는 드는 비용만 말해 줍니다.",
      "평균 비용은 600 ÷ 10 = 60 천원이에요. 한계비용과 다릅니다.",
    ],
    hint: "C' 은 x 가 1 만큼 늘 때 C 가 얼마나 늘어나는지를 알려 주는 변화율이에요.",
    done: "'한 개 더' 의 비용 — 그래서 한계비용이라고 부르고, 얼마나 더 만들지 정할 때 씁니다.",
  },
  {
    id: "es3",
    kind: "num",
    ask: "광고 장면에서 R'(x) = 0 이 되는 광고비는 얼마일까요? (단위: 만원)",
    answer: 30,
    unit: "만원",
    hint: "-4x + 120 = 0 을 풀어 보세요.",
    done: "30 만원 — 이 자리에서 매출이 1,800 만원으로 가장 큽니다. 더 써도 늘지 않아요.",
  },
  {
    id: "es4",
    kind: "choice",
    ask: "광고비가 40 만원일 때 R'(40) = -40 입니다. 무슨 뜻일까요?",
    options: [
      [{ pre: "매출이 -40 만원이다" }],
      [{ pre: "광고비가 40 만원 모자라다" }],
      [{ pre: "광고비를 1 만원 더 쓰면 매출이 약 40 만원 늘어난다" }],
      [{ pre: "광고비를 1 만원 더 쓰면 매출이 약 40 만원 줄어든다" }],
    ],
    answer: 3,
    explains: [
      "매출은 R(40) = 1,600 만원이에요. -40 은 변화율이지 매출이 아닙니다.",
      "변화율은 모자란 양이 아니라 '1 늘릴 때의 변화' 예요.",
      "부호가 음수예요. 늘어나는 것이 아니라 줄어듭니다.",
      "",
    ],
    hint: "변화율의 부호가 음수라는 것은 x 가 늘 때 y 가 어떻게 된다는 뜻일까요?",
    done: "변화율의 부호가 '늘어나는지 줄어드는지' 를, 크기가 '얼마나 빠른지' 를 알려 줍니다.",
  },
  {
    id: "es5",
    kind: "num",
    ask: "중고차 값 V(t) = 10t² - 300t + 2000 에서 V'(5) 는 얼마일까요? (단위: 만원/해)",
    answer: -200,
    unit: "만원/해",
    hint: "V'(t) = 20t - 300 에 t = 5 를 넣으세요. 부호도 함께 적어야 해요.",
    done: "-200 만원/해 — 5 년째에는 한 해에 약 200 만원씩 값이 떨어지고 있다는 뜻이에요.",
  },
];

export const REAL_NOTE =
  "쿠키 공방의 비용, 광고비와 매출, 앱 구독자 수, 중고차 값은 모두 계산이 깔끔하게 떨어지도록 이 활동에서 정한 가상의 값이다.";
