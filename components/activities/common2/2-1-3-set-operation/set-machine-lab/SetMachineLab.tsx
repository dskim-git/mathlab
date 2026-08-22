"use client";

import { useEffect, useId, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  ALL_REGIONS,
  CHAINS,
  G,
  LAYOUTS,
  LEARN,
  ONES,
  OPS,
  OP_LABEL,
  OP_NAME,
  SLOT_COUNT,
  SRC_LABEL,
  TREES,
  boxRegions,
  boxText,
  machineTex,
  runMachine,
  sameSet,
  type Config,
  type Op,
  type Shape,
  type Task,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "u_input",
    prompt:
      "장치에 전체집합 U 를 넣어 보며 알아낸 것을 정리해 보세요. 여집합 부품이 없는데도 A의 여집합을 만들 수 있었던 까닭도 함께 써 보세요.",
    kind: "text",
    placeholder:
      "예: U는 모든 원소를 담고 있으므로 A ∩ U = A, B ∪ U = U, C − U = ∅ 이 되었다. 여집합은 전체집합에서 그 집합을 뺀 것이므로 U − A 를 실행하면 Aᶜ 가 그대로 나온다. 그래서 ∩, ∪, − 세 가지 연산만 있어도 여집합을 만들 수 있다.",
  },
  {
    id: "two_step",
    prompt:
      "한 단계 장치로는 만들 수 없고 두 단계 장치가 있어야 만들 수 있는 그림이 있었어요. 그런 그림을 하나 떠올려, 어떤 차례로 연산해야 하는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: A와 B가 겹치는 곳에서 C에 걸치는 부분만 뺀 그림은 한 번의 연산으로는 만들 수 없었다. 먼저 A ∩ B 를 만들어 두 원이 겹치는 부분을 구하고, 그 결과를 다시 입력으로 넣어 C를 빼면 원하는 조각 하나만 남는다.",
  },
  {
    id: "same_picture",
    prompt:
      "탭④에서 같은 그림을 서로 다른 장치로 만들어 보았어요. 두 장치가 왜 같은 결과를 내는지 설명하고, 이때 떠오르는 집합의 법칙이 있으면 함께 써 보세요.",
    kind: "text",
    placeholder:
      "예: (A − B) ∪ (B − A) 는 한쪽에만 있는 조각을 각각 구해 합친 것이고, (A ∪ B) − (A ∩ B) 는 둘을 합친 뒤 겹치는 곳을 도려낸 것인데 남는 조각이 똑같다. 또 (A ∩ B) ∪ (A ∩ C) 가 A ∩ (B ∪ C) 와 같은 것은 분배법칙이고, (U − A) ∩ (U − B) 가 (A ∪ B)의 여집합이 되는 것은 드모르간의 법칙이다.",
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
// 벤 다이어그램 — 결과 조각을 색칠한다
// ══════════════════════════════════════════════════════════════
const CIRCLE_COLOR: Record<string, string> = { A: "#38bdf8", B: "#a78bfa", C: "#fbbf24" };
const BIT: Record<string, number> = { A: 1, B: 2, C: 4 };

function circlePath(c: { cx: number; cy: number; r: number }): string {
  return `M${c.cx - c.r},${c.cy} a${c.r},${c.r} 0 1,0 ${2 * c.r},0 a${c.r},${c.r} 0 1,0 ${-2 * c.r},0 Z`;
}

function Venn({ painted, color = "#2f7d6a", small }: { painted: number[] | null; color?: string; small?: boolean }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox={`0 0 ${G.w} ${G.h}`} className={"mx-auto block w-full select-none " + (small ? "max-w-[210px]" : "max-w-[420px]")} role="img" aria-label="벤 다이어그램">
      <defs>
        {G.circles.map((c) => (
          <clipPath key={`in${c.key}`} id={`${u}in${c.key}`}>
            <circle cx={c.cx} cy={c.cy} r={c.r} />
          </clipPath>
        ))}
        {G.circles.map((c) => (
          <clipPath key={`out${c.key}`} id={`${u}out${c.key}`}>
            <path d={`M0,0 H${G.w} V${G.h} H0 Z ${circlePath(c)}`} clipRule="evenodd" />
          </clipPath>
        ))}
      </defs>

      {ALL_REGIONS.map((m) => {
        const on = (painted ?? []).includes(m);
        let node: React.ReactNode = <rect x={G.box.x} y={G.box.y} width={G.box.w} height={G.box.h} rx={G.box.r} fill={on ? color : "transparent"} />;
        for (const c of G.circles) {
          const inside = (m & BIT[c.key]) !== 0;
          node = <g clipPath={`url(#${u}${inside ? "in" : "out"}${c.key})`}>{node}</g>;
        }
        return <g key={m}>{node}</g>;
      })}

      <rect x={G.box.x} y={G.box.y} width={G.box.w} height={G.box.h} rx={G.box.r} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={small ? 4 : 2.5} />
      {G.circles.map((c) => (
        <circle key={c.key} cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke={small ? "rgba(255,255,255,0.75)" : CIRCLE_COLOR[c.key]} strokeWidth={small ? 4 : 2.5} />
      ))}
      {small ? null : (
        <>
          <text x={G.ul.x} y={G.ul.y} textAnchor="middle" className="fill-slate-300 font-serif text-[18px] font-bold italic">
            U
          </text>
          {G.circles.map((c) => (
            <text key={`l${c.key}`} x={c.lx} y={c.ly} textAnchor="middle" fill={CIRCLE_COLOR[c.key]} className="font-serif text-[19px] font-bold italic">
              {c.key}
            </text>
          ))}
        </>
      )}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// 장치 그림
// ══════════════════════════════════════════════════════════════
const WIRE = "rgba(255,255,255,0.3)";
const SLOT_C = "#4ade80";
const OP_C = "#f97316";
const BOX_C = "#fb923c";

function Machine({
  shape,
  cfg,
  ran,
  onSlot,
  onOp,
}: {
  shape: Shape;
  cfg: Config;
  /** 실행했는가 — 실행 전에는 결과 상자가 비어 있다 */
  ran: boolean;
  onSlot: (i: number) => void;
  onOp: (i: number) => void;
}) {
  const L = LAYOUTS[shape];
  return (
    <svg viewBox={`0 0 ${L.w} ${L.h}`} className="mx-auto block w-full max-w-[420px] select-none" role="img" aria-label="집합 연산 장치">
      {L.wires.map((w, i) => (
        <line key={i} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={WIRE} strokeWidth={2} />
      ))}

      {L.slots.map((s, i) => (
        <g key={`s${i}`} className="cursor-pointer" onClick={() => onSlot(i)}>
          <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={8} fill="rgba(74,222,128,0.10)" stroke={SLOT_C} strokeWidth={2.5} />
          <text x={s.x + s.w / 2} y={s.y + s.h / 2 + 8} textAnchor="middle" className="fill-emerald-100 font-serif text-[22px] font-bold italic">
            {SRC_LABEL[cfg.ins[i]]}
          </text>
        </g>
      ))}

      {L.ops.map((o, i) => (
        <g key={`o${i}`} className="cursor-pointer" onClick={() => onOp(i)}>
          <circle cx={o.x} cy={o.y} r={o.r} fill="rgba(249,115,22,0.85)" stroke={OP_C} strokeWidth={2} />
          <text x={o.x} y={o.y + 7} textAnchor="middle" className="fill-white text-[19px] font-bold">
            {OP_LABEL[cfg.ops[i]]}
          </text>
          {/* 합집합 기호 ∪ 와 전체집합 U 를 헷갈리지 않도록 연산 이름을 적어 준다 */}
          <text x={o.x + o.r + 5} y={o.y + 4} className="fill-orange-200 text-[11px] font-bold">
            {OP_NAME[cfg.ops[i]]}
          </text>
        </g>
      ))}

      {L.boxes.map((b, i) => (
        <g key={`b${i}`}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={7} fill={ran ? "rgba(251,146,60,0.12)" : "transparent"} stroke={BOX_C} strokeWidth={2.5} />
          {ran ? (
            <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 6} textAnchor="middle" className="fill-orange-100 text-[16px] font-bold">
              {boxText(shape, cfg, i)}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

/** 장치 한 대를 다루는 상태 */
function useMachine(shape: Shape) {
  const [cfg, setCfg] = useState<Config>(() => ({
    ins: Array.from({ length: SLOT_COUNT[shape] }, () => 1),
    ops: Array.from({ length: LAYOUTS[shape].ops.length }, () => "i" as Op),
  }));
  const [ran, setRan] = useState(false);
  function slot(i: number) {
    setRan(false);
    setCfg((c) => ({ ...c, ins: c.ins.map((v, k) => (k === i ? (v + 1) % 4 : v)) }));
  }
  function op(i: number) {
    setRan(false);
    setCfg((c) => ({ ...c, ops: c.ops.map((v, k) => (k === i ? OPS[(OPS.indexOf(v) + 1) % 3] : v)) }));
  }
  return { cfg, ran, setRan, slot, op };
}

function MachinePanel({
  shape,
  cfg,
  ran,
  slot,
  op,
  onRun,
  note,
}: {
  shape: Shape;
  cfg: Config;
  ran: boolean;
  slot: (i: number) => void;
  op: (i: number) => void;
  onRun: () => void;
  note?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-orange-400/35 bg-orange-500/[0.05] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold text-orange-200">🖥️ 집합 연산 장치</p>
        <span className={"rounded-full px-2.5 py-1 text-[10px] font-bold " + (ran ? "bg-emerald-400/20 text-emerald-100" : "bg-white/8 text-slate-400")}>{ran ? "실행 후" : "실행 전"}</span>
      </div>
      <div className="mt-1 overflow-hidden rounded-xl bg-slate-950/70 p-1">
        <Machine shape={shape} cfg={cfg} ran={ran} onSlot={slot} onOp={op} />
      </div>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        <p className="rounded-lg bg-black/25 px-2 py-1.5 text-center text-[11px] text-slate-300">
          <b className="text-emerald-200">초록 칸 = 집합</b> · 눌러서 U · A · B · C 고르기
        </p>
        <p className="rounded-lg bg-black/25 px-2 py-1.5 text-center text-[11px] text-slate-300">
          <b className="text-orange-200">주황 단추 = 연산</b> · 눌러서 ∩ · ∪ · − 고르기
        </p>
      </div>
      <button
        type="button"
        onClick={onRun}
        disabled={ran}
        className="mt-2 w-full rounded-xl border-2 border-orange-400/60 bg-orange-400/15 px-3 py-2.5 text-sm font-extrabold text-orange-100 transition hover:bg-orange-400/25 disabled:opacity-40"
      >
        {ran ? "실행 완료" : "▶ 실행"}
      </button>
      {note}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
type Tab = "learn" | "one" | "chain" | "tree";

export default function SetMachineLab() {
  const [tab, setTab] = useState<Tab>("learn");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🖥️ 집합 연산 장치</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-emerald-200">U · A · B · C</b> 를 입력하고 <b className="text-orange-200">∩ · ∪ · −</b> 를 골라 <b className="text-white">실행</b>하면, 결과 식이
          나타나고 벤 다이어그램이 색칠돼요. 원하는 그림이 나오도록 장치를 맞춰 봅시다!
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "learn"} onClick={() => setTab("learn")}>
          ① 장치 익히기 🎛️
        </TabButton>
        <TabButton active={tab === "one"} onClick={() => setTab("one")}>
          ② 그림 맞히기 🎯
        </TabButton>
        <TabButton active={tab === "chain"} onClick={() => setTab("chain")}>
          ③ 두 단계 장치 🔗
        </TabButton>
        <TabButton active={tab === "tree"} onClick={() => setTab("tree")}>
          ④ 두 갈래 장치 🌿
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "learn" ? <TaskTab tasks={LEARN} title="🎛️ U 를 넣으면 무슨 일이 생길까요?" learn /> : null}
        {tab === "one" ? <TaskTab tasks={ONES} title="🎯 이 그림이 나오도록 장치를 맞추세요" /> : null}
        {tab === "chain" ? <TaskTab tasks={CHAINS} title="🔗 앞 결과를 다시 입력으로 넣어 보세요" /> : null}
        {tab === "tree" ? <TaskTab tasks={TREES} title="🌿 두 결과를 마지막에 합쳐 보세요" /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 문제 탭 (네 탭이 같은 뼈대를 쓴다)
// ══════════════════════════════════════════════════════════════
function TaskTab({ tasks, title, learn }: { tasks: Task[]; title: string; learn?: boolean }) {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = tasks[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">{title}</p>
          <Chips ids={tasks.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          {learn ? (
            <>
              <b className="text-emerald-200">초록 입력 칸</b> 가운데 하나를 <b className="text-white">전체집합 U</b> 로 두고 실행해, 목표 그림이 나오도록 맞춰 보세요.
              <br />
              <span className="text-slate-400">
                ※ 초록 칸의 <b className="text-emerald-200">U</b>(전체집합)와 주황 단추의 <b className="text-orange-200">∪</b>(합집합)는 서로 다른 것이니 헷갈리지 마세요.
              </span>
            </>
          ) : (
            <>
              오른쪽 <b className="text-emerald-200">목표 그림</b>과 똑같이 색칠되면 성공! 같은 그림이 나오는 장치가 <b className="text-white">여러 가지</b>일 수도 있어요.
            </>
          )}
        </p>
      </div>

      <TaskOne
        key={t.id}
        t={t}
        last={i === tasks.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(tasks.length - 1, k + 1))}
      />

      {done.length === tasks.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 이 탭의 장치를 모두 맞췄어요!</p>
          {learn ? (
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {["A \\cap U = A", "B \\cup U = U", "C - U = \\varnothing", "U - A = A^{C}"].map((x) => (
                <div key={x} className="flex justify-center overflow-x-auto overflow-y-hidden rounded-xl bg-black/25 px-3 py-2 text-slate-100">
                  <Katex expr={x} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-[12px] leading-6 text-slate-300">
              같은 그림이라도 <b className="text-white">장치를 짜는 길은 여러 가지</b>일 수 있어요. 집합의 연산법칙이 바로 그 이야기랍니다.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function TaskOne({ t, last, onDone, onNext }: { t: Task; last: boolean; onDone: () => void; onNext: () => void }) {
  const { cfg, ran, setRan, slot, op } = useMachine(t.shape);
  const [tries, setTries] = useState(0);
  const [showGoalTex, setShowGoalTex] = useState(false);

  const target = runMachine(t.shape, t.goal);
  const result = ran ? runMachine(t.shape, cfg) : null;
  const useOk = t.mustUse === undefined || cfg.ins.includes(t.mustUse);
  const opOk = !t.mustOp || cfg.ops[t.mustOp.idx] === t.mustOp.op;
  /** 그림이 목표와 같은가 — 규칙과는 따로 본다 */
  const pictureOk = ran && result !== null && sameSet(result, target);
  const ruleOk = useOk && opOk;
  const ok = pictureOk && ruleOk;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function run() {
    setRan(true);
    setTries((n) => n + 1);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-4 lg:grid-cols-2">
        <MachinePanel
          shape={t.shape}
          cfg={cfg}
          ran={ran}
          slot={slot}
          op={op}
          onRun={run}
          note={
            <div className="mt-2 space-y-1.5">
              {t.mustUse !== undefined ? (
                <p className={"rounded-lg px-2 py-1.5 text-center text-[11px] font-bold " + (useOk ? "bg-emerald-400/15 text-emerald-100" : "bg-amber-400/15 text-amber-100")}>
                  {useOk
                    ? `✔ 규칙 지킴 — 초록 입력 칸에 전체집합 ${SRC_LABEL[t.mustUse]} 가 들어 있어요`
                    : `⚠ 초록 입력 칸(지금 ${cfg.ins.map((v) => SRC_LABEL[v]).join(" · ")}) 가운데 하나를 전체집합 ${SRC_LABEL[t.mustUse]} 로 바꿔야 해요`}
                </p>
              ) : null}
              {t.mustOp ? (
                <p className={"rounded-lg px-2 py-1.5 text-center text-[11px] font-bold " + (opOk ? "bg-emerald-400/15 text-emerald-100" : "bg-amber-400/15 text-amber-100")}>
                  {opOk ? "✔ 규칙 지킴 — 마지막 연산이 − 예요" : `⚠ 마지막 연산은 ${OP_LABEL[t.mustOp.op]} (${OP_NAME[t.mustOp.op]}) 여야 해요`}
                </p>
              ) : null}
              {ran ? (
                <p
                  className={
                    "rounded-lg px-2 py-2 text-center text-[12px] font-bold " +
                    (ok ? "bg-emerald-400/20 text-emerald-100" : pictureOk ? "bg-amber-400/20 text-amber-100" : "bg-rose-400/15 text-rose-100")
                  }
                >
                  {ok
                    ? "✅ 목표 그림과 똑같아요!"
                    : pictureOk
                      ? t.mustUse !== undefined && !useOk
                        ? `🟡 그림은 똑같아요! 다만 초록 입력 칸에 전체집합 ${SRC_LABEL[t.mustUse]} 를 넣어야 해요`
                        : "🟡 그림은 똑같아요! 다만 위의 규칙을 아직 지키지 않았어요"
                      : "❌ 목표 그림과 달라요 — 입력이나 연산을 바꿔 보세요"}
                </p>
              ) : (
                <p className="rounded-lg bg-black/25 px-2 py-2 text-center text-[11px] text-slate-400">실행을 눌러야 결과가 나와요</p>
              )}
            </div>
          }
        />

        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-emerald-400/35 bg-emerald-400/[0.06] p-3">
            <p className="text-center text-[11px] font-bold text-emerald-200">🎯 목표 그림</p>
            <div className="mt-1 overflow-hidden rounded-xl bg-slate-950/70 p-1">
              <Venn painted={target} />
            </div>
            {target.length === 0 ? (
              <p className="mt-1 text-center text-[11px] font-bold text-amber-200">※ 아무 조각도 칠해지지 않은 그림 — 빈 집합이에요</p>
            ) : null}
            {target.length === ALL_REGIONS.length ? (
              <p className="mt-1 text-center text-[11px] font-bold text-amber-200">※ 모든 조각이 칠해진 그림 — 전체집합이에요</p>
            ) : null}
          </div>

          <div
            className={
              "rounded-2xl border-2 p-3 transition " +
              (ok ? "border-emerald-400/55 bg-emerald-400/12" : pictureOk ? "border-amber-400/55 bg-amber-400/[0.08]" : "border-white/10 bg-white/5")
            }
          >
            <p className="text-center text-[11px] font-bold text-slate-400">🖨️ 장치가 내놓은 그림</p>
            <div className="mt-1 overflow-hidden rounded-xl bg-slate-950/70 p-1">
              {ran ? <Venn painted={result} color="#3b82f6" /> : <div className="flex h-[150px] items-center justify-center text-[12px] text-slate-600">실행 전이에요</div>}
            </div>
            {ran ? (
              <div className="mt-1.5 flex justify-center overflow-x-auto overflow-y-hidden py-1 text-lg text-slate-100">
                <Katex expr={machineTex(t.shape, cfg)} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {ok ? (
        <>
          {t.discover ? (
            <div className="rounded-2xl border-2 border-amber-400/55 bg-amber-400/12 px-4 py-3 text-center">
              <p className="text-[11px] font-bold text-amber-200">✨ 알아낸 것</p>
              <div className="mt-1 flex justify-center overflow-x-auto overflow-y-hidden py-1 text-2xl text-amber-100">
                <Katex expr={t.discover} />
              </div>
            </div>
          ) : null}
          <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">
            💡 {t.tip}
            <span className="ml-2 text-emerald-300/80">(실행 {tries}번)</span>
          </p>
          {!last ? <NextBtn onClick={onNext} /> : null}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setShowGoalTex((v) => !v)}
            className="w-full rounded-xl border border-amber-400/45 bg-amber-400/10 px-3 py-2 text-[12px] font-bold text-amber-100 transition hover:bg-amber-400/20"
          >
            💡 목표를 식으로 {showGoalTex ? "숨기기" : "보기"}
          </button>
          {showGoalTex ? (
            <div className="flex justify-center overflow-x-auto overflow-y-hidden rounded-lg bg-amber-400/12 px-3 py-2 text-lg text-amber-100">
              <Katex expr={machineTex(t.shape, t.goal)} />
            </div>
          ) : null}
          <StepPreview shape={t.shape} cfg={cfg} ran={ran} />
        </>
      )}
    </div>
  );
}

/** 실행한 뒤 중간 결과가 어떤 그림인지 단계별로 보여 준다 */
function StepPreview({ shape, cfg, ran }: { shape: Shape; cfg: Config; ran: boolean }) {
  if (!ran || shape === "one") return null;
  const boxes = LAYOUTS[shape].boxes;
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
      <p className="text-[11px] font-bold text-slate-400">🔍 단계마다 어떤 그림이었을까요</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        {boxes.map((_, i) => (
          <div key={i} className="text-center">
            <div className="overflow-hidden rounded-lg bg-slate-950/70 p-1">
              <Venn painted={boxRegions(shape, cfg, i)} color="#3b82f6" small />
            </div>
            <p className="mt-1 font-mono text-[12px] text-slate-200">{boxText(shape, cfg, i)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
