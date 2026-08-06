"use client";

import { useEffect, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "pp_vs_pct",
    prompt:
      "어떤 값이 2%에서 5%로 바뀐 상황을 예로 들어, ‘3%p 올랐다’와 ‘150% 올랐다(상대변화)’가 각각 무엇을 뜻하는지, 그리고 ‘3% 올랐다’가 왜 틀린(혼동된) 표현인지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 3%p는 두 백분율의 차이(5−2), 150%는 기준(2)에 대한 상대적 증가((5−2)/2×100)이다. ‘3% 올랐다’는 %p 값을 %로 잘못 말한 것이라 틀리다.",
  },
  {
    id: "spot_error",
    prompt:
      "탭①의 혼용 오류 사례처럼 언론이 %p를 %로 바꿔 쓰면 변화가 실제보다 크거나 작게 느껴질 수 있어요. ‘점유율 50% 감소’(실제 2%→1%, 1%p 감소) 같은 예를 들어, 왜 사람들이 오해하게 되는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 2%→1%은 1%p 감소일 뿐인데 상대변화(50%)로 말하면 절반이나 줄어든 것처럼 훨씬 크게 느껴져 오해를 준다.",
  },
  {
    id: "real_use",
    prompt:
      "기준금리·실업률·지지율처럼 그 자체가 이미 %인 지표의 ‘변화’를 말할 때 왜 %가 아니라 %p를 써야 하는지 정리하고, 주변에서 %와 %p를 구분해서 써야 할 상황을 하나 찾아 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 이미 백분율인 값의 증감은 두 값의 차이이므로 %p가 정확하다. 예: 우리 반 찬성 비율이 40%에서 45%가 되면 5%p 오른 것.",
  },
];

// ─── 포맷 ─────────────────────────────────────────────────────
function nf(v: number): string {
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? String(r) : String(r);
}
function ppText(before: number, after: number): string {
  const d = after - before;
  return `${d >= 0 ? "+" : ""}${nf(d)}%p`;
}
function relText(before: number, after: number): string {
  if (before === 0) return "—";
  const r = ((after - before) / before) * 100;
  return `${r >= 0 ? "+" : ""}${nf(r)}%`;
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "cases" | "quiz";

export default function PercentagePointLab() {
  const [tab, setTab] = useState<Tab>("cases");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">📊 퍼센트(%) vs 퍼센트포인트(%p)</h3>
        <p className="mt-2 leading-7 text-slate-300">
          이미 백분율인 지표가 <b className="text-emerald-200">얼마나 변했는지</b> 말할 때는 %가 아니라{" "}
          <b className="text-emerald-200">%p(퍼센트포인트)</b>를 써야 해요. 실제 기사 사례로 차이를 확인하고,
          30초 스피드 퀴즈로 확실히 익혀 봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "cases"} onClick={() => setTab("cases")}>
          ① 기사 속 %p — 사례와 계산기
        </TabButton>
        <TabButton active={tab === "quiz"} onClick={() => setTab("quiz")}>
          ② 30초 스피드 퀴즈
        </TabButton>
      </div>

      <div className="mt-4">{tab === "cases" ? <CasesTab /> : <QuizTab />}</div>

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
// 탭 ① 기사 속 %p — 사례 + 변화 계산기
// ══════════════════════════════════════════════════════════════
type Source = { label: string; url: string };
type CaseItem = {
  id: string;
  title: string;
  before: number;
  after: number;
  desc: string;
  source?: Source;
};

const CORRECT_CASES: CaseItem[] = [
  {
    id: "base_rate",
    title: "🏦 한국은행 기준금리 인상",
    before: 2.5,
    after: 2.75,
    desc: "기준금리를 연 2.50%에서 2.75%로 올렸어요. 오른 정도는 0.25%p — ‘0.25% 인상’이 아니라 ‘0.25%p 인상’이 맞아요.",
    source: { label: "파이낸셜뉴스 2026.07.16", url: "https://www.fnnews.com/news/202607160952022625" },
  },
  {
    id: "growth",
    title: "📈 경제성장률 변화 (수업 예시)",
    before: 2,
    after: 5,
    desc: "전년 2%에서 올해 5%로. ‘3%p 증가’도 맞고 ‘150% 증가(상대변화)’도 맞아요. 하지만 ‘3% 증가’라고 하면 틀려요!",
  },
  {
    id: "unemp",
    title: "👷 실업률 상승",
    before: 4,
    after: 6,
    desc: "실업률이 4%에서 6%로. 2%p 상승이에요. 이것을 ‘2% 상승’이라 하면 틀리고, 상대적으로는 50% 늘어난 거예요.",
    source: { label: "국립국어원 상담 사례", url: "https://korean.go.kr/front/mcfaq/mcfaqView.do?mn_id=217&mcfaq_seq=9129" },
  },
];

const WRONG_CASES: { id: string; title: string; wrong: string; right: string; source?: Source }[] = [
  {
    id: "japan",
    title: "🇯🇵 일본은행 재할인율",
    wrong: "신문 1면 머리기사: “재할인율 0.75% 인하”",
    right: "1.75%에서 1.00%로 내렸으니 실제로는 0.75%p 인하. %p를 %로 혼동한 대표 사례예요.",
    source: { label: "김진호 교수 칼럼(한경 생글생글)", url: "https://sgsg.hankyung.com/article/2006032963621" },
  },
  {
    id: "share",
    title: "📉 점유율 과장 표현",
    wrong: "광고 문구: “경쟁사 점유율 무려 50% 감소!”",
    right: "점유율이 2%에서 1%로 줄었을 뿐(1%p 감소). 상대변화(50%)로 부풀려 훨씬 큰 변화처럼 보이게 한 거예요.",
    source: { label: "퍼센트 포인트 — 나무위키", url: "https://namu.wiki/w/%ED%8D%BC%EC%84%BC%ED%8A%B8%20%ED%8F%AC%EC%9D%B8%ED%8A%B8" },
  },
];

function CasesTab() {
  return (
    <div className="space-y-4">
      {/* 개념 정의 */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.07] p-4">
          <p className="text-sm font-bold text-sky-200">% (퍼센트, 백분율)</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            기준량을 100이라 할 때 비교하는 양의 <b className="text-sky-200">비율</b>. 기준 대비 상대적 크기·변화를 나타내요.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.07] p-4">
          <p className="text-sm font-bold text-emerald-200">%p (퍼센트포인트)</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            백분율로 표현된 수치가 이전보다 증가·감소한 <b className="text-emerald-200">양(두 %의 차이)</b>. 단위는 %p, %P, %포인트.
          </p>
        </div>
      </div>

      {/* 변화 계산기 */}
      <ChangeCalculator />

      {/* 올바른 사용 사례 */}
      <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
        <p className="text-sm font-bold text-emerald-200">✅ 실제 기사 속 올바른 %p 사용</p>
        <div className="mt-3 space-y-2">
          {CORRECT_CASES.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-bold text-slate-100">{c.title}</p>
                <p className="font-mono text-sm">
                  <span className="text-slate-400">{nf(c.before)}% → {nf(c.after)}%</span>
                  <span className="ml-2 rounded bg-emerald-400/15 px-1.5 py-0.5 font-bold text-emerald-200">{ppText(c.before, c.after)}</span>
                  <span className="ml-1 rounded bg-sky-400/15 px-1.5 py-0.5 font-bold text-sky-200">상대 {relText(c.before, c.after)}</span>
                </p>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-300">{c.desc}</p>
              {c.source ? (
                <a href={c.source.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-slate-500 underline hover:text-slate-300">
                  출처: {c.source.label} ↗
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* 혼용 오류 사례 */}
      <div className="rounded-2xl border border-rose-400/25 bg-gradient-to-br from-rose-500/[0.06] to-orange-500/[0.04] p-4">
        <p className="text-sm font-bold text-rose-200">⚠️ %와 %p를 혼동한(오해를 부르는) 표현</p>
        <div className="mt-3 space-y-2">
          {WRONG_CASES.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
              <p className="text-sm font-bold text-slate-100">{c.title}</p>
              <p className="mt-1.5 rounded-lg border-l-4 border-rose-400/70 bg-rose-400/[0.08] px-3 py-1.5 text-sm text-rose-100">
                ❌ {c.wrong}
              </p>
              <p className="mt-1.5 rounded-lg border-l-4 border-emerald-400/70 bg-emerald-400/[0.08] px-3 py-1.5 text-sm text-slate-200">
                ✅ {c.right}
              </p>
              {c.source ? (
                <a href={c.source.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-slate-500 underline hover:text-slate-300">
                  출처: {c.source.label} ↗
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const CALC_PRESETS: { label: string; before: number; after: number }[] = [
  { label: "경제성장률 2%→5%", before: 2, after: 5 },
  { label: "기준금리 2.5%→2.75%", before: 2.5, after: 2.75 },
  { label: "실업률 4%→6%", before: 4, after: 6 },
  { label: "지지율 40%→45%", before: 40, after: 45 },
  { label: "점유율 2%→1%", before: 2, after: 1 },
];

function ChangeCalculator() {
  const [before, setBefore] = useState(2);
  const [after, setAfter] = useState(5);

  const dpp = after - before;
  const rel = before !== 0 ? ((after - before) / before) * 100 : NaN;
  const up = dpp >= 0;

  // 막대 스케일
  const max = Math.max(before, after, 1);
  const pct = (v: number) => (v / max) * 100;

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.04] p-4">
      <p className="text-sm font-bold text-emerald-200">🧮 변화 계산기 — %p와 %를 동시에 보기</p>
      <p className="mt-1 text-sm text-slate-300">
        이전 값과 이후 값(둘 다 %)을 바꿔 보세요. 같은 변화가 <b className="text-emerald-200">%p</b>와{" "}
        <b className="text-sky-200">상대 %</b>로 얼마나 다르게 표현되는지 확인해요.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {CALC_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => { setBefore(p.before); setAfter(p.after); }}
            className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/20"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-300">
          <span className="font-bold text-slate-200">이전 값 (%)</span>
          <input type="number" step={0.05} value={before} onChange={(e) => setBefore(Number(e.target.value))} className="mt-1.5 w-full rounded-md border border-white/10 bg-slate-900 px-2 py-1.5 text-right font-mono text-base text-white outline-none focus:border-emerald-400/60" />
        </label>
        <label className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-slate-300">
          <span className="font-bold text-slate-200">이후 값 (%)</span>
          <input type="number" step={0.05} value={after} onChange={(e) => setAfter(Number(e.target.value))} className="mt-1.5 w-full rounded-md border border-white/10 bg-slate-900 px-2 py-1.5 text-right font-mono text-base text-white outline-none focus:border-emerald-400/60" />
        </label>
      </div>

      {/* 막대 비교 */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/50 p-3">
        <svg viewBox="0 0 360 92" className="w-full select-none" role="img" aria-label="이전·이후 값 비교 막대">
          <text x={4} y={22} className="fill-slate-400 text-[10px]">이전 {nf(before)}%</text>
          <rect x={70} y={12} width={Math.max(0, pct(before) * 2.7)} height={16} rx={3} fill="#64748b" />
          <text x={4} y={62} className="fill-slate-400 text-[10px]">이후 {nf(after)}%</text>
          <rect x={70} y={52} width={Math.max(0, pct(after) * 2.7)} height={16} rx={3} fill={up ? "#34d399" : "#fb7185"} />
          {/* %p 차이 표시 */}
          <text x={356} y={86} textAnchor="end" className="fill-emerald-200 font-mono text-[11px] font-bold">
            차이 = {ppText(before, after)}
          </text>
        </svg>
      </div>

      {/* 결과 문장 */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/[0.10] px-4 py-3">
          <p className="text-xs text-slate-400">퍼센트포인트 변화 (두 값의 차이)</p>
          <p className="font-mono text-2xl font-bold text-emerald-200">{ppText(before, after)}</p>
          <p className="mt-0.5 text-xs text-slate-400">= {nf(after)} − {nf(before)}</p>
        </div>
        <div className="rounded-xl border border-sky-400/40 bg-sky-400/[0.10] px-4 py-3">
          <p className="text-xs text-slate-400">상대변화 (기준 대비 %)</p>
          <p className="font-mono text-2xl font-bold text-sky-200">{relText(before, after)}</p>
          <p className="mt-0.5 text-xs text-slate-400">= ({nf(after)} − {nf(before)}) ÷ {nf(before)} × 100</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border-l-4 border-amber-400 bg-amber-400/[0.08] px-4 py-2.5 text-sm text-slate-200">
        📝 올바른 표현: <b className="text-emerald-200">“{ppText(before, after)} {up ? "상승" : "하락"}”</b> 또는{" "}
        <b className="text-sky-200">“상대적으로 {relText(before, after)} {up ? "증가" : "감소"}”</b>.{" "}
        <span className="text-rose-200">“{nf(dpp)}% {up ? "상승" : "하락"}”이라고 하면 틀려요</span> — 그 숫자는 %가 아니라 %p예요!
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 30초 스피드 퀴즈
// ══════════════════════════════════════════════════════════════
type Quiz = { prompt: React.ReactNode; options: string[]; answer: number; explain: string };

const CONTEXTS = ["지지율", "실업률", "찬성률", "시장 점유율", "투표율", "이자율"];

function randInt(a: number, b: number): number {
  return a + Math.floor(Math.random() * (b - a + 1));
}
function shuffle<T>(arr: T[]): { arr: T[]; index: (orig: number) => number } {
  const idx = arr.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const out = idx.map((i) => arr[i]);
  return { arr: out, index: (orig) => idx.indexOf(orig) };
}

function genQuiz(): Quiz {
  const ctx = CONTEXTS[randInt(0, CONTEXTS.length - 1)];
  const type = randInt(0, 2);
  const a = randInt(2, 9) * 5; // 10~45, 5의 배수
  let b = a + (randInt(0, 1) ? 1 : -1) * randInt(1, 4) * 5;
  if (b <= 0) b = a + 5;
  const dpp = b - a;
  const rel = Math.round(((b - a) / a) * 100);

  if (type === 0) {
    // 몇 %p 변화?
    const opts = [`${dpp > 0 ? "+" : ""}${dpp}%p`, `${rel > 0 ? "+" : ""}${rel}%p`, `${dpp > 0 ? "+" : ""}${dpp}%`, `${b}%p`];
    const s = shuffle(opts);
    return {
      prompt: (
        <>
          {ctx}이 <b className="text-white">{a}%</b>에서 <b className="text-white">{b}%</b>로 바뀌었어요. 몇 <b className="text-emerald-200">%p</b> 변했나요?
        </>
      ),
      options: s.arr,
      answer: s.index(0),
      explain: `두 백분율의 차이 = ${b} − ${a} = ${dpp}%p.`,
    };
  }
  if (type === 1) {
    // 상대 몇 %?
    const opts = [`${rel > 0 ? "+" : ""}${rel}%`, `${dpp > 0 ? "+" : ""}${dpp}%`, `${dpp > 0 ? "+" : ""}${dpp}%p`, `${b}%`];
    const s = shuffle(opts);
    return {
      prompt: (
        <>
          {ctx}이 <b className="text-white">{a}%</b>에서 <b className="text-white">{b}%</b>로 바뀌었어요. 기준({a}%) 대비 <b className="text-sky-200">상대적으로 몇 %</b> 변했나요?
        </>
      ),
      options: s.arr,
      answer: s.index(0),
      explain: `상대변화 = (${b} − ${a}) ÷ ${a} × 100 = ${rel}%.`,
    };
  }
  // 옳은 표현 고르기
  const opts = [
    `${dpp > 0 ? "+" : ""}${dpp}%p ${dpp > 0 ? "상승" : "하락"}`,
    `${dpp > 0 ? "+" : ""}${dpp}% ${dpp > 0 ? "상승" : "하락"}`,
    `${rel > 0 ? "+" : ""}${rel}%p ${dpp > 0 ? "상승" : "하락"}`,
    `${b}% ${dpp > 0 ? "상승" : "하락"}`,
  ];
  const s = shuffle(opts);
  return {
    prompt: (
      <>
        {ctx}이 <b className="text-white">{a}%</b>에서 <b className="text-white">{b}%</b>가 되었어요. <b className="text-emerald-200">변화량을 바르게</b> 나타낸 것은?
      </>
    ),
    options: s.arr,
    answer: s.index(0),
    explain: `이미 %인 값의 변화량은 차이로 표현 → ${dpp}%p ${dpp > 0 ? "상승" : "하락"}. (‘${dpp}% 상승’은 %p를 %로 혼동한 표현)`,
  };
}

const DURATION = 30;

function QuizTab() {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [q, setQ] = useState<Quiz | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [best, setBest] = useState(0);
  const [last, setLast] = useState<{ ok: boolean; explain: string } | null>(null);
  const [locked, setLocked] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      setPhase("done");
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === "done") setBest((b) => Math.max(b, score));
  }, [phase, score]);

  function start() {
    setScore(0);
    setAttempts(0);
    setLast(null);
    setLocked(null);
    setTimeLeft(DURATION);
    setQ(genQuiz());
    setPhase("playing");
  }

  function answer(i: number) {
    if (!q || phase !== "playing" || locked !== null) return;
    const ok = i === q.answer;
    setLocked(i);
    setAttempts((n) => n + 1);
    if (ok) setScore((n) => n + 1);
    setLast({ ok, explain: q.explain });
    // 다음 문제 즉시 (짧은 시각 피드백은 아래 상태표시로 대체)
    setQ(genQuiz());
    setLocked(null);
  }

  if (phase === "idle") {
    return (
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-6 text-center">
        <p className="text-lg font-bold text-violet-100">⏱️ 30초 스피드 퀴즈</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-300">
          30초 동안 %와 %p 문제를 최대한 많이 맞혀 보세요! 답을 클릭하면 바로 다음 문제로 넘어가요.
        </p>
        <button
          type="button"
          onClick={start}
          className="mt-4 rounded-xl border-2 border-violet-400/60 bg-violet-400/20 px-8 py-2.5 text-base font-bold text-violet-100 transition hover:bg-violet-400/30"
        >
          시작하기 →
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const acc = attempts > 0 ? Math.round((score / attempts) * 100) : 0;
    return (
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-6 text-center">
        <p className="text-lg font-bold text-violet-100">⏰ 시간 종료!</p>
        <div className="mt-3 flex flex-wrap items-stretch justify-center gap-2">
          <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/10 px-6 py-3">
            <p className="font-mono text-3xl font-bold text-emerald-100">{score}</p>
            <p className="text-xs text-slate-300">맞힌 문제</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-6 py-3">
            <p className="font-mono text-3xl font-bold text-slate-100">{acc}%</p>
            <p className="text-xs text-slate-400">정확도 ({score}/{attempts})</p>
          </div>
          <div className="rounded-2xl border border-amber-400/40 bg-amber-400/[0.08] px-6 py-3">
            <p className="font-mono text-3xl font-bold text-amber-200">{Math.max(best, score)}</p>
            <p className="text-xs text-slate-400">최고 기록</p>
          </div>
        </div>
        <button
          type="button"
          onClick={start}
          className="mt-4 rounded-xl border-2 border-violet-400/60 bg-violet-400/20 px-8 py-2.5 text-base font-bold text-violet-100 transition hover:bg-violet-400/30"
        >
          ↺ 다시 도전
        </button>
      </div>
    );
  }

  // playing
  const timePct = (timeLeft / DURATION) * 100;
  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
      {/* 상단 상태 */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm font-bold text-emerald-200">점수 {score}</span>
        <span className={"font-mono text-2xl font-bold " + (timeLeft <= 5 ? "text-rose-300" : "text-violet-100")}>{timeLeft}s</span>
        <span className="font-mono text-sm text-slate-400">시도 {attempts}</span>
      </div>
      <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="mt-1.5 h-1.5 w-full" aria-hidden="true">
        <rect width={100} height={4} rx={2} fill="rgba(255,255,255,0.08)" />
        <rect width={timePct} height={4} rx={2} fill={timeLeft <= 5 ? "#fb7185" : "#a78bfa"} />
      </svg>

      {/* 직전 결과 */}
      <div className="mt-2 h-8">
        {last ? (
          <p className={"rounded-lg px-3 py-1.5 text-xs " + (last.ok ? "bg-emerald-400/10 text-emerald-200" : "bg-rose-400/10 text-rose-200")}>
            {last.ok ? "✓ 정답!" : "✗ 오답 — "}
            {last.ok ? "" : last.explain}
          </p>
        ) : null}
      </div>

      {/* 문제 */}
      <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <p className="text-lg font-bold leading-8 text-slate-100">{q?.prompt}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {q?.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => answer(i)}
              className="rounded-xl border-2 border-white/10 bg-white/5 px-3 py-3 font-mono text-base font-bold text-slate-100 transition hover:border-violet-400/50 hover:bg-violet-400/15"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">답을 클릭하면 바로 다음 문제로 넘어가요</p>
    </div>
  );
}
