"use client";

import { useId, useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 수학 ─────────────────────────────────────────────────
const MAXN = 302;
const LF = (() => {
  const a = new Array(MAXN).fill(0);
  for (let i = 1; i < MAXN; i++) a[i] = a[i - 1] + Math.log(i);
  return a;
})();

function bPMF(k: number, n: number, p: number): number {
  if (k < 0 || k > n || n >= MAXN) return 0;
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  return Math.exp(LF[n] - LF[k] - LF[n - k] + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
function bCDF(b: number, n: number, p: number): number {
  let s = 0;
  for (let k = 0; k <= Math.min(b, n); k++) s += bPMF(k, n, p);
  return Math.min(1, s);
}
function nCDF(z: number): number {
  if (z > 8) return 1;
  if (z < -8) return 0;
  const a = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * a);
  const d = Math.exp((-a * a) / 2) / Math.sqrt(2 * Math.PI);
  const q =
    d *
    t *
    (0.319381530 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - q : q;
}
function nPDF(x: number, mu: number, si: number): number {
  return Math.exp(-0.5 * ((x - mu) / si) ** 2) / (si * Math.sqrt(2 * Math.PI));
}
function fmt(v: number, d = 2): string {
  return v.toFixed(d);
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "approx_condition",
    prompt:
      "이항분포 B(n, p)를 정규분포로 근사할 때 필요한 조건(np ≥ 5, n(1−p) ≥ 5)을 쓰고, 그 조건이 왜 필요한지 직접 슬라이더로 확인한 결과로 설명해 보세요.",
    kind: "text",
    placeholder: "예: np 또는 nq가 작으면 분포가 좌·우로 치우치고 종 모양이 아니라 근사가 부정확하다. 둘 다 5 이상이면 정규곡선과 막대가 거의 일치한다.",
  },
  {
    id: "continuity_correction",
    prompt:
      "연속성 보정(±½)이 왜 필요한지, 이산분포와 연속분포의 차이를 활용해 설명해 보세요.",
    kind: "text",
    placeholder: "예: 이항분포는 X=k 막대(폭 1)의 면적으로 확률을 표현하지만 정규분포는 곡선 아래 면적이라, k−½ ~ k+½ 사이를 잡아야 막대 1개의 면적을 정확히 덮을 수 있다.",
  },
];

// ─── 메인 ─────────────────────────────────────────────────
type TabKey = "sim" | "cc" | "calc";

export default function BinomNormalApprox() {
  const [tab, setTab] = useState<TabKey>("sim");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">📊 이항분포의 정규 근사</h3>
        <p className="mt-2 leading-7 text-slate-300">
          이항분포 <b className="text-indigo-300">B(n, p)</b>에서 n이 충분히 크면 정규분포{" "}
          <b className="text-amber-300">N(np, npq)</b>로 근사할 수 있습니다. 세 탭에서 직접 시뮬레이션·보정 비교·구간
          계산을 해 보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabBtn active={tab === "sim"} onClick={() => setTab("sim")}>🎯 정규 근사 시뮬레이터</TabBtn>
        <TabBtn active={tab === "cc"} onClick={() => setTab("cc")}>🔬 연속성 보정 탐구</TabBtn>
        <TabBtn active={tab === "calc"} onClick={() => setTab("calc")}>🧮 구간 확률 계산기</TabBtn>
      </div>

      <div className={tab === "sim" ? "mt-4" : "mt-4 hidden"}>
        <SimTab />
      </div>
      <div className={tab === "cc" ? "mt-4" : "mt-4 hidden"}>
        <CCTab />
      </div>
      <div className={tab === "calc" ? "mt-4" : "mt-4 hidden"}>
        <CalcTab />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl border border-amber-400/50 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-200"
          : "rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-400 hover:bg-white/10"
      }
    >
      {children}
    </button>
  );
}

// ═════════════════════════════════════════════════════════
// 탭 1: 정규 근사 시뮬레이터
// ═════════════════════════════════════════════════════════

const SIM_PRESETS = [
  { n: 10, p: 0.5 },
  { n: 30, p: 0.4 },
  { n: 50, p: 0.3 },
  { n: 100, p: 0.5 },
  { n: 200, p: 0.3 },
];

function SimTab() {
  const [n, setN] = useState(50);
  const [pPct, setPPct] = useState(30);
  const p = pPct / 100;
  const q = 1 - p;
  const mu = n * p;
  const si = Math.sqrt(n * p * q);
  const np = n * p;
  const nq = n * q;

  const valid = np >= 5 && nq >= 5;

  function setPreset(np2: number, pp: number) {
    setN(np2);
    setPPct(Math.round(pp * 100));
  }

  const obs = useMemo(() => {
    const o: { icon: string; html: string }[] = [];
    if (n < 20) o.push({ icon: "🔍", html: `n이 작을 때(n=${n}) 이항분포는 정규분포와 많이 다릅니다. n을 늘려보세요!` });
    else if (n >= 100) o.push({ icon: "🎯", html: `n이 충분히 크면(n=${n}) 이항분포의 막대가 정규곡선과 거의 일치합니다!` });
    else o.push({ icon: "📊", html: `n이 커질수록 이항분포가 정규분포에 점점 가까워지는 것을 확인하세요.` });
    if (Math.abs(p - 0.5) < 0.05) o.push({ icon: "⚖️", html: `p≈0.5이면 분포가 좌우 대칭으로 나타납니다.` });
    else if (p < 0.3) o.push({ icon: "📐", html: `p가 작으면(p=${fmt(p)}) 오른쪽으로 치우친 분포가 됩니다. n을 키워 보정해 보세요.` });
    else if (p > 0.7) o.push({ icon: "📐", html: `p가 크면(p=${fmt(p)}) 왼쪽으로 치우친 분포가 됩니다. n을 키워 보정해 보세요.` });
    o.push({ icon: "🔢", html: `μ=${fmt(mu, 2)},  σ=${fmt(si, 3)},  분산 σ²=${fmt(si * si, 2)}` });
    return o;
  }, [n, p, mu, si]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-amber-300">⚙️ 이항분포 B(n, p) 설정</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">프리셋 →</span>
          {SIM_PRESETS.map((ps) => (
            <button
              key={`${ps.n}-${ps.p}`}
              type="button"
              onClick={() => setPreset(ps.n, ps.p)}
              className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-bold text-slate-400 transition hover:border-amber-400/35 hover:bg-amber-400/15 hover:text-amber-200"
            >
              B({ps.n}, {ps.p})
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <RangeRow label="시행 횟수 n" tone="orange" value={n} display={String(n)} min={5} max={300} step={1} onChange={setN} />
          <RangeRow label="성공 확률 p" tone="violet" value={pPct} display={p.toFixed(2)} min={1} max={99} step={1} onChange={setPPct} />
        </div>
      </div>

      {/* 차트 */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-2">
        <BinomVsNormalSVG n={n} p={p} mu={mu} si={si} mode="basic" />
        <div className="mt-1 flex flex-wrap gap-4 px-2 pb-1 text-xs font-bold">
          <span className="text-indigo-300">■ 이항분포 B(n, p)</span>
          <span className="text-amber-300">— 정규 근사 N(μ, σ²)</span>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard tone="mu" lbl="μ = np" val={fmt(mu)} />
        <StatCard tone="si" lbl="σ = √(npq)" val={fmt(si, 3)} />
        <StatCard tone="np" lbl="np (≥5?)" val={fmt(np, 1)} />
        <StatCard tone="nq" lbl="n(1−p) (≥5?)" val={fmt(nq, 1)} />
      </div>

      {/* 유효성 */}
      <div
        className={
          valid
            ? "flex items-center gap-3 rounded-xl border-2 border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300"
            : "flex items-center gap-3 rounded-xl border-2 border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-300"
        }
      >
        <span className="text-xl">{valid ? "✅" : "❌"}</span>
        <span>
          {valid
            ? `정규 근사 조건 만족! np=${fmt(np, 1)} ≥ 5 이고 n(1−p)=${fmt(nq, 1)} ≥ 5 — n이 충분히 큽니다.`
            : `조건 불만족: np=${fmt(np, 1)}, n(1−p)=${fmt(nq, 1)} — np와 n(1−p)가 모두 5 이상이어야 합니다.`}
        </span>
      </div>

      {/* 관찰 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-pink-300">💡 탐구 관찰</p>
        <div className="mt-3 space-y-2">
          {obs.map((o, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <span className="text-xl leading-tight">{o.icon}</span>
              <p className="text-sm leading-6 text-slate-300" dangerouslySetInnerHTML={{ __html: o.html }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 탭 2: 연속성 보정 탐구
// ═════════════════════════════════════════════════════════

function CCTab() {
  const [n, setN] = useState(20);
  const [pPct, setPPct] = useState(50);
  const p = pPct / 100;
  // 범위 a, b는 0..n 클램프 + a ≤ b 보장 (핸들러에서 처리)
  const [a, setA] = useState(7);
  const [b, setB] = useState(13);

  function changeN(next: number) {
    setN(next);
    if (a > next) setA(next);
    if (b > next) setB(next);
  }
  function changeA(next: number) {
    setA(next);
    if (next > b) setB(next);
  }
  function changeB(next: number) {
    setB(next);
    if (next < a) setA(next);
  }

  const mu = n * p;
  const si = Math.sqrt(n * p * (1 - p));
  const exact = bCDF(b, n, p) - (a > 0 ? bCDF(a - 1, n, p) : 0);
  const nocc = nCDF((b - mu) / si) - nCDF((a - mu) / si);
  const cc = nCDF((b + 0.5 - mu) / si) - nCDF((a - 0.5 - mu) / si);
  const errNo = nocc - exact;
  const errCc = cc - exact;
  const ccBetter = Math.abs(errCc) < Math.abs(errNo);

  return (
    <div className="space-y-3">
      {/* 개념 설명 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-amber-300">🔬 왜 연속성 보정이 필요할까요?</p>
        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <span className="text-xl">📊</span>
            <p className="text-sm leading-6 text-slate-300">
              <b>이항분포</b>는 <em>이산</em> 확률변수입니다. 확률이 막대 하나하나에 담겨 있어요.
              반면 <b>정규분포</b>는 <em>연속</em> 확률변수로, 확률이 곡선 아래의 <em>넓이</em>로 표현됩니다.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <span className="text-xl">🎯</span>
            <p className="text-sm leading-6 text-slate-300">
              이항분포의 막대 하나(예: X=k)의 넓이는 <b>가로 1, 세로 P(X=k)</b>인 직사각형입니다. 정규곡선으로 이 넓이를 근사하려면{" "}
              <b>k−½ 부터 k+½ 까지의 면적</b>을 써야 합니다. 이렇게 ±½를 더해주는 것이{" "}
              <span className="font-bold text-emerald-300">연속성 보정(Continuity Correction)</span>입니다.
            </p>
          </div>
        </div>
      </div>

      {/* 설정 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-indigo-300">⚙️ 범위 설정 <span className="text-xs font-normal text-slate-500">(n과 p를 바꾸며 관찰)</span></p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <RangeRow label="시행 수 n" tone="orange" value={n} display={String(n)} min={10} max={100} step={1} onChange={changeN} />
          <RangeRow label="성공 확률 p" tone="violet" value={pPct} display={p.toFixed(2)} min={5} max={95} step={1} onChange={setPPct} />
          <RangeRow label="범위 하한 a" tone="green" value={a} display={String(a)} min={0} max={n} step={1} onChange={changeA} />
          <RangeRow label="범위 상한 b" tone="rose" value={b} display={String(b)} min={0} max={n} step={1} onChange={changeB} />
        </div>
      </div>

      {/* 차트 */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-2">
        <BinomVsNormalSVG n={n} p={p} mu={mu} si={si} mode="cc" a={a} b={b} />
        <div className="mt-1 flex flex-wrap gap-4 px-2 pb-1 text-[11px] font-bold">
          <LegSwatch color="bg-indigo-400/85">이항분포 막대</LegSwatch>
          <LegSwatch color="bg-sky-400/80">선택 범위 [a, b]</LegSwatch>
          <LegLine color="bg-rose-400" dashed>보정 없음 경계 (a, b+1)</LegLine>
          <LegLine color="bg-emerald-400">보정 있음 경계 (a−½, b+½)</LegLine>
        </div>
      </div>

      {/* 비교 결과 */}
      <div className="grid gap-2 sm:grid-cols-3">
        <ResultCard tone="exact" title="🎯 정확값 (이항분포)" val={fmt(exact, 6)} sub={`P(${a} ≤ X ≤ ${b})`} />
        <ResultCard
          tone="nocc"
          title="❌ 정규 근사 (보정 없음)"
          val={fmt(nocc, 6)}
          sub="P(a ≤ Y ≤ b)"
          err={errNo}
          errBetter={!ccBetter}
        />
        <ResultCard
          tone="cc"
          title="✅ 정규 근사 (연속성 보정)"
          val={fmt(cc, 6)}
          sub="P(a−½ ≤ Y ≤ b+½)"
          err={errCc}
          errBetter={ccBetter}
        />
      </div>

      {/* 계산 과정 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-slate-200">📐 계산 과정 비교</p>
        <div className="mt-3 space-y-2">
          <StepBox tone="exact" title="정확값">
            ∑ P(X=k) for k = {a} ~ {b}  =  <b>{fmt(exact, 6)}</b>
          </StepBox>
          <StepBox tone="nocc" title="보정 없음">
            Φ({fmt((b - mu) / si, 3)}) − Φ({fmt((a - mu) / si, 3)}) = <b>{fmt(nocc, 6)}</b>
          </StepBox>
          <StepBox tone="cc" title="연속성 보정">
            Φ(<sup>{b}+½−{fmt(mu, 2)}</sup>⁄{fmt(si, 3)}) − Φ(<sup>{a}−½−{fmt(mu, 2)}</sup>⁄{fmt(si, 3)}) = Φ({fmt((b + 0.5 - mu) / si, 3)}) − Φ({fmt((a - 0.5 - mu) / si, 3)}) = <b>{fmt(cc, 6)}</b>
          </StepBox>
        </div>
      </div>

      {/* 공식 정리 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-amber-300">📌 연속성 보정 공식 요약</p>
        <div className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
          <p>이항분포 X ~ B(n, p)를 Y ~ N(μ, σ²)로 근사할 때 (μ = np, σ = √(npq)):</p>
          <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <span className="font-bold text-rose-300">보정 없음:</span>  P(a ≤ X ≤ b) ≈ Φ(<sup>b − μ</sup>⁄σ) − Φ(<sup>a − μ</sup>⁄σ)
            <br /><span className="text-xs text-slate-500">→ 막대 경계를 정수 그대로 사용 → 불정확</span>
          </p>
          <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <span className="font-bold text-emerald-300">연속성 보정:</span>  P(a ≤ X ≤ b) ≈ Φ(<sup>b + ½ − μ</sup>⁄σ) − Φ(<sup>a − ½ − μ</sup>⁄σ)
            <br /><span className="text-xs text-slate-500">→ 막대 양 끝에 ½씩 더해 넓이를 맞춤 → 더 정확!</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 탭 3: 구간 확률 계산기
// ═════════════════════════════════════════════════════════

function CalcTab() {
  const [n, setN] = useState(100);
  const [pPct, setPPct] = useState(30);
  const p = pPct / 100;
  const [a, setA] = useState(25);
  const [b, setB] = useState(35);

  function changeN(next: number) {
    setN(next);
    if (a > next) setA(next);
    if (b > next) setB(next);
  }
  function changeA(next: number) {
    setA(next);
    if (next > b) setB(next);
  }
  function changeB(next: number) {
    setB(next);
    if (next < a) setA(next);
  }

  const mu = n * p;
  const si = Math.sqrt(n * p * (1 - p));
  const exact = bCDF(b, n, p) - (a > 0 ? bCDF(a - 1, n, p) : 0);
  const nocc = nCDF((b - mu) / si) - nCDF((a - mu) / si);
  const cc = nCDF((b + 0.5 - mu) / si) - nCDF((a - 0.5 - mu) / si);
  const eNc = nocc - exact;
  const eCc = cc - exact;
  const absNc = Math.abs(eNc);
  const absCc = Math.abs(eCc);
  const ccBetter = absCc < absNc;
  const improvement = absNc > 0 ? (((absNc - absCc) / absNc) * 100).toFixed(1) : "0";
  const maxV = Math.max(exact, nocc, cc, 0.001);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-amber-300">🧮 구간 확률 계산기 — P(a ≤ X ≤ b)</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <RangeRow label="시행 수 n" tone="orange" value={n} display={String(n)} min={10} max={300} step={1} onChange={changeN} />
          <RangeRow label="성공 확률 p" tone="violet" value={pPct} display={p.toFixed(2)} min={5} max={95} step={1} onChange={setPPct} />
          <RangeRow label="범위 하한 a" tone="green" value={a} display={String(a)} min={0} max={n} step={1} onChange={changeA} />
          <RangeRow label="범위 상한 b" tone="rose" value={b} display={String(b)} min={0} max={n} step={1} onChange={changeB} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard tone="mu" lbl="μ = np" val={fmt(mu)} />
        <StatCard tone="si" lbl="σ = √(npq)" val={fmt(si, 3)} />
        <StatCard tone="np" lbl="np" val={fmt(n * p, 1)} />
        <StatCard tone="nq" lbl="n(1−p)" val={fmt(n * (1 - p), 1)} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-2">
        <BinomVsNormalSVG n={n} p={p} mu={mu} si={si} mode="cc" a={a} b={b} />
      </div>

      {/* 결과 카드 + 진행막대 */}
      <div className="grid gap-2 sm:grid-cols-3">
        <CalcResult tone="exact" title="🎯 정확값" val={fmt(exact, 5)} sub={`P(${a} ≤ X ≤ ${b})`} barPct={(exact / maxV) * 100} />
        <CalcResult tone="nocc" title="❌ 보정 없음" val={fmt(nocc, 5)} sub="P(a ≤ Y ≤ b)" err={eNc} errBetter={!ccBetter} barPct={(nocc / maxV) * 100} />
        <CalcResult tone="cc" title="✅ 연속성 보정" val={fmt(cc, 5)} sub="P(a−½ ≤ Y ≤ b+½)" err={eCc} errBetter={ccBetter} barPct={(cc / maxV) * 100} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-slate-200">📐 계산 단계별 보기</p>
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm leading-7 text-slate-300">
          <span className="text-xl">📌</span>
          <span>
            μ = {fmt(mu, 2)}, σ = {fmt(si, 3)}<br />
            <span className="text-rose-300">보정 없음:</span> z<sub>a</sub> = {fmt((a - mu) / si, 3)}, z<sub>b</sub> = {fmt((b - mu) / si, 3)} → Φ({fmt((b - mu) / si, 3)}) − Φ({fmt((a - mu) / si, 3)}) = <b>{fmt(nocc, 5)}</b>
            <br />
            <span className="text-emerald-300">연속 보정:</span> z<sub>a</sub> = {fmt((a - 0.5 - mu) / si, 3)}, z<sub>b</sub> = {fmt((b + 0.5 - mu) / si, 3)} → Φ({fmt((b + 0.5 - mu) / si, 3)}) − Φ({fmt((a - 0.5 - mu) / si, 3)}) = <b>{fmt(cc, 5)}</b>
          </span>
        </div>
        <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm leading-7 text-amber-100">
          {ccBetter
            ? <>✅ 연속성 보정을 사용하면 오차가 <b>{fmt(absNc, 5)}</b> → <b>{fmt(absCc, 5)}</b>로 줄어듭니다! (약 {improvement}% 개선)</>
            : <>이 경우 보정 없는 근사의 오차({fmt(absNc, 5)})와 보정 있는 근사의 오차({fmt(absCc, 5)})가 비슷합니다.</>}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 공용 컴포넌트
// ═════════════════════════════════════════════════════════

function RangeRow({
  label, tone, value, display, min, max, step, onChange,
}: {
  label: string;
  tone: "orange" | "violet" | "green" | "rose";
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const accent =
    tone === "orange" ? "accent-amber-500"
    : tone === "violet" ? "accent-violet-500"
    : tone === "green" ? "accent-emerald-500"
    : "accent-rose-500";
  const badge =
    tone === "orange" ? "from-amber-500 to-rose-500"
    : tone === "violet" ? "from-indigo-500 to-violet-500"
    : tone === "green" ? "from-emerald-500 to-cyan-500"
    : "from-rose-500 to-orange-500";
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex items-center justify-between text-xs font-bold text-slate-300">
        <span>{label}</span>
        <span
          key={display}
          className={`min-w-[60px] animate-[pulseR_0.3s_ease] rounded-md bg-gradient-to-r ${badge} px-2.5 py-0.5 text-center font-mono text-base font-extrabold text-white`}
        >
          {display}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-1.5 w-full cursor-pointer rounded-full ${accent} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40`}
      />
    </div>
  );
}

function StatCard({ tone, lbl, val }: { tone: "mu" | "si" | "np" | "nq"; lbl: string; val: string }) {
  const cls = tone === "mu" ? { box: "border-amber-400/45 bg-amber-400/[0.07]", v: "text-amber-300" }
            : tone === "si" ? { box: "border-emerald-400/45 bg-emerald-400/[0.07]", v: "text-emerald-300" }
            : tone === "np" ? { box: "border-indigo-400/45 bg-indigo-400/[0.07]", v: "text-indigo-300" }
            : { box: "border-pink-400/45 bg-pink-400/[0.07]", v: "text-pink-300" };
  return (
    <div className={`rounded-2xl border-2 px-3 py-2.5 text-center ${cls.box}`}>
      <p key={val} className={`animate-[pulseR_0.3s_ease] font-mono text-lg font-black ${cls.v}`}>{val}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{lbl}</p>
    </div>
  );
}

function ResultCard({
  tone, title, val, sub, err, errBetter,
}: { tone: "exact" | "nocc" | "cc"; title: string; val: string; sub: string; err?: number; errBetter?: boolean }) {
  const cls = tone === "exact" ? { box: "border-indigo-400/45 bg-indigo-400/10", title: "text-indigo-300", val: "text-violet-300" }
            : tone === "nocc" ? { box: "border-rose-400/45 bg-rose-400/10", title: "text-rose-300", val: "text-rose-400" }
            : { box: "border-emerald-400/45 bg-emerald-400/10", title: "text-emerald-300", val: "text-emerald-400" };
  return (
    <div className={`rounded-2xl border-2 px-4 py-3 text-center ${cls.box}`}>
      <p className={`text-[11px] font-bold uppercase tracking-wider ${cls.title}`}>{title}</p>
      <p key={val} className={`mt-1 animate-[pulseR_0.3s_ease] font-mono text-xl font-black ${cls.val}`}>{val}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
      {err !== undefined ? (
        <p className={`mt-1 inline-block rounded-md border px-2 py-0.5 text-xs font-bold ${
          errBetter ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300" : "border-rose-400/30 bg-rose-400/15 text-rose-300"
        }`}>
          오차 {err >= 0 ? "+" : ""}{fmt(err, 6)}
        </p>
      ) : null}
    </div>
  );
}

function CalcResult({
  tone, title, val, sub, err, errBetter, barPct,
}: {
  tone: "exact" | "nocc" | "cc";
  title: string;
  val: string;
  sub: string;
  err?: number;
  errBetter?: boolean;
  barPct: number;
}) {
  const cls = tone === "exact" ? { box: "border-indigo-400/45 bg-indigo-400/10", title: "text-indigo-300", val: "text-violet-300", bar: "fill-indigo-500" }
            : tone === "nocc" ? { box: "border-rose-400/45 bg-rose-400/10", title: "text-rose-300", val: "text-rose-400", bar: "fill-rose-500" }
            : { box: "border-emerald-400/45 bg-emerald-400/10", title: "text-emerald-300", val: "text-emerald-400", bar: "fill-emerald-500" };
  return (
    <div className={`rounded-2xl border-2 px-4 py-3 text-center ${cls.box}`}>
      <p className={`text-[11px] font-bold uppercase tracking-wider ${cls.title}`}>{title}</p>
      <p key={val} className={`mt-1 animate-[pulseR_0.3s_ease] font-mono text-xl font-black ${cls.val}`}>{val}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
      {err !== undefined ? (
        <p className={`mt-1 text-xs font-bold ${errBetter ? "text-emerald-300" : "text-rose-300"}`}>
          오차 {err >= 0 ? "+" : ""}{fmt(err, 6)}
        </p>
      ) : null}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <svg viewBox="0 0 100 2" preserveAspectRatio="none" className="block h-full w-full">
          <rect x={0} y={0} width={Math.max(0, Math.min(100, barPct))} height={2} className={cls.bar} />
        </svg>
      </div>
    </div>
  );
}

function StepBox({ tone, title, children }: { tone: "exact" | "nocc" | "cc"; title: string; children: React.ReactNode }) {
  const cls = tone === "exact" ? "border-l-indigo-400/55"
            : tone === "nocc" ? "border-l-rose-400/55"
            : "border-l-emerald-400/55";
  const titleColor = tone === "exact" ? "text-indigo-300" : tone === "nocc" ? "text-rose-300" : "text-emerald-300";
  return (
    <div className={`rounded-r-lg border-l-4 bg-white/[0.03] px-4 py-2.5 text-sm leading-7 text-slate-300 ${cls}`}>
      <p className={`text-[10px] font-extrabold uppercase tracking-wider ${titleColor}`}>{title}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function LegSwatch({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-300">
      <span className={`inline-block h-3 w-3 rounded-sm ${color}`} />
      {children}
    </span>
  );
}
function LegLine({ color, dashed = false, children }: { color: string; dashed?: boolean; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-300">
      <span className={`inline-block h-0.5 w-5 ${color} ${dashed ? "opacity-70" : ""}`} />
      {children}
    </span>
  );
}

// ═════════════════════════════════════════════════════════
// SVG 차트
// ═════════════════════════════════════════════════════════

function BinomVsNormalSVG({
  n, p, mu, si, mode, a, b,
}: {
  n: number;
  p: number;
  mu: number;
  si: number;
  mode: "basic" | "cc";
  a?: number;
  b?: number;
}) {
  const W = 760;
  const H = 290;
  const PAD = { l: 48, r: 18, t: 22, b: 36 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const baseY = PAD.t + cH;

  const kMin = Math.max(0, Math.floor(mu - 4.5 * si));
  const kMax = Math.min(n, Math.ceil(mu + 4.5 * si));
  const nBars = Math.max(1, kMax - kMin + 1);

  const probs = useMemo(() => {
    const arr: number[] = [];
    for (let k = kMin; k <= kMax; k++) arr.push(bPMF(k, n, p));
    return arr;
  }, [n, p, kMin, kMax]);
  const maxP = Math.max(...probs, 1e-12);
  const yMax = maxP * 1.28;

  function toX(k: number) {
    return PAD.l + ((k - kMin + 0.5) / nBars) * cW;
  }
  function toY(y: number) {
    return PAD.t + cH * (1 - Math.min(y, yMax) / yMax);
  }
  const barW = Math.max(1.5, (cW / nBars) * 0.82);

  // 정규 곡선 path (samples)
  const curveSamples = 320;
  const curvePath = useMemo(() => {
    const parts: string[] = [];
    for (let i = 0; i <= curveSamples; i++) {
      const px = (i / curveSamples) * cW;
      const xv = kMin + (px / cW) * nBars - 0.5;
      const yv = nPDF(xv, mu, si);
      parts.push(`${i === 0 ? "M" : "L"} ${(PAD.l + px).toFixed(2)} ${toY(yv).toFixed(2)}`);
    }
    return parts.join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, p, mu, si, kMin, kMax]);

  // 정규 채우기 path (전체)
  const fillPath = useMemo(() => {
    const parts: string[] = [];
    parts.push(`M ${PAD.l} ${baseY}`);
    for (let i = 0; i <= curveSamples; i++) {
      const px = (i / curveSamples) * cW;
      const xv = kMin + (px / cW) * nBars - 0.5;
      const yv = nPDF(xv, mu, si);
      parts.push(`L ${(PAD.l + px).toFixed(2)} ${toY(yv).toFixed(2)}`);
    }
    parts.push(`L ${PAD.l + cW} ${baseY}`);
    parts.push("Z");
    return parts.join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, p, mu, si, kMin, kMax]);

  // CC 모드 부분 영역
  function partialFill(loX: number, hiX: number): string {
    if (loX >= hiX) return "";
    const parts: string[] = [];
    parts.push(`M ${toX(loX - 0.5).toFixed(2)} ${baseY}`);
    const samples = 120;
    for (let i = 0; i <= samples; i++) {
      const xv = loX + (i / samples) * (hiX - loX);
      const yv = nPDF(xv, mu, si);
      parts.push(`L ${toX(xv - 0.5).toFixed(2)} ${toY(yv).toFixed(2)}`);
    }
    parts.push(`L ${toX(hiX - 0.5).toFixed(2)} ${baseY}`);
    parts.push("Z");
    return parts.join(" ");
  }

  const step = Math.max(1, Math.round(nBars / 10));
  const uid = useId().replace(/[:]/g, "");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="이항분포 vs 정규 근사">
      <defs>
        <linearGradient id={`bg_${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0f1a" />
          <stop offset="1" stopColor="#060810" />
        </linearGradient>
        <linearGradient id={`bar_${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(99,102,241,0.95)" />
          <stop offset="1" stopColor="rgba(99,102,241,0.35)" />
        </linearGradient>
        <linearGradient id={`bar2_${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(56,189,248,0.95)" />
          <stop offset="1" stopColor="rgba(56,189,248,0.35)" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#bg_${uid})`} />

      {/* μ±σ 영역 (basic만) */}
      {mode === "basic" ? (
        <rect
          x={Math.max(PAD.l, toX(mu - si))}
          y={PAD.t}
          width={Math.max(0, Math.min(PAD.l + cW, toX(mu + si)) - Math.max(PAD.l, toX(mu - si)))}
          height={cH}
          fill="rgba(16,185,129,0.07)"
        />
      ) : null}

      {/* 정규 채우기 */}
      {mode === "basic" ? (
        <path d={fillPath} fill="rgba(245,158,11,0.08)" />
      ) : a !== undefined && b !== undefined ? (
        <>
          <path d={partialFill(a - 0.5, b + 0.5)} fill="rgba(16,185,129,0.15)" />
          <path d={partialFill(a, b)} fill="rgba(239,68,68,0.15)" />
        </>
      ) : null}

      {/* 막대 */}
      {probs.map((v, i) => {
        const k = kMin + i;
        const bx = toX(k) - barW / 2;
        const by = toY(v);
        const bh = baseY - by;
        const inRange = mode === "cc" && a !== undefined && b !== undefined && k >= a && k <= b;
        const fillId = inRange ? `bar2_${uid}` : `bar_${uid}`;
        return <rect key={i} x={bx} y={by} width={barW} height={bh} fill={`url(#${fillId})`} stroke={inRange ? "rgba(125,211,252,0.4)" : "rgba(165,180,252,0.25)"} strokeWidth={0.5} />;
      })}

      {/* 정규 곡선 */}
      <path d={curvePath} fill="none" stroke="#f59e0b" strokeWidth={2.5} />

      {/* μ 점선 */}
      <line x1={toX(mu)} y1={PAD.t} x2={toX(mu)} y2={baseY} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} strokeDasharray="5 4" />
      <text x={toX(mu)} y={PAD.t + 13} textAnchor="middle" fontSize={11} fontWeight={700} fill="rgba(255,255,255,0.85)">μ</text>

      {/* CC 모드 경계선 */}
      {mode === "cc" && a !== undefined && b !== undefined ? (
        <>
          <line x1={toX(a)} y1={PAD.t} x2={toX(a)} y2={baseY} stroke="rgba(239,68,68,0.85)" strokeWidth={1.8} strokeDasharray="5 4" />
          <line x1={toX(b + 1)} y1={PAD.t} x2={toX(b + 1)} y2={baseY} stroke="rgba(239,68,68,0.85)" strokeWidth={1.8} strokeDasharray="5 4" />
          <line x1={toX(a - 0.5)} y1={PAD.t} x2={toX(a - 0.5)} y2={baseY} stroke="rgba(16,185,129,0.95)" strokeWidth={2.2} />
          <line x1={toX(b + 0.5)} y1={PAD.t} x2={toX(b + 0.5)} y2={baseY} stroke="rgba(16,185,129,0.95)" strokeWidth={2.2} />
          <text x={toX(a)} y={PAD.t + 10} textAnchor="middle" fontSize={10} fontWeight={700} fill="rgba(239,68,68,0.9)">a={a}</text>
          <text x={toX(b + 1)} y={PAD.t + 10} textAnchor="middle" fontSize={10} fontWeight={700} fill="rgba(239,68,68,0.9)">b={b}</text>
          <text x={toX(a - 0.5)} y={PAD.t + 22} textAnchor="middle" fontSize={10} fontWeight={700} fill="rgba(16,185,129,0.9)">a−½</text>
          <text x={toX(b + 0.5)} y={PAD.t + 22} textAnchor="middle" fontSize={10} fontWeight={700} fill="rgba(16,185,129,0.9)">b+½</text>
        </>
      ) : null}

      {/* x축 */}
      <line x1={PAD.l} y1={baseY} x2={W - PAD.r} y2={baseY} stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      {Array.from({ length: nBars }, (_, i) => {
        const k = kMin + i;
        if ((k - kMin) % step !== 0) return null;
        return <text key={k} x={toX(k)} y={baseY + 16} textAnchor="middle" fontSize={11} fill="rgba(71,85,105,1)">{k}</text>;
      })}

      {/* y축 */}
      {[1, 2, 3].map((i) => {
        const yv = (maxP * i) / 3.5;
        return (
          <g key={i}>
            <line x1={PAD.l} y1={toY(yv)} x2={W - PAD.r} y2={toY(yv)} stroke="rgba(255,255,255,0.04)" />
            <text x={PAD.l - 5} y={toY(yv) + 4} textAnchor="end" fontSize={10} fill="rgba(71,85,105,1)">{fmt(yv, 3)}</text>
          </g>
        );
      })}
    </svg>
  );
}
