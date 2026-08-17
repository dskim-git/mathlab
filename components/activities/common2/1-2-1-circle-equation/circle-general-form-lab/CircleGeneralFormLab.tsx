"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CHALLENGE_PROBLEM,
  CLASSIFY_CARDS,
  CONVERT_QUIZ,
  KIND_EMOJI,
  KIND_LABEL,
  MAIN_PROBLEM,
  dist2,
  genTex,
  linearTex,
  perpBisector,
  radPlain,
  stdTex,
  toGeneral,
  type ClassifyCard,
  type ConvertQ,
  type Kind,
  type Pt,
  type ThreePointProblem,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "not_circle",
    prompt:
      "x² + y² + Ax + By + C = 0 이 항상 원을 나타내는 것은 아니었어요. 원이 되지 못하는 경우를 두 가지 이상 들고, 그렇게 판단한 근거를 적어 보세요.",
    kind: "text",
    placeholder:
      "예: A²+B²−4C = 0 이면 점 하나뿐이고, 음수이면 식을 만족하는 점이 아예 없다. 또 x²과 y²의 계수가 다르거나 xy 항이 있으면 원이 아니다.",
  },
  {
    id: "convert",
    prompt:
      "표준형을 일반형으로, 일반형을 표준형으로 바꿀 때 각각 어떤 계산을 했나요? 두 방향의 계산을 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 표준형 → 일반형은 괄호를 전개해 정리하면 A = −2a, B = −2b, C = a²+b²−r² 이 된다. 일반형 → 표준형은 x, y에 대해 각각 완전제곱식을 만들어 (x+A/2)² + (y+B/2)² = (A²+B²−4C)/4 로 바꾼다.",
  },
  {
    id: "two_ways",
    prompt:
      "세 점을 지나는 원을 구하는 두 가지 방법(중심에서 같은 거리 / 일반형에 대입)을 모두 해 보았어요. 두 방법의 좋은 점과 아쉬운 점을 비교하고, 나라면 어떤 상황에서 어떤 방법을 고를지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 중심에서 같은 거리를 쓰면 중심이 어디인지 그림으로 바로 보여 이해하기 쉽지만 식이 복잡해진다. 일반형에 대입하면 계산이 규칙적이라 빠른데 중심이 한눈에 안 보인다. 원점을 지나면 C = 0 이라 일반형이 훨씬 편하다.",
  },
];

// ─── 좌표평면 공용 ────────────────────────────────────────────
const G = { MIN: -9, MAX: 9, U: 19, PAD: 28 };
const SPAN = (G.MAX - G.MIN) * G.U;
const VB = SPAN + G.PAD * 2;

function gx(v: number): number {
  return G.PAD + (v - G.MIN) * G.U;
}
function gy(v: number): number {
  return G.PAD + (G.MAX - v) * G.U;
}
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function range(lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let i = lo; i <= hi; i++) out.push(i);
  return out;
}
function nx(v: number): string {
  const r = Math.round(v * 100) / 100;
  return r < 0 ? `−${Math.abs(r)}` : String(r);
}

function GridLines() {
  return (
    <g>
      {range(G.MIN, G.MAX).map((v) => (
        <line key={`vx${v}`} x1={gx(v)} y1={gy(G.MAX)} x2={gx(v)} y2={gy(G.MIN)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      {range(G.MIN, G.MAX).map((v) => (
        <line key={`hy${v}`} x1={gx(G.MIN)} y1={gy(v)} x2={gx(G.MAX)} y2={gy(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      <line x1={gx(G.MIN)} y1={gy(0)} x2={gx(G.MAX)} y2={gy(0)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={gx(0)} y1={gy(G.MIN)} x2={gx(0)} y2={gy(G.MAX)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      {range(G.MIN, G.MAX)
        .filter((v) => v !== 0 && v % 3 === 0)
        .map((v) => (
          <text key={`tx${v}`} x={gx(v)} y={gy(0) + 12} textAnchor="middle" className="fill-slate-500 font-mono text-[8px]">
            {v}
          </text>
        ))}
      {range(G.MIN, G.MAX)
        .filter((v) => v !== 0 && v % 3 === 0)
        .map((v) => (
          <text key={`ty${v}`} x={gx(0) - 6} y={gy(v) + 3} textAnchor="end" className="fill-slate-500 font-mono text-[8px]">
            {v}
          </text>
        ))}
      <text x={gx(0) - 6} y={gy(0) + 12} textAnchor="end" className="fill-slate-500 font-mono text-[8px]">
        O
      </text>
      <text x={gx(G.MAX) - 2} y={gy(0) - 6} textAnchor="end" className="fill-slate-400 text-[10px] italic">
        x
      </text>
      <text x={gx(0) + 8} y={gy(G.MAX) + 8} className="fill-slate-400 text-[10px] italic">
        y
      </text>
    </g>
  );
}

function Plane({
  cid,
  svgRef,
  label,
  small,
  children,
}: {
  cid: string;
  svgRef?: React.Ref<SVGSVGElement>;
  label: string;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        className={"mx-auto block w-full touch-none select-none " + (small ? "max-w-[300px]" : "max-w-[420px]")}
        role="img"
        aria-label={label}
      >
        <defs>
          <clipPath id={cid}>
            <rect x={gx(G.MIN)} y={gy(G.MAX)} width={SPAN} height={SPAN} />
          </clipPath>
        </defs>
        <GridLines />
        {children}
      </svg>
    </div>
  );
}

function Clipped({ cid, children }: { cid: string; children: React.ReactNode }) {
  return <g clipPath={`url(#${cid})`}>{children}</g>;
}

function CircleDraw({ c, r, color, fill, dash, width = 3 }: { c: Pt; r: number; color: string; fill?: string; dash?: string; width?: number }) {
  return <circle cx={gx(c.x)} cy={gy(c.y)} r={r * G.U} fill={fill ?? "none"} stroke={color} strokeWidth={width} strokeDasharray={dash} />;
}

/** ax + by + c = 0 을 격자 끝까지. */
function LineDraw({ a, b, c, color, dash }: { a: number; b: number; c: number; color: string; dash?: string }) {
  if (a === 0 && b === 0) return null;
  let p: [number, number, number, number];
  if (b === 0) {
    const x = -c / a;
    p = [gx(x), gy(G.MAX + 3), gx(x), gy(G.MIN - 3)];
  } else {
    const yAt = (x: number) => (-a * x - c) / b;
    p = [gx(G.MIN - 3), gy(yAt(G.MIN - 3)), gx(G.MAX + 3), gy(yAt(G.MAX + 3))];
  }
  return <line x1={p[0]} y1={p[1]} x2={p[2]} y2={p[3]} stroke={color} strokeWidth={2} strokeDasharray={dash ?? "6 4"} />;
}

function Dot({ p, color, label, onDown, r = 6 }: { p: Pt; color: string; label?: string; onDown?: () => void; r?: number }) {
  return (
    <g
      className={onDown ? "cursor-grab touch-none" : undefined}
      onPointerDown={
        onDown
          ? (e) => {
              e.preventDefault();
              onDown();
            }
          : undefined
      }
    >
      {onDown ? <circle cx={gx(p.x)} cy={gy(p.y)} r={16} fill="transparent" /> : null}
      <circle cx={gx(p.x)} cy={gy(p.y)} r={r} fill={color} stroke="#0f172a" strokeWidth={2} />
      {label ? (
        <text
          x={gx(p.x)}
          y={p.y >= G.MAX - 0.5 ? gy(p.y) + 19 : gy(p.y) - 12}
          textAnchor={p.x <= G.MIN + 1.5 ? "start" : p.x >= G.MAX - 1.5 ? "end" : "middle"}
          className="fill-white font-mono text-[10px] font-bold"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

function useGridDrag(svgRef: React.RefObject<SVGSVGElement | null>, onDrag: (id: string, p: Pt) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const cb = useRef(onDrag);
  useEffect(() => {
    cb.current = onDrag;
  });
  useEffect(() => {
    if (!dragId) return;
    function move(e: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (VB / rect.width);
      const sy = (e.clientY - rect.top) * (VB / rect.height);
      cb.current(dragId as string, {
        x: clamp(Math.round((sx - G.PAD) / G.U + G.MIN), G.MIN, G.MAX),
        y: clamp(Math.round(G.MAX - (sy - G.PAD) / G.U), G.MIN, G.MAX),
      });
    }
    function up() {
      setDragId(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragId, svgRef]);
  return { setDragId };
}

function parseNum(s: string): number | null {
  const t = s.trim().replace(/[−–—]/g, "-").replace(/\s/g, "");
  if (!t || t === "-") return null;
  return /^-?\d+$/.test(t) ? Number(t) : null;
}
function isAns(s: string, target: number): boolean {
  const v = parseNum(s);
  return v !== null && v === target;
}

/** 수식 한 줄 — 각 식이 자기 줄을 차지한다. */
function FormulaLine({ tex, label, big }: { tex: string; label?: string; big?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      {label ? <span className="w-14 shrink-0 text-[10px] font-bold text-slate-400">{label}</span> : null}
      <span className={"min-w-0 flex-1 py-1 text-slate-100 " + (big ? "text-lg" : "")}>
        <Katex expr={tex} />
      </span>
    </div>
  );
}

function Box({
  value,
  onChange,
  ok,
  show,
  disabled,
  label,
  width = "w-20",
}: {
  value: string;
  onChange: (v: string) => void;
  ok: boolean;
  show: boolean;
  disabled: boolean;
  label: string;
  width?: string;
}) {
  const border = !show ? "border-white/15" : ok ? "border-emerald-400/60" : "border-rose-400/60";
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      aria-label={label}
      disabled={disabled}
      placeholder="?"
      onChange={(e) => onChange(e.target.value)}
      className={`${width} rounded-lg border-2 bg-slate-900 px-2 py-1 text-center font-mono text-sm text-white outline-none transition focus:border-cyan-300 disabled:opacity-70 ` + border}
    />
  );
}

function CheckBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/25"
    >
      확인
    </button>
  );
}

function StepBox({ n, title, done, children }: { n: string; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <div className={"rounded-xl border px-4 py-3 " + (done ? "border-emerald-400/35 bg-emerald-400/[0.06]" : "border-white/10 bg-slate-950/50")}>
      <p className="text-xs font-bold text-slate-400">
        <span
          className={
            "mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] " +
            (done ? "bg-emerald-400/25 text-emerald-100" : "bg-white/10 text-slate-300")
          }
        >
          {n}
        </span>
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "classify" | "convert" | "three";

export default function CircleGeneralFormLab() {
  const [tab, setTab] = useState<Tab>("classify");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔄 원의 방정식 — 표준형과 일반형</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-emerald-200">표준형</b>과 <b className="text-sky-200">일반형</b>을 가려내고 서로 바꿔 본 뒤,
          <b className="text-violet-200"> 세 점을 지나는 원</b>을 두 가지 방법으로 찾아봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "classify"} onClick={() => setTab("classify")}>
          ① 어떤 꼴일까? 분류 퀴즈
        </TabButton>
        <TabButton active={tab === "convert"} onClick={() => setTab("convert")}>
          ② 표준형 ⇄ 일반형
        </TabButton>
        <TabButton active={tab === "three"} onClick={() => setTab("three")}>
          ③ 세 점을 지나는 원 🎯
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "classify" ? <ClassifyTab /> : null}
        {tab === "convert" ? <ConvertTab /> : null}
        {tab === "three" ? <ThreePointTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

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

// ══════════════════════════════════════════════════════════════
// 탭 ① 분류 퀴즈
// ══════════════════════════════════════════════════════════════
const KIND_ORDER: Kind[] = ["std", "gen", "no"];

function ClassifyTab() {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [marks, setMarks] = useState<("o" | "x")[]>([]);

  if (idx >= CLASSIFY_CARDS.length) {
    return (
      <div className="rounded-2xl border-2 border-emerald-400/45 bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 p-5 text-center">
        <p className="text-3xl">{score === CLASSIFY_CARDS.length ? "🏆" : score >= 7 ? "🎉" : "💪"}</p>
        <p className="mt-2 text-xl font-extrabold text-emerald-200">
          {score} / {CLASSIFY_CARDS.length} 개 정답!
        </p>
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-left">
          <p className="text-xs font-bold text-slate-400">📌 원이 되지 못하는 네 가지 경우</p>
          <ul className="mt-1 space-y-1 text-sm leading-6 text-slate-300">
            <li>• A² + B² − 4C = 0 → 점 하나뿐</li>
            <li>• A² + B² − 4C &lt; 0 → 그런 점이 아예 없음</li>
            <li>• x², y² 의 계수가 서로 다름</li>
            <li>• xy 항이 들어 있음</li>
          </ul>
        </div>
        <button
          type="button"
          onClick={() => {
            setIdx(0);
            setScore(0);
            setMarks([]);
          }}
          className="mt-4 rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↻ 다시 풀기
        </button>
      </div>
    );
  }

  const card = CLASSIFY_CARDS[idx];
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            🗂️ 분류 퀴즈 · {idx + 1} / {CLASSIFY_CARDS.length}
          </p>
          <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 font-mono text-xs font-bold text-cyan-100">점수 {score}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {CLASSIFY_CARDS.map((c, i) => (
            <span
              key={c.id}
              className={"h-2 w-5 rounded-full " + (marks[i] === "o" ? "bg-emerald-400" : marks[i] === "x" ? "bg-rose-400/70" : i === idx ? "bg-cyan-400" : "bg-white/10")}
            />
          ))}
        </div>
      </div>
      <ClassifyCardView
        key={card.id}
        card={card}
        onAnswer={(correct) => {
          if (correct) setScore((s) => s + 1);
          setMarks((m) => {
            const next = [...m];
            next[idx] = correct ? "o" : "x";
            return next;
          });
        }}
        onNext={() => setIdx((i) => i + 1)}
        last={idx + 1 === CLASSIFY_CARDS.length}
      />
    </div>
  );
}

function ClassifyCardView({
  card,
  onAnswer,
  onNext,
  last,
}: {
  card: ClassifyCard;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  last: boolean;
}) {
  const [pick, setPick] = useState<Kind | null>(null);
  const answered = pick !== null;
  const correct = pick === card.kind;

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-white/15 bg-gradient-to-br from-slate-900 to-slate-950 px-5 py-6 text-center">
          <p className="text-[11px] font-bold text-slate-500">이 식은 어떤 꼴일까요?</p>
          <div className="mt-2 text-2xl text-white">
            <Katex expr={card.tex} />
          </div>
        </div>

        <div className="grid gap-1.5 sm:grid-cols-3">
          {KIND_ORDER.map((k) => {
            const state = !answered ? "idle" : k === card.kind ? "right" : k === pick ? "wrong" : "idle";
            return (
              <button
                key={k}
                type="button"
                disabled={answered}
                onClick={() => {
                  setPick(k);
                  onAnswer(k === card.kind);
                }}
                className={
                  "rounded-xl border-2 px-3 py-3 text-sm font-bold transition " +
                  (state === "right"
                    ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100"
                    : state === "wrong"
                      ? "border-rose-400/60 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 disabled:opacity-60")
                }
              >
                <span className="mr-1">{KIND_EMOJI[k]}</span>
                {KIND_LABEL[k]}
                {state === "right" ? " ✅" : state === "wrong" ? " ❌" : ""}
              </button>
            );
          })}
        </div>

        {answered ? (
          <div
            className={
              "rounded-xl border-2 px-4 py-3 " + (correct ? "border-emerald-400/50 bg-emerald-400/10" : "border-rose-400/50 bg-rose-400/10")
            }
          >
            <p className={"text-sm font-bold " + (correct ? "text-emerald-100" : "text-rose-100")}>
              {correct ? "✅ 정답!" : `❌ 정답은 「${KIND_LABEL[card.kind]}」`}
            </p>
            <p className="mt-1 text-xs leading-6 text-slate-300">{card.explain}</p>
            <button
              type="button"
              onClick={onNext}
              className="mt-2 rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-5 py-1.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
            >
              {last ? "결과 보기 🎉" : "다음 식 →"}
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <Plane cid={`cl-${card.id}`} label="식이 나타내는 도형" small>
          <Clipped cid={`cl-${card.id}`}>
            {answered && card.center && card.r2 !== undefined ? (
              <CircleDraw c={card.center} r={Math.sqrt(card.r2)} color="#34d399" fill="rgba(52,211,153,0.12)" width={3} />
            ) : null}
          </Clipped>
          {answered && card.center ? <Dot p={card.center} color="#f472b6" label={`(${nx(card.center.x)}, ${nx(card.center.y)})`} r={5} /> : null}
        </Plane>
        <p className="mt-1 text-center text-[11px] text-slate-500">
          {!answered ? "답을 고르면 도형이 나타나요" : card.kind === "no" ? "원이 아니라 그릴 원이 없어요" : `반지름 ${radPlain(card.r2 ?? 0)}`}
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 표준형 ⇄ 일반형
// ══════════════════════════════════════════════════════════════
function ConvertTab() {
  return (
    <div className="space-y-4">
      <ConvertSim />
      <ConvertQuizBlock />
    </div>
  );
}

function ConvertSim() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(-3);
  const [r, setR] = useState(4);
  const r2 = r * r;
  const { A, B, C } = toGeneral(a, b, r2);

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <div>
        <Plane cid="conv-sim" label="표준형과 일반형이 같은 원" small>
          <Clipped cid="conv-sim">
            <CircleDraw c={{ x: a, y: b }} r={r} color="#34d399" fill="rgba(52,211,153,0.12)" width={3} />
            <line x1={gx(a)} y1={gy(b)} x2={gx(a + r)} y2={gy(b)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3" />
          </Clipped>
          <Dot p={{ x: a, y: b }} color="#f472b6" label={`(${nx(a)}, ${nx(b)})`} r={5} />
        </Plane>
      </div>

      <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] p-4">
        <p className="text-sm font-bold text-cyan-200">🎚️ 같은 원, 두 가지 옷</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <Slider label="중심 a" value={a} min={-6} max={6} onChange={setA} />
          <Slider label="중심 b" value={b} min={-6} max={6} onChange={setB} />
          <Slider label="반지름 r" value={r} min={1} max={7} onChange={setR} />
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="rounded-xl border border-emerald-400/35 bg-emerald-400/[0.09] px-3 py-2">
            <p className="text-[10px] font-bold text-emerald-200">표준형</p>
            <FormulaLine tex={stdTex(a, b, r2)} big />
          </div>
          <p className="text-center text-xs font-bold text-slate-400">↕ 전개하면 / 완전제곱하면</p>
          <div className="rounded-xl border border-sky-400/35 bg-sky-400/[0.09] px-3 py-2">
            <p className="text-[10px] font-bold text-sky-200">일반형</p>
            <FormulaLine tex={genTex(A, B, C)} big />
          </div>
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
          <Rel tex={`A = -2a = ${A}`} />
          <Rel tex={`B = -2b = ${B}`} />
          <Rel tex={`C = a^2+b^2-r^2 = ${C}`} />
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400">{label}</span>
        <span className="font-mono text-xs font-bold text-slate-100">{nx(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-1.5 w-full accent-cyan-400"
      />
    </div>
  );
}

function Rel({ tex }: { tex: string }) {
  return (
    <div className="rounded-lg bg-black/30 px-2.5 py-1.5 text-center text-[13px] text-slate-100">
      <Katex expr={tex} />
    </div>
  );
}

function ConvertQuizBlock() {
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const q = CONVERT_QUIZ[idx];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-100">✏️ 바꾸기 연습</p>
        <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 font-mono text-xs font-bold text-cyan-100">
          해결 {solved.size} / {CONVERT_QUIZ.length}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {CONVERT_QUIZ.map((z, i) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setIdx(i)}
            className={
              "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
              (i === idx ? "border-cyan-400/60 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {solved.has(z.id) ? "✅ " : ""}
            {i + 1}. {z.dir === "toGen" ? "표준→일반" : "일반→표준"}
          </button>
        ))}
      </div>
      <ConvertCard key={q.id} q={q} onSolved={() => setSolved((s) => new Set(s).add(q.id))} />
    </div>
  );
}

function ConvertCard({ q, onSolved }: { q: ConvertQ; onSolved: () => void }) {
  const { A, B, C } = toGeneral(q.a, q.b, q.r2);
  const toGen = q.dir === "toGen";

  const [i1, setI1] = useState("");
  const [i2, setI2] = useState("");
  const [i3, setI3] = useState("");
  const [ck, setCk] = useState(false);
  const [hint, setHint] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const t1 = toGen ? A : q.a;
  const t2 = toGen ? B : q.b;
  const t3 = toGen ? C : q.r2;
  const ok1 = isAns(i1, t1);
  const ok2 = isAns(i2, t2);
  const ok3 = isAns(i3, t3);
  const cleared = ok1 && ok2 && ok3;
  const shown = cleared || gaveUp;

  const solvedRef = useRef(false);
  useEffect(() => {
    if (cleared && !solvedRef.current) {
      solvedRef.current = true;
      onSolved();
    }
  }, [cleared, onSolved]);

  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_300px]">
      <div className="space-y-2">
        <div className={"rounded-xl border px-4 py-3 " + (toGen ? "border-emerald-400/30 bg-emerald-400/[0.08]" : "border-sky-400/30 bg-sky-400/[0.08]")}>
          <p className={"text-xs font-bold " + (toGen ? "text-emerald-200" : "text-sky-200")}>
            {toGen ? "이 표준형을 일반형으로 바꿔 보세요." : "이 일반형을 표준형으로 바꿔 보세요."}
          </p>
          <FormulaLine tex={toGen ? stdTex(q.a, q.b, q.r2) : genTex(A, B, C)} big />
        </div>

        {toGen ? (
          <>
            <StepBox n="1" title="괄호를 전개해 정리하면" done={cleared}>
              <div className="space-y-0.5">
                <FormulaLine tex={`${stdTex(q.a, q.b, q.r2)}`} />
                <FormulaLine tex={`x^2 + y^2 + Ax + By + C = 0`} />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">A = −2a, B = −2b, C = a² + b² − r² 를 이용해도 좋아요.</p>
            </StepBox>
            <StepBox n="2" title="A, B, C 의 값" done={cleared}>
              <div className="flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
                <span>A =</span>
                <Box value={i1} onChange={setI1} ok={ok1} show={ck} disabled={shown} label="A 값" />
                <span>B =</span>
                <Box value={i2} onChange={setI2} ok={ok2} show={ck} disabled={shown} label="B 값" />
                <span>C =</span>
                <Box value={i3} onChange={setI3} ok={ok3} show={ck} disabled={shown} label="C 값" />
                {!cleared && !shown ? <CheckBtn onClick={() => setCk(true)} /> : cleared ? <span>✅</span> : null}
              </div>
            </StepBox>
          </>
        ) : (
          <>
            <StepBox n="1" title="완전제곱식으로 묶으면" done={cleared}>
              <div className="space-y-0.5">
                <FormulaLine tex={`${genTex(A, B, C)}`} />
                <FormulaLine tex={`\\left(x + \\tfrac{A}{2}\\right)^2 + \\left(y + \\tfrac{B}{2}\\right)^2 = \\tfrac{A^2 + B^2 - 4C}{4}`} />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">중심은 (−A/2, −B/2), r² 은 (A² + B² − 4C) ÷ 4 예요.</p>
            </StepBox>
            <StepBox n="2" title="중심과 반지름의 제곱" done={cleared}>
              <div className="flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
                <span>중심 (</span>
                <Box value={i1} onChange={setI1} ok={ok1} show={ck} disabled={shown} label="중심의 x좌표" width="w-16" />
                <span>,</span>
                <Box value={i2} onChange={setI2} ok={ok2} show={ck} disabled={shown} label="중심의 y좌표" width="w-16" />
                <span>)</span>
                <span className="ml-2">r² =</span>
                <Box value={i3} onChange={setI3} ok={ok3} show={ck} disabled={shown} label="반지름의 제곱" width="w-16" />
                {!cleared && !shown ? <CheckBtn onClick={() => setCk(true)} /> : cleared ? <span>✅</span> : null}
              </div>
            </StepBox>
          </>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setHint((v) => !v)}
            className="rounded-lg border border-amber-400/45 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-400/20"
          >
            💡 힌트
          </button>
          {!shown ? (
            <button
              type="button"
              onClick={() => setGaveUp(true)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              정답 보기
            </button>
          ) : null}
        </div>
        {hint ? <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-100">💡 {q.hint}</p> : null}

        {shown ? (
          <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/10 px-4 py-3">
            <p className="text-sm font-bold text-emerald-100">{cleared ? "🎉 정답!" : "📖 풀이"}</p>
            <div className="mt-1 space-y-0.5">
              <FormulaLine label="표준형" tex={stdTex(q.a, q.b, q.r2)} />
              <FormulaLine label="일반형" tex={genTex(A, B, C)} />
            </div>
            <p className="mt-1 text-xs text-emerald-100/90">
              중심 ({nx(q.a)}, {nx(q.b)}) · 반지름 {radPlain(q.r2)} — 같은 원을 두 가지 꼴로 쓴 것뿐이에요.
            </p>
          </div>
        ) : null}
      </div>

      <div>
        <Plane cid={`cv-${q.id}`} label="문제의 원" small>
          <Clipped cid={`cv-${q.id}`}>
            {shown ? <CircleDraw c={{ x: q.a, y: q.b }} r={Math.sqrt(q.r2)} color="#34d399" fill="rgba(52,211,153,0.12)" width={3} /> : null}
          </Clipped>
          {shown ? <Dot p={{ x: q.a, y: q.b }} color="#f472b6" label={`(${nx(q.a)}, ${nx(q.b)})`} r={5} /> : null}
        </Plane>
        <p className="mt-1 text-center text-[11px] text-slate-500">{shown ? "🎉 이 원이었어요!" : "맞히면 원이 그려져요"}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 세 점을 지나는 원
// ══════════════════════════════════════════════════════════════
function ThreePointTab() {
  const [probIdx, setProbIdx] = useState(0);
  const problems = [MAIN_PROBLEM, CHALLENGE_PROBLEM];
  const p = problems[probIdx];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {problems.map((z, i) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setProbIdx(i)}
            className={
              "rounded-xl border-2 px-3 py-2 text-xs font-bold transition " +
              (i === probIdx ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {z.title}
          </button>
        ))}
      </div>
      <ThreePointView key={p.id} p={p} />
    </div>
  );
}

function ThreePointView({ p }: { p: ThreePointProblem }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [guess, setGuess] = useState<Pt>({ x: 0, y: 4 });
  const [showBisector, setShowBisector] = useState(false);
  const [method, setMethod] = useState<"dist" | "gen">("dist");
  const { setDragId } = useGridDrag(svgRef, (_id, q) => setGuess(q));

  // 방법 ① 입력
  const [cx, setCx] = useState("");
  const [cy, setCy] = useState("");
  const [r2In, setR2In] = useState("");
  const [ckA, setCkA] = useState({ c: false, r: false });
  // 방법 ② 입력
  const [gs, setGs] = useState<string[]>(["", "", ""]);
  const [ckB, setCkB] = useState([false, false, false]);

  const d0 = dist2(guess, p.pts[0]);
  const d1 = dist2(guess, p.pts[1]);
  const d2 = dist2(guess, p.pts[2]);
  const found = d0 === d1 && d1 === d2;

  const bis1 = perpBisector(p.pts[0], p.pts[1]);
  const bis2 = perpBisector(p.pts[0], p.pts[2]);

  const okC = isAns(cx, p.center.x) && isAns(cy, p.center.y);
  const okR = isAns(r2In, p.r2);
  const doneA = okC && okR;

  const gOk = p.genSteps.map((s, i) => isAns(gs[i], s.answer));
  const doneB = gOk.every(Boolean);

  const anyDone = doneA || doneB;

  return (
    <div className="space-y-4">
      {/* 문제 */}
      <div className="rounded-xl border border-violet-400/25 bg-violet-400/[0.07] px-4 py-3">
        <p className="text-xs font-bold text-violet-200">다음 세 점을 지나는 원의 방정식을 구해 보세요.</p>
        <FormulaLine
          big
          tex={p.pts.map((z, i) => `${p.names[i]}(${z.x},\\ ${z.y})`).join(",\\quad ")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* 그래프 */}
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          <Plane cid={`tp-${p.id}`} svgRef={svgRef} label="세 점과 중심 후보">
            <Clipped cid={`tp-${p.id}`}>
              {showBisector ? (
                <>
                  <LineDraw a={bis1.a} b={bis1.b} c={bis1.c} color="#38bdf8" />
                  <LineDraw a={bis2.a} b={bis2.b} c={bis2.c} color="#fbbf24" />
                </>
              ) : null}
              {anyDone ? <CircleDraw c={p.center} r={Math.sqrt(p.r2)} color="#34d399" fill="rgba(52,211,153,0.12)" width={3} /> : null}
              {/* 중심 후보에서 세 점까지 */}
              {p.pts.map((z, i) => (
                <line
                  key={i}
                  x1={gx(guess.x)}
                  y1={gy(guess.y)}
                  x2={gx(z.x)}
                  y2={gy(z.y)}
                  stroke={found ? "#34d399" : "#94a3b8"}
                  strokeWidth={found ? 2.5 : 1.8}
                  strokeDasharray={found ? undefined : "4 3"}
                />
              ))}
            </Clipped>
            {p.pts.map((z, i) => (
              <Dot key={i} p={z} color="#22d3ee" label={`${p.names[i]}(${nx(z.x)}, ${nx(z.y)})`} r={5} />
            ))}
            <Dot p={guess} color={found ? "#34d399" : "#f472b6"} label={`C(${nx(guess.x)}, ${nx(guess.y)})`} onDown={() => setDragId("C")} />
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 분홍 점 C를 끌어 세 거리를 같게 만들어 보세요</p>

          {/* 거리 미션 */}
          <div className={"mt-2 rounded-xl border-2 px-3 py-2 " + (found ? "border-emerald-400/55 bg-emerald-400/12" : "border-white/10 bg-slate-950/50")}>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              {[d0, d1, d2].map((d, i) => (
                <div key={i} className="rounded-lg bg-black/25 px-2 py-1.5">
                  <p className="text-[10px] font-bold text-slate-400">
                    C{p.names[i]}
                    <sup>2</sup>
                  </p>
                  <p className={"font-mono text-lg font-bold " + (found ? "text-emerald-200" : "text-slate-100")}>{d}</p>
                </div>
              ))}
            </div>
            <p className={"mt-1 text-center text-xs font-bold " + (found ? "text-emerald-200" : "text-slate-400")}>
              {found ? "🎉 세 거리가 모두 같아요! 여기가 중심이에요." : "세 값이 모두 같아지는 자리를 찾아보세요"}
            </p>
            <button
              type="button"
              onClick={() => setShowBisector((v) => !v)}
              className={
                "mt-1.5 w-full rounded-lg border px-3 py-1.5 text-xs font-bold transition " +
                (showBisector ? "border-sky-400/60 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              💡 힌트 — 수직이등분선 {showBisector ? "숨기기" : "보기"}
            </button>
            {showBisector ? (
              <p className="mt-1 text-[11px] leading-5 text-slate-400">
                두 점에서 같은 거리에 있는 점들은 그 두 점을 잇는 선분의 <b className="text-sky-200">수직이등분선</b> 위에 있어요. 두 선의 교점이 바로 중심!
              </p>
            ) : null}
          </div>
        </div>

        {/* 방법 */}
        <div className="space-y-3">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMethod("dist")}
              className={
                "flex-1 rounded-xl border-2 px-3 py-2 text-xs font-bold transition " +
                (method === "dist" ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              방법 ① 중심에서 같은 거리
            </button>
            <button
              type="button"
              onClick={() => setMethod("gen")}
              className={
                "flex-1 rounded-xl border-2 px-3 py-2 text-xs font-bold transition " +
                (method === "gen" ? "border-sky-400/60 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              방법 ② 일반형에 대입
            </button>
          </div>

          {method === "dist" ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3">
                <p className="text-xs font-bold text-emerald-200">중심을 C(a, b) 라 하면</p>
                <FormulaLine
                  tex={`\\overline{C${p.names[0]}} = \\overline{C${p.names[1]}} = \\overline{C${p.names[2]}}`}
                />
                <div className="mt-1 space-y-0.5">
                  <FormulaLine label="조건 1" tex={linearTex(bis1.a, bis1.b, bis1.c, "a", "b")} />
                  <FormulaLine label="조건 2" tex={linearTex(bis2.a, bis2.b, bis2.c, "a", "b")} />
                </div>
              </div>

              <StepBox n="1" title="두 조건을 풀어 중심 구하기" done={okC}>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-base text-slate-100">
                  <span>(</span>
                  <Box value={cx} onChange={setCx} ok={isAns(cx, p.center.x)} show={ckA.c} disabled={doneA} label="중심의 x좌표" width="w-16" />
                  <span>,</span>
                  <Box value={cy} onChange={setCy} ok={isAns(cy, p.center.y)} show={ckA.c} disabled={doneA} label="중심의 y좌표" width="w-16" />
                  <span>)</span>
                  {!okC ? <CheckBtn onClick={() => setCkA((v) => ({ ...v, c: true }))} /> : <span>✅</span>}
                </div>
              </StepBox>

              {okC ? (
                <StepBox n="2" title={`반지름의 제곱 (중심에서 점 ${p.names[0]} 까지)`} done={okR}>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
                    <span>r² =</span>
                    <Box value={r2In} onChange={setR2In} ok={okR} show={ckA.r} disabled={doneA} label="반지름의 제곱" />
                    {!okR ? <CheckBtn onClick={() => setCkA((v) => ({ ...v, r: true }))} /> : <span>✅</span>}
                  </div>
                </StepBox>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.06] px-4 py-3">
                <p className="text-xs font-bold text-sky-200">구하는 원의 방정식을 일반형으로 놓으면</p>
                <FormulaLine tex="x^2 + y^2 + Ax + By + C = 0" />
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  {p.throughOrigin
                    ? "원점을 지나므로 x = 0, y = 0 을 넣으면 C 가 바로 정해져요."
                    : "세 점을 각각 대입해 만든 세 식을 서로 빼면 A, B 가 먼저 구해져요."}
                </p>
              </div>
              {p.genSteps.map((s, i) => {
                const unlocked = i === 0 || gOk[i - 1];
                if (!unlocked) return null;
                return (
                  <StepBox key={s.sym} n={String(i + 1)} title={s.label} done={gOk[i]}>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-base text-slate-100">
                      <span className="py-1">
                        <Katex expr={s.tex} />
                      </span>
                      <Box
                        value={gs[i]}
                        onChange={(v) => setGs((z) => z.map((w, j) => (j === i ? v : w)))}
                        ok={gOk[i]}
                        show={ckB[i]}
                        disabled={doneB}
                        label={`${s.sym} 값`}
                      />
                      {!gOk[i] ? <CheckBtn onClick={() => setCkB((z) => z.map((w, j) => (j === i ? true : w)))} /> : <span>✅</span>}
                    </div>
                  </StepBox>
                );
              })}
            </div>
          )}

          {anyDone ? (
            <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/10 p-4">
              <p className="text-sm font-bold text-emerald-100">🎉 두 방법의 답이 같아요!</p>
              <div className="mt-1.5 space-y-0.5">
                <FormulaLine label="표준형" tex={stdTex(p.center.x, p.center.y, p.r2)} />
                <FormulaLine label="일반형" tex={genTex(p.A, p.B, p.C)} />
              </div>
              <p className="mt-1 text-xs leading-5 text-emerald-100/90">
                중심 ({nx(p.center.x)}, {nx(p.center.y)}) · 반지름 {radPlain(p.r2)} — 방법 ①은 <b>중심이 어디인지</b>가 그림으로 보이고, 방법 ②는{" "}
                <b>계산이 규칙적</b>이에요. 아직 안 해 본 방법으로도 풀어 확인해 보세요!
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
