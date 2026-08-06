"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import { GEO, GEO_W, GEO_H } from "./geoData";
import {
  COUNTRY_TARIFFS,
  DATA_NOTE,
  ERAS,
  FTAS,
  ITEM_GROUPS,
  ITEM_TARIFFS,
  KOREA_CODE,
  SIM_COUNTRIES,
  SIM_ITEMS,
  TARIFF_METRICS,
  TINY_MARKS,
  buildFtaMap,
  calcDuty,
  eraOf,
  type TariffMetric,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_high_ag",
    prompt:
      "우리나라는 공산품 평균 관세율이 6%대인데 농산물은 50%가 넘고, 쌀·참깨·인삼은 수백 %예요. 왜 품목에 따라 관세를 이렇게 다르게 매기는지, ‘국내 산업 보호’와 연결해 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 값싼 수입 농산물이 그대로 들어오면 국내 농가가 경쟁에서 밀려 무너질 수 있어서, 관세를 높게 매겨 수입품 가격을 올려 국내 농업을 보호하려는 것이다.",
  },
  {
    id: "fta_effect",
    prompt:
      "시뮬레이터에서 같은 물건도 어느 나라에서 사 오느냐에 따라 세금이 달라졌어요. FTA를 맺으면 소비자·수출 기업·국내 생산자에게 각각 어떤 좋은 점과 어려운 점이 생길지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 소비자는 수입품을 싸게 살 수 있고 수출 기업은 상대국에서 관세를 덜 내 유리하지만, 값싼 수입품과 경쟁해야 하는 국내 생산자는 어려워질 수 있다.",
  },
  {
    id: "tariff_barrier",
    prompt:
      "관세를 지나치게 높이면 나라 사이에 갈등이 생기기도 해요(관세장벽, tariff-barrier). 관세를 ‘적당히’ 매긴다는 것은 어떤 것을 함께 고려하는 일일지, 자신의 생각을 근거와 함께 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 국내 산업을 지키는 일과 소비자가 싸게 사는 일, 그리고 상대 나라가 우리 수출품에 매길 관세까지 함께 생각해야 한다고 본다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}
function num(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}
function pct(v: number): string {
  return (Number.isInteger(v) ? v.toString() : v.toFixed(1)) + "%";
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "data" | "sim" | "fta";

export default function CustomsLab() {
  const [tab, setTab] = useState<Tab>("data");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🚢 간접세의 계산 — 관세</h3>
        <p className="mt-2 leading-7 text-slate-300">
          관세는 <b className="text-emerald-200">세관을 통과하는 화물</b>에 매기는 세금이에요. 나라마다·품목마다 얼마나
          다른지 실제 자료로 보고, 해외직구를 하면 세금이 얼마나 붙는지 직접 계산해 본 뒤, 우리나라가 관세를 낮추기로
          약속한 <b className="text-emerald-200">FTA 체결국</b>을 세계지도에서 찾아봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "data"} onClick={() => setTab("data")}>① 나라별·품목별 관세율</TabButton>
        <TabButton active={tab === "sim"} onClick={() => setTab("sim")}>② 해외직구 관세 계산기</TabButton>
        <TabButton active={tab === "fta"} onClick={() => setTab("fta")}>③ 우리나라의 FTA 지도</TabButton>
      </div>

      <div className="mt-4">
        {tab === "data" ? <DataTab /> : null}
        {tab === "sim" ? <SimTab /> : null}
        {tab === "fta" ? <FtaTab /> : null}
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
// 탭 ① 나라별·품목별 관세율 (sky)
// ══════════════════════════════════════════════════════════════
const MAX_ITEM_RATE = Math.max(...ITEM_TARIFFS.map((i) => i.rate));

function DataTab() {
  const [metric, setMetric] = useState<TariffMetric>("all");
  const [group, setGroup] = useState<string>("전체");

  const rows = [...COUNTRY_TARIFFS].sort((a, b) => b[metric] - a[metric]);
  const maxCountry = Math.max(...rows.map((r) => r[metric]), 1);
  const items = group === "전체" ? ITEM_TARIFFS : ITEM_TARIFFS.filter((i) => i.group === group);

  return (
    <div className="space-y-4">
      {/* 개념 요약 */}
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <p className="text-sm font-bold text-sky-200">🛃 관세(Tariff, Customs Duties)란?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          수출하거나 수입하면서 <b className="text-sky-100">세관을 통과하는 화물에 부과하는 세금</b>이에요. 보통 ‘관세’라고
          하면 <b className="text-sky-100">수입 관세</b>를 뜻하고, <b className="text-sky-100">수입하는 나라와 화물의 종류에
          따라 다르게</b> 부과돼요.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <MiniCard emoji="🛡️" title="국내 산업 보호" text="값싼 수입품에 세금을 붙여 가격을 올리면, 국내 생산자가 경쟁할 수 있어요." />
          <MiniCard emoji="💰" title="나라의 수입(세금)" text="세관에서 걷은 관세는 국세로 나라 살림에 쓰여요." />
          <MiniCard emoji="⚔️" title="관세장벽(tariff-barrier)" text="관세가 지나치면 상대 나라도 맞대응해 무역 갈등이 생겨요." />
        </div>
      </div>

      {/* 나라별 평균 관세율 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🌍 주요국의 평균 관세율</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TARIFF_METRICS) as TariffMetric[]).map((k) => (
              <button key={k} type="button" onClick={() => setMetric(k)}
                className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (metric === k ? "border-sky-400/60 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
                {TARIFF_METRICS[k].label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          {rows.map((r) => {
            const v = r[metric];
            const isKr = r.code === KOREA_CODE;
            return (
              <div key={r.code} className={"flex items-center gap-2 rounded-lg px-1.5 py-0.5 " + (isKr ? "bg-amber-400/10" : "")}>
                <span className={"w-32 shrink-0 truncate text-xs " + (isKr ? "font-bold text-amber-200" : "text-slate-300")}>
                  {r.flag} {r.name}
                </span>
                <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-3 flex-1" aria-hidden="true">
                  <rect width={100} height={8} rx={2} fill="rgba(255,255,255,0.06)" />
                  <rect width={Math.max(0.6, (v / maxCountry) * 100)} height={8} rx={2} fill={isKr ? "#fbbf24" : "#38bdf8"} />
                </svg>
                <span className={"w-14 shrink-0 text-right font-mono text-xs " + (isKr ? "font-bold text-amber-200" : "text-slate-200")}>{pct(v)}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          우리나라는 <b className="text-amber-200">공산품 관세는 낮은 편(6.5%)</b>이지만 <b className="text-amber-200">농산물 관세는
          56.9%로 매우 높아요</b>. 전체/농산물/공산품을 바꿔 가며 나라마다 무엇을 지키려 하는지 비교해 보세요.
        </p>
      </div>

      {/* 품목별 관세율 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">📦 우리나라 주요 품목의 관세율</p>
          <div className="flex flex-wrap gap-1.5">
            {["전체", ...ITEM_GROUPS].map((g) => (
              <button key={g} type="button" onClick={() => setGroup(g)}
                className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (group === g ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 space-y-1">
          {items.map((it) => (
            <div key={it.name} className="group flex items-center gap-2">
              <span className="w-40 shrink-0 truncate text-xs text-slate-300">{it.emoji} {it.name}</span>
              <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-3 flex-1" aria-hidden="true">
                <rect width={100} height={8} rx={2} fill="rgba(255,255,255,0.06)" />
                <rect width={Math.max(0.8, Math.sqrt(it.rate / MAX_ITEM_RATE) * 100)} height={8} rx={2}
                  fill={it.rate >= 100 ? "#fb7185" : it.rate >= 10 ? "#fbbf24" : it.rate > 0 ? "#38bdf8" : "#64748b"} />
              </svg>
              <span className="w-16 shrink-0 text-right font-mono text-xs font-bold text-slate-100">{pct(it.rate)}</span>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">※ 막대는 값의 차이가 너무 커서 제곱근 눈금으로 그렸어요(숫자를 함께 보세요).</p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {items.slice(0, 4).map((it) => (
            <div key={it.name} className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
              <p className="text-xs font-bold text-slate-200">{it.emoji} {it.name} — <span className="font-mono text-amber-200">{pct(it.rate)}</span></p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{it.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🔎 자료에서 찾은 규칙</p>
        <ul className="mt-1.5 space-y-1 text-sm leading-6 text-slate-300">
          <li>• <b className="text-emerald-100">국내에서 많이 만드는 것</b>일수록 관세가 높아요 — 쌀·마늘·인삼처럼요(국내 산업 보호).</li>
          <li>• <b className="text-emerald-100">국내에서 만들지 않거나 원재료</b>인 것은 관세가 낮아요 — 커피 생두 2%, 항공기 0%.</li>
          <li>• <b className="text-emerald-100">반도체·휴대전화·노트북은 0%</b> — 여러 나라가 WTO 정보기술협정(ITA)으로 안 매기기로 약속했어요.</li>
          <li>• 같은 물건이라도 <b className="text-emerald-100">어느 나라에서 오느냐</b>에 따라 세율이 달라져요(FTA) — 탭②·③에서 확인해요.</li>
        </ul>
      </div>
    </div>
  );
}

function MiniCard({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
      <p className="text-xs font-bold text-slate-100">{emoji} {title}</p>
      <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{text}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 해외직구 관세 계산기 (amber)
// ══════════════════════════════════════════════════════════════
function SimTab() {
  const [countryCode, setCountryCode] = useState(SIM_COUNTRIES[0].code);
  const [itemId, setItemId] = useState(SIM_ITEMS[0].id);
  const [goods, setGoods] = useState(SIM_ITEMS[0].price);
  const [ship, setShip] = useState(20);
  const [fx, setFx] = useState(1400);
  const [useFta, setUseFta] = useState(true);

  const country = SIM_COUNTRIES.find((c) => c.code === countryCode)!;
  const item = SIM_ITEMS.find((i) => i.id === itemId)!;
  const res = calcDuty(country, item, goods, ship, fx, useFta);
  const noFta = calcDuty(country, item, goods, ship, fx, false);
  const saved = noFta.totalTax - res.totalTax;

  function pickItem(id: string) {
    const it = SIM_ITEMS.find((i) => i.id === id)!;
    setItemId(id);
    setGoods(it.price);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">📦 해외직구, 세금은 얼마나 붙을까?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          외국에서 물건을 사서 우리나라로 들여오면 세관을 지나면서 <b className="text-amber-100">관세</b>와{" "}
          <b className="text-amber-100">수입 부가가치세</b>가 붙어요. 나라와 품목을 골라 직접 계산해 보세요.
        </p>

        <p className="mt-3 text-xs font-bold text-slate-400">어느 나라에서 사 올까요?</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {SIM_COUNTRIES.map((c) => (
            <button key={c.code} type="button" onClick={() => setCountryCode(c.code)}
              className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (countryCode === c.code ? "border-amber-400/60 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
              {c.flag} {c.name}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs font-bold text-slate-400">무엇을 살까요?</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {SIM_ITEMS.map((it) => (
            <button key={it.id} type="button" onClick={() => pickItem(it.id)}
              className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (itemId === it.id ? "border-amber-400/60 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
              {it.emoji} {it.name} <span className="font-mono text-[10px] text-slate-400">{pct(it.rate)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 입력 */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SliderBox id="goods" label="물품가격" value={`$${num(goods)}`} min={10} max={2000} step={10} v={goods} onChange={setGoods} />
        <SliderBox id="ship" label="배송비(운임)" value={`$${num(ship)}`} min={0} max={200} step={5} v={ship} onChange={setShip} />
        <SliderBox id="fx" label="환율(원/달러)" value={`${num(fx)}원`} min={1000} max={1800} step={10} v={fx} onChange={setFx} />
      </div>

      {/* FTA 선택 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-slate-100">
              {country.flag} {country.name} — {country.fta ? <span className="text-emerald-200">{country.fta} ({country.ftaYear} 발효)</span> : <span className="text-rose-200">양자 FTA 없음</span>}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{country.note}</p>
          </div>
          {country.kind === "full" ? (
            <button type="button" onClick={() => setUseFta((v) => !v)}
              className={"rounded-xl border-2 px-3 py-2 text-xs font-bold transition " + (useFta ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
              {useFta ? "✅ 원산지증명서 제출 (FTA 세율 적용)" : "⬜ 원산지증명서 없음 (기본 세율)"}
            </button>
          ) : (
            <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">기본 관세율 적용</span>
          )}
        </div>
        {item.note ? (
          <p className="mt-2 rounded-lg border-l-4 border-amber-400/70 bg-amber-400/[0.08] px-3 py-1.5 text-xs leading-5 text-slate-300">
            ℹ️ {item.emoji} {item.name} — {item.note}
          </p>
        ) : null}
      </div>

      {/* 계산 결과 */}
      {res.exempt ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🎉 면세! 세금이 붙지 않아요</p>
          <p className="mt-1 text-sm leading-6 text-slate-200">
            자기가 쓸 물건을 <b className="text-emerald-200">미화 {country.deMinimis}달러 이하</b>로 사면 관세와 부가세를 면제해 줘요
            {country.code === "USA" ? " (미국발은 한·미 FTA 특례로 200달러)" : ""}. 지금 물품가격은 ${num(goods)}예요.
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-200">{won(res.totalPay)}</p>
          <p className="mt-0.5 text-xs text-slate-400">물품가격 + 배송비만 내면 돼요 (세금 0원)</p>
          <p className="mt-2 text-xs text-slate-400">
            물품가격을 ${country.deMinimis}보다 크게 올리면 어떻게 되는지 확인해 보세요 — 한도를 1달러라도 넘으면 전체 금액에 세금이 붙어요!
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-sm font-bold text-slate-100">🧮 세금 계산 과정</p>
          <div className="mt-3 space-y-2">
            <CalcStep n={1} title="과세가격 (물품가격 + 배송비)"
              expr={`${num(res.goodsKRW)} + ${num(res.shipKRW)}`} value={won(res.customsValue)}
              desc="관세는 물건값에 운임·보험료를 더한 값(CIF)에 매겨요." />
            <CalcStep n={2} title={`관세 (세율 ${pct(res.appliedRate)})`}
              expr={`${num(res.customsValue)} × ${pct(res.appliedRate)}`} value={won(res.duty)}
              desc={res.ftaApplied
                ? `${country.fta} 협정세율 0%가 적용됐어요 (기본 세율은 ${pct(res.mfnRate)}).`
                : country.kind === "full" && !useFta
                  ? `원산지증명서가 없으면 기본 세율 ${pct(res.mfnRate)}가 그대로 붙어요.`
                  : `${item.name}의 기본 관세율은 ${pct(res.mfnRate)}예요.`}
              tone="amber" />
            <CalcStep n={3} title="수입 부가가치세 (10%)"
              expr={`(${num(res.customsValue)} + ${num(res.duty)}) × 10%`} value={won(res.vat)}
              desc="부가세는 관세까지 더한 금액에 붙어요 — 세금 위에 세금이 붙는 구조예요." tone="sky" />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Big label="세금 합계" value={won(res.totalTax)} tone="amber" />
            <Big label="최종 지불 금액" value={won(res.totalPay)} tone="rose" />
            <Big label="물건값 대비 세금 비율" value={((res.totalTax / Math.max(res.customsValue, 1)) * 100).toFixed(1) + "%"} tone="sky" />
          </div>

          {/* 구성 막대 */}
          <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="mt-3 h-5 w-full" aria-hidden="true">
            <rect width={100} height={10} rx={2} fill="rgba(255,255,255,0.08)" />
            <rect width={(res.customsValue / res.totalPay) * 100} height={10} rx={2} fill="#94a3b8" />
            <rect x={(res.customsValue / res.totalPay) * 100} width={(res.duty / res.totalPay) * 100} height={10} fill="#fbbf24" />
            <rect x={((res.customsValue + res.duty) / res.totalPay) * 100} width={(res.vat / res.totalPay) * 100} height={10} fill="#38bdf8" />
          </svg>
          <div className="mt-1.5 flex flex-wrap justify-center gap-3 text-xs">
            <Legend color="#94a3b8" label={`과세가격 ${won(res.customsValue)}`} />
            <Legend color="#fbbf24" label={`관세 ${won(res.duty)}`} />
            <Legend color="#38bdf8" label={`부가세 ${won(res.vat)}`} />
          </div>

          {country.kind === "full" && saved > 0 ? (
            <p className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-center text-sm text-emerald-100">
              원산지증명서를 갖추면 <b className="font-mono">{won(saved)}</b>을 아낄 수 있어요 ({country.fta} 협정세율 0%)
            </p>
          ) : null}
          {country.kind === "none" ? (
            <p className="mt-3 rounded-xl border border-rose-400/30 bg-rose-400/[0.08] px-4 py-2 text-center text-sm text-rose-100">
              {country.name}과는 두 나라끼리 맺은 FTA가 없어 기본 관세율이 그대로 붙어요. 다른 나라로 바꿔 세금을 비교해 보세요.
            </p>
          ) : null}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">💡 이렇게 바꿔 보세요</p>
        <ul className="mt-1.5 space-y-1 text-sm leading-6 text-slate-300">
          <li>• 같은 <b className="text-amber-200">의류 60달러</b>를 미국·중국·일본에서 각각 사 보세요 — 나라에 따라 세금이 얼마나 달라지나요?</li>
          <li>• 물품가격을 <b className="text-amber-200">149달러 → 151달러</b>로 올려 보세요 — 2달러 차이로 세금이 얼마나 늘어나나요?</li>
          <li>• <b className="text-amber-200">노트북(0%)</b>과 <b className="text-amber-200">의류(13%)</b>를 같은 가격으로 비교해 보세요.</li>
        </ul>
      </div>
    </div>
  );
}

function SliderBox({ id, label, value, min, max, step, v, onChange }: {
  id: string; label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
      <label htmlFor={id} className="text-xs font-bold text-slate-300">
        {label}: <span className="font-mono text-amber-200">{value}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40" />
    </div>
  );
}

const STEP_TONE: Record<string, string> = {
  slate: "border-white/10 bg-slate-950/40",
  amber: "border-amber-400/30 bg-amber-400/[0.07]",
  sky: "border-sky-400/30 bg-sky-400/[0.07]",
};

function CalcStep({ n, title, expr, value, desc, tone = "slate" }: {
  n: number; title: string; expr: string; value: string; desc: string; tone?: string;
}) {
  return (
    <div className={"rounded-xl border px-3 py-2 " + STEP_TONE[tone]}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-slate-100">
          <span className="mr-1.5 rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">{n}</span>{title}
        </span>
        <span className="font-mono text-lg font-bold text-slate-100">{value}</span>
      </div>
      <p className="mt-0.5 font-mono text-[11px] text-slate-400">{expr} = {value}</p>
      <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{desc}</p>
    </div>
  );
}

const BIG_TONE: Record<string, string> = {
  rose: "border-rose-400/40 bg-rose-400/10 text-rose-100",
  emerald: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  sky: "border-sky-400/40 bg-sky-400/10 text-sky-100",
  amber: "border-amber-400/40 bg-amber-400/10 text-amber-100",
};

function Big({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={"rounded-xl border px-4 py-3 text-center " + BIG_TONE[tone]}>
      <p className="text-xs font-bold opacity-80">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold">{value}</p>
    </div>
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
// 탭 ③ 우리나라의 FTA 지도 (emerald)
// ══════════════════════════════════════════════════════════════
const KOREA_FILL = "#f59e0b";
const NODATA_FILL = "#1e293b";
const CENTROID: Record<string, { x: number; y: number }> = {};

function centroidOf(code: string, d: string): { x: number; y: number } {
  if (CENTROID[code]) return CENTROID[code];
  const nums = d.match(/-?\d+(?:\.\d+)?/g) || [];
  let sx = 0, sy = 0, n = 0;
  for (let i = 0; i + 1 < nums.length; i += 2) { sx += +nums[i]; sy += +nums[i + 1]; n++; }
  const c = { x: n ? sx / n : 0, y: n ? sy / n : 0 };
  CENTROID[code] = c;
  return c;
}

function textWidth(s: string): number {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 0x1100 ? 8.4 : 4.7;
  return w;
}

function Memo({ x, y, W, H, title, text }: { x: number; y: number; W: number; H: number; title: string; text: string }) {
  const lines = text.split(" · ");
  const w = Math.min(W - 4, Math.max(64, Math.max(textWidth(title), ...lines.map(textWidth)) + 18));
  const h = 15 + lines.length * 11 + 8;
  let bx = x + 8; if (bx + w > W) bx = x - w - 8; if (bx < 2) bx = 2;
  let by = y - h - 6; if (by < 2) by = y + 10; if (by + h > H) by = H - h - 2;
  return (
    <g pointerEvents="none">
      <rect x={bx} y={by} width={w} height={h} rx={5} fill="rgba(2,6,23,0.97)" stroke="#fbbf24" strokeWidth={0.8} />
      <text x={bx + 8} y={by + 13} className="fill-white text-[8px] font-bold">{title}</text>
      {lines.map((l, i) => (
        <text key={i} x={bx + 8} y={by + 13 + (i + 1) * 11} className="fill-slate-200 text-[8px]">{l}</text>
      ))}
    </g>
  );
}

function FtaTab() {
  const ftaMap = useMemo(() => buildFtaMap(), []);
  const [selected, setSelected] = useState<string | null>(null); // 협정 id
  const [hover, setHover] = useState<{ code: string; name: string; text: string } | null>(null);

  const countryCount = Object.keys(ftaMap).length;
  const selectedFta = selected ? FTAS.find((f) => f.id === selected) ?? null : null;
  const selectedCodes = new Set(selectedFta?.countries.map((c) => c.code) ?? []);

  function fillOf(code: string): string {
    if (code === KOREA_CODE) return KOREA_FILL;
    const info = ftaMap[code];
    if (!info) return NODATA_FILL;
    if (selectedFta && !selectedCodes.has(code)) return "#334155";
    return eraOf(info.firstYear).color;
  }
  function memoOf(code: string, geoName: string): { name: string; text: string } {
    if (code === KOREA_CODE) return { name: "대한민국", text: `FTA 체결국 ${countryCount}개국 · 협정 ${FTAS.length}건` };
    const info = ftaMap[code];
    if (!info) return { name: geoName, text: "FTA 미체결" };
    return { name: info.ko, text: `${info.ftaNames.join(", ")} · ${info.firstYm} 발효` };
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🤝 FTA — 서로 관세를 낮추기로 한 약속</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          FTA(자유무역협정)를 맺으면 두 나라 사이의 관세를 <b className="text-emerald-100">단계적으로 낮추거나 없애기로</b>{" "}
          약속해요. 그래서 같은 물건이라도 <b className="text-emerald-100">FTA를 맺은 나라에서 오면 관세가 훨씬 싸거나 0%</b>가
          돼요. 나라 위에 마우스를 올려 어떤 협정으로 연결되어 있는지 확인해 보세요.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Big label="발효된 협정" value={`${FTAS.length}건`} tone="emerald" />
          <Big label="FTA 체결국" value={`${countryCount}개국`} tone="sky" />
          <Big label="첫 FTA" value="2004년 칠레" tone="amber" />
        </div>
      </div>

      {/* 지도 */}
      <div>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/40 p-2">
          <svg viewBox={`0 0 ${GEO_W} ${GEO_H}`} className="h-auto w-full min-w-[520px]" role="img" aria-label="우리나라 FTA 체결국 세계지도">
            <rect x={0} y={0} width={GEO_W} height={GEO_H} fill="#0b1220" />
            {Object.entries(GEO).map(([code, geo]) => {
              const isHover = hover?.code === code;
              const memo = memoOf(code, geo.name);
              return (
                <path
                  key={code}
                  d={geo.d}
                  fill={fillOf(code)}
                  stroke={isHover ? "#fbbf24" : "#0b1220"}
                  strokeWidth={isHover ? 1.2 : 0.3}
                  onMouseEnter={() => setHover({ code, ...memo })}
                  onMouseLeave={() => setHover((h) => (h?.code === code ? null : h))}
                  onClick={() => setHover({ code, ...memo })}
                />
              );
            })}
            {/* 지도에 도형이 없는 아주 작은 나라 */}
            {Object.entries(TINY_MARKS).map(([code, p]) => {
              const memo = memoOf(code, code);
              return (
                <circle key={code} cx={p.x} cy={p.y} r={2.6} fill={fillOf(code)} stroke="#0b1220" strokeWidth={0.6}
                  onMouseEnter={() => setHover({ code, ...memo })}
                  onMouseLeave={() => setHover((h) => (h?.code === code ? null : h))}
                  onClick={() => setHover({ code, ...memo })} />
              );
            })}
            {hover ? (
              <Memo {...(GEO[hover.code] ? centroidOf(hover.code, GEO[hover.code].d) : TINY_MARKS[hover.code] ?? { x: 0, y: 0 })}
                W={GEO_W} H={GEO_H} title={hover.name} text={hover.text} />
            ) : null}
          </svg>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">발효 시기</span>
            {ERAS.map((e) => <Legend key={e.id} color={e.color} label={e.label} />)}
            <Legend color={KOREA_FILL} label="대한민국" />
            <Legend color={NODATA_FILL} label="미체결" />
          </div>
          <p className="text-xs text-slate-500">나라 위에 마우스를 올리면 메모가 떠요</p>
        </div>
      </div>

      {/* 협정 목록 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">📜 발효된 FTA (발효일 순)</p>
          {selectedFta ? (
            <button type="button" onClick={() => setSelected(null)}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10">
              ✕ 선택 해제
            </button>
          ) : (
            <span className="text-xs text-slate-500">협정을 누르면 해당 나라만 지도에 표시돼요</span>
          )}
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {FTAS.map((f) => {
            const on = selected === f.id;
            return (
              <button key={f.id} type="button" onClick={() => setSelected(on ? null : f.id)}
                className={"rounded-xl border px-3 py-2 text-left transition " + (on ? "border-emerald-400/60 bg-emerald-400/15" : "border-white/10 bg-slate-950/40 hover:bg-white/5")}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className={"text-sm font-bold " + (on ? "text-emerald-100" : "text-slate-200")}>{f.name}</span>
                  <span className="font-mono text-[11px] text-slate-400">{f.ym} 발효 · {f.countries.length}개국</span>
                </div>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
                  {f.countries.map((c) => c.ko).join(", ")}
                </p>
              </button>
            );
          })}
        </div>
        {selectedFta?.note ? (
          <p className="mt-2 rounded-lg border-l-4 border-emerald-400/70 bg-emerald-400/[0.08] px-3 py-1.5 text-xs leading-5 text-slate-200">
            💬 {selectedFta.name} — {selectedFta.note}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🔎 지도에서 확인해 보세요</p>
        <ul className="mt-1.5 space-y-1 text-sm leading-6 text-slate-300">
          <li>• 우리나라는 <b className="text-emerald-100">{countryCount}개국</b>과 FTA를 맺어, 세계에서 손꼽히는 넓은 FTA 그물망을 갖고 있어요.</li>
          <li>• <b className="text-emerald-100">한·EU FTA는 27개국, 한·아세안 FTA는 10개국</b>과 한 번에 맺은 협정이에요 — 지도에서 색이 넓게 칠해진 이유예요.</li>
          <li>• 가까운 <b className="text-emerald-100">일본</b>과는 두 나라끼리 맺은 FTA가 없어요. RCEP(2022)으로만 연결돼 있답니다.</li>
          <li>• FTA는 관세를 낮춰 수출에 유리하지만, 값싼 수입품과 경쟁해야 하는 국내 생산자에게는 어려움이 되기도 해요.</li>
        </ul>
      </div>
    </div>
  );
}
