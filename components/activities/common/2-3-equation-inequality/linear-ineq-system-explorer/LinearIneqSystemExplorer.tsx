"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "solve_order",
    prompt:
      "연립일차부등식을 풀 때 어떤 순서로 접근했나요? 수직선을 활용한 풀이 과정을 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: ① 각 부등식을 따로 풀어 x 의 범위를 구한다. ② 두 해를 한 수직선 위에 함께 그린다. ③ 겹치는 구간(공통부분) 을 찾는다. 공통부분이 없으면 ‘해 없음’, 한 점에서만 만나면 ‘x = c’ 로 표현.",
  },
  {
    id: "sign_flip",
    prompt:
      "일차부등식을 풀 때 양변을 음수로 나누거나 곱하면 부등호 방향이 바뀝니다. 그 이유를 자신의 말로 설명하고, 실수하기 쉬운 상황을 한 가지 들어 보세요.",
    kind: "text",
    placeholder:
      "예: 음수를 곱하면 두 수의 크기 관계가 뒤집힌다 (예: 2 < 5 인데 −2 > −5). 그래서 양변에 음수를 곱·나누면 부등호 방향이 반드시 바뀐다. 실수하기 쉬운 경우: −3x ≥ −9 → 양변을 −3 으로 나눌 때 부등호 방향 안 바꾸고 그대로 x ≥ 3 이라고 쓰는 실수.",
  },
];

// ─── 부등식·구간 유틸 ─────────────────────────────────────
type Op = "lt" | "le" | "gt" | "ge";
type Interval = { lo: number | null; loI: boolean; hi: number | null; hiI: boolean };
type Result =
  | { type: "iv"; lo: number | null; loI: boolean; hi: number | null; hiI: boolean }
  | { type: "pt"; val: number }
  | null;

const OP_SYM: Record<Op, string> = {
  lt: "<",
  le: "≤",
  gt: ">",
  ge: "≥",
};

function toIv(op: Op, b: number): Interval {
  if (op === "lt") return { lo: null, loI: false, hi: b, hiI: false };
  if (op === "le") return { lo: null, loI: false, hi: b, hiI: true };
  if (op === "gt") return { lo: b, loI: false, hi: null, hiI: false };
  return { lo: b, loI: true, hi: null, hiI: false };
}

function intersect(op1: Op, b1: number, op2: Op, b2: number): Result {
  const a = toIv(op1, b1);
  const c = toIv(op2, b2);

  let lo: number | null;
  let loI: boolean;
  let hi: number | null;
  let hiI: boolean;

  if (a.lo === null && c.lo === null) {
    lo = null;
    loI = false;
  } else if (a.lo === null) {
    lo = c.lo;
    loI = c.loI;
  } else if (c.lo === null) {
    lo = a.lo;
    loI = a.loI;
  } else if (a.lo > c.lo) {
    lo = a.lo;
    loI = a.loI;
  } else if (c.lo > a.lo) {
    lo = c.lo;
    loI = c.loI;
  } else {
    lo = a.lo;
    loI = a.loI && c.loI;
  }

  if (a.hi === null && c.hi === null) {
    hi = null;
    hiI = false;
  } else if (a.hi === null) {
    hi = c.hi;
    hiI = c.hiI;
  } else if (c.hi === null) {
    hi = a.hi;
    hiI = a.hiI;
  } else if (a.hi < c.hi) {
    hi = a.hi;
    hiI = a.hiI;
  } else if (c.hi < a.hi) {
    hi = c.hi;
    hiI = c.hiI;
  } else {
    hi = a.hi;
    hiI = a.hiI && c.hiI;
  }

  if (lo !== null && hi !== null) {
    if (lo > hi) return null;
    if (lo === hi) return loI && hiI ? { type: "pt", val: lo } : null;
  }
  return { type: "iv", lo, loI, hi, hiI };
}

function fmtIv(r: Result): string {
  if (!r) return "해 없음";
  if (r.type === "pt") return `x = ${r.val}`;
  let s = "";
  if (r.lo !== null) s += r.loI ? `${r.lo} ≤ ` : `${r.lo} < `;
  s += "x";
  if (r.hi !== null) s += r.hiI ? ` ≤ ${r.hi}` : ` < ${r.hi}`;
  return s;
}

function fmtSingle(op: Op, b: number): string {
  return `x ${OP_SYM[op]} ${b}`;
}

// ─── 메인 ─────────────────────────────────────────────────
type TabId = 1 | 2 | 3;

export default function LinearIneqSystemExplorer() {
  const [tab, setTab] = useState<TabId>(1);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">📏 연립일차부등식 수직선 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          두 부등식의 해를 <b className="text-teal-200">한 수직선 위에</b> 함께 그리고,{" "}
          <b className="text-emerald-200">겹치는 부분 (공통부분)</b> 을 찾는 것이
          연립부등식 풀이의 핵심입니다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <TabBtn active={tab === 1} onClick={() => setTab(1)}>
          🔬 수직선 탐구
        </TabBtn>
        <TabBtn active={tab === 2} onClick={() => setTab(2)}>
          🎯 단계별 풀기
        </TabBtn>
        <TabBtn active={tab === 3} onClick={() => setTab(3)}>
          📋 경우 정리
        </TabBtn>
      </div>

      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <Tab1Sandbox />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <Tab2Problems />
      </div>
      <div className={tab === 3 ? "mt-5" : "mt-5 hidden"}>
        <Tab3Cases />
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
        "rounded-xl px-2 py-2.5 text-xs font-bold transition sm:text-sm " +
        (active
          ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/20"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-teal-200")
      }
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  공용 — 수직선 SVG (Tab 1 = 풀버전, Tab 3 = 미니)
// ═══════════════════════════════════════════════════════════

type NumberLineProps = {
  op1: Op;
  b1: number;
  op2: Op;
  b2: number;
  xMin: number;
  xMax: number;
  height?: number;
  full?: boolean; // 축 눈금·행 레이블 표시
};

function NumberLine({
  op1,
  b1,
  op2,
  b2,
  xMin,
  xMax,
  height = 170,
  full = true,
}: NumberLineProps) {
  const W = 600;
  const H = height;
  const tx = (v: number) => ((v - xMin) / (xMax - xMin)) * W;

  const iv1 = toIv(op1, b1);
  const iv2 = toIv(op2, b2);
  const res = intersect(op1, b1, op2, b2);

  // 3 행 위치
  const rows = full ? [H * 0.2, H * 0.5, H * 0.8] : [H * 0.25, H * 0.55, H * 0.85];

  const ticks: number[] = [];
  for (let i = xMin + 1; i < xMax; i++) ticks.push(i);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      role="img"
      aria-label="연립일차부등식 수직선"
    >
      {/* 1축 (부등식 ①) */}
      <AxisLine y={rows[0]} W={W} color="rgba(94,234,212,0.35)" />
      {full ? (
        <>
          {ticks.map((i) => (
            <g key={`t1-${i}`}>
              <line
                x1={tx(i)}
                x2={tx(i)}
                y1={rows[0] - 3}
                y2={rows[0] + 3}
                stroke="rgba(94,234,212,0.35)"
                strokeWidth="1"
              />
              {i % 2 === 0 ? (
                <text
                  x={tx(i)}
                  y={rows[0] + 14}
                  fontSize="10"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.28)"
                >
                  {i}
                </text>
              ) : null}
            </g>
          ))}
          <text
            x={4}
            y={rows[0] - 12}
            fontSize="10"
            fontWeight="bold"
            fill="#5eead4"
          >
            ① {fmtSingle(op1, b1)}
          </text>
        </>
      ) : null}
      <Bar iv={iv1} y={rows[0]} tx={tx} W={W} color="#5eead4" thick={7} showDot={true} />

      {/* 2축 (부등식 ②) */}
      <AxisLine y={rows[1]} W={W} color="rgba(251,146,60,0.35)" />
      {full ? (
        <>
          {ticks.map((i) => (
            <g key={`t2-${i}`}>
              <line
                x1={tx(i)}
                x2={tx(i)}
                y1={rows[1] - 3}
                y2={rows[1] + 3}
                stroke="rgba(251,146,60,0.35)"
                strokeWidth="1"
              />
              {i % 2 === 0 ? (
                <text
                  x={tx(i)}
                  y={rows[1] + 14}
                  fontSize="10"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.28)"
                >
                  {i}
                </text>
              ) : null}
            </g>
          ))}
          <text
            x={4}
            y={rows[1] - 12}
            fontSize="10"
            fontWeight="bold"
            fill="#fb923c"
          >
            ② {fmtSingle(op2, b2)}
          </text>
        </>
      ) : null}
      <Bar iv={iv2} y={rows[1]} tx={tx} W={W} color="#fb923c" thick={7} showDot={true} />

      {/* 3축 (공통부분) */}
      <AxisLine y={rows[2]} W={W} color="rgba(52,211,153,0.25)" />
      {full ? (
        <text
          x={4}
          y={rows[2] - 12}
          fontSize="10"
          fontWeight="bold"
          fill="#34d399"
        >
          공통부분
        </text>
      ) : null}
      {res === null ? (
        <text
          x={W / 2}
          y={rows[2] + 5}
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          fill="#fca5a5"
        >
          없음
        </text>
      ) : res.type === "pt" ? (
        <g>
          <circle cx={tx(res.val)} cy={rows[2]} r={6} fill="#fbbf24" />
          <circle cx={tx(res.val)} cy={rows[2]} r={6} fill="none" stroke="#fff" strokeWidth="2" />
          <text
            x={tx(res.val)}
            y={rows[2] - 11}
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            fill="#fbbf24"
          >
            x = {res.val}
          </text>
        </g>
      ) : (
        <Bar
          iv={{ lo: res.lo, loI: res.loI, hi: res.hi, hiI: res.hiI }}
          y={rows[2]}
          tx={tx}
          W={W}
          color="#34d399"
          thick={9}
          showDot={true}
        />
      )}
    </svg>
  );
}

function AxisLine({ y, W, color }: { y: number; W: number; color: string }) {
  return (
    <>
      <line x1={0} x2={W} y1={y} y2={y} stroke={color} strokeWidth="1.2" />
      <polygon
        points={`${W - 2},${y} ${W - 10},${y - 4} ${W - 10},${y + 4}`}
        fill={color}
      />
    </>
  );
}

function Bar({
  iv,
  y,
  tx,
  W,
  color,
  thick,
  showDot,
}: {
  iv: Interval;
  y: number;
  tx: (v: number) => number;
  W: number;
  color: string;
  thick: number;
  showDot: boolean;
}) {
  const x1 = iv.lo === null ? 0 : tx(iv.lo);
  const x2 = iv.hi === null ? W : tx(iv.hi);
  return (
    <g>
      <rect
        x={x1}
        y={y - thick / 2}
        width={Math.max(0, x2 - x1)}
        height={thick}
        fill={color}
        opacity="0.5"
      />
      {iv.lo !== null ? (
        <EndDot
          x={tx(iv.lo)}
          y={y}
          color={color}
          filled={iv.loI}
          label={showDot ? iv.lo : null}
        />
      ) : null}
      {iv.hi !== null ? (
        <EndDot
          x={tx(iv.hi)}
          y={y}
          color={color}
          filled={iv.hiI}
          label={showDot ? iv.hi : null}
        />
      ) : null}
    </g>
  );
}

function EndDot({
  x,
  y,
  color,
  filled,
  label,
}: {
  x: number;
  y: number;
  color: string;
  filled: boolean;
  label: number | null;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={5} fill={filled ? color : "#071515"} stroke={color} strokeWidth="2" />
      {label !== null ? (
        <text
          x={x}
          y={y - 9}
          fontSize="10"
          fontWeight="bold"
          textAnchor="middle"
          fill={color}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 수직선 탐구 (슬라이더 sandbox)
// ═══════════════════════════════════════════════════════════

function Tab1Sandbox() {
  const [op1, setOp1] = useState<Op>("le");
  const [b1, setB1] = useState(3);
  const [op2, setOp2] = useState<Op>("ge");
  const [b2, setB2] = useState(1);

  const res = useMemo(() => intersect(op1, b1, op2, b2), [op1, b1, op2, b2]);

  const badgeCls =
    res === null
      ? "border-rose-400/40 bg-rose-400/10 text-rose-100"
      : res.type === "pt"
      ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
      : "border-emerald-400/40 bg-emerald-400/10 text-emerald-100";
  const badgeResult = res === null ? "공통부분 없음 (해 없음)" : fmtIv(res);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal-400/30 bg-gradient-to-br from-teal-500/10 via-emerald-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-teal-100">
          🔬 슬라이더로 공통부분을 직접 확인해 보자!
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          경계값과 부등호 방향을 바꿔보면서 두 해가 어떻게 겹치는지 관찰하세요.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        {/* 부등식 1 */}
        <IneqControl
          label="① 부등식 1"
          labelColor="text-teal-300"
          note="청록색"
          op={op1}
          onOp={setOp1}
          b={b1}
          onB={setB1}
          idPrefix="b1"
        />
        {/* 부등식 2 */}
        <IneqControl
          label="② 부등식 2"
          labelColor="text-orange-300"
          note="주황색"
          op={op2}
          onOp={setOp2}
          b={b2}
          onB={setB2}
          idPrefix="b2"
        />

        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-3">
          <NumberLine op1={op1} b1={b1} op2={op2} b2={b2} xMin={-9} xMax={9} height={170} />
        </div>

        <div
          className={
            "mt-3 rounded-xl border px-3 py-2.5 text-center text-sm leading-7 " + badgeCls
          }
        >
          <b>①</b> {fmtSingle(op1, b1)} &nbsp;∩&nbsp; <b>②</b> {fmtSingle(op2, b2)}{" "}
          &nbsp;→&nbsp; <b className="font-serif">{badgeResult}</b>
        </div>
      </div>

      {/* 핵심 정리 */}
      <div className="rounded-2xl border border-teal-400/30 bg-white/[0.04] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-teal-300">
          📌 연립부등식 풀이 3 단계
        </p>
        <ol className="mt-2 space-y-1 text-sm leading-7 text-teal-100">
          <li>
            <b className="text-amber-300">①</b> 각 부등식의 해를 따로 구한다.
          </li>
          <li>
            <b className="text-amber-300">②</b> 두 해를{" "}
            <b className="text-amber-200">한 수직선 위에</b> 함께 나타낸다.
          </li>
          <li>
            <b className="text-amber-300">③</b> 두 해의{" "}
            <b className="text-emerald-200">공통부분</b> 을 구한다.
          </li>
        </ol>

        <div className="mt-3 space-y-2 text-xs leading-7">
          <ResultRow
            label="공통부분 있음"
            cls="border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
            desc="겹치는 구간이 연립부등식의 해"
          />
          <ResultRow
            label="공통부분 없음"
            cls="border-rose-400/40 bg-rose-400/10 text-rose-200"
            desc="연립부등식의 해는 존재하지 않음"
          />
          <ResultRow
            label="공통값 1 개"
            cls="border-amber-400/40 bg-amber-400/10 text-amber-200"
            desc="등호로 표현 (예: x = 2)"
          />
        </div>
      </div>
    </div>
  );
}

function IneqControl({
  label,
  labelColor,
  note,
  op,
  onOp,
  b,
  onB,
  idPrefix,
}: {
  label: string;
  labelColor: string;
  note: string;
  op: Op;
  onOp: (op: Op) => void;
  b: number;
  onB: (b: number) => void;
  idPrefix: string;
}) {
  return (
    <div className="mb-4">
      <p className={"text-sm font-bold " + labelColor}>
        {label} <span className="text-xs font-normal text-slate-500">({note})</span>
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="font-serif text-lg italic text-amber-200">x</span>
        <select
          value={op}
          onChange={(e) => onOp(e.target.value as Op)}
          aria-label={`${label} 부등호`}
          className="rounded-md border border-white/15 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none [color-scheme:dark] focus:ring-2 focus:ring-cyan-300/40"
        >
          {/* native <option> 색은 OS 기본을 따르는 경우가 있어 인라인 style 로 명시 */}
          <option value="lt" style={{ backgroundColor: "#0f172a", color: "#f1f5f9" }}>
            &lt;
          </option>
          <option value="le" style={{ backgroundColor: "#0f172a", color: "#f1f5f9" }}>
            ≤
          </option>
          <option value="gt" style={{ backgroundColor: "#0f172a", color: "#f1f5f9" }}>
            &gt;
          </option>
          <option value="ge" style={{ backgroundColor: "#0f172a", color: "#f1f5f9" }}>
            ≥
          </option>
        </select>
        <span className="min-w-[24px] text-center font-bold text-amber-300">{b}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400">경계값</span>
        <input
          type="range"
          id={idPrefix}
          min={-8}
          max={8}
          step={1}
          value={b}
          onChange={(e) => onB(parseInt(e.target.value, 10))}
          aria-label={`${label} 경계값`}
          className="flex-1 accent-teal-400"
        />
        <span className="w-6 text-center font-mono text-sm text-slate-300">{b}</span>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  cls,
  desc,
}: {
  label: string;
  cls: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          "flex-shrink-0 rounded-md border px-2 py-0.5 text-xs font-bold " + cls
        }
      >
        {label}
      </span>
      <span className="text-slate-400">→ {desc}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 단계별 풀기 (4 문제)
// ═══════════════════════════════════════════════════════════

type StepChoice = { v: string; label: ReactNode };
type StepDef = {
  title: string;
  desc: ReactNode;
  choices: StepChoice[];
  correct: string;
  hints: Record<string, ReactNode>;
};
type ProbDef = {
  num: number;
  question: ReactNode;
  eqs: ReactNode[];
  steps: StepDef[];
  done: ReactNode;
};

const W_ = <em className="font-serif italic text-amber-200">x</em>;

const PROBLEMS: ProbDef[] = [
  {
    num: 1,
    question: <>📝 연습 문제 1 — 연립부등식을 푸시오.</>,
    eqs: [
      <>{W_} − 5 &lt; −2{W_} + 4 &nbsp; …… ①</>,
      <>3{W_} + 3 ≥ 4{W_} + 2 &nbsp; …… ②</>,
    ],
    steps: [
      {
        title: "STEP 1 — 부등식 ① 풀기",
        desc: (
          <>
            <em className="text-amber-200">x − 5 &lt; −2x + 4</em>
            <br />x 를 좌변으로, 수를 우변으로 이항하면?
          </>
        ),
        choices: [
          { v: "A", label: <>x &lt; 9</> },
          { v: "B", label: <>x &lt; 3</> },
          { v: "C", label: <>x &gt; 3</> },
        ],
        correct: "B",
        hints: {
          A: "✗ x 항: x + 2x = 3x → 3x < 9 → x < 3 이에요.",
          B: "✓ 정답! x − 5 < −2x + 4 → 3x < 9 → x < 3",
          C: "✗ 이항 후 계수가 양수이면 부등호 방향은 그대로예요.",
        },
      },
      {
        title: "STEP 2 — 부등식 ② 풀기",
        desc: (
          <>
            <em className="text-amber-200">3x + 3 ≥ 4x + 2</em>
            <br />x 를 좌변으로, 수를 우변으로 이항하면?
          </>
        ),
        choices: [
          { v: "A", label: <>x ≤ −1</> },
          { v: "B", label: <>x ≥ 1</> },
          { v: "C", label: <>x ≤ 1</> },
        ],
        correct: "C",
        hints: {
          A: "✗ 3x − 4x = −x, 수 이항: 3 − 2 = 1 → −x ≥ −1 → x ≤ 1 이에요.",
          B: "✗ 3x − 4x = −x 이므로 −x ≥ −1 → x ≤ 1 이에요.",
          C: "✓ 정답! 3x + 3 ≥ 4x + 2 → −x ≥ −1 → x ≤ 1",
        },
      },
      {
        title: "STEP 3 — 공통부분 찾기",
        desc: <>① x &lt; 3 &nbsp;② x ≤ 1 — 수직선에서 겹치는 부분은?</>,
        choices: [
          { v: "A", label: <>x &lt; 3</> },
          { v: "B", label: <>x ≤ 1</> },
          { v: "C", label: <>1 ≤ x &lt; 3</> },
        ],
        correct: "B",
        hints: {
          A: "✗ x < 3 이고 x ≤ 1 의 교집합에서 1 이 3 보다 작으므로 더 좁은 쪽을 취해요.",
          B: "✓ 정답! x < 3 이고 x ≤ 1 의 공통 → x ≤ 1",
          C: "✗ 1 ≤ x < 3 은 ② 의 해 x ≤ 1 에 포함되지 않아요.",
        },
      },
    ],
    done: (
      <>
        ① x &lt; 3 &nbsp;② x ≤ 1 → 공통부분: <b className="text-emerald-300">x ≤ 1</b>
      </>
    ),
  },
  {
    num: 2,
    question: <>📝 연습 문제 2 — 연립부등식을 푸시오.</>,
    eqs: [
      <>2({W_} + 1) &gt; {W_} − 4 &nbsp; …… ①</>,
      <>3 − {W_} ≥ 3{W_} − 5 &nbsp; …… ②</>,
    ],
    steps: [
      {
        title: "STEP 1 — 부등식 ① 풀기",
        desc: (
          <>
            <em className="text-amber-200">2(x + 1) &gt; x − 4</em>
            <br />
            괄호를 풀면 2x + 2 &gt; x − 4. 이항하면?
          </>
        ),
        choices: [
          { v: "A", label: <>x &gt; −6</> },
          { v: "B", label: <>x &lt; −6</> },
          { v: "C", label: <>x &gt; 6</> },
        ],
        correct: "A",
        hints: {
          A: "✓ 정답! 2x + 2 > x − 4 → x > −6",
          B: "✗ 이항 후 x > ? → x > −6 이에요. 부등호 방향 확인!",
          C: "✗ 2x + 2 > x − 4 → x > −4 − 2 = −6 이에요.",
        },
      },
      {
        title: "STEP 2 — 부등식 ② 풀기",
        desc: (
          <>
            <em className="text-amber-200">3 − x ≥ 3x − 5</em>
            <br />x 를 한쪽으로 모으면? (음수 계수 주의!)
          </>
        ),
        choices: [
          { v: "A", label: <>x ≥ 2</> },
          { v: "B", label: <>x ≤ 8</> },
          { v: "C", label: <>x ≤ 2</> },
        ],
        correct: "C",
        hints: {
          A: "✗ 3 − x ≥ 3x − 5 → −4x ≥ −8 → x ≤ 2 예요. ≥ 가 아니에요.",
          B: "✗ 이항하면 −4x ≥ −8 → 양변을 −4 로 나누면 부등호 방향 바뀜 → x ≤ 2 예요.",
          C: "✓ 정답! 3 − x ≥ 3x − 5 → −4x ≥ −8 → x ≤ 2",
        },
      },
      {
        title: "STEP 3 — 공통부분 찾기",
        desc: <>① x &gt; −6 &nbsp;② x ≤ 2 — 겹치는 부분은?</>,
        choices: [
          { v: "A", label: <>x &gt; −6</> },
          { v: "B", label: <>−6 &lt; x ≤ 2</> },
          { v: "C", label: <>x ≤ 2</> },
        ],
        correct: "B",
        hints: {
          A: "✗ x > −6 만 있으면 ② 조건이 빠져요. 두 조건을 모두 만족해야 해요.",
          B: "✓ 정답! x > −6 이고 x ≤ 2 의 공통 → −6 < x ≤ 2",
          C: "✗ x ≤ 2 만 있으면 x > −6 조건이 빠져요.",
        },
      },
    ],
    done: (
      <>
        ① x &gt; −6 &nbsp;② x ≤ 2 → 공통부분:{" "}
        <b className="text-emerald-300">−6 &lt; x ≤ 2</b>
      </>
    ),
  },
  {
    num: 3,
    question: <>📝 연습 문제 3 — 연립부등식을 푸시오.</>,
    eqs: [
      <>2{W_} − 3 &lt; −1 &nbsp; …… ①</>,
      <>{W_} + 2 ≥ −{W_} + 6 &nbsp; …… ②</>,
    ],
    steps: [
      {
        title: "STEP 1 — 부등식 ① 풀기",
        desc: (
          <>
            <em className="text-amber-200">2x − 3 &lt; −1</em>
            <br />
            이항하면 2x &lt; ? → x &lt; ?
          </>
        ),
        choices: [
          { v: "A", label: <>x &lt; −2</> },
          { v: "B", label: <>x &lt; 1</> },
          { v: "C", label: <>x &lt; 2</> },
        ],
        correct: "B",
        hints: {
          A: "✗ 2x < −1 + 3 = 2 → x < 1 이에요.",
          B: "✓ 정답! 2x − 3 < −1 → 2x < 2 → x < 1",
          C: "✗ 2x < 2 에서 2 로 나누면 x < 1 이에요.",
        },
      },
      {
        title: "STEP 2 — 부등식 ② 풀기",
        desc: (
          <>
            <em className="text-amber-200">x + 2 ≥ −x + 6</em>
            <br />x 를 한쪽으로 모으면?
          </>
        ),
        choices: [
          { v: "A", label: <>x ≥ 4</> },
          { v: "B", label: <>x ≤ 2</> },
          { v: "C", label: <>x ≥ 2</> },
        ],
        correct: "C",
        hints: {
          A: "✗ x + x ≥ 6 − 2 = 4 → 2x ≥ 4 → x ≥ 2 이에요.",
          B: "✗ 이항하면 2x ≥ 4 → x ≥ 2 예요.",
          C: "✓ 정답! x + 2 ≥ −x + 6 → 2x ≥ 4 → x ≥ 2",
        },
      },
      {
        title: "STEP 3 — 공통부분 찾기",
        desc: <>① x &lt; 1 &nbsp;② x ≥ 2 — 수직선에서 겹치는 부분은?</>,
        choices: [
          { v: "A", label: <>1 ≤ x &lt; 2</> },
          { v: "B", label: <>해 없음</> },
          { v: "C", label: <>x &lt; 1</> },
        ],
        correct: "B",
        hints: {
          A: "✗ x < 1 이고 x ≥ 2 를 동시에 만족하는 x 가 있나요? 수직선을 그려보세요!",
          B: "✓ 정답! x < 1 과 x ≥ 2 는 수직선에서 겹치지 않아요 → 해 없음!",
          C: "✗ x < 1 만 고려하면 ② 조건이 빠져요.",
        },
      },
    ],
    done: (
      <>
        ① x &lt; 1 &nbsp;② x ≥ 2 → 공통부분 없음 →{" "}
        <b className="text-rose-300">해가 없습니다</b>
      </>
    ),
  },
  {
    num: 4,
    question: <>📝 연습 문제 4 — 연립부등식을 푸시오.</>,
    eqs: [
      <>4 − {W_} ≥ 2{W_} − 5 &nbsp; …… ①</>,
      <>5{W_} − 5 ≥ 3{W_} + 1 &nbsp; …… ②</>,
    ],
    steps: [
      {
        title: "STEP 1 — 부등식 ① 풀기",
        desc: (
          <>
            <em className="text-amber-200">4 − x ≥ 2x − 5</em>
            <br />
            이항 후 −3x ≥ −9, 양변을 −3 으로 나누면? (부등호 방향 주의!)
          </>
        ),
        choices: [
          { v: "A", label: <>x ≥ 3</> },
          { v: "B", label: <>x ≤ −3</> },
          { v: "C", label: <>x ≤ 3</> },
        ],
        correct: "C",
        hints: {
          A: "✗ −3x ≥ −9 를 −3 으로 나누면 부등호 방향이 바뀌어요 → x ≤ 3 이에요.",
          B: "✗ −3x ≥ −9 에서 양변을 −3 으로 나누면 x ≤ 3 이에요.",
          C: "✓ 정답! 4 − x ≥ 2x − 5 → −3x ≥ −9 → x ≤ 3",
        },
      },
      {
        title: "STEP 2 — 부등식 ② 풀기",
        desc: (
          <>
            <em className="text-amber-200">5x − 5 ≥ 3x + 1</em>
            <br />
            이항 후 2x ≥ 6, x ≥ ?
          </>
        ),
        choices: [
          { v: "A", label: <>x ≥ 3</> },
          { v: "B", label: <>x ≥ −2</> },
          { v: "C", label: <>x ≤ 3</> },
        ],
        correct: "A",
        hints: {
          A: "✓ 정답! 5x − 3x ≥ 1 + 5 → 2x ≥ 6 → x ≥ 3",
          B: "✗ 5x − 5 ≥ 3x + 1 → 2x ≥ 6 → x ≥ 3 이에요.",
          C: "✗ x 항 계수가 양수이므로 부등호 방향은 그대로예요.",
        },
      },
      {
        title: "STEP 3 — 공통부분 찾기",
        desc: <>① x ≤ 3 &nbsp;② x ≥ 3 — 수직선에서 겹치는 부분은?</>,
        choices: [
          { v: "A", label: <>x = 3</> },
          { v: "B", label: <>해 없음</> },
          { v: "C", label: <>모든 실수</> },
        ],
        correct: "A",
        hints: {
          A: "✓ 정답! x ≤ 3 이고 x ≥ 3 의 공통 → x = 3 (딱 한 점!)",
          B: "✗ 두 범위가 경계값 3 에서 만나요. 해가 없는 게 아니에요.",
          C: "✗ x ≤ 3 이면서 x ≥ 3 인 범위는 딱 x = 3 뿐이에요.",
        },
      },
    ],
    done: (
      <>
        ① x ≤ 3 &nbsp;② x ≥ 3 → 딱 1 점에서 만남 →{" "}
        <b className="text-amber-200">x = 3</b>
      </>
    ),
  },
];

function Tab2Problems() {
  const [probIdx, setProbIdx] = useState(0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-emerald-100">
          🎯 단계별 풀기 — 4 문제
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          각 STEP 의 선택지를 클릭해서 정답을 맞히고 풀이 흐름을 익혀 보세요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROBLEMS.map((p, i) => (
          <button
            key={p.num}
            type="button"
            onClick={() => setProbIdx(i)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-bold transition " +
              (probIdx === i
                ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
                : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            문제 {p.num}
          </button>
        ))}
      </div>

      <ProblemCard
        key={probIdx}
        problem={PROBLEMS[probIdx]}
        onNext={
          probIdx + 1 < PROBLEMS.length ? () => setProbIdx(probIdx + 1) : undefined
        }
      />
    </div>
  );
}

function ProblemCard({
  problem,
  onNext,
}: {
  problem: ProbDef;
  onNext?: () => void;
}) {
  const [picked, setPicked] = useState<Record<number, string>>({});

  function pick(stepIdx: number, v: string) {
    if (picked[stepIdx] !== undefined) return;
    setPicked((prev) => ({ ...prev, [stepIdx]: v }));
  }

  const allDone =
    problem.steps.every((_, i) => picked[i] !== undefined) &&
    problem.steps.every((s, i) => picked[i] === s.correct);

  return (
    <div className="space-y-3">
      {/* 문제 헤더 */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-bold text-teal-200">{problem.question}</p>
        <div className="mt-3 flex items-stretch gap-2 rounded-xl border border-amber-300/30 bg-amber-300/[0.06] px-4 py-3">
          <span
            aria-hidden
            className="self-center font-serif text-3xl leading-none text-amber-200"
          >
            {"{"}
          </span>
          <div className="flex flex-col justify-center gap-1 font-serif text-base text-amber-100">
            {problem.eqs.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        </div>
      </div>

      {/* STEPS */}
      {problem.steps.map((step, idx) => {
        const sel = picked[idx];
        const decided = sel !== undefined;
        const correct = sel === step.correct;
        return (
          <div
            key={idx}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <p className="text-sm font-bold text-cyan-200">{step.title}</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">{step.desc}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {step.choices.map((c) => {
                let cls =
                  "border-white/15 bg-white/5 text-slate-200 hover:border-teal-300/50 hover:bg-teal-400/10";
                if (decided) {
                  if (c.v === step.correct) {
                    cls = "border-emerald-400/55 bg-emerald-400/15 text-emerald-100";
                  } else if (c.v === sel) {
                    cls = "border-rose-400/55 bg-rose-400/15 text-rose-100";
                  } else {
                    cls = "border-white/10 bg-white/[0.03] text-slate-500";
                  }
                }
                return (
                  <button
                    key={c.v}
                    type="button"
                    onClick={() => pick(idx, c.v)}
                    disabled={decided}
                    className={
                      "rounded-lg border-2 px-3 py-1.5 font-serif text-sm font-bold transition disabled:cursor-default " +
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
                  "mt-3 rounded-lg px-3 py-2 text-xs leading-7 " +
                  (correct
                    ? "bg-emerald-400/10 text-emerald-100"
                    : "bg-rose-400/10 text-rose-100")
                }
              >
                {step.hints[sel] ??
                  (correct ? <>✓ 정답!</> : <>✗ 다시 시도!</>)}
              </p>
            ) : null}
          </div>
        );
      })}

      {allDone ? (
        <div className="rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent p-5 text-center">
          <p className="text-3xl">{problem.num === 4 ? "🏆" : "🎉"}</p>
          <p className="mt-1 text-base font-bold text-emerald-200">
            {problem.num === 4 ? "4 문제 전부 완료! 훌륭해요!" : "완료!"}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-300">{problem.done}</p>
          {onNext ? (
            <button
              type="button"
              onClick={onNext}
              className="mt-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-5 py-2 text-sm font-bold text-white"
            >
              다음 문제 →
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 3 — 경우 정리 (4 정상 + 2 특수)
// ═══════════════════════════════════════════════════════════

type CaseDef = {
  label: string;
  sys: ReactNode;
  op1: Op;
  b1: number;
  op2: Op;
  b2: number;
  toneCls: string;
};

const CASES: CaseDef[] = [
  {
    label: "경우 1",
    sys: (
      <>
        {"{"} x &gt; a, x &lt; b {"}"}
      </>
    ),
    op1: "gt",
    b1: 2,
    op2: "lt",
    b2: 5,
    toneCls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  },
  {
    label: "경우 2",
    sys: (
      <>
        {"{"} x ≥ a, x &lt; b {"}"}
      </>
    ),
    op1: "ge",
    b1: 2,
    op2: "lt",
    b2: 5,
    toneCls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  },
  {
    label: "경우 3",
    sys: (
      <>
        {"{"} x &gt; a, x ≤ b {"}"}
      </>
    ),
    op1: "gt",
    b1: 2,
    op2: "le",
    b2: 5,
    toneCls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  },
  {
    label: "경우 4",
    sys: (
      <>
        {"{"} x ≥ a, x ≤ b {"}"}
      </>
    ),
    op1: "ge",
    b1: 2,
    op2: "le",
    b2: 5,
    toneCls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  },
  {
    label: "특수 — 해 없음",
    sys: <>예: x &lt; 3, x ≥ 5</>,
    op1: "lt",
    b1: 3,
    op2: "ge",
    b2: 5,
    toneCls: "border-rose-400/40 bg-rose-400/10 text-rose-200",
  },
  {
    label: "특수 — 한 점",
    sys: <>예: x ≤ 3, x ≥ 3</>,
    op1: "le",
    b1: 3,
    op2: "ge",
    b2: 3,
    toneCls: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  },
];

function Tab3Cases() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-teal-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-cyan-100">
          📋 a &lt; b 일 때 — 4 가지 패턴 + 2 가지 특수
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          두 부등식 해의 방향과 경계에 따라 공통부분이 달라집니다.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CASES.map((c) => {
          const res = intersect(c.op1, c.b1, c.op2, c.b2);
          const resText = fmtIv(res);
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
            >
              <p className="text-xs font-extrabold text-cyan-300">{c.label}</p>
              <p className="mt-1 rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1 text-center font-serif text-sm italic text-slate-200">
                {c.sys}
              </p>
              <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/40 p-2">
                <NumberLine
                  op1={c.op1}
                  b1={c.b1}
                  op2={c.op2}
                  b2={c.b2}
                  xMin={0}
                  xMax={8}
                  height={80}
                  full={false}
                />
              </div>
              <p
                className={
                  "mt-2 rounded-md border px-2 py-1 text-center text-xs font-bold " +
                  c.toneCls
                }
              >
                {resText}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-amber-300/30 bg-amber-300/[0.07] p-4">
        <p className="text-sm font-extrabold text-amber-200">⚠️ 특수한 경우 꼭 기억!</p>
        <ul className="mt-2 space-y-2 text-sm leading-7 text-slate-200">
          <li>
            <b className="text-rose-300">해 없음</b> — 두 해가 수직선에서 전혀 겹치지 않을
            때 → 연립부등식의 <b>해는 존재하지 않습니다</b>.
          </li>
          <li>
            <b className="text-amber-200">한 점만</b> — 두 해가 딱 한 점에서만 만날 때 →
            해를 <b>등호로 표현</b> (예: x = 2).
          </li>
        </ul>
      </div>
    </div>
  );
}
