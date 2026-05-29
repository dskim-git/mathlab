"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "news_margin_meaning",
    prompt:
      "뉴스 기사 끝에 적힌 ‘95% 신뢰수준에 표본오차 ±△%P’ 라는 문구가 우리가 배운 신뢰구간 길이의 절반 k·√(p̂q̂/n) 과 어떻게 연결되는지 본인의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 기사의 ±△%P 는 신뢰구간의 ‘반길이(오차한계)’를 의미하고, 우리 공식의 k·√(p̂q̂/n) 과 같다. 기사들은 보통 p̂=½ 을 가정해 최대치로 표기한다.",
  },
  {
    id: "n_effect_real_data",
    prompt:
      "표본 크기 n 이 가장 작은 사례(한국갤럽 1,777명)와 가장 큰 사례(통계청 36,000명)의 신뢰구간 길이는 어떻게 달랐나요? 공식과 함께 그 이유를 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: n=1,777 인 갤럽 조사의 95% CI 는 약 ±2.3%P 로 넓고, n=36,000 인 통계청 조사는 ±0.5%P 로 매우 좁다. √n 이 분모에 들어가 n 이 커질수록 폭이 1/√n 으로 줄기 때문.",
  },
  {
    id: "compare_observation",
    prompt:
      "‘4개 신뢰구간 비교’ 차트에서 어떤 조사가 가장 좁고 어떤 조사가 가장 넓었나요? 표본 크기 n 과 표본비율 p̂ 두 관점에서 이유를 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 가장 좁은 신뢰구간은 통계청(n=36,000) 이었고, 가장 넓은 신뢰구간은 한국갤럽(n=1,777) 이었다. n 이 작을수록·p̂ 이 ½ 에 가까울수록 p̂q̂ 가 커져 폭이 넓어지기 때문.",
  },
];

// ─── 사례 데이터 ────────────────────────────────────────
type CaseKey = "sonny" | "pet" | "marry" | "read";
type NewsCase = {
  icon: string;
  tabName: string;
  tabSub: string;
  press: string;
  date: string;
  headline: string;
  body: React.ReactNode;
  surveyMeta: React.ReactNode;
  n: number;
  phat: number;
  target: string;
  pop: string;
  reportedMargin: number; // %P
  // 비교 차트 막대 색
  color: string;
  color2: string;
};

const CASES: Record<CaseKey, NewsCase> = {
  sonny: {
    icon: "⚽",
    tabName: "손흥민 좋아요",
    tabSub: "한국갤럽 · 2024.6",
    press: "한국갤럽 「한국인이 좋아하는 스포츠 스타」 조사",
    date: "2024년 6월 13일 발표 (2024년 3월 22일~4월 5일 조사)",
    headline: "손흥민, 한국인이 좋아하는 스포츠 스타 49% — 압도적 1위",
    body: (
      <>
        한국갤럽이 발표한 「한국인이 좋아하는 스포츠 스타」 조사 결과,{" "}
        <span className="bg-gradient-to-b from-transparent from-55% via-yellow-200 via-55% to-yellow-200 to-95% bg-[length:100%_100%] px-0.5 font-extrabold">
          손흥민
        </span>{" "}
        선수를 가장 좋아하는 스포츠 스타로 꼽은 응답자가{" "}
        <span className="font-extrabold text-rose-700">49%</span> 로 압도적 1위를 차지했다.
        김연아(10%)·박세리(5%)·류현진(4%) 등이 그 뒤를 이었다.
      </>
    ),
    surveyMeta: (
      <>
        전국(제주 제외) 만 13세 이상 <b className="text-slate-800">1,777명</b> · 면접조사원
        인터뷰(CAPI) · 층화 집락 확률 비례 추출 · 응답률 27.7% ·{" "}
        <b className="text-slate-800">표본오차 ±2.3%P (95% 신뢰수준)</b>
      </>
    ),
    n: 1777,
    phat: 0.49,
    target: "손흥민을 가장 좋아한다고 답한 사람",
    pop: "전국(제주 제외) 만 13세 이상 국민",
    reportedMargin: 2.3,
    color: "#60a5fa",
    color2: "#1d4ed8",
  },
  pet: {
    icon: "🐶",
    tabName: "반려동물 양육",
    tabSub: "농림축산식품부 · 2024.12",
    press: "농림축산식품부 보도자료",
    date: "2024년 12월 발표 (2024년 동물복지에 대한 국민의식조사)",
    headline: "한국 가구 28.6%, 반려동물과 함께 산다 — 역대 최고",
    body: (
      <>
        농림축산식품부가 발표한 「2024년 동물복지에 대한 국민의식조사」에 따르면,{" "}
        <span className="bg-gradient-to-b from-transparent from-55% via-yellow-200 via-55% to-yellow-200 to-95% bg-[length:100%_100%] px-0.5 font-extrabold">
          반려동물을 기르고 있는 가구의 비율
        </span>{" "}
        은 <span className="font-extrabold text-rose-700">28.6%</span> 로 조사되었다. 이는 4년
        전(27.7%) 보다 0.9%P 늘어난 역대 최고치다.
      </>
    ),
    surveyMeta: (
      <>
        전국 만 20~64세 일반 국민 <b className="text-slate-800">5,000명</b> · 온라인 패널 조사 ·{" "}
        <b className="text-slate-800">표본오차 ±1.39%P (95% 신뢰수준)</b>
      </>
    ),
    n: 5000,
    phat: 0.286,
    target: "반려동물 양육 가구",
    pop: "전국 만 20~64세 국민",
    reportedMargin: 1.39,
    color: "#34d399",
    color2: "#059669",
  },
  marry: {
    icon: "💍",
    tabName: "결혼해야 한다",
    tabSub: "통계청 · 2024.11",
    press: "통계청 「2024년 사회조사」",
    date: "2024년 11월 12일 발표",
    headline: "국민 52.5% “결혼해야 한다” — 8년 만에 최고치",
    body: (
      <>
        통계청이 발표한 「2024년 사회조사」 결과에 따르면, 만 13세 이상 국민 가운데{" "}
        <span className="bg-gradient-to-b from-transparent from-55% via-yellow-200 via-55% to-yellow-200 to-95% bg-[length:100%_100%] px-0.5 font-extrabold">
          ‘결혼해야 한다’
        </span>{" "}
        라고 응답한 비율이 <span className="font-extrabold text-rose-700">52.5%</span> 로
        집계되었다. 이는 2년 전(50.0%) 보다 2.5%P 증가한 수치이며, 2016년 이후 8년 만에 가장
        높은 수준이다.
      </>
    ),
    surveyMeta: (
      <>
        전국 만 13세 이상 가구원 약 <b className="text-slate-800">36,000명</b> · 2024년 5월 15일부터
        16일간 방문 면접조사 ·{" "}
        <b className="text-slate-800">표본오차 ±0.5%P (95% 신뢰수준, 추정치)</b>
      </>
    ),
    n: 36000,
    phat: 0.525,
    target: "‘결혼해야 한다’ 응답자",
    pop: "전국 만 13세 이상 국민",
    reportedMargin: 0.52,
    color: "#f472b6",
    color2: "#be185d",
  },
  read: {
    icon: "📚",
    tabName: "학생 종합독서율",
    tabSub: "문체부 · 2024.4",
    press: "문화체육관광부 보도자료",
    date: "2024년 4월 18일 발표 (2023년 국민 독서실태조사)",
    headline: "초·중·고 학생 95.8%가 책을 읽는다",
    body: (
      <>
        문화체육관광부가 발표한 「2023년 국민 독서실태조사」에 따르면, 초·중·고등학생의{" "}
        <span className="bg-gradient-to-b from-transparent from-55% via-yellow-200 via-55% to-yellow-200 to-95% bg-[length:100%_100%] px-0.5 font-extrabold">
          종합 독서율
        </span>{" "}
        (지난 1년간 종이책·전자책·오디오북 중 한 권 이상 읽은 학생의 비율) 이{" "}
        <span className="font-extrabold text-rose-700">95.8%</span> 로 나타났다. 연간 종합
        독서량은 36권으로 집계되었다.
      </>
    ),
    surveyMeta: (
      <>
        전국 초·중·고등학생 <b className="text-slate-800">3,000명</b> · 학교 단위 표본추출 후
        면접조사 ·{" "}
        <b className="text-slate-800">표본오차 ±1.79%P (95% 신뢰수준, 최대치 기준)</b>
      </>
    ),
    n: 3000,
    phat: 0.958,
    target: "지난 1년간 책을 1권 이상 읽은 학생",
    pop: "전국 초·중·고등학생",
    reportedMargin: 1.79,
    color: "#fbbf24",
    color2: "#b45309",
  },
};

// ─── 헬퍼 ──────────────────────────────────────────────
function fmt(v: number, d = 4): string {
  if (!isFinite(v)) return "--";
  return Number(v.toFixed(d)).toString();
}
function fmtP(v: number, d = 2): string {
  if (!isFinite(v)) return "--";
  return (v * 100).toFixed(d) + "%";
}

// 단계별 계산 결과
type Computed = {
  phat: number;
  n: number;
  k: number;
  pq: number;
  pqn: number;
  sigma: number;
  half: number;
  lo: number;
  hi: number;
};

function computeFor(c: NewsCase, k: number): Computed {
  const p = c.phat;
  const q = 1 - p;
  const pq = p * q;
  const pqn = pq / c.n;
  const sigma = Math.sqrt(pqn);
  const half = k * sigma;
  return {
    phat: p,
    n: c.n,
    k,
    pq,
    pqn,
    sigma,
    half,
    lo: p - half,
    hi: p + half,
  };
}

// ─── 메인 ─────────────────────────────────────────────────
export default function CiProportionNewsLab() {
  const [curKey, setCurKey] = useState<CaseKey>("sonny");
  const [k, setK] = useState(1.96);
  // 단계별 표시 — 0(미시작)~4(전부) 단계까지 보일 step 수
  const [shownSteps, setShownSteps] = useState(0);
  const animRef = useRef<number[]>([]);

  const curCase = CASES[curKey];
  const computed = useMemo(() => computeFor(curCase, k), [curCase, k]);

  // 사례 또는 k 변경 시 단계 초기화 + 타이머 정리
  useEffect(() => {
    return () => {
      for (const id of animRef.current) window.clearTimeout(id);
      animRef.current = [];
    };
  }, []);

  function clearTimers() {
    for (const id of animRef.current) window.clearTimeout(id);
    animRef.current = [];
  }

  function handleTabChange(key: CaseKey) {
    clearTimers();
    setCurKey(key);
    setShownSteps(0);
  }

  function handleKChange(newK: number) {
    setK(newK);
    if (shownSteps > 0) {
      // 이미 계산되어 있으면 새 k 로 다시 단계 애니메이션
      runCalculate();
    }
  }

  function runCalculate() {
    clearTimers();
    setShownSteps(0);
    const t1 = window.setTimeout(() => setShownSteps(1), 100);
    const t2 = window.setTimeout(() => setShownSteps(2), 700);
    const t3 = window.setTimeout(() => setShownSteps(3), 1300);
    const t4 = window.setTimeout(() => setShownSteps(4), 1900);
    animRef.current = [t1, t2, t3, t4];
  }

  const conf = k === 1.96 ? "95%" : "99%";
  const computedReady = shownSteps >= 4;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">
          📰 뉴스로 배우는 모비율 신뢰구간 — 실제 여론조사 해석
        </h3>
        <p className="mt-2 leading-7 text-slate-300">
          한국갤럽·농림축산식품부·통계청·문화체육관광부의{" "}
          <b className="text-amber-300">실제 조사 자료 4건</b>으로 기사 속 표본비율{" "}
          <b className="text-amber-300">p̂</b> 에서 모비율 <b className="text-amber-300">p</b> 의
          신뢰구간을 직접 계산하고 해석합니다.
        </p>
      </div>

      {/* 공식 카드 (KaTeX) */}
      <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-amber-300/55 bg-slate-900/55 p-4 text-amber-100">
        <span className="text-base font-extrabold text-amber-300">📐 모비율의 신뢰구간</span>
        <div className="w-full overflow-x-auto rounded-md border border-amber-300/45 bg-amber-300/10 px-4 py-3 text-amber-100">
          <Katex
            display
            expr={String.raw`\hat{p} \;-\; k\sqrt{\dfrac{\hat{p}\hat{q}}{n}} \;\le\; p \;\le\; \hat{p} \;+\; k\sqrt{\dfrac{\hat{p}\hat{q}}{n}}`}
          />
        </div>
        <span className="text-sm font-bold text-amber-300">
          신뢰도 95% → k = 1.96 &nbsp; 99% → k = 2.58
        </span>
      </div>

      {/* ① 사례 탭 */}
      <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-cyan-200">
          📑 사례 선택{" "}
          <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-xs font-bold text-cyan-200">
            서로 다른 4개의 실제 조사
          </span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CASES) as CaseKey[]).map((key) => {
            const c = CASES[key];
            const active = curKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleTabChange(key)}
                className={`flex flex-1 min-w-[165px] flex-col items-center gap-0.5 rounded-2xl border-2 px-3 py-2.5 text-sm font-extrabold transition ${
                  active
                    ? "border-cyan-200 bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-md"
                    : "border-transparent bg-gradient-to-br from-slate-600 to-slate-700 text-slate-200 hover:-translate-y-px"
                }`}
              >
                <span className="text-2xl leading-tight">{c.icon}</span>
                <span className="text-base">{c.tabName}</span>
                <span className={`text-xs font-semibold ${active ? "text-cyan-100" : "text-slate-300"}`}>
                  {c.tabSub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ② 기사 카드 + 데이터 추출 */}
      <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-cyan-200">
          📰 기사 들여다보기{" "}
          <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-xs font-bold text-cyan-200">
            실제 발표 자료
          </span>
        </h4>
        <NewsCard caseData={curCase} />
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <ExtractCard
            label="표본 크기 n"
            value={curCase.n.toLocaleString()}
          />
          <ExtractCard
            label="표본비율 p̂"
            value={fmtP(curCase.phat, 1)}
            tone="gold"
          />
          <ExtractCard
            label="기사의 표본오차"
            value={`±${curCase.reportedMargin}%P`}
          />
          <ExtractCard label="기사의 신뢰수준" value="95%" />
        </div>
      </div>

      {/* ③ 단계별 계산 */}
      <div className="mt-3 rounded-2xl border border-violet-400/20 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-violet-200">
          🧮 신뢰구간 단계별 계산{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            버튼을 눌러 한 단계씩!
          </span>
        </h4>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border-[1.5px] border-violet-400/35 bg-violet-500/10 px-3 py-2">
          <span className="min-w-[115px] text-sm font-extrabold text-violet-200">
            신뢰도 선택
          </span>
          <KBtn active={k === 1.96} onClick={() => handleKChange(1.96)}>
            95% &nbsp;(k = 1.96)
          </KBtn>
          <KBtn active={k === 2.58} onClick={() => handleKChange(2.58)}>
            99% &nbsp;(k = 2.58)
          </KBtn>
          <span className="flex-1" />
          <button
            type="button"
            onClick={runCalculate}
            className="rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 px-4 py-2 text-sm font-extrabold text-white shadow-md transition hover:from-cyan-400 hover:to-cyan-600 active:scale-95"
          >
            ▶ 신뢰구간 단계별 계산하기
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <StepCard
            num={1}
            shown={shownSteps >= 1}
            lit={shownSteps === 1}
            label={String.raw`\hat{p}\,\hat{q} = \hat{p}\cdot(1-\hat{p})`}
            calc={
              <>
                p̂ = {fmt(computed.phat, 3)} , q̂ = 1 − {fmt(computed.phat, 3)} = {fmt(1 - computed.phat, 3)}
                <br />
                p̂q̂ = {fmt(computed.phat, 3)} × {fmt(1 - computed.phat, 3)}
              </>
            }
            result={`≈ ${fmt(computed.pq, 5)}`}
          />
          <StepCard
            num={2}
            shown={shownSteps >= 2}
            lit={shownSteps === 2}
            label={String.raw`\dfrac{\hat{p}\,\hat{q}}{n}`}
            calc={
              <>
                p̂q̂ / n = {fmt(computed.pq, 5)} ÷ {curCase.n.toLocaleString()}
              </>
            }
            result={`≈ ${computed.pqn.toExponential(3)}`}
          />
          <StepCard
            num={3}
            shown={shownSteps >= 3}
            lit={shownSteps === 3}
            label={String.raw`\sqrt{\dfrac{\hat{p}\,\hat{q}}{n}} = \sigma(\hat{p})`}
            calc={<>√(p̂q̂/n) = √({computed.pqn.toExponential(3)})</>}
            result={`≈ ${fmt(computed.sigma, 5)}`}
          />
          <StepCard
            num={4}
            shown={shownSteps >= 4}
            lit={shownSteps === 4}
            label={String.raw`k\cdot\sqrt{\dfrac{\hat{p}\,\hat{q}}{n}}\;=\;\text{오차한계}`}
            calc={
              <>
                k × √(p̂q̂/n) = {k.toFixed(2)} × {fmt(computed.sigma, 5)}
              </>
            }
            result={`≈ ${fmt(computed.half, 5)}`}
          />
        </div>

        {/* 결과 바 */}
        <div className="mt-3 flex flex-wrap items-center justify-around gap-3 rounded-2xl border-2 border-cyan-400/55 bg-gradient-to-br from-cyan-500/15 to-violet-500/15 p-4 text-cyan-100">
          <span className="text-base font-extrabold">
            📍 모비율 <span className="text-yellow-200">p</span> 의
          </span>
          <span className="rounded-full border border-violet-400/55 bg-violet-500/30 px-3 py-1 text-sm font-extrabold text-violet-100">
            {conf} 신뢰구간
          </span>
          <span className="text-xl font-extrabold tabular-nums text-amber-100">
            {computedReady ? (
              <>
                [ {fmt(computed.lo, 4)} , {fmt(computed.hi, 4)} ]{" "}
                <span className="text-base font-bold text-cyan-200">
                  = {fmtP(computed.lo)} ~ {fmtP(computed.hi)}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-slate-300">계산 버튼을 눌러 주세요</span>
            )}
          </span>
        </div>

        {/* 수직선 */}
        <div className="mt-3 rounded-xl border-[1.5px] border-violet-400/25 bg-slate-950/55 p-3">
          <NumlineCanvas
            caseData={curCase}
            computed={computedReady ? computed : null}
          />
        </div>

        {/* 비교 메시지 */}
        <div className="mt-3 rounded-xl border-[1.5px] border-emerald-400/40 bg-emerald-500/10 p-3 text-sm leading-6 text-emerald-100">
          {computedReady ? (
            <CompareMessage caseData={curCase} computed={computed} k={k} />
          ) : (
            <>💬 ▶ 단계별 계산 버튼을 누르면 신뢰구간이 표시됩니다.</>
          )}
        </div>
      </div>

      {/* ④ 해석 카드 */}
      <div className="mt-3 rounded-2xl border border-amber-300/25 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-amber-200">
          📝 한 문장으로 해석하기{" "}
          <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-xs font-bold text-amber-200">
            신뢰구간을 일상 언어로
          </span>
        </h4>
        <div className="flex items-start gap-3 rounded-xl border-2 border-amber-300/45 bg-gradient-to-br from-amber-300/10 to-pink-400/10 p-4 text-base leading-8 text-amber-50">
          <span className="text-2xl">🗣️</span>
          {computedReady ? (
            <span>
              신뢰도 <b className="text-yellow-200">{conf}</b> 에서{" "}
              <span className="font-extrabold text-pink-200">{curCase.pop}</span> 중{" "}
              <b className="text-amber-100">{curCase.target}</b> 의 비율{" "}
              <span className="font-extrabold text-pink-200">p</span> 는
              <br />약 <b className="text-yellow-200">{fmtP(computed.lo)}</b> ~{" "}
              <b className="text-yellow-200">{fmtP(computed.hi)}</b> 사이에 있다고 추정할 수
              있다.
            </span>
          ) : (
            <span>먼저 신뢰구간을 계산해 주세요.</span>
          )}
        </div>
      </div>

      {/* ⑤ 4개 비교 */}
      <div className="mt-3 rounded-2xl border border-violet-400/30 bg-slate-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-base font-bold text-violet-200">
          📊 4개 신뢰구간 한눈에 비교{" "}
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-xs font-bold text-violet-200">
            현재 신뢰도 기준
          </span>
        </h4>
        <div className="rounded-xl border-2 border-violet-400/45 bg-slate-950/55 p-3">
          <CompareCanvas curKey={curKey} k={k} />
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-cyan-400/45 bg-cyan-500/10 p-3 text-sm leading-7 text-cyan-50">
          <span className="text-xl">💡</span>
          <span>
            4개 조사를 비교해 보면, 표본 크기 <InlineFormula expr="n" /> 이 작을수록 신뢰구간의
            폭이 <b className="text-yellow-200">넓고</b>, 클수록 신뢰구간이{" "}
            <b className="text-yellow-200">가늘어진다</b>는 걸 한눈에 볼 수 있어요.
            <br />또 같은 n 이라도 <InlineFormula expr={String.raw`\hat{p}`} /> 이{" "}
            <b className="text-yellow-200">½</b> 에 가까울수록{" "}
            <InlineFormula expr={String.raw`\hat{p}\hat{q}`} /> 이 커져 신뢰구간이 더 넓어진다는
            점도 함께 관찰해 보세요!
          </span>
        </div>
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <ReflectionForm questions={REFLECTION_QUESTIONS} />
      </div>
    </section>
  );
}

// ─── 빌딩블록 ──────────────────────────────────────────
function NewsCard({ caseData }: { caseData: NewsCase }) {
  return (
    <div className="relative rounded-xl border-[3px] border-slate-800 bg-slate-50 px-5 py-4 font-serif text-slate-900 shadow-[0_6px_18px_rgba(0,0,0,0.45)]">
      <div className="absolute left-4 right-4 top-[-3px] h-1.5 bg-slate-900" />
      <div className="flex items-end justify-between border-b-2 border-slate-900 pb-1.5 font-sans">
        <span className="text-base font-extrabold tracking-wide text-slate-900">
          {caseData.press}
        </span>
        <span className="text-xs font-bold text-slate-600">{caseData.date}</span>
      </div>
      <div className="mb-2 mt-2 text-xl font-extrabold leading-snug text-slate-900">
        {caseData.icon} {caseData.headline}
      </div>
      <div className="text-sm leading-7 font-medium text-slate-800">{caseData.body}</div>
      <div className="mt-3 border-t border-dashed border-slate-400 pt-2 font-sans text-xs leading-6 font-semibold text-slate-600">
        📌 <b className="text-slate-800">조사 개요</b> &nbsp;{caseData.surveyMeta}
      </div>
    </div>
  );
}

function ExtractCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "gold";
}) {
  const cls =
    tone === "gold"
      ? "border-amber-400/55 bg-amber-500/10"
      : "border-cyan-400/45 bg-cyan-500/10";
  const labelCls = tone === "gold" ? "text-amber-200" : "text-cyan-300";
  const valCls = tone === "gold" ? "text-amber-300" : "text-cyan-100";
  return (
    <div className={`rounded-xl border-2 p-3 text-center ${cls}`}>
      <div className={`text-sm font-extrabold ${labelCls}`}>{label}</div>
      <div className={`mt-1 text-xl font-extrabold leading-tight tabular-nums ${valCls}`}>
        {value}
      </div>
    </div>
  );
}

function KBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 px-3 py-1.5 text-sm font-extrabold transition ${
        active
          ? "border-violet-200 bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-md"
          : "border-transparent bg-slate-700/60 text-slate-300 hover:bg-slate-700/85"
      }`}
    >
      {children}
    </button>
  );
}

function StepCard({
  num,
  shown,
  lit,
  label,
  calc,
  result,
}: {
  num: number;
  shown: boolean;
  lit: boolean;
  label: string;
  calc: React.ReactNode;
  result: string;
}) {
  const borderCls = lit
    ? "border-amber-300/65 [box-shadow:0_0_14px_rgba(251,191,36,0.2)]"
    : "border-slate-400/25";
  const opacityCls = shown
    ? "opacity-100 translate-y-0"
    : "pointer-events-none opacity-0 translate-y-2";
  return (
    <div
      className={`relative rounded-xl border-2 bg-slate-950/55 p-3 transition-[opacity,transform,border-color,box-shadow] duration-300 ${borderCls} ${opacityCls}`}
    >
      <div className="absolute -top-2.5 left-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-300 text-xs font-extrabold text-slate-900">
        {num}
      </div>
      <div className="mt-2 mb-1 text-sm font-extrabold text-amber-100">
        <Katex expr={label} />
      </div>
      <div className="text-sm leading-6 font-semibold text-slate-300 tabular-nums">{calc}</div>
      <div className="mt-2 text-xl font-extrabold tabular-nums text-amber-300">{result}</div>
    </div>
  );
}

// 인라인 수식 — KaTeX 한 토막
function InlineFormula({ expr }: { expr: string }) {
  return (
    <span className="inline-flex items-center rounded bg-slate-950/60 px-1.5 py-0.5 align-middle text-amber-200">
      <Katex expr={expr} />
    </span>
  );
}

function CompareMessage({
  caseData,
  computed,
  k,
}: {
  caseData: NewsCase;
  computed: Computed;
  k: number;
}) {
  const calcMargin = computed.half * 100;
  const reported = caseData.reportedMargin;
  const diff = Math.abs(calcMargin - reported);
  if (k === 1.96) {
    return (
      <>
        🔍 기사에 적힌 표본오차는 <b className="text-emerald-200">±{reported}%P</b>, 우리가
        계산한 95% 오차한계{" "}
        <InlineFormula expr={String.raw`k\cdot\sqrt{\dfrac{\hat{p}\hat{q}}{n}}`} /> 는{" "}
        <b className="text-emerald-200">±{calcMargin.toFixed(2)}%P</b> 로 거의{" "}
        {diff < 0.5 ? "일치" : "비슷한 수준"}!
        <br />
        👉 신문 기사의 “표본오차 ±△%P”는 바로 우리가 배운{" "}
        <InlineFormula expr={String.raw`k\cdot\sqrt{\dfrac{\hat{p}\hat{q}}{n}}`} /> 였어요.
        기사들은 보통 <b className="text-emerald-200">p̂ = ½</b> 을 가정하여 최대 오차로 표기합니다.
      </>
    );
  }
  const eq95 = ((1.96 / 2.58) * calcMargin).toFixed(2);
  return (
    <>
      🔍 신뢰도를 <b className="text-emerald-200">99%</b> 로 올리면 오차한계가{" "}
      <b className="text-emerald-200">±{calcMargin.toFixed(2)}%P</b> 로 더 커집니다. (95%일 때는
      약 ±{eq95}%P)
      <br />
      👉 “더 강하게 확신” 하려면 “더 넓은 범위” 를 잡아야 하는 것이지요.
    </>
  );
}

// ─── 수직선 Canvas ─────────────────────────────────────
function NumlineCanvas({
  caseData,
  computed,
}: {
  caseData: NewsCase;
  computed: Computed | null;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 900;
  const H = 230;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const center = caseData.phat;
    const halfWindow = Math.max(
      0.06,
      (computed ? computed.half : caseData.reportedMargin / 100) * 4
    );
    let xMin = Math.max(0, center - halfWindow);
    let xMax = Math.min(1, center + halfWindow);
    if (xMax - xMin < 0.04) {
      xMin = Math.max(0, center - 0.04);
      xMax = Math.min(1, center + 0.04);
    }

    const padL = 44;
    const padR = 44;
    const padT = 46;
    const padB = 70;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const yMid = padT + plotH / 2;

    const X = (v: number) => padL + ((v - xMin) / (xMax - xMin)) * plotW;

    ctx.strokeStyle = "rgba(148,163,184,.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, yMid);
    ctx.lineTo(W - padR, yMid);
    ctx.stroke();

    const ticks = 9;
    ctx.strokeStyle = "rgba(148,163,184,.4)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < ticks; i++) {
      const v = xMin + (i / (ticks - 1)) * (xMax - xMin);
      const x = X(v);
      ctx.beginPath();
      ctx.moveTo(x, yMid - 7);
      ctx.lineTo(x, yMid + 7);
      ctx.stroke();
      ctx.fillText((v * 100).toFixed(1) + "%", x, yMid + 12);
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("모비율 p (퍼센트)", W / 2, H - 22);

    // p̂ 점
    const xc = X(caseData.phat);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(xc, yMid, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("p̂ = " + fmtP(caseData.phat, 1), xc, yMid - 22);

    if (!computed) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("단계별 계산 후 신뢰구간이 표시됩니다", W / 2, padT + 18);
      return;
    }

    // 신뢰구간
    const x1 = X(Math.max(xMin, computed.lo));
    const x2 = X(Math.min(xMax, computed.hi));
    const grad = ctx.createLinearGradient(x1, 0, x2, 0);
    grad.addColorStop(0, "rgba(34,211,238,.85)");
    grad.addColorStop(1, "rgba(168,85,247,.85)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 22;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, yMid);
    ctx.lineTo(x2, yMid);
    ctx.stroke();
    ctx.lineCap = "butt";

    // 양 끝 마커
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, yMid - 26);
    ctx.lineTo(x1, yMid + 26);
    ctx.moveTo(x2, yMid - 26);
    ctx.lineTo(x2, yMid + 26);
    ctx.stroke();

    // 라벨
    ctx.fillStyle = "#67e8f9";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(fmtP(computed.lo), x1, yMid + 50);
    ctx.fillText(fmtP(computed.hi), x2, yMid + 50);

    // p̂ 점 위에 다시
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(xc, yMid, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 길이 화살표
    const arrY = padT + 8;
    ctx.strokeStyle = "rgba(196,181,253,.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, arrY);
    ctx.lineTo(x2, arrY);
    ctx.moveTo(x1, arrY - 6);
    ctx.lineTo(x1, arrY + 6);
    ctx.moveTo(x2, arrY - 6);
    ctx.lineTo(x2, arrY + 6);
    ctx.stroke();
    ctx.fillStyle = "#c4b5fd";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(
      "구간 길이 ≈ " + (computed.half * 2 * 100).toFixed(2) + "%P",
      (x1 + x2) / 2,
      arrY - 9
    );
  }, [caseData, computed]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[230px] w-full rounded-lg bg-slate-950/60"
      aria-label="신뢰구간 수직선"
    />
  );
}

// ─── 4개 비교 Canvas ─────────────────────────────────
function CompareCanvas({ curKey, k }: { curKey: CaseKey; k: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const W = 900;
  const H = 340;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const keys: CaseKey[] = ["sonny", "pet", "marry", "read"];
    const padL = 170;
    const padR = 40;
    const padT = 24;
    const padB = 46;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const xMin = 0;
    const xMax = 1;
    const X = (v: number) => padL + ((v - xMin) / (xMax - xMin)) * plotW;

    // x 격자
    ctx.strokeStyle = "rgba(148,163,184,.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= 10; i++) {
      const v = i / 10;
      const x = X(v);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
      ctx.fillText((v * 100).toFixed(0) + "%", x, padT + plotH + 5);
    }
    ctx.setLineDash([]);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("모비율 p (퍼센트)", padL + plotW / 2, H - 16);

    const rowH = plotH / keys.length;
    keys.forEach((kkey, i) => {
      const c = CASES[kkey];
      const y = padT + rowH * (i + 0.5);
      const phat = c.phat;
      const half = k * Math.sqrt((phat * (1 - phat)) / c.n);
      const lo = phat - half;
      const hi = phat + half;

      ctx.strokeStyle = "rgba(148,163,184,.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      // 라벨 — tabName(짧은 라벨) 사용해 캔버스 왼쪽 잘림 회피
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(c.icon + " " + c.tabName, padL - 10, y - 5);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("n=" + c.n.toLocaleString() + "  p̂=" + fmtP(phat, 1), padL - 10, y + 12);

      // CI 막대
      const x1 = X(lo);
      const x2 = X(hi);
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
      ctx.lineCap = "butt";

      // 끝 마커
      ctx.strokeStyle = c.color2;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y - 18);
      ctx.lineTo(x1, y + 18);
      ctx.moveTo(x2, y - 18);
      ctx.lineTo(x2, y + 18);
      ctx.stroke();

      // p̂ 점
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(X(phat), y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 길이 라벨
      ctx.fillStyle = c.color;
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const lenTxt = "폭 ±" + (half * 100).toFixed(2) + "%P";
      if (x2 + 110 < W - padR) {
        ctx.fillText(lenTxt, x2 + 8, y);
      } else {
        ctx.textAlign = "right";
        ctx.fillText(lenTxt, x1 - 8, y);
      }

      // 현재 선택 강조 — 라벨 영역(padL-150)에서 시작해 잘리지 않게
      if (kkey === curKey) {
        ctx.strokeStyle = "rgba(251,191,36,.85)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(padL - 150, y - 22, plotW + 150, 44);
        ctx.setLineDash([]);
      }
    });

    // 상단 제목
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      "현재 신뢰도: " +
        (k === 1.96 ? "95% (k=1.96)" : "99% (k=2.58)") +
        " · 노란 점선 = 현재 선택된 사례",
      W / 2,
      4
    );
  }, [curKey, k]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className="block h-[340px] w-full rounded-lg bg-slate-950/60"
      aria-label="4개 신뢰구간 비교"
    />
  );
}
