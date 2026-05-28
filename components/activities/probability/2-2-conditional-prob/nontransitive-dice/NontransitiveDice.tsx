"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

/* ──────────────────────────────────────────────────────────────
   🎲 신기한(비추이적) 주사위  (3 tabs)
   세 주사위:
     A = [3, 3, 3, 3, 3, 6]   (평균 3.5)
     B = [2, 2, 2, 5, 5, 5]   (평균 3.5)
     C = [1, 4, 4, 4, 4, 4]   (평균 3.5)
   비추이성:
     P(A>B) = 7/12 ≈ 58.3%  /  P(B>C) = 7/12 ≈ 58.3%  /  P(C>A) = 25/36 ≈ 69.4%
   ────────────────────────────────────────────────────────────── */

const DICE: Record<"A" | "B" | "C", number[]> = {
  A: [3, 3, 3, 3, 3, 6],
  B: [2, 2, 2, 5, 5, 5],
  C: [1, 4, 4, 4, 4, 4],
};
type DieName = "A" | "B" | "C";

function choice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================
// 공용: 다이 SVG (이전 활동들과 일관성 — 색 톤 매칭)
// ============================================================

function DieSVG({
  name, value, rolling, size = 48,
}: { name: DieName; value: number; rolling?: boolean; size?: number }) {
  const tone =
    name === "A" ? { stroke: "#60a5fa", fill: "rgba(59,130,246,0.20)", text: "#bfdbfe" }
    : name === "B" ? { stroke: "#4ade80", fill: "rgba(34,197,94,0.20)", text: "#bbf7d0" }
    : { stroke: "#fb923c", fill: "rgba(249,115,22,0.20)", text: "#fed7aa" };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={`block ${rolling ? "animate-[dieShake_0.15s_infinite]" : ""}`}
      aria-label={`주사위 ${name} = ${value}`}
    >
      <rect x={4} y={4} width={40} height={40} rx={10} ry={10} fill={tone.fill} stroke={tone.stroke} strokeWidth={2} />
      <text x={24} y={24} textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={900} fill={tone.text}>
        {value}
      </text>
    </svg>
  );
}

// ============================================================
// 탭 1 — 🎲 주사위 소개 + 직관 퀴즈
// ============================================================

type QuizMatch = "ab" | "bc" | "ca";
type QuizAns = "A" | "B" | "C" | "T";

const QUIZ_CORRECT: Record<QuizMatch, QuizAns> = { ab: "A", bc: "B", ca: "C" };
const QUIZ_MSGS: Record<QuizMatch, Record<QuizAns, string>> = {
  ab: {
    A: "✅ 정답! A가 B를 약 58.3% 확률로 이깁니다. A의 3이 B의 2를 이기는 경우가 많기 때문입니다.",
    B: "❌ 아닙니다! 실제로는 A가 B를 약 58.3% 확률로 이깁니다.",
    C: "❌ 이 대결엔 C가 없습니다.",
    T: "❌ 비슷하지 않습니다. A가 B를 약 58.3%로 꽤 자주 이깁니다.",
  },
  bc: {
    A: "❌ 이 대결엔 A가 없습니다.",
    B: "✅ 정답! B가 C를 약 58.3% 확률로 이깁니다. B의 5가 C의 4를 이기는 경우가 결정적입니다.",
    C: "❌ 아닙니다! 실제로는 B가 C를 약 58.3% 확률로 이깁니다.",
    T: "❌ 비슷하지 않습니다. B가 C를 약 58.3%로 자주 이깁니다.",
  },
  ca: {
    A: "❌ 직관적으로는 맞을 것 같지만, 실제로는 C가 A를 약 69.4%로 이깁니다!",
    B: "❌ 이 대결엔 B가 없습니다.",
    C: "✅ 정답! 놀랍게도 C가 A를 약 69.4%로 이깁니다! A≻B, B≻C 이지만 C≻A 입니다.",
    T: "❌ 전혀 비슷하지 않습니다. C가 A를 약 69.4%로 압도합니다!",
  },
};

function IntroTab() {
  const [picks, setPicks] = useState<Record<QuizMatch, QuizAns | null>>({ ab: null, bc: null, ca: null });
  const [revealAll, setRevealAll] = useState(false);

  function pick(m: QuizMatch, a: QuizAns) {
    setPicks((p) => ({ ...p, [m]: a }));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/35 bg-gradient-to-r from-violet-500/15 to-indigo-500/10 p-4 text-center">
        <h4 className="text-lg font-bold text-violet-300">🎲 신기한(비추이적) 주사위</h4>
        <p className="mt-1 text-sm leading-7 text-slate-300">
          A, B, C 세 주사위가 있습니다. A는 B를 자주 이기고, B는 C를 자주 이기는데...
          <br />
          그렇다면 A가 C를 이길까요? 🤔 직관을 먼저 테스트해 보세요!
        </p>
      </div>

      {/* 주사위 카드 3개 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-violet-300">🎲 세 주사위 살펴보기</h5>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <DiceIntroCard name="A" desc="3×5, 6×1" />
          <DiceIntroCard name="B" desc="2×3, 5×3" />
          <DiceIntroCard name="C" desc="1×1, 4×5" />
        </div>
        <div className="mt-3 rounded-md border border-amber-300/30 bg-amber-300/[0.08] px-3 py-2 text-center text-xs text-amber-200">
          ⭐ 세 주사위 모두 <b>평균 3.5</b>로 동일합니다. 그런데 승부 결과는 완전히 다릅니다!
        </div>
      </section>

      {/* 직관 퀴즈 */}
      <section className="rounded-xl border border-violet-400/30 bg-violet-400/[0.06] p-4">
        <h5 className="text-sm font-bold text-violet-300">🤔 직관 퀴즈 — 어느 주사위가 이길까요?</h5>

        <QuizMatchBlock
          label="① A와 B가 대결하면?"
          opts={[
            { ans: "A", label: "A 승", tone: "A" },
            { ans: "B", label: "B 승", tone: "B" },
            { ans: "T", label: "비슷함", tone: "T" },
          ]}
          pick={picks.ab}
          onPick={(a) => pick("ab", a)}
          match="ab"
        />
        <QuizMatchBlock
          label="② B와 C가 대결하면?"
          opts={[
            { ans: "B", label: "B 승", tone: "B" },
            { ans: "C", label: "C 승", tone: "C" },
            { ans: "T", label: "비슷함", tone: "T" },
          ]}
          pick={picks.bc}
          onPick={(a) => pick("bc", a)}
          match="bc"
        />
        <QuizMatchBlock
          label="③ C와 A가 대결하면? (위 결과를 바탕으로 예상해 보세요)"
          opts={[
            { ans: "C", label: "C 승", tone: "C" },
            { ans: "A", label: "A 승", tone: "A" },
            { ans: "T", label: "비슷함", tone: "T" },
          ]}
          pick={picks.ca}
          onPick={(a) => pick("ca", a)}
          match="ca"
        />

        <button
          type="button"
          onClick={() => setRevealAll(true)}
          className="mt-3 w-full rounded-xl border-2 border-violet-400/50 bg-violet-400/10 px-4 py-2.5 text-sm font-bold text-violet-200 transition hover:bg-violet-400/25"
        >
          🔍 전체 결과 공개하기
        </button>

        {revealAll ? (
          <div className="mt-3 rounded-xl border border-violet-400/35 bg-violet-400/[0.08] p-4 animate-[fadein_0.4s_ease]">
            <h6 className="text-sm font-bold text-violet-300">🎯 놀라운 결과!</h6>
            <div className="my-2 text-center text-xl font-black tracking-widest text-amber-300">
              A → B → C → A
            </div>
            <p className="text-xs leading-7 text-slate-200">
              A가 B를 이기고(약 58.3%), B가 C를 이기고(약 58.3%), 그런데 <b>C가 A를 이깁니다</b>(약 69.4%)!
              <br />
              가위-바위-보처럼 순환하는 구조를 <b>비추이성(Non-transitivity)</b>이라고 합니다.
              <br />
              <br />
              평균이 똑같은 주사위인데도 이런 일이 생기는 이유는 무엇일까요? 탭 2에서 확률의 곱셈정리로 분석해 봅시다!
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-bold">
              <span className="rounded-full border border-blue-400/40 bg-blue-400/15 px-3 py-1 text-blue-200">P(A&gt;B) = 7/12 ≈ 58.3%</span>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-emerald-200">P(B&gt;C) = 7/12 ≈ 58.3%</span>
              <span className="rounded-full border border-orange-400/40 bg-orange-400/15 px-3 py-1 text-orange-200">P(C&gt;A) = 25/36 ≈ 69.4%</span>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function DiceIntroCard({ name, desc }: { name: DieName; desc: string }) {
  const tone =
    name === "A" ? "border-blue-400/45 bg-blue-400/[0.12]"
    : name === "B" ? "border-emerald-400/45 bg-emerald-400/[0.12]"
    : "border-orange-400/45 bg-orange-400/[0.12]";
  const nameTone =
    name === "A" ? "text-blue-300"
    : name === "B" ? "text-emerald-300"
    : "text-orange-300";
  return (
    <div className={`rounded-xl border-2 p-4 text-center ${tone}`}>
      <div className={`text-2xl font-black ${nameTone}`}>{name}</div>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {DICE[name].map((v, i) => (
          <DieSVG key={i} name={name} value={v} size={34} />
        ))}
      </div>
      <div className="mt-2 text-xs leading-6 text-slate-400">
        눈 : <b className="text-slate-100">{desc}</b>
        <br />
        평균 : <b className="text-slate-100">3.5</b>
      </div>
    </div>
  );
}

function QuizMatchBlock({
  label, opts, pick, onPick, match,
}: {
  label: string;
  opts: { ans: QuizAns; label: string; tone: "A" | "B" | "C" | "T" }[];
  pick: QuizAns | null;
  onPick: (a: QuizAns) => void;
  match: QuizMatch;
}) {
  return (
    <div className="mt-3">
      <p className="text-sm text-slate-200">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {opts.map((o) => {
          const cls =
            o.tone === "A" ? "border-blue-400 text-blue-300 hover:bg-blue-400/15"
            : o.tone === "B" ? "border-emerald-400 text-emerald-300 hover:bg-emerald-400/15"
            : o.tone === "C" ? "border-orange-400 text-orange-300 hover:bg-orange-400/15"
            : "border-slate-400 text-slate-300 hover:bg-slate-400/12";
          const active = pick === o.ans;
          return (
            <button
              key={o.ans}
              type="button"
              onClick={() => onPick(o.ans)}
              className={`rounded-lg border-[1.5px] bg-transparent px-3.5 py-2 text-xs font-bold transition hover:scale-105 ${cls} ${active ? "ring-2 ring-white/20" : ""}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {pick ? (
        <div
          className={`mt-2 rounded-md px-3 py-2 text-xs leading-6 ${
            pick === QUIZ_CORRECT[match]
              ? "border border-emerald-400/35 bg-emerald-400/10 text-emerald-200"
              : "border border-red-400/35 bg-red-400/10 text-red-200"
          }`}
        >
          {QUIZ_MSGS[match][pick]}
        </div>
      ) : null}
    </div>
  );
}

// ============================================================
// 탭 2 — 📐 이론 계산 (확률의 곱셈정리)
// ============================================================

type Mvs = "ab" | "bc" | "ca";

function TheoryTab() {
  const [mvs, setMvs] = useState<Mvs>("ab");

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-400/15 to-orange-400/10 p-4 text-center">
        <h4 className="text-lg font-bold text-amber-300">📐 확률의 곱셈정리로 분석하기</h4>
        <p className="mt-1 text-sm leading-7 text-slate-300">
          P(A&gt;B) = P(A=3)×P(B&lt;3) + P(A=6)×P(B&lt;6) — 이 계산이 바로 <b>확률의 곱셈정리(전체확률의 법칙)</b>입니다!
        </p>
      </div>

      {/* 핵심 공식 */}
      <section className="rounded-xl border border-amber-300/35 bg-amber-300/[0.06] p-4 text-center">
        <h5 className="text-sm font-bold text-amber-300">📌 핵심 공식</h5>
        <p className="mt-2 text-base font-bold tracking-wide text-amber-100">
          P(A &gt; B) = Σ P(A=k) × P(B &lt; k)
        </p>
        <p className="text-xs text-slate-400">
          = P(A=k₁)·P(B&lt;k₁) + P(A=k₂)·P(B&lt;k₂) + ···
        </p>
        <p className="mt-2 text-xs leading-7 text-slate-300">
          A가 나올 수 있는 각 눈 k에 대해 &ldquo;A=k가 나왔을 때 B가 그보다 작을 확률&rdquo;을 곱하여 모두 더합니다.
          <br />
          → <b className="text-amber-300">이것이 바로 확률의 곱셈정리(전체확률의 법칙)의 적용!</b>
        </p>
      </section>

      {/* 대결 선택 탭 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-amber-300">🔍 대결 선택 후 단계별 계산 확인</h5>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(["ab", "bc", "ca"] as Mvs[]).map((m) => {
            const lbl = m === "ab" ? "A vs B" : m === "bc" ? "B vs C" : "C vs A";
            const active = mvs === m;
            const activeCls =
              m === "ab" ? "border-blue-400 bg-blue-400/25 text-blue-200"
              : m === "bc" ? "border-emerald-400 bg-emerald-400/25 text-emerald-200"
              : "border-orange-400 bg-orange-400/25 text-orange-200";
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMvs(m)}
                className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-bold transition ${
                  active ? activeCls : "border-slate-600 bg-transparent text-slate-500 hover:opacity-80"
                }`}
              >
                {lbl}
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          {mvs === "ab" ? <MatchPanelAB /> : mvs === "bc" ? <MatchPanelBC /> : <MatchPanelCA />}
        </div>
      </section>

      {/* 확률 비교 막대 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-amber-300">📊 확률 비교</h5>
        <div className="mt-3 space-y-3">
          <CompareBar label="P(A > B)" labelTone="text-blue-300" pct={58.3} display="7/12 = 58.3%" gradFrom="#3b82f6" gradTo="#60a5fa" />
          <CompareBar label="P(B > C)" labelTone="text-emerald-300" pct={58.3} display="7/12 = 58.3%" gradFrom="#16a34a" gradTo="#4ade80" />
          <CompareBar label="P(C > A)" labelTone="text-orange-300" pct={69.4} display="25/36 = 69.4%" gradFrom="#ea580c" gradTo="#fb923c" />
        </div>
      </section>

      {/* 핵심 인사이트 */}
      <section className="rounded-xl border-[1.5px] border-violet-400/35 bg-violet-400/[0.08] p-4">
        <h5 className="text-sm font-bold text-violet-300">💡 핵심 인사이트</h5>
        <p className="mt-2 text-xs leading-7 text-slate-200">
          세 주사위 모두 평균이 <b>3.5로 동일</b>하지만, <b>값의 분포 방식</b>이 다르기 때문에 이런 역설이 생깁니다.
          <br />
          <br />
          A는 대부분 3이지만 가끔 6이 나오고, B는 절반이 2, 절반이 5 입니다.
          <br />
          → A는 B의 2를 자주 이기지만 5에는 집니다. 그런데 3이 5개라 전체적으로 A가 유리합니다.
          <br />
          <br />
          C는 대부분 4인데, A의 대부분인 3보다 큽니다. 그래서 C가 A를 상대로 강합니다.
          <br />
          <br />
          <b className="text-amber-300">이처럼 &lsquo;평균이 같아도 분포가 다르면 다른 결과&rsquo;가 나올 수 있습니다!</b>
        </p>
      </section>
    </div>
  );
}

function CompareBar({
  label, labelTone, pct, display, gradFrom, gradTo,
}: { label: string; labelTone: string; pct: number; display: string; gradFrom: string; gradTo: string }) {
  const uid = useId();
  const gid = `cmp-grad-${uid}`;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className={`font-semibold ${labelTone}`}>{label}</span>
        <span className="font-bold text-amber-300">{display}</span>
      </div>
      <div className="relative h-[22px] overflow-hidden rounded-full bg-white/[0.07]">
        <svg viewBox="0 0 100 22" preserveAspectRatio="none" className="block h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={gradFrom} />
              <stop offset="100%" stopColor={gradTo} />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={Math.min(pct, 100)} height={22} fill={`url(#${gid})`} className="transition-all duration-1000" />
        </svg>
      </div>
    </div>
  );
}

// ── 매치별 패널 (스텝 카드 + 표) ──

function StepCard({ tone, label, title, children }: {
  tone: "blue" | "emerald" | "orange" | "violet";
  label: string; title: string; children: React.ReactNode;
}) {
  const border =
    tone === "blue" ? "border-blue-400"
    : tone === "emerald" ? "border-emerald-400"
    : tone === "orange" ? "border-orange-400"
    : "border-violet-400";
  const titleTone =
    tone === "blue" ? "text-blue-300"
    : tone === "emerald" ? "text-emerald-300"
    : tone === "orange" ? "text-orange-300"
    : "text-violet-300";
  return (
    <div className={`rounded-r-xl border-l-[3px] ${border} bg-white/[0.03] p-3`}>
      <p className={`text-[11px] font-bold ${titleTone}`}>{label}</p>
      <p className="text-sm font-bold text-slate-100">{title}</p>
      <div className="mt-1 text-xs leading-7 text-slate-300">{children}</div>
    </div>
  );
}

function ResultChip({ tone, children }: { tone: "ab" | "bc" | "ca"; children: React.ReactNode }) {
  const cls =
    tone === "ab" ? "border-blue-400/40 bg-blue-400/15 text-blue-200"
    : tone === "bc" ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
    : "border-orange-400/40 bg-orange-400/15 text-orange-200";
  return (
    <div className="mt-3 text-center">
      <span className={`inline-block rounded-full border px-3 py-1.5 text-xs font-bold ${cls}`}>
        {children}
      </span>
    </div>
  );
}

function MatchTableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  );
}

const TH = "border-b border-white/10 bg-white/[0.06] px-3 py-1.5 text-center font-semibold text-slate-300";
const TD_HI = "px-3 py-1.5 text-center font-bold text-amber-300";
const TD_WIN = "px-3 py-1.5 text-center bg-emerald-400/[0.08] text-emerald-200";
const TD_LOSE = "px-3 py-1.5 text-center bg-red-400/[0.08] text-red-200";

function MatchPanelAB() {
  return (
    <div className="space-y-2">
      <StepCard tone="blue" label="STEP 1" title="표본공간 확인">
        A = {"{3, 3, 3, 3, 3, 6}"} → P(A=3) = <b className="text-amber-300">5/6</b>, P(A=6) = <b className="text-amber-300">1/6</b>
        <br />
        B = {"{2, 2, 2, 5, 5, 5}"} → P(B=2) = <b className="text-amber-300">1/2</b>, P(B=5) = <b className="text-amber-300">1/2</b>
      </StepCard>
      <StepCard tone="emerald" label="STEP 2" title="곱셈정리 적용">
        P(A&gt;B | A=3) = P(B&lt;3) = P(B=2) = <b className="text-amber-300">1/2</b>
        <br />
        P(A&gt;B | A=6) = P(B&lt;6) = P(B=2)+P(B=5) = <b className="text-amber-300">1</b>
      </StepCard>
      <StepCard tone="orange" label="STEP 3" title="전체확률의 법칙으로 합산">
        P(A&gt;B) = P(A=3)×P(B&lt;3) + P(A=6)×P(B&lt;6)
        <br />
        = <span className="font-bold text-cyan-300">5/6 × 1/2</span> + <span className="font-bold text-cyan-300">1/6 × 1</span>
        <br />
        = <span className="font-bold text-cyan-300">5/12 + 2/12</span> = <b className="text-amber-300">7/12 ≈ 58.3%</b>
      </StepCard>
      <StepCard tone="violet" label="STEP 4" title="전체 경우의 수로 검증">
        총 36가지 경우 중 A&gt;B인 경우 : (3,2)×15가지 + (6,2)×3 + (6,5)×3 = 15+3+3 = <b className="text-amber-300">21가지</b>
        <br />
        P(A&gt;B) = <b className="text-amber-300">21/36 = 7/12 ✓</b>
      </StepCard>
      <MatchTableWrap>
        <thead><tr><th className={TH}>A＼B</th><th className={TH}>2 (확률 1/2)</th><th className={TH}>5 (확률 1/2)</th></tr></thead>
        <tbody>
          <tr><td className={TD_HI}>3 (확률 5/6)</td><td className={TD_WIN}>3&gt;2 ✅</td><td className={TD_LOSE}>3&lt;5 ❌</td></tr>
          <tr><td className={TD_HI}>6 (확률 1/6)</td><td className={TD_WIN}>6&gt;2 ✅</td><td className={TD_WIN}>6&gt;5 ✅</td></tr>
        </tbody>
      </MatchTableWrap>
      <ResultChip tone="ab">P(A&gt;B) = 7/12 ≈ 58.3% → A 우세</ResultChip>
    </div>
  );
}

function MatchPanelBC() {
  return (
    <div className="space-y-2">
      <StepCard tone="emerald" label="STEP 1" title="표본공간 확인">
        B = {"{2, 2, 2, 5, 5, 5}"} → P(B=2) = <b className="text-amber-300">1/2</b>, P(B=5) = <b className="text-amber-300">1/2</b>
        <br />
        C = {"{1, 4, 4, 4, 4, 4}"} → P(C=1) = <b className="text-amber-300">1/6</b>, P(C=4) = <b className="text-amber-300">5/6</b>
      </StepCard>
      <StepCard tone="emerald" label="STEP 2" title="곱셈정리 적용">
        P(B&gt;C | B=2) = P(C&lt;2) = P(C=1) = <b className="text-amber-300">1/6</b>
        <br />
        P(B&gt;C | B=5) = P(C&lt;5) = P(C=1)+P(C=4) = <b className="text-amber-300">1</b>
      </StepCard>
      <StepCard tone="orange" label="STEP 3" title="전체확률의 법칙으로 합산">
        P(B&gt;C) = P(B=2)×P(C&lt;2) + P(B=5)×P(C&lt;5)
        <br />
        = <span className="font-bold text-cyan-300">1/2 × 1/6</span> + <span className="font-bold text-cyan-300">1/2 × 1</span>
        <br />
        = <span className="font-bold text-cyan-300">1/12 + 6/12</span> = <b className="text-amber-300">7/12 ≈ 58.3%</b>
      </StepCard>
      <StepCard tone="violet" label="STEP 4" title="전체 경우의 수로 검증">
        총 36가지 경우 중 B&gt;C인 경우 : (2,1)×3 + (5,1)×3 + (5,4)×15 = 3+3+15 = <b className="text-amber-300">21가지</b>
        <br />
        P(B&gt;C) = <b className="text-amber-300">21/36 = 7/12 ✓</b>
      </StepCard>
      <MatchTableWrap>
        <thead><tr><th className={TH}>B＼C</th><th className={TH}>1 (확률 1/6)</th><th className={TH}>4 (확률 5/6)</th></tr></thead>
        <tbody>
          <tr><td className={TD_HI}>2 (확률 1/2)</td><td className={TD_WIN}>2&gt;1 ✅</td><td className={TD_LOSE}>2&lt;4 ❌</td></tr>
          <tr><td className={TD_HI}>5 (확률 1/2)</td><td className={TD_WIN}>5&gt;1 ✅</td><td className={TD_WIN}>5&gt;4 ✅</td></tr>
        </tbody>
      </MatchTableWrap>
      <ResultChip tone="bc">P(B&gt;C) = 7/12 ≈ 58.3% → B 우세</ResultChip>
    </div>
  );
}

function MatchPanelCA() {
  return (
    <div className="space-y-2">
      <StepCard tone="orange" label="STEP 1" title="표본공간 확인">
        C = {"{1, 4, 4, 4, 4, 4}"} → P(C=1) = <b className="text-amber-300">1/6</b>, P(C=4) = <b className="text-amber-300">5/6</b>
        <br />
        A = {"{3, 3, 3, 3, 3, 6}"} → P(A=3) = <b className="text-amber-300">5/6</b>, P(A=6) = <b className="text-amber-300">1/6</b>
      </StepCard>
      <StepCard tone="emerald" label="STEP 2" title="곱셈정리 적용">
        P(C&gt;A | C=1) = P(A&lt;1) = <b className="text-amber-300">0</b>
        <br />
        P(C&gt;A | C=4) = P(A&lt;4) = P(A=3) = <b className="text-amber-300">5/6</b>
      </StepCard>
      <StepCard tone="orange" label="STEP 3" title="전체확률의 법칙으로 합산">
        P(C&gt;A) = P(C=1)×P(A&lt;1) + P(C=4)×P(A&lt;4)
        <br />
        = <span className="font-bold text-cyan-300">1/6 × 0</span> + <span className="font-bold text-cyan-300">5/6 × 5/6</span>
        <br />
        = <span className="font-bold text-cyan-300">0 + 25/36</span> = <b className="text-amber-300">25/36 ≈ 69.4%</b>
      </StepCard>
      <StepCard tone="violet" label="STEP 4" title="전체 경우의 수로 검증">
        총 36가지 경우 중 C&gt;A인 경우 : (4,3)×5×5 = <b className="text-amber-300">25가지</b>
        <br />
        P(C&gt;A) = <b className="text-amber-300">25/36 ≈ 69.4% ✓</b> (가장 강력한 역전!)
      </StepCard>
      <MatchTableWrap>
        <thead><tr><th className={TH}>C＼A</th><th className={TH}>3 (확률 5/6)</th><th className={TH}>6 (확률 1/6)</th></tr></thead>
        <tbody>
          <tr><td className={TD_HI}>1 (확률 1/6)</td><td className={TD_LOSE}>1&lt;3 ❌</td><td className={TD_LOSE}>1&lt;6 ❌</td></tr>
          <tr><td className={TD_HI}>4 (확률 5/6)</td><td className={TD_WIN}>4&gt;3 ✅</td><td className={TD_LOSE}>4&lt;6 ❌</td></tr>
        </tbody>
      </MatchTableWrap>
      <ResultChip tone="ca">P(C&gt;A) = 25/36 ≈ 69.4% → C 우세 (역설!)</ResultChip>
    </div>
  );
}

// ============================================================
// 탭 3 — 🏆 대결 시뮬레이션
// ============================================================

type Scores = {
  ab: { a: number; b: number; t: number };
  bc: { b: number; c: number; t: number };
  ca: { c: number; a: number; t: number };
};
const EMPTY_SCORES: Scores = {
  ab: { a: 0, b: 0, t: 0 },
  bc: { b: 0, c: 0, t: 0 },
  ca: { c: 0, a: 0, t: 0 },
};

type Faces = { a1: number; b1: number; b2: number; c1: number; c2: number; a2: number };
const INIT_FACES: Faces = { a1: 3, b1: 2, b2: 2, c1: 4, c2: 4, a2: 3 };

function SimulationTab() {
  const [nRolls, setNRolls] = useState(1);
  const [faces, setFaces] = useState<Faces>(INIT_FACES);
  const [scores, setScores] = useState<Scores>(EMPTY_SCORES);
  const [total, setTotal] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [auto, setAuto] = useState(false);
  const autoRef = useRef(false);

  // 한 라운드 시뮬: silent 모드는 face 업데이트 생략(점수만)
  const singleRoll = useCallback((silent: boolean) => {
    const a1 = choice(DICE.A), b1 = choice(DICE.B);
    const b2 = choice(DICE.B), c1 = choice(DICE.C);
    const c2 = choice(DICE.C), a2 = choice(DICE.A);
    if (!silent) setFaces({ a1, b1, b2, c1, c2, a2 });
    setScores((p) => {
      const ab = { ...p.ab };
      const bc = { ...p.bc };
      const ca = { ...p.ca };
      if (a1 > b1) ab.a++; else if (a1 < b1) ab.b++; else ab.t++;
      if (b2 > c1) bc.b++; else if (b2 < c1) bc.c++; else bc.t++;
      if (c2 > a2) ca.c++; else if (c2 < a2) ca.a++; else ca.t++;
      return { ab, bc, ca };
    });
    setTotal((t) => t + 1);
  }, []);

  function rollNow() {
    const n = Math.max(1, Math.min(100, nRolls || 1));
    // n>1: 마지막만 face 보여줌(silent ... silent, last visible)
    if (rolling) return;
    setRolling(true);
    for (let i = 0; i < n; i++) singleRoll(i < n - 1);
    // 짧은 굴림 애니
    window.setTimeout(() => setRolling(false), 200);
  }

  // 자동 모드
  useEffect(() => { autoRef.current = auto; }, [auto]);
  useEffect(() => {
    if (!auto) return;
    const t = window.setInterval(() => {
      if (!autoRef.current) return;
      setRolling(true);
      singleRoll(false);
      window.setTimeout(() => setRolling(false), 180);
    }, 800);
    return () => window.clearInterval(t);
  }, [auto, singleRoll]);

  function reset() {
    setAuto(false);
    setScores(EMPTY_SCORES);
    setTotal(0);
    setFaces(INIT_FACES);
  }

  const showCycle = total >= 30;

  // 승률
  const denomAB = scores.ab.a + scores.ab.b + scores.ab.t || 1;
  const denomBC = scores.bc.b + scores.bc.c + scores.bc.t || 1;
  const denomCA = scores.ca.c + scores.ca.a + scores.ca.t || 1;
  const pAB = (scores.ab.a / denomAB) * 100;
  const pBC = (scores.bc.b / denomBC) * 100;
  const pCA = (scores.ca.c / denomCA) * 100;

  // 결과 라벨 계산 (현재 face 기준)
  function matchLabel(v1: number, v2: number, n1: string, n2: string): { text: string; tone: "win1" | "win2" | "tie" } {
    if (v1 > v2) return { text: `${n1} 승 (${v1} > ${v2})`, tone: "win1" };
    if (v1 < v2) return { text: `${n2} 승 (${v1} < ${v2})`, tone: "win2" };
    return { text: `무승부 (${v1} = ${v2})`, tone: "tie" };
  }
  const showResults = total > 0;
  const resAB = matchLabel(faces.a1, faces.b1, "A", "B");
  const resBC = matchLabel(faces.b2, faces.c1, "B", "C");
  const resCA = matchLabel(faces.c2, faces.a2, "C", "A");

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 to-indigo-500/10 p-4 text-center">
        <h4 className="text-lg font-bold text-emerald-300">🏆 대결 시뮬레이션</h4>
        <p className="mt-1 text-sm leading-7 text-slate-300">
          직접 주사위를 굴려 비추이성을 확인해 보세요! 많이 굴릴수록 이론값에 가까워집니다.
        </p>
      </div>

      {/* 컨트롤 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-emerald-300">🎮 주사위 굴리기</h5>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label htmlFor="nt-rolls" className="text-xs text-slate-400">굴리기 횟수 :</label>
          <input
            id="nt-rolls"
            type="number" min={1} max={100} value={nRolls}
            onChange={(e) => setNRolls(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            aria-label="굴리기 횟수"
            className="w-20 rounded-md border border-white/15 bg-slate-950 px-2 py-1 text-center text-sm text-white outline-none focus:border-emerald-300"
          />
          <button
            type="button"
            onClick={rollNow}
            disabled={auto}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            🎲 굴리기!
          </button>
          <button
            type="button"
            onClick={() => setAuto((a) => !a)}
            className={`rounded-xl border-[1.5px] px-4 py-2 text-sm font-bold transition ${
              auto
                ? "border-red-400/50 bg-red-400/15 text-red-200 hover:bg-red-400/25"
                : "border-indigo-400/40 bg-indigo-400/15 text-indigo-200 hover:bg-indigo-400/25"
            }`}
          >
            {auto ? "⏹ 중지" : "▶ 자동 (0.8초)"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          >
            🔄 초기화
          </button>
        </div>

        {/* 3대결 카드 */}
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <BattleCard
            tone="ab"
            d1={{ name: "A", value: faces.a1 }}
            d2={{ name: "B", value: faces.b1 }}
            rolling={rolling}
            result={showResults ? resAB : null}
          />
          <BattleCard
            tone="bc"
            d1={{ name: "B", value: faces.b2 }}
            d2={{ name: "C", value: faces.c1 }}
            rolling={rolling}
            result={showResults ? resBC : null}
          />
          <BattleCard
            tone="ca"
            d1={{ name: "C", value: faces.c2 }}
            d2={{ name: "A", value: faces.a2 }}
            rolling={rolling}
            result={showResults ? resCA : null}
          />
        </div>
      </section>

      {/* 누적 점수판 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-emerald-300">
          📊 누적 점수판{" "}
          {total > 0 ? <span className="ml-1 text-xs font-normal text-slate-500">(총 {total}회)</span> : null}
        </h5>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <ScorePanel
            tone="ab"
            wins={{ A: scores.ab.a, B: scores.ab.b, T: scores.ab.t }}
            pct={pAB}
            pctLabel={`A승률 ${pAB.toFixed(1)}% (이론 58.3%)`}
            barColor="#3b82f6"
            pctTone="text-blue-300"
          />
          <ScorePanel
            tone="bc"
            wins={{ B: scores.bc.b, C: scores.bc.c, T: scores.bc.t }}
            pct={pBC}
            pctLabel={`B승률 ${pBC.toFixed(1)}% (이론 58.3%)`}
            barColor="#22c55e"
            pctTone="text-emerald-300"
          />
          <ScorePanel
            tone="ca"
            wins={{ C: scores.ca.c, A: scores.ca.a, T: scores.ca.t }}
            pct={pCA}
            pctLabel={`C승률 ${pCA.toFixed(1)}% (이론 69.4%)`}
            barColor="#f97316"
            pctTone="text-orange-300"
          />
        </div>

        {showCycle ? (
          <div className="mt-3 rounded-xl border-[1.5px] border-violet-400/35 bg-violet-400/[0.07] p-3 text-center animate-[fadein_0.4s_ease]">
            <p className="text-sm font-bold text-violet-300">🔄 비추이성 패턴 확인!</p>
            <p className="mt-1 text-base font-black tracking-widest text-amber-300">A → B → C → A (순환)</p>
            <p className="mt-2 text-xs leading-7 text-slate-300">
              이론값 : P(A&gt;B) = 58.3%, P(B&gt;C) = 58.3%, P(C&gt;A) = 69.4%
              <br />
              시뮬레이션이 이론값에 가까워지고 있나요? 더 많이 굴려볼수록 이론값에 가까워집니다!
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function BattleCard({
  tone, d1, d2, rolling, result,
}: {
  tone: "ab" | "bc" | "ca";
  d1: { name: DieName; value: number };
  d2: { name: DieName; value: number };
  rolling: boolean;
  result: { text: string; tone: "win1" | "win2" | "tie" } | null;
}) {
  const cls =
    tone === "ab" ? "border-blue-400/30 bg-blue-400/[0.08]"
    : tone === "bc" ? "border-emerald-400/30 bg-emerald-400/[0.08]"
    : "border-orange-400/30 bg-orange-400/[0.08]";
  const titleTone =
    tone === "ab" ? "text-blue-300"
    : tone === "bc" ? "text-emerald-300"
    : "text-orange-300";

  let resultCls = "border-slate-400/30 bg-slate-400/[0.15] text-slate-400";
  if (result) {
    if (result.tone === "tie") resultCls = "border-slate-400/30 bg-slate-400/[0.15] text-slate-300";
    else {
      const winnerIsD1 = result.tone === "win1";
      const winner = winnerIsD1 ? d1.name : d2.name;
      if (winner === "A") resultCls = "border-blue-400/40 bg-blue-400/15 text-blue-200";
      else if (winner === "B") resultCls = "border-emerald-400/40 bg-emerald-400/15 text-emerald-200";
      else resultCls = "border-orange-400/40 bg-orange-400/15 text-orange-200";
    }
  }

  return (
    <div className={`rounded-xl border-[1.5px] p-3 text-center ${cls}`}>
      <p className={`text-xs font-bold ${titleTone}`}>⚔ {d1.name} vs {d2.name}</p>
      <div className="mt-2 flex items-center justify-center gap-2">
        <DieSVG name={d1.name} value={d1.value} rolling={rolling} />
        <span className="text-[11px] font-bold text-slate-500">vs</span>
        <DieSVG name={d2.name} value={d2.value} rolling={rolling} />
      </div>
      <div className="mt-2">
        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${resultCls}`}>
          {result?.text ?? "-"}
        </span>
      </div>
    </div>
  );
}

function ScorePanel({
  tone, wins, pct, pctLabel, barColor, pctTone,
}: {
  tone: "ab" | "bc" | "ca";
  wins: Record<string, number>;
  pct: number;
  pctLabel: string;
  barColor: string;
  pctTone: string;
}) {
  const cls =
    tone === "ab" ? "border-blue-400/25 bg-blue-400/[0.05]"
    : tone === "bc" ? "border-emerald-400/25 bg-emerald-400/[0.05]"
    : "border-orange-400/25 bg-orange-400/[0.05]";
  const titles: Record<"ab" | "bc" | "ca", string> = { ab: "A vs B", bc: "B vs C", ca: "C vs A" };
  const keys = Object.keys(wins);

  function keyColor(k: string): string {
    if (k === "A") return "text-blue-300";
    if (k === "B") return "text-emerald-300";
    if (k === "C") return "text-orange-300";
    return "text-slate-500";
  }

  return (
    <div className={`rounded-xl border p-3 text-center ${cls}`}>
      <p className="text-[11px] font-bold text-slate-400">{titles[tone]}</p>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
        {keys.map((k) => (
          <div key={k}>
            <div className={`text-sm font-bold ${keyColor(k)}`}>{wins[k]}</div>
            <div className="text-[9px] text-slate-500">{k === "T" ? "무" : `${k}승`}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="block h-full w-full" aria-hidden="true">
          <rect x={0} y={0} width={Math.min(pct, 100)} height={8} fill={barColor} className="transition-all duration-500" />
        </svg>
      </div>
      <div className={`mt-1 text-[10px] font-semibold ${pctTone}`}>{pctLabel}</div>
    </div>
  );
}

// ============================================================
// 메인
// ============================================================

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "nontransitivity",
    kind: "text",
    prompt: "A가 B를 이기고 B가 C를 이기지만 C가 A를 이기는 ‘비추이성’이 왜 가위-바위-보와 비슷한지 설명해 보세요.",
    placeholder: "가위-바위-보도 가위→보→바위→가위 처럼 순환하는 구조인데...",
  },
  {
    id: "multiplication_rule",
    kind: "text",
    prompt: "P(A>B) 계산에서 확률의 곱셈정리(전체확률의 법칙)를 어떻게 사용했는지 설명해 보세요. P(A=3)×P(B<3) + P(A=6)×P(B<6) 형태가 왜 성립하는지 적어 보세요.",
    placeholder: "A가 3이 나왔을 때와 6이 나왔을 때를 경우로 나누어...",
  },
  {
    id: "intuition_gap",
    kind: "text",
    prompt: "활동 전에 어떤 주사위가 가장 강하다고 생각했나요? 실제 분석 결과와 어떻게 달랐나요?",
    placeholder: "처음에는 B 주사위가 가장 강할 것 같았는데...",
  },
  {
    id: "real_life_cycle",
    kind: "text",
    prompt: "비추이적 관계(순환적 우열)가 나타나는 실생활 사례를 하나 더 찾아보고, 이것이 ‘최강자’를 정하기 어렵게 만드는 이유를 설명해 보세요.",
    placeholder: "예) 운동 경기의 상성 관계, 음식 선호도, 선거 결과에서...",
  },
];

type TabKey = "intro" | "theory" | "sim";

export default function NontransitiveDice() {
  const [tab, setTab] = useState<TabKey>("intro");
  const tabBtn = (active: boolean, color: string) =>
    active
      ? `rounded-lg ${color} px-3 py-2 text-sm font-bold text-slate-950`
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <style>{`
        @keyframes fadein {from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)}}
        @keyframes dieShake {0%,100%{transform:rotate(-8deg) scale(1.05)} 50%{transform:rotate(8deg) scale(1.02)}}
      `}</style>

      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 조건부확률</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 신기한(비추이적) 주사위</h3>
        <p className="mt-2 leading-7 text-slate-300">
          A가 B를 이기고, B가 C를 이기는데도 <b>C가 A를 이긴다</b>? <b className="text-amber-200">확률의 곱셈정리</b>로 이 놀라운 역설을 분석해 봅시다.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "intro", "bg-violet-300")} onClick={() => setTab("intro")}>🎲 주사위 소개</button>
        <button type="button" className={tabBtn(tab === "theory", "bg-amber-300")} onClick={() => setTab("theory")}>📐 이론 계산</button>
        <button type="button" className={tabBtn(tab === "sim", "bg-emerald-300")} onClick={() => setTab("sim")}>🏆 대결 시뮬레이션</button>
      </div>

      <div className="mt-5">
        {tab === "intro" ? <IntroTab /> : tab === "theory" ? <TheoryTab /> : <SimulationTab />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

