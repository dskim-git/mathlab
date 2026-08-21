"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  LAB_PRESETS,
  LAB_RANGE,
  LAB_START,
  MISSIONS,
  OP_SOLID,
  PLANE,
  POINT_GAME,
  REGION_QUIZ,
  edgeTex,
  fmt,
  ineqTex,
  missionDone,
  onBoundary,
  quizAnswer,
  satisfies,
  slack,
  substTex,
  withOp,
  type Ineq,
  type Op,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "edge",
    prompt:
      "경계선을 실선으로 그릴 때와 점선으로 그릴 때가 있었어요. 무엇이 그 차이를 만드는지, 그리고 경계 위의 점이 어떻게 되는지 자기 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 부등호에 등호가 들어가면 경계 위의 점도 부등식을 만족해서 영역에 들어가니까 실선으로 그린다. y < x + 2 에서는 (1, 3)이 빠졌는데 y ≤ x + 2 로 바꾸니 들어왔다.",
  },
  {
    id: "flip",
    prompt:
      "x - 3y + 6 ≤ 0 처럼 y가 왼쪽에 없는 부등식을 정리할 때 부등호의 방향이 바뀌는 일이 있었어요. 언제 방향이 바뀌는지와, 방향을 바꾸지 않으면 그림이 어떻게 달라지는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 양변을 음수로 나누거나 곱할 때 방향이 바뀐다. 방향을 그대로 두면 위아래가 정반대인 영역을 칠하게 되어 완전히 다른 답이 된다.",
  },
  {
    id: "shape",
    prompt:
      "직선뿐 아니라 세로선 x ⊐ c 와 원 x² + y² ⊐ r² 의 영역도 그려 보았어요. '윗부분·아랫부분'이라는 말이 그대로 통하지 않는 경우가 있었는데, 세 가지 꼴에서 평면이 각각 어떻게 둘로 갈리는지 견주어 적어 보세요.",
    kind: "text",
    placeholder:
      "예: y ⊐ ax + b 는 경계선의 위와 아래로, x ⊐ c 는 세로선의 왼쪽과 오른쪽으로, 원은 안쪽과 바깥쪽으로 갈린다. 어느 쪽이 부등식을 만족하는지는 점 하나를 대입해 보면 늘 확인할 수 있었다.",
  },
];

type Tab = "draw" | "pick" | "game";

export default function RegionLab() {
  const [tab, setTab] = useState<Tab>("draw");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🖍️ 부등식의 영역</h3>
        <p className="mt-2 leading-7 text-slate-300">
          부등식 하나가 좌표평면을 두 쪽으로 갈라요. <b className="text-emerald-200">윗부분인지 아랫부분인지</b>,
          경계선은 <b className="text-amber-200">실선인지 점선인지</b> 직접 그려 보고, 점을 찍어 넣고 빼며 확인해 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "draw"} onClick={() => setTab("draw")}>① 영역 그리기</TabButton>
        <TabButton active={tab === "pick"} onClick={() => setTab("pick")}>② 어느 부분일까</TabButton>
        <TabButton active={tab === "game"} onClick={() => setTab("game")}>③ 이 점, 들어갈까</TabButton>
      </div>

      <div className="mt-4">
        {tab === "draw" ? <DrawTab /> : null}
        {tab === "pick" ? <PickTab /> : null}
        {tab === "game" ? <GameTab /> : null}
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
type Pt = [number, number];
type Marker = { x: number; y: number; fill: string; ring?: string; label?: string };

/** 반평면으로 다각형을 잘라 낸다 (직선·세로선만) */
function clipPoly(poly: Pt[], q: Ineq): Pt[] {
  if (q.kind === "circle") return poly;
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i];
    const B = poly[(i + 1) % poly.length];
    const va = slack(q, A[0], A[1]);
    const vb = slack(q, B[0], B[1]);
    if (va >= 0) out.push(A);
    if (va >= 0 !== vb >= 0) {
      const t = va / (va - vb);
      out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
    }
  }
  return out;
}

const FULL = { S: 360, ML: 30, MR: 18, MT: 18, MB: 30 };
const MINI = { S: 126, ML: 9, MR: 9, MT: 9, MB: 9 };

function Plane({
  ineqs,
  showRegion = true,
  xMin,
  xMax,
  yMin,
  yMax,
  grid = 1,
  tick = 2,
  markers = [],
  onPick,
  compact = false,
  uid,
  strokes,
  fill = "#34d399",
  axisX = "x",
  axisY = "y",
  borderLabels = false,
}: {
  ineqs: Ineq[];
  showRegion?: boolean;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  grid?: number;
  tick?: number;
  markers?: Marker[];
  onPick?: (x: number, y: number) => void;
  compact?: boolean;
  uid: string;
  strokes?: string[];
  fill?: string;
  axisX?: string;
  axisY?: string;
  borderLabels?: boolean;
}) {
  const G = compact ? MINI : FULL;
  const pw = G.S - G.ML - G.MR;
  const ph = G.S - G.MT - G.MB;
  const X = (v: number) => G.ML + ((v - xMin) / (xMax - xMin)) * pw;
  const Y = (v: number) => G.S - G.MB - ((v - yMin) / (yMax - yMin)) * ph;
  const cid = `rg-${uid}`;
  const x0 = X(0);
  const y0 = Y(0);
  const r = compact ? 3.4 : 5.2;

  // 영역 — 원 하나면 원으로, 그 밖에는 다각형을 잘라 만든다
  const circleOnly = ineqs.length === 1 && ineqs[0].kind === "circle" ? ineqs[0] : null;
  const cr = circleOnly ? Math.abs(X(circleOnly.r) - x0) : 0;
  let poly: Pt[] = [
    [xMin, yMin],
    [xMax, yMin],
    [xMax, yMax],
    [xMin, yMax],
  ];
  if (!circleOnly) for (const q of ineqs) poly = clipPoly(poly, q);
  const polyD = poly.length >= 3 ? `M ${poly.map((p) => `${X(p[0])},${Y(p[1])}`).join(" L ")} Z` : "";
  const outerD = `M ${X(xMin)},${Y(yMax)} L ${X(xMax)},${Y(yMax)} L ${X(xMax)},${Y(yMin)} L ${X(xMin)},${Y(yMin)} Z`;

  const gx: number[] = [];
  for (let v = Math.ceil(xMin / grid) * grid; v <= xMax + 1e-9; v += grid) gx.push(Number(v.toFixed(6)));
  const gy: number[] = [];
  for (let v = Math.ceil(yMin / grid) * grid; v <= yMax + 1e-9; v += grid) gy.push(Number(v.toFixed(6)));
  const tx = gx.filter((v) => Math.abs(v % tick) < 1e-9 && v !== 0);
  const ty = gy.filter((v) => Math.abs(v % tick) < 1e-9 && v !== 0);

  const handle = onPick
    ? (ev: React.MouseEvent<SVGSVGElement>) => {
        const box = ev.currentTarget.getBoundingClientRect();
        const px = ((ev.clientX - box.left) / box.width) * G.S;
        const py = ((ev.clientY - box.top) / box.height) * G.S;
        const mx = Math.round(xMin + ((px - G.ML) / pw) * (xMax - xMin));
        const my = Math.round(yMin + ((G.S - G.MB - py) / ph) * (yMax - yMin));
        if (mx < xMin || mx > xMax || my < yMin || my > yMax) return;
        onPick(mx, my);
      }
    : undefined;

  return (
    <div className={compact ? "" : "rounded-2xl border border-white/10 bg-slate-900/40 p-2"}>
      <svg
        viewBox={`0 0 ${G.S} ${G.S}`}
        className={"h-auto w-full " + (onPick ? "cursor-crosshair " : "") + (compact ? "" : "min-w-[260px]")}
        role="img"
        aria-label="부등식의 영역을 나타낸 좌표평면"
        onClick={handle}
      >
        <defs>
          <clipPath id={cid}>
            <rect x={G.ML} y={G.MT} width={pw} height={ph} />
          </clipPath>
        </defs>
        <rect x={0} y={0} width={G.S} height={G.S} rx={compact ? 8 : 10} fill="#0b1220" />

        {gx.map((v) => (
          <line key={`gx${v}`} x1={X(v)} y1={G.MT} x2={X(v)} y2={G.S - G.MB} stroke="rgba(148,163,184,0.10)" strokeWidth={0.7} />
        ))}
        {gy.map((v) => (
          <line key={`gy${v}`} x1={G.ML} y1={Y(v)} x2={G.S - G.MR} y2={Y(v)} stroke="rgba(148,163,184,0.10)" strokeWidth={0.7} />
        ))}

        {/* 영역 */}
        {showRegion ? (
          <g clipPath={`url(#${cid})`}>
            {circleOnly ? (
              circleOnly.op < 2 ? (
                <path
                  d={`${outerD} M ${x0 - cr},${y0} A ${cr},${cr} 0 1,0 ${x0 + cr},${y0} A ${cr},${cr} 0 1,0 ${x0 - cr},${y0} Z`}
                  fill={fill}
                  fillOpacity={0.2}
                  fillRule="evenodd"
                />
              ) : (
                <circle cx={x0} cy={y0} r={cr} fill={fill} fillOpacity={0.2} />
              )
            ) : polyD ? (
              <path d={polyD} fill={fill} fillOpacity={0.2} />
            ) : null}
          </g>
        ) : null}

        {/* 축 */}
        <line x1={G.ML} y1={y0} x2={G.S - G.MR} y2={y0} stroke="#94a3b8" strokeWidth={1.2} />
        <line x1={x0} y1={G.S - G.MB} x2={x0} y2={G.MT} stroke="#94a3b8" strokeWidth={1.2} />
        <polygon points={`${G.S - G.MR},${y0} ${G.S - G.MR - 6},${y0 - 3} ${G.S - G.MR - 6},${y0 + 3}`} fill="#94a3b8" />
        <polygon points={`${x0},${G.MT} ${x0 - 3},${G.MT + 6} ${x0 + 3},${G.MT + 6}`} fill="#94a3b8" />

        {/* 경계선 */}
        <g clipPath={`url(#${cid})`}>
          {ineqs.map((q, i) => {
            if (q.hidden) return null;
            const col = strokes?.[i] ?? "#34d399";
            const dash = OP_SOLID[q.op] ? undefined : "6 4";
            if (q.kind === "circle")
              return <circle key={i} cx={x0} cy={y0} r={Math.abs(X(q.r) - x0)} fill="none" stroke={col} strokeWidth={compact ? 1.8 : 2.6} strokeDasharray={dash} />;
            if (q.kind === "vline")
              return <line key={i} x1={X(q.c)} y1={G.MT} x2={X(q.c)} y2={G.S - G.MB} stroke={col} strokeWidth={compact ? 1.8 : 2.6} strokeDasharray={dash} />;
            return (
              <line
                key={i}
                x1={X(xMin)}
                y1={Y(q.a * xMin + q.b)}
                x2={X(xMax)}
                y2={Y(q.a * xMax + q.b)}
                stroke={col}
                strokeWidth={compact ? 1.8 : 2.6}
                strokeDasharray={dash}
              />
            );
          })}
        </g>

        {/* 눈금 — 축 위에 적는다 */}
        {!compact
          ? tx.map((v) => (
              <text key={`tx${v}`} x={X(v)} y={y0 + 13} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">
                {v}
              </text>
            ))
          : null}
        {!compact
          ? ty.map((v) => (
              <text key={`ty${v}`} x={x0 - 6} y={Y(v)} dy={3} textAnchor="end" fill="#64748b" fontSize={9} fontFamily="monospace">
                {v}
              </text>
            ))
          : null}

        {/* 점 — clip 밖에 그려 잘리지 않게 */}
        {markers.map((mk, i) => (
          <g key={i}>
            {mk.ring ? <circle cx={X(mk.x)} cy={Y(mk.y)} r={r + 4} fill="none" stroke={mk.ring} strokeWidth={2} /> : null}
            <circle cx={X(mk.x)} cy={Y(mk.y)} r={r} fill={mk.fill} stroke="#0b1220" strokeWidth={1.4} />
            {mk.label && !compact ? (
              <text x={X(mk.x) + 8} y={Math.max(G.MT + 9, Y(mk.y) - 8)} fill={mk.fill} fontSize={10} fontWeight={700} fontFamily="monospace">
                {mk.label}
              </text>
            ) : null}
          </g>
        ))}

        {!compact ? (
          borderLabels ? (
            <g>
              <text x={G.S - G.MR} y={G.S - 6} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                {axisX}
              </text>
              <text x={4} y={12} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                {axisY}
              </text>
            </g>
          ) : (
            <g>
              <text x={G.S - G.MR - 4} y={y0 - 7} textAnchor="end" fill="#cbd5e1" fontSize={11} fontWeight={700} fontStyle="italic">
                {axisX}
              </text>
              <text x={x0 + 8} y={G.MT + 10} textAnchor="start" fill="#cbd5e1" fontSize={11} fontWeight={700} fontStyle="italic">
                {axisY}
              </text>
            </g>
          )
        ) : null}
      </svg>
    </div>
  );
}

/** 실선 · 점선 배지 */
function EdgeBadge({ op }: { op: Op }) {
  const solid = OP_SOLID[op];
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-bold " +
        (solid ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" : "border-amber-400/50 bg-amber-400/15 text-amber-100")
      }
    >
      <svg width="22" height="6" aria-hidden="true">
        <line x1="1" y1="3" x2="21" y2="3" stroke="currentColor" strokeWidth="2.4" strokeDasharray={solid ? undefined : "5 3"} />
      </svg>
      {solid ? "실선 · 경계 포함" : "점선 · 경계 제외"}
    </span>
  );
}

const OP_BTN: { op: Op; label: string }[] = [
  { op: 0, label: ">" },
  { op: 1, label: "≥" },
  { op: 2, label: "<" },
  { op: 3, label: "≤" },
];

// ══════════════════════════════════════════════════════════════
//  탭 ① 영역 그리기
// ══════════════════════════════════════════════════════════════
function DrawTab() {
  const [q, setQ] = useState<Ineq>(LAB_START);
  const [pts, setPts] = useState<Pt[]>([]);
  const [mi, setMi] = useState<number | null>(null);

  const mission = mi === null ? null : MISSIONS[mi];
  const cleared = mission !== null && missionDone(mission, q);
  const last = pts.length > 0 ? pts[pts.length - 1] : null;

  const markers: Marker[] = [];
  if (mission) {
    for (const p of mission.inPts)
      markers.push({ x: p[0], y: p[1], fill: "#60a5fa", ring: satisfies(q, p[0], p[1]) ? "#34d399" : undefined });
    for (const p of mission.outPts)
      markers.push({ x: p[0], y: p[1], fill: "#f87171", ring: !satisfies(q, p[0], p[1]) ? "#34d399" : undefined });
  }
  for (const p of pts)
    markers.push({
      x: p[0],
      y: p[1],
      fill: satisfies(q, p[0], p[1]) ? "#34d399" : "#fb7185",
      label: `(${p[0]}, ${p[1]})`,
    });

  const setKind = (kind: Ineq["kind"]) => {
    setQ(kind === "line" ? { kind: "line", a: 1, b: 0, op: 1 } : kind === "vline" ? { kind: "vline", c: 0, op: 1 } : { kind: "circle", r: 3, op: 2 });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Plane
            ineqs={[q]}
            xMin={PLANE.min}
            xMax={PLANE.max}
            yMin={PLANE.min}
            yMax={PLANE.max}
            markers={markers}
            onPick={(x, y) => setPts((p) => [...p.filter((z) => z[0] !== x || z[1] !== y), [x, y] as Pt].slice(-6))}
            uid="draw"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">🖱️ 평면을 누르면 그 자리의 점이 영역에 들어가는지 알려 줘요</span>
            <button
              type="button"
              onClick={() => setPts([])}
              className="ml-auto rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              점 지우기
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="rounded-2xl border-2 border-white/15 bg-slate-900/60 p-3">
            <div className="overflow-x-auto overflow-y-hidden py-1 text-center text-lg text-slate-100">
              <Katex expr={ineqTex(q)} />
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-lg bg-black/25 px-2 py-1 text-[11px] text-slate-300">
                경계 <Katex expr={edgeTex(q)} />
              </span>
              <EdgeBadge op={q.op} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { kind: "line" as const, emoji: "📈", label: "직선" },
              { kind: "vline" as const, emoji: "❘", label: "세로선" },
              { kind: "circle" as const, emoji: "⭕", label: "원" },
            ].map((z) => (
              <button
                key={z.kind}
                type="button"
                onClick={() => setKind(z.kind)}
                className={
                  "rounded-xl border-2 px-2 py-1.5 text-xs font-bold transition " +
                  (q.kind === z.kind ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {z.emoji} {z.label}
              </button>
            ))}
          </div>

          <div className="min-h-[92px] rounded-2xl border border-white/10 bg-slate-900/50 p-3">
            {q.kind === "line" ? (
              <div className="space-y-1.5">
                <Knob label="기울기 a" value={q.a} {...LAB_RANGE.a} onChange={(v) => setQ({ ...q, a: v })} accent="accent-emerald-400" />
                <Knob label="절편 b" value={q.b} {...LAB_RANGE.b} onChange={(v) => setQ({ ...q, b: v })} accent="accent-emerald-400" />
              </div>
            ) : q.kind === "vline" ? (
              <div className="pt-3">
                <Knob label="세로선 c" value={q.c} {...LAB_RANGE.c} onChange={(v) => setQ({ ...q, c: v })} accent="accent-emerald-400" />
              </div>
            ) : (
              <div className="pt-3">
                <Knob label="반지름 r" value={q.r} {...LAB_RANGE.r} onChange={(v) => setQ({ ...q, r: v })} accent="accent-emerald-400" />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
            <p className="text-[11px] font-bold text-slate-400">부등호를 바꿔 보세요</p>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {OP_BTN.map((z) => (
                <button
                  key={z.op}
                  type="button"
                  onClick={() => setQ({ ...q, op: z.op })}
                  className={
                    "rounded-xl border-2 py-2 text-lg font-bold transition " +
                    (q.op === z.op ? "border-amber-400/60 bg-amber-400/15 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LAB_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setQ(p.q)}
                className="rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>

          <div className="min-h-[74px] rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            {last ? (
              <div>
                <p className="text-[11px] font-bold text-slate-400">
                  점 ({last[0]}, {last[1]}) 을 대입하면
                </p>
                <div className="overflow-x-auto overflow-y-hidden py-0.5 text-slate-100">
                  <Katex expr={substTex(q, last[0], last[1])} />
                </div>
                <p className={"text-xs font-bold " + (satisfies(q, last[0], last[1]) ? "text-emerald-200" : "text-rose-200")}>
                  {satisfies(q, last[0], last[1]) ? "참 → 영역에 들어가요 ⭕" : "거짓 → 영역에 들어가지 못해요 ❌"}
                  {onBoundary(q, last[0], last[1]) ? " (경계 위의 점이에요)" : ""}
                </p>
              </div>
            ) : (
              <p className="text-xs leading-6 text-slate-400">
                💡 평면을 눌러 점을 찍으면 좌표를 대입한 결과를 여기에 보여 줄게요. 경계선 위를 눌러 보면 실선과 점선의
                차이를 또렷하게 볼 수 있어요.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.06] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-violet-200">🎯 점 가르기 미션</p>
          <span className="text-[11px] text-slate-400">파란 점만 영역 안에, 빨간 점은 모두 영역 밖에 두면 성공!</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {MISSIONS.map((m, i) => {
            const done = missionDone(m, q);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMi(mi === i ? null : i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (mi === i
                    ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {mi === i && done ? "✅ " : ""}
                {m.emoji} {m.title}
              </button>
            );
          })}
        </div>
        <div className="mt-2 min-h-[52px]">
          {mission === null ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-slate-400">
              미션을 고르면 평면에 파란 점과 빨간 점이 나타나요. 손잡이와 부등호를 움직여 두 무리를 갈라 보세요.
            </p>
          ) : cleared ? (
            <p className="rounded-xl border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-2 text-xs leading-5 text-emerald-100">
              성공이에요! 🎉 <Katex expr={ineqTex(q)} /> 하나로 두 무리를 깔끔하게 갈랐어요. 다른 부등식으로도 되는지
              찾아볼까요?
            </p>
          ) : (
            <p className="rounded-xl border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-2 text-xs leading-5 text-amber-100">
              💡 {mission.hint} (초록 테두리가 붙은 점은 조건을 만족한 점이에요)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Knob({
  label,
  value,
  min,
  max,
  step,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[11px] font-bold text-slate-400">{label}</span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"w-full " + accent}
      />
      <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-slate-100">{fmt(value)}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 어느 부분일까
// ══════════════════════════════════════════════════════════════
function PickTab() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Record<string, number>>({});

  const q = REGION_QUIZ[idx];
  const ans = quizAnswer(q);
  const chosen = picked[q.id];
  const right = chosen === ans;
  const score = REGION_QUIZ.filter((z) => picked[z.id] === quizAnswer(z)).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🔍 부등식이 나타내는 영역을 골라 보세요</p>
          <span className="font-mono text-xs text-slate-300">
            {score} / {REGION_QUIZ.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {REGION_QUIZ.map((z, i) => {
            const okz = picked[z.id] === quizAnswer(z);
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setIdx(i)}
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
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-center">
        <p className="text-[11px] font-bold text-slate-400">다음 부등식의 영역은?</p>
        <div className="overflow-x-auto overflow-y-hidden py-1 text-xl text-slate-100">
          <Katex expr={q.tex} />
        </div>
        <div className="mt-1 min-h-[30px]">
          {chosen !== undefined && q.solvedTex ? (
            <span className="inline-flex items-center gap-2 rounded-lg bg-black/25 px-2.5 py-1 text-sm text-slate-200">
              <span className="text-[11px] text-slate-400">y에 대하여 정리하면</span>
              <Katex expr={q.solvedTex} />
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {q.order.map((op, i) => {
          const on = chosen === i;
          const isAns = chosen !== undefined && i === ans;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setPicked((p) => ({ ...p, [q.id]: i }))}
              className={
                "rounded-2xl border-2 p-1.5 transition " +
                (isAns
                  ? "border-emerald-400/70 bg-emerald-400/15"
                  : on
                    ? "border-rose-400/60 bg-rose-400/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10")
              }
            >
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[11px] font-bold text-slate-300">{i + 1}</span>
                <span className="font-mono text-[10px] text-slate-500">{OP_SOLID[op] ? "실선" : "점선"}</span>
              </div>
              <Plane
                ineqs={[withOp(q.base, op)]}
                xMin={PLANE.min}
                xMax={PLANE.max}
                yMin={PLANE.min}
                yMax={PLANE.max}
                grid={2}
                compact
                uid={`pick-${q.id}-${i}`}
                fill={isAns ? "#34d399" : "#38bdf8"}
                strokes={[isAns ? "#34d399" : "#38bdf8"]}
              />
            </button>
          );
        })}
      </div>

      <div className="min-h-[68px]">
        {chosen === undefined ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-slate-400">
            💡 먼저 <b className="text-slate-200">y에 대하여 정리</b>한 뒤 윗부분인지 아랫부분인지 정하고, 등호가 있는지
            보고 실선·점선을 가려 보세요.
          </p>
        ) : right ? (
          <div className="rounded-xl border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-4 py-3">
            <p className="text-xs leading-6 text-emerald-100">정답이에요! ✅ {q.explain}</p>
            {idx < REGION_QUIZ.length - 1 ? (
              <button
                type="button"
                onClick={() => setIdx(idx + 1)}
                className="mt-2 rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
              >
                다음 문제로 →
              </button>
            ) : null}
          </div>
        ) : (
          <p className="rounded-xl border-l-4 border-amber-400 bg-amber-400/[0.08] px-4 py-3 text-xs leading-6 text-amber-100">
            아직이에요. 초록 테두리가 정답이에요. {q.explain}
          </p>
        )}
      </div>

      {score === REGION_QUIZ.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🎉 일곱 문제를 모두 맞혔어요!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">
            부등식의 영역을 고르는 열쇠는 딱 둘이에요 — <b className="text-sky-200">y에 대하여 정리했을 때의 부등호
            방향</b>과 <b className="text-amber-200">등호가 있는지 없는지</b>.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 이 점, 들어갈까
// ══════════════════════════════════════════════════════════════
function GameTab() {
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState<Record<string, boolean>>({});

  const g = POINT_GAME[idx];
  const truth = satisfies(g.q, g.p[0], g.p[1]);
  const given = ans[g.id];
  const answered = given !== undefined;
  const right = given === truth;

  const score = POINT_GAME.filter((z) => ans[z.id] === satisfies(z.q, z.p[0], z.p[1])).length;
  const done = POINT_GAME.filter((z) => ans[z.id] !== undefined).length;
  let streak = 0;
  for (const z of POINT_GAME) {
    if (ans[z.id] === undefined) break;
    if (ans[z.id] === satisfies(z.q, z.p[0], z.p[1])) streak++;
    else streak = 0;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🎯 점이 영역에 들어갈까요?</p>
          <span className="font-mono text-xs text-slate-300">
            {score} / {POINT_GAME.length} {streak >= 3 ? `· 🔥 ${streak}연속` : ""}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {POINT_GAME.map((z, i) => {
            const a = ans[z.id];
            const okz = a !== undefined && a === satisfies(z.q, z.p[0], z.p[1]);
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setIdx(i)}
                className={
                  "h-7 w-7 rounded-lg border text-[11px] font-bold transition " +
                  (idx === i
                    ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                    : a === undefined
                      ? "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                      : okz
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                        : "border-rose-400/40 bg-rose-400/10 text-rose-200")
                }
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Plane
          ineqs={[g.q]}
          showRegion={answered}
          xMin={PLANE.min}
          xMax={PLANE.max}
          yMin={PLANE.min}
          yMax={PLANE.max}
          markers={[{ x: g.p[0], y: g.p[1], fill: answered ? (truth ? "#34d399" : "#fb7185") : "#fbbf24", ring: "#fde68a", label: `(${g.p[0]}, ${g.p[1]})` }]}
          uid={`game-${g.id}`}
        />

        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-white/15 bg-slate-900/60 p-4 text-center">
            <p className="text-[11px] font-bold text-slate-400">부등식</p>
            <div className="overflow-x-auto overflow-y-hidden py-1 text-2xl text-slate-100">
              <Katex expr={ineqTex(g.q)} />
            </div>
            <div className="mt-1 flex justify-center">
              <EdgeBadge op={g.q.op} />
            </div>
            <p className="mt-2 text-[11px] font-bold text-slate-400">이 점은 영역에 들어갈까요?</p>
            <p className="font-mono text-2xl font-bold text-amber-100">
              ({g.p[0]}, {g.p[1]})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { v: true, label: "⭕ 들어간다" },
              { v: false, label: "❌ 안 들어간다" },
            ].map((z) => {
              const on = given === z.v;
              const isAns = answered && z.v === truth;
              return (
                <button
                  key={String(z.v)}
                  type="button"
                  disabled={answered}
                  onClick={() => setAns((p) => ({ ...p, [g.id]: z.v }))}
                  className={
                    "rounded-xl border-2 px-3 py-3 text-sm font-bold transition disabled:opacity-90 " +
                    (isAns
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : on
                        ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  {z.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-[104px]">
            {answered ? (
              <div
                className={
                  "rounded-xl border-l-4 px-3 py-2 " +
                  (right ? "border-emerald-400 bg-emerald-400/[0.08]" : "border-amber-400 bg-amber-400/[0.08]")
                }
              >
                <p className={"text-xs font-bold " + (right ? "text-emerald-100" : "text-amber-100")}>
                  {right ? "정답이에요! ✅" : "아쉬워요 — 대입해 볼까요?"}
                </p>
                <div className="overflow-x-auto overflow-y-hidden py-1 text-slate-100">
                  <Katex expr={substTex(g.q, g.p[0], g.p[1])} />
                </div>
                <p className="text-xs leading-5 text-slate-200">{g.explain}</p>
                {idx < POINT_GAME.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setIdx(idx + 1)}
                    className="mt-2 rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
                  >
                    다음 점으로 →
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-6 text-slate-400">
                💡 경계선이 <b className="text-emerald-200">실선</b>이면 경계 위의 점도 영역에 들어가고,{" "}
                <b className="text-amber-200">점선</b>이면 들어가지 못해요. 답을 고르면 영역을 칠해 줄게요.
              </p>
            )}
          </div>
        </div>
      </div>

      {done === POINT_GAME.length ? (
        <div
          className={
            "rounded-2xl border-2 p-4 text-center " +
            (score === POINT_GAME.length ? "border-emerald-400/45 bg-emerald-400/[0.10]" : "border-white/15 bg-white/[0.04]")
          }
        >
          <p className="text-lg font-bold text-emerald-100">
            {score === POINT_GAME.length ? "🏅 열 문제를 모두 맞혔어요!" : `기록: ${score} / ${POINT_GAME.length}`}
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">
            점이 영역에 들어가는지는 <b className="text-sky-200">좌표를 그대로 대입</b>해 부등식이 참인지 보면 돼요.
            경계 위의 점은 <b className="text-amber-200">등호가 있을 때만</b> 들어간다는 것도 잊지 마세요.
          </p>
          <button
            type="button"
            onClick={() => {
              setAns({});
              setIdx(0);
            }}
            className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 다시 풀기
          </button>
        </div>
      ) : null}
    </div>
  );
}
