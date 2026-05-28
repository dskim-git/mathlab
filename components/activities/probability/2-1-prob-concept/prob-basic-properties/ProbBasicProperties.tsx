"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ── 탐구 1: 확률값 유효성 ──
type ProbCase = { val: string; valid: boolean; note: string };
const PROB_CASES: ProbCase[] = [
  { val: "P(A) = 0.7", valid: true, note: "0과 1 사이의 값이므로 올바른 확률입니다. ✓" },
  { val: "P(A) = 1.2", valid: false, note: "확률은 1을 넘을 수 없습니다! (경우의 수가 전체보다 클 수 없으므로)" },
  { val: "P(A) = −0.3", valid: false, note: "확률은 음수가 될 수 없습니다! (경우의 수는 0 이상이므로)" },
  { val: "P(A) = 0", valid: true, note: "P=0은 공사건! 절대 일어나지 않는 사건의 확률입니다. ✓" },
  { val: "P(A) = 1", valid: true, note: "P=1은 전사건! 반드시 일어나는 사건의 확률입니다. ✓" },
  { val: "P(A) = 3/4", valid: true, note: "0과 1 사이의 분수이므로 올바른 확률입니다. ✓" },
  { val: "P(A) = 2", valid: false, note: "확률의 최댓값은 1입니다! 2는 될 수 없어요." },
  { val: "P(A) = −1", valid: false, note: "확률은 반드시 0 이상이어야 합니다!" },
];

// ── 탐구 2: 시나리오 ──
type SAns = "impossible" | "certain" | "normal";
type Scenario = { emoji: string; ctx: string; ev: string; ans: SAns; expl: string };
const SCENARIOS: Scenario[] = [
  { emoji: "🎲", ctx: "주사위(1~6) 한 개를 던질 때", ev: "눈의 수가 7인 사건", ans: "impossible",
    expl: "주사위 눈은 1~6뿐! 7은 절대 나올 수 없으므로 공사건 (P=0)입니다." },
  { emoji: "🎲", ctx: "주사위(1~6) 한 개를 던질 때", ev: "눈의 수가 1 이상 6 이하인 사건", ans: "certain",
    expl: "주사위를 던지면 반드시 1~6 중 하나! 표본공간 전체이므로 전사건 (P=1)입니다." },
  { emoji: "🪙", ctx: "동전 한 개를 던질 때", ev: "앞면 또는 뒷면이 나오는 사건", ans: "certain",
    expl: "동전의 표본공간 = {앞, 뒤}. 반드시 둘 중 하나이므로 전사건 (P=1)입니다." },
  { emoji: "🪙", ctx: "동전 한 개를 던질 때", ev: "동전이 옆면으로 서는 사건", ans: "impossible",
    expl: "이론적 표본공간 = {앞, 뒤}. 옆면은 포함되지 않으므로 공사건 (P=0)입니다." },
  { emoji: "🔴", ctx: "빨간 공 4개만 들어 있는 상자에서 공 1개를 꺼낼 때", ev: "파란 공이 나오는 사건", ans: "impossible",
    expl: "상자에 파란 공이 없으니 절대 불가능! 공사건 (P=0)입니다." },
  { emoji: "🔴", ctx: "빨간 공 4개만 들어 있는 상자에서 공 1개를 꺼낼 때", ev: "빨간 공이 나오는 사건", ans: "certain",
    expl: "모든 공이 빨간색이니 꺼내면 반드시 빨간 공! 전사건 (P=1)입니다." },
  { emoji: "🃏", ctx: "52장 트럼프 카드(조커 없음) 중 1장을 뽑을 때", ev: "♥ 무늬 카드가 나오는 사건", ans: "normal",
    expl: "♥ 카드는 13장. P = 13/52 = 1/4. 일반 사건입니다!" },
  { emoji: "✂️", ctx: "가위바위보에서 한 번 낼 때", ev: "가위, 바위, 보 중 하나를 내는 사건", ans: "certain",
    expl: "표본공간 = {가위, 바위, 보}. 반드시 셋 중 하나이므로 전사건 (P=1)입니다." },
  { emoji: "📦", ctx: "두 자리 자연수(10~99) 중 하나를 무작위로 뽑을 때", ev: "뽑은 수가 세 자리 수인 사건", ans: "impossible",
    expl: "두 자리 자연수에 세 자리 수는 없습니다! 공사건 (P=0)입니다." },
  { emoji: "🪙", ctx: "동전 2개를 동시에 던질 때", ev: "동전 3개 모두 앞면인 사건", ans: "impossible",
    expl: "동전이 2개뿐인데 3개 모두 앞면? 불가능! 공사건 (P=0)입니다." },
  { emoji: "🎲", ctx: "주사위 한 개를 던질 때", ev: "눈의 수가 홀수인 사건", ans: "normal",
    expl: "홀수 눈 = {1,3,5} → P = 3/6 = 1/2. 일반 사건입니다!" },
  { emoji: "🃏", ctx: "52장 트럼프 카드(조커 없음) 중 1장을 뽑을 때", ev: "뽑은 카드가 ♠, ♥, ♦, ♣ 중 하나인 사건", ans: "certain",
    expl: "모든 카드가 4가지 무늬 중 하나이므로 표본공간 전체! 전사건 (P=1)입니다." },
];

const ANS_LABEL: Record<SAns, string> = { impossible: "공사건 (P=0)", certain: "전사건 (P=1)", normal: "일반 사건" };

// ── 조합 C(n,r) ──
function comb(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  const k = Math.min(r, n - r);
  let num = 1, den = 1;
  for (let i = 0; i < k; i++) { num *= (n - i); den *= (i + 1); }
  return Math.round(num / den);
}

// ── 탐구 1 패널 ──
function Game1Panel({
  judged, scoreOK, scoreNG, onJudge, onReset,
}: { judged: Record<number, boolean | null>; scoreOK: number; scoreNG: number;
     onJudge: (i: number, chosen: boolean) => void; onReset: () => void }) {
  const done = scoreOK + scoreNG;
  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-slate-400">
        아래 확률값이 <b>올바른 확률</b>인지 판단해 보세요. 확률은 반드시 <b>0 이상 1 이하</b>여야 합니다.
      </p>
      <ScoreBoard ok={scoreOK} ng={scoreNG} total={PROB_CASES.length} />
      <ProgressBar value={done} max={PROB_CASES.length} tone="violet" />
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {PROB_CASES.map((c, i) => {
          const result = judged[i];
          const correct = result === true, wrong = result === false;
          return (
            <div key={i}
              className={`rounded-xl border-2 p-3 text-center transition ${
                correct ? "border-emerald-400/70 bg-emerald-400/10"
                : wrong ? "border-red-400/70 bg-red-400/10"
                : "border-white/10 bg-white/[0.04]"}`}>
              {result !== null && result !== undefined ? (
                <span className={`mb-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  correct ? "bg-emerald-400 text-slate-950" : "bg-red-400 text-slate-950"}`}>
                  {correct ? "✓ 정답!" : "✗ 오답"}
                </span>
              ) : null}
              <div className={`my-1.5 font-mono text-lg font-bold ${correct ? "text-emerald-300" : wrong ? "text-red-300" : "text-slate-100"}`}>{c.val}</div>
              <div className="mt-2 flex justify-center gap-1.5">
                <button type="button" disabled={result !== undefined && result !== null}
                  onClick={() => onJudge(i, true)}
                  className="rounded-md border border-emerald-400/50 bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/30 disabled:opacity-40">✓ 유효</button>
                <button type="button" disabled={result !== undefined && result !== null}
                  onClick={() => onJudge(i, false)}
                  className="rounded-md border border-red-400/50 bg-red-400/15 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-400/30 disabled:opacity-40">✗ 무효</button>
              </div>
              {result !== null && result !== undefined ? (
                <p className="mt-2 text-[11px] leading-5 text-slate-400">{c.note}</p>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="text-right"><ResetBtn onClick={onReset} /></div>
    </div>
  );
}

// ── 탐구 2 패널 ──
function Game2Panel({
  judged, scoreOK, scoreNG, onJudge, onReset,
}: { judged: Record<number, SAns | null>; scoreOK: number; scoreNG: number;
     onJudge: (i: number, chosen: SAns) => void; onReset: () => void }) {
  const done = scoreOK + scoreNG;
  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-slate-400">
        각 상황의 사건이 <b className="text-red-300">공사건</b>(P=0), <b className="text-emerald-300">전사건</b>(P=1),
        또는 <b className="text-blue-300">일반 사건</b>(0&lt;P&lt;1)인지 골라 보세요.
      </p>
      <ScoreBoard ok={scoreOK} ng={scoreNG} total={SCENARIOS.length} />
      <ProgressBar value={done} max={SCENARIOS.length} tone="emerald" />
      <div className="grid gap-2.5 sm:grid-cols-2">
        {SCENARIOS.map((s, i) => {
          const chosen = judged[i];
          const isCorrect = chosen != null && chosen === s.ans;
          const isWrong = chosen != null && chosen !== s.ans;
          return (
            <div key={i}
              className={`rounded-xl border-2 p-3 transition ${
                isCorrect ? "border-emerald-400/70 bg-emerald-400/10"
                : isWrong ? "border-red-400/70 bg-red-400/10"
                : "border-white/10 bg-white/[0.04]"}`}>
              {chosen != null ? (
                <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  isCorrect ? "bg-emerald-400 text-slate-950" : "bg-red-400 text-slate-950"}`}>
                  {isCorrect ? `✓ 정답! ${ANS_LABEL[s.ans]}` : `✗ 오답 → 정답: ${ANS_LABEL[s.ans]}`}
                </span>
              ) : null}
              <div className="mt-1.5 text-center text-2xl">{s.emoji}</div>
              <div className="text-center text-xs text-slate-400">{s.ctx}</div>
              <div className="mt-1 text-center text-sm leading-6 text-slate-100">{s.ev}</div>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {(["impossible", "certain", "normal"] as const).map((k) => {
                  const tone = k === "impossible" ? "red" : k === "certain" ? "emerald" : "blue";
                  const isChosen = chosen === k;
                  const showCorrect = chosen != null && k === s.ans;
                  const cls = isChosen && isWrong
                    ? "border-red-400 bg-red-400/15 text-red-300"
                    : showCorrect
                    ? (tone === "red" ? "border-red-400 bg-red-400 text-slate-950"
                       : tone === "emerald" ? "border-emerald-400 bg-emerald-400 text-slate-950"
                       : "border-blue-400 bg-blue-400 text-slate-950")
                    : (tone === "red" ? "border-red-400/60 text-red-300 hover:bg-red-400/15"
                       : tone === "emerald" ? "border-emerald-400/60 text-emerald-300 hover:bg-emerald-400/15"
                       : "border-blue-400/60 text-blue-300 hover:bg-blue-400/15");
                  const label = k === "impossible" ? "🚫 공사건" : k === "certain" ? "✅ 전사건" : "📊 일반";
                  return (
                    <button key={k} type="button" disabled={chosen != null}
                      onClick={() => onJudge(i, k)}
                      className={`rounded-lg border-2 px-3 py-1 text-xs font-bold transition disabled:cursor-default ${cls}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
              {chosen != null ? (
                <p className="mt-2.5 rounded-md bg-white/5 px-2.5 py-1.5 text-[11px] leading-5 text-slate-300">💡 {s.expl}</p>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="text-right"><ResetBtn onClick={onReset} /></div>
    </div>
  );
}

// ── 탐구 3 패널 ──
type EvType = "impossible" | "certain" | "normal";
type Event3 = { title: string; ways: number; total: number; type: EvType; label: string; formula: string };
function computeEvents(r: number, b: number, k: number): Event3[] {
  const total = r + b;
  if (total === 0 || k < 1 || k > total) return [];
  const totalWays = comb(total, k);
  const evs: Event3[] = [];
  for (let j = 0; j <= Math.min(k, r); j++) {
    const blueNeeded = k - j;
    const ways = comb(r, j) * comb(b, blueNeeded);
    const t: EvType = ways === 0 ? "impossible" : ways === totalWays ? "certain" : "normal";
    const label = t === "impossible" ? "공사건 (P=0)" : t === "certain" ? "전사건 (P=1)" : `P = ${ways}/${totalWays}`;
    evs.push({
      title: `빨간 공 정확히 ${j}개`, ways, total: totalWays, type: t, label,
      formula: `C(${r},${j})×C(${b},${blueNeeded}) / C(${total},${k}) = ${ways}/${totalWays}`,
    });
  }
  const waysOnlyRed = comb(r, k);
  const waysAtLeast1Blue = Math.max(0, totalWays - waysOnlyRed);
  {
    const ways = waysAtLeast1Blue;
    const t: EvType = ways <= 0 ? "impossible" : ways >= totalWays ? "certain" : "normal";
    const label = t === "impossible" ? "공사건 (P=0)" : t === "certain" ? "전사건 (P=1)" : `P = ${ways}/${totalWays}`;
    evs.push({
      title: "파란 공 1개 이상", ways, total: totalWays, type: t, label,
      formula: `전체 − (빨간만) = ${totalWays} − ${waysOnlyRed} = ${ways}`,
    });
  }
  return evs;
}

function BallLabPanel() {
  const [r, setR] = useState(1);
  const [b, setB] = useState(3);
  const [k, setK] = useState(2);
  const [analyzed, setAnalyzed] = useState<{ r: number; b: number; k: number } | null>(null);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const total = r + b;
  const kMax = Math.max(1, total);
  const kSafe = Math.min(Math.max(1, k), kMax);

  const evs = useMemo(
    () => (analyzed ? computeEvents(analyzed.r, analyzed.b, Math.min(Math.max(1, analyzed.k), analyzed.r + analyzed.b)) : []),
    [analyzed]
  );

  function analyze() {
    if (total === 0) return;
    setOpen({});
    setAnalyzed({ r, b, k: kSafe });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-slate-400">
        상자 속 공의 수를 직접 설정하고, 꺼낼 공의 수를 정한 뒤 각 사건이 어느 유형인지 확인해 보세요.
      </p>

      <div className="space-y-2.5 rounded-xl border border-white/10 bg-slate-900 p-3">
        <p className="text-sm font-bold text-amber-300">📦 상자 설정</p>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="pbp-r" className="min-w-[78px] text-sm text-slate-300">🔴 빨간 공</label>
          <input id="pbp-r" type="range" min={0} max={8} value={r} onChange={(e) => { setR(Number(e.target.value)); setAnalyzed(null); }} className="flex-1 accent-violet-400" />
          <span className="min-w-[24px] text-right text-sm font-bold text-red-300">{r}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="pbp-b" className="min-w-[78px] text-sm text-slate-300">🔵 파란 공</label>
          <input id="pbp-b" type="range" min={0} max={8} value={b} onChange={(e) => { setB(Number(e.target.value)); setAnalyzed(null); }} className="flex-1 accent-violet-400" />
          <span className="min-w-[24px] text-right text-sm font-bold text-blue-300">{b}</span>
        </div>

        <div className="flex min-h-[56px] flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 p-2.5">
          {total === 0 ? (
            <span className="text-xs text-slate-500">공이 없습니다</span>
          ) : (
            <>
              {Array.from({ length: r }, (_, i) => (
                <span key={`r${i}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 text-[10px] font-bold text-white shadow">빨</span>
              ))}
              {Array.from({ length: b }, (_, i) => (
                <span key={`b${i}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-[10px] font-bold text-white shadow">파</span>
              ))}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="pbp-k" className="text-sm text-slate-300">꺼낼 공의 수</label>
          <input id="pbp-k" type="number" min={1} max={kMax} value={k}
            onChange={(e) => { setK(Number(e.target.value) || 1); setAnalyzed(null); }}
            className="w-16 rounded-md border border-white/15 bg-white/[0.07] px-2 py-1 text-center text-sm text-slate-100 outline-none focus:border-violet-400" />
          <span className="text-xs text-slate-500">(최대 {kMax}개)</span>
        </div>

        <button type="button" onClick={analyze} disabled={total === 0}
          className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40">
          🔍 사건 분석하기
        </button>
      </div>

      {analyzed ? (
        <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900 p-3">
          <p className="text-sm font-bold text-amber-300">
            📦 상자: 빨간 {analyzed.r}개 + 파란 {analyzed.b}개 | {analyzed.k}개를 꺼낼 때 (전체 {comb(analyzed.r + analyzed.b, analyzed.k)}가지)
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {evs.map((ev, i) => {
              const tone =
                ev.type === "impossible" ? "border-red-400/60 bg-red-400/10"
                : ev.type === "certain" ? "border-emerald-400/60 bg-emerald-400/10"
                : "border-blue-400/60 bg-blue-400/10";
              const badge =
                ev.type === "impossible" ? "bg-red-400 text-slate-950"
                : ev.type === "certain" ? "bg-emerald-400 text-slate-950"
                : "bg-blue-400 text-slate-950";
              return (
                <button key={i} type="button"
                  onClick={() => setOpen((p) => ({ ...p, [i]: !p[i] }))}
                  className={`rounded-xl border-2 p-3 text-left transition hover:brightness-110 ${tone}`}>
                  <div className="text-sm font-semibold text-slate-100">{ev.title}</div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${badge}`}>{ev.label}</span>
                    <span className="text-[10px] text-slate-400">{open[i] ? "▲" : "▼"}</span>
                  </div>
                  {open[i] ? (
                    <p className="mt-2 rounded bg-black/30 px-2 py-1 font-mono text-[11px] leading-5 text-slate-300">{ev.formula}</p>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500">카드를 누르면 계산식을 펼쳐 볼 수 있습니다.</p>
        </div>
      ) : null}
    </div>
  );
}

function SummaryPanel() {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-slate-400">활동을 통해 알게 된 확률의 기본 성질 세 가지를 정리해요.</p>
      <div className="grid gap-2.5 sm:grid-cols-3">
        <div className="rounded-xl border border-violet-400/40 bg-violet-400/10 p-3.5 text-center">
          <div className="text-2xl">📊</div>
          <h4 className="mt-1 text-sm font-bold text-violet-300">확률의 범위</h4>
          <p className="mt-1.5 font-mono text-base font-bold text-violet-200">0 ≤ P(A) ≤ 1</p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">확률은 항상 0 이상 1 이하의 값을 가집니다.</p>
        </div>
        <div className="rounded-xl border border-red-400/40 bg-red-400/10 p-3.5 text-center">
          <div className="text-2xl">🚫</div>
          <h4 className="mt-1 text-sm font-bold text-red-300">공사건 (∅)</h4>
          <p className="mt-1.5 font-mono text-base font-bold text-red-200">P(∅) = 0</p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">절대로 일어날 수 없는 사건입니다.</p>
        </div>
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3.5 text-center">
          <div className="text-2xl">✅</div>
          <h4 className="mt-1 text-sm font-bold text-emerald-300">전사건 (S)</h4>
          <p className="mt-1.5 font-mono text-base font-bold text-emerald-200">P(S) = 1</p>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">반드시 일어나는 사건(표본공간 전체)입니다.</p>
        </div>
      </div>
    </div>
  );
}

// ── 공용 작은 컴포넌트 ──
function ScoreBoard({ ok, ng, total }: { ok: number; ng: number; total: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <ScoreCard num={ok} lbl="정답" tone="text-emerald-300" />
      <ScoreCard num={ng} lbl="오답" tone="text-red-300" />
      <ScoreCard num={ok + ng} lbl={`/ ${total}`} tone="text-blue-300" />
    </div>
  );
}
function ScoreCard({ num, lbl, tone }: { num: number; lbl: string; tone: string }) {
  return (
    <div className="min-w-[78px] rounded-lg border border-white/12 bg-white/[0.06] px-3 py-1.5 text-center">
      <div className={`text-xl font-bold tabular-nums ${tone}`}>{num}</div>
      <div className="text-[10px] text-slate-400">{lbl}</div>
    </div>
  );
}
function ProgressBar({ value, max, tone }: { value: number; max: number; tone: "violet" | "emerald" }) {
  const pct = Math.round((value / max) * 100);
  const grad = tone === "violet" ? "from-violet-500 to-blue-500" : "from-emerald-500 to-emerald-400";
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
      <div className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}
function ResetBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="rounded-md border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-200">
      ↺ 초기화
    </button>
  );
}

// ── 성찰 질문 ([[activity-reflection-policy]] 게임+탐색+시뮬 혼합 → 2~3개) ──
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  { id: "self_words", kind: "text",
    prompt: "공사건과 전사건을 각각 자기 말로 설명하고, 오늘 활동에서 가장 인상 깊었던 사례를 하나씩 적어 보세요." },
  { id: "why_range", kind: "text",
    prompt: "확률이 0보다 작거나 1보다 클 수 없는 이유를 ‘경우의 수’ 관점에서 설명해 보세요." },
  { id: "daily_life", kind: "text",
    prompt: "일상에서 찾을 수 있는 공사건·전사건의 예를 각각 1가지씩 직접 만들어 보세요." },
];

// ── 메인 ──
type TabKey = "t1" | "t2" | "t3" | "sum";
export default function ProbBasicProperties() {
  const [tab, setTab] = useState<TabKey>("t1");

  // 탭1: 8문제 판정 결과(정/오/미응답)
  const [j1, setJ1] = useState<Record<number, boolean | null>>({});
  const [s1, setS1] = useState({ ok: 0, ng: 0 });
  function judge1(i: number, chosen: boolean) {
    if (j1[i] !== undefined && j1[i] !== null) return;
    const correct = chosen === PROB_CASES[i].valid;
    setJ1((p) => ({ ...p, [i]: correct }));
    setS1((p) => correct ? { ok: p.ok + 1, ng: p.ng } : { ok: p.ok, ng: p.ng + 1 });
  }
  function reset1() { setJ1({}); setS1({ ok: 0, ng: 0 }); }

  // 탭2: 12문제 선택 결과(선택값 또는 null)
  const [j2, setJ2] = useState<Record<number, SAns | null>>({});
  const [s2, setS2] = useState({ ok: 0, ng: 0 });
  function judge2(i: number, chosen: SAns) {
    if (j2[i] != null) return;
    const correct = chosen === SCENARIOS[i].ans;
    setJ2((p) => ({ ...p, [i]: chosen }));
    setS2((p) => correct ? { ok: p.ok + 1, ng: p.ng } : { ok: p.ok, ng: p.ng + 1 });
  }
  function reset2() { setJ2({}); setS2({ ok: 0, ng: 0 }); }

  const tabBtn = (a: boolean, color: string) =>
    a ? `rounded-lg ${color} px-3 py-2 text-sm font-bold text-slate-950`
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 확률</p>
        <h3 className="mt-2 text-2xl font-bold">⚖️ 확률의 기본 성질 탐험</h3>
        <p className="mt-2 leading-7 text-slate-300">
          세 가지 탐구로 <b className="text-violet-300">0 ≤ P(A) ≤ 1</b>, <b className="text-red-300">공사건(P=0)</b>,
          <b className="text-emerald-300"> 전사건(P=1)</b>을 직접 확인해 봅니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-md border border-violet-400/40 bg-violet-400/10 px-2.5 py-1 text-xs font-semibold text-violet-200">① 0 ≤ P(A) ≤ 1</span>
          <span className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200">② P(S) = 1, P(∅) = 0</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "t1", "bg-violet-400")} onClick={() => setTab("t1")}>🔍 탐구 1 · 확률 수사대</button>
        <button type="button" className={tabBtn(tab === "t2", "bg-emerald-400")} onClick={() => setTab("t2")}>🎮 탐구 2 · 사건 판별</button>
        <button type="button" className={tabBtn(tab === "t3", "bg-amber-400")} onClick={() => setTab("t3")}>🎯 탐구 3 · 공 뽑기</button>
        <button type="button" className={tabBtn(tab === "sum", "bg-indigo-400")} onClick={() => setTab("sum")}>📌 정리</button>
      </div>

      <div className="mt-4">
        {tab === "t1" ? <Game1Panel judged={j1} scoreOK={s1.ok} scoreNG={s1.ng} onJudge={judge1} onReset={reset1} />
          : tab === "t2" ? <Game2Panel judged={j2} scoreOK={s2.ok} scoreNG={s2.ng} onJudge={judge2} onReset={reset2} />
          : tab === "t3" ? <BallLabPanel />
          : <SummaryPanel />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
