"use client";

import { useEffect, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  BREAD,
  BREAD_VIEW,
  CLASSIFY,
  DATA_NOTE,
  ERAS,
  EXPLORES,
  HISTORY,
  HIST_VIEW,
  ITEMS,
  MONEY_STEPS,
  PRESETS,
  PRICE_RANGE,
  PRICE_START,
  Q2_FN,
  Q2_LABELS,
  Q2_SHIFT,
  Q2_VIEW,
  SCENARIOS,
  SHIFT_RANGE,
  TYPES,
  WALLET,
  demandAt,
  demandTex,
  doubleYears,
  eqOf,
  eqTex,
  fmt,
  grow,
  shrink,
  supplyAt,
  supplyTex,
  won,
  type Era,
  type Fn,
  type PStep,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "shift",
    prompt:
      "수요곡선과 공급곡선을 위아래로 움직여 보았어요. 물가가 오르는 두 가지 길(수요가 늘어서 · 생산비가 올라서)이 균형거래량에서는 어떻게 달랐는지 그래프를 떠올려 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 수요가 늘어서 오를 때는 값과 거래량이 함께 늘었는데, 생산비가 올라서 오를 때는 값은 오르고 거래량은 줄었다. 그래서 뒤쪽이 더 걱정스러운 물가 상승이라고 생각한다.",
  },
  {
    id: "money",
    prompt:
      "물가 상승률과 기간을 바꿔 가며 같은 돈으로 살 수 있는 양이 줄어드는 것을 보았어요. 물가가 오를 때 내 돈의 가치를 지키려면 무엇을 할 수 있을지 자기 생각을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 물가가 해마다 5%씩 오르면 10년 뒤 1만원은 6천원어치밖에 안 된다. 금고에 그냥 두는 것보다 이자율이 물가 상승률보다 높은 곳에 넣어 두어야 손해가 줄 것 같다.",
  },
  {
    id: "history",
    prompt:
      "인플레이션 · 디플레이션 · 스태그플레이션 가운데 가장 대처하기 어려워 보이는 것을 하나 고르고, 역사 자료의 수치를 근거로 그 까닭을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 스태그플레이션이 가장 어려울 것 같다. 1980년 우리나라는 물가가 28.7% 올랐는데 성장률은 -1.6%였다. 물가를 잡으려고 금리를 올리면 경기가 더 나빠지니 어느 쪽도 손대기 어렵기 때문이다.",
  },
];

type Tab = "shift" | "quiz" | "money" | "history";

export default function InflationLab() {
  const [tab, setTab] = useState<Tab>("shift");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🎈 인플레이션과 균형가격</h3>
        <p className="mt-2 leading-7 text-slate-300">
          물가가 오른다는 것은 <b className="text-amber-200">균형가격이 올라간다</b>는 말이에요. 곡선을 손잡이로 움직여
          값이 왜 오르는지 눈으로 보고, 내 돈의 힘이 어떻게 줄어드는지 계산해 본 뒤, 실제 역사에서 무슨 일이 있었는지
          자료로 확인해 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "shift"} onClick={() => setTab("shift")}>① 곡선을 움직여 보자</TabButton>
        <TabButton active={tab === "quiz"} onClick={() => setTab("quiz")}>② 무슨 일이 생겼을까</TabButton>
        <TabButton active={tab === "money"} onClick={() => setTab("money")}>③ 내 돈의 힘</TabButton>
        <TabButton active={tab === "history"} onClick={() => setTab("history")}>④ 역사 속 물가</TabButton>
      </div>

      <div className="mt-4">
        {tab === "shift" ? <ShiftTab /> : null}
        {tab === "quiz" ? <QuizTab /> : null}
        {tab === "money" ? <MoneyTab /> : null}
        {tab === "history" ? <HistoryTab /> : null}
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

const D_COLOR = "#f472b6";
const S_COLOR = "#34d399";
const E_COLOR = "#fbbf24";

// ══════════════════════════════════════════════════════════════
//  공용 — 시장 그래프
// ══════════════════════════════════════════════════════════════
const W = 430,
  H = 330,
  PL = 54,
  PR = 24,
  PT = 34,
  PB = 42;

function Arrow({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 10) return null;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hx = x2 - Math.cos(ang) * 9;
  const hy = y2 - Math.sin(ang) * 9;
  const wing = (o: number) => `${hx + Math.cos(ang + o) * 4.6},${hy + Math.sin(ang + o) * 4.6}`;
  return (
    <g>
      <line x1={x1} y1={y1} x2={hx} y2={hy} stroke={color} strokeWidth={2} strokeDasharray="5 3" strokeOpacity={0.9} />
      <polygon points={`${x2},${y2} ${wing(Math.PI / 2)} ${wing(-Math.PI / 2)}`} fill={color} />
    </g>
  );
}

function MarketChart({
  f,
  k,
  m,
  xMax,
  qTop,
  uid,
}: {
  f: Fn;
  k: number;
  m: number;
  xMax: number;
  qTop: number;
  uid: string;
}) {
  const X = (v: number) => PL + (v / xMax) * (W - PL - PR);
  const Y = (v: number) => H - PB - (v / qTop) * (H - PT - PB);
  const seg = (fn: (x: number) => number) => `${X(0)},${Y(fn(0))} ${X(xMax)},${Y(fn(xMax))}`;

  const e0 = eqOf(f, 0, 0);
  const e = eqOf(f, k, m);
  const moved = Math.abs(e.x - e0.x) > 0.001 || Math.abs(e.q - e0.q) > 0.001;
  const cid = `inf-clip-${uid}`;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <div className="overflow-x-auto overflow-y-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[320px]"
          role="img"
          aria-label="수요곡선과 공급곡선, 그리고 균형점"
        >
          <defs>
            <clipPath id={cid}>
              <rect x={PL} y={PT} width={W - PL - PR} height={H - PT - PB} />
            </clipPath>
          </defs>
          <rect x={0} y={0} width={W} height={H} rx={10} fill="#0b1220" />

          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <g key={`y${r}`}>
              <line x1={PL} y1={Y(r * qTop)} x2={W - PR} y2={Y(r * qTop)} stroke="rgba(148,163,184,0.11)" strokeWidth={0.8} />
              <text x={PL - 6} y={Y(r * qTop)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                {Math.round(r * qTop)}
              </text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <g key={`x${r}`}>
              <line x1={X(r * xMax)} y1={PT} x2={X(r * xMax)} y2={H - PB} stroke="rgba(148,163,184,0.1)" strokeWidth={0.8} />
              <text x={X(r * xMax)} y={H - PB + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                {Math.round(r * xMax)}
              </text>
            </g>
          ))}

          <g clipPath={`url(#${cid})`}>
            {Math.abs(k) > 0.001 ? (
              <polyline points={seg((x) => demandAt(f, x, 0))} fill="none" stroke={D_COLOR} strokeWidth={1.6} strokeDasharray="6 4" strokeOpacity={0.45} />
            ) : null}
            {Math.abs(m) > 0.001 ? (
              <polyline points={seg((x) => supplyAt(f, x, 0))} fill="none" stroke={S_COLOR} strokeWidth={1.6} strokeDasharray="6 4" strokeOpacity={0.45} />
            ) : null}
            <polyline points={seg((x) => demandAt(f, x, k))} fill="none" stroke={D_COLOR} strokeWidth={3} />
            <polyline points={seg((x) => supplyAt(f, x, m))} fill="none" stroke={S_COLOR} strokeWidth={3} />
          </g>

          {/* 균형점 — clip 밖에 그려 잘리지 않게 */}
          {moved ? (
            <g>
              <circle cx={X(e0.x)} cy={Y(e0.q)} r={4} fill="#94a3b8" fillOpacity={0.55} />
              <Arrow x1={X(e0.x)} y1={Y(e0.q)} x2={X(e.x)} y2={Y(e.q)} color={E_COLOR} />
            </g>
          ) : null}
          <line x1={X(e.x)} y1={Y(e.q)} x2={X(e.x)} y2={H - PB} stroke={E_COLOR} strokeWidth={1.1} strokeDasharray="4 3" opacity={0.8} />
          <line x1={PL} y1={Y(e.q)} x2={X(e.x)} y2={Y(e.q)} stroke={E_COLOR} strokeWidth={1.1} strokeDasharray="4 3" opacity={0.8} />
          <circle cx={X(e.x)} cy={Y(e.q)} r={6.5} fill="#fff" />
          <circle cx={X(e.x)} cy={Y(e.q)} r={3.6} fill={E_COLOR} />
          <text x={Math.min(X(e.x) + 9, W - PR - 62)} y={Math.max(PT + 10, Y(e.q) - 9)} fill="#fcd34d" fontSize={10.5} fontWeight={700}>
            ({fmt(e.x, 1)}, {fmt(e.q, 1)})
          </text>

          <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke="#94a3b8" strokeWidth={1.2} />
          <text x={W - PR} y={H - PB + 32} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            가격 x
          </text>
          <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            수량 Q
          </text>
          <text x={W - PR - 4} y={Math.max(PT + 12, Y(demandAt(f, xMax * 0.88, k)) - 8)} textAnchor="end" fill={D_COLOR} fontSize={11} fontWeight={700}>
            수요
          </text>
          <text x={W - PR - 4} y={Math.max(PT + 12, Y(supplyAt(f, xMax * 0.72, m)) - 8)} textAnchor="end" fill={S_COLOR} fontSize={11} fontWeight={700}>
            공급
          </text>
        </svg>
      </div>
    </div>
  );
}

/** 균형 변화 요약 칸 — 늘 같은 높이를 차지한다 */
function EqSummary({ f, k, m }: { f: Fn; k: number; m: number }) {
  const e0 = eqOf(f, 0, 0);
  const e = eqOf(f, k, m);
  const dx = e.x - e0.x;
  const dq = e.q - e0.q;
  const cell = (title: string, from: number, to: number, d: number, up: string, down: string) => (
    <div className="rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-center">
      <p className="text-[10px] text-slate-400">{title}</p>
      <p className="font-mono text-sm font-bold text-slate-100">
        {fmt(from, 0)} <span className="text-slate-500">→</span> {fmt(to, 0)}
      </p>
      <p className={"text-[11px] font-bold " + (d > 0 ? up : d < 0 ? down : "text-slate-500")}>
        {d === 0 ? "그대로" : d > 0 ? `▲ ${fmt(d, 0)}` : `▼ ${fmt(-d, 0)}`}
      </p>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-2">
      {cell("균형가격 (물가)", e0.x, e.x, dx, "text-rose-300", "text-sky-300")}
      {cell("균형거래량", e0.q, e.q, dq, "text-emerald-300", "text-amber-300")}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 곡선을 움직여 보자
// ══════════════════════════════════════════════════════════════
function ShiftTab() {
  const f = BREAD;
  const [k, setK] = useState(0);
  const [m, setM] = useState(0);
  const [pick, setPick] = useState<Record<string, Record<string, number>>>({});
  const [graded, setGraded] = useState<Record<string, boolean>>({});

  const e = eqOf(f, k, m);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">🍞 식빵 시장에서 물가가 오르는 두 가지 길</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          가로축은 <b className="text-slate-200">가격</b>, 세로축은 <b className="text-slate-200">수량</b>이에요. 두
          곡선이 만나는 곳이 균형점입니다. 손잡이를 움직여 곡선을 위아래로 옮겨 보세요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRESETS.map((p) => {
          const on = p.k === k && p.m === m;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setK(p.k);
                setM(p.m);
              }}
              className={
                "rounded-xl border-2 p-2.5 text-left transition " +
                (on ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5 hover:bg-white/10")
              }
            >
              <p className="text-xs font-bold text-slate-100">
                {p.emoji} {p.name}
              </p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-400">{p.note}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <MarketChart f={f} k={k} m={m} xMax={BREAD_VIEW.xMax} qTop={BREAD_VIEW.qTop} uid="shift" />

        <div className="space-y-2">
          <div className="rounded-xl border p-3" style={{ borderColor: "rgba(244,114,182,0.4)", background: "rgba(244,114,182,0.06)" }}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-bold" style={{ color: D_COLOR }}>
                🙋 수요곡선 올리기 · 내리기
              </p>
              <p className="font-mono text-sm font-bold text-pink-100">{k > 0 ? `+${k}` : k}</p>
            </div>
            <input
              type="range"
              aria-label="수요곡선 이동"
              min={SHIFT_RANGE.min}
              max={SHIFT_RANGE.max}
              step={SHIFT_RANGE.step}
              value={k}
              onChange={(ev) => setK(Number(ev.target.value))}
              className="mt-1 w-full accent-pink-400"
            />
            <div className="overflow-x-auto overflow-y-hidden py-0.5 text-center text-slate-100">
              <Katex expr={demandTex(f, k)} />
            </div>
            <p className="text-center text-[10px] text-slate-400">
              {k > 0 ? "사려는 사람이 늘었어요" : k < 0 ? "사려는 사람이 줄었어요" : "평소 그대로"}
            </p>
          </div>

          <div className="rounded-xl border p-3" style={{ borderColor: "rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.06)" }}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-bold" style={{ color: S_COLOR }}>
                🏭 공급곡선 올리기 · 내리기
              </p>
              <p className="font-mono text-sm font-bold text-emerald-100">{m > 0 ? `+${m}` : m}</p>
            </div>
            <input
              type="range"
              aria-label="공급곡선 이동"
              min={SHIFT_RANGE.min}
              max={SHIFT_RANGE.max}
              step={SHIFT_RANGE.step}
              value={m}
              onChange={(ev) => setM(Number(ev.target.value))}
              className="mt-1 w-full accent-emerald-400"
            />
            <div className="overflow-x-auto overflow-y-hidden py-0.5 text-center text-slate-100">
              <Katex expr={supplyTex(f, m)} />
            </div>
            <p className="text-center text-[10px] text-slate-400">
              {m > 0 ? "만들기 쉬워졌어요" : m < 0 ? "만드는 비용이 올랐어요" : "평소 그대로"}
            </p>
          </div>

          <div className="rounded-2xl border-2 border-white/15 bg-slate-900/60 p-3">
            <p className="text-[11px] font-bold text-slate-400">🎯 균형점 자동 계산</p>
            <div className="overflow-x-auto overflow-y-hidden py-0.5 text-center text-slate-200">
              <Katex expr={eqTex(f, k, m)} />
            </div>
            <p className="mb-1.5 text-center font-mono text-lg font-bold text-amber-100">
              ({fmt(e.x, 0)}, {fmt(e.q, 0)})
            </p>
            <EqSummary f={f} k={k} m={m} />
          </div>

          <button
            type="button"
            onClick={() => {
              setK(0);
              setM(0);
            }}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 처음으로
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.06] px-4 py-3">
        <p className="text-[11px] leading-5 text-sky-100">
          🧭 <b>가로축이 가격이라는 점에 주의!</b> 경제 책에서 흔히 보는 그림은 가로축이 수량이라 곡선이 좌우로
          움직이지만, 이 활동은 수업 시간과 같이 가로축이 가격이라 같은 사건이 <b>위·아래 이동</b>으로 나타나요.
        </p>
      </div>

      {EXPLORES.map((q) => {
        const chosen = pick[q.id] ?? {};
        const done = graded[q.id] === true;
        const allPicked = q.blanks.every((b) => chosen[b.id] !== undefined);
        const allRight = q.blanks.every((b) => chosen[b.id] === b.answer);
        return (
          <div
            key={q.id}
            className={
              "rounded-2xl border p-4 transition " +
              (done && allRight ? "border-emerald-400/45 bg-emerald-400/[0.08]" : "border-violet-400/30 bg-violet-400/[0.06]")
            }
          >
            <p className="text-sm font-bold text-slate-100">
              {q.emoji} {q.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{q.story}</p>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-slate-200">
              {q.blanks.map((b) => (
                <span key={b.id} className="inline-flex items-center gap-1.5">
                  <span>{b.lead}</span>
                  <span className="inline-flex gap-1">
                    {b.options.map((opt, oi) => {
                      const on = chosen[b.id] === oi;
                      const right = done && oi === b.answer;
                      const wrong = done && on && oi !== b.answer;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setPick((p) => ({ ...p, [q.id]: { ...(p[q.id] ?? {}), [b.id]: oi } }));
                            setGraded((p) => ({ ...p, [q.id]: false }));
                          }}
                          className={
                            "rounded-lg border-2 px-2 py-0.5 text-xs font-bold transition " +
                            (right
                              ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                              : wrong
                                ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                                : on
                                  ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                          }
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </span>
                  <span>{b.tail}</span>
                </span>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!allPicked}
                onClick={() => setGraded((p) => ({ ...p, [q.id]: true }))}
                className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25 disabled:opacity-40"
              >
                확인
              </button>
              <button
                type="button"
                onClick={() => {
                  setK(q.k);
                  setM(q.m);
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                📈 위 그래프로 확인하기
              </button>
              {!allPicked ? <span className="text-[11px] text-slate-500">빈칸을 모두 골라 주세요</span> : null}
            </div>

            <div className="mt-2 min-h-[52px]">
              {done && allRight ? (
                <p className="rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-2 text-xs leading-5 text-emerald-100">
                  정답이에요! ✅ {q.explain}
                </p>
              ) : done ? (
                <p className="rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-2 text-xs leading-5 text-amber-100">
                  초록색으로 표시된 것이 정답이에요. 위 그래프에서 곡선을 직접 옮겨 확인해 볼까요?
                </p>
              ) : (
                <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-slate-400">
                  💡 같은 값에서 사려는 양(또는 내놓을 양)이 늘었는지 줄었는지 먼저 생각해 보세요.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 무슨 일이 생겼을까
// ══════════════════════════════════════════════════════════════
type PickKey = "curve" | "dir" | "price" | "qty";
const PICK_ORDER: { key: PickKey; ask: string }[] = [
  { key: "curve", ask: "어느 곡선이 움직일까요?" },
  { key: "dir", ask: "어느 쪽으로 움직일까요?" },
  { key: "price", ask: "균형가격(물가)은?" },
  { key: "qty", ask: "균형거래량은?" },
];

function QuizTab() {
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Record<string, Partial<Record<PickKey, number>>>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [anim, setAnim] = useState(0);

  const s = SCENARIOS[idx];
  const cur = picks[s.id] ?? {};
  const filled = PICK_ORDER.every((p) => cur[p.key] !== undefined);
  const solved = PICK_ORDER.every((p) => cur[p.key] === s[p.key]);
  const done = checked[s.id] === true && solved;
  const doneCount = SCENARIOS.filter((z) => {
    const c = picks[z.id] ?? {};
    return checked[z.id] === true && PICK_ORDER.every((p) => c[p.key] === z[p.key]);
  }).length;

  const targetK = s.curve === 0 ? (s.dir === 0 ? Q2_SHIFT : -Q2_SHIFT) : 0;
  const targetM = s.curve === 1 ? (s.dir === 0 ? Q2_SHIFT : -Q2_SHIFT) : 0;

  useEffect(() => {
    if (!done) return;
    let a = 0;
    const t = setInterval(() => {
      a = Math.min(1, a + 0.06);
      setAnim(a);
      if (a >= 1) clearInterval(t);
    }, 22);
    return () => clearInterval(t);
  }, [done]);

  const go = (n: number) => {
    setIdx(n);
    setAnim(0);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🔮 사건을 읽고 균형이 어디로 갈지 예측해 봐요</p>
          <span className="font-mono text-xs text-slate-300">
            해결 {doneCount} / {SCENARIOS.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SCENARIOS.map((z, i) => {
            const c = picks[z.id] ?? {};
            const okz = checked[z.id] === true && PICK_ORDER.every((p) => c[p.key] === z[p.key]);
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => go(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (idx === i
                    ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                    : okz
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {okz ? "✅ " : ""}
                {z.emoji} {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-base font-bold text-slate-100">
              {s.emoji} {s.title}
            </p>
            <p className="mt-1.5 text-sm leading-7 text-slate-300">{s.story}</p>
          </div>

          {PICK_ORDER.map((p) => {
            const opts = Q2_LABELS[p.key];
            return (
              <div key={p.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                <p className="text-[11px] font-bold text-slate-400">{p.ask}</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {opts.map((opt, oi) => {
                    const on = cur[p.key] === oi;
                    const right = done && oi === s[p.key];
                    const wrong = checked[s.id] === true && on && oi !== s[p.key];
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={done}
                        onClick={() => {
                          setPicks((z) => ({ ...z, [s.id]: { ...(z[s.id] ?? {}), [p.key]: oi } }));
                          setChecked((z) => ({ ...z, [s.id]: false }));
                          setAnim(0);
                        }}
                        className={
                          "rounded-lg border-2 px-2 py-1.5 text-sm font-bold transition disabled:opacity-90 " +
                          (right
                            ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                            : wrong
                              ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                              : on
                                ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                                : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                        }
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!filled || done}
              onClick={() => setChecked((z) => ({ ...z, [s.id]: true }))}
              className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25 disabled:opacity-40"
            >
              결과 확인
            </button>
            {!filled ? <span className="text-[11px] text-slate-500">네 가지를 모두 골라 주세요</span> : null}
            {idx < SCENARIOS.length - 1 ? (
              <button
                type="button"
                onClick={() => go(idx + 1)}
                className="ml-auto rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                다음 사건 →
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <MarketChart
            f={Q2_FN}
            k={done ? targetK * anim : 0}
            m={done ? targetM * anim : 0}
            xMax={Q2_VIEW.xMax}
            qTop={Q2_VIEW.qTop}
            uid="quiz"
          />
          <EqSummary f={Q2_FN} k={done ? targetK * anim : 0} m={done ? targetM * anim : 0} />
          <div className="min-h-[122px]">
            {done ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-100">🎉 정답!</span>
                  <span className={"rounded-lg border px-2.5 py-1 text-xs font-bold " + s.badgeClass}>{s.badge}</span>
                </div>
                <p className="rounded-xl border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-2 text-xs leading-5 text-emerald-100">
                  {s.explain}
                </p>
              </div>
            ) : checked[s.id] === true ? (
              <p className="rounded-xl border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-2 text-xs leading-5 text-amber-100">
                아직이에요. 빨간색으로 표시된 것을 다시 골라 볼까요? <br />
                <b>같은 값에서 사려는 양</b>이 달라졌다면 수요곡선, <b>같은 값에 내놓을 양</b>이 달라졌다면
                공급곡선이 움직입니다.
              </p>
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-slate-400">
                💡 네 가지를 모두 고르고 <b>결과 확인</b>을 누르면 곡선이 실제로 움직이는 모습을 보여 줄게요.
              </p>
            )}
          </div>
        </div>
      </div>

      {doneCount === SCENARIOS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🏅 여섯 사건을 모두 맞혔어요!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">
            물가가 오르는 길은 두 가지였어요. <b className="text-rose-200">수요곡선이 위로</b> 올라가면 값과 거래량이
            함께 늘고, <b className="text-amber-200">공급곡선이 아래로</b> 내려가면 값은 오르지만 거래량은 줄어듭니다.
            뒤쪽이 오래 이어지는 것이 바로 다음 탭에서 만날 스태그플레이션이에요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 내 돈의 힘
// ══════════════════════════════════════════════════════════════
function MoneyTab() {
  const [r, setR] = useState(PRICE_START.r);
  const [n, setN] = useState(PRICE_START.n);
  const [state, setState] = useState<Record<string, StepState>>({});

  const idx = grow(100, r, n);
  const power = shrink(WALLET, r, n);
  const dbl = doubleYears(r);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">💵 물가가 오르면 같은 돈으로 살 수 있는 양은 줄어들어요</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          물가가 해마다 <b className="text-amber-200">r %</b>씩 오른다면 n년 뒤의 값과 돈의 힘은 다음과 같아요.
        </p>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-3 py-2">
            <p className="text-[11px] font-bold text-rose-200">n년 뒤의 물가지수</p>
            <FormulaLine expr="100(1 + r)^n" className="text-slate-100" />
          </div>
          <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2">
            <p className="text-[11px] font-bold text-sky-200">지금 돈 A의 n년 뒤 실질 가치</p>
            <FormulaLine expr="\dfrac{A}{(1 + r)^n}" className="text-slate-100" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <div className="rounded-2xl border-2 border-amber-400/45 bg-amber-400/[0.08] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-bold text-amber-200">📈 해마다 오르는 물가 상승률</p>
              <p className="font-mono text-xl font-bold text-amber-100">{fmt(r, 1)}%</p>
            </div>
            <input
              type="range"
              aria-label="물가 상승률"
              min={PRICE_RANGE.r.min}
              max={PRICE_RANGE.r.max}
              step={PRICE_RANGE.r.step}
              value={r}
              onChange={(ev) => setR(Number(ev.target.value))}
              className="mt-1 w-full accent-amber-400"
            />
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p className="text-xs font-bold text-slate-300">⏳ 지난 햇수</p>
              <p className="font-mono text-xl font-bold text-slate-100">{n}년</p>
            </div>
            <input
              type="range"
              aria-label="지난 햇수"
              min={PRICE_RANGE.n.min}
              max={PRICE_RANGE.n.max}
              step={PRICE_RANGE.n.step}
              value={n}
              onChange={(ev) => setN(Number(ev.target.value))}
              className="mt-1 w-full accent-sky-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ITEMS.map((it) => (
              <div key={it.id} className="rounded-xl border border-white/10 bg-black/25 px-2 py-2 text-center">
                <p className="text-lg">{it.emoji}</p>
                <p className="text-[10px] text-slate-400">{it.name}</p>
                <p className="font-mono text-[11px] text-slate-500">{won(it.price)}</p>
                <p className="font-mono text-sm font-bold text-rose-200">{won(grow(it.price, r, n))}원</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border-2 border-sky-400/40 bg-sky-400/[0.07] p-3">
            <p className="text-xs font-bold text-sky-200">💰 지금 1만원의 {n}년 뒤 힘</p>
            <div className="mt-1.5 h-6 w-full overflow-hidden rounded-lg bg-black/35">
              <div
                className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-sky-500/70 to-sky-300/70 px-2 font-mono text-[11px] font-bold text-slate-900 transition-all"
                style={{ width: `${Math.max(6, (power / WALLET) * 100)}%` }}
              >
                {won(power)}원
              </div>
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-300">
              액수는 그대로 1만원이지만 살 수 있는 양은 <b className="text-sky-200">{fmt((power / WALLET) * 100, 1)}%</b>로
              줄었어요. 물가지수는 100에서 <b className="text-rose-200">{fmt(idx, 1)}</b>이 되었습니다.
            </p>
            <p className="mt-1 rounded-lg bg-black/25 px-2 py-1 text-[11px] text-slate-300">
              ⏱️ 72의 법칙 — 이 속도라면 물가가 두 배가 되는 데 약{" "}
              <b className="font-mono text-amber-200">{fmt(dbl, 1)}년</b> (실제로는{" "}
              <span className="font-mono">{fmt(Math.log(2) / Math.log(1 + r / 100), 1)}년</span>)
            </p>
          </div>
        </div>

        <IndexChart r={r} n={n} />
      </div>

      <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.06] p-4">
        <p className="text-sm font-bold text-violet-200">🧮 계산해 볼까요</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          물가가 오르면 <b className="text-slate-200">돈의 액수</b>가 아니라 <b className="text-slate-200">그 돈으로 살
          수 있는 양</b>을 따져야 해요.
        </p>
      </div>

      <StepList steps={MONEY_STEPS} state={state} setState={setState} />
    </div>
  );
}

function IndexChart({ r, n }: { r: number; n: number }) {
  const IW = 430,
    IH = 300,
    IL = 50,
    IR = 22,
    IT = 34,
    IB = 40;
  const top = Math.max(200, Math.ceil(grow(100, r, n) / 100) * 100);
  const X = (t: number) => IL + (t / n) * (IW - IL - IR);
  const Y = (v: number) => IH - IB - (v / top) * (IH - IT - IB);
  const years = Array.from({ length: n + 1 }, (_, t) => t);
  const up = years.map((t) => `${X(t)},${Y(grow(100, r, t))}`).join(" ");
  const down = years.map((t) => `${X(t)},${Y(shrink(100, r, t))}`).join(" ");
  const xTicks = Array.from({ length: 5 }, (_, i) => Math.round((n * i) / 4));

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <div className="overflow-x-auto overflow-y-hidden">
        <svg viewBox={`0 0 ${IW} ${IH}`} className="h-auto w-full min-w-[320px]" role="img" aria-label="물가지수와 화폐가치지수의 변화">
          <rect x={0} y={0} width={IW} height={IH} rx={10} fill="#0b1220" />
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={IL} y1={Y(f * top)} x2={IW - IR} y2={Y(f * top)} stroke="rgba(148,163,184,0.11)" strokeWidth={0.8} />
              <text x={IL - 6} y={Y(f * top)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                {Math.round(f * top)}
              </text>
            </g>
          ))}
          {xTicks.map((t, i) => (
            <text key={i} x={X(t)} y={IH - IB + 14} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
              {t}
            </text>
          ))}

          {top >= 200 ? (
            <g>
              <line x1={IL} y1={Y(200)} x2={IW - IR} y2={Y(200)} stroke="#a78bfa" strokeWidth={1} strokeDasharray="5 4" opacity={0.6} />
              <text
                x={IW - IR - 4}
                y={Y(200) - 5 < IT + 14 ? Y(200) + 13 : Y(200) - 5}
                textAnchor="end"
                fill="#c4b5fd"
                fontSize={9}
                fontWeight={700}
              >
                값이 두 배
              </text>
            </g>
          ) : null}

          <polyline points={up} fill="none" stroke="#fb7185" strokeWidth={3} />
          <polyline points={down} fill="none" stroke="#38bdf8" strokeWidth={3} />
          <circle cx={X(n)} cy={Y(grow(100, r, n))} r={4.5} fill="#fb7185" />
          <circle cx={X(n)} cy={Y(shrink(100, r, n))} r={4.5} fill="#38bdf8" />
          <text x={X(n) - 6} y={Math.max(IT + 10, Y(grow(100, r, n)) - 8)} textAnchor="end" fill="#fda4af" fontSize={10.5} fontWeight={700}>
            {fmt(grow(100, r, n), 1)}
          </text>
          <text x={X(n) - 6} y={Y(shrink(100, r, n)) + 16} textAnchor="end" fill="#7dd3fc" fontSize={10.5} fontWeight={700}>
            {fmt(shrink(100, r, n), 1)}
          </text>

          <line x1={IL} y1={IH - IB} x2={IW - IR} y2={IH - IB} stroke="#94a3b8" strokeWidth={1.2} />
          <line x1={IL} y1={IT} x2={IL} y2={IH - IB} stroke="#94a3b8" strokeWidth={1.2} />
          <text x={IW - IR} y={IH - IB + 32} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            지난 햇수 (년)
          </text>
          <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            지수 (처음 = 100)
          </text>
          <text x={IW - IR - 62} y={16} textAnchor="end" fill="#fda4af" fontSize={10} fontWeight={700}>
            ● 물가
          </text>
          <text x={IW - IR} y={16} textAnchor="end" fill="#7dd3fc" fontSize={10} fontWeight={700}>
            ● 돈의 가치
          </text>
        </svg>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 역사 속 물가
// ══════════════════════════════════════════════════════════════
function HistoryTab() {
  const [type, setType] = useState<string | null>(null);
  const [spot, setSpot] = useState<string | null>(null);
  const [era, setEra] = useState(0);
  const [ans, setAns] = useState<Record<string, number>>({});

  const point = HISTORY.find((h) => h.id === spot) ?? null;
  const score = CLASSIFY.filter((c) => ans[c.id] === c.answer).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {TYPES.map((t) => {
          const on = type === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(on ? null : t.id)}
              className={"rounded-2xl border-2 p-3 text-left transition " + (on ? t.ring : "border-white/10 bg-white/5 hover:bg-white/10")}
            >
              <p className="text-sm font-bold text-slate-100">
                {t.emoji} {t.name}
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-300">{t.sub}</p>
              <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
                <b className="text-slate-300">까닭</b> {t.cause}
              </p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
                <b className="text-slate-300">영향</b> {t.effect}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <HistChart type={type} spot={spot} onPick={(id) => setSpot(id === spot ? null : id)} />
          <p className="text-center text-[11px] text-slate-500">점을 눌러 보세요 · 유형 카드를 누르면 해당 구역이 밝아져요</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="min-h-[248px]">
            {point ? (
              <div>
                <p className="text-sm font-bold text-slate-100">
                  {point.flag} {point.place} {point.year}년 · {point.head}
                </p>
                <div className="mt-2 space-y-1.5">
                  <MiniBar label="소비자물가 상승률" value={point.i} max={9} color="#fb7185" />
                  <MiniBar label="실질 경제성장률" value={point.g} max={9} color="#38bdf8" />
                </div>
                <p className="mt-2 text-xs leading-6 text-slate-300">{point.note}</p>
                <p className="mt-2 text-[11px] text-slate-400">
                  물가는{" "}
                  <b className={point.i > 0 ? "text-rose-200" : "text-sky-200"}>{point.i > 0 ? "올랐고" : "내렸고"}</b>,
                  경제는{" "}
                  <b className={point.g > 0 ? "text-emerald-200" : "text-amber-200"}>
                    {point.g > 0 ? "자랐어요" : "뒷걸음쳤어요"}
                  </b>
                  .
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-3xl">📊</p>
                <p className="mt-2 text-sm font-bold text-slate-300">가로축은 경제성장률, 세로축은 물가 상승률</p>
                <p className="mt-1 max-w-xs text-xs leading-6 text-slate-400">
                  두 값을 함께 보면 그해가 어떤 상황이었는지 한눈에 알 수 있어요. 왼쪽 위로 갈수록 물가는 오르고 경제는
                  뒷걸음친 <b className="text-violet-200">스태그플레이션</b>, 아래쪽은 물가가 내린{" "}
                  <b className="text-sky-200">디플레이션</b>입니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">🕰️ 특별한 세 장면</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ERAS.map((e, i) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEra(i)}
              className={
                "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                (era === i ? "border-amber-400/60 bg-amber-400/15 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {e.emoji} {e.title}
            </button>
          ))}
        </div>
        <EraPanel era={ERAS[era]} />
      </div>

      <div className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🧠 어떤 상황일까요?</p>
          <span className="font-mono text-xs text-slate-300">
            {score} / {CLASSIFY.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">설명을 읽고 세 가지 가운데 하나를 골라 보세요.</p>
      </div>

      <div className="space-y-2">
        {CLASSIFY.map((c) => {
          const picked = ans[c.id];
          const right = picked === c.answer;
          return (
            <div
              key={c.id}
              className={
                "rounded-2xl border p-3.5 transition " +
                (picked === undefined
                  ? "border-white/10 bg-white/[0.03]"
                  : right
                    ? "border-emerald-400/45 bg-emerald-400/[0.08]"
                    : "border-rose-400/40 bg-rose-400/[0.07]")
              }
            >
              <p className="text-sm leading-6 text-slate-200">
                {c.emoji} {c.text}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {TYPES.map((t, ti) => {
                  const on = picked === ti;
                  const isAns = picked !== undefined && ti === c.answer;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAns((p) => ({ ...p, [c.id]: ti }))}
                      className={
                        "rounded-lg border-2 px-2 py-1.5 text-xs font-bold transition " +
                        (isAns
                          ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                          : on
                            ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                            : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                      }
                    >
                      {t.emoji} {t.name}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1.5 min-h-[38px]">
                {picked !== undefined ? (
                  <p
                    className={
                      "rounded-lg border-l-4 px-3 py-1.5 text-xs leading-5 " +
                      (right ? "border-emerald-400 bg-emerald-400/[0.08] text-emerald-100" : "border-amber-400 bg-amber-400/[0.08] text-amber-100")
                    }
                  >
                    {right ? "정답이에요! ✅ " : "초록색이 정답이에요. "}
                    {c.explain}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {score === CLASSIFY.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🎓 여섯 문제를 모두 맞혔어요!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">
            물가는 <b className="text-rose-200">너무 빨리 올라도</b>, <b className="text-sky-200">거꾸로 내려도</b>{" "}
            곤란해요. 그래서 여러 나라의 중앙은행은 해마다 2%쯤 완만하게 오르는 상태를 목표로 삼습니다.
          </p>
        </div>
      ) : null}

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] leading-5 text-slate-400">
        {DATA_NOTE}
      </p>
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const half = 50;
  const w = Math.min(half, (Math.abs(value) / max) * half);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] text-slate-400">{label}</span>
        <span className="font-mono text-xs font-bold" style={{ color }}>
          {value > 0 ? "+" : ""}
          {fmt(value, 1)}%
        </span>
      </div>
      <div className="relative mt-0.5 h-3 w-full rounded bg-black/35">
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/25" />
        <div
          className="absolute inset-y-0 rounded"
          style={{
            background: color,
            opacity: 0.75,
            left: value >= 0 ? "50%" : `${half - w}%`,
            width: `${w}%`,
          }}
        />
      </div>
    </div>
  );
}

const HW = 400,
  HH = 290,
  HL = 52,
  HR = 26,
  HT = 34,
  HB = 42;

function HistChart({ type, spot, onPick }: { type: string | null; spot: string | null; onPick: (id: string) => void }) {
  const V = HIST_VIEW;
  const X = (g: number) => HL + ((g - V.gMin) / (V.gMax - V.gMin)) * (HW - HL - HR);
  const Y = (i: number) => HH - HB - ((i - V.iMin) / (V.iMax - V.iMin)) * (HH - HT - HB);
  const x0 = X(0);
  const y0 = Y(0);
  const dim = (id: string) => (type === null ? 1 : type === id ? 1 : 0.22);

  const gTicks = [-6, -3, 0, 3];
  const iTicks = [-3, 0, 3, 6, 9];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <div className="overflow-x-auto overflow-y-hidden">
        <svg viewBox={`0 0 ${HW} ${HH}`} className="h-auto w-full min-w-[320px]" role="img" aria-label="경제성장률과 물가 상승률 사분면">
          <rect x={0} y={0} width={HW} height={HH} rx={10} fill="#0b1220" />

          {/* 사분면 바탕 */}
          <rect x={HL} y={HT} width={x0 - HL} height={y0 - HT} fill="#c084fc" opacity={0.13 * dim("stag")} />
          <rect x={x0} y={HT} width={HW - HR - x0} height={y0 - HT} fill="#fb7185" opacity={0.11 * dim("inflation")} />
          <rect x={HL} y={y0} width={HW - HR - HL} height={HH - HB - y0} fill="#38bdf8" opacity={0.12 * dim("deflation")} />

          {gTicks.map((g) => (
            <g key={`g${g}`}>
              <line x1={X(g)} y1={HT} x2={X(g)} y2={HH - HB} stroke="rgba(148,163,184,0.1)" strokeWidth={0.8} />
              <text x={X(g)} y={HH - HB + 14} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                {g}
              </text>
            </g>
          ))}
          {iTicks.map((i) => (
            <g key={`i${i}`}>
              <line x1={HL} y1={Y(i)} x2={HW - HR} y2={Y(i)} stroke="rgba(148,163,184,0.1)" strokeWidth={0.8} />
              <text x={HL - 6} y={Y(i)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                {i}
              </text>
            </g>
          ))}

          {/* 0 기준선 */}
          <line x1={x0} y1={HT} x2={x0} y2={HH - HB} stroke="#94a3b8" strokeWidth={1.4} opacity={0.75} />
          <line x1={HL} y1={y0} x2={HW - HR} y2={y0} stroke="#94a3b8" strokeWidth={1.4} opacity={0.75} />

          <text x={HL + 5} y={HT + 13} fill="#d8b4fe" fontSize={9.5} fontWeight={700} opacity={dim("stag")}>
            스태그플레이션
          </text>
          <text x={HW - HR - 5} y={HT + 13} textAnchor="end" fill="#fda4af" fontSize={9.5} fontWeight={700} opacity={dim("inflation")}>
            물가 상승
          </text>
          <text x={HW - HR - 5} y={HH - HB - 6} textAnchor="end" fill="#7dd3fc" fontSize={9.5} fontWeight={700} opacity={dim("deflation")}>
            디플레이션
          </text>

          {HISTORY.map((p) => {
            const on = spot === p.id;
            const o = type === null ? 1 : p.type === type ? 1 : 0.2;
            const t = TYPES.find((z) => z.id === p.type);
            return (
              <g key={p.id} opacity={o} className="cursor-pointer" onClick={() => onPick(p.id)}>
                <circle cx={X(p.g)} cy={Y(p.i)} r={on ? 8 : 6} fill={t ? t.dot : "#94a3b8"} stroke="#0b1220" strokeWidth={1.5} />
                {on ? <circle cx={X(p.g)} cy={Y(p.i)} r={12} fill="none" stroke="#fbbf24" strokeWidth={2} /> : null}
                <text
                  x={X(p.g) + 9}
                  y={Y(p.i) + 3.5}
                  fill={on ? "#fcd34d" : "#cbd5e1"}
                  fontSize={9}
                  fontWeight={700}
                  fontFamily="monospace"
                >
                  {p.year}
                </text>
              </g>
            );
          })}

          <text x={HW - HR} y={HH - HB + 32} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            실질 경제성장률 (%)
          </text>
          <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
            소비자물가 상승률 (%)
          </text>
        </svg>
      </div>
    </div>
  );
}

function EraPanel({ era }: { era: Era }) {
  const t = TYPES.find((z) => z.id === era.type);
  const maxLog = Math.max(...era.bars.map((b) => Math.log10(b.value)));
  const maxAbs = Math.max(...era.bars.map((b) => Math.abs(b.value)));
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-slate-100">
          {era.emoji} {era.title}
        </p>
        <span className="rounded-lg bg-white/10 px-2 py-0.5 font-mono text-[11px] text-slate-300">{era.when}</span>
        {t ? <span className={"rounded-lg px-2 py-0.5 text-[11px] font-bold " + t.chip}>{t.emoji} {t.name}</span> : null}
      </div>
      <p className="mt-1.5 text-sm leading-6 text-slate-300">{era.lead}</p>

      <div className="mt-2 space-y-1.5 rounded-xl border border-white/10 bg-black/25 p-3">
        {era.bars.map((b) => {
          const w = era.logScale
            ? (Math.log10(b.value) / maxLog) * 100
            : (Math.abs(b.value) / maxAbs) * 100;
          const neg = !era.logScale && b.value < 0;
          return (
            <div key={b.label} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-[10px] text-slate-400">{b.label}</span>
              <span className="h-4 flex-1 overflow-hidden rounded bg-white/5">
                <span
                  className="block h-full rounded"
                  style={{
                    width: `${Math.max(2, w)}%`,
                    background: neg ? "#38bdf8" : era.logScale ? "#fb7185" : "#f472b6",
                    opacity: 0.8,
                  }}
                />
              </span>
              <span className="w-24 shrink-0 text-right font-mono text-[11px] font-bold text-slate-100">
                {era.logScale ? won(b.value) : `${b.value > 0 ? "+" : ""}${fmt(b.value, 1)}`}
                <span className="ml-0.5 text-[9px] text-slate-500">{era.barUnit}</span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] leading-5 text-slate-400">{era.tail}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  단계별 문제 공용
// ══════════════════════════════════════════════════════════════
type StepState = { text: string; ok: boolean; tries: number; hint: boolean; shown: boolean };
const DEFAULT_STEP: StepState = { text: "", ok: false, tries: 0, hint: false, shown: false };

function StepList({
  steps,
  state,
  setState,
}: {
  steps: PStep[];
  state: Record<string, StepState>;
  setState: React.Dispatch<React.SetStateAction<Record<string, StepState>>>;
}) {
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
  const firstOpen = steps.findIndex((s) => !get(s.id).ok);

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const ss = get(step.id);
        const locked = i > (firstOpen === -1 ? steps.length - 1 : firstOpen);
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
                    아직 아니에요. {ss.tries >= 2 ? "힌트를 열어 보세요." : "식을 다시 살펴볼까요?"}
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
                    {ss.hint ? <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">{step.hint}</span> : null}
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
  );
}
