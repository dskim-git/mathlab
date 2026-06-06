"use client";

import { useEffect, useRef, useState } from "react";

type TabKey = "series" | "calc" | "quiz" | "riemann" | "euler";

// 정밀 사전 계산값
const PRECOMP: Record<number, number> = {
  2: 1.6449340668482,
  3: 1.2020569031595,
  4: 1.0823232337111,
  5: 1.0369277551433,
  6: 1.0173430619844,
  7: 1.0083492773819,
  8: 1.0040773561979,
  9: 1.002008392826,
  10: 1.0009945751278,
};

const EXACT: Record<number, string> = {
  2: "π² / 6",
  4: "π⁴ / 90",
  6: "π⁶ / 945",
  8: "π⁸ / 9450",
  10: "π¹⁰ / 93555",
};

const PI_SQ_6 = (Math.PI * Math.PI) / 6;

export default function ZetaExplorer() {
  const [tab, setTab] = useState<TabKey>("series");
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-5">
        <h2 className="text-2xl font-bold text-white">
          🔭 리만 제타함수 탐험
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          조화급수에서 리만 제타함수까지 — 짝수와 홀수의 비밀, 그리고 리만 가설을
          탐험합니다.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { key: "series", label: "① 급수 탐험" },
            { key: "calc", label: "② 제타 탐험기" },
            { key: "quiz", label: "③ π 퀴즈" },
            { key: "riemann", label: "④ 리만 가설" },
            { key: "euler", label: "⑤ 오일러 곱" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              "rounded-lg border px-3 py-1.5 text-sm font-semibold transition " +
              (tab === t.key
                ? "border-indigo-400/60 bg-indigo-500/20 text-indigo-200"
                : "border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-900")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className={tab === "series" ? "" : "hidden"}>
        <SeriesTab />
      </section>
      <section className={tab === "calc" ? "" : "hidden"}>
        <CalcTab />
      </section>
      <section className={tab === "quiz" ? "" : "hidden"}>
        <QuizTab />
      </section>
      <section className={tab === "riemann" ? "" : "hidden"}>
        <RiemannTab active={tab === "riemann"} />
      </section>
      <section className={tab === "euler" ? "" : "hidden"}>
        <EulerTab active={tab === "euler"} />
      </section>
    </div>
  );
}

// ─── 탭 1: 급수 탐험 ──────────────────────────────────────────
function SeriesTab() {
  const [n, setN] = useState<number>(0);
  const [harm, setHarm] = useState<number>(0);
  const [basel, setBasel] = useState<number>(0);
  const [hHist, setHHist] = useState<number[]>([]);
  const [bHist, setBHist] = useState<number[]>([]);

  function addTerms(k: number) {
    let nn = n;
    let hh = harm;
    let bb = basel;
    const nh = hHist.slice();
    const nb = bHist.slice();
    for (let i = 0; i < k; i++) {
      nn++;
      hh += 1 / nn;
      bb += 1 / (nn * nn);
      if (nh.length < 600) {
        nh.push(Math.min(hh, 7));
        nb.push(bb);
      }
    }
    setN(nn);
    setHarm(hh);
    setBasel(bb);
    setHHist(nh);
    setBHist(nb);
  }

  function reset() {
    setN(0);
    setHarm(0);
    setBasel(0);
    setHHist([]);
    setBHist([]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <h3 className="mb-2 text-base font-bold text-white">
          📊 두 급수를 비교해보자!
        </h3>
        <p className="mb-3 text-xs text-slate-400">
          1 부터 차례로 더해갈 때, 어떤 급수는 무한히 커지고 어떤 급수는 어느
          값에 가까워집니다. 항을 추가하면서 두 급수의 차이를 느껴보세요!
        </p>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => addTerms(1)}
            className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            + 1 항 추가
          </button>
          <button
            type="button"
            onClick={() => addTerms(10)}
            className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            + 10 항 추가
          </button>
          <button
            type="button"
            onClick={() => addTerms(100)}
            className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            + 100 항 추가
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-rose-400/40 bg-rose-500/20 px-3 py-1.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/30"
          >
            ↺ 초기화
          </button>
          <span className="ml-2 text-sm font-bold text-slate-300">
            n = {n}
          </span>
        </div>

        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-rose-400/40 bg-rose-500/10 p-4">
            <div className="text-xs text-rose-300">조화급수 (s = 1)</div>
            <div className="my-1 text-3xl font-extrabold text-rose-200">
              {harm.toFixed(4)}
            </div>
            <div className="text-xs text-rose-300">→ ∞ 발산!</div>
          </div>
          <div className="rounded-xl border-2 border-blue-400/40 bg-blue-500/10 p-4">
            <div className="text-xs text-blue-300">바젤 급수 ζ(2)</div>
            <div className="my-1 text-3xl font-extrabold text-blue-200">
              {basel.toFixed(6)}
            </div>
            <div className="text-xs text-blue-300">
              → π²/6 ≈ 1.6449 수렴
            </div>
          </div>
        </div>

        <SeriesChart hHist={hHist} bHist={bHist} harm={harm} />
        <p className="mt-1 text-center text-xs text-slate-400">
          빨간: 조화급수 · 파란: 바젤급수 (ζ(2)) · 점선: π²/6 ≈ 1.6449
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <h3 className="mb-2 text-base font-bold text-white">
          💡 왜 이렇게 다를까?
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm">
            <div className="font-bold text-rose-300">조화급수 (발산)</div>
            <div className="mt-1 leading-7 text-slate-300">
              1 + 1/2 + 1/3 + 1/4 + …
              <br />
              <br />
              더하는 값이 <b className="text-rose-300">천천히</b> 줄어서 결국
              무한대!
            </div>
          </div>
          <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 p-3 text-sm">
            <div className="font-bold text-blue-300">바젤 급수 (수렴)</div>
            <div className="mt-1 leading-7 text-slate-300">
              1 + 1/4 + 1/9 + 1/16 + …
              <br />
              <br />
              더하는 값이 <b className="text-blue-300">빠르게</b> 줄어서 π²/6
              에 수렴!
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-slate-300">
          💬 <b className="text-emerald-300">생각해보기</b>: 조화급수의 처음
          100 개 항을 더하면 얼마나 될까요? 얼마나 더해야 10 을 넘을 수
          있을까요? (실제로 엄청나게 많이 필요해요!)
        </div>
      </div>
    </div>
  );
}

function SeriesChart({
  hHist,
  bHist,
  harm,
}: {
  hHist: number[];
  bHist: number[];
  harm: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(300, wrap.clientWidth - 20);
    const H = 190;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const pL = 44,
      pR = 12,
      pT = 12,
      pB = 26;
    const w = W - pL - pR;
    const h = H - pT - pB;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    const maxY = hHist.length > 0 ? Math.max(Math.min(harm, 7), 2) : 2;
    const N = hHist.length;
    const toX = (i: number) => pL + (N > 1 ? i / (N - 1) : 0) * w;
    const toY = (v: number) => pT + h * (1 - v / maxY);

    // 격자
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let yv = 0; yv <= maxY; yv += 0.5) {
      const py = toY(yv);
      ctx.beginPath();
      ctx.moveTo(pL, py);
      ctx.lineTo(pL + w, py);
      ctx.stroke();
      ctx.fillStyle = "#475569";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(yv.toFixed(1), pL - 3, py + 4);
    }

    // π²/6 점선
    const ty = toY(PI_SQ_6);
    if (ty >= pT && ty <= pT + h) {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(pL, ty);
      ctx.lineTo(pL + w, ty);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      ctx.fillStyle = "#60a5fa";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("π²/6", pL + 4, ty - 3);
    }

    if (N < 2) {
      ctx.fillStyle = "#475569";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("항을 추가해보세요!", W / 2, H / 2);
      return;
    }

    // 조화급수 (빨강)
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    hHist.forEach((v, i) => {
      const x = toX(i);
      const y = toY(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 바젤급수 (파랑)
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    bHist.forEach((v, i) => {
      const x = toX(i);
      const y = toY(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [hHist, bHist, harm]);

  return (
    <div ref={wrapRef} className="rounded-lg border border-white/10 p-2">
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── 탭 2: 제타 탐험기 ────────────────────────────────────────
function CalcTab() {
  const [s, setS] = useState<number>(2);
  const v = PRECOMP[s];
  const even = s % 2 === 0;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <h3 className="mb-2 text-base font-bold text-white">🔭 ζ(s) 탐험기</h3>
        <p className="mb-3 text-xs text-slate-400">
          s 를 조절하며 ζ(s) = 1 + 1/2ˢ + 1/3ˢ + 1/4ˢ + ⋯ 값을 탐험해보세요.
          짝수와 홀수에서 어떤 차이가 나타날까요?
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-300">
            s ={" "}
            <span className="text-lg font-extrabold text-indigo-300">{s}</span>
          </label>
          <input
            type="range"
            min={2}
            max={10}
            step={1}
            value={s}
            onChange={(e) => setS(Number(e.target.value))}
            className="flex-1 min-w-[160px]"
            aria-label="s"
          />
        </div>
        <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-5 text-center">
          <div className="text-sm text-indigo-300">ζ({s}) =</div>
          <div className="my-1 text-4xl font-extrabold text-indigo-200">
            {v.toFixed(6)}
          </div>
          <div className="mt-2">
            {even ? (
              <span className="inline-block rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-200">
                ✨ 닫힌 꼴: {EXACT[s]}
              </span>
            ) : (
              <span className="inline-block rounded-full border border-amber-400/50 bg-amber-500/15 px-3 py-1 text-sm font-bold text-amber-200">
                🔒 홀수 s: 아직 닫힌 꼴이 없어요!
              </span>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          (10,000 항 부분합 — 실제 값에 매우 가깝게 수렴)
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <h3 className="mb-3 text-base font-bold text-white">
          📋 ζ(s) 값 표 — 패턴을 찾아보세요!
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-3 py-2 text-center">s</th>
                <th className="px-3 py-2 text-center">ζ(s) 근삿값</th>
                <th className="px-3 py-2 text-center">닫힌 꼴 표현</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 9 }, (_, i) => i + 2).map((sv) => {
                const evenRow = sv % 2 === 0;
                const isCur = sv === s;
                const bg = isCur
                  ? "bg-indigo-500/20 text-indigo-100"
                  : evenRow
                    ? "bg-emerald-500/5"
                    : "bg-amber-500/5";
                return (
                  <tr
                    key={sv}
                    className={"cursor-pointer border-b border-white/5 " + bg}
                    onClick={() => setS(sv)}
                  >
                    <td className="px-3 py-1.5 text-center font-bold">
                      {sv}
                      {evenRow ? " ★" : ""}
                    </td>
                    <td className="px-3 py-1.5 text-center text-slate-200">
                      {PRECOMP[sv].toFixed(6)}
                    </td>
                    <td
                      className={
                        "px-3 py-1.5 text-center font-semibold " +
                        (evenRow ? "text-emerald-300" : "text-amber-300")
                      }
                    >
                      {evenRow ? EXACT[sv] : "닫힌 꼴 없음 🔒"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-slate-300">
          💡 <b className="text-amber-300">발견!</b> 짝수에서는 π 가
          나타나지만, 홀수에서는 닫힌 꼴이 없습니다. ζ(3) ≈ 1.20206 은{" "}
          <b className="text-amber-300">아페리 상수</b>라 불리며, 아직도 완전히
          이해되지 않은 수입니다!
        </div>
      </div>
    </div>
  );
}

// ─── 탭 3: π 퀴즈 ────────────────────────────────────────────
type QuizQ = {
  s: number;
  v: number;
  correct: string;
  opts: string[];
};

const QUIZ_QUESTIONS: QuizQ[] = [
  {
    s: 2,
    v: 1.6449,
    correct: "π² / 6",
    opts: ["π² / 6", "π² / 4", "π² / 3", "π / 6²"],
  },
  {
    s: 4,
    v: 1.0823,
    correct: "π⁴ / 90",
    opts: ["π⁴ / 90", "π⁴ / 45", "π⁴ / 120", "π² / 90"],
  },
  {
    s: 6,
    v: 1.0173,
    correct: "π⁶ / 945",
    opts: ["π⁶ / 945", "π⁶ / 480", "π⁶ / 9450", "π⁶ / 90"],
  },
  {
    s: 8,
    v: 1.0041,
    correct: "π⁸ / 9450",
    opts: ["π⁸ / 945", "π⁸ / 9450", "π⁸ / 4725", "π⁸ / 19440"],
  },
  {
    s: 10,
    v: 1.001,
    correct: "π¹⁰ / 93555",
    opts: ["π¹⁰ / 9450", "π¹⁰ / 93555", "π¹⁰ / 945²", "π¹⁰ / 93500"],
  },
];

function shuffle<T>(arr: T[]): T[] {
  const b = arr.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function QuizTab() {
  const [qList, setQList] = useState<QuizQ[]>(() =>
    shuffle(QUIZ_QUESTIONS).map((q) => ({ ...q, opts: shuffle(q.opts) })),
  );
  const [idx, setIdx] = useState<number>(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [answered, setAnswered] = useState<number>(0);

  function restart() {
    setQList(
      shuffle(QUIZ_QUESTIONS).map((q) => ({ ...q, opts: shuffle(q.opts) })),
    );
    setIdx(0);
    setChosen(null);
    setScore(0);
    setAnswered(0);
  }

  function pick(opt: string) {
    if (chosen != null) return;
    setChosen(opt);
    setAnswered(answered + 1);
    if (opt === qList[idx].correct) setScore(score + 1);
  }

  function next() {
    setIdx(idx + 1);
    setChosen(null);
  }

  const q = qList[idx];
  const correct = chosen === q.correct;
  const done = chosen != null;
  const isLast = idx >= qList.length - 1;
  const finished = done && isLast;
  const progressPct = (idx / qList.length) * 100;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            🎯 짝수의 비밀 — π 퀴즈!
          </h3>
          <span className="rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3 py-1 text-sm font-bold text-indigo-200">
            {score} / {answered}
          </span>
        </div>
        <p className="mb-3 text-xs text-slate-400">
          짝수 s 에 대해 ζ(s) 는 π 의 거듭제곱 식으로 표현됩니다. 올바른 식을
          골라보세요!
        </p>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-indigo-400 transition-all duration-300"
            style={{ width: `${finished ? 100 : progressPct}%` }}
          />
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-center">
          <div className="text-lg font-bold text-white">
            ζ({q.s}) 의 닫힌 꼴은?
          </div>
          <div className="mt-1 text-sm text-slate-400">
            ζ({q.s}) ≈ {q.v.toFixed(4)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {q.opts.map((opt) => {
            let cls =
              "border border-white/10 bg-slate-900 text-slate-200 hover:bg-slate-800";
            if (done) {
              if (opt === q.correct) {
                cls = "border-emerald-400/60 bg-emerald-500/20 text-emerald-200";
              } else if (opt === chosen) {
                cls = "border-rose-400/60 bg-rose-500/20 text-rose-200";
              } else {
                cls = "border-white/10 bg-slate-900/40 text-slate-500";
              }
            }
            return (
              <button
                key={opt}
                type="button"
                disabled={done}
                onClick={() => pick(opt)}
                className={
                  "rounded-md px-3 py-2.5 text-base font-bold transition " +
                  cls +
                  (done ? " cursor-not-allowed" : " cursor-pointer")
                }
              >
                {opt}
              </button>
            );
          })}
        </div>

        {done ? (
          <div
            className={
              "mt-3 rounded-lg p-3 text-sm " +
              (correct
                ? "bg-emerald-500/15 text-emerald-100"
                : "bg-rose-500/15 text-rose-100")
            }
          >
            {correct ? (
              <>🎉 정답! 정수들의 역수 합이 π 로 표현된다니 신기하죠?</>
            ) : (
              <>
                ❌ 틀렸어요. 정답은{" "}
                <b className="text-emerald-300">{q.correct}</b> 입니다!
              </>
            )}
          </div>
        ) : null}

        <div className="mt-4 flex justify-center gap-2">
          {done && !isLast ? (
            <button
              type="button"
              onClick={next}
              className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              다음 문제 →
            </button>
          ) : null}
          {finished ? (
            <>
              <div className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-sm font-bold text-amber-200">
                {score === qList.length
                  ? `🏆 완벽! ${score}/${qList.length} — 오일러도 깜짝 놀랄 실력!`
                  : `최종 점수: ${score}/${qList.length} — 다시 도전해봐요!`}
              </div>
              <button
                type="button"
                onClick={restart}
                className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
              >
                🔄 다시 도전!
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <h3 className="mb-3 text-base font-bold text-white">📐 공식 패턴</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-3 py-2 text-center">s (짝수)</th>
                <th className="px-3 py-2 text-center">ζ(s) 닫힌 꼴</th>
                <th className="px-3 py-2 text-center">분모 패턴</th>
              </tr>
            </thead>
            <tbody>
              <PatternRow s={2} fmt="π² / 6" pattern="6 = 2·3" />
              <PatternRow s={4} fmt="π⁴ / 90" pattern="90 = 2·3²·5" />
              <PatternRow s={6} fmt="π⁶ / 945" pattern="945 = 3³·5·7" />
              <PatternRow s={8} fmt="π⁸ / 9450" pattern="9450 = 2·3³·5²·7" />
              <PatternRow
                s={10}
                fmt="π¹⁰ / 93555"
                pattern="93555 = 3·5·7·11·…(베르누이 수 관련)"
              />
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          분모의 패턴이 복잡해 보이지만, 사실{" "}
          <b className="text-slate-300">베르누이 수(Bernoulli numbers)</b> 라는
          특별한 수열로 통일되게 표현됩니다.
        </p>
      </div>
    </div>
  );
}

function PatternRow({
  s,
  fmt,
  pattern,
}: {
  s: number;
  fmt: string;
  pattern: string;
}) {
  return (
    <tr className="border-b border-white/5 odd:bg-slate-900/20 even:bg-slate-900/40">
      <td className="px-3 py-1.5 text-center font-bold text-slate-100">{s}</td>
      <td className="px-3 py-1.5 text-center text-emerald-300">{fmt}</td>
      <td className="px-3 py-1.5 text-center text-slate-300">{pattern}</td>
    </tr>
  );
}

// ─── 탭 4: 리만 가설 ──────────────────────────────────────────
const ANALYTIC: [number, number][] = [
  [-8, 0],
  [-7, 1 / 240],
  [-6, 0],
  [-5, -1 / 252],
  [-4, 0],
  [-3, 1 / 120],
  [-2, 0],
  [-1, -1 / 12],
  [0, -0.5],
];

function zetaSum(s: number, N: number): number {
  let v = 0;
  for (let n = 1; n <= N; n++) v += Math.pow(n, -s);
  return v;
}

function RiemannTab({ active }: { active: boolean }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <h3 className="mb-2 text-base font-bold text-white">
          🌌 제타함수의 확장 — 실수 전체로!
        </h3>
        <p className="mb-3 text-xs text-slate-400">
          수학자들은 ζ(s) 를 s &gt; 1 의 범위를 넘어 모든 실수, 나아가 복소수까지
          확장했습니다.
        </p>
        <ZetaGraph active={active} />
        <p className="mt-2 text-center text-xs text-slate-400">
          녹색: 수렴 영역 (s &gt; 1) · 보라: 해석적 연속 (s ≤ 0) · 주황 점: 자명한
          영점 (s=−2, −4, −6, …) · 빨간 점선: s=1 (극점, ∞)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-amber-400/40 bg-amber-500/10 p-4">
          <div className="mb-1 text-sm font-bold text-amber-300">
            🟠 자명한 영점 (Trivial Zeros)
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            ζ(s) = 0 이 되는 점 중 이해하기 쉬운 것들:
            <br />
            <b className="text-amber-200">s = −2, −4, −6, −8, …</b>
            <br />
            (음의 짝수에서 모두 0 이 됩니다)
          </p>
        </div>
        <div className="rounded-xl border-2 border-violet-400/40 bg-violet-500/10 p-4">
          <div className="mb-1 text-sm font-bold text-violet-300">
            🟣 비자명 영점 (Non-trivial Zeros)
          </div>
          <p className="text-sm leading-relaxed text-slate-300">
            복소수 영역으로 확장하면 더 신비로운 영점이 나타납니다!
            <br />
            첫 번째:{" "}
            <b className="text-violet-200">½ + 14.135i</b>
            <br />이 영점들의 실수부는 모두 ½ 일까?
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <h3 className="mb-2 text-base font-bold text-white">
          ❓ 리만 가설이란?
        </h3>
        <p className="text-sm leading-7 text-slate-300">
          1859 년 베른하르트 리만은 ζ(s) = 0 이 되는 "비자명 영점"들이
          복소평면에서{" "}
          <b className="text-violet-300">실수부 = ½</b> 인 직선(임계선) 위에
          모두 있다고 추측했습니다.
          <br />
          <br />
          지금까지 컴퓨터로 계산한{" "}
          <b className="text-slate-100">10 조 개 이상의 영점</b> 이 모두 이
          직선 위에 있지만, 아직 아무도 수학적으로{" "}
          <b className="text-slate-100">완전히 증명하지 못했습니다!</b>
        </p>
        <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-500/15 p-3 text-sm font-bold text-amber-200">
          💰 클레이 수학연구소 "밀레니엄 난제" — 증명 시 상금{" "}
          <b className="text-amber-100">$1,000,000 (약 13 억 원)!</b>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <h3 className="mb-2 text-base font-bold text-white">
          🔗 제타함수와 소수의 신비로운 연결
        </h3>
        <p className="text-sm leading-7 text-slate-300">
          오일러 곱공식 (오일러가 발견!):
        </p>
        <div className="my-2 rounded-lg bg-slate-900 p-3 text-center font-mono text-base text-slate-100">
          ζ(s) = <span className="text-cyan-300">Σ 1/nˢ</span> ={" "}
          <span className="text-amber-300">
            Π (소수 p 에 대해) 1 / (1 − 1/pˢ)
          </span>
        </div>
        <p className="text-sm leading-7 text-slate-300">
          이 공식 덕분에 ζ(s) 의 영점이 소수의 분포와 직결됩니다.
          <br />
          리만 가설이 참이라면{" "}
          <b className="text-slate-100">소수의 분포를 매우 정밀하게 예측</b>
          할 수 있습니다. 소수의 비밀이 복소평면의 그 직선에 숨어 있는 것입니다!
          🔑
        </p>
      </div>
    </div>
  );
}

function ZetaGraph({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(360, wrap.clientWidth - 20);
    const H = 210;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const pL = 44,
      pR = 14,
      pT = 16,
      pB = 28;
    const w = W - pL - pR;
    const h = H - pT - pB;
    const sMin = -9,
      sMax = 10.5;
    const yMin = -2,
      yMax = 2.5;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    const toX = (s: number) => pL + ((s - sMin) / (sMax - sMin)) * w;
    const toY = (v: number) => pT + (1 - (v - yMin) / (yMax - yMin)) * h;
    const clip = (v: number) => Math.max(yMin, Math.min(yMax, v));

    // 격자
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let yv = yMin; yv <= yMax; yv += 0.5) {
      const py = toY(yv);
      ctx.beginPath();
      ctx.moveTo(pL, py);
      ctx.lineTo(pL + w, py);
      ctx.stroke();
      if (yv === Math.round(yv)) {
        ctx.fillStyle = "#475569";
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        ctx.fillText(String(yv), pL - 3, py + 4);
      }
    }
    for (let sv = sMin; sv <= sMax; sv += 2) {
      const px = toX(sv);
      ctx.beginPath();
      ctx.moveTo(px, pT);
      ctx.lineTo(px, pT + h);
      ctx.stroke();
      ctx.fillStyle = "#475569";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(sv), px, pT + h + 16);
    }

    // x축
    const y0 = toY(0);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pL, y0);
    ctx.lineTo(pL + w, y0);
    ctx.stroke();

    // 수렴 영역 (s > 1.1): 녹색 실선
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let si = 110; si <= 1050; si += 5) {
      const s = si / 100;
      const v = clip(zetaSum(s, 2000));
      const x = toX(s);
      const y = toY(v);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 해석적 연속 (s ≤ 0): 보라 점선
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 2;
    ctx.beginPath();
    started = false;
    ANALYTIC.forEach(([s, v]) => {
      const x = toX(s);
      const y = toY(clip(v));
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // s = 1 극점 (빨간 점선)
    const x1 = toX(1);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, pT);
    ctx.lineTo(x1, pT + h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ef4444";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("s=1 (∞)", x1, pT + 10);

    // 자명한 영점 (주황 점)
    [-2, -4, -6, -8].forEach((sz) => {
      const x = toX(sz);
      const y = toY(0);
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde68a";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(sz), x, y - 8);
    });

    // ζ(0) = -1/2
    const x0 = toX(0);
    const y0v = toY(-0.5);
    ctx.fillStyle = "#c084fc";
    ctx.beginPath();
    ctx.arc(x0, y0v, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c084fc";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText("ζ(0)=−½", x0 + 4, y0v + 3);

    // 레이블
    ctx.fillStyle = "#4ade80";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("수렴 영역 (s>1)", toX(2), pT + 14);
    ctx.fillStyle = "#a78bfa";
    ctx.fillText("해석적 연속", toX(-8.5), pT + 14);
  }, [active]);

  return (
    <div ref={wrapRef} className="rounded-lg border border-white/10 p-2">
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── 탭 5: 오일러 곱 ──────────────────────────────────────────
const PRIMES20 = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
];

const GOAL_PCTS = [
  { value: 0.9, label: "ζ(2) 의 90%" },
  { value: 0.95, label: "ζ(2) 의 95%" },
  { value: 0.99, label: "ζ(2) 의 99%" },
  { value: 0.999, label: "ζ(2) 의 99.9%" },
] as const;

function eulerFactor(p: number, s: number): number {
  return 1 / (1 - Math.pow(p, -s));
}

function eulerPartialProd(k: number, s: number): number {
  let v = 1;
  for (let i = 0; i < k; i++) v *= eulerFactor(PRIMES20[i], s);
  return v;
}

function eulerHistoryFor(k: number, s: number): number[] {
  const out = [1];
  for (let i = 1; i <= k; i++) out.push(eulerPartialProd(i, s));
  return out;
}

function EulerTab({ active }: { active: boolean }) {
  const [s, setS] = useState<number>(2);
  const [k, setK] = useState<number>(0);
  const history = useMemoHistory(k, s);

  function addOne() {
    if (k < PRIMES20.length) setK(k + 1);
  }
  function addAll() {
    setK(PRIMES20.length);
  }
  function reset() {
    setK(0);
  }
  function onSliderS(newS: number) {
    setS(newS);
  }

  const prod = history[k];
  const trueVal = PRECOMP[s];
  const primesUsed = k === 0 ? "소수 없음" : PRIMES20.slice(0, k).join(", ");

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <h3 className="mb-2 text-base font-bold text-white">
          ✖️ 오일러 곱공식 — 소수가 ζ(s) 를 만든다!
        </h3>
        <p className="mb-3 text-xs text-slate-400">
          ζ(s) 는 놀랍게도 <b>소수들의 곱</b>으로 표현돼요! 소수를 하나씩
          추가하며 ζ(s) 에 가까워지는 과정을 관찰해보세요.
        </p>
        <div className="mb-3 rounded-lg bg-slate-900 p-3 text-center font-mono text-sm leading-8 text-slate-100">
          ζ(s) ={" "}
          <span className="text-cyan-300">
            1/1<sup>s</sup> + 1/2<sup>s</sup> + 1/3<sup>s</sup> + …
          </span>{" "}
          ={" "}
          <span className="text-amber-300">
            ∏<sub>p 소수</sub> 1 / (1 − 1/p<sup>s</sup>)
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-300">
            탐험할 s ={" "}
            <span className="text-lg font-extrabold text-amber-300">{s}</span>
          </label>
          <input
            type="range"
            min={2}
            max={6}
            step={1}
            value={s}
            onChange={(e) => onSliderS(Number(e.target.value))}
            className="flex-1 min-w-[150px]"
            aria-label="s"
          />
        </div>
        <p className="mb-3 text-xs text-slate-500">
          s=2 (π²/6) · s=3 (아페리 상수 ≈ 1.202) · s=4 (π⁴/90) · s=5 · s=6
          (π⁶/945)
        </p>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addOne}
            className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            + 소수 1 개 추가
          </button>
          <button
            type="button"
            onClick={addAll}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            20 개까지 →
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-rose-400/40 bg-rose-500/20 px-3 py-1.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/30"
          >
            ↺ 초기화
          </button>
          <span className="ml-2 text-sm font-bold text-slate-300">
            소수 {k} 개
          </span>
        </div>

        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-amber-400/40 bg-amber-500/10 p-4">
            <div className="text-xs text-amber-300">부분 오일러 곱</div>
            <div className="my-1 text-3xl font-extrabold text-amber-200">
              {prod.toFixed(6)}
            </div>
            <div className="text-xs text-amber-300">{primesUsed}</div>
          </div>
          <div className="rounded-xl border-2 border-blue-400/40 bg-blue-500/10 p-4">
            <div className="text-xs text-blue-300">실제 ζ({s})</div>
            <div className="my-1 text-3xl font-extrabold text-blue-200">
              {trueVal.toFixed(6)}
            </div>
            <div className="text-xs text-blue-300">
              차이: {(trueVal - prod).toFixed(6)}
            </div>
          </div>
        </div>

        <EulerChart active={active} history={history} s={s} k={k} />
        <p className="mt-2 text-center text-xs text-slate-400">
          노란선: 부분 오일러 곱 수렴 과정 · 파란점선: ζ(s) 실제값 · 막대: 각
          소수의 기여량
        </p>
      </div>

      <EulerExpandCard k={k} />
      <EulerChallengeCard />
    </div>
  );
}

function useMemoHistory(k: number, s: number): number[] {
  const ref = useRef<{ k: number; s: number; hist: number[] }>({
    k: 0,
    s: 0,
    hist: [1],
  });
  if (ref.current.k !== k || ref.current.s !== s) {
    ref.current = { k, s, hist: eulerHistoryFor(k, s) };
  }
  return ref.current.hist;
}

function EulerExpandCard({ k }: { k: number }) {
  const showK = Math.min(k, 5);
  const rows: { p: number; factor: number; series: string; nums: string }[] = [];
  for (let i = 0; i < showK; i++) {
    const p = PRIMES20[i];
    const f = eulerFactor(p, 2);
    rows.push({
      p,
      factor: f,
      series: `1 + 1/${p}² + 1/${p * p}² + …`,
      nums: `1, ${p}, ${p * p}, ${p * p * p}, …`,
    });
  }
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-2 text-base font-bold text-white">
        🔬 왜 성립할까? — 등비급수와 소인수분해
      </h3>
      <p className="mb-2 text-xs text-slate-400">
        소수 p &gt; 1 이므로 0 &lt; 1/p<sup>s</sup> &lt; 1 → 등비급수 공식 적용
        가능!
      </p>
      <div className="mb-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-200">
        1 / (1 − 1/p<sup>s</sup>) = 1 + 1/p<sup>s</sup> + 1/p<sup>2s</sup> +
        1/p<sup>3s</sup> + …
      </div>
      {showK === 0 ? (
        <p className="text-xs text-slate-500">
          소수를 추가하면 등비급수 전개 표가 나타납니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-3 py-2 text-center">소수 p</th>
                <th className="px-3 py-2 text-center">인수값 (s=2)</th>
                <th className="px-3 py-2 text-center">등비급수 전개</th>
                <th className="px-3 py-2 text-center">포함하는 수</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.p}
                  className={
                    "border-b border-white/5 " +
                    (i % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20")
                  }
                >
                  <td className="px-3 py-1.5 text-center font-bold text-slate-100">
                    {r.p}
                  </td>
                  <td className="px-3 py-1.5 text-center font-bold text-violet-300">
                    {r.factor.toFixed(4)}
                  </td>
                  <td className="px-3 py-1.5 text-center font-mono text-xs text-slate-300">
                    {r.series}
                  </td>
                  <td className="px-3 py-1.5 text-center text-xs text-slate-300">
                    {r.nums}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {k >= 2 ? (
        <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-500/15 p-3 text-sm leading-7 text-slate-200">
          <b className="text-amber-300">🪄 산술기본정리의 마법!</b>
          <br />
          (p=2 의 급수) × (p=3 의 급수) = (1 + 1/4 + 1/16 + …) × (1 + 1/9 +
          1/81 + …)
          <br />
          = 1 + 1/4 + 1/9 + 1/16 + 1/36 + 1/64 + … (2 의 거듭제곱 × 3 의
          거듭제곱으로 만드는 수들)
          <br />
          모든 소수를 곱하면 →{" "}
          <b className="text-amber-300">
            모든 자연수 n 의 1/n² 이 정확히 한 번씩
          </b>{" "}
          등장! (소인수분해의 유일성 덕분!)
        </div>
      ) : null}
    </div>
  );
}

function EulerChallengeCard() {
  const [goalPct, setGoalPct] = useState<number>(0.95);
  const [guess, setGuess] = useState<string>("");
  const [result, setResult] = useState<{
    kind: "ok" | "close" | "far";
    needed: number;
    msg: string;
  } | null>(null);

  function check() {
    const g = parseInt(guess, 10);
    if (Number.isNaN(g) || g < 1 || g > 50) return;
    const target = PRECOMP[2] * goalPct;
    let needed = 0;
    let prod = 1;
    for (let i = 0; i < PRIMES20.length; i++) {
      prod *= eulerFactor(PRIMES20[i], 2);
      needed++;
      if (prod >= target) break;
    }
    const pctStr = (goalPct * 100).toFixed(goalPct < 0.99 ? 0 : 1) + "%";
    const lastP = PRIMES20[needed - 1];
    const diff = Math.abs(g - needed);
    if (diff === 0) {
      setResult({
        kind: "ok",
        needed,
        msg: `🎉 정답! 소수 ${needed}개 (2, 3, …, ${lastP}) 로 ζ(2) 의 ${pctStr} 에 도달!`,
      });
    } else if (diff <= 2) {
      setResult({
        kind: "close",
        needed,
        msg: `😊 아깝! 정답은 ${needed}개의 소수 (마지막: p=${lastP}) 입니다!`,
      });
    } else {
      setResult({
        kind: "far",
        needed,
        msg: `❌ 정답은 ${needed}개의 소수 (마지막: p=${lastP})! ${
          needed < g ? "좀 더 적게" : "좀 더 많이"
        } 필요해요!`,
      });
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-2 text-base font-bold text-white">
        🎮 도전! 몇 개의 소수로 목표에 도달할까?
      </h3>
      <p className="mb-3 text-xs text-slate-400">
        ζ(2) ≈ 1.6449 값의 목표 비율에 도달하려면 소수가{" "}
        <b className="text-slate-200">몇 개</b> 필요할지 예측해보세요!
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="font-semibold text-slate-300">목표:</label>
        <select
          aria-label="목표"
          value={goalPct}
          onChange={(e) => setGoalPct(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-slate-200"
        >
          {GOAL_PCTS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={50}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="예측 개수"
          className="w-24 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-center text-slate-100"
          aria-label="예측 개수"
        />
        <button
          type="button"
          onClick={check}
          className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          확인!
        </button>
      </div>
      {result ? (
        <div
          className={
            "mt-3 rounded-lg p-3 text-center text-sm font-bold " +
            (result.kind === "ok"
              ? "bg-emerald-500/15 text-emerald-100"
              : result.kind === "close"
                ? "bg-amber-500/15 text-amber-100"
                : "bg-rose-500/15 text-rose-100")
          }
        >
          {result.msg}
        </div>
      ) : null}
    </div>
  );
}

function EulerChart({
  active,
  history,
  s,
  k,
}: {
  active: boolean;
  history: number[];
  s: number;
  k: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(320, wrap.clientWidth - 20);
    const H = 200;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const pL = 50,
      pR = 14,
      pT = 16,
      pB = 28;
    const w = W - pL - pR;
    const h = H - pT - pB;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    const trueVal = PRECOMP[s];
    const yMin = 0.9;
    const yMax = trueVal * 1.06;
    const N = history.length;
    const toX = (i: number) =>
      pL + (N > 1 ? i / (N - 1) : 0.5) * w;
    const toY = (v: number) =>
      pT + (1 - (Math.min(v, yMax) - yMin) / (yMax - yMin)) * h;

    // 격자
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let yv = 0.9; yv <= yMax + 0.001; yv = Math.round((yv + 0.1) * 10) / 10) {
      const py = toY(yv);
      if (py < pT || py > pT + h) continue;
      ctx.beginPath();
      ctx.moveTo(pL, py);
      ctx.lineTo(pL + w, py);
      ctx.stroke();
      ctx.fillStyle = "#475569";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(yv.toFixed(1), pL - 3, py + 4);
    }

    // 실제 ζ(s) 점선
    const ty = toY(trueVal);
    if (ty >= pT && ty <= pT + h) {
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(pL, ty);
      ctx.lineTo(pL + w, ty);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      ctx.fillStyle = "#60a5fa";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`ζ(${s})=${trueVal.toFixed(4)}`, pL + 4, ty - 3);
    }

    if (N < 2) {
      ctx.fillStyle = "#475569";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("소수를 추가해보세요!", W / 2, H / 2);
      return;
    }

    // 각 소수 기여 막대
    const bw = Math.max(4, Math.min((w / (N + 1)) * 0.6, 25));
    for (let i = 1; i < N; i++) {
      const x = toX(i);
      const y1 = toY(history[i]);
      const y0 = toY(history[i - 1]);
      ctx.fillStyle = `hsl(${180 + i * 28}, 70%, 60%)`;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(
        x - bw / 2,
        Math.min(y1, y0),
        bw,
        Math.max(Math.abs(y1 - y0), 2),
      );
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("p=" + PRIMES20[i - 1], x, pT + h + 15);
    }

    // 수렴 곡선 (노랑)
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    history.forEach((v, i) => {
      const x = toX(i);
      const y = toY(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 점
    history.forEach((v, i) => {
      const x = toX(i);
      const y = toY(v);
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [active, history, s, k]);

  return (
    <div ref={wrapRef} className="rounded-lg border border-white/10 bg-slate-950 p-2">
      <canvas ref={canvasRef} />
    </div>
  );
}

export { PRECOMP, EXACT, PI_SQ_6, zetaSum, PRIMES20, eulerFactor };
