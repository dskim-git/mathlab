"use client";

import { useMemo, useState } from "react";

type TabKey = "viz" | "table" | "dim" | "formula" | "quiz";

// ─── 시에르핀스키 재귀 + 분수 헬퍼 ────────────────────────────
type Tri = [number, number, number, number, number, number];

function getTriangles(
  depth: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): Tri[] {
  if (depth === 0) return [[ax, ay, bx, by, cx, cy]];
  const mx1 = (ax + bx) / 2;
  const my1 = (ay + by) / 2;
  const mx2 = (ax + cx) / 2;
  const my2 = (ay + cy) / 2;
  const mx3 = (bx + cx) / 2;
  const my3 = (by + cy) / 2;
  return [
    ...getTriangles(depth - 1, ax, ay, mx1, my1, mx2, my2),
    ...getTriangles(depth - 1, mx1, my1, bx, by, mx3, my3),
    ...getTriangles(depth - 1, mx2, my2, mx3, my3, cx, cy),
  ];
}

function gcdBig(a: number, b: number): number {
  return b === 0 ? a : gcdBig(b, a % b);
}

function toFrac(num: number, den: number): string {
  const g = gcdBig(num, den);
  const n2 = num / g;
  const d2 = den / g;
  return d2 === 1 ? `${n2}` : `${n2}/${d2}`;
}

function polyStr(t: Tri): string {
  return `${t[0]},${t[1]} ${t[2]},${t[3]} ${t[4]},${t[5]}`;
}

export default function SierpinskiProps() {
  const [tab, setTab] = useState<TabKey>("viz");
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-5 text-center">
        <h2 className="text-2xl font-extrabold text-white">
          🔺 시에르핀스키 삼각형 — 단계별 분석
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          삼각형 개수·넓이·둘레의 수열 공식을 탐구하며 프랙털 차원을 발견합니다.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {(
          [
            { key: "viz", label: "🔺 시각화", color: "amber" },
            { key: "table", label: "📊 표 탐구", color: "amber" },
            { key: "dim", label: "🌀 차원 원리", color: "violet" },
            { key: "formula", label: "📐 일반화", color: "amber" },
            { key: "quiz", label: "🎯 퀴즈", color: "purple" },
          ] as const
        ).map((t) => {
          const active = tab === t.key;
          const cls = active
            ? t.color === "violet"
              ? "border-violet-400 bg-violet-600 text-white"
              : t.color === "purple"
                ? "border-purple-400 bg-purple-600 text-white"
                : "border-amber-400 bg-amber-600 text-white"
            : "border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-900";
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={"rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition " + cls}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <section className={tab === "viz" ? "" : "hidden"}>
        <VizTab />
      </section>
      <section className={tab === "table" ? "" : "hidden"}>
        <TableTab />
      </section>
      <section className={tab === "dim" ? "" : "hidden"}>
        <DimTab />
      </section>
      <section className={tab === "formula" ? "" : "hidden"}>
        <FormulaTab />
      </section>
      <section className={tab === "quiz" ? "" : "hidden"}>
        <QuizTab />
      </section>
    </div>
  );
}

// ─── 탭 1: 시각화 ────────────────────────────────────────────
function VizTab() {
  const [step, setStep] = useState(0);
  const W = 480;
  const H = 420;
  const PAD = 22;
  const AX = W / 2,
    AY = PAD;
  const BX = PAD,
    BY = H - PAD;
  const CX = W - PAD,
    CY = H - PAD;
  const tris = useMemo(
    () => getTriangles(step, AX, AY, BX, BY, CX, CY),
    [step],
  );
  // stroke 폭: 단계 올라갈수록 가늘게 (5/6단계도 디테일 살리도록).
  const sw = step <= 4 ? Math.max(0.4, 1.6 - step * 0.3) : step === 5 ? 0.25 : 0.15;

  const cnt = Math.pow(3, step);
  const aStr = toFrac(Math.pow(3, step), Math.pow(4, step));
  const pStr = toFrac(3 * Math.pow(3, step), Math.pow(2, step));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-300">단계 선택:</span>
        {[0, 1, 2, 3, 4, 5, 6].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={
              "rounded-md border px-3 py-1 text-sm font-bold transition " +
              (step === s
                ? "border-amber-400 bg-amber-500 text-slate-900"
                : "border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800")
            }
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mx-auto w-2/3 rounded-xl border border-white/10 bg-slate-950 p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
          <rect width={W} height={H} fill="#0f172a" rx={10} />
          <polygon
            points={`${AX},${AY} ${BX},${BY} ${CX},${CY}`}
            fill="none"
            stroke="#1e3a5f"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          {tris.map((t, i) => (
            <polygon
              key={i}
              points={polyStr(t)}
              fill="#b45309"
              stroke="#fbbf24"
              strokeWidth={sw}
            />
          ))}
        </svg>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="삼각형 개수" value={fmt(cnt)} formula={`3^${step} = ${fmt(cnt)}`} color="text-sky-300" />
        <StatCard
          label="넓이 (S₀ = 1)"
          value={aStr}
          formula={`(3/4)^${step}`}
          color="text-emerald-300"
        />
        <StatCard
          label="둘레의 합 (변 = 1)"
          value={pStr}
          formula={`3×(3/2)^${step}`}
          color="text-amber-300"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  formula,
  color,
}: {
  label: string;
  value: string;
  formula: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-center">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={"my-1 text-2xl font-extrabold " + color}>{value}</div>
      <div className="text-[11px] text-slate-500">{formula}</div>
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString();
}

// ─── 탭 2: 표 탐구 ──────────────────────────────────────────
const TABLE_GROUPS = [
  {
    key: "c",
    title: "① 삼각형의 개수",
    vals: ["1", "3", "9", "27", "81"],
  },
  {
    key: "a",
    title: "② 삼각형의 넓이 (S₀ = 1)",
    vals: ["1", "3/4", "9/16", "27/64", "81/256"],
  },
  {
    key: "p",
    title: "③ 삼각형의 둘레의 합 (한 변 = 1)",
    vals: ["3", "9/2", "27/4", "81/8", "243/16"],
  },
] as const;

function TableTab() {
  return (
    <div className="space-y-4">
      {TABLE_GROUPS.map((g) => (
        <TableSection key={g.key} title={g.title} vals={g.vals} />
      ))}
      <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-100">
        💡 <b className="text-amber-300">힌트</b>: 매 단계마다 삼각형은{" "}
        <b className="text-amber-300">3 배</b>로 늘어나고, 각 삼각형의 한 변의
        길이는 <b className="text-amber-300">1/2 배</b>가 됩니다. 따라서 넓이는
        (1/2)² = 1/4 배, 둘레의 합의 각 항은 1/2 배가 됩니다.
        <br />각 셀을 클릭하면 답이 공개됩니다.
      </div>
    </div>
  );
}

// ─── 탭 3: 차원 원리 ────────────────────────────────────────
function DimTab() {
  return (
    <div className="space-y-4">
      <DimConcept />
      <DimCompareCards />
      <DimDeriveCard />
      <DimCalculator />
    </div>
  );
}

function DimConcept() {
  return (
    <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-5">
      <div className="mb-2 text-base font-bold text-violet-200">
        💡 차원을 구하는 핵심 원리
      </div>
      <p className="text-sm leading-relaxed text-slate-300">
        어떤 도형을 <b className="text-amber-300">r 배 확대</b>하면 원래 도형과
        똑같은 <b className="text-amber-300">복사본이 N 개</b> 생긴다고 할 때, 이
        도형의 차원 D 는 다음과 같이 정의됩니다.
      </p>
      <div className="my-3 rounded-md bg-slate-900/60 px-4 py-3 text-center text-lg font-extrabold text-amber-300">
        rᴰ = N &nbsp;⟹&nbsp; D = log N / log r = log<sub>r</sub>N
      </div>
      <p className="text-center text-xs text-slate-400">
        D가 정수(1, 2, 3) 이면 보통 도형 · D 가 소수이면 프랙털!
      </p>
    </div>
  );
}

function DimCompareCards() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">
        🔍 세 가지 도형의 차원 비교
      </h3>
      <div className="grid gap-3 md:grid-cols-3">
        <CompareDimCard
          name="선분 (1차원)"
          svg={<LineSvg />}
          eq="r=2, N=2 → D = 1"
        />
        <CompareDimCard
          name="정삼각형 (2차원)"
          svg={<TriCompSvg />}
          eq="r=2, N=4 → D = 2"
        />
        <CompareDimCard
          name="시에르핀스키 (프랙털!)"
          svg={<SierCompSvg />}
          eq="r=2, N=3 → D ≈ 1.585"
          fractal
        />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        🔑 정삼각형을 2배 확대하면{" "}
        <b className="text-amber-300">4개</b> 의 복사본이 생기지만, 시에르핀스키
        삼각형은 가운데를 제거했기에{" "}
        <b className="text-violet-300">3개</b> 만 생깁니다. (오른쪽 그림의 점선
        삼각형 = 제거된 자리.) 이 차이 하나가 비정수 차원(≈1.585) 을
        만들어냅니다!
      </p>
    </div>
  );
}

function CompareDimCard({
  name,
  svg,
  eq,
  fractal,
}: {
  name: string;
  svg: React.ReactNode;
  eq: string;
  fractal?: boolean;
}) {
  return (
    <div
      className={
        "rounded-xl border-2 p-3 " +
        (fractal
          ? "border-violet-400/50 bg-violet-500/10"
          : "border-white/10 bg-slate-900/60")
      }
    >
      <div className="mb-2 text-sm font-bold text-slate-200">{name}</div>
      <div className="overflow-hidden rounded-md">{svg}</div>
      <div
        className={
          "mt-2 text-center text-xs font-bold " +
          (fractal ? "text-violet-300" : "text-slate-300")
        }
      >
        {eq}
      </div>
    </div>
  );
}

function LineSvg() {
  return (
    <svg viewBox="0 0 260 78" className="block w-full">
      <rect width={260} height={78} fill="#0f172a" rx={8} />
      <text x={52} y={16} textAnchor="middle" fontSize={9} fill="#64748b">
        r 배 확대 전
      </text>
      <line x1={12} y1={42} x2={92} y2={42} stroke="#3b82f6" strokeWidth={5} strokeLinecap="round" />
      <text x={52} y={60} textAnchor="middle" fontSize={9} fill="#60a5fa">
        ① 1개
      </text>
      <text x={115} y={46} textAnchor="middle" fontSize={16} fill="#475569">
        →
      </text>
      <text x={115} y={61} textAnchor="middle" fontSize={8} fill="#475569">
        ×2배
      </text>
      <text x={192} y={16} textAnchor="middle" fontSize={9} fill="#64748b">
        2배 확대 후
      </text>
      <line x1={138} y1={42} x2={192} y2={42} stroke="#f59e0b" strokeWidth={5} strokeLinecap="round" />
      <line x1={192} y1={42} x2={246} y2={42} stroke="#6ee7b7" strokeWidth={5} strokeLinecap="round" />
      <circle cx={138} cy={42} r={2.5} fill="#94a3b8" />
      <circle cx={192} cy={42} r={2.5} fill="#94a3b8" />
      <circle cx={246} cy={42} r={2.5} fill="#94a3b8" />
      <text x={165} y={60} textAnchor="middle" fontSize={8} fill="#f59e0b">
        ①
      </text>
      <text x={219} y={60} textAnchor="middle" fontSize={8} fill="#6ee7b7">
        ②
      </text>
      <text x={192} y={73} textAnchor="middle" fontSize={9} fill="#c084fc">
        N = 2개
      </text>
    </svg>
  );
}

function TriCompSvg() {
  const ax = 192,
    ay = 20,
    bx = 137,
    by = 100,
    cx = 252,
    cy = 100;
  const mx1 = (ax + bx) / 2,
    my1 = (ay + by) / 2;
  const mx2 = (ax + cx) / 2,
    my2 = (ay + cy) / 2;
  const mx3 = (bx + cx) / 2,
    my3 = (by + cy) / 2;
  return (
    <svg viewBox="0 0 260 128" className="block w-full">
      <rect width={260} height={128} fill="#0f172a" rx={8} />
      <text x={52} y={14} textAnchor="middle" fontSize={9} fill="#64748b">
        r 배 확대 전
      </text>
      <polygon points="52,20 12,100 92,100" fill="#1d4ed8" stroke="#3b82f6" strokeWidth={1.5} />
      <text x={52} y={115} textAnchor="middle" fontSize={9} fill="#60a5fa">
        1개
      </text>
      <text x={115} y={65} textAnchor="middle" fontSize={16} fill="#475569">
        →
      </text>
      <text x={115} y={80} textAnchor="middle" fontSize={8} fill="#475569">
        ×2배
      </text>
      <text x={192} y={14} textAnchor="middle" fontSize={9} fill="#64748b">
        2배 확대 후
      </text>
      <polygon
        points={`${ax},${ay} ${mx1},${my1} ${mx2},${my2}`}
        fill="#92400e"
        stroke="#f59e0b"
        strokeWidth={1}
      />
      <polygon
        points={`${mx1},${my1} ${bx},${by} ${mx3},${my3}`}
        fill="#064e3b"
        stroke="#10b981"
        strokeWidth={1}
      />
      <polygon
        points={`${mx2},${my2} ${mx3},${my3} ${cx},${cy}`}
        fill="#3b0764"
        stroke="#a78bfa"
        strokeWidth={1}
      />
      <polygon
        points={`${mx1},${my1} ${mx2},${my2} ${mx3},${my3}`}
        fill="#7f1d1d"
        stroke="#f87171"
        strokeWidth={1}
      />
      <text x={192} y={115} textAnchor="middle" fontSize={9} fill="#94a3b8">
        N = 4개 (= 2²)
      </text>
    </svg>
  );
}

function SierCompSvg() {
  // 왼쪽: 1단계 시에르핀스키 (1개로 표기)
  const leftTris = getTriangles(1, 52, 20, 12, 100, 92, 100);
  // 오른쪽: 2배 확대 후 — 1단계 시에르핀스키 3개 (가운데 점선 자리)
  const rax = 192,
    ray = 20,
    rbx = 137,
    rby = 100,
    rcx = 252,
    rcy = 100;
  const rmx1 = (rax + rbx) / 2,
    rmy1 = (ray + rby) / 2;
  const rmx2 = (rax + rcx) / 2,
    rmy2 = (ray + rcy) / 2;
  const rmx3 = (rbx + rcx) / 2,
    rmy3 = (rby + rcy) / 2;
  const tA = getTriangles(1, rax, ray, rmx1, rmy1, rmx2, rmy2);
  const tB = getTriangles(1, rmx1, rmy1, rbx, rby, rmx3, rmy3);
  const tC = getTriangles(1, rmx2, rmy2, rmx3, rmy3, rcx, rcy);
  return (
    <svg viewBox="0 0 260 128" className="block w-full">
      <rect width={260} height={128} fill="#0f172a" rx={8} />
      <text x={52} y={14} textAnchor="middle" fontSize={9} fill="#64748b">
        r 배 확대 전
      </text>
      {leftTris.map((t, i) => (
        <polygon
          key={"L" + i}
          points={polyStr(t)}
          fill="#1d4ed8"
          stroke="#3b82f6"
          strokeWidth={1.5}
        />
      ))}
      <text x={52} y={115} textAnchor="middle" fontSize={9} fill="#60a5fa">
        1개
      </text>
      <text x={115} y={65} textAnchor="middle" fontSize={16} fill="#475569">
        →
      </text>
      <text x={115} y={80} textAnchor="middle" fontSize={8} fill="#475569">
        ×2배
      </text>
      <text x={192} y={14} textAnchor="middle" fontSize={9} fill="#64748b">
        2배 확대 후
      </text>
      {tA.map((t, i) => (
        <polygon
          key={"A" + i}
          points={polyStr(t)}
          fill="#92400e"
          stroke="#f59e0b"
          strokeWidth={0.8}
        />
      ))}
      {tB.map((t, i) => (
        <polygon
          key={"B" + i}
          points={polyStr(t)}
          fill="#064e3b"
          stroke="#10b981"
          strokeWidth={0.8}
        />
      ))}
      {tC.map((t, i) => (
        <polygon
          key={"C" + i}
          points={polyStr(t)}
          fill="#3b0764"
          stroke="#a78bfa"
          strokeWidth={0.8}
        />
      ))}
      {/* 가운데 점선 = 제거된 자리 */}
      <polygon
        points={`${rmx1},${rmy1} ${rmx2},${rmy2} ${rmx3},${rmy3}`}
        fill="#060f1a"
        stroke="#374151"
        strokeWidth={1.2}
        strokeDasharray="4 2"
      />
      <text x={192} y={115} textAnchor="middle" fontSize={9} fill="#c084fc">
        N = 3개 (가운데 없음!)
      </text>
    </svg>
  );
}

function DimDeriveCard() {
  return (
    <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-5">
      <div className="mb-3 text-base font-bold text-violet-200">
        🔍 시에르핀스키 삼각형 차원 계산 과정
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-slate-200">
        <DeriveStep label="①">
          크기를 <b className="text-amber-300">2배</b> 확대하면 자기 자신과 닮은
          복사본이 <b className="text-amber-300">3개</b> 생깁니다.
        </DeriveStep>
        <DeriveStep label="②">
          차원의 정의에 대입: <b>2ᴰ = 3</b>
        </DeriveStep>
        <DeriveStep label="③">
          양변에 로그 적용: <b>D · log 2 = log 3</b>
        </DeriveStep>
        <DeriveStep label="④">
          양변을 log 2로 나누기: <b>D = log 3 / log 2 = log₂3</b>
        </DeriveStep>
        <div className="rounded-md border-l-4 border-violet-400 bg-slate-900/60 px-3 py-2">
          ⑤ 계산 결과: D = log₂3 ≈{" "}
          <b className="text-violet-300 text-base">1.5849…</b> (1차원과 2차원
          사이!)
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        넓이는 0 이지만 선도 아닌 — 차원 ≈ 1.59 의 프랙털!
      </p>
    </div>
  );
}

function DeriveStep({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md bg-slate-900/40 px-3 py-2">
      <b className="mr-2 text-amber-300">{label}</b>
      {children}
    </div>
  );
}

const DIM_PRESETS = [
  { name: "선분", r: 2, n: 2 },
  { name: "정삼각형", r: 2, n: 4 },
  { name: "정사각형", r: 3, n: 9 },
  { name: "시에르핀스키", r: 2, n: 3 },
  { name: "멩거 스펀지", r: 3, n: 20 },
  { name: "코흐 곡선", r: 3, n: 4 },
];

function DimCalculator() {
  const [r, setR] = useState<number>(2);
  const [n, setN] = useState<number>(3);
  const [showResult, setShowResult] = useState(false);

  const valid = r > 1 && n >= 1;
  const d = valid ? Math.log(n) / Math.log(r) : 0;
  let interp = "";
  if (Math.abs(d - 1) < 0.001) interp = "→ 1차원 도형 (선)";
  else if (Math.abs(d - 2) < 0.001) interp = "→ 2차원 도형 (면)";
  else if (Math.abs(d - 3) < 0.001) interp = "→ 3차원 도형 (입체)";
  else if (d > 0 && d < 1)
    interp = `→ 프랙털! 점(0)과 선(1) 사이의 ${d.toFixed(3)} 차원`;
  else if (d > 1 && d < 2)
    interp = `→ 프랙털! 선(1)과 면(2) 사이의 ${d.toFixed(3)} 차원`;
  else if (d > 2 && d < 3)
    interp = `→ 프랙털! 면(2)과 입체(3) 사이의 ${d.toFixed(3)} 차원`;
  else interp = `→ ${d.toFixed(4)} 차원`;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-3 text-base font-bold text-white">
        🧮 프랙털 차원 계산기
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-300">배율 r =</span>
        <input
          type="number"
          value={r}
          min={1.01}
          step={0.5}
          onChange={(e) => setR(Number(e.target.value))}
          className="w-24 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-center text-slate-100"
          aria-label="r"
        />
        <span className="ml-2 text-slate-300">복사본 수 N =</span>
        <input
          type="number"
          value={n}
          min={2}
          step={1}
          onChange={(e) => setN(Number(e.target.value))}
          className="w-24 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-center text-slate-100"
          aria-label="N"
        />
        <button
          type="button"
          onClick={() => setShowResult(true)}
          className="rounded-md bg-violet-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-violet-400"
        >
          계산
        </button>
      </div>
      {showResult && valid ? (
        <div className="my-3 rounded-md border border-violet-400/30 bg-slate-900/60 p-3 text-center">
          <div className="text-sm text-slate-400">
            D = log {n} / log {r} =
          </div>
          <div className="my-1 text-3xl font-extrabold text-violet-300">
            {d.toFixed(4)}
          </div>
          <div className="text-xs text-slate-400">{interp}</div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <span className="text-slate-500">예시:</span>
        {DIM_PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => {
              setR(p.r);
              setN(p.n);
              setShowResult(true);
            }}
            className="rounded-md border border-white/10 bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function TableSection({
  title,
  vals,
}: {
  title: string;
  vals: readonly string[];
}) {
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    new Array(vals.length).fill(false),
  );
  function revealOne(i: number) {
    setRevealed((r) => {
      if (r[i]) return r;
      const next = r.slice();
      next[i] = true;
      return next;
    });
  }
  function revealAll() {
    setRevealed(new Array(vals.length).fill(true));
  }
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-3 text-base font-bold text-white">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="px-3 py-2">단계</th>
              {vals.map((_, i) => (
                <th key={i} className="px-3 py-2">
                  {i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-slate-900/40">
              <td className="px-3 py-2 font-bold text-slate-300">값</td>
              {vals.map((v, i) => (
                <td
                  key={i}
                  onClick={() => revealOne(i)}
                  className={
                    "cursor-pointer px-3 py-2 font-bold transition " +
                    (revealed[i]
                      ? "bg-amber-500/20 text-amber-200"
                      : "bg-slate-900/60 text-slate-500 hover:bg-slate-800")
                  }
                  aria-label={`n=${i} 값`}
                >
                  {revealed[i] ? v : "?"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={revealAll}
        className="mt-3 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-amber-400"
      >
        모두 보기
      </button>
    </div>
  );
}

// ─── 탭 4: 일반화 ─────────────────────────────────────────────
function FormulaTab() {
  return (
    <div className="space-y-4">
      <FCard
        title="🔢 삼각형의 개수"
        formula="aₙ = 3ⁿ"
        explain={
          <>
            단계 0: 1개 → 단계 1: 3개 → 단계 2: 9개 → …
            <br />
            매 단계마다 각 삼각형이 3개의 더 작은 삼각형으로 분열됩니다.
          </>
        }
        limit="n → ∞ 이면 aₙ → ∞ (삼각형 개수가 무한히 증가!)"
        limitColor="text-amber-300"
      />
      <FCard
        title="📐 삼각형의 넓이 (S₀ = 1)"
        formula="Sₙ = (3/4)ⁿ"
        explain={
          <>
            한 변이 1/2배 → 넓이는 (1/2)² ={" "}
            <b className="text-amber-300">1/4</b>배
            <br />
            개수는 <b className="text-amber-300">3</b>배 증가 → Sₙ = 3ⁿ ×
            (1/4)ⁿ = (3/4)ⁿ
            <br />
            단계 4: (3/4)⁴ = 81/256 ≈ 0.316
          </>
        }
        limit="n → ∞ 이면 Sₙ → 0 (넓이가 0에 수렴!)"
        limitColor="text-emerald-300"
      />
      <FCard
        title="📏 둘레의 합 (한 변의 길이 = 1)"
        formula="Pₙ = 3 × (3/2)ⁿ"
        explain={
          <>
            n단계: 한 변 = (1/2)ⁿ, 개수 = 3ⁿ
            <br />
            Pₙ = 3ⁿ × 3 × (1/2)ⁿ ={" "}
            <b className="text-amber-300">3 × (3/2)ⁿ</b>
            <br />
            단계 4: 3 × (3/2)⁴ = 243/16 ≈ 15.2
          </>
        }
        limit="n → ∞ 이면 Pₙ → ∞ (둘레가 무한히 증가!)"
        limitColor="text-rose-300"
      />
      <div className="rounded-xl border-2 border-violet-400/50 bg-violet-500/10 p-4 text-center">
        <div className="mb-2 text-base font-bold text-violet-200">
          🌀 프랙털 차원
        </div>
        <div className="rounded-md bg-slate-900/60 px-3 py-2 text-sm leading-7 text-slate-200">
          크기를 2배 확대 → 닮은 도형 3개 출현
          <br />
          <b className="text-amber-300">2ˣ = 3 ⟹ x = log₂3 ≈ 1.585</b>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          1차원(선): 2¹ = 2개, 2차원(면): 2² = 4개 → 시에르핀스키는 그 사이!
          <br />
          <b className="text-violet-300">
            프랙털 차원 ≈ 1.59 (선도 아니고 면도 아닌 사이의 세계)
          </b>
        </p>
      </div>
      <StepCalculator />
    </div>
  );
}

function FCard({
  title,
  formula,
  explain,
  limit,
  limitColor,
}: {
  title: string;
  formula: string;
  explain: React.ReactNode;
  limit: string;
  limitColor: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-2 text-base font-bold text-white">{title}</div>
      <div className="mb-3 rounded-md bg-slate-900/60 px-3 py-2 text-center text-xl font-extrabold text-amber-300">
        {formula}
      </div>
      <p className="mb-3 text-sm leading-relaxed text-slate-300">{explain}</p>
      <div className={"text-sm font-bold " + limitColor}>{limit}</div>
    </div>
  );
}

function StepCalculator() {
  const [n, setN] = useState<number>(5);
  const [shown, setShown] = useState(false);

  const safeN = Math.max(0, Math.min(30, Number.isFinite(n) ? Math.floor(n) : 0));
  const cnt = Math.pow(3, safeN);
  const area = Math.pow(3 / 4, safeN);
  const peri = 3 * Math.pow(3 / 2, safeN);

  const fmtCnt =
    cnt > 1e15
      ? cnt.toExponential(3) + " 개"
      : cnt.toLocaleString() + " 개";
  const fmtArea =
    area < 1e-12 ? area.toExponential(4) : area.toFixed(8).replace(/\.?0+$/, "");
  const fmtPeri =
    peri > 1e15
      ? peri.toExponential(3)
      : peri.toFixed(5).replace(/\.?0+$/, "");

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-3 text-base font-bold text-white">🧮 단계별 계산기</div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-300">단계 n =</span>
        <input
          type="number"
          value={n}
          min={0}
          max={30}
          onChange={(e) => setN(Number(e.target.value))}
          className="w-24 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-center text-slate-100"
          aria-label="단계 n"
        />
        <button
          type="button"
          onClick={() => setShown(true)}
          className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-amber-400"
        >
          계산하기
        </button>
      </div>
      {shown ? (
        <div className="space-y-1.5 rounded-md bg-slate-900/60 p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">개수:</span>
            <b className="text-sky-300">{fmtCnt}</b>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">넓이:</span>
            <b className="text-emerald-300">{fmtArea}</b>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">둘레의 합:</span>
            <b className="text-rose-300">{fmtPeri}</b>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── 탭 5: 퀴즈 ───────────────────────────────────────────────
type QuizQ = {
  q: string;
  choices: string[];
  answer: number;
  explain: string;
};

const SIER_QUIZ: QuizQ[] = [
  {
    q: "n단계에서 남아 있는 삼각형의 개수를 나타내는 식은?",
    choices: ["2ⁿ", "3ⁿ", "n²", "4ⁿ"],
    answer: 1,
    explain:
      "매 단계마다 각 삼각형이 3개로 분열됩니다. 0단계: 1=3⁰, 1단계: 3=3¹, 2단계: 9=3², …",
  },
  {
    q: "n단계 삼각형들의 넓이의 합은? (S₀ = 1)",
    choices: ["(1/2)ⁿ", "(2/3)ⁿ", "(3/4)ⁿ", "(3/2)ⁿ"],
    answer: 2,
    explain: "한 변이 1/2배 → 넓이 1/4배, 개수 3배 → Sₙ = 3ⁿ×(1/4)ⁿ = (3/4)ⁿ",
  },
  {
    q: "4단계에서 삼각형의 개수는?",
    choices: ["27개", "64개", "81개", "256개"],
    answer: 2,
    explain: "3⁴ = 81 개",
  },
  {
    q: "단계가 무한히 커질 때 시에르핀스키 삼각형의 넓이는?",
    choices: ["무한히 증가", "1에 수렴", "0에 수렴", "3에 수렴"],
    answer: 2,
    explain:
      "Sₙ = (3/4)ⁿ 이고 3/4 < 1 이므로 n→∞ 일 때 0에 수렴. 넓이가 사라집니다!",
  },
  {
    q: "단계가 무한히 커질 때 삼각형들의 둘레의 합은?",
    choices: ["0에 수렴", "3에 수렴", "무한히 증가", "변하지 않음"],
    answer: 2,
    explain:
      "Pₙ = 3×(3/2)ⁿ 이고 3/2 > 1 이므로 n→∞ 일 때 ∞로 발산. 길이가 무한히 길어집니다!",
  },
  {
    q: "시에르핀스키 삼각형의 프랙털 차원 (소수 둘째 자리 근사) 은?",
    choices: ["약 1.00", "약 1.26", "약 1.59", "약 2.00"],
    answer: 2,
    explain:
      "크기 2배 확대 → 자기 복사본 3개. 2ˣ = 3 → x = log₂3 ≈ 1.585. 1차원과 2차원 사이!",
  },
  {
    q: "3단계에서 각 작은 삼각형 한 변의 길이는? (처음 한 변 = 1)",
    choices: ["1/4", "1/6", "1/8", "1/9"],
    answer: 2,
    explain: "각 단계마다 변의 길이가 1/2배. 3단계 → (1/2)³ = 1/8",
  },
  {
    q: "시에르핀스키 삼각형에서 넓이와 둘레가 보이는 행동으로 맞는 것은?",
    choices: [
      "넓이 → ∞, 둘레 → 0",
      "넓이 → 0, 둘레 → ∞",
      "둘 다 0에 수렴",
      "둘 다 무한히 증가",
    ],
    answer: 1,
    explain:
      "넓이는 (3/4)ⁿ→0, 둘레는 3×(3/2)ⁿ→∞. 넓이가 0인데 둘레는 무한한 역설적 도형!",
  },
];

function QuizTab() {
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    new Array(SIER_QUIZ.length).fill(null),
  );

  function answer(qi: number, ci: number) {
    setAnswers((a) => {
      if (a[qi] !== null) return a;
      const next = a.slice();
      next[qi] = ci;
      return next;
    });
  }

  const answered = answers.filter((a) => a !== null).length;
  const correct = answers.reduce<number>(
    (acc, a, i) => acc + (a !== null && a === SIER_QUIZ[i].answer ? 1 : 0),
    0,
  );
  const allDone = answered === SIER_QUIZ.length;
  const ratio = answered > 0 ? correct / SIER_QUIZ.length : 0;
  let msg = "문제를 풀어보세요!";
  if (allDone) {
    if (ratio === 1) msg = "🏆 만점! 시에르핀스키 마스터!";
    else if (ratio >= 0.75) msg = "👍 훌륭해요! 거의 다 맞췄어요!";
    else if (ratio >= 0.5) msg = "🙂 절반 이상! 다시 한 번 도전해봐요.";
    else msg = "💪 다시 풀어보면서 개념을 익혀봐요.";
  } else if (answered > 0) msg = `${answered} / ${SIER_QUIZ.length} 문제 진행 중`;

  return (
    <div className="space-y-3">
      {SIER_QUIZ.map((q, qi) => {
        const chosen = answers[qi];
        const done = chosen !== null;
        const isCorrect = done && chosen === q.answer;
        return (
          <div
            key={qi}
            className={
              "rounded-xl border-2 p-4 transition " +
              (done
                ? isCorrect
                  ? "border-emerald-400/50 bg-emerald-500/10"
                  : "border-rose-400/50 bg-rose-500/10"
                : "border-white/10 bg-slate-900/40")
            }
          >
            <div className="mb-1 text-xs font-bold text-purple-300">
              문제 {qi + 1} / {SIER_QUIZ.length}
            </div>
            <div className="mb-3 text-sm font-bold text-white">{q.q}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.choices.map((ch, ci) => {
                const marks = ["①", "②", "③", "④"];
                let cls =
                  "border border-white/10 bg-slate-900 text-slate-200 hover:bg-slate-800";
                if (done) {
                  if (ci === q.answer) {
                    cls = "border-emerald-400/60 bg-emerald-500/20 text-emerald-200";
                  } else if (ci === chosen) {
                    cls = "border-rose-400/60 bg-rose-500/20 text-rose-200";
                  } else {
                    cls = "border-white/10 bg-slate-900/40 text-slate-500";
                  }
                }
                return (
                  <button
                    key={ci}
                    type="button"
                    disabled={done}
                    onClick={() => answer(qi, ci)}
                    className={
                      "rounded-md px-3 py-2 text-left text-sm font-semibold transition " +
                      cls +
                      (done ? " cursor-not-allowed" : " cursor-pointer")
                    }
                  >
                    {marks[ci]} {ch}
                  </button>
                );
              })}
            </div>
            {done ? (
              <div
                className={
                  "mt-2 rounded-md p-2 text-sm " +
                  (isCorrect
                    ? "bg-emerald-500/15 text-emerald-100"
                    : "bg-rose-500/15 text-rose-100")
                }
              >
                {isCorrect ? "✅ 정답! " : "❌ 오답. "}
                {q.explain}
              </div>
            ) : null}
          </div>
        );
      })}
      <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 p-4 text-center">
        <div className="text-3xl font-extrabold text-purple-300">
          {answered > 0 ? `${correct} / ${SIER_QUIZ.length}` : "—"}
        </div>
        <div className="mt-1 text-sm text-purple-200">{msg}</div>
      </div>
    </div>
  );
}
