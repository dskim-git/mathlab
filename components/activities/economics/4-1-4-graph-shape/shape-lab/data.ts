// 도함수로 그리는 그래프의 개형 — 활동 데이터
//
// ─── 다루는 개념 ───────────────────────────────────────────
//  그래프의 개형 = 함수의 그래프의 대략적인 모양. 그리는 순서는 넷이다.
//      (1) 도함수 f'(x) 를 구한다.
//      (2) f'(x) = 0 인 x 의 값을 구한다.
//      (3) f(x) 의 증가와 감소를 표로 나타내고 극값을 구한다.
//      (4) y = f(x) 의 그래프의 개형을 그린다.
//  (2)에서 찾은 x 는 극값의 '후보' 일 뿐이고, (3)에서 좌우의 부호가 실제로
//  바뀌는지 보아야 극대·극소가 가려진다. 부호가 바뀌지 않으면 평평하기만 하다.
//
// ─── 쓴 함수 (모두 극값이 정수인 새 함수) ────────────────────
//  수업 자료에 나온 x^3 + 3x^2 - 2,  -2x^3 - 3x^2 - 1,  x^4 - 6x^3 + 11x^2 - 6x,
//  x^3 - 12x + 16,  -x^4 + 8x^2 - 3 과 증감표의 극대 (0, 1) · 극소 (2, -3) 은 쓰지 않았다.
//  같은 단원의 앞 활동(extremum_lab)에서 쓴 함수들도 피했다.
//
//  A  x^3 + 6x^2 + 9x + 2      f' = 3(x+1)(x+3)    극대 (-3, 2)  · 극소 (-1, -2)
//  B  -x^3 + 6x^2 - 9x + 6     f' = -3(x-1)(x-3)   극소 (1, 2)   · 극대 (3, 6)
//  C  x^3 - 9x^2 + 24x - 10    f' = 3(x-2)(x-4)    극대 (2, 10)  · 극소 (4, 6)
//  D  x^3 - 3x^2 + 3x + 1      f' = 3(x-1)^2       x = 1 에서 평평하나 극값 없음, f(1) = 2
//  E  x^3 + x^2 + x            f' = 3x^2 + 2x + 1  판별식 4 - 12 < 0 → 늘 증가, 평평한 자리도 없음
//  F  3x^4 - 8x^3 - 6x^2 + 24x f' = 12(x+1)(x-1)(x-2)
//                              극소 (-1, -19) · 극대 (1, 13) · 극소 (2, 8)
//  G  -x^4 + 2x^2 + 1          f' = -4x(x-1)(x+1)  극대 (-1, 2) · 극소 (0, 1) · 극대 (1, 2)
//  H  2x^3 - 3x^2 - 12x + 7    f' = 6(x-2)(x+1)    극대 (-1, 14) · 극소 (2, -13)
//  I  x^3 + 3x^2 + 2           f' = 3x(x+2)        극대 (-2, 6)  · 극소 (0, 2)
//  J  x^3 + x^2 + x + 2        E 를 위로 2 만큼 옮긴 것 — 늘 증가
//  K  -x^3 + 3x^2 - 3x + 1     f' = -3(x-1)^2      늘 감소 (D 의 음수판)
//  L  -x^4 + 2x^2 + 4          G 를 위로 3 만큼 옮긴 것 — 극값의 x 는 같고 값만 다르다
//
//  검산 (전부 정수):
//      A(-3) = -27 + 54 - 27 + 2 = 2      A(-1) = -1 + 6 - 9 + 2 = -2
//      B(1)  = -1 + 6 - 9 + 6 = 2         B(3)  = -27 + 54 - 27 + 6 = 6
//      C(2)  = 8 - 36 + 48 - 10 = 10      C(4)  = 64 - 144 + 96 - 10 = 6
//      D(1)  = 1 - 3 + 3 + 1 = 2
//      F(-1) = 3 + 8 - 6 - 24 = -19       F(1) = 3 - 8 - 6 + 24 = 13
//      F(2)  = 48 - 64 - 24 + 48 = 8
//      G(-1) = -1 + 2 + 1 = 2             G(0) = 1            G(1) = 2
//      H(-1) = -2 - 3 + 12 + 7 = 14       H(2) = 16 - 12 - 24 + 7 = -13
//      I(-2) = -8 + 12 + 2 = 6            I(0) = 2
//
// ─── 탭 ─────────────────────────────────────────────────────
//  ① 증감표 탐정   증감표 하나에 후보 곡선 넷. 틀린 셋이 어디서 어긋나는지 짚는다.
//                  Q1 정답 A (오답: -A 뒤집힘 / J 극값 없음 / I 극값의 x 가 다름)
//                  Q2 정답 G (오답: -G 뒤집힘 / C 극값이 둘뿐 / L 극값의 값이 다름)
//                  Q3 정답 D (오답: H 극값이 생김 / K 계속 감소 / E 평평한 자리가 없음)
//                  정답 자리는 ③ · ① · ④ 로 흩었다.
//  ② 개형 공장     C · B · F 세 함수를 4단계로 직접 그린다.
//                  1단계 도함수 고르기 → 2단계 f'=0 인 x 입력 → 3단계 좌우 부호 토글
//                  → 4단계 극값 입력 → 통과하면 개형이 왼쪽부터 그려진다.
//                  1단계를 지나면 확정된 f'(x) 를 문제 아래에 계속 띄워 둔다.
//                  2단계에서 틀리면 인수분해한 꼴을 보여 준다(dFactor 로 적고 전개해 검증한다).
//                      C  f' = 3(x-2)(x-4)        B  f' = -3(x-1)(x-3)
//                      F  f' = 12(x+1)(x-1)(x-2)
//  ③ 공학도구      식을 입력하거나 계수 손잡이를 움직여 사차까지 그린다.
//                  [특징점] 을 누르면 극값의 좌표가 찍히고 증감표가 자동으로 만들어진다.
//                  보는 범위는 왼쪽 끝과 오른쪽 끝을 따로 잡는다(-12 ~ 12, 최소 폭 2).
//                  0 을 가운데 두지 않아도 되어 보고 싶은 데만 볼 수 있다.
//                  미션 넷은 모두 손잡이 범위 안에서 이룰 수 있다(검증에서 증인 함수로 확인).
//                      극값 2 개     C  (a3 1, a2 -9, a1 24, a0 -10)   창 0 ~ 6
//                      극값 없는 삼차 E  (a3 1, a2 1, a1 1)              창 -3 ~ 3
//                      극값 3 개     x^4 - 2x^2  (a4 1, a2 -2)          창 -2 ~ 2
//                      극댓값·극솟값이 모두 양수  B  (극소 2, 극대 6)     창 -1 ~ 5
//  ④ 부호 카드     임계점 세 곳(-2, 0, 2)의 사이 구간 넷에 + / - 카드를 놓으면
//                  그 부호대로 곡선이 즉시 그려진다. 목표 넷의 부호를 알아맞힌다.
//                  곡선은 f'(x) = (부호) × ∏ |x - xi| / (1 + |x - xi|) 를 적분해 만든다.
//                  각 인수가 1 보다 작아 양 끝이 치솟지 않고, 임계점에서 정확히 0 이 된다.
//                  결과는 -1 ~ 1 로 정규화해 목표와 바로 견줄 수 있게 했다.
//                      T1  - + - +   극소 · 극대 · 극소
//                      T2  + - + -   극대 · 극소 · 극대
//                      T3  + + - +   평평 · 극대 · 극소
//                      T4  + + + +   평평 셋, 극값 없음
//  ⑤ 짝 맞추기     f 다섯 장과 f' 다섯 장을 짝짓는다. 눈금 숫자를 지워
//                  축의 수가 아니라 모양으로만 맞추게 했다.
//                      A(위로 볼록 포물선형 f', 두 근) · B(아래로 볼록, 두 근)
//                      D(한 점에서 닿는 포물선) · G(삼차) · E(x축에 닿지 않는 포물선)

export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "0";
  const r = Number(v.toFixed(d));
  return String(Object.is(r, -0) ? 0 : r);
}

/**
 * 수치로 구한 값이 정수·반 자리에 아주 가까우면 그 값으로 맞춘다.
 * 그 밖에는 손대지 않는다 — 자리를 깎으면 근의 정밀도가 떨어진다.
 */
export function snap(v: number): number {
  const r = Math.round(v);
  if (Math.abs(v - r) < 1e-7) return r;
  const h = Math.round(v * 2) / 2;
  if (Math.abs(v - h) < 1e-7) return h;
  return v;
}

export type Piece = { pre?: string; tex?: string; post?: string };
export type Box = { xMin: number; xMax: number; yMin: number; yMax: number; gx: number; gy: number };
export type FlagKind = "max" | "min" | "none";
export const FLAG_LABEL: Record<FlagKind, string> = {
  max: "극대",
  min: "극소",
  none: "극값 아님",
};
export const FLAG_EMOJI: Record<FlagKind, string> = { max: "🔺", min: "🔻", none: "▫️" };

// ══════════════════════════════════════════════════════════════
//  다항식 — 상수항부터 담는다  [a0, a1, a2, a3, a4]
// ══════════════════════════════════════════════════════════════
export type Poly = number[];

export function evalPoly(c: Poly, x: number): number {
  let v = 0;
  for (let i = c.length - 1; i >= 0; i--) v = v * x + c[i];
  return v;
}

export function derivPoly(c: Poly): Poly {
  if (c.length <= 1) return [0];
  const out: Poly = [];
  for (let i = 1; i < c.length; i++) out.push(c[i] * i);
  return out;
}

export function polyDegree(c: Poly): number {
  for (let i = c.length - 1; i >= 0; i--) if (Math.abs(c[i]) > 1e-12) return i;
  return 0;
}

/** KaTeX 문자열 — 한글을 넣지 않는다 */
export function polyTex(c: Poly, lhs = "f(x)"): string {
  const parts: string[] = [];
  for (let d = c.length - 1; d >= 0; d--) {
    const v = c[d];
    if (Math.abs(v) < 1e-12) continue;
    const a = Math.abs(v);
    const num = Math.abs(a - 1) < 1e-12 && d > 0 ? "" : String(Number(a.toFixed(6)));
    const xs = d === 0 ? "" : d === 1 ? "x" : `x^{${d}}`;
    const term = `${num}${xs}`;
    if (parts.length === 0) parts.push(v < 0 ? `-${term}` : term);
    else parts.push(v < 0 ? `- ${term}` : `+ ${term}`);
  }
  if (parts.length === 0) parts.push("0");
  return `${lhs} = ${parts.join(" ")}`;
}

/** 입력창에 넣는 평문 — 공학도구의 입력 방식 그대로 */
export function polySrc(c: Poly): string {
  const parts: string[] = [];
  for (let d = c.length - 1; d >= 0; d--) {
    const v = c[d];
    if (Math.abs(v) < 1e-12) continue;
    const a = Math.abs(v);
    const num = Math.abs(a - 1) < 1e-12 && d > 0 ? "" : String(Number(a.toFixed(6)));
    const xs = d === 0 ? "" : d === 1 ? "x" : `x^${d}`;
    const term = `${num}${xs}`;
    if (parts.length === 0) parts.push(v < 0 ? `-${term}` : term);
    else parts.push(v < 0 ? `- ${term}` : `+ ${term}`);
  }
  return parts.length === 0 ? "0" : parts.join(" ");
}

/** k(x - r1)(x - r2)... 를 전개해 계수 배열로 — 인수분해 꼴이 맞는지 검증할 때도 쓴다 */
export function expandFactors(k: number, roots: number[]): Poly {
  let c: Poly = [k];
  for (const r of roots) {
    const next: Poly = new Array(c.length + 1).fill(0);
    for (let i = 0; i < c.length; i++) {
      next[i + 1] += c[i];
      next[i] += -r * c[i];
    }
    c = next;
  }
  return c;
}

/** k(x - r1)(x - r2)... 를 KaTeX 로 — 한글을 넣지 않는다 */
export function factorTex(k: number, roots: number[], lhs = "f'(x)"): string {
  const head = k === 1 ? "" : k === -1 ? "-" : String(k);
  const body = roots
    .map((r) => (r === 0 ? "x" : r > 0 ? `(x - ${fmt(r)})` : `(x + ${fmt(-r)})`))
    .join("");
  return `${lhs} = ${head}${body}`;
}

export type ParsedPoly = { ok: true; c: Poly } | { ok: false; why: string };

/** 사차까지의 다항식만 읽는다 — eval 을 쓰지 않는 손수 만든 해석기 */
export function parsePoly(raw: string): ParsedPoly {
  const s = raw
    .replace(/\s+/g, "")
    .replace(/[−–—]/g, "-")
    .replace(/[Xx]/g, "x")
    .replace(/\*\*/g, "^")
    .replace(/\*/g, "");
  if (s === "") return { ok: false, why: "식을 입력해 주세요. 보기: x^3 + 6x^2 + 9x + 2" };
  if (/[()]/.test(s)) return { ok: false, why: "괄호는 풀어서 입력해 주세요. 보기: x^3 + 6x^2 + 9x + 2" };
  if (/[^0-9x^+\-.]/.test(s)) return { ok: false, why: "x 와 숫자, 그리고 + - ^ 만 쓸 수 있어요." };
  const terms = s.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join("") !== s) return { ok: false, why: "식이 덜 적혔어요. 보기: x^3 + 6x^2 + 9x + 2" };
  const c: Poly = [0, 0, 0, 0, 0];
  for (const t of terms) {
    const m = /^([+-]?)(\d*\.?\d*)(x(?:\^(\d+))?)?$/.exec(t);
    if (!m) return { ok: false, why: `'${t}' 를 읽을 수 없어요.` };
    const sign = m[1] === "-" ? -1 : 1;
    const hasX = m[3] !== undefined;
    const numStr = m[2];
    if (numStr === "" && !hasX) return { ok: false, why: `'${t}' 를 읽을 수 없어요.` };
    const num = numStr === "" ? 1 : Number(numStr);
    if (!Number.isFinite(num)) return { ok: false, why: `'${t}' 의 계수를 읽을 수 없어요.` };
    const deg = hasX ? (m[4] !== undefined ? Number(m[4]) : 1) : 0;
    if (deg > 4) return { ok: false, why: "사차까지만 그릴 수 있어요." };
    c[deg] += sign * num;
  }
  return { ok: true, c };
}

export type Crit = { x: number; y: number; kind: FlagKind };

/**
 * 구간 안에서 f' 의 부호가 바뀌는 자리를 모두 찾는다.
 * 부호가 바뀌는 곳만 극값이므로 f' 가 0 이어도 부호가 그대로면 넣지 않는다.
 */
export function critPoints(c: Poly, from: number, to: number, n = 3000): Crit[] {
  const d = derivPoly(c);
  const out: Crit[] = [];
  let holdX = from;
  let holdS = Math.sign(evalPoly(d, from));
  for (let i = 1; i <= n; i++) {
    const x = from + ((to - from) * i) / n;
    const s = Math.sign(evalPoly(d, x));
    if (s === 0) continue;
    if (holdS === 0) {
      holdS = s;
      holdX = x;
      continue;
    }
    if (s !== holdS) {
      let lo = holdX;
      let hi = x;
      for (let k = 0; k < 90; k++) {
        const mid = (lo + hi) / 2;
        if (Math.sign(evalPoly(d, mid)) === holdS) lo = mid;
        else hi = mid;
      }
      const r = snap((lo + hi) / 2);
      out.push({ x: r, y: snap(evalPoly(c, r)), kind: holdS > 0 ? "max" : "min" });
      holdS = s;
    }
    holdX = x;
  }
  return out;
}

/** f' 가 0 이지만 부호가 바뀌지 않는 자리 — '평평하지만 극값이 아닌' 곳 */
export function flatPoints(c: Poly, from: number, to: number, n = 3000): number[] {
  const d = derivPoly(c);
  const crits = critPoints(c, from, to).map((z) => z.x);
  const out: number[] = [];
  for (let i = 1; i < n; i++) {
    const x0 = from + ((to - from) * (i - 1)) / n;
    const x1 = from + ((to - from) * i) / n;
    const x2 = from + ((to - from) * (i + 1)) / n;
    const a = Math.abs(evalPoly(d, x0));
    const b = Math.abs(evalPoly(d, x1));
    if (b > 1e-6) continue; // 0 근처가 아니면 볼 것도 없다 (일정한 f' 에서 헛돌지 않게)
    const e = Math.abs(evalPoly(d, x2));
    if (!(b <= a && b <= e)) continue;
    // |f'| 가 가장 작아지는 자리를 삼분 탐색으로 더 좁힌다
    let lo = x0;
    let hi = x2;
    for (let k = 0; k < 80; k++) {
      const m1 = lo + (hi - lo) / 3;
      const m2 = hi - (hi - lo) / 3;
      if (Math.abs(evalPoly(d, m1)) < Math.abs(evalPoly(d, m2))) hi = m2;
      else lo = m1;
    }
    const r = snap((lo + hi) / 2);
    if (Math.abs(evalPoly(d, r)) > 1e-7) continue;
    if (crits.some((q) => Math.abs(q - r) < 1e-4)) continue;
    if (out.some((q) => Math.abs(q - r) < 1e-4)) continue;
    out.push(r);
  }
  return out;
}

/** 구간에서 지나는 y 범위를 보고 보기 좋은 상자를 만든다 */
const NICE = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
function niceStep(span: number): number {
  for (const s of NICE) if (span / s <= 9) return s;
  return 2000;
}
export function fitBox(c: Poly, xMin: number, xMax: number): Box {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= 400; i++) {
    const y = evalPoly(c, xMin + ((xMax - xMin) * i) / 400);
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi - lo < 1e-9) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * 0.14;
  const yMin = lo - pad;
  const yMax = hi + pad;
  return {
    xMin,
    xMax,
    yMin,
    yMax,
    gx: niceStep(xMax - xMin),
    gy: niceStep(yMax - yMin),
  };
}

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

/** 임계점으로 구간을 잘라 각 토막에서 f' 의 부호를 읽는다 */
export type SignCell = { from: number; to: number; sign: 1 | -1 };
export function signCells(c: Poly, cuts: number[], from: number, to: number): SignCell[] {
  const d = derivPoly(c);
  const marks = [from, ...cuts, to];
  const out: SignCell[] = [];
  for (let i = 0; i < marks.length - 1; i++) {
    const lo = marks[i];
    const hi = marks[i + 1];
    if (hi - lo < 1e-9) continue;
    out.push({ from: lo, to: hi, sign: evalPoly(d, (lo + hi) / 2) > 0 ? 1 : -1 });
  }
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
//  탭 ① 증감표 탐정
// ══════════════════════════════════════════════════════════════
export type DetectOption = { c: Poly; from: number; to: number; why: string };
export type DetectQ = {
  id: string;
  emoji: string;
  title: string;
  /** 증감표를 만들 기준 — 정답 함수와 그 구간 */
  from: number;
  to: number;
  cuts: number[];
  options: DetectOption[];
  answer: number;
};

export const DETECT_QS: DetectQ[] = [
  {
    id: "dq1",
    emoji: "🔎",
    title: "극대가 먼저 오는 표",
    from: -4.2,
    to: 0.2,
    cuts: [-3, -1],
    answer: 2,
    options: [
      {
        c: [2, 1, 1, 1],
        from: -4.2,
        to: 0.2,
        why: "표에서는 f′ 의 부호가 + → − → + 로 두 번 바뀌는데, 이 그래프는 쉬지 않고 올라가기만 해 극값이 하나도 없어요.",
      },
      {
        c: [-2, -9, -6, -1],
        from: -4.2,
        to: 0.2,
        why: "올라갔다 내려가는 차례가 거꾸로예요. 표에서는 왼쪽 x = -3 이 극대인데 이 그래프는 그 자리가 극소예요.",
      },
      { c: [2, 9, 6, 1], from: -4.2, to: 0.2, why: "" },
      {
        c: [2, 0, 3, 1],
        from: -3.2,
        to: 1.2,
        why: "모양은 비슷하지만 극값이 생기는 x 가 -2 와 0 이라 표의 -3, -1 과 달라요.",
      },
    ],
  },
  {
    id: "dq2",
    emoji: "🏔️",
    title: "극값이 셋인 표",
    from: -1.8,
    to: 1.8,
    cuts: [-1, 0, 1],
    answer: 0,
    options: [
      { c: [1, 0, 2, 0, -1], from: -1.8, to: 1.8, why: "" },
      {
        c: [-1, 0, -2, 0, 1],
        from: -1.8,
        to: 1.8,
        why: "세 자리의 극대와 극소가 모두 뒤바뀌었어요. 표는 극대 · 극소 · 극대 인데 이 그래프는 극소 · 극대 · 극소 예요.",
      },
      {
        c: [-10, 24, -9, 1],
        from: 0.5,
        to: 5.5,
        why: "표에는 극값이 세 개인데 이 그래프는 두 개뿐이에요. 사차가 아니라 삼차의 모양이지요.",
      },
      {
        c: [4, 0, 2, 0, -1],
        from: -1.8,
        to: 1.8,
        why: "극값이 생기는 x 는 맞지만 극댓값·극솟값이 표의 2, 1, 2 와 달라요. 이 그래프는 5, 4, 5 예요.",
      },
    ],
  },
  {
    id: "dq3",
    emoji: "➡️",
    title: "0 이 있는데 극값이 없는 표",
    from: -0.8,
    to: 2.8,
    cuts: [1],
    answer: 3,
    options: [
      {
        c: [7, -12, -3, 2],
        from: -2.5,
        to: 3.5,
        why: "표에서는 x = 1 의 좌우가 모두 + 라 극값이 없는데, 이 그래프는 극대와 극소를 모두 가져요.",
      },
      {
        c: [1, -3, 3, -1],
        from: -0.8,
        to: 2.8,
        why: "표의 f(x) 칸은 내내 ↗ 인데 이 그래프는 내내 내려가요. 부호가 전부 반대예요.",
      },
      {
        c: [0, 1, 1, 1],
        from: -2,
        to: 1.5,
        why: "쉬지 않고 올라가는 것은 맞지만, 표의 x = 1 처럼 접선이 수평이 되는(f′ = 0) 자리가 없어요.",
      },
      { c: [1, 3, -3, 1], from: -0.8, to: 2.8, why: "" },
    ],
  },
];

export const DETECT_GOALS = [
  "증감표와 맞는 개형을 세 문제 모두 찾기",
  "f′ = 0 인 자리가 있어도 극값이 아닐 수 있는 표를 찾아내기",
];

export const DETECT_STEPS: Step[] = [
  {
    id: "ds1",
    kind: "choice",
    ask: "증감표의 f′ 칸만 보고도 그래프의 모양을 알 수 있었어요. f′ 칸이 알려 주는 것은 무엇일까요?",
    options: [
      [{ pre: "그래프가 x 축과 몇 번 만나는지" }],
      [{ pre: "구간마다 그래프가 올라가는지 내려가는지" }],
      [{ pre: "그래프가 지나는 점의 정확한 좌표" }],
      [{ pre: "그래프가 몇 차 함수인지" }],
    ],
    answer: 1,
    explains: [
      "증감표만으로는 알 수 없어요. 같은 증감표라도 위아래로 옮기면 만나는 횟수가 달라져요.",
      "",
      "정확한 좌표는 극값 칸에 적힌 것 말고는 알 수 없어요.",
      "차수는 표에 적혀 있지 않아요. f′ = 0 인 자리의 개수로 짐작만 할 뿐이에요.",
    ],
    hint: "+ 는 증가, − 는 감소예요.",
    done: "f′ 의 부호가 증감의 방향을, 부호가 바뀌는 자리가 극값을 알려 줘요.",
  },
  {
    id: "ds2",
    kind: "choice",
    ask: "세 번째 표에는 x = 1 에서 f′ = 0 인데도 극값이 없었어요. 까닭은 무엇일까요?",
    options: [
      [{ tex: "x = 1" }, { post: " 에서 함숫값이 2 로 0 이 아니어서" }],
      [{ pre: "삼차함수는 극값이 없을 수도 있어서" }],
      [{ tex: "x = 1" }, { post: " 의 좌우에서 " }, { tex: "f'" }, { post: " 의 부호가 모두 + 로 그대로여서" }],
      [{ pre: "표에 적힌 구간이 너무 좁아서" }],
    ],
    answer: 2,
    explains: [
      "함숫값이 얼마인지는 극값 판정과 상관이 없어요.",
      "그 말은 맞지만, 이 표에서 극값이 없는 까닭을 설명해 주지는 않아요.",
      "",
      "구간을 넓혀도 f′ = 3(x − 1)² 은 늘 0 이상이라 부호가 바뀌지 않아요.",
    ],
    hint: "표의 f′ 칸에서 x = 1 의 왼쪽과 오른쪽을 견줘 보세요.",
    done: "f′ = 0 은 극값의 '후보' 일 뿐이고, 좌우에서 부호가 바뀌어야 극값이 돼요.",
  },
  {
    id: "ds3",
    kind: "num",
    ask: "두 번째 문제의 표에는 극값이 모두 몇 개 있었나요?",
    answer: 3,
    unit: "개",
    hint: "f′ 의 부호가 바뀌는 자리를 세어 보세요.",
    done: "사차함수는 극값을 셋까지 가질 수 있어요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ② 개형 공장 — 네 단계
// ══════════════════════════════════════════════════════════════
export type FactoryFn = {
  id: string;
  emoji: string;
  title: string;
  c: Poly;
  from: number;
  to: number;
  /** f' = 0 인 x 를 작은 것부터 */
  cuts: number[];
  /** 1단계 — 도함수 보기 */
  dOptions: Poly[];
  dAnswer: number;
  dExplains: string[];
  /** 2단계에서 막혔을 때 보여 줄 인수분해 꼴 — k(x - r1)(x - r2)... */
  dFactor: { k: number; roots: number[] };
  note: string;
};

export const FACTORY_FNS: FactoryFn[] = [
  {
    id: "k1",
    emoji: "📈",
    title: "언덕 하나와 골짜기 하나",
    c: [-10, 24, -9, 1],
    from: 0.5,
    to: 5.5,
    cuts: [2, 4],
    dOptions: [
      [24, -9, 3],
      [24, -18, 3],
      [24, -18, 1],
      [14, -18, 3],
    ],
    dAnswer: 1,
    dFactor: { k: 3, roots: [2, 4] },
    dExplains: [
      "가운데 항 -9x² 를 미분하면 -18x 예요. 지수 2 를 앞에 곱하는 것을 빠뜨렸어요.",
      "",
      "x³ 을 미분하면 3x² 예요. 지수 3 을 앞에 곱해야 해요.",
      "상수항 -10 을 미분하면 0 이에요. 상수항은 사라집니다.",
    ],
    note: "극댓값 10 과 극솟값 6 이 모두 양수라 그래프가 x 축 위에서만 오르내려요.",
  },
  {
    id: "k2",
    emoji: "🪃",
    title: "뒤집힌 삼차",
    c: [6, -9, 6, -1],
    from: 0,
    to: 4,
    cuts: [1, 3],
    dOptions: [
      [-9, 6, -3],
      [-3, 12, -3],
      [-9, 12, -3],
      [-9, 12, -1],
    ],
    dAnswer: 2,
    dFactor: { k: -3, roots: [1, 3] },
    dExplains: [
      "6x² 을 미분하면 12x 예요. 지수 2 를 앞에 곱해야 해요.",
      "상수항 6 을 미분하면 0 이에요. 상수항은 사라집니다.",
      "",
      "-x³ 을 미분하면 -3x² 예요. 지수 3 을 앞에 곱해야 해요.",
    ],
    note: "최고차항의 계수가 음수라 왼쪽에서 내려오고 오른쪽으로 내려가요. 극소가 먼저, 극대가 나중이지요.",
  },
  {
    id: "k3",
    emoji: "〽️",
    title: "극값이 셋인 사차",
    c: [0, 24, -6, -8, 3],
    from: -1.8,
    to: 2.8,
    cuts: [-1, 1, 2],
    dOptions: [
      [24, -12, -24, 3],
      [0, -12, -24, 12],
      [24, -6, -24, 12],
      [24, -12, -24, 12],
    ],
    dAnswer: 3,
    dFactor: { k: 12, roots: [-1, 1, 2] },
    dExplains: [
      "3x⁴ 을 미분하면 12x³ 이에요. 지수 4 를 앞에 곱해야 해요.",
      "24x 를 미분하면 24 예요. 일차항의 미분을 빠뜨렸어요.",
      "-6x² 을 미분하면 -12x 예요. 지수 2 를 앞에 곱해야 해요.",
      "",
    ],
    note: "f′ 이 삼차식이라 f′ = 0 인 x 가 셋이고, 그 셋에서 모두 부호가 바뀌어 극값이 셋이에요.",
  },
];

export const FACTORY_GOALS = [
  "한 함수의 네 단계를 모두 통과해 개형 그리기",
  "세 함수의 개형을 모두 그리기",
];

export const FACTORY_STEPS: Step[] = [
  {
    id: "fs1",
    kind: "choice",
    ask: "개형을 그리는 네 단계에서 f′(x) = 0 인 x 를 먼저 구하는 까닭은 무엇일까요?",
    options: [
      [{ pre: "그 x 에서 함숫값이 0 이 되어서" }],
      [{ pre: "거기서부터 그래프를 그리기 시작해야 해서" }],
      [{ pre: "그 x 가 그래프와 x 축이 만나는 자리여서" }],
      [{ pre: "증가에서 감소로(또는 그 반대로) 바뀔 수 있는 자리가 거기뿐이어서" }],
    ],
    answer: 3,
    explains: [
      "f′(x) = 0 이지 f(x) = 0 이 아니에요. k1 의 극값은 10 과 6 으로 둘 다 0 이 아니었지요.",
      "그리는 차례와는 상관이 없어요.",
      "x 축과 만나는 자리는 f(x) = 0 을 풀어야 나와요.",
      "",
    ],
    hint: "f′ 가 0 이 되지 않고 지나가는 곳에서는 부호가 바뀔 수 없어요.",
    done: "그래서 2 단계에서 찾은 x 는 극값의 '후보' 가 돼요.",
  },
  {
    id: "fs2",
    kind: "num",
    ask: "'극값이 셋인 사차' 의 도함수 f′(x) = 12x³ − 24x² − 12x + 24 에서 f′(x) = 0 인 x 는 모두 몇 개였나요?",
    answer: 3,
    unit: "개",
    hint: "12(x + 1)(x − 1)(x − 2) 로 인수분해돼요.",
    done: "삼차식이라 많으면 셋까지 나올 수 있고, 여기서는 셋 모두에서 부호가 바뀌었어요.",
  },
  {
    id: "fs3",
    kind: "choice",
    ask: "3 단계에서 좌우의 부호를 적어 보지 않고 2 단계만으로 개형을 그리면 무엇이 잘못될 수 있을까요?",
    options: [
      [{ pre: "평평한 자리를 모두 극값이라고 잘못 볼 수 있다" }],
      [{ pre: "극값의 함숫값을 구할 수 없다" }],
      [{ pre: "도함수를 다시 구해야 한다" }],
      [{ pre: "그래프의 차수를 알 수 없다" }],
    ],
    answer: 0,
    explains: [
      "",
      "함숫값은 그 x 를 f 에 넣으면 바로 나와요.",
      "도함수는 1 단계에서 이미 구했어요.",
      "차수는 처음 식을 보면 알 수 있어요.",
    ],
    hint: "① 탭의 세 번째 문제를 떠올려 보세요.",
    done: "부호가 바뀌는지까지 보아야 극대 · 극소 · 평평이 갈려요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ③ 공학도구 그래프판
// ══════════════════════════════════════════════════════════════
/** 계수 손잡이의 범위 — 미션의 증인 함수가 모두 이 안에 들어온다 */
export const COEF_RANGE: [number, number][] = [
  [-20, 20], // a0
  [-24, 24], // a1
  [-12, 12], // a2
  [-6, 6], // a3
  [-3, 3], // a4
];
/** 보는 범위 — 왼쪽 끝과 오른쪽 끝을 따로 잡는다 */
export const VIEW_MIN = -12;
export const VIEW_MAX = 12;
/** 창이 너무 좁아지지 않게 하는 최소 폭 */
export const VIEW_GAP = 2;

export type ToolPreset = { id: string; label: string; c: Poly; from: number; to: number };
export const TOOL_PRESETS: ToolPreset[] = [
  { id: "t1", label: "언덕과 골짜기", c: [-10, 24, -9, 1], from: 0, to: 6 },
  { id: "t2", label: "뒤집힌 삼차", c: [6, -9, 6, -1], from: -1, to: 5 },
  { id: "t3", label: "평평하지만 극값 없음", c: [1, 3, -3, 1], from: -1, to: 3 },
  { id: "t4", label: "극값이 셋인 사차", c: [0, 24, -6, -8, 3], from: -2, to: 3 },
  { id: "t5", label: "봉우리 둘인 사차", c: [1, 0, 2, 0, -1], from: -2, to: 2 },
];

export type Mission = { id: string; label: string; witness: Poly; from: number; to: number };
/** witness 는 '이렇게 하면 이룰 수 있다' 는 증인 — 검증에서 실제로 조건을 채우는지 본다 */
export const TOOL_MISSIONS: Mission[] = [
  { id: "m1", label: "극값이 두 개인 함수 만들기", witness: [-10, 24, -9, 1], from: 0, to: 6 },
  { id: "m2", label: "극값이 하나도 없는 삼차함수 만들기", witness: [0, 1, 1, 1], from: -3, to: 3 },
  { id: "m3", label: "극값이 세 개인 함수 만들기", witness: [0, 0, -2, 0, 1], from: -2, to: 2 },
  { id: "m4", label: "극댓값과 극솟값이 모두 0 보다 큰 함수 만들기", witness: [6, -9, 6, -1], from: -1, to: 5 },
];

export function missionDone(id: string, c: Poly, crits: Crit[]): boolean {
  if (id === "m1") return crits.length === 2;
  if (id === "m2") return polyDegree(c) === 3 && crits.length === 0;
  if (id === "m3") return crits.length === 3;
  if (id === "m4") return crits.length >= 2 && crits.every((z) => z.y > 0);
  return false;
}

export const TOOL_STEPS: Step[] = [
  {
    id: "ts1",
    kind: "choice",
    ask: "공학도구가 그래프를 바로 그려 주는데도 증감표를 손으로 만들어 보는 것이 도움이 되는 까닭은?",
    options: [
      [{ pre: "공학도구보다 손으로 그리는 쪽이 더 정확해서" }],
      [{ pre: "왜 그 모양이 되는지(어디서 왜 꺾이는지)를 알 수 있어서" }],
      [{ pre: "공학도구는 사차함수를 그리지 못해서" }],
      [{ pre: "증감표가 있으면 식을 몰라도 되어서" }],
    ],
    answer: 1,
    explains: [
      "정확한 그림은 공학도구가 더 잘 그려요. 손으로 그리는 것은 '대략적인 모양' 이지요.",
      "",
      "사차함수도 잘 그려요. 이 화면에서도 그렸지요.",
      "증감표를 만들려면 먼저 식에서 도함수를 구해야 해요.",
    ],
    hint: "'특징점' 단추가 알려 주는 것과, 증감표가 알려 주는 것을 견줘 보세요.",
    done: "도구는 결과를, 증감표는 까닭을 보여 줘요.",
  },
  {
    id: "ts2",
    kind: "num",
    ask: "삼차함수는 극값을 많으면 몇 개까지 가질 수 있을까요?",
    answer: 2,
    unit: "개",
    hint: "f′ 이 이차식이라 f′ = 0 인 x 가 많아야 둘이에요.",
    done: "둘 다 부호가 바뀌면 극대 하나와 극소 하나를 가져요. 손잡이로 직접 확인해 보세요.",
  },
  {
    id: "ts3",
    kind: "choice",
    ask: "계수 손잡이로 상수항만 바꾸면 그래프는 어떻게 될까요?",
    options: [
      [{ pre: "모양은 그대로이고 위아래로만 옮겨진다" }],
      [{ pre: "극값이 생기는 x 가 함께 움직인다" }],
      [{ pre: "극값의 개수가 달라진다" }],
      [{ pre: "좌우로 옮겨진다" }],
    ],
    answer: 0,
    explains: [
      "",
      "상수항을 미분하면 0 이라 f′ 이 바뀌지 않아요. 극값의 x 는 그대로예요.",
      "f′ 이 그대로이므로 부호가 바뀌는 자리의 개수도 그대로예요.",
      "상수항은 세로 방향만 바꿔요.",
    ],
    hint: "상수항을 미분하면 얼마가 되나요?",
    done: "그래서 증감표의 f′ 칸은 그대로이고 극값의 값만 함께 오르내려요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ④ 부호 카드 퍼즐
// ══════════════════════════════════════════════════════════════
export const CARD_XS = [-2, 0, 2];
export const CARD_FROM = -3.4;
export const CARD_TO = 3.4;
export const CARD_BOX: Box = { xMin: -3.6, xMax: 3.6, yMin: -1.3, yMax: 1.3, gx: 1, gy: 0.5 };

export type Sign = 1 | -1;
export type Target = { id: string; emoji: string; label: string; signs: Sign[] };

export const CARD_TARGETS: Target[] = [
  { id: "g1", emoji: "🥣", label: "골짜기 · 봉우리 · 골짜기", signs: [-1, 1, -1, 1] },
  { id: "g2", emoji: "🏔️", label: "봉우리 · 골짜기 · 봉우리", signs: [1, -1, 1, -1] },
  { id: "g3", emoji: "🪜", label: "멈칫하고 다시 오른 뒤 봉우리", signs: [1, 1, -1, 1] },
  { id: "g4", emoji: "🧗", label: "세 번 멈칫하지만 계속 오르막", signs: [1, 1, 1, 1] },
];

/**
 * 부호만으로 개형을 만든다.
 *   f'(x) = (그 구간의 부호) × ∏ |x - xi| / (1 + |x - xi|)
 * 각 인수가 1 보다 작아 양 끝이 치솟지 않고, 임계점에서는 정확히 0 이 된다.
 * 이를 적분한 뒤 -1 ~ 1 로 정규화해 목표와 바로 견줄 수 있게 한다.
 */
export function sketchCurve(signs: Sign[], n = 320): [number, number][] {
  const slope = (x: number): number => {
    let k = 0;
    while (k < CARD_XS.length && x >= CARD_XS[k]) k++;
    let p = 1;
    for (const xi of CARD_XS) {
      const t = Math.abs(x - xi);
      p *= t / (1 + t);
    }
    return signs[k] * p;
  };
  const pts: [number, number][] = [[CARD_FROM, 0]];
  const h = (CARD_TO - CARD_FROM) / n;
  let acc = 0;
  let prev = slope(CARD_FROM);
  for (let i = 1; i <= n; i++) {
    const x = CARD_FROM + i * h;
    const cur = slope(x);
    acc += ((prev + cur) / 2) * h;
    prev = cur;
    pts.push([x, acc]);
  }
  let lo = Infinity;
  let hi = -Infinity;
  for (const [, y] of pts) {
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  const span = Math.max(1e-9, hi - lo);
  return pts.map(([x, y]) => [x, ((y - lo) / span) * 2 - 1] as [number, number]);
}

/** 이웃한 두 구간의 부호로 그 임계점의 판정을 읽는다 */
export function cardKinds(signs: Sign[]): FlagKind[] {
  const out: FlagKind[] = [];
  for (let i = 0; i + 1 < signs.length; i++) {
    const a = signs[i];
    const b = signs[i + 1];
    out.push(a > 0 && b < 0 ? "max" : a < 0 && b > 0 ? "min" : "none");
  }
  return out;
}

export const CARD_GOALS = ["네 가지 목표 모양을 모두 맞추기", "부호가 바뀌지 않는 '평평' 자리를 직접 만들어 보기"];

export const CARD_STEPS: Step[] = [
  {
    id: "cs1",
    kind: "choice",
    ask: "구간의 부호를 + + 로 이어 놓으면 그 사이의 임계점은 어떻게 되나요?",
    options: [
      [{ pre: "극대가 된다" }],
      [{ pre: "극소가 된다" }],
      [{ pre: "접선은 수평이지만 극값은 아니다" }],
      [{ pre: "그런 표는 만들 수 없다" }],
    ],
    answer: 2,
    explains: [
      "극대가 되려면 + 에서 − 로 바뀌어야 해요.",
      "극소가 되려면 − 에서 + 로 바뀌어야 해요.",
      "",
      "만들 수 있어요. 네 번째 목표가 바로 그런 표예요.",
    ],
    hint: "세 번째 · 네 번째 목표를 만들어 보세요.",
    done: "f′ = 0 이어도 부호가 그대로면 잠깐 평평할 뿐이에요.",
  },
  {
    id: "cs2",
    kind: "num",
    ask: "임계점이 세 곳이면 부호를 적을 구간은 모두 몇 개일까요?",
    answer: 4,
    unit: "개",
    hint: "점 세 개가 수직선을 몇 토막으로 자르는지 세어 보세요.",
    done: "임계점이 n 곳이면 구간은 n + 1 개예요.",
  },
  {
    id: "cs3",
    kind: "choice",
    ask: "부호 카드를 모두 뒤집으면(+ 는 − 로, − 는 +로) 그래프는 어떻게 될까요?",
    options: [
      [{ pre: "좌우로 뒤집힌다" }],
      [{ pre: "위아래로 뒤집혀 극대와 극소가 서로 바뀐다" }],
      [{ pre: "아무것도 달라지지 않는다" }],
      [{ pre: "극값의 개수가 줄어든다" }],
    ],
    answer: 1,
    explains: [
      "좌우로 뒤집으려면 임계점의 자리를 바꿔야 해요.",
      "",
      "올라가던 곳이 내려가게 되니 모양이 크게 달라져요.",
      "부호가 바뀌는 자리의 개수는 그대로라 극값의 개수도 그대로예요.",
    ],
    hint: "첫 번째 목표와 두 번째 목표를 견줘 보세요.",
    done: "첫 번째와 두 번째 목표가 바로 그런 짝이에요.",
  },
];

// ══════════════════════════════════════════════════════════════
//  탭 ⑤ f 와 f′ 짝 맞추기
// ══════════════════════════════════════════════════════════════
export type MatchItem = { id: string; c: Poly; from: number; to: number; why: string };

export const MATCH_ITEMS: MatchItem[] = [
  {
    id: "m1",
    c: [2, 9, 6, 1],
    from: -4.2,
    to: 0.2,
    why: "f′ 이 아래로 볼록한 포물선이고 x 축과 -3, -1 에서 만나요. 그래서 f 는 올라갔다 내려갔다 다시 올라가요.",
  },
  {
    id: "m2",
    c: [6, -9, 6, -1],
    from: 0,
    to: 4,
    why: "f′ 이 위로 볼록한 포물선이고 x 축과 1, 3 에서 만나요. 그래서 f 는 내려갔다 올라갔다 다시 내려가요.",
  },
  {
    id: "m3",
    c: [1, 3, -3, 1],
    from: -0.8,
    to: 2.8,
    why: "f′ 이 x 축에 한 점에서 닿기만 해요. 부호가 바뀌지 않아 f 는 잠깐 평평해졌다가 계속 올라가요.",
  },
  {
    id: "m4",
    c: [1, 0, 2, 0, -1],
    from: -1.8,
    to: 1.8,
    why: "f′ 이 삼차 모양으로 x 축을 세 번 가로질러요. 그래서 f 는 극값을 셋 가져요.",
  },
  {
    id: "m5",
    c: [0, 1, 1, 1],
    from: -2,
    to: 1.5,
    why: "f′ 이 x 축 위에만 있어 한 번도 닿지 않아요. 그래서 f 는 쉬지 않고 올라가기만 해요.",
  },
];

/** 왼쪽(f) · 오른쪽(f') 카드를 섞어 두는 차례 — 늘 같은 자리에 두어 수업에서 말하기 쉽게 한다 */
export const MATCH_LEFT_ORDER = [2, 4, 0, 3, 1];
export const MATCH_RIGHT_ORDER = [3, 0, 4, 1, 2];

export const MATCH_GOALS = ["다섯 쌍을 모두 짝짓기", "두 번 이하로 틀리고 끝내기"];

export const MATCH_STEPS: Step[] = [
  {
    id: "ms1",
    kind: "choice",
    ask: "f′ 의 그래프가 x 축보다 위에만 있으면 f 의 그래프는 어떤 모양일까요?",
    options: [
      [{ pre: "쉬지 않고 올라가기만 한다" }],
      [{ pre: "쉬지 않고 내려가기만 한다" }],
      [{ pre: "올라갔다 내려갔다 한다" }],
      [{ pre: "x 축보다 위에만 있다" }],
    ],
    answer: 0,
    explains: [
      "",
      "그것은 f′ 이 x 축보다 아래에만 있을 때예요.",
      "방향이 바뀌려면 f′ 이 x 축을 가로질러야 해요.",
      "f′ 의 위치와 f 의 위치는 다른 이야기예요. f 는 음수일 수도 있어요.",
    ],
    hint: "f′ > 0 이 무슨 뜻이었는지 떠올려 보세요.",
    done: "f′ 의 부호가 f 의 증감을, f′ 과 x 축이 만나는 자리가 f 의 극값 후보를 알려 줘요.",
  },
  {
    id: "ms2",
    kind: "choice",
    ask: "f′ 의 그래프가 x 축에 닿기만 하고 넘어가지 않으면 그 자리에서 f 는 어떻게 되나요?",
    options: [
      [{ pre: "극대가 된다" }],
      [{ pre: "잠깐 평평해졌다가 가던 방향으로 계속 간다" }],
      [{ pre: "극소가 된다" }],
      [{ pre: "그래프가 끊어진다" }],
    ],
    answer: 1,
    explains: [
      "극대가 되려면 f′ 이 x 축을 위에서 아래로 가로질러야 해요.",
      "",
      "극소가 되려면 f′ 이 x 축을 아래에서 위로 가로질러야 해요.",
      "f′ 이 0 이 되는 것과 f 가 끊어지는 것은 아무 상관이 없어요.",
    ],
    hint: "다섯 장 가운데 x 축에 닿기만 하는 f′ 을 찾아보세요.",
    done: "닿기만 하면 부호가 바뀌지 않아 극값이 되지 못해요.",
  },
  {
    id: "ms3",
    kind: "num",
    ask: "f′ 의 그래프가 x 축을 세 번 가로지르면 f 의 극값은 몇 개일까요?",
    answer: 3,
    unit: "개",
    hint: "가로지를 때마다 부호가 한 번씩 바뀌어요.",
    done: "가로지르는 횟수가 곧 극값의 개수예요. 닿기만 하는 것은 세지 않아요.",
  },
];
