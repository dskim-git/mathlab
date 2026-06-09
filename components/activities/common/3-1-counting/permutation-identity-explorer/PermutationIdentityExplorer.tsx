"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "eq1_meaning",
    prompt:
      "등식 ① ₙPᵣ = n × ₙ₋₁Pᵣ₋₁ 가 성립하는 이유를 ‘배열의 첫 자리를 결정하는 방법’ 으로 설명해 보세요. 5 명 중 3 명을 시상하는 사례로 비유해도 좋습니다.",
    kind: "text",
    placeholder:
      "예: 첫 자리 (예: 금메달 받을 사람) 를 정하는 방법이 n 가지 (= 5 가지). 그 사람을 고정하면 남은 n−1 = 4 명 중에서 r−1 = 2 명을 (은·동) 차례로 정해야 하므로 ₙ₋₁Pᵣ₋₁ = ₄P₂ = 12 가지. 곱의 법칙으로 5 × 12 = 60 = ₅P₃.",
  },
  {
    id: "eq2_meaning",
    prompt:
      "등식 ② ₙPᵣ = ₙ₋₁Pᵣ + r × ₙ₋₁Pᵣ₋₁ 에서 왜 두 경우로 나누고, 왜 그 둘을 더할 수 있나요? ‘특정 원소 k 가 배열에 포함되는지 여부’ 로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 어떤 r 개짜리 배열은 ‘특별한 원소 k 를 포함하지 않거나’ ‘포함하거나’ 둘 중 하나다 (동시에 둘 다일 수 없다). 그래서 두 경우를 합의 법칙으로 더할 수 있다. k 미포함 = 나머지 n−1 개에서 r 개 배열 = ₙ₋₁Pᵣ. k 포함 = 나머지 n−1 개에서 r−1 개를 먼저 배열한 뒤 k 를 r 개 자리 중 하나에 삽입 = r × ₙ₋₁Pᵣ₋₁.",
  },
];

// ─── 공용 ─────────────────────────────────────────────────
function pnr(n: number, r: number): number {
  if (r === 0) return 1;
  if (r > n || n < 0) return 0;
  let v = 1;
  for (let i = n; i > n - r; i--) v *= i;
  return v;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const LETTER_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
];

function pnrText(n: number, r: number): string {
  return `₍${n}₎P₍${r}₎ = ${pnr(n, r).toLocaleString()}`;
}

function* permutations<T>(arr: T[], r: number): Generator<T[]> {
  const n = arr.length;
  function* helper(used: boolean[], cur: T[]): Generator<T[]> {
    if (cur.length === r) {
      yield [...cur];
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      cur.push(arr[i]);
      yield* helper(used, cur);
      cur.pop();
      used[i] = false;
    }
  }
  yield* helper(Array(n).fill(false), []);
}

function listPermutations<T>(arr: T[], r: number): T[][] {
  const out: T[][] = [];
  for (const p of permutations(arr, r)) out.push(p);
  return out;
}

// ─── 메인 ─────────────────────────────────────────────────
type MainTab = 0 | 1 | 2;

export default function PermutationIdentityExplorer() {
  const [tab, setTab] = useState<MainTab>(0);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🔍 순열 등식 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          두 가지 순열 등식을 슬라이더 · 클릭 인터랙션으로 직접 발견하고, 5 가지
          실생활 사례로 검증해 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <MainTabBtn active={tab === 0} onClick={() => setTab(0)}>
          ① <FormulaSpan>ₙPᵣ = n × ₙ₋₁Pᵣ₋₁</FormulaSpan>
        </MainTabBtn>
        <MainTabBtn active={tab === 1} onClick={() => setTab(1)}>
          ② <FormulaSpan>ₙPᵣ = ₙ₋₁Pᵣ + r × ₙ₋₁Pᵣ₋₁</FormulaSpan>
        </MainTabBtn>
        <MainTabBtn active={tab === 2} onClick={() => setTab(2)}>
          🌍 실생활 탐구
        </MainTabBtn>
      </div>

      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}>
        <Identity1Tab />
      </div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <Identity2Tab />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <RealLifeTab />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function MainTabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl px-3 py-2.5 text-center text-xs font-bold transition sm:text-sm " +
        (active
          ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-amber-200")
      }
    >
      {children}
    </button>
  );
}

function FormulaSpan({ children }: { children: ReactNode }) {
  return <span className="font-mono">{children}</span>;
}

// 공용 라이브 식 박스
function LiveEq({ lhs, rhs }: { lhs: ReactNode; rhs: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/[0.07] px-4 py-3 text-center font-mono text-sm leading-7 sm:text-base">
      <span className="text-amber-100">{lhs}</span>
      <span className="text-slate-500">=</span>
      <span className="text-emerald-200">{rhs}</span>
      <span className="text-emerald-300">✓</span>
    </div>
  );
}

function InsightBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] px-3 py-2.5 text-xs leading-7 text-slate-200">
      💡 {children}
    </div>
  );
}

function FormulaWrap({ formula, cond }: { formula: ReactNode; cond: string }) {
  return (
    <div className="rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-500/10 to-orange-500/10 px-4 py-3 text-center">
      <p className="font-mono text-lg font-extrabold text-amber-200 sm:text-xl">
        {formula}
      </p>
      <p className="mt-1 text-[11px] text-amber-300/70">{cond}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  IDENTITY 1 — ₙPᵣ = n × ₙ₋₁Pᵣ₋₁
// ═══════════════════════════════════════════════════════════

function Identity1Tab() {
  const [n, setN] = useState(4);
  const [r, setR] = useState(2);
  const [placed, setPlaced] = useState<number[]>([]);

  // r 가 n 을 초과하지 않도록 안전 클램프
  const effR = Math.min(r, n);

  function changeN(v: number) {
    setN(v);
    setR((prev) => Math.min(prev, v));
    setPlaced([]);
  }
  function changeR(v: number) {
    setR(v);
    setPlaced([]);
  }
  function pick(i: number) {
    if (placed.length >= effR || placed.includes(i)) return;
    setPlaced([...placed, i]);
  }
  function reset() {
    setPlaced([]);
  }

  const total = pnr(n, effR);
  const tail = pnr(n - 1, effR - 1);

  return (
    <div className="space-y-3">
      <FormulaWrap
        formula={
          <>
            ₙPᵣ = n × ₙ₋₁Pᵣ₋₁
          </>
        }
        cond="( n ≥ 2,  1 ≤ r ≤ n )"
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
        <RangeRow
          label="n"
          min={2}
          max={6}
          value={n}
          onChange={changeN}
        />
        <RangeRow
          label="r"
          min={1}
          max={n}
          value={effR}
          onChange={changeR}
        />
      </div>

      <LiveEq
        lhs={
          <>
            ₍{n}₎P₍{effR}₎ = {total}
          </>
        }
        rhs={
          <>
            {n} × ₍{n - 1}₎P₍{effR - 1}₎ = {n} × {tail} = {total}
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-center text-xs text-slate-400">
          💡 원소를 클릭해{" "}
          <b className="text-amber-300">첫 번째 자리(금색 칸)</b> 에 배치해 보세요!
        </p>

        {/* 슬롯 */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {Array.from({ length: effR }, (_, i) => (
            <div
              key={i}
              className={
                "flex h-14 w-14 flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition " +
                (i === 0
                  ? placed[0] !== undefined
                    ? "border-amber-400/55 bg-amber-400/20 text-amber-100"
                    : "border-dashed border-amber-300/60 bg-amber-300/[0.05] text-amber-300/70"
                  : placed[i] !== undefined
                  ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
                  : "border-dashed border-white/20 bg-white/[0.03] text-slate-500")
              }
            >
              <span className="text-[10px] text-slate-400">
                {i === 0 ? "★ 첫째" : `#${i + 1}`}
              </span>
              <span className="text-base">
                {placed[i] !== undefined ? LETTERS[placed[i]] : "—"}
              </span>
            </div>
          ))}
        </div>

        {/* 후보 */}
        <p className="mt-3 text-center text-[11px] text-slate-400">후보 원소</p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {LETTERS.slice(0, n).map((L, i) => {
            const used = placed.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(i)}
                disabled={used}
                className={
                  "flex h-12 w-12 items-center justify-center rounded-lg border-2 font-bold transition disabled:cursor-not-allowed " +
                  (used
                    ? "border-white/10 bg-white/[0.03] text-slate-600 opacity-40"
                    : "border-2 bg-slate-950/40 hover:bg-white/10")
                }
                style={
                  used
                    ? undefined
                    : {
                        borderColor: LETTER_COLORS[i % LETTER_COLORS.length],
                        color: LETTER_COLORS[i % LETTER_COLORS.length],
                      }
                }
              >
                {L}
              </button>
            );
          })}
        </div>

        {/* 진행 상태 메시지 */}
        {placed.length === effR ? (
          <p className="mt-3 text-center text-sm font-bold text-emerald-300">
            ✅ 한 가지 배열 완성! 같은 방법으로 총 {total} 가지를 만들 수 있어요.
          </p>
        ) : placed.length === 0 ? (
          <p className="mt-3 text-center text-xs text-amber-300">
            ★ 첫 자리에 올 수 있는 원소는 {n} 가지 (선택지를 살펴보세요)
          </p>
        ) : (
          <p className="mt-3 text-center text-xs text-slate-400">
            첫 자리 결정 → 남은 자리는 {n - 1} 명 중에서 {effR - 1} 명 선택 →{" "}
            <b className="font-mono text-emerald-300">₍{n - 1}₎P₍{effR - 1}₎ = {tail}</b>{" "}
            가지
          </p>
        )}

        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border-2 border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
          >
            ↩ 초기화
          </button>
        </div>
      </div>

      <InsightBox>
        <b>핵심:</b> 첫 번째 자리에 올 수 있는 원소는 <b>n 가지</b>. 그 원소를 고정하면
        나머지 <b>n − 1 개</b> 중 <b>r − 1 개</b> 를 나열하는{" "}
        <b className="font-mono">ₙ₋₁Pᵣ₋₁</b> 가지가 남습니다.
        <br />∴ <b className="font-mono">ₙPᵣ = n × ₙ₋₁Pᵣ₋₁</b>
      </InsightBox>
    </div>
  );
}

function RangeRow({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-1 items-center gap-2 min-w-[140px]">
      <span className="font-serif italic text-slate-300">{label} =</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        aria-label={label}
        className="flex-1 accent-amber-400"
      />
      <span className="w-8 rounded-md border border-amber-300/40 bg-amber-300 px-1 text-center font-mono text-sm font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  IDENTITY 2 — ₙPᵣ = ₙ₋₁Pᵣ + r × ₙ₋₁Pᵣ₋₁
// ═══════════════════════════════════════════════════════════

function Identity2Tab() {
  const [n, setN] = useState(4);
  const [r, setR] = useState(2);
  const [k, setK] = useState(0); // 특별 원소 인덱스 (0~n-1)

  // r 은 n-1 이하
  const maxR = Math.max(1, n - 1);
  const effR = Math.min(r, maxR);
  const effK = Math.min(k, n - 1);

  function changeN(v: number) {
    setN(v);
    setR((prev) => Math.min(prev, Math.max(1, v - 1)));
    setK(0);
  }
  function changeR(v: number) {
    setR(v);
  }

  const total = pnr(n, effR);
  const noK = pnr(n - 1, effR);
  const yesK = effR * pnr(n - 1, effR - 1);

  // 모든 배열을 생성하고 k 포함 여부로 분류
  const allPerms = useMemo(() => {
    const ids = Array.from({ length: n }, (_, i) => i);
    const perms = listPermutations(ids, effR);
    const without: number[][] = [];
    const withK: number[][] = [];
    for (const p of perms) {
      if (p.includes(effK)) withK.push(p);
      else without.push(p);
    }
    return { without, withK };
  }, [n, effR, effK]);

  return (
    <div className="space-y-3">
      <FormulaWrap
        formula={
          <>
            ₙPᵣ = ₙ₋₁Pᵣ + r × ₙ₋₁Pᵣ₋₁
          </>
        }
        cond="( n ≥ 2,  1 ≤ r ≤ n − 1 )"
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
        <RangeRow label="n" min={3} max={6} value={n} onChange={changeN} />
        <RangeRow label="r" min={1} max={maxR} value={effR} onChange={changeR} />
      </div>

      <LiveEq
        lhs={
          <>
            ₍{n}₎P₍{effR}₎ = {total}
          </>
        }
        rhs={
          <>
            ₍{n - 1}₎P₍{effR}₎ + {effR} × ₍{n - 1}₎P₍{effR - 1}₎ = {noK} + {yesK} ={" "}
            {total}
          </>
        }
      />

      {/* k 선택 */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <p className="text-center text-xs text-slate-400">
          ★ 특별 원소 <b className="text-amber-300">k</b> 선택 (이 원소가 배열에 포함되는지로 분류)
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {LETTERS.slice(0, n).map((L, i) => {
            const isK = i === effK;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setK(i)}
                className={
                  "flex h-10 w-10 items-center justify-center rounded-lg border-2 font-bold transition " +
                  (isK
                    ? "border-amber-300 bg-amber-400/25 text-amber-100 shadow-lg shadow-amber-500/30"
                    : "border-white/20 bg-slate-950/40 text-slate-300 hover:bg-white/10")
                }
              >
                {L}
                {isK ? "★" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* 두 그룹 카운트 */}
      <div className="grid grid-cols-2 gap-3">
        <CaseCard
          title={
            <>
              🔵 경우 i — <b className="text-cyan-200">{LETTERS[effK]} 미포함</b>
            </>
          }
          formula={
            <>
              ₙ₋₁Pᵣ = ₍{n - 1}₎P₍{effR}₎ = <b>{noK}</b> 가지
            </>
          }
          tone="cyan"
          examples={allPerms.without}
        />
        <CaseCard
          title={
            <>
              🟡 경우 ii — <b className="text-amber-200">{LETTERS[effK]} 포함</b>
            </>
          }
          formula={
            <>
              r × ₙ₋₁Pᵣ₋₁ = {effR} × ₍{n - 1}₎P₍{effR - 1}₎ = <b>{yesK}</b> 가지
            </>
          }
          tone="amber"
          examples={allPerms.withK}
          highlightK={effK}
        />
      </div>

      <p className="text-center text-sm font-bold text-emerald-300">
        🎉 경우 i + 경우 ii = {noK} + {yesK} = {total} = ₍{n}₎P₍{effR}₎ ✓
      </p>

      <InsightBox>
        <b>핵심:</b> n 개에서 r 개를 뽑아 배열하는 모든 경우는 ‘특별한 원소{" "}
        <b className="text-amber-300">{LETTERS[effK]}</b> 를 포함하지 않거나, 포함하거나’
        둘 중 하나입니다.
        <br />
        <span className="text-cyan-300">k 미포함</span>: 나머지 n − 1 개에서 r 개 배열 →{" "}
        <b className="font-mono">ₙ₋₁Pᵣ</b> 가지.
        <br />
        <span className="text-amber-300">k 포함</span>: 나머지 n − 1 개에서 r − 1 개를
        먼저 배열한 뒤 k 를 r 개 자리 중 하나에 삽입 →{" "}
        <b className="font-mono">r × ₙ₋₁Pᵣ₋₁</b> 가지.
        <br />
        두 경우는 동시에 일어나지 않으므로 합의 법칙으로 더합니다.
      </InsightBox>
    </div>
  );
}

function CaseCard({
  title,
  formula,
  tone,
  examples,
  highlightK,
}: {
  title: ReactNode;
  formula: ReactNode;
  tone: "cyan" | "amber";
  examples: number[][];
  highlightK?: number;
}) {
  const border =
    tone === "cyan"
      ? "border-cyan-400/40 bg-cyan-400/[0.06]"
      : "border-amber-400/40 bg-amber-400/[0.06]";
  return (
    <div className={"rounded-xl border p-3 " + border}>
      <p className="text-xs font-bold text-slate-100">{title}</p>
      <p className="mt-1 font-mono text-xs text-slate-300">{formula}</p>
      <p className="mt-2 text-[10px] uppercase tracking-widest text-slate-500">
        해당 배열 (처음 {Math.min(8, examples.length)} 가지)
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        {examples.slice(0, 8).map((p, i) => (
          <span
            key={i}
            className="rounded-md border border-white/10 bg-slate-950/50 px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
          >
            {p
              .map((idx) =>
                highlightK !== undefined && idx === highlightK
                  ? `[${LETTERS[idx]}]`
                  : LETTERS[idx],
              )
              .join("")}
          </span>
        ))}
        {examples.length > 8 ? (
          <span className="self-center text-[10px] text-slate-500">
            +{examples.length - 8}
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  REALLIFE — 5P3 = 60 세 가지 사례
// ═══════════════════════════════════════════════════════════

type RLId = 0 | 1 | 2;

function RealLifeTab() {
  const [rl, setRl] = useState<RLId>(0);

  return (
    <div className="space-y-3">
      <p className="rounded-lg border border-violet-400/30 bg-violet-400/[0.06] px-3 py-2 text-center text-xs leading-7 text-slate-200">
        5 개 중 3 개를 선택·배열하는 실생활 상황 — 직접 조작하며 두 등식을 검증해
        봅시다!
      </p>

      <div className="grid grid-cols-3 gap-2">
        {(["0", "1", "2"] as const).map((id, i) => {
          const label =
            i === 0 ? "🏅 달리기 시상" : i === 1 ? "🎵 재생목록" : "🔐 자물쇠 번호";
          return (
            <button
              key={id}
              type="button"
              onClick={() => setRl(i as RLId)}
              className={
                "rounded-lg px-2 py-2 text-xs font-bold transition " +
                (rl === i
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className={rl === 0 ? "" : "hidden"}>
        <RLRunners />
      </div>
      <div className={rl === 1 ? "" : "hidden"}>
        <RLPlaylist />
      </div>
      <div className={rl === 2 ? "" : "hidden"}>
        <RLLock />
      </div>

      <VerifyTable />
    </div>
  );
}

// ── 5명 시상
const RUNNERS = ["민준", "서연", "지호", "수아", "예린"];
function RLRunners() {
  const [picked, setPicked] = useState<number[]>([]);

  function pick(i: number) {
    if (picked.length >= 3 || picked.includes(i)) return;
    setPicked([...picked, i]);
  }
  function reset() {
    setPicked([]);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-400/30 bg-white/[0.04] p-3">
        <p className="text-center text-sm font-bold text-amber-200">
          🏃 달리기 대회 — 5 명 중 금·은·동 시상
        </p>
        <p className="mt-1 text-center text-xs text-slate-400">
          선수를 클릭해 시상대에 올려 봅시다!
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {RUNNERS.map((name, i) => {
            const used = picked.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(i)}
                disabled={used}
                className={
                  "flex h-14 w-14 flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition disabled:cursor-not-allowed " +
                  (used
                    ? "border-white/10 bg-white/[0.03] text-slate-600 opacity-40"
                    : "border-amber-400/50 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25")
                }
              >
                <span className="text-base">🏃</span>
                {name}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-end justify-center gap-2">
          <Podium
            order={2}
            height={68}
            color="#cbd5e1"
            label="🥈 2등"
            name={picked[1] !== undefined ? RUNNERS[picked[1]] : null}
          />
          <Podium
            order={1}
            height={96}
            color="#fbbf24"
            label="🥇 1등"
            name={picked[0] !== undefined ? RUNNERS[picked[0]] : null}
          />
          <Podium
            order={3}
            height={48}
            color="#f97316"
            label="🥉 3등"
            name={picked[2] !== undefined ? RUNNERS[picked[2]] : null}
          />
        </div>

        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border-2 border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200 hover:bg-white/10"
          >
            ↩ 다시하기
          </button>
        </div>
      </div>
    </div>
  );
}

function Podium({
  order,
  height,
  color,
  label,
  name,
}: {
  order: number;
  height: number;
  color: string;
  label: string;
  name: string | null;
}) {
  return (
    <div className="flex w-20 flex-col items-center">
      <div
        className={
          "flex h-12 w-full items-center justify-center rounded-t-lg border-2 text-xs font-bold transition " +
          (name
            ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
            : "border-dashed border-white/20 bg-white/[0.03] text-slate-500")
        }
      >
        {name ?? "—"}
      </div>
      <div
        className="flex w-full items-center justify-center rounded-b-md text-center text-[10px] font-bold leading-tight text-slate-900"
        style={{ height, backgroundColor: color }}
      >
        {label}
        <br />#{order}
      </div>
    </div>
  );
}

// ── 5곡 재생목록 (실제 클래식 곡)
type Song = { title: string; composer: string };
const SONGS: Song[] = [
  { title: "엘리제를 위하여", composer: "베토벤" },
  { title: "작은 별 변주곡", composer: "모차르트" },
  { title: "사계 — 봄", composer: "비발디" },
  { title: "녹턴 Op. 9-2", composer: "쇼팽" },
  { title: "캐논", composer: "파헬벨" },
];
function RLPlaylist() {
  const [picked, setPicked] = useState<number[]>([]);
  function pick(i: number) {
    if (picked.length >= 3 || picked.includes(i)) return;
    setPicked([...picked, i]);
  }
  function reset() {
    setPicked([]);
  }
  return (
    <div className="rounded-xl border border-amber-400/30 bg-white/[0.04] p-3 space-y-3">
      <p className="text-center text-sm font-bold text-amber-200">
        🎵 재생목록 — 5 곡 중 3 곡을 순서대로 재생
      </p>
      <p className="text-center text-xs text-slate-400">
        클래식 곡을 클릭해 재생 순서를 정해 봅시다.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {SONGS.map((song, i) => {
          const used = picked.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              disabled={used}
              className={
                "flex h-20 w-28 flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-2 text-center font-bold leading-tight transition disabled:cursor-not-allowed " +
                (used
                  ? "border-white/10 bg-white/[0.03] text-slate-600 opacity-40"
                  : "border-amber-400/50 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25")
              }
            >
              <span className="text-base">🎵</span>
              <span className="text-[11px]">{song.title}</span>
              <span className="text-[10px] font-normal text-slate-400">
                {song.composer}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={
              "flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 transition " +
              (picked[i] !== undefined
                ? "border-emerald-400/55 bg-emerald-400/[0.06]"
                : "border-dashed border-white/20 bg-white/[0.03]")
            }
          >
            <span className="font-mono text-xs text-slate-400">▶ #{i + 1}</span>
            <span className="font-bold text-amber-200">
              {picked[i] !== undefined ? SONGS[picked[i]].title : "—"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border-2 border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200 hover:bg-white/10"
        >
          ↩ 다시하기
        </button>
      </div>
    </div>
  );
}

// ── 1~5 자물쇠
function RLLock() {
  const [picked, setPicked] = useState<number[]>([]);
  function pick(d: number) {
    if (picked.length >= 3 || picked.includes(d)) return;
    setPicked([...picked, d]);
  }
  function back() {
    setPicked(picked.slice(0, -1));
  }
  function reset() {
    setPicked([]);
  }
  const locked = picked.length === 3;
  return (
    <div className="rounded-xl border border-amber-400/30 bg-white/[0.04] p-3 space-y-3">
      <p className="text-center text-sm font-bold text-amber-200">
        🔐 자물쇠 번호 — 1 ~ 5 중 서로 다른 3 자리
      </p>
      <p className="text-center text-2xl">{locked ? "🔓" : "🔒"}</p>
      <div className="flex items-center justify-center">
        <div
          className={
            "rounded-xl border-2 px-5 py-2 font-mono text-3xl font-extrabold tracking-[0.4em] " +
            (locked
              ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-200"
              : "border-amber-400/40 bg-amber-400/[0.08] text-amber-200")
          }
        >
          {picked.join("").padEnd(3, "_") || "_ _ _"}
        </div>
      </div>
      <div className="mx-auto grid max-w-[200px] grid-cols-3 gap-1.5">
        {[1, 2, 3, 4, 5].map((d) => {
          const used = picked.includes(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => pick(d)}
              disabled={used || locked}
              className={
                "h-10 rounded-lg border-2 font-mono text-base font-bold transition disabled:cursor-not-allowed " +
                (used
                  ? "border-white/10 bg-white/[0.03] text-slate-600 opacity-40"
                  : "border-amber-400/50 bg-amber-400/15 text-amber-200 hover:bg-amber-400/30")
              }
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={back}
          className="rounded-lg border-2 border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-200 hover:bg-amber-400/25"
        >
          ⌫ 하나 지우기
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border-2 border-white/15 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200 hover:bg-white/10"
        >
          ↩ 다시하기
        </button>
      </div>
    </div>
  );
}

function VerifyTable() {
  const rows = [
    {
      label: <span className="text-slate-300">₅P₃</span>,
      calc: "5 × 4 × 3",
      result: "60 가지",
      ok: false,
    },
    {
      label: (
        <span className="text-amber-300">
          등식 ①
          <br />
          <span className="text-[11px]">n × ₙ₋₁Pᵣ₋₁</span>
        </span>
      ),
      calc: "5 × ₄P₂ = 5 × 12",
      result: "60 가지",
      ok: true,
    },
    {
      label: (
        <span className="text-cyan-300">
          등식 ②
          <br />
          <span className="text-[11px]">ₙ₋₁Pᵣ + r × ₙ₋₁Pᵣ₋₁</span>
        </span>
      ),
      calc: "₄P₃ + 3 × ₄P₂ = 24 + 36",
      result: "60 가지",
      ok: true,
    },
  ];
  return (
    <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.04] p-3">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-300">
        ✅ 두 등식 모두 ₅P₃ = 60 으로 일치
      </p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead className="text-slate-400">
            <tr className="border-b border-white/10">
              <th className="px-2 py-1.5 text-left font-normal">등식</th>
              <th className="px-2 py-1.5 text-center font-normal">계산</th>
              <th className="px-2 py-1.5 text-right font-normal">결과</th>
              <th className="px-2 py-1.5 text-right font-normal">
                <span className="sr-only">검증</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0 align-top">
                <td className="px-2 py-2">{r.label}</td>
                <td className="px-2 py-2 text-center font-mono text-slate-300">
                  {r.calc}
                </td>
                <td className="px-2 py-2 text-right font-bold text-emerald-300">
                  {r.result}
                </td>
                <td className="px-2 py-2 text-right">
                  {r.ok ? <span className="text-emerald-300">✓</span> : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-7 text-slate-300">
        💡 <b>등식 ① 의미</b>: 첫 번째 자리에 올 사람을 5 명 중 결정 (5 가지) × 나머지 4
        명 중 2 명 배열 (₄P₂ = 12 가지).
        <br />
        💡 <b>등식 ② 의미</b>: 특정 사람이 시상에{" "}
        <em className="text-cyan-300">없는</em> 경우 (₄P₃ = 24 가지) +{" "}
        <em className="text-amber-300">있는</em> 경우 (나머지 4 명 중 2 명 배열 후 그
        사람을 3 자리 중 삽입 → 3 × ₄P₂ = 36 가지).
      </p>
    </div>
  );
}
