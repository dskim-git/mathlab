"use client";

import { useEffect, useId, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  ALL_REGIONS,
  CNT_MAX,
  ELEMS,
  FORMS,
  G,
  INFERS,
  MORGANS,
  REGION_NAME,
  SUB_TEX,
  compOf,
  elemAnswer,
  exprTex,
  flip,
  interOf,
  listTex,
  regionsOf,
  sameRegions,
  subsetOf,
  unionOf,
  valueOf,
  type CountForm,
  type ElemTask,
  type Infer,
  type MorganTask,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_swap",
    prompt:
      "드모르간의 법칙에서 여집합을 씌우면 ∪ 가 ∩ 으로, ∩ 이 ∪ 으로 바뀌어요. 왜 그렇게 되는지 벤 다이어그램의 조각으로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: (A ∪ B)ᶜ 는 A에도 B에도 들어 있지 않은 자리, 즉 Aᶜ 이면서 동시에 Bᶜ 인 자리이므로 '동시에'를 뜻하는 ∩ 이 된다. 반대로 (A ∩ B)ᶜ 는 두 곳에 함께 들어 있지는 않은 자리, 즉 Aᶜ 이거나 Bᶜ 인 자리이므로 '이거나'를 뜻하는 ∪ 이 된다.",
  },
  {
    id: "count_ways",
    prompt:
      "탭③에서 n(A ∪ B) 를 여러 가지 식으로 나타냈어요. 그중 마음에 드는 두 가지를 골라 왜 그 식이 맞는지 조각으로 설명하고, n(A) + n(B) 가 왜 틀리는지도 써 보세요.",
    kind: "text",
    placeholder:
      "예: n(A − B) + n(A ∩ B) + n(B − A) 는 세 조각을 겹치지 않게 하나씩 세어 더한 것이라 맞다. n(A) + n(B − A) 는 A를 통째로 세고 아직 세지 않은 부분만 더한 것이라 맞다. 반면 n(A) + n(B) 는 겹치는 조각을 A에서 한 번, B에서 또 한 번 세어 두 번 세기 때문에 틀린다.",
  },
  {
    id: "empty_piece",
    prompt:
      "탭④에서 조건이 주어질 때마다 '반드시 비어 있어야 하는 조각'을 먼저 찾았어요. 이 방법이 왜 편리한지, 예를 하나 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: A ∪ B = A 처럼 조건이 식으로 주어지면 바로 포함관계가 보이지 않는데, 벤 다이어그램의 네 조각 중 어느 조각이 비어야 하는지를 따지면 그림이 저절로 정해진다. A ∪ B = A 는 B에만 있는 조각이 비어야 하므로 B가 A 안으로 들어가고, 따라서 B ⊂ A 임을 알 수 있다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-4 py-2 text-sm font-bold transition " +
        (active ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

function Chips({ ids, cur, done, onPick }: { ids: string[]; cur: number; done: string[]; onPick: (i: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ids.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => onPick(i)}
          className={
            "h-8 min-w-[2rem] rounded-lg border-2 px-1.5 font-mono text-xs font-bold transition " +
            (i === cur
              ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100"
              : done.includes(id)
                ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
                : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
          }
        >
          {done.includes(id) && i !== cur ? "✓" : i + 1}
        </button>
      ))}
      <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300">
        {done.length} / {ids.length}
      </span>
    </div>
  );
}

function NextBtn({ onClick, label = "다음 문제 ▶" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
    >
      {label}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// 벤 다이어그램
// ══════════════════════════════════════════════════════════════
const A_COL = "#38bdf8";
const B_COL = "#a78bfa";

function circlePath(c: { cx: number; cy: number; r: number }): string {
  return `M${c.cx - c.r},${c.cy} a${c.r},${c.r} 0 1,0 ${2 * c.r},0 a${c.r},${c.r} 0 1,0 ${-2 * c.r},0 Z`;
}

function Venn({
  painted,
  onToggle,
  crossed,
  paintColor = "#22d3ee",
  size = "md",
  children,
}: {
  painted: number[];
  onToggle?: (m: number) => void;
  /** X 표시로 「비었다」고 나타낼 조각 */
  crossed?: number[];
  paintColor?: string;
  size?: "sm" | "md";
  children?: React.ReactNode;
}) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, "");
  const sm = size === "sm";
  return (
    <svg viewBox={`0 0 ${G.w} ${G.h}`} className={"mx-auto block w-full select-none " + (sm ? "max-w-[220px]" : "max-w-[440px]")} role="img" aria-label="벤 다이어그램">
      <defs>
        <clipPath id={`${u}inA`}>
          <circle cx={G.a.cx} cy={G.a.cy} r={G.a.r} />
        </clipPath>
        <clipPath id={`${u}inB`}>
          <circle cx={G.b.cx} cy={G.b.cy} r={G.b.r} />
        </clipPath>
        <clipPath id={`${u}outA`}>
          <path d={`M0,0 H${G.w} V${G.h} H0 Z ${circlePath(G.a)}`} clipRule="evenodd" />
        </clipPath>
        <clipPath id={`${u}outB`}>
          <path d={`M0,0 H${G.w} V${G.h} H0 Z ${circlePath(G.b)}`} clipRule="evenodd" />
        </clipPath>
      </defs>

      {ALL_REGIONS.map((m) => {
        const on = painted.includes(m);
        const fill = on ? `${paintColor}55` : "rgba(255,255,255,0.02)";
        let node: React.ReactNode = (
          <rect
            x={G.box.x}
            y={G.box.y}
            width={G.box.w}
            height={G.box.h}
            rx={G.box.r}
            fill={fill}
            onClick={onToggle ? () => onToggle(m) : undefined}
            className={onToggle ? "cursor-pointer" : undefined}
          />
        );
        node = <g clipPath={`url(#${u}${m & 2 ? "in" : "out"}B)`}>{node}</g>;
        node = <g clipPath={`url(#${u}${m & 1 ? "in" : "out"}A)`}>{node}</g>;
        return <g key={m}>{node}</g>;
      })}

      <rect x={G.box.x} y={G.box.y} width={G.box.w} height={G.box.h} rx={G.box.r} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth={sm ? 4 : 2.5} pointerEvents="none" />
      <circle cx={G.a.cx} cy={G.a.cy} r={G.a.r} fill="none" stroke={A_COL} strokeWidth={sm ? 5 : 3} pointerEvents="none" />
      <circle cx={G.b.cx} cy={G.b.cy} r={G.b.r} fill="none" stroke={B_COL} strokeWidth={sm ? 5 : 3} pointerEvents="none" />
      {sm ? null : (
        <>
          <text x={G.ul.x} y={G.ul.y} textAnchor="middle" className="fill-slate-300 font-serif text-[19px] font-bold italic" pointerEvents="none">
            U
          </text>
          <text x={G.a.lx} y={G.a.ly} textAnchor="middle" fill={A_COL} className="font-serif text-[20px] font-bold italic" pointerEvents="none">
            A
          </text>
          <text x={G.b.lx} y={G.b.ly} textAnchor="middle" fill={B_COL} className="font-serif text-[20px] font-bold italic" pointerEvents="none">
            B
          </text>
        </>
      )}

      {(crossed ?? []).map((m) => {
        const p = G.anchor[m];
        return (
          <g key={`x${m}`} pointerEvents="none">
            <line x1={p.x - 16} y1={p.y - 16} x2={p.x + 16} y2={p.y + 16} stroke="#fb7185" strokeWidth={5} strokeLinecap="round" />
            <line x1={p.x + 16} y1={p.y - 16} x2={p.x - 16} y2={p.y + 16} stroke="#fb7185" strokeWidth={5} strokeLinecap="round" />
          </g>
        );
      })}
      {children}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
type Tab = "morgan" | "elem" | "count" | "infer";

export default function DeMorganLab() {
  const [tab, setTab] = useState<Tab>("morgan");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔄 드모르간의 법칙</h3>
        <p className="mt-2 leading-7 text-slate-300">
          여집합을 씌우면 <b className="text-amber-200">∪ 와 ∩ 이 서로 바뀌어요</b>. 직접 칠하고 <b className="text-cyan-200">통째로 뒤집어</b> 확인하고, 개수를 세는 여러 길도
          견주어 봅시다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "morgan"} onClick={() => setTab("morgan")}>
          ① 뒤집고 겹치기 🔄
        </TabButton>
        <TabButton active={tab === "elem"} onClick={() => setTab("elem")}>
          ② 원소로 확인 🔢
        </TabButton>
        <TabButton active={tab === "count"} onClick={() => setTab("count")}>
          ③ 개수 세는 길 🧮
        </TabButton>
        <TabButton active={tab === "infer"} onClick={() => setTab("infer")}>
          ④ 조건과 포함관계 🧭
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "morgan" ? <MorganTab /> : null}
        {tab === "elem" ? <ElemTab /> : null}
        {tab === "count" ? <CountTab /> : null}
        {tab === "infer" ? <InferTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 뒤집고 겹치기
// ══════════════════════════════════════════════════════════════
function MorganTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = MORGANS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔄 두 갈래 길로 같은 조각에 닿아 보세요</p>
          <Chips ids={MORGANS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[11px] leading-5 text-slate-300">
            <b className="text-sky-200">왼쪽 길</b> — 괄호 안을 칠하고 <b className="text-white">통째로 뒤집기</b>
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[11px] leading-5 text-slate-300">
            <b className="text-violet-200">오른쪽 길</b> — 여집합 둘을 칠하고 <b className="text-white">이어 붙이기</b>
          </p>
        </div>
      </div>

      <MorganOne
        key={p.id}
        p={p}
        last={i === MORGANS.length - 1}
        onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))}
        onNext={() => setI((k) => Math.min(MORGANS.length - 1, k + 1))}
      />

      {done.length === MORGANS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 드모르간의 법칙을 두 가지 모두 확인했어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {["(A \\cup B)^{C} = A^{C} \\cap B^{C}", "(A \\cap B)^{C} = A^{C} \\cup B^{C}"].map((t) => (
              <div key={t} className="flex justify-center overflow-x-auto overflow-y-hidden rounded-xl bg-black/25 px-3 py-2 text-slate-100">
                <Katex expr={t} />
              </div>
            ))}
          </div>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
            여집합 기호는 <b className="text-amber-200">∪ 를 ∩ 으로, ∩ 을 ∪ 으로</b> 바꿔요. 집합이 셋 이상이어도 마찬가지랍니다.
          </p>
          <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
            {["(A_1 \\cup \\cdots \\cup A_n)^{C} = A_1^{C} \\cap \\cdots \\cap A_n^{C}", "(A_1 \\cap \\cdots \\cap A_n)^{C} = A_1^{C} \\cup \\cdots \\cup A_n^{C}"].map((t) => (
              <div key={t} className="flex justify-center overflow-x-auto overflow-y-hidden rounded-xl bg-black/25 px-3 py-2 text-[13px] text-slate-200">
                <Katex expr={t} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MorganOne({ p, last, onDone, onNext }: { p: MorganTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [inner, setInner] = useState<number[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [c1, setC1] = useState<number[]>([]);
  const [c2, setC2] = useState<number[]>([]);
  const [joined, setJoined] = useState(false);

  const innerOk = sameRegions(inner, regionsOf(p.inner));
  const leftDone = innerOk && flipped;
  const c1Ok = sameRegions(c1, regionsOf(p.p1));
  const c2Ok = sameRegions(c2, regionsOf(p.p2));
  const rightDone = c1Ok && c2Ok && joined;
  const ok = leftDone && rightDone;

  const leftPaint = flipped ? flip(inner) : inner;
  const rightPaint = regionsOf(p.right);

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="space-y-4">
      {/* 왼쪽 길 */}
      <div className={"rounded-2xl border-2 p-4 transition " + (leftDone ? "border-emerald-400/55 bg-emerald-400/[0.08]" : "border-sky-400/40 bg-sky-400/[0.06]")}>
        <p className="text-sm font-bold text-sky-100">1단계 · 괄호 안을 칠하고 뒤집기</p>
        <div className="mt-2 grid items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-2">
            <div className="flex justify-center py-1 text-lg text-slate-100">
              <Katex expr={exprTex(p.inner)} />
            </div>
            <Venn painted={inner} onToggle={flipped ? undefined : (m) => setInner((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]))} paintColor="#38bdf8" />
            <p className={"mt-1 text-center text-[12px] font-bold " + (innerOk ? "text-emerald-200" : "text-slate-400")}>{innerOk ? "✅ 알맞게 칠했어요" : `칠한 조각 ${inner.length}`}</p>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setFlipped(true)}
              disabled={!innerOk || flipped}
              className="rounded-2xl border-2 border-amber-400/60 bg-amber-400/15 px-4 py-3 text-sm font-extrabold text-amber-100 transition hover:bg-amber-400/25 disabled:opacity-35"
            >
              🔃 통째로
              <br />
              뒤집기
            </button>
          </div>

          <div className={"rounded-2xl border p-2 transition " + (flipped ? "border-emerald-400/50 bg-slate-950/70" : "border-dashed border-white/15 bg-slate-950/40")}>
            <div className="flex justify-center py-1 text-lg text-slate-100">
              <Katex expr={exprTex(p.left)} />
            </div>
            {flipped ? <Venn painted={leftPaint} paintColor="#38bdf8" /> : <div className="flex h-[150px] items-center justify-center text-[12px] text-slate-600">뒤집기를 누르면 나타나요</div>}
          </div>
        </div>
      </div>

      {/* 오른쪽 길 */}
      <div className={"rounded-2xl border-2 p-4 transition " + (rightDone ? "border-emerald-400/55 bg-emerald-400/[0.08]" : "border-violet-400/40 bg-violet-400/[0.06]")}>
        <p className="text-sm font-bold text-violet-100">2단계 · 여집합 둘을 칠하고 이어 붙이기</p>
        <div className="mt-2 grid items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { e: p.p1, v: c1, set: setC1, okv: c1Ok },
              { e: p.p2, v: c2, set: setC2, okv: c2Ok },
            ].map((x, k) => (
              <div key={k} className="rounded-2xl border border-white/10 bg-slate-950/70 p-2">
                <div className="flex justify-center py-1 text-slate-100">
                  <Katex expr={exprTex(x.e)} />
                </div>
                <Venn painted={x.v} onToggle={joined ? undefined : (m) => x.set((s) => (s.includes(m) ? s.filter((y) => y !== m) : [...s, m]))} paintColor="#a78bfa" size="sm" />
                <p className={"mt-1 text-center text-[11px] font-bold " + (x.okv ? "text-emerald-200" : "text-slate-400")}>{x.okv ? "✅" : `${x.v.length}조각`}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setJoined(true)}
              disabled={!c1Ok || !c2Ok || joined}
              className="rounded-2xl border-2 border-amber-400/60 bg-amber-400/15 px-4 py-3 text-sm font-extrabold text-amber-100 transition hover:bg-amber-400/25 disabled:opacity-35"
            >
              {p.joinOp === "i" ? "🔗 겹치는 곳만" : "🔗 둘을 합쳐"}
              <br />
              {p.joinOp === "i" ? "남기기 (∩)" : "모으기 (∪)"}
            </button>
          </div>

          <div className={"rounded-2xl border p-2 transition " + (joined ? "border-emerald-400/50 bg-slate-950/70" : "border-dashed border-white/15 bg-slate-950/40")}>
            <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-slate-100">
              <Katex expr={exprTex(p.right)} />
            </div>
            {joined ? <Venn painted={rightPaint} paintColor="#a78bfa" /> : <div className="flex h-[150px] items-center justify-center text-[12px] text-slate-600">두 조각을 칠하면 열려요</div>}
          </div>
        </div>
      </div>

      <div className={"rounded-2xl border-2 px-4 py-3 text-center transition " + (ok ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
        {ok ? (
          <>
            <p className="text-sm font-extrabold text-emerald-100">✅ 두 길이 같은 조각에 닿았어요!</p>
            <div className="mt-1.5 flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-slate-100">
              <Katex expr={`${exprTex(p.left)} = ${exprTex(p.right)}`} />
            </div>
          </>
        ) : (
          <p className="text-[12px] leading-6 text-slate-400">두 길을 모두 끝까지 걸어 보세요</p>
        )}
      </div>

      {ok ? (
        <>
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {p.tip}</p>
          {!last ? <NextBtn onClick={onNext} /> : null}
        </>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 원소로 확인
// ══════════════════════════════════════════════════════════════
function ElemTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = ELEMS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔢 양쪽을 각각 구해 같은지 확인하세요</p>
          <Chips ids={ELEMS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
      </div>

      <ElemOne key={t.id} t={t} last={i === ELEMS.length - 1} onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))} onNext={() => setI((k) => Math.min(ELEMS.length - 1, k + 1))} />
    </div>
  );
}

function ElemOne({ t, last, onDone, onNext }: { t: ElemTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [lhs, setLhs] = useState<string[]>([]);
  const [rhs, setRhs] = useState<string[]>([]);
  const [hint, setHint] = useState(false);

  const ans = elemAnswer(t);
  const same = (xs: string[]) => xs.length === ans.length && xs.every((x) => ans.includes(x));
  const okL = same(lhs);
  const okR = same(rhs);
  const ok = okL && okR;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const leftTex = t.law === 1 ? "(A \\cup B)^{C}" : "(A \\cap B)^{C}";
  const rightTex = t.law === 1 ? "A^{C} \\cap B^{C}" : "A^{C} \\cup B^{C}";
  const mid = t.law === 1 ? unionOf(t.a, t.b) : interOf(t.a, t.b);
  const cA = compOf(t.univ, t.a);
  const cB = compOf(t.univ, t.b);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-white/10 bg-white/5 p-3">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[14px] font-semibold">
          {[
            { n: "U", label: t.univLabel, col: "text-slate-100" },
            { n: "A", label: t.aLabel, col: "text-sky-100" },
            { n: "B", label: t.bLabel, col: "text-violet-100" },
          ].map((x) => (
            <span key={x.n} className={"inline-flex flex-wrap items-center gap-1.5 " + x.col}>
              <i className="font-serif italic">{x.n}</i>
              <span>=</span>
              <span className="text-slate-400">{"{"}</span>
              <i className="font-serif italic">x</i>
              <span className="text-slate-400">|</span>
              <span>
                <i className="font-serif italic">x</i>는 {x.label}
              </span>
              <span className="text-slate-400">{"}"}</span>
            </span>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-[13px] text-slate-300">
          <span>
            <Katex expr={`A = ${listTex(t.a)}`} />
          </span>
          <span>
            <Katex expr={`B = ${listTex(t.b)}`} />
          </span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {[
          { tex: leftTex, val: lhs, set: setLhs, okv: okL, tone: "sky" as const },
          { tex: rightTex, val: rhs, set: setRhs, okv: okR, tone: "violet" as const },
        ].map((s, k) => (
          <div key={k} className={"rounded-2xl border-2 p-4 transition " + (s.okv ? "border-emerald-400/55 bg-emerald-400/12" : s.tone === "sky" ? "border-sky-400/40 bg-sky-400/[0.07]" : "border-violet-400/40 bg-violet-400/[0.07]")}>
            <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-xl text-slate-100">
              <Katex expr={s.tex} />
            </div>
            <p className="mt-1 text-center text-[11px] text-slate-400">U의 원소 중 이 집합에 속하는 것을 모두 고르세요</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {t.univ.map((x) => {
                const on = s.val.includes(x);
                const good = on && ans.includes(x);
                const bad = on && !ans.includes(x);
                return (
                  <button
                    key={x}
                    type="button"
                    onClick={() => s.set((v) => (v.includes(x) ? v.filter((y) => y !== x) : [...v, x]))}
                    disabled={s.okv}
                    className={
                      "h-10 min-w-[2.75rem] rounded-xl border-2 px-2.5 font-mono text-base font-bold transition disabled:cursor-default " +
                      (good ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : bad ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    {x}
                  </button>
                );
              })}
            </div>
            <p className={"mt-2 text-center text-[12px] font-bold " + (s.okv ? "text-emerald-200" : "text-slate-400")}>
              {s.okv ? "✅ 맞았어요!" : `고른 원소 ${s.val.filter((x) => ans.includes(x)).length} / ${ans.length}`}
            </p>
          </div>
        ))}
      </div>

      {!ok ? (
        <>
          <button
            type="button"
            onClick={() => setHint((v) => !v)}
            className="w-full rounded-xl border border-amber-400/45 bg-amber-400/10 px-3 py-2 text-[12px] font-bold text-amber-100 transition hover:bg-amber-400/20"
          >
            💡 중간 단계 {hint ? "닫기" : "보기"}
          </button>
          {hint ? (
            <div className="grid gap-1.5 rounded-2xl bg-black/25 p-3 sm:grid-cols-3">
              {[
                { t: `${t.law === 1 ? "A \\cup B" : "A \\cap B"} = ${listTex(mid)}` },
                { t: `A^{C} = ${listTex(cA)}` },
                { t: `B^{C} = ${listTex(cB)}` },
              ].map((x) => (
                <div key={x.t} className="flex justify-center overflow-x-auto overflow-y-hidden rounded-lg bg-white/5 px-2 py-1.5 text-[13px] text-slate-200">
                  <Katex expr={x.t} />
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="rounded-2xl border-2 border-emerald-400/55 bg-emerald-400/12 px-4 py-3 text-center">
            <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-emerald-100">
              <Katex expr={`${leftTex} = ${rightTex} = ${listTex(ans)}`} />
            </div>
          </div>
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {t.tip}</p>
          {!last ? <NextBtn onClick={onNext} /> : null}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 개수 세는 길
// ══════════════════════════════════════════════════════════════
function CountTab() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(2);
  const [c, setC] = useState(4);
  const [view, setView] = useState<string | null>(null);
  const [judged, setJudged] = useState<Record<string, boolean>>({});

  const cur = FORMS.find((f) => f.id === view) ?? null;
  const rightCount = Object.entries(judged).filter(([id, v]) => (FORMS.find((f) => f.id === id) as CountForm).ok === v).length;
  const allJudged = Object.keys(judged).length === FORMS.length;
  const allRight = allJudged && rightCount === FORMS.length;

  const hi: number[] = cur ? [...new Set(cur.terms.flatMap((t) => t.regions))] : [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🧮 세 조각의 개수를 정해 놓고, 여러 식을 견주어 보세요</p>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          식을 누르면 그 식이 세는 조각이 밝아져요. 슬라이더를 움직이며 값이 <b className="text-white">언제나</b> <Katex expr="n(A \cup B)" /> 와 같은지 확인한 뒤 판정하세요.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border-2 border-white/10 bg-slate-950/70 p-2">
            <Venn painted={hi} paintColor="#fbbf24">
              {[
                { m: 1, v: a, col: "fill-sky-200" },
                { m: 3, v: b, col: "fill-emerald-200" },
                { m: 2, v: c, col: "fill-violet-200" },
              ].map((x) => (
                <text key={x.m} x={G.anchor[x.m].x} y={G.anchor[x.m].y + 9} textAnchor="middle" className={"font-mono text-[24px] font-extrabold " + x.col} pointerEvents="none">
                  {x.v}
                </text>
              ))}
            </Venn>
          </div>
          <div className="space-y-2">
            {[
              { label: "a", note: "A에만", v: a, set: setA, col: "accent-sky-400" },
              { label: "b", note: "겹치는 곳", v: b, set: setB, col: "accent-emerald-400" },
              { label: "c", note: "B에만", v: c, set: setC, col: "accent-violet-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-2">
                <span className="w-20 shrink-0 text-[12px] font-bold text-slate-300">
                  <i className="font-serif italic">{s.label}</i> <span className="text-slate-500">{s.note}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={CNT_MAX}
                  step={1}
                  value={s.v}
                  aria-label={s.note}
                  onChange={(e) => s.set(Number(e.target.value))}
                  className={"h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 " + s.col}
                />
                <span className="w-6 shrink-0 text-right font-mono text-base font-extrabold text-white">{s.v}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border-2 border-cyan-400/40 bg-cyan-400/[0.08] px-3 py-3 text-center">
            <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-cyan-100">
              <Katex expr={`n(A \\cup B) = ${a} + ${b} + ${c} = ${a + b + c}`} />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {FORMS.map((f) => {
            const v = valueOf(f, a, b, c);
            const j = judged[f.id];
            const decided = j !== undefined;
            const good = decided && j === f.ok;
            const bad = decided && j !== f.ok;
            return (
              <div
                key={f.id}
                className={
                  "rounded-xl border-2 p-2 transition " +
                  (good ? "border-emerald-400/55 bg-emerald-400/12" : bad ? "border-rose-400/55 bg-rose-400/12" : view === f.id ? "border-amber-400/60 bg-amber-400/12" : "border-white/12 bg-white/5")
                }
              >
                <button type="button" onClick={() => setView(view === f.id ? null : f.id)} className="flex w-full items-center gap-2 text-left">
                  <span className="flex-1 overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
                    <Katex expr={f.tex} />
                  </span>
                  <span className={"shrink-0 rounded-lg px-2 py-1 font-mono text-base font-extrabold " + (v === a + b + c ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/20 text-rose-100")}>{v}</span>
                </button>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {[true, false].map((val) => {
                    const on = j === val;
                    const isRight = decided && val === f.ok;
                    return (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => setJudged((s) => ({ ...s, [f.id]: val }))}
                        disabled={good}
                        className={
                          "rounded-lg border-2 px-1 py-1 text-[11px] font-bold whitespace-nowrap transition disabled:cursor-default " +
                          (isRight && on
                            ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                            : on
                              ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                        }
                      >
                        {val ? "⭕ 언제나 같음" : "❌ 다를 수 있음"}
                      </button>
                    );
                  })}
                </div>
                {good ? <p className="mt-1 rounded-lg bg-black/25 px-2 py-1 text-[11px] leading-5 text-slate-300">💡 {f.tip}</p> : null}
              </div>
            );
          })}
          <p className={"text-center text-[12px] font-bold " + (allRight ? "text-emerald-200" : "text-slate-400")}>
            {allRight ? "🎉 여덟 식을 모두 바르게 판정했어요!" : `바르게 판정한 식 ${rightCount} / ${FORMS.length}`}
          </p>
        </div>
      </div>

      {allRight ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">✨ 세는 길은 여러 가지, 답은 하나</p>
          <p className="mt-1.5 text-[12px] leading-7 text-slate-300">
            겹치는 조각을 <b className="text-white">두 번 세지도, 빠뜨리지도</b> 않으면 어떤 길로 세어도 같은 값이 나와요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 조건과 포함관계
// ══════════════════════════════════════════════════════════════
function MiniNested({ inner }: { inner: "A" | "B" }) {
  const outer = inner === "A" ? "B" : "A";
  return (
    <svg viewBox="0 0 200 130" className="mx-auto block w-full max-w-[200px]" role="img" aria-label="포함관계 그림">
      <rect x={4} y={14} width={192} height={112} rx={12} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
      <text x={20} y={30} textAnchor="middle" className="fill-slate-300 font-serif text-[13px] font-bold italic">
        U
      </text>
      <circle cx={110} cy={72} r={46} fill={`${inner === "A" ? B_COL : A_COL}14`} stroke={inner === "A" ? B_COL : A_COL} strokeWidth={2.5} />
      <circle cx={110} cy={82} r={24} fill={`${inner === "A" ? A_COL : B_COL}22`} stroke={inner === "A" ? A_COL : B_COL} strokeWidth={2.5} />
      <text x={110} y={40} textAnchor="middle" fill={inner === "A" ? B_COL : A_COL} className="font-serif text-[14px] font-bold italic">
        {outer}
      </text>
      <text x={110} y={87} textAnchor="middle" fill={inner === "A" ? A_COL : B_COL} className="font-serif text-[14px] font-bold italic">
        {inner}
      </text>
    </svg>
  );
}

function InferTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = INFERS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧭 조건을 보고 포함관계를 알아내세요</p>
          <Chips ids={INFERS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          먼저 <b className="text-white">반드시 비어 있어야 하는 조각</b>을 눌러 찾고, 그다음 포함관계를 고르면 돼요.
        </p>
      </div>

      <InferOne key={p.id} p={p} last={i === INFERS.length - 1} onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))} onNext={() => setI((k) => Math.min(INFERS.length - 1, k + 1))} />

      {done.length === INFERS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 여섯 조건을 모두 풀었어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <p className="rounded-xl bg-black/25 px-3 py-2 text-[12px] leading-7 text-slate-300">
              <b className="text-sky-200">A에만 있는 조각</b>이 비면
              <br />
              <Katex expr="A \subset B" />
            </p>
            <p className="rounded-xl bg-black/25 px-3 py-2 text-[12px] leading-7 text-slate-300">
              <b className="text-violet-200">B에만 있는 조각</b>이 비면
              <br />
              <Katex expr="B \subset A" />
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InferOne({ p, last, onDone, onNext }: { p: Infer; last: boolean; onDone: () => void; onNext: () => void }) {
  const [pickRegion, setPickRegion] = useState<number | null>(null);
  const [pickSub, setPickSub] = useState<string | null>(null);

  const okRegion = pickRegion === p.empty;
  const ansSub = subsetOf(p.empty);
  const ok = okRegion && pickSub === ansSub;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="space-y-3">
      <div className={"rounded-2xl border-2 px-4 py-4 text-center transition " + (ok ? "border-emerald-400/60 bg-emerald-400/15" : "border-violet-400/40 bg-violet-400/[0.08]")}>
        <p className="text-[11px] font-bold text-violet-200">주어진 조건</p>
        <div className="mt-1 flex justify-center overflow-x-auto overflow-y-hidden py-1 text-2xl text-slate-100">
          <Katex expr={p.condTex ?? `${exprTex(p.left)} = ${exprTex(p.right)}`} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border-2 border-white/10 bg-slate-950/70 p-2">
          <Venn
            painted={okRegion ? [] : pickRegion !== null ? [pickRegion] : []}
            onToggle={okRegion ? undefined : (m) => setPickRegion(m)}
            crossed={okRegion ? [p.empty] : []}
            paintColor="#fb7185"
          />
          <p className={"mt-1 text-center text-[12px] font-bold " + (okRegion ? "text-emerald-200" : pickRegion !== null ? "text-rose-200" : "text-slate-400")}>
            {okRegion ? `✅ ${REGION_NAME[p.empty]}이(가) 비어 있어야 해요` : pickRegion !== null ? "그 조각은 아니에요 — 다시 살펴볼까요?" : "1단계 · 비어야 하는 조각을 누르세요"}
          </p>
        </div>

        <div className="space-y-3">
          <div className={"rounded-2xl border-2 p-3 transition " + (ok ? "border-emerald-400/60 bg-emerald-400/15" : okRegion ? "border-cyan-400/40 bg-cyan-400/[0.07]" : "border-white/10 bg-white/[0.03] opacity-45")}>
            <p className="text-center text-sm font-bold text-slate-100">2단계 · 그러면 포함관계는?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["AsubB", "BsubA"] as const).map((s) => {
                const on = pickSub === s;
                const good = pickSub !== null && s === ansSub && ok;
                const bad = on && s !== ansSub;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPickSub(s)}
                    disabled={!okRegion || ok}
                    className={
                      "rounded-xl border-2 px-2 py-3 text-lg font-bold transition disabled:cursor-default " +
                      (good ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : bad ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    <Katex expr={SUB_TEX[s]} />
                  </button>
                );
              })}
            </div>
          </div>

          {ok ? (
            <>
              <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-3">
                <MiniNested inner={ansSub === "AsubB" ? "A" : "B"} />
                <p className="mt-1 text-center text-[12px] font-bold text-emerald-100">
                  <Katex expr={SUB_TEX[ansSub]} /> 인 그림이 돼요
                </p>
              </div>
              <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {p.tip}</p>
              {!last ? <NextBtn onClick={onNext} /> : null}
            </>
          ) : (
            <div className="flex min-h-[8rem] items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 text-center">
              <p className="text-[12px] leading-6 text-slate-500">
                두 단계를 모두 맞히면
                <br />
                포함관계 그림이 나타나요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
