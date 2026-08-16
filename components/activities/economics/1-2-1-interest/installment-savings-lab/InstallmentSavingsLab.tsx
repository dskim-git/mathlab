"use client";

import { useEffect, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  DATA_NOTE,
  PRESETS,
  PROBLEMS,
  UNIT,
  balanceAt,
  depositValue,
  maturity,
  totalPaid,
  type PeriodUnit,
  type Step,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "why_geometric",
    prompt:
      "정기 적금에서는 같은 금액을 넣어도 제1회 납입금과 마지막 회 납입금의 만기 금액이 달랐어요. 왜 그런지 그림(각 회차 화살표)을 떠올리며 설명하고, 그 합이 왜 등비수열의 합이 되는지도 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 먼저 넣은 돈일수록 이자가 붙는 기간이 길어서 a(1+r)ⁿ, a(1+r)ⁿ⁻¹, … 처럼 (1+r)씩 곱해진 꼴이 된다. 그래서 첫째항 a(1+r), 공비 (1+r)인 등비수열의 합이 된다.",
  },
  {
    id: "saving_vs_deposit",
    prompt:
      "문제 3에서 총 납입액도 같고 이율도 같은데 적금 이자가 예금 이자보다 훨씬 적었어요. 그 까닭을 설명하고, 그렇다면 적금과 예금은 각각 어떤 상황에 알맞은 상품인지 자신의 생각을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 적금은 나중에 넣은 돈일수록 이자를 받는 기간이 짧아 평균 예치 기간이 절반쯤이기 때문이다. 목돈이 이미 있으면 예금, 목돈을 만들어 가는 중이면 적금이 알맞다.",
  },
  {
    id: "plan",
    prompt:
      "시뮬레이터에서 적립액·이율·기간을 바꿔 보며, 만기 금액을 크게 만드는 데 가장 효과가 컸던 것은 무엇이었나요? 내가 3년 뒤 이루고 싶은 목표를 하나 정하고 어떤 계획으로 모을지 계산해 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 이율보다 매월 적립액과 기간을 늘리는 것이 훨씬 효과가 컸다. 나는 3년 뒤 200만원을 모으기 위해 매월 초 5만 3천 원씩 넣을 계획이다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function won(v: number): string { return Math.round(v).toLocaleString("ko-KR") + "원"; }
function man(v: number, d = 1): string {
  return (v / 10000).toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "만원";
}
function pctText(v: number): string {
  return (Number.isInteger(v) ? v.toString() : v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")) + "%";
}
function sup(k: number): string {
  if (k === 1) return "";
  const map: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  return String(k).split("").map((c) => map[c] ?? c).join("");
}

// ═════════════════════════════════════════════════════════
//  회차별 납입금 다이어그램 (교과서 그림 재현)
// ═════════════════════════════════════════════════════════
function DepositTimeline({ a, ratePct, unit, n, active, onPick, reveal }: {
  a: number; ratePct: number; unit: PeriodUnit; n: number;
  active?: number | null;                 // 강조할 회차(1..n)
  onPick?: (k: number | null) => void;    // 회차 클릭
  reveal?: number;                        // 애니메이션: 여기까지의 회차만 표시
}) {
  const u = UNIT[unit];
  const r = ratePct / 100;
  // 표시할 회차 — 많으면 1,2,3 … n
  const rows: (number | "gap")[] = n <= 5 ? Array.from({ length: n }, (_, i) => i + 1) : [1, 2, 3, "gap", n];
  const shown = rows.length;
  const W = 340, LEFT = 52, RIGHT = 250, TOP = 28, ROW = 20;
  const H = TOP + shown * ROW + 12;
  // 기간이 길어도 눈금 글씨가 겹치지 않도록, 교과서 그림처럼 가운데를 ⋯로 줄인 개요식 축을 쓴다.
  const cols: (number | "gap")[] = n <= 6 ? Array.from({ length: n + 1 }, (_, i) => i) : [0, 1, 2, 3, "gap", n - 1, n];
  const slotX = (idx: number) => LEFT + (idx / Math.max(cols.length - 1, 1)) * (RIGHT - LEFT);
  const X = (t: number) => {
    const idx = cols.indexOf(t);
    return idx >= 0 ? slotX(idx) : slotX(cols.length - 1);
  };
  const ticks = cols.filter((c): c is number => c !== "gap");
  const gapIdx = cols.indexOf("gap");
  const labelOf = (i: number) => (i === 0 ? "첫 " + (unit === "month" ? "달" : "해") : `${i}${u.period} 후`);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[340px]" role="img"
        aria-label="회차별 납입금이 만기까지 자라는 그림">
        {/* 시간 축 (가운데를 줄인 구간은 끊어 그린다) */}
        {gapIdx >= 0 ? (
          <>
            <line x1={LEFT} x2={slotX(gapIdx) - 7} y1={TOP - 8} y2={TOP - 8} stroke="#f472b6" strokeWidth={1.6} />
            <line x1={slotX(gapIdx) + 7} x2={RIGHT} y1={TOP - 8} y2={TOP - 8} stroke="#f472b6" strokeWidth={1.6} />
          </>
        ) : (
          <line x1={LEFT} x2={RIGHT} y1={TOP - 8} y2={TOP - 8} stroke="#f472b6" strokeWidth={1.6} />
        )}
        {ticks.map((i) => (
          <g key={i}>
            <line x1={X(i)} x2={X(i)} y1={TOP - 11} y2={TOP - 5} stroke="#f472b6" strokeWidth={0.8} />
            <text x={X(i)} y={TOP - 14} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 5.5 }}>{labelOf(i)}</text>
          </g>
        ))}
        {gapIdx >= 0 ? (
          <text x={slotX(gapIdx)} y={TOP - 5.5} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 7 }}>⋯</text>
        ) : null}
        {/* 만기 세로선 */}
        <line x1={X(n)} x2={X(n)} y1={TOP - 12} y2={H - 8} stroke="rgba(255,255,255,0.35)" strokeWidth={0.7} />

        {rows.map((row, ri) => {
          const y = TOP + ri * ROW + 6;
          if (row === "gap") {
            return (
              <g key="gap">
                <text x={LEFT - 8} y={y + 2} textAnchor="end" className="fill-slate-500" style={{ fontSize: 6 }}>⋮</text>
                <text x={(LEFT + RIGHT) / 2} y={y + 2} textAnchor="middle" className="fill-slate-600" style={{ fontSize: 6 }}>⋱</text>
                <text x={RIGHT + 8} y={y + 2} className="fill-slate-500" style={{ fontSize: 6 }}>⋮</text>
              </g>
            );
          }
          const k = row;
          const start = X(k - 1);
          const on = active === k;
          const dim = reveal !== undefined && k > reveal;
          const stroke = on ? "#fde68a" : "#34d399";
          const exp = n - k + 1;
          return (
            <g key={k} opacity={dim ? 0.12 : 1} style={{ cursor: onPick ? "pointer" : "default" }}
              onClick={() => onPick?.(on ? null : k)}>
              <rect x={0} y={y - 8} width={W} height={ROW - 2} fill={on ? "rgba(253,224,71,0.10)" : "transparent"} />
              <text x={LEFT - 10} y={y + 2} textAnchor="end" className={on ? "fill-amber-200" : "fill-slate-300"} style={{ fontSize: 6 }}>
                제{k}회
              </text>
              <text x={start - 1} y={y - 3} textAnchor="end" className={on ? "fill-amber-100" : "fill-slate-400"} style={{ fontSize: 5.5 }}>
                {(a / 10000).toLocaleString("ko-KR")}만원
              </text>
              {/* 화살표 */}
              <line x1={start} x2={X(n) - 3} y1={y} y2={y} stroke={stroke} strokeWidth={on ? 1.8 : 1.2} />
              <line x1={start} x2={start} y1={y - 4} y2={y + 4} stroke={stroke} strokeWidth={on ? 1.8 : 1.2} />
              <polygon points={`${X(n)},${y} ${X(n) - 5},${y - 2.6} ${X(n) - 5},${y + 2.6}`} fill={stroke} />
              {ticks.filter((t) => t > k - 1 && t < n).map((t) => (
                <line key={t} x1={X(t)} x2={X(t)} y1={y - 2.5} y2={y + 2.5} stroke={stroke} strokeWidth={0.6} opacity={0.7} />
              ))}
              <text x={X(n) + 5} y={y + 2} className={on ? "fill-amber-200" : "fill-slate-300"} style={{ fontSize: 6 }}>
                a(1+r){exp === 1 ? "" : sup(exp)}
              </text>
              {on ? (
                <text x={X(n) + 5} y={y + 9} className="fill-amber-100" style={{ fontSize: 5 }}>
                  = {Math.round(depositValue(a, r, n, k)).toLocaleString("ko-KR")}원
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {onPick ? <p className="mt-1 text-center text-[11px] text-slate-500">화살표를 누르면 그 회차의 만기 금액을 볼 수 있어요</p> : null}
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "sim" | "problem";

export default function InstallmentSavingsLab() {
  const [tab, setTab] = useState<Tab>("sim");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🐷 정기 적금의 원리합계</h3>
        <p className="mt-2 leading-7 text-slate-300">
          정기 적금은 <b className="text-emerald-200">매 기간마다 일정 금액을 적립</b>해 약정 기간 후에 적립 총액과 이자를 받는
          상품이에요. 넣는 시점이 다르니 각 납입금이 이자를 받는 기간도 다르죠. 회차별로 얼마씩 자라는지 그림으로 보고,
          등비수열의 합으로 한 번에 계산해 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "sim"} onClick={() => setTab("sim")}>① 적금 시뮬레이터</TabButton>
        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>② 단계별 문제</TabButton>
      </div>

      <div className="mt-4">{tab === "sim" ? <SimTab /> : <ProblemTab />}</div>

      <p className="mt-4 text-xs leading-5 text-slate-500">📌 {DATA_NOTE}</p>

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
// 탭 ① 적금 시뮬레이터 (emerald)
// ══════════════════════════════════════════════════════════════
function SimTab() {
  const [a, setA] = useState(200_000);
  const [ratePct, setRatePct] = useState(0.5);
  const [unit, setUnit] = useState<PeriodUnit>("month");
  const [n, setN] = useState(24);
  const [pick, setPick] = useState<number | null>(1);
  const [reveal, setReveal] = useState<number | undefined>(undefined);

  const r = ratePct / 100;
  const u = UNIT[unit];
  const S = maturity(a, r, n);
  const paid = totalPaid(a, n);
  const interest = S - paid;

  useEffect(() => {
    if (reveal === undefined) return;
    if (reveal >= n) return;
    const id = setTimeout(() => setReveal((v) => (v === undefined ? undefined : v + 1)), 260);
    return () => clearTimeout(id);
  }, [reveal, n]);

  function pickUnit(next: PeriodUnit) {
    setUnit(next);
    if (next === "month") { setRatePct(0.5); setN(24); setA(200_000); }
    else { setRatePct(4); setN(10); setA(1_000_000); }
    setPick(1);
  }

  // 잔액 추이
  const bal = Array.from({ length: n + 1 }, (_, i) => balanceAt(a, r, i));
  const paidLine = Array.from({ length: n + 1 }, (_, i) => a * i);

  return (
    <div className="space-y-4">
      {/* 설정 */}
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🎛️ 적금 조건을 정해 보세요</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" title={p.note}
              onClick={() => { setA(p.a); setRatePct(p.ratePct); setUnit(p.unit); setN(p.n); setPick(1); }}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10">
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="self-center text-xs font-bold text-slate-400">적립 주기</span>
          {(["month", "year"] as PeriodUnit[]).map((x) => (
            <button key={x} type="button" onClick={() => pickUnit(x)}
              className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (unit === x ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
              {UNIT[x].every} 초 납입
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Slider id="ia" label={`${u.every} 적립액 a`} value={won(a)}
            min={unit === "month" ? 10_000 : 100_000} max={unit === "month" ? 1_000_000 : 5_000_000}
            step={unit === "month" ? 10_000 : 100_000} v={a} onChange={setA} />
          <Slider id="ir" label={`이율 r (${u.rate})`} value={pctText(ratePct)}
            min={unit === "month" ? 0.1 : 1} max={unit === "month" ? 2 : 10} step={unit === "month" ? 0.1 : 0.5}
            v={ratePct} onChange={setRatePct} />
          <Slider id="in" label="기간 n" value={`${n}${u.period}`} min={2} max={unit === "month" ? 60 : 30} step={1}
            v={n} onChange={(v) => { setN(v); if (pick && pick > v) setPick(v); }} />
        </div>
      </div>

      {/* 다이어그램 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧭 회차별 납입금은 만기에 얼마가 될까?</p>
          <button type="button" onClick={() => setReveal(0)}
            className="rounded-lg border-2 border-emerald-400/55 bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/25">
            ▶ 회차별로 쌓아 보기
          </button>
        </div>
        <p className="mt-1 text-xs leading-6 text-slate-300">
          {u.every} 초에 <b className="text-emerald-100">{won(a)}</b>씩 넣으면, 제k회 납입금은 만기까지{" "}
          <b className="text-emerald-100">(n − k + 1){u.period}</b> 동안 이자가 붙어 <b className="font-mono text-emerald-100">a(1+r)<sup>n−k+1</sup></b>이 돼요.
        </p>
        <div className="mt-2">
          <DepositTimeline a={a} ratePct={ratePct} unit={unit} n={n} active={pick} onPick={setPick} reveal={reveal} />
        </div>

        {pick ? (
          <div className="mt-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-2.5 text-center">
            <p className="text-xs font-bold text-amber-200">제{pick}회 납입금 {won(a)}</p>
            <p className="mt-0.5 font-mono text-sm text-slate-200">
              a(1+r)<sup>{n - pick + 1}</sup> = {won(a)} × {(1 + r).toFixed(4)}<sup>{n - pick + 1}</sup> ={" "}
              <b className="text-amber-100">{won(depositValue(a, r, n, pick))}</b>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              이자가 붙는 기간 {n - pick + 1}{u.period} · 이자 {won(depositValue(a, r, n, pick) - a)}
            </p>
          </div>
        ) : null}
      </div>

      {/* 공식 유도 */}
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <p className="text-sm font-bold text-sky-200">➕ 모두 더하면 — 등비수열의 합</p>
        <div className="mt-2 space-y-1 overflow-x-auto rounded-lg bg-black/25 px-3 py-2 font-mono text-xs leading-6 text-slate-200">
          <p>S = a(1+r) + a(1+r)² + ⋯ + a(1+r)<sup>{n}</sup></p>
          <p className="text-slate-400">첫째항 a(1+r), 공비 (1+r), 항수 {n}인 등비수열의 합</p>
          <p className="text-sky-200">S = a(1+r){"{"}(1+r)<sup>n</sup> − 1{"}"} ÷ r</p>
          <p>
            = {won(a)} × {(1 + r).toFixed(4)} × ({Math.pow(1 + r, n).toFixed(6)} − 1) ÷ {r}
          </p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Big label="총 납입액" value={won(paid)} sub={`${won(a)} × ${n}${u.period}`} tone="slate" />
          <Big label="이자" value={won(interest)} sub={`납입액의 ${((interest / paid) * 100).toFixed(2)}%`} tone="amber" />
          <Big label={`${n}${u.period} 뒤 원리합계 S`} value={won(S)} sub={man(S)} tone="emerald" />
        </div>
      </div>

      {/* 잔액 그래프 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📈 쌓여 가는 잔액</p>
        <BalanceChart bal={bal} paid={paidLine} n={n} periodLabel={u.period} />
        <p className="mt-1 text-xs leading-5 text-slate-400">
          회색 선은 <b className="text-slate-200">넣은 돈(원금)</b>, 초록 선은 <b className="text-emerald-200">원리합계</b>예요.
          시간이 갈수록 두 선 사이(= 이자)가 점점 넓어져요.
        </p>
      </div>

      {/* 회차별 표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📋 회차별 자세히 보기</p>
        <div className="mt-2 max-h-72 overflow-auto rounded-xl border border-white/5">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="sticky top-0 bg-slate-900">
              <tr className="text-slate-300">
                <th className="px-2 py-1.5 text-left font-semibold">회차</th>
                <th className="px-2 py-1.5 text-right font-semibold">납입 시점</th>
                <th className="px-2 py-1.5 text-right font-semibold">이자 붙는 기간</th>
                <th className="px-2 py-1.5 text-right font-semibold">식</th>
                <th className="px-2 py-1.5 text-right font-semibold">만기 금액</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n }, (_, i) => i + 1).map((k) => (
                <tr key={k} className={"border-t border-white/5 " + (pick === k ? "bg-amber-400/15" : "")}
                  onClick={() => setPick(pick === k ? null : k)}>
                  <td className="px-2 py-1 text-slate-200">제{k}회</td>
                  <td className="px-2 py-1 text-right text-xs text-slate-400">{k === 1 ? `첫 ${unit === "month" ? "달" : "해"}` : `${k - 1}${u.period} 후`}</td>
                  <td className="px-2 py-1 text-right font-mono text-xs text-slate-400">{n - k + 1}{u.period}</td>
                  <td className="px-2 py-1 text-right font-mono text-[11px] text-slate-500">a(1+r){n - k + 1 === 1 ? "" : sup(n - k + 1)}</td>
                  <td className="px-2 py-1 text-right font-mono text-sm font-bold text-emerald-200">{won(depositValue(a, r, n, k))}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-emerald-400/40 bg-emerald-400/10">
                <td className="px-2 py-1.5 font-bold text-emerald-100" colSpan={4}>합계 S</td>
                <td className="px-2 py-1.5 text-right font-mono text-base font-bold text-emerald-100">{won(S)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BalanceChart({ bal, paid, n, periodLabel }: { bal: number[]; paid: number[]; n: number; periodLabel: string }) {
  const W = 340, H = 170, PL = 46, PR = 10, PT = 12, PB = 22;
  const yMax = Math.max(...bal) * 1.06 || 1;
  const X = (i: number) => PL + (i / Math.max(n, 1)) * (W - PL - PR);
  const Y = (v: number) => H - PB - (v / yMax) * (H - PT - PB);
  const pts = (vals: number[]) => vals.map((v, i) => `${X(i)},${Y(v)}`).join(" ");
  const back = (vals: number[]) => vals.map((v, i) => ({ v, i })).reverse().map(({ v, i }) => `${X(i)},${Y(v)}`).join(" ");
  return (
    <div className="mt-2 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[340px]" role="img" aria-label="적금 잔액 그래프">
        <rect x={0} y={0} width={W} height={H} fill="#0b1220" rx={8} />
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={Y(yMax * t)} y2={Y(yMax * t)} stroke="rgba(255,255,255,0.08)" strokeWidth={0.6} />
            <text x={PL - 4} y={Y(yMax * t) + 3} textAnchor="end" className="fill-slate-500" style={{ fontSize: 6 }}>
              {Math.round((yMax * t) / 10000).toLocaleString("ko-KR")}만
            </text>
          </g>
        ))}
        <polygon points={`${pts(paid)} ${back(bal)}`} fill="rgba(52,211,153,0.18)" />
        <polyline points={pts(paid)} fill="none" stroke="#94a3b8" strokeWidth={1.4} strokeDasharray="4 2" />
        <polyline points={pts(bal)} fill="none" stroke="#34d399" strokeWidth={2} />
        <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="rgba(255,255,255,0.2)" strokeWidth={0.8} />
        {[0, Math.round(n / 2), n].map((i, idx) => (
          <text key={idx} x={X(i)} y={H - PB + 10} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 6 }}>{i}{periodLabel}</text>
        ))}
      </svg>
    </div>
  );
}

function Slider({ id, label, value, min, max, step, v, onChange }: {
  id: string; label: string; value: string; min: number; max: number; step: number; v: number; onChange: (n: number) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
      <label htmlFor={id} className="text-xs font-bold text-slate-300">{label}: <span className="font-mono text-emerald-200">{value}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40" />
    </div>
  );
}

const BIG_TONE: Record<string, string> = {
  slate: "border-white/15 bg-white/5 text-slate-200",
  amber: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  emerald: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
};

function Big({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className={"rounded-xl border px-4 py-3 text-center " + BIG_TONE[tone]}>
      <p className="text-xs font-bold opacity-80">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold">{value}</p>
      {sub ? <p className="mt-0.5 font-mono text-[10px] text-slate-400">{sub}</p> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 단계별 문제 (violet)
// ══════════════════════════════════════════════════════════════
type StepState = { text: string; ok: boolean; tries: number; hint: boolean; shown: boolean };
const DEFAULT_STEP: StepState = { text: "", ok: false, tries: 0, hint: false, shown: false };

function ProblemTab() {
  const [pIdx, setPIdx] = useState(0);
  const [state, setState] = useState<Record<string, StepState>>({});
  const [pick, setPick] = useState<number | null>(1);

  const prob = PROBLEMS[pIdx];
  const doneCount = PROBLEMS.filter((p) => p.steps.every((s) => state[s.id]?.ok)).length;

  function get(id: string) { return state[id] ?? DEFAULT_STEP; }
  function update(id: string, patch: Partial<StepState>) {
    setState((p) => ({ ...p, [id]: { ...(p[id] ?? DEFAULT_STEP), ...patch } }));
  }
  function check(step: Step, override?: string) {
    setState((p) => {
      const cur = p[step.id] ?? DEFAULT_STEP;
      const text = override ?? cur.text;
      const ok =
        step.kind === "number"
          ? (() => {
              const v = Number(text.replace(/[,\s원년만개월]/g, ""));
              return Number.isFinite(v) && text.trim() !== "" && Math.abs(v - step.answer) <= (step.tol ?? 0.5);
            })()
          : text !== "" && Number(text) === step.answer;
      return { ...p, [step.id]: { ...cur, text, ok, tries: cur.tries + 1 } };
    });
  }

  const firstOpen = prob.steps.findIndex((s) => !get(s.id).ok);
  const probDone = firstOpen === -1;
  const st = prob.setup;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🧩 정기 적금 단계별 문제</p>
          <span className="font-mono text-xs text-slate-300">완료 {doneCount} / {PROBLEMS.length}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PROBLEMS.map((p, i) => {
            const done = p.steps.every((s) => state[s.id]?.ok);
            return (
              <button key={p.id} type="button" onClick={() => { setPIdx(i); setPick(1); }}
                className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (pIdx === i ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : done ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
                {done ? "✅ " : ""}{p.emoji} {p.title.replace("문제 ", "").replace(" · ", ". ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* 문제 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-base font-bold text-slate-100">{prob.emoji} {prob.title}</p>
        <p className="mt-1.5 text-sm leading-7 text-slate-300">{prob.scenario}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {prob.given.map((g) => (
            <div key={g.label} className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] px-3 py-2">
              <p className="text-[11px] text-slate-400">{g.label}</p>
              <p className="mt-0.5 text-sm font-bold text-sky-100">{g.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 그림 — 문제를 푸는 동안 항상 보임 */}
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🧭 이 문제의 그림</p>
        <p className="mt-1 text-xs leading-6 text-slate-300">
          {UNIT[st.unit].every} 초에 <b className="text-emerald-100">{won(st.a)}</b>씩 {st.n}{UNIT[st.unit].period} 동안 —
          각 회차가 만기까지 이자를 받는 기간이 다르다는 점에 주목하세요.
        </p>
        <div className="mt-2">
          <DepositTimeline a={st.a} ratePct={st.ratePct} unit={st.unit} n={st.n} active={pick} onPick={setPick} />
        </div>
        <div className="mt-1 rounded-lg bg-black/25 px-3 py-2 text-center font-mono text-xs text-slate-200">
          S = a(1+r){"{"}(1+r)<sup>n</sup> − 1{"}"} ÷ r
        </div>
        <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
          ※ 문제에서 주어진 어림값(1.005²⁴ = 1.127 등)으로 계산하므로, 정확한 거듭제곱으로 계산하는 탭①의 값과 몇천 원 정도 다를 수 있어요.
        </p>
      </div>

      {/* 단계 */}
      <div className="space-y-2">
        {prob.steps.map((step, i) => {
          const ss = get(step.id);
          const locked = i > (firstOpen === -1 ? prob.steps.length - 1 : firstOpen);
          return (
            <div key={step.id}
              className={"rounded-2xl border p-4 transition " + (ss.ok ? "border-emerald-400/40 bg-emerald-400/[0.07]" : locked ? "border-white/5 bg-slate-900/20 opacity-50" : "border-violet-400/35 bg-violet-400/[0.06]")}>
              <div className="flex items-start gap-2">
                <span className={"mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold " + (ss.ok ? "bg-emerald-400/25 text-emerald-100" : "bg-white/10 text-slate-300")}>
                  {ss.ok ? "✓" : i + 1}
                </span>
                <p className="text-sm font-bold leading-6 text-slate-100">{step.ask}</p>
              </div>
              {locked ? (
                <p className="mt-2 pl-8 text-xs text-slate-500">앞 단계를 먼저 풀어 주세요 🔒</p>
              ) : (
                <div className="mt-2 pl-8">
                  {step.kind === "number" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="text" inputMode="decimal" aria-label={step.ask} value={ss.text} disabled={ss.ok}
                        onChange={(e) => update(step.id, { text: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") check(step); }}
                        placeholder="숫자만 입력"
                        className="w-44 rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-right font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 disabled:opacity-60" />
                      <span className="text-sm text-slate-300">{step.suffix}</span>
                      {!ss.ok ? (
                        <button type="button" onClick={() => check(step)}
                          className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25">확인</button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {step.options.map((opt, oi) => {
                        const chosen = ss.text === String(oi);
                        const right = ss.ok && oi === step.answer;
                        const wrong = chosen && !ss.ok;
                        return (
                          <button key={oi} type="button" disabled={ss.ok} onClick={() => check(step, String(oi))}
                            className={"rounded-lg border-2 px-3 py-2 text-left text-xs font-bold transition disabled:opacity-80 " + (right ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100" : wrong ? "border-rose-400/60 bg-rose-400/15 text-rose-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {ss.ok ? (
                    <p className="mt-2 rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-1.5 text-xs leading-5 text-emerald-100">정답이에요! ✅ {step.explain}</p>
                  ) : ss.tries > 0 ? (
                    <p className="mt-2 rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-1.5 text-xs leading-5 text-amber-100">
                      아직 아니에요. {ss.tries >= 2 ? "힌트를 열어 보세요." : "그림을 보며 다시 계산해 볼까요?"}
                    </p>
                  ) : null}

                  {!ss.ok ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => update(step.id, { hint: !ss.hint })}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10">
                        💡 힌트 {ss.hint ? "닫기" : "보기"}
                      </button>
                      {ss.tries >= 3 ? (
                        <button type="button" onClick={() => update(step.id, { shown: true })}
                          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-400 transition hover:bg-white/10">정답 보기</button>
                      ) : null}
                      {ss.hint ? <span className="rounded-lg bg-black/25 px-2.5 py-1 font-mono text-[11px] text-slate-300">{step.hint}</span> : null}
                      {ss.shown ? (
                        <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">
                          정답:{" "}
                          <b className="font-mono text-emerald-200">
                            {step.kind === "number" ? step.answer.toLocaleString("ko-KR") + step.suffix : step.options[step.answer]}
                          </b>{" "}
                          — {step.explain}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {probDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🎉 문제 해결!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">{prob.wrapUp}</p>
          {pIdx < PROBLEMS.length - 1 ? (
            <button type="button" onClick={() => { setPIdx(pIdx + 1); setPick(1); }}
              className="mt-3 rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25">
              다음 문제로 →
            </button>
          ) : doneCount === PROBLEMS.length ? (
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 네 문제를 모두 해결했어요! 정기 적금 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
