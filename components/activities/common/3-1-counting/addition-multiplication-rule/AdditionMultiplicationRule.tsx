"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (게임 1개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "rule_criterion",
    prompt:
      "합의 법칙과 곱의 법칙을 구별하는 자신만의 기준을 만들어 보세요. 특히 문장에서 어떤 키워드 (‘또는’, ‘각각’, ‘하나만’, ‘동시에’ 등) 가 나오면 어느 법칙인지, 헷갈렸던 사례가 있다면 함께 적어 주세요.",
    kind: "text",
    placeholder:
      "예: ‘또는’, ‘하나만’, ‘이거나’ 가 보이면 합의 법칙 — 두 사건이 동시에 일어날 수 없어서 더한다. ‘각각’, ‘~도 ~도’, ‘동시에’ 가 보이면 곱의 법칙 — 두 사건이 따로따로 결정되어 곱한다. 자물쇠 비밀번호처럼 ‘알파벳 1 개와 숫자 1 개’ 가 동시에 필요할 때는 곱의 법칙. 동아리처럼 ‘하나만’ 선택할 때는 합의 법칙. 영화 한 편을 ‘액션 또는 로맨스’ 중에서 고른다는 표현이 처음엔 곱처럼 보였는데 ‘하나만’ 이라 합의 법칙이었다.",
  },
];

// ─── 시나리오 데이터 ──────────────────────────────────────
type Rule = "sum" | "mul";
type Scenario = {
  rule: Rule;
  title: string;
  groups: { emojis: string; name: string; count: number; color: string }[];
  op: string; // "또는" / "×"
  story: ReactNode;
  kw: string;
  q: string;
  formula: string;
  explain: ReactNode;
};

const SCENARIOS: Scenario[] = [
  {
    rule: "sum",
    title: "🍽️ 점심 메뉴 선택",
    groups: [
      { emojis: "🍱🍱🍱🍱", name: "분식집 메뉴", count: 4, color: "#c084fc" },
      { emojis: "🍚🍚🍚", name: "한식집 메뉴", count: 3, color: "#74b9ff" },
    ],
    op: "또는",
    story: (
      <>
        점심시간! 배고픈 민준이는 학교 앞 식당가에서 밥을 먹기로 했어요. 분식집에는{" "}
        <b>4 가지 메뉴</b> 가, 한식집에는 <b>3 가지 메뉴</b> 가 있어요. 두 식당 중{" "}
        <b>한 곳만</b> 갈 수 있다면, 메뉴를 선택하는 경우의 수는?
      </>
    ),
    kw: "두 식당 중 ‘한 곳만’ → 합의 법칙의 신호!",
    q: "❓ 점심 메뉴를 선택하는 경우의 수는 몇 가지?",
    formula: "4 + 3 = 7 가지",
    explain: (
      <>
        분식집과 한식집 중 <b>하나만</b> 갑니다. ‘또는’ 관계이므로{" "}
        <b className="text-emerald-300">합의 법칙</b> 을 적용해요.
      </>
    ),
  },
  {
    rule: "mul",
    title: "👗 교복 코디 완성",
    groups: [
      { emojis: "👕👕👕", name: "상의 종류", count: 3, color: "#c084fc" },
      { emojis: "👖👖👖👖", name: "하의 종류", count: 4, color: "#22d3ee" },
    ],
    op: "×",
    story: (
      <>
        체육복 대신 교복을 입어야 하는 날! 지우의 옷장엔 상의가{" "}
        <b>흰 셔츠·체크 남방·후드티</b> 3 가지, 하의가{" "}
        <b>검정 바지·청바지·슬랙스·반바지</b> 4 가지 있어요. 상의와 하의를{" "}
        <b>각각 하나씩</b> 골라 입는다면 코디의 경우의 수는?
      </>
    ),
    kw: "상의 ‘도’ 선택하고 하의 ‘도’ 선택 → 곱의 법칙의 신호!",
    q: "❓ 교복 코디의 경우의 수는 몇 가지?",
    formula: "3 × 4 = 12 가지",
    explain: (
      <>
        상의 3 가지 각각에 하의 4 가지를 짝지을 수 있어요. <b>동시에 결정</b> 하므로{" "}
        <b className="text-cyan-300">곱의 법칙</b> 을 적용해요.
      </>
    ),
  },
  {
    rule: "sum",
    title: "🚌 학교 가는 길",
    groups: [
      { emojis: "🚌🚌🚌", name: "버스 노선", count: 3, color: "#feca57" },
      { emojis: "🚇🚇", name: "지하철 노선", count: 2, color: "#54a0ff" },
    ],
    op: "또는",
    story: (
      <>
        은서는 집에서 학교까지 버스나 지하철로 통학해요. 학교로 가는{" "}
        <b>버스 노선은 3 가지</b>, <b>지하철 노선은 2 가지</b> 가 있어요. 버스와 지하철 중{" "}
        <b>하나의 교통수단</b> 만 이용한다면 이동 방법은 몇 가지일까요?
      </>
    ),
    kw: "버스 ‘또는’ 지하철 하나만 → 합의 법칙의 신호!",
    q: "❓ 학교 가는 방법의 경우의 수는 몇 가지?",
    formula: "3 + 2 = 5 가지",
    explain: (
      <>
        버스와 지하철은 동시에 이용할 수 없어요. ‘또는’ 관계이므로{" "}
        <b className="text-emerald-300">합의 법칙</b> 을 적용해요.
      </>
    ),
  },
  {
    rule: "mul",
    title: "🍦 아이스크림 주문",
    groups: [
      { emojis: "🍦🍦", name: "콘 종류", count: 2, color: "#feca57" },
      { emojis: "🍓🍫🥝🍋🫐", name: "맛 종류", count: 5, color: "#ff7675" },
    ],
    op: "×",
    story: (
      <>
        아이스크림 가게에 도착한 수아! 콘 종류는 <b>와플콘·슈가콘</b> 2 가지, 아이스크림
        맛은 <b>딸기·초콜릿·키위·레몬·블루베리</b> 5 가지예요. 콘과 맛을{" "}
        <b>각각 하나씩</b> 고른다면 아이스크림 선택의 경우의 수는?
      </>
    ),
    kw: "콘 ‘도’ 선택하고 맛 ‘도’ 선택 → 곱의 법칙의 신호!",
    q: "❓ 아이스크림 선택의 경우의 수는 몇 가지?",
    formula: "2 × 5 = 10 가지",
    explain: (
      <>
        콘 1 종류마다 맛 5 가지를 각각 짝지을 수 있어요.{" "}
        <b className="text-cyan-300">곱의 법칙</b> 을 적용해요.
      </>
    ),
  },
  {
    rule: "sum",
    title: "🎬 주말 영화 한 편",
    groups: [
      { emojis: "🎬🎬🎬🎬🎬", name: "액션 영화", count: 5, color: "#ff7675" },
      { emojis: "🎭🎭🎭🎭", name: "로맨스 영화", count: 4, color: "#f8b4b4" },
    ],
    op: "또는",
    story: (
      <>
        주말에 영화를 보려는 준혁이! OTT 에 <b>액션 영화 5 편</b> 과{" "}
        <b>로맨스 영화 4 편</b> 이 올라왔어요. 이번 주말엔 <b>한 편만</b> 볼 수 있다면
        선택할 수 있는 영화는 몇 편일까요?
      </>
    ),
    kw: "액션 ‘또는’ 로맨스 중 한 편만 → 합의 법칙의 신호!",
    q: "❓ 선택할 수 있는 영화의 경우의 수는 몇 가지?",
    formula: "5 + 4 = 9 편",
    explain: (
      <>
        액션과 로맨스 중 <b>한 편만</b> 선택해요. ‘또는’ 관계이므로{" "}
        <b className="text-emerald-300">합의 법칙</b> 을 적용해요.
      </>
    ),
  },
  {
    rule: "mul",
    title: "✈️ 여행 계획 세우기",
    groups: [
      { emojis: "✈️✈️✈️", name: "항공편", count: 3, color: "#74b9ff" },
      { emojis: "🏨🏨🏨🏨", name: "숙소", count: 4, color: "#55efc4" },
    ],
    op: "×",
    story: (
      <>
        방학을 맞아 제주도 여행을 계획 중인 현지 가족! 이용할 수 있는{" "}
        <b>항공편이 3 가지</b>, 묵을 수 있는 <b>숙소가 4 곳</b> 있어요. 항공편과 숙소를{" "}
        <b>각각 하나씩</b> 예약한다면 경우의 수는?
      </>
    ),
    kw: "항공편 ‘도’ 결정하고 숙소 ‘도’ 결정 → 곱의 법칙의 신호!",
    q: "❓ 여행 계획의 경우의 수는 몇 가지?",
    formula: "3 × 4 = 12 가지",
    explain: (
      <>
        항공편 3 가지 각각에 숙소 4 가지를 짝지을 수 있어요. <b>두 가지를 동시에 결정</b>{" "}
        하므로 <b className="text-cyan-300">곱의 법칙</b> 을 적용해요.
      </>
    ),
  },
  {
    rule: "sum",
    title: "🍬 편의점 간식 선택",
    groups: [
      { emojis: "🍪🍪🍪", name: "과자류", count: 3, color: "#feca57" },
      { emojis: "🧃🧃🧃🧃", name: "음료류", count: 4, color: "#48dbfb" },
    ],
    op: "또는",
    story: (
      <>
        수업이 끝난 후 배고픈 태민이가 편의점에 들렀어요. 오늘은 용돈이 부족해서{" "}
        <b>과자 3 가지</b> 와 <b>음료 4 가지</b> 중 <b>하나만</b> 살 수 있어요. 살 수
        있는 간식의 경우의 수는?
      </>
    ),
    kw: "과자 ‘또는’ 음료 중 하나만 → 합의 법칙의 신호!",
    q: "❓ 간식을 선택하는 경우의 수는 몇 가지?",
    formula: "3 + 4 = 7 가지",
    explain: (
      <>
        과자와 음료 중 <b>하나만</b> 살 수 있어요. ‘또는’ 관계이므로{" "}
        <b className="text-emerald-300">합의 법칙</b> 을 적용해요.
      </>
    ),
  },
  {
    rule: "mul",
    title: "🎁 선물 포장 꾸미기",
    groups: [
      { emojis: "📦📦📦", name: "포장 상자", count: 3, color: "#f59e0b" },
      { emojis: "🎀🎀🎀🎀", name: "리본 색상", count: 4, color: "#f472b6" },
    ],
    op: "×",
    story: (
      <>
        친구 생일 선물을 포장하려는 유나! 포장 상자는{" "}
        <b>하트·줄무늬·도트 무늬</b> 3 가지, 리본 색상은{" "}
        <b>빨강·파랑·노랑·보라</b> 4 가지예요. 상자와 리본을 <b>각각 하나씩</b> 고른다면
        포장 방법은 몇 가지일까요?
      </>
    ),
    kw: "상자 ‘도’ 고르고 리본 ‘도’ 고르기 → 곱의 법칙의 신호!",
    q: "❓ 선물 포장 방법의 경우의 수는 몇 가지?",
    formula: "3 × 4 = 12 가지",
    explain: (
      <>
        상자 3 가지 각각에 리본 4 가지를 짝지을 수 있어요. <b>동시에 결정</b> 하므로{" "}
        <b className="text-cyan-300">곱의 법칙</b> 을 적용해요.
      </>
    ),
  },
  {
    rule: "sum",
    title: "🎸 방과후 동아리 선택",
    groups: [
      { emojis: "🎸🎸🎸", name: "현악기 동아리", count: 3, color: "#feca57" },
      { emojis: "🎺🎺🎺🎺", name: "관악기 동아리", count: 4, color: "#ff9f43" },
    ],
    op: "또는",
    story: (
      <>
        동아리를 정해야 하는 수현이! 현악기 동아리 <b>(기타·바이올린·첼로)</b> 3 개와
        관악기 동아리 <b>(플루트·클라리넷·트럼펫·색소폰)</b> 4 개 중 <b>하나만</b>{" "}
        들어갈 수 있어요. 동아리 선택의 경우의 수는?
      </>
    ),
    kw: "현악기 ‘또는’ 관악기 동아리 하나만 → 합의 법칙의 신호!",
    q: "❓ 동아리를 선택하는 경우의 수는 몇 가지?",
    formula: "3 + 4 = 7 가지",
    explain: (
      <>
        두 종류의 동아리 중 <b>하나만</b> 선택할 수 있어요. ‘또는’ 관계이므로{" "}
        <b className="text-emerald-300">합의 법칙</b> 을 적용해요.
      </>
    ),
  },
  {
    rule: "mul",
    title: "🍔 세트 메뉴 만들기",
    groups: [
      { emojis: "🍔🌮🍕", name: "메인 메뉴", count: 3, color: "#fb923c" },
      { emojis: "🥤🧋🍵🍺", name: "음료 메뉴", count: 4, color: "#fbbf24" },
    ],
    op: "×",
    story: (
      <>
        패스트푸드점에서 세트 메뉴를 주문하려는 재훈이! 메인 메뉴는{" "}
        <b>버거·타코·피자</b> 3 가지, 음료는 <b>콜라·버블티·커피·맥주</b> 4 가지예요.
        메인과 음료를 <b>각각 하나씩</b> 골라 세트를 구성하면 경우의 수는?
      </>
    ),
    kw: "메인 ‘도’ 고르고 음료 ‘도’ 고르기 → 곱의 법칙의 신호!",
    q: "❓ 세트 메뉴 구성의 경우의 수는 몇 가지?",
    formula: "3 × 4 = 12 가지",
    explain: (
      <>
        메인 3 가지 각각에 음료 4 가지를 짝지을 수 있어요. <b>동시에 결정</b> 하므로{" "}
        <b className="text-cyan-300">곱의 법칙</b> 을 적용해요.
      </>
    ),
  },
  {
    rule: "sum",
    title: "⚽ 방과후 체육 신청",
    groups: [
      { emojis: "⚽🏀🏸", name: "구기 종목", count: 3, color: "#34d399" },
      { emojis: "🏊🏊🏊🏊", name: "수영 강좌", count: 4, color: "#38bdf8" },
    ],
    op: "또는",
    story: (
      <>
        방과후 체육 활동을 신청하는 도현이! 구기 종목{" "}
        <b>(축구·농구·배드민턴)</b> 3 가지와 수영 강좌{" "}
        <b>(자유형·배영·평영·접영)</b> 4 가지 중 <b>하나만</b> 신청할 수 있어요. 신청
        가능한 경우의 수는?
      </>
    ),
    kw: "구기 ‘또는’ 수영 중 하나만 → 합의 법칙의 신호!",
    q: "❓ 방과후 체육 신청의 경우의 수는 몇 가지?",
    formula: "3 + 4 = 7 가지",
    explain: (
      <>
        구기 종목과 수영 강좌 중 <b>하나만</b> 선택할 수 있어요. ‘또는’ 관계이므로{" "}
        <b className="text-emerald-300">합의 법칙</b> 을 적용해요.
      </>
    ),
  },
  {
    rule: "mul",
    title: "🔐 자물쇠 비밀번호",
    groups: [
      { emojis: "🔤🔤🔤···", name: "알파벳 대문자 (A ~ Z)", count: 26, color: "#6ee7b7" },
      { emojis: "0️⃣1️⃣···9️⃣", name: "한 자리 숫자 (0 ~ 9)", count: 10, color: "#fbbf24" },
    ],
    op: "×",
    story: (
      <>
        자물쇠 비밀번호를 설정하는 나은이! 비밀번호는 <b>알파벳 대문자 1 개</b> 와{" "}
        <b>한 자리 숫자 1 개</b> 의 조합이에요 (예: A5, Z3). 알파벳 대문자는 A ~ Z 까지{" "}
        <b>26 가지</b>, 숫자는 0 ~ 9 까지 <b>10 가지</b> 예요. 만들 수 있는 비밀번호는 몇
        가지일까요?
      </>
    ),
    kw: "알파벳 ‘도’ 고르고 숫자 ‘도’ 고르기 → 곱의 법칙의 신호!",
    q: "❓ 만들 수 있는 비밀번호의 경우의 수는 몇 가지?",
    formula: "26 × 10 = 260 가지",
    explain: (
      <>
        알파벳 26 가지 각각에 숫자 10 가지를 짝지을 수 있어요. <b>동시에 결정</b> 하므로{" "}
        <b className="text-cyan-300">곱의 법칙</b> 을 적용해요.
      </>
    ),
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── 메인 ─────────────────────────────────────────────────
type Phase = "intro" | "quiz" | "result";
type AnswerRec = { title: string; rule: Rule; correct: boolean };

export default function AdditionMultiplicationRule() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [scenarios, setScenarios] = useState<Scenario[]>(SCENARIOS);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<Rule | null>(null);
  const [answered, setAnswered] = useState<AnswerRec[]>([]);

  const total = scenarios.length;

  function start() {
    setScenarios(shuffle(SCENARIOS));
    setIdx(0);
    setScore(0);
    setPicked(null);
    setAnswered([]);
    setPhase("quiz");
  }

  function choose(rule: Rule) {
    if (picked !== null) return;
    const s = scenarios[idx];
    const correct = rule === s.rule;
    setPicked(rule);
    if (correct) setScore((sc) => sc + 1);
    setAnswered((arr) => [...arr, { title: s.title, rule: s.rule, correct }]);
  }

  function next() {
    if (idx + 1 >= total) {
      setPhase("result");
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
  }

  function restart() {
    setPhase("intro");
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🎮 합·곱 법칙 판별 챌린지</h3>
        <p className="mt-2 leading-7 text-slate-300">
          실생활 <b className="text-violet-200">12 가지 사례</b> 를 보고{" "}
          <b className="text-emerald-200">합의 법칙</b> 인지{" "}
          <b className="text-cyan-200">곱의 법칙</b> 인지 판별해 봅시다.
        </p>
      </div>

      {phase === "intro" ? <IntroScreen onStart={start} /> : null}
      {phase === "quiz" ? (
        <QuizScreen
          scenario={scenarios[idx]}
          idx={idx}
          total={total}
          score={score}
          picked={picked}
          onChoose={choose}
          onNext={next}
        />
      ) : null}
      {phase === "result" ? (
        <ResultScreen
          score={score}
          total={total}
          answered={answered}
          onRestart={restart}
        />
      ) : null}

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
//  INTRO — 두 법칙 비교 카드
// ═══════════════════════════════════════════════════════════

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/10 via-cyan-500/10 to-transparent p-4 text-center">
        <p className="text-base font-extrabold text-violet-100">
          경우의 수를 세는 두 가지 법칙
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          두 법칙의 차이를 확인하고 챌린지를 시작하세요!
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <RuleCard
          tone="sum"
          icon="➕"
          name="합의 법칙"
          example={
            <>
              <RuleExample
                emoji="🍱🍱🍱🍱"
                label="분식 4 가지"
              />
              <span className="text-sm font-bold text-fuchsia-300">또는</span>
              <RuleExample emoji="🍚🍚🍚" label="한식 3 가지" />
            </>
          }
          desc={
            <>
              A <b className="text-fuchsia-300">또는</b> B 중 <b>하나만</b> 선택할 때
              <br />
              (두 사건이 동시에 일어나지 않음)
            </>
          }
          formula="경우의 수 = A + B"
          tip="💡 키워드: ‘또는’, ‘중에서 하나’, ‘이거나’"
        />
        <RuleCard
          tone="mul"
          icon="✖️"
          name="곱의 법칙"
          example={
            <>
              <RuleExample emoji="👕👕👕" label="상의 3 가지" />
              <span className="text-base font-bold text-cyan-300">×</span>
              <RuleExample emoji="👖👖👖👖" label="하의 4 가지" />
            </>
          }
          desc={
            <>
              A <b className="text-cyan-300">그리고</b> B 를 <b>각각 하나씩</b> 선택할 때
              <br />
              (두 사건을 동시에 결정)
            </>
          }
          formula="경우의 수 = A × B"
          tip="💡 키워드: ‘각각’, ‘~하고 ~도’, ‘동시에’"
        />
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onStart}
          className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-base font-bold text-white shadow-lg shadow-violet-500/30 transition hover:brightness-110"
        >
          🚀 챌린지 시작하기!
        </button>
      </div>
    </div>
  );
}

function RuleCard({
  tone,
  icon,
  name,
  example,
  desc,
  formula,
  tip,
}: {
  tone: "sum" | "mul";
  icon: string;
  name: string;
  example: ReactNode;
  desc: ReactNode;
  formula: string;
  tip: string;
}) {
  const borderCls =
    tone === "sum"
      ? "border-emerald-400/40 bg-emerald-400/[0.06]"
      : "border-cyan-400/40 bg-cyan-400/[0.06]";
  const nameCls = tone === "sum" ? "text-emerald-200" : "text-cyan-200";

  return (
    <div className={"rounded-2xl border p-4 " + borderCls}>
      <p className="text-2xl">{icon}</p>
      <p className={"mt-1 text-lg font-extrabold " + nameCls}>{name}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-950/40 p-2">
        {example}
      </div>
      <p className="mt-3 text-xs leading-7 text-slate-300">{desc}</p>
      <p
        className={
          "mt-2 rounded-md border px-3 py-1.5 text-center font-serif text-sm font-bold " +
          (tone === "sum"
            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
            : "border-cyan-400/40 bg-cyan-400/10 text-cyan-200")
        }
      >
        {formula}
      </p>
      <p className="mt-2 text-[11px] text-slate-400">{tip}</p>
    </div>
  );
}

function RuleExample({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-base leading-none">{emoji}</p>
      <p className="mt-1 text-[10px] text-slate-400">{label}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  QUIZ — 시나리오 + 2 보기
// ═══════════════════════════════════════════════════════════

function QuizScreen({
  scenario,
  idx,
  total,
  score,
  picked,
  onChoose,
  onNext,
}: {
  scenario: Scenario;
  idx: number;
  total: number;
  score: number;
  picked: Rule | null;
  onChoose: (r: Rule) => void;
  onNext: () => void;
}) {
  const correctRule = scenario.rule;
  const isCorrect = picked === correctRule;

  return (
    <div className="mt-5 space-y-4">
      {/* 진행 막대 + 점수 */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-400">
          문제 {idx + 1} / {total}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <svg viewBox="0 0 100 1" preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id="amrProg" x1="0" x2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
            <rect
              x="0"
              y="0"
              height="1"
              width={(idx / total) * 100}
              fill="url(#amrProg)"
            />
          </svg>
        </div>
        <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-200">
          ⭐ {score} / {total}
        </span>
      </div>

      {/* 시나리오 카드 */}
      <div className="rounded-2xl border border-violet-400/30 bg-white/[0.04] p-4">
        <p className="text-base font-bold text-amber-300">{scenario.title}</p>

        {/* 그룹 시각화 */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {scenario.groups.map((g, i) => (
            <div key={i} className="contents">
              <div
                className="rounded-xl border-2 px-3 py-2 text-center"
                style={{ borderColor: `${g.color}55`, backgroundColor: `${g.color}1A` }}
              >
                <p className="text-lg leading-none">{g.emojis}</p>
                <p className="mt-1 text-[11px] font-bold" style={{ color: g.color }}>
                  {g.name}
                </p>
                <p
                  className="text-sm font-extrabold"
                  style={{ color: g.color }}
                >
                  {g.count} 가지
                </p>
              </div>
              {i < scenario.groups.length - 1 ? (
                <span
                  className={
                    "px-1 font-extrabold " +
                    (scenario.op === "또는" ? "text-fuchsia-300" : "text-cyan-300")
                  }
                >
                  {scenario.op}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <p className="mt-3 text-sm leading-7 text-slate-200">{scenario.story}</p>
        <p className="mt-3 rounded-lg border border-amber-300/30 bg-amber-300/[0.06] px-3 py-2 text-xs leading-7 text-amber-200">
          🔑 {scenario.kw}
        </p>

        <p className="mt-3 text-center font-bold text-violet-100">{scenario.q}</p>

        {/* 2 보기 */}
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {([
            { rule: "sum" as Rule, icon: "➕", name: "합의 법칙", desc: "경우의 수를 더한다" },
            { rule: "mul" as Rule, icon: "✖️", name: "곱의 법칙", desc: "경우의 수를 곱한다" },
          ]).map((c) => {
            const isCorrectBtn = c.rule === correctRule;
            const isPickedBtn = picked === c.rule;
            let cls =
              "border-white/15 bg-white/5 text-slate-200 hover:border-violet-300/50 hover:bg-violet-400/[0.08]";
            if (picked !== null) {
              if (isCorrectBtn) {
                cls = "border-emerald-400/55 bg-emerald-400/15 text-emerald-100";
              } else if (isPickedBtn) {
                cls = "border-rose-400/55 bg-rose-400/15 text-rose-100";
              } else {
                cls = "border-white/10 bg-white/[0.03] text-slate-500";
              }
            } else {
              // 기본 색 분리 (선택 전)
              cls =
                c.rule === "sum"
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:border-emerald-300 hover:bg-emerald-400/20"
                  : "border-cyan-400/40 bg-cyan-400/10 text-cyan-200 hover:border-cyan-300 hover:bg-cyan-400/20";
            }
            return (
              <button
                key={c.rule}
                type="button"
                onClick={() => onChoose(c.rule)}
                disabled={picked !== null}
                className={
                  "rounded-xl border-2 px-3 py-3 text-center font-bold transition disabled:cursor-default " +
                  cls
                }
              >
                <span className="text-lg">{c.icon}</span> {c.name}
                <span className="mt-1 block text-xs font-normal text-slate-300">
                  ({c.desc})
                </span>
              </button>
            );
          })}
        </div>

        {/* 피드백 */}
        {picked !== null ? (
          <div
            className={
              "mt-4 rounded-xl border px-3 py-3 text-sm leading-7 " +
              (isCorrect
                ? "border-emerald-400/55 bg-emerald-400/10 text-emerald-100"
                : "border-rose-400/55 bg-rose-400/10 text-rose-100")
            }
          >
            <p className="font-extrabold">
              {isCorrect ? "✅ 정답이에요!" : "❌ 아쉬워요!"}
            </p>
            <p className="mt-1 text-slate-200">{scenario.explain}</p>
            <p className="mt-1 rounded-md border border-amber-300/30 bg-amber-300/[0.08] px-2 py-1 text-center font-serif text-base font-bold text-amber-200">
              📐 {scenario.formula}
            </p>
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={onNext}
                className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-bold text-white"
              >
                {idx + 1 >= total ? "결과 보기 🏁" : "다음 문제 →"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  RESULT — 최종 점수 + 12 요약
// ═══════════════════════════════════════════════════════════

function ResultScreen({
  score,
  total,
  answered,
  onRestart,
}: {
  score: number;
  total: number;
  answered: AnswerRec[];
  onRestart: () => void;
}) {
  const pct = score / total;
  const { icon, msg } = useMemo(() => {
    if (pct === 1)
      return {
        icon: "🏆",
        msg: "완벽해요! 합의 법칙과 곱의 법칙을 완전히 마스터했어요. 두 법칙의 핵심 키워드를 정확히 파악하고 있군요 🎉",
      };
    if (pct >= 0.8)
      return {
        icon: "🌟",
        msg: "훌륭해요! 두 법칙의 차이를 잘 이해하고 있어요. 틀린 문제를 다시 한번 살펴보면 완벽해질 거예요!",
      };
    if (pct >= 0.6)
      return {
        icon: "👍",
        msg: "잘했어요! 조금 더 연습이 필요하지만 기초는 잡혔어요. ‘또는’ 과 ‘각각’ 키워드를 다시 생각해 보세요.",
      };
    return {
      icon: "💪",
      msg: "도전 정신이 멋져요! 합의 법칙과 곱의 법칙의 핵심 차이를 한 번 더 복습하고 다시 도전해 보세요!",
    };
  }, [pct]);

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-violet-500/10 to-transparent p-6 text-center">
        <p className="text-5xl">{icon}</p>
        <p className="mt-2 text-base font-bold text-amber-100">챌린지 완료!</p>
        <p className="mt-2 text-6xl font-extrabold text-amber-200">
          {score} / {total}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
            합의 법칙
          </span>
          <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
            곱의 법칙
          </span>
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-300">{msg}</p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-bold text-white"
        >
          🔄 다시 도전하기
        </button>
      </div>

      {/* 12 요약 */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
          📋 풀이 요약
        </p>
        <div className="mt-2 space-y-1.5">
          {answered.map((a, i) => (
            <div
              key={i}
              className={
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm " +
                (a.correct
                  ? "border-emerald-400/30 bg-emerald-400/[0.06] text-emerald-100"
                  : "border-rose-400/30 bg-rose-400/[0.06] text-rose-100")
              }
            >
              <span className="text-base">{a.correct ? "✅" : "❌"}</span>
              <span className="flex-1 truncate">{a.title}</span>
              <span
                className={
                  "rounded-md border px-2 py-0.5 text-[10px] font-bold " +
                  (a.rule === "sum"
                    ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
                    : "border-cyan-400/40 bg-cyan-400/15 text-cyan-200")
                }
              >
                {a.rule === "sum" ? "합의 법칙" : "곱의 법칙"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
