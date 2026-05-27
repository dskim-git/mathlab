"use client";

import { useEffect, useMemo, useState } from "react";
import Quiz, { type QuizItem } from "@/components/activities/Quiz";
import ReflectionForm from "@/components/activities/ReflectionForm";
import { sup } from "@/lib/activities/anim";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

function fact(n: number): number { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
function perm(n: number, r: number): number { if (r > n || r < 0) return 0; return fact(n) / fact(n - r); }
function comb(n: number, r: number): number { if (r > n || r < 0) return 0; return fact(n) / (fact(r) * fact(n - r)); }
const repPerm = (n: number, m: number) => Math.pow(n, m);
const repComb = (n: number, m: number) => comb(n + m - 1, m);

const ARROW_COLORS = ["#60a5fa", "#34d399", "#f472b6", "#a78bfa", "#fb923c"];

// ── 랜덤/전체 생성기 (0-indexed B) ──
function randomFunc(m: number, n: number) { return Array.from({ length: m }, () => Math.floor(Math.random() * n)); }
function randomInj(m: number, n: number) {
  if (m > n) return null;
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < m; i++) { const j = Math.floor(Math.random() * (n - i)) + i; [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, m);
}
function randomStrict(m: number, n: number) {
  if (m > n) return null;
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, m).sort((x, y) => x - y);
}
function randomMono(m: number, n: number) { return Array.from({ length: m }, () => Math.floor(Math.random() * n)).sort((x, y) => x - y); }

function genAllFuncs(m: number, n: number) { const r: number[][] = []; const go = (c: number[]) => { if (c.length === m) { r.push([...c]); return; } for (let j = 0; j < n; j++) { c.push(j); go(c); c.pop(); } }; go([]); return r; }
function genAllInj(m: number, n: number) { if (m > n) return []; const r: number[][] = []; const u = new Array(n).fill(false); const go = (c: number[]) => { if (c.length === m) { r.push([...c]); return; } for (let j = 0; j < n; j++) if (!u[j]) { u[j] = true; c.push(j); go(c); c.pop(); u[j] = false; } }; go([]); return r; }
function genAllStrict(m: number, n: number) { if (m > n) return []; const r: number[][] = []; const go = (c: number[], s: number) => { if (c.length === m) { r.push([...c]); return; } for (let j = s; j < n; j++) { c.push(j); go(c, j + 1); c.pop(); } }; go([], 0); return r; }
function genAllMono(m: number, n: number) { const r: number[][] = []; const go = (c: number[], s: number) => { if (c.length === m) { r.push([...c]); return; } for (let j = s; j < n; j++) { c.push(j); go(c, j); c.pop(); } }; go([], 0); return r; }

const GEN_LIMIT = 500;
const eqMap = (a: number[] | null, b: number[] | null) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// ── SVG A→B 다이어그램 ──
const STEP = 46, PAD = 34, AX = 65, BX = 265, NODE = 19;
function ArrowLine({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const sx = x1 + ux * NODE, sy = y1 + uy * NODE;
  const ex = x2 - ux * NODE, ey = y2 - uy * NODE;
  const ax = ex - ux * 9, ay = ey - uy * 9;
  const px = -uy, py = ux;
  const p1 = `${ax + px * 5},${ay + py * 5}`;
  const p2 = `${ax - px * 5},${ay - py * 5}`;
  return (
    <g opacity={0.85}>
      <line x1={sx} y1={sy} x2={ax} y2={ay} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <polygon points={`${ex},${ey} ${p1} ${p2}`} fill={color} />
    </g>
  );
}
function FunctionDiagram({ m, n, mapping }: { m: number; n: number; mapping: number[] | null }) {
  const mx = Math.max(m, n);
  const H = mx * STEP + PAD * 2;
  const W = 330;
  const ay = (i: number) => PAD + i * STEP + ((mx - m) * STEP) / 2 + STEP / 2;
  const by = (j: number) => PAD + j * STEP + ((mx - n) * STEP) / 2 + STEP / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-sm">
      <ellipse cx={AX} cy={H / 2} rx={38} ry={(m * STEP) / 2 + 14} fill="rgba(99,102,241,.08)" stroke="rgba(99,102,241,.25)" strokeWidth={1.5} />
      <ellipse cx={BX} cy={H / 2} rx={38} ry={(n * STEP) / 2 + 14} fill="rgba(245,158,11,.08)" stroke="rgba(245,158,11,.25)" strokeWidth={1.5} />
      <text x={AX} y={14} textAnchor="middle" fontSize={14} fontWeight={800} fill="#a5b4fc">A</text>
      <text x={BX} y={14} textAnchor="middle" fontSize={14} fontWeight={800} fill="#fbbf24">B</text>
      {mapping ? mapping.map((bj, i) => (
        <ArrowLine key={i} x1={AX} y1={ay(i)} x2={BX} y2={by(bj)} color={ARROW_COLORS[i % ARROW_COLORS.length]} />
      )) : null}
      {Array.from({ length: m }, (_, i) => (
        <g key={`a${i}`}>
          <circle cx={AX} cy={ay(i)} r={NODE} fill="rgba(99,102,241,.25)" stroke="#6366f1" strokeWidth={1.5} />
          <text x={AX} y={ay(i) + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="#a5b4fc">a{i + 1}</text>
        </g>
      ))}
      {Array.from({ length: n }, (_, j) => (
        <g key={`b${j}`}>
          <circle cx={BX} cy={by(j)} r={NODE} fill="rgba(245,158,11,.18)" stroke="#fbbf24" strokeWidth={1.5} />
          <text x={BX} y={by(j) + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fbbf24">b{j + 1}</text>
        </g>
      ))}
    </svg>
  );
}

function MapList({ total, all, current }: { total: number; all: () => number[][]; current: number[] | null }) {
  if (!total) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-400">📋 가능한 모든 경우 — 총 <b className="text-slate-200">{total}가지</b></p>
      {total > GEN_LIMIT ? (
        <p className="mt-1 rounded-md bg-white/5 p-2 text-xs text-slate-500">경우의 수가 너무 많아({total}가지) 목록을 생략합니다.</p>
      ) : (
        <div className="mt-2 flex max-h-52 flex-wrap gap-1 overflow-y-auto rounded-xl border border-white/5 bg-white/[0.02] p-2">
          {all().map((mp, i) => {
            const cur = eqMap(mp, current);
            return (
              <span key={i} className={`rounded-md border px-1.5 py-1 font-mono text-xs ${cur ? "border-amber-400/60 bg-amber-400/15 font-black text-amber-300" : "border-white/5 bg-white/[0.03] text-slate-500"}`}>
                ({mp.map((v) => `b${v + 1}`).join(",")})
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

type TabDef = {
  key: string;
  formula: (m: number, n: number) => string;
  count: (m: number, n: number) => number;
  rand: (m: number, n: number) => number[] | null;
  genAll: (m: number, n: number) => number[][];
  invalid: (m: number, n: number) => boolean;
  hint: string;
  initM: number; initN: number;
  steps?: (m: number, n: number) => { lbl: string; val: number }[];
  concept: React.ReactNode;
  extra?: React.ReactNode;
};

function InteractiveTab({ def }: { def: TabDef }) {
  const [m, setM] = useState(def.initM);
  const [n, setN] = useState(def.initN);
  const [mapping, setMapping] = useState<number[] | null>(() => def.rand(def.initM, def.initN));

  useEffect(() => { setMapping(def.rand(m, n)); }, [m, n, def]);

  const invalid = def.invalid(m, n);
  const count = invalid ? 0 : def.count(m, n);
  const steps = def.steps && !invalid ? def.steps(m, n) : null;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">{def.concept}</div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">🎛️ 인터랙티브 탐구</p>
        <div className="mt-3 flex flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-2"><span className="text-xs font-semibold text-slate-400">m = |A|</span><span className="rounded-md bg-amber-500 px-2 py-0.5 text-sm font-extrabold text-white">{m}</span></div>
            <input type="range" min={1} max={5} value={m} onChange={(e) => setM(Number(e.target.value))} className="mt-1 w-36 accent-amber-400" aria-label="m = |A|" />
          </div>
          <div>
            <div className="flex items-center gap-2"><span className="text-xs font-semibold text-slate-400">n = |B|</span><span className="rounded-md bg-indigo-500 px-2 py-0.5 text-sm font-extrabold text-white">{n}</span></div>
            <input type="range" min={1} max={6} value={n} onChange={(e) => setN(Number(e.target.value))} className="mt-1 w-36 accent-indigo-400" aria-label="n = |B|" />
          </div>
        </div>

        {invalid ? (
          <p className="mt-3 rounded-lg border border-red-400/25 bg-red-400/10 p-2 text-sm text-red-300">⚠️ m &gt; n 이면 존재하지 않습니다 (개수 = 0).</p>
        ) : null}

        {steps ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {steps.map((s, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 ? <span className="text-lg text-slate-500">×</span> : null}
                <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-center">
                  <span className="block text-[10px] text-slate-400">{s.lbl}</span>
                  <span className="block text-lg font-black text-amber-300">{s.val}</span>
                </span>
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-3 rounded-xl border border-indigo-400/30 bg-indigo-400/10 p-4 text-center">
          <div className="text-lg font-bold text-indigo-300">{def.formula(m, n)}</div>
          <div className="mt-1 text-3xl font-black text-white tabular-nums">{count.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-500">{def.hint}</div>
        </div>

        <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-2">
          <FunctionDiagram m={m} n={n} mapping={mapping} />
        </div>
        <button type="button" onClick={() => setMapping(def.rand(m, n))} className="mt-2 rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-amber-400">
          🎲 새 예시 보기
        </button>

        <MapList total={count} all={() => def.genAll(m, n)} current={mapping} />

        {def.extra ? <div className="mt-3 text-sm leading-7 text-slate-300">{def.extra}</div> : null}
      </div>
    </div>
  );
}

const TABS: TabDef[] = [
  {
    key: "func",
    formula: (m, n) => `${n}${sup(m)} = ${n}Π${m}`,
    count: (m, n) => repPerm(n, m),
    rand: (m, n) => randomFunc(m, n),
    genAll: (m, n) => genAllFuncs(m, n),
    invalid: () => false,
    hint: "함수 f:A→B의 개수",
    initM: 3, initN: 4,
    steps: (m, n) => Array.from({ length: m }, (_, i) => ({ lbl: `a${i + 1}`, val: n })),
    concept: (
      <>
        <p className="text-sm font-bold text-amber-300">📌 함수 (중복순열)</p>
        <p className="mt-2 text-sm leading-7 text-slate-300">f:A→B는 A의 각 원소를 B의 원소 정확히 하나에 대응. B의 같은 원소에 여러 번 대응 가능 → 각 원소가 독립적으로 n가지 → <b className="text-amber-300">nᵐ = ₙΠₘ</b> (중복순열).</p>
      </>
    ),
  },
  {
    key: "inj",
    formula: (m, n) => `${n}P${m}`,
    count: (m, n) => perm(n, m),
    rand: (m, n) => randomInj(m, n),
    genAll: (m, n) => genAllInj(m, n),
    invalid: (m, n) => m > n,
    hint: "일대일함수 f:A→B의 개수",
    initM: 3, initN: 4,
    steps: (m, n) => Array.from({ length: m }, (_, i) => ({ lbl: `a${i + 1}`, val: n - i })),
    concept: (
      <>
        <p className="text-sm font-bold text-amber-300">📌 일대일함수(단사) — 순열</p>
        <p className="mt-2 text-sm leading-7 text-slate-300">서로 다른 원소를 서로 다른 원소에 대응(B 중복 불가) → n(n−1)⋯(n−m+1) = <b className="text-amber-300">ₙPₘ</b>. (존재하려면 m ≤ n)</p>
      </>
    ),
  },
  {
    key: "strict",
    formula: (m, n) => `${n}C${m}`,
    count: (m, n) => comb(n, m),
    rand: (m, n) => randomStrict(m, n),
    genAll: (m, n) => genAllStrict(m, n),
    invalid: (m, n) => m > n,
    hint: "순증가함수의 개수 (순감소도 동일)",
    initM: 3, initN: 5,
    concept: (
      <>
        <p className="text-sm font-bold text-amber-300">📌 순증가/순감소함수 — 조합</p>
        <p className="mt-2 text-sm leading-7 text-slate-300">x&lt;y ⇒ f(x)&lt;f(y). B에서 서로 다른 m개를 고르면 순서가 유일하게 결정 → <b className="text-amber-300">ₙCₘ</b> (조합). 순감소함수도 동일하게 ₙCₘ.</p>
      </>
    ),
    extra: <p>💡 B에서 m개를 <b className="text-amber-200">중복 없이</b> 고르면 작은 순서대로 배열 → 순증가함수 1개, 큰 순서대로 → 순감소함수 1개.</p>,
  },
  {
    key: "mono",
    formula: (m, n) => `${n}H${m} = ${n + m - 1}C${m}`,
    count: (m, n) => repComb(n, m),
    rand: (m, n) => randomMono(m, n),
    genAll: (m, n) => genAllMono(m, n),
    invalid: () => false,
    hint: "단조증가함수의 개수 (단조감소도 동일)",
    initM: 3, initN: 4,
    concept: (
      <>
        <p className="text-sm font-bold text-amber-300">📌 단조증가/단조감소함수 — 중복조합</p>
        <p className="mt-2 text-sm leading-7 text-slate-300">x&lt;y ⇒ f(x)≤f(y). 같은 값에 여러 번 대응 가능(중복 허용). B에서 m개를 중복 허용 선택하면 순서 유일 결정 → <b className="text-amber-300">ₙHₘ = ₙ₊ₘ₋₁Cₘ</b> (중복조합).</p>
      </>
    ),
    extra: <p>💡 순증가(조합)는 중복 없이, 단조증가(중복조합)는 같은 값 반복 허용 — 그래서 단조 쪽이 더 많습니다.</p>,
  },
];

const TAB_LABELS = [
  ["① 함수", "ₙΠₘ = nᵐ"],
  ["② 일대일함수", "ₙPₘ"],
  ["③ 순증가/감소", "ₙCₘ"],
  ["④ 단조증가/감소", "ₙHₘ"],
  ["⑤ 요약 & 확인문제", ""],
];

const QUIZ: QuizItem[] = [
  { q: "A={1,2,3}, B={1,2,3,4} 일 때, 함수 f:A→B 의 개수는?", answer: "64", hint: "nᵐ = 4³", solution: "4³ = 64개 (중복순열)." },
  { q: "A={1,2,3}, B={1,2,3,4} 일 때, 일대일함수 f:A→B 의 개수는?", answer: "24", hint: "₄P₃", solution: "4×3×2 = ₄P₃ = 24개 (순열)." },
  { q: "A={1,2,3}, B={1,2,3,4,5} 일 때, 순증가함수 f:A→B 의 개수는?", answer: "10", hint: "₅C₃", solution: "₅C₃ = 10개 (조합)." },
  { q: "A={1,2,3}, B={1,2,3,4} 일 때, 단조증가함수 f:A→B 의 개수는?", answer: "20", hint: "₄H₃ = ₆C₃", solution: "₄H₃ = ₆C₃ = 20개 (중복조합)." },
  { q: "A={1,2,3,4}, B={1,2,3,4,5,6} 일 때, 순감소함수 f:A→B 의 개수는?", answer: "15", hint: "₆C₄", solution: "₆C₄ = 15개 (조합)." },
  { q: "A={1,2,3,4}, B={1,2,3,4,5} 일 때, 단조감소함수 f:A→B 의 개수는?", answer: "70", hint: "₅H₄ = ₈C₄", solution: "₅H₄ = ₈C₄ = 70개 (중복조합)." },
  { q: "⭐ A={1,2,3}, B={1,2,3,4,5} 일 때, 함수의 개수에서 일대일함수의 개수를 뺀 값(일대일이 아닌 함수의 수)은?", answer: "65", hint: "5³ − ₅P₃", solution: "5³ − ₅P₃ = 125 − 60 = 65개." },
];

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "four_types",
    prompt: "함수(nᵐ)·일대일함수(ₙPₘ)·순증가함수(ₙCₘ)·단조증가함수(ₙHₘ)는 각각 어떤 '선택' 구조(중복순열/순열/조합/중복조합)와 대응되나요?",
    kind: "text",
  },
  {
    id: "strict_vs_mono",
    prompt: "순증가함수(조합)와 단조증가함수(중복조합)의 차이는 무엇이고, 왜 개수 공식이 다른가요?",
    kind: "text",
  },
];

function SummaryTab() {
  const [m, setM] = useState(3);
  const [n, setN] = useState(5);
  const rows = [
    { type: "함수", cond: "조건 없음", formula: `${n}Π${m} = ${n}${sup(m)}`, count: repPerm(n, m) },
    { type: "일대일함수", cond: "B 중복 불가 (m≤n)", formula: `${n}P${m}`, count: perm(n, m) },
    { type: "순증가/순감소", cond: "서로 다른 값 (m≤n)", formula: `${n}C${m}`, count: comb(n, m) },
    { type: "단조증가/단조감소", cond: "같은 값 허용", formula: `${n}H${m} = ${n + m - 1}C${m}`, count: repComb(n, m) },
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">📊 4가지 함수의 개수 요약</p>
        <div className="mt-3 flex flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-2"><span className="text-xs font-semibold text-slate-400">m = |A|</span><span className="rounded-md bg-amber-500 px-2 py-0.5 text-sm font-extrabold text-white">{m}</span></div>
            <input type="range" min={1} max={5} value={m} onChange={(e) => setM(Number(e.target.value))} className="mt-1 w-36 accent-amber-400" aria-label="m" />
          </div>
          <div>
            <div className="flex items-center gap-2"><span className="text-xs font-semibold text-slate-400">n = |B|</span><span className="rounded-md bg-indigo-500 px-2 py-0.5 text-sm font-extrabold text-white">{n}</span></div>
            <input type="range" min={1} max={6} value={n} onChange={(e) => setN(Number(e.target.value))} className="mt-1 w-36 accent-indigo-400" aria-label="n" />
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-amber-300">
                <th className="border border-white/10 px-3 py-2">함수 종류</th>
                <th className="border border-white/10 px-3 py-2">조건</th>
                <th className="border border-white/10 px-3 py-2">공식</th>
                <th className="border border-white/10 px-3 py-2">개수</th>
              </tr>
            </thead>
            <tbody className="text-center text-slate-200">
              {rows.map((r) => (
                <tr key={r.type}>
                  <td className="border border-white/10 px-3 py-2 font-semibold">{r.type}</td>
                  <td className="border border-white/10 px-3 py-2 text-slate-400">{r.cond}</td>
                  <td className="border border-white/10 px-3 py-2 font-mono text-amber-200">{r.formula}</td>
                  <td className="border border-white/10 px-3 py-2 font-black text-white">{r.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Quiz items={QUIZ} />
    </div>
  );
}

export default function FunctionCountLab() {
  const [tab, setTab] = useState(0);
  const tabBtn = (active: boolean) =>
    active ? "rounded-lg bg-amber-400 px-3 py-2 text-left text-xs font-bold text-slate-950 leading-tight" : "rounded-lg border border-white/15 px-3 py-2 text-left text-xs text-slate-300 leading-tight transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 함수의 개수</p>
        <h3 className="mt-2 text-2xl font-bold">🔢 함수의 개수 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          집합 A→B 함수 f의 종류별 개수를 <b className="text-amber-300">중복순열·순열·조합·중복조합</b>으로 탐구합니다.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TAB_LABELS.map(([label, formula], i) => (
          <button key={i} type="button" className={tabBtn(tab === i)} onClick={() => setTab(i)}>
            {label}{formula ? <><br /><span className="font-mono opacity-80">{formula}</span></> : null}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab < 4 ? <InteractiveTab key={tab} def={TABS[tab]} /> : <SummaryTab />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
