"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import { sup } from "@/lib/activities/anim";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─────────────────────────────────────────────────────────────
//  공용 수학 유틸
// ─────────────────────────────────────────────────────────────
function comb(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  r = Math.min(r, n - r);
  let res = 1;
  for (let i = 0; i < r; i++) res = (res * (n - i)) / (i + 1);
  return Math.round(res);
}

// ₙCᵣ 아래첨자 표기
const SUB: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
};
function subTxt(v: number): string {
  return String(v).split("").map((c) => SUB[c] ?? c).join("");
}
function combTxt(n: number, r: number): string {
  return subTxt(n) + "C" + subTxt(r);
}

// aᵏbⁿ⁻ᵏ 단항식(문자열). 지수 1은 생략.
function mono(aExp: number, bExp: number): string {
  let s = "";
  if (aExp === 1) s += "a";
  else if (aExp > 1) s += "a" + sup(aExp);
  if (bExp === 1) s += "b";
  else if (bExp > 1) s += "b" + sup(bExp);
  return s || "1";
}

// (pa + qb)ⁿ 표기. p,q 부호·계수 1 생략 규칙 반영.
function binExpr(p: number, q: number, n: number): string {
  const ps = p < 0 ? "−" : "";
  const pc = Math.abs(p) === 1 ? "" : String(Math.abs(p));
  const qs = q < 0 ? " − " : " + ";
  const qc = Math.abs(q) === 1 ? "" : String(Math.abs(q));
  return `(${ps}${pc}a${qs}${qc}b)${sup(n)}`;
}

// (a+b)ⁿ → aᵏbⁿ⁻ᵏ 항이 만들어지는 모든 선택(true=a, false=b).
function genSelections(n: number, k: number): boolean[][] {
  const out: boolean[][] = [];
  const go = (pos: number, rem: number, cur: boolean[]) => {
    if (rem === 0) {
      const row = [...cur];
      while (row.length < n) row.push(false);
      out.push(row);
      return;
    }
    if (pos >= n || n - pos < rem) return;
    go(pos + 1, rem - 1, [...cur, true]);
    go(pos + 1, rem, [...cur, false]);
  };
  go(0, k, []);
  return out;
}

// ─────────────────────────────────────────────────────────────
//  성찰 고유 질문 (공통 '느낀점'은 ReflectionForm 이 자동 부착)
// ─────────────────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_ncr",
    prompt:
      "(a+b)ⁿ 을 전개하면 aᵏbⁿ⁻ᵏ 항의 계수가 ₙCₖ 가 됩니다. 그 이유를 “n개의 인수 중 k개에서 a를 고른다”는 표현으로 설명해 보세요.",
    kind: "text",
  },
  {
    id: "coeff_breakdown",
    prompt:
      "(pa+qb)ⁿ 처럼 계수가 붙으면 특정 항의 계수가 ₙCᵣ × pʳ × qⁿ⁻ʳ 로 분해됩니다. p나 q가 음수일 때 항의 부호가 어떻게 결정되는지까지 포함해 설명해 보세요.",
    kind: "text",
  },
];

// ─────────────────────────────────────────────────────────────
//  공용 작은 컴포넌트
// ─────────────────────────────────────────────────────────────
function Slider({
  id, label, min, max, value, onChange, tone = "cyan",
}: {
  id: string; label: string; min: number; max: number;
  value: number; onChange: (v: number) => void; tone?: "cyan" | "amber";
}) {
  const badge = tone === "cyan" ? "bg-cyan-500 text-slate-950" : "bg-amber-500 text-slate-950";
  const accent = tone === "cyan" ? "accent-cyan-400" : "accent-amber-400";
  return (
    <div>
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </label>
        <span className={`rounded-md px-2 py-0.5 text-sm font-extrabold ${badge}`}>{value}</span>
      </div>
      <input
        id={id} type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`mt-1 w-44 ${accent}`}
      />
    </div>
  );
}

function Stepper({
  label, value, onAdd, onSub, tone = "cyan",
}: {
  label: string; value: number; onAdd: () => void; onSub: () => void; tone?: "cyan" | "amber";
}) {
  const badge = tone === "cyan" ? "bg-cyan-500 text-slate-950" : "bg-amber-500 text-slate-950";
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button" onClick={onSub}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-lg font-extrabold text-slate-300 transition hover:bg-white/15"
        >
          −
        </button>
        <span className={`min-w-[34px] rounded-md px-2.5 py-1 text-center text-base font-black ${badge}`}>{value}</span>
        <button
          type="button" onClick={onAdd}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-lg font-extrabold text-slate-300 transition hover:bg-white/15"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  탭 ① 선택 시각화
// ═══════════════════════════════════════════════════════════════
function TabViz() {
  const [n, setN] = useState(4);
  const [k, setK] = useState(3);
  const kClamped = Math.min(k, n);
  const nk = n - kClamped;

  const selections = useMemo(() => genSelections(n, kClamped), [n, kClamped]);
  const count = selections.length;
  const target = mono(kClamped, nk);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-cyan-300">⚙️ 탐구 설정</p>
        <div className="mt-3 flex flex-wrap gap-8">
          <Slider id="viz-n" label="n (지수)" min={1} max={8} value={n}
            onChange={(v) => { setN(v); if (k > v) setK(v); }} tone="cyan" />
          <Slider id="viz-k" label="a의 지수 k" min={0} max={n} value={kClamped}
            onChange={setK} tone="amber" />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          <span className="font-bold text-cyan-300">🔵 파란색 = a 선택</span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="font-bold text-amber-300">🟡 노란색 = b 선택</span>
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-cyan-300">
          🎯 (a+b){sup(n)} 전개 → <span className="text-amber-300">{target}</span> 항이 만들어지는 모든 선택
        </p>
        <div className="mt-3 max-h-[26rem] space-y-1 overflow-y-auto rounded-xl bg-black/20 p-2.5">
          {selections.map((sel, i) => {
            const seq = sel.map((a) => (a ? "a" : "b")).join("");
            return (
              <div
                key={i}
                className="flex animate-[fadeIn_0.25s_ease_both] items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.015] px-2.5 py-1.5"
              >
                <span className="w-6 shrink-0 text-right text-[11px] text-slate-600">{i + 1}</span>
                <span className="flex shrink-0 items-center">
                  {sel.map((a, j) => (
                    <span key={j} className="flex items-center text-sm">
                      <span className="text-slate-600">(</span>
                      <span className={`inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[13px] font-extrabold transition ${a ? "bg-cyan-500 text-white" : "text-slate-600"}`}>a</span>
                      <span className="px-px text-[11px] text-slate-700">+</span>
                      <span className={`inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[13px] font-extrabold transition ${!a ? "bg-amber-500 text-slate-950" : "text-slate-600"}`}>b</span>
                      <span className="text-slate-600">)</span>
                    </span>
                  ))}
                </span>
                <span className="shrink-0 px-1.5 text-cyan-300">→</span>
                <span className="shrink-0 font-mono text-sm font-extrabold text-amber-300">{seq}</span>
                <span className="shrink-0 px-1 text-slate-600">=</span>
                <span className="shrink-0 text-[13px] italic text-cyan-200">{target}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-center">
          <div className="text-2xl font-black text-cyan-200">
            {combTxt(n, kClamped)} = <span className="text-emerald-300">{count}</span>
          </div>
          <p className="mt-2 text-sm text-slate-300">
            {n}개의 인수 중 <b className="text-cyan-200">{kClamped}개</b>에서 a를 선택하는 방법 ={" "}
            (a+b){sup(n)}에서 {target} 항의 계수 ={" "}
            <b className="text-emerald-300 text-lg">{count}</b>
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  탭 ② 일반 이항식
// ═══════════════════════════════════════════════════════════════
function clampPQ(v: number, d: number): number {
  let nv = Math.max(-5, Math.min(5, v + d));
  if (nv === 0) nv = v + d > 0 ? 1 : -1; // 0 건너뛰기
  return Math.max(-5, Math.min(5, nv));
}

function TabGen() {
  const [n, setN] = useState(4);
  const [p, setP] = useState(1);
  const [q, setQ] = useState(1);
  const [selTerm, setSelTerm] = useState(-1);

  const terms = useMemo(() => {
    const out: { r: number; coeff: number }[] = [];
    for (let r = n; r >= 0; r--) out.push({ r, coeff: comb(n, r) * Math.pow(p, r) * Math.pow(q, n - r) });
    return out;
  }, [n, p, q]);

  const pascalRows = Math.min(Math.max(n, 5), 9);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-cyan-300">⚙️ 탐구 설정</p>
        <div className="mt-3 flex flex-wrap items-end gap-8">
          <Slider id="gen-n" label="n (지수)" min={1} max={7} value={n}
            onChange={(v) => { setN(v); setSelTerm(-1); }} tone="cyan" />
          <Stepper label="a의 계수 p" value={p} tone="cyan"
            onAdd={() => { setP((v) => clampPQ(v, 1)); setSelTerm(-1); }}
            onSub={() => { setP((v) => clampPQ(v, -1)); setSelTerm(-1); }} />
          <Stepper label="b의 계수 q" value={q} tone="amber"
            onAdd={() => { setQ((v) => clampPQ(v, 1)); setSelTerm(-1); }}
            onSub={() => { setQ((v) => clampPQ(v, -1)); setSelTerm(-1); }} />
        </div>
        <p className="mt-3 text-xs text-slate-500">p, q 범위: −5 ~ 5 (0 제외)</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-cyan-300">📖 전개식 — 항을 클릭하면 계수 분해를 볼 수 있어요!</p>
        <p className="mt-3 text-lg font-extrabold text-cyan-100">{binExpr(p, q, n)} 의 전개식</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {terms.map(({ r, coeff }, idx) => {
            const nk = n - r;
            const absC = Math.abs(coeff);
            const isSel = selTerm === r;
            let label = "";
            if (r === 0 && nk === 0) label = String(absC);
            else {
              if (absC !== 1) label += String(absC);
              label += mono(r, nk);
            }
            return (
              <span key={r} className="flex items-center gap-2">
                {idx === 0
                  ? (coeff < 0 ? <span className="text-lg font-bold text-slate-500">−</span> : null)
                  : <span className="text-lg font-bold text-slate-500">{coeff >= 0 ? "+" : "−"}</span>}
                <button
                  type="button"
                  onClick={() => setSelTerm(isSel ? -1 : r)}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${isSel ? "-translate-y-0.5 border-emerald-400/60 bg-emerald-400/15 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,.2)]" : "border-white/12 bg-white/5 text-slate-200 hover:bg-white/10"}`}
                >
                  {label}
                </button>
              </span>
            );
          })}
        </div>

        {selTerm >= 0 ? (() => {
          const r = selTerm, nk = n - r;
          const cn = comb(n, r), pr = Math.pow(p, r), qnk = Math.pow(q, nk), tot = cn * pr * qnk;
          return (
            <div className="mt-4 animate-[fadeIn_0.25s_ease] rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
              <p className="text-sm font-bold text-emerald-300">📦 {mono(r, nk)} 항의 계수 분해</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
                <div className="min-w-[80px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center">
                  <div className="text-sm text-slate-400">{combTxt(n, r)}</div>
                  <div className="text-xl font-black text-emerald-300">{cn}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{n}개 중 {r}개에서 a 선택</div>
                </div>
                <span className="text-xl font-bold text-slate-600">×</span>
                <div className="min-w-[80px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center">
                  <div className="text-sm text-slate-400">({p}){sup(r) || ""}</div>
                  <div className="text-xl font-black text-cyan-300">{pr}</div>
                  <div className="mt-1 text-[11px] text-slate-500">a 계수 {p}의 {r}제곱</div>
                </div>
                <span className="text-xl font-bold text-slate-600">×</span>
                <div className="min-w-[80px] rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center">
                  <div className="text-sm text-slate-400">({q}){sup(nk) || ""}</div>
                  <div className="text-xl font-black text-amber-300">{qnk}</div>
                  <div className="mt-1 text-[11px] text-slate-500">b 계수 {q}의 {nk}제곱</div>
                </div>
                <span className="text-xl font-bold text-slate-600">=</span>
                <div className="min-w-[80px] rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-center">
                  <div className="text-2xl font-black text-emerald-300">{tot}</div>
                  <div className="mt-1 text-[11px] text-slate-500">계수</div>
                </div>
              </div>
              <p className="mt-3 text-center text-sm text-slate-400">
                {combTxt(n, r)} × ({p}){sup(r)} × ({q}){sup(nk)} = {cn} × {pr} × {qnk} ={" "}
                <b className="text-emerald-300">{tot}</b>
              </p>
            </div>
          );
        })() : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-cyan-300">🔺 파스칼의 삼각형 (현재 n={n} 행 강조)</p>
        <div className="mt-3 overflow-x-auto">
          <div className="min-w-max">
            {Array.from({ length: pascalRows + 1 }, (_, row) => (
              <div key={row} className="my-1 flex items-center justify-center gap-1">
                <span className="mr-1 w-8 shrink-0 text-right text-[10px] text-slate-600">n={row}</span>
                {Array.from({ length: row + 1 }, (_, c) => {
                  const hi = row === n;
                  return (
                    <span
                      key={c}
                      title={`${combTxt(row, c)} = ${comb(row, c)}`}
                      className={`flex h-7 min-w-[34px] items-center justify-center rounded-md border text-xs font-semibold transition ${hi ? "scale-110 border-cyan-400/60 bg-cyan-400/25 text-cyan-100" : "border-white/8 bg-white/[0.03] text-slate-500"}`}
                    >
                      {comb(row, c)}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  탭 ③ 계수 퀴즈
// ═══════════════════════════════════════════════════════════════
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function nonZero(absMax: number): number {
  let v = 0;
  while (v === 0) v = randInt(-absMax, absMax);
  return v;
}
type Problem = { n: number; p: number; q: number; r: number; ans: number };
function makeProblem(nMin: number, nMax: number, absMax: number): Problem {
  const n = randInt(nMin, nMax);
  const p = nonZero(absMax);
  const q = nonZero(absMax);
  const r = randInt(0, n);
  return { n, p, q, r, ans: comb(n, r) * Math.pow(p, r) * Math.pow(q, n - r) };
}

function TabQuiz() {
  const [prob, setProb] = useState<Problem>(() => makeProblem(2, 6, 3));
  const [value, setValue] = useState("");
  const [answered, setAnswered] = useState(false);
  const [ok, setOk] = useState(false);
  const [score, setScore] = useState({ ok: 0, ng: 0 });

  const { n, p, q, r, ans } = prob;
  const nk = n - r;
  const total = score.ok + score.ng;

  function check() {
    if (answered) return;
    const v = parseInt(value, 10);
    if (Number.isNaN(v)) return;
    const correct = v === ans;
    setOk(correct);
    setAnswered(true);
    setScore((s) => ({ ok: s.ok + (correct ? 1 : 0), ng: s.ng + (correct ? 0 : 1) }));
  }
  function next() {
    setProb(makeProblem(2, 6, 3));
    setValue("");
    setAnswered(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap justify-center gap-2">
        <ScoreBox value={score.ok} label="정답" tone="text-emerald-300" />
        <ScoreBox value={score.ng} label="오답" tone="text-red-300" />
        <ScoreBox value={total ? `${Math.round((score.ok / total) * 100)}%` : "—"} label="정답률" tone="text-amber-300" />
        <ScoreBox value={total} label="도전" tone="text-cyan-300" />
      </div>

      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-6 text-center">
        <div className="text-3xl font-black text-amber-300">{binExpr(p, q, n)}</div>
        <p className="mt-2 text-sm text-slate-400">전개식에서 다음 항의 <b className="text-slate-200">계수</b>를 구하시오.</p>
        <div className="mt-1 text-2xl font-extrabold text-amber-200">{mono(r, nk)}의 계수</div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <input
          value={value}
          inputMode="numeric"
          disabled={answered}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") check(); }}
          placeholder="계수 입력"
          aria-label="계수 입력"
          className="w-36 rounded-xl border-2 border-white/15 bg-white/5 px-4 py-2 text-center text-xl font-extrabold text-white outline-none transition focus:border-cyan-400 disabled:opacity-60"
        />
        <button type="button" onClick={check} disabled={answered}
          className="rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50">
          확인 ✓
        </button>
        <button type="button" onClick={next}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10">
          새 문제 🔄
        </button>
      </div>

      {answered ? (
        <div className={`animate-[fadeIn_0.25s_ease] rounded-2xl border p-4 text-center text-base font-bold ${ok ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-red-400/40 bg-red-400/10 text-red-200"}`}>
          {ok ? <>🎉 정답! 계수는 <b>{ans}</b></> : <>❌ 아쉬워요. 정답은 <b>{ans}</b></>}
        </div>
      ) : null}

      {answered ? (
        <div className="animate-[fadeIn_0.25s_ease] rounded-2xl border border-indigo-400/20 bg-indigo-400/[0.06] p-4">
          <p className="text-sm font-bold text-indigo-300">💡 풀이 과정</p>
          <p className="mt-2 text-center leading-8 text-slate-300">
            {combTxt(n, r)} × ({p}){sup(r)} × ({q}){sup(nk)} ={" "}
            <b className="text-cyan-300">{comb(n, r)}</b> × <b className="text-cyan-200">{Math.pow(p, r)}</b> ×{" "}
            <b className="text-amber-300">{Math.pow(q, nk)}</b> = <b className="text-emerald-300 text-lg">{ans}</b>
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ScoreBox({ value, label, tone }: { value: number | string; label: string; tone: string }) {
  return (
    <div className="min-w-[84px] rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-center">
      <div className={`text-2xl font-black ${tone}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  탭 ④ 도전 모드
// ═══════════════════════════════════════════════════════════════
type Diff = "easy" | "mid" | "hard";
const DIFF_CFG: Record<Diff, { nMax: number; absMax: number; base: number; label: string }> = {
  easy: { nMax: 3, absMax: 2, base: 10, label: "🌱 쉬움" },
  mid: { nMax: 5, absMax: 3, base: 20, label: "🔥 보통" },
  hard: { nMax: 7, absMax: 5, base: 30, label: "⚡ 어려움" },
};
const TOTAL_SEC = 60;
const RING_R = 38;
const RING_C = 2 * Math.PI * RING_R; // 둘레 ≈ 238.76
const HS_KEY = "binomial_coeff_viz:highscore";

type HighScore = { score: number; diff: Diff };

function loadHighScore(): HighScore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HS_KEY);
    return raw ? (JSON.parse(raw) as HighScore) : null;
  } catch {
    return null;
  }
}

function TabChallenge() {
  const [phase, setPhase] = useState<"start" | "play" | "over">("start");
  const [diff, setDiff] = useState<Diff>("easy");
  const [timeLeft, setTimeLeft] = useState(TOTAL_SEC);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [stat, setStat] = useState({ ok: 0, ng: 0 });
  const [prob, setProb] = useState<Problem | null>(null);
  const [value, setValue] = useState("");
  const [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null);
  const [highScore, setHighScore] = useState<HighScore | null>(null);
  const [finalScore, setFinalScore] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // 콜백/타이머에서 항상 최신 값을 읽기 위한 refs
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const probRef = useRef<Problem | null>(null);
  const lockRef = useRef(false);

  useEffect(() => { setHighScore(loadHighScore()); }, []);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function newQ() {
    const cfg = DIFF_CFG[diff];
    const next = makeProblem(1, cfg.nMax, cfg.absMax);
    probRef.current = next;
    setProb(next);
    setValue("");
    setFb(null);
    lockRef.current = false;
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function start() {
    setScore(0); scoreRef.current = 0;
    setCombo(0); comboRef.current = 0;
    setStat({ ok: 0, ng: 0 });
    setTimeLeft(TOTAL_SEC);
    setPhase("play");
    newQ();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { finish(); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  function finish() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const fs = scoreRef.current;
    setFinalScore(fs);
    setPhase("over");
    setHighScore((prev) => {
      if (fs > 0 && (!prev || fs > prev.score)) {
        const next = { score: fs, diff };
        try { window.localStorage.setItem(HS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      }
      return prev;
    });
  }

  function check() {
    if (lockRef.current || !timerRef.current || !probRef.current) return;
    const v = parseInt(value, 10);
    if (Number.isNaN(v)) return;
    lockRef.current = true;
    const cfg = DIFF_CFG[diff];
    const correct = v === probRef.current.ans;
    if (correct) {
      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      setCombo(nextCombo);
      const mul = Math.min(nextCombo, 3);
      const pts = cfg.base * mul;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setStat((s) => ({ ...s, ok: s.ok + 1 }));
      setFb({ ok: true, text: `🎉 정답! +${pts}점${nextCombo >= 2 ? ` (×${mul} 콤보!)` : ""}` });
    } else {
      comboRef.current = 0;
      setCombo(0);
      scoreRef.current = Math.max(0, scoreRef.current - 10);
      setScore(scoreRef.current);
      setStat((s) => ({ ...s, ng: s.ng + 1 }));
      setFb({ ok: false, text: `❌ 답은 ${probRef.current.ans} · −10점` });
    }
    setTimeout(() => { if (timerRef.current) newQ(); }, 850);
  }

  const ringOffset = (RING_C * (1 - timeLeft / TOTAL_SEC)).toFixed(2);
  const danger = timeLeft <= 10;
  const mul = Math.min(combo, 3);

  // ── 시작 화면 ──
  if (phase === "start") {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <DiffSelector diff={diff} onSelect={setDiff} />
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
          <div className="text-5xl">⏱️</div>
          <p className="mt-3 text-lg font-bold text-cyan-200">60초 동안 최대한 많이 맞춰보세요!</p>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            연속 정답 시 콤보 보너스 × 배율 획득<br />
            🌱 쉬움 = n≤3 &nbsp;|&nbsp; 🔥 보통 = n≤5 &nbsp;|&nbsp; ⚡ 어려움 = n≤7
          </p>
          {highScore ? (
            <p className="mt-3 text-sm font-bold text-amber-300">🏅 내 최고 기록: {highScore.score}점 ({DIFF_CFG[highScore.diff].label})</p>
          ) : null}
          <button type="button" onClick={start}
            className="mt-5 rounded-xl bg-cyan-300 px-10 py-3.5 text-base font-bold text-slate-950 transition hover:bg-cyan-200">
            🏁 시작!
          </button>
        </div>
        <CrossUserLeaderboard />
      </div>
    );
  }

  // ── 게임 종료 화면 ──
  if (phase === "over") {
    const msgs = ["잘했어요! 계속 연습해 보세요.", "훌륭해요! 이항정리 마스터!", "대단해요! 완벽한 실력이에요!"];
    const lvl = finalScore < 100 ? 0 : finalScore < 250 ? 1 : 2;
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-7 text-center">
          <p className="text-2xl font-black text-cyan-200">⏰ 시간 종료!</p>
          <p className="my-2 text-5xl font-black text-amber-300">{finalScore}점</p>
          <p className="text-sm text-slate-400">✅ {stat.ok}문제 정답 &nbsp;|&nbsp; ❌ {stat.ng}문제 오답 &nbsp;|&nbsp; {msgs[lvl]}</p>
          {highScore ? <p className="mt-2 text-sm font-bold text-cyan-200">🏅 최고 기록: {highScore.score}점</p> : null}
          <button type="button" onClick={() => setPhase("start")}
            className="mt-5 rounded-xl bg-cyan-300 px-9 py-3 text-base font-bold text-slate-950 transition hover:bg-cyan-200">
            다시 도전 🔄
          </button>
        </div>
        <CrossUserLeaderboard />
      </div>
    );
  }

  // ── 게임 진행 화면 ──
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex justify-center">
        <div className="relative inline-block">
          <svg width="90" height="90" viewBox="0 0 90 90" className="-rotate-90">
            <circle cx="45" cy="45" r={RING_R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="7" />
            <circle
              cx="45" cy="45" r={RING_R} fill="none"
              stroke={danger ? "#f87171" : "#22d3ee"} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={RING_C.toFixed(2)} strokeDashoffset={ringOffset}
              className="[transition:stroke-dashoffset_0.9s_linear]"
            />
          </svg>
          <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-black ${danger ? "text-red-300" : "text-amber-300"}`}>
            {timeLeft}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <ScoreBox value={score} label="점수" tone="text-amber-300" />
        <ScoreBox value={stat.ok} label="정답" tone="text-emerald-300" />
        <ScoreBox value={stat.ng} label="오답" tone="text-red-300" />
      </div>

      {combo >= 2 ? (
        <div className="mx-auto max-w-[200px] animate-[fadeIn_0.2s_ease] rounded-2xl border border-amber-400/40 bg-amber-400/15 px-5 py-2 text-center">
          <div className="text-[11px] font-bold tracking-widest text-amber-300">COMBO</div>
          <div className="text-2xl font-black text-amber-300">× {mul}</div>
        </div>
      ) : null}

      {prob ? (
        <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.07] p-5 text-center">
          <span className="mb-2 inline-block rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-200">{DIFF_CFG[diff].label}</span>
          <div className="text-2xl font-black text-cyan-100">{binExpr(prob.p, prob.q, prob.n)}</div>
          <p className="mt-1 text-sm text-slate-400">다음 항의 <b className="text-slate-200">계수</b>를 구하시오.</p>
          <div className="text-xl font-extrabold text-cyan-200">{mono(prob.r, prob.n - prob.r)}의 계수</div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <input
          ref={inputRef}
          value={value}
          inputMode="numeric"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") check(); }}
          placeholder="계수 입력"
          aria-label="계수 입력"
          className="w-36 rounded-xl border-2 border-white/15 bg-white/5 px-4 py-2 text-center text-xl font-extrabold text-white outline-none transition focus:border-cyan-400"
        />
        <button type="button" onClick={check}
          className="rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">
          확인 ✓
        </button>
      </div>

      {fb ? (
        <div className={`animate-[fadeIn_0.2s_ease] rounded-2xl border p-3 text-center text-sm font-bold ${fb.ok ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-red-400/40 bg-red-400/10 text-red-200"}`}>
          {fb.text}
        </div>
      ) : null}
    </div>
  );
}

function DiffSelector({ diff, onSelect }: { diff: Diff; onSelect: (d: Diff) => void }) {
  const items: { key: Diff; on: string }[] = [
    { key: "easy", on: "border-emerald-400/40 bg-emerald-400/20 text-emerald-200" },
    { key: "mid", on: "border-amber-400/40 bg-amber-400/20 text-amber-200" },
    { key: "hard", on: "border-red-400/40 bg-red-400/20 text-red-200" },
  ];
  return (
    <div className="flex justify-center gap-2">
      {items.map(({ key, on }) => (
        <button
          key={key} type="button" onClick={() => onSelect(key)}
          className={`rounded-xl border px-5 py-2 text-sm font-bold transition ${diff === key ? on : "border-white/10 bg-white/5 text-slate-500 hover:bg-white/10"}`}
        >
          {DIFF_CFG[key].label}
        </button>
      ))}
    </div>
  );
}

// 크로스유저 랭킹 — 단계 3에서 Supabase(activity_scores) 조회로 배선 예정.
function CrossUserLeaderboard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <p className="text-sm font-bold text-cyan-300">🏆 도전 모드 랭킹</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        전체 학생 랭킹은 곧 연결됩니다. 지금은 내 최고 기록이 이 기기에 저장됩니다.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  메인
// ═══════════════════════════════════════════════════════════════
type TabKey = "viz" | "gen" | "quiz" | "chal";

export default function BinomialCoeffViz() {
  const [tab, setTab] = useState<TabKey>("viz");
  const tabBtn = (active: boolean) =>
    active
      ? "rounded-lg bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950"
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 이항정리</p>
        <h3 className="mt-2 text-2xl font-bold">🔢 이항정리 계수의 탄생</h3>
        <p className="mt-2 leading-7 text-slate-300">
          (a+b)ⁿ 을 전개할 때 <b className="text-cyan-300">특정 항의 계수</b>는 왜 그 값일까요? 각 일차식 (a+b)에서{" "}
          <b className="text-cyan-300">a</b> 또는 <b className="text-amber-300">b</b> 중 하나를 <b>선택</b>하는 방법의 수가
          바로 계수입니다. 네 개의 탭으로 이항정리의 본질을 탐구해 보세요.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "viz")} onClick={() => setTab("viz")}>🔍 선택 시각화</button>
        <button type="button" className={tabBtn(tab === "gen")} onClick={() => setTab("gen")}>📐 일반 이항식</button>
        <button type="button" className={tabBtn(tab === "quiz")} onClick={() => setTab("quiz")}>🎯 계수 퀴즈</button>
        <button type="button" className={tabBtn(tab === "chal")} onClick={() => setTab("chal")}>🏆 도전 모드</button>
      </div>

      <div className="mt-4">
        {tab === "viz" ? <TabViz /> : tab === "gen" ? <TabGen /> : tab === "quiz" ? <TabQuiz /> : <TabChallenge />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
