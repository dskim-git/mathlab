"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// 인라인 수식 — KaTeX 한 토막
function InlineFormula({ expr }: { expr: string }) {
  return (
    <span className="inline-flex items-center rounded bg-slate-950/60 px-1.5 py-0.5 align-middle text-amber-200">
      <Katex expr={expr} />
    </span>
  );
}

// ─── 성찰 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "ci_miss_cases",
    prompt:
      "‘표본 추출 + 신뢰구간 만들기’를 여러 번 눌러 보면, 95% 신뢰구간이 진짜 모비율 p를 놓치는 경우도 있었어요. 어떤 상황에서 그렇게 되었나요?",
    kind: "text",
    placeholder:
      "예: 표본 크기 n이 작거나, 우연히 한쪽으로 치우친 표본이 뽑힐 때 신뢰구간이 진짜 p를 놓쳤다. 100번 챌린지를 돌리면 95% 신뢰구간은 약 95번 정도가 p를 잡았다.",
  },
  {
    id: "k_95_vs_99",
    prompt:
      "같은 표본에서 신뢰도를 95%(k=1.96) ↔ 99%(k=2.58)로 바꿔 보면 신뢰구간의 길이와 ‘100번 챌린지 명중률’은 어떻게 달라졌나요?",
    kind: "text",
    placeholder:
      "예: 99%로 올리면 한 구간의 길이가 더 길어졌고, 100번 챌린지 명중률은 95→99에 가깝게 올라갔다. 더 자주 맞추려면 그만큼 구간을 길게 잡아야 한다.",
  },
  {
    id: "max_length_amgm",
    prompt:
      "길이 곡선에서 신뢰구간 길이는 p̂ = 1/2 일 때 최대가 되었어요. 산술–기하평균 a+b ≥ 2√(ab) 을 p̂ + q̂ = 1 에 적용해, 최대 길이가 왜 k/√n 인지 본인 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: p̂ + q̂ = 1 에 AM-GM 을 쓰면 1 ≥ 2√(p̂q̂) 이므로 √(p̂q̂) ≤ 1/2. 그래서 신뢰구간 길이 2k√(p̂q̂/n) 은 2k·(1/2)/√n = k/√n 이하이고, 등호는 p̂ = q̂ = 1/2 일 때 성립한다.",
  },
];

// ─── 시나리오 ───────────────────────────────────────────
type ScenKey = "pizza" | "archery" | "ad" | "seed";
type Scenario = {
  label: string;
  emoji: string;
  okEmoji: string;
  noEmoji: string;
  okWord: string;
  noWord: string;
  trueP: number;
  color1: string;
  color2: string;
  sub: string;
  // 헤더 범례 색 chip 정적 Tailwind 클래스 (인라인 회피)
  okChipClass: string;
  failChipClass: string;
};
const SCENARIOS: Record<ScenKey, Scenario> = {
  pizza: {
    label: "🍕 신메뉴 피자",
    sub: "매점 학생들의 선호 비율",
    emoji: "🍕",
    okEmoji: "🍕",
    noEmoji: "🥗",
    okWord: "피자 선호",
    noWord: "다른 메뉴",
    trueP: 0.62,
    color1: "#f87171",
    color2: "#fbbf24",
    okChipClass: "bg-[#f87171]",
    failChipClass: "bg-[#fbbf24]",
  },
  archery: {
    label: "🎯 양궁 명중",
    sub: "한 선수의 과녁 명중 비율",
    emoji: "🎯",
    okEmoji: "🎯",
    noEmoji: "✖️",
    okWord: "명중",
    noWord: "빗나감",
    trueP: 0.78,
    color1: "#fbbf24",
    color2: "#f87171",
    okChipClass: "bg-[#fbbf24]",
    failChipClass: "bg-[#f87171]",
  },
  ad: {
    label: "📱 광고 클릭",
    sub: "SNS 광고 클릭 비율",
    emoji: "📱",
    okEmoji: "👍",
    noEmoji: "👋",
    okWord: "클릭",
    noWord: "스킵",
    trueP: 0.18,
    color1: "#22d3ee",
    color2: "#475569",
    okChipClass: "bg-[#22d3ee]",
    failChipClass: "bg-[#475569]",
  },
  seed: {
    label: "🌱 씨앗 발아",
    sub: "새 품종의 발아 비율",
    emoji: "🌱",
    okEmoji: "🌱",
    noEmoji: "💀",
    okWord: "발아",
    noWord: "미발아",
    trueP: 0.45,
    color1: "#86efac",
    color2: "#92400e",
    okChipClass: "bg-[#86efac]",
    failChipClass: "bg-[#92400e]",
  },
};

type Sample = { n: number; X: number; phat: number; items: boolean[] };
type CI = { lo: number; hi: number; half: number };

function fmt(v: number, d = 3): string {
  if (!isFinite(v)) return "--";
  return Number(v.toFixed(d)).toString();
}
function fmtPct(v: number, d = 1): string {
  if (!isFinite(v)) return "--";
  return (v * 100).toFixed(d) + "%";
}
function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

function drawSampleFor(p: number, n: number): Sample {
  const items: boolean[] = [];
  let X = 0;
  for (let i = 0; i < n; i++) {
    const ok = Math.random() < p;
    items.push(ok);
    if (ok) X++;
  }
  return { n, X, phat: X / n, items };
}
function makeCI(s: Sample, k: number): CI {
  const phat = s.phat;
  const qhat = 1 - phat;
  const half = k * Math.sqrt((phat * qhat) / s.n);
  return { lo: phat - half, hi: phat + half, half };
}

type ChallengeStats = Record<ScenKey, { ok: number; bad: number }>;
const EMPTY_CH: ChallengeStats = {
  pizza: { ok: 0, bad: 0 },
  archery: { ok: 0, bad: 0 },
  ad: { ok: 0, bad: 0 },
  seed: { ok: 0, bad: 0 },
};

// ─── 메인 ─────────────────────────────────────────────────
export default function CiProportionLab() {
  const [curKey, setCurKey] = useState<ScenKey>("pizza");
  const [n, setN] = useState(100);
  const [k, setK] = useState(1.96);
  const [sample, setSample] = useState<Sample | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [chStats, setChStats] = useState<ChallengeStats>(EMPTY_CH);

  // lastCI 는 sample + k 에서 파생 → useMemo (setState-in-effect 회피).
  const lastCI = useMemo(() => (sample ? makeCI(sample, k) : null), [sample, k]);

  const sc = SCENARIOS[curKey];

  function handleScenChange(key: ScenKey) {
    setCurKey(key);
    setSample(null);
    setRevealed(false);
  }

  function handleDraw() {
    const s = drawSampleFor(sc.trueP, n);
    const ci = makeCI(s, k);
    setSample(s);
    const ok = ci.lo <= sc.trueP && sc.trueP <= ci.hi;
    setChStats((prev) => ({
      ...prev,
      [curKey]: {
        ok: prev[curKey].ok + (ok ? 1 : 0),
        bad: prev[curKey].bad + (ok ? 0 : 1),
      },
    }));
  }

  function handleChallenge() {
    let ok = 0;
    let bad = 0;
    let lastS: Sample | null = null;
    for (let i = 0; i < 100; i++) {
      const s = drawSampleFor(sc.trueP, n);
      const c = makeCI(s, k);
      if (c.lo <= sc.trueP && sc.trueP <= c.hi) ok++;
      else bad++;
      lastS = s;
    }
    if (lastS) setSample(lastS);
    setChStats((prev) => ({
      ...prev,
      [curKey]: {
        ok: prev[curKey].ok + ok,
        bad: prev[curKey].bad + bad,
      },
    }));
  }

  function handleResetCh() {
    setChStats(EMPTY_CH);
  }

  const cs = chStats[curKey];
  const tot = cs.ok + cs.bad;
  const verdictOk = sample && lastCI ? lastCI.lo <= sc.trueP && sc.trueP <= lastCI.hi : null;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">
          🏺 모비율 신뢰구간 챌린지 — 미스터리 항아리 속 p 잡기
        </h3>
        <p className="mt-2 leading-7 text-slate-300">
          항아리 속에 숨겨진 진짜 모비율 <b className="text-amber-300">p</b>를 표본만 가지고
          추정해 봐요. 표본비율 <b className="text-amber-300">p̂</b>으로 만든 신뢰구간이 정말{" "}
          <b className="text-amber-300">p</b>를 잡는지 직접 확인합시다.
        </p>
      </div>

      {/* 공식 카드 */}
      <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-amber-300/55 bg-slate-900/55 p-4 text-amber-100">
        <span className="text-base font-extrabold text-amber-300">📐 모비율의 신뢰구간</span>
        <div className="w-full overflow-x-auto rounded-md border border-amber-300/45 bg-amber-300/10 px-4 py-3 text-amber-100">
          <Katex
            display
            expr={String.raw`\hat{p} \;-\; k\sqrt{\dfrac{\hat{p}\hat{q}}{n}} \;\le\; p \;\le\; \hat{p} \;+\; k\sqrt{\dfrac{\hat{p}\hat{q}}{n}}`}
          />
        </div>
        <span className="text-sm font-bold text-amber-300">
          신뢰도 95% → k = 1.96 &nbsp; 99% → k = 2.58
        </span>
      </div>

      {/* ① 시나리오 */}
      <div className="mt-3 rounded-2xl border border-pink-400/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-pink-200">
          🎒 시나리오 선택{" "}
          <span className="rounded-full bg-pink-400/15 px-2 py-0.5 text-xs font-bold text-pink-200">
            실생활 미스터리 4종
          </span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SCENARIOS) as ScenKey[]).map((key) => {
            const s = SCENARIOS[key];
            const active = curKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleScenChange(key)}
                className={`flex-1 min-w-[170px] rounded-2xl border-2 px-3 py-2.5 text-sm font-extrabold text-white transition ${
                  active
                    ? "border-pink-200 bg-gradient-to-br from-pink-500 to-pink-700 shadow-md"
                    : "border-transparent bg-gradient-to-br from-slate-600 to-slate-700 hover:-translate-y-px"
                }`}
              >
                <div>{s.label}</div>
                <div className="mt-1 text-xs font-semibold opacity-90">{s.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ② 항아리 + 표본 */}
      <div className="mt-3 rounded-2xl border border-pink-400/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex flex-wrap items-center gap-2 text-base font-bold text-pink-200">
          🏺 미스터리 항아리와 표본{" "}
          <span className="rounded-full bg-pink-400/15 px-2 py-0.5 text-xs font-bold text-pink-200">
            표본은 보이지만 진짜 p 는 숨겨져 있어요
          </span>
        </h4>
        <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-xl border-2 border-pink-400/45 bg-gradient-to-br from-pink-500/10 to-violet-500/10 p-3 text-center">
            <div className="mb-2 text-sm font-extrabold text-pink-200">🏺 항아리 (모집단)</div>
            <JarCanvas scen={sc} revealed={revealed} />
            <div className="mt-2 rounded-lg border-[1.5px] border-amber-300/40 bg-amber-300/10 px-3 py-1.5 text-sm font-bold text-amber-100">
              ⚠️ 항아리 속에는 우리가 모르는 진짜 모비율{" "}
              <b className="text-amber-300">p</b> 가 숨겨져 있어요
            </div>
            <div className="mt-2 flex items-center justify-around gap-2 rounded-lg border-2 border-amber-300/55 bg-amber-300/15 px-3 py-2">
              <span className="text-sm font-bold text-amber-100">
                <span className="text-amber-300">진짜 모비율</span>{" "}
                <span
                  className={`text-xl font-extrabold text-amber-200 ${
                    !revealed ? "select-none blur-[7px]" : ""
                  }`}
                >
                  {fmt(sc.trueP)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setRevealed((r) => !r)}
                className="rounded-lg border-2 border-violet-300/55 bg-gradient-to-br from-violet-500 to-violet-700 px-3 py-1 text-xs font-extrabold text-white transition hover:from-violet-400 hover:to-violet-600 active:scale-95"
              >
                {revealed ? "🙈 정답 숨기기" : "👁 정답 보기"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border-[1.5px] border-cyan-400/35 bg-slate-950/55 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="text-sm font-extrabold text-cyan-300">
                🎲 추출된 표본 (n개)
              </span>
              {sample && (
                <span className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-200">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className={`inline-block h-3 w-3 rounded-sm ${sc.okChipClass}`}
                    />
                    {sc.okWord} = {sample.X}개
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span
                      className={`inline-block h-3 w-3 rounded-sm ${sc.failChipClass}`}
                    />
                    {sc.noWord} = {sample.n - sample.X}개
                  </span>
                </span>
              )}
            </div>
            <SampleCanvas sample={sample} scen={sc} />
            <div className="mt-2 grid grid-cols-3 gap-2">
              <KStatCard label="표본크기 n" value={sample ? String(sample.n) : "--"} />
              <KStatCard label="성공 X" value={sample ? String(sample.X) : "--"} />
              <KStatCard
                label="표본비율 p̂"
                value={sample ? fmt(sample.phat) : "--"}
                valueClass="text-amber-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ③ 추출 설정 */}
      <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-cyan-200">
          🎲 추출 설정{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            n과 신뢰도를 바꿔 보세요
          </span>
        </h4>
        <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-cyan-400/30 bg-cyan-500/10 px-3 py-2">
          <label
            htmlFor="cip-n"
            className="min-w-[130px] text-sm font-extrabold text-cyan-200"
          >
            표본 크기 n
          </label>
          <input
            id="cip-n"
            type="range"
            min={10}
            max={500}
            step={5}
            value={n}
            onChange={(e) => setN(parseInt(e.target.value, 10))}
            className="h-1.5 flex-1 accent-cyan-400"
          />
          <span className="min-w-[86px] rounded-md bg-slate-950/70 px-3 py-1 text-center text-xl font-extrabold text-amber-300 tabular-nums">
            {n}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] border-violet-400/35 bg-violet-500/10 px-3 py-2">
          <span className="min-w-[130px] text-sm font-extrabold text-violet-200">신뢰도</span>
          <div className="flex flex-1 gap-2">
            <KBtn active={k === 1.96} onClick={() => setK(1.96)}>
              95% &nbsp;(k = 1.96)
            </KBtn>
            <KBtn active={k === 2.58} onClick={() => setK(2.58)}>
              99% &nbsp;(k = 2.58)
            </KBtn>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDraw}
            className="flex-1 min-w-[180px] rounded-xl bg-gradient-to-br from-pink-500 to-pink-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-pink-400 hover:to-pink-600 active:scale-95"
          >
            🎲 표본 추출 + 신뢰구간 만들기
          </button>
          <button
            type="button"
            onClick={handleChallenge}
            className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 px-3 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:from-amber-400 hover:to-amber-600 active:scale-95"
          >
            🏆 100번 챌린지! (몇 번 p를 잡을까?)
          </button>
          <button
            type="button"
            onClick={handleResetCh}
            className="rounded-xl border border-slate-400/30 bg-slate-700/70 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-700/95 active:scale-95"
          >
            🔄 챌린지 초기화
          </button>
        </div>
      </div>

      {/* ④ 수직선 */}
      <div className="mt-3 rounded-2xl border border-violet-400/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-violet-200">
          📏 신뢰구간 — 진짜 <span className="text-amber-300">p</span> 를 잡았는지 보자!{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            노란선 = 진짜 p
          </span>
        </h4>
        <div className="rounded-xl border-[1.5px] border-violet-400/30 bg-slate-950/55 p-3">
          <NumlineCanvas sample={sample} ci={lastCI} trueP={sc.trueP} />
        </div>

        <VerdictBox
          sample={sample}
          ci={lastCI}
          ok={verdictOk}
          k={k}
          truep={sc.trueP}
        />

        <div className="mt-3 rounded-2xl border-2 border-emerald-400/45 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-extrabold tracking-wide text-emerald-300">
              🏆 챌린지 누적 결과 (현재 시나리오 · 같은 n, k)
            </span>
            <span className="text-xs font-bold text-slate-300">
              기대 명중률: 신뢰도{" "}
              <b className="text-amber-300">{k === 1.96 ? "95%" : "99%"}</b>
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <ChCard tone="ok" label="✅ p 명중" value={String(cs.ok)} />
            <ChCard tone="bad" label="❌ p 실패" value={String(cs.bad)} />
            <ChCard
              tone="rate"
              label="📈 명중률"
              value={tot > 0 ? fmtPct(cs.ok / tot) : "--%"}
            />
          </div>
          <ChallengeBar okPct={tot > 0 ? (cs.ok / tot) * 100 : 0} />
          <div className="mt-2 text-xs leading-5 text-slate-300">
            💡 100번 챌린지를 여러 번 돌려보면, 명중률이 신뢰도 (95% 또는 99%)에 가까워지는 것을
            볼 수 있어요!
          </div>
        </div>
      </div>

      {/* ⑤ 길이 곡선 */}
      <div className="mt-3 rounded-2xl border border-amber-300/25 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-amber-200">
          📐 신뢰구간의 길이 곡선{" "}
          <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-xs font-bold text-amber-200">
            p̂ 가 변할 때 길이 = 2k√(p̂q̂/n)
          </span>
        </h4>
        <div className="rounded-xl border-[1.5px] border-amber-300/30 bg-slate-950/55 p-3">
          <LengthCurveCanvas n={n} k={k} sample={sample} />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <LenCard
            label="현재 p̂ 에서 길이"
            value={
              sample
                ? fmt(2 * k * Math.sqrt((sample.phat * (1 - sample.phat)) / n), 4)
                : "--"
            }
          />
          <LenCard
            label="최대 길이 (p̂=½ 일 때)"
            value={fmt(k / Math.sqrt(n), 4)}
            valueClass="text-pink-200"
          />
          <LenCard label="길이 공식의 최대" value="k / √n" />
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-amber-300/45 bg-amber-300/10 p-3 text-sm leading-7 text-amber-50">
          <span className="text-xl">📏</span>
          <span>
            산술–기하평균 부등식{" "}
            <InlineFormula expr={String.raw`a + b \ge 2\sqrt{ab}`} /> 을{" "}
            <InlineFormula expr={String.raw`\hat{p} + \hat{q} = 1`} /> 에 적용하면
            <br />
            <InlineFormula
              expr={String.raw`1 = \hat{p} + \hat{q} \ge 2\sqrt{\hat{p}\hat{q}}`}
            />{" "}
            → <InlineFormula expr={String.raw`\sqrt{\hat{p}\hat{q}} \le \tfrac{1}{2}`} /> ∴{" "}
            <InlineFormula
              expr={String.raw`\sqrt{\dfrac{\hat{p}\hat{q}}{n}} \le \dfrac{1}{2\sqrt{n}}`}
            />
            <br />
            따라서 신뢰구간의 길이는{" "}
            <b className="text-yellow-200">2k × 1/(2√n) = k/√n</b> 이하이며, 등호는{" "}
            <b className="text-yellow-200">p̂ = q̂ = 1/2</b> 일 때 성립해요!
          </span>
        </div>
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <ReflectionForm questions={REFLECTION_QUESTIONS} />
      </div>
    </section>
  );
}

// ─── 빌딩블록 ──────────────────────────────────────────
function KBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-extrabold transition ${
        active
          ? "border-violet-200 bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-md"
          : "border-transparent bg-slate-700/60 text-slate-300 hover:bg-slate-700/85"
      }`}
    >
      {children}
    </button>
  );
}

function KStatCard({
  label,
  value,
  valueClass = "text-cyan-200",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border-[1.5px] border-cyan-400/40 bg-cyan-500/10 p-2 text-center">
      <div className="text-xs font-extrabold text-cyan-300">{label}</div>
      <div className={`mt-0.5 text-xl font-extrabold tabular-nums ${valueClass}`}>{value}</div>
    </div>
  );
}

type ChTone = "ok" | "bad" | "rate";
const CH_CLS: Record<ChTone, string> = {
  ok: "border-emerald-400/40 bg-emerald-500/10",
  bad: "border-rose-400/45 bg-rose-500/10",
  rate: "border-amber-300/45 bg-amber-500/10",
};
const CH_LABEL: Record<ChTone, string> = {
  ok: "text-emerald-300",
  bad: "text-rose-300",
  rate: "text-amber-200",
};
const CH_VAL: Record<ChTone, string> = {
  ok: "text-emerald-100",
  bad: "text-rose-100",
  rate: "text-amber-300",
};
function ChCard({
  tone,
  label,
  value,
}: {
  tone: ChTone;
  label: string;
  value: string;
}) {
  return (
    <div className={`rounded-xl border-[1.5px] p-2.5 text-center ${CH_CLS[tone]}`}>
      <div className={`text-sm font-extrabold ${CH_LABEL[tone]}`}>{label}</div>
      <div className={`mt-0.5 text-2xl font-extrabold tabular-nums ${CH_VAL[tone]}`}>
        {value}
      </div>
    </div>
  );
}

function ChallengeBar({ okPct }: { okPct: number }) {
  const w = Math.max(0, Math.min(100, okPct));
  return (
    <div className="mt-2 h-4 overflow-hidden rounded-md border border-slate-400/30 bg-rose-500/25">
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="block h-full w-full">
        <defs>
          <linearGradient id="ch-bar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={w} height="10" rx="1.2" fill="url(#ch-bar)" />
      </svg>
    </div>
  );
}

function LenCard({
  label,
  value,
  valueClass = "text-amber-100",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border-[1.5px] border-amber-300/40 bg-amber-500/10 p-2.5 text-center">
      <div className="text-sm font-extrabold text-amber-200">{label}</div>
      <div className={`mt-0.5 text-xl font-extrabold tabular-nums ${valueClass}`}>{value}</div>
    </div>
  );
}

// ─── Verdict ────────────────────────────────────────
function VerdictBox({
  sample,
  ci,
  ok,
  k,
  truep,
}: {
  sample: Sample | null;
  ci: CI | null;
  ok: boolean | null;
  k: number;
  truep: number;
}) {
  if (!sample || !ci) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl border-2 border-dashed border-slate-400/40 bg-slate-700/30 p-4 text-slate-200">
        <div className="text-4xl leading-none">🎯</div>
        <div>
          <div className="text-lg font-extrabold">위 버튼을 눌러 표본을 추출해 보세요!</div>
          <div className="text-sm text-slate-300">
            신뢰구간 안에 진짜 <b className="text-amber-300">p</b> 가 들어가면 ✅ 명중, 아니면 ❌
            실패
          </div>
        </div>
      </div>
    );
  }

  const tone =
    ok === true
      ? "border-emerald-400/60 bg-gradient-to-br from-emerald-500/20 to-lime-500/15 text-emerald-50"
      : "border-rose-400/60 bg-gradient-to-br from-rose-500/20 to-pink-500/15 text-rose-50";
  return (
    <div
      className={`mt-3 flex flex-wrap items-center gap-4 rounded-2xl border-2 p-4 ${tone}`}
    >
      <div className="text-4xl leading-none">{ok ? "✅" : "❌"}</div>
      <div>
        <div className="text-lg font-extrabold">
          {ok ? (
            <>
              신뢰구간이 진짜 <span className="text-yellow-200">p</span>를 잡았어요!
            </>
          ) : (
            <>
              아쉽게도 신뢰구간이 진짜 <span className="text-yellow-200">p</span>를 놓쳤어요
            </>
          )}
        </div>
        <div className="mt-1 text-sm text-slate-200">
          p̂ = {fmt(sample.phat)}, {k === 1.96 ? "95" : "99"}% 신뢰구간 [{fmt(ci.lo)},{" "}
          {fmt(ci.hi)}] / 진짜 p = {fmt(truep)}
        </div>
      </div>
    </div>
  );
}

// ─── Jar Canvas (rAF 애니메이션) ─────────────────────
function JarCanvas({ scen, revealed }: { scen: Scenario; revealed: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const tRef = useRef(0);
  const aliveRef = useRef(false);
  const W = 520;
  const H = 240;

  useEffect(() => {
    aliveRef.current = true;
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const tick = () => {
      if (!aliveRef.current) return;
      tRef.current += 0.012;
      drawFrame(ctx, W, H, scen, revealed, tRef.current);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      aliveRef.current = false;
    };
  }, [scen, revealed]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[240px] w-full rounded-lg bg-slate-950/60"
      aria-label="미스터리 항아리"
    />
  );
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  scen: Scenario,
  revealed: boolean,
  t: number
) {
  ctx.clearRect(0, 0, W, H);

  const jx = W * 0.18;
  const jy = H * 0.18;
  const jw = W * 0.64;
  const jh = H * 0.74;
  ctx.fillStyle = "rgba(168,85,247,.13)";
  ctx.strokeStyle = "rgba(196,181,253,.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(jx, jy + jh * 0.08);
  ctx.quadraticCurveTo(jx - jw * 0.12, jy + jh * 0.5, jx, jy + jh);
  ctx.quadraticCurveTo(jx + jw * 0.5, jy + jh * 1.18, jx + jw, jy + jh);
  ctx.quadraticCurveTo(jx + jw * 1.12, jy + jh * 0.5, jx + jw, jy + jh * 0.08);
  ctx.quadraticCurveTo(jx + jw * 0.5, jy - jh * 0.06, jx, jy + jh * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(15,23,42,.7)";
  ctx.beginPath();
  ctx.ellipse(jx + jw / 2, jy + jh * 0.08, jw * 0.42, jh * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const items = 28;
  for (let i = 0; i < items; i++) {
    const seed = i * 97;
    const ang = (i * 0.45 + t * 0.5) % (Math.PI * 2);
    const rd = Math.sin(i * 1.3 + t) * 0.5 + 0.5;
    const cx = jx + jw / 2 + Math.cos(ang) * jw * 0.28 * rd;
    const cy = jy + jh * 0.55 + Math.sin(ang * 1.3 + i) * jh * 0.28 * rd;
    const visualOk =
      Math.sin(seed * 11 + t * 0.7) > (revealed ? 1 - 2 * scen.trueP : 0);
    ctx.fillStyle = visualOk ? scen.color1 : scen.color2;
    ctx.beginPath();
    ctx.arc(cx, cy, 8 + Math.sin(t * 2 + i) * 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(visualOk ? scen.okEmoji : scen.noEmoji, cx, cy);
  }

  if (!revealed) {
    ctx.fillStyle = "rgba(251,191,36,.85)";
    ctx.font = "bold 76px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,.6)";
    ctx.shadowBlur = 8;
    ctx.fillText("?", jx + jw / 2, jy + jh * 0.45);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("p = " + fmt(scen.trueP), jx + jw / 2, jy + jh * 0.45);
  }
}

// ─── Sample Canvas (격자 + 등장 애니) ──────────────────
function SampleCanvas({ sample, scen }: { sample: Sample | null; scen: Scenario }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef(0);
  const W = 620;
  const H = 240;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      animRef.current = Math.min(1, (now - t0) / 600);
      drawSamp(ctx, W, H, sample, scen, animRef.current);
      if (animRef.current < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sample, scen]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[240px] w-full rounded-lg bg-slate-950/60"
      aria-label="추출된 표본"
    />
  );
}

function drawSamp(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  sample: Sample | null,
  scen: Scenario,
  anim: number
) {
  ctx.clearRect(0, 0, W, H);
  if (!sample) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText('🎲 아래 "표본 추출" 버튼을 눌러 보세요', W / 2, H / 2);
    return;
  }

  const padding = 16;
  const nn = sample.n;
  const aspect = (W - padding * 2) / (H - padding * 2);
  const cols = Math.ceil(Math.sqrt(nn * aspect));
  let rows = Math.ceil(nn / cols);
  while (cols * (rows - 1) >= nn && rows > 1) rows--;
  const cellW = (W - padding * 2) / cols;
  const cellH = (H - padding * 2) / rows;
  const r = Math.min(cellW, cellH) * 0.36;

  const shown = Math.min(nn, Math.floor(nn * anim));
  for (let i = 0; i < shown; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const cx = padding + col * cellW + cellW / 2;
    const cy = padding + row * cellH + cellH / 2;
    const ok = sample.items[i];
    ctx.fillStyle = ok ? scen.color1 : scen.color2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.45)";
    ctx.lineWidth = 1;
    ctx.stroke();
    if (r > 8) {
      ctx.font = Math.floor(r * 1.05) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(ok ? scen.okEmoji : scen.noEmoji, cx, cy);
    }
  }

  // 범례는 헤더 옆에 HTML 로 배치 — Canvas 내부에는 그리지 않음.
}

// ─── 수직선 (신뢰구간) ────────────────────────────────
function NumlineCanvas({
  sample,
  ci,
  trueP,
}: {
  sample: Sample | null;
  ci: CI | null;
  trueP: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 900;
  const H = 300;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 60;
    const padR = 60;
    const padT = 40;
    const padB = 70;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const yMid = padT + plotH / 2;

    ctx.strokeStyle = "rgba(148,163,184,.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, yMid);
    ctx.lineTo(W - padR, yMid);
    ctx.stroke();

    const ticks = 11;
    ctx.strokeStyle = "rgba(148,163,184,.4)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < ticks; i++) {
      const v = i / (ticks - 1);
      const x = padL + v * plotW;
      ctx.beginPath();
      ctx.moveTo(x, yMid - 7);
      ctx.lineTo(x, yMid + 7);
      ctx.stroke();
      ctx.fillText(v.toFixed(1), x, yMid + 12);
    }
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("모비율 p", W / 2, H - 22);

    const X = (v: number) => padL + clamp(v, 0, 1) * plotW;

    const truex = X(trueP);
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(truex, padT);
    ctx.lineTo(truex, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("p = " + fmt(trueP), truex, padT - 6);
    ctx.font = "22px sans-serif";
    ctx.fillText("⭐", truex, padT + plotH + 50);

    if (!sample || !ci) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("표본을 추출하면 신뢰구간이 표시됩니다", W / 2, yMid - 60);
      return;
    }

    const x1 = X(ci.lo);
    const x2 = X(ci.hi);
    const xc = X(sample.phat);
    const ok = ci.lo <= trueP && trueP <= ci.hi;

    // 신뢰구간 막대
    ctx.strokeStyle = ok ? "rgba(34,197,94,.92)" : "rgba(244,63,94,.92)";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, yMid);
    ctx.lineTo(x2, yMid);
    ctx.stroke();
    ctx.lineCap = "butt";

    // 양 끝 [ ]
    ctx.strokeStyle = ok ? "#86efac" : "#fca5a5";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, yMid - 22);
    ctx.lineTo(x1, yMid + 22);
    ctx.moveTo(x2, yMid - 22);
    ctx.lineTo(x2, yMid + 22);
    ctx.stroke();

    // p̂ 점
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(xc, yMid, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 라벨
    ctx.fillStyle = ok ? "#dcfce7" : "#fecaca";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(fmt(ci.lo), x1, yMid - 28);
    ctx.fillText(fmt(ci.hi), x2, yMid - 28);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("p̂ = " + fmt(sample.phat), xc, yMid - 32);

    // 길이 라벨
    const midY = yMid + 40;
    ctx.strokeStyle = "rgba(196,181,253,.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, midY - 6);
    ctx.lineTo(x1, midY + 6);
    ctx.moveTo(x2, midY - 6);
    ctx.lineTo(x2, midY + 6);
    ctx.moveTo(x1, midY);
    ctx.lineTo(x2, midY);
    ctx.stroke();
    ctx.fillStyle = "#c4b5fd";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("길이 ≈ " + fmt(ci.hi - ci.lo, 4), (x1 + x2) / 2, midY + 3);
  }, [sample, ci, trueP]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[300px] w-full rounded-lg bg-slate-950/60"
      aria-label="신뢰구간 수직선"
    />
  );
}

// ─── 길이 곡선 Canvas ─────────────────────────────────
function LengthCurveCanvas({
  n,
  k,
  sample,
}: {
  n: number;
  k: number;
  sample: Sample | null;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 900;
  const H = 300;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const padL = 64;
    const padR = 24;
    const padT = 22;
    const padB = 56;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const lenFn = (ph: number) => 2 * k * Math.sqrt((ph * (1 - ph)) / n);
    const lenMax = k / Math.sqrt(n);
    const yMax = lenMax * 1.18;
    const X = (ph: number) => padL + ph * plotW;
    const Y = (L: number) => padT + plotH - (L / yMax) * plotH;

    // 격자
    ctx.strokeStyle = "rgba(148,163,184,.13)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = padL + (i / 10) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 곡선 + 채움
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.beginPath();
    let first = true;
    for (let i = 0; i <= 200; i++) {
      const ph = i / 200;
      const y = Y(lenFn(ph));
      if (first) {
        ctx.moveTo(X(ph), y);
        first = false;
      } else {
        ctx.lineTo(X(ph), y);
      }
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(251,191,36,.10)";
    ctx.lineTo(X(1), Y(0));
    ctx.lineTo(X(0), Y(0));
    ctx.closePath();
    ctx.fill();

    // 최대선
    ctx.strokeStyle = "#fbcfe8";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(padL, Y(lenMax));
    ctx.lineTo(W - padR, Y(lenMax));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fbcfe8";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("최대길이 k/√n = " + fmt(lenMax, 4), W - padR - 6, Y(lenMax) - 5);

    // p̂=1/2 선
    ctx.strokeStyle = "rgba(196,181,253,.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(X(0.5), padT);
    ctx.lineTo(X(0.5), padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#c4b5fd";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("p̂ = ½", X(0.5), padT - 6);

    // 현재 p̂ 마커
    if (sample) {
      const ph = sample.phat;
      const cx = X(ph);
      const cy = Y(lenFn(ph));
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, padT + plotH);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#22d3ee";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("현재 p̂", cx, cy - 12);
    }

    // 축
    ctx.strokeStyle = "rgba(148,163,184,.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    ctx.lineTo(W - padR, padT + plotH);
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.stroke();

    // x 눈금
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= 10; i++) {
      const v = i / 10;
      ctx.fillText(v.toFixed(1), X(v), padT + plotH + 6);
    }
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("표본비율 p̂", W / 2, H - 18);

    // y 눈금
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      const v = (i / 4) * yMax;
      ctx.fillText(fmt(v), padL - 6, Y(v));
    }
    ctx.save();
    ctx.translate(20, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("신뢰구간 길이 = 2k√(p̂q̂/n)", 0, 0);
    ctx.restore();
  }, [n, k, sample]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[300px] w-full rounded-lg bg-slate-950/60"
      aria-label="신뢰구간 길이 곡선"
    />
  );
}
