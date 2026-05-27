"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import { sup } from "@/lib/activities/anim";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

function comb(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  r = Math.min(r, n - r);
  let res = 1;
  for (let i = 0; i < r; i++) res = (res * (n - i)) / (i + 1);
  return Math.round(res);
}

const VARS = ["x", "y", "z", "w", "v"];

// 차수별 색 (동류항 = 같은 색). 인라인 style 대신 정적 클래스 맵.
const DEG_TEXT = ["text-[#fde68a]", "text-[#c4b5fd]", "text-[#86efac]", "text-[#93c5fd]", "text-[#fca5a5]", "text-[#fdba74]", "text-[#a5f3fc]"];
const DEG_BORDER = ["border-[#fde68a]/50", "border-[#c4b5fd]/50", "border-[#86efac]/50", "border-[#93c5fd]/50", "border-[#fca5a5]/50", "border-[#fdba74]/50", "border-[#a5f3fc]/50"];
const DEG_BG = ["bg-[#fde68a]/15", "bg-[#c4b5fd]/15", "bg-[#86efac]/15", "bg-[#93c5fd]/15", "bg-[#fca5a5]/15", "bg-[#fdba74]/15", "bg-[#a5f3fc]/15"];

function mono(exps: number[]): string {
  let s = "";
  for (let i = 0; i < exps.length; i++) {
    if (exps[i] === 0) continue;
    s += VARS[i] + (exps[i] > 1 ? sup(exps[i]) : "");
  }
  return s || "1";
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "rc_vs_bi",
    prompt:
      "(x+y+z)ⁿ 같은 여러 변수 일차식은 중복조합으로, (1+x+x²)ⁿ 같은 한 문자 고차식은 이항정리로 항의 개수를 세는데, 그 차이(동류항 발생 여부)를 설명해 보세요.",
    kind: "text",
  },
  {
    id: "why_dn1",
    prompt: "한 문자 고차식 (1+x+⋯+xᵈ)ⁿ 의 서로 다른 항의 개수가 dn+1인 이유를 설명해 보세요.",
    kind: "text",
  },
];

function Slider({ id, label, min, max, value, onChange, blue }: { id: string; label: string; min: number; max: number; value: number; onChange: (v: number) => void; blue?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-slate-400">{label}</label>
        <span className={`rounded-md px-2 py-0.5 text-sm font-extrabold text-white ${blue ? "bg-indigo-500" : "bg-amber-500"}`}>{value}</span>
      </div>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`mt-1 w-36 ${blue ? "accent-indigo-400" : "accent-amber-400"}`} />
    </div>
  );
}
function Kpi({ num, lbl, blue }: { num: number; lbl: string; blue?: boolean }) {
  return (
    <div className="min-w-[88px] flex-1 rounded-xl border border-white/10 bg-white/5 p-3 text-center">
      <div className={`text-2xl font-black ${blue ? "text-indigo-300" : "text-amber-300"}`}>{num}</div>
      <div className="mt-1 text-xs text-slate-400">{lbl}</div>
    </div>
  );
}

// ① 여러 변수 일차식 → 중복조합
function TabRC() {
  const [k, setK] = useState(3);
  const [n, setN] = useState(4);
  const total = comb(k + n - 1, n);
  const vars = VARS.slice(0, k);

  const chips = useMemo(() => {
    if (!(k <= 3 && n <= 5)) return null;
    const out: number[][] = [];
    if (k === 2) for (let a = n; a >= 0; a--) out.push([a, n - a]);
    else if (k === 3) for (let a = n; a >= 0; a--) for (let b = n - a; b >= 0; b--) out.push([a, b, n - a - b]);
    else for (let a = n; a >= 0; a--) out.push([a]); // k는 2 또는 3만 여기 도달(아래 가드)
    return out;
  }, [k, n]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">⚙️ ({vars.join("+")})ⁿ 꼴</p>
        <div className="mt-3 flex flex-wrap gap-6">
          <Slider id="rc-k" label="변수 개수 k" min={2} max={5} value={k} onChange={setK} />
          <Slider id="rc-n" label="지수 n" min={1} max={6} value={n} onChange={setN} blue />
        </div>
        <p className="mt-3 text-lg font-extrabold text-white">({vars.join("+")}){sup(n)}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">🔍 왜 중복조합인가?</p>
        <ol className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
          <li><b className="text-amber-300">1.</b> 각 항은 {vars.map((v) => `${v}^i`).join("")} 꼴, 지수 합 = n ({vars.map((v) => `i_${v}`).join("+")} = {n}).</li>
          <li><b className="text-amber-300">2.</b> 변수 {k}개 → "합이 n인 음 아닌 정수 순서쌍의 수"와 같음.</li>
          <li><b className="text-amber-300">3.</b> 그 수 = <b className="text-amber-300">ₖHₙ = ₖ₊ₙ₋₁Cₙ</b> ({k}종류에서 중복 허용 {n}개 택함).</li>
          <li><b className="text-amber-300">4.</b> 서로 다른 변수 곱이라 <b>동류항이 없음</b> → 항 개수 = 순서쌍 수 = <b className="text-amber-300">{total}개</b>.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">📐 계산 결과</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Kpi num={k} lbl="변수 종류 k" />
          <Kpi num={n} lbl="지수 n" />
          <Kpi num={k + n - 1} lbl="k+n−1" />
          <Kpi num={total} lbl="항의 개수" />
        </div>
        <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-center">
          <span className="text-xl font-black text-amber-300">ₖHₙ = ₖ₊ₙ₋₁Cₙ = {total}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">📦 실제 단항식 목록 {chips ? <span className="text-xs font-normal text-slate-400">({chips.length}개)</span> : null}</p>
        <div className="mt-2 flex max-h-52 flex-wrap gap-1.5 overflow-y-auto rounded-xl bg-black/20 p-2.5">
          {chips ? (
            chips.map((e, i) => (
              <span key={i} className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 font-mono text-sm text-amber-100">{mono(e)}</span>
            ))
          ) : (
            <span className="text-sm text-slate-500">k≤3, n≤5일 때 단항식 목록을 표시합니다.</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ② 한 문자 고차식 → 이항정리
function TabBI() {
  const [d, setD] = useState(2);
  const [n, setN] = useState(3);
  const maxDeg = d * n;
  const exprTerms = Array.from({ length: d + 1 }, (_, i) => (i === 0 ? "1" : i === 1 ? "x" : `x${sup(i)}`)).join("+");

  // 동류항 합산 전: (e0..ed) 합 n 조합 → deg = Σ i*ei
  const before = useMemo(() => {
    if (!(d <= 3 && n <= 4)) return null;
    const out: number[] = [];
    const gen = (idx: number, rem: number, cur: number[]) => {
      if (idx === d) {
        const deg = [...cur, rem].reduce((s, v, i) => s + i * v, 0);
        out.push(deg);
        return;
      }
      for (let v = rem; v >= 0; v--) { cur.push(v); gen(idx + 1, rem - v, cur); cur.pop(); }
    };
    gen(0, n, []);
    return out;
  }, [d, n]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-indigo-300">⚙️ ({exprTerms})ⁿ 꼴</p>
        <div className="mt-3 flex flex-wrap gap-6">
          <Slider id="bi-d" label="최고 차수 d" min={1} max={4} value={d} onChange={setD} blue />
          <Slider id="bi-n" label="지수 n" min={1} max={6} value={n} onChange={setN} blue />
        </div>
        <p className="mt-3 text-lg font-extrabold text-white">({exprTerms}){sup(n)}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-indigo-300">🔍 왜 이항정리인가? — 동류항 합산</p>
        <ol className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
          <li><b className="text-indigo-300">1.</b> 전개 시 각 항의 지수 = e₁+2e₂+⋯+{d}e_{d} 꼴.</li>
          <li><b className="text-indigo-300">2.</b> 최솟값 0, 최댓값 {d}×{n}={maxDeg}. 하지만 <b className="text-indigo-300">서로 다른 조합이 같은 지수</b>를 줄 수 있어 동류항이 생겨 합산됨.</li>
          <li><b className="text-indigo-300">3.</b> 중복조합으로는 셀 수 없고, 0~{maxDeg}의 차수가 모두 등장하는지 확인 → 이항(다항)정리로 계산.</li>
          <li><b className="text-indigo-300">4.</b> 서로 다른 항 개수 = 최고차 − 최저차 + 1 = <b className="text-indigo-300">{maxDeg}+1 = {maxDeg + 1}개</b>.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-indigo-300">📐 계산 결과</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Kpi num={d} lbl="최고차수 d" blue />
          <Kpi num={n} lbl="지수 n" blue />
          <Kpi num={maxDeg} lbl="최고차수 d×n" blue />
          <Kpi num={maxDeg + 1} lbl="서로 다른 항 수" blue />
        </div>
        <div className="mt-3 rounded-xl border border-indigo-400/30 bg-indigo-400/10 p-4 text-center">
          <span className="text-xl font-black text-indigo-300">항 개수 = d·n + 1 = {d}×{n}+1 = {maxDeg + 1}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-indigo-300">📦 동류항 합산 전/후 (같은 색 = 동류항)</p>
        {before ? (
          <>
            <p className="mt-1 text-xs text-slate-400">합산 전 {before.length}개</p>
            <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-xl bg-black/20 p-2.5">
              {before.map((deg, i) => {
                const ci = deg % DEG_TEXT.length;
                return <span key={i} className={`rounded-md border px-2.5 py-1 font-mono text-sm ${DEG_BORDER[ci]} ${DEG_BG[ci]} ${DEG_TEXT[ci]}`}>x{sup(deg)}</span>;
              })}
            </div>
            <p className="mt-3 text-xs text-slate-400">▶ 동류항 합산 후 (서로 다른 항만)</p>
            <div className="mt-2 flex flex-wrap gap-1.5 rounded-xl bg-black/20 p-2.5">
              {Array.from({ length: maxDeg + 1 }, (_, i) => {
                const ci = i % DEG_TEXT.length;
                return <span key={i} className={`rounded-md border px-2.5 py-1 font-mono text-sm ${DEG_BORDER[ci]} ${DEG_BG[ci]} ${DEG_TEXT[ci]}`}>x{sup(i)}</span>;
              })}
            </div>
          </>
        ) : (
          <p className="mt-2 rounded-lg border border-red-400/25 bg-red-400/10 p-2 text-sm text-red-300">⚠️ 목록이 너무 많습니다. d≤3, n≤4일 때 표시합니다.</p>
        )}
      </div>
    </div>
  );
}

// ③ 비교 & 정리
function TabCmp() {
  const rows: [string, React.ReactNode, React.ReactNode][] = [
    ["예시", "(x+y+z)⁴", "(1+x+x²)³"],
    ["일반항", "n!/(i!j!k!) · xⁱyʲzᵏ", "이항(다항)정리로 계수 결정"],
    ["동류항?", <span key="a" className="text-emerald-300">❌ 없음 (변수가 다름)</span>, <span key="b" className="text-red-300">✅ 있음 (차수가 겹침)</span>],
    ["항 개수", "ₖ₊ₙ₋₁Cₙ = ₖHₙ", "dn+1"],
    ["방법", <b key="c" className="text-amber-300">중복조합</b>, <b key="d" className="text-indigo-300">이항정리(다항정리)</b>],
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">📊 두 경우 한눈에 비교</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-white/10 px-3 py-2" aria-label="구분" />
                <th className="border border-white/10 px-3 py-2 text-amber-300">🟡 여러 변수 일차식</th>
                <th className="border border-white/10 px-3 py-2 text-indigo-300">🟣 한 문자 고차식</th>
              </tr>
            </thead>
            <tbody className="text-center text-slate-200">
              {rows.map(([h, y, p], i) => (
                <tr key={i}>
                  <td className="border border-white/10 bg-white/5 px-3 py-2 font-semibold text-slate-300">{h}</td>
                  <td className="border border-white/10 px-3 py-2">{y}</td>
                  <td className="border border-white/10 px-3 py-2">{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">💡 핵심 판단 기준</p>
        <ol className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
          <li><b className="text-amber-300">1.</b> 각 항이 <b>서로 다른 변수의 곱</b>인가? → <b className="text-amber-300">중복조합</b> (예 x²yz, y³ — 절대 합쳐지지 않음).</li>
          <li><b className="text-indigo-300">2.</b> 각 항이 <b>같은 변수 x의 거듭제곱</b>인가? → <b className="text-indigo-300">이항정리</b> (같은 차수끼리 합산).</li>
          <li><b className="text-emerald-300">3.</b> 한 문자 고차식의 항 개수 = 최고차 dn − 최저차 0 + 1 = <b>dn+1</b>개.</li>
        </ol>
        <div className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-center">
          <span className="block text-base font-black text-emerald-300">(1+x+x²)³ = x⁶+3x⁵+6x⁴+7x³+6x²+3x+1</span>
          <span className="text-sm text-emerald-200/80">최고차 2×3=6, 최저차 0 → 6−0+1 = 7개 ✅</span>
        </div>
      </div>
    </div>
  );
}

// ④ 분류 퀴즈
type QItem = { expr: string; type: "rc" | "bi"; answer: number; explanation: string };
const QUIZ_DATA: QItem[] = [
  { expr: "(x+y+z)⁴", type: "rc", answer: 15, explanation: "3변수 일차식 → 중복조합 ₃H₄ = ₆C₄ = 15개" },
  { expr: "(a+b+c+d)³", type: "rc", answer: 20, explanation: "4변수 일차식 → 중복조합 ₄H₃ = ₆C₃ = 20개" },
  { expr: "(1+x+x²)³", type: "bi", answer: 7, explanation: "한 문자 2차식 → 이항정리: 최고차 6, 6+1 = 7개" },
  { expr: "(x+y)⁵", type: "rc", answer: 6, explanation: "2변수 일차식 → 중복조합 ₂H₅ = ₆C₅ = 6개" },
  { expr: "(1+x+x²+x³)²", type: "bi", answer: 7, explanation: "한 문자 3차식 → 이항정리: 최고차 6, 6+1 = 7개" },
  { expr: "(x+y+z+w)²", type: "rc", answer: 10, explanation: "4변수 일차식 → 중복조합 ₄H₂ = ₅C₂ = 10개" },
  { expr: "(x+x²)⁴", type: "bi", answer: 5, explanation: "한 문자: 최저차 4, 최고차 8 → 8−4+1 = 5개" },
  { expr: "(x+y+z)⁶", type: "rc", answer: 28, explanation: "3변수 일차식 → 중복조합 ₃H₆ = ₈C₆ = 28개" },
];

// 진행률 바 너비(8문항) — 인라인 style 대신 정적 클래스.
const PROGRESS_W = ["w-0", "w-[12.5%]", "w-[25%]", "w-[37.5%]", "w-[50%]", "w-[62.5%]", "w-[75%]", "w-[87.5%]", "w-full"];

function TabQuiz() {
  const [state, setState] = useState<Record<number, "rc" | "bi">>({});
  const done = Object.keys(state).length;
  const correct = QUIZ_DATA.filter((q, i) => state[i] === q.type).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <p className="text-sm font-bold text-amber-300">🎮 분류 퀴즈 — 중복조합 vs 이항정리</p>
      <p className="mt-1 text-sm text-slate-400">각 식에 알맞은 풀이 방법을 선택하세요.</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full bg-emerald-400 transition-all ${PROGRESS_W[done]}`} />
      </div>
      <p className="mt-2 text-sm text-slate-400">진행: {done} / {QUIZ_DATA.length} | 정답: {correct}개</p>

      <div className="mt-4 space-y-3">
        {QUIZ_DATA.map((q, i) => {
          const chosen = state[i];
          const answered = chosen !== undefined;
          const isCorrect = answered && chosen === q.type;
          const cardClass = !answered ? "border-white/12 bg-white/[0.04]" : isCorrect ? "border-emerald-400 bg-emerald-400/10" : "border-red-400 bg-red-400/10";
          return (
            <div key={i} className={`rounded-xl border-2 p-4 ${cardClass}`}>
              <h4 className="font-bold text-slate-100">
                {answered ? (isCorrect ? "✅ " : "❌ ") : ""}Q{i + 1}. {q.expr} 를 전개할 때 서로 다른 항의 개수는?
              </h4>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={answered} onClick={() => setState((s) => ({ ...s, [i]: "rc" }))} className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-400/25 disabled:opacity-45">🟡 중복조합</button>
                <button type="button" disabled={answered} onClick={() => setState((s) => ({ ...s, [i]: "bi" }))} className="rounded-lg border border-indigo-400/40 bg-indigo-400/10 px-4 py-2 text-sm font-bold text-indigo-300 transition hover:bg-indigo-400/25 disabled:opacity-45">🟣 이항정리</button>
              </div>
              {answered ? (
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  <b>{isCorrect ? "🎉 정답!" : "😅 오답!"}</b> {q.explanation}<br />
                  <b>→ 서로 다른 항의 개수: <span className="text-amber-300">{q.answer}개</span></b>
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <button type="button" onClick={() => setState({})} className="mt-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-5 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-400/25">
        🔄 처음부터 다시
      </button>
    </div>
  );
}

export default function PolyExpandTermCount() {
  const [tab, setTab] = useState<"rc" | "bi" | "cmp" | "quiz">("rc");
  const tabBtn = (active: boolean) =>
    active ? "rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950" : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 중복조합 / 이항정리</p>
        <h3 className="mt-2 text-2xl font-bold">🔢 다항식 전개의 항의 개수</h3>
        <p className="mt-2 leading-7 text-slate-300">
          (x+y+z)ⁿ 같은 여러 변수 일차식은 <b className="text-amber-300">중복조합</b>, (1+x+x²)ⁿ 같은 한 문자 고차식은{" "}
          <b className="text-indigo-300">이항정리</b> — 두 경우를 확실히 구분해 봅니다.
        </p>
      </div>

      {/* 핵심 구분 배너 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-400/35 bg-amber-400/10 p-4">
          <p className="font-bold text-amber-300">🟡 중복조합 (ₙHᵣ)</p>
          <p className="mt-1 text-sm text-slate-300">밑이 여러 변수의 일차식. 예) (x+y+z)⁴ → 각 항 xⁱyʲzᵏ, 지수 합 = n → ₙHᵣ.</p>
        </div>
        <div className="rounded-xl border border-indigo-400/35 bg-indigo-400/10 p-4">
          <p className="font-bold text-indigo-300">🟣 이항정리</p>
          <p className="mt-1 text-sm text-slate-300">밑이 한 문자의 고차식. 예) (1+x+x²)³ → 차수가 겹쳐 동류항 합산 → dn+1.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "rc")} onClick={() => setTab("rc")}>🟡 여러 변수 → 중복조합</button>
        <button type="button" className={tabBtn(tab === "bi")} onClick={() => setTab("bi")}>🟣 한 문자 고차 → 이항정리</button>
        <button type="button" className={tabBtn(tab === "cmp")} onClick={() => setTab("cmp")}>📊 비교 & 정리</button>
        <button type="button" className={tabBtn(tab === "quiz")} onClick={() => setTab("quiz")}>🎮 분류 퀴즈</button>
      </div>

      <div className="mt-4">
        {tab === "rc" ? <TabRC /> : tab === "bi" ? <TabBI /> : tab === "cmp" ? <TabCmp /> : <TabQuiz />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
