"use client";

import { useEffect, useId, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CARDS,
  COUNTS,
  MINMAXES,
  OPS,
  REGIONS,
  SIM_MAX,
  V2,
  V3,
  coprimePairs,
  hasHangul,
  inter,
  listTex,
  maxInter,
  minInter,
  onlyIn,
  opRegions,
  opResult,
  pairKey,
  slots,
  type Card,
  type CountProblem,
  type MinMax,
  type OpProblem,
  type Region,
  type SetSpec,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "union_vs_inter",
    prompt:
      "합집합과 교집합이 벤 다이어그램에서 각각 어느 자리인지 말로 설명해 보세요. 그리고 일상에서 두 모임의 '합집합'과 '교집합'을 따져 볼 만한 예를 하나 들어 보세요.",
    kind: "text",
    placeholder:
      "예: 교집합은 두 원이 겹치는 자리 하나뿐이고, 합집합은 두 원을 이루는 세 자리 전부다. 예를 들어 우리 반에서 축구부인 학생의 집합과 밴드부인 학생의 집합을 생각하면, 교집합은 두 동아리를 모두 하는 학생이고 합집합은 둘 중 하나라도 하는 학생이다.",
  },
  {
    id: "why_subtract",
    prompt:
      "n(A ∪ B) = n(A) + n(B) − n(A ∩ B) 에서 왜 n(A ∩ B) 를 빼 주어야 하는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: n(A)와 n(B)를 그냥 더하면 두 집합에 모두 들어 있는 원소를 A에서 한 번, B에서 또 한 번 해서 두 번 세게 된다. 실제로는 한 번만 세어야 하므로 두 번 센 만큼인 n(A ∩ B)를 한 번 빼 주어야 한다.",
  },
  {
    id: "min_max_reason",
    prompt:
      "탭④에서 교집합의 원소의 개수가 가장 클 때와 가장 작을 때는 각각 어떤 상황이었나요? 최솟값이 0이 될 수 있는 경우와 그렇지 않은 경우의 차이도 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 작은 집합이 큰 집합에 통째로 들어갈 때 교집합이 가장 커지고, 두 집합이 전체 집합을 가득 채우도록 최대한 벌려 놓을 때 교집합이 가장 작아진다. n(A) + n(B) 가 n(U) 보다 크면 자리가 모자라 반드시 겹치므로 최솟값이 n(A) + n(B) − n(U) 가 되고, n(U) 이하이면 겹치지 않게 놓을 수 있어 최솟값이 0이 된다.",
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

/** 원소나열법 — 한글 원소가 섞이면 KaTeX 로 그릴 수 없어 HTML 로 나타낸다 */
function Listing({ items }: { items: string[] }) {
  if (!items.length) return <Katex expr="\varnothing" />;
  if (!hasHangul(items)) return <Katex expr={listTex(items)} />;
  return (
    <span className="font-semibold">
      <span className="text-slate-400">{"{ "}</span>
      {items.join(", ")}
      <span className="text-slate-400">{" }"}</span>
    </span>
  );
}

function SetHead({ spec, tone = "sky", withItems }: { spec: SetSpec; tone?: "sky" | "violet"; withItems?: boolean }) {
  const col = tone === "sky" ? "text-sky-100" : "text-violet-100";
  const cond = spec.cond || spec.condTex;
  return (
    <div className={"flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[15px] font-semibold " + col}>
      <i className="font-serif italic">{spec.name}</i>
      <span>=</span>
      {cond ? (
        <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5">
          <span className="text-slate-400">{"{"}</span>
          <i className="font-serif italic">x</i>
          <span className="text-slate-400">|</span>
          <span>
            <i className="font-serif italic">x</i>는 {spec.condPre}
            {spec.condTex ? <Katex expr={spec.condTex} /> : null}
            {spec.condPost ?? ""}
            {spec.cond ?? ""}
          </span>
          <span className="text-slate-400">{"}"}</span>
        </span>
      ) : (
        <Listing items={spec.items} />
      )}
      {cond && withItems ? (
        <>
          <span className="text-slate-500">=</span>
          <Listing items={spec.items} />
        </>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 벤 다이어그램 (두 원)
// ══════════════════════════════════════════════════════════════
const A_COL = "#38bdf8";
const B_COL = "#a78bfa";
const PAINT = "#22d3ee";

function circlePath(c: { cx: number; cy: number; r: number }): string {
  return `M${c.cx - c.r},${c.cy} a${c.r},${c.r} 0 1,0 ${2 * c.r},0 a${c.r},${c.r} 0 1,0 ${-2 * c.r},0 Z`;
}

function VChip({ x, y, label }: { x: number; y: number; label: string }) {
  const w = Math.max(36, label.length * 14 + 14);
  return (
    <g pointerEvents="none">
      <rect x={x - w / 2} y={y - 14} width={w} height={28} rx={9} fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.4)" strokeWidth={1.6} />
      <text x={x} y={y + 5} textAnchor="middle" className="fill-white text-[14px] font-bold">
        {label}
      </text>
    </g>
  );
}

function Venn2({
  painted,
  onToggle,
  items,
  showU,
  outside,
  children,
}: {
  painted?: Region[];
  onToggle?: (r: Region) => void;
  items?: Record<Region, string[]>;
  showU?: boolean;
  outside?: number | null;
  children?: React.ReactNode;
}) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, "");
  const on = (r: Region) => (painted ?? []).includes(r);
  const fillOf = (r: Region) => (on(r) ? `${PAINT}55` : "rgba(255,255,255,0.02)");
  const H = showU ? V2.h + 26 : V2.h;

  return (
    <svg viewBox={`0 0 ${V2.w} ${H}`} className="mx-auto block w-full max-w-[520px] select-none" role="img" aria-label="벤 다이어그램">
      <defs>
        <clipPath id={`${u}outB`}>
          <path d={`M0,0 H${V2.w} V${H} H0 Z ${circlePath(V2.b)}`} clipRule="evenodd" />
        </clipPath>
        <clipPath id={`${u}outA`}>
          <path d={`M0,0 H${V2.w} V${H} H0 Z ${circlePath(V2.a)}`} clipRule="evenodd" />
        </clipPath>
        <clipPath id={`${u}inA`}>
          <circle cx={V2.a.cx} cy={V2.a.cy} r={V2.a.r} />
        </clipPath>
      </defs>

      {showU ? (
        <>
          <rect x={6} y={16} width={V2.w - 12} height={H - 26} rx={14} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.28)" strokeWidth={2.5} />
          <text x={26} y={40} className="fill-slate-300 font-serif text-[17px] font-bold italic">
            U
          </text>
        </>
      ) : null}

      <g clipPath={`url(#${u}outB)`}>
        <circle cx={V2.a.cx} cy={V2.a.cy} r={V2.a.r} fill={fillOf("A")} onClick={onToggle ? () => onToggle("A") : undefined} className={onToggle ? "cursor-pointer" : undefined} />
      </g>
      <g clipPath={`url(#${u}outA)`}>
        <circle cx={V2.b.cx} cy={V2.b.cy} r={V2.b.r} fill={fillOf("B")} onClick={onToggle ? () => onToggle("B") : undefined} className={onToggle ? "cursor-pointer" : undefined} />
      </g>
      <g clipPath={`url(#${u}inA)`}>
        <circle
          cx={V2.b.cx}
          cy={V2.b.cy}
          r={V2.b.r}
          fill={fillOf("both")}
          onClick={onToggle ? () => onToggle("both") : undefined}
          className={onToggle ? "cursor-pointer" : undefined}
        />
      </g>

      <circle cx={V2.a.cx} cy={V2.a.cy} r={V2.a.r} fill="none" stroke={A_COL} strokeWidth={3} pointerEvents="none" />
      <circle cx={V2.b.cx} cy={V2.b.cy} r={V2.b.r} fill="none" stroke={B_COL} strokeWidth={3} pointerEvents="none" />
      <text x={118} y={V2.a.cy - V2.a.r + 28} textAnchor="middle" fill={A_COL} className="font-serif text-[20px] font-bold italic" pointerEvents="none">
        A
      </text>
      <text x={342} y={V2.b.cy - V2.b.r + 28} textAnchor="middle" fill={B_COL} className="font-serif text-[20px] font-bold italic" pointerEvents="none">
        B
      </text>

      {items
        ? REGIONS.flatMap((rg) => {
            const xs = items[rg] ?? [];
            if (!xs.length) return [];
            return slots(V2.anchor[rg], xs.length, 46, 32).map((p, i) => <VChip key={`${rg}${i}`} x={p.x} y={p.y} label={xs[i]} />);
          })
        : null}

      {outside !== undefined && outside !== null ? (
        <text x={414} y={H - 38} textAnchor="middle" className={"font-mono text-[17px] font-bold " + (outside < 0 ? "fill-rose-300" : "fill-slate-300")} pointerEvents="none">
          {outside}
        </text>
      ) : null}

      {children}
    </svg>
  );
}

function RegionCount({ r, n, tone }: { r: Region; n: number; tone?: string }) {
  const p = V2.anchor[r];
  return (
    <text x={p.x} y={p.y + 9} textAnchor="middle" className={"font-mono text-[26px] font-extrabold " + (tone ?? "fill-white")} pointerEvents="none">
      {n}
    </text>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
type Tab = "op" | "coprime" | "count" | "minmax";

export default function UnionIntersectionLab() {
  const [tab, setTab] = useState<Tab>("op");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔗 합집합과 교집합</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-cyan-200">겹치는 자리</b>가 교집합, <b className="text-cyan-200">두 원 전체</b>가 합집합이에요. 영역을 칠해 보고, 서로소인 짝을 찾고, 겹침을 움직이며{" "}
          <b className="text-amber-200">원소의 개수</b>가 어떻게 달라지는지 살펴봅시다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "op"} onClick={() => setTab("op")}>
          ① 영역 색칠 🎨
        </TabButton>
        <TabButton active={tab === "coprime"} onClick={() => setTab("coprime")}>
          ② 서로소 짝짓기 🚫
        </TabButton>
        <TabButton active={tab === "count"} onClick={() => setTab("count")}>
          ③ 개수 계산기 🧮
        </TabButton>
        <TabButton active={tab === "minmax"} onClick={() => setTab("minmax")}>
          ④ 최대와 최소 🎚️
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "op" ? <OpTab /> : null}
        {tab === "coprime" ? <CoprimeTab /> : null}
        {tab === "count" ? <CountTab /> : null}
        {tab === "minmax" ? <MinMaxTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 영역 색칠
// ══════════════════════════════════════════════════════════════
function OpTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = OPS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎨 알맞은 영역을 눌러 칠하세요</p>
          <Chips ids={OPS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <Katex expr="A \cap B" /> — <b className="text-white">A와 B 모두에</b> 속하는 원소
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <Katex expr="A \cup B" /> — <b className="text-white">A 또는 B에</b> 속하는 원소
          </p>
        </div>
      </div>

      <OpOne
        key={p.id}
        p={p}
        last={i === OPS.length - 1}
        onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))}
        onNext={() => setI((k) => Math.min(OPS.length - 1, k + 1))}
      />

      {done.length === OPS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 칠했어요!</p>
          <p className="mt-1.5 text-[12px] leading-6 text-slate-300">
            합집합을 칠할 때 <b className="text-amber-200">겹치는 자리</b>를 빠뜨리지 않는 것, 원소나열법에서 겹치는 원소를 <b className="text-white">한 번만</b> 쓰는 것을 꼭 기억해요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function OpOne({ p, last, onDone, onNext }: { p: OpProblem; last: boolean; onDone: () => void; onNext: () => void }) {
  const [painted, setPainted] = useState<Region[]>([]);
  const want = opRegions(p.op);
  const ok = want.length === painted.length && want.every((r) => painted.includes(r));
  const res = opResult(p);

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const items: Record<Region, string[]> = {
    A: onlyIn(p.A.items, p.B.items),
    both: inter(p.A.items, p.B.items),
    B: onlyIn(p.B.items, p.A.items),
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-white/10 bg-white/5 p-3">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1">
          <SetHead spec={p.A} tone="sky" withItems />
          <SetHead spec={p.B} tone="violet" withItems />
        </div>
      </div>

      <div className={"rounded-2xl border-2 px-4 py-3 text-center transition " + (ok ? "border-emerald-400/60 bg-emerald-400/15" : "border-cyan-400/40 bg-cyan-400/[0.07]")}>
        <p className="text-sm font-bold text-slate-100">
          🎯 <Katex expr={p.op === "union" ? "A \\cup B" : "A \\cap B"} /> 를 나타내는 영역을 모두 칠하세요
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={"overflow-hidden rounded-xl border-2 bg-slate-950/70 p-2 transition " + (ok ? "border-emerald-400/50" : "border-white/10")}>
          <Venn2 painted={painted} onToggle={(r) => setPainted((s) => (s.includes(r) ? s.filter((x) => x !== r) : [...s, r]))} items={items} />
          <p className="mt-1 text-center text-[11px] text-slate-400">👆 세 영역을 눌러 켜고 끌 수 있어요</p>
        </div>

        <div className="space-y-3">
          <div className={"rounded-2xl border-2 p-4 text-center transition " + (ok ? "border-emerald-400/55 bg-emerald-400/12" : "border-white/10 bg-white/5")}>
            <p className="text-[11px] font-bold text-slate-400">칠한 영역이 나타내는 집합</p>
            <div className="mt-2 min-h-[2rem] text-lg text-slate-100">
              {painted.length ? (
                <Listing
                  items={[...(painted.includes("A") ? items.A : []), ...(painted.includes("both") ? items.both : []), ...(painted.includes("B") ? items.B : [])]}
                />
              ) : (
                <span className="font-mono text-sm text-slate-500">아직 칠하지 않았어요</span>
              )}
            </div>
            <p className={"mt-2 text-[12px] font-bold " + (ok ? "text-emerald-200" : "text-slate-400")}>
              {ok ? "✅ 알맞게 칠했어요!" : painted.length ? "아직 알맞은 영역이 아니에요" : "영역을 눌러 보세요"}
            </p>
          </div>

          {ok ? (
            <>
              <div className="rounded-2xl border-2 border-emerald-400/55 bg-emerald-400/12 px-4 py-3 text-center">
                <div className="flex flex-wrap items-center justify-center gap-2 text-lg text-emerald-100">
                  <Katex expr={p.op === "union" ? "A \\cup B" : "A \\cap B"} />
                  <span>=</span>
                  <Listing items={res} />
                </div>
              </div>
              <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {p.tip}</p>
              {!last ? <NextBtn onClick={onNext} /> : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 서로소 짝짓기
// ══════════════════════════════════════════════════════════════
function CoprimeTab() {
  const [sel, setSel] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [miss, setMiss] = useState(0);

  const targets = coprimePairs();
  const cleared = found.length === targets.length;
  const cardOf = (k: string) => CARDS.find((c) => c.key === k) as Card;

  const pair = sel.length === 2 ? [cardOf(sel[0]), cardOf(sel[1])] : null;
  const common = pair ? inter(pair[0].items, pair[1].items) : [];
  const isCo = pair ? common.length === 0 : false;
  const key = pair ? pairKey(sel[0], sel[1]) : "";
  const already = found.includes(key);

  function tap(k: string) {
    if (cleared) return;
    if (sel.includes(k)) {
      setSel(sel.filter((x) => x !== k));
      return;
    }
    if (sel.length >= 2) {
      setSel([k]);
      return;
    }
    const next = [...sel, k];
    setSel(next);
    if (next.length === 2) {
      const a = cardOf(next[0]);
      const b = cardOf(next[1]);
      if (inter(a.items, b.items).length === 0) {
        const kk = pairKey(next[0], next[1]);
        setFound((s) => (s.includes(kk) ? s : [...s, kk]));
      } else {
        setMiss((m) => m + 1);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🚫 서로소인 두 집합의 짝을 모두 찾으세요</p>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
          두 집합에 공통인 원소가 없을 때, 즉 <Katex expr="A \cap B = \varnothing" /> 일 때 두 집합은 <b className="text-amber-200">서로소</b>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CARDS.map((c) => {
            const on = sel.includes(c.key);
            const bad = on && pair !== null && !isCo;
            const good = on && pair !== null && isCo;
            const used = found.some((f) => f.includes(c.key));
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => tap(c.key)}
                disabled={cleared}
                className={
                  "rounded-2xl border-2 p-3 text-center transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20"
                      : on
                        ? "border-cyan-400/70 bg-cyan-400/20"
                        : used
                          ? "border-emerald-400/30 bg-emerald-400/[0.07] hover:bg-emerald-400/15"
                          : "border-white/12 bg-white/5 hover:bg-white/10")
                }
              >
                <p className="font-serif text-lg font-bold italic text-slate-100">{c.key}</p>
                <p className="mt-0.5 text-[10px] leading-4 text-slate-400">{c.cond}</p>
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  {c.items.map((x) => (
                    <span
                      key={x}
                      className={
                        "rounded-md px-1.5 py-0.5 font-mono text-[12px] font-bold " +
                        (pair && common.includes(x) && on ? "bg-rose-400/40 text-rose-50" : "bg-black/35 text-slate-200")
                      }
                    >
                      {x}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <div
            className={
              "rounded-2xl border-2 px-4 py-3 text-center transition " +
              (!pair ? "border-white/10 bg-white/5" : isCo ? "border-emerald-400/60 bg-emerald-400/15" : "border-rose-400/60 bg-rose-400/15")
            }
          >
            {!pair ? (
              <p className="text-[12px] leading-6 text-slate-400">
                카드 두 장을 골라 보세요
                <br />
                교집합이 공집합이면 서로소예요
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-center gap-2 text-lg text-slate-100">
                  <Katex expr={`${sel[0]} \\cap ${sel[1]} =`} />
                  <Listing items={common} />
                </div>
                <p className={"mt-1 text-sm font-extrabold " + (isCo ? "text-emerald-200" : "text-rose-200")}>
                  {isCo ? (already ? "✅ 서로소 — 이미 찾은 짝이에요" : "✅ 서로소예요!") : `❌ 공통인 원소 ${common.join(", ")} 이(가) 있어요`}
                </p>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <p className={"text-center text-sm font-extrabold " + (cleared ? "text-emerald-200" : "text-slate-300")}>
              {cleared ? "🎉 서로소인 짝을 모두 찾았어요!" : `찾은 짝 ${found.length} / ${targets.length}`}
              {miss > 0 ? <span className="ml-2 text-[11px] font-normal text-rose-300">헛짚음 {miss}회</span> : null}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {targets.map((t, i) => (
                <div
                  key={t}
                  className={
                    "rounded-lg border-2 px-1 py-1.5 text-center font-serif text-sm font-bold italic transition " +
                    (found.includes(t) ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" : "border-dashed border-white/15 bg-white/[0.03] text-slate-600")
                  }
                >
                  {found.includes(t) ? `${t[0]} · ${t[1]}` : `? ${i + 1}`}
                </div>
              ))}
            </div>
          </div>

          {cleared ? (
            <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-3 text-center">
              <p className="text-[12px] leading-7 text-slate-200">
                전체 <b className="text-white">{(CARDS.length * (CARDS.length - 1)) / 2}쌍</b> 가운데 서로소는 <b className="text-emerald-200">{targets.length}쌍</b>이었어요.
              </p>
              <p className="mt-1 text-[12px] leading-7 text-slate-300">
                한편 <Katex expr="A \cap \varnothing = \varnothing" /> 이므로 <b className="text-amber-200">공집합은 모든 집합과 서로소</b>랍니다.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSel([])}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 고른 카드 지우기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 개수 계산기
// ══════════════════════════════════════════════════════════════
function CountTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = COUNTS[i];

  return (
    <div className="space-y-4">
      <Simulator />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧮 개수를 구해 적어 보세요</p>
          <Chips ids={COUNTS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
      </div>

      <CountOne
        key={p.id}
        p={p}
        last={i === COUNTS.length - 1}
        onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))}
        onNext={() => setI((k) => Math.min(COUNTS.length - 1, k + 1))}
      />
    </div>
  );
}

function Simulator() {
  const [nA, setNA] = useState(7);
  const [nB, setNB] = useState(6);
  const [t, setT] = useState(3);
  const tt = Math.min(t, nA, nB);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <p className="text-sm font-bold text-slate-100">🎛️ 겹침을 움직이며 공식을 찾아보세요</p>
      <div className="mt-2 grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 p-2">
          <Venn2 painted={["A", "both", "B"]}>
            <RegionCount r="A" n={nA - tt} tone="fill-sky-200" />
            <RegionCount r="both" n={tt} tone="fill-emerald-200" />
            <RegionCount r="B" n={nB - tt} tone="fill-violet-200" />
          </Venn2>
        </div>
        <div className="space-y-2">
          {[
            { label: "n(A)", v: nA, set: setNA, max: SIM_MAX, col: "accent-sky-400" },
            { label: "n(B)", v: nB, set: setNB, max: SIM_MAX, col: "accent-violet-400" },
            { label: "n(A ∩ B)", v: tt, set: setT, max: Math.min(nA, nB), col: "accent-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-2">
              <span className="w-20 shrink-0 font-mono text-[12px] font-bold text-slate-300">{s.label}</span>
              <input
                type="range"
                min={0}
                max={s.max}
                step={1}
                value={s.v}
                aria-label={s.label}
                onChange={(e) => s.set(Number(e.target.value))}
                className={"h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 " + s.col}
              />
              <span className="w-8 shrink-0 text-right font-mono text-base font-extrabold text-white">{s.v}</span>
            </div>
          ))}
          <div className="rounded-xl border-2 border-cyan-400/40 bg-cyan-400/[0.08] px-3 py-3 text-center">
            <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-cyan-100">
              <Katex expr={`n(A \\cup B) = ${nA} + ${nB} - ${tt} = ${nA + nB - tt}`} />
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-300">
              겹치는 <b className="text-emerald-200">{tt}</b>개를 두 번 세지 않도록 한 번 빼 줘요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Venn3({ p }: { p: CountProblem }) {
  const abc = p.nABC ?? 0;
  const ab = (p.nAB ?? 0) - abc;
  const bc = (p.nBC ?? 0) - abc;
  const ac = (p.nAC ?? 0) - abc;
  const a = p.nA - ab - ac - abc;
  const b = p.nB - ab - bc - abc;
  const c = (p.nC ?? 0) - ac - bc - abc;
  const cells: { k: keyof typeof V3.anchor; v: number; col: string }[] = [
    { k: "A", v: a, col: "fill-sky-200" },
    { k: "B", v: b, col: "fill-violet-200" },
    { k: "C", v: c, col: "fill-amber-200" },
    { k: "AB", v: ab, col: "fill-slate-100" },
    { k: "AC", v: ac, col: "fill-slate-100" },
    { k: "BC", v: bc, col: "fill-slate-100" },
    { k: "ABC", v: abc, col: "fill-emerald-200" },
  ];
  const circles: { c: { cx: number; cy: number; r: number }; col: string; label: string; lx: number; ly: number }[] = [
    { c: V3.a, col: A_COL, label: "A", lx: 230, ly: 40 },
    { c: V3.b, col: B_COL, label: "B", lx: 104, ly: 268 },
    { c: V3.c, col: "#fbbf24", label: "C", lx: 356, ly: 268 },
  ];
  return (
    <svg viewBox={`0 0 ${V3.w} ${V3.h}`} className="mx-auto block w-full max-w-[440px] select-none" role="img" aria-label="세 집합 벤 다이어그램">
      {circles.map((x) => (
        <g key={x.label}>
          <circle cx={x.c.cx} cy={x.c.cy} r={x.c.r} fill={`${x.col}12`} stroke={x.col} strokeWidth={2.5} />
          <text x={x.lx} y={x.ly} textAnchor="middle" fill={x.col} className="font-serif text-[18px] font-bold italic">
            {x.label}
          </text>
        </g>
      ))}
      {cells.map((x) => (
        <text key={x.k} x={V3.anchor[x.k].x} y={V3.anchor[x.k].y + 7} textAnchor="middle" className={"font-mono text-[19px] font-extrabold " + x.col}>
          {x.v}
        </text>
      ))}
    </svg>
  );
}

function CountOne({ p, last, onDone, onNext }: { p: CountProblem; last: boolean; onDone: () => void; onNext: () => void }) {
  const [val, setVal] = useState("");
  const [tried, setTried] = useState<number | null>(null);
  const ok = tried === p.answer;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const askTex = p.find === "inter" ? "n(A \\cap B)" : p.find === "union3" ? "n(A \\cup B \\cup C)" : "n(A \\cup B)";
  const givens: string[] =
    p.find === "union3"
      ? [
          `n(A) = ${p.nA}`,
          `n(B) = ${p.nB}`,
          `n(C) = ${p.nC}`,
          `n(A \\cap B) = ${p.nAB}`,
          `n(B \\cap C) = ${p.nBC}`,
          `n(A \\cap C) = ${p.nAC}`,
          `n(A \\cap B \\cap C) = ${p.nABC}`,
        ]
      : p.find === "inter"
        ? [`n(A) = ${p.nA}`, `n(B) = ${p.nB}`, `n(A \\cup B) = ${p.nAuB}`]
        : p.disjoint
          ? [`n(A) = ${p.nA}`, `n(B) = ${p.nB}`, `A \\cap B = \\varnothing`]
          : [`n(A) = ${p.nA}`, `n(B) = ${p.nB}`, `n(A \\cap B) = ${p.nAB}`];

  const solveTex =
    p.find === "union3"
      ? `${p.nA} + ${p.nB} + ${p.nC} - ${p.nAB} - ${p.nBC} - ${p.nAC} + ${p.nABC} = ${p.answer}`
      : p.find === "inter"
        ? `${p.nA} + ${p.nB} - ${p.nAuB} = ${p.answer}`
        : `${p.nA} + ${p.nB} - ${p.nAB ?? 0} = ${p.answer}`;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className={"rounded-2xl border-2 p-4 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/12" : "border-sky-400/40 bg-sky-400/[0.07]")}>
          {p.story ? <p className="text-[13px] leading-7 text-slate-200">{p.story}</p> : null}
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {givens.map((g) => (
              <span key={g} className="rounded-lg bg-black/30 px-3 py-1.5 text-slate-100">
                <Katex expr={g} />
              </span>
            ))}
          </div>
          {p.labelA ? (
            <p className="mt-2 text-center text-[11px] text-slate-400">
              A = {p.labelA}을(를) 좋아하는 학생 · B = {p.labelB}을(를) 좋아하는 학생
            </p>
          ) : null}
          <p className="mt-3 text-center text-base font-bold text-slate-100">
            <Katex expr={askTex} /> 는?
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={val}
              aria-label="원소의 개수"
              disabled={ok}
              onChange={(e) => setVal(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && val) setTried(Number(val));
              }}
              placeholder="개수"
              className="w-32 rounded-xl border-2 border-white/15 bg-slate-950 px-3 py-2 text-center font-mono text-lg font-bold text-white outline-none focus:border-cyan-400/70 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setTried(val ? Number(val) : null)}
              disabled={ok || !val}
              className="rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25 disabled:opacity-40"
            >
              확인
            </button>
          </div>
          {tried !== null && !ok ? <p className="mt-2 text-center text-[12px] font-bold text-rose-200">{tried}은(는) 아니에요 — 두 번 센 부분이 없는지 살펴볼까요?</p> : null}
        </div>
      </div>

      <div className="space-y-3">
        {ok ? (
          <>
            <div className="overflow-hidden rounded-xl border-2 border-emerald-400/50 bg-slate-950/70 p-2">
              {p.find === "union3" ? (
                <Venn3 p={p} />
              ) : (
                <Venn2 painted={["A", "both", "B"]}>
                  <RegionCount r="A" n={p.find === "inter" ? p.nA - p.answer : p.nA - (p.nAB ?? 0)} tone="fill-sky-200" />
                  <RegionCount r="both" n={p.find === "inter" ? p.answer : (p.nAB ?? 0)} tone="fill-emerald-200" />
                  <RegionCount r="B" n={p.find === "inter" ? p.nB - p.answer : p.nB - (p.nAB ?? 0)} tone="fill-violet-200" />
                </Venn2>
              )}
            </div>
            <div className="rounded-2xl border-2 border-emerald-400/55 bg-emerald-400/12 px-4 py-3 text-center">
              <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-emerald-100">
                <Katex expr={solveTex} />
              </div>
            </div>
            <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {p.tip}</p>
            {!last ? <NextBtn onClick={onNext} /> : null}
          </>
        ) : (
          <div className="space-y-2">
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
              <p className="text-[11px] font-bold text-slate-400">쓸 수 있는 식</p>
              <div className="mt-1.5 flex flex-col items-center gap-1.5 text-slate-200">
                <span className="overflow-x-auto overflow-y-hidden py-0.5">
                  <Katex expr="n(A \cup B) = n(A) + n(B) - n(A \cap B)" />
                </span>
                {p.find === "union3" ? (
                  <span className="overflow-x-auto overflow-y-hidden py-0.5 text-[13px]">
                    <Katex expr="n(A \cup B \cup C) = n(A)+n(B)+n(C)-n(A \cap B)-n(B \cap C)-n(A \cap C)+n(A \cap B \cap C)" />
                  </span>
                ) : null}
                {p.disjoint ? (
                  <span>
                    <Katex expr="A \cap B = \varnothing \;\Rightarrow\; n(A \cup B) = n(A) + n(B)" />
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex min-h-[6rem] items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 text-center">
              <p className="text-[12px] leading-6 text-slate-500">맞히면 벤 다이어그램에 개수가 채워져요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 최대와 최소
// ══════════════════════════════════════════════════════════════
function MinMaxTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = MINMAXES[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎚️ 겹침을 움직여 가능한 범위를 찾으세요</p>
          <Chips ids={MINMAXES.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          두 집합은 모두 전체 집합 <span className="font-serif italic text-slate-100">U</span> 안에 있어야 해요. 겹침을 줄이면 <Katex expr="A \cup B" /> 가 커지는데, 전체보다 커질
          수는 없답니다.
        </p>
      </div>

      <MinMaxOne
        key={p.id}
        p={p}
        last={i === MINMAXES.length - 1}
        onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))}
        onNext={() => setI((k) => Math.min(MINMAXES.length - 1, k + 1))}
      />

      {done.length === MINMAXES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 세 문제를 모두 풀었어요!</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-black/25 px-3 py-2">
              <p className="text-xs font-bold text-emerald-200">최댓값</p>
              <p className="mt-1 text-[12px] leading-6 text-slate-300">작은 집합이 큰 집합에 통째로 들어갈 때</p>
              <div className="mt-1 flex justify-center text-slate-100">
                <Katex expr="\min\{\,n(A),\; n(B)\,\}" />
              </div>
            </div>
            <div className="rounded-xl bg-black/25 px-3 py-2">
              <p className="text-xs font-bold text-amber-200">최솟값</p>
              <p className="mt-1 text-[12px] leading-6 text-slate-300">두 집합이 전체를 가득 채울 때 (음수가 되면 0)</p>
              <div className="mt-1 flex justify-center text-slate-100">
                <Katex expr="n(A) + n(B) - n(U)" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MinMaxOne({ p, last, onDone, onNext }: { p: MinMax; last: boolean; onDone: () => void; onNext: () => void }) {
  const cap = Math.min(p.nA, p.nB);
  const [t, setT] = useState(cap);
  const [seen, setSeen] = useState<number[]>([cap]);
  const [hi, setHi] = useState("");
  const [lo, setLo] = useState("");
  const [tried, setTried] = useState(false);

  const ansHi = maxInter(p);
  const ansLo = minInter(p);
  const okHi = Number(hi) === ansHi && hi !== "";
  const okLo = Number(lo) === ansLo && lo !== "";
  const ok = okHi && okLo;

  const nAuB = p.nA + p.nB - t;
  const out = p.nU - nAuB;
  const fits = out >= 0;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function move(v: number) {
    setT(v);
    setSeen((s) => (s.includes(v) ? s : [...s, v]));
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-violet-400/40 bg-violet-400/[0.08] p-4">
        <p className="text-[13px] leading-7 text-slate-200">{p.story}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {[`n(U) = ${p.nU}`, `n(A) = ${p.nA}`, `n(B) = ${p.nB}`].map((g) => (
            <span key={g} className="rounded-lg bg-black/30 px-3 py-1.5 text-slate-100">
              <Katex expr={g} />
            </span>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          A = {p.labelA} · B = {p.labelB}
        </p>
        <p className="mt-2 text-center text-sm font-bold text-violet-100">
          🎯 <Katex expr="n(A \cap B)" /> 의 최댓값과 최솟값은?
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={"overflow-hidden rounded-xl border-2 bg-slate-950/70 p-2 transition " + (fits ? "border-white/10" : "border-rose-500/60")}>
          <Venn2 painted={["A", "both", "B"]} showU outside={out}>
            <RegionCount r="A" n={p.nA - t} tone="fill-sky-200" />
            <RegionCount r="both" n={t} tone="fill-emerald-200" />
            <RegionCount r="B" n={p.nB - t} tone="fill-violet-200" />
          </Venn2>
          <p className={"mt-1 text-center text-[12px] font-bold " + (fits ? "text-slate-300" : "text-rose-300")}>
            {fits ? `U 안에 남는 사람 ${out}명 — 가능해요` : `U 밖으로 ${-out}명이 넘쳐요 — 불가능!`}
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <div className="flex items-center gap-3">
              <span className="shrink-0 font-mono text-[12px] font-bold text-slate-300">n(A ∩ B)</span>
              <input
                type="range"
                min={0}
                max={cap}
                step={1}
                value={t}
                aria-label="교집합의 원소의 개수"
                onChange={(e) => move(Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-emerald-400"
              />
              <span className="w-8 shrink-0 text-right font-mono text-base font-extrabold text-white">{t}</span>
            </div>
            <div className="mt-2 flex justify-center overflow-x-auto overflow-y-hidden py-1 text-slate-100">
              <Katex expr={`n(A \\cup B) = ${p.nA} + ${p.nB} - ${t} = ${nAuB}`} />
            </div>
            <p className="mt-1 text-center text-[11px] text-slate-400">
              살펴본 값 {seen.length} / {cap + 1}
            </p>
            <div className="mt-1.5 flex flex-wrap justify-center gap-1">
              {Array.from({ length: cap + 1 }, (_, k) => {
                const okK = p.nA + p.nB - k <= p.nU;
                const visited = seen.includes(k);
                return (
                  <span
                    key={k}
                    className={
                      "h-5 w-6 rounded text-center font-mono text-[10px] font-bold leading-5 " +
                      (!visited ? "bg-white/8 text-slate-600" : okK ? "bg-emerald-400/30 text-emerald-100" : "bg-rose-400/30 text-rose-100")
                    }
                  >
                    {k}
                  </span>
                );
              })}
            </div>
          </div>

          <div className={"rounded-2xl border-2 p-4 transition " + (ok ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
            <div className="grid grid-cols-2 gap-2">
              {[
                { k: "최댓값", v: hi, set: setHi, good: okHi },
                { k: "최솟값", v: lo, set: setLo, good: okLo },
              ].map((f) => (
                <div key={f.k}>
                  <p className="text-center text-[11px] font-bold text-slate-400">{f.k}</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={f.v}
                    aria-label={f.k}
                    disabled={ok}
                    onChange={(e) => f.set(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                    className={
                      "mt-1 w-full rounded-xl border-2 bg-slate-950 px-3 py-2 text-center font-mono text-lg font-bold text-white outline-none disabled:opacity-70 " +
                      (tried ? (f.good ? "border-emerald-400/70" : "border-rose-400/70") : "border-white/15 focus:border-cyan-400/70")
                    }
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTried(true)}
              disabled={ok || !hi || !lo}
              className="mt-2 w-full rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25 disabled:opacity-40"
            >
              확인
            </button>
            {tried && !ok ? <p className="mt-1.5 text-center text-[12px] font-bold text-rose-200">슬라이더를 끝까지 움직여 가능한 값을 더 살펴볼까요?</p> : null}
          </div>

          {ok ? (
            <>
              <div className="rounded-2xl border-2 border-emerald-400/55 bg-emerald-400/12 px-4 py-3 text-center">
                <div className="flex flex-col items-center gap-1 text-[15px] text-emerald-100">
                  <Katex expr={`\\text{max} = \\min\\{${p.nA},\\; ${p.nB}\\} = ${ansHi}`} />
                  <Katex expr={ansLo === 0 ? `${p.nA} + ${p.nB} - ${p.nU} = ${p.nA + p.nB - p.nU} < 0 \\;\\Rightarrow\\; \\text{min} = 0` : `\\text{min} = ${p.nA} + ${p.nB} - ${p.nU} = ${ansLo}`} />
                </div>
              </div>
              <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {p.tip}</p>
              {!last ? <NextBtn onClick={onNext} /> : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
