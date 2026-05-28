"use client";

import { useCallback, useId, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

/* ──────────────────────────────────────────────────────────────
   🎲 솔직한 설문의 비밀 — 무작위 응답 기법  (single page, 6 sections)
   사건 정의:
     A   = 실제로 민감한 경험이 있다
     B   = 동전 앞면(설문지 1, 무조건 '예')
     B^c = 동전 뒷면(설문지 2, 솔직히 답)
   P(예) = P(B) + P(A)·P(B^c) = 1/2 + P(A)/2
   ∴ P(A) = 2·P(예) − 1
   ────────────────────────────────────────────────────────────── */

// ============================================================
// Section 1 — 문제 상황
// ============================================================

function ProblemSection() {
  return (
    <section className="rounded-2xl border border-red-400/30 bg-red-400/[0.06] p-5">
      <h4 className="text-base font-bold text-red-300">🤔 민감한 질문, 솔직하게 답할 수 있을까?</h4>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
        <Person emoji="👧" bubble="솔직히 말하면 창피할 것 같은데…" />
        <span className="text-3xl text-slate-500">←</span>
        <div className="max-w-[240px] rounded-2xl border-2 border-red-400/45 bg-red-400/10 p-3 text-center">
          <div className="text-3xl">📋</div>
          <div className="mt-1 text-xs font-semibold text-red-200">설문지</div>
          <div className="mt-1 text-sm font-semibold text-red-300/90">
            &ldquo;학교에서 분리배출을<br />하지 않은 경험이 있나요?&rdquo;
          </div>
        </div>
        <span className="text-3xl text-slate-500">→</span>
        <Person emoji="👦" bubble={"다들 보는데…\n그냥 '아니요' 라고 쓸게요"} />
      </div>
      <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/[0.08] p-3 text-center text-sm text-red-200">
        😰 민감한 주제일수록 솔직한 답변을 얻기 어렵다!
        <br />
        <b className="text-red-300">→ 거짓 응답 → 통계 왜곡 → 잘못된 결론</b>
      </div>
    </section>
  );
}

function Person({ emoji, bubble }: { emoji: string; bubble: string }) {
  return (
    <div className="text-center">
      <div className="text-5xl">{emoji}</div>
      <div className="mt-2 max-w-[200px] whitespace-pre-line rounded-2xl border border-red-400/40 bg-white/[0.06] px-3 py-2 text-xs text-slate-300">
        {bubble}
      </div>
    </div>
  );
}

// ============================================================
// Section 2 — 해결 방법
// ============================================================

function MethodSection() {
  return (
    <section className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-5">
      <h4 className="text-base font-bold text-emerald-300">🎲 해결책 : 동전 던지기를 활용하자!</h4>
      <p className="mt-1 text-sm text-slate-400">조사자가 모르게 응답자가 몰래 동전 1개를 던집니다.</p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
        <Bridge label="동전 던지기" icon="🪙" />
        <span className="text-slate-600">→</span>
        <Bridge label="앞면" icon="☀️" tone="amber" />
        <span className="text-slate-600">→</span>
        <span className="font-bold text-amber-300">설문지 1 (무조건 &lsquo;예&rsquo;)</span>
        <span className="px-1 text-slate-600">|</span>
        <Bridge label="뒷면" icon="🌙" tone="indigo" />
        <span className="text-slate-600">→</span>
        <span className="font-bold text-indigo-300">설문지 2 (솔직히 응답)</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MethodCard tone="amber" icon="☀️" title="앞면 → 설문지 1">
          &ldquo;무조건 <b className="text-amber-300">&lsquo;예&rsquo;</b>라고 답하세요.&rdquo;
          <br />
          <br />
          실제 경험과 무관하게 예라고 답함
        </MethodCard>
        <MethodCard tone="indigo" icon="🌙" title="뒷면 → 설문지 2">
          실제 민감한 질문에 솔직하게 <b className="text-indigo-300">예 / 아니요</b>로 답함
          <br />
          <br />
          조사자는 동전 결과를 모름!
        </MethodCard>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.08] p-3 text-center text-sm text-emerald-200">
        💡 조사자는 응답자가 어느 설문지를 뽑았는지 <b className="text-emerald-300">알 수 없다!</b>
        <br />
        → 개인의 솔직한 답이 보호되면서도, 전체 통계로 진실을 추정할 수 있다
      </div>
    </section>
  );
}

function Bridge({ icon, label, tone }: { icon: string; label: string; tone?: "amber" | "indigo" }) {
  const labelTone = tone === "amber" ? "text-amber-300" : tone === "indigo" ? "text-indigo-300" : "text-slate-300";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-xl">{icon}</span>
      <span className={`text-xs font-bold ${labelTone}`}>{label}</span>
    </span>
  );
}

function MethodCard({ tone, icon, title, children }: { tone: "amber" | "indigo"; icon: string; title: string; children: React.ReactNode }) {
  const cls = tone === "amber"
    ? "border-amber-400/35 bg-amber-400/[0.08] text-amber-300"
    : "border-indigo-400/35 bg-indigo-400/[0.08] text-indigo-300";
  return (
    <div className={`rounded-2xl border p-4 text-center ${cls}`}>
      <div className="text-3xl">{icon}</div>
      <div className="mt-2 text-sm font-extrabold">{title}</div>
      <div className="mt-2 text-xs leading-7 text-slate-400">{children}</div>
    </div>
  );
}

// ============================================================
// Section 3 — 동전 시뮬레이터
// ============================================================

function CoinSimSection() {
  const [state, setState] = useState<"idle" | "spinning" | "heads" | "tails">("idle");

  function flip() {
    if (state === "spinning") return;
    setState("spinning");
    window.setTimeout(() => {
      setState(Math.random() < 0.5 ? "heads" : "tails");
    }, 700);
  }

  const isHeads = state === "heads";
  const isTails = state === "tails";
  const showFace = isHeads ? "☀️" : isTails ? "🌙" : "🪙";

  return (
    <section className="rounded-2xl border border-indigo-400/30 bg-indigo-400/[0.06] p-5">
      <h4 className="text-base font-bold text-indigo-300">🎮 내가 응답자라면? 직접 체험해 보자!</h4>
      <p className="mt-1 text-xs text-slate-400">아래 동전을 클릭해서 던져 보세요. 어느 설문지를 뽑았는지 확인하세요.</p>

      <div className="mt-3 flex flex-col items-center">
        <button
          type="button"
          onClick={flip}
          className={`flex h-28 w-28 items-center justify-center rounded-full text-5xl shadow-[0_8px_22px_rgba(0,0,0,0.5)] transition hover:scale-105 ${
            isHeads ? "border-4 border-amber-600 bg-gradient-to-br from-amber-400 to-amber-600"
            : isTails ? "border-4 border-slate-600 bg-gradient-to-br from-slate-400 to-slate-600"
            : "border-4 border-amber-600 bg-gradient-to-br from-amber-400 to-amber-600"
          } ${state === "spinning" ? "animate-[coinSpinRR_0.6s_linear_infinite]" : ""}`}
          aria-label="동전 던지기"
        >
          {showFace}
        </button>
        <button
          type="button"
          onClick={flip}
          className="mt-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-7 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/40 transition hover:brightness-110"
        >
          🎲 동전 던지기!
        </button>
        <div className="mt-3 min-h-[56px]">
          {isHeads ? (
            <div className="rounded-xl border border-amber-400/45 bg-amber-400/15 px-5 py-3 text-sm font-bold text-amber-200 animate-[fadeInRR_0.4s_ease]">
              ☀️ 앞면! → 설문지 1 선택 → 무조건 <b>&ldquo;예&rdquo;</b>라고 답하세요
            </div>
          ) : null}
          {isTails ? (
            <div className="rounded-xl border border-indigo-400/45 bg-indigo-400/15 px-5 py-3 text-sm font-bold text-indigo-200 animate-[fadeInRR_0.4s_ease]">
              🌙 뒷면! → 설문지 2 선택 → 민감한 질문에 <b>솔직하게</b> 답하세요
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Section 4 — 4가지 사례 탭
// ============================================================

type CaseDef = {
  id: number;
  emoji: string;
  q: string;
  defaultN: number;
  defaultYes: number;
};
const CASES: CaseDef[] = [
  { id: 0, emoji: "🗑️", q: "학교에서 분리배출을 하지 않은 경험이 있나요?", defaultN: 100, defaultYes: 70 },
  { id: 1, emoji: "📱", q: "수업 시간에 몰래 핸드폰을 사용한 경험이 있나요?", defaultN: 120, defaultYes: 84 },
  { id: 2, emoji: "🍱", q: "급식 음식을 몰래 버린 경험이 있나요?", defaultN: 80, defaultYes: 52 },
  { id: 3, emoji: "😴", q: "시험 전날 공부를 전혀 하지 않은 경험이 있나요?", defaultN: 150, defaultYes: 105 },
];
const TAB_LABELS = ["🗑 분리배출", "📱 핸드폰", "🍱 급식", "😴 공부 안 함"];

function CaseSection() {
  const [tab, setTab] = useState(0);
  // 각 케이스 상태 — 독립적으로 보관
  const [n0, setN0] = useState(CASES[0].defaultN); const [y0, setY0] = useState(CASES[0].defaultYes);
  const [n1, setN1] = useState(CASES[1].defaultN); const [y1, setY1] = useState(CASES[1].defaultYes);
  const [n2, setN2] = useState(CASES[2].defaultN); const [y2, setY2] = useState(CASES[2].defaultYes);
  const [n3, setN3] = useState(CASES[3].defaultN); const [y3, setY3] = useState(CASES[3].defaultYes);

  const states = [
    { n: n0, setN: setN0, y: y0, setY: setY0 },
    { n: n1, setN: setN1, y: y1, setY: setY1 },
    { n: n2, setN: setN2, y: y2, setY: setY2 },
    { n: n3, setN: setN3, y: y3, setY: setY3 },
  ];

  return (
    <section className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.05] p-5">
      <h4 className="text-base font-bold text-amber-300">📊 사례로 알아보는 무작위 응답 기법</h4>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TAB_LABELS.map((lbl, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setTab(i)}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
              tab === i
                ? "bg-indigo-400/25 text-indigo-200 ring-1 ring-indigo-400/45"
                : "border border-white/12 bg-white/[0.04] text-slate-400 hover:bg-white/10"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <CasePanel
          c={CASES[tab]}
          n={states[tab].n}
          setN={(v) => states[tab].setN(v)}
          yes={states[tab].y}
          setYes={(v) => states[tab].setY(v)}
        />
      </div>
    </section>
  );
}

function CasePanel({
  c, n, setN, yes, setYes,
}: { c: CaseDef; n: number; setN: (v: number) => void; yes: number; setYes: (v: number) => void }) {
  // yes는 n 이하로 클램프
  const safeYes = Math.min(yes, n);
  const pYes = n > 0 ? safeYes / n : 0;
  const pA = 2 * pYes - 1;
  const estN = Math.max(0, Math.round(pA * n));
  const pctText = (pA * 100).toFixed(1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <div className="text-4xl">{c.emoji}</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-100">{c.q}</p>
          <p className="text-[11px] text-slate-500">학생 {n}명 대상 설문 | 동전 앞면 확률 = 1/2</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-7 text-slate-300">
        <p className="font-bold text-amber-300">🪙 동전 던지기 결과에 따라 설문지를 선택</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className="rounded-md border border-amber-400/30 bg-amber-400/15 px-2 py-1 text-amber-200">☀️ 앞면 → 설문지 1 : 무조건 &lsquo;예&rsquo;</span>
          <span className="rounded-md border border-indigo-400/30 bg-indigo-400/15 px-2 py-1 text-indigo-200">🌙 뒷면 → 설문지 2 : 솔직히 예/아니요</span>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.07] p-4">
        <p className="text-sm font-bold text-emerald-300">📐 역추정 계산기</p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label htmlFor={`n-${c.id}`} className="block text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>전체 응답자 수</span>
              <span className="rounded-md bg-emerald-500 px-2 py-0.5 font-mono text-sm font-bold text-white">{n}</span>
            </div>
            <input
              id={`n-${c.id}`}
              type="range" min={50} max={300} step={10} value={n}
              onChange={(e) => {
                const v = Number(e.target.value);
                setN(v);
                if (yes > v) setYes(v);
              }}
              aria-label="전체 응답자 수"
              className="mt-1 w-full accent-emerald-400"
            />
          </label>
          <label htmlFor={`y-${c.id}`} className="block text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>&lsquo;예&rsquo; 응답 수</span>
              <span className="rounded-md bg-emerald-500 px-2 py-0.5 font-mono text-sm font-bold text-white">{safeYes}</span>
            </div>
            <input
              id={`y-${c.id}`}
              type="range" min={0} max={n} value={safeYes}
              onChange={(e) => setYes(Number(e.target.value))}
              aria-label="예 응답 수"
              className="mt-1 w-full accent-emerald-400"
            />
          </label>
        </div>

        <div className="mt-3 rounded-md bg-white/[0.04] p-3 text-xs leading-7 text-slate-300">
          P(예라고 답함) = <b className="text-emerald-300">{safeYes}</b> / <b className="text-emerald-300">{n}</b> ={" "}
          <b className="text-emerald-300">{pYes.toFixed(4)}</b>
          <br />
          P(A) = 2 × {pYes.toFixed(4)} − 1 = <b className="text-amber-300">{pA.toFixed(4)}</b>
        </div>

        {pA < 0 ? (
          <div className="mt-3 rounded-md border border-red-400/35 bg-red-400/15 px-4 py-3 text-center">
            <p className="text-xs text-red-200">⚠ &lsquo;예&rsquo; 응답이 너무 적습니다</p>
            <p className="mt-1 text-2xl font-black text-red-300">음수 → 0%</p>
          </div>
        ) : (
          <div className="mt-3 rounded-md border border-emerald-400/40 bg-emerald-400/15 px-4 py-3 text-center">
            <p className="text-xs text-emerald-200">실제 경험자 추정</p>
            <p className="mt-1 text-2xl font-black text-emerald-300">약 {estN}명 ({pctText}%)</p>
            <p className="mt-1 text-xs text-emerald-200/80">{n}명 중 약 {pctText}%가 실제 경험자로 추정됩니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Section 5 — 수식 설명
// ============================================================

function FormulaSection() {
  return (
    <section className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.06] p-5">
      <h4 className="text-base font-bold text-violet-200">🔢 확률 공식으로 이해하기</h4>

      <div className="mt-3 rounded-xl border border-violet-400/25 bg-violet-400/[0.07] p-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-violet-300">📌 사건 정의</p>
        <ul className="mt-2 space-y-1 text-xs leading-7 text-slate-300">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-400" />
            <span><b className="text-indigo-300">A</b> : 실제로 민감한 경험이 있는 사건</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
            <span><b className="text-amber-300">B</b> : 동전 앞면 → 설문지 1 선택 (P(B) = 1/2)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
            <span><b className="text-emerald-300">B<sup>c</sup></b> : 동전 뒷면 → 설문지 2 선택 (P(B<sup>c</sup>) = 1/2)</span>
          </li>
        </ul>
      </div>

      <div className="mt-3 rounded-xl border border-violet-400/25 bg-violet-400/[0.07] p-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-violet-300">📌 &lsquo;예&rsquo;라고 답할 확률</p>
        <div className="mt-2 font-mono text-sm leading-8 text-indigo-100">
          P(예라고 답함)
          <br />
          = P(B) + P(A ∩ B<sup>c</sup>)
          <br />
          = P(B) + P(A)·P(B<sup>c</sup>) &nbsp;← A와 B는 독립!
          <br />
          = 1/2 + P(A)·(1/2)
        </div>
        <ul className="mt-2 space-y-1 text-xs leading-7 text-slate-300">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
            P(B) : 앞면이 나와서 무조건 &lsquo;예&rsquo;라고 답하는 경우
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
            P(A∩B<sup>c</sup>) : 뒷면이 나왔고 실제로 경험도 있는 경우
          </li>
        </ul>
      </div>

      <div className="mt-3 rounded-xl border border-violet-400/25 bg-violet-400/[0.07] p-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-violet-300">📌 역으로 P(A) 추정하기</p>
        <div className="mt-2 font-mono text-sm leading-8 text-indigo-100">
          P(예라고 답함) = 1/2 + P(A)/2
          <br />
          <br />
          ∴ <b className="text-amber-300">P(A) = 2 × P(예라고 답함) − 1</b>
        </div>
        <div className="mt-3 rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-6 text-amber-200">
          💡 예시 : 100명 중 70명이 &lsquo;예&rsquo;라고 답했다면
          <br />
          P(A) = 2 × 0.7 − 1 = <b>0.4</b> → 실제 경험자는 약 <b>40명</b>으로 추정!
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Section 6 — 가상 설문 시뮬
// ============================================================

type SimLog = { id: number; answeredYes: boolean; reason: string };

function SimulatorSection() {
  const [pPct, setPPct] = useState(40);
  const [total, setTotal] = useState(0);
  const [yesCount, setYesCount] = useState(0);
  const [logs, setLogs] = useState<SimLog[]>([]);

  const realP = pPct / 100;
  const pYes = total > 0 ? yesCount / total : 0;
  const pA = Math.max(0, 2 * pYes - 1);
  const yBarW = Math.round(pYes * 100);
  const rBarW = Math.round(pA * 100);

  const runOne = useCallback(() => {
    const isHeads = Math.random() < 0.5;
    let answeredYes: boolean;
    let reason: string;
    if (isHeads) {
      answeredYes = true;
      reason = "☀️ 앞면 → 설문지 1 → 무조건 \"예\"";
    } else {
      const hasExp = Math.random() < realP;
      answeredYes = hasExp;
      reason = hasExp
        ? "🌙 뒷면 → 설문지 2 → \"예\" (경험 있음)"
        : "🌙 뒷면 → 설문지 2 → \"아니요\" (경험 없음)";
    }
    setTotal((t) => t + 1);
    if (answeredYes) setYesCount((y) => y + 1);
    setLogs((prev) => [
      { id: prev.length > 0 ? prev[0].id + 1 : 1, answeredYes, reason },
      ...prev,
    ].slice(0, 50));
  }, [realP]);

  function runMany(cnt: number) {
    for (let i = 0; i < cnt; i++) runOne();
  }
  function reset() {
    setTotal(0);
    setYesCount(0);
    setLogs([]);
  }

  return (
    <section className="rounded-2xl border border-pink-400/30 bg-pink-400/[0.06] p-5">
      <h4 className="text-base font-bold text-pink-300">🎯 우리 반 가상 설문 시뮬레이터</h4>
      <p className="mt-1 text-xs text-slate-400">실제 경험 비율을 설정하고 설문을 진행해 보세요. 결과가 어떻게 나오는지 확인하세요!</p>

      <label htmlFor="sim-p" className="mt-3 block text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span>실제 경험자 비율 p</span>
          <span className="rounded-md bg-amber-500 px-2 py-0.5 font-mono text-sm font-bold text-white">{pPct}%</span>
        </div>
        <input
          id="sim-p"
          type="range" min={0} max={100} value={pPct}
          onChange={(e) => setPPct(Number(e.target.value))}
          aria-label="실제 경험자 비율 p"
          className="mt-1 w-full accent-amber-400"
        />
      </label>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <SimKpi label="총 응답자" value={total.toLocaleString()} tone="slate" />
        <SimKpi label="'예' 응답" value={yesCount.toLocaleString()} tone="emerald" />
        <SimKpi label="추정 경험자%" value={total > 0 ? `${(pA * 100).toFixed(1)}%` : "—"} tone="amber" />
      </div>

      <div className="mt-3">
        <p className="text-[11px] text-slate-500">응답 비율 (P(예))</p>
        <ProgressBar pct={yBarW} tone="emerald" />
        <p className="mt-2 text-[11px] text-slate-500">추정된 실제 경험자 비율 (P(A))</p>
        <ProgressBar pct={rBarW} tone="amber" />
      </div>

      {logs.length > 0 ? (
        <div className="mt-3 max-h-[160px] space-y-1 overflow-y-auto rounded-md border border-white/8 bg-black/20 p-2">
          {logs.map((lg) => (
            <div
              key={lg.id}
              className={`flex items-center gap-2 rounded-md border-l-[3px] px-3 py-1.5 text-xs ${
                lg.answeredYes
                  ? "border-emerald-400 bg-emerald-400/10 text-emerald-200"
                  : "border-indigo-400 bg-indigo-400/10 text-indigo-200"
              }`}
            >
              <b>#{lg.id}</b>
              <span className="flex-1">{lg.reason}</span>
              <b>{lg.answeredYes ? "✅ 예" : "❌ 아니요"}</b>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runOne}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
        >
          한 명 응답
        </button>
        <button
          type="button"
          onClick={() => runMany(10)}
          className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:brightness-110"
        >
          10명 추가
        </button>
        <button
          type="button"
          onClick={() => runMany(30)}
          className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:brightness-110"
        >
          30명 추가
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
        >
          초기화
        </button>
      </div>
    </section>
  );
}

function SimKpi({ label, value, tone }: { label: string; value: string; tone: "slate" | "emerald" | "amber" }) {
  const valTone = tone === "emerald" ? "text-emerald-300" : tone === "amber" ? "text-amber-300" : "text-slate-200";
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-center">
      <div className={`text-2xl font-black tabular-nums ${valTone}`}>{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

function ProgressBar({ pct, tone }: { pct: number; tone: "emerald" | "amber" }) {
  // useId 결과의 ':' 문자는 SVG url() 참조에서 escape 가 필요해 제거
  const uid = useId().replace(/[:]/g, "");
  const gid = `pb-${uid}`;
  const fromColor = tone === "emerald" ? "#10b981" : "#f59e0b";
  const toColor = tone === "emerald" ? "#059669" : "#d97706";
  const widthPct = Math.max(0, Math.min(100, pct));
  return (
    <div className="mt-1 h-5 overflow-hidden rounded-md border border-white/10 bg-white/[0.04]">
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="block h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={fromColor} />
            <stop offset="100%" stopColor={toColor} />
          </linearGradient>
        </defs>
        <rect
          x={0} y={0}
          width={widthPct}
          height={20}
          fill={`url(#${gid})`}
          className="transition-all duration-500"
        />
      </svg>
    </div>
  );
}

// ============================================================
// 메인
// ============================================================

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "indep_reason",
    kind: "text",
    prompt: "동전 던지기와 민감한 질문에 대한 응답은 서로 독립인가요? 독립인 이유를 설명해 보세요.",
    placeholder: "동전 던지기의 결과는 응답자의 실제 경험과 무관하기 때문에...",
  },
  {
    id: "anonymity",
    kind: "text",
    prompt: "조사자는 왜 개인의 실제 응답을 알 수 없을까요? 이 방법이 응답자의 익명성을 보장하는 원리를 설명해 보세요.",
    placeholder: "조사자는 응답자가 어느 설문지를 뽑았는지 알 수 없으므로...",
  },
  {
    id: "calc_practice",
    kind: "text",
    prompt: "학생 200명 조사에서 120명이 '예'라고 답했다면, 실제로 민감한 경험을 한 학생은 몇 명으로 추정되나요? 풀이도 함께 적어 보세요.",
    placeholder: "P(예) = 120/200 = 0.6, P(A) = 2 × 0.6 − 1 = 0.2, 따라서 ...",
  },
  {
    id: "limitations",
    kind: "text",
    prompt: "이 방법의 한계나 개선할 수 있는 점이 있다면 무엇인지 생각해 보세요.",
    placeholder: "표본이 작으면 추정값의 분산이 커지고...",
  },
];

export default function RandomResponseSurvey() {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <style>{`
        @keyframes coinSpinRR {
          0%{transform:rotateY(0deg) scale(1)}
          25%{transform:rotateY(90deg) scale(0.75)}
          50%{transform:rotateY(180deg) scale(1)}
          75%{transform:rotateY(270deg) scale(0.75)}
          100%{transform:rotateY(360deg) scale(1)}
        }
        @keyframes fadeInRR {from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 사건의 독립과 종속</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 솔직한 설문의 비밀 — 무작위 응답 기법</h3>
        <p className="mt-2 leading-7 text-slate-300">
          민감한 질문에도 솔직한 답변을 유도하는 <b className="text-amber-200">확률 기반 설문 기법</b>을 체험합니다.
          동전 던지기의 무작위성과 독립 사건을 이용한 통계 추정 — 익명성과 진실 모두를 보장합니다.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <ProblemSection />
        <MethodSection />
        <CoinSimSection />
        <CaseSection />
        <FormulaSection />
        <SimulatorSection />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
