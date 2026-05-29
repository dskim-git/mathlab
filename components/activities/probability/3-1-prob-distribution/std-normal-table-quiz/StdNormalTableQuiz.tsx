"use client";

import { useId, useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 수학 ─────────────────────────────────────────────────
// Abramowitz & Stegun erf 근사. p(0 ≤ Z ≤ z) = erf(z/√2)/2
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t) *
      Math.exp(-ax * ax);
  return sign * y;
}
function p0z(z: number): number {
  if (z < 0) return -p0z(-z);
  return erf(z / Math.SQRT2) / 2;
}
function f4(v: number): string {
  return (Math.round(v * 10000) / 10000).toFixed(4);
}

// ─── 자주 쓰는 z값 칩 ────────────────────────────────────
const KEY_Z = [
  { z: 1.0, lbl: "z=1.00" },
  { z: 1.28, lbl: "z=1.28" },
  { z: 1.5, lbl: "z=1.50" },
  { z: 1.65, lbl: "z=1.65" },
  { z: 1.96, lbl: "z=1.96 ★" },
  { z: 2.0, lbl: "z=2.00 ★" },
  { z: 2.33, lbl: "z=2.33" },
  { z: 2.58, lbl: "z=2.58" },
  { z: 3.0, lbl: "z=3.00" },
];

// ─── 퀴즈 데이터 ──────────────────────────────────────────
type Prob = { q: string; ans: string; hint: string; sol: string };

const Z2P_POOL: Prob[] = [
  { q: "p(0 ≤ Z ≤ 1.00)", ans: "0.3413", hint: "표에서 z = 1.0 행, 0.00 열의 값을 읽으세요.", sol: "표에서 z = 1.00 → <b>p = 0.3413</b>" },
  { q: "p(0 ≤ Z ≤ 1.50)", ans: "0.4332", hint: "표에서 z = 1.5 행, 0.00 열의 값을 읽으세요.", sol: "표에서 z = 1.50 → <b>p = 0.4332</b>" },
  { q: "p(0 ≤ Z ≤ 1.96)", ans: "0.4750", hint: "표에서 z = 1.9 행, 0.06 열의 값을 읽으세요.", sol: "표에서 z = 1.96 → <b>p = 0.4750</b>" },
  { q: "p(0 ≤ Z ≤ 2.00)", ans: "0.4772", hint: "표에서 z = 2.0 행, 0.00 열의 값을 읽으세요.", sol: "표에서 z = 2.00 → <b>p = 0.4772</b>" },
  { q: "p(0 ≤ Z ≤ 2.58)", ans: "0.4951", hint: "표에서 z = 2.5 행, 0.08 열의 값을 읽으세요.", sol: "표에서 z = 2.58 → <b>p = 0.4951</b>" },
  { q: "p(−1.00 ≤ Z ≤ 1.00)", ans: "0.6826", hint: "대칭성: p(−z ≤ Z ≤ z) = 2 × p(0 ≤ Z ≤ z)", sol: "2 × p(0≤Z≤1.00) = 2 × 0.3413 = <b>0.6826</b>" },
  { q: "p(−2.00 ≤ Z ≤ 2.00)", ans: "0.9544", hint: "대칭성: p(−z ≤ Z ≤ z) = 2 × p(0 ≤ Z ≤ z)", sol: "2 × p(0≤Z≤2.00) = 2 × 0.4772 = <b>0.9544</b>" },
  { q: "p(−1.96 ≤ Z ≤ 1.96)", ans: "0.9500", hint: "대칭성: p(−z ≤ Z ≤ z) = 2 × p(0 ≤ Z ≤ z)", sol: "2 × p(0≤Z≤1.96) = 2 × 0.4750 = <b>0.9500</b>" },
  { q: "p(Z ≥ 1.96)", ans: "0.0250", hint: "p(Z ≥ z) = 0.5 − p(0 ≤ Z ≤ z)", sol: "0.5 − 0.4750 = <b>0.0250</b>" },
  { q: "p(Z ≥ 1.50)", ans: "0.0668", hint: "p(Z ≥ z) = 0.5 − p(0 ≤ Z ≤ z)", sol: "0.5 − 0.4332 = <b>0.0668</b>" },
  { q: "p(Z ≥ 2.00)", ans: "0.0228", hint: "p(Z ≥ z) = 0.5 − p(0 ≤ Z ≤ z)", sol: "0.5 − 0.4772 = <b>0.0228</b>" },
  { q: "p(Z ≤ 2.00)", ans: "0.9772", hint: "p(Z ≤ z) = 0.5 + p(0 ≤ Z ≤ z)", sol: "0.5 + 0.4772 = <b>0.9772</b>" },
  { q: "p(Z ≤ 1.50)", ans: "0.9332", hint: "p(Z ≤ z) = 0.5 + p(0 ≤ Z ≤ z)", sol: "0.5 + 0.4332 = <b>0.9332</b>" },
  { q: "p(Z ≤ 1.96)", ans: "0.9750", hint: "p(Z ≤ z) = 0.5 + p(0 ≤ Z ≤ z)", sol: "0.5 + 0.4750 = <b>0.9750</b>" },
  { q: "p(1.00 ≤ Z ≤ 2.00)", ans: "0.1359", hint: "p(a ≤ Z ≤ b) = p(0≤Z≤b) − p(0≤Z≤a)", sol: "0.4772 − 0.3413 = <b>0.1359</b>" },
  { q: "p(1.50 ≤ Z ≤ 2.50)", ans: "0.0606", hint: "p(a ≤ Z ≤ b) = p(0≤Z≤b) − p(0≤Z≤a). z=2.50: p=0.4938", sol: "0.4938 − 0.4332 = <b>0.0606</b>" },
  { q: "p(−1.50 ≤ Z ≤ 0)", ans: "0.4332", hint: "대칭성: p(−z ≤ Z ≤ 0) = p(0 ≤ Z ≤ z)", sol: "p(0≤Z≤1.50) = <b>0.4332</b>" },
  { q: "p(−1.96 ≤ Z ≤ 1.50)", ans: "0.9082", hint: "p(−a ≤ Z ≤ b) = p(0≤Z≤a) + p(0≤Z≤b)  (a, b > 0)", sol: "0.4750 + 0.4332 = <b>0.9082</b>" },
  { q: "p(−2.00 ≤ Z ≤ 1.00)", ans: "0.8185", hint: "p(−a ≤ Z ≤ b) = p(0≤Z≤a) + p(0≤Z≤b)  (a, b > 0)", sol: "0.4772 + 0.3413 = <b>0.8185</b>" },
];

const P2Z_POOL: Prob[] = [
  { q: "p(0 ≤ Z ≤ <em>a</em>) = 0.3413일 때, <em>a</em>의 값은?", ans: "1.00", hint: "표에서 0.3413에 해당하는 z값을 찾으세요.", sol: "표에서 p = 0.3413 → <b>a = 1.00</b>" },
  { q: "p(0 ≤ Z ≤ <em>a</em>) = 0.4332일 때, <em>a</em>의 값은?", ans: "1.50", hint: "표에서 0.4332에 해당하는 z값을 찾으세요.", sol: "표에서 p = 0.4332 → <b>a = 1.50</b>" },
  { q: "p(0 ≤ Z ≤ <em>a</em>) = 0.4750일 때, <em>a</em>의 값은?", ans: "1.96", hint: "표에서 0.4750에 해당하는 z값을 찾으세요.", sol: "표에서 p = 0.4750 → <b>a = 1.96</b>" },
  { q: "p(0 ≤ Z ≤ <em>a</em>) = 0.4772일 때, <em>a</em>의 값은?", ans: "2.00", hint: "표에서 0.4772에 해당하는 z값을 찾으세요.", sol: "표에서 p = 0.4772 → <b>a = 2.00</b>" },
  { q: "p(−<em>a</em> ≤ Z ≤ <em>a</em>) = 0.6826일 때, <em>a</em>의 값은?", ans: "1.00", hint: "p(−a≤Z≤a) = 2×p(0≤Z≤a). 먼저 0.6826÷2를 구하세요.", sol: "p(0≤Z≤a) = 0.6826÷2 = 0.3413 → 표에서 <b>a = 1.00</b>" },
  { q: "p(−<em>a</em> ≤ Z ≤ <em>a</em>) = 0.9500일 때, <em>a</em>의 값은?", ans: "1.96", hint: "p(−a≤Z≤a) = 2×p(0≤Z≤a). 먼저 0.9500÷2를 구하세요.", sol: "p(0≤Z≤a) = 0.9500÷2 = 0.4750 → 표에서 <b>a = 1.96</b>" },
  { q: "p(−<em>a</em> ≤ Z ≤ <em>a</em>) = 0.9544일 때, <em>a</em>의 값은?", ans: "2.00", hint: "p(−a≤Z≤a) = 2×p(0≤Z≤a). 먼저 0.9544÷2를 구하세요.", sol: "p(0≤Z≤a) = 0.9544÷2 = 0.4772 → 표에서 <b>a = 2.00</b>" },
  { q: "p(Z ≥ <em>a</em>) = 0.0250일 때, <em>a</em>의 값은? (단, a > 0)", ans: "1.96", hint: "p(Z≥a) = 0.5 − p(0≤Z≤a). p(0≤Z≤a) = 0.5 − 0.0250.", sol: "p(0≤Z≤a) = 0.5−0.0250 = 0.4750 → 표에서 <b>a = 1.96</b>" },
  { q: "p(Z ≥ <em>a</em>) = 0.0228일 때, <em>a</em>의 값은? (단, a > 0)", ans: "2.00", hint: "p(Z≥a) = 0.5 − p(0≤Z≤a). p(0≤Z≤a) = 0.5 − 0.0228.", sol: "p(0≤Z≤a) = 0.5−0.0228 = 0.4772 → 표에서 <b>a = 2.00</b>" },
  { q: "p(Z ≥ <em>a</em>) = 0.0668일 때, <em>a</em>의 값은? (단, a > 0)", ans: "1.50", hint: "p(Z≥a) = 0.5 − p(0≤Z≤a). p(0≤Z≤a) = 0.5 − 0.0668.", sol: "p(0≤Z≤a) = 0.5−0.0668 = 0.4332 → 표에서 <b>a = 1.50</b>" },
  { q: "p(Z ≤ <em>a</em>) = 0.9332일 때, <em>a</em>의 값은?", ans: "1.50", hint: "p(Z≤a) = 0.5 + p(0≤Z≤a). p(0≤Z≤a) = 0.9332 − 0.5.", sol: "p(0≤Z≤a) = 0.9332−0.5 = 0.4332 → 표에서 <b>a = 1.50</b>" },
  { q: "p(Z ≤ <em>a</em>) = 0.9750일 때, <em>a</em>의 값은?", ans: "1.96", hint: "p(Z≤a) = 0.5 + p(0≤Z≤a). p(0≤Z≤a) = 0.9750 − 0.5.", sol: "p(0≤Z≤a) = 0.9750−0.5 = 0.4750 → 표에서 <b>a = 1.96</b>" },
  { q: "p(Z ≤ <em>a</em>) = 0.9772일 때, <em>a</em>의 값은?", ans: "2.00", hint: "p(Z≤a) = 0.5 + p(0≤Z≤a). p(0≤Z≤a) = 0.9772 − 0.5.", sol: "p(0≤Z≤a) = 0.9772−0.5 = 0.4772 → 표에서 <b>a = 2.00</b>" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "harder_kind",
    prompt:
      "Z→확률, 확률→Z 두 유형 중 어떤 쪽이 더 어려웠나요? 그 이유를 풀이 경험을 근거로 설명해 보세요.",
    kind: "text",
    placeholder: "예: 확률 → Z 가 더 어려웠다. 주어진 확률을 표의 어느 영역에 대응시킬지 한 번 더 생각해야 해서 단계가 많아진다.",
  },
  {
    id: "symmetry_strategy",
    prompt:
      "표준정규분포의 대칭성(−z ↔ z)을 이용해 확률을 빠르게 구한 예 하나를 들고, 어떤 공식이 어떻게 쓰였는지 정리해 보세요.",
    kind: "text",
    placeholder: "예: p(−1.96 ≤ Z ≤ 1.96) = 2 × p(0 ≤ Z ≤ 1.96) = 2 × 0.4750 = 0.95. 양쪽이 대칭이라 한쪽 값만 알면 두 배로 바로 구한다.",
  },
];

// ─── 메인 ─────────────────────────────────────────────────
type PageKey = "table" | "z2p" | "p2z";

export default function StdNormalTableQuiz() {
  const [page, setPage] = useState<PageKey>("table");

  // 표 강조용 z (소수 둘째 자리). null = 강조 없음.
  const [searchZ, setSearchZ] = useState<number | null>(null);

  // 퀴즈 상태(컴포넌트 내부에서 관리하지만 페이지 전환 시 잃지 않도록 부모 보관)
  const [z2pState, setZ2pState] = useState(() => initQuiz(Z2P_POOL));
  const [p2zState, setP2zState] = useState(() => initQuiz(P2Z_POOL));

  function reloadZ2P() {
    setZ2pState(initQuiz(Z2P_POOL));
  }
  function reloadP2Z() {
    setP2zState(initQuiz(P2Z_POOL));
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">📊 표준정규분포표 활용 연습</h3>
        <p className="mt-2 leading-7 text-slate-300">
          표준정규분포 Z ~ N(0, 1)에서 <b className="text-sky-300">p(0 ≤ Z ≤ z)</b>를 담은 표를 활용해
          다양한 범위의 <b className="text-sky-300">확률 계산</b>과{" "}
          <b className="text-sky-300">역방향 추론(확률 → Z값)</b>을 직접 연습합니다.
        </p>
      </div>

      {/* 페이지 탭 */}
      <div className="mt-5 flex flex-wrap gap-2">
        <PageTab active={page === "table"} onClick={() => setPage("table")}>📋 표준정규분포표</PageTab>
        <PageTab active={page === "z2p"} onClick={() => setPage("z2p")}>🔢 Z → 확률 퀴즈</PageTab>
        <PageTab active={page === "p2z"} onClick={() => setPage("p2z")}>🎯 확률 → Z값 퀴즈</PageTab>
      </div>

      {/* 동시 마운트 — 페이지 전환 시 표 강조·퀴즈 진행 보존 */}
      <div className={page === "table" ? "mt-4" : "mt-4 hidden"}>
        <TablePage searchZ={searchZ} setSearchZ={setSearchZ} />
      </div>
      <div className={page === "z2p" ? "mt-4" : "mt-4 hidden"}>
        <QuizPage
          title="🔢 Z → 확률 퀴즈"
          pfx="z2p"
          state={z2pState}
          setState={setZ2pState}
          reload={reloadZ2P}
        />
      </div>
      <div className={page === "p2z" ? "mt-4" : "mt-4 hidden"}>
        <QuizPage
          title="🎯 확률 → Z값 퀴즈"
          pfx="p2z"
          state={p2zState}
          setState={setP2zState}
          reload={reloadP2Z}
        />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function PageTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl border border-sky-400/45 bg-sky-400/15 px-4 py-2 text-sm font-bold text-sky-200"
          : "rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-400 hover:bg-white/10"
      }
    >
      {children}
    </button>
  );
}

// ═════════════════════════════════════════════════════════
// 표준정규분포표 페이지
// ═════════════════════════════════════════════════════════

function TablePage({
  searchZ, setSearchZ,
}: { searchZ: number | null; setSearchZ: (v: number | null) => void }) {
  const [input, setInput] = useState("");

  function onSearch(v: string) {
    setInput(v);
    const n = parseFloat(v);
    if (!Number.isFinite(n) || n < 0 || n > 3.09) {
      setSearchZ(null);
      return;
    }
    setSearchZ(Math.round(n * 100) / 100);
  }

  function onChip(z: number) {
    setInput(z.toFixed(2));
    setSearchZ(z);
  }

  function onCellClick(z: number) {
    setInput(z.toFixed(2));
    setSearchZ(z);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-sky-300">
          📊 표준정규분포표{" "}
          <span className="ml-2 text-[11px] font-normal text-slate-500">p(0 ≤ Z ≤ z)</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">
          z값을 입력하거나 표의 셀을 클릭하면 해당 확률을 바로 확인할 수 있어요.
        </p>
        <SearchRow input={input} onChange={onSearch} searchZ={searchZ} />
        <NormalTable highlight={searchZ} onCellClick={onCellClick} interactive />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-sky-300">⭐ 자주 사용하는 z값</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {KEY_Z.map((k) => (
            <button
              key={k.z}
              type="button"
              onClick={() => onChip(k.z)}
              className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-xs text-slate-400 transition hover:border-sky-400/35 hover:bg-sky-400/15 hover:text-sky-200"
            >
              {k.lbl} : p = {f4(p0z(k.z))}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-sky-300">📐 확률 계산 공식 정리</p>
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-8">
          <Formula em="p(0 ≤ Z ≤ z)" tail="→ 표에서 직접 읽기" />
          <Formula em="p(Z ≤ z)" tail="= 0.5 + p(0 ≤ Z ≤ z)" />
          <Formula em="p(Z ≥ z)" tail="= 0.5 − p(0 ≤ Z ≤ z)  (z > 0)" />
          <Formula em="p(−z ≤ Z ≤ 0)" tail="= p(0 ≤ Z ≤ z)  (대칭성)" />
          <Formula em="p(−z ≤ Z ≤ z)" tail="= 2 × p(0 ≤ Z ≤ z)" />
          <Formula em="p(a ≤ Z ≤ b)" tail="= p(0 ≤ Z ≤ b) − p(0 ≤ Z ≤ a)  (0 ≤ a ≤ b)" />
          <Formula em="p(−a ≤ Z ≤ b)" tail="= p(0 ≤ Z ≤ a) + p(0 ≤ Z ≤ b)  (a, b > 0)" />
        </div>
      </div>
    </div>
  );
}

function SearchRow({
  input, onChange, searchZ,
}: { input: string; onChange: (v: string) => void; searchZ: number | null }) {
  const id = useId();
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <label htmlFor={id} className="sr-only">z 값 입력</label>
      <input
        id={id}
        type="number"
        placeholder="z 입력 (예: 1.96)"
        step={0.01}
        min={0}
        max={3.09}
        value={input}
        onChange={(e) => onChange(e.target.value)}
        className="w-44 rounded-lg border border-white/15 bg-white/[0.07] px-3 py-1.5 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
      />
      {searchZ !== null ? (
        <span className="rounded-full border border-sky-400/30 bg-sky-400/15 px-3 py-1 text-sm font-bold text-sky-200">
          p(0 ≤ Z ≤ {searchZ.toFixed(2)}) = {f4(p0z(searchZ))}
        </span>
      ) : null}
    </div>
  );
}

function Formula({ em, tail }: { em: string; tail: string }) {
  return (
    <p className="text-slate-300">
      📌 <span className="font-bold text-sky-300">{em}</span>{" "}
      <span className="text-slate-400">{tail}</span>
    </p>
  );
}

function NormalTable({
  highlight, onCellClick, interactive,
}: {
  highlight: number | null;
  onCellClick?: (z: number) => void;
  interactive?: boolean;
}) {
  // 0.0 ~ 3.0 행, 0.00 ~ 0.09 열
  const rows = useMemo(() => Array.from({ length: 31 }, (_, r) => r), []);
  const cols = useMemo(() => Array.from({ length: 10 }, (_, c) => c), []);

  // 강조 행/열 인덱스
  let hr = -1, hc = -1;
  if (highlight !== null) {
    const r = Math.floor(highlight * 10 + 1e-9);
    const c = Math.round((highlight - r / 10) * 100 + 1e-9);
    if (r >= 0 && r <= 30 && c >= 0 && c <= 9) { hr = r; hc = c; }
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40">
      <table className="min-w-[620px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 border border-white/10 bg-sky-400/20 px-2 py-1.5 text-sky-200">z</th>
            {cols.map((c) => (
              <th key={c} className="sticky top-0 z-10 border border-white/10 bg-sky-400/20 px-2 py-1.5 text-sky-200">
                .0{c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <td className={`sticky left-0 z-10 border border-white/10 px-2 py-1 text-center font-bold ${
                r === hr ? "bg-sky-400/25 text-sky-100" : "bg-sky-400/12 text-sky-300"
              }`}>
                {(r / 10).toFixed(1)}
              </td>
              {cols.map((c) => {
                const z = r / 10 + c / 100;
                const isHere = r === hr && c === hc;
                const isInRow = r === hr;
                const isInCol = c === hc;
                const cls = isHere
                  ? "bg-emerald-500/50 text-white font-bold"
                  : isInRow || isInCol
                  ? "bg-sky-400/10 text-sky-100"
                  : "text-slate-300";
                const interactiveCls = interactive ? "cursor-pointer hover:bg-sky-400/30 hover:text-sky-100" : "";
                return (
                  <td
                    key={c}
                    className={`border border-white/10 px-2 py-1 text-center font-mono ${cls} ${interactiveCls}`}
                    onClick={interactive && onCellClick ? () => onCellClick(Math.round(z * 100) / 100) : undefined}
                  >
                    {f4(p0z(z))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 퀴즈 페이지
// ═════════════════════════════════════════════════════════

type QuizState = {
  problems: Prob[];
  answers: string[];        // 사용자 입력값(채점 후 잠금)
  status: ("" | "ok" | "ng")[];
  hintsOpen: boolean[];
  tried: number;
  correct: number;
};

function initQuiz(pool: Prob[]): QuizState {
  const problems = shuffle(pool).slice(0, 5);
  return {
    problems,
    answers: Array(5).fill(""),
    status: Array(5).fill(""),
    hintsOpen: Array(5).fill(false),
    tried: 0,
    correct: 0,
  };
}

function QuizPage({
  title, pfx, state, setState, reload,
}: {
  title: string;
  pfx: "z2p" | "p2z";
  state: QuizState;
  setState: (s: QuizState) => void;
  reload: () => void;
}) {
  // 표 참고 펼침 토글
  const [refOpen, setRefOpen] = useState(false);

  function setAnswer(i: number, v: string) {
    if (state.status[i] !== "") return;
    const next = [...state.answers];
    next[i] = v;
    setState({ ...state, answers: next });
  }

  function toggleHint(i: number) {
    const next = [...state.hintsOpen];
    next[i] = !next[i];
    setState({ ...state, hintsOpen: next });
  }

  function check(i: number) {
    if (state.status[i] !== "") return;
    const prob = state.problems[i];
    const user = state.answers[i].trim().replace(/,/g, "");
    if (!user) return;
    const ok = Math.abs(parseFloat(user) - parseFloat(prob.ans)) < 1e-9;
    const newStatus = [...state.status];
    newStatus[i] = ok ? "ok" : "ng";
    setState({
      ...state,
      status: newStatus,
      tried: state.tried + 1,
      correct: state.correct + (ok ? 1 : 0),
    });
  }

  const finalBanner = useMemo(() => {
    if (state.tried < 5) return null;
    const msgs = [
      "🎉 완벽! 5문제 전부 정답!",
      "👏 훌륭해요! 4개 정답!",
      "📚 절반 이상! 다시 도전해보세요.",
      "📖 조금 더 연습이 필요해요.",
      "📖 다시 공식을 살펴봐요!",
    ];
    const idx = 5 - state.correct;
    return idx === 0 ? msgs[0] : idx === 1 ? msgs[1] : idx <= 2 ? msgs[2] : idx <= 3 ? msgs[3] : msgs[4];
  }, [state.tried, state.correct]);

  return (
    <div className="space-y-3">
      {/* 표 참고 펼침 */}
      <div className="overflow-hidden rounded-2xl border border-sky-400/20">
        <button
          type="button"
          onClick={() => setRefOpen((v) => !v)}
          className="flex w-full items-center gap-2 bg-sky-400/10 px-4 py-2.5 text-left text-sm font-bold text-sky-200"
        >
          <span className={`inline-block text-xs transition ${refOpen ? "rotate-90" : ""}`}>▶</span>
          📋 표준정규분포표 참고 (클릭하여 열기/닫기)
        </button>
        {refOpen ? (
          <div className="bg-white/[0.03] p-3">
            <NormalTable highlight={null} interactive={false} />
          </div>
        ) : null}
      </div>

      {/* 점수 헤더 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <p className="text-base font-bold text-slate-100">{title}</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black leading-none text-emerald-300">{state.correct}</p>
              <span className="pb-0.5 text-xl text-slate-600">/</span>
              <p className="text-3xl font-black leading-none text-sky-300">{state.tried}</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">정답 / 시도</span>
            <div className="ml-2 flex items-center gap-1.5">
              {state.status.map((s, i) => (
                <span
                  key={i}
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    s === "ok" ? "bg-emerald-400" : s === "ng" ? "bg-rose-400" : "bg-white/15"
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={reload}
            className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            🔀 새 문제 세트
          </button>
        </div>
      </div>

      {/* 안내 */}
      <p className="text-xs text-slate-500">※ 답은 소수점 포함하여 입력하세요. 예) 0.3413 또는 1.96</p>

      {/* 문제 카드 */}
      {state.problems.map((p, i) => (
        <QuizCard
          key={i}
          index={i}
          prob={p}
          userValue={state.answers[i]}
          status={state.status[i]}
          hintOpen={state.hintsOpen[i]}
          onChange={(v) => setAnswer(i, v)}
          onCheck={() => check(i)}
          onToggleHint={() => toggleHint(i)}
          pfx={pfx}
        />
      ))}

      {finalBanner ? (
        <div className="animate-[pulseR_0.4s_ease] rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-center text-base font-bold text-amber-200">
          {finalBanner}
        </div>
      ) : null}
    </div>
  );
}

function QuizCard({
  index, prob, userValue, status, hintOpen, onChange, onCheck, onToggleHint, pfx,
}: {
  index: number;
  prob: Prob;
  userValue: string;
  status: "" | "ok" | "ng";
  hintOpen: boolean;
  onChange: (v: string) => void;
  onCheck: () => void;
  onToggleHint: () => void;
  pfx: "z2p" | "p2z";
}) {
  const id = useId();
  const locked = status !== "";
  const inputCls =
    status === "ok"
      ? "border-emerald-500/60 bg-emerald-500/10"
      : status === "ng"
      ? "border-rose-500/50 bg-rose-500/10"
      : "border-white/15 bg-white/[0.07]";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">문제 {index + 1}</p>
      <p
        className="mt-1.5 text-lg font-bold leading-7 text-amber-300"
        dangerouslySetInnerHTML={{ __html: prob.q + " = ?" }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="sr-only">답</label>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={userValue}
          disabled={locked}
          placeholder="답 입력"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onCheck(); }}
          className={`w-40 rounded-lg border-2 px-3 py-1.5 font-mono text-sm text-slate-100 outline-none transition disabled:cursor-default focus:border-sky-400 focus-visible:ring-2 focus-visible:ring-cyan-300/40 ${inputCls}`}
        />
        <button
          type="button"
          onClick={onCheck}
          disabled={locked}
          className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-3 py-1.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-default disabled:opacity-50"
        >
          채점
        </button>
        <button
          type="button"
          onClick={onToggleHint}
          className="rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-sm font-bold text-amber-300 hover:bg-amber-500/25"
        >
          💡 힌트
        </button>
        {pfx === "p2z" ? <span className="ml-2 text-xs text-slate-500">a 값 (예: 1.96)</span> : null}
      </div>

      {hintOpen ? (
        <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {prob.hint}
        </div>
      ) : null}

      {status === "ok" ? (
        <div
          className="mt-3 animate-[pulseR_0.4s_ease] rounded-lg border border-emerald-500/30 bg-emerald-500/12 px-3 py-2 text-sm text-emerald-200"
          dangerouslySetInnerHTML={{ __html: `✅ 정답! &nbsp; ${prob.sol}` }}
        />
      ) : null}
      {status === "ng" ? (
        <div
          className="mt-3 animate-[pulseR_0.4s_ease] rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
          dangerouslySetInnerHTML={{ __html: `❌ 틀렸어요. 정답: <b>${prob.ans}</b><br/>${prob.sol}` }}
        />
      ) : null}
    </div>
  );
}
