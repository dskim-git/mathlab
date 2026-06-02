"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ═════════════════════════════════════════════════════════
//  SceneEngine — 클라이언트 시네마틱 시퀀스 (1~2분 영상처럼 자동재생)
// ═════════════════════════════════════════════════════════
type SceneCtx = { t: number; sceneT: number; idx: number; duration: number };
type SceneDef = { id: string; duration: number; render: (ctx: SceneCtx) => ReactNode };

function lerp(a: number, b: number, u: number) {
  return a + (b - a) * u;
}
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
function easeInOut(u: number) {
  return u * u * (3 - 2 * u);
}
function totalDur(scenes: SceneDef[]) {
  return scenes.reduce((s, sc) => s + sc.duration, 0);
}
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
  const mm = String(Math.floor(s / 60)).padStart(1, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function CinematicPlayer({
  scenes,
  height = 460,
  ariaLabel,
}: {
  scenes: SceneDef[];
  height?: number;
  ariaLabel?: string;
}) {
  const total = totalDur(scenes);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

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
        if (next >= total) {
          setPlaying(false);
          return total;
        }
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
  function onRestart() {
    setT(0);
    setPlaying(true);
  }
  function onSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const u = clamp01((e.clientX - rect.left) / rect.width);
    setT(u * total);
  }

  const progPct = (t / total) * 100;

  // 장면 챕터 마커 위치
  let acc = 0;
  const chapters: number[] = [];
  for (let i = 0; i < scenes.length - 1; i++) {
    acc += scenes[i].duration;
    chapters.push((acc / total) * 100);
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl shadow-black/40"
      role="region"
      aria-label={ariaLabel ?? "시네마틱 영상"}
    >
      <div
        className="relative w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
        style={{ height }}
      >
        {scene.render(ctx)}

        {/* 일시정지 오버레이 (정지 + 시작 전) */}
        {!playing && t === 0 ? (
          <button
            type="button"
            onClick={onPlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition hover:bg-black/55"
            aria-label="영상 재생"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/40 bg-white/15 text-3xl text-white transition hover:scale-110 hover:bg-white/25">
              ▶
            </span>
          </button>
        ) : null}
        {!playing && t > 0 && t < total ? (
          <button
            type="button"
            onClick={onPlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/45"
            aria-label="이어보기"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-black/40 text-2xl text-white transition hover:scale-110">
              ▶
            </span>
          </button>
        ) : null}
      </div>

      {/* 컨트롤 바 */}
      <div className="flex items-center gap-3 border-t border-white/10 bg-slate-950/80 px-3 py-2">
        <button
          type="button"
          onClick={onPlayPause}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-base text-white transition hover:bg-white/20"
          aria-label={playing ? "일시정지" : "재생"}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-sm text-slate-300 transition hover:bg-white/15"
          aria-label="처음부터 다시"
        >
          ↻
        </button>
        <div
          className="relative h-8 flex-1 cursor-pointer"
          onClick={onSeek}
          role="progressbar"
          aria-label="진행 위치 (클릭으로 이동)"
          aria-valuetext={`${fmtTime(t)} / ${fmtTime(total)}`}
          tabIndex={0}
        >
          <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
            <svg viewBox="0 0 100 1" preserveAspectRatio="none" className="h-full w-full">
              <rect x="0" y="0" height="1" width={progPct} fill="url(#cineProg)" />
              <defs>
                <linearGradient id="cineProg" x1="0" x2="1">
                  <stop offset="0%" stopColor="#fcd34d" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {chapters.map((c, i) => (
            <div
              key={i}
              className="absolute top-1/2 h-2 w-0.5 -translate-y-1/2 bg-white/30"
              style={{ left: `${c}%` }}
              aria-hidden
            />
          ))}
        </div>
        <span className="font-mono text-[11px] tabular-nums text-slate-400">
          {fmtTime(t)} / {fmtTime(total)}
        </span>
      </div>
    </div>
  );
}

// ─── 시네마틱 프리미티브 ──────────────────────────────────
type KB = { scale: number; tx: number; ty: number; opacity?: number };

function KenBurnsImg({
  src,
  alt,
  sceneT,
  duration,
  from,
  to,
  className,
  objectPosition = "center",
}: {
  src: string;
  alt: string;
  sceneT: number;
  duration: number;
  from: KB;
  to: KB;
  className?: string;
  objectPosition?: string;
}) {
  const u = easeInOut(clamp01(sceneT / duration));
  const scale = lerp(from.scale, to.scale, u);
  const tx = lerp(from.tx, to.tx, u);
  const ty = lerp(from.ty, to.ty, u);
  const op = lerp(from.opacity ?? 1, to.opacity ?? 1, u);
  return (
    <img
      src={src}
      alt={alt}
      className={"absolute inset-0 h-full w-full object-cover " + (className ?? "")}
      style={{
        transform: `translate(${tx}%, ${ty}%) scale(${scale})`,
        opacity: op,
        objectPosition,
        transformOrigin: "center",
        filter: "sepia(0.18) contrast(1.05) brightness(0.92)",
      }}
    />
  );
}

// 진짜 수식 레이아웃 — 분수 + √ 위 가로선 (vinculum) 까지 표현.
function QuadraticFormulaProper({
  sizeClass = "text-2xl sm:text-3xl",
}: {
  sizeClass?: string;
}) {
  return (
    <div className={"inline-flex items-center gap-3 font-serif italic text-amber-100 " + sizeClass}>
      <span>x</span>
      <span className="not-italic">=</span>
      <div className="flex flex-col items-center leading-tight">
        {/* 분자 */}
        <span className="whitespace-nowrap px-3 pb-1">
          −b ± <span className="whitespace-nowrap">
            √
            <span className="border-t-2 border-current pl-0.5 pr-1">
              b<sup className="text-[0.6em]">2</sup> − 4ac
            </span>
          </span>
        </span>
        {/* 분수 가로선 */}
        <span aria-hidden className="block h-[2px] w-full self-stretch bg-current" />
        {/* 분모 */}
        <span className="not-italic pt-1">
          <span className="italic">2a</span>
        </span>
      </div>
    </div>
  );
}

// 임의 콘텐츠를 좌→우 reveal 클립으로 감싸는 시네마틱 래퍼.
function CinematicReveal({
  sceneT,
  start,
  drawMs = 2500,
  children,
}: {
  sceneT: number;
  start: number;
  drawMs?: number;
  children: ReactNode;
}) {
  const elapsed = sceneT - start;
  if (elapsed < 0) {
    return (
      <div style={{ visibility: "hidden" }} aria-hidden>
        {children}
      </div>
    );
  }
  const u = easeInOut(clamp01(elapsed / drawMs));
  return (
    <div
      style={{
        clipPath: `inset(0 ${(1 - u) * 100}% 0 0)`,
        WebkitClipPath: `inset(0 ${(1 - u) * 100}% 0 0)`,
      }}
    >
      {children}
    </div>
  );
}

function TypedText({
  text,
  sceneT,
  start,
  charMs = 55,
  className,
  cursor = true,
}: {
  text: string;
  sceneT: number;
  start: number;
  charMs?: number;
  className?: string;
  cursor?: boolean;
}) {
  const elapsed = sceneT - start;
  if (elapsed < 0)
    return (
      <span className={className} style={{ visibility: "hidden" }}>
        {text}
      </span>
    );
  const chars = Math.min(text.length, Math.floor(elapsed / charMs));
  const done = chars >= text.length;
  return (
    <span className={className}>
      {text.slice(0, chars)}
      {cursor && !done ? (
        <span
          aria-hidden
          className="ml-[1px] inline-block h-[1em] w-[2px] translate-y-[0.18em] animate-pulse bg-current"
        />
      ) : null}
    </span>
  );
}

function FadeBlock({
  sceneT,
  start,
  fadeMs = 600,
  outAt,
  outMs = 600,
  className,
  style,
  children,
}: {
  sceneT: number;
  start: number;
  fadeMs?: number;
  outAt?: number;
  outMs?: number;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const elapsed = sceneT - start;
  let op = 0;
  let ty = 8;
  if (elapsed >= 0) {
    const u = clamp01(elapsed / fadeMs);
    op = u;
    ty = (1 - u) * 8;
  }
  if (outAt !== undefined && sceneT >= outAt) {
    const ou = clamp01((sceneT - outAt) / outMs);
    op = Math.max(0, op - ou);
  }
  if (op <= 0) return null;
  return (
    <div
      className={className}
      style={{ ...style, opacity: op, transform: `translateY(${ty}px)` }}
    >
      {children}
    </div>
  );
}

function FormulaWrite({
  text,
  sceneT,
  start,
  drawMs = 1800,
  className,
  fontSize = 38,
  width = 720,
  height = 80,
}: {
  text: string;
  sceneT: number;
  start: number;
  drawMs?: number;
  className?: string;
  fontSize?: number;
  width?: number;
  height?: number;
}) {
  const id = useId();
  const elapsed = sceneT - start;
  if (elapsed < 0) return null;
  const u = clamp01(elapsed / drawMs);
  const eu = easeInOut(u);
  const clipW = width * eu;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={"block max-w-full " + (className ?? "")}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id={`fw-${id}`}>
          <rect x="0" y="0" height={height} width={clipW} />
        </clipPath>
        <linearGradient id={`fw-grad-${id}`} x1="0" x2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>
      </defs>
      <text
        x={width / 2}
        y={height / 2 + fontSize * 0.32}
        textAnchor="middle"
        fontSize={fontSize}
        fontStyle="italic"
        fontFamily="'Times New Roman', Georgia, serif"
        fill={`url(#fw-grad-${id})`}
        clipPath={`url(#fw-${id})`}
      >
        {text}
      </text>
    </svg>
  );
}

// ─── 부분 화면 레이아웃 헬퍼 ───────────────────────────────
function ScenePortraitNarration({
  imgSrc,
  imgAlt,
  sceneT,
  duration,
  from = { scale: 1.0, tx: 0, ty: 0 },
  to = { scale: 1.18, tx: 0, ty: -2 },
  objectPosition = "center top",
  children,
}: {
  imgSrc: string;
  imgAlt: string;
  sceneT: number;
  duration: number;
  from?: KB;
  to?: KB;
  objectPosition?: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <KenBurnsImg
          src={imgSrc}
          alt={imgAlt}
          sceneT={sceneT}
          duration={duration}
          from={from}
          to={to}
          objectPosition={objectPosition}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/35 to-slate-950/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
      </div>
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:flex-row sm:items-end sm:justify-start sm:p-8">
        <div className="max-w-md sm:max-w-lg">{children}</div>
      </div>
    </>
  );
}



// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "impressive_figure",
    prompt:
      "세 파트에 등장한 수학자 (디오판토스·히파티아·알콰리즈미·페로·타르탈리아·카르다노·페라리·아벨·갈루아) 중 가장 인상 깊었던 인물과 그 이유를 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 갈루아가 가장 인상 깊었다. 19세에 5차 이상의 비가해성을 군론으로 증명했지만, 21세에 결투로 죽기 전날 밤 ‘시간이 없다’ 고 메모하며 자신의 이론을 친구에게 부탁한 장면이 잊히지 않는다. 천재성과 비극이 함께 떠올랐다.",
  },
  {
    id: "cardano_ethics",
    prompt:
      "카르다노가 ‘절대 발표하지 않겠다’ 는 약속을 어기고 타르탈리아의 해법을 자기 책 《Ars Magna》 에 발표한 일을 어떻게 생각하나요? 수학적 발견에서 ‘약속·공유·공로’ 의 가치를 함께 생각해 보세요.",
    kind: "text",
    placeholder:
      "예: 약속을 어긴 것은 비판받을 일이지만, 결과적으로 그 해법은 공개되어 수학사를 바꾸었다. 다만 ‘페로가 먼저 발견했다’ 는 사실까지 카르다노가 책에 적은 것을 보면, 그가 단순한 도용자가 아니라 자신만의 학문적 기준이 있었던 것 같다. 발견의 공유 vs 약속의 신뢰 — 둘 다 중요하지만 약속이 깨질 땐 최소한 정직한 공로 인정은 있어야 한다고 생각한다.",
  },
];

// ─── 메인 ───────────────────────────────────────────────────
type PartId = 1 | 2 | 3;

const ASSET = "/assets/commonmath/equation_history";

export default function EquationHistoryFlash() {
  const [part, setPart] = useState<PartId>(1);
  const [visited, setVisited] = useState<Set<PartId>>(() => new Set([1]));

  function go(p: PartId) {
    setPart(p);
    setVisited((s) => {
      if (s.has(p)) return s;
      const n = new Set(s);
      n.add(p);
      return n;
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* 헤더 */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">📜 방정식 해법의 역사</h3>
        <p className="mt-2 leading-7 text-slate-300">
          이차방정식부터 5차 방정식 비가해성까지, 수천 년에 걸친 수학자들의{" "}
          <b className="text-cyan-200">도전·좌절·승리</b> 의 이야기.
        </p>

        {/* 진행 막대 */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">진행률</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <svg viewBox="0 0 100 1" preserveAspectRatio="none" className="h-full w-full">
              <rect
                x="0"
                y="0"
                height="1"
                width={(visited.size / 3) * 100}
                fill="url(#histProg)"
              />
              <defs>
                <linearGradient id="histProg" x1="0" x2="1">
                  <stop offset="0%" stopColor="#fcd34d" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {visited.size} / 3 파트
          </span>
        </div>
      </div>

      {/* 탭 */}
      <div className="mt-5 flex flex-wrap gap-2">
        <TabBtn active={part === 1} tone="cyan" onClick={() => go(1)}>
          ① 이차방정식의 역사
        </TabBtn>
        <TabBtn active={part === 2} tone="amber" onClick={() => go(2)}>
          ② 삼·사차 쟁탈전
        </TabBtn>
        <TabBtn active={part === 3} tone="violet" onClick={() => go(3)}>
          ③ 5차 방정식의 벽
        </TabBtn>
      </div>

      <div className={part === 1 ? "mt-5" : "mt-5 hidden"}>
        <Part1 onNext={() => go(2)} />
      </div>
      <div className={part === 2 ? "mt-5" : "mt-5 hidden"}>
        <Part2 onBack={() => go(1)} onNext={() => go(3)} active={part === 2} />
      </div>
      <div className={part === 3 ? "mt-5" : "mt-5 hidden"}>
        <Part3 onBack={() => go(2)} />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ═════════════════════════════════════════════════════════
//  공용 컴포넌트
// ═════════════════════════════════════════════════════════

function TabBtn({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: "cyan" | "amber" | "violet";
  onClick: () => void;
  children: ReactNode;
}) {
  const activeCls =
    tone === "cyan"
      ? "border-cyan-300 bg-cyan-400/20 text-cyan-100"
      : tone === "amber"
      ? "border-amber-300 bg-amber-400/20 text-amber-100"
      : "border-violet-300 bg-violet-400/20 text-violet-100";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border-2 px-4 py-2 text-sm font-bold transition " +
        (active
          ? activeCls
          : "border-white/15 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200")
      }
    >
      {children}
    </button>
  );
}

function PartHero({
  num,
  title,
  subtitle,
  tone,
}: {
  num: string;
  title: string;
  subtitle: ReactNode;
  tone: "cyan" | "amber" | "violet";
}) {
  const titleCls =
    tone === "cyan"
      ? "from-cyan-300 to-cyan-200"
      : tone === "amber"
      ? "from-amber-300 to-orange-300"
      : "from-violet-300 to-fuchsia-300";
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 text-center">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-slate-400">
        {num}
      </p>
      <h4
        className={
          "mt-1 bg-gradient-to-r bg-clip-text font-serif text-2xl font-bold text-transparent " +
          titleCls
        }
      >
        {title}
      </h4>
      <p className="mt-2 text-sm leading-7 text-slate-300">{subtitle}</p>
    </div>
  );
}

type CharData = {
  id: string;
  name: string;
  en: string;
  era: string;
  img?: string; // 파일명 (없으면 emoji)
  emoji: string;
};

function CharCard({
  c,
  selected,
  onClick,
  toneHex,
}: {
  c: CharData;
  selected: boolean;
  onClick: () => void;
  toneHex: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "group relative overflow-hidden rounded-xl border-2 p-3 text-center transition hover:-translate-y-0.5 " +
        (selected
          ? "border-current"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]")
      }
      style={selected ? { color: toneHex, backgroundColor: `${toneHex}1F` } : undefined}
    >
      <div className="mx-auto h-24 w-20 overflow-hidden rounded-md border border-white/15 bg-white/5">
        {c.img ? (
          <picture>
            <img
              src={`${ASSET}/${c.img}`}
              alt={c.name}
              className="h-full w-full object-cover object-top transition"
              style={{ filter: selected ? "sepia(0)" : "sepia(0.25) contrast(1.05)" }}
            />
          </picture>
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl">
            {c.emoji}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm font-bold text-slate-100">{c.name}</p>
      <p className="text-[10px] text-slate-500">{c.en}</p>
      <p
        className="mt-1 text-[11px] font-bold"
        style={{ color: selected ? toneHex : toneHex }}
      >
        {c.era}
      </p>
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left transition group-hover:scale-x-100"
        style={{
          backgroundColor: toneHex,
          transform: selected ? "scaleX(1)" : "scaleX(0)",
        }}
      />
    </button>
  );
}

function CharDetail({
  c,
  toneHex,
  children,
}: {
  c: CharData;
  toneHex: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-wrap items-start gap-4">
        <div className="h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 border-white/15">
          {c.img ? (
            <img
              src={`${ASSET}/${c.img}`}
              alt={c.name}
              className="h-full w-full object-cover object-top"
              style={{ filter: "sepia(0.15)" }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-white/5 text-4xl">
              {c.emoji}
            </span>
          )}
        </div>
        <div className="min-w-[200px] flex-1 text-sm leading-7 text-slate-300">
          <h5 className="font-serif text-base font-bold" style={{ color: toneHex }}>
            {c.emoji} {c.name} <span className="text-slate-400">· {c.era}</span>
          </h5>
          {children}
        </div>
      </div>
    </div>
  );
}

function Hl({ children }: { children: ReactNode }) {
  return <span className="font-bold text-amber-200">{children}</span>;
}

function Quote({ children, toneHex }: { children: ReactNode; toneHex: string }) {
  return (
    <p
      className="mt-3 rounded-r-lg border-l-[3px] bg-white/[0.04] px-3 py-2 text-sm italic leading-7 text-slate-300"
      style={{ borderColor: toneHex }}
    >
      {children}
    </p>
  );
}

function FormulaBox({
  label,
  formula,
  desc,
  tone,
}: {
  label: string;
  formula: ReactNode;
  desc?: ReactNode;
  tone?: "amber" | "violet";
}) {
  const border = tone === "violet" ? "border-violet-400/30" : "border-amber-400/30";
  return (
    <div className={"rounded-xl border bg-white/[0.03] p-4 text-center " + border}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div
        className={
          "mt-2 font-serif text-lg leading-7 " +
          (tone === "violet" ? "text-violet-200" : "text-amber-200")
        }
      >
        {formula}
      </div>
      {desc ? <p className="mt-2 text-xs leading-6 text-slate-400">{desc}</p> : null}
    </div>
  );
}

type QuizData = {
  q: string;
  options: { text: string; correct: boolean; fb: string }[];
};

function MiniQuiz({ data, toneHex }: { data: QuizData; toneHex: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm font-bold" style={{ color: toneHex }}>
        🧩 확인 퀴즈
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-200">{data.q}</p>
      <div className="mt-3 space-y-2">
        {data.options.map((o, i) => {
          const isPicked = picked === i;
          let cls = "border-white/10 bg-transparent text-slate-300 hover:border-current hover:bg-white/[0.04]";
          if (picked !== null) {
            if (isPicked) {
              cls = o.correct
                ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
                : "border-rose-400/60 bg-rose-400/15 text-rose-100";
            } else {
              cls = "border-white/5 bg-transparent text-slate-500";
            }
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => picked === null && setPicked(i)}
              disabled={picked !== null}
              className={
                "block w-full rounded-lg border px-3 py-2 text-left text-sm transition " + cls
              }
              style={picked === null ? { color: undefined } : undefined}
            >
              {["①", "②", "③", "④"][i]} {o.text}
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <p
          className={
            "mt-3 rounded-lg px-3 py-2 text-sm leading-7 " +
            (data.options[picked].correct
              ? "bg-emerald-400/10 text-emerald-100"
              : "bg-rose-400/10 text-rose-100")
          }
        >
          {data.options[picked].fb}
        </p>
      ) : null}
    </div>
  );
}

function NavRow({
  label,
  onBack,
  onNext,
  nextLabel,
}: {
  label: string;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
      <div>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            ← 이전
          </button>
        ) : (
          <span />
        )}
      </div>
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <div>
        {onNext ? (
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
          >
            {nextLabel ?? "다음 →"}
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
//  PART 1 — 이차방정식의 역사
// ═════════════════════════════════════════════════════════

const P1_CHARS: CharData[] = [
  { id: "dioph", name: "디오판토스", en: "Diophantus", era: "3세기 그리스", img: "dioph.jpg", emoji: "📜" },
  { id: "hyp", name: "히파티아", en: "Hypatia", era: "4~5세기 그리스", img: "hypatia.jpg", emoji: "🌟" },
  { id: "alkh", name: "알콰리즈미", en: "Al-Khwarizmi", era: "8~9세기 페르시아", img: "alkhwarizmi.jpg", emoji: "📚" },
];
const P1_TONE = "#7dd3fc"; // cyan-300

// ─── PART 1 시네마틱 시퀀스 (≈ 62 초) ──────────────────────
const PART1_SCENES: SceneDef[] = [
  // Scene 1 — 타이틀 (5 s)
  {
    id: "p1-title",
    duration: 5000,
    render: ({ sceneT }) => (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <FadeBlock sceneT={sceneT} start={300} fadeMs={900}>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.45em] text-cyan-300">
            PART 01
          </p>
        </FadeBlock>
        <FadeBlock sceneT={sceneT} start={900} fadeMs={1100}>
          <h2 className="mt-3 bg-gradient-to-r from-cyan-200 via-sky-300 to-emerald-200 bg-clip-text font-serif text-3xl font-bold text-transparent sm:text-5xl">
            이차방정식의 역사
          </h2>
        </FadeBlock>
        <FadeBlock sceneT={sceneT} start={1800} fadeMs={900}>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            수천 년에 걸친 풀이의 여정
          </p>
        </FadeBlock>
        <FadeBlock sceneT={sceneT} start={2900} fadeMs={900}>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
            <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-cyan-200">
              기원전 2000 년
            </span>
            <span className="text-slate-500">→</span>
            <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-cyan-200">
              3 세기 알렉산드리아
            </span>
            <span className="text-slate-500">→</span>
            <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-cyan-200">
              9 세기 바그다드
            </span>
          </div>
        </FadeBlock>
      </div>
    ),
  },

  // Scene 2 — 디오판토스 (14 s)
  {
    id: "p1-dioph",
    duration: 14000,
    render: ({ sceneT, duration }) => (
      <ScenePortraitNarration
        imgSrc={`${ASSET}/dioph.jpg`}
        imgAlt="디오판토스"
        sceneT={sceneT}
        duration={duration}
        objectPosition="50% 18%"
        from={{ scale: 1.0, tx: 0, ty: 0 }}
        to={{ scale: 1.12, tx: 0, ty: 0 }}
      >
        <FadeBlock sceneT={sceneT} start={200} fadeMs={700}>
          <p className="font-serif text-sm italic text-cyan-300">기원전 2000 년</p>
        </FadeBlock>
        <h3 className="mt-1 font-serif text-2xl text-amber-100 sm:text-3xl">
          <TypedText sceneT={sceneT} start={800} text="고대 바빌로니아 점토판." charMs={65} />
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-300 sm:text-base">
          <TypedText
            sceneT={sceneT}
            start={2400}
            charMs={48}
            text="이차방정식 형태의 문제가 처음으로 새겨졌다."
          />
        </p>
        <FadeBlock sceneT={sceneT} start={5800} fadeMs={700}>
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">
            … 2000 년이 흘러
          </p>
        </FadeBlock>
        <h3 className="mt-1 font-serif text-2xl text-cyan-200 sm:text-3xl">
          <TypedText sceneT={sceneT} start={6900} text="디오판토스 — Diophantus" charMs={55} />
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-200 sm:text-base">
          <TypedText
            sceneT={sceneT}
            start={9100}
            charMs={42}
            text="기호로 방정식을 표현한 최초의 수학자."
          />
        </p>
        <FadeBlock sceneT={sceneT} start={11700} fadeMs={800}>
          <p className="mt-3 rounded-lg border border-amber-300/30 bg-amber-300/[0.08] px-3 py-2 text-xs italic leading-6 text-amber-100">
            묘비의 수수께끼: “소년기 1/6, 청년기 1/12, 결혼 후 1/7 …” → 풀면 <b>84 세</b>.
          </p>
        </FadeBlock>
      </ScenePortraitNarration>
    ),
  },

  // Scene 3 — 히파티아 (14 s)
  {
    id: "p1-hyp",
    duration: 14000,
    render: ({ sceneT, duration }) => (
      <ScenePortraitNarration
        imgSrc={`${ASSET}/hypatia.jpg`}
        imgAlt="히파티아"
        sceneT={sceneT}
        duration={duration}
        objectPosition="50% 15%"
        from={{ scale: 1.0, tx: 0, ty: 0 }}
        to={{ scale: 1.12, tx: 0, ty: 0 }}
      >
        <FadeBlock sceneT={sceneT} start={200} fadeMs={700}>
          <p className="font-serif text-sm italic text-cyan-300">4 ~ 5 세기 알렉산드리아</p>
        </FadeBlock>
        <h3 className="mt-1 font-serif text-2xl text-amber-100 sm:text-3xl">
          <TypedText sceneT={sceneT} start={800} text="히파티아 — Hypatia" charMs={60} />
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-200 sm:text-base">
          <TypedText
            sceneT={sceneT}
            start={3000}
            charMs={45}
            text="역사 기록에 남은 최초의 여성 수학자."
          />
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-200 sm:text-base">
          <TypedText
            sceneT={sceneT}
            start={5200}
            charMs={42}
            text="디오판토스의 《Arithmetica》 에 주석을 달아"
          />
        </p>
        <p className="text-sm leading-7 text-slate-200 sm:text-base">
          <TypedText
            sceneT={sceneT}
            start={7400}
            charMs={42}
            text="이차방정식 이론을 계승하고 발전시켰다."
          />
        </p>
        <FadeBlock sceneT={sceneT} start={10300} fadeMs={900}>
          <blockquote className="mt-3 rounded-r-lg border-l-[3px] border-cyan-300/60 bg-white/[0.05] px-3 py-2 text-sm italic leading-7 text-slate-200">
            “진실을 알고 싶다면, <span className="text-cyan-200">지식을 향한 갈망</span> 을 끄지 마라.”
          </blockquote>
        </FadeBlock>
      </ScenePortraitNarration>
    ),
  },

  // Scene 4 — 알콰리즈미 (14 s)
  {
    id: "p1-alkh",
    duration: 14000,
    render: ({ sceneT, duration }) => (
      <ScenePortraitNarration
        imgSrc={`${ASSET}/alkhwarizmi.jpg`}
        imgAlt="알콰리즈미"
        sceneT={sceneT}
        duration={duration}
        objectPosition="50% 45%"
        from={{ scale: 1.0, tx: 0, ty: 0 }}
        to={{ scale: 1.1, tx: 0, ty: 0 }}
      >
        <FadeBlock sceneT={sceneT} start={200} fadeMs={700}>
          <p className="font-serif text-sm italic text-cyan-300">780 ~ 850 · 바그다드</p>
        </FadeBlock>
        <h3 className="mt-1 font-serif text-2xl text-amber-100 sm:text-3xl">
          <TypedText sceneT={sceneT} start={800} text="알콰리즈미 — Al-Khwarizmi" charMs={55} />
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-200 sm:text-base">
          <TypedText
            sceneT={sceneT}
            start={3300}
            charMs={40}
            text="바그다드 ‘지혜의 집’ 에서 이차방정식을 6 가지 유형으로 체계화."
          />
        </p>
        <FadeBlock sceneT={sceneT} start={7400} fadeMs={700}>
          <div className="mt-4 space-y-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] p-3 text-sm">
            <p className="font-mono text-emerald-200">
              <span className="text-slate-400">Al-Khwarizmi</span> &nbsp;→&nbsp;{" "}
              <b className="text-emerald-200">Algorithm</b>
            </p>
            <p className="font-mono text-emerald-200">
              <span className="text-slate-400">책 제목 Al-Jabr</span> &nbsp;→&nbsp;{" "}
              <b className="text-emerald-200">Algebra</b>
            </p>
          </div>
        </FadeBlock>
        <FadeBlock sceneT={sceneT} start={11000} fadeMs={800}>
          <p className="mt-3 text-xs italic leading-6 text-slate-400">
            그의 이름은 ‘알고리즘’ 이 되었고, 그의 책 제목은 ‘대수학’ 이 되었다.
          </p>
        </FadeBlock>
      </ScenePortraitNarration>
    ),
  },

  // Scene 5 — 공식 등장 (10 s)
  {
    id: "p1-formula",
    duration: 10000,
    render: ({ sceneT }) => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-cyan-950/40 to-slate-950 px-6">
        <FadeBlock sceneT={sceneT} start={200} fadeMs={700}>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.4em] text-cyan-300">
            2 차 방정식의 근의 공식
          </p>
        </FadeBlock>
        <div className="mt-5 flex w-full max-w-3xl items-center justify-center">
          <CinematicReveal sceneT={sceneT} start={1200} drawMs={3500}>
            <QuadraticFormulaProper sizeClass="text-3xl sm:text-5xl" />
          </CinematicReveal>
        </div>
        <FadeBlock sceneT={sceneT} start={5400} fadeMs={900}>
          <p className="mt-4 text-center text-sm leading-7 text-slate-300 sm:text-base">
            기원전 2000 년 바빌로니아 점토판에서 시작해
            <br />
            알콰리즈미의 체계화를 거쳐 완성된{" "}
            <b className="text-amber-200">4000 년의 산물</b>.
          </p>
        </FadeBlock>
        <FadeBlock sceneT={sceneT} start={7500} fadeMs={800}>
          <div className="mt-5 flex items-center justify-center gap-3">
            {[
              { src: "dioph.jpg", n: "디오판토스" },
              { src: "hypatia.jpg", n: "히파티아" },
              { src: "alkhwarizmi.jpg", n: "알콰리즈미" },
            ].map((p) => (
              <div key={p.src} className="text-center">
                <div className="mx-auto h-14 w-12 overflow-hidden rounded-md border border-cyan-300/40">
                  <img
                    src={`${ASSET}/${p.src}`}
                    alt={p.n}
                    className="h-full w-full object-cover object-top"
                    style={{ filter: "sepia(0.2)" }}
                  />
                </div>
                <p className="mt-1 text-[10px] font-bold text-slate-300">{p.n}</p>
              </div>
            ))}
          </div>
        </FadeBlock>
      </div>
    ),
  },

  // Scene 6 — 엔드 카드 (5 s)
  {
    id: "p1-end",
    duration: 5000,
    render: ({ sceneT }) => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-cyan-900/30 to-slate-950 px-6 text-center">
        <FadeBlock sceneT={sceneT} start={200} fadeMs={900}>
          <p className="font-serif text-2xl font-bold text-slate-100 sm:text-3xl">
            이차방정식 — 수천 년의 여정
          </p>
        </FadeBlock>
        <FadeBlock sceneT={sceneT} start={1500} fadeMs={900}>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            바빌로니아 → 알렉산드리아 → 바그다드 → 오늘의 교실까지.
          </p>
        </FadeBlock>
        <FadeBlock sceneT={sceneT} start={2800} fadeMs={900}>
          <p className="mt-5 rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1.5 text-xs font-bold text-amber-200">
            다음 → ② 삼·사차 방정식 쟁탈전 (16 세기 이탈리아)
          </p>
        </FadeBlock>
      </div>
    ),
  },
];

function Part1({ onNext }: { onNext: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const cur = P1_CHARS.find((c) => c.id === sel);

  return (
    <div className="space-y-5">
      <CinematicPlayer scenes={PART1_SCENES} ariaLabel="이차방정식의 역사 영상" />

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-center text-sm text-slate-300">
          🔍 <b className="text-cyan-200">영상에 등장한 인물</b> 을 직접 클릭해 더 자세한 이야기를 읽어 보세요.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {P1_CHARS.map((c) => (
          <CharCard
            key={c.id}
            c={c}
            selected={sel === c.id}
            onClick={() => setSel(sel === c.id ? null : c.id)}
            toneHex={P1_TONE}
          />
        ))}
      </div>

      {cur ? (
        cur.id === "dioph" ? (
          <CharDetail c={cur} toneHex={P1_TONE}>
            <p className="mt-1">
              <Hl>대수학의 아버지</Hl> 로 불리는 그리스 수학자. 저서{" "}
              <em className="text-cyan-200">Arithmetica</em> 에서 기호를 사용해 방정식을
              표현한 최초의 수학자 중 하나입니다.
            </p>
            <Quote toneHex={P1_TONE}>
              묘비의 수수께끼: “소년기 1/6, 청년기 1/12, 결혼 후 1/7 …” → 풀면 84세!
            </Quote>
          </CharDetail>
        ) : cur.id === "hyp" ? (
          <CharDetail c={cur} toneHex={P1_TONE}>
            <p className="mt-1">
              역사 기록에 남은 <Hl>최초의 여성 수학자</Hl>. 디오판토스의{" "}
              <em className="text-cyan-200">Arithmetica</em> 에 주석을 달아 이차방정식
              이론을 계승·발전시켰습니다.
            </p>
            <Quote toneHex={P1_TONE}>
              “진실을 알고 싶다면, 지식을 향한 갈망을 끄지 마라.”
            </Quote>
          </CharDetail>
        ) : (
          <CharDetail c={cur} toneHex={P1_TONE}>
            <p className="mt-1">
              바그다드 <Hl>지혜의 집</Hl> 에서 활동한 페르시아 수학자. 이차방정식을 6가지
              유형으로 체계화했습니다.
            </p>
            <div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/[0.05] p-3 text-sm leading-8">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                어원을 바꾼 두 단어
              </p>
              <p>
                Al-Khwarizmi → <span className="text-emerald-300">Algorithm</span>
                <br />
                책 제목 Al-Jabr → <span className="text-emerald-300">Algebra</span>
              </p>
            </div>
            <Quote toneHex={P1_TONE}>
              “이 책은 사람들이 모든 거래에서 수를 이용할 때 필요한 것을 담는다.”
            </Quote>
          </CharDetail>
        )
      ) : null}

      <FormulaBox
        label="2차 방정식 근의 공식"
        formula={<QuadraticFormulaProper sizeClass="text-xl sm:text-2xl" />}
        desc={
          <>
            기원전 2000년 바빌로니아 점토판에서 시작해 알콰리즈미의 체계화를 거쳐
            완성되었습니다.
          </>
        }
      />

      <MiniQuiz
        toneHex={P1_TONE}
        data={{
          q: "오늘날 Algebra (대수학) 라는 단어의 직접 어원이 된 것은?",
          options: [
            { text: "알콰리즈미 책 제목의 첫 단어 Al-Kitab", correct: false, fb: "❌ Al-Kitab 은 책 전체 제목의 시작 부분입니다. 어원은 Al-Jabr 입니다." },
            { text: "알콰리즈미 책 제목의 Al-Jabr", correct: true, fb: "✅ 정확합니다! Al-Jabr 가 Algebra 의 어원입니다. 알콰리즈미의 이름 자체는 Algorithm 의 어원이 되었습니다." },
            { text: "디오판토스의 저서 Arithmetica", correct: false, fb: "❌ Arithmetica 는 디오판토스의 저서입니다." },
            { text: "알콰리즈미의 이름 Al-Khwarizmi", correct: false, fb: "❌ Algorithm 은 알콰리즈미의 이름에서 온 단어입니다. Algebra 는 그의 책 제목에서 왔습니다." },
          ],
        }}
      />

      <NavRow label="1 / 3" onNext={onNext} nextLabel="② 삼·사차 쟁탈전 →" />
    </div>
  );
}

// ═════════════════════════════════════════════════════════
//  PART 2 — 삼·사차 쟁탈전
// ═════════════════════════════════════════════════════════

const P2_CHARS: CharData[] = [
  { id: "ferro", name: "페로", en: "Scipione del Ferro", era: "16세기 볼로냐", emoji: "🏛️" },
  { id: "tartag", name: "타르탈리아", en: "Tartaglia", era: "1500~1557 브레샤", img: "tartaglia.jpg", emoji: "⚔️" },
  { id: "cardano", name: "카르다노", en: "Cardano", era: "1501~1576 밀라노", img: "cardano.jpg", emoji: "⚕️" },
  { id: "ferrari", name: "페라리", en: "Ferrari", era: "1522~1565 볼로냐", img: "ferrari.jpg", emoji: "🏆" },
];
const P2_TONE = "#fcd34d"; // amber-300

function Part2({
  onBack,
  onNext,
  active,
}: {
  onBack: () => void;
  onNext: () => void;
  active: boolean;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const cur = P2_CHARS.find((c) => c.id === sel);

  // 타임라인 stagger 애니메이션 (탭 첫 진입 시 한 번만)
  const [tlVisible, setTlVisible] = useState(false);
  useEffect(() => {
    if (active && !tlVisible) {
      const t = setTimeout(() => setTlVisible(true), 200);
      return () => clearTimeout(t);
    }
  }, [active, tlVisible]);

  return (
    <div className="space-y-5">
      <PartHero
        num="PART 02"
        title="삼·사차방정식 쟁탈전"
        subtitle={
          <>
            16세기 이탈리아, 수학자들이 명예를 걸고 벌인 공개 대결
            <br />
            비밀·배신·드라마 — 수학사에서 가장 극적인 이야기.
          </>
        }
        tone="amber"
      />

      <p className="text-center text-xs text-slate-400">
        👇 인물 카드를 클릭해 자세한 이야기를 읽어 보세요
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {P2_CHARS.map((c) => (
          <CharCard
            key={c.id}
            c={c}
            selected={sel === c.id}
            onClick={() => setSel(sel === c.id ? null : c.id)}
            toneHex={P2_TONE}
          />
        ))}
      </div>

      {cur ? <P2Detail c={cur} /> : null}

      {/* 타임라인 */}
      <div className="space-y-2.5">
        {P2_TIMELINE.map((t, i) => (
          <div
            key={i}
            className={
              "flex gap-3 transition duration-500 " +
              (tlVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4")
            }
            style={tlVisible ? { transitionDelay: `${i * 180}ms` } : undefined}
          >
            <div className="flex flex-col items-center">
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-slate-950"
                style={{ backgroundColor: t.color }}
              >
                {i + 1}
              </div>
              {i < P2_TIMELINE.length - 1 ? (
                <div className="my-1 w-px flex-1 bg-white/15" />
              ) : null}
            </div>
            <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
              <p
                className="text-xs font-bold"
                style={{ color: t.color }}
              >
                {t.year}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-100">{t.title}</p>
              <p className="mt-1 text-sm leading-7 text-slate-300">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* VS 배틀 */}
      <BattleScene />

      <FormulaBox
        label="카르다노 공식 — 삼차방정식의 근의 공식 (1545)"
        formula={
          <span className="text-sm leading-7 sm:text-base">
            x = ∛(−q/2 + √((q/2)² + (p/3)³))
            <br />+ ∛(−q/2 − √((q/2)² + (p/3)³))
          </span>
        }
        desc={
          <>
            삼차방정식 <span className="font-serif italic">x³ + px + q = 0</span> (2차항
            소거 후).
            <br />
            300 년간 풀리지 않던 문제가 16세기 이탈리아에서 정복되었습니다!
          </>
        }
      />

      {/* 관계도 */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-center text-xs text-slate-400">
          📊 삼·사차방정식 역사 인물 관계도
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-sm">
          <Chip color="#c8a040">페로</Chip>
          <Sep>→ 제자 →</Sep>
          <Chip color="#f87171">피오르</Chip>
          <Sep>⚔ 패배</Sep>
          <Chip color="#34d399">타르탈리아 ✓</Chip>
          <Sep>→ 전수 →</Sep>
          <Chip color="#fcd34d">카르다노</Chip>
          <Sep>→ 제자 →</Sep>
          <Chip color="#60a5fa">페라리 (4 차)</Chip>
        </div>
      </div>

      <MiniQuiz
        toneHex={P2_TONE}
        data={{
          q: "1535 년 공개 수학 대결, 피오르 vs 타르탈리아의 결과는?",
          options: [
            { text: "피오르가 타르탈리아의 문제를 모두 풀어 승리했다", correct: false, fb: "❌ 피오르는 타르탈리아의 문제를 하나도 풀지 못했습니다." },
            { text: "타르탈리아가 30 문제 모두 해결하여 30:0 완승했다", correct: true, fb: "✅ 정확합니다! 타르탈리아는 피오르가 낸 삼차방정식 30 문제를 모두 해결했지만, 피오르는 하나도 못 풀었습니다. 완전한 30:0 완승!" },
            { text: "무승부로 끝났다", correct: false, fb: "❌ 무승부는 없었습니다." },
            { text: "카르다노가 두 사람을 모두 이겼다", correct: false, fb: "❌ 카르다노는 이 대결에 직접 참여하지 않았습니다." },
          ],
        }}
      />

      <NavRow label="2 / 3" onBack={onBack} onNext={onNext} nextLabel="③ 5차의 벽 →" />
    </div>
  );
}

const P2_TIMELINE = [
  {
    year: "16 세기 초 · 볼로냐",
    title: "🏛️ 페로의 발견과 비밀 전수",
    desc: "페로가 삼차방정식 해법을 발견하지만 비밀로 간직. 죽기 직전 제자 피오르에게만 전수.",
    color: "#c8a040",
  },
  {
    year: "1535 년 · 공개 수학 대결",
    title: "⚔️ 피오르 vs 타르탈리아",
    desc: "각자 30 문제씩 내고 푸는 대결 — 타르탈리아 30 : 0 완승!",
    color: "#fb923c",
  },
  {
    year: "1539 년 · 밀라노",
    title: "🤝 카르다노의 설득과 배신",
    desc: "카르다노는 “절대 발표하지 않겠다” 는 약속으로 해법을 전수받음. 그러나 1545 년 《Ars Magna》 에 발표.",
    color: "#fcd34d",
  },
  {
    year: "1545 년 · Ars Magna",
    title: "🏆 페라리, 사차방정식까지 완성",
    desc: "카르다노의 제자 페라리가 사차방정식까지 풀어냄. 1 ~ 4 차 방정식 해법이 완성됨.",
    color: "#60a5fa",
  },
];

function P2Detail({ c }: { c: CharData }) {
  const toneByName: Record<string, string> = {
    ferro: "#c8a040",
    tartag: "#fb923c",
    cardano: "#fcd34d",
    ferrari: "#60a5fa",
  };
  const tone = toneByName[c.id] ?? P2_TONE;

  if (c.id === "ferro") {
    return (
      <CharDetail c={c} toneHex={tone}>
        <p className="mt-1">
          볼로냐 대학의 수학 교수. 삼차방정식{" "}
          <Hl>x³ + ax + b = 0</Hl> 형태의 해법을 최초로 발견. 당시 해법은{" "}
          <Hl>개인의 재산</Hl> 이었고, 죽기 직전 제자 피오르에게만 비밀을 전수했습니다.
        </p>
      </CharDetail>
    );
  }
  if (c.id === "tartag") {
    return (
      <CharDetail c={c} toneHex={tone}>
        <p className="mt-1">
          어릴 때 프랑스 군의 칼에 다쳐 말을 더듬게 되어 ‘타르탈리아 (말더듬이)’ 라는
          별명이 생겼습니다. 독립적으로 삼차방정식 해법을 발견하고{" "}
          <Hl>피오르와의 공개 대결에서 30:0 완승</Hl>. 그러나 카르다노에게 비밀을 전수한
          뒤 배신당하고, 가난 속에 외롭게 세상을 떠났습니다.
        </p>
        <Quote toneHex={tone}>“나는 단지 비밀을 지켜달라는 약속만을 바랐습니다.”</Quote>
      </CharDetail>
    );
  }
  if (c.id === "cardano") {
    return (
      <CharDetail c={c} toneHex={tone}>
        <p className="mt-1">
          밀라노의 유명 의사. 1545 년 <Hl>《Ars Magna》</Hl> 에 삼차방정식 해법을
          발표합니다. 삼촌·동료 독살 의혹, 장남 처형, 종교재판 투옥 등 파란만장한 삶.
        </p>
        <Quote toneHex={tone}>“비밀은 인정받지 못한 채로 영원히 잠들 수도 있습니다.”</Quote>
      </CharDetail>
    );
  }
  return (
    <CharDetail c={c} toneHex={tone}>
      <p className="mt-1">
        카르다노의 제자. 삼차방정식 해법을 응용해 <Hl>사차방정식</Hl> 까지 풀어내는 데
        성공. 43 세의 젊은 나이에 의문의 죽음을 맞았습니다.
      </p>
    </CharDetail>
  );
}

function Chip({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="rounded-full border px-2.5 py-1 text-xs font-bold"
      style={{
        borderColor: color,
        backgroundColor: `${color}26`,
        color,
      }}
    >
      {children}
    </span>
  );
}

function Sep({ children }: { children: ReactNode }) {
  return <span className="text-xs text-slate-500">{children}</span>;
}

function BattleScene() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const ivRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (ivRef.current !== null) window.clearInterval(ivRef.current);
    };
  }, []);

  function start() {
    if (running || step >= 30) return;
    setRunning(true);
    ivRef.current = window.setInterval(() => {
      setStep((s) => {
        const next = s + 1;
        if (next >= 30) {
          if (ivRef.current !== null) window.clearInterval(ivRef.current);
          ivRef.current = null;
          setRunning(false);
        }
        return next;
      });
    }, 60);
  }

  const done = step >= 30;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-center text-xs text-slate-400">
        ⚔️ 1535 년 — 피오르 vs 타르탈리아 공개 수학 대결
      </p>
      <div className="mt-4 flex flex-wrap items-start justify-around gap-3">
        {/* 피오르 */}
        <div className="flex-1 text-center" style={{ minWidth: 100 }}>
          <div className="mx-auto flex h-20 w-16 items-center justify-center rounded-lg border-2 border-rose-400/40 bg-rose-400/10 text-2xl">
            🧑‍🏫
          </div>
          <p className="mt-2 text-sm font-bold text-slate-100">피오르</p>
          <p className="text-[11px] text-slate-500">페로의 제자</p>
          {step > 0 ? (
            <span className="mt-1 inline-block rounded-full border border-rose-400/50 bg-rose-400/15 px-2 py-0.5 text-[11px] font-bold text-rose-200">
              0 / 30
            </span>
          ) : null}
        </div>

        {/* VS */}
        <div className="flex flex-col items-center justify-center gap-2 pt-3">
          <p className="animate-pulse text-2xl font-extrabold text-amber-300">VS</p>
          {!done ? (
            <button
              type="button"
              onClick={start}
              disabled={running}
              className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-1.5 text-xs font-bold text-slate-950 transition disabled:opacity-70"
            >
              {running ? "⚔ 대결 중…" : "▶ 대결 시작!"}
            </button>
          ) : (
            <p className="text-sm font-bold text-amber-300">
              🏆 타르탈리아 완승! <span className="text-base">30 : 0</span>
            </p>
          )}
        </div>

        {/* 타르탈리아 */}
        <div className="flex-1 text-center" style={{ minWidth: 100 }}>
          <div className="mx-auto h-20 w-16 overflow-hidden rounded-lg border-2 border-emerald-400/40">
            <img
              src={`${ASSET}/tartaglia.jpg`}
              alt="타르탈리아"
              className="h-full w-full object-cover object-top"
              style={{ filter: "sepia(0.15)" }}
            />
          </div>
          <p className="mt-2 text-sm font-bold text-slate-100">타르탈리아</p>
          <p className="text-[11px] text-slate-500">브레샤의 수학자</p>
          {step > 0 ? (
            <span className="mt-1 inline-block rounded-full border border-emerald-400/50 bg-emerald-400/15 px-2 py-0.5 text-[11px] font-bold text-emerald-200">
              {step} / 30 🏅
            </span>
          ) : null}
        </div>
      </div>
      {done ? (
        <p className="mx-auto mt-4 max-w-md text-center text-xs leading-7 text-slate-400">
          말을 더듬는 핸디캡에도 불구하고 기적 같은 역전승! 이 승리가 카르다노의 관심을
          끌게 됩니다…
        </p>
      ) : null}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
//  PART 3 — 5차 방정식의 벽
// ═════════════════════════════════════════════════════════

const P3_CHARS: CharData[] = [
  { id: "abel", name: "아벨", en: "Niels Henrik Abel", era: "1802~1829 노르웨이", img: "abel.jpg", emoji: "🇳🇴" },
  { id: "galois", name: "갈루아", en: "Évariste Galois", era: "1811~1832 프랑스", img: "galois.jpg", emoji: "🇫🇷" },
];
const P3_TONE = "#c4b5fd"; // violet-300

function Part3({ onBack }: { onBack: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const cur = P3_CHARS.find((c) => c.id === sel);

  return (
    <div className="space-y-5">
      <PartHero
        num="PART 03"
        title="5차 방정식의 벽"
        subtitle={
          <>
            300 년간의 도전 끝에 “풀 수 없음” 을 증명한 두 천재
            <br />
            아벨과 갈루아의 비극적이고 위대한 이야기.
          </>
        }
        tone="violet"
      />

      <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.06] p-4">
        <p className="text-xs font-bold text-violet-200">
          1545 ~ 1800 년대 · 300 년간의 도전
        </p>
        <p className="mt-1.5 font-bold text-violet-100">🔒 아무도 풀지 못한 5차 방정식</p>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          1 ~ 4 차까지 해법이 완성된 후 수학자들은{" "}
          <Hl>5 차 방정식의 근의 공식</Hl> 을 찾기 시작했습니다. 그러나 300 년이 지나도
          성공하지 못했습니다. 이유는 단 하나 —{" "}
          <Hl>그런 공식이 애초에 존재하지 않았기 때문</Hl> 이었습니다.
        </p>
      </div>

      <p className="text-center text-xs text-slate-400">
        👇 인물 카드를 클릭해 자세한 이야기를 읽어 보세요
      </p>
      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        {P3_CHARS.map((c) => (
          <CharCard
            key={c.id}
            c={c}
            selected={sel === c.id}
            onClick={() => setSel(sel === c.id ? null : c.id)}
            toneHex={P3_TONE}
          />
        ))}
      </div>

      {cur ? (
        cur.id === "abel" ? (
          <CharDetail c={cur} toneHex={P3_TONE}>
            <p className="mt-1">
              알코올 중독 아버지, 무책임한 어머니 아래 형제들을 홀로 부양하면서
              연구했습니다. <Hl>21 살</Hl> 에 5차 방정식 대수적 해법 불가능을 증명. 베를린
              대학 교수 임명장이 도착하기 <Hl>이틀 전</Hl> 결핵으로 사망. 향년 27 세.
            </p>
            <Quote toneHex={P3_TONE}>
              “나는 18 살에 5차 방정식을 푼 것으로 알았습니다. 그러나 틀렸습니다. 그
              틀림이 올바른 길로 이끌었습니다.”
            </Quote>
          </CharDetail>
        ) : (
          <CharDetail c={cur} toneHex={P3_TONE}>
            <p className="mt-1">
              에꼴 폴리테크닉 두 번 낙방, 아버지 자살, 혁명 운동 참여로 투옥.{" "}
              <Hl>19 살</Hl> 에 군론 (Group Theory) 으로 5차 이상의 비가해성을 완전 증명.
              결투 전날 밤 편지 곳곳에 <Hl>“시간이 없다”</Hl> 고 적었습니다. 향년 21 세.
            </p>
            <Quote toneHex={P3_TONE}>
              “나에게는 시간이 없다.”
              <br />
              <span className="text-xs text-slate-400">— 결투 전날 밤 편지, 1832 년 5 월</span>
            </Quote>
          </CharDetail>
        )
      ) : null}

      {/* 비교 테이블 */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-3 text-center text-xs text-slate-400">
          📊 아벨 vs 갈루아 비교
        </p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="px-2 py-2 text-left font-normal">항목</th>
              <th className="px-2 py-2 text-center font-bold text-violet-300">아벨</th>
              <th className="px-2 py-2 text-center font-bold text-violet-300">갈루아</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {[
              ["국적", "🇳🇴 노르웨이", "🇫🇷 프랑스"],
              ["증명 나이", "21 세", "19 세"],
              ["사망 나이", "27 세 (결핵)", "21 세 (결투)"],
              ["접근 방법", "직접 불가능 증명", "군론 (Group Theory)"],
              ["사후 인정", "크렐 저널 게재", "11 년 후 리우빌이 발표"],
            ].map((row, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="px-2 py-2">{row[0]}</td>
                <td className="px-2 py-2 text-center">{row[1]}</td>
                <td className="px-2 py-2 text-center">{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 갈루아 편지 */}
      <GaloisLetter />

      <FormulaBox
        label="5차 이상 방정식의 비가해성"
        tone="violet"
        formula={
          <>
            일반적인 5 차 이상 방정식은
            <br />+, −, ×, ÷, √ 만으로 해를 구할 수 없다.
          </>
        }
        desc={
          <>
            공식이 어려운 것이 아니라, 그런 공식 자체가 존재하지 않습니다.
            <br />
            아벨 (21 세) 과 갈루아 (19 세) 가 수학사에 이 진실을 새겼습니다.
          </>
        }
      />

      <MiniQuiz
        toneHex={P3_TONE}
        data={{
          q: "갈루아가 5차 방정식의 비가해성 증명에 도입한 새로운 수학 개념은?",
          options: [
            { text: "복소수 이론", correct: false, fb: "❌ 복소수 이론은 카르다노 시대에도 사용되었습니다." },
            { text: "미적분의 기본정리", correct: false, fb: "❌ 미적분의 기본정리는 뉴턴·라이프니츠의 업적입니다." },
            { text: "군론 (Group Theory)", correct: true, fb: "✅ 정확합니다! 갈루아는 군 (Group) 이라는 새로운 대수 구조를 도입해 방정식의 대수적 가해성 여부를 완전히 판단하는 이론을 세웠습니다. 현대 추상대수학의 출발점입니다!" },
            { text: "행렬 이론", correct: false, fb: "❌ 행렬 이론은 이후 케일리 등이 발전시켰습니다." },
          ],
        }}
      />

      {/* 마무리 */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-400/[0.05] via-violet-400/[0.05] to-transparent p-6 text-center">
        <p className="text-3xl">⭐</p>
        <h5 className="mt-2 font-serif text-lg font-bold text-slate-100">
          수학은 혼자가 아닌 역사가 만든다
        </h5>
        <p className="mt-2 text-sm leading-8 text-slate-300">
          바빌로니아의 점토판에서 시작해, 알콰리즈미의 체계화를 거쳐,
          <br />
          이탈리아 수학자들의 치열한 대결을 지나,
          <br />
          아벨과 갈루아가 27 살 · 21 살의 짧은 생애로 완성한 여정.
          <br />
          <br />
          <strong className="text-amber-200">
            우리가 오늘 배우는 방정식은 수천 년의 인류의 노고가 담긴 결정체입니다.
          </strong>
        </p>
      </div>

      <NavRow label="3 / 3" onBack={onBack} />
    </div>
  );
}

const GALOIS_LETTER =
  "“친구에게,\n\n나는 5 차 이상의 방정식을 왜 대수적으로 풀 수 없는가에 대해\n완전히 새로운 이론을 발견했습니다.\n시간이 없다… 시간이 없다…\n이 편지를 가우스와 야코비에게 전해 달라.\n\n— Évariste Galois, 1832 년 5 월 29 일 새벽”";

function GaloisLetter() {
  const [text, setText] = useState("");
  const [playing, setPlaying] = useState(false);
  const ivRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (ivRef.current !== null) window.clearInterval(ivRef.current);
    };
  }, []);

  function play() {
    if (ivRef.current !== null) {
      window.clearInterval(ivRef.current);
      ivRef.current = null;
    }
    setText("");
    setPlaying(true);
    let i = 0;
    ivRef.current = window.setInterval(() => {
      i += 1;
      if (i >= GALOIS_LETTER.length) {
        if (ivRef.current !== null) window.clearInterval(ivRef.current);
        ivRef.current = null;
        setPlaying(false);
      }
      setText(GALOIS_LETTER.slice(0, i));
    }, 28);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-950/40 to-slate-950/60 p-5">
      <span
        aria-hidden
        className="pointer-events-none absolute right-2 top-0 select-none text-7xl opacity-5"
      >
        🌙
      </span>
      <p className="text-xs tracking-widest text-slate-400">
        1832 년 5 월 29 일 — 결투 전날 밤
      </p>
      <pre className="mt-2 min-h-[80px] whitespace-pre-wrap font-serif text-sm italic leading-7 text-violet-200">
        {text}
      </pre>
      <button
        type="button"
        onClick={play}
        disabled={playing}
        className="mt-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-1.5 text-xs font-bold text-white transition disabled:opacity-70"
      >
        {playing ? "✉ 읽는 중…" : "✉ 갈루아의 편지 읽기"}
      </button>
    </div>
  );
}
