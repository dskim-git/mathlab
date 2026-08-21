"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  DRILLS,
  FEED,
  FEED_BOX,
  FEED_CORNERS,
  FEED_INEQS,
  FEED_OBJ,
  FEED_QUIZ,
  FEED_TEX,
  OP_SOLID,
  SHOP,
  SHOP_BOX,
  SHOP_CORNERS,
  SHOP_INEQS,
  SHOP_PRICE_RANGE,
  SHOP_STEPS,
  bestOf,
  kLine,
  objAt,
  regionPoly,
  won,
  type Box,
  type Ineq,
  type PStep,
  type Pt,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "model",
    prompt:
      "말로 된 상황을 부등식으로 옮기는 일을 여러 번 해 보았어요. 옮길 때 가장 헷갈렸던 곳(부등호의 방향, x와 y의 계수, 빠뜨리기 쉬운 조건 등)을 하나 골라 어떻게 해결했는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: '이상'과 '이하'에서 부등호 방향이 헷갈렸다. 예산은 넘으면 안 되니 ≤, 영양은 모자라면 안 되니 ≥ 라고 생각하니 정리가 됐다. 개수가 음수일 수 없다는 x ≥ 0, y ≥ 0 도 자꾸 빠뜨렸다.",
  },
  {
    id: "slide",
    prompt:
      "이익이나 비용을 나타내는 직선을 밀어 답을 찾았어요. 단가가 바뀌면 최선의 계획이 옮겨 가는 것도 보았는데, 왜 그런 일이 생기는지 직선의 기울기와 이어서 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 이익 직선의 기울기는 두 단가의 비로 정해진다. 단가가 바뀌면 기울기가 바뀌어서 직선을 밀 때 마지막으로 걸리는 꼭짓점이 달라진다. 기울기가 어느 변과 나란해지면 그 변 위의 계획이 모두 똑같이 좋았다.",
  },
  {
    id: "use",
    prompt:
      "선형계획법은 '한정된 것 안에서 가장 좋은 선택'을 찾는 방법이에요. 내 생활이나 학교에서 이 방법을 써 볼 만한 상황을 하나 떠올려, 무엇을 x와 y로 두고 어떤 조건이 붙을지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 시험 기간에 공부 시간을 나누는 문제. 수학을 x시간, 영어를 y시간 공부한다고 하면 하루에 쓸 수 있는 시간과 체력이 조건이 되고, 오르는 점수의 합을 가장 크게 만드는 것이 목표가 된다.",
  },
];

type Tab = "setup" | "profit" | "cost" | "drill";

export default function LinearProgrammingLab() {
  const [tab, setTab] = useState<Tab>("setup");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🏭 선형계획법 — 한정된 것 안에서 가장 좋은 선택</h3>
        <p className="mt-2 leading-7 text-slate-300">
          예산이나 재료가 정해져 있을 때 <b className="text-amber-200">이익은 가장 크게</b>,{" "}
          <b className="text-sky-200">비용은 가장 적게</b> 만드는 계획을 찾아봐요. 조건을 부등식으로 옮겨 영역을 그리고,
          그 위로 직선을 밀면 답이 보입니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "setup"} onClick={() => setTab("setup")}>① 조건을 부등식으로</TabButton>
        <TabButton active={tab === "profit"} onClick={() => setTab("profit")}>② 이익을 최대로</TabButton>
        <TabButton active={tab === "cost"} onClick={() => setTab("cost")}>③ 비용을 최소로</TabButton>
        <TabButton active={tab === "drill"} onClick={() => setTab("drill")}>④ 실전 문제</TabButton>
      </div>

      <div className="mt-4">
        {tab === "setup" ? <SetupTab /> : null}
        {tab === "profit" ? <ProfitTab /> : null}
        {tab === "cost" ? <CostTab /> : null}
        {tab === "drill" ? <DrillTab /> : null}
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

// ══════════════════════════════════════════════════════════════
//  공용 — 좌표평면
// ══════════════════════════════════════════════════════════════
const S = 360,
  ML = 30,
  MR = 18,
  MT = 18,
  MB = 30;

type Layer = { qs: Ineq[]; color: string; opacity: number };
type EdgeLine = { q: Ineq; color: string };
type Extra = { x1: number; y1: number; x2: number; y2: number; color: string; dash?: string };
type Marker = { x: number; y: number; fill: string; ring?: string; label?: string };

function Plane({
  box,
  layers = [],
  lines = [],
  extras = [],
  markers = [],
  uid,
  grid = 5,
  tick = 10,
  axisX = "x",
  axisY = "y",
}: {
  box: Box;
  layers?: Layer[];
  lines?: EdgeLine[];
  extras?: Extra[];
  markers?: Marker[];
  uid: string;
  grid?: number;
  tick?: number;
  axisX?: string;
  axisY?: string;
}) {
  const pw = S - ML - MR;
  const ph = S - MT - MB;
  const X = (v: number) => ML + ((v - box.xMin) / (box.xMax - box.xMin)) * pw;
  const Y = (v: number) => S - MB - ((v - box.yMin) / (box.yMax - box.yMin)) * ph;
  const cid = `lp-${uid}`;
  const x0 = X(0);
  const y0 = Y(0);

  const gx: number[] = [];
  for (let v = Math.ceil(box.xMin / grid) * grid; v <= box.xMax; v += grid) gx.push(v);
  const gy: number[] = [];
  for (let v = Math.ceil(box.yMin / grid) * grid; v <= box.yMax; v += grid) gy.push(v);

  const pathOf = (qs: Ineq[]) => {
    const poly = regionPoly(qs, box);
    return poly.length >= 3 ? `M ${poly.map((p) => `${X(p[0])},${Y(p[1])}`).join(" L ")} Z` : "";
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <svg viewBox={`0 0 ${S} ${S}`} className="h-auto w-full min-w-[260px]" role="img" aria-label="제약 조건이 만드는 영역">
        <defs>
          <clipPath id={cid}>
            <rect x={ML} y={MT} width={pw} height={ph} />
          </clipPath>
        </defs>
        <rect x={0} y={0} width={S} height={S} rx={10} fill="#0b1220" />

        {gx.map((v) => (
          <line key={`gx${v}`} x1={X(v)} y1={MT} x2={X(v)} y2={S - MB} stroke="rgba(148,163,184,0.10)" strokeWidth={0.7} />
        ))}
        {gy.map((v) => (
          <line key={`gy${v}`} x1={ML} y1={Y(v)} x2={S - MR} y2={Y(v)} stroke="rgba(148,163,184,0.10)" strokeWidth={0.7} />
        ))}

        <g clipPath={`url(#${cid})`}>
          {layers.map((L, i) => {
            const d = pathOf(L.qs);
            return d ? <path key={i} d={d} fill={L.color} fillOpacity={L.opacity} /> : null;
          })}
        </g>

        <line x1={ML} y1={y0} x2={S - MR} y2={y0} stroke="#94a3b8" strokeWidth={1.2} />
        <line x1={x0} y1={S - MB} x2={x0} y2={MT} stroke="#94a3b8" strokeWidth={1.2} />
        <polygon points={`${S - MR},${y0} ${S - MR - 6},${y0 - 3} ${S - MR - 6},${y0 + 3}`} fill="#94a3b8" />
        <polygon points={`${x0},${MT} ${x0 - 3},${MT + 6} ${x0 + 3},${MT + 6}`} fill="#94a3b8" />

        <g clipPath={`url(#${cid})`}>
          {lines.map((L, i) =>
            L.q.kind === "vline" ? (
              <line key={i} x1={X(L.q.c)} y1={MT} x2={X(L.q.c)} y2={S - MB} stroke={L.color} strokeWidth={2.4} strokeDasharray={OP_SOLID[L.q.op] ? undefined : "6 4"} />
            ) : (
              <line
                key={i}
                x1={X(box.xMin)}
                y1={Y(L.q.a * box.xMin + L.q.b)}
                x2={X(box.xMax)}
                y2={Y(L.q.a * box.xMax + L.q.b)}
                stroke={L.color}
                strokeWidth={2.4}
                strokeDasharray={OP_SOLID[L.q.op] ? undefined : "6 4"}
              />
            ),
          )}
          {extras.map((e, i) => (
            <line key={i} x1={X(e.x1)} y1={Y(e.y1)} x2={X(e.x2)} y2={Y(e.y2)} stroke={e.color} strokeWidth={2.6} strokeDasharray={e.dash} />
          ))}
        </g>

        {gx.filter((v) => v !== 0 && v % tick === 0).map((v) => (
          <text key={`tx${v}`} x={X(v)} y={y0 + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
            {v}
          </text>
        ))}
        {gy.filter((v) => v !== 0 && v % tick === 0).map((v) => (
          <text key={`ty${v}`} x={x0 - 6} y={Y(v)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
            {v}
          </text>
        ))}

        {markers.map((m, i) => (
          <g key={i}>
            {m.ring ? <circle cx={X(m.x)} cy={Y(m.y)} r={9} fill="none" stroke={m.ring} strokeWidth={2} /> : null}
            <circle cx={X(m.x)} cy={Y(m.y)} r={5.2} fill={m.fill} stroke="#0b1220" strokeWidth={1.4} />
            {m.label ? (
              <text
                x={Math.min(X(m.x) + 8, S - 4 - m.label.length * 5.6)}
                y={Math.max(MT + 9, Y(m.y) - 8)}
                fill={m.fill}
                fontSize={10}
                fontWeight={700}
                fontFamily="monospace"
              >
                {m.label}
              </text>
            ) : null}
          </g>
        ))}

        <text x={S - MR - 4} y={y0 + 24} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
          {axisX}
        </text>
        <text x={6} y={13} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
          {axisY}
        </text>
      </svg>
    </div>
  );
}

/** 꼭짓점 값 표 */
function CornerTable({
  corners,
  obj,
  objLabel,
  best,
  unit,
}: {
  corners: Pt[];
  obj: { a: number; b: number };
  objLabel: string;
  best: { value: number; at: Pt[] };
  unit: string;
}) {
  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <table className="w-full min-w-[280px] border-collapse text-center text-xs">
        <tbody>
          <tr>
            <th className="w-20 border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">꼭짓점</th>
            {corners.map((c, i) => (
              <td key={i} className="border border-white/15 px-2 py-1.5 font-mono text-[11px] text-violet-100">
                ({c[0]}, {c[1]})
              </td>
            ))}
          </tr>
          <tr>
            <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">{objLabel}</th>
            {corners.map((c, i) => {
              const v = objAt(obj, c[0], c[1]);
              const on = best.at.some((z) => z[0] === c[0] && z[1] === c[1]);
              return (
                <td
                  key={i}
                  className={
                    "border border-white/15 px-2 py-1.5 font-mono text-sm font-bold " +
                    (on ? "bg-amber-400/20 text-amber-100" : "text-slate-200")
                  }
                >
                  {won(v)}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      <p className="mt-1 text-center text-[10px] text-slate-500">단위 {unit}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 조건을 부등식으로
// ══════════════════════════════════════════════════════════════
function SetupTab() {
  const [ans, setAns] = useState<Record<string, string>>({});

  const okOf = (id: string) => {
    const s = SHOP_STEPS.find((z) => z.id === id);
    if (!s) return false;
    const v = ans[id];
    if (v === undefined || v === "") return false;
    if (s.kind === "choice") return Number(v) === s.answer;
    return Math.abs(Number(v.replace(/[^0-9.-]/g, "")) - s.answer) < 1e-6;
  };
  const doneCount = SHOP_STEPS.filter((s) => okOf(s.id)).length;
  const allDone = doneCount === SHOP_STEPS.length;

  const active: Ineq[] = [];
  if (okOf("wood")) active.push(SHOP_INEQS[0]);
  if (okOf("paint")) active.push(SHOP_INEQS[1]);
  if (okOf("sign")) active.push(SHOP_INEQS[2], SHOP_INEQS[3]);

  const layers: Layer[] = active.length ? [{ qs: active, color: "#a78bfa", opacity: 0.3 }] : [];
  const lines: EdgeLine[] = [];
  if (okOf("wood")) lines.push({ q: SHOP_INEQS[0], color: "#fbbf24" });
  if (okOf("paint")) lines.push({ q: SHOP_INEQS[1], color: "#38bdf8" });
  const markers: Marker[] =
    okOf("cx") && okOf("cy")
      ? SHOP_CORNERS.map((c) => ({ x: c[0], y: c[1], fill: c[0] === 30 && c[1] === 20 ? "#fbbf24" : "#c4b5fd", ring: c[0] === 30 && c[1] === 20 ? "#fde68a" : undefined, label: `(${c[0]}, ${c[1]})` }))
      : [];

  const firstOpen = SHOP_STEPS.findIndex((s) => !okOf(s.id));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">🪵 목공방에서 스툴과 선반 만들기</p>
        <p className="mt-1 text-xs leading-6 text-slate-400">
          스툴을 <b className="text-slate-200">x개</b>, 선반을 <b className="text-slate-200">y개</b> 만든다고 할 때 오늘
          쓸 수 있는 돈으로 만들 수 있는 조합을 모두 찾아봐요.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[220px] border-collapse text-center text-xs">
              <tbody>
                <tr>
                  <th className="border border-white/15 bg-slate-800 px-2 py-1.5 font-bold text-slate-200">(단위: 천원)</th>
                  <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">목재비</th>
                  <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">도색비</th>
                </tr>
                <tr>
                  <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">
                    {SHOP.x.emoji} {SHOP.x.name}
                  </th>
                  <td className="border border-white/15 px-2 py-1.5 font-mono text-sm text-slate-100">{SHOP.x.wood}</td>
                  <td className="border border-white/15 px-2 py-1.5 font-mono text-sm text-slate-100">{SHOP.x.paint}</td>
                </tr>
                <tr>
                  <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">
                    {SHOP.y.emoji} {SHOP.y.name}
                  </th>
                  <td className="border border-white/15 px-2 py-1.5 font-mono text-sm text-slate-100">{SHOP.y.wood}</td>
                  <td className="border border-white/15 px-2 py-1.5 font-mono text-sm text-slate-100">{SHOP.y.paint}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.07] px-3 py-2">
            <p className="text-[11px] font-bold text-amber-200">오늘의 예산</p>
            <p className="mt-1 text-sm font-bold text-slate-100">
              목재비 {SHOP.budget.wood}천원 · 도색비 {SHOP.budget.paint}천원
            </p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              스툴 한 개를 만들면 목재비 {SHOP.x.wood}천원과 도색비 {SHOP.x.paint}천원이 들어요. 예산을 넘길 수는 없죠.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Plane
            box={SHOP_BOX}
            layers={layers}
            lines={lines}
            markers={markers}
            uid="setup"
            axisX={`${SHOP.x.emoji} ${SHOP.x.name} x (개)`}
            axisY={`${SHOP.y.emoji} ${SHOP.y.name} y (개)`}
          />
          <div className="min-h-[46px] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            {allDone ? (
              <p className="text-[11px] leading-5 text-slate-300">
                🎉 영역이 완성됐어요! 꼭짓점은 <b className="font-mono text-violet-100">(0,0) (42,0) (30,20) (0,35)</b>{" "}
                이고, 노란 점 <b className="font-mono text-amber-200">(30, 20)</b> 에서 두 예산을 남김없이 씁니다.
              </p>
            ) : (
              <p className="text-[11px] leading-5 text-slate-400">
                오른쪽 문제를 하나씩 풀 때마다 조건이 그래프에 더해져요. ({doneCount} / {SHOP_STEPS.length})
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {SHOP_STEPS.map((s, i) => {
            const isOk = okOf(s.id);
            const locked = i > (firstOpen === -1 ? SHOP_STEPS.length - 1 : firstOpen);
            const picked = ans[s.id];
            return (
              <div
                key={s.id}
                className={
                  "rounded-2xl border p-3 transition " +
                  (isOk
                    ? "border-emerald-400/45 bg-emerald-400/[0.07]"
                    : locked
                      ? "border-white/5 bg-slate-900/20 opacity-50"
                      : "border-violet-400/35 bg-violet-400/[0.06]")
                }
              >
                <div className="flex items-start gap-2">
                  <span
                    className={
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                      (isOk ? "bg-emerald-400/25 text-emerald-100" : "bg-white/10 text-slate-300")
                    }
                  >
                    {isOk ? "✓" : i + 1}
                  </span>
                  <p className="text-sm font-bold leading-6 text-slate-100">{s.ask}</p>
                </div>

                {locked ? (
                  <p className="mt-1 pl-8 text-xs text-slate-500">앞 문제를 먼저 풀어 주세요 🔒</p>
                ) : (
                  <div className="mt-1.5 pl-8">
                    {s.kind === "choice" ? (
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {s.options.map((o, oi) => {
                          const on = picked === String(oi);
                          const right = picked !== undefined && oi === s.answer;
                          return (
                            <button
                              key={oi}
                              type="button"
                              disabled={isOk}
                              onClick={() => setAns((z) => ({ ...z, [s.id]: String(oi) }))}
                              className={
                                "rounded-lg border-2 px-2 py-1.5 text-left text-sm font-bold transition disabled:opacity-90 " +
                                (right
                                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                                  : on
                                    ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                              }
                            >
                              {o.tex ? <Katex expr={o.tex} /> : o.text}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div>
                        {s.tex ? <FormulaLine expr={s.tex} className="text-slate-100" /> : null}
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            inputMode="text"
                            aria-label={s.ask}
                            value={picked ?? ""}
                            disabled={isOk}
                            onChange={(e) => setAns((z) => ({ ...z, [s.id]: e.target.value }))}
                            placeholder="숫자만 입력"
                            className="w-36 rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-right font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-300 disabled:opacity-60"
                          />
                          <span className="text-sm text-slate-300">{s.suffix}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-1.5 min-h-[34px]">
                      {isOk ? (
                        <p className="rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-2.5 py-1 text-[11px] leading-5 text-emerald-100">
                          정답이에요! ✅ {s.explain}
                        </p>
                      ) : picked !== undefined && picked !== "" ? (
                        <p className="rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-2.5 py-1 text-[11px] leading-5 text-amber-100">
                          💡 {s.hint}
                        </p>
                      ) : (
                        <p className="px-1 text-[11px] leading-5 text-slate-500">{s.hint}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setAns({})}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 처음부터 다시
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 이익을 최대로
// ══════════════════════════════════════════════════════════════
function ProfitTab() {
  const [px, setPx] = useState(SHOP.price.x);
  const [py, setPy] = useState(SHOP.price.y);
  const [k, setK] = useState(0);
  const [inp, setInp] = useState("");
  const [graded, setGraded] = useState(false);

  const obj = { a: px, b: py };
  const best = bestOf(SHOP_CORNERS, obj, true);
  const kMax = Math.ceil((best.value + 80) / 10) * 10;
  const kk = Math.min(k, kMax);
  const meets = kk >= 0 && kk <= best.value + 1e-9;
  const onCorner = SHOP_CORNERS.some((c) => Math.abs(objAt(obj, c[0], c[1]) - kk) < 1e-9);
  const L = kLine(obj, kk, SHOP_BOX);

  const num = Number(inp.replace(/[^0-9.-]/g, ""));
  const ok = inp.trim() !== "" && Math.abs(num - best.value) < 1e-6;
  const isDefault = px === SHOP.price.x && py === SHOP.price.y;

  const markers: Marker[] = SHOP_CORNERS.map((c) => {
    const on = best.at.some((z) => z[0] === c[0] && z[1] === c[1]);
    return {
      x: c[0],
      y: c[1],
      fill: on ? "#fbbf24" : "#c4b5fd",
      ring: on ? "#fde68a" : undefined,
      label: graded && ok ? won(objAt(obj, c[0], c[1])) : undefined,
    };
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-200">💰 같은 목공방 — 이익을 가장 크게 하려면?</p>
          <span className="rounded-lg bg-black/25 px-2 py-1 text-[11px] text-slate-300">
            영역의 꼭짓점 (0,0) (42,0) (30,20) (0,35)
          </span>
        </div>
        <p className="mt-1 text-xs leading-6 text-slate-400">
          이익을 <Katex expr={`${px}x + ${py}y`} /> 라 하고 <Katex expr={`${px}x + ${py}y = k`} /> 로 놓으면 기울기가
          같은 평행한 직선이 돼요. 이 직선을 밀며 영역과 만나는 마지막 자리를 찾아봐요.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Plane
            box={SHOP_BOX}
            layers={[{ qs: SHOP_INEQS, color: "#a78bfa", opacity: 0.3 }]}
            lines={[
              { q: SHOP_INEQS[0], color: "#fbbf24" },
              { q: SHOP_INEQS[1], color: "#38bdf8" },
            ]}
            extras={[{ x1: L.x1, y1: L.y1, x2: L.x2, y2: L.y2, color: meets ? "#f472b6" : "#64748b", dash: "7 4" }]}
            markers={markers}
            uid={`profit-${px}-${py}`}
            axisX={`${SHOP.x.emoji} ${SHOP.x.name} x (개)`}
            axisY={`${SHOP.y.emoji} ${SHOP.y.name} y (개)`}
          />
          <div className="min-h-[62px]">
            {graded && ok ? (
              <CornerTable corners={SHOP_CORNERS} obj={obj} objLabel="이익" best={best} unit="천원" />
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-5 text-slate-400">
                💡 분홍 점선이 이익 직선이에요. 영역과 만나면 그 이익을 낼 수 있고, 벗어나면 낼 수 없어요.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="rounded-2xl border-2 border-pink-400/45 bg-pink-400/[0.08] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="overflow-x-auto overflow-y-hidden py-0.5 text-sm text-pink-100">
                <Katex expr={`${px}x + ${py}y = k`} />
              </span>
              <p className="font-mono text-2xl font-bold text-pink-100">k = {kk}</p>
            </div>
            <input
              type="range"
              aria-label="이익 k"
              min={0}
              max={kMax}
              step={2}
              value={kk}
              onChange={(e) => setK(Number(e.target.value))}
              className="mt-1 w-full accent-pink-400"
            />
            <p className={"mt-1 rounded-lg px-2 py-1 text-center text-xs font-bold " + (meets ? "bg-emerald-400/15 text-emerald-100" : "bg-white/5 text-slate-400")}>
              {meets
                ? onCorner
                  ? "🎯 직선이 꼭짓점에 딱 걸렸어요!"
                  : "⭕ 이만큼의 이익은 낼 수 있어요"
                : "❌ 영역을 벗어났어요 — 이만큼은 낼 수 없어요"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
            <p className="text-[11px] font-bold text-slate-400">한 개를 팔아 얻는 이익 (천원)</p>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-xs font-bold text-slate-300">
                {SHOP.x.emoji} {SHOP.x.name}
              </p>
              <p className="font-mono text-lg font-bold text-slate-100">{px}</p>
            </div>
            <input
              type="range"
              aria-label="스툴 이익"
              min={SHOP_PRICE_RANGE.x.min}
              max={SHOP_PRICE_RANGE.x.max}
              step={SHOP_PRICE_RANGE.x.step}
              value={px}
              onChange={(e) => {
                setPx(Number(e.target.value));
                setGraded(false);
              }}
              className="mt-1 w-full accent-emerald-400"
            />
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-xs font-bold text-slate-300">
                {SHOP.y.emoji} {SHOP.y.name}
              </p>
              <p className="font-mono text-lg font-bold text-slate-100">{py}</p>
            </div>
            <input
              type="range"
              aria-label="선반 이익"
              min={SHOP_PRICE_RANGE.y.min}
              max={SHOP_PRICE_RANGE.y.max}
              step={SHOP_PRICE_RANGE.y.step}
              value={py}
              onChange={(e) => {
                setPy(Number(e.target.value));
                setGraded(false);
              }}
              className="mt-1 w-full accent-sky-400"
            />
            {!isDefault ? (
              <button
                type="button"
                onClick={() => {
                  setPx(SHOP.price.x);
                  setPy(SHOP.price.y);
                  setGraded(false);
                }}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                ↩️ 처음 이익으로 ({SHOP.price.x} · {SHOP.price.y})
              </button>
            ) : null}
          </div>

          <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.06] p-3">
            <p className="text-xs font-bold text-violet-200">✍️ 지금 조건에서 얻을 수 있는 최대 이익은?</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <input
                type="text"
                inputMode="text"
                aria-label="최대 이익"
                value={inp}
                onChange={(e) => {
                  setInp(e.target.value);
                  setGraded(false);
                }}
                placeholder="숫자만"
                className={
                  "w-32 rounded-lg border-2 bg-slate-950 px-2 py-1.5 text-right font-mono text-sm outline-none transition focus:border-violet-300 " +
                  (graded ? (ok ? "border-emerald-400/70 text-emerald-100" : "border-rose-400/60 text-rose-100") : "border-white/15 text-slate-100")
                }
              />
              <span className="text-sm text-slate-300">천원</span>
              <button
                type="button"
                onClick={() => setGraded(true)}
                className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
              >
                확인
              </button>
              {graded && ok ? (
                <button
                  type="button"
                  onClick={() => setK(best.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                >
                  최대로 밀기
                </button>
              ) : null}
            </div>
            <div className="mt-1.5 min-h-[78px]">
              {graded && ok ? (
                <p className="rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-2.5 py-1.5 text-[11px] leading-5 text-emerald-100">
                  정답이에요! ✅ 최대 이익 {won(best.value)}천원은 꼭짓점{" "}
                  {best.at.map((p) => `(${p[0]}, ${p[1]})`).join(", ")} 에서 나와요.
                  {best.at.length > 1
                    ? " 두 꼭짓점의 이익이 같네요! 이럴 때는 두 점을 잇는 변 위의 모든 계획이 똑같이 좋습니다."
                    : ` ${SHOP.x.name} ${best.at[0][0]}개와 ${SHOP.y.name} ${best.at[0][1]}개를 만들면 됩니다.`}
                </p>
              ) : graded ? (
                <p className="rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-2.5 py-1.5 text-[11px] leading-5 text-amber-100">
                  아직이에요. k 손잡이를 끝까지 밀어 <b>영역을 벗어나기 직전</b>의 k를 찾아보세요. 네 꼭짓점에서의 값을
                  직접 계산해 견주어도 좋아요.
                </p>
              ) : (
                <p className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] leading-5 text-slate-400">
                  🧪 이익 손잡이를 바꾸면 직선의 <b>기울기</b>가 바뀌어요. 그러면 마지막으로 걸리는 꼭짓점도 달라진답니다.
                  여러 값으로 바꿔 가며 최선의 계획이 어떻게 옮겨 가는지 살펴보세요.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 비용을 최소로
// ══════════════════════════════════════════════════════════════
function CostTab() {
  const [k, setK] = useState(140);
  const [inp, setInp] = useState("");
  const [graded, setGraded] = useState(false);
  const [quiz, setQuiz] = useState<number | undefined>(undefined);

  const lo = bestOf(FEED_CORNERS, FEED_OBJ, false);
  const meets = k >= lo.value - 1e-9;
  const onCorner = FEED_CORNERS.some((c) => Math.abs(objAt(FEED_OBJ, c[0], c[1]) - k) < 1e-9);
  const L = kLine(FEED_OBJ, k, FEED_BOX);

  const num = Number(inp.replace(/[^0-9.-]/g, ""));
  const ok = inp.trim() !== "" && Math.abs(num - lo.value) < 1e-6;
  const q = FEED_QUIZ[0];
  const quizOk = quiz === q.answer;

  const markers: Marker[] = FEED_CORNERS.map((c) => {
    const on = lo.at.some((z) => z[0] === c[0] && z[1] === c[1]);
    return {
      x: c[0],
      y: c[1],
      fill: on ? "#38bdf8" : "#c4b5fd",
      ring: on ? "#7dd3fc" : undefined,
      label: graded && ok ? won(objAt(FEED_OBJ, c[0], c[1])) : undefined,
    };
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">🐕 반려견 사료 배합 — 비용을 가장 적게</p>
        <p className="mt-1 text-xs leading-6 text-slate-400">
          한 달에 단백질 {FEED.need.protein}g 이상, 칼슘 {FEED.need.calcium}g 이상을 먹여야 해요. 두 사료를 각각 몇 봉
          사면 가장 싸게 맞출 수 있을까요? (A 사료 x봉, B 사료 y봉)
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[240px] border-collapse text-center text-xs">
              <tbody>
                <tr>
                  <th className="border border-white/15 bg-slate-800 px-2 py-1.5 font-bold text-slate-200">한 봉에</th>
                  <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">단백질(g)</th>
                  <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">칼슘(g)</th>
                  <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">값(천원)</th>
                </tr>
                {[FEED.x, FEED.y].map((it) => (
                  <tr key={it.name}>
                    <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">
                      {it.emoji} {it.name}
                    </th>
                    <td className="border border-white/15 px-2 py-1.5 font-mono text-sm text-slate-100">{it.protein}</td>
                    <td className="border border-white/15 px-2 py-1.5 font-mono text-sm text-slate-100">{it.calcium}</td>
                    <td className="border border-white/15 px-2 py-1.5 font-mono text-sm text-amber-100">{it.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap content-start gap-1.5">
            {FEED_TEX.map((t) => (
              <span key={t} className="rounded-lg bg-black/25 px-2 py-1 text-sm text-slate-100">
                <Katex expr={t} />
              </span>
            ))}
            <p className="mt-1 w-full text-[11px] leading-5 text-slate-400">
              이번에는 <b className="text-sky-200">모자라면 안 되는</b> 조건이라 부등호가 반대예요. 영역이 오른쪽 위로
              끝없이 뻗습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Plane
            box={FEED_BOX}
            layers={[{ qs: FEED_INEQS, color: "#38bdf8", opacity: 0.24 }]}
            lines={[
              { q: FEED_INEQS[0], color: "#fbbf24" },
              { q: FEED_INEQS[1], color: "#a3e635" },
            ]}
            extras={[{ x1: L.x1, y1: L.y1, x2: L.x2, y2: L.y2, color: meets ? "#f472b6" : "#64748b", dash: "7 4" }]}
            markers={markers}
            uid="cost"
            axisX={`${FEED.x.emoji} A 사료 x (봉)`}
            axisY={`${FEED.y.emoji} B 사료 y (봉)`}
          />
          <div className="min-h-[62px]">
            {graded && ok ? (
              <CornerTable corners={FEED_CORNERS} obj={FEED_OBJ} objLabel="비용" best={lo} unit="천원" />
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-5 text-slate-400">
                💡 이번에는 직선을 <b>아래로</b> 밀어 보세요. 영역에서 떨어지기 직전이 가장 싼 값이에요.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="rounded-2xl border-2 border-pink-400/45 bg-pink-400/[0.08] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="overflow-x-auto overflow-y-hidden py-0.5 text-sm text-pink-100">
                <Katex expr={FEED_OBJ.kTex} />
              </span>
              <p className="font-mono text-2xl font-bold text-pink-100">k = {k}</p>
            </div>
            <input
              type="range"
              aria-label="비용 k"
              min={0}
              max={140}
              step={1}
              value={k}
              onChange={(e) => setK(Number(e.target.value))}
              className="mt-1 w-full accent-pink-400"
            />
            <p className={"mt-1 rounded-lg px-2 py-1 text-center text-xs font-bold " + (meets ? "bg-emerald-400/15 text-emerald-100" : "bg-white/5 text-slate-400")}>
              {meets
                ? onCorner
                  ? "🎯 직선이 꼭짓점에 딱 걸렸어요!"
                  : "⭕ 이 비용으로 조건을 맞출 수 있어요"
                : "❌ 이 비용으로는 영양을 못 채워요"}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.06] p-3">
            <p className="text-xs font-bold text-violet-200">✍️ 가장 적게 드는 비용은?</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <input
                type="text"
                inputMode="text"
                aria-label="최소 비용"
                value={inp}
                onChange={(e) => {
                  setInp(e.target.value);
                  setGraded(false);
                }}
                placeholder="숫자만"
                className={
                  "w-32 rounded-lg border-2 bg-slate-950 px-2 py-1.5 text-right font-mono text-sm outline-none transition focus:border-violet-300 " +
                  (graded ? (ok ? "border-emerald-400/70 text-emerald-100" : "border-rose-400/60 text-rose-100") : "border-white/15 text-slate-100")
                }
              />
              <span className="text-sm text-slate-300">천원</span>
              <button
                type="button"
                onClick={() => setGraded(true)}
                className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
              >
                확인
              </button>
              {graded && ok ? (
                <button
                  type="button"
                  onClick={() => setK(lo.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                >
                  최소로 밀기
                </button>
              ) : null}
            </div>
            <div className="mt-1.5 min-h-[56px]">
              {graded && ok ? (
                <p className="rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-2.5 py-1.5 text-[11px] leading-5 text-emerald-100">
                  정답이에요! ✅ 가장 적게 드는 비용은 {won(lo.value)}천원이고 꼭짓점 ({lo.at[0][0]}, {lo.at[0][1]}) 에서
                  나와요. A 사료 {lo.at[0][0]}봉, B 사료 {lo.at[0][1]}봉을 사면 단백질과 칼슘을 꼭 맞게 채웁니다.
                </p>
              ) : graded ? (
                <p className="rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-2.5 py-1.5 text-[11px] leading-5 text-amber-100">
                  아직이에요. 꼭짓점 (0,20) · (6,8) · (30,0) 세 곳의 비용을 각각 구해 견주어 보세요.
                </p>
              ) : (
                <p className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] leading-5 text-slate-400">
                  꼭짓점은 (0,20) · (6,8) · (30,0) 세 곳이에요.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
            <p className="text-sm font-bold text-slate-100">🤔 {q.ask}</p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {q.options.map((o, i) => {
                const on = quiz === i;
                const right = quiz !== undefined && i === q.answer;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={quizOk}
                    onClick={() => setQuiz(i)}
                    className={
                      "rounded-lg border-2 px-3 py-2 text-left text-xs font-bold leading-5 transition disabled:opacity-90 " +
                      (right
                        ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                        : on
                          ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    {o.text}
                  </button>
                );
              })}
            </div>
            <div className="mt-1.5 min-h-[52px]">
              {quizOk ? (
                <p className="rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-2.5 py-1.5 text-[11px] leading-5 text-emerald-100">
                  맞아요! ✅ {q.explain}
                </p>
              ) : quiz !== undefined ? (
                <p className="rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-2.5 py-1.5 text-[11px] leading-5 text-amber-100">
                  다시 생각해 볼까요? k 손잡이를 오른쪽 끝까지 밀어도 직선이 계속 영역과 만나는지 확인해 보세요.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 실전 문제
// ══════════════════════════════════════════════════════════════
function DrillTab() {
  const [di, setDi] = useState(0);
  const [state, setState] = useState<Record<string, StepState>>({});

  const d = DRILLS[di];
  const solved = d.steps.every((s) => state[s.id]?.ok);
  const doneCount = DRILLS.filter((z) => z.steps.every((s) => state[s.id]?.ok)).length;
  const best = bestOf(d.corners, d.obj, d.wantMax);
  const L = kLine(d.obj, best.value, d.box);

  const markers: Marker[] = d.corners.map((c) => {
    const on = best.at.some((z) => z[0] === c[0] && z[1] === c[1]);
    return {
      x: c[0],
      y: c[1],
      fill: solved && on ? "#fbbf24" : "#c4b5fd",
      ring: solved && on ? "#fde68a" : undefined,
      label: `(${c[0]}, ${c[1]})`,
    };
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🧩 실전 문제</p>
          <span className="font-mono text-xs text-slate-300">
            해결 {doneCount} / {DRILLS.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DRILLS.map((z, i) => {
            const okz = z.steps.every((s) => state[s.id]?.ok);
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setDi(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (di === i
                    ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                    : okz
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {okz ? "✅ " : ""}
                {z.emoji} {z.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-base font-bold text-slate-100">
          {d.emoji} {d.title}
        </p>
        <p className="mt-1.5 text-sm leading-7 text-slate-300">{d.scenario}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[240px] border-collapse text-center text-xs">
              <tbody>
                <tr>
                  {d.tableHead.map((h, i) => (
                    <th
                      key={h}
                      className={
                        "border border-white/15 px-2 py-1.5 font-bold " +
                        (i === 0 ? "bg-slate-800 text-slate-200" : "bg-blue-600/70 text-white")
                      }
                    >
                      {h}
                    </th>
                  ))}
                </tr>
                {d.tableRows.map((r) => (
                  <tr key={r.name}>
                    <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">
                      {r.emoji} {r.name}
                    </th>
                    {r.cells.map((c, i) => (
                      <td key={i} className="border border-white/15 px-2 py-1.5 font-mono text-sm text-slate-100">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.07] px-3 py-2">
            <p className="text-[11px] leading-5 text-amber-100">{d.budgetNote}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {d.texList.map((t) => (
                <span key={t} className="rounded-lg bg-black/25 px-2 py-1 text-sm text-slate-100">
                  <Katex expr={t} />
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-300">
              {d.objLabel} = <Katex expr={d.obj.tex} /> (천원) 을 {d.wantMax ? "가장 크게" : "가장 적게"} 만들어 봐요.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-2">
          <Plane
            box={d.box}
            layers={[{ qs: d.ineqs, color: "#a78bfa", opacity: 0.3 }]}
            lines={d.ineqs.slice(0, 2).map((q, i) => ({ q, color: i === 0 ? "#fbbf24" : "#38bdf8" }))}
            extras={solved ? [{ x1: L.x1, y1: L.y1, x2: L.x2, y2: L.y2, color: "#f472b6", dash: "7 4" }] : []}
            markers={markers}
            uid={`drill-${d.id}`}
            grid={d.box.xMax > 40 ? 5 : 3}
            tick={d.box.xMax > 40 ? 10 : 6}
            axisX="x"
            axisY="y"
          />
          <div className="min-h-[62px]">
            {solved ? (
              <CornerTable corners={d.corners} obj={d.obj} objLabel={d.objLabel} best={best} unit="천원" />
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-5 text-slate-400">
                💡 보라색이 조건을 모두 만족하는 영역이에요. 꼭짓점의 좌표를 확인하며 문제를 풀어 보세요.
              </p>
            )}
          </div>
        </div>

        <StepList steps={d.steps} state={state} setState={setState} />
      </div>

      {solved ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🎉 해결!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">{d.wrapUp}</p>
          {di < DRILLS.length - 1 ? (
            <button
              type="button"
              onClick={() => setDi(di + 1)}
              className="mt-3 rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25"
            >
              다음 문제로 →
            </button>
          ) : doneCount === DRILLS.length ? (
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 세 문제를 모두 해결했어요! 선형계획법 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
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
                      className="w-36 rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-right font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 disabled:opacity-60"
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
                    아직 아니에요. {ss.tries >= 2 ? "힌트를 열어 보세요." : "그래프와 표를 다시 살펴볼까요?"}
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
