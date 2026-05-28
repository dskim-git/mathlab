"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

/* ──────────────────────────────────────────────────────────────
   🎯 독립시행 실생활 탐구  (4 tabs)
   공식: nCr × p^r × (1-p)^(n-r)
   1) 자유투 — p, n, r 슬라이더 + 이모지 그리드 + 확률 분포
   2) 한국시리즈 — 7전 4선승제(A 2승 1패), 음이항 우승 확률
   3) 양궁 — SVG 과녁(6링) + 화살 분산 + 확률 분포
   4) 날씨 — 7일 ☀️/🌧️ 시각화 + 확률 분포
   ────────────────────────────────────────────────────────────── */

// ============================================================
// 공통 수학 / 보조
// ============================================================

function comb(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  let x = 1;
  const k = Math.min(r, n - r);
  for (let i = 0; i < k; i++) x = (x * (n - i)) / (i + 1);
  return Math.round(x);
}
function bp(n: number, r: number, p: number): number {
  if (r < 0 || r > n) return 0;
  return comb(n, r) * Math.pow(p, r) * Math.pow(1 - p, n - r);
}
function pct(v: number, d = 2): string {
  return `${(v * 100).toFixed(d)}%`;
}
// 시드 기반 가짜 난수 (Canvas 양궁 시각화용)
function sr(seed: number): number {
  const x = (Math.sin(seed * 9301 + 49297)) % 1;
  return Math.abs(x);
}

// ============================================================
// 공용: 분포 막대 차트 (SVG)
// ============================================================

function ProbBarChart({
  probs, highlight, onPick, accent,
}: {
  probs: number[];
  highlight: number;
  onPick?: (r: number) => void;
  accent: "indigo" | "amber" | "emerald" | "violet";
}) {
  const max = Math.max(...probs, 0.001);
  const accents: Record<string, { grad: string; hl: string }> = {
    indigo: { grad: "from-indigo-500 to-indigo-700", hl: "from-amber-500 to-amber-700" },
    amber: { grad: "from-amber-500 to-amber-700", hl: "from-indigo-500 to-indigo-700" },
    emerald: { grad: "from-emerald-500 to-emerald-700", hl: "from-amber-500 to-amber-700" },
    violet: { grad: "from-violet-500 to-violet-700", hl: "from-amber-500 to-amber-700" },
  };
  const t = accents[accent];

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex h-[220px] items-end gap-1.5">
        {probs.map((p, r) => {
          const h = Math.max((p / max) * 180, 4);
          const isHl = r === highlight;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onPick?.(r)}
              className="flex min-w-[44px] flex-col items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
              title={`r=${r} : ${pct(p)}`}
            >
              <div
                className={`w-10 rounded-t-md bg-gradient-to-b transition ${isHl ? t.hl : t.grad} hover:brightness-110`}
                style={{ height: `${h}px` }}
              />
              <div className="text-xs text-slate-300">{r}</div>
              <div className="text-[10px] text-slate-500">{(p * 100).toFixed(1)}%</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 공식 박스
// ============================================================

function FormulaBox({
  expr, ans, note, tone = "emerald",
}: { expr: React.ReactNode; ans: React.ReactNode; note?: React.ReactNode; tone?: "emerald" | "amber" }) {
  const border = tone === "emerald" ? "border-emerald-400/30 bg-emerald-400/[0.06]" : "border-amber-400/30 bg-amber-400/[0.06]";
  const exprTone = tone === "emerald" ? "text-emerald-300" : "text-amber-300";
  const ansTone = tone === "emerald" ? "text-emerald-200" : "text-amber-200";
  const noteTone = tone === "emerald" ? "text-emerald-300/80" : "text-amber-300/80";
  return (
    <div className={`rounded-xl border p-4 text-center ${border}`}>
      <div className={`font-mono text-base font-bold leading-7 ${exprTone}`}>{expr}</div>
      <div className={`mt-1 text-2xl font-black ${ansTone}`}>{ans}</div>
      {note ? <div className={`mt-1 text-xs ${noteTone}`}>{note}</div> : null}
    </div>
  );
}

// ============================================================
// 탭 0 — 🏀 자유투
// ============================================================

function FreeThrowTab() {
  const [p, setP] = useState(60); // 0~100 (% step 5)
  const [n, setN] = useState(5);
  const [r, setR] = useState(3);

  const pp = p / 100;
  const safeR = Math.min(r, n);

  const prob = bp(n, safeR, pp);
  const cn = comb(n, safeR);
  const probs = Array.from({ length: n + 1 }, (_, i) => bp(n, i, pp));

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-indigo-400/30 bg-indigo-400/[0.06] p-4">
        <p className="text-sm font-bold text-indigo-300">🏀 농구 자유투</p>
        <p className="mt-1 text-sm leading-7 text-slate-300">
          자유투 성공 확률이 <b className="text-indigo-200">{pp.toFixed(2)}</b>인 선수가{" "}
          <b className="text-indigo-200">{n}</b>번 시도할 때, 정확히 <b className="text-amber-300">{safeR}번</b> 성공할 확률은?
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SliderBox id="ft-p" label="성공 확률 p" valueText={pp.toFixed(2)} min={10} max={90} step={5} value={p} onChange={setP} accent="indigo" />
        <SliderBox id="ft-n" label="시도 횟수 n" valueText={String(n)} min={1} max={10} value={n} onChange={(v) => { setN(v); if (r > v) setR(v); }} accent="indigo" />
        <SliderBox id="ft-r" label="목표 r" valueText={String(safeR)} min={0} max={n} value={safeR} onChange={setR} accent="amber" />
      </div>

      {/* 이모지 그리드 */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: n }, (_, i) => {
            const success = i < safeR;
            return (
              <div
                key={i}
                className={`flex h-14 w-14 items-center justify-center rounded-lg border text-3xl transition ${
                  success ? "border-emerald-400/45 bg-emerald-400/15" : "border-red-400/40 bg-red-400/12"
                }`}
              >
                {success ? "🏀" : "✖️"}
              </div>
            );
          })}
        </div>
      </div>

      <FormulaBox
        expr={
          <>
            <sub>{n}</sub>C<sub>{safeR}</sub> × {pp.toFixed(2)}<sup>{safeR}</sup> × {(1 - pp).toFixed(2)}<sup>{n - safeR}</sup>
          </>
        }
        ans={`= ${cn} × ${Math.pow(pp, safeR).toFixed(4)} × ${Math.pow(1 - pp, n - safeR).toFixed(4)}`}
        note={`≈ ${pct(prob)}`}
      />

      <div className="text-[11px] text-slate-500">📊 r별 확률 분포 (막대 클릭 → r 변경)</div>
      <ProbBarChart probs={probs} highlight={safeR} onPick={setR} accent="indigo" />
    </div>
  );
}

// ============================================================
// 탭 1 — ⚾ 한국시리즈 (7전 4선승제, A 2승 1패)
// ============================================================

function BaseballTab() {
  const [p, setP] = useState(50); // %
  const pp = p / 100;

  // A는 2승 더 필요, B는 3승 더 필요. P(A 우승) = Σ C(r-1, 1) * p^2 * (1-p)^(r-2)
  const aN = 2, bN = 3;
  const paths = useMemo(() => {
    const out: { r: number; bW: number; pp: number; cn: number }[] = [];
    for (let r = aN; r <= aN + bN - 1; r++) {
      const bW = r - aN;
      const probPath = comb(r - 1, aN - 1) * Math.pow(pp, aN) * Math.pow(1 - pp, bW);
      out.push({ r, bW, pp: probPath, cn: comb(r - 1, aN - 1) });
    }
    return out;
  }, [pp]);
  const pA = paths.reduce((s, x) => s + x.pp, 0);

  // 경기 상태 (1~3차전 고정, 4~7 미정)
  const games: { lbl: string; result: "A" | "B" | "PENDING" }[] = [
    { lbl: "1차전", result: "A" },
    { lbl: "2차전", result: "B" },
    { lbl: "3차전", result: "A" },
    { lbl: "4차전", result: "PENDING" },
    { lbl: "5차전", result: "PENDING" },
    { lbl: "6차전", result: "PENDING" },
    { lbl: "7차전", result: "PENDING" },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-indigo-400/30 bg-indigo-400/[0.06] p-4">
        <p className="text-sm font-bold text-indigo-300">⚾ 프로야구 한국시리즈 (7전 4선승제)</p>
        <p className="mt-1 text-sm leading-7 text-slate-300">
          현재까지 <b className="text-blue-300">A팀 2승 1패</b>. 각 경기에서 A팀의 승률이 p일 때, A팀이 우승할 확률을 구해 봅시다.
        </p>
      </div>

      <SliderBox id="ks-p" label="A팀 경기당 승률 p" valueText={pp.toFixed(2)} min={10} max={90} step={5} value={p} onChange={setP} accent="indigo" />

      {/* 7경기 브래킷 */}
      <div className="flex flex-wrap gap-2">
        {games.map((g, i) => {
          const cls =
            g.result === "A" ? "border-blue-400/55 bg-blue-400/15 text-blue-200"
            : g.result === "B" ? "border-red-400/45 bg-red-400/12 text-red-200"
            : "border-white/12 bg-white/[0.03] text-slate-500 opacity-60";
          const icon = g.result === "A" ? "🔵" : g.result === "B" ? "🔴" : "❓";
          return (
            <div key={i} className={`flex h-[88px] w-[84px] flex-col items-center justify-center gap-1 rounded-2xl border-2 text-sm font-bold ${cls}`}>
              <span className="text-2xl">{icon}</span>
              <span>{g.lbl}</span>
            </div>
          );
        })}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="A팀 우승 확률" value={pct(pA)} tone="blue" />
        <KpiCard label="B팀 우승 확률" value={pct(1 - pA)} tone="red" />
      </div>

      <FormulaBox
        tone="emerald"
        expr={
          <span className="text-sm">
            P(A우승) = {paths.map((x, i) => (
              <span key={i}>
                {i > 0 ? " + " : ""}
                C({x.r - 1},1)·p<sup>2</sup>·(1−p)<sup>{x.bW}</sup>
              </span>
            ))}
          </span>
        }
        ans={`= ${paths.map((x) => pct(x.pp)).join(" + ")} = ${pct(pA)}`}
      />

      <div className="text-[11px] text-slate-500">🗺️ A팀 우승 경로별 확률</div>
      <div className="space-y-1.5">
        {paths.map((x, i) => (
          <div key={i} className="rounded-md border border-indigo-400/30 bg-indigo-400/10 px-3 py-1.5 font-mono text-xs text-indigo-200">
            {x.r}게임째 A 우승 │ 나머지 {x.bW}패 포함 │ C({x.r - 1},1) = {x.cn}가지 │ <b className="text-amber-200">{pct(x.pp)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 탭 2 — 🎯 양궁 (SVG 과녁 + 화살 분산)
// ============================================================

function ArcheryTab() {
  const [p, setP] = useState(70);
  const [n, setN] = useState(6);
  const [r, setR] = useState<number | null>(null); // null이면 최빈값 자동

  const pp = p / 100;
  const probs = useMemo(() => Array.from({ length: n + 1 }, (_, i) => bp(n, i, pp)), [n, pp]);
  const mostLikely = probs.indexOf(Math.max(...probs));
  const curR = r ?? mostLikely;
  const safeR = Math.min(Math.max(curR, 0), n);

  // 화살 좌표 (SVG viewBox 480x360, 시드 랜덤)
  const W = 480, H = 360;
  const cx = 240, cy = 180, maxRing = 155;
  const rings = [
    { rad: maxRing, fill: "#1e3a5f" },
    { rad: maxRing * 0.8, fill: "#1e40af" },
    { rad: maxRing * 0.6, fill: "#b91c1c" },
    { rad: maxRing * 0.4, fill: "#dc2626" },
    { rad: maxRing * 0.22, fill: "#1d4ed8" },
    { rad: maxRing * 0.08, fill: "#fbbf24" },
  ];
  const arrows = useMemo(() => {
    const list: { x: number; y: number; hit: boolean }[] = [];
    for (let i = 0; i < n; i++) {
      const hit = i < safeR;
      const angle = sr(i * 7 + 1) * Math.PI * 2;
      const dist = hit ? sr(i * 13 + 3) * 56 + 10 : sr(i * 17 + 5) * 64 + 80;
      const xp = cx + dist * Math.cos(angle);
      const yp = cy + dist * Math.sin(angle);
      list.push({ x: Math.max(8, Math.min(472, xp)), y: Math.max(8, Math.min(352, yp)), hit });
    }
    return list;
  }, [n, safeR]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-indigo-400/30 bg-indigo-400/[0.06] p-4">
        <p className="text-sm font-bold text-indigo-300">🎯 양궁 명중 확률 탐구</p>
        <p className="mt-1 text-sm leading-7 text-slate-300">
          명중 확률이 <b className="text-indigo-200">{pp.toFixed(2)}</b>인 선수가 <b className="text-indigo-200">{n}</b>발을 쏩니다.
          각 경우의 확률 분포를 탐구하세요. (막대 클릭 → r 변경)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SliderBox id="ar-p" label="명중 확률 p" valueText={pp.toFixed(2)} min={10} max={90} step={5} value={p} onChange={setP} accent="indigo" />
        <SliderBox id="ar-n" label="화살 수 n" valueText={String(n)} min={2} max={12} value={n} onChange={(v) => { setN(v); setR(null); }} accent="indigo" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[480px_1fr]">
        {/* SVG 과녁 */}
        <div className="mx-auto w-full max-w-[480px]">
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full rounded-xl border border-white/10 bg-slate-950">
            {/* 링 */}
            {rings.map((ring, i) => (
              <circle key={i} cx={cx} cy={cy} r={ring.rad} fill={ring.fill} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
            ))}
            {/* 십자선 */}
            <line x1={cx - maxRing} y1={cy} x2={cx + maxRing} y2={cy} stroke="rgba(255,255,255,0.15)" />
            <line x1={cx} y1={cy - maxRing} x2={cx} y2={cy + maxRing} stroke="rgba(255,255,255,0.15)" />
            {/* 화살 */}
            {arrows.map((a, i) => (
              <g key={i}>
                <line x1={a.x} y1={a.y} x2={a.x} y2={a.y - 22} stroke={a.hit ? "#6ee7b7" : "#fca5a5"} strokeWidth={3} />
                <circle cx={a.x} cy={a.y} r={7} fill={a.hit ? "#34d399" : "rgba(239,68,68,0.85)"} stroke={a.hit ? "#059669" : "#991b1b"} strokeWidth={2} />
              </g>
            ))}
          </svg>
        </div>

        {/* 공식 */}
        <FormulaBox
          tone="emerald"
          expr={
            <>
              <span className="block text-[11px] text-emerald-300/80">선택된 r의 확률</span>
              r = {safeR}번 명중 &nbsp; <sub>{n}</sub>C<sub>{safeR}</sub> × {pp.toFixed(2)}<sup>{safeR}</sup> × {(1 - pp).toFixed(2)}<sup>{n - safeR}</sup>
            </>
          }
          ans={pct(probs[safeR])}
        />
      </div>

      <div className="text-[11px] text-slate-500">📊 전체 확률 분포 (막대 클릭 → 과녁 시각화 변경)</div>
      <ProbBarChart probs={probs} highlight={safeR} onPick={(ri) => setR(ri)} accent="indigo" />
    </div>
  );
}

// ============================================================
// 탭 3 — 🌦️ 날씨 (7일 ☀️/🌧️)
// ============================================================

const WEEK = ["월", "화", "수", "목", "금", "토", "일"] as const;

function WeatherTab() {
  const [p, setP] = useState(40);
  const [r, setR] = useState(3);
  const n = 7;
  const pp = p / 100;
  const safeR = Math.min(Math.max(r, 0), n);
  const prob = bp(n, safeR, pp);
  const cn = comb(n, safeR);
  const probs = useMemo(() => Array.from({ length: n + 1 }, (_, i) => bp(n, i, pp)), [pp]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-indigo-400/30 bg-indigo-400/[0.06] p-4">
        <p className="text-sm font-bold text-indigo-300">🌦️ 일주일 날씨 예보</p>
        <p className="mt-1 text-sm leading-7 text-slate-300">
          하루 비올 확률이 <b className="text-indigo-200">{pp.toFixed(2)}</b>인 지역에서, 7일 중 정확히{" "}
          <b className="text-amber-300">{safeR}일</b> 비올 확률은?
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SliderBox id="wt-p" label="하루 비올 확률 p" valueText={pp.toFixed(2)} min={10} max={90} step={5} value={p} onChange={setP} accent="indigo" />
        <SliderBox id="wt-r" label="비 오는 날 수 r" valueText={String(safeR)} min={0} max={7} value={safeR} onChange={setR} accent="amber" />
      </div>

      <div className="flex flex-wrap gap-2">
        {WEEK.map((d, i) => {
          const rain = i < safeR;
          const cls = rain
            ? "border-indigo-400/55 bg-indigo-400/18 text-indigo-200"
            : "border-amber-400/45 bg-amber-400/12 text-amber-200";
          return (
            <div key={d} className={`flex h-[88px] w-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-2 text-sm font-semibold ${cls}`}>
              <span className="text-3xl">{rain ? "🌧️" : "☀️"}</span>
              <span>{d}</span>
            </div>
          );
        })}
      </div>

      <FormulaBox
        expr={
          <>
            <sub>7</sub>C<sub>{safeR}</sub> × {pp.toFixed(2)}<sup>{safeR}</sup> × {(1 - pp).toFixed(2)}<sup>{7 - safeR}</sup>
          </>
        }
        ans={`= ${cn} × ${Math.pow(pp, safeR).toFixed(4)} × ${Math.pow(1 - pp, n - safeR).toFixed(4)}`}
        note={`≈ ${pct(prob)}`}
      />

      <div className="text-[11px] text-slate-500">📊 비 오는 날 수별 확률 분포 (막대 클릭)</div>
      <ProbBarChart probs={probs} highlight={safeR} onPick={setR} accent="indigo" />
    </div>
  );
}

// ============================================================
// 공용 슬라이더
// ============================================================

function SliderBox({
  id, label, valueText, min, max, step = 1, value, onChange, accent,
}: {
  id: string; label: string; valueText: string;
  min: number; max: number; step?: number; value: number;
  onChange: (n: number) => void;
  accent: "indigo" | "amber" | "emerald" | "violet";
}) {
  const accentCls = accent === "amber" ? "accent-amber-400"
    : accent === "emerald" ? "accent-emerald-400"
    : accent === "violet" ? "accent-violet-400"
    : "accent-indigo-400";
  const badge = accent === "amber" ? "from-amber-500 to-amber-700 text-amber-50"
    : accent === "emerald" ? "from-emerald-500 to-emerald-700 text-emerald-50"
    : accent === "violet" ? "from-violet-500 to-violet-700 text-violet-50"
    : "from-indigo-500 to-violet-700 text-indigo-50";
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <label htmlFor={id} className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
        <span>{label}</span>
        <span className={`min-w-[44px] rounded-md bg-gradient-to-br ${badge} px-2 py-0.5 text-center font-mono text-sm`}>
          {valueText}
        </span>
      </label>
      <input
        id={id}
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className={`mt-2 w-full ${accentCls}`}
      />
    </div>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: string; tone: "blue" | "red" }) {
  const cls = tone === "blue" ? "border-blue-400/35 bg-blue-400/10" : "border-red-400/35 bg-red-400/10";
  const valTone = tone === "blue" ? "text-blue-300" : "text-red-300";
  return (
    <div className={`rounded-xl border p-3 text-center ${cls}`}>
      <div className={`text-2xl font-black tabular-nums ${valTone}`}>{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
}

// ============================================================
// 메인
// ============================================================

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_independent",
    kind: "text",
    prompt: "탐구한 4가지 상황(자유투·한국시리즈·양궁·날씨) 중 하나를 골라, 그것이 ‘독립시행’이라고 할 수 있는 이유를 설명하세요.",
    placeholder: "각 시도의 결과가 이전 시도의 결과에 영향을 받지 않는다는 의미에서...",
  },
  {
    id: "formula_decompose",
    kind: "text",
    prompt: "공식 nCr × p^r × (1−p)^(n−r) 에서 ① nCr ② p^r ③ (1−p)^(n−r) 이 각각 무엇을 뜻하는지 자신의 말로 설명하세요.",
    placeholder: "① nCr 은 n번 중 r번 성공이 어디서 나오는지 경우의 수를...",
  },
  {
    id: "my_example",
    kind: "text",
    prompt: "일상생활에서 독립시행을 적용할 수 있는 나만의 상황을 만들고, 구체적인 확률을 직접 계산해 보세요.",
    placeholder: "예) 매번 60% 확률로 버스가 정시 도착할 때, 일주일 5일 등교 중 3일 정시 도착할 확률은...",
  },
];

type TabKey = "ft" | "ks" | "ar" | "wt";

export default function IndependentTrialApply() {
  const [tab, setTab] = useState<TabKey>("ft");
  const tabBtn = (active: boolean, color: string) =>
    active
      ? `rounded-lg ${color} px-3 py-2 text-sm font-bold text-slate-950`
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 사건의 독립과 종속</p>
        <h3 className="mt-2 text-2xl font-bold">🎯 독립시행, 실생활에서 찾기</h3>
        <p className="mt-2 leading-7 text-slate-300">
          농구·야구·양궁·날씨 네 가지 상황에서 독립시행 공식{" "}
          <b className="font-mono text-amber-200">nCr × p<sup>r</sup> × (1−p)<sup>n−r</sup></b> 을 직접 슬라이더로 탐구합니다.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "ft", "bg-indigo-300")} onClick={() => setTab("ft")}>🏀 자유투</button>
        <button type="button" className={tabBtn(tab === "ks", "bg-blue-300")} onClick={() => setTab("ks")}>⚾ 한국시리즈</button>
        <button type="button" className={tabBtn(tab === "ar", "bg-amber-300")} onClick={() => setTab("ar")}>🎯 양궁</button>
        <button type="button" className={tabBtn(tab === "wt", "bg-cyan-300")} onClick={() => setTab("wt")}>🌦️ 날씨</button>
      </div>

      <div className="mt-5">
        {tab === "ft" ? <FreeThrowTab />
          : tab === "ks" ? <BaseballTab />
          : tab === "ar" ? <ArcheryTab />
          : <WeatherTab />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
