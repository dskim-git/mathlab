"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CAR_PERIODS,
  CAR_RATES,
  DATA_NOTE,
  ITEMS,
  carTaxStack,
  exciseTax,
  type ExItem,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_special",
    prompt:
      "부가가치세는 거의 모든 소비에 똑같이 10% 붙지만, 개별소비세는 자동차·보석·유흥·골프장처럼 ‘특정’ 물품·장소에만 붙어요. 왜 이런 세금을 따로 두는지 그 목적을 생각해 보세요.",
    kind: "text",
    placeholder:
      "예: 사치성·특정 소비에 세금을 더 매겨 과소비를 조절하고, 담배처럼 억제하고 싶은 소비에 세금을 붙이려는 목적이라고 생각한다.",
  },
  {
    id: "stacked_tax",
    prompt:
      "자동차 개별소비세를 5%에서 3.5%로 내리면, 개별소비세뿐 아니라 그에 붙는 교육세(개소세의 30%)와 부가가치세까지 함께 줄어요. 왜 그런지(세금 위에 세금이 붙는 구조) 설명하고, 실제 절약액이 세율 인하폭과 어떻게 다른지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 교육세와 부가세가 개별소비세를 포함한 금액에 매겨지므로, 개소세가 줄면 그 위 세금도 함께 줄어 절약액이 개소세 감소분보다 더 커진다.",
  },
  {
    id: "policy_pros_cons",
    prompt:
      "정부는 경기가 나쁘거나 유가가 오를 때 자동차 개소세·유류세 같은 간접세를 한시적으로 내려요. 이렇게 세금을 올리고 내리는 정책의 장점과 단점을 각각 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 장점은 소비·경기를 살리고 물가 부담을 덜어 주는 것, 단점은 세수(정부 수입)가 줄고 인하가 끝나면 다시 부담이 커지는 것.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
export function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}
export function manWon(v: number): string {
  return Math.round(v / 10000).toLocaleString("ko-KR") + "만원";
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "calc" | "discount";

export default function ExciseTaxLab() {
  const [tab, setTab] = useState<Tab>("calc");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🧾 간접세의 계산 — 개별소비세</h3>
        <p className="mt-2 leading-7 text-slate-300">
          개별소비세는 <b className="text-emerald-200">특정 물품·장소</b>에만 매기는 간접세예요. 품목별 세율로 개소세를
          계산해 보고, 정부가 <b className="text-emerald-200">자동차 개소세를 한시적으로 인하</b>할 때 소비자가 얼마나
          싸게 사는지 체감해 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "calc"} onClick={() => setTab("calc")}>① 품목별 개별소비세 계산기</TabButton>
        <TabButton active={tab === "discount"} onClick={() => setTab("discount")}>② 자동차 개소세 인하 체감</TabButton>
      </div>

      <div className="mt-4">{tab === "calc" ? <CalcTab /> : <DiscountTab />}</div>

      <p className="mt-4 text-xs leading-5 text-slate-500">📌 {DATA_NOTE}</p>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3 py-2 text-sm font-bold transition " +
        (active ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 품목별 개별소비세 계산기 (sky)
// ══════════════════════════════════════════════════════════════
const GROUPS: ExItem["group"][] = ["물품", "장소·유흥", "석유류"];

function CalcTab() {
  const [itemId, setItemId] = useState("car");
  const [amountMan, setAmountMan] = useState(3000); // 만원 (rate/threshold 품목)
  const [qty, setQty] = useState(1); // flat 품목 수량

  const item = ITEMS.find((it) => it.id === itemId)!;
  const isFlat = item.kind === "flat";
  const value = isFlat ? qty : amountMan * 10000;
  const tax = exciseTax(item, value);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <p className="text-sm font-bold text-sky-200">🛒 품목을 골라 개별소비세를 계산해 보세요</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          품목마다 세율과 매기는 방식이 달라요. <b className="text-sky-100">비율(%)</b>, <b className="text-sky-100">기준가격 초과분</b>,
          <b className="text-sky-100"> 정액(개당·1회당)</b> 세 가지가 있어요.
        </p>
        {GROUPS.map((g) => (
          <div key={g} className="mt-3">
            <p className="mb-1.5 text-xs font-bold text-slate-400">{g}</p>
            <div className="flex flex-wrap gap-1.5">
              {ITEMS.filter((it) => it.group === g).map((it) => (
                <button key={it.id} type="button" onClick={() => setItemId(it.id)}
                  className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (itemId === it.id ? "border-sky-400/60 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
                  {it.emoji} {it.name}
                </button>
              ))}
            </div>
            {g === "석유류" ? (
              <p className="mt-1.5 rounded-lg border-l-4 border-amber-400/70 bg-amber-400/[0.08] px-3 py-1.5 text-xs leading-5 text-slate-300">
                ⚠️ <b className="text-amber-200">휘발유·경유</b>는 개별소비세가 아니라 <b className="text-amber-200">교통·에너지·환경세</b>(유류세의 핵심) 대상이에요. 개별소비세 석유류는 등유·부탄 등입니다.
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {/* 선택 품목 입력 + 계산 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">{item.emoji} {item.name}</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">{item.desc}</p>

        {isFlat ? (
          <div className="mt-3">
            <label htmlFor="qty" className="text-sm font-bold text-slate-200">{item.inputLabel}: <span className="font-mono text-sky-200">{qty.toLocaleString("ko-KR")} {item.unit}</span></label>
            <input id="qty" type="range" min={1} max={item.id === "kerosene" || item.id === "butane" ? 2000 : item.id === "cigar" ? 200 : 100} step={1} value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="mt-2 w-full accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />
            <p className="mt-1 text-xs text-slate-400">개별소비세 = {won(item.unitPrice ?? 0)} × {qty.toLocaleString("ko-KR")}{item.unit}</p>
          </div>
        ) : (
          <div className="mt-3">
            <label htmlFor="amt" className="text-sm font-bold text-slate-200">{item.inputLabel}: <span className="font-mono text-sky-200">{manWon(value)}</span></label>
            <input id="amt" type="range" min={0} max={10000} step={10} value={amountMan}
              onChange={(e) => setAmountMan(Number(e.target.value))}
              className="mt-2 w-full accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />
            <p className="mt-1 text-xs text-slate-400">
              {item.kind === "threshold"
                ? <>기준가격 {manWon(item.threshold ?? 0)} 초과분 {manWon(Math.max(0, value - (item.threshold ?? 0)))} × {((item.rate ?? 0) * 100).toFixed(0)}%</>
                : <>개별소비세 = {manWon(value)} × {((item.rate ?? 0) * 100).toFixed(0)}%</>}
            </p>
          </div>
        )}

        <div className="mt-3 flex items-baseline justify-between rounded-xl border border-emerald-400/40 bg-emerald-400/[0.10] px-4 py-3">
          <span className="font-bold text-emerald-100">개별소비세</span>
          <span className="font-mono text-2xl font-bold text-emerald-200">{won(tax)}</span>
        </div>
        {item.kind !== "flat" ? (
          <p className="mt-1.5 text-xs text-slate-400">※ 실제로는 여기에 교육세(개소세의 30%)와 부가가치세가 더 붙어요. 자동차 사례는 탭②에서 자세히 봐요.</p>
        ) : null}
      </div>

      {/* 전체 세율표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📋 개별소비세 품목별 세율</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[440px] text-sm">
            <thead><tr className="text-slate-400"><th className="py-1 text-left font-semibold">품목</th><th className="py-1 text-left font-semibold">세율</th></tr></thead>
            <tbody>
              {ITEMS.map((it) => (
                <tr key={it.id} className={itemId === it.id ? "bg-sky-400/10" : ""}>
                  <td className="py-1 text-slate-200">{it.emoji} {it.name}</td>
                  <td className="py-1 text-sky-200">
                    {it.kind === "rate" ? `${((it.rate ?? 0) * 100).toFixed(0)}%`
                      : it.kind === "threshold" ? `기준 ${manWon(it.threshold ?? 0)} 초과분 ${((it.rate ?? 0) * 100).toFixed(0)}%`
                      : `${won(it.unitPrice ?? 0)} / ${it.unit}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 자동차 개소세 인하 체감 (amber)
// ══════════════════════════════════════════════════════════════
const TONE: Record<string, string> = {
  slate: "border-slate-400/40 bg-slate-400/[0.08] text-slate-200",
  sky: "border-sky-400/50 bg-sky-400/[0.10] text-sky-100",
  emerald: "border-emerald-400/50 bg-emerald-400/[0.10] text-emerald-100",
};

function DiscountTab() {
  const [baseMan, setBaseMan] = useState(3000);
  const base = baseMan * 10000;
  const normal = carTaxStack(base, 0.05);
  const stacks = CAR_RATES.map((r) => ({ ...r, stack: carTaxStack(base, r.rate) }));
  const maxTax = Math.max(...stacks.map((s) => s.stack.totalTax), 1);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">🚗 자동차 개소세를 내리면 얼마나 싸질까?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          정부는 경기 부양·소비 진작을 위해 자동차 개별소비세를 한시적으로 인하해 왔어요. 개소세를 내리면 그에 붙는
          <b className="text-amber-100"> 교육세(개소세의 30%)와 부가세까지 함께</b> 줄어 체감이 더 커요.
        </p>
        <label htmlFor="cbase" className="mt-3 block text-sm font-bold text-slate-200">차량 공장도가(과세표준): <span className="font-mono text-amber-200">{manWon(base)}</span></label>
        <input id="cbase" type="range" min={1000} max={10000} step={50} value={baseMan}
          onChange={(e) => setBaseMan(Number(e.target.value))}
          className="mt-2 w-full accent-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40" />
      </div>

      {/* 세율별 비교 카드 */}
      <div className="grid gap-3 sm:grid-cols-3">
        {stacks.map((s) => {
          const save = normal.totalTax - s.stack.totalTax;
          return (
            <div key={s.key} className={"rounded-2xl border p-4 " + TONE[s.tone]}>
              <p className="text-sm font-bold">{s.label}</p>
              <div className="mt-2 space-y-0.5 text-sm">
                <Line label="개별소비세" value={won(s.stack.excise)} />
                <Line label="교육세(30%)" value={won(s.stack.edu)} />
                <Line label="부가가치세" value={won(s.stack.vat)} />
                <div className="mt-1 flex items-baseline justify-between border-t border-white/10 pt-1">
                  <span className="font-bold">세금 합계</span>
                  <span className="font-mono font-bold">{won(s.stack.totalTax)}</span>
                </div>
              </div>
              <div className="mt-2 rounded-lg bg-black/20 px-2.5 py-1.5 text-xs">
                <span className="text-slate-400">세금 포함 가격 </span><b className="font-mono">{manWon(s.stack.price)}</b>
              </div>
              {save > 0 ? (
                <p className="mt-1.5 text-center text-sm font-bold text-amber-200">정상(5%)보다 {won(save)} 절약 🎉</p>
              ) : (
                <p className="mt-1.5 text-center text-xs text-slate-400">기준 세율</p>
              )}
            </div>
          );
        })}
      </div>

      {/* 세금 합계 막대 비교 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">세율별 세금 합계 비교</p>
        <div className="mt-2 space-y-2">
          {stacks.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-xs text-slate-300">{s.label}</span>
              <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-3 flex-1" aria-hidden="true">
                <rect width={100} height={8} rx={2} fill="rgba(255,255,255,0.06)" />
                <rect width={Math.max(2, (s.stack.totalTax / maxTax) * 100)} height={8} rx={2} fill={s.tone === "emerald" ? "#34d399" : s.tone === "sky" ? "#38bdf8" : "#94a3b8"} />
              </svg>
              <span className="w-24 shrink-0 text-right font-mono text-xs text-slate-200">{won(s.stack.totalTax)}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">개소세율이 낮아지면 교육세·부가세까지 함께 줄어 세금 합계가 더 크게 줄어들어요.</p>
      </div>

      {/* 실제 인하 이력 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📅 자동차 개별소비세 인하 실제 이력</p>
        <div className="mt-2 space-y-1.5">
          {CAR_PERIODS.map((p, i) => (
            <div key={i} className="flex flex-wrap items-baseline gap-x-2 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm">
              <span className="font-mono text-slate-200">{p.term}</span>
              <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-xs font-bold text-amber-200">{p.rate}</span>
              <span className="text-slate-400">{p.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono text-slate-100">{value}</span>
    </div>
  );
}
