"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "order_matters",
    prompt:
      "순열은 ‘순서가 중요한’ 배치입니다. 6 가지 사례 중 어떤 상황이 ‘순서가 다르면 다른 경우’ 임을 가장 분명하게 보여 주나요? 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 시상식에서 1 등과 2 등이 바뀌면 완전히 다른 결과 — 같은 사람이 뽑혀도 등수가 다르면 다른 경우다. 임원 선출도 마찬가지로 같은 3 명이라도 누가 회장이고 누가 부회장인지에 따라 결과가 달라진다. 반면 단순히 ‘5 명 중 3 명을 뽑는 것’ (조합) 은 누가 어떤 역할인지 따지지 않으므로 순열보다 작다.",
  },
  {
    id: "formula_intuition",
    prompt:
      "P (n, r) = n × (n − 1) × ⋯ × (n − r + 1) 에서 왜 매 단계마다 선택지가 1 씩 줄어드는 걸까요? 줄 세우기·임원 선출 같은 사례로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 회장으로 한 명을 이미 뽑으면 그 사람은 다시 뽑을 수 없으므로 부회장은 남은 4 명 중에서, 총무는 남은 3 명 중에서 뽑아야 한다. 자리에 한 명 앉히고 나면 다음 자리는 ‘한 명 줄어든 인원’ 중에서 골라야 하는 것과 같은 이유다. 그래서 곱셈으로 이어지고, 각 단계가 1 씩 줄어든다.",
  },
];

// ─── 공용 유틸 ────────────────────────────────────────────
function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function P(n: number, r: number): number {
  let v = 1;
  for (let i = 0; i < r; i++) v *= n - i;
  return v;
}

function permFormulaText(n: number, r: number): string {
  if (n === r) {
    // P(n,n) = n!
    const parts: string[] = [];
    for (let i = n; i >= 1; i--) parts.push(`${i}`);
    return `P(${n}, ${n}) = ${n}! = ${parts.join("×")} = ${factorial(n).toLocaleString()}가지`;
  }
  const parts: string[] = [];
  for (let i = 0; i < r; i++) parts.push(`${n - i}`);
  return `P(${n}, ${r}) = ${parts.join("×")} = ${P(n, r).toLocaleString()}가지`;
}

// "모든 경우 보기" — 처음 N 개 + 마지막 일부 미리보기
function* permutations<T>(arr: T[], r: number): Generator<T[]> {
  const n = arr.length;
  const idx = Array.from({ length: r }, (_, i) => i);
  const used: boolean[] = Array(n).fill(false);
  function* helper(depth: number, used: boolean[], cur: T[]): Generator<T[]> {
    if (depth === r) {
      yield [...cur];
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      cur.push(arr[i]);
      yield* helper(depth + 1, used, cur);
      cur.pop();
      used[i] = false;
    }
  }
  yield* helper(0, used, []);
  // suppress unused
  void idx;
}

function listPermutations<T>(arr: T[], r: number, max = 24): T[][] {
  const out: T[][] = [];
  for (const p of permutations(arr, r)) {
    out.push(p);
    if (out.length >= max) break;
  }
  return out;
}

// ─── 메인 ─────────────────────────────────────────────────
type TabId = 0 | 1 | 2 | 3 | 4 | 5;

const TABS: { label: ReactNode }[] = [
  { label: <>👥<br/>줄 세우기</> },
  { label: <>🏛️<br/>임원 선출</> },
  { label: <>🔢<br/>자연수</> },
  { label: <>🏆<br/>시상식</> },
  { label: <>⚽<br/>승부차기</> },
  { label: <>🔐<br/>비밀번호</> },
];

export default function PermutationReallifeExplorer() {
  const [tab, setTab] = useState<TabId>(0);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🎯 순열 실생활 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          줄 세우기 · 임원 선출 · 자연수 · 시상식 · 승부차기 · 비밀번호 6 가지 사례를
          직접 조작하며 순열{" "}
          <b className="text-amber-200 font-mono">P(n, r)</b> 의 의미를 익혀 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {TABS.map((t, i) => (
          <TabBtn
            key={i}
            active={tab === i}
            onClick={() => setTab(i as TabId)}
          >
            {t.label}
          </TabBtn>
        ))}
      </div>

      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}><LineupTab /></div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}><ElectionTab /></div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}><NumberCardTab /></div>
      <div className={tab === 3 ? "mt-5" : "mt-5 hidden"}><PodiumTab /></div>
      <div className={tab === 4 ? "mt-5" : "mt-5 hidden"}><PenaltyTab /></div>
      <div className={tab === 5 ? "mt-5" : "mt-5 hidden"}><PinTab /></div>

      <SummaryTable />

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabBtn({
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
        "rounded-xl py-2 text-center text-[11px] font-bold leading-snug transition sm:text-xs " +
        (active
          ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-amber-200")
      }
    >
      {children}
    </button>
  );
}

// ─── 공용 카드 / 슬롯 ─────────────────────────────────────

function ScenarioHeader({
  title,
  intro,
}: {
  title: ReactNode;
  intro: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent p-4">
      <p className="text-base font-extrabold text-amber-100">{title}</p>
      <p className="mt-1 text-sm leading-7 text-slate-300">{intro}</p>
    </div>
  );
}

function FormulaBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.08] px-4 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
        배치 방법
      </p>
      <p className="mt-1 font-mono text-base font-extrabold text-emerald-100">{text}</p>
    </div>
  );
}

function NoticeBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] px-3 py-2 text-xs leading-7 text-slate-200">
      💡 {children}
    </div>
  );
}

function ActionRow({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {children}
    </div>
  );
}

function ActBtn({
  onClick,
  tone = "neutral",
  children,
}: {
  onClick: () => void;
  tone?: "neutral" | "gold" | "all";
  children: ReactNode;
}) {
  const cls =
    tone === "gold"
      ? "border-amber-400/40 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25"
      : tone === "all"
      ? "border-violet-400/40 bg-violet-400/15 text-violet-200 hover:bg-violet-400/25"
      : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10";
  return (
    <button
      type="button"
      onClick={onClick}
      className={"rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " + cls}
    >
      {children}
    </button>
  );
}

function AllBox<T>({
  show,
  perms,
  total,
  renderItem,
}: {
  show: boolean;
  perms: T[][];
  total: number;
  renderItem: (perm: T[]) => ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="rounded-xl border border-violet-400/30 bg-violet-400/[0.06] p-3">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-violet-300">
        🔢 모든 경우 미리보기 (총 {total.toLocaleString()} 가지)
      </p>
      <p className="mt-1 text-xs text-slate-400">
        처음 {perms.length} 가지만 표시. 나머지는 곱셈으로 셀 수 있어요.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {perms.map((p, i) => (
          <span
            key={i}
            className="rounded-md border border-white/10 bg-slate-950/50 px-2 py-1 font-mono text-xs text-slate-300"
          >
            {renderItem(p)}
          </span>
        ))}
      </div>
    </div>
  );
}

// 인물 이름 풀 (탭별로 사용)
const PEOPLE_4 = ["민준", "서연", "지호", "수아"];
const PEOPLE_5 = ["민준", "서연", "지호", "수아", "예린"];
const PEOPLE_6 = ["민준", "서연", "지호", "수아", "예린", "도현"];
const PEOPLE_BY_N: Record<number, string[]> = {
  3: ["민준", "서연", "지호"],
  4: PEOPLE_4,
  5: PEOPLE_5,
  6: PEOPLE_6,
};

const AVATAR_COLORS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#34d399",
  "#22d3ee",
  "#a78bfa",
];

// ═══════════════════════════════════════════════════════════
//  TAB 0 — 줄 세우기 (n 슬라이더, n명 → n자리)
// ═══════════════════════════════════════════════════════════

function LineupTab() {
  const [n, setN] = useState(4);
  const [placed, setPlaced] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);

  const people = PEOPLE_BY_N[n] || PEOPLE_4;
  const available = useMemo(
    () => people.map((_, i) => i).filter((i) => !placed.includes(i)),
    [people, placed],
  );

  function place(i: number) {
    if (placed.length >= n || placed.includes(i)) return;
    setPlaced([...placed, i]);
  }
  function back() {
    setPlaced(placed.slice(0, -1));
  }
  function reset() {
    setPlaced([]);
    setShowAll(false);
  }
  function changeN(v: number) {
    setN(v);
    setPlaced([]);
    setShowAll(false);
  }

  const total = factorial(n);
  const perms = useMemo(
    () => (showAll ? listPermutations(people, n, 24) : []),
    [showAll, people, n],
  );

  return (
    <div className="space-y-3">
      <ScenarioHeader
        title="👥 줄 세우기"
        intro={
          <>
            n 명을 한 줄로 세우는 경우의 수를 탐구합니다. 후보를 클릭해 순서대로 자리에
            배치해 보세요!
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <span className="text-sm text-slate-300">인원 수 n =</span>
        <input
          type="range"
          min={3}
          max={6}
          step={1}
          value={n}
          onChange={(e) => changeN(parseInt(e.target.value, 10))}
          aria-label="인원 수"
          className="flex-1 accent-amber-400"
        />
        <span className="rounded-md border border-amber-300/40 bg-amber-400/15 px-2 py-0.5 font-mono text-sm font-bold text-amber-200">
          {n} 명
        </span>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-center text-xs text-slate-400">후보 클릭 → 자리 배정</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {people.map((name, i) => {
            const used = placed.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => place(i)}
                disabled={used}
                className={
                  "flex h-14 w-14 flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition disabled:cursor-not-allowed " +
                  (used
                    ? "border-white/10 bg-white/[0.03] text-slate-600 opacity-40"
                    : "border-amber-400/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/25")
                }
                style={used ? undefined : { borderColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                <span className="text-base">🧑</span>
                {name}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-center text-xs text-amber-300">📍 자리 순서</p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {Array.from({ length: n }, (_, i) => (
            <div
              key={i}
              className={
                "flex h-14 w-14 flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition " +
                (placed[i] !== undefined
                  ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
                  : "border-dashed border-white/20 bg-white/[0.03] text-slate-500")
              }
            >
              <span className="text-[10px] text-slate-400">#{i + 1}</span>
              {placed[i] !== undefined ? people[placed[i]] : "—"}
            </div>
          ))}
        </div>

        {placed.length === n ? (
          <p className="mt-3 text-center text-sm font-bold text-emerald-300">
            ✅ {n} 명의 한 가지 배치 완료! 같은 방법으로 총 {total.toLocaleString()} 가지를
            만들 수 있습니다.
          </p>
        ) : (
          <p className="mt-3 text-center text-xs text-slate-400">
            앞으로 {n - placed.length} 명 더 배치하세요 (남은 후보 {available.length} 명)
          </p>
        )}
      </div>

      <FormulaBox text={permFormulaText(n, n)} />

      <ActionRow>
        <ActBtn onClick={back} tone="gold">⌫ 하나 되돌리기</ActBtn>
        <ActBtn onClick={reset}>↩ 초기화</ActBtn>
        <ActBtn onClick={() => setShowAll(!showAll)} tone="all">
          🔢 {showAll ? "닫기" : "모든 경우 보기"}
        </ActBtn>
      </ActionRow>

      <NoticeBox>
        <b>n 명 줄 세우기</b>: 첫 자리 n 가지 · 두 번째 (n − 1) 가지 · ⋯ · 마지막 1 가지
        → <b>P(n, n) = n!</b> — 한 명만 늘어도 경우의 수가 폭발합니다.
      </NoticeBox>

      <AllBox
        show={showAll}
        perms={perms}
        total={total}
        renderItem={(p) => p.join(" → ")}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 임원 선출 (5명 → 회장·부회장·총무)
// ═══════════════════════════════════════════════════════════

const ELECTION_ROLES = [
  { label: "👑 회장", short: "회장" },
  { label: "🥈 부회장", short: "부회장" },
  { label: "📋 총무", short: "총무" },
];

function ElectionTab() {
  const [picked, setPicked] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const people = PEOPLE_5;
  const r = 3;
  const n = people.length;

  function pick(i: number) {
    if (picked.length >= r || picked.includes(i)) return;
    setPicked([...picked, i]);
  }
  function reset() {
    setPicked([]);
    setShowAll(false);
  }
  const total = P(n, r);
  const perms = useMemo(
    () => (showAll ? listPermutations(people, r, 24) : []),
    [showAll, people, r],
  );

  return (
    <div className="space-y-3">
      <ScenarioHeader
        title="🏛️ 임원 선출 (회장·부회장·총무)"
        intro={
          <>
            5 명의 후보 중 회장 · 부회장 · 총무를 뽑는 경우의 수를 탐구합니다. 같은
            사람이 뽑혀도 역할이 다르면 다른 경우 — <b>순서가 중요</b>!
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-center text-xs text-slate-400">후보 클릭 → 역할 배정</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {people.map((name, i) => {
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
                    : "border-amber-400/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/25")
                }
                style={used ? undefined : { borderColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                <span className="text-base">🧑</span>
                {name}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {ELECTION_ROLES.map((r, i) => (
            <div
              key={i}
              className={
                "flex h-20 w-24 flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition " +
                (picked[i] !== undefined
                  ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
                  : "border-dashed border-white/20 bg-white/[0.03] text-slate-500")
              }
            >
              <span className="text-[11px] text-slate-300">{r.label}</span>
              <span className="text-base">
                {picked[i] !== undefined ? people[picked[i]] : "—"}
              </span>
            </div>
          ))}
        </div>

        {picked.length === r ? (
          <p className="mt-3 text-center text-sm font-bold text-emerald-300">
            ✅ 한 가지 배치 완료! 같은 방법으로 총 {total} 가지.
          </p>
        ) : null}
      </div>

      <FormulaBox text={permFormulaText(n, r)} />

      <ActionRow>
        <ActBtn onClick={reset}>↩ 다시하기</ActBtn>
        <ActBtn onClick={() => setShowAll(!showAll)} tone="all">
          🔢 {showAll ? "닫기" : "모든 경우 보기"}
        </ActBtn>
      </ActionRow>

      <NoticeBox>
        회장 선택 <b>5 가지</b> × 부회장 <b>4 가지</b> × 총무 <b>3 가지</b> ={" "}
        <b className="font-mono">P(5, 3) = 60 가지</b>. 같은 사람이 뽑혀도 역할이 다르면
        다른 경우입니다. 순서(역할)가 중요해요!
      </NoticeBox>

      <AllBox
        show={showAll}
        perms={perms}
        total={total}
        renderItem={(p) => `${p[0]}/${p[1]}/${p[2]}`}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 자연수 (1·2·3·4·5 → 세 자리)
// ═══════════════════════════════════════════════════════════

const DIGITS_15 = [1, 2, 3, 4, 5];

function NumberCardTab() {
  const [picked, setPicked] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const n = 5;
  const r = 3;

  function pick(d: number) {
    if (picked.length >= r || picked.includes(d)) return;
    setPicked([...picked, d]);
  }
  function back() {
    setPicked(picked.slice(0, -1));
  }
  function reset() {
    setPicked([]);
    setShowAll(false);
  }
  const total = P(n, r);
  const perms = useMemo(
    () => (showAll ? listPermutations(DIGITS_15, r, 24) : []),
    [showAll, r],
  );
  const numStr = picked.join("");

  return (
    <div className="space-y-3">
      <ScenarioHeader
        title="🔢 자연수 만들기"
        intro={
          <>
            1, 2, 3, 4, 5 다섯 장의 카드로 <b>세 자리 자연수</b> 를 만드는 경우의 수를
            탐구합니다. (같은 카드는 한 번만!)
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-center text-xs text-slate-400">
          카드를 클릭해 세 자리 수를 만들어 보세요
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {DIGITS_15.map((d) => {
            const used = picked.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => pick(d)}
                disabled={used}
                className={
                  "flex h-16 w-12 items-center justify-center rounded-lg border-2 font-serif text-2xl font-bold transition disabled:cursor-not-allowed " +
                  (used
                    ? "border-white/10 bg-white/[0.03] text-slate-600 opacity-40"
                    : "border-amber-400/55 bg-amber-400/15 text-amber-100 hover:bg-amber-400/30")
                }
              >
                {d}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-center">
          <div className="rounded-xl border-2 border-emerald-400/40 bg-emerald-400/[0.08] px-6 py-3 font-mono text-3xl font-extrabold tracking-widest text-emerald-200">
            {numStr ? numStr.padEnd(3, "_").split("").join(" ") : "_ _ _"}
          </div>
        </div>

        {picked.length === r ? (
          <p className="mt-3 text-center text-sm font-bold text-emerald-300">
            ✅ {numStr} 완성! 총 {total} 가지 만들 수 있습니다.
          </p>
        ) : null}
      </div>

      <FormulaBox text={permFormulaText(n, r)} />

      <ActionRow>
        <ActBtn onClick={back} tone="gold">⌫ 하나 지우기</ActBtn>
        <ActBtn onClick={reset}>↩ 다시하기</ActBtn>
        <ActBtn onClick={() => setShowAll(!showAll)} tone="all">
          🔢 {showAll ? "닫기" : "모든 경우 보기"}
        </ActBtn>
      </ActionRow>

      <NoticeBox>
        백의 자리 <b>5 가지</b> × 십의 자리 <b>4 가지</b> × 일의 자리 <b>3 가지</b> ={" "}
        <b className="font-mono">P(5, 3) = 60 가지</b>. 이미 쓴 카드는 재사용 불가 → 매
        자리마다 선택지가 1 씩 줄어듭니다.
      </NoticeBox>

      <AllBox
        show={showAll}
        perms={perms}
        total={total}
        renderItem={(p) => p.join("")}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 3 — 시상식 (6명 → 1·2·3등)
// ═══════════════════════════════════════════════════════════

function PodiumTab() {
  const [picked, setPicked] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const people = PEOPLE_6;
  const n = 6;
  const r = 3;

  function pick(i: number) {
    if (picked.length >= r || picked.includes(i)) return;
    setPicked([...picked, i]);
  }
  function reset() {
    setPicked([]);
    setShowAll(false);
  }
  const total = P(n, r);
  const perms = useMemo(
    () => (showAll ? listPermutations(people, r, 24) : []),
    [showAll, people, r],
  );

  return (
    <div className="space-y-3">
      <ScenarioHeader
        title="🏆 시상식 (1·2·3 등)"
        intro={
          <>
            6 명의 선수 중 1·2·3 등 수상자를 정하는 경우의 수를 탐구합니다. 등수(순서)가
            다르면 다른 경우!
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-center text-xs text-slate-400">선수 클릭 → 시상대 등장</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {people.map((name, i) => {
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
                    : "border-amber-400/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/25")
                }
                style={used ? undefined : { borderColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                <span className="text-base">🏃</span>
                {name}
              </button>
            );
          })}
        </div>

        {/* 시상대 — 2등(왼쪽) · 1등(가운데 높음) · 3등(오른쪽) */}
        <div className="mt-4 flex items-end justify-center gap-2">
          {/* 2등 */}
          <PodiumStep
            order={2}
            height={68}
            color="#cbd5e1"
            label="🥈 2등"
            name={picked[1] !== undefined ? people[picked[1]] : null}
          />
          {/* 1등 */}
          <PodiumStep
            order={1}
            height={96}
            color="#fbbf24"
            label="🥇 1등"
            name={picked[0] !== undefined ? people[picked[0]] : null}
          />
          {/* 3등 */}
          <PodiumStep
            order={3}
            height={48}
            color="#f97316"
            label="🥉 3등"
            name={picked[2] !== undefined ? people[picked[2]] : null}
          />
        </div>
      </div>

      <FormulaBox text={permFormulaText(n, r)} />

      <ActionRow>
        <ActBtn onClick={reset}>↩ 다시하기</ActBtn>
        <ActBtn onClick={() => setShowAll(!showAll)} tone="all">
          🔢 {showAll ? "닫기" : "모든 경우 보기"}
        </ActBtn>
      </ActionRow>

      <NoticeBox>
        1 등 <b>6 가지</b> × 2 등 <b>5 가지</b> × 3 등 <b>4 가지</b> ={" "}
        <b className="font-mono">P(6, 3) = 120 가지</b>. 1 등과 2 등이 바뀌면 완전히 다른
        결과 — 순서가 중요!
      </NoticeBox>

      <AllBox
        show={showAll}
        perms={perms}
        total={total}
        renderItem={(p) => `🥇 ${p[0]} · 🥈 ${p[1]} · 🥉 ${p[2]}`}
      />
    </div>
  );
}

function PodiumStep({
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
        className="w-full rounded-b-md text-center text-[10px] font-bold leading-tight text-slate-900 flex items-center justify-center"
        style={{ height, backgroundColor: color }}
      >
        {label}
        <br />#{order}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 4 — 승부차기 (11명 → 5자리)
// ═══════════════════════════════════════════════════════════

function PenaltyTab() {
  const [picked, setPicked] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const n = 11;
  const r = 5;
  const players = Array.from({ length: n }, (_, i) => i + 1);

  function pick(num: number) {
    if (picked.length >= r || picked.includes(num)) return;
    setPicked([...picked, num]);
  }
  function reset() {
    setPicked([]);
    setShowAll(false);
  }
  const total = P(n, r);
  const perms = useMemo(
    () => (showAll ? listPermutations(players, r, 18) : []),
    [showAll, players, r],
  );

  return (
    <div className="space-y-3">
      <ScenarioHeader
        title="⚽ 승부차기 — 킥 순서"
        intro={
          <>
            축구팀 11 명 중 승부차기를 찰 5 명의 <b>순서</b> 를 정하는 경우의 수를
            탐구합니다. 선수 번호를 클릭하면 킥 순서가 배정됩니다.
          </>
        }
      />

      <div className="rounded-xl border border-emerald-400/15 bg-gradient-to-br from-emerald-900/30 to-slate-950/60 p-3">
        <p className="text-center text-xs text-emerald-300">⚽ 그라운드 — 등번호 클릭</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {players.map((num) => {
            const used = picked.includes(num);
            return (
              <button
                key={num}
                type="button"
                onClick={() => pick(num)}
                disabled={used}
                className={
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 font-mono text-sm font-bold transition disabled:cursor-not-allowed " +
                  (used
                    ? "border-white/10 bg-white/[0.03] text-slate-600 opacity-40"
                    : "border-emerald-400/60 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/30")
                }
              >
                {num}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-center text-xs text-emerald-300">⚽ 킥 순서 배정</p>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {Array.from({ length: r }, (_, i) => (
            <div
              key={i}
              className={
                "flex h-14 w-14 flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition " +
                (picked[i] !== undefined
                  ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
                  : "border-dashed border-white/20 bg-white/[0.03] text-slate-500")
              }
            >
              <span className="text-[10px] text-slate-400">{i + 1} 번 킥</span>
              <span className="font-mono text-base">
                {picked[i] !== undefined ? picked[i] : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <FormulaBox text={permFormulaText(n, r)} />

      <ActionRow>
        <ActBtn onClick={reset}>↩ 다시하기</ActBtn>
        <ActBtn onClick={() => setShowAll(!showAll)} tone="all">
          🔢 {showAll ? "닫기" : "처음 18 가지 보기"}
        </ActBtn>
      </ActionRow>

      <NoticeBox>
        1 번 키커 <b>11</b> × 2 번 <b>10</b> × 3 번 <b>9</b> × 4 번 <b>8</b> × 5 번{" "}
        <b>7</b> = <b className="font-mono">P(11, 5) = 55,440 가지</b>. 킥 순서가 다르면
        심리전도 달라집니다!
      </NoticeBox>

      <AllBox
        show={showAll}
        perms={perms}
        total={total}
        renderItem={(p) => `${p.join(" → ")}`}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 5 — 비밀번호 (0~9 → 4자리)
// ═══════════════════════════════════════════════════════════

const DIGITS_09 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function PinTab() {
  const [picked, setPicked] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const n = 10;
  const r = 4;

  function pick(d: number) {
    if (picked.length >= r || picked.includes(d)) return;
    setPicked([...picked, d]);
  }
  function back() {
    setPicked(picked.slice(0, -1));
  }
  function reset() {
    setPicked([]);
    setShowAll(false);
  }
  const total = P(n, r);
  const perms = useMemo(
    () => (showAll ? listPermutations(DIGITS_09, r, 18) : []),
    [showAll, r],
  );
  const pinStr = picked.join("");
  const locked = picked.length === r;

  return (
    <div className="space-y-3">
      <ScenarioHeader
        title="🔐 비밀번호 만들기"
        intro={
          <>
            0 ~ 9 중 <b>서로 다른 숫자 4 개</b> 를 골라 만드는 비밀번호의 수를 탐구합니다.
            (같은 숫자는 한 번만!)
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-center text-2xl">{locked ? "🔓" : "🔒"}</p>
        <div className="mt-2 flex items-center justify-center">
          <div
            className={
              "rounded-xl border-2 px-5 py-3 font-mono text-3xl font-extrabold tracking-[0.4em] " +
              (locked
                ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-200"
                : "border-amber-400/40 bg-amber-400/[0.08] text-amber-200")
            }
          >
            {pinStr ? pinStr.padEnd(4, "_") : "_ _ _ _"}
          </div>
        </div>

        {/* 텐키 */}
        <div className="mx-auto mt-3 grid max-w-xs grid-cols-3 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, null].map((d, idx) => {
            if (d === null) return <div key={idx} />;
            const used = picked.includes(d);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => pick(d)}
                disabled={used || locked}
                className={
                  "h-12 rounded-lg border-2 font-mono text-xl font-bold transition disabled:cursor-not-allowed " +
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

        {locked ? (
          <p className="mt-3 text-center text-sm font-bold text-emerald-300">
            ✅ 비밀번호 {pinStr} 완성! 총{" "}
            <span className="font-mono">{total.toLocaleString()}</span> 가지 가능.
          </p>
        ) : null}
      </div>

      <FormulaBox text={permFormulaText(n, r)} />

      <ActionRow>
        <ActBtn onClick={back} tone="gold">⌫ 하나 지우기</ActBtn>
        <ActBtn onClick={reset}>↩ 다시하기</ActBtn>
        <ActBtn onClick={() => setShowAll(!showAll)} tone="all">
          🔢 {showAll ? "닫기" : "처음 18 가지 보기"}
        </ActBtn>
      </ActionRow>

      <NoticeBox>
        첫째 자리 <b>10</b> × 둘째 <b>9</b> × 셋째 <b>8</b> × 넷째 <b>7</b> ={" "}
        <b className="font-mono">P(10, 4) = 5,040 가지</b>. 숫자 4 자리만으로도 5 천 가지!
      </NoticeBox>

      <AllBox
        show={showAll}
        perms={perms}
        total={total}
        renderItem={(p) => p.join("")}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  요약 표
// ═══════════════════════════════════════════════════════════

function SummaryTable() {
  const rows: { ex: string; pnr: string; calc: string; result: string }[] = [
    { ex: "👥 4 명 줄 세우기", pnr: "P(4, 4)", calc: "4 × 3 × 2 × 1", result: "24 가지" },
    { ex: "🏛️ 5 명 중 임원 3 명", pnr: "P(5, 3)", calc: "5 × 4 × 3", result: "60 가지" },
    { ex: "🔢 5 장 카드로 세 자리 수", pnr: "P(5, 3)", calc: "5 × 4 × 3", result: "60 가지" },
    { ex: "🏆 6 명 중 1·2·3 등", pnr: "P(6, 3)", calc: "6 × 5 × 4", result: "120 가지" },
    { ex: "⚽ 11 명 중 킥 순서 5 명", pnr: "P(11, 5)", calc: "11 × 10 × 9 × 8 × 7", result: "55,440 가지" },
    { ex: "🔐 0 ~ 9 중 4 자리 비밀번호", pnr: "P(10, 4)", calc: "10 × 9 × 8 × 7", result: "5,040 가지" },
  ];

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-extrabold text-amber-300">
        📊 탐구한 순열 사례 한눈에 보기
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="text-slate-400">
            <tr className="border-b border-white/10">
              <th className="px-2 py-1.5 text-left font-normal">사례</th>
              <th className="px-2 py-1.5 text-center font-normal">P(n, r)</th>
              <th className="px-2 py-1.5 text-center font-normal">계산</th>
              <th className="px-2 py-1.5 text-right font-normal">결과</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="px-2 py-1.5">{r.ex}</td>
                <td className="px-2 py-1.5 text-center font-mono text-amber-300">{r.pnr}</td>
                <td className="px-2 py-1.5 text-center text-slate-300">{r.calc}</td>
                <td className="px-2 py-1.5 text-right font-bold text-emerald-300">{r.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
