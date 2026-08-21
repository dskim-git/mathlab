"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  BOX7,
  COEF_BOX,
  COEF_RANGE,
  COEF_START,
  CONCLUSIONS,
  CORNER_NAMES,
  DRAW_BOX,
  DRAW_MAX,
  DRAW_START,
  MISSIONS,
  OP_SOLID,
  PENTA,
  PENTA_INEQS,
  PENTA_STD,
  SHAPES,
  argBest,
  convexHull,
  edgesOf,
  kLine,
  missionDone,
  objTex,
  regionPoly,
  stdTex,
  stdToIneq,
  valuesAt,
  type Box,
  type Ineq,
  type Pt,
  type Std,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "reverse",
    prompt:
      "지금까지는 부등식을 보고 영역을 그렸는데, 이번에는 거꾸로 도형을 보고 부등식을 찾았어요. 변 하나가 부등식 하나가 되는 까닭과, 부등호의 방향을 어떻게 정했는지 자기 말로 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 변을 늘인 직선이 평면을 둘로 가르는데 도형은 그중 한쪽에만 있으니 변마다 부등식이 하나씩 생긴다. 방향은 도형 안쪽의 아무 점이나 하나 골라 대입해 참이 되는 쪽으로 정하면 된다.",
  },
  {
    id: "make",
    prompt:
      "직접 점을 찍어 다각형을 만들고 그 연립부등식을 얻어 보았어요. 점을 늘리거나 옮길 때 부등식의 개수와 모양이 어떻게 달라졌는지, 그리고 안쪽으로 들어간 점은 왜 무시되는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 꼭짓점이 하나 늘면 부등식도 하나 늘었다. 안쪽에 찍은 점은 이미 다른 부등식들을 다 만족하니 새 조건이 되지 못해 도형의 모양을 바꾸지 못했다.",
  },
  {
    id: "corner",
    prompt:
      "a와 b를 바꿔 가며 최댓값과 최솟값이 나오는 자리를 관찰했어요. 늘 꼭짓점에서 나오는 까닭을 설명하고, 두 꼭짓점에서 동시에 최댓값이 나오려면 어떤 일이 일어나야 하는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: f = k 직선을 밀 때 영역에서 떨어지기 직전에 걸리는 곳이 늘 모서리라서 꼭짓점에서 나온다. 직선이 어느 변과 나란해지면 그 변의 두 끝에서 값이 같아져 최댓값이 두 곳에서 나온다.",
  },
];

type Tab = "build" | "draw" | "coef" | "mission";

export default function PolygonRegionLab() {
  const [tab, setTab] = useState<Tab>("build");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">⬟ 다각형과 부등식의 영역</h3>
        <p className="mt-2 leading-7 text-slate-300">
          이번에는 <b className="text-amber-200">거꾸로</b>예요. 다각형을 보고 그 영역을 나타내는{" "}
          <b className="text-violet-200">연립부등식</b>을 찾아봐요. 내가 그린 도형의 부등식도 바로 만들어 보고, 계수를
          바꿔 가며 최댓값·최솟값이 어디서 나오는지도 관찰해요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "build"} onClick={() => setTab("build")}>① 도형을 부등식으로</TabButton>
        <TabButton active={tab === "draw"} onClick={() => setTab("draw")}>② 내 도형 만들기</TabButton>
        <TabButton active={tab === "coef"} onClick={() => setTab("coef")}>③ a와 b를 바꾸면</TabButton>
        <TabButton active={tab === "mission"} onClick={() => setTab("mission")}>④ 꼭짓점 미션</TabButton>
      </div>

      <div className="mt-4">
        {tab === "build" ? <BuildTab /> : null}
        {tab === "draw" ? <DrawTab /> : null}
        {tab === "coef" ? <CoefTab /> : null}
        {tab === "mission" ? <MissionTab /> : null}
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
type Marker = { x: number; y: number; fill: string; ring?: string; label?: string; small?: boolean };
type Outline = { pts: Pt[]; color: string; fill?: string };

function Plane({
  box,
  layers = [],
  lines = [],
  extras = [],
  markers = [],
  outline,
  onPick,
  uid,
  grid = 1,
  tick = 1,
}: {
  box: Box;
  layers?: Layer[];
  lines?: EdgeLine[];
  extras?: Extra[];
  markers?: Marker[];
  outline?: Outline;
  onPick?: (x: number, y: number) => void;
  uid: string;
  grid?: number;
  tick?: number;
}) {
  const pw = S - ML - MR;
  const ph = S - MT - MB;
  const X = (v: number) => ML + ((v - box.xMin) / (box.xMax - box.xMin)) * pw;
  const Y = (v: number) => S - MB - ((v - box.yMin) / (box.yMax - box.yMin)) * ph;
  const cid = `pg-${uid}`;
  const x0 = X(0);
  const y0 = Y(0);

  const gx: number[] = [];
  for (let v = Math.ceil(box.xMin / grid) * grid; v <= box.xMax; v += grid) gx.push(v);
  const gy: number[] = [];
  for (let v = Math.ceil(box.yMin / grid) * grid; v <= box.yMax; v += grid) gy.push(v);

  const handle = onPick
    ? (ev: React.MouseEvent<SVGSVGElement>) => {
        const r = ev.currentTarget.getBoundingClientRect();
        const px = ((ev.clientX - r.left) / r.width) * S;
        const py = ((ev.clientY - r.top) / r.height) * S;
        const mx = Math.round(box.xMin + ((px - ML) / pw) * (box.xMax - box.xMin));
        const my = Math.round(box.yMin + ((S - MB - py) / ph) * (box.yMax - box.yMin));
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
        aria-label="다각형과 부등식의 영역"
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

        {outline && outline.pts.length >= 3 ? (
          <polygon
            points={outline.pts.map((p) => `${X(p[0])},${Y(p[1])}`).join(" ")}
            fill={outline.fill ?? "none"}
            fillOpacity={outline.fill ? 0.18 : 0}
            stroke={outline.color}
            strokeWidth={2.6}
            strokeDasharray="7 4"
          />
        ) : null}

        <line x1={ML} y1={y0} x2={S - MR} y2={y0} stroke="#94a3b8" strokeWidth={1.2} />
        <line x1={x0} y1={S - MB} x2={x0} y2={MT} stroke="#94a3b8" strokeWidth={1.2} />
        <polygon points={`${S - MR},${y0} ${S - MR - 6},${y0 - 3} ${S - MR - 6},${y0 + 3}`} fill="#94a3b8" />
        <polygon points={`${x0},${MT} ${x0 - 3},${MT + 6} ${x0 + 3},${MT + 6}`} fill="#94a3b8" />

        <g clipPath={`url(#${cid})`}>
          {lines.map((L, i) =>
            L.q.kind === "vline" ? (
              <line key={i} x1={X(L.q.c)} y1={MT} x2={X(L.q.c)} y2={S - MB} stroke={L.color} strokeWidth={2.2} strokeDasharray={OP_SOLID[L.q.op] ? undefined : "6 4"} />
            ) : (
              <line
                key={i}
                x1={X(box.xMin)}
                y1={Y(L.q.a * box.xMin + L.q.b)}
                x2={X(box.xMax)}
                y2={Y(L.q.a * box.xMax + L.q.b)}
                stroke={L.color}
                strokeWidth={2.2}
                strokeDasharray={OP_SOLID[L.q.op] ? undefined : "6 4"}
              />
            ),
          )}
          {extras.map((e, i) => (
            <line key={i} x1={X(e.x1)} y1={Y(e.y1)} x2={X(e.x2)} y2={Y(e.y2)} stroke={e.color} strokeWidth={2.6} strokeDasharray={e.dash} />
          ))}
        </g>

        {gx.filter((v) => v !== 0 && Math.abs(v % tick) < 1e-9).map((v) => (
          <text key={`tx${v}`} x={X(v)} y={y0 + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
            {v}
          </text>
        ))}
        {gy.filter((v) => v !== 0 && Math.abs(v % tick) < 1e-9).map((v) => (
          <text key={`ty${v}`} x={x0 - 6} y={Y(v)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
            {v}
          </text>
        ))}

        {markers.map((m, i) => (
          <g key={i}>
            {m.ring ? <circle cx={X(m.x)} cy={Y(m.y)} r={9} fill="none" stroke={m.ring} strokeWidth={2} /> : null}
            <circle cx={X(m.x)} cy={Y(m.y)} r={m.small ? 3.4 : 5.2} fill={m.fill} stroke="#0b1220" strokeWidth={1.4} />
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

const samePoly = (a: Pt[], b: Pt[]) =>
  a.length === b.length &&
  a.every((p) => b.some((q) => Math.abs(p[0] - q[0]) < 1e-6 && Math.abs(p[1] - q[1]) < 1e-6));

// ══════════════════════════════════════════════════════════════
//  탭 ① 도형을 부등식으로
// ══════════════════════════════════════════════════════════════
function BuildTab() {
  const [si, setSi] = useState(0);
  const [picked, setPicked] = useState<Record<string, number[]>>({});
  const [graded, setGraded] = useState<Record<string, boolean>>({});

  const sh = SHAPES[si];
  const sel = picked[sh.id] ?? [];
  const isGraded = graded[sh.id] === true;
  const wantIdx = sh.cards.map((c, i) => (c.pick ? i : -1)).filter((i) => i >= 0);
  const exact = sel.length === wantIdx.length && wantIdx.every((i) => sel.includes(i));
  const selQs = sel.map((i) => stdToIneq(sh.cards[i].s));
  const selPoly = sel.length ? regionPoly(selQs, BOX7) : [];
  const matches = sel.length > 0 && samePoly(selPoly, sh.corners);
  const clearCount = SHAPES.filter((z) => {
    const p = picked[z.id] ?? [];
    const w = z.cards.map((c, i) => (c.pick ? i : -1)).filter((i) => i >= 0);
    return graded[z.id] === true && p.length === w.length && w.every((i) => p.includes(i));
  }).length;

  const toggle = (i: number) => {
    setPicked((z) => {
      const cur = z[sh.id] ?? [];
      return { ...z, [sh.id]: cur.includes(i) ? cur.filter((v) => v !== i) : [...cur, i] };
    });
    setGraded((z) => ({ ...z, [sh.id]: false }));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🧩 노란 점선 도형을 만드는 부등식 카드를 모두 골라 보세요</p>
          <span className="font-mono text-xs text-slate-300">
            해결 {clearCount} / {SHAPES.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SHAPES.map((z, i) => {
            const p = picked[z.id] ?? [];
            const w = z.cards.map((c, j) => (c.pick ? j : -1)).filter((j) => j >= 0);
            const okz = graded[z.id] === true && p.length === w.length && w.every((j) => p.includes(j));
            return (
              <button
                key={z.id}
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
                {z.emoji} {z.title} ({z.name})
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Plane
            box={BOX7}
            layers={sel.length ? [{ qs: selQs, color: "#a78bfa", opacity: 0.38 }] : []}
            lines={sel.map((i) => ({ q: stdToIneq(sh.cards[i].s), color: "#8b5cf6" }))}
            outline={{ pts: sh.corners, color: "#fbbf24" }}
            markers={sh.corners.map((c) => ({ x: c[0], y: c[1], fill: "#fbbf24", small: true }))}
            uid={`build-${sh.id}`}
          />
          <p className="min-h-[34px] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-5 text-slate-400">
            {sel.length === 0
              ? "카드를 고르면 그 부등식들이 겹치는 영역이 보라색으로 칠해져요. 노란 점선 도형과 딱 맞으면 성공!"
              : matches
                ? "🎯 보라색 영역이 노란 점선 도형과 딱 맞아요! 확인을 눌러 보세요."
                : "아직 노란 점선 도형과 다르네요. 카드를 더 고르거나 빼 보세요."}
          </p>
        </div>

        <div className="space-y-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[11px] font-bold text-slate-400">부등식 카드</p>
              <p className="font-mono text-[11px] text-slate-400">
                고른 카드 {sel.length}개 · 이 도형의 변은 {sh.corners.length}개
              </p>
            </div>
            <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
              {sh.cards.map((c, i) => {
                const on = sel.includes(i);
                const right = isGraded && c.pick;
                const wrong = isGraded && on && !c.pick;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggle(i)}
                    className={
                      "rounded-xl border-2 px-2 py-1.5 text-base font-bold transition " +
                      (right
                        ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                        : wrong
                          ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                          : on
                            ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                            : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                    }
                  >
                    {on ? "✔ " : ""}
                    <Katex expr={stdTex(c.s)} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={sel.length === 0}
              onClick={() => setGraded((z) => ({ ...z, [sh.id]: true }))}
              className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25 disabled:opacity-40"
            >
              확인
            </button>
            <button
              type="button"
              onClick={() => {
                setPicked((z) => ({ ...z, [sh.id]: [] }));
                setGraded((z) => ({ ...z, [sh.id]: false }));
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↩️ 다시
            </button>
          </div>

          <div className="min-h-[74px]">
            {isGraded && exact ? (
              <p className="rounded-xl border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-2 text-xs leading-6 text-emerald-100">
                정답이에요! ✅ {sh.explain}
              </p>
            ) : isGraded ? (
              <p className="rounded-xl border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-2 text-xs leading-6 text-amber-100">
                초록색이 골랐어야 할 카드예요.{" "}
                {sel.length !== sh.corners.length
                  ? `변이 ${sh.corners.length}개니 부등식도 ${sh.corners.length}개여야 해요.`
                  : "개수는 맞지만 부등호의 방향이나 계수를 다시 살펴보세요."}
              </p>
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-6 text-slate-400">
                💡 변을 하나 고를 때마다 부등식이 하나예요. 도형 안쪽의 아무 점이나 대입해 보면 부등호의 방향을 정할 수
                있어요.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 내 도형 만들기
// ══════════════════════════════════════════════════════════════
function DrawTab() {
  const [pts, setPts] = useState<Pt[]>(DRAW_START);

  const hull = convexHull(pts);
  const edges: Std[] = hull.length >= 3 ? edgesOf(hull) : [];
  const inside = pts.filter((p) => !hull.some((h) => h[0] === p[0] && h[1] === p[1]));

  const toggle = (x: number, y: number) => {
    if (x < 0 || x > DRAW_MAX || y < 0 || y > DRAW_MAX) return;
    setPts((z) => {
      const at = z.findIndex((p) => p[0] === x && p[1] === y);
      if (at >= 0) return z.filter((_, i) => i !== at);
      if (z.length >= 10) return z;
      return [...z, [x, y] as Pt];
    });
  };

  const markers: Marker[] = pts.map((p) => {
    const isHull = hull.some((h) => h[0] === p[0] && h[1] === p[1]);
    return { x: p[0], y: p[1], fill: isHull ? "#fbbf24" : "#64748b", label: isHull ? `(${p[0]}, ${p[1]})` : undefined, small: !isHull };
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">✏️ 제1사분면에 점을 찍어 다각형을 만들어 보세요</p>
        <p className="mt-1 text-xs leading-6 text-slate-400">
          격자를 누르면 점이 생기고, 다시 누르면 지워져요. 점이 세 개 이상이면 그 점들을 모두 감싸는 다각형이 만들어지고{" "}
          <b className="text-violet-200">그 도형을 나타내는 연립부등식</b>이 바로 나옵니다.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Plane
            box={DRAW_BOX}
            layers={edges.length ? [{ qs: edges.map(stdToIneq), color: "#a78bfa", opacity: 0.34 }] : []}
            lines={edges.map((e) => ({ q: stdToIneq(e), color: "#8b5cf6" }))}
            markers={markers}
            onPick={toggle}
            uid="draw"
            tick={2}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">
              찍은 점 {pts.length}개 · 꼭짓점 {hull.length}개
              {inside.length ? ` · 안쪽 점 ${inside.length}개` : ""}
            </span>
            <button
              type="button"
              onClick={() => setPts(DRAW_START)}
              className="ml-auto rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↩️ 처음 도형
            </button>
            <button
              type="button"
              onClick={() => setPts([])}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              모두 지우기
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="min-h-[188px] rounded-2xl border-2 border-violet-400/45 bg-violet-400/[0.08] p-3">
            <p className="text-xs font-bold text-violet-200">📐 이 도형을 나타내는 연립부등식</p>
            {edges.length ? (
              <div className="mt-2 space-y-1.5">
                {edges.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-black/25 px-2.5 py-1.5">
                    <span className="w-12 shrink-0 font-mono text-[10px] text-slate-500">변 {i + 1}</span>
                    <span className="text-base text-slate-100">
                      <Katex expr={stdTex(e)} />
                    </span>
                  </div>
                ))}
                <p className="pt-1 text-[11px] leading-5 text-slate-300">
                  꼭짓점이 <b className="text-amber-200">{hull.length}개</b>인 다각형이니 부등식도{" "}
                  <b className="text-amber-200">{edges.length}개</b>예요. 변 하나가 부등식 하나랍니다.
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs leading-6 text-slate-400">
                {pts.length < 3
                  ? "점을 세 개 이상 찍어 주세요."
                  : "찍은 점이 모두 한 직선 위에 있어요. 직선에서 벗어난 점을 하나 더 찍어 보세요."}
              </p>
            )}
          </div>

          <div className="min-h-[64px] rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            {inside.length ? (
              <p className="text-xs leading-6 text-amber-100">
                🔎 회색 점 {inside.length}개는 도형 <b>안쪽</b>에 있어요. 이미 다른 부등식들을 모두 만족하니 새로운 조건이
                되지 못하고, 그래서 부등식의 개수도 늘지 않아요.
              </p>
            ) : (
              <p className="text-xs leading-6 text-slate-400">
                💡 점을 안쪽에 찍어 보세요. 꼭짓점이 되지 못하고 회색으로 남는 것을 볼 수 있어요. 점을 최대 10개까지 찍을
                수 있습니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  공용 — a, b 손잡이와 꼭짓점 값 표
// ══════════════════════════════════════════════════════════════
function CoefKnobs({
  a,
  b,
  setA,
  setB,
  onReset,
}: {
  a: number;
  b: number;
  setA: (v: number) => void;
  setB: (v: number) => void;
  onReset?: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-pink-400/45 bg-pink-400/[0.08] p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold text-pink-200">일차식</span>
        <span className="overflow-x-auto overflow-y-hidden py-0.5 text-xl text-pink-100">
          <Katex expr={objTex(a, b) || "0"} />
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="w-8 shrink-0 text-xs font-bold text-slate-400">a</span>
        <input
          type="range"
          aria-label="a 값"
          min={COEF_RANGE.min}
          max={COEF_RANGE.max}
          step={COEF_RANGE.step}
          value={a}
          onChange={(e) => setA(Number(e.target.value))}
          className="w-full accent-pink-400"
        />
        <span className="w-8 shrink-0 text-right font-mono text-sm font-bold text-slate-100">{a}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="w-8 shrink-0 text-xs font-bold text-slate-400">b</span>
        <input
          type="range"
          aria-label="b 값"
          min={COEF_RANGE.min}
          max={COEF_RANGE.max}
          step={COEF_RANGE.step}
          value={b}
          onChange={(e) => setB(Number(e.target.value))}
          className="w-full accent-sky-400"
        />
        <span className="w-8 shrink-0 text-right font-mono text-sm font-bold text-slate-100">{b}</span>
      </div>
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          ↩️ 처음 값으로
        </button>
      ) : null}
    </div>
  );
}

function ValueTable({ a, b }: { a: number; b: number }) {
  const vals = valuesAt(PENTA, a, b);
  const hi = argBest(vals, true);
  const lo = argBest(vals, false);
  const flat = vals.every((v) => Math.abs(v - vals[0]) < 1e-9);
  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <table className="w-full min-w-[290px] border-collapse text-center text-xs">
        <tbody>
          <tr>
            <th className="w-16 border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">꼭짓점</th>
            {PENTA.map((p, i) => (
              <td key={i} className="border border-white/15 bg-white/5 px-1 py-1.5 font-mono text-[11px] font-bold text-violet-100">
                {CORNER_NAMES[i]}
                <br />
                <span className="text-[10px] text-slate-400">
                  ({p[0]},{p[1]})
                </span>
              </td>
            ))}
          </tr>
          <tr>
            <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">
              <Katex expr={objTex(a, b) || "0"} />
            </th>
            {vals.map((v, i) => (
              <td
                key={i}
                className={
                  "border border-white/15 px-1 py-1.5 font-mono text-sm font-bold " +
                  (flat
                    ? "text-slate-200"
                    : hi.includes(i)
                      ? "bg-amber-400/25 text-amber-100"
                      : lo.includes(i)
                        ? "bg-sky-400/25 text-sky-100"
                        : "text-slate-200")
                }
              >
                {v}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="mt-1 text-center text-[10px] text-slate-500">
        {flat ? "모든 꼭짓점의 값이 같아요" : "노란 칸이 최댓값 · 파란 칸이 최솟값"}
      </p>
    </div>
  );
}

function pentaMarkers(a: number, b: number, show: boolean): Marker[] {
  const vals = valuesAt(PENTA, a, b);
  const hi = argBest(vals, true);
  const lo = argBest(vals, false);
  const flat = vals.every((v) => Math.abs(v - vals[0]) < 1e-9);
  return PENTA.map((p, i) => ({
    x: p[0],
    y: p[1],
    fill: !show || flat ? "#c4b5fd" : hi.includes(i) ? "#fbbf24" : lo.includes(i) ? "#38bdf8" : "#c4b5fd",
    ring: !show || flat ? undefined : hi.includes(i) ? "#fde68a" : lo.includes(i) ? "#7dd3fc" : undefined,
    label: `${CORNER_NAMES[i]}${show ? ` ${vals[i]}` : ""}`,
  }));
}

function pentaExtras(a: number, b: number): Extra[] {
  const vals = valuesAt(PENTA, a, b);
  const hi = Math.max(...vals);
  const lo = Math.min(...vals);
  const out: Extra[] = [];
  const L1 = kLine(a, b, hi, COEF_BOX);
  const L2 = kLine(a, b, lo, COEF_BOX);
  if (L1) out.push({ ...L1, color: "#fbbf24", dash: "7 4" });
  if (L2 && Math.abs(hi - lo) > 1e-9) out.push({ ...L2, color: "#38bdf8", dash: "7 4" });
  return out;
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ a와 b를 바꾸면
// ══════════════════════════════════════════════════════════════
function CoefTab() {
  const [a, setA] = useState(COEF_START.a);
  const [b, setB] = useState(COEF_START.b);
  const [ans, setAns] = useState<Record<string, number>>({});

  const solved = CONCLUSIONS.filter((c) => ans[c.id] === c.answer).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-slate-200">🔍 같은 영역, 다른 일차식</p>
          <span className="text-[11px] text-slate-400">영역은 그대로 두고 a와 b만 바꿔 봐요.</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PENTA_STD.map((s, i) => (
            <span key={i} className="rounded-lg bg-black/25 px-2 py-1 text-sm text-slate-100">
              <Katex expr={stdTex(s)} />
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Plane
            box={COEF_BOX}
            layers={[{ qs: PENTA_INEQS, color: "#a78bfa", opacity: 0.32 }]}
            lines={PENTA_INEQS.map((q) => ({ q, color: "#8b5cf6" }))}
            extras={pentaExtras(a, b)}
            markers={pentaMarkers(a, b, true)}
            uid={`coef-${a}-${b}`}
            tick={2}
          />
          <p className="min-h-[34px] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-5 text-slate-400">
            {a === 0 && b === 0
              ? "a와 b가 모두 0이라 어디서나 값이 0이에요. 직선도 그릴 수 없죠."
              : "노란 점선이 최댓값을, 파란 점선이 최솟값을 주는 직선이에요. 두 직선 사이에 영역이 쏙 들어가 있어요."}
          </p>
        </div>

        <div className="space-y-2">
          <CoefKnobs a={a} b={b} setA={setA} setB={setB} onReset={() => { setA(COEF_START.a); setB(COEF_START.b); }} />
          <ValueTable a={a} b={b} />

          <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.06] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-violet-200">🧠 관찰한 것을 정리해 볼까요</p>
              <span className="font-mono text-[11px] text-slate-400">
                {solved} / {CONCLUSIONS.length}
              </span>
            </div>
            {CONCLUSIONS.map((c) => {
              const picked = ans[c.id];
              const right = picked === c.answer;
              return (
                <div key={c.id} className="mt-2">
                  <p className="text-xs font-bold leading-6 text-slate-100">{c.ask}</p>
                  <div className="mt-1 flex flex-col gap-1.5">
                    {c.options.map((o, i) => {
                      const on = picked === i;
                      const isAns = picked !== undefined && i === c.answer;
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={right}
                          onClick={() => setAns((z) => ({ ...z, [c.id]: i }))}
                          className={
                            "rounded-lg border-2 px-2.5 py-1.5 text-left text-xs font-bold leading-5 transition disabled:opacity-90 " +
                            (isAns
                              ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                              : on
                                ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                                : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                          }
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-1 min-h-[38px]">
                    {right ? (
                      <p className="rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-2.5 py-1 text-[11px] leading-5 text-emerald-100">
                        맞아요! ✅ {c.explain}
                      </p>
                    ) : picked !== undefined ? (
                      <p className="rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-2.5 py-1 text-[11px] leading-5 text-amber-100">
                        손잡이를 여러 번 움직여 보며 무엇이 달라지는지 다시 살펴볼까요?
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 꼭짓점 미션
// ══════════════════════════════════════════════════════════════
function MissionTab() {
  const [a, setA] = useState(COEF_START.a);
  const [b, setB] = useState(COEF_START.b);
  const [mi, setMi] = useState(0);
  const [cleared, setCleared] = useState<Record<string, boolean>>({});

  const m = MISSIONS[mi];
  const done = missionDone(m, a, b);
  const marked = cleared[m.id] === true || done;
  const clearCount = MISSIONS.filter((z) => cleared[z.id] === true || missionDone(z, a, b)).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🎮 a와 b를 맞춰 미션을 달성해 보세요</p>
          <span className="font-mono text-xs text-slate-300">
            성공 {clearCount} / {MISSIONS.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {MISSIONS.map((z, i) => {
            const okz = cleared[z.id] === true;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setMi(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (mi === i
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
        <div className="space-y-2">
          <Plane
            box={COEF_BOX}
            layers={[{ qs: PENTA_INEQS, color: "#a78bfa", opacity: 0.32 }]}
            lines={PENTA_INEQS.map((q) => ({ q, color: "#8b5cf6" }))}
            extras={pentaExtras(a, b)}
            markers={pentaMarkers(a, b, true)}
            uid={`mission-${a}-${b}`}
            tick={2}
          />
          <ValueTable a={a} b={b} />
        </div>

        <div className="space-y-2">
          <div
            className={
              "rounded-2xl border-2 p-3 transition " +
              (marked ? "border-emerald-400/50 bg-emerald-400/[0.09]" : "border-white/15 bg-slate-900/60")
            }
          >
            <p className="text-xs font-bold text-slate-400">
              {m.emoji} {m.title}
            </p>
            <p className="mt-0.5 text-base font-bold text-slate-100">{m.goal}</p>
            <p className={"mt-1.5 rounded-lg px-2 py-1 text-center text-sm font-bold " + (done ? "bg-emerald-400/20 text-emerald-100" : "bg-white/5 text-slate-400")}>
              {done ? "🎉 성공!" : "아직이에요 — 손잡이를 움직여 보세요"}
            </p>
            <button
              type="button"
              disabled={!done || cleared[m.id] === true}
              onClick={() => setCleared((z) => ({ ...z, [m.id]: true }))}
              className="mt-1.5 w-full rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-3 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25 disabled:opacity-40"
            >
              {cleared[m.id] === true ? "기록했어요 ✅" : "이 값으로 기록하기"}
            </button>
          </div>

          <CoefKnobs a={a} b={b} setA={setA} setB={setB} />

          <div className="min-h-[64px] rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs leading-6 text-slate-400">💡 {m.hint}</p>
          </div>

          {clearCount === MISSIONS.length ? (
            <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3 text-center">
              <p className="text-sm font-bold text-emerald-100">🏅 다섯 미션을 모두 성공했어요!</p>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-200">
                영역은 한 번도 바뀌지 않았는데 답이 나오는 자리는 계속 달라졌죠? 바뀐 것은 <b className="text-pink-200">
                직선의 기울기</b> 하나뿐이었어요.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
