"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  ART_GOALS,
  ART_MAX,
  A_VALS,
  BUILDS,
  COLORS,
  KINDS,
  PLANE,
  PQ,
  PRESETS,
  TRY_GOALS,
  TRY_INIT,
  TRY_QUIZ,
  VIEW,
  XR,
  artPolys,
  artTexFull,
  mirrorArt,
  sx,
  sy,
  type Art,
  type Build,
  type Kind,
  type Piece,
  type Pt,
  type Quiz,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "domain_piece",
    prompt:
      "함수의 그래프로 그림을 그릴 때 정의역을 제한하는 일이 왜 꼭 필요한지, 활동에서 만든 그림을 예로 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 정의역을 제한하지 않으면 곡선이 화면 끝까지 뻗어 나가 그림이 되지 않는다. 토끼 귀를 만들 때 y = −√(−6(x−3))+8 을 0.5 ≤ x ≤ 3 으로 좁혀야 귀 한 획이 되고, 그보다 넓히면 얼굴을 뚫고 나간다. 곡선의 한 도막만 남기니 그것이 그림의 한 획이 되었다.",
  },
  {
    id: "mirror_rule",
    prompt:
      "어떤 조각의 y축 대칭 짝을 만들려면 식을 어떻게 바꾸어야 하는지 정리하고, 종류마다 무엇이 바뀌고 무엇이 그대로인지 써 보세요.",
    kind: "text",
    placeholder:
      "예: x 자리에 −x 를 넣으면 된다. 그러면 기준점의 x 좌표가 p 에서 −p 로 바뀌고 정의역도 [x₁, x₂] 에서 [−x₂, −x₁] 로 뒤집힌다. 무리함수·유리함수·직선은 계수 a 의 부호도 함께 바뀌지만, 포물선·원·점은 a 가 그대로다. 토끼의 왼쪽 귀를 이렇게 한 번에 만들었다.",
  },
  {
    id: "my_art",
    prompt:
      "자유 아틀리에에서 직접 그린 그림을 소개하고, 어떤 함수를 왜 그 자리에 썼는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 산과 해를 그렸다. 산은 위로 볼록한 포물선 y = −0.5(x+4)²+5 로 그렸는데 꼭짓점이 산꼭대기가 되기 때문이다. 해는 원으로, 땅은 기울기가 0 인 직선으로 그렸다. 길은 무리함수 두 개를 좌우로 벌려 놓아 멀어질수록 좁아 보이게 했다. 곡선의 모양을 먼저 떠올리고 그에 맞는 함수를 고르는 것이 재미있었다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "try" | "rabbit" | "leaf" | "free";

const ABC = ["①", "②", "③", "④"];

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition " +
        (active ? "border-pink-400/60 bg-pink-400/15 text-pink-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
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
              ? "border-pink-400/70 bg-pink-400/20 text-pink-100"
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

function NextBtn({ onClick, label = "다음 ▶" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border-2 border-pink-400/55 bg-pink-400/15 px-3 py-2.5 text-sm font-bold text-pink-100 transition hover:bg-pink-400/25"
    >
      {label}
    </button>
  );
}

function PieceText({ items }: { items: Piece[] }) {
  return (
    <>
      {items.map((p, i) => (
        <span key={i} className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1">
          {p.pre ? <span>{p.pre}</span> : null}
          {p.tex ? (
            <span className="min-w-0 py-0.5">
              <Katex expr={p.tex} />
            </span>
          ) : null}
          {p.post ? <span>{p.post}</span> : null}
        </span>
      ))}
    </>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">{children}</p>;
}

function Verdict({ right, why, hint }: { right: boolean; why: string; hint: string }) {
  return right ? (
    <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {why}</p>
  ) : (
    <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {hint}</p>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  accent = "accent-pink-400",
  show,
}: {
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  accent?: string;
  show?: string;
}) {
  return (
    <label className="block text-[11px] font-bold text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        {label} <span className="font-mono text-[13px] text-slate-100">{show ?? value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-0.5 w-full " + accent}
      />
    </label>
  );
}

function GoalList({ goals, seen }: { goals: string[]; seen: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className="text-[11px] font-bold text-slate-400">해 볼 것 세 가지</p>
      <div className="mt-1 space-y-1 text-[12px] leading-6">
        {goals.map((g, i) => (
          <p key={g} className={seen.includes(String(i)) ? "text-emerald-200" : "text-slate-400"}>
            {seen.includes(String(i)) ? "✓" : "○"} {g}
          </p>
        ))}
      </div>
    </div>
  );
}

function MixedChoices({
  items,
  pick,
  answer,
  onPick,
}: {
  items: Piece[][];
  pick: number | undefined;
  answer: number;
  onPick: (i: number) => void;
}) {
  const right = pick === answer;
  return (
    <div className="space-y-1.5">
      {items.map((row, i) => {
        const good = pick === i && i === answer;
        const bad = pick === i && i !== answer;
        return (
          <button
            key={row.map((p) => (p.pre ?? "") + (p.tex ?? "") + (p.post ?? "")).join("")}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "flex w-full min-w-0 items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-[13px] font-bold transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : bad
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="shrink-0 text-[11px] text-slate-400">{ABC[i]}</span>
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-1">
              <PieceText items={row} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TexChoices({
  items,
  pick,
  answer,
  onPick,
}: {
  items: string[];
  pick: number | undefined;
  answer: number;
  onPick: (i: number) => void;
}) {
  const right = pick === answer;
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {items.map((s, i) => {
        const good = pick === i && i === answer;
        const bad = pick === i && i !== answer;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "flex min-w-0 items-center gap-1.5 rounded-xl border-2 px-2.5 py-2.5 text-[15px] transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : bad
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="text-[11px] text-slate-400">{ABC[i]}</span>
            <span className="min-w-0 py-0.5">
              <Katex expr={s} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function QuizCard({ q, pick, onPick }: { q: Quiz; pick: number | undefined; onPick: (i: number) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] font-bold text-slate-100">{q.prompt}</p>
      <MixedChoices items={q.choices} pick={pick} answer={q.answer} onPick={onPick} />
      {pick !== undefined ? <Verdict right={pick === q.answer} why={q.why} hint={q.choiceWhy[pick]} /> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 도화지
// ══════════════════════════════════════════════════════════════
const TICKS = [-8, -6, -4, -2, 2, 4, 6, 8];
const GRID = Array.from({ length: 19 }, (_, i) => i - 9);

function pathOf(pts: Pt[]): string {
  return "M " + pts.map((p) => `${sx(VIEW, p.x).toFixed(2)} ${sy(VIEW, p.y).toFixed(2)}`).join(" L ");
}

function Canvas({ arts, sel = -1, aria }: { arts: Art[]; sel?: number; aria: string }) {
  return (
    <svg viewBox={`0 0 ${PLANE.w} ${PLANE.h}`} className="mx-auto block w-full max-w-[380px]" role="img" aria-label={aria}>
      <rect x={0} y={0} width={PLANE.w} height={PLANE.h} fill="#020617" rx={12} />
      {GRID.map((t) => (
        <g key={"g" + t}>
          <line x1={sx(VIEW, t)} y1={PLANE.pad} x2={sx(VIEW, t)} y2={PLANE.h - PLANE.pad} stroke="#1e293b" strokeWidth={t === 0 ? 0 : 1} />
          <line x1={PLANE.pad} y1={sy(VIEW, t)} x2={PLANE.w - PLANE.pad} y2={sy(VIEW, t)} stroke="#1e293b" strokeWidth={t === 0 ? 0 : 1} />
        </g>
      ))}
      <line x1={PLANE.pad} y1={sy(VIEW, 0)} x2={PLANE.w - PLANE.pad} y2={sy(VIEW, 0)} stroke="#475569" strokeWidth={1.5} />
      <line x1={sx(VIEW, 0)} y1={PLANE.pad} x2={sx(VIEW, 0)} y2={PLANE.h - PLANE.pad} stroke="#475569" strokeWidth={1.5} />
      {TICKS.map((t) => (
        <g key={"n" + t}>
          <text x={sx(VIEW, t)} y={sy(VIEW, 0) + 12} fontSize={9} textAnchor="middle" fill="#475569" fontFamily="ui-monospace, monospace">
            {t}
          </text>
          <text x={sx(VIEW, 0) - 5} y={sy(VIEW, t) + 3.2} fontSize={9} textAnchor="end" fill="#475569" fontFamily="ui-monospace, monospace">
            {t}
          </text>
        </g>
      ))}

      {arts.map((pc, i) => {
        const on = i === sel;
        if (pc.kind === "dot")
          return (
            <circle
              key={i}
              cx={sx(VIEW, pc.p)}
              cy={sy(VIEW, pc.q)}
              r={on ? 6 : 4.5}
              fill={pc.color}
              stroke={on ? "#fff" : "#020617"}
              strokeWidth={1.4}
            />
          );
        return (
          <g key={i}>
            {artPolys(pc, VIEW).map((sg, j) => (
              <path key={j} d={pathOf(sg)} fill="none" stroke={pc.color} strokeWidth={on ? 4 : 2.6} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function FunctionArtLab() {
  const [tab, setTab] = useState<Tab>("try");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-pink-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🎨 함수로 그림 그리기</h3>
        <p className="mt-2 leading-7 text-slate-300">
          함수식에 <b className="text-pink-200">정의역</b>을 좁혀 주면 곡선이 그림의 한 획이 됩니다. 토막을 이어 붙여 토끼도, 나뭇잎도 그려 보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "try"} onClick={() => setTab("try")}>
          ① 조각 익히기 🧩
        </TabButton>
        <TabButton active={tab === "rabbit"} onClick={() => setTab("rabbit")}>
          ② 토끼 만들기 🐰
        </TabButton>
        <TabButton active={tab === "leaf"} onClick={() => setTab("leaf")}>
          ③ 나뭇잎 만들기 🍃
        </TabButton>
        <TabButton active={tab === "free"} onClick={() => setTab("free")}>
          ④ 자유 아틀리에 🎨
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "try" ? <TryTab /> : null}
        {tab === "rabbit" ? <BuildTab build={BUILDS[0]} /> : null}
        {tab === "leaf" ? <BuildTab build={BUILDS[1]} /> : null}
        {tab === "free" ? <AtelierTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 조각 익히기
// ══════════════════════════════════════════════════════════════
const TRY_KINDS: Kind[] = ["sqrt", "rat", "line", "para"];

function TryTab() {
  const [pc, setPc] = useState<Art>(TRY_INIT);
  const [pair, setPair] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const [used, setUsed] = useState<string[]>([TRY_INIT.kind]);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const mark = (i: number) => setSeen((s) => (s.includes(String(i)) ? s : [...s, String(i)]));
  const set = (patch: Partial<Art>) => setPc((v) => ({ ...v, ...patch }));

  const arts: Art[] = pair ? [pc, { ...mirrorArt(pc), color: COLORS[5] }] : [pc];
  const kindInfo = KINDS.find((k) => k.id === pc.kind);

  const q = TRY_QUIZ[qi];
  const doneIds = TRY_QUIZ.filter((v) => pick[v.id] === v.answer).map((v) => v.id);
  const cleared = pick[q.id] === q.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🧩 곡선을 한 토막으로 자르기</p>
        <TipBox>
          📖 함수식에 <b className="text-pink-200">정의역</b>을 좁혀 주면 곡선의 한 도막만 남아요. 이 도막이 그림의 한 획이 됩니다.
        </TipBox>
        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <Canvas arts={arts} aria="조각 실험대" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <div className="grid grid-cols-2 gap-1.5">
              {TRY_KINDS.map((k) => {
                const info = KINDS.find((v) => v.id === k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      set({ kind: k });
                      setUsed((u) => (u.includes(k) ? u : [...u, k]));
                      if (used.length >= 3 && !used.includes(k)) mark(2);
                    }}
                    className={
                      "rounded-lg border-2 px-2 py-1.5 text-[12px] font-bold transition " +
                      (pc.kind === k ? "border-pink-400/70 bg-pink-400/20 text-pink-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                    }
                  >
                    {info?.name}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-[15px]">
              <span className="min-w-0">
                <Katex expr={artTexFull(pc)} />
              </span>
            </div>
            <Slider
              label={<Katex expr="a=" />}
              value={A_VALS.indexOf(pc.a)}
              min={0}
              max={A_VALS.length - 1}
              step={1}
              onChange={(i) => set({ a: A_VALS[i] })}
              accent="accent-sky-400"
              show={String(pc.a)}
            />
            <Slider label={<Katex expr="p=" />} value={pc.p} min={PQ.min} max={PQ.max} step={PQ.step} onChange={(v) => set({ p: v })} accent="accent-amber-400" />
            <Slider label={<Katex expr="q=" />} value={pc.q} min={PQ.min} max={PQ.max} step={PQ.step} onChange={(v) => set({ q: v })} accent="accent-amber-400" />
            {pc.kind === "sqrt" ? (
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => set({ s: 1 })}
                  className={
                    "rounded-lg border-2 px-2 py-1.5 text-[14px] transition " +
                    (pc.s === 1 ? "border-sky-400/70 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  <Katex expr="+\sqrt{\ }" />
                </button>
                <button
                  type="button"
                  onClick={() => set({ s: -1 })}
                  className={
                    "rounded-lg border-2 px-2 py-1.5 text-[14px] transition " +
                    (pc.s === -1 ? "border-pink-400/70 bg-pink-400/20 text-pink-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  <Katex expr="-\sqrt{\ }" />
                </button>
              </div>
            ) : null}
            <Slider
              label="정의역 왼쪽"
              value={pc.x1}
              min={XR.min}
              max={XR.max}
              step={XR.step}
              onChange={(v) => {
                set({ x1: Math.min(v, pc.x2 - XR.step) });
                mark(0);
              }}
              accent="accent-lime-400"
            />
            <Slider
              label="정의역 오른쪽"
              value={pc.x2}
              min={XR.min}
              max={XR.max}
              step={XR.step}
              onChange={(v) => {
                set({ x2: Math.max(v, pc.x1 + XR.step) });
                mark(0);
              }}
              accent="accent-lime-400"
            />
            <button
              type="button"
              onClick={() => {
                setPair((v) => !v);
                if (!pair) mark(1);
              }}
              className={
                "w-full rounded-xl border-2 px-3 py-2 text-[12px] font-bold transition " +
                (pair ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {pair ? "✓ " : ""}
              y축 대칭 짝 보기
            </button>
            {pair ? (
              <div className="flex justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-2 py-2 text-[14px] text-cyan-100">
                <span className="min-w-0">
                  <Katex expr={artTexFull(mirrorArt(pc))} />
                </span>
              </div>
            ) : null}
            <TipBox>
              💡 {kindInfo?.name} 은 <Katex expr={kindInfo?.tex ?? ""} /> 꼴이에요.
            </TipBox>
          </div>
        </div>
        <div className="mt-2">
          <GoalList goals={TRY_GOALS} seen={seen} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✏️ 확인 문제</p>
          <Chips ids={TRY_QUIZ.map((v) => v.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <QuizCard q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < TRY_QUIZ.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((v) => v + 1)} label="다음 문제 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === TRY_QUIZ.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 조각 다루는 법을 익혔어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            이제 <b className="text-white">계수로 모양을, 정의역으로 길이를</b> 정할 수 있어요. 다음 탭에서 이 조각들로 그림을 그려 봅시다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ②③ 그림 만들기
// ══════════════════════════════════════════════════════════════
function BuildTab({ build }: { build: Build }) {
  const [si, setSi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const solved = (i: number) => pick[build.steps[i].id] === build.steps[i].answer;
  const doneIds = build.steps.filter((_, i) => solved(i)).map((s) => s.id);
  const step = build.steps[si];
  const cleared = solved(si);
  const allDone = doneIds.length === build.steps.length;

  const arts: Art[] = build.steps.filter((_, i) => solved(i)).flatMap((s) => s.add);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">
            {build.icon} {build.title} 만들기
          </p>
          <Chips ids={build.steps.map((s) => s.id)} cur={si} done={doneIds} onPick={setSi} />
        </div>
        <TipBox>📖 {build.intro} 식을 맞게 고르면 그 획이 도화지에 얹힙니다.</TipBox>

        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <Canvas arts={arts} aria={`${build.title} 그리기`} />
            <p className="mt-1 text-center text-[11px] leading-6 text-slate-500">
              지금까지 얹은 획 {arts.length} 개 · {allDone ? "완성!" : `남은 단계 ${build.steps.length - doneIds.length}`}
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
              <p className="text-[12px] font-extrabold text-pink-200">
                {si + 1}. {step.label}
              </p>
              <p className="mt-1 text-[12px] leading-6 text-slate-300">{step.hint}</p>
            </div>
            {cleared ? (
              <div className="flex justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-2 py-2 text-[14px] text-emerald-100">
                <span className="min-w-0">
                  <Katex expr={artTexFull(step.add[0])} />
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-2 space-y-2">
          <p className="text-[13px] font-bold text-slate-100">어떤 식일까요?</p>
          <TexChoices items={step.choices} pick={pick[step.id]} answer={step.answer} onPick={(i) => setPick((m) => ({ ...m, [step.id]: i }))} />
          {pick[step.id] !== undefined ? <Verdict right={cleared} why={step.why} hint={step.choiceWhy[pick[step.id]]} /> : null}
        </div>

        {cleared && si < build.steps.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setSi((v) => v + 1)} label="다음 획 ▶" />
          </div>
        ) : null}
      </div>

      {allDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">
            🎉 {build.title} 완성!
          </p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">{build.done}</p>
          <div className="mt-2 space-y-1">
            {arts
              .filter((a) => a.kind !== "dot")
              .map((a, i) => (
                <p key={i} className="flex justify-center py-0.5 text-[13px] text-slate-300">
                  <span className="min-w-0">
                    <Katex expr={artTexFull(a)} />
                  </span>
                </p>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 자유 아틀리에
// ══════════════════════════════════════════════════════════════
const NEW_ART: Record<Kind, Art> = {
  sqrt: { kind: "sqrt", a: 2, p: 0, q: 0, s: 1, x1: 0, x2: 8, color: COLORS[0] },
  rat: { kind: "rat", a: 4, p: 0, q: 0, s: 1, x1: 1, x2: 8, color: COLORS[1] },
  line: { kind: "line", a: 1, p: 0, q: 0, s: 1, x1: -6, x2: 6, color: COLORS[2] },
  para: { kind: "para", a: 0.5, p: 0, q: 0, s: 1, x1: -5, x2: 5, color: COLORS[3] },
  circle: { kind: "circle", a: 3, p: 0, q: 0, s: 1, x1: -10, x2: 10, color: COLORS[4] },
  dot: { kind: "dot", a: 1, p: 0, q: 0, s: 1, x1: -10, x2: 10, color: COLORS[7] },
};

function AtelierTab() {
  const [arts, setArts] = useState<Art[]>(PRESETS[2].arts);
  const [sel, setSel] = useState(0);
  const [seen, setSeen] = useState<string[]>([]);

  const cur: Art | undefined = arts[sel];
  const mark = (i: number) => setSeen((s) => (s.includes(String(i)) ? s : [...s, String(i)]));
  const patch = (v: Partial<Art>) => setArts((list) => list.map((a, i) => (i === sel ? { ...a, ...v } : a)));

  const add = (k: Kind) => {
    if (arts.length >= ART_MAX) return;
    const next = [...arts, { ...NEW_ART[k], color: COLORS[arts.length % COLORS.length] }];
    setArts(next);
    setSel(next.length - 1);
    if (next.length >= 3) mark(0);
    const kinds = new Set(next.filter((a) => a.kind !== "dot" && a.kind !== "circle").map((a) => a.kind));
    if (kinds.size >= 4) mark(2);
  };

  const dup = () => {
    if (!cur || arts.length >= ART_MAX) return;
    const next = [...arts, { ...mirrorArt(cur) }];
    setArts(next);
    setSel(next.length - 1);
    mark(1);
  };

  const del = () => {
    if (!cur) return;
    const next = arts.filter((_, i) => i !== sel);
    setArts(next);
    setSel(Math.max(0, Math.min(sel, next.length - 1)));
  };

  const loadPreset = (i: number) => {
    setArts(PRESETS[i].arts);
    setSel(0);
  };

  const kindInfo = cur ? KINDS.find((k) => k.id === cur.kind) : undefined;
  const hasDomain = cur && cur.kind !== "circle" && cur.kind !== "dot";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🎨 마음대로 그려 보기</p>
        <TipBox>
          📖 조각을 얹고 슬라이더로 모양과 길이를 맞춰 보세요. <b className="text-cyan-200">y축 대칭 짝</b> 단추를 쓰면 좌우가 마주 보는 그림을 빠르게 그릴 수 있어요.
        </TipBox>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => loadPreset(i)}
              className="rounded-lg border-2 border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              {p.icon} {p.name} 불러오기
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setArts([]);
              setSel(0);
            }}
            className="rounded-lg border-2 border-rose-400/40 bg-rose-400/10 px-2.5 py-1.5 text-[12px] font-bold text-rose-100 transition hover:bg-rose-400/20"
          >
            ↺ 모두 지우기
          </button>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <Canvas arts={arts} sel={sel} aria="자유 아틀리에 도화지" />
            <p className="mt-1 text-center text-[11px] leading-6 text-slate-500">
              조각 {arts.length} / {ART_MAX} · 굵게 그려진 것이 지금 고른 조각이에요
            </p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <div>
              <p className="mb-1 text-[11px] font-bold text-slate-400">조각 더하기</p>
              <div className="grid grid-cols-3 gap-1.5">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => add(k.id)}
                    disabled={arts.length >= ART_MAX}
                    className="rounded-lg border-2 border-white/10 bg-white/5 px-1.5 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    + {k.name}
                  </button>
                ))}
              </div>
            </div>
            {arts.length ? (
              <div>
                <p className="mb-1 text-[11px] font-bold text-slate-400">조각 고르기</p>
                <div className="flex flex-wrap gap-1">
                  {arts.map((a, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSel(i)}
                      className={"h-7 w-7 rounded-md border-2 text-[10px] font-bold transition " + (i === sel ? "border-white" : "border-white/20")}
                      style={{ backgroundColor: a.color + (i === sel ? "" : "55"), color: "#020617" }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {cur ? (
              <>
                <div className="flex justify-center rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-[14px]" style={{ color: cur.color }}>
                  <span className="min-w-0">
                    <Katex expr={artTexFull(cur)} />
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400">{kindInfo?.name}</p>
                <Slider
                  label={<Katex expr={cur.kind === "circle" ? "r=" : "a="} />}
                  value={A_VALS.indexOf(cur.a) < 0 ? 0 : A_VALS.indexOf(cur.a)}
                  min={0}
                  max={A_VALS.length - 1}
                  step={1}
                  onChange={(i) => patch({ a: A_VALS[i] })}
                  accent="accent-sky-400"
                  show={String(cur.kind === "circle" ? Math.abs(cur.a) : cur.a)}
                />
                <Slider label={<Katex expr="p=" />} value={cur.p} min={PQ.min} max={PQ.max} step={PQ.step} onChange={(v) => patch({ p: v })} accent="accent-amber-400" />
                <Slider label={<Katex expr="q=" />} value={cur.q} min={PQ.min} max={PQ.max} step={PQ.step} onChange={(v) => patch({ q: v })} accent="accent-amber-400" />
                {cur.kind === "sqrt" ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => patch({ s: 1 })}
                      className={
                        "rounded-lg border-2 px-2 py-1.5 text-[14px] transition " +
                        (cur.s === 1 ? "border-sky-400/70 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                      }
                    >
                      <Katex expr="+\sqrt{\ }" />
                    </button>
                    <button
                      type="button"
                      onClick={() => patch({ s: -1 })}
                      className={
                        "rounded-lg border-2 px-2 py-1.5 text-[14px] transition " +
                        (cur.s === -1 ? "border-pink-400/70 bg-pink-400/20 text-pink-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                      }
                    >
                      <Katex expr="-\sqrt{\ }" />
                    </button>
                  </div>
                ) : null}
                {hasDomain ? (
                  <>
                    <Slider
                      label="정의역 왼쪽"
                      value={cur.x1}
                      min={XR.min}
                      max={XR.max}
                      step={XR.step}
                      onChange={(v) => patch({ x1: Math.min(v, cur.x2 - XR.step) })}
                      accent="accent-lime-400"
                    />
                    <Slider
                      label="정의역 오른쪽"
                      value={cur.x2}
                      min={XR.min}
                      max={XR.max}
                      step={XR.step}
                      onChange={(v) => patch({ x2: Math.max(v, cur.x1 + XR.step) })}
                      accent="accent-lime-400"
                    />
                  </>
                ) : null}
                <div className="flex flex-wrap gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => patch({ color: c })}
                      className={"h-6 w-6 rounded-md border-2 " + (cur.color === c ? "border-white" : "border-white/20")}
                      style={{ backgroundColor: c }}
                      aria-label="색 고르기"
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={dup}
                    disabled={arts.length >= ART_MAX}
                    className="rounded-lg border-2 border-cyan-400/50 bg-cyan-400/15 px-2 py-1.5 text-[11px] font-bold text-cyan-100 transition hover:bg-cyan-400/25 disabled:opacity-40"
                  >
                    ↔ y축 대칭 짝
                  </button>
                  <button
                    type="button"
                    onClick={del}
                    className="rounded-lg border-2 border-white/15 bg-white/5 px-2 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                  >
                    ✕ 이 조각 지우기
                  </button>
                </div>
              </>
            ) : (
              <TipBox>위에서 조각을 더하거나 그림을 불러와 보세요.</TipBox>
            )}
          </div>
        </div>

        <div className="mt-2">
          <GoalList goals={ART_GOALS} seen={seen} />
        </div>
      </div>

      {arts.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="text-sm font-bold text-slate-100">📜 내 그림의 식</p>
          <div className="mt-2 space-y-1">
            {arts.map((a, i) => (
              <p key={i} className="flex flex-wrap items-baseline gap-2 text-[13px] text-slate-300">
                <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: a.color }} />
                <span className="min-w-0">
                  <Katex expr={artTexFull(a)} />
                </span>
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {seen.length === ART_GOALS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 나만의 그림을 그렸어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            그리고 싶은 <b className="text-white">모양을 먼저 떠올린 뒤 그 모양을 내는 함수를 고르는 것</b>, 이것이 함수로 그림을 그리는 방법이에요.
          </p>
        </div>
      ) : null}
    </div>
  );
}
