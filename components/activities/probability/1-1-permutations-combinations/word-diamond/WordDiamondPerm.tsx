"use client";

import { useMemo, useState } from "react";
import Quiz, { type QuizItem } from "@/components/activities/Quiz";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  return Math.round(factorial(n) / (factorial(k) * factorial(n - k)));
}

const PALETTE = [
  "#a78bfa", "#67e8f9", "#fbbf24", "#f472b6", "#34d399",
  "#fb923c", "#818cf8", "#e879f9", "#4ade80", "#f87171",
  "#38bdf8", "#facc15", "#c084fc", "#86efac", "#fda4af",
];

const CX = 48, CY = 44, R = 19;

type Cell = { r: number; c: number; x: number; y: number; letter: string; id: string };
type Edge = { from: Cell; to: Cell; dir: "L" | "R" };

function rowCount(r: number, k: number) {
  return r <= k ? r + 1 : 2 * k + 1 - r;
}

function buildDiamond(word: string) {
  const n = word.length;
  const k = (n - 1) / 2;
  const rows = n;
  const totalW = (2 * k + 1) * CX + 40;
  const totalH = rows * CY + 40;

  const cells: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    const cnt = rowCount(r, k);
    const startX = totalW / 2 - ((cnt - 1) * CX) / 2;
    for (let c = 0; c < cnt; c++) {
      cells.push({ r, c, x: startX + c * CX, y: 20 + r * CY, letter: word[r], id: `n_${r}_${c}` });
    }
  }
  const getCell = (r: number, c: number) => cells.find((cl) => cl.r === r && cl.c === c) ?? null;

  const edges: Edge[] = [];
  for (let r = 0; r < rows - 1; r++) {
    const cnt = rowCount(r, k);
    const expand = r < k;
    for (let c = 0; c < cnt; c++) {
      const from = getCell(r, c)!;
      const toL = expand ? getCell(r + 1, c) : getCell(r + 1, c - 1);
      const toR = expand ? getCell(r + 1, c + 1) : getCell(r + 1, c);
      if (toL) edges.push({ from, to: toL, dir: "L" });
      if (toR) edges.push({ from, to: toR, dir: "R" });
    }
  }

  const dp: Record<string, number> = {};
  for (const cl of cells) {
    const key = `${cl.r}_${cl.c}`;
    if (cl.r === 0) { dp[key] = 1; continue; }
    dp[key] = edges
      .filter((e) => e.to.r === cl.r && e.to.c === cl.c)
      .reduce((s, e) => s + (dp[`${e.from.r}_${e.from.c}`] ?? 0), 0);
  }

  const letterColor: Record<string, string> = {};
  let ci = 0;
  for (const ch of word) if (!(ch in letterColor)) letterColor[ch] = PALETTE[ci++ % PALETTE.length];

  return { n, k, cells, edges, dp, letterColor, totalW, totalH, getCell };
}

function allPaths(k: number, edges: Edge[]): ("L" | "R")[][] {
  const out: ("L" | "R")[][] = [];
  const dfs = (r: number, c: number, path: ("L" | "R")[]) => {
    if (out.length >= 252) return;
    if (r === 2 * k) { out.push([...path]); return; }
    edges
      .filter((e) => e.from.r === r && e.from.c === c)
      .forEach((e) => {
        path.push(e.dir);
        dfs(e.to.r, e.to.c, path);
        path.pop();
      });
  };
  dfs(0, 0, []);
  return out;
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "odd_only",
    prompt: "단어 길이가 짝수면 왜 대칭 다이아몬드를 만들 수 없을까요?",
    kind: "text",
  },
  {
    id: "why_comb",
    prompt:
      "맨 아래에 도달하려면 왼쪽 k번·오른쪽 k번을 선택해야 하는데, 그래서 경우의 수가 (2k)!/(k!k!) = ₂ₖCₖ 가 되는 과정을 설명해 보세요.",
    kind: "text",
  },
];

const QUIZ: QuizItem[] = [
  {
    q: "단어 ABRACADABRA(11글자)로 만든 다이아몬드에서, 맨 위 A에서 아래로 이웃한 칸을 하나씩 골라 ABRACADABRA를 읽는 경우의 수를 구하시오.",
    answer: "252",
    hint: "n=11=2×5+1 → k=5. 왼쪽 5번·오른쪽 5번: 10!/(5!×5!).",
    solution: "10! / (5!×5!) = ₁₀C₅ = 252가지입니다.",
  },
  {
    q: "단어 LEVEL(5글자)로 만든 다이아몬드에서 LEVEL을 읽는 경우의 수를 구하시오.",
    answer: "6",
    hint: "n=5=2×2+1 → k=2. 4!/(2!×2!).",
    solution: "4! / (2!×2!) = ₄C₂ = 6가지입니다.",
  },
  {
    q: "단어 RACECAR(7글자)로 만든 다이아몬드에서 RACECAR를 읽는 경우의 수를 구하시오.",
    answer: "20",
    hint: "n=7=2×3+1 → k=3. 6!/(3!×3!).",
    solution: "6! / (3!×3!) = ₆C₃ = 20가지입니다.",
  },
];

export default function WordDiamondPerm() {
  const [input, setInput] = useState("ABRACADABRA");
  const [word, setWord] = useState("ABRACADABRA");
  const [error, setError] = useState("");
  const [hover, setHover] = useState<{ letter: string; r: number; dp: number } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const d = useMemo(() => buildDiamond(word), [word]);
  const result = useMemo(() => comb(2 * d.k, d.k), [d.k]);
  const paths = useMemo(() => (d.k <= 7 ? allPaths(d.k, d.edges) : []), [d.k, d.edges]);

  // 선택된 경로의 셀/에지 집합
  const highlight = useMemo(() => {
    if (selected === null || !paths[selected]) return null;
    const dirs = paths[selected];
    const cellIds = new Set<string>(["n_0_0"]);
    const segs: { x1: number; y1: number; x2: number; y2: number }[] = [];
    let r = 0, c = 0;
    for (const dir of dirs) {
      const e = d.edges.find((ed) => ed.from.r === r && ed.from.c === c && ed.dir === dir);
      if (!e) break;
      segs.push({ x1: e.from.x, y1: e.from.y, x2: e.to.x, y2: e.to.y });
      cellIds.add(e.to.id);
      r = e.to.r; c = e.to.c;
    }
    return { cellIds, segs };
  }, [selected, paths, d.edges]);

  function generate() {
    const raw = input.trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (!raw || raw.length < 3) { setError("영어 단어를 3글자 이상 입력해 주세요."); return; }
    if (raw.length % 2 === 0) { setError(`"${raw}"은(는) ${raw.length}글자(짝수)입니다. 홀수 글자 단어를 입력해 주세요. (예: LEVEL, RACECAR, ABRACADABRA)`); return; }
    if (raw.length > 21) { setError("21글자 이하로 입력해 주세요."); return; }
    setError("");
    setInput(raw);
    setSelected(null);
    setWord(raw);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 같은 것이 있는 순열</p>
        <h3 className="mt-2 text-2xl font-bold">💎 단어 다이아몬드와 같은 것이 있는 순열</h3>
        <p className="mt-2 leading-7 text-slate-300">
          홀수 글자 단어를 다이아몬드 격자에 놓고, 맨 위에서 아래로 이웃 칸을 하나씩 골라 단어를 읽는
          경로의 수를 탐구합니다. 길이 <b className="text-cyan-200">n = 2k+1</b>이면 경우의 수 ={" "}
          <b className="text-cyan-200">(2k)!/(k!·k!) = ₂ₖCₖ</b>.
        </p>
      </div>

      {/* 단어 입력 */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") generate(); }}
          maxLength={21}
          spellCheck={false}
          placeholder="예) ABRACADABRA"
          aria-label="탐구할 단어"
          className="w-64 rounded-xl border-2 border-violet-400/40 bg-white/5 px-4 py-2.5 font-mono text-lg font-bold uppercase tracking-widest text-white outline-none transition focus:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-400/30"
        />
        <button
          type="button"
          onClick={generate}
          className="rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-400"
        >
          💎 격자 생성
        </button>
        <span className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
          n = {d.n} (홀수) → k = {d.k}, 총 선택 횟수 2k = {2 * d.k}
        </span>
      </div>
      {error ? <p className="mt-2 text-sm font-semibold text-red-400">⚠️ {error}</p> : null}

      {/* 다이아몬드 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <div className="flex justify-center gap-6 text-sm text-slate-300">
          <span className="flex items-center gap-1.5"><span className="text-lg text-cyan-300">↙</span> 왼쪽 이동</span>
          <span className="flex items-center gap-1.5"><span className="text-lg text-pink-400">↘</span> 오른쪽 이동</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <svg
            viewBox={`0 0 ${d.totalW} ${d.totalH}`}
            className="mx-auto block h-auto w-full max-w-xl"
            role="img"
            aria-label={`${word} 다이아몬드 격자`}
          >
            <defs>
              <marker id="arrL" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="rgba(103,232,249,.5)" />
              </marker>
              <marker id="arrR" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="rgba(244,114,182,.5)" />
              </marker>
            </defs>
            {/* 에지 */}
            {d.edges.map((e, i) => (
              <line
                key={i}
                x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y}
                stroke={e.dir === "L" ? "rgba(103,232,249,.22)" : "rgba(244,114,182,.22)"}
                strokeWidth={2}
                markerEnd={`url(#arr${e.dir})`}
              />
            ))}
            {/* 강조 경로 */}
            {highlight?.segs.map((s, i) => (
              <line key={`hl${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#fff" strokeWidth={3} strokeLinecap="round" />
            ))}
            {/* 셀 */}
            {d.cells.map((cl) => {
              const col = d.letterColor[cl.letter] ?? "#a78bfa";
              const isEnd = cl.r === 0 || cl.r === d.n - 1;
              const isHl = highlight?.cellIds.has(cl.id);
              return (
                <g
                  key={cl.id}
                  transform={`translate(${cl.x},${cl.y})`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHover({ letter: cl.letter, r: cl.r, dp: d.dp[`${cl.r}_${cl.c}`] ?? 0 })}
                  onMouseLeave={() => setHover(null)}
                >
                  <circle
                    r={R}
                    fill={isHl ? "rgba(167,139,250,.4)" : `${col}1a`}
                    stroke={isHl ? "#fff" : col}
                    strokeWidth={isHl ? 3 : isEnd ? 2.5 : 1.5}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={14}
                    fontWeight={700}
                    fill={isHl ? "#fff" : col}
                    fontFamily="ui-monospace, monospace"
                  >
                    {cl.letter}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="mt-2 min-h-[24px] text-center font-mono text-sm font-semibold text-amber-200">
          {hover
            ? `"${hover.letter}" (${hover.r + 1}번째 글자) — 이 셀까지 오는 경로 수: ${hover.dp.toLocaleString()}가지`
            : ""}
        </p>
      </div>

      {/* 공식 + KPI */}
      <div className="mt-5 rounded-2xl border border-violet-400/25 bg-violet-950/20 p-5 text-center">
        <div className="text-2xl font-black text-violet-200">
          (2×{d.k})! / ({d.k}!×{d.k}!) = ₂ₖCₖ ={" "}
          <span className="text-emerald-300">{result.toLocaleString()}</span>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          맨 위에서 맨 아래까지 총 2k = {2 * d.k}번 중 왼쪽 {d.k}번 + 오른쪽 {d.k}번을 선택
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {[
            { v: d.n, l: "글자 수 n" },
            { v: d.k, l: "절반 k" },
            { v: 2 * d.k, l: "총 선택 2k" },
            { v: result.toLocaleString(), l: "경우의 수 ₂ₖCₖ" },
          ].map((kpi, i) => (
            <div key={i} className="min-w-[96px] rounded-xl border border-white/10 bg-white/5 px-4 py-2">
              <div className="text-xl font-black text-white">{kpi.v}</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">{kpi.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 단계 분석표 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-semibold text-violet-200">📊 선택 단계 분석표</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-violet-200">
                <th className="border-b border-white/10 px-3 py-2">단계</th>
                <th className="border-b border-white/10 px-3 py-2">선택</th>
                <th className="border-b border-white/10 px-3 py-2">현재 글자</th>
                <th className="border-b border-white/10 px-3 py-2">여기까지 경로 수</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 2 * d.k }, (_, i) => {
                const step = i + 1;
                const letter = word[step] ?? "";
                const rowSum = d.cells
                  .filter((cl) => cl.r === step)
                  .reduce((s, cl) => s + (d.dp[`${cl.r}_${cl.c}`] ?? 0), 0);
                return (
                  <tr key={step} className="text-center font-mono">
                    <td className="border-b border-white/5 px-3 py-1.5 text-violet-300">{step}</td>
                    <td className="border-b border-white/5 px-3 py-1.5 text-slate-300">↙ or ↘</td>
                    <td className="border-b border-white/5 px-3 py-1.5 font-black text-white">
                      {letter}
                    </td>
                    <td className="border-b border-white/5 px-3 py-1.5 font-bold text-emerald-300">
                      {rowSum.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모든 경로 탐색 */}
      {d.k <= 7 ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
          <p className="text-sm font-semibold text-violet-200">🗺️ 모든 경로 탐색</p>
          <p className="mt-1 text-xs text-slate-400">경로 칩을 누르면 격자 위에서 그 경로가 강조됩니다. (최대 252개)</p>
          <div className="mt-3 flex max-h-52 flex-wrap gap-1.5 overflow-y-auto">
            {paths.map((dirs, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i === selected ? null : i)}
                className={`rounded-lg border px-2.5 py-1 font-mono text-xs transition ${
                  i === selected
                    ? "border-violet-400 bg-violet-500/30 text-white"
                    : "border-violet-400/20 bg-white/5 text-violet-200 hover:bg-violet-500/15"
                }`}
              >
                {dirs.map((x) => (x === "L" ? "↙" : "↘")).join("")}
              </button>
            ))}
          </div>
          {result > paths.length ? (
            <p className="mt-2 text-xs text-slate-500">(총 {result.toLocaleString()}가지 중 처음 {paths.length}개 표시)</p>
          ) : null}
        </div>
      ) : null}

      {/* 풀이 단계 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-semibold text-violet-200">📖 풀이 단계</p>
        <ol className="mt-3 space-y-3 text-sm leading-7 text-slate-300">
          <li>
            <b className="text-violet-300">① 길이 확인</b> — &quot;{word}&quot;는 {d.n}글자(홀수). n = 2×{d.k}+1 이므로 k = {d.k}.
          </li>
          <li>
            <b className="text-violet-300">② 격자 구조</b> — 맨 위({word[0]})에서 맨 아래({word[d.n - 1]})까지 총 {2 * d.k}번 이동하며, 각 이동은 왼쪽(↙)/오른쪽(↘) 둘 중 하나.
          </li>
          <li>
            <b className="text-violet-300">③ 선택 조건</b> — 맨 아래에 도달하려면 왼쪽 정확히 {d.k}번, 오른쪽 정확히 {d.k}번 선택 → 왼쪽 {d.k}개·오른쪽 {d.k}개를 나열하는 같은 것이 있는 순열.
          </li>
          <li>
            <b className="text-violet-300">④ 공식 적용</b> — ({2 * d.k})!/({d.k}!×{d.k}!) = ₂ₖCₖ = {result.toLocaleString()}가지. 격자 위 각 셀에 마우스를 올려 경로 수를 확인해 보세요.
          </li>
        </ol>
      </div>

      <Quiz items={QUIZ} />
      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
