"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  FAMILY_META,
  KIND_META,
  KIND_ORDER,
  LAYERS,
  LAYER_META,
  MAT_META,
  METHODS,
  METHOD_ORDER,
  PROOFS,
  STEPS,
  STORIES,
  TERMS,
  TERM_ORDER,
  WORD_START,
  allPieces,
  wordById,
  type Family,
  type Layer,
  type MethodTask,
  type Piece,
  type ProofKind,
  type ProofTask,
  type StepTask,
  type TermCard,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_undefined",
    prompt:
      "수학에 무정의 용어와 공리가 꼭 있어야 하는 까닭을, 탭①에서 낱말을 따라가 본 경험을 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 정의에도 다른 용어가 쓰이므로 뜻풀이를 계속 따라가면 언젠가 이미 지나온 낱말로 돌아온다. 낱말의 수가 유한하기 때문이다. 그래서 정의를 멈출 자리인 무정의 용어를 두어야 한다. 공리도 같은 이유로, 증명을 계속 거슬러 올라가면 끝이 없으므로 증명 없이 받아들일 출발점을 정해 둔 것이다.",
  },
  {
    id: "methods",
    prompt:
      "직접증명법과 간접증명법은 무엇이 다른지, 그리고 대우법과 귀류법은 어떻게 구분되는지 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 직접증명법은 가정에서 출발해 곧바로 결론까지 밀고 나가는 방법이고, 간접증명법은 명제를 그대로 다루지 않고 돌려서 밝히는 방법이다. 대우법은 명제 대신 대우를 증명하는 것이고(명제와 대우는 참·거짓이 같으므로), 귀류법은 결론을 부정했다고 가정한 뒤 모순을 이끌어내 그 가정이 틀렸음을 보이는 것이다.",
  },
  {
    id: "no_conclusion",
    prompt:
      "증명하려는 결론을 증명 중간에 끌어다 쓰면 왜 안 되는지, 탭③·④에서 만난 함정을 예로 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 증명은 가정에서 출발해 결론에 닿는 길을 놓는 일인데, 결론을 중간에 쓰면 닿아야 할 곳을 이미 있다고 치는 셈이라 제자리를 맴도는 순환 논증이 된다. 「m + n 이 짝수이므로 m + n = 2s 로 놓자」 같은 문장이 그런 함정이었다. 그림만 보고 짐작하거나 사례 몇 개를 확인한 것도 증명이 되지 못한다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "tower" | "methods" | "materials" | "steps";

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

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function ProofBasicsLab() {
  const [tab, setTab] = useState<Tab>("tower");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🏛️ 용어의 정의와 증명, 정리</h3>
        <p className="mt-2 leading-7 text-slate-300">
          수학은 <b className="text-slate-100">몇 개의 약속</b> 위에 <b className="text-emerald-200">증명</b> 으로 한 층씩 쌓아 올린 건축이에요. 그 바닥돌부터 살펴봅시다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "tower"} onClick={() => setTab("tower")}>
          ① 수학의 탑 🏛️
        </TabButton>
        <TabButton active={tab === "methods"} onClick={() => setTab("methods")}>
          ② 증명법 지도 🗺️
        </TabButton>
        <TabButton active={tab === "materials"} onClick={() => setTab("materials")}>
          ③ 증명 재료 고르기 🧰
        </TabButton>
        <TabButton active={tab === "steps"} onClick={() => setTab("steps")}>
          ④ 증명 조각 맞추기 🧱
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "tower" ? <TowerTab /> : null}
        {tab === "methods" ? <MethodTab /> : null}
        {tab === "materials" ? <MaterialTab /> : null}
        {tab === "steps" ? <StepTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 수학의 탑
// ══════════════════════════════════════════════════════════════
function TowerTab() {
  const [placed, setPlaced] = useState<Record<string, Layer>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const deck = TERM_ORDER.map((k) => TERMS[k]);
  const rest = deck.filter((c) => !placed[c.id]);
  const cleared = rest.length === 0;

  function drop(layer: Layer) {
    if (!sel) {
      setMsg({ ok: false, text: "아래에서 카드를 먼저 고르세요." });
      return;
    }
    const card = TERMS.find((c) => c.id === sel) as TermCard;
    if (card.layer === layer) {
      setPlaced((s) => ({ ...s, [card.id]: layer }));
      setSel(null);
      setMsg({ ok: true, text: card.why });
    } else {
      setMsg({ ok: false, text: `${LAYER_META[layer].label} 이 아니에요. ${card.why}` });
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🏛️ 카드를 알맞은 층에 올려 탑을 쌓으세요</p>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">카드를 고른 뒤 층을 누르면 올라갑니다. 아래층이 위층을 떠받치는 구조예요.</p>
      </div>

      {/* 탑 */}
      <div className="space-y-1.5">
        {LAYERS.map((l, li) => {
          const mine = TERMS.filter((c) => placed[c.id] === l);
          const meta = LAYER_META[l];
          const width = ["w-[82%]", "w-[88%]", "w-[94%]", "w-full"][li] ?? "w-full";
          return (
            <button
              key={l}
              type="button"
              onClick={() => drop(l)}
              disabled={cleared}
              className={
                "mx-auto block rounded-2xl border-2 p-3 text-left transition disabled:cursor-default " +
                width +
                " " +
                (sel ? meta.ring + " " + meta.soft + " hover:brightness-125" : "border-white/12 bg-white/[0.03]")
              }
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className={"text-[13px] font-extrabold " + meta.tone}>
                  {meta.emoji} {meta.label}
                </span>
                <span className="text-[11px] text-slate-500">{meta.blurb}</span>
              </div>
              <div className="mt-1.5 flex min-h-[34px] flex-wrap items-center gap-1.5">
                {mine.length === 0 ? (
                  <span className="text-[11px] font-bold text-slate-600">{sel ? "여기에 올리려면 누르세요" : "아직 비어 있어요"}</span>
                ) : (
                  mine.map((c) => (
                    <span key={c.id} className={"rounded-lg border px-2 py-1 text-[12px] font-bold " + meta.ring + " " + meta.soft + " " + meta.tone}>
                      <PieceLine ps={c.text} />
                    </span>
                  ))
                )}
              </div>
            </button>
          );
        })}
      </div>

      {msg ? (
        <p className={"rounded-xl px-3 py-2.5 text-[12px] leading-6 " + (msg.ok ? "bg-emerald-400/12 text-emerald-100" : "bg-rose-400/12 text-rose-100")}>
          {msg.ok ? "✅" : "❌"} {msg.text}
        </p>
      ) : null}

      {/* 카드 팔레트 */}
      {!cleared ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="text-[12px] font-bold text-slate-200">
            🃏 아직 올리지 않은 카드 <span className="font-mono text-slate-400">({rest.length} / {TERMS.length})</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {rest.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSel(c.id);
                  setMsg(null);
                }}
                className={
                  "rounded-xl border-2 px-2.5 py-2 text-[12px] font-bold transition " +
                  (sel === c.id ? "border-cyan-400/80 bg-cyan-400/20 text-cyan-50" : "border-white/12 bg-white/[0.04] text-slate-200 hover:bg-white/10")
                }
              >
                <PieceLine ps={c.text} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 탑을 모두 쌓았어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <b className="text-slate-100">무정의 용어</b> 와 <b className="text-amber-200">공리</b> 를 바닥에 깔고, <b className="text-sky-200">정의</b> 로 말을 다듬은 뒤,{" "}
            <b className="text-emerald-200">증명</b> 을 거쳐 <b className="text-emerald-200">정리</b> 를 얹는 것 — 이것이 수학이 쌓이는 방식이에요.
          </p>
          <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <b className="text-white">증명</b> · 이미 알려진 사실이나 성질을 이용해 어떤 명제가 참 또는 거짓임을 논리적으로 밝히는 과정
          </p>
        </div>
      )}

      <WordLoop />
      <StoryList />
    </div>
  );
}

/** 순환 정의 체험 — 뜻풀이를 따라가다 보면 이미 지나온 낱말로 돌아온다 */
function WordLoop() {
  const [path, setPath] = useState<string[]>([WORD_START]);
  const [loop, setLoop] = useState<string | null>(null);

  const cur = wordById(path[path.length - 1]);

  function go(to: string) {
    if (loop) return;
    if (path.includes(to)) {
      setLoop(to);
      setPath((p) => [...p, to]);
      return;
    }
    setPath((p) => [...p, to]);
  }

  return (
    <div className="rounded-2xl border-2 border-violet-400/30 bg-violet-400/[0.06] p-4">
      <p className="text-sm font-bold text-violet-100">🔁 뜻풀이를 끝까지 따라가 볼까요?</p>
      <p className="mt-1 text-[12px] leading-6 text-slate-400">밑줄 친 낱말을 눌러 그 낱말의 뜻풀이로 건너가 보세요.</p>

      {/* 지나온 길 */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {path.map((id, i) => (
          <span key={`${id}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 ? <span className="text-slate-500">→</span> : null}
            <span
              className={
                "rounded-lg border px-2 py-0.5 text-[12px] font-bold " +
                (loop && id === loop && i === path.length - 1
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : i === path.length - 1
                    ? "border-cyan-400/70 bg-cyan-400/15 text-cyan-100"
                    : "border-white/12 bg-white/[0.04] text-slate-300")
              }
            >
              {wordById(id).word}
            </span>
          </span>
        ))}
      </div>

      {loop ? (
        <div className="mt-3 space-y-2">
          <p className="rounded-xl bg-rose-400/12 px-3 py-2.5 text-[12px] leading-7 text-rose-100">
            🔁 <b className="text-white">「{wordById(loop).word}」로 되돌아왔어요!</b> 뜻풀이에 또 다른 용어가 쓰이니, 계속 따라가면 언젠가 반드시 지나온 낱말을 다시 만나게 됩니다. 낱말의
            수가 유한하니까요.
          </p>
          <p className="rounded-xl bg-black/25 px-3 py-2.5 text-[12px] leading-7 text-slate-300">
            그래서 수학은 <b className="text-slate-100">어딘가에서 정의를 멈춥니다</b>. 그렇게 정의 없이 그대로 쓰기로 한 말이 <b className="text-white">무정의 용어</b> — 점, 선, 면
            같은 것들이에요.
          </p>
          <button
            type="button"
            onClick={() => {
              setPath([WORD_START]);
              setLoop(null);
            }}
            className="w-full rounded-xl border-2 border-violet-400/50 bg-violet-400/12 px-3 py-2 text-[12px] font-bold text-violet-100 transition hover:bg-violet-400/22"
          >
            ↺ 다른 길로 다시 따라가기
          </button>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-white/12 bg-black/30 px-4 py-4 text-center">
          <p className="text-[11px] font-bold tracking-widest text-slate-500">낱말의 뜻</p>
          <p className="mt-1 text-lg font-bold leading-8 text-slate-100">
            <b className="text-cyan-200">{cur.word}</b>
            <span className="mx-1.5 text-slate-500">:</span>
            {cur.parts.map((p, i) =>
              typeof p === "string" ? (
                <span key={i}>{p}</span>
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(p.to)}
                  className="mx-0.5 rounded border-b-2 border-violet-400/70 bg-violet-400/15 px-1 text-violet-100 transition hover:bg-violet-400/30"
                >
                  {wordById(p.to).word}
                </button>
              ),
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function StoryList() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
      <p className="text-[12px] font-bold text-slate-200">📚 수학사 한 조각</p>
      <div className="mt-2 space-y-1.5">
        {STORIES.map((s) => {
          const on = open === s.id;
          return (
            <div key={s.id} className={"rounded-xl border-2 transition " + (on ? "border-amber-400/50 bg-amber-400/[0.08]" : "border-white/10 bg-white/[0.03]")}>
              <button type="button" onClick={() => setOpen(on ? null : s.id)} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left">
                <span className="text-[13px] font-bold text-slate-100">
                  {s.emoji} {s.title}
                </span>
                <span className="shrink-0 text-[11px] text-slate-500">{s.when}</span>
              </button>
              {on ? <p className="border-t border-white/10 px-3 py-2.5 text-[12px] leading-7 text-slate-300">{s.body}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 증명법 지도
// ══════════════════════════════════════════════════════════════
function MethodTree({ active }: { active: ProofKind | null }) {
  const rows: { kind: ProofKind; y: number }[] = [
    { kind: "deductive", y: 34 },
    { kind: "inductive", y: 82 },
    { kind: "contrapositive", y: 148 },
    { kind: "contradiction", y: 196 },
  ];
  const fam: { f: Family; y: number }[] = [
    { f: "direct", y: 58 },
    { f: "indirect", y: 172 },
  ];
  const on = (k: ProofKind) => active === k;
  const famOn = (f: Family) => !!active && KIND_META[active].family === f;
  return (
    <svg viewBox="0 0 460 232" className="mx-auto block w-full max-w-[440px] select-none" role="img" aria-label="증명법 분류 지도">
      {/* 뿌리 줄기 */}
      <line x1={24} y1={58} x2={24} y2={172} stroke="rgba(148,163,184,0.4)" strokeWidth={2} />
      {fam.map(({ f, y }) => (
        <g key={f}>
          <line x1={24} y1={y} x2={54} y2={y} stroke={famOn(f) ? "#67e8f9" : "rgba(148,163,184,0.4)"} strokeWidth={famOn(f) ? 3 : 2} />
          <rect
            x={54}
            y={y - 17}
            width={132}
            height={34}
            rx={9}
            fill={famOn(f) ? "rgba(103,232,249,0.16)" : "rgba(255,255,255,0.04)"}
            stroke={famOn(f) ? "#67e8f9" : "rgba(148,163,184,0.35)"}
            strokeWidth={famOn(f) ? 2.5 : 1.5}
          />
          <text x={120} y={y + 5} textAnchor="middle" className="text-[14px] font-bold" fill={famOn(f) ? "#cffafe" : "rgba(203,213,225,0.8)"}>
            {FAMILY_META[f].emoji} {FAMILY_META[f].label}
          </text>
        </g>
      ))}
      {/* 가지 */}
      <line x1={200} y1={34} x2={200} y2={82} stroke="rgba(148,163,184,0.4)" strokeWidth={2} />
      <line x1={200} y1={148} x2={200} y2={196} stroke="rgba(148,163,184,0.4)" strokeWidth={2} />
      <line x1={186} y1={58} x2={200} y2={58} stroke="rgba(148,163,184,0.4)" strokeWidth={2} />
      <line x1={186} y1={172} x2={200} y2={172} stroke="rgba(148,163,184,0.4)" strokeWidth={2} />
      {rows.map(({ kind, y }) => (
        <g key={kind}>
          <line x1={200} y1={y} x2={228} y2={y} stroke={on(kind) ? "#34d399" : "rgba(148,163,184,0.4)"} strokeWidth={on(kind) ? 3 : 2} />
          <rect
            x={228}
            y={y - 16}
            width={212}
            height={32}
            rx={9}
            fill={on(kind) ? "rgba(52,211,153,0.18)" : "rgba(255,255,255,0.04)"}
            stroke={on(kind) ? "#34d399" : "rgba(148,163,184,0.35)"}
            strokeWidth={on(kind) ? 2.5 : 1.5}
          />
          <text x={334} y={y + 5} textAnchor="middle" className="text-[13px] font-bold" fill={on(kind) ? "#d1fae5" : "rgba(203,213,225,0.8)"}>
            {KIND_META[kind].emoji} {KIND_META[kind].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function MethodTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const deck = METHOD_ORDER.map((k) => METHODS[k]);
  const t = deck[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🗺️ 이 증명은 어떤 방법을 쓴 걸까요?</p>
          <Chips ids={deck.map((x) => x.id)} cur={i} done={done} onPick={setI} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {(["direct", "indirect"] as Family[]).map((f) => (
            <p key={f} className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
              <b className="text-cyan-200">
                {FAMILY_META[f].emoji} {FAMILY_META[f].label}
              </b>
              <br />
              {FAMILY_META[f].blurb}
            </p>
          ))}
        </div>
      </div>

      <MethodOne
        key={t.id}
        t={t}
        last={i === deck.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(deck.length - 1, k + 1))}
      />

      {done.length === METHODS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 열 개의 증명을 모두 분류했어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {KIND_ORDER.map((k) => (
              <p key={k} className="rounded-xl bg-black/25 px-3 py-2.5 text-[12px] leading-7 text-slate-300">
                <b className={KIND_META[k].tone}>
                  {KIND_META[k].emoji} {KIND_META[k].label}
                </b>{" "}
                <span className="text-slate-500">({FAMILY_META[KIND_META[k].family].label})</span>
                <br />
                {KIND_META[k].how}
              </p>
            ))}
          </div>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            ※ 사례를 <b className="text-white">몇 개만</b> 확인하고 일반화하는 것은 증명이 아니에요. 귀납적 증명은 해당하는 경우를 <b className="text-white">하나도 빠짐없이</b> 확인할 수
            있을 때만 쓸 수 있습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function MethodOne({ t, last, onDone, onNext }: { t: MethodTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [fam, setFam] = useState<Family | null>(null);
  const [kind, setKind] = useState<ProofKind | null>(null);

  const wantFam = KIND_META[t.kind].family;
  const step1 = fam !== null && fam === wantFam;
  const step2 = step1 && kind !== null && kind === t.kind;

  const doneRef = useRef(false);
  useEffect(() => {
    if (step2 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const subKinds = KIND_ORDER.filter((k) => KIND_META[k].family === wantFam);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.08] to-sky-500/[0.03] px-4 py-3">
        <p className="text-center text-[11px] font-bold tracking-widest text-cyan-200/80">증명할 명제</p>
        <p className="mt-1 text-center text-lg font-bold leading-8 text-slate-100">
          <PieceLine ps={t.claim} />
        </p>
        <p className="mt-2 rounded-xl bg-black/30 px-3 py-2.5 text-center text-[13px] leading-7 text-slate-200">
          <span className="mr-1.5 text-[11px] font-bold text-slate-500">증명의 첫 대목 ·</span>
          <PieceLine ps={t.sketch} />
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <div className={"rounded-2xl border-2 p-3 transition " + (step1 ? "border-emerald-400/45 bg-emerald-400/[0.08]" : "border-white/10 bg-slate-900/40")}>
            <p className="text-[12px] font-bold text-slate-200">1단계 · 직접증명법일까요, 간접증명법일까요?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["direct", "indirect"] as Family[]).map((f) => {
                const on = fam === f;
                const good = step1 && f === wantFam;
                const bad = on && f !== wantFam;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFam(f)}
                    disabled={step1}
                    className={
                      "rounded-xl border-2 px-2 py-3 text-center text-[13px] font-bold transition disabled:cursor-default " +
                      (good
                        ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                        : bad
                          ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    <span className="block text-lg">{FAMILY_META[f].emoji}</span>
                    {FAMILY_META[f].label}
                  </button>
                );
              })}
            </div>
            {fam !== null && !step1 ? (
              <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
                ❌ 증명의 첫 대목을 다시 보세요. <b className="text-white">대우</b>나 <b className="text-white">「…라고 가정하자」</b>가 보이면 돌려서 밝히는 간접증명법이에요.
              </p>
            ) : null}
          </div>

          <div className={"rounded-2xl border-2 p-3 transition " + (step1 ? "border-white/10 bg-slate-900/40" : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
            <p className="text-[12px] font-bold text-slate-200">2단계 · 더 자세히는 어떤 증명법일까요?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {subKinds.map((k) => {
                const on = kind === k;
                const good = step2 && k === t.kind;
                const bad = on && k !== t.kind;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    disabled={step2}
                    className={
                      "rounded-xl border-2 px-2 py-3 text-center text-[13px] font-bold transition disabled:cursor-default " +
                      (good
                        ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                        : bad
                          ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    <span className="block text-lg">{KIND_META[k].emoji}</span>
                    {KIND_META[k].label}
                  </button>
                );
              })}
            </div>
            {kind !== null && !step2 && step1 ? (
              <p className="mt-2 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {KIND_META[kind].how} — 이 증명이 그렇게 하고 있나요?</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-2">
            <MethodTree active={step2 ? t.kind : null} />
          </div>
          {step2 ? (
            <div className={"rounded-2xl border-2 p-3 " + KIND_META[t.kind].ring + " " + KIND_META[t.kind].soft}>
              <p className={"text-center text-[13px] font-extrabold " + KIND_META[t.kind].tone}>
                {KIND_META[t.kind].emoji} {KIND_META[t.kind].label}
              </p>
              <p className="mt-1 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">{KIND_META[t.kind].how}</p>
              <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">✅ {t.why}</p>
            </div>
          ) : null}
        </div>
      </div>

      {step2 && !last ? <NextBtn onClick={onNext} /> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 증명 재료 고르기
// ══════════════════════════════════════════════════════════════
function MaterialTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = PROOFS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧰 이 증명에 쓸 재료와 쓰면 안 되는 것을 갈라 보세요</p>
          <Chips ids={PROOFS.map((p) => p.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
          증명은 <b className="text-sky-200">가정</b> 에서 출발해 <b className="text-amber-200">결론</b> 에 닿는 길을 놓는 일이에요. 길을 놓는 데 쓸 수 있는 것은{" "}
          <b className="text-white">정의 · 공리 · 기본 성질 · 이미 증명된 정리</b> 랍니다.
        </p>
      </div>

      <MaterialOne
        key={t.id}
        t={t}
        last={i === PROOFS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(PROOFS.length - 1, k + 1))}
      />

      {done.length === PROOFS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 증명의 재료를 모두 갈랐어요!</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <div className="rounded-xl bg-black/25 px-3 py-2.5">
              <p className="text-[12px] font-bold text-emerald-200">🧰 쓸 수 있는 것</p>
              <div className="mt-1 space-y-0.5">
                {(Object.keys(MAT_META) as (keyof typeof MAT_META)[])
                  .filter((k) => MAT_META[k].ok)
                  .map((k) => (
                    <p key={k} className="text-[12px] leading-6 text-slate-300">
                      {MAT_META[k].emoji} {MAT_META[k].label}
                    </p>
                  ))}
              </div>
            </div>
            <div className="rounded-xl bg-black/25 px-3 py-2.5">
              <p className="text-[12px] font-bold text-rose-200">🚫 쓰면 안 되는 것</p>
              <div className="mt-1 space-y-0.5">
                {(Object.keys(MAT_META) as (keyof typeof MAT_META)[])
                  .filter((k) => !MAT_META[k].ok)
                  .map((k) => (
                    <p key={k} className="text-[12px] leading-6 text-slate-300">
                      {MAT_META[k].emoji} {MAT_META[k].label}
                    </p>
                  ))}
              </div>
            </div>
          </div>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-7 text-slate-300">
            ※ 무엇보다 <b className="text-rose-200">증명하려는 결론</b> 을 중간 과정에서 쓰지 않는 것이 중요해요. 닿아야 할 곳을 이미 있다고 치면 제자리를 맴돌 뿐이니까요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function MaterialOne({ t, last, onDone, onNext }: { t: ProofTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [judged, setJudged] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const deck = t.order.map((k) => t.mats[k]);
  const cleared = deck.every((m) => judged[m.id]);

  const doneRef = useRef(false);
  useEffect(() => {
    if (cleared && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function pick(id: string, useIt: boolean) {
    const m = t.mats.find((x) => x.id === id);
    if (!m || judged[id]) return;
    const meta = MAT_META[m.kind];
    if (meta.ok === useIt) {
      setJudged((s) => ({ ...s, [id]: true }));
      setMsg({ ok: true, text: `${meta.emoji} ${meta.label} — ${meta.why}` });
    } else {
      setMsg({ ok: false, text: `${meta.emoji} ${meta.label} 이에요. ${meta.why}` });
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.08] to-sky-500/[0.03] px-4 py-3 text-center">
        <p className="text-[11px] font-bold tracking-widest text-cyan-200/80">증명할 명제</p>
        <p className="mt-1 text-lg font-bold leading-8 text-slate-100">
          <PieceLine ps={t.claim} />
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-xl border-2 border-sky-400/45 bg-sky-400/[0.10] px-3 py-2">
            <p className="text-[11px] font-bold text-sky-200">가정</p>
            <p className="mt-0.5 text-[13px] font-bold leading-7 text-slate-100">
              <PieceLine ps={t.hypo} />
            </p>
          </div>
          <div className="flex items-center justify-center text-xl text-emerald-300">➡️</div>
          <div className="rounded-xl border-2 border-amber-400/45 bg-amber-400/[0.10] px-3 py-2">
            <p className="text-[11px] font-bold text-amber-200">결론</p>
            <p className="mt-0.5 text-[13px] font-bold leading-7 text-slate-100">
              <PieceLine ps={t.concl} />
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-[12px] font-bold text-slate-200">
          재료 카드 <span className="font-mono text-slate-400">({Object.keys(judged).length} / {t.mats.length})</span>
        </p>
        <div className="mt-2 space-y-1.5">
          {deck.map((m) => {
            const ok = judged[m.id];
            const meta = MAT_META[m.kind];
            return (
              <div
                key={m.id}
                className={
                  "flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 px-3 py-2.5 transition " +
                  (ok ? (meta.ok ? "border-emerald-400/50 bg-emerald-400/10" : "border-rose-400/40 bg-rose-400/[0.08]") : "border-white/12 bg-white/[0.04]")
                }
              >
                <span className="flex-1 text-[13px] font-semibold leading-7 text-slate-100">
                  <PieceLine ps={m.text} />
                </span>
                {ok ? (
                  <span className={"shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold " + (meta.ok ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/20 text-rose-100")}>
                    {meta.emoji} {meta.label}
                  </span>
                ) : (
                  <span className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => pick(m.id, true)}
                      className="rounded-lg border-2 border-emerald-400/50 bg-emerald-400/12 px-2.5 py-1.5 text-[11px] font-bold text-emerald-100 transition hover:bg-emerald-400/22"
                    >
                      🧰 쓴다
                    </button>
                    <button
                      type="button"
                      onClick={() => pick(m.id, false)}
                      className="rounded-lg border-2 border-rose-400/50 bg-rose-400/12 px-2.5 py-1.5 text-[11px] font-bold text-rose-100 transition hover:bg-rose-400/22"
                    >
                      🚫 안 쓴다
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {msg ? (
          <p className={"mt-2 rounded-xl px-3 py-2.5 text-[12px] leading-6 " + (msg.ok ? "bg-emerald-400/12 text-emerald-100" : "bg-rose-400/12 text-rose-100")}>
            {msg.ok ? "✅" : "❌"} {msg.text}
          </p>
        ) : null}
      </div>

      {cleared ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <p className="text-center text-[12px] font-bold text-emerald-100">🧰 이 증명에 쓸 재료</p>
          <div className="space-y-1">
            {t.mats
              .filter((m) => MAT_META[m.kind].ok)
              .map((m) => (
                <p key={m.id} className="rounded-lg bg-black/25 px-3 py-2 text-[13px] leading-7 text-slate-100">
                  <span className="mr-1.5 text-[11px] font-bold text-emerald-200">{MAT_META[m.kind].emoji}</span>
                  <PieceLine ps={m.text} />
                </p>
              ))}
          </div>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">📎 {t.note}</p>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 증명 조각 맞추기
// ══════════════════════════════════════════════════════════════
function StepTab() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = STEPS[i];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧱 조각을 차례대로 눌러 증명을 세우세요</p>
          <Chips ids={STEPS.map((s) => s.id)} cur={i} done={done} onPick={setI} />
        </div>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">쓰면 안 되는 가짜 조각이 섞여 있어요. 누르면 왜 안 되는지 알려 줍니다.</p>
      </div>

      <StepOne
        key={t.id}
        t={t}
        last={i === STEPS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setI((k) => Math.min(STEPS.length - 1, k + 1))}
      />

      {done.length === STEPS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 증명을 모두 세웠어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            증명은 <b className="text-sky-200">가정을 식으로 옮기고</b> → <b className="text-white">이미 아는 것으로 계산하고</b> → <b className="text-amber-200">결론의 뜻에 맞춰
            읽는</b> 세 걸음이에요. 간접증명법은 여기에 <b className="text-violet-200">「대신 무엇을 증명할지 밝히기」</b> 나 <b className="text-rose-200">「가정하고 모순 찾기」</b> 가
            앞뒤로 붙습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function StepOne({ t, last, onDone, onNext }: { t: StepTask; last: boolean; onDone: () => void; onNext: () => void }) {
  const [built, setBuilt] = useState<number[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tip, setTip] = useState(false);

  const all = allPieces(t);
  const deck = t.scatter.map((k) => all[k]);
  const cleared = built.length === t.steps.length;

  const doneRef = useRef(false);
  useEffect(() => {
    if (cleared && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  function tap(idx: number) {
    if (cleared || built.includes(idx)) return;
    const item = all[idx];
    if (item.decoyWhy) {
      setMsg({ ok: false, text: `이 조각은 증명에 쓸 수 없어요. ${item.decoyWhy}` });
      return;
    }
    if (idx !== built.length) {
      setMsg({ ok: false, text: `아직 이 조각의 차례가 아니에요. ${built.length + 1}번째로 올 조각을 찾아보세요.` });
      return;
    }
    setBuilt((s) => [...s, idx]);
    setMsg(null);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-500/[0.08] to-sky-500/[0.03] px-4 py-3 text-center">
        <p className="text-2xl">{t.emoji}</p>
        <p className="mt-0.5 text-[11px] font-bold tracking-widest text-cyan-200/80">증명할 명제</p>
        <p className="mt-1 text-lg font-bold leading-8 text-slate-100">
          <PieceLine ps={t.claim} />
        </p>
        <span className={"mt-2 inline-block rounded-lg border-2 px-2.5 py-1 text-[11px] font-bold " + KIND_META[t.kind].ring + " " + KIND_META[t.kind].soft + " " + KIND_META[t.kind].tone}>
          {KIND_META[t.kind].emoji} {KIND_META[t.kind].label}
        </span>
      </div>

      {/* 세워진 증명 */}
      <div className={"rounded-2xl border-2 p-3 transition " + (cleared ? "border-emerald-400/55 bg-emerald-400/10" : "border-white/10 bg-slate-900/40")}>
        <p className="text-[12px] font-bold text-slate-200">
          📜 증명 <span className="font-mono text-slate-400">({built.length} / {t.steps.length})</span>
        </p>
        <div className="mt-2 space-y-1.5">
          {built.map((idx, k) => (
            <p key={idx} className="flex flex-wrap items-baseline gap-x-2 rounded-lg bg-black/25 px-3 py-2 text-[13px] leading-7 text-slate-100">
              <span className="shrink-0 font-mono text-[11px] font-bold text-emerald-300">{k + 1}</span>
              <PieceLine ps={all[idx].text} />
            </p>
          ))}
          {!cleared ? (
            <p className="rounded-lg border-2 border-dashed border-white/15 px-3 py-2.5 text-center text-[12px] font-bold text-slate-600">
              {built.length + 1}번째 조각을 아래에서 고르세요
            </p>
          ) : null}
        </div>
        {cleared ? <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-center text-[12px] font-bold text-emerald-100">✅ 증명 완성!</p> : null}
      </div>

      {/* 흩어진 조각 */}
      {!cleared ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="text-[12px] font-bold text-slate-200">🧩 흩어진 조각</p>
          <div className="mt-2 space-y-1.5">
            {deck.map((item) => {
              const used = built.includes(item.idx);
              if (used) return null;
              return (
                <button
                  key={item.idx}
                  type="button"
                  onClick={() => tap(item.idx)}
                  className="flex w-full items-baseline gap-2 rounded-xl border-2 border-white/12 bg-white/[0.04] px-3 py-2.5 text-left text-[13px] font-semibold leading-7 text-slate-100 transition hover:bg-white/10"
                >
                  <span className="shrink-0 text-[11px] text-slate-500">▪</span>
                  <PieceLine ps={item.text} />
                </button>
              );
            })}
          </div>
          <div className="mt-2">
            <TipBox text={t.tip} open={tip} onOpen={() => setTip(true)} />
          </div>
        </div>
      ) : null}

      {msg ? (
        <p className={"rounded-xl px-3 py-2.5 text-[12px] leading-6 " + (msg.ok ? "bg-emerald-400/12 text-emerald-100" : "bg-rose-400/12 text-rose-100")}>
          {msg.ok ? "✅" : "❌"} {msg.text}
        </p>
      ) : null}

      {built.length > 0 && !cleared ? (
        <button
          type="button"
          onClick={() => {
            setBuilt((s) => s.slice(0, -1));
            setMsg(null);
          }}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[12px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          ↶ 마지막 조각 빼기
        </button>
      ) : null}

      {cleared ? (
        <div className="space-y-2 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
          <p className="text-[12px] leading-6 text-slate-300">📎 {t.note}</p>
          <div className="space-y-1">
            {t.decoys.map((d, k) => (
              <p key={k} className="rounded-lg bg-rose-400/[0.08] px-3 py-2 text-[12px] leading-7 text-rose-100">
                🚫 <PieceLine ps={d.text} />
                <span className="ml-1 text-slate-400">— {d.why}</span>
              </p>
            ))}
          </div>
          {last ? null : <NextBtn onClick={onNext} />}
        </div>
      ) : null}
    </div>
  );
}
