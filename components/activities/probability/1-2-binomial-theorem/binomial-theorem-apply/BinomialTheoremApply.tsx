"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import { sup } from "@/lib/activities/anim";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─────────────────────────────────────────────────────────────
//  수학 유틸
// ─────────────────────────────────────────────────────────────
function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}
// ₐC_b LaTeX 조각
function CH(a: number | string, b: number | string): string {
  return `{}_{${a}}C_{${b}}`;
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "derive_principle",
    prompt:
      "8가지 공식 중 하나를 골라, (1+x)ⁿ 에서 그 공식을 만들어내는 원리(대입·미분·적분·곱 분해 중 무엇을 쓰는지)를 설명해 보세요.",
    kind: "text",
  },
  {
    id: "x1_xm1",
    prompt:
      "x=1 과 x=−1 대입이 각각 “모든 이항계수의 합 = 2ⁿ”과 “교대 부호 합 = 0”을 주는 이유를 (1+x)ⁿ 관점에서 설명해 보세요.",
    kind: "text",
  },
];

// ═══════════════════════════════════════════════════════════════
//  탭 ① 대입 탐험
// ═══════════════════════════════════════════════════════════════
type SubMode = "x1" | "xm1" | "diff" | "intg" | "x2";

const SUB_BTNS: { mode: SubMode; label: string; on: string }[] = [
  { mode: "x1", label: "✅ x = 1 대입", on: "border-emerald-400 bg-emerald-400/20 text-emerald-200" },
  { mode: "xm1", label: "🔴 x = −1 대입", on: "border-red-400 bg-red-400/20 text-red-200" },
  { mode: "diff", label: "📐 미분 후 x=1", on: "border-amber-400 bg-amber-400/20 text-amber-200" },
  { mode: "intg", label: "∫ 적분 (0→1)", on: "border-cyan-400 bg-cyan-400/20 text-cyan-200" },
  { mode: "x2", label: "💜 x = 2 대입 (보너스)", on: "border-violet-400 bg-violet-400/20 text-violet-200" },
];

function subResult(mode: SubMode, n: number): { tag: string; tagColor: string; formulas: string[]; note: React.ReactNode } {
  if (mode === "x1") {
    const sum = 2 ** n;
    const terms = Array.from({ length: n + 1 }, (_, k) => CH(n, k)).join("+");
    return {
      tag: "✅ x = 1을 대입하면", tagColor: "text-emerald-300",
      formulas: [`(1+1)^{${n}} = 2^{${n}} = ${sum}`, `${terms} = ${sum}`],
      note: <>이항계수의 합 = 2{sup(n)} = <b className="text-emerald-300">{sum}</b> · n개 원소의 모든 부분집합의 수와 같습니다!</>,
    };
  }
  if (mode === "xm1") {
    const terms = Array.from({ length: n + 1 }, (_, k) => (k === 0 ? "" : k % 2 === 0 ? "+" : "-") + CH(n, k)).join("");
    return {
      tag: "🔴 x = −1을 대입하면", tagColor: "text-red-300",
      formulas: [`(1+(-1))^{${n}} = 0^{${n}} = 0`, `${terms} = 0`],
      note: <>교대 부호 이항계수의 합 = <b className="text-red-300">0</b> · 짝수 번째 합 = 홀수 번째 합!</>,
    };
  }
  if (mode === "diff") {
    const sum = n * 2 ** (n - 1);
    const terms = Array.from({ length: n }, (_, i) => { const k = i + 1; return (k === 1 ? "" : k + "\\cdot") + CH(n, k); }).join("+");
    return {
      tag: "📐 양변을 x로 미분한 후 x=1 대입", tagColor: "text-amber-300",
      formulas: [
        `n(1+x)^{${n}-1} = \\sum_{k=1}^{${n}}k\\,${CH(n, "k")}x^{k-1}`,
        `${n}\\cdot 2^{${n - 1}} = ${terms}`,
        `\\Rightarrow\\ ${terms} = ${sum}`,
      ],
      note: <>k를 곱한 이항계수의 합 = n × 2{sup(n - 1)} = <b className="text-amber-300">{sum}</b></>,
    };
  }
  if (mode === "intg") {
    const num = 2 ** (n + 1) - 1;
    const den = n + 1;
    const terms = Array.from({ length: n + 1 }, (_, k) => `\\dfrac{${CH(n, k)}}{${k + 1}}`).join("+");
    return {
      tag: "∫ 양변을 0부터 1까지 적분", tagColor: "text-cyan-300",
      formulas: [
        `\\int_0^1(1+x)^{${n}}\\,dx = \\left[\\dfrac{(1+x)^{${n + 1}}}{${den}}\\right]_0^1 = \\dfrac{2^{${n + 1}}-1}{${den}}`,
        `${terms} = \\dfrac{${num}}{${den}}`,
      ],
      note: <>분모가 1씩 커지는 이항계수 합 = (2{sup(n + 1)}−1)/{den} = <b className="text-cyan-300">{(num / den).toFixed(4)}</b></>,
    };
  }
  // x2
  const sum = 3 ** n;
  const terms = Array.from({ length: n + 1 }, (_, k) => {
    if (k === 0) return CH(n, 0);
    if (k === 1) return "2" + CH(n, 1);
    return `2^{${k}}` + CH(n, k);
  }).join("+");
  return {
    tag: "💜 x = 2를 대입하면", tagColor: "text-violet-300",
    formulas: [`(1+2)^{${n}} = 3^{${n}} = ${sum}`, `${terms} = ${sum}`],
    note: <>2ᵏ를 곱한 이항계수 합 = 3{sup(n)} = <b className="text-violet-300">{sum}</b> · (3진법 전개!)</>,
  };
}

function TabExplore() {
  const [n, setN] = useState(3);
  const [mode, setMode] = useState<SubMode | null>(null);

  const general = (() => {
    const terms = Array.from({ length: n + 1 }, (_, k) => {
      const c = comb(n, k);
      if (k === 0) return String(c);
      if (k === 1) return `${c}x`;
      return `${c}x^{${k}}`;
    }).join("+");
    return `(1+x)^{${n}} = ${terms}`;
  })();

  const res = mode ? subResult(mode, n) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-cyan-300">🧮 이항정리 대입 탐험기</p>
        <p className="mt-2 text-sm text-slate-400">
          n을 고르고 버튼을 눌러 이항정리 <Katex expr="(1+x)^n" />에서 어떤 공식이 나오는지 확인하세요!
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-slate-300">n =</span>
          {[2, 3, 4, 5, 6].map((v) => (
            <button
              key={v} type="button"
              onClick={() => { setN(v); setMode(null); }}
              className={`h-10 w-10 rounded-lg border-2 text-base font-bold transition ${n === v ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-white/15 bg-white/5 text-slate-300 hover:border-cyan-400/60"}`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 text-center">
          <Katex display expr={general} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUB_BTNS.map((b) => (
            <button
              key={b.mode} type="button"
              onClick={() => setMode(b.mode)}
              className={`rounded-lg border-2 px-3.5 py-2 text-sm font-bold transition ${mode === b.mode ? b.on : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"}`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className={`mt-3 rounded-xl border-2 p-4 ${res ? "border-cyan-400/40 bg-cyan-400/[0.06]" : "border-white/10 bg-white/[0.02]"}`}>
          {res ? (
            <div className="animate-[fadeIn_0.25s_ease]">
              <p className={`text-sm font-bold ${res.tagColor}`}>{res.tag}</p>
              <div className="mt-2 space-y-2">
                {res.formulas.map((f, i) => (
                  <div key={i} className="overflow-x-auto text-center">
                    <Katex display expr={f} />
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-lg border-l-2 border-slate-500 bg-white/5 px-3 py-2 text-sm text-slate-300">{res.note}</p>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500">↑ 위의 버튼을 눌러 대입해 보세요!</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-cyan-300">📌 유도 방법 요약표</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-2/5 border border-white/10 bg-white/5 px-3 py-2 text-left text-slate-300">방법</th>
                <th className="border border-white/10 bg-white/5 px-3 py-2 text-left text-slate-300">도출되는 공식</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["x = 1 대입", `${CH("n", 0)}+${CH("n", 1)}+\\cdots+${CH("n", "n")}=2^n`],
                ["x = −1 대입", `${CH("n", 0)}-${CH("n", 1)}+\\cdots+(-1)^n${CH("n", "n")}=0`],
                ["미분 후 x=1", `${CH("n", 1)}+2${CH("n", 2)}+\\cdots+n${CH("n", "n")}=n\\cdot 2^{n-1}`],
                ["0→1 적분", `${CH("n", 0)}+\\dfrac{${CH("n", 1)}}{2}+\\cdots+\\dfrac{${CH("n", "n")}}{n+1}=\\dfrac{2^{n+1}-1}{n+1}`],
              ].map(([method, formula], i) => (
                <tr key={i} className={i % 2 ? "bg-white/[0.02]" : ""}>
                  <td className="border border-white/10 px-3 py-2 text-slate-300">{method}</td>
                  <td className="overflow-x-auto border border-white/10 px-3 py-2"><Katex expr={formula} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  탭 ② 공식 카드
// ═══════════════════════════════════════════════════════════════
type CardData = {
  num: string; badge: string; badgeClass: string;
  front: string; backTitle: string; backKey: string; note: React.ReactNode;
};

const BADGE = {
  s: "border-emerald-400/30 bg-emerald-400/15 text-emerald-300",
  c: "border-amber-400/30 bg-amber-400/15 text-amber-300",
  p: "border-violet-400/30 bg-violet-400/15 text-violet-300",
  k: "border-cyan-400/30 bg-cyan-400/15 text-cyan-300",
};

const CARD_GROUPS: { group: string; items: CardData[] }[] = [
  {
    group: "📌 이항정리에 값 대입하기 — 공식 ①②",
    items: [
      { num: "①", badge: "x = 1 대입", badgeClass: BADGE.s,
        front: `${CH("n", 0)}+${CH("n", 1)}+\\cdots+${CH("n", "n")}=2^n`,
        backTitle: "✅ (★)에서 x = 1 대입",
        backKey: `(1+1)^n=2^n \\;\\Rightarrow\\; \\displaystyle\\sum_{k=0}^n ${CH("n", "k")}=2^n`,
        note: <>이항계수의 합 = 2ⁿ · n개 원소의 모든 부분집합의 수!</> },
      { num: "②", badge: "x = −1 대입", badgeClass: BADGE.s,
        front: `${CH("n", 0)}-${CH("n", 1)}+${CH("n", 2)}-\\cdots+(-1)^n${CH("n", "n")}=0`,
        backTitle: "🔴 (★)에서 x = −1 대입",
        backKey: `(1{-}1)^n=0 \\;\\Rightarrow\\; \\displaystyle\\sum_{k=0}^n(-1)^k${CH("n", "k")}=0`,
        note: <>짝수 번째 합 = 홀수 번째 합 · 교대 부호 합은 항상 0!</> },
    ],
  },
  {
    group: "📐 미분·적분 활용하기 — 공식 ③④",
    items: [
      { num: "③", badge: "미분 후 x=1", badgeClass: BADGE.c,
        front: `${CH("n", 1)}+2${CH("n", 2)}+\\cdots+n${CH("n", "n")}=n\\cdot 2^{n-1}`,
        backTitle: "📐 (★)의 양변 미분 후 x=1 대입",
        backKey: `\\tfrac{d}{dx}(1{+}x)^n\\big|_{x=1}:\\; n\\cdot 2^{n-1}=\\textstyle\\sum_{k=1}^n k${CH("n", "k")}`,
        note: <>k를 곱한 이항계수의 합 = n·2ⁿ⁻¹</> },
      { num: "④", badge: "0→1 적분", badgeClass: BADGE.c,
        front: `${CH("n", 0)}+\\dfrac{${CH("n", 1)}}{2}+\\cdots+\\dfrac{${CH("n", "n")}}{n+1}=\\dfrac{2^{n+1}-1}{n+1}`,
        backTitle: "∫ (★)의 양변을 0~1 구간 적분",
        backKey: `\\displaystyle\\int_0^1(1{+}x)^ndx=\\dfrac{2^{n+1}-1}{n+1}=\\sum_{k=0}^n\\dfrac{${CH("n", "k")}}{k+1}`,
        note: <>분모가 1씩 커지는 이항계수 합 = (2ⁿ⁺¹−1)/(n+1)</> },
    ],
  },
  {
    group: "🔮 (1+x)^(m+n) 곱 분해 — 공식 ⑤⑥ (반데몬드 항등식)",
    items: [
      { num: "⑤", badge: "반데몬드 항등식", badgeClass: BADGE.p,
        front: `\\displaystyle\\sum_{k=0}^{r}${CH("m", "k")}${CH("n", "r-k")}=${CH("m+n", "r")}`,
        backTitle: "🔮 양변의 xʳ 계수 비교",
        backKey: `(1{+}x)^{m+n}=(1{+}x)^m(1{+}x)^n\\text{의 }x^r\\text{ 계수 비교}`,
        note: <>(1+x)<sup>m+n</sup>=(1+x)<sup>m</sup>·(1+x)<sup>n</sup> 의 xʳ 계수를 비교하면 성립!</> },
      { num: "⑥", badge: "제곱합 공식", badgeClass: BADGE.p,
        front: `${CH("n", 0)}^2+${CH("n", 1)}^2+\\cdots+${CH("n", "n")}^2=${CH("2n", "n")}`,
        backTitle: "🔮 반데몬드의 특수한 경우",
        backKey: `\\text{⑤에서 }m{=}n,\\,r{=}n\\text{: }\\,${CH("n", "k")}=${CH("n", "n-k")}\\text{ 이용}`,
        note: <>⑤에서 m=n, r=n으로 놓고 ₙCₖ = ₙCₙ₋ₖ 를 이용!</> },
    ],
  },
  {
    group: "🔺 파스칼 삼각형 성질 — 공식 ⑦⑧",
    items: [
      { num: "⑦", badge: "파스칼 성질 1", badgeClass: BADGE.k,
        front: `${CH("n", 0)}+${CH("n+1", 1)}+${CH("n+2", 2)}+\\cdots+${CH("n+r", "r")}=${CH("n+r+1", "r")}`,
        backTitle: "🔺 파스칼 항등식을 행 방향으로 반복",
        backKey: `${CH("n{+}r{+}1", "r")}=${CH("n{+}r", "r")}+${CH("n{+}r", "r-1")}=\\cdots \\text{(반복)}`,
        note: <>파스칼 삼각형에서 대각선 방향의 이항계수를 누적 합산한 결과!</> },
      { num: "⑧", badge: "파스칼 성질 2", badgeClass: BADGE.k,
        front: `${CH("r", "r")}+${CH("r+1", "r")}+${CH("r+2", "r")}+\\cdots+${CH("n", "r")}=${CH("n+1", "r+1")}\\;(n\\geq r)`,
        backTitle: "🔺 파스칼 항등식을 열 방향으로 반복",
        backKey: `${CH("r", "r")}=${CH("r+1", "r+1")}\\text{, 이후 }${CH("k+1", "r+1")}+${CH("k+1", "r")}=${CH("k+2", "r+1")}\\text{ 반복}`,
        note: <>파스칼 삼각형의 같은 r열을 아래로 누적 합산한 결과! (n≥r)</> },
    ],
  },
];

function FlipCard({ data }: { data: CardData }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      className="h-[280px] w-full text-left [perspective:1000px]"
      aria-label={`공식 ${data.num} 카드 뒤집기`}
    >
      <div className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
        {/* 앞면 */}
        <div className="absolute inset-0 flex flex-col rounded-2xl border border-white/10 bg-slate-900 p-4 [backface-visibility:hidden]">
          <span className="absolute right-3 top-2 text-2xl font-black text-white/10">{data.num}</span>
          <span className={`w-fit rounded-full border px-2.5 py-0.5 text-xs font-bold ${data.badgeClass}`}>{data.badge}</span>
          <div className="flex flex-1 items-center justify-center overflow-x-auto px-1">
            <Katex display expr={data.front} />
          </div>
          <p className="mt-auto text-right text-xs text-slate-500">클릭 → 유도 방법 ▶</p>
        </div>
        {/* 뒷면 */}
        <div className="absolute inset-0 flex flex-col rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="text-sm font-bold text-amber-200">{data.backTitle}</p>
          <div className="flex flex-1 items-center justify-center overflow-x-auto px-1">
            <Katex display expr={data.backKey} />
          </div>
          <p className="mt-auto rounded-lg bg-amber-400/10 px-2.5 py-1.5 text-xs leading-relaxed text-slate-300">{data.note}</p>
        </div>
      </div>
    </button>
  );
}

function TabCards() {
  return (
    <div className="space-y-2">
      <div className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3">
        <p className="text-sm text-slate-400">카드를 <b className="text-slate-200">클릭</b>하면 도출 방법이 나타납니다! 다시 클릭하면 앞면으로 돌아와요 🔄</p>
      </div>
      {CARD_GROUPS.map((g, gi) => (
        <div key={gi}>
          <p className="mt-3 rounded-lg border-l-2 border-cyan-400 bg-white/5 px-3 py-1.5 text-sm font-bold text-slate-300">{g.group}</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {g.items.map((c) => <FlipCard key={c.num} data={c} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  탭 ③ 도전 퀴즈
// ═══════════════════════════════════════════════════════════════
type QuizItem = { q: string; ch: string[]; ans: number; ex: string; plain?: boolean };

const QUIZ: QuizItem[] = [
  {
    q: "이항정리 (1+x)ⁿ에서 x = 1을 대입하면 나오는 공식은?",
    ch: [
      "{}_{n}C_{0}+{}_{n}C_{1}+\\cdots+{}_{n}C_{n}=2^n",
      "{}_{n}C_{0}-{}_{n}C_{1}+\\cdots+(-1)^n{}_{n}C_{n}=0",
      "{}_{n}C_{1}+2{}_{n}C_{2}+\\cdots+n{}_{n}C_{n}=n\\cdot 2^{n-1}",
      "{}_{n}C_{0}+\\frac{{}_{n}C_{1}}{2}+\\cdots=\\frac{2^{n+1}-1}{n+1}",
    ],
    ans: 0,
    ex: "x=1을 대입하면 (1+1)ⁿ=2ⁿ이 되고, 우변 각 항의 xᵏ=1이 되어 이항계수의 합 = 2ⁿ이 도출됩니다.",
  },
  {
    q: "이항계수의 교대 부호 합( ₙC₀−ₙC₁+ₙC₂−⋯ )이 0이 됨을 보이려면?",
    ch: ["x = 2 대입", "x = −1 대입", "양변 미분 후 x=1 대입", "양변을 0~1 적분"],
    ans: 1, plain: true,
    ex: "x=−1을 대입하면 (1−1)ⁿ=0ⁿ=0이 되고, 우변이 교대 부호 이항계수의 합이 됩니다.",
  },
  {
    q: "ₙC₁ + 2·ₙC₂ + ⋯ + n·ₙCₙ = n·2ⁿ⁻¹ 을 도출하는 방법은?",
    ch: ["x = 1 대입", "x = −1 대입", "양변을 x로 미분한 후 x=1 대입", "양변을 0~1 적분"],
    ans: 2, plain: true,
    ex: "(1+x)ⁿ을 미분하면 n(1+x)ⁿ⁻¹=Σk·ₙCₖ·xᵏ⁻¹. x=1 대입 → n·2ⁿ⁻¹=Σk·ₙCₖ.",
  },
  {
    q: "ₙC₀ + ₙC₁/2 + ₙC₂/3 + ⋯ + ₙCₙ/(n+1) = (2ⁿ⁺¹−1)/(n+1) 을 유도하는 방법은?",
    ch: ["x = 1 대입", "x = −1 대입", "양변 미분 후 x=1 대입", "양변을 0에서 1까지 적분"],
    ans: 3, plain: true,
    ex: "(1+x)ⁿ을 0~1에서 적분: [(1+x)ⁿ⁺¹/(n+1)]₀¹=(2ⁿ⁺¹−1)/(n+1). 우변 적분하면 ΣₙCₖ/(k+1).",
  },
  {
    q: "반데몬드 항등식 Σ(ₘCₖ×ₙCᵣ₋ₖ) = ₘ₊ₙCᵣ 는 어떻게 유도하나요?",
    ch: [
      "이항정리에 x=1 대입",
      "(1+x)^{m+n}=(1+x)^m·(1+x)^n 의 x^r 계수 비교",
      "파스칼 항등식 반복 적용",
      "미분 후 x=1 대입",
    ],
    ans: 1, plain: true,
    ex: "(1+x)^{m+n}의 x^r 계수는 ₘ₊ₙCᵣ. (1+x)^m·(1+x)^n의 x^r 계수는 ΣₘCₖ·ₙCᵣ₋ₖ. 양변이 같으므로 성립!",
  },
  {
    q: "n=4 일 때,  ₄C₀ + ₄C₁ + ₄C₂ + ₄C₃ + ₄C₄ 의 값은?",
    ch: ["8", "12", "16", "32"],
    ans: 2, plain: true,
    ex: "공식 ①: n=4이면 2⁴=16. 실제로 1+4+6+4+1=16.",
  },
  {
    q: "n=3 일 때,  ₃C₀ − ₃C₁ + ₃C₂ − ₃C₃ 의 값은?",
    ch: ["−2", "−1", "0", "1"],
    ans: 2, plain: true,
    ex: "공식 ②: 1−3+3−1=0. 교대 부호 합은 항상 0!",
  },
  {
    q: "(ₙC₀)²+(ₙC₁)²+⋯+(ₙCₙ)² = ₂ₙCₙ 은 어떤 항등식의 특수한 경우인가요?",
    ch: [
      "이항정리에 x=−1 대입",
      "반데몬드 항등식에서 m=n, r=n으로 놓은 것",
      "파스칼 성질 ⑦",
      "양변 미분 후 대입",
    ],
    ans: 1, plain: true,
    ex: "반데몬드 ΣₙCₖ·ₙCₙ₋ₖ=₂ₙCₙ 에서 ₙCₖ=ₙCₙ₋ₖ이므로 Σ(ₙCₖ)²=₂ₙCₙ.",
  },
];

// 진행률 바 너비(8문항) — 정적 클래스.
const QPROGRESS = ["w-0", "w-[12.5%]", "w-[25%]", "w-[37.5%]", "w-[50%]", "w-[62.5%]", "w-[75%]", "w-[87.5%]", "w-full"];

function TabQuiz() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = QUIZ[idx];
  const answered = picked !== null;

  function pick(ci: number) {
    if (answered) return;
    setPicked(ci);
    setTotal((t) => t + 1);
    if (ci === q.ans) setScore((s) => s + 1);
  }
  function next() {
    if (idx + 1 >= QUIZ.length) { setFinished(true); return; }
    setIdx((i) => i + 1);
    setPicked(null);
  }
  function restart() {
    setIdx(0); setPicked(null); setScore(0); setTotal(0); setFinished(false);
  }

  if (finished) {
    const p = score / QUIZ.length;
    const msg = p >= 0.875 ? "🏆 완벽합니다! 이항정리의 활용 달인이군요!"
      : p >= 0.625 ? "👏 잘했어요! 틀린 문제는 공식 카드 탭에서 복습해보세요."
      : p >= 0.375 ? "💪 조금 더 노력해봐요! 대입 탐험 탭부터 다시 확인해보세요."
      : "📖 공식 카드 탭을 꼼꼼히 읽고 다시 도전해보세요!";
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
        <h4 className="text-2xl font-bold">🎉 퀴즈 완료!</h4>
        <p className="mt-3 text-5xl font-black text-cyan-300">{score} / {QUIZ.length}</p>
        <p className="mt-3 text-slate-400">{msg}</p>
        <button type="button" onClick={restart}
          className="mt-5 rounded-xl bg-cyan-300 px-6 py-3 text-base font-bold text-slate-950 transition hover:bg-cyan-200">
          다시 도전하기 🔄
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">문제 {idx + 1} / {QUIZ.length}</p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full bg-cyan-400 transition-all ${QPROGRESS[idx]}`} />
      </div>

      <p className="mt-4 text-base font-semibold leading-7 text-slate-100">{q.q}</p>

      <div className="mt-3 flex flex-col gap-2">
        {q.ch.map((c, ci) => {
          const isPlain = q.plain || !c.includes("\\");
          const showOk = answered && ci === q.ans;
          const showNg = answered && ci === picked && ci !== q.ans;
          const cls = showOk ? "border-emerald-400 bg-emerald-400/10 text-emerald-200"
            : showNg ? "border-red-400 bg-red-400/10 text-red-200"
            : "border-white/12 bg-white/[0.03] text-slate-200 hover:border-cyan-400/50 hover:bg-cyan-400/[0.06]";
          return (
            <button
              key={ci} type="button" disabled={answered} onClick={() => pick(ci)}
              className={`rounded-xl border-2 px-4 py-2.5 text-left text-sm leading-relaxed transition disabled:cursor-default ${cls}`}
            >
              {answered && ci === q.ans ? "✅ " : showNg ? "❌ " : ""}
              {isPlain ? c : <Katex expr={c} />}
            </button>
          );
        })}
      </div>

      {answered ? (
        <div className={`mt-3 animate-[fadeIn_0.25s_ease] rounded-xl border p-3 text-sm leading-relaxed ${picked === q.ans ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-red-400/40 bg-red-400/10 text-red-200"}`}>
          {picked === q.ans ? "✅ 정답! " : "❌ 아쉽네요. "}{q.ex}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-400">점수: {score} / {total}</span>
        {answered ? (
          <button type="button" onClick={next}
            className="rounded-lg bg-cyan-300 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">
            {idx + 1 >= QUIZ.length ? "결과 보기 →" : "다음 문제 →"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  메인
// ═══════════════════════════════════════════════════════════════
type TabKey = "explore" | "cards" | "quiz";

export default function BinomialTheoremApply() {
  const [tab, setTab] = useState<TabKey>("explore");
  const tabBtn = (active: boolean) =>
    active
      ? "rounded-lg bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950"
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 이항정리</p>
        <h3 className="mt-2 text-2xl font-bold">🧮 이항정리의 활용</h3>
        <p className="mt-2 leading-7 text-slate-300">
          이항정리 <Katex expr="(1+x)^n" />에 값을 <b className="text-cyan-300">대입·미분·적분</b>하거나{" "}
          <Katex expr="(1+x)^{m+n}=(1+x)^m(1+x)^n" />으로 분해하면 이항계수의 다양한 성질 <b className="text-amber-300">8가지</b>를
          도출할 수 있습니다. 세 탭을 순서대로 탐구하고 퀴즈로 확인해 보세요.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "explore")} onClick={() => setTab("explore")}>🔢 대입 탐험</button>
        <button type="button" className={tabBtn(tab === "cards")} onClick={() => setTab("cards")}>📋 공식 카드</button>
        <button type="button" className={tabBtn(tab === "quiz")} onClick={() => setTab("quiz")}>🎯 도전 퀴즈</button>
      </div>

      <div className="mt-4">
        {tab === "explore" ? <TabExplore /> : tab === "cards" ? <TabCards /> : <TabQuiz />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
