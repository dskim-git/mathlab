"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 수학 ─────────────────────────────────────────────────
function fact(n: number): number { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }
function nPr(n: number, r: number): number { if (r > n) return 0; let v = 1; for (let i = 0; i < r; i++) v *= n - i; return v; }
function nCr(n: number, r: number): number { if (r > n) return 0; return Math.round(nPr(n, r) / fact(r)); }
function nPi(n: number, r: number): number { return Math.pow(n, r); }

const SUB_MAP: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
function sub(x: number | string): string {
  return String(x).split("").map((c) => SUB_MAP[c] ?? c).join("");
}

// 모든 경우 제너레이터 (그리드 표시용 — 양이 적은 케이스만 호출)
function allRep(n: number, r: number): number[][] {
  const out: number[][] = [];
  const cur = Array<number>(r).fill(1);
  while (true) {
    out.push([...cur]);
    let i = r - 1;
    while (i >= 0 && cur[i] === n) { cur[i] = 1; i--; }
    if (i < 0) return out;
    cur[i] += 1;
  }
}
function allPerm(arr: number[], k: number): number[][] {
  if (k === 0) return [[]];
  const out: number[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const sb of allPerm(rest, k - 1)) out.push([arr[i], ...sb]);
  }
  return out;
}
function allComb(arr: number[], k: number, start = 0): number[][] {
  if (k === 0) return [[]];
  const out: number[][] = [];
  for (let i = start; i <= arr.length - k; i++) {
    for (const sb of allComb(arr, k - 1, i + 1)) out.push([arr[i], ...sb]);
  }
  return out;
}

// ─── 성찰 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "rep_vs_perm",
    prompt: "복원추출과 비복원추출의 차이를 자신의 말로 설명하고, 같은 표본에 대해 가능한 표본의 수가 어떻게 다른지 적어 보세요.",
    kind: "text",
    placeholder: "예: 복원은 뽑은 공을 되돌려 놓아 같은 공을 다시 뽑을 수 있고, 비복원은 한 번 뽑은 공은 제외한다. 그래서 복원이 비복원보다 가능 표본 수가 많다.",
  },
  {
    id: "perm_vs_comb",
    prompt: "비복원추출과 동시추출에서 가능한 표본의 수가 다른 까닭을 설명해 보세요. (예: 5개 중 2개 → 비복원 20 vs 동시 10)",
    kind: "text",
    placeholder: "예: 비복원은 순서를 구분해 (1,2)와 (2,1)을 다른 표본으로 보지만, 동시추출은 순서를 무시해 {1,2}로 같은 표본. 그래서 동시추출은 r! 배만큼 적어진다.",
  },
  {
    id: "size_compare",
    prompt: "n개 중 r개를 뽑을 때 ₙΠᵣ, ₙPᵣ, ₙCᵣ 의 크기를 부등호로 비교하고 그 이유를 적어 보세요.",
    kind: "text",
    placeholder: "예: ₙΠᵣ ≥ ₙPᵣ ≥ ₙCᵣ. ₙΠᵣ에는 중복까지 포함, ₙPᵣ는 중복 제외하지만 순서 포함, ₙCᵣ는 순서까지 무시되어 r! 배 더 작다.",
  },
];

// ─── 메인 ─────────────────────────────────────────────────
type TabKey = "sim" | "compare" | "quiz";

export default function SamplingMethodsLab() {
  const [tab, setTab] = useState<TabKey>("sim");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">🎁 복원·비복원·동시추출 실험실</h3>
        <p className="mt-2 leading-7 text-slate-300">
          모집단에서 표본을 뽑는 세 가지 방법 —{" "}
          <b className="text-emerald-300">복원추출</b> · <b className="text-amber-300">비복원추출</b> ·{" "}
          <b className="text-pink-300">동시추출</b> — 을 직접 체험하며 가능한 표본의 수가 왜 다르게 나오는지 알아봅니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabBtn active={tab === "sim"} tone="amber" onClick={() => setTab("sim")}>🎲 직접 뽑아보기</TabBtn>
        <TabBtn active={tab === "compare"} tone="cyan" onClick={() => setTab("compare")}>🔭 한눈에 비교</TabBtn>
        <TabBtn active={tab === "quiz"} tone="violet" onClick={() => setTab("quiz")}>🎬 시나리오 챌린지</TabBtn>
      </div>

      <div className={tab === "sim" ? "mt-4" : "mt-4 hidden"}>
        <SimTab />
      </div>
      <div className={tab === "compare" ? "mt-4" : "mt-4 hidden"}>
        <CompareTab />
      </div>
      <div className={tab === "quiz" ? "mt-4" : "mt-4 hidden"}>
        <QuizTab />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabBtn({
  active, tone, onClick, children,
}: { active: boolean; tone: "amber" | "cyan" | "violet"; onClick: () => void; children: React.ReactNode }) {
  const activeCls =
    tone === "amber" ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
    : tone === "cyan" ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
    : "border-violet-400/50 bg-violet-400/15 text-violet-200";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? `rounded-xl border ${activeCls} px-4 py-2 text-sm font-bold`
          : "rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-400 hover:bg-white/10"
      }
    >
      {children}
    </button>
  );
}

// ═════════════════════════════════════════════════════════
// 탭 1: 직접 뽑아보기 (시뮬레이션)
// ═════════════════════════════════════════════════════════

type Mode = "rep" | "perm" | "comb";
const SIM_N = 5;

const MODE_INFO: Record<Mode, { tone: string; html: string }> = {
  rep: {
    tone: "border-emerald-400/50 bg-emerald-400/[0.08] text-emerald-100",
    html: "🟢 <b>복원추출</b> — 뽑은 공을 다시 모집단에 되돌려 놓은 후 다음 공을 뽑아요. <b>같은 공을 여러 번 뽑을 수 있어요!</b>",
  },
  perm: {
    tone: "border-amber-400/50 bg-amber-400/[0.08] text-amber-100",
    html: "🟠 <b>비복원추출</b> — 뽑은 공을 되돌려 놓지 않고 다음 공을 뽑아요. <b>순서를 구분해요</b> (1→2와 2→1은 다른 표본)",
  },
  comb: {
    tone: "border-pink-400/50 bg-pink-400/[0.08] text-pink-100",
    html: "🟣 <b>동시추출</b> — 한 번에 r개를 동시에 뽑아요. <b>순서를 구분하지 않아요</b> ({1,2}와 {2,1}은 같은 표본)",
  },
};

function totalForMode(n: number, r: number, mode: Mode): number {
  if (mode === "rep") return nPi(n, r);
  if (mode === "perm") return nPr(n, r);
  return nCr(n, r);
}
function formulaForMode(n: number, r: number, mode: Mode): string {
  if (mode === "rep") {
    const exp = r === 1 ? "" : r === 2 ? "²" : r === 3 ? "³" : `^${r}`;
    return `${sub(n)}Π${sub(r)} = ${n}${exp} = ${nPi(n, r)}`;
  }
  if (mode === "perm") {
    if (r === 1) return `${sub(n)}P${sub(r)} = ${nPr(n, r)}`;
    if (r === 2) return `${sub(n)}P${sub(r)} = ${n} × ${n - 1} = ${nPr(n, r)}`;
    return `${sub(n)}P${sub(r)} = ${n} × ${n - 1} × ${n - 2} = ${nPr(n, r)}`;
  }
  if (r === 1) return `${sub(n)}C${sub(r)} = ${nCr(n, r)}`;
  if (r === 2) return `${sub(n)}C${sub(r)} = (${n}×${n - 1})/(2×1) = ${nCr(n, r)}`;
  return `${sub(n)}C${sub(r)} = (${n}×${n - 1}×${n - 2})/(3×2×1) = ${nCr(n, r)}`;
}

function sampleKey(arr: number[], mode: Mode): string {
  if (mode === "comb") return [...arr].sort((a, b) => a - b).join(",");
  return arr.join(",");
}
function sampleDisplay(arr: number[], mode: Mode): number[] {
  return mode === "comb" ? [...arr].sort((a, b) => a - b) : arr;
}

function SimTab() {
  const [mode, setMode] = useState<Mode>("rep");
  const [r, setR] = useState(2);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [drawCount, setDrawCount] = useState(0);
  const [current, setCurrent] = useState<number[] | null>(null);
  const [fresh, setFresh] = useState(false);

  function changeMode(m: Mode) {
    setMode(m);
    setFound(new Set());
    setDrawCount(0);
    setCurrent(null);
  }
  function changeR(v: number) {
    setR(v);
    setFound(new Set());
    setDrawCount(0);
    setCurrent(null);
  }

  function drawOne() {
    setDrawCount((c) => c + 1);
    let arr: number[];
    if (mode === "rep") {
      arr = Array.from({ length: r }, () => 1 + Math.floor(Math.random() * SIM_N));
    } else {
      const pool = [1, 2, 3, 4, 5];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      arr = pool.slice(0, r);
      if (mode === "comb") arr.sort((a, b) => a - b);
    }
    setCurrent(arr);
    const key = sampleKey(arr, mode);
    setFresh(!found.has(key));
    setFound((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  function showAll() {
    const all = (mode === "rep" ? allRep(SIM_N, r)
      : mode === "perm" ? allPerm([1, 2, 3, 4, 5], r)
      : allComb([1, 2, 3, 4, 5], r));
    const next = new Set<string>();
    for (const a of all) next.add(sampleKey(a, mode));
    setFound(next);
  }

  function reset() {
    setFound(new Set());
    setDrawCount(0);
    setCurrent(null);
  }

  const total = totalForMode(SIM_N, r, mode);
  const formula = formulaForMode(SIM_N, r, mode);

  const drawnNumbers = current ? new Set(current) : new Set();

  return (
    <div className="space-y-3">
      {/* 컨트롤 */}
      <div className="grid gap-3 rounded-2xl border border-indigo-400/30 bg-slate-900/55 p-4 sm:grid-cols-3">
        <div>
          <p className="mb-1.5 text-sm font-extrabold text-indigo-200">🔧 추출 방식</p>
          <div className="flex gap-1.5">
            <ModeBtn active={mode === "rep"} tone="emerald" onClick={() => changeMode("rep")}>복원추출</ModeBtn>
            <ModeBtn active={mode === "perm"} tone="amber" onClick={() => changeMode("perm")}>비복원추출</ModeBtn>
            <ModeBtn active={mode === "comb"} tone="pink" onClick={() => changeMode("comb")}>동시추출</ModeBtn>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-extrabold text-indigo-200">🎯 뽑을 개수 r</p>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => changeR(v)}
                className={
                  v === r
                    ? "h-11 w-11 rounded-lg border-2 border-white bg-amber-400 text-lg font-black text-slate-900 shadow-[0_4px_12px_rgba(251,191,36,0.5)]"
                    : "h-11 w-11 rounded-lg border-2 border-white/30 bg-slate-700/60 text-lg font-black text-slate-300 transition hover:border-amber-400"
                }
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-extrabold text-indigo-200">▶️ 실행</p>
          <div className="flex flex-wrap gap-1.5">
            <SmallActionBtn tone="green" onClick={drawOne}>🎲 한 번 뽑기</SmallActionBtn>
            <SmallActionBtn tone="indigo" onClick={showAll}>🌐 모든 경우 보기</SmallActionBtn>
            <SmallActionBtn tone="slate" onClick={reset}>🗑️ 초기화</SmallActionBtn>
          </div>
        </div>
      </div>

      {/* 모드 안내 */}
      <div
        className={`rounded-lg border-l-4 border-amber-400 bg-slate-900/65 px-4 py-2.5 text-sm ${MODE_INFO[mode].tone}`}
        dangerouslySetInnerHTML={{ __html: MODE_INFO[mode].html }}
      />

      {/* 모집단 + 표본 */}
      <div className="grid items-start gap-3 rounded-2xl border-2 border-indigo-400/30 bg-slate-900/55 p-5 sm:grid-cols-[1fr_auto_1fr]">
        {/* 모집단 */}
        <div className="relative rounded-xl border-[3px] border-amber-400 bg-black/40 p-5 pt-7">
          <p className="absolute left-1/2 top-[-13px] -translate-x-1/2 rounded-md bg-[#1e1b4b] px-3 py-0.5 text-base font-extrabold tracking-wider text-amber-300">
            모집단
          </p>
          <div className="flex flex-wrap justify-center gap-3 py-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <Ball key={n} num={n} dim={mode !== "rep" && drawnNumbers.has(n)} />
            ))}
          </div>
        </div>

        {/* 화살표 */}
        <div className="flex flex-col items-center gap-2 self-center text-amber-200">
          <span className="text-2xl">➡️</span>
          <span className="text-sm font-extrabold">추출</span>
          <span className={`text-2xl text-cyan-300 ${mode === "rep" ? "opacity-100" : "opacity-15"}`}>⬅️</span>
        </div>

        {/* 표본 */}
        <div className="relative rounded-xl border-[3px] border-dashed border-cyan-400 bg-black/35 p-5 pt-7">
          <p className="absolute left-1/2 top-[-13px] -translate-x-1/2 rounded-md bg-[#1e1b4b] px-3 py-0.5 text-base font-extrabold tracking-wider text-cyan-300">
            추출된 표본
          </p>
          <div className="flex min-h-[100px] flex-wrap items-center justify-center gap-3 py-3">
            {current === null ? (
              <p className="text-sm italic text-slate-500">여기에 뽑힌 공이 와요</p>
            ) : (
              sampleDisplay(current, mode).map((n, i) => (
                <div key={i} className="relative animate-[popRes_0.45s_ease]">
                  <Ball num={n} />
                  {mode !== "comb" ? (
                    <span className="absolute -right-2 -top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-amber-400 text-xs font-extrabold text-slate-900 shadow">
                      {i + 1}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 결과 바 */}
      <div className="flex flex-wrap items-center justify-around gap-3 rounded-2xl border border-cyan-400/30 bg-slate-900/55 p-4">
        <Stat val={String(found.size)} label="지금까지 발견한 서로 다른 표본" />
        <Stat val={String(total)} label="이론상 가능한 모든 표본의 수" formula={formula} />
        <Stat val={String(drawCount)} label="총 뽑기 시도 횟수" />
      </div>

      {/* 발견 목록 */}
      <div className="rounded-2xl border border-violet-400/30 bg-slate-900/55 p-4">
        <p className="mb-2 flex justify-between text-base font-extrabold text-violet-300">
          <span>🗂️ 발견한 표본 목록</span>
          <span className="text-amber-300">{found.size} / {total}</span>
        </p>
        {found.size === 0 ? (
          <p className="my-5 text-center text-sm italic text-slate-500">아직 뽑은 표본이 없어요. <b>한 번 뽑기</b> 버튼을 눌러보세요!</p>
        ) : (
          <div className="grid max-h-[280px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-6">
            {[...found].map((k, i) => {
              const arr = k.split(",").map(Number);
              const isFresh = fresh && current && k === sampleKey(current, mode);
              return <SampleCard key={i} arr={arr} mode={mode} fresh={!!isFresh} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Ball({ num, dim = false }: { num: number; dim?: boolean }) {
  const cls = ballColorCls(num);
  return (
    <div
      className={`flex h-[58px] w-[58px] items-center justify-center rounded-full text-xl font-black text-white shadow-[0_6px_14px_rgba(0,0,0,0.45),inset_2px_4px_0_rgba(255,255,255,0.35)] ${cls} ${dim ? "opacity-20 grayscale-[60%]" : ""}`}
    >
      {num}
    </div>
  );
}
function MiniBall({ num }: { num: number }) {
  const cls = ballColorCls(num);
  return (
    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white shadow-[0_2px_4px_rgba(0,0,0,0.4)] ${cls}`}>
      {num}
    </div>
  );
}
function ballColorCls(num: number): string {
  // bg-gradient-to-br + radial mix를 Tailwind로는 어려워 클래스별 매핑
  const idx = ((num - 1) % 6) + 1;
  return ["bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-violet-500", "bg-pink-500"][idx - 1];
}

function ModeBtn({
  active, tone, onClick, children,
}: { active: boolean; tone: "emerald" | "amber" | "pink"; onClick: () => void; children: React.ReactNode }) {
  const activeCls = tone === "emerald" ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
    : tone === "amber" ? "bg-gradient-to-r from-amber-500 to-orange-500"
    : "bg-gradient-to-r from-pink-500 to-violet-500";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? `flex-1 rounded-lg border-2 border-white px-3 py-2 text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(99,102,241,0.45)] ${activeCls}`
          : "flex-1 rounded-lg border-2 border-slate-500/40 bg-slate-700/60 px-3 py-2 text-sm font-extrabold text-slate-300 transition hover:-translate-y-0.5 hover:border-indigo-300/55"
      }
    >
      {children}
    </button>
  );
}

function SmallActionBtn({
  tone, onClick, children,
}: { tone: "green" | "indigo" | "slate"; onClick: () => void; children: React.ReactNode }) {
  const cls = tone === "green" ? "from-emerald-500 to-emerald-700"
    : tone === "indigo" ? "from-indigo-500 to-indigo-700"
    : "from-slate-500 to-slate-700";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg bg-gradient-to-r px-3 py-2 text-sm font-extrabold text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.4)] ${cls}`}
    >
      {children}
    </button>
  );
}

function Stat({ val, label, formula }: { val: string; label: string; formula?: string }) {
  return (
    <div className="flex min-w-[120px] flex-col items-center">
      <p key={val} className="animate-[pulseR_0.3s_ease] text-3xl font-black text-amber-200">{val}</p>
      <p className="mt-1 text-center text-xs text-slate-400">{label}</p>
      {formula ? <p className="mt-0.5 text-sm font-bold text-indigo-300">{formula}</p> : null}
    </div>
  );
}

function SampleCard({ arr, mode, fresh }: { arr: number[]; mode: Mode; fresh: boolean }) {
  const sep = mode === "comb" ? "," : "→";
  return (
    <div
      className={`flex items-center justify-center gap-1 rounded-lg border bg-black/35 p-2 ${
        fresh
          ? "animate-[popRes_0.5s_ease] border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.4)]"
          : "border-white/15"
      }`}
    >
      {mode === "comb" ? <span className="text-base font-extrabold text-amber-300">{"{"}</span> : null}
      {arr.map((n, i) => (
        <span key={i} className="flex items-center">
          <MiniBall num={n} />
          {i < arr.length - 1 ? <span className="px-1 text-sm font-extrabold text-slate-500">{sep}</span> : null}
        </span>
      ))}
      {mode === "comb" ? <span className="text-base font-extrabold text-amber-300">{"}"}</span> : null}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 탭 2: 한눈에 비교
// ═════════════════════════════════════════════════════════

function CompareTab() {
  const [n, setN] = useState(4);
  const [r, setR] = useState(2);

  const repCnt = nPi(n, r), permCnt = nPr(n, r), combCnt = nCr(n, r);

  const repList = useMemo(() => allRep(n, r), [n, r]);
  const permList = useMemo(() => allPerm(Array.from({ length: n }, (_, i) => i + 1), r), [n, r]);
  const combList = useMemo(() => allComb(Array.from({ length: n }, (_, i) => i + 1), r), [n, r]);

  const mx = Math.max(repCnt, permCnt, combCnt, 1);
  const pct = (v: number) => Math.max(8, (v / mx) * 100);

  const permMul = r === 0 ? "1" : Array.from({ length: r }, (_, i) => n - i).join("×");
  const facMul = r <= 1 ? String(Math.max(r, 1)) : Array.from({ length: r }, (_, i) => r - i).join("×");

  let insight: React.ReactNode;
  if (r > n) {
    insight = <>r이 n보다 크면 <b>비복원·동시추출은 불가능</b>해요 (뽑을 수가 없죠!). 하지만 <b>복원추출은 가능</b>해서 같은 공을 여러 번 뽑을 수 있어요.</>;
  } else if (r === 1) {
    insight = <>r=1일 때는 세 방법 모두 결과가 같아요 (₅Π₁ = ₅P₁ = ₅C₁ = {repCnt}). 한 개만 뽑으니 순서·복원의 차이가 없죠!</>;
  } else {
    const ratio1 = (repCnt / permCnt).toFixed(2);
    const ratio2 = permCnt / combCnt;
    insight = (
      <>
        <b>복원 {repCnt}</b> &gt; <b>비복원 {permCnt}</b> &gt; <b>동시 {combCnt}</b>
        <br />· 복원 ÷ 비복원 = <b>{ratio1}</b> (중복을 허용하면 그만큼 경우가 늘어나요)
        <br />· 비복원 ÷ 동시 = <b>{ratio2}</b> = {r}! (같은 표본의 {r}! = {fact(r)}가지 순서가 동시추출에서는 1가지로 합쳐져요)
      </>
    );
  }

  return (
    <div className="space-y-3">
      {/* 컨트롤 */}
      <div className="flex flex-wrap items-center justify-center gap-5 rounded-2xl border border-indigo-400/30 bg-slate-900/55 p-4">
        <RangeCell label="모집단 크기 n" value={n} min={2} max={6} onChange={setN} />
        <RangeCell label="뽑을 개수 r" value={r} min={1} max={3} onChange={setR} />
      </div>

      {/* 3열 비교 */}
      <div className="grid gap-3 lg:grid-cols-3">
        <CompareCol tone="rep" title="🟢 복원추출" tag="순서O · 중복O" formula={`${sub(n)}Π${sub(r)} = ${n}^${r} = ${repCnt}`} keyText={<>한 번 뽑은 공도 <b className="text-amber-300">다시</b> 뽑힐 수 있어요</>} list={repList} sep="→" brace={false} />
        <CompareCol tone="perm" title="🟠 비복원추출" tag="순서O · 중복X" formula={`${sub(n)}P${sub(r)} = ${permMul} = ${permCnt}`} keyText={<>뽑은 공은 빼놓고, <b className="text-amber-300">순서</b>를 구분해요</>} list={permList} sep="→" brace={false} />
        <CompareCol tone="comb" title="🟣 동시추출" tag="순서X · 중복X" formula={`${sub(n)}C${sub(r)} = (${permMul})/(${facMul}) = ${combCnt}`} keyText={<>한 번에 동시에, <b className="text-amber-300">순서 무시</b>해요</>} list={combList} sep="," brace />
      </div>

      {/* 막대 비교 */}
      <div className="rounded-2xl border border-violet-400/30 bg-slate-900/55 p-4">
        <p className="mb-3 text-center text-base font-extrabold text-violet-300">📊 가능한 표본의 수 비교</p>
        <BarRow tone="rep" label={`복원 ${sub(n)}Π${sub(r)}`} value={repCnt} pct={pct(repCnt)} />
        <BarRow tone="perm" label={`비복원 ${sub(n)}P${sub(r)}`} value={permCnt} pct={pct(permCnt)} />
        <BarRow tone="comb" label={`동시 ${sub(n)}C${sub(r)}`} value={combCnt} pct={pct(combCnt)} />
      </div>

      <div className="rounded-xl border-l-4 border-amber-400 bg-slate-900/65 p-4 text-sm leading-7 text-slate-200">
        <span className="mr-2 inline-block rounded-md bg-amber-400/20 px-2 py-0.5 text-xs font-extrabold text-amber-300">현재 n={n}, r={r}</span>
        {insight}
      </div>
    </div>
  );
}

function RangeCell({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-extrabold text-indigo-200">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-2 w-40 cursor-pointer accent-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
      />
      <span key={value} className="inline-block min-w-[38px] animate-[pulseR_0.3s_ease] rounded-md bg-amber-400 px-2.5 py-0.5 text-center text-base font-black text-slate-900">
        {value}
      </span>
    </div>
  );
}

function CompareCol({
  tone, title, tag, formula, keyText, list, sep, brace,
}: {
  tone: "rep" | "perm" | "comb";
  title: string;
  tag: string;
  formula: string;
  keyText: React.ReactNode;
  list: number[][];
  sep: string;
  brace: boolean;
}) {
  const colorCls = tone === "rep" ? "border-emerald-400/50 text-emerald-300"
    : tone === "perm" ? "border-amber-400/50 text-amber-300"
    : "border-pink-400/50 text-pink-300";
  return (
    <div className={`overflow-hidden rounded-2xl border-2 bg-slate-900/55 p-4 ${colorCls}`}>
      <div className="flex items-baseline justify-between">
        <p className={`text-lg font-black ${colorCls.split(" ")[1]}`}>{title}</p>
        <span className="text-xs text-slate-400">{tag}</span>
      </div>
      <p className="my-2 rounded-lg border border-dashed border-white/25 bg-black/40 px-3 py-2 text-center font-extrabold text-amber-200">
        {formula}
      </p>
      <div className="flex max-h-[340px] flex-wrap gap-1.5 overflow-y-auto rounded-lg bg-black/28 p-2">
        {list.length === 0 ? (
          <p className="p-2 text-sm italic text-slate-500">(없음)</p>
        ) : (
          list.map((s, i) => (
            <div key={i} className="flex items-center gap-1 rounded-md border border-white/15 bg-slate-800/65 px-1.5 py-1 text-xs text-slate-300">
              {brace ? <span className="font-extrabold text-amber-300">{"{"}</span> : null}
              {s.map((n, j) => (
                <span key={j} className="flex items-center">
                  <MiniBall num={n} />
                  {j < s.length - 1 ? <span className="px-0.5 font-extrabold text-slate-500">{sep}</span> : null}
                </span>
              ))}
              {brace ? <span className="font-extrabold text-amber-300">{"}"}</span> : null}
            </div>
          ))
        )}
      </div>
      <p className="mt-2 text-center text-xs italic text-slate-400">{keyText}</p>
    </div>
  );
}

function BarRow({ tone, label, value, pct }: { tone: "rep" | "perm" | "comb"; label: string; value: number; pct: number }) {
  const cls = tone === "rep" ? { name: "text-emerald-300", fill: "fill-emerald-500" }
    : tone === "perm" ? { name: "text-amber-300", fill: "fill-amber-500" }
    : { name: "text-pink-300", fill: "fill-pink-500" };
  return (
    <div className="mb-2 flex items-center gap-3 last:mb-0">
      <span className={`w-[110px] flex-shrink-0 text-right text-sm font-extrabold ${cls.name}`}>{label}</span>
      <div className="h-9 flex-1 overflow-hidden rounded-lg bg-black/40">
        <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="block h-full w-full">
          <rect x={0} y={0} width={Math.max(0, Math.min(100, pct))} height={4} className={cls.fill} />
        </svg>
      </div>
      <span className={`min-w-[40px] text-right text-base font-black ${cls.name}`}>{value}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 탭 3: 시나리오 챌린지
// ═════════════════════════════════════════════════════════

type QuizQ = { stem: string; ans: Mode; expl: string };

const QUIZ: QuizQ[] = [
  {
    stem: '주사위를 <mark class="hi">3번 던져서</mark> 나온 눈을 차례로 기록한다. 가능한 결과의 수를 구하는 추출 방법은?',
    ans: "rep",
    expl: "주사위는 던져도 1~6의 눈이 그대로 남아 있어 <b>다음 던질 때도 같은 눈이 나올 수 있어요</b>. 또 던지는 순서를 구분해서 기록하므로 <b>복원추출</b>에 해당해요. (6³ = 216가지)",
  },
  {
    stem: '카드 5장 중에서 <mark class="hi">한 장씩 뽑아 일렬로 놓는다</mark> (단, 뽑은 카드는 되돌려 놓지 않는다). 가능한 배열의 수는?',
    ans: "perm",
    expl: "되돌려 놓지 않으니 한 번 뽑은 카드는 다시 못 뽑아요. 그리고 <b>일렬로 놓으니 순서를 구분</b>하죠. 따라서 <b>비복원추출(순열)</b>에 해당해요.",
  },
  {
    stem: '학급 30명 중에서 <mark class="hi">청소 당번 4명을 동시에</mark> 뽑는다. 가능한 경우의 수는?',
    ans: "comb",
    expl: "4명을 한꺼번에 뽑으니 누가 먼저인지 <b>순서를 구분하지 않아요</b>. {철수, 영희, 민수, 지영} = {지영, 민수, 영희, 철수}로 같은 표본이죠. 따라서 <b>동시추출(조합)</b>이에요.",
  },
  {
    stem: '로또에서 1~45 중 <mark class="hi">서로 다른 숫자 6개</mark>를 한 번에 뽑는 경우의 수는?',
    ans: "comb",
    expl: "로또는 6개를 한꺼번에 뽑고 어떤 순서로 나왔는지는 상관없어요. 같은 6개 숫자면 같은 결과죠. <b>동시추출</b>(₄₅C₆)에 해당해요.",
  },
  {
    stem: '비밀번호 4자리를 <mark class="hi">0~9</mark> 중에서 만든다 (같은 숫자 사용 가능). 가능한 비밀번호의 수는?',
    ans: "rep",
    expl: "같은 숫자를 여러 번 써도 되고(예: 1111), 자리에 따라 1234와 4321은 <b>다른 비밀번호</b>예요. 따라서 <b>복원추출</b>(10⁴ = 10000가지)에 해당해요.",
  },
  {
    stem: '8명의 학생 중에서 <mark class="hi">반장 1명, 부반장 1명, 서기 1명</mark>을 뽑는다 (한 사람이 두 자리를 겸할 수 없음). 가능한 경우의 수는?',
    ans: "perm",
    expl: "한 사람이 여러 역할을 못 하니 한 번 뽑힌 사람은 다시 못 뽑혀요 (비복원). 그리고 반장·부반장·서기는 <b>서로 다른 역할</b>이라 순서를 구분하죠. <b>비복원추출(순열)</b>이에요. (₈P₃ = 336)",
  },
];

const OPTS: { key: Mode; em: string; tt: string; dd: string; tone: string }[] = [
  { key: "rep", em: "🟢", tt: "복원추출", dd: "순서O · 중복O", tone: "emerald" },
  { key: "perm", em: "🟠", tt: "비복원추출", dd: "순서O · 중복X", tone: "amber" },
  { key: "comb", em: "🟣", tt: "동시추출", dd: "순서X · 중복X", tone: "pink" },
];

function QuizTab() {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<Mode | null>(null);
  const [revealed, setRevealed] = useState(false); // 정답 보기로 끝낸 경우

  const done = idx >= QUIZ.length;
  const q = done ? null : QUIZ[idx];

  function pick(k: Mode) {
    if (picked !== null || revealed) return;
    setPicked(k);
    if (q && k === q.ans) setScore((s) => s + 1);
  }
  function showAnswer() {
    if (picked !== null || revealed) return;
    setRevealed(true);
  }
  function next() {
    setPicked(null);
    setRevealed(false);
    setIdx((i) => i + 1);
  }
  function restart() {
    setIdx(0);
    setScore(0);
    setPicked(null);
    setRevealed(false);
  }

  if (done) {
    const total = QUIZ.length;
    const em = score === total ? "🏆" : score >= total * 0.5 ? "🌟" : "💪";
    const tt = score === total ? "완벽해요!" : score >= total * 0.5 ? "잘하고 있어요!" : "다시 도전해 봐요!";
    const msg = score === total
      ? "모든 문제를 맞췄어요! 복원·비복원·동시추출의 차이를 완벽하게 이해하고 있군요!"
      : score >= total * 0.5
      ? "조금만 더 연습하면 완벽해질 거예요. 틀린 문제의 해설을 다시 한 번 살펴봐요!"
      : "추출 방법의 차이를 다시 한 번 정리해 보고 도전해 봐요. 시뮬레이션 탭에서 직접 뽑아보면 도움이 될 거예요!";
    return (
      <div className="space-y-3">
        <ScoreHeader idx={total} total={total} score={score} done />
        <div className="rounded-2xl border-2 border-violet-400/50 bg-gradient-to-br from-violet-500/20 to-cyan-400/15 px-6 py-7 text-center">
          <p className="text-6xl">{em}</p>
          <h4 className="mt-2 text-2xl font-black text-violet-100">{tt}</h4>
          <p className="my-3 text-2xl font-black text-amber-300">{score} / {total}</p>
          <p className="mx-auto max-w-xl text-base leading-7 text-slate-300">{msg}</p>
          <button
            type="button"
            onClick={restart}
            className="mx-auto mt-4 block rounded-xl bg-gradient-to-r from-slate-500 to-slate-700 px-6 py-2.5 text-sm font-extrabold text-white transition hover:brightness-110"
          >
            🔄 다시 풀어보기
          </button>
        </div>
      </div>
    );
  }

  if (!q) return null;
  const answered = picked !== null;
  const lockedByReveal = revealed;
  return (
    <div className="space-y-3">
      <ScoreHeader idx={idx} total={QUIZ.length} score={score} />

      <div className="rounded-2xl border-2 border-violet-400/30 bg-slate-900/55 px-5 py-5">
        <p className="text-xs font-extrabold text-indigo-300">Q{idx + 1}.</p>
        <p
          className="mt-2 text-lg font-extrabold leading-7 text-amber-50 [&_.hi]:rounded-md [&_.hi]:bg-amber-400/15 [&_.hi]:px-1.5 [&_.hi]:py-0.5 [&_.hi]:text-amber-200"
          dangerouslySetInnerHTML={{ __html: q.stem }}
        />

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {OPTS.map((o) => {
            let cls = "border-white/25 bg-slate-700/65 text-slate-200 hover:-translate-y-0.5 hover:border-indigo-300/60 hover:bg-indigo-500/20";
            if (answered) {
              if (o.key === q.ans) cls = "border-emerald-500 bg-emerald-500/20 text-emerald-100 shadow-[0_0_18px_rgba(34,197,94,0.4)]";
              else if (o.key === picked) cls = "border-rose-500 bg-rose-500/18 text-rose-100 opacity-70";
              else cls = "border-white/15 bg-slate-800/55 text-slate-500 opacity-70";
            } else if (lockedByReveal) {
              cls = o.key === q.ans
                ? "border-amber-400 bg-amber-400/20 text-amber-100"
                : "border-white/15 bg-slate-800/55 text-slate-500";
            }
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => pick(o.key)}
                disabled={answered || lockedByReveal}
                className={`relative rounded-xl border-2 px-4 py-4 text-center transition disabled:cursor-default ${cls}`}
              >
                <span className="block text-2xl">{o.em}</span>
                <span className="mt-1 block text-base font-black">{o.tt}</span>
                <span className="block text-xs text-slate-400">{o.dd}</span>
              </button>
            );
          })}
        </div>

        {(answered || lockedByReveal) ? (
          <div className="mt-3 animate-[slideUp_0.35s_ease] rounded-xl border-l-4 border-amber-400 bg-black/40 p-4 text-sm leading-7 text-slate-200">
            <p className={`mb-2 text-base font-extrabold ${
              answered ? (picked === q.ans ? "text-emerald-300" : "text-rose-300") : "text-amber-300"
            }`}>
              {answered ? (picked === q.ans ? "✅ 정답이에요!" : "❌ 다시 한번 생각해봐요") : "👀 정답을 확인했어요"}
            </p>
            <p dangerouslySetInnerHTML={{ __html: q.expl }} />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap justify-between gap-2">
          <button
            type="button"
            onClick={showAnswer}
            disabled={answered || lockedByReveal}
            className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 px-5 py-3 text-sm font-extrabold text-white transition hover:brightness-110 disabled:cursor-default disabled:opacity-40"
          >
            👀 정답 보기
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!answered && !lockedByReveal}
            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 px-5 py-3 text-sm font-extrabold text-white transition hover:brightness-110 disabled:cursor-default disabled:opacity-40"
          >
            {idx === QUIZ.length - 1 ? "결과 보기 🏆" : "다음 문제 ➜"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreHeader({ idx, total, score, done = false }: { idx: number; total: number; score: number; done?: boolean }) {
  const pct = done ? 100 : (idx / total) * 100;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-400/30 bg-slate-900/55 px-4 py-2.5">
      <span className="text-sm font-extrabold text-indigo-300">{done ? "완료!" : `문제 ${idx + 1} / ${total}`}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-md bg-slate-800">
        <svg viewBox="0 0 100 2" preserveAspectRatio="none" className="block h-full w-full">
          <defs>
            <linearGradient id="smlProg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#a855f7" />
              <stop offset="1" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={pct} height={2} fill="url(#smlProg)" />
        </svg>
      </div>
      <span className="text-base font-extrabold text-amber-300">⭐ {score}점</span>
    </div>
  );
}
