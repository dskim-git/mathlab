"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  BASE_INCOME,
  DATA_NOTE,
  EXTRAS,
  FACTOR_EXACT,
  FACTOR_TEXTBOOK,
  ITEMS,
  SAVING_MONTHS,
  SCENARIOS,
  TEXTBOOK_POW,
  monthlyIncomeTax,
  type Group,
  type ScenarioId,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "fixed_vs_var",
    prompt:
      "지출을 줄여야 할 때 쉽게 줄인 항목과 끝까지 줄이기 어려웠던 항목은 무엇이었나요? 그 차이가 생기는 까닭을 ‘고정 지출과 변동 지출’이라는 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 월세·통신비는 계약이 걸려 있어 줄이기 어려웠고, 식비·의류비·문화생활비는 바로 줄일 수 있었다. 그래서 소득이 줄면 변동 지출부터 조정하게 된다.",
  },
  {
    id: "biggest_gap",
    prompt:
      "월수입이 20% 늘었을 때와 20% 줄었을 때, 지출의 차이가 가장 큰 항목은 무엇이었나요? 왜 그 항목이 가장 크게 달라졌는지 자신의 생각을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 저축의 차이가 가장 컸다. 꼭 써야 하는 돈은 그대로인데 남는 돈이 모두 저축으로 가기 때문에, 수입 변화가 저축에 가장 크게 나타난다.",
  },
  {
    id: "saving_habit",
    prompt:
      "매달 저축액을 10만원만 더 늘려도 10년 뒤 원리합계는 약 1,648만원이 더 커졌어요. 이 결과를 보고 앞으로 나의 소비·저축 습관을 어떻게 하고 싶은지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 커피·구독료처럼 작아 보이는 지출을 줄여 매달 조금씩이라도 먼저 저축하고 남은 돈으로 생활하는 습관을 들이고 싶다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function won(v: number): string { return Math.round(v).toLocaleString("ko-KR") + "원"; }
function man(v: number, d = 0): string {
  return (v / 10000).toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "만원";
}

const GROUPS: Group[] = ["생활", "공과금", "문화·자기계발", "저축"];
const GROUP_COLOR: Record<Group, string> = {
  생활: "#38bdf8",
  공과금: "#fbbf24",
  "문화·자기계발": "#a78bfa",
  저축: "#34d399",
};

type Plan = Record<string, number>;
type AllPlans = Record<ScenarioId, Plan>;

function basePlan(): Plan {
  const p: Plan = {};
  for (const it of ITEMS) p[it.id] = it.base;
  return p;
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "budget" | "adjust" | "saving";

export default function BudgetLifeLab() {
  const [tab, setTab] = useState<Tab>("budget");
  // 조정 지출 1·2·3 — 항목별 금액
  const [plans, setPlans] = useState<AllPlans>({ s1: basePlan(), s2: basePlan(), s3: basePlan() });
  // 학생이 추가한 항목 id
  const [added, setAdded] = useState<string[]>([]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">💸 수입과 지출을 고려한 금융 생활</h3>
        <p className="mt-2 leading-7 text-slate-300">
          월수입 <b className="text-emerald-200">250만원</b>인 A씨의 가계부를 살펴보고, 내가 A씨라면 어떻게 쓸지 직접
          조정해 봐요. 수입이 <b className="text-emerald-200">20% 늘거나 줄면</b> 무엇이 가장 많이 달라질까요?
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "budget"} onClick={() => setTab("budget")}>① A씨의 가계부</TabButton>
        <TabButton active={tab === "adjust"} onClick={() => setTab("adjust")}>② 나의 조정 지출</TabButton>
        <TabButton active={tab === "saving"} onClick={() => setTab("saving")}>③ 저축이 만드는 10년 뒤</TabButton>
      </div>

      <div className="mt-4">
        {tab === "budget" ? <BudgetTab /> : null}
        {tab === "adjust" ? <AdjustTab plans={plans} setPlans={setPlans} added={added} setAdded={setAdded} /> : null}
        {tab === "saving" ? <SavingTab plans={plans} added={added} /> : null}
      </div>

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
// 탭 ① A씨의 가계부
// ══════════════════════════════════════════════════════════════
function BudgetTab() {
  const [hover, setHover] = useState<string | null>(null);
  const total = ITEMS.reduce((s, it) => s + it.base, 0);
  const sorted = [...ITEMS].sort((a, b) => b.base - a.base);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-sky-200">🧾 A씨의 한 달 (단위: 원)</p>
          <p className="font-mono text-sm text-slate-200">
            수입 <b className="text-emerald-200">{won(BASE_INCOME)}</b> = 지출 <b className="text-sky-200">{won(total)}</b>
          </p>
        </div>

        {/* 비중 막대 */}
        <div className="mt-3 flex h-7 w-full overflow-hidden rounded-lg">
          {sorted.map((it) => (
            <div key={it.id}
              onMouseEnter={() => setHover(it.id)} onMouseLeave={() => setHover(null)}
              title={`${it.name} ${won(it.base)}`}
              style={{ width: `${(it.base / total) * 100}%`, backgroundColor: GROUP_COLOR[it.group], opacity: hover && hover !== it.id ? 0.35 : 1 }}
              className="h-full transition" />
          ))}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
          {GROUPS.map((g) => (
            <span key={g} className="flex items-center gap-1 text-slate-300">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: GROUP_COLOR[g] }} aria-hidden="true" />
              {g} {won(ITEMS.filter((i) => i.group === g).reduce((s, i) => s + i.base, 0))}
            </span>
          ))}
        </div>
      </div>

      {/* 항목 카드 */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((it) => {
          const pct = (it.base / total) * 100;
          return (
            <div key={it.id}
              onMouseEnter={() => setHover(it.id)} onMouseLeave={() => setHover(null)}
              className={"rounded-xl border px-3 py-2 transition " + (hover === it.id ? "border-white/30 bg-white/[0.07]" : "border-white/10 bg-slate-900/40")}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-slate-100">{it.emoji} {it.name}</span>
                <span className="shrink-0 font-mono text-sm font-bold text-slate-100">{won(it.base)}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-white/10">
                <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: GROUP_COLOR[it.group] }} />
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                {pct.toFixed(1)}% {it.fixed ? "· 🔒 고정 지출" : ""}{it.auto ? "· ⚙️ 자동 계산" : ""}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">🔎 눈여겨볼 점</p>
        <ul className="mt-1.5 space-y-1 text-sm leading-6 text-slate-300">
          <li>• 가장 큰 지출은 <b className="text-sky-200">주거비 50만원(20%)</b>, 그다음이 <b className="text-sky-200">식비 40만원(16%)</b>이에요.</li>
          <li>• <b className="text-emerald-200">저축 70만원(28%)</b>은 ‘쓰고 남은 돈’이 아니라 미리 떼어 둔 돈이에요.</li>
          <li>• <b className="text-amber-200">소득세 27만원</b>은 연소득 3,000만원에 세율표를 적용한 값이에요 — 탭②에서 수입이 바뀌면 자동으로 다시 계산돼요.</li>
          <li>• 🔒 표시는 계약이 걸려 있어 <b className="text-slate-100">바로 줄이기 어려운</b> 고정 지출이에요.</li>
        </ul>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 나의 조정 지출
// ══════════════════════════════════════════════════════════════
type AdjustProps = {
  plans: AllPlans; setPlans: (f: (p: AllPlans) => AllPlans) => void;
  added: string[]; setAdded: (f: (a: string[]) => string[]) => void;
};

/** 시나리오의 실제 지출 금액(소득세·저축은 자동) */
function resolve(plan: Plan, added: string[], income: number) {
  const tax = monthlyIncomeTax(income);
  const list: { id: string; emoji: string; name: string; group: Group; amount: number; auto?: boolean; fixed?: boolean }[] = [];
  for (const it of ITEMS) {
    if (it.id === "saving") continue;
    list.push({ id: it.id, emoji: it.emoji, name: it.name, group: it.group, amount: it.id === "tax" ? tax : plan[it.id] ?? it.base, auto: it.auto, fixed: it.fixed });
  }
  for (const id of added) {
    const ex = EXTRAS.find((e) => e.id === id);
    if (ex) list.push({ id: ex.id, emoji: ex.emoji, name: ex.name, group: ex.group, amount: plan[ex.id] ?? ex.def });
  }
  const spend = list.reduce((s, x) => s + x.amount, 0);
  const saving = income - spend;
  return { list, spend, saving, tax };
}

function AdjustTab({ plans, setPlans, added, setAdded }: AdjustProps) {
  const [sid, setSid] = useState<ScenarioId>("s1");
  const sc = SCENARIOS.find((s) => s.id === sid)!;
  const cur = resolve(plans[sid], added, sc.income);

  function setAmount(id: string, v: number) {
    setPlans((p) => ({ ...p, [sid]: { ...p[sid], [id]: v } }));
  }
  function resetScenario() {
    setPlans((p) => ({ ...p, [sid]: basePlan() }));
  }
  function toggleExtra(id: string) {
    setAdded((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  }

  // 조정2 vs 조정3 — 항목별 차이
  const r2 = resolve(plans.s2, added, SCENARIOS[1].income);
  const r3 = resolve(plans.s3, added, SCENARIOS[2].income);
  const diffs = r2.list.map((x, i) => ({ name: x.name, emoji: x.emoji, diff: x.amount - (r3.list[i]?.amount ?? 0) }));
  diffs.push({ name: "저축", emoji: "🐷", diff: r2.saving - r3.saving });
  const topDiffs = [...diffs].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* 시나리오 선택 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap gap-1.5">
          {SCENARIOS.map((s) => (
            <button key={s.id} type="button" onClick={() => setSid(s.id)}
              className={"rounded-xl border-2 px-3 py-2 text-xs font-bold transition " +
                (sid === s.id
                  ? s.tone === "sky" ? "border-sky-400/60 bg-sky-400/20 text-sky-100"
                    : s.tone === "emerald" ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100"
                    : "border-rose-400/60 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
              {s.label} · 월 {man(s.income)}
            </button>
          ))}
          <button type="button" onClick={resetScenario}
            className="ml-auto rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-400 transition hover:bg-white/10">
            ↺ 이 시나리오 되돌리기
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">{sc.desc}</p>

        {/* 수입 · 지출 · 저축 */}
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Stat label="월수입" value={won(sc.income)} tone="slate" />
          <Stat label="지출 합계(저축 제외)" value={won(cur.spend)} tone="sky" />
          <Stat label="저축 = 수입 − 지출" value={won(cur.saving)} tone={cur.saving < 0 ? "rose" : "emerald"} />
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-gradient-to-r from-sky-400 to-emerald-400"
            style={{ width: `${Math.min(100, (cur.spend / sc.income) * 100)}%` }} />
        </div>
        <p className={"mt-1 text-center text-xs " + (cur.saving < 0 ? "font-bold text-rose-300" : "text-slate-400")}>
          {cur.saving < 0
            ? `⚠️ 적자예요! 지출이 수입보다 ${won(-cur.saving)} 많아요.`
            : `수입의 ${((cur.saving / sc.income) * 100).toFixed(1)}%를 저축하고 있어요.`}
        </p>
      </div>

      {/* 항목 추가 */}
      <div className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.06] p-4">
        <p className="text-sm font-bold text-violet-200">➕ 필요한 항목 더하기</p>
        <p className="mt-0.5 text-xs text-slate-400">내가 A씨라면 이런 것도 필요하지 않을까? (누르면 세 시나리오에 모두 추가돼요)</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXTRAS.map((e) => {
            const on = added.includes(e.id);
            return (
              <button key={e.id} type="button" onClick={() => toggleExtra(e.id)} title={e.why}
                className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (on ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
                {on ? "✓ " : "+ "}{e.emoji} {e.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 항목 조정 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">🎚️ 항목별로 조정하기</p>
        <div className="mt-2 space-y-1.5">
          {cur.list.map((x) => {
            const meta = ITEMS.find((i) => i.id === x.id);
            const ex = EXTRAS.find((e) => e.id === x.id);
            const min = meta?.min ?? 0;
            const max = meta?.max ?? ex?.max ?? 300_000;
            const step = meta?.step ?? 10_000;
            const base = meta?.base ?? ex?.def ?? 0;
            const gap = x.amount - base;
            return (
              <div key={x.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-950/40 px-3 py-2">
                <span className="w-40 shrink-0 truncate text-xs text-slate-200">
                  {x.emoji} {x.name} {x.fixed ? <span className="text-[10px] text-slate-500">🔒</span> : null}
                </span>
                {x.auto ? (
                  <span className="flex-1 text-[11px] text-amber-200">⚙️ 수입에 따라 자동 계산</span>
                ) : (
                  <input type="range" min={min} max={max} step={step} value={x.amount}
                    aria-label={x.name}
                    onChange={(e) => setAmount(x.id, Number(e.target.value))}
                    className="h-1.5 min-w-[120px] flex-1 accent-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40" />
                )}
                <span className="w-24 shrink-0 text-right font-mono text-xs font-bold text-slate-100">{won(x.amount)}</span>
                <span className={"w-16 shrink-0 text-right font-mono text-[10px] " + (gap > 0 ? "text-rose-300" : gap < 0 ? "text-emerald-300" : "text-slate-600")}>
                  {gap === 0 ? "—" : (gap > 0 ? "+" : "") + man(gap, 1)}
                </span>
              </div>
            );
          })}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.08] px-3 py-2">
            <span className="w-40 shrink-0 text-xs font-bold text-emerald-200">🐷 저축</span>
            <span className="flex-1 text-[11px] text-emerald-200/80">수입에서 지출을 뺀 나머지</span>
            <span className={"w-24 shrink-0 text-right font-mono text-sm font-bold " + (cur.saving < 0 ? "text-rose-300" : "text-emerald-100")}>{won(cur.saving)}</span>
            <span className="w-16 shrink-0" />
          </div>
        </div>
      </div>

      {/* 비교표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📋 한눈에 비교 (단위: 원)</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="px-2 py-1.5 text-left font-semibold">항목</th>
                <th className="px-2 py-1.5 text-right font-semibold">A씨</th>
                {SCENARIOS.map((s) => <th key={s.id} className="px-2 py-1.5 text-right font-semibold">{s.short}</th>)}
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {cur.list.map((x, i) => {
                const v1 = resolve(plans.s1, added, SCENARIOS[0].income).list[i].amount;
                const v2 = r2.list[i].amount;
                const v3 = r3.list[i].amount;
                const meta = ITEMS.find((it) => it.id === x.id);
                return (
                  <tr key={x.id} className="border-t border-white/5">
                    <td className="px-2 py-1 font-sans text-slate-200">{x.emoji} {x.name}</td>
                    <td className="px-2 py-1 text-right text-slate-500">{meta ? meta.base.toLocaleString("ko-KR") : "—"}</td>
                    <td className="px-2 py-1 text-right text-sky-200">{v1.toLocaleString("ko-KR")}</td>
                    <td className="px-2 py-1 text-right text-emerald-200">{v2.toLocaleString("ko-KR")}</td>
                    <td className="px-2 py-1 text-right text-rose-200">{v3.toLocaleString("ko-KR")}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-emerald-400/40 bg-emerald-400/10">
                <td className="px-2 py-1.5 font-sans font-bold text-emerald-100">🐷 저축</td>
                <td className="px-2 py-1.5 text-right text-slate-400">700,000</td>
                <td className="px-2 py-1.5 text-right font-bold text-sky-100">{resolve(plans.s1, added, SCENARIOS[0].income).saving.toLocaleString("ko-KR")}</td>
                <td className="px-2 py-1.5 text-right font-bold text-emerald-100">{r2.saving.toLocaleString("ko-KR")}</td>
                <td className="px-2 py-1.5 text-right font-bold text-rose-100">{r3.saving.toLocaleString("ko-KR")}</td>
              </tr>
              <tr className="border-t border-white/10">
                <td className="px-2 py-1.5 font-sans font-bold text-slate-200">총액</td>
                <td className="px-2 py-1.5 text-right text-slate-400">2,500,000</td>
                {SCENARIOS.map((s) => (
                  <td key={s.id} className="px-2 py-1.5 text-right text-slate-200">{s.income.toLocaleString("ko-KR")}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 차이 분석 */}
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">🥇 수입이 늘 때와 줄 때, 차이가 가장 큰 항목은?</p>
        <p className="mt-0.5 text-xs text-slate-400">조정2(월 300만원)와 조정3(월 200만원)의 항목별 차이 TOP 3</p>
        <div className="mt-2 space-y-1.5">
          {topDiffs.map((d, i) => {
            const maxAbs = Math.max(...topDiffs.map((x) => Math.abs(x.diff)), 1);
            return (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-center text-sm">{["🥇", "🥈", "🥉"][i]}</span>
                <span className="w-32 shrink-0 truncate text-xs text-slate-200">{d.emoji} {d.name}</span>
                <div className="h-3 flex-1 overflow-hidden rounded bg-white/10">
                  <div className="h-full rounded bg-amber-400" style={{ width: `${(Math.abs(d.diff) / maxAbs) * 100}%` }} />
                </div>
                <span className="w-24 shrink-0 text-right font-mono text-xs font-bold text-amber-200">{won(Math.abs(d.diff))}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          꼭 써야 하는 돈(고정 지출)은 잘 변하지 않으니, 수입이 달라지면 그 차이가 대부분{" "}
          <b className="text-emerald-200">저축</b>과 <b className="text-sky-200">줄이기 쉬운 변동 지출</b>에 나타나요.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  const cls: Record<string, string> = {
    slate: "border-white/15 bg-white/5 text-slate-100",
    sky: "border-sky-400/40 bg-sky-400/10 text-sky-100",
    emerald: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
    rose: "border-rose-400/40 bg-rose-400/10 text-rose-100",
  };
  return (
    <div className={"rounded-xl border px-4 py-2.5 text-center " + cls[tone]}>
      <p className="text-[11px] font-bold opacity-80">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-bold">{value}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 저축이 만드는 10년 뒤
// ══════════════════════════════════════════════════════════════
function SavingTab({ plans, added }: { plans: AllPlans; added: string[] }) {
  const [exact, setExact] = useState(false);
  const factor = exact ? FACTOR_EXACT : FACTOR_TEXTBOOK;

  const rows = [
    { id: "base" as const, label: "A씨", saving: 700_000, tone: "slate" },
    ...SCENARIOS.map((s) => ({
      id: s.id,
      label: `${s.short} (월 ${man(s.income)})`,
      saving: Math.max(0, resolve(plans[s.id], added, s.income).saving),
      tone: s.tone,
    })),
  ];
  const maxV = Math.max(...rows.map((r) => r.saving * factor), 1);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🐷 정한 저축액을 10년 만기 정기 적금에 넣는다면?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          매월 초 <b className="text-emerald-100">a원</b>씩 <b className="text-emerald-100">월이율 0.5%</b>의 복리로{" "}
          <b className="text-emerald-100">120개월</b> 적립할 때의 원리합계예요.
        </p>
        <div className="mt-2 space-y-1 overflow-x-auto rounded-lg bg-black/25 px-3 py-2 font-mono text-xs leading-6 text-slate-200">
          <p>S = a(1+r){"{"}(1+r)ⁿ − 1{"}"} ÷ r</p>
          <p>= a × 1.005 × ({exact ? Math.pow(1.005, 120).toFixed(6) : TEXTBOOK_POW} − 1) ÷ 0.005</p>
          <p className="text-emerald-200">= a × {factor.toFixed(2)}</p>
        </div>
        <button type="button" onClick={() => setExact((v) => !v)}
          className="mt-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10">
          {exact ? "교과서 어림값(1.005¹²⁰ = 1.82)으로 보기" : "정확한 값(1.005¹²⁰ = 1.819397…)으로 보기"}
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📊 시나리오별 10년 뒤 원리합계</p>
        <div className="mt-2 space-y-2">
          {rows.map((r) => {
            const s = r.saving * factor;
            const paid = r.saving * SAVING_MONTHS;
            return (
              <div key={r.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs text-slate-300">{r.label} · 월 저축 <b className="font-mono text-slate-100">{won(r.saving)}</b></span>
                  <span className="font-mono text-sm font-bold text-emerald-200">{won(s)}</span>
                </div>
                <div className="mt-1 flex h-4 w-full overflow-hidden rounded bg-white/10">
                  <div className="h-full bg-slate-500" style={{ width: `${(paid / maxV) * 100}%` }} title={`납입 ${won(paid)}`} />
                  <div className="h-full bg-emerald-400" style={{ width: `${((s - paid) / maxV) * 100}%` }} title={`이자 ${won(s - paid)}`} />
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  납입 {man(paid)} + 이자 {man(s - paid)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-slate-300"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-500" />내가 넣은 돈</span>
          <span className="flex items-center gap-1 text-slate-300"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" />이자</span>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">💡 매달 10만원의 힘</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          저축을 매달 <b className="text-amber-100">10만원</b>만 더 하면 10년 뒤 원리합계는{" "}
          <b className="font-mono text-amber-100">{won(100_000 * factor)}</b>이 더 커져요. 커피 한 잔·구독료 하나가
          10년 뒤에는 이만큼이 됩니다.
        </p>
      </div>
    </div>
  );
}
