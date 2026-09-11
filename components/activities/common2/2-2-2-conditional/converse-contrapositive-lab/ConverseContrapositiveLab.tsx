"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  APPLIES,
  COMBOS,
  CONVS,
  EASY_TAIL,
  FORM_LABEL,
  FORM_TEX,
  GAME_U,
  GOALS,
  PICKS,
  PRESETS,
  P_CARDS,
  Q_CARDS,
  REL_LABEL,
  SIM,
  buildSentence,
  cardById,
  comboOf,
  formOf,
  isSubset,
  outside,
  pairTruth,
  relOf,
  sameNums,
  shuffled,
  solveGame,
  truthSetOf,
  truthsOf,
  type ApplyTask,
  type ComboId,
  type ConvTask,
  type Form,
  type GameCard,
  type PickTask,
  type Piece,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "make_them",
    prompt:
      "명제 p → q 에서 역과 대우를 만드는 방법을, 탭①에서 돌려 본 두 개의 스위치(자리 바꾸기 · 둘 다 부정하기)로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 가정과 결론의 자리만 바꾸면 역 q → p 가 되고, 자리를 바꾼 뒤 둘 다 부정하면 대우 ~q → ~p 가 된다. 자리를 그대로 두고 둘 다 부정하면 이 ~p → ~q 다. 스위치를 두 번 누르면 원래대로 돌아오므로 역의 역과 대우의 대우는 자기 자신이다.",
  },
  {
    id: "why_same",
    prompt:
      "명제와 대우는 참·거짓이 항상 같은데 명제와 역은 그렇지 않아요. 탭②의 두 원을 움직여 본 경험과 진리집합으로 그 까닭을 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: p → q 가 참인 것은 P ⊂ Q 와 같은 말이고, 대우가 참인 것은 Qᶜ ⊂ Pᶜ 와 같은 말인데 이 둘은 같은 조건이다. 작은 원이 큰 원 안에 있으면 큰 원 밖은 반드시 작은 원 밖이기 때문이다. 반면 역이 참인 것은 Q ⊂ P 라서 P ⊂ Q 와 아무 상관이 없다. 실제로 두 원을 움직여 네 가지 조합을 모두 만들 수 있었다.",
  },
  {
    id: "which_easier",
    prompt:
      "탭③에서 어떤 명제는 대우로 따지는 것이 훨씬 편했어요. 어떤 경우에 대우로 바꿔 보는 것이 좋은지, 기억에 남는 예를 들어 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 가정을 식으로 옮기기 어려울 때 대우로 바꾸면 좋다. 「n²이 짝수이면 n은 짝수이다」는 n²이 짝수라는 가정에서 n 을 알아내기 어렵지만, 대우인 「n이 홀수이면 n²은 홀수이다」는 n = 2k+1 로 바로 놓고 계산할 수 있었다. 「적어도 하나는」이나 「모두」가 든 결론도 부정하면 다루기 쉬워진다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "make" | "sim" | "pick" | "game";

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
    <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5">
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

function TFButtons({ value, answer, locked, onPick, labels }: { value: boolean | null; answer: boolean; locked: boolean; onPick: (v: boolean) => void; labels?: [string, string] }) {
  const [yes, no] = labels ?? ["참 ⭕", "거짓 ❌"];
  return (
    <div className="grid grid-cols-2 gap-2">
      {[true, false].map((v) => {
        const on = value === v;
        const good = locked && v === answer;
        const bad = on && v !== answer;
        return (
          <button
            key={String(v)}
            type="button"
            onClick={() => onPick(v)}
            disabled={locked}
            className={
              "rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : bad
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            {v ? yes : no}
          </button>
        );
      })}
    </div>
  );
}

const FORM_TONE: Record<Form, { ring: string; soft: string; text: string; dot: string }> = {
  origin: { ring: "border-teal-400/60", soft: "bg-teal-400/12", text: "text-teal-100", dot: "#2dd4bf" },
  converse: { ring: "border-rose-400/60", soft: "bg-rose-400/12", text: "text-rose-100", dot: "#fb7185" },
  inverse: { ring: "border-indigo-400/60", soft: "bg-indigo-400/12", text: "text-indigo-100", dot: "#818cf8" },
  contra: { ring: "border-emerald-400/60", soft: "bg-emerald-400/12", text: "text-emerald-100", dot: "#34d399" },
};

const ABC = ["①", "②", "③", "④"];

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function ConverseContrapositiveLab() {
  const [tab, setTab] = useState<Tab>("make");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔁 명제의 역과 대우</h3>
        <p className="mt-2 leading-7 text-slate-300">
          스위치 두 개로 <b className="text-rose-200">역</b>·<b className="text-emerald-200">대우</b>를 만들고, 두 진리집합을 움직여
          <b className="text-white"> 명제와 대우는 왜 늘 같은 값</b>인지 직접 확인해요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "make"} onClick={() => setTab("make")}>
          ① 역·대우 조립기 🔁
        </TabButton>
        <TabButton active={tab === "sim"} onClick={() => setTab("sim")}>
          ② 두 원 실험실 🔬
        </TabButton>
        <TabButton active={tab === "pick"} onClick={() => setTab("pick")}>
          ③ 어느 쪽이 편할까 ⚖️
        </TabButton>
        <TabButton active={tab === "game"} onClick={() => setTab("game")}>
          ④ 명제 카드게임 🃏
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "make" ? <MakeTab /> : null}
        {tab === "sim" ? <SimTab /> : null}
        {tab === "pick" ? <PickTab /> : null}
        {tab === "game" ? <GameTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 역·대우 조립기
// ══════════════════════════════════════════════════════════════
/** 네 명제의 관계도 — 가로는 역, 대각선은 대우 */
function FormMap({ active }: { active: Form }) {
  const box = (f: Form, x: number, y: number) => {
    const on = f === active;
    return (
      <g key={f}>
        <rect
          x={x}
          y={y}
          width={168}
          height={50}
          rx={10}
          fill={on ? FORM_TONE[f].dot + "33" : "rgba(255,255,255,0.04)"}
          stroke={on ? FORM_TONE[f].dot : "rgba(148,163,184,0.35)"}
          strokeWidth={on ? 3 : 1.5}
        />
        <text x={x + 84} y={y + 24} textAnchor="middle" className="text-[13px] font-bold" fill={on ? FORM_TONE[f].dot : "rgba(203,213,225,0.75)"}>
          {FORM_LABEL[f]}
        </text>
        <foreignObject x={x} y={y + 26} width={168} height={22}>
          <div className="flex items-center justify-center text-[13px]" style={{ color: on ? "#e2e8f0" : "rgba(148,163,184,0.9)" }}>
            <Katex expr={FORM_TEX[f]} />
          </div>
        </foreignObject>
      </g>
    );
  };
  const L = "rgba(148,163,184,0.4)";
  return (
    <svg viewBox="0 0 460 210" className="mx-auto block w-full max-w-[440px] select-none" role="img" aria-label="명제 · 역 · 이 · 대우의 관계도">
      {box("origin", 14, 16)}
      {box("converse", 278, 16)}
      {box("inverse", 14, 144)}
      {box("contra", 278, 144)}
      {/* 가로 = 역 */}
      <line x1={186} y1={41} x2={272} y2={41} stroke={L} strokeWidth={2} markerStart="url(#cc-a)" markerEnd="url(#cc-a)" />
      <line x1={186} y1={169} x2={272} y2={169} stroke={L} strokeWidth={2} markerStart="url(#cc-a)" markerEnd="url(#cc-a)" />
      <text x={229} y={35} textAnchor="middle" className="fill-rose-300 text-[12px] font-bold">
        역
      </text>
      <text x={229} y={163} textAnchor="middle" className="fill-rose-300 text-[12px] font-bold">
        역
      </text>
      {/* 대각선 = 대우 */}
      <line x1={186} y1={58} x2={272} y2={150} stroke={L} strokeWidth={2} strokeDasharray="5 4" />
      <line x1={186} y1={150} x2={272} y2={58} stroke={L} strokeWidth={2} strokeDasharray="5 4" />
      <rect x={200} y={94} width={58} height={20} rx={6} fill="#0f172a" />
      <text x={229} y={109} textAnchor="middle" className="fill-emerald-300 text-[12px] font-bold">
        대우
      </text>
      <defs>
        <marker id="cc-a" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
          <path d="M7,3.5 L0,0 L0,7 z" fill={L} />
        </marker>
      </defs>
    </svg>
  );
}

function MakeTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = CONVS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔁 스위치 두 개로 역과 대우를 만들어요</p>
          <Chips ids={CONVS.map((c) => c.id)} cur={i} done={done} onPick={setI} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <b className="text-rose-200">🔄 자리 바꾸기</b> 만 → <b className="text-rose-200">역</b> <Katex expr="q \to p" />
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <b className="text-rose-200">자리 바꾸기</b> + <b className="text-violet-200">🚫 둘 다 부정</b> → <b className="text-emerald-200">대우</b>{" "}
            <Katex expr="\sim q \to \sim p" />
          </p>
        </div>
      </div>

      <MakeOne
        key={t.id}
        t={t}
        last={i === CONVS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(CONVS.length - 1, k + 1))}
      />

      {done.length === CONVS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 명제의 역과 대우를 모두 만들었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
            스위치를 한 번 더 누르면 원래대로 돌아와요. 그래서 <b className="text-white">역의 역은 자기 자신</b>, <b className="text-white">대우의 대우도 자기 자신</b> 이랍니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function MakeOne({ t, last, onDone, onNext }: { t: ConvTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [swap, setSwap] = useState(false);
  const [neg, setNeg] = useState(false);
  const [stage, setStage] = useState<0 | 1 | 2>(0); // 0: 역 만들기, 1: 대우 만들기, 2: 끝
  const [wrong, setWrong] = useState("");
  const [tip, setTip] = useState(false);

  const form = formOf(swap, neg);
  const target: Form = stage === 0 ? "converse" : "contra";

  const doneRef = useRef(false);
  useEffect(() => {
    if (stage === 2 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function judge() {
    if (form === target) {
      setWrong("");
      setStage((s) => (s === 0 ? 1 : 2) as 0 | 1 | 2);
      if (stage === 0) {
        setSwap(false);
        setNeg(false);
      }
      return;
    }
    if (form === "origin") setWrong("아직 원래 명제 그대로예요. 스위치를 눌러 보세요.");
    else if (form === "converse") setWrong("이건 역이에요. 대우가 되려면 부정 스위치도 함께 켜야 해요.");
    else if (form === "inverse") setWrong("자리를 바꾸지 않고 부정만 했어요. 이것은 「이」랍니다.");
    else setWrong("이건 대우예요. 역은 자리만 바꾸면 됩니다.");
  }

  return (
    <div className="space-y-3">
      {/* 원래 명제 */}
      <div className="rounded-2xl border-2 border-teal-400/35 bg-gradient-to-br from-teal-500/[0.10] to-cyan-500/[0.04] px-4 py-3 text-center">
        <p className="text-[11px] font-bold tracking-widest text-teal-200/80">
          원래 명제 <Katex expr="p \to q" />
        </p>
        <p className="mt-1 text-lg font-bold leading-8 text-slate-100">
          <PieceLine ps={buildSentence(t, false, false)} />
          <span>.</span>
        </p>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-bold">
          <span className="rounded-lg bg-black/30 px-2 py-1 text-sky-200">
            <i className="font-serif italic">p</i> : <PieceLine ps={t.pName} />
          </span>
          <span className="rounded-lg bg-black/30 px-2 py-1 text-amber-200">
            <i className="font-serif italic">q</i> : <PieceLine ps={t.qName} />
          </span>
        </div>
      </div>

      {/* 스위치 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (stage === 2 ? "border-emerald-400/55 bg-emerald-400/10" : "border-white/10 bg-slate-900/40")}>
        <p className="text-[12px] font-bold text-slate-200">
          {stage === 0 ? "1단계 · " : stage === 1 ? "2단계 · " : "완성 · "}
          {stage === 2 ? (
            "역과 대우를 모두 만들었어요. 스위치를 자유롭게 돌려 보세요."
          ) : (
            <>
              이 명제의 <b className={stage === 0 ? "text-rose-200" : "text-emerald-200"}>{stage === 0 ? "역" : "대우"}</b> 을 만드세요.
            </>
          )}
        </p>

        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setSwap((v) => !v);
              setWrong("");
            }}
            className={
              "flex items-center justify-between gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition " +
              (swap ? "border-rose-400/70 bg-rose-400/18 text-rose-100" : "border-white/12 bg-white/[0.04] text-slate-300 hover:bg-white/10")
            }
          >
            <span>🔄 자리 바꾸기</span>
            <span className={"rounded-full px-2 py-0.5 text-[11px] " + (swap ? "bg-rose-400/30" : "bg-white/10 text-slate-400")}>{swap ? "켬" : "끔"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setNeg((v) => !v);
              setWrong("");
            }}
            className={
              "flex items-center justify-between gap-2 rounded-xl border-2 px-3 py-3 text-sm font-bold transition " +
              (neg ? "border-violet-400/70 bg-violet-400/18 text-violet-100" : "border-white/12 bg-white/[0.04] text-slate-300 hover:bg-white/10")
            }
          >
            <span>🚫 둘 다 부정하기</span>
            <span className={"rounded-full px-2 py-0.5 text-[11px] " + (neg ? "bg-violet-400/30" : "bg-white/10 text-slate-400")}>{neg ? "켬" : "끔"}</span>
          </button>
        </div>

        {/* 조립 결과 */}
        <div className={"mt-2.5 rounded-xl border-2 px-4 py-4 text-center transition " + FORM_TONE[form].ring + " " + FORM_TONE[form].soft}>
          <p className={"text-[11px] font-bold tracking-widest " + FORM_TONE[form].text}>
            {FORM_LABEL[form]} <Katex expr={FORM_TEX[form]} />
          </p>
          <p className="mt-1.5 text-lg font-bold leading-8 text-slate-100">
            <PieceLine ps={buildSentence(t, swap, neg)} />
            <span>.</span>
          </p>
        </div>

        {stage < 2 ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <TipBox text={t.tip} open={tip} onOpen={() => setTip(true)} />
            <button
              type="button"
              onClick={judge}
              className="rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
            >
              {stage === 0 ? "이게 역이에요! 🔁" : "이게 대우예요! 🔁"}
            </button>
          </div>
        ) : null}
        {wrong ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {wrong}</p> : null}
      </div>

      {stage >= 1 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-rose-400/45 bg-rose-400/10 px-3 py-2.5 text-center">
            <p className="text-[11px] font-bold text-rose-200">
              역 <Katex expr="q \to p" />
            </p>
            <p className="mt-1 text-[13px] font-bold leading-7 text-slate-100">
              <PieceLine ps={buildSentence(t, true, false)} />
              <span>.</span>
            </p>
          </div>
          <div className={"rounded-xl border-2 px-3 py-2.5 text-center " + (stage === 2 ? "border-emerald-400/45 bg-emerald-400/10" : "border-white/10 bg-white/[0.03] opacity-40")}>
            <p className="text-[11px] font-bold text-emerald-200">
              대우 <Katex expr="\sim q \to \sim p" />
            </p>
            <p className="mt-1 text-[13px] font-bold leading-7 text-slate-100">
              {stage === 2 ? (
                <>
                  <PieceLine ps={buildSentence(t, true, true)} />
                  <span>.</span>
                </>
              ) : (
                <span className="text-slate-600">아직이에요</span>
              )}
            </p>
          </div>
        </div>
      ) : null}

      {stage === 2 ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <FormMap active={form} />
          <p className="text-center text-[11px] leading-5 text-slate-400">지금 만들어진 명제가 관계도에서 빛나요. 스위치를 돌려 네 자리를 모두 들러 보세요.</p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">✅ {t.why}</p>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 두 원 실험실
// ══════════════════════════════════════════════════════════════
function SimBoard({ qx, qy, qr, svgRef, onGrab }: { qx: number; qy: number; qr: number; svgRef: React.Ref<SVGSVGElement>; onGrab: () => void }) {
  const P = SIM.P;
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIM.w} ${SIM.h}`}
        className="mx-auto block w-full max-w-[480px] touch-none select-none"
        role="img"
        aria-label="두 진리집합의 위치 관계"
      >
        <rect x={SIM.box.x} y={SIM.box.y} width={SIM.box.w} height={SIM.box.h} rx={SIM.box.r} fill="rgba(255,255,255,0.03)" stroke="rgba(148,163,184,0.5)" strokeWidth={2} />
        <text x={30} y={34} textAnchor="middle" className="fill-slate-400 font-serif text-[17px] font-bold italic">
          U
        </text>
        <circle cx={P.cx} cy={P.cy} r={P.r} fill="rgba(56,189,248,0.16)" stroke="#38bdf8" strokeWidth={3} />
        <circle
          cx={qx}
          cy={qy}
          r={qr}
          fill="rgba(251,191,36,0.14)"
          stroke="#fbbf24"
          strokeWidth={3}
          className="cursor-grab"
          onPointerDown={(e) => {
            e.preventDefault();
            onGrab();
          }}
        />
        <text x={P.cx} y={P.cy - P.r + 20} textAnchor="middle" fill="#38bdf8" className="font-serif text-[18px] font-bold italic">
          P
        </text>
        <text x={qx} y={qy - qr + 20} textAnchor="middle" fill="#fbbf24" className="font-serif text-[18px] font-bold italic">
          Q
        </text>
        <g
          className="cursor-grab"
          onPointerDown={(e) => {
            e.preventDefault();
            onGrab();
          }}
        >
          <circle cx={qx} cy={qy} r={14} fill="transparent" />
          <circle cx={qx} cy={qy} r={6} fill="#fbbf24" stroke="#0f172a" strokeWidth={2} />
        </g>
      </svg>
    </div>
  );
}

function LampCard({ f, on }: { f: Form; on: boolean }) {
  const tone = FORM_TONE[f];
  return (
    <div className={"rounded-xl border-2 p-2 text-center transition " + (on ? tone.ring + " " + tone.soft : "border-white/10 bg-white/[0.02]")}>
      <p className={"text-[11px] font-bold " + (on ? tone.text : "text-slate-500")}>{FORM_LABEL[f]}</p>
      <p className="mt-0.5 text-[13px] text-slate-200">
        <Katex expr={FORM_TEX[f]} />
      </p>
      <p className={"mt-1 rounded-lg py-1 text-[13px] font-extrabold " + (on ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/15 text-rose-100")}>{on ? "참" : "거짓"}</p>
    </div>
  );
}

function SimTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [q, setQ] = useState({ x: SIM.init.cx, y: SIM.init.cy, r: SIM.init.r });
  const [seen, setSeen] = useState<ComboId[]>([]);
  const [applyIdx, setApplyIdx] = useState(0);
  const [applyDone, setApplyDone] = useState<string[]>([]);
  const dragRef = useRef(false);
  // 포인터 콜백에서 최신 Q 를 읽기 위한 거울 (갱신 함수 안에서 다른 setState 를 부르지 않기 위해)
  const qRef = useRef(q);

  const rel = relOf(q.x, q.y, q.r);
  const truths = truthsOf(rel);
  const combo = comboOf(rel);
  const found = seen.length === 4;

  // 현재 조합을 기록 (포인터 이벤트 콜백 안에서 호출되므로 effect 가 아니다)
  function mark(x: number, y: number, r: number) {
    const c = comboOf(relOf(x, y, r));
    setSeen((s) => (s.includes(c) ? s : [...s, c]));
  }

  function clampQ(x: number, y: number, r: number) {
    const b = SIM.box;
    const nx = Math.max(b.x + r + 4, Math.min(b.x + b.w - r - 4, x));
    const ny = Math.max(b.y + r + 4, Math.min(b.y + b.h - r - 4, y));
    return { x: nx, y: ny, r };
  }

  useEffect(() => {
    qRef.current = q;
  });

  useEffect(() => {
    function move(e: PointerEvent) {
      if (!dragRef.current) return;
      const svg = svgRef.current;
      if (!svg) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const px = ((e.clientX - rect.left) * SIM.w) / rect.width;
      const py = ((e.clientY - rect.top) * SIM.h) / rect.height;
      const next = clampQ(px, py, qRef.current.r);
      qRef.current = next;
      setQ(next);
      mark(next.x, next.y, next.r);
    }
    function up() {
      dragRef.current = false;
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  function setRadius(r: number) {
    const next = clampQ(qRef.current.x, qRef.current.y, r);
    qRef.current = next;
    setQ(next);
    mark(next.x, next.y, next.r);
  }
  function preset(p: { cx: number; cy: number; r: number }) {
    const next = clampQ(p.cx, p.cy, p.r);
    qRef.current = next;
    setQ(next);
    mark(next.x, next.y, next.r);
  }

  const rows: { id: ComboId; label: string }[] = COMBOS.map((c) => ({ id: c.id, label: c.label }));
  const at = APPLIES[applyIdx];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🔬 노란 원 Q 를 끌고 크기를 바꿔 보세요</p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          파란 원 <Katex expr="P" /> 는 고정되어 있어요. 네 명제의 참·거짓이 어떻게 움직이는지 지켜보세요.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <SimBoard
            qx={q.x}
            qy={q.y}
            qr={q.r}
            svgRef={svgRef}
            onGrab={() => {
              dragRef.current = true;
            }}
          />
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] font-bold text-slate-200">
                <Katex expr="Q" /> 의 크기
              </p>
              <span className="rounded-lg bg-black/30 px-2.5 py-1 text-[12px] font-bold text-amber-100">{REL_LABEL[rel]}</span>
            </div>
            <input
              type="range"
              min={SIM.qMin}
              max={SIM.qMax}
              step={1}
              value={q.r}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="mt-1.5 w-full accent-amber-400"
              aria-label="진리집합 Q 의 반지름"
            />
            <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => preset(p)}
                  className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <LampCard f="origin" on={truths.origin} />
            <LampCard f="converse" on={truths.converse} />
            <LampCard f="inverse" on={truths.inverse} />
            <LampCard f="contra" on={truths.contra} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[12px] font-bold text-slate-200">
              🎯 미션 · <b className="text-cyan-200">명제와 역의 참·거짓 조합 네 가지</b>를 모두 만들어 보세요
            </p>
            <div className="mt-2 space-y-1.5">
              {COMBOS.map((c) => {
                const got = seen.includes(c.id);
                const now = combo === c.id;
                return (
                  <div
                    key={c.id}
                    className={
                      "flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 transition " +
                      (now ? "border-cyan-400/70 bg-cyan-400/15" : got ? "border-emerald-400/45 bg-emerald-400/10" : "border-white/10 bg-white/[0.03]")
                    }
                  >
                    <span className={"text-[12px] font-bold " + (got ? "text-emerald-100" : "text-slate-400")}>
                      {got ? "✅" : "⬜"} {c.label}
                    </span>
                    {got ? null : <span className="text-[11px] text-slate-500">{c.hint}</span>}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-center font-mono text-[12px] font-bold text-slate-400">{seen.length} / 4</p>
          </div>
        </div>
      </div>

      {/* 기록표 */}
      {seen.length >= 1 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="text-[12px] font-bold text-slate-200">📊 만들어 본 상황만 채워지는 기록표</p>
          <div className="mt-2 overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[420px] text-center text-[12px]">
              <thead>
                <tr className="text-[11px] text-slate-400">
                  <th className="px-2 py-1.5 text-left font-semibold">상황</th>
                  {(["origin", "converse", "inverse", "contra"] as Form[]).map((f) => (
                    <th key={f} className="px-2 py-1.5 font-semibold" style={{ color: FORM_TONE[f].dot }}>
                      {FORM_LABEL[f]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const got = seen.includes(r.id);
                  const tt = { origin: r.id[0] === "T", converse: r.id[1] === "T", inverse: r.id[1] === "T", contra: r.id[0] === "T" };
                  return (
                    <tr key={r.id} className="border-t border-white/10">
                      <td className="whitespace-nowrap px-2 py-1.5 text-left text-slate-300">{r.label}</td>
                      {(["origin", "converse", "inverse", "contra"] as Form[]).map((f) => (
                        <td key={f} className="px-2 py-1.5">
                          <span
                            className={
                              "inline-flex h-6 w-6 items-center justify-center rounded font-mono text-[11px] font-bold " +
                              (!got ? "bg-white/5 text-slate-700" : tt[f] ? "bg-emerald-400/25 text-emerald-100" : "bg-rose-400/20 text-rose-100")
                            }
                          >
                            {got ? (tt[f] ? "T" : "F") : "·"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">두 열이 통째로 똑같은 짝을 찾아보세요. 그리고 「원래 명제」 열과 「역」 열에 네 가지 조합이 다 나오는지도요.</p>
        </div>
      ) : null}

      {found ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 가지를 모두 만들었어요!</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-black/25 px-3 py-2.5 text-center">
              <p className="text-[12px] font-bold text-emerald-200">명제 ↔ 대우 · 언제나 같은 값</p>
              <p className="mt-1 text-[12px] leading-7 text-slate-300">
                <Katex expr="P \subset Q" /> <span className="mx-1 text-slate-500">⟺</span> <Katex expr="Q^c \subset P^c" />
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">작은 원이 큰 원 안에 있으면 큰 원 밖은 늘 작은 원 밖</p>
            </div>
            <div className="rounded-xl bg-black/25 px-3 py-2.5 text-center">
              <p className="text-[12px] font-bold text-rose-200">명제 ↔ 역 · 아무 관계 없음</p>
              <p className="mt-1 text-[12px] leading-7 text-slate-300">
                <Katex expr="P \subset Q" /> <span className="mx-1 text-slate-500">와</span> <Katex expr="Q \subset P" />
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">네 가지 조합이 모두 실제로 일어났어요</p>
            </div>
          </div>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
            ※ 역과 이도 서로 대우 관계라 <b className="text-white">역과 이는 참·거짓이 일치</b> 해요.
          </p>
        </div>
      ) : null}

      {/* 적용 퀴즈 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (found ? "border-violet-400/35 bg-violet-400/[0.07]" : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-bold text-slate-200">🧩 적용 · 주어진 명제가 참일 때 항상 참인 것은?</p>
          <Chips ids={APPLIES.map((a) => a.id)} cur={applyIdx} done={applyDone} onPick={setApplyIdx} />
        </div>
        {found ? (
          <ApplyOne
            key={at.id}
            t={at}
            last={applyIdx === APPLIES.length - 1}
            onDone={() => setApplyDone((s) => (s.includes(at.id) ? s : [...s, at.id]))}
            onNext={() => setApplyIdx((k) => Math.min(APPLIES.length - 1, k + 1))}
          />
        ) : (
          <p className="mt-2 rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">🔒 네 가지 조합을 모두 만들어 보면 열려요.</p>
        )}
      </div>
    </div>
  );
}

function ApplyOne({ t, last, onDone, onNext }: { t: ApplyTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const ok = pick !== null && pick === t.answer;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="mt-2 space-y-2">
      <div className="rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-center">
        <p className="text-[11px] font-bold tracking-widest text-slate-500">참이라고 주어진 명제</p>
        <p className="mt-1 text-2xl font-bold text-slate-100">
          <Katex expr={t.given} />
        </p>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {t.choices.map((c, k) => {
          const on = pick === k;
          const good = ok && k === t.answer;
          const bad = on && k !== t.answer;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setPick(k)}
              disabled={ok}
              className={
                "flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-lg font-bold transition disabled:cursor-default " +
                (good
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : bad
                    ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              <span className="font-mono text-[13px] text-slate-400">{ABC[k]}</span>
              <Katex expr={c} />
            </button>
          );
        })}
      </div>
      {ok ? (
        <div className="space-y-1.5">
          <p className="rounded-lg bg-emerald-400/10 px-3 py-2 text-center text-[12px] leading-6 text-emerald-100">
            ✅ 대우예요. 자리를 바꾸고 둘 다 부정했지요. 명제와 대우는 참·거짓이 일치하므로 항상 참이에요.
          </p>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
      {pick !== null && !ok ? <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {t.choiceWhy[pick]}</p> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 어느 쪽이 편할까
// ══════════════════════════════════════════════════════════════
function PickTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = PICKS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">⚖️ 원래 명제와 대우 중 따지기 쉬운 쪽을 고르세요</p>
          <Chips ids={PICKS.map((p) => p.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
          명제와 대우는 <b className="text-white">참·거짓이 언제나 같아요</b>. 그러니 둘 중 <b className="text-emerald-200">편한 쪽으로 따져도</b> 결론은 똑같습니다.
        </p>
      </div>

      <PickOne
        key={t.id}
        t={t}
        last={i === PICKS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(PICKS.length - 1, k + 1))}
      />

      {done.length === PICKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 명제를 모두 판정했어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <p className="rounded-xl bg-black/25 px-3 py-2.5 text-[12px] leading-7 text-slate-300">
              <b className="text-emerald-200">대우로 바꾸면 좋을 때</b>
              <br />· 가정을 식으로 옮기기 어려울 때
              <br />· 결론에 「모두」나 「적어도 하나」가 있을 때
            </p>
            <p className="rounded-xl bg-black/25 px-3 py-2.5 text-[12px] leading-7 text-slate-300">
              <b className="text-sky-200">원래 명제가 편할 때</b>
              <br />· 가정을 식으로 바로 쓸 수 있을 때
              <br />· 가정을 만족하는 수를 쉽게 나열할 수 있을 때
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PickOne({ t, last, onDone, onNext }: { t: PickTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [side, setSide] = useState<"origin" | "contra" | null>(null);
  const [truth, setTruth] = useState<boolean | null>(null);

  const step1 = side !== null && side === t.easier;
  const step2 = step1 && truth !== null && truth === t.truth;

  const doneRef = useRef(false);
  useEffect(() => {
    if (step2 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const card = (which: "origin" | "contra") => {
    const on = side === which;
    const good = step1 && which === t.easier;
    const bad = on && which !== t.easier;
    return (
      <button
        type="button"
        onClick={() => setSide(which)}
        disabled={step1}
        className={
          "rounded-2xl border-2 px-3 py-3 text-center transition disabled:cursor-default " +
          (good
            ? "border-emerald-400/70 bg-emerald-400/15"
            : bad
              ? "border-rose-400/70 bg-rose-400/15"
              : which === "origin"
                ? "border-teal-400/35 bg-teal-400/[0.07] hover:bg-teal-400/15"
                : "border-emerald-400/30 bg-emerald-400/[0.05] hover:bg-emerald-400/12")
        }
      >
        <p className={"text-[11px] font-bold tracking-widest " + (which === "origin" ? "text-teal-200/80" : "text-emerald-200/80")}>
          {which === "origin" ? "원래 명제" : "대우"}
        </p>
        <p className="mt-1.5 text-[14px] font-bold leading-7 text-slate-100">
          <PieceLine ps={which === "origin" ? t.origin : t.contra} />
        </p>
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-1.5 text-center text-[11px] font-bold text-slate-400">조건이 놓인 범위 · {t.scope}</div>

      <div className={"rounded-2xl border-2 p-3 transition " + (step1 ? "border-emerald-400/45 bg-emerald-400/[0.08]" : "border-white/10 bg-slate-900/40")}>
        <p className="text-[12px] font-bold text-slate-200">1단계 · 어느 쪽으로 따지는 것이 편할까요?</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {card("origin")}
          {card("contra")}
        </div>
        {step1 ? (
          <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-[12px] leading-6 text-emerald-100">
            ✅ {t.easyWhy}
            {EASY_TAIL[t.id]}
          </p>
        ) : null}
        {side !== null && !step1 ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {t.hardWhy}</p> : null}
      </div>

      <div className={"rounded-2xl border-2 p-3 transition " + (step1 ? "border-white/10 bg-slate-900/40" : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
        <p className="text-[12px] font-bold text-slate-200">
          2단계 · 고른 쪽으로 따져 보면 이 명제는 참일까요, 거짓일까요? <span className="text-slate-500">(둘의 참·거짓은 같아요)</span>
        </p>
        <div className="mt-2">
          <TFButtons value={truth} answer={t.truth} locked={step2} onPick={setTruth} />
        </div>
        {truth !== null && !step2 && step1 ? (
          <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ 다시 한 번 따져 볼까요? 반례가 있는지 찾아보세요.</p>
        ) : null}
      </div>

      {step2 ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <p className="text-center text-[12px] font-bold text-emerald-100">
            🔍 {t.easier === "origin" ? "원래 명제" : "대우"} 로 따져 보기
          </p>
          {t.steps.map((s, k) => (
            <p key={k} className="flex flex-wrap items-baseline gap-x-2 rounded-lg bg-black/25 px-3 py-2 text-[13px] leading-7 text-slate-100">
              <span className="shrink-0 font-mono text-[11px] font-bold text-slate-500">{k + 1}</span>
              <PieceLine ps={s} />
            </p>
          ))}
          <p className={"rounded-lg px-3 py-2.5 text-center text-base font-extrabold " + (t.truth ? "bg-emerald-400/15 text-emerald-50" : "bg-rose-400/15 text-rose-50")}>
            ∴ 이 명제는 {t.truth ? "참" : "거짓"}
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">📎 {t.note}</p>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 명제 카드게임
// ══════════════════════════════════════════════════════════════
function CardFace({ c, tone, small }: { c: GameCard; tone: "p" | "q" | "dim"; small?: boolean }) {
  const cls =
    tone === "p"
      ? "border-sky-400/60 bg-gradient-to-br from-sky-500/25 to-indigo-500/15 text-sky-50"
      : tone === "q"
        ? "border-violet-400/60 bg-gradient-to-br from-violet-500/25 to-fuchsia-500/15 text-violet-50"
        : "border-white/12 bg-white/[0.04] text-slate-400";
  return (
    <span className={"inline-flex flex-col items-center rounded-xl border-2 px-2.5 " + (small ? "py-1" : "py-2") + " " + cls}>
      <span className="text-[10px] font-bold opacity-80">{c.id}</span>
      <span className={small ? "text-[12px] font-bold" : "text-[13px] font-bold"}>
        <PieceLine ps={c.cond} />
      </span>
    </span>
  );
}

function GameTab() {
  const [stage, setStage] = useState(0);
  const [sets, setSets] = useState<Record<string, number[]>>({});

  const allSets = P_CARDS.concat(Q_CARDS).every((c) => sets[c.id]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🃏 가정 카드 4장, 결론 카드 4장으로 명제를 만들어요</p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          전체집합은 <b className="text-slate-200">10 이하의 자연수</b> 예요. 각 카드에 적힌 조건의 진리집합을 구하는 것부터 시작합니다.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[0, 1, 2].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStage(s)}
              disabled={s > 0 && !allSets}
              className={
                "rounded-lg border-2 px-3 py-1.5 text-[12px] font-bold transition disabled:cursor-default disabled:opacity-40 " +
                (stage === s ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {["1단계 · 진리집합 구하기", "2단계 · 참인 조합 찾기", "3단계 · 네 가지 만들기"][s]}
            </button>
          ))}
        </div>
      </div>

      {stage === 0 ? <GameSets sets={sets} onSet={(id, v) => setSets((s) => ({ ...s, [id]: v }))} onNext={() => setStage(1)} allDone={allSets} /> : null}
      {stage === 1 ? <GameGrid onNext={() => setStage(2)} /> : null}
      {stage === 2 ? <GameBuild /> : null}
    </div>
  );
}

/** 1단계 — 여덟 장의 진리집합 구하기 */
function GameSets({ sets, onSet, onNext, allDone }: { sets: Record<string, number[]>; onSet: (id: string, v: number[]) => void; onNext: () => void; allDone: boolean }) {
  const order = P_CARDS.concat(Q_CARDS);
  const firstOpen = order.find((c) => !sets[c.id]);
  const [cur, setCur] = useState<string>(firstOpen ? firstOpen.id : order[0].id);
  const [sel, setSel] = useState<number[]>([]);
  const [tried, setTried] = useState(false);
  const [tip, setTip] = useState(false);

  const card = order.find((c) => c.id === cur) as GameCard;
  const want = truthSetOf(card);
  const locked = !!sets[card.id];
  const wrong = tried && !locked ? GAME_U.filter((n) => sel.includes(n) !== want.includes(n)).length : 0;

  function go(id: string) {
    setCur(id);
    setSel([]);
    setTried(false);
    setTip(false);
  }

  return (
    <div className="space-y-3">
      {/* 표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-[12px] font-bold text-slate-200">📋 카드별 진리집합</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            { title: "가정 카드", cards: P_CARDS, tone: "p" as const },
            { title: "결론 카드", cards: Q_CARDS, tone: "q" as const },
          ].map((g) => (
            <div key={g.title} className="rounded-xl border border-white/10 bg-black/25 p-2">
              <p className={"text-center text-[11px] font-bold " + (g.tone === "p" ? "text-sky-200" : "text-violet-200")}>[ {g.title} ]</p>
              <div className="mt-1.5 space-y-1">
                {g.cards.map((c) => {
                  const s = sets[c.id];
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => go(c.id)}
                      className={
                        "flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-left transition " +
                        (cur === c.id ? "border-cyan-400/60 bg-cyan-400/12" : s ? "border-emerald-400/35 bg-emerald-400/[0.08]" : "border-white/10 bg-white/[0.03] hover:bg-white/10")
                      }
                    >
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-100">
                        <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-400">{c.id}</span>
                        <PieceLine ps={c.cond} />
                      </span>
                      <span className={"font-mono text-[12px] font-bold " + (s ? "text-emerald-200" : "text-slate-600")}>
                        {s ? `{ ${s.join(", ")} }` : "{ ? }"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 고른 카드의 진리집합 만들기 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (locked ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/10 bg-slate-900/40")}>
        <p className="text-center text-[12px] font-bold text-slate-200">
          카드 <b className="text-cyan-200">{card.id}</b> 의 조건을 참이 되게 하는 수를 모두 누르세요
        </p>
        <p className="mt-1.5 text-center text-lg font-bold text-slate-100">
          <PieceLine ps={card.cond} />
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {GAME_U.map((n) => {
            const on = locked ? want.includes(n) : sel.includes(n);
            return (
              <button
                key={n}
                type="button"
                disabled={locked}
                onClick={() => {
                  setTried(false);
                  setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
                }}
                className={
                  "h-10 w-10 rounded-xl border-2 font-mono text-base font-bold transition disabled:cursor-default " +
                  (on ? "border-emerald-400/70 bg-emerald-400/25 text-emerald-50" : "border-white/12 bg-white/[0.04] text-slate-400 hover:bg-white/10")
                }
              >
                {n}
              </button>
            );
          })}
        </div>
        {locked ? (
          <p className="mt-2 rounded-lg bg-emerald-400/10 px-3 py-2 text-center font-mono text-[12px] font-bold text-emerald-100">
            ✅ {"{"} {want.join(", ")} {"}"}
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <TipBox text={card.tip} open={tip} onOpen={() => setTip(true)} />
            <button
              type="button"
              onClick={() => {
                if (sameNums(sel, want)) {
                  onSet(card.id, want);
                  const next = order.find((c) => c.id !== card.id && !sets[c.id]);
                  if (next) go(next.id);
                } else setTried(true);
              }}
              className="rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/25"
            >
              확인
            </button>
          </div>
        )}
        {wrong > 0 ? <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {wrong}개가 잘못 골라졌어요.</p> : null}
      </div>

      {allDone ? <NextBtn onClick={onNext} label="2단계로 ▶" /> : null}
    </div>
  );
}

/** 2단계 — 16칸에서 참인 조합 찾기 */
function GameGrid({ onNext }: { onNext: () => void }) {
  const [opened, setOpened] = useState<string[]>([]);
  const [look, setLook] = useState<string | null>(null);

  const trueKeys: string[] = [];
  for (const a of P_CARDS) for (const b of Q_CARDS) if (pairTruth(a, b).prop) trueKeys.push(`${a.id}${b.id}`);
  const foundAll = trueKeys.every((k) => opened.includes(k));

  const sel = look ? { a: cardById(look[0]), b: cardById(look[1]) } : null;
  const A = sel ? truthSetOf(sel.a) : [];
  const B = sel ? truthSetOf(sel.b) : [];
  const miss = sel ? outside(A, B) : [];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-[12px] font-bold text-slate-200">
          🔍 가정 카드 한 장과 결론 카드 한 장을 골라 만든 명제 <b className="text-white">p → q</b> 가 <b className="text-emerald-200">참이 되는 칸</b> 을 모두 찾으세요
        </p>
        <div className="mt-2 overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[440px] text-center text-[12px]">
            <thead>
              <tr>
                <th className="px-1 py-1.5" />
                {Q_CARDS.map((b) => (
                  <th key={b.id} className="px-1 py-1.5">
                    <CardFace c={b} tone="q" small />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {P_CARDS.map((a) => (
                <tr key={a.id}>
                  <th className="px-1 py-1.5">
                    <CardFace c={a} tone="p" small />
                  </th>
                  {Q_CARDS.map((b) => {
                    const key = `${a.id}${b.id}`;
                    const on = opened.includes(key);
                    const good = pairTruth(a, b).prop;
                    return (
                      <td key={b.id} className="px-1 py-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setOpened((s) => (s.includes(key) ? s : [...s, key]));
                            setLook(key);
                          }}
                          className={
                            "h-11 w-full min-w-[54px] rounded-xl border-2 text-lg font-extrabold transition " +
                            (!on
                              ? "border-white/12 bg-white/[0.04] text-slate-600 hover:bg-white/10"
                              : good
                                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                                : "border-rose-400/50 bg-rose-400/12 text-rose-200") +
                            (look === key ? " ring-2 ring-cyan-400/70" : "")
                          }
                        >
                          {on ? (good ? "⭕" : "✕") : "?"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-center font-mono text-[12px] font-bold text-slate-400">
          찾은 참인 조합 {trueKeys.filter((k) => opened.includes(k)).length} / {trueKeys.length}
        </p>
      </div>

      {sel ? (
        <div className="rounded-2xl border-2 border-cyan-400/30 bg-cyan-400/[0.06] p-3">
          <p className="text-center text-[13px] font-bold leading-8 text-slate-100">
            <span className="text-sky-200">
              <PieceLine ps={sel.a.cond} />
            </span>
            <span className="mx-2 text-slate-500">이면</span>
            <span className="text-violet-200">
              <PieceLine ps={sel.b.cond} />
            </span>
            <span className="text-slate-400">이다.</span>
          </p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <p className="rounded-lg bg-black/25 px-3 py-2 text-center font-mono text-[12px] font-bold text-sky-100">
              P = {"{"} {A.join(", ")} {"}"}
            </p>
            <p className="rounded-lg bg-black/25 px-3 py-2 text-center font-mono text-[12px] font-bold text-violet-100">
              Q = {"{"} {B.join(", ")} {"}"}
            </p>
          </div>
          <p className={"mt-1.5 rounded-lg px-3 py-2 text-center text-[12px] leading-6 " + (miss.length === 0 ? "bg-emerald-400/12 text-emerald-100" : "bg-rose-400/12 text-rose-100")}>
            {miss.length === 0 ? (
              <>
                ⭕ <Katex expr="P \subset Q" /> — 명제는 참이에요
              </>
            ) : (
              <>
                ✕ <b className="font-mono text-base">{miss.join(", ")}</b> 이(가) P 안에 있으면서 Q 밖에 있어요 — 반례!
              </>
            )}
          </p>
        </div>
      ) : (
        <p className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-4 text-center text-[12px] text-slate-500">칸을 누르면 두 진리집합을 비교해 줘요.</p>
      )}

      {foundAll ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-3">
          <p className="text-center text-[12px] font-bold leading-6 text-emerald-100">
            🎉 참이 되는 조합은 <b className="font-mono text-base">{trueKeys.map((k) => `${k[0]} → ${k[1]}`).join(" , ")}</b> 두 가지뿐이에요!
          </p>
          <NextBtn onClick={onNext} label="3단계로 ▶" />
        </div>
      ) : null}
    </div>
  );
}

/** 3단계 — 카드를 한 번씩만 써서 네 가지 목표 만들기 */
function GameBuild() {
  const [slots, setSlots] = useState<Record<string, { p?: string; q?: string }>>({ g1: {}, g2: {}, g3: {}, g4: {} });
  const [active, setActive] = useState<string>("g1");
  const [reveal, setReveal] = useState(false);
  const [order, setOrder] = useState<string[]>(() => GOALS.map((g) => g.id));

  const usedP = Object.values(slots)
    .map((s) => s.p)
    .filter(Boolean) as string[];
  const usedQ = Object.values(slots)
    .map((s) => s.q)
    .filter(Boolean) as string[];

  function place(card: GameCard) {
    setSlots((s) => {
      const cur = s[active] ?? {};
      const kind = card.kind;
      // 다른 자리에 이미 놓여 있으면 빼 온다
      const next: Record<string, { p?: string; q?: string }> = {};
      for (const [k, v] of Object.entries(s)) next[k] = { ...v };
      for (const k of Object.keys(next)) if (next[k][kind] === card.id) delete next[k][kind];
      next[active] = { ...cur, ...next[active], [kind]: card.id };
      return next;
    });
  }
  function clearSlot(id: string) {
    setSlots((s) => ({ ...s, [id]: {} }));
  }
  function resetAll() {
    setSlots({ g1: {}, g2: {}, g3: {}, g4: {} });
    setActive("g1");
    setReveal(false);
  }

  const results = GOALS.map((g) => {
    const s = slots[g.id] ?? {};
    if (!s.p || !s.q) return { g, ok: false, filled: false, prop: false, conv: false };
    const { prop, conv } = pairTruth(cardById(s.p), cardById(s.q));
    return { g, filled: true, prop, conv, ok: prop === g.contra && conv === g.conv };
  });
  const allOk = results.every((r) => r.ok);
  const sol = solveGame()[0] ?? [];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-bold text-slate-200">
            🎯 <b className="text-cyan-200">모든 카드를 한 번씩만</b> 써서 네 가지 명제를 만드세요
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setOrder((o) => shuffled(o))}
              className="rounded-lg border-2 border-amber-400/50 bg-amber-400/12 px-2.5 py-1 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/22"
            >
              🔀 목표 섞기
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 처음부터
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] leading-5 text-slate-500">목표 칸을 먼저 누르고, 아래에서 카드를 누르면 그 칸에 들어가요.</p>
      </div>

      {/* 카드 팔레트 */}
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          { title: "가정 카드", cards: P_CARDS, used: usedP, tone: "p" as const },
          { title: "결론 카드", cards: Q_CARDS, used: usedQ, tone: "q" as const },
        ].map((g) => (
          <div key={g.title} className="rounded-2xl border border-white/10 bg-slate-900/40 p-2.5">
            <p className={"text-center text-[11px] font-bold " + (g.tone === "p" ? "text-sky-200" : "text-violet-200")}>[ {g.title} ]</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {g.cards.map((c) => {
                const isUsed = g.used.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => place(c)} disabled={allOk} className={"transition disabled:cursor-default " + (isUsed ? "opacity-45" : "hover:brightness-125")}>
                    <span className="block">
                      <CardFace c={c} tone={isUsed ? "dim" : g.tone} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 목표 슬롯 */}
      <div className="grid gap-2 sm:grid-cols-2">
        {order.map((gid) => {
          const r = results.find((x) => x.g.id === gid);
          if (!r) return null;
          const s = slots[gid] ?? {};
          const on = active === gid;
          return (
            <div
              key={gid}
              className={
                "rounded-2xl border-2 p-2.5 transition " +
                (r.ok ? "border-emerald-400/60 bg-emerald-400/12" : on ? "border-cyan-400/70 bg-cyan-400/10" : r.filled ? "border-rose-400/40 bg-rose-400/[0.07]" : "border-white/10 bg-slate-900/40")
              }
            >
              <button type="button" onClick={() => setActive(gid)} className="flex w-full items-center justify-between gap-2 text-left">
                <span className={"text-[12px] font-bold " + (r.ok ? "text-emerald-100" : "text-slate-200")}>
                  {r.ok ? "✅ " : on ? "✏️ " : "⬜ "}
                  {r.g.label}
                </span>
                {s.p || s.q ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSlot(gid);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        clearSlot(gid);
                      }
                    }}
                    className="shrink-0 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 hover:bg-white/10"
                  >
                    비우기
                  </span>
                ) : null}
              </button>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
                {s.p ? <CardFace c={cardById(s.p)} tone="p" small /> : <span className="rounded-xl border-2 border-dashed border-white/15 px-4 py-2 text-[11px] text-slate-600">가정</span>}
                <span className="text-base text-emerald-300">→</span>
                {s.q ? <CardFace c={cardById(s.q)} tone="q" small /> : <span className="rounded-xl border-2 border-dashed border-white/15 px-4 py-2 text-[11px] text-slate-600">결론</span>}
              </div>
              {r.filled ? (
                <div className="mt-1.5 flex flex-wrap justify-center gap-1.5 text-[11px] font-bold">
                  <span className={"rounded px-2 py-0.5 " + (r.conv === r.g.conv ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/20 text-rose-100")}>
                    역 {r.conv ? "참" : "거짓"}
                  </span>
                  <span className={"rounded px-2 py-0.5 " + (r.prop === r.g.contra ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/20 text-rose-100")}>
                    대우 {r.prop ? "참" : "거짓"}
                  </span>
                </div>
              ) : (
                <p className="mt-1.5 text-center text-[11px] leading-5 text-slate-500">{r.g.hint}</p>
              )}
            </div>
          );
        })}
      </div>

      {allOk ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🏆 네 가지를 모두 만들었어요!</p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
            <b className="text-white">대우</b> 의 참·거짓은 원래 명제와 늘 같으니, 사실은 <b className="text-emerald-200">P ⊂ Q</b> 인지만 보면 됐어요. 그리고{" "}
            <b className="text-rose-200">역</b> 은 <b className="text-white">Q ⊂ P</b> 인지를 보는 것이고요. 두 포함 관계를 따로 맞추면 네 가지가 모두 만들어집니다.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="text-[12px] text-slate-400">진리집합의 포함 관계를 떠올려 보세요.</p>
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="rounded-lg border border-rose-400/35 bg-rose-400/10 px-3 py-1.5 text-[11px] font-bold text-rose-100 transition hover:bg-rose-400/20"
          >
            {reveal ? "▲ 정답 접기" : "정답 보기"}
          </button>
        </div>
      )}

      {reveal && !allOk ? (
        <div className="space-y-1 rounded-2xl bg-black/30 p-3">
          <p className="text-[11px] font-bold text-rose-200">정답</p>
          {sol.map((m) => {
            const g = GOALS.find((x) => x.id === m.goal);
            const A = truthSetOf(cardById(m.p));
            const B = truthSetOf(cardById(m.q));
            return (
              <p key={m.goal} className="text-[12px] leading-6 text-slate-300">
                {g?.label} — {m.p} → {m.q} · P = {"{"}
                {A.join(",")}
                {"}"} , Q = {"{"}
                {B.join(",")}
                {"}"} {isSubset(A, B) ? "(P ⊂ Q)" : ""} {isSubset(B, A) ? "(Q ⊂ P)" : ""}
              </p>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
