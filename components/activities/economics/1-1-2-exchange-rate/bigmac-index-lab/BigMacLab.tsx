"use client";

import { useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  BM_DATE, US_BIGMAC, COUNTRIES, TS_DATES, MAJORS, SERIES,
  GOODS, ALT_COUNTRIES, ALT_PRICES, OFFICIAL_PLI, PLI_SOURCE,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "won_undervalued",
    prompt:
      "탭①에서 한국의 빅맥을 달러로 환산하면 미국보다 쌌어요(약 −39%). 이것이 ‘원화가 저평가되어 있다’는 뜻과 어떻게 연결되는지, 빅맥의 내재환율(빅맥 기준 환율)과 실제 환율을 비교해 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 빅맥으로 계산한 환율(내재환율)보다 실제 환율이 더 높아, 같은 빅맥이 한국에선 달러로 더 싸다. 즉 원화의 실제 구매력이 환율보다 커서 원이 저평가된 셈이다.",
  },
  {
    id: "ppp_idea",
    prompt:
      "빅맥처럼 어느 나라나 거의 같은 물건의 가격을 비교하면 왜 그 나라 돈의 ‘실질 구매력’을 가늠할 수 있을까요? 스위스 빅맥이 비싸고 인도 빅맥이 싼 것을 예로 들어 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 같은 빅맥이라도 나라마다 달러 가격이 다르면, 그 나라 돈으로 살 수 있는 양(구매력)이 다르다는 뜻이다. 스위스는 빅맥이 비싸 물가·통화가치가 높고, 인도는 싸서 낮다.",
  },
  {
    id: "index_limits",
    prompt:
      "탭③에서 빅맥·아이폰·스타벅스 지수를 세계은행 공식 물가수준지수와 비교했더니 대체로 비슷했지만 완벽히 같지는 않았어요. 왜 이런 간단한 지수가 공식 물가지표와 비슷한 결과를 주면서도 완전히 일치하지는 않는지(품목의 재료비·인건비·관세·브랜드 등) 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 여러 나라에서 공통으로 팔리는 물건값은 그 나라 물가를 대체로 반영하므로 공식 지표와 비슷하다. 다만 빅맥은 현지 재료·인건비, 아이폰은 관세·세금 영향이 커서 한 품목만으론 완전히 일치하지 않는다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function pct(v: number, d = 1): string { return `${v >= 0 ? "+" : ""}${(v * 100).toFixed(d)}%`; }
function usd(v: number): string { return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function valColor(v: number): string { return v > 0.02 ? "text-rose-300" : v < -0.02 ? "text-sky-300" : "text-slate-300"; }

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "bigmac" | "others" | "official";

export default function BigMacLab() {
  const [tab, setTab] = useState<Tab>("bigmac");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🍔 빅맥지수와 물가</h3>
        <p className="mt-2 leading-7 text-slate-300">
          어느 나라에나 있는 <b className="text-emerald-200">빅맥</b>의 가격을 달러로 비교하면 그 나라 돈이 환율보다 고평가·저평가되어
          있는지 알 수 있어요. 실제 데이터로 탐구하고, 빅맥 말고 <b className="text-emerald-200">다른 물건</b>으로도 나만의 물가 지수를 만들어 봐요.
        </p>
        <p className="mt-1 text-xs text-slate-500">출처 The Economist Big Mac Index · 기준일 {BM_DATE} · 미국 빅맥 {usd(US_BIGMAC)}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "bigmac"} onClick={() => setTab("bigmac")}>① 빅맥지수와 환율</TabButton>
        <TabButton active={tab === "others"} onClick={() => setTab("others")}>② 다른 물건으로 만드는 지수</TabButton>
        <TabButton active={tab === "official"} onClick={() => setTab("official")}>③ 공식 물가지표와 비교</TabButton>
      </div>

      <div className="mt-4">{tab === "bigmac" ? <BigMacTab /> : tab === "others" ? <OthersTab /> : <OfficialTab />}</div>

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
// 탭 ① 빅맥지수와 환율
// ══════════════════════════════════════════════════════════════
const LC = { W: 540, H: 180, X0: 40, X1: 528, Y0: 150, Y1: 16 };

function BigMacTab() {
  const [selIso, setSelIso] = useState("KOR");
  const ranked = useMemo(() => [...COUNTRIES].sort((a, b) => b.dollar - a.dollar), []);
  const maxD = ranked[0].dollar;
  const sel = COUNTRIES.find((c) => c.iso === selIso)!;
  const implied = sel.local / US_BIGMAC; // 빅맥 기준 내재환율(현지통화/USD)

  const isMajor = MAJORS.includes(selIso);
  const selSeries = SERIES[selIso];
  const usSeries = SERIES["USA"];

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 각 나라 빅맥의 <b className="text-emerald-200">달러 환산 가격</b>이에요. 미국({usd(US_BIGMAC)})보다 <b className="text-rose-200">비싸면 통화 고평가</b>,{" "}
        <b className="text-sky-200">싸면 저평가</b>. 나라를 클릭해 자세히 보세요.
      </p>

      {/* 랭킹 막대 */}
      <div className="mt-3 max-h-[300px] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/50 p-2">
        {ranked.map((c) => {
          const isSel = c.iso === selIso, isKor = c.iso === "KOR", isUs = c.iso === "USA";
          return (
            <button key={c.iso} type="button" onClick={() => setSelIso(c.iso)}
              className={"flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition " + (isSel ? "bg-emerald-400/15" : "hover:bg-white/5")}>
              <span className={"w-20 shrink-0 truncate text-xs font-bold " + (isKor ? "text-emerald-300" : isUs ? "text-amber-200" : "text-slate-200")}>{c.name}{isKor ? " 🇰🇷" : ""}</span>
              <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/5">
                <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="h-3 w-full">
                  <rect x={0} y={0} width={(c.dollar / maxD) * 100} height={6} rx={3} fill={c.usdRaw > 0.02 ? "#fb7185" : c.usdRaw < -0.02 ? "#38bdf8" : "#94a3b8"} />
                  <rect x={(US_BIGMAC / maxD) * 100 - 0.3} y={0} width={0.6} height={6} fill="#fbbf24" />
                </svg>
              </span>
              <span className="w-12 shrink-0 text-right font-mono text-xs text-white">{usd(c.dollar)}</span>
              <span className={"w-14 shrink-0 text-right font-mono text-xs " + valColor(c.usdRaw)}>{pct(c.usdRaw, 0)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[10px] text-slate-500">노란 선 = 미국 빅맥 가격 기준. 오른쪽 % = 미국 대비 고평가(+)/저평가(−).</p>

      {/* 선택 국가 상세 */}
      <div className="mt-3 rounded-xl border border-emerald-400/30 bg-slate-900/40 p-4">
        <p className="text-base font-bold text-emerald-200">{sel.name} 빅맥 상세</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Detail label="빅맥 현지가격" value={`${sel.local.toLocaleString()} ${sel.cur}`} />
          <Detail label="달러 환산 가격" value={usd(sel.dollar)} sub={`= 현지가격 ÷ 실제환율`} />
          <Detail label="빅맥 기준 내재환율" value={`${implied.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${sel.cur}/$`} sub={`= 현지가격 ÷ 미국 빅맥(${US_BIGMAC})`} tone="emerald" />
          <Detail label="실제 환율" value={`${sel.ex.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${sel.cur}/$`} tone="amber" />
        </div>
        <div className={"mt-2 rounded-lg border-l-4 px-3 py-2 text-sm " + (sel.usdRaw < 0 ? "border-sky-400 bg-sky-400/10 text-sky-100" : sel.usdRaw > 0 ? "border-rose-400 bg-rose-400/10 text-rose-100" : "border-white/20 bg-white/5 text-slate-200")}>
          {sel.iso === "USA" ? "기준 나라(미국)예요." : sel.usdRaw < 0
            ? `실제 환율(${sel.ex.toLocaleString(undefined, { maximumFractionDigits: 0 })})이 빅맥 내재환율(${implied.toLocaleString(undefined, { maximumFractionDigits: 0 })})보다 높아요 → 이 나라 통화가 약 ${pct(-sel.usdRaw, 0).replace("+", "")} 저평가! 빅맥이 미국보다 싸요.`
            : `실제 환율이 빅맥 내재환율보다 낮아요 → 이 나라 통화가 약 ${pct(sel.usdRaw, 0)} 고평가. 빅맥이 미국보다 비싸요.`}
        </div>
      </div>

      {/* 시계열 */}
      {isMajor ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/30 p-3">
          <p className="text-sm font-bold text-emerald-200">📈 {sel.name} 빅맥 달러가격 추이 (vs 미국)</p>
          <MiniChart selPts={selSeries} usPts={usSeries} label={sel.name} />
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-500">💡 미국·한국·일본·중국·유로존·영국·스위스·호주·캐나다·인도·브라질·멕시코·태국을 고르면 시계열 그래프도 볼 수 있어요.</p>
      )}
    </div>
  );
}

function Detail({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "emerald" | "amber" }) {
  const c = tone === "emerald" ? "text-emerald-200" : tone === "amber" ? "text-amber-200" : "text-white";
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={"font-mono text-base font-bold " + c}>{value}</p>
      {sub ? <p className="text-[10px] text-slate-500">{sub}</p> : null}
    </div>
  );
}

function MiniChart({ selPts, usPts, label }: { selPts: ({ dollar: number; usdRaw: number } | null)[]; usPts: ({ dollar: number; usdRaw: number } | null)[]; label: string }) {
  const [hoverI, setHoverI] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const L = TS_DATES.length;
  const all = [...selPts, ...usPts].filter((p): p is { dollar: number; usdRaw: number } => p != null).map((p) => p.dollar);
  const lo = Math.min(...all) * 0.9, hi = Math.max(...all) * 1.05;
  const xAt = (i: number) => LC.X0 + (i / (L - 1)) * (LC.X1 - LC.X0);
  const yAt = (v: number) => LC.Y0 - ((v - lo) / (hi - lo || 1)) * (LC.Y0 - LC.Y1);
  const pathOf = (pts: ({ dollar: number } | null)[]) => { let d = ""; pts.forEach((p, i) => { if (!p) return; d += (d === "" ? "M" : "L") + xAt(i).toFixed(1) + " " + yAt(p.dollar).toFixed(1) + " "; }); return d.trim(); };
  function onMove(e: React.MouseEvent) { const s = svgRef.current; if (!s) return; const r = s.getBoundingClientRect(); const i = Math.round((((e.clientX - r.left) / r.width) * LC.W - LC.X0) / (LC.X1 - LC.X0) * (L - 1)); setHoverI(Math.max(0, Math.min(L - 1, i))); }
  const xt = []; for (let i = 0; i < L; i += Math.ceil(L / 6)) xt.push(i);

  return (
    <div>
      <div className="mt-1 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/60">
        <svg ref={svgRef} viewBox={`0 0 ${LC.W} ${LC.H}`} className="w-full select-none" role="img" aria-label="빅맥 달러가격 시계열" onMouseMove={onMove} onMouseLeave={() => setHoverI(null)}>
          <line x1={LC.X0} y1={LC.Y0} x2={LC.X1} y2={LC.Y0} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
          {[lo, (lo + hi) / 2, hi].map((v, i) => <text key={i} x={LC.X0 - 4} y={yAt(v) + 3} textAnchor="end" className="fill-slate-400 font-mono text-[8px]">${v.toFixed(1)}</text>)}
          {xt.map((i) => <text key={i} x={xAt(i)} y={LC.Y0 + 12} textAnchor="middle" className="fill-slate-400 font-mono text-[8px]">{TS_DATES[i].slice(0, 4)}</text>)}
          <path d={pathOf(usPts)} fill="none" stroke="#fbbf24" strokeWidth={1.6} />
          <path d={pathOf(selPts)} fill="none" stroke="#34d399" strokeWidth={2} />
          {hoverI !== null ? (
            <g>
              <line x1={xAt(hoverI)} y1={LC.Y1} x2={xAt(hoverI)} y2={LC.Y0} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="3 3" />
              {selPts[hoverI] ? <circle cx={xAt(hoverI)} cy={yAt(selPts[hoverI]!.dollar)} r={3} fill="#34d399" /> : null}
              {usPts[hoverI] ? <circle cx={xAt(hoverI)} cy={yAt(usPts[hoverI]!.dollar)} r={3} fill="#fbbf24" /> : null}
            </g>
          ) : null}
        </svg>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 text-xs font-mono">
        {hoverI !== null ? <span className="font-bold text-slate-200">{TS_DATES[hoverI]}</span> : null}
        <span className="text-emerald-300">■ {label} {hoverI !== null && selPts[hoverI] ? usd(selPts[hoverI]!.dollar) : ""}</span>
        <span className="text-amber-300">■ 미국 {hoverI !== null && usPts[hoverI] ? usd(usPts[hoverI]!.dollar) : ""}</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 다른 물건으로 만드는 지수
// ══════════════════════════════════════════════════════════════
function OthersTab() {
  const [good, setGood] = useState("iphone");
  const g = GOODS.find((x) => x.key === good)!;
  const prices = ALT_PRICES[good];
  const usPrice = prices["USA"];
  const val = (iso: string) => (prices[iso] != null && usPrice ? prices[iso] / usPrice - 1 : NaN);
  const ranked = useMemo(() => [...ALT_COUNTRIES].filter((c) => prices[c.iso] != null).sort((a, b) => prices[b.iso] - prices[a.iso]), [good]);

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 빅맥이 아니어도 <b className="text-emerald-200">어느 나라에나 있는 물건</b>이면 물가·환율 지수를 만들 수 있어요. 물건을 골라 미국 대비
        고평가·저평가를 보고, 아래 표에서 세 지수를 비교해 보세요.
      </p>

      {/* 물건 선택 */}
      <div className="mt-3 flex flex-wrap gap-2">
        {GOODS.map((x) => (
          <button key={x.key} type="button" onClick={() => setGood(x.key)}
            className={"rounded-lg border-2 px-3 py-1.5 text-sm font-bold transition " + (good === x.key ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
            {x.emoji} {x.label}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-500">기준: 미국 {g.emoji} {usd(usPrice)} · 출처 {g.source}</p>

      {/* 선택 물건 랭킹 */}
      <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-900/40">
        <table className="min-w-full text-sm">
          <thead><tr className="text-slate-300"><th className="border-b border-white/10 px-3 py-1.5 text-left text-xs">나라</th><th className="border-b border-white/10 px-3 py-1.5 text-right text-xs">{g.label} 가격</th><th className="border-b border-white/10 px-3 py-1.5 text-right text-xs">미국 대비</th></tr></thead>
          <tbody>
            {ranked.map((c) => {
              const v = val(c.iso); const isKor = c.iso === "KOR"; const isUs = c.iso === "USA";
              return (
                <tr key={c.iso} className={"border-b border-white/5 last:border-none " + (isKor ? "bg-emerald-400/[0.06]" : "")}>
                  <td className={"px-3 py-1.5 " + (isKor ? "font-bold text-emerald-300" : isUs ? "text-amber-200" : "text-slate-200")}>{c.name}{isKor ? " 🇰🇷" : ""}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-white">{usd(prices[c.iso])}</td>
                  <td className={"px-3 py-1.5 text-right font-mono font-bold " + valColor(v)}>{isUs ? "기준" : pct(v, 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 세 지수 비교 */}
      <p className="mt-4 text-sm font-bold text-slate-200">🔍 세 지수 비교 — 미국 대비 고평가(+)/저평가(−)</p>
      <p className="text-xs text-slate-500">같은 나라라도 물건에 따라 결과가 조금씩 달라요.</p>
      <div className="mt-2 overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40">
        <table className="min-w-full text-sm">
          <thead><tr className="text-slate-300"><th className="border-b border-white/10 px-3 py-1.5 text-left text-xs">나라</th>{GOODS.map((x) => <th key={x.key} className="border-b border-white/10 px-3 py-1.5 text-right text-xs">{x.emoji} {x.label}</th>)}</tr></thead>
          <tbody>
            {ALT_COUNTRIES.map((c) => {
              const isKor = c.iso === "KOR", isUs = c.iso === "USA";
              return (
                <tr key={c.iso} className={"border-b border-white/5 last:border-none " + (isKor ? "bg-emerald-400/[0.06]" : "")}>
                  <td className={"px-3 py-1.5 " + (isKor ? "font-bold text-emerald-300" : isUs ? "text-amber-200" : "text-slate-200")}>{c.name}{isKor ? " 🇰🇷" : ""}</td>
                  {GOODS.map((x) => {
                    const p = ALT_PRICES[x.key]; const v = p[c.iso] != null ? p[c.iso] / p["USA"] - 1 : NaN;
                    return <td key={x.key} className={"px-3 py-1.5 text-right font-mono " + valColor(v)}>{isUs ? "0%" : Number.isFinite(v) ? pct(v, 0) : "—"}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        📌 <b className="text-slate-300">아이폰</b>은 세계 공통 제품이라 관세·세금이, <b className="text-slate-300">빅맥·라떼</b>는 현지 재료·인건비가 가격에 크게 반영돼요.
        그래서 어떤 물건을 기준으로 삼느냐에 따라 고평가·저평가 정도가 달라집니다.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 공식 물가지표와 비교 (산점도 · 상관)
// ══════════════════════════════════════════════════════════════
const SC = { W: 380, H: 320, X0: 42, X1: 366, Y0: 286, Y1: 14 };
const LABEL_ISOS = ["KOR", "USA", "CHE", "IND", "JPN", "CHN", "GBR", "NOR"];

function OfficialTab() {
  const [good, setGood] = useState("bigmac");
  const g = GOODS.find((x) => x.key === good)!;

  const pairs = useMemo(() => {
    const out: { iso: string; name: string; x: number; y: number }[] = [];
    if (good === "bigmac") {
      for (const c of COUNTRIES) { const off = OFFICIAL_PLI[c.iso]; if (off == null) continue; out.push({ iso: c.iso, name: c.name, x: off, y: 1 + c.usdRaw }); }
    } else {
      const p = ALT_PRICES[good]; const us = p["USA"];
      for (const c of ALT_COUNTRIES) { const off = OFFICIAL_PLI[c.iso]; if (off == null || p[c.iso] == null) continue; out.push({ iso: c.iso, name: c.name, x: off, y: p[c.iso] / us }); }
    }
    return out;
  }, [good]);

  const r = useMemo(() => {
    const n = pairs.length; if (n < 3) return NaN;
    const mx = pairs.reduce((s, p) => s + p.x, 0) / n, my = pairs.reduce((s, p) => s + p.y, 0) / n;
    let sxy = 0, sx = 0, sy = 0;
    for (const p of pairs) { const dx = p.x - mx, dy = p.y - my; sxy += dx * dy; sx += dx * dx; sy += dy * dy; }
    return sxy / Math.sqrt(sx * sy);
  }, [pairs]);

  const maxV = Math.max(...pairs.flatMap((p) => [p.x, p.y]), 1) * 1.08;
  const xAt = (v: number) => SC.X0 + (v / maxV) * (SC.X1 - SC.X0);
  const yAt = (v: number) => SC.Y0 - (v / maxV) * (SC.Y0 - SC.Y1);
  const kor = pairs.find((p) => p.iso === "KOR");

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 빅맥·아이폰 같은 <b className="text-emerald-200">한 가지 물건 지수</b>가 나라의 <b className="text-emerald-200">공식 물가 수준</b>을 얼마나 잘
        나타낼까요? 가로축(공식 물가지표)과 세로축(선택한 물건 지수)을 비교해요. 점이 <b className="text-amber-200">대각선</b>에 가까울수록 잘 맞아요.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {GOODS.map((x) => (
          <button key={x.key} type="button" onClick={() => setGood(x.key)}
            className={"rounded-lg border-2 px-3 py-1.5 text-sm font-bold transition " + (good === x.key ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
            {x.emoji} {x.label} 지수
          </button>
        ))}
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg viewBox={`0 0 ${SC.W} ${SC.H}`} className="w-full select-none" role="img" aria-label="공식 물가지표 vs 물건 지수 산점도">
          {/* 축 */}
          <line x1={SC.X0} y1={SC.Y0} x2={SC.X1} y2={SC.Y0} stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
          <line x1={SC.X0} y1={SC.Y0} x2={SC.X0} y2={SC.Y1} stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
          {[0.5, 1].map((v) => (
            <g key={v}>
              <line x1={xAt(v)} y1={SC.Y0} x2={xAt(v)} y2={SC.Y1} stroke="rgba(255,255,255,0.06)" />
              <line x1={SC.X0} y1={yAt(v)} x2={SC.X1} y2={yAt(v)} stroke="rgba(255,255,255,0.06)" />
              <text x={xAt(v)} y={SC.Y0 + 12} textAnchor="middle" className="fill-slate-400 font-mono text-[8px]">{v}</text>
              <text x={SC.X0 - 4} y={yAt(v) + 3} textAnchor="end" className="fill-slate-400 font-mono text-[8px]">{v}</text>
            </g>
          ))}
          {/* y=x 기준선 */}
          <line x1={xAt(0)} y1={yAt(0)} x2={xAt(maxV)} y2={yAt(maxV)} stroke="#fbbf24" strokeWidth={1.2} strokeDasharray="5 4" />
          <text x={xAt(maxV) - 4} y={yAt(maxV) + 12} textAnchor="end" className="fill-amber-300/80 text-[8px]">완전히 일치(y=x)</text>
          {/* 점 */}
          {pairs.map((p) => {
            const isKor = p.iso === "KOR", isUs = p.iso === "USA";
            return <circle key={p.iso} cx={xAt(p.x)} cy={yAt(p.y)} r={isKor ? 5 : 3} fill={isKor ? "#34d399" : isUs ? "#fbbf24" : "rgba(148,163,184,0.75)"} stroke={isKor || isUs ? "#0f172a" : "none"} strokeWidth={1} />;
          })}
          {/* 라벨(주요국) */}
          {pairs.filter((p) => LABEL_ISOS.includes(p.iso)).map((p) => (
            <text key={p.iso} x={xAt(p.x) + 6} y={yAt(p.y) + 3} className={"text-[8px] " + (p.iso === "KOR" ? "fill-emerald-200 font-bold" : "fill-slate-300")}>{p.name}</text>
          ))}
          <text x={SC.X1} y={SC.Y0 + 24} textAnchor="end" className="fill-slate-400 text-[9px]">→ 공식 물가수준지수(미국=1)</text>
          <text x={SC.X0 + 4} y={SC.Y1 - 2} className="fill-slate-400 text-[9px]">↑ {g.label} 지수</text>
        </svg>
      </div>

      {/* 상관 + 해설 */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] px-4 py-3">
          <p className="text-xs text-slate-400">상관계수 (r)</p>
          <p className="font-mono text-2xl font-bold text-emerald-200">{Number.isFinite(r) ? r.toFixed(2) : "—"}</p>
          <p className="mt-0.5 text-xs text-slate-400">{r >= 0.85 ? "매우 강한 양의 상관 — 거의 같은 방향" : r >= 0.6 ? "강한 양의 상관 — 대체로 일치" : "상관 있음"} ({pairs.length}개국)</p>
        </div>
        {kor ? (
          <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
            <p className="text-xs text-slate-400">🇰🇷 한국</p>
            <p className="font-mono text-sm text-slate-200">공식 물가지표 <b className="text-white">{kor.x.toFixed(2)}</b> vs {g.label} 지수 <b className="text-emerald-200">{kor.y.toFixed(2)}</b></p>
            <p className="mt-0.5 text-xs text-slate-400">둘 다 미국보다 낮음 → 물가·통화가 저평가 수준으로 비슷하게 나타남.</p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-4 py-2.5 text-sm text-slate-200">
        📌 빅맥·아이폰 같은 <b className="text-emerald-200">단일 품목 지수</b>도 공식 물가지표(<span className="text-slate-300">{PLI_SOURCE}</span>)와 <b className="text-emerald-200">강한 양의 상관</b>을 보여, 간단하지만 꽤 쓸 만한 물가·환율 눈금이 돼요. 다만 품목 특성(재료·인건비·관세) 때문에 대각선에서 조금씩 벗어납니다.
      </div>
    </div>
  );
}
