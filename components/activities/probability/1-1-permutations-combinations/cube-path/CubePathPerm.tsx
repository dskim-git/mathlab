"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

type N = 2 | 3;
type Pt = [number, number];

// ── 정육면체 그림 크기/투영 (원본 makeProj 그대로) ──
const DIMS: Record<N, { W: number; H: number }> = {
  2: { W: 480, H: 420 },
  3: { W: 560, H: 500 },
};
function makeProj(n: N) {
  const { W, H } = DIMS[n];
  const cell = (n === 2 ? 0.22 : 0.17) * Math.min(W, H);
  const wx = cell * 0.55;
  const wy = -cell * 0.4;
  const ox = W * 0.14;
  const oy = H * 0.82;
  return (x: number, y: number, z: number): Pt => [ox + x * cell + z * wx, oy - y * cell + z * wy];
}

// ── 외부 모서리 최단경로 DP (원본 그대로) ──
function isOuter(x: number, y: number, z: number, n: number) {
  return x === 0 || x === n || y === 0 || y === n || z === 0 || z === n;
}
function vidx(x: number, y: number, z: number, n: number) {
  return z * (n + 1) * (n + 1) + y * (n + 1) + x;
}
function computeOuterDP(n: N): number[] {
  const dp = new Array((n + 1) ** 3).fill(0);
  dp[vidx(0, 0, 0, n)] = 1;
  for (let z = 0; z <= n; z++)
    for (let y = 0; y <= n; y++)
      for (let x = 0; x <= n; x++) {
        const v = dp[vidx(x, y, z, n)];
        if (!v) continue;
        ([[1, 0, 0], [0, 1, 0], [0, 0, 1]] as const).forEach(([dx, dy, dz]) => {
          const nx = x + dx, ny = y + dy, nz = z + dz;
          if (nx > n || ny > n || nz > n) return;
          if (isOuter(x, y, z, n) && isOuter(nx, ny, nz, n)) dp[vidx(nx, ny, nz, n)] += v;
        });
      }
  return dp;
}
function visibleVerts(n: N) {
  const seen = new Set<string>();
  const list: { x: number; y: number; z: number }[] = [];
  const add = (x: number, y: number, z: number) => {
    const k = `${x},${y},${z}`;
    if (!seen.has(k)) { seen.add(k); list.push({ x, y, z }); }
  };
  for (let y = 0; y <= n; y++) for (let x = 0; x <= n; x++) add(x, y, 0); // 앞면 z=0
  for (let z = 1; z <= n; z++) for (let x = 0; x <= n; x++) add(x, n, z); // 위면 y=n
  for (let z = 1; z <= n; z++) for (let y = 0; y < n; y++) add(n, y, z); // 오른면 x=n
  return list;
}

type BlankState = {
  answers: Record<string, number>;
  values: Record<string, string>;
  statuses: Record<string, "correct" | "wrong" | undefined>;
  onChange: (key: string, value: string) => void;
};

/** 등각투상 정육면체 그림(3면+격자+모서리+A/G 레이블). blanks 제공 시 탭③ 꼭짓점 빈칸. */
function CubeFigure({ n, blanks }: { n: N; blanks?: BlankState }) {
  const { W, H } = DIMS[n];
  const p = useMemo(() => makeProj(n), [n]);
  const poly = (pts: Pt[]) => pts.map((q) => q.join(",")).join(" ");

  const grid: [Pt, Pt][] = [];
  for (let i = 1; i < n; i++) {
    grid.push([p(i, 0, 0), p(i, n, 0)], [p(0, i, 0), p(n, i, 0)]); // 앞면
    grid.push([p(i, n, 0), p(i, n, n)], [p(0, n, i), p(n, n, i)]); // 위면
    grid.push([p(n, i, 0), p(n, i, n)], [p(n, 0, i), p(n, n, i)]); // 오른면
  }
  const hidden: [Pt, Pt][] = [
    [p(0, 0, 0), p(0, 0, n)],
    [p(0, 0, n), p(n, 0, n)],
    [p(0, 0, n), p(0, n, n)],
  ];
  const visibleEdges: [Pt, Pt][] = [
    [p(0, n, n), p(n, n, n)],
    [p(n, 0, n), p(n, n, n)],
    [p(n, 0, 0), p(n, 0, n)],
    [p(0, n, 0), p(0, n, n)],
  ];

  const A = p(0, 0, 0);
  const G = p(n, n, n);
  const blankVerts = blanks ? visibleVerts(n).filter((v) => isOuter(v.x, v.y, v.z, n)) : [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-md">
      {/* 면 */}
      <polygon points={poly([p(0, 0, 0), p(n, 0, 0), p(n, n, 0), p(0, n, 0)])} fill="rgba(100,160,120,0.5)" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <polygon points={poly([p(0, n, 0), p(n, n, 0), p(n, n, n), p(0, n, n)])} fill="rgba(60,100,190,0.6)" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <polygon points={poly([p(n, 0, 0), p(n, n, 0), p(n, n, n), p(n, 0, n)])} fill="rgba(160,110,50,0.55)" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      {/* 내부 격자 */}
      {grid.map(([a, b], i) => (
        <line key={`g${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="rgba(255,255,255,0.22)" strokeWidth={0.9} strokeDasharray="4 4" />
      ))}
      {/* 숨은 모서리 */}
      {hidden.map(([a, b], i) => (
        <line key={`h${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="rgba(255,255,255,0.22)" strokeWidth={1} strokeDasharray="4 4" />
      ))}
      {/* 보이는 모서리 */}
      {visibleEdges.map(([a, b], i) => (
        <line key={`v${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="rgba(255,255,255,0.8)" strokeWidth={1.8} />
      ))}
      {/* 레이블 */}
      <text x={A[0] - 16} y={A[1] + 6} fill="#ff8888" fontSize={15} fontWeight={700}>A</text>
      <text x={G[0] + 5} y={G[1] - 4} fill="#88ff88" fontSize={15} fontWeight={700}>{n === 2 ? "G" : "B"}</text>

      {/* 탭③ 꼭짓점 빈칸 */}
      {blanks
        ? blankVerts.map((v) => {
            const key = `${v.x},${v.y},${v.z}`;
            const [px, py] = p(v.x, v.y, v.z);
            const isStart = v.x === 0 && v.y === 0 && v.z === 0;
            const status = blanks.statuses[key];
            const border = isStart
              ? "border-slate-600 text-slate-400"
              : status === "correct"
                ? "border-emerald-500 text-emerald-300"
                : status === "wrong"
                  ? "border-red-500 text-red-300"
                  : "border-cyan-500 text-white";
            return (
              <foreignObject key={key} x={px + 2} y={py - 26} width={44} height={26}>
                <div className="h-full w-full">
                  <input
                    type="number"
                    min={0}
                    readOnly={isStart}
                    value={isStart ? "1" : blanks.values[key] ?? ""}
                    onChange={(e) => blanks.onChange(key, e.target.value)}
                    placeholder="?"
                    aria-label={`꼭짓점 (${v.x},${v.y},${v.z}) 경로 수`}
                    className={`h-full w-full rounded border-2 bg-slate-950 text-center text-xs font-bold outline-none ${border}`}
                  />
                </div>
              </foreignObject>
            );
          })
        : null}
    </svg>
  );
}

// ── 탭② 외부만(포함-배제) 단계표 빈칸 정답 ──
const OUTER_ANS: Record<N, Record<string, number>> = {
  2: { I: 6, II: 15, mulA: 6, mulB: 15, mulR: 90, dup: 36, finA: 90, finB: 36, finR: 54 },
  3: { I: 6, II: 84, mulA: 6, mulB: 84, mulR: 504, dup: 120, finA: 504, finB: 120, finR: 384 },
};
const OUTER_II_EXPR: Record<N, string> = { 2: "6! / (2!×4!)", 3: "9! / (3!×6!)" };
const OUTER_DUP_EXPR: Record<N, string> = { 2: "18 + 18", 3: "{ 6!/(3!×3!) × 1 } × 3 × 2" };

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "all_vs_outer",
    prompt:
      "내·외부 모서리를 모두 쓸 때(2×2×2면 90)와 겉면만 쓸 때(54)의 최단경로 수가 다른 이유는 무엇인가요?",
    kind: "text",
    placeholder: "예: 겉면만 쓰면 가운데를 지나는 …",
  },
  {
    id: "sum_rule",
    prompt:
      "합의 법칙에서 한 꼭짓점의 경로 수를 어떻게 구했나요? 이웃한 꼭짓점과의 관계로 설명해 보세요.",
    kind: "text",
  },
];

export default function CubePathPerm() {
  const [tab, setTab] = useState<"all" | "outer" | "sum">("all");
  const [n, setN] = useState<N>(2);

  // 탭② 입력
  const [outerVals, setOuterVals] = useState<Record<string, string>>({});
  const [outerStat, setOuterStat] = useState<Record<string, "correct" | "wrong" | undefined>>({});
  // 탭③ 입력
  const [sumVals, setSumVals] = useState<Record<string, string>>({});
  const [sumStat, setSumStat] = useState<Record<string, "correct" | "wrong" | undefined>>({});

  const sumAnswers = useMemo(() => {
    const dp = computeOuterDP(n);
    const ans: Record<string, number> = {};
    visibleVerts(n)
      .filter((v) => isOuter(v.x, v.y, v.z, n) && !(v.x === 0 && v.y === 0 && v.z === 0))
      .forEach((v) => (ans[`${v.x},${v.y},${v.z}`] = dp[vidx(v.x, v.y, v.z, n)]));
    return ans;
  }, [n]);

  function checkOuter() {
    const ans = OUTER_ANS[n];
    const next: Record<string, "correct" | "wrong" | undefined> = {};
    Object.keys(ans).forEach((id) => {
      const key = `${n}:${id}`;
      const v = outerVals[key];
      if (v === undefined || v === "") return;
      next[key] = Number(v) === ans[id] ? "correct" : "wrong";
    });
    setOuterStat(next);
  }
  function checkSum() {
    const next: Record<string, "correct" | "wrong" | undefined> = {};
    Object.entries(sumAnswers).forEach(([k, a]) => {
      const key = `${n}:${k}`;
      const v = sumVals[key];
      if (v === undefined || v === "") return;
      next[key] = Number(v) === a ? "correct" : "wrong";
    });
    setSumStat(next);
  }

  const tabBtn = (active: boolean) =>
    active
      ? "rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950"
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";
  const subBtn = (active: boolean) =>
    active
      ? "rounded-lg bg-cyan-300/20 px-3 py-1 text-sm font-semibold text-cyan-100 border border-cyan-300/50"
      : "rounded-lg border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:bg-white/10";

  // 탭② 단계표 입력 셀
  const outerInput = (id: string) => {
    const key = `${n}:${id}`;
    const st = outerStat[key];
    const border =
      st === "correct" ? "border-emerald-500 text-emerald-300" : st === "wrong" ? "border-red-500 text-red-300" : "border-cyan-500 text-white";
    return (
      <input
        type="number"
        value={outerVals[key] ?? ""}
        onChange={(e) => setOuterVals((p) => ({ ...p, [key]: e.target.value }))}
        placeholder="?"
        aria-label={`단계 ${id}`}
        className={`w-16 rounded border-2 bg-slate-950 px-1 py-1 text-center text-sm font-bold outline-none ${border}`}
      />
    );
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 같은 것이 있는 순열</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 정육면체 최단경로</h3>
        <p className="mt-2 leading-7 text-slate-300">
          꼭짓점 A에서 대각 꼭짓점까지 모서리를 따라가는 최단경로를 <b className="text-cyan-200">그림으로</b>{" "}
          직접 확인해 봅니다. (가로·세로·높이 이동의 같은 것이 있는 순열)
        </p>
      </div>

      {/* 탭 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "all")} onClick={() => setTab("all")}>① 내·외부 모두</button>
        <button type="button" className={tabBtn(tab === "outer")} onClick={() => setTab("outer")}>② 외부만 (포함-배제)</button>
        <button type="button" className={tabBtn(tab === "sum")} onClick={() => setTab("sum")}>③ 합의 법칙</button>
      </div>

      {/* 크기 서브탭 */}
      <div className="mt-3 flex gap-2">
        <button type="button" className={subBtn(n === 2)} onClick={() => setN(2)}>2×2×2</button>
        <button type="button" className={subBtn(n === 3)} onClick={() => setN(3)}>3×3×3</button>
      </div>

      {/* 탭 ① 내·외부 모두 */}
      {tab === "all" ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900 p-5">
          <h4 className="text-sm font-bold text-cyan-100">{n}×{n}×{n} 정육면체 — 내·외부 모두 사용</h4>
          <p className="mt-1 text-sm text-slate-400">
            가로 {n}번 · 세로 {n}번 · 높이 {n}번 이동 (같은 것이 있는 순열)
          </p>
          <div className="mt-3">
            <CubeFigure n={n} />
          </div>
          <div className="mt-3 rounded-2xl border border-cyan-300/25 bg-cyan-950/20 p-4 text-center">
            <div className="text-xl font-extrabold text-cyan-100">
              {n === 2 ? "6! / (2!·2!·2!) = 90가지" : "9! / (3!·3!·3!) = 1680가지"}
            </div>
          </div>
        </div>
      ) : null}

      {/* 탭 ② 외부만 (포함-배제) */}
      {tab === "outer" ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <h4 className="text-sm font-bold text-cyan-100">{n}×{n}×{n} — 겉면 모서리만 사용 (포함-배제)</h4>
            <p className="mt-1 text-sm text-slate-400">
              최단거리 = {3 * n}칸 (가로 {n} + 세로 {n} + 높이 {n})
            </p>
            <div className="mt-3">
              <CubeFigure n={n} />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <h4 className="text-sm font-bold text-cyan-100">🔍 풀이 단계 — 빈칸을 채워보세요</h4>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-cyan-200">
                    <th className="border border-white/10 px-2 py-2">단계</th>
                    <th className="border border-white/10 px-2 py-2">설명</th>
                    <th className="border border-white/10 px-2 py-2">계산식</th>
                    <th className="border border-white/10 px-2 py-2">결과</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200">
                  <tr>
                    <td className="border border-white/10 px-2 py-2 font-semibold text-amber-300">Ⅰ단계</td>
                    <td className="border border-white/10 px-2 py-2">지나는 두 면의 쌍 선택</td>
                    <td className="border border-white/10 px-2 py-2 text-center">3 × 2</td>
                    <td className="border border-white/10 px-2 py-2 text-center">{outerInput("I")} 가지</td>
                  </tr>
                  <tr>
                    <td className="border border-white/10 px-2 py-2 font-semibold text-amber-300">Ⅱ단계</td>
                    <td className="border border-white/10 px-2 py-2">
                      그 두 면 위의 경로 수<br />
                      <span className="text-xs text-slate-500">(한 방향 {n}번, 다른 방향 {2 * n}번)</span>
                    </td>
                    <td className="border border-white/10 px-2 py-2 text-center">{OUTER_II_EXPR[n]}</td>
                    <td className="border border-white/10 px-2 py-2 text-center">{outerInput("II")} 가지</td>
                  </tr>
                  <tr>
                    <td className="border border-white/10 px-2 py-2">Ⅰ×Ⅱ</td>
                    <td className="border border-white/10 px-2 py-2">곱의 법칙으로 합산</td>
                    <td className="border border-white/10 px-2 py-2 text-center">
                      {outerInput("mulA")} × {outerInput("mulB")}
                    </td>
                    <td className="border border-white/10 px-2 py-2 text-center">{outerInput("mulR")} 가지</td>
                  </tr>
                  <tr>
                    <td className="border border-white/10 px-2 py-2 font-semibold text-amber-300">Ⅲ 중복</td>
                    <td className="border border-white/10 px-2 py-2">세 면 모두 지나는 경로 (빼기)</td>
                    <td className="border border-white/10 px-2 py-2 text-center">{OUTER_DUP_EXPR[n]}</td>
                    <td className="border border-white/10 px-2 py-2 text-center">{outerInput("dup")} 가지</td>
                  </tr>
                  <tr>
                    <td className="border border-white/10 px-2 py-2 font-bold text-emerald-300">최종 답</td>
                    <td className="border border-white/10 px-2 py-2">포함-배제 원리</td>
                    <td className="border border-white/10 px-2 py-2 text-center">
                      {outerInput("finA")} − {outerInput("finB")}
                    </td>
                    <td className="border border-white/10 px-2 py-2 text-center">{outerInput("finR")} 가지</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button type="button" onClick={checkOuter} className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
                ✓ 정답 확인
              </button>
              <button type="button" onClick={() => { setOuterVals({}); setOuterStat({}); }} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10">
                ↺ 초기화
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 탭 ③ 합의 법칙 */}
      {tab === "sum" ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900 p-5">
          <h4 className="text-sm font-bold text-cyan-100">{n}×{n}×{n} — 외부 꼭짓점별 경로 수 채우기</h4>
          <p className="mt-1 text-sm text-slate-400">
            A(왼쪽 아래 앞)에서 {n === 2 ? "G" : "B"}(오른쪽 위 뒤)까지의 외부 최단경로. 이웃한 꼭짓점의
            값을 더하면 다음 꼭짓점의 값이 됩니다. (A = 1)
          </p>
          <div className="mt-3">
            <CubeFigure
              n={n}
              blanks={{
                answers: sumAnswers,
                values: Object.fromEntries(
                  Object.keys(sumAnswers).map((k) => [k, sumVals[`${n}:${k}`] ?? ""])
                ),
                statuses: Object.fromEntries(
                  Object.keys(sumAnswers).map((k) => [k, sumStat[`${n}:${k}`]])
                ),
                onChange: (k, v) => setSumVals((p) => ({ ...p, [`${n}:${k}`]: v })),
              }}
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button type="button" onClick={checkSum} className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
              ✓ 정답 확인
            </button>
            <button type="button" onClick={() => { setSumVals({}); setSumStat({}); }} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10">
              ↺ 초기화
            </button>
          </div>
        </div>
      ) : null}

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
