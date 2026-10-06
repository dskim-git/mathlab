// 함수의 증가·감소와 극값 — 활동 데이터
//
// ─── 다루는 개념과 그 순서 ─────────────────────────────────
//  이 활동의 뼈대는 "정의로 먼저 보고, 도함수로 다시 본다" 이다.
//
//  (1) 증가·감소의 정의 — 미분과 무관하다.
//      함수 f 가 어떤 구간에 속하는 임의의 두 실수 x1, x2 에 대하여
//          x1 < x2 일 때 f(x1) < f(x2)  ⇒  그 구간에서 증가
//          x1 < x2 일 때 f(x1) > f(x2)  ⇒  그 구간에서 감소
//      정의에 기울기·접선·도함수가 한 글자도 나오지 않는다는 점이 중요하다.
//      그래서 탭 ① 은 두 점을 직접 끌어 함숫값만 견주고, '모든 쌍' 을 전수 검사한다.
//
//  (2) 극대·극소의 정의 — 역시 미분과 무관하다.
//      실수 a 를 포함하는 '어떤' 열린구간에 속하는 모든 x 에 대하여
//          f(x) ≤ f(a)  ⇒  x = a 에서 극대,  f(a) 는 극댓값
//          f(x) ≥ f(a)  ⇒  x = a 에서 극소,  f(a) 는 극솟값
//      '어떤' 이 핵심이다 — 그런 열린구간이 하나라도 있으면 된다(동네 1등).
//      구간 전체에서 가장 크다는 뜻(최대, 전국 1등)이 아니다.
//      탭 ③ 의 돋보기 창은 이 '어떤 열린구간' 을 손으로 좁혀 보는 장치다.
//
//  (3) 도함수로 다시 보기 — 정의를 따지지 않고도 판정할 수 있다.
//      어떤 열린구간에서 f'(x) 가 존재하고 그 구간의 모든 x 에 대하여
//          f'(x) > 0  ⇒  증가,   f'(x) < 0  ⇒  감소
//      f'(a) = 0 이고 x = a 의 좌우에서 f'(x) 의 부호가
//          양 → 음 으로 바뀌면 극대,  음 → 양 으로 바뀌면 극소
//      탭 ④ 가 이 판정을 접선·도함수 그래프·부호 띠·증감표로 잇는다.
//
//  (4) 역은 성립하지 않는다.
//      · 증가한다고 해서 모든 점에서 f'(x) > 0 인 것은 아니다 — f(x) = x^3 의 x = 0.
//      · f'(a) = 0 이라고 해서 x = a 가 극값인 것도 아니다 — 부호가 바뀌어야 한다.
//      탭 ⑤ 의 '평평한 자리 분류소' 가 이 둘을 한꺼번에 겪게 한다.
//
// ─── 쓴 함수와 그 값 (전부 손으로 검산 가능한 정수 값) ─────────
//
//  탭 ① 두 점 재판소 — 다섯 함수 × 구간 칩
//      2x + 1                (-3,0) 증가 · (0,3) 증가 · (-3,3) 증가
//      x^2 - 2x              꼭짓점 x = 1, f(1) = -1
//                            (-2,1) 감소 · (1,4) 증가 · (-2,4) 섞임   [f(-2) = f(4) = 8]
//      -x^2 + 4x             꼭짓점 x = 2, f(2) = 4
//                            (0,2) 증가 · (2,5) 감소 · (0,5) 섞임     [f(0) = 0, f(5) = -5]
//      x^3 - 3x              f' = 3x^2 - 3 = 3(x+1)(x-1)
//                            (-2.2,-1) 증가 · (-1,1) 감소 · (1,2.2) 증가 · (-2.2,2.2) 섞임
//      x^3                   (-2,0) 증가 · (0,2) 증가 · (-2,2) 증가
//                            x = 0 에서 평평해 보여도 x1 < x2 이면 늘 x1^3 < x2^3 이라 증가다.
//      전수 검사: 구간을 45 등분해 45C2 = 990 쌍을 모두 견준다.
//
//  탭 ② 롤러코스터 — 네 코스
//      쌍봉   x^3 - 3x          [-2.2, 2.2]  정상 (-1, 2) · 골짜기 (1, -2)
//                               끝값 f(±2.2) = ±4.048 — 정상(2)보다 끝(4.048)이 더 높다.
//                               즉 극대는 트랙 전체의 최고점이 아니다.
//      외봉   -x^2 + 4x         [-0.5, 4.5]  정상 (2, 4)
//      멈칫   x^3               [-1.6, 1.6]  (0, 0) 에서 평평하지만 정상도 골짜기도 아님
//      W     0.25x^4 - 2x^2    [-2.8, 2.8]  f' = x^3 - 4x = x(x+2)(x-2)
//                               골짜기 (-2, -4) · 정상 (0, 0) · 골짜기 (2, -4)  → 깃발 3 개
//
//  탭 ③ 돋보기 창 — 세 함수 (a 는 양 끝에서 0.5 안쪽까지만 고를 수 있게 했다.
//                            끝점은 열린구간을 양쪽으로 잡을 수 없어 극값 논의에서 뺀다.)
//      x^3 - 3x        [-2.5, 2.5]  극대 (-1, 2) · 극소 (1, -2)
//                      최댓값 f(2.5) = 8.125,  최솟값 f(-2.5) = -8.125
//                      → 극댓값 2 < 최댓값 8.125 : 극대와 최대는 다르다.
//                      a = -1 은 창 폭 w ≤ 3 까지 '창 안 최고' 를 지키고
//                        w = 3.1 에서 f(2.1) = 2.961 > 2 이 들어와 깨진다.
//      x^3 - 6x^2 + 9x [-0.5, 4.5]  = x(x-3)^2,  f' = 3(x-1)(x-3)
//                      극대 (1, 4) · 극소 (3, 0)
//                      최댓값 f(4.5) = 10.125,  최솟값 f(-0.5) = -6.125
//                      → 극솟값이 0 인 예(함숫값이 0 이어도 극값일 수 있다).
//      x^3             [-1.6, 1.6]  (0, 0) 은 아무리 좁혀도 최고도 최저도 아니다.
//                      f(-0.05) = -0.000125 < 0 < 0.000125 = f(0.05) 처럼
//                      왼쪽은 늘 더 낮고 오른쪽은 늘 더 높아 최고도 최저도 될 수 없다.
//
//  탭 ④ 경사계와 증감표 — 세 함수
//      W 코스 다시 보기  f  = 0.25x^4 - 2x^2        [-3, 3]
//                        f' = x^3 - 4x
//                        극소 (-2, -4) · 극대 (0, 0) · 극소 (2, -4)
//                        끝값 f(±3) = 20.25 - 18 = 2.25,  f'(±3) = ±15
//      쉼 없는 오르막    f  = x^3 + 3x               [-2, 2]
//                        f' = 3x^2 + 3 ≥ 3 > 0  → 부호가 바뀌지 않아 극값이 없다.
//                        끝값 f(±2) = ±14,  f'(0) = 3,  f'(±2) = 15
//      이윤 곡선         P  = -q^3 + 9q^2 - 15q      [0, 7]   q: 생산량(천 개), P: 이윤(만원)
//                        P' = -3q^2 + 18q - 15 = -3(q-1)(q-5)
//                        극소 (1, -7) · 극대 (5, 25)
//                        P(0) = 0, P(2) = -2, P(3) = 9, P(4) = 20, P(6) = 18, P(7) = -7
//                        → 이 구간에서는 극댓값 25 가 최댓값과 같다(탭 ③ 과 대비된다).
//                        P'(0) = -15, P'(3) = 12, P'(7) = -36
//                        이 이윤 곡선의 수치는 가상의 값이다(REAL_NOTE 로 화면에 밝힌다).
//
//  탭 ⑤ 평평한 자리 분류소 — f'(a) = 0 인 여덟 자리
//      번호 함수                 a     좌(a-0.3)  우(a+0.3)   판정
//      1   x^3                   0     f' = 3x^2 → f'(±0.3) = 0.27  좌 + · 우 +     극값 아님
//      2   x^3 - 3x             -1     f'(-1.3) = 2.07  + · f'(-0.7) = -1.53  -       극대
//      3   x^3 - 3x              1     f'(0.7)  = -1.53 - · f'(1.3)  = 2.07   +       극소
//      4   -x^4 + 4x^3           0     f' = 4x^2(3-x) → f'(-0.3) = 1.188 + · f'(0.3) = 0.972 +  극값 아님
//      5   -x^4 + 4x^3           3     f'(2.7) = 8.748  + · f'(3.3) = -13.068 -       극대
//      6   0.25x^4 - 2x^2       -2     f'(-2.3) = -2.967 - · f'(-1.7) = 1.887 +       극소
//      7   0.25x^4 - 2x^2        0     f'(-0.3) = 1.173 + · f'(0.3) = -1.173 -        극대
//      8   0.25x^4 - 2x^2        2     f'(1.7) = -1.887 - · f'(2.3) = 2.967  +        극소
//      → 극대 3 (2·5·7) · 극소 3 (3·6·8) · 극값 아님 2 (1·4)
//      (-x^4 + 4x^3 의 값: f(0) = 0, f(3) = -81 + 108 = 27, f(4) = -256 + 256 = 0,
//       f(2) = -16 + 32 = 16, f(-1) = -1 - 4 = -5, f(1) = -1 + 4 = 3)
//
// 수업 자료에 나온 f(x) = 2x^3 - 9x^2 + 12x 와 f(x) = 2x^3 - 6x 는 쓰지 않았다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  const r = Number(v.toFixed(d));
  return String(Object.is(r, -0) ? 0 : r);
}

export type Piece = { pre?: string; tex?: string; post?: string };

// ══════════════════════════════════════════════════════════════
//  좌표평면 · 경로
// ══════════════════════════════════════════════════════════════
export type Box = { xMin: number; xMax: number; yMin: number; yMax: number; gx: number; gy: number };

/** 상자 안에서만 샘플링해 끊긴 조각들로 돌려준다 */
export function samplePath(
  fn: (x: number) => number,
  from: number,
  to: number,
  box: Box,
  n = 220,
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

export type Lean = "up" | "down";
export type TonedSeg = { tone: Lean; pts: [number, number][] };

/** 구간 [lo, hi] 의 그래프를 f' 의 부호에 따라 오르막·내리막 조각으로 나눈다 */
export function tonedPath(
  fn: (x: number) => number,
  d1: (x: number) => number,
  lo: number,
  hi: number,
  n = 280,
): TonedSeg[] {
  const out: TonedSeg[] = [];
  if (hi <= lo) return out;
  let cur: [number, number][] = [];
  let tone: Lean = d1(lo) >= 0 ? "up" : "down";
  for (let i = 0; i <= n; i++) {
    const x = lo + ((hi - lo) * i) / n;
    const t: Lean = d1(x) >= 0 ? "up" : "down";
    if (t !== tone && cur.length > 0) {
      cur.push([x, fn(x)]);
      if (cur.length > 1) out.push({ tone, pts: cur });
      cur = [];
      tone = t;
    }
    cur.push([x, fn(x)]);
  }
  if (cur.length > 1) out.push({ tone, pts: cur });
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
//  탭 ① 두 점 재판소 — 증가·감소의 정의
// ══════════════════════════════════════════════════════════════
export type SpanKind = "up" | "down" | "mix";
export const SPAN_LABEL: Record<SpanKind, string> = { up: "증가", down: "감소", mix: "둘 다 아님" };
export const SPAN_EMOJI: Record<SpanKind, string> = { up: "📈", down: "📉", mix: "🌀" };

export type Span = { id: string; lo: number; hi: number; verdict: SpanKind };
export type PairFn = {
  id: string;
  emoji: string;
  title: string;
  tex: string;
  fn: (x: number) => number;
  box: Box;
  from: number;
  to: number;
  spans: Span[];
};

export const PAIR_FNS: PairFn[] = [
  {
    id: "p1",
    emoji: "📏",
    title: "곧은 오르막",
    tex: "f(x) = 2x + 1",
    fn: (x) => 2 * x + 1,
    from: -3,
    to: 3,
    box: { xMin: -3.4, xMax: 3.4, yMin: -6.5, yMax: 8.5, gx: 1, gy: 2 },
    spans: [
      { id: "p1a", lo: -3, hi: 0, verdict: "up" },
      { id: "p1b", lo: 0, hi: 3, verdict: "up" },
      { id: "p1c", lo: -3, hi: 3, verdict: "up" },
    ],
  },
  {
    id: "p2",
    emoji: "🥣",
    title: "V자 골짜기",
    tex: "f(x) = x^2 - 2x",
    fn: (x) => x * x - 2 * x,
    from: -2,
    to: 4,
    box: { xMin: -2.5, xMax: 4.5, yMin: -2.5, yMax: 9.5, gx: 1, gy: 2 },
    spans: [
      { id: "p2a", lo: -2, hi: 1, verdict: "down" },
      { id: "p2b", lo: 1, hi: 4, verdict: "up" },
      { id: "p2c", lo: -2, hi: 4, verdict: "mix" },
    ],
  },
  {
    id: "p3",
    emoji: "⛰️",
    title: "언덕",
    tex: "f(x) = -x^2 + 4x",
    fn: (x) => -x * x + 4 * x,
    from: 0,
    to: 5,
    box: { xMin: -0.6, xMax: 5.6, yMin: -6.5, yMax: 5.5, gx: 1, gy: 2 },
    spans: [
      { id: "p3a", lo: 0, hi: 2, verdict: "up" },
      { id: "p3b", lo: 2, hi: 5, verdict: "down" },
      { id: "p3c", lo: 0, hi: 5, verdict: "mix" },
    ],
  },
  {
    id: "p4",
    emoji: "🎢",
    title: "구불 트랙",
    tex: "f(x) = x^3 - 3x",
    fn: (x) => x * x * x - 3 * x,
    from: -2.2,
    to: 2.2,
    box: { xMin: -2.5, xMax: 2.5, yMin: -5, yMax: 5, gx: 1, gy: 1 },
    spans: [
      { id: "p4a", lo: -2.2, hi: -1, verdict: "up" },
      { id: "p4b", lo: -1, hi: 1, verdict: "down" },
      { id: "p4c", lo: 1, hi: 2.2, verdict: "up" },
      { id: "p4d", lo: -2.2, hi: 2.2, verdict: "mix" },
    ],
  },
  {
    id: "p5",
    emoji: "🛝",
    title: "멈칫 미끄럼틀",
    tex: "f(x) = x^3",
    fn: (x) => x * x * x,
    from: -2,
    to: 2,
    box: { xMin: -2.3, xMax: 2.3, yMin: -9, yMax: 9, gx: 0.5, gy: 2 },
    spans: [
      { id: "p5a", lo: -2, hi: 0, verdict: "up" },
      { id: "p5b", lo: 0, hi: 2, verdict: "up" },
      { id: "p5c", lo: -2, hi: 2, verdict: "up" },
    ],
  },
];

export const PAIR_SAMPLES = 45;
export type SpanCheck = {
  kind: SpanKind;
  pairs: number;
  badUp?: [number, number];
  badDown?: [number, number];
};

/** 구간을 45 등분해 990 쌍을 모두 견준다 — 증가·감소의 정의 그대로 */
export function spanVerdict(fn: (x: number) => number, lo: number, hi: number, n = PAIR_SAMPLES): SpanCheck {
  const xs: number[] = [];
  for (let i = 0; i < n; i++) xs.push(lo + ((hi - lo) * i) / (n - 1));
  const ys = xs.map(fn);
  let up = true;
  let down = true;
  let badUp: [number, number] | undefined;
  let badDown: [number, number] | undefined;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!(ys[i] < ys[j])) {
        if (up) badUp = [xs[i], xs[j]];
        up = false;
      }
      if (!(ys[i] > ys[j])) {
        if (down) badDown = [xs[i], xs[j]];
        down = false;
      }
    }
  }
  const pairs = (n * (n - 1)) / 2;
  if (up) return { kind: "up", pairs };
  if (down) return { kind: "down", pairs };
  return { kind: "mix", pairs, badUp, badDown };
}

export const PAIR_GOALS = [
  "'증가' 가 나오는 구간을 하나 찾기",
  "'감소' 가 나오는 구간을 하나 찾기",
  "'둘 다 아님' 이 나오는 구간을 하나 찾기",
];

export const PAIR_STEPS: Step[] = [
  {
    id: "ps1",
    kind: "choice",
    ask: "구간 안에서 x₁ < x₂ 가 되게 두 수를 잡았어요. 그 구간에서 f 가 '증가' 라고 말하려면 무엇이 성립해야 할까요?",
    options: [
      [{ tex: "f(x_1) > f(x_2)" }, { post: " 가 모든 쌍에서 성립한다" }],
      [{ tex: "f(x_1) < f(x_2)" }, { post: " 인 쌍이 하나라도 있다" }],
      [{ tex: "f(x_1) < f(x_2)" }, { post: " 가 그런 모든 쌍에서 성립한다" }],
      [{ pre: "구간의 양 끝에서 " }, { tex: "f" }, { post: " 의 값이 서로 같다" }],
    ],
    answer: 2,
    explains: [
      "그것은 감소의 조건이에요.",
      "한 쌍만 맞아서는 모자라요. 섞인 구간에서도 그런 쌍은 얼마든지 찾을 수 있어요.",
      "",
      "양 끝 값이 같다면 오히려 증가도 감소도 아니지요.",
    ],
    hint: "'모든 쌍 검사' 단추는 구간을 45 등분해 990 쌍을 한꺼번에 견줘요.",
    done: "반례 쌍이 하나라도 나오면 그 구간은 증가가 아니에요.",
  },
  {
    id: "ps2",
    kind: "choice",
    ask: "'V자 골짜기' 를 구간 (-2, 4) 전체에서 검사했더니 '둘 다 아님' 이 나왔어요. 까닭으로 알맞은 것은?",
    options: [
      [{ pre: "구간 안에 값이 내려가는 곳과 올라가는 곳이 함께 있어서" }],
      [{ pre: "구간이 너무 넓어서 검사가 되지 않아서" }],
      [{ tex: "x = -2" }, { post: " 와 " }, { tex: "x = 4" }, { post: " 에서 값이 같아서" }],
      [{ pre: "이차함수는 증가도 감소도 아니어서" }],
    ],
    answer: 0,
    explains: [
      "",
      "넓이와는 상관없어요. 같은 함수도 (-2, 1) 로 좁히면 '감소' 가 또렷하게 나왔지요.",
      "양 끝 값이 8 로 같은 것은 결과일 뿐이고, 까닭은 중간에서 방향이 바뀌기 때문이에요.",
      "구간을 (1, 4) 로 잡으면 분명히 증가예요. 함수가 아니라 구간이 문제예요.",
    ],
    hint: "같은 함수를 (-2, 1) 과 (1, 4) 로 나눠 따로 검사해 보세요.",
    done: "증가·감소는 함수가 아니라 '구간' 마다 정해지는 성질이에요.",
  },
  {
    id: "ps3",
    kind: "choice",
    ask: "'멈칫 미끄럼틀' 은 (-2, 2) 에서 '증가' 가 나왔어요. x = 0 근처가 거의 평평한데도 증가인 까닭은?",
    options: [
      [{ pre: "세제곱이 들어간 함수는 모두 증가해서" }],
      [{ pre: "평평한 점이 딱 하나뿐이라 그 점은 빼고 보아서" }],
      [{ tex: "x = 0" }, { post: " 에서 함숫값이 0 이어서" }],
      [{ pre: "평평해 보여도 " }, { tex: "x_1 < x_2" }, { post: " 이면 늘 " }, { tex: "f(x_1) < f(x_2)" }, { post: " 여서" }],
    ],
    answer: 3,
    explains: [
      "f(x) = -x³ 은 어디서나 감소예요. 모양이 아니라 정의로 따져야 해요.",
      "점을 빼고 보는 것이 아니라, 정의 그대로 모든 쌍에서 부등호가 지켜지는지 보면 돼요. 실제로 지켜지지요.",
      "함숫값이 얼마인지는 증가·감소와 아무 상관이 없어요.",
      "",
    ],
    hint: "x₁ = -0.1, x₂ = 0.1 로 두고 두 함숫값을 견줘 보세요.",
    done: "증가·감소의 정의에는 기울기도 접선도 나오지 않아요. 오직 두 함숫값의 크기 비교예요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 롤러코스터
// ══════════════════════════════════════════════════════════════
/**
 * 코스를 따라 실제로 지나온 트랙의 길이(호의 길이)를 0~1 로 환산한다.
 *   s(x) = ∫ sqrt(1 + f'(t)^2) dt  를 사다리꼴로 적분해 전체 길이로 나눈 값.
 * 차창 뷰에서 레일 침목이 다가오는 속도로 쓴다 — 같은 걸음(Δx)이라도
 * 가파른 곳은 지나는 트랙이 길어 빠르게, 평평한 곳(정상·골짜기)은 느리게 흐른다.
 */
export function arcRatio(d1: (x: number) => number, from: number, to: number, x: number, n = 480): number {
  const g = (t: number) => Math.sqrt(1 + d1(t) * d1(t));
  const h = (to - from) / n;
  let total = 0;
  let upto = 0;
  for (let i = 0; i < n; i++) {
    const a = from + i * h;
    const b = a + h;
    total += ((g(a) + g(b)) / 2) * h;
    if (b <= x) upto += ((g(a) + g(b)) / 2) * h;
    else if (a < x) upto += ((g(a) + g(x)) / 2) * (x - a);
  }
  return total > 0 ? Math.min(1, Math.max(0, upto / total)) : 0;
}

export type FlagKind = "max" | "min" | "none";
export const FLAG_LABEL: Record<FlagKind, string> = {
  max: "정상 (극대)",
  min: "골짜기 (극소)",
  none: "그냥 평평 (극값 아님)",
};
export const FLAG_EMOJI: Record<FlagKind, string> = { max: "🚩", min: "⛳", none: "🪧" };

export type Flag = { id: string; x: number; y: number; kind: FlagKind; why: string };
export type Course = {
  id: string;
  emoji: string;
  title: string;
  tex: string;
  fn: (x: number) => number;
  d1: (x: number) => number;
  from: number;
  to: number;
  box: Box;
  flags: Flag[];
  note: string;
};

export const COURSES: Course[] = [
  {
    id: "c1",
    emoji: "🏔️",
    title: "쌍봉 코스",
    tex: "f(x) = x^3 - 3x",
    fn: (x) => x * x * x - 3 * x,
    d1: (x) => 3 * x * x - 3,
    from: -2.2,
    to: 2.2,
    box: { xMin: -2.5, xMax: 2.5, yMin: -4.8, yMax: 4.8, gx: 1, gy: 1 },
    flags: [
      { id: "c1f1", x: -1, y: 2, kind: "max", why: "오르막에서 내리막으로 바뀌었어요. 근처에서 가장 높은 자리예요." },
      { id: "c1f2", x: 1, y: -2, kind: "min", why: "내리막에서 오르막으로 바뀌었어요. 근처에서 가장 낮은 자리예요." },
    ],
    note: "정상의 높이는 2 인데 코스 끝은 4.048 까지 올라가요. 정상이 트랙의 최고점은 아니에요.",
  },
  {
    id: "c2",
    emoji: "⛰️",
    title: "외봉 코스",
    tex: "f(x) = -x^2 + 4x",
    fn: (x) => -x * x + 4 * x,
    d1: (x) => -2 * x + 4,
    from: -0.5,
    to: 4.5,
    box: { xMin: -0.9, xMax: 4.9, yMin: -3.2, yMax: 5.2, gx: 1, gy: 1 },
    flags: [{ id: "c2f1", x: 2, y: 4, kind: "max", why: "쭉 오르다가 여기서 내리막으로 돌아섰어요." }],
    note: "봉우리가 하나뿐이라 이 코스에서는 정상이 곧 최고점이기도 해요.",
  },
  {
    id: "c3",
    emoji: "🛝",
    title: "멈칫 미끄럼틀",
    tex: "f(x) = x^3",
    fn: (x) => x * x * x,
    d1: (x) => 3 * x * x,
    from: -1.6,
    to: 1.6,
    box: { xMin: -1.9, xMax: 1.9, yMin: -4.8, yMax: 4.8, gx: 0.5, gy: 1 },
    flags: [{ id: "c3f1", x: 0, y: 0, kind: "none", why: "평평해졌지만 앞뒤가 모두 오르막이라 정상도 골짜기도 아니에요." }],
    note: "경사계 바늘이 0 을 가리켜도 방향이 바뀌지 않으면 깃발을 꽂을 수 없어요.",
  },
  {
    id: "c4",
    emoji: "〰️",
    title: "W 코스",
    tex: "f(x) = \\dfrac{1}{4}x^4 - 2x^2",
    fn: (x) => 0.25 * x * x * x * x - 2 * x * x,
    d1: (x) => x * x * x - 4 * x,
    from: -2.8,
    to: 2.8,
    box: { xMin: -3.1, xMax: 3.1, yMin: -5.2, yMax: 1.8, gx: 1, gy: 1 },
    flags: [
      { id: "c4f1", x: -2, y: -4, kind: "min", why: "내리막에서 오르막으로 바뀐 첫 골짜기예요." },
      { id: "c4f2", x: 0, y: 0, kind: "max", why: "두 골짜기 사이의 봉우리예요. 근처에서 가장 높지요." },
      { id: "c4f3", x: 2, y: -4, kind: "min", why: "다시 내리막에서 오르막으로 바뀌었어요." },
    ],
    note: "골짜기 · 정상 · 골짜기 순서로 지나며 깃발을 세 개 꽂게 돼요.",
  },
];

export const RIDE_GOALS = [
  "코스를 끝까지 완주해 깃발 자리를 드러내기",
  "드러난 깃발을 정상 · 골짜기 · 그냥 평평 으로 모두 바르게 분류하기",
  "네 코스를 모두 완주하기",
];

export const RIDE_STEPS: Step[] = [
  {
    id: "rs1",
    kind: "choice",
    ask: "경사계 바늘이 0 을 가리키는 자리(트랙이 평평해지는 곳)에서 늘 일어나는 일은 무엇일까요?",
    options: [
      [{ pre: "반드시 정상 아니면 골짜기다" }],
      [{ pre: "방향이 바뀔 수도 있고, 바뀌지 않고 그대로 이어질 수도 있다" }],
      [{ pre: "반드시 트랙에서 가장 높은 곳이다" }],
      [{ pre: "카트가 그 자리에서 멈춘다" }],
    ],
    answer: 1,
    explains: [
      "'멈칫 미끄럼틀' 을 달려 보세요. 평평해졌다가 다시 오르막으로 이어졌지요.",
      "",
      "'쌍봉 코스' 의 정상은 높이가 2 인데 코스 끝은 4.048 이에요. 가장 높은 곳이 아니지요.",
      "평평한 것은 트랙이지 카트가 아니에요. 카트는 계속 달려요.",
    ],
    hint: "'멈칫 미끄럼틀' 에서 평평해진 뒤 어느 쪽으로 가는지 보세요.",
    done: "평평해지는 것은 정상 · 골짜기의 '후보' 일 뿐이에요.",
  },
  {
    id: "rs2",
    kind: "choice",
    ask: "'쌍봉 코스' 의 정상에 깃발을 꽂았어요. 그 자리를 극대라고 부르는 까닭은 무엇일까요?",
    options: [
      [{ pre: "그 자리에서 트랙이 평평해서" }],
      [{ pre: "트랙 전체에서 가장 높은 곳이어서" }],
      [{ pre: "그 근처에서는 그보다 높은 곳이 없어서" }],
      [{ pre: "그 앞쪽이 오르막이어서" }],
    ],
    answer: 2,
    explains: [
      "평평한 것만으로는 모자라요. '멈칫 미끄럼틀' 이 그 반례였지요.",
      "코스 끝이 더 높았어요. 극대는 '전국 1등' 이 아니라 '동네 1등' 이에요.",
      "",
      "앞이 오르막인 곳은 트랙에 아주 많아요. 뒤가 내리막이기도 해야 해요.",
    ],
    hint: "정상 바로 양옆만 보면 어떤가요? 코스 끝까지 보면 또 어떤가요?",
    done: "다음 탭의 돋보기 창에서 이 '근처' 를 직접 좁혀 봐요.",
  },
  {
    id: "rs3",
    kind: "num",
    ask: "'W 코스' 를 완주하면 깃발을 모두 몇 개 꽂게 될까요?",
    answer: 3,
    unit: "개",
    hint: "골짜기 → 정상 → 골짜기 순서로 지나가요.",
    done: "골짜기 2 개와 정상 1 개, 모두 3 개예요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ③ 돋보기 창 — 극대·극소의 정의
// ══════════════════════════════════════════════════════════════
export type LensSpot = { x: number; kind: FlagKind };
export type LensFn = {
  id: string;
  emoji: string;
  title: string;
  tex: string;
  fn: (x: number) => number;
  from: number;
  to: number;
  /** a 를 고를 수 있는 범위 — 끝점은 열린구간을 양쪽으로 잡을 수 없어 뺀다 */
  aPad: number;
  box: Box;
  spots: LensSpot[];
  topX: number;
  botX: number;
  note: string;
};

export const LENS_W_MIN = 0.1;
export const LENS_W_MAX = 3.5;

export const LENS_FNS: LensFn[] = [
  {
    id: "l1",
    emoji: "🎢",
    title: "구불 트랙",
    tex: "f(x) = x^3 - 3x",
    fn: (x) => x * x * x - 3 * x,
    from: -2.5,
    to: 2.5,
    aPad: 0.5,
    box: { xMin: -2.8, xMax: 2.8, yMin: -9.5, yMax: 9.5, gx: 1, gy: 2 },
    spots: [
      { x: -1, kind: "max" },
      { x: 1, kind: "min" },
    ],
    topX: 2.5,
    botX: -2.5,
    note: "극댓값은 2 인데 이 구간의 최댓값은 8.125 예요. 극대와 최대는 다른 말이에요.",
  },
  {
    id: "l2",
    emoji: "🏞️",
    title: "언덕과 분지",
    tex: "f(x) = x^3 - 6x^2 + 9x",
    fn: (x) => x * x * x - 6 * x * x + 9 * x,
    from: -0.5,
    to: 4.5,
    aPad: 0.5,
    box: { xMin: -0.9, xMax: 4.9, yMin: -7.5, yMax: 11.5, gx: 1, gy: 2 },
    spots: [
      { x: 1, kind: "max" },
      { x: 3, kind: "min" },
    ],
    topX: 4.5,
    botX: -0.5,
    note: "극솟값이 0 이에요. 함숫값이 0 이어도 극값일 수 있지요.",
  },
  {
    id: "l3",
    emoji: "🛝",
    title: "멈칫 미끄럼틀",
    tex: "f(x) = x^3",
    fn: (x) => x * x * x,
    from: -1.6,
    to: 1.6,
    aPad: 0.5,
    box: { xMin: -1.9, xMax: 1.9, yMin: -4.8, yMax: 4.8, gx: 0.5, gy: 1 },
    spots: [{ x: 0, kind: "none" }],
    topX: 1.6,
    botX: -1.6,
    note: "평평한 자리가 있어도 극값이 하나도 없는 함수예요.",
  },
];

export type LensStat = { wLo: number; wHi: number; lo: number; hi: number; isMax: boolean; isMin: boolean };

/** 창 (a-w, a+w) 를 구간 안으로 자른 뒤 그 안의 최고·최저와 f(a) 를 견준다 */
export function windowStat(
  fn: (x: number) => number,
  from: number,
  to: number,
  a: number,
  w: number,
  n = 240,
): LensStat {
  const wLo = Math.max(from, a - w);
  const wHi = Math.min(to, a + w);
  const fa = fn(a);
  let lo = fa;
  let hi = fa;
  for (let i = 0; i <= n; i++) {
    const x = wLo + ((wHi - wLo) * i) / n;
    const y = fn(x);
    if (y < lo) lo = y;
    if (y > hi) hi = y;
  }
  return { wLo, wHi, lo, hi, isMax: fa >= hi - 1e-9, isMin: fa <= lo + 1e-9 };
}

export const LENS_GOALS = [
  "창을 좁혀 '창 안에서 가장 높은' 자리를 찾기 (극대)",
  "창을 좁혀 '창 안에서 가장 낮은' 자리를 찾기 (극소)",
  "창을 넓혀 극댓값보다 더 높은 곳이 구간 안에 있음을 확인하기",
  "아무리 좁혀도 최고도 최저도 아닌 평평한 자리를 찾기",
];

export const LENS_STEPS: Step[] = [
  {
    id: "ls1",
    kind: "choice",
    ask: "x = -1 은 창을 좁히면 '창 안 최고' 였는데 창을 넓히자 깨졌어요. 그래도 x = -1 이 극대인 까닭은?",
    options: [
      [{ pre: "깨졌으므로 사실은 극대가 아니어서" }],
      [{ pre: "모든 창에서 최고여야 하는데 좁은 창을 더 쳐 주어서" }],
      [{ pre: "창을 넓히는 것은 규칙 위반이어서" }],
      [{ pre: "'창 안 최고' 가 되는 창이 하나라도 있으면 극대여서" }],
    ],
    answer: 3,
    explains: [
      "정의는 '어떤 열린구간이 있어서' 라고 말해요. 그런 구간을 하나만 찾으면 돼요.",
      "넓은 창까지 모두 최고여야 한다면 그것은 '최대' 예요. 극대는 그보다 약한 조건이에요.",
      "넓혀 봐도 됩니다. 넓은 창에서 깨지는 것이 바로 극대와 최대의 차이예요.",
      "",
    ],
    hint: "정의의 '어떤 열린구간에 속하는 모든 x' 에서 '어떤' 에 눈길을 두세요.",
    done: "극대는 '동네 1등', 최대는 '전국 1등' 이에요.",
  },
  {
    id: "ls2",
    kind: "num",
    ask: "'구불 트랙' 을 -2.5 ≤ x ≤ 2.5 에서 볼 때 극댓값은 얼마일까요?",
    answer: 2,
    hint: "창을 좁혔을 때 '창 안 최고' 가 되던 자리의 함숫값이에요.",
    done: "극댓값은 2 예요. 같은 구간의 최댓값 8.125 보다 작지요.",
  },
  {
    id: "ls3",
    kind: "choice",
    ask: "'멈칫 미끄럼틀' 의 x = 0 은 창을 아무리 좁혀도 최고도 최저도 아니었어요. 이것이 말해 주는 것은?",
    options: [
      [{ pre: "세제곱이 들어간 함수에는 극값을 따질 수 없다" }],
      [{ pre: "평평한 자리라고 해서 모두 극값인 것은 아니다" }],
      [{ pre: "창이 아직 충분히 좁지 않았을 뿐이다" }],
      [{ tex: "x = 0" }, { post: " 에서 함숫값이 0 이라 극값이 될 수 없다" }],
    ],
    answer: 1,
    explains: [
      "'구불 트랙' 도 세제곱이 들어간 함수지만 극대와 극소를 모두 가졌어요.",
      "",
      "창을 0.1 까지 좁혀도 왼쪽은 늘 더 낮고 오른쪽은 늘 더 높았어요.",
      "함숫값이 0 인 극값도 있어요. '언덕과 분지' 의 극솟값이 바로 0 이지요.",
    ],
    hint: "x = 0 의 왼쪽 값과 오른쪽 값의 부호를 견줘 보세요.",
    done: "다음 탭에서는 이 자리를 도함수의 부호로 다시 봐요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 경사계와 증감표 — 도함수로 판정하기
// ══════════════════════════════════════════════════════════════
export type Crit = { x: number; y: number; kind: FlagKind };
export type SlopeFn = {
  id: string;
  emoji: string;
  title: string;
  tex: string;
  dtex: string;
  fn: (x: number) => number;
  d1: (x: number) => number;
  from: number;
  to: number;
  box: Box;
  dbox: Box;
  crits: Crit[];
  xName: string;
  yName: string;
  note: string;
};

export const SLOPE_FNS: SlopeFn[] = [
  {
    id: "s1",
    emoji: "〰️",
    title: "W 코스 다시 보기",
    tex: "f(x) = \\dfrac{1}{4}x^4 - 2x^2",
    dtex: "f'(x) = x^3 - 4x = x(x+2)(x-2)",
    fn: (x) => 0.25 * x * x * x * x - 2 * x * x,
    d1: (x) => x * x * x - 4 * x,
    from: -3,
    to: 3,
    box: { xMin: -3.3, xMax: 3.3, yMin: -5.2, yMax: 3.2, gx: 1, gy: 1 },
    dbox: { xMin: -3.3, xMax: 3.3, yMin: -16, yMax: 16, gx: 1, gy: 4 },
    crits: [
      { x: -2, y: -4, kind: "min" },
      { x: 0, y: 0, kind: "max" },
      { x: 2, y: -4, kind: "min" },
    ],
    xName: "x",
    yName: "f(x)",
    note: "② 에서 달렸던 W 코스예요. 깃발 자리와 f' 가 0 이 되는 자리가 똑같지요.",
  },
  {
    id: "s2",
    emoji: "🧗",
    title: "쉼 없는 오르막",
    tex: "f(x) = x^3 + 3x",
    dtex: "f'(x) = 3x^2 + 3",
    fn: (x) => x * x * x + 3 * x,
    d1: (x) => 3 * x * x + 3,
    from: -2,
    to: 2,
    box: { xMin: -2.3, xMax: 2.3, yMin: -15.5, yMax: 15.5, gx: 0.5, gy: 5 },
    dbox: { xMin: -2.3, xMax: 2.3, yMin: -2, yMax: 17, gx: 0.5, gy: 4 },
    crits: [],
    xName: "x",
    yName: "f(x)",
    note: "f' 의 그래프가 x 축에 닿지 않아요. 부호가 바뀔 일이 없으니 극값도 없어요.",
  },
  {
    id: "s3",
    emoji: "💰",
    title: "이윤 곡선",
    tex: "P(q) = -q^3 + 9q^2 - 15q",
    dtex: "P'(q) = -3q^2 + 18q - 15 = -3(q-1)(q-5)",
    fn: (q) => -q * q * q + 9 * q * q - 15 * q,
    d1: (q) => -3 * q * q + 18 * q - 15,
    from: 0,
    to: 7,
    box: { xMin: -0.4, xMax: 7.4, yMin: -11, yMax: 29, gx: 1, gy: 5 },
    dbox: { xMin: -0.4, xMax: 7.4, yMin: -40, yMax: 16, gx: 1, gy: 10 },
    crits: [
      { x: 1, y: -7, kind: "min" },
      { x: 5, y: 25, kind: "max" },
    ],
    xName: "q (천 개)",
    yName: "P (만원)",
    note: "생산량을 늘리면 이윤이 한동안 줄다가 q = 1 에서 돌아서고, q = 5 에서 가장 커진 뒤 다시 줄어요.",
  },
];

export const SLOPE_GOALS = [
  "손잡이를 끝까지 끌어 탐사율 100% 만들기",
  "f' 의 부호가 바뀌는 자리를 찾기",
  "세 함수의 증감표를 모두 완성하기",
];

export type TableCell = { from: number; to: number; sign: 1 | -1 };

/** 임계점으로 구간을 잘라 각 토막에서 f' 의 부호를 읽는다 */
export function signCells(s: SlopeFn): TableCell[] {
  const cuts = [s.from, ...s.crits.map((c) => c.x), s.to];
  const out: TableCell[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const lo = cuts[i];
    const hi = cuts[i + 1];
    if (hi - lo < 1e-9) continue;
    out.push({ from: lo, to: hi, sign: s.d1((lo + hi) / 2) > 0 ? 1 : -1 });
  }
  return out;
}

export const SLOPE_STEPS: Step[] = [
  {
    id: "ss1",
    kind: "choice",
    ask: "'이윤 곡선' 에서 P'(q) 의 부호가 음에서 양으로 바뀌는 곳은 q = 1 이었어요. 그 자리의 이윤은 어떤가요?",
    options: [
      [{ pre: "그 앞뒤로 변하지 않는다" }],
      [{ pre: "가장 많아졌다가 줄기 시작한다 (극대)" }],
      [{ pre: "가장 적어졌다가 다시 늘기 시작한다 (극소)" }],
      [{ pre: "부호만으로는 판정할 수 없다" }],
    ],
    answer: 2,
    explains: [
      "부호가 바뀌었으니 증감의 방향도 바뀌어요.",
      "부호가 양에서 음으로 바뀌어야 극대예요. 그 자리는 q = 5 였지요.",
      "",
      "음에서 양으로 또렷하게 바뀌면 그것만으로 극소라고 판정할 수 있어요.",
    ],
    hint: "증감표의 화살표가 어디에서 ↘ 에서 ↗ 로 바뀌는지 보세요.",
    done: "P(1) = -7 만원이 극솟값이에요. 생산을 더 늘리면 이윤이 다시 늘어나요.",
  },
  {
    id: "ss2",
    kind: "num",
    ask: "같은 이윤 곡선에서 이윤이 극대가 되는 생산량 q 는 얼마일까요?",
    answer: 5,
    unit: "천 개",
    hint: "P'(q) = -3(q-1)(q-5) 의 부호가 양에서 음으로 바뀌는 자리예요.",
    done: "q = 5 에서 P(5) = 25 만원이에요. 이 구간에서는 극댓값이 최댓값이기도 해요.",
  },
  {
    id: "ss3",
    kind: "choice",
    ask: "'쉼 없는 오르막' 의 증감표에는 극값이 하나도 없었어요. 까닭은 무엇일까요?",
    options: [
      [{ tex: "f'(x) = 3x^2 + 3" }, { post: " 이 늘 양수라 부호가 바뀌지 않아서" }],
      [{ tex: "f'(x)" }, { post: " 가 0 이 되는 x 가 두 개여서" }],
      [{ pre: "세제곱이 들어간 함수는 극값이 두 개이거나 없어서" }],
      [{ pre: "구간이 좁아 극값이 구간 밖에 있어서" }],
    ],
    answer: 0,
    explains: [
      "",
      "3x² + 3 = 0 을 만족하는 실수 x 는 없어요. f' 의 그래프가 x 축에 닿지 않았지요.",
      "함수의 차수 때문이 아니라 도함수의 부호가 바뀌지 않기 때문이에요.",
      "구간을 아무리 넓혀도 f'(x) 는 계속 양수라 극값이 생기지 않아요.",
    ],
    hint: "아래 f' 그래프가 x 축을 지나는 곳이 있었나요?",
    done: "부호가 바뀌는 자리가 없으면 극값도 없어요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ 평평한 자리 분류소 — 역은 성립하지 않는다
// ══════════════════════════════════════════════════════════════
export const FLAT_PROBE = 0.3;

export type FlatCard = {
  id: string;
  emoji: string;
  title: string;
  tex: string;
  fn: (x: number) => number;
  d1: (x: number) => number;
  a: number;
  box: Box;
  kind: FlagKind;
  why: string;
};

export const FLAT_CARDS: FlatCard[] = [
  {
    id: "f1",
    emoji: "🛝",
    title: "멈칫 미끄럼틀",
    tex: "f(x) = x^3",
    fn: (x) => x * x * x,
    d1: (x) => 3 * x * x,
    a: 0,
    box: { xMin: -1.2, xMax: 1.2, yMin: -1.8, yMax: 1.8, gx: 0.5, gy: 0.5 },
    kind: "none",
    why: "좌우가 모두 양이라 계속 오르막이에요. 평평하기만 하고 방향이 바뀌지 않았어요.",
  },
  {
    id: "f2",
    emoji: "🎢",
    title: "구불 트랙",
    tex: "f(x) = x^3 - 3x",
    fn: (x) => x * x * x - 3 * x,
    d1: (x) => 3 * x * x - 3,
    a: -1,
    box: { xMin: -2.1, xMax: 0.3, yMin: -3.2, yMax: 3.2, gx: 0.5, gy: 1 },
    kind: "max",
    why: "양에서 음으로 바뀌었어요. 올라갔다가 내려가니 극대예요.",
  },
  {
    id: "f3",
    emoji: "🎢",
    title: "구불 트랙",
    tex: "f(x) = x^3 - 3x",
    fn: (x) => x * x * x - 3 * x,
    d1: (x) => 3 * x * x - 3,
    a: 1,
    box: { xMin: -0.3, xMax: 2.1, yMin: -3.2, yMax: 3.2, gx: 0.5, gy: 1 },
    kind: "min",
    why: "음에서 양으로 바뀌었어요. 내려갔다가 올라가니 극소예요.",
  },
  {
    id: "f4",
    emoji: "🪁",
    title: "사차 언덕",
    tex: "f(x) = -x^4 + 4x^3",
    fn: (x) => -x * x * x * x + 4 * x * x * x,
    d1: (x) => -4 * x * x * x + 12 * x * x,
    a: 0,
    box: { xMin: -1.1, xMax: 1.1, yMin: -8, yMax: 5, gx: 0.5, gy: 2 },
    kind: "none",
    why: "f'(x) = 4x²(3-x) 라 x = 0 의 좌우가 모두 양이에요. 잠깐 평평했을 뿐이에요.",
  },
  {
    id: "f5",
    emoji: "🪁",
    title: "사차 언덕",
    tex: "f(x) = -x^4 + 4x^3",
    fn: (x) => -x * x * x * x + 4 * x * x * x,
    d1: (x) => -4 * x * x * x + 12 * x * x,
    a: 3,
    box: { xMin: 2, xMax: 4, yMin: -2, yMax: 30, gx: 0.5, gy: 5 },
    kind: "max",
    why: "같은 함수인데 이 자리에서는 양에서 음으로 바뀌어요. 그래서 극대예요.",
  },
  {
    id: "f6",
    emoji: "〰️",
    title: "W 코스",
    tex: "f(x) = \\dfrac{1}{4}x^4 - 2x^2",
    fn: (x) => 0.25 * x * x * x * x - 2 * x * x,
    d1: (x) => x * x * x - 4 * x,
    a: -2,
    box: { xMin: -3, xMax: -1, yMin: -5, yMax: 3, gx: 0.5, gy: 1 },
    kind: "min",
    why: "왼쪽은 내리막, 오른쪽은 오르막이에요. 첫 골짜기지요.",
  },
  {
    id: "f7",
    emoji: "〰️",
    title: "W 코스",
    tex: "f(x) = \\dfrac{1}{4}x^4 - 2x^2",
    fn: (x) => 0.25 * x * x * x * x - 2 * x * x,
    d1: (x) => x * x * x - 4 * x,
    a: 0,
    box: { xMin: -1.1, xMax: 1.1, yMin: -2.6, yMax: 1, gx: 0.5, gy: 0.5 },
    kind: "max",
    why: "두 골짜기 사이의 봉우리예요. 양에서 음으로 바뀌지요.",
  },
  {
    id: "f8",
    emoji: "〰️",
    title: "W 코스",
    tex: "f(x) = \\dfrac{1}{4}x^4 - 2x^2",
    fn: (x) => 0.25 * x * x * x * x - 2 * x * x,
    d1: (x) => x * x * x - 4 * x,
    a: 2,
    box: { xMin: 1, xMax: 3, yMin: -5, yMax: 3, gx: 0.5, gy: 1 },
    kind: "min",
    why: "음에서 양으로 바뀌는 두 번째 골짜기예요.",
  },
];

export const FLAT_STEPS: Step[] = [
  {
    id: "fs1",
    kind: "choice",
    ask: "여덟 자리를 분류해 보니 'f'(a) = 0' 이라는 사실만으로는 무엇을 알 수 없었나요?",
    options: [
      [{ pre: "그 자리에서 접선이 수평인지" }],
      [{ pre: "그 자리가 극대인지 극소인지, 아니면 극값이 아닌지" }],
      [{ pre: "그 자리의 함숫값 " }, { tex: "f(a)" }],
      [{ pre: "그 함수가 그 자리에서 미분가능한지" }],
    ],
    answer: 1,
    explains: [
      "f'(a) = 0 은 접선의 기울기가 0 이라는 뜻 그대로예요. 그건 바로 알 수 있지요.",
      "",
      "f(a) 는 식에 a 를 넣으면 바로 나와요.",
      "f'(a) 를 쓸 수 있다는 것 자체가 그 자리에서 미분가능하다는 뜻이에요.",
    ],
    hint: "같은 '평평' 인데 판정이 셋으로 갈렸던 것을 떠올려 보세요.",
    done: "좌우의 부호까지 봐야 비로소 판정할 수 있어요.",
  },
  {
    id: "fs2",
    kind: "choice",
    ask: "'멈칫 미끄럼틀' 은 구간 전체에서 증가하는데 f'(0) = 0 이었어요. 이것으로 알 수 있는 것은?",
    options: [
      [{ tex: "x = 0" }, { post: " 에서 " }, { tex: "f" }, { post: " 는 미분가능하지 않다" }],
      [{ pre: "증가하면 모든 점에서 " }, { tex: "f'(x) > 0" }, { post: " 이다" }],
      [{ tex: "f'(x) > 0" }, { post: " 이어도 증가하지 않을 수 있다" }],
      [{ pre: "증가하는 함수라도 어떤 점에서는 " }, { tex: "f'(x) = 0" }, { post: " 일 수 있다" }],
    ],
    answer: 3,
    explains: [
      "f'(x) = 3x² 이라 모든 실수에서 미분가능해요.",
      "바로 그 '역' 이 성립하지 않는다는 것을 이 함수가 보여 주었어요. f'(0) = 0 이니까요.",
      "f'(x) > 0 이면 증가한다는 쪽은 참이에요. 뒤집은 쪽이 거짓이지요.",
      "",
    ],
    hint: "① 탭에서 이 함수를 (-2, 2) 에서 검사했을 때의 결과를 떠올려 보세요.",
    done: "f'(x) > 0 이면 증가 는 참이지만, 증가이면 f'(x) > 0 은 거짓이에요.",
  },
  {
    id: "fs3",
    kind: "num",
    ask: "여덟 자리 가운데 '극값이 아닌' 자리는 몇 개였나요?",
    answer: 2,
    unit: "개",
    hint: "좌우의 부호가 서로 같았던 자리를 세어 보세요.",
    done: "좌우 부호가 같아 방향이 바뀌지 않은 두 자리예요. 평평해도 극값이 아니지요.",
  },
];

export const REAL_NOTE =
  "이윤 곡선의 생산량과 이윤 수치는 개념을 보여 주기 위해 이 활동에서 정한 가상의 값이다.";
