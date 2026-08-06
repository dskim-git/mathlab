"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CHAINS,
  DATA_NOTE,
  PRESETS,
  QUIZZES,
  SHOP_GROUPS,
  SHOP_ITEMS,
  VAT_RATE,
  chainRows,
  receiptSummary,
  type Cart,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_added_value",
    prompt:
      "부가가치세는 판매가 전체가 아니라 그 단계에서 ‘새로 더해진 가치’에만 매겨요. 각 단계가 매출세액에서 매입세액을 빼고 납부하는 까닭을, 만약 빼 주지 않는다면 어떤 일이 생길지와 함께 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 매입세액을 빼 주지 않으면 앞 단계에서 이미 세금이 붙은 금액에 또 세금이 붙어, 단계가 많아질수록 세금이 눈덩이처럼 커진다. 그래서 매출세액에서 매입세액을 빼 부가가치에만 세금을 매긴다.",
  },
  {
    id: "who_pays",
    prompt:
      "시뮬레이션에서 각 단계가 납부한 세액을 모두 더하면 최종 판매가의 10%와 정확히 같았어요. 이 사실이 ‘부가가치세를 내는 사람과 부담하는 사람이 다르다’는 간접세의 특징과 어떻게 연결되는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 각 단계가 낸 세금은 판매가에 얹혀 다음 단계로 넘어가고, 마지막 소비자가 전부 부담한다. 세무서에 내는 사람은 사업자지만 실제 부담자는 소비자다.",
  },
  {
    id: "exempt_policy",
    prompt:
      "쌀·흰 우유·병원 진료비·지하철 요금에는 부가가치세가 붙지 않지만 즉석밥·딸기 우유·택시 요금에는 붙어요. 정부가 왜 어떤 품목만 면세로 정하는지, 그리고 그 기준이 타당하다고 생각하는지 근거를 들어 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 부가가치세는 소득과 관계없이 같은 세율이라 소득이 적은 사람에게 부담이 크므로(역진성), 생활 필수품·의료·교육·대중교통은 면세로 두어 부담을 덜어 준다. 다만 가공식품과의 경계는 애매한 면도 있다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
export function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}
function num(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "chain" | "receipt" | "quiz";

export default function VatLab() {
  const [tab, setTab] = useState<Tab>("chain");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🧾 간접세의 계산 — 부가가치세</h3>
        <p className="mt-2 leading-7 text-slate-300">
          부가가치세는 <b className="text-emerald-200">거래 단계마다 새로 생기는 가치</b>에 매기는 세금이에요. 재료에서
          최종 소비자까지 이어지는 사슬을 직접 조작해 세금이 어떻게 쌓이는지 보고, 실제 마트 영수증으로 내가 낸 부가세를
          찾아본 뒤, 퀴즈로 정리해 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "chain"} onClick={() => setTab("chain")}>① 부가가치 사슬 시뮬레이션</TabButton>
        <TabButton active={tab === "receipt"} onClick={() => setTab("receipt")}>② 내 영수증 속 부가세</TabButton>
        <TabButton active={tab === "quiz"} onClick={() => setTab("quiz")}>③ 카드 퀴즈</TabButton>
      </div>

      <div className="mt-4">
        {tab === "chain" ? <ChainTab /> : null}
        {tab === "receipt" ? <ReceiptTab /> : null}
        {tab === "quiz" ? <QuizTab /> : null}
      </div>

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
// 탭 ① 부가가치 사슬 시뮬레이션 (sky)
// ══════════════════════════════════════════════════════════════
function chainStep(maxPrice: number): number {
  if (maxPrice >= 500_000) return 50_000;
  if (maxPrice >= 100_000) return 5_000;
  if (maxPrice >= 20_000) return 1_000;
  return 500;
}

function ChainTab() {
  const [chainId, setChainId] = useState(CHAINS[0].id);
  const [count, setCount] = useState(4);
  const [prices, setPrices] = useState<number[]>(CHAINS[0].stages.slice(0, 4).map((s) => s.price));
  const [shown, setShown] = useState(0); // 계산을 공개한 단계 수

  const chain = CHAINS.find((c) => c.id === chainId)!;
  const stages = chain.stages.slice(0, count);
  const step = chainStep(chain.stages[4].price);
  const max = chain.stages[4].price * 2;

  function pickChain(id: string) {
    const c = CHAINS.find((x) => x.id === id)!;
    setChainId(id);
    setPrices(c.stages.slice(0, count).map((s) => s.price));
    setShown(0);
  }
  function pickCount(k: number) {
    setCount(k);
    setPrices(chain.stages.slice(0, k).map((s) => s.price));
    setShown(0);
  }
  function setPrice(i: number, v: number) {
    const next = [...prices];
    next[i] = Math.max(step, Math.round(v / step) * step);
    for (let j = i + 1; j < next.length; j++) next[j] = Math.max(next[j], next[j - 1] + step);
    for (let j = i - 1; j >= 0; j--) next[j] = Math.min(next[j], next[j + 1] - step);
    setPrices(next.map((p) => Math.max(step, p)));
    setShown(0);
  }

  const rows = chainRows(prices);
  const finalPrice = prices[prices.length - 1];
  const totalPaid = rows.reduce((s, r) => s + r.pay, 0);
  const finalVat = Math.round(finalPrice * VAT_RATE);
  const noCreditTax = rows.reduce((s, r) => s + r.outTax, 0); // 매입세액 공제가 없다면
  const done = shown >= stages.length;

  return (
    <div className="space-y-4">
      {/* 사례 선택 */}
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <p className="text-sm font-bold text-sky-200">🔗 상품이 만들어져 소비자에게 오기까지</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          사례를 고르고, 각 단계의 <b className="text-sky-100">판매가</b>를 직접 바꿔 보세요. 단계마다{" "}
          <b className="text-sky-100">부가가치(판매가 − 매입가)</b>가 생기고, 그 10%가 그 단계의 납부세액이 돼요.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CHAINS.map((c) => (
            <button key={c.id} type="button" onClick={() => pickChain(c.id)}
              className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (chainId === c.id ? "border-sky-400/60 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">생산·유통 단계 수</span>
          {[3, 4, 5].map((k) => (
            <button key={k} type="button" onClick={() => pickCount(k)}
              className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (count === k ? "border-sky-400/60 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
              {k}단계
            </button>
          ))}
          <span className="text-xs text-slate-500">단계를 늘려도 소비자가 부담하는 세금 총액은 달라지지 않아요 — 확인해 보세요!</span>
        </div>
        {chain.note ? (
          <p className="mt-2 rounded-lg border-l-4 border-amber-400/70 bg-amber-400/[0.08] px-3 py-1.5 text-xs leading-5 text-slate-300">
            ⚠️ {chain.note}
          </p>
        ) : null}
      </div>

      {/* 단계별 카드 */}
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-stretch gap-2">
          {stages.map((st, i) => {
            const r = rows[i];
            const open = i < shown;
            return (
              <div key={i} className="flex items-stretch gap-2">
                <div className={"w-56 shrink-0 rounded-2xl border p-3 transition " + (open ? "border-sky-400/45 bg-sky-400/[0.08]" : "border-white/10 bg-slate-900/40")}>
                  <p className="text-xs font-bold text-slate-400">{i + 1}단계 · {st.role}</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-100">{st.emoji} {st.label}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{st.action}</p>

                  <label htmlFor={`p${i}`} className="mt-2 block text-[11px] font-bold text-slate-300">
                    판매가 <span className="font-mono text-sky-200">{won(prices[i])}</span>
                  </label>
                  <input id={`p${i}`} type="range" min={step * (i + 1)} max={max} step={step} value={prices[i]}
                    onChange={(e) => setPrice(i, Number(e.target.value))}
                    className="mt-1 w-full accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />

                  <div className="mt-2 space-y-0.5 rounded-lg bg-black/25 px-2.5 py-2 text-[12px]">
                    <MiniLine label="판매가" value={won(r.sale)} />
                    <MiniLine label="매입가" value={i === 0 ? "—" : won(r.buy)} />
                    <div className="flex items-baseline justify-between border-t border-white/10 pt-0.5">
                      <span className="text-emerald-300">부가가치</span>
                      <span className="font-mono font-bold text-emerald-200">{won(r.added)}</span>
                    </div>
                  </div>

                  {open ? (
                    <div className="mt-1.5 space-y-0.5 rounded-lg border border-sky-400/30 bg-sky-400/10 px-2.5 py-2 text-[12px]">
                      <MiniLine label="매출세액(10%)" value={won(r.outTax)} />
                      <MiniLine label="매입세액(10%)" value={i === 0 ? "0원" : won(r.inTax)} />
                      <div className="flex items-baseline justify-between border-t border-white/10 pt-0.5">
                        <span className="font-bold text-sky-100">납부세액</span>
                        <span className="font-mono text-base font-bold text-sky-100">{won(r.pay)}</span>
                      </div>
                      <p className="pt-0.5 text-[10px] leading-3 text-slate-400">
                        {num(r.outTax)} − {num(r.inTax)} = {num(r.pay)} (= 부가가치 {num(r.added)}의 10%)
                      </p>
                    </div>
                  ) : (
                    <div className="mt-1.5 rounded-lg border border-dashed border-white/15 bg-black/20 px-2.5 py-3 text-center text-[11px] text-slate-500">
                      이 단계의 납부세액은?<br />
                      <span className="text-slate-400">부가가치 {won(r.added)}의 10%를 예상해 보세요</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-xl text-slate-600" aria-hidden="true">▶</div>
              </div>
            );
          })}

          {/* 최종 소비자 */}
          <div className={"w-56 shrink-0 rounded-2xl border p-3 " + (done ? "border-rose-400/45 bg-rose-400/[0.08]" : "border-white/10 bg-slate-900/40")}>
            <p className="text-xs font-bold text-slate-400">최종 소비자</p>
            <p className="mt-0.5 text-sm font-bold text-slate-100">🙋 소비자</p>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{chain.product}을(를) 구입</p>
            <div className="mt-2 space-y-0.5 rounded-lg bg-black/25 px-2.5 py-2 text-[12px]">
              <MiniLine label="물품 가격" value={won(finalPrice)} />
              <MiniLine label="부가가치세" value={won(finalVat)} />
              <div className="flex items-baseline justify-between border-t border-white/10 pt-0.5">
                <span className="font-bold text-rose-200">지불 금액</span>
                <span className="font-mono font-bold text-rose-100">{won(finalPrice + finalVat)}</span>
              </div>
            </div>
            {done ? (
              <p className="mt-1.5 rounded-lg border border-rose-400/30 bg-rose-400/10 px-2.5 py-2 text-[11px] leading-4 text-rose-100">
                소비자는 가격에 포함된 부가가치세 <b className="font-mono">{won(finalVat)}</b>을 혼자 부담해요. 세무서에 낸 사람은
                사업자들이지만, 실제로 부담한 사람은 소비자예요.
              </p>
            ) : (
              <p className="mt-1.5 rounded-lg border border-dashed border-white/15 bg-black/20 px-2.5 py-3 text-center text-[11px] text-slate-500">
                단계별 납부세액의 합은<br />얼마가 될까요?
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 진행 버튼 */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" disabled={done} onClick={() => setShown((n) => n + 1)}
          className="rounded-xl border-2 border-sky-400/55 bg-sky-400/15 px-5 py-2 text-sm font-bold text-sky-100 transition hover:bg-sky-400/25 disabled:opacity-40">
          {shown === 0 ? "▶ 1단계부터 세금 계산하기" : `▶ ${shown + 1}단계 계산하기`}
        </button>
        <button type="button" disabled={done} onClick={() => setShown(stages.length)}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-40">
          전체 보기
        </button>
        <button type="button" onClick={() => setShown(0)}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10">
          ↺ 처음부터
        </button>
      </div>

      {/* 전체 흐름 정리 */}
      {done ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.07] p-4">
            <p className="text-sm font-bold text-emerald-200">📊 전체 흐름 정리</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Big label="소비자가 지불한 금액" value={won(finalPrice + finalVat)} tone="rose" />
              <Big label="가격에 포함된 부가세" value={won(finalVat)} tone="emerald" />
              <Big label="각 단계 납부세액의 합" value={won(totalPaid)} tone="sky" />
            </div>
            <p className="mt-3 text-center font-mono text-sm text-slate-200">
              {rows.map((r) => num(r.pay)).join(" + ")} = <b className="text-emerald-200">{num(totalPaid)}</b>
              <span className="text-slate-400"> = {num(finalPrice)} × 10%</span>
            </p>
            <p className="mt-2 text-center text-sm leading-6 text-slate-300">
              단계가 몇 개든, 각 단계가 나눠 낸 세금의 합은 <b className="text-emerald-200">최종 판매가의 10%</b>와 항상 같아요.
              단계마다 조금씩 나눠 내고, 결국 최종 소비자가 부담하는 세금이에요.
            </p>
          </div>

          {/* 매입세액 공제가 없다면 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <p className="text-sm font-bold text-slate-100">🤔 만약 매입세액을 빼 주지 않는다면?</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              단계마다 판매가 전체에 10%를 매기면, 앞 단계에서 이미 세금이 붙은 금액에 또 세금이 붙어요(중복 과세).
            </p>
            <div className="mt-3 space-y-2">
              <BarRow label="부가가치세 방식" value={totalPaid} max={Math.max(noCreditTax, 1)} color="#34d399" />
              <BarRow label="공제 없이 단계마다 10%" value={noCreditTax} max={Math.max(noCreditTax, 1)} color="#fb7185" />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {stages.length}단계 기준 {won(totalPaid)} → {won(noCreditTax)}로 <b className="text-rose-200">{(noCreditTax / Math.max(totalPaid, 1)).toFixed(1)}배</b>.
              단계가 많아질수록 격차가 커져요. 그래서 <b className="text-emerald-200">매출세액 − 매입세액</b>으로 계산해 부가가치에만 세금을 매기는 거예요.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono text-slate-100">{value}</span>
    </div>
  );
}

const BIG_TONE: Record<string, string> = {
  rose: "border-rose-400/40 bg-rose-400/10 text-rose-100",
  emerald: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  sky: "border-sky-400/40 bg-sky-400/10 text-sky-100",
};

function Big({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={"rounded-xl border px-4 py-3 text-center " + BIG_TONE[tone]}>
      <p className="text-xs font-bold opacity-80">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold">{value}</p>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-40 shrink-0 text-xs text-slate-300">{label}</span>
      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-3 flex-1" aria-hidden="true">
        <rect width={100} height={8} rx={2} fill="rgba(255,255,255,0.06)" />
        <rect width={Math.max(2, (value / max) * 100)} height={8} rx={2} fill={color} />
      </svg>
      <span className="w-24 shrink-0 text-right font-mono text-xs text-slate-200">{won(value)}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 내 영수증 속 부가세 (amber)
// ══════════════════════════════════════════════════════════════
function ReceiptTab() {
  const [cart, setCart] = useState<Cart>(PRESETS[0].cart);
  const [guesses, setGuesses] = useState<Record<string, boolean>>({});
  const [issued, setIssued] = useState(false);

  const lines = SHOP_ITEMS.filter((it) => (cart[it.id] ?? 0) > 0);
  const sum = receiptSummary(cart);
  const guessed = lines.filter((it) => guesses[it.id] !== undefined).length;
  const correct = lines.filter((it) => guesses[it.id] === it.exempt).length;
  const vatShare = sum.total > 0 ? (sum.vat / sum.total) * 100 : 0;

  function add(id: string, d: number) {
    setCart((c) => {
      const q = Math.max(0, (c[id] ?? 0) + d);
      const next = { ...c };
      if (q === 0) delete next[id];
      else next[id] = q;
      return next;
    });
    setIssued(false);
  }
  function loadPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id)!;
    setCart({ ...p.cart });
    setGuesses({});
    setIssued(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">🛒 장바구니를 담고 영수증을 발행해 보세요</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          마트 가격표에 적힌 금액은 이미 <b className="text-amber-100">부가가치세가 포함된</b> 값이에요. 그런데 모든 물건에
          부가세가 붙는 건 아니에요. 담은 물건이 <b className="text-amber-100">면세</b>인지 <b className="text-amber-100">과세</b>인지
          먼저 예상한 뒤, 영수증으로 확인해 봐요.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" onClick={() => loadPreset(p.id)} title={p.desc}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10">
              {p.label}
            </button>
          ))}
          <button type="button" onClick={() => { setCart({}); setGuesses({}); setIssued(false); }}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-400 transition hover:bg-white/10">
            🗑️ 비우기
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 진열대 */}
        <div className="space-y-3">
          {SHOP_GROUPS.map((g) => (
            <div key={g} className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-xs font-bold text-slate-400">{g}</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {SHOP_ITEMS.filter((it) => it.group === g).map((it) => {
                  const q = cart[it.id] ?? 0;
                  return (
                    <button key={it.id} type="button" onClick={() => add(it.id, 1)}
                      className={"flex items-center justify-between gap-1 rounded-lg border px-2 py-1.5 text-left text-xs transition " + (q > 0 ? "border-amber-400/50 bg-amber-400/15" : "border-white/10 bg-white/5 hover:bg-white/10")}>
                      <span className="truncate text-slate-200">{it.emoji} {it.name}</span>
                      <span className="shrink-0 font-mono text-[11px] text-slate-400">
                        {num(it.price)}{q > 0 ? <b className="ml-1 text-amber-200">×{q}</b> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-500">※ 표시된 금액은 소비자가 실제로 내는 가격(과세 물품은 부가세 포함)이에요.</p>
        </div>

        {/* 장바구니 · 예측 */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-bold text-slate-100">🧺 장바구니 — 면세일까, 과세일까?</p>
              <span className="text-xs text-slate-400">{guessed} / {lines.length} 예상</span>
            </div>
            {lines.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">왼쪽에서 물건을 담아 보세요.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {lines.map((it) => {
                  const g = guesses[it.id];
                  const right = issued && g === it.exempt;
                  const wrong = issued && g !== undefined && g !== it.exempt;
                  return (
                    <div key={it.id} className={"rounded-lg border px-2.5 py-2 " + (right ? "border-emerald-400/40 bg-emerald-400/[0.08]" : wrong ? "border-rose-400/40 bg-rose-400/[0.08]" : "border-white/10 bg-slate-950/40")}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm text-slate-200">
                          {issued ? (right ? "✅ " : g !== undefined ? "❌ " : "▫️ ") : ""}{it.emoji} {it.name}
                          <span className="ml-1 font-mono text-xs text-slate-400">×{cart[it.id]}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <button type="button" onClick={() => add(it.id, -1)} className="rounded border border-white/10 bg-white/5 px-1.5 text-xs text-slate-300 hover:bg-white/10">−</button>
                          <button type="button" onClick={() => add(it.id, 1)} className="rounded border border-white/10 bg-white/5 px-1.5 text-xs text-slate-300 hover:bg-white/10">+</button>
                          <GuessBtn label="면세" on={g === true} tone="emerald" onClick={() => { setGuesses((p) => ({ ...p, [it.id]: true })); }} />
                          <GuessBtn label="과세" on={g === false} tone="rose" onClick={() => { setGuesses((p) => ({ ...p, [it.id]: false })); }} />
                        </span>
                      </div>
                      {issued ? (
                        <p className="mt-1 text-[11px] leading-4 text-slate-400">
                          <b className={it.exempt ? "text-emerald-200" : "text-rose-200"}>{it.exempt ? "면세" : "과세"}</b> — {it.reason}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" disabled={lines.length === 0} onClick={() => setIssued(true)}
                className="rounded-xl border-2 border-amber-400/55 bg-amber-400/15 px-5 py-2 text-sm font-bold text-amber-100 transition hover:bg-amber-400/25 disabled:opacity-40">
                🧾 영수증 발행하기
              </button>
              {issued ? (
                <span className="text-sm text-slate-300">
                  분류 정답 <b className="font-mono text-emerald-200">{correct} / {lines.length}</b>
                </span>
              ) : null}
            </div>
          </div>

          {/* 영수증 */}
          {issued && lines.length > 0 ? (
            <div className="rounded-2xl border border-white/15 bg-slate-100 p-4 text-slate-900">
              <p className="text-center text-sm font-bold tracking-widest">R E C E I P T</p>
              <div className="mt-2 border-y border-dashed border-slate-400 py-2">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-slate-600">
                      <th className="py-0.5 text-left font-semibold">상품명</th>
                      <th className="py-0.5 text-right font-semibold">단가</th>
                      <th className="py-0.5 text-right font-semibold">수량</th>
                      <th className="py-0.5 text-right font-semibold">금액</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {lines.map((it) => (
                      <tr key={it.id}>
                        <td className="py-0.5 pr-2">{it.exempt ? "*" : ""}{it.name}</td>
                        <td className="py-0.5 text-right">{num(it.price)}</td>
                        <td className="py-0.5 text-right">{cart[it.id]}</td>
                        <td className="py-0.5 text-right">{num(it.price * (cart[it.id] ?? 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 space-y-0.5 text-right font-mono text-[13px]">
                <p><span className="text-slate-600">(*)면세 물품 가액: </span>{num(sum.exemptAmount)}</p>
                <p><span className="text-slate-600">과세 물품 가액: </span>{num(sum.taxableSupply)}</p>
                <p><span className="text-slate-600">부가 가치세: </span><b>{num(sum.vat)}</b></p>
                <p className="border-t border-slate-400 pt-0.5 text-base font-bold"><span className="text-slate-600 text-[13px] font-normal">합계: </span>{num(sum.total)}</p>
              </div>
              <p className="mt-2 text-[11px] leading-4 text-slate-600">
                과세 물품 가액 = (과세 물품 표시가격 합계) ÷ 1.1 = {num(sum.taxableSupply + sum.vat)} ÷ 1.1 = {num(sum.taxableSupply)},
                부가 가치세 = {num(sum.taxableSupply)} × 10% = {num(sum.vat)}
              </p>
            </div>
          ) : null}

          {/* 부가세 비중 */}
          {issued && lines.length > 0 ? (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.07] p-4">
              <p className="text-sm font-bold text-emerald-200">💰 내가 낸 돈 중 부가가치세는?</p>
              <div className="mt-2 flex items-baseline justify-center gap-2">
                <span className="font-mono text-3xl font-bold text-emerald-100">{vatShare.toFixed(1)}%</span>
                <span className="text-sm text-slate-300">({won(sum.total)} 중 {won(sum.vat)})</span>
              </div>
              <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="mt-3 h-5 w-full" aria-hidden="true">
                <rect width={100} height={10} rx={2} fill="rgba(255,255,255,0.08)" />
                <rect width={sum.total > 0 ? (sum.exemptAmount / sum.total) * 100 : 0} height={10} rx={2} fill="#38bdf8" />
                <rect x={sum.total > 0 ? (sum.exemptAmount / sum.total) * 100 : 0} width={sum.total > 0 ? (sum.taxableSupply / sum.total) * 100 : 0} height={10} fill="#94a3b8" />
                <rect x={sum.total > 0 ? ((sum.exemptAmount + sum.taxableSupply) / sum.total) * 100 : 0} width={sum.total > 0 ? Math.max(0.8, (sum.vat / sum.total) * 100) : 0} height={10} fill="#34d399" />
              </svg>
              <div className="mt-1.5 flex flex-wrap justify-center gap-3 text-xs">
                <Legend color="#38bdf8" label={`면세 물품 ${won(sum.exemptAmount)}`} />
                <Legend color="#94a3b8" label={`과세 물품 가액 ${won(sum.taxableSupply)}`} />
                <Legend color="#34d399" label={`부가가치세 ${won(sum.vat)}`} />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                면세 물품이 많을수록 부가세 비중이 작아져요. 과세 물품만 담으면 총액의 약 9.1%(= 1.1분의 0.1)가 부가세예요.
                면세 항목을 빼고 담아 보며 비율이 어떻게 달라지는지 비교해 보세요.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GuessBtn({ label, on, tone, onClick }: { label: string; on: boolean; tone: string; onClick: () => void }) {
  const active = tone === "emerald" ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-rose-400/60 bg-rose-400/20 text-rose-100";
  return (
    <button type="button" onClick={onClick}
      className={"rounded border px-1.5 py-0.5 text-[11px] font-bold transition " + (on ? active : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")}>
      {label}
    </button>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-slate-300">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 카드 퀴즈 (violet)
// ══════════════════════════════════════════════════════════════
function QuizTab() {
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);
  const total = QUIZZES.length;
  const score = QUIZZES.filter((q, i) => ans[i] === q.answer).length;
  function reset() { setStep(0); setAns({}); setDone(false); }

  if (done) {
    return (
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <p className="text-base font-bold text-violet-200">🏁 카드 퀴즈 결과</p>
        <div className="mt-3 flex justify-center">
          <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/10 px-8 py-4 text-center">
            <p className="font-mono text-3xl font-bold text-emerald-100">{score} / {total}</p>
            <p className="mt-1 text-xs text-slate-300">{score === total ? "완벽해요! 🎉 부가가치세를 확실히 이해했어요." : score >= total * 0.6 ? "잘했어요! 👍" : "다시 도전해 볼까요?"}</p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          {QUIZZES.map((q, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-xs">
              <span className="mt-0.5">{ans[i] === q.answer ? "✅" : "❌"}</span>
              <div><p className="text-slate-200">{q.icon} {q.q}</p><p className="mt-0.5 text-slate-400">정답: <b className="text-emerald-200">{q.options[q.answer]}</b> — {q.why}</p></div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center"><button type="button" onClick={reset} className="rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25">↺ 다시 풀기</button></div>
      </div>
    );
  }

  const q = QUIZZES[step];
  const chosen = ans[step];
  const revealed = chosen !== undefined;
  const isLast = step === total - 1;

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
      <p className="text-base font-bold text-violet-200">🃏 부가가치세 카드 퀴즈</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="shrink-0 font-mono text-xs font-bold text-slate-300">문제 {step + 1} / {total}</span>
        <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="h-1.5 flex-1" aria-hidden="true">
          <rect width={100} height={6} rx={3} fill="rgba(255,255,255,0.08)" />
          <rect width={((step + (revealed ? 1 : 0)) / total) * 100} height={6} rx={3} fill="#a78bfa" />
        </svg>
        <span className="shrink-0 font-mono text-xs text-slate-400">점수 {score}</span>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <div className="flex items-start gap-3">
          <span className="text-4xl" aria-hidden="true">{q.icon}</span>
          <p className="text-lg font-bold leading-7 text-slate-100">{q.q}</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {q.options.map((opt, i) => {
            const sel = chosen === i;
            const showRight = revealed && i === q.answer;
            const showWrong = revealed && sel && i !== q.answer;
            return (
              <button key={i} type="button" disabled={revealed} onClick={() => setAns((a) => ({ ...a, [step]: i }))}
                className={"rounded-xl border-2 px-3 py-3 text-sm font-bold transition " + (showRight ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : showWrong ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : sel ? "border-violet-400/60 bg-violet-400/15 text-violet-100" : "border-white/10 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10")}>
                {opt}{showRight ? " ✓" : showWrong ? " ✕" : ""}
              </button>
            );
          })}
        </div>
        {revealed ? (
          <div className={"mt-3 rounded-xl border-l-4 px-4 py-2.5 " + (chosen === q.answer ? "border-emerald-400 bg-emerald-400/[0.08]" : "border-amber-400 bg-amber-400/[0.08]")}>
            <p className={"text-sm font-bold " + (chosen === q.answer ? "text-emerald-100" : "text-amber-100")}>{chosen === q.answer ? "정답이에요! ✅" : `아쉬워요 — 정답은 ‘${q.options[q.answer]}’`}</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-300">{q.why}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button type="button" disabled={step === 0} onClick={() => setStep((n) => Math.max(0, n - 1))} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-40">← 이전</button>
        <button type="button" disabled={!revealed} onClick={() => (isLast ? setDone(true) : setStep((n) => n + 1))} className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-5 py-1.5 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25 disabled:opacity-40">{isLast ? "결과 보기 →" : "다음 문제 →"}</button>
      </div>
    </div>
  );
}
