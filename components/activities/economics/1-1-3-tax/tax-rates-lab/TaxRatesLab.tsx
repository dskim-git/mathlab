"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import { GEO, GEO_W, GEO_H } from "./geoData";
import {
  COUNTRIES,
  DATA_NOTE,
  METRICS,
  TAX_METRICS,
  WELFARE_METRICS,
  metricValue,
  type CountryRow,
  type MetricKey,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "tax_welfare_corr",
    prompt:
      "세율(가로축)과 복지 척도(세로축)를 여러 조합으로 바꿔 보았을 때, ‘세금을 많이 걷는 나라일수록 복지 수준이 높다’는 말이 항상 맞았나요? 관찰한 경향과 예외를 함께 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 대체로 세금을 많이 걷는 북유럽이 복지도 높았지만, 세율이 비슷해도 행복지수가 다른 나라도 있었다.",
  },
  {
    id: "rate_vs_total",
    prompt:
      "탭②에서 ‘소득세 최고세율’과 ‘걷힌 세금 총액’은 순위가 서로 달랐어요. 세율이 높은 나라와 세금 총액이 큰 나라가 왜 다를 수 있는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 세금 총액은 세율뿐 아니라 나라의 경제 규모(GDP)에 크게 좌우되어서, 인구·경제가 큰 나라가 세율이 낮아도 총액은 클 수 있다.",
  },
  {
    id: "good_welfare",
    prompt:
      "‘세금을 많이 걷어 복지에 쓰는 것’이 꼭 좋은 나라를 뜻할까요? 세금과 복지의 관계에 대한 자신의 생각을 근거와 함께 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 세금을 많이 걷어도 잘 쓰지 못하면 복지가 낮을 수 있고, 세금이 낮아도 효율적으로 쓰면 만족도가 높을 수 있다. 걷는 양보다 어떻게 쓰는지가 중요하다고 생각한다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function fmt(key: MetricKey, v: number | null): string {
  if (v == null) return "—";
  switch (key) {
    case "hdi": return v.toFixed(3);
    case "happy": return v.toFixed(2) + "점";
    case "life": return v.toFixed(1) + "세";
    case "taxTotal": return fmtUSD(v);
    default: return v.toFixed(1) + "%"; // pit, burden, social
  }
}
function fmtUSD(v: number): string {
  if (v >= 1e12) return (v / 1e12).toFixed(2) + "조 달러";
  if (v >= 1e8) return Math.round(v / 1e8).toLocaleString("ko-KR") + "억 달러";
  return Math.round(v).toLocaleString("ko-KR") + " 달러";
}

// ─── 색 스케일 (SVG fill 속성으로만 사용 — 인라인 스타일 아님) ─────────
// 밝은 청록 → 진한 에메랄드 시퀀셜.
function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
function rampColor(t: number): string {
  // t: 0(연함)~1(진함)
  const c = Math.max(0, Math.min(1, t));
  const r = lerp(224, 4, c);   // #e0 → #04
  const g = lerp(242, 120, c); // #f2 → #78
  const b = lerp(241, 87, c);  // #f1 → #57
  return `rgb(${r},${g},${b})`;
}
const NODATA_FILL = "#1e293b"; // slate-800

type Scale = { min: number; max: number; t: (v: number) => number };
function makeScale(key: MetricKey): Scale {
  const vals = COUNTRIES.map((c) => metricValue(c, key)).filter((v): v is number => v != null);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return { min, max, t: (v) => (max === min ? 0.5 : (v - min) / (max - min)) };
}

// 값 있는 국가만 정렬
function ranked(key: MetricKey): CountryRow[] {
  return COUNTRIES.filter((c) => metricValue(c, key) != null).sort(
    (a, b) => (metricValue(b, key) as number) - (metricValue(a, key) as number)
  );
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "welfare" | "total";

export default function TaxRatesLab() {
  const [tab, setTab] = useState<Tab>("welfare");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🌍 세계의 세율과 복지</h3>
        <p className="mt-2 leading-7 text-slate-300">
          나라마다 세금을 걷는 정도가 달라요. 세율을 세계지도에 색으로 보고, <b className="text-emerald-200">세금을 많이 걷는
          나라가 정말 복지가 좋은지</b> 복지 척도와 나란히 비교해요. 세율과 <b className="text-emerald-200">걷힌 세금 총액</b>도
          견주어 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "welfare"} onClick={() => setTab("welfare")}>
          ① 세율 vs 복지
        </TabButton>
        <TabButton active={tab === "total"} onClick={() => setTab("total")}>
          ② 세율 vs 세금 총액
        </TabButton>
      </div>

      <div className="mt-4">{tab === "welfare" ? <WelfareTab /> : <TotalTab />}</div>

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

// ─── 코드→국가 조회 ────────────────────────────────────────────
const BY_CODE: Record<string, CountryRow> = {};
for (const c of COUNTRIES) BY_CODE[c.code] = c;

type Hover = { code: string; name: string; text: string } | null;

// 국가 경로의 대략적 중심점(툴팁 앵커) — d 의 좌표 평균. 코드별 캐시.
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

// SVG 내부 메모형 툴팁 — (x,y) 근처에 제목+내용을 띄우고 경계 안으로 클램프.
// 문자 폭 추정: 한글 등 전각 ~8.4px, 그 외 ~4.7px (font 8px 기준)
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

// ─── 세계지도 (choropleth) ─────────────────────────────────────
function WorldMap({ metricKey }: { metricKey: MetricKey }) {
  const [hover, setHover] = useState<Hover>(null);
  const scale = useMemo(() => makeScale(metricKey), [metricKey]);
  const def = METRICS[metricKey];

  return (
    <div>
      <div className="mx-auto max-w-[80%] overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/40 p-2">
        <svg viewBox={`0 0 ${GEO_W} ${GEO_H}`} className="h-auto w-full min-w-[440px]" role="img" aria-label={`세계지도: ${def.label}`}>
          <rect x={0} y={0} width={GEO_W} height={GEO_H} fill="#0b1220" />
          {Object.entries(GEO).map(([code, geo]) => {
            const row = BY_CODE[code];
            const v = row ? metricValue(row, metricKey) : null;
            const fill = v != null ? rampColor(scale.t(v)) : NODATA_FILL;
            const isHover = hover?.code === code;
            return (
              <path
                key={code}
                d={geo.d}
                fill={fill}
                stroke={isHover ? "#fbbf24" : "#0b1220"}
                strokeWidth={isHover ? 1.2 : 0.3}
                onMouseEnter={() => row && v != null
                  ? setHover({ code, name: row.name, text: `${def.short} ${fmt(metricKey, v)}` })
                  : setHover({ code, name: geo.name, text: "자료 없음" })}
                onMouseLeave={() => setHover((h) => (h?.code === code ? null : h))}
                onClick={() => row && v != null
                  ? setHover({ code, name: row.name, text: `${def.short} ${fmt(metricKey, v)}` })
                  : setHover({ code, name: geo.name, text: "자료 없음" })}
              />
            );
          })}
          {hover && GEO[hover.code] ? (
            <Memo {...centroidOf(hover.code, GEO[hover.code].d)} W={GEO_W} H={GEO_H} title={hover.name} text={hover.text} />
          ) : null}
        </svg>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
        <Legend metricKey={metricKey} scale={scale} />
        <p className="text-xs text-slate-500">나라 위에 마우스를 올리면 메모가 떠요</p>
      </div>
    </div>
  );
}

// ─── 범례 ─────────────────────────────────────────────────────
function Legend({ metricKey, scale }: { metricKey: MetricKey; scale: Scale }) {
  const def = METRICS[metricKey];
  const stops = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400">{fmt(metricKey, scale.min)}</span>
      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-3 w-28" aria-hidden="true">
        {stops.slice(0, -1).map((s, i) => (
          <rect key={i} x={s * 100} y={0} width={25} height={8} fill={rampColor((stops[i] + stops[i + 1]) / 2)} />
        ))}
      </svg>
      <span className="text-xs text-slate-400">{fmt(metricKey, scale.max)}</span>
      <span className="ml-1 rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-300">{def.short}</span>
    </div>
  );
}

// ─── 지표 선택 버튼 ────────────────────────────────────────────
function MetricPills({ keys, value, onChange, tone }: { keys: MetricKey[]; value: MetricKey; onChange: (k: MetricKey) => void; tone: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={
            "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
            (value === k ? tone : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
          }
        >
          {METRICS[k].short}
        </button>
      ))}
    </div>
  );
}

// ─── 산점도 (x 세율 · y 복지/총액) + 상관계수 ────────────────────
function pearson(pts: { x: number; y: number }[]): number | null {
  const n = pts.length;
  if (n < 3) return null;
  const sx = pts.reduce((s, p) => s + p.x, 0), sy = pts.reduce((s, p) => s + p.y, 0);
  const mx = sx / n, my = sy / n;
  let num = 0, dx = 0, dy = 0;
  for (const p of pts) { num += (p.x - mx) * (p.y - my); dx += (p.x - mx) ** 2; dy += (p.y - my) ** 2; }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? null : num / den;
}

function ScatterPlot({ xKey, yKey }: { xKey: MetricKey; yKey: MetricKey }) {
  const [hover, setHover] = useState<Hover>(null);
  const data = COUNTRIES.filter((c) => metricValue(c, xKey) != null && metricValue(c, yKey) != null)
    .map((c) => ({ c, x: metricValue(c, xKey) as number, y: metricValue(c, yKey) as number }));
  const xs = data.map((d) => d.x), ys = data.map((d) => d.y);
  const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
  const W = 340, H = 240, L = 42, R = 10, T = 12, B = 30;
  const px = (x: number) => L + ((x - xmin) / (xmax - xmin || 1)) * (W - L - R);
  const py = (y: number) => H - B - ((y - ymin) / (ymax - ymin || 1)) * (H - T - B);
  const r = pearson(data.map((d) => ({ x: d.x, y: d.y })));
  const xdef = METRICS[xKey], ydef = METRICS[yKey];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-slate-100">📈 {xdef.short}(가로) vs {ydef.short}(세로)</p>
        {r != null ? (
          <p className="text-xs text-slate-300">상관계수 r = <b className={r > 0.3 ? "text-emerald-200" : r < -0.3 ? "text-rose-200" : "text-slate-200"}>{r.toFixed(2)}</b> · {data.length}개국</p>
        ) : null}
      </div>
      <div className="mx-auto mt-1 max-w-[80%] overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[280px]" role="img" aria-label={`산점도 ${xdef.short} 대 ${ydef.short}`}>
          {/* 축 */}
          <line x1={L} y1={T} x2={L} y2={H - B} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          {/* 눈금 라벨 */}
          <text x={L} y={H - B + 16} className="fill-slate-400 text-[9px]">{fmt(xKey, xmin)}</text>
          <text x={W - R} y={H - B + 16} textAnchor="end" className="fill-slate-400 text-[9px]">{fmt(xKey, xmax)}</text>
          <text x={L - 4} y={H - B} textAnchor="end" className="fill-slate-400 text-[9px]">{fmt(yKey, ymin)}</text>
          <text x={L - 4} y={T + 8} textAnchor="end" className="fill-slate-400 text-[9px]">{fmt(yKey, ymax)}</text>
          {/* 축 이름 */}
          <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle" className="fill-slate-300 text-[10px] font-bold">{xdef.short} →</text>
          <text x={12} y={(T + H - B) / 2} textAnchor="middle" transform={`rotate(-90 12 ${(T + H - B) / 2})`} className="fill-slate-300 text-[10px] font-bold">{ydef.short} →</text>
          {/* 점 */}
          {data.map((d) => {
            const isKor = d.c.code === "KOR";
            const isHover = hover?.code === d.c.code;
            return (
              <circle
                key={d.c.code}
                cx={px(d.x)} cy={py(d.y)} r={isKor || isHover ? 5 : 3.4}
                fill={isKor ? "#34d399" : "rgba(56,189,248,0.75)"}
                stroke={isHover ? "#fbbf24" : isKor ? "#a7f3d0" : "none"}
                strokeWidth={isHover ? 1.6 : isKor ? 1.2 : 0}
                onMouseEnter={() => setHover({ code: d.c.code, name: d.c.name, text: `${xdef.short} ${fmt(xKey, d.x)} · ${ydef.short} ${fmt(yKey, d.y)}` })}
                onMouseLeave={() => setHover((h) => (h?.code === d.c.code ? null : h))}
                onClick={() => setHover({ code: d.c.code, name: d.c.name, text: `${xdef.short} ${fmt(xKey, d.x)} · ${ydef.short} ${fmt(yKey, d.y)}` })}
              />
            );
          })}
          {hover && data.some((d) => d.c.code === hover.code)
            ? (() => { const d = data.find((p) => p.c.code === hover.code)!; return (
                <Memo x={px(d.x)} y={py(d.y)} W={W} H={H} title={d.c.name} text={hover.text} />
              ); })()
            : null}
        </svg>
      </div>
      <p className="mt-1 text-xs text-slate-500">🟢 대한민국 · 점에 마우스를 올리면 근처에 메모가 떠요</p>
    </div>
  );
}

// ─── 순위 목록 ─────────────────────────────────────────────────
function RankingList({ metricKey }: { metricKey: MetricKey }) {
  const list = ranked(metricKey);
  const scale = makeScale(metricKey);
  const top = list.slice(0, 5);
  const bottom = list.slice(-3);
  const Row = ({ c, rank }: { c: CountryRow; rank: number }) => {
    const v = metricValue(c, metricKey) as number;
    const isKor = c.code === "KOR";
    return (
      <div className={"flex items-center gap-2 rounded-lg px-2 py-1 " + (isKor ? "bg-emerald-400/10" : "")}>
        <span className="w-5 text-right text-xs text-slate-500">{rank}</span>
        <span className={"w-28 shrink-0 text-sm " + (isKor ? "font-bold text-emerald-200" : "text-slate-200")}>{c.name}</span>
        <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-2.5 flex-1" aria-hidden="true">
          <rect width={100} height={8} rx={2} fill="rgba(255,255,255,0.06)" />
          <rect width={Math.max(2, scale.t(v) * 100)} height={8} rx={2} fill={rampColor(scale.t(v))} />
        </svg>
        <span className="w-20 shrink-0 text-right font-mono text-xs text-slate-200">{fmt(metricKey, v)}</span>
      </div>
    );
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
      <p className="text-sm font-bold text-slate-100">🏆 {METRICS[metricKey].short} 상위 5 · 하위 3</p>
      <div className="mt-2 space-y-0.5">
        {top.map((c, i) => <Row key={c.code} c={c} rank={i + 1} />)}
        <div className="py-0.5 text-center text-xs text-slate-600">⋯ ({list.length}개국 중)</div>
        {bottom.map((c, i) => <Row key={c.code} c={c} rank={list.length - 2 + i} />)}
      </div>
    </div>
  );
}

// ─── 지도에 표시할 지표 토글 ───────────────────────────────────
function MapToggle({ options, value, onChange }: { options: { key: MetricKey; label: string }[]; value: MetricKey; onChange: (k: MetricKey) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-slate-400">지도 색:</span>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={
            "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
            (value === o.key ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 세율 vs 복지
// ══════════════════════════════════════════════════════════════
function WelfareTab() {
  const [xKey, setXKey] = useState<MetricKey>("burden");
  const [yKey, setYKey] = useState<MetricKey>("hdi");
  const [mapKey, setMapKey] = useState<MetricKey>("hdi");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <p className="text-sm font-bold text-sky-200">🔎 세금을 많이 걷는 나라가 복지도 좋을까?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          <b className="text-sky-100">가로축(세율)</b>과 <b className="text-sky-100">세로축(복지 척도)</b>을 골라 산점도의 관계를 살펴보세요.
          지도 색으로도 확인할 수 있어요. 척도마다 자료가 있는 나라만 표시돼요.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-2.5">
            <p className="mb-1.5 text-xs font-bold text-slate-400">가로축 · 세율 기준</p>
            <MetricPills keys={TAX_METRICS} value={xKey} onChange={setXKey} tone="border-sky-400/60 bg-sky-400/20 text-sky-100" />
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-2.5">
            <p className="mb-1.5 text-xs font-bold text-slate-400">세로축 · 복지 척도</p>
            <MetricPills keys={WELFARE_METRICS} value={yKey} onChange={setYKey} tone="border-emerald-400/60 bg-emerald-400/20 text-emerald-100" />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">{METRICS[xKey].desc} · {METRICS[yKey].desc}</p>
      </div>

      <ScatterPlot xKey={xKey} yKey={yKey} />

      <div className="space-y-2">
        <MapToggle options={[{ key: xKey, label: METRICS[xKey].short }, { key: yKey, label: METRICS[yKey].short }]} value={mapKey === xKey || mapKey === yKey ? mapKey : yKey} onChange={setMapKey} />
        <WorldMap metricKey={mapKey === xKey || mapKey === yKey ? mapKey : yKey} />
      </div>

      <RankingList metricKey={mapKey === xKey || mapKey === yKey ? mapKey : yKey} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 세율 vs 걷힌 세금 총액
// ══════════════════════════════════════════════════════════════
function TotalTab() {
  const [xKey, setXKey] = useState<MetricKey>("pit");
  const [mapKey, setMapKey] = useState<MetricKey>("taxTotal");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">💰 세율이 높은 나라 = 세금을 많이 걷는 나라일까?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          <b className="text-amber-100">세율</b>과 <b className="text-amber-100">한 해 걷힌 세금 총액</b>을 비교해요. 세금 총액은 세율뿐 아니라
          나라의 <b className="text-amber-100">경제 규모(GDP)</b>에 크게 좌우돼요. 세율은 낮아도 총액은 큰 나라를 찾아보세요.
        </p>
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/40 p-2.5">
          <p className="mb-1.5 text-xs font-bold text-slate-400">가로축 · 세율 기준</p>
          <MetricPills keys={TAX_METRICS} value={xKey} onChange={setXKey} tone="border-amber-400/60 bg-amber-400/20 text-amber-100" />
        </div>
        <p className="mt-2 text-xs text-slate-400">세금 총액 = 국민부담률 × GDP (대략적 추정) · {METRICS.taxTotal.desc}</p>
      </div>

      <ScatterPlot xKey={xKey} yKey="taxTotal" />

      <div className="space-y-2">
        <MapToggle options={[{ key: xKey, label: METRICS[xKey].short }, { key: "taxTotal", label: METRICS.taxTotal.short }]} value={mapKey === xKey || mapKey === "taxTotal" ? mapKey : "taxTotal"} onChange={setMapKey} />
        <WorldMap metricKey={mapKey === xKey || mapKey === "taxTotal" ? mapKey : "taxTotal"} />
      </div>

      <RankingList metricKey={mapKey === xKey || mapKey === "taxTotal" ? mapKey : "taxTotal"} />
    </div>
  );
}
