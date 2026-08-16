"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActivityContext } from "@/components/activities/ActivityContext";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import { fetchLeaderboard, submitActivityScore, type LeaderRow } from "@/lib/activities/activityScores";
import {
  FORM_LABEL,
  QUIZ,
  RELATION_META,
  RELATION_ORDER,
  SPEED_MODE,
  SPEED_SECONDS,
  WRONG_PENALTY,
  fracPlain,
  fracTex,
  genTex,
  intersectionOf,
  lineTex,
  makeSpeedItem,
  mkFrac,
  relationOf,
  stdTex,
  toGen,
  toStd,
  type Frac,
  type Gen,
  type Line,
  type Relation,
  type SpeedItem,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "judge_order",
    prompt:
      "두 직선의 위치 관계를 판단할 때 무엇을 가장 먼저 보았나요? 일치·평행·교차·수직을 빠르게 가려내는 나만의 순서를 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 먼저 기울기가 같은지 보고, 같으면 y절편만 비교해 일치인지 평행인지 정한다. 기울기가 다르면 곱이 −1인지 확인해 수직인지 본다.",
  },
  {
    id: "std_vs_gen",
    prompt:
      "일반형 ax + by + c = 0 의 평행 조건 a/a′ = b/b′ ≠ c/c′ 와 수직 조건 aa′ + bb′ = 0 은 표준형의 m = m′, mm′ = −1 과 어떻게 연결되나요? 한 가지를 골라 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 일반형에서 기울기는 −a/b 이므로 −a/b = −a′/b′ 를 정리하면 a/a′ = b/b′ 가 된다. 수직은 (−a/b)(−a′/b′) = −1 을 정리해 aa′ + bb′ = 0 이 나온다.",
  },
  {
    id: "speed_tip",
    prompt:
      "스피드 퀴즈에서 시간을 아끼려고 쓴 요령과, 자주 헷갈렸던 유형을 적어 보세요. 다음에 더 빨리 풀려면 무엇을 연습해야 할까요?",
    kind: "text",
    placeholder:
      "예: 일반형 두 개가 나오면 계산 없이 aa′ + bb′ 를 먼저 암산했다. 일치와 평행을 구분할 때 c까지 확인하지 않아 틀린 적이 많았다.",
  },
];

// ─── 좌표평면 공용 ────────────────────────────────────────────
const G = { MIN: -8, MAX: 8, U: 21, PAD: 30 };
const SPAN = (G.MAX - G.MIN) * G.U;
const VB = SPAN + G.PAD * 2;

function gx(v: number): number {
  return G.PAD + (v - G.MIN) * G.U;
}
function gy(v: number): number {
  return G.PAD + (G.MAX - v) * G.U;
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
        <line key={`vx${v}`} x1={gx(v)} y1={gy(G.MAX)} x2={gx(v)} y2={gy(G.MIN)} stroke="rgba(255,255,255,0.055)" strokeWidth={1} />
      ))}
      {range(G.MIN, G.MAX).map((v) => (
        <line key={`hy${v}`} x1={gx(G.MIN)} y1={gy(v)} x2={gx(G.MAX)} y2={gy(v)} stroke="rgba(255,255,255,0.055)" strokeWidth={1} />
      ))}
      <line x1={gx(G.MIN)} y1={gy(0)} x2={gx(G.MAX)} y2={gy(0)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={gx(0)} y1={gy(G.MIN)} x2={gx(0)} y2={gy(G.MAX)} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      {range(G.MIN, G.MAX)
        .filter((v) => v !== 0 && v % 2 === 0)
        .map((v) => (
          <text key={`tx${v}`} x={gx(v)} y={gy(0) + 12} textAnchor="middle" className="fill-slate-500 font-mono text-[8px]">
            {v}
          </text>
        ))}
      {range(G.MIN, G.MAX)
        .filter((v) => v !== 0 && v % 2 === 0)
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

function Plane({ cid, label, small, children }: { cid: string; label: string; small?: boolean; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        className={"mx-auto block w-full select-none " + (small ? "max-w-[300px]" : "max-w-[400px]")}
        role="img"
        aria-label={label}
      >
        <defs>
          <clipPath id={cid}>
            <rect x={gx(G.MIN)} y={gy(G.MAX)} width={SPAN} height={SPAN} />
          </clipPath>
        </defs>
        <GridLines />
        <g clipPath={`url(#${cid})`}>{children}</g>
      </svg>
    </div>
  );
}

/** 일반형 직선을 격자 끝까지 그린다(clip 으로 잘림). */
function GenLineDraw({ g, color, width = 3, dash }: { g: Gen; color: string; width?: number; dash?: string }) {
  if (g.a === 0 && g.b === 0) return null;
  let p: [number, number, number, number];
  if (g.b === 0) {
    const x = -g.c / g.a;
    p = [gx(x), gy(G.MAX + 4), gx(x), gy(G.MIN - 4)];
  } else {
    const yAt = (x: number) => (-g.a * x - g.c) / g.b;
    p = [gx(G.MIN - 4), gy(yAt(G.MIN - 4)), gx(G.MAX + 4), gy(yAt(G.MAX + 4))];
  }
  return <line x1={p[0]} y1={p[1]} x2={p[2]} y2={p[3]} stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" />;
}

/** 두 직선 + (있으면) 교점을 그린 그래프. */
function TwoLinePlane({ cid, g1, g2, small, label }: { cid: string; g1: Gen; g2: Gen; small?: boolean; label: string }) {
  const rel = relationOf(g1, g2);
  const at = intersectionOf(g1, g2);
  const inView = at && Math.abs(at.x) <= G.MAX && Math.abs(at.y) <= G.MAX;
  return (
    <Plane cid={cid} label={label} small={small}>
      {/* 일치일 때는 두 번째 직선을 점선으로 겹쳐 그려 "겹쳐 있음"을 보이게 한다 */}
      <GenLineDraw g={g1} color="#22d3ee" width={3.5} />
      <GenLineDraw g={g2} color="#fbbf24" width={3} dash={rel === "same" ? "8 6" : undefined} />
      {inView && at ? (
        <>
          <circle cx={gx(at.x)} cy={gy(at.y)} r={6} fill={RELATION_META[rel].hex} stroke="#0f172a" strokeWidth={2} />
          {rel === "perp" ? <PerpMark g1={g1} g2={g2} at={at} /> : null}
        </>
      ) : null}
    </Plane>
  );
}

/** 수직 표시(작은 직각 사각형) — 교점에서 두 직선의 방향으로 그린다. */
function PerpMark({ g1, g2, at }: { g1: Gen; g2: Gen; at: { x: number; y: number } }) {
  const dir = (g: Gen) => {
    const len = Math.hypot(g.b, -g.a) || 1;
    return { x: g.b / len, y: -g.a / len };
  };
  const u = dir(g1);
  const v = dir(g2);
  const s = 12;
  const P = (dx: number, dy: number) => `${gx(at.x) + dx},${gy(at.y) - dy}`;
  const pts = [P(0, 0), P(u.x * s, u.y * s), P((u.x + v.x) * s, (u.y + v.y) * s), P(v.x * s, v.y * s)].join(" ");
  return <polygon points={pts} fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth={1.5} />;
}

// ─── 입력 파싱 ────────────────────────────────────────────────
function parseFrac(s: string): Frac | null {
  const t = s.trim().replace(/[−–—]/g, "-").replace(/\s/g, "");
  if (!t || t === "-") return null;
  const f = t.match(/^(-?\d+)\/(\d+)$/);
  if (f) {
    const d = Number(f[2]);
    return d === 0 ? null : mkFrac(Number(f[1]), d);
  }
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const v = Number(t);
  return mkFrac(Math.round(v * 1000), 1000);
}
/** 입력창에 다시 넣을 수 있는 문자열(ASCII). */
function fracInput(f: Frac): string {
  return f.d === 1 ? String(f.n) : `${f.n}/${f.d}`;
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "lab" | "quiz" | "speed";

export default function TwoLinesRelationLab() {
  const [tab, setTab] = useState<Tab>("lab");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🛤️ 두 직선의 위치 관계</h3>
        <p className="mt-2 leading-7 text-slate-300">
          두 직선의 방정식만 보고 <b className="text-violet-200">일치</b> ·{" "}
          <b className="text-sky-200">평행</b> · <b className="text-emerald-200">교차</b> ·{" "}
          <b className="text-rose-200">수직</b>을 가려내요. 마지막엔 <b className="text-amber-200">1분 스피드 퀴즈</b>로 순위에 도전!
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "lab"} onClick={() => setTab("lab")}>
          ① 두 직선 실험실
        </TabButton>
        <TabButton active={tab === "quiz"} onClick={() => setTab("quiz")}>
          ② 위치 관계 퀴즈
        </TabButton>
        <TabButton active={tab === "speed"} onClick={() => setTab("speed")}>
          ③ 1분 스피드 퀴즈 ⏱️
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "lab" ? <LabTab /> : null}
        {tab === "quiz" ? <QuizTab /> : null}
        {tab === "speed" ? <SpeedTab /> : null}
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

function RelationBadge({ rel, big }: { rel: Relation; big?: boolean }) {
  const meta = RELATION_META[rel];
  const cls: Record<string, string> = {
    violet: "border-violet-400/55 bg-violet-400/20 text-violet-100",
    sky: "border-sky-400/55 bg-sky-400/20 text-sky-100",
    rose: "border-rose-400/55 bg-rose-400/20 text-rose-100",
    emerald: "border-emerald-400/55 bg-emerald-400/20 text-emerald-100",
  };
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-xl border-2 font-bold " + cls[meta.tone] + (big ? " px-4 py-2 text-lg" : " px-2.5 py-1 text-xs")}>
      <span>{meta.emoji}</span>
      {big ? meta.label : meta.short}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 두 직선 실험실
// ══════════════════════════════════════════════════════════════
type Draft = { form: "std" | "gen"; m: string; n: string; a: string; b: string; c: string };

const DRAFT1: Draft = { form: "std", m: "1", n: "2", a: "1", b: "-1", c: "2" };
const DRAFT2: Draft = { form: "gen", m: "1", n: "-3", a: "1", b: "1", c: "-4" };

function draftToLine(d: Draft): Line | null {
  if (d.form === "std") {
    const m = parseFrac(d.m);
    const n = parseFrac(d.n);
    if (!m || !n) return null;
    return { form: "std", m, n };
  }
  const a = parseFrac(d.a);
  const b = parseFrac(d.b);
  const c = parseFrac(d.c);
  if (!a || !b || !c) return null;
  if (a.n === 0 && b.n === 0) return null; // x, y 계수가 모두 0이면 직선이 아니다
  const L = (a.d * b.d * c.d) || 1;
  return { form: "gen", a: (a.n * L) / a.d, b: (b.n * L) / b.d, c: (c.n * L) / c.d };
}

/** 일반형 Gen 값을 draft 에 반영(현재 형태를 유지). */
function genToDraft(d: Draft, g: Gen): Draft {
  const s = toStd(g);
  const next: Draft = { ...d, a: String(g.a), b: String(g.b), c: String(g.c) };
  if (s) {
    next.m = fracInput(s.m);
    next.n = fracInput(s.n);
  } else if (d.form === "std") {
    next.form = "gen"; // 세로선은 표준형으로 못 쓴다
  }
  return next;
}

function LabTab() {
  const [d1, setD1] = useState<Draft>(DRAFT1);
  const [d2, setD2] = useState<Draft>(DRAFT2);

  const l1 = draftToLine(d1);
  const l2 = draftToLine(d2);
  const g1 = l1 ? toGen(l1) : null;
  const g2 = l2 ? toGen(l2) : null;
  const rel = g1 && g2 ? relationOf(g1, g2) : null;
  const at = g1 && g2 ? intersectionOf(g1, g2) : null;

  function preset(kind: Relation) {
    if (!g1) return;
    let g: Gen;
    if (kind === "same") g = { ...g1 };
    else if (kind === "parallel") g = { a: g1.a, b: g1.b, c: g1.c + 4 };
    else if (kind === "perp") g = { a: -g1.b, b: g1.a, c: g1.c };
    else {
      // 교차 — 기울기를 살짝 틀어 수직도 일치도 아니게
      g = { a: g1.a + (g1.b === 0 ? 1 : 2), b: g1.b - 1, c: g1.c - 2 };
      if (g.a === 0 && g.b === 0) g = { a: 1, b: 1, c: -2 };
      if (g1.a * g.b - g.a * g1.b === 0 || g1.a * g.a + g1.b * g.b === 0) g = { a: g1.a + 3, b: g1.b + 1, c: g1.c - 1 };
    }
    setD2((d) => genToDraft(d, g));
  }

  const std1 = g1 ? toStd(g1) : null;
  const std2 = g2 ? toStd(g2) : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 그래프 */}
        <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-3">
          {g1 && g2 ? (
            <TwoLinePlane cid="lab-plane" g1={g1} g2={g2} label="두 직선의 위치 관계" />
          ) : (
            <Plane cid="lab-plane" label="두 직선의 위치 관계">
              {g1 ? <GenLineDraw g={g1} color="#22d3ee" width={3.5} /> : null}
              {g2 ? <GenLineDraw g={g2} color="#fbbf24" width={3} /> : null}
            </Plane>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="inline-block h-2.5 w-4 rounded-sm bg-cyan-400" />직선 l
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="inline-block h-2.5 w-4 rounded-sm bg-amber-400" />직선 l&#39;
            </span>
            {at && Math.abs(at.x) <= G.MAX && Math.abs(at.y) <= G.MAX ? (
              <span className="font-mono text-slate-300">
                교점 ({nx(at.x)}, {nx(at.y)})
              </span>
            ) : null}
          </div>
        </div>

        {/* 입력 + 판정 */}
        <div className="space-y-3">
          <LineEditor title="직선 l" tone="cyan" draft={d1} setDraft={setD1} line={l1} gen={g1} />
          <LineEditor title="직선 l'" tone="amber" draft={d2} setDraft={setD2} line={l2} gen={g2} />

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-xs font-bold text-slate-400">🎛️ 직선 l&#39; 을 이렇게 바꿔 보기</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(["same", "parallel", "perp", "cross"] as Relation[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={!g1}
                  onClick={() => preset(k)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
                >
                  {RELATION_META[k].emoji} {RELATION_META[k].short} 만들기
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 판정 */}
      {g1 && g2 && rel ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-bold text-slate-100">🔎 판정 결과</p>
            <RelationBadge rel={rel} big />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {/* 표준형 관점 */}
            <div className="rounded-xl border border-sky-400/25 bg-sky-400/[0.06] p-3">
              <p className="text-xs font-bold text-sky-200">표준형으로 보기 (y = mx + n)</p>
              {std1 && std2 ? (
                <div className="mt-2 space-y-1.5">
                  <CheckRow
                    label="기울기"
                    tex={`m = ${fracTex(std1.m)},\\quad m' = ${fracTex(std2.m)}`}
                    ok={fracPlain(std1.m) === fracPlain(std2.m)}
                    okText="같다"
                    noText="다르다"
                  />
                  <CheckRow
                    label="y절편"
                    tex={`n = ${fracTex(std1.n)},\\quad n' = ${fracTex(std2.n)}`}
                    ok={fracPlain(std1.n) === fracPlain(std2.n)}
                    okText="같다"
                    noText="다르다"
                  />
                  <CheckRow
                    label="기울기의 곱"
                    tex={`mm' = ${fracTex(mkFrac(std1.m.n * std2.m.n, std1.m.d * std2.m.d))}`}
                    ok={std1.m.n * std2.m.n * -1 === std1.m.d * std2.m.d}
                    okText="−1 → 수직"
                    noText="−1 아님"
                  />
                </div>
              ) : (
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  y축에 평행한 직선(x = k)이 있어요. 이런 직선은 기울기가 없어서 y = mx + n 꼴로 쓸 수 없으니, 아래 일반형으로 판단해요.
                </p>
              )}
            </div>

            {/* 일반형 관점 */}
            <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-3">
              <p className="text-xs font-bold text-amber-200">일반형으로 보기 (ax + by + c = 0)</p>
              <div className="mt-2 space-y-1.5">
                <div className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-1.5 text-slate-100">
                  <Katex expr={`l:\\ ${genTex(g1)} \\qquad l':\\ ${genTex(g2)}`} />
                </div>
                <CheckRow
                  label="기울기 비교"
                  tex={`ab' - a'b = ${g1.a}\\cdot${g2.b} - ${g2.a}\\cdot${g1.b} = ${g1.a * g2.b - g2.a * g1.b}`}
                  ok={g1.a * g2.b - g2.a * g1.b === 0}
                  okText="0 → 평행 또는 일치"
                  noText="0 아님 → 한 점에서 만남"
                />
                <CheckRow
                  label="수직 판정"
                  tex={`aa' + bb' = ${g1.a}\\cdot${g2.a} + ${g1.b}\\cdot${g2.b} = ${g1.a * g2.a + g1.b * g2.b}`}
                  ok={g1.a * g2.a + g1.b * g2.b === 0}
                  okText="0 → 수직"
                  noText="0 아님"
                />
                {allNonZero(g1) && allNonZero(g2) ? (
                  <div className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-1.5 text-[13px] text-slate-200">
                    <Katex
                      expr={`\\frac{a}{a'} = ${fracTex(mkFrac(g1.a, g2.a))},\\quad \\frac{b}{b'} = ${fracTex(mkFrac(g1.b, g2.b))},\\quad \\frac{c}{c'} = ${fracTex(mkFrac(g1.c, g2.c))}`}
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">※ 계수 중 0이 있어 a/a′ 같은 비례식은 쓸 수 없어요. 위의 곱셈꼴 판정을 사용합니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-rose-400/35 bg-rose-400/[0.08] px-4 py-3 text-sm font-bold text-rose-100">
          ⚠️ 두 직선의 방정식을 모두 올바르게 입력해 주세요. (분수는 3/4 처럼, 음수는 −2 또는 -2 처럼)
        </p>
      )}
    </div>
  );
}

function allNonZero(g: Gen): boolean {
  return g.a !== 0 && g.b !== 0 && g.c !== 0;
}

function CheckRow({ label, tex, ok, okText, noText }: { label: string; tex: string; ok: boolean; okText: string; noText: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 text-[11px] font-bold text-slate-400">{label}</span>
      <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-2.5 py-1 text-[13px] text-slate-100">
        <Katex expr={tex} />
      </div>
      <span className={"shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold " + (ok ? "bg-emerald-400/20 text-emerald-200" : "bg-white/5 text-slate-400")}>
        {ok ? `✓ ${okText}` : `✗ ${noText}`}
      </span>
    </div>
  );
}

function LineEditor({
  title,
  tone,
  draft,
  setDraft,
  line,
  gen,
}: {
  title: string;
  tone: "cyan" | "amber";
  draft: Draft;
  setDraft: (f: (d: Draft) => Draft) => void;
  line: Line | null;
  gen: Gen | null;
}) {
  const border = tone === "cyan" ? "border-cyan-400/30 bg-cyan-400/[0.06]" : "border-amber-400/30 bg-amber-400/[0.06]";
  const text = tone === "cyan" ? "text-cyan-200" : "text-amber-200";
  return (
    <div className={"rounded-2xl border p-3 " + border}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={"text-sm font-bold " + text}>{title}</p>
        <div className="flex gap-1">
          {(["std", "gen"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() =>
                setDraft((d) => {
                  if (d.form === f) return d;
                  // 형태를 바꿀 때 현재 식을 그대로 옮겨 준다.
                  const cur = draftToLine(d);
                  if (!cur) return { ...d, form: f };
                  return genToDraft({ ...d, form: f }, toGen(cur));
                })
              }
              className={
                "rounded-lg border px-2 py-1 text-[11px] font-bold transition " +
                (draft.form === f ? "border-white/40 bg-white/15 text-white" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
              }
            >
              {FORM_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {draft.form === "std" ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-sm text-slate-100">
          <span>y =</span>
          <NumBox value={draft.m} onChange={(v) => setDraft((d) => ({ ...d, m: v }))} label={`${title} 기울기 m`} bad={!parseFrac(draft.m)} />
          <span>x +</span>
          <NumBox value={draft.n} onChange={(v) => setDraft((d) => ({ ...d, n: v }))} label={`${title} y절편 n`} bad={!parseFrac(draft.n)} />
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-sm text-slate-100">
          <NumBox value={draft.a} onChange={(v) => setDraft((d) => ({ ...d, a: v }))} label={`${title} a`} bad={!parseFrac(draft.a)} />
          <span>x +</span>
          <NumBox value={draft.b} onChange={(v) => setDraft((d) => ({ ...d, b: v }))} label={`${title} b`} bad={!parseFrac(draft.b)} />
          <span>y +</span>
          <NumBox value={draft.c} onChange={(v) => setDraft((d) => ({ ...d, c: v }))} label={`${title} c`} bad={!parseFrac(draft.c)} />
          <span>= 0</span>
        </div>
      )}

      <div className="mt-2 overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-1.5 text-slate-100">
        {line && gen ? (
          <Katex expr={draft.form === "std" ? `${lineTex(line)} \\quad \\Leftrightarrow \\quad ${genTex(gen)}` : `${genTex(gen)}${stdOrEmpty(gen)}`} />
        ) : (
          <span className="text-xs text-rose-300">입력을 확인해 주세요</span>
        )}
      </div>
    </div>
  );
}

function stdOrEmpty(g: Gen): string {
  const s = toStd(g);
  return s ? ` \\quad \\Leftrightarrow \\quad ${stdTex(s.m, s.n)}` : "";
}

function NumBox({ value, onChange, label, bad }: { value: string; onChange: (v: string) => void; label: string; bad: boolean }) {
  return (
    <input
      type="text"
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className={
        "w-14 rounded-lg border-2 bg-slate-900 px-1.5 py-1 text-center font-mono text-sm text-white outline-none transition focus:border-cyan-300 " +
        (bad ? "border-rose-400/70" : "border-white/15")
      }
    />
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 위치 관계 퀴즈 (10문제)
// ══════════════════════════════════════════════════════════════
function QuizTab() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Relation | null>(null);
  const [score, setScore] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  if (idx >= QUIZ.length) {
    return (
      <div className="rounded-2xl border-2 border-emerald-400/45 bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 p-5 text-center">
        <p className="text-3xl">{score === QUIZ.length ? "🏆" : score >= 7 ? "🎉" : "💪"}</p>
        <p className="mt-2 text-xl font-extrabold text-emerald-200">
          {score} / {QUIZ.length} 문제 정답!
        </p>
        {wrongIds.length > 0 ? (
          <p className="mt-2 text-sm text-slate-300">
            틀린 문제: <b className="text-rose-200">{wrongIds.map((id) => QUIZ.findIndex((q) => q.id === id) + 1).join(", ")}번</b>
          </p>
        ) : (
          <p className="mt-2 text-sm text-emerald-100">완벽해요! 이제 1분 스피드 퀴즈에 도전해 볼까요? ⏱️</p>
        )}
        <button
          type="button"
          onClick={() => {
            setIdx(0);
            setPicked(null);
            setScore(0);
            setWrongIds([]);
          }}
          className="mt-4 rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↻ 다시 풀기
        </button>
      </div>
    );
  }

  const q = QUIZ[idx];
  const g1 = toGen(q.l1);
  const g2 = toGen(q.l2);
  const answered = picked !== null;
  const correct = picked === q.answer;

  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          🧭 위치 관계 퀴즈 · {idx + 1} / {QUIZ.length}
        </p>
        <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-3 py-1 font-mono text-xs font-bold text-cyan-100">점수 {score}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${(idx / QUIZ.length) * 100}%` }} />
      </div>

      {/* 문제 */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <EqCard tone="cyan" name="l" line={q.l1} />
        <EqCard tone="amber" name="l'" line={q.l2} />
      </div>

      <p className="mt-3 text-center text-sm font-bold text-slate-100">두 직선의 위치 관계는?</p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {RELATION_ORDER.map((r) => {
          const meta = RELATION_META[r];
          const state = !answered ? "idle" : r === q.answer ? "right" : r === picked ? "wrong" : "idle";
          return (
            <button
              key={r}
              type="button"
              disabled={answered}
              onClick={() => {
                setPicked(r);
                if (r === q.answer) setScore((s) => s + 1);
                else setWrongIds((w) => [...w, q.id]);
              }}
              className={
                "rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition " +
                (state === "right"
                  ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100"
                  : state === "wrong"
                    ? "border-rose-400/60 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 disabled:opacity-60")
              }
            >
              {meta.emoji} {meta.label}
              {state === "right" ? " ✅" : state === "wrong" ? " ❌" : ""}
            </button>
          );
        })}
      </div>

      {answered ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-[300px_1fr]">
          <TwoLinePlane cid={`quiz-${q.id}`} g1={g1} g2={g2} small label={`${idx + 1}번 문제의 두 직선`} />
          <div>
            <div
              className={
                "rounded-xl border px-3 py-2 text-sm font-bold " +
                (correct ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-100" : "border-rose-400/45 bg-rose-400/10 text-rose-100")
              }
            >
              {correct ? "✅ 정답!" : `❌ 정답은 「${RELATION_META[q.answer].label}」`}
            </div>
            <p className="mt-2 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs leading-6 text-slate-300">{q.explain}</p>
            <button
              type="button"
              onClick={() => {
                setIdx((i) => i + 1);
                setPicked(null);
              }}
              className="mt-2 rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
            >
              {idx + 1 < QUIZ.length ? "다음 문제 →" : "결과 보기 🎉"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EqCard({ tone, name, line }: { tone: "cyan" | "amber"; name: string; line: Line }) {
  const cls = tone === "cyan" ? "border-cyan-400/35 bg-cyan-400/[0.08] text-cyan-200" : "border-amber-400/35 bg-amber-400/[0.08] text-amber-200";
  return (
    <div className={"rounded-xl border px-4 py-3 " + cls}>
      <p className="text-[11px] font-bold">
        직선 {name} · {FORM_LABEL[line.form]}
      </p>
      <div className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-lg text-white">
        <Katex expr={lineTex(line)} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 1분 스피드 퀴즈 + 순위표
// ══════════════════════════════════════════════════════════════
type Phase = "idle" | "run" | "done";

const HS_KEY = "mathlab.two_lines_relation.best";
const ACTIVITY_SLUG = "common2/mini/two_lines_relation_lab";

/** 이 기기에 남겨 둔 최고 기록(로그인 전에도 보이도록). */
function readBest(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(HS_KEY);
    return v === null ? null : Number(v) || 0;
  } catch {
    return null;
  }
}

function SpeedTab() {
  const ctx = useActivityContext();
  const activitySlug = ctx?.activitySlug ?? ACTIVITY_SLUG;
  const subject = ctx?.subject ?? "공통수학2";

  const [phase, setPhase] = useState<Phase>("idle");
  const [item, setItem] = useState<SpeedItem | null>(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [left, setLeft] = useState(SPEED_SECONDS);
  const [flash, setFlash] = useState<null | "ok" | "no">(null);
  const [best, setBest] = useState<number | null>(readBest);
  const [saveMsg, setSaveMsg] = useState("");
  const [reload, setReload] = useState(0);

  // 타이머 콜백에서 최신 값을 읽기 위한 거울
  const deadlineRef = useRef(0);
  const scoreRef = useRef(0);
  const wrongRef = useRef(0);
  const bestRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  /** 한 판을 마무리 — 최고 기록 갱신 + 랭킹 제출(신원은 서버 RPC 가 auth.uid() 로 채운다). */
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const s = scoreRef.current;
    const w = wrongRef.current;
    setPhase("done");

    if (bestRef.current === null || s > bestRef.current) {
      bestRef.current = s;
      setBest(s);
      try {
        window.localStorage.setItem(HS_KEY, String(s));
      } catch {
        /* 저장소를 못 쓰는 환경은 무시 */
      }
    }

    if (s <= 0) {
      setSaveMsg("0점은 순위표에 올라가지 않아요. 한 문제라도 맞혀 보세요!");
      return;
    }
    setSaveMsg("점수를 올리는 중…");
    void (async () => {
      const res = await submitActivityScore({
        activitySlug,
        subject,
        difficulty: SPEED_MODE,
        score: s,
        meta: { correct: s, wrong: w, seconds: SPEED_SECONDS },
      });
      if (res.ok) {
        setSaveMsg("순위표에 기록했어요! 🏅");
        setReload((x) => x + 1);
      } else {
        setSaveMsg(res.notStudent ? "학생 계정으로 로그인하면 순위표에 기록돼요." : `점수 저장 실패: ${res.error}`);
      }
    })();
  }, [activitySlug, subject]);

  // 타이머 — 남은 시간만 갱신하고, 0이 되면 마무리한다.
  useEffect(() => {
    if (phase !== "run") return;
    const t = window.setInterval(() => {
      const remain = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
      setLeft(remain);
      if (remain <= 0) finish();
    }, 100);
    return () => window.clearInterval(t);
  }, [phase, finish]);

  function start() {
    deadlineRef.current = Date.now() + SPEED_SECONDS * 1000;
    scoreRef.current = 0;
    wrongRef.current = 0;
    doneRef.current = false;
    setScore(0);
    setWrong(0);
    setLeft(SPEED_SECONDS);
    setSaveMsg("");
    setItem(makeSpeedItem());
    setPhase("run");
  }

  function answer(r: Relation) {
    if (!item || phase !== "run") return;
    if (r === item.answer) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFlash("ok");
    } else {
      wrongRef.current += 1;
      setWrong(wrongRef.current);
      deadlineRef.current -= WRONG_PENALTY * 1000;
      setFlash("no");
    }
    window.setTimeout(() => setFlash(null), 220);
    setItem(makeSpeedItem());
  }

  return (
    <div className="space-y-4">
      {phase === "idle" ? (
        <div className="rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/[0.12] to-rose-500/[0.06] p-6 text-center">
          <p className="text-4xl">⏱️</p>
          <p className="mt-2 text-xl font-extrabold text-amber-100">1분 스피드 퀴즈</p>
          <div className="mx-auto mt-3 grid max-w-md gap-1.5 text-left text-sm text-slate-300">
            <p>• {SPEED_SECONDS}초 동안 두 직선의 위치 관계를 최대한 많이 맞혀요.</p>
            <p>
              • 문제는 <b className="text-slate-100">표준형</b>과 <b className="text-slate-100">일반형</b>이 무작위로 섞여 나와요.
            </p>
            <p>
              • 틀리면 남은 시간이 <b className="text-rose-200">{WRONG_PENALTY}초</b> 줄어드니 찍기는 손해!
            </p>
            <p>• 끝나면 점수가 아래 순위표에 자동으로 올라가요.</p>
          </div>
          {best !== null ? <p className="mt-3 font-mono text-sm font-bold text-amber-200">내 최고 기록 {best}점</p> : null}
          <button
            type="button"
            onClick={start}
            className="mt-4 rounded-xl border-2 border-amber-400/60 bg-amber-400/20 px-8 py-3 text-lg font-extrabold text-amber-100 transition hover:bg-amber-400/30"
          >
            시작하기 🚀
          </button>
        </div>
      ) : null}

      {phase === "run" && item ? (
        <div
          className={
            "rounded-2xl border-2 p-4 transition-colors " +
            (flash === "ok"
              ? "border-emerald-400/70 bg-emerald-400/10"
              : flash === "no"
                ? "border-rose-400/70 bg-rose-400/10"
                : "border-white/10 bg-slate-900/40")
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full border border-emerald-400/45 bg-emerald-400/15 px-3 py-1 font-mono text-sm font-bold text-emerald-100">
              ✅ {score}
            </span>
            <span className="font-mono text-2xl font-extrabold text-amber-100">{left.toFixed(1)}초</span>
            <span className="rounded-full border border-rose-400/45 bg-rose-400/15 px-3 py-1 font-mono text-sm font-bold text-rose-100">❌ {wrong}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={"h-full rounded-full transition-all " + (left < 10 ? "bg-rose-400" : "bg-amber-400")}
              style={{ width: `${(left / SPEED_SECONDS) * 100}%` }}
            />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <EqCard tone="cyan" name="l" line={item.l1} />
            <EqCard tone="amber" name="l'" line={item.l2} />
          </div>

          <div className="mt-3 grid gap-1.5 sm:grid-cols-4">
            {RELATION_ORDER.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => answer(r)}
                className="rounded-xl border-2 border-white/10 bg-white/5 px-2 py-3 text-sm font-bold text-slate-100 transition hover:bg-white/15 active:scale-95"
              >
                <span className="block text-lg">{RELATION_META[r].emoji}</span>
                {RELATION_META[r].short}
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-500">빠르게! 오답은 −{WRONG_PENALTY}초</p>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/15 to-rose-500/10 p-5 text-center">
          <p className="text-3xl">{score >= 15 ? "🏆" : score >= 8 ? "🎉" : "💪"}</p>
          <p className="mt-1 text-sm font-bold text-amber-200">{SPEED_SECONDS}초 기록</p>
          <p className="mt-1 font-mono text-4xl font-extrabold text-white">{score}점</p>
          <p className="mt-1 text-xs text-slate-400">
            맞힘 {score} · 틀림 {wrong}
            {best !== null ? ` · 내 최고 ${best}점` : ""}
          </p>
          {saveMsg ? <p className="mt-2 text-xs font-bold text-emerald-200">{saveMsg}</p> : null}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={start}
              className="rounded-xl border-2 border-amber-400/60 bg-amber-400/20 px-6 py-2 text-sm font-extrabold text-amber-100 transition hover:bg-amber-400/30"
            >
              ↻ 다시 도전
            </button>
            <button
              type="button"
              onClick={() => setPhase("idle")}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              규칙 다시 보기
            </button>
          </div>
        </div>
      ) : null}

      <Leaderboard activitySlug={activitySlug} reloadToken={reload} />
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

function Leaderboard({ activitySlug, reloadToken }: { activitySlug: string; reloadToken: number }) {
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const res = await fetchLeaderboard({ activitySlug, limit: 20 });
      if (!alive) return;
      if (res.ok) {
        setRows(res.rows);
        setErr("");
      } else {
        setRows(null);
        setErr(res.error);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [activitySlug, reloadToken, tick]);

  const meMissing = !!rows && rows.length > 0 && !rows.some((r) => r.isMe);

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-violet-200">
          🏅 스피드 퀴즈 순위표 <span className="text-[11px] font-normal text-slate-500">(학생별 최고 점수)</span>
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setTick((x) => x + 1);
          }}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          🔄 새로고침
        </button>
      </div>

      {loading ? (
        <p className="mt-3 text-center text-xs text-slate-400">순위표를 불러오는 중…</p>
      ) : err ? (
        <p className="mt-3 text-center text-xs text-rose-300">순위표를 불러오지 못했습니다: {err}</p>
      ) : !rows || rows.length === 0 ? (
        <p className="mt-3 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-4 text-center text-xs leading-5 text-slate-400">
          아직 기록이 없어요. 첫 번째 도전자가 되어 보세요! 🚀
        </p>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[380px] text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-2.5 py-2 text-left font-semibold">순위</th>
                  <th className="px-2.5 py-2 text-left font-semibold">이름</th>
                  <th className="px-2.5 py-2 text-right font-semibold">학급</th>
                  <th className="px-2.5 py-2 text-right font-semibold">최고 점수</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.rank}-${r.displayName}`} className={"border-t border-white/5 " + (r.isMe ? "bg-violet-400/15 font-bold" : "")}>
                    <td className="px-2.5 py-2 text-left text-base">{r.rank <= 3 ? MEDALS[r.rank - 1] : `${r.rank}위`}</td>
                    <td className="px-2.5 py-2 text-left text-slate-100">
                      {r.displayName}
                      {r.isMe ? <span className="ml-1.5 text-[11px] text-violet-200">← 나</span> : null}
                    </td>
                    <td className="px-2.5 py-2 text-right font-mono text-xs text-slate-400">
                      {r.grade && r.classNumber ? `${r.grade}-${r.classNumber}` : "—"}
                    </td>
                    <td className="px-2.5 py-2 text-right font-mono font-extrabold text-amber-200">{r.bestScore}점</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meMissing ? (
            <p className="mt-2 rounded-lg border border-violet-400/35 bg-violet-400/10 px-3 py-2 text-center text-xs font-bold text-violet-100">
              아직 상위 {rows.length}명 안에 이름이 없어요. 한 번 더 도전해 볼까요? 💪
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
