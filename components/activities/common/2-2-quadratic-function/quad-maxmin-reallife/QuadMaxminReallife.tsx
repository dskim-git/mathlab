"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "five_step_order",
    prompt:
      "5단계 풀이 순서(① 조건·구하려는 것 → ② 변수·범위 → ③ 관계식 → ④ 최대·최소 → ⑤ 해석)가 왜 중요한지 설명하고, 어느 단계가 가장 어려웠는지 한 시나리오를 골라 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 5단계 순서는 문제 상황을 수식으로 옮기고, 푼 결과를 다시 상황에 비추어 해석하는 흐름을 만든다. ② 변수·범위 단계가 가장 어려웠다. 채소밭 문제에서 가로를 x m 줄이므로 6 − x > 0 즉 0 < x < 6 임을 놓치기 쉬웠다.",
  },
  {
    id: "variable_range",
    prompt:
      "세 문제 모두 변수의 범위를 구해야 했습니다. 범위를 구하지 않으면 어떤 문제가 생길 수 있을까요? 한 예를 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 강아지 놀이터에서 2x + y = 24 이므로 y > 0 이려면 x < 12. 만약 x 의 범위를 무시하면 꼭짓점 x = 6 외에 음수의 x 도 ‘후보’ 로 잘못 다룰 수 있다. 채소밭이나 로켓도 마찬가지로 길이/시간이 음수가 되거나 0 이 되는 경우는 물리적으로 불가능하다.",
  },
];

// ─── 수식 유틸 ──────────────────────────────────────────────
function fmtNum(n: number, fixed?: number): string {
  if (typeof fixed === "number") return n.toFixed(fixed);
  return Math.abs(n) < 1e-10 ? "0" : n.toFixed(1);
}

// ─── 메인 ───────────────────────────────────────────────────
type TabId = 0 | 1 | 2;
const TABS: { id: TabId; emoji: string; label: string }[] = [
  { id: 0, emoji: "🐕", label: "강아지 놀이터" },
  { id: 1, emoji: "🌱", label: "채소밭 리모델링" },
  { id: 2, emoji: "🚀", label: "불꽃놀이 로켓" },
];

export default function QuadMaxminReallife() {
  const [tab, setTab] = useState<TabId>(0);
  const [done, setDone] = useState<boolean[]>(() => [false, false, false]);

  function markDone(i: TabId) {
    setDone((d) => {
      if (d[i]) return d;
      const n = [...d];
      n[i] = true;
      return n;
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🏗️ 이차함수 최대·최소 실생활 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          실생활 속 이차함수의 최대·최소 문제를 <b className="text-cyan-200">5단계 풀이 순서</b> 로
          분석하고, 시뮬레이션과 함께 빈칸을 채워 보세요.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {TABS.map((t) => {
          const active = tab === t.id;
          const isDone = done[t.id];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                "rounded-xl border-2 px-2 py-2 text-center text-sm font-bold transition " +
                (active
                  ? "border-cyan-400/60 bg-gradient-to-br from-cyan-400/15 to-violet-400/15 text-cyan-100"
                  : isDone
                  ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {t.emoji} {t.label}
              {isDone ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}>
        <Tab0Playground onDone={() => markDone(0)} />
      </div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <Tab1Garden onDone={() => markDone(1)} />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <Tab2Rocket onDone={() => markDone(2)} />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 5단계 정형 컴포넌트 ────────────────────────────────────
type FillQ = {
  kind: "fill";
  label: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  correct: number;
  tol: number;
  step?: number;
};
type MCQ = {
  kind: "mc";
  label: ReactNode;
  options: { label: ReactNode; correct: boolean; hint?: string }[];
};
type StepQuestion = FillQ | MCQ;
type StepData = {
  num: string;
  title: string;
  body: ReactNode;
  question?: StepQuestion;
  reveal?: ReactNode;
};

const STEP_TONES: Record<string, string> = {
  "①": "bg-rose-500 text-white",
  "②": "bg-orange-500 text-white",
  "③": "bg-amber-500 text-slate-900",
  "④": "bg-emerald-500 text-white",
  "⑤": "bg-sky-500 text-white",
};

function StepList({ steps, onAllDone }: { steps: StepData[]; onAllDone: () => void }) {
  const [openIdx, setOpenIdx] = useState(0);
  const [fillVals, setFillVals] = useState<Record<string, string>>({});
  const [fillOk, setFillOk] = useState<Record<string, boolean>>({});
  const [fillErr, setFillErr] = useState<Record<string, boolean>>({});
  const [mcOk, setMcOk] = useState<Record<string, boolean>>({});
  const [mcPicked, setMcPicked] = useState<Record<string, number>>({});

  function setFill(id: string, v: string) {
    setFillVals((m) => ({ ...m, [id]: v }));
  }
  function checkFill(id: string, q: FillQ) {
    const v = Number(fillVals[id] ?? "");
    if (!Number.isFinite(v)) {
      setFillErr((m) => ({ ...m, [id]: true }));
      window.setTimeout(() => setFillErr((m) => ({ ...m, [id]: false })), 600);
      return;
    }
    if (Math.abs(v - q.correct) <= q.tol) {
      setFillOk((m) => ({ ...m, [id]: true }));
    } else {
      setFillErr((m) => ({ ...m, [id]: true }));
      window.setTimeout(() => setFillErr((m) => ({ ...m, [id]: false })), 600);
    }
  }
  function pickMC(id: string, oi: number, isOk: boolean) {
    if (mcOk[id]) return;
    setMcPicked((m) => ({ ...m, [id]: oi }));
    if (isOk) setMcOk((m) => ({ ...m, [id]: true }));
  }

  const requiredIds: string[] = [];
  steps.forEach((s, i) => {
    if (s.question) requiredIds.push(`s${i}`);
  });
  const allAnswered = requiredIds.every((id) => fillOk[id] || mcOk[id]);
  useEffect(() => {
    if (allAnswered && requiredIds.length > 0) onAllDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAnswered]);

  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const id = `s${i}`;
        const open = openIdx === i;
        const q = s.question;
        const stepDone = q ? fillOk[id] || mcOk[id] : false;
        return (
          <div
            key={i}
            className={
              "rounded-xl border transition " +
              (stepDone ? "border-emerald-400/45 bg-emerald-400/5" : "border-white/10 bg-white/5")
            }
          >
            <button
              type="button"
              onClick={() => setOpenIdx(open ? -1 : i)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left"
            >
              <span className={"inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold " + (STEP_TONES[s.num] ?? "bg-slate-500")}>
                {s.num}
              </span>
              <span className="flex-1 text-sm font-bold text-slate-100">{s.title}</span>
              {stepDone ? <span className="text-emerald-300">✓</span> : null}
              <span className={"text-xs text-slate-400 transition " + (open ? "rotate-180" : "")}>▼</span>
            </button>
            {open ? (
              <div className="border-t border-white/10 px-3 py-3 text-sm leading-7 text-slate-200">
                {s.body}
                {q ? (
                  <div className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-400/5 p-3">
                    <p className="text-xs font-bold text-cyan-200">✏️ {q.label}</p>
                    {q.kind === "fill" ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {q.prefix ? <span className="font-mono text-sm">{q.prefix}</span> : null}
                        <input
                          type="number"
                          step={q.step ?? 1}
                          value={fillVals[id] ?? ""}
                          onChange={(e) => setFill(id, e.target.value)}
                          placeholder="?"
                          aria-label={q.label?.toString() ?? "답"}
                          disabled={fillOk[id]}
                          className={
                            "w-24 rounded-lg border-2 px-2 py-1 text-center font-mono text-base font-bold outline-none focus:ring-2 focus:ring-violet-300/40 disabled:opacity-90 " +
                            (fillOk[id]
                              ? "border-emerald-400 bg-emerald-400/20 text-emerald-100"
                              : fillErr[id]
                              ? "border-rose-400 bg-rose-400/20 text-rose-100"
                              : "border-violet-400/40 bg-violet-400/10 text-violet-100")
                          }
                        />
                        {q.suffix ? <span className="font-mono text-sm">{q.suffix}</span> : null}
                        <button
                          type="button"
                          onClick={() => checkFill(id, q)}
                          disabled={fillOk[id]}
                          className="rounded-lg border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
                        >
                          확인
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 grid gap-2">
                        {q.options.map((o, oi) => {
                          const isAns = o.correct;
                          const isChosen = mcPicked[id] === oi;
                          const done = mcOk[id];
                          const showCorrect = done && isAns;
                          const showWrong = !o.correct && isChosen && !done;
                          return (
                            <button
                              key={oi}
                              type="button"
                              disabled={mcOk[id]}
                              onClick={() => pickMC(id, oi, isAns)}
                              className={
                                "rounded-lg border-2 px-3 py-2 text-left text-sm font-bold transition disabled:cursor-default " +
                                (showCorrect
                                  ? "border-emerald-400 bg-emerald-400/20 text-emerald-100 ring-2 ring-emerald-300/55"
                                  : showWrong
                                  ? "border-rose-400 bg-rose-400/20 text-rose-100 ring-2 ring-rose-300/55"
                                  : "border-white/10 bg-white/5 text-slate-100 hover:border-violet-400/45 hover:bg-violet-400/10")
                              }
                            >
                              {o.label}
                              {showWrong && o.hint ? (
                                <p className="mt-1 text-xs font-normal text-rose-200">❌ {o.hint}</p>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {(q.kind === "fill" && fillOk[id]) || (q.kind === "mc" && mcOk[id]) ? (
                      <p className="mt-2 text-xs font-bold text-emerald-200">✅ 정답입니다!</p>
                    ) : null}
                    {s.reveal && ((q.kind === "fill" && fillOk[id]) || (q.kind === "mc" && mcOk[id])) ? (
                      <div className="mt-2 rounded-md bg-slate-950/60 px-3 py-2 font-mono text-sm leading-6 text-amber-100">
                        {s.reveal}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ─── 시뮬레이션 SVG: 강아지 놀이터 ──────────────────────────
function PlaygroundSim({ x }: { x: number }) {
  // x = 수직 변, y = 24 - 2x = 평행 변
  const y = 24 - 2 * x;
  const S = x * y;
  const isMax = Math.abs(x - 6) < 0.12;

  // SVG viewBox
  const W = 380;
  const H = 220;
  const maxX = 12;
  const maxY = 24;
  const sc = Math.min((W - 60) / Math.max(y, 2), (H - 80) / Math.max(x, 1)) * 0.75;
  const rW = y * sc;
  const rH = x * sc;
  const ox = (W - rW) / 2;
  const oy = 36;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-[420px]" role="img" aria-label="강아지 놀이터 시뮬레이션">
      <rect x="0" y="0" width={W} height={H} fill="#060c1a" />
      {/* 벽 */}
      <rect x={ox - 6} y={oy - 17} width={rW + 12} height={17} fill="#4a3a2a" />
      <text x={ox + rW / 2} y={oy - 5} fill="#aaa" fontSize="10" textAnchor="middle">
        🏠 건물 벽
      </text>
      {/* 놀이터 영역 */}
      <defs>
        <linearGradient id="pgFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4a1a" />
          <stop offset="100%" stopColor="#0d2e0d" />
        </linearGradient>
      </defs>
      <rect x={ox} y={oy} width={rW} height={rH} fill="url(#pgFill)" />
      {/* 철망 3면 */}
      {[
        [ox, oy, ox, oy + rH],
        [ox + rW, oy, ox + rW, oy + rH],
        [ox, oy + rH, ox + rW, oy + rH],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isMax ? "#ffd700" : "#27ae60"}
          strokeWidth="2.5"
        />
      ))}
      <text x={ox + rW * 0.45} y={oy + rH * 0.5 + 7} fontSize="18" textAnchor="middle">
        🐕
      </text>
      <text x={ox + rW * 0.72} y={oy + rH * 0.6 + 7} fontSize="18" textAnchor="middle">
        🎾
      </text>
      {/* 변 라벨 */}
      <text x={ox + rW / 2} y={oy + rH + 16} fill="#99aacc" fontSize="11" textAnchor="middle">
        y = {y.toFixed(1)} m
      </text>
      <text x={ox - 18} y={oy + rH / 2 + 4} fill="#99aacc" fontSize="11" textAnchor="middle" transform={`rotate(-90 ${ox - 18} ${oy + rH / 2 + 4})`}>
        x = {x.toFixed(1)} m
      </text>

      {/* 미니 S(x) 그래프 */}
      <g transform={`translate(${W - 92} 6)`}>
        <rect x="0" y="0" width="86" height="60" fill="rgba(8,14,28,0.9)" stroke="#2a3d6a" />
        <text x="43" y="10" fill="#446688" fontSize="8" textAnchor="middle">
          S(x)
        </text>
        <path
          d={(() => {
            const parts: string[] = [];
            for (let i = 0; i <= 60; i++) {
              const xi = 0.5 + i * (11 / 60);
              const si = xi * (24 - 2 * xi);
              const px = 2 + ((xi - 0.5) / 11) * 82;
              const py = 58 - (si / 72) * 50;
              parts.push(`${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`);
            }
            return parts.join(" ");
          })()}
          fill="none"
          stroke="#4488ff"
          strokeWidth="1.5"
        />
        <circle cx={2 + ((x - 0.5) / 11) * 82} cy={58 - (S / 72) * 50} r="3.5" fill="#ffd700" />
        {/* viewBox unused vars silenced */}
        <text x="0" y="0" fill="transparent">{maxX}{maxY}</text>
      </g>
    </svg>
  );
}

function Tab0Playground({ onDone }: { onDone: () => void }) {
  const [x, setX] = useState(6);
  const y = 24 - 2 * x;
  const S = x * y;
  const isMax = Math.abs(x - 6) < 0.12;

  const steps: StepData[] = [
    {
      num: "①",
      title: "주어진 조건과 구하려는 것을 확인한다",
      body: (
        <ul className="space-y-1">
          <li>• 총 철망 길이: <b className="text-amber-200">24 m</b></li>
          <li>• 한쪽은 건물 벽 → 철망은 <b className="text-amber-200">3 면</b> 에만 설치</li>
          <li>• 구하려는 것: 직사각형 넓이의 <b className="text-amber-200">최댓값</b></li>
        </ul>
      ),
    },
    {
      num: "②",
      title: "변수를 결정하고, 변수의 범위를 구한다",
      body: (
        <ul className="space-y-1">
          <li>• 벽에 수직인 변: <b className="text-cyan-200">x m</b>, 벽에 평행한 변: <b className="text-cyan-200">y m</b></li>
          <li>• 철망 3면의 합 = 총 철망 길이</li>
        </ul>
      ),
      question: {
        kind: "fill",
        label: <>철망의 관계식: 2x + y = ?</>,
        prefix: <>2x + y =</>,
        correct: 24,
        tol: 0.1,
      },
      reveal: <>2x + y = 24 → y = 24 − 2x, &nbsp; 범위: 0 &lt; x &lt; 12</>,
    },
    {
      num: "③",
      title: "변수 사이의 관계식을 세운다",
      body: <p>S = x · y = x(24 − 2x) 를 전개하면</p>,
      question: {
        kind: "fill",
        label: <>S = −2x² + □ x 의 □ 를 구하세요</>,
        prefix: <>S = −2x² +</>,
        suffix: <>x</>,
        correct: 24,
        tol: 0.1,
      },
      reveal: <>S = −2x² + 24x = −2(x − 6)² + 72</>,
    },
    {
      num: "④",
      title: "구하는 값을 관계식을 이용하여 찾는다",
      body: <p>S = −2(x − 6)² + 72 의 꼭짓점: (6, 72), 0 &lt; x &lt; 12 내 포함</p>,
      question: {
        kind: "mc",
        label: <>S 가 최대가 되는 x 의 값은?</>,
        options: [
          { label: "① x = 4", correct: false, hint: "x = 4 이면 S = 64." },
          { label: "② x = 6", correct: true },
          { label: "③ x = 8", correct: false, hint: "x = 8 이면 S = 64." },
          { label: "④ x = 10", correct: false, hint: "x = 10 이면 S = 40." },
        ],
      },
      reveal: <>x = 6 일 때 S 최댓값 = 72 m²</>,
    },
    {
      num: "⑤",
      title: "문제에 맞게 답을 해석한다",
      body: <p>x = 6 → y = 24 − 12 = 12 m (수직 6 m, 평행 12 m)</p>,
      question: {
        kind: "fill",
        label: <>강아지 놀이터 넓이의 최댓값은? (단위 m²)</>,
        correct: 72,
        tol: 0.5,
      },
      reveal: <>넓이 최댓값 = 72 m²</>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">🎮 시뮬레이션 — 슬라이더로 철망 배치를 바꿔 보세요!</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <PlaygroundSim x={x} />
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <p className="text-xs font-bold text-cyan-200">수직 변 x (m)</p>
              <input
                type="range"
                min={0.5}
                max={11.5}
                step={0.1}
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
                className="mt-1 w-full accent-violet-400"
                aria-label="수직 변 x"
              />
              <p className="mt-1 text-right font-mono text-sm text-cyan-200">x = {x.toFixed(1)} m</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm leading-7">
              <p>y = 24 − 2x = <b className="font-mono">{y.toFixed(1)} m</b></p>
              <p className="mt-1">
                S = xy = <b className="font-mono text-amber-200">{S.toFixed(1)} m²</b>
              </p>
              <p className={"mt-2 text-xs font-bold " + (isMax ? "text-amber-200" : "text-slate-400")}>
                {isMax ? "🏆 최댓값 달성! S = 72 m²" : "🏆 최댓값: x = 6 m 일 때 72 m²"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">🐕 상황 1. 강아지 놀이터 설계</p>
        <p className="mt-2 text-sm leading-7 text-slate-200">
          반려견 카페에서 총 <b className="text-amber-200">24 m</b> 의 철망을 사용하여 건물 벽면 한쪽을
          이용한 <b>직사각형</b> 모양의 강아지 놀이터를 만들려고 합니다. 철망은 벽과 마주 보는 방향 1
          곳과 벽에 수직인 방향 2 곳에만 사용합니다.
        </p>
        <p className="mt-2 rounded-lg border border-rose-400/35 bg-rose-400/10 p-2 text-sm font-bold text-rose-100">
          ❓ 강아지 놀이터 바닥의 넓이의 <b>최댓값</b> 을 구하시오.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">📋 5단계 풀이 — 각 단계를 클릭하고 빈칸을 채워 보세요</p>
        <div className="mt-3">
          <StepList steps={steps} onAllDone={onDone} />
        </div>
      </div>
    </div>
  );
}

// ─── 시뮬레이션 SVG: 채소밭 ───────────────────────────────
function GardenSim({ x }: { x: number }) {
  const nw = 6 - x;
  const nh = 4 + 3 * x;
  const S = nw * nh;
  const isMax = Math.abs(x - 7 / 3) < 0.08;
  const W = 380;
  const H = 220;
  const maxD = Math.max(6, nw, 4, nh);
  const sc = Math.min((W / 2 - 36) / maxD, (H - 60) / maxD) * 0.82;
  const mid = W / 2;
  const oW = 6 * sc;
  const oH = 4 * sc;
  const oX = mid - oW - 16;
  const oY = (H - oH) / 2 + 2;
  const nW2 = nw * sc;
  const nH2 = nh * sc;
  const nX = mid + 16;
  const nY = (H - nH2) / 2 + 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-[420px]" role="img" aria-label="채소밭 리모델링 시뮬레이션">
      <rect x="0" y="0" width={W} height={H} fill="#060c1a" />
      {/* 원래 채소밭 */}
      <rect x={oX} y={oY} width={oW} height={oH} fill="#1a2540" stroke="#4488ff" strokeWidth="2" />
      <text x={oX + oW / 2} y={oY - 5} fill="#88aaff" fontSize="10" textAnchor="middle">
        원래 채소밭
      </text>
      <text x={oX + oW / 2} y={oY + oH + 12} fill="#667799" fontSize="9" textAnchor="middle">
        6m × 4m = 24m²
      </text>
      <text x={oX + oW / 2} y={oY + oH / 2 + 6} fontSize="16" textAnchor="middle">
        🥕🌽
      </text>

      {/* 화살표 */}
      <text x={mid} y={H / 2 + 5} fill="#445577" fontSize="16" textAnchor="middle">
        →
      </text>

      {/* 새 채소밭 */}
      <defs>
        <linearGradient id="gFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={isMax ? "#2a4a12" : "#152a10"} />
          <stop offset="100%" stopColor={isMax ? "#1a3a08" : "#0a1e08"} />
        </linearGradient>
      </defs>
      <rect x={nX} y={nY} width={nW2} height={nH2} fill="url(#gFill)" stroke={isMax ? "#ffd700" : "#27ae60"} strokeWidth="2" />
      <text x={nX + nW2 / 2} y={nY - 5} fill={isMax ? "#ffd700" : "#aaddaa"} fontSize="10" textAnchor="middle">
        새 채소밭
      </text>
      <text x={nX + nW2 / 2} y={nY + nH2 + 12} fill={isMax ? "#ffd700" : "#889977"} fontSize="9" textAnchor="middle">
        {nw.toFixed(1)} m × {nh.toFixed(1)} m
      </text>
      <text x={nX + nW2 / 2} y={nY + nH2 + 23} fill={isMax ? "#ffd700" : "#889977"} fontSize="9" textAnchor="middle">
        = {S.toFixed(1)} m²
      </text>
      <text x={nX + nW2 / 2} y={nY + nH2 / 2 + 6} fontSize="16" textAnchor="middle">
        🥦🌿
      </text>

      {/* 미니 S(x) 그래프 */}
      <g transform={`translate(${W - 92} 6)`}>
        <rect x="0" y="0" width="86" height="60" fill="rgba(8,14,28,0.9)" stroke="#2a3d6a" />
        <text x="43" y="10" fill="#336633" fontSize="8" textAnchor="middle">
          S(x)
        </text>
        <path
          d={(() => {
            const parts: string[] = [];
            for (let i = 0; i <= 60; i++) {
              const xi = 0.1 + i * (5.8 / 60);
              const si = (6 - xi) * (4 + 3 * xi);
              const px = 2 + ((xi - 0.1) / 5.8) * 82;
              const py = 58 - (si / (121 / 3)) * 50;
              parts.push(`${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`);
            }
            return parts.join(" ");
          })()}
          fill="none"
          stroke="#27ae60"
          strokeWidth="1.5"
        />
        <circle cx={2 + ((x - 0.1) / 5.8) * 82} cy={58 - (S / (121 / 3)) * 50} r="3.5" fill="#ffd700" />
      </g>
    </svg>
  );
}

function Tab1Garden({ onDone }: { onDone: () => void }) {
  const [x, setX] = useState(2.33);
  const nw = 6 - x;
  const nh = 4 + 3 * x;
  const S = nw * nh;
  const isMax = Math.abs(x - 7 / 3) < 0.08;

  const steps: StepData[] = [
    {
      num: "①",
      title: "주어진 조건과 구하려는 것을 확인한다",
      body: (
        <ul className="space-y-1">
          <li>• 원래 채소밭: 가로 <b className="text-amber-200">6 m</b>, 세로 <b className="text-amber-200">4 m</b>, 넓이 24 m²</li>
          <li>• 가로를 x m 줄이고, 세로를 3x m 늘림</li>
          <li>• 구하려는 것: 새 채소밭 넓이의 <b className="text-amber-200">최댓값</b></li>
        </ul>
      ),
    },
    {
      num: "②",
      title: "변수를 결정하고, 변수의 범위를 구한다",
      body: <p>• 새 가로 = 6 − x &gt; 0 이어야 하므로 x &lt; 6</p>,
      question: {
        kind: "mc",
        label: <>x 의 범위로 알맞은 것은?</>,
        options: [
          { label: <>① 0 &lt; x &lt; 4</>, correct: false, hint: "가로 조건만 보면 x < 6." },
          { label: <>② 0 &lt; x &lt; 6</>, correct: true },
          { label: <>③ 0 ≤ x ≤ 6</>, correct: false, hint: "x = 6 이면 가로 = 0, 열린 구간이어야." },
          { label: <>④ 0 &lt; x &lt; 12</>, correct: false, hint: "x > 6 이면 가로가 음수." },
        ],
      },
      reveal: <>범위: 0 &lt; x &lt; 6</>,
    },
    {
      num: "③",
      title: "변수 사이의 관계식을 세운다",
      body: <p>새 넓이 S = (6 − x)(4 + 3x) = 24 + 18x − 4x − 3x²</p>,
      question: {
        kind: "fill",
        label: <>S = −3x² + □ x + 24 의 □ 를 구하세요</>,
        prefix: <>S = −3x² +</>,
        suffix: <>x + 24</>,
        correct: 14,
        tol: 0.1,
      },
      reveal: <>18x − 4x = 14x → S = −3x² + 14x + 24</>,
    },
    {
      num: "④",
      title: "구하는 값을 관계식을 이용하여 찾는다",
      body: <p>꼭짓점 x = 14 ÷ (2 × 3) ≈ 2.33 (0 &lt; x &lt; 6 내 포함)</p>,
      question: {
        kind: "fill",
        label: <>꼭짓점 x좌표를 소수로 입력하세요 (반올림 둘째자리)</>,
        prefix: <>x =</>,
        correct: 2.333,
        tol: 0.06,
        step: 0.01,
      },
      reveal: <>x = 7/3 ≈ 2.33 일 때 S 최댓값 = 121/3 ≈ 40.3 m²</>,
    },
    {
      num: "⑤",
      title: "문제에 맞게 답을 해석한다",
      body: <p>x = 7/3 일 때 새 세로 = 4 + 3 × (7/3) = 4 + 7 = ?</p>,
      question: {
        kind: "fill",
        label: <>x = 7/3 일 때 새 세로의 길이는?</>,
        prefix: <>새 세로 =</>,
        suffix: <>m</>,
        correct: 11,
        tol: 0.1,
      },
      reveal: <>새 가로 ≈ 3.67 m, 새 세로 = 11 m → 최댓값 = 121/3 ≈ 40.3 m²</>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">🎮 시뮬레이션 — 슬라이더로 채소밭 크기를 바꿔 보세요!</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <GardenSim x={x} />
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <p className="text-xs font-bold text-cyan-200">줄이는 가로 x (m)</p>
              <input
                type="range"
                min={0.1}
                max={5.9}
                step={0.05}
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
                className="mt-1 w-full accent-violet-400"
                aria-label="줄이는 가로 x"
              />
              <p className="mt-1 text-right font-mono text-sm text-cyan-200">x = {x.toFixed(2)} m</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm leading-7">
              <p>새 가로 = 6 − x = <b className="font-mono">{nw.toFixed(2)} m</b></p>
              <p>새 세로 = 4 + 3x = <b className="font-mono">{nh.toFixed(2)} m</b></p>
              <p className="mt-1">
                S = <b className="font-mono text-amber-200">{S.toFixed(2)} m²</b>
              </p>
              <p className={"mt-2 text-xs font-bold " + (isMax ? "text-amber-200" : "text-slate-400")}>
                {isMax ? "🏆 최댓값 달성! S = 121/3 ≈ 40.3 m²" : "🏆 최댓값: x = 7/3 m 일 때 121/3 ≈ 40.3 m²"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">🌱 상황 2. 채소밭 리모델링</p>
        <p className="mt-2 text-sm leading-7 text-slate-200">
          가로 <b className="text-amber-200">6 m</b>, 세로 <b className="text-amber-200">4 m</b> 인 직사각형 채소밭이
          있습니다. 가로를 <b className="text-amber-200">x m</b> 줄이고, 세로를 <b className="text-amber-200">3x m</b>{" "}
          늘려서 새로운 채소밭을 만들려고 합니다.
        </p>
        <p className="mt-2 rounded-lg border border-rose-400/35 bg-rose-400/10 p-2 text-sm font-bold text-rose-100">
          ❓ 새로운 채소밭의 넓이의 <b>최댓값</b> 을 구하시오. (단, 0 &lt; x &lt; 6)
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">📋 5단계 풀이 — 각 단계를 클릭하고 빈칸을 채워 보세요</p>
        <div className="mt-3">
          <StepList steps={steps} onAllDone={onDone} />
        </div>
      </div>
    </div>
  );
}

// ─── 시뮬레이션 SVG: 로켓 ───────────────────────────────────
function hRkt(t: number): number {
  return -5 * t * t + 14 * t + 3;
}

function RocketSim({ t, trail }: { t: number; trail: { t: number; h: number }[] }) {
  const W = 380;
  const H = 220;
  const groundY = H - 28;
  const maxH = 16;
  const scY = (groundY - 38) / maxH;
  const rX = W * 0.36;
  const h = Math.max(0, hRkt(Math.min(t, 3)));
  const rY = groundY - h * scY;
  const platY = groundY - 3 * scY;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-[420px]" role="img" aria-label="로켓 시뮬레이션">
      <rect x="0" y="0" width={W} height={H} fill="#060c1a" />
      {/* 별 */}
      {[
        [50, 14],
        [120, 30],
        [200, 10],
        [280, 26],
        [340, 7],
        [60, 46],
        [300, 42],
      ].map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r="1" fill="rgba(255,255,255,0.4)" />
      ))}
      {/* 지면 */}
      <rect x="0" y={groundY} width={W} height={H - groundY} fill="#3a2a1a" />
      <rect x="0" y={groundY - 2} width={W} height="4" fill="#5a7a3a" />
      {/* 발사대 */}
      <rect x={rX - 16} y={platY} width="32" height={3 * scY} fill="#5a5a6a" />
      <rect x={rX - 18} y={platY - 3} width="36" height="6" fill="#7a7a8a" />
      {/* y축 */}
      <line x1={W * 0.13} y1={22} x2={W * 0.13} y2={groundY} stroke="#1e3060" strokeDasharray="2 3" />
      {[0, 3, 6, 9, 12, 15].map((hm) => {
        const hy = groundY - hm * scY;
        if (hy <= 20) return null;
        return (
          <g key={hm}>
            <text x={W * 0.13 - 3} y={hy + 3} fill="#445577" fontSize="9" textAnchor="end">
              {hm} m
            </text>
            <line x1={W * 0.13} y1={hy} x2={W * 0.16} y2={hy} stroke="#1a2d40" />
          </g>
        );
      })}
      {/* 최고선 */}
      <line x1={W * 0.13} y1={groundY - 12.8 * scY} x2={W * 0.72} y2={groundY - 12.8 * scY} stroke="rgba(255,215,0,0.35)" strokeDasharray="4 3" />
      <text x={W * 0.73} y={groundY - 12.8 * scY + 3} fill="rgba(255,215,0,0.7)" fontSize="9">
        12.8 m
      </text>
      {/* 궤적 */}
      {trail.length > 1 ? (
        <>
          <path
            d={trail
              .map(
                (pt, i) =>
                  `${i === 0 ? "M" : "L"} ${rX} ${(groundY - Math.max(0, pt.h) * scY).toFixed(1)}`,
              )
              .join(" ")}
            fill="none"
            stroke="rgba(255,140,50,0.55)"
            strokeWidth="2"
          />
          {trail.map((pt, i) =>
            i % 8 === 0 ? (
              <circle
                key={i}
                cx={rX}
                cy={groundY - Math.max(0, pt.h) * scY}
                r="2"
                fill="rgba(255,200,80,0.6)"
              />
            ) : null,
          )}
        </>
      ) : null}
      {/* 불꽃 */}
      {t > 0 && t < 3.05 && h > 0.1 ? (
        <ellipse cx={rX} cy={rY + 15} rx="4" ry="11" fill="rgba(255,100,30,0.6)" />
      ) : null}
      {/* 로켓 */}
      <text x={rX} y={t >= 3.05 || h < 0.05 ? groundY - 3 : rY + 8} fontSize="20" textAnchor="middle">
        {t >= 3.05 || h < 0.05 ? "💥" : "🚀"}
      </text>
      {/* 정보 */}
      <text x={W * 0.5} y={30} fill="#99aacc" fontSize="10">
        t = {Math.min(t, 3).toFixed(2)} 초
      </text>
      <text x={W * 0.5} y={44} fill="#99aacc" fontSize="10">
        h = {Math.max(0, hRkt(Math.min(t, 3))).toFixed(2)} m
      </text>
      {/* 미니 h(t) 그래프 */}
      {trail.length > 1 ? (
        <g transform={`translate(${W - 92} 6)`}>
          <rect x="0" y="0" width="86" height="56" fill="rgba(8,14,28,0.9)" stroke="#2a3d6a" />
          <text x="43" y="10" fill="#4466aa" fontSize="8" textAnchor="middle">
            h(t)
          </text>
          <path
            d={trail
              .map(
                (pt, i) =>
                  `${i === 0 ? "M" : "L"} ${(3 + (pt.t / 3) * 80).toFixed(1)} ${(53 - (Math.max(0, pt.h) / 13) * 46).toFixed(1)}`,
              )
              .join(" ")}
            fill="none"
            stroke="#4f9cf9"
            strokeWidth="1.5"
          />
        </g>
      ) : null}
    </svg>
  );
}

function Tab2Rocket({ onDone }: { onDone: () => void }) {
  const [t, setT] = useState(0);
  const [trail, setTrail] = useState<{ t: number; h: number }[]>([]);
  const [launched, setLaunched] = useState(false);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);

  function reset() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    tRef.current = 0;
    setT(0);
    setTrail([]);
    setLaunched(false);
  }

  function step() {
    tRef.current += 0.025;
    if (tRef.current > 3.05) {
      setT(3.05);
      setLaunched(false);
      return;
    }
    const newT = tRef.current;
    const h = Math.max(0, hRkt(newT));
    setT(newT);
    setTrail((arr) => [...arr, { t: newT, h }]);
    rafRef.current = requestAnimationFrame(step);
  }

  function launch() {
    if (launched) {
      reset();
      return;
    }
    reset();
    setLaunched(true);
    tRef.current = 0;
    rafRef.current = requestAnimationFrame(step);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const steps: StepData[] = [
    {
      num: "①",
      title: "주어진 조건과 구하려는 것을 확인한다",
      body: (
        <ul className="space-y-1">
          <li>• t = 0 일 때 h = 3 (발사대 높이 3 m)</li>
          <li>• h = −5t² + at + 3 (높이 공식)</li>
          <li>• t = 3 일 때 h = 0 (3초 후 지면)</li>
          <li>• 구하려는 것: ① a 의 값 &nbsp;② 높이의 <b className="text-amber-200">최댓값</b></li>
        </ul>
      ),
    },
    {
      num: "②",
      title: "변수를 결정하고, 변수의 범위를 구한다",
      body: (
        <div className="space-y-1">
          <p>• 변수: 경과 시간 <b className="text-cyan-200">t 초</b></p>
          <p>• 발사 t = 0, 지면 t = 3</p>
          <p className="rounded-md bg-slate-950/60 px-3 py-1 font-mono text-amber-100">범위: 0 ≤ t ≤ 3</p>
        </div>
      ),
    },
    {
      num: "③",
      title: "관계식으로 상수 a 를 구한다",
      body: <p>h(3) = 0: −5(9) + 3a + 3 = 0 → −45 + 3a + 3 = 0 → 3a = 42</p>,
      question: {
        kind: "fill",
        label: <>상수 a 의 값은?</>,
        prefix: <>a =</>,
        correct: 14,
        tol: 0.1,
      },
      reveal: <>a = 14 → h = −5t² + 14t + 3</>,
    },
    {
      num: "④",
      title: "구하는 값을 관계식을 이용하여 찾는다",
      body: <p>꼭짓점 t = 14 ÷ (2 × 5) = 1.4 초 (0 ≤ t ≤ 3 내 포함)</p>,
      question: {
        kind: "fill",
        label: <>h(1.4) 를 계산하여 최대 높이를 구하세요</>,
        prefix: <>h 최댓값 =</>,
        suffix: <>m</>,
        correct: 12.8,
        tol: 0.15,
        step: 0.1,
      },
      reveal: <>−5(1.96) + 14(1.4) + 3 = −9.8 + 19.6 + 3 = 12.8 m</>,
    },
    {
      num: "⑤",
      title: "문제에 맞게 답을 해석한다",
      body: <p>(1) a = 14 &nbsp; (2) 발사 후 1.4 초에 최고 높이 도달</p>,
      question: {
        kind: "mc",
        label: <>로켓 높이의 최댓값으로 알맞은 것은?</>,
        options: [
          { label: <>① 9.8 m</>, correct: false, hint: "9.8 은 최고점이 아닙니다." },
          { label: <>② 12.8 m</>, correct: true },
          { label: <>③ 14 m</>, correct: false, hint: "14 는 a 의 값이지 높이가 아닙니다." },
          { label: <>④ 17 m</>, correct: false, hint: "17 은 잘못된 계산." },
        ],
      },
      reveal: <>로켓 높이의 최댓값 = 12.8 m (발사 후 1.4 초)</>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">🎮 시뮬레이션 — 로켓을 직접 발사해 보세요!</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <RocketSim t={t} trail={trail} />
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={launch}
                className="rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition hover:brightness-110"
              >
                {launched ? "🛑 정지" : "🚀 발사!"}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10"
              >
                🔄 초기화
              </button>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm leading-7">
              <p>
                t = <b className="font-mono">{Math.min(t, 3).toFixed(2)} 초</b>
              </p>
              <p>
                h = <b className="font-mono text-amber-200">{Math.max(0, hRkt(Math.min(t, 3))).toFixed(2)} m</b>
              </p>
              <p className="mt-1 text-xs text-slate-400">최고 높이: 발사 후 1.4 초에 12.8 m 도달</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">🚀 상황 3. 불꽃놀이 로켓 발사</p>
        <p className="mt-2 text-sm leading-7 text-slate-200">
          로켓을 지면으로부터 <b className="text-amber-200">3 m 높이</b> 발사대에서 발사합니다. 발사 후
          t 초의 높이 h m 는 <b className="text-amber-200">h = −5t² + at + 3</b> 이고, <b className="text-amber-200">3 초 후</b> 지면에
          떨어졌습니다.
        </p>
        <p className="mt-2 rounded-lg border border-rose-400/35 bg-rose-400/10 p-2 text-sm font-bold text-rose-100">
          ❓ (1) 상수 a 의 값을 구하시오. (2) 로켓 높이의 <b>최댓값</b> 을 구하시오.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-extrabold text-violet-200">📋 5단계 풀이 — 각 단계를 클릭하고 빈칸을 채워 보세요</p>
        <div className="mt-3">
          <StepList steps={steps} onAllDone={onDone} />
        </div>
      </div>
    </div>
  );
}

export { fmtNum };
