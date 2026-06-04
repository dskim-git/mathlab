"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "transition_matrix_meaning",
    prompt:
      "전이행렬 A 의 (i, j) 성분은 ‘j 번째 도시 인구 중 i 번째 도시로 이동하는 비율’ 이라는 뜻입니다. 이 약속이 왜 ‘각 열의 합 = 1’ 을 보장하는지, 그리고 그 ‘열의 합 = 1’ 이 인구 보존을 뜻하는 이유를 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: A 의 j 열의 모든 성분 [a₁ⱼ, a₂ⱼ, ..., aₙⱼ] 은 ‘j 번째 도시의 사람들이 1 년 뒤 각 도시 (1, 2, ..., n) 로 흩어지는 비율’ 이다. 그 사람들이 어딘가로는 반드시 이동하므로 모든 비율의 합 = 1. 즉 ‘열의 합 = 1’ 은 ‘사라지거나 새로 생기는 사람이 없다’ 는 인구 보존의 표현. 만약 0.9 만 있고 나머지가 누락되면 10 % 의 인구가 ‘사라진’ 셈이 된다.",
  },
  {
    id: "matrix_generalization",
    prompt:
      "이 활동에서는 2 도시 → 3 도시로 확장해 보았습니다. 도시가 n 개 일 때 전이행렬은 n × n 이 되고, 다음 해 인구는 단 한 줄 ‘Bₙ₊₁ = A × Bₙ’ 로 모두 계산됩니다. 행렬 곱 한 번이 모든 도시 간 이동을 동시에 계산하는 이유를, ‘행렬 곱의 (i, j) 성분 = i 행 · j 열 패턴’ 과 연결해 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 행렬곱 (A × Bₙ) 의 i 번째 성분 = (A 의 i 행) · (Bₙ 의 열 벡터) = aᵢ₁ × (1 번째 도시 인구) + aᵢ₂ × (2 번째 도시 인구) + ... + aᵢₙ × (n 번째 도시 인구). 이게 정확히 ‘1 년 뒤 i 번째 도시에 들어오는 사람 수’ 다 — 각 도시에서 i 로 오는 비율 × 그 도시의 현재 인구를 모두 더한 값. 즉 행렬 곱 한 번이 n 개 도시의 모든 이동을 합산해 새 인구 벡터를 만들어준다. 도시가 100 개로 늘어나도 식의 모양은 같다.",
  },
];

// ─── 상수 ──────────────────────────────────────────────────
const A_2: number[][] = [
  [0.9, 0.05],
  [0.1, 0.95],
];
const INIT_2: number[] = [3_000_000, 20_000];
const MAX_YEAR = 10;
const TARGET = 1_000_000;

const A_3: number[][] = [
  [0.85, 0.05, 0.03],
  [0.08, 0.83, 0.02],
  [0.07, 0.12, 0.95],
];
const INIT_3: number[] = [2_000_000, 1_000_000, 50_000];

// ─── 헬퍼 ─────────────────────────────────────────────────
function matVec(A: number[][], v: number[]): number[] {
  return A.map((row) => row.reduce((s, a, j) => s + a * v[j], 0));
}
function precompute(A: number[][], init: number[], years: number): number[][] {
  const out: number[][] = [init.slice()];
  for (let y = 1; y <= years; y++) {
    out.push(matVec(A, out[y - 1]));
  }
  return out;
}
function fmtPop(n: number): string {
  return Math.round(n).toLocaleString("ko-KR") + " 명";
}
function fmtMan(n: number): string {
  return (Math.round(n / 1000) / 10).toFixed(1) + " 만";
}

// ─── 메인 ─────────────────────────────────────────────────
type Tab = "setup" | "sim" | "chall" | "ext";

export default function MatrixPopulationMigration() {
  const [tab, setTab] = useState<Tab>("setup");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🏙️ 행렬로 보는 두 도시 인구 이동</h3>
        <p className="mt-2 leading-7 text-slate-300">
          전이행렬 <b className="font-mono text-cyan-300">A</b> 와 인구 벡터 B 의 곱{" "}
          <b className="font-mono text-cyan-300">Bₙ₊₁ = A × Bₙ</b> 로 두 도시·세 도시의
          미래 인구를 예측해 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <TabBtn active={tab === "setup"} onClick={() => setTab("setup")}>
          📐 상황 파악
        </TabBtn>
        <TabBtn active={tab === "sim"} onClick={() => setTab("sim")}>
          📊 연도별 시뮬레이션
        </TabBtn>
        <TabBtn active={tab === "chall"} onClick={() => setTab("chall")}>
          🎯 도전!
        </TabBtn>
        <TabBtn active={tab === "ext"} onClick={() => setTab("ext")}>
          🌐 확장하기
        </TabBtn>
      </div>

      <div className={tab === "setup" ? "mt-5" : "mt-5 hidden"}>
        <SetupTab onNext={() => setTab("sim")} />
      </div>
      <div className={tab === "sim" ? "mt-5" : "mt-5 hidden"}>
        <SimTab onNext={() => setTab("chall")} />
      </div>
      <div className={tab === "chall" ? "mt-5" : "mt-5 hidden"}>
        <ChallengeTab />
      </div>
      <div className={tab === "ext" ? "mt-5" : "mt-5 hidden"}>
        <ExtendTab />
      </div>

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
        "rounded-xl px-3 py-2.5 text-center text-[11px] font-bold transition sm:text-xs " +
        (active
          ? "bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg shadow-cyan-500/25"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ─── 공용 ─────────────────────────────────────────────────
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">{children}</div>
  );
}
function CardTitle({ children }: { children: ReactNode }) {
  return <p className="text-sm font-extrabold text-cyan-200">{children}</p>;
}

function MatrixBracket({
  children,
  n,
  cellH = 40,
}: {
  children: ReactNode;
  n: number;
  cellH?: number;
}) {
  const h = n * cellH + (n - 1) * 4 + 4;
  return (
    <span className="inline-flex items-stretch gap-0.5">
      <svg width={10} height={h} viewBox={`0 0 10 ${h}`} aria-hidden>
        <path
          d={`M 8 1 L 1 1 L 1 ${h - 1} L 8 ${h - 1}`}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
      <span>{children}</span>
      <svg width={10} height={h} viewBox={`0 0 10 ${h}`} aria-hidden>
        <path
          d={`M 2 1 L 9 1 L 9 ${h - 1} L 2 ${h - 1}`}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function MatDisp({
  cells,
  color,
  cellW = 70,
  cellH = 44,
  fontSize = "0.9rem",
}: {
  cells: (string | number)[][];
  color: string;
  cellW?: number;
  cellH?: number;
  fontSize?: string;
}) {
  const rows = cells.length;
  const cols = cells[0].length;
  return (
    <MatrixBracket n={rows} cellH={cellH}>
      <span
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, ${cellW}px)` }}
      >
        {cells.flat().map((v, i) => (
          <span
            key={i}
            className="flex items-center justify-center rounded-sm border border-white/10 bg-slate-900 font-mono font-bold"
            style={{
              color,
              height: `${cellH}px`,
              fontSize,
            }}
          >
            {v}
          </span>
        ))}
      </span>
    </MatrixBracket>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 0 — 상황 파악
// ═══════════════════════════════════════════════════════════

function SetupTab({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-3">
      <Card>
        <CardTitle>🏙️ 두 도시 인구 이동 시나리오</CardTitle>
        <p className="mt-2 text-xs leading-7 text-slate-300">
          <b className="text-sky-300">Z 광역시</b> (인구 300 만 명) 와{" "}
          <b className="text-emerald-300">신도시</b> (인구 2 만 명) 사이에 매년 인구가
          이동합니다. 광역시 인구의 <b className="text-emerald-300">10 %</b> 가 매년
          신도시로 이동하고, 신도시 인구의 <b className="text-rose-400">5 %</b> 가
          광역시로 돌아옵니다.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          {/* Z 광역시 */}
          <CityBox icon="🏙️" name="Z 광역시" color="#38bdf8" pop="300 만 명" />

          {/* 화살표 */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                10 %
              </span>
              <span className="text-2xl text-emerald-400">→</span>
            </div>
            <p className="text-[10px] text-slate-500">매년 이동</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl text-rose-400">←</span>
              <span className="rounded-md border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 text-xs font-bold text-rose-300">
                5 %
              </span>
            </div>
          </div>

          {/* 신도시 */}
          <CityBox icon="🏘️" name="신도시" color="#10b981" pop="2 만 명" />
        </div>
      </Card>

      <Card>
        <CardTitle>📐 전이행렬 A 와 초기 인구 B₀</CardTitle>
        <div className="mt-3 flex flex-wrap items-start justify-center gap-8">
          <div className="text-center">
            <p className="text-sm font-extrabold text-amber-300">전이행렬 A</p>
            <div className="mt-2 flex justify-center">
              <MatDisp
                cells={[
                  ["0.9", "0.05"],
                  ["0.1", "0.95"],
                ]}
                color="#fbbf24"
                cellW={72}
              />
            </div>
            <p className="mt-2 text-[11px] leading-6 text-slate-400">
              1 행: 광역시로 모이는 비율
              <br />2 행: 신도시로 모이는 비율
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm font-extrabold text-sky-300">초기 인구 B₀</p>
            <div className="mt-2 flex justify-center">
              <MatDisp
                cells={[["300 만"], ["2 만"]]}
                color="#38bdf8"
                cellW={84}
              />
            </div>
            <p className="mt-2 text-[11px] leading-6 text-slate-400">
              1 행: Z 광역시
              <br />2 행: 신도시
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.06] p-3 text-xs leading-7 text-slate-200">
          💡 <b>핵심</b>: 다음 해 인구 = <b className="font-mono text-cyan-300">A × Bₙ</b>{" "}
          한 번의 행렬 곱으로 두 도시의 인구를 동시에 갱신!
          <br />각 열의 합 ={" "}
          <b className="text-amber-300">1</b> 이라는 점 (
          <span className="font-mono">0.9 + 0.1 = 1</span>,{" "}
          <span className="font-mono">0.05 + 0.95 = 1</span>) 은 인구가 사라지지 않고
          어딘가로 반드시 이동한다는 의미예요.
        </div>
      </Card>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110"
        >
          📊 시뮬레이션으로 확인하기 ▶
        </button>
      </div>
    </div>
  );
}

function CityBox({
  icon,
  name,
  color,
  pop,
}: {
  icon: string;
  name: string;
  color: string;
  pop: string;
}) {
  return (
    <div
      className="flex w-40 flex-col items-center gap-1 rounded-xl border-2 px-3 py-3"
      style={{
        borderColor: color + "55",
        background: color + "10",
      }}
    >
      <span className="text-3xl">{icon}</span>
      <p className="text-sm font-extrabold" style={{ color }}>
        {name}
      </p>
      <p
        className="rounded-md px-2 py-0.5 text-xs font-bold"
        style={{ color, background: color + "18", border: `1px solid ${color}40` }}
      >
        {pop}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 연도별 시뮬레이션
// ═══════════════════════════════════════════════════════════

function SimTab({ onNext }: { onNext: () => void }) {
  const pop = useMemo(() => precompute(A_2, INIT_2, MAX_YEAR), []);
  const [year, setYear] = useState(0);

  const [city, news] = pop[year];
  const maxRef = INIT_2[0];
  const cp = Math.min((city / maxRef) * 100, 100);
  const np = Math.min((news / maxRef) * 100, 100);

  const newPassed = year >= 1 && pop[year][1] >= TARGET && pop[year - 1][1] < TARGET;
  const reachedMilestone = pop[year][1] >= TARGET;

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>📊 연도별 시뮬레이션</CardTitle>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-amber-300/45 bg-amber-300/15 px-3 py-1 font-mono text-base font-extrabold text-amber-100">
              {year} 년
            </span>
            <button
              type="button"
              onClick={() => setYear((y) => Math.min(y + 1, MAX_YEAR))}
              disabled={year >= MAX_YEAR}
              className="rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              ▶ 다음 해
            </button>
            <button
              type="button"
              onClick={() => setYear(0)}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
            >
              ↺ 처음으로
            </button>
          </div>
        </div>

        {/* 막대 그래프 */}
        <div className="mt-4 space-y-3">
          <Bar label="🏙️ Z 광역시" color="#38bdf8" pct={cp} value={fmtPop(city)} />
          <Bar
            label="🏘️ 신도시"
            color="#10b981"
            pct={np}
            value={fmtPop(news)}
            note={reachedMilestone ? "★ 100 만 명 돌파!" : undefined}
          />
        </div>

        {/* 계산식 */}
        {year > 0 ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/40 p-3">
            <p className="text-xs font-bold text-cyan-300">
              A × B<sub>{year - 1}</sub> = B<sub>{year}</sub> 계산 과정 (단위: 만 명)
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <MatDisp
                cells={[
                  ["0.9", "0.05"],
                  ["0.1", "0.95"],
                ]}
                color="#fbbf24"
                cellW={62}
                cellH={36}
                fontSize="0.78rem"
              />
              <span className="text-lg font-bold text-slate-400">×</span>
              <MatDisp
                cells={[[fmtMan(pop[year - 1][0])], [fmtMan(pop[year - 1][1])]]}
                color="#38bdf8"
                cellW={68}
                cellH={36}
                fontSize="0.78rem"
              />
              <span className="text-lg font-bold text-slate-400">=</span>
              <MatDisp
                cells={[[fmtMan(pop[year][0])], [fmtMan(pop[year][1])]]}
                color="#10b981"
                cellW={68}
                cellH={36}
                fontSize="0.78rem"
              />
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <p>
                <b className="text-sky-300">광역시</b>: 0.9 × {fmtMan(pop[year - 1][0])} +
                0.05 × {fmtMan(pop[year - 1][1])} ={" "}
                <b className="font-mono text-sky-200">{fmtMan(pop[year][0])}</b>
              </p>
              <p>
                <b className="text-emerald-300">신도시</b>: 0.1 ×{" "}
                {fmtMan(pop[year - 1][0])} + 0.95 × {fmtMan(pop[year - 1][1])} ={" "}
                <b className="font-mono text-emerald-200">{fmtMan(pop[year][1])}</b>
              </p>
            </div>
          </div>
        ) : null}

        {/* milestone */}
        {newPassed ? (
          <div className="mt-3 rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 p-3 text-center">
            <div className="text-2xl">🎉</div>
            <p className="text-base font-extrabold text-emerald-100">
              신도시 인구 100 만 명 돌파!
            </p>
            <p className="mt-1 text-xs text-emerald-50/85">
              {year} 년 후 신도시 인구 = {fmtPop(pop[year][1])}
            </p>
          </div>
        ) : null}
      </Card>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:brightness-110"
        >
          🎯 도전 문제 풀기 ▶
        </button>
      </div>
    </div>
  );
}

function Bar({
  label,
  color,
  pct,
  value,
  note,
}: {
  label: string;
  color: string;
  pct: number;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold" style={{ color }}>
        {label}
      </p>
      <div className="relative h-7 w-full overflow-hidden rounded-md bg-slate-800">
        <div
          className="flex h-full items-center justify-end px-2 transition-all"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
          }}
        >
          <span className="text-xs font-bold text-slate-950">{value}</span>
        </div>
      </div>
      {note ? (
        <p className="mt-1 text-[11px] font-bold text-emerald-300">{note}</p>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 도전
// ═══════════════════════════════════════════════════════════

function ChallengeTab() {
  const pop = useMemo(() => precompute(A_2, INIT_2, MAX_YEAR), []);
  const answer = useMemo(
    () => pop.findIndex((p) => p[1] >= TARGET),
    [pop],
  );
  const [input, setInput] = useState("");
  const [result, setResult] = useState<null | "ok" | "ng" | "warn">(null);
  const [revealed, setRevealed] = useState(false);

  function check() {
    const v = parseInt(input, 10);
    if (!Number.isFinite(v) || v < 1 || v > MAX_YEAR) {
      setResult("warn");
      return;
    }
    setResult(v === answer ? "ok" : "ng");
    if (v === answer) setRevealed(true);
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardTitle>🎯 도전 문제</CardTitle>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          시뮬레이션에서 확인한 것처럼 신도시 인구는 매년 늘어나요.
          <br />
          <b className="text-amber-300">
            신도시 인구가 처음으로 100 만 명을 넘는 것은 몇 년 후일까요?
          </b>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            max={MAX_YEAR}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="?"
            aria-label="몇 년 후"
            className="w-24 rounded-md border border-white/15 bg-slate-900 px-3 py-2 text-center font-mono text-base font-bold text-amber-200 [color-scheme:dark]"
          />
          <span className="text-base font-bold text-slate-400">년 후</span>
          <button
            type="button"
            onClick={check}
            className="rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 px-4 py-1.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:brightness-110"
          >
            ✓ 확인
          </button>
        </div>

        {result === "ok" ? (
          <p className="mt-3 rounded-lg border border-emerald-400/45 bg-emerald-400/15 px-3 py-2 text-center text-sm font-bold text-emerald-100">
            🎉 정답! {answer} 년 후 신도시 인구는 약 {fmtPop(pop[answer][1])} 으로 100
            만 명을 넘어요.
          </p>
        ) : result === "ng" ? (
          <p className="mt-3 rounded-lg border border-rose-400/45 bg-rose-400/15 px-3 py-2 text-center text-sm font-bold text-rose-100">
            ❌ 아쉬워요. 시뮬레이션 탭에서 매년 신도시 인구를 다시 확인해 보세요!
          </p>
        ) : result === "warn" ? (
          <p className="mt-3 rounded-lg border border-amber-300/55 bg-amber-300/10 px-3 py-2 text-center text-sm font-bold text-amber-100">
            ⚠️ 1 ~ {MAX_YEAR} 사이의 숫자를 입력하세요.
          </p>
        ) : null}
      </Card>

      <Card>
        <CardTitle>📈 인구 변화 그래프</CardTitle>
        <PopulationChart pop={pop} answer={answer} revealAll={revealed} />
        {revealed ? (
          <p className="mt-3 rounded-lg border border-amber-300/35 bg-amber-300/[0.08] px-3 py-2 text-xs leading-7 text-amber-100">
            📌 초록 선이 노란 점선을 처음 넘는 시점이 바로{" "}
            <b className="font-mono">{answer} 년 후</b> · {answer} 년 후 신도시 인구 ≈{" "}
            <b className="font-mono text-emerald-300">{fmtPop(pop[answer][1])}</b>
          </p>
        ) : (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-amber-400/25 hover:brightness-110"
            >
              📈 그래프 전체 공개
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── 라인 차트 (SVG) ──────────────────────────────────────
function PopulationChart({
  pop,
  answer,
  revealAll,
}: {
  pop: number[][];
  answer: number;
  revealAll: boolean;
}) {
  const W = 640;
  const H = 280;
  const pad = { l: 64, r: 16, t: 16, b: 36 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const years = pop.length;
  const xMax = MAX_YEAR;
  const yMax = Math.max(...pop.map((p) => Math.max(p[0], p[1]))) * 1.05;

  const showThroughYear = revealAll ? MAX_YEAR : Math.min(answer, MAX_YEAR);

  const xAt = (y: number) => pad.l + (y / xMax) * innerW;
  const yAt = (v: number) => pad.t + (1 - v / yMax) * innerH;

  const cityPts = pop
    .slice(0, showThroughYear + 1)
    .map((p, y) => `${xAt(y)},${yAt(p[0])}`)
    .join(" ");
  const newsPts = pop
    .slice(0, showThroughYear + 1)
    .map((p, y) => `${xAt(y)},${yAt(p[1])}`)
    .join(" ");

  const yTicks = [0, 1_000_000, 2_000_000, 3_000_000].filter((t) => t <= yMax);

  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/60 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full" aria-label="인구 변화 그래프">
        {/* y축 */}
        <line
          x1={pad.l}
          y1={pad.t}
          x2={pad.l}
          y2={H - pad.b}
          stroke="#475569"
          strokeWidth={1}
        />
        {/* x축 */}
        <line
          x1={pad.l}
          y1={H - pad.b}
          x2={W - pad.r}
          y2={H - pad.b}
          stroke="#475569"
          strokeWidth={1}
        />
        {/* y 격자 + 라벨 */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              y1={yAt(t)}
              x2={W - pad.r}
              y2={yAt(t)}
              stroke="#1e293b"
              strokeWidth={1}
            />
            <text
              x={pad.l - 8}
              y={yAt(t) + 4}
              textAnchor="end"
              fontSize={11}
              fill="#94a3b8"
              fontFamily="ui-monospace, monospace"
            >
              {(t / 10_000).toFixed(0)} 만
            </text>
          </g>
        ))}
        {/* x 라벨 */}
        {Array.from({ length: years }, (_, y) => (
          <text
            key={y}
            x={xAt(y)}
            y={H - pad.b + 18}
            textAnchor="middle"
            fontSize={10}
            fill="#94a3b8"
            fontFamily="ui-monospace, monospace"
          >
            {y}
          </text>
        ))}
        <text
          x={W - pad.r}
          y={H - pad.b + 32}
          textAnchor="end"
          fontSize={10}
          fill="#64748b"
        >
          (년)
        </text>

        {/* 100 만 기준 점선 */}
        <line
          x1={pad.l}
          y1={yAt(TARGET)}
          x2={W - pad.r}
          y2={yAt(TARGET)}
          stroke="#fbbf24"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        <text
          x={W - pad.r - 4}
          y={yAt(TARGET) - 5}
          textAnchor="end"
          fontSize={10}
          fill="#fbbf24"
          fontWeight="bold"
        >
          100 만 명
        </text>

        {/* 광역시 선 */}
        <polyline
          points={cityPts}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {pop.slice(0, showThroughYear + 1).map((p, y) => (
          <circle key={`c-${y}`} cx={xAt(y)} cy={yAt(p[0])} r={3.5} fill="#38bdf8" />
        ))}

        {/* 신도시 선 */}
        <polyline
          points={newsPts}
          fill="none"
          stroke="#10b981"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {pop.slice(0, showThroughYear + 1).map((p, y) => (
          <circle key={`n-${y}`} cx={xAt(y)} cy={yAt(p[1])} r={3.5} fill="#10b981" />
        ))}

        {/* 정답 표시 (revealed 일 때) */}
        {revealAll ? (
          <g>
            <circle
              cx={xAt(answer)}
              cy={yAt(pop[answer][1])}
              r={7}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={2}
            />
            <text
              x={xAt(answer)}
              y={yAt(pop[answer][1]) - 14}
              textAnchor="middle"
              fontSize={11}
              fill="#fbbf24"
              fontWeight="bold"
            >
              {answer} 년 후 ★
            </text>
          </g>
        ) : null}
      </svg>

      {/* 범례 */}
      <div className="mt-1 flex flex-wrap justify-center gap-4 text-[11px]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-5" style={{ background: "#38bdf8" }} />
          <span className="text-sky-300">Z 광역시</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-5" style={{ background: "#10b981" }} />
          <span className="text-emerald-300">신도시</span>
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-0 w-5 border-t-2 border-dashed"
            style={{ borderColor: "#fbbf24" }}
          />
          <span className="text-amber-300">100 만 명 기준</span>
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 3 — 확장하기 (3 도시)
// ═══════════════════════════════════════════════════════════

function ExtendTab() {
  const pop3 = useMemo(() => precompute(A_3, INIT_3, MAX_YEAR), []);
  const [year, setYear] = useState(0);

  const maxRef3 = INIT_3[0];

  const reachedMilestone3 = pop3[year][2] >= TARGET;
  const newPassed3 =
    year >= 1 && pop3[year][2] >= TARGET && pop3[year - 1][2] < TARGET;

  return (
    <div className="space-y-3">
      <Card>
        <CardTitle>🔢 도시 수 → 행렬 크기</CardTitle>
        <p className="mt-2 text-center text-xs leading-7 text-slate-400">
          도시가 늘어날수록 행렬도 커져요 —{" "}
          <b className="text-amber-300">계산 원리는 동일</b>!
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-center gap-6">
          <div className="text-center">
            <p className="text-xs font-bold text-slate-300">2 도시</p>
            <p className="text-[10px] text-slate-500">2 × 2 전이행렬</p>
            <div className="mt-2 flex justify-center">
              <MatDisp
                cells={[
                  ["0.9", "0.05"],
                  ["0.1", "0.95"],
                ]}
                color="#fbbf24"
                cellW={56}
                cellH={36}
                fontSize="0.78rem"
              />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-300">3 도시</p>
            <p className="text-[10px] text-slate-500">3 × 3 전이행렬</p>
            <div className="mt-2 flex justify-center">
              <MatDisp
                cells={A_3.map((row) => row.map((v) => v.toString()))}
                color="#fbbf24"
                cellW={56}
                cellH={36}
                fontSize="0.78rem"
              />
            </div>
          </div>
        </div>
        <p className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.06] px-3 py-2 text-xs leading-7 text-slate-200">
          💡 A 의 <b className="text-amber-300">(i 행, j 열) 성분</b> = j 번째 도시
          인구 중 i 번째 도시로 이동하는 비율 → 각{" "}
          <b className="text-violet-300">열의 합 = 1</b> (인구는 어딘가로 반드시 이동!)
        </p>
      </Card>

      <Card>
        <CardTitle>🌐 세 도시 시나리오</CardTitle>
        <div className="mt-3 flex justify-center">
          <ThreeCityDiagram />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>📊 세 도시 인구 변화 시뮬레이션</CardTitle>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-amber-300/45 bg-amber-300/15 px-3 py-1 font-mono text-base font-extrabold text-amber-100">
              {year} 년
            </span>
            <button
              type="button"
              onClick={() => setYear((y) => Math.min(y + 1, MAX_YEAR))}
              disabled={year >= MAX_YEAR}
              className="rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              ▶ 다음 해
            </button>
            <button
              type="button"
              onClick={() => setYear(0)}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
            >
              ↺ 처음으로
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Bar
            label="🏙️ A 시"
            color="#38bdf8"
            pct={Math.min((pop3[year][0] / maxRef3) * 100, 100)}
            value={fmtPop(pop3[year][0])}
          />
          <Bar
            label="🏛️ B 시"
            color="#a78bfa"
            pct={Math.min((pop3[year][1] / maxRef3) * 100, 100)}
            value={fmtPop(pop3[year][1])}
          />
          <Bar
            label="🏘️ 신도시"
            color="#10b981"
            pct={Math.min((pop3[year][2] / maxRef3) * 100, 100)}
            value={fmtPop(pop3[year][2])}
            note={reachedMilestone3 ? "★ 100 만 명 돌파!" : undefined}
          />
        </div>

        {newPassed3 ? (
          <div className="mt-3 rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 p-3 text-center">
            <div className="text-2xl">🎉</div>
            <p className="text-base font-extrabold text-emerald-100">
              신도시 인구 100 만 명 돌파!
            </p>
            <p className="mt-1 text-xs text-emerald-50/85">
              {year} 년 후 신도시 인구 = {fmtPop(pop3[year][2])}
            </p>
          </div>
        ) : null}
      </Card>

      <Card>
        <CardTitle>💡 발견한 것들</CardTitle>
        <ul className="mt-2 space-y-2 text-xs leading-7 text-slate-300">
          <li>
            📐 도시가 <b className="text-amber-300">n 개</b> 이면 전이행렬은{" "}
            <b className="text-amber-300">n × n 행렬</b>
          </li>
          <li>
            🔁 계산 원리는 동일:{" "}
            <b className="font-mono text-violet-300">
              B<sub>n+1</sub> = A × B<sub>n</sub>
            </b>
          </li>
          <li>
            🌐 각 도시의 내년 인구는{" "}
            <b className="text-sky-300">현재 모든 도시</b> 의 인구로 결정됨
          </li>
          <li>
            🖥️ 수십 ~ 수백 개 도시 → 컴퓨터가 행렬 계산으로 순식간에 처리!
          </li>
        </ul>
        <div className="mt-3 rounded-lg border border-amber-300/35 bg-amber-300/[0.08] px-3 py-2 text-xs leading-7 text-slate-200">
          📊 <b className="text-amber-300">두 시나리오 비교</b>
          <br />· 2 도시 (광역시 300 만 + 신도시 2 만): 신도시 100 만 돌파 →{" "}
          <b className="text-emerald-300">5 년 후</b>
          <br />· 3 도시 (A 시 200 만 + B 시 100 만 + 신도시 5 만): 신도시 100 만
          돌파 →{" "}
          <b className="text-emerald-300">
            {pop3.findIndex((p) => p[2] >= TARGET)} 년 후
          </b>
          <br />
          <span className="text-slate-500">
            초기 조건과 행렬이 달라도 비슷한 결과가 나올 수 있어요!
          </span>
        </div>
      </Card>
    </div>
  );
}

function ThreeCityDiagram() {
  return (
    <svg viewBox="0 0 300 200" className="w-full max-w-sm" aria-label="세 도시 다이어그램">
      <defs>
        <marker id="mg" viewBox="0 0 8 8" refX={7} refY={4} markerWidth={5} markerHeight={5} orient="auto">
          <path d="M0,0 L8,4 L0,8z" fill="#10b981" />
        </marker>
        <marker id="mr" viewBox="0 0 8 8" refX={7} refY={4} markerWidth={5} markerHeight={5} orient="auto">
          <path d="M0,0 L8,4 L0,8z" fill="#ef4444" />
        </marker>
        <marker id="mb" viewBox="0 0 8 8" refX={7} refY={4} markerWidth={5} markerHeight={5} orient="auto">
          <path d="M0,0 L8,4 L0,8z" fill="#38bdf8" />
        </marker>
        <marker id="mp" viewBox="0 0 8 8" refX={7} refY={4} markerWidth={5} markerHeight={5} orient="auto">
          <path d="M0,0 L8,4 L0,8z" fill="#a78bfa" />
        </marker>
      </defs>
      {/* A → B (green, 8%) */}
      <line x1={140} y1={47} x2={62} y2={146} stroke="#10b981" strokeWidth={2} markerEnd="url(#mg)" />
      {/* B → A (red, 5%) */}
      <line x1={52} y1={143} x2={130} y2={44} stroke="#ef4444" strokeWidth={2} markerEnd="url(#mr)" />
      {/* A → 신도시 (blue, 7%) */}
      <line x1={160} y1={47} x2={238} y2={146} stroke="#38bdf8" strokeWidth={2} markerEnd="url(#mb)" />
      {/* 신도시 → A (purple, 3%) */}
      <line x1={248} y1={143} x2={170} y2={44} stroke="#a78bfa" strokeWidth={2} markerEnd="url(#mp)" />
      {/* B → 신도시 (green, 12%) */}
      <line x1={76} y1={163} x2={222} y2={163} stroke="#10b981" strokeWidth={2} markerEnd="url(#mg)" />
      {/* 신도시 → B (purple, 2%) */}
      <line x1={220} y1={173} x2={78} y2={173} stroke="#a78bfa" strokeWidth={2} markerEnd="url(#mp)" />
      <text x={86} y={88} fontSize={9.5} fill="#10b981" fontWeight="bold">8 % →</text>
      <text x={96} y={106} fontSize={9.5} fill="#ef4444" fontWeight="bold">← 5 %</text>
      <text x={196} y={88} fontSize={9.5} fill="#38bdf8" fontWeight="bold">7 % →</text>
      <text x={184} y={106} fontSize={9.5} fill="#a78bfa" fontWeight="bold">← 3 %</text>
      <text x={128} y={159} fontSize={9.5} fill="#10b981" fontWeight="bold">12 % →</text>
      <text x={128} y={185} fontSize={9.5} fill="#a78bfa" fontWeight="bold">← 2 %</text>
      {/* A 시 */}
      <rect x={115} y={8} width={70} height={36} rx={8} fill="rgba(56,189,248,.15)" stroke="#38bdf8" strokeWidth={1.5} />
      <text x={150} y={23} textAnchor="middle" fontSize={12} fill="#38bdf8" fontWeight="bold">A 시</text>
      <text x={150} y={37} textAnchor="middle" fontSize={9} fill="#94a3b8">200 만 명</text>
      <text x={150} y={52} textAnchor="middle" fontSize={8} fill="#475569">85 % 잔류</text>
      {/* B 시 */}
      <rect x={5} y={148} width={68} height={36} rx={8} fill="rgba(167,139,250,.15)" stroke="#a78bfa" strokeWidth={1.5} />
      <text x={39} y={163} textAnchor="middle" fontSize={12} fill="#a78bfa" fontWeight="bold">B 시</text>
      <text x={39} y={177} textAnchor="middle" fontSize={9} fill="#94a3b8">100 만 명</text>
      <text x={39} y={192} textAnchor="middle" fontSize={8} fill="#475569">83 % 잔류</text>
      {/* 신도시 */}
      <rect x={227} y={148} width={68} height={36} rx={8} fill="rgba(16,185,129,.15)" stroke="#10b981" strokeWidth={1.5} />
      <text x={261} y={163} textAnchor="middle" fontSize={12} fill="#10b981" fontWeight="bold">신도시</text>
      <text x={261} y={177} textAnchor="middle" fontSize={9} fill="#94a3b8">5 만 명</text>
      <text x={261} y={192} textAnchor="middle" fontSize={8} fill="#475569">95 % 잔류</text>
    </svg>
  );
}
