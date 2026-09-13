"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  ABS_TASKS,
  CS_RANGE,
  CS_SCATTER,
  CS_STEPS,
  CS_USES,
  GEO_PROOFS,
  MEAN_MAX,
  MEAN_MIN,
  MEAN_STEP,
  MEAN_USES,
  NL,
  PROPS,
  PROP_PROOFS,
  SQUARES,
  SQUARE_TRAPS,
  csAll,
  csGap,
  csLeft,
  csRight,
  meansOf,
  nlX,
  nlV,
  nx,
  propById,
  type AbsTask,
  type GeoProof,
  type Piece,
  type PropProof,
  type RealProp,
  type SquareTask,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "abs_vs_cond",
    prompt:
      "절대부등식과 조건부등식을 가르는 기준을 진리집합으로 설명하고, 탭①에서 가장 헷갈렸던 짝을 들어 보세요.",
    kind: "text",
    placeholder:
      "예: 진리집합이 실수 전체이면 절대부등식, 그보다 작으면 조건부등식이다. (x+1)² ≥ 0 은 절대부등식인데 (x+1)² > 0 은 x = −1 한 점에서 무너져 조건부등식이었다. 등호 하나 차이로 갈린다는 것이 인상 깊었다.",
  },
  {
    id: "square_trick",
    prompt:
      "근호나 절댓값이 있는 부등식을 제곱해서 증명해도 되는 까닭과, 그때 반드시 확인해야 하는 조건을 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: a ≥ 0, b ≥ 0 일 때 a ≥ b ⟺ a² ≥ b² 이기 때문이다. 그래서 제곱하기 전에 양변이 모두 0 이상인지 먼저 확인해야 한다. 조건이 없으면 −3 < 2 인데 9 > 4 처럼 대소가 뒤집힌다.",
  },
  {
    id: "means_or_cs",
    prompt:
      "산술·기하평균과 코시-슈바르츠 부등식 가운데 하나를 골라, 그 부등식이 참인 까닭과 등호가 성립하는 때를 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 산술기하평균은 (a+b)/2 − √(ab) = (√a − √b)²/2 ≥ 0 이라서 참이고, 등호는 √a = √b, 곧 a = b 일 때다. 반원 그림에서는 빗변인 반지름이 수선보다 짧을 수 없다는 사실로 보였고, 점 E 가 중심과 겹칠 때 등호가 되었다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "detect" | "props" | "square" | "means" | "cauchy";

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition " +
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

/** 문장 조각 — 한글은 HTML, 식은 KaTeX (KaTeX 안에 한글을 넣을 수 없다) */
function PieceText({ p }: { p: Piece }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1">
      {p.pre}
      {p.tex ? <Katex expr={p.tex} /> : null}
      {p.post}
    </span>
  );
}
function PieceLine({ ps }: { ps: Piece[] }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
      {ps.map((p, i) => (
        <PieceText key={i} p={p} />
      ))}
    </span>
  );
}

function TipBox({ text, open, onOpen }: { text: string; open: boolean; onOpen: () => void }) {
  if (open) return <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">💡 {text}</p>;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
    >
      💡 힌트
    </button>
  );
}

function Slider({ label, value, min, max, step, onChange, accent = "accent-cyan-400" }: { label: React.ReactNode; value: number; min: number; max: number; step: number; onChange: (v: number) => void; accent?: string }) {
  return (
    <label className="block text-[11px] font-bold text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        {label} <span className="font-mono text-[13px] text-slate-100">{nx(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={"mt-0.5 w-full " + accent} />
    </label>
  );
}

const ABC = ["①", "②", "③", "④"];

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function AbsoluteInequalityLab() {
  const [tab, setTab] = useState<Tab>("detect");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">⚖️ 절대부등식</h3>
        <p className="mt-2 leading-7 text-slate-300">
          어떤 실수를 넣어도 <b className="text-emerald-200">늘 성립하는 부등식</b>. 제곱은 음수가 될 수 없다는 한 가지 사실에서 놀랄 만큼 많은 것이 나옵니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "detect"} onClick={() => setTab("detect")}>
          ① 절대? 조건? 🔎
        </TabButton>
        <TabButton active={tab === "props"} onClick={() => setTab("props")}>
          ② 실수의 성질 8 🧰
        </TabButton>
        <TabButton active={tab === "square"} onClick={() => setTab("square")}>
          ③ 제곱해서 견주기 ⏫
        </TabButton>
        <TabButton active={tab === "means"} onClick={() => setTab("means")}>
          ④ 산술·기하평균 📐
        </TabButton>
        <TabButton active={tab === "cauchy"} onClick={() => setTab("cauchy")}>
          ⑤ 코시-슈바르츠 🎯
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "detect" ? <DetectTab /> : null}
        {tab === "props" ? <PropsTab /> : null}
        {tab === "square" ? <SquareTab /> : null}
        {tab === "means" ? <MeansTab /> : null}
        {tab === "cauchy" ? <CauchyTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 절대? 조건?
// ══════════════════════════════════════════════════════════════
const TICKS = Array.from({ length: NL.to - NL.from + 1 }, (_, i) => NL.from + i);

function trueSegments(test: (x: number) => boolean): [number, number][] {
  const segs: [number, number][] = [];
  const N = 560;
  let start: number | null = null;
  for (let i = 0; i <= N; i++) {
    const v = NL.from + (i / N) * (NL.to - NL.from);
    const on = test(v);
    if (on && start === null) start = v;
    if (!on && start !== null) {
      segs.push([start, v]);
      start = null;
    }
  }
  if (start !== null) segs.push([start, NL.to]);
  return segs;
}

function NumberLine({ t, x, show, svgRef, onGrab }: { t: AbsTask; x: number; show: boolean; svgRef: React.Ref<SVGSVGElement>; onGrab: () => void }) {
  const segs = show ? trueSegments(t.test) : [];
  const on = t.test(x);
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg ref={svgRef} viewBox={`0 0 ${NL.w} ${NL.h}`} className="mx-auto block w-full max-w-[640px] touch-none select-none" role="img" aria-label="부등식이 성립하는 범위">
        {show
          ? segs.map(([lo, hi], k) => (
              <rect key={k} x={nlX(lo)} y={NL.barY} width={Math.max(1, nlX(hi) - nlX(lo))} height={NL.barH} rx={6} fill="rgba(52,211,153,0.55)" />
            ))
          : null}
        {show
          ? t.holes.map((h) => (
              <g key={h}>
                <circle cx={nlX(h)} cy={NL.barY + NL.barH / 2} r={6} fill="#0f172a" stroke="#fb7185" strokeWidth={2.5} />
              </g>
            ))
          : null}
        {show ? (
          <text x={NL.x0 - 12} y={NL.barY + 13} textAnchor="end" className="fill-emerald-300 text-[11px] font-bold">
            성립
          </text>
        ) : null}

        <line x1={NL.x0 - 14} y1={NL.axY} x2={NL.x1 + 14} y2={NL.axY} stroke="rgba(226,232,240,0.55)" strokeWidth={2} />
        {TICKS.map((v) => (
          <g key={v}>
            <line x1={nlX(v)} y1={NL.axY - 5} x2={nlX(v)} y2={NL.axY + 5} stroke="rgba(226,232,240,0.45)" strokeWidth={1.5} />
            <text x={nlX(v)} y={NL.axY + 20} textAnchor="middle" className="fill-slate-500 font-mono text-[10px]">
              {nx(v)}
            </text>
          </g>
        ))}

        <g
          className="cursor-grab"
          onPointerDown={(e) => {
            e.preventDefault();
            onGrab();
          }}
        >
          <circle cx={nlX(x)} cy={NL.axY} r={16} fill="transparent" />
          <line x1={nlX(x)} y1={NL.barY - 6} x2={nlX(x)} y2={NL.axY} stroke="rgba(226,232,240,0.3)" strokeWidth={1.5} strokeDasharray="4 4" />
          <circle cx={nlX(x)} cy={NL.axY} r={9} fill={on ? "#34d399" : "#fb7185"} stroke="#0f172a" strokeWidth={2.5} />
          <text x={nlX(x)} y={NL.axY - 22} textAnchor="middle" className="fill-slate-200 font-mono text-[12px] font-bold">
            {nx(x)}
          </text>
        </g>
      </svg>
    </div>
  );
}

function DetectTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = ABS_TASKS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔎 점을 끌며 성립하지 않는 자리를 찾아보세요</p>
          <Chips ids={ABS_TASKS.map((a) => a.id)} cur={i} done={done} onPick={setI} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <b className="text-emerald-200">절대부등식</b> · 진리집합 = 실수 전체
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <b className="text-amber-200">조건부등식</b> · 진리집합 ⊊ 실수 전체
          </p>
        </div>
      </div>

      <DetectOne
        key={t.id}
        t={t}
        last={i === ABS_TASKS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(ABS_TASKS.length - 1, k + 1))}
      />

      {done.length === ABS_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 아홉 개를 모두 가려냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <Katex expr="(x+1)^2 \ge 0" /> 은 절대부등식인데 <Katex expr="(x+1)^2 > 0" /> 은 조건부등식이었지요. <b className="text-white">등호 하나</b> 가 한 점의 운명을
            가릅니다. 절대부등식임을 보이려면 <b className="text-emerald-200">모든 실수에 대해 성립함</b> 을 증명해야 해요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function DetectOne({ t, last, onDone, onNext }: { t: AbsTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [x, setX] = useState(1.5);
  const [found, setFound] = useState(false);
  const [kind, setKind] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");
  const [tip, setTip] = useState(false);
  const grab = useRef(false);

  const step2 = found && kind !== null && kind === t.absolute;

  const doneRef = useRef(false);
  useEffect(() => {
    if (step2 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  useEffect(() => {
    function move(e: PointerEvent) {
      if (!grab.current) return;
      const svg = svgRef.current;
      if (!svg) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const px = ((e.clientX - rect.left) * NL.w) / rect.width;
      const v = Math.max(NL.from, Math.min(NL.to, Math.round(nlV(px) * 20) / 20));
      setX(v);
    }
    function up() {
      grab.current = false;
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  function claimHere() {
    if (t.test(x)) {
      setMsg(`x = ${nx(x)} 에서는 성립해요. 다른 자리를 찾아보세요.`);
      return;
    }
    setFound(true);
    setMsg("");
  }
  function claimNone() {
    if (t.absolute) {
      setFound(true);
      setMsg("");
    } else {
      setMsg("아직 찾지 못했을 뿐이에요. 성립하지 않는 자리가 분명히 있답니다.");
    }
  }

  const on = t.test(x);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.08] to-sky-500/[0.03] px-4 py-4 text-center">
        <p className="text-[11px] font-bold tracking-widest text-cyan-200/80">이 부등식은?</p>
        <p className="mt-1 text-2xl font-bold text-slate-100">
          <Katex expr={t.tex} />
        </p>
      </div>

      <NumberLine
        t={t}
        x={x}
        show={found}
        svgRef={svgRef}
        onGrab={() => {
          grab.current = true;
        }}
      />

      <div className="grid gap-2 sm:grid-cols-3">
        <div className={"rounded-xl border-2 px-3 py-2.5 text-center " + (on ? "border-emerald-400/60 bg-emerald-400/15" : "border-rose-400/60 bg-rose-400/15")}>
          <p className="text-[11px] font-bold text-slate-400">
            <Katex expr="x" /> = <span className="font-mono text-slate-100">{nx(x)}</span> 에서
          </p>
          <p className={"mt-0.5 text-lg font-extrabold " + (on ? "text-emerald-100" : "text-rose-100")}>{on ? "성립 ⭕" : "성립 안 함 ❌"}</p>
        </div>
        <div className="sm:col-span-2">
          {!found ? (
            <div className="grid h-full gap-1.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={claimHere}
                className="rounded-xl border-2 border-rose-400/55 bg-rose-400/12 px-3 py-2.5 text-[13px] font-bold text-rose-100 transition hover:bg-rose-400/22"
              >
                🚨 여기서 안 돼요!
              </button>
              <button
                type="button"
                onClick={claimNone}
                className="rounded-xl border-2 border-emerald-400/55 bg-emerald-400/12 px-3 py-2.5 text-[13px] font-bold text-emerald-100 transition hover:bg-emerald-400/22"
              >
                ✨ 그런 자리는 없어요
              </button>
            </div>
          ) : (
            <div className="flex h-full items-center rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[12px] leading-6 text-slate-300">
                성립하는 범위가 초록으로 칠해졌어요. {t.holes.length > 0 ? "붉은 동그라미는 딱 그 점만 빠진다는 뜻이에요." : ""}
              </p>
            </div>
          )}
        </div>
      </div>
      {msg ? <p className="rounded-xl bg-amber-400/10 px-3 py-2.5 text-[12px] leading-6 text-amber-100">⏳ {msg}</p> : null}
      {!found ? (
        <div>
          <TipBox text={t.tip} open={tip} onOpen={() => setTip(true)} />
        </div>
      ) : null}

      <div className={"rounded-2xl border-2 p-3 transition " + (found ? "border-white/10 bg-slate-900/40" : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
        <p className="text-[12px] font-bold text-slate-200">그러면 이 부등식은 어느 쪽일까요?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[true, false].map((v) => {
            const sel = kind === v;
            const good = step2 && v === t.absolute;
            const bad = sel && v !== t.absolute;
            return (
              <button
                key={String(v)}
                type="button"
                onClick={() => setKind(v)}
                disabled={step2}
                className={
                  "rounded-xl border-2 px-3 py-3 text-sm font-bold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                {v ? "⚖️ 절대부등식" : "🎯 조건부등식"}
              </button>
            );
          })}
        </div>
        {kind !== null && !step2 && found ? (
          <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ 초록으로 칠해진 범위가 수직선 전체를 덮고 있는지 다시 보세요.</p>
        ) : null}
      </div>

      {step2 ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[13px] font-bold text-slate-100">
            진리집합 · <span className="font-mono text-emerald-200">{t.solution}</span>
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">✅ {t.why}</p>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 실수의 성질 8
// ══════════════════════════════════════════════════════════════
function PropLab({ p }: { p: RealProp }) {
  const [a, setA] = useState(3);
  const [b, setB] = useState(2);

  const cmpOf = (l: number, r: number, c: "ge" | "gt" | "eq") => (c === "ge" ? l >= r - 1e-9 : c === "gt" ? l > r + 1e-9 : Math.abs(l - r) < 1e-9);
  const symOf = (c: "ge" | "gt" | "eq") => (c === "ge" ? "\\ge" : c === "gt" ? ">" : "=");

  const L = p.lhs(a, b);
  const R = p.rhs(a, b);
  const has2 = !!p.lhs2 && !!p.rhs2 && !!p.cmp2;
  const L2 = has2 ? (p.lhs2 as (x: number, y: number) => number)(a, b) : 0;
  const R2 = has2 ? (p.rhs2 as (x: number, y: number) => number)(a, b) : 0;
  const h1 = cmpOf(L, R, p.cmp);
  const h2 = has2 ? cmpOf(L2, R2, p.cmp2 as "ge" | "gt" | "eq") : true;
  const iff = has2 && p.mode === "iff";
  const holds = iff ? h1 === h2 : h1 && h2;
  const sym = symOf(p.cmp);
  const maxAbs = Math.max(1, Math.abs(L), Math.abs(R), Math.abs(L2), Math.abs(R2));

  const bar = (v: number, color: string) => (
    <div className="flex h-5 items-center">
      <div className="relative h-3 flex-1 rounded-full bg-white/[0.06]">
        <div
          className="absolute top-0 h-3 rounded-full"
          style={{
            left: v >= 0 ? "50%" : `${50 - (Math.abs(v) / maxAbs) * 50}%`,
            width: `${(Math.abs(v) / maxAbs) * 50}%`,
            background: color,
          }}
        />
        <div className="absolute left-1/2 top-[-3px] h-[18px] w-px bg-white/30" />
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border-2 border-cyan-400/30 bg-cyan-400/[0.06] p-3">
      <p className="text-center text-[13px] font-bold text-cyan-100">
        🧪 성질 {p.no} 실험대 · {p.name}
      </p>
      <p className="mt-1 text-center text-[15px] text-slate-100">
        <Katex expr={p.tex} />
      </p>
      <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">{p.note}</p>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Slider label={<Katex expr="a" />} value={a} min={-6} max={6} step={0.5} onChange={setA} accent="accent-sky-400" />
        {p.oneVar ? <div className="text-[11px] text-slate-600">이 성질에는 b 가 쓰이지 않아요.</div> : <Slider label={<Katex expr="b" />} value={b} min={-6} max={6} step={0.5} onChange={setB} accent="accent-amber-400" />}
      </div>

      <div className="mt-2 space-y-1.5 rounded-xl bg-black/25 p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 shrink-0 text-right text-[12px] text-sky-200">
            <Katex expr={p.lhsTex} />
          </span>
          <span className="w-14 shrink-0 font-mono text-[13px] font-bold text-slate-100">{nx(L)}</span>
          {bar(L, "#38bdf8")}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 shrink-0 text-right text-[12px] text-amber-200">
            <Katex expr={p.rhsTex} />
          </span>
          <span className="w-14 shrink-0 font-mono text-[13px] font-bold text-slate-100">{nx(R)}</span>
          {bar(R, "#fbbf24")}
        </div>
        {has2 ? (
          <>
            <div className="my-1 h-px bg-white/10" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 text-right text-[12px] text-violet-200">
                <Katex expr={p.lhs2Tex as string} />
              </span>
              <span className="w-14 shrink-0 font-mono text-[13px] font-bold text-slate-100">{nx(L2)}</span>
              {bar(L2, "#a78bfa")}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 text-right text-[12px] text-rose-200">
                <Katex expr={p.rhs2Tex as string} />
              </span>
              <span className="w-14 shrink-0 font-mono text-[13px] font-bold text-slate-100">{nx(R2)}</span>
              {bar(R2, "#fb7185")}
            </div>
          </>
        ) : null}
      </div>

      <div className={"mt-2 grid gap-1.5 " + (has2 ? "sm:grid-cols-2" : "")}>
        <p className={"rounded-lg px-3 py-2 text-center text-[13px] font-bold " + (h1 ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-400/15 text-rose-100")}>
          <Katex expr={`${p.lhsTex} ${sym} ${p.rhsTex}`} /> <span className="mx-1.5">·</span> {h1 ? "성립 ⭕" : "성립 안 함 ❌"}
        </p>
        {has2 ? (
          <p className={"rounded-lg px-3 py-2 text-center text-[13px] font-bold " + (h2 ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-400/15 text-rose-100")}>
            <Katex expr={`${p.lhs2Tex} ${symOf(p.cmp2 as "ge" | "gt" | "eq")} ${p.rhs2Tex}`} /> <span className="mx-1.5">·</span> {h2 ? "성립 ⭕" : "성립 안 함 ❌"}
          </p>
        ) : null}
      </div>
      {has2 ? (
        <p className={"mt-1.5 rounded-lg px-3 py-2 text-center text-[12px] font-bold " + (holds ? "bg-emerald-400/20 text-emerald-50" : "bg-rose-400/20 text-rose-50")}>
          {iff
            ? holds
              ? "🟰 두 판정이 같아요 — 제곱해도 대소가 그대로예요"
              : "💥 두 판정이 엇갈려요 — 제곱이 대소를 뒤집었어요"
            : holds
              ? "⭕ 두 가지가 모두 성립해요"
              : "❌ 둘 중 하나가 무너졌어요"}
        </p>
      ) : null}

      {p.needs ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-400/10 px-3 py-2">
          <span className="text-[12px] leading-6 text-amber-100">
            ⚠️ 조건 <Katex expr={p.needs} /> 아래에서만 보장돼요.
          </span>
          {p.breakAt ? (
            <button
              type="button"
              onClick={() => {
                setA(p.breakAt!.a);
                setB(p.breakAt!.b);
              }}
              className="shrink-0 rounded-lg border border-rose-400/45 bg-rose-400/12 px-2.5 py-1 text-[11px] font-bold text-rose-100 transition hover:bg-rose-400/22"
            >
              조건을 어기면? 💥
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-[12px] leading-6 text-emerald-100">✨ 조건 없이 어떤 실수에서도 늘 성립하는 성질이에요.</p>
      )}
      {p.breakAt && a === p.breakAt.a && (p.oneVar || b === p.breakAt.b) ? (
        <p className="mt-1.5 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">💥 {p.breakAt.why}</p>
      ) : null}
    </div>
  );
}

function PropsTab() {
  const [sel, setSel] = useState<string>("p3");
  const [pi, setPi] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const q = PROP_PROOFS[pi];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🧰 절대부등식 증명에 쓰이는 실수의 성질 여덟 가지</p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {PROPS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSel(p.id)}
              className={
                "flex items-center gap-2 overflow-x-auto overflow-y-hidden rounded-xl border-2 px-2.5 py-2 text-left transition " +
                (sel === p.id ? "border-cyan-400/70 bg-cyan-400/15" : "border-white/10 bg-white/[0.03] hover:bg-white/10")
              }
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/40 font-mono text-[11px] font-bold text-slate-300">{p.no}</span>
              <span className="text-[13px] text-slate-100">
                <Katex expr={p.tex} />
              </span>
            </button>
          ))}
        </div>
      </div>

      <PropLab key={sel} p={propById(sel)} />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔍 이 줄은 어떤 성질을 썼을까요?</p>
          <Chips ids={PROP_PROOFS.map((x) => x.id)} cur={pi} done={done} onPick={setPi} />
        </div>
      </div>

      <ProofOne
        key={q.id}
        q={q}
        last={pi === PROP_PROOFS.length - 1}
        onDone={() => setDone((s) => (s.includes(q.id) ? s : [...s, q.id]))}
        onNext={() => setPi((k) => Math.min(PROP_PROOFS.length - 1, k + 1))}
      />

      {done.length === PROP_PROOFS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 증명의 근거를 모두 밝혔어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <b className="text-sky-200">완전제곱으로 묶어 0 이상임을 보이고</b>(성질 3), <b className="text-amber-200">차의 부호로 대소를 말하는 것</b>(성질 2) — 절대부등식 증명은
            거의 늘 이 두 걸음이에요. 절댓값이나 근호가 있으면 <b className="text-violet-200">제곱해서 견주기</b>(성질 8)를 더합니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ProofOne({ q, last, onDone, onNext }: { q: PropProof; last: boolean; onDone: () => void; onNext: () => void }) {
  const [picks, setPicks] = useState<Record<number, string>>({});
  const cleared = q.lines.every((l, k) => picks[k] === l.propId);

  const doneRef = useRef(false);
  useEffect(() => {
    if (cleared && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.08] to-sky-500/[0.03] px-4 py-3 text-center">
        {q.cond ? <p className="text-[11px] font-bold text-slate-400">조건 · {q.cond}</p> : null}
        <p className="mt-0.5 text-[11px] font-bold tracking-widest text-cyan-200/80">증명할 부등식</p>
        <p className="mt-1 text-xl font-bold text-slate-100">
          <PieceLine ps={q.claim} />
        </p>
      </div>

      <div className="space-y-2">
        {q.lines.map((l, k) => {
          const picked = picks[k];
          const good = picked === l.propId;
          return (
            <div key={k} className={"rounded-2xl border-2 p-3 transition " + (good ? "border-emerald-400/55 bg-emerald-400/10" : picked ? "border-rose-400/55 bg-rose-400/10" : "border-white/10 bg-slate-900/40")}>
              <p className="flex flex-wrap items-baseline gap-x-2 text-[13px] leading-7 text-slate-100">
                <span className="shrink-0 font-mono text-[11px] font-bold text-slate-500">{k + 1}</span>
                <PieceLine ps={l.text} />
              </p>
              {good ? (
                <p className="mt-1.5 rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">
                  ✅ 성질 {propById(l.propId).no} · {propById(l.propId).name} — <Katex expr={propById(l.propId).tex} />
                </p>
              ) : (
                <>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {PROPS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPicks((s) => ({ ...s, [k]: p.id }))}
                        className={
                          "h-8 w-8 rounded-lg border-2 font-mono text-[12px] font-bold transition " +
                          (picked === p.id ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : "border-white/12 bg-white/5 text-slate-300 hover:bg-white/15")
                        }
                      >
                        {p.no}
                      </button>
                    ))}
                  </div>
                  {picked ? (
                    <p className="mt-1.5 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
                      ❌ 성질 {propById(picked).no}({propById(picked).name})은(는) 이 줄의 근거가 아니에요.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          );
        })}
      </div>

      {cleared ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[13px] font-bold text-slate-100">등호가 성립하는 때 · {q.eq}</p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">📎 {q.note}</p>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 제곱해서 견주기
// ══════════════════════════════════════════════════════════════
function SquareTab() {
  const [trap, setTrap] = useState(0);
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = SQUARES[i];
  const tr = SQUARE_TRAPS[trap];

  return (
    <div className="space-y-4">
      {/* 제곱 실험 */}
      <div className="rounded-2xl border-2 border-violet-400/30 bg-violet-400/[0.06] p-3">
        <p className="text-sm font-bold text-violet-100">⏫ 제곱하면 대소가 그대로일까요?</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SQUARE_TRAPS.map((x, k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTrap(k)}
              className={
                "rounded-lg border-2 px-2.5 py-1.5 font-mono text-[12px] font-bold transition " +
                (trap === k ? "border-cyan-400/70 bg-cyan-400/15 text-cyan-100" : "border-white/12 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              ({nx(x.a)}, {nx(x.b)})
            </button>
          ))}
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2.5 text-center text-[13px] leading-7 text-slate-100">
            <span className="font-mono">{nx(tr.a)}</span>
            <b className="mx-1.5 text-sky-200">{tr.a >= tr.b ? "≥" : "<"}</b>
            <span className="font-mono">{nx(tr.b)}</span>
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2.5 text-center text-[13px] leading-7 text-slate-100">
            <span className="font-mono">{nx(tr.a * tr.a)}</span>
            <b className="mx-1.5 text-amber-200">{tr.a * tr.a >= tr.b * tr.b ? "≥" : "<"}</b>
            <span className="font-mono">{nx(tr.b * tr.b)}</span>
          </p>
        </div>
        <p className={"mt-1.5 rounded-lg px-3 py-2 text-[12px] leading-6 " + (tr.ok ? "bg-emerald-400/12 text-emerald-100" : "bg-rose-400/12 text-rose-100")}>
          {tr.ok ? "✅" : "💥"} {tr.why}
        </p>
        <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
          그래서 제곱 비교에는 조건이 붙어요 — <b className="text-white">양변이 모두 0 이상일 때</b> <Katex expr="A \ge B \iff A^2 \ge B^2" />
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧮 제곱해서 증명해 봅시다</p>
          <Chips ids={SQUARES.map((s) => s.id)} cur={i} done={done} onPick={setI} />
        </div>
      </div>

      <SquareOne
        key={t.id}
        t={t}
        last={i === SQUARES.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(SQUARES.length - 1, k + 1))}
      />

      {done.length === SQUARES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 다섯 개를 모두 제곱으로 해결했어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <b className="text-white">① 양변이 0 이상인지 확인 → ② 제곱해서 차를 구함 → ③ 완전제곱꼴이나 절댓값으로 0 이상임을 보임</b> — 근호와 절댓값이 있는 부등식은 이 세 걸음으로
            거의 다 풀려요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function SquareOne({ t, last, onDone, onNext }: { t: SquareTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [ok1, setOk1] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [a, setA] = useState(t.nonnegVars ? 4 : 3);
  const [b, setB] = useState(t.nonnegVars ? 1 : -2);

  const step2 = ok1 && pick !== null && pick === t.answer;

  const doneRef = useRef(false);
  useEffect(() => {
    if (step2 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const A = t.A(a, b);
  const B = t.B(a, b);
  const lo = t.nonnegVars ? 0 : -6;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.08] to-sky-500/[0.03] px-4 py-3 text-center">
        <p className="text-[11px] font-bold text-slate-400">조건 · {t.cond}</p>
        <p className="mt-0.5 text-[11px] font-bold tracking-widest text-cyan-200/80">증명할 부등식</p>
        <p className="mt-1 text-xl font-bold text-slate-100">
          <PieceLine ps={t.claim} />
        </p>
      </div>

      {/* 1단계 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (ok1 ? "border-emerald-400/45 bg-emerald-400/[0.08]" : "border-white/10 bg-slate-900/40")}>
        <p className="text-[12px] font-bold text-slate-200">1단계 · 제곱해서 견주어도 될까요?</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-black/25 px-3 py-2 text-center">
            <p className="text-[11px] font-bold text-sky-200">
              <Katex expr="A" /> = <Katex expr={t.aTex} />
            </p>
          </div>
          <div className="rounded-xl bg-black/25 px-3 py-2 text-center">
            <p className="text-[11px] font-bold text-amber-200">
              <Katex expr="B" /> = <Katex expr={t.bTex} />
            </p>
          </div>
        </div>
        {ok1 ? (
          <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {t.nonneg} 그러니 제곱해서 견주어도 돼요.</p>
        ) : (
          <button
            type="button"
            onClick={() => setOk1(true)}
            className="mt-2 w-full rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-3 py-2.5 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25"
          >
            ⏫ 양변이 0 이상인지 확인하고 제곱 스위치 켜기
          </button>
        )}
      </div>

      {/* 2단계 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (ok1 ? "border-white/10 bg-slate-900/40" : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
        <p className="text-[12px] font-bold text-slate-200">
          2단계 · <Katex expr="A^2 - B^2" /> 를 정리하면?
        </p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {t.choices.map((c, k) => {
            const on = pick === k;
            const good = step2 && k === t.answer;
            const bad = on && k !== t.answer;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setPick(k)}
                disabled={step2}
                className={
                  "flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-[15px] font-bold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                <span className="font-mono text-[12px] text-slate-400">{ABC[k]}</span>
                <Katex expr={c} />
              </button>
            );
          })}
        </div>
        {pick !== null && !step2 && ok1 ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {t.choiceWhy[pick]}</p> : null}
      </div>

      {step2 ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <p className="rounded-lg bg-black/25 px-3 py-2.5 text-center text-[14px] leading-8 text-slate-100">
            <Katex expr={`A^2 - B^2 = ${t.choices[t.answer]} \\ge 0`} />
          </p>
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {t.conclude} 양변이 0 이상이므로 원래 부등식도 성립해요.</p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[13px] font-bold text-slate-100">등호가 성립하는 때 · {t.eq}</p>

          {/* 수치 확인 */}
          <div className="rounded-xl border border-white/10 bg-black/25 p-2.5">
            <p className="text-[11px] font-bold text-slate-400">🔢 값을 넣어 확인해 보세요</p>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              <Slider label={<Katex expr="a" />} value={a} min={lo} max={6} step={0.5} onChange={setA} accent="accent-sky-400" />
              <Slider label={<Katex expr="b" />} value={b} min={lo} max={6} step={0.5} onChange={setB} accent="accent-amber-400" />
            </div>
            <div className="mt-1.5 grid gap-1.5 sm:grid-cols-3 text-center">
              <p className="rounded-lg bg-white/[0.04] px-2 py-1.5 text-[12px] text-sky-100">
                A = <span className="font-mono font-bold">{nx(A)}</span>
              </p>
              <p className="rounded-lg bg-white/[0.04] px-2 py-1.5 text-[12px] text-amber-100">
                B = <span className="font-mono font-bold">{nx(B)}</span>
              </p>
              <p className={"rounded-lg px-2 py-1.5 text-[12px] font-bold " + (A >= B - 1e-9 ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-400/15 text-rose-100")}>
                {A >= B - 1e-9 ? (Math.abs(A - B) < 1e-9 ? "A = B (등호!)" : "A > B ⭕") : "A < B ❌"}
              </p>
            </div>
          </div>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 산술·기하평균
// ══════════════════════════════════════════════════════════════
function SquarePuzzle({ a, b }: { a: number; b: number }) {
  const S = 250;
  const pad = 26;
  const s = S / (a + b);
  const P = (v: number) => pad + v * s;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const rects: [number, number, number, number][] = [
    [0, 0, a, b],
    [a, 0, b, a],
    [b, a, a, b],
    [0, b, b, a],
  ];
  return (
    <svg viewBox={`0 0 ${S + pad * 2} ${S + pad * 2}`} className="mx-auto block w-full max-w-[300px] select-none" role="img" aria-label="정사각형 퍼즐">
      <rect x={pad} y={pad} width={S} height={S} fill="none" stroke="rgba(226,232,240,0.5)" strokeWidth={2} strokeDasharray="5 4" />
      {rects.map(([x, y, w, h], k) => (
        <rect key={k} x={P(x)} y={P(y)} width={w * s} height={h * s} fill="rgba(251,146,60,0.65)" stroke="#7c2d12" strokeWidth={1.5} />
      ))}
      {hi - lo > 0.01 ? <rect x={P(lo)} y={P(lo)} width={(hi - lo) * s} height={(hi - lo) * s} fill="rgba(59,130,246,0.85)" stroke="#1e3a8a" strokeWidth={1.5} /> : null}
      <text x={pad + (a * s) / 2} y={pad - 8} textAnchor="middle" className="fill-slate-300 font-serif text-[12px] italic">
        a
      </text>
      <text x={pad + a * s + (b * s) / 2} y={pad - 8} textAnchor="middle" className="fill-slate-300 font-serif text-[12px] italic">
        b
      </text>
      <text x={pad - 8} y={pad + (b * s) / 2 + 4} textAnchor="end" className="fill-slate-300 font-serif text-[12px] italic">
        b
      </text>
      <text x={pad - 8} y={pad + b * s + (a * s) / 2 + 4} textAnchor="end" className="fill-slate-300 font-serif text-[12px] italic">
        a
      </text>
      {hi - lo > 0.6 ? (
        <text x={P((lo + hi) / 2)} y={P((lo + hi) / 2) + 4} textAnchor="middle" className="fill-white text-[11px] font-bold">
          {nx(hi - lo)}
        </text>
      ) : null}
    </svg>
  );
}

function SemiCircle({ a, b }: { a: number; b: number }) {
  const W = 420;
  const H = 236;
  const pad = 36;
  const s = (W - pad * 2) / (a + b);
  const baseY = 190;
  const A = { x: pad, y: baseY };
  const B = { x: pad + (a + b) * s, y: baseY };
  const O = { x: (A.x + B.x) / 2, y: baseY };
  const r = ((a + b) / 2) * s;
  const E = { x: pad + a * s, y: baseY };
  const de = Math.sqrt(a * b) * s;
  const D = { x: E.x, y: baseY - de };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-[420px] select-none" role="img" aria-label="반원과 수선">
      <path d={`M ${A.x} ${A.y} A ${r} ${r} 0 0 1 ${B.x} ${B.y}`} fill="none" stroke="rgba(226,232,240,0.75)" strokeWidth={2.5} />
      <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="rgba(226,232,240,0.75)" strokeWidth={2.5} />
      <line x1={O.x} y1={O.y} x2={O.x} y2={O.y - r} stroke="rgba(148,163,184,0.45)" strokeWidth={1.5} strokeDasharray="4 4" />
      <line x1={O.x} y1={O.y} x2={D.x} y2={D.y} stroke="#38bdf8" strokeWidth={3} />
      <line x1={E.x} y1={E.y} x2={D.x} y2={D.y} stroke="#34d399" strokeWidth={3} />
      <line x1={A.x} y1={A.y} x2={D.x} y2={D.y} stroke="rgba(148,163,184,0.5)" strokeWidth={1.5} />
      <line x1={D.x} y1={D.y} x2={B.x} y2={B.y} stroke="rgba(148,163,184,0.5)" strokeWidth={1.5} />
      {Math.abs(E.x - O.x) > 6 ? <rect x={E.x - 9} y={E.y - 9} width={9} height={9} fill="none" stroke="rgba(148,163,184,0.6)" strokeWidth={1.5} /> : null}
      {[
        [A, "A"],
        [B, "B"],
        [O, "O"],
        [E, "E"],
      ].map(([p, t]) => (
        <g key={t as string}>
          <circle cx={(p as { x: number }).x} cy={(p as { y: number }).y} r={3.5} fill="#e2e8f0" />
          <text x={(p as { x: number }).x} y={(p as { y: number }).y + 18} textAnchor="middle" className="fill-slate-300 text-[11px] font-bold">
            {t as string}
          </text>
        </g>
      ))}
      <circle cx={D.x} cy={D.y} r={4} fill="#34d399" />
      <text x={D.x + 10} y={D.y - 4} className="fill-emerald-300 text-[11px] font-bold">
        D
      </text>
      <text x={(A.x + E.x) / 2} y={baseY + 32} textAnchor="middle" className="fill-slate-400 font-serif text-[12px] italic">
        a = {nx(a)}
      </text>
      <text x={(E.x + B.x) / 2} y={baseY + 32} textAnchor="middle" className="fill-slate-400 font-serif text-[12px] italic">
        b = {nx(b)}
      </text>
      <text x={(O.x + D.x) / 2} y={(O.y + D.y) / 2 - 8} textAnchor="middle" className="fill-sky-300 text-[11px] font-bold">
        {nx((a + b) / 2)}
      </text>
      <text x={D.x - 10} y={(E.y + D.y) / 2} textAnchor="end" className="fill-emerald-300 text-[11px] font-bold">
        {nx(Math.sqrt(a * b))}
      </text>
    </svg>
  );
}

function TwoCircles({ a, b }: { a: number; b: number }) {
  const W = 360;
  const H = 250;
  const ra = a / 2;
  const rb = b / 2;
  const gx = Math.sqrt(a * b);
  const s = Math.min((W - 50) / (ra + rb + gx), (H - 50) / (2 * Math.max(ra, rb)));
  const baseY = H - 24;
  const ax = 26 + ra * s;
  const bx = ax + gx * s;
  const A = { x: ax, y: baseY - ra * s };
  const B = { x: bx, y: baseY - rb * s };
  const C = { x: bx, y: A.y };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-[360px] select-none" role="img" aria-label="맞닿은 두 원">
      <line x1={10} y1={baseY} x2={W - 10} y2={baseY} stroke="rgba(226,232,240,0.5)" strokeWidth={2} />
      <circle cx={A.x} cy={A.y} r={ra * s} fill="rgba(56,189,248,0.14)" stroke="#38bdf8" strokeWidth={2.5} />
      <circle cx={B.x} cy={B.y} r={rb * s} fill="rgba(251,191,36,0.14)" stroke="#fbbf24" strokeWidth={2.5} />
      <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#a78bfa" strokeWidth={3} />
      <line x1={A.x} y1={A.y} x2={C.x} y2={C.y} stroke="#34d399" strokeWidth={3} />
      {Math.abs(B.y - C.y) > 4 ? <line x1={C.x} y1={C.y} x2={B.x} y2={B.y} stroke="rgba(148,163,184,0.7)" strokeWidth={2} strokeDasharray="4 3" /> : null}
      {Math.abs(B.y - C.y) > 10 ? <rect x={C.x - 9} y={C.y} width={9} height={9} fill="none" stroke="rgba(148,163,184,0.6)" strokeWidth={1.5} /> : null}
      <circle cx={A.x} cy={A.y} r={3.5} fill="#e2e8f0" />
      <circle cx={B.x} cy={B.y} r={3.5} fill="#e2e8f0" />
      <text x={A.x - 8} y={A.y - 6} textAnchor="end" className="fill-sky-300 text-[11px] font-bold">
        A
      </text>
      <text x={B.x + 8} y={B.y - 6} className="fill-amber-300 text-[11px] font-bold">
        B
      </text>
      <text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 - 8} textAnchor="middle" className="fill-violet-300 text-[11px] font-bold">
        {nx((a + b) / 2)}
      </text>
      <text x={(A.x + C.x) / 2} y={A.y - 8} textAnchor="middle" className="fill-emerald-300 text-[11px] font-bold">
        {nx(gx)}
      </text>
      {Math.abs(B.y - C.y) > 14 ? (
        <text x={C.x + 8} y={(C.y + B.y) / 2} className="fill-slate-400 text-[10px] font-bold">
          {nx(Math.abs(a - b) / 2)}
        </text>
      ) : null}
    </svg>
  );
}

function MeansTab() {
  const [a, setA] = useState(8);
  const [b, setB] = useState(2);
  const [geo, setGeo] = useState(0);
  const [quiz, setQuiz] = useState<Record<string, number>>({});
  const [ui, setUi] = useState(0);
  const [uses, setUses] = useState<Record<string, number>>({});

  const { A, G, H } = meansOf(a, b);
  const g = GEO_PROOFS[geo];
  const u = MEAN_USES[ui];
  const maxV = Math.max(A, MEAN_MAX);

  const bar = (v: number, color: string, label: string) => (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-right text-[11px] font-bold" style={{ color }}>
        {label}
      </span>
      <span className="w-12 shrink-0 font-mono text-[12px] font-bold text-slate-100">{nx(v)}</span>
      <div className="h-3 flex-1 rounded-full bg-white/[0.06]">
        <div className="h-3 rounded-full transition-all" style={{ width: `${(v / maxV) * 100}%`, background: color }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 세 평균 저울 */}
      <div className="rounded-2xl border-2 border-emerald-400/30 bg-emerald-400/[0.06] p-3">
        <p className="text-sm font-bold text-emerald-100">📐 두 양수의 세 평균</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Slider label={<Katex expr="a" />} value={a} min={MEAN_MIN} max={MEAN_MAX} step={MEAN_STEP} onChange={setA} accent="accent-sky-400" />
          <Slider label={<Katex expr="b" />} value={b} min={MEAN_MIN} max={MEAN_MAX} step={MEAN_STEP} onChange={setB} accent="accent-amber-400" />
        </div>
        <div className="mt-2 space-y-1.5 rounded-xl bg-black/25 p-2.5">
          {bar(A, "#38bdf8", "산술 (a+b)/2")}
          {bar(G, "#34d399", "기하 √(ab)")}
          {bar(H, "#fbbf24", "조화 2ab/(a+b)")}
        </div>
        <p className={"mt-2 rounded-lg px-3 py-2 text-center text-[13px] font-bold " + (Math.abs(a - b) < 1e-9 ? "bg-emerald-400/20 text-emerald-50" : "bg-black/25 text-slate-200")}>
          <Katex expr="\dfrac{a+b}{2} \ge \sqrt{ab} \ge \dfrac{2ab}{a+b}" />
          {Math.abs(a - b) < 1e-9 ? <span className="ml-2 text-emerald-200">— a = b 라서 셋이 모두 같아요!</span> : null}
        </p>
      </div>

      {/* 도형 증명 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🖼️ 도형으로 보는 증명 — 슬라이더를 움직이면 그림이 함께 바뀝니다</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {GEO_PROOFS.map((x, k) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setGeo(k)}
              className={
                "rounded-xl border-2 px-2 py-2 text-center text-[12px] font-bold transition " +
                (geo === k ? "border-cyan-400/70 bg-cyan-400/15 text-cyan-100" : "border-white/12 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              <span className="block text-lg">{x.emoji}</span>
              {x.title}
            </button>
          ))}
        </div>
        <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 p-2">
          {geo === 0 ? <SquarePuzzle a={a} b={b} /> : geo === 1 ? <SemiCircle a={a} b={b} /> : <TwoCircles a={a} b={b} />}
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[14px] text-slate-100">
          그림에서 읽히는 부등식 · <PieceLine ps={g.reads} />
        </p>
        <div className="mt-1.5 space-y-1">
          {g.steps.map((s, k) => (
            <p key={k} className="flex flex-wrap items-baseline gap-x-2 rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-7 text-slate-200">
              <span className="shrink-0 font-mono text-[10px] font-bold text-slate-500">{k + 1}</span>
              <PieceLine ps={s} />
            </p>
          ))}
        </div>
        <p className="mt-1.5 rounded-lg bg-emerald-400/10 px-3 py-2 text-[12px] leading-6 text-emerald-100">🟰 등호 · {g.eq}</p>

        <GeoQuiz key={g.id} g={g} picked={quiz[g.id]} onPick={(k) => setQuiz((s) => ({ ...s, [g.id]: k }))} />
      </div>

      {/* 활용 문제 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧮 최솟값 구하기</p>
          <Chips ids={MEAN_USES.map((x) => x.id)} cur={ui} done={MEAN_USES.filter((x) => uses[x.id] === x.answer).map((x) => x.id)} onPick={setUi} />
        </div>
        <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center">
          <p className="text-[11px] font-bold text-slate-400">조건 · {u.cond}</p>
          <p className="mt-1 text-lg font-bold leading-8 text-slate-100">
            <PieceLine ps={u.ask} />
          </p>
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-4">
          {u.choices.map((c, k) => {
            const picked = uses[u.id];
            const good = picked === u.answer && k === u.answer;
            const bad = picked === k && k !== u.answer;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setUses((s) => ({ ...s, [u.id]: k }))}
                disabled={picked === u.answer}
                className={
                  "rounded-xl border-2 px-2 py-2.5 text-[15px] font-bold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                <Katex expr={c} />
              </button>
            );
          })}
        </div>
        {uses[u.id] === u.answer ? (
          <div className="mt-2 space-y-1.5">
            <p className="rounded-lg bg-black/25 px-3 py-2.5 text-center text-[14px] leading-8 text-slate-100">
              <Katex expr={u.setup} />
            </p>
            <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {u.why} 등호는 {u.eqAt} 일 때예요.</p>
            {ui < MEAN_USES.length - 1 ? <NextBtn onClick={() => setUi((k) => k + 1)} /> : null}
          </div>
        ) : uses[u.id] !== undefined ? (
          <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ 두 항의 곱이 일정한지 먼저 확인하고 2√(곱) 을 계산해 보세요.</p>
        ) : null}
      </div>
    </div>
  );
}

function GeoQuiz({ g, picked, onPick }: { g: GeoProof; picked: number | undefined; onPick: (k: number) => void }) {
  const ok = picked === g.quiz.answer;
  return (
    <div className={"mt-2 rounded-xl border-2 p-2.5 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/10" : picked !== undefined ? "border-rose-400/55 bg-rose-400/10" : "border-white/10 bg-white/[0.03]")}>
      <p className="text-[12px] font-bold text-slate-100">❓ {g.quiz.ask}</p>
      <div className="mt-1.5 grid gap-1.5 sm:grid-cols-4">
        {g.quiz.choices.map((c, k) => {
          const good = ok && k === g.quiz.answer;
          const bad = picked === k && k !== g.quiz.answer;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onPick(k)}
              disabled={ok}
              className={
                "rounded-lg border-2 px-2 py-1.5 font-mono text-[12px] font-bold transition disabled:cursor-default " +
                (good
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : bad
                    ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {c}
            </button>
          );
        })}
      </div>
      {ok ? <p className="mt-1.5 text-[12px] leading-6 text-emerald-100">✅ {g.quiz.why}</p> : null}
      {picked !== undefined && !ok ? <p className="mt-1.5 text-[12px] leading-6 text-rose-100">❌ 슬라이더를 움직여 그림의 길이가 어떻게 변하는지 보세요.</p> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ⑤ 코시-슈바르츠
// ══════════════════════════════════════════════════════════════
function CauchyTab() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  const [x, setX] = useState(4);
  const [y, setY] = useState(1);
  const [built, setBuilt] = useState<number[]>([]);
  const [msg, setMsg] = useState("");
  const [ui, setUi] = useState(0);
  const [uses, setUses] = useState<Record<string, number>>({});

  const L = csLeft(a, b, x, y);
  const R = csRight(a, b, x, y);
  const gap = csGap(a, b, x, y);
  const all = csAll();
  const deck = CS_SCATTER.map((k) => all[k]);
  const cleared = built.length === CS_STEPS.length;
  const u = CS_USES[ui];
  const maxV = Math.max(1, L);

  function tap(idx: number) {
    if (cleared || built.includes(idx)) return;
    const item = all[idx];
    if (item.fakeWhy) {
      setMsg(item.fakeWhy);
      return;
    }
    if (idx !== built.length) {
      setMsg(`아직 이 조각의 차례가 아니에요. ${built.length + 1}번째 조각을 찾아보세요.`);
      return;
    }
    setBuilt((s) => [...s, idx]);
    setMsg("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.08] to-sky-500/[0.03] px-4 py-4 text-center">
        <p className="text-[11px] font-bold tracking-widest text-cyan-200/80">코시-슈바르츠 부등식</p>
        <p className="mt-1 text-xl font-bold text-slate-100">
          <Katex expr="(a^2+b^2)(x^2+y^2) \ge (ax+by)^2" />
        </p>
        <p className="mt-1 text-[12px] text-slate-400">
          등호는 <Katex expr="ay = bx" /> 일 때
        </p>
      </div>

      {/* 슬라이더 실험 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🎚️ 네 수를 움직이며 두 변을 견주어 보세요</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <Slider label={<Katex expr="a" />} value={a} min={CS_RANGE.min} max={CS_RANGE.max} step={CS_RANGE.step} onChange={setA} accent="accent-sky-400" />
          <Slider label={<Katex expr="b" />} value={b} min={CS_RANGE.min} max={CS_RANGE.max} step={CS_RANGE.step} onChange={setB} accent="accent-sky-400" />
          <Slider label={<Katex expr="x" />} value={x} min={CS_RANGE.min} max={CS_RANGE.max} step={CS_RANGE.step} onChange={setX} accent="accent-amber-400" />
          <Slider label={<Katex expr="y" />} value={y} min={CS_RANGE.min} max={CS_RANGE.max} step={CS_RANGE.step} onChange={setY} accent="accent-amber-400" />
        </div>
        <div className="mt-2 space-y-1.5 rounded-xl bg-black/25 p-2.5">
          <div className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-right text-[11px] font-bold text-sky-200">
              <Katex expr="(a^2+b^2)(x^2+y^2)" />
            </span>
            <span className="w-14 shrink-0 font-mono text-[13px] font-bold text-slate-100">{nx(L)}</span>
            <div className="h-3 flex-1 rounded-full bg-white/[0.06]">
              <div className="h-3 rounded-full bg-sky-400 transition-all" style={{ width: `${(L / maxV) * 100}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-right text-[11px] font-bold text-amber-200">
              <Katex expr="(ax+by)^2" />
            </span>
            <span className="w-14 shrink-0 font-mono text-[13px] font-bold text-slate-100">{nx(R)}</span>
            <div className="h-3 flex-1 rounded-full bg-white/[0.06]">
              <div className="h-3 rounded-full bg-amber-400 transition-all" style={{ width: `${(R / maxV) * 100}%` }} />
            </div>
          </div>
        </div>
        <p className={"mt-2 rounded-lg px-3 py-2 text-center text-[13px] font-bold " + (gap < 1e-9 ? "bg-emerald-400/20 text-emerald-50" : "bg-black/25 text-slate-200")}>
          차이 <Katex expr="(ay - bx)^2" /> = <span className="font-mono">{nx(gap)}</span>
          {gap < 1e-9 ? <span className="ml-2 text-emerald-200">— ay = bx 라서 등호가 성립해요!</span> : null}
        </p>
        <button
          type="button"
          onClick={() => {
            setX(a * 2);
            setY(b * 2);
          }}
          className="mt-1.5 w-full rounded-lg border border-emerald-400/45 bg-emerald-400/12 px-3 py-1.5 text-[11px] font-bold text-emerald-100 transition hover:bg-emerald-400/22"
        >
          🟰 등호가 되게 맞추기 (x, y) = 2(a, b)
        </button>
      </div>

      {/* 증명 조각 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (cleared ? "border-emerald-400/55 bg-emerald-400/10" : "border-white/10 bg-slate-900/40")}>
        <p className="text-[12px] font-bold text-slate-200">
          🧱 증명을 차례대로 세우세요 <span className="font-mono text-slate-400">({built.length} / {CS_STEPS.length})</span>
        </p>
        <div className="mt-2 space-y-1.5">
          {built.map((idx, k) => (
            <p key={idx} className="flex flex-wrap items-baseline gap-x-2 overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2 text-[13px] leading-8 text-slate-100">
              <span className="shrink-0 font-mono text-[11px] font-bold text-emerald-300">{k + 1}</span>
              <PieceLine ps={all[idx].text} />
            </p>
          ))}
        </div>
        {!cleared ? (
          <div className="mt-2 space-y-1.5">
            {deck.map((item) => {
              if (built.includes(item.idx)) return null;
              return (
                <button
                  key={item.idx}
                  type="button"
                  onClick={() => tap(item.idx)}
                  className="flex w-full items-baseline gap-2 overflow-x-auto overflow-y-hidden rounded-xl border-2 border-white/12 bg-white/[0.04] px-3 py-2.5 text-left text-[13px] font-semibold leading-8 text-slate-100 transition hover:bg-white/10"
                >
                  <span className="shrink-0 text-[11px] text-slate-500">▪</span>
                  <PieceLine ps={item.text} />
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-center text-[12px] font-bold text-emerald-100">
            ✅ 차가 완전제곱꼴 <Katex expr="(ay-bx)^2" /> 이라 늘 0 이상이에요. 등호는 <Katex expr="ay = bx" /> 일 때!
          </p>
        )}
        {msg ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {msg}</p> : null}
        {built.length > 0 && !cleared ? (
          <button
            type="button"
            onClick={() => {
              setBuilt((s) => s.slice(0, -1));
              setMsg("");
            }}
            className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↶ 한 조각 빼기
          </button>
        ) : null}
      </div>

      {/* 활용 문제 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (cleared ? "border-white/10 bg-slate-900/40" : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎯 코시-슈바르츠로 풀어 보기</p>
          <Chips ids={CS_USES.map((c) => c.id)} cur={ui} done={CS_USES.filter((c) => uses[c.id] === c.answer).map((c) => c.id)} onPick={setUi} />
        </div>
        {!cleared ? <p className="mt-2 rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">🔒 증명을 다 세우면 열려요.</p> : null}
        <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center">
          <p className="text-[12px] font-bold text-slate-400">
            조건 · <Katex expr={u.given} />
          </p>
          <p className="mt-1 text-lg font-bold leading-8 text-slate-100">
            <PieceLine ps={u.ask} />
          </p>
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-4">
          {u.choices.map((c, k) => {
            const picked = uses[u.id];
            const good = picked === u.answer && k === u.answer;
            const bad = picked === k && k !== u.answer;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setUses((s) => ({ ...s, [u.id]: k }))}
                disabled={picked === u.answer}
                className={
                  "rounded-xl border-2 px-2 py-2.5 text-[15px] font-bold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                <Katex expr={c} />
              </button>
            );
          })}
        </div>
        {uses[u.id] === u.answer ? (
          <div className="mt-2 space-y-1.5">
            <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2.5 text-center text-[14px] leading-8 text-slate-100">
              <Katex expr={u.setup} />
            </p>
            <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {u.why} 등호는 {u.eqAt} 성립해요.</p>
            {ui < CS_USES.length - 1 ? <NextBtn onClick={() => setUi((k) => k + 1)} /> : null}
          </div>
        ) : uses[u.id] !== undefined ? (
          <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {u.choiceWhy[uses[u.id]]}</p>
        ) : null}
      </div>

      {CS_USES.every((c) => uses[c.id] === c.answer) ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <b className="text-white">제곱의 합</b>과 <b className="text-white">곱의 합</b>이 함께 나오면 코시-슈바르츠를 떠올려 보세요. 계수를 알맞게 골라{" "}
            <Katex expr="(a^2+b^2)(x^2+y^2) \ge (ax+by)^2" /> 에 끼워 넣으면 최댓값·최솟값이 바로 나옵니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
