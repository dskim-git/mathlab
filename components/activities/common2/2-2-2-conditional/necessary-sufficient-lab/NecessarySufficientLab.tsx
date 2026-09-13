"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import { useActivityContext } from "@/components/activities/ActivityContext";
import { fetchLeaderboard, submitActivityScore, type LeaderRow } from "@/lib/activities/activityScores";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  ARROWS,
  C_MAX,
  C_MIN,
  MATCHES,
  MATCH_L,
  MATCH_L_ORDER,
  MATCH_R,
  MATCH_R_ORDER,
  NL,
  Q_RANGE,
  RANGE_PRESETS,
  REL_META,
  REL_ORDER,
  SPEED_MODE,
  SPEED_PENALTY,
  SPEED_SECONDS,
  STEP,
  W_MAX,
  W_MIN,
  inP,
  inQ,
  makeSpeedItem,
  nlX,
  num,
  relOfRange,
  speedSet,
  splitAt,
  type ArrowTask,
  type MatchCard,
  type Piece,
  type RelKind,
  type SpeedItem,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "which_is_which",
    prompt:
      "p ⇒ q 일 때 왜 p 가 충분조건이고 q 가 필요조건인지, 진리집합 P 와 Q 의 크기를 들어 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: p ⇒ q 는 P ⊂ Q 와 같은 말이다. P 는 좁고 Q 는 넓다. P 에 들어가기만 하면 Q 에 드는 것은 저절로 따라오므로 p 는 q 이기 위해 충분하다. 거꾸로 Q 에 들어가는 것은 P 에 들어가기 위해 최소한 갖춰야 하는 것이라서 q 는 p 이기 위해 필요하다.",
  },
  {
    id: "range_lab",
    prompt:
      "탭②에서 p 의 범위를 넓히거나 좁히면 조건의 이름이 바뀌었어요. 범위의 크기와 충분·필요조건이 어떤 관계였는지 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: p 의 구간이 q 의 구간 안으로 들어가면 p 는 충분조건이 되고, 반대로 q 를 덮을 만큼 넓히면 p 는 필요조건이 된다. 딱 같아지면 필요충분조건이고, 서로 걸치기만 하면 아무 조건도 되지 못한다. 좁은 조건일수록 충분조건 쪽, 넓은 조건일수록 필요조건 쪽이다.",
  },
  {
    id: "iff_meaning",
    prompt:
      "탭③에서 짝지은 두 조건은 생김새가 달랐지만 필요충분조건이었어요. 두 조건이 필요충분조건이라는 것이 어떤 뜻인지, 기억에 남는 짝을 하나 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 필요충분조건이면 P = Q 이므로 두 조건을 만족하는 x 가 완전히 같다. 즉 표현만 다를 뿐 같은 뜻의 조건이다. x² − x = 0 과 「x = 0 또는 x = 1」이 그런 짝이었다. 반대로 x² = 4 와 x = 2 는 x = −2 때문에 짝이 아니어서, x = 2 는 충분조건일 뿐이었다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "arrow" | "range" | "match" | "speed";

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

/** 조건 카드 — p 는 파랑, q 는 주황 */
function CondCard({ name, ps, tone, big }: { name: string; ps: Piece[]; tone: "p" | "q"; big?: boolean }) {
  const cls = tone === "p" ? "border-sky-400/45 bg-sky-400/[0.10]" : "border-amber-400/45 bg-amber-400/[0.10]";
  const txt = tone === "p" ? "text-sky-200" : "text-amber-200";
  return (
    <div className={"rounded-2xl border-2 px-3 py-3 text-center " + cls}>
      <p className={"text-[11px] font-bold tracking-widest " + txt}>조건 {name}</p>
      <p className={"mt-1 font-bold leading-8 text-slate-100 " + (big ? "text-lg" : "text-[15px]")}>
        <PieceLine ps={ps} />
      </p>
    </div>
  );
}

/** p 쪽이 무슨 조건이면 q 쪽은 무슨 조건인가 */
function flipRel(r: RelKind): RelKind {
  return r === "suf" ? "nec" : r === "nec" ? "suf" : r;
}

/** 관계를 벤 다이어그램으로 */
function RelVenn({ rel }: { rel: RelKind }) {
  const P = "#38bdf8";
  const Q = "#fbbf24";
  const label = (x: number, y: number, t: string, c: string) => (
    <text x={x} y={y} textAnchor="middle" fill={c} className="font-serif text-[17px] font-bold italic">
      {t}
    </text>
  );
  return (
    <svg viewBox="0 0 300 190" className="mx-auto block w-full max-w-[300px] select-none" role="img" aria-label="두 진리집합의 포함 관계">
      <rect x={6} y={8} width={288} height={174} rx={14} fill="rgba(255,255,255,0.03)" stroke="rgba(148,163,184,0.45)" strokeWidth={2} />
      <text x={24} y={28} textAnchor="middle" className="fill-slate-500 font-serif text-[13px] font-bold italic">
        U
      </text>
      {rel === "suf" ? (
        <>
          <circle cx={150} cy={100} r={72} fill={Q + "1f"} stroke={Q} strokeWidth={3} />
          <circle cx={140} cy={110} r={38} fill={P + "33"} stroke={P} strokeWidth={3} />
          {label(150, 48, "Q", Q)}
          {label(140, 116, "P", P)}
        </>
      ) : null}
      {rel === "nec" ? (
        <>
          <circle cx={150} cy={100} r={72} fill={P + "1f"} stroke={P} strokeWidth={3} />
          <circle cx={140} cy={110} r={38} fill={Q + "33"} stroke={Q} strokeWidth={3} />
          {label(150, 48, "P", P)}
          {label(140, 116, "Q", Q)}
        </>
      ) : null}
      {rel === "iff" ? (
        <>
          <circle cx={150} cy={100} r={66} fill="rgba(52,211,153,0.18)" stroke={P} strokeWidth={4} />
          <circle cx={150} cy={100} r={58} fill="none" stroke={Q} strokeWidth={3} strokeDasharray="7 5" />
          {label(150, 54, "P", P)}
          {label(150, 148, "Q", Q)}
          <text x={150} y={106} textAnchor="middle" className="fill-emerald-200 text-[15px] font-bold">
            P = Q
          </text>
        </>
      ) : null}
      {rel === "none" ? (
        <>
          <circle cx={112} cy={100} r={58} fill={P + "1f"} stroke={P} strokeWidth={3} />
          <circle cx={188} cy={100} r={58} fill={Q + "1f"} stroke={Q} strokeWidth={3} />
          {label(78, 54, "P", P)}
          {label(222, 54, "Q", Q)}
        </>
      ) : null}
    </svg>
  );
}

const ABC = ["①", "②", "③", "④"];

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function NecessarySufficientLab() {
  const [tab, setTab] = useState<Tab>("arrow");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🎁 충분조건과 필요조건</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-sky-200">충분</b> 한 쪽은 <b className="text-white">좁고</b>, <b className="text-amber-200">필요</b> 한 쪽은 <b className="text-white">넓어요</b>. 화살표를
          놓고 범위를 움직이며 그 감각을 익혀 봅시다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "arrow"} onClick={() => setTab("arrow")}>
          ① 화살표 놓기 🏹
        </TabButton>
        <TabButton active={tab === "range"} onClick={() => setTab("range")}>
          ② 범위 실험실 📏
        </TabButton>
        <TabButton active={tab === "match"} onClick={() => setTab("match")}>
          ③ 같은 뜻 짝 찾기 🧩
        </TabButton>
        <TabButton active={tab === "speed"} onClick={() => setTab("speed")}>
          ④ 충분·필요 스피드 ⚡
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "arrow" ? <ArrowTab /> : null}
        {tab === "range" ? <RangeTab /> : null}
        {tab === "match" ? <MatchTab /> : null}
        {tab === "speed" ? <SpeedTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 화살표 놓기
// ══════════════════════════════════════════════════════════════
const ARROW_CHOICES: { rel: RelKind; tex?: string; sub: string }[] = [
  { rel: "suf", tex: "p \\Rightarrow q", sub: "p이면 q이다 — 참" },
  { rel: "nec", tex: "q \\Rightarrow p", sub: "q이면 p이다 — 참" },
  { rel: "iff", tex: "p \\Leftrightarrow q", sub: "양쪽 모두 참" },
  { rel: "none", sub: "양쪽 모두 거짓" },
];

function ArrowTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = ARROWS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🏹 두 조건 사이에 놓일 화살표를 고르세요</p>
          <Chips ids={ARROWS.map((a) => a.id)} cur={i} done={done} onPick={setI} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
            <Katex expr="p \Rightarrow q" /> <span className="mx-1 text-slate-500">일 때</span>
            <br />
            <b className="text-sky-200">p는 충분조건</b> · <b className="text-amber-200">q는 필요조건</b>
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
            <Katex expr="p \Rightarrow q" /> <span className="mx-1 text-slate-500">⟺</span> <Katex expr="P \subset Q" />
            <br />
            <b className="text-white">좁은 쪽이 충분, 넓은 쪽이 필요</b>
          </p>
        </div>
      </div>

      <ArrowOne
        key={t.id}
        t={t}
        last={i === ARROWS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(ARROWS.length - 1, k + 1))}
      />

      {done.length === ARROWS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 풀었어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <p className="rounded-xl bg-black/25 px-3 py-3 text-center text-[12px] leading-7 text-slate-300">
              <span className="text-2xl">🎁</span>
              <br />
              <b className="text-sky-200">충분조건</b> 은 <b className="text-white">좁은</b> 조건
              <br />
              들어가기만 하면 상대 조건이 <b className="text-white">저절로 따라와요</b>
            </p>
            <p className="rounded-xl bg-black/25 px-3 py-3 text-center text-[12px] leading-7 text-slate-300">
              <span className="text-2xl">🛡️</span>
              <br />
              <b className="text-amber-200">필요조건</b> 은 <b className="text-white">넓은</b> 조건
              <br />
              최소한 이것만은 <b className="text-white">갖추고 있어야 해요</b>
            </p>
          </div>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
            ※ 두 조건이 <b className="text-emerald-200">필요충분조건</b> 이면 <Katex expr="P = Q" /> 라서, 생김새가 달라도 <b className="text-white">같은 뜻의 조건</b> 이에요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ArrowOne({ t, last, onDone, onNext }: { t: ArrowTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [arrow, setArrow] = useState<RelKind | null>(null);
  const [term, setTerm] = useState<RelKind | null>(null);
  const [tip, setTip] = useState(false);

  const step1 = arrow !== null && arrow === t.rel;
  const step2 = step1 && term !== null && term === t.rel;

  const doneRef = useRef(false);
  useEffect(() => {
    if (step2 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-1.5 text-center text-[11px] font-bold text-slate-400">조건이 놓인 범위 · {t.scope}</div>

      <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
        <CondCard name="p" ps={t.p} tone="p" big />
        <div className="text-center text-2xl text-slate-500">
          {step1 ? (t.rel === "suf" ? "⟹" : t.rel === "nec" ? "⟸" : t.rel === "iff" ? "⟺" : "🚫") : "❔"}
        </div>
        <CondCard name="q" ps={t.q} tone="q" big />
      </div>

      {/* 1단계 — 화살표 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (step1 ? "border-emerald-400/45 bg-emerald-400/[0.08]" : "border-white/10 bg-slate-900/40")}>
        <p className="text-[12px] font-bold text-slate-200">1단계 · 두 조건 사이에 어떤 화살표가 놓일까요?</p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {ARROW_CHOICES.map((c, k) => {
            const on = arrow === c.rel;
            const good = step1 && c.rel === t.rel;
            const bad = on && c.rel !== t.rel;
            return (
              <button
                key={c.rel}
                type="button"
                onClick={() => setArrow(c.rel)}
                disabled={step1}
                className={
                  "flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20"
                      : "border-white/10 bg-white/5 hover:bg-white/10")
                }
              >
                <span className="shrink-0 font-mono text-[13px] text-slate-400">{ABC[k]}</span>
                <span className="text-lg font-bold text-slate-100">{c.tex ? <Katex expr={c.tex} /> : "🚫"}</span>
                <span className="text-[11px] text-slate-400">{c.sub}</span>
              </button>
            );
          })}
        </div>
        {arrow !== null && !step1 ? (
          <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
            ❌ {arrow === "suf" && t.pqCounter ? t.pqCounter : arrow === "nec" && t.qpCounter ? t.qpCounter : "두 방향을 각각 따져 보세요. 반례가 있는지 살펴보면 돼요."}
          </p>
        ) : null}
        {!step1 ? (
          <div className="mt-2">
            <TipBox text={t.tip} open={tip} onOpen={() => setTip(true)} />
          </div>
        ) : null}
      </div>

      {/* 2단계 — 용어 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (step1 ? "border-white/10 bg-slate-900/40" : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
        <p className="text-[12px] font-bold text-slate-200">
          2단계 · 그러면 <b className="text-sky-200">p</b> 는 <b className="text-amber-200">q</b> 이기 위한 무슨 조건일까요?
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {REL_ORDER.map((r) => {
            const on = term === r;
            const good = step2 && r === t.rel;
            const bad = on && r !== t.rel;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setTerm(r)}
                disabled={step2}
                className={
                  "rounded-xl border-2 px-2 py-2.5 text-center text-[13px] font-bold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : bad
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                <span className="block text-lg">{REL_META[r].emoji}</span>
                {REL_META[r].label}
              </button>
            );
          })}
        </div>
        {term !== null && !step2 && step1 ? (
          <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
            ❌ 화살표가 <b className="text-white">나가는</b> 쪽이 충분조건, <b className="text-white">들어오는</b> 쪽이 필요조건이에요.
          </p>
        ) : null}
      </div>

      {step2 ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <div className="grid gap-2 lg:grid-cols-2">
            <RelVenn rel={t.rel} />
            <div className="space-y-1.5">
              <p className="rounded-xl bg-black/25 px-3 py-2.5 text-center text-[13px] leading-7 text-slate-100">
                <b className="text-sky-200">p</b> 는 <b className="text-amber-200">q</b> 이기 위한{" "}
                <b className={REL_META[t.rel].tone}>
                  {REL_META[t.rel].emoji} {REL_META[t.rel].label}
                </b>
              </p>
              <p className="rounded-xl bg-black/25 px-3 py-2.5 text-center text-[13px] leading-7 text-slate-100">
                <b className="text-amber-200">q</b> 는 <b className="text-sky-200">p</b> 이기 위한{" "}
                <b className={REL_META[flipRel(t.rel)].tone}>
                  {REL_META[flipRel(t.rel)].emoji} {REL_META[flipRel(t.rel)].label}
                </b>
              </p>
              {t.rel !== "none" ? (
                <p className="rounded-xl bg-black/25 px-3 py-2 text-center text-[13px] text-slate-200">
                  <Katex expr={REL_META[t.rel].set} />
                </p>
              ) : null}
              {t.pqCounter ? <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">🚨 {t.pqCounter}</p> : null}
              {t.qpCounter ? <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">🚨 {t.qpCounter}</p> : null}
            </div>
          </div>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">✅ {t.why}</p>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 범위 실험실
// ══════════════════════════════════════════════════════════════
const TICKS = Array.from({ length: NL.to - NL.from + 1 }, (_, i) => NL.from + i);

function NumberLine({ c, w, x, svgRef, onGrabBar, onGrabDot }: { c: number; w: number; x: number; svgRef: React.Ref<SVGSVGElement>; onGrabBar: () => void; onGrabDot: () => void }) {
  const pLo = nlX(c - w);
  const pHi = nlX(c + w);
  const qLo = nlX(Q_RANGE.lo);
  const qHi = nlX(Q_RANGE.hi);
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg ref={svgRef} viewBox={`0 0 ${NL.w} ${NL.h}`} className="mx-auto block w-full max-w-[640px] touch-none select-none" role="img" aria-label="두 조건의 범위를 나타낸 수직선">
        {/* p 막대 */}
        <g className="cursor-grab" onPointerDown={(e) => { e.preventDefault(); onGrabBar(); }}>
          <rect x={pLo - 6} y={NL.pY - 12} width={Math.max(12, pHi - pLo + 12)} height={NL.barH + 24} fill="transparent" />
          <rect x={pLo} y={NL.pY} width={Math.max(3, pHi - pLo)} height={NL.barH} rx={8} fill="#38bdf8" opacity={0.85} />
          <circle cx={pLo} cy={NL.pY + NL.barH / 2} r={7} fill="#38bdf8" stroke="#0f172a" strokeWidth={2} />
          <circle cx={pHi} cy={NL.pY + NL.barH / 2} r={7} fill="#38bdf8" stroke="#0f172a" strokeWidth={2} />
        </g>
        <text x={NL.x0 - 12} y={NL.pY + 13} textAnchor="end" fill="#38bdf8" className="font-serif text-[15px] font-bold italic">
          p
        </text>
        {/* q 막대 */}
        <rect x={qLo} y={NL.qY} width={qHi - qLo} height={NL.barH} rx={8} fill="#fbbf24" opacity={0.85} />
        <circle cx={qLo} cy={NL.qY + NL.barH / 2} r={7} fill="#fbbf24" stroke="#0f172a" strokeWidth={2} />
        <circle cx={qHi} cy={NL.qY + NL.barH / 2} r={7} fill="#fbbf24" stroke="#0f172a" strokeWidth={2} />
        <text x={NL.x0 - 12} y={NL.qY + 13} textAnchor="end" fill="#fbbf24" className="font-serif text-[15px] font-bold italic">
          q
        </text>

        {/* 수직선 */}
        <line x1={NL.x0 - 14} y1={NL.axY} x2={NL.x1 + 14} y2={NL.axY} stroke="rgba(226,232,240,0.55)" strokeWidth={2} />
        {TICKS.map((v) => (
          <g key={v}>
            <line x1={nlX(v)} y1={NL.axY - 5} x2={nlX(v)} y2={NL.axY + 5} stroke="rgba(226,232,240,0.45)" strokeWidth={1.5} />
            <text x={nlX(v)} y={NL.axY + 20} textAnchor="middle" className="fill-slate-500 font-mono text-[10px]">
              {num(v)}
            </text>
          </g>
        ))}

        {/* 끌 수 있는 점 */}
        <g className="cursor-grab" onPointerDown={(e) => { e.preventDefault(); onGrabDot(); }}>
          <circle cx={nlX(x)} cy={NL.axY} r={16} fill="transparent" />
          <line x1={nlX(x)} y1={NL.pY - 8} x2={nlX(x)} y2={NL.axY} stroke="rgba(226,232,240,0.35)" strokeWidth={1.5} strokeDasharray="4 4" />
          <circle cx={nlX(x)} cy={NL.axY} r={9} fill="#e2e8f0" stroke="#0f172a" strokeWidth={2.5} />
          <text x={nlX(x)} y={NL.axY - 22} textAnchor="middle" className="fill-slate-200 font-mono text-[12px] font-bold">
            {num(x)}
          </text>
        </g>
      </svg>
    </div>
  );
}

function RangeTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [c, setC] = useState(0);
  const [w, setW] = useState(1);
  const [x, setX] = useState(0.5);
  const [seen, setSeen] = useState<RelKind[]>(["suf"]);
  const grab = useRef<null | "bar" | "dot">(null);
  const stateRef = useRef({ c: 0, w: 1 });

  const rel = relOfRange(c, w);
  const cleared = seen.length === 4;
  const pOn = inP(x, c, w);
  const qOn = inQ(x);

  useEffect(() => {
    stateRef.current = { c, w };
  });

  const mark = useCallback((cc: number, ww: number) => {
    const r = relOfRange(cc, ww);
    setSeen((s) => (s.includes(r) ? s : [...s, r]));
  }, []);

  useEffect(() => {
    function move(e: PointerEvent) {
      if (!grab.current) return;
      const svg = svgRef.current;
      if (!svg) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const px = ((e.clientX - rect.left) * NL.w) / rect.width;
      const v = NL.from + ((px - NL.x0) / (NL.x1 - NL.x0)) * (NL.to - NL.from);
      if (grab.current === "dot") {
        setX(Math.max(NL.from, Math.min(NL.to, Math.round(v * 10) / 10)));
        return;
      }
      const snapped = Math.max(C_MIN, Math.min(C_MAX, Math.round(v / STEP) * STEP));
      setC(snapped);
      mark(snapped, stateRef.current.w);
    }
    function up() {
      grab.current = null;
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [mark]);

  function slide(which: "c" | "w", v: number) {
    if (which === "c") {
      setC(v);
      mark(v, w);
    } else {
      setW(v);
      mark(c, v);
    }
  }
  function preset(p: { c: number; w: number }) {
    setC(p.c);
    setW(p.w);
    mark(p.c, p.w);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">📏 파란 막대 p 의 범위를 움직여 보세요</p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          조건 <b className="text-amber-200">q</b> 는 <Katex expr="-2 \le x \le 2" /> 로 고정되어 있어요. 막대를 끌거나 슬라이더를 돌리면 조건의 이름이 바뀝니다.
        </p>
      </div>

      <NumberLine
        c={c}
        w={w}
        x={x}
        svgRef={svgRef}
        onGrabBar={() => {
          grab.current = "bar";
        }}
        onGrabDot={() => {
          grab.current = "dot";
        }}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] font-bold text-sky-200">
                조건 p : <span className="font-mono text-slate-100">{num(c - w)} ≤ x ≤ {num(c + w)}</span>
              </p>
            </div>
            <label className="mt-1.5 block text-[11px] font-bold text-slate-400">
              가운데 {num(c)}
              <input type="range" min={C_MIN} max={C_MAX} step={STEP} value={c} onChange={(e) => slide("c", Number(e.target.value))} className="mt-0.5 w-full accent-sky-400" />
            </label>
            <label className="mt-1 block text-[11px] font-bold text-slate-400">
              폭 {num(w)}
              <input type="range" min={W_MIN} max={W_MAX} step={STEP} value={w} onChange={(e) => slide("w", Number(e.target.value))} className="mt-0.5 w-full accent-sky-400" />
            </label>
            <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
              {RANGE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => preset(p)}
                  className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 점 확인 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[12px] font-bold text-slate-200">
              🔘 수직선 위의 점을 끌어 <span className="font-mono text-slate-100">x = {num(x)}</span> 을 확인해 보세요
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className={"rounded-xl border-2 px-3 py-2.5 text-center " + (pOn ? "border-sky-400/60 bg-sky-400/15" : "border-white/10 bg-white/[0.03]")}>
                <p className="text-[11px] font-bold text-sky-200">조건 p</p>
                <p className={"mt-0.5 text-lg font-extrabold " + (pOn ? "text-sky-100" : "text-slate-600")}>{pOn ? "만족 ⭕" : "불만족 ❌"}</p>
              </div>
              <div className={"rounded-xl border-2 px-3 py-2.5 text-center " + (qOn ? "border-amber-400/60 bg-amber-400/15" : "border-white/10 bg-white/[0.03]")}>
                <p className="text-[11px] font-bold text-amber-200">조건 q</p>
                <p className={"mt-0.5 text-lg font-extrabold " + (qOn ? "text-amber-100" : "text-slate-600")}>{qOn ? "만족 ⭕" : "불만족 ❌"}</p>
              </div>
            </div>
            <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
              {rel === "suf" || rel === "iff"
                ? "p 를 만족하는 자리에서는 q 도 반드시 켜져요 — 그래서 p 가 충분조건이에요."
                : rel === "nec"
                  ? "q 를 만족하는 자리에서는 p 도 반드시 켜져요 — 그래서 p 가 필요조건이에요."
                  : "한쪽만 켜지는 자리가 양쪽에 다 있어요 — 그래서 아무 조건도 되지 못해요."}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className={"rounded-2xl border-2 p-4 text-center transition " + REL_META[rel].ring + " " + REL_META[rel].soft}>
            <p className="text-4xl">{REL_META[rel].emoji}</p>
            <p className="mt-1 text-[13px] leading-7 text-slate-100">
              <b className="text-sky-200">p</b> 는 <b className="text-amber-200">q</b> 이기 위한
            </p>
            <p className={"text-2xl font-extrabold " + REL_META[rel].tone}>{REL_META[rel].label}</p>
            {rel !== "none" ? (
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-[13px] text-slate-200">
                <span className="rounded-lg bg-black/30 px-2.5 py-1">
                  <Katex expr={REL_META[rel].arrow} />
                </span>
                <span className="rounded-lg bg-black/30 px-2.5 py-1">
                  <Katex expr={REL_META[rel].set} />
                </span>
              </div>
            ) : (
              <p className="mt-1.5 text-[12px] text-slate-400">어느 쪽도 다른 쪽을 품지 못해요</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[12px] font-bold text-slate-200">
              🎯 미션 · <b className="text-cyan-200">네 가지 조건</b>을 모두 만들어 보세요
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {REL_ORDER.map((r) => {
                const got = seen.includes(r);
                const now = rel === r;
                return (
                  <div
                    key={r}
                    className={
                      "rounded-xl border-2 px-2 py-2 text-center text-[12px] font-bold transition " +
                      (now ? "border-cyan-400/70 bg-cyan-400/15 text-cyan-100" : got ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/[0.03] text-slate-500")
                    }
                  >
                    {got ? "✅" : "⬜"} {REL_META[r].label}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-center font-mono text-[12px] font-bold text-slate-400">{seen.length} / 4</p>
          </div>
        </div>
      </div>

      {cleared ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 가지를 모두 만들었어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <p className="rounded-xl bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
              p 의 범위를 <b className="text-white">좁히면</b> → <b className="text-sky-200">충분조건</b>
              <br />p 의 범위를 <b className="text-white">넓히면</b> → <b className="text-amber-200">필요조건</b>
            </p>
            <p className="rounded-xl bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
              딱 <b className="text-white">겹치면</b> → <b className="text-emerald-200">필요충분조건</b>
              <br />
              <b className="text-white">걸치기만</b> 하면 → <b className="text-rose-200">아무 조건도 아님</b>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 같은 뜻 짝 찾기
// ══════════════════════════════════════════════════════════════
function MatchTab() {
  const [sel, setSel] = useState<string | null>(null);
  const [paired, setPaired] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tries, setTries] = useState(0);

  const cleared = paired.length === MATCH_L.length;

  function tap(card: MatchCard) {
    if (cleared || paired.includes(card.pairId)) return;
    if (card.side === "L") {
      setSel(card.id);
      setMsg(null);
      return;
    }
    if (!sel) {
      setMsg({ ok: false, text: "왼쪽 카드를 먼저 고르세요." });
      return;
    }
    const left = MATCHES.find((c) => c.id === sel) as MatchCard;
    setTries((t) => t + 1);
    if (left.pairId === card.pairId) {
      setPaired((s) => [...s, card.pairId]);
      setSel(null);
      setMsg({ ok: true, text: "같은 뜻이에요! 두 조건을 만족하는 x 가 완전히 같답니다." });
      return;
    }
    const sp = splitAt(left, card);
    setMsg({
      ok: false,
      text: sp
        ? `x = ${num(sp.x)} 은(는) ${sp.inA ? "왼쪽" : "오른쪽"} 조건만 만족해요. 진리집합이 다르니 짝이 아니랍니다.`
        : "짝이 아니에요.",
    });
    setSel(null);
  }

  const col = (cards: MatchCard[], order: number[], side: "L" | "R") => (
    <div className="space-y-1.5">
      <p className={"text-center text-[11px] font-bold " + (side === "L" ? "text-sky-200" : "text-violet-200")}>{side === "L" ? "[ 왼쪽 조건 ]" : "[ 오른쪽 조건 ]"}</p>
      {order.map((k) => {
        const c = cards[k];
        const done = paired.includes(c.pairId);
        const on = sel === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => tap(c)}
            disabled={done || cleared}
            className={
              "flex w-full items-center justify-center gap-2 overflow-x-auto overflow-y-hidden rounded-xl border-2 px-3 py-3 text-[15px] font-bold transition disabled:cursor-default " +
              (done
                ? "border-emerald-400/55 bg-emerald-400/12 text-emerald-100"
                : on
                  ? "border-cyan-400/80 bg-cyan-400/20 text-cyan-50"
                  : side === "L"
                    ? "border-sky-400/35 bg-sky-400/[0.07] text-slate-100 hover:bg-sky-400/15"
                    : "border-violet-400/35 bg-violet-400/[0.07] text-slate-100 hover:bg-violet-400/15")
            }
          >
            {done ? <span className="text-[12px]">✅</span> : null}
            <PieceLine ps={c.cond} />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🧩 서로 같은 뜻인 조건끼리 짝지으세요</p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          전체집합은 <b className="text-slate-200">실수 전체</b> 예요. 왼쪽 카드를 고른 뒤 오른쪽 카드를 누르면 됩니다.
        </p>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
          두 조건이 <b className="text-emerald-200">필요충분조건</b> <span className="mx-1 text-slate-500">⟺</span> <Katex expr="P = Q" />{" "}
          <span className="mx-1 text-slate-500">⟺</span> <Katex expr="p \Leftrightarrow q" />
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {col(MATCH_L, MATCH_L_ORDER, "L")}
        {col(MATCH_R, MATCH_R_ORDER, "R")}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[12px] font-bold text-slate-300">
          맞춘 짝 {paired.length} / {MATCH_L.length} · 시도 {tries}
        </span>
        {sel ? <span className="rounded-lg bg-cyan-400/15 px-3 py-1 text-[11px] font-bold text-cyan-100">왼쪽을 골랐어요 — 오른쪽에서 같은 뜻을 찾아보세요</span> : null}
      </div>

      {msg ? (
        <p className={"rounded-xl px-3 py-2.5 text-[12px] leading-6 " + (msg.ok ? "bg-emerald-400/12 text-emerald-100" : "bg-rose-400/12 text-rose-100")}>
          {msg.ok ? "✅" : "❌"} {msg.text}
        </p>
      ) : null}

      {cleared ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 짝을 모두 찾았어요! (시도 {tries}회)</p>
          <div className="space-y-1.5">
            {MATCH_L_ORDER.map((k) => {
              const l = MATCH_L[k];
              const r = MATCH_R.find((c) => c.pairId === l.pairId) as MatchCard;
              return (
                <p key={l.id} className="flex flex-wrap items-center justify-center gap-x-3 rounded-lg bg-black/25 px-3 py-2 text-[13px] text-slate-100">
                  <PieceLine ps={l.cond} />
                  <span className="text-emerald-300">
                    <Katex expr="\Leftrightarrow" />
                  </span>
                  <PieceLine ps={r.cond} />
                </p>
              );
            })}
          </div>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
            ※ <Katex expr="x^2 = 4" /> 와 <Katex expr="x = 2" /> 는 짝이 아니었지요. <Katex expr="x = -2" /> 때문에 <Katex expr="x = 2" /> 는{" "}
            <b className="text-sky-200">충분조건일 뿐</b> 이랍니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 충분·필요 스피드 + 순위표
// ══════════════════════════════════════════════════════════════
type Phase = "idle" | "run" | "done";

const HS_KEY = "mathlab.necessary_sufficient.best";
const ACTIVITY_SLUG = "common2/mini/necessary_sufficient_lab";

/** 이 기기에 남겨 둔 최고 기록(로그인 전에도 보이도록). */
function readBest(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(HS_KEY);
    return v === null ? null : Number(v) || 0;
  } catch {
    return null;
  }
}

type Miss = { item: SpeedItem; picked: RelKind };

function SpeedTab() {
  const ctx = useActivityContext();
  const activitySlug = ctx?.activitySlug ?? ACTIVITY_SLUG;
  const subject = ctx?.subject ?? "공통수학2";

  const [phase, setPhase] = useState<Phase>("idle");
  const [item, setItem] = useState<SpeedItem | null>(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [left, setLeft] = useState(SPEED_SECONDS);
  const [flash, setFlash] = useState<null | "ok" | "no">(null);
  const [misses, setMisses] = useState<Miss[]>([]);
  const [best, setBest] = useState<number | null>(readBest);
  const [saveMsg, setSaveMsg] = useState("");
  const [reload, setReload] = useState(0);

  // 타이머 콜백에서 최신 값을 읽기 위한 거울
  const deadlineRef = useRef(0);
  const scoreRef = useRef(0);
  const wrongRef = useRef(0);
  const bestRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  /** 한 판을 마무리 — 최고 기록 갱신 + 랭킹 제출(신원은 서버 RPC 가 auth.uid() 로 채운다). */
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = scoreRef.current;
    const w = wrongRef.current;
    setPhase("done");

    if (bestRef.current === null || s > bestRef.current) {
      bestRef.current = s;
      setBest(s);
      try {
        window.localStorage.setItem(HS_KEY, String(s));
      } catch {
        /* 저장소를 못 쓰는 환경은 무시 */
      }
    }

    if (s <= 0) {
      setSaveMsg("0점은 순위표에 올라가지 않아요. 한 문제라도 맞혀 보세요!");
      return;
    }
    setSaveMsg("점수를 올리는 중…");
    void (async () => {
      const res = await submitActivityScore({
        activitySlug,
        subject,
        difficulty: SPEED_MODE,
        score: s,
        meta: { correct: s, wrong: w, seconds: SPEED_SECONDS },
      });
      if (res.ok) {
        setSaveMsg("순위표에 기록했어요! 🏅");
        setReload((x) => x + 1);
      } else {
        setSaveMsg(res.notStudent ? "학생 계정으로 로그인하면 순위표에 기록돼요." : `점수 저장 실패: ${res.error}`);
      }
    })();
  }, [activitySlug, subject]);

  // 타이머 — 남은 시간만 갱신하고, 0이 되면 마무리한다.
  useEffect(() => {
    if (phase !== "run") return;
    const t = window.setInterval(() => {
      const remain = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
      setLeft(remain);
      if (remain <= 0) finish();
    }, 100);
    return () => window.clearInterval(t);
  }, [phase, finish]);

  function start() {
    deadlineRef.current = Date.now() + SPEED_SECONDS * 1000;
    scoreRef.current = 0;
    wrongRef.current = 0;
    doneRef.current = false;
    setScore(0);
    setWrong(0);
    setMisses([]);
    setLeft(SPEED_SECONDS);
    setSaveMsg("");
    setItem(makeSpeedItem());
    setPhase("run");
  }

  function answer(r: RelKind) {
    if (!item || phase !== "run") return;
    if (r === item.answer) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash("ok");
    } else {
      wrongRef.current += 1;
      setWrong(wrongRef.current);
      deadlineRef.current -= SPEED_PENALTY * 1000;
      setFlash("no");
      setMisses((s) => (s.length >= 5 ? s : [...s, { item, picked: r }]));
    }
    window.setTimeout(() => setFlash(null), 220);
    setItem(makeSpeedItem(item.key));
  }

  return (
    <div className="space-y-4">
      {phase === "idle" ? (
        <div className="rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/[0.12] to-rose-500/[0.06] p-6 text-center">
          <p className="text-4xl">⚡</p>
          <p className="mt-2 text-xl font-extrabold text-amber-100">{SPEED_SECONDS}초 충분·필요 판정</p>
          <div className="mx-auto mt-3 grid max-w-md gap-1.5 text-left text-sm leading-6 text-slate-300">
            <p>
              • 전체집합은 <b className="text-slate-100">12 이하의 자연수</b> 예요.
            </p>
            <p>
              • 두 조건을 보고 <b className="text-white">p 는 q 이기 위한 무슨 조건</b>인지 고르세요.
            </p>
            <p>
              • 양쪽이 모두 참이면 <b className="text-emerald-200">필요충분조건</b> 을 골라야 해요.
            </p>
            <p>
              • 틀리면 남은 시간이 <b className="text-rose-200">{SPEED_PENALTY}초</b> 줄어드니 찍기는 손해!
            </p>
          </div>
          {best !== null ? <p className="mt-3 font-mono text-sm font-bold text-amber-200">내 최고 기록 {best}점</p> : null}
          <button
            type="button"
            onClick={start}
            className="mt-4 rounded-xl border-2 border-amber-400/60 bg-amber-400/20 px-8 py-3 text-lg font-extrabold text-amber-100 transition hover:bg-amber-400/30"
          >
            시작하기 🚀
          </button>
        </div>
      ) : null}

      {phase === "run" && item ? (
        <div
          className={
            "rounded-2xl border-2 p-4 transition-colors " +
            (flash === "ok" ? "border-emerald-400/70 bg-emerald-400/10" : flash === "no" ? "border-rose-400/70 bg-rose-400/10" : "border-white/10 bg-slate-900/40")
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full border border-emerald-400/45 bg-emerald-400/15 px-3 py-1 font-mono text-sm font-bold text-emerald-100">✅ {score}</span>
            <span className="font-mono text-2xl font-extrabold text-amber-100">{left.toFixed(1)}초</span>
            <span className="rounded-full border border-rose-400/45 bg-rose-400/15 px-3 py-1 font-mono text-sm font-bold text-rose-100">❌ {wrong}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className={"h-full rounded-full transition-all " + (left < 10 ? "bg-rose-400" : "bg-amber-400")} style={{ width: `${(left / SPEED_SECONDS) * 100}%` }} />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <CondCard name="p" ps={item.p.cond} tone="p" />
            <CondCard name="q" ps={item.q.cond} tone="q" />
          </div>
          <p className="mt-2 text-center text-[13px] font-bold text-slate-200">
            <b className="text-sky-200">p</b> 는 <b className="text-amber-200">q</b> 이기 위한 …
          </p>

          <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {REL_ORDER.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => answer(r)}
                className="rounded-xl border-2 border-white/12 bg-white/5 px-2 py-3 text-[13px] font-bold text-slate-100 transition hover:bg-white/15 active:scale-95"
              >
                <span className="block text-lg">{REL_META[r].emoji}</span>
                {REL_META[r].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-500">빠르게! 오답은 −{SPEED_PENALTY}초</p>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/15 to-rose-500/10 p-5 text-center">
            <p className="text-3xl">{score >= 15 ? "🏆" : score >= 8 ? "🎉" : "💪"}</p>
            <p className="mt-1 text-sm font-bold text-amber-200">{SPEED_SECONDS}초 기록</p>
            <p className="mt-1 font-mono text-4xl font-extrabold text-white">{score}점</p>
            <p className="mt-1 text-xs text-slate-400">
              맞힘 {score} · 틀림 {wrong}
              {best !== null ? ` · 내 최고 ${best}점` : ""}
            </p>
            {saveMsg ? <p className="mt-2 text-xs font-bold text-emerald-200">{saveMsg}</p> : null}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={start}
                className="rounded-xl border-2 border-amber-400/60 bg-amber-400/20 px-6 py-2 text-sm font-extrabold text-amber-100 transition hover:bg-amber-400/30"
              >
                ↻ 다시 도전
              </button>
              <button
                type="button"
                onClick={() => setPhase("idle")}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
              >
                규칙 다시 보기
              </button>
            </div>
          </div>

          {misses.length > 0 ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/[0.06] p-4">
              <p className="text-sm font-bold text-rose-200">🔎 놓친 문제 다시 보기</p>
              <div className="mt-2 space-y-2">
                {misses.map((m, idx) => (
                  <div key={idx} className="rounded-xl bg-black/25 px-3 py-2.5">
                    <p className="flex flex-wrap items-center justify-center gap-x-2 text-[13px] leading-7 text-slate-100">
                      <span className="text-sky-200">
                        <PieceLine ps={m.item.p.cond} />
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="text-amber-200">
                        <PieceLine ps={m.item.q.cond} />
                      </span>
                    </p>
                    <p className="mt-0.5 text-center font-mono text-[11px] text-slate-400">
                      P = {"{"}
                      {speedSet(m.item.p).join(",")}
                      {"}"} · Q = {"{"}
                      {speedSet(m.item.q).join(",")}
                      {"}"}
                    </p>
                    <p className="mt-1 text-center text-[12px] leading-6 text-slate-300">
                      고른 답 <b className="text-rose-200">{REL_META[m.picked].label}</b> → 정답{" "}
                      <b className="text-emerald-200">
                        {REL_META[m.item.answer].emoji} {REL_META[m.item.answer].label}
                      </b>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <Leaderboard activitySlug={activitySlug} reloadToken={reload} />
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

function Leaderboard({ activitySlug, reloadToken }: { activitySlug: string; reloadToken: number }) {
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const res = await fetchLeaderboard({ activitySlug, limit: 20 });
      if (!alive) return;
      if (res.ok) {
        setRows(res.rows);
        setErr("");
      } else {
        setRows(null);
        setErr(res.error);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [activitySlug, reloadToken, tick]);

  const meMissing = !!rows && rows.length > 0 && !rows.some((r) => r.isMe);

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-violet-200">
          🏅 충분·필요 스피드 순위표 <span className="text-[11px] font-normal text-slate-500">(학생별 최고 점수)</span>
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setTick((x) => x + 1);
          }}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          🔄 새로고침
        </button>
      </div>

      {loading ? (
        <p className="mt-3 text-center text-xs text-slate-400">순위표를 불러오는 중…</p>
      ) : err ? (
        <p className="mt-3 text-center text-xs text-rose-300">순위표를 불러오지 못했습니다: {err}</p>
      ) : !rows || rows.length === 0 ? (
        <p className="mt-3 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-4 text-center text-xs leading-5 text-slate-400">
          아직 기록이 없어요. 첫 번째 도전자가 되어 보세요! 🚀
        </p>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[380px] text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-2.5 py-2 text-left font-semibold">순위</th>
                  <th className="px-2.5 py-2 text-left font-semibold">이름</th>
                  <th className="px-2.5 py-2 text-right font-semibold">학급</th>
                  <th className="px-2.5 py-2 text-right font-semibold">최고 점수</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.rank}-${r.displayName}`} className={"border-t border-white/5 " + (r.isMe ? "bg-violet-400/15 font-bold" : "")}>
                    <td className="px-2.5 py-2 text-left text-base">{r.rank <= 3 ? MEDALS[r.rank - 1] : `${r.rank}위`}</td>
                    <td className="px-2.5 py-2 text-left text-slate-100">
                      {r.displayName}
                      {r.isMe ? <span className="ml-1.5 text-[11px] text-violet-200">← 나</span> : null}
                    </td>
                    <td className="px-2.5 py-2 text-right font-mono text-xs text-slate-400">{r.grade && r.classNumber ? `${r.grade}-${r.classNumber}` : "—"}</td>
                    <td className="px-2.5 py-2 text-right font-mono font-extrabold text-amber-200">{r.bestScore}점</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meMissing ? (
            <p className="mt-2 rounded-lg border border-violet-400/35 bg-violet-400/10 px-3 py-2 text-center text-xs font-bold text-violet-100">
              아직 상위 {rows.length}명 안에 이름이 없어요. 한 번 더 도전해 볼까요? 💪
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
