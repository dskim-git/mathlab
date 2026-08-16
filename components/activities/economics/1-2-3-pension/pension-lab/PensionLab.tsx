"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  CARDS,
  DATA_NOTE,
  PROBLEMS,
  SIM_PRESETS,
  TIERS,
  annuityPV,
  lifeExpectancy,
  monthlyPayout,
  type Sex,
  type Step,
  type Tier,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "three_tiers",
    prompt:
      "우리나라 노후 준비는 국가(공적연금)·회사(퇴직연금)·개인(개인연금)의 3층 구조예요. 왜 한 층만으로는 부족하다고 하는지, 각 층이 맡은 역할과 함께 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 국민연금만으로는 평균 월 65만원 정도라 생활비에 못 미친다. 그래서 회사에서 쌓아 주는 퇴직연금과 내가 따로 준비하는 개인연금을 더해 세 층으로 채워야 한다.",
  },
  {
    id: "life_vs_certain",
    prompt:
      "종신연금과 확정연금을 비교해 보았어요. 시뮬레이터에서 찾은 ‘손익분기 나이’가 무엇을 뜻하는지 설명하고, 내가 은퇴한다면 어느 쪽을 고를지 근거를 들어 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 그 나이보다 오래 살면 종신연금이 총액에서 유리해진다는 뜻이다. 나는 오래 살 위험(장수 위험)에 대비하고 싶으니 종신형을 고르겠다. 다만 가족에게 남기고 싶다면 확정형이 나을 수 있다.",
  },
  {
    id: "my_plan",
    prompt:
      "연금저축은 넣은 돈의 16.5%를 세금으로 돌려받지만 만 55세까지 찾을 수 없어요. ‘지금 쓰는 돈’과 ‘나중을 위한 돈’ 사이에서 어떻게 균형을 잡을지, 자신의 생각을 근거와 함께 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 당장 필요한 돈까지 묶어 두면 중도 해지로 손해를 보니, 비상금을 먼저 만들고 남는 돈으로 연금저축을 시작하겠다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function won(v: number): string { return Math.round(v).toLocaleString("ko-KR") + "원"; }
function man(v: number, d = 0): string {
  return (v / 10000).toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "만원";
}
function eok(v: number): string {
  if (Math.abs(v) >= 1e8) return (v / 1e8).toFixed(2) + "억원";
  return man(v);
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "cards" | "life" | "problem";

export default function PensionLab() {
  const [tab, setTab] = useState<Tab>("cards");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">👵 연금의 종류와 생명연금</h3>
        <p className="mt-2 leading-7 text-slate-300">
          연금은 <b className="text-emerald-200">정해진 기간 동안 같은 금액을 주기적으로 받는</b> 돈이에요. 우리나라의 노후
          준비는 국가·회사·개인이 함께 쌓는 <b className="text-emerald-200">3층 구조</b>로 되어 있죠. 어떤 연금이 있는지
          살펴보고, <b className="text-emerald-200">종신연금과 확정연금</b> 중 무엇이 유리한지도 따져 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "cards"} onClick={() => setTab("cards")}>① 연금 3층 구조 카드</TabButton>
        <TabButton active={tab === "life"} onClick={() => setTab("life")}>② 종신연금 vs 확정연금</TabButton>
        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>③ 실제 사례로 계산하기</TabButton>
      </div>

      <div className="mt-4">
        {tab === "cards" ? <CardsTab /> : null}
        {tab === "life" ? <LifeTab /> : null}
        {tab === "problem" ? <ProblemTab /> : null}
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
// 탭 ① 연금 3층 구조 카드
// ══════════════════════════════════════════════════════════════
const TIER_TONE: Record<Tier, { border: string; bg: string; text: string; fill: string }> = {
  "1층 · 공적연금": { border: "border-sky-400/40", bg: "bg-sky-400/[0.08]", text: "text-sky-200", fill: "#38bdf8" },
  "2층 · 퇴직연금": { border: "border-emerald-400/40", bg: "bg-emerald-400/[0.08]", text: "text-emerald-200", fill: "#34d399" },
  "3층 · 개인연금": { border: "border-violet-400/40", bg: "bg-violet-400/[0.08]", text: "text-violet-200", fill: "#a78bfa" },
  "＋ 집을 연금으로": { border: "border-amber-400/40", bg: "bg-amber-400/[0.08]", text: "text-amber-200", fill: "#fbbf24" },
};

function CardsTab() {
  const [tier, setTier] = useState<Tier | "전체">("전체");
  const [openId, setOpenId] = useState<string | null>("np");
  const list = tier === "전체" ? CARDS : CARDS.filter((c) => c.tier === tier);

  return (
    <div className="space-y-4">
      {/* 3층 집 그림 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">🏗️ 노후 준비의 3층 구조</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          층을 눌러 그 층에 속한 연금만 볼 수 있어요. 아래로 갈수록 <b className="text-sky-200">모두에게 기본으로 주어지는</b> 연금,
          위로 갈수록 <b className="text-violet-200">내가 스스로 준비하는</b> 연금이에요.
        </p>
        <div className="mt-3 space-y-1.5">
          {[...TIERS].reverse().map((t) => {
            const key = t as Tier;
            const tone = TIER_TONE[key];
            const on = tier === key;
            const count = CARDS.filter((c) => c.tier === key).length;
            const width = key === "1층 · 공적연금" ? "100%" : key === "2층 · 퇴직연금" ? "84%" : key === "3층 · 개인연금" ? "68%" : "52%";
            return (
              <button key={t} type="button" onClick={() => setTier(on ? "전체" : key)}
                style={{ width }}
                className={"mx-auto flex items-center justify-between rounded-xl border-2 px-4 py-2.5 transition " +
                  (on ? `${tone.border} ${tone.bg}` : "border-white/10 bg-white/5 hover:bg-white/10")}>
                <span className={"text-sm font-bold " + (on ? tone.text : "text-slate-200")}>{t}</span>
                <span className="text-[11px] text-slate-400">{count}개</span>
              </button>
            );
          })}
          <p className="pt-1 text-center text-[11px] text-slate-500">▲ 위로 갈수록 개인의 선택 · 아래로 갈수록 사회의 기본</p>
        </div>
        {tier !== "전체" ? (
          <div className="mt-2 text-center">
            <button type="button" onClick={() => setTier("전체")}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10">
              ✕ 전체 보기
            </button>
          </div>
        ) : null}
      </div>

      {/* 카드 */}
      <div className="grid gap-2 sm:grid-cols-2">
        {list.map((c) => {
          const tone = TIER_TONE[c.tier];
          const open = openId === c.id;
          return (
            <div key={c.id} className={"rounded-2xl border transition " + (open ? `${tone.border} ${tone.bg} sm:col-span-2` : "border-white/10 bg-slate-900/40")}>
              <button type="button" onClick={() => setOpenId(open ? null : c.id)} className="w-full px-4 py-3 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden="true">{c.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <span className={"inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold " + tone.border + " " + tone.text}>
                      {c.tier}
                    </span>
                    <p className="mt-1 text-base font-bold text-slate-100">{c.name}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-400">{c.tagline}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">{open ? "접기 ▲" : "자세히 ▼"}</span>
                </div>
              </button>

              {open ? (
                <div className="border-t border-white/10 px-4 py-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Row label="누가 가입하나요?" value={c.who} />
                    <Row label="얼마를 내나요?" value={c.pay} />
                    <Row label="언제 받나요?" value={c.when} />
                    <Row label="어떻게 계산되나요?" value={c.how} />
                  </div>
                  <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {c.facts.map((f) => (
                      <div key={f.label} className="flex items-baseline justify-between gap-2 rounded-lg bg-black/25 px-3 py-1.5">
                        <span className="shrink-0 text-[11px] text-slate-400">{f.label}</span>
                        <span className="text-right text-[11px] font-bold text-slate-100">{f.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className={"mt-3 rounded-lg border-l-4 px-3 py-2 text-xs leading-5 " + tone.border.replace("border-", "border-l-") + " " + tone.bg + " " + tone.text}>
                    💡 {c.tip}
                  </p>
                  <p className="mt-1.5 text-[10px] text-slate-500">📎 {c.source}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs leading-5 text-slate-200">{value}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 종신연금 vs 확정연금
// ══════════════════════════════════════════════════════════════
function LifeTab() {
  const [principal, setPrincipal] = useState(300_000_000);
  const [age, setAge] = useState(65);
  const [sex, setSex] = useState<Sex>("male");
  const [ratePct, setRatePct] = useState(3);
  const [certainYears, setCertainYears] = useState(20);
  const [deathAge, setDeathAge] = useState(84);

  const le = lifeExpectancy(age, sex);
  const expMonths = Math.round(le * 12);
  const certMonths = certainYears * 12;

  // 같은 목돈을 각각의 방식으로 나눠 받을 때의 월 수령액
  const mLife = monthlyPayout(principal, ratePct, expMonths);
  const mCert = monthlyPayout(principal, ratePct, certMonths);

  const livedYears = Math.max(0, deathAge - age);
  const totalLife = mLife * livedYears * 12;          // 종신 — 살아 있는 동안만
  const totalCert = mCert * certMonths;               // 확정 — 사망해도 유족이 남은 기간 수령
  const breakEven = age + totalCert / (mLife * 12);   // 종신이 확정 총액을 넘어서는 나이

  function preset(i: number) {
    const p = SIM_PRESETS[i];
    setPrincipal(p.principal); setAge(p.age); setSex(p.sex); setRatePct(p.ratePct); setCertainYears(p.certainYears);
    setDeathAge(Math.round(p.age + lifeExpectancy(p.age, p.sex)));
  }

  return (
    <div className="space-y-4">
      {/* 개념 */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/[0.07] p-4">
          <p className="text-sm font-bold text-rose-200">♾️ 종신연금 (life annuity)</p>
          <p className="mt-1 text-xs leading-6 text-slate-300">
            <b className="text-rose-100">살아 있는 동안</b> 계속 받는 연금. 오래 살수록 총액이 커지지만, 일찍 세상을 떠나면
            거기서 끝나요. <b className="text-rose-100">‘오래 살 위험(장수 위험)’에 대비하는 보험</b>의 성격을 가져요.
          </p>
          <p className="mt-2 rounded-lg bg-black/25 px-2.5 py-1.5 text-[11px] text-slate-300">
            실제 사례 — 국민연금, 공무원연금, 주택연금(종신지급), 보험사 종신형 연금보험
          </p>
        </div>
        <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.07] p-4">
          <p className="text-sm font-bold text-sky-200">📅 확정연금 (annuity certain)</p>
          <p className="mt-1 text-xs leading-6 text-slate-300">
            <b className="text-sky-100">정해진 기간(10년·20년 등)</b>만 받는 연금. 기간이 짧을수록 매달 받는 금액이 커지고,
            받는 사람이 사망해도 <b className="text-sky-100">남은 기간은 유족이 이어받아요</b>.
          </p>
          <p className="mt-2 rounded-lg bg-black/25 px-2.5 py-1.5 text-[11px] text-slate-300">
            실제 사례 — 연금저축 확정기간형(10·20년), 퇴직연금(IRP) 분할 수령, 주택연금 확정기간방식
          </p>
        </div>
      </div>

      {/* 설정 */}
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🎛️ 같은 목돈을 연금으로 바꾼다면?</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SIM_PRESETS.map((p, i) => (
            <button key={p.label} type="button" onClick={() => preset(i)} title={p.note}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10">
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Slider id="pp" label="연금 재원(목돈)" value={eok(principal)} min={30_000_000} max={1_000_000_000} step={10_000_000} v={principal} onChange={setPrincipal} />
          <Slider id="aa" label="받기 시작하는 나이" value={`${age}세`} min={55} max={80} step={1} v={age}
            onChange={(v) => { setAge(v); setDeathAge(Math.max(v + 1, Math.round(v + lifeExpectancy(v, sex)))); }} />
          <Slider id="rr" label="예정이율(할인율)" value={`연 ${ratePct}%`} min={1} max={6} step={0.5} v={ratePct} onChange={setRatePct} />
          <Slider id="cc" label="확정연금 기간" value={`${certainYears}년`} min={5} max={30} step={5} v={certainYears} onChange={setCertainYears} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">성별(기대여명이 달라요)</span>
          {(["male", "female"] as Sex[]).map((s) => (
            <button key={s} type="button"
              onClick={() => { setSex(s); setDeathAge(Math.round(age + lifeExpectancy(age, s))); }}
              className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (sex === s ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
              {s === "male" ? "남자" : "여자"}
            </button>
          ))}
          <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">
            {age}세 기대여명 <b className="font-mono text-emerald-200">{le.toFixed(1)}년</b> → 평균 {(age + le).toFixed(0)}세까지
          </span>
        </div>
      </div>

      {/* 월 수령액 비교 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Big label={`♾️ 종신연금 월 수령액`} value={won(mLife)} sub={`기대여명 ${le.toFixed(1)}년(${expMonths}개월) 기준`} tone="rose" />
        <Big label={`📅 확정 ${certainYears}년형 월 수령액`} value={won(mCert)} sub={`${certMonths}개월 동안 지급`} tone="sky" />
      </div>

      {/* 타임라인 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📊 몇 살까지 살면 어느 쪽이 유리할까?</p>
        <label htmlFor="dd" className="mt-2 block text-xs font-bold text-slate-300">
          몇 살까지 산다고 가정할까요? <span className="font-mono text-amber-200">{deathAge}세</span>
          <span className="ml-1 text-[11px] text-slate-500">(평균은 {(age + le).toFixed(0)}세)</span>
        </label>
        <input id="dd" type="range" min={age + 1} max={age + 45} step={1} value={deathAge}
          onChange={(e) => setDeathAge(Number(e.target.value))}
          className="mt-1.5 w-full accent-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40" />

        <Timeline age={age} deathAge={deathAge} certainYears={certainYears} breakEven={breakEven} />

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Big label="♾️ 종신연금 총 수령액" value={eok(totalLife)} sub={`${livedYears}년 × ${won(mLife)}`} tone="rose" />
          <Big label="📅 확정연금 총 수령액" value={eok(totalCert)} sub={`${certainYears}년 × ${won(mCert)} (유족 포함)`} tone="sky" />
          <Big label="손익분기 나이" value={`${breakEven.toFixed(1)}세`} sub="이보다 오래 살면 종신이 유리" tone="amber" />
        </div>

        <p className={"mt-3 rounded-xl border-l-4 px-4 py-2.5 text-sm leading-6 " +
          (totalLife > totalCert ? "border-rose-400 bg-rose-400/[0.08] text-rose-100" : "border-sky-400 bg-sky-400/[0.08] text-sky-100")}>
          {deathAge}세까지 산다면 <b>{totalLife > totalCert ? "종신연금" : "확정연금"}</b>이 총액에서 유리해요 —{" "}
          종신 <b className="font-mono">{eok(totalLife)}</b> vs 확정 <b className="font-mono">{eok(totalCert)}</b>{" "}
          (차이 {eok(Math.abs(totalLife - totalCert))})
        </p>
      </div>

      {/* 비교표 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-100">📋 한눈에 비교</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="px-2 py-1.5 text-left font-semibold">항목</th>
                <th className="px-2 py-1.5 text-left font-semibold text-rose-300">종신연금</th>
                <th className="px-2 py-1.5 text-left font-semibold text-sky-300">확정연금</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {[
                ["받는 기간", "죽을 때까지 (기간을 모름)", "정해진 기간 (10년·20년 등)"],
                ["월 수령액", "기대여명으로 나눠 계산 → 상대적으로 적음", "기간이 짧을수록 많음"],
                ["일찍 사망하면", "지급이 끝남 (손해로 느껴질 수 있음)", "남은 기간을 유족이 이어받음"],
                ["오래 살면", "계속 받아 총액이 커짐 (장수 대비)", "기간이 끝나면 더 이상 없음"],
                ["대표 사례", "국민연금, 주택연금(종신), 종신형 연금보험", "연금저축 확정기간형, IRP 분할 수령"],
                ["수학적 계산", "생명표(생존확률)와 기대여명이 필요", "등비수열의 합으로 정확히 계산"],
              ].map((r) => (
                <tr key={r[0]} className="border-t border-white/5">
                  <td className="px-2 py-1.5 font-bold text-slate-200">{r[0]}</td>
                  <td className="px-2 py-1.5 leading-5 text-rose-100">{r[1]}</td>
                  <td className="px-2 py-1.5 leading-5 text-sky-100">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          ※ 두 연금 모두 같은 목돈 <b className="text-slate-200">{eok(principal)}</b>을 예정이율 연 {ratePct}%로 나눠 받는다고 보고
          계산했어요(현재가치가 목돈과 같아지도록). 실제 보험 상품에는 사업비·세금이 더해져 조금씩 달라집니다.
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          확인 — 확정연금의 현재가치 {eok(annuityPV(mCert, ratePct, certMonths))} · 종신연금(기대여명 기준) {eok(annuityPV(mLife, ratePct, expMonths))}
        </p>
      </div>
    </div>
  );
}

function Timeline({ age, deathAge, certainYears, breakEven }: {
  age: number; deathAge: number; certainYears: number; breakEven: number;
}) {
  const span = Math.max(deathAge - age, certainYears, Math.ceil(breakEven - age)) + 4;
  const W = 340, H = 96, L = 44, R = 12;
  const X = (y: number) => L + (y / span) * (W - L - R);
  const ticks = [0, Math.round(span / 3), Math.round((2 * span) / 3), span].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="mt-2 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[340px]" role="img" aria-label="종신연금과 확정연금 지급 기간 비교">
        <rect x={0} y={0} width={W} height={H} fill="#0b1220" rx={8} />

        {/* 종신 */}
        <text x={L - 6} y={26} textAnchor="end" className="fill-rose-200" style={{ fontSize: 7, fontWeight: 700 }}>종신</text>
        <rect x={L} y={18} width={Math.max(2, X(deathAge - age) - L)} height={12} rx={3} fill="#fb7185" opacity={0.85} />
        <text x={X(deathAge - age) + 3} y={27} className="fill-rose-200" style={{ fontSize: 6 }}>{deathAge}세 사망</text>

        {/* 확정 */}
        <text x={L - 6} y={54} textAnchor="end" className="fill-sky-200" style={{ fontSize: 7, fontWeight: 700 }}>확정 {certainYears}년</text>
        <rect x={L} y={46} width={Math.max(2, X(certainYears) - L)} height={12} rx={3} fill="#38bdf8" opacity={0.85} />
        {deathAge - age < certainYears ? (
          <rect x={X(deathAge - age)} y={46} width={Math.max(1, X(certainYears) - X(deathAge - age))} height={12} rx={3}
            fill="url(#stripe)" opacity={0.9} />
        ) : null}
        <defs>
          <pattern id="stripe" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="4" fill="#0ea5e9" />
            <rect width="2" height="4" fill="#7dd3fc" />
          </pattern>
        </defs>
        {deathAge - age < certainYears ? (
          <text x={X(certainYears) + 3} y={55} className="fill-sky-200" style={{ fontSize: 6 }}>유족이 이어받음</text>
        ) : (
          <text x={X(certainYears) + 3} y={55} className="fill-sky-200" style={{ fontSize: 6 }}>{age + certainYears}세에 끝</text>
        )}

        {/* 손익분기 */}
        {breakEven - age <= span ? (
          <>
            <line x1={X(breakEven - age)} x2={X(breakEven - age)} y1={12} y2={72} stroke="#fbbf24" strokeWidth={1} strokeDasharray="3 2" />
            <text x={X(breakEven - age)} y={9} textAnchor="middle" className="fill-amber-300" style={{ fontSize: 6, fontWeight: 700 }}>
              손익분기 {breakEven.toFixed(0)}세
            </text>
          </>
        ) : null}

        {/* 나이 축 */}
        <line x1={L} x2={W - R} y1={72} y2={72} stroke="rgba(255,255,255,0.2)" strokeWidth={0.8} />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={72} y2={75} stroke="rgba(255,255,255,0.3)" strokeWidth={0.6} />
            <text x={X(t)} y={84} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 6 }}>{age + t}세</text>
          </g>
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
  rose: "border-rose-400/40 bg-rose-400/10 text-rose-100",
  sky: "border-sky-400/40 bg-sky-400/10 text-sky-100",
  amber: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  emerald: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
};

function Big({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className={"rounded-xl border px-4 py-3 text-center " + BIG_TONE[tone]}>
      <p className="text-xs font-bold opacity-80">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold">{value}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p> : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 실제 사례로 계산하기
// ══════════════════════════════════════════════════════════════
type StepState = { text: string; ok: boolean; tries: number; hint: boolean; shown: boolean };
const DEFAULT_STEP: StepState = { text: "", ok: false, tries: 0, hint: false, shown: false };

function ProblemTab() {
  const [pIdx, setPIdx] = useState(0);
  const [state, setState] = useState<Record<string, StepState>>({});
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
              const v = Number(text.replace(/[,\s원년만%]/g, ""));
              return Number.isFinite(v) && text.trim() !== "" && Math.abs(v - step.answer) <= (step.tol ?? 0.5);
            })()
          : text !== "" && Number(text) === step.answer;
      return { ...p, [step.id]: { ...cur, text, ok, tries: cur.tries + 1 } };
    });
  }

  const firstOpen = prob.steps.findIndex((s) => !get(s.id).ok);
  const probDone = firstOpen === -1;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🧮 우리나라 연금, 숫자로 확인하기</p>
          <span className="font-mono text-xs text-slate-300">완료 {doneCount} / {PROBLEMS.length}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PROBLEMS.map((p, i) => {
            const done = p.steps.every((s) => state[s.id]?.ok);
            return (
              <button key={p.id} type="button" onClick={() => setPIdx(i)}
                className={"rounded-lg border px-2.5 py-1 text-xs font-bold transition " + (pIdx === i ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : done ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>
                {done ? "✅ " : ""}{p.emoji} {p.title.replace("문제 ", "").replace(" · ", ". ")}
              </button>
            );
          })}
        </div>
      </div>

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
        <p className="mt-2 text-[11px] text-slate-500">📎 {prob.source}</p>
      </div>

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
                      아직 아니에요. {ss.tries >= 2 ? "힌트를 열어 보세요." : "다시 계산해 볼까요?"}
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
            <button type="button" onClick={() => setPIdx(pIdx + 1)}
              className="mt-3 rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25">
              다음 문제로 →
            </button>
          ) : doneCount === PROBLEMS.length ? (
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 네 문제를 모두 해결했어요! 연금 박사 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
