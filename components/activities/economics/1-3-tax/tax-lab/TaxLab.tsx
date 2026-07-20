"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  ALL_TAX_CARDS,
  DATA_NOTE,
  SIM_ITEMS,
  type SimItem,
  type TaxCard,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "classify_basis",
    prompt:
      "국세와 지방세, 직접세와 간접세는 각각 무엇을 기준으로 나뉘는지 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 국세는 나라(중앙정부)가, 지방세는 지방자치단체가 걷는다. 직접세는 세금을 내는 사람과 부담하는 사람이 같고(소득세 등), 간접세는 다르다(부가가치세 등).",
  },
  {
    id: "indirect_hidden",
    prompt:
      "하루 소비 시뮬레이터에서 물건을 살 때마다 나도 모르게 붙는 세금(간접세)이 있었어요. 간접세는 왜 ‘세금을 내는 사람’과 ‘실제로 부담하는 사람’이 다를 수 있는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 부가가치세는 소비자가 물건값에 얹어 부담하지만, 실제로 세무서에 내는 것은 가게(사업자)여서 서로 다르다.",
  },
  {
    id: "tax_role",
    prompt:
      "오늘 살펴본 세금 중 하나를 골라, 그 세금이 우리 생활이나 사회에서 어떤 역할을 하는지(어디에 쓰이는지) 예를 들어 써 보세요.",
    kind: "text",
    placeholder:
      "예: 교육세·지방교육세는 학교와 교육에 쓰이고, 교통·에너지·환경세는 도로·환경 사업에 쓰인다.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
export function won(v: number): string {
  return v.toLocaleString("ko-KR") + "원";
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "cards" | "sim" | "game";

export default function TaxLab() {
  const [tab, setTab] = useState<Tab>("cards");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🧾 대한민국 세금의 종류</h3>
        <p className="mt-2 leading-7 text-slate-300">
          우리가 내는 세금은 <b className="text-emerald-200">국세와 지방세</b>, <b className="text-emerald-200">직접세와 간접세</b>로
          나뉘어요. 카드를 뒤집어 25개 세금을 탐색하고, 하루 소비 시뮬레이터로 내가 실제로 내는 세금을
          확인한 뒤, 분류 게임으로 마무리해요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "cards"} onClick={() => setTab("cards")}>
          ① 세금 카드 뒤집기
        </TabButton>
        <TabButton active={tab === "sim"} onClick={() => setTab("sim")}>
          ② 하루 소비 시뮬레이터
        </TabButton>
        <TabButton active={tab === "game"} onClick={() => setTab("game")}>
          ③ 세금 분류 게임
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "cards" ? <CardsTab /> : tab === "sim" ? <SimTab /> : <GameTab />}
      </div>

      <p className="mt-4 text-xs text-slate-500">📌 자료 기준: {DATA_NOTE}</p>

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
// 탭 ① 세금 카드 뒤집기 (탐색 · amber)
// ══════════════════════════════════════════════════════════════
type CardFilter = "all" | "국세" | "지방세" | "직접세" | "간접세";

const FILTERS: { key: CardFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "국세", label: "국세" },
  { key: "지방세", label: "지방세" },
  { key: "직접세", label: "직접세" },
  { key: "간접세", label: "간접세" },
];

function matchFilter(c: TaxCard, f: CardFilter): boolean {
  if (f === "all") return true;
  if (f === "국세" || f === "지방세") return c.level === f;
  return c.di === f; // 직접세 / 간접세
}

function CardsTab() {
  const [filter, setFilter] = useState<CardFilter>("all");
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  const cards = useMemo(() => ALL_TAX_CARDS.filter((c) => matchFilter(c, filter)), [filter]);

  function toggle(id: string) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
        <p className="text-sm font-bold text-amber-200">🗂️ 카드를 눌러 뒤집어 보세요</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          세금 이름과 분류가 앞면에, <b className="text-amber-100">정의 · 누가 내나 · 실생활 사례 · 세율</b>이 뒷면에 있어요.
          아래 버튼으로 국세/지방세, 직접세/간접세만 골라 볼 수 있어요.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={
                "rounded-lg border px-3 py-1 text-xs font-bold transition " +
                (filter === f.key
                  ? "border-amber-400/60 bg-amber-400/20 text-amber-100"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto self-center text-xs text-slate-500">{cards.length}개</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const isFlipped = flipped.has(c.id);
          const levelTone =
            c.level === "국세"
              ? "border-sky-400/40 bg-sky-400/[0.08] text-sky-200"
              : "border-violet-400/40 bg-violet-400/[0.08] text-violet-200";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className="flex min-h-[9.5rem] flex-col rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-left transition hover:border-amber-400/40 hover:bg-slate-900"
            >
              {isFlipped ? (
                <div className="space-y-1.5 text-sm leading-6">
                  <p className="font-bold text-amber-100">{c.emoji} {c.name}</p>
                  <p className="text-slate-300"><span className="text-slate-500">뜻</span> {c.def}</p>
                  <p className="text-slate-300"><span className="text-slate-500">납세</span> {c.payer}</p>
                  <p className="text-slate-300"><span className="text-slate-500">사례</span> {c.example}</p>
                  <p className="text-emerald-200"><span className="text-slate-500">세율</span> {c.rate}</p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                  <span className="text-4xl">{c.emoji}</span>
                  <span className="text-lg font-bold text-slate-100">{c.name}</span>
                  <span className={"rounded-full border px-2 py-0.5 text-[11px] font-semibold " + levelTone}>
                    {c.level} · {c.path}
                  </span>
                  <span className="text-[11px] text-slate-500">눌러서 내용 보기 ↩</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 하루 소비 시뮬레이터 (시뮬 · sky)
// ══════════════════════════════════════════════════════════════
function itemTotal(it: SimItem): number {
  return it.taxes.reduce((s, t) => s + t.amount, 0);
}

function SimTab() {
  const [picked, setPicked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const chosen = SIM_ITEMS.filter((it) => picked.has(it.id));
  const lines = chosen.flatMap((it) => it.taxes);
  const total = lines.reduce((s, t) => s + t.amount, 0);
  const national = lines.filter((t) => t.level === "국세").reduce((s, t) => s + t.amount, 0);
  const local = total - national;
  const natPct = total > 0 ? Math.round((national / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.06] p-4">
        <p className="text-sm font-bold text-sky-200">🧮 오늘 나의 소비·활동을 골라 보세요</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          항목을 누르면 그 소비에 붙는 세금이 <b className="text-sky-100">‘오늘 낸 세금 영수증’</b>에 쌓여요.
          물건을 살 때마다 나도 모르게 세금을 내고 있다는 걸 확인해 봐요.
        </p>
      </div>

      {/* 선택 항목 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {SIM_ITEMS.map((it) => {
          const on = picked.has(it.id);
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => toggle(it.id)}
              className={
                "rounded-2xl border p-4 text-left transition " +
                (on ? "border-sky-400/60 bg-sky-400/[0.12]" : "border-white/10 bg-slate-900/50 hover:bg-slate-900")
              }
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-slate-100">{it.emoji} {it.title}</p>
                <span className={"shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold " + (on ? "border-sky-300/60 text-sky-100" : "border-white/15 text-slate-400")}>
                  {on ? "선택됨 ✓" : "고르기 +"}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-300">{it.desc}</p>
              <p className="mt-1 font-mono text-sm text-sky-200">세금 {won(itemTotal(it))}</p>
            </button>
          );
        })}
      </div>

      {/* 영수증 */}
      <div className="rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-500/[0.08] to-cyan-500/[0.04] p-4">
        <p className="text-sm font-bold text-sky-100">🧾 오늘 낸 세금 영수증</p>
        {chosen.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">위에서 소비·활동을 하나 이상 골라 보세요.</p>
        ) : (
          <>
            <div className="mt-3 space-y-2">
              {chosen.map((it) => (
                <div key={it.id} className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
                  <p className="text-sm font-bold text-slate-100">{it.emoji} {it.title}</p>
                  <div className="mt-1.5 space-y-1">
                    {it.taxes.map((t, i) => (
                      <div key={i} className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="text-slate-300">
                          <span className={"mr-1.5 rounded px-1.5 py-0.5 text-[11px] font-bold " + (t.level === "국세" ? "bg-sky-400/15 text-sky-200" : "bg-violet-400/15 text-violet-200")}>{t.level}</span>
                          {t.label}
                        </span>
                        <span className="shrink-0 font-mono text-slate-100">{won(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                  {it.note ? <p className="mt-1.5 text-[11px] leading-5 text-slate-500">※ {it.note}</p> : null}
                </div>
              ))}
            </div>

            {/* 합계 */}
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/[0.10] px-4 py-3">
                <p className="text-xs text-slate-400">오늘 낸 세금 합계</p>
                <p className="font-mono text-2xl font-bold text-emerald-200">{won(total)}</p>
              </div>
              <div className="rounded-xl border border-sky-400/40 bg-sky-400/[0.10] px-4 py-3">
                <p className="text-xs text-slate-400">국세</p>
                <p className="font-mono text-xl font-bold text-sky-200">{won(national)}</p>
              </div>
              <div className="rounded-xl border border-violet-400/40 bg-violet-400/[0.10] px-4 py-3">
                <p className="text-xs text-slate-400">지방세</p>
                <p className="font-mono text-xl font-bold text-violet-200">{won(local)}</p>
              </div>
            </div>

            {/* 국세:지방세 비율 막대 */}
            <div className="mt-3">
              <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="h-3 w-full" role="img" aria-label={`국세 ${natPct}%, 지방세 ${100 - natPct}%`}>
                <rect width={100} height={4} rx={2} fill="rgba(167,139,250,0.7)" />
                <rect width={natPct} height={4} rx={2} fill="rgba(56,189,248,0.7)" />
              </svg>
              <p className="mt-1 text-xs text-slate-400">국세 {natPct}% · 지방세 {100 - natPct}%</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 세금 분류 게임 (게임 · violet)
// ══════════════════════════════════════════════════════════════
type GameMode = "level" | "di";
const ROUND = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function GameTab() {
  const [mode, setMode] = useState<GameMode>("level");
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [deck, setDeck] = useState<TaxCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  // di 모드는 직접/간접 구분이 있는 국세 보통세만
  const pool = mode === "level" ? ALL_TAX_CARDS : ALL_TAX_CARDS.filter((c) => c.di);
  const options = mode === "level" ? (["국세", "지방세"] as const) : (["직접세", "간접세"] as const);

  function start(m: GameMode) {
    const p = m === "level" ? ALL_TAX_CARDS : ALL_TAX_CARDS.filter((c) => c.di);
    setMode(m);
    setDeck(shuffle(p).slice(0, ROUND));
    setIdx(0);
    setScore(0);
    setPicked(null);
    setPhase("playing");
  }

  const cur = deck[idx];
  const answer = cur ? (mode === "level" ? cur.level : cur.di) : null;

  function choose(opt: string) {
    if (picked !== null || !cur) return;
    setPicked(opt);
    if (opt === answer) setScore((s) => s + 1);
  }

  function next() {
    if (idx + 1 >= deck.length) setPhase("done");
    else {
      setIdx((i) => i + 1);
      setPicked(null);
    }
  }

  if (phase === "idle") {
    return (
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-6 text-center">
        <p className="text-lg font-bold text-violet-100">🎯 세금 분류 게임</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-300">
          세금 이름이 나오면 어느 분류에 속하는지 맞혀 보세요. 두 가지 모드가 있어요.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => start("level")}
            className="rounded-xl border-2 border-violet-400/60 bg-violet-400/20 px-6 py-2.5 text-base font-bold text-violet-100 transition hover:bg-violet-400/30"
          >
            국세 vs 지방세
          </button>
          <button
            type="button"
            onClick={() => start("di")}
            className="rounded-xl border-2 border-emerald-400/60 bg-emerald-400/15 px-6 py-2.5 text-base font-bold text-emerald-100 transition hover:bg-emerald-400/25"
          >
            직접세 vs 간접세
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">‘직접세 vs 간접세’는 국세 중 구분이 있는 세금만 나와요.</p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-6 text-center">
        <p className="text-lg font-bold text-violet-100">🏁 게임 끝!</p>
        <div className="mx-auto mt-3 w-fit rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/10 px-8 py-4">
          <p className="font-mono text-4xl font-bold text-emerald-100">{score} / {deck.length}</p>
          <p className="mt-1 text-xs text-slate-300">{mode === "level" ? "국세·지방세" : "직접세·간접세"} 분류</p>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => start(mode)} className="rounded-xl border-2 border-violet-400/60 bg-violet-400/20 px-6 py-2.5 text-base font-bold text-violet-100 transition hover:bg-violet-400/30">
            ↺ 같은 모드 다시
          </button>
          <button type="button" onClick={() => setPhase("idle")} className="rounded-xl border-2 border-white/15 bg-white/5 px-6 py-2.5 text-base font-bold text-slate-200 transition hover:bg-white/10">
            모드 선택으로
          </button>
        </div>
      </div>
    );
  }

  // playing
  const progress = Math.round((idx / deck.length) * 100);
  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-mono font-bold text-emerald-200">점수 {score}</span>
        <span className="font-mono text-slate-400">{idx + 1} / {deck.length}</span>
      </div>
      <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="mt-1.5 h-1.5 w-full" aria-hidden="true">
        <rect width={100} height={4} rx={2} fill="rgba(255,255,255,0.08)" />
        <rect width={progress} height={4} rx={2} fill="#a78bfa" />
      </svg>

      <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/50 p-6 text-center">
        <span className="text-5xl">{cur?.emoji}</span>
        <p className="mt-2 text-2xl font-bold text-slate-100">{cur?.name}</p>
        <p className="mt-3 text-sm text-slate-300">이 세금은 어디에 속할까요?</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {options.map((opt) => {
            const isAns = opt === answer;
            const isPick = opt === picked;
            let tone = "border-white/10 bg-white/5 text-slate-100 hover:border-violet-400/50 hover:bg-violet-400/15";
            if (picked !== null) {
              if (isAns) tone = "border-emerald-400/70 bg-emerald-400/20 text-emerald-100";
              else if (isPick) tone = "border-rose-400/70 bg-rose-400/20 text-rose-100";
              else tone = "border-white/10 bg-white/5 text-slate-500";
            }
            return (
              <button key={opt} type="button" onClick={() => choose(opt)} disabled={picked !== null} className={"rounded-xl border-2 px-8 py-3 text-lg font-bold transition " + tone}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* 해설 */}
      <div className="mt-3 min-h-[3.5rem]">
        {picked !== null && cur ? (
          <div className={"rounded-xl border-l-4 px-4 py-3 text-sm " + (picked === answer ? "border-emerald-400 bg-emerald-400/[0.08] text-slate-200" : "border-rose-400 bg-rose-400/[0.08] text-slate-200")}>
            <p className="font-bold">{picked === answer ? "✓ 정답!" : "✗ 아쉬워요"} — {cur.name}은(는) <b className="text-emerald-200">{answer}</b>예요.</p>
            <p className="mt-1 text-slate-300">분류: {cur.level} · {cur.path} · {cur.def}</p>
            <button type="button" onClick={next} className="mt-2 rounded-lg border border-violet-400/50 bg-violet-400/15 px-4 py-1.5 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25">
              {idx + 1 >= deck.length ? "결과 보기 →" : "다음 문제 →"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
