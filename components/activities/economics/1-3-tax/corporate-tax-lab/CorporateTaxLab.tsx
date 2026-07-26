"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  COMPANIES,
  DATA_NOTE,
  YEARS,
  brackets,
  corpBracketIndex,
  corpTaxByBracket,
  corpTaxByDeduction,
  type CorpKind,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "vs_income_tax",
    prompt:
      "법인세도 누진 구조예요. 앞서 배운 개인 소득세(6~45%, 8구간)와 비교해, 법인세의 세율 구조(구간 수·최고세율)가 어떻게 다른지 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 소득세는 6~45%로 구간이 8개이고 최고세율이 높은 반면, 법인세는 9~24%로 구간이 4개이고 최고세율이 낮다.",
  },
  {
    id: "kind_difference",
    prompt:
      "같은 과세표준이라도 법인 종류(영리·비영리 vs 조합)에 따라 세금이 달라져요. 조합법인의 세율이 더 낮은 까닭이 무엇일지, 조합의 성격과 연결해 생각해 보세요.",
    kind: "text",
    placeholder:
      "예: 조합법인은 조합원의 이익을 위한 협동조직이라 영리기업보다 세율을 낮게 두어 지원한다고 생각한다.",
  },
  {
    id: "yearly_swing",
    prompt:
      "탭②에서 한 기업의 법인세가 해마다 크게 달라지고, 어떤 해에는 음수(환입)이기도 했어요. 법인세가 무엇에 따라 오르내리는지, 왜 음수가 나올 수 있는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 법인세는 그 해 번 이익(과세표준)에 매기므로 이익이 줄면 세금도 준다. 적자이거나 이연법인세 효과가 크면 오히려 환입되어 음수가 될 수 있다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
export function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}
/** 큰 금액을 조·억으로 (음수 지원) */
export function fmtBig(v: number): string {
  const s = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (a >= 1e12) return s + (a / 1e12).toFixed(a >= 1e13 ? 1 : 2) + "조";
  if (a >= 1e8) return s + Math.round(a / 1e8).toLocaleString("ko-KR") + "억";
  if (a >= 1e4) return s + Math.round(a / 1e4).toLocaleString("ko-KR") + "만원";
  return s + Math.round(a).toLocaleString("ko-KR") + "원";
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "calc" | "companies";

export default function CorporateTaxLab() {
  const [tab, setTab] = useState<Tab>("calc");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🏢 직접세의 계산 — 법인세</h3>
        <p className="mt-2 leading-7 text-slate-300">
          법인세는 <b className="text-emerald-200">법인이 번 소득</b>에 매기는 직접세예요. 법인 종류와 과세표준을 정해
          <b className="text-emerald-200"> 누진공제 방식</b>으로 계산하는 과정을 보고, 우리나라 실제 기업들이 최근 5년간
          법인세를 얼마나 냈는지도 살펴봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "calc"} onClick={() => setTab("calc")}>① 법인세 계산 시뮬레이션</TabButton>
        <TabButton active={tab === "companies"} onClick={() => setTab("companies")}>② 실제 기업의 법인세 5개년</TabButton>
      </div>

      <div className="mt-4">{tab === "calc" ? <CalcTab /> : <CompaniesTab />}</div>

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
// 탭 ① 법인세 계산 시뮬레이션 (sky)
// ══════════════════════════════════════════════════════════════
const KIND_INFO: Record<CorpKind, { label: string; desc: string; max: number; def: number }> = {
  "일반": { label: "영리·비영리법인", desc: "영리 목적(기업) 또는 공익 목적(학교·종교·복지 등)", max: 5_000 * 1e8, def: 100 * 1e8 },
  "조합": { label: "조합법인", desc: "농업협동조합·소비자생활협동조합 등", max: 100 * 1e8, def: 30 * 1e8 },
};

function CalcTab() {
  const [kind, setKind] = useState<CorpKind>("일반");
  const [base, setBase] = useState(100 * 1e8);
  const bs = brackets(kind);
  const bi = corpBracketIndex(base, kind);
  const b = bs[bi];
  const taxA = corpTaxByBracket(base, kind);
  const taxB = corpTaxByDeduction(base, kind);
  const eff = base > 0 ? taxA / base : 0;

  // 방법 A 구간 내역
  const parts: { rate: number; amount: number; tax: number }[] = [];
  let prev = 0;
  for (const br of bs) {
    const hi = Math.min(base, br.upTo);
    if (hi > prev) parts.push({ rate: br.rate, amount: hi - prev, tax: (hi - prev) * br.rate });
    if (base <= br.upTo) break;
    prev = br.upTo;
  }

  function pickKind(k: CorpKind) { setKind(k); setBase(KIND_INFO[k].def); }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <p className="text-sm font-bold text-sky-200">🏢 법인 종류와 과세표준을 정해 보세요</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          법인 종류에 따라 세율표가 달라요. <b className="text-sky-100">법인세 = 과세표준 × 세율 − 누진공제액</b> 으로 계산돼요.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["일반", "조합"] as CorpKind[]).map((k) => (
            <button key={k} type="button" onClick={() => pickKind(k)}
              className={"rounded-xl border-2 px-3 py-2 text-sm font-bold transition " + (kind === k ? "border-sky-400/60 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
              {KIND_INFO[k].label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">{KIND_INFO[kind].desc}</p>
        <label htmlFor="cbase" className="mt-3 block text-sm font-bold text-slate-200">과세표준: <span className="font-mono text-sky-200">{fmtBig(base)}</span></label>
        <input id="cbase" type="range" min={0} max={KIND_INFO[kind].max} step={1e8} value={base}
          onChange={(e) => setBase(Number(e.target.value))}
          className="mt-2 w-full accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />
      </div>

      {/* 세율표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📋 {KIND_INFO[kind].label} 세율표 (2024년)</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="py-1 text-left font-semibold">과세표준</th>
                <th className="py-1 text-right font-semibold">세율</th>
                <th className="py-1 text-right font-semibold">누진공제액</th>
              </tr>
            </thead>
            <tbody>
              {bs.map((br, i) => {
                const lo = i === 0 ? 0 : bs[i - 1].upTo;
                const active = i === bi;
                return (
                  <tr key={i} className={active ? "bg-sky-400/15" : ""}>
                    <td className="py-1 text-slate-200">{fmtBig(lo)} 초과 ~ {br.upTo === Infinity ? "그 이상" : fmtBig(br.upTo) + " 이하"}</td>
                    <td className="py-1 text-right font-mono text-sky-200">{(br.rate * 100).toFixed(0)}%</td>
                    <td className="py-1 text-right font-mono text-slate-300">{br.deduct === 0 ? "—" : fmtBig(br.deduct)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 과세표준 → 법인세 그래프 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📈 과세표준에 따른 법인세 — {KIND_INFO[kind].label}</p>
        <p className="mt-1 text-xs text-slate-400">구간 경계마다 <b className="text-slate-200">기울기(세율)</b>가 커지지만 그래프는 <b className="text-emerald-200">끊기지 않고 이어져요(연속)</b>.</p>
        {(() => {
          const XMAX = KIND_INFO[kind].max;
          const YMAX = corpTaxByBracket(XMAX, kind);
          const W = 320, H = 180, L = 40, R = 10, T = 12, Bm = 24;
          const px = (x: number) => L + (Math.min(x, XMAX) / XMAX) * (W - L - R);
          const py = (y: number) => H - Bm - (Math.min(y, YMAX) / YMAX) * (H - T - Bm);
          const bounds = bs.slice(0, -1).map((br) => br.upTo).filter((x) => x <= XMAX);
          const nodes = [0, ...bounds, XMAX];
          const line = nodes.map((x) => `${px(x)},${py(corpTaxByBracket(x, kind))}`).join(" ");
          return (
            <div className="mx-auto mt-2 max-w-[80%] overflow-x-auto">
              <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[260px]" role="img" aria-label="과세표준에 따른 법인세 그래프">
                <line x1={L} y1={T} x2={L} y2={H - Bm} stroke="rgba(255,255,255,0.15)" />
                <line x1={L} y1={H - Bm} x2={W - R} y2={H - Bm} stroke="rgba(255,255,255,0.15)" />
                {bounds.map((x, i) => (
                  <line key={i} x1={px(x)} y1={T} x2={px(x)} y2={H - Bm} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
                ))}
                <polyline points={line} fill="none" stroke="#34d399" strokeWidth={1.6} />
                <line x1={px(base)} y1={py(taxB)} x2={px(base)} y2={H - Bm} stroke="#fbbf24" strokeWidth={0.8} strokeDasharray="2 2" />
                <circle cx={px(base)} cy={py(taxB)} r={3.5} fill="#fbbf24" />
                <text x={L} y={H - 6} className="fill-slate-400 text-[8px]">0</text>
                <text x={W - R} y={H - 6} textAnchor="end" className="fill-slate-400 text-[8px]">과세표준 {fmtBig(XMAX)}</text>
                <text x={L - 3} y={T + 7} textAnchor="end" className="fill-slate-400 text-[8px]">{fmtBig(YMAX)}</text>
              </svg>
            </div>
          );
        })()}
      </div>

      {/* 계산 과정 */}
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.08] p-4">
        <p className="text-sm font-bold text-emerald-100">🧮 계산 과정 (누진공제 방식)</p>
        <ol className="mt-2 space-y-1.5 text-sm text-slate-200">
          <li>① 과세표준 <b className="font-mono text-emerald-200">{fmtBig(base)}</b> 는 <b className="text-sky-200">{(b.rate * 100).toFixed(0)}% 구간</b>에 속해요.</li>
          <li>② 세율 <b className="font-mono text-sky-200">{(b.rate * 100).toFixed(0)}%</b>, 누진공제액 <b className="font-mono text-slate-100">{b.deduct === 0 ? "0원" : fmtBig(b.deduct)}</b> 을 대입.</li>
          <li>③ 법인세 = <span className="font-mono">{fmtBig(base)} × {(b.rate * 100).toFixed(0)}% − {fmtBig(b.deduct)}</span></li>
        </ol>
        <div className="mt-2 flex items-baseline justify-between border-t border-white/10 pt-2">
          <span className="font-bold text-emerald-100">= 법인세</span>
          <span className="font-mono text-2xl font-bold text-emerald-200">{won(taxB)}</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">실효세율 {(eff * 100).toFixed(1)}% · {fmtBig(taxB)}</p>
      </div>

      {/* 방법 A 검증 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">🔍 구간별 누진세율로 더해도 같을까?</p>
        <div className="mt-2 space-y-1">
          {parts.map((p, i) => (
            <div key={i} className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-slate-300">{fmtBig(p.amount)} × {(p.rate * 100).toFixed(0)}%</span>
              <span className="font-mono text-slate-100">{won(p.tax)}</span>
            </div>
          ))}
        </div>
        <div className={"mt-2 rounded-lg border-l-4 px-3 py-2 text-sm " + (taxA === taxB ? "border-emerald-400 bg-emerald-400/[0.08] text-slate-200" : "border-rose-400 bg-rose-400/[0.08]")}>
          {taxA === taxB
            ? <>합계 <b className="font-mono text-emerald-200">{won(taxA)}</b> — 누진공제 방식과 <b className="text-emerald-200">정확히 같아요!</b></>
            : <>두 값이 다릅니다.</>}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 실제 기업의 법인세 5개년 (amber)
// ══════════════════════════════════════════════════════════════
const COLORS: Record<string, string> = {
  samsung: "#38bdf8", skhynix: "#a78bfa", hyundai: "#f472b6",
  naver: "#34d399", kakao: "#fbbf24", hansalim: "#fb7185",
};

function CompaniesTab() {
  const [visible, setVisible] = useState<Set<string>>(new Set(COMPANIES.map((c) => c.id)));
  const [hover, setHover] = useState<{ id: string; year: number } | null>(null);

  function toggle(id: string) {
    setVisible((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  const shown = COMPANIES.filter((c) => visible.has(c.id));
  const vals = shown.flatMap((c) => YEARS.map((y) => c.tax[y]));
  const ymax = Math.max(0, ...vals, 1);
  const ymin = Math.min(0, ...vals);

  const W = 360, H = 250, L = 46, R = 12, T = 14, Bm = 26;
  const px = (i: number) => L + (i / (YEARS.length - 1)) * (W - L - R);
  const py = (v: number) => {
    const t = (v - ymin) / (ymax - ymin || 1);
    return H - Bm - t * (H - T - Bm);
  };
  const hoverCo = hover ? COMPANIES.find((c) => c.id === hover.id) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">📊 우리나라 기업들은 법인세를 얼마나 냈을까?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          실제 기업의 최근 5년(2021~2025) <b className="text-amber-100">법인세비용</b>이에요(DART 공시). 기업을 켜고 끄면
          그래프가 <b className="text-amber-100">자동으로 크기를 맞춰</b>요. 삼성전자 하나와 <b className="text-rose-200">한살림(조합)</b> 하나만
          켜서 <b className="text-amber-100">규모 차이</b>를 비교해 보세요.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {COMPANIES.map((c) => {
            const on = visible.has(c.id);
            return (
              <button key={c.id} type="button" onClick={() => toggle(c.id)}
                className={"flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (on ? "border-white/20 bg-white/10 text-slate-100" : "border-white/10 bg-white/5 text-slate-500")}>
                <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden="true"><circle cx={5} cy={5} r={5} fill={on ? COLORS[c.id] : "#475569"} /></svg>
                {c.emoji} {c.name}{c.kind === "조합" ? "(조합)" : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* 그래프 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="mx-auto max-w-[80%] overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[280px]" role="img" aria-label="기업별 법인세비용 5개년 그래프">
            {/* y=0 기준선 */}
            <line x1={L} y1={py(0)} x2={W - R} y2={py(0)} stroke="rgba(255,255,255,0.22)" strokeWidth={1} />
            <text x={L - 4} y={py(0) + 3} textAnchor="end" className="fill-slate-400 text-[9px]">0</text>
            <text x={L - 4} y={T + 6} textAnchor="end" className="fill-slate-400 text-[9px]">{fmtBig(ymax)}</text>
            {ymin < 0 ? <text x={L - 4} y={H - Bm} textAnchor="end" className="fill-slate-400 text-[9px]">{fmtBig(ymin)}</text> : null}
            {/* x 축 연도 */}
            {YEARS.map((y, i) => (
              <text key={y} x={px(i)} y={H - 8} textAnchor="middle" className="fill-slate-400 text-[9px]">{y}</text>
            ))}
            {/* 라인 */}
            {shown.map((c) => {
              const pts = YEARS.map((y, i) => `${px(i)},${py(c.tax[y])}`).join(" ");
              return <polyline key={c.id} points={pts} fill="none" stroke={COLORS[c.id]} strokeWidth={1.8} />;
            })}
            {/* 점 */}
            {shown.map((c) => YEARS.map((y, i) => {
              const isH = hover?.id === c.id && hover?.year === y;
              return (
                <circle key={c.id + y} cx={px(i)} cy={py(c.tax[y])} r={isH ? 5 : 3} fill={COLORS[c.id]}
                  stroke={isH ? "#fff" : "none"} strokeWidth={isH ? 1.2 : 0}
                  onMouseEnter={() => setHover({ id: c.id, year: y })}
                  onMouseLeave={() => setHover((h) => (h?.id === c.id && h?.year === y ? null : h))}
                  onClick={() => setHover({ id: c.id, year: y })} />
              );
            }))}
            {/* 호버 메모 */}
            {hoverCo && hover ? (() => {
              const i = YEARS.indexOf(hover.year as (typeof YEARS)[number]);
              const v = hoverCo.tax[hover.year];
              const x = px(i), y = py(v);
              const title = `${hoverCo.name} ${hover.year}`;
              const body = `법인세비용 ${fmtBig(v)}`;
              const w = Math.max(title.length, body.length) * 6.2 + 14;
              let bx = x + 8; if (bx + w > W) bx = x - w - 8; if (bx < 2) bx = 2;
              let by = y - 34; if (by < 2) by = y + 10;
              return (
                <g pointerEvents="none">
                  <rect x={bx} y={by} width={w} height={28} rx={5} fill="rgba(2,6,23,0.97)" stroke={COLORS[hoverCo.id]} strokeWidth={0.8} />
                  <text x={bx + 7} y={by + 12} className="fill-white text-[8px] font-bold">{title}</text>
                  <text x={bx + 7} y={by + 22} className="fill-slate-200 text-[8px]">{body}</text>
                </g>
              );
            })() : null}
          </svg>
        </div>
        <p className="mt-1 text-xs text-slate-500">{hover ? "" : "점에 마우스를 올리면 값이 나와요 · "}음수(0 아래)는 법인세 환입(적자·이연법인세 등)</p>
      </div>

      {/* 표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📋 법인세비용 표 (단위: 원)</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="py-1 text-left font-semibold">기업</th>
                {YEARS.map((y) => <th key={y} className="py-1 text-right font-semibold">{y}</th>)}
              </tr>
            </thead>
            <tbody>
              {COMPANIES.map((c) => (
                <tr key={c.id} className={visible.has(c.id) ? "" : "opacity-40"}>
                  <td className="py-1 text-slate-200">{c.emoji} {c.name} <span className="text-xs text-slate-500">({c.kind === "조합" ? "조합·" + c.fs : c.fs})</span></td>
                  {YEARS.map((y) => (
                    <td key={y} className={"py-1 text-right font-mono " + (c.tax[y] < 0 ? "text-rose-300" : "text-slate-200")}>{fmtBig(c.tax[y])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">영리법인은 연결 손익계산서, 한살림(조합)은 별도 손익계산서 기준 · 출처: DART 전자공시</p>
      </div>
    </div>
  );
}
