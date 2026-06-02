"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "cycle_reason",
    prompt:
      "i 의 거듭제곱이 주기 4 (i → −1 → −i → 1 → i → …) 로 순환하는 이유를, i² = −1 을 사용해 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: i¹ = i, i² = −1, i³ = i²·i = −i, i⁴ = i²·i² = (−1)·(−1) = 1. i⁴ = 1 이므로 i⁴ⁿ⁺ᵏ = (i⁴)ⁿ·iᵏ = iᵏ. 따라서 지수가 4 늘어날 때마다 같은 값으로 돌아온다.",
  },
  {
    id: "geometric_meaning",
    prompt:
      "복소평면에서 i 를 곱하는 것이 어떤 기하학적 의미를 갖는지 설명하고, i⁴ = 1 이 되는 이유를 기하학적으로(회전 각도와 연결하여) 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 복소수에 i 를 곱하면 원점을 중심으로 반시계방향 90° 회전한다. i 를 4번 곱하면 90° × 4 = 360° 회전하여 제자리로 돌아오므로 i⁴ = 1 이다.",
  },
];

// ─── 표기 ───────────────────────────────────────────────────
function I() {
  return <em className="font-serif italic text-pink-300">i</em>;
}

const SUP_DIGIT: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "-": "⁻",
};
function supText(n: number | string): string {
  return String(n).split("").map((c) => SUP_DIGIT[c] ?? c).join("");
}

// i 거듭제곱 표기용 4 값
type IVal = "i" | "-1" | "-i" | "1";
const IVAL_LABEL: Record<IVal, ReactNode> = {
  i: <I />,
  "-1": "−1",
  "-i": (
    <>
      −<I />
    </>
  ),
  "1": "1",
};
function ivalAt(power: number): IVal {
  const r = ((power % 4) + 4) % 4;
  return r === 0 ? "1" : r === 1 ? "i" : r === 2 ? "-1" : "-i";
}

const IVALS_LIST: IVal[] = ["i", "-1", "-i", "1"];

// ─── 메인 ───────────────────────────────────────────────────
type TabId = "t1" | "t2" | "t3" | "t4" | "t5" | "t6";

const TABS: { id: TabId; label: string }[] = [
  { id: "t1", label: "📋 순환표" },
  { id: "t2", label: "🧭 나침반" },
  { id: "t3", label: "➕ 합 탐구" },
  { id: "t4", label: "✨ 신기한 성질" },
  { id: "t5", label: "⚡ 큰 지수 계산기" },
  { id: "t6", label: "🎯 도전 미션" },
];

export default function ImaginaryUnitCycle() {
  const [tab, setTab] = useState<TabId>("t1");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* ─── 헤더 ─── */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🔄 허수단위 i 의 순환 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          허수단위 <I /> 는 곱할 때마다{" "}
          <b className="text-cyan-200">
            <I />
            <sup>1</sup> → <I />
            <sup>2</sup> = −1 → <I />
            <sup>3</sup> = −<I />→ <I />
            <sup>4</sup> = 1 → …
          </b>{" "}
          로 순환합니다. 주기 4 의 성질을 표·나침반·합·계산기·미션으로 직접 탐구해 봅시다.
        </p>
      </div>

      {/* 탭 바 */}
      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              "rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition " +
              (tab === t.id
                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 각 탭은 마운트 유지, display 만 토글하여 진행 상태 보존 */}
      <div className={tab === "t1" ? "mt-5" : "mt-5 hidden"}>
        <Tab1CycleTable />
      </div>
      <div className={tab === "t2" ? "mt-5" : "mt-5 hidden"}>
        <Tab2Compass />
      </div>
      <div className={tab === "t3" ? "mt-5" : "mt-5 hidden"}>
        <Tab3SumExplorer />
      </div>
      <div className={tab === "t4" ? "mt-5" : "mt-5 hidden"}>
        <Tab4Properties />
      </div>
      <div className={tab === "t5" ? "mt-5" : "mt-5 hidden"}>
        <Tab5ModCalc />
      </div>
      <div className={tab === "t6" ? "mt-5" : "mt-5 hidden"}>
        <Tab6Missions />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 공통 — 셀션 헤더 ──────────────────────────────────────
function SecHeader({ title, desc }: { title: ReactNode; desc?: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-extrabold text-violet-200">{title}</p>
      {desc ? <p className="mt-1 text-sm leading-7 text-slate-300">{desc}</p> : null}
    </div>
  );
}

// ─── TAB 1 — 순환표 채우기 ──────────────────────────────────
type CellState = "given" | "empty" | "correct" | "wrong";
type TableCell = { exp: number; ans: IVal; state: CellState };

const GIVEN: Record<number, IVal> = { 1: "i", 2: "-1", 3: "-i" };

function makeInitialCells(): TableCell[] {
  return Array.from({ length: 12 }, (_, i) => {
    const exp = i + 1;
    const ans = ivalAt(exp);
    const isGiven = exp in GIVEN;
    return {
      exp,
      ans,
      state: isGiven ? "given" : "empty",
    };
  });
}

function Tab1CycleTable() {
  const [cells, setCells] = useState<TableCell[]>(makeInitialCells);
  const [pick, setPick] = useState<IVal | null>(null);
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);

  const filled = cells.filter((c) => c.state === "correct").length;
  const remaining = 9 - filled;
  const done = filled === 9;

  function onCellClick(idx: number) {
    const c = cells[idx];
    if (c.state !== "empty") return;
    if (!pick) {
      setShakeIdx(idx);
      window.setTimeout(() => setShakeIdx(null), 700);
      return;
    }
    if (pick === c.ans) {
      setCells((arr) => arr.map((x, i) => (i === idx ? { ...x, state: "correct" } : x)));
    } else {
      setCells((arr) => arr.map((x, i) => (i === idx ? { ...x, state: "wrong" } : x)));
      window.setTimeout(() => {
        setCells((arr) => arr.map((x, i) => (i === idx && x.state === "wrong" ? { ...x, state: "empty" } : x)));
      }, 480);
    }
  }

  function reset() {
    setCells(makeInitialCells());
    setPick(null);
  }

  return (
    <div className="space-y-4">
      <SecHeader
        title="📋 미션 1 · 순환표 채우기"
        desc={
          <>
            먼저 채울 값을 선택한 뒤, 빈 칸을 클릭해 채워 보세요. 처음 3 개는 힌트로 주어져 있습니다.
          </>
        }
      />

      {/* 채울 값 선택 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-cyan-200">채울 값 →</span>
        {IVALS_LIST.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setPick(v)}
            className={
              "min-w-[58px] rounded-lg border-2 px-3 py-1.5 text-base font-extrabold transition " +
              (pick === v
                ? "border-cyan-400 bg-cyan-400/25 text-cyan-50 ring-4 ring-cyan-300/60"
                : "border-violet-400/40 bg-violet-400/10 text-violet-100 hover:border-violet-300 hover:bg-violet-400/20")
            }
          >
            {IVAL_LABEL[v]}
          </button>
        ))}
        <button
          type="button"
          onClick={reset}
          className="ml-auto rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
        >
          ↻ 초기화
        </button>
      </div>

      {/* 순환표 */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-1">
          <thead>
            <tr>
              {cells.map((c) => (
                <th
                  key={c.exp}
                  className="rounded-md border border-violet-400/30 bg-violet-400/10 px-2 py-1 text-center text-xs font-bold text-violet-100"
                >
                  <I />
                  <sup>{c.exp}</sup>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {cells.map((c, idx) => {
                const base =
                  "rounded-md border-2 px-2 py-2 text-center text-base font-extrabold transition cursor-pointer ";
                let cls = base;
                let content: ReactNode = "";
                if (c.state === "given") {
                  cls += "border-amber-400/50 bg-amber-400/20 text-amber-100 cursor-default";
                  content = IVAL_LABEL[c.ans];
                } else if (c.state === "correct") {
                  cls += "border-emerald-400/55 bg-emerald-400/20 text-emerald-100 cursor-default";
                  content = IVAL_LABEL[c.ans];
                } else if (c.state === "wrong") {
                  cls += "border-rose-400/60 bg-rose-400/20 text-rose-100";
                  content = "✗";
                } else {
                  cls += "border-violet-400/30 bg-violet-400/5 text-violet-200 hover:bg-violet-400/15";
                  if (shakeIdx === idx) cls += " ring-4 ring-amber-300/60";
                }
                return (
                  <td key={c.exp} className={cls} onClick={() => onCellClick(idx)}>
                    {content}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-sm font-bold text-cyan-200">
        {done ? "✅ 모든 칸 완성! 아래에서 패턴을 확인하세요." : `빈 칸 ${remaining}개 남았습니다.`}
        {!pick && !done ? (
          <span className="ml-2 text-xs font-normal text-amber-300">⚠️ 먼저 채울 값을 선택하세요.</span>
        ) : null}
      </p>

      {done ? (
        <div className="rounded-xl border border-violet-400/40 bg-violet-400/10 p-4 text-sm leading-7 text-violet-100">
          🎉 <b>완성!</b> 패턴이 보이나요?
          <br />
          <br />
          <I />
          <sup>4</sup> = 1 이므로 지수가 4 만큼 커질 때마다{" "}
          <b>원래 값으로 돌아옵니다 (주기 = 4)</b>.
          <br />
          따라서 <I />
          <sup>n</sup> 의 값은 <b>n 을 4 로 나눈 나머지</b>에 따라 결정됩니다.
          <br />
          <br />
          • 나머지가 1 이면 → <I />
          <br />
          • 나머지가 2 이면 → −1
          <br />
          • 나머지가 3 이면 → −<I />
          <br />
          • 나머지가 0 이면 (4 의 배수) → 1
        </div>
      ) : null}
    </div>
  );
}

// ─── TAB 2 — 나침반 (SVG) ──────────────────────────────────
type CompassDir = { label: ReactNode; x: number; y: number; descr: string };
const COMPASS_DIRS: CompassDir[] = [
  { label: <>1</>, x: 1, y: 0, descr: "→ 오른쪽 (실수축 +)" },
  { label: <I />, x: 0, y: 1, descr: "↑ 위쪽 (허수축 +)" },
  { label: <>−1</>, x: -1, y: 0, descr: "← 왼쪽 (실수축 −)" },
  {
    label: (
      <>
        −<I />
      </>
    ),
    x: 0,
    y: -1,
    descr: "↓ 아래쪽 (허수축 −)",
  },
];

function Tab2Compass() {
  const [cPow, setCPow] = useState(0);
  const r = ((cPow % 4) + 4) % 4;

  // SVG 좌표: 240×240 viewBox, 중심 (120,120), 반지름 84
  const R = 84;
  const cx = 120;
  const cy = 120;
  const cur = COMPASS_DIRS[r];
  const tipX = cx + cur.x * R;
  const tipY = cy - cur.y * R;

  return (
    <div className="space-y-4">
      <SecHeader
        title={
          <>
            🧭 미션 2 · <I /> 의 나침반 — 복소평면에서 90° 회전
          </>
        }
        desc={
          <>
            복소평면에서 <I /> 를 한 번 곱하면 <b>반시계방향으로 90° 회전</b>합니다. 버튼을 눌러 1
            에서 출발해 <I /> 를 차례로 곱해 보세요.
          </>
        }
      />

      <div className="grid items-start gap-5 sm:grid-cols-[auto_1fr]">
        {/* SVG 나침반 */}
        <div className="mx-auto sm:mx-0">
          <svg
            viewBox="0 0 240 240"
            className="h-60 w-60"
            role="img"
            aria-label={`나침반: 현재 i의 ${cPow}제곱 = ${
              r === 0 ? "1" : r === 1 ? "i" : r === 2 ? "−1" : "−i"
            }`}
          >
            <defs>
              <radialGradient id="iucBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(124,58,237,0.10)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="240" height="240" fill="url(#iucBg)" />
            {/* 축 */}
            <line x1={cx - R - 22} y1={cy} x2={cx + R + 22} y2={cy} stroke="rgba(150,100,255,0.28)" strokeWidth="1" />
            <line x1={cx} y1={cy - R - 22} x2={cx} y2={cy + R + 22} stroke="rgba(150,100,255,0.28)" strokeWidth="1" />
            {/* 원 */}
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(150,100,255,0.35)" strokeWidth="1.5" />
            {/* 4 점 */}
            {COMPASS_DIRS.map((d, i) => (
              <circle
                key={i}
                cx={cx + d.x * R}
                cy={cy - d.y * R}
                r={5}
                fill={i === r ? "#a78bfa" : "rgba(150,100,255,0.3)"}
              />
            ))}
            {/* 화살표 */}
            <line x1={cx} y1={cy} x2={tipX} y2={tipY} stroke="#22d3ee" strokeWidth="2.5" />
            <circle cx={tipX} cy={tipY} r={9} fill="#22d3ee" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" />
            {/* 축 라벨 */}
            <text x={cx + R + 14} y={cy + 4} fontSize="10" fill="rgba(160,130,255,0.7)" textAnchor="middle">
              +실수
            </text>
            <text x={cx - R - 14} y={cy + 4} fontSize="10" fill="rgba(160,130,255,0.7)" textAnchor="middle">
              −실수
            </text>
            <text x={cx} y={cy - R - 10} fontSize="10" fill="rgba(160,130,255,0.7)" textAnchor="middle">
              +허수
            </text>
            <text x={cx} y={cy + R + 16} fontSize="10" fill="rgba(160,130,255,0.7)" textAnchor="middle">
              −허수
            </text>
          </svg>
          <div className="mt-3 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setCPow((p) => p + 1)}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
            >
              × <I /> 곱하기
            </button>
            <button
              type="button"
              onClick={() => setCPow(0)}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
            >
              ↺ 초기화
            </button>
          </div>
        </div>

        {/* 정보 */}
        <div className="space-y-3">
          <p className="rounded-xl border border-cyan-400/45 bg-cyan-400/10 px-4 py-2 text-center font-mono text-base font-extrabold text-cyan-100">
            {cPow === 0 ? (
              <>
                시작: 1 (<I />
                <sup>0</sup>)
              </>
            ) : (
              <>
                <I />
                <sup>{cPow}</sup> = {IVAL_LABEL[ivalAt(cPow)]}
              </>
            )}
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {COMPASS_DIRS.map((d, i) => (
              <div
                key={i}
                className={
                  "rounded-xl border px-3 py-2 transition " +
                  (i === r
                    ? "border-violet-400/55 bg-violet-400/15 text-violet-50"
                    : "border-white/10 bg-white/5 text-slate-300")
                }
              >
                <p className="text-xs font-bold text-violet-200">
                  <I />
                  <sup>{i}</sup> = {i === 0 ? "1" : i === 1 ? <I /> : i === 2 ? "−1" : (<>−<I /></>)}
                </p>
                <p className="text-sm font-semibold">{d.descr}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3 text-sm leading-7 text-slate-200">
            💡 <b>핵심:</b> <I /> 를 한 번 곱할 때마다 90° 반시계 회전!
            <br />
            4 번 곱하면 360° 회전 → 제자리 → <I />
            <sup>4</sup> = 1
            <br />
            <br />
            이것이 바로 <b>주기 4</b> 의 기하학적 의미입니다.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 3 — 합 탐구 ──────────────────────────────────────
type CNum = [number, number]; // [real, imag]
function addC(a: CNum, b: CNum): CNum {
  return [a[0] + b[0], a[1] + b[1]];
}
const INUM: Record<IVal, CNum> = {
  i: [0, 1],
  "-1": [-1, 0],
  "-i": [0, -1],
  "1": [1, 0],
};
function cNumLabel(c: CNum): ReactNode {
  if (c[0] === 0 && c[1] === 0) return "0";
  if (c[0] === 0) {
    if (c[1] === 1) return <I />;
    if (c[1] === -1)
      return (
        <>
          −<I />
        </>
      );
    return (
      <>
        {c[1]}
        <I />
      </>
    );
  }
  if (c[1] === 0) return String(c[0]);
  const sign = c[1] > 0 ? " + " : " − ";
  const im = Math.abs(c[1]);
  const imLabel = im === 1 ? <I /> : (<>{im}<I /></>);
  return (
    <>
      {c[0]}
      {sign}
      {imLabel}
    </>
  );
}

function Tab3SumExplorer() {
  const [n, setN] = useState(8);
  const [q100Picked, setQ100Picked] = useState<string | null>(null);

  const { sum, full, rem, pattern } = useMemo(() => {
    let s: CNum = [0, 0];
    for (let k = 1; k <= n; k++) s = addC(s, INUM[IVALS_LIST[(k - 1) % 4]]);
    const f = Math.floor(n / 4);
    const r = n % 4;
    let p: string;
    if (r === 0) p = `4 로 나눈 나머지가 0 (4 의 배수) → 완전한 묶음 ${f} 개 → 합 = 0`;
    else if (r === 1) p = "4 로 나눈 나머지가 1 → 남는 항 i → 합 = i";
    else if (r === 2) p = "4 로 나눈 나머지가 2 → 남는 항 i + (−1) → 합 = −1";
    else p = "4 로 나눈 나머지가 3 → 남는 항 i + (−1) + (−i) → 합 = −i";
    return { sum: s, full: f, rem: r, pattern: p };
  }, [n]);

  return (
    <div className="space-y-4">
      <SecHeader
        title={
          <>
            ➕ 미션 3 · <I /> 의 합 탐구기
          </>
        }
        desc={
          <>
            슬라이더를 움직여 <I /> + <I />
            <sup>2</sup> + … + <I />
            <sup>n</sup> 의 값을 탐구하세요. 연속 4 개씩 묶으면 패턴이 보입니다!
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="iucNSlider" className="block text-sm font-bold text-cyan-200">
            n = <span className="font-mono text-base text-cyan-50">{n}</span>
          </label>
          <input
            id="iucNSlider"
            type="range"
            min={1}
            max={20}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="w-full accent-violet-400"
          />
          <p className="text-xs text-slate-400">1 ~ 20 사이 탐구 (4 의 배수를 꼭 확인!)</p>
          <div className="rounded-xl border border-violet-400/30 bg-violet-400/5 p-3 text-sm leading-7 text-violet-100">
            🔍 <b>규칙:</b> {pattern}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-bold text-violet-200">
            <I /> + <I />
            <sup>2</sup> + … + <I />
            <sup>{n}</sup>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {Array.from({ length: full }, (_, g) => (
              <span key={g} className="flex items-center gap-1">
                {g > 0 ? <span className="text-violet-300">+</span> : null}
                <span className="rounded-md border border-violet-400/35 bg-violet-400/15 px-2 py-1 text-xs font-bold text-violet-100">
                  (i − 1 − i + 1)
                </span>
              </span>
            ))}
            {rem > 0 ? (
              <span className="flex items-center gap-1">
                {full > 0 ? <span className="text-violet-300">+</span> : null}
                <span className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-100">
                  ({Array.from({ length: rem }, (_, k) => {
                    const v = IVALS_LIST[k % 4];
                    return v === "i" ? "i" : v === "-1" ? "−1" : v === "-i" ? "−i" : "1";
                  }).join(" + ")}) ← 나머지 {rem} 개
                </span>
              </span>
            ) : null}
            {full === 0 && rem === 0 ? (
              <span className="rounded-md border border-violet-400/35 bg-violet-400/15 px-2 py-1 text-xs font-bold text-violet-100">
                (항 없음)
              </span>
            ) : null}
          </div>
          <p className="mt-3 rounded-xl border border-cyan-400/45 bg-cyan-400/10 px-4 py-2 text-center font-mono text-base font-extrabold text-cyan-100">
            = {cNumLabel(sum)}
          </p>
        </div>
      </div>

      {/* 핵심 문제 i^100 */}
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
        <p className="text-sm font-extrabold text-amber-100">
          🏆 핵심 문제: <I /> + <I />
          <sup>2</sup> + <I />
          <sup>3</sup> + … + <I />
          <sup>100</sup> = ?
        </p>
        <p className="mt-1 text-sm leading-7 text-amber-50">
          슬라이더에서 n = 4, 8, 12, 16, 20 일 때의 합을 확인하고 패턴을 찾아 답하세요. 100 = 4 × 25
          라는 사실을 활용해 보세요.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["0", "1", "i", "-1"] as const).map((v) => {
            const correct = v === "0";
            const picked = q100Picked === v;
            const showCorrect = q100Picked !== null && correct;
            const showWrong = picked && !correct;
            return (
              <button
                key={v}
                type="button"
                disabled={q100Picked !== null}
                onClick={() => setQ100Picked(v)}
                className={
                  "min-w-[60px] rounded-xl border-2 px-4 py-2 text-base font-extrabold transition disabled:cursor-default " +
                  (showCorrect
                    ? "border-emerald-400 bg-emerald-400/25 text-emerald-100 ring-4 ring-emerald-300/60"
                    : showWrong
                    ? "border-rose-400 bg-rose-400/25 text-rose-100 ring-4 ring-rose-300/60"
                    : "border-amber-400/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20")
                }
              >
                {v === "i" ? <I /> : v === "-1" ? "−1" : v}
              </button>
            );
          })}
        </div>
        {q100Picked ? (
          <p
            className={
              "mt-3 text-sm font-bold " + (q100Picked === "0" ? "text-emerald-200" : "text-rose-200")
            }
          >
            {q100Picked === "0"
              ? "✅ 정답! 100 ÷ 4 = 25 나머지 0 → 25 개의 완전한 묶음 → 합 = 0"
              : "❌ 슬라이더에서 n = 4, 8, 12 일 때 합을 다시 확인해 보세요!"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ─── TAB 4 — 신기한 성질 ───────────────────────────────────
function Tab4Properties() {
  return (
    <div className="space-y-4">
      <SecHeader title={<>✨ <I /> 의 신기한 성질 모음</>} />
      <div className="grid gap-3 sm:grid-cols-2">
        <PropCard
          icon="🔁"
          title={<>역수도 <I /> 의 거듭제곱!</>}
          body={
            <>
              1/<I /> = −<I /> 입니다. 분자·분모에 <I /> 를 곱하면:
              <br />
              <Pill>
                1/<I /> = <I />/<I />
                <sup>2</sup> = <I />/(−1) = −<I />
              </Pill>
              <br />
              즉 <I />
              <sup>−1</sup> = −<I /> = <I />
              <sup>3</sup> → 주기 4 그대로 성립!
            </>
          }
        />
        <PropCard
          icon="🌀"
          title="연속 4 개의 합은 항상 0"
          body={
            <>
              어떤 자연수 k 에 대해서도
              <br />
              <Pill>
                <I />
                <sup>k</sup> + <I />
                <sup>k+1</sup> + <I />
                <sup>k+2</sup> + <I />
                <sup>k+3</sup> = 0
              </Pill>
              <br />
              <I />
              <sup>k</sup> 으로 묶으면 <I />
              <sup>k</sup>(1 + <I /> − 1 − <I />) = <I />
              <sup>k</sup> · 0 = 0
            </>
          }
        />
        <PropCard
          icon="💎"
          title={<><I /> 는 x⁴ = 1 의 허수 근</>}
          body={
            <>
              <I />, −1, −<I />, 1 은 모두 x⁴ = 1 의 해입니다.
              <br />
              <Pill>x⁴ − 1 = 0</Pill> 의 4 개의 근이
              <br />
              복소평면에서 <b>정사각형</b>을 이룹니다!
            </>
          }
        />
        <PropCard
          icon="⚡"
          title={<>(1 + <I />) 를 반복 곱하면?</>}
          body={
            <>
              (1 + <I />)<sup>2</sup> = 2<I />, &nbsp; (1 + <I />)<sup>4</sup> = −4
              <br />
              <Pill>
                (1 + <I />)<sup>8</sup> = 16
              </Pill>
              <br />
              8 번 곱하면 다시 실수! 복소 회전의 묘미입니다.
            </>
          }
        />
      </div>
    </div>
  );
}

function PropCard({ icon, title, body }: { icon: string; title: ReactNode; body: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xl">{icon}</p>
      <p className="mt-1 text-sm font-extrabold text-violet-200">{title}</p>
      <div className="mt-2 text-sm leading-7 text-slate-200">{body}</div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-md border border-violet-400/40 bg-violet-400/15 px-2 py-0.5 text-violet-50">
      {children}
    </span>
  );
}

// ─── TAB 5 — 큰 지수 계산기 ────────────────────────────────
function Tab5ModCalc() {
  const [raw, setRaw] = useState("2023");
  const n = Number(raw);
  const valid = raw.trim() !== "" && Number.isInteger(n);
  const r = valid ? ((n % 4) + 4) % 4 : null;
  const result: IVal | null = r === null ? null : ivalAt(n);

  return (
    <div className="space-y-4">
      <SecHeader
        title={
          <>
            ⚡ 미션 4 · 어떤 지수든 바로 계산하기
          </>
        }
        desc={
          <>
            <I />
            <sup>n</sup> 의 값은 <b>n 을 4 로 나눈 나머지</b>만 알면 바로 구할 수 있습니다. 아무
            정수나 입력해 보세요. 음수 지수도 도전!
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <label htmlFor="iucModInp" className="block text-sm font-bold text-violet-200">
            지수 n 입력 (정수, 음수 가능)
          </label>
          <input
            id="iucModInp"
            type="number"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="mt-2 w-full rounded-lg border-2 border-violet-400/40 bg-violet-400/10 px-3 py-2 text-center font-mono text-lg font-bold text-violet-100 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-300/40"
          />
          <p className="mt-2 text-xs text-slate-400">예: 101, 2023, −5, 1000, 4000001 ...</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-bold text-violet-200">계산 과정</p>
          {valid ? (
            <div className="mt-2 space-y-1 text-sm leading-7 text-slate-200">
              <p>n = {n}</p>
              <p>
                |n| = {Math.abs(n)} ÷ 4 = {Math.floor(Math.abs(n) / 4)} 나머지{" "}
                <b className="text-cyan-200">{r}</b>
              </p>
              <p>
                → <I />
                <sup>{n}</sup> = (<I />
                <sup>4</sup>)<sup>□</sup> · <I />
                <sup>{r}</sup> = 1 · <I />
                <sup>{r}</sup>
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-amber-200">정수를 입력해 주세요.</p>
          )}
          <p className="mt-3 rounded-xl border border-cyan-400/45 bg-cyan-400/10 px-4 py-2 text-center font-mono text-base font-extrabold text-cyan-100">
            {result ? (
              <>
                <I />
                <sup>{n}</sup> = {IVAL_LABEL[result]}
              </>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-violet-400/30 bg-violet-400/5 p-4">
        <p className="text-sm font-bold text-violet-200">📌 핵심 규칙 정리</p>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
          {[
            { r: 1, v: <I />, label: "나머지 1" },
            { r: 2, v: "−1", label: "나머지 2" },
            { r: 3, v: (<>−<I /></>), label: "나머지 3" },
            { r: 0, v: "1", label: "나머지 0" },
          ].map((d) => (
            <div key={d.r} className="rounded-lg border border-violet-400/30 bg-violet-400/10 px-2 py-2">
              <p className="text-xs text-violet-200">{d.label}</p>
              <p className="mt-1 text-lg font-extrabold text-violet-50">{d.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 6 — 도전 미션 ────────────────────────────────────
type Mission = {
  q: ReactNode;
  choices: { label: ReactNode; key: string }[];
  correct: string;
  explain: ReactNode;
};

const MISSIONS: Mission[] = [
  {
    q: (
      <>
        <I />
        <sup>2023</sup> 의 값은?
      </>
    ),
    choices: [
      { label: <I />, key: "i" },
      { label: "−1", key: "-1" },
      { label: (<>−<I /></>), key: "-i" },
      { label: "1", key: "1" },
    ],
    correct: "-i",
    explain: (
      <>
        2023 ÷ 4 = 505 … 나머지 <b>3</b>
        <br />
        → 나머지가 3 이므로 <I />
        <sup>2023</sup> = <I />
        <sup>3</sup> = <b>−<I /></b>
      </>
    ),
  },
  {
    q: (
      <>
        <I /> + <I />
        <sup>2</sup> + <I />
        <sup>3</sup> + <I />
        <sup>4</sup> + <I />
        <sup>5</sup> = ?
      </>
    ),
    choices: [
      { label: "0", key: "0" },
      { label: <I />, key: "i" },
      { label: "−1", key: "-1" },
      { label: "1", key: "1" },
    ],
    correct: "i",
    explain: (
      <>
        앞 4 개의 합 (<I /> + (−1) + (−<I />) + 1) = 0, 남은 항 <I />
        <sup>5</sup> = <I />
        <br />→ 합 = 0 + <I /> = <I />
      </>
    ),
  },
  {
    q: (
      <>
        <I />
        <sup>−5</sup> 의 값은? <span className="text-xs text-slate-400">(힌트: −5 를 4 로 나눈 나머지)</span>
      </>
    ),
    choices: [
      { label: <I />, key: "i" },
      { label: "−1", key: "-1" },
      { label: (<>−<I /></>), key: "-i" },
      { label: "1", key: "1" },
    ],
    correct: "-i",
    explain: (
      <>
        −5 = (−2) × 4 + 3 → 나머지 <b>3</b>
        <br />
        → 나머지가 3 이므로 <I />
        <sup>−5</sup> = <I />
        <sup>3</sup> = <b>−<I /></b>
        <br />
        검산: 1/<I />
        <sup>5</sup> = 1/<I /> = <I />/<I />
        <sup>2</sup> = <I />/(−1) = −<I /> ✓
      </>
    ),
  },
  {
    q: (
      <>
        (1 + <I />)<sup>4</sup> 의 값은?{" "}
        <span className="text-xs text-slate-400">(힌트: (1 + <I />)² 을 먼저 전개)</span>
      </>
    ),
    choices: [
      { label: "4", key: "4" },
      { label: "−4", key: "-4" },
      { label: (<>4<I /></>), key: "4i" },
      { label: (<>2<I /></>), key: "2i" },
    ],
    correct: "-4",
    explain: (
      <>
        (1 + <I />)<sup>2</sup> = 1 + 2<I /> + <I />
        <sup>2</sup> = 1 + 2<I /> − 1 = 2<I />
        <br />→ (1 + <I />)<sup>4</sup> = (2<I />)<sup>2</sup> = 4<I />
        <sup>2</sup> = 4 × (−1) = <b>−4</b>
      </>
    ),
  },
  {
    q: (
      <>
        n 이 자연수일 때, <I />
        <sup>4n + 2</sup> 의 값은?
      </>
    ),
    choices: [
      { label: <I />, key: "i" },
      { label: "−1", key: "-1" },
      { label: (<>−<I /></>), key: "-i" },
      { label: "1", key: "1" },
    ],
    correct: "-1",
    explain: (
      <>
        4n + 2 를 4 로 나누면 나머지는 항상 <b>2</b>
        <br />
        <I />
        <sup>4n</sup> = (<I />
        <sup>4</sup>)<sup>n</sup> = 1<sup>n</sup> = 1
        <br />→ <I />
        <sup>4n + 2</sup> = <I />
        <sup>4n</sup> · <I />
        <sup>2</sup> = 1 × (−1) = <b>−1</b>
        <br />n 이 어떤 자연수여도 값은 항상 −1!
      </>
    ),
  },
];

function Tab6Missions() {
  const [picked, setPicked] = useState<(string | null)[]>(() => MISSIONS.map(() => null));

  const okCount = picked.filter((p, i) => p === MISSIONS[i].correct).length;
  const ngCount = picked.filter((p, i) => p !== null && p !== MISSIONS[i].correct).length;
  const leftCount = picked.filter((p) => p === null).length;

  function pick(idx: number, key: string) {
    setPicked((arr) => {
      if (arr[idx] !== null) return arr;
      const n = [...arr];
      n[idx] = key;
      return n;
    });
  }

  function reset() {
    setPicked(MISSIONS.map(() => null));
  }

  return (
    <div className="space-y-4">
      <SecHeader title="🎯 도전 미션 5 선" />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <ScoreBox label="정답" value={okCount} tone="emerald" />
        <ScoreBox label="오답" value={ngCount} tone="rose" />
        <ScoreBox label="남은 문제" value={leftCount} tone="violet" />
        <button
          type="button"
          onClick={reset}
          className="ml-auto rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
        >
          ↻ 초기화
        </button>
      </div>

      <div className="space-y-3">
        {MISSIONS.map((m, idx) => {
          const cur = picked[idx];
          const done = cur !== null;
          return (
            <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-xs font-extrabold text-white">
                  {idx + 1}
                </span>
                <p className="text-sm font-bold leading-7 text-slate-100">{m.q}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {m.choices.map((c) => {
                  const isCorrect = c.key === m.correct;
                  const isPicked = cur === c.key;
                  const showCorrect = done && isCorrect;
                  const showWrong = isPicked && !isCorrect;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      disabled={done}
                      onClick={() => pick(idx, c.key)}
                      className={
                        "min-w-[68px] rounded-xl border-2 px-4 py-1.5 text-base font-extrabold transition disabled:cursor-default " +
                        (showCorrect
                          ? "border-emerald-400 bg-emerald-400/25 text-emerald-100 ring-4 ring-emerald-300/60"
                          : showWrong
                          ? "border-rose-400 bg-rose-400/25 text-rose-100 ring-4 ring-rose-300/60"
                          : "border-violet-400/40 bg-violet-400/10 text-violet-100 hover:bg-violet-400/20")
                      }
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              {done ? (
                <div className="mt-3 rounded-xl border border-violet-400/35 bg-violet-400/10 p-3 text-sm leading-7 text-violet-50">
                  {m.explain}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "rose" | "violet";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-100"
      : tone === "rose"
      ? "border-rose-400/45 bg-rose-400/10 text-rose-100"
      : "border-violet-400/45 bg-violet-400/10 text-violet-100";
  return (
    <div className={"rounded-xl border px-3 py-1.5 text-center " + cls}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="font-mono text-base font-extrabold">{value}</p>
    </div>
  );
}
