"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

type QItem = { sc: string; desc: string; q: string; tag: string; opts: string[]; ans: number; hint: string; exp: string };

// 신뢰된 정적 HTML(원본 문항의 <b>/<br>) 렌더.
function Rich({ html, className }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function shuffleProblems(data: QItem[]): QItem[] {
  return data.map((p) => {
    const order = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { ...p, opts: order.map((i) => p.opts[i]), ans: order.indexOf(p.ans) };
  });
}

type Tone = {
  scen: string; scenTitle: string; tag: string; fill: string; optHover: string; badge: string;
};
const TONES: Record<"violet" | "emerald", Tone> = {
  violet: {
    scen: "border-violet-400/40 bg-violet-400/10",
    scenTitle: "text-violet-200",
    tag: "bg-cyan-700 text-cyan-50",
    fill: "fill-violet-500",
    optHover: "hover:border-violet-400 hover:bg-violet-500/25",
    badge: "bg-violet-600",
  },
  emerald: {
    scen: "border-emerald-400/40 bg-emerald-400/10",
    scenTitle: "text-emerald-200",
    tag: "bg-emerald-700 text-emerald-50",
    fill: "fill-emerald-500",
    optHover: "hover:border-emerald-400 hover:bg-emerald-500/25",
    badge: "bg-emerald-600",
  },
};

function VocabQuizGame({ data, toneKey }: { data: QItem[]; toneKey: "violet" | "emerald" }) {
  const tone = TONES[toneKey];
  const [problems, setProblems] = useState<QItem[]>(() => shuffleProblems(data));
  const [cur, setCur] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [log, setLog] = useState<{ q: number; ok: boolean }[]>([]);
  const [finished, setFinished] = useState(false);

  const total = problems.length;
  const p = problems[cur];
  const answered = picked !== null;

  function pick(i: number) {
    if (answered) return;
    const ok = i === p.ans;
    setPicked(i);
    if (ok) setScore((s) => s + 1);
    setLog((prev) => [...prev, { q: cur + 1, ok }]);
  }
  function next() {
    if (cur + 1 >= total) { setFinished(true); return; }
    setCur((c) => c + 1);
    setPicked(null);
  }
  function restart() {
    setProblems(shuffleProblems(data));
    setCur(0); setScore(0); setPicked(null); setLog([]); setFinished(false);
  }

  if (finished) {
    const pct = Math.round((score / total) * 100);
    const r = pct === 100 ? { emoji: "🏆", stars: "⭐⭐⭐", grade: "완벽! 만점!", msg: "모든 문제를 맞혔습니다! 개념을 완벽하게 이해했네요 🎉" }
      : pct >= 80 ? { emoji: "🌟", stars: "⭐⭐", grade: "우수", msg: "훌륭합니다! 대부분의 개념을 잘 이해했어요. 틀린 문제를 한 번 더 확인해 보세요." }
      : pct >= 60 ? { emoji: "👍", stars: "⭐", grade: "양호", msg: "잘 했어요! 조금 더 연습하면 완벽해질 거예요. 다시 도전해 보세요!" }
      : { emoji: "💪", stars: "🌱", grade: "분발 필요", msg: "괜찮아요! 용어 정의를 천천히 복습하고 다시 도전해 보세요." };
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-center">
        <div className="text-5xl">{r.emoji}</div>
        <div className="mt-2 text-2xl tracking-[0.3em]">{r.stars}</div>
        <div className="mt-2 text-3xl font-black text-cyan-300">{score} / {total}점</div>
        <div className="mt-1 text-base font-bold text-slate-200">{r.grade} ({pct}%)</div>
        <p className="mt-2 text-sm leading-6 text-slate-400">{r.msg}</p>
        <div className="mx-auto mt-4 max-w-sm rounded-xl border border-white/10 bg-white/5 p-3 text-left">
          <p className="mb-1.5 text-sm font-bold text-slate-200">📋 문제별 결과</p>
          {log.map((it) => (
            <div key={it.q} className="flex justify-between border-b border-white/8 py-1.5 text-sm last:border-b-0">
              <span className="text-slate-400">문제 {it.q}</span>
              <span className={it.ok ? "font-semibold text-emerald-300" : "font-semibold text-red-300"}>{it.ok ? "✅ 정답" : "❌ 오답"}</span>
            </div>
          ))}
        </div>
        <button type="button" onClick={restart} className={`mt-5 rounded-xl px-7 py-2.5 text-sm font-bold text-white transition hover:brightness-110 ${tone.badge}`}>🔄 다시 도전하기</button>
      </div>
    );
  }

  const pct = Math.round((cur / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
        <span className="text-xs text-slate-400">점수</span>
        <span className={`rounded-full px-3 py-1 text-sm font-bold text-white ${tone.badge}`}>{score} / {cur}</span>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-400"><span>문제 {cur + 1} / {total}</span><span>{pct}%</span></div>
        <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <rect x="0" y="0" width={pct} height="4" className={tone.fill} />
        </svg>
      </div>

      <div className={`mt-3 rounded-xl border p-3.5 ${tone.scen}`}>
        <p className={`text-base font-bold ${tone.scenTitle}`}>{p.sc}</p>
        <p className="mt-0.5 font-mono text-base font-semibold text-slate-300">{p.desc}</p>
      </div>

      <div className="mt-3 rounded-2xl border border-white/12 bg-white/5 p-4">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${tone.tag}`}>{p.tag}</span>
        <Rich html={p.q} className="mt-2.5 block text-lg leading-7 text-slate-100" />
      </div>

      <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">{p.hint}</div>

      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {p.opts.map((o, i) => {
          const showOk = answered && i === p.ans;
          const showWrong = answered && i === picked && i !== p.ans;
          const cls = showOk ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
            : showWrong ? "border-red-500 bg-red-500/15 text-red-200"
            : `border-white/15 bg-white/[0.07] text-slate-200 ${answered ? "" : tone.optHover}`;
          return (
            <button key={i} type="button" disabled={answered} onClick={() => pick(i)}
              className={`flex min-h-[72px] items-center justify-center rounded-xl border-2 px-3 py-3 text-center font-mono text-base font-medium leading-6 transition disabled:cursor-default ${cls}`}>
              {o}
            </button>
          );
        })}
      </div>

      {answered ? (
        <div className={`mt-3 animate-[fadeIn_0.3s_ease] rounded-xl border p-3.5 text-base leading-7 ${picked === p.ans ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-100" : "border-red-400/40 bg-red-400/10 text-red-100"}`}>
          <Rich html={(picked === p.ans ? "✅ 정답! " : "❌ 틀렸습니다. ") + p.exp} />
        </div>
      ) : null}

      {answered ? (
        <button type="button" onClick={next} className={`mt-3 w-full rounded-xl px-4 py-3 text-base font-bold text-white transition hover:brightness-110 ${tone.badge}`}>
          {cur === total - 1 ? "🏆 결과 보기" : "다음 문제 →"}
        </button>
      ) : null}
    </div>
  );
}

// ── 문항 데이터 ──
const TRIAL_EVENT: QItem[] = [
  { sc: "🎲 시나리오 1: 주사위 1개를 던진다", desc: "일반 주사위(1~6면) 1개를 던지는 실험입니다.", q: "이 시행의 <b>표본공간 S</b>는?", tag: "📐 표본공간", opts: ["S = {1, 2, 3, 4, 5, 6}", "S = {홀수, 짝수}", "S = {눈의 수}", "S = {1, 2, 3}"], ans: 0, hint: "💡 표본공간 = 시행에서 일어날 수 있는 모든 결과의 집합", exp: "표본공간은 시행에서 일어날 수 있는 <b>모든 결과의 집합</b>입니다.<br>주사위 눈은 1~6이므로 <b>S = {1, 2, 3, 4, 5, 6}</b>입니다." },
  { sc: "🎲 시나리오 1: 주사위 1개를 던진다", desc: "S = {1, 2, 3, 4, 5, 6}", q: "다음 중 <b>근원사건</b>에 해당하는 것은?", tag: "🔵 근원사건", opts: ["{3}", "{1, 2, 3, 4, 5, 6}", "{홀수가 나오는 경우}", "{1, 2, 3}"], ans: 0, hint: "💡 근원사건 = 표본공간의 원소 단 1개로만 이루어진 사건", exp: "근원사건은 원소가 정확히 <b>1개</b>인 사건입니다.<br>{3}은 원소가 1개 → 근원사건 ✅<br>{1,2,3,4,5,6}은 표본공간 전체이고, {1,2,3}은 원소가 3개라 근원사건이 아닙니다." },
  { sc: "🎲 시나리오 1: 주사위 1개를 던진다", desc: "S = {1, 2, 3, 4, 5, 6}", q: "<b>홀수</b>의 눈이 나오는 사건 A는?", tag: "📋 사건", opts: ["A = {1, 3, 5}", "A = {2, 4, 6}", "A = {1, 2, 3}", "A = {3, 5}"], ans: 0, hint: "💡 사건 = 표본공간의 부분집합 (조건을 만족하는 결과들의 모음)", exp: "홀수: 1, 3, 5 → <b>A = {1, 3, 5}</b><br>이 사건은 표본공간 S의 부분집합입니다." },
  { sc: "🎲 시나리오 1: 주사위 1개를 던진다", desc: "S = {1, 2, 3, 4, 5, 6}", q: "<b>소수</b>의 눈이 나오는 사건 B는?", tag: "📋 사건", opts: ["B = {2, 3, 5}", "B = {1, 3, 5}", "B = {2, 4}", "B = {1, 2, 3, 5}"], ans: 0, hint: "💡 소수: 약수가 1과 자기 자신뿐인 수 — 1은 소수가 아님!", exp: "1~6 중 소수: 2, 3, 5 (1은 소수 ✗)<br>따라서 <b>B = {2, 3, 5}</b>" },
  { sc: "🪙 시나리오 2: 동전 3개를 동시에 던진다", desc: "앞면: H, 뒷면: T", q: "이 시행의 <b>표본공간의 원소 개수</b>는?", tag: "📐 표본공간", opts: ["8개", "6개", "4개", "2개"], ans: 0, hint: "💡 동전 1개 → 2가지, 동전 n개 → 2ⁿ가지", exp: "각 동전은 H 또는 T(2가지), 동전이 3개이므로 2³ = <b>8가지</b><br>{HHH, HHT, HTH, HTT, THH, THT, TTH, TTT}" },
  { sc: "🪙 시나리오 2: 동전 3개를 동시에 던진다", desc: "S = {HHH, HHT, HTH, HTT, THH, THT, TTH, TTT}", q: "<b>앞면이 정확히 2개</b> 나오는 사건 C는?", tag: "📋 사건", opts: ["C = {HHT, HTH, THH}", "C = {HHH, HHT}", "C = {HTT, THT, TTH}", "C = {HHT, HTH}"], ans: 0, hint: "💡 H가 2개, T가 1개인 경우를 모두 찾아보세요.", exp: "H가 2개·T가 1개인 경우: HHT, HTH, THH<br>→ <b>C = {HHT, HTH, THH}</b>" },
  { sc: "🪙 시나리오 2: 동전 3개를 동시에 던진다", desc: "S = {HHH, HHT, HTH, HTT, THH, THT, TTH, TTT}", q: "<b>모두 같은 면</b>이 나오는 사건 D는?", tag: "📋 사건", opts: ["D = {HHH, TTT}", "D = {HHH}", "D = {TTT}", "D = {HHH, HHT, TTH, TTT}"], ans: 0, hint: "💡 모두 앞면이거나 모두 뒷면인 경우를 찾으세요.", exp: "모두 앞면(HHH) 또는 모두 뒷면(TTT)<br>→ <b>D = {HHH, TTT}</b>" },
  { sc: "🪙 시나리오 2: 동전 3개를 동시에 던진다", desc: "S = {HHH, HHT, HTH, HTT, THH, THT, TTH, TTT}", q: "다음 중 <b>근원사건</b>인 것은?", tag: "🔵 근원사건", opts: ["{HTH}", "{H, T}", "{HHH, TTT}", "{HHT, HTH, THH}"], ans: 0, hint: "💡 근원사건은 원소가 반드시 1개!", exp: "근원사건은 원소가 정확히 <b>1개</b>인 사건입니다.<br>{HTH}: 원소 1개 → 근원사건 ✅<br>{HHH, TTT}: 원소 2개 → 근원사건 ✗" },
  { sc: "📚 시나리오 3: 용어 이해 확인", desc: "지금까지 배운 내용을 정리해 봅시다.", q: "다음 중 <b>시행</b>에 해당하는 것은?", tag: "⚡ 시행", opts: ["주사위를 던져 눈의 수를 관찰한다", "2 + 3을 계산하면 항상 5이다", "삼각형 내각의 합은 항상 180°이다", "방정식 x² = 4의 해는 ±2이다"], ans: 0, hint: "💡 시행: 같은 조건에서 반복 가능하고, 결과가 우연에 의해 결정되는 실험/관찰", exp: "시행의 조건: ① 같은 조건에서 반복 가능 ② 결과가 우연에 의해 결정<br>'주사위 던지기'는 두 조건 모두 만족 ✅<br>나머지는 결과가 항상 확정적입니다." },
  { sc: "📚 시나리오 3: 용어 이해 확인", desc: "동전 2개를 동시에 던진다. (앞: H, 뒤: T)", q: "이 시행의 <b>표본공간</b>은?", tag: "📐 표본공간", opts: ["S = {HH, HT, TH, TT}", "S = {HH, TT}", "S = {H, T}", "S = {HH, HT, TT}"], ans: 0, hint: "💡 HT(1번 앞·2번 뒤)와 TH(1번 뒤·2번 앞)는 서로 다른 결과!", exp: "각 동전이 H 또는 T → HH, HT, TH, TT (4가지)<br><b>HT ≠ TH</b> (순서가 다르므로 별개의 결과!)<br>→ S = {HH, HT, TH, TT}" },
];

const MUTUAL_COMPLEMENT: QItem[] = [
  { sc: "📖 개념 1: 배반사건의 정의", desc: "두 사건 A, B가 동시에 일어나지 않을 때, 즉 A∩B = ∅일 때", q: "두 사건 A와 B의 관계를 무엇이라 하는가?", tag: "⚡ 배반사건", opts: ["A와 B는 서로 배반이다", "A와 B는 서로 독립이다", "A와 B는 여사건 관계이다", "A와 B는 합사건 관계이다"], ans: 0, hint: "💡 배반사건: 교집합이 공집합 → 두 사건이 동시에 일어날 수 없음", exp: "A∩B=∅일 때 두 사건 A, B는 <b>서로 배반</b>이라 하고,<br>두 사건을 <b>배반사건</b>이라 합니다." },
  { sc: "📖 개념 2: 배반사건 판별", desc: "S = {1,2,3,4,5,6}, A = {1,2,3}, B = {4,5,6}", q: "A∩B를 구하고, A와 B의 관계를 고르시오.", tag: "⚡ 배반사건", opts: ["A∩B=∅ → 서로 배반이다", "A∩B={3,4} → 배반 아님", "A∩B=S → 여사건이다", "A∩B=A → 배반이다"], ans: 0, hint: "💡 A={1,2,3}과 B={4,5,6}에 공통 원소가 있나요?", exp: "A={1,2,3}과 B={4,5,6}의 공통 원소 없음 → A∩B=∅<br>따라서 <b>A와 B는 서로 배반사건</b>입니다." },
  { sc: "📖 개념 2: 배반사건 판별", desc: "S = {1,2,3,4,5,6}, A = {1,2}, B = {2,3,4}", q: "A와 B는 서로 배반사건인가?", tag: "⚡ 배반사건", opts: ["아니다 (A∩B={2} ≠ ∅)", "그렇다 (A∩B=∅)", "배반이면서 여사건이다", "판단할 수 없다"], ans: 0, hint: "💡 A와 B의 공통 원소를 직접 찾아보세요.", exp: "A={1,2}와 B={2,3,4}의 공통 원소: 2<br>A∩B={2}≠∅이므로 <b>A와 B는 배반사건이 아닙니다.</b>" },
  { sc: "📖 개념 3: 여사건의 정의", desc: "표본공간 S의 한 사건 A에 대하여", q: "<b>사건 A의 여사건 Aᶜ</b>란 무엇인가?", tag: "🔵 여사건", opts: ["사건 A가 일어나지 않는 사건", "사건 A가 일어나는 사건", "S와 완전히 같은 사건", "공집합"], ans: 0, hint: "💡 여사건: 'A가 일어나지 않는다' → S에서 A를 제외한 부분", exp: "사건 A가 <b>일어나지 않는 사건</b>을 A의 여사건이라 하고 <b>Aᶜ</b>로 표기합니다.<br>Aᶜ = S − A" },
  { sc: "📖 개념 4: 여사건의 성질", desc: "사건 A와 그 여사건 Aᶜ", q: "A와 Aᶜ의 관계로 <b>옳은 것</b>은?", tag: "🔵 여사건", opts: ["A∩Aᶜ = ∅ 이고 A∪Aᶜ = S", "A∩Aᶜ = S 이고 A∪Aᶜ = ∅", "A∩Aᶜ = A 이고 A∪Aᶜ = S", "A∩Aᶜ = ∅ 이고 A∪Aᶜ = ∅"], ans: 0, hint: "💡 A와 Aᶜ는 겹치지 않고(∩=∅), 합치면 표본공간 전체(∪=S)가 됩니다.", exp: "A와 Aᶜ는 동시에 일어나지 않음 → <b>A∩Aᶜ = ∅</b><br>A이거나 A가 아닌 경우면 전체 → <b>A∪Aᶜ = S</b>" },
  { sc: "📖 개념 5: 여사건 구하기", desc: "S = {1,2,3,4,5,6}, A = {1,3,5}", q: "여사건 Aᶜ를 구하시오.", tag: "🔵 여사건", opts: ["Aᶜ = {2,4,6}", "Aᶜ = {1,2,3}", "Aᶜ = {3,5}", "Aᶜ = {1,2,3,4,5,6}"], ans: 0, hint: "💡 Aᶜ = S − A : 표본공간에서 A의 원소를 모두 빼면 됩니다.", exp: "Aᶜ = S − A = {1,2,3,4,5,6} − {1,3,5} = <b>{2,4,6}</b>" },
  { sc: "📖 개념 6: 배반사건 vs 여사건 ①", desc: "A와 Aᶜ의 관계를 생각해봅시다.", q: '"<b>여사건이면 배반사건이다</b>"는 참인가?', tag: "🔗 관계 비교", opts: ["참 ○ (A∩Aᶜ=∅이므로 항상 배반)", "거짓 ×", "경우에 따라 다름", "판단 불가"], ans: 0, hint: "💡 A∩Aᶜ = ∅이므로 여사건은 항상 배반사건입니다.", exp: "Aᶜ는 항상 A∩Aᶜ=∅을 만족합니다.<br>따라서 '<b>여사건이면 배반사건이다</b>'는 <b>참 (○)</b>입니다." },
  { sc: "📖 개념 6: 배반사건 vs 여사건 ②", desc: "S = {1,2,3,4,5,6}, A = {1,2}, B = {3,4}", q: '"<b>배반사건이면 여사건이다</b>"는 참인가?', tag: "🔗 관계 비교", opts: ["거짓 × (A∪B={1,2,3,4}≠S이므로 여사건 아님)", "참 ○", "항상 참", "경우에 따라 참"], ans: 0, hint: "💡 배반(A∩B=∅)이어도 A∪B=S가 아니면 여사건이 아닙니다.", exp: "A∩B=∅(배반 ✓) but A∪B={1,2,3,4}≠S<br>배반이어도 합이 S가 아니면 여사건이 아님<br>따라서 '<b>배반사건이면 여사건이다</b>'는 <b>거짓 (×)</b>" },
  { sc: "📖 종합: 배반·여사건 판별", desc: "S = {1,2,3,4,5,6}, A = {2,4}, B = {1,3,5}", q: "A와 B의 관계로 <b>옳은 것</b>은?", tag: "🔗 관계 비교", opts: ["서로 배반이지만 여사건은 아니다 (A∪B≠S)", "서로 여사건이다", "배반도 여사건도 아니다", "배반이면서 여사건이다"], ans: 0, hint: "💡 ① A∩B=? (배반 확인) ② A∪B=S? (여사건 확인)", exp: "A∩B=∅ (배반 ✓) A∪B={1,2,3,4,5}≠S (여사건 ✗)<br>따라서 <b>서로 배반이지만 여사건은 아닙니다.</b>" },
  { sc: "📖 종합: 배반·여사건 판별", desc: "S = {1,2,3,4,5,6}, A = {1,3,5} (홀수), B = {2,4,6} (짝수)", q: "A와 B의 관계로 <b>옳은 것</b>은?", tag: "🔗 관계 비교", opts: ["서로 배반이고 여사건이다 (A∩B=∅, A∪B=S)", "서로 배반이지만 여사건은 아니다", "여사건이지만 배반이 아니다", "아무 관계 없다"], ans: 0, hint: "💡 A∩B=? 와 A∪B=S인지 두 가지를 모두 확인하세요.", exp: "A∩B=∅ (배반 ✓) A∪B={1,2,3,4,5,6}=S (여사건 ✓)<br>따라서 <b>A와 B는 서로 배반이면서 여사건(B=Aᶜ)</b>입니다." },
];

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "vocab_explain",
    prompt:
      "시행·표본공간·사건·근원사건을 자신의 말로 각각 설명하고, 특히 ‘사건’과 ‘근원사건’의 차이를 예를 들어 구분해 보세요.",
    kind: "text",
  },
  {
    id: "exclusive_vs_complement",
    prompt:
      "배반사건(A∩B=∅)과 여사건(Aᶜ=S−A)의 차이를, ‘배반이지만 여사건은 아닌 예’를 직접 들어 설명해 보세요.",
    kind: "text",
  },
];

export default function TrialEventVocabGame() {
  const [tab, setTab] = useState<"trial" | "complement">("trial");
  const tabBtn = (active: boolean) =>
    active ? "rounded-lg bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950"
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 확률</p>
        <h3 className="mt-2 text-2xl font-bold">🎯 확률 용어 마스터</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b className="text-violet-300">시행·표본공간·사건·근원사건</b>과 <b className="text-emerald-300">배반사건·여사건</b>의 개념을 카드 선택 퀴즈로 확인해 보세요. 각 게임 10문항입니다.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "trial")} onClick={() => setTab("trial")}>🎲 시행과 사건</button>
        <button type="button" className={tabBtn(tab === "complement")} onClick={() => setTab("complement")}>🔵 배반사건과 여사건</button>
      </div>

      {/* 두 게임을 모두 마운트해 탭 전환 시 진행 상태 보존 */}
      <div className="mt-4">
        <div className={tab === "trial" ? "" : "hidden"}><VocabQuizGame data={TRIAL_EVENT} toneKey="violet" /></div>
        <div className={tab === "complement" ? "" : "hidden"}><VocabQuizGame data={MUTUAL_COMPLEMENT} toneKey="emerald" /></div>
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
