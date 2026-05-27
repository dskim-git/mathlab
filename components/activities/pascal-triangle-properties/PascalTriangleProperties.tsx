"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import { sup } from "@/lib/activities/anim";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─────────────────────────────────────────────────────────────
//  수학 유틸
// ─────────────────────────────────────────────────────────────
function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}
function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────
//  SVG 레이아웃 (viewBox 고정 → width 100% 자동 스케일, 가로 스크롤 없음)
// ─────────────────────────────────────────────────────────────
const ROWS = 9;
const VW = 760, VH = 490;
const CW = 68, CH = 42, GAP_X = 8, GAP_Y = 10;
const PAD_X = 18, PAD_Y = 14;

function cellPos(r: number, c: number): { x: number; y: number } {
  const usableW = VW - 2 * PAD_X;
  const rowW = (r + 1) * CW + r * GAP_X;
  const sx = PAD_X + (usableW - rowW) / 2;
  return { x: sx + c * (CW + GAP_X), y: PAD_Y + r * (CH + GAP_Y) };
}

// ── 강조 색 ──
type HL = { r: number; c: number; fill: string; stroke: string; textColor: string };
const at = (r: number, c: number, col: { fill: string; stroke: string; textColor: string }): HL => ({ r, c, ...col });
const BLUE = { fill: "#1d4ed8", stroke: "#60a5fa", textColor: "#bfdbfe" };
const BLUE2 = { fill: "#1e3a5f", stroke: "#3b82f6", textColor: "#93c5fd" };
const GREEN = { fill: "#065f46", stroke: "#34d399", textColor: "#a7f3d0" };
const GREEN2 = { fill: "#064e3b", stroke: "#10b981", textColor: "#6ee7b7" };
const VIOLET = { fill: "#4c1d95", stroke: "#a78bfa", textColor: "#c4b5fd" };
const VIOLET2 = { fill: "#3b0764", stroke: "#a78bfa", textColor: "#e9d5ff" };
const AMBER = { fill: "#78350f", stroke: "#f59e0b", textColor: "#fde68a" };

// ── 조합 기호(아래첨자) ──
function Comb({ n, r }: { n: React.ReactNode; r: React.ReactNode }) {
  return <span className="whitespace-nowrap"><sub>{n}</sub>C<sub>{r}</sub></span>;
}
// 노드 배열을 구분자로 잇기
function joined(nodes: React.ReactNode[], sep: string): React.ReactNode {
  return nodes.map((n, i) => <span key={i}>{i > 0 ? sep : ""}{n}</span>);
}

// ─────────────────────────────────────────────────────────────
//  성질 계산 (탭별로 강조 셀 + 결과 노드 반환)
// ─────────────────────────────────────────────────────────────
type Result = { hl: HL[]; result: React.ReactNode };

function propSymmetry(r: number, c: number): Result {
  const mirror = r - c;
  if (c === mirror) {
    return { hl: [at(r, c, VIOLET)], result: <span className="text-violet-300"><Comb n={r} r={c} /> = {comb(r, c)} &nbsp;←&nbsp; 중앙값 (자기 자신과 대칭)</span> };
  }
  const lo = Math.min(c, mirror), hi = Math.max(c, mirror);
  return {
    hl: [at(r, lo, BLUE), at(r, hi, GREEN)],
    result: (
      <span>
        <span className="text-blue-300"><Comb n={r} r={lo} /> = {comb(r, lo)}</span>
        {" = "}
        <span className="text-emerald-300"><Comb n={r} r={hi} /> = {comb(r, hi)}</span>
        {" "}✔ <em>ₙCᵣ = ₙCₙ₋ᵣ</em> (n={r}, r={lo}, n−r={hi})
      </span>
    ),
  };
}

function propPascal(r: number, c: number): Result {
  if (r === 0) {
    return { hl: [at(r, c, BLUE2)], result: <span className="text-amber-300">0행은 위쪽 부모 셀이 없습니다.</span> };
  }
  const hasL = c > 0, hasR = c < r;
  const hl: HL[] = [];
  if (hasL) hl.push(at(r - 1, c - 1, BLUE));
  if (hasR) hl.push(at(r - 1, c, BLUE));
  hl.push(at(r, c, GREEN));
  const lv = hasL ? comb(r - 1, c - 1) : 0;
  const rv = hasR ? comb(r - 1, c) : 0;
  const parents: React.ReactNode[] = [];
  if (hasL) parents.push(<span className="text-blue-300"><Comb n={r - 1} r={c - 1} />(={lv})</span>);
  if (hasR) parents.push(<span className="text-blue-300"><Comb n={r - 1} r={c} />(={rv})</span>);
  return {
    hl,
    result: (
      <span>
        {joined(parents, " + ")}
        {" = "}
        <span className="text-emerald-300"><b><Comb n={r} r={c} /> = {lv + rv}</b></span>
        {" "}✔ <em>ₙCᵣ = ₙ₋₁Cᵣ₋₁ + ₙ₋₁Cᵣ</em>
      </span>
    ),
  };
}

function propBinom(r: number): Result {
  const hl = Array.from({ length: r + 1 }, (_, k) => at(r, k, AMBER));
  const terms = Array.from({ length: r + 1 }, (_, k) => {
    const co = comb(r, k), ae = r - k, be = k;
    let t = co === 1 && (ae > 0 || be > 0) ? "" : String(co);
    if (ae > 0) t += ae === 1 ? "a" : "a" + sup(ae);
    if (be > 0) t += be === 1 ? "b" : "b" + sup(be);
    return t || "1";
  });
  return { hl, result: <span className="text-amber-300">(a+b){sup(r)} = {terms.join(" + ")}</span> };
}

function propRowSum(r: number): Result {
  const hl = Array.from({ length: r + 1 }, (_, k) => at(r, k, VIOLET2));
  const vals = Array.from({ length: r + 1 }, (_, k) => comb(r, k));
  const sum = vals.reduce((a, b) => a + b, 0);
  return {
    hl,
    result: <span className="text-violet-300">행 {r}: &nbsp;{vals.join(" + ")} = <b>{sum}</b> = 2{sup(r)} = {2 ** r}</span>,
  };
}

function propHockeyRight(r: number, c: number): Result {
  const hl: HL[] = [];
  for (let row = c; row <= r; row++) hl.push(at(row, c, BLUE2));
  if (r + 1 < ROWS) hl.push(at(r + 1, c + 1, GREEN2));
  const parts = Array.from({ length: r - c + 1 }, (_, i) => {
    const row = c + i;
    return <span key={i} className="text-blue-300"><Comb n={row} r={c} />(={comb(row, c)})</span>;
  });
  const tip = r + 1 < ROWS
    ? <span className="text-emerald-300"><b><Comb n={r + 1} r={c + 1} /> = {comb(r + 1, c + 1)}</b></span>
    : <b>{comb(r + 1, c + 1)}</b>;
  return {
    hl,
    result: <span>{joined(parts, " + ")} = {tip} &nbsp;✔ <em>우방향 하키스틱: Σ ᵢCᶜ = ₘ₊₁Cᶜ₊₁</em></span>,
  };
}

function propHockeyLeft(r: number, c: number): Result {
  const d = r - c;
  const hl: HL[] = [];
  for (let i = 0; i <= c; i++) hl.push(at(d + i, i, BLUE2));
  if (r + 1 < ROWS) hl.push(at(r + 1, c, GREEN2));
  const parts = Array.from({ length: c + 1 }, (_, i) => (
    <span key={i} className="text-blue-300"><Comb n={d + i} r={i} />(={comb(d + i, i)})</span>
  ));
  const tip = r + 1 < ROWS
    ? <span className="text-emerald-300"><b><Comb n={r + 1} r={c} /> = {comb(r + 1, c)}</b></span>
    : <b>{comb(r + 1, c)}</b>;
  return {
    hl,
    result: <span>{joined(parts, " + ")} = {tip} &nbsp;✔ <em>좌방향 하키스틱: Σ ₍d₊ᵢ₎Cᵢ = ₍ᵣ₊₁₎Cᶜ</em> (대각선 d={d})</span>,
  };
}

const PRIME_EDGE = { fill: "#292524", stroke: "#78716c", textColor: "#a8a29e" };
const PRIME_DIV = { fill: "#1a2e1a", stroke: "#16a34a", textColor: "#86efac" };
const PRIME_NOT = { fill: "#3b1515", stroke: "#dc2626", textColor: "#f87171" };

function propPrime(r: number, c: number): Result {
  if (r < 2) {
    return { hl: [at(r, c, BLUE2)], result: <span className="text-amber-300">행 {r}은 소수 성질 적용 범위 밖입니다.</span> };
  }
  const hl: HL[] = [];
  const notDiv: number[] = [];
  for (let k = 0; k <= r; k++) {
    const v = comb(r, k);
    const isEdge = k === 0 || k === r;
    const div = v % r === 0;
    if (!isEdge && !div) notDiv.push(k);
    hl.push(at(r, k, isEdge ? PRIME_EDGE : div ? PRIME_DIV : PRIME_NOT));
  }
  let result: React.ReactNode;
  if (isPrime(r)) {
    result = <span className="text-emerald-300">p = {r} (소수): 양 끝 1을 제외한 모든 수가 {r}의 배수입니다. ✔</span>;
  } else if (notDiv.length > 0) {
    const ex = notDiv.slice(0, 3).map((k) => <span key={k}><Comb n={r} r={k} />={comb(r, k)}</span>);
    result = <span className="text-red-300">n = {r} (합성수): {joined(ex, ", ")} → {r}의 배수 아님 ✘ (소수 성질 불성립)</span>;
  } else {
    result = <span className="text-amber-300">n = {r} (합성수): 이 범위에서 우연히 모두 배수처럼 보이지만 소수 성질이 보장되지는 않습니다.</span>;
  }
  return { hl, result };
}

type TabKey = 1 | 2 | 3 | 4 | 5 | 6 | "Q";
type HockeyDir = "right" | "left";

const TAB_INFO: Record<Exclude<TabKey, "Q">, { label: string; title: string; formula: string; hint: string }> = {
  1: { label: "① 좌우대칭", title: "성질 ① 중앙 축을 기준으로 좌우대칭", formula: "ₙCᵣ = ₙCₙ₋ᵣ", hint: "셀을 클릭하면 그 셀과 대칭인 셀이 강조됩니다." },
  2: { label: "② 역삼각형", title: "성질 ② 역삼각형의 숫자들 (파스칼의 법칙)", formula: "ₙCᵣ = ₙ₋₁Cᵣ₋₁ + ₙ₋₁Cᵣ", hint: "셀을 클릭하면 위의 두 부모 셀(파랑)과 합(초록)이 강조됩니다." },
  3: { label: "③ 이항전개", title: "성질 ③ n번째 행 = (a+b)ⁿ의 전개식 계수", formula: "(a+b)ⁿ = Σ ₙCₖ aⁿ⁻ᵏ bᵏ", hint: "셀을 클릭하면 그 행 전체와 이항전개식이 표시됩니다." },
  4: { label: "④ 행의 합", title: "성질 ④ n행의 모든 이항계수의 합 = 2ⁿ", formula: "Σₖ ₙCₖ = 2ⁿ", hint: "셀을 클릭하면 그 행의 합과 2ⁿ이 표시됩니다." },
  5: { label: "⑤ 하키스틱", title: "성질 ⑤ 하키스틱 법칙", formula: "우방향: ᵣCᵣ+ᵣ₊₁Cᵣ+…+ₘCᵣ = ₘ₊₁Cᵣ₊₁  |  좌방향: ₐC₀+ₐ₊₁C₁+…+ₘCᶜ = ₘ₊₁Cᶜ", hint: "방향 토글로 우·좌 버전을 선택 후 셀을 클릭하세요. 우방향=열 고정, 좌방향=대각선 고정." },
  6: { label: "⑥ 소수 행", title: "성질 ⑥ 소수 번째 행 → 그 소수의 배수만 등장", formula: "p가 소수 ⇒ ₚCₖ ≡ 0 (mod p)  (k ≠ 0, p)", hint: "셀을 클릭하면 그 행 전체에서 소수 배수 여부가 강조됩니다. 2·3·5·7행과 4·6·8행을 비교해보세요." },
};

// ─────────────────────────────────────────────────────────────
//  SVG 삼각형
// ─────────────────────────────────────────────────────────────
function Triangle({ view, hlMap, onCell }: { view: "num" | "comb"; hlMap: Record<string, HL>; onCell: (r: number, c: number) => void }) {
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= r; c++) {
      const { x, y } = cellPos(r, c);
      const h = hlMap[`${r},${c}`];
      const fill = h ? h.fill : "#1e293b";
      const stroke = h ? h.stroke : "#334155";
      const tc = h ? h.textColor : "#cbd5e1";
      const val = comb(r, c);
      const cx = x + CW / 2, cy = y + CH / 2;
      cells.push(
        <g key={`${r},${c}`} className="group cursor-pointer" onClick={() => onCell(r, c)}>
          <rect x={x} y={y} width={CW} height={CH} rx={7} fill={fill} stroke={stroke} strokeWidth={1.5} className="transition-[fill,stroke] group-hover:brightness-125" />
          {view === "comb" ? (
            <>
              <text x={cx - 10} y={cy + 13} textAnchor="middle" fontSize="11" fill={tc} fontFamily="serif" fontStyle="italic">{r}</text>
              <text x={cx + 1} y={cy + 7} textAnchor="middle" fontSize="17" fill={tc} fontFamily="serif" fontWeight="bold">C</text>
              <text x={cx + 12} y={cy + 13} textAnchor="middle" fontSize="11" fill={tc} fontFamily="serif" fontStyle="italic">{c}</text>
            </>
          ) : (
            (() => {
              const fs = val >= 10000 ? 9 : val >= 1000 ? 11 : val >= 100 ? 13 : 15;
              return <text x={cx} y={cy + fs * 0.38} textAnchor="middle" fontSize={fs} fill={tc} fontFamily="system-ui, sans-serif" fontWeight="700">{val}</text>;
            })()
          )}
        </g>
      );
    }
  }
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height="auto" preserveAspectRatio="xMidYMid meet" className="block">
      {cells}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  퀴즈
// ─────────────────────────────────────────────────────────────
type QuizItem = { q: string; choices: string[]; answer: number; explain: string };
const QUIZ: QuizItem[] = [
  { q: "ₙCᵣ = ₙCₙ₋ᵣ 가 성립하는 근본적인 이유는?", choices: ["r개를 선택하는 것은 (n−r)개를 제외하는 것과 같기 때문", "두 값이 우연히 같을 뿐이다", "이항정리에 의해 짝수 행만 대칭이다", "하키스틱 법칙 때문이다"], answer: 0, explain: "r개를 뽑는 것 = (n−r)개를 남겨두는 것이므로 경우의 수가 같습니다." },
  { q: "7번째 행(n=7)의 모든 수의 합은?", choices: ["64", "128", "256", "32"], answer: 1, explain: "행 n의 합 = 2ⁿ이므로 2⁷ = 128" },
  { q: "역삼각형 성질에 따르면, ₅C₃ = ?", choices: ["₄C₂ + ₄C₃", "₄C₂ + ₄C₄", "₄C₃ + ₄C₄", "₅C₂ + ₅C₄"], answer: 0, explain: "ₙCᵣ = ₙ₋₁Cᵣ₋₁ + ₙ₋₁Cᵣ → ₅C₃ = ₄C₂ + ₄C₃ = 6+4 = 10 ✓" },
  { q: "(a+b)⁵의 전개식에서 a²b³의 계수는?", choices: ["5", "10", "15", "20"], answer: 1, explain: "₅C₃ = 10 (b를 3번, a를 2번 선택하는 경우의 수)" },
  { q: "하키스틱 법칙: ₂C₂ + ₃C₂ + ₄C₂ + ₅C₂ = ?", choices: ["₅C₃", "₆C₃", "₆C₂", "₅C₂"], answer: 1, explain: "r=2, m=5이면 ₂C₂+₃C₂+₄C₂+₅C₂ = ₆C₃ = 20 ✓" },
  { q: "p=7(소수)일 때, ₇C₃의 값은 7의 배수인가?", choices: ["예, 35 = 5×7이므로 7의 배수", "아니오, 35는 7의 배수가 아님", "양 끝만 소수의 배수", "알 수 없음"], answer: 0, explain: "₇C₃ = 35 = 5×7. 소수 p에서 양 끝(1) 제외 모두 p의 배수 ✓" },
  { q: "n=5 행의 수를 전부 나열하면?", choices: ["1 4 6 4 1", "1 5 10 10 5 1", "1 5 10 5 1", "1 6 15 20 15 6 1"], answer: 1, explain: "₅C₀=1, ₅C₁=5, ₅C₂=10, ₅C₃=10, ₅C₄=5, ₅C₅=1" },
];

function QuizPanel() {
  const [answers, setAnswers] = useState<(number | null)[]>(() => new Array(QUIZ.length).fill(null));
  const answered = answers.filter((a) => a !== null).length;
  const correct = answers.filter((a, i) => a === QUIZ[i].answer).length;

  return (
    <div className="space-y-3">
      {QUIZ.map((q, qi) => {
        const picked = answers[qi];
        const done = picked !== null;
        const isCorrect = done && picked === q.answer;
        const cardBorder = !done ? "border-transparent" : isCorrect ? "border-emerald-600" : "border-red-600";
        return (
          <div key={qi} className={`rounded-xl border-2 bg-slate-900 p-3.5 ${cardBorder}`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">문제 {qi + 1} / {QUIZ.length}</p>
            <p className="mt-1 text-sm leading-6 text-slate-100">{q.q}</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {q.choices.map((ch, ci) => {
                const showAns = done && ci === q.answer;
                const showWrong = done && ci === picked && ci !== q.answer;
                const cls = showAns ? "border-emerald-500 bg-emerald-950 text-emerald-200"
                  : showWrong ? "border-red-500 bg-red-950 text-red-300"
                  : "border-white/12 bg-slate-950 text-slate-300 hover:border-blue-500 hover:bg-blue-950/40";
                return (
                  <button key={ci} type="button" disabled={done}
                    onClick={() => { if (picked === null) setAnswers((prev) => prev.map((v, i) => (i === qi ? ci : v))); }}
                    className={`rounded-lg border px-3 py-1.5 text-left text-sm transition disabled:cursor-default ${cls}`}>
                    {"①②③④"[ci]} {ch}
                  </button>
                );
              })}
            </div>
            {done ? (
              <p className={`mt-2 rounded-md px-2.5 py-1.5 text-sm ${isCorrect ? "bg-emerald-950 text-emerald-200" : "bg-red-950 text-red-300"}`}>
                {isCorrect ? "✔ 정답! " : "✘ 오답. "}{q.explain}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="rounded-xl border border-white/10 bg-slate-900 p-4 text-center">
        <div className="text-3xl font-black text-amber-300">{answered === 0 ? "—" : `${correct} / ${answered}`}</div>
        <p className="mt-1 text-sm text-slate-400">
          {answered < QUIZ.length
            ? `${answered}문제 완료 (${QUIZ.length - answered}문제 남음)`
            : `정답률 ${Math.round((correct / QUIZ.length) * 100)}% — ${correct === QUIZ.length ? "🎉 완벽!" : correct >= Math.ceil(QUIZ.length * 0.7) ? "👏 잘했어요!" : "📚 탭으로 돌아가 다시 탐구해봐요."}`}
        </p>
        {answered === QUIZ.length ? (
          <button type="button" onClick={() => setAnswers(new Array(QUIZ.length).fill(null))}
            className="mt-3 rounded-lg bg-violet-500 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110">
            다시 풀기
          </button>
        ) : null}
      </div>
    </div>
  );
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "symmetry_pascal",
    prompt:
      "좌우대칭(ₙCᵣ = ₙCₙ₋ᵣ)과 파스칼 법칙(ₙCᵣ = ₙ₋₁Cᵣ₋₁ + ₙ₋₁Cᵣ)을 각각 “r개 뽑기 = (n−r)개 남기기”, “마지막 원소를 포함/제외”라는 선택의 의미로 설명해 보세요.",
    kind: "text",
  },
  {
    id: "hockey_stick",
    prompt:
      "하키스틱 법칙(여러 이항계수의 합이 하나의 이항계수가 됨)이 왜 성립하는지, 파스칼 법칙을 반복해서 적용하는 방식으로 설명해 보세요.",
    kind: "text",
  },
];

// ═══════════════════════════════════════════════════════════════
//  메인
// ═══════════════════════════════════════════════════════════════
export default function PascalTriangleProperties() {
  const [tab, setTab] = useState<TabKey>(1);
  const [view, setView] = useState<"num" | "comb">("num");
  const [hockeyDir, setHockeyDir] = useState<HockeyDir>("right");
  const [highlights, setHighlights] = useState<HL[]>([]);
  const [result, setResult] = useState<React.ReactNode>(null);

  const hlMap: Record<string, HL> = {};
  for (const h of highlights) hlMap[`${h.r},${h.c}`] = h;

  function handleCell(r: number, c: number) {
    let res: Result;
    switch (tab) {
      case 1: res = propSymmetry(r, c); break;
      case 2: res = propPascal(r, c); break;
      case 3: res = propBinom(r); break;
      case 4: res = propRowSum(r); break;
      case 5: res = hockeyDir === "right" ? propHockeyRight(r, c) : propHockeyLeft(r, c); break;
      case 6: res = propPrime(r, c); break;
      default: return;
    }
    setHighlights(res.hl);
    setResult(res.result);
  }

  function switchTab(t: TabKey) {
    setTab(t);
    setHighlights([]);
    setResult(null);
  }
  function switchHockey(dir: HockeyDir) {
    setHockeyDir(dir);
    setHighlights([]);
    setResult(null);
  }

  const info = tab === "Q" ? null : TAB_INFO[tab];
  const tabBtn = (active: boolean, quiz = false) =>
    active
      ? `rounded-lg border px-2.5 py-1.5 text-xs font-bold text-white ${quiz ? "border-violet-400 bg-violet-600" : "border-blue-400 bg-blue-700"}`
      : "rounded-lg border border-white/15 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-white/40 hover:text-slate-200";
  const vtBtn = (active: boolean) =>
    active
      ? "rounded-md border border-blue-400 bg-blue-900/60 px-2.5 py-1 text-xs font-semibold text-blue-200"
      : "rounded-md border border-white/12 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:text-slate-200";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 이항정리</p>
        <h3 className="mt-2 text-2xl font-bold">🔺 파스칼의 삼각형 성질 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          이항계수의 <b className="text-cyan-300">6가지 성질</b>을 직접 셀을 클릭하며 탐구하고, 퀴즈로 확인합니다.
        </p>
      </div>

      {/* 탭 */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(Object.keys(TAB_INFO) as unknown as Exclude<TabKey, "Q">[]).map((t) => (
          <button key={t} type="button" className={tabBtn(tab === Number(t))} onClick={() => switchTab(Number(t) as TabKey)}>
            {TAB_INFO[t].label}
          </button>
        ))}
        <button type="button" className={tabBtn(tab === "Q", true)} onClick={() => switchTab("Q")}>🎯 퀴즈</button>
      </div>

      {tab === "Q" ? (
        <div className="mt-4"><QuizPanel /></div>
      ) : (
        <div className="mt-4 space-y-3">
          {/* 성질 카드 */}
          <div className="rounded-xl border border-white/10 bg-slate-900 p-3.5">
            <p className="text-sm font-bold text-slate-100">{info!.title}</p>
            <p className="mt-1 inline-block rounded bg-slate-950 px-2.5 py-1 font-mono text-sm text-amber-300">{info!.formula}</p>
            <p className="mt-1.5 text-xs text-slate-500">{info!.hint}</p>
          </div>

          {/* 뷰 토글 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">표시:</span>
            <button type="button" className={vtBtn(view === "num")} onClick={() => setView("num")}>숫자</button>
            <button type="button" className={vtBtn(view === "comb")} onClick={() => setView("comb")}>이항계수</button>

            {tab === 5 ? (
              <>
                <span className="ml-3 text-xs text-slate-500">방향:</span>
                <button type="button" className={vtBtn(hockeyDir === "right")} onClick={() => switchHockey("right")}>▶ 우방향 (열 고정)</button>
                <button type="button" className={vtBtn(hockeyDir === "left")} onClick={() => switchHockey("left")}>◀ 좌방향 (대각선 고정)</button>
              </>
            ) : null}
          </div>

          {/* 삼각형 */}
          <div className="overflow-hidden rounded-xl bg-slate-950 p-1">
            <Triangle view={view} hlMap={hlMap} onCell={handleCell} />
          </div>

          {/* 결과 */}
          <div className="min-h-[2.5rem] rounded-lg bg-slate-900 px-3 py-2 text-sm leading-6">
            {result ?? <span className="text-slate-500">셀을 클릭하면 해당 성질이 표시됩니다.</span>}
          </div>
        </div>
      )}

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
