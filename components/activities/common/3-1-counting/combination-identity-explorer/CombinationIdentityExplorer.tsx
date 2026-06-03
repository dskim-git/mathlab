"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "favorite_identity",
    prompt:
      "4 가지 조합 등식 ① ₙCᵣ = ₙCₙ₋ᵣ / ② ₙCᵣ = ₙ₋₁Cᵣ + ₙ₋₁Cᵣ₋₁ / ③ r·ₙCᵣ = n·ₙ₋₁Cᵣ₋₁ / ④ ₙCᵣ × ᵣCₖ = ₙCₖ × ₙ₋ₖCᵣ₋ₖ 중 가장 인상 깊었던 등식을 하나 골라, 그 등식이 ‘같은 개수를 다른 방식으로 센 결과’ 임을 시나리오로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: ② 식. 학생 5 명 중 2 명을 뽑을 때 ‘은별 포함 (4 가지) + 은별 제외 (6 가지) = 10 가지 = ₅C₂’ — ‘특정 사람을 기준으로 두 경우로 나눠도 같은 10 가지 조합을 빠짐없이 한 번씩만 세고 있다’ 가 인상적이었음.",
  },
  {
    id: "two_ways_same_count",
    prompt:
      "조합 등식은 모두 ‘같은 개수를 서로 다른 두 방식으로 세면 결과가 같다’ 라는 원리에 기반합니다. 한 가지 시나리오를 두 방법으로 셀 때 결과가 같으려면, 두 방법이 어떤 조건을 만족해야 할까요?",
    kind: "text",
    placeholder:
      "예: 두 방법 모두 (1) 같은 ‘선택 결과 (조합)’ 의 집합을 세고, (2) 어떤 결과도 빠뜨리지 않으며 (망라성), (3) 어떤 결과도 두 번 세지 않아야 (비중복) 한다. 등식 ③ 의 ‘팀 → 대표’ 와 ‘대표 → 팀’ 도 결국 같은 (팀, 대표) 쌍을 한 번씩만 세고 있기 때문에 결과가 같다.",
  },
];

// ─── 공용 유틸 ─────────────────────────────────────────────
function fact(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function C(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  let num = 1;
  for (let i = 0; i < r; i++) num *= n - i;
  return Math.round(num / fact(r));
}
const S0 = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
function sub(n: number): string {
  return String(n)
    .split("")
    .map((c) => S0[+c])
    .join("");
}
function Cstr(n: number, r: number): string {
  return sub(n) + "C" + sub(r);
}

// ─── 메인 ─────────────────────────────────────────────────
type MainTab = 0 | 1 | 2 | 3;

export default function CombinationIdentityExplorer() {
  const [tab, setTab] = useState<MainTab>(0);
  const [done, setDone] = useState<[boolean, boolean, boolean, boolean]>([
    false,
    false,
    false,
    false,
  ]);

  function markDone(i: MainTab) {
    setDone((prev) => {
      if (prev[i]) return prev;
      const next = [...prev] as [boolean, boolean, boolean, boolean];
      next[i] = true;
      return next;
    });
  }

  const earned = done.filter(Boolean).length;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🔢 조합 등식 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          수업에서 배운 <b className="text-emerald-200">4 가지 조합 등식</b> 을 실생활
          상황에서 직접 체험하며 발견해 봅시다.{" "}
          <span className="text-amber-200">⭐</span> 탭별로 등식을 발견하면 별이
          채워져요.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-400">발견한 등식</span>
          {done.map((d, i) => (
            <span
              key={i}
              className={
                "inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-xs font-bold transition " +
                (d
                  ? "border-amber-300/55 bg-amber-300/15 text-amber-100"
                  : "border-white/10 bg-white/5 text-slate-400")
              }
            >
              {d ? "⭐" : "☆"} 등식 {["①", "②", "③", "④"][i]}
            </span>
          ))}
          <span className="ml-auto text-xs font-bold text-emerald-300">
            {earned} / 4
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MainTabBtn
          active={tab === 0}
          done={done[0]}
          onClick={() => setTab(0)}
          headline={<>① ₙCᵣ = ₙCₙ₋ᵣ</>}
          sub="대칭성"
        />
        <MainTabBtn
          active={tab === 1}
          done={done[1]}
          onClick={() => setTab(1)}
          headline={<>② ₙCᵣ = ₙ₋₁Cᵣ + ₙ₋₁Cᵣ₋₁</>}
          sub="파스칼 항등식"
        />
        <MainTabBtn
          active={tab === 2}
          done={done[2]}
          onClick={() => setTab(2)}
          headline={<>③ r·ₙCᵣ = n·ₙ₋₁Cᵣ₋₁</>}
          sub="대표 선출"
        />
        <MainTabBtn
          active={tab === 3}
          done={done[3]}
          onClick={() => setTab(3)}
          headline={<>④ ₙCᵣ × ᵣCₖ = ₙCₖ × ₙ₋ₖCᵣ₋ₖ</>}
          sub="두 팀 나누기"
        />
      </div>

      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}>
        <Identity1Tab onSolve={() => markDone(0)} />
      </div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <Identity2Tab onSolve={() => markDone(1)} />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <Identity3Tab onSolve={() => markDone(2)} />
      </div>
      <div className={tab === 3 ? "mt-5" : "mt-5 hidden"}>
        <Identity4Tab onSolve={() => markDone(3)} />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 공용 UI ──────────────────────────────────────────────
function MainTabBtn({
  active,
  done,
  onClick,
  headline,
  sub,
}: {
  active: boolean;
  done: boolean;
  onClick: () => void;
  headline: ReactNode;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl px-3 py-2.5 text-center text-[11px] font-bold leading-snug transition sm:text-xs " +
        (active
          ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
          : done
            ? "border border-emerald-400/35 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15"
            : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-emerald-200")
      }
    >
      <span className="block font-mono">
        {done && !active ? "✓ " : null}
        {headline}
      </span>
      <span
        className={
          "mt-0.5 block text-[10px] font-semibold " +
          (active ? "text-emerald-50/80" : "text-slate-400")
        }
      >
        {sub}
      </span>
    </button>
  );
}

function FormulaCard({
  main,
  cond,
}: {
  main: ReactNode;
  cond: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-400/15 via-orange-400/10 to-transparent p-4 text-center">
      <p className="font-mono text-lg font-extrabold text-amber-100 sm:text-xl">
        {main}
      </p>
      <p className="mt-1 text-[11px] font-semibold text-slate-400">{cond}</p>
    </div>
  );
}

function ScenarioCard({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent p-4">
      <p className="text-base font-extrabold text-emerald-100">{title}</p>
      <div className="mt-1 text-sm leading-7 text-slate-300">{children}</div>
    </div>
  );
}

function SuccessBox({
  show,
  title,
  emoji,
  children,
}: {
  show: boolean;
  title: string;
  emoji: string;
  children: ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="rounded-2xl border-2 border-emerald-300/55 bg-emerald-400/15 p-4 text-center">
      <div className="text-3xl">{emoji}</div>
      <p className="mt-1 text-base font-extrabold text-emerald-100">{title}</p>
      <div className="mt-2 text-sm leading-7 text-emerald-50/90">{children}</div>
    </div>
  );
}

function NoticeBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] px-3 py-2.5 text-xs leading-7 text-slate-200">
      💡 {children}
    </div>
  );
}

function ResetBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border-2 border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
    >
      ↩ 초기화
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  IDENTITY 1 — ₙCᵣ = ₙCₙ₋ᵣ  (🍦 아이스크림 가게)
// ═══════════════════════════════════════════════════════════

const FLAVORS = ["🍓", "🍫", "🍵", "🍋", "🥭", "🍑", "🍇", "🍒"];
const FLAVOR_LABELS = [
  "딸기",
  "초코",
  "녹차",
  "레몬",
  "망고",
  "복숭아",
  "포도",
  "체리",
];

function Identity1Tab({ onSolve }: { onSolve: () => void }) {
  const [n, setN] = useState(6);
  const [r, setR] = useState(2);
  const [sel, setSel] = useState<number[]>([]);
  const [matched, setMatched] = useState(false);

  function changeN(v: number) {
    setN(v);
    if (r > v) setR(v);
    setSel([]);
    setMatched(false);
  }
  function changeR(v: number) {
    setR(v);
    setSel([]);
    setMatched(false);
  }
  function toggle(i: number) {
    if (matched) return;
    if (sel.includes(i)) setSel(sel.filter((x) => x !== i));
    else if (sel.length < r) setSel([...sel, i]);
  }

  // r==n 또는 r==0 같은 자명한 경우도 인터랙션은 자연스럽게
  useEffect(() => {
    if (sel.length === r && !matched) {
      setMatched(true);
      onSolve();
    }
  }, [sel.length, r, matched, onSolve]);

  const rejected = useMemo(
    () => Array.from({ length: n }, (_, i) => i).filter((i) => !sel.includes(i)),
    [n, sel],
  );
  const lhsVal = C(n, r);
  const rhsVal = C(n, n - r);

  return (
    <div className="space-y-3">
      <FormulaCard
        main={
          <>
            ₙCᵣ <span className="text-orange-200">=</span> ₙCₙ₋ᵣ
          </>
        }
        cond="단, 0 ≤ r ≤ n"
      />
      <ScenarioCard title="🍦 아이스크림 가게">
        <p>
          n 가지 맛 중 r 가지를 <em className="text-emerald-200">고르는 방법</em> 의
          수와, 나머지 n − r 가지를 <em className="text-orange-200">제외하는 방법</em>{" "}
          의 수는 사실 같은 일입니다. 슬라이더로 n, r 을 바꿔 아이스크림을 직접
          골라보세요.
        </p>
      </ScenarioCard>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <RangeRow
            label="전체 맛 수 n"
            min={4}
            max={8}
            value={n}
            onChange={changeN}
            suffix="가지"
          />
          <RangeRow
            label="선택할 수 r"
            min={0}
            max={n}
            value={r}
            onChange={changeR}
            suffix="가지"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-center text-xs text-slate-400">
          👆 {n} 가지 중 {r} 가지를 클릭해 골라보세요
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {FLAVORS.slice(0, n).map((em, i) => {
            const isSel = sel.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className={
                  "flex h-16 flex-col items-center justify-center rounded-lg border-2 text-[11px] font-bold transition " +
                  (isSel
                    ? "border-emerald-400/55 bg-emerald-400/20 text-emerald-100"
                    : "border-white/15 bg-white/5 text-slate-300 hover:border-emerald-300/50 hover:bg-emerald-400/10")
                }
              >
                <span className="text-xl leading-none">{em}</span>
                {FLAVOR_LABELS[i]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ComparePane
          color="blue"
          head={<>🔵 선택한 것 ({Cstr(n, r)} 쪽)</>}
          items={sel}
          emojis={FLAVORS}
          empty="선택하세요..."
          result={`${Cstr(n, r)} = ${lhsVal}`}
        />
        <ComparePane
          color="orange"
          head={<>🟠 제외된 것 ({Cstr(n, n - r)} 쪽)</>}
          items={rejected}
          emojis={FLAVORS}
          empty="선택하면 제외된 것이 표시됩니다..."
          result={`${Cstr(n, n - r)} = ${rhsVal}`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-amber-300/30 bg-amber-300/[0.07] px-4 py-3 text-center font-mono text-sm sm:text-base">
        <span className="text-amber-100">{Cstr(n, r) + " = " + lhsVal}</span>
        <span className={matched ? "text-emerald-300" : "text-slate-500"}>
          {matched ? "=" : "≟"}
        </span>
        <span className="text-emerald-200">{Cstr(n, n - r) + " = " + rhsVal}</span>
        {matched ? <span className="text-emerald-300">✓</span> : null}
      </div>

      <SuccessBox show={matched} title="발견했어요!" emoji="🎉">
        <strong className="text-blue-200">
          {Cstr(n, r)} = {lhsVal}
        </strong>{" "}
        (선택한 것) ={" "}
        <strong className="text-orange-200">
          {Cstr(n, n - r)} = {rhsVal}
        </strong>{" "}
        (제외된 것)
        <br />
        선택 = “버리지 않을 것을 고르는 것” → 항상 같은 경우의 수!
      </SuccessBox>

      <NoticeBox>
        <b>핵심 아이디어:</b> r 개를 선택하면 나머지 n − r 개는 자동으로 제외됩니다.
        “선택할 r 개를 고르는 것” 과 “제외할 n − r 개를 고르는 것” 은 결국 같은
        행동이에요.
      </NoticeBox>

      <div className="flex justify-center">
        <ResetBtn
          onClick={() => {
            setSel([]);
            setMatched(false);
          }}
        />
      </div>
    </div>
  );
}

function ComparePane({
  color,
  head,
  items,
  emojis,
  empty,
  result,
}: {
  color: "blue" | "orange";
  head: ReactNode;
  items: number[];
  emojis: string[];
  empty: string;
  result: string;
}) {
  const palette =
    color === "blue"
      ? {
          border: "border-sky-400/35",
          bg: "bg-sky-400/[0.06]",
          chipBorder: "border-sky-400/40",
          chipBg: "bg-sky-400/10",
        }
      : {
          border: "border-orange-400/35",
          bg: "bg-orange-400/[0.06]",
          chipBorder: "border-orange-400/40",
          chipBg: "bg-orange-400/10",
        };
  return (
    <div className={`rounded-xl border ${palette.border} ${palette.bg} p-3`}>
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-200">
        {head}
      </p>
      <div className="mt-2 flex min-h-[52px] flex-wrap items-center gap-1.5">
        {items.length === 0 ? (
          <span className="text-xs text-slate-500">{empty}</span>
        ) : (
          items.map((i) => (
            <span
              key={i}
              className={`rounded-md border ${palette.chipBorder} ${palette.chipBg} px-2 py-1 text-xl`}
            >
              {emojis[i]}
            </span>
          ))
        )}
      </div>
      <p className="mt-2 text-center font-mono text-sm font-bold text-emerald-200">
        {result}
      </p>
    </div>
  );
}

function RangeRow({
  label,
  min,
  max,
  value,
  onChange,
  suffix,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-300">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        aria-label={label}
        className="flex-1 accent-emerald-400"
      />
      <span className="w-8 rounded-md border border-emerald-300/40 bg-emerald-400/15 px-1 text-center font-mono text-sm font-bold text-emerald-200">
        {value}
      </span>
      {suffix ? <span className="text-xs text-slate-400">{suffix}</span> : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  IDENTITY 2 — ₙCᵣ = ₙ₋₁Cᵣ + ₙ₋₁Cᵣ₋₁  (🏫 학생 5명 중 2명, ⭐은별)
// ═══════════════════════════════════════════════════════════

const PEOPLE2 = ["⭐", "🦁", "🌸", "🐯", "🌊"];
const NAMES2 = ["은별", "도윤", "세아", "준서", "하린"];
const COLORS2 = ["#fbbf24", "#60a5fa", "#f472b6", "#fb923c", "#34d399"];

function Identity2Tab({ onSolve }: { onSolve: () => void }) {
  const [sel, setSel] = useState<number[]>([]);
  const [includeSet, setIncludeSet] = useState<Set<string>>(new Set());
  const [excludeSet, setExcludeSet] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<{ key: string; kind: "in" | "out"; isNew: boolean }[]>(
    [],
  );
  const [done, setDone] = useState(false);

  const total = includeSet.size + excludeSet.size;

  function pick(i: number) {
    if (done) return;
    if (sel.includes(i)) {
      setSel(sel.filter((x) => x !== i));
      return;
    }
    if (sel.length >= 2) return;
    const next = [...sel, i];
    setSel(next);
    if (next.length === 2) {
      const sorted = [...next].sort((a, b) => a - b);
      const key = sorted.join(",");
      const hasSpecial = sorted.includes(0);
      if (hasSpecial) {
        const isNew = !includeSet.has(key);
        if (isNew) {
          const ns = new Set(includeSet);
          ns.add(key);
          setIncludeSet(ns);
        }
        setLog((prev) => [{ key, kind: "in", isNew }, ...prev]);
      } else {
        const isNew = !excludeSet.has(key);
        if (isNew) {
          const ns = new Set(excludeSet);
          ns.add(key);
          setExcludeSet(ns);
        }
        setLog((prev) => [{ key, kind: "out", isNew }, ...prev]);
      }
      setTimeout(() => setSel([]), 550);
    }
  }

  function reset() {
    setSel([]);
    setIncludeSet(new Set());
    setExcludeSet(new Set());
    setLog([]);
    setDone(false);
  }

  function showAll() {
    const allIn = new Set(["0,1", "0,2", "0,3", "0,4"]);
    const allOut = new Set(["1,2", "1,3", "1,4", "2,3", "2,4", "3,4"]);
    setIncludeSet(allIn);
    setExcludeSet(allOut);
    const newLog = [
      ...Array.from(allIn).map((k) => ({ key: k, kind: "in" as const, isNew: true })),
      ...Array.from(allOut).map((k) => ({ key: k, kind: "out" as const, isNew: true })),
    ];
    setLog(newLog);
    setSel([]);
  }

  // 진행상태 -> done
  useEffect(() => {
    if (total === 10 && !done) {
      setDone(true);
      onSolve();
    }
  }, [total, done, onSolve]);

  function pairToNames(key: string): string {
    return key
      .split(",")
      .map((s) => NAMES2[+s])
      .join(", ");
  }

  return (
    <div className="space-y-3">
      <FormulaCard
        main={
          <>
            ₙCᵣ <span className="text-orange-200">=</span> ₙ₋₁Cᵣ + ₙ₋₁Cᵣ₋₁
          </>
        }
        cond="단, 1 ≤ r ≤ n − 1 · (이 활동에서는 n = 5, r = 2)"
      />
      <ScenarioCard title="🏫 학교 대표팀 선발 (n = 5, r = 2)">
        <p>
          5 명의 학생 중 2 명을 대표로 선발합니다. ⭐ <strong>은별</strong> 이 포함되는지
          여부에 따라 경우를 나눠보세요.
        </p>
        <ul className="mt-1 list-disc pl-5">
          <li>
            <em className="text-sky-200">i) 은별 포함</em> → 나머지 4 명 중 1 명 추가 ={" "}
            <span className="font-mono">₄C₁ = 4</span> 가지
          </li>
          <li>
            <em className="text-orange-200">ii) 은별 제외</em> → 은별 빼고 4 명 중 2 명
            선발 = <span className="font-mono">₄C₂ = 6</span> 가지
          </li>
        </ul>
        <p className="mt-1">
          합계: 4 + 6 = <strong className="text-emerald-200">₅C₂ = 10</strong> 가지
        </p>
      </ScenarioCard>

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-center text-xs text-slate-400">
          👆 <span className="text-amber-200">⭐ 은별</span> 을 포함해서도, 제외해서도
          선발해보세요 — 클릭 2 명마다 자동 분류 (총 10 가지)
        </p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {PEOPLE2.map((em, i) => {
            const isSel = sel.includes(i);
            const c = COLORS2[i];
            const star = i === 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(i)}
                className={
                  "flex h-16 flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition " +
                  (isSel
                    ? "bg-white/10"
                    : star
                      ? "border-amber-300/55 bg-amber-300/10 text-amber-200 hover:bg-amber-300/15"
                      : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10")
                }
                style={
                  isSel
                    ? { borderColor: c, color: c, background: c + "22" }
                    : undefined
                }
              >
                <span className="text-xl leading-none">{em}</span>
                {NAMES2[i]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <TallyBox
          color="sky"
          big={includeSet.size}
          label={
            <>
              ⭐ 은별 <strong>포함</strong> 팀
            </>
          }
          formula={
            includeSet.size === 4 ? (
              <span className="text-emerald-300">ₙ₋₁Cᵣ₋₁ = ₄C₁ = 4 ✓</span>
            ) : (
              "ₙ₋₁Cᵣ₋₁ = ₄C₁ = 4"
            )
          }
        />
        <TallyBox
          color="orange"
          big={excludeSet.size}
          label={
            <>
              ⭐ 은별 <strong>제외</strong> 팀
            </>
          }
          formula={
            excludeSet.size === 6 ? (
              <span className="text-emerald-300">ₙ₋₁Cᵣ = ₄C₂ = 6 ✓</span>
            ) : (
              "ₙ₋₁Cᵣ = ₄C₂ = 6"
            )
          }
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
            style={{ width: `${(total / 10) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-center text-xs font-bold text-slate-300">
          {total} / 10 가지 발견
        </p>
        {log.length > 0 ? (
          <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/60 p-2 text-xs leading-7">
            {log.map((e, idx) => {
              const muted = !e.isNew;
              return (
                <div
                  key={idx}
                  className={muted ? "text-slate-500" : undefined}
                >
                  {e.kind === "in" ? (
                    <span className={muted ? "text-slate-500" : "text-sky-300"}>
                      ⭐ 포함
                    </span>
                  ) : (
                    <span className={muted ? "text-slate-500" : "text-orange-300"}>
                      ❌ 제외
                    </span>
                  )}{" "}
                  [{pairToNames(e.key)}]
                  {e.isNew ? " — 새 발견!" : " — 이미 탐색함"}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <SuccessBox show={done} title="10 가지를 모두 발견했어요!" emoji="🎊">
        <strong>⭐ 은별 포함:</strong> ₄C₁ = 4 가지
        <br />
        <strong>⭐ 은별 제외:</strong> ₄C₂ = 6 가지
        <br />4 + 6 = 10 = <strong>₅C₂</strong> ✓
      </SuccessBox>

      <NoticeBox>
        <b>핵심 아이디어:</b> 특정 원소 k 를 기준으로 보면 r 개를 뽑는 모든 경우는
        반드시 “k 포함 (ₙ₋₁Cᵣ₋₁)” 또는 “k 제외 (ₙ₋₁Cᵣ)” 둘 중 하나입니다. 두 경우는
        절대 겹치지 않으므로 그냥 더하면 돼요. (파스칼의 삼각형의 핵심 규칙!)
      </NoticeBox>

      <div className="flex flex-wrap justify-center gap-2">
        <ResetBtn onClick={reset} />
        <button
          type="button"
          onClick={showAll}
          className="rounded-lg border-2 border-amber-300/55 bg-amber-300/15 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-300/25"
        >
          ✨ 모두 보기
        </button>
      </div>
    </div>
  );
}

function TallyBox({
  color,
  big,
  label,
  formula,
}: {
  color: "sky" | "orange";
  big: number;
  label: ReactNode;
  formula: ReactNode;
}) {
  const palette =
    color === "sky"
      ? { border: "border-sky-400/40", bg: "bg-sky-400/[0.08]", text: "text-sky-200" }
      : {
          border: "border-orange-400/40",
          bg: "bg-orange-400/[0.08]",
          text: "text-orange-200",
        };
  return (
    <div
      className={`rounded-xl border ${palette.border} ${palette.bg} px-3 py-3 text-center`}
    >
      <p className={`text-3xl font-extrabold ${palette.text}`}>{big}</p>
      <p className="mt-1 text-xs font-bold text-slate-300">{label}</p>
      <p className="mt-0.5 font-mono text-[11px] text-slate-400">{formula}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  IDENTITY 3 — r·ₙCᵣ = n·ₙ₋₁Cᵣ₋₁  (⚽ 5명, 팀3 + 대표1)
// ═══════════════════════════════════════════════════════════

const PEOPLE5 = ["🦁", "🌸", "🐯", "🌊", "🔥"];
const NAMES5 = ["도윤", "세아", "준서", "하린", "지호"];
const COLORS5 = ["#60a5fa", "#f472b6", "#fb923c", "#34d399", "#a78bfa"];

function Identity3Tab({ onSolve }: { onSolve: () => void }) {
  // 방법 1: 팀 3명 → 대표 1명
  const [m1Team, setM1Team] = useState<number[]>([]);
  const [m1Rep, setM1Rep] = useState<number>(-1);
  const m1Done = m1Team.length === 3 && m1Rep >= 0;

  // 방법 2: 대표 1명 → 팀 2명
  const [m2Rep, setM2Rep] = useState<number>(-1);
  const [m2Team, setM2Team] = useState<number[]>([]);
  const m2Done = m2Rep >= 0 && m2Team.length === 2;

  const bothDone = m1Done && m2Done;
  const [solved, setSolved] = useState(false);
  useEffect(() => {
    if (bothDone && !solved) {
      setSolved(true);
      onSolve();
    }
  }, [bothDone, solved, onSolve]);

  function m1PickTeam(i: number) {
    if (m1Done) return;
    if (m1Team.includes(i)) {
      setM1Team(m1Team.filter((x) => x !== i));
      setM1Rep(-1);
    } else if (m1Team.length < 3) {
      setM1Team([...m1Team, i]);
    }
  }
  function m1PickRep(i: number) {
    if (m1Done) return;
    setM1Rep(i);
  }

  function m2PickRep(i: number) {
    if (m2Done) return;
    setM2Rep(i);
    setM2Team([]);
  }
  function m2PickTeam(i: number) {
    if (m2Done) return;
    if (m2Team.includes(i)) {
      setM2Team(m2Team.filter((x) => x !== i));
    } else if (m2Team.length < 2) {
      setM2Team([...m2Team, i]);
    }
  }

  function reset() {
    setM1Team([]);
    setM1Rep(-1);
    setM2Rep(-1);
    setM2Team([]);
    setSolved(false);
  }

  return (
    <div className="space-y-3">
      <FormulaCard
        main={
          <>
            r · ₙCᵣ <span className="text-orange-200">=</span> n · ₙ₋₁Cᵣ₋₁
          </>
        }
        cond="단, 1 ≤ r ≤ n · (이 활동에서는 n = 5, r = 3)"
      />
      <ScenarioCard title="⚽ 동아리 팀 구성 + 대표 선출 (n = 5, r = 3)">
        <p>
          5 명 중 3 명의 팀을 구성하고, 그 팀에서 대표 1 명 (👑) 을 선출하는 방법의
          수를 <em className="text-emerald-200">두 가지 방법</em> 으로 세어봅시다. 두
          결과가 같아야 등식이 성립합니다.
        </p>
      </ScenarioCard>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <MethodPane
          head={<>🔵 방법 1 (좌변: r · ₙCᵣ)</>}
          desc={
            <>
              ① 팀 3 명 먼저 선발 → <span className="font-mono">₅C₃ = 10</span> 가지
              <br />② 팀원 중 대표 1 명 선출 → <span className="font-mono">3</span>{" "}
              가지
              <br />
              합계: 10 × 3 = <strong className="text-emerald-200">30</strong>
            </>
          }
        >
          <StepLabel
            done={m1Team.length === 3}
            color="blue"
            text={`① 팀원 3 명 클릭해 선발 (${m1Team.length} / 3)`}
          />
          <PeopleRow
            indices={[0, 1, 2, 3, 4]}
            isSel={(i) => m1Team.includes(i)}
            isDim={(i) => !m1Team.includes(i) && m1Team.length >= 3}
            onPick={m1PickTeam}
            colorAt={(i) => COLORS5[i]}
            badgeAt={() => null}
          />

          <StepLabel
            done={m1Done}
            color="gold"
            dim={m1Team.length < 3}
            text="② 팀원 중 대표 1 명을 클릭 👑"
          />
          {m1Team.length < 3 ? (
            <p className="text-xs text-slate-500">팀 3 명 선발 후 활성화됩니다</p>
          ) : (
            <PeopleRow
              indices={m1Team}
              isSel={(i) => m1Rep === i}
              isDim={() => false}
              onPick={m1PickRep}
              colorAt={(i) => (m1Rep === i ? "#fbbf24" : COLORS5[i])}
              badgeAt={(i) => (m1Rep === i ? "👑" : null)}
            />
          )}

          <ResultBox
            text={
              m1Done ? (
                <>
                  팀 [
                  {m1Team
                    .map((i) => NAMES5[i] + (i === m1Rep ? "👑" : ""))
                    .join(", ")}
                  ] 완성! r · ₙCᵣ = 3 × ₅C₃ = 3 × 10 ={" "}
                  <strong className="text-emerald-200">30</strong>
                </>
              ) : (
                "r · ₙCᵣ = 3 × ₅C₃ = 30 (예상)"
              )
            }
            done={m1Done}
          />
        </MethodPane>

        <MethodPane
          head={<>🟠 방법 2 (우변: n · ₙ₋₁Cᵣ₋₁)</>}
          desc={
            <>
              ① 대표 1 명 먼저 선출 → <span className="font-mono">5</span> 가지
              <br />② 나머지 4 명 중 팀원 2 명 선발 →{" "}
              <span className="font-mono">₄C₂ = 6</span> 가지
              <br />
              합계: 5 × 6 = <strong className="text-emerald-200">30</strong>
            </>
          }
        >
          <StepLabel
            done={m2Rep >= 0}
            color="gold"
            text="① 대표가 될 1 명 먼저 클릭 👑"
          />
          <PeopleRow
            indices={[0, 1, 2, 3, 4]}
            isSel={(i) => m2Rep === i}
            isDim={(i) => m2Rep >= 0 && m2Rep !== i}
            onPick={m2PickRep}
            colorAt={(i) => (m2Rep === i ? "#fbbf24" : COLORS5[i])}
            badgeAt={(i) => (m2Rep === i ? "👑" : null)}
          />

          <StepLabel
            done={m2Done}
            color="blue"
            dim={m2Rep < 0}
            text={`② 나머지 중 팀원 2 명 클릭 (${m2Team.length} / 2)`}
          />
          {m2Rep < 0 ? (
            <p className="text-xs text-slate-500">대표 선출 후 활성화됩니다</p>
          ) : (
            <PeopleRow
              indices={[0, 1, 2, 3, 4].filter((i) => i !== m2Rep)}
              isSel={(i) => m2Team.includes(i)}
              isDim={(i) => !m2Team.includes(i) && m2Team.length >= 2}
              onPick={m2PickTeam}
              colorAt={(i) => COLORS5[i]}
              badgeAt={() => null}
            />
          )}

          <ResultBox
            text={
              m2Done ? (
                <>
                  팀 [{NAMES5[m2Rep]}👑, {m2Team.map((i) => NAMES5[i]).join(", ")}]
                  완성! n · ₙ₋₁Cᵣ₋₁ = 5 × ₄C₂ = 5 × 6 ={" "}
                  <strong className="text-emerald-200">30</strong>
                </>
              ) : (
                "n · ₙ₋₁Cᵣ₋₁ = 5 × ₄C₂ = 30 (예상)"
              )
            }
            done={m2Done}
          />
        </MethodPane>
      </div>

      <SuccessBox show={bothDone} title="두 방법 모두 완성 — 결과가 같네요!" emoji="🌟">
        방법 1 (팀 → 대표): r · ₙCᵣ = 3 × 10 = <strong>30</strong>
        <br />
        방법 2 (대표 → 팀): n · ₙ₋₁Cᵣ₋₁ = 5 × 6 = <strong>30</strong>
        <br />∴ r · ₙCᵣ = n · ₙ₋₁Cᵣ₋₁
      </SuccessBox>

      <NoticeBox>
        <b>핵심 아이디어:</b> “팀 먼저 뽑고 대표 선출” 과 “대표 먼저 뽑고 팀 완성” 은
        결국 같은 (팀, 대표) 쌍을 빠짐없이 한 번씩만 세고 있어요. 그래서 두 방법의
        결과가 같습니다.
      </NoticeBox>

      <div className="flex justify-center">
        <ResetBtn onClick={reset} />
      </div>
    </div>
  );
}

function MethodPane({
  head,
  desc,
  children,
}: {
  head: ReactNode;
  desc: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-sm font-extrabold text-slate-200">{head}</p>
      <div className="mt-1 text-xs leading-7 text-slate-400">{desc}</div>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function StepLabel({
  text,
  color,
  done,
  dim,
}: {
  text: string;
  color: "blue" | "gold" | "pink";
  done?: boolean;
  dim?: boolean;
}) {
  const palette =
    color === "blue"
      ? "text-sky-300"
      : color === "pink"
        ? "text-pink-300"
        : "text-amber-300";
  return (
    <p
      className={
        "text-xs font-extrabold transition " +
        palette +
        (dim ? " opacity-40" : "") +
        (done ? " line-through decoration-2" : "")
      }
    >
      {text}
    </p>
  );
}

function PeopleRow({
  indices,
  isSel,
  isDim,
  onPick,
  colorAt,
  badgeAt,
}: {
  indices: number[];
  isSel: (i: number) => boolean;
  isDim: (i: number) => boolean;
  onPick: (i: number) => void;
  colorAt: (i: number) => string;
  badgeAt: (i: number) => string | null;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {indices.map((i) => {
        const sel = isSel(i);
        const dim = isDim(i);
        const c = colorAt(i);
        const badge = badgeAt(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(i)}
            disabled={dim && !sel}
            className={
              "flex h-12 min-w-[3.4rem] flex-col items-center justify-center rounded-lg border-2 text-[11px] font-bold transition " +
              (sel
                ? "bg-white/10"
                : dim
                  ? "border-white/10 bg-white/[0.02] text-slate-600"
                  : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10")
            }
            style={sel ? { borderColor: c, color: c, background: c + "22" } : undefined}
          >
            <span className="text-lg leading-none">{PEOPLE5[i]}</span>
            <span>
              {NAMES5[i]}
              {badge ? badge : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ResultBox({ text, done }: { text: ReactNode; done: boolean }) {
  return (
    <p
      className={
        "rounded-lg border px-3 py-2 text-center font-mono text-xs leading-6 transition " +
        (done
          ? "border-emerald-300/50 bg-emerald-400/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-slate-400")
      }
    >
      {text}
    </p>
  );
}

// ═══════════════════════════════════════════════════════════
//  IDENTITY 4 — ₙCᵣ × ᵣCₖ = ₙCₖ × ₙ₋ₖCᵣ₋ₖ  (🏃 5명, A2 + B1)
// ═══════════════════════════════════════════════════════════

function Identity4Tab({ onSolve }: { onSolve: () => void }) {
  // 방법 1: 5명 중 3명 선발 → A팀 2명 지정 (나머지 1명 = B)
  const [m1Sel, setM1Sel] = useState<number[]>([]);
  const [m1A, setM1A] = useState<number[]>([]);
  const m1Done = m1Sel.length === 3 && m1A.length === 2;

  // 방법 2: A팀 2명 → B팀 1명
  const [m2A, setM2A] = useState<number[]>([]);
  const [m2B, setM2B] = useState<number[]>([]);
  const m2Done = m2A.length === 2 && m2B.length === 1;

  const bothDone = m1Done && m2Done;
  const [solved, setSolved] = useState(false);
  useEffect(() => {
    if (bothDone && !solved) {
      setSolved(true);
      onSolve();
    }
  }, [bothDone, solved, onSolve]);

  function m1PickSel(i: number) {
    if (m1Done) return;
    if (m1Sel.includes(i)) {
      setM1Sel(m1Sel.filter((x) => x !== i));
      setM1A([]);
    } else if (m1Sel.length < 3) {
      setM1Sel([...m1Sel, i]);
    }
  }
  function m1PickA(i: number) {
    if (m1Done) return;
    if (m1A.includes(i)) {
      setM1A(m1A.filter((x) => x !== i));
    } else if (m1A.length < 2) {
      setM1A([...m1A, i]);
    }
  }

  function m2PickA(i: number) {
    if (m2Done) return;
    if (m2A.includes(i)) {
      setM2A(m2A.filter((x) => x !== i));
      setM2B([]);
    } else if (m2A.length < 2) {
      setM2A([...m2A, i]);
    }
  }
  function m2PickB(i: number) {
    if (m2Done) return;
    if (m2B.includes(i)) {
      setM2B(m2B.filter((x) => x !== i));
    } else if (m2B.length < 1) {
      setM2B([...m2B, i]);
    }
  }

  function reset() {
    setM1Sel([]);
    setM1A([]);
    setM2A([]);
    setM2B([]);
    setSolved(false);
  }

  const m1B = m1Sel.filter((i) => !m1A.includes(i));

  return (
    <div className="space-y-3">
      <FormulaCard
        main={
          <>
            ₙCᵣ × ᵣCₖ <span className="text-orange-200">=</span> ₙCₖ × ₙ₋ₖCᵣ₋ₖ
          </>
        }
        cond="단, 0 < k < r ≤ n · (이 활동에서는 n = 5, r = 3, k = 2)"
      />
      <ScenarioCard title="🏃 체육대회 두 팀 배정 (n = 5, r = 3, k = 2)">
        <p>
          5 명 중 3 명을 선발해 <em className="text-pink-300">A 팀 (2 명)</em> 과{" "}
          <em className="text-orange-200">B 팀 (1 명)</em> 으로 배정하는 방법의 수를{" "}
          <em className="text-emerald-200">두 가지 방법</em> 으로 세어봅시다.
        </p>
      </ScenarioCard>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <MethodPane
          head={<>🔵 방법 1 (좌변: ₅C₃ × ₃C₂)</>}
          desc={
            <>
              ① 5 명 중 3 명 선발 → <span className="font-mono">₅C₃ = 10</span> 가지
              <br />② 선발된 3 명 중 A 팀 2 명 지정 →{" "}
              <span className="font-mono">₃C₂ = 3</span> 가지 (나머지 1 명 = B)
              <br />
              합계: 10 × 3 = <strong className="text-emerald-200">30</strong>
            </>
          }
        >
          <StepLabel
            done={m1Sel.length === 3}
            color="blue"
            text={`① 3 명 선발 클릭 (${m1Sel.length} / 3)`}
          />
          <PeopleRow
            indices={[0, 1, 2, 3, 4]}
            isSel={(i) => m1Sel.includes(i)}
            isDim={(i) => !m1Sel.includes(i) && m1Sel.length >= 3}
            onPick={m1PickSel}
            colorAt={(i) => COLORS5[i]}
            badgeAt={() => null}
          />

          <StepLabel
            done={m1A.length === 2}
            color="pink"
            dim={m1Sel.length < 3}
            text={`② A 팀 2 명 지정 클릭 (${m1A.length} / 2)`}
          />
          {m1Sel.length < 3 ? (
            <p className="text-xs text-slate-500">3 명 선발 후 활성화됩니다</p>
          ) : (
            <PeopleRow
              indices={m1Sel}
              isSel={(i) => m1A.includes(i)}
              isDim={(i) => !m1A.includes(i) && m1A.length >= 2}
              onPick={m1PickA}
              colorAt={() => "#f472b6"}
              badgeAt={(i) => (m1A.includes(i) ? " A" : null)}
            />
          )}

          {m1A.length === 2 ? (
            <p className="text-xs font-bold text-orange-300">
              🟠 B 팀: {m1B.map((i) => NAMES5[i]).join(", ")} (자동 배정)
            </p>
          ) : null}

          <ResultBox
            text={
              m1Done ? (
                <>
                  A [{m1A.map((i) => NAMES5[i]).join(", ")}] · B [
                  {m1B.map((i) => NAMES5[i]).join(", ")}] — ₅C₃ × ₃C₂ = 10 × 3 ={" "}
                  <strong className="text-emerald-200">30</strong>
                </>
              ) : (
                "₅C₃ × ₃C₂ = 10 × 3 = 30 (예상)"
              )
            }
            done={m1Done}
          />
        </MethodPane>

        <MethodPane
          head={<>🟠 방법 2 (우변: ₅C₂ × ₃C₁)</>}
          desc={
            <>
              ① A 팀 2 명 바로 선택 → <span className="font-mono">₅C₂ = 10</span> 가지
              <br />② 나머지 3 명 중 B 팀 1 명 선택 →{" "}
              <span className="font-mono">₃C₁ = 3</span> 가지
              <br />
              합계: 10 × 3 = <strong className="text-emerald-200">30</strong>
            </>
          }
        >
          <StepLabel
            done={m2A.length === 2}
            color="pink"
            text={`① A 팀 2 명 클릭 (${m2A.length} / 2)`}
          />
          <PeopleRow
            indices={[0, 1, 2, 3, 4]}
            isSel={(i) => m2A.includes(i)}
            isDim={(i) => !m2A.includes(i) && m2A.length >= 2}
            onPick={m2PickA}
            colorAt={() => "#f472b6"}
            badgeAt={(i) => (m2A.includes(i) ? " A" : null)}
          />

          <StepLabel
            done={m2B.length === 1}
            color="gold"
            dim={m2A.length < 2}
            text={`② B 팀 1 명 클릭 (${m2B.length} / 1)`}
          />
          {m2A.length < 2 ? (
            <p className="text-xs text-slate-500">A 팀 2 명 선택 후 활성화됩니다</p>
          ) : (
            <PeopleRow
              indices={[0, 1, 2, 3, 4].filter((i) => !m2A.includes(i))}
              isSel={(i) => m2B.includes(i)}
              isDim={(i) => !m2B.includes(i) && m2B.length >= 1}
              onPick={m2PickB}
              colorAt={() => "#fb923c"}
              badgeAt={(i) => (m2B.includes(i) ? " B" : null)}
            />
          )}

          <ResultBox
            text={
              m2Done ? (
                <>
                  A [{m2A.map((i) => NAMES5[i]).join(", ")}] · B [
                  {m2B.map((i) => NAMES5[i]).join(", ")}] — ₅C₂ × ₃C₁ = 10 × 3 ={" "}
                  <strong className="text-emerald-200">30</strong>
                </>
              ) : (
                "₅C₂ × ₃C₁ = 10 × 3 = 30 (예상)"
              )
            }
            done={m2Done}
          />
        </MethodPane>
      </div>

      <SuccessBox show={bothDone} title="두 방법 모두 완성 — 결과가 같네요!" emoji="🏆">
        방법 1 (선발 → 팀 분리): ₅C₃ × ₃C₂ = 10 × 3 = <strong>30</strong>
        <br />
        방법 2 (A 팀 → B 팀): ₅C₂ × ₃C₁ = 10 × 3 = <strong>30</strong>
        <br />∴ ₙCᵣ × ᵣCₖ = ₙCₖ × ₙ₋ₖCᵣ₋ₖ
      </SuccessBox>

      <NoticeBox>
        <b>핵심 아이디어:</b> “먼저 전체에서 r 명 선발 → r 명 안에서 A 팀 분리” 와 “A 팀
        먼저 → 나머지에서 B 팀” 두 방법 모두 결국 같은 (A 팀, B 팀) 배정을 빠짐없이 한
        번씩만 세고 있어요.
      </NoticeBox>

      <div className="flex justify-center">
        <ResetBtn onClick={reset} />
      </div>
    </div>
  );
}
