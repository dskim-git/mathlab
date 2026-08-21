"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  BOX6,
  CORNER_NAMES,
  EDGE_LABELS,
  HUNTS,
  OBJECTIVES,
  OPT_BOX,
  OPT_RAW_TEX,
  OPT_REGION,
  OP_SOLID,
  SIDE_LABELS,
  SYSTEMS,
  TABLE_PROBS,
  argMaxIdx,
  argMinIdx,
  fmt,
  isUpper,
  kLine,
  objAt,
  objRange,
  regionPoly,
  satisfiesAll,
  tableValues,
  type Box,
  type Ineq,
  type Obj,
  type Pt,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "overlap",
    prompt:
      "부등식을 하나씩 더할 때마다 영역이 어떻게 달라졌는지 떠올려 보세요. 연립부등식의 영역을 찾는 순서를 자기 말로 정리해 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 부등식마다 y에 대하여 정리해 위·아래를 정하고 등호로 실선인지 점선인지 정한 다음, 그렇게 얻은 영역들이 모두 겹치는 부분만 남긴다. 부등식이 늘어날수록 영역은 좁아졌다.",
  },
  {
    id: "slide",
    prompt:
      "직선 f(x, y) = k 를 밀며 최댓값과 최솟값을 찾아보았어요. 왜 최댓값과 최솟값이 하필 꼭짓점에서 나오는지, 그리고 직선을 미는 것이 무엇을 뜻하는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: k를 바꾸면 기울기가 같은 평행한 직선이 위아래로 밀린다. 영역과 만나는 동안만 그 k가 가능한 값이고, 더 이상 밀 수 없는 마지막 순간에 직선이 꼭짓점에 딱 걸린다. 그래서 꼭짓점만 확인하면 된다.",
  },
  {
    id: "table",
    prompt:
      "영역의 꼭짓점에서만 값을 구해 최댓값과 최솟값을 찾아보았어요. 왜 영역 안의 수많은 점을 하나하나 확인하지 않아도 되는지, 그리고 꼭짓점을 하나 빠뜨리면 어떤 일이 생길지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 직선을 밀 때 마지막으로 걸리는 자리가 늘 꼭짓점이라 꼭짓점만 확인하면 된다. 꼭짓점을 빠뜨리면 거기서 더 큰(작은) 값이 나올 수 있어서 답이 틀리게 된다.",
  },
];

type Tab = "sys" | "opt" | "hunt" | "table";

export default function SystemRegionLab() {
  const [tab, setTab] = useState<Tab>("sys");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🧩 연립부등식의 영역과 최대·최소</h3>
        <p className="mt-2 leading-7 text-slate-300">
          부등식을 하나씩 겹쳐 <b className="text-violet-200">공통부분</b>을 만들고, 그 위로 직선을 밀어{" "}
          <b className="text-amber-200">최댓값과 최솟값</b>이 왜 <b className="text-emerald-200">꼭짓점</b>에서 나오는지
          알아본 뒤, 꼭짓점을 찾아 표로 견주는 것까지 해 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "sys"} onClick={() => setTab("sys")}>① 하나씩 겹쳐 보기</TabButton>
        <TabButton active={tab === "opt"} onClick={() => setTab("opt")}>② 직선을 밀어라</TabButton>
        <TabButton active={tab === "hunt"} onClick={() => setTab("hunt")}>③ 꼭짓점 사냥</TabButton>
        <TabButton active={tab === "table"} onClick={() => setTab("table")}>④ 꼭짓점 표로 풀기</TabButton>
      </div>

      <div className="mt-4">
        {tab === "sys" ? <SysTab /> : null}
        {tab === "opt" ? <OptTab /> : null}
        {tab === "hunt" ? <HuntTab /> : null}
        {tab === "table" ? <TableTab /> : null}
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

const AREA_COLORS = ["#fb7185", "#38bdf8", "#fbbf24", "#a3e635"];

function Plane({
  box,
  layers = [],
  lines = [],
  extras = [],
  markers = [],
  onPick,
  uid,
  tick = 1,
}: {
  box: Box;
  layers?: Layer[];
  lines?: EdgeLine[];
  extras?: Extra[];
  markers?: Marker[];
  onPick?: (x: number, y: number) => void;
  uid: string;
  tick?: number;
}) {
  const pw = S - ML - MR;
  const ph = S - MT - MB;
  const X = (v: number) => ML + ((v - box.xMin) / (box.xMax - box.xMin)) * pw;
  const Y = (v: number) => S - MB - ((v - box.yMin) / (box.yMax - box.yMin)) * ph;
  const cid = `sr-${uid}`;
  const x0 = X(0);
  const y0 = Y(0);

  const gx: number[] = [];
  for (let v = Math.ceil(box.xMin); v <= box.xMax; v++) gx.push(v);
  const gy: number[] = [];
  for (let v = Math.ceil(box.yMin); v <= box.yMax; v++) gy.push(v);

  const handle = onPick
    ? (ev: React.MouseEvent<SVGSVGElement>) => {
        const r = ev.currentTarget.getBoundingClientRect();
        const px = ((ev.clientX - r.left) / r.width) * S;
        const py = ((ev.clientY - r.top) / r.height) * S;
        const mx = Math.round(box.xMin + ((px - ML) / pw) * (box.xMax - box.xMin));
        const my = Math.round(box.yMin + ((S - MB - py) / ph) * (box.yMax - box.yMin));
        if (mx < box.xMin || mx > box.xMax || my < box.yMin || my > box.yMax) return;
        onPick(mx, my);
      }
    : undefined;

  const pathOf = (qs: Ineq[]) => {
    const poly = regionPoly(qs, box);
    return poly.length >= 3 ? `M ${poly.map((p) => `${X(p[0])},${Y(p[1])}`).join(" L ")} Z` : "";
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
      <svg
        viewBox={`0 0 ${S} ${S}`}
        className={"h-auto w-full min-w-[260px] " + (onPick ? "cursor-crosshair" : "")}
        role="img"
        aria-label="연립부등식의 영역을 나타낸 좌표평면"
        onClick={handle}
      >
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
                x={Math.min(X(m.x) + 8, S - 4 - m.label.length * 5.5)}
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

        <text x={S - MR - 4} y={y0 - 7} textAnchor="end" fill="#cbd5e1" fontSize={11} fontWeight={700} fontStyle="italic">
          x
        </text>
        <text x={x0 + 8} y={MT + 10} textAnchor="start" fill="#cbd5e1" fontSize={11} fontWeight={700} fontStyle="italic">
          y
        </text>
      </svg>
    </div>
  );
}

function CornerList({ poly, color = "text-violet-100" }: { poly: Pt[]; color?: string }) {
  return (
    <span className={"font-mono text-sm font-bold " + color}>
      {poly.map((p) => `(${fmt(p[0], 1)}, ${fmt(p[1], 1)})`).join("  ")}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ① 하나씩 겹쳐 보기
// ══════════════════════════════════════════════════════════════
type SysAns = { side?: number; edge?: number };

function SysTab() {
  const [si, setSi] = useState(0);
  const [ans, setAns] = useState<Record<string, SysAns>>({});

  const sys = SYSTEMS[si];
  const doneOf = (id: string, q: Ineq) => {
    const a = ans[id] ?? {};
    return a.side === (isUpper(q) ? 0 : 1) && a.edge === (OP_SOLID[q.op] ? 0 : 1);
  };
  const solved = sys.items.filter((it) => doneOf(it.id, it.q));
  const allDone = solved.length === sys.items.length;
  const poly = regionPoly(sys.items.map((it) => it.q), BOX6);
  const clearCount = SYSTEMS.filter((s) => s.items.every((it) => doneOf(it.id, it.q))).length;

  const layers: Layer[] = solved.map((it) => ({
    qs: [it.q],
    color: AREA_COLORS[sys.items.findIndex((z) => z.id === it.id) % AREA_COLORS.length],
    opacity: allDone ? 0.07 : 0.14,
  }));
  if (allDone) layers.push({ qs: sys.items.map((it) => it.q), color: "#a78bfa", opacity: 0.34 });

  const lines: EdgeLine[] = solved.map((it) => ({
    q: it.q,
    color: AREA_COLORS[sys.items.findIndex((z) => z.id === it.id) % AREA_COLORS.length],
  }));

  const markers: Marker[] = allDone ? poly.map((p) => ({ x: p[0], y: p[1], fill: "#c4b5fd", label: `(${p[0]}, ${p[1]})` })) : [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🧩 부등식을 하나씩 풀어 영역을 겹쳐 봐요</p>
          <span className="font-mono text-xs text-slate-300">
            완성 {clearCount} / {SYSTEMS.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SYSTEMS.map((s, i) => {
            const okz = s.items.every((it) => doneOf(it.id, it.q));
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSi(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (si === i
                    ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                    : okz
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {okz ? "✅ " : ""}
                {s.emoji} {s.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Plane box={BOX6} layers={layers} lines={lines} markers={markers} uid={`sys-${sys.id}`} tick={2} />
          <div className="min-h-[46px] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            {allDone ? (
              <p className="text-[11px] leading-5 text-slate-300">
                🎉 세 영역이 모두 겹치는 <b className="text-violet-200">{sys.shape}</b> 이 남았어요. 꼭짓점은{" "}
                <CornerList poly={poly} />
                입니다.
              </p>
            ) : (
              <p className="text-[11px] leading-5 text-slate-400">
                오른쪽에서 부등식을 하나씩 풀 때마다 그 영역이 색으로 나타나요. 셋이 모두 겹치는 부분이 답입니다.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {sys.items.map((it, i) => {
            const a = ans[it.id] ?? {};
            const sideAns = isUpper(it.q) ? 0 : 1;
            const edgeAns = OP_SOLID[it.q.op] ? 0 : 1;
            const done = doneOf(it.id, it.q);
            const labels = SIDE_LABELS[it.q.kind];
            const color = AREA_COLORS[i % AREA_COLORS.length];
            return (
              <div
                key={it.id}
                className={"rounded-2xl border-2 p-3 transition " + (done ? "border-emerald-400/45 bg-emerald-400/[0.07]" : "border-white/10 bg-white/[0.03]")}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
                  <span className="overflow-x-auto overflow-y-hidden py-0.5 text-base text-slate-100">
                    <Katex expr={it.rawTex} />
                  </span>
                  {done && it.solvedTex ? (
                    <span className="text-slate-400">
                      <span className="mr-1 text-[11px]">→</span>
                      <Katex expr={it.solvedTex} />
                    </span>
                  ) : null}
                  {done ? <span className="ml-auto text-sm text-emerald-300">✓</span> : null}
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500">어느 쪽 영역?</p>
                    <div className="mt-0.5 grid grid-cols-2 gap-1.5">
                      {labels.map((lb, oi) => {
                        const on = a.side === oi;
                        const right = a.side !== undefined && oi === sideAns;
                        return (
                          <button
                            key={lb}
                            type="button"
                            onClick={() => setAns((p) => ({ ...p, [it.id]: { ...(p[it.id] ?? {}), side: oi } }))}
                            className={
                              "rounded-lg border-2 px-2 py-1 text-xs font-bold transition " +
                              (right
                                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                                : on
                                  ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                            }
                          >
                            {lb}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500">경계선은?</p>
                    <div className="mt-0.5 grid grid-cols-2 gap-1.5">
                      {EDGE_LABELS.map((lb, oi) => {
                        const on = a.edge === oi;
                        const right = a.edge !== undefined && oi === edgeAns;
                        return (
                          <button
                            key={lb}
                            type="button"
                            onClick={() => setAns((p) => ({ ...p, [it.id]: { ...(p[it.id] ?? {}), edge: oi } }))}
                            className={
                              "rounded-lg border-2 px-2 py-1 text-xs font-bold transition " +
                              (right
                                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                                : on
                                  ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                            }
                          >
                            <svg width="18" height="6" className="mr-1 inline-block align-middle" aria-hidden="true">
                              <line x1="1" y1="3" x2="17" y2="3" stroke="currentColor" strokeWidth="2.2" strokeDasharray={oi === 0 ? undefined : "4 3"} />
                            </svg>
                            {lb}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-1.5 min-h-[34px]">
                  {done ? (
                    <p className="rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-2.5 py-1 text-[11px] leading-5 text-emerald-100">
                      {it.tip}
                    </p>
                  ) : a.side !== undefined || a.edge !== undefined ? (
                    <p className="rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-2.5 py-1 text-[11px] leading-5 text-amber-100">
                      빨간 칸을 다시 골라 보세요. 먼저 <b>y만 남기도록 정리</b>하면 위·아래가 보여요.
                    </p>
                  ) : (
                    <p className="px-1 text-[11px] leading-5 text-slate-500">두 가지를 모두 고르면 영역이 나타나요.</p>
                  )}
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setAns((p) => {
              const next = { ...p };
              for (const it of sys.items) delete next[it.id];
              return next;
            })}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 이 문제 다시 풀기
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 직선을 밀어라
// ══════════════════════════════════════════════════════════════
function OptTab() {
  const poly = regionPoly(OPT_REGION, OPT_BOX);
  const [oi, setOi] = useState(0);
  const [k, setK] = useState(0);
  const [inp, setInp] = useState<Record<string, { max: string; min: string; graded: boolean }>>({});

  const o: Obj = OBJECTIVES[oi];
  const r = objRange(o, poly);
  const kMin = Math.floor(r.min) - 3;
  const kMax = Math.ceil(r.max) + 3;
  const meets = k >= r.min - 1e-9 && k <= r.max + 1e-9;
  const L = kLine(o, k, OPT_BOX);

  const cur = inp[o.id] ?? { max: "", min: "", graded: false };
  const num = (s: string) => Number((s ?? "").replace(/[^0-9.-]/g, ""));
  const okMax = cur.max.trim() !== "" && Math.abs(num(cur.max) - r.max) < 1e-6;
  const okMin = cur.min.trim() !== "" && Math.abs(num(cur.min) - r.min) < 1e-6;
  const both = okMax && okMin;
  const solvedCount = OBJECTIVES.filter((z) => {
    const c = inp[z.id];
    if (!c || !c.graded) return false;
    const rr = objRange(z, poly);
    return Math.abs(num(c.max) - rr.max) < 1e-6 && Math.abs(num(c.min) - rr.min) < 1e-6;
  }).length;

  const hit = (pts: Pt[]) => pts.some((p) => Math.abs(objAt(o, p[0], p[1]) - k) < 1e-9);
  const markers: Marker[] = poly.map((p) => {
    const v = objAt(o, p[0], p[1]);
    const on = Math.abs(v - k) < 1e-9;
    return {
      x: p[0],
      y: p[1],
      fill: on ? "#fbbf24" : "#c4b5fd",
      ring: on ? "#fde68a" : undefined,
      label: cur.graded && both ? `${fmt(v, 0)}` : undefined,
    };
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">📐 영역 위로 직선을 밀어 최댓값·최솟값 찾기</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400">영역 D :</span>
          {OPT_RAW_TEX.map((t) => (
            <span key={t} className="rounded-lg bg-black/25 px-2 py-1 text-sm text-slate-100">
              <Katex expr={t} />
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Plane
          box={OPT_BOX}
          layers={[{ qs: OPT_REGION, color: "#a78bfa", opacity: 0.3 }]}
          lines={OPT_REGION.map((q) => ({ q, color: "#8b5cf6" }))}
          extras={[{ x1: L.x1, y1: L.y1, x2: L.x2, y2: L.y2, color: meets ? "#fbbf24" : "#64748b", dash: "7 4" }]}
          markers={markers}
          uid={`opt-${o.id}`}
          tick={1}
        />

        <div className="space-y-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
            <p className="text-[11px] font-bold text-slate-400">일차식을 골라 보세요</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {OBJECTIVES.map((z, i) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => {
                    setOi(i);
                    setK(0);
                  }}
                  className={
                    "rounded-xl border-2 px-2 py-1.5 text-base font-bold transition " +
                    (oi === i ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  <Katex expr={z.tex} />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-amber-400/45 bg-amber-400/[0.08] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="overflow-x-auto overflow-y-hidden py-0.5 text-sm text-amber-100">
                <Katex expr={o.kTex} />
              </span>
              <p className="font-mono text-2xl font-bold text-amber-100">k = {k}</p>
            </div>
            <input
              type="range"
              aria-label="k 값"
              min={kMin}
              max={kMax}
              step={1}
              value={k}
              onChange={(e) => setK(Number(e.target.value))}
              className="mt-1 w-full accent-amber-400"
            />
            <p className={"mt-1 rounded-lg px-2 py-1 text-center text-xs font-bold " + (meets ? "bg-emerald-400/15 text-emerald-100" : "bg-white/5 text-slate-400")}>
              {meets
                ? hit(poly)
                  ? "🎯 직선이 꼭짓점에 딱 걸렸어요!"
                  : "⭕ 직선이 영역과 만나요 — 이 k는 될 수 있어요"
                : "❌ 직선이 영역을 벗어났어요 — 이 k는 될 수 없어요"}
            </p>
            <p className="mt-1 text-center text-[11px] leading-5 text-slate-300">
              k를 바꾸면 <b className="text-amber-200">기울기가 같은 평행한 직선</b>이 밀려요. 영역과 만나는 마지막
              자리를 찾아보세요.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.06] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-violet-200">✍️ 최댓값과 최솟값을 적어 보세요</p>
              <span className="font-mono text-[11px] text-slate-400">
                푼 식 {solvedCount} / {OBJECTIVES.length}
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(["max", "min"] as const).map((kind) => {
                const okk = kind === "max" ? okMax : okMin;
                return (
                  <div key={kind}>
                    <p className="text-[10px] font-bold text-slate-400">{kind === "max" ? "최댓값" : "최솟값"}</p>
                    <input
                      type="text"
                      inputMode="text"
                      aria-label={kind === "max" ? "최댓값" : "최솟값"}
                      value={cur[kind]}
                      onChange={(e) =>
                        setInp((p) => ({ ...p, [o.id]: { ...(p[o.id] ?? { max: "", min: "", graded: false }), [kind]: e.target.value, graded: false } }))
                      }
                      placeholder="숫자만"
                      className={
                        "w-full rounded-lg border-2 bg-slate-950 px-2 py-1.5 text-center font-mono text-sm outline-none transition focus:border-violet-300 " +
                        (cur.graded ? (okk ? "border-emerald-400/70 text-emerald-100" : "border-rose-400/60 text-rose-100") : "border-white/15 text-slate-100")
                      }
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setInp((p) => ({ ...p, [o.id]: { ...(p[o.id] ?? { max: "", min: "", graded: false }), graded: true } }))}
                className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
              >
                채점하기
              </button>
              {cur.graded && both ? (
                <>
                  <button
                    type="button"
                    onClick={() => setK(r.max)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                  >
                    최대로 밀기
                  </button>
                  <button
                    type="button"
                    onClick={() => setK(r.min)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                  >
                    최소로 밀기
                  </button>
                </>
              ) : null}
            </div>
            <div className="mt-1.5 min-h-[54px]">
              {cur.graded && both ? (
                <p className="rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-2.5 py-1.5 text-[11px] leading-5 text-emerald-100">
                  정답이에요! ✅ 최댓값 {fmt(r.max, 0)} 은 꼭짓점 {r.argMax.map((p) => `(${p[0]}, ${p[1]})`).join(", ")} 에서,
                  최솟값 {fmt(r.min, 0)} 은 {r.argMin.map((p) => `(${p[0]}, ${p[1]})`).join(", ")} 에서 나와요. 이제 각
                  꼭짓점에 그 값이 적혀 있어요.
                </p>
              ) : cur.graded ? (
                <p className="rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-2.5 py-1.5 text-[11px] leading-5 text-amber-100">
                  아직이에요. k 손잡이를 끝까지 밀어 보며 <b>직선이 영역을 벗어나기 직전</b>의 k를 찾아보세요.
                </p>
              ) : (
                <p className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] leading-5 text-slate-400">
                  💡 영역이 볼록한 다각형이면 최댓값과 최솟값은 반드시 <b className="text-violet-200">꼭짓점</b>에서
                  나와요.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {solvedCount === OBJECTIVES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🏅 네 일차식을 모두 풀었어요!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">
            일차식이 달라지면 직선의 <b className="text-amber-200">기울기</b>가 달라지고, 그래서 마지막으로 걸리는
            꼭짓점도 달라졌어요. 그래도 답은 늘 꼭짓점에서 나왔죠?
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 꼭짓점 사냥
// ══════════════════════════════════════════════════════════════
function HuntTab() {
  const [hi, setHi] = useState(0);
  const [found, setFound] = useState<Record<string, string[]>>({});
  const [miss, setMiss] = useState<Record<string, Pt | null>>({});
  const [tries, setTries] = useState<Record<string, number>>({});

  const h = HUNTS[hi];
  const key = (p: Pt | number[]) => `${p[0]},${p[1]}`;
  const got = found[h.id] ?? [];
  const done = got.length === h.corners.length;
  const wrong = miss[h.id] ?? null;
  const clearCount = HUNTS.filter((z) => (found[z.id] ?? []).length === z.corners.length).length;

  const pick = (x: number, y: number) => {
    const isCorner = h.corners.some((p) => p[0] === x && p[1] === y);
    if (isCorner) {
      setFound((p) => ({ ...p, [h.id]: [...new Set([...(p[h.id] ?? []), key([x, y])])] }));
      setMiss((p) => ({ ...p, [h.id]: null }));
    } else {
      setMiss((p) => ({ ...p, [h.id]: [x, y] }));
      setTries((p) => ({ ...p, [h.id]: (p[h.id] ?? 0) + 1 }));
    }
  };

  const markers: Marker[] = h.corners
    .filter((p) => got.includes(key(p)))
    .map((p) => ({ x: p[0], y: p[1], fill: "#34d399", ring: "#6ee7b7", label: `(${p[0]}, ${p[1]})` }));
  if (wrong) markers.push({ x: wrong[0], y: wrong[1], fill: "#fb7185" });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🎯 영역의 꼭짓점을 모두 찾아 눌러 보세요</p>
          <span className="font-mono text-xs text-slate-300">
            해결 {clearCount} / {HUNTS.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {HUNTS.map((z, i) => {
            const okz = (found[z.id] ?? []).length === z.corners.length;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setHi(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (hi === i
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Plane
          box={BOX6}
          layers={[{ qs: h.ineqs, color: "#a78bfa", opacity: 0.3 }]}
          lines={h.ineqs.map((q) => ({ q, color: "#8b5cf6" }))}
          markers={markers}
          onPick={pick}
          uid={`hunt-${h.id}`}
          tick={2}
        />

        <div className="space-y-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
            <p className="text-[11px] font-bold text-slate-400">연립부등식</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {h.texList.map((t) => (
                <span key={t} className="rounded-lg bg-black/25 px-2 py-1 text-sm text-slate-100">
                  <Katex expr={t} />
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-white/15 bg-slate-900/60 p-3 text-center">
            <p className="text-[11px] font-bold text-slate-400">찾은 꼭짓점</p>
            <p className="font-mono text-3xl font-bold text-emerald-200">
              {got.length} <span className="text-slate-500">/ {h.corners.length}</span>
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-1">
              {h.corners.map((p) => {
                const on = got.includes(key(p));
                return (
                  <span
                    key={key(p)}
                    className={
                      "rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold " +
                      (on ? "bg-emerald-400/20 text-emerald-100" : "bg-white/5 text-slate-600")
                    }
                  >
                    {on ? `(${p[0]}, ${p[1]})` : "( ?, ? )"}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="min-h-[92px] rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            {done ? (
              <p className="text-xs leading-6 text-emerald-100">
                🎉 꼭짓점을 모두 찾았어요! 꼭짓점은 <b>경계선 두 개가 만나는 자리</b> 가운데 영역에 실제로 붙어 있는
                점이에요. 다음 탭에서는 이렇게 찾은 꼭짓점에 값을 대입해 최댓값과 최솟값을 구해 봅니다.
              </p>
            ) : wrong ? (
              <p className="text-xs leading-6 text-amber-100">
                ({wrong[0]}, {wrong[1]}) 은 꼭짓점이 아니에요.{" "}
                {satisfiesAll(h.ineqs, wrong[0], wrong[1]) ? "영역 안에는 있지만 뾰족한 모서리가 아니에요." : "영역 밖의 점이에요."}
                {(tries[h.id] ?? 0) >= 3 ? " 💡 경계선 두 개가 만나는 자리를 찾아보세요." : ""}
              </p>
            ) : (
              <p className="text-xs leading-6 text-slate-400">
                💡 색칠된 영역의 <b className="text-violet-200">뾰족한 모서리</b>를 눌러 보세요. 격자점으로 자동으로
                맞춰집니다.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setFound((p) => ({ ...p, [h.id]: [] }));
              setMiss((p) => ({ ...p, [h.id]: null }));
              setTries((p) => ({ ...p, [h.id]: 0 }));
            }}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 이 문제 다시 풀기
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 꼭짓점 표로 풀기
// ══════════════════════════════════════════════════════════════
function TableTab() {
  const [pi, setPi] = useState(0);
  const [vals, setVals] = useState<Record<string, string[]>>({});
  const [graded, setGraded] = useState<Record<string, boolean>>({});
  const [pickMax, setPickMax] = useState<Record<string, number>>({});
  const [pickMin, setPickMin] = useState<Record<string, number>>({});

  const num = (s: string) => Number((s ?? "").replace(/[^0-9.-]/g, ""));
  const solvedOf = (z: (typeof TABLE_PROBS)[number]) => {
    const t = tableValues(z);
    const v = vals[z.id];
    if (graded[z.id] !== true || !v) return false;
    return (
      z.corners.every((_, j) => (v[j] ?? "").trim() !== "" && Math.abs(num(v[j]) - t[j]) < 1e-6) &&
      pickMax[z.id] !== undefined &&
      argMaxIdx(t).includes(pickMax[z.id]) &&
      pickMin[z.id] !== undefined &&
      argMinIdx(t).includes(pickMin[z.id])
    );
  };

  const p = TABLE_PROBS[pi];
  const truth = tableValues(p);
  const maxI = argMaxIdx(truth);
  const minI = argMinIdx(truth);
  const cur = vals[p.id] ?? p.corners.map(() => "");
  const isGraded = graded[p.id] === true;
  const okAt = (i: number) => (cur[i] ?? "").trim() !== "" && Math.abs(num(cur[i]) - truth[i]) < 1e-6;
  const tableOk = p.corners.every((_, i) => okAt(i));
  const maxOk = pickMax[p.id] !== undefined && maxI.includes(pickMax[p.id]);
  const minOk = pickMin[p.id] !== undefined && minI.includes(pickMin[p.id]);
  const done = isGraded && tableOk && maxOk && minOk;
  const clearCount = TABLE_PROBS.filter(solvedOf).length;

  const setCell = (i: number, v: string) => {
    setVals((z) => {
      const arr = [...(z[p.id] ?? p.corners.map(() => ""))];
      arr[i] = v;
      return { ...z, [p.id]: arr };
    });
    setGraded((z) => ({ ...z, [p.id]: false }));
  };

  const markers: Marker[] = p.corners.map((c, i) => ({
    x: c[0],
    y: c[1],
    fill: done ? (maxI.includes(i) ? "#fbbf24" : minI.includes(i) ? "#38bdf8" : "#c4b5fd") : "#c4b5fd",
    ring: done && (maxI.includes(i) || minI.includes(i)) ? "#fde68a" : undefined,
    label: `${CORNER_NAMES[i]}(${c[0]}, ${c[1]})`,
  }));

  const extras: Extra[] = done
    ? [
        { ...kLine(p.obj, truth[maxI[0]], BOX6), color: "#fbbf24", dash: "7 4" },
        { ...kLine(p.obj, truth[minI[0]], BOX6), color: "#38bdf8", dash: "7 4" },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🧾 꼭짓점에서만 값을 구해 표로 견주기</p>
          <span className="font-mono text-xs text-slate-300">
            해결 {clearCount} / {TABLE_PROBS.length}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          앞에서 본 대로 최댓값과 최솟값은 <b className="text-violet-200">꼭짓점</b>에서 나와요. 그러니 영역 안의 수많은
          점을 다 볼 필요 없이 꼭짓점 몇 개만 확인하면 됩니다.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TABLE_PROBS.map((z, i) => {
            const okz = solvedOf(z);
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setPi(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (pi === i
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Plane
            box={BOX6}
            layers={[{ qs: p.ineqs, color: "#a78bfa", opacity: 0.3 }]}
            lines={p.ineqs.map((q) => ({ q, color: "#8b5cf6" }))}
            extras={extras}
            markers={markers}
            uid={`table-${p.id}`}
            tick={2}
          />
          <p className="min-h-[32px] text-[11px] leading-5 text-slate-400">
            {done
              ? "노란 점선은 최댓값, 파란 점선은 최솟값을 주는 직선이에요. 두 직선 사이에 영역이 쏙 들어가 있죠?"
              : "영역의 꼭짓점에 A · B · C 이름을 붙여 두었어요."}
          </p>
        </div>

        <div className="space-y-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
            <p className="text-[11px] font-bold text-slate-400">연립부등식</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {p.texList.map((t) => (
                <span key={t} className="rounded-lg bg-black/25 px-2 py-1 text-sm text-slate-100">
                  <Katex expr={t} />
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] font-bold text-slate-400">이 영역에서 다음 일차식의 최댓값과 최솟값은?</p>
            <div className="overflow-x-auto overflow-y-hidden py-0.5 text-center text-xl text-slate-100">
              <Katex expr={p.obj.tex} />
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[300px] border-collapse text-center text-xs">
              <tbody>
                <tr>
                  <th className="w-20 border border-white/15 bg-blue-600/70 px-2 py-2 font-bold text-white">꼭짓점</th>
                  {p.corners.map((c, i) => (
                    <td key={i} className="border border-white/15 bg-white/5 px-2 py-2 font-mono text-sm font-bold text-slate-100">
                      {CORNER_NAMES[i]}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="border border-white/15 bg-blue-600/70 px-2 py-2 font-bold text-white">좌표</th>
                  {p.corners.map((c, i) => (
                    <td key={i} className="border border-white/15 px-2 py-2 font-mono text-[11px] text-violet-100">
                      ({c[0]}, {c[1]})
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="border border-white/15 bg-blue-600/70 px-1 py-2 font-bold text-white">
                    <Katex expr={p.obj.tex} />
                  </th>
                  {p.corners.map((c, i) => (
                    <td key={i} className="border border-white/15 p-1">
                      <input
                        type="text"
                        inputMode="text"
                        aria-label={`꼭짓점 ${CORNER_NAMES[i]} 에서의 값`}
                        value={cur[i] ?? ""}
                        onChange={(e) => setCell(i, e.target.value)}
                        className={
                          "w-full rounded-lg border-2 bg-slate-950 px-1 py-1.5 text-center font-mono text-sm outline-none transition focus:border-violet-300 " +
                          (isGraded
                            ? okAt(i)
                              ? "border-emerald-400/70 text-emerald-100"
                              : "border-rose-400/60 text-rose-100"
                            : "border-white/15 text-slate-100")
                        }
                      />
                      {isGraded && !okAt(i) ? <p className="mt-0.5 font-mono text-[10px] text-emerald-200">{fmt(truth[i], 0)}</p> : null}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setGraded((z) => ({ ...z, [p.id]: true }))}
              className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
            >
              표 채점하기
            </button>
            <button
              type="button"
              onClick={() => {
                setVals((z) => ({ ...z, [p.id]: p.corners.map(() => "") }));
                setGraded((z) => ({ ...z, [p.id]: false }));
                setPickMax((z) => {
                  const n = { ...z };
                  delete n[p.id];
                  return n;
                });
                setPickMin((z) => {
                  const n = { ...z };
                  delete n[p.id];
                  return n;
                });
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↩️ 다시
            </button>
          </div>

          <div className="min-h-[126px] rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            {isGraded && tableOk ? (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-300">표를 다 채웠어요. 이제 골라 볼까요?</p>
                {(["max", "min"] as const).map((kind) => {
                  const picked = kind === "max" ? pickMax[p.id] : pickMin[p.id];
                  const right = kind === "max" ? maxOk : minOk;
                  const want = kind === "max" ? maxI : minI;
                  return (
                    <div key={kind}>
                      <p className="text-[10px] font-bold text-slate-400">
                        {kind === "max" ? "최댓값이 나오는 꼭짓점은?" : "최솟값이 나오는 꼭짓점은?"}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-1.5">
                        {p.corners.map((c, i) => {
                          const on = picked === i;
                          const isAns = picked !== undefined && want.includes(i);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() =>
                                kind === "max"
                                  ? setPickMax((z) => ({ ...z, [p.id]: i }))
                                  : setPickMin((z) => ({ ...z, [p.id]: i }))
                              }
                              className={
                                "rounded-lg border-2 px-3 py-1 text-xs font-bold transition " +
                                (isAns
                                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                                  : on
                                    ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                              }
                            >
                              {CORNER_NAMES[i]}
                            </button>
                          );
                        })}
                        {picked !== undefined ? (
                          <span className={"self-center text-[11px] font-bold " + (right ? "text-emerald-200" : "text-rose-200")}>
                            {right ? "✅" : "다시 골라 보세요"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : isGraded ? (
              <p className="text-xs leading-6 text-amber-100">
                초록색 수가 맞는 값이에요. 꼭짓점의 좌표를 <Katex expr={p.obj.tex} /> 에 그대로 넣어 계산해 보세요.
              </p>
            ) : (
              <p className="text-xs leading-6 text-slate-400">
                💡 꼭짓점의 좌표를 일차식에 대입해 표를 채우고 <b>표 채점하기</b>를 눌러 보세요.
              </p>
            )}
          </div>

          <div className="min-h-[58px]">
            {done ? (
              <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3">
                <p className="text-xs leading-6 text-emerald-100">
                  정답이에요! ✅ <Katex expr={p.obj.tex} /> 는 꼭짓점 {maxI.map((i) => CORNER_NAMES[i]).join(", ")}{" "}
                  <span className="font-mono">
                    ({p.corners[maxI[0]][0]}, {p.corners[maxI[0]][1]})
                  </span>{" "}
                  에서 최댓값 <b className="font-mono text-amber-200">{fmt(truth[maxI[0]], 0)}</b>, 꼭짓점{" "}
                  {minI.map((i) => CORNER_NAMES[i]).join(", ")}{" "}
                  <span className="font-mono">
                    ({p.corners[minI[0]][0]}, {p.corners[minI[0]][1]})
                  </span>{" "}
                  에서 최솟값 <b className="font-mono text-sky-200">{fmt(truth[minI[0]], 0)}</b> 을 가져요.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {clearCount === TABLE_PROBS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🎓 세 문제를 모두 풀었어요!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">
            이제 순서가 보이죠? <b className="text-violet-200">① 영역을 그린다 → ② 꼭짓점을 찾는다 → ③ 꼭짓점에서만 값을
            구해 견준다.</b> 다만 꼭짓점을 하나라도 빠뜨리면 답이 달라질 수 있으니 꼼꼼히 세어야 해요.
          </p>
        </div>
      ) : null}
    </div>
  );
}
