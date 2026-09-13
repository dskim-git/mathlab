"use client";

import { useId, useMemo, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  DG,
  FAIL_CHOICES,
  FLIP_GOALS,
  FLIP_X,
  FLIP_Y3,
  FLIP_Y4,
  HAS_CHOICES,
  INV_TASKS,
  LAW_TASKS,
  LIFE_CASES,
  LINE_FNS,
  PAIRS,
  PROP_TASKS,
  PV,
  PV_TICKS,
  ROUND,
  SOLVE_TASKS,
  TWICE,
  UNDO_TASKS,
  dgGeom,
  dgRowY,
  flip,
  flipFail,
  inDeg,
  isBijection,
  isFunction,
  nx,
  outDeg,
  pvX,
  pvY,
  svgPath,
  traceFn,
  type Edge,
  type InvTask,
  type LawTask,
  type LifeCase,
  type LineFn,
  type PairTask,
  type Piece,
  type PropTask,
  type SolveTask,
  type UndoTask,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_bijection",
    prompt:
      "역함수가 있으려면 왜 일대일대응이어야 하나요? 화살표를 거꾸로 돌렸을 때 어떤 일이 생기는지를 들어 두 조건을 각각 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 거꾸로 돌린 것도 함수가 되어야 하는데, 함수의 두 조건이 그대로 f 에게 요구된다. 공역의 어떤 원소가 화살표를 못 받으면 거꾸로 돌렸을 때 짝이 없어 조건 ①을 어기므로 치역과 공역이 같아야 하고, 두 x 가 같은 y 로 가면 거꾸로 돌렸을 때 짝이 둘이 되어 조건 ②를 어기므로 일대일함수여야 한다. 그래서 둘을 합쳐 일대일대응이 필요하다.",
  },
  {
    id: "props_and_graph",
    prompt:
      "(f⁻¹∘f)(x) = x 와 (f∘f⁻¹)(y) = y 가 뜻하는 바를 자신의 말로 쓰고, 두 그래프가 직선 y = x 에 대하여 대칭인 까닭을 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: f 로 갔다가 f⁻¹ 으로 돌아오면 제자리로 온다는 뜻이고, 두 합성이 모두 항등함수가 된다. 또 y = f(x) ⟺ x = f⁻¹(y) 이므로 점 (a, b) 가 f 의 그래프 위에 있으면 (b, a) 가 f⁻¹ 의 그래프 위에 있다. 두 점은 y = x 에 대하여 대칭이므로 두 그래프도 대칭이다.",
  },
  {
    id: "order_law",
    prompt:
      "(g∘f)⁻¹ = f⁻¹∘g⁻¹ 에서 순서가 뒤집히는 까닭을 일상의 예를 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 양말을 신고 신발을 신었으면 벗을 때는 신발부터 벗어야 한다. 나중에 씌운 것을 먼저 벗겨야 하기 때문이다. 마찬가지로 f 를 먼저, g 를 나중에 씌웠으니 되돌릴 때는 g⁻¹ 을 먼저 쓰고 f⁻¹ 을 나중에 써야 한다. f(x)=2x, g(x)=x+3 으로 확인해 보니 (g∘f)⁻¹ 은 (x−3)/2 이고 f⁻¹∘g⁻¹ 도 (x−3)/2 로 같았지만 g⁻¹∘f⁻¹ 은 x/2−3 으로 달랐다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "exist" | "props" | "solve" | "laws" | "life";

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

/** 4지선다 — 보기가 수식일 때 */
function TexChoices({ items, pick, answer, onPick, cols = 2 }: { items: string[]; pick: number | undefined; answer: number; onPick: (i: number) => void; cols?: number }) {
  const right = pick === answer;
  return (
    <div className={"grid gap-1.5 " + (cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-4")}>
      {items.map((s, i) => {
        const good = pick === i && i === answer;
        const badPick = pick === i && i !== answer;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "overflow-x-auto overflow-y-hidden rounded-xl border-2 px-2.5 py-2 text-[14px] font-bold transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : badPick
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="mr-1 text-[12px] text-slate-400">{ABC[i]}</span>
            <Katex expr={s} />
          </button>
        );
      })}
    </div>
  );
}

/** 4지선다 — 보기가 한글 문장일 때 */
function TextChoices({ items, pick, answer, onPick }: { items: string[]; pick: number | undefined; answer: number; onPick: (i: number) => void }) {
  const right = pick === answer;
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {items.map((s, i) => {
        const good = pick === i && i === answer;
        const badPick = pick === i && i !== answer;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "rounded-xl border-2 px-2.5 py-2 text-left text-[13px] font-bold leading-6 transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : badPick
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="mr-1 text-slate-400">{ABC[i]}</span>
            {s}
          </button>
        );
      })}
    </div>
  );
}

function Verdict({ right, why, hint }: { right: boolean; why: string; hint: string }) {
  return right ? (
    <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {why}</p>
  ) : (
    <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {hint}</p>
  );
}

function arrowHead(x1: number, y1: number, x2: number, y2: number): string {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const L = 9.5;
  const W = 4.6;
  const bx = x2 - L * Math.cos(a);
  const by = y2 - L * Math.sin(a);
  return `${x2},${y2} ${bx + W * Math.sin(a)},${by - W * Math.cos(a)} ${bx - W * Math.sin(a)},${by + W * Math.cos(a)}`;
}

// ══════════════════════════════════════════════════════════════
// 화살표 대응도 — 거꾸로 돌린 그림도 같은 부품으로 그린다
// ══════════════════════════════════════════════════════════════
type DiaProps = {
  xs: string[];
  ys: string[];
  edges: Edge[];
  lx?: string;
  ly?: string;
  fname?: string;
  arrowColor?: string;
  /** 조건을 어긴 왼쪽 원소 */
  badX?: number[];
  /** 조건을 어긴 오른쪽 원소 */
  badY?: number[];
  selX?: number | null;
  onPickX?: (i: number) => void;
  onPickY?: (i: number) => void;
  fontPx?: number;
};

function ArrowDia({ xs, ys, edges, lx = "X", ly = "Y", fname = "f", arrowColor = "rgba(226,232,240,0.8)", badX, badY, selX = null, onPickX, onPickY, fontPx = 14 }: DiaProps) {
  const g = dgGeom(xs.length, ys.length);
  const x0 = DG.cxX + DG.inset;
  const x1 = DG.cxY - DG.inset;
  const clickable = Boolean(onPickX || onPickY);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${DG.w} ${g.h}`} className="mx-auto block w-full max-w-[320px] touch-none select-none" role="img" aria-label="두 집합 사이의 대응 그림">
        <ellipse cx={DG.cxX} cy={g.cy} rx={DG.rx} ry={g.ryX} fill="rgba(255,255,255,0.03)" stroke="rgba(226,232,240,0.55)" strokeWidth={2} />
        <ellipse cx={DG.cxY} cy={g.cy} rx={DG.rx} ry={g.ryY} fill="rgba(255,255,255,0.03)" stroke="rgba(226,232,240,0.55)" strokeWidth={2} />
        <text x={DG.cxX} y={g.cy - g.ryX - 9} textAnchor="middle" className="fill-slate-300 text-[13px] font-bold">
          {lx}
        </text>
        <text x={DG.cxY} y={g.cy - g.ryY - 9} textAnchor="middle" className="fill-slate-300 text-[13px] font-bold">
          {ly}
        </text>

        {fname ? (
          <g>
            <line x1={DG.cxX + 24} y1={20} x2={DG.cxY - 24} y2={20} stroke="rgba(226,232,240,0.45)" strokeWidth={1.6} />
            <polygon points={arrowHead(DG.cxX + 24, 20, DG.cxY - 24, 20)} fill="rgba(226,232,240,0.45)" />
            <text x={(DG.cxX + DG.cxY) / 2} y={13} textAnchor="middle" className="fill-slate-300 text-[12px] font-bold italic">
              {fname}
            </text>
          </g>
        ) : null}

        {edges.map(([a, b], k) => {
          const ya = dgRowY(a, xs.length, g.cy);
          const yb = dgRowY(b, ys.length, g.cy);
          return (
            <g key={`e${k}`}>
              <line x1={x0} y1={ya} x2={x1} y2={yb} stroke={arrowColor} strokeWidth={1.8} />
              <polygon points={arrowHead(x0, ya, x1, yb)} fill={arrowColor} />
            </g>
          );
        })}

        {xs.map((s, i) => {
          const y = dgRowY(i, xs.length, g.cy);
          const bad = badX?.includes(i);
          const sel = selX === i;
          return (
            <g key={`x${i}`} className={onPickX ? "cursor-pointer" : undefined} onPointerDown={onPickX ? (e) => { e.preventDefault(); onPickX(i); } : undefined}>
              <circle cx={DG.cxX} cy={y} r={15} fill={sel ? "rgba(34,211,238,0.3)" : bad ? "rgba(251,113,133,0.22)" : onPickX ? "rgba(255,255,255,0.07)" : "transparent"} stroke={sel ? "#22d3ee" : bad ? "#fb7185" : "transparent"} strokeWidth={2} />
              <text x={DG.cxX} y={y + fontPx * 0.36} textAnchor="middle" style={{ fontSize: fontPx }} className="fill-slate-100 font-semibold">
                {s}
              </text>
            </g>
          );
        })}
        {ys.map((s, i) => {
          const y = dgRowY(i, ys.length, g.cy);
          const bad = badY?.includes(i);
          return (
            <g key={`y${i}`} className={onPickY ? "cursor-pointer" : undefined} onPointerDown={onPickY ? (e) => { e.preventDefault(); onPickY(i); } : undefined}>
              <circle cx={DG.cxY} cy={y} r={15} fill={bad ? "rgba(251,113,133,0.22)" : clickable ? "rgba(255,255,255,0.07)" : "transparent"} stroke={bad ? "#fb7185" : "transparent"} strokeWidth={2} />
              <text x={DG.cxY} y={y + fontPx * 0.36} textAnchor="middle" style={{ fontSize: fontPx }} className="fill-slate-100 font-semibold">
                {s}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function toggleEdge(edges: Edge[], a: number, b: number): Edge[] {
  const hit = edges.some(([p, q]) => p === a && q === b);
  return hit ? edges.filter(([p, q]) => !(p === a && q === b)) : [...edges, [a, b] as Edge];
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function InverseFunctionLab() {
  const [tab, setTab] = useState<Tab>("exist");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔁 역함수</h3>
        <p className="mt-2 leading-7 text-slate-300">
          화살표를 <b className="text-pink-200">거꾸로 돌리는 일</b>입니다. 거꾸로 돌린 것이 다시 함수가 되려면 어떤 조건이 필요한지부터 찾아보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "exist"} onClick={() => setTab("exist")}>
          ① 역함수가 있으려면 🔁
        </TabButton>
        <TabButton active={tab === "props"} onClick={() => setTab("props")}>
          ② 역함수의 성질 ⚖️
        </TabButton>
        <TabButton active={tab === "solve"} onClick={() => setTab("solve")}>
          ③ 역함수 구하기 ✏️
        </TabButton>
        <TabButton active={tab === "laws"} onClick={() => setTab("laws")}>
          ④ 역함수의 연산법칙 🔗
        </TabButton>
        <TabButton active={tab === "life"} onClick={() => setTab("life")}>
          ⑤ 일상 속 역함수 🏠
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "exist" ? <ExistTab /> : null}
        {tab === "props" ? <PropsTab /> : null}
        {tab === "solve" ? <SolveTab /> : null}
        {tab === "laws" ? <LawsTab /> : null}
        {tab === "life" ? <LifeTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 역함수가 있으려면
// ══════════════════════════════════════════════════════════════
function InvCard({ q, pick, failPick, onPick, onFail }: { q: InvTask; pick: boolean | undefined; failPick: number | undefined; onPick: (v: boolean) => void; onFail: (k: number) => void }) {
  const right = pick === q.has;
  const needFail = right && !q.has;
  const failRight = failPick === q.fail;
  const cleared = right && (q.has || failRight);
  const badY = q.kind === "set" && cleared && !q.has ? inDeg(q.edges ?? [], (q.ys ?? []).length).map((d, i) => (d === 1 ? -1 : i)).filter((i) => i >= 0) : undefined;

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-2">
        {q.kind === "set" ? (
          <ArrowDia
            xs={q.xs ?? []}
            ys={q.ys ?? []}
            edges={q.edges ?? []}
            arrowColor={cleared ? (q.has ? "rgba(52,211,153,0.9)" : "rgba(251,113,133,0.9)") : "rgba(226,232,240,0.8)"}
            badY={badY}
          />
        ) : (
          <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
            <p className="overflow-x-auto overflow-y-hidden py-1 text-center text-[17px] font-bold leading-8 text-slate-100">
              <Katex expr={q.tex ?? ""} />
            </p>
            <p className="flex flex-wrap items-baseline gap-1.5 text-[12px] text-slate-300">
              <span className="w-12 shrink-0 font-bold text-amber-200">정의역</span>
              <PieceLine ps={q.domTex ?? []} />
            </p>
            <p className="flex flex-wrap items-baseline gap-1.5 text-[12px] text-slate-300">
              <span className="w-12 shrink-0 font-bold text-sky-200">공역</span>
              <PieceLine ps={q.codTex ?? []} />
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-slate-100">역함수가 있을까요?</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[true, false].map((v) => {
            const good = pick === v && v === q.has;
            const badPick = pick === v && v !== q.has;
            return (
              <button
                key={String(v)}
                type="button"
                onClick={() => onPick(v)}
                disabled={right}
                className={
                  "rounded-xl border-2 px-2 py-2.5 text-[13px] font-bold transition disabled:cursor-default " +
                  (good
                    ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                    : badPick
                      ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                {v ? HAS_CHOICES[0] : HAS_CHOICES[1]}
              </button>
            );
          })}
        </div>

        {pick !== undefined && !right ? (
          <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
            ❌ 화살표를 거꾸로 돌렸다고 생각해 보세요. <b>공역의 원소</b>가 저마다 짝을 하나씩 갖는지만 따지면 됩니다.
          </p>
        ) : null}

        {needFail ? (
          <div className="space-y-1.5">
            <p className="text-[12px] font-bold text-slate-300">거꾸로 돌렸을 때 무엇이 어긋나나요?</p>
            {FAIL_CHOICES.map((c, k) => {
              const good = failPick === k && k === q.fail;
              const badPick = failPick === k && k !== q.fail;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onFail(k)}
                  disabled={failRight}
                  className={
                    "w-full rounded-lg border-2 px-2.5 py-2 text-left text-[12px] font-bold transition disabled:cursor-default " +
                    (good
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : badPick
                        ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  {ABC[k]} {c}
                </button>
              );
            })}
          </div>
        ) : null}

        {cleared ? <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {q.why}</p> : null}
      </div>
    </div>
  );
}

function ExistTab() {
  const [big, setBig] = useState(false);
  const [boards, setBoards] = useState<Record<string, Edge[]>>({});
  const [selX, setSelX] = useState<number | null>(null);
  const [seen, setSeen] = useState<string[]>([]);

  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, boolean>>({});
  const [failPick, setFailPick] = useState<Record<string, number>>({});

  const ys = big ? FLIP_Y4 : FLIP_Y3;
  const bk = big ? "b4" : "b3";
  const edges = boards[bk] ?? [];
  const nX = FLIP_X.length;
  const nY = ys.length;
  const fn = isFunction(edges, nX);
  const back = flip(edges);
  const backOk = fn && isBijection(edges, nX, nY);
  const fk = fn ? flipFail(edges, nY) : null;
  const dIn = inDeg(edges, nY);
  const badY = dIn.map((d, i) => (d === 1 ? -1 : i)).filter((i) => i >= 0);

  const pickY = (b: number) => {
    if (selX === null) return;
    const next = toggleEdge(edges, selX, b);
    setBoards((m) => ({ ...m, [bk]: next }));
    setSelX(null);
    if (!isFunction(next, nX)) return;
    const k = flipFail(next, nY);
    setSeen((s) => {
      const set = new Set(s);
      if (k === 1 || k === 2) set.add("0");
      if (k === 0 || k === 2) set.add("1");
      if (k === null) set.add("2");
      return [...set];
    });
  };

  const q = INV_TASKS[qi];
  const doneIds = INV_TASKS.filter((t) => pick[t.id] === t.has && (t.has || failPick[t.id] === t.fail)).map((t) => t.id);
  const cleared = pick[q.id] === q.has && (q.has || failPick[q.id] === q.fail);

  return (
    <div className="space-y-4">
      {/* 뒤집기 실험실 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔁 화살표를 거꾸로 돌려 보세요</p>
          <div className="flex gap-1.5">
            {[false, true].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => { setBig(v); setSelX(null); }}
                className={
                  "rounded-lg border-2 px-2.5 py-1.5 text-[12px] font-bold transition " +
                  (big === v ? "border-pink-400/70 bg-pink-400/20 text-pink-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                공역 {v ? "4" : "3"} 개
              </button>
            ))}
          </div>
        </div>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          왼쪽 원소를 누른 뒤 오른쪽 원소를 누르면 화살표가 생겨요. 오른쪽 그림은 그것을 그대로 <b className="text-pink-200">거꾸로 돌린 것</b>입니다.
        </p>

        <div className="mt-2 grid gap-3 lg:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-center text-[11px] font-bold text-slate-400">
              내가 만든 함수 <Katex expr="f : X \to Y" />
            </p>
            <ArrowDia
              xs={FLIP_X}
              ys={ys}
              edges={edges}
              arrowColor={backOk ? "rgba(52,211,153,0.9)" : "rgba(226,232,240,0.8)"}
              badX={outDeg(edges, nX).map((d, i) => (d === 1 ? -1 : i)).filter((i) => i >= 0)}
              badY={fn ? badY : undefined}
              selX={selX}
              onPickX={(i) => setSelX((v) => (v === i ? null : i))}
              onPickY={pickY}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-center text-[11px] font-bold text-slate-400">
              거꾸로 돌린 것 <Katex expr="Y \to X" />
            </p>
            <ArrowDia
              xs={ys}
              ys={FLIP_X}
              edges={back}
              lx="Y"
              ly="X"
              fname={backOk ? "f^-1" : ""}
              arrowColor={backOk ? "rgba(52,211,153,0.9)" : "rgba(244,114,182,0.85)"}
              badX={fn ? badY : undefined}
            />
          </div>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="space-y-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-[12px] leading-6">
            <p className={fn ? "text-slate-200" : "text-rose-200"}>
              {fn ? "✓" : "✗"} 왼쪽이 함수인가 — 왼쪽 원소마다 화살표 하나
            </p>
            <p className={fn && fk !== 0 && fk !== 2 ? "text-emerald-200" : "text-slate-400"}>
              {fn && fk !== 0 && fk !== 2 ? "✓" : "○"} 조건 ① 오른쪽이 모두 짝을 받았는가
            </p>
            <p className={fn && fk !== 1 && fk !== 2 ? "text-emerald-200" : "text-slate-400"}>
              {fn && fk !== 1 && fk !== 2 ? "✓" : "○"} 조건 ② 오른쪽의 짝이 오직 하나인가
            </p>
            <p className={"mt-1.5 rounded-lg px-3 py-2 text-center text-[13px] font-extrabold " + (backOk ? "bg-emerald-400/15 text-emerald-100" : "bg-white/5 text-slate-300")}>
              {backOk ? "🎉 역함수가 있습니다" : fn ? "아직 역함수가 없어요" : "왼쪽부터 함수로 만들어 보세요"}
            </p>
          </div>
          <div className="space-y-2">
            <GoalList goals={FLIP_GOALS} seen={seen} />
            <p className={"rounded-lg px-3 py-2 text-[12px] leading-6 " + (big ? "bg-pink-400/10 text-pink-100" : "bg-violet-400/10 text-violet-100")}>
              🔍{" "}
              {big
                ? "공역이 정의역보다 크면 짝을 받지 못한 원소가 반드시 남아요. 그래서 역함수를 아예 만들 수 없습니다."
                : "두 조건을 함께 지키는 것이 바로 일대일대응이에요. 그때에만 거꾸로 돌린 것이 함수가 됩니다."}
            </p>
            <button
              type="button"
              onClick={() => { setBoards((m) => ({ ...m, [bk]: [] })); setSelX(null); }}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 모두 지우기
            </button>
          </div>
        </div>
      </div>

      {/* 판정 문제 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔎 역함수가 있을까?</p>
          <Chips ids={INV_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <InvCard
            q={q}
            pick={pick[q.id]}
            failPick={failPick[q.id]}
            onPick={(v) => setPick((m) => ({ ...m, [q.id]: v }))}
            onFail={(k) => setFailPick((m) => ({ ...m, [q.id]: k }))}
          />
        </div>
        {cleared && qi < INV_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === INV_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여덟 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            같은 <Katex expr="y = x^2" /> 이라도 정의역을 <Katex expr="x \ge 0" /> 으로 좁히고 공역을 치역에 맞추면 역함수가 생겨요. <b className="text-white">역함수가 있느냐 없느냐는 식이 아니라 정의역·공역이 정합니다.</b>
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 역함수의 성질
// ══════════════════════════════════════════════════════════════
function SymPlane({ n, a }: { n: LineFn; a: number }) {
  const uid = useId().replace(/:/g, "");
  const p1 = useMemo(() => traceFn(n.f), [n]);
  const p2 = useMemo(() => traceFn(n.inv), [n]);
  const b = n.f(a);
  const inBox = (v: number) => v >= PV.min && v <= PV.max;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${PV.size} ${PV.size}`} className="mx-auto block w-full max-w-[300px]" role="img" aria-label="함수와 역함수의 그래프를 한 좌표평면에 겹쳐 그린 그림">
        <defs>
          <clipPath id={`cp-${uid}`}>
            <rect x={PV.pad - 1} y={PV.pad - 1} width={PV.size - 2 * PV.pad + 2} height={PV.size - 2 * PV.pad + 2} />
          </clipPath>
        </defs>
        <rect x={PV.pad} y={PV.pad} width={PV.size - 2 * PV.pad} height={PV.size - 2 * PV.pad} fill="rgba(255,255,255,0.02)" />
        {PV_TICKS.map((v) => (
          <g key={`t${v}`}>
            <line x1={pvX(v)} y1={PV.pad} x2={pvX(v)} y2={PV.size - PV.pad} stroke="rgba(226,232,240,0.06)" strokeWidth={1} />
            <line x1={PV.pad} y1={pvY(v)} x2={PV.size - PV.pad} y2={pvY(v)} stroke="rgba(226,232,240,0.06)" strokeWidth={1} />
          </g>
        ))}
        <line x1={PV.pad} y1={pvY(0)} x2={PV.size - PV.pad} y2={pvY(0)} stroke="rgba(226,232,240,0.5)" strokeWidth={1.6} />
        <line x1={pvX(0)} y1={PV.pad} x2={pvX(0)} y2={PV.size - PV.pad} stroke="rgba(226,232,240,0.5)" strokeWidth={1.6} />

        <g clipPath={`url(#cp-${uid})`}>
          <line x1={pvX(PV.min)} y1={pvY(PV.min)} x2={pvX(PV.max)} y2={pvY(PV.max)} stroke="rgba(226,232,240,0.3)" strokeWidth={1.6} strokeDasharray="6 4" />
          {p2.map((poly, k) => (
            <path key={`b${k}`} d={svgPath(poly)} fill="none" stroke="#f472b6" strokeWidth={2.6} strokeLinecap="round" />
          ))}
          {p1.map((poly, k) => (
            <path key={`a${k}`} d={svgPath(poly)} fill="none" stroke="#38bdf8" strokeWidth={2.6} strokeLinecap="round" />
          ))}
          {inBox(b) ? <line x1={pvX(a)} y1={pvY(b)} x2={pvX(b)} y2={pvY(a)} stroke="rgba(226,232,240,0.35)" strokeWidth={1.4} strokeDasharray="4 3" /> : null}
        </g>

        {inBox(b) ? <circle cx={pvX(a)} cy={pvY(b)} r={5.5} fill="#38bdf8" stroke="#0f172a" strokeWidth={2} /> : null}
        {inBox(b) ? <circle cx={pvX(b)} cy={pvY(a)} r={5.5} fill="#f472b6" stroke="#0f172a" strokeWidth={2} /> : null}
        <text x={PV.size - PV.pad + 1} y={pvY(0) - 6} textAnchor="end" className="fill-slate-500 text-[10px] font-bold italic">
          x
        </text>
        <text x={pvX(0) + 7} y={PV.pad + 9} className="fill-slate-500 text-[10px] font-bold italic">
          y
        </text>
        <text x={PV.size - PV.pad - 2} y={pvY(PV.max) + 14} textAnchor="end" className="fill-slate-500 text-[10px] font-bold italic">
          y=x
        </text>
      </svg>
    </div>
  );
}

function PropCard({ q, pick, onPick }: { q: PropTask; pick: number | undefined; onPick: (i: number) => void }) {
  const right = pick === q.answer;
  return (
    <div className="space-y-2">
      <p className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center text-[15px] font-bold leading-9 text-slate-100">
        <PieceLine ps={q.prompt} />
      </p>
      <TexChoices items={q.choices} pick={pick} answer={q.answer} onPick={onPick} cols={4} />
      {pick !== undefined ? (
        <Verdict right={right} why={q.why} hint={q.choiceWhy[pick]} />
      ) : null}
    </div>
  );
}

function PropsTab() {
  const [dir, setDir] = useState<"x" | "y">("x");
  const [pos, setPos] = useState(0);
  const [ni, setNi] = useState(0);
  const [a, setA] = useState(2);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const R = ROUND;
  const finv = Array.from({ length: R.ys.length }, () => -1);
  R.f.forEach((to, i) => { finv[to] = i; });

  // 왕복 — pos 0: 출발, 1: 한 번 거침, 2: 돌아옴
  const startLabel = dir === "x" ? R.xs[0] : R.ys[0];
  void startLabel;
  const [idx, setIdx] = useState(0);
  const first = dir === "x" ? R.f[idx] : finv[idx];
  const second = dir === "x" ? finv[first] : R.f[first];
  const cols = dir === "x" ? [R.xs, R.ys, R.xs] : [R.ys, R.xs, R.ys];
  const names = dir === "x" ? ["X", "Y", "X"] : ["Y", "X", "Y"];
  const maps = dir === "x" ? ["f", "f^-1"] : ["f^-1", "f"];

  const n = LINE_FNS[ni];
  const q = PROP_TASKS[qi];
  const doneIds = PROP_TASKS.filter((t) => pick[t.id] === t.answer).map((t) => t.id);
  const cleared = pick[q.id] === q.answer;

  return (
    <div className="space-y-4">
      {/* 왕복 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🚶 갔다가 돌아오면 제자리</p>
          <div className="flex gap-1.5">
            {(["x", "y"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => { setDir(v); setIdx(0); setPos(0); }}
                className={
                  "rounded-lg border-2 px-2.5 py-1.5 text-[12px] font-bold transition " +
                  (dir === v ? "border-violet-400/70 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {v === "x" ? "X 에서 출발" : "Y 에서 출발"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2">
          <RoundDia cols={cols} names={names} maps={maps} idx={idx} first={first} second={second} pos={pos} onPick={(i) => { setIdx(i); setPos(0); }} />
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {cols[0].map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setIdx(i); setPos(0); }}
                  className={
                    "h-8 min-w-[2.2rem] rounded-lg border-2 px-1.5 font-mono text-xs font-bold transition " +
                    (i === idx ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPos((p) => (p >= 2 ? 0 : p + 1))}
              className="w-full rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-2 text-[13px] font-bold text-cyan-100 transition hover:bg-cyan-400/25"
            >
              {pos === 0 ? `${maps[0] === "f" ? "f" : "f⁻¹"} 적용하기 ▶` : pos === 1 ? `${maps[1] === "f" ? "f" : "f⁻¹"} 적용하기 ▶` : "↺ 처음부터"}
            </button>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-[12px] leading-8 text-slate-200">
            <p className="text-[11px] font-bold text-slate-400">지금까지</p>
            <p className="font-mono text-[15px]">
              {cols[0][idx]}
              {pos >= 1 ? ` → ${cols[1][first]}` : ""}
              {pos >= 2 ? ` → ${cols[2][second]}` : ""}
            </p>
            {pos >= 2 ? (
              <p className="mt-1 overflow-x-auto overflow-y-hidden rounded-lg bg-emerald-400/12 px-3 py-2 text-center text-emerald-100">
                <Katex expr={dir === "x" ? `(f^{-1} \\circ f)(${cols[0][idx]}) = ${cols[2][second]}` : `(f \\circ f^{-1})(${cols[0][idx]}) = ${cols[2][second]}`} />
              </p>
            ) : null}
          </div>
        </div>
        {pos >= 2 ? (
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-7 text-slate-300">
            🔍 어느 원소에서 출발해도 제자리로 돌아와요. 그래서 <Katex expr="f^{-1} \circ f = I_X" /> 이고 <Katex expr="f \circ f^{-1} = I_Y" /> 입니다.
          </p>
        ) : null}
      </div>

      {/* 대칭 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🪞 두 그래프는 직선 y = x 에 대하여 대칭</p>
        <p className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-center text-[15px] leading-8 text-slate-100">
          <Katex expr="y = f(x) \iff x = f^{-1}(y)" />
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {LINE_FNS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setNi(i)}
              className={
                "rounded-lg border-2 px-2.5 py-1.5 text-[13px] font-bold transition " +
                (i === ni ? "border-sky-400/70 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              <Katex expr={v.fTex} />
            </button>
          ))}
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <SymPlane n={n} a={a} />
          <div className="space-y-2">
            <div className="space-y-1.5">
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-sky-400/10 px-3 py-2 text-center text-[14px] leading-8 text-sky-100">
                <Katex expr={n.fTex} />
              </p>
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-pink-400/10 px-3 py-2 text-center text-[14px] leading-8 text-pink-100">
                <Katex expr={n.invTex} />
              </p>
            </div>
            <Slider label={<Katex expr="a" />} value={a} min={-5} max={5} step={0.5} onChange={setA} accent="accent-sky-400" />
            <div className="space-y-1">
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2 text-center text-[14px] leading-8 text-slate-100">
                <Katex expr={`f(${nx(a).replace("−", "-")}) = ${nx(n.f(a)).replace("−", "-")}`} />
              </p>
              <p className="text-center text-[12px] font-bold text-slate-400">같은 말</p>
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2 text-center text-[14px] leading-8 text-slate-100">
                <Katex expr={`f^{-1}(${nx(n.f(a)).replace("−", "-")}) = ${nx(a).replace("−", "-")}`} />
              </p>
            </div>
            <p className="rounded-lg bg-violet-400/10 px-3 py-2 text-[12px] leading-6 text-violet-100">🔍 {n.note}</p>
          </div>
        </div>
      </div>

      {/* 성질 문제 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧮 성질을 써서 값 구하기</p>
          <Chips ids={PROP_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <PropCard q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < PROP_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === PROP_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <Katex expr="f^{-1}(b) = a" /> 는 <Katex expr="f(a) = b" /> 와 <b className="text-white">같은 말</b>이에요. 역함수 문제는 대개 이 한 줄로 바꿔 쓰면 풀립니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** 왕복을 보여 주는 세 칸 그림 */
const RD = { w: 420, rowH: 34, rx: 46, headH: 44, pad: 26, botPad: 14, inset: 26, gap: 44 };

function RoundDia({ cols, names, maps, idx, first, second, pos, onPick }: { cols: string[][]; names: string[]; maps: string[]; idx: number; first: number; second: number; pos: number; onPick: (i: number) => void }) {
  const n = cols[0].length;
  const ry = ((n - 1) * RD.rowH) / 2 + RD.pad;
  const cy = RD.headH + ry;
  const h = cy + ry + RD.botPad;
  const cxs = [0, 1, 2].map((i) => 18 + RD.rx + i * (2 * RD.rx + RD.gap));
  const w = 36 + 3 * 2 * RD.rx + 2 * RD.gap;
  const rowY = (i: number) => cy + (i - (n - 1) / 2) * RD.rowH;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto block w-full touch-none select-none" role="img" aria-label="함수로 갔다가 역함수로 돌아오는 그림">
        {cols.map((col, c) => (
          <g key={`c${c}`}>
            <ellipse cx={cxs[c]} cy={cy} rx={RD.rx} ry={ry} fill="rgba(255,255,255,0.03)" stroke="rgba(226,232,240,0.5)" strokeWidth={2} />
            <text x={cxs[c]} y={cy - ry - 9} textAnchor="middle" className="fill-slate-300 text-[13px] font-bold">
              {names[c]}
            </text>
          </g>
        ))}
        {maps.map((m, s) => (
          <g key={`m${s}`}>
            <line x1={cxs[s] + 22} y1={20} x2={cxs[s + 1] - 22} y2={20} stroke="rgba(226,232,240,0.4)" strokeWidth={1.5} />
            <polygon points={arrowHead(cxs[s] + 22, 20, cxs[s + 1] - 22, 20)} fill="rgba(226,232,240,0.4)" />
            <text x={(cxs[s] + cxs[s + 1]) / 2} y={13} textAnchor="middle" className="fill-slate-300 text-[12px] font-bold italic">
              {m === "f^-1" ? "f⁻¹" : m}
            </text>
          </g>
        ))}

        {pos >= 1 ? (
          <g>
            <line x1={cxs[0] + RD.inset} y1={rowY(idx)} x2={cxs[1] - RD.inset} y2={rowY(first)} stroke="#38bdf8" strokeWidth={2.6} />
            <polygon points={arrowHead(cxs[0] + RD.inset, rowY(idx), cxs[1] - RD.inset, rowY(first))} fill="#38bdf8" />
          </g>
        ) : null}
        {pos >= 2 ? (
          <g>
            <line x1={cxs[1] + RD.inset} y1={rowY(first)} x2={cxs[2] - RD.inset} y2={rowY(second)} stroke="#f472b6" strokeWidth={2.6} />
            <polygon points={arrowHead(cxs[1] + RD.inset, rowY(first), cxs[2] - RD.inset, rowY(second))} fill="#f472b6" />
          </g>
        ) : null}

        {cols.map((col, c) =>
          col.map((s, i) => {
            const on = (c === 0 && i === idx) || (c === 1 && pos >= 1 && i === first) || (c === 2 && pos >= 2 && i === second);
            const clickable = c === 0;
            return (
              <g key={`n${c}_${i}`} className={clickable ? "cursor-pointer" : undefined} onPointerDown={clickable ? (e) => { e.preventDefault(); onPick(i); } : undefined}>
                <circle cx={cxs[c]} cy={rowY(i)} r={14} fill={on ? "rgba(52,211,153,0.28)" : clickable ? "rgba(255,255,255,0.07)" : "transparent"} stroke={on ? "#34d399" : "transparent"} strokeWidth={2} />
                <text x={cxs[c]} y={rowY(i) + 5} textAnchor="middle" className="fill-slate-100 text-[13px] font-semibold">
                  {s}
                </text>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 역함수 구하기
// ══════════════════════════════════════════════════════════════
const FLOW = ["y = f(x)", "x = f^{-1}(y)", "y = f^{-1}(x)"];
const FLOW_NOTE = ["주어진 식", "x 에 대해 정리", "x 와 y 를 맞바꿈"];

function FlowBar({ stage }: { stage: number }) {
  return (
    <div className="flex flex-wrap items-stretch justify-center gap-1.5">
      {FLOW.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          {i > 0 ? <span className="text-[16px] leading-4 text-slate-500">→</span> : null}
          <div
            className={
              "min-w-[110px] rounded-xl border-2 px-2.5 py-2 text-center transition " +
              (i < stage
                ? "border-emerald-400/50 bg-emerald-400/12 text-emerald-100"
                : i === stage
                  ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-500")
            }
          >
            <p className="overflow-x-auto overflow-y-hidden py-0.5 text-[14px] leading-7">
              <Katex expr={s} />
            </p>
            <p className="text-[10px] font-bold opacity-70">{FLOW_NOTE[i]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SolveCard({ t, p1, p2, onP1, onP2 }: { t: SolveTask; p1: number | undefined; p2: number | undefined; onP1: (i: number) => void; onP2: (i: number) => void }) {
  const ok1 = p1 === t.step1.answer;
  const ok2 = p2 === t.step2.answer;
  const stage = !ok1 ? 1 : !ok2 ? 2 : 3;

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center">
        <p className="overflow-x-auto overflow-y-hidden py-1 text-[18px] font-bold leading-9 text-slate-100">
          <Katex expr={t.fTex} />
        </p>
      </div>
      <FlowBar stage={stage} />

      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
        <p className="text-[12px] font-bold text-amber-200">
          1단계 · <Katex expr="x" /> 를 <Katex expr="y" /> 로 나타내면?
        </p>
        <div className="mt-1.5">
          <TexChoices items={t.step1.choices} pick={p1} answer={t.step1.answer} onPick={onP1} />
        </div>
        {p1 !== undefined && !ok1 ? (
          <p className="mt-1.5 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {t.step1.choiceWhy[p1]}</p>
        ) : null}
      </div>

      <div className={"rounded-xl border px-3 py-2.5 transition " + (ok1 ? "border-white/10 bg-black/25" : "pointer-events-none border-white/10 bg-black/25 opacity-40")}>
        <p className="text-[12px] font-bold text-pink-200">
          2단계 · <Katex expr="x" /> 와 <Katex expr="y" /> 를 서로 바꾸면?
        </p>
        {!ok1 ? <p className="mt-1 text-[11px] text-slate-500">1단계를 맞히면 열려요.</p> : null}
        <div className="mt-1.5">
          <TexChoices items={t.step2.choices} pick={p2} answer={t.step2.answer} onPick={onP2} />
        </div>
        {p2 !== undefined && !ok2 ? (
          <p className="mt-1.5 rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {t.step2.choiceWhy[p2]}</p>
        ) : null}
      </div>

      {ok1 && ok2 ? <CheckBox t={t} /> : null}
    </div>
  );
}

/** 정말 역함수인지 값으로 되짚어 본다 */
function CheckBox({ t }: { t: SolveTask }) {
  const [v, setV] = useState(2);
  const y = t.f(v);
  const back = t.inv(y);
  return (
    <div className="space-y-2 rounded-xl border-2 border-emerald-400/45 bg-emerald-400/10 p-3">
      <p className="overflow-x-auto overflow-y-hidden py-1 text-center text-[16px] font-bold leading-9 text-emerald-100">
        <Katex expr={t.invTex} />
      </p>
      <p className="rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">🔍 {t.note}</p>
      <Slider label={<Katex expr="a" />} value={v} min={-5} max={5} step={1} onChange={setV} accent="accent-emerald-400" />
      <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2 text-center text-[13px] leading-8 text-slate-100">
        <Katex expr={`f(${nx(v).replace("−", "-")}) = ${nx(y).replace("−", "-")},\\quad f^{-1}(${nx(y).replace("−", "-")}) = ${nx(back).replace("−", "-")}`} />
      </p>
      <p className="text-center text-[12px] font-bold text-emerald-200">넣은 값으로 그대로 돌아왔어요</p>
    </div>
  );
}

function SolveTab() {
  const [qi, setQi] = useState(0);
  const [p1, setP1] = useState<Record<string, number>>({});
  const [p2, setP2] = useState<Record<string, number>>({});

  const t = SOLVE_TASKS[qi];
  const doneIds = SOLVE_TASKS.filter((s) => p1[s.id] === s.step1.answer && p2[s.id] === s.step2.answer).map((s) => s.id);
  const cleared = p1[t.id] === t.step1.answer && p2[t.id] === t.step2.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">✏️ 두 걸음이면 됩니다</p>
          <Chips ids={SOLVE_TASKS.map((s) => s.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <p className="mt-1 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
          📖 <b className="text-slate-300">차례</b> — 먼저 <Katex expr="x" /> 를 <Katex expr="y" /> 로 나타내고, 그다음 정의역의 문자를 <Katex expr="x" /> 로 쓰는 관례에 맞추어 두 문자를 맞바꿉니다. 순서를 바꾸어 문자를 먼저 맞바꾼 뒤 <Katex expr="y" /> 에 대해 정리해도 같은 답이 나와요.
        </p>
        <div className="mt-2">
          <SolveCard
            t={t}
            p1={p1[t.id]}
            p2={p2[t.id]}
            onP1={(i) => setP1((m) => ({ ...m, [t.id]: i }))}
            onP2={(i) => setP2((m) => ({ ...m, [t.id]: i }))}
          />
        </div>
        {cleared && qi < SOLVE_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === SOLVE_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            <Katex expr="y = -x + 5" /> 와 <Katex expr="y = \dfrac{2}{x}" /> 는 <b className="text-white">역함수가 자기 자신</b>이었어요. 그래프가 이미 직선 <Katex expr="y = x" /> 에 대하여 대칭이기 때문입니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 역함수의 연산법칙
// ══════════════════════════════════════════════════════════════
function UndoCard({ u, picked, onPick, onReset }: { u: UndoTask; picked: number[]; onPick: (i: number) => void; onReset: () => void }) {
  const n = u.doSteps.length;
  const answer = Array.from({ length: n }, (_, i) => n - 1 - i);
  const done = picked.length === n && picked.every((v, i) => v === answer[i]);
  const wrong = picked.some((v, i) => v !== answer[i]);

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
        <p className="text-[13px] font-bold leading-7 text-slate-100">
          <span className="mr-1.5 text-lg">{u.icon}</span>
          {u.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {u.doSteps.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              {i > 0 ? <span className="text-[14px] leading-4 text-slate-500">→</span> : null}
              <span className="rounded-lg bg-sky-400/15 px-2.5 py-1 text-[12px] font-bold text-sky-100">
                {i + 1}. {s}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[13px] font-bold text-slate-100">되돌리는 차례대로 눌러 보세요</p>
      <div className="grid gap-1.5 sm:grid-cols-3">
        {u.scatter.map((k) => {
          const at = picked.indexOf(k);
          const good = at >= 0 && k === answer[at];
          const badPick = at >= 0 && k !== answer[at];
          return (
            <button
              key={u.undoLabels[k]}
              type="button"
              onClick={() => onPick(k)}
              disabled={at >= 0 || done}
              className={
                "rounded-xl border-2 px-2.5 py-2 text-[13px] font-bold transition disabled:cursor-default " +
                (good
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : badPick
                    ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              {at >= 0 ? `${at + 1}. ` : ""}
              {u.undoLabels[k]}
            </button>
          );
        })}
      </div>

      {picked.length > 0 && !done ? (
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          ↺ 다시 고르기
        </button>
      ) : null}

      {wrong ? (
        <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
          ❌ 차례가 어긋났어요. <b>가장 나중에 한 일</b>부터 되돌려야 합니다.
        </p>
      ) : null}
      {done ? <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {u.why}</p> : null}
    </div>
  );
}

function PairBox({ p, x }: { p: PairTask; x: number }) {
  const r = p.right(x);
  const w = p.wrong(x);
  return (
    <div className="space-y-1.5">
      <div className="grid gap-1.5 sm:grid-cols-2">
        <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-white/5 px-3 py-2 text-center text-[13px] leading-8 text-slate-200">
          <Katex expr={p.finvTex} />
        </p>
        <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-white/5 px-3 py-2 text-center text-[13px] leading-8 text-slate-200">
          <Katex expr={p.ginvTex} />
        </p>
      </div>
      <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2 text-center text-[14px] leading-8 text-slate-100">
        <Katex expr={p.gfTex} />
      </p>
      <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-emerald-400/12 px-3 py-2 text-center text-[14px] leading-8 text-emerald-100">
        <Katex expr={`(g \\circ f)^{-1}(x) = ${p.rightTex}`} />
      </p>
      <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-white/10 bg-black/25 py-1">
        <table className="w-full min-w-[280px] text-center font-mono text-[12px]">
          <tbody>
            <tr>
              <td className="px-2 py-1 text-left font-bold text-emerald-300">(f⁻¹∘g⁻¹)({nx(x)})</td>
              <td className="px-2 py-1 text-slate-100">{nx(r)}</td>
              <td className="px-2 py-1 text-emerald-300">= (g∘f)⁻¹</td>
            </tr>
            <tr className="border-t border-white/10">
              <td className="px-2 py-1 text-left font-bold text-rose-300">(g⁻¹∘f⁻¹)({nx(x)})</td>
              <td className="px-2 py-1 text-slate-100">{nx(w)}</td>
              <td className="px-2 py-1 text-rose-300">≠ (g∘f)⁻¹</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
        ⚠️ 순서를 그대로 두면 <Katex expr={`${p.wrongTex}`} /> 가 되어 다른 함수가 됩니다.
      </p>
    </div>
  );
}

function LawCard({ q, pick, onPick }: { q: LawTask; pick: number | undefined; onPick: (i: number) => void }) {
  const right = pick === q.answer;
  return (
    <div className="space-y-2">
      <p className="rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center text-[14px] font-bold leading-9 text-slate-100">
        <PieceLine ps={q.prompt} />
      </p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {q.choices.map((c, i) => {
          const good = pick === i && i === q.answer;
          const badPick = pick === i && i !== q.answer;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(i)}
              disabled={right}
              className={
                "overflow-x-auto overflow-y-hidden rounded-xl border-2 px-2.5 py-2 text-[14px] font-bold transition disabled:cursor-default " +
                (good
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : badPick
                    ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              <span className="mr-1 text-[12px] text-slate-400">{ABC[i]}</span>
              <PieceLine ps={c} />
            </button>
          );
        })}
      </div>
      {pick !== undefined ? <Verdict right={right} why={q.why} hint={q.choiceWhy[pick]} /> : null}
    </div>
  );
}

function LawsTab() {
  const [ui, setUi] = useState(0);
  const [picked, setPicked] = useState<Record<string, number[]>>({});
  const [pi, setPi] = useState(0);
  const [px, setPx] = useState(3);
  const [twice, setTwice] = useState(0);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const u = UNDO_TASKS[ui];
  const cur = picked[u.id] ?? [];
  const undoDone = UNDO_TASKS.filter((v) => {
    const p = picked[v.id] ?? [];
    const n = v.doSteps.length;
    return p.length === n && p.every((x, i) => x === n - 1 - i);
  }).map((v) => v.id);
  const uDone = cur.length === u.doSteps.length && cur.every((x, i) => x === u.doSteps.length - 1 - i);

  const p = PAIRS[pi];
  const q = LAW_TASKS[qi];
  const doneIds = LAW_TASKS.filter((t) => pick[t.id] === t.answer).map((t) => t.id);
  const cleared = pick[q.id] === q.answer;

  return (
    <div className="space-y-4">
      {/* 되돌리는 순서 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔙 되돌릴 때는 거꾸로</p>
          <Chips ids={UNDO_TASKS.map((v) => v.id)} cur={ui} done={undoDone} onPick={setUi} />
        </div>
        <div className="mt-2">
          <UndoCard
            u={u}
            picked={cur}
            onPick={(k) => setPicked((m) => ({ ...m, [u.id]: [...(m[u.id] ?? []), k] }))}
            onReset={() => setPicked((m) => ({ ...m, [u.id]: [] }))}
          />
        </div>
        {uDone && ui < UNDO_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setUi((k) => k + 1)} label="다음 사례 ▶" />
          </div>
        ) : null}
        {undoDone.length === UNDO_TASKS.length ? (
          <p className="mt-2 overflow-x-auto overflow-y-hidden rounded-lg bg-emerald-400/12 px-3 py-2.5 text-center text-[15px] leading-9 text-emerald-100">
            <Katex expr="(g \circ f)^{-1} = f^{-1} \circ g^{-1}" />
          </p>
        ) : null}
      </div>

      {/* 식으로 확인 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🧮 식으로 확인하기</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PAIRS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setPi(i)}
              className={
                "rounded-lg border-2 px-2.5 py-1.5 text-[13px] font-bold transition " +
                (i === pi ? "border-violet-400/70 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              <span className="inline-flex flex-wrap items-baseline gap-x-2">
                <Katex expr={v.fTex} />
                <Katex expr={v.gTex} />
              </span>
            </button>
          ))}
        </div>
        <div className="mt-2">
          <PairBox p={p} x={px} />
        </div>
        <div className="mt-2">
          <Slider label={<Katex expr="x" />} value={px} min={-5} max={5} step={1} onChange={setPx} accent="accent-violet-400" />
        </div>
      </div>

      {/* 두 번 뒤집기 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🔄 두 번 뒤집으면 제자리</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          {[TWICE.fTex, TWICE.invTex, TWICE.backTex].map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              {i > 0 ? <span className="text-[15px] leading-4 text-slate-500">→</span> : null}
              <div
                className={
                  "min-w-[120px] rounded-xl border-2 px-2.5 py-2 text-center transition " +
                  (i <= twice ? "border-pink-400/50 bg-pink-400/12 text-pink-100" : "border-white/10 bg-white/5 text-slate-600")
                }
              >
                <p className="overflow-x-auto overflow-y-hidden py-0.5 text-[13px] leading-7">
                  <Katex expr={i <= twice ? s : "\\ \\ ?\\ \\ "} />
                </p>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setTwice((v) => (v >= 2 ? 0 : v + 1))}
          className="mt-2 w-full rounded-xl border-2 border-pink-400/55 bg-pink-400/15 px-3 py-2 text-[13px] font-bold text-pink-100 transition hover:bg-pink-400/25"
        >
          {twice >= 2 ? "↺ 처음부터" : "🔄 한 번 뒤집기"}
        </button>
        {twice >= 2 ? (
          <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-7 text-emerald-100">
            ✅ 처음 함수로 돌아왔어요. 화살표를 거꾸로 돌린 뒤 다시 거꾸로 돌리면 처음 방향이므로 <Katex expr="(f^{-1})^{-1} = f" /> 입니다.
          </p>
        ) : null}
      </div>

      {/* 판정 문제 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔎 확인해 보기</p>
          <Chips ids={LAW_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <LawCard q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < LAW_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === LAW_TASKS.length && undoDone.length === UNDO_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 연산법칙을 모두 익혔어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            합성은 <b className="text-white">나중에 씌운 것부터</b> 벗겨야 해요. 그래서 <Katex expr="(g \circ f)^{-1} = f^{-1} \circ g^{-1}" /> 로 순서가 뒤집힙니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ⑤ 일상 속 역함수
// ══════════════════════════════════════════════════════════════
function LifeCard({ c, hasPick, pick, onHas, onPick }: { c: LifeCase; hasPick: boolean | undefined; pick: number | undefined; onHas: (v: boolean) => void; onPick: (i: number) => void }) {
  const hasRight = hasPick === c.has;
  const right = pick === c.answer;

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
        <p className="text-[13px] font-bold leading-7 text-slate-100">
          <span className="mr-1.5 text-lg">{c.icon}</span>
          {c.title}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] leading-6 text-slate-400">
          <span className="rounded-lg bg-sky-400/15 px-2 py-0.5 font-bold text-sky-100">하는 일</span>
          {c.forward}
        </p>
      </div>

      <p className="text-[13px] font-bold text-slate-100">이 일에 역함수가 있을까요?</p>
      <div className="grid grid-cols-2 gap-1.5">
        {[true, false].map((v) => {
          const good = hasPick === v && v === c.has;
          const badPick = hasPick === v && v !== c.has;
          return (
            <button
              key={String(v)}
              type="button"
              onClick={() => onHas(v)}
              disabled={hasRight}
              className={
                "rounded-xl border-2 px-2 py-2.5 text-[13px] font-bold transition disabled:cursor-default " +
                (good
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : badPick
                    ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              {v ? HAS_CHOICES[0] : HAS_CHOICES[1]}
            </button>
          );
        })}
      </div>
      {hasPick !== undefined && !hasRight ? (
        <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
          ❌ <b>서로 다른 것이 같은 결과로 가는 일</b>이 있는지 따져 보세요. 그런 일이 있으면 되돌릴 수 없습니다.
        </p>
      ) : null}

      <div className={"rounded-xl border-2 p-3 transition " + (hasRight ? "border-white/10 bg-slate-900/40" : "pointer-events-none border-white/10 bg-slate-900/40 opacity-40")}>
        <p className="text-[13px] font-bold text-slate-100">{c.q2}</p>
        {!hasRight ? <p className="mt-1 text-[11px] text-slate-500">앞 문제를 맞히면 열려요.</p> : null}
        <div className="mt-1.5">
          <TextChoices items={c.choices} pick={pick} answer={c.answer} onPick={onPick} />
        </div>
        {pick !== undefined ? (
          <div className="mt-1.5">
            <Verdict right={right} why={c.why} hint={c.choiceWhy[pick]} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LifeTab() {
  const [ci, setCi] = useState(0);
  const [hasPick, setHasPick] = useState<Record<string, boolean>>({});
  const [pick, setPick] = useState<Record<string, number>>({});

  const c = LIFE_CASES[ci];
  const done = LIFE_CASES.filter((q) => hasPick[q.id] === q.has && pick[q.id] === q.answer).map((q) => q.id);
  const cleared = hasPick[c.id] === c.has && pick[c.id] === c.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🏠 일상생활에서 되돌릴 수 있는 일 찾기</p>
          <Chips ids={LIFE_CASES.map((q) => q.id)} cur={ci} done={done} onPick={setCi} />
        </div>
        <div className="mt-2">
          <LifeCard
            c={c}
            hasPick={hasPick[c.id]}
            pick={pick[c.id]}
            onHas={(v) => setHasPick((m) => ({ ...m, [c.id]: v }))}
            onPick={(i) => setPick((m) => ({ ...m, [c.id]: i }))}
          />
        </div>
        {cleared && ci < LIFE_CASES.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setCi((k) => k + 1)} label="다음 사례 ▶" />
          </div>
        ) : null}
      </div>

      {done.length === LIFE_CASES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여덟 사례를 모두 살폈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            되돌릴 수 없는 까닭은 언제나 하나였어요 — <b className="text-white">서로 다른 것이 같은 결과로 뭉쳐</b> 어느 쪽이었는지 가릴 수 없기 때문입니다. 일대일함수가 아니면 역함수가 없다는 말과 꼭 같아요.
          </p>
        </div>
      ) : null}
    </div>
  );
}
