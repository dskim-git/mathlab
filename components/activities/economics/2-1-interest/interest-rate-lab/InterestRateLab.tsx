"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CASES,
  CASE_GROUPS,
  DATA_NOTE,
  GROUP_TONE,
  INTEREST_TAX,
  PRESETS,
  SPLIT_ROWS,
  UNITS,
  compoundConvert,
  compoundInterest,
  effectiveAnnual,
  growth,
  nominalAnnual,
  ruleOf72,
  savingsInterest,
  simpleConvert,
  simpleInterest,
  unitOf,
  type CaseGroup,
  type RateCase,
  type UnitKey,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "simple_vs_compound",
    prompt:
      "월이율 1%를 연이율로 바꾸면 단리로는 12%, 복리로는 12.68%가 됐어요. 두 값이 왜 다른지 설명하고, 돈을 빌려주는 쪽과 빌리는 쪽 중 누가 어느 방식을 더 좋아할지 이유와 함께 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 복리는 붙은 이자에 다시 이자가 붙어서 단리보다 커진다. 빌려주는 쪽은 복리를, 빌리는 쪽은 단리를 더 좋아할 것이다.",
  },
  {
    id: "converge_e",
    prompt:
      "연이율을 그대로 두고 이자를 계산하는 횟수를 연 1회 → 월 → 일 → 초로 늘려 보았을 때 원리합계가 어떻게 변했나요? 끝없이 쪼개면 무한히 커질 것 같은데 실제로는 어떤 값에 가까워졌는지, 관찰한 것을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 쪼갤수록 커지긴 했지만 조금씩 늘다가 어떤 값(연속복리, e를 쓴 값)에 가까워져 멈췄다. 무한히 커지지는 않았다.",
  },
  {
    id: "around_us",
    prompt:
      "탭②의 사례 중 가장 놀랐던 이율 두 가지를 고르고, 왜 그런 차이가 생기는지(예: 담보가 있는지, 얼마나 급한지, 나라가 돕는 것인지) 자기 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 학자금대출 1.7%와 카드 현금서비스 17.5%가 10배나 차이 나서 놀랐다. 나라가 학생을 돕는 대출과, 급하게 담보 없이 빌리는 돈은 이자가 다를 수밖에 없는 것 같다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function won(v: number): string {
  return Math.round(v).toLocaleString("ko-KR") + "원";
}
function num(v: number): string {
  return Math.round(v).toLocaleString("ko-KR");
}
/** 아주 작은 이율도 읽을 수 있게 유효숫자를 맞춰 % 로 표기 */
function fmtPct(x: number): string {
  const p = x * 100;
  if (p === 0) return "0%";
  const abs = Math.abs(p);
  let d = 4;
  if (abs < 1) d = Math.min(14, Math.ceil(-Math.log10(abs)) + 4);
  let s = p.toFixed(d);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s + "%";
}
/** 입력창에 넣을 숫자(퍼센트 단위) */
function toInput(x: number): string {
  const p = x * 100;
  if (p === 0) return "0";
  const abs = Math.abs(p);
  const d = abs < 1 ? Math.min(14, Math.ceil(-Math.log10(abs)) + 5) : 6;
  let s = p.toFixed(d);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "convert" | "cases";

export default function InterestRateLab() {
  const [tab, setTab] = useState<Tab>("convert");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">⏳ 여러 가지 이율</h3>
        <p className="mt-2 leading-7 text-slate-300">
          같은 이자라도 <b className="text-emerald-200">연·반기·분기·월·일·시·분·초</b> 중 어떤 단위로 말하느냐에 따라
          숫자가 완전히 달라 보여요. 하나를 입력하면 나머지가 모두 바뀌는 변환기로 비교해 보고, 우리 주변에서 만나는
          이율의 실제 사례도 살펴봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "convert"} onClick={() => setTab("convert")}>① 이율 변환기</TabButton>
        <TabButton active={tab === "cases"} onClick={() => setTab("cases")}>② 우리 주변의 이율</TabButton>
      </div>

      <div className="mt-4">{tab === "convert" ? <ConvertTab /> : <CasesTab />}</div>

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
// 탭 ① 이율 변환기 (sky)
// ══════════════════════════════════════════════════════════════
const P0 = 1_000_000; // 원금 100만원

function ConvertTab() {
  const [refUnit, setRefUnit] = useState<UnitKey>("year");
  const [refValue, setRefValue] = useState(0.05); // 소수(5% → 0.05)
  const [draft, setDraft] = useState<{ unit: UnitKey; text: string } | null>(null);

  const from = unitOf(refUnit);
  const nominal = nominalAnnual(refValue, from);
  const effective = effectiveAnnual(refValue, from);

  function setFrom(unit: UnitKey, value: number) {
    setRefUnit(unit);
    setRefValue(value);
  }
  function onEdit(unit: UnitKey, text: string) {
    setDraft({ unit, text });
    const n = Number(text.replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 0) setFrom(unit, n / 100);
  }

  // 슬라이더는 연 명목이율(%)로 조절하되 기준 단위는 유지
  const annualPct = nominal * 100;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <p className="text-sm font-bold text-sky-200">🔄 하나만 입력하면 나머지가 모두 바뀌어요</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          아래 표의 <b className="text-sky-100">파란 칸 아무 곳</b>에나 이율을 써 보세요. 같은 이자를 다른 기간 단위로
          말하면 어떤 숫자가 되는지 한눈에 볼 수 있어요.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => { setDraft(null); setFrom(p.unit, p.value); }} title={p.hint}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10">
              {p.label}
            </button>
          ))}
        </div>
        <label htmlFor="annual" className="mt-3 block text-xs font-bold text-slate-300">
          연이율(단리 기준)로 빠르게 조절: <span className="font-mono text-sky-200">{fmtPct(nominal)}</span>
        </label>
        <input id="annual" type="range" min={0} max={100} step={0.1} value={Math.min(100, annualPct)}
          onChange={(e) => { setDraft(null); setFrom(refUnit, Number(e.target.value) / 100 / from.perYear); }}
          className="mt-2 w-full accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />
      </div>

      {/* 변환표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📊 이율 변환표</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="py-1.5 text-left font-semibold">단위</th>
                <th className="py-1.5 text-left font-semibold">1년에 몇 번</th>
                <th className="py-1.5 text-right font-semibold text-sky-300">단리(비례) 환산</th>
                <th className="py-1.5 text-right font-semibold text-emerald-300">복리(실효) 환산</th>
              </tr>
            </thead>
            <tbody>
              {UNITS.map((u) => {
                const isRef = u.key === refUnit;
                const s = simpleConvert(refValue, from, u);
                const c = compoundConvert(refValue, from, u);
                return (
                  <tr key={u.key} className={"border-t border-white/5 " + (isRef ? "bg-sky-400/10" : "")}>
                    <td className="py-1.5">
                      <span className={"font-bold " + (isRef ? "text-sky-100" : "text-slate-200")}>{u.emoji} {u.label}</span>
                      {isRef ? <span className="ml-1.5 rounded bg-sky-400/25 px-1.5 py-0.5 text-[10px] font-bold text-sky-100">입력</span> : null}
                    </td>
                    <td className="py-1.5 text-xs text-slate-400">{u.per}</td>
                    <td className="py-1.5 text-right">
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label={`${u.label} (단리 환산)`}
                        value={draft?.unit === u.key ? draft.text : toInput(s)}
                        onChange={(e) => onEdit(u.key, e.target.value)}
                        onFocus={() => setDraft({ unit: u.key, text: toInput(s) })}
                        onBlur={() => setDraft(null)}
                        className="w-40 rounded-lg border border-sky-400/30 bg-slate-950 px-2 py-1 text-right font-mono text-xs text-sky-100 outline-none transition focus:border-sky-300 focus-visible:ring-2 focus-visible:ring-sky-300/40"
                      />
                      <span className="ml-1 text-xs text-slate-400">%</span>
                    </td>
                    <td className="py-1.5 text-right font-mono text-xs text-emerald-200">{fmtPct(c)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-4 text-slate-500">
          ※ <b className="text-sky-300">단리(비례)</b>: 이율을 기간 수로 그냥 나누고 곱해요 (월이율 = 연이율 ÷ 12).{" "}
          <b className="text-emerald-300">복리(실효)</b>: 이자에 다시 이자가 붙는 것까지 생각해 (1+월이율)<sup>12</sup> = 1+연이율 이 되도록 맞춰요.
        </p>
      </div>

      {/* 두 해석 비교 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-sky-400/35 bg-sky-400/[0.08] p-4">
          <p className="text-sm font-bold text-sky-200">단리로 보면 (명목 연이율)</p>
          <p className="mt-1 font-mono text-2xl font-bold text-sky-100">{fmtPct(nominal)}</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            {fmtPct(refValue)} × {num(from.perYear)}번 = {fmtPct(nominal)}
          </p>
          <p className="mt-2 rounded-lg bg-black/25 px-2.5 py-2 text-sm text-slate-200">
            100만원 → 1년 뒤 <b className="font-mono text-sky-100">{won(P0 * (1 + nominal))}</b>
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-400/35 bg-emerald-400/[0.08] p-4">
          <p className="text-sm font-bold text-emerald-200">복리로 보면 (실효 연이율)</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-100">{fmtPct(effective)}</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            (1 + {fmtPct(refValue)})<sup>{num(from.perYear)}</sup> − 1 = {fmtPct(effective)}
          </p>
          <p className="mt-2 rounded-lg bg-black/25 px-2.5 py-2 text-sm text-slate-200">
            100만원 → 1년 뒤 <b className="font-mono text-emerald-100">{won(P0 * (1 + effective))}</b>
          </p>
        </div>
      </div>
      {effective - nominal > 1e-9 ? (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-2 text-center text-sm text-amber-100">
          같은 이율인데 복리로 계산하면 1년에 <b className="font-mono">{won(P0 * (effective - nominal))}</b>을 더 받아요
          (실효 − 명목 = {fmtPct(effective - nominal)})
        </p>
      ) : null}

      <SplitSection r={nominal} />
    </div>
  );
}

// ─── 쪼갤수록 이자가 늘어날까? ────────────────────────────────
function SplitSection({ r }: { r: number }) {
  const cont = Math.exp(r);
  const rows = SPLIT_ROWS.map((s) => {
    const g = s.n == null ? cont : growth(r, s.n);
    return { ...s, g, amount: P0 * g, interest: P0 * (g - 1) };
  });
  const maxInterest = Math.max(...rows.map((x) => x.interest), 1);

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
      <p className="text-sm font-bold text-violet-200">🔬 이자 계산 횟수를 늘리면 무한히 커질까?</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">
        연이율 <b className="font-mono text-violet-100">{fmtPct(r)}</b>는 그대로 두고, 이자를 계산해 원금에 더하는 횟수만
        늘려 봤어요. 100만원이 1년 뒤 얼마가 될까요?
      </p>
      <div className="mt-3 space-y-1">
        {rows.map((x) => (
          <div key={x.key} className={"flex items-center gap-2 rounded-lg px-1.5 py-0.5 " + (x.n == null ? "bg-violet-400/10" : "")}>
            <span className={"w-44 shrink-0 truncate text-xs " + (x.n == null ? "font-bold text-violet-100" : "text-slate-300")}>{x.label}</span>
            <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-3 flex-1" aria-hidden="true">
              <rect width={100} height={8} rx={2} fill="rgba(255,255,255,0.06)" />
              <rect width={Math.max(0.6, (x.interest / maxInterest) * 100)} height={8} rx={2} fill={x.n == null ? "#c084fc" : "#818cf8"} />
            </svg>
            <span className="w-28 shrink-0 text-right font-mono text-xs text-slate-100">{won(x.amount)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-violet-400/30 bg-violet-400/[0.08] px-4 py-3">
        <p className="text-sm leading-6 text-slate-200">
          쪼갤수록 늘어나긴 하지만 <b className="text-violet-100">끝없이 커지지 않고 한 값에 가까워져요</b>. 그 값이 바로{" "}
          <span className="font-mono text-violet-100">100만원 × e<sup>{r.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}</sup></span> ={" "}
          <b className="font-mono text-violet-100">{won(P0 * cont)}</b>예요 (지수는 이율을 소수로 쓴 값이에요).
        </p>
        <p className="mt-1 font-mono text-xs text-slate-400">
          (1 + r/n)<sup>n</sup> → e<sup>r</sup> (n을 한없이 크게 할 때) · e = 2.718281828…
        </p>
        <p className="mt-1.5 text-xs leading-5 text-slate-400">
          연이율 100%로 바꿔 보세요 — 100만원이 1년마다 계산하면 200만원이지만, 쉬지 않고 계산하면{" "}
          <b className="text-violet-200">271만 8,282원(= 100만원 × e)</b>이 돼요.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 우리 주변의 이율 (amber)
// ══════════════════════════════════════════════════════════════
function CasesTab() {
  const [group, setGroup] = useState<CaseGroup | "전체">("전체");
  const [principal, setPrincipal] = useState(1_000_000);
  const [years, setYears] = useState(1);
  const [compound, setCompound] = useState(false);
  const [picked, setPicked] = useState<string | null>("deposit");

  const list = group === "전체" ? CASES : CASES.filter((c) => c.group === group);
  const sorted = [...list].sort((a, b) => a.rate - b.rate);
  const maxRate = Math.max(...list.map((c) => c.rate), 1);
  const sel = CASES.find((c) => c.id === picked) ?? null;

  function interestOf(c: RateCase): number {
    return compound ? compoundInterest(principal, c.rate, years) : simpleInterest(principal, c.rate, years);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">🔎 이율은 우리 주변 어디에나 있어요</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          돈을 <b className="text-sky-200">모을 때</b>는 이율이 높을수록 좋고, <b className="text-rose-200">빌릴 때</b>는
          낮을수록 좋아요. 금액과 기간을 바꿔 가며 같은 돈이 사례마다 얼마나 다른 이자를 만드는지 비교해 보세요.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <label htmlFor="p" className="text-xs font-bold text-slate-300">원금: <span className="font-mono text-amber-200">{won(principal)}</span></label>
            <input id="p" type="range" min={100_000} max={20_000_000} step={100_000} value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="mt-2 w-full accent-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40" />
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <label htmlFor="y" className="text-xs font-bold text-slate-300">기간: <span className="font-mono text-amber-200">{years}년</span></label>
            <input id="y" type="range" min={1} max={20} step={1} value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="mt-2 w-full accent-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40" />
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-xs font-bold text-slate-300">계산 방식</p>
            <div className="mt-2 flex gap-1.5">
              <button type="button" onClick={() => setCompound(false)}
                className={"flex-1 rounded-lg border px-2 py-1.5 text-xs font-bold transition " + (!compound ? "border-amber-400/60 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
                단리
              </button>
              <button type="button" onClick={() => setCompound(true)}
                className={"flex-1 rounded-lg border px-2 py-1.5 text-xs font-bold transition " + (compound ? "border-amber-400/60 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
                복리(연 1회)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 그룹 필터 */}
      <div className="flex flex-wrap gap-1.5">
        {(["전체", ...CASE_GROUPS] as (CaseGroup | "전체")[]).map((g) => (
          <button key={g} type="button" onClick={() => setGroup(g)}
            className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (group === g ? "border-amber-400/60 bg-amber-400/20 text-amber-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
            {g}
          </button>
        ))}
      </div>

      {/* 사례 카드 */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((c) => {
          const tone = GROUP_TONE[c.group];
          const on = picked === c.id;
          return (
            <button key={c.id} type="button" onClick={() => setPicked(on ? null : c.id)}
              className={"rounded-2xl border p-3 text-left transition " + (on ? "border-white/40 bg-white/[0.08]" : "border-white/10 bg-slate-900/40 hover:bg-white/5")}>
              <div className="flex items-start gap-2">
                <span className="text-2xl" aria-hidden="true">{c.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-100">{c.name}</p>
                  <span className={"mt-0.5 inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold " + tone.badge}>{c.group}</span>
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold" style={{ color: tone.color }}>연 {c.rate}%</span>
                {c.range ? <span className="font-mono text-[10px] text-slate-500">{c.range[0]}~{c.range[1]}%</span> : null}
              </div>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">{c.desc}</p>
              <div className="mt-2 rounded-lg bg-black/25 px-2 py-1.5">
                <p className="text-[11px] text-slate-400">{years}년 이자</p>
                <p className="font-mono text-sm font-bold text-slate-100">{won(interestOf(c))}</p>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                {c.fixed ? "🔒 법·제도로 정해진 값" : "📈 시장에 따라 변하는 값"}
              </p>
            </button>
          );
        })}
      </div>

      {/* 선택 사례 자세히 */}
      {sel ? (
        <div className="rounded-2xl border p-4" style={{ borderColor: GROUP_TONE[sel.group].color + "55", backgroundColor: GROUP_TONE[sel.group].color + "14" }}>
          <p className="text-base font-bold text-slate-100">{sel.emoji} {sel.name} — <span className="font-mono" style={{ color: GROUP_TONE[sel.group].color }}>연 {sel.rate}%</span></p>
          <p className="mt-1 text-sm leading-6 text-slate-200">{sel.detail}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Stat label={`${won(principal)}의 ${years}년 이자`} value={won(interestOf(sel))} />
            <Stat label={`${years}년 뒤 원리합계`} value={won(principal + interestOf(sel))} />
            <Stat label="원금이 2배 되는 기간(72의 법칙)" value={sel.rate > 0 ? ruleOf72(sel.rate).toFixed(1) + "년" : "—"} />
          </div>
          <p className="mt-2 text-[11px] leading-4 text-slate-400">📎 출처 · 기준: {sel.source}</p>
        </div>
      ) : null}

      {/* 이율 비교 막대 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📊 한눈에 비교 — 낮은 이율부터</p>
        <div className="mt-2 space-y-1">
          {sorted.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <span className="w-40 shrink-0 truncate text-xs text-slate-300">{c.emoji} {c.name}</span>
              <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-3 flex-1" aria-hidden="true">
                <rect width={100} height={8} rx={2} fill="rgba(255,255,255,0.06)" />
                <rect width={Math.max(0.6, (c.rate / maxRate) * 100)} height={8} rx={2} fill={GROUP_TONE[c.group].color} />
              </svg>
              <span className="w-16 shrink-0 text-right font-mono text-xs font-bold text-slate-100">{c.rate}%</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          맡길 때(파랑)보다 빌릴 때(빨강) 이율이 훨씬 높아요. 은행은 그 차이(예대마진)로 돈을 벌어요.
        </p>
      </div>

      {/* 이자 상식 */}
      <div className="grid gap-3 sm:grid-cols-3">
        <TipCard emoji="⚡" title="72의 법칙" tone="violet"
          body={`원금이 2배가 되는 햇수 ≈ 72 ÷ 이율(%). 연 3%면 24년, 연 6%면 12년, 카드 현금서비스 17.5%로 빌린 빚은 약 4.1년이면 2배로 불어나요.`} />
        <TipCard emoji="🧾" title="이자에도 세금이" tone="amber"
          body={`예금 이자를 받을 때 15.4%(소득세 14% + 지방소득세 1.4%)를 떼요. 연 2.8% 예금에 ${won(principal)}을 1년 맡기면 이자 ${won(simpleInterest(principal, 2.8, 1))} 중 ${won(simpleInterest(principal, 2.8, 1) * INTEREST_TAX)}을 세금으로 내고 ${won(simpleInterest(principal, 2.8, 1) * (1 - INTEREST_TAX))}을 받아요.`} />
        <TipCard emoji="🤔" title="적금 이자의 착시" tone="sky"
          body={`매달 30만원씩 1년 넣는 연 3.2% 적금의 이자는 ${won(savingsInterest(300_000, 3.2))}이에요. 360만원의 3.2%(115,200원)가 아니라 그 절반쯤이죠. 첫 달 돈만 12개월, 마지막 달 돈은 1개월만 이자가 붙기 때문이에요.`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-0.5 font-mono text-base font-bold text-slate-100">{value}</p>
    </div>
  );
}

const TIP_TONE: Record<string, string> = {
  violet: "border-violet-400/30 bg-violet-400/[0.07] text-violet-200",
  amber: "border-amber-400/30 bg-amber-400/[0.07] text-amber-200",
  sky: "border-sky-400/30 bg-sky-400/[0.07] text-sky-200",
};

function TipCard({ emoji, title, body, tone }: { emoji: string; title: string; body: string; tone: string }) {
  return (
    <div className={"rounded-2xl border p-4 " + TIP_TONE[tone]}>
      <p className="text-sm font-bold">{emoji} {title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-300">{body}</p>
    </div>
  );
}
