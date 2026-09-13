// 역함수와 암호 — 활동 데이터
//
//  [암호와 역함수] 암호를 만드는 일(암호화)을 함수 f 라 하면 그것을 푸는 일(복호화)이 바로 f⁻¹ 이다.
//        f 가 일대일대응이어야 f⁻¹ 이 있으므로, 쓸 만한 암호는 반드시 일대일대응이어야 한다.
//        서로 다른 두 글자가 같은 암호로 바뀌면 받은 사람이 어느 쪽인지 가릴 수 없어 풀 수 없다.
//
//  [일차함수 암호] 알파벳을 A = 1, B = 2, …, Z = 26 으로 보고 f(x) = ax + b 를 씌운다.
//        푸는 것은 f⁻¹(x) = (x − b)/a 이다. a ≠ 0 이면 실수 위에서는 늘 일대일대응이다.
//
//  [카이사르 암호] 알파벳을 k 칸 미는 암호. 26 글자를 한 바퀴 도는 고리로 보므로
//        f(x) = (x + k) mod 26,  f⁻¹(x) = (x − k) mod 26 이다. 미는 일의 역은 당기는 일이다.
//        k = 13 일 때는 f⁻¹ = f 가 되어 같은 일을 두 번 하면 제자리로 온다.
//
//  [아핀 암호] 고리 위에서 f(x) = (ax + b) mod 26 을 쓴다. 여기서는 a 를 아무 수나 쓸 수 없다.
//        26 = 2 × 13 이므로 a 가 짝수이거나 13 의 배수이면 서로 다른 글자가 같은 곳으로 몰려
//        일대일대응이 깨지고 역함수가 없어진다. gcd(a, 26) = 1 인 a 만 쓸 수 있고
//        그런 a 는 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25 의 열두 개다.
//        이때 f⁻¹(x) = a* (x − b) mod 26 이고 a* 는 a a* ≡ 1 (mod 26) 인 수다.
//
//  [비즈네르 암호] 열쇳말의 글자마다 미는 칸 수가 달라지는 카이사르 암호.
//        i 번째 글자에는 f_i(x) = (x + k_i) mod 26 을 쓰므로 자리마다 다른 함수를 씌우는 셈이다.
//        같은 글자가 자리에 따라 다른 암호로 바뀌어 풀기 어렵지만, 열쇳말을 알면
//        자리마다 f_i⁻¹ 을 씌워 그대로 되돌릴 수 있다.

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

export const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** 글자를 0부터 세는 번호로 */
export function idxOf(ch: string): number {
  return ALPHA.indexOf(ch);
}
/** 번호를 글자로 (고리를 한 바퀴 돈다) */
export function letterAt(i: number): string {
  return ALPHA[((i % 26) + 26) % 26];
}
/** 두 수의 최대공약수 */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    [x, y] = [y, x % y];
  }
  return x;
}
/** a x ≡ 1 (mod 26) 인 x — 없으면 null */
export function invMod26(a: number): number | null {
  if (gcd(a, 26) !== 1) return null;
  for (let x = 1; x < 26; x++) if ((a * x) % 26 === 1) return x;
  return null;
}
/** 아핀 암호에서 쓸 수 있는 a */
export const GOOD_A = Array.from({ length: 25 }, (_, i) => i + 1).filter((a) => gcd(a, 26) === 1);

// ══════════════════════════════════════════════════════════════
// 탭 ① 일차함수 암호기 — 교과서 방식 (A = 1, 나머지 연산 없음)
// ══════════════════════════════════════════════════════════════
export type LinFn = {
  id: string;
  tex: string;
  invTex: string;
  a: number;
  b: number;
};

export const LIN_FNS: LinFn[] = [
  { id: "n1", tex: "f(x)=3x-2", invTex: "f^{-1}(x)=\\dfrac{x+2}{3}", a: 3, b: -2 },
  { id: "n2", tex: "f(x)=2x+5", invTex: "f^{-1}(x)=\\dfrac{x-5}{2}", a: 2, b: 5 },
  { id: "n3", tex: "f(x)=4x-1", invTex: "f^{-1}(x)=\\dfrac{x+1}{4}", a: 4, b: -1 },
  { id: "n4", tex: "f(x)=5x+3", invTex: "f^{-1}(x)=\\dfrac{x-3}{5}", a: 5, b: 3 },
];

/** 글자를 1부터 센 번호로 (공백은 0) */
export function numOf(ch: string): number {
  return ch === " " ? 0 : idxOf(ch) + 1;
}
export function linEnc(n: number, fn: LinFn): number {
  return fn.a * n + fn.b;
}
export function linDec(v: number, fn: LinFn): number {
  return (v - fn.b) / fn.a;
}

export const WORDS = ["MATH IS FUN", "GOOD LUCK", "SEE YOU", "OPEN SESAME"];

export type DecTask = {
  id: string;
  fnId: string;
  code: number[];
  choices: string[];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const DEC_TASKS: DecTask[] = [
  {
    id: "d1",
    fnId: "n1",
    code: [37, 1, 58, 22],
    choices: ["MOON", "MATH", "LATE", "MAZE"],
    answer: 1,
    choiceWhy: [
      "첫 글자는 맞지만 뒤의 세 수를 되돌리면 다른 글자가 나와요.",
      "",
      "37 을 되돌리면 13 번째 글자예요. 12 번째가 아닙니다.",
      "세 번째 수 58 을 되돌리면 20 번째 글자입니다.",
    ],
    why: "(37+2)/3 = 13 → M, (1+2)/3 = 1 → A, (58+2)/3 = 20 → T, (22+2)/3 = 8 → H 이므로 MATH 예요.",
  },
  {
    id: "d2",
    fnId: "n1",
    code: [7, 43, 10, 13],
    choices: ["CAGE", "COLD", "CODE", "CAFE"],
    answer: 2,
    choiceWhy: [
      "두 번째 수 43 을 되돌리면 15 번째 글자예요.",
      "세 번째 수 10 을 되돌리면 4 번째 글자입니다.",
      "",
      "두 번째 수를 되돌리면 1 이 아니라 15 가 나와요.",
    ],
    why: "(7+2)/3 = 3 → C, (43+2)/3 = 15 → O, (10+2)/3 = 4 → D, (13+2)/3 = 5 → E 이므로 CODE 예요.",
  },
  {
    id: "d3",
    fnId: "n2",
    code: [43, 47, 33],
    choices: ["SUN", "RUN", "SON", "FUN"],
    answer: 0,
    choiceWhy: [
      "",
      "43 을 되돌리면 19 번째 글자예요. 18 번째가 아닙니다.",
      "두 번째 수 47 을 되돌리면 21 번째 글자입니다.",
      "첫 수를 되돌리면 6 이 아니라 19 가 나와요.",
    ],
    why: "이번에는 f(x) = 2x + 5 라 (43-5)/2 = 19 → S, (47-5)/2 = 21 → U, (33-5)/2 = 14 → N 이에요.",
  },
  {
    id: "d4",
    fnId: "n3",
    code: [31, 19, 47, 47, 59],
    choices: ["HOTEL", "HELLO", "HEART", "HOUSE"],
    answer: 1,
    choiceWhy: [
      "가운데 두 수가 같으니 같은 글자가 이어서 나와야 해요.",
      "",
      "가운데 두 수가 같다는 점에 주목해 보세요.",
      "가운데 두 수가 같으니 같은 글자가 이어집니다.",
    ],
    why: "f(x) = 4x - 1 이라 (31+1)/4 = 8 → H, (19+1)/4 = 5 → E, (47+1)/4 = 12 → L 이 두 번, (59+1)/4 = 15 → O 예요. 같은 수는 같은 글자라는 것이 힌트가 됩니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 카이사르 암호
// ══════════════════════════════════════════════════════════════
export function caesarEnc(s: string, k: number): string {
  return [...s].map((ch) => (ch === " " ? " " : letterAt(idxOf(ch) + k))).join("");
}
export function caesarDec(s: string, k: number): string {
  return caesarEnc(s, -k);
}

export const DIAL = { size: 268, cx: 134, cy: 134, rOut: 120, rMid: 94, rIn: 64, tOut: 107, tIn: 79 };

export type CaesarTask = {
  id: string;
  cipher: string;
  plain: string;
  k: number;
  hint: string;
  why: string;
};

export const CAESAR_TASKS: CaesarTask[] = [
  {
    id: "c1",
    cipher: "PDWK",
    plain: "MATH",
    k: 3,
    hint: "첫 글자 P 가 무엇이 되어야 말이 될지 생각해 보세요. 세 칸만 당기면 됩니다.",
    why: "세 칸씩 밀어 만든 암호예요. 되돌리려면 세 칸 당기면 됩니다. 미는 일의 역함수는 당기는 일이에요.",
  },
  {
    id: "c2",
    cipher: "MJQQT",
    plain: "HELLO",
    k: 5,
    hint: "가운데 두 글자가 같아요. 인사말일지도 모릅니다.",
    why: "다섯 칸 밀어 만든 암호예요. 같은 글자는 같은 암호가 되므로 되풀이되는 글자가 좋은 실마리가 됩니다.",
  },
  {
    id: "c3",
    cipher: "MNUL",
    plain: "STAR",
    k: 20,
    hint: "많이 밀면 알파벳 끝을 지나 A 로 돌아와요. 20 칸쯤 밀어 보세요.",
    why: "스무 칸을 밀면 알파벳 끝을 지나 앞으로 돌아와요. 26 글자를 한 바퀴 도는 고리로 보기 때문입니다.",
  },
  {
    id: "c4",
    cipher: "PBQR",
    plain: "CODE",
    k: 13,
    hint: "열세 칸을 밀어 보세요. 이 암호는 한 번 더 밀면 제자리로 옵니다.",
    why: "열세 칸을 미는 암호는 두 번 씌우면 26 칸이 되어 제자리로 와요. 곧 역함수가 자기 자신인 드문 암호입니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 아핀 암호 — a 를 아무 수나 쓸 수 없다
// ══════════════════════════════════════════════════════════════
export const AFF = { aMin: 1, aMax: 25, bMin: 0, bMax: 25, aInit: 5, bInit: 8 };

export function affEnc(i: number, a: number, b: number): number {
  return ((a * i + b) % 26 + 26) % 26;
}
export function affEncWord(s: string, a: number, b: number): string {
  return [...s].map((ch) => (ch === " " ? " " : letterAt(affEnc(idxOf(ch), a, b)))).join("");
}
/** 암호 글자마다 몇 개의 원래 글자가 몰렸는지 */
export function affHits(a: number, b: number): number[] {
  const cnt = Array.from({ length: 26 }, () => 0);
  for (let i = 0; i < 26; i++) cnt[affEnc(i, a, b)] += 1;
  return cnt;
}

export const AFF_GOALS = [
  "역함수가 있는 a 를 골라 암호를 만들어 보기",
  "짝수인 a 를 골라 글자가 몰리는 것을 보기",
  "a 를 13 으로 두어 가장 심하게 몰리는 것을 보기",
];

export type AffTask = {
  id: string;
  a: number;
  ok: boolean;
  choiceWhy: string[];
  why: string;
};

export const AFF_CHOICES = ["암호를 풀 수 있다", "암호를 풀 수 없다"];

export const AFF_TASKS: AffTask[] = [
  {
    id: "a1",
    a: 3,
    ok: true,
    choiceWhy: ["", "3 과 26 의 공약수는 1 뿐이라 글자가 겹치지 않아요."],
    why: "3 과 26 은 서로소라 스물여섯 글자가 저마다 다른 곳으로 가요. 일대일대응이므로 역함수가 있습니다.",
  },
  {
    id: "a2",
    a: 2,
    ok: false,
    choiceWhy: ["A 와 N 이 모두 같은 글자가 되어 버려요.", ""],
    why: "2 는 26 과 2 를 공약수로 가져요. A 와 N 처럼 13 만큼 떨어진 두 글자가 같은 암호가 되어 되돌릴 수 없습니다.",
  },
  {
    id: "a3",
    a: 5,
    ok: true,
    choiceWhy: ["", "5 와 26 의 공약수는 1 뿐이에요."],
    why: "5 와 26 은 서로소라 일대일대응이 돼요. 실제로 쓰이는 아핀 암호의 흔한 선택입니다.",
  },
  {
    id: "a4",
    a: 13,
    ok: false,
    choiceWhy: ["스물여섯 글자가 단 두 글자로 몰려 버려요.", ""],
    why: "13 은 26 의 약수라 가장 심하게 몰려요. 스물여섯 글자가 단 두 가지 암호 글자로 뭉쳐 도저히 풀 수 없습니다.",
  },
  {
    id: "a5",
    a: 9,
    ok: true,
    choiceWhy: ["", "9 는 홀수이고 13 의 배수도 아니에요."],
    why: "9 와 26 은 서로소예요. 홀수이면서 13 의 배수가 아니면 언제나 쓸 수 있습니다.",
  },
  {
    id: "a6",
    a: 6,
    ok: false,
    choiceWhy: ["짝수라 두 글자씩 짝지어 몰려 버려요.", ""],
    why: "6 은 짝수라 26 과 2 를 공약수로 가져요. 짝수인 a 는 언제나 글자가 몰리므로 쓸 수 없습니다.",
  },
];

/** 탭 ③ 에서 암호로 만들어 볼 말 */
export const AFF_WORDS = ["MATH", "CODE", "PUZZLE"];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 비즈네르 암호
// ══════════════════════════════════════════════════════════════
export function vigEnc(s: string, key: string): string {
  let j = 0;
  return [...s]
    .map((ch) => {
      if (ch === " ") return " ";
      const k = idxOf(key[j % key.length]);
      j += 1;
      return letterAt(idxOf(ch) + k);
    })
    .join("");
}
export function vigDec(s: string, key: string): string {
  let j = 0;
  return [...s]
    .map((ch) => {
      if (ch === " ") return " ";
      const k = idxOf(key[j % key.length]);
      j += 1;
      return letterAt(idxOf(ch) - k);
    })
    .join("");
}
/** 자리마다 몇 칸 미는지 */
export function shiftsOf(s: string, key: string): number[] {
  let j = 0;
  return [...s].map((ch) => {
    if (ch === " ") return -1;
    const k = idxOf(key[j % key.length]);
    j += 1;
    return k;
  });
}

export const VIG_KEYS = ["KEY", "SUN", "MATH"];
export const VIG_WORDS = ["HELLO", "CODE", "MATH", "SECRET"];

export type VigTask = {
  id: string;
  key: string;
  cipher: string;
  plain: string;
  choices: string[];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const VIG_TASKS: VigTask[] = [
  {
    id: "v1",
    key: "KEY",
    cipher: "WERR",
    plain: "MATH",
    choices: ["MOTH", "MATH", "MATE", "MOTE"],
    answer: 1,
    choiceWhy: [
      "두 번째 자리는 4 칸만 당기면 됩니다. O 가 나오지 않아요.",
      "",
      "마지막 자리는 10 칸을 당겨야 해요.",
      "두 자리 모두 당기는 칸 수를 잘못 보았습니다.",
    ],
    why: "열쇳말 KEY 는 10, 4, 24 칸을 뜻해요. W 에서 10 칸, E 에서 4 칸, R 에서 24 칸, R 에서 다시 10 칸을 당기면 MATH 가 됩니다.",
  },
  {
    id: "v2",
    key: "SUN",
    cipher: "UIQW",
    plain: "CODE",
    choices: ["CAGE", "CODE", "CUBE", "CORE"],
    answer: 1,
    choiceWhy: [
      "두 번째 자리를 20 칸 당기면 O 가 나와요.",
      "",
      "세 번째 자리는 13 칸을 당겨야 합니다.",
      "세 번째 자리에서 당기는 칸 수를 잘못 보았어요.",
    ],
    why: "열쇳말 SUN 은 18, 20, 13 칸이에요. 네 번째 글자에서는 열쇳말이 처음으로 돌아가 다시 18 칸을 당깁니다.",
  },
  {
    id: "v3",
    key: "MATH",
    cipher: "TEESA",
    plain: "HELLO",
    choices: ["HEART", "HOTEL", "HELLO", "HOUSE"],
    answer: 2,
    choiceWhy: [
      "세 번째와 네 번째 자리를 당기면 같은 글자가 나옵니다.",
      "두 번째 자리를 0 칸 당기면 E 그대로예요.",
      "",
      "첫 자리를 12 칸 당기면 H 가 나옵니다.",
    ],
    why: "열쇳말 MATH 는 12, 0, 19, 7 칸이에요. 암호에서는 E 와 S 로 달랐지만 되돌리면 둘 다 L 이 됩니다. 같은 글자가 다른 암호로 바뀌는 것이 이 암호의 힘이에요.",
  },
];
