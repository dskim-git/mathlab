"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

const HAND = ["✊", "☝️", "✌️", "🤟", "🖖", "🖐"];

function computeFreq2(): number[] {
  const f = new Array(11).fill(0);
  for (let a = 0; a <= 5; a++) for (let b = 0; b <= 5; b++) f[a + b]++;
  return f;
}
function computeCases3(): number[][][] {
  const cases: number[][][] = Array.from({ length: 16 }, () => []);
  for (let a = 0; a <= 5; a++) for (let b = 0; b <= 5; b++) for (let c = 0; c <= 5; c++) cases[a + b + c].push([a, b, c]);
  return cases;
}
const randInt = (n: number) => Math.floor(Math.random() * n);

// 합별 경우의 수는 상수 → 모듈 레벨에서 한 번만 계산.
const FREQ2 = computeFreq2();
const CASES3 = computeCases3();
const FREQ3 = CASES3.map((c) => c.length);
const MAX_F2 = Math.max(...FREQ2);
const MAX_F3 = Math.max(...FREQ3);

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "three_sum_count",
    prompt:
      "세 사람이 모라를 할 때(각자 0~5 손가락) 세 손가락의 합이 특정 값 s가 되는 경우의 수를, ‘같은 것이 있는 순열’로 세는 방법을 설명해 보세요. (예: 합 = 7)",
    kind: "text",
  },
  {
    id: "best_call",
    prompt:
      "두 사람 모라에서 어떤 합을 외쳐야 이길 확률이 높은지, 합별 경우의 수 분포(0~10)를 근거로 설명해 보세요.",
    kind: "text",
  },
];

// ═══════════════════════════════════════════════════════════════
//  탭 ① 게임 규칙
// ═══════════════════════════════════════════════════════════════
function RulesTab() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">📖 모라(Morra) 게임이란?</p>
        <div className="mt-2 rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-4 text-sm leading-7 text-indigo-100/90">
          <b className="text-indigo-200">‘모라(Morra)’</b>는 고대 로마부터 이탈리아 사람들이 즐겨온 손가락 게임입니다. 두 사람(또는 세 사람)이 <b>동시에</b> 손가락을 내밀면서, 동시에 두 사람이 내는 <b>손가락 개수의 합</b>을 외칩니다. 자신이 말한 합과 실제 합이 일치하면 이깁니다!
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">🖐 기본 규칙 (두 사람 버전)</p>
        <div className="mt-2 rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-4 text-sm leading-7 text-indigo-100/90">
          <b>① 준비</b>: 두 플레이어가 마주 봅니다.<br />
          <b>② 동시에</b>: 0~5 중 하나를 손가락으로 내면서 두 손가락 합을 예측해 외칩니다. 부를 수 있는 범위 <b className="text-amber-300">0~10</b>(0+0 ~ 5+5).<br />
          <b>③ 판정</b>: 실제 합 = 외친 숫자 → 맞힌 사람 1점. 둘 다 맞히거나 둘 다 틀리면 무승부.<br />
          <b>④ 목표</b>: 정해진 점수(기본 3점)에 먼저 도달하면 승!
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">📐 교과서 예제: 세 사람이 7을 말하면?</p>
        <div className="mt-2 rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-4 text-sm leading-7 text-indigo-100/90">
          세 사람이 각자 손가락을 내고 <b>세 명의 합 = 7</b>인 경우를 따져봅니다. 순서가 다르면 다른 경우 → <b className="text-amber-300">같은 것이 있는 순열</b>!<br />
          (1, 1, 5): 1이 두 개 → <span className="text-amber-300 font-bold">3!/2!1! = 3</span>가지<br />
          (1, 2, 4): 모두 다름 → <span className="text-amber-300 font-bold">3! = 6</span>가지<br />
          (2, 2, 3): 2가 두 개 → <span className="text-amber-300 font-bold">3!/2! = 3</span>가지<br />
          (3, 3, 1): 3이 두 개 → <span className="text-amber-300 font-bold">3!/2! = 3</span>가지
          <div className="mt-2 rounded-lg border border-amber-400/25 bg-amber-400/10 p-2.5 text-center font-mono text-base font-extrabold text-amber-300">
            3! + 3!/2! + 3!/2! + 3!/2! = 6 + 3 + 3 + 3 = 15
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">✋ 손가락 기호표</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {HAND.map((h, i) => (
            <div key={i} className="rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-center">
              <div className="text-2xl">{h}</div>
              <div className="mt-0.5 text-xs text-slate-400">{i}개</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  탭 ② 게임 플레이 (vs AI)
// ═══════════════════════════════════════════════════════════════
type Diff = "easy" | "normal" | "hard";
type Outcome = "win" | "lose" | "draw";
type LogItem = { outcome: Outcome; round: number; pF: number; aF: number; pG: number; aG: number; sum: number };

const DIFF_DESC: Record<Diff, string> = {
  easy: "🎲 AI가 손가락과 예측 숫자를 완전 무작위로 선택합니다. 연습에 적합해요.",
  normal: "🧐 AI가 내 손가락을 어느 정도 읽고 실제 합 ±2 범위에서 예측합니다.",
  hard: "🤖 AI가 70% 확률로 정확한 합을 예측하고, 경우의 수가 가장 많은 합도 노립니다. 이기기 매우 어렵습니다!",
};

function aiFinger(diff: Diff): number {
  if (diff === "hard") {
    const pool = [0, 1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5];
    return pool[randInt(pool.length)];
  }
  return randInt(6);
}
function aiGuess(myF: number, aF: number, diff: Diff, mode: number): number {
  const maxSum = mode === 2 ? 10 : 15;
  if (diff === "easy") return randInt(maxSum + 1);
  if (diff === "normal") {
    const real = myF + aF;
    const pool: number[] = [];
    for (let d = -2; d <= 2; d++) { const v = real + d; if (v >= 0 && v <= maxSum) pool.push(v); }
    pool.push(randInt(maxSum + 1));
    return pool[randInt(pool.length)];
  }
  if (Math.random() < 0.7) return myF + aF;
  const freq = computeFreq2();
  const maxF = Math.max(...freq);
  const cands = freq.map((f, i) => (f === maxF ? i : -1)).filter((x) => x >= 0);
  return cands[randInt(cands.length)];
}

function PlayTab() {
  const [mode, setMode] = useState(2);
  const [diff, setDiff] = useState<Diff>("easy");
  const [goal, setGoal] = useState(3);
  const [sp, setSp] = useState(0);
  const [sa, setSa] = useState(0);
  const [sd, setSd] = useState(0);
  const [round, setRound] = useState(0);
  const [selF, setSelF] = useState(-1);
  const [selG, setSelG] = useState(-1);
  const [result, setResult] = useState<{ tone: Outcome | "none"; text: string }>({ tone: "none", text: "손가락과 숫자를 선택한 뒤 \"내기!\" 버튼을 누르세요." });
  const [detail, setDetail] = useState<React.ReactNode>(null);
  const [log, setLog] = useState<LogItem[]>([]);
  const [over, setOver] = useState(false);

  const maxSum = mode === 2 ? 10 : 15;

  function reset() {
    setSp(0); setSa(0); setSd(0); setRound(0); setSelF(-1); setSelG(-1);
    setResult({ tone: "none", text: "손가락과 숫자를 선택한 뒤 \"내기!\" 버튼을 누르세요." });
    setDetail(null); setLog([]); setOver(false);
  }
  function changeMode(m: number) { setMode(m); reset(); }
  function changeGoal(g: number) { setGoal(g); reset(); }

  function play() {
    if (selF < 0 || selG < 0 || over) return;
    const r = round + 1;
    const aF = aiFinger(diff);
    const aG = aiGuess(selF, aF, diff, mode);
    let a2F = -1, a2G = -1;
    if (mode === 3) { a2F = aiFinger(diff); a2G = aiGuess(selF, a2F, diff, mode); }
    const realSum = mode === 2 ? selF + aF : selF + aF + a2F;

    const pHit = selG === realSum;
    const aHit = aG === realSum;
    const a2Hit = mode === 3 && a2G === realSum;

    let outcome: Outcome;
    if (mode === 2) {
      outcome = pHit && !aHit ? "win" : !pHit && aHit ? "lose" : "draw";
    } else {
      const nHit = [pHit, aHit, a2Hit].filter(Boolean).length;
      outcome = pHit && nHit === 1 ? "win" : !pHit && nHit >= 1 ? "lose" : "draw";
    }

    const nsp = sp + (outcome === "win" ? 1 : 0);
    const nsa = sa + (outcome === "lose" ? 1 : 0);
    setSp(nsp); setSa(nsa); setSd(sd + (outcome === "draw" ? 1 : 0));
    setRound(r);

    setResult({
      tone: outcome,
      text: outcome === "win" ? "🎉 이겼습니다! 정답!"
        : outcome === "lose" ? "😢 졌습니다! AI가 맞혔어요."
        : pHit && aHit ? "🤝 둘 다 맞혔어요! 무승부" : "🤝 둘 다 틀렸어요! 무승부",
    });
    setDetail(
      mode === 2 ? (
        <>
          <b>나:</b> {HAND[selF]}({selF}개) 외침 <b>{selG}</b> &nbsp;|&nbsp; <b>AI:</b> {HAND[aF]}({aF}개) 외침 <b>{aG}</b><br />
          <b>실제 합: {realSum}</b> → {pHit ? "✅ 내 정답" : "❌ 내 오답"} / {aHit ? "✅ AI 정답" : "❌ AI 오답"}
        </>
      ) : (
        <>
          <b>나:</b> {HAND[selF]}({selF}) 외침 {selG} &nbsp;|&nbsp; <b>AI₁:</b> {HAND[aF]}({aF}) 외침 {aG} &nbsp;|&nbsp; <b>AI₂:</b> {HAND[a2F]}({a2F}) 외침 {a2G}<br />
          <b>실제 합: {realSum}</b>
        </>
      )
    );
    setLog((prev) => [{ outcome, round: r, pF: selF, aF, pG: selG, aG, sum: realSum }, ...prev]);

    if (nsp >= goal || nsa >= goal) {
      setOver(true);
      setResult({
        tone: nsp >= goal ? "win" : "lose",
        text: (nsp >= goal ? "🎉 축하합니다! 당신이 이겼습니다!" : "😢 AI가 이겼습니다. 다시 도전!") + `  최종: 나 ${nsp} : AI ${nsa}`,
      });
    }
    setSelF(-1); setSelG(-1);
  }

  const toggle = (active: boolean) =>
    active ? "rounded-lg border border-amber-400/40 bg-amber-400/20 px-3 py-1.5 text-xs font-bold text-amber-200"
      : "rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/10";
  const resultCls = result.tone === "win" ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-200"
    : result.tone === "lose" ? "border-red-400/40 bg-red-400/15 text-red-200"
    : result.tone === "draw" ? "border-indigo-400/40 bg-indigo-400/15 text-indigo-200"
    : "border-dashed border-white/15 bg-white/[0.03] text-slate-500";
  const progress = Math.min(100, Math.round((Math.max(sp, sa) / goal) * 100));

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">🎮 모라 게임 플레이 (vs AI)</p>

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">게임 모드</p>
            <div className="mt-1 flex gap-2">
              <button type="button" className={toggle(mode === 2)} onClick={() => changeMode(2)}>👥 2인</button>
              <button type="button" className={toggle(mode === 3)} onClick={() => changeMode(3)}>👥👤 3인</button>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">AI 난이도</p>
            <div className="mt-1 flex gap-2">
              <button type="button" className={toggle(diff === "easy")} onClick={() => setDiff("easy")}>😊 쉬움</button>
              <button type="button" className={toggle(diff === "normal")} onClick={() => setDiff("normal")}>😐 보통</button>
              <button type="button" className={toggle(diff === "hard")} onClick={() => setDiff("hard")}>😈 어려움</button>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">목표 점수</p>
            <div className="mt-1 flex gap-2">
              {[3, 5, 7].map((g) => <button key={g} type="button" className={toggle(goal === g)} onClick={() => changeGoal(g)}>{g}점</button>)}
            </div>
          </div>
        </div>
        <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-[11px] leading-6 text-slate-400">{DIFF_DESC[diff]}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Kpi num={sp} lbl="나 (승)" tone="text-emerald-300" />
          <Kpi num={sa} lbl="AI (승)" tone="text-red-300" />
          <Kpi num={sd} lbl="무승부" tone="text-indigo-300" />
          <Kpi num={round} lbl="라운드" tone="text-amber-300" />
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="h-full w-full"><rect x="0" y="0" width={progress} height="4" className="fill-amber-400" /></svg>
        </div>

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">① 내 손가락 선택</p>
        <div className="mt-1.5 flex flex-wrap justify-center gap-2">
          {HAND.map((h, i) => (
            <button key={i} type="button" onClick={() => setSelF(i)}
              className={`relative flex h-14 w-14 items-center justify-center rounded-xl border-2 text-2xl transition ${selF === i ? "scale-105 border-amber-400 bg-amber-400/25" : "border-white/15 bg-white/5 hover:bg-amber-400/10"}`}>
              {h}<span className="absolute bottom-0.5 right-1.5 text-[10px] font-bold text-slate-400">{i}</span>
            </button>
          ))}
        </div>

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">② 내가 예측하는 합 (외칠 숫자)</p>
        <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
          {Array.from({ length: maxSum + 1 }, (_, i) => (
            <button key={i} type="button" onClick={() => setSelG(i)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 text-base font-extrabold transition ${selG === i ? "scale-105 border-indigo-400 bg-indigo-400/30 text-white" : "border-white/15 bg-white/5 text-slate-200 hover:bg-indigo-400/15"}`}>
              {i}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={play} disabled={selF < 0 || selG < 0 || over}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-red-500 px-7 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-45">
            ✊ 내기!
          </button>
          <button type="button" onClick={reset} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10">🔄 게임 초기화</button>
        </div>

        <div className={`mt-3 rounded-2xl border p-4 text-center text-lg font-extrabold ${resultCls}`}>{result.text}</div>
        {detail ? <div className="mt-2 rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-3 text-sm leading-7 text-indigo-100/90">{detail}</div> : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">📋 게임 기록</p>
        <div className="mt-2 max-h-60 space-y-1.5 overflow-y-auto">
          {log.length === 0 ? (
            <p className="py-5 text-center text-sm text-slate-500">게임을 시작하면 기록이 쌓입니다.</p>
          ) : log.map((it, i) => {
            const bd = it.outcome === "win" ? "border-l-emerald-400" : it.outcome === "lose" ? "border-l-red-400" : "border-l-indigo-400";
            const badge = it.outcome === "win" ? <span className="rounded bg-emerald-400/25 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200">WIN</span>
              : it.outcome === "lose" ? <span className="rounded bg-red-400/20 px-1.5 py-0.5 text-[10px] font-bold text-red-200">LOSE</span>
              : <span className="rounded bg-indigo-400/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-200">DRAW</span>;
            return (
              <div key={i} className={`flex items-center gap-2.5 rounded-lg border border-white/7 border-l-[3px] bg-white/[0.04] px-3 py-1.5 text-xs ${bd}`}>
                {badge}
                <span className="text-slate-500">#{it.round}</span>
                <span>{HAND[it.pF]}<b className="text-slate-100">{it.pG}</b> vs {HAND[it.aF]}<b className="text-slate-100">{it.aG}</b></span>
                <span className="text-slate-400">합={it.sum}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Kpi({ num, lbl, tone }: { num: number; lbl: string; tone: string }) {
  return (
    <div className="min-w-[80px] flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center">
      <div className={`text-2xl font-black ${tone}`}>{num}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{lbl}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  탭 ③ 경우의 수 분석
// ═══════════════════════════════════════════════════════════════
function BarChart({ freq, max, accentText, accentFill, onPick }: { freq: number[]; max: number; accentText: string; accentFill: string; onPick: (s: number) => void }) {
  return (
    <div className="flex items-end gap-1">
      {freq.map((f, s) => {
        if (f === 0) return <div key={s} className="flex-1" />;
        const h = Math.max(2, (f / max) * 100);
        const isMax = f === max;
        return (
          <button key={s} type="button" onClick={() => onPick(s)} className="flex flex-1 flex-col items-center gap-0.5">
            <span className={`text-[10px] font-bold ${isMax ? accentText : "text-indigo-300"}`}>{f}</span>
            <svg viewBox="0 0 10 100" preserveAspectRatio="none" className="h-20 w-full">
              <rect x="1" y={100 - h} width="8" height={h} rx="1" className={isMax ? accentFill : "fill-indigo-500"} />
            </svg>
            <span className="text-[10px] text-slate-400">{s}</span>
          </button>
        );
      })}
    </div>
  );
}

function AnalysisTab() {
  const freq2 = FREQ2, freq3 = FREQ3, cases3 = CASES3, maxF2 = MAX_F2, maxF3 = MAX_F3;
  const [sum2, setSum2] = useState<number | null>(null);
  const [sum3, setSum3] = useState<number | null>(null);

  const cases2: number[][] = [];
  if (sum2 !== null) {
    for (let a = 0; a <= 5; a++) for (let b = 0; b <= 5; b++) if (a + b === sum2) cases2.push([a, b]);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">📊 두 사람 모라: 합별 경우의 수</p>
        <div className="mt-2 rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-3 text-sm leading-7 text-indigo-100/90">
          두 사람이 각각 0~5 → 전체 <b className="text-amber-300">6 × 6 = 36가지</b>. 각 합(0~10)별 경우의 수를 확인하세요. <b>경우의 수가 큰 합을 외칠수록 이길 확률이 높아집니다.</b>
        </div>
        <div className="mt-3"><BarChart freq={freq2} max={maxF2} accentText="text-emerald-300" accentFill="fill-emerald-500" onPick={setSum2} /></div>
        <p className="mt-1 text-center text-[11px] text-slate-500">합 (막대 클릭 → 경우 목록)</p>
        {sum2 !== null ? (
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">합 = {sum2} 인 경우: 총 {cases2.length}가지</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {cases2.map(([a, b], i) => (
                <div key={i} className="min-w-[80px] rounded-xl border border-indigo-400/30 bg-indigo-400/15 px-3 py-2 text-center text-lg">
                  {HAND[a]}+{HAND[b]}<br /><span className="font-mono text-xs text-slate-400">({a}+{b}={sum2})</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">📐 세 사람 모라: 합별 경우의 수</p>
        <div className="mt-2 rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-3 text-sm leading-7 text-indigo-100/90">
          세 사람 각각 0~5 → 전체 <b className="text-amber-300">6³ = 216가지</b>. 같은 것이 있는 순열로 계산: 합이 s인 경우의 수 = Σ <b>3!/(a!b!c!)</b>.
        </div>
        <div className="mt-3"><BarChart freq={freq3} max={maxF3} accentText="text-amber-300" accentFill="fill-amber-500" onPick={setSum3} /></div>
        <p className="mt-1 text-center text-[11px] text-slate-500">합 (막대 클릭 → 경우 목록)</p>
        {sum3 !== null ? (
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">합 = {sum3} 인 경우: 총 {cases3[sum3].length}가지</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {cases3[sum3].slice(0, 60).map(([a, b, c], i) => (
                <div key={i} className="min-w-[90px] rounded-xl border border-amber-400/20 bg-amber-400/10 px-2.5 py-1.5 text-center text-base">
                  {HAND[a]}{HAND[b]}{HAND[c]}<br /><span className="font-mono text-[11px] text-slate-400">({a},{b},{c})</span>
                </div>
              ))}
              {cases3[sum3].length > 60 ? <div className="self-center text-xs text-slate-500">… +{cases3[sum3].length - 60}가지 더</div> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  탭 ④ 필승 전략 탐구
// ═══════════════════════════════════════════════════════════════
type Strat = "random" | "max" | "even" | "odd" | "mixed";
const STRATEGIES: Strat[] = ["random", "max", "even", "odd", "mixed"];
const STRAT_LABEL: Record<Strat, string> = { random: "🎲무작위", max: "📈최빈합", even: "🔢짝수", odd: "🔣홀수", mixed: "🎯균등" };
const STRAT_FULL: Record<Strat, string> = {
  random: "🎲 무작위", max: "📈 최빈 합 (5·6·7)", even: "🔢 짝수 선택", odd: "🔣 홀수 선택", mixed: "🎯 5~9 균등 선택",
};

// 전략별 (손가락 f, 외칠 합 g) 선택. 손가락은 모든 전략 공통 무작위.
function pick(strat: Strat): { f: number; g: number } {
  const f = randInt(6);
  let g: number;
  if (strat === "random") g = randInt(11);
  else if (strat === "max") g = [5, 6, 7][randInt(3)];
  else if (strat === "even") g = [0, 2, 4, 6, 8, 10][randInt(6)];
  else if (strat === "odd") g = [1, 3, 5, 7, 9][randInt(5)];
  else g = [5, 5, 6, 6, 7, 7, 8, 9][randInt(8)];
  return { f, g };
}

function StrategyTab() {
  const [myStrat, setMyStrat] = useState<Strat>("random");
  const [aiStrat, setAiStrat] = useState<Strat>("random");
  const [sim, setSim] = useState<{ w: number; l: number; d: number } | null>(null);
  const [cache, setCache] = useState<Record<string, number>>({});

  function run() {
    let w = 0, l = 0, d = 0;
    for (let i = 0; i < 1000; i++) {
      const A = pick(myStrat), B = pick(aiStrat);
      const sum = A.f + B.f;
      const aHit = A.g === sum, bHit = B.g === sum;
      if (aHit && !bHit) w++;
      else if (!aHit && bHit) l++;
      else d++;
    }
    setSim({ w, l, d });
    const winRate = w + l > 0 ? (w / (w + l)) * 100 : 50;
    setCache((prev) => ({ ...prev, [`${myStrat}_${aiStrat}`]: winRate }));
  }

  const stratBtn = (active: boolean) =>
    active ? "rounded-lg border border-amber-400/40 bg-amber-400/20 px-3 py-2 text-left text-xs font-bold text-amber-200"
      : "rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left text-xs font-semibold text-slate-400 transition hover:bg-white/10";

  const total = sim ? sim.w + sim.l + sim.d : 0;
  const wP = sim ? (sim.w / total) * 100 : 0;
  const dP = sim ? (sim.d / total) * 100 : 0;
  const lP = sim ? (sim.l / total) * 100 : 0;
  const winRate = sim && sim.w + sim.l > 0 ? ((sim.w / (sim.w + sim.l)) * 100).toFixed(1) : "—";

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">🧠 필승 전략 시뮬레이션</p>
        <div className="mt-2 rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-3 text-sm leading-7 text-indigo-100/90">
          나의 전략과 AI 전략을 고른 뒤 1000번 시뮬레이션을 돌려, 어떤 조합이 유리한지 데이터로 확인해 보세요!
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">나의 전략</p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {STRATEGIES.map((s) => <button key={s} type="button" className={stratBtn(myStrat === s)} onClick={() => setMyStrat(s)}>{STRAT_FULL[s]}</button>)}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">AI 전략</p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {STRATEGIES.map((s) => <button key={s} type="button" className={stratBtn(aiStrat === s)} onClick={() => setAiStrat(s)}>{STRAT_FULL[s]}</button>)}
            </div>
          </div>
        </div>
        <button type="button" onClick={run} className="mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110">
          ▶ 1000회 시뮬레이션 실행
        </button>

        {sim ? (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              <Kpi num={sim.w} lbl="나 승" tone="text-emerald-300" />
              <Kpi num={sim.l} lbl="AI 승" tone="text-red-300" />
              <Kpi num={sim.d} lbl="무승부" tone="text-indigo-300" />
            </div>
            <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="mt-3 h-7 w-full overflow-hidden rounded-lg">
              <rect x="0" y="0" width={wP} height="8" className="fill-emerald-500" />
              <rect x={wP} y="0" width={dP} height="8" className="fill-indigo-500" />
              <rect x={wP + dP} y="0" width={lP} height="8" className="fill-red-500" />
            </svg>
            <div className="mt-1 flex justify-between text-[11px] text-slate-400">
              <span className="text-emerald-300">나 승 {wP.toFixed(1)}%</span>
              <span className="text-indigo-300">무 {dP.toFixed(1)}%</span>
              <span className="text-red-300">AI 승 {lP.toFixed(1)}%</span>
            </div>
            <p className="mt-3 rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-3 text-sm leading-7 text-indigo-100/90">
              {sim.w > sim.l ? <><b>내 전략({STRAT_LABEL[myStrat]})</b>이 AI({STRAT_LABEL[aiStrat]})를 이겼습니다! 승률(무승부 제외) <b className="text-amber-300">{winRate}%</b></>
                : sim.w < sim.l ? <>AI({STRAT_LABEL[aiStrat]})가 더 강합니다. 다른 전략을 시도해 보세요. 내 승률 <b className="text-amber-300">{winRate}%</b></>
                : <>두 전략의 승률이 비슷합니다 ({winRate}%).</>}
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-bold text-amber-300">💡 교과서 필승 전략 정리</p>
        <div className="mt-2 rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-4 text-sm leading-7 text-indigo-100/90">
          <b>[규칙 변형] 두 수의 곱이 홀수/짝수 맞히기 (각자 1~5)</b><br />
          ① 곱이 홀수 = (홀×홀) → 3×3 = <span className="text-amber-300 font-bold">9가지</span><br />
          ② 곱이 짝수 = 나머지 → 5×5 − 9 = <span className="text-amber-300 font-bold">16가지</span><br />
          ➡ <b>짝수를 말하면 16/25 ≈ 64% 확률로 승리!</b><br /><br />
          <b>[기본 규칙] 두 사람 합 분포 (0~5, 36가지)</b><br />
          <span className="text-amber-300">0:1, 1:2, 2:3, 3:4, 4:5, 5:6, 6:5, 7:4, 8:3, 9:2, 10:1</span><br />
          → <b>합 5가 6가지로 최대</b>. 경우의 수가 큰 합을 외칠수록 유리합니다.
        </div>

        <p className="mt-4 text-sm font-bold text-amber-300">🔢 전략별 기대 승률 요약표 (무승부 제외 내 승률)</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="text-amber-300">
                <th className="border border-white/10 px-2 py-1.5">나 ↓ / AI →</th>
                {STRATEGIES.map((s) => <th key={s} className="border border-white/10 px-2 py-1.5">{STRAT_LABEL[s]}</th>)}
              </tr>
            </thead>
            <tbody>
              {STRATEGIES.map((ms) => (
                <tr key={ms}>
                  <td className="border border-white/10 px-2 py-1.5 text-left font-bold text-slate-100">{STRAT_LABEL[ms]}</td>
                  {STRATEGIES.map((as) => {
                    const v = cache[`${ms}_${as}`];
                    const cls = v === undefined ? "text-slate-500" : v > 55 ? "bg-emerald-400/15 text-emerald-200 font-bold" : v < 45 ? "bg-red-400/10 text-red-200" : "text-slate-300";
                    return <td key={as} className={`border border-white/10 px-2 py-1.5 text-center ${cls}`}>{v === undefined ? "—" : `${v.toFixed(1)}%`}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">조합을 바꿔 시뮬레이션을 실행하면 표가 채워집니다.</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  메인
// ═══════════════════════════════════════════════════════════════
type TabKey = "rules" | "play" | "analysis" | "strategy";

export default function MorraGame() {
  const [tab, setTab] = useState<TabKey>("rules");
  const tabBtn = (active: boolean) =>
    active ? "rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950"
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 같은 것이 있는 순열</p>
        <h3 className="mt-2 text-2xl font-bold">✊ 손가락 게임 ‘모라’</h3>
        <p className="mt-2 leading-7 text-slate-300">
          고대 로마부터 이탈리아에서 즐겨온 손가락 게임 <b className="text-amber-300">‘모라(Morra)’</b>를 플레이하고,{" "}
          <b className="text-cyan-300">같은 것이 있는 순열</b>로 경우의 수를 분석하며 필승 전략을 탐구해 봅시다!
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "rules")} onClick={() => setTab("rules")}>📖 게임 규칙</button>
        <button type="button" className={tabBtn(tab === "play")} onClick={() => setTab("play")}>🎮 게임 플레이</button>
        <button type="button" className={tabBtn(tab === "analysis")} onClick={() => setTab("analysis")}>📊 경우의 수 분석</button>
        <button type="button" className={tabBtn(tab === "strategy")} onClick={() => setTab("strategy")}>🧠 필승 전략</button>
      </div>

      <div className="mt-4">
        {tab === "rules" ? <RulesTab /> : tab === "play" ? <PlayTab /> : tab === "analysis" ? <AnalysisTab /> : <StrategyTab />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
