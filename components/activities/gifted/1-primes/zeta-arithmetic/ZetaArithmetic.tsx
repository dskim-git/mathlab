"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ─── 산술함수 헬퍼 (multiplicative-functions 활동에서 재사용 가능) ─────
function primeFactors(n: number): Record<number, number> {
  if (n <= 1) return {};
  const f: Record<number, number> = {};
  let t = n;
  for (let p = 2; p * p <= t; p++) {
    while (t % p === 0) {
      f[p] = (f[p] || 0) + 1;
      t = Math.floor(t / p);
    }
  }
  if (t > 1) f[t] = (f[t] || 0) + 1;
  return f;
}

function mobius(n: number): number {
  if (n === 1) return 1;
  const f = primeFactors(n);
  if (Object.values(f).some((e) => e > 1)) return 0;
  return Math.pow(-1, Object.keys(f).length);
}

function eulerPhi(n: number): number {
  if (n === 1) return 1;
  const f = primeFactors(n);
  let v = 1;
  for (const [pStr, e] of Object.entries(f)) {
    const p = Number(pStr);
    v *= Math.pow(p, e) * (1 - 1 / p);
  }
  return Math.round(v);
}

function tau(n: number): number {
  if (n === 1) return 1;
  return Object.values(primeFactors(n)).reduce((a, e) => a * (e + 1), 1);
}

function sigma(n: number): number {
  if (n === 1) return 1;
  const f = primeFactors(n);
  let v = 1;
  for (const [pStr, e] of Object.entries(f)) {
    const p = Number(pStr);
    v *= (Math.pow(p, e + 1) - 1) / (p - 1);
  }
  return Math.round(v);
}

function divisors(n: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i);
  return out;
}

function isPrime(n: number): boolean {
  if (n < 2) return 2 === 0;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

type TabKey = "relation" | "table" | "game" | "dirichlet";

export default function ZetaArithmetic() {
  const [tab, setTab] = useState<TabKey>("relation");
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-5 text-center">
        <h2 className="text-2xl font-extrabold text-amber-300">
          🧩 제타함수와 산술함수의 관계
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          1/ζ(s), ζ(s−1)/ζ(s), ζ(s)², ζ(s)·ζ(s−1) 과 μ, φ, τ, σ 의 신비로운
          연결을 탐구해보세요.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {(
          [
            { key: "relation", label: "🔗 관계 탐구" },
            { key: "table", label: "📊 함수 테이블" },
            { key: "game", label: "🎮 퀴즈 게임" },
            { key: "dirichlet", label: "🧩 디리클레 급수" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              "rounded-full border-2 px-4 py-1.5 text-sm font-bold transition " +
              (tab === t.key
                ? "border-amber-400 bg-amber-400 text-slate-900"
                : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className={tab === "relation" ? "" : "hidden"}>
        <RelationTab active={tab === "relation"} />
      </section>
      <section className={tab === "table" ? "" : "hidden"}>
        <TableTab />
      </section>
      <section className={tab === "game" ? "" : "hidden"}>
        <GameTab />
      </section>
      <section className={tab === "dirichlet" ? "" : "hidden"}>
        <DirichletTab active={tab === "dirichlet"} />
      </section>
    </div>
  );
}

// ─── 탭 1: 관계 탐구 ──────────────────────────────────────────
const QUICK_NS = [1, 2, 6, 12, 30, 36] as const;
type VizFunc = "mu" | "phi" | "tau" | "sigma";
const VIZ_COLORS: Record<VizFunc, string> = {
  mu: "#f87171",
  phi: "#a78bfa",
  tau: "#60a5fa",
  sigma: "#34d399",
};

function RelationTab({ active }: { active: boolean }) {
  return (
    <div className="space-y-4">
      <CoreFormulasCard />
      <NDetailCard />
      <BarChartCard active={active} />
    </div>
  );
}

function CoreFormulasCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-3 text-base font-bold text-white">🌟 핵심 공식 4 개</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormulaCard
          color="rose"
          number="①"
          title="뫼비우스 함수 μ(n)"
          eq="1/ζ(s) = Σ μ(n)/nˢ"
        >
          ζ(s) 의 역수 = μ(n) 의 디리클레 급수
          <br />
          • μ(1)=1
          <br />
          • μ(n)=(−1)<sup>k</sup>, n 이 서로 다른 소수 k 개의 곱
          <br />• μ(n)=0, n 이 제곱수 인수를 가질 때
        </FormulaCard>
        <FormulaCard
          color="violet"
          number="②"
          title="오일러 파이 함수 φ(n)"
          eq="ζ(s−1)/ζ(s) = Σ φ(n)/nˢ"
        >
          ζ(s−1) 과 ζ(s) 의 비 = φ(n) 의 급수
          <br />
          • φ(n) = n · ∏ (1 − 1/p)
          <br />• φ(n): 1 ~ n 중 n 과 서로소인 수의 개수
        </FormulaCard>
        <FormulaCard
          color="blue"
          number="③"
          title="약수 개수 τ(n)"
          eq="[ζ(s)]² = Σ τ(n)/nˢ"
        >
          ζ(s) 의 제곱 = τ(n) 의 급수
          <br />
          • τ(n) = (α₁+1)(α₂+1) ··· (α<sub>k</sub>+1)
          <br />• τ(n): n 의 양의 약수의 개수
        </FormulaCard>
        <FormulaCard
          color="emerald"
          number="④"
          title="약수 합 σ(n)"
          eq="ζ(s) · ζ(s−1) = Σ σ(n)/nˢ"
        >
          ζ(s) × ζ(s−1) = σ(n) 의 급수
          <br />
          • σ(n) = 1 + d₁ + d₂ + ··· + n
          <br />• σ(n): n 의 양의 약수의 합
        </FormulaCard>
      </div>
    </div>
  );
}

function FormulaCard({
  color,
  number,
  title,
  eq,
  children,
}: {
  color: "rose" | "violet" | "blue" | "emerald";
  number: string;
  title: string;
  eq: string;
  children: React.ReactNode;
}) {
  const bg = {
    rose: "border-rose-400/40 bg-rose-500/10",
    violet: "border-violet-400/40 bg-violet-500/10",
    blue: "border-blue-400/40 bg-blue-500/10",
    emerald: "border-emerald-400/40 bg-emerald-500/10",
  }[color];
  const text = {
    rose: "text-rose-300",
    violet: "text-violet-300",
    blue: "text-blue-300",
    emerald: "text-emerald-300",
  }[color];
  return (
    <div className={"rounded-xl border-2 p-4 " + bg}>
      <div className={"text-sm font-bold " + text}>
        {number} {title}
      </div>
      <div className="my-2 rounded-md bg-slate-900/60 px-3 py-2 text-center font-mono text-sm font-bold text-slate-100">
        {eq}
      </div>
      <div className="text-xs leading-relaxed text-slate-400">{children}</div>
    </div>
  );
}

function NDetailCard() {
  const [n, setN] = useState<number>(12);
  const f = primeFactors(n);
  const muV = mobius(n);
  const phiV = eulerPhi(n);
  const tauV = tau(n);
  const sigV = sigma(n);
  const divs = divisors(n);
  const ps = Object.keys(f).map(Number);
  const isPerfect = sigV === 2 * n && n > 1;
  const hasSquare = Object.values(f).some((e) => e >= 2);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-3 text-base font-bold text-white">
        🔢 n 을 골라 직접 계산해 보자!
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-300">n =</label>
        <input
          type="range"
          min={1}
          max={36}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="flex-1 min-w-[160px]"
          aria-label="n"
        />
        <span className="min-w-[2.5rem] text-center text-2xl font-extrabold text-amber-300">
          {n}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_NS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setN(q)}
              className={
                "rounded-md px-2.5 py-1 text-sm font-bold transition " +
                (n === q
                  ? "bg-amber-400 text-slate-900"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700")
              }
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailCard color="rose" title={`μ(${n}) = ${muV}`}>
          <Step>
            n ={" "}
            {ps.length === 0 ? (
              <b className="text-amber-300">1</b>
            ) : (
              ps.map((p) => (
                <span key={p} className="font-bold text-amber-300">
                  {p}
                  {f[p] > 1 ? <sup>{f[p]}</sup> : null}
                  <span className="mx-1 text-slate-500">×</span>
                </span>
              ))
            )}
          </Step>
          {hasSquare ? (
            <Step>
              제곱인수 포함 →{" "}
              <b className="text-amber-300">μ = 0</b>
            </Step>
          ) : ps.length === 0 ? (
            <Step>μ(1) = 1 (정의)</Step>
          ) : (
            <Step>
              서로 다른 소수{" "}
              <b className="text-amber-300">{ps.length}개</b> → (−1)
              <sup>{ps.length}</sup> ={" "}
              <b className="text-amber-300">{muV}</b>
            </Step>
          )}
          <Step muted>공식: 1/ζ(s) = Σ μ(n)/nˢ</Step>
        </DetailCard>

        <DetailCard color="violet" title={`φ(${n}) = ${phiV}`}>
          {ps.length === 0 ? (
            <Step>φ(1) = 1 (정의)</Step>
          ) : (
            <Step>
              φ({n}) = {n}{" "}
              {ps.map((p) => (
                <span key={p}>
                  <span className="text-slate-500"> × </span>
                  (1 − 1/{p})
                </span>
              ))}{" "}
              = <b className="text-amber-300">{phiV}</b>
            </Step>
          )}
          <Step muted>
            1 ~ {n} 중 {n} 과 서로소: {phiV}개
          </Step>
          <Step muted>공식: ζ(s−1)/ζ(s) = Σ φ(n)/nˢ</Step>
        </DetailCard>

        <DetailCard color="blue" title={`τ(${n}) = ${tauV}`}>
          <Step>약수: {divs.join(", ")}</Step>
          {ps.length === 0 ? (
            <Step>τ(1) = 1</Step>
          ) : (
            <Step>
              ({Object.values(f).map((e) => `${e}+1`).join(")(")}) ={" "}
              <b className="text-amber-300">{tauV}</b>
            </Step>
          )}
          <Step muted>공식: [ζ(s)]² = Σ τ(n)/nˢ</Step>
        </DetailCard>

        <DetailCard color="emerald" title={`σ(${n}) = ${sigV}`}>
          <Step>
            {divs.join(" + ")} ={" "}
            <b className="text-amber-300">{sigV}</b>
          </Step>
          {isPerfect ? (
            <Step>
              <b className="text-amber-300">🌟 완전수! σ(n) = 2n</b>
            </Step>
          ) : null}
          <Step muted>공식: ζ(s) · ζ(s−1) = Σ σ(n)/nˢ</Step>
        </DetailCard>
      </div>
    </div>
  );
}

function DetailCard({
  color,
  title,
  children,
}: {
  color: "rose" | "violet" | "blue" | "emerald";
  title: string;
  children: React.ReactNode;
}) {
  const bg = {
    rose: "border-rose-400/40 bg-rose-500/10",
    violet: "border-violet-400/40 bg-violet-500/10",
    blue: "border-blue-400/40 bg-blue-500/10",
    emerald: "border-emerald-400/40 bg-emerald-500/10",
  }[color];
  const text = {
    rose: "text-rose-300",
    violet: "text-violet-300",
    blue: "text-blue-300",
    emerald: "text-emerald-300",
  }[color];
  return (
    <div className={"rounded-xl border-2 p-4 " + bg}>
      <div className={"mb-2 text-base font-bold " + text}>{title}</div>
      <div className="space-y-1.5 text-sm leading-relaxed text-slate-300">
        {children}
      </div>
    </div>
  );
}

function Step({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg bg-slate-900/60 px-3 py-2 " +
        (muted ? "text-[11px] text-slate-500" : "")
      }
    >
      {children}
    </div>
  );
}

function BarChartCard({ active }: { active: boolean }) {
  const [func, setFunc] = useState<VizFunc>("tau");
  const vals = useMemo(() => {
    const out: number[] = [];
    for (let n = 1; n <= 20; n++) {
      out.push(
        func === "mu"
          ? mobius(n)
          : func === "phi"
            ? eulerPhi(n)
            : func === "tau"
              ? tau(n)
              : sigma(n),
      );
    }
    return out;
  }, [func]);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-3 text-base font-bold text-white">
        📈 n = 1 ~ 20 함수값 비교
      </div>
      <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-400">
        {(["mu", "phi", "tau", "sigma"] as VizFunc[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFunc(f)}
            className={
              "rounded-md px-3 py-1 text-sm font-bold transition " +
              (func === f
                ? "text-slate-900"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700")
            }
            style={
              func === f ? { backgroundColor: VIZ_COLORS[f] } : undefined
            }
          >
            {f === "mu"
              ? "μ(n)"
              : f === "phi"
                ? "φ(n)"
                : f === "tau"
                  ? "τ(n)"
                  : "σ(n)"}
          </button>
        ))}
        <span className="ml-2 flex items-center gap-1 text-amber-300">
          ● 소수 강조
        </span>
      </div>
      <BarCanvas vals={vals} func={func} active={active} />
      <p className="mt-1 text-center text-xs text-slate-500">
        n = 1, 2, 3, …, 20
      </p>
    </div>
  );
}

function BarCanvas({
  vals,
  func,
  active,
}: {
  vals: number[];
  func: VizFunc;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(360, wrap.clientWidth - 20);
    const H = 200;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    const N = vals.length;
    const maxV = Math.max(...vals.map(Math.abs), 1);
    const minV = Math.min(...vals);
    const barW = (W - 40) / N;
    const zeroY = minV < 0 ? H * 0.65 : H - 30;
    const col = VIZ_COLORS[func];

    // 0 선
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, zeroY);
    ctx.lineTo(W - 20, zeroY);
    ctx.stroke();

    for (let i = 0; i < N; i++) {
      const n = i + 1;
      const v = vals[i];
      const barH = (Math.abs(v) / maxV) * (minV < 0 ? H * 0.55 : H - 50);
      const x = 20 + i * barW + 2;
      const w = barW - 4;
      const y = v >= 0 ? zeroY - barH : zeroY;

      ctx.fillStyle = isPrime(n) ? "#fbbf24" : col;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x, y, w, barH);
      ctx.globalAlpha = 1;

      // 값
      ctx.fillStyle = "#e2e8f0";
      ctx.font = `bold ${barW > 22 ? 10 : 8}px sans-serif`;
      ctx.textAlign = "center";
      if (v >= 0) ctx.fillText(String(v), x + w / 2, Math.max(y - 2, 10));
      else ctx.fillText(String(v), x + w / 2, y + barH + 12);

      // n 라벨
      ctx.fillStyle = "#64748b";
      ctx.font = "9px sans-serif";
      ctx.fillText(String(n), x + w / 2, H - 4);
    }
  }, [vals, func, active]);

  return (
    <div ref={wrapRef} className="rounded-lg border border-white/10 p-2">
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── 탭 2: 함수 테이블 ────────────────────────────────────────
function factStr(n: number): string {
  if (n === 1) return "1";
  return Object.entries(primeFactors(n))
    .map(([p, e]) => (e > 1 ? `${p}^${e}` : p))
    .join("·");
}

function TableTab() {
  const [sel, setSel] = useState<number | null>(null);

  const rows = useMemo(() => {
    const arr: {
      n: number;
      mu: number;
      phi: number;
      tau: number;
      sigma: number;
      prime: boolean;
      perfect: boolean;
    }[] = [];
    for (let n = 1; n <= 50; n++) {
      const muV = mobius(n);
      const phiV = eulerPhi(n);
      const tauV = tau(n);
      const sigV = sigma(n);
      arr.push({
        n,
        mu: muV,
        phi: phiV,
        tau: tauV,
        sigma: sigV,
        prime: isPrime(n),
        perfect: sigV === 2 * n && n > 1,
      });
    }
    return arr;
  }, []);

  const selRow = sel != null ? rows.find((r) => r.n === sel) ?? null : null;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-2 text-base font-bold text-white">
        📊 산술함수 값 테이블 (n = 1 ~ 50)
      </div>
      <p className="mb-2 text-xs text-slate-400">
        소수행은 🟢, 완전수(σ=2n) 는 🌟 표시. 행을 클릭하면 상세 계산을 볼 수
        있어요.
      </p>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm border border-emerald-700/60 bg-emerald-900/60" />
          소수
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm border border-amber-500/40 bg-amber-900/50" />
          완전수
        </span>
      </div>

      <div className="max-h-[480px] overflow-auto rounded-xl border border-white/10">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-800 text-white">
              <th className="px-3 py-2 text-center">n</th>
              <th className="px-3 py-2 text-center">소인수분해</th>
              <th className="px-3 py-2 text-center text-rose-300">μ(n)</th>
              <th className="px-3 py-2 text-center text-violet-300">φ(n)</th>
              <th className="px-3 py-2 text-center text-blue-300">τ(n)</th>
              <th className="px-3 py-2 text-center text-emerald-300">σ(n)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isSel = r.n === sel;
              const bg = isSel
                ? "bg-amber-500/20"
                : r.perfect
                  ? "bg-amber-900/50"
                  : r.prime
                    ? "bg-emerald-900/60"
                    : r.n % 2 === 0
                      ? "bg-slate-900/40"
                      : "bg-slate-900/20";
              const muColor =
                r.mu > 0
                  ? "text-emerald-300"
                  : r.mu < 0
                    ? "text-rose-300"
                    : "text-slate-500";
              const muSym = r.mu > 0 ? "+1" : r.mu < 0 ? "−1" : "0";
              return (
                <tr
                  key={r.n}
                  onClick={() => setSel(r.n)}
                  className={
                    "cursor-pointer border-b border-white/5 transition hover:bg-amber-500/10 " +
                    bg
                  }
                >
                  <td className="px-3 py-1.5 text-center font-bold text-slate-100">
                    {r.perfect ? "🌟 " : r.prime ? "🟢 " : ""}
                    {r.n}
                  </td>
                  <td className="px-3 py-1.5 text-center text-xs text-slate-400">
                    {factStr(r.n)}
                  </td>
                  <td className={"px-3 py-1.5 text-center font-bold " + muColor}>
                    {muSym}
                  </td>
                  <td className="px-3 py-1.5 text-center font-bold text-violet-300">
                    {r.phi}
                  </td>
                  <td className="px-3 py-1.5 text-center font-bold text-blue-300">
                    {r.tau}
                  </td>
                  <td className="px-3 py-1.5 text-center font-bold text-emerald-300">
                    {r.sigma}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selRow ? (
        <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-sm leading-7">
          <b className="text-amber-300">n = {selRow.n} 상세</b>{" "}
          &nbsp;소인수분해:{" "}
          <span className="font-mono text-slate-200">{factStr(selRow.n)}</span>
          <br />
          <span className="text-rose-300">μ({selRow.n}) = {selRow.mu}</span>{" "}
          ·{" "}
          <span className="text-violet-300">
            φ({selRow.n}) = {selRow.phi}
          </span>{" "}
          ·{" "}
          <span className="text-blue-300">
            τ({selRow.n}) = {selRow.tau}
          </span>{" "}
          ·{" "}
          <span className="text-emerald-300">
            σ({selRow.n}) = {selRow.sigma}
          </span>
          <br />
          약수:{" "}
          {divisors(selRow.n).map((d, i, arr) => (
            <span key={d}>
              <span className="text-blue-200">{d}</span>
              {i < arr.length - 1 ? (
                <span className="mx-1 text-slate-500">+</span>
              ) : null}
            </span>
          ))}{" "}
          ={" "}
          <b className="text-emerald-300">{selRow.sigma}</b>
        </div>
      ) : null}
    </div>
  );
}

// ─── 탭 3: 퀴즈 게임 ──────────────────────────────────────────
type GameQ = {
  q: string;
  q2: string;
  correct: string | number;
  choices: (string | number)[];
  explainHtml: string;
};

function gShuffle<T>(arr: T[]): T[] {
  const b = arr.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function genNearChoices(
  correct: number,
  num: number,
  lo: number,
  hi: number,
): number[] {
  const set = new Set<number>([correct]);
  let tries = 0;
  while (set.size < num && tries < 200) {
    const delta = Math.floor(Math.random() * 8) - 4;
    const v = correct + delta;
    if (v >= lo && v <= hi && v !== correct) set.add(v);
    tries++;
  }
  let k = lo;
  while (set.size < num) {
    if (!set.has(k)) set.add(k);
    k++;
  }
  return gShuffle(Array.from(set)).slice(0, num);
}

const FORMULA_PAIRS = [
  { expr: "1/ζ(s)", func: "μ(n)", desc: "뫼비우스 함수" },
  { expr: "ζ(s−1)/ζ(s)", func: "φ(n)", desc: "오일러 파이 함수" },
  { expr: "[ζ(s)]²", func: "τ(n)", desc: "약수 개수 함수" },
  { expr: "ζ(s)·ζ(s−1)", func: "σ(n)", desc: "약수 합 함수" },
] as const;

const PERFECT_NUMS = [6, 28, 496];

function makeQuestion(): GameQ {
  const types = [
    "mu",
    "phi",
    "tau",
    "sigma",
    "formula_match",
    "reverse_tau",
    "reverse_sigma",
  ] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  const n = Math.floor(Math.random() * 24) + 2;

  if (type === "mu") {
    const correct = mobius(n);
    const opts = new Set<number>([correct, -1, 0, 1]);
    return {
      q: `μ(${n}) = ?`,
      q2: `( n = ${factStr(n)} )`,
      correct,
      choices: gShuffle(Array.from(opts)),
      explainHtml:
        `${n} = ${factStr(n)}<br>` +
        (Object.values(primeFactors(n)).some((e) => e >= 2)
          ? `제곱인수가 있으므로 μ(${n}) = <b>0</b>`
          : `서로 다른 소인수 ${Object.keys(primeFactors(n)).length}개 → (−1)^${Object.keys(primeFactors(n)).length} = <b>${correct}</b>`),
    };
  }
  if (type === "phi") {
    const correct = eulerPhi(n);
    const ps = Object.keys(primeFactors(n));
    return {
      q: `φ(${n}) = ?`,
      q2: `( n = ${factStr(n)} )`,
      correct,
      choices: genNearChoices(correct, 4, 1, n),
      explainHtml: `φ(${n}) = ${n}${ps.length ? " × " + ps.map((p) => `(1−1/${p})`).join("×") : ""} = <b>${correct}</b>`,
    };
  }
  if (type === "tau") {
    const correct = tau(n);
    const divs = divisors(n);
    return {
      q: `τ(${n}) = ?`,
      q2: `( n = ${factStr(n)} )`,
      correct,
      choices: genNearChoices(correct, 4, 1, 12),
      explainHtml: `약수: ${divs.join(", ")} → 개수 = <b>${correct}</b>`,
    };
  }
  if (type === "sigma") {
    const correct = sigma(n);
    const divs = divisors(n);
    return {
      q: `σ(${n}) = ?`,
      q2: `( n = ${factStr(n)} )`,
      correct,
      choices: genNearChoices(correct, 4, 1, n * 3),
      explainHtml: `${divs.join(" + ")} = <b>${correct}</b>`,
    };
  }
  if (type === "formula_match") {
    const chosen = FORMULA_PAIRS[Math.floor(Math.random() * FORMULA_PAIRS.length)];
    return {
      q: `Σ f(n)/nˢ = ${chosen.expr} 일 때, f(n) = ?`,
      q2: "제타함수와 산술함수의 관계",
      correct: chosen.func,
      choices: gShuffle(FORMULA_PAIRS.map((f) => f.func)),
      explainHtml: `${chosen.expr} = Σ <b>${chosen.func}</b>/nˢ<br>${chosen.desc}`,
    };
  }
  if (type === "reverse_tau") {
    const primes = [2, 3, 5, 7, 11, 13];
    const p = primes[Math.floor(Math.random() * primes.length)];
    const wrongs = [p * p, p + 1, p * 2].filter((x) => tau(x) !== 2 && x !== p);
    const choices = gShuffle([
      p,
      wrongs[0] ?? p + 3,
      wrongs[1] ?? p * 3,
      p * p,
    ]).slice(0, 4);
    return {
      q: `τ(n) = 2 가 되는 n 의 예시는?`,
      q2: "약수 개수가 2 인 수",
      correct: p,
      choices,
      explainHtml: `τ(n) = 2 이면 약수가 1 과 n 뿐 → n 은 <b>소수</b><br>τ(${p}) = 2 ✓`,
    };
  }
  // reverse_sigma — 완전수
  const np = PERFECT_NUMS[Math.floor(Math.random() * PERFECT_NUMS.length)];
  return {
    q: `σ(n) = 2n 을 만족하는 '완전수'는?`,
    q2: "σ(n) = 2n 인 수",
    correct: np,
    choices: gShuffle([np, np + 1, np - 1, np + 6]),
    explainHtml: `σ(${np}) = ${sigma(np)} = 2 × ${np} ✓<br>완전수: 자기 자신을 제외한 약수의 합 = 자신`,
  };
}

const GAME_TOTAL = 15;

function GameTab() {
  const [state, setState] = useState<
    | "ready"
    | "playing"
    | "finished"
  >("ready");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [qNum, setQNum] = useState(0);
  const [q, setQ] = useState<GameQ | null>(null);
  const [chosen, setChosen] = useState<string | number | null>(null);

  function start() {
    setState("playing");
    setScore(0);
    setStreak(0);
    setLives(3);
    setQNum(0);
    setQ(makeQuestion());
    setChosen(null);
  }

  function pick(v: string | number) {
    if (chosen != null || q == null) return;
    setChosen(v);
    const correct = String(v) === String(q.correct);
    let nextScore = score;
    let nextStreak = streak;
    let nextLives = lives;
    if (correct) {
      nextStreak = streak + 1;
      const bonus = nextStreak >= 3 ? 20 : 10;
      nextScore = score + bonus;
    } else {
      nextStreak = 0;
      nextLives = lives - 1;
    }
    setScore(nextScore);
    setStreak(nextStreak);
    setLives(nextLives);
  }

  function next() {
    const nextQNum = qNum + 1;
    if (nextQNum >= GAME_TOTAL || lives <= 0) {
      setState("finished");
      return;
    }
    setQNum(nextQNum);
    setQ(makeQuestion());
    setChosen(null);
  }

  const isLast = qNum + 1 >= GAME_TOTAL || lives <= 0;
  const stars = score >= 120 ? "⭐⭐⭐" : score >= 80 ? "⭐⭐" : "⭐";
  const livesDisplay = "❤️".repeat(Math.max(0, lives)) + "🖤".repeat(Math.max(0, 3 - lives));
  const progressPct =
    state === "finished" ? 100 : (qNum / GAME_TOTAL) * 100;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-sm font-bold text-amber-200">
              점수: {score}
            </span>
            {streak >= 2 ? (
              <span className="rounded-full border border-rose-400/40 bg-rose-500/15 px-3 py-1 text-sm font-bold text-rose-200">
                🔥 {streak} 연속
              </span>
            ) : null}
          </div>
          <span className="text-lg">{livesDisplay}</span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {state === "ready" ? (
          <div className="py-8 text-center">
            <p className="mb-4 text-base text-slate-300">
              아래 시작 버튼을 눌러 게임을 시작하세요!
            </p>
            <button
              type="button"
              onClick={start}
              className="rounded-lg bg-amber-400 px-6 py-2 text-base font-bold text-slate-900 hover:bg-amber-300"
            >
              🚀 게임 시작!
            </button>
          </div>
        ) : null}

        {state === "playing" && q ? (
          <div>
            <div className="mb-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-center">
              <div className="text-lg font-bold text-white">{q.q}</div>
              <div className="mt-1 text-xs text-slate-400">{q.q2}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {q.choices.map((c) => {
                let cls =
                  "border border-white/10 bg-slate-900 text-slate-200 hover:bg-slate-800";
                if (chosen != null) {
                  if (String(c) === String(q.correct)) {
                    cls =
                      "border-emerald-400/60 bg-emerald-500/20 text-emerald-200";
                  } else if (String(c) === String(chosen)) {
                    cls = "border-rose-400/60 bg-rose-500/20 text-rose-200";
                  } else {
                    cls = "border-white/10 bg-slate-900/40 text-slate-500";
                  }
                }
                return (
                  <button
                    key={String(c)}
                    type="button"
                    disabled={chosen != null}
                    onClick={() => pick(c)}
                    className={
                      "rounded-md px-3 py-2.5 text-base font-bold transition " +
                      cls +
                      (chosen != null
                        ? " cursor-not-allowed"
                        : " cursor-pointer")
                    }
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            {chosen != null ? (
              <>
                <div
                  className={
                    "mt-3 rounded-lg p-3 text-sm leading-7 " +
                    (String(chosen) === String(q.correct)
                      ? "bg-emerald-500/15 text-emerald-100"
                      : "bg-rose-500/15 text-rose-100")
                  }
                >
                  <span className="font-bold">
                    {String(chosen) === String(q.correct)
                      ? streak >= 3
                        ? `✅ 정답! +20점 🔥 ${streak} 연속 보너스!`
                        : "✅ 정답! +10점"
                      : `❌ 틀렸어요! 정답: ${q.correct}`}
                  </span>
                  <br />
                  <span
                    className="text-slate-300"
                    dangerouslySetInnerHTML={{ __html: q.explainHtml }}
                  />
                </div>
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={next}
                    className="rounded-md bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-amber-300"
                  >
                    {isLast ? "결과 보기 ▶" : "다음 문제 ▶"}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {state === "finished" ? (
          <div className="py-6 text-center">
            <div className="text-3xl">{stars}</div>
            <div className="my-2 text-4xl font-extrabold text-amber-300">
              {score} 점
            </div>
            <div className="text-sm text-slate-400">
              {GAME_TOTAL} 문제 중 (보너스 포함)
            </div>
            <button
              type="button"
              onClick={start}
              className="mt-4 rounded-lg bg-amber-400 px-6 py-2 text-base font-bold text-slate-900 hover:bg-amber-300"
            >
              🔄 다시 하기
            </button>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <div className="mb-2 text-base font-bold text-white">
          📋 문제 유형 안내
        </div>
        <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
          <div>🔴 μ(n) 계산 — 소인수 개수와 제곱인수 확인</div>
          <div>🟣 φ(n) 계산 — 서로소인 수의 개수</div>
          <div>🔵 τ(n) 계산 — 약수의 개수</div>
          <div>🟢 σ(n) 계산 — 약수들의 합</div>
          <div>⭐ 공식 매칭 — 제타함수와의 관계식 연결</div>
          <div>🎯 역 추론 — 함수값으로 n 찾기</div>
        </div>
      </div>
    </div>
  );
}

// ─── 탭 4: 디리클레 급수 ──────────────────────────────────────
function zetaPartial(s: number, N = 500): number {
  let r = 0;
  for (let n = 1; n <= N; n++) r += 1 / Math.pow(n, s);
  return r;
}

type DsFunc = "mu" | "phi" | "tau" | "sigma";
const DS_FUNC_LABEL: Record<DsFunc, string> = {
  mu: "μ(n) → 1/ζ(s)",
  phi: "φ(n) → ζ(s−1)/ζ(s)",
  tau: "τ(n) → [ζ(s)]²",
  sigma: "σ(n) → ζ(s)·ζ(s−1)",
};
const DS_COLOR: Record<DsFunc, string> = {
  mu: "#f87171",
  phi: "#a78bfa",
  tau: "#60a5fa",
  sigma: "#34d399",
};

function applyFunc(fn: DsFunc, n: number): number {
  if (fn === "mu") return mobius(n);
  if (fn === "phi") return eulerPhi(n);
  if (fn === "tau") return tau(n);
  return sigma(n);
}

function DirichletTab({ active }: { active: boolean }) {
  const [fn, setFn] = useState<DsFunc>("mu");
  const [s, setS] = useState<number>(3);
  const [N, setN] = useState<number>(20);

  const { terms, partial, theoretical, theoLabel } = useMemo(() => {
    let p = 0;
    const arr: { n: number; f: number; term: number; partial: number }[] = [];
    for (let n = 1; n <= N; n++) {
      const f = applyFunc(fn, n);
      const term = f / Math.pow(n, s);
      p += term;
      arr.push({ n, f, term, partial: p });
    }
    const z = zetaPartial(s);
    const z1 = s > 1 ? zetaPartial(s - 1) : NaN;
    let th: number;
    let lbl: string;
    if (fn === "mu") {
      th = 1 / z;
      lbl = `1/ζ(${s}) ≈ ${(1 / z).toFixed(6)}`;
    } else if (fn === "phi") {
      th = z1 / z;
      lbl = `ζ(${s - 1})/ζ(${s}) ≈ ${(z1 / z).toFixed(6)}`;
    } else if (fn === "tau") {
      th = z * z;
      lbl = `[ζ(${s})]² ≈ ${(z * z).toFixed(6)}`;
    } else {
      th = z * z1;
      lbl = `ζ(${s})·ζ(${s - 1}) ≈ ${(z * z1).toFixed(6)}`;
    }
    return { terms: arr, partial: p, theoretical: th, theoLabel: lbl };
  }, [fn, s, N]);

  const err = Math.abs(partial - theoretical) / Math.abs(theoretical) * 100;
  const col = DS_COLOR[fn];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <div className="mb-2 text-base font-bold text-white">
          🧩 디리클레 급수 = 함수값의 합
        </div>
        <p className="mb-3 text-xs leading-relaxed text-slate-400">
          디리클레 급수 Σ f(n)/nˢ 의 처음 N 개 항을 더해서 실제값과 얼마나
          가까워지는지 확인해 보세요. s 가 클수록 더 빠르게 수렴합니다!
        </p>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <label className="font-semibold text-slate-300">함수 선택:</label>
          <select
            aria-label="함수"
            value={fn}
            onChange={(e) => setFn(e.target.value as DsFunc)}
            className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-slate-200"
          >
            {(["mu", "phi", "tau", "sigma"] as DsFunc[]).map((f) => (
              <option key={f} value={f}>
                {DS_FUNC_LABEL[f]}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-3 text-sm">
          <label className="font-semibold text-slate-300">s =</label>
          <input
            type="range"
            min={2}
            max={8}
            step={0.5}
            value={s}
            onChange={(e) => setS(Number(e.target.value))}
            className="flex-1 min-w-[140px]"
            aria-label="s"
          />
          <span className="min-w-[2.5rem] text-center font-bold text-amber-300">
            {s}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="font-semibold text-slate-300">항 수 N =</label>
          <input
            type="range"
            min={1}
            max={100}
            value={N}
            onChange={(e) => setN(Number(e.target.value))}
            className="flex-1 min-w-[140px]"
            aria-label="N"
          />
          <span className="min-w-[2.5rem] text-center font-bold text-amber-300">
            {N}
          </span>
        </div>

        <div className="mb-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border-2 border-blue-400/40 bg-blue-500/10 p-3 text-center">
            <div className="text-xs text-slate-400">부분합 (N = {N} 항)</div>
            <div className="my-1 text-xl font-extrabold text-blue-300">
              {partial.toFixed(6)}
            </div>
          </div>
          <div className="rounded-xl border-2 border-emerald-400/40 bg-emerald-500/10 p-3 text-center">
            <div className="text-xs text-slate-400">이론값 (N → ∞)</div>
            <div className="my-1 text-xl font-extrabold text-emerald-300">
              {Number.isNaN(theoretical) ? "N/A" : theoretical.toFixed(6)}
            </div>
            <div className="text-xs text-slate-500">{theoLabel}</div>
          </div>
          <div className="rounded-xl border-2 border-violet-400/40 bg-violet-500/10 p-3 text-center">
            <div className="text-xs text-slate-400">오차율</div>
            <div className="my-1 text-xl font-extrabold text-violet-300">
              {Number.isNaN(err) ? "N/A" : err.toFixed(3) + "%"}
            </div>
          </div>
        </div>

        <DirichletChart
          terms={terms}
          theoretical={theoretical}
          color={col}
          active={active}
          s={s}
        />

        <div className="mt-3 max-h-[280px] overflow-auto rounded-xl border border-white/10">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0">
              <tr className="bg-slate-800 text-white">
                <th className="px-2 py-1.5 text-center">n</th>
                <th className="px-2 py-1.5 text-center">소인수분해</th>
                <th className="px-2 py-1.5 text-center" style={{ color: col }}>
                  f(n)
                </th>
                <th className="px-2 py-1.5 text-center">f(n)/nˢ</th>
                <th className="px-2 py-1.5 text-center">부분합</th>
              </tr>
            </thead>
            <tbody>
              {terms.slice(0, 30).map((t, i) => (
                <tr
                  key={t.n}
                  className={
                    "border-b border-white/5 " +
                    (i % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20")
                  }
                >
                  <td className="px-2 py-1 text-center font-bold text-slate-100">
                    {t.n}
                  </td>
                  <td className="px-2 py-1 text-center text-slate-400">
                    {factStr(t.n)}
                  </td>
                  <td
                    className="px-2 py-1 text-center font-bold"
                    style={{ color: col }}
                  >
                    {t.f}
                  </td>
                  <td className="px-2 py-1 text-center text-slate-300">
                    {t.term.toFixed(6)}
                  </td>
                  <td className="px-2 py-1 text-center font-bold text-amber-300">
                    {t.partial.toFixed(6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConvCard active={active} />
    </div>
  );
}

function DirichletChart({
  terms,
  theoretical,
  color,
  active,
  s,
}: {
  terms: { n: number; partial: number }[];
  theoretical: number;
  color: string;
  active: boolean;
  s: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(360, wrap.clientWidth - 20);
    const H = 180;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    const partials = terms.map((t) => t.partial);
    const candMin = Number.isNaN(theoretical) ? Infinity : theoretical;
    const candMax = Number.isNaN(theoretical) ? -Infinity : theoretical;
    const minV = Math.min(...partials, candMin);
    const maxV = Math.max(...partials, candMax);
    const range = maxV - minV || 1;

    const px = (n: number) => 30 + (n / terms.length) * (W - 50);
    const py = (v: number) =>
      H - 20 - ((v - minV) / range) * (H - 40);

    if (!Number.isNaN(theoretical)) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(30, py(theoretical));
      ctx.lineTo(W - 10, py(theoretical));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("이론값", W - 12, py(theoretical) - 4);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    terms.forEach((t, i) => {
      const x = px(i + 1);
      const y = py(t.partial);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    terms.forEach((t, i) => {
      const x = px(i + 1);
      const y = py(t.partial);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`수렴 과정 (s = ${s})`, W / 2, 14);
    ctx.fillStyle = "#64748b";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("n →", W - 20, H - 4);
  }, [terms, theoretical, color, active, s]);

  return (
    <div ref={wrapRef} className="rounded-lg border border-white/10 p-2">
      <canvas ref={canvasRef} />
    </div>
  );
}

function ConvCard({ active }: { active: boolean }) {
  const [s, setS] = useState<number>(2);
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-2 text-base font-bold text-white">
        🔍 수렴 직관: 1/nˢ 의 크기
      </div>
      <p className="mb-3 text-xs leading-relaxed text-slate-400">
        s 가 클수록 1/nˢ 가 빠르게 0 에 가까워져서 급수가 더 빨리 수렴합니다.
        <br />
        s = 1 이면 조화급수(발산!), s = 2 면 π²/6 ≈ 1.645, s = 4 면 π⁴/90 ≈
        1.082
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="font-semibold text-slate-300">s =</label>
        <input
          type="range"
          min={1}
          max={5}
          step={0.5}
          value={s}
          onChange={(e) => setS(Number(e.target.value))}
          className="flex-1 min-w-[140px]"
          aria-label="s"
        />
        <span className="min-w-[2.5rem] text-center font-bold text-amber-300">
          {s}
        </span>
      </div>
      <ConvCanvas s={s} active={active} />
    </div>
  );
}

function ConvCanvas({ s, active }: { s: number; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(360, wrap.clientWidth - 20);
    const H = 160;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    const N = 30;
    const vals = Array.from({ length: N }, (_, i) => 1 / Math.pow(i + 1, s));
    const maxV = vals[0];
    const bw = (W - 40) / N;

    vals.forEach((v, i) => {
      const bh = (v / maxV) * (H - 30);
      const x = 20 + i * bw + 1;
      const w = bw - 2;
      const y = H - 20 - bh;
      ctx.fillStyle = `hsl(${200 + i * 3}, 70%, 55%)`;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x, y, w, bh);
      ctx.globalAlpha = 1;
      if (i < 10) {
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(i + 1), x + w / 2, H - 5);
      }
    });

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`s = ${s} 일 때 1/nˢ 값 (n = 1 ~ 30)`, 22, 14);
    if (s === 1) {
      ctx.fillStyle = "#f87171";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("⚠ s = 1: 조화급수 → 발산!", 22, 30);
    }
  }, [s, active]);

  return (
    <div ref={wrapRef} className="rounded-lg border border-white/10 p-2">
      <canvas ref={canvasRef} />
    </div>
  );
}

export {
  primeFactors,
  mobius,
  eulerPhi,
  tau,
  sigma,
  divisors,
  isPrime,
};
