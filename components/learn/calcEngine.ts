// 공학용 계산기 식(expression) 파서 — 고등학교 교과에서 쓰는 계산을 다룬다.
//
//  지원: + − × ÷ ^ ( ) , 단항 −, 암묵적 곱(2π, 3(4+1))
//        상수 π, e, Ans
//        함수 sin cos tan asin acos atan log ln abs √ ∛
//        후위 ! (팩토리얼), % (÷100)
//        중위 P (nPr), C (nCr)
//  각도 단위: DEG / RAD 전환 (삼각함수와 그 역함수에 적용)

export type Tok =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string };

const IDS = ["asin", "acos", "atan", "sin", "cos", "tan", "log", "ln", "abs", "Ans", "π", "e", "√", "∛", "P", "C"];
const FUNCS = new Set(["asin", "acos", "atan", "sin", "cos", "tan", "log", "ln", "abs", "√", "∛"]);

/** 닫히지 않은 괄호를 끝에 채워 준다. */
export function autoClose(expr: string): string {
  let depth = 0;
  for (const c of expr) {
    if (c === "(") depth++;
    else if (c === ")") depth = Math.max(0, depth - 1);
  }
  return expr + ")".repeat(depth);
}

function tokenize(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " ") { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const v = Number(s.slice(i, j));
      if (!Number.isFinite(v)) throw new Error("숫자 오류");
      out.push({ t: "num", v });
      i = j;
      continue;
    }
    const id = IDS.find((k) => s.startsWith(k, i));
    if (id) { out.push({ t: "id", v: id }); i += id.length; continue; }
    if ("+-×÷*/^()!%".includes(c)) {
      out.push({ t: "op", v: c === "*" ? "×" : c === "/" ? "÷" : c });
      i++;
      continue;
    }
    throw new Error("알 수 없는 문자");
  }
  return out;
}

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0 || n > 170) return NaN;
  let r = 1;
  for (let k = 2; k <= n; k++) r *= k;
  return r;
}
function nPr(n: number, r: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(r) || r < 0 || n < 0 || r > n) return NaN;
  let out = 1;
  for (let k = 0; k < r; k++) out *= n - k;
  return out;
}
function nCr(n: number, r: number): number {
  const p = nPr(n, r);
  if (!Number.isFinite(p)) return NaN;
  return p / factorial(r);
}
/** 삼각함수 결과의 미세 오차 정리 (sin 180° = 0) */
function tidy(v: number): number {
  return Math.abs(v) < 1e-12 ? 0 : v;
}

export type EvalOpts = { deg: boolean; ans: number };

/** 식을 계산한다. 형식이 잘못되면 예외를 던진다. */
export function evaluate(expr: string, opts: EvalOpts): number {
  const toks = tokenize(autoClose(expr));
  if (toks.length === 0) throw new Error("빈 식");
  let p = 0;

  const peek = () => toks[p];
  function eatOp(v: string): boolean {
    const t = toks[p];
    if (t && t.t === "op" && t.v === v) { p++; return true; }
    return false;
  }
  function eatId(v: string): boolean {
    const t = toks[p];
    if (t && t.t === "id" && t.v === v) { p++; return true; }
    return false;
  }

  function callFunc(name: string, x: number): number {
    const toRad = opts.deg ? Math.PI / 180 : 1;
    const fromRad = opts.deg ? 180 / Math.PI : 1;
    switch (name) {
      case "sin": return tidy(Math.sin(x * toRad));
      case "cos": return tidy(Math.cos(x * toRad));
      case "tan": {
        // 90°, 270° … 처럼 정의되지 않는 곳에서는 거대한 수 대신 '정의되지 않음'
        if (Math.abs(Math.cos(x * toRad)) < 1e-12) return NaN;
        return tidy(Math.tan(x * toRad));
      }
      case "asin": return Math.asin(x) * fromRad;
      case "acos": return Math.acos(x) * fromRad;
      case "atan": return Math.atan(x) * fromRad;
      case "log": return Math.log10(x);
      case "ln": return Math.log(x);
      case "abs": return Math.abs(x);
      case "√": return Math.sqrt(x);
      case "∛": return Math.cbrt(x);
      default: throw new Error("모르는 함수");
    }
  }

  function parseAtom(): number {
    const t = peek();
    if (!t) throw new Error("식이 끝났어요");
    if (t.t === "num") { p++; return t.v; }
    if (t.t === "op" && t.v === "(") {
      p++;
      const v = parseExpr();
      if (!eatOp(")")) throw new Error("괄호가 안 맞아요");
      return v;
    }
    if (t.t === "id") {
      if (t.v === "π") { p++; return Math.PI; }
      if (t.v === "e") { p++; return Math.E; }
      if (t.v === "Ans") { p++; return opts.ans; }
      if (FUNCS.has(t.v)) {
        p++;
        if (!eatOp("(")) throw new Error("괄호가 필요해요");
        const v = parseExpr();
        if (!eatOp(")")) throw new Error("괄호가 안 맞아요");
        return callFunc(t.v, v);
      }
      throw new Error("자리가 잘못됐어요");
    }
    throw new Error("식을 읽을 수 없어요");
  }

  /** 후위 연산자 ! 와 % */
  function parsePostfix(): number {
    let v = parseAtom();
    for (;;) {
      if (eatOp("!")) v = factorial(v);
      else if (eatOp("%")) v = v / 100;
      else break;
    }
    return v;
  }

  /** 거듭제곱 — 오른쪽 결합, 지수에 단항 − 허용 */
  function parsePower(): number {
    const base = parsePostfix();
    if (eatOp("^")) return Math.pow(base, parseUnary());
    return base;
  }

  function parseUnary(): number {
    if (eatOp("-")) return -parseUnary();
    if (eatOp("+")) return parseUnary();
    return parsePower();
  }

  /** nPr · nCr */
  function parsePC(): number {
    let v = parseUnary();
    for (;;) {
      if (eatId("P")) v = nPr(v, parseUnary());
      else if (eatId("C")) v = nCr(v, parseUnary());
      else break;
    }
    return v;
  }

  /** 다음 토큰이 곱셈을 생략한 인수의 시작인지 (2π, 3(4+1), 2sin(30)) */
  function startsFactor(): boolean {
    const t = peek();
    if (!t) return false;
    if (t.t === "num") return true;
    if (t.t === "op") return t.v === "(";
    return t.v !== "P" && t.v !== "C";
  }

  function parseTerm(): number {
    let v = parsePC();
    for (;;) {
      if (eatOp("×")) v *= parsePC();
      else if (eatOp("÷")) { const d = parsePC(); v = d === 0 ? NaN : v / d; }
      else if (startsFactor()) v *= parsePC();
      else break;
    }
    return v;
  }

  function parseExpr(): number {
    let v = parseTerm();
    for (;;) {
      if (eatOp("+")) v += parseTerm();
      else if (eatOp("-")) v -= parseTerm();
      else break;
    }
    return v;
  }

  const value = parseExpr();
  if (p < toks.length) throw new Error("식이 이상해요");
  return value;
}

/** 버튼으로 한 번에 넣은 덩어리는 지울 때도 한 번에 지운다. */
const CHUNKS = ["asin(", "acos(", "atan(", "×10^(", "^(-1)", "sin(", "cos(", "tan(", "log(", "10^(", "abs(", "ln(", "e^(", "√(", "∛(", "Ans", "(-", "^2"];
export function smartBackspace(expr: string): string {
  for (const c of CHUNKS) {
    if (expr.endsWith(c)) return expr.slice(0, -c.length);
  }
  return expr.slice(0, -1);
}

/** DEG 모드인데 삼각함수 안에 π 를 쓴 흔한 실수인지 */
export function looksLikeDegPiMistake(expr: string, deg: boolean): boolean {
  if (!deg || !expr.includes("π")) return false;
  return /(a?sin|a?cos|a?tan)\(/.test(expr);
}

/** 계산 결과를 사람이 읽기 좋은 문자열로 (부동소수점 찌꺼기 제거) */
export function fmt(v: number): string {
  if (Number.isNaN(v)) return "정의되지 않음";
  if (!Number.isFinite(v)) return v > 0 ? "∞" : "-∞";
  const rounded = Number(v.toPrecision(12));
  if (Math.abs(rounded) >= 1e13 || (rounded !== 0 && Math.abs(rounded) < 1e-9)) return rounded.toExponential(6);
  let s = String(rounded);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

/** 화면 표시용 — 정수부에 천 단위 쉼표 */
export function withComma(s: string): string {
  if (!/^-?[\d,]*\.?\d*$/.test(s)) return s;
  const neg = s.startsWith("-");
  const body = (neg ? s.slice(1) : s).replace(/,/g, "");
  const [int, dec] = body.split(".");
  if (int === "") return s;
  return (neg ? "-" : "") + Number(int).toLocaleString("ko-KR") + (dec !== undefined ? `.${dec}` : "");
}
