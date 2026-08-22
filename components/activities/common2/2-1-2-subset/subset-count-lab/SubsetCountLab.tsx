"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  COUNTS,
  HUNTS,
  MISSIONS,
  N_MAX,
  N_MIN,
  SW_META,
  TREE_ITEMS,
  allPaths,
  chosenItems,
  huntCount,
  huntOk,
  listTex,
  pathKey,
  pow2,
  subsetOf,
  type CountProblem,
  type HuntRound,
  type Mission,
  type Sw,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_two_power",
    prompt:
      "탭①의 갈림길 나무를 떠올리며, 원소가 n개인 집합의 부분집합이 왜 2ⁿ개인지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 부분집합을 만들 때 원소 하나하나에 대하여 '넣는다'와 '넣지 않는다' 두 가지 갈래가 생긴다. 원소가 n개면 이 두 갈래가 n번 이어지므로 2를 n번 곱한 2ⁿ가지 경우가 생기고, 각 경우가 서로 다른 부분집합 하나를 만들기 때문에 부분집합은 2ⁿ개다.",
  },
  {
    id: "fixed_elements",
    prompt:
      "특정 원소를 반드시 포함하게 하거나 반드시 빼면 왜 부분집합의 개수가 줄어드는지, 탭②의 스위치를 떠올려 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 못 박은 원소는 넣을지 말지 고를 수 없어 갈래가 하나뿐이므로 곱해지는 수가 2가 아니라 1이 된다. 그래서 넣기로 k개, 빼기로 l개를 못 박으면 갈래가 남은 원소는 n − k − l 개가 되어 부분집합의 개수는 2^(n−k−l) 이 된다.",
  },
  {
    id: "min_value",
    prompt:
      "「원소의 최솟값이 3이다」 같은 조건은 어떻게 '반드시 넣기'와 '반드시 빼기'로 바꾸어 생각할 수 있나요? 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 가장 작은 원소가 3이라는 것은 3이 반드시 들어 있고, 3보다 작은 1과 2는 절대 들어 있으면 안 된다는 뜻이다. 그래서 3은 넣기로, 1과 2는 빼기로 못 박고 나머지 원소만 자유롭게 두면 된다.",
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

/** 원소마다 「자유 / 넣기 / 빼기」와 곱해지는 수를 보여 주는 띠 */
function SwitchStrip({ items, state, onCycle }: { items: string[]; state: Sw[]; onCycle?: (i: number) => void }) {
  const free = state.filter((s) => s === 0).length;
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto overflow-y-hidden py-1">
        <div className="flex min-w-max justify-center gap-1.5">
          {items.map((x, i) => {
            const m = SW_META[state[i]];
            const body = (
              <>
                <p className="text-[13px] font-bold text-slate-100">{x}</p>
                <p className="text-[15px] font-bold leading-5" style={{ color: m.color }}>
                  {m.mark}
                </p>
                <p className="mt-0.5 rounded bg-black/35 font-mono text-[13px] font-extrabold text-white">{state[i] === 0 ? "2" : "1"}</p>
              </>
            );
            const cls = "w-[74px] rounded-xl border-2 px-1 py-1.5 text-center transition";
            return onCycle ? (
              <button key={x} type="button" onClick={() => onCycle(i)} className={cls + " hover:brightness-125"} style={{ borderColor: `${m.color}99`, background: `${m.color}1a` }}>
                {body}
              </button>
            ) : (
              <div key={x} className={cls} style={{ borderColor: `${m.color}99`, background: `${m.color}1a` }}>
                {body}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-slate-100">
        <Katex expr={`${state.map((s) => (s === 0 ? "2" : "1")).join(" \\times ")} = 2^{${free}} = ${pow2(free)}`} />
      </div>
    </div>
  );
}

function SwLegend() {
  return (
    <div className="grid gap-1.5 sm:grid-cols-3">
      {SW_META.map((m, i) => (
        <p key={i} className="rounded-lg bg-black/25 px-2 py-1.5 text-center text-[11px] leading-5" style={{ color: m.color }}>
          <b>
            {m.mark} {m.label}
          </b>
          <br />
          <span className="text-slate-400">{m.hint}</span>
        </p>
      ))}
    </div>
  );
}

function stateFrom(items: string[], must: string[], ban: string[]): Sw[] {
  return items.map((x) => (must.includes(x) ? 1 : ban.includes(x) ? 2 : 0));
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
type Tab = "tree" | "switch" | "count" | "hunt";

export default function SubsetCountLab() {
  const [tab, setTab] = useState<Tab>("tree");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔢 부분집합의 개수</h3>
        <p className="mt-2 leading-7 text-slate-300">
          원소 하나하나가 <b className="text-emerald-200">넣기 ○</b> 와 <b className="text-rose-200">빼기 ×</b> 두 갈래로 갈라져요. 갈림길을 따라 걸어 보고, 스위치를 못 박아 보며{" "}
          <b className="text-amber-200">부분집합의 개수</b>를 스스로 세어 봅시다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "tree"} onClick={() => setTab("tree")}>
          ① 갈림길 나무 🌳
        </TabButton>
        <TabButton active={tab === "switch"} onClick={() => setTab("switch")}>
          ② 스위치 계산기 🎚️
        </TabButton>
        <TabButton active={tab === "count"} onClick={() => setTab("count")}>
          ③ 개수 맞히기 🧮
        </TabButton>
        <TabButton active={tab === "hunt"} onClick={() => setTab("hunt")}>
          ④ 부분집합 사냥 🎯
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "tree" ? <TreeTab /> : null}
        {tab === "switch" ? <SwitchTab /> : null}
        {tab === "count" ? <CountTab /> : null}
        {tab === "hunt" ? <HuntTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 갈림길 나무
// ══════════════════════════════════════════════════════════════
const N = TREE_ITEMS.length;
const TOP = 58;
const STEP = 50;
const COL = [110, 250, 390];
const TW = 660;
const TH = 440;

function nodeY(choices: number[]): number {
  const base = choices.reduce((s, c, i) => s + (1 - c) * 2 ** (N - 1 - i), 0);
  const span = 2 ** (N - choices.length);
  return TOP + (base + (span - 1) / 2) * STEP;
}
function nodesAt(level: number): number[][] {
  const out: number[][] = [];
  const go = (cur: number[]) => {
    if (cur.length === level) {
      out.push(cur);
      return;
    }
    go([...cur, 1]);
    go([...cur, 0]);
  };
  go([]);
  return out;
}

function TreeTab() {
  const [path, setPath] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);

  const leaves = allPaths(N);
  const done = found.length === leaves.length;
  const atLeaf = path.length === N;

  function tap(choices: number[]) {
    const L = choices.length;
    const restart = path.length === N;
    const okStep = restart ? L === 1 : path.length === L - 1 && choices.slice(0, L - 1).every((c, i) => c === path[i]);
    if (!okStep) return;
    setPath(choices);
    if (L === N) setFound((s) => (s.includes(pathKey(choices)) ? s : [...s, pathKey(choices)]));
  }

  function onPath(choices: number[]): boolean {
    return choices.length <= path.length && choices.every((c, i) => c === path[i]);
  }
  function clickable(choices: number[]): boolean {
    const L = choices.length;
    if (path.length === N) return L === 1;
    return path.length === L - 1 && choices.slice(0, L - 1).every((c, i) => c === path[i]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🌳 원소마다 두 갈래 — 걸어서 부분집합에 닿아 보세요</p>
        <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          원소를 <b className="text-emerald-200">넣으면 ○</b>, <b className="text-rose-200">안 넣으면 ×</b> 쪽으로 갑니다. 왼쪽부터 차례로 눌러 오른쪽 끝까지 걸어가면 부분집합 하나가
          만들어져요.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className={"overflow-hidden rounded-xl border-2 bg-slate-950/70 transition " + (done ? "border-emerald-400/50" : "border-white/10")}>
          <svg viewBox={`0 0 ${TW} ${TH}`} className="block w-full select-none" role="img" aria-label="갈림길 나무">
            {TREE_ITEMS.map((x, i) => (
              <g key={x}>
                <rect x={COL[i] - 24} y={12} width={48} height={26} rx={13} fill="#34d39926" stroke="#34d399" strokeWidth={2} />
                <text x={COL[i]} y={30} textAnchor="middle" className="fill-emerald-100 font-serif text-[15px] font-bold italic">
                  {x}
                </text>
              </g>
            ))}
            <text x={520} y={30} textAnchor="middle" className="fill-amber-200 text-[13px] font-bold">
              부분집합
            </text>

            {/* 가지 */}
            {[0, 1, 2].map((L) =>
              nodesAt(L + 1).map((nd) => {
                const px = L === 0 ? 46 : COL[L - 1];
                const py = L === 0 ? nodeY([]) : nodeY(nd.slice(0, L));
                const on = onPath(nd);
                return (
                  <line
                    key={`e${nd.join("")}`}
                    x1={px}
                    y1={py}
                    x2={COL[L]}
                    y2={nodeY(nd)}
                    stroke={on ? "#22d3ee" : "rgba(255,255,255,0.16)"}
                    strokeWidth={on ? 3.5 : 1.6}
                  />
                );
              }),
            )}

            <circle cx={46} cy={nodeY([])} r={7} fill="#64748b" />

            {/* 마디 */}
            {[0, 1, 2].map((L) =>
              nodesAt(L + 1).map((nd) => {
                const yes = nd[L] === 1;
                const on = onPath(nd);
                const can = clickable(nd);
                const col = yes ? "#34d399" : "#fb7185";
                return (
                  <g key={`n${nd.join("")}`} className={can ? "cursor-pointer" : undefined} onClick={can ? () => tap(nd) : undefined}>
                    <circle cx={COL[L]} cy={nodeY(nd)} r={19} fill="transparent" />
                    <circle
                      cx={COL[L]}
                      cy={nodeY(nd)}
                      r={14}
                      fill={on ? `${col}44` : can ? `${col}1f` : "#0f172a"}
                      stroke={on ? col : can ? `${col}88` : "rgba(255,255,255,0.18)"}
                      strokeWidth={on ? 3 : 2}
                    />
                    <text x={COL[L]} y={nodeY(nd) + 5} textAnchor="middle" fill={on || can ? col : "#475569"} className="text-[14px] font-bold">
                      {yes ? "○" : "✕"}
                    </text>
                  </g>
                );
              }),
            )}

            {/* 잎 */}
            {leaves.map((lf) => {
              const got = found.includes(pathKey(lf));
              const on = onPath(lf) && path.length === N;
              const items = chosenItems(TREE_ITEMS, lf);
              return (
                <g key={`l${pathKey(lf)}`}>
                  <path d={`M${COL[2] + 20},${nodeY(lf)} L${COL[2] + 40},${nodeY(lf)}`} stroke={on ? "#22d3ee" : got ? "#34d399" : "rgba(255,255,255,0.18)"} strokeWidth={2.5} />
                  <rect
                    x={COL[2] + 46}
                    y={nodeY(lf) - 16}
                    width={150}
                    height={32}
                    rx={10}
                    fill={on ? "#22d3ee33" : got ? "#34d39922" : "rgba(255,255,255,0.04)"}
                    stroke={on ? "#22d3ee" : got ? "#34d399" : "rgba(255,255,255,0.14)"}
                    strokeWidth={2}
                  />
                  <text x={COL[2] + 121} y={nodeY(lf) + 6} textAnchor="middle" className={"font-mono text-[15px] font-bold " + (got || on ? "fill-white" : "fill-slate-600")}>
                    {got || on ? (items.length ? `{ ${items.join(", ")} }` : "∅") : "? ? ?"}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-3">
          <div className={"rounded-2xl border-2 px-4 py-3 text-center transition " + (done ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
            <p className="text-[11px] font-bold text-slate-400">지금 걸어온 길</p>
            <div className="mt-1.5 flex justify-center gap-2">
              {TREE_ITEMS.map((x, i) => (
                <div key={x} className="w-[60px] rounded-xl border-2 px-1 py-1.5" style={{ borderColor: i < path.length ? (path[i] ? "#34d399" : "#fb7185") : "rgba(255,255,255,0.12)" }}>
                  <p className="font-serif text-[13px] font-bold italic text-slate-200">{x}</p>
                  <p className="text-[15px] font-bold" style={{ color: i < path.length ? (path[i] ? "#34d399" : "#fb7185") : "#475569" }}>
                    {i < path.length ? (path[i] ? "○" : "✕") : "·"}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-2 text-lg text-slate-100">
              {atLeaf ? <Katex expr={listTex(chosenItems(TREE_ITEMS, path))} /> : <span className="font-mono text-sm text-slate-500">끝까지 걸어가 보세요</span>}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <p className={"text-center text-sm font-extrabold " + (done ? "text-emerald-200" : "text-slate-300")}>
              {done ? "🎉 여덟 갈래를 모두 걸었어요!" : `찾은 부분집합 ${found.length} / ${leaves.length}`}
            </p>
            <button
              type="button"
              onClick={() => {
                setPath([]);
                setFound([]);
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 처음부터
            </button>
          </div>

          {done ? (
            <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
              <p className="text-[12px] leading-7 text-slate-200">
                갈래가 원소마다 <b className="text-white">2가지</b>씩, 원소는 <b className="text-white">3개</b>
              </p>
              <div className="mt-1 flex justify-center text-lg text-emerald-100">
                <Katex expr="2 \times 2 \times 2 = 2^3 = 8" />
              </div>
              <p className="mt-1 text-[12px] leading-6 text-slate-300">
                원소가 <b className="text-amber-200">n개</b>면 갈래가 n번 이어지니 부분집합은 <Katex expr="2^n" /> 개!
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 스위치 계산기
// ══════════════════════════════════════════════════════════════
const SUB = "₁₂₃₄₅₆₇₈";
function swItems(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `a${SUB[i]}`);
}

function SwitchTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const m = MISSIONS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎚️ 원소마다 갈래를 못 박아 보세요</p>
          <Chips ids={MISSIONS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <div className="mt-2">
          <SwLegend />
        </div>
        <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-center text-[11px] leading-5 text-slate-300">
          못 박은 원소는 고를 것이 없으니 곱해지는 수가 <b className="text-white">2 대신 1</b> — 그래서 갈래가 줄어들어요.
        </p>
      </div>

      <SwitchOne
        key={m.id}
        m={m}
        last={i === MISSIONS.length - 1}
        onDone={() => setDone((s) => (s.includes(m.id) ? s : [...s, m.id]))}
        onNext={() => setI((k) => Math.min(MISSIONS.length - 1, k + 1))}
      />

      {done.length === MISSIONS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 다섯 미션을 모두 해냈어요!</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {[
              { t: "2^n", d: "모든 부분집합" },
              { t: "2^n - 1", d: "진부분집합" },
              { t: "2^{n-k-l}", d: "k개는 넣고 l개는 빼기" },
            ].map((x) => (
              <div key={x.t} className="rounded-xl bg-black/25 px-3 py-2">
                <div className="flex justify-center text-lg text-emerald-100">
                  <Katex expr={x.t} />
                </div>
                <p className="mt-0.5 text-[11px] text-slate-300">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SwitchOne({ m, last, onDone, onNext }: { m: Mission; last: boolean; onDone: () => void; onNext: () => void }) {
  const [n, setN] = useState(N_MIN);
  const [state, setState] = useState<Sw[]>(() => Array.from({ length: N_MAX }, () => 0 as Sw));

  const items = swItems(n);
  const cur = state.slice(0, n);
  const k = cur.filter((s) => s === 1).length;
  const l = cur.filter((s) => s === 2).length;
  const ok = n === m.n && k === m.k && l === m.l;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function cycle(idx: number) {
    setState((s) => s.map((v, j) => (j === idx ? (((v + 1) % 3) as Sw) : v)));
  }

  return (
    <div className="space-y-3">
      <div className={"rounded-2xl border-2 p-4 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/12" : "border-violet-400/40 bg-violet-400/[0.08]")}>
        <p className="text-center text-[11px] font-bold text-violet-200">🎯 미션</p>
        <p className="mt-1 text-center text-sm font-bold leading-6 text-slate-100">{m.ask}의 개수를 만들어 보세요</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2 text-[12px]">
          <span className={"rounded-full px-3 py-1 font-bold " + (n === m.n ? "bg-emerald-400/25 text-emerald-100" : "bg-white/8 text-slate-300")}>
            원소 {n} / {m.n} 개
          </span>
          <span className={"rounded-full px-3 py-1 font-bold " + (k === m.k ? "bg-emerald-400/25 text-emerald-100" : "bg-white/8 text-slate-300")}>
            넣기 {k} / {m.k} 개
          </span>
          <span className={"rounded-full px-3 py-1 font-bold " + (l === m.l ? "bg-emerald-400/25 text-emerald-100" : "bg-white/8 text-slate-300")}>
            빼기 {l} / {m.l} 개
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-[12px] font-bold text-slate-400">원소의 개수</span>
          <input
            type="range"
            min={N_MIN}
            max={N_MAX}
            step={1}
            value={n}
            aria-label="원소의 개수"
            onChange={(e) => setN(Number(e.target.value))}
            className="h-2 w-56 cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-400"
          />
          <span className="rounded-lg bg-black/35 px-3 py-1 font-mono text-base font-extrabold text-cyan-200">n = {n}</span>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">👆 스위치를 누를 때마다 자유 → 넣기 → 빼기 로 바뀌어요</p>
        <div className="mt-2">
          <SwitchStrip items={items} state={cur} onCycle={cycle} />
        </div>
      </div>

      <div className={"rounded-2xl border-2 px-4 py-3 text-center transition " + (ok ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
        <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-xl text-slate-100">
          <Katex expr={`2^{${n} - ${k} - ${l}} = 2^{${n - k - l}} = ${pow2(n - k - l)}`} />
        </div>
        <p className={"mt-1 text-[12px] font-bold " + (ok ? "text-emerald-200" : "text-slate-400")}>{ok ? "✅ 미션 성공!" : "미션에 맞게 원소의 개수와 스위치를 맞춰 보세요"}</p>
      </div>

      {ok ? (
        <>
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {m.tip}</p>
          {!last ? <NextBtn onClick={onNext} label="다음 미션 ▶" /> : null}
        </>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 개수 맞히기
// ══════════════════════════════════════════════════════════════
function setTexOf(p: CountProblem): string {
  if (!p.short) return `A = ${listTex(p.items)}`;
  const n = p.items.length;
  return `A = \\{1,\\; 2,\\; 3,\\; \\cdots,\\; ${n}\\}`;
}

function CountTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = COUNTS[i];

  return (
    <div className="space-y-4">
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

      {done.length === COUNTS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 풀었어요!</p>
          <p className="mt-1.5 text-[12px] leading-6 text-slate-300">
            조건이 어떻게 쓰여 있든 <b className="text-white">「반드시 넣기」와 「반드시 빼기」로 못 박힌 원소가 몇 개인지</b>만 찾으면 돼요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CountOne({ p, last, onDone, onNext }: { p: CountProblem; last: boolean; onDone: () => void; onNext: () => void }) {
  const [val, setVal] = useState("");
  const [tried, setTried] = useState<number | null>(null);
  const [hint, setHint] = useState(false);

  const ok = tried === p.answer;
  const n = p.items.length;
  const st = stateFrom(p.items, p.must, p.ban);

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className={"rounded-2xl border-2 p-4 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/12" : "border-sky-400/40 bg-sky-400/[0.07]")}>
          <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-sky-100">
            <Katex expr={setTexOf(p)} />
          </div>
          <p className="mt-2 text-center text-sm font-bold leading-7 text-slate-100">
            {p.ask}는? <span className="text-slate-400">(원소 {n}개)</span>
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={val}
              aria-label="부분집합의 개수"
              disabled={ok}
              onChange={(e) => setVal(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && val) setTried(Number(val));
              }}
              placeholder="개수"
              className="w-32 rounded-xl border-2 border-white/15 bg-slate-950 px-3 py-2 text-center font-mono text-lg font-bold text-white outline-none focus:border-cyan-400/70 disabled:opacity-60"
            />
            <span className="text-sm font-bold text-slate-300">개</span>
            <button
              type="button"
              onClick={() => setTried(val ? Number(val) : null)}
              disabled={ok || !val}
              className="rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25 disabled:opacity-40"
            >
              확인
            </button>
          </div>
          {tried !== null && !ok ? <p className="mt-2 text-center text-[12px] font-bold text-rose-200">{tried}개는 아니에요 — 자유로운 원소가 몇 개인지 세어 볼까요?</p> : null}
          {!ok ? (
            <button
              type="button"
              onClick={() => setHint((v) => !v)}
              className="mt-2 w-full rounded-xl border border-amber-400/45 bg-amber-400/10 px-3 py-2 text-[12px] font-bold text-amber-100 transition hover:bg-amber-400/20"
            >
              💡 스위치로 보기 {hint ? "닫기" : ""}
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {hint || ok ? (
          <div className={"rounded-2xl border-2 p-3 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/12" : "border-amber-400/45 bg-amber-400/[0.08]")}>
            <SwitchStrip items={p.items} state={st} />
            {p.proper ? (
              <p className="mt-1 flex justify-center text-lg text-slate-100">
                <Katex expr={`2^{${n}} - 1 = ${p.answer}`} />
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-[9rem] items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 text-center">
            <p className="text-[12px] leading-6 text-slate-500">
              스스로 세어 본 뒤
              <br />
              스위치 그림으로 확인해 보세요
            </p>
          </div>
        )}
        {ok ? (
          <>
            <div className="rounded-2xl border-2 border-emerald-400/55 bg-emerald-400/12 px-4 py-3 text-center">
              <p className="text-base font-extrabold text-emerald-100">✅ 정답 {p.answer}개</p>
            </div>
            <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {p.tip}</p>
            {!last ? <NextBtn onClick={onNext} /> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 부분집합 사냥
// ══════════════════════════════════════════════════════════════
function HuntTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const r = HUNTS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎯 조건에 맞는 부분집합을 모두 잡아 보세요</p>
          <Chips ids={HUNTS.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          정말 <Katex expr="2^{n-k-l}" /> 개인지 <b className="text-white">직접 만들어</b> 확인해 봐요. 조건을 어기면 잡을 수 없어요.
        </p>
      </div>

      <HuntOne key={r.id} r={r} last={i === HUNTS.length - 1} onDone={() => setDone((s) => (s.includes(r.id) ? s : [...s, r.id]))} onNext={() => setI((k) => Math.min(HUNTS.length - 1, k + 1))} />
    </div>
  );
}

function HuntOne({ r, last, onDone, onNext }: { r: HuntRound; last: boolean; onDone: () => void; onNext: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [caught, setCaught] = useState<number[]>([]);

  const target = huntCount(r);
  const good = huntOk(r, picked);
  const mask = r.items.reduce((m, x, i) => (picked.includes(x) ? m | (1 << i) : m), 0);
  const already = caught.includes(mask);
  const cleared = caught.length === target;
  const st = stateFrom(r.items, r.must, r.ban);

  const doneRef = useRef(false);
  useEffect(() => {
    if (cleared && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const missing = r.must.filter((x) => !picked.includes(x));
  const extra = r.ban.filter((x) => picked.includes(x));

  return (
    <div className="space-y-3">
      <div className={"rounded-2xl border-2 p-4 transition " + (cleared ? "border-emerald-400/55 bg-emerald-400/12" : "border-violet-400/40 bg-violet-400/[0.08]")}>
        <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-slate-100">
          <Katex expr={`A = ${listTex(r.items)}`} />
        </div>
        <p className="mt-1 text-center text-sm font-bold text-violet-100">🏹 사냥 조건 — {r.rule}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className={"rounded-2xl border-2 p-4 transition " + (good ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-rose-400/45 bg-rose-400/[0.07]")}>
            <p className="text-[11px] font-bold text-slate-400">원소를 눌러 부분집합을 만들어요</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {r.items.map((x) => {
                const on = picked.includes(x);
                return (
                  <button
                    key={x}
                    type="button"
                    onClick={() => setPicked((s) => (s.includes(x) ? s.filter((y) => y !== x) : [...s, x]))}
                    disabled={cleared}
                    className={
                      "h-11 min-w-[3rem] rounded-xl border-2 px-3 font-mono text-lg font-bold transition disabled:cursor-default " +
                      (on ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : "border-white/15 bg-white/5 text-slate-400 hover:bg-white/10")
                    }
                  >
                    {x}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-slate-100">
              <Katex expr={listTex(r.items.filter((x) => picked.includes(x)))} />
            </div>
            <p className={"mt-1 text-center text-[12px] font-bold " + (good ? "text-emerald-200" : "text-rose-200")}>
              {good ? "✔ 조건을 만족해요" : missing.length ? `✗ ${missing.join(", ")} 이(가) 빠졌어요` : `✗ ${extra.join(", ")} 은(는) 들어가면 안 돼요`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCaught((s) => (s.includes(mask) ? s : [...s, mask]))}
            disabled={!good || already || cleared}
            className="w-full rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 px-3 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/25 disabled:opacity-40"
          >
            {!good ? "조건을 만족해야 잡을 수 있어요" : already ? "이미 잡은 부분집합이에요" : "🏹 이 부분집합 잡기"}
          </button>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[11px] font-bold text-slate-400">못 박힌 원소</p>
            <div className="mt-1">
              <SwitchStrip items={r.items} state={st} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: target }, (_, i) => {
              const m = caught[i];
              return (
                <div
                  key={i}
                  className={
                    "rounded-xl border-2 px-2 py-2 text-center transition " +
                    (m === undefined ? "border-dashed border-white/15 bg-white/[0.03]" : "border-emerald-400/50 bg-emerald-400/15")
                  }
                >
                  {m === undefined ? (
                    <span className="font-mono text-sm text-slate-600">? ? ?</span>
                  ) : (
                    <span className="text-slate-100">
                      <Katex expr={listTex(subsetOf(r.items, m))} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className={"text-center text-[12px] font-bold " + (cleared ? "text-emerald-200" : "text-slate-400")}>
            {cleared ? "🎉 모두 잡았어요!" : `잡은 부분집합 ${caught.length} / ${target}`}
          </p>
          {cleared ? (
            <>
              <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-3 text-center">
                <div className="flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-emerald-100">
                  <Katex expr={`2^{${r.items.length} - ${r.must.length} - ${r.ban.length}} = 2^{${r.items.length - r.must.length - r.ban.length}} = ${target}`} />
                </div>
                <p className="mt-0.5 text-[11px] text-slate-300">직접 세어 본 개수와 공식이 맞아떨어졌어요</p>
              </div>
              <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {r.tip}</p>
              {!last ? <NextBtn onClick={onNext} label="다음 사냥 ▶" /> : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
