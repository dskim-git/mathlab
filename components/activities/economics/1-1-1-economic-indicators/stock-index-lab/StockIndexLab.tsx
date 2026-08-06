"use client";

import { useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  AS_OF,
  INDICES,
  CONSTITUENTS,
  KOSPI_SIM,
  type IndexKey,
  type SeriesPoint,
} from "./data";

// ─── 성찰 (활동 고유 질문 4개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "index_growth_compare",
    prompt:
      "탭①에서 ‘100 기준’으로 놓고 비교했을 때, 지난 10년간 가장 많이 오른 지수와 가장 적게 오른(또는 내린) 지수는 각각 무엇이었나요? 스케일이 크게 다른 지수(예: 나스닥 25,000 vs 코스닥 800)를 실제 값 대신 ‘100 기준 상대변화’로 비교하는 것이 왜 더 공정한지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 나스닥이 가장 많이 올랐고 코스닥은 상대적으로 덜 올랐다. 실제 값은 출발점이 달라 크기만 비교되지만, 100 기준으로 바꾸면 ‘몇 % 성장했는가’를 같은 출발선에서 비교할 수 있다.",
  },
  {
    id: "cap_weight_impact",
    prompt:
      "탭③에서 같은 비율(예: +10%)로 주가를 올려도 어떤 기업은 코스피를 크게 움직였고 어떤 기업은 거의 움직이지 못했습니다. 삼성전자와 현대모비스를 각각 +10% 해 본 결과를 적고, 그 차이가 무엇(시가총액·지수 내 비중) 때문인지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 삼성전자 +10%는 지수를 약 +4%나 올렸지만 현대모비스 +10%는 약 +0.1%뿐이었다. 지수 내 비중(시가총액 몫)이 클수록 지수에 주는 영향이 크기 때문이다.",
  },
  {
    id: "price_vs_mcap",
    prompt:
      "탭②에서 보면 주가가 더 비싼 기업이 반드시 시가총액이 더 큰 것은 아니었습니다(주가가 낮아도 상장주식수가 많으면 시총이 큼). 주가와 시가총액이 어떻게 다른지, 그리고 지수를 움직이는 것이 왜 ‘주가’가 아니라 ‘시가총액’인지 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 시가총액 = 주가 × 상장주식수. 주가는 한 주의 가격일 뿐이고 회사 전체의 크기는 시가총액이다. 지수는 시장 전체 가치의 변화를 재므로 시가총액을 기준으로 삼는다.",
  },
  {
    id: "concentration_effect",
    prompt:
      "탭③의 미니 코스피에서 삼성전자·SK하이닉스 두 종목이 지수의 큰 부분(합쳐 약 3/4)을 차지했습니다. 이렇게 소수 대형주로 ‘쏠린’ 지수는 무엇에 크게 좌우될까요? 이런 쏠림이 지수를 볼 때 어떤 점을 조심하게 만드는지 생각을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 반도체 대형주 실적에 지수가 크게 좌우된다. 지수가 올라도 소수 대형주 때문일 수 있어, 지수만으로 ‘모든 기업이 좋다’고 단정할 수 없다.",
  },
];

// ─── 공용 색·포맷 ─────────────────────────────────────────────
const ORDER: IndexKey[] = ["kospi", "kosdaq", "kospi200", "nasdaq"];

// 지수별 색: SVG stroke(hex) + 정적 Tailwind 클래스(칩/텍스트). 인라인 스타일 금지.
const IDX_STYLE: Record<
  IndexKey,
  { stroke: string; hue: number; chipOn: string; chipOff: string; text: string; dot: string }
> = {
  kospi: {
    stroke: "#34d399",
    hue: 160,
    chipOn: "border-emerald-400/60 bg-emerald-400/15 text-emerald-100",
    chipOff: "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  kosdaq: {
    stroke: "#38bdf8",
    hue: 199,
    chipOn: "border-sky-400/60 bg-sky-400/15 text-sky-100",
    chipOff: "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
    text: "text-sky-300",
    dot: "bg-sky-400",
  },
  kospi200: {
    stroke: "#fbbf24",
    hue: 43,
    chipOn: "border-amber-400/60 bg-amber-400/15 text-amber-100",
    chipOff: "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
    text: "text-amber-300",
    dot: "bg-amber-400",
  },
  nasdaq: {
    stroke: "#a78bfa",
    hue: 258,
    chipOn: "border-violet-400/60 bg-violet-400/15 text-violet-100",
    chipOff: "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
    text: "text-violet-300",
    dot: "bg-violet-400",
  },
};

function fmtMcap(mcap: number, currency: "KRW" | "USD"): string {
  const jo = mcap / 1e12;
  const num = jo >= 100 ? Math.round(jo).toLocaleString() : jo.toFixed(1);
  return currency === "USD" ? `${num}조 달러` : `${num}조`;
}
function fmtPrice(price: number, currency: "KRW" | "USD"): string {
  return currency === "USD"
    ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${Math.round(price).toLocaleString()}원`;
}
function fmtIndex(v: number): string {
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(v: number, digits = 1): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`;
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "series" | "compose" | "sim";

export default function StockIndexLab() {
  const [tab, setTab] = useState<Tab>("series");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">📈 주가지수 탐험 — 지수는 어떻게 움직일까?</h3>
        <p className="mt-2 leading-7 text-slate-300">
          코스피·코스닥·코스피200·나스닥의 <b className="text-emerald-200">실제 데이터</b>로 지수의
          10년 흐름을 비교하고, 각 지수에 어떤 기업이 담겨 있는지 살펴본 뒤, 코스피를 직접 조작하며{" "}
          <b className="text-emerald-200">시가총액이 지수를 움직이는 원리</b>를 체험해 봐요.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          데이터 기준일 {AS_OF} · 출처 Yahoo Finance (지수 시계열·종목 시가총액)
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "series"} onClick={() => setTab("series")}>
          ① 지수 흐름 비교
        </TabButton>
        <TabButton active={tab === "compose"} onClick={() => setTab("compose")}>
          ② 지수 속 종목들
        </TabButton>
        <TabButton active={tab === "sim"} onClick={() => setTab("sim")}>
          ③ 코스피 조작 시뮬레이션
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "series" ? <SeriesTab /> : null}
        {tab === "compose" ? <ComposeTab /> : null}
        {tab === "sim" ? <SimTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3 py-2 text-sm font-bold transition " +
        (active
          ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 지수 흐름 비교
// ══════════════════════════════════════════════════════════════
type Period = "yearly" | "monthly" | "daily";
type ViewMode = "rebase" | "actual";
type LiveQuote = { price: number | null; prevClose: number | null; time: number | null };

const CHART = { W: 560, H: 300, X0: 54, X1: 544, Y0: 250, Y1: 22 };

function seriesOf(k: IndexKey, p: Period): SeriesPoint[] {
  return INDICES[k][p];
}

function SeriesTab() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [mode, setMode] = useState<ViewMode>("rebase");
  const [visible, setVisible] = useState<Record<IndexKey, boolean>>({
    kospi: true,
    kosdaq: true,
    kospi200: true,
    nasdaq: true,
  });
  const [hoverI, setHoverI] = useState<number | null>(null);
  const [live, setLive] = useState<Record<string, LiveQuote> | null>(null);
  const [liveState, setLiveState] = useState<"idle" | "loading" | "error">("idle");
  const svgRef = useRef<SVGSVGElement | null>(null);

  const shown = ORDER.filter((k) => visible[k]);
  const refSeries = seriesOf("kospi", period);
  const L = refSeries.length;

  // 각 지수의 값 배열(모드에 따라 실제값 또는 100기준 환산)
  const lines = useMemo(() => {
    return shown.map((k) => {
      const raw = seriesOf(k, period).map((p) => p.close);
      const base = raw[0] || 1;
      const vals = mode === "rebase" ? raw.map((v) => (v / base) * 100) : raw;
      return { key: k, vals };
    });
  }, [shown, period, mode]);

  const { yMin, yMax } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const ln of lines)
      for (const v of ln.vals) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    if (!Number.isFinite(lo)) {
      lo = 0;
      hi = 100;
    }
    const pad = (hi - lo) * 0.08 || 1;
    return { yMin: lo - pad, yMax: hi + pad };
  }, [lines]);

  const xAt = (i: number) => (L <= 1 ? CHART.X0 : CHART.X0 + (i / (L - 1)) * (CHART.X1 - CHART.X0));
  const yAt = (v: number) =>
    CHART.Y0 - ((v - yMin) / (yMax - yMin || 1)) * (CHART.Y0 - CHART.Y1);

  // y축 눈금 5개
  const yTicks = useMemo(() => {
    const t: number[] = [];
    for (let i = 0; i <= 4; i++) t.push(yMin + ((yMax - yMin) * i) / 4);
    return t;
  }, [yMin, yMax]);

  // x축 라벨(최대 6개)
  const xTicks = useMemo(() => {
    const step = Math.max(1, Math.ceil(L / 6));
    const t: number[] = [];
    for (let i = 0; i < L; i += step) t.push(i);
    if (t[t.length - 1] !== L - 1) t.push(L - 1);
    return t;
  }, [L]);

  function onMove(e: React.MouseEvent) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width; // 0~1
    const svgX = fx * CHART.W;
    const frac = (svgX - CHART.X0) / (CHART.X1 - CHART.X0);
    const i = Math.round(frac * (L - 1));
    setHoverI(Math.max(0, Math.min(L - 1, i)));
  }

  async function refresh() {
    setLiveState("loading");
    try {
      const res = await fetch("/api/economics/stock-index", { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "실패");
      setLive(json.quotes as Record<string, LiveQuote>);
      setLiveState("idle");
    } catch {
      setLiveState("error");
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 여러 주가지수의 흐름을 한 그래프에서 비교해요. 스케일이 다른 지수를 공정하게 견주려면{" "}
        <b className="text-emerald-200">시작점을 100</b>으로 맞춰 상대 변화를 보세요. 그래프 위에
        마우스를 올리면 각 날짜의 값을 볼 수 있어요.
      </p>

      {/* 컨트롤 */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-white/10">
          {(["yearly", "monthly", "daily"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPeriod(p);
                setHoverI(null);
              }}
              className={
                "px-3 py-1.5 text-xs font-bold transition " +
                (period === p ? "bg-emerald-400/20 text-emerald-100" : "text-slate-400 hover:bg-white/5")
              }
            >
              {p === "yearly" ? "연" : p === "monthly" ? "월" : "일"}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-lg border border-white/10">
          {(["rebase", "actual"] as ViewMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={
                "px-3 py-1.5 text-xs font-bold transition " +
                (mode === m ? "bg-emerald-400/20 text-emerald-100" : "text-slate-400 hover:bg-white/5")
              }
            >
              {m === "rebase" ? "100 기준" : "실제 값"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={liveState === "loading"}
            className="rounded-lg border border-emerald-400/45 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-50"
          >
            {liveState === "loading" ? "불러오는 중…" : "🔄 최신값 새로고침"}
          </button>
        </div>
      </div>

      {/* 지수 토글 칩 */}
      <div className="mt-2 flex flex-wrap gap-2">
        {ORDER.map((k) => {
          const s = IDX_STYLE[k];
          const on = visible[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => setVisible((v) => ({ ...v, [k]: !v[k] }))}
              className={
                "flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-xs font-bold transition " +
                (on ? s.chipOn : s.chipOff)
              }
            >
              <span className={"inline-block h-2 w-2 rounded-full " + (on ? s.dot : "bg-slate-600")} />
              {INDICES[k].label}
            </button>
          );
        })}
      </div>

      {/* 그래프 */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART.W} ${CHART.H}`}
          className="w-full select-none"
          role="img"
          aria-label="주가지수 시계열 비교 그래프"
          onMouseMove={onMove}
          onMouseLeave={() => setHoverI(null)}
        >
          {/* 축 */}
          <line x1={CHART.X0} y1={CHART.Y0} x2={CHART.X1} y2={CHART.Y0} stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
          <line x1={CHART.X0} y1={CHART.Y0} x2={CHART.X0} y2={CHART.Y1} stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
          {/* y 눈금 */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={CHART.X0} y1={yAt(v)} x2={CHART.X1} y2={yAt(v)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={CHART.X0 - 6} y={yAt(v) + 3} textAnchor="end" className="fill-slate-400 font-mono text-[9px]">
                {mode === "rebase" ? Math.round(v) : Math.round(v).toLocaleString()}
              </text>
            </g>
          ))}
          {/* rebase 기준선 100 */}
          {mode === "rebase" && yMin < 100 && yMax > 100 ? (
            <line x1={CHART.X0} y1={yAt(100)} x2={CHART.X1} y2={yAt(100)} stroke="rgba(255,255,255,0.28)" strokeWidth={1} strokeDasharray="4 3" />
          ) : null}
          {/* x 라벨 */}
          {xTicks.map((i) => (
            <text key={i} x={xAt(i)} y={CHART.Y0 + 14} textAnchor="middle" className="fill-slate-400 font-mono text-[9px]">
              {shortDate(refSeries[i]?.date ?? "", period)}
            </text>
          ))}
          <text x={CHART.X0 + 2} y={CHART.Y1 - 8} className="fill-slate-400 text-[10px]">
            {mode === "rebase" ? "지수(시작=100)" : "지수 값"}
          </text>

          {/* 선 */}
          {lines.map((ln) => {
            const d = ln.vals.map((v, i) => `${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(" L ");
            return <path key={ln.key} d={`M ${d}`} fill="none" stroke={IDX_STYLE[ln.key].stroke} strokeWidth={2} />;
          })}

          {/* 호버 */}
          {hoverI !== null ? (
            <g>
              <line x1={xAt(hoverI)} y1={CHART.Y1} x2={xAt(hoverI)} y2={CHART.Y0} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="3 3" />
              {lines.map((ln) => (
                <circle key={ln.key} cx={xAt(hoverI)} cy={yAt(ln.vals[hoverI])} r={3.5} fill={IDX_STYLE[ln.key].stroke} stroke="#0f172a" strokeWidth={1.2} />
              ))}
            </g>
          ) : null}
        </svg>
      </div>

      {/* 호버 값 표 */}
      {hoverI !== null ? (
        <div className="mt-2 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-xs">
          <span className="font-mono text-slate-300">{refSeries[hoverI]?.date}</span>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {shown.map((k) => {
              const raw = seriesOf(k, period)[hoverI]?.close;
              const base = seriesOf(k, period)[0]?.close || 1;
              return (
                <span key={k} className="font-mono">
                  <span className={"mr-1 font-bold " + IDX_STYLE[k].text}>{INDICES[k].label}</span>
                  {raw != null ? fmtIndex(raw) : "—"}
                  {raw != null ? (
                    <span className="ml-1 text-slate-500">({fmtPct((raw / base - 1) * 100)})</span>
                  ) : null}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-center text-xs text-slate-500">그래프에 마우스를 올려 값을 확인해 보세요</p>
      )}

      {/* 최신값(하이브리드) */}
      {live ? (
        <div className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] px-4 py-3">
          <p className="text-xs font-bold text-emerald-200">🔄 방금 불러온 최신값 (라이브)</p>
          <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {ORDER.map((k) => {
              const q = live[k];
              const chg = q && q.price != null && q.prevClose ? (q.price / q.prevClose - 1) * 100 : null;
              return (
                <span key={k} className="font-mono">
                  <span className={"mr-1 font-bold " + IDX_STYLE[k].text}>{INDICES[k].label}</span>
                  {q && q.price != null ? fmtIndex(q.price) : "—"}
                  {chg != null ? (
                    <span className={"ml-1 " + (chg >= 0 ? "text-rose-300" : "text-sky-300")}>{fmtPct(chg, 2)}</span>
                  ) : null}
                </span>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            내장 그래프는 {AS_OF} 스냅샷이에요. 위 값은 방금 서버가 가져온 현재가라 그래프 끝값과 다를 수 있어요.
          </p>
        </div>
      ) : liveState === "error" ? (
        <p className="mt-2 text-xs text-amber-300/90">⚠️ 최신값을 불러오지 못했어요(장 마감·네트워크 등). 내장 스냅샷으로 계속 진행해요.</p>
      ) : null}
    </div>
  );
}

function shortDate(date: string, period: Period): string {
  if (period === "yearly") return date; // "2024"
  if (period === "monthly") return date.slice(2); // "24-07"
  return date.slice(5); // "07-16"
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 지수 속 종목들 (시가총액 트리맵)
// ══════════════════════════════════════════════════════════════
type Rect = { x: number; y: number; w: number; h: number };
type TItem = { name: string; ticker: string; mcap: number; price: number };

// 스퀘어리파이 트리맵 — 값 내림차순 items 를 rect 에 배치.
function squarify(items: TItem[], rect: Rect): (Rect & { it: TItem })[] {
  const out: (Rect & { it: TItem })[] = [];
  const total = items.reduce((s, i) => s + i.mcap, 0) || 1;
  let area = items.map((it) => ({ it, a: (it.mcap / total) * (rect.w * rect.h) }));
  let { x, y, w, h } = rect;

  const worst = (areas: number[], len: number) => {
    const s = areas.reduce((p, c) => p + c, 0);
    const mx = Math.max(...areas);
    const mn = Math.min(...areas);
    return Math.max((len * len * mx) / (s * s), (s * s) / (len * len * mn));
  };

  while (area.length) {
    const shorter = Math.min(w, h);
    let row = [area[0]];
    let rest = area.slice(1);
    while (rest.length) {
      const cand = [...row, rest[0]];
      if (worst(row.map((r) => r.a), shorter) >= worst(cand.map((r) => r.a), shorter)) {
        row = cand;
        rest = rest.slice(1);
      } else break;
    }
    const rowArea = row.reduce((s, r) => s + r.a, 0);
    if (w >= h) {
      const cw = rowArea / h;
      let cy = y;
      for (const r of row) {
        const rh = r.a / cw;
        out.push({ x, y: cy, w: cw, h: rh, it: r.it });
        cy += rh;
      }
      x += cw;
      w -= cw;
    } else {
      const rh = rowArea / w;
      let cx = x;
      for (const r of row) {
        const rw = r.a / rh;
        out.push({ x: cx, y, w: rw, h: rh, it: r.it });
        cx += rw;
      }
      y += rh;
      h -= rh;
    }
    area = rest;
  }
  return out;
}

const TM = { W: 560, H: 320, PAD: 2 };

function ComposeTab() {
  const [idx, setIdx] = useState<IndexKey>("kospi");
  const [live, setLive] = useState<{ idx: IndexKey; at: number; caps: Record<string, { price: number | null; mcap: number | null }> } | null>(null);
  const [liveState, setLiveState] = useState<"idle" | "loading" | "error">("idle");

  const currency = INDICES[idx].currency;
  const liveOn = !!live && live.idx === idx;

  // 라이브 새로고침 값이 있으면 시총·주가를 덮어쓰고 시총 내림차순 재정렬.
  const items = useMemo(() => {
    const merged = CONSTITUENTS[idx].map((it) => {
      const o = live && live.idx === idx ? live.caps[it.ticker] : undefined;
      return o && o.mcap ? { ...it, mcap: o.mcap, price: o.price ?? it.price } : it;
    });
    return merged.slice().sort((a, b) => b.mcap - a.mcap);
  }, [idx, live]);

  const total = items.reduce((s, i) => s + i.mcap, 0);
  const hue = IDX_STYLE[idx].hue;

  const cells = useMemo(
    () => squarify(items, { x: 0, y: 0, w: TM.W, h: TM.H }),
    [items]
  );

  async function refresh() {
    setLiveState("loading");
    try {
      const tickers = CONSTITUENTS[idx].map((i) => i.ticker).join(",");
      const res = await fetch(`/api/economics/stock-index?tickers=${encodeURIComponent(tickers)}`, { cache: "no-store" });
      const json = await res.json();
      if (!json.ok || !json.caps) throw new Error();
      setLive({ idx, at: json.fetchedAt, caps: json.caps as Record<string, { price: number | null; mcap: number | null }> });
      setLiveState("idle");
    } catch {
      setLiveState("error");
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 지수를 골라 보세요. 각 <b className="text-emerald-200">사각형의 넓이 = 그 기업의 시가총액</b>이에요. 몇몇
        대형주가 지수의 대부분을 차지하는 게 보이나요?
      </p>

      {/* 지수 선택 + 새로고침 */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {ORDER.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setIdx(k)}
            className={
              "rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition " +
              (idx === k ? IDX_STYLE[k].chipOn : IDX_STYLE[k].chipOff)
            }
          >
            {INDICES[k].label}
          </button>
        ))}
        <button
          type="button"
          onClick={refresh}
          disabled={liveState === "loading"}
          className="ml-auto rounded-lg border border-emerald-400/45 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-50"
        >
          {liveState === "loading" ? "불러오는 중…" : "🔄 시가총액 새로고침"}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        상위 {items.length}종목 · 합계 시가총액 <b className={IDX_STYLE[idx].text}>{fmtMcap(total, currency)}</b> · 기준{" "}
        {liveOn ? <b className="text-emerald-300">방금 (라이브)</b> : `${AS_OF} 스냅샷`}
        {idx === "kospi200" ? " · 코스피200은 코스피 대형주로 구성됩니다" : ""}
      </p>
      {liveState === "error" ? (
        <p className="mt-1 text-xs text-amber-300/90">⚠️ 최신 시가총액을 불러오지 못했어요(장 마감·네트워크 등). 내장 스냅샷을 그대로 보여줘요.</p>
      ) : null}

      {/* 트리맵 */}
      <div className="mt-2 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60 p-1">
        <svg viewBox={`0 0 ${TM.W} ${TM.H}`} className="w-full select-none" role="img" aria-label={`${INDICES[idx].label} 구성종목 시가총액 트리맵`}>
          {cells.map((c, i) => {
            const share = (c.it.mcap / total) * 100;
            const shareStr = share >= 1 ? `${share.toFixed(1)}%` : `${share.toFixed(2)}%`;
            const light = Math.max(30, 60 - i * 2.2); // 순위 낮을수록 어둡게
            const fill = `hsl(${hue}, 62%, ${light}%)`;
            const iw = c.w - TM.PAD * 2;
            const ih = c.h - TM.PAD * 2;
            const canLabel = iw > 32 && ih > 12;
            const twoLine = ih >= 26; // 이름 + % 두 줄
            const combine = iw > 44; // 한 줄에 "이름 %" 함께
            return (
              <g key={c.it.ticker}>
                <rect
                  x={c.x + TM.PAD}
                  y={c.y + TM.PAD}
                  width={Math.max(0, iw)}
                  height={Math.max(0, ih)}
                  rx={2}
                  fill={fill}
                  stroke="rgba(2,6,23,0.55)"
                  strokeWidth={1}
                />
                {canLabel ? (
                  twoLine ? (
                    <>
                      <text x={c.x + 6} y={c.y + 15} className="fill-slate-950 text-[10px] font-bold">
                        {c.it.name}
                      </text>
                      <text x={c.x + 6} y={c.y + 27} className="fill-slate-900/80 font-mono text-[9px]">
                        {shareStr}
                      </text>
                    </>
                  ) : combine ? (
                    <text x={c.x + 6} y={c.y + ih / 2 + 5} className="fill-slate-950 text-[9px] font-bold">
                      {c.it.name} <tspan className="font-mono font-normal">{shareStr}</tspan>
                    </text>
                  ) : (
                    <text x={c.x + 6} y={c.y + ih / 2 + 4} className="fill-slate-950 text-[9px] font-bold">
                      {c.it.name}
                    </text>
                  )
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 상위 5 표 (주가 vs 시총 대비) */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-slate-300">
              <th className="border-b border-white/10 px-3 py-1.5 text-left text-xs">순위·종목</th>
              <th className="border-b border-white/10 px-3 py-1.5 text-right text-xs">주가</th>
              <th className="border-b border-white/10 px-3 py-1.5 text-right text-xs">시가총액</th>
              <th className="border-b border-white/10 px-3 py-1.5 text-right text-xs">비중</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 5).map((it, i) => (
              <tr key={it.ticker} className="border-b border-white/5 last:border-none">
                <td className="px-3 py-1.5 text-slate-200">
                  <span className="mr-1.5 font-mono text-slate-500">{i + 1}</span>
                  {it.name}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-slate-300">{fmtPrice(it.price, currency)}</td>
                <td className={"px-3 py-1.5 text-right font-mono font-bold " + IDX_STYLE[idx].text}>{fmtMcap(it.mcap, currency)}</td>
                <td className="px-3 py-1.5 text-right font-mono text-slate-300">{((it.mcap / total) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        💭 주가가 가장 비싼 기업이 시가총액도 가장 클까요? 표에서 <b className="text-slate-300">주가 순위</b>와{" "}
        <b className="text-slate-300">시총 순위</b>가 다른 기업을 찾아보세요. (시가총액 = 주가 × 상장주식수)
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 코스피 조작 시뮬레이션 (시가총액 가중)
// ══════════════════════════════════════════════════════════════
function SimTab() {
  const stocks = KOSPI_SIM.stocks;
  const base = KOSPI_SIM.baseIndex;
  const [pct, setPct] = useState<Record<string, number>>({});

  // 지수 변화율 = Σ (비중 × 주가변동률).  기여 지수 = base × 비중 × 변동률
  const contrib = (ticker: string, weight: number) => base * weight * ((pct[ticker] ?? 0) / 100);
  const totalDelta = stocks.reduce((s, st) => s + contrib(st.ticker, st.weight), 0);
  const newIndex = base + totalDelta;
  const changePct = (totalDelta / base) * 100;

  const anyChanged = stocks.some((s) => (pct[s.ticker] ?? 0) !== 0);
  const maxWeight = stocks[0].weight;

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 코스피 시가총액 <b className="text-emerald-200">상위 15종목으로 만든 미니 지수</b>예요. 기업의 주가를
        슬라이더로 올리거나 내려 보세요. 코스피는 <b className="text-emerald-200">시가총액 가중</b> 방식이라,{" "}
        <b className="text-emerald-200">비중이 큰 기업일수록</b> 같은 % 변동이라도 지수를 훨씬 크게 움직여요.
      </p>

      {/* 지수 헤드라인 */}
      <div className="mt-3 rounded-xl border border-emerald-400/40 bg-emerald-400/[0.08] px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-slate-300">미니 코스피</span>
          <span className="font-mono text-2xl font-bold text-white">
            {fmtIndex(newIndex)}
            <span className={"ml-2 text-base " + (changePct >= 0 ? "text-rose-300" : "text-sky-300")}>
              {fmtPct(changePct, 2)}
            </span>
          </span>
        </div>
        <div className="mt-1 font-mono text-xs text-slate-400">
          기준 {fmtIndex(base)} → {fmtIndex(newIndex)} ({totalDelta >= 0 ? "+" : ""}
          {fmtIndex(totalDelta)} 포인트)
        </div>
        <p className="mt-2 rounded-lg bg-slate-950/40 px-3 py-1.5 font-mono text-[11px] text-slate-300">
          지수 변화율 = Σ (종목 비중 × 주가 변동률)
        </p>
      </div>

      {/* 종목 리스트 — 헤드라인이 항상 보이도록 리스트만 스크롤 */}
      <p className="mt-3 text-xs text-slate-500">↓ 목록을 스크롤하며 각 기업의 주가를 조작해 보세요. 위의 코스피 지수가 함께 움직입니다.</p>
      <div className="mt-1.5 max-h-[340px] space-y-1.5 overflow-y-auto rounded-xl border border-white/5 bg-slate-950/30 p-1.5">
        {stocks.map((st) => {
          const p = pct[st.ticker] ?? 0;
          const wPct = st.weight * 100;
          const c = contrib(st.ticker, st.weight);
          const barW = (st.weight / maxWeight) * 100; // 비중 막대(최대=100%)
          return (
            <div key={st.ticker} className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="w-28 shrink-0 text-sm font-bold text-slate-100">{st.name}</span>
                {/* 비중 막대 (폭은 SVG 속성 — 인라인 스타일 금지) */}
                <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="hidden h-2 flex-1 sm:block" aria-hidden="true">
                  <rect x={0} y={0} width={100} height={8} rx={4} fill="rgba(255,255,255,0.05)" />
                  <rect x={0} y={0} width={barW} height={8} rx={4} fill="rgba(52,211,153,0.6)" />
                </svg>
                <span className="w-16 shrink-0 text-right font-mono text-xs text-emerald-200">비중 {wPct.toFixed(1)}%</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <input
                  type="range"
                  min={-30}
                  max={50}
                  step={1}
                  value={p}
                  onChange={(e) => setPct((s) => ({ ...s, [st.ticker]: Number(e.target.value) }))}
                  aria-label={`${st.name} 주가 변동률`}
                  className="h-2 flex-1 cursor-pointer accent-emerald-400"
                />
                <span className={"w-16 shrink-0 text-right font-mono text-xs font-bold " + (p > 0 ? "text-rose-300" : p < 0 ? "text-sky-300" : "text-slate-500")}>
                  {fmtPct(p, 0)}
                </span>
                <span className="w-24 shrink-0 text-right font-mono text-xs text-slate-300">
                  지수 {c >= 0 ? "+" : ""}
                  {c.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setPct({})}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↺ 초기화
        </button>
        <span className="text-xs text-slate-500">삼성전자 비중 {(maxWeight * 100).toFixed(1)}% · 최하위 {(stocks[stocks.length - 1].weight * 100).toFixed(1)}%</span>
      </div>

      {/* 통찰 콜아웃 */}
      {anyChanged ? (
        <div className="mt-3 rounded-xl border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-4 py-3 text-sm">
          <p className="text-slate-200">
            지금 지수는 기준 대비 <b className={changePct >= 0 ? "text-rose-200" : "text-sky-200"}>{fmtPct(changePct, 2)}</b>{" "}
            움직였어요.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            💡 같은 주가 변동률이라도 <b className="text-emerald-200">비중(시가총액 몫)</b>이 큰 기업이 지수를 더 크게
            바꿉니다. 삼성전자를 +10% 했을 때와 현대모비스를 +10% 했을 때의 ‘지수’ 값을 비교해 보세요.
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
          🎯 <b className="text-slate-200">실험</b>: 삼성전자만 +10% → 지수 변화를 기억하고, 초기화 후 현대모비스만 +10% →
          두 결과를 비교해 보세요. 왜 이렇게 차이가 날까요?
        </div>
      )}
    </div>
  );
}
