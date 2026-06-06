"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import { supabase } from "@/lib/supabase/client";
import { getCurrentSchoolYear } from "@/lib/settings/schoolYear";

/* ──────────────────────────────────────────────────────────────
   🎂 생일 역설 탐구  (3 tabs)
   1) 원리 이해 — 365일 원형 시뮬 + 수식 빈칸 + n-P(A) 곡선
   2) 예시 분석 — 34명 생일 표 + MCQ 5
   3) 우리 반 탐구 — Supabase RPC(get_class_birthday_stats) 연동, 학생/교사/관리자 phase 분기
   ────────────────────────────────────────────────────────────── */

// ============================================================
// 공통 유틸
// ============================================================

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function dayOfYear(m: number, d: number): number {
  let t = d;
  for (let i = 0; i < m - 1; i++) t += DAYS_IN_MONTH[i];
  return t;
}
type BD = { m: number; d: number; doy: number; str: string };
function randomBirthday(): BD {
  const m = Math.floor(Math.random() * 12) + 1;
  const d = Math.floor(Math.random() * DAYS_IN_MONTH[m - 1]) + 1;
  return {
    m,
    d,
    doy: dayOfYear(m, d),
    str: `${m.toString().padStart(2, "0")}.${d.toString().padStart(2, "0")}`,
  };
}
function calcP(n: number): number {
  if (n <= 1) return 0;
  if (n >= 366) return 1;
  let lp = 0;
  for (let i = 0; i < n; i++) lp += Math.log((365 - i) / 365);
  return 1 - Math.exp(lp);
}

// ============================================================
// 탭 1 — 원리 이해
// ============================================================

type Person = BD & { id: number; color: string; isMatch: boolean };

const COLORS = [
  "#22d3ee", "#34d399", "#a78bfa", "#fb923c", "#f472b6", "#facc15",
  "#38bdf8", "#4ade80", "#c084fc", "#fd8a5e", "#fbcfe8", "#fef08a",
  "#7dd3fc", "#6ee7b7", "#d8b4fe", "#fdba74", "#fcd34d", "#a5f3fc",
];
const MAX_PERSONS = 80;

function CircleSim() {
  const [people, setPeople] = useState<Person[]>([]);
  const [matches, setMatches] = useState<[Person, Person][]>([]);
  const [auto, setAuto] = useState(false);
  const [speed, setSpeed] = useState(2); // 1~5, 클수록 빠름

  const p = calcP(people.length);
  const pTone = p >= 0.5 ? "text-red-300" : p >= 0.25 ? "text-amber-300" : "text-emerald-300";
  const pBarColor = p >= 0.5 ? "#f87171" : p >= 0.25 ? "#fbbf24" : "#34d399";

  const addOne = useCallback(() => {
    setPeople((prev) => {
      if (prev.length >= MAX_PERSONS) return prev;
      const id = prev.length;
      const bd = randomBirthday();
      const next: Person = { ...bd, id, color: COLORS[id % COLORS.length], isMatch: false };
      let found: Person | null = null;
      const updated = prev.map((q) => {
        if (q.doy === bd.doy) {
          found = q;
          return { ...q, isMatch: true };
        }
        return q;
      });
      if (found) {
        next.isMatch = true;
        setMatches((ms) => [...ms, [found as Person, next]]);
      }
      return [...updated, next];
    });
  }, []);

  function reset() {
    setPeople([]);
    setMatches([]);
    setAuto(false);
  }

  // 자동 실행: 매 추가 후 다음 스케줄. 한계 도달 시 새 스케줄을 잡지 않음(자동 정지).
  useEffect(() => {
    if (!auto || people.length >= MAX_PERSONS) return;
    const ms = Math.max(80, 700 - speed * 130); // speed 1=570 / 5=50
    const t = window.setTimeout(addOne, ms);
    return () => window.clearTimeout(t);
  }, [auto, speed, people.length, addOne]);

  // SVG 좌표 (viewBox 240×240, 자동 반응형)
  const VB = 240;
  const CX = VB / 2;
  const CY = VB / 2;
  const R = 88;

  function a2xy(doy: number) {
    const a = (doy / 365) * 2 * Math.PI - Math.PI / 2;
    return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
  }

  // 매칭 날짜 텍스트 (중복 제거)
  const matchDates = useMemo(() => {
    const set = new Set<string>();
    matches.forEach(([a]) => set.add(a.str));
    return Array.from(set);
  }, [matches]);

  return (
    <section className="rounded-xl border border-amber-400/25 bg-white/[0.04] p-4">
      <h4 className="flex items-center gap-2 text-sm font-bold text-amber-300">
        🎭 시뮬레이션 — 한 명씩 방에 입장시켜 보세요
      </h4>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        버튼을 누르면 한 명씩 무작위 생일로 방에 들어와요. 같은 생일인 친구가 언제 처음 나타날지 예상해 보세요!
      </p>

      <div className="mt-3 grid gap-4 md:grid-cols-[260px_1fr]">
        {/* 원형 차트 */}
        <div className="mx-auto w-full max-w-[280px]">
          <svg viewBox={`0 0 ${VB} ${VB}`} className="block w-full rounded-lg bg-slate-950">
            {/* 외부 링 */}
            <circle cx={CX} cy={CY} r={R + 16} fill="#020617" />
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth={1.5} />
            {/* 월 눈금 */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
              const x1 = CX + (R - 4) * Math.cos(a);
              const y1 = CY + (R - 4) * Math.sin(a);
              const x2 = CX + (R + 6) * Math.cos(a);
              const y2 = CY + (R + 6) * Math.sin(a);
              const lr = R + 14;
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(100,116,139,0.75)" strokeWidth={1.2} />
                  <text
                    x={CX + lr * Math.cos(a)}
                    y={CY + lr * Math.sin(a)}
                    fontSize={7}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(100,116,139,0.95)"
                  >
                    {i + 1}월
                  </text>
                </g>
              );
            })}
            {/* 매치 선 */}
            {matches.map(([a, b], i) => {
              const p1 = a2xy(a.doy);
              const p2 = a2xy(b.doy);
              return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(239,68,68,0.55)" strokeWidth={1.4} />;
            })}
            {/* 점 — 가장 마지막에 추가된 점에만 pop 애니메이션(키는 per.id 라 새 마운트 시 한 번 재생) */}
            {people.map((per, idx) => {
              const pos = a2xy(per.doy);
              const isNewest = idx === people.length - 1;
              return (
                <g key={per.id} className={isNewest ? "animate-[pop_0.4s_ease-out]" : ""}>
                  {per.isMatch ? (
                    <circle cx={pos.x} cy={pos.y} r={8} fill="none" stroke="rgba(239,68,68,0.55)" strokeWidth={1.4} />
                  ) : null}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={per.isMatch ? 5.2 : 3.4}
                    fill={per.isMatch ? "#ef4444" : per.color}
                  />
                </g>
              );
            })}
            {/* 중앙 인원수 */}
            <text x={CX} y={CY - 4} fontSize={11} fontWeight={700} textAnchor="middle" fill="#94a3b8">
              {people.length}명
            </text>
            <text x={CX} y={CY + 9} fontSize={6.5} textAnchor="middle" fill="#64748b">
              of 365일
            </text>
          </svg>
        </div>

        {/* 컨트롤 + 상태 */}
        <div className="space-y-2">
          <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-center">
            <p className="text-[10px] text-slate-400">P(A) = P(같은 생일 쌍 ≥ 1쌍)</p>
            <p className={`mt-0.5 font-mono text-3xl font-bold transition-colors ${pTone}`}>
              {p.toFixed(4)}
            </p>
            <svg
              viewBox="0 0 100 8"
              preserveAspectRatio="none"
              className="mt-1.5 block h-2 w-full overflow-hidden rounded-full bg-white/10"
              aria-hidden="true"
            >
              <rect
                x={0} y={0}
                width={Math.min(p * 100, 100)}
                height={8}
                fill={pBarColor}
                className="transition-all duration-300"
              />
            </svg>
            <div className="mt-1 flex justify-between text-[9px] text-slate-500">
              <span>0</span><span>0.5</span><span>1</span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400">👤 {people.length}명 입장 (최대 {MAX_PERSONS}명)</div>

          {/* 매치 박스 — 고정 높이로 흔들림 방지 */}
          <div className="min-h-[36px]">
            {matchDates.length > 0 ? (
              <div className="rounded-lg border border-red-400/35 bg-red-400/10 px-3 py-1.5 text-center text-xs text-red-200">
                🎉 같은 생일 발견! <b>{matchDates.join(", ")}</b>
              </div>
            ) : (
              <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5 text-center text-[11px] text-slate-500">
                아직 같은 생일 쌍이 없어요
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={addOne}
              disabled={people.length >= MAX_PERSONS}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              🚶 한 명 더!
            </button>
            <button
              type="button"
              onClick={() => setAuto((a) => !a)}
              disabled={people.length >= MAX_PERSONS}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition disabled:opacity-40 ${
                auto
                  ? "bg-red-500 text-white hover:brightness-110"
                  : "border border-cyan-400/50 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
              }`}
            >
              {auto ? "⏸ 정지" : "▶ 자동 입장"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="bp-speed" className="text-[11px] text-slate-400">속도</label>
            <input
              id="bp-speed"
              type="range" min={1} max={5} value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              aria-label="자동 입장 속도"
              className="flex-1 accent-cyan-400"
            />
            <span className="w-4 text-right font-mono text-xs text-cyan-300">{speed}</span>
          </div>

          <button
            type="button"
            onClick={reset}
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          >
            ↺ 초기화
          </button>
        </div>
      </div>

      {/* 생일 태그 리스트 */}
      {people.length > 0 ? (
        <div className="mt-3 max-h-[96px] overflow-y-auto rounded-lg border border-white/8 bg-black/20 p-2 leading-6">
          {people.map((per) => (
            <span
              key={per.id}
              title={`${per.id + 1}번째`}
              className={`m-0.5 inline-block rounded px-1.5 py-px font-mono text-[11px] ${
                per.isMatch
                  ? "border border-red-400/50 bg-red-400/20 font-bold text-red-200"
                  : "bg-white/8 text-slate-300"
              }`}
            >
              {per.str}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

// ─── Section B: 수식 빈칸 ───

function FormulaDerivation() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  function reveal(id: string) {
    setRevealed((p) => ({ ...p, [id]: true }));
  }
  const BLANKS = [
    { id: "b1", n: 2, hide: "?", show: "364", desc: "1번째와 다른 생일", denom: "365" },
    { id: "b2", n: 3, hide: "?", show: "363", desc: "앞 두 명과 다른 생일", denom: "365" },
    { id: "b3", n: -1, hide: "?", show: "365−n+1", desc: "앞 n−1명과 다른 생일", denom: "365" },
  ];

  return (
    <section className="rounded-xl border border-amber-400/25 bg-white/[0.04] p-4">
      <h4 className="flex items-center gap-2 text-sm font-bold text-amber-300">
        📐 수식 유도 — 빈칸을 눌러 확인해 보세요
      </h4>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        <b className="text-amber-200">사건 A</b>: 적어도 두 명의 생일이 같은 사건<br />
        <b className="text-violet-300">사건 Aᶜ</b>: 모든 n명의 생일이 다른 사건 (여사건)<br />
        P(A) = 1 − P(Aᶜ) 이므로, P(Aᶜ)를 먼저 구해 봅시다.
      </p>

      <div className="mt-3 space-y-1.5">
        <StepCard n="1" desc="어떤 생일이든 OK">
          <span className="font-mono font-bold text-amber-200">365</span> / 365 = 1
        </StepCard>
        {BLANKS.map((b) => (
          <StepCard key={b.id} n={b.n === -1 ? "n" : String(b.n)} desc={`${b.n === -1 ? "n" : b.n}번째 사람: ${b.desc}`}>
            <BlankBtn isOpen={!!revealed[b.id]} hidden={b.hide} shown={b.show} onClick={() => reveal(b.id)} />
            <span className="text-slate-400"> / {b.denom}</span>
          </StepCard>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-amber-400/30 bg-black/30 p-3 text-center">
        <p className="font-mono text-xs leading-7 text-amber-100">
          P(A<sup>c</sup>) = (365 × 364 × 363 × ··· × (365−n+1)) / 365<sup>n</sup>
        </p>
        <p className="font-mono text-xs leading-7 text-amber-100">
          = <sub>365</sub>P<sub>n</sub> / 365<sup>n</sup>
        </p>
        <p className="mt-1 text-sm font-bold text-emerald-300">
          ∴ P(A) = 1 − P(A<sup>c</sup>) = 1 − <sub>365</sub>P<sub>n</sub> / 365<sup>n</sup>
        </p>
      </div>
    </section>
  );
}

function StepCard({ n, desc, children }: { n: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/15 text-xs font-bold text-amber-300">
        {n}
      </div>
      <div className="flex-1 text-xs leading-6 text-slate-300">{desc} → {children}</div>
    </div>
  );
}

function BlankBtn({ isOpen, hidden, shown, onClick }: { isOpen: boolean; hidden: string; shown: string; onClick: () => void }) {
  if (isOpen) {
    return (
      <span className="rounded border-2 border-emerald-400/50 bg-emerald-400/15 px-2 py-0.5 font-mono text-sm font-bold text-emerald-300">
        {shown}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border-2 border-dashed border-indigo-400/55 bg-indigo-400/10 px-3 py-0.5 font-mono text-sm font-bold text-indigo-300 transition hover:border-indigo-400 hover:bg-indigo-400/20"
    >
      {hidden}
    </button>
  );
}

// ─── Section C: 인원-확률 곡선 ───

function ProbabilityGraph() {
  const [n, setN] = useState(20);
  const p = calcP(n);
  const pc = 1 - p;
  const pTone = p >= 0.5 ? "text-red-300" : p >= 0.25 ? "text-amber-300" : "text-emerald-300";

  // 곡선 path
  const W = 320; // viewBox
  const H = 160;
  const PL = 32, PR = 8, PT = 10, PB = 22;
  const gW = W - PL - PR;
  const gH = H - PT - PB;

  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 2; i <= 80; i++) {
      const px = PL + ((i - 2) / 78) * gW;
      const py = PT + gH * (1 - calcP(i));
      pts.push(`${pts.length === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`);
    }
    return pts.join(" ");
  }, [gW, gH]);

  const selX = PL + ((Math.max(2, Math.min(80, n)) - 2) / 78) * gW;
  const selY = PT + gH * (1 - p);
  const x23 = PL + ((23 - 2) / 78) * gW;
  const y5 = PT + gH * 0.5;

  return (
    <section className="rounded-xl border border-amber-400/25 bg-white/[0.04] p-4">
      <h4 className="flex items-center gap-2 text-sm font-bold text-amber-300">
        📊 인원 수에 따른 확률 탐색
      </h4>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        슬라이더를 움직여 n명일 때 P(A)가 얼마인지 확인해 보세요. P(A) {">"} 0.5가 되는 최솟값은?
      </p>

      <div className="mt-3 flex items-center gap-2">
        <label htmlFor="bp-n" className="text-xs text-slate-400">n =</label>
        <input
          id="bp-n"
          type="range" min={2} max={80} value={n}
          onChange={(e) => setN(Number(e.target.value))}
          aria-label="사람 수 n"
          className="flex-1 accent-amber-400"
        />
        <span className="w-10 text-right font-mono text-sm font-bold text-amber-300">{n}</span>
        <span className="text-xs text-slate-400">명</span>
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <div className="min-w-[100px] rounded-lg border border-white/10 bg-black/25 px-4 py-1.5 text-center">
          <div className={`font-mono text-xl font-bold tabular-nums ${pTone}`}>{p.toFixed(4)}</div>
          <div className="text-[10px] text-slate-400">P(A) 값</div>
        </div>
        <div className="min-w-[100px] rounded-lg border border-white/10 bg-black/25 px-4 py-1.5 text-center">
          <div className="font-mono text-xl font-bold tabular-nums text-blue-300">{pc.toFixed(4)}</div>
          <div className="text-[10px] text-slate-400">P(Aᶜ) 값</div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block w-full rounded-lg bg-slate-950">
        {/* 축 */}
        <line x1={PL} y1={PT} x2={PL} y2={PT + gH} stroke="rgba(100,116,139,0.45)" />
        <line x1={PL} y1={PT + gH} x2={PL + gW} y2={PT + gH} stroke="rgba(100,116,139,0.45)" />
        {/* Y 눈금 */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => {
          const y = PT + gH * (1 - v);
          return (
            <g key={v}>
              <line x1={PL} y1={y} x2={PL + gW} y2={y} stroke="rgba(100,116,139,0.15)" />
              <text x={PL - 3} y={y} fontSize={8} textAnchor="end" dominantBaseline="middle" fill="#64748b">
                {v.toFixed(2)}
              </text>
            </g>
          );
        })}
        {/* X 눈금 */}
        {[0, 20, 40, 60, 80].map((v) => {
          const x = PL + (v / 80) * gW;
          return (
            <text key={v} x={x} y={PT + gH + 11} fontSize={8} textAnchor="middle" fill="#64748b">
              {v}
            </text>
          );
        })}
        {/* 0.5 점선 */}
        <line x1={PL} y1={y5} x2={PL + gW} y2={y5} stroke="rgba(234,179,8,0.5)" strokeDasharray="4 4" />
        {/* n=23 점선 */}
        <line x1={x23} y1={PT} x2={x23} y2={PT + gH} stroke="rgba(234,179,8,0.38)" strokeDasharray="4 4" />
        <text x={x23} y={PT + 2} fontSize={7.5} textAnchor="middle" fill="#fbbf24" dominantBaseline="hanging">
          23
        </text>
        {/* 곡선 (그라데이션) */}
        <defs>
          <linearGradient id="bpCurve" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="33%" stopColor="#f59e0b" />
            <stop offset="65%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <path d={curve} fill="none" stroke="url(#bpCurve)" strokeWidth={2} />
        {/* 선택 점 */}
        <circle cx={selX} cy={selY} r={5} fill="white" stroke="#fbbf24" strokeWidth={2} />
      </svg>

      <p className="mt-2 text-center text-xs text-slate-400">
        {p >= 0.5 ? (
          <>
            🎉 n = <span className="font-bold text-amber-300">{n}</span>명일 때 P(A) ≥ 0.5! 같은 생일 쌍이 있을 확률이 더 높아요.
          </>
        ) : (
          <>
            n = <span className="font-bold text-amber-300">23</span>명일 때 처음으로 P(A) {">"} 0.5 — 이것이 바로 <b>생일 역설</b>!
          </>
        )}
      </p>
    </section>
  );
}

// ============================================================
// 탭 2 — 예시 분석 (34명 표 + MCQ 5)
// ============================================================

type Cell = { v: string; tone?: "or" | "gn" | "yw"; empty?: boolean };
const TABLE_ROWS: Cell[][] = [
  [{ v: "12.12" }, { v: "10.11" }, { v: "08.14", tone: "or" }, { v: "04.04", tone: "gn" }],
  [{ v: "12.23" }, { v: "06.25" }, { v: "11.16" }, { v: "11.14" }],
  [{ v: "02.14", tone: "yw" }, { v: "08.30" }, { v: "07.09" }, { v: "01.12" }],
  [{ v: "04.04", tone: "gn" }, { v: "04.03" }, { v: "01.17" }, { v: "10.02" }],
  [{ v: "12.31" }, { v: "05.07" }, { v: "05.24" }, { v: "02.01" }],
  [{ v: "02.14", tone: "yw" }, { v: "07.02" }, { v: "11.02" }, { v: "07.14" }],
  [{ v: "06.14" }, { v: "04.10" }, { v: "08.06" }, { v: "03.10" }],
  [{ v: "11.07" }, { v: "02.05" }, { v: "04.12" }, { v: "-", empty: true }],
  [{ v: "08.14", tone: "or" }, { v: "01.06" }, { v: "06.13" }, { v: "-", empty: true }],
];

type MCQ = {
  q: React.ReactNode;
  choices: { label: string; ok: boolean }[];
  feedback: React.ReactNode;
};
const MCQS: MCQ[] = [
  {
    q: <>위 표에 기록된 학생은 총 몇 명인가요?</>,
    choices: [
      { label: "30명", ok: false },
      { label: "32명", ok: false },
      { label: "34명", ok: true },
      { label: "36명", ok: false },
    ],
    feedback: <>4열 × 7행 + 3명 × 2행 = 28 + 6 = <b>34명</b>입니다.</>,
  },
  {
    q: <>위 표에서 생일이 같은 학생 쌍은 총 몇 쌍인가요? (색 표시 참고)</>,
    choices: [
      { label: "1쌍", ok: false },
      { label: "2쌍", ok: false },
      { label: "3쌍", ok: true },
      { label: "4쌍", ok: false },
    ],
    feedback: <>08.14 쌍, 04.04 쌍, 02.14 쌍으로 총 <b>3쌍</b>입니다.</>,
  },
  {
    q: <>다음 중 표에서 생일이 같은 학생이 <b className="text-amber-200">없는</b> 날짜는?</>,
    choices: [
      { label: "04.04", ok: false },
      { label: "02.14", ok: false },
      { label: "08.14", ok: false },
      { label: "11.14", ok: true },
    ],
    feedback: <><b>11.14</b>는 한 명뿐이고 같은 생일 학생이 없습니다. 04.04·02.14·08.14는 각각 2명씩 있어요.</>,
  },
  {
    q: (
      <>
        34명 집단에서 적어도 두 명의 생일이 같을 <b className="text-amber-200">이론적 확률</b>에 가장 가까운 값은?
        <br />
        <span className="text-[11px] text-slate-500">(P(A) = 1 − ₃₆₅P₃₄ / 365³⁴)</span>
      </>
    ),
    choices: [
      { label: "약 50%", ok: false },
      { label: "약 65%", ok: false },
      { label: "약 80%", ok: true },
      { label: "약 95%", ok: false },
    ],
    feedback: <>n=34일 때 P(A) ≈ <b>0.7953</b> → 약 80%. 실제로 3쌍이나 발견된 것이 자연스러운 결과예요!</>,
  },
  {
    q: <>적어도 두 명의 생일이 같을 확률이 처음으로 <b className="text-amber-200">50%를 넘는</b> 최소 인원은?</>,
    choices: [
      { label: "18명", ok: false },
      { label: "20명", ok: false },
      { label: "23명", ok: true },
      { label: "30명", ok: false },
    ],
    feedback: <>n=22일 때 ≈ 0.476, n=23일 때 ≈ 0.507 → <b>23명</b>부터 50% 초과! 이것이 생일 역설의 핵심.</>,
  },
];

function ExamplePanel() {
  const [picks, setPicks] = useState<Record<number, number | null>>({});
  const score = Object.entries(picks).reduce(
    (acc, [k, v]) => acc + (v !== null && MCQS[Number(k)].choices[v as number].ok ? 1 : 0),
    0
  );
  const done = Object.values(picks).filter((v) => v !== null).length;

  function pick(qi: number, ci: number) {
    if (picks[qi] != null) return;
    setPicks((p) => ({ ...p, [qi]: ci }));
  }

  const cellTone = (c: Cell) => {
    if (c.empty) return "bg-black/10 border-white/5 text-transparent";
    if (c.tone === "or") return "bg-amber-400/25 border-amber-400/45 text-amber-100 font-bold";
    if (c.tone === "gn") return "bg-emerald-400/20 border-emerald-400/40 text-emerald-100 font-bold";
    if (c.tone === "yw") return "bg-yellow-400/22 border-yellow-400/40 text-yellow-100 font-bold";
    return "bg-white/[0.04] border-white/10 text-slate-300";
  };

  return (
    <div className="space-y-4">
      {/* 스코어 */}
      <div className="flex justify-center gap-2">
        <div className="min-w-[78px] rounded-lg border border-white/12 bg-white/[0.06] px-3 py-1.5 text-center">
          <div className="text-xl font-bold tabular-nums text-emerald-300">{score}</div>
          <div className="text-[10px] text-slate-400">정답</div>
        </div>
        <div className="min-w-[78px] rounded-lg border border-white/12 bg-white/[0.06] px-3 py-1.5 text-center">
          <div className="text-xl font-bold tabular-nums text-blue-300">{done} / 5</div>
          <div className="text-[10px] text-slate-400">진행</div>
        </div>
      </div>

      {/* 생일 표 */}
      <section className="rounded-xl border border-violet-400/25 bg-white/[0.04] p-4">
        <h4 className="text-sm font-bold text-violet-300">📅 한 학급 34명의 생일 표</h4>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-amber-400" /> 08.14 쌍</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-emerald-400" /> 04.04 쌍</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-yellow-400" /> 02.14 쌍</span>
        </div>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {TABLE_ROWS.map((row, ri) => (
                <tr key={ri}>
                  {row.map((c, ci) => (
                    <td
                      key={ci}
                      className={`border px-2 py-1.5 text-center font-mono text-sm ${cellTone(c)}`}
                    >
                      {c.empty ? "·" : c.v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MCQ */}
      {MCQS.map((q, qi) => {
        const picked = picks[qi] ?? null;
        const decided = picked !== null;
        const correct = decided && q.choices[picked!].ok;
        const cardBorder = !decided
          ? "border-white/10 bg-white/[0.04]"
          : correct
          ? "border-emerald-400/45 bg-emerald-400/[0.06]"
          : "border-red-400/45 bg-red-400/[0.05]";
        return (
          <div key={qi} className={`rounded-xl border-2 p-4 transition ${cardBorder}`}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-violet-300">문제 {qi + 1}</div>
            <p className="mt-1 text-sm leading-6 text-slate-100">{q.q}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {q.choices.map((c, ci) => {
                const isPicked = decided && picked === ci;
                const reveal = decided && c.ok;
                let cls = "border-white/20 bg-white/[0.06] text-slate-100 hover:border-violet-400/60 hover:bg-violet-400/15";
                if (decided) {
                  if (isPicked && correct) cls = "border-emerald-400 bg-emerald-400 text-slate-950 font-bold";
                  else if (isPicked && !correct) cls = "border-red-400 bg-red-400/25 text-red-200";
                  else if (reveal) cls = "border-emerald-400/50 text-emerald-300";
                  else cls = "border-white/15 bg-white/[0.04] text-slate-500";
                }
                return (
                  <button
                    key={ci}
                    type="button"
                    disabled={decided}
                    onClick={() => pick(qi, ci)}
                    className={`rounded-lg border-2 px-3.5 py-1 text-sm transition disabled:cursor-default ${cls}`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            {decided ? (
              <div
                className={`mt-2 rounded-lg px-3 py-2 text-xs leading-6 ${
                  correct
                    ? "border border-emerald-400/35 bg-emerald-400/10 text-emerald-100"
                    : "border border-red-400/35 bg-red-400/10 text-red-100"
                }`}
              >
                {correct ? "✅ " : "❌ "}
                {q.feedback}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 탭 3 — 우리 반 탐구 (Supabase 연동)
// ============================================================

type Phase = "loading" | "anon" | "student" | "teacher" | "admin" | "general" | "error";
type StudentSelf = {
  studentId: string;
  schoolYear: number;
  grade: number;
  classNumber: number;
  studentNumber: number;
  studentLoginId: string;
  name: string;
};
type ClassKey = { schoolYear: number; grade: number; classNumber: number };
type BdStat = { birthday_month: number; birthday_day: number; cnt: number };

function OurClassPanel() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // 학생 모드 상태
  const [self, setSelf] = useState<StudentSelf | null>(null);
  const [myBd, setMyBd] = useState<{ month: number; day: number } | null>(null);
  const [inputMonth, setInputMonth] = useState(1);
  const [inputDay, setInputDay] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // 교사/관리자 모드 상태
  const [classOptions, setClassOptions] = useState<ClassKey[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassKey | null>(null);

  // 통계 (공통)
  const [stats, setStats] = useState<BdStat[] | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(async (year: number, grade: number, classNum: number) => {
    setStatsLoading(true);
    const { data, error } = await supabase.rpc("get_class_birthday_stats", {
      p_year: year, p_grade: grade, p_class: classNum,
    });
    setStatsLoading(false);
    if (error) {
      setStats([]);
      return;
    }
    setStats(((data ?? []) as BdStat[]));
  }, []);

  // 초기 식별
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (cancelled) return;
      if (!user) { setPhase("anon"); return; }

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!profileRow) { setErrMsg("프로필을 찾을 수 없습니다."); setPhase("error"); return; }
      const role = (profileRow as { role: string }).role;
      const profileName = (profileRow as { name: string }).name;

      if (role === "student") {
        const { data: sRow } = await supabase
          .from("students")
          .select("id, school_year, grade, class_number, student_number, student_login_id")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (!sRow) { setErrMsg("학생 정보를 찾을 수 없습니다."); setPhase("error"); return; }
        const s = sRow as {
          id: string; school_year: number; grade: number;
          class_number: number; student_number: number; student_login_id: string;
        };
        const ident: StudentSelf = {
          studentId: s.id, schoolYear: s.school_year,
          grade: s.grade, classNumber: s.class_number,
          studentNumber: s.student_number, studentLoginId: s.student_login_id,
          name: profileName,
        };
        setSelf(ident);

        // 본인 기존 생일 (RLS 본인 행만 SELECT 통과)
        const { data: bdRow } = await supabase
          .from("class_birthdays")
          .select("birthday_month, birthday_day")
          .eq("student_id", s.id)
          .maybeSingle();
        if (!cancelled && bdRow) {
          const b = bdRow as { birthday_month: number; birthday_day: number };
          setMyBd({ month: b.birthday_month, day: b.birthday_day });
          setInputMonth(b.birthday_month);
          setInputDay(b.birthday_day);
        }
        setPhase("student");
        await loadStats(ident.schoolYear, ident.grade, ident.classNumber);
        return;
      }

      if (role === "teacher" || role === "admin") {
        const year = await getCurrentSchoolYear();
        let opts: ClassKey[] = [];
        if (role === "teacher") {
          const { data: tps } = await supabase
            .from("teacher_permissions")
            .select("grade, class_number, teachers!inner(profile_id)")
            .eq("teachers.profile_id", user.id);
          const seen = new Map<string, ClassKey>();
          ((tps as { grade: number; class_number: number }[] | null) ?? []).forEach((tp) => {
            const k = `${tp.grade}-${tp.class_number}`;
            if (!seen.has(k)) seen.set(k, { schoolYear: year, grade: tp.grade, classNumber: tp.class_number });
          });
          opts = Array.from(seen.values()).sort((a, b) => a.grade - b.grade || a.classNumber - b.classNumber);
        } else {
          const { data: scs } = await supabase
            .from("school_classes")
            .select("grade, class_number")
            .order("grade", { ascending: true })
            .order("class_number", { ascending: true });
          opts = ((scs as { grade: number; class_number: number }[] | null) ?? []).map((s) => ({
            schoolYear: year, grade: s.grade, classNumber: s.class_number,
          }));
        }
        if (cancelled) return;
        setClassOptions(opts);
        setPhase(role);
        if (opts.length > 0) {
          setSelectedClass(opts[0]);
          await loadStats(opts[0].schoolYear, opts[0].grade, opts[0].classNumber);
        }
        return;
      }

      setPhase("general");
    })();
    return () => { cancelled = true; };
  }, [loadStats]);

  // 월 변경 시 일이 새 월의 최대 일수를 넘으면 클램프 (이벤트 핸들러에서 처리)
  function handleMonthChange(m: number) {
    setInputMonth(m);
    const max = DAYS_IN_MONTH[m - 1];
    setInputDay((d) => (d > max ? max : d));
  }

  async function submitBirthday() {
    if (!self) return;
    setSubmitting(true);
    setSubmitMsg(null);
    const maxDay = DAYS_IN_MONTH[inputMonth - 1];
    if (inputDay > maxDay) {
      setSubmitMsg({ kind: "err", text: `${inputMonth}월은 ${maxDay}일까지입니다.` });
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.rpc("submit_class_birthday", {
      p_month: inputMonth, p_day: inputDay,
    });
    if (error) {
      setSubmitMsg({ kind: "err", text: `등록 실패: ${error.message}` });
      setSubmitting(false);
      return;
    }
    setMyBd({ month: inputMonth, day: inputDay });
    setSubmitMsg({ kind: "ok", text: `✅ 생일 ${pad2(inputMonth)}.${pad2(inputDay)}이(가) 등록되었습니다!` });
    setSubmitting(false);
    await loadStats(self.schoolYear, self.grade, self.classNumber);
  }

  // ── 렌더 ──
  if (phase === "loading") {
    return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-slate-400">불러오는 중…</div>;
  }
  if (phase === "error") {
    return <NoticeCard tone="red" title="오류" body={errMsg ?? "알 수 없는 오류"} />;
  }
  if (phase === "anon") {
    return <NoticeCard tone="amber" title="로그인이 필요합니다" body="학생 계정으로 로그인하면 본인 생일을 등록하고 우리 반 통계를 볼 수 있어요." />;
  }
  if (phase === "general") {
    return <NoticeCard tone="amber" title="학생 계정 전용" body="이 탐구는 학급 단위 데이터 수집이라 학생 계정으로 참여할 수 있어요. 통계 조회는 교사/관리자도 가능합니다." />;
  }

  if (phase === "student" && self) {
    return (
      <div className="space-y-4">
        <StudentHeader self={self} />
        <BirthdayInputCard
          month={inputMonth} day={inputDay}
          myBd={myBd}
          onMonthChange={handleMonthChange} onDayChange={setInputDay}
          onSubmit={submitBirthday}
          submitting={submitting}
          submitMsg={submitMsg}
        />
        <StatsPanel
          klass={{ schoolYear: self.schoolYear, grade: self.grade, classNumber: self.classNumber }}
          stats={stats} loading={statsLoading}
        />
      </div>
    );
  }

  if (phase === "teacher" || phase === "admin") {
    return (
      <div className="space-y-4">
        <NoticeCard
          tone="cyan"
          title={phase === "admin" ? "관리자 모드 (read-only)" : "교사 모드 (read-only)"}
          body="학급을 선택해 학생들의 생일 분포·통계를 볼 수 있어요. 입력은 학생 계정에서만 가능합니다."
        />
        <ClassPicker
          options={classOptions}
          selected={selectedClass}
          onSelect={(k) => { setSelectedClass(k); void loadStats(k.schoolYear, k.grade, k.classNumber); }}
        />
        {selectedClass ? (
          <StatsPanel klass={selectedClass} stats={stats} loading={statsLoading} />
        ) : (
          <NoticeCard tone="amber" title="학급 정보 없음" body={
            phase === "teacher"
              ? "담당 학급이 등록되어 있지 않습니다. 관리자에게 권한 부여를 요청하세요."
              : "학급(학년·반) 마스터가 비어 있습니다. /admin/settings 에서 등록하세요."
          } />
        )}
      </div>
    );
  }

  return null;
}

// ─── 보조 컴포넌트들 ───

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function NoticeCard({ tone, title, body }: { tone: "cyan" | "amber" | "red"; title: string; body: string }) {
  const border =
    tone === "cyan" ? "border-cyan-400/35 bg-cyan-400/[0.06]" :
    tone === "red" ? "border-red-400/35 bg-red-400/[0.06]" :
    "border-amber-400/35 bg-amber-400/[0.06]";
  const tt =
    tone === "cyan" ? "text-cyan-300" :
    tone === "red" ? "text-red-300" :
    "text-amber-300";
  return (
    <div className={`rounded-xl border p-4 ${border}`}>
      <div className={`text-sm font-bold ${tt}`}>{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-200">{body}</div>
    </div>
  );
}

function StudentHeader({ self }: { self: StudentSelf }) {
  return (
    <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4">
      <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">내 정보</div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="text-slate-100"><b>{self.name}</b></span>
        <span className="text-slate-400">학번 <span className="font-mono text-slate-200">{self.studentLoginId}</span></span>
        <span className="text-slate-400">
          {self.schoolYear}학년도 · {self.grade}학년 {self.classNumber}반 {self.studentNumber}번
        </span>
      </div>
    </div>
  );
}

// 다크 테마 드롭다운 — 펼친 option 목록도 slate-950 어두운 배경(브라우저 기본 흰색 회피).
// admin/subjects·teachers 와 톤 통일, 행 높이만 컴팩트(py-1).
const BD_SELECT_CLS =
  "rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1 text-sm text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40";

function BirthdayInputCard({
  month, day, myBd, onMonthChange, onDayChange, onSubmit, submitting, submitMsg,
}: {
  month: number; day: number;
  myBd: { month: number; day: number } | null;
  onMonthChange: (m: number) => void;
  onDayChange: (d: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitMsg: { kind: "ok" | "err"; text: string } | null;
}) {
  const maxDay = DAYS_IN_MONTH[month - 1];
  const dayOptions = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay]);
  const isUpdate = myBd != null;
  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.05] p-4">
      <div className="text-xs font-bold uppercase tracking-wider text-amber-300">🎂 내 생일 입력</div>
      {myBd ? (
        <p className="mt-1 text-xs text-slate-400">
          현재 등록된 생일: <span className="font-mono font-bold text-amber-200">{pad2(myBd.month)}.{pad2(myBd.day)}</span>
          {" · "}수정하려면 아래에서 다시 선택하세요.
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-400">월·일을 선택하고 등록 버튼을 누르세요.</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor="bp-month" className="text-xs text-slate-400">월</label>
        <select
          id="bp-month"
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          className={BD_SELECT_CLS}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m} className="bg-slate-950 text-white">{m}월</option>
          ))}
        </select>
        <label htmlFor="bp-day" className="text-xs text-slate-400">일</label>
        <select
          id="bp-day"
          value={day}
          onChange={(e) => onDayChange(Number(e.target.value))}
          className={BD_SELECT_CLS}
        >
          {dayOptions.map((d) => (
            <option key={d} value={d} className="bg-slate-950 text-white">{d}일</option>
          ))}
        </select>
        <span className="ml-1 font-mono text-sm text-amber-200">선택: {pad2(month)}.{pad2(day)}</span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="ml-auto rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-1.5 text-sm font-bold text-slate-950 transition hover:brightness-110 disabled:opacity-40"
        >
          {submitting ? "처리 중…" : isUpdate ? "✏️ 수정" : "🎂 등록"}
        </button>
      </div>

      {submitMsg ? (
        <div
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            submitMsg.kind === "ok"
              ? "border border-emerald-400/35 bg-emerald-400/10 text-emerald-200"
              : "border border-red-400/35 bg-red-400/10 text-red-200"
          }`}
        >
          {submitMsg.text}
        </div>
      ) : null}
    </div>
  );
}

function ClassPicker({
  options, selected, onSelect,
}: {
  options: ClassKey[];
  selected: ClassKey | null;
  onSelect: (k: ClassKey) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">학급 선택</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((k) => {
          const sel = selected
            && selected.schoolYear === k.schoolYear
            && selected.grade === k.grade
            && selected.classNumber === k.classNumber;
          return (
            <button
              key={`${k.schoolYear}-${k.grade}-${k.classNumber}`}
              type="button"
              onClick={() => onSelect(k)}
              className={`rounded-md border px-3 py-1 text-xs font-semibold transition ${
                sel
                  ? "border-cyan-400 bg-cyan-400 text-slate-950"
                  : "border-white/15 bg-white/[0.04] text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10"
              }`}
            >
              {k.schoolYear} · {k.grade}학년 {k.classNumber}반
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatsPanel({
  klass, stats, loading,
}: {
  klass: ClassKey;
  stats: BdStat[] | null;
  loading: boolean;
}) {
  const n = useMemo(() => (stats ?? []).reduce((acc, s) => acc + s.cnt, 0), [stats]);
  const pairCount = useMemo(
    () => (stats ?? []).reduce((acc, s) => acc + (s.cnt >= 2 ? (s.cnt * (s.cnt - 1)) / 2 : 0), 0),
    [stats]
  );
  const theoryP = useMemo(() => calcP(n), [n]);
  const matches = useMemo(() => (stats ?? []).filter((s) => s.cnt >= 2), [stats]);

  const pTone = theoryP >= 0.5 ? "text-red-300" : theoryP >= 0.25 ? "text-amber-300" : "text-emerald-300";
  const actualRate = n >= 2 ? pairCount / ((n * (n - 1)) / 2) : 0;

  return (
    <div className="rounded-xl border border-violet-400/25 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-violet-300">
          📊 우리 반 통계 ({klass.schoolYear} · {klass.grade}학년 {klass.classNumber}반)
        </div>
        {loading ? <span className="text-[11px] text-slate-500">불러오는 중…</span> : null}
      </div>

      {(!stats || stats.length === 0) && !loading ? (
        <p className="mt-3 rounded-md bg-black/20 px-3 py-2 text-sm text-slate-400">
          아직 등록된 생일이 없어요. 첫 번째로 등록해 보세요! 🎉
        </p>
      ) : (
        <>
          {/* KPI 카드 3개 */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatCard label="참여 인원" value={`${n}명`} tone="cyan" />
            <StatCard label="같은 생일 쌍" value={`${pairCount}쌍`} tone="violet" />
            <StatCard label="이론적 P(A)" value={theoryP.toFixed(3)} tone={theoryP >= 0.5 ? "red" : theoryP >= 0.25 ? "amber" : "emerald"} mono />
          </div>

          {/* 매치된 일자 */}
          <div className="mt-3 rounded-lg border border-red-400/25 bg-red-400/[0.06] p-3">
            <div className="text-xs font-bold text-red-300">🎉 같은 생일 발견 일자</div>
            {matches.length === 0 ? (
              <p className="mt-1 text-xs text-slate-400">
                아직 같은 생일 쌍이 없습니다.
                {theoryP >= 0.5 ? (
                  <> 이론적으로는 같은 쌍이 있을 확률이 <b className="text-red-300">{(theoryP * 100).toFixed(1)}%</b>인데, 더 많이 모이면 달라질 수 있어요.</>
                ) : null}
              </p>
            ) : (
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {matches.map((m) => (
                  <li
                    key={`${m.birthday_month}-${m.birthday_day}`}
                    className="rounded-md border border-red-400/40 bg-red-400/15 px-2 py-0.5 font-mono text-xs font-bold text-red-100"
                  >
                    {pad2(m.birthday_month)}.{pad2(m.birthday_day)} — {m.cnt}명
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 이론 vs 실제 비교 */}
          <div className="mt-2 rounded-md bg-black/20 px-3 py-2 text-xs leading-6 text-slate-300">
            <b className="text-slate-100">이론 vs 실제</b>: n = <b className="text-cyan-300">{n}</b>명일 때 이론적 같은 생일 쌍 존재 확률 P(A) ≈ <b className={pTone}>{(theoryP * 100).toFixed(1)}%</b>.
            현재 실측 매치율(모든 쌍 중) = <b className="text-amber-200">{(actualRate * 100).toFixed(2)}%</b>.
          </div>

          {/* 전체 분포 (월별) */}
          <details className="mt-2 rounded-md border border-white/10 bg-black/15 p-2 text-xs text-slate-300">
            <summary className="cursor-pointer select-none px-1 py-0.5 font-bold text-slate-200">📋 전체 생일 분포 (월별)</summary>
            <div className="mt-2 space-y-1">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const items = (stats ?? []).filter((s) => s.birthday_month === m);
                if (items.length === 0) return null;
                return (
                  <div key={m} className="flex flex-wrap items-center gap-1.5">
                    <span className="w-9 text-slate-400">{m}월</span>
                    {items.map((s) => (
                      <span
                        key={s.birthday_day}
                        className={`rounded px-1.5 py-px font-mono text-[11px] ${
                          s.cnt >= 2
                            ? "border border-red-400/40 bg-red-400/15 font-bold text-red-100"
                            : "bg-white/8 text-slate-300"
                        }`}
                      >
                        {pad2(s.birthday_day)}{s.cnt >= 2 ? `×${s.cnt}` : ""}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </details>
        </>
      )}
    </div>
  );
}

function StatCard({
  label, value, tone, mono,
}: {
  label: string; value: string;
  tone: "cyan" | "violet" | "emerald" | "amber" | "red";
  mono?: boolean;
}) {
  const valTone =
    tone === "cyan" ? "text-cyan-300" :
    tone === "violet" ? "text-violet-300" :
    tone === "amber" ? "text-amber-300" :
    tone === "red" ? "text-red-300" :
    "text-emerald-300";
  return (
    <div className="rounded-lg border border-white/12 bg-white/[0.06] p-2 text-center">
      <div className={`${mono ? "font-mono" : ""} text-xl font-bold tabular-nums ${valTone}`}>{value}</div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  );
}

// ============================================================
// 성찰 질문
// ============================================================

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_complement",
    kind: "text",
    prompt: "생일 역설 계산에서 여사건 P(Aᶜ)를 먼저 구하는 이유는 무엇인가요?",
    placeholder: "P(A)를 직접 계산하기 어려운 이유와 P(Aᶜ) = (모두 생일이 다른 사건)을 먼저 계산하면 좋은 이유를 써 보세요.",
  },
  {
    id: "intuition_gap",
    kind: "text",
    prompt: "23명이면 P(A) > 50%라는 결과가 처음 예상과 어떻게 달랐나요?",
    placeholder: "처음에 예상한 인원 수, 실제 결과와의 차이, 그렇게 차이 난 이유...",
  },
  {
    id: "our_class_result",
    kind: "text",
    prompt: "탐구 3에서 우리 반 생일 결과를 이론적 확률과 비교해 보고, 어떤 차이가 있는지 적어 보세요.",
    placeholder: "같은 생일 쌍이 있었는지, 이론적 확률은 몇 %였는지, 결과가 이론과 일치했는지...",
  },
  {
    id: "assumption_limit",
    kind: "text",
    prompt: "이 계산에서 1년 = 365일, 모든 날 균등 확률로 가정했습니다. 실제와 다른 점은 무엇일까요?",
    placeholder: "윤년, 생일 분포의 불균등성(예: 특정 달이 많음), 쌍둥이 등...",
  },
];

// ============================================================
// 메인
// ============================================================

type TabKey = "concept" | "example" | "ourclass";

export default function BirthdayParadoxMini() {
  const [tab, setTab] = useState<TabKey>("concept");
  const tabBtn = (active: boolean, color: string) =>
    active
      ? `rounded-lg ${color} px-3 py-2 text-sm font-bold text-slate-950`
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <style>{`@keyframes pop {0%{transform:scale(0);opacity:0}60%{transform:scale(1.6);opacity:1}100%{transform:scale(1);opacity:1}}`}</style>

      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 확률의 덧셈정리</p>
        <h3 className="mt-2 text-2xl font-bold">🎂 생일 역설 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          우리 반에 생일이 같은 친구가 있을 확률은? 여사건의 확률{" "}
          <b className="text-amber-200">P(A) = 1 − P(Aᶜ)</b>로 생일 역설을 탐구합니다.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "concept", "bg-amber-300")} onClick={() => setTab("concept")}>
          🎭 탐구 1 · 원리 이해
        </button>
        <button type="button" className={tabBtn(tab === "example", "bg-violet-300")} onClick={() => setTab("example")}>
          📋 탐구 2 · 예시 분석
        </button>
        <button type="button" className={tabBtn(tab === "ourclass", "bg-emerald-300")} onClick={() => setTab("ourclass")}>
          🏫 탐구 3 · 우리 반 탐구
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {tab === "concept" ? (
          <>
            <CircleSim />
            <FormulaDerivation />
            <ProbabilityGraph />
          </>
        ) : tab === "example" ? (
          <ExamplePanel />
        ) : (
          <OurClassPanel />
        )}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
