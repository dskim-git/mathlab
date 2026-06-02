"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ───────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "b_vs_a_change",
    prompt:
      "a = 1 로 두고 b 만 바꾸었을 때, 그리고 b = 0 으로 두고 a 만 바꾸었을 때 수직선 위 데이터·평균·분산이 각각 어떻게 달라졌는지 비교해 설명해 보세요. 점들 사이의 간격이 핵심 단서입니다.",
    kind: "text",
    placeholder:
      "예: b 만 바꾸면 모든 점이 통째로 옆으로 이동하지만 점 사이 간격은 그대로다. 평균은 같이 이동하고 분산은 그대로. a 만 바꾸면 원점을 기준으로 점들이 |a| 배만큼 멀어지거나 가까워진다. 평균도 a 배, 분산은 거리가 |a| 배이므로 (거리)² 평균인 분산이 a² 배가 된다.",
  },
  {
    id: "variance_a_squared",
    prompt:
      "분산이 a² 배가 되는 까닭을, 수직선 위에서 점들 사이의 거리(또는 평균과의 거리) 변화를 이용해 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 분산은 각 점이 평균에서 얼마나 떨어졌는지의 제곱의 평균이다. aX+b 로 바꾸면 ‘평균과의 거리’ 가 정확히 |a| 배가 되고 (b 는 모두에 같은 양이 더해져 상쇄), 제곱을 취하면 a² 배가 된다.",
  },
  {
    id: "real_life_axb",
    prompt:
      "섭씨 ℃ 를 화씨 ℉ 로 바꾸는 식 ℉ = 1.8·℃ + 32 처럼, aX+b 변환을 활용하는 실생활 사례를 하나 떠올려 보고 a, b 의 의미를 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 어떤 시험의 ‘원점수 → 표준점수 변환’ (a = 점수 스케일 변환 계수, b = 평균 이동) 또는 외국 화폐 환산(a = 환율, b = 수수료) 등.",
  },
];

// ─── 데이터 프리셋 ─────────────────────────────────────────
type Preset = {
  icon: string;
  name: string;
  desc: string;
  values: number[];
  unit: string;
};

const PRESETS: Preset[] = [
  {
    icon: "📝",
    name: "시험 점수",
    desc: "7명의 원점수",
    values: [60, 65, 70, 75, 80, 85, 90],
    unit: "점",
  },
  {
    icon: "📏",
    name: "평균 키 편차",
    desc: "평균에서의 차이",
    values: [-8, -5, -2, 0, 3, 6, 10],
    unit: "cm",
  },
  {
    icon: "🌡️",
    name: "섭씨 온도",
    desc: "하루 7시각의 기온",
    values: [0, 5, 10, 15, 20, 25, 30],
    unit: "℃",
  },
];

// ─── 유틸 ───────────────────────────────────────────────────
function r3(x: number) {
  return Math.round(x * 1000) / 1000;
}
function fmt(x: number): string {
  const v = r3(x);
  if (Math.abs(v) < 1e-9) return "0";
  if (Number.isInteger(v)) return v.toString();
  return parseFloat(v.toFixed(3)).toString();
}
function calcStats(arr: number[]) {
  const n = arr.length;
  const m = arr.reduce((s, x) => s + x, 0) / n;
  const v = arr.reduce((s, x) => s + (x - m) * (x - m), 0) / n;
  const s = Math.sqrt(Math.max(v, 0));
  return { m, v, s };
}

// ─── 메인 ───────────────────────────────────────────────────
export default function AxbNumberLineLab() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [a, setA] = useState(1);
  const [b, setB] = useState(0);

  const X = PRESETS[presetIdx].values;
  const Y = useMemo(() => X.map((x) => a * x + b), [X, a, b]);
  const sx = useMemo(() => calcStats(X), [X]);
  const sy = useMemo(() => calcStats(Y), [Y]);

  // Y 라벨용 식 문자열 (예: "2X + 5", "−X", "1.8X + 32")
  const yTitle = useMemo(() => {
    const aDisp =
      a === 1 ? "X" : a === -1 ? "−X" : a < 0 ? `(${fmt(a)})X` : `${fmt(a)}X`;
    const bDisp = b === 0 ? "" : b > 0 ? ` + ${fmt(b)}` : ` − ${fmt(-b)}`;
    return aDisp + bDisp || "X";
  }, [a, b]);

  function applyPreset(idx: number, newA?: number, newB?: number) {
    setPresetIdx(idx);
    if (newA !== undefined) setA(newA);
    if (newB !== undefined) setB(newB);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* 헤더 */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 확률과 통계</p>
        <h3 className="mt-2 text-2xl font-bold">📊 aX + b 수직선 변환 실험실</h3>
        <p className="mt-2 leading-7 text-slate-300">
          슬라이더로 <b className="text-violet-200">a (스케일)</b> 와{" "}
          <b className="text-violet-200">b (이동)</b> 를 바꾸며 수직선 위 데이터가 어떻게
          움직이는지, 평균과 분산이 어떻게 달라지는지 직접 확인해 보세요.
        </p>
      </div>

      {/* ① 데이터 선택 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
          🎯 데이터 X 선택
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {PRESETS.map((p, i) => {
            const isCur = i === presetIdx;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => setPresetIdx(i)}
                className={
                  "rounded-2xl border-2 p-3 text-center transition hover:-translate-y-0.5 " +
                  (isCur
                    ? "border-sky-400/65 bg-sky-400/15 shadow-lg shadow-sky-500/15"
                    : "border-white/10 bg-slate-900/50 hover:border-sky-400/40 hover:bg-slate-900/70")
                }
              >
                <p className="text-2xl">{p.icon}</p>
                <p className="mt-1 text-sm font-bold text-sky-100">{p.name}</p>
                <p className="text-xs text-slate-400">{p.desc}</p>
                <p className="mt-2 break-all font-mono text-[11px] leading-5 text-slate-500">
                  [{p.values.join(", ")}] {p.unit}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ② 슬라이더 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
          🎚️ 상수 a · b 조절하기
        </p>

        <SliderRow
          label="a"
          sub="(스케일)"
          min={-2}
          max={3}
          step={0.1}
          value={a}
          onChange={setA}
          tone="a"
        />
        <div className="mt-1 flex flex-wrap gap-1.5">
          {[1, 2, 0.5, -1, -2].map((v) => (
            <QuickBtn key={v} onClick={() => setA(v)}>
              a = {fmt(v)}
            </QuickBtn>
          ))}
        </div>

        <div className="mt-4">
          <SliderRow
            label="b"
            sub="(이동)"
            min={-40}
            max={40}
            step={0.5}
            value={b}
            onChange={setB}
            tone="b"
          />
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {[0, 5, -5, 10, 20].map((v) => (
            <QuickBtn key={v} onClick={() => setB(v)}>
              b = {fmt(v)}
            </QuickBtn>
          ))}
        </div>
      </div>

      {/* ③ SVG 시각화 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
          📍 수직선 위 데이터 변환
        </p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60 p-2">
          <NumberLineViz X={X} Y={Y} sx={sx} sy={sy} a={a} b={b} />
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-slate-300">
          <Legend dot="#60a5fa">X (원본)</Legend>
          <Legend dot="#c084fc">aX + b (변환)</Legend>
          <Legend bar="#fbbf24">평균 E</Legend>
          <Legend band="rgba(251,191,36,0.22)">±σ 구간</Legend>
        </div>
      </div>

      {/* ④ 통계 비교 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
          🔢 평균 · 분산 · 표준편차 비교
        </p>
        <div className="mt-3 grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <StatCol
            title="X (원본)"
            tone="sky"
            entries={[
              { k: "E(X)", v: fmt(sx.m) },
              { k: "V(X)", v: fmt(sx.v) },
              { k: "σ(X)", v: fmt(sx.s) },
            ]}
          />
          <p className="flex items-center justify-center text-3xl text-amber-300 sm:rotate-0">
            ➡
          </p>
          <StatCol
            title={yTitle}
            tone="violet"
            entries={[
              { k: `E(${yTitle})`, v: fmt(sy.m) },
              { k: `V(${yTitle})`, v: fmt(sy.v) },
              { k: `σ(${yTitle})`, v: fmt(sy.s) },
            ]}
          />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <FmlChip>
            <span className="inline-block">E(aX + b)</span>{" "}
            <span className="inline-block">= a · E(X) + b</span>
            <span className="mt-1 block text-[11px] font-normal text-amber-200/80">
              평균은 a 배 한 뒤 b 만큼 이동
            </span>
          </FmlChip>
          <FmlChip>
            <span className="inline-block">V(aX + b)</span>{" "}
            <span className="inline-block">= a² · V(X)</span>
            <span className="mt-1 block text-[11px] font-normal text-amber-200/80">
              분산은 a² 배 (b 의 영향 없음)
            </span>
          </FmlChip>
          <FmlChip>
            <span className="inline-block">σ(aX + b)</span>{" "}
            <span className="inline-block">= |a| · σ(X)</span>
            <span className="mt-1 block text-[11px] font-normal text-amber-200/80">
              표준편차는 |a| 배 (b 의 영향 없음)
            </span>
          </FmlChip>
        </div>
      </div>

      {/* ⑤ 직접 확인 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
          🔍 직접 확인해 보세요
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <ObsCard tone="b" title="① b 만 바꾸면?">
            <p>
              a = 1 로 두고 b 를 움직여 보세요. 데이터가 통째로 옆으로 이동하지만 점 사이의{" "}
              <b className="text-amber-200">간격은 그대로</b> → 분산 변화 없음!
            </p>
            <TryBtn onClick={() => { setA(1); setB(15); }}>▶ a = 1, b = 15 적용</TryBtn>
          </ObsCard>
          <ObsCard tone="a" title="② a 만 바꾸면?">
            <p>
              b = 0 으로 두고 a 를 키워 보세요. 점들이{" "}
              <b className="text-violet-200">원점 기준으로 퍼지거나 모입니다</b> → 분산이 a² 배로
              변화!
            </p>
            <TryBtn onClick={() => { setA(2); setB(0); }}>▶ a = 2, b = 0 적용</TryBtn>
          </ObsCard>
          <ObsCard tone="a" title="③ a 가 음수면?">
            <p>
              a = −1 로 해 보세요. 데이터가{" "}
              <b className="text-violet-200">좌우로 뒤집힙니다</b>. 하지만 분산은 (−1)² = 1 배라
              그대로!
            </p>
            <TryBtn onClick={() => { setA(-1); setB(0); }}>▶ a = −1, b = 0 적용</TryBtn>
          </ObsCard>
          <ObsCard tone="b" title="🌡️ 챌린지: ℃ 를 ℉ 로!">
            <p>
              ‘섭씨 온도’ 데이터를 골라 ℉ = 1.8·℃ + 32 를 적용해 보세요. 평균과 표준편차가 어떻게
              바뀌나요?
            </p>
            <TryBtn onClick={() => applyPreset(2, 1.8, 32)}>▶ 화씨 변환 적용</TryBtn>
          </ObsCard>
        </div>
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── SVG 시각화 ────────────────────────────────────────────
function NumberLineViz({
  X,
  Y,
  sx,
  sy,
  a,
  b,
}: {
  X: number[];
  Y: number[];
  sx: { m: number; v: number; s: number };
  sy: { m: number; v: number; s: number };
  a: number;
  b: number;
}) {
  const W = 820;
  const H = 310;
  const padX = 14;
  const yX = 80;
  const yY = 248;

  // 공유 스케일
  const candidates = [...X, ...Y, sx.m - sx.s, sx.m + sx.s, sy.m - sy.s, sy.m + sy.s];
  let lo = Math.min(...candidates);
  let hi = Math.max(...candidates);
  let range = hi - lo;
  if (range < 1e-6) {
    lo -= 1;
    hi += 1;
    range = 2;
  }
  lo -= range * 0.1;
  hi += range * 0.1;

  function px(v: number) {
    return padX + ((v - lo) / (hi - lo)) * (W - 2 * padX);
  }

  // 깔끔한 눈금
  function niceTicks(loN: number, hiN: number, count: number) {
    const span = hiN - loN;
    const step0 = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norms = [1, 2, 2.5, 5, 10];
    let step = mag * 10;
    for (const n of norms) {
      if (n * mag >= step0) {
        step = n * mag;
        break;
      }
    }
    const first = Math.ceil(loN / step) * step;
    const out: number[] = [];
    for (let v = first; v <= hiN + step * 0.001; v += step) {
      out.push(Math.round(v / step) * step);
    }
    return out;
  }
  const ticks = niceTicks(lo, hi, 9);

  // 데이터 점 좌표 (좁게 모인 점은 위로 살짝 분산)
  function points(yLine: number, arr: number[], color: string) {
    const pxs = arr.map((v) => px(v));
    return pxs.map((cx, i) => {
      let stack = 0;
      for (let j = 0; j < i; j++) {
        if (Math.abs(pxs[j] - cx) < 11) stack++;
      }
      const cy = yLine - stack * 12;
      return (
        <circle
          key={`p-${yLine}-${i}`}
          cx={cx}
          cy={cy}
          r={7}
          fill={color}
          stroke="#fff"
          strokeWidth={1.5}
        />
      );
    });
  }

  function sigmaBand(yLine: number, mean: number, sigma: number, k: string) {
    const x1 = px(mean - sigma);
    const x2 = px(mean + sigma);
    return (
      <rect
        key={k}
        x={x1}
        y={yLine - 22}
        width={Math.max(x2 - x1, 0)}
        height={44}
        rx={5}
        fill="#fbbf24"
        fillOpacity={0.18}
        stroke="#fbbf24"
        strokeOpacity={0.45}
        strokeWidth={1}
      />
    );
  }

  function meanMarker(yLine: number, mean: number, label: string, k: string) {
    const cx = px(mean);
    const lblW = Math.max(110, 11 * label.length + 18);
    let bx = cx - lblW / 2;
    if (bx < 2) bx = 2;
    if (bx + lblW > W - 2) bx = W - 2 - lblW;
    return (
      <g key={k}>
        <line
          x1={cx}
          y1={yLine - 28}
          x2={cx}
          y2={yLine + 28}
          stroke="#fbbf24"
          strokeWidth={3}
          strokeDasharray="5 4"
        />
        <rect x={bx} y={yLine - 58} width={lblW} height={28} rx={6} fill="#fbbf24" />
        <text
          x={bx + lblW / 2}
          y={yLine - 38}
          textAnchor="middle"
          fill="#1c1917"
          fontSize={19}
          fontWeight={900}
          fontFamily="Consolas,monospace"
        >
          {label}
        </text>
      </g>
    );
  }

  function tickGroup(yLine: number, kPrefix: string) {
    return ticks.map((t) => {
      const cx = px(t);
      const lbl =
        Math.abs(t) < 1e-9
          ? "0"
          : Number.isInteger(t)
          ? String(t)
          : parseFloat(t.toFixed(2)).toString();
      return (
        <g key={`${kPrefix}-tick-${t}`}>
          <line x1={cx} y1={yLine - 6} x2={cx} y2={yLine + 6} stroke="#64748b" strokeWidth={1.2} />
          <text
            x={cx}
            y={yLine + 26}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize={18}
            fontWeight={700}
            fontFamily="Consolas,monospace"
          >
            {lbl}
          </text>
        </g>
      );
    });
  }

  function zeroLine(yLine: number, k: string) {
    if (lo > 0 || hi < 0) return null;
    const cx = px(0);
    return (
      <line
        key={k}
        x1={cx}
        y1={yLine - 26}
        x2={cx}
        y2={yLine + 26}
        stroke="#475569"
        strokeWidth={1}
        strokeDasharray="2 3"
        opacity={0.5}
      />
    );
  }

  function axisLine(yLine: number, k: string) {
    return (
      <g key={k}>
        <line
          x1={padX - 5}
          y1={yLine}
          x2={W - padX + 5}
          y2={yLine}
          stroke="#cbd5e1"
          strokeWidth={2}
        />
        <polygon
          points={`${W - padX + 5},${yLine} ${W - padX - 4},${yLine - 5} ${W - padX - 4},${yLine + 5}`}
          fill="#cbd5e1"
        />
      </g>
    );
  }

  // X → Y 연결 점선
  function connections() {
    return X.map((x, i) => {
      const x1 = px(x);
      const x2 = px(Y[i]);
      const same = Math.abs(x1 - x2) < 0.5;
      return (
        <line
          key={`cnx-${i}`}
          x1={x1}
          y1={yX + 14}
          x2={x2}
          y2={yY - 14}
          stroke={same ? "#475569" : "#fbbf24"}
          strokeWidth={1}
          strokeDasharray="3 4"
          opacity={same ? 0.25 : 0.45}
        />
      );
    });
  }

  // 변환식 박스 텍스트
  const aStr = a >= 0 ? fmt(a) : `(${fmt(a)})`;
  const bStrSign = b >= 0 ? ` + ${fmt(b)}` : ` − ${fmt(-b)}`;
  const eqStr = `Y = ${aStr} · X${bStrSign}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full max-w-[820px]"
      role="img"
      aria-label="aX+b 수직선 변환 시각화"
    >
      {connections()}

      {/* X 수직선 */}
      {sigmaBand(yX, sx.m, sx.s, "sb-x")}
      {zeroLine(yX, "zero-x")}
      {axisLine(yX, "ax-x")}
      {tickGroup(yX, "x")}
      {points(yX, X, "#60a5fa")}
      {meanMarker(yX, sx.m, `E(X) = ${fmt(sx.m)}`, "mm-x")}
      <text
        x={padX + 4}
        y={yX - 12}
        textAnchor="start"
        fill="#93c5fd"
        fontSize={24}
        fontWeight={900}
        fontFamily="Times New Roman,serif"
        fontStyle="italic"
      >
        X
      </text>
      <text
        x={W - padX - 4}
        y={yX - 12}
        textAnchor="end"
        fill="#fbbf24"
        fontSize={18}
        fontWeight={800}
        fontFamily="Consolas,monospace"
      >
        σ(X) = {fmt(sx.s)}
      </text>

      {/* 변환식 박스 */}
      <rect
        x={W / 2 - 170}
        y={(yX + yY) / 2 - 22}
        width={340}
        height={44}
        rx={11}
        fill="rgba(168,85,247,0.18)"
        stroke="rgba(168,85,247,0.55)"
        strokeWidth={1.5}
      />
      <text
        x={W / 2}
        y={(yX + yY) / 2 + 9}
        textAnchor="middle"
        fill="#f3e8ff"
        fontSize={24}
        fontWeight={800}
        fontFamily="Consolas,monospace"
      >
        {eqStr}
      </text>

      {/* Y 수직선 */}
      {sigmaBand(yY, sy.m, sy.s, "sb-y")}
      {zeroLine(yY, "zero-y")}
      {axisLine(yY, "ax-y")}
      {tickGroup(yY, "y")}
      {points(yY, Y, "#c084fc")}
      {meanMarker(yY, sy.m, `E(Y) = ${fmt(sy.m)}`, "mm-y")}
      <text
        x={padX + 4}
        y={yY - 12}
        textAnchor="start"
        fill="#d8b4fe"
        fontSize={24}
        fontWeight={900}
        fontFamily="Times New Roman,serif"
        fontStyle="italic"
      >
        Y
      </text>
      <text
        x={W - padX - 4}
        y={yY - 12}
        textAnchor="end"
        fill="#fbbf24"
        fontSize={18}
        fontWeight={800}
        fontFamily="Consolas,monospace"
      >
        σ(Y) = {fmt(sy.s)} = |{fmt(a)}| · σ(X)
      </text>
    </svg>
  );
}

// ─── 작은 UI 헬퍼 ──────────────────────────────────────────
function SliderRow({
  label,
  sub,
  min,
  max,
  step,
  value,
  onChange,
  tone,
}: {
  label: string;
  sub: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  tone: "a" | "b";
}) {
  const trackCls =
    tone === "a"
      ? "accent-violet-400"
      : "accent-sky-400";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="min-w-[120px] font-mono text-lg font-extrabold italic text-amber-300">
        {label}{" "}
        <span className="ml-1 text-xs font-normal not-italic text-slate-400">{sub}</span> ={" "}
        <span className="rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 px-2 py-0.5 text-base font-extrabold text-slate-900">
          {fmt(value)}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-2 min-w-[180px] flex-1 cursor-pointer rounded-full ${trackCls}`}
        aria-label={`${label} ${sub}`}
      />
    </div>
  );
}

function QuickBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs font-bold text-slate-200 transition hover:border-amber-400/55 hover:bg-amber-400/15 hover:text-amber-200"
    >
      {children}
    </button>
  );
}

function Legend({
  dot,
  bar,
  band,
  children,
}: {
  dot?: string;
  bar?: string;
  band?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      {dot ? (
        <span
          className="inline-block h-3 w-3 rounded-full border-2 border-white"
          style={{ background: dot }}
          aria-hidden
        />
      ) : null}
      {bar ? (
        <span className="inline-block h-1 w-4" style={{ background: bar }} aria-hidden />
      ) : null}
      {band ? (
        <span
          className="inline-block h-3 w-4 rounded border border-amber-400/60"
          style={{ background: band }}
          aria-hidden
        />
      ) : null}
      <span>{children}</span>
    </span>
  );
}

function StatCol({
  title,
  tone,
  entries,
}: {
  title: string;
  tone: "sky" | "violet";
  entries: { k: string; v: string }[];
}) {
  const cls =
    tone === "sky"
      ? "border-sky-400/50 bg-sky-400/10"
      : "border-violet-400/50 bg-violet-400/10";
  const titleCls = tone === "sky" ? "text-sky-200" : "text-violet-200";
  return (
    <div className={`rounded-2xl border-2 p-3 ${cls}`}>
      <p
        className={`text-center font-mono text-base font-extrabold ${titleCls} break-all`}
      >
        {title}
      </p>
      <div className="mt-2 divide-y divide-white/10">
        {entries.map((e, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-1.5 font-mono text-sm"
          >
            <span className="text-slate-300">{e.k}</span>
            <span className="text-base font-extrabold text-amber-300">{e.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FmlChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-3 text-center font-mono text-sm font-bold text-amber-100">
      {children}
    </div>
  );
}

function ObsCard({
  tone,
  title,
  children,
}: {
  tone: "a" | "b";
  title: string;
  children: React.ReactNode;
}) {
  const cls =
    tone === "a"
      ? "border-l-4 border-l-violet-400 bg-violet-400/[0.06]"
      : "border-l-4 border-l-amber-400 bg-amber-400/[0.06]";
  const titleCls = tone === "a" ? "text-violet-200" : "text-amber-200";
  return (
    <div className={`flex flex-col gap-2 rounded-r-2xl border-y border-r border-white/10 p-3 ${cls}`}>
      <p className={`text-sm font-bold ${titleCls}`}>{title}</p>
      <div className="text-sm leading-7 text-slate-200">{children}</div>
    </div>
  );
}

function TryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 self-start rounded-lg border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs font-bold text-sky-200 transition hover:border-sky-400/55 hover:bg-sky-400/15 hover:text-sky-100"
    >
      {children}
    </button>
  );
}
