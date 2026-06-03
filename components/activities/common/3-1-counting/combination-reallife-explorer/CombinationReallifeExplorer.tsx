"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "perm_vs_comb",
    prompt:
      "조합과 순열의 가장 큰 차이는 ‘순서를 따지는가’ 입니다. 6 가지 사례 중 어떤 상황이 ‘순서가 중요하지 않다 — 같은 사람들을 뽑으면 같은 경우다’ 라는 점을 가장 분명하게 보여 주나요?",
    kind: "text",
    placeholder:
      "예: 주번 뽑기에서 {민준, 서연} 과 {서연, 민준} 은 같은 주번 조합 — 누가 먼저 뽑혔는지는 의미가 없다. 시상식(순열) 에서는 1 등과 2 등이 바뀌면 다른 결과지만, 주번은 두 명 모두 동등하게 ‘주번’ 이라 순서 정보가 없다.",
  },
  {
    id: "divide_by_r_factorial",
    prompt:
      "C(n, r) = n! / (r! × (n − r)!) 에서 분모에 r! 을 나누는 이유는 무엇인가요? 순열 P(n, r) 와의 관계로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 순열 P(n, r) 은 ‘순서까지 다른 r 개’ 를 세는 것. 그런데 같은 r 명 묶음을 r! 가지 순서로 정렬할 수 있으므로 순서를 무시하면 ‘같은 조합’ 으로 묶이는 묶음이 r! 개씩 있다. 그래서 C(n, r) = P(n, r) / r! = n! / (r! × (n − r)!).",
  },
];

// ─── 공용 ─────────────────────────────────────────────────
function fact(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function C(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  // 분자 = n*(n-1)*...*(n-r+1), 분모 = r!
  let num = 1;
  for (let i = 0; i < r; i++) num *= n - i;
  return Math.round(num / fact(r));
}

function permutationsK<T>(arr: T[], r: number): T[][] {
  const out: T[][] = [];
  function rec(start: number, cur: T[]) {
    if (cur.length === r) {
      out.push([...cur]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      cur.push(arr[i]);
      rec(i + 1, cur);
      cur.pop();
    }
  }
  rec(0, []);
  return out;
}

function CnrText(n: number, r: number, unit = "가지"): string {
  return `C(${n}, ${r}) = ${C(n, r).toLocaleString()}${unit}`;
}

function CnrCalcText(n: number, r: number): string {
  // 분자: n*(n-1)*...*(n-r+1), 분모: r!
  const num: number[] = [];
  for (let i = 0; i < r; i++) num.push(n - i);
  const den: number[] = [];
  for (let i = r; i >= 1; i--) den.push(i);
  return `${num.join(" × ")} / ${den.join(" × ")}`;
}

// ─── 메인 ─────────────────────────────────────────────────
const TABS: { label: ReactNode }[] = [
  { label: <>📦<br/>부분집합</> },
  { label: <>📐<br/>다각형</> },
  { label: <>📋<br/>주번</> },
  { label: <>👕<br/>팀 구성</> },
  { label: <>🍱<br/>반찬</> },
  { label: <>🤝<br/>악수</> },
];

export default function CombinationReallifeExplorer() {
  const [tab, setTab] = useState(0);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 조합 실생활 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          부분집합 · 다각형 · 주번 · 팀 · 메뉴 · 악수 6 가지 사례를 직접 조작하며 조합{" "}
          <b className="font-mono text-amber-200">C(n, r)</b> 을 탐구합니다. <b>순서</b>{" "}
          가 중요한 순열과 다르게, <b>어떤 원소를 골랐는가</b> 만 중요한 것이 조합.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {TABS.map((t, i) => (
          <TabBtn key={i} active={tab === i} onClick={() => setTab(i)}>
            {t.label}
          </TabBtn>
        ))}
      </div>

      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}><SubsetTab /></div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}><PolygonTab /></div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}><CleanupTab /></div>
      <div className={tab === 3 ? "mt-5" : "mt-5 hidden"}><TeamTab /></div>
      <div className={tab === 4 ? "mt-5" : "mt-5 hidden"}><MenuTab /></div>
      <div className={tab === 5 ? "mt-5" : "mt-5 hidden"}><HandshakeTab /></div>

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
          ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-emerald-200")
      }
    >
      {children}
    </button>
  );
}

// ─── 공용 카드 / UI ────────────────────────────────────────

function ScenarioHeader({ title, intro }: { title: ReactNode; intro: ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent p-4">
      <p className="text-base font-extrabold text-emerald-100">{title}</p>
      <p className="mt-1 text-sm leading-7 text-slate-300">{intro}</p>
    </div>
  );
}

function FormulaBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.08] px-4 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
        조합 공식
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

function ResetBtn({ onClick, children = "↩ 다시하기" }: { onClick: () => void; children?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border-2 border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function ShowAllBtn({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " +
        (active
          ? "border-violet-300 bg-violet-400/20 text-violet-100"
          : "border-violet-400/40 bg-violet-400/15 text-violet-200 hover:bg-violet-400/25")
      }
    >
      {active ? "🔢 닫기" : "🔢 모든 경우 보기"}
    </button>
  );
}

function ActionRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function AllCombosBox<T>({
  show,
  combos,
  total,
  highlight,
  renderItem,
}: {
  show: boolean;
  combos: T[][];
  total: number;
  highlight?: (combo: T[]) => boolean;
  renderItem: (combo: T[]) => ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="rounded-xl border border-violet-400/30 bg-violet-400/[0.06] p-3">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-violet-300">
        🔢 모든 경우 (총 {total.toLocaleString()} 가지)
      </p>
      <p className="mt-1 text-[11px] text-slate-400">
        설정된 값에서 나올 수 있는 조합을 사전식 순서로 모두 표시합니다.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {combos.map((c, i) => {
          const hi = highlight?.(c) ?? false;
          return (
            <span
              key={i}
              className={
                "rounded-md border px-2 py-1 font-mono text-xs " +
                (hi
                  ? "border-amber-300/50 bg-amber-300/15 text-amber-100"
                  : "border-white/10 bg-slate-950/50 text-slate-300")
              }
            >
              {renderItem(c)}
            </span>
          );
        })}
      </div>
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
      <span className="text-slate-300">{label} =</span>
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
//  TAB 0 — 부분집합 ({가,나,다,라,마} 중 r개)
// ═══════════════════════════════════════════════════════════

const SUBSET_ELEMS = ["가", "나", "다", "라", "마"];

function SubsetTab() {
  const [r, setR] = useState(2);
  const [picked, setPicked] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);

  function toggle(i: number) {
    if (picked.includes(i)) setPicked(picked.filter((x) => x !== i));
    else if (picked.length < r) setPicked([...picked, i]);
  }
  function changeR(v: number) {
    setR(v);
    setPicked([]);
    setShowAll(false);
  }
  const total = C(5, r);
  const allCombos = useMemo(
    () =>
      showAll
        ? permutationsK<number>(
            Array.from({ length: 5 }, (_, i) => i),
            r,
          )
        : [],
    [showAll, r],
  );
  const pickedKey = useMemo(() => [...picked].sort((a, b) => a - b).join(","), [picked]);
  const subsetStr =
    picked.length > 0 ? `{ ${[...picked].sort((a, b) => a - b).map((i) => SUBSET_ELEMS[i]).join(", ")} }` : "{ }";

  return (
    <div className="space-y-3">
      <ScenarioHeader
        title="📦 부분집합 구하기"
        intro={
          <>
            집합 {`{가, 나, 다, 라, 마}`} 에서 원소를 r 개 고르는 부분집합의 수를
            탐구합니다. 원소를 클릭해 선택 (순서는 상관없어요).
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <RangeRow label="선택할 원소 수 r" min={1} max={5} value={r} onChange={changeR} suffix="개" />
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-center text-xs text-slate-400">원소를 클릭해 보세요</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {SUBSET_ELEMS.map((name, i) => {
            const sel = picked.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className={
                  "flex h-14 w-14 items-center justify-center rounded-lg border-2 text-lg font-bold transition " +
                  (sel
                    ? "border-emerald-400/55 bg-emerald-400/20 text-emerald-100"
                    : "border-white/15 bg-white/5 text-slate-300 hover:border-emerald-300/50 hover:bg-emerald-400/10")
                }
              >
                {name}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-center text-sm">
          <span className="text-slate-400">선택된 부분집합:</span>{" "}
          <span className="font-mono text-base font-bold text-emerald-200">
            {subsetStr}
          </span>
        </p>

        {picked.length === r ? (
          <p className="mt-2 text-center text-sm font-bold text-emerald-300">
            ✅ 한 가지 부분집합! 같은 방법으로 총 {total} 가지를 만들 수 있어요.
          </p>
        ) : (
          <p className="mt-2 text-center text-xs text-slate-400">
            {r - picked.length} 개 더 선택하세요 (같은 원소 다시 누르면 해제)
          </p>
        )}
      </div>

      <FormulaBox text={`${CnrText(5, r)} = ${CnrCalcText(5, r)}`} />

      <ActionRow>
        <ResetBtn onClick={() => setPicked([])}>↩ 초기화</ResetBtn>
        <ShowAllBtn active={showAll} onClick={() => setShowAll(!showAll)} />
      </ActionRow>

      <NoticeBox>
        {`{가, 나}`} 와 {`{나, 가}`} 는 같은 부분집합! 조합에서는{" "}
        <b>어떤 원소를 골랐냐</b> 만 중요. 순열과 달리 순서를 무시하므로 r! 배 적어집니다.
      </NoticeBox>

      <AllCombosBox
        show={showAll}
        combos={allCombos}
        total={total}
        highlight={(c) =>
          picked.length === r && [...c].sort((a, b) => a - b).join(",") === pickedKey
        }
        renderItem={(c) => `{ ${c.map((i) => SUBSET_ELEMS[i]).join(", ")} }`}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 다각형 (원 위 6점 중 r개)
// ═══════════════════════════════════════════════════════════

function PolygonTab() {
  const [r, setR] = useState(3);
  const [picked, setPicked] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);

  // 6점 원 좌표
  const n = 6;
  const W = 340;
  const H = 320;
  const CX = W / 2;
  const CY = H / 2;
  const RADIUS = 110;
  const points = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        return { x: CX + RADIUS * Math.cos(ang), y: CY + RADIUS * Math.sin(ang) };
      }),
    [],
  );

  function toggle(i: number) {
    if (picked.includes(i)) setPicked(picked.filter((x) => x !== i));
    else if (picked.length < r) setPicked([...picked, i]);
  }
  function changeR(v: number) {
    setR(v);
    setPicked([]);
    setShowAll(false);
  }

  const total = C(6, r);
  const shape = r === 3 ? "삼각형" : r === 4 ? "사각형" : "오각형";
  const done = picked.length === r;
  const allCombos = useMemo(
    () =>
      showAll
        ? permutationsK<number>(
            Array.from({ length: 6 }, (_, i) => i),
            r,
          )
        : [],
    [showAll, r],
  );
  const pickedKey = useMemo(() => [...picked].sort((a, b) => a - b).join(","), [picked]);

  // 다각형 선 그리기 — picked 순서대로 + 마지막은 첫 점과 연결
  const sortedPicked = useMemo(() => [...picked].sort((a, b) => a - b), [picked]);

  return (
    <div className="space-y-3">
      <ScenarioHeader
        title="📐 다각형의 개수"
        intro={
          <>
            원 위의 6 개 점 중 r 개를 꼭짓점으로 하는 다각형의 수를 탐구합니다. 점을
            클릭해 꼭짓점을 선택해 보세요!
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <RangeRow
          label="꼭짓점 수 r"
          min={3}
          max={5}
          value={r}
          onChange={changeR}
          suffix="개 (3=삼각형, 4=사각형, 5=오각형)"
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-md">
          {/* 원 배경 */}
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            fill="none"
            stroke="rgba(94,234,212,0.15)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* 선택된 꼭짓점들을 잇는 다각형 */}
          {done ? (
            <polygon
              points={sortedPicked
                .map((i) => `${points[i].x},${points[i].y}`)
                .join(" ")}
              fill="rgba(52,211,153,0.15)"
              stroke="#34d399"
              strokeWidth="2.5"
            />
          ) : (
            picked.length >= 2 ? (
              <polyline
                points={sortedPicked
                  .map((i) => `${points[i].x},${points[i].y}`)
                  .join(" ")}
                fill="none"
                stroke="rgba(52,211,153,0.6)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            ) : null
          )}
          {/* 점 */}
          {points.map((p, i) => {
            const sel = picked.includes(i);
            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={sel ? 12 : 9}
                  fill={sel ? "#34d399" : "rgba(255,255,255,0.1)"}
                  stroke={sel ? "#fff" : "rgba(255,255,255,0.4)"}
                  strokeWidth="2"
                  className="cursor-pointer"
                  onClick={() => toggle(i)}
                />
                <text
                  x={p.x + (p.x - CX) * 0.18}
                  y={p.y + (p.y - CY) * 0.18 + 4}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#cbd5e1"
                  className="pointer-events-none"
                >
                  {String.fromCharCode(65 + i)}
                </text>
              </g>
            );
          })}
        </svg>

        {done ? (
          <p className="mt-2 text-center text-sm font-bold text-emerald-300">
            ✅ 한 {shape} 완성! 총 {total} 가지를 만들 수 있어요.
          </p>
        ) : (
          <p className="mt-2 text-center text-xs text-slate-400">
            점 {r - picked.length} 개 더 선택하세요 (같은 점 다시 누르면 해제)
          </p>
        )}
      </div>

      <FormulaBox
        text={`${CnrText(6, r, ` ${shape}`)} = ${CnrCalcText(6, r)}`}
      />

      <ActionRow>
        <ResetBtn onClick={() => setPicked([])} />
        <ShowAllBtn active={showAll} onClick={() => setShowAll(!showAll)} />
      </ActionRow>

      <NoticeBox>
        꼭짓점을 고르는 <b>순서는 관계없어요</b>. A → B → C 와 C → B → A 는 같은 삼각형!
        <br />6 개 점 중 3 개 선택: <b className="font-mono">C(6, 3) = 20 가지</b> 삼각형,
        4 개 선택: <b className="font-mono">C(6, 4) = 15 가지</b> 사각형.
      </NoticeBox>

      <AllCombosBox
        show={showAll}
        combos={allCombos}
        total={total}
        highlight={(c) =>
          picked.length === r && [...c].sort((a, b) => a - b).join(",") === pickedKey
        }
        renderItem={(c) =>
          `${shape} ${c.map((i) => String.fromCharCode(65 + i)).join("")}`
        }
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 주번 뽑기 (n명 중 2명)
// ═══════════════════════════════════════════════════════════

const STUDENT_NAMES = [
  "민준",
  "서연",
  "지호",
  "수아",
  "예린",
  "도현",
  "하윤",
  "지원",
  "다은",
  "준서",
  "유나",
  "건우",
];

function CleanupTab() {
  const [n, setN] = useState(6);
  const [picked, setPicked] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);

  function toggle(i: number) {
    if (picked.includes(i)) setPicked(picked.filter((x) => x !== i));
    else if (picked.length < 2) setPicked([...picked, i]);
  }
  function changeN(v: number) {
    setN(v);
    setPicked([]);
    setShowAll(false);
  }
  const allCombos = useMemo(
    () =>
      showAll
        ? permutationsK<number>(
            Array.from({ length: n }, (_, i) => i),
            2,
          )
        : [],
    [showAll, n],
  );
  const pickedKey = useMemo(() => [...picked].sort((a, b) => a - b).join(","), [picked]);

  return (
    <div className="space-y-3">
      <ScenarioHeader
        title="📋 주번 뽑기"
        intro={
          <>
            학급에서 주번 2 명을 뽑는 경우의 수를 탐구합니다. 학생을 클릭해 2 명을
            선택하세요! (누가 1 번·2 번 주번인지는 상관없어요.)
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <RangeRow label="학급 인원 n" min={4} max={12} value={n} onChange={changeN} suffix="명" />
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-center text-xs text-slate-400">학생을 클릭해 주번 2 명을 선택</p>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {STUDENT_NAMES.slice(0, n).map((name, i) => {
            const sel = picked.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className={
                  "flex h-14 flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition " +
                  (sel
                    ? "border-emerald-400/55 bg-emerald-400/20 text-emerald-100"
                    : "border-white/15 bg-white/5 text-slate-300 hover:border-emerald-300/50 hover:bg-emerald-400/10")
                }
              >
                <span className="text-base">🧑</span>
                {name}
              </button>
            );
          })}
        </div>

        {picked.length === 2 ? (
          <p className="mt-3 text-center text-sm font-bold text-emerald-300">
            ✅ 주번 {`{${picked.map((i) => STUDENT_NAMES[i]).join(", ")}}`} — 같은 방법으로
            총 {C(n, 2)} 가지.
          </p>
        ) : null}
      </div>

      <FormulaBox text={`${CnrText(n, 2)} = ${CnrCalcText(n, 2)}`} />

      <ActionRow>
        <ResetBtn onClick={() => setPicked([])} />
        <ShowAllBtn active={showAll} onClick={() => setShowAll(!showAll)} />
      </ActionRow>

      <NoticeBox>
        {`{민준, 서연}`} 과 {`{서연, 민준}`} 은 같은 주번 조합! 순서 없이 고르는 것이
        조합이에요. 순열 <b className="font-mono">P(n, 2) = n × (n − 1)</b> 에서{" "}
        <b>2! = 2 로 나누면</b> →{" "}
        <b className="font-mono">C(n, 2) = n × (n − 1) / 2</b>.
      </NoticeBox>

      <AllCombosBox
        show={showAll}
        combos={allCombos}
        total={C(n, 2)}
        highlight={(c) =>
          picked.length === 2 && [...c].sort((a, b) => a - b).join(",") === pickedKey
        }
        renderItem={(c) => `{${c.map((i) => STUDENT_NAMES[i]).join(", ")}}`}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 3 — 팀 구성 (8명 중 r명)
// ═══════════════════════════════════════════════════════════

function TeamTab() {
  const [r, setR] = useState(3);
  const [picked, setPicked] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const n = 8;

  function toggle(i: number) {
    if (picked.includes(i)) setPicked(picked.filter((x) => x !== i));
    else if (picked.length < r) setPicked([...picked, i]);
  }
  function changeR(v: number) {
    setR(v);
    setPicked([]);
    setShowAll(false);
  }
  const allCombos = useMemo(
    () =>
      showAll
        ? permutationsK<number>(
            Array.from({ length: n }, (_, i) => i),
            r,
          )
        : [],
    [showAll, n, r],
  );
  const pickedKey = useMemo(() => [...picked].sort((a, b) => a - b).join(","), [picked]);

  return (
    <div className="space-y-3">
      <ScenarioHeader
        title="👕 팀 구성하기"
        intro={
          <>
            8 명 중 r 명으로 팀을 구성하는 경우의 수를 탐구합니다. 팀원을 클릭해 선택해
            보세요!
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <RangeRow label="팀 인원 r" min={2} max={6} value={r} onChange={changeR} suffix="명" />
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-center text-xs text-slate-400">팀원을 클릭해 선택</p>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {STUDENT_NAMES.slice(0, n).map((name, i) => {
            const sel = picked.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className={
                  "flex h-14 flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition " +
                  (sel
                    ? "border-emerald-400/55 bg-emerald-400/20 text-emerald-100"
                    : "border-white/15 bg-white/5 text-slate-300 hover:border-emerald-300/50 hover:bg-emerald-400/10")
                }
              >
                <span className="text-base">👕</span>
                {name}
              </button>
            );
          })}
        </div>

        {picked.length === r ? (
          <p className="mt-3 text-center text-sm font-bold text-emerald-300">
            ✅ 팀 {`{${picked.map((i) => STUDENT_NAMES[i]).join(", ")}}`} — 총 {C(n, r)}{" "}
            가지.
          </p>
        ) : (
          <p className="mt-3 text-center text-xs text-slate-400">
            {r - picked.length} 명 더 선택하세요
          </p>
        )}
      </div>

      <FormulaBox text={`${CnrText(n, r)} = ${CnrCalcText(n, r)}`} />

      <ActionRow>
        <ResetBtn onClick={() => setPicked([])} />
        <ShowAllBtn active={showAll} onClick={() => setShowAll(!showAll)} />
      </ActionRow>

      <NoticeBox>
        팀에서는 누가 몇 번째로 뽑혔는지 중요하지 않아요. 같은 사람들 = 같은 팀!
        <br />8 명 중 3 명: <b className="font-mono">C(8, 3) = 56 가지</b> — 생각보다
        훨씬 많죠?
      </NoticeBox>

      <AllCombosBox
        show={showAll}
        combos={allCombos}
        total={C(n, r)}
        highlight={(c) =>
          picked.length === r && [...c].sort((a, b) => a - b).join(",") === pickedKey
        }
        renderItem={(c) => `{${c.map((i) => STUDENT_NAMES[i]).join(", ")}}`}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 4 — 메뉴 (7가지 반찬 중 3가지)
// ═══════════════════════════════════════════════════════════

const FOODS = [
  { emoji: "🍚", name: "쌀밥" },
  { emoji: "🥬", name: "샐러드" },
  { emoji: "🥗", name: "나물" },
  { emoji: "🍖", name: "불고기" },
  { emoji: "🍤", name: "새우튀김" },
  { emoji: "🥟", name: "만두" },
  { emoji: "🍡", name: "오뎅" },
];

function MenuTab() {
  const [picked, setPicked] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const r = 3;
  const n = FOODS.length;

  function toggle(i: number) {
    if (picked.includes(i)) setPicked(picked.filter((x) => x !== i));
    else if (picked.length < r) setPicked([...picked, i]);
  }
  const allCombos = useMemo(
    () =>
      showAll
        ? permutationsK<number>(
            Array.from({ length: n }, (_, i) => i),
            r,
          )
        : [],
    [showAll, n, r],
  );
  const pickedKey = useMemo(() => [...picked].sort((a, b) => a - b).join(","), [picked]);

  return (
    <div className="space-y-3">
      <ScenarioHeader
        title="🍱 급식 반찬 선택"
        intro={
          <>
            오늘 급식! 7 가지 반찬 중 3 가지를 선택하는 경우의 수를 탐구합니다. 원하는
            반찬을 3 가지 골라 보세요!
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <p className="text-center text-xs text-slate-400">
          반찬을 클릭해 3 가지를 선택
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {FOODS.map((f, i) => {
            const sel = picked.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className={
                  "flex h-16 flex-col items-center justify-center rounded-lg border-2 text-xs font-bold transition " +
                  (sel
                    ? "border-emerald-400/55 bg-emerald-400/20 text-emerald-100"
                    : "border-white/15 bg-white/5 text-slate-300 hover:border-emerald-300/50 hover:bg-emerald-400/10")
                }
              >
                <span className="text-xl">{f.emoji}</span>
                {f.name}
              </button>
            );
          })}
        </div>

        {picked.length === r ? (
          <p className="mt-3 text-center text-sm font-bold text-emerald-300">
            ✅ 급식: {picked.map((i) => `${FOODS[i].emoji}${FOODS[i].name}`).join(" · ")}{" "}
            — 총 {C(n, r)} 가지 조합 가능.
          </p>
        ) : (
          <p className="mt-3 text-center text-xs text-slate-400">
            {r - picked.length} 가지 더 선택하세요
          </p>
        )}
      </div>

      <FormulaBox text={`${CnrText(n, r)} = ${CnrCalcText(n, r)}`} />

      <ActionRow>
        <ResetBtn onClick={() => setPicked([])} />
        <ShowAllBtn active={showAll} onClick={() => setShowAll(!showAll)} />
      </ActionRow>

      <NoticeBox>
        김치 → 된장 → 샐러드와 샐러드 → 된장 → 김치는 <b>담는 순서는 달라도 같은 급식</b>
        이에요!
        <br />7 가지 중 3 가지: <b className="font-mono">C(7, 3) = 35 가지</b> 급식 메뉴
        조합이 나와요.
      </NoticeBox>

      <AllCombosBox
        show={showAll}
        combos={allCombos}
        total={C(n, r)}
        highlight={(c) =>
          picked.length === r && [...c].sort((a, b) => a - b).join(",") === pickedKey
        }
        renderItem={(c) => c.map((i) => FOODS[i].emoji).join("")}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 5 — 악수 (n명 모두 한 번씩, C(n,2))
// ═══════════════════════════════════════════════════════════

function HandshakeTab() {
  const [n, setN] = useState(5);
  const [animPair, setAnimPair] = useState<[number, number] | null>(null);
  const [doneCount, setDoneCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const timerRef = useRef<number | null>(null);

  // 점 좌표
  const W = 320;
  const H = 300;
  const CX = W / 2;
  const CY = H / 2;
  const R = 110;

  const points = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        return { x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang) };
      }),
    [n],
  );

  const pairs = useMemo(() => permutationsK<number>(Array.from({ length: n }, (_, i) => i), 2), [n]);
  const totalPairs = pairs.length;

  // cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  // n 바뀌면 초기화
  useEffect(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setAnimPair(null);
    setDoneCount(0);
    setRunning(false);
    setShowAll(false);
  }, [n]);

  function start() {
    if (running) return;
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    setDoneCount(0);
    setRunning(true);
    let idx = 0;
    timerRef.current = window.setInterval(() => {
      if (idx >= pairs.length) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setRunning(false);
        setAnimPair(null);
        return;
      }
      const p = pairs[idx];
      setAnimPair([p[0], p[1]]);
      setDoneCount(idx + 1);
      idx++;
    }, 500);
  }

  function reset() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setAnimPair(null);
    setDoneCount(0);
    setRunning(false);
  }

  return (
    <div className="space-y-3">
      <ScenarioHeader
        title="🤝 모임에서 악수하기"
        intro={
          <>
            n 명이 모여 서로 한 번씩 악수할 때 총 악수 횟수를 탐구합니다. 인원을 조절하고
            ‘악수 시작’ 을 눌러 보세요!
          </>
        }
      />

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <RangeRow label="모임 인원 n" min={3} max={8} value={n} onChange={setN} suffix="명" />
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-md">
          {/* 모든 가능한 선 (이전 악수까지) */}
          {pairs.slice(0, doneCount).map((p, i) => (
            <line
              key={i}
              x1={points[p[0]].x}
              y1={points[p[0]].y}
              x2={points[p[1]].x}
              y2={points[p[1]].y}
              stroke="rgba(52,211,153,0.4)"
              strokeWidth="1.5"
            />
          ))}
          {/* 현재 악수 라인 (강조) */}
          {animPair ? (
            <line
              x1={points[animPair[0]].x}
              y1={points[animPair[0]].y}
              x2={points[animPair[1]].x}
              y2={points[animPair[1]].y}
              stroke="#fbbf24"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : null}
          {/* 점 */}
          {points.map((p, i) => {
            const inPair = animPair && (animPair[0] === i || animPair[1] === i);
            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={inPair ? 12 : 9}
                  fill={inPair ? "#fbbf24" : "#34d399"}
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text
                  x={p.x + (p.x - CX) * 0.18}
                  y={p.y + (p.y - CY) * 0.18 + 4}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#cbd5e1"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>

        <p className="mt-2 text-center text-sm font-bold text-emerald-300">
          {doneCount} / {totalPairs} 번 악수
        </p>

        <div className="mt-3 flex justify-center gap-2">
          <button
            type="button"
            onClick={start}
            disabled={running}
            className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            🤝 악수 시작!
          </button>
          <ResetBtn onClick={reset}>↩ 초기화</ResetBtn>
        </div>
      </div>

      <FormulaBox text={`C(${n}, 2) = ${(n * (n - 1)) / 2}번 = ${CnrCalcText(n, 2)}`} />

      <ActionRow>
        <ShowAllBtn active={showAll} onClick={() => setShowAll(!showAll)} />
      </ActionRow>

      <NoticeBox>
        A 와 B 의 악수 = B 와 A 의 악수 → <b>순서 없는 2 명 선택 = 조합</b>!
        <br />n 명 모임의 악수 횟수 ={" "}
        <b className="font-mono">C(n, 2) = n × (n − 1) / 2</b>. 인원이 늘수록 폭발적으로
        증가해요.
      </NoticeBox>

      <AllCombosBox
        show={showAll}
        combos={pairs}
        total={pairs.length}
        renderItem={(c) => `${c[0] + 1} – ${c[1] + 1}`}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  요약 표
// ═══════════════════════════════════════════════════════════

function SummaryTable() {
  const rows = [
    { ex: "📦 5 개 원소 중 2 개 부분집합", cnr: "C(5, 2)", calc: "5×4 / 2×1", result: "10 가지" },
    { ex: "📐 6 개 점 중 3 개로 삼각형", cnr: "C(6, 3)", calc: "6×5×4 / 3×2×1", result: "20 가지" },
    { ex: "📋 6 명 중 주번 2 명", cnr: "C(6, 2)", calc: "6×5 / 2×1", result: "15 가지" },
    { ex: "👕 8 명 중 팀원 3 명", cnr: "C(8, 3)", calc: "8×7×6 / 3×2×1", result: "56 가지" },
    { ex: "🍱 7 가지 반찬 중 3 가지", cnr: "C(7, 3)", calc: "7×6×5 / 3×2×1", result: "35 가지" },
    { ex: "🤝 5 명이 서로 한 번씩 악수", cnr: "C(5, 2)", calc: "5×4 / 2×1", result: "10 번" },
  ];

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-extrabold text-emerald-300">
        📊 탐구한 조합 사례 한눈에 보기
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="text-slate-400">
            <tr className="border-b border-white/10">
              <th className="px-2 py-1.5 text-left font-normal">사례</th>
              <th className="px-2 py-1.5 text-center font-normal">C(n, r)</th>
              <th className="px-2 py-1.5 text-center font-normal">계산</th>
              <th className="px-2 py-1.5 text-right font-normal">결과</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="px-2 py-1.5">{r.ex}</td>
                <td className="px-2 py-1.5 text-center font-mono text-emerald-300">
                  {r.cnr}
                </td>
                <td className="px-2 py-1.5 text-center text-slate-300">{r.calc}</td>
                <td className="px-2 py-1.5 text-right font-bold text-emerald-300">
                  {r.result}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
