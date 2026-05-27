"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

function comb(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  r = Math.min(r, n - r);
  let res = 1;
  for (let i = 0; i < r; i++) res = (res * (n - i)) / (i + 1);
  return Math.round(res);
}
// 0..n-1 에서 r개 비내림차순(중복조합)
function genCombsWithRep(n: number, r: number): number[][] {
  const out: number[][] = [];
  const bt = (start: number, cur: number[]) => {
    if (cur.length === r) { out.push([...cur]); return; }
    for (let i = start; i < n; i++) { cur.push(i); bt(i, cur); cur.pop(); }
  };
  bt(0, []);
  return out;
}
// x1+..+xn = r, xi>=0 모든 해
function genNonNegSolutions(n: number, r: number): number[][] {
  const out: number[][] = [];
  const bt = (i: number, rem: number, cur: number[]) => {
    if (i === n - 1) { out.push([...cur, rem]); return; }
    for (let v = 0; v <= rem; v++) { cur.push(v); bt(i + 1, rem - v, cur); cur.pop(); }
  };
  bt(0, r, []);
  return out;
}

const SYM = ["●", "★", "▲", "◆", "■"];
const SYM_TEXT = ["text-[#a5b4fc]", "text-[#86efac]", "text-[#fca5a5]", "text-[#fde68a]", "text-[#c4b5fd]"];
const SYM_BORDER = ["border-[#a5b4fc]", "border-[#86efac]", "border-[#fca5a5]", "border-[#fde68a]", "border-[#c4b5fd]"];
const SYM_BG = ["bg-[#a5b4fc]/15", "bg-[#86efac]/15", "bg-[#fca5a5]/15", "bg-[#fde68a]/15", "bg-[#c4b5fd]/15"];

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_formula",
    prompt: "중복조합 ₙHᵣ이 ₙ₊ᵣ₋₁Cᵣ과 같은 이유를 '벽과 칸(stars & bars)'으로 설명해 보세요.",
    kind: "text",
  },
  {
    id: "best_method",
    prompt: "세 가지 방법(벽과 칸 / 순서쌍 대응 / 부정방정식) 중 가장 이해가 잘 된 것은 무엇이고 그 이유는?",
    kind: "text",
  },
];

function Slider({
  id, label, min, max, value, onChange, blue,
}: { id: string; label: string; min: number; max: number; value: number; onChange: (v: number) => void; blue?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </label>
        <span className={`rounded-md px-2 py-0.5 text-sm font-extrabold text-white ${blue ? "bg-indigo-500" : "bg-amber-500"}`}>
          {value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-36 accent-amber-400"
      />
    </div>
  );
}

function Kpi({ num, lbl }: { num: number | string; lbl: string }) {
  return (
    <div className="min-w-[90px] flex-1 rounded-xl border border-white/10 bg-white/5 p-3 text-center">
      <div className="text-2xl font-black text-amber-300">{num}</div>
      <div className="mt-1 text-xs text-slate-400">{lbl}</div>
    </div>
  );
}

// ───────── 탭 ① 벽과 칸 ─────────
function TabStarsBars() {
  const [n, setN] = useState(3);
  const [r, setR] = useState(3);
  const [walls, setWalls] = useState<Set<number>>(new Set());

  const total = n + r - 1;
  const needed = n - 1;
  const ans = comb(n + r - 1, r);
  const combos = useMemo(() => genCombsWithRep(n, r), [n, r]);

  function reset(nextN: number, nextR: number) {
    setN(nextN); setR(nextR); setWalls(new Set());
  }
  function toggleWall(i: number) {
    setWalls((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else if (next.size < needed) next.add(i);
      return next;
    });
  }

  // 벽 배치 → 그룹 개수
  const groups = useMemo(() => {
    if (walls.size !== needed) return null;
    const wpos = [...walls].sort((a, b) => a - b);
    const counts: number[] = [];
    let prev = -1;
    for (const w of wpos) { counts.push(w - prev - 1); prev = w; }
    counts.push(total - 1 - prev);
    return counts;
  }, [walls, needed, total]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">⚙️ n, r 설정</p>
        <div className="mt-3 flex flex-wrap gap-6">
          <Slider id="sb-n" label="n (종류 수)" min={2} max={5} value={n} onChange={(v) => reset(v, r)} />
          <Slider id="sb-r" label="r (선택 수)" min={1} max={6} value={r} onChange={(v) => reset(n, v)} blue />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Kpi num={n + r - 1} lbl="n+r−1" />
          <Kpi num={n - 1} lbl="n−1 (벽 수)" />
          <Kpi num={ans} lbl="ₙHᵣ = 경우의 수" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">💡 핵심 아이디어</p>
        <ol className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
          <li><b className="text-amber-300">1.</b> r개를 선택하되 순서 무시 → 종류별로 모아서 나열. (예: ●●●★○)</li>
          <li><b className="text-amber-300">2.</b> n가지 종류를 구분하려면 <b className="text-sky-300">n−1</b>개의 벽(|)이 필요. (예: ●●●|★|○)</li>
          <li><b className="text-amber-300">3.</b> 칸 r개 + 벽 (n−1)개 = <b className="text-sky-300">r+n−1</b>개 위치 중 벽 둘 <b className="text-sky-300">n−1</b>개를 고르면 됨.</li>
          <li><b className="text-amber-300">4.</b> 따라서 <b className="text-sky-300">ₙHᵣ = ₙ₊ᵣ₋₁Cₙ₋₁ = ₙ₊ᵣ₋₁Cᵣ</b></li>
        </ol>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">🖱️ 직접 벽을 배치해 보세요</p>
        <p className="mt-1 text-xs text-slate-400">
          총 {total}칸 중 벽이 될 {needed}칸을 클릭하세요 (선택: {walls.size}/{needed})
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Array.from({ length: total }, (_, i) => {
            const isWall = walls.has(i);
            const full = walls.size >= needed && !isWall;
            return (
              <button
                key={i}
                type="button"
                disabled={full}
                onClick={() => toggleWall(i)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 text-sm transition ${
                  isWall
                    ? "border-amber-400 bg-amber-400/30 text-lg font-black text-amber-300"
                    : full
                      ? "border-white/10 text-slate-600 opacity-40"
                      : "border-white/20 text-slate-400 hover:border-amber-400 hover:bg-amber-400/15"
                }`}
              >
                {isWall ? "|" : i + 1}
              </button>
            );
          })}
        </div>
        {groups ? (
          <div className="mt-4">
            <div className="flex flex-wrap items-end gap-1">
              {groups.map((cnt, g) => (
                <div key={g} className="flex items-end">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex gap-1">
                      {cnt === 0 ? (
                        <span className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 opacity-40">○</span>
                      ) : (
                        Array.from({ length: cnt }, (_, k) => (
                          <span key={k} className={`flex h-8 w-8 items-center justify-center rounded-md border ${SYM_BORDER[g]} ${SYM_BG[g]} ${SYM_TEXT[g]}`}>
                            {SYM[g]}
                          </span>
                        ))
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-400">{SYM[g]} ×{cnt}</span>
                  </div>
                  {g < n - 1 ? <span className="mx-1 mb-5 text-xl font-black text-amber-400">|</span> : null}
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm font-semibold text-emerald-300">
              ✓ 올바르게 배치! ({groups.map((c, i) => `${SYM[i]}×${c}`).join(", ")})
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm font-semibold text-red-300">벽 {needed - walls.size}개 더 필요합니다</p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">📋 전체 선택 결과 목록</p>
        <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-400">
          {SYM.slice(0, n).map((s, i) => (
            <span key={i}><span className={SYM_TEXT[i]}>{s}</span> = 종류 {i + 1}</span>
          ))}
        </p>
        <div className="mt-2 flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-xl bg-black/20 p-2">
          {combos.slice(0, 120).map((c, i) => (
            <span key={i} className="rounded-md border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 font-mono text-sm text-indigo-200">
              {c.map((x) => SYM[x]).join("")}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs italic text-slate-500">
          {combos.length > 120 ? `(전체 ${combos.length}개 중 120개 표시)` : `전체 ${combos.length}개`}
        </p>
      </div>
    </div>
  );
}

// ───────── 탭 ② 순서쌍 대응 ─────────
function TabOrderedPair() {
  const [n, setN] = useState(3);
  const [r, setR] = useState(2);
  const combos = useMemo(() => genCombsWithRep(n, r), [n, r]);
  const nAB = comb(n + r - 1, r);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">⚙️ n, r 설정</p>
        <div className="mt-3 flex flex-wrap gap-6">
          <Slider id="op-n" label="n" min={2} max={4} value={n} onChange={setN} />
          <Slider id="op-r" label="r" min={1} max={4} value={r} onChange={setR} blue />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">💡 순서쌍 대응 아이디어</p>
        <ol className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
          <li><b className="text-amber-300">A.</b> 1~n 중 중복 허락 r개 선택을 비내림차순 순서쌍 (a₁≤a₂≤⋯≤aᵣ)으로.</li>
          <li><b className="text-amber-300">B.</b> 각 aᵢ에 (0,1,…,r−1)을 더해 (a₁, a₂+1, …, aᵣ+r−1) → 서로 다른 순증가 순서쌍.</li>
          <li><b className="text-amber-300">★.</b> B는 1~n+r−1 중 중복 없이 r개 선택 → ₙ₊ᵣ₋₁Cᵣ. n(A)=n(B) 이므로 ₙHᵣ = ₙ₊ᵣ₋₁Cᵣ.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">📊 A ↔ B 대응표</p>
        <p className="mt-1 text-xs text-slate-400">n={n}, r={r} → A: 1~{n} 중 중복허락 {r}개 (비내림차순)</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-amber-300">
                <th className="border border-white/10 px-3 py-2">A의 원소 (a₁,…,aᵣ)</th>
                <th className="border border-white/10 px-2 py-2">→</th>
                <th className="border border-white/10 px-3 py-2">B의 원소 (b₁,…,bᵣ)</th>
                <th className="border border-white/10 px-3 py-2">검증</th>
              </tr>
            </thead>
            <tbody className="text-center text-slate-200">
              {combos.slice(0, 30).map((cb, i) => {
                const a = cb.map((x) => x + 1);
                const b = a.map((ai, j) => ai + j);
                const ok = b.every((v, j) => (j === 0 || v > b[j - 1])) && b.every((v) => v >= 1 && v <= n + r - 1);
                return (
                  <tr key={i} className={i % 5 === 0 ? "bg-amber-400/10" : "odd:bg-white/[0.03]"}>
                    <td className="border border-white/10 px-3 py-1.5 font-mono">({a.join(", ")})</td>
                    <td className="border border-white/10 px-2 py-1.5 text-slate-500">→</td>
                    <td className="border border-white/10 px-3 py-1.5 font-mono">({b.join(", ")})</td>
                    <td className="border border-white/10 px-3 py-1.5">
                      <span className={ok ? "text-emerald-300" : "text-red-300"}>{ok ? "순증가 ✓" : "오류"}</span>
                    </td>
                  </tr>
                );
              })}
              {combos.length > 30 ? (
                <tr><td colSpan={4} className="border border-white/10 px-3 py-2 text-xs italic text-slate-500">… (전체 {combos.length}개 중 30개 표시)</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Kpi num={nAB} lbl="n(A) = ₙHᵣ" />
          <Kpi num={nAB} lbl="n(B) = ₙ₊ᵣ₋₁Cᵣ" />
        </div>
      </div>
    </div>
  );
}

// ───────── 탭 ③ 부정방정식 ─────────
function TabEquation() {
  const [n, setN] = useState(3);
  const [r, setR] = useState(4);
  const [xs, setXs] = useState<number[]>([0, 0, 0]);

  function resize(nextN: number) {
    setN(nextN);
    setXs((prev) => Array.from({ length: nextN }, (_, i) => prev[i] ?? 0));
  }
  const sum = xs.slice(0, n).reduce((a, b) => a + b, 0);
  const solutions = useMemo(() => genNonNegSolutions(n, r), [n, r]);
  const formula = comb(n + r - 1, r);
  const ok = sum === r;
  const ys = xs.slice(0, n).map((v) => v + 1);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">⚙️ n, r 설정</p>
        <div className="mt-3 flex flex-wrap gap-6">
          <Slider id="eq-n" label="n" min={2} max={5} value={n} onChange={resize} />
          <Slider id="eq-r" label="r" min={1} max={8} value={r} onChange={setR} blue />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">💡 부정방정식 연결</p>
        <ol className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
          <li><b className="text-amber-300">1.</b> n개 중 중복 허락 r개 선택 → 각 aᵢ를 고른 개수 xᵢ라 하면 <b className="text-sky-300">x₁+⋯+xₙ = r, xᵢ ≥ 0</b>.</li>
          <li><b className="text-amber-300">2.</b> yᵢ = xᵢ+1 (yᵢ≥1)로 치환 → <b className="text-sky-300">y₁+⋯+yₙ = r+n</b>.</li>
          <li><b className="text-amber-300">3.</b> r+n개의 1 사이 (r+n−1)개 틈 중 n−1개에 | 를 꽂음 → <b className="text-sky-300">ₙ₊ᵣ₋₁Cₙ₋₁ = ₙ₊ᵣ₋₁Cᵣ</b>.</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">🖱️ x₁, …, xₙ 값을 직접 입력해 보세요</p>
        <p className="mt-1 text-xs text-slate-400">합이 r이 되는 음이 아닌 정수 해를 찾아보세요.</p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex flex-col items-center gap-1">
                <label htmlFor={`xi-${i}`} className="text-xs font-bold text-slate-400">x{i + 1}</label>
                <input
                  id={`xi-${i}`}
                  type="number"
                  min={0}
                  value={xs[i] ?? 0}
                  onChange={(e) => {
                    const v = Math.max(0, parseInt(e.target.value) || 0);
                    setXs((prev) => prev.map((p, idx) => (idx === i ? v : p)));
                  }}
                  className={`h-11 w-14 rounded-lg border bg-white/5 text-center text-lg font-bold text-white outline-none ${ok ? "border-emerald-500/60" : "border-white/15"}`}
                />
              </div>
              <span className="mb-2.5 text-xl font-bold text-slate-400">{i < n - 1 ? "+" : `= ${r}`}</span>
            </div>
          ))}
        </div>
        <p className={`mt-3 inline-block rounded-lg border px-4 py-2 text-sm font-bold ${ok ? "border-emerald-400 bg-emerald-400/15 text-emerald-300" : "border-red-400 bg-red-400/15 text-red-300"}`}>
          {ok ? `✓ 합 = ${sum} = r (올바른 해!)` : `합 = ${sum} ≠ r=${r}`}
        </p>

        {ok ? (
          <div className="mt-4">
            <p className="text-sm text-slate-300">
              <b className="text-sky-300">yᵢ = xᵢ+1 치환:</b> ({xs.slice(0, n).join(", ")}) → ({ys.join(", ")}), 합 {ys.reduce((a, b) => a + b, 0)} = r+n = {r + n} ✓
            </p>
            {/* 1-박스 시각화: y_i 개의 1을 그룹으로, 사이에 칸막이 */}
            <div className="mt-3 flex flex-wrap items-start gap-0">
              {ys.map((yv, g) => (
                <div key={g} className="flex items-start">
                  {Array.from({ length: yv }, (_, k) => (
                    <span key={k} className={`mx-0.5 flex h-9 w-9 items-center justify-center rounded border-2 text-sm font-bold ${SYM_BORDER[g]} ${SYM_BG[g]} ${SYM_TEXT[g]}`}>
                      1
                    </span>
                  ))}
                  {g < n - 1 ? (
                    <div className="flex w-6 flex-col items-center">
                      <span className="h-9 w-[3px] rounded bg-amber-400" />
                      <span className={`text-xs font-extrabold ${SYM_TEXT[g]}`}>y{g + 1}={yv}</span>
                    </div>
                  ) : (
                    <span className={`ml-1 mt-2 text-xs font-extrabold ${SYM_TEXT[g]}`}>y{n}={yv}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">📋 전체 해 목록</p>
        <p className="mt-1 text-xs text-slate-400">x₁+⋯+xₙ = r (xᵢ≥0) 의 모든 해 (최대 120개)</p>
        <div className="mt-2 flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-xl bg-black/20 p-2">
          {solutions.slice(0, 120).map((s, i) => (
            <span key={i} className="rounded-md border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 font-mono text-sm text-indigo-200">
              ({s.join(",")})
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Kpi num={solutions.length} lbl="전체 해의 수 = ₙHᵣ" />
          <Kpi num={formula} lbl="ₙ₊ᵣ₋₁Cᵣ 계산값" />
        </div>
      </div>
    </div>
  );
}

export default function RepCombStarsBars() {
  const [tab, setTab] = useState<"sb" | "op" | "eq">("sb");
  const tabBtn = (active: boolean) =>
    active
      ? "rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950"
      : "rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 중복조합</p>
        <h3 className="mt-2 text-2xl font-bold">🔢 중복조합의 3가지 이해 방법</h3>
        <p className="mt-2 leading-7 text-slate-300">
          중복을 허락해 r개를 선택하는 경우의 수{" "}
          <b className="text-amber-300">ₙHᵣ = ₙ₊ᵣ₋₁Cᵣ = ₙ₊ᵣ₋₁Cₙ₋₁</b>를 세 가지 방법으로 탐구합니다.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "sb")} onClick={() => setTab("sb")}>① 벽과 칸 방법</button>
        <button type="button" className={tabBtn(tab === "op")} onClick={() => setTab("op")}>② 순서쌍 대응</button>
        <button type="button" className={tabBtn(tab === "eq")} onClick={() => setTab("eq")}>③ 부정방정식</button>
      </div>

      <div className="mt-4">
        {tab === "sb" ? <TabStarsBars /> : tab === "op" ? <TabOrderedPair /> : <TabEquation />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
