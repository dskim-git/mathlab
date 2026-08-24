"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import { AS_OF, CURRENCIES, CURRENT_KRW } from "./data";
import { FLAG } from "./flags";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "buy_sell_spread",
    prompt:
      "탭①에서 은행이 외화를 ‘팔 때(내가 살 때)’는 매매기준율보다 비쌌고 ‘살 때(내가 팔 때)’는 더 쌌어요. 왜 은행은 사고파는 가격을 다르게 두는지, 그 차이(환전 수수료)가 어디서 생기는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 은행은 환전을 해 주는 대가로 기준율보다 비싸게 팔고 싸게 사서 차익(수수료)을 얻는다. 그래서 내가 외화를 살 땐 기준율보다 더 내고, 팔 땐 덜 받는다.",
  },
  {
    id: "fewer_exchanges",
    prompt:
      "탭②에서 달러를 엔으로 바로 바꾼 경우와 달러→원→엔으로 두 번 바꾼 경우, 받은 엔화가 달랐어요. 왜 환전을 여러 번 할수록 손해인지 수수료 관점에서 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 환전할 때마다 살 때·팔 때 차이(수수료)를 낸다. 두 번 바꾸면 수수료를 두 번 내므로 최종 금액이 줄어든다. 그래서 환전 횟수를 줄이는 게 유리하다.",
  },
  {
    id: "smart_tips",
    prompt:
      "여행 갈 때 환전 수수료를 줄이려면 어떻게 해야 할지(환전 횟수, 통화 선택, 환율 우대 등) 이 활동에서 배운 것을 바탕으로 나만의 방법을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 필요한 통화로 한 번에 환전하고, 여러 번 바꾸지 않는다. 환율 우대(수수료 할인)를 받고, 남은 외화는 되도록 다시 바꾸지 않는다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function won(v: number): string { return `${Math.round(v).toLocaleString()}원`; }
function foreign(v: number, code: string): string {
  if (code === "JPY") return `${Math.round(v).toLocaleString()}엔`;
  return `${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${code}`;
}
function rate(v: number, d = 2): string { return v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }); }
function FlagImg({ code, className }: { code: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={FLAG[code]} alt={code} className={"inline-block shrink-0 rounded-sm object-cover " + (className ?? "h-3.5 w-5")} />;
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "booth" | "trip";

export default function ExchangeSmartLab() {
  const [tab, setTab] = useState<Tab>("booth");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">💵 현명하게 환전하기</h3>
        <p className="mt-2 leading-7 text-slate-300">
          은행·환전소에는 <b className="text-emerald-200">매매기준율</b>과 <b className="text-rose-200">살 때</b>·<b className="text-sky-200">팔 때</b> 가격이
          따로 있어요. 실제 환율로 환전을 체험하며 <b className="text-emerald-200">환전 수수료</b>를 확인하고, 어떻게 하면 손해를 줄일 수 있는지 알아봐요.
        </p>
        <p className="mt-1 text-xs text-slate-500">환율 Frankfurter(ECB) · 기준일 {AS_OF} · 현찰 수수료율은 일반적인 은행 기준(근사)</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "booth"} onClick={() => setTab("booth")}>① 환전소 체험</TabButton>
        <TabButton active={tab === "trip"} onClick={() => setTab("trip")}>② 수지의 여행 환전</TabButton>
      </div>

      <div className="mt-4">{tab === "booth" ? <BoothTab /> : <TripTab />}</div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={"rounded-xl border-2 px-3 py-2 text-sm font-bold transition " + (active ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 환전소 체험 (환율 표기판 + 환전 계산기)
// ══════════════════════════════════════════════════════════════
// 계산기 기본 금액 — 방향에 따라 단위가 원/외화로 달라지므로 각각 따로 둔다.
const KRW_DEFAULT = 500000;
// 약 40만 원어치를 그 통화에서 자연스러운 자릿수로 반올림 (USD→300, JPY→50000 …)
function niceForeign(wonPerUnit: number): number {
  const raw = 400000 / wonPerUnit;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  return Math.max(1, Math.round(raw / mag) * mag);
}

function BoothTab() {
  const [rates, setRates] = useState<Record<string, number>>({ ...CURRENT_KRW });
  const [asOf, setAsOf] = useState(AS_OF);
  const [liveState, setLiveState] = useState<"idle" | "loading" | "error">("idle");
  const [code, setCode] = useState("USD");
  const [dir, setDir] = useState<"buy" | "sell">("buy"); // buy: 원→외화(외화 삼), sell: 외화→원(외화 팖)
  // 원→외화는 '원', 외화→원은 그 외화가 단위라 하나의 숫자를 공유하면 단위가 뒤바뀐다.
  const [krwAmount, setKrwAmount] = useState(KRW_DEFAULT);
  const [fxAmount, setFxAmount] = useState(() => niceForeign(CURRENT_KRW.USD));
  const amount = dir === "buy" ? krwAmount : fxAmount;
  const setAmount = dir === "buy" ? setKrwAmount : setFxAmount;

  function chooseCode(next: string) {
    setCode(next);
    setFxAmount(niceForeign(rates[next] ?? CURRENT_KRW[next]));
  }

  const cur = CURRENCIES.find((c) => c.code === code)!;
  const base = rates[code] ?? CURRENT_KRW[code]; // 원/1단위 (매매기준율)
  const buy = base * (1 + cur.spread); // 살 때(원/1단위)
  const sell = base * (1 - cur.spread); // 팔 때

  async function refresh() {
    setLiveState("loading");
    try {
      const res = await fetch("/api/economics/exchange-rate", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok || !json.krw) throw new Error();
      setRates((r) => ({ ...r, ...json.krw }));
      if (json.date) setAsOf(json.date);
      setLiveState("idle");
    } catch { setLiveState("error"); }
  }

  // 계산
  let received = 0, feeWon = 0, baseResult = 0;
  if (dir === "buy") { received = amount / buy; baseResult = amount / base; feeWon = amount - received * base; }
  else { received = amount * sell; baseResult = amount * base; feeWon = received > 0 ? amount * (base - sell) : 0; }

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">💡 환전소 <b className="text-emerald-200">환율 표기판</b>이에요. 통화를 고르고 금액을 넣어 환전해 보세요. <b className="text-rose-200">살 때</b>=내가 외화를 살 때, <b className="text-sky-200">팔 때</b>=내가 외화를 팔 때.</p>

      {/* 새로고침 */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={refresh} disabled={liveState === "loading"} className="rounded-lg border border-emerald-400/45 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-50">
          {liveState === "loading" ? "불러오는 중…" : "🔄 오늘 환율로 업데이트"}
        </button>
        <span className="text-xs text-slate-500">기준 {asOf === AS_OF ? `${AS_OF} 스냅샷` : <b className="text-emerald-300">{asOf} (방금)</b>}</span>
        {liveState === "error" ? <span className="text-xs text-amber-300/90">⚠️ 실패 — 스냅샷 사용</span> : null}
      </div>

      {/* 표기판 */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/70">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-900/80 text-slate-300">
              <th className="px-3 py-2 text-left text-xs">통화</th>
              <th className="px-3 py-2 text-right text-xs">매매기준율</th>
              <th className="px-3 py-2 text-right text-xs text-rose-200">현찰 살 때</th>
              <th className="px-3 py-2 text-right text-xs text-sky-200">현찰 팔 때</th>
            </tr>
          </thead>
          <tbody>
            {CURRENCIES.map((c) => {
              const b = (rates[c.code] ?? CURRENT_KRW[c.code]) * c.unit;
              const isSel = c.code === code;
              return (
                <tr key={c.code} onClick={() => chooseCode(c.code)} className={"cursor-pointer border-t border-white/5 transition " + (isSel ? "bg-emerald-400/10" : "hover:bg-white/5")}>
                  <td className="px-3 py-1.5"><span className="flex items-center gap-1.5 font-bold text-slate-100"><FlagImg code={c.code} /> {c.unit === 100 ? "100 " : ""}{c.code}</span></td>
                  <td className="px-3 py-1.5 text-right font-mono text-white">{won(b)}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-rose-200">{won(b * (1 + c.spread))}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-sky-200">{won(b * (1 - c.spread))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-[10px] text-slate-500">표는 <b className="text-slate-300">{cur.unit === 100 ? "100" : "1"}{code}</b> 기준. 수수료율 {(cur.spread * 100).toFixed(2)}%(편도) 적용. 행을 누르면 아래 계산기에 반영돼요.</p>

      {/* 계산기 */}
      <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 p-4">
        <div className="flex overflow-hidden rounded-lg border border-white/10">
          <button type="button" onClick={() => setDir("buy")} className={"flex-1 px-3 py-1.5 text-xs font-bold transition " + (dir === "buy" ? "bg-rose-400/20 text-rose-100" : "text-slate-400 hover:bg-white/5")}>원 → {code} 사기</button>
          <button type="button" onClick={() => setDir("sell")} className={"flex-1 px-3 py-1.5 text-xs font-bold transition " + (dir === "sell" ? "bg-sky-400/20 text-sky-100" : "text-slate-400 hover:bg-white/5")}>{code} → 원 팔기</button>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex-1 text-xs text-slate-400">
            {dir === "buy" ? "환전할 금액 (원화)" : `가진 금액 (${code})`}
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 focus-within:border-emerald-400/60">
              <input type="number" min={0} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} className="w-full bg-transparent text-right font-mono text-lg text-white outline-none" />
              <span className="shrink-0 text-sm font-bold text-slate-300">{dir === "buy" ? "원" : code}</span>
            </div>
          </label>
          <select value={code} onChange={(e) => chooseCode(e.target.value)} aria-label="통화" className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-sm font-bold text-white outline-none">
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
        </div>

        <div className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] px-4 py-3">
          <p className="text-xs text-slate-400">받는 금액</p>
          <p className="font-mono text-2xl font-bold text-emerald-100">{dir === "buy" ? foreign(received, code) : won(received)}</p>
          <p className="mt-1 font-mono text-xs text-slate-400">
            {dir === "buy" ? `${won(amount)} ÷ 살 때(${won(buy * cur.unit)}/${cur.unit === 100 ? 100 : 1}${code})` : `${foreign(amount, code)} × 팔 때(${won(sell * cur.unit)}/${cur.unit === 100 ? 100 : 1}${code})`}
          </p>
        </div>

        <div className="mt-2 rounded-xl border-l-4 border-amber-400 bg-amber-400/[0.08] px-4 py-2.5 text-sm text-slate-200">
          💸 환전 수수료 ≈ <b className="text-amber-200">{won(feeWon)}</b>.{" "}
          {dir === "buy"
            ? `매매기준율이면 ${foreign(baseResult, code)}를 받지만, 살 때 가격이라 ${foreign(received, code)}만 받아요.`
            : `매매기준율이면 ${won(baseResult)}을 받지만, 팔 때 가격이라 ${won(received)}만 받아요.`}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 수지의 여행 환전 (직접 vs 이중 환전)
// ══════════════════════════════════════════════════════════════
const SPREAD = { usd: 0.0175, krw: 0.0175, jpy: 0.0175 };

function TripTab() {
  const [budget, setBudget] = useState(500); // 엔으로 바꿀 달러

  const wonPerUsd = CURRENT_KRW.USD; // 원/달러
  const wonPerJpy = CURRENT_KRW.JPY; // 원/엔
  const usdPerKrw = 1 / wonPerUsd; // 달러/원
  const usdPerJpy = wonPerJpy / wonPerUsd; // 달러/엔

  // 미국 기준(달러) 표: 1단위 외화 = ? 달러
  const usTable = [
    { label: "한국 원 (1원)", base: usdPerKrw, s: SPREAD.krw, digits: 6 },
    { label: "일본 엔 (1엔)", base: usdPerJpy, s: SPREAD.jpy, digits: 4 },
  ];
  // 한국 기준(원) 표: 1단위 외화 = ? 원
  const krTable = [
    { label: "미국 달러 (1$)", base: wonPerUsd, s: SPREAD.usd, digits: 0 },
    { label: "일본 엔 (1엔)", base: wonPerJpy, s: SPREAD.jpy, digits: 2 },
  ];

  // 경로 A: $budget → 엔 직접(미국서 엔 살 때)
  const usdBuyJpy = usdPerJpy * (1 + SPREAD.jpy); // 달러/엔 살 때
  const yenA = budget / usdBuyJpy;
  // 경로 B: $budget → 원(미국서 원 살 때) → 엔(한국서 엔 살 때)
  const usdBuyKrw = usdPerKrw * (1 + SPREAD.krw); // 달러/원 살 때
  const krwFromUsd = budget / usdBuyKrw; // 받은 원
  const wonBuyJpy = wonPerJpy * (1 + SPREAD.jpy); // 원/엔 살 때
  const yenB = krwFromUsd / wonBuyJpy;
  const lostYen = yenA - yenB;

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm leading-6 text-slate-300">
        🧳 수지는 미국 LA에서 출발해 한국·일본을 여행해요. 달러를 <b className="text-emerald-200">엔화로 바로</b> 바꾸는 것과{" "}
        <b className="text-emerald-200">달러→원→엔</b>으로 두 번 바꾸는 것, 어느 쪽이 이득일까요? (실제 환율 기준)
      </p>

      {/* 환율 표 2개 */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <RateTable title="🇺🇸 미국 기준 (단위: 달러)" rows={usTable} unit="$" />
        <RateTable title="🇰🇷 한국 기준 (단위: 원)" rows={krTable} unit="원" />
      </div>

      {/* 금액 조절 */}
      <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">엔화로 바꿀 금액</span>
          <span className="font-mono text-lg font-bold text-emerald-200">${budget.toLocaleString()}</span>
        </div>
        <input type="range" min={100} max={1000} step={50} value={budget} onChange={(e) => setBudget(Number(e.target.value))} aria-label="달러 금액" className="mt-1 h-2 w-full cursor-pointer accent-emerald-400" />
        <div className="mt-1 flex flex-wrap gap-2">
          {[100, 300, 500, 1000].map((v) => <button key={v} type="button" onClick={() => setBudget(v)} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-200 hover:bg-white/10">${v}</button>)}
        </div>
      </div>

      {/* 두 경로 비교 */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-400/[0.10] p-4">
          <p className="text-sm font-bold text-emerald-100">경로 A · 직접 환전 (1번)</p>
          <p className="mt-1 font-mono text-xs text-slate-300">${budget} → 엔 (미국서 엔 살 때)</p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{foreign(yenA, "JPY")}</p>
          <p className="mt-0.5 font-mono text-[11px] text-slate-400">${budget} ÷ {rate(usdBuyJpy, 4)}(달러/엔)</p>
        </div>
        <div className="rounded-xl border-2 border-rose-400/50 bg-rose-400/[0.08] p-4">
          <p className="text-sm font-bold text-rose-100">경로 B · 이중 환전 (2번)</p>
          <p className="mt-1 font-mono text-xs text-slate-300">${budget} → 원 → 엔</p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{foreign(yenB, "JPY")}</p>
          <p className="mt-0.5 font-mono text-[11px] text-slate-400">${budget} → {won(krwFromUsd)} → 엔</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border-l-4 border-amber-400 bg-amber-400/[0.08] px-4 py-3 text-sm text-slate-200">
        📉 직접 환전이 <b className="text-emerald-200">{foreign(lostYen, "JPY")}</b> 더 이득! 두 번 환전하면 <b className="text-rose-200">수수료를 두 번</b> 내기 때문이에요.
        <span className="text-slate-400"> 그래서 필요한 통화로 <b className="text-slate-200">한 번에</b> 환전하는 게 현명해요(환전 횟수 최소화).</span>
      </div>

      {/* 교과서형 문항 — 직접 풀기 */}
      <Worksheet />
    </div>
  );
}

// ── 확인 문제 워크시트(빈칸 채우기 · 즉시 채점) ──
function Worksheet() {
  const wonPerUsd = CURRENT_KRW.USD, wonPerJpy = CURRENT_KRW.JPY;
  const usdPerKrw = 1 / wonPerUsd, usdPerJpy = wonPerJpy / wonPerUsd;
  const usdBuyJpy = usdPerJpy * (1 + SPREAD.jpy); // 달러/엔 살 때
  const usdBuyKrw = usdPerKrw * (1 + SPREAD.krw); // 달러/원 살 때
  const wonBuyJpy = wonPerJpy * (1 + SPREAD.jpy); // 원/엔 살 때
  const yenA = 500 / usdBuyJpy;
  const krw = 500 / usdBuyKrw;
  const yenB = krw / wonBuyJpy;
  const lost = yenA - yenB;
  const [q3, setQ3] = useState<number | null>(null);

  return (
    <div className="mt-3 rounded-xl border border-violet-400/30 bg-violet-400/[0.06] p-4">
      <p className="text-base font-bold text-violet-200">📝 확인 문제 — 직접 풀어 보세요!</p>
      <p className="mt-1 text-sm text-slate-300">
        수지가 <b className="text-white">$500</b>를 엔화로 바꾸려고 해요. 두 가지 방법으로 계산해 빈칸을 채우고 <b className="text-violet-200">확인</b>을 눌러 보세요. (계산기를 써도 좋아요!)
      </p>

      <div className="mt-3 lg:grid lg:grid-cols-[1fr_224px] lg:gap-4">
        <div className="space-y-2">
      {/* 문제 1 */}
      <div className="rounded-xl border border-emerald-400/30 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-emerald-200">문제 1. 달러 → 엔 (직접, 1번 환전)</p>
        <p className="mt-1 text-xs text-slate-400">미국 환전소에서 달러로 엔을 <b className="text-rose-200">살 때</b> 환율: <b className="text-white">{rate(usdBuyJpy, 4)}</b> 달러/엔</p>
        <FillStep formula={`$500 ÷ ${rate(usdBuyJpy, 4)}`} answer={yenA} unit="엔" />
      </div>

      {/* 문제 2 */}
      <div className="mt-2 rounded-xl border border-rose-400/30 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-rose-200">문제 2. 달러 → 원 → 엔 (2번 환전)</p>
        <p className="mt-1 text-xs text-slate-400">① 미국서 달러로 원을 <b className="text-rose-200">살 때</b>: <b className="text-white">{rate(usdBuyKrw, 6)}</b> 달러/원</p>
        <FillStep formula={`$500 ÷ ${rate(usdBuyKrw, 6)}`} answer={krw} unit="원" />
        <p className="mt-2 text-xs text-slate-400">② 그 <b className="text-white">{won(krw)}</b>을 한국서 엔으로 <b className="text-rose-200">살 때</b>: <b className="text-white">{rate(wonBuyJpy, 2)}</b> 원/엔</p>
        <FillStep formula={`${won(krw)} ÷ ${rate(wonBuyJpy, 2)}`} answer={yenB} unit="엔" />
      </div>

      {/* 문제 3 */}
      <div className="mt-2 rounded-xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-200">문제 3. 어느 방법이 엔화를 더 많이 받을까요?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["문제 1 (직접)", "문제 2 (원 거쳐)", "똑같다"].map((opt, i) => {
            const show = q3 !== null;
            const right = show && i === 0;
            const wrong = show && q3 === i && i !== 0;
            return (
              <button key={i} type="button" onClick={() => setQ3(i)}
                className={"rounded-lg border-2 px-3 py-1.5 text-sm font-bold transition " + (right ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : wrong ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : q3 === i ? "border-violet-400/60 bg-violet-400/15 text-violet-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")}>
                {opt}{right ? " ✓" : wrong ? " ✕" : ""}
              </button>
            );
          })}
        </div>
        {q3 !== null ? (
          <p className={"mt-2 rounded-lg border-l-4 px-3 py-2 text-sm " + (q3 === 0 ? "border-emerald-400 bg-emerald-400/10 text-emerald-100" : "border-amber-400 bg-amber-400/10 text-slate-200")}>
            {q3 === 0 ? "정답! ✅ " : "정답은 ‘문제 1 (직접)’이에요. "}
            직접 환전(<b>{foreign(yenA, "JPY")}</b>)이 원을 거친 것(<b>{foreign(yenB, "JPY")}</b>)보다 <b className="text-emerald-200">{foreign(lost, "JPY")}</b> 더 많아요. 환전을 <b>적게</b> 할수록 유리해요!
          </p>
        ) : null}
      </div>
        </div>

        <div className="mt-3 lg:mt-0">
          <div className="lg:sticky lg:top-4"><Calculator /></div>
        </div>
      </div>
    </div>
  );
}

function FillStep({ formula, answer, unit }: { formula: string; answer: number; unit: string }) {
  const [val, setVal] = useState("");
  const [checked, setChecked] = useState(false);
  const num = Number(val.replace(/[,\s]/g, ""));
  const ok = Number.isFinite(num) && num > 0 && Math.abs(num - answer) <= Math.max(answer * 0.015, 2);
  return (
    <div className="mt-1.5">
      <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
        <span className="text-slate-300">{formula} =</span>
        <input type="text" inputMode="numeric" value={val} onChange={(e) => { setVal(e.target.value); setChecked(false); }} placeholder="?"
          className={"w-28 rounded-lg border-2 bg-slate-900 px-2 py-1 text-right text-white outline-none focus:border-emerald-300 " + (!checked ? "border-white/15" : ok ? "border-emerald-400/60" : "border-rose-400/60")} />
        <span className="text-slate-400">{unit}</span>
        <button type="button" onClick={() => setChecked(true)} className="rounded-lg border border-violet-400/50 bg-violet-400/15 px-3 py-1 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25">확인</button>
        {checked ? <span>{ok ? "✅" : "❌"}</span> : null}
      </div>
      {checked && !ok ? <p className="mt-1 text-xs text-amber-200/90">💡 다시 계산해 보세요. (정답은 약 {Math.round(answer).toLocaleString()} {unit})</p> : null}
      {checked && ok ? <p className="mt-1 text-xs text-emerald-200/90">잘했어요! 🎉</p> : null}
    </div>
  );
}

function RateTable({ title, rows, unit }: { title: string; rows: { label: string; base: number; s: number; digits: number }[]; unit: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/60">
      <p className="bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-slate-200">{title}</p>
      <table className="min-w-full text-xs">
        <thead>
          <tr className="text-slate-400">
            <th className="px-2 py-1 text-left">통화</th>
            <th className="px-2 py-1 text-right">매매기준율</th>
            <th className="px-2 py-1 text-right text-rose-200">살 때</th>
            <th className="px-2 py-1 text-right text-sky-200">팔 때</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-white/5">
              <td className="px-2 py-1 text-slate-200">{r.label}</td>
              <td className="px-2 py-1 text-right font-mono text-white">{rate(r.base, r.digits)}</td>
              <td className="px-2 py-1 text-right font-mono text-rose-200">{rate(r.base * (1 + r.s), r.digits)}</td>
              <td className="px-2 py-1 text-right font-mono text-sky-200">{rate(r.base * (1 - r.s), r.digits)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-2 py-1 text-[9px] text-slate-500">단위: 외화 1단위 = ? {unit}</p>
    </div>
  );
}

// ── 간단 사칙연산 계산기 ──
function Calculator() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(true);

  function fmtNum(n: number): string {
    if (!Number.isFinite(n)) return "오류";
    if (Math.abs(n) >= 1e13) return n.toExponential(5);
    return String(Math.round(n * 1e6) / 1e6);
  }
  function calc(a: number, b: number, o: string): number {
    return o === "+" ? a + b : o === "−" ? a - b : o === "×" ? a * b : o === "÷" ? (b === 0 ? NaN : a / b) : b;
  }
  function digit(d: string) {
    setDisplay((c) => (overwrite || c === "0" ? d : c.replace(/^-?/, (m) => m) .length >= 15 ? c : c + d));
    setOverwrite(false);
  }
  function dot() {
    if (overwrite) { setDisplay("0."); setOverwrite(false); return; }
    setDisplay((c) => (c.includes(".") ? c : c + "."));
  }
  function chooseOp(o: string) {
    const cur = Number(display);
    if (op !== null && prev !== null && !overwrite) { const r = calc(prev, cur, op); setPrev(r); setDisplay(fmtNum(r)); }
    else setPrev(cur);
    setOp(o); setOverwrite(true);
  }
  function equals() {
    if (op === null || prev === null) return;
    const r = calc(prev, Number(display), op);
    setDisplay(fmtNum(r)); setPrev(null); setOp(null); setOverwrite(true);
  }
  function clearAll() { setDisplay("0"); setPrev(null); setOp(null); setOverwrite(true); }
  function back() { if (overwrite) return; setDisplay((c) => (c.length <= 1 || (c.length === 2 && c.startsWith("-")) ? "0" : c.slice(0, -1))); }
  function sign() { setDisplay((c) => (c === "0" || c === "오류" ? c : c.startsWith("-") ? c.slice(1) : "-" + c)); }

  const shown = (() => {
    if (display === "오류") return display;
    const neg = display.startsWith("-");
    const [i, f] = display.replace("-", "").split(".");
    const gi = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (neg ? "-" : "") + gi + (f !== undefined ? "." + f : "");
  })();

  const numBtn = "rounded-md bg-white/5 py-2 text-sm font-bold text-slate-100 transition hover:bg-white/10";
  const fnBtn = "rounded-md bg-white/10 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/15";
  const opBtn = (o: string) => "rounded-md py-2 text-sm font-bold transition " + (op === o && overwrite ? "bg-emerald-400/40 text-white" : "bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25");

  return (
    <div className="w-full max-w-[224px] rounded-xl border border-white/10 bg-slate-900/70 p-2">
      <p className="px-1 pb-1 text-[10px] font-bold text-slate-400">🧮 계산기</p>
      <div className="mb-2 overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 text-right font-mono text-xl font-bold text-white">{shown}</div>
      <div className="grid grid-cols-4 gap-1">
        <button type="button" onClick={clearAll} className={fnBtn}>C</button>
        <button type="button" onClick={back} className={fnBtn}>⌫</button>
        <button type="button" onClick={sign} className={fnBtn}>±</button>
        <button type="button" onClick={() => chooseOp("÷")} className={opBtn("÷")}>÷</button>
        {["7", "8", "9"].map((d) => <button key={d} type="button" onClick={() => digit(d)} className={numBtn}>{d}</button>)}
        <button type="button" onClick={() => chooseOp("×")} className={opBtn("×")}>×</button>
        {["4", "5", "6"].map((d) => <button key={d} type="button" onClick={() => digit(d)} className={numBtn}>{d}</button>)}
        <button type="button" onClick={() => chooseOp("−")} className={opBtn("−")}>−</button>
        {["1", "2", "3"].map((d) => <button key={d} type="button" onClick={() => digit(d)} className={numBtn}>{d}</button>)}
        <button type="button" onClick={() => chooseOp("+")} className={opBtn("+")}>+</button>
        <button type="button" onClick={() => digit("0")} className={numBtn + " col-span-2"}>0</button>
        <button type="button" onClick={dot} className={numBtn}>.</button>
        <button type="button" onClick={equals} className="rounded-md bg-emerald-400/80 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400">=</button>
      </div>
    </div>
  );
}
