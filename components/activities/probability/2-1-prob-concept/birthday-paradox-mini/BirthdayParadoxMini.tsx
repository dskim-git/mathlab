"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

/* ──────────────────────────────────────────────────────────────
   🎂 생일 역설 탐구  (3 tabs)
   1) 원리 이해 — 365일 원형 시뮬 + 수식 빈칸 + n-P(A) 곡선
   2) 예시 분석 — 34명 생일 표 + MCQ 5
   3) 우리 반 탐구 — Supabase 배선은 단계 B (현재 placeholder)
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
  const lastNewIdRef = useRef<number | null>(null);

  const p = calcP(people.length);
  const pTone = p >= 0.5 ? "text-red-300" : p >= 0.25 ? "text-amber-300" : "text-emerald-300";
  const pBarTone = p >= 0.5 ? "bg-red-400" : p >= 0.25 ? "bg-amber-400" : "bg-emerald-400";

  function addOne() {
    if (people.length >= MAX_PERSONS) {
      setAuto(false);
      return;
    }
    setPeople((prev) => {
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
      lastNewIdRef.current = id;
      return [...updated, next];
    });
  }
  function reset() {
    setPeople([]);
    setMatches([]);
    setAuto(false);
    lastNewIdRef.current = null;
  }

  // 자동 실행
  useEffect(() => {
    if (!auto) return;
    if (people.length >= MAX_PERSONS) {
      setAuto(false);
      return;
    }
    const ms = Math.max(80, 700 - speed * 130); // speed 1=570 / 5=50
    const t = window.setTimeout(addOne, ms);
    return () => window.clearTimeout(t);
  }, [auto, speed, people.length]);

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
            {/* 점 */}
            {people.map((per) => {
              const pos = a2xy(per.doy);
              const isNew = per.id === lastNewIdRef.current;
              return (
                <g key={per.id} className={isNew ? "animate-[pop_0.4s_ease-out]" : ""}>
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
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-300 ${pBarTone}`}
                style={{ width: `${Math.min(p * 100, 100)}%` }}
              />
            </div>
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
            n = <span className="font-bold text-amber-300">23</span>명일 때 처음으로 P(A) {">"} 0.5 — 이것이 바로 <b>"생일 역설"</b>!
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
// 탭 3 — 우리 반 탐구 (단계 B에서 활성화)
// ============================================================

function OurClassPlaceholder() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-dashed border-emerald-400/35 bg-emerald-400/[0.04] p-6 text-center">
        <div className="text-4xl">🏫</div>
        <h4 className="mt-2 text-lg font-bold text-emerald-300">우리 반 생일 탐구</h4>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          학생들이 자기 생일을 입력하면 <b>같은 학년·반 전체 통계</b>와<br />
          <b>같은 생일 발견 알림</b>, 이론적 확률 P(A)와의 비교를 볼 수 있어요.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200">
          ⏳ 곧 활성화될 예정입니다
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">활성화되면 가능한 것</h5>
        <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-300">
          <li>• 🎂 본인 생일 입력 (월/일 선택, 수정 가능)</li>
          <li>• 👥 같은 학년·반 참여 인원, 같은 생일 쌍 수, 이론적 확률 P(A) 비교</li>
          <li>• 🔍 같은 생일 발견 시 친구 이름 노출 (이론 vs 실제 검증)</li>
          <li>• 📋 우리 반 전체 생일 목록 보기</li>
        </ul>
      </div>
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
          <OurClassPlaceholder />
        )}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
