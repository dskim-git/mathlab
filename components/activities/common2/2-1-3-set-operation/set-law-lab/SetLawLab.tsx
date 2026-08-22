"use client";

import { useEffect, useId, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  JUDGES,
  LAWS1,
  LAWS2,
  MATCHES,
  NUM_MAX,
  REGION_NAME,
  SET_ORDER,
  diffRegions,
  exprTex,
  geom,
  lhsNum,
  regionsOf,
  rhsNum,
  sameRegions,
  splitRight,
  type Expr,
  type Judge,
  type LawProblem,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "assoc_paren",
    prompt:
      "결합법칙이 성립하기 때문에 (A ∪ B) ∪ C 를 A ∪ B ∪ C 처럼 괄호 없이 쓸 수 있어요. 왜 괄호를 지워도 되는지 벤 다이어그램을 떠올려 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 어느 둘을 먼저 합치든 마지막에 남는 영역이 똑같았다. (A ∪ B) ∪ C 도 A ∪ (B ∪ C) 도 세 원 전체를 칠하게 되므로, 계산하는 차례가 결과를 바꾸지 않는다. 그래서 괄호를 지워도 뜻이 달라지지 않는다.",
  },
  {
    id: "distributive",
    prompt:
      "분배법칙 A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C) 를 벤 다이어그램의 영역으로 설명해 보세요. 오른쪽 식을 두 조각으로 나누어 생각하면 어떻게 되나요?",
    kind: "text",
    placeholder:
      "예: 왼쪽은 A 안에 있으면서 B나 C 중 하나에라도 속하는 부분이다. 오른쪽은 A와 B가 겹치는 부분, A와 C가 겹치는 부분을 각각 구해서 합친 것이다. 두 조각을 합치면 A 안에서 B나 C에 걸치는 부분이 남으므로 왼쪽과 같아진다.",
  },
  {
    id: "num_vs_set",
    prompt:
      "수에서는 a + b × c 와 (a + b) × (a + c) 가 대체로 다른데, 집합에서는 A ∪ (B ∩ C) = (A ∪ B) ∩ (A ∪ C) 가 언제나 성립했어요. 이 차이를 보고 무엇을 느꼈는지 써 보세요.",
    kind: "text",
    placeholder:
      "예: ∪ 를 +, ∩ 를 × 처럼 생각하면 편할 때가 많지만 완전히 같지는 않다는 것을 알았다. 수에서는 덧셈이 곱셈에 분배되지 않는데 집합에서는 ∪ 도 ∩ 에 분배된다. 그래서 겉모습이 닮았다고 그대로 옮겨 쓰지 말고, 벤 다이어그램으로 직접 확인해야 한다는 것을 배웠다.",
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
// 벤 다이어그램 — 영역을 눌러 칠한다
// ══════════════════════════════════════════════════════════════
const CIRCLE_COLOR: Record<string, string> = { A: "#38bdf8", B: "#a78bfa", C: "#fbbf24" };
const BIT: Record<string, number> = { A: 1, B: 2, C: 4 };

function circlePath(c: { cx: number; cy: number; r: number }): string {
  return `M${c.cx - c.r},${c.cy} a${c.r},${c.r} 0 1,0 ${2 * c.r},0 a${c.r},${c.r} 0 1,0 ${-2 * c.r},0 Z`;
}

function VennPaint({
  n,
  painted,
  onToggle,
  bad,
  paintColor = "#22d3ee",
  small,
}: {
  n: 2 | 3;
  painted: number[];
  onToggle?: (m: number) => void;
  /** 어긋나는 영역 — 빨갛게 */
  bad?: number[];
  paintColor?: string;
  small?: boolean;
}) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, "");
  const g = geom(n);
  const maxM = n === 2 ? 3 : 7;
  const masks = Array.from({ length: maxM }, (_, i) => i + 1);

  return (
    <svg
      viewBox={`0 0 ${g.w} ${g.h}`}
      className={"mx-auto block w-full select-none " + (small ? "max-w-[200px]" : "max-w-[420px]")}
      role="img"
      aria-label="벤 다이어그램"
    >
      <defs>
        {g.circles.map((c) => (
          <clipPath key={`in${c.key}`} id={`${u}in${c.key}`}>
            <circle cx={c.cx} cy={c.cy} r={c.r} />
          </clipPath>
        ))}
        {g.circles.map((c) => (
          <clipPath key={`out${c.key}`} id={`${u}out${c.key}`}>
            <path d={`M0,0 H${g.w} V${g.h} H0 Z ${circlePath(c)}`} clipRule="evenodd" />
          </clipPath>
        ))}
      </defs>

      {masks.map((m) => {
        const isBad = (bad ?? []).includes(m);
        const on = painted.includes(m);
        const fill = isBad ? "#fb718566" : on ? `${paintColor}55` : "rgba(255,255,255,0.02)";
        let node: React.ReactNode = (
          <rect
            x={0}
            y={0}
            width={g.w}
            height={g.h}
            fill={fill}
            onClick={onToggle ? () => onToggle(m) : undefined}
            className={onToggle ? "cursor-pointer" : undefined}
          />
        );
        for (const c of g.circles) {
          const inside = (m & BIT[c.key]) !== 0;
          node = <g clipPath={`url(#${u}${inside ? "in" : "out"}${c.key})`}>{node}</g>;
        }
        return <g key={m}>{node}</g>;
      })}

      {g.circles.map((c) => (
        <circle key={c.key} cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke={CIRCLE_COLOR[c.key]} strokeWidth={small ? 4 : 3} pointerEvents="none" />
      ))}
      {small
        ? null
        : g.circles.map((c) => (
            <text key={`l${c.key}`} x={c.lx} y={c.ly} textAnchor="middle" fill={CIRCLE_COLOR[c.key]} className="font-serif text-[20px] font-bold italic" pointerEvents="none">
              {c.key}
            </text>
          ))}
    </svg>
  );
}

/** 식 하나를 칠하게 하는 칸 */
function PaintCard({
  n,
  expr,
  painted,
  setPainted,
  locked,
}: {
  n: 2 | 3;
  expr: Expr;
  painted: number[];
  setPainted: (f: (s: number[]) => number[]) => void;
  locked?: boolean;
}) {
  const want = regionsOf(expr, n);
  const ok = sameRegions(painted, want);
  return (
    <div className={"rounded-2xl border-2 p-3 transition " + (ok ? "border-emerald-400/60 bg-emerald-400/[0.10]" : "border-white/10 bg-white/5")}>
      <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-slate-100">
        <Katex expr={exprTex(expr)} />
      </div>
      <div className="mt-1 overflow-hidden rounded-xl bg-slate-950/70 p-1">
        <VennPaint n={n} painted={painted} onToggle={locked ? undefined : (m) => setPainted((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]))} />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className={"text-[12px] font-bold " + (ok ? "text-emerald-200" : "text-slate-400")}>{ok ? "✅ 알맞게 칠했어요" : `칠한 영역 ${painted.length}`}</p>
        {!locked && !ok ? (
          <button
            type="button"
            onClick={() => setPainted(() => [])}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↺ 지우기
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
type Tab = "assoc" | "dist" | "compare" | "judge";

export default function SetLawLab() {
  const [tab, setTab] = useState<Tab>("assoc");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">⚖️ 집합의 연산법칙</h3>
        <p className="mt-2 leading-7 text-slate-300">
          두 식이 나타내는 <b className="text-cyan-200">영역을 직접 칠해</b> 보면 법칙이 왜 성립하는지 한눈에 보여요. 수의 연산법칙과 견주어 <b className="text-amber-200">닮은 점과
          다른 점</b>도 찾아봅시다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "assoc"} onClick={() => setTab("assoc")}>
          ① 교환·결합법칙 🔁
        </TabButton>
        <TabButton active={tab === "dist"} onClick={() => setTab("dist")}>
          ② 분배법칙 🔀
        </TabButton>
        <TabButton active={tab === "compare"} onClick={() => setTab("compare")}>
          ③ 수와 견주기 ⚖️
        </TabButton>
        <TabButton active={tab === "judge"} onClick={() => setTab("judge")}>
          ④ 법칙 탐정 🔍
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "assoc" ? <LawTab problems={LAWS1} title="🔁 두 식이 같은 영역을 나타내는지 칠해서 확인하세요" showShort /> : null}
        {tab === "dist" ? <LawTab problems={LAWS2} title="🔀 ∩ 과 ∪ 이 섞여도 괄호를 풀 수 있을까요?" showSplit /> : null}
        {tab === "compare" ? <CompareTab /> : null}
        {tab === "judge" ? <JudgeTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① · ② 두 식 칠해 보기
// ══════════════════════════════════════════════════════════════
function LawTab({ problems, title, showShort, showSplit }: { problems: LawProblem[]; title: string; showShort?: boolean; showSplit?: boolean }) {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = problems[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">{title}</p>
          <Chips ids={problems.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          벤 다이어그램의 <b className="text-white">각 조각</b>을 눌러 켜고 끌 수 있어요. 왼쪽과 오른쪽을 모두 알맞게 칠하면 결과를 견주어 줍니다.
        </p>
      </div>

      <LawOne
        key={p.id}
        p={p}
        showShort={showShort}
        showSplit={showSplit}
        last={i === problems.length - 1}
        onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))}
        onNext={() => setI((k) => Math.min(problems.length - 1, k + 1))}
      />

      {done.length === problems.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 {problems.length}문제를 모두 확인했어요!</p>
          <p className="mt-1.5 text-[12px] leading-6 text-slate-300">
            {showShort ? (
              <>
                같은 연산끼리는 <b className="text-white">순서도 차례도</b> 결과를 바꾸지 않아요. 그래서 괄호를 지우고 <Katex expr="A \cup B \cup C" /> 처럼 쓸 수 있습니다.
              </>
            ) : (
              <>
                <b className="text-amber-200">결합법칙</b>은 두 연산이 <b className="text-white">같을 때</b>, <b className="text-amber-200">분배법칙</b>은 두 연산이{" "}
                <b className="text-white">다를 때</b> 쓰는 법칙이에요.
              </>
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function LawOne({
  p,
  showShort,
  showSplit,
  last,
  onDone,
  onNext,
}: {
  p: LawProblem;
  showShort?: boolean;
  showSplit?: boolean;
  last: boolean;
  onDone: () => void;
  onNext: () => void;
}) {
  const [left, setLeft] = useState<number[]>([]);
  const [right, setRight] = useState<number[]>([]);

  const wantL = regionsOf(p.left, p.n);
  const wantR = regionsOf(p.right, p.n);
  const okL = sameRegions(left, wantL);
  const okR = sameRegions(right, wantR);
  const ok = okL && okR;
  const sp = splitRight(p.right);

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <PaintCard n={p.n} expr={p.left} painted={left} setPainted={setLeft} locked={ok} />
        <PaintCard n={p.n} expr={p.right} painted={right} setPainted={setRight} locked={ok} />
      </div>

      <div className={"rounded-2xl border-2 px-4 py-3 text-center transition " + (ok ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
        {ok ? (
          <>
            <p className="text-sm font-extrabold text-emerald-100">✅ 두 영역이 완전히 같아요 — {p.law}</p>
            <div className="mt-1.5 flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-slate-100">
              <Katex expr={`${exprTex(p.left)} = ${exprTex(p.right)}`} />
            </div>
            {showShort && p.shortTex ? (
              <p className="mt-1 text-[12px] leading-7 text-slate-300">
                괄호를 지우고 <Katex expr={p.shortTex} /> 라고 써도 돼요
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-[12px] leading-6 text-slate-400">
            {okL || okR ? "한쪽을 맞혔어요 — 나머지도 칠해 보세요" : "두 식이 나타내는 영역을 각각 칠해 보세요"}
          </p>
        )}
      </div>

      {ok && showSplit && sp ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-[12px] font-bold text-slate-300">🧩 오른쪽 식을 쪼개어 보면</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            {sp.parts.map((q, k) => (
              <div key={k} className="flex items-center gap-3">
                {k > 0 ? <span className="text-2xl text-slate-300">{sp.op === "u" ? "∪" : "∩"}</span> : null}
                <div className="text-center">
                  <div className="overflow-hidden rounded-lg bg-slate-950/70 p-1">
                    <VennPaint n={3} painted={regionsOf(q, 3)} small paintColor={k === 0 ? "#34d399" : "#f472b6"} />
                  </div>
                  <p className="mt-1 text-slate-200">
                    <Katex expr={exprTex(q)} />
                  </p>
                </div>
              </div>
            ))}
            <span className="text-2xl text-slate-300">=</span>
            <div className="text-center">
              <div className="overflow-hidden rounded-lg bg-slate-950/70 p-1">
                <VennPaint n={3} painted={wantR} small />
              </div>
              <p className="mt-1 text-slate-200">
                <Katex expr={exprTex(p.left)} />
              </p>
            </div>
          </div>
        </div>
      ) : null}

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
// 탭 ③ 수와 견주기
// ══════════════════════════════════════════════════════════════
function CompareTab() {
  return (
    <div className="space-y-4">
      <MatchGame />
      <NumberBreak />
    </div>
  );
}

function MatchGame() {
  const [numPick, setNumPick] = useState<string | null>(null);
  const [setPick, setSetPick] = useState<string | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [miss, setMiss] = useState(0);

  const cleared = found.length === MATCHES.length;
  const wrong = numPick !== null && setPick !== null && numPick !== setPick;

  function pickNum(id: string) {
    if (found.includes(id) || cleared) return;
    if (setPick) {
      if (setPick === id) {
        setFound((s) => [...s, id]);
        setNumPick(null);
        setSetPick(null);
      } else {
        setNumPick(id);
        setMiss((m) => m + 1);
      }
      return;
    }
    setNumPick(id === numPick ? null : id);
  }
  function pickSet(id: string) {
    if (found.includes(id) || cleared) return;
    if (numPick) {
      if (numPick === id) {
        setFound((s) => [...s, id]);
        setNumPick(null);
        setSetPick(null);
      } else {
        setSetPick(id);
        setMiss((m) => m + 1);
      }
      return;
    }
    setSetPick(id === setPick ? null : id);
  }

  function cls(id: string, picked: string | null) {
    if (found.includes(id)) return "border-emerald-400/50 bg-emerald-400/12 text-emerald-100 opacity-70";
    if (picked === id) return wrong ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : "border-cyan-400/70 bg-cyan-400/20 text-cyan-100";
    return "border-white/12 bg-white/5 text-slate-200 hover:bg-white/10";
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-100">🧲 같은 법칙끼리 짝지어 보세요</p>
        <span className={"rounded-full px-3 py-1 text-[12px] font-bold " + (cleared ? "bg-emerald-400/25 text-emerald-100" : "bg-white/8 text-slate-300")}>
          {cleared ? "🎉 모두 짝지었어요!" : `짝지은 것 ${found.length} / ${MATCHES.length}`}
          {miss > 0 ? <span className="ml-2 font-normal text-rose-300">헛짚음 {miss}</span> : null}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-center text-[11px] font-bold text-amber-200">수의 연산법칙</p>
          <div className="space-y-1.5">
            {MATCHES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => pickNum(m.id)}
                disabled={found.includes(m.id) || cleared}
                className={"flex w-full items-center justify-center overflow-x-auto overflow-y-hidden rounded-xl border-2 px-2 py-2.5 transition disabled:cursor-default " + cls(m.id, numPick)}
              >
                <Katex expr={m.num} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-center text-[11px] font-bold text-sky-200">집합의 연산법칙</p>
          <div className="space-y-1.5">
            {SET_ORDER.map((k) => {
              const m = MATCHES[k];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => pickSet(m.id)}
                  disabled={found.includes(m.id) || cleared}
                  className={"flex w-full items-center justify-center overflow-x-auto overflow-y-hidden rounded-xl border-2 px-2 py-2.5 transition disabled:cursor-default " + cls(m.id, setPick)}
                >
                  <Katex expr={m.set} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {cleared ? (
        <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
          {["교환법칙", "결합법칙", "분배법칙"].map((law) => (
            <p key={law} className="rounded-lg bg-black/25 px-3 py-2 text-center text-[11px] leading-5 text-slate-300">
              <b className="text-emerald-200">{law}</b>
              <br />
              {MATCHES.filter((m) => m.law === law).length}쌍
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-center text-[11px] text-slate-400">
          <Katex expr="\cup" /> 는 <Katex expr="+" /> 와, <Katex expr="\cap" /> 은 <Katex expr="\times" /> 와 닮았어요
        </p>
      )}
    </div>
  );
}

function NumberBreak() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [found, setFound] = useState(false);

  const L = lhsNum(a, b, c);
  const R = rhsNum(a, b, c);
  const diff = L !== R;

  /** 슬라이더를 움직인 그 자리에서 반례인지 살핀다 (효과 안에서 상태를 바꾸지 않으려고) */
  function move(which: "a" | "b" | "c", v: number) {
    const na = which === "a" ? v : a;
    const nb = which === "b" ? v : b;
    const nc = which === "c" ? v : c;
    if (which === "a") setA(v);
    else if (which === "b") setB(v);
    else setC(v);
    if (lhsNum(na, nb, nc) !== rhsNum(na, nb, nc)) setFound(true);
  }

  const d2 = LAWS2.find((x) => x.id === "d2") as LawProblem;

  return (
    <div className={"rounded-2xl border-2 p-4 transition " + (found ? "border-emerald-400/55 bg-emerald-400/[0.10]" : "border-violet-400/40 bg-violet-400/[0.08]")}>
      <p className="text-sm font-bold text-slate-100">🕵️ 수에서는 정말 똑같을까요?</p>
      <p className="mt-1 text-[12px] leading-6 text-slate-300">
        집합의 <Katex expr="A \cup (B \cap C) = (A \cup B) \cap (A \cup C)" /> 를 수로 옮기면 <Katex expr="a + b \times c = (a+b) \times (a+c)" /> 예요.
        <br />
        <b className="text-amber-200">두 값이 달라지는 a, b, c 를 찾아보세요!</b>
      </p>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {[
            { label: "a" as const, v: a, col: "accent-sky-400" },
            { label: "b" as const, v: b, col: "accent-violet-400" },
            { label: "c" as const, v: c, col: "accent-amber-400" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-2">
              <span className="w-5 shrink-0 font-serif text-base font-bold italic text-slate-200">{s.label}</span>
              <input
                type="range"
                min={0}
                max={NUM_MAX}
                step={1}
                value={s.v}
                aria-label={s.label}
                onChange={(e) => move(s.label, Number(e.target.value))}
                className={"h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 " + s.col}
              />
              <span className="w-6 shrink-0 text-right font-mono text-base font-extrabold text-white">{s.v}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border-2 border-white/12 bg-black/25 px-2 py-3 text-center">
              <div className="overflow-x-auto overflow-y-hidden py-0.5 text-slate-200">
                <Katex expr="a + b \times c" />
              </div>
              <p className="mt-1 font-mono text-2xl font-extrabold text-sky-200">{L}</p>
            </div>
            <div className="rounded-xl border-2 border-white/12 bg-black/25 px-2 py-3 text-center">
              <div className="overflow-x-auto overflow-y-hidden py-0.5 text-slate-200">
                <Katex expr="(a+b) \times (a+c)" />
              </div>
              <p className="mt-1 font-mono text-2xl font-extrabold text-violet-200">{R}</p>
            </div>
          </div>
          <p className={"rounded-xl px-3 py-2 text-center text-sm font-extrabold " + (diff ? "bg-rose-400/20 text-rose-100" : "bg-white/8 text-slate-300")}>
            {diff ? `❌ ${L} ≠ ${R} — 수에서는 성립하지 않아요!` : `지금은 ${L} = ${R} — 다른 값을 찾아보세요`}
          </p>
        </div>
      </div>

      {found ? (
        <div className="mt-3 rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-3">
          <p className="text-center text-[12px] font-bold text-emerald-100">🎉 반례를 찾았어요! 그런데 집합에서는 언제나 성립합니다</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            {[d2.left, d2.right].map((e, k) => (
              <div key={k} className="text-center">
                <div className="overflow-hidden rounded-lg bg-slate-950/70 p-1">
                  <VennPaint n={3} painted={regionsOf(e, 3)} small />
                </div>
                <p className="mt-1 text-[13px] text-slate-200">
                  <Katex expr={exprTex(e)} />
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[12px] leading-6 text-slate-300">
            <Katex expr="\cup" /> 와 <Katex expr="+" /> 가 닮았다고 그대로 옮겨 쓰면 안 돼요. 집합에서는 <b className="text-white">∪ 도 ∩ 에 분배</b>됩니다!
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 법칙 탐정
// ══════════════════════════════════════════════════════════════
function JudgeTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = JUDGES[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔍 이 등식은 언제나 성립할까요?</p>
          <Chips ids={JUDGES.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          맞히면 두 식의 영역을 겹쳐 보여 줘요. <b className="text-rose-200">빨간 조각</b>은 한쪽에만 들어 있는 — 어긋나는 자리랍니다.
        </p>
      </div>

      <JudgeOne
        key={p.id}
        p={p}
        last={i === JUDGES.length - 1}
        onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))}
        onNext={() => setI((k) => Math.min(JUDGES.length - 1, k + 1))}
      />

      {done.length === JUDGES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 여섯 등식을 모두 판정했어요!</p>
          <p className="mt-1.5 text-[12px] leading-6 text-slate-300">
            괄호는 <b className="text-white">아무 데나 옮길 수 없어요</b>. 헷갈릴 때는 벤 다이어그램의 조각을 하나씩 짚어 보면 금방 알 수 있습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function JudgeOne({ p, last, onDone, onNext }: { p: Judge; last: boolean; onDone: () => void; onNext: () => void }) {
  const [pick, setPick] = useState<boolean | null>(null);
  const d = diffRegions(p.left, p.right);
  const isTrue = d.length === 0;
  const ok = pick !== null && pick === isTrue;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const L = regionsOf(p.left, 3);
  const R = regionsOf(p.right, 3);
  const both = L.filter((m) => R.includes(m));

  return (
    <div className="space-y-3">
      <div className={"rounded-2xl border-2 px-4 py-4 text-center transition " + (ok ? (isTrue ? "border-emerald-400/60 bg-emerald-400/15" : "border-rose-400/55 bg-rose-400/12") : "border-white/10 bg-white/5")}>
        <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-xl text-slate-100">
          <Katex expr={`${exprTex(p.left)} = ${exprTex(p.right)}`} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-3">
            <div className="grid grid-cols-2 gap-2">
              {[true, false].map((v) => {
                const on = pick === v;
                const good = pick !== null && v === isTrue;
                const bad = on && v !== isTrue;
                return (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setPick(v)}
                    disabled={ok}
                    className={
                      "rounded-xl border-2 px-2 py-3 text-sm font-bold transition disabled:cursor-default " +
                      (good
                        ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                        : bad
                          ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    {v ? "⭕ 언제나 성립" : "❌ 성립하지 않음"}
                  </button>
                );
              })}
            </div>
            {pick !== null && !ok ? <p className="mt-2 text-center text-[11px] font-bold text-rose-200">다시 생각해 보세요 — 조각을 하나씩 짚어 볼까요?</p> : null}
          </div>

          {ok ? (
            <>
              <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (isTrue ? "border-emerald-400/55 bg-emerald-400/12" : "border-rose-400/55 bg-rose-400/12")}>
                <p className={"text-base font-extrabold " + (isTrue ? "text-emerald-100" : "text-rose-100")}>{isTrue ? "✅ 언제나 성립해요" : "❌ 성립하지 않아요"}</p>
                {!isTrue ? (
                  <div className="mt-1.5 space-y-1">
                    <p className="text-[11px] font-bold text-rose-200">어긋나는 조각</p>
                    {d.map((m) => (
                      <p key={m} className="rounded-lg bg-black/25 px-2 py-1 text-[11px] text-slate-200">
                        {REGION_NAME[m]}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
              <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {p.tip}</p>
              {!last ? <NextBtn onClick={onNext} /> : null}
            </>
          ) : null}
        </div>

        <div className="space-y-2">
          {ok ? (
            <>
              <div className="overflow-hidden rounded-xl border-2 border-white/10 bg-slate-950/70 p-2">
                <VennPaint n={3} painted={both} bad={d} paintColor="#34d399" />
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-[11px]">
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 font-bold text-emerald-100">초록 — 양쪽 모두</span>
                <span className="rounded-full bg-rose-400/25 px-3 py-1 font-bold text-rose-100">빨강 — 한쪽에만</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[p.left, p.right].map((e, k) => (
                  <div key={k} className="text-center">
                    <div className="overflow-hidden rounded-lg bg-slate-950/70 p-1">
                      <VennPaint n={3} painted={regionsOf(e, 3)} small paintColor={k === 0 ? "#38bdf8" : "#a78bfa"} />
                    </div>
                    <p className="mt-1 overflow-x-auto overflow-y-hidden py-0.5 text-[13px] text-slate-200">
                      <Katex expr={exprTex(e)} />
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 text-center">
              <p className="text-[12px] leading-6 text-slate-500">
                판정하면 두 식의 영역을
                <br />
                겹쳐서 보여 줘요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
