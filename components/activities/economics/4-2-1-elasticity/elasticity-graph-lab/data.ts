// 그래프로 보는 탄력성 — 활동 데이터
//
// ─── 다루는 개념 ───────────────────────────────────────────
//  (1) 두 기울기로 보는 탄력성 (교과서 196p)
//      공급의 가격 탄력성은
//          e_s = a f'(a) / f(a) = f'(a) ÷ ( f(a) / a )
//      이고, f'(a) 는 점 A(a, f(a)) 에서의 접선의 기울기,
//      f(a)/a 는 점 A 와 원점을 지나는 직선의 기울기다.
//      그래서 탄력성은 '접선의 기울기 ÷ 원점선의 기울기' 가 된다.
//          접선이 더 가파르다  →  e > 1   탄력적
//          두 선이 포개진다    →  e = 1   단위 탄력적
//          원점선이 더 가파르다 →  0 < e < 1  비탄력적
//      수요에서도 똑같지만 접선의 기울기가 음수라 크기(절댓값)로 견준다.
//
//  (2) 일차 수요곡선의 단위 탄력점은 늘 중점 (교과서 197p 문제2)
//      f(x) = -ax + b (a > 0, b > 0) 의 그래프가
//          x 축과 만나는 점  A(b/a, 0),   y 축과 만나는 점  B(0, b)
//      이고 e_d = ax / (b - ax) = 1 을 풀면  x = b/(2a),  f = b/2 이므로
//          C( b/(2a), b/2 )
//      인데 이것은 선분 AB 의 중점 ( (b/a + 0)/2, (0 + b)/2 ) 와 정확히 같다.
//      a, b 를 어떻게 바꿔도 늘 중점이다.
//      또 e_d 는 x 가 커질수록 커지므로
//          중점보다 왼쪽(값이 쌀 때)  0 < e < 1  비탄력적
//          중점보다 오른쪽(값이 비쌀 때)   e > 1  탄력적
//
//  (3) 탄력성을 좌표평면 위에 나타내기 (교과서 202p 공학도구 활동)
//      가격 t 를 움직이며 점 B( t, e(t) ) 를 찍으면 탄력성이 하나의 곡선(자취)이 된다.
//      그 자취가 가로선 y = 1 과 만나는 x 가 단위 탄력 가격이고,
//      자취가 1 아래인 구간이 비탄력적, 1 위인 구간이 탄력적이다.
//
// ─── 쓴 함수 (수업 자료·앞 활동과 겹치지 않게 새로 골랐다) ──────
//  수업 자료의 f(x) = -2x + 20, f(x) = -x + 6, f(x) = -2x + 4,
//  f(x) = x + 20, f(x) = 3x - 12 는 쓰지 않았다.
//  같은 소단원 앞 활동(elasticity_lab · supply_elasticity_lab)의 함수도 모두 피했다.
//
//  탭 ① 두 기울기 재판소 — 공급곡선 넷 (접선과 원점선을 견준다)
//      확장형 공장  f = 0.5x^2 + 18  f' = x       e = 2x^2/(x^2 + 36)   단위 탄력 x = 6
//          검산 x = 6 : f = 36, f' = 6, 원점선 = 36/6 = 6 → 두 선이 포개진다, e = 1
//               x = 3 : f = 22.5, f' = 3, 원점선 = 7.5 → e = 0.4   비탄력적
//               x = 12: f = 90,  f' = 12, 원점선 = 7.5 → e = 1.6   탄력적
//      대형 농장   f = 2x^2 + 50    f' = 4x      e = 2x^2/(x^2 + 25)   단위 탄력 x = 5
//          검산 x = 5 : f = 100, f' = 20, 원점선 = 20 → e = 1
//               x = 10: f = 250, f' = 40, 원점선 = 25 → e = 1.6
//      창고형 유통  f = 3x + 24      f' = 3       e = x/(x + 8)         늘 비탄력적
//          원점선 = 3 + 24/x 로 늘 접선(3)보다 가파르다
//      부품 공장   f = 0.1x^3       f' = 0.3x^2  e = 3                 늘 탄력적
//          접선이 원점선의 꼭 3 배라 어느 가격에서나 e = 3
//
//  탭 ② 중점의 비밀 — f(x) = -ax + b 의 a, b 를 손잡이로 (처음은 a = 3, b = 36)
//      a = 3, b = 36 이면 A(12, 0), B(0, 36), C(6, 18) 이고 C 는 AB 의 중점이다.
//      가격은 'x 절편 대비 비율' t 로 잡아 t = 0.5 가 정확히 중점이 되게 했다.
//      좌표평면은 x 0~26, y 0~52 로 붙박아 둔다. 눈금을 절편에 맞춰 다시 잡으면
//      직선이 늘 모서리를 잇는 같은 모양이 되어 손잡이를 움직여도 변하지 않는 것처럼 보인다.
//      그래서 b 의 범위를 a 에 맞춰 좁혀 x 절편이 늘 4 ~ 24 안에 들어오게 했다.
//
//  탭 ③ 탄력성 자취 그리기 — 네 곡선. 왼쪽은 f 의 그래프, 오른쪽은 탄력성의 자취.
//      수요곡선 가  f = -x + 8     e = x/(8 - x)        단위 탄력 x = 4     (x 0.5 ~ 6.5)
//      수요곡선 나  f = -2x + 10   e = x/(5 - x)        단위 탄력 x = 2.5   (x 0.5 ~ 4.2)
//      공급곡선 가  f = 2x + 6     e = x/(x + 3)        늘 비탄력적        (x 0.5 ~ 9)
//      공급곡선 나  f = 0.5x^2 + 18 e = 2x^2/(x^2 + 36) 단위 탄력 x = 6     (x 1 ~ 12)
//      검산  수요 가 x = 6.5 → 6.5/1.5 = 4.333 · 수요 나 x = 4.2 → 4.2/0.8 = 5.25
//            공급 가 x = 9 → 9/12 = 0.75 (1 을 넘지 않는다) · 공급 나 x = 12 → 288/180 = 1.6
//
//  탭 ④ 탄력성 사격장 — 목표 탄력성이 되는 가격을 0.1 눈금으로 정확히 맞힌다
//      수요 가  f = -x + 8      e = x/(8 - x)        e 0.25 → x 1.6 · e 1 → x 4   · e 3   → x 6
//      수요 나  f = -2x + 10    e = x/(5 - x)        e 0.25 → x 1   · e 1 → x 2.5 · e 4   → x 4
//      공급 다  f = x^2 + 16    e = 2x^2/(x^2 + 16)  e 0.4  → x 2   · e 1 → x 4   · e 1.6 → x 8
//      검산  x/(8-x) = 0.25 → 4x = 8 - x → x = 1.6     x/(5-x) = 4 → 5x = 20 → x = 4
//            2x^2/(x^2+16) = 0.4 → 2x^2 = 0.4x^2 + 6.4 → 1.6x^2 = 6.4 → x = 2
//            2x^2/(x^2+16) = 1.6 → 0.4x^2 = 25.6 → x^2 = 64 → x = 8
//      아홉 목표가 모두 0.1 눈금에 정확히 떨어진다.
//
//  이 활동의 함수와 수치는 모두 개념을 보여 주기 위해 정한 가상의 값이다.

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  const r = Number(v.toFixed(d));
  return String(Object.is(r, -0) ? 0 : r);
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
//  탄력성
// ══════════════════════════════════════════════════════════════
export type EKind = "elastic" | "unit" | "inelastic";
export const E_LABEL: Record<EKind, string> = {
  elastic: "탄력적",
  unit: "단위 탄력적",
  inelastic: "비탄력적",
};
export const E_EMOJI: Record<EKind, string> = { elastic: "🎈", unit: "⚖️", inelastic: "🧱" };

export function eKind(e: number): EKind {
  if (Math.abs(e - 1) < 1e-9) return "unit";
  return e > 1 ? "elastic" : "inelastic";
}

export type Side = "demand" | "supply";

/** 점 탄력성 — 수요는 음의 부호를 붙이고 공급은 그대로 둔다 */
export function pointE(side: Side, f: (x: number) => number, d1: (x: number) => number, x: number): number {
  const v = (x * d1(x)) / f(x);
  return side === "demand" ? -v : v;
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
//  탭 ① 두 기울기 재판소
// ══════════════════════════════════════════════════════════════
export type Curve = {
  id: string;
  emoji: string;
  title: string;
  tex: string;
  dtex: string;
  f: (x: number) => number;
  d1: (x: number) => number;
  from: number;
  to: number;
  box: Box;
  /** 두 기울기가 같아지는 가격 — 없으면 null */
  unitX: number | null;
  /** 어느 가격에서나 같은 탄력성을 가지면 그 값 */
  constE: number | null;
  note: string;
};

export const CURVES: Curve[] = [
  {
    id: "c1",
    emoji: "🏭",
    title: "확장형 공장",
    tex: "f(x) = 0.5x^2 + 18",
    dtex: "f'(x) = x",
    f: (x) => 0.5 * x * x + 18,
    d1: (x) => x,
    from: 1,
    to: 12,
    box: { xMin: 0, xMax: 13, yMin: 0, yMax: 100, gx: 2, gy: 20 },
    unitX: 6,
    constE: null,
    note: "값이 쌀 때는 원점선이 더 가파르고, 비싸지면 접선이 더 가파르게 돌아서요.",
  },
  {
    id: "c2",
    emoji: "🌾",
    title: "대형 농장",
    tex: "f(x) = 2x^2 + 50",
    dtex: "f'(x) = 4x",
    f: (x) => 2 * x * x + 50,
    d1: (x) => 4 * x,
    from: 1,
    to: 10,
    box: { xMin: 0, xMax: 11, yMin: 0, yMax: 270, gx: 2, gy: 50 },
    unitX: 5,
    constE: null,
    note: "두 선이 포개지는 자리가 꼭 하나 있어요. 거기가 단위 탄력 가격이지요.",
  },
  {
    id: "c3",
    emoji: "📦",
    title: "창고형 유통",
    tex: "f(x) = 3x + 24",
    dtex: "f'(x) = 3",
    f: (x) => 3 * x + 24,
    d1: () => 3,
    from: 1,
    to: 14,
    box: { xMin: 0, xMax: 15, yMin: 0, yMax: 70, gx: 2, gy: 20 },
    unitX: null,
    constE: null,
    note: "원점선의 기울기는 3 + 24/x 라 접선(3)보다 늘 가파라요. 그래서 어느 가격에서나 비탄력적이에요.",
  },
  {
    id: "c4",
    emoji: "🔧",
    title: "부품 공장",
    tex: "f(x) = 0.1x^3",
    dtex: "f'(x) = 0.3x^2",
    f: (x) => 0.1 * x * x * x,
    d1: (x) => 0.3 * x * x,
    from: 2,
    to: 10,
    box: { xMin: 0, xMax: 11, yMin: 0, yMax: 110, gx: 2, gy: 20 },
    unitX: null,
    constE: 3,
    note: "접선이 원점선의 꼭 3 배로 가파라요. 그래서 어느 가격에서나 e = 3 이지요.",
  },
];

export const CURVE_GOALS = [
  "접선이 더 가파른 자리를 찾기 (탄력적)",
  "원점선이 더 가파른 자리를 찾기 (비탄력적)",
  "두 선이 포개지는 자리를 정확히 맞히기 (단위 탄력적)",
  "어느 가격에서나 두 기울기의 비가 같은 곡선을 찾기",
];

export const CURVE_STEPS: Step[] = [
  {
    id: "cu1",
    kind: "choice",
    ask: "탄력성 식을 두 기울기로 바꿔 쓰면 어떻게 될까요?",
    options: [
      [{ pre: "두 기울기의 합" }],
      [{ pre: "(원점선의 기울기) ÷ (접선의 기울기)" }],
      [{ pre: "(접선의 기울기) ÷ (원점선의 기울기)" }],
      [{ pre: "접선의 기울기 그 자체" }],
    ],
    answer: 2,
    explains: [
      "더하기가 아니라 나누기예요.",
      "거꾸로예요. 그렇게 하면 탄력적일 때 1 보다 작아져요.",
      "",
      "같은 기울기라도 원점선이 어떤가에 따라 탄력성이 달라져요.",
    ],
    hint: "f(x)/x 가 원점선의 기울기예요. x f′(x)/f(x) 를 f′(x) ÷ (f(x)/x) 로 고쳐 보세요.",
    done: "그래서 두 선 가운데 어느 쪽이 더 가파른지만 봐도 판정할 수 있어요.",
  },
  {
    id: "cu2",
    kind: "choice",
    ask: "접선과 원점선이 완전히 포개지는 자리에서 탄력성은 얼마일까요?",
    options: [
      [{ pre: "0 이다" }],
      [{ pre: "1 이다" }],
      [{ pre: "한없이 커진다" }],
      [{ pre: "정할 수 없다" }],
    ],
    answer: 1,
    explains: [
      "두 기울기가 모두 0 일 때만 그렇고, 여기서는 그렇지 않아요.",
      "",
      "두 기울기가 같으니 비는 1 이에요.",
      "두 기울기를 모두 읽을 수 있으니 정할 수 있어요.",
    ],
    hint: "같은 수를 같은 수로 나누면 얼마인가요?",
    done: "두 선이 포개지면 비가 1 — 단위 탄력적이에요.",
  },
  {
    id: "cu3",
    kind: "num",
    ask: "'확장형 공장' f(x) = 0.5x² + 18 에서 두 선이 포개지는 가격은 얼마일까요?",
    answer: 6,
    hint: "f′(x) = x 와 f(x)/x = 0.5x + 18/x 를 같다고 놓아 보세요.",
    done: "x = 6 에서 둘 다 기울기가 6 이에요. f(6) = 36 이니 원점선도 36 ÷ 6 = 6 이지요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 중점의 비밀
// ══════════════════════════════════════════════════════════════
export const MID_A_MIN = 1;
export const MID_A_MAX = 6;
export const MID_B_MIN = 12;
export const MID_B_MAX = 48;
export const MID_B_STEP = 2;
export const MID_A0 = 3;
export const MID_B0 = 36;
/** 가격은 'x 절편 대비 비율' 로 잡는다 — t = 0.5 가 정확히 중점이 된다 */
export const MID_T_STEP = 0.05;

/**
 * b 의 범위를 a 에 맞춰 좁힌다.
 * x 절편 b/a 가 늘 4 ~ 24 사이에 머물러야 아래의 고정 눈금 안에서 직선이 또렷이 보인다.
 *   a = 1 → b 12 ~ 24 (x 절편 12 ~ 24)   a = 2 → b 12 ~ 48 (6 ~ 24)
 *   a = 3 → b 12 ~ 48 (4 ~ 16)          a = 4 → b 16 ~ 48 (4 ~ 12)
 *   a = 5 → b 20 ~ 48 (4 ~ 9.6)         a = 6 → b 24 ~ 48 (4 ~ 8)
 * 네 끝값이 모두 2 의 배수라 손잡이 눈금에 정확히 떨어진다.
 */
export function bLo(a: number): number {
  return Math.max(MID_B_MIN, 4 * a);
}
export function bHi(a: number): number {
  return Math.min(MID_B_MAX, 24 * a);
}

/**
 * 고정 좌표평면.
 * 손잡이를 움직일 때마다 눈금을 다시 잡으면 직선이 늘 상자의 모서리를 잇는 같은 모양이 되어
 * 아무것도 변하지 않는 것처럼 보인다. 그래서 눈금을 붙박아 두고 직선만 움직이게 한다.
 */
export const MID_BOX: Box = { xMin: 0, xMax: 26, yMin: 0, yMax: 52, gx: 5, gy: 10 };

export const MID_GOALS = [
  "t = 0.5 로 맞춰 단위 탄력 가격이 선분 AB 의 중점임을 확인하기",
  "중점보다 왼쪽이 비탄력적임을 확인하기",
  "중점보다 오른쪽이 탄력적임을 확인하기",
  "a 나 b 를 바꿔 세 가지 이상의 수요곡선에서 중점을 확인하기",
];

export const MID_STEPS: Step[] = [
  {
    id: "mi1",
    kind: "num",
    ask: "f(x) = -3x + 36 에서 수요가 단위 탄력적이 되는 가격 x 는 얼마일까요?",
    answer: 6,
    hint: "x 절편은 12, y 절편은 36 이에요. 그 둘을 이은 선분의 중점을 생각해 보세요.",
    done: "x = 6 이에요. A(12, 0) 과 B(0, 36) 의 중점이 (6, 18) 이지요.",
  },
  {
    id: "mi2",
    kind: "choice",
    ask: "단위 탄력점 C 가 늘 선분 AB 의 중점인 까닭은 무엇일까요?",
    options: [
      [{ pre: "a 와 b 가 늘 같은 값이어서" }],
      [{ pre: "삼각형의 성질이어서" }],
      [{ pre: "우연히 그렇게 맞아떨어진 것이어서" }],
      [
        { tex: "e = 1" },
        { post: " 을 풀면 " },
        { tex: "x = \\dfrac{b}{2a}" },
        { post: " 인데, A" },
        { tex: "\\left(\\dfrac{b}{a}, 0\\right)" },
        { post: " 와 B(0, b) 의 중점도 바로 그 점이어서" },
      ],
    ],
    answer: 3,
    explains: [
      "a 와 b 를 서로 다르게 두어도 늘 중점이었어요.",
      "삼각형과는 상관없이 식을 풀면 바로 나와요.",
      "손잡이를 아무리 움직여도 늘 중점이니 우연이 아니에요.",
      "",
    ],
    hint: "ax / (b - ax) = 1 을 풀어 x 를 구해 보세요.",
    done: "두 좌표가 똑같이 나와요. 그래서 a, b 를 어떻게 바꿔도 늘 중점이에요.",
  },
  {
    id: "mi3",
    kind: "choice",
    ask: "일차 수요곡선에서 중점보다 왼쪽(값이 쌀 때)의 수요는 어떤가요?",
    options: [
      [{ pre: "탄력적" }],
      [{ pre: "비탄력적" }],
      [{ pre: "단위 탄력적" }],
      [{ pre: "가격만으로는 알 수 없다" }],
    ],
    answer: 1,
    explains: [
      "오른쪽(값이 비쌀 때)이 탄력적이에요.",
      "",
      "단위 탄력적인 곳은 중점 딱 한 점이에요.",
      "일차 수요곡선에서는 중점을 기준으로 또렷하게 갈려요.",
    ],
    hint: "t 를 0.5 보다 작게 두고 탄력성을 읽어 보세요.",
    done: "중점을 기준으로 왼쪽은 비탄력적, 오른쪽은 탄력적이에요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ③ 탄력성 자취 그리기
// ══════════════════════════════════════════════════════════════
export type TraceFn = {
  id: string;
  emoji: string;
  title: string;
  side: Side;
  tex: string;
  dtex: string;
  f: (x: number) => number;
  d1: (x: number) => number;
  from: number;
  to: number;
  /** 왼쪽 — 함수의 그래프 */
  box: Box;
  /** 오른쪽 — 탄력성의 자취 */
  ebox: Box;
  unitX: number | null;
  note: string;
};

export const TRACE_STEP = 0.1;

export const TRACE_FNS: TraceFn[] = [
  {
    id: "t1",
    emoji: "📉",
    title: "수요곡선 가",
    side: "demand",
    tex: "f(x) = -x + 8",
    dtex: "f'(x) = -1",
    f: (x) => -x + 8,
    d1: () => -1,
    from: 0.5,
    to: 6.5,
    box: { xMin: 0, xMax: 7, yMin: 0, yMax: 9, gx: 1, gy: 2 },
    ebox: { xMin: 0, xMax: 7, yMin: 0, yMax: 5, gx: 1, gy: 1 },
    unitX: 4,
    note: "자취가 y = 1 을 지나는 x = 4 가 단위 탄력 가격이에요. 그 왼쪽은 비탄력, 오른쪽은 탄력이지요.",
  },
  {
    id: "t2",
    emoji: "📉",
    title: "수요곡선 나",
    side: "demand",
    tex: "f(x) = -2x + 10",
    dtex: "f'(x) = -2",
    f: (x) => -2 * x + 10,
    d1: () => -2,
    from: 0.5,
    to: 4.2,
    box: { xMin: 0, xMax: 5.5, yMin: 0, yMax: 10.5, gx: 1, gy: 2 },
    ebox: { xMin: 0, xMax: 5.5, yMin: 0, yMax: 6, gx: 1, gy: 1 },
    unitX: 2.5,
    note: "기울기가 가팔라도 자취의 모양은 닮았어요. 단위 탄력 가격만 2.5 로 옮겨 갔지요.",
  },
  {
    id: "t3",
    emoji: "📈",
    title: "공급곡선 가",
    side: "supply",
    tex: "f(x) = 2x + 6",
    dtex: "f'(x) = 2",
    f: (x) => 2 * x + 6,
    d1: () => 2,
    from: 0.5,
    to: 9,
    box: { xMin: 0, xMax: 10, yMin: 0, yMax: 26, gx: 2, gy: 5 },
    ebox: { xMin: 0, xMax: 10, yMin: 0, yMax: 1.2, gx: 2, gy: 0.2 },
    unitX: null,
    note: "자취가 y = 1 에 닿지 못하고 아래에서만 올라가요. 어느 가격에서나 비탄력적이지요.",
  },
  {
    id: "t4",
    emoji: "📈",
    title: "공급곡선 나",
    side: "supply",
    tex: "f(x) = 0.5x^2 + 18",
    dtex: "f'(x) = x",
    f: (x) => 0.5 * x * x + 18,
    d1: (x) => x,
    from: 1,
    to: 12,
    box: { xMin: 0, xMax: 13, yMin: 0, yMax: 100, gx: 2, gy: 20 },
    ebox: { xMin: 0, xMax: 13, yMin: 0, yMax: 2.4, gx: 2, gy: 0.4 },
    unitX: 6,
    note: "① 에서 두 선이 포개졌던 x = 6 에서 자취가 y = 1 을 지나요. 같은 이야기를 다르게 그린 셈이에요.",
  },
];

export const TRACE_GOALS = [
  "자취를 끝까지 그려 보기",
  "자취가 y = 1 을 지나는 가격을 찾기",
  "자취가 y = 1 에 닿지 않는 곡선을 찾기",
  "네 곡선의 자취를 모두 그려 보기",
];

export const TRACE_STEPS: Step[] = [
  {
    id: "tr1",
    kind: "choice",
    ask: "탄력성의 자취가 가로선 y = 1 과 만나는 점은 무엇을 뜻할까요?",
    options: [
      [{ pre: "그 가격에서 단위 탄력적이다" }],
      [{ pre: "그 가격에서 수요량이 1 이다" }],
      [{ pre: "가격이 1 인 자리다" }],
      [{ pre: "그 가격에서 수입이 1 이다" }],
    ],
    answer: 0,
    explains: [
      "",
      "자취의 세로축은 수요량이 아니라 탄력성이에요.",
      "가로축이 가격이고 세로축이 탄력성이에요.",
      "수입은 이 그림에 나타나 있지 않아요.",
    ],
    hint: "자취의 세로축이 무엇인지 보세요.",
    done: "자취가 1 을 지나는 x 가 바로 단위 탄력 가격이에요.",
  },
  {
    id: "tr2",
    kind: "choice",
    ask: "'공급곡선 가' 의 자취는 y = 1 과 한 번도 만나지 않았어요. 뜻하는 것은?",
    options: [
      [{ pre: "자취를 더 길게 그리면 언젠가 만난다" }],
      [{ pre: "어느 가격에서나 탄력적이다" }],
      [{ pre: "어느 가격에서나 비탄력적이다" }],
      [{ pre: "탄력성을 정할 수 없다" }],
    ],
    answer: 2,
    explains: [
      "e = x/(x + 3) 은 x 를 아무리 키워도 1 보다 작아요. 1 에 가까워질 뿐이지요.",
      "자취가 1 아래에 있으니 탄력적이 아니에요.",
      "",
      "어느 가격에서나 값이 또렷하게 나와요.",
    ],
    hint: "자취가 1 보다 위에 있나요, 아래에 있나요?",
    done: "절편이 양수인 일차 공급곡선은 어디서나 비탄력적이에요.",
  },
  {
    id: "tr3",
    kind: "num",
    ask: "'수요곡선 가' f(x) = -x + 8 에서 자취가 y = 1 을 지나는 가격은 얼마일까요?",
    answer: 4,
    hint: "x / (8 - x) = 1 을 풀어 보세요.",
    done: "x = 4 예요. 수요곡선의 x 절편 8 의 절반이지요 — ② 의 중점이에요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 탄력성 사격장
// ══════════════════════════════════════════════════════════════
export type Target = { e: number; x: number };
export type Range = {
  id: string;
  emoji: string;
  title: string;
  side: Side;
  tex: string;
  f: (x: number) => number;
  d1: (x: number) => number;
  from: number;
  to: number;
  box: Box;
  ebox: Box;
  targets: Target[];
};

export const RANGE_STEP = 0.1;

export const RANGES: Range[] = [
  {
    id: "r1",
    emoji: "📉",
    title: "수요곡선 가",
    side: "demand",
    tex: "f(x) = -x + 8",
    f: (x) => -x + 8,
    d1: () => -1,
    from: 0.5,
    to: 6.5,
    box: { xMin: 0, xMax: 7, yMin: 0, yMax: 9, gx: 1, gy: 2 },
    ebox: { xMin: 0, xMax: 7, yMin: 0, yMax: 5, gx: 1, gy: 1 },
    targets: [
      { e: 0.25, x: 1.6 },
      { e: 1, x: 4 },
      { e: 3, x: 6 },
    ],
  },
  {
    id: "r2",
    emoji: "📉",
    title: "수요곡선 나",
    side: "demand",
    tex: "f(x) = -2x + 10",
    f: (x) => -2 * x + 10,
    d1: () => -2,
    from: 0.5,
    to: 4.2,
    box: { xMin: 0, xMax: 5.5, yMin: 0, yMax: 10.5, gx: 1, gy: 2 },
    ebox: { xMin: 0, xMax: 5.5, yMin: 0, yMax: 6, gx: 1, gy: 1 },
    targets: [
      { e: 0.25, x: 1 },
      { e: 1, x: 2.5 },
      { e: 4, x: 4 },
    ],
  },
  {
    id: "r3",
    emoji: "📈",
    title: "공급곡선 다",
    side: "supply",
    tex: "f(x) = x^2 + 16",
    f: (x) => x * x + 16,
    d1: (x) => 2 * x,
    from: 1,
    to: 10,
    box: { xMin: 0, xMax: 11, yMin: 0, yMax: 130, gx: 2, gy: 20 },
    ebox: { xMin: 0, xMax: 11, yMin: 0, yMax: 2.2, gx: 2, gy: 0.4 },
    targets: [
      { e: 0.4, x: 2 },
      { e: 1, x: 4 },
      { e: 1.6, x: 8 },
    ],
  },
];

export const RANGE_GOALS = ["한 곡선의 세 목표를 모두 맞히기", "아홉 목표를 모두 맞히기"];

export const RANGE_STEPS: Step[] = [
  {
    id: "ra1",
    kind: "choice",
    ask: "같은 수요곡선에서 목표 탄력성을 크게 할수록 찾아야 할 가격은 어떻게 될까요?",
    options: [
      [{ pre: "더 낮아진다" }],
      [{ pre: "그대로다" }],
      [{ pre: "들쭉날쭉하다" }],
      [{ pre: "더 높아진다" }],
    ],
    answer: 3,
    explains: [
      "값이 쌀수록 비탄력적이었어요. 거꾸로예요.",
      "목표가 달라지면 가격도 달라져요.",
      "자취가 꾸준히 올라가는 곡선이라 들쭉날쭉하지 않아요.",
      "",
    ],
    hint: "③ 의 자취가 오른쪽으로 갈수록 어떻게 되었나요?",
    done: "자취가 오른쪽으로 갈수록 올라가니 목표가 클수록 가격도 커져요.",
  },
  {
    id: "ra2",
    kind: "num",
    ask: "f(x) = -2x + 10 에서 수요의 가격 탄력성이 4 가 되는 가격은 얼마일까요?",
    answer: 4,
    hint: "x / (5 - x) = 4 를 풀어 보세요.",
    done: "5x = 20 이니 x = 4 예요.",
  },
  {
    id: "ra3",
    kind: "choice",
    ask: "'공급곡선 다' f(x) = x² + 16 은 가격이 오를수록 탄력성이 커졌어요. 까닭은?",
    options: [
      [
        { tex: "\\varepsilon_s = \\dfrac{2}{1 + 16/x^2}" },
        { post: " 로 고쳐 쓰면 x 가 커질수록 " },
        { tex: "16/x^2" },
        { post: " 이 작아져서" },
      ],
      [{ pre: "공급량이 줄어들어서" }],
      [{ pre: "접선이 점점 평평해져서" }],
      [{ pre: "우연히 그렇게 되어서" }],
    ],
    answer: 0,
    explains: [
      "",
      "값이 오르면 공급량은 늘어요.",
      "접선은 오히려 점점 가팔라져요.",
      "식을 고쳐 쓰면 까닭이 또렷하게 보여요.",
    ],
    hint: "분모와 분자를 x² 으로 나눠 보세요.",
    done: "x 가 아주 커지면 e 는 2 에 가까워져요. 그래도 2 를 넘지는 못하지요.",
  },
];

export const REAL_NOTE =
  "이 활동에 나오는 수요함수 · 공급함수와 수치는 개념을 보여 주기 위해 정한 가상의 값이다.";
