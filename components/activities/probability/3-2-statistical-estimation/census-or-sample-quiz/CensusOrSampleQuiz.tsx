"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 데이터 ─────────────────────────────────────────────────
type Ans = "census" | "sample";
type Question = {
  icon: string;
  q: string;
  sub: string;
  ans: Ans;
  exp: string;
};

const QUESTIONS: Question[] = [
  { icon: "🏫", q: "우리 반 학생 28명의 평균 신장 조사", sub: "학급 전체를 대상으로 한 키 조사", ans: "census",
    exp: "모집단(학급 28명)이 매우 작아 <strong>전체를 조사</strong>해도 큰 부담이 없어요. 작은 모집단은 전수조사로 정확한 자료를 얻을 수 있어요." },
  { icon: "💡", q: "어느 형광등 공장에서 생산된 형광등의 평균 수명", sub: "수명을 측정하려면 끝까지 켜야 함", ans: "sample",
    exp: "수명을 끝까지 측정하면 형광등이 <strong>다 타버려 못 쓰게 돼요</strong>(파괴조사). 일부만 뽑아 조사하는 표본조사가 적절해요." },
  { icon: "🗳️", q: "대통령 국정 지지율 여론조사", sub: "국민의 정치적 의견 파악", ans: "sample",
    exp: "우리나라 성인 약 <strong>4천만 명을 모두 조사</strong>하는 것은 비용과 시간이 너무 많이 들어요. 표본조사로 비교적 빠르고 저렴하게 파악해요." },
  { icon: "🩺", q: "우리 학교 전체 학생의 매년 시력 검사", sub: "보건교사가 학생 한 명 한 명을 검진", ans: "census",
    exp: "학생 개개인의 건강 상태를 정확히 파악해야 하므로 <strong>모든 학생을 검사</strong>해요. 학교 보건 시스템에서 매년 시행하는 대표적인 전수조사예요." },
  { icon: "🚗", q: "새로 출시된 자동차의 충돌 안전성 검사", sub: "차량을 벽에 부딪쳐 안전성 평가", ans: "sample",
    exp: "한 번 충돌 시험을 하면 차가 <strong>완전히 파손</strong>돼요. 전수조사를 하면 팔 차가 남지 않으므로 표본조사가 필수예요." },
  { icon: "🏠", q: "5년마다 시행되는 인구주택총조사", sub: "전 국민과 모든 주택의 현황 파악", ans: "census",
    exp: "국가 정책 수립의 기초가 되는 자료이므로 <strong>모든 국민·주택</strong>을 대상으로 해요. 통계청이 5년마다 시행하는 대표적인 전수조사예요." },
  { icon: "🥫", q: "통조림 공장의 식품 위생 검사", sub: "통조림을 개봉하여 내용물 검사", ans: "sample",
    exp: "통조림을 열어 검사하면 <strong>상품 가치를 잃게 돼요</strong>(파괴조사). 표본을 뽑아 검사하는 품질관리 방식을 사용해요." },
  { icon: "📺", q: "TV 프로그램의 시청률 조사", sub: "가구별 시청 채널과 시간 파악", ans: "sample",
    exp: "전국 가구 전부를 조사하는 것은 <strong>현실적으로 불가능</strong>하고 비용이 매우 커요. 일부 표본 가구에 측정기를 설치해 추정해요." },
  { icon: "🗳️", q: "우리나라 국회의원 300명의 출신 학교 분포", sub: "국회의원 한 명씩 모두 조사", ans: "census",
    exp: "국회의원은 단 <strong>300명</strong>으로 모집단이 작고 명단이 공개되어 있어, 전수조사를 통해 정확한 자료를 얻는 것이 적절해요." },
  { icon: "🔋", q: "휴대폰 배터리의 충·방전 수명 검사", sub: "수백 회 반복 충전하여 성능 측정", ans: "sample",
    exp: "수명 테스트에는 <strong>오랜 시간과 파괴적 시험</strong>이 필요해요. 시간과 비용을 절약하려면 표본조사가 적절해요." },
  { icon: "🎵", q: "동아리 부원 12명이 가장 좋아하는 음악 장르", sub: "우리 동아리 전체 선호도 조사", ans: "census",
    exp: "단 <strong>12명</strong>인 작은 모집단이라 모두에게 물어보는 것이 가장 빠르고 정확해요." },
  { icon: "💧", q: "한강의 물 오염도(BOD) 측정", sub: "강물의 생물학적 산소 요구량 검사", ans: "sample",
    exp: "한강의 모든 물을 검사할 수 없고, 물은 <strong>시간·공간에 따라 끊임없이 변해요</strong>. 여러 지점·시간대의 표본을 뽑아 측정해요." },
  { icon: "⚾", q: "야구공의 반발력 검사", sub: "공을 강한 압력으로 측정하여 평가", ans: "sample",
    exp: "반발력 시험 후에는 공이 <strong>변형되거나 손상</strong>되어 경기에 쓸 수 없어요. 표본을 뽑아 품질을 확인해요." },
  { icon: "📚", q: "우리 학교 도서관의 책 권수 조사", sub: "보유한 모든 책의 개수 파악", ans: "census",
    exp: "도서관의 모든 책은 <strong>대출 시스템에 등록</strong>되어 있어 전수조사가 가능하고, 정확한 권수를 알아야 하므로 표본은 부적절해요." },
  { icon: "🇰🇷", q: "우리나라 만 20세 성인 남성의 평균 키", sub: "성인 남성 약 30만 명의 신장 분석", ans: "sample",
    exp: "성인 남성 전체를 측정하는 것은 <strong>비용·시간이 너무 큼</strong>. 무작위로 뽑은 표본의 평균을 통해 모평균을 추정해요." },
  { icon: "🍜", q: "라면 공장에서 생산되는 라면의 평균 중량", sub: "포장된 라면의 정량 충족 여부", ans: "sample",
    exp: "라면은 <strong>계속해서 대량 생산</strong>되고, 검사하면 포장을 뜯어야 해요. 일부 표본을 뽑아 평균 중량을 추정해요." },
  { icon: "🎓", q: "OO고등학교 졸업생 전원의 진학·취업 현황", sub: "한 학년 약 300명의 진로 파악", ans: "census",
    exp: "학교 차원에서 졸업생 한 명 한 명의 진로를 확인할 수 있고, 모집단이 작아 <strong>전수조사로 완전한 자료</strong>를 만들 수 있어요." },
  { icon: "🩸", q: "헌혈된 혈액 전체의 안전성·이상 유무 검사", sub: "질병 검사로 혈액을 일부 소모", ans: "sample",
    exp: "헌혈 안전 검사는 모든 혈액을 다 쓰면 <strong>수혈할 혈액이 남지 않아요</strong>. 표본조사로 품질 관리를 해요. (※ 실제로는 모든 혈액에 기초 검사를 하지만 정밀 항목은 표본 검사함)" },
  { icon: "🛒", q: "어느 편의점의 어제 하루 매출 총액", sub: "하루 동안 판매된 상품 금액의 합", ans: "census",
    exp: "<strong>POS 시스템에 모든 거래</strong>가 기록되므로 영수증 전체를 합산하면 정확한 매출을 알 수 있어요." },
  { icon: "🐟", q: "어느 큰 호수에 사는 물고기의 총 마릿수", sub: "호수 전체 어류 자원 추정", ans: "sample",
    exp: "호수의 물고기는 <strong>다 잡아낼 수 없고 헤아리기 곤란</strong>해요. '포획-재포획법' 같은 표본조사 기법으로 추정해요." },
  { icon: "🎆", q: "폭죽 공장의 폭죽 불량률 검사", sub: "불을 붙여 정상 작동 여부 확인", ans: "sample",
    exp: "폭죽을 점화하면 <strong>한 번에 다 타버려요</strong>(파괴조사). 표본을 뽑아 불량률을 추정하는 것이 적절해요." },
  { icon: "🏆", q: "이번 올림픽 한국 금메달리스트들의 평균 나이", sub: "우리나라 금메달 수상자 전원 조사", ans: "census",
    exp: "금메달리스트는 <strong>명단이 공식적으로 확정</strong>되어 있고 인원도 많지 않아 전수조사로 정확한 평균을 구할 수 있어요." },
  { icon: "🔩", q: "공장에서 생산된 나사 10만 개의 불량률", sub: "하루 생산량 중 불량품 비율 조사", ans: "sample",
    exp: "전수 검사하면 시간·비용이 너무 크고, 검사 과정에서 나사가 손상될 수도 있어요. 일부 표본을 뽑아 <strong>불량률을 추정</strong>해요." },
  { icon: "🧑‍🏫", q: "어느 회사 임직원 45명의 평균 연봉", sub: "인사팀이 보유한 급여 자료 활용", ans: "census",
    exp: "회사에 <strong>모든 직원의 급여 자료</strong>가 이미 있으므로, 표본을 뽑을 필요 없이 전수조사가 가능하고 더 정확해요." },
];

const TOTAL = QUESTIONS.length;

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "sample_situations",
    prompt:
      "표본조사가 어울리는 상황을 활동에서 본 24가지 예시 기반으로, 분류 기준(① 모집단이 너무 큼 / ② 비용·시간 부담 / ③ 파괴조사) 별로 1개씩 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: ① 인구 약 4천만 명 대상 여론조사 — 모집단 너무 큼. ② TV 시청률 — 전국 가구 측정 불가능, 비용 큼. ③ 형광등 수명·통조림·자동차 충돌 — 파괴조사.",
  },
];

// ─── 메인 ─────────────────────────────────────────────────
type Screen = "intro" | "quiz" | "result";
type AnswerLog = { idx: number; picked: Ans; correct: boolean };

export default function CensusOrSampleQuiz() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [cur, setCur] = useState(0);
  const [picked, setPicked] = useState<Ans | null>(null);
  const [log, setLog] = useState<AnswerLog[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);

  // confetti DOM(외부 시스템) 정리용
  const piecesRef = useRef<HTMLDivElement[]>([]);
  useEffect(() => () => {
    piecesRef.current.forEach((el) => el.remove());
    piecesRef.current = [];
  }, []);

  const score = log.filter((l) => l.correct).length;
  const q = QUESTIONS[cur];

  function start() {
    setCur(0);
    setPicked(null);
    setLog([]);
    setReviewOpen(false);
    setScreen("quiz");
  }

  function answer(p: Ans) {
    if (picked !== null) return;
    const correct = p === q.ans;
    setPicked(p);
    setLog((prev) => [...prev, { idx: cur, picked: p, correct }]);
    if (correct) confettiBurst(piecesRef);
  }

  function next() {
    if (cur === TOTAL - 1) {
      const finalScore = log.filter((l) => l.correct).length;
      if (finalScore === TOTAL) bigConfetti(piecesRef);
      setScreen("result");
    } else {
      setCur((c) => c + 1);
      setPicked(null);
    }
  }

  function restart() {
    setReviewOpen(false);
    start();
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">🧐 전수조사 vs 표본조사 퀴즈</h3>
        <p className="mt-2 leading-7 text-slate-300">
          주어진 상황에서 <b className="text-indigo-300">전수조사</b>와{" "}
          <b className="text-amber-300">표본조사</b> 중 어떤 방법이 더 적절한지 판단해 봅니다.
          모든 문제에 해설이 따라옵니다.
        </p>
      </div>

      {/* 헤더: 퀴즈 화면에서만 */}
      {screen === "quiz" ? (
        <Header cur={cur} total={TOTAL} score={score} />
      ) : null}

      {screen === "intro" ? <IntroScreen onStart={start} /> : null}
      {screen === "quiz" ? (
        <QuizScreen
          q={q}
          cur={cur}
          total={TOTAL}
          picked={picked}
          onPick={answer}
          onNext={next}
        />
      ) : null}
      {screen === "result" ? (
        <ResultScreen
          score={score}
          total={TOTAL}
          log={log}
          reviewOpen={reviewOpen}
          onToggleReview={() => setReviewOpen((v) => !v)}
          onRestart={restart}
        />
      ) : null}

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 헤더 ─────────────────────────────────────────────────
function Header({ cur, total, score }: { cur: number; total: number; score: number }) {
  const pct = (cur / total) * 100;
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-400/25 bg-slate-900/50 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-xl">🧐</span>
        <span className="text-sm font-extrabold text-amber-100">전수 vs 표본</span>
      </div>
      <div className="flex flex-1 items-center gap-3 min-w-[200px]">
        <span className="whitespace-nowrap text-sm font-extrabold text-indigo-300">
          {Math.min(cur + 1, total)} / {total}
        </span>
        <div className="h-2.5 flex-1 overflow-hidden rounded-md bg-slate-800 shadow-inner">
          <svg viewBox="0 0 100 2.5" preserveAspectRatio="none" className="block h-full w-full">
            <defs>
              <linearGradient id="csqProg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#6366f1" />
                <stop offset="0.5" stopColor="#22d3ee" />
                <stop offset="1" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <rect x={0} y={0} width={pct} height={2.5} fill="url(#csqProg)" />
          </svg>
        </div>
      </div>
      <span className="rounded-md border border-amber-400/35 bg-amber-400/10 px-3 py-1 text-sm font-extrabold text-amber-300">
        ⭐ {score}점
      </span>
    </div>
  );
}

// ─── 인트로 ────────────────────────────────────────────────
function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="mt-5 rounded-2xl border-2 border-indigo-400/35 bg-gradient-to-br from-indigo-500/15 to-cyan-400/10 px-6 py-8 text-center shadow-[0_8px_32px_rgba(99,102,241,0.18)]">
      <div className="animate-[bounceY_2s_ease-in-out_infinite] text-5xl">🔍</div>
      <h4 className="mt-3 text-2xl font-black text-amber-100">전수조사 vs 표본조사</h4>
      <p className="mt-2 leading-7 text-slate-300">
        주어진 상황에서 <b className="text-amber-100">어떤 조사 방법이 더 적절한지</b> 골라 보세요.
        <br />총 <b className="text-amber-300">{TOTAL}개</b>의 다양한 상황이 준비되어 있어요.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-blue-400/50 bg-slate-900/60 px-4 py-3 text-left">
          <p className="text-base font-black text-blue-400">🏫 전수조사</p>
          <p className="mt-1 text-sm text-slate-300">모집단 <b>전체</b>를 조사하는 방법</p>
        </div>
        <div className="rounded-2xl border-2 border-orange-400/50 bg-slate-900/60 px-4 py-3 text-left">
          <p className="text-base font-black text-orange-400">📊 표본조사</p>
          <p className="mt-1 text-sm text-slate-300">모집단의 <b>일부분</b>(표본)만 조사하는 방법</p>
        </div>
      </div>

      <div className="mt-4 rounded-r-xl border-l-4 border-emerald-500 bg-emerald-500/[0.08] px-5 py-3 text-left text-sm leading-7 text-emerald-200">
        💡 <b className="text-emerald-100">표본조사가 어울리는 상황</b>
        <br />① 모집단이 너무 커서 다 조사하기 곤란할 때
        <br />② 조사 비용·시간이 너무 많이 들 때
        <br />③ 한 번 조사하면 그것이 <b>파괴</b>되는 경우(파괴조사)
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-8 py-3 text-base font-black text-white shadow-[0_6px_24px_rgba(99,102,241,0.4)] transition hover:brightness-110"
      >
        🚀 퀴즈 시작하기
      </button>
    </div>
  );
}

// ─── 퀴즈 화면 ────────────────────────────────────────────
function QuizScreen({
  q, cur, total, picked, onPick, onNext,
}: {
  q: Question;
  cur: number;
  total: number;
  picked: Ans | null;
  onPick: (a: Ans) => void;
  onNext: () => void;
}) {
  const answered = picked !== null;
  const correct = answered && picked === q.ans;

  function choiceCls(my: Ans) {
    const base = "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 px-4 py-5 text-lg font-black transition disabled:cursor-default";
    if (!answered) {
      const tone = my === "census"
        ? "border-blue-500 bg-blue-500/[0.06] text-blue-400 hover:-translate-y-0.5 hover:bg-blue-500/15 hover:shadow-[0_6px_18px_rgba(59,130,246,0.3)]"
        : "border-orange-500 bg-orange-500/[0.06] text-orange-400 hover:-translate-y-0.5 hover:bg-orange-500/15 hover:shadow-[0_6px_18px_rgba(249,115,22,0.3)]";
      return `${base} ${tone}`;
    }
    if (my === q.ans) {
      return `${base} animate-[correctPulse_0.6s_ease] border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-[0_6px_18px_rgba(34,197,94,0.3)]`;
    }
    if (my === picked) {
      return `${base} animate-[shake_0.45s_ease] border-rose-500 bg-rose-500/15 text-rose-300`;
    }
    return `${base} border-white/15 bg-white/[0.03] text-slate-500 opacity-40`;
  }

  return (
    <div className="mt-4 rounded-2xl border-2 border-indigo-400/25 bg-slate-900/60 px-5 py-6">
      <div className="text-center">
        <span
          key={cur}
          className="inline-block animate-[popIcon_0.5s_cubic-bezier(0.34,1.56,0.64,1)] text-5xl drop-shadow-[0_4px_10px_rgba(99,102,241,0.4)]"
        >
          {q.icon}
        </span>
      </div>
      <p className="mt-3 text-center">
        <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-xs font-extrabold text-indigo-300">
          상황 {cur + 1}
        </span>
      </p>
      <p className="mt-2 px-1 text-center text-lg font-extrabold leading-7 text-slate-100">{q.q}</p>
      <p className="mt-1 text-center text-sm leading-6 text-slate-400">{q.sub}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={answered} onClick={() => onPick("census")} className={choiceCls("census")}>
          <span className="text-3xl">🏫</span>
          <span>전수조사</span>
          <span className="text-xs font-semibold opacity-80">모집단 전체를 조사</span>
        </button>
        <button type="button" disabled={answered} onClick={() => onPick("sample")} className={choiceCls("sample")}>
          <span className="text-3xl">📊</span>
          <span>표본조사</span>
          <span className="text-xs font-semibold opacity-80">표본을 뽑아 조사</span>
        </button>
      </div>

      {answered ? (
        <div
          className={
            "mt-5 animate-[slideUp_0.35s_ease] rounded-2xl border-2 px-5 py-4 text-base leading-7 " +
            (correct
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
              : "border-rose-400/35 bg-rose-400/[0.08] text-rose-100")
          }
        >
          <p className="text-lg font-black">
            {correct ? "✅ 정답이에요!" : "❌ 아쉬워요, 다시 확인해 봐요."}
          </p>
          <p className="mt-2 text-sm">
            알맞은 조사 방법:{" "}
            <span className="rounded-md bg-amber-400/15 px-2 py-0.5 font-extrabold text-amber-100">
              {q.ans === "census" ? "🏫 전수조사" : "📊 표본조사"}
            </span>
          </p>
          <p className="mt-2 leading-7 text-slate-200" dangerouslySetInnerHTML={{ __html: q.exp }} />
        </div>
      ) : null}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!answered}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-6 py-2.5 text-sm font-black text-white shadow-[0_4px_14px_rgba(99,102,241,0.35)] transition hover:brightness-110 disabled:cursor-default disabled:opacity-40 disabled:shadow-none"
        >
          {cur === total - 1 ? "결과 보기 🏆" : "다음 문제 ▶"}
        </button>
      </div>
    </div>
  );
}

// ─── 결과 ─────────────────────────────────────────────────
function ResultScreen({
  score, total, log, reviewOpen, onToggleReview, onRestart,
}: {
  score: number;
  total: number;
  log: AnswerLog[];
  reviewOpen: boolean;
  onToggleReview: () => void;
  onRestart: () => void;
}) {
  const rate = score / total;
  const bad = total - score;
  let emoji = "📖", title = "개념을 다시 살펴봐요!", stars = "⭐";
  if (rate === 1) { emoji = "🏆"; title = "완벽해요! 만점입니다!"; stars = "⭐⭐⭐⭐⭐"; }
  else if (rate >= 0.9) { emoji = "🥇"; title = "훌륭해요! 거의 다 맞혔어요!"; stars = "⭐⭐⭐⭐⭐"; }
  else if (rate >= 0.75) { emoji = "🥈"; title = "잘했어요! 조금만 더!"; stars = "⭐⭐⭐⭐"; }
  else if (rate >= 0.5) { emoji = "🥉"; title = "꽤 했어요. 해설을 보고 정리해봐요!"; stars = "⭐⭐⭐"; }
  else if (rate >= 0.3) { emoji = "💪"; title = "다시 한 번 도전해봐요!"; stars = "⭐⭐"; }

  return (
    <div className="mt-5 rounded-2xl border-2 border-indigo-400/35 bg-gradient-to-br from-indigo-500/12 to-pink-500/10 px-6 py-7 text-center">
      <p className="animate-[bounceY_2s_ease-in-out_infinite] text-5xl">{emoji}</p>
      <h4 className="mt-3 text-2xl font-black text-amber-100">{title}</h4>
      <p className="mt-2 font-mono text-4xl font-black text-amber-300">{score} / {total}</p>
      <p className="mt-1 text-base text-slate-300">정답률 {Math.round(rate * 100)}%</p>
      <p className="mt-2 text-2xl tracking-[6px]">{stars}</p>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <div className="min-w-[120px] rounded-2xl border-2 border-emerald-400/40 bg-slate-900/60 px-5 py-3">
          <p className="font-mono text-2xl font-black text-emerald-300">{score}</p>
          <p className="mt-1 text-xs font-extrabold text-emerald-200">정답</p>
        </div>
        <div className="min-w-[120px] rounded-2xl border-2 border-rose-400/35 bg-slate-900/60 px-5 py-3">
          <p className="font-mono text-2xl font-black text-rose-300">{bad}</p>
          <p className="mt-1 text-xs font-extrabold text-rose-200">오답</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onToggleReview}
          className="rounded-xl border-2 border-indigo-400/40 bg-indigo-500/20 px-5 py-2.5 text-sm font-black text-indigo-200 transition hover:bg-indigo-500/30"
        >
          📖 문제별 해설 {reviewOpen ? "접기" : "보기"}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-7 py-2.5 text-sm font-black text-slate-900 shadow-[0_5px_18px_rgba(249,115,22,0.4)] transition hover:brightness-110"
        >
          🔄 다시 도전
        </button>
      </div>

      {reviewOpen ? <ReviewList log={log} /> : null}
    </div>
  );
}

function ReviewList({ log }: { log: AnswerLog[] }) {
  return (
    <div className="mt-5 text-left">
      <p className="mb-3 text-center text-lg font-black text-amber-100">📝 문제별 풀이</p>
      <div className="space-y-2">
        {log.map((a, i) => {
          const qq = QUESTIONS[a.idx];
          const ansLabel = qq.ans === "census" ? "🏫 전수조사" : "📊 표본조사";
          const pickedLabel = a.picked === "census" ? "🏫 전수조사" : "📊 표본조사";
          const tone = a.correct ? "border-l-emerald-500" : "border-l-rose-500";
          return (
            <div key={i} className={`rounded-xl border-l-4 bg-slate-900/60 px-4 py-3 text-sm leading-7 ${tone}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-xs font-black text-indigo-300">
                  Q{i + 1}
                </span>
                <span className="text-xl">{qq.icon}</span>
                <span className="flex-1 font-bold text-slate-100">{qq.q}</span>
                <span className={
                  "rounded-md border px-2 py-0.5 text-xs font-extrabold whitespace-nowrap " +
                  (a.correct
                    ? "border-emerald-400/35 bg-emerald-400/15 text-emerald-300"
                    : "border-rose-400/30 bg-rose-400/[0.12] text-rose-300")
                }>
                  {a.correct ? "정답" : "오답"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                내 답: <b>{pickedLabel}</b>  |  정답:{" "}
                <b className="text-amber-300">{ansLabel}</b>
              </p>
              <p
                className="mt-1 border-l-2 border-slate-700 pl-3 text-xs text-slate-400"
                dangerouslySetInnerHTML={{ __html: qq.exp }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Confetti (DOM 직접 — 외부 시스템) ───────────────────
function confettiBurst(piecesRef: React.MutableRefObject<HTMLDivElement[]>) {
  if (typeof window === "undefined") return;
  const colors = ["#fbbf24", "#22c55e", "#22d3ee", "#a78bfa", "#f87171", "#fb923c"];
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 3;
  for (let i = 0; i < 18; i++) {
    const el = document.createElement("div");
    el.className = "csq-confetti";
    const a = Math.random() * Math.PI * 2;
    const d = 80 + Math.random() * 160;
    el.style.cssText =
      `left:${cx}px;top:${cy}px;background:${colors[i % 6]};` +
      `width:${7 + Math.random() * 6}px;height:${7 + Math.random() * 6}px;` +
      `--tx:${Math.cos(a) * d}px;--ty:${Math.sin(a) * d}px;` +
      `animation-delay:${Math.random() * 0.12}s;`;
    document.body.appendChild(el);
    piecesRef.current.push(el);
    window.setTimeout(() => {
      el.remove();
      piecesRef.current = piecesRef.current.filter((x) => x !== el);
    }, 1500);
  }
}

function bigConfetti(piecesRef: React.MutableRefObject<HTMLDivElement[]>) {
  if (typeof window === "undefined") return;
  const colors = ["#fbbf24", "#22c55e", "#22d3ee", "#a78bfa", "#f87171", "#fb923c", "#ec4899", "#10b981"];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("div");
    el.className = "csq-confetti csq-confetti-big";
    const startX = Math.random() * window.innerWidth;
    const tx = (Math.random() - 0.5) * 300;
    el.style.cssText =
      `left:${startX}px;top:-20px;background:${colors[i % colors.length]};` +
      `width:${8 + Math.random() * 8}px;height:${8 + Math.random() * 8}px;` +
      `--tx:${tx}px;--ty:${window.innerHeight}px;` +
      `animation-duration:${1.5 + Math.random() * 1.2}s;` +
      `animation-delay:${Math.random() * 0.6}s;`;
    document.body.appendChild(el);
    piecesRef.current.push(el);
    window.setTimeout(() => {
      el.remove();
      piecesRef.current = piecesRef.current.filter((x) => x !== el);
    }, 3000);
  }
}
