"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "area_volume",
    prompt:
      "곱셈 공식이 도형의 ‘넓이/부피’와 어떻게 연결되는지 자신의 말로 설명해 보세요. 2D 타일과 3D 정육면체 모두에서 공통으로 적용되는 아이디어가 무엇인지 짚어 보면 좋겠습니다.",
    kind: "text",
    placeholder:
      "예: (a+b)²은 가로 (a+b), 세로 (a+b) 인 정사각형의 넓이이고, 이를 a×a, a×b, b×a, b×b 네 조각으로 나눈 합과 같다. 3D에서도 (a+b)³은 한 변 (a+b) 인 정육면체의 부피이고, 8조각의 부피 합과 같다.",
  },
  {
    id: "derivation_idea",
    prompt:
      "(a−b)² 또는 (a+b)(a−b) 의 도형적 유도, 혹은 a³+b³=(a+b)(a²−ab+b²)의 유도 중 한 가지를 골라 그 핵심 아이디어를 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: a³+b³ 는 (a+b)³ 에서 3a²b 와 3ab² 조각을 모두 제거한 부피이고, 3a²b+3ab² = 3ab(a+b) 이므로 (a+b)³ − 3ab(a+b) = (a+b){(a+b)² − 3ab} = (a+b)(a²−ab+b²) 이다.",
  },
];

// ─── 타일 종류와 톤 ─────────────────────────────────────────
type TileType =
  | "x2"
  | "x2_b"
  | "x2_c"
  | "abx_pos"
  | "abx_neg"
  | "b2_pos"
  | "b2_neg"
  | "unit";

const TILE_TONE: Record<TileType, { box: string; text: string }> = {
  // 제곱항(주요): sky
  x2: { box: "border-sky-400/55 bg-sky-400/15", text: "text-sky-100" },
  // 제곱항(2번째): cyan
  x2_b: { box: "border-cyan-400/55 bg-cyan-400/15", text: "text-cyan-100" },
  // 제곱항(3번째): teal
  x2_c: { box: "border-teal-400/55 bg-teal-400/15", text: "text-teal-100" },
  // 1차 교차항(+): emerald
  abx_pos: { box: "border-emerald-400/55 bg-emerald-400/15", text: "text-emerald-100" },
  // 1차 교차항(−): rose
  abx_neg: { box: "border-rose-400/55 bg-rose-400/15", text: "text-rose-100" },
  // b² 또는 (b,c)교차: violet
  b2_pos: { box: "border-violet-400/55 bg-violet-400/15", text: "text-violet-100" },
  b2_neg: { box: "border-rose-400/55 bg-rose-400/15", text: "text-rose-100" },
  // 상수항: amber
  unit: { box: "border-amber-400/55 bg-amber-400/15", text: "text-amber-100" },
};

// ─── 격자 패널 설정 ─────────────────────────────────────────
type Tile = { type: TileType; label: string; cnt: number };
type GridConfig = {
  panelKey: string;
  title: string;
  formulaLeft: string;
  colHeaders: string[];
  rowHeaders: string[];
  pool: Tile[];
  // ans[r][c] = TileType
  ans: TileType[][];
  result: string;
  hint: string;
};

const GRID_CONFIGS: GridConfig[] = [
  {
    panelKey: "g0",
    title: "중학교 복습 ① — (a+b)² 탐구",
    formulaLeft: "(a+b)² = (a+b)(a+b) = ?",
    colHeaders: ["a", "b"],
    rowHeaders: ["a", "b"],
    pool: [
      { type: "x2", label: "a²", cnt: 1 },
      { type: "abx_pos", label: "ab", cnt: 2 },
      { type: "b2_pos", label: "b²", cnt: 1 },
    ],
    ans: [
      ["x2", "abx_pos"],
      ["abx_pos", "b2_pos"],
    ],
    result: "(a+b)² = a² + 2ab + b²",
    hint: "좌상: a², 우상: ab, 좌하: ab, 우하: b²",
  },
  {
    panelKey: "g3",
    title: "중학교 복습 ④ — (x+a)(x+b) 탐구",
    formulaLeft: "(x+a)(x+b) = ?",
    colHeaders: ["x", "a"],
    rowHeaders: ["x", "b"],
    pool: [
      { type: "x2", label: "x²", cnt: 1 },
      { type: "abx_pos", label: "ax", cnt: 1 },
      { type: "abx_pos", label: "bx", cnt: 1 },
      { type: "unit", label: "ab", cnt: 1 },
    ],
    ans: [
      ["x2", "abx_pos"],
      ["abx_pos", "unit"],
    ],
    result: "(x+a)(x+b) = x² + (a+b)x + ab",
    hint: "좌상: x², 우상: ax, 좌하: bx, 우하: ab",
  },
  {
    panelKey: "g4",
    title: "중학교 복습 ⑤ — (ax+b)(cx+d) 탐구",
    formulaLeft: "(ax+b)(cx+d) = ?",
    colHeaders: ["ax", "b"],
    rowHeaders: ["cx", "d"],
    pool: [
      { type: "x2", label: "acx²", cnt: 1 },
      { type: "abx_pos", label: "adx", cnt: 1 },
      { type: "abx_pos", label: "bcx", cnt: 1 },
      { type: "unit", label: "bd", cnt: 1 },
    ],
    ans: [
      ["x2", "abx_pos"],
      ["abx_pos", "unit"],
    ],
    result: "(ax+b)(cx+d) = acx² + (ad+bc)x + bd",
    hint: "(cx)(ax)=acx², d·ax=adx, (cx)b=bcx, d·b=bd",
  },
  {
    panelKey: "g5",
    title: "새 공식 ① — (a+b+c)² 탐구",
    formulaLeft: "(a+b+c)² = (a+b+c)(a+b+c) = ?",
    colHeaders: ["a", "b", "c"],
    rowHeaders: ["a", "b", "c"],
    pool: [
      { type: "x2", label: "a²", cnt: 1 },
      { type: "x2_b", label: "b²", cnt: 1 },
      { type: "x2_c", label: "c²", cnt: 1 },
      { type: "abx_pos", label: "ab", cnt: 2 },
      { type: "b2_pos", label: "bc", cnt: 2 },
      { type: "abx_pos", label: "ca", cnt: 2 },
    ],
    ans: [
      ["x2", "abx_pos", "abx_pos"],
      ["abx_pos", "x2_b", "b2_pos"],
      ["abx_pos", "b2_pos", "x2_c"],
    ],
    result: "(a+b+c)² = a²+b²+c²+2ab+2bc+2ca",
    hint: "대각선: a², b², c². 나머지는 두 변수의 곱(각 2개씩)",
  },
];

// ─── 8 패널 라벨 ────────────────────────────────────────────
const PANEL_LABELS = [
  "① (a+b)²",
  "② (a−b)²",
  "③ (a+b)(a−b)",
  "④ (x+a)(x+b)",
  "⑤ (ax+b)(cx+d)",
  "⑥ (a+b+c)²",
  "⑦ (a+b)³ 3D",
  "⑧ a³+b³ 3D",
];

// ─── 메인 ───────────────────────────────────────────────────
export default function AlgebraTileFormulas() {
  const [active, setActive] = useState(0);
  const [done, setDone] = useState<boolean[]>(() => new Array(8).fill(false));

  function markDone(i: number) {
    setDone((d) => {
      if (d[i]) return d;
      const n = [...d];
      n[i] = true;
      return n;
    });
  }

  const completed = done.filter(Boolean).length;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* ─── 헤더 ─── */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">🧩 대수막대로 곱셈 공식 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          대수막대(타일)와 정육면체로 곱셈 공식이{" "}
          <b className="text-cyan-200">도형의 넓이·부피</b>와 어떻게 연결되는지 직접 확인해 보세요.
          중학교 복습 5개 + 새로 배울 공식 3개, 모두 8 단계입니다.
        </p>
      </div>

      {/* 진행 */}
      <div className="mt-5 flex items-center gap-3">
        <ProgressBar done={completed} total={8} />
        <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-4 py-1 font-mono text-sm font-bold text-cyan-100">
          진행 {completed} / 8
        </span>
      </div>

      {/* 탭 */}
      <div className="mt-4 flex flex-wrap gap-2">
        {PANEL_LABELS.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={
              "rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition " +
              (done[i]
                ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                : active === i
                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {done[i] ? "✓ " : ""}
            {label}
          </button>
        ))}
      </div>

      {/* 본문 */}
      <div className="mt-4">
        {active === 0 ? (
          <GridPanel key="g0" config={GRID_CONFIGS[0]} onComplete={() => markDone(0)} />
        ) : active === 1 ? (
          <AMinusBSquared key="p1" onComplete={() => markDone(1)} />
        ) : active === 2 ? (
          <AsqMinusBsq key="p2" onComplete={() => markDone(2)} />
        ) : active === 3 ? (
          <GridPanel key="g3" config={GRID_CONFIGS[1]} onComplete={() => markDone(3)} />
        ) : active === 4 ? (
          <GridPanel key="g4" config={GRID_CONFIGS[2]} onComplete={() => markDone(4)} />
        ) : active === 5 ? (
          <GridPanel key="g5" config={GRID_CONFIGS[3]} onComplete={() => markDone(5)} />
        ) : active === 6 ? (
          <CubeAPlusBCubed key="p6" onComplete={() => markDone(6)} />
        ) : (
          <CubeAcubedPlusBcubed key="p7" onComplete={() => markDone(7)} />
        )}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const ratio = total === 0 ? 0 : Math.min(1, done / total);
  return (
    <svg
      viewBox="0 0 100 4"
      preserveAspectRatio="none"
      className="h-2 flex-1"
      role="img"
      aria-label={`진행률 ${Math.round(ratio * 100)}%`}
    >
      <defs>
        <linearGradient id="atfProgGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="0" y="0" width={ratio * 100} height="4" rx="2" fill="url(#atfProgGrad)" />
    </svg>
  );
}

// ─── 격자 패널 (드래그-드롭 타일) ──────────────────────────
function GridPanel({
  config,
  onComplete,
}: {
  config: GridConfig;
  onComplete: () => void;
}) {
  const R = config.ans.length;
  const C = config.ans[0].length;

  // grid[r][c] = (poolItemIdx | null). 값이 있으면 그 poolItem에서 가져온 것.
  const [grid, setGrid] = useState<({ pi: number; label: string; type: TileType } | null)[][]>(
    () => Array.from({ length: R }, () => new Array(C).fill(null)),
  );
  const [poolCounts, setPoolCounts] = useState<number[]>(() => config.pool.map((p) => p.cnt));
  const [msg, setMsg] = useState<{ tone: "ok" | "ng" | "hint"; text: string } | null>(null);
  const [done, setDone] = useState(false);
  const [outline, setOutline] = useState<("ok" | "ng" | null)[][]>(() =>
    Array.from({ length: R }, () => new Array(C).fill(null)),
  );

  const dragSrc = useRef<
    | { from: "pool"; pi: number; label: string; type: TileType }
    | { from: "cell"; r: number; c: number }
    | null
  >(null);

  // 패널 변경 시 자동 리셋 (의도된 리셋 패턴)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGrid(Array.from({ length: R }, () => new Array(C).fill(null)));
    setPoolCounts(config.pool.map((p) => p.cnt));
    setMsg(null);
    setDone(false);
    setOutline(Array.from({ length: R }, () => new Array(C).fill(null)));
  }, [config.panelKey, R, C, config.pool]);

  function placeFromPool(pi: number, label: string, type: TileType, r: number, c: number) {
    if (poolCounts[pi] <= 0) return;
    const occ = grid[r][c];
    setGrid((g) =>
      g.map((row, ri) =>
        ri === r ? row.map((cell, ci) => (ci === c ? { pi, label, type } : cell)) : row,
      ),
    );
    setPoolCounts((arr) => {
      const n = [...arr];
      n[pi] -= 1;
      if (occ) n[occ.pi] += 1;
      return n;
    });
    setMsg(null);
    setOutline(Array.from({ length: R }, () => new Array(C).fill(null)));
  }

  function clearCell(r: number, c: number) {
    const occ = grid[r][c];
    if (!occ) return;
    setGrid((g) =>
      g.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? null : cell)) : row)),
    );
    setPoolCounts((arr) => {
      const n = [...arr];
      n[occ.pi] += 1;
      return n;
    });
    setMsg(null);
    setOutline(Array.from({ length: R }, () => new Array(C).fill(null)));
  }

  function handleCheck() {
    let allFilled = true;
    let allOk = true;
    const out = grid.map((row, r) =>
      row.map((cell, c) => {
        if (!cell) {
          allFilled = false;
          return null;
        }
        const ok = cell.type === config.ans[r][c];
        if (!ok) allOk = false;
        return ok ? "ok" : ("ng" as "ok" | "ng");
      }),
    );
    setOutline(out);
    if (!allFilled) {
      setMsg({ tone: "hint", text: "⚠ 빈 칸이 있어요. 모든 칸을 채워 보세요." });
      return;
    }
    if (allOk) {
      setMsg({ tone: "ok", text: `🎉 정답! ${config.result}` });
      if (!done) {
        setDone(true);
        onComplete();
      }
    } else {
      setMsg({ tone: "ng", text: "❌ 빨간 칸이 있어요. 다시 확인해 보세요." });
    }
  }

  function handleReset() {
    setGrid(Array.from({ length: R }, () => new Array(C).fill(null)));
    setPoolCounts(config.pool.map((p) => p.cnt));
    setMsg(null);
    setOutline(Array.from({ length: R }, () => new Array(C).fill(null)));
  }

  function handleHint() {
    setMsg({ tone: "hint", text: `💡 ${config.hint}` });
  }

  // 풀에서 클릭 시 가장 가까운 빈 칸으로 자동 배치
  function autoPlaceFromPool(pi: number) {
    if (poolCounts[pi] <= 0) return;
    const item = config.pool[pi];
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (grid[r][c] === null) {
          placeFromPool(pi, item.label, item.type, r, c);
          return;
        }
      }
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
        {config.title}
      </p>
      <div className="mt-2 rounded-xl border border-sky-400/30 bg-sky-400/[0.05] px-4 py-3 text-center font-mono text-base font-bold text-sky-100">
        {config.formulaLeft}
      </div>
      <p className="mt-3 text-sm text-slate-400">
        왼쪽 타일 창고에서 타일을 <b className="text-cyan-200">드래그</b>하거나 클릭해서 격자에
        놓으세요. 놓인 타일을 <b className="text-cyan-200">클릭</b>하면 제거됩니다.
      </p>

      <div className="mt-4 flex flex-wrap items-start gap-5">
        {/* 타일 창고 */}
        <div className="min-h-[120px] min-w-[180px] rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.03] p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            타일 창고
          </p>
          <div
            className="flex flex-wrap gap-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const src = dragSrc.current;
              if (src?.from === "cell") clearCell(src.r, src.c);
              dragSrc.current = null;
            }}
          >
            {config.pool.flatMap((item, pi) => {
              const remaining = poolCounts[pi];
              const tone = TILE_TONE[item.type];
              const tiles = [];
              for (let k = 0; k < remaining; k++) {
                tiles.push(
                  <button
                    key={`p-${pi}-${k}`}
                    type="button"
                    draggable
                    onDragStart={() => {
                      dragSrc.current = {
                        from: "pool",
                        pi,
                        label: item.label,
                        type: item.type,
                      };
                    }}
                    onDragEnd={() => {
                      dragSrc.current = null;
                    }}
                    onClick={() => autoPlaceFromPool(pi)}
                    className={`inline-flex h-[44px] min-w-[64px] cursor-grab items-center justify-center rounded-lg border-2 px-2 font-mono text-sm font-extrabold shadow-md transition active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-lg ${tone.box} ${tone.text}`}
                  >
                    {item.label}
                  </button>,
                );
              }
              if (remaining === 0) {
                tiles.push(
                  <span
                    key={`p-${pi}-empty`}
                    className={`inline-flex h-[44px] min-w-[64px] items-center justify-center rounded-lg border-2 px-2 font-mono text-sm font-extrabold opacity-25 ${tone.box} ${tone.text}`}
                    aria-hidden
                  >
                    {item.label}
                  </span>,
                );
              }
              return tiles;
            })}
          </div>
        </div>

        {/* 격자 */}
        <div className="inline-flex flex-col">
          {/* 위쪽 열 라벨 */}
          <div className="flex">
            <div className="w-[44px]" aria-hidden />
            {config.colHeaders.map((h, i) => (
              <div
                key={i}
                className="flex h-[28px] w-[80px] items-end justify-center text-base font-extrabold text-amber-300"
              >
                {h}
              </div>
            ))}
          </div>

          {Array.from({ length: R }, (_, r) => (
            <div key={r} className="flex">
              <div className="flex h-[80px] w-[44px] items-center justify-center text-base font-extrabold text-amber-300">
                {config.rowHeaders[r]}
              </div>
              {Array.from({ length: C }, (_, c) => {
                const cell = grid[r][c];
                const out = outline[r][c];
                const outlineCls =
                  out === "ok"
                    ? "outline outline-2 outline-emerald-400"
                    : out === "ng"
                    ? "outline outline-2 outline-rose-400"
                    : "";
                return (
                  <div
                    key={c}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const src = dragSrc.current;
                      if (src?.from === "pool") {
                        placeFromPool(src.pi, src.label, src.type, r, c);
                      } else if (src?.from === "cell") {
                        // 셀 ↔ 셀 교환
                        const other = grid[src.r][src.c];
                        if (other) {
                          setGrid((g) =>
                            g.map((row, ri) =>
                              ri === src.r
                                ? row.map((x, ci) => (ci === src.c ? grid[r][c] : x))
                                : ri === r
                                ? row.map((x, ci) => (ci === c ? other : x))
                                : row,
                            ),
                          );
                        }
                      }
                      dragSrc.current = null;
                    }}
                    className={`relative m-[2px] flex h-[78px] w-[78px] items-center justify-center rounded-md border-2 border-dashed transition ${outlineCls} ${
                      cell ? "" : "border-white/15 bg-white/[0.02] text-slate-500"
                    }`}
                  >
                    {cell ? (
                      <button
                        type="button"
                        draggable
                        onDragStart={() => {
                          dragSrc.current = { from: "cell", r, c };
                        }}
                        onDragEnd={() => {
                          dragSrc.current = null;
                        }}
                        onClick={() => clearCell(r, c)}
                        className={`flex h-full w-full cursor-grab items-center justify-center rounded-md border-2 font-mono text-sm font-extrabold shadow-md transition active:cursor-grabbing ${TILE_TONE[cell.type].box} ${TILE_TONE[cell.type].text}`}
                        title="클릭해서 제거"
                      >
                        {cell.label}
                      </button>
                    ) : (
                      <span className="text-xs">?</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {msg ? (
        <p
          className={`mt-3 text-sm font-bold ${
            msg.tone === "ok"
              ? "text-emerald-300"
              : msg.tone === "ng"
              ? "text-rose-300"
              : "text-amber-200"
          }`}
        >
          {msg.text}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCheck}
          disabled={done}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ✅ 확인
        </button>
        <button
          type="button"
          onClick={handleHint}
          className="rounded-xl border border-amber-400/45 bg-amber-400/10 px-5 py-2 text-sm font-bold text-amber-200 transition hover:bg-amber-400/20"
        >
          💡 힌트
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↻ 초기화
        </button>
      </div>
    </div>
  );
}

// ─── Panel 1: (a−b)² 단계 강조 SVG ─────────────────────────
function AMinusBSquared({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(1);
  const [done, setDone] = useState(false);

  const A = 160;
  const B = 55;
  const aB = A - B; // 105 px

  function setStepClick(s: 1 | 2 | 3 | 4) {
    setStep(s);
  }
  function showAll() {
    setStep(0);
  }
  function confirm() {
    if (!done) {
      setDone(true);
      onComplete();
    }
  }

  // step >= n 일 때 표시
  const s = step === 0 ? 999 : step;
  const sh = (n: number) => s >= n;

  const W = A + 80;
  const H = A + 60;
  const ox = 40;
  const oy = 10;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
        중학교 복습 ② — (a−b)² 탐구
      </p>
      <div className="mt-2 rounded-xl border border-sky-400/30 bg-sky-400/[0.05] px-4 py-3 text-center font-mono text-base font-bold text-sky-100">
        (a−b)² = a² − 2ab + b²
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        한 변이 <b className="text-amber-200">a</b> 인 정사각형(a²) 에서 오른쪽 세로 띠(폭 b, 높이
        a)와 아래쪽 가로 띠(폭 a, 높이 b) 를 떼어내면 ab 가 두 번 빠지지만, 오른쪽 아래 b² 모서리는
        두 띠에 모두 포함되어 있으므로 한 번 더해줍니다. 남은 왼쪽 위{" "}
        <b className="text-amber-200">(a−b)×(a−b)</b> 정사각형이 (a−b)² 입니다.
      </p>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-[420px]" role="img" aria-label="(a-b)² 도형 유도">
          <defs>
            <linearGradient id="ab2bg" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="rgba(59,130,246,0.32)" />
              <stop offset="1" stopColor="rgba(29,78,216,0.22)" />
            </linearGradient>
          </defs>
          {/* 전체 a×a 파랑 (항상) */}
          <rect x={ox} y={oy} width={A} height={A} fill="url(#ab2bg)" stroke="#3b82f6" strokeWidth={2} />

          {/* 오른쪽 세로 띠 (step ≥ 2) */}
          <rect
            x={ox + aB}
            y={oy}
            width={B}
            height={aB}
            fill="rgba(16,185,129,0.32)"
            stroke="#10b981"
            strokeWidth={2}
            opacity={sh(2) ? 0.85 : 0}
          />
          {/* 아래 가로 띠 (step ≥ 3) */}
          <rect
            x={ox}
            y={oy + aB}
            width={aB}
            height={B}
            fill="rgba(16,185,129,0.32)"
            stroke="#10b981"
            strokeWidth={2}
            opacity={sh(3) ? 0.85 : 0}
          />
          {/* 모서리 b² 보라 (step ≥ 2) */}
          <rect
            x={ox + aB}
            y={oy + aB}
            width={B}
            height={B}
            fill="rgba(139,92,246,0.45)"
            stroke="#8b5cf6"
            strokeWidth={2}
            opacity={sh(2) ? 1 : 0}
          />

          {/* 분할선 */}
          <line x1={ox + aB} y1={oy} x2={ox + aB} y2={oy + A} stroke="rgba(148,163,184,0.5)" strokeDasharray="5,3" />
          <line x1={ox} y1={oy + aB} x2={ox + A} y2={oy + aB} stroke="rgba(148,163,184,0.5)" strokeDasharray="5,3" />

          {/* (a−b)² 답 강조 (step ≥ 1) */}
          <rect
            x={ox}
            y={oy}
            width={aB}
            height={aB}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={3}
            opacity={sh(1) ? 1 : 0}
          />
          <text
            x={ox + aB / 2}
            y={oy + aB / 2}
            fontSize="14"
            fontWeight="800"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#93c5fd"
            opacity={sh(1) ? 1 : 0}
          >
            (a−b)²
          </text>

          {/* 모서리 +b² 라벨 (step ≥ 4) */}
          <text
            x={ox + aB + B / 2}
            y={oy + aB + B / 2}
            fontSize="12"
            fontWeight="800"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#c4b5fd"
            opacity={sh(2) ? 1 : 0}
          >
            b²
          </text>

          {/* −ab 라벨 (오른쪽 띠) step ≥ 2 */}
          <text
            x={ox + aB + B / 2}
            y={oy + aB / 2}
            fontSize="11"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#6ee7b7"
            opacity={sh(2) ? 1 : 0}
          >
            −ab
          </text>
          {/* −ab 라벨 (아래 띠) step ≥ 3 */}
          <text
            x={ox + aB / 2}
            y={oy + aB + B / 2}
            fontSize="11"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#6ee7b7"
            opacity={sh(3) ? 1 : 0}
          >
            −ab
          </text>

          {/* 축 레이블 */}
          <text x={ox + aB / 2} y={oy + A + 18} fontSize="12" fontWeight="700" textAnchor="middle" fill="#fbbf24">
            a−b
          </text>
          <text x={ox + aB + B / 2} y={oy + A + 18} fontSize="12" fontWeight="700" textAnchor="middle" fill="#a78bfa">
            b
          </text>
          <text x={ox + A / 2} y={oy + A + 36} fontSize="11" textAnchor="middle" fill="#64748b">
            ← a →
          </text>
          {/* 세로 축 */}
          <text x={ox - 18} y={oy + aB / 2} fontSize="11" fontWeight="700" textAnchor="middle" fill="#fbbf24" transform={`rotate(-90 ${ox - 18} ${oy + aB / 2})`}>
            a−b
          </text>
          <text x={ox - 18} y={oy + aB + B / 2} fontSize="11" fontWeight="700" textAnchor="middle" fill="#a78bfa" transform={`rotate(-90 ${ox - 18} ${oy + aB + B / 2})`}>
            b
          </text>
        </svg>
      </div>

      {/* 단계 클릭 */}
      <div className="mt-3 space-y-1.5">
        {[
          {
            n: 1 as const,
            text: (
              <>
                ① 한 변 a 인 정사각형 <Chip color="sky">a²</Chip> 에서 시작
              </>
            ),
          },
          {
            n: 2 as const,
            text: (
              <>
                ② 오른쪽 세로 띠(폭 b, 높이 a) <Chip color="emerald">−ab</Chip> 제거 → a² − ab
              </>
            ),
          },
          {
            n: 3 as const,
            text: (
              <>
                ③ 아래쪽 가로 띠(폭 a, 높이 b) <Chip color="emerald">−ab</Chip> 제거 → a² − 2ab
              </>
            ),
          },
          {
            n: 4 as const,
            text: (
              <>
                ④ 두 번 빠진 모서리 <Chip color="violet">b²</Chip> 보충 → (a−b)² = a² − 2ab + b²
              </>
            ),
          },
        ].map((it) => (
          <button
            key={it.n}
            type="button"
            onClick={() => setStepClick(it.n)}
            className={
              "block w-full rounded-lg border px-3 py-2 text-left text-sm transition " +
              (step === it.n
                ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {it.text}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={confirm}
          disabled={done}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ✔ 공식 확인
        </button>
        <button
          type="button"
          onClick={showAll}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          전체 보기
        </button>
      </div>

      {done ? (
        <p className="mt-3 text-sm font-bold text-emerald-300">
          🎉 (a−b)² = a² − 2ab + b² — 도형으로 확인 완료
        </p>
      ) : null}
    </div>
  );
}

// ─── Panel 2: (a+b)(a−b) = a² − b² SVG ─────────────────────
function AsqMinusBsq({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(1);
  const [done, setDone] = useState(false);

  const A = 130;
  const B = 42;
  const aB = A - B;
  const gap = 52;

  const W = 60 + A + gap + (A + B) + 20;
  const H = A + 60;
  const ox = 40;
  const oy = 12;
  const rx = ox + A + gap;
  const ry = oy + B / 2;

  const s = step === 0 ? 999 : step;
  const sh = (n: number) => s >= n;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
        중학교 복습 ③ — (a+b)(a−b) 탐구
      </p>
      <div className="mt-2 rounded-xl border border-sky-400/30 bg-sky-400/[0.05] px-4 py-3 text-center font-mono text-base font-bold text-sky-100">
        (a+b)(a−b) = a² − b²
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        한 변 <b className="text-amber-200">a</b> 인 정사각형에서 오른쪽 아래 b×b 정사각형을
        제거하면 L자 도형이 남습니다. L자를 가로선으로 자른 뒤 아래 조각을 90° 회전해 오른쪽에
        붙이면 가로 <b className="text-amber-200">(a+b)</b>, 세로 <b className="text-amber-200">(a−b)</b>
        인 직사각형 — 즉 (a+b)(a−b) = a²−b² 가 됩니다.
      </p>

      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-[640px]" role="img" aria-label="(a+b)(a-b) 도형 유도">
          {/* 왼쪽 a×a 파랑 */}
          <rect x={ox} y={oy} width={A} height={A} fill="rgba(59,130,246,0.30)" stroke="#3b82f6" strokeWidth={2} />
          {/* 왼쪽 아래 (a−b)×b 초록 (step ≥ 2) */}
          <rect
            x={ox}
            y={oy + aB}
            width={aB}
            height={B}
            fill="rgba(16,185,129,0.32)"
            stroke="#10b981"
            strokeWidth={2}
            opacity={sh(2) ? 1 : 0}
          />
          {/* 오른쪽 아래 b² 보라 (step ≥ 2) */}
          <rect
            x={ox + aB}
            y={oy + aB}
            width={B}
            height={B}
            fill="rgba(139,92,246,0.45)"
            stroke="#8b5cf6"
            strokeWidth={2}
            opacity={sh(2) ? 1 : 0}
          />
          {/* 분할선 */}
          <line x1={ox + aB} y1={oy} x2={ox + aB} y2={oy + A} stroke="rgba(148,163,184,0.5)" strokeDasharray="5,3" />
          <line x1={ox} y1={oy + aB} x2={ox + A} y2={oy + aB} stroke="rgba(148,163,184,0.5)" strokeDasharray="5,3" />
          {/* L자 강조 (step ≥ 2) */}
          <polygon
            points={`${ox},${oy} ${ox + A},${oy} ${ox + A},${oy + aB} ${ox + aB},${oy + aB} ${ox + aB},${oy + A} ${ox},${oy + A}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2.5}
            opacity={sh(2) ? 1 : 0}
          />
          {/* 가로 자르는 선 (step ≥ 2) */}
          <line
            x1={ox}
            y1={oy + aB}
            x2={ox + aB}
            y2={oy + aB}
            stroke="#a3e635"
            strokeWidth={2.2}
            strokeDasharray="8,4"
            opacity={sh(2) ? 1 : 0}
          />
          {/* b² 라벨 */}
          <text x={ox + aB + B / 2} y={oy + aB + B / 2} fontSize="12" fontWeight="800" textAnchor="middle" dominantBaseline="middle" fill="#c4b5fd" opacity={sh(2) ? 1 : 0}>
            b²
          </text>

          {/* 화살표 (step ≥ 3) */}
          <g opacity={sh(3) ? 1 : 0}>
            <line x1={ox + A + 8} y1={oy + A / 2} x2={rx - 8} y2={ry + aB / 2} stroke="#f59e0b" strokeWidth={2} />
            <polygon points="0,-5 10,0 0,5" fill="#f59e0b" transform={`translate(${rx - 8} ${ry + aB / 2}) rotate(${(Math.atan2(ry + aB / 2 - (oy + A / 2), rx - 8 - (ox + A + 8)) * 180) / Math.PI})`} />
          </g>

          {/* 오른쪽 직사각형 a×(a-b) 파랑 (step ≥ 3) */}
          <rect
            x={rx}
            y={ry}
            width={A}
            height={aB}
            fill="rgba(59,130,246,0.30)"
            stroke="#3b82f6"
            strokeWidth={2}
            opacity={sh(3) ? 1 : 0}
          />
          {/* 오른쪽 b×(a-b) 초록 (회전된 조각) (step ≥ 3) */}
          <rect
            x={rx + A}
            y={ry}
            width={B}
            height={aB}
            fill="rgba(16,185,129,0.32)"
            stroke="#10b981"
            strokeWidth={2}
            opacity={sh(3) ? 1 : 0}
          />
          {/* 결과 강조 */}
          <rect
            x={rx}
            y={ry}
            width={A + B}
            height={aB}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2.8}
            opacity={sh(3) ? 1 : 0}
          />
          <text x={rx + (A + B) / 2} y={ry + aB / 2} fontSize="12" fontWeight="800" textAnchor="middle" dominantBaseline="middle" fill="#6ee7b7" opacity={sh(3) ? 1 : 0}>
            (a+b)(a−b)
          </text>

          {/* 축 라벨 */}
          <text x={ox + A / 2} y={oy + A + 18} fontSize="11" textAnchor="middle" fill="#fbbf24">a</text>
          <text x={rx + A / 2} y={ry + aB + 18} fontSize="11" textAnchor="middle" fill="#fbbf24" opacity={sh(3) ? 1 : 0}>a</text>
          <text x={rx + A + B / 2} y={ry + aB + 18} fontSize="11" textAnchor="middle" fill="#a78bfa" opacity={sh(3) ? 1 : 0}>b</text>
          <text x={rx + (A + B) / 2} y={ry + aB + 32} fontSize="11" textAnchor="middle" fill="#64748b" opacity={sh(3) ? 1 : 0}>← a+b →</text>
        </svg>
      </div>

      <div className="mt-3 space-y-1.5">
        {[
          {
            n: 1 as const,
            text: (
              <>
                ① 한 변 a 인 정사각형 <Chip color="sky">a²</Chip> 에서 시작
              </>
            ),
          },
          {
            n: 2 as const,
            text: (
              <>
                ② 오른쪽 아래 <Chip color="violet">b²</Chip> 제거 → L자형, 가로선으로 분할
              </>
            ),
          },
          {
            n: 3 as const,
            text: (
              <>
                ③ 아래 조각 90° 회전하여 붙이기 → 가로 (a+b), 세로 (a−b) 인 직사각형
              </>
            ),
          },
        ].map((it) => (
          <button
            key={it.n}
            type="button"
            onClick={() => setStep(it.n)}
            className={
              "block w-full rounded-lg border px-3 py-2 text-left text-sm transition " +
              (step === it.n
                ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {it.text}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (!done) {
              setDone(true);
              onComplete();
            }
          }}
          disabled={done}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ✔ 공식 확인
        </button>
        <button
          type="button"
          onClick={() => setStep(0)}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          전체 보기
        </button>
      </div>

      {done ? (
        <p className="mt-3 text-sm font-bold text-emerald-300">
          🎉 (a+b)(a−b) = a² − b² — 도형으로 확인 완료
        </p>
      ) : null}
    </div>
  );
}

// ─── 3D 정육면체 패널 공통 ─────────────────────────────────
type CubePart = {
  key: "a3" | "a2b" | "ab2" | "b3";
  label: string;
  color: string;
  border: string;
  count: number;
};

const CUBE_PARTS_6: CubePart[] = [
  { key: "a3", label: "a³", color: "rgba(59,130,246,0.55)", border: "#60a5fa", count: 1 },
  { key: "a2b", label: "a²b", color: "rgba(16,185,129,0.55)", border: "#34d399", count: 3 },
  { key: "ab2", label: "ab²", color: "rgba(139,92,246,0.55)", border: "#a78bfa", count: 3 },
  { key: "b3", label: "b³", color: "rgba(245,158,11,0.55)", border: "#fbbf24", count: 1 },
];

// 한 변이 (a+b) 인 정육면체를 8조각으로 나누기.
// 각 조각 위치: (ix, iy, iz) ∈ {0,1}³, dims = [A,B], A>B.
// 조각의 종류: bc = ix+iy+iz → 0=a³, 1=a²b, 2=ab², 3=b³.
function CubeView({
  parts,
  rotation,
  highlightedKey,
  onPartClick,
  onPointerMove,
  onPointerDown,
  onPointerUp,
  dim = 240,
  filterOverride,
}: {
  parts: CubePart[];
  rotation: { x: number; y: number };
  highlightedKey?: "a3" | "a2b" | "ab2" | "b3" | null;
  onPartClick?: (key: CubePart["key"]) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  dim?: number;
  // panel 7 에서 step별로 다르게 표시할 때 사용. (key → filter)
  filterOverride?: (key: CubePart["key"]) => string | undefined;
}) {
  const A = Math.round(dim * 0.42);
  const B = Math.round(dim * 0.25);
  const total = A + B;
  const dims = [A, B];
  const offs = [0, A];
  const half = total / 2;

  const blocks: {
    key: CubePart["key"];
    label: string;
    color: string;
    border: string;
    w: number;
    h: number;
    d: number;
    tx: number;
    ty: number;
    tz: number;
  }[] = [];

  for (let ix = 0; ix < 2; ix++) {
    for (let iy = 0; iy < 2; iy++) {
      for (let iz = 0; iz < 2; iz++) {
        const bc = ix + iy + iz;
        const part = parts[bc];
        const w = dims[ix];
        const h = dims[iy];
        const d = dims[iz];
        const ox = offs[ix];
        const oy = offs[iy];
        const oz = offs[iz];
        blocks.push({
          key: part.key,
          label: part.label,
          color: part.color,
          border: part.border,
          w,
          h,
          d,
          tx: ox - half + w / 2,
          ty: oy - half + h / 2,
          tz: oz - half + d / 2,
        });
      }
    }
  }

  return (
    <div
      className="relative mx-auto cursor-grab select-none touch-none active:cursor-grabbing"
      style={{
        width: total,
        height: total,
        perspective: `${dim * 3.3}px`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: "transform 0.05s linear",
        }}
      >
        {blocks.map((b, i) => {
          const filter = filterOverride
            ? filterOverride(b.key)
            : highlightedKey
            ? highlightedKey === b.key
              ? "brightness(1.7) drop-shadow(0 0 10px rgba(255,255,255,0.6))"
              : "brightness(0.25)"
            : undefined;
          return (
            <div
              key={i}
              onClick={onPartClick ? () => onPartClick(b.key) : undefined}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 0,
                height: 0,
                transformStyle: "preserve-3d",
                transform: `translate3d(${b.tx}px, ${b.ty}px, ${b.tz}px)`,
                filter,
                transition: "filter 0.25s ease",
              }}
            >
              <CubeFaces w={b.w} h={b.h} d={b.d} color={b.color} border={b.border} label={b.label} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CubeFaces({
  w,
  h,
  d,
  color,
  border,
  label,
}: {
  w: number;
  h: number;
  d: number;
  color: string;
  border: string;
  label: string;
}) {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    background: color,
    border: `1px solid ${border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    backfaceVisibility: "visible",
  };
  return (
    <>
      {/* front */}
      <div
        style={{
          ...baseStyle,
          width: w,
          height: h,
          marginLeft: -w / 2,
          marginTop: -h / 2,
          transform: `translateZ(${d / 2}px)`,
        }}
      >
        {label}
      </div>
      {/* back */}
      <div
        style={{
          ...baseStyle,
          width: w,
          height: h,
          marginLeft: -w / 2,
          marginTop: -h / 2,
          transform: `translateZ(${-d / 2}px) rotateY(180deg)`,
        }}
      >
        {label}
      </div>
      {/* left */}
      <div
        style={{
          ...baseStyle,
          width: d,
          height: h,
          marginLeft: -d / 2,
          marginTop: -h / 2,
          transform: `translateX(${-w / 2}px) rotateY(-90deg)`,
        }}
      >
        {label}
      </div>
      {/* right */}
      <div
        style={{
          ...baseStyle,
          width: d,
          height: h,
          marginLeft: -d / 2,
          marginTop: -h / 2,
          transform: `translateX(${w / 2}px) rotateY(90deg)`,
        }}
      >
        {label}
      </div>
      {/* top */}
      <div
        style={{
          ...baseStyle,
          width: w,
          height: d,
          marginLeft: -w / 2,
          marginTop: -d / 2,
          transform: `translateY(${-h / 2}px) rotateX(-90deg)`,
        }}
      >
        {label}
      </div>
      {/* bottom */}
      <div
        style={{
          ...baseStyle,
          width: w,
          height: d,
          marginLeft: -w / 2,
          marginTop: -d / 2,
          transform: `translateY(${h / 2}px) rotateX(90deg)`,
        }}
      >
        {label}
      </div>
    </>
  );
}

function useCubeRotation(initial: { x: number; y: number }) {
  const [rot, setRot] = useState(initial);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setRot((r) => ({ x: r.x + dy * 0.4, y: r.y + dx * 0.6 }));
    dragRef.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null;
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
  }
  function reset() {
    setRot(initial);
  }
  function nudge(dx: number, dy: number) {
    setRot((r) => ({ x: r.x + dy, y: r.y + dx }));
  }
  return { rot, onPointerDown, onPointerMove, onPointerUp, reset, nudge };
}

// ─── Panel 6: (a+b)³ 3D ────────────────────────────────────
function CubeAPlusBCubed({ onComplete }: { onComplete: () => void }) {
  const { rot, onPointerDown, onPointerMove, onPointerUp, reset, nudge } = useCubeRotation({
    x: -22,
    y: 28,
  });
  const [hl, setHl] = useState<CubePart["key"] | null>(null);
  const [done, setDone] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
        새 공식 ② — (a+b)³ 탐구
      </p>
      <div className="mt-2 rounded-xl border border-sky-400/30 bg-sky-400/[0.05] px-4 py-3 text-center font-mono text-base font-bold text-sky-100">
        (a+b)³ = a³ + 3a²b + 3ab² + b³
      </div>
      <p className="mt-3 text-sm text-slate-400">
        한 변이 <b className="text-amber-200">(a+b)</b> 인 정육면체를 8개 조각으로 나눠 보세요.
        조각 카드를 누르면 정육면체에서 강조됩니다. 정육면체는 <b className="text-cyan-200">드래그</b>로
        회전할 수 있습니다.
      </p>

      <div className="mt-4 flex flex-wrap items-start gap-5">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
            8개 조각 (클릭하면 강조)
          </p>
          <div className="flex flex-wrap gap-2">
            {CUBE_PARTS_6.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setHl((h) => (h === p.key ? null : p.key))}
                className={
                  "rounded-lg border-2 px-3 py-1.5 font-mono text-sm font-extrabold transition " +
                  (hl === p.key
                    ? "scale-105 shadow-lg"
                    : "hover:-translate-y-0.5 hover:shadow-md")
                }
                style={{
                  background: p.color,
                  borderColor: p.border,
                  color: "#fff",
                }}
              >
                {p.label}
                {p.count > 1 ? <span className="ml-1 opacity-70">×{p.count}</span> : null}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!done) {
                  setDone(true);
                  onComplete();
                }
              }}
              disabled={done}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ✔ 공식 확인
            </button>
            <button
              type="button"
              onClick={() => setHl(null)}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              ↻ 강조 해제
            </button>
          </div>
          {done ? (
            <p className="mt-3 text-sm font-bold text-emerald-300">
              🎉 (a+b)³ = a³ + 3a²b + 3ab² + b³ — 8 조각: a³(×1) + a²b(×3) + ab²(×3) + b³(×1)
            </p>
          ) : null}
        </div>

        <div>
          <CubeView
            parts={CUBE_PARTS_6}
            rotation={rot}
            highlightedKey={hl}
            onPartClick={(k) => setHl((h) => (h === k ? null : k))}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
          <div className="mt-2 flex justify-center gap-1">
            <RotBtn onClick={() => nudge(-25, 0)}>◀</RotBtn>
            <RotBtn onClick={() => nudge(25, 0)}>▶</RotBtn>
            <RotBtn onClick={() => nudge(0, -20)}>▲</RotBtn>
            <RotBtn onClick={() => nudge(0, 20)}>▼</RotBtn>
            <RotBtn onClick={reset}>↺</RotBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel 7: a³+b³ 3D ─────────────────────────────────────
function CubeAcubedPlusBcubed({ onComplete }: { onComplete: () => void }) {
  const { rot, onPointerDown, onPointerMove, onPointerUp, reset, nudge } = useCubeRotation({
    x: -22,
    y: 28,
  });
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(1);
  const [done, setDone] = useState(false);

  // step별 큐브 표시:
  // 1: 전체 정상
  // 2: a²b 강조 + 나머지 흐리게 (제거 직전)
  // 3: ab² 강조 (a²b 흐림+제거됨, b³,a³ 흐림)
  // 4: a³, b³ 만 표시 (a²b, ab² 사라짐 / 매우 흐리게)
  const filterOverride = (key: CubePart["key"]): string | undefined => {
    if (step === 1) return undefined;
    if (step === 2) {
      return key === "a2b"
        ? "brightness(1.8) drop-shadow(0 0 8px #34d399)"
        : "brightness(0.3)";
    }
    if (step === 3) {
      return key === "ab2"
        ? "brightness(1.8) drop-shadow(0 0 8px #a78bfa)"
        : key === "a2b"
        ? "opacity(0.08)"
        : "brightness(0.3)";
    }
    if (step === 4) {
      return key === "a3" || key === "b3"
        ? "brightness(1.7) drop-shadow(0 0 10px #fff)"
        : "opacity(0.08)";
    }
    return undefined;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
        새 공식 ③ — a³+b³ 인수분해 탐구
      </p>
      <div className="mt-2 rounded-xl border border-sky-400/30 bg-sky-400/[0.05] px-4 py-3 text-center font-mono text-base font-bold text-sky-100">
        a³ + b³ = (a+b)(a² − ab + b²)
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        한 변 <b className="text-amber-200">(a+b)</b> 인 정육면체 = (a+b)³ 에서 시작합니다. 3a²b
        조각 3개와 3ab² 조각 3개를 제거하면 a³ 과 b³ 만 남습니다. 이를 인수분해하면 a³+b³ =
        (a+b)(a²−ab+b²).
      </p>

      <div className="mt-4 flex flex-wrap items-start gap-5">
        <div className="flex-1 min-w-[260px]">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
            a³+b³ 유도 단계
          </p>
          <div className="space-y-1.5">
            {[
              { n: 1 as const, txt: <>① (a+b)³ 전체 = a³ + 3a²b + 3ab² + b³</> },
              { n: 2 as const, txt: <>② <Chip color="emerald">a²b</Chip> 조각 3개 제거 → a³ + 3ab² + b³</> },
              { n: 3 as const, txt: <>③ <Chip color="violet">ab²</Chip> 조각 3개 제거 → a³ + b³</> },
              {
                n: 4 as const,
                txt: (
                  <>
                    ④ 남은 <Chip color="sky">a³</Chip> 과 <Chip color="amber">b³</Chip> 만 남음
                  </>
                ),
              },
            ].map((it) => (
              <button
                key={it.n}
                type="button"
                onClick={() => setStep(it.n)}
                className={
                  "block w-full rounded-lg border px-3 py-2 text-left text-sm transition " +
                  (step === it.n
                    ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {it.txt}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-violet-400/35 bg-violet-400/[0.06] p-3 text-xs font-mono leading-7 text-slate-200">
            a³ + b³<br />
            = (a+b)³ − 3a²b − 3ab²<br />
            = (a+b)³ − 3ab(a+b)<br />
            = (a+b)[(a+b)² − 3ab]<br />
            = (a+b)(a²+2ab+b² − 3ab)<br />
            = <b className="text-amber-200">(a+b)(a² − ab + b²)</b>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!done) {
                  setDone(true);
                  onComplete();
                }
              }}
              disabled={done}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ✔ 공식 확인
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              ↻ 처음 단계
            </button>
          </div>

          {done ? (
            <p className="mt-3 text-sm font-bold text-emerald-300">
              🎉 a³ + b³ = (a+b)(a² − ab + b²) — 도형으로 확인 완료
            </p>
          ) : null}
        </div>

        <div>
          <CubeView
            parts={CUBE_PARTS_6}
            rotation={rot}
            filterOverride={filterOverride}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
          <div className="mt-2 flex justify-center gap-1">
            <RotBtn onClick={() => nudge(-25, 0)}>◀</RotBtn>
            <RotBtn onClick={() => nudge(25, 0)}>▶</RotBtn>
            <RotBtn onClick={() => nudge(0, -20)}>▲</RotBtn>
            <RotBtn onClick={() => nudge(0, 20)}>▼</RotBtn>
            <RotBtn onClick={reset}>↺</RotBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 공용 작은 컴포넌트 ──────────────────────────────────────
function Chip({
  color,
  children,
}: {
  color: "sky" | "emerald" | "violet" | "amber";
  children: React.ReactNode;
}) {
  const cls =
    color === "sky"
      ? "border-sky-400/55 bg-sky-400/15 text-sky-100"
      : color === "emerald"
      ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
      : color === "violet"
      ? "border-violet-400/55 bg-violet-400/15 text-violet-100"
      : "border-amber-400/55 bg-amber-400/15 text-amber-100";
  return (
    <span className={`mx-1 inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-xs font-bold ${cls}`}>
      {children}
    </span>
  );
}

function RotBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-200 transition hover:bg-white/10"
    >
      {children}
    </button>
  );
}

