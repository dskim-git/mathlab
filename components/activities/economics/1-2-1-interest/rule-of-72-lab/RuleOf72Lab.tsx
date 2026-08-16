"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  BENCHES,
  BUY_YEAR,
  CHALLENGES,
  DATA_NOTE,
  GUILDERS,
  NOW_YEAR,
  PRINCIPAL_USD,
  RATE_SCENARIOS,
  RULE_TABLE_RATES,
  YEARS,
  exactDouble,
  exactRate,
  fmtUSD,
  grow,
  rule72,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "manhattan",
    prompt:
      "24달러가 400년 뒤 상상하기 어려운 금액이 된 것은 원금이 커서가 아니라 ‘시간’과 ‘복리’ 때문이에요. 애니메이션에서 가장 놀랐던 장면을 하나 고르고, 그 장면이 왜 그렇게 되는지 복리의 원리로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 1900년까지는 그래프가 거의 바닥에 붙어 있다가 마지막 100년에 폭발적으로 치솟은 것이 놀라웠다. 이자가 이자를 낳아 늘어나는 양 자체가 계속 커지기 때문이다.",
  },
  {
    id: "rate_power",
    prompt:
      "같은 400년이라도 연 8%면 약 562조 달러, 연 6%면 약 3,181억 달러로 1,700배 넘게 차이가 났어요. 이율의 작은 차이가 왜 이렇게 큰 차이를 만드는지 설명하고, 이 사실이 우리의 저축이나 빚에 주는 교훈을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 복리는 이율이 지수의 밑에 들어가서, 작은 차이도 400번 곱해지면 엄청난 차이가 된다. 그래서 저축은 조금이라도 이율이 높은 곳에, 빚은 이율이 낮은 것부터 갚아야 한다.",
  },
  {
    id: "rule72",
    prompt:
      "72의 법칙(n = 72/r)은 정확한 식 log2 ÷ log(1+r)의 어림값이에요. 표에서 어떤 이율일 때 가장 잘 맞고 어떤 이율에서 어긋났는지 관찰한 것을 적고, 그런데도 이 어림법을 쓰는 까닭을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 8% 부근에서 거의 정확했고 이율이 아주 작거나 클수록 오차가 커졌다. 그래도 암산으로 바로 계산할 수 있어서 실생활에서 빠르게 판단할 때 편리하다.",
  },
];

// ═════════════════════════════════════════════════════════
//  시네마틱 엔진
// ═════════════════════════════════════════════════════════
type SceneCtx = { t: number; sceneT: number; idx: number; duration: number };
type SceneDef = { id: string; label: string; duration: number; render: (ctx: SceneCtx) => ReactNode };

function lerp(a: number, b: number, u: number) { return a + (b - a) * u; }
function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function easeInOut(u: number) { return u * u * (3 - 2 * u); }
function easeOut(u: number) { return 1 - (1 - u) * (1 - u); }
function totalDur(scenes: SceneDef[]) { return scenes.reduce((s, sc) => s + sc.duration, 0); }
function findScene(scenes: SceneDef[], t: number): SceneCtx {
  let acc = 0;
  for (let i = 0; i < scenes.length; i++) {
    const end = acc + scenes[i].duration;
    if (t < end) return { t, sceneT: t - acc, idx: i, duration: scenes[i].duration };
    acc = end;
  }
  const last = scenes.length - 1;
  return { t, sceneT: scenes[last].duration, idx: last, duration: scenes[last].duration };
}
function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function CinematicPlayer({ scenes, height = 440 }: { scenes: SceneDef[]; height?: number }) {
  const total = totalDur(scenes);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const rawId = useId();
  const gradId = `cine72-${rawId.replace(/:/g, "")}`;

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    lastRef.current = 0;
    function tick(now: number) {
      if (cancelled) return;
      const dt = lastRef.current === 0 ? 0 : now - lastRef.current;
      lastRef.current = now;
      setT((prev) => {
        const next = prev + dt;
        if (next >= total) { setPlaying(false); return total; }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, total]);

  const ctx = findScene(scenes, t);
  const scene = scenes[ctx.idx];

  function onPlayPause() {
    if (t >= total) setT(0);
    setPlaying((p) => !p);
  }
  function onSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setT(clamp01((e.clientX - rect.left) / rect.width) * total);
  }
  function jump(i: number) {
    let acc = 0;
    for (let k = 0; k < i; k++) acc += scenes[k].duration;
    setT(acc);
  }

  const progPct = (t / total) * 100;
  let acc = 0;
  const chapters: number[] = [];
  for (let i = 0; i < scenes.length - 1; i++) { acc += scenes[i].duration; chapters.push((acc / total) * 100); }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl shadow-black/40" role="region" aria-label="맨해튼 24달러 이야기 영상">
      <div className="relative w-full overflow-hidden bg-slate-950" style={{ height }}>
        {scene.render(ctx)}
        {!playing ? (
          <button type="button" onClick={onPlayPause}
            className={"absolute inset-0 flex items-center justify-center transition " + (t === 0 ? "bg-black/45 backdrop-blur-[2px] hover:bg-black/60" : "bg-black/25 hover:bg-black/40")}
            aria-label={t === 0 ? "영상 재생" : "이어보기"}>
            <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/40 bg-white/15 text-3xl text-white transition hover:scale-110 hover:bg-white/25">▶</span>
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 bg-slate-950/80 px-3 py-2">
        <button type="button" onClick={onPlayPause}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-base text-white transition hover:bg-white/20"
          aria-label={playing ? "일시정지" : "재생"}>
          {playing ? "⏸" : "▶"}
        </button>
        <button type="button" onClick={() => { setT(0); setPlaying(true); }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-sm text-slate-300 transition hover:bg-white/15"
          aria-label="처음부터 다시">↻</button>
        <div className="relative h-8 flex-1 cursor-pointer" onClick={onSeek} role="progressbar"
          aria-label="진행 위치 (클릭으로 이동)" aria-valuetext={`${fmtTime(t)} / ${fmtTime(total)}`} tabIndex={0}>
          <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
            <svg viewBox="0 0 100 1" preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <linearGradient id={gradId} x1="0" x2="1">
                  <stop offset="0%" stopColor="#fcd34d" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" height="1" width={progPct} fill={`url(#${gradId})`} />
            </svg>
          </div>
          {chapters.map((c, i) => (
            <div key={i} className="absolute top-1/2 h-2 w-0.5 -translate-y-1/2 bg-white/30" style={{ left: `${c}%` }} aria-hidden />
          ))}
        </div>
        <span className="font-mono text-[11px] tabular-nums text-slate-400">{fmtTime(t)} / {fmtTime(total)}</span>
      </div>

      {/* 챕터 */}
      <div className="flex flex-wrap gap-1.5 border-t border-white/10 bg-slate-950/60 px-3 py-2">
        {scenes.map((s, i) => (
          <button key={s.id} type="button" onClick={() => jump(i)}
            className={"rounded-lg border px-2 py-0.5 text-[11px] font-bold transition " + (ctx.idx === i ? "border-amber-400/60 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")}>
            {i + 1}. {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 시네마틱 프리미티브 ──────────────────────────────────
function FadeBlock({ sceneT, start, fadeMs = 700, outAt, outMs = 600, className, children }: {
  sceneT: number; start: number; fadeMs?: number; outAt?: number; outMs?: number; className?: string; children: ReactNode;
}) {
  const elapsed = sceneT - start;
  let op = 0, ty = 10;
  if (elapsed >= 0) { const u = easeOut(clamp01(elapsed / fadeMs)); op = u; ty = (1 - u) * 10; }
  if (outAt !== undefined && sceneT >= outAt) op = Math.max(0, op - clamp01((sceneT - outAt) / outMs));
  if (op <= 0) return null;
  return <div className={className} style={{ opacity: op, transform: `translateY(${ty}px)` }}>{children}</div>;
}

function TypedText({ text, sceneT, start, charMs = 52, className }: {
  text: string; sceneT: number; start: number; charMs?: number; className?: string;
}) {
  const elapsed = sceneT - start;
  if (elapsed < 0) return <span className={className} style={{ visibility: "hidden" }}>{text}</span>;
  const chars = Math.min(text.length, Math.floor(elapsed / charMs));
  const done = chars >= text.length;
  return (
    <span className={className}>
      {text.slice(0, chars)}
      {!done ? <span aria-hidden className="ml-[1px] inline-block h-[1em] w-[2px] translate-y-[0.18em] animate-pulse bg-current" /> : null}
    </span>
  );
}

/** 지수적으로 커지는 값을 부드럽게 보간(로그 보간)해 카운터에 쓴다 */
function logCount(from: number, to: number, u: number) {
  const lf = Math.log(Math.max(from, 1e-9));
  const lt = Math.log(Math.max(to, 1e-9));
  return Math.exp(lerp(lf, lt, u));
}

// ─── 배경 아트 ────────────────────────────────────────────
const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: ((i * 97) % 100) + ((i % 5) * 0.7),
  y: ((i * 43) % 46) + 2,
  r: 0.25 + ((i * 13) % 7) / 12,
  ph: (i * 37) % 100,
}));

function NightSky({ sceneT, moon = true }: { sceneT: number; moon?: boolean }) {
  return (
    <g>
      <defs>
        <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#05070f" />
          <stop offset="55%" stopColor="#0b1a35" />
          <stop offset="100%" stopColor="#123152" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={160} height={90} fill="url(#skyG)" />
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x * 1.6} cy={s.y} r={s.r}
          fill="#e2e8f0" opacity={0.35 + 0.5 * Math.abs(Math.sin((sceneT / 900) + s.ph))} />
      ))}
      {moon ? (
        <>
          <circle cx={132} cy={17} r={7.5} fill="#fde68a" opacity={0.25} />
          <circle cx={132} cy={17} r={5} fill="#fef3c7" />
        </>
      ) : null}
    </g>
  );
}

function Waves({ sceneT, y = 62, color = "#0e4d6b", speed = 1, opacity = 1 }: {
  sceneT: number; y?: number; color?: string; speed?: number; opacity?: number;
}) {
  const p = (sceneT / 1000) * 6 * speed;
  const path = (off: number) => {
    let d = `M -20 ${y + off}`;
    for (let x = -20; x <= 180; x += 10) {
      d += ` Q ${x + 5} ${y + off + 1.6 * Math.sin((x + p) / 9)} ${x + 10} ${y + off}`;
    }
    return d + ` L 180 90 L -20 90 Z`;
  };
  return (
    <g opacity={opacity}>
      <path d={path(0)} fill={color} />
      <path d={path(3.5)} fill={color} opacity={0.75} />
      <path d={path(7)} fill="#0a3550" opacity={0.9} />
    </g>
  );
}

/** 범선 실루엣 */
function Ship({ x, y, scale = 1, bob = 0 }: { x: number; y: number; scale?: number; bob?: number }) {
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${scale})`}>
      <path d="M -11 0 L 11 0 L 8 4.5 L -8 4.5 Z" fill="#1f2937" />
      <rect x={-0.5} y={-16} width={1} height={16} fill="#111827" />
      <rect x={-7.5} y={-11} width={1} height={11} fill="#111827" />
      <rect x={6.5} y={-12} width={1} height={12} fill="#111827" />
      <path d="M 0 -15 L 6 -6 L 0 -6 Z" fill="#e5e7eb" opacity={0.92} />
      <path d="M 0 -15 L -6 -6 L 0 -6 Z" fill="#cbd5e1" opacity={0.92} />
      <path d="M -7 -10 L -2.5 -3.5 L -7 -3.5 Z" fill="#e5e7eb" opacity={0.8} />
      <path d="M 7 -11 L 2.5 -4 L 7 -4 Z" fill="#cbd5e1" opacity={0.8} />
      <path d="M -11 0 L -13.5 -2 L -11 -2 Z" fill="#1f2937" />
    </g>
  );
}

/** 섬 — u=0 숲, u=1 마천루 */
const BUILDINGS = [
  { x: 44, w: 5, h0: 4, h1: 20 }, { x: 50, w: 4, h0: 3, h1: 30 }, { x: 55, w: 6, h0: 5, h1: 16 },
  { x: 62, w: 4, h0: 3, h1: 26 }, { x: 67, w: 5, h0: 4, h1: 38 }, { x: 73, w: 4, h0: 3, h1: 22 },
  { x: 78, w: 6, h0: 5, h1: 30 }, { x: 85, w: 4, h0: 3, h1: 18 }, { x: 90, w: 5, h0: 4, h1: 34 },
  { x: 96, w: 4, h0: 3, h1: 24 }, { x: 101, w: 6, h0: 5, h1: 14 }, { x: 108, w: 4, h0: 3, h1: 28 },
];

function Island({ u, baseY = 62 }: { u: number; baseY?: number }) {
  const e = easeInOut(clamp01(u));
  return (
    <g>
      <path d={`M 34 ${baseY} Q 75 ${baseY - 7} 120 ${baseY} Z`} fill="#14532d" opacity={0.9} />
      <rect x={34} y={baseY - 1.5} width={86} height={3} fill="#14532d" />
      {BUILDINGS.map((b, i) => {
        const h = lerp(b.h0, b.h1, e);
        return (
          <g key={i}>
            <rect x={b.x} y={baseY - 1.5 - h} width={b.w} height={h}
              fill={e > 0.5 ? "#1e293b" : "#166534"} opacity={0.95} />
            {e > 0.45 ? (
              <g opacity={(e - 0.45) / 0.55}>
                {Array.from({ length: Math.max(1, Math.floor(h / 4)) }, (_, k) => (
                  <rect key={k} x={b.x + 1} y={baseY - 4 - k * 4} width={b.w - 2} height={1.4}
                    fill="#fcd34d" opacity={((i + k) % 3 === 0 ? 0.85 : 0.35)} />
                ))}
              </g>
            ) : (
              <circle cx={b.x + b.w / 2} cy={baseY - 1.5 - h} r={2.2 * (1 - e)} fill="#166534" />
            )}
          </g>
        );
      })}
    </g>
  );
}

function Stage({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      {children}
    </svg>
  );
}

function Vignette() {
  return <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,6,23,0.75)_100%)]" />;
}

// ─── 성장 그래프(로그 눈금) ───────────────────────────────
function GrowthCurve({ u, rate = 0.08 }: { u: number; rate?: number }) {
  // x: 0~1 (400년), y: 로그 스케일
  const finalV = grow(PRINCIPAL_USD, rate, YEARS);
  const lmin = Math.log10(PRINCIPAL_USD);
  const lmax = Math.log10(finalV);
  const X = (f: number) => 14 + f * 132;
  const Y = (v: number) => 78 - ((Math.log10(v) - lmin) / (lmax - lmin)) * 58;
  const N = 80;
  const upto = Math.max(1, Math.round(N * clamp01(u)));
  const pts = Array.from({ length: upto + 1 }, (_, i) => {
    const f = i / N;
    return `${X(f)},${Y(grow(PRINCIPAL_USD, rate, YEARS * f))}`;
  }).join(" ");
  const headF = clamp01(u);
  return (
    <g>
      <line x1={14} x2={146} y1={78} y2={78} stroke="rgba(255,255,255,0.25)" strokeWidth={0.4} />
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={X(f)} x2={X(f)} y1={78} y2={79.5} stroke="rgba(255,255,255,0.3)" strokeWidth={0.4} />
          <text x={X(f)} y={83.5} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 3 }}>
            {Math.round(BUY_YEAR + YEARS * f)}
          </text>
        </g>
      ))}
      <polyline points={pts} fill="none" stroke="#fbbf24" strokeWidth={1.2} strokeLinecap="round" />
      <circle cx={X(headF)} cy={Y(grow(PRINCIPAL_USD, rate, YEARS * headF))} r={1.6} fill="#fde68a" />
      <circle cx={X(headF)} cy={Y(grow(PRINCIPAL_USD, rate, YEARS * headF))} r={3} fill="#fbbf24" opacity={0.3} />
      <text x={14} y={17} className="fill-slate-500" style={{ fontSize: 3 }}>세로축은 로그 눈금 (한 칸에 10배)</text>
    </g>
  );
}

// ─── 로그 막대 비교 ───────────────────────────────────────
function LogBars({ items, maxV, sceneT, start = 0 }: {
  items: { label: string; value: number; color: string; emoji?: string }[];
  maxV: number; sceneT: number; start?: number;
}) {
  const lmin = Math.log10(1e4);
  const lmax = Math.log10(maxV);
  return (
    <div className="w-full space-y-1.5">
      {items.map((it, i) => {
        const u = easeOut(clamp01((sceneT - start - i * 260) / 800));
        const w = clamp01((Math.log10(Math.max(it.value, 1e4)) - lmin) / (lmax - lmin)) * 100 * u;
        return (
          <div key={it.label} className="flex items-center gap-2">
            <span className="w-32 shrink-0 truncate text-right text-[11px] text-slate-300">{it.emoji} {it.label}</span>
            <div className="h-3 flex-1 overflow-hidden rounded bg-white/10">
              <div className="h-full rounded" style={{ width: `${w}%`, backgroundColor: it.color }} />
            </div>
            <span className="w-24 shrink-0 font-mono text-[11px] text-slate-200" style={{ opacity: u }}>{fmtUSD(it.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
//  장면들
// ═════════════════════════════════════════════════════════
const FINAL8 = grow(PRINCIPAL_USD, 0.08, YEARS);

const SCENES: SceneDef[] = [
  // 1. 타이틀
  {
    id: "s1", label: "타이틀", duration: 5200,
    render: ({ sceneT }) => (
      <>
        <Stage>
          <NightSky sceneT={sceneT} />
          <Waves sceneT={sceneT} y={64} />
          <Island u={0.15} />
        </Stage>
        <Vignette />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <FadeBlock sceneT={sceneT} start={200} fadeMs={900}>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.45em] text-emerald-300">A TRUE STORY</p>
          </FadeBlock>
          <FadeBlock sceneT={sceneT} start={800} fadeMs={1100}>
            <h2 className="mt-3 bg-gradient-to-r from-amber-200 via-emerald-200 to-sky-300 bg-clip-text font-serif text-3xl font-bold text-transparent sm:text-5xl">
              맨해튼, 24달러의 전설
            </h2>
          </FadeBlock>
          <FadeBlock sceneT={sceneT} start={1900} fadeMs={900}>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">1626 → 2026 · 400년의 복리</p>
          </FadeBlock>
          <FadeBlock sceneT={sceneT} start={3000} fadeMs={900}>
            <p className="mt-5 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-[11px] text-slate-400">
              작은 돈 + 긴 시간 + 복리 = ?
            </p>
          </FadeBlock>
        </div>
      </>
    ),
  },

  // 2. 1626년 항해
  {
    id: "s2", label: "1626년", duration: 12000,
    render: ({ sceneT, duration }) => {
      const u = clamp01(sceneT / duration);
      return (
        <>
          <Stage>
            <NightSky sceneT={sceneT} />
            <Waves sceneT={sceneT} y={66} color="#0b3d57" speed={0.8} />
            <Ship x={lerp(-16, 96, easeInOut(u))} y={64} scale={lerp(0.7, 1.25, u)} bob={Math.sin(sceneT / 520) * 0.9} />
            <Waves sceneT={sceneT} y={72} color="#072c42" speed={1.5} opacity={0.95} />
          </Stage>
          <Vignette />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <FadeBlock sceneT={sceneT} start={200}>
              <p className="font-serif text-sm italic text-emerald-300">1626년, 대서양</p>
            </FadeBlock>
            <h3 className="mt-1 font-serif text-2xl text-amber-100 sm:text-3xl">
              <TypedText sceneT={sceneT} start={800} text="한 척의 배가 신대륙에 닿았다." charMs={62} />
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              <TypedText sceneT={sceneT} start={3400} charMs={45} text="네덜란드 서인도회사의 총독, 피터 미누이트(Peter Minuit)." />
            </p>
            <FadeBlock sceneT={sceneT} start={7200} className="mt-3">
              <p className="inline-block rounded-lg border border-amber-300/30 bg-amber-300/[0.08] px-3 py-1.5 text-[11px] leading-5 text-amber-100">
                ℹ️ 흔히 ‘동인도회사’로 잘못 알려져 있어요. 아시아를 맡은 동인도회사와 달리,
                아메리카를 맡은 회사는 <b>서인도회사</b>였습니다.
              </p>
            </FadeBlock>
          </div>
        </>
      );
    },
  },

  // 3. 거래
  {
    id: "s3", label: "24달러", duration: 14000,
    render: ({ sceneT }) => {
      const goods = ["🧵", "🪞", "🫖", "🪓", "📿", "🧶"];
      return (
        <>
          <Stage>
            <NightSky sceneT={sceneT} moon={false} />
            <rect x={0} y={0} width={160} height={90} fill="#0f172a" opacity={0.35} />
            <Waves sceneT={sceneT} y={70} color="#0b3d57" speed={0.6} />
            <Island u={0} baseY={70} />
          </Stage>
          <Vignette />
          <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8">
            <FadeBlock sceneT={sceneT} start={200}>
              <p className="font-serif text-sm italic text-emerald-300">1626년 5월, 맨해튼</p>
            </FadeBlock>
            <h3 className="mt-1 font-serif text-2xl text-amber-100 sm:text-3xl">
              <TypedText sceneT={sceneT} start={700} text="그는 이 섬을 사들였다." charMs={70} />
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              <TypedText sceneT={sceneT} start={2800} charMs={42} text="원래 살던 레나페(Lenape)족에게서, 60길더어치의 물품을 주고." />
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {goods.map((g, i) => (
                <FadeBlock key={i} sceneT={sceneT} start={5600 + i * 240} fadeMs={500}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/25 bg-amber-300/10 text-xl">{g}</span>
                </FadeBlock>
              ))}
            </div>
            <FadeBlock sceneT={sceneT} start={8200} className="mt-3">
              <p className="max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                200여 년 뒤, 한 역사가가 그 60길더를 당시 환율로 환산했다 —{" "}
                <b className="font-mono text-2xl text-amber-200">$24</b>
              </p>
            </FadeBlock>
            <FadeBlock sceneT={sceneT} start={11000} className="mt-2">
              <p className="inline-block rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] leading-5 text-slate-300">
                📜 유일한 1차 사료는 1626년 11월 5일 피터 스카헨의 편지예요. 대금은 현금이 아니라 <b>교역 물품</b>이었고,
                레나페족에게는 땅을 사고판다는 개념 자체가 달랐다고 전해집니다.
              </p>
            </FadeBlock>
          </div>
        </>
      );
    },
  },

  // 4. 질문
  {
    id: "s4", label: "만약에", duration: 9000,
    render: ({ sceneT }) => {
      const pulse = 1 + 0.06 * Math.sin(sceneT / 380);
      return (
        <>
          <Stage>
            <NightSky sceneT={sceneT} />
            <Waves sceneT={sceneT} y={74} color="#082f49" speed={0.5} opacity={0.7} />
          </Stage>
          <Vignette />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <FadeBlock sceneT={sceneT} start={300} fadeMs={800}>
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-300/50 bg-gradient-to-br from-amber-200 to-amber-500 text-3xl font-bold text-amber-900 shadow-[0_0_40px_rgba(251,191,36,0.45)]"
                style={{ transform: `scale(${pulse})` }}>
                $24
              </div>
            </FadeBlock>
            <h3 className="mt-6 font-serif text-2xl text-slate-100 sm:text-3xl">
              <TypedText sceneT={sceneT} start={1600} text="만약 그 24달러를 은행에 맡겼다면?" charMs={62} />
            </h3>
            <FadeBlock sceneT={sceneT} start={4800} className="mt-4">
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-emerald-200">연이율 8%</span>
                <span className="text-slate-500">·</span>
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-emerald-200">복리</span>
                <span className="text-slate-500">·</span>
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-emerald-200">400년</span>
              </div>
            </FadeBlock>
            <FadeBlock sceneT={sceneT} start={6600} className="mt-4">
              <p className="font-mono text-sm text-slate-400">24 × (1 + 0.08)<sup>400</sup> = ?</p>
            </FadeBlock>
          </div>
        </>
      );
    },
  },

  // 5. 400년의 복리
  {
    id: "s5", label: "400년", duration: 20000,
    render: ({ sceneT }) => {
      const u = easeInOut(clamp01((sceneT - 1200) / 14000));
      const year = Math.round(lerp(BUY_YEAR, NOW_YEAR, u));
      const amount = logCount(PRINCIPAL_USD, FINAL8, u);
      const doublings = Math.floor((YEARS * u) / exactDouble(8));
      return (
        <>
          <Stage>
            <NightSky sceneT={sceneT} moon={false} />
            <GrowthCurve u={u} />
          </Stage>
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
            <div>
              <p className="font-mono text-xs text-slate-400">YEAR</p>
              <p className="font-mono text-3xl font-bold text-slate-100 tabular-nums sm:text-4xl">{year}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-slate-400">24달러가 자라서</p>
              <p className="font-mono text-3xl font-bold text-amber-200 tabular-nums sm:text-4xl">{fmtUSD(amount)}</p>
              <p className="mt-0.5 font-mono text-[11px] text-emerald-300">두 배가 된 횟수 {doublings}번</p>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <FadeBlock sceneT={sceneT} start={300} outAt={4200}>
              <p className="font-serif text-lg text-amber-100 sm:text-2xl">복리가 시작된다.</p>
            </FadeBlock>
            <FadeBlock sceneT={sceneT} start={5000} outAt={9500}>
              <p className="max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
                200년이 지나도 그래프는 바닥에 붙어 있는 것처럼 보인다. 로그 눈금인데도.
              </p>
            </FadeBlock>
            <FadeBlock sceneT={sceneT} start={10200} outAt={15000}>
              <p className="max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
                그러나 이자가 이자를 낳는 힘은 멈추지 않는다. 9년마다 정확히 두 배씩.
              </p>
            </FadeBlock>
            <FadeBlock sceneT={sceneT} start={15600}>
              <p className="max-w-2xl font-serif text-lg leading-8 text-amber-100 sm:text-2xl">
                400년 뒤 — <b className="font-mono">{fmtUSD(FINAL8)}</b>
              </p>
            </FadeBlock>
          </div>
        </>
      );
    },
  },

  // 6. 얼마나 큰 돈일까
  {
    id: "s6", label: "비교", duration: 13000,
    render: ({ sceneT }) => (
      <>
        <Stage>
          <NightSky sceneT={sceneT} moon={false} />
          <Waves sceneT={sceneT} y={78} color="#082f49" speed={0.4} opacity={0.55} />
          <Island u={1} baseY={78} />
        </Stage>
        <Vignette />
        <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8">
          <FadeBlock sceneT={sceneT} start={200}>
            <h3 className="font-serif text-xl text-amber-100 sm:text-2xl">이게 얼마나 큰 돈일까?</h3>
          </FadeBlock>
          <FadeBlock sceneT={sceneT} start={900} className="mt-3">
            <LogBars sceneT={sceneT} start={1200} maxV={FINAL8}
              items={[
                ...BENCHES.map((b, i) => ({ label: b.label, value: b.usd, emoji: b.emoji, color: ["#64748b", "#0ea5e9", "#22d3ee", "#38bdf8", "#34d399"][i] })),
                { label: "24달러의 400년", value: FINAL8, emoji: "💰", color: "#fbbf24" },
              ]} />
          </FadeBlock>
          <FadeBlock sceneT={sceneT} start={7600} className="mt-4">
            <p className="font-serif text-lg leading-8 text-amber-100 sm:text-2xl">
              전 세계가 <b>1년 동안 만들어 내는 부(GDP)의 약 5배</b>.
            </p>
          </FadeBlock>
          <FadeBlock sceneT={sceneT} start={10200} className="mt-2">
            <p className="text-xs text-slate-400">※ 막대는 로그 눈금이에요. 한 칸 차이가 10배씩 납니다.</p>
          </FadeBlock>
        </div>
      </>
    ),
  },

  // 7. 이율의 힘
  {
    id: "s7", label: "이율의 힘", duration: 13000,
    render: ({ sceneT }) => {
      const vals = RATE_SCENARIOS.map((r) => ({ r, v: grow(PRINCIPAL_USD, r / 100, YEARS) }));
      const ratio = vals[3].v / vals[2].v;
      return (
        <>
          <Stage>
            <NightSky sceneT={sceneT} moon={false} />
          </Stage>
          <Vignette />
          <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8">
            <FadeBlock sceneT={sceneT} start={200}>
              <h3 className="font-serif text-xl text-amber-100 sm:text-2xl">이율이 조금만 달랐다면?</h3>
            </FadeBlock>
            <FadeBlock sceneT={sceneT} start={800} className="mt-1">
              <p className="text-sm text-slate-300">똑같은 24달러, 똑같은 400년. 이율만 바꿨습니다.</p>
            </FadeBlock>
            <FadeBlock sceneT={sceneT} start={1400} className="mt-3">
              <LogBars sceneT={sceneT} start={1600} maxV={vals[3].v}
                items={vals.map((x, i) => ({
                  label: `연 ${x.r}%`, value: x.v, emoji: "📈",
                  color: ["#64748b", "#38bdf8", "#34d399", "#fbbf24"][i],
                }))} />
            </FadeBlock>
            <FadeBlock sceneT={sceneT} start={6600} className="mt-4">
              <p className="font-serif text-lg leading-8 text-amber-100 sm:text-2xl">
                8%와 6%의 차이는 겨우 2%p. 400년 뒤에는{" "}
                <b className="font-mono">{Math.round(ratio).toLocaleString("ko-KR")}배</b> 차이.
              </p>
            </FadeBlock>
            <FadeBlock sceneT={sceneT} start={9800} className="mt-2">
              <p className="text-sm text-slate-300">복리에서 이율은 <b className="text-amber-200">곱해지는 횟수만큼 힘이 커진다</b>.</p>
            </FadeBlock>
          </div>
        </>
      );
    },
  },

  // 8. 72의 법칙 예고
  {
    id: "s8", label: "72의 법칙", duration: 13000,
    render: ({ sceneT }) => {
      const steps = Math.min(8, Math.floor(clamp01((sceneT - 3800) / 5200) * 9));
      return (
        <>
          <Stage><NightSky sceneT={sceneT} moon={false} /></Stage>
          <Vignette />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center sm:px-8">
            <FadeBlock sceneT={sceneT} start={200}>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.4em] text-emerald-300">THE RULE OF 72</p>
            </FadeBlock>
            <h3 className="mt-2 font-serif text-2xl text-amber-100 sm:text-3xl">
              <TypedText sceneT={sceneT} start={700} text="그런데, 두 배가 되는 데 얼마나 걸릴까?" charMs={55} />
            </h3>
            <FadeBlock sceneT={sceneT} start={3200} className="mt-4">
              <p className="font-mono text-xl text-emerald-200 sm:text-2xl">n = 72 ÷ r</p>
            </FadeBlock>
            <FadeBlock sceneT={sceneT} start={3900} className="mt-1">
              <p className="text-sm text-slate-300">연이율 8% → 72 ÷ 8 = <b className="text-amber-200">9년마다 두 배</b></p>
            </FadeBlock>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i}
                  className={"rounded-lg border px-2 py-1 font-mono text-[11px] font-bold transition " + (i < steps ? "border-amber-400/60 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-600")}>
                  ×2
                </span>
              ))}
              <span className="ml-1 text-slate-500">…</span>
            </div>
            <FadeBlock sceneT={sceneT} start={9200} className="mt-4">
              <p className="max-w-2xl font-serif text-lg leading-8 text-amber-100 sm:text-xl">
                400 ÷ 9 ≈ <b>44번</b>의 두 배. 2<sup>44</sup> ≈ 17조 배!
              </p>
            </FadeBlock>
          </div>
        </>
      );
    },
  },

  // 9. 엔딩
  {
    id: "s9", label: "엔딩", duration: 7000,
    render: ({ sceneT }) => (
      <>
        <Stage>
          <NightSky sceneT={sceneT} />
          <Waves sceneT={sceneT} y={72} color="#0b3d57" speed={0.5} />
          <Island u={1} baseY={72} />
        </Stage>
        <Vignette />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <FadeBlock sceneT={sceneT} start={300} fadeMs={1000}>
            <p className="max-w-2xl font-serif text-xl leading-9 text-amber-100 sm:text-2xl">
              “복리야말로 인간의 가장 위대한 발명이다.”
            </p>
          </FadeBlock>
          <FadeBlock sceneT={sceneT} start={1800} fadeMs={800}>
            <p className="mt-2 text-sm text-slate-400">— 아인슈타인이 말했다고 전해진다</p>
          </FadeBlock>
          <FadeBlock sceneT={sceneT} start={3400} fadeMs={800}>
            <p className="mt-5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold text-emerald-200">
              이제 다음 탭에서 ‘72의 법칙’을 직접 확인해 봐요 →
            </p>
          </FadeBlock>
        </div>
      </>
    ),
  },
];

// ─── 포맷 ─────────────────────────────────────────────────
function won(v: number): string { return Math.round(v).toLocaleString("ko-KR") + "원"; }

// ═════════════════════════════════════════════════════════
//  메인
// ═════════════════════════════════════════════════════════
type Tab = "story" | "rule";

export default function RuleOf72Lab() {
  const [tab, setTab] = useState<Tab>("story");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🏝️ 맨해튼의 24달러와 72의 법칙</h3>
        <p className="mt-2 leading-7 text-slate-300">
          1626년 맨해튼 섬을 사고 치른 <b className="text-emerald-200">24달러</b>. 그 돈을 400년 동안 복리로 맡겼다면
          어떻게 되었을까요? 애니메이션으로 이야기를 본 뒤, 두 배가 되는 기간을 암산으로 구하는{" "}
          <b className="text-emerald-200">72의 법칙</b>을 직접 확인해 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "story"} onClick={() => setTab("story")}>① 맨해튼 24달러 이야기 🎬</TabButton>
        <TabButton active={tab === "rule"} onClick={() => setTab("rule")}>② 72의 법칙 확인하기</TabButton>
      </div>

      <div className="mt-4">{tab === "story" ? <StoryTab /> : <RuleTab />}</div>

      <p className="mt-4 text-xs leading-5 text-slate-500">📌 {DATA_NOTE}</p>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={"rounded-xl border-2 px-3 py-2 text-sm font-bold transition " + (active ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 이야기 + 직접 조작
// ══════════════════════════════════════════════════════════════
function StoryTab() {
  const [ratePct, setRatePct] = useState(8);
  const [years, setYears] = useState(YEARS);
  const v = grow(PRINCIPAL_USD, ratePct / 100, years);
  const doubles = ratePct > 0 ? years / exactDouble(ratePct) : 0;

  return (
    <div className="space-y-4">
      <CinematicPlayer scenes={SCENES} height={440} />

      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">🎮 직접 굴려 보세요 — 24달러 타임머신</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          {BUY_YEAR}년의 <b className="text-amber-100">{PRINCIPAL_USD}달러</b>({GUILDERS}길더어치 물품)를 이율과 기간을 바꿔 가며 굴려 보세요.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <label htmlFor="r72" className="text-xs font-bold text-slate-300">
              연이율: <span className="font-mono text-amber-200">{ratePct.toFixed(1)}%</span>
            </label>
            <input id="r72" type="range" min={1} max={12} step={0.5} value={ratePct}
              onChange={(e) => setRatePct(Number(e.target.value))}
              className="mt-2 w-full accent-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40" />
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <label htmlFor="y72" className="text-xs font-bold text-slate-300">
              기간: <span className="font-mono text-amber-200">{years}년 ({BUY_YEAR} → {BUY_YEAR + years})</span>
            </label>
            <input id="y72" type="range" min={10} max={400} step={10} value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="mt-2 w-full accent-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40" />
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Big label={`${BUY_YEAR + years}년의 금액`} value={fmtUSD(v)} tone="amber" />
          <Big label="두 배가 된 횟수" value={`${doubles.toFixed(1)}번`} tone="emerald" />
          <Big label="72의 법칙으로 어림한 배가 기간" value={`${rule72(ratePct).toFixed(1)}년`} tone="sky" />
        </div>

        <div className="mt-3 space-y-1.5">
          {[...BENCHES, { id: "me", emoji: "💰", label: `${PRINCIPAL_USD}달러의 ${years}년`, usd: v, note: "" }].map((b, i) => {
            const maxV = Math.max(v, BENCHES[BENCHES.length - 1].usd);
            const lmin = Math.log10(1e4), lmax = Math.log10(maxV);
            const w = clamp01((Math.log10(Math.max(b.usd, 1e4)) - lmin) / (lmax - lmin)) * 100;
            const mine = b.id === "me";
            return (
              <div key={b.id} className="flex items-center gap-2">
                <span className={"w-36 shrink-0 truncate text-right text-[11px] " + (mine ? "font-bold text-amber-200" : "text-slate-400")}>{b.emoji} {b.label}</span>
                <div className="h-3 flex-1 overflow-hidden rounded bg-white/10">
                  <div className="h-full rounded" style={{ width: `${w}%`, backgroundColor: mine ? "#fbbf24" : ["#64748b", "#0ea5e9", "#22d3ee", "#38bdf8", "#34d399"][i] }} />
                </div>
                <span className={"w-24 shrink-0 font-mono text-[11px] " + (mine ? "font-bold text-amber-200" : "text-slate-300")}>{fmtUSD(b.usd)}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">※ 가로 막대는 로그 눈금(한 칸에 10배)이에요. 비교 수치는 개략치입니다.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📜 사실 확인 — 이야기 속 진짜와 오해</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <FactCard ok title="서인도회사가 맞아요"
            body="아메리카를 맡은 회사는 네덜란드 서인도회사(WIC)예요. 아시아를 맡은 동인도회사(VOC)와 자주 혼동돼요." />
          <FactCard ok title="60길더어치 ‘물품’"
            body="현금이 아니라 천·도구 같은 교역 물품으로 치렀어요. 1626년 11월 5일 스카헨의 편지가 유일한 1차 사료예요." />
          <FactCard title="‘24달러’는 나중에 붙은 값"
            body="1846년에 한 역사가가 60길더를 당시 환율로 환산해 24달러라고 적은 것이 굳어졌어요." />
          <FactCard title="아인슈타인의 말일까?"
            body="‘복리는 인간의 가장 위대한 발명’은 아인슈타인의 말로 널리 인용되지만, 실제로 그가 말했다는 근거는 확인되지 않았어요." />
        </div>
      </div>
    </div>
  );
}

function FactCard({ ok, title, body }: { ok?: boolean; title: string; body: string }) {
  return (
    <div className={"rounded-xl border px-3 py-2 " + (ok ? "border-emerald-400/30 bg-emerald-400/[0.07]" : "border-amber-400/30 bg-amber-400/[0.07]")}>
      <p className={"text-xs font-bold " + (ok ? "text-emerald-200" : "text-amber-200")}>{ok ? "✅" : "⚠️"} {title}</p>
      <p className="mt-0.5 text-[11px] leading-4 text-slate-300">{body}</p>
    </div>
  );
}

const BIG_TONE: Record<string, string> = {
  amber: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  emerald: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  sky: "border-sky-400/40 bg-sky-400/10 text-sky-100",
  violet: "border-violet-400/40 bg-violet-400/10 text-violet-100",
};

function Big({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={"rounded-xl border px-4 py-3 text-center " + BIG_TONE[tone]}>
      <p className="text-xs font-bold opacity-80">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold">{value}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 72의 법칙
// ══════════════════════════════════════════════════════════════
function RuleTab() {
  const [ratePct, setRatePct] = useState(3);
  const [principal, setPrincipal] = useState(1_000_000);
  const [target, setTarget] = useState(10);
  const [ans, setAns] = useState<Record<string, { text: string; ok: boolean; tries: number; hint: boolean }>>({});

  const n72 = rule72(ratePct);
  const nExact = exactDouble(ratePct);
  const factor = Math.pow(1 + ratePct / 100, n72);
  const err = ((n72 - nExact) / nExact) * 100;

  function get(id: string) { return ans[id] ?? { text: "", ok: false, tries: 0, hint: false }; }
  function check(id: string, answer: number) {
    setAns((p) => {
      const cur = p[id] ?? { text: "", ok: false, tries: 0, hint: false };
      const v = Number(cur.text.replace(/[,\s년%]/g, ""));
      return { ...p, [id]: { ...cur, ok: Number.isFinite(v) && cur.text.trim() !== "" && Math.abs(v - answer) < 0.05, tries: cur.tries + 1 } };
    });
  }
  function setText(id: string, text: string) {
    setAns((p) => ({ ...p, [id]: { ...(p[id] ?? { text: "", ok: false, tries: 0, hint: false }), text } }));
  }
  function toggleHint(id: string) {
    setAns((p) => {
      const cur = p[id] ?? { text: "", ok: false, tries: 0, hint: false };
      return { ...p, [id]: { ...cur, hint: !cur.hint } };
    });
  }

  const solved = CHALLENGES.filter((c) => get(c.id).ok).length;

  return (
    <div className="space-y-4">
      {/* 법칙 소개 */}
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">📐 72의 법칙</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          복리로 굴릴 때 <b className="text-emerald-100">원금이 두 배가 되는 기간</b>을 암산으로 어림하는 방법이에요.
        </p>
        <div className="mt-3 rounded-xl border border-emerald-400/30 bg-black/25 px-4 py-3 text-center">
          <p className="text-sm text-slate-300">연이율 <span className="font-mono text-emerald-200">r %</span>일 때, 원금이 두 배가 되는 기간 <span className="font-mono text-emerald-200">n</span>년은</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-100">n = 72 ÷ r</p>
        </div>
      </div>

      {/* 활동 ① 확인 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">🧪 활동 ① 정말 두 배가 될까? 직접 확인하기</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <label htmlFor="rr" className="text-xs font-bold text-slate-300">
              연이율 r: <span className="font-mono text-emerald-200">{ratePct}%</span>
            </label>
            <input id="rr" type="range" min={1} max={20} step={1} value={ratePct}
              onChange={(e) => setRatePct(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40" />
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <label htmlFor="pp" className="text-xs font-bold text-slate-300">
              원금: <span className="font-mono text-emerald-200">{won(principal)}</span>
            </label>
            <input id="pp" type="range" min={100_000} max={10_000_000} step={100_000} value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40" />
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <StepLine n={1} title="72의 법칙으로 기간 어림하기"
            expr={`n = 72 ÷ ${ratePct}`} value={`${n72.toFixed(2)}년`} />
          <StepLine n={2} title="그 기간만큼 복리로 굴리면"
            expr={`(1 + ${ratePct}/100)^${n72.toFixed(2)}`} value={factor.toFixed(4)} tone="amber" />
          <StepLine n={3} title="원금은 얼마가 될까"
            expr={`${won(principal)} × ${factor.toFixed(4)}`} value={won(principal * factor)} tone="emerald" />
        </div>

        <div className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.08] px-4 py-3 text-center">
          <p className="text-sm text-slate-200">
            원금의 <b className="font-mono text-2xl text-emerald-100">{factor.toFixed(3)}배</b> — 2에 아주 가깝죠?
          </p>
          <p className="mt-1 text-xs text-slate-400">
            정확한 배가 기간은 log2 ÷ log(1+r) = <b className="font-mono text-emerald-200">{nExact.toFixed(2)}년</b>{" "}
            (72의 법칙 오차 {err >= 0 ? "+" : ""}{err.toFixed(1)}%)
          </p>
        </div>

        {ratePct === 3 ? (
          <p className="mt-2 rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-1.5 text-xs leading-5 text-emerald-100">
            📖 교과서 활동 ①과 같은 조건이에요. 연 3% 복리로 24년이면 원금의 {Math.pow(1.03, 24).toFixed(3)}배 — 두 배가 맞네요!
          </p>
        ) : null}
      </div>

      {/* 교과서 표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📋 이율을 바꿔 가며 확인한 표</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="px-2 py-1.5 text-left font-semibold">r (연이율)</th>
                <th className="px-2 py-1.5 text-right font-semibold">n = 72 ÷ r</th>
                <th className="px-2 py-1.5 text-right font-semibold">(1 + r/100)ⁿ</th>
                <th className="px-2 py-1.5 text-right font-semibold">정확한 배가 기간</th>
                <th className="px-2 py-1.5 text-right font-semibold">오차</th>
              </tr>
            </thead>
            <tbody>
              {RULE_TABLE_RATES.map((r) => {
                const n = rule72(r);
                const f = Math.pow(1 + r / 100, n);
                const ex = exactDouble(r);
                const e = ((n - ex) / ex) * 100;
                const good = Math.abs(f - 2) < 0.01;
                return (
                  <tr key={r} className={"border-t border-white/5 " + (r === ratePct ? "bg-emerald-400/15" : "")}>
                    <td className="px-2 py-1 font-mono text-slate-200">{r}%</td>
                    <td className="px-2 py-1 text-right font-mono text-slate-200">{Number.isInteger(n) ? n : n.toFixed(1)}</td>
                    <td className={"px-2 py-1 text-right font-mono font-bold " + (good ? "text-emerald-200" : "text-amber-200")}>{f.toFixed(3)}</td>
                    <td className="px-2 py-1 text-right font-mono text-xs text-slate-400">{ex.toFixed(2)}년</td>
                    <td className="px-2 py-1 text-right font-mono text-xs text-slate-500">{e >= 0 ? "+" : ""}{e.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          어느 이율에서든 (1 + r/100)ⁿ이 <b className="text-emerald-200">2에 가깝게</b> 나와요. 특히 <b className="text-emerald-200">8% 부근</b>에서 가장 정확하고,
          이율이 아주 작거나 클수록 조금씩 어긋나요.
        </p>
      </div>

      {/* 활동 ② 역문제 */}
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <p className="text-sm font-bold text-sky-200">🎯 활동 ② 목표 기간 안에 두 배로 만들려면?</p>
        <label htmlFor="tg" className="mt-2 block text-xs font-bold text-slate-300">
          목표 기간: <span className="font-mono text-sky-200">{target}년</span>
        </label>
        <input id="tg" type="range" min={2} max={40} step={1} value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="mt-2 w-full accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Big label="72의 법칙 (72 ÷ n)" value={`연 ${(72 / target).toFixed(2)}%`} tone="sky" />
          <Big label="정확한 값 (2^(1/n) − 1)" value={`연 ${exactRate(target).toFixed(2)}%`} tone="emerald" />
          <Big label="차이" value={`${Math.abs(72 / target - exactRate(target)).toFixed(2)}%p`} tone="amber" />
        </div>
        {target === 10 ? (
          <p className="mt-2 rounded-lg border-l-4 border-sky-400 bg-sky-400/[0.08] px-3 py-1.5 text-xs leading-5 text-sky-100">
            📖 교과서 활동 ②의 답이에요. 10년 만에 두 배로 만들려면 연이율 <b className="font-mono">7.2%</b>가 필요해요(정확히는 7.18%).
          </p>
        ) : null}
      </div>

      {/* 두 배 사다리 */}
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <p className="text-sm font-bold text-violet-200">🪜 두 배 사다리 — 연 {ratePct}%로 굴린다면</p>
        <div className="mt-3 space-y-1.5">
          {[1, 2, 3, 4, 5].map((k) => {
            const yr = n72 * k;
            const mul = Math.pow(2, k);
            return (
              <div key={k} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-right font-mono text-xs text-slate-400">{yr.toFixed(1)}년</span>
                <div className="h-6 flex-1 overflow-hidden rounded-lg bg-white/10">
                  <div className="flex h-full items-center rounded-lg px-2"
                    style={{ width: `${(k / 5) * 100}%`, backgroundColor: `hsl(${268 - k * 12} 70% ${45 + k * 4}%)` }}>
                    <span className="font-mono text-[11px] font-bold text-white">×{mul}</span>
                  </div>
                </div>
                <span className="w-28 shrink-0 font-mono text-xs text-slate-200">{won(principal * mul)}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          두 배가 <b className="text-violet-200">한 번 더</b> 될 때마다 금액도 두 배예요. 시간이 <b className="text-violet-200">더해질</b> 때 돈은 <b className="text-violet-200">곱해집니다</b>.
        </p>
      </div>

      {/* 도전 문제 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🏆 72의 법칙 도전 문제</p>
          <span className="font-mono text-xs text-slate-300">해결 {solved} / {CHALLENGES.length}</span>
        </div>
        <div className="mt-2 space-y-2">
          {CHALLENGES.map((c) => {
            const st = get(c.id);
            return (
              <div key={c.id} className={"rounded-xl border p-3 " + (st.ok ? "border-emerald-400/40 bg-emerald-400/[0.07]" : "border-white/10 bg-slate-950/40")}>
                <p className="text-sm leading-6 text-slate-200">{c.emoji} {c.ask}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="text" inputMode="decimal" aria-label={c.ask} value={st.text} disabled={st.ok}
                    onChange={(e) => setText(c.id, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") check(c.id, c.answer); }}
                    placeholder="숫자만"
                    className="w-28 rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-right font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-300/40 disabled:opacity-60" />
                  <span className="text-sm text-slate-300">{c.suffix}</span>
                  {!st.ok ? (
                    <>
                      <button type="button" onClick={() => check(c.id, c.answer)}
                        className="rounded-lg border-2 border-emerald-400/55 bg-emerald-400/15 px-4 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/25">확인</button>
                      <button type="button" onClick={() => toggleHint(c.id)}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10">
                        💡 힌트 {st.hint ? "닫기" : "보기"}
                      </button>
                      {st.hint ? <span className="rounded-lg bg-black/25 px-2.5 py-1 font-mono text-[11px] text-slate-300">{c.hint}</span> : null}
                    </>
                  ) : null}
                </div>
                {st.ok ? (
                  <p className="mt-2 rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-1.5 text-xs leading-5 text-emerald-100">정답! ✅ {c.explain}</p>
                ) : st.tries > 0 ? (
                  <p className="mt-2 rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-1.5 text-xs leading-5 text-amber-100">아직이에요. 72를 나눠 보세요!</p>
                ) : null}
              </div>
            );
          })}
        </div>
        {solved === CHALLENGES.length ? (
          <p className="mt-3 rounded-xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] px-4 py-3 text-center text-sm font-bold text-emerald-100">
            🎉 모두 해결! 이제 이율만 보면 두 배 되는 기간이 머릿속에 바로 떠오르죠?
          </p>
        ) : null}
      </div>
    </div>
  );
}

const STEP_TONE: Record<string, string> = {
  slate: "border-white/10 bg-slate-950/40",
  amber: "border-amber-400/30 bg-amber-400/[0.07]",
  emerald: "border-emerald-400/30 bg-emerald-400/[0.07]",
};

function StepLine({ n, title, expr, value, tone = "slate" }: {
  n: number; title: string; expr: string; value: string; tone?: string;
}) {
  return (
    <div className={"rounded-xl border px-3 py-2 " + STEP_TONE[tone]}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-slate-100">
          <span className="mr-1.5 rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">{n}</span>{title}
        </span>
        <span className="font-mono text-lg font-bold text-slate-100">{value}</span>
      </div>
      <p className="mt-0.5 font-mono text-[11px] text-slate-400">{expr}</p>
    </div>
  );
}
