"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ──────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "cycle_reason",
    prompt:
      "ω 의 거듭제곱이 주기 3 으로 순환하는 이유를 ω³ = 1 을 이용해 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: ω³ = 1 이므로 ω의 거듭제곱은 지수가 3 만큼 커질 때마다 원래 값으로 돌아온다. 따라서 ωⁿ 의 값은 n 을 3 으로 나눈 나머지에 따라 1 (나머지 0), ω (나머지 1), ω² (나머지 2) 로 결정된다.",
  },
  {
    id: "sum_strategy",
    prompt:
      "ω³⁰ + ω²⁹ + ⋯ + ω + 1 처럼 연속된 ω 거듭제곱의 합을 구하는 전략과, 자주 쓰이는 핵심 성질을 함께 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 1 + ω + ω² = 0 이 핵심이다. 항을 3 개씩 묶으면 그 합이 0 이 되므로, 전체 항의 개수를 3 으로 나눠 ‘몇 묶음’ 인지 파악하고 남은 항만 계산하면 된다. 또 1/ω = ω², 1/ω² = ω 같은 변환도 같은 성질에서 나온다.",
  },
];

// ─── 표기 헬퍼 ────────────────────────────────────────────
function W() {
  return <em className="font-serif not-italic text-teal-200">ω</em>;
}
function W2() {
  return (
    <em className="font-serif not-italic text-amber-200">
      ω<sup className="text-[0.6em]">2</sup>
    </em>
  );
}
function WBar() {
  return <span className="font-serif text-cyan-200 [text-decoration:overline]">ω</span>;
}
function WBar2() {
  return (
    <span className="font-serif text-cyan-200">
      <span className="[text-decoration:overline]">ω</span>
      <sup className="text-[0.6em]">2</sup>
    </span>
  );
}
function I() {
  return <em className="font-serif italic text-pink-300">i</em>;
}
function Sqrt({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap">
      √<span className="border-t border-current px-[1px]">{children}</span>
    </span>
  );
}

// ─── 메인 ─────────────────────────────────────────────────
type TabId = 1 | 2 | 3 | 4;

export default function OmegaLawExplorer() {
  const [tab, setTab] = useState<TabId>(1);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* 헤더 */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🌀 ω-법칙 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          x³ = 1 의 허수근 <W /> 의 4 가지 성질을 익히고 — 순환표 · 계산기 · 단계별 풀이 ·
          활용 문제 8 선으로 ω 거듭제곱을 정복합니다.
        </p>
        <div className="mt-3 rounded-xl border border-teal-400/30 bg-teal-400/[0.06] px-4 py-2 text-center font-serif text-amber-100">
          <W /> = <sup>−1 + <Sqrt>3</Sqrt> <I /></sup>⁄<sub>2</sub>
          &nbsp; , &nbsp;
          <WBar /> = <sup>−1 − <Sqrt>3</Sqrt> <I /></sup>⁄<sub>2</sub>
        </div>
      </div>

      {/* 탭 */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <TabBtn active={tab === 1} onClick={() => setTab(1)}>
          🔍 ω 법칙
        </TabBtn>
        <TabBtn active={tab === 2} onClick={() => setTab(2)}>
          🔄 순환 탐구
        </TabBtn>
        <TabBtn active={tab === 3} onClick={() => setTab(3)}>
          📐 기본 계산
        </TabBtn>
        <TabBtn active={tab === 4} onClick={() => setTab(4)}>
          🎯 활용 문제
        </TabBtn>
      </div>

      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <Tab1Properties />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <Tab2Cycle />
      </div>
      <div className={tab === 3 ? "mt-5" : "mt-5 hidden"}>
        <Tab3Steps />
      </div>
      <div className={tab === 4 ? "mt-5" : "mt-5 hidden"}>
        <Tab4Quiz />
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
        "rounded-xl px-3 py-2.5 text-sm font-bold transition " +
        (active
          ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-teal-200")
      }
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — ω 의 4 가지 성질
// ═══════════════════════════════════════════════════════════

type PropCard = {
  num: number;
  title: string;
  formula: ReactNode;
  why: ReactNode;
  proof: ReactNode;
};

const PROPS: PropCard[] = [
  {
    num: 1,
    title: "주기성 — 3 번이면 제자리!",
    formula: (
      <>
        <W />³ = 1 , &nbsp; <WBar />³ = 1
      </>
    ),
    why: (
      <>
        ω 와 <WBar /> 는 <b className="text-teal-200">x³ = 1 의 해</b> 이므로 대입하면
        바로 성립합니다.
      </>
    ),
    proof: (
      <>
        x³ − 1 = (x − 1)(x² + x + 1) = 0<br />
        → x = 1 또는 x² + x + 1 = 0 의 근.
        <br />
        ω 와 <WBar /> 는 x² + x + 1 = 0 의 근이므로 — <b className="text-amber-200">ω³ = 1</b> ✓
      </>
    ),
  },
  {
    num: 2,
    title: "방정식 관계",
    formula: (
      <>
        <W />² + <W /> + 1 = 0
        <br />
        <WBar />² + <WBar /> + 1 = 0
      </>
    ),
    why: (
      <>
        ω 와 <WBar /> 는 <b className="text-teal-200">x² + x + 1 = 0 의 해</b> 이므로
        직접 대입하면 성립합니다.
      </>
    ),
    proof: (
      <>
        x³ − 1 = (x − 1)(x² + x + 1) = 0 에서
        <br />
        x ≠ 1 → x² + x + 1 = 0.
        <br />
        ω 는 이 이차방정식의 근 → <b className="text-amber-200">ω² + ω + 1 = 0</b> ✓
        <br />
        ★ <span className="text-amber-200">이 성질이 ω 계산에서 가장 자주 쓰입니다.</span>
      </>
    ),
  },
  {
    num: 3,
    title: "켤레의 합·곱",
    formula: (
      <>
        <W /> + <WBar /> = −1
        <br />
        <W /> · <WBar /> = 1
      </>
    ),
    why: (
      <>
        ω 와 <WBar /> 는 <b className="text-teal-200">x² + x + 1 = 0 의 두 근</b> 이므로
        근과 계수의 관계로 성립합니다.
      </>
    ),
    proof: (
      <>
        x² + x + 1 = 0 의 두 근이 ω, <WBar /> 이므로
        <br />· (두 근의 합) = −(1차)/(최고차) = −1 → <b>ω + <WBar /> = −1</b> ✓
        <br />· (두 근의 곱) = (상수)/(최고차) = 1 → <b>ω · <WBar /> = 1</b> ✓
      </>
    ),
  },
  {
    num: 4,
    title: "제곱과 켤레의 관계",
    formula: (
      <>
        <W />² = <WBar /> , &nbsp; <WBar />² = <W />
      </>
    ),
    why: (
      <>
        <b className="text-teal-200">ω · <WBar /> = 1</b> 에서 양변을 ω 로 나누면 바로
        유도됩니다.
      </>
    ),
    proof: (
      <>
        ω · <WBar /> = 1 → <WBar /> = 1/ω.
        <br />
        그런데 ω³ = 1 이므로 1/ω = ω³/ω = ω².
        <br />
        ∴ <b className="text-amber-200"><WBar /> = ω²</b> ✓ , 마찬가지로{" "}
        <b className="text-amber-200"><WBar />² = ω</b> ✓
      </>
    ),
  },
];

function Tab1Properties() {
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  function toggle(n: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal-400/30 bg-gradient-to-br from-teal-500/10 via-cyan-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-teal-100">🔍 ω 의 4 가지 핵심 성질</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          각 카드를 읽고 <b>▼ 증명 보기</b> 를 눌러 왜 성립하는지 확인해 보세요.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PROPS.map((p) => (
          <div
            key={p.num}
            className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-sm font-extrabold text-white">
              {p.num}
            </div>
            <p className="mt-2 text-sm font-bold text-teal-200">{p.title}</p>
            <div className="mt-2 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-center font-serif text-base leading-7 text-amber-100">
              {p.formula}
            </div>
            <p className="mt-2 text-xs leading-6 text-slate-300">{p.why}</p>
            <button
              type="button"
              onClick={() => toggle(p.num)}
              className="mt-2 text-xs font-bold text-teal-300 transition hover:text-teal-200"
            >
              {open.has(p.num) ? "▲ 닫기" : "▼ 증명 보기"}
            </button>
            {open.has(p.num) ? (
              <div className="mt-2 rounded-lg border border-teal-400/30 bg-teal-400/[0.06] px-3 py-2 text-xs leading-7 text-slate-200">
                {p.proof}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* 핵심 요약 */}
      <div className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.07] p-4 text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
          ⭐ 계산에서 가장 자주 쓰는 성질
        </p>
        <p className="mt-2 font-serif text-base leading-8 text-amber-100 sm:text-lg">
          <W />³ = 1 &nbsp;,&nbsp; <W />² + <W /> + 1 = 0 &nbsp;⟹&nbsp; <W /> + <W />² = −1
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 순환 탐구 (순환표 + 계산기 + SVG 원형 다이어그램)
// ═══════════════════════════════════════════════════════════

type FillKey = "one" | "w" | "w2";
const FILL_DISP: Record<FillKey, ReactNode> = {
  one: <>1</>,
  w: <W />,
  w2: <W2 />,
};

// ω⁰ ~ ω⁸ 의 정답값 (given: 0,1; 빈칸: 2~8)
const CYCLE_ANSWERS: FillKey[] = ["one", "w", "w2", "one", "w", "w2", "one", "w", "w2"];
const FILLABLE_IDX = [2, 3, 4, 5, 6, 7, 8]; // 7 칸

function Tab2Cycle() {
  // 순환표 상태
  const [pickedFill, setPickedFill] = useState<FillKey | null>(null);
  const [cellState, setCellState] = useState<Record<number, "correct" | "wrong" | null>>(
    {},
  );
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);

  const filledCount = Object.values(cellState).filter((s) => s === "correct").length;
  const done = filledCount === FILLABLE_IDX.length;

  function clickCell(idx: number) {
    if (cellState[idx] === "correct") return;
    if (!pickedFill) {
      setWrongFlash(idx);
      window.setTimeout(() => setWrongFlash(null), 500);
      return;
    }
    if (pickedFill === CYCLE_ANSWERS[idx]) {
      setCellState((prev) => ({ ...prev, [idx]: "correct" }));
    } else {
      setWrongFlash(idx);
      window.setTimeout(() => setWrongFlash(null), 500);
    }
  }

  // 계산기
  const [n, setN] = useState<number>(10);
  const calc = useMemo(() => {
    const r = ((n % 3) + 3) % 3;
    const result: FillKey = r === 0 ? "one" : r === 1 ? "w" : "w2";
    const absN = Math.abs(n);
    const q = Math.floor(absN / 3);
    return { r, result, absN, q };
  }, [n]);

  return (
    <div className="space-y-5">
      {/* 미션 1: 순환표 */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-base font-bold text-teal-200">🔄 미션 1 · ω 순환표 채우기</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          값을 먼저 선택한 뒤 빈 칸을 클릭해서 채워 보세요. <W />³ = 1 이므로 지수를{" "}
          <b className="text-teal-200">3 으로 나눈 나머지</b> 에 따라 값이 결정됩니다.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">채울 값 →</span>
          {(["one", "w", "w2"] as FillKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setPickedFill(k)}
              className={
                "rounded-lg border-2 px-3 py-1.5 text-sm font-bold transition " +
                (pickedFill === k
                  ? "border-teal-300 bg-teal-400/20 text-teal-100"
                  : "border-white/15 bg-white/5 text-slate-300 hover:border-white/25")
              }
            >
              {FILL_DISP[k]}
            </button>
          ))}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-center font-serif">
            <thead>
              <tr>
                {CYCLE_ANSWERS.map((_, i) => (
                  <th
                    key={i}
                    className="border border-white/10 bg-white/[0.03] px-1 py-2 text-xs font-bold text-slate-400"
                  >
                    <W />
                    <sup className="text-[0.6em]">{i}</sup>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {CYCLE_ANSWERS.map((ans, i) => {
                  const given = i < 2;
                  const correct = cellState[i] === "correct";
                  const isWrong = wrongFlash === i;
                  return (
                    <td
                      key={i}
                      onClick={given || correct ? undefined : () => clickCell(i)}
                      className={
                        "border border-white/10 px-1 py-3 text-base transition " +
                        (given
                          ? "bg-cyan-400/10 text-cyan-100"
                          : correct
                          ? "bg-emerald-400/15 text-emerald-100"
                          : isWrong
                          ? "bg-rose-400/25 text-rose-100"
                          : "cursor-pointer bg-white/[0.03] text-slate-500 hover:bg-white/[0.07] hover:text-slate-300")
                      }
                    >
                      {given || correct ? FILL_DISP[ans] : ""}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-center text-xs text-slate-400">
          {done
            ? "✅ 모든 칸 완성! 패턴을 확인해 보세요."
            : `빈 칸 ${FILLABLE_IDX.length - filledCount} 개 남았습니다.`}
        </p>

        {done ? (
          <div className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] p-3 text-sm leading-7 text-emerald-100">
            🎉 <b>완성!</b> ω³ = 1 이므로 지수가 3 만큼 커질 때마다 원래 값으로 돌아옵니다
            (<b>주기 3</b>). 따라서 ωⁿ 의 값은 <b>n 을 3 으로 나눈 나머지</b> 에 따라
            결정됩니다.
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li>나머지 0 (3 의 배수) → <b>1</b></li>
              <li>나머지 1 → <b>ω</b></li>
              <li>나머지 2 → <b>ω²</b></li>
            </ul>
          </div>
        ) : null}
      </div>

      {/* 미션 2: 계산기 + 원형 다이어그램 */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-base font-bold text-teal-200">⚡ 미션 2 · ω 거듭제곱 계산기</p>

        <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_280px]">
          <div>
            <label
              htmlFor="omega-n"
              className="text-xs font-bold text-slate-400"
            >
              지수 n 입력 (정수, 음수 가능)
            </label>
            <input
              id="omega-n"
              type="number"
              value={n}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v)) setN(v);
              }}
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 font-serif text-lg text-amber-200 outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
            <p className="mt-1 text-[11px] text-teal-300">
              예: 10, 100, 2023, −2, −7 …
            </p>

            <div className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] p-3 text-sm leading-7 text-slate-200">
              <p>
                n = <b className="text-amber-200">{n}</b>
              </p>
              <p>
                {calc.absN} ÷ 3 = {calc.q} ··· 나머지{" "}
                <b className="text-amber-200">{calc.r}</b>
              </p>
              <p>
                → <W />
                <sup className="text-[0.7em]">{n}</sup> = (<W />³)
                <sup className="text-[0.7em]">□</sup> × <W />
                <sup className="text-[0.7em]">{calc.r}</sup> = 1 × <W />
                <sup className="text-[0.7em]">{calc.r}</sup>
              </p>
            </div>

            <div className="mt-2 rounded-lg border border-amber-300/30 bg-amber-300/[0.08] px-3 py-2.5 text-center font-serif text-lg text-amber-100">
              <W />
              <sup className="text-[0.7em]">{n}</sup> ={" "}
              <b className="text-xl">{FILL_DISP[calc.result]}</b>
            </div>
          </div>

          <CycleDiagram highlight={calc.result} />
        </div>
      </div>
    </div>
  );
}

function CycleDiagram({ highlight }: { highlight: FillKey }) {
  // 3 노드 = 1 (오른쪽), ω (좌상), ω² (좌하). ×ω 화살표가 1 → ω → ω² → 1 순환
  const W_BOX = 260;
  const H_BOX = 260;
  const cx = W_BOX / 2;
  const cy = H_BOX / 2;
  const r = 88;
  const sq3 = Math.sqrt(3);

  const nodes: { key: FillKey; x: number; y: number; col: string; label: ReactNode }[] = [
    { key: "one", x: cx + r, y: cy, col: "#60a5fa", label: "1" },
    { key: "w", x: cx - r / 2, y: cy - (r * sq3) / 2, col: "#14b8a6", label: "ω" },
    { key: "w2", x: cx - r / 2, y: cy + (r * sq3) / 2, col: "#f59e0b", label: "ω²" },
  ];
  const nodeR = 22;

  // 화살표 (i → (i+1)%3), 곡선 (바깥쪽으로 휨)
  const arrows = nodes.map((from, i) => {
    const to = nodes[(i + 1) % nodes.length];
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const dx = mx - cx;
    const dy = my - cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const cpx = mx + (dx / len) * r * 0.55;
    const cpy = my + (dy / len) * r * 0.55;

    // 시작·끝점을 노드 둘레 바깥으로 살짝 당김
    const startDx = cpx - from.x;
    const startDy = cpy - from.y;
    const sLen = Math.sqrt(startDx * startDx + startDy * startDy) || 1;
    const sx = from.x + (startDx / sLen) * nodeR;
    const sy = from.y + (startDy / sLen) * nodeR;

    const endDx = to.x - cpx;
    const endDy = to.y - cpy;
    const eLen = Math.sqrt(endDx * endDx + endDy * endDy) || 1;
    const tx = endDx / eLen;
    const ty = endDy / eLen;
    const ex = to.x - tx * nodeR;
    const ey = to.y - ty * nodeR;

    // 라벨 위치 (×ω)
    const lx = (sx + 2 * cpx + ex) / 4;
    const ly = (sy + 2 * cpy + ey) / 4;
    const ldx = lx - cx;
    const ldy = ly - cy;
    const ll = Math.sqrt(ldx * ldx + ldy * ldy) || 1;
    return {
      d: `M ${sx} ${sy} Q ${cpx} ${cpy} ${ex} ${ey}`,
      tx,
      ty,
      ex,
      ey,
      lx: lx + (ldx / ll) * 12,
      ly: ly + (ldy / ll) * 12,
    };
  });

  return (
    <div className="rounded-xl border border-teal-400/20 bg-slate-950/60 p-2">
      <svg
        viewBox={`0 0 ${W_BOX} ${H_BOX}`}
        className="block w-full"
        role="img"
        aria-label="ω 거듭제곱 순환 다이어그램"
      >
        {/* 바깥 원 */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(20,184,166,0.2)"
          strokeWidth="1.4"
        />

        {/* 화살표 (×ω) */}
        {arrows.map((a, i) => {
          const aS = 8;
          const headD = `M ${a.ex} ${a.ey} L ${a.ex - a.tx * aS + a.ty * aS * 0.4} ${
            a.ey - a.ty * aS - a.tx * aS * 0.4
          } L ${a.ex - a.tx * aS - a.ty * aS * 0.4} ${
            a.ey - a.ty * aS + a.tx * aS * 0.4
          } Z`;
          return (
            <g key={`arr-${i}`}>
              <path
                d={a.d}
                fill="none"
                stroke="rgba(20,184,166,0.65)"
                strokeWidth="2"
              />
              <path d={headD} fill="rgba(20,184,166,0.8)" />
              <text
                x={a.lx}
                y={a.ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fontWeight="bold"
                fill="#5eead4"
              >
                ×ω
              </text>
            </g>
          );
        })}

        {/* 노드 */}
        {nodes.map((n) => {
          const isHi = n.key === highlight;
          return (
            <g key={n.key}>
              {isHi ? (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={nodeR + 6}
                  fill="none"
                  stroke={n.col}
                  strokeWidth="2"
                  opacity="0.45"
                />
              ) : null}
              <circle
                cx={n.x}
                cy={n.y}
                r={nodeR}
                fill={n.col}
                style={{ filter: `drop-shadow(0 0 8px ${n.col})` }}
              />
              <text
                x={n.x}
                y={n.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="'Times New Roman', serif"
                fontWeight="bold"
                fontSize={n.label === "ω²" ? 12 : 14}
                fill="#0c1f34"
              >
                {n.label === "ω²" ? (
                  <>
                    <tspan dy="0">ω</tspan>
                    <tspan baselineShift="super" fontSize="9">
                      2
                    </tspan>
                  </>
                ) : (
                  n.label
                )}
              </text>
            </g>
          );
        })}

        {/* 중앙 라벨 */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fill="rgba(20,184,166,0.5)"
        >
          주기 3
        </text>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 3 — 기본 계산 3 선 (단계별)
// ═══════════════════════════════════════════════════════════

type StepChoice = { label: ReactNode; val: string };
type Step = {
  hint: ReactNode;
  choices: StepChoice[];
  correct: string;
  ok: string;
  ng: string;
};
type StepProblem = {
  id: "p1" | "p2" | "p3";
  num: number;
  question: ReactNode;
  steps: Step[];
  finalAns: ReactNode;
};

const STEP_PROBLEMS: StepProblem[] = [
  {
    id: "p1",
    num: 1,
    question: (
      <>
        <W />
        <sup className="text-[0.7em]">10</sup> + <W />
        <sup className="text-[0.7em]">5</sup>
      </>
    ),
    steps: [
      {
        hint: (
          <>
            <b>STEP 1.</b> 10 = 3 × 3 + 1 이므로, <W />
            <sup className="text-[0.7em]">10</sup> = ?
          </>
        ),
        choices: [
          { label: "1", val: "one" },
          { label: <W />, val: "w" },
          { label: <W2 />, val: "w2" },
        ],
        correct: "w",
        ok: "맞아요! 10 ÷ 3 = 3···1 → ω¹⁰ = ω",
        ng: "10 을 3 으로 나눈 나머지를 확인하세요. 10 = 3×3 + 1 → 나머지 1.",
      },
      {
        hint: (
          <>
            <b>STEP 2.</b> 5 = 3 × 1 + 2 이므로, <W />
            <sup className="text-[0.7em]">5</sup> = ?
          </>
        ),
        choices: [
          { label: "1", val: "one" },
          { label: <W />, val: "w" },
          { label: <W2 />, val: "w2" },
        ],
        correct: "w2",
        ok: "맞아요! 5 ÷ 3 = 1···2 → ω⁵ = ω²",
        ng: "5 를 3 으로 나눈 나머지를 확인하세요. 5 = 3×1 + 2 → 나머지 2.",
      },
      {
        hint: (
          <>
            <b>STEP 3.</b> ω² + ω + 1 = 0 이므로, ω + ω² = ?
          </>
        ),
        choices: [
          { label: "0", val: "0" },
          { label: "−1", val: "-1" },
          { label: "1", val: "1" },
          { label: "2", val: "2" },
        ],
        correct: "-1",
        ok: "정답! ω² + ω + 1 = 0 에서 ω + ω² = −1",
        ng: "ω² + ω + 1 = 0 을 변형하세요. ω + ω² = ?",
      },
    ],
    finalAns: (
      <>
        <W />
        <sup className="text-[0.7em]">10</sup> + <W />
        <sup className="text-[0.7em]">5</sup> = ω + ω² = <b>−1</b>
      </>
    ),
  },
  {
    id: "p2",
    num: 2,
    question: (
      <>
        <W />
        <sup className="text-[0.7em]">20</sup> +{" "}
        <sup>1</sup>⁄
        <sub>
          <W />
          <sup className="text-[0.6em]">20</sup>
        </sub>
      </>
    ),
    steps: [
      {
        hint: (
          <>
            <b>STEP 1.</b> 20 = 3 × 6 + 2 이므로, <W />
            <sup className="text-[0.7em]">20</sup> = ?
          </>
        ),
        choices: [
          { label: "1", val: "one" },
          { label: <W />, val: "w" },
          { label: <W2 />, val: "w2" },
        ],
        correct: "w2",
        ok: "맞아요! 20 ÷ 3 = 6···2 → ω²⁰ = ω²",
        ng: "20 을 3 으로 나눈 나머지를 확인하세요. 20 = 3×6 + 2.",
      },
      {
        hint: (
          <>
            <b>STEP 2.</b> ω³ = 1 이므로 1/ω² = ω³/ω² = ω. 즉 1/ω²⁰ = ?
          </>
        ),
        choices: [
          { label: "1", val: "one" },
          { label: <W />, val: "w" },
          { label: <W2 />, val: "w2" },
          { label: "−1", val: "-1" },
        ],
        correct: "w",
        ok: "맞아요! 1/ω²⁰ = 1/ω² = ω",
        ng: "ω³ = 1 이므로 1/ω² = ω³ ÷ ω² = ω.",
      },
      {
        hint: <><b>STEP 3.</b> ω² + ω = ?</>,
        choices: [
          { label: "0", val: "0" },
          { label: "−1", val: "-1" },
          { label: "1", val: "1" },
          { label: "2", val: "2" },
        ],
        correct: "-1",
        ok: "정답! ω² + ω = −1",
        ng: "ω² + ω + 1 = 0 을 이용하세요.",
      },
    ],
    finalAns: (
      <>
        <W />
        <sup className="text-[0.7em]">20</sup> +{" "}
        <sup>1</sup>⁄
        <sub>
          <W />
          <sup className="text-[0.6em]">20</sup>
        </sub>{" "}
        = ω² + ω = <b>−1</b>
      </>
    ),
  },
  {
    id: "p3",
    num: 3,
    question: (
      <>
        <W />
        <sup className="text-[0.7em]">30</sup> + <W />
        <sup className="text-[0.7em]">29</sup> + ⋯ + <W /> + 1
      </>
    ),
    steps: [
      {
        hint: <><b>STEP 1.</b> 이 합의 항의 개수는? (ω⁰ = 1 포함)</>,
        choices: [
          { label: "29 개", val: "29" },
          { label: "30 개", val: "30" },
          { label: "31 개", val: "31" },
        ],
        correct: "31",
        ok: "맞아요! ω⁰ = 1 부터 ω³⁰ 까지 31 개.",
        ng: "ω⁰ = 1 도 포함해서 세어 보세요 (30 − 0 + 1 = 31).",
      },
      {
        hint: <><b>STEP 2.</b> 31 = 3 × □ + 1 에서 □ = ? (3 개씩 몇 묶음?)</>,
        choices: [
          { label: "9", val: "9" },
          { label: "10", val: "10" },
          { label: "11", val: "11" },
        ],
        correct: "10",
        ok: "맞아요! 31 = 3 × 10 + 1 이므로 10 묶음 + 1.",
        ng: "31 을 3 으로 나눠 보세요. 31 = 3 × ? + 1.",
      },
      {
        hint: (
          <>
            <b>STEP 3.</b> 10 묶음 × (1 + ω + ω²) = 0. 남은 항{" "}
            <W />
            <sup className="text-[0.7em]">30</sup> = ?
          </>
        ),
        choices: [
          { label: <W />, val: "w" },
          { label: <W2 />, val: "w2" },
          { label: "1", val: "one" },
          { label: "−1", val: "-1" },
        ],
        correct: "one",
        ok: "맞아요! 30 ÷ 3 = 10, 나머지 0 → ω³⁰ = 1",
        ng: "30 ÷ 3 = 10 ··· 0 → ω³⁰ = 1",
      },
    ],
    finalAns: (
      <>
        = 10 × (1 + ω + ω²) + <W />
        <sup className="text-[0.7em]">30</sup> = 10 × 0 + 1 = <b>1</b>
      </>
    ),
  },
];

function Tab3Steps() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-teal-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-cyan-100">📐 기본 계산 3 선</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          각 단계의 선택지를 클릭해서 정답을 맞혀 가며 풀이 전략을 익혀 보세요.
        </p>
      </div>

      <div className="space-y-4">
        {STEP_PROBLEMS.map((p) => (
          <StepProblemCard key={p.id} problem={p} />
        ))}
      </div>
    </div>
  );
}

function StepProblemCard({ problem }: { problem: StepProblem }) {
  // 각 step 의 선택 결과 ("correct"/"wrong"/null). null = 아직 선택 안함.
  const [picked, setPicked] = useState<Record<number, string | null>>({});

  function pick(stepIdx: number, val: string) {
    if (picked[stepIdx] !== undefined) return; // 이미 선택했으면 잠금
    setPicked((prev) => ({ ...prev, [stepIdx]: val }));
  }

  const allDone =
    problem.steps.every((_, i) => picked[i] !== undefined) &&
    problem.steps.every((s, i) => picked[i] === s.correct);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-sm font-extrabold text-white">
          {problem.num}
        </div>
        <p className="font-serif text-lg italic text-amber-200">{problem.question}</p>
      </div>

      <div className="mt-4 space-y-4">
        {problem.steps.map((step, idx) => {
          const sel = picked[idx];
          const decided = sel !== undefined;
          const correct = sel === step.correct;
          return (
            <div key={idx}>
              <p className="text-sm leading-7 text-slate-200">{step.hint}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {step.choices.map((c) => {
                  let cls = "border-white/15 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10";
                  if (decided) {
                    if (c.val === step.correct) {
                      cls = "border-emerald-400/55 bg-emerald-400/15 text-emerald-100";
                    } else if (c.val === sel) {
                      cls = "border-rose-400/55 bg-rose-400/15 text-rose-100";
                    } else {
                      cls = "border-white/10 bg-white/[0.03] text-slate-500";
                    }
                  }
                  return (
                    <button
                      key={c.val}
                      type="button"
                      onClick={() => pick(idx, c.val)}
                      disabled={decided}
                      className={
                        "rounded-lg border-2 px-3 py-1.5 text-sm font-bold transition disabled:cursor-default " +
                        cls
                      }
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              {decided ? (
                <p
                  className={
                    "mt-2 text-xs leading-6 " +
                    (correct ? "text-emerald-300" : "text-rose-300")
                  }
                >
                  {correct ? "✅ " : "❌ "}
                  {correct ? step.ok : step.ng}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {allDone ? (
        <div className="mt-4 rounded-lg border border-amber-300/40 bg-amber-300/[0.08] px-3 py-2.5 text-center font-serif text-base text-amber-100">
          {problem.finalAns}
        </div>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 4 — 활용 문제 8 선
// ═══════════════════════════════════════════════════════════

type Diff = "e" | "m" | "h";
type QuizQ = {
  num: number;
  diff: Diff;
  q: ReactNode;
  choices: { label: ReactNode; val: string }[];
  correct: string;
  exp: ReactNode;
};

const DIFF_LABEL: Record<Diff, { txt: string; cls: string }> = {
  e: { txt: "쉬움", cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" },
  m: { txt: "보통", cls: "border-amber-400/40 bg-amber-400/10 text-amber-200" },
  h: { txt: "어려움", cls: "border-rose-400/40 bg-rose-400/10 text-rose-200" },
};

const QUIZ: QuizQ[] = [
  {
    num: 1,
    diff: "e",
    q: (
      <>
        다음 식의 값을 구하시오. <br />
        <span className="font-serif italic text-amber-200">ω⁷</span>
      </>
    ),
    choices: [
      { label: "1", val: "one" },
      { label: <W />, val: "w" },
      { label: <W2 />, val: "w2" },
      { label: "−1", val: "-1" },
    ],
    correct: "w",
    exp: (
      <>
        7 = 3 × 2 + 1 → 나머지 <b>1</b> → ω⁷ = ω¹ = <b className="text-amber-200">ω</b>
      </>
    ),
  },
  {
    num: 2,
    diff: "e",
    q: (
      <>
        다음 식의 값을 구하시오. <br />
        <span className="font-serif italic text-amber-200">ω¹⁰⁰</span>
      </>
    ),
    choices: [
      { label: "1", val: "one" },
      { label: <W />, val: "w" },
      { label: <W2 />, val: "w2" },
      { label: "−1", val: "-1" },
    ],
    correct: "w",
    exp: (
      <>
        100 = 3 × 33 + 1 → 나머지 <b>1</b> → ω¹⁰⁰ = <b className="text-amber-200">ω</b>
      </>
    ),
  },
  {
    num: 3,
    diff: "e",
    q: (
      <>
        다음 식의 값을 구하시오.{" "}
        <span className="text-xs text-teal-300">(힌트: ω · ? = 1)</span>
        <br />
        <span className="font-serif italic text-amber-200">ω⁻¹</span>
      </>
    ),
    choices: [
      { label: "1", val: "one" },
      { label: <W />, val: "w" },
      { label: <W2 />, val: "w2" },
      { label: "−ω", val: "-w" },
    ],
    correct: "w2",
    exp: (
      <>
        ω · ω² = ω³ = 1 → 1/ω = ω² → ω⁻¹ ={" "}
        <b className="text-amber-200">ω²</b>
      </>
    ),
  },
  {
    num: 4,
    diff: "m",
    q: (
      <>
        다음 식의 값을 구하시오. <br />
        <span className="font-serif italic text-amber-200">(1 + ω)(1 + ω²)</span>
      </>
    ),
    choices: [
      { label: "0", val: "0" },
      { label: "1", val: "1" },
      { label: "−1", val: "-1" },
      { label: "2", val: "2" },
    ],
    correct: "1",
    exp: (
      <>
        전개하면 1 + ω² + ω + ω³ = (1 + ω + ω²) + ω³ = <b>0</b> + <b>1</b> ={" "}
        <b className="text-amber-200">1</b>
      </>
    ),
  },
  {
    num: 5,
    diff: "m",
    q: (
      <>
        다음 식의 값을 구하시오.{" "}
        <span className="text-xs text-teal-300">
          (힌트: 1 + ω = ?)
        </span>
        <br />
        <span className="font-serif italic text-amber-200">
          <sup>1</sup>⁄<sub>1 + ω</sub> + <sup>1</sup>⁄<sub>1 + ω²</sub>
        </span>
      </>
    ),
    choices: [
      { label: "0", val: "0" },
      { label: "1", val: "1" },
      { label: "−1", val: "-1" },
      { label: "2", val: "2" },
    ],
    correct: "1",
    exp: (
      <>
        ω² + ω + 1 = 0 → 1 + ω = −ω² , 1 + ω² = −ω
        <br />= 1/(−ω²) + 1/(−ω) = −ω − ω² (∵ 1/ω² = ω, 1/ω = ω²)
        <br />= −(ω + ω²) = −(−1) = <b className="text-amber-200">1</b>
      </>
    ),
  },
  {
    num: 6,
    diff: "m",
    q: (
      <>
        다음 식의 값을 구하시오. <br />
        <span className="font-serif italic text-amber-200">ω¹⁰⁰ + ω⁵⁰ + 1</span>
      </>
    ),
    choices: [
      { label: "0", val: "0" },
      { label: "1", val: "1" },
      { label: "−1", val: "-1" },
      { label: "3", val: "3" },
    ],
    correct: "0",
    exp: (
      <>
        100 = 3 × 33 + 1 → ω¹⁰⁰ = ω
        <br />
        50 = 3 × 16 + 2 → ω⁵⁰ = ω²
        <br />→ ω + ω² + 1 = <b className="text-amber-200">0</b>
      </>
    ),
  },
  {
    num: 7,
    diff: "h",
    q: (
      <>
        다음 식의 값을 구하시오. (항이 51 개)
        <br />
        <span className="font-serif italic text-amber-200">
          ω⁵⁰ + ω⁴⁹ + ⋯ + ω + 1
        </span>
      </>
    ),
    choices: [
      { label: "0", val: "0" },
      { label: "1", val: "1" },
      { label: "−1", val: "-1" },
      { label: "51", val: "51" },
    ],
    correct: "0",
    exp: (
      <>
        51 개 = 3 × 17 묶음 → 17 × (1 + ω + ω²) = 17 × 0 ={" "}
        <b className="text-amber-200">0</b>
      </>
    ),
  },
  {
    num: 8,
    diff: "h",
    q: (
      <>
        다음 식의 값을 구하시오. <br />
        <span className="font-serif italic text-amber-200">
          ω²⁰²⁴ + ω²⁰²³ + ω²⁰²²
        </span>
      </>
    ),
    choices: [
      { label: "0", val: "0" },
      { label: "1", val: "1" },
      { label: "−1", val: "-1" },
      { label: "3", val: "3" },
    ],
    correct: "0",
    exp: (
      <>
        2024 = 3 × 674 + 2 → ω²⁰²⁴ = ω²
        <br />
        2023 = 3 × 674 + 1 → ω²⁰²³ = ω
        <br />
        2022 = 3 × 674 + 0 → ω²⁰²² = 1<br />→ ω² + ω + 1 ={" "}
        <b className="text-amber-200">0</b>
      </>
    ),
  },
];

function Tab4Quiz() {
  const [picked, setPicked] = useState<Record<number, string>>({});
  const okCount = Object.entries(picked).filter(
    ([k, v]) => v === QUIZ[Number(k) - 1].correct,
  ).length;
  const ngCount = Object.keys(picked).length - okCount;
  const leftCount = QUIZ.length - Object.keys(picked).length;

  function pick(n: number, val: string) {
    if (picked[n] !== undefined) return;
    setPicked((prev) => ({ ...prev, [n]: val }));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/10 via-cyan-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-violet-100">🎯 활용 문제 8 선</p>
      </div>

      {/* 점수 바 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] p-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
            정답
          </p>
          <p className="font-mono text-2xl font-extrabold text-emerald-200">{okCount}</p>
        </div>
        <div className="rounded-xl border border-rose-400/40 bg-rose-400/[0.08] p-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-rose-300">
            오답
          </p>
          <p className="font-mono text-2xl font-extrabold text-rose-200">{ngCount}</p>
        </div>
        <div className="rounded-xl border border-slate-400/40 bg-white/[0.04] p-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            남은 문제
          </p>
          <p className="font-mono text-2xl font-extrabold text-slate-200">{leftCount}</p>
        </div>
      </div>

      {QUIZ.map((q) => {
        const sel = picked[q.num];
        const decided = sel !== undefined;
        const correct = sel === q.correct;
        return (
          <div
            key={q.num}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-sm font-extrabold text-white">
                {q.num}
              </div>
              <span
                className={
                  "rounded-full border px-2 py-0.5 text-[10px] font-bold " +
                  DIFF_LABEL[q.diff].cls
                }
              >
                {DIFF_LABEL[q.diff].txt}
              </span>
            </div>
            <div className="text-sm leading-7 text-slate-200">{q.q}</div>

            <div className="mt-3 flex flex-wrap gap-2">
              {q.choices.map((c) => {
                let cls =
                  "border-white/15 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10";
                if (decided) {
                  if (c.val === q.correct) {
                    cls = "border-emerald-400/55 bg-emerald-400/15 text-emerald-100";
                  } else if (c.val === sel) {
                    cls = "border-rose-400/55 bg-rose-400/15 text-rose-100";
                  } else {
                    cls = "border-white/10 bg-white/[0.03] text-slate-500";
                  }
                }
                return (
                  <button
                    key={c.val}
                    type="button"
                    onClick={() => pick(q.num, c.val)}
                    disabled={decided}
                    className={
                      "min-w-[3rem] rounded-lg border-2 px-3 py-1.5 text-sm font-bold transition disabled:cursor-default " +
                      cls
                    }
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {decided ? (
              <div
                className={
                  "mt-3 rounded-lg px-3 py-2 text-xs leading-7 " +
                  (correct
                    ? "bg-emerald-400/10 text-emerald-100"
                    : "bg-rose-400/10 text-rose-100")
                }
              >
                <p className="font-bold">{correct ? "✅ 정답!" : "❌ 오답."}</p>
                <p className="mt-1">{q.exp}</p>
              </div>
            ) : null}
          </div>
        );
      })}

      {leftCount === 0 ? (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-300/[0.08] p-5 text-center">
          <p className="text-3xl">
            {okCount === QUIZ.length ? "🏆" : okCount >= 6 ? "⭐" : "📖"}
          </p>
          <p className="mt-1 font-bold text-amber-100">
            8 문제 완료 — 정답 {okCount} / {QUIZ.length}
          </p>
          <p className="mt-2 text-sm leading-7 text-amber-100/85">
            {okCount === QUIZ.length
              ? "완벽 정복! ω 법칙 마스터 🌀"
              : okCount >= 6
              ? "잘했어요! 어려운 문제도 거의 다 풀었네요."
              : "성질을 다시 한번 정리하고 도전해 보세요. ω² + ω + 1 = 0 이 핵심입니다."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
