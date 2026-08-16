// 현재가치와 할인율 — 활동 데이터
//
//  · 현재가치(present value): 미래 어느 시점에서의 금액과 같은 가치를 갖는 현재 시점의 금액
//  · 미래가치(future value): 과거(현재) 어느 시점에서의 금액과 같은 가치를 갖는 미래 시점의 금액
//  · 이자율은 (현재가치 ⇒ 미래가치), 할인율은 (미래가치 ⇒ 현재가치)에 적용한다.
//
//   단리:  S = A(1 + rn)      ⇄   A = S / (1 + rn)
//   복리:  S = A(1 + r)ⁿ      ⇄   A = S / (1 + r)ⁿ

export type Method = "simple" | "compound";

export const METHOD_LABEL: Record<Method, { name: string; fv: string; pv: string }> = {
  simple: { name: "단리", fv: "S = A(1 + rn)", pv: "A = S ÷ (1 + rn)" },
  compound: { name: "복리", fv: "S = A(1 + r)ⁿ", pv: "A = S ÷ (1 + r)ⁿ" },
};

/** 미래가치 */
export function futureValue(a: number, r: number, n: number, m: Method): number {
  return m === "simple" ? a * (1 + r * n) : a * Math.pow(1 + r, n);
}
/** 현재가치 */
export function presentValue(s: number, r: number, n: number, m: Method): number {
  return m === "simple" ? s / (1 + r * n) : s / Math.pow(1 + r, n);
}
/** 미래가치와 현재가치를 알 때의 할인율(= 이자율) */
export function impliedRate(a: number, s: number, n: number, m: Method): number {
  if (a <= 0 || n <= 0) return 0;
  return m === "simple" ? (s / a - 1) / n : Math.pow(s / a, 1 / n) - 1;
}
/** 할인 계수 — 미래 1원의 현재가치 */
export function discountFactor(r: number, n: number, m: Method): number {
  return m === "simple" ? 1 / (1 + r * n) : 1 / Math.pow(1 + r, n);
}

export type Preset = { label: string; amount: number; ratePct: number; n: number; method: Method; dir: "fv" | "pv"; note: string };
export const PRESETS: Preset[] = [
  { label: "📖 교과서 예시", amount: 1_000_000, ratePct: 5, n: 1, method: "simple", dir: "fv", note: "100만원을 연 5% 단리로 1년 → 105만원" },
  { label: "🏦 단리 10년", amount: 21_000_000, ratePct: 4, n: 10, method: "simple", dir: "pv", note: "10년 뒤 2,100만원의 현재가치는?" },
  { label: "💹 복리 2년", amount: 10_000_000, ratePct: 4, n: 2, method: "compound", dir: "pv", note: "2년 뒤 1,000만원의 현재가치는?" },
  { label: "⏳ 복리 20년", amount: 100_000_000, ratePct: 6, n: 20, method: "compound", dir: "pv", note: "20년 뒤 1억원의 현재가치는?" },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 단계별 문제
// ══════════════════════════════════════════════════════════════
export type Step =
  | { kind: "number"; id: string; ask: string; hint: string; answer: number; suffix: string; explain: string; tol?: number }
  | { kind: "choice"; id: string; ask: string; hint: string; options: string[]; answer: number; explain: string };

export type Problem = {
  id: string;
  emoji: string;
  title: string;
  scenario: string;
  setup: { amount: number; ratePct: number; n: number; method: Method };
  given: { label: string; value: string }[];
  steps: Step[];
  wrapUp: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "pv1",
    emoji: "🏦",
    title: "문제 1 · 단리의 현재가치",
    scenario:
      "연이율 4%의 단리로 10년 후 원리합계가 2,100만 원이 되는 예금에 가입하였다. 이때 10년 후에 받을 2,100만 원의 현재가치를 구하시오.",
    setup: { amount: 21_000_000, ratePct: 4, n: 10, method: "simple" },
    given: [
      { label: "미래가치 S", value: "21,000,000원 (2,100만원)" },
      { label: "할인율 r", value: "4% (= 0.04)" },
      { label: "기간 n", value: "10년" },
      { label: "방법", value: "단리 · A = S ÷ (1 + rn)" },
    ],
    steps: [
      {
        kind: "number", id: "pv1s1",
        ask: "먼저 분모 (1 + rn)의 값을 구해 보세요.",
        hint: "1 + 0.04 × 10",
        answer: 1.4, suffix: "",
        explain: "1 + 0.4 = 1.4 예요. 10년 동안 원금의 40%만큼 이자가 붙는다는 뜻이죠.",
      },
      {
        kind: "number", id: "pv1s2",
        ask: "그럼 2,100만 원의 현재가치는 얼마일까요? (만원 단위)",
        hint: "2100 ÷ 1.4",
        answer: 1500, suffix: "만원",
        explain: "2,100 ÷ 1.4 = 1,500만원. 즉 지금의 1,500만 원과 10년 뒤의 2,100만 원은 같은 가치예요.",
      },
      {
        kind: "number", id: "pv1s3",
        ask: "거꾸로 확인해 볼까요? 1,500만 원을 연 4% 단리로 10년 맡기면 얼마가 될까요? (만원 단위)",
        hint: "1500 × 1.4",
        answer: 2100, suffix: "만원",
        explain: "1,500 × 1.4 = 2,100만원. 이자율로 곱해 간 것을 할인율로 나누면 제자리로 돌아와요!",
      },
    ],
    wrapUp:
      "현재가치를 구하는 것은 이자를 붙이는 계산을 거꾸로 되돌리는 일이에요. 그래서 곱하기(이자율) ↔ 나누기(할인율)가 서로 짝을 이룹니다.",
  },
  {
    id: "pv2",
    emoji: "💹",
    title: "문제 2 · 복리의 현재가치",
    scenario:
      "연이율 4%이고 매년 복리로 이자를 계산하는 만기 2년인 정기 예금에 가입하였다. 만기에 원리합계가 1,000만 원일 때, 이 원리합계의 현재가치를 구하시오. (단, 만 원 미만은 버림한다.)",
    setup: { amount: 10_000_000, ratePct: 4, n: 2, method: "compound" },
    given: [
      { label: "미래가치 S", value: "10,000,000원 (1,000만원)" },
      { label: "할인율 r", value: "4% (= 0.04)" },
      { label: "기간 n", value: "2년" },
      { label: "방법", value: "복리 · A = S ÷ (1 + r)ⁿ" },
    ],
    steps: [
      {
        kind: "number", id: "pv2s1",
        ask: "먼저 분모 (1 + r)ⁿ의 값을 구해 보세요.",
        hint: "1.04 × 1.04",
        answer: 1.0816, suffix: "",
        explain: "1.04² = 1.0816 이에요.",
      },
      {
        kind: "number", id: "pv2s2",
        ask: "1,000만 원의 현재가치는 얼마일까요? (만원 미만은 버림, 만원 단위)",
        hint: "1000 ÷ 1.0816 = 924.55… → 만원 미만 버림",
        answer: 924, suffix: "만원",
        explain: "1,000 ÷ 1.0816 = 924.55…이므로 만 원 미만을 버려 924만 원이에요.",
      },
      {
        kind: "choice", id: "pv2s3",
        ask: "같은 조건을 단리로 할인하면 현재가치는 925.9만 원이에요. 복리로 할인한 값(924.5만 원)이 더 작은 까닭은?",
        hint: "복리는 이자에 이자가 붙어 미래가치가 더 크게 자라죠. 거꾸로 되돌릴 때는?",
        options: [
          "복리는 더 크게 불어나므로, 되돌릴 때도 더 많이 깎이기 때문",
          "복리는 할인율을 두 배로 적용하기 때문",
          "복리는 원금을 빼고 계산하기 때문",
        ],
        answer: 0,
        explain:
          "같은 r·n이라면 (1+r)ⁿ > 1+rn 이므로 나누는 수가 더 커요. 그래서 복리로 할인한 현재가치가 더 작습니다.",
      },
    ],
    wrapUp:
      "복리의 현재가치는 A = S ÷ (1 + r)ⁿ. 기간이 길어질수록 (1+r)ⁿ이 급격히 커지므로 먼 미래의 돈일수록 현재가치가 크게 줄어들어요.",
  },
  {
    id: "pv3",
    emoji: "🔍",
    title: "문제 3 · 할인율을 거꾸로 구하기",
    scenario:
      "은행에 100만 원을 맡겼더니 1년 후에 105만 원이 되었다. 이때 적용된 이자율과, 105만 원을 100만 원으로 되돌릴 때 쓰는 할인율을 각각 생각해 보자.",
    setup: { amount: 1_000_000, ratePct: 5, n: 1, method: "simple" },
    given: [
      { label: "현재가치 A", value: "1,000,000원" },
      { label: "미래가치 S", value: "1,050,000원" },
      { label: "기간 n", value: "1년" },
    ],
    steps: [
      {
        kind: "number", id: "pv3s1",
        ask: "100만 원이 1년 만에 105만 원이 되었다면 이자율은 몇 %일까요?",
        hint: "늘어난 5만 원 ÷ 원금 100만 원 × 100",
        answer: 5, suffix: "%",
        explain: "50,000 ÷ 1,000,000 = 0.05 → 5%. (현재가치 ⇒ 미래가치)에 적용되는 것이 이자율이에요.",
      },
      {
        kind: "number", id: "pv3s2",
        ask: "그럼 105만 원의 현재가치를 100만 원으로 만들려면 할인율은 몇 %여야 할까요?",
        hint: "105 ÷ (1 + r) = 100 이 되도록 하는 r",
        answer: 5, suffix: "%",
        explain: "105 ÷ 1.05 = 100. 할인율도 5%예요.",
      },
      {
        kind: "choice", id: "pv3s3",
        ask: "그렇다면 이자율과 할인율의 관계는?",
        hint: "같은 두 금액을 이어 주는 다리를 어느 방향으로 건너느냐의 차이예요.",
        options: [
          "같은 값인데, 적용하는 방향만 반대다 (이자율: 현재→미래, 할인율: 미래→현재)",
          "할인율은 언제나 이자율의 절반이다",
          "둘은 아무 관계가 없는 서로 다른 비율이다",
        ],
        answer: 0,
        explain:
          "이자율은 곱해서 미래로, 할인율은 나누어서 현재로 가는 같은 비율이에요. 그래서 한 바퀴 돌면 원래 금액으로 정확히 돌아옵니다.",
      },
    ],
    wrapUp: "이자율과 할인율은 같은 다리를 반대 방향으로 건너는 것과 같아요. 곱하기 ↔ 나누기의 관계죠.",
  },
  {
    id: "pv4",
    emoji: "🤔",
    title: "문제 4 · 지금 받을까, 나중에 받을까?",
    scenario:
      "친구가 “지금 500만 원을 줄까, 아니면 5년 뒤에 700만 원을 줄까?”라고 묻는다. 어느 쪽이 이득인지는 할인율에 따라 달라진다. 현재가치로 바꾸어 비교해 보자. (단, 1.06⁵ = 1.3382, 1.1⁵ = 1.61051로 계산한다.)",
    setup: { amount: 7_000_000, ratePct: 6, n: 5, method: "compound" },
    given: [
      { label: "선택 ①", value: "지금 5,000,000원" },
      { label: "선택 ②", value: "5년 뒤 7,000,000원" },
      { label: "주어진 값", value: "1.06⁵ = 1.3382, 1.1⁵ = 1.61051" },
    ],
    steps: [
      {
        kind: "number", id: "pv4s1",
        ask: "할인율이 연 6% 복리라면, 5년 뒤 700만 원의 현재가치는 얼마일까요? (만원 단위, 소수 첫째 자리까지)",
        hint: "700 ÷ 1.3382",
        answer: 523.1, suffix: "만원", tol: 0.06,
        explain: "700 ÷ 1.3382 = 523.1만원. 지금 받는 500만 원보다 큽니다.",
      },
      {
        kind: "choice", id: "pv4s2",
        ask: "할인율이 연 6%일 때, 어느 쪽이 이득일까요?",
        hint: "현재가치가 더 큰 쪽이 이득이에요.",
        options: ["5년 뒤 700만 원 (현재가치 523.1만원)", "지금 500만 원", "완전히 똑같다"],
        answer: 0,
        explain: "523.1만원 > 500만원이므로 5년 뒤에 700만 원을 받는 편이 이득이에요.",
      },
      {
        kind: "number", id: "pv4s3",
        ask: "그런데 할인율이 연 10% 복리라면 어떨까요? 5년 뒤 700만 원의 현재가치를 구해 보세요. (만원 단위, 소수 첫째 자리까지)",
        hint: "700 ÷ 1.61051",
        answer: 434.6, suffix: "만원", tol: 0.06,
        explain: "700 ÷ 1.61051 = 434.6만원. 이번에는 지금 받는 500만 원보다 작아졌어요!",
      },
      {
        kind: "choice", id: "pv4s4",
        ask: "같은 두 선택인데 판단이 뒤집혔어요. 그 까닭은?",
        hint: "할인율이 커지면 나누는 수가 어떻게 되나요?",
        options: [
          "할인율이 높을수록 미래의 돈을 더 많이 깎아서 현재가치가 작아지기 때문",
          "5년이라는 기간이 달라졌기 때문",
          "700만 원이라는 금액이 달라졌기 때문",
        ],
        answer: 0,
        explain:
          "할인율이 6% → 10%로 오르면 나누는 수 (1+r)ⁿ이 1.3382 → 1.61051로 커져 현재가치가 작아져요. 그래서 ‘지금 받는 쪽’이 유리해집니다.",
      },
    ],
    wrapUp:
      "미래의 돈을 오늘의 돈과 비교하려면 반드시 현재가치로 바꿔야 해요. 그리고 그 판단은 어떤 할인율을 쓰느냐에 따라 달라집니다.",
  },
];

export const DATA_NOTE =
  "현재가치는 미래 어느 시점의 금액과 같은 가치를 갖는 현재 시점의 금액이고, 미래가치는 그 반대입니다. 이자율은 (현재가치 ⇒ 미래가치)에, 할인율은 (미래가치 ⇒ 현재가치)에 적용하는 같은 비율이며, 단리에서는 S = A(1+rn)·A = S/(1+rn), 복리에서는 S = A(1+r)ⁿ·A = S/(1+r)ⁿ 입니다. 시뮬레이터는 이 식을 그대로 계산하고, 문제에서 주어진 어림값(1.06⁵ = 1.3382, 1.1⁵ = 1.61051)과 ‘만 원 미만 버림’ 같은 조건은 문제에서 정한 것이라 정확한 계산값과 조금 다를 수 있습니다. 실제 금융에서는 할인율로 시장금리·물가상승률·요구수익률 등을 쓰며, 세금(이자소득세 15.4%)은 여기에 넣지 않았습니다.";
