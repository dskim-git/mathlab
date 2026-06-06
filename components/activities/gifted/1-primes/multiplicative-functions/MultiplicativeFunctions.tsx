"use client";

import { useMemo, useState } from "react";

type TabKey = "calc" | "table" | "mult" | "props" | "quiz";

// ─── 산술함수 헬퍼 ─────────────────────────────────────────────
function factorize(n: number): Record<number, number> {
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

function tau(n: number): number {
  if (n === 1) return 1;
  return Object.values(factorize(n)).reduce((a, e) => a * (e + 1), 1);
}

function sigma(n: number): number {
  if (n === 1) return 1;
  const f = factorize(n);
  let acc = 1;
  for (const [pStr, e] of Object.entries(f)) {
    const p = Number(pStr);
    acc *= (Math.pow(p, e + 1) - 1) / (p - 1);
  }
  return Math.round(acc);
}

function phi(n: number): number {
  if (n === 1) return 1;
  const f = factorize(n);
  let acc = 1;
  for (const [pStr, e] of Object.entries(f)) {
    const p = Number(pStr);
    acc *= Math.pow(p, e) * (1 - 1 / p);
  }
  return Math.round(acc);
}

function mu(n: number): number {
  if (n === 1) return 1;
  const f = factorize(n);
  if (Object.values(f).some((e) => e > 1)) return 0;
  return Math.pow(-1, Object.keys(f).length);
}

function gcd(a: number, b: number): number {
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function divisors(n: number): number[] {
  const d: number[] = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      d.push(i);
      if (i !== n / i) d.push(n / i);
    }
  }
  return d.sort((a, b) => a - b);
}

function factHtml(n: number): string {
  if (n === 1) return "1";
  return Object.entries(factorize(n))
    .map(([p, e]) => (e > 1 ? `${p}<sup>${e}</sup>` : p))
    .join("×");
}

export default function MultiplicativeFunctions() {
  const [tab, setTab] = useState<TabKey>("calc");
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-5">
        <h2 className="text-2xl font-bold text-white">
          🧮 산술함수와 곱셈함수 탐구
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          τ, σ, φ, μ — 네 가지 산술함수를 직접 계산하고 곱셈함수의 성질을
          탐험합니다.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { key: "calc", label: "🔢 함수 계산기" },
            { key: "table", label: "📊 비교표" },
            { key: "mult", label: "🧩 곱셈성 탐구" },
            { key: "props", label: "📐 함수별 성질" },
            { key: "quiz", label: "🎮 퀴즈" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              "rounded-lg border px-3 py-1.5 text-sm font-semibold transition " +
              (tab === t.key
                ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
                : "border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-900")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className={tab === "calc" ? "" : "hidden"}>
        <CalcTab />
      </section>
      <section className={tab === "table" ? "" : "hidden"}>
        <TableTab />
      </section>
      <section className={tab === "mult" ? "" : "hidden"}>
        <MultTab />
      </section>
      <section className={tab === "props" ? "" : "hidden"}>
        <PropsTab />
      </section>
      <section className={tab === "quiz" ? "" : "hidden"}>
        <QuizTab />
      </section>
    </div>
  );
}

// ─── 탭 1: 함수 계산기 ────────────────────────────────────────
const INTRO_CARDS = [
  {
    name: "τ(n) 타우 함수",
    color: "tau",
    def: "n 의 <b>약수의 개수</b><br>τ(n) = Σ<sub>d|n</sub> 1",
    example: "τ(6) = 4 (약수: 1, 2, 3, 6)",
  },
  {
    name: "σ(n) 시그마 함수",
    color: "sigma",
    def: "n 의 <b>약수의 합</b><br>σ(n) = Σ<sub>d|n</sub> d",
    example: "σ(6) = 12 (1+2+3+6)",
  },
  {
    name: "φ(n) 오일러 함수",
    color: "phi",
    def: "n 이하 중 n 과 <b>서로 소인 수의 개수</b>",
    example: "φ(6) = 2 (1과 5)",
  },
  {
    name: "μ(n) 뫼비우스 함수",
    color: "mu",
    def: "제곱수 약수 있으면 <b>0</b>, n = p₁p₂…p<sub>k</sub> 이면 <b>(−1)<sup>k</sup></b>",
    example: "μ(1)=1, μ(6)=1, μ(4)=0",
  },
] as const;

function colorBg(c: string) {
  switch (c) {
    case "tau":
      return "border-blue-400/40 bg-blue-500/10";
    case "sigma":
      return "border-emerald-400/40 bg-emerald-500/10";
    case "phi":
      return "border-violet-400/40 bg-violet-500/10";
    case "mu":
      return "border-amber-400/40 bg-amber-500/10";
    default:
      return "border-white/10 bg-slate-900/40";
  }
}

function colorText(c: string) {
  switch (c) {
    case "tau":
      return "text-blue-300";
    case "sigma":
      return "text-emerald-300";
    case "phi":
      return "text-violet-300";
    case "mu":
      return "text-amber-300";
    default:
      return "text-slate-300";
  }
}

function CalcTab() {
  const [n, setN] = useState<number>(12);
  const f = useMemo(() => factorize(n), [n]);
  const divs = useMemo(() => divisors(n), [n]);
  const tauV = useMemo(() => tau(n), [n]);
  const sigV = useMemo(() => sigma(n), [n]);
  const phiV = useMemo(() => phi(n), [n]);
  const muV = useMemo(() => mu(n), [n]);

  const entries = Object.entries(f).map(([p, e]) => [Number(p), e] as const);
  const isPerfect = n > 1 && sigV === 2 * n;

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {INTRO_CARDS.map((c) => (
          <div
            key={c.name}
            className={"rounded-xl border-2 p-3 " + colorBg(c.color)}
          >
            <div className={"text-base font-extrabold " + colorText(c.color)}>
              {c.name}
            </div>
            <div
              className="mt-1 text-xs leading-relaxed text-slate-300"
              dangerouslySetInnerHTML={{ __html: c.def }}
            />
            <div className="mt-1 text-xs text-slate-500">{c.example}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-slate-900/40 p-4">
        <span className="text-sm font-bold text-slate-300">n =</span>
        <span className="min-w-[3.5rem] text-center text-3xl font-extrabold text-blue-300">
          {n}
        </span>
        <input
          type="range"
          min={1}
          max={100}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="flex-1 min-w-[150px]"
          aria-label="n 슬라이더"
        />
        <input
          type="number"
          min={1}
          max={100}
          value={n}
          onChange={(e) => {
            const v = Math.max(1, Math.min(100, Number(e.target.value) || 1));
            setN(v);
          }}
          className="w-20 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-center text-lg font-bold text-slate-100"
          aria-label="n 입력"
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
        <h3 className="mb-2 text-sm font-bold text-white">🔍 소인수분해</h3>
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-900/80 px-3 py-2 text-sm">
          {n === 1 ? (
            <span className="font-bold text-amber-300">
              n = 1{" "}
              <span className="text-slate-500">(소인수 없음)</span>
            </span>
          ) : (
            <>
              <span className="font-bold text-amber-300">n = {n} =</span>
              {entries.map(([p, e], i) => (
                <span key={p} className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-500/80 px-3 py-0.5 text-xs font-bold text-white">
                    {p}
                    {e > 1 ? <sup>{e}</sup> : null}
                  </span>
                  {i < entries.length - 1 ? (
                    <span className="text-slate-500">×</span>
                  ) : null}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FuncCard
          color="tau"
          name={`τ(${n})`}
          value={tauV}
          desc="약수의 개수"
        >
          {n === 1 ? (
            <Step>τ(1) = 1 (정의)</Step>
          ) : (
            <>
              <Step>
                소인수분해:{" "}
                <span dangerouslySetInnerHTML={{ __html: factHtml(n) }} />
                <br />
                τ(n) ={" "}
                {entries.map(([, e]) => `(${e}+1)`).join("×")}{" "}
                = <b className="text-blue-300 text-base">{tauV}</b>
              </Step>
              <Step muted>약수: {divs.join(", ")}</Step>
            </>
          )}
        </FuncCard>

        <FuncCard
          color="sigma"
          name={`σ(${n})`}
          value={sigV}
          desc={
            <>
              약수의 합
              {isPerfect ? (
                <span className="ml-2 font-bold text-amber-300">
                  🌟 완전수!
                </span>
              ) : null}
            </>
          }
        >
          {n === 1 ? (
            <Step>σ(1) = 1 (정의)</Step>
          ) : (
            <>
              <Step>
                σ(n) ={" "}
                {entries
                  .map(
                    ([p, e]) =>
                      `(${p}^${e + 1}−1)/(${p}−1)`,
                  )
                  .join(" × ")}{" "}
                = {" "}
                {entries
                  .map(([p, e]) =>
                    Math.round((Math.pow(p, e + 1) - 1) / (p - 1)),
                  )
                  .join(" × ")}{" "}
                = <b className="text-emerald-300 text-base">{sigV}</b>
              </Step>
              <Step muted>
                확인: {divs.join("+")} = {sigV}
              </Step>
            </>
          )}
        </FuncCard>

        <FuncCard
          color="phi"
          name={`φ(${n})`}
          value={phiV}
          desc={`${n}과 서로 소인 수의 개수`}
        >
          {n === 1 ? (
            <Step>φ(1) = 1 (정의)</Step>
          ) : (
            <>
              <Step>
                φ(n) ={" "}
                {entries
                  .map(([p, e]) => `${Math.pow(p, e)}·(1−1/${p})`)
                  .join(" × ")}{" "}
                = {" "}
                {entries
                  .map(([p, e]) =>
                    Math.round(Math.pow(p, e) * (1 - 1 / p)),
                  )
                  .join(" × ")}{" "}
                = <b className="text-violet-300 text-base">{phiV}</b>
              </Step>
              {n <= 30 ? (
                <Step muted>
                  서로 소:{" "}
                  {Array.from({ length: n }, (_, i) => i + 1)
                    .filter((k) => gcd(k, n) === 1)
                    .join(", ")}
                </Step>
              ) : null}
            </>
          )}
        </FuncCard>

        <FuncCard
          color="mu"
          name={`μ(${n})`}
          value={muV}
          desc={
            muV === 0
              ? "제곱수 약수 존재"
              : muV === 1
                ? "소인수 개수 짝수"
                : "소인수 개수 홀수"
          }
        >
          {n === 1 ? (
            <Step>μ(1) = 1 (정의)</Step>
          ) : (
            <Step>
              {Object.values(f).some((e) => e > 1) ? (
                <>
                  {(() => {
                    const found = Object.entries(f).find(
                      ([, e]) => e > 1,
                    );
                    if (!found) return null;
                    return (
                      <>
                        {found[0]}
                        <sup>{found[1]}</sup> 이 약수 → 제곱수 약수 존재
                        <br />
                        μ(n) ={" "}
                        <b className="text-amber-300 text-base">0</b>
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  서로 다른 소인수 {Object.keys(f).length}개
                  <br />
                  μ(n) = (−1)<sup>{Object.keys(f).length}</sup> ={" "}
                  <b className="text-amber-300 text-base">{muV}</b>
                </>
              )}
            </Step>
          )}
        </FuncCard>
      </div>
    </div>
  );
}

function FuncCard({
  color,
  name,
  value,
  desc,
  children,
}: {
  color: string;
  name: string;
  value: number;
  desc: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={"rounded-xl border-2 p-4 " + colorBg(color)}>
      <div className={"text-xl font-extrabold " + colorText(color)}>
        {name}
      </div>
      <div className={"text-3xl font-extrabold " + colorText(color)}>
        {value}
      </div>
      <div className="mb-2 text-xs text-slate-400">{desc}</div>
      <div className="space-y-1.5 text-xs leading-relaxed text-slate-300">
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

// ─── 탭 2: 비교표 ────────────────────────────────────────────
const TABLE_RANGES = [20, 30, 50] as const;

function TableTab() {
  const [max, setMax] = useState<number>(30);
  const [sel, setSel] = useState<number | null>(null);

  const rows = useMemo(() => {
    const arr: {
      n: number;
      tau: number;
      sigma: number;
      phi: number;
      mu: number;
      isPerfect: boolean;
      isPrime: boolean;
    }[] = [];
    for (let n = 1; n <= max; n++) {
      const f = factorize(n);
      const tN = tau(n);
      const sN = sigma(n);
      const pN = phi(n);
      const mN = mu(n);
      const isPerfect = n > 1 && sN === 2 * n;
      const keys = Object.keys(f);
      const isPrime = keys.length === 1 && Object.values(f)[0] === 1;
      arr.push({ n, tau: tN, sigma: sN, phi: pN, mu: mN, isPerfect, isPrime });
    }
    return arr;
  }, [max]);

  const selRow = sel != null ? rows.find((r) => r.n === sel) ?? null : null;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold text-slate-300">범위:</label>
          <span className="text-slate-400">1 ~</span>
          <select
            aria-label="범위"
            value={max}
            onChange={(e) => {
              setMax(Number(e.target.value));
              setSel(null);
            }}
            className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-sm text-slate-200"
          >
            {TABLE_RANGES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border border-amber-400/60 bg-amber-500/20" />
            완전수 (σ = 2n)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border border-emerald-400/50 bg-emerald-500/15" />
            소수
          </span>
        </div>
      </div>

      <div className="max-h-[480px] overflow-auto rounded-xl border border-white/10">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-800 text-white">
              <th className="px-3 py-2 text-center">n</th>
              <th className="px-3 py-2 text-center">소인수분해</th>
              <th className="px-3 py-2 text-center text-blue-300">τ(n)</th>
              <th className="px-3 py-2 text-center text-emerald-300">σ(n)</th>
              <th className="px-3 py-2 text-center text-violet-300">φ(n)</th>
              <th className="px-3 py-2 text-center text-amber-300">μ(n)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isSel = r.n === sel;
              const bg = isSel
                ? "bg-cyan-500/20"
                : r.isPerfect
                  ? "bg-amber-500/15"
                  : r.isPrime
                    ? "bg-emerald-500/10"
                    : r.n % 2 === 0
                      ? "bg-slate-900/40"
                      : "bg-slate-900/20";
              const muColor =
                r.mu > 0
                  ? "text-emerald-300"
                  : r.mu < 0
                    ? "text-rose-300"
                    : "text-slate-500";
              return (
                <tr
                  key={r.n}
                  onClick={() => setSel(r.n)}
                  className={
                    "cursor-pointer border-b border-white/5 transition hover:bg-cyan-500/10 " +
                    bg
                  }
                >
                  <td className="px-3 py-1.5 text-center font-bold text-slate-100">
                    {r.n}
                  </td>
                  <td
                    className="px-3 py-1.5 text-center text-xs text-slate-300"
                    dangerouslySetInnerHTML={{ __html: factHtml(r.n) }}
                  />
                  <td className="px-3 py-1.5 text-center font-bold text-blue-300">
                    {r.tau}
                  </td>
                  <td className="px-3 py-1.5 text-center font-bold text-emerald-300">
                    {r.sigma}
                  </td>
                  <td className="px-3 py-1.5 text-center font-bold text-violet-300">
                    {r.phi}
                  </td>
                  <td className={"px-3 py-1.5 text-center font-bold " + muColor}>
                    {r.mu}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selRow ? <RowDetail row={selRow} /> : null}
    </div>
  );
}

function RowDetail({
  row,
}: {
  row: {
    n: number;
    tau: number;
    sigma: number;
    phi: number;
    mu: number;
    isPerfect: boolean;
    isPrime: boolean;
  };
}) {
  const divs = useMemo(() => divisors(row.n), [row.n]);
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <h3 className="mb-2 text-base font-bold text-white">📌 n = {row.n}</h3>
      <p className="mb-2 text-sm text-slate-300">
        소인수분해:{" "}
        <b
          className="text-slate-100"
          dangerouslySetInnerHTML={{ __html: factHtml(row.n) }}
        />
      </p>
      <p className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-slate-300">
        <span>약수:</span>
        {divs.map((d) => (
          <span
            key={d}
            className="rounded-full border border-blue-400/40 bg-blue-500/15 px-2 py-0.5 text-xs font-bold text-blue-200"
          >
            {d}
          </span>
        ))}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-0.5 text-xs font-bold text-blue-200">
          τ = {row.tau}
        </span>
        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-200">
          σ = {row.sigma}
        </span>
        <span className="rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-0.5 text-xs font-bold text-violet-200">
          φ = {row.phi}
        </span>
        <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-0.5 text-xs font-bold text-amber-200">
          μ = {row.mu}
        </span>
      </div>
      {row.isPerfect ? (
        <p className="mt-3 text-sm font-bold text-amber-300">
          🌟 완전수! σ({row.n}) = {row.sigma} = 2 × {row.n}
        </p>
      ) : null}
      {row.isPrime ? (
        <p className="mt-1 text-sm font-bold text-emerald-300">
          🔵 소수 → φ = {row.n} − 1 = {row.phi}, τ = 2
        </p>
      ) : null}
    </div>
  );
}

// ─── 탭 3: 곱셈성 탐구 ────────────────────────────────────────
const MN_RANGE = Array.from({ length: 29 }, (_, i) => i + 2); // 2..30

function MultTab() {
  return (
    <div className="space-y-4">
      <TheoryCard />
      <MultVerifyCard />
      <Prop3Card />
    </div>
  );
}

function TheoryCard() {
  return (
    <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/5 p-5">
      <div className="mb-2 text-base font-bold text-cyan-200">
        📐 곱셈함수의 세 가지 성질
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-slate-300">
        <p>
          <b className="text-cyan-300">정의</b>: 서로 소인 두 자연수{" "}
          <i className="text-slate-100">m, n</i> 에 대해{" "}
          <i className="text-slate-100">f(mn) = f(m) · f(n)</i> 을 만족하는
          산술함수.
        </p>
        <p>
          <b className="text-amber-300">성질 1</b>: 항등적으로 0 이 아니면{" "}
          <i className="text-slate-100">f(1) = 1</i>
        </p>
        <p>
          <b className="text-amber-300">성질 2</b>:{" "}
          <i className="text-slate-100">
            n = p₁<sup>α₁</sup> ··· p<sub>k</sub>
            <sup>α<sub>k</sub></sup>
          </i>{" "}
          이면{" "}
          <i className="text-slate-100">
            f(n) = f(p₁<sup>α₁</sup>) ··· f(p<sub>k</sub>
            <sup>α<sub>k</sub></sup>)
          </i>
        </p>
        <p>
          <b className="text-amber-300">성질 3</b>:{" "}
          <i className="text-slate-100">f</i> 가 곱셈함수이면{" "}
          <i className="text-slate-100">
            g(n) = Σ<sub>d|n</sub> f(d)
          </i>{" "}
          도 곱셈함수.
        </p>
        <p className="pt-2">
          <b className="text-cyan-300">τ, σ, φ 는 모두 곱셈함수</b> — 각각{" "}
          f(d)=1, f(d)=d, f(d)=φ(d) 로 성질 3 적용.
        </p>
        <details className="rounded-lg border border-white/10 bg-slate-900/40 p-3 text-xs text-slate-400">
          <summary className="cursor-pointer font-bold text-slate-200">
            μ(n) 이 곱셈함수인 이유 — gcd(m,n)=1 일 때 μ(mn) = μ(m)μ(n) 증명
          </summary>
          <div className="mt-2 space-y-1.5">
            <p>
              <b>경우 1</b>: m 또는 n 이 제곱수를 인수로 가지면 μ(m)=0 또는
              μ(n)=0. mn 도 그 제곱수를 약수로 가지므로 μ(mn)=0 = μ(m)μ(n) ✓
            </p>
            <p>
              <b>경우 2</b>: m = p₁ ··· p<sub>k</sub>, n = q₁ ··· q
              <sub>l</sub> (서로 다른 소수, p<sub>i</sub> ≠ q<sub>j</sub>).
              <br />
              → mn = p₁ ··· p<sub>k</sub> q₁ ··· q<sub>l</sub> 이므로 μ(mn) =
              (−1)<sup>k+l</sup> = (−1)<sup>k</sup>(−1)<sup>l</sup> = μ(m)μ(n)
              ✓
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}

function MultVerifyCard() {
  const [m, setM] = useState<number>(4);
  const [n, setN] = useState<number>(9);
  const g = gcd(m, n);
  const coprime = g === 1;
  const mn = m * n;

  const fns = [
    { name: "τ", fn: tau, color: "tau" },
    { name: "σ", fn: sigma, color: "sigma" },
    { name: "φ", fn: phi, color: "phi" },
    { name: "μ", fn: mu, color: "mu" },
  ] as const;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-2 text-base font-bold text-white">
        🔬 검증: f(mn) = f(m) · f(n)?
      </h3>
      <p className="mb-3 text-xs text-slate-400">
        서로 소인 두 수 m, n 을 골라 네 함수 모두 확인해보세요.
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="font-semibold text-slate-300">m =</label>
        <select
          aria-label="m"
          value={m}
          onChange={(e) => setM(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-slate-200"
        >
          {MN_RANGE.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <label className="ml-2 font-semibold text-slate-300">n =</label>
        <select
          aria-label="n"
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-slate-200"
        >
          {MN_RANGE.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <span
          className={
            "ml-2 rounded-md border px-2.5 py-0.5 text-xs font-bold " +
            (coprime
              ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
              : "border-rose-400/50 bg-rose-500/15 text-rose-200")
          }
        >
          gcd({m},{n}) = {g} {coprime ? "✓ 서로 소!" : "✗ 서로 소 아님"}
        </span>
      </div>

      {!coprime ? (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          ⚠️ 서로 소가 아닙니다. 다른 수를 선택해보세요.
        </div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <FactCell label="m" v={m} />
            <FactCell label="n" v={n} />
            <FactCell label="m × n" v={mn} highlight />
          </div>
          <div className="space-y-2">
            {fns.map(({ name, fn, color }) => {
              const fm = fn(m);
              const fn2 = fn(n);
              const fmn = fn(mn);
              const ok = fm * fn2 === fmn;
              return (
                <div
                  key={name}
                  className={"rounded-xl border-2 p-3 " + colorBg(color)}
                >
                  <div className={"text-sm font-bold " + colorText(color)}>
                    {name}(n) 검증
                  </div>
                  <div className="mt-1 text-sm leading-7 text-slate-200">
                    {name}({m}) = <b>{fm}</b>, {name}({n}) = <b>{fn2}</b>,{" "}
                    {name}({mn}) = <b>{fmn}</b>
                  </div>
                  <div
                    className={
                      "mt-1 rounded-md px-2 py-1 text-sm font-bold " +
                      (ok
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-rose-500/15 text-rose-200")
                    }
                  >
                    {name}({m}) × {name}({n}) = {fm} × {fn2} = {fm * fn2}{" "}
                    {ok
                      ? `= ${fmn} = ${name}(${mn}) ✓`
                      : `≠ ${fmn} ✗`}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function FactCell({
  label,
  v,
  highlight = false,
}: {
  label: string;
  v: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-2 " +
        (highlight
          ? "border-violet-400/40 bg-violet-500/10"
          : "border-white/10 bg-slate-900/60")
      }
    >
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-2xl font-extrabold text-slate-100">{v}</div>
      <div
        className="text-xs text-slate-400"
        dangerouslySetInnerHTML={{ __html: factHtml(v) }}
      />
    </div>
  );
}

function Prop3Card() {
  const [n, setN] = useState<number>(12);
  const divs = useMemo(() => divisors(n), [n]);
  const tN = tau(n);
  const sN = sigma(n);
  const sumPhi = divs.reduce((a, d) => a + phi(d), 0);
  const muVals = divs.map((d) => mu(d));
  const muSum = muVals.reduce((a, v) => a + v, 0);
  const epsilon = n === 1 ? 1 : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <h3 className="mb-1 text-base font-bold text-white">
        🔬 성질 3 탐구: g(n) = Σ<sub>d|n</sub> f(d) 도 곱셈함수
      </h3>
      <p className="mb-3 text-xs text-slate-400">
        f 의 종류에 따라 g(n) 이 잘 알려진 함수가 됩니다. μ(d) 를 더하면 ε(n)
        이!
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="font-semibold text-slate-300">n =</label>
        <select
          aria-label="n"
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-slate-200"
        >
          {MN_RANGE.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 rounded-lg bg-slate-900/60 p-3 text-sm">
        <b>n = {n}</b> 의 약수:
        <span className="ml-2 inline-flex flex-wrap items-center gap-1">
          {divs.map((d) => (
            <span
              key={d}
              className="rounded-full border border-blue-400/40 bg-blue-500/15 px-2 py-0.5 text-xs font-bold text-blue-200"
            >
              {d}
            </span>
          ))}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SumCard color="tau" title="f(d) = 1 → g(n) = τ(n)">
          Σ 1 = {divs.map(() => "1").join("+")} ={" "}
          <b className="text-blue-300">{tN}</b> = τ({n}) ✓
        </SumCard>
        <SumCard color="sigma" title="f(d) = d → g(n) = σ(n)">
          Σ d = {divs.join("+")} ={" "}
          <b className="text-emerald-300">{sN}</b> = σ({n}) ✓
        </SumCard>
        <SumCard color="phi" title="f(d) = φ(d) → Σφ(d) = n">
          {divs.map((d) => `φ(${d})`).join("+")} ={" "}
          {divs.map((d) => phi(d)).join("+")} ={" "}
          <b className="text-violet-300">{sumPhi}</b> = {n}{" "}
          {sumPhi === n ? "✓" : "✗"}
        </SumCard>
        <SumCard color="mu" title="f(d) = μ(d) → Σμ(d) = ε(n)">
          {divs.map((d) => `μ(${d})`).join("+")} ={" "}
          {muVals
            .map((v) => (v < 0 ? `(−${-v})` : String(v)))
            .join("+")}{" "}
          = <b className="text-amber-300">{muSum}</b> = ε({n}) = {epsilon}{" "}
          {muSum === epsilon ? "✓" : "✗"}
          <p className="mt-1 text-[11px] text-amber-400">
            ε(n): n = 1 이면 1, 나머지는 0
          </p>
        </SumCard>
      </div>
    </div>
  );
}

function SumCard({
  color,
  title,
  children,
}: {
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"rounded-xl border-2 p-3 " + colorBg(color)}>
      <div className={"text-sm font-bold " + colorText(color)}>{title}</div>
      <div className="mt-1 text-sm leading-7 text-slate-200">{children}</div>
    </div>
  );
}

// ─── 탭 4: 함수별 성질 ────────────────────────────────────────
type PropsFunc = "tau" | "sigma" | "phi" | "mu";

function PropsTab() {
  const [sub, setSub] = useState<PropsFunc>("tau");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "tau", label: "τ(n) 타우" },
            { key: "sigma", label: "σ(n) 시그마" },
            { key: "phi", label: "φ(n) 오일러" },
            { key: "mu", label: "μ(n) 뫼비우스" },
          ] as const
        ).map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSub(s.key)}
            className={
              "rounded-lg border px-3 py-1.5 text-sm font-semibold transition " +
              (sub === s.key
                ? "border-2 " +
                  colorBg(s.key) +
                  " " +
                  colorText(s.key)
                : "border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-900")
            }
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className={sub === "tau" ? "" : "hidden"}>
        <TauSubTab />
      </div>
      <div className={sub === "sigma" ? "" : "hidden"}>
        <SigmaSubTab />
      </div>
      <div className={sub === "phi" ? "" : "hidden"}>
        <PhiSubTab />
      </div>
      <div className={sub === "mu" ? "" : "hidden"}>
        <MuSubTab />
      </div>
    </div>
  );
}

function TheorySmall({
  color,
  title,
  children,
}: {
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"rounded-xl border-2 p-4 " + colorBg(color)}>
      <div className={"mb-2 text-base font-bold " + colorText(color)}>
        {title}
      </div>
      <div className="space-y-1.5 text-sm leading-relaxed text-slate-300">
        {children}
      </div>
    </div>
  );
}

function ResultBox({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"mt-2 rounded-lg border-2 p-3 text-sm " + colorBg(color)}>
      {children}
    </div>
  );
}

// τ
const TAU_PS = [2, 3, 5, 7] as const;
function TauSubTab() {
  return (
    <div className="space-y-4">
      <TheorySmall color="tau" title="τ(n)의 성질">
        <p>
          <b className="text-amber-300">성질 1</b>:{" "}
          <span className="text-slate-100">τ(n) 은 곱셈함수</span>
        </p>
        <p>
          <b className="text-amber-300">성질 2</b>: τ(p<sup>α</sup>) = α + 1
        </p>
        <p className="text-xs text-slate-500">
          p<sup>α</sup>의 모든 약수: 1, p, p², …, p<sup>α</sup> → 개수 = α+1
        </p>
        <p>
          <b className="text-amber-300">성질 3</b>: n = p₁<sup>α₁</sup> ··· p
          <sub>k</sub>
          <sup>α<sub>k</sub></sup> 이면 τ(n) = (α₁+1)(α₂+1) ··· (α<sub>k</sub>+1)
        </p>
      </TheorySmall>
      <TauPowCard />
      <TauGenCard />
    </div>
  );
}

function TauPowCard() {
  const [p, setP] = useState<number>(2);
  const [a, setA] = useState<number>(3);
  const divs = Array.from({ length: a + 1 }, (_, k) => Math.pow(p, k));
  const value = Math.pow(p, a);
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <h3 className="mb-2 text-sm font-bold text-white">
        🔬 소수 거듭제곱의 약수: τ(p<sup>α</sup>) = α + 1
      </h3>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="font-semibold text-slate-300">소수 p =</label>
        <select
          aria-label="p"
          value={p}
          onChange={(e) => setP(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-slate-200"
        >
          {TAU_PS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <label className="ml-2 font-semibold text-slate-300">지수 α =</label>
        <span className="min-w-[1.5rem] text-center font-bold text-blue-300">
          {a}
        </span>
        <input
          type="range"
          min={1}
          max={6}
          value={a}
          onChange={(e) => setA(Number(e.target.value))}
          className="w-24"
          aria-label="알파"
        />
      </div>
      <p className="mb-2 text-xs text-slate-400">
        <b>
          {p}
          <sup>{a}</sup> = {value}
        </b>{" "}
        의 약수:
      </p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {divs.map((d, i) => (
          <span
            key={i}
            className="rounded-md border border-blue-400/40 bg-blue-500/15 px-2 py-1 text-sm font-bold text-blue-200"
          >
            {d}
          </span>
        ))}
      </div>
      <ResultBox color="tau">
        총 <b>{a} + 1 = {a + 1}개</b> → τ({p}
        <sup>{a}</sup>) = {a} + 1 ={" "}
        <b className="text-blue-300 text-base">{a + 1}</b>
      </ResultBox>
    </div>
  );
}

function TauGenCard() {
  const [n, setN] = useState<number>(60);
  const f = factorize(n);
  const entries = Object.entries(f).map(([p, e]) => [Number(p), e] as const);
  const divs = divisors(n);
  const result = entries.reduce((a, [, e]) => a * (e + 1), 1);
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <h3 className="mb-2 text-sm font-bold text-white">
        🔬 일반 공식: τ(n) = (α₁+1) ··· (α<sub>k</sub>+1)
      </h3>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="font-semibold text-slate-300">n =</label>
        <span className="min-w-[2rem] text-center font-bold text-blue-300">
          {n}
        </span>
        <input
          type="range"
          min={2}
          max={120}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="flex-1 min-w-[120px]"
          aria-label="n"
        />
      </div>
      <p className="mb-2 text-sm">
        <b>n = {n}</b> ={" "}
        <span dangerouslySetInnerHTML={{ __html: factHtml(n) }} />
      </p>
      <div className="space-y-1.5 rounded-lg bg-slate-900/60 p-3 text-sm leading-7">
        {entries.map(([p, e]) => {
          const pDivs = Array.from({ length: e + 1 }, (_, k) => Math.pow(p, k));
          return (
            <div key={p}>
              {p}
              <sup>{e}</sup> 의 약수:{" "}
              {pDivs.map((d) => (
                <span
                  key={d}
                  className="ml-1 inline-block rounded-md border border-blue-400/40 bg-blue-500/15 px-2 py-0.5 text-xs font-bold text-blue-200"
                >
                  {d}
                </span>
              ))}{" "}
              → <b>{e} + 1 = {e + 1}개</b>
            </div>
          );
        })}
      </div>
      <ResultBox color="tau">
        τ({n}) = {entries.map(([, e]) => `(${e}+1)`).join("×")} ={" "}
        {entries.map(([, e]) => e + 1).join("×")} ={" "}
        <b className="text-blue-300 text-base">{result}</b> &nbsp;&nbsp;(약수 총
        개수: {divs.length}개 ✓)
      </ResultBox>
    </div>
  );
}

// σ
function SigmaSubTab() {
  return (
    <div className="space-y-4">
      <TheorySmall color="sigma" title="σ(n)의 성질">
        <p>
          <b className="text-amber-300">성질 1</b>:{" "}
          <span className="text-slate-100">σ(n) 은 곱셈함수</span>
        </p>
        <p>
          <b className="text-amber-300">성질 2</b>: σ(p<sup>α</sup>) = (p
          <sup>α+1</sup>−1)/(p−1) = 1 + p + p² + ··· + p<sup>α</sup>
        </p>
        <p className="text-xs text-slate-500">
          p<sup>α</sup> 의 약수의 합 = 등비수열의 합
        </p>
        <p>
          <b className="text-amber-300">성질 3</b>: σ(n) = σ(p₁<sup>α₁</sup>) ×
          ··· × σ(p<sub>k</sub>
          <sup>α<sub>k</sub></sup>)
        </p>
        <p>
          <b className="text-amber-300">완전수</b>: σ(n) = 2n 인 수 (예: 6, 28,
          496, 8128, …)
        </p>
      </TheorySmall>
      <SigmaPowCard />
      <PerfectNumberCard />
    </div>
  );
}

function SigmaPowCard() {
  const [p, setP] = useState<number>(2);
  const [a, setA] = useState<number>(3);
  const terms = Array.from({ length: a + 1 }, (_, k) => Math.pow(p, k));
  const total = terms.reduce((s, v) => s + v, 0);
  const formula = Math.round((Math.pow(p, a + 1) - 1) / (p - 1));
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <h3 className="mb-2 text-sm font-bold text-white">
        🔬 등비수열의 합: σ(p<sup>α</sup>)
      </h3>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="font-semibold text-slate-300">소수 p =</label>
        <select
          aria-label="p"
          value={p}
          onChange={(e) => setP(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-slate-200"
        >
          {TAU_PS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <label className="ml-2 font-semibold text-slate-300">지수 α =</label>
        <span className="min-w-[1.5rem] text-center font-bold text-emerald-300">
          {a}
        </span>
        <input
          type="range"
          min={1}
          max={5}
          value={a}
          onChange={(e) => setA(Number(e.target.value))}
          className="w-24"
          aria-label="알파"
        />
      </div>
      <p className="mb-2 text-xs text-slate-400">
        <b>
          {p}
          <sup>{a}</sup> = {Math.pow(p, a)}
        </b>{" "}
        의 약수의 합:
      </p>
      <div className="mb-2 flex flex-wrap items-center gap-1 text-sm">
        {terms.map((t, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-200">
              {t}
            </span>
            {i < terms.length - 1 ? (
              <span className="text-slate-500">+</span>
            ) : null}
          </span>
        ))}
        <span className="mx-1 text-slate-500">=</span>
        <span className="text-lg font-extrabold text-emerald-300">{total}</span>
      </div>
      <ResultBox color="sigma">
        등비수열 합 공식: ({p}
        <sup>{a + 1}</sup>−1)/({p}−1) = ({Math.pow(p, a + 1)}−1)/{p - 1} ={" "}
        <b className="text-emerald-300 text-base">{formula}</b>{" "}
        {total === formula ? "✓" : ""}
      </ResultBox>
    </div>
  );
}

const PERF_RANGES = [50, 100, 500, 1000] as const;

function PerfectNumberCard() {
  const [max, setMax] = useState<number>(100);
  const perfects = useMemo(() => {
    const arr: number[] = [];
    for (let n = 2; n <= max; n++) if (sigma(n) === 2 * n) arr.push(n);
    return arr;
  }, [max]);
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <h3 className="mb-2 text-sm font-bold text-white">
        🌟 완전수 (σ(n) = 2n) 탐구
      </h3>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="font-semibold text-slate-300">범위: 1 ~</label>
        <select
          aria-label="범위"
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-slate-200"
        >
          {PERF_RANGES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      {perfects.length === 0 ? (
        <p className="text-sm text-slate-400">
          {max} 이하에 완전수가 없습니다.
        </p>
      ) : (
        <div className="space-y-2">
          {perfects.map((n) => {
            const divs = divisors(n);
            return (
              <div
                key={n}
                className="rounded-xl border-2 border-amber-400/50 bg-amber-500/15 p-3"
              >
                <div className="text-base font-extrabold text-amber-200">
                  🌟 n = {n}
                </div>
                <div className="mt-1 space-y-0.5 text-sm leading-7 text-slate-200">
                  <div>약수: {divs.join(", ")}</div>
                  <div>
                    약수의 합: {divs.join("+")} = <b>{sigma(n)}</b> = 2 × {n} ✓
                  </div>
                  <div className="text-amber-200">
                    σ({n}) = {sigma(n)} = 2 × {n}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">
        알려진 완전수: 6, 28, 496, 8128, 33550336, … (모두 짝수인지는 미해결
        문제!)
      </p>
    </div>
  );
}

// φ
function PhiSubTab() {
  return (
    <div className="space-y-4">
      <TheorySmall color="phi" title="φ(n)의 성질">
        <p>
          <b className="text-amber-300">성질 1</b>: n 이 소수이면 φ(n) = n − 1
        </p>
        <p>
          <b className="text-amber-300">성질 2</b>: φ(p<sup>α</sup>) = p
          <sup>α</sup> (1 − 1/p) = p<sup>α</sup> − p<sup>α−1</sup>
        </p>
        <p>
          <b className="text-amber-300">성질 3</b>:{" "}
          <span className="text-slate-100">φ(n) 은 곱셈함수</span>
        </p>
        <p>
          <b className="text-amber-300">성질 4</b>: Σ<sub>d|n</sub> φ(d) = n
        </p>
      </TheorySmall>
      <PhiGridCard />
      <PhiSumCard />
    </div>
  );
}

function PhiGridCard() {
  const [n, setN] = useState<number>(12);
  const phiV = phi(n);
  const cells = Array.from({ length: n }, (_, i) => i + 1);
  const isPrime =
    Object.keys(factorize(n)).length === 1 &&
    Object.values(factorize(n))[0] === 1;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <h3 className="mb-2 text-sm font-bold text-white">
        🔬 서로소 격자: φ(n) 시각화
      </h3>
      <p className="mb-2 text-xs text-slate-400">
        초록 = n 과 서로 소 · 빨강 = 공약수 있음 · 파랑 = n 자신
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="font-semibold text-slate-300">n =</label>
        <span className="min-w-[2rem] text-center font-bold text-violet-300">
          {n}
        </span>
        <input
          type="range"
          min={2}
          max={40}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="flex-1 min-w-[120px]"
          aria-label="n"
        />
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}>
        {cells.map((k) => {
          const g = gcd(k, n);
          const cls =
            k === n
              ? "border-blue-400/60 bg-blue-500/25 text-blue-200"
              : g === 1
                ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                : "border-rose-400/40 bg-rose-500/10 text-rose-300";
          return (
            <div
              key={k}
              className={
                "aspect-square rounded-md border text-center text-sm font-bold flex items-center justify-center " +
                cls
              }
            >
              {k}
            </div>
          );
        })}
      </div>
      <ResultBox color="phi">
        φ({n}) = <b className="text-violet-300 text-base">{phiV}</b>{" "}
        &nbsp;&nbsp;(초록색 숫자 개수: {phiV}개)
        {isPrime ? (
          <div className="mt-1 text-xs text-violet-300">
            {n} 이 소수 → 1 ~ {n - 1} 모두 서로 소 → φ = {n} − 1 = {phiV}
          </div>
        ) : null}
      </ResultBox>
    </div>
  );
}

function PhiSumCard() {
  const [n, setN] = useState<number>(12);
  const divs = useMemo(() => divisors(n), [n]);
  const phiVals = divs.map((d) => phi(d));
  const total = phiVals.reduce((a, v) => a + v, 0);
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <h3 className="mb-2 text-sm font-bold text-white">
        🔬 성질 4: Σ<sub>d|n</sub> φ(d) = n
      </h3>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="font-semibold text-slate-300">n =</label>
        <select
          aria-label="n"
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-slate-200"
        >
          {MN_RANGE.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <p className="mb-2 text-sm">
        <b>n = {n}</b> 의 약수:{" "}
        {divs.map((d) => (
          <span
            key={d}
            className="ml-1 inline-block rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-xs font-bold text-violet-200"
          >
            {d}
          </span>
        ))}
      </p>
      <div className="rounded-lg bg-slate-900/60 p-3 text-sm leading-8">
        {divs.map((d, i) => (
          <span key={d}>
            φ({d}) = <b>{phiVals[i]}</b>
            {i < divs.length - 1 ? (
              <span className="mx-2 text-slate-500">|</span>
            ) : null}
          </span>
        ))}
      </div>
      <ResultBox color="phi">
        Σ<sub>d|{n}</sub> φ(d) = {phiVals.join("+")} ={" "}
        <b className="text-violet-300 text-base">{total}</b> = {n}{" "}
        {total === n ? "✓" : "✗"}
        <div className="mt-1 text-xs text-violet-300">
          φ의 성질 4: n 의 모든 약수에 대해 φ 를 더하면 항상 n 이 됩니다!
        </div>
      </ResultBox>
    </div>
  );
}

// μ
function MuSubTab() {
  return (
    <div className="space-y-4">
      <TheorySmall color="mu" title="μ(n)의 성질">
        <p>
          <b className="text-amber-300">성질 1</b>:{" "}
          <span className="text-slate-100">μ(n) 은 곱셈함수</span> (탭 3 이론카드
          참조)
        </p>
        <p>
          <b className="text-amber-300">성질 2</b>: Σ<sub>d|n</sub> μ(d) = ε(n)
          &nbsp;(n=1 이면 1, n &gt; 1 이면 0)
        </p>
        <p>
          <b className="text-amber-300">성질 3 (뫼비우스 역산 공식)</b>:
          <br />
          g(n) = Σ<sub>d|n</sub> f(d) 이면 f(n) = Σ<sub>d|n</sub> μ(d) g(n/d)
        </p>
        <p>
          <b className="text-amber-300">성질 4</b>: φ(n) = Σ<sub>d|n</sub> μ(d)
          · (n/d) (Σ<sub>d|n</sub>φ(d)=n 에 역산 공식 적용)
        </p>
      </TheorySmall>
      <MuSumCard />
      <MobiusCard />
    </div>
  );
}

function MuSumCard() {
  const [n, setN] = useState<number>(12);
  const divs = useMemo(() => divisors(n), [n]);
  const muVals = divs.map((d) => mu(d));
  const total = muVals.reduce((a, v) => a + v, 0);
  const epsilon = n === 1 ? 1 : 0;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <h3 className="mb-2 text-sm font-bold text-white">
        🔬 성질 2: Σ<sub>d|n</sub> μ(d) = ε(n)
      </h3>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="font-semibold text-slate-300">n =</label>
        <span className="min-w-[2rem] text-center font-bold text-amber-300">
          {n}
        </span>
        <input
          type="range"
          min={1}
          max={60}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="flex-1 min-w-[120px]"
          aria-label="n"
        />
      </div>
      <div className="rounded-lg bg-slate-900/60 p-3 text-sm">
        <div className="flex flex-wrap items-center gap-1">
          {divs.map((d, i) => {
            const mv = muVals[i];
            const cls =
              mv > 0
                ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                : mv < 0
                  ? "border-rose-400/50 bg-rose-500/15 text-rose-200"
                  : "border-slate-500/40 bg-slate-700/40 text-slate-400";
            return (
              <span key={d} className="flex items-center gap-1">
                <span
                  className={
                    "rounded-md border px-2 py-0.5 font-bold " + cls
                  }
                >
                  μ({d}) = {mv}
                </span>
                {i < divs.length - 1 ? (
                  <span className="text-slate-500">+</span>
                ) : null}
              </span>
            );
          })}
        </div>
      </div>
      <ResultBox color="mu">
        합계 = {muVals.join("+")} ={" "}
        <b className="text-amber-300 text-base">{total}</b> = ε({n}) ={" "}
        <b>{epsilon}</b> {total === epsilon ? "✓" : "✗"}
        <div className="mt-1 text-xs text-amber-300">
          {n === 1
            ? "n=1 이면 ε(1)=1"
            : "n>1 이면 ε(n)=0 (약수들의 μ 값이 항상 상쇄됩니다!)"}
        </div>
      </ResultBox>
    </div>
  );
}

function MobiusCard() {
  const [n, setN] = useState<number>(12);
  const divs = useMemo(() => divisors(n), [n]);
  const rows = divs.map((d) => ({
    d,
    mud: mu(d),
    nd: n / d,
    val: mu(d) * (n / d),
  }));
  const total = rows.reduce((a, r) => a + r.val, 0);
  const phiV = phi(n);
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <h3 className="mb-2 text-sm font-bold text-white">
        🔬 성질 4: φ(n) = Σ<sub>d|n</sub> μ(d) · (n/d) — 뫼비우스 역산 공식 적용
      </h3>
      <p className="mb-3 text-xs text-slate-400">
        Σ<sub>d|n</sub> φ(d) = n 임을 알고 있으므로, g(n)=n, f(n)=φ(n) 으로
        놓고 역산 공식을 적용합니다.
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="font-semibold text-slate-300">n =</label>
        <select
          aria-label="n"
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-slate-200"
        >
          {MN_RANGE.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="px-3 py-2">약수 d</th>
              <th className="px-3 py-2">소인수분해</th>
              <th className="px-3 py-2 text-amber-300">μ(d)</th>
              <th className="px-3 py-2">n / d</th>
              <th className="px-3 py-2">μ(d) · (n/d)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const muCls =
                r.mud > 0
                  ? "text-emerald-300"
                  : r.mud < 0
                    ? "text-rose-300"
                    : "text-slate-500";
              return (
                <tr
                  key={r.d}
                  className={
                    "border-b border-white/5 " +
                    (i % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20")
                  }
                >
                  <td className="px-3 py-1.5 text-center font-bold text-slate-100">
                    {r.d}
                  </td>
                  <td
                    className="px-3 py-1.5 text-center text-xs text-slate-300"
                    dangerouslySetInnerHTML={{ __html: factHtml(r.d) }}
                  />
                  <td className={"px-3 py-1.5 text-center font-bold " + muCls}>
                    {r.mud}
                  </td>
                  <td className="px-3 py-1.5 text-center text-slate-200">
                    {n}/{r.d} = {r.nd}
                  </td>
                  <td className="px-3 py-1.5 text-center font-bold text-amber-300">
                    {r.mud} × {r.nd} = {r.val}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ResultBox color="mu">
        φ({n}) = Σ<sub>d|{n}</sub> μ(d) · ({n}/d) ={" "}
        {rows.map((r) => r.val).join("+")} ={" "}
        <b className="text-violet-300 text-base">{total}</b>{" "}
        &nbsp;&nbsp;(직접 계산 φ({n}) = {phiV}) {total === phiV ? "✓" : "✗"}
      </ResultBox>
    </div>
  );
}

// ─── 탭 5: 퀴즈 ────────────────────────────────────────────────
type QuizFunc = "tau" | "sigma" | "phi" | "mu";
type Question = {
  func: QuizFunc;
  n: number;
  prompt: string;
  ans: number;
  explainHtml: string;
  opts: number[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function genWrongs(correct: number, fn: QuizFunc): number[] {
  if (fn === "mu") return [-1, 0, 1].filter((v) => v !== correct);
  const set = new Set<number>();
  for (const v of [
    correct - 2,
    correct - 1,
    correct + 1,
    correct + 2,
    correct + 3,
  ]) {
    if (v !== correct && v > 0) set.add(v);
  }
  for (let n = 2; set.size < 3 && n <= 25; n++) {
    const v = fn === "tau" ? tau(n) : fn === "sigma" ? sigma(n) : phi(n);
    if (v !== correct && v > 0) set.add(v);
  }
  return Array.from(set).slice(0, 3);
}

function buildQuestion(func: QuizFunc, n: number): Question {
  const ans =
    func === "tau"
      ? tau(n)
      : func === "sigma"
        ? sigma(n)
        : func === "phi"
          ? phi(n)
          : mu(n);
  const opts = shuffle([ans, ...genWrongs(ans, func).slice(0, 3)]);
  let prompt = "";
  let explainHtml = "";
  if (func === "tau") {
    prompt = `τ(${n}) = ?`;
    explainHtml = `${n} = ${factHtml(n)} → 약수: ${divisors(n).join(", ")} → τ = <b>${tau(n)}</b>`;
  } else if (func === "sigma") {
    prompt = `σ(${n}) = ?`;
    explainHtml = `약수의 합: ${divisors(n).join("+")} = <b>${sigma(n)}</b>`;
  } else if (func === "phi") {
    prompt = `φ(${n}) = ?`;
    explainHtml = `${n} 과 서로 소인 수의 개수 = <b>${phi(n)}</b>`;
  } else {
    prompt = `μ(${n}) = ?`;
    explainHtml = `${factHtml(n)} → μ = <b>${mu(n)}</b>`;
  }
  return { func, n, prompt, ans, explainHtml, opts };
}

function buildQuizSet(): Question[] {
  const types: QuizFunc[] = ["tau", "sigma", "phi", "mu"];
  const qs: Question[] = [];
  for (let i = 0; i < 5; i++) {
    const t = types[Math.floor(Math.random() * types.length)];
    const n = Math.floor(Math.random() * 20) + 2;
    qs.push(buildQuestion(t, n));
  }
  return qs;
}

function QuizTab() {
  const [questions, setQuestions] = useState<Question[]>(() => buildQuizSet());
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    new Array(5).fill(null),
  );

  function regenerate() {
    setQuestions(buildQuizSet());
    setAnswers(new Array(5).fill(null));
  }

  function answer(i: number, chosen: number) {
    if (answers[i] != null) return;
    const next = answers.slice();
    next[i] = chosen;
    setAnswers(next);
  }

  const answered = answers.filter((a) => a != null).length;
  const score = answers.reduce<number>(
    (acc, a, i) => acc + (a != null && a === questions[i].ans ? 1 : 0),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-slate-900/40 p-4">
        <div>
          <div className="text-2xl font-extrabold text-cyan-300">
            {score} / {answered}
          </div>
          <div className="text-xs text-slate-400">점수</div>
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={regenerate}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
        >
          🎲 새 문제 세트
        </button>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => {
          const chosen = answers[i];
          const done = chosen != null;
          const correct = done && chosen === q.ans;
          return (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-slate-900/40 p-4"
            >
              <div className="mb-3 text-base font-bold text-white">
                {i + 1}. {q.prompt}
              </div>
              <div className="flex flex-wrap gap-2">
                {q.opts.map((opt) => {
                  let cls =
                    "border border-white/10 bg-slate-900 text-slate-200 hover:bg-slate-800";
                  if (done) {
                    if (opt === q.ans) {
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
                      onClick={() => answer(i, opt)}
                      className={
                        "min-w-[60px] rounded-md px-4 py-2 text-base font-bold transition " +
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
                  <span className="font-bold">
                    {correct ? "✅ 정답!" : "❌ 오답!"}
                  </span>{" "}
                  <span dangerouslySetInnerHTML={{ __html: q.explainHtml }} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export {
  factorize,
  tau,
  sigma,
  phi,
  mu,
  gcd,
  divisors,
  factHtml,
};
