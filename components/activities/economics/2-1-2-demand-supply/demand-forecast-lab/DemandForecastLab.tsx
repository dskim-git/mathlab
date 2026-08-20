"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  FORECAST_PRICES,
  GX_MAX,
  GY_MAX,
  LSQ,
  PROBLEMS,
  SNAP,
  TWO_POINT_PRESETS,
  cOf,
  fmt,
  lineOf,
  lsqCoefs,
  lsqSquareTex,
  lsqTermsTex,
  signed,
  type PStep,
  type Pt,
  type TwoPointPreset,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "two_point",
    prompt:
      "수요곡선이 직선이면 조사한 두 점만으로 식을 정할 수 있었어요. 점 하나만 알 때는 왜 식을 정할 수 없는지, 점이 세 개일 때는 어떤 문제가 생기는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 점 하나만으로는 그 점을 지나는 직선이 무수히 많아 기울기를 정할 수 없다. 점이 세 개면 한 직선 위에 놓이지 않는 경우가 생겨 딱 맞는 직선이 없다.",
  },
  {
    id: "lsq",
    prompt:
      "최소제곱법은 ‘차의 제곱의 합’을 가장 작게 만드는 방법이었어요. 차를 그냥 더하지 않고 제곱해서 더하는 까닭은 무엇일지 자기 생각을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 예측보다 크게 나온 것과 작게 나온 것이 서로 상쇄되어 오차가 없는 것처럼 보이기 때문이다. 제곱하면 모두 양수가 되고 크게 빗나간 점일수록 더 크게 반영된다.",
  },
  {
    id: "limit",
    prompt:
      "식으로 예측한 값이 늘 믿을 만한 것은 아니었어요. 조사한 가격의 범위를 크게 벗어난 곳까지 예측했을 때 어떤 일이 생겼는지, 예측을 쓸 때 무엇을 조심해야 할지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 가격을 아주 높게 넣으니 수요량이 음수가 되었다. 조사한 범위 안에서만 믿고, 밖으로 나갈 때는 결과가 말이 되는지 꼭 확인해야 한다.",
  },
];

type Tab = "two" | "lsq" | "problem";

export default function DemandForecastLab() {
  const [tab, setTab] = useState<Tab>("two");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🔮 수요량 예측하기</h3>
        <p className="mt-2 leading-7 text-slate-300">
          조사한 자료는 몇 개뿐인데, 조사하지 않은 가격의 수요량이 궁금하다면? 자료를 지나는{" "}
          <b className="text-emerald-200">직선의 식</b>을 찾으면 됩니다. 자료가 한 직선 위에 놓이지 않을 때는{" "}
          <b className="text-amber-200">오차의 제곱의 합</b>을 가장 작게 만드는 직선을 고르면 돼요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "two"} onClick={() => setTab("two")}>① 두 점으로 수요곡선 찾기</TabButton>
        <TabButton active={tab === "lsq"} onClick={() => setTab("lsq")}>② 최소제곱법으로 예측하기</TabButton>
        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>③ 단계별 문제</TabButton>
      </div>

      <div className="mt-4">
        {tab === "two" ? <TwoPointTab /> : null}
        {tab === "lsq" ? <LsqTab /> : null}
        {tab === "problem" ? <ProblemTab /> : null}
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
        "rounded-xl border-2 px-3 py-2 text-sm font-bold transition " +
        (active
          ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

function FormulaLine({ expr, className }: { expr: string; className?: string }) {
  return (
    <div className={"overflow-x-auto overflow-y-hidden py-1 " + (className ?? "")}>
      <Katex expr={expr} display />
    </div>
  );
}

const TONE_ON: Record<string, string> = {
  emerald: "border-emerald-400/60 bg-emerald-400/15",
  sky: "border-sky-400/60 bg-sky-400/15",
  amber: "border-amber-400/60 bg-amber-400/15",
  violet: "border-violet-400/60 bg-violet-400/15",
};

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold text-slate-300">{label}</p>
        <p className="font-mono text-base font-bold text-slate-100">{display}</p>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"mt-1 w-full " + accent}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 두 점으로 수요곡선 찾기
// ══════════════════════════════════════════════════════════════
const W1 = 400,
  H1 = 320,
  L1 = 46,
  R1 = 18,
  T1 = 30,
  B1 = 36;

function TwoPointTab() {
  const [pid, setPid] = useState(TWO_POINT_PRESETS[0].id);
  const preset = TWO_POINT_PRESETS.find((p) => p.id === pid) ?? TWO_POINT_PRESETS[0];
  const [A, setA] = useState<Pt>(preset.A);
  const [B, setB] = useState<Pt>(preset.B);
  const [mark, setMark] = useState(4);
  const [quiz, setQuiz] = useState(false);
  const [ans, setAns] = useState<Record<number, string>>({});
  const [graded, setGraded] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<"A" | "B" | null>(null);

  const { a, b, ok } = lineOf(A, B);

  function pick(p: TwoPointPreset) {
    setPid(p.id);
    setA(p.A);
    setB(p.B);
    setAns({});
    setGraded(false);
  }

  const X = (v: number) => L1 + (v / GX_MAX) * (W1 - L1 - R1);
  const Y = (v: number) => H1 - B1 - (v / GY_MAX) * (H1 - T1 - B1);

  function toData(e: React.PointerEvent<SVGSVGElement>): Pt | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    if (r.width === 0) return null;
    const sx = ((e.clientX - r.left) / r.width) * W1;
    const sy = ((e.clientY - r.top) / r.height) * H1;
    const vx = ((sx - L1) / (W1 - L1 - R1)) * GX_MAX;
    const vy = ((H1 - B1 - sy) / (H1 - T1 - B1)) * GY_MAX;
    const snap = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v / SNAP) * SNAP));
    return { x: snap(vx, 0, GX_MAX), y: snap(vy, 0, GY_MAX) };
  }

  const predict = (p: number) => a * p + b;
  const marked = predict(mark);

  function grade() {
    setGraded(true);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">📏 수요곡선이 직선이라면</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          <b className="text-emerald-100">두 점의 좌표만 알면</b> 수요곡선의 방정식을 알 수 있어요. 점 A와 B를{" "}
          <b className="text-emerald-100">끌어서 옮겨</b> 보며 식이 어떻게 달라지는지 살펴봐요. (가격과 수요량의 단위는
          생략했어요.)
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {TWO_POINT_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => pick(p)}
            className={
              "rounded-xl border-2 p-3 text-left transition " +
              (pid === p.id ? TONE_ON[p.tone] : "border-white/10 bg-white/5 hover:bg-white/10")
            }
          >
            <p className="text-sm font-bold text-slate-100">
              {p.emoji} {p.name}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{p.story}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
          <div className="overflow-x-auto overflow-y-hidden">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W1} ${H1}`}
              className="h-auto w-full min-w-[320px] touch-none select-none"
              style={{ touchAction: "none" }}
              role="img"
              aria-label="두 점을 지나는 수요곡선"
              onPointerMove={(e) => {
                if (!drag.current) return;
                const p = toData(e);
                if (!p) return;
                if (drag.current === "A") setA(p);
                else setB(p);
              }}
              onPointerUp={() => {
                drag.current = null;
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
            >
              <defs>
                <clipPath id="tp-clip">
                  <rect x={L1} y={T1} width={W1 - L1 - R1} height={H1 - T1 - B1} />
                </clipPath>
              </defs>
              <rect x={0} y={0} width={W1} height={H1} rx={10} fill="#0b1220" />
              {Array.from({ length: GX_MAX + 1 }, (_, i) => (
                <g key={`gx${i}`}>
                  <line x1={X(i)} y1={T1} x2={X(i)} y2={H1 - B1} stroke="rgba(148,163,184,0.13)" strokeWidth={0.8} />
                  <text x={X(i)} y={H1 - B1 + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                    {i}
                  </text>
                </g>
              ))}
              {Array.from({ length: GY_MAX + 1 }, (_, i) => (
                <g key={`gy${i}`}>
                  <line x1={L1} y1={Y(i)} x2={W1 - R1} y2={Y(i)} stroke="rgba(148,163,184,0.13)" strokeWidth={0.8} />
                  {i % 2 === 0 ? (
                    <text x={L1 - 6} y={Y(i)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                      {i}
                    </text>
                  ) : null}
                </g>
              ))}

              {/* 직선 — 격자 안쪽만 (clip) */}
              {ok ? (
                <g clipPath="url(#tp-clip)">
                  <line x1={X(0)} y1={Y(b)} x2={X(GX_MAX)} y2={Y(a * GX_MAX + b)} stroke="#34d399" strokeWidth={3} strokeLinecap="round" />
                </g>
              ) : null}

              {/* 예측 지점 — 점·라벨은 clip 밖에 */}
              {ok && marked >= 0 && marked <= GY_MAX ? (
                <g>
                  <line x1={X(mark)} y1={Y(marked)} x2={X(mark)} y2={H1 - B1} stroke="#fbbf24" strokeWidth={1.2} strokeDasharray="3 3" opacity={0.85} />
                  <line x1={L1} y1={Y(marked)} x2={X(mark)} y2={Y(marked)} stroke="#fbbf24" strokeWidth={1.2} strokeDasharray="3 3" opacity={0.85} />
                  <circle cx={X(mark)} cy={Y(marked)} r={5} fill="#fbbf24" />
                </g>
              ) : null}

              <line x1={L1} y1={H1 - B1} x2={W1 - R1} y2={H1 - B1} stroke="#94a3b8" strokeWidth={1.2} />
              <line x1={L1} y1={T1} x2={L1} y2={H1 - B1} stroke="#94a3b8" strokeWidth={1.2} />

              {/* 끌 수 있는 두 점 */}
              {([["A", A, "#38bdf8"], ["B", B, "#a78bfa"]] as const).map(([name, p, col]) => (
                <g
                  key={name}
                  className="cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => {
                    svgRef.current?.setPointerCapture(e.pointerId);
                    drag.current = name;
                  }}
                >
                  <circle cx={X(p.x)} cy={Y(p.y)} r={11} fill="transparent" />
                  <circle cx={X(p.x)} cy={Y(p.y)} r={7} fill="#fff" />
                  <circle cx={X(p.x)} cy={Y(p.y)} r={4.6} fill={col} />
                  <text x={X(p.x) + 11} y={Y(p.y) - 9} fill={col} fontSize={11} fontWeight={700}>
                    {name}({fmt(p.x)}, {fmt(p.y)})
                  </text>
                </g>
              ))}

              <text x={W1 - R1} y={H1 - B1 + 27} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                가격 x
              </text>
              <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                수요량 Qd
              </text>
            </svg>
          </div>
          <p className="px-1 pb-1 text-[10px] text-slate-500">파란 점 A와 보라 점 B를 끌어서 옮겨 보세요 (0.5 단위로 붙어요)</p>
        </div>

        <div className="space-y-2">
          {!ok ? (
            <div className="rounded-2xl border-2 border-rose-400/50 bg-rose-400/[0.10] p-4 text-center text-sm font-bold text-rose-100">
              두 점의 가격이 같으면 직선의 식을 정할 수 없어요. A와 B를 좌우로 떨어뜨려 주세요.
            </div>
          ) : (
            <>
              <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.09] p-4">
                <p className="text-center text-xs font-bold text-emerald-200">수요곡선의 방정식</p>
                <FormulaLine expr={`Q_d = ${fmt(a, 4)}x ${signed(b, 4)}`} className="text-slate-100" />
              </div>

              <div className="space-y-1.5">
                <StepLine
                  n={1}
                  title="기울기"
                  tex={`a = \\dfrac{${fmt(B.y)} - ${fmt(A.y)}}{${fmt(B.x)} - ${fmt(A.x)}} = ${fmt(a, 4)}`}
                  tone="sky"
                />
                <StepLine
                  n={2}
                  title="y절편"
                  tex={`b = ${fmt(A.y)} - (${fmt(a, 4)}) \\times ${fmt(A.x)} = ${fmt(b, 4)}`}
                  tone="violet"
                />
              </div>

              {a >= 0 ? (
                <p className="rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-2 text-xs leading-5 text-amber-100">
                  ⚠️ 지금은 기울기가 음수가 아니에요. 값이 오를수록 수요량도 늘어나는 셈이라 수요곡선보다 공급곡선에
                  가까운 모습입니다.
                </p>
              ) : null}

              <Slider
                label="🔮 이 가격이면 수요량은?"
                value={mark}
                display={fmt(mark)}
                min={0}
                max={GX_MAX}
                step={SNAP}
                onChange={setMark}
                accent="accent-amber-400"
              />
              <div className="rounded-xl border-2 border-amber-400/40 bg-amber-400/[0.08] px-3 py-2.5 text-center">
                <p className="font-mono text-2xl font-bold text-amber-100">{fmt(marked, 3)}</p>
                <p className="text-[11px] text-slate-400">
                  가격 {fmt(mark)}일 때의 예측 수요량{marked < 0 ? " — 음수라 뜻이 통하지 않아요" : ""}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 예측 표 */}
      {ok ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-200">🧮 가격에 따른 수요량을 예측해 보자</p>
            <button
              type="button"
              onClick={() => {
                setQuiz(!quiz);
                setGraded(false);
                setAns({});
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              {quiz ? "👀 값 보기" : "🙈 가리고 직접 채우기"}
            </button>
          </div>
          <div className="mt-2 overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[420px] border-collapse text-center text-xs">
              <tbody>
                <tr>
                  <th className="border border-white/15 bg-sky-500/25 px-2 py-1.5 font-bold text-sky-50">가격 x</th>
                  {FORECAST_PRICES.map((p) => (
                    <td key={p} className="border border-white/15 px-2 py-1.5 font-mono font-bold text-slate-200">
                      {p}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="border border-white/15 bg-sky-500/25 px-2 py-1.5 font-bold text-sky-50">수요량 Qd</th>
                  {FORECAST_PRICES.map((p) => {
                    const want = predict(p);
                    const typed = ans[p] ?? "";
                    const hit = Math.abs(Number(typed.replace(/[^0-9.-]/g, "")) - want) <= 0.005 && typed.trim() !== "";
                    if (!quiz) {
                      return (
                        <td key={p} className="border border-white/15 px-2 py-1.5 font-mono text-emerald-100">
                          {fmt(want, 3)}
                        </td>
                      );
                    }
                    return (
                      <td key={p} className="border border-white/15 px-1 py-1.5">
                        <input
                          type="text"
                          inputMode="text"
                          aria-label={`가격 ${p}일 때의 수요량`}
                          value={typed}
                          onChange={(e) => setAns((s) => ({ ...s, [p]: e.target.value }))}
                          className={
                            "w-16 rounded border bg-slate-950 px-1.5 py-1 text-center font-mono text-xs outline-none transition " +
                            (graded
                              ? hit
                                ? "border-emerald-400/70 text-emerald-100"
                                : "border-rose-400/60 text-rose-100"
                              : "border-white/15 text-slate-100 focus:border-violet-300")
                          }
                        />
                        {graded && !hit ? <p className="mt-0.5 font-mono text-[10px] text-emerald-200">{fmt(want, 3)}</p> : null}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          {quiz ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={grade}
                className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
              >
                채점하기
              </button>
              {graded ? (
                <span className="text-xs font-bold text-slate-300">
                  {FORECAST_PRICES.filter((p) => Math.abs(Number((ans[p] ?? "").replace(/[^0-9.-]/g, "")) - predict(p)) <= 0.005 && (ans[p] ?? "").trim() !== "").length}{" "}
                  / {FORECAST_PRICES.length} 정답
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-[11px] leading-5 text-slate-400">
              식 하나만 있으면 조사하지 않은 가격의 수요량도 모두 채울 수 있어요. 점을 옮기면 표도 함께 바뀝니다.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function StepLine({ n, title, tex, tone }: { n: number; title: string; tex: string; tone: string }) {
  const cls: Record<string, string> = {
    sky: "border-sky-400/30 bg-sky-400/[0.06]",
    violet: "border-violet-400/30 bg-violet-400/[0.06]",
    amber: "border-amber-400/30 bg-amber-400/[0.06]",
  };
  return (
    <div className={"rounded-xl border px-3 py-1.5 " + cls[tone]}>
      <p className="text-[11px] font-bold text-slate-300">
        <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/15 text-[9px]">{n}</span>
        {title}
      </p>
      <div className="overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
        <Katex expr={tex} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 최소제곱법으로 예측하기
// ══════════════════════════════════════════════════════════════
const W2 = 380,
  H2 = 280,
  L2 = 46,
  R2 = 18,
  T2 = 32,
  B2 = 34;

function LsqTab() {
  const [a, setA] = useState(LSQ.aStart);
  const [anim, setAnim] = useState<{ from: number; to: number; n: number } | null>(null);
  const [n, setN] = useState(0);
  const { A2, A1, A0, aBest, cMin } = lsqCoefs(LSQ);
  const C = cOf(LSQ, a);
  const found = Math.abs(a - aBest) < 0.03;
  const tex = lsqSquareTex(LSQ);

  useEffect(() => {
    if (!anim) return;
    const t0 = performance.now();
    const dur = 900;
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / dur);
      const e = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p);
      setA(Number((anim.from + (anim.to - anim.from) * e).toFixed(2)));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [anim]);

  // 산점도 범위
  const xMax = Math.max(...LSQ.data.map((p) => p.x)) + 1;
  const ys = [...LSQ.data.map((p) => p.y), LSQ.b0, LSQ.aMin * xMax + LSQ.b0];
  const yLo = Math.floor((Math.min(...ys) - 2) / 5) * 5;
  const yHi = Math.ceil((Math.max(...ys) + 2) / 5) * 5;
  const X = (v: number) => L2 + (v / xMax) * (W2 - L2 - R2);
  const Y = (v: number) => H2 - B2 - ((v - yLo) / (yHi - yLo)) * (H2 - T2 - B2);

  // C(a) 포물선
  const cHi = Math.max(cOf(LSQ, LSQ.aMin), cOf(LSQ, LSQ.aMax)) * 1.08;
  const CX = (v: number) => L2 + ((v - LSQ.aMin) / (LSQ.aMax - LSQ.aMin)) * (W2 - L2 - R2);
  const CY = (v: number) => H2 - B2 - (v / cHi) * (H2 - T2 - B2);
  const cPts = Array.from({ length: 121 }, (_, i) => {
    const v = LSQ.aMin + (i / 120) * (LSQ.aMax - LSQ.aMin);
    return `${CX(v)},${CY(cOf(LSQ, v))}`;
  }).join(" ");

  const forecast = aBest * LSQ.forecastX + LSQ.b0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">🎯 자료가 한 직선 위에 놓이지 않는다면?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          모든 점을 지나는 직선이 없을 때는 <b className="text-amber-100">가장 잘 맞는</b> 직선을 고릅니다. 점마다{" "}
          <b className="text-amber-100">(예측 − 실제)를 제곱</b>해 모두 더한 값 C가 가장 작아지도록 상수를 정하는 방법이{" "}
          <b className="text-amber-100">최소제곱법</b>이에요. 제곱한 값은 아래 그림에서 정사각형의 넓이랍니다.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">
          {LSQ.emoji} {LSQ.name} — 조건
        </p>
        <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2">
            <p className="text-[11px] text-slate-400">가격 x에 대하여 수요함수는</p>
            <FormulaLine expr={`Q_d = ax + ${LSQ.b0}`} className="text-slate-100" />
            <p className="text-[11px] text-slate-400">(a는 상수)</p>
          </div>
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[240px] border-collapse text-center text-xs">
              <tbody>
                <tr>
                  <th className="border border-white/15 bg-sky-500/25 px-2 py-1.5 font-bold text-sky-50">
                    가격 ({LSQ.priceUnit})
                  </th>
                  {LSQ.data.map((p) => (
                    <td key={p.x} className="border border-white/15 px-2 py-1.5 font-mono font-bold text-slate-200">
                      {p.x}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="border border-white/15 bg-sky-500/25 px-2 py-1.5 font-bold text-sky-50">
                    실제 수요량 ({LSQ.qtyUnit})
                  </th>
                  {LSQ.data.map((p) => (
                    <td key={p.x} className="border border-white/15 px-2 py-1.5 font-mono text-slate-200">
                      {p.y}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          {/* 산점도 + 잔차 정사각형 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
            <div className="overflow-x-auto overflow-y-hidden">
              <svg viewBox={`0 0 ${W2} ${H2}`} className="h-auto w-full min-w-[320px]" role="img" aria-label="실제 수요량과 예측 직선, 오차의 제곱">
                <defs>
                  <clipPath id="lsq-clip">
                    <rect x={L2} y={T2} width={W2 - L2 - R2} height={H2 - T2 - B2} />
                  </clipPath>
                </defs>
                <rect x={0} y={0} width={W2} height={H2} rx={10} fill="#0b1220" />
                {[0, 0.25, 0.5, 0.75, 1].map((r) => (
                  <g key={`y${r}`}>
                    <line x1={L2} y1={Y(yLo + r * (yHi - yLo))} x2={W2 - R2} y2={Y(yLo + r * (yHi - yLo))} stroke="rgba(148,163,184,0.14)" strokeWidth={0.8} />
                    <text x={L2 - 6} y={Y(yLo + r * (yHi - yLo))} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                      {fmt(yLo + r * (yHi - yLo), 0)}
                    </text>
                  </g>
                ))}
                {Array.from({ length: xMax + 1 }, (_, i) => (
                  <g key={`x${i}`}>
                    <line x1={X(i)} y1={T2} x2={X(i)} y2={H2 - B2} stroke="rgba(148,163,184,0.12)" strokeWidth={0.8} />
                    <text x={X(i)} y={H2 - B2 + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                      {i}
                    </text>
                  </g>
                ))}

                <g clipPath="url(#lsq-clip)">
                  <line x1={X(0)} y1={Y(LSQ.b0)} x2={X(xMax)} y2={Y(a * xMax + LSQ.b0)} stroke="#38bdf8" strokeWidth={2.6} />
                  {LSQ.data.map((p) => {
                    const pred = a * p.x + LSQ.b0;
                    const side = Math.abs(Y(pred) - Y(p.y));
                    const top = Math.min(Y(pred), Y(p.y));
                    return (
                      <g key={`sq${p.x}`}>
                        <rect x={X(p.x)} y={top} width={side} height={side} fill="#f43f5e" fillOpacity={0.22} stroke="#f43f5e" strokeWidth={0.9} />
                        <line x1={X(p.x)} y1={Y(p.y)} x2={X(p.x)} y2={Y(pred)} stroke="#f43f5e" strokeWidth={2} />
                      </g>
                    );
                  })}
                </g>

                {LSQ.data.map((p) => (
                  <g key={`pt${p.x}`}>
                    <circle cx={X(p.x)} cy={Y(p.y)} r={5.5} fill="#fff" />
                    <circle cx={X(p.x)} cy={Y(p.y)} r={3.4} fill="#34d399" />
                  </g>
                ))}

                <line x1={L2} y1={H2 - B2} x2={W2 - R2} y2={H2 - B2} stroke="#94a3b8" strokeWidth={1.2} />
                <line x1={L2} y1={T2} x2={L2} y2={H2 - B2} stroke="#94a3b8" strokeWidth={1.2} />
                <text x={W2 - R2} y={H2 - B2 + 26} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                  가격 x ({LSQ.priceUnit})
                </text>
                <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                  수요량 ({LSQ.qtyUnit})
                </text>
              </svg>
            </div>
            <p className="px-1 pb-1 text-[10px] text-slate-500">
              초록 점 = 실제 수요량 · 파란 직선 = 지금 a로 예측한 수요함수 · 붉은 정사각형의 넓이 합 = C
            </p>
          </div>

          {/* C(a) 포물선 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
            <div className="overflow-x-auto overflow-y-hidden">
              <svg viewBox={`0 0 ${W2} ${H2}`} className="h-auto w-full min-w-[320px]" role="img" aria-label="a에 따른 오차 제곱합 C의 그래프">
                <rect x={0} y={0} width={W2} height={H2} rx={10} fill="#0b1220" />
                {[0, 0.25, 0.5, 0.75, 1].map((r) => (
                  <g key={`cy${r}`}>
                    <line x1={L2} y1={CY(r * cHi)} x2={W2 - R2} y2={CY(r * cHi)} stroke="rgba(148,163,184,0.14)" strokeWidth={0.8} />
                    <text x={L2 - 6} y={CY(r * cHi)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                      {fmt(r * cHi, 0)}
                    </text>
                  </g>
                ))}
                {[0, 0.25, 0.5, 0.75, 1].map((r) => {
                  const v = LSQ.aMin + r * (LSQ.aMax - LSQ.aMin);
                  return (
                    <g key={`cx${r}`}>
                      <line x1={CX(v)} y1={T2} x2={CX(v)} y2={H2 - B2} stroke="rgba(148,163,184,0.12)" strokeWidth={0.8} />
                      <text x={CX(v)} y={H2 - B2 + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                        {fmt(v, 1)}
                      </text>
                    </g>
                  );
                })}
                <polyline points={cPts} fill="none" stroke="#a78bfa" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
                <line x1={CX(aBest)} y1={T2} x2={CX(aBest)} y2={H2 - B2} stroke="#34d399" strokeWidth={1.2} strokeDasharray="4 3" opacity={found ? 0.9 : 0.35} />
                <circle cx={CX(aBest)} cy={CY(cMin)} r={4} fill="#34d399" opacity={found ? 1 : 0.4} />
                <circle cx={CX(a)} cy={CY(C)} r={6} fill="#fff" />
                <circle cx={CX(a)} cy={CY(C)} r={3.6} fill="#f43f5e" />
                <line x1={L2} y1={H2 - B2} x2={W2 - R2} y2={H2 - B2} stroke="#94a3b8" strokeWidth={1.2} />
                <line x1={L2} y1={T2} x2={L2} y2={H2 - B2} stroke="#94a3b8" strokeWidth={1.2} />
                <text x={W2 - R2} y={H2 - B2 + 26} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                  상수 a
                </text>
                <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                  오차 제곱합 C
                </text>
              </svg>
            </div>
            <p className="px-1 pb-1 text-[10px] text-slate-500">C는 a에 대한 이차함수예요. 포물선의 꼭짓점이 가장 작은 값!</p>
          </div>
        </div>

        <div className="space-y-2">
          <Slider
            label="상수 a"
            value={a}
            display={fmt(a)}
            min={LSQ.aMin}
            max={LSQ.aMax}
            step={LSQ.aStep}
            onChange={(v) => {
              setAnim(null);
              setA(v);
            }}
            accent="accent-sky-400"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setN(n + 1);
                setAnim({ from: a, to: aBest, n: n + 1 });
              }}
              className="flex-1 rounded-lg border-2 border-emerald-400/50 bg-emerald-400/12 px-3 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/22"
            >
              🎯 가장 작아지는 곳으로
            </button>
            <button
              type="button"
              onClick={() => {
                setAnim(null);
                setA(LSQ.aStart);
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↩️ 처음으로
            </button>
          </div>

          <div className={"rounded-2xl border-2 p-4 text-center transition " + (found ? "border-emerald-400/60 bg-emerald-400/[0.12]" : "border-rose-400/40 bg-rose-400/[0.08]")}>
            <p className={"text-xs font-bold " + (found ? "text-emerald-200" : "text-rose-200")}>오차 제곱합 C</p>
            <p className={"mt-0.5 font-mono text-4xl font-bold " + (found ? "text-emerald-100" : "text-rose-100")}>{fmt(C, 2)}</p>
            {found ? (
              <p className="mt-1 text-xs font-bold text-emerald-200">🎉 가장 작은 값을 찾았어요!</p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400">붉은 정사각형의 넓이 합이 더 작아지도록 a를 움직여 보세요.</p>
            )}
          </div>

          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[280px] border-collapse text-center font-mono text-xs">
              <thead>
                <tr>
                  {["가격", "실제", "예측", "차", "차²"].map((h) => (
                    <th key={h} className="border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-bold text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LSQ.data.map((p) => {
                  const pred = a * p.x + LSQ.b0;
                  const d = pred - p.y;
                  return (
                    <tr key={p.x}>
                      <td className="border border-white/10 px-2 py-1.5 text-slate-300">{p.x}</td>
                      <td className="border border-white/10 px-2 py-1.5 text-emerald-200">{p.y}</td>
                      <td className="border border-white/10 px-2 py-1.5 text-sky-200">{fmt(pred, 2)}</td>
                      <td className="border border-white/10 px-2 py-1.5 text-slate-200">{fmt(d, 2)}</td>
                      <td className="border border-white/10 px-2 py-1.5 font-bold text-rose-200">{fmt(d * d, 2)}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan={4} className="border border-white/10 bg-white/5 px-2 py-1.5 text-right text-[10px] font-bold text-slate-400">
                    합계 C
                  </td>
                  <td className="border border-white/10 bg-rose-400/15 px-2 py-1.5 font-bold text-rose-100">{fmt(C, 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 식으로 정리 */}
      <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.06] p-4">
        <p className="text-sm font-bold text-violet-200">✍️ 식으로 정리하면</p>
        <div className="mt-1 space-y-1">
          <FormulaLine expr={lsqTermsTex(LSQ)} className="text-slate-100" />
          <FormulaLine expr={tex.poly} className="text-slate-100" />
          <FormulaLine expr={tex.square} className="text-slate-100" />
        </div>
        <p className="mt-1 text-xs leading-6 text-slate-300">
          C는 a에 대한 이차함수예요. 완전제곱식으로 고치면 <b className="text-violet-100">a = {fmt(aBest)}</b>일 때 C가
          가장 작은 <b className="text-violet-100">{fmt(cMin)}</b>이 됩니다. (A₂ = {fmt(A2)}, A₁ = {fmt(A1)}, A₀ ={" "}
          {fmt(A0)})
        </p>
      </div>

      <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4">
        <p className="text-center text-xs font-bold text-emerald-200">그래서 이 가게의 수요함수는</p>
        <FormulaLine expr={`Q_d = ${fmt(aBest)}x + ${LSQ.b0}`} className="text-slate-100" />
        <p className="text-center text-sm leading-6 text-slate-200">
          가격이 <b className="text-emerald-100">{LSQ.forecastX}{LSQ.priceUnit}</b>일 때의 수요량은{" "}
          <b className="font-mono text-lg text-emerald-100">{fmt(forecast)}</b>
          {LSQ.qtyUnit}으로 예측돼요.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 단계별 문제
// ══════════════════════════════════════════════════════════════
type StepState = { text: string; ok: boolean; tries: number; hint: boolean; shown: boolean };
const DEFAULT_STEP: StepState = { text: "", ok: false, tries: 0, hint: false, shown: false };

function ProblemTab() {
  const [pIdx, setPIdx] = useState(0);
  const [state, setState] = useState<Record<string, StepState>>({});
  const prob = PROBLEMS[pIdx];
  const doneCount = PROBLEMS.filter((p) => p.steps.every((s) => state[s.id]?.ok)).length;

  function get(id: string) {
    return state[id] ?? DEFAULT_STEP;
  }
  function update(id: string, patch: Partial<StepState>) {
    setState((p) => ({ ...p, [id]: { ...(p[id] ?? DEFAULT_STEP), ...patch } }));
  }
  function check(step: PStep, override?: string) {
    setState((p) => {
      const cur = p[step.id] ?? DEFAULT_STEP;
      const text = override ?? cur.text;
      const ok =
        step.kind === "number"
          ? (() => {
              const val = Number(text.replace(/[^0-9.-]/g, ""));
              return text.trim() !== "" && Number.isFinite(val) && Math.abs(val - step.answer) <= (step.tol ?? 0.005);
            })()
          : text !== "" && Number(text) === step.answer;
      return { ...p, [step.id]: { ...cur, text, ok, tries: cur.tries + 1 } };
    });
  }

  const firstOpen = prob.steps.findIndex((s) => !get(s.id).ok);
  const probDone = firstOpen === -1;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🧩 수요량 예측 단계별 문제</p>
          <span className="font-mono text-xs text-slate-300">
            완료 {doneCount} / {PROBLEMS.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PROBLEMS.map((p, i) => {
            const done = p.steps.every((s) => state[s.id]?.ok);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPIdx(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (pIdx === i
                    ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                    : done
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {done ? "✅ " : ""}
                {p.emoji} {p.title.replace("문제 ", "").replace(" · ", ". ")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-base font-bold text-slate-100">
          {prob.emoji} {prob.title}
        </p>
        <p className="mt-1.5 text-sm leading-7 text-slate-300">{prob.scenario}</p>
        {prob.tex ? <FormulaLine expr={prob.tex} className="mt-1 text-slate-100" /> : null}
        {prob.table ? (
          <div className="mt-2 overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[280px] border-collapse text-center text-xs">
              <tbody>
                <tr>
                  {prob.table.head.map((h, i) => (
                    <th
                      key={h + i}
                      className={
                        "border border-white/15 px-2 py-1.5 font-bold " +
                        (i === 0 ? "bg-sky-500/25 text-sky-50" : "bg-white/5 font-mono text-slate-200")
                      }
                    >
                      {h}
                    </th>
                  ))}
                </tr>
                {prob.table.rows.map((r) => (
                  <tr key={r[0]}>
                    {r.map((v, i) => (
                      <td
                        key={v + i}
                        className={
                          "border border-white/15 px-2 py-1.5 " +
                          (i === 0 ? "bg-sky-500/25 font-bold text-sky-50" : "font-mono text-slate-200")
                        }
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        {prob.steps.map((step, i) => {
          const ss = get(step.id);
          const locked = i > (firstOpen === -1 ? prob.steps.length - 1 : firstOpen);
          return (
            <div
              key={step.id}
              className={
                "rounded-2xl border p-4 transition " +
                (ss.ok
                  ? "border-emerald-400/40 bg-emerald-400/[0.07]"
                  : locked
                    ? "border-white/5 bg-slate-900/20 opacity-50"
                    : "border-violet-400/35 bg-violet-400/[0.06]")
              }
            >
              <div className="flex items-start gap-2">
                <span
                  className={
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                    (ss.ok ? "bg-emerald-400/25 text-emerald-100" : "bg-white/10 text-slate-300")
                  }
                >
                  {ss.ok ? "✓" : i + 1}
                </span>
                <p className="text-sm font-bold leading-6 text-slate-100">{step.ask}</p>
              </div>

              {locked ? (
                <p className="mt-2 pl-8 text-xs text-slate-500">앞 단계를 먼저 풀어 주세요 🔒</p>
              ) : (
                <div className="mt-2 pl-8">
                  {step.tex ? <FormulaLine expr={step.tex} className="text-slate-100" /> : null}

                  {step.kind === "number" ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        inputMode="text"
                        aria-label={step.ask}
                        value={ss.text}
                        disabled={ss.ok}
                        onChange={(e) => update(step.id, { text: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") check(step);
                        }}
                        placeholder="숫자만 입력"
                        className="w-40 rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-right font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 disabled:opacity-60"
                      />
                      <span className="text-sm text-slate-300">{step.suffix}</span>
                      {!ss.ok ? (
                        <button
                          type="button"
                          onClick={() => check(step)}
                          className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
                        >
                          확인
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-col gap-1.5">
                      {step.options.map((opt, oi) => {
                        const chosen = ss.text === String(oi);
                        const right = ss.ok && oi === step.answer;
                        const wrong = chosen && !ss.ok;
                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={ss.ok}
                            onClick={() => check(step, String(oi))}
                            className={
                              "rounded-lg border-2 px-3 py-2 text-left text-sm font-bold transition disabled:opacity-80 " +
                              (right
                                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                                : wrong
                                  ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                            }
                          >
                            {opt.tex ? (
                              <span className="inline-block align-middle">
                                <Katex expr={opt.tex} />
                              </span>
                            ) : (
                              opt.text
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {ss.ok ? (
                    <p className="mt-2 rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-1.5 text-xs leading-5 text-emerald-100">
                      정답이에요! ✅ {step.explain}
                    </p>
                  ) : ss.tries > 0 ? (
                    <p className="mt-2 rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-1.5 text-xs leading-5 text-amber-100">
                      아직 아니에요. {ss.tries >= 2 ? "힌트를 열어 보세요." : "부호를 빠뜨리지 않았는지 확인해 볼까요?"}
                    </p>
                  ) : null}

                  {!ss.ok ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => update(step.id, { hint: !ss.hint })}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                      >
                        💡 힌트 {ss.hint ? "닫기" : "보기"}
                      </button>
                      {ss.tries >= 3 ? (
                        <button
                          type="button"
                          onClick={() => update(step.id, { shown: true })}
                          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-400 transition hover:bg-white/10"
                        >
                          정답 보기
                        </button>
                      ) : null}
                      {ss.hint ? (
                        <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">{step.hint}</span>
                      ) : null}
                      {ss.shown ? (
                        <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">
                          정답:{" "}
                          <b className="font-mono text-emerald-200">
                            {step.kind === "number"
                              ? step.answer.toLocaleString("ko-KR") + step.suffix
                              : (step.options[step.answer].text ?? `${step.answer + 1}번`)}
                          </b>{" "}
                          — {step.explain}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {probDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🎉 문제 해결!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">{prob.wrapUp}</p>
          {pIdx < PROBLEMS.length - 1 ? (
            <button
              type="button"
              onClick={() => setPIdx(pIdx + 1)}
              className="mt-3 rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25"
            >
              다음 문제로 →
            </button>
          ) : doneCount === PROBLEMS.length ? (
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 세 문제를 모두 해결했어요! 수요 예측 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
