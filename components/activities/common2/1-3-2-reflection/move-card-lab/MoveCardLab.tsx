"use client";

import { useEffect, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CARD_META,
  CARD_ORDER,
  MAX_CARDS,
  MAX_REPEAT,
  MISSIONS,
  PAIRS,
  SYM_MOVE,
  SYM_QUIZ,
  SYM_STATES,
  SYM_STATE_META,
  isMove,
  ruleOk,
  runCards,
  symPos,
  walk,
  type Card,
  type CardKind,
  type Mission,
  type Pair,
  type Pt,
  type SymState,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_symmetry",
    prompt:
      "평행이동 카드는 오른쪽과 위쪽으로만 갈 수 있는데도 왼쪽·아래쪽에 있는 목표에 도착할 수 있었어요. 어떻게 가능했는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 반복 횟수가 자연수라 평행이동만으로는 오른쪽·위쪽으로만 간다. 하지만 원점 대칭이나 y = x 대칭을 쓰면 점이 반대편으로 넘어가므로, 대칭으로 방향을 바꾼 뒤 다시 평행이동하면 왼쪽이나 아래쪽 목표에도 도착할 수 있다.",
  },
  {
    id: "order_matters",
    prompt:
      "탭②에서 같은 카드 두 장의 순서만 바꿔 보았어요. 어떤 짝은 결과가 같고 어떤 짝은 달랐나요? 규칙을 찾아 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 평행이동끼리, 또 대칭끼리는 순서를 바꿔도 결과가 같았다. 하지만 평행이동과 대칭을 섞으면 순서에 따라 도착점이 달라졌다. 대칭이 좌표의 부호나 자리를 바꿔 버려서 그다음 평행이동이 다른 방향처럼 작용하기 때문이다.",
  },
  {
    id: "four_places",
    prompt:
      "탭③에서 대칭 카드만 계속 눌러도 갈 수 있는 자리가 네 군데뿐이었어요. 왜 그런지, 그리고 네 번째 자리가 어떤 대칭이었는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 원점 대칭과 y = x 대칭은 각각 두 번 하면 제자리로 돌아오고, 두 대칭을 이어 하면 (−y, −x) 가 되어 직선 y = −x 에 대한 대칭과 같아진다. 그래서 아무리 눌러도 처음 자리·원점 대칭·y = x 대칭·y = −x 대칭 네 군데를 벗어날 수 없다.",
  },
];

// ─── 좌표평면 ─────────────────────────────────────────────────
const PAD = 26;
const SPAN = 360;
const VB = SPAN + PAD * 2;

type View = { half: number; step: number; u: number; sx: (v: number) => number; sy: (v: number) => number };

function makeView(half: number): View {
  const u = SPAN / (2 * half);
  const step = half <= 6 ? 1 : half <= 10 ? 2 : 4;
  return { half, step, u, sx: (v) => PAD + (v + half) * u, sy: (v) => PAD + (half - v) * u };
}

function Grid({ view }: { view: View }) {
  const lines: number[] = [];
  for (let v = -view.half; v <= view.half; v += view.step) lines.push(v);
  return (
    <g>
      {lines.map((v) => (
        <line key={`vx${v}`} x1={view.sx(v)} y1={view.sy(view.half)} x2={view.sx(v)} y2={view.sy(-view.half)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      ))}
      {lines.map((v) => (
        <line key={`hy${v}`} x1={view.sx(-view.half)} y1={view.sy(v)} x2={view.sx(view.half)} y2={view.sy(v)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      ))}
      <line x1={view.sx(-view.half)} y1={view.sy(0)} x2={view.sx(view.half)} y2={view.sy(0)} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
      <line x1={view.sx(0)} y1={view.sy(-view.half)} x2={view.sx(0)} y2={view.sy(view.half)} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
      {lines
        .filter((v) => v !== 0)
        .map((v) => (
          <text key={`tx${v}`} x={view.sx(v)} y={view.sy(0) + 12} textAnchor="middle" className="fill-slate-500 font-mono text-[8px]">
            {v}
          </text>
        ))}
      {lines
        .filter((v) => v !== 0)
        .map((v) => (
          <text key={`ty${v}`} x={view.sx(0) - 5} y={view.sy(v) + 3} textAnchor="end" className="fill-slate-500 font-mono text-[8px]">
            {v}
          </text>
        ))}
      <text x={view.sx(view.half) - 2} y={view.sy(0) - 6} textAnchor="end" className="fill-slate-400 text-[10px] italic">
        x
      </text>
      <text x={view.sx(0) + 8} y={view.sy(view.half) + 8} className="fill-slate-400 text-[10px] italic">
        y
      </text>
    </g>
  );
}

function Plane({ cid, view, svgRef, label, children }: { cid: string; view: View; svgRef?: React.Ref<SVGSVGElement>; label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg ref={svgRef} viewBox={`0 0 ${VB} ${VB}`} className="mx-auto block w-full max-w-[440px] touch-none select-none" role="img" aria-label={label}>
        <defs>
          <clipPath id={cid}>
            <rect x={PAD} y={PAD} width={SPAN} height={SPAN} />
          </clipPath>
        </defs>
        <Grid view={view} />
        {children}
      </svg>
    </div>
  );
}

function Clipped({ cid, children }: { cid: string; children: React.ReactNode }) {
  return <g clipPath={`url(#${cid})`}>{children}</g>;
}

function Arrow({ view, a, b, color, width = 2.5, faint }: { view: View; a: Pt; b: Pt; color: string; width?: number; faint?: boolean }) {
  const x1 = view.sx(a.x);
  const y1 = view.sy(a.y);
  const x2 = view.sx(b.x);
  const y2 = view.sy(b.y);
  if (Math.hypot(x2 - x1, y2 - y1) < 2) return null;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const L = 9;
  return (
    <g opacity={faint ? 0.25 : 1}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} />
      <path d={`M${x2},${y2} L${x2 - L * Math.cos(ang - 0.4)},${y2 - L * Math.sin(ang - 0.4)} L${x2 - L * Math.cos(ang + 0.4)},${y2 - L * Math.sin(ang + 0.4)} Z`} fill={color} />
    </g>
  );
}

function Dot({ view, p, color, label, onDown, r = 6 }: { view: View; p: Pt; color: string; label?: string; onDown?: () => void; r?: number }) {
  return (
    <g
      className={onDown ? "cursor-grab touch-none" : undefined}
      onPointerDown={
        onDown
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              onDown();
            }
          : undefined
      }
    >
      {onDown ? <circle cx={view.sx(p.x)} cy={view.sy(p.y)} r={17} fill="transparent" /> : null}
      <circle cx={view.sx(p.x)} cy={view.sy(p.y)} r={r} fill={color} stroke="#0f172a" strokeWidth={2} />
      {label ? (
        <text x={view.sx(p.x)} y={view.sy(p.y) - 12} textAnchor="middle" className="fill-white font-mono text-[10px] font-bold">
          {label}
        </text>
      ) : null}
    </g>
  );
}

function Star({ view, p, color }: { view: View; p: Pt; color: string }) {
  const cx = view.sx(p.x);
  const cy = view.sy(p.y);
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? 13 : 6;
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
  }
  return <polygon points={pts.join(" ")} fill={`${color}55`} stroke={color} strokeWidth={2} />;
}

function useDrag(svgRef: React.RefObject<SVGSVGElement | null>, view: View, onDrag: (p: Pt) => void) {
  const [on, setOn] = useState(false);
  const cb = useRef(onDrag);
  const vw = useRef(view);
  useEffect(() => {
    cb.current = onDrag;
    vw.current = view;
  });
  useEffect(() => {
    if (!on) return;
    function move(e: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const px = (e.clientX - rect.left) * (VB / rect.width);
      const py = (e.clientY - rect.top) * (VB / rect.height);
      const v = vw.current;
      cb.current({ x: (px - PAD) / v.u - v.half, y: v.half - (py - PAD) / v.u });
    }
    function up() {
      setOn(false);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [on, svgRef]);
  return { start: () => setOn(true) };
}

function clampInt(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

// ─── 카드 UI ──────────────────────────────────────────────────
function CardFace({
  kind,
  n,
  onN,
  small,
}: {
  kind: CardKind;
  n?: number;
  onN?: (v: number) => void;
  small?: boolean;
}) {
  const m = CARD_META[kind];
  return (
    <div className="relative rounded-xl border-2 px-2 py-2 text-center" style={{ borderColor: `${m.color}88`, background: `${m.color}18` }}>
      <p className={"font-bold leading-4 text-slate-100 " + (small ? "text-[10px]" : "text-[11px]")}>{m.title}</p>
      <p className={"leading-4 text-slate-200 " + (small ? "text-[10px]" : "text-[11px]")}>{m.sub}</p>
      {m.repeat ? (
        <div className="mt-1 flex items-center justify-center gap-1 rounded-lg border border-emerald-400/45 bg-emerald-400/15 px-2 py-0.5">
          {onN ? (
            <input
              type="number"
              min={1}
              max={MAX_REPEAT}
              value={n ?? 1}
              aria-label="반복 횟수"
              onChange={(e) => onN(Math.max(1, Math.min(MAX_REPEAT, Math.round(Number(e.target.value) || 1))))}
              className="w-9 rounded border border-white/20 bg-slate-950 px-1 py-0.5 text-center font-mono text-[11px] font-bold text-white outline-none"
            />
          ) : (
            <span className="inline-block w-5 rounded border border-white/25 bg-slate-950 text-center font-mono text-[11px] font-bold text-white">{n ?? ""}</span>
          )}
          <span className="text-[10px] font-bold text-emerald-100">회 반복</span>
        </div>
      ) : null}
      <p className="mt-1 text-[9px] font-bold" style={{ color: m.color }}>
        [ 행동 카드 {m.no} ]
      </p>
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "play" | "order" | "secret";

export default function MoveCardLab() {
  const [tab, setTab] = useState<Tab>("play");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🃏 이동 카드 놀이</h3>
        <p className="mt-2 leading-7 text-slate-300">
          네 장의 <b className="text-amber-200">행동 카드</b>를 왼쪽부터 늘어놓아 점을 목표까지 옮겨 보세요. 평행이동은 <b className="text-sky-200">오른쪽·위쪽</b>으로만 가니, 나머지는{" "}
          <b className="text-violet-200">대칭</b>의 힘을 빌려야 해요!
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "play"} onClick={() => setTab("play")}>
          ① 카드로 점 옮기기 🎯
        </TabButton>
        <TabButton active={tab === "order"} onClick={() => setTab("order")}>
          ② 순서를 바꾸면? 🔀
        </TabButton>
        <TabButton active={tab === "secret"} onClick={() => setTab("secret")}>
          ③ 대칭 카드의 비밀 🔮
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "play" ? <PlayTab /> : null}
        {tab === "order" ? <OrderTab /> : null}
        {tab === "secret" ? <SecretTab /> : null}
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
            (i === cur ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100" : done.includes(id) ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
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

// ══════════════════════════════════════════════════════════════
// 탭 ① 카드로 점 옮기기
// ══════════════════════════════════════════════════════════════
function PlayTab() {
  const [mi, setMi] = useState(0);
  const [cleared, setCleared] = useState<string[]>([]);
  const m = MISSIONS[mi];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎯 카드를 늘어놓아 별까지 옮기세요</p>
          <Chips ids={MISSIONS.map((x) => x.id)} cur={mi} done={cleared} onPick={setMi} />
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
            ① 평행이동 카드 <b className="text-sky-200">한 장 이상</b>, 대칭 카드 <b className="text-violet-200">한 장 이상</b>을 반드시 쓴다
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
            ② 반복 횟수는 <b className="text-emerald-200">자연수</b> · 카드는 <b className="text-white">왼쪽부터 차례대로</b> 실행된다
          </p>
        </div>
      </div>

      <PlayOne key={m.id} m={m} onCleared={() => setCleared((s) => (s.includes(m.id) ? s : [...s, m.id]))} />
    </div>
  );
}

function PlayOne({ m, onCleared }: { m: Mission; onCleared: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hint, setHint] = useState(false);

  const view = makeView(8);
  const pts = walk(m.start, cards);
  const end = pts[pts.length - 1];
  const ok = ruleOk(cards) && end.x === m.goal.x && end.y === m.goal.y;
  const stars = !ok ? 0 : cards.length <= m.min ? 3 : cards.length === m.min + 1 ? 2 : 1;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setShown((s) => {
        if (s >= pts.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 320);
    return () => window.clearInterval(id);
  }, [playing, pts.length]);

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onCleared();
    }
  });

  function add(k: CardKind) {
    if (cards.length >= MAX_CARDS) return;
    setCards((c) => [...c, { kind: k, n: isMove(k) ? 1 : 0 }]);
    setShown(0);
    setPlaying(false);
  }
  function edit(i: number, patch: Partial<Card>) {
    setCards((c) => c.map((x, k) => (k === i ? { ...x, ...patch } : x)));
    setShown(0);
    setPlaying(false);
  }
  function remove(i: number) {
    setCards((c) => c.filter((_, k) => k !== i));
    setShown(0);
    setPlaying(false);
  }
  function swap(i: number, j: number) {
    if (j < 0 || j >= cards.length) return;
    setCards((c) => {
      const n = [...c];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
    setShown(0);
    setPlaying(false);
  }

  // 걸음마다 어떤 카드였는지
  const stepKind: CardKind[] = [];
  cards.forEach((c) => {
    if (isMove(c.kind)) for (let k = 0; k < Math.max(1, c.n); k++) stepKind.push(c.kind);
    else stepKind.push(c.kind);
  });
  const view0 = shown > 0 ? shown : pts.length - 1;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={"rounded-2xl border p-3 transition " + (ok ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04]")}>
        <Plane cid={`play-${m.id}`} view={view} label="카드로 점 옮기기">
          <Clipped cid={`play-${m.id}`}>
            {pts.slice(0, -1).map((p, i) => (
              <Arrow key={i} view={view} a={p} b={pts[i + 1]} color={CARD_META[stepKind[i]].color} faint={i >= view0} />
            ))}
          </Clipped>
          <Star view={view} p={m.goal} color={ok ? "#34d399" : "#fbbf24"} />
          <Dot view={view} p={m.start} color="#64748b" r={6} label={`시작 (${m.start.x}, ${m.start.y})`} />
          <Dot view={view} p={pts[Math.min(view0, pts.length - 1)]} color={ok ? "#34d399" : "#f472b6"} r={7} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          목표 <b className="text-amber-200">({m.goal.x}, {m.goal.y})</b> · 지금 도착점{" "}
          <b className={ok ? "text-emerald-200" : "text-pink-200"}>({end.x}, {end.y})</b>
        </p>
      </div>

      <div className="space-y-3">
        <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (ok ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
          {ok ? (
            <>
              <p className="text-base font-extrabold text-emerald-100">{"⭐".repeat(stars)} 도착!</p>
              <p className="mt-0.5 text-[11px] text-emerald-200">
                카드 {cards.length}장 사용 · 가장 적게 쓰면 {m.min}장
                {stars === 3 ? " — 최소 카드예요!" : ""}
              </p>
            </>
          ) : (
            <p className="text-sm font-bold text-slate-400">
              {cards.length === 0 ? "아래 덱에서 카드를 골라 놓아 보세요" : !ruleOk(cards) ? "평행이동 카드와 대칭 카드를 모두 써야 해요" : "아직 별에 닿지 않았어요"}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-[11px] font-bold text-slate-400">🃏 카드 덱 — 눌러서 오른쪽 끝에 놓기</p>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {CARD_ORDER.map((k) => (
              <button key={k} type="button" onClick={() => add(k)} disabled={cards.length >= MAX_CARDS} className="text-left transition hover:brightness-125 disabled:opacity-35">
                <CardFace kind={k} n={1} small />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold text-slate-400">📋 놓은 카드 (왼쪽부터 실행)</p>
            <div className="flex gap-1.5">
              <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (cards.some((c) => isMove(c.kind)) ? "bg-sky-400/25 text-sky-100" : "bg-white/5 text-slate-500")}>
                평행이동 {cards.some((c) => isMove(c.kind)) ? "✓" : "✗"}
              </span>
              <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (cards.some((c) => !isMove(c.kind)) ? "bg-violet-400/25 text-violet-100" : "bg-white/5 text-slate-500")}>
                대칭 {cards.some((c) => !isMove(c.kind)) ? "✓" : "✗"}
              </span>
            </div>
          </div>
          {cards.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-white/15 px-3 py-5 text-center text-[11px] text-slate-500">아직 놓은 카드가 없어요</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {cards.map((c, i) => (
                <div key={i} className="w-[112px]">
                  <CardFace kind={c.kind} n={c.n} onN={(v) => edit(i, { n: v })} small />
                  <div className="mt-1 flex gap-1">
                    <button type="button" onClick={() => swap(i, i - 1)} className="flex-1 rounded-md bg-white/5 py-0.5 text-[10px] font-bold text-slate-300 hover:bg-white/10">
                      ◀
                    </button>
                    <button type="button" onClick={() => remove(i)} className="flex-1 rounded-md bg-rose-400/15 py-0.5 text-[10px] font-bold text-rose-200 hover:bg-rose-400/25">
                      ✕
                    </button>
                    <button type="button" onClick={() => swap(i, i + 1)} className="flex-1 rounded-md bg-white/5 py-0.5 text-[10px] font-bold text-slate-300 hover:bg-white/10">
                      ▶
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShown(0);
                setPlaying(true);
              }}
              disabled={cards.length === 0}
              className="flex-1 rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/25 disabled:opacity-35"
            >
              ▶ 한 걸음씩 실행
            </button>
            <button
              type="button"
              onClick={() => {
                setCards([]);
                setShown(0);
                setPlaying(false);
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 비우기
            </button>
            <button
              type="button"
              onClick={() => setHint((v) => !v)}
              className="rounded-xl border border-amber-400/45 bg-amber-400/10 px-3 py-2 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
            >
              💡
            </button>
          </div>
          {hint ? <p className="mt-2 rounded-lg bg-amber-400/12 px-3 py-2 text-[11px] leading-5 text-amber-100">{m.hint}</p> : null}
          {cards.length ? (
            <div className="mt-2 rounded-lg bg-black/25 px-3 py-2">
              <p className="text-[10px] font-bold text-slate-500">카드마다의 도착점</p>
              <p className="mt-0.5 font-mono text-[11px] leading-5 text-slate-200">
                {runCards(m.start, cards)
                  .map((p) => `(${p.x}, ${p.y})`)
                  .join(" → ")}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 순서를 바꾸면?
// ══════════════════════════════════════════════════════════════
function OrderTab() {
  const [pi, setPi] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const p = PAIRS[pi];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔀 같은 카드 두 장, 순서만 바꾸면 결과도 같을까요?</p>
          <Chips ids={PAIRS.map((x) => x.id)} cur={pi} done={done} onPick={setPi} />
        </div>
      </div>

      <OrderOne key={p.id} p={p} onDone={() => setDone((s) => (s.includes(p.id) ? s : [...s, p.id]))} />

      {done.length === PAIRS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 규칙을 찾았나요?</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-black/25 px-3 py-2 text-center">
              <p className="text-xs font-bold text-emerald-200">순서를 바꿔도 같아요</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-300">평행이동 ↔ 평행이동
                <br />대칭 ↔ 대칭</p>
            </div>
            <div className="rounded-xl bg-black/25 px-3 py-2 text-center">
              <p className="text-xs font-bold text-rose-200">순서가 중요해요</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-300">평행이동 ↔ 대칭
                <br />(섞으면 도착점이 달라져요)</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OrderOne({ p, onDone }: { p: Pair; onDone: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [S, setS] = useState<Pt>({ x: 2, y: 1 });
  const [pick, setPick] = useState<boolean | null>(null);

  const view = makeView(8);
  const { start } = useDrag(svgRef, view, (q) => setS({ x: clampInt(q.x, -6, 6), y: clampInt(q.y, -6, 6) }));

  const ab = runCards(S, [p.a, p.b]);
  const ba = runCards(S, [p.b, p.a]);
  const equal = ab[2].x === ba[2].x && ab[2].y === ba[2].y;
  const ok = pick !== null && pick === p.same;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
        <Plane cid={`ord-${p.id}`} view={view} svgRef={svgRef} label="순서 비교">
          <Clipped cid={`ord-${p.id}`}>
            {ok ? (
              <>
                <Arrow view={view} a={ab[0]} b={ab[1]} color="#38bdf8" />
                <Arrow view={view} a={ab[1]} b={ab[2]} color="#38bdf8" />
                <Arrow view={view} a={ba[0]} b={ba[1]} color="#f472b6" width={2} />
                <Arrow view={view} a={ba[1]} b={ba[2]} color="#f472b6" width={2} />
              </>
            ) : null}
          </Clipped>
          {ok ? (
            <>
              <Dot view={view} p={ab[2]} color="#38bdf8" r={7} label={`A (${ab[2].x}, ${ab[2].y})`} />
              <Dot view={view} p={ba[2]} color="#f472b6" r={6} label={`B (${ba[2].x}, ${ba[2].y})`} />
            </>
          ) : null}
          <Dot view={view} p={S} color="#e2e8f0" r={7} label={`P(${S.x}, ${S.y})`} onDown={start} />
        </Plane>
        <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 흰 점을 끌어 다른 자리에서도 확인해 보세요</p>
      </div>

      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-sky-400/45 bg-sky-400/[0.08] p-3">
            <p className="text-[11px] font-bold text-sky-200">순서 A</p>
            <div className="mt-1.5 space-y-1.5">
              <CardFace kind={p.a.kind} n={p.a.n} small />
              <p className="text-center text-[11px] text-slate-500">↓</p>
              <CardFace kind={p.b.kind} n={p.b.n} small />
            </div>
          </div>
          <div className="rounded-2xl border-2 border-pink-400/45 bg-pink-400/[0.08] p-3">
            <p className="text-[11px] font-bold text-pink-200">순서 B</p>
            <div className="mt-1.5 space-y-1.5">
              <CardFace kind={p.b.kind} n={p.b.n} small />
              <p className="text-center text-[11px] text-slate-500">↓</p>
              <CardFace kind={p.a.kind} n={p.a.n} small />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
          <p className="text-sm font-bold text-cyan-100">두 순서의 도착점이 같을까요?</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {[true, false].map((v) => {
              const on = pick === v;
              const good = pick !== null && v === p.same;
              const bad = on && v !== p.same;
              return (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setPick(v)}
                  disabled={ok}
                  className={
                    "rounded-xl border-2 px-3 py-2 text-sm font-bold transition disabled:cursor-default " +
                    (good ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : bad ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  {v ? "⭕ 같아요" : "❌ 달라요"}
                </button>
              );
            })}
          </div>
          {pick !== null && !ok ? <p className="mt-1.5 text-[11px] font-bold text-rose-200">다시 생각해 보세요!</p> : null}
          {ok ? (
            <div className="mt-2 space-y-1.5">
              <div className="rounded-lg bg-black/25 px-3 py-2">
                <p className="font-mono text-[11px] leading-5 text-sky-200">A : {ab.map((q) => `(${q.x}, ${q.y})`).join(" → ")}</p>
                <p className="font-mono text-[11px] leading-5 text-pink-200">B : {ba.map((q) => `(${q.x}, ${q.y})`).join(" → ")}</p>
              </div>
              <p className={"rounded-lg px-3 py-2 text-xs leading-6 " + (equal ? "bg-emerald-400/12 text-emerald-100" : "bg-rose-400/12 text-rose-100")}>
                {equal ? "✅ 도착점이 같아요! " : "❌ 도착점이 달라요! "}
                {p.why}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 대칭 카드의 비밀
// ══════════════════════════════════════════════════════════════
function SecretTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [P, setP] = useState<Pt>({ x: 3, y: 5 });
  const [st, setSt] = useState<SymState>("I");
  const [seen, setSeen] = useState<SymState[]>(["I"]);
  const [pick, setPick] = useState<number | null>(null);

  const view = makeView(8);
  const { start } = useDrag(svgRef, view, (q) => {
    setP({ x: clampInt(q.x, -6, 6), y: clampInt(q.y, -6, 6) });
  });

  function press(k: "so" | "sd") {
    const ns = SYM_MOVE[st][k];
    setSt(ns);
    setSeen((s) => (s.includes(ns) ? s : [...s, ns]));
  }
  const allSeen = seen.length === 4;
  const quizOk = pick === SYM_QUIZ.ans;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🔮 대칭 카드만 계속 눌러 보면 어디까지 갈 수 있을까요?</p>
        <p className="mt-1 text-[11px] text-slate-400">평행이동 카드는 잠시 넣어 두고, 대칭 카드 두 장만 번갈아 눌러 보세요.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={"rounded-2xl border p-3 transition " + (allSeen ? "border-emerald-400/50 bg-emerald-400/[0.10]" : "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04]")}>
          <Plane cid="secret-plane" view={view} svgRef={svgRef} label="대칭 카드의 비밀">
            <Clipped cid="secret-plane">
              <line x1={view.sx(-8)} y1={view.sy(-8)} x2={view.sx(8)} y2={view.sy(8)} stroke="rgba(251,191,36,0.35)" strokeWidth={2} strokeDasharray="6 5" />
              <line x1={view.sx(-8)} y1={view.sy(8)} x2={view.sx(8)} y2={view.sy(-8)} stroke="rgba(244,114,182,0.35)" strokeWidth={2} strokeDasharray="6 5" />
            </Clipped>
            {SYM_STATES.map((s) => {
              const q = symPos(P, s);
              const found = seen.includes(s);
              const cur = st === s;
              return (
                <Dot
                  key={s}
                  view={view}
                  p={q}
                  color={cur ? "#34d399" : found ? SYM_STATE_META[s].color : "#334155"}
                  r={cur ? 9 : 6}
                  label={found ? `(${q.x}, ${q.y})` : undefined}
                  onDown={s === "I" ? start : undefined}
                />
              );
            })}
          </Plane>
          <p className="mt-2 text-center text-[11px] text-slate-400">🖱️ 초록 점(지금 자리)의 처음 위치를 끌어 옮길 수 있어요</p>
        </div>

        <div className="space-y-3">
          <div className={"rounded-2xl border-2 px-4 py-3 text-center " + (allSeen ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-white/5")}>
            <p className="text-[11px] font-bold text-slate-300">지금 자리</p>
            <p className="mt-0.5 text-lg font-extrabold" style={{ color: SYM_STATE_META[st].color }}>
              {SYM_STATE_META[st].label}
            </p>
            <div className="mt-1 flex justify-center text-slate-100">
              <Katex expr={SYM_STATE_META[st].tex} />
            </div>
            <p className={"mt-1 text-sm font-extrabold " + (allSeen ? "text-emerald-200" : "text-slate-400")}>
              {allSeen ? "🎉 네 자리를 모두 찾았어요 — 더는 없어요!" : `찾은 자리 ${seen.length} / 4`}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => press("so")} className="text-left transition hover:brightness-125">
                <CardFace kind="so" small />
              </button>
              <button type="button" onClick={() => press("sd")} className="text-left transition hover:brightness-125">
                <CardFace kind="sd" small />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setSt("I");
                setSeen(["I"]);
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↺ 처음 자리로
            </button>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {SYM_STATES.map((s) => {
                const found = seen.includes(s);
                const q = symPos(P, s);
                return (
                  <div
                    key={s}
                    className={"rounded-xl px-2 py-1.5 text-center transition " + (found ? "" : "bg-black/25")}
                    style={found ? { background: `${SYM_STATE_META[s].color}1f`, border: `1px solid ${SYM_STATE_META[s].color}66` } : undefined}
                  >
                    <p className={"text-[10px] font-bold " + (found ? "text-white" : "text-slate-600")}>{found ? SYM_STATE_META[s].label : "???"}</p>
                    <p className={"font-mono text-[11px] font-bold " + (found ? "text-slate-100" : "text-slate-700")}>{found ? `(${q.x}, ${q.y})` : "· · ·"}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={"rounded-2xl border-2 p-4 transition " + (!allSeen ? "border-white/10 bg-slate-900/40 opacity-45" : quizOk ? "border-emerald-400/60 bg-emerald-400/15" : "border-violet-400/45 bg-violet-400/[0.10]")}>
            <p className="text-sm font-bold text-slate-100">🧠 {SYM_QUIZ.prompt}</p>
            {allSeen ? (
              <>
                <div className="mt-2 grid gap-1.5">
                  {SYM_QUIZ.choices.map((c, i) => {
                    const on = pick === i;
                    const good = pick !== null && i === SYM_QUIZ.ans;
                    const bad = on && i !== SYM_QUIZ.ans;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPick(i)}
                        disabled={quizOk}
                        className={
                          "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-xs font-bold transition disabled:cursor-default " +
                          (good ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : bad ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                        }
                      >
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/30 font-mono text-[11px]">{"①②③④"[i]}</span>
                        {c}
                      </button>
                    );
                  })}
                </div>
                {quizOk ? <p className="mt-2 rounded-lg bg-emerald-400/12 px-3 py-2 text-[11px] leading-5 text-emerald-100">✅ {SYM_QUIZ.tip}</p> : null}
              </>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500">네 자리를 모두 찾으면 문제가 열려요</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
