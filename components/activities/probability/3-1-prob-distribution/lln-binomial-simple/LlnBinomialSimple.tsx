"use client";

import { useId, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 헬퍼 ─────────────────────────────────────────────────
function getColor(i: number, m: number, alpha = 0.75): string {
  const hue = (i / Math.max(m - 1, 1)) * 300; // 0(빨강)~300(보라)
  return `hsla(${hue},85%,65%,${alpha})`;
}

function makeCheckpoints(n: number, maxCols: number): number[] {
  if (n <= maxCols) return Array.from({ length: n }, (_, i) => i + 1);
  const step = Math.ceil(n / maxCols);
  const pts: number[] = [];
  for (let k = step; k <= n; k += step) pts.push(k);
  if (pts[pts.length - 1] !== n) {
    pts.pop();
    pts.push(n);
  }
  return pts.slice(0, maxCols);
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "lln_meaning",
    prompt:
      "큰 수의 법칙 lim(n→∞) P(|X/n − p| < h) = 1 이 무엇을 뜻하는지, 시뮬레이션 경험을 바탕으로 설명해 보세요.",
    kind: "text",
    placeholder: "예: n이 커질수록 상대도수 X/n이 수학적 확률 p로부터 h 이상 벗어날 확률이 0에 가까워진다.",
  },
  {
    id: "h_and_n_effect",
    prompt:
      "h(허용 오차)나 n(시행 횟수)을 바꿨을 때 ‘범위 안 비율’이 어떻게 달라졌나요? 직접 본 추세를 적어 보세요.",
    kind: "text",
    placeholder: "예: h를 크게 하면 범위 안 비율이 빨리 100%에 가까워지고, n=20일 땐 들쭉날쭉하지만 n=500이 되면 거의 모든 반복이 h 안에 들어왔다.",
  },
  {
    id: "real_life",
    prompt:
      "큰 수의 법칙이 실생활에서 활용되는 사례를 2가지 이상 적어 보세요.",
    kind: "text",
    placeholder: "예: 보험료 산정(많은 가입자의 평균 손실로 미래 손실 예측), 여론조사(표본을 충분히 키워 모집단 의견 비율 추정).",
  },
];

type Path = Float32Array;
type SimResult = {
  paths: Path[];
  p: number;
  h: number;
  n: number;
  m: number;
  inside: number;
};

// 초기화 버튼이 되돌릴 슬라이더 기본값. useState 초기치와 단일 출처로 공유.
const DEFAULTS = { pPct: 50, hPct: 10, n: 100, m: 15 };

// ─── 메인 ─────────────────────────────────────────────────
export default function LlnBinomialSimple() {
  // 슬라이더(정수 백분율 또는 정수값으로 저장)
  const [pPct, setPPct] = useState(DEFAULTS.pPct);
  const [hPct, setHPct] = useState(DEFAULTS.hPct);
  const [n, setN] = useState(DEFAULTS.n);
  const [m, setM] = useState(DEFAULTS.m);
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);

  function resetSettings() {
    if (running) return;
    setPPct(DEFAULTS.pPct);
    setHPct(DEFAULTS.hPct);
    setN(DEFAULTS.n);
    setM(DEFAULTS.m);
    setResult(null);
  }

  const p = pPct / 100;
  const h = hPct / 100;

  function runSim() {
    if (running) return;
    setRunning(true);
    // setTimeout 0 으로 다음 tick 에 실행 → 버튼 disable 가 한 프레임 먼저 반영
    window.setTimeout(() => {
      const paths: Path[] = [];
      let inside = 0;
      for (let i = 0; i < m; i++) {
        let heads = 0;
        const path = new Float32Array(n);
        for (let k = 0; k < n; k++) {
          if (Math.random() < p) heads += 1;
          path[k] = heads / (k + 1);
        }
        paths.push(path);
        if (Math.abs(path[n - 1] - p) < h) inside += 1;
      }
      setResult({ paths, p, h, n, m, inside });
      setRunning(false);
    }, 16);
  }

  const ratio = result ? result.inside / result.m : null;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">🔬 큰 수의 법칙 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          n번 독립시행에서 상대도수 X/n의 궤적을 m번 반복해 색을 달리해 그려보면서{" "}
          <b className="text-amber-300">큰 수의 법칙</b>을 직접 체험합니다.
        </p>

        <div className="mt-4 rounded-xl border-2 border-amber-400/40 bg-slate-900/60 px-4 py-3 text-center">
          <p className="text-xs leading-relaxed text-slate-400">
            사건 A의 확률이 <i>p</i>일 때, <i>n</i>번 독립시행에서 A가 일어난 횟수를 <i>X</i>라 하면,
            임의의 양수 <i>h</i>에 대하여
          </p>
          <p className="mt-1 font-mono text-base font-bold italic text-amber-200">
            lim<sub>n→∞</sub> P( | <sup>X</sup>⁄<sub>n</sub> − p | &lt; h ) = 1
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            X/n : 상대도수(통계적 확률) · p : 수학적 확률 · h : 임의의 양수
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* 왼쪽 컨트롤 */}
        <div className="space-y-3">
          <SymbolRow />

          <RangeRow label="수학적 확률 p" value={pPct} display={p.toFixed(2)} min={10} max={90} step={5} onChange={setPPct} tone="orange" />
          <RangeRow label="허용 오차 h" value={hPct} display={h.toFixed(2)} min={2} max={30} step={1} onChange={setHPct} tone="violet" />
          <RangeRow label="시행 횟수 n" value={n} display={String(n)} min={10} max={500} step={5} onChange={setN} tone="cyan" />
          <RangeRow label="반복 횟수 m" value={m} display={String(m)} min={1} max={30} step={1} onChange={setM} tone="green" />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={runSim}
              disabled={running}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2.5 text-sm font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? "⏳ 계산 중…" : "▶ 시뮬레이션 실행"}
            </button>
            <button
              type="button"
              onClick={resetSettings}
              disabled={running}
              title={`설정 초기화 (p=${(DEFAULTS.pPct / 100).toFixed(2)}, h=${(DEFAULTS.hPct / 100).toFixed(2)}, n=${DEFAULTS.n}, m=${DEFAULTS.m})`}
              className="rounded-xl border border-slate-500 bg-slate-800 px-3 py-2.5 text-sm font-bold text-slate-100 transition hover:border-slate-300 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↺ 초기화
            </button>
          </div>

          {result && ratio !== null ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">h 안 반복</p>
                <p className="mt-0.5 text-2xl font-black text-emerald-300">{result.inside}</p>
                <p className="text-[10px] text-slate-500">/ {result.m} 회</p>
              </div>
              <div className="rounded-xl border-2 border-indigo-400/45 bg-indigo-400/10 p-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">범위 안 비율</p>
                <p className="mt-0.5 bg-gradient-to-r from-indigo-200 to-cyan-300 bg-clip-text text-2xl font-black text-transparent">
                  {(ratio * 100).toFixed(1)}%
                </p>
                <p className="text-[10px] text-slate-500">≈ P(|X/n−p|&lt;h)</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* 오른쪽 차트 */}
        <div>
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-2">
            <PathsChartSVG result={result} fallback={{ p, h, n, m }} />
          </div>
          {result ? (
            <div className="mt-2 flex flex-wrap gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <svg width={20} height={2} className="block"><line x1={0} y1={1} x2={20} y2={1} stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 3" /></svg>
                수학적 확률 p
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-4 rounded-sm border border-violet-400/50 bg-violet-400/35" />
                ±h 허용 범위
              </span>
              <span>각 색상 = 반복 1회 (X/n 궤적)</span>
            </div>
          ) : null}
        </div>
      </div>

      {result ? (
        <>
          {/* 반복별 테이블 */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-base font-bold text-slate-200">📋 반복별 상대도수 X/n 기록</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              각 셀: 해당 시행 횟수 k에서의 상대도수 X<sub>k</sub>/k |{" "}
              <span className="font-bold text-emerald-300">■ 초록</span> = h 범위 안 (|X/n−p| &lt; h) |{" "}
              <span className="font-bold text-rose-300">■ 빨강</span> = 범위 밖 |{" "}
              <span className="font-bold text-amber-300">★ 노랑</span> = 처음으로 범위 안 진입한 n
            </p>
            <RepetitionTable result={result} />
          </div>

          {/* 인사이트 */}
          <Insight result={result} />
        </>
      ) : null}

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 기호 카드 ────────────────────────────────────────────
function SymbolRow() {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      <div className="rounded-md border-l-4 border-amber-400 bg-amber-400/[0.08] px-2 py-1.5 text-center">
        <p className="font-mono text-base font-black text-amber-300">p</p>
        <p className="text-[10px] leading-tight text-slate-400">수학적<br />확률</p>
      </div>
      <div className="rounded-md border-l-4 border-cyan-400 bg-cyan-400/[0.08] px-2 py-1.5 text-center">
        <p className="font-mono text-base font-black text-cyan-300">X/n</p>
        <p className="text-[10px] leading-tight text-slate-400">상대도수<br />(실험값)</p>
      </div>
      <div className="rounded-md border-l-4 border-violet-400 bg-violet-400/[0.08] px-2 py-1.5 text-center">
        <p className="font-mono text-base font-black text-violet-300">h</p>
        <p className="text-[10px] leading-tight text-slate-400">허용<br />오차</p>
      </div>
    </div>
  );
}

// ─── 슬라이더 ─────────────────────────────────────────────
function RangeRow({
  label, value, display, min, max, step, onChange, tone,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  tone: "orange" | "violet" | "cyan" | "green";
}) {
  const id = useId();
  const accent =
    tone === "orange" ? "accent-amber-500"
    : tone === "violet" ? "accent-violet-500"
    : tone === "cyan" ? "accent-cyan-500"
    : "accent-emerald-500";
  // 전자칠판 등 저대비 디스플레이에서도 읽히도록 밝은 솔리드 배경 + 어두운 글자.
  const badge =
    tone === "orange" ? "bg-amber-300 text-slate-900"
    : tone === "violet" ? "bg-violet-300 text-slate-900"
    : tone === "cyan" ? "bg-cyan-300 text-slate-900"
    : "bg-emerald-300 text-slate-900";
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex items-center justify-between text-xs font-bold text-slate-300">
        <span>{label}</span>
        <span
          key={display}
          className={`min-w-[44px] animate-[pulseR_0.3s_ease] rounded-md px-2 py-0.5 text-center font-mono text-sm font-extrabold ${badge}`}
        >
          {display}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-1.5 w-full cursor-pointer rounded-full ${accent} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40`}
      />
    </div>
  );
}

// ─── 차트 ─────────────────────────────────────────────────
function PathsChartSVG({
  result, fallback,
}: {
  result: SimResult | null;
  fallback: { p: number; h: number; n: number; m: number };
}) {
  const W = 720, H = 320;
  const PAD = { top: 22, right: 58, bottom: 44, left: 48 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  // 표시용: result 없으면 fallback의 p, h만 보임
  const p = result?.p ?? fallback.p;
  const h = result?.h ?? fallback.h;
  const n = result?.n ?? fallback.n;
  const m = result?.m ?? fallback.m;

  function toX(k: number) {
    return PAD.left + (k / Math.max(n - 1, 1)) * cW;
  }
  function toY(v: number) {
    return PAD.top + (1 - Math.max(0, Math.min(1, v))) * cH;
  }

  const yTop = toY(Math.min(1, p + h));
  const yBot = toY(Math.max(0, p - h));
  const yP = toY(p);
  const step = n > 200 ? Math.ceil(n / 200) : 1;

  // 궤적 path 데이터 생성
  const pathStrings = result
    ? result.paths.map((path, i) => {
        const parts: string[] = [];
        parts.push(`M ${toX(0)} ${toY(path[0])}`);
        for (let k = step; k < n; k += step) parts.push(`L ${toX(k)} ${toY(path[k])}`);
        if ((n - 1) % step !== 0) parts.push(`L ${toX(n - 1)} ${toY(path[n - 1])}`);
        return { d: parts.join(" "), color: getColor(i, m, 0.75), endX: toX(n - 1), endY: toY(path[n - 1]), isIn: Math.abs(path[n - 1] - p) < h };
      })
    : [];

  const ticks = [1, Math.round(n / 4), Math.round(n / 2), Math.round((3 * n) / 4), n];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="X/n 궤적 차트">
      <rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0.2)" />

      {/* y 격자 */}
      {[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => {
        const yy = toY(v);
        return (
          <g key={v}>
            <line x1={PAD.left} y1={yy} x2={PAD.left + cW} y2={yy} stroke="rgba(255,255,255,0.055)" />
            <text x={PAD.left - 5} y={yy + 4} textAnchor="end" fontSize={11} fill="rgba(100,116,139,1)">
              {v.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* ±h 띠 */}
      <rect x={PAD.left} y={yTop} width={cW} height={Math.max(0, yBot - yTop)} fill="rgba(99,102,241,0.1)" />
      <line x1={PAD.left} y1={yTop} x2={PAD.left + cW} y2={yTop} stroke="rgba(167,139,250,0.5)" strokeDasharray="5 4" />
      <line x1={PAD.left} y1={yBot} x2={PAD.left + cW} y2={yBot} stroke="rgba(167,139,250,0.5)" strokeDasharray="5 4" />

      {/* 궤적 */}
      {pathStrings.map((ps, i) => (
        <g key={i}>
          <path d={ps.d} fill="none" stroke={ps.color} strokeWidth={1.5} />
          <circle cx={ps.endX} cy={ps.endY} r={4} fill={ps.isIn ? "rgba(74,222,128,0.9)" : "rgba(248,113,113,0.9)"} />
        </g>
      ))}

      {/* p 기준선 */}
      <line x1={PAD.left} y1={yP} x2={PAD.left + cW} y2={yP} stroke="#fbbf24" strokeWidth={2} strokeDasharray="7 4" />

      {/* x축 눈금 */}
      <line x1={PAD.left} y1={PAD.top + cH} x2={PAD.left + cW} y2={PAD.top + cH} stroke="rgba(255,255,255,0.15)" />
      {ticks.map((k) => {
        const xx = toX(k - 1);
        return (
          <text key={k} x={xx} y={PAD.top + cH + 16} textAnchor="middle" fontSize={11} fill="rgba(100,116,139,1)">
            {k}
          </text>
        );
      })}
      <text x={PAD.left + cW / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="rgba(148,163,184,1)">
        시행 횟수 n
      </text>

      {/* y축 제목 */}
      <text
        x={13}
        y={PAD.top + cH / 2}
        textAnchor="middle"
        fontSize={11}
        fill="rgba(148,163,184,1)"
        transform={`rotate(-90 13 ${PAD.top + cH / 2})`}
      >
        상대도수 X/n
      </text>

      {/* 우측 라벨 */}
      <text x={PAD.left + cW + 5} y={yP + 4} fontSize={11} fontWeight={700} fill="#fbbf24">
        p={p.toFixed(2)}
      </text>
      <text x={PAD.left + cW + 5} y={yTop + 4} fontSize={10} fill="rgba(165,180,252,1)">
        p+h
      </text>
      <text x={PAD.left + cW + 5} y={yBot + 4} fontSize={10} fill="rgba(165,180,252,1)">
        p−h
      </text>

      {/* 빈 상태 안내 */}
      {!result ? (
        <text x={PAD.left + cW / 2} y={PAD.top + cH / 2} textAnchor="middle" fontSize={13} fill="rgba(100,116,139,1)">
          ▶ 시뮬레이션 실행 버튼을 눌러 X/n 궤적을 그려 보세요
        </text>
      ) : null}
    </svg>
  );
}

// ─── 반복별 체크포인트 테이블 ─────────────────────────────
function RepetitionTable({ result }: { result: SimResult }) {
  const { paths, p, h, n, m } = result;
  const checkpoints = makeCheckpoints(n, 12);
  // 마지막 열을 항상 n 으로(중복이면 추가하지 않음).
  const cols = checkpoints[checkpoints.length - 1] === n ? checkpoints : [...checkpoints, n];

  // 각 열별 h 범위 안 개수
  const colInCount = cols.map(() => 0);
  paths.forEach((path) => {
    cols.forEach((k, ci) => {
      if (Math.abs(path[k - 1] - p) < h) colInCount[ci] += 1;
    });
  });

  // 반복별 처음 진입 열 ci
  function firstInCi(path: Path): number {
    for (let ci = 0; ci < cols.length; ci++) {
      if (Math.abs(path[cols[ci] - 1] - p) < h) return ci;
    }
    return -1;
  }

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-white/10 bg-indigo-500/15 px-2 py-1.5 text-indigo-200">반복</th>
            {cols.map((k, ci) => (
              <th key={ci} className="border border-white/10 bg-indigo-500/15 px-2 py-1.5 text-indigo-200">n={k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paths.map((path, i) => {
            const color = getColor(i, m, 1);
            const fi = firstInCi(path);
            return (
              <tr key={i}>
                <td className="border border-white/10 px-2 py-1 text-center font-bold whitespace-nowrap" style={{ color }}>
                  반복 {i + 1}
                </td>
                {cols.map((k, ci) => {
                  const val = path[k - 1];
                  const inBand = Math.abs(val - p) < h;
                  const isCrit = ci === fi;
                  const cls = isCrit
                    ? "bg-amber-400/20 text-amber-200 font-extrabold ring-2 ring-inset ring-amber-300/50"
                    : inBand
                    ? "bg-emerald-500/20 text-emerald-300 font-bold"
                    : "bg-rose-500/10 text-rose-300";
                  return (
                    <td key={ci} className={`border border-white/10 px-2 py-1 text-center font-mono ${cls}`}>
                      {val.toFixed(3)}{isCrit ? " ★" : ""}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {/* 요약 행 */}
          <tr className="border-t-2 border-amber-300/40 bg-black/30">
            <td className="border border-white/10 px-2 py-1 text-center font-extrabold whitespace-nowrap text-amber-300">
              h 안<br />개수/비율
            </td>
            {cols.map((_, ci) => {
              const cnt = colInCount[ci];
              const r = cnt / m;
              const color = r >= 0.8 ? "text-emerald-300" : r >= 0.5 ? "text-amber-300" : "text-rose-300";
              return (
                <td key={ci} className={`border border-white/10 px-2 py-1 text-center font-extrabold ${color}`}>
                  {cnt}/{m}
                  <br />
                  <span className="text-[10px] opacity-85">{(r * 100).toFixed(0)}%</span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── 인사이트 ─────────────────────────────────────────────
function Insight({ result }: { result: SimResult }) {
  const { p, h, n, m, inside } = result;
  const outside = m - inside;
  const ratio = inside / m;
  const pct = (ratio * 100).toFixed(1);
  const advice =
    ratio >= 0.9 ? " ✅ 큰 수의 법칙이 잘 관찰됩니다!"
    : ratio >= 0.7 ? " ⬆ n을 더 키워 보세요!"
    : " ⬆ n 또는 h를 더 키워 보세요!";

  return (
    <div className="mt-3 rounded-xl border border-indigo-400/30 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 px-4 py-3 text-sm leading-7 text-indigo-100">
      💡 <b className="text-indigo-200">결과 분석</b>{" "}
      <span className="text-slate-400">(n={n}, p={p.toFixed(2)}, h={h.toFixed(2)})</span>
      <br />
      {m}번 반복 중 최종 상대도수가 h 범위 <b className="text-emerald-300">안</b>:{" "}
      <b>{inside}회</b>, <b className="text-rose-300">밖</b>: <b>{outside}회</b>
      <br />
      → P(|X/n − p| &lt; h) ≈ <b className="text-amber-200">{pct}%</b>
      {advice}
    </div>
  );
}
