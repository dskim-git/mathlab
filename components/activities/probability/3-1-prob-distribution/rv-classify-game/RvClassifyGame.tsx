"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

type RvType = "discrete" | "continuous";

type Card = {
  icon: string;
  title: string;
  desc: string;
  type: RvType;
  reason: string;
};

const DECK: Card[] = [
  // 이산 — 셀 수 있는 값
  {
    icon: "🎯",
    title: "양궁 과녁 적중 횟수",
    desc: "양궁 선수가 화살 10발을 쏠 때, 10점 과녁에 맞힌 화살의 개수",
    type: "discrete",
    reason: "화살을 맞힌 횟수는 0, 1, 2, …, 10 중 하나의 정수값만 가집니다. (셀 수 있음)",
  },
  {
    icon: "📱",
    title: "카카오톡 메시지 수",
    desc: "하루 동안 내가 받은 카카오톡 메시지의 총 개수",
    type: "discrete",
    reason: "메시지 수는 0, 1, 2, 3, … 처럼 셀 수 있는 자연수 값을 가집니다.",
  },
  {
    icon: "🎲",
    title: "주사위 눈의 합",
    desc: "주사위 두 개를 동시에 던졌을 때 나오는 두 눈의 합",
    type: "discrete",
    reason: "눈의 합은 2, 3, 4, …, 12 중 하나의 값만 가집니다. (유한개, 셀 수 있음)",
  },
  {
    icon: "🏀",
    title: "자유투 성공 횟수",
    desc: "농구 선수가 자유투 20번 중 성공한 횟수",
    type: "discrete",
    reason: "성공 횟수는 0, 1, 2, …, 20 중 하나의 정수값만 가집니다.",
  },
  {
    icon: "✅",
    title: "수능 맞힌 문제 수",
    desc: "수능 국어 45문항 중 한 학생이 맞힌 문제의 수",
    type: "discrete",
    reason: "0, 1, 2, …, 45 사이의 정수값만 가능합니다. (유한개)",
  },
  {
    icon: "🎰",
    title: "로또 일치 번호 수",
    desc: "로또 복권 한 장에서 추첨 번호와 일치하는 번호의 개수",
    type: "discrete",
    reason: "0, 1, 2, 3, 4, 5, 6 중 하나의 값만 가집니다. (유한개)",
  },
  {
    icon: "🐟",
    title: "잡힌 물고기 수",
    desc: "어부가 하루 동안 그물로 잡은 물고기의 수",
    type: "discrete",
    reason: "물고기 수는 0, 1, 2, 3, … 처럼 셀 수 있는 자연수 값을 가집니다.",
  },
  {
    icon: "💌",
    title: "하루 이메일 수",
    desc: "회사원이 하루 동안 받은 업무 이메일의 수",
    type: "discrete",
    reason: "이메일 수는 0, 1, 2, 3, … 처럼 셀 수 있는 자연수 값을 가집니다.",
  },
  {
    icon: "🦟",
    title: "모기에 물린 횟수",
    desc: "야외 캠핑 하룻밤 동안 모기에 물린 횟수",
    type: "discrete",
    reason: "물린 횟수는 0, 1, 2, 3, … 처럼 셀 수 있는 자연수 값을 가집니다.",
  },
  {
    icon: "🚌",
    title: "버스 탑승 승객 수",
    desc: "오전 8시 등교 시간대 버스 한 대에 탑승한 승객 수",
    type: "discrete",
    reason: "승객 수는 0, 1, 2, 3, … 처럼 셀 수 있는 자연수 값을 가집니다.",
  },
  // 연속 — 범위 내 모든 실수
  {
    icon: "📏",
    title: "학생의 키",
    desc: "고등학생 한 명을 임의로 선택했을 때 그 학생의 키 (cm)",
    type: "continuous",
    reason: "키는 160.3, 172.85, 158.0123, … 처럼 어떤 범위 내의 모든 실수 값을 가질 수 있습니다.",
  },
  {
    icon: "⏱️",
    title: "100m 달리기 기록",
    desc: "학생이 100m 달리기를 완주하는 데 걸리는 시간 (초)",
    type: "continuous",
    reason: "기록은 10.5초, 12.47초, 11.823초 … 처럼 어느 범위 안의 모든 실수 값이 가능합니다.",
  },
  {
    icon: "🌡️",
    title: "서울 낮 기온",
    desc: "특정 날 낮 12시 서울의 기온 (°C)",
    type: "continuous",
    reason: "기온은 23.5°C, 27.14°C, 19.001°C … 처럼 어느 범위 내의 모든 실수 값을 가질 수 있습니다.",
  },
  {
    icon: "⛽",
    title: "자동차 연비",
    desc: "어떤 자동차가 연료 1L로 달릴 수 있는 거리 (km/L)",
    type: "continuous",
    reason: "연비는 12.3, 15.7, 11.85 … 처럼 특정 범위 내의 모든 실수 값을 가집니다.",
  },
  {
    icon: "⏳",
    title: "카페 대기 시간",
    desc: "카페에서 주문 후 음료를 받을 때까지 기다리는 시간 (분)",
    type: "continuous",
    reason: "대기 시간은 2.5분, 3.14분, 4.82분 … 처럼 어느 범위 안의 모든 실수 값이 가능합니다.",
  },
  {
    icon: "🔋",
    title: "스마트폰 배터리 지속 시간",
    desc: "스마트폰을 완충했을 때 배터리가 지속되는 시간 (시간)",
    type: "continuous",
    reason: "사용 시간은 8.3시간, 10.47시간, 9.8시간 … 처럼 실수 값을 가질 수 있습니다.",
  },
  {
    icon: "🌧️",
    title: "하루 강수량",
    desc: "특정 날 서울의 하루 동안 내린 비의 양 (mm)",
    type: "continuous",
    reason: "강수량은 5.3mm, 12.7mm, 0.85mm … 처럼 어느 범위 내의 모든 실수 값을 가집니다.",
  },
  {
    icon: "💊",
    title: "알약 한 개의 무게",
    desc: "공장에서 생산된 진통제 알약 한 개의 무게 (g)",
    type: "continuous",
    reason: "무게는 0.498g, 0.502g, 0.4997g … 처럼 어느 범위 내의 실수 값을 가질 수 있습니다.",
  },
  {
    icon: "🏃",
    title: "마라톤 완주 시간",
    desc: "마라톤 선수가 42.195km를 완주하는 데 걸리는 시간 (시간)",
    type: "continuous",
    reason: "완주 시간은 2.5시간, 3.15시간, 2.87시간 … 처럼 어느 범위 내의 모든 실수 값을 가질 수 있습니다.",
  },
  {
    icon: "🍕",
    title: "피자의 지름",
    desc: "피자 가게에서 직접 구운 원형 피자의 지름 (cm)",
    type: "continuous",
    reason: "피자 지름은 30.1cm, 29.85cm, 30.42cm … 처럼 어느 범위 내의 실수 값을 가집니다.",
  },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type GameState = {
  cards: Card[];
  cur: number;
  score: number;
  picked: RvType | null;
  mistakes: Card[];
  finished: boolean;
};

function initialState(): GameState {
  return { cards: shuffle(DECK), cur: 0, score: 0, picked: null, mistakes: [], finished: false };
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "criterion_and_confusion",
    prompt:
      "이산확률변수와 연속확률변수를 구분하는 핵심 기준을 자신의 말로 설명해 보세요. 헷갈렸던 사례가 있다면 어떻게 판단했는지 함께 적어 보세요.",
    kind: "text",
    placeholder: "예: 값을 셀 수 있는지로 구분한다. 처음엔 '버스 승객 수'가 많아 보여 헷갈렸지만, 결국 0,1,2,… 정수만 가능해서 이산이라 판단했다.",
  },
];

export default function RvClassifyGame() {
  const [state, setState] = useState<GameState>(initialState);
  const { cards, cur, score, picked, mistakes, finished } = state;
  const total = cards.length;
  const card = cards[cur];
  const answered = picked !== null;

  function pick(type: RvType) {
    if (answered || finished) return;
    const ok = type === card.type;
    setState((s) => ({
      ...s,
      picked: type,
      score: ok ? s.score + 1 : s.score,
      mistakes: ok ? s.mistakes : [...s.mistakes, card],
    }));
  }

  function next() {
    setState((s) => {
      const nextCur = s.cur + 1;
      if (nextCur >= s.cards.length) return { ...s, finished: true };
      return { ...s, cur: nextCur, picked: null };
    });
  }

  function restart() {
    setState(initialState());
  }

  const progressPct = finished ? 100 : Math.round((cur / total) * 100);
  const cardTone =
    !answered
      ? "border-white/15 bg-white/[0.05]"
      : picked === card.type
      ? "border-emerald-400/60 bg-emerald-400/10"
      : "border-rose-400/60 bg-rose-400/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">🎮 이산 vs 연속 확률변수 분류 게임</h3>
        <p className="mt-2 leading-7 text-slate-300">
          확률변수는 가질 수 있는 <b className="text-indigo-300">값의 범위</b>에 따라 두 종류로 나뉩니다.
          아래 카드를 보고 <b className="text-indigo-300">이산</b>인지 <b className="text-pink-300">연속</b>인지 분류해 보세요 — 총 {total}문항.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-indigo-400/30 bg-indigo-400/5 p-3.5">
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-200">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-400" />
              이산확률변수
            </div>
            <p className="mt-1 text-sm text-slate-300">셀 수 있는 값 (0, 1, 2, … 같은 정수)</p>
          </div>
          <div className="rounded-xl border border-pink-400/30 bg-pink-400/5 p-3.5">
            <div className="flex items-center gap-2 text-sm font-bold text-pink-200">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-pink-400" />
              연속확률변수
            </div>
            <p className="mt-1 text-sm text-slate-300">어떤 범위 안의 모든 실수 값</p>
          </div>
        </div>
      </div>

      {!finished ? (
        <>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-xs text-slate-400">진행률</p>
              <p className="text-sm font-semibold text-slate-200">
                {Math.min(cur + 1, total)} / {total}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">정답</p>
              <p className="text-lg font-black text-cyan-300">
                {score}
                <span className="ml-1 text-sm font-normal text-slate-400">/ {answered ? cur + 1 : cur}</span>
              </p>
            </div>
          </div>

          <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <rect x="0" y="0" width={progressPct} height="4" className="fill-cyan-400" />
          </svg>

          <div
            key={`card-${cur}`}
            className={`mt-5 animate-[fadeIn_0.35s_ease] rounded-2xl border-2 px-6 py-7 text-center transition ${cardTone}`}
          >
            <div className="text-5xl">{card.icon}</div>
            <h4 className="mt-2 text-lg font-bold text-amber-200">{card.title}</h4>
            <p className="mt-2 leading-7 text-slate-200">{card.desc}</p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => pick("discrete")}
              disabled={answered}
              className={`rounded-2xl border-2 px-4 py-4 text-left transition disabled:cursor-default disabled:opacity-60 ${
                answered && card.type === "discrete"
                  ? "border-emerald-400 bg-emerald-400/15"
                  : answered && picked === "discrete"
                  ? "border-rose-400 bg-rose-400/15"
                  : "border-indigo-400/40 bg-indigo-500/10 hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-indigo-500/20"
              }`}
            >
              <p className="text-base font-bold text-indigo-100">🔵 이산확률변수</p>
              <p className="mt-1 text-xs text-indigo-200/80">값을 셀 수 있다 (0, 1, 2, …)</p>
            </button>
            <button
              type="button"
              onClick={() => pick("continuous")}
              disabled={answered}
              className={`rounded-2xl border-2 px-4 py-4 text-left transition disabled:cursor-default disabled:opacity-60 ${
                answered && card.type === "continuous"
                  ? "border-emerald-400 bg-emerald-400/15"
                  : answered && picked === "continuous"
                  ? "border-rose-400 bg-rose-400/15"
                  : "border-pink-400/40 bg-pink-500/10 hover:-translate-y-0.5 hover:border-pink-400 hover:bg-pink-500/20"
              }`}
            >
              <p className="text-base font-bold text-pink-100">🔴 연속확률변수</p>
              <p className="mt-1 text-xs text-pink-200/80">범위 내 모든 실수 값 가능</p>
            </button>
          </div>

          {answered ? (
            <div
              className={`mt-4 animate-[fadeIn_0.3s_ease] rounded-xl border p-4 ${
                picked === card.type
                  ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-100"
                  : "border-rose-400/45 bg-rose-400/10 text-rose-100"
              }`}
            >
              <p className="text-base font-bold">
                {picked === card.type ? "✅ 정답!" : "❌ 아쉽네요!"}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-200">
                <b>「{card.title}」</b>은(는){" "}
                <span className={card.type === "discrete" ? "text-indigo-200" : "text-pink-200"}>
                  {card.type === "discrete" ? "🔵 이산확률변수" : "🔴 연속확률변수"}
                </span>
                입니다.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">💡 {card.reason}</p>
            </div>
          ) : null}

          {answered ? (
            <button
              type="button"
              onClick={next}
              className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3 text-base font-bold text-slate-950 transition hover:brightness-110"
            >
              {cur + 1 >= total ? "🏆 결과 보기" : "다음 문제 →"}
            </button>
          ) : null}
        </>
      ) : (
        <ResultPanel
          score={score}
          total={total}
          mistakes={mistakes}
          onRestart={restart}
        />
      )}

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function ResultPanel({
  score,
  total,
  mistakes,
  onRestart,
}: {
  score: number;
  total: number;
  mistakes: Card[];
  onRestart: () => void;
}) {
  const pct = Math.round((score / total) * 100);
  const dT = DECK.filter((c) => c.type === "discrete").length;
  const cT = DECK.filter((c) => c.type === "continuous").length;
  const missD = mistakes.filter((m) => m.type === "discrete").length;
  const missC = mistakes.filter((m) => m.type === "continuous").length;
  const dC = dT - missD;
  const cC = cT - missC;
  const r = pct >= 90
    ? { emoji: "🏆", title: "완벽해요!", desc: "이산·연속 확률변수를 완벽하게 구분했습니다!" }
    : pct >= 75
    ? { emoji: "🎉", title: "훌륭해요!", desc: "대부분 정확하게 분류했어요. 거의 다 왔습니다!" }
    : pct >= 55
    ? { emoji: "💪", title: "잘했어요!", desc: "절반 이상 맞혔어요. 틀린 문제를 확인해 보세요." }
    : { emoji: "📚", title: "다시 도전!", desc: "틀린 문제를 꼼꼼히 보고 다시 도전해 보세요!" };

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
      <div className="text-5xl">{r.emoji}</div>
      <h4 className="mt-2 text-2xl font-bold text-amber-200">{r.title}</h4>
      <p className="mt-3 text-4xl font-black">
        <span className="text-cyan-300">{score}</span>
        <span className="text-slate-300"> / {total}</span>
        <span className="ml-2 text-base font-normal text-slate-400">({pct}%)</span>
      </p>
      <p className="mt-2 text-sm text-slate-400">{r.desc}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-indigo-400/30 bg-indigo-400/10 p-3">
          <p className="text-xs text-indigo-200/80">🔵 이산확률변수</p>
          <p className="mt-1 text-2xl font-bold text-indigo-200">{dC} <span className="text-base font-normal text-slate-400">/ {dT}</span></p>
        </div>
        <div className="rounded-xl border border-pink-400/30 bg-pink-400/10 p-3">
          <p className="text-xs text-pink-200/80">🔴 연속확률변수</p>
          <p className="mt-1 text-2xl font-bold text-pink-200">{cC} <span className="text-base font-normal text-slate-400">/ {cT}</span></p>
        </div>
      </div>

      {mistakes.length > 0 ? (
        <div className="mt-5 text-left">
          <p className="mb-2 text-sm font-bold text-rose-300">❌ 틀린 문제 ({mistakes.length}개) — 다시 확인해요!</p>
          <ul className="space-y-2">
            {mistakes.map((m) => (
              <li key={m.title} className="rounded-xl border border-rose-400/25 bg-white/[0.03] p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.icon}</span>
                  <span className="font-bold text-rose-200">{m.title}</span>
                </div>
                <p className="mt-1 text-sm text-slate-300">{m.desc}</p>
                <p className="mt-1 text-sm text-emerald-300">
                  ✅ 정답: {m.type === "discrete" ? "이산확률변수" : "연속확률변수"}
                </p>
                <p className="mt-1 text-sm text-slate-400">💡 {m.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onRestart}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-base font-bold text-white transition hover:brightness-110"
      >
        🔄 다시 도전하기
      </button>
    </div>
  );
}
