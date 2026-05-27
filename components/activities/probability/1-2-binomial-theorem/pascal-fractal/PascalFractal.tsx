"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─────────────────────────────────────────────────────────────
//  색상 테마
// ─────────────────────────────────────────────────────────────
type RGB = [number, number, number];
function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}
const RAINBOW_HUES = [0, 30, 60, 120, 180, 240, 270, 300, 330, 350, 15, 45];
const THEMES: Record<string, (v: number, rem: number) => RGB> = {
  blue: (v, rem) => (v === rem ? [0, 102, 204] : [230, 230, 230]),
  gold: (v, rem) => (v === rem ? [245, 158, 11] : [30, 30, 50]),
  rainbow: (v) => hslToRgb(RAINBOW_HUES[v % RAINBOW_HUES.length] / 360, 0.7, 0.55),
  neon: (v, rem) => (v === rem ? [57, 255, 20] : [10, 20, 10]),
};
const THEME_OPTIONS: { value: string; label: string }[] = [
  { value: "blue", label: "파란 점 (기본)" },
  { value: "gold", label: "황금 & 회색" },
  { value: "rainbow", label: "무지개 (나머지별 색)" },
  { value: "neon", label: "네온 그린" },
];

const PRESETS: { m: number; label: string }[] = [
  { m: 2, label: "mod 2 — 시에르핀스키" },
  { m: 3, label: "mod 3" },
  { m: 5, label: "mod 5" },
  { m: 7, label: "mod 7 (소수)" },
  { m: 4, label: "mod 4 (합성수)" },
];

const PRIMES = new Set([2, 3, 5, 7, 11]);
const OBS_MAP: Record<string, string> = {
  "2_0": "짝수 원소만 색칠 → 대부분 빈 공간. 나머지 r=1(홀수)로 바꿔보세요!",
  "2_1": "시에르핀스키 삼각형! 홀수인 이항계수만 색칠하면 자기유사 삼각형이 나타납니다. 뤼카 정리로 설명됩니다.",
  "3_0": "mod 3에서 r=0: 3의 배수인 원소 위치. 삼각형 안에 작은 빈 삼각형이 반복됩니다.",
  "3_1": "mod 3, r=1: 세 나머지 중 하나. 프랙털 서브삼각형 구조를 확인하세요.",
  "3_2": "mod 3, r=2: 나머지가 2인 원소들도 프랙털 패턴을 형성합니다.",
};
function obsText(mod: number, rem: number): string {
  return (
    OBS_MAP[`${mod}_${rem}`] ||
    (PRIMES.has(mod)
      ? "소수 mod일 때 규칙적인 격자 패턴(뤼카 정리). 합성수 mod보다 패턴이 선명합니다."
      : "합성수 mod: 소수 mod보다 패턴이 불규칙적입니다. mod 4 와 mod 5 를 비교해보세요!")
  );
}

const CANVAS_H = 640;
const BASE = 60;

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "sierpinski_why",
    prompt:
      "mod 2, r=1로 색칠하면 시에르핀스키 삼각형이 나타납니다. 홀수인 이항계수만 색칠했을 때 자기유사(프랙털) 패턴이 생기는 까닭을, 파스칼 법칙의 홀짝(또는 뤼카 정리)으로 설명해 보세요.",
    kind: "text",
  },
  {
    id: "prime_vs_composite",
    prompt:
      "소수 mod(2·3·5·7)와 합성수 mod(4·6)의 패턴 규칙성 차이를 관찰하고, 왜 소수일 때 더 규칙적인지 설명해 보세요.",
    kind: "text",
  },
];

// ── 확인 퀴즈 ──
type QuizItem = { q: string; choices: string[]; answer: number; explain: string };
const QUIZ: QuizItem[] = [
  {
    q: "파스칼 삼각형의 각 원소를 mod 2 (2로 나눈 나머지)로 색칠할 때 나타나는 프랙털 도형은?",
    choices: ["코흐 눈송이", "망델브로트 집합", "시에르핀스키 삼각형", "칸토어 집합"],
    answer: 2,
    explain: "mod 2로 색칠하면 홀수 위치가 3등분 삼각형 구조로 반복되며 시에르핀스키 삼각형이 나타납니다.",
  },
  {
    q: "mod 3으로 색칠할 때 관찰되는 패턴은?",
    choices: ["완전히 랜덤한 점들", "세 개의 자기유사 삼각형이 반복되는 카펫 패턴", "직선 줄무늬", "원 모양의 패턴"],
    answer: 1,
    explain: "mod 3에서는 시에르핀스키 삼각형이 3색으로 나뉩니다. 각 수준마다 self-similar한 삼각형 구조가 세 배씩 분기됩니다.",
  },
  {
    q: "프랙털(fractal)의 핵심 특성은?",
    choices: ["단순한 직선 구조", "확대할수록 형태가 사라짐", "자기 유사성: 일부를 확대하면 전체와 닮은 패턴이 반복됨", "오직 컴퓨터로만 만들 수 있는 형태"],
    answer: 2,
    explain: "프랙털의 핵심은 자기 유사성(self-similarity)입니다. 확대해도 비슷한 패턴이 반복되며, 파스칼 삼각형의 mod 색칠이 바로 이 성질을 가집니다.",
  },
];

function Kpi({ num, lbl }: { num: number | string; lbl: string }) {
  return (
    <div className="min-w-[90px] flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center">
      <div className="text-2xl font-black text-slate-100">{num}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{lbl}</div>
    </div>
  );
}

export default function PascalFractal() {
  const [mod, setMod] = useState(2);
  const [rem, setRem] = useState(0);
  const [scale, setScale] = useState(4);
  const [theme, setTheme] = useState("blue");
  const [quiz, setQuiz] = useState<(number | null)[]>(() => new Array(QUIZ.length).fill(null));

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [width, setWidth] = useState(700);

  useEffect(() => {
    const measure = () => { if (wrapRef.current) setWidth(wrapRef.current.clientWidth); };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // 잔여값 삼각형(파스칼 점화식 mod m — BigInt 불필요)
  const sim = useMemo(() => {
    const spacing = BASE / scale;
    const rows = Math.max(1, Math.floor((CANVAS_H - 20) / spacing));
    const res: number[][] = [];
    let dots = 0;
    for (let n = 0; n < rows; n++) {
      res[n] = [];
      for (let k = 0; k <= n; k++) {
        const v = k === 0 || k === n ? 1 % mod : (res[n - 1][k - 1] + res[n - 1][k]) % mod;
        res[n][k] = v;
        if (v === rem) dots++;
      }
    }
    return { rows, res, dots, spacing };
  }, [mod, rem, scale]);

  // 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = width;
    canvas.height = CANVAS_H;
    ctx.fillStyle = "#0a1628";
    ctx.fillRect(0, 0, width, CANVAS_H);

    const { rows, res, spacing } = sim;
    const pal = THEMES[theme] ?? THEMES.blue;
    const textMode = spacing >= 20;
    // 텍스트 모드는 행 수가 적어(≤31) 값이 2^53 안에 들어가므로 일반 number 로 충분.
    let vals: number[][] | null = null;
    if (textMode) {
      vals = [];
      for (let n = 0; n < rows; n++) {
        vals[n] = [];
        for (let k = 0; k <= n; k++) vals[n][k] = k === 0 || k === n ? 1 : vals[n - 1][k - 1] + vals[n - 1][k];
      }
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const rad = spacing * 0.325;
    for (let n = 0; n < rows; n++) {
      for (let k = 0; k <= n; k++) {
        const [r, g, b] = pal(res[n][k], rem);
        const x = width / 2 + (k - n / 2) * spacing;
        const y = n * spacing + 14;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, 2 * Math.PI);
        ctx.fill();
        if (textMode && vals) {
          ctx.fillStyle = "#fff";
          ctx.font = `${spacing * 0.28}px system-ui, sans-serif`;
          ctx.fillText(vals[n][k].toString(), x, y);
        }
      }
    }
  }, [sim, theme, width, rem]);

  function applyPreset(m: number) {
    setMod(m);
    setRem(0);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 이항정리</p>
        <h3 className="mt-2 text-2xl font-bold">🔺 파스칼 삼각형 속 프랙털</h3>
        <p className="mt-2 leading-7 text-slate-300">
          파스칼 삼각형의 각 항을 <b className="text-amber-300">mod m</b>(m으로 나눈 나머지)로 색칠하면 놀라운{" "}
          <b className="text-amber-300">프랙털 패턴</b>이 나타납니다. modulo와 나머지를 바꾸며 탐구해 보세요!
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900 p-4">
        <p className="text-sm font-bold text-amber-300">⚙️ 설정</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-mod" className="text-xs font-semibold uppercase tracking-wide text-slate-400">modulo m = <span className="text-amber-300">{mod}</span></label>
            <input id="pf-mod" type="range" min={2} max={12} value={mod}
              onChange={(e) => { const m = Number(e.target.value); setMod(m); if (rem >= m) setRem(0); }}
              className="mt-1 w-full accent-amber-400" />
          </div>
          <div>
            <label htmlFor="pf-rem" className="text-xs font-semibold uppercase tracking-wide text-slate-400">나머지 r = <span className="text-amber-300">{rem}</span></label>
            <input id="pf-rem" type="range" min={0} max={mod - 1} value={rem}
              onChange={(e) => setRem(Number(e.target.value))} className="mt-1 w-full accent-amber-400" />
          </div>
          <div>
            <label htmlFor="pf-scale" className="text-xs font-semibold uppercase tracking-wide text-slate-400">확대 배율 = <span className="text-amber-300">{scale}</span></label>
            <input id="pf-scale" type="range" min={1} max={20} step={0.5} value={scale}
              onChange={(e) => setScale(Number(e.target.value))} className="mt-1 w-full accent-amber-400" />
          </div>
          <div>
            <label htmlFor="pf-theme" className="text-xs font-semibold uppercase tracking-wide text-slate-400">색상 테마</label>
            <select id="pf-theme" value={theme} onChange={(e) => setTheme(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/15 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40">
              {THEME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">⚡ 프리셋</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {PRESETS.map((pr) => {
            const active = mod === pr.m && rem === 0;
            return (
              <button key={pr.m} type="button" onClick={() => applyPreset(pr.m)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-amber-400/50 bg-amber-400/20 text-amber-200" : "border-white/15 bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                {pr.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Kpi num={mod} lbl="modulo" />
          <Kpi num={rem} lbl="나머지(r)" />
          <Kpi num={sim.rows} lbl="표시 행 수" />
          <Kpi num={sim.dots.toLocaleString()} lbl="칠해진 원소" />
        </div>
      </div>

      {/* 캔버스 */}
      <div ref={wrapRef} className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <canvas ref={canvasRef} className="block w-full" />
      </div>

      {/* 관찰 포인트 */}
      <div className="mt-4 rounded-2xl border border-indigo-400/25 bg-indigo-400/10 p-4">
        <p className="text-sm font-bold text-indigo-300">🔬 관찰 포인트</p>
        <p className="mt-1.5 text-sm leading-7 text-indigo-100/90">{obsText(mod, rem)}</p>
      </div>

      {/* 탐구 활동 */}
      <div className="mt-4 space-y-2">
        <details open className="rounded-2xl border border-white/10 bg-slate-900 p-4">
          <summary className="cursor-pointer text-sm font-bold text-amber-300">📐 탐구 1: 시에르핀스키 삼각형과 이항계수</summary>
          <div className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
            <p>시에르핀스키 삼각형은 자기유사성(self-similarity)을 가진 가장 유명한 프랙털 중 하나입니다.</p>
            <p>① 시뮬레이터에서 <b className="text-amber-300">mod = 2, r = 1</b>로 설정 → 홀수인 이항계수만 색칠되며 시에르핀스키 삼각형이 나타납니다.<br />② 확대 배율을 높여 더 많은 행을 보면 패턴이 무한히 반복됨을 확인할 수 있습니다.</p>
            <div className="rounded-lg border-l-2 border-indigo-400 bg-white/5 p-3">
              <p className="font-bold text-indigo-300">핵심 원리 (뤼카 정리)</p>
              <p className="mt-1">소수 p에 대해 <Katex expr="{}_{n}C_{k} \equiv \prod_{i} {}_{n_i}C_{k_i} \pmod{p}" /></p>
              <p className="mt-1">여기서 nᵢ, kᵢ는 n, k의 p진법 각 자리수이며, k의 어느 자리가 n의 대응 자리보다 크면 ₙCₖ ≡ 0이 됩니다.</p>
            </div>
          </div>
        </details>

        <details className="rounded-2xl border border-white/10 bg-slate-900 p-4">
          <summary className="cursor-pointer text-sm font-bold text-amber-300">🔢 탐구 2: 소수 mod vs 합성수 mod 비교</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="border border-white/10 px-3 py-2 text-left">설정</th>
                  <th className="border border-white/10 px-3 py-2 text-left">패턴 특성</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  ["mod 2 (소수)", "매우 규칙적인 시에르핀스키 삼각형"],
                  ["mod 3 (소수)", "3색 자기유사 삼각형 패턴"],
                  ["mod 5 (소수)", "5배 분기되는 정교한 격자"],
                  ["mod 4 (합성수)", "mod 2·2 이어서 패턴이 불규칙"],
                  ["mod 6 (합성수)", "mod 2·3 혼합 → 복잡한 패턴"],
                ].map(([a, b], i) => (
                  <tr key={i}>
                    <td className="border border-white/10 px-3 py-2 font-semibold text-amber-200">{a}</td>
                    <td className="border border-white/10 px-3 py-2">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-sm leading-7 text-slate-300">소수 mod와 합성수 mod를 번갈아 설정하며 비교해 보세요. 소수일 때 왜 더 규칙적인지 <b className="text-amber-300">뤼카 정리</b>와 연결해 생각해 보세요.</p>
          </div>
        </details>

        <details className="rounded-2xl border border-white/10 bg-slate-900 p-4">
          <summary className="cursor-pointer text-sm font-bold text-amber-300">🌀 탐구 3: 프랙털 차원 느껴보기</summary>
          <div className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
            <p>프랙털은 비정수 차원(Hausdorff dimension)을 가집니다. 시에르핀스키 삼각형의 차원 D는:</p>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <Katex display expr="D = \frac{\ln 3}{\ln 2} \approx 1.585" />
            </div>
            <p>① 배율을 키워가며 배율이 2배 될 때마다 점의 수가 대략 몇 배가 되는지 세어 보세요.<br />② 약 3배가 된다면 <Katex expr="D = \log_2 3 \approx 1.585" /> 임을 확인할 수 있습니다.<br />③ mod 3 패턴에서도 비슷하게 계산하면? (힌트: <Katex expr="\frac{\ln 6}{\ln 3}" />)</p>
          </div>
        </details>
      </div>

      {/* 확인 퀴즈 */}
      <div className="mt-4 space-y-3">
        <p className="text-sm font-bold text-cyan-300">📝 확인 퀴즈</p>
        {QUIZ.map((q, qi) => {
          const picked = quiz[qi];
          const done = picked !== null;
          const isCorrect = done && picked === q.answer;
          return (
            <div key={qi} className={`rounded-xl border-2 bg-slate-900 p-4 ${!done ? "border-transparent" : isCorrect ? "border-emerald-600" : "border-red-600"}`}>
              <p className="text-sm font-semibold leading-6 text-slate-100">Q{qi + 1}. {q.q}</p>
              <div className="mt-2 flex flex-col gap-1.5">
                {q.choices.map((ch, ci) => {
                  const showAns = done && ci === q.answer;
                  const showWrong = done && ci === picked && ci !== q.answer;
                  const cls = showAns ? "border-emerald-500 bg-emerald-950 text-emerald-200"
                    : showWrong ? "border-red-500 bg-red-950 text-red-300"
                    : "border-white/12 bg-slate-950 text-slate-300 hover:border-amber-400/50 hover:bg-amber-400/[0.06]";
                  return (
                    <button key={ci} type="button" disabled={done}
                      onClick={() => { if (picked === null) setQuiz((prev) => prev.map((v, i) => (i === qi ? ci : v))); }}
                      className={`rounded-lg border px-3 py-1.5 text-left text-sm transition disabled:cursor-default ${cls}`}>
                      {showAns ? "✅ " : showWrong ? "❌ " : ""}{ch}
                    </button>
                  );
                })}
              </div>
              {done ? (
                <p className={`mt-2 rounded-md px-2.5 py-1.5 text-sm leading-6 ${isCorrect ? "bg-emerald-950 text-emerald-200" : "bg-red-950 text-red-300"}`}>
                  {isCorrect ? "🎉 정답! " : "아쉽게도 틀렸습니다. "}{q.explain}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
