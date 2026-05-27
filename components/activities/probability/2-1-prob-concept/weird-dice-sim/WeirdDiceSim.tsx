"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

type Die = {
  id: string;
  name: string;
  sub: string;
  faces: string[];
  probs: number[];
  colors: string[];
  works: boolean;
  anim: string; // 굴릴 때 적용할 애니메이션 클래스
  insight: { cls: string; title: string; body: string };
  svg: string;
};

// 신뢰된 정적 HTML(<b>/<br>) 렌더
function Rich({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

const ANIM: Record<string, string> = {
  cube: "animate-[diceTumble_0.6s_linear_infinite]",
  octa: "animate-[diceFlip_0.7s_linear_infinite]",
  sphere: "animate-[diceSpin_0.5s_linear_infinite]",
  frustum: "animate-[diceWobble_0.5s_ease-in-out_infinite]",
};

// 자동/단일 굴림 1회의 애니메이션 길이(ms). 자동 던지기 속도 = 이 간격.
type SpeedKey = "slow" | "normal" | "fast";
const SPEED_MS: Record<SpeedKey, number> = { slow: 1000, normal: 550, fast: 280 };
const SPEED_LABEL: Record<SpeedKey, string> = { slow: "🐢 느리게", normal: "🚶 보통", fast: "🐇 빠르게" };

const DICE: Die[] = [
  {
    id: "cube", name: "정육면체", sub: "일반 주사위 (6면)",
    faces: ["1", "2", "3", "4", "5", "6"],
    probs: [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6],
    colors: ["#3b82f6", "#60a5fa", "#93c5fd", "#2563eb", "#1d4ed8", "#3b82f6"],
    works: true, anim: ANIM.cube,
    insight: {
      cls: "ins-ok", title: "✅ 수학적 확률 성립!",
      body: "정육면체의 6개 면은 넓이가 모두 동일합니다.<br>따라서 각 근원사건이 일어날 확률이 모두 <b>1/6로 동일</b>합니다.<br>→ 수학적 확률을 정의할 수 있습니다.",
    },
    svg: `<svg viewBox="0 0 100 92" xmlns="http://www.w3.org/2000/svg"><polygon points="50,4 92,26 50,48 8,26" fill="#60a5fa" stroke="#1d4ed8" stroke-width="1.5"/><polygon points="8,26 50,48 50,88 8,66" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/><polygon points="92,26 50,48 50,88 92,66" fill="#1e40af" stroke="#1d4ed8" stroke-width="1.5"/><circle cx="50" cy="26" r="5" fill="white" opacity=".85"/><circle cx="26" cy="53" r="3.5" fill="white" opacity=".8"/><circle cx="34" cy="74" r="3.5" fill="white" opacity=".8"/><circle cx="66" cy="53" r="3.5" fill="white" opacity=".8"/><circle cx="74" cy="74" r="3.5" fill="white" opacity=".8"/></svg>`,
  },
  {
    id: "frustum", name: "사각뿔대", sub: "위아래 크기가 다른 육면체",
    faces: ["위면(1)", "앞면(2)", "오른면(3)", "뒷면(4)", "왼면(5)", "아래면(6)"],
    probs: [0.04, 0.165, 0.165, 0.165, 0.165, 0.3],
    colors: ["#fbbf24", "#fb923c", "#f97316", "#ea580c", "#dc2626", "#ef4444"],
    works: false, anim: ANIM.frustum,
    insight: {
      cls: "ins-warn", title: "⚠️ 수학적 확률 불성립!",
      body: "사각뿔대는 면마다 넓이가 다릅니다.<br>▸ <b>아래면(6)</b>: 면적 가장 큼 → 가장 자주 나옴<br>▸ <b>위면(1)</b>: 면적 가장 작음 → 거의 안 나옴<br>→ 각 근원사건의 확률이 <b>동일하지 않아</b> 수학적 확률을 정의할 수 없습니다.",
    },
    svg: `<svg viewBox="0 0 100 96" xmlns="http://www.w3.org/2000/svg"><polygon points="30,6 70,6 70,18 30,18" fill="#fbbf24" stroke="#b45309" stroke-width="1.5"/><polygon points="4,92 96,92 96,78 4,78" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/><polygon points="4,78 30,18 30,6 4,66" fill="#f97316" stroke="#c2410c" stroke-width="1.5"/><polygon points="96,78 70,18 70,6 96,66" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/><polygon points="4,78 96,78 70,18 30,18" fill="#fb923c" stroke="#c2410c" stroke-width="1.5"/><text x="50" y="14" text-anchor="middle" fill="#1c1917" font-size="7" font-weight="bold">작은 면</text><text x="50" y="88" text-anchor="middle" fill="white" font-size="7" font-weight="bold">큰 면</text></svg>`,
  },
  {
    id: "sphere", name: "구형", sub: "공 모양 주사위 (6구역)",
    faces: ["1구역", "2구역", "3구역", "4구역", "5구역", "6구역", "⚡경계"],
    probs: [0.155, 0.155, 0.155, 0.155, 0.155, 0.155, 0.07],
    colors: ["#a855f7", "#9333ea", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95", "#ec4899"],
    works: false, anim: ANIM.sphere,
    insight: {
      cls: "ins-bad", title: "❗ 두 가지 심각한 문제!",
      body: "① <b>경계 문제</b>: 구역을 나누는 선이 바닥에 닿으면 두 사건이 동시에 발생합니다.<br>→ 근원사건들이 <b>배반관계</b>가 아닐 수 있습니다.<br>② <b>정의 불가</b>: '경계에 걸침'은 어느 사건에도 속하지 않는 애매한 결과입니다.<br>→ 수학적 확률의 기본 전제가 모두 무너집니다.",
    },
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="wdSphG" cx="35%" cy="32%"><stop offset="0%" stop-color="white" stop-opacity=".35"/><stop offset="100%" stop-color="black" stop-opacity=".25"/></radialGradient><clipPath id="wdSphClip"><circle cx="50" cy="50" r="43"/></clipPath></defs><circle cx="50" cy="50" r="43" fill="#9333ea" stroke="#6d28d9" stroke-width="1.5"/><circle cx="50" cy="50" r="43" fill="url(#wdSphG)"/><ellipse cx="50" cy="50" rx="43" ry="12" fill="none" stroke="#c084fc" stroke-width="1.3" opacity=".7" clip-path="url(#wdSphClip)"/><line x1="50" y1="7" x2="50" y2="93" stroke="#c084fc" stroke-width="1.3" opacity=".7"/><path d="M 12 28 Q 50 50 88 72" fill="none" stroke="#c084fc" stroke-width="1.3" opacity=".7"/><text x="30" y="34" fill="white" font-size="10" font-weight="bold" opacity=".9">1</text><text x="60" y="34" fill="white" font-size="10" font-weight="bold" opacity=".9">2</text><text x="26" y="57" fill="white" font-size="10" font-weight="bold" opacity=".9">3</text><text x="56" y="57" fill="white" font-size="10" font-weight="bold" opacity=".9">4</text><text x="30" y="78" fill="white" font-size="10" font-weight="bold" opacity=".9">5</text><text x="62" y="78" fill="white" font-size="10" font-weight="bold" opacity=".9">6</text><text x="70" y="20" fill="#f472b6" font-size="15" opacity=".95">⚡</text></svg>`,
  },
  {
    id: "octa", name: "정팔면체", sub: "정삼각형 8면체",
    faces: ["1", "2", "3", "4", "5", "6", "7", "8"],
    probs: [1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8],
    colors: ["#10b981", "#34d399", "#6ee7b7", "#10b981", "#059669", "#10b981", "#34d399", "#059669"],
    works: true, anim: ANIM.octa,
    insight: {
      cls: "ins-ok", title: "✅ 수학적 확률 성립!",
      body: "정팔면체는 <b>8개의 정삼각형</b>으로 이루어집니다.<br>모든 면의 넓이가 동일하여 각 근원사건의 확률이 <b>1/8로 동일</b>합니다.<br>→ 표본공간은 {1,2,3,4,5,6,7,8}, 수학적 확률 성립!",
    },
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,4 12,56 88,56" fill="#34d399" stroke="#065f46" stroke-width="1.5"/><polygon points="50,96 12,56 88,56" fill="#10b981" stroke="#065f46" stroke-width="1.5"/><polygon points="50,4 12,56 50,40" fill="#6ee7b7" stroke="#065f46" stroke-width="1" opacity=".6"/><polygon points="50,4 88,56 50,40" fill="#059669" stroke="#065f46" stroke-width="1" opacity=".6"/><line x1="50" y1="4" x2="50" y2="96" stroke="#065f46" stroke-width="1" opacity=".4"/><line x1="12" y1="56" x2="88" y2="56" stroke="#065f46" stroke-width="1" opacity=".4"/><text x="36" y="40" fill="white" font-size="10" font-weight="bold">1</text><text x="56" y="40" fill="white" font-size="10" font-weight="bold">2</text><text x="36" y="76" fill="white" font-size="10" font-weight="bold">5</text><text x="56" y="76" fill="white" font-size="10" font-weight="bold">6</text></svg>`,
  },
];

const INS_CLS: Record<string, string> = {
  "ins-ok": "border-emerald-500 bg-emerald-500/10 text-emerald-100",
  "ins-warn": "border-amber-500 bg-amber-500/10 text-amber-100",
  "ins-bad": "border-pink-500 bg-pink-500/10 text-pink-100",
};

function pickFace(d: Die): string {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < d.probs.length; i++) {
    cum += d.probs[i];
    if (r < cum) return d.faces[i];
  }
  return d.faces[d.faces.length - 1];
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "two_conditions",
    prompt:
      "수학적 확률을 정의하기 위해 필요한 두 조건(① 각 근원사건이 같은 정도로 일어남=등확률 ② 근원사건들이 서로 배반)을 이 활동에서 발견한 대로 정리해 보세요.",
    kind: "text",
  },
  {
    id: "which_dice",
    prompt:
      "네 주사위(정육면체·사각뿔대·구형·정팔면체) 중 수학적 확률이 성립하는 것과 아닌 것을 구분하고, 각각의 이유를 설명해 보세요.",
    kind: "text",
  },
  {
    id: "sphere_boundary",
    prompt:
      "구형 주사위의 ‘경계’ 결과는 수학적 확률의 어떤 전제(등확률·배반)를 무너뜨리는지 설명해 보세요.",
    kind: "text",
  },
];

export default function WeirdDiceSim() {
  const [selId, setSelId] = useState<string | null>(null);
  const [n, setN] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [phase, setPhase] = useState<"idle" | "rolling" | "result">("idle");
  const [flicker, setFlicker] = useState("");
  const [result, setResult] = useState<{ face?: string; isBoundary?: boolean; count?: number; last?: string } | null>(null);
  const [speed, setSpeed] = useState<SpeedKey>("normal");
  const [auto, setAuto] = useState(false);

  const flickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rollingRef = useRef(false);
  const autoRef = useRef(false);
  const performRef = useRef<() => void>(() => {});

  function clearTimers() {
    if (flickRef.current) clearInterval(flickRef.current);
    if (doneRef.current) clearTimeout(doneRef.current);
    if (nextRef.current) clearTimeout(nextRef.current);
  }
  useEffect(() => () => clearTimers(), []);

  const die = selId ? DICE.find((d) => d.id === selId)! : null;

  function stopAuto() {
    autoRef.current = false;
    setAuto(false);
    if (nextRef.current) clearTimeout(nextRef.current);
  }

  function selectDie(id: string) {
    stopAuto(); clearTimers(); rollingRef.current = false;
    setSelId(id);
    const d = DICE.find((x) => x.id === id)!;
    setCounts(Object.fromEntries(d.faces.map((f) => [f, 0])));
    setTotal(0); setPhase("idle"); setResult(null); setFlicker("");
  }
  function resetStats() {
    if (!die) return;
    stopAuto(); clearTimers(); rollingRef.current = false;
    setCounts(Object.fromEntries(die.faces.map((f) => [f, 0])));
    setTotal(0); setPhase("idle"); setResult(null);
  }

  // 한 번의 굴림: 항상 애니메이션(스핀+플리커) → 정착. count(=n)개를 한꺼번에 집계.
  // 자동/일괄(n>10)도 동일하게 애니메이션이 나온다.
  function performRoll() {
    if (!die || rollingRef.current) return;
    rollingRef.current = true;
    const animMs = SPEED_MS[speed];
    const count = n;
    setPhase("rolling");
    setResult(null);
    flickRef.current = setInterval(() => setFlicker(die.faces[Math.floor(Math.random() * die.faces.length)]), 70);
    doneRef.current = setTimeout(() => {
      if (flickRef.current) clearInterval(flickRef.current);
      const tally: Record<string, number> = {};
      let last = "";
      for (let i = 0; i < count; i++) { last = pickFace(die); tally[last] = (tally[last] ?? 0) + 1; }
      setCounts((prev) => { const nc = { ...prev }; for (const k in tally) nc[k] = (nc[k] ?? 0) + tally[k]; return nc; });
      setTotal((t) => t + count);
      setResult(count === 1 ? { face: last, isBoundary: last === "⚡경계" } : { count, last });
      setPhase("result");
      rollingRef.current = false;
      if (autoRef.current) nextRef.current = setTimeout(() => performRef.current(), Math.max(160, animMs * 0.35));
    }, animMs);
  }
  useEffect(() => { performRef.current = performRoll; });

  function manualRoll() {
    if (!die || rollingRef.current || auto) return;
    performRoll();
  }
  function toggleAuto() {
    if (!die) return;
    if (autoRef.current) { stopAuto(); return; }
    autoRef.current = true;
    setAuto(true);
    if (!rollingRef.current) performRoll();
  }

  const idealPct = die ? (1 / die.faces.length) * 100 : 0;
  const speedBtn = (active: boolean) =>
    active ? "rounded-md border border-violet-400/40 bg-violet-500/25 px-2.5 py-1 text-xs font-bold text-violet-200"
      : "rounded-md border border-white/12 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 확률</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 이상한 주사위와 수학적 확률</h3>
        <p className="mt-2 leading-7 text-slate-300">
          주사위 모양이 달라지면 수학적 확률을 정의할 수 있을까요? 여러 형태의 주사위를 직접 굴려보며 <b className="text-violet-300">수학적 확률이 성립하는 조건</b>을 탐구해 보세요!
        </p>
      </div>

      {/* 주사위 카드 */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {DICE.map((d) => {
          const sel = selId === d.id;
          return (
            <button key={d.id} type="button" onClick={() => selectDie(d.id)}
              className={`rounded-2xl border-2 p-3 text-center transition ${sel ? "border-violet-400 bg-violet-400/15 shadow-[0_0_20px_rgba(167,139,250,0.25)]" : "border-white/10 bg-white/5 hover:-translate-y-0.5 hover:bg-white/10"}`}>
              <div className="mx-auto mb-1.5 h-16 w-16 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: d.svg }} />
              <div className="text-sm font-bold text-slate-100">{d.name}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-slate-400">{d.sub}</div>
            </button>
          );
        })}
      </div>

      {/* 컨트롤 */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-white/10 bg-slate-900 p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">한 번에</span>
          <input type="range" min={1} max={1000} value={n} onChange={(e) => setN(Number(e.target.value))} className="w-24 accent-violet-400" aria-label="굴리는 횟수" />
          <span className="min-w-[44px] text-sm font-bold text-violet-300">{n}회</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">속도</span>
          {(["slow", "normal", "fast"] as SpeedKey[]).map((s) => (
            <button key={s} type="button" className={speedBtn(speed === s)} onClick={() => setSpeed(s)}>{SPEED_LABEL[s]}</button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-400">누적: <b className="text-violet-300">{total}</b>번</span>
        <button type="button" onClick={manualRoll} disabled={!die || phase === "rolling" || auto}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-45">
          🎲 굴리기!
        </button>
        <button type="button" onClick={toggleAuto} disabled={!die}
          className={`rounded-lg px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-45 ${auto ? "bg-red-500" : "bg-emerald-600"}`}>
          {auto ? "■ 정지" : "▶ 자동"}
        </button>
        <button type="button" onClick={resetStats} disabled={!die}
          className="rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-45">↺ 초기화</button>
      </div>

      {/* 굴리기 무대 — 크기 고정(주사위가 멈추든 굴러가든 동일), 아래 통계가 흔들리지 않게 */}
      <div className="mt-3 flex h-[248px] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/8 bg-black/30 p-4">
        {!die ? (
          <p className="text-sm text-slate-500">위에서 주사위를 선택하고 굴려보세요!</p>
        ) : (
          <>
            <div className="[perspective:600px]">
              <div
                className={`h-28 w-28 [&>svg]:h-full [&>svg]:w-full ${phase === "rolling" ? die.anim : ""} ${phase === "idle" ? "opacity-70" : ""}`}
                dangerouslySetInnerHTML={{ __html: die.svg }}
              />
            </div>
            <div className="flex h-[70px] flex-col items-center justify-center gap-1 text-center">
              {phase === "rolling" ? (
                <>
                  <div className="text-4xl font-black text-violet-200">{flicker}</div>
                  <p className="text-xs text-slate-500">굴리는 중…</p>
                </>
              ) : phase === "result" && result ? (
                result.count ? (
                  <>
                    <div className="animate-[fadeIn_0.3s_ease] text-4xl font-black text-violet-200">🎲 {result.count}번!</div>
                    <p className="text-sm text-slate-400">총 {total}번{result.last ? ` (마지막: ${result.last})` : ""}</p>
                  </>
                ) : result.isBoundary ? (
                  <>
                    <div className="animate-[fadeIn_0.3s_ease] bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-4xl font-black text-transparent">⚡ 경계!</div>
                    <p className="text-sm text-pink-300">두 구역 경계에 걸쳤습니다!</p>
                  </>
                ) : (
                  <>
                    <div className="animate-[fadeIn_0.3s_ease] text-4xl font-black text-violet-100">{result.face}</div>
                    <p className="text-sm text-slate-400">{n === 1 ? `"${result.face}" 나왔습니다` : `(마지막: ${result.face})`}</p>
                  </>
                )
              ) : (
                <p className="text-sm text-slate-400">{die.name} 선택됨 — 굴려보세요! 🎲</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* 누적 통계 */}
      {die && total > 0 ? (
        <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-violet-300">📊 누적 통계</p>
            <span className="text-xs text-slate-500">총 {total}번</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {die.faces.map((face, i) => {
              const cnt = counts[face] ?? 0;
              const pct = total > 0 ? (cnt / total) * 100 : 0;
              const isBnd = face === "⚡경계";
              const w = Math.min(pct, 100);
              return (
                <div key={face}>
                  <div className="flex justify-between text-xs">
                    <span className={isBnd ? "text-pink-300" : "text-slate-300"}>{face}</span>
                    <span className="text-slate-400">{cnt}회 ({pct.toFixed(1)}%)</span>
                  </div>
                  <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="mt-1 h-3 w-full overflow-hidden rounded bg-white/8" aria-hidden>
                    <rect x="0" y="0" width={w} height="8" fill={isBnd ? "#ec4899" : die.colors[i]} rx="1" />
                    <line x1={Math.min(idealPct, 100)} x2={Math.min(idealPct, 100)} y1="0" y2="8" stroke="white" strokeOpacity="0.5" strokeWidth="0.6" />
                  </svg>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-right text-[11px] text-slate-500">흰 선 = 균등 이론 확률 ({idealPct.toFixed(1)}%)</p>
        </div>
      ) : null}

      {/* 인사이트 (30회 이상) */}
      {die && total >= 30 ? (
        <div className={`mt-3 animate-[fadeIn_0.4s_ease] rounded-xl border-l-4 p-3.5 text-sm leading-7 ${INS_CLS[die.insight.cls]}`}>
          <p className="font-bold">{die.insight.title}</p>
          <p className="mt-1">
            <Rich html={die.insight.body} />
            {die.id === "sphere" && (counts["⚡경계"] ?? 0) > 0 ? (
              <><br /><br />🔍 <b>실제 경계 발생: {counts["⚡경계"]}번</b> (전체의 {(((counts["⚡경계"] ?? 0) / total) * 100).toFixed(1)}%)</>
            ) : null}
          </p>
        </div>
      ) : null}

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
