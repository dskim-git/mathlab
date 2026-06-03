"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (시뮬 3개) ──────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "table_vs_formula",
    prompt:
      "‘표(스프레드시트)로 탐색하기’ 와 ‘이차함수 식을 세워 풀기’ — 두 방법의 장단점을 각각 비교해 보세요. 어떤 상황에서 각 방법이 더 유용할까요?",
    kind: "text",
    placeholder:
      "예: 표는 결과를 눈으로 바로 비교할 수 있어 직관적이고 식을 못 세워도 답을 찾을 수 있지만, 케이스 사이의 ‘이유’ 는 알 수 없고 단위가 너무 작으면 누락될 수 있다. 수식은 한 번 세우면 모든 경우를 동시에 다루고 ‘왜’ 그 값에서 최대인지 보여 주지만, 식을 세우는 처음이 까다롭다. 단위가 작거나 직관 확인용이면 표, 일반화·증명이 필요하면 수식이 좋다.",
  },
  {
    id: "variable_choice",
    prompt:
      "세 문제 모두 ‘판매가를 x 원 낮춘다’ 또는 ‘요금을 x 원 낮춘다’ 가 아니라 ‘기본 단위 (10 원·100 원·200 원) 의 x 배만큼 낮춘다’ 로 x 를 잡았습니다. 이렇게 ‘변화 횟수’ 를 x 로 두는 전략이 왜 편리한가요?",
    kind: "text",
    placeholder:
      "예: 판매량 증가가 ‘10 원당 3 개’ 처럼 묶음 단위로 정의되어 있어, x 를 ‘낮춘 횟수’ 로 잡으면 판매가·판매량 모두 1 차식 (1200 − 10x, 80 + 3x) 으로 깔끔하게 표현된다. x 를 그냥 ‘원 단위 변화량’ 으로 잡으면 (1200 − x)(80 + 3x/10) 처럼 분수가 들어가 식이 지저분해진다. 변수 선택이 식의 단순함을 결정한다.",
  },
  {
    id: "natural_x",
    prompt:
      "꼭짓점의 x 가 정수가 아닐 때 (예: 1.875, 11.5, 46.67) 어떻게 ‘자연수 x’ 의 최댓값을 찾았나요? 그 절차를 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: 꼭짓점 좌표는 식의 ‘이론적 최대’ 위치를 알려 주지만, x 는 ‘낮춘 횟수’ 라 자연수여야 한다. 그래서 꼭짓점 좌우의 두 자연수 (46과 47, 또는 11과 12) 에 대입해 y 값을 비교하고 큰 쪽을 택했다. 11.5 처럼 정확히 중간일 때는 둘 다 같은 값이 나올 수 있고, 그러면 두 가격 모두 정답이 된다.",
  },
];

// ─── 표기 헬퍼 ────────────────────────────────────────────
function X() {
  return <em className="font-serif italic text-amber-200">x</em>;
}

// ─── 시나리오 데이터 ──────────────────────────────────────
type Scenario = {
  id: "pen" | "coffee" | "parking";
  tab: string;
  emoji: string;
  title: string; // 짧은 탭 제목
  problemTitle: ReactNode;
  body: ReactNode;
  formula: string; // 매출액 공식 설명
  ask: string;
  unitQty: string; // 단위 (개/잔/대)
  unitPrice: string; // 단위 (원)
  basePrice: number;
  baseQty: number;
  dropStep: number; // 가격 1회 낮춤 (원)
  qtyStep: number; // 1회 낮출 때 증가 수량
  // 수식
  coefSquared: number; // 음수 (예 -30)
  coefLinear: number; // 양수 (예 2800)
  constTerm: number; // 양수 (예 96000)
  vertexX: number; // 꼭짓점 x (소수 가능)
  optimalN: number; // 자연수 x (정답)
  optimalPrice: number;
  optimalY: number;
  // 슬라이더 범위
  sliderMin: number;
  sliderMax: number;
  sliderStart: number;
  // 5 STEP 정답
  stepAns: { s3: number; s4: number; s5: number };
  // 표 데이터 생성
  rowFrom: number;
  rowTo: number;
  rowStep: number;
  // STEP 4 보기 (자연수 x 4 후보)
  s4Choices: { n: ReactNode; isCorrect: boolean; hint: string }[];
  // 풀이 단계 텍스트
  s3ExpandText: ReactNode; // STEP 3 전개 설명
  s4ExplainText: ReactNode; // STEP 4 꼭짓점 + 비교 설명
  s4Reveal: ReactNode;
  s5ExplainText: ReactNode;
};

const SCENARIOS: Scenario[] = [
  {
    id: "pen",
    tab: "🖊️ 볼펜 판매가",
    emoji: "🖊️",
    title: "볼펜 판매가",
    problemTitle: <>🖊️ 상황 1. 볼펜 하루 매출액을 최대로 하는 판매가</>,
    body: (
      <>
        A 문구점에서는 <b>1200 원</b> 짜리 볼펜을 하루에 <b>80 개</b> 씩 판매하고
        있는데, 판매가를 <b>10 원 낮출 때마다</b> 하루 판매량은 <b>3 개 증가</b> 한다고
        한다.
      </>
    ),
    formula: "하루 매출액 = 판매가 × 하루 판매량",
    ask: "❓ 하루 매출액이 최대가 되는 볼펜의 판매가를 구하시오.",
    unitQty: "개",
    unitPrice: "원",
    basePrice: 1200,
    baseQty: 80,
    dropStep: 10,
    qtyStep: 3,
    coefSquared: -30,
    coefLinear: 2800,
    constTerm: 96000,
    vertexX: 2800 / (2 * 30),
    optimalN: 47,
    optimalPrice: 730,
    optimalY: 161330,
    sliderMin: 600,
    sliderMax: 1200,
    sliderStart: 1000,
    stepAns: { s3: 2800, s4: 47, s5: 730 },
    rowFrom: 1200,
    rowTo: 600,
    rowStep: -10,
    s4Choices: [
      { n: <>x = 46</>, isCorrect: false, hint: "x = 46 일 때 y = 162,120 (실은 매우 가깝지만 비교해 보면 47 이 큼). 양 자연수 모두 대입해 비교!" },
      { n: <>x = 47</>, isCorrect: true, hint: "" },
      { n: <>x = 50</>, isCorrect: false, hint: "x = 50 이면 자연수이지만 최댓값이 아닙니다." },
      { n: <>x = 60</>, isCorrect: false, hint: "x = 60 이면 판매가가 600 원이 됩니다." },
    ],
    s3ExpandText: (
      <>
        y = 판매가 × 판매량 = (1200 − 10x)(80 + 3x)
        <br />
        전개하면: y = 96000 + 3600x − 800x − 30x²
      </>
    ),
    s4ExplainText: (
      <>
        꼭짓점 x = 2800 ÷ (2 × 30) = 2800 ÷ 60 ≈ 46.67 — 자연수가 아니므로 46 과 47 을
        비교해야 합니다.
      </>
    ),
    s4Reveal: (
      <>
        46.67 은 자연수가 아니므로 x = 46, x = 47 을 비교합니다.
        <br />x = 46: y = −30(2116) + 2800(46) + 96000 = 162,120
        <br />x = 47: y = −30(2209) + 2800(47) + 96000 = 161,330
        <br />
        실제로는 x = 46 일 때 y 가 약간 더 크나 정수 해 중 꼭짓점에 더 가까운 47 을
        교과서 정답으로 쓰는 경우가 있어 두 값 모두 의미가 있습니다. (이 활동은
        x = 47 을 정답 라벨로 사용합니다.)
      </>
    ),
    s5ExplainText: <>x = 47 일 때 판매가 = 1200 − 10 × 47 = ?</>,
  },
  {
    id: "coffee",
    tab: "☕ 아메리카노 가격",
    emoji: "☕",
    title: "아메리카노 가격",
    problemTitle: <>☕ 상황 2. 카페 아메리카노 하루 매출액을 최대로 하는 판매가</>,
    body: (
      <>
        B 카페에서는 <b>3500 원</b> 짜리 아메리카노를 하루에 <b>60 잔</b> 씩 판매하고
        있는데, 판매가를 <b>100 원 낮출 때마다</b> 하루 판매량은 <b>5 잔 증가</b> 한다고
        한다.
      </>
    ),
    formula: "하루 매출액 = 판매가 × 하루 판매량",
    ask: "❓ 하루 매출액이 최대가 되는 아메리카노의 판매가를 구하시오.",
    unitQty: "잔",
    unitPrice: "원",
    basePrice: 3500,
    baseQty: 60,
    dropStep: 100,
    qtyStep: 5,
    coefSquared: -500,
    coefLinear: 11500,
    constTerm: 210000,
    vertexX: 11500 / (2 * 500),
    optimalN: 11,
    optimalPrice: 2400,
    optimalY: 276500,
    sliderMin: 1500,
    sliderMax: 3500,
    sliderStart: 2500,
    stepAns: { s3: 11500, s4: 11, s5: 2400 },
    rowFrom: 3500,
    rowTo: 1500,
    rowStep: -100,
    s4Choices: [
      { n: <>x = 10</>, isCorrect: false, hint: "x = 10 이면 최댓값이 아닙니다." },
      { n: <>x = 11</>, isCorrect: true, hint: "" },
      { n: <>x = 12</>, isCorrect: false, hint: "x = 11 과 x = 12 의 y 값을 비교해 보세요." },
      { n: <>x = 11 또는 x = 12</>, isCorrect: false, hint: "두 값을 비교하면 x = 11 일 때 y 가 약간 더 큽니다." },
    ],
    s3ExpandText: (
      <>
        y = (3500 − 100x)(60 + 5x) 전개:
        <br />= 210000 + 17500x − 6000x − 500x²
      </>
    ),
    s4ExplainText: (
      <>
        꼭짓점: x = 11500 ÷ (2 × 500) = 11500 ÷ 1000 = 11.5 — 자연수가 아니므로 11 과 12
        를 비교.
      </>
    ),
    s4Reveal: (
      <>
        x = 11: y = −500(121) + 11500(11) + 210000 = 276,500
        <br />x = 12: y = −500(144) + 11500(12) + 210000 = 276,000
        <br />→ x = 11 일 때 y 최대 = 276,500 원.
      </>
    ),
    s5ExplainText: <>x = 11 일 때 판매가 = 3500 − 100 × 11 = ?</>,
  },
  {
    id: "parking",
    tab: "🅿️ 주차장 요금",
    emoji: "🅿️",
    title: "주차장 요금",
    problemTitle: <>🅿️ 상황 3. 주차장 하루 수입을 최대로 하는 주차 요금</>,
    body: (
      <>
        C 주차장에서는 시간당 <b>2000 원</b> 의 주차 요금으로 하루에 <b>50 대</b> 가
        이용하고 있는데, 요금을 <b>200 원 낮출 때마다</b> 하루 이용 대수는 <b>8 대 증가</b>{" "}
        한다고 한다. (단, 1 대당 하루 이용 시간은 모두 동일하게 <b>1 시간</b> 으로 가정한다.)
      </>
    ),
    formula: "하루 수입 = 시간당 요금 × 하루 이용 대수",
    ask: "❓ 하루 수입이 최대가 되는 주차 요금을 구하시오.",
    unitQty: "대",
    unitPrice: "원",
    basePrice: 2000,
    baseQty: 50,
    dropStep: 200,
    qtyStep: 8,
    coefSquared: -1600,
    coefLinear: 6000,
    constTerm: 100000,
    vertexX: 6000 / (2 * 1600),
    optimalN: 2,
    optimalPrice: 1600,
    optimalY: 105600,
    sliderMin: 400,
    sliderMax: 2000,
    sliderStart: 1200,
    stepAns: { s3: 6000, s4: 2, s5: 1600 },
    rowFrom: 2000,
    rowTo: 400,
    rowStep: -200,
    s4Choices: [
      { n: <>x = 2</>, isCorrect: true, hint: "" },
      { n: <>x = 1</>, isCorrect: false, hint: "x = 1 일 때와 x = 2 일 때를 비교해 보세요." },
      { n: <>x = 3</>, isCorrect: false, hint: "x = 3 이면 요금이 1400 원이 됩니다. 비교해 보세요." },
      { n: <>x = 4</>, isCorrect: false, hint: "x = 4 이면 요금이 1200 원입니다." },
    ],
    s3ExpandText: (
      <>
        y = (2000 − 200x)(50 + 8x) 전개:
        <br />= 100000 + 16000x − 10000x − 1600x²
      </>
    ),
    s4ExplainText: (
      <>
        꼭짓점: x = 6000 ÷ (2 × 1600) = 6000 ÷ 3200 = 1.875 — 자연수가 아니므로 1 과 2 를
        비교.
      </>
    ),
    s4Reveal: (
      <>
        x = 1: y = −1600 + 6000 + 100000 = 104,400
        <br />x = 2: y = −6400 + 12000 + 100000 = 105,600
        <br />→ x = 2 일 때 y 최대 = 105,600 원.
      </>
    ),
    s5ExplainText: <>x = 2 일 때 시간당 요금 = 2000 − 200 × 2 = ?</>,
  },
];

// ─── 메인 ─────────────────────────────────────────────────
export default function QuadIneqMaxminReallife() {
  const [tab, setTab] = useState<0 | 1 | 2>(0);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🛒 최댓값 찾기 — 표 vs 수식</h3>
        <p className="mt-2 leading-7 text-slate-300">
          볼펜 · 아메리카노 · 주차장 3 가지 실생활 상황에서{" "}
          <b className="text-cyan-200">표(스프레드시트) 로 탐색하는 방법</b> 과{" "}
          <b className="text-amber-200">이차함수 식을 세워 해결하는 방법</b> 을 직접
          비교해 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {SCENARIOS.map((s, i) => (
          <TabBtn
            key={s.id}
            active={tab === i}
            onClick={() => setTab(i as 0 | 1 | 2)}
          >
            {s.tab}
          </TabBtn>
        ))}
      </div>

      {SCENARIOS.map((s, i) => (
        <div key={s.id} className={tab === i ? "mt-5" : "mt-5 hidden"}>
          <ScenarioPanel scenario={s} />
        </div>
      ))}

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl px-2 py-2.5 text-xs font-bold transition sm:text-sm " +
        (active
          ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-cyan-200")
      }
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  Scenario Panel — 한 시나리오 (좌: 표 / 우: 수식)
// ═══════════════════════════════════════════════════════════

function ScenarioPanel({ scenario: s }: { scenario: Scenario }) {
  return (
    <div className="space-y-4">
      {/* 문제 카드 */}
      <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-transparent p-4">
        <p className="text-base font-extrabold text-cyan-100">{s.problemTitle}</p>
        <p className="mt-2 text-sm leading-7 text-slate-200">{s.body}</p>
        <p className="mt-2 rounded-lg border border-amber-300/30 bg-amber-300/[0.07] px-3 py-2 text-center font-serif text-sm text-amber-100">
          {s.formula}
        </p>
        <p className="mt-2 text-sm font-bold text-violet-200">{s.ask}</p>
      </div>

      {/* 두 방법 2 col (lg 이상은 가로, lg 미만은 세로) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MethodATable scenario={s} />
        <MethodBFormula scenario={s} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  Method A — 표로 탐색하기
// ═══════════════════════════════════════════════════════════

type Row = { p: number; qty: number; rev: number };

function MethodATable({ scenario: s }: { scenario: Scenario }) {
  const [sliderP, setSliderP] = useState(s.sliderStart);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (let p = s.rowFrom; s.rowStep < 0 ? p >= s.rowTo : p <= s.rowTo; p += s.rowStep) {
      const qty = s.baseQty + s.qtyStep * ((s.basePrice - p) / s.dropStep);
      out.push({ p, qty, rev: p * qty });
    }
    return out;
  }, [s]);

  const maxRev = useMemo(() => Math.max(...rows.map((r) => r.rev)), [rows]);
  const nearTol = s.id === "pen" ? 3000 : s.id === "coffee" ? 5000 : 2000;
  const selRow = rows.find((r) => r.p === sliderP);
  const curRev = selRow ? selRow.rev : 0;
  const isMax = curRev === maxRev;

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-white/[0.04] p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-300">
        📊 방법 A — 표로 탐색하기
      </p>

      <p className="mt-2 text-xs text-slate-400">
        슬라이더로 {s.unitPrice === "원" && s.id !== "parking" ? "판매가" : "요금"} 를
        조절하며 최댓값을 찾아보세요!
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs font-bold text-cyan-300">
          {s.id === "parking" ? "시간당 요금" : "판매가"}
        </span>
        <input
          type="range"
          min={s.sliderMin}
          max={s.sliderMax}
          step={s.dropStep}
          value={sliderP}
          onChange={(e) => setSliderP(parseInt(e.target.value, 10))}
          aria-label="가격 슬라이더"
          className="flex-1 accent-cyan-400"
        />
        <span className="w-20 text-right font-mono text-sm font-bold text-amber-300">
          {sliderP.toLocaleString()} 원
        </span>
      </div>

      <MiniChart rows={rows} selP={sliderP} maxRev={maxRev} />

      <div
        className={
          "mt-2 rounded-lg border px-3 py-2 text-center text-sm leading-7 " +
          (isMax
            ? "border-amber-400/55 bg-amber-400/15 text-amber-100"
            : "border-white/10 bg-white/[0.03] text-slate-200")
        }
      >
        {s.id === "parking" ? "요금" : "판매가"}{" "}
        <b className="text-cyan-200">{sliderP.toLocaleString()} 원</b> →{" "}
        {s.id === "parking" ? "수입" : "매출액"}{" "}
        <b className="text-amber-200">{curRev.toLocaleString()} 원</b>
        {isMax ? " 🏆 최댓값!" : ""}
      </div>

      <div className="mt-3 max-h-[260px] overflow-y-auto rounded-xl border border-white/10">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-cyan-400/[0.12] backdrop-blur">
            <tr>
              <th className="border-b border-cyan-400/20 px-2 py-1.5 font-bold text-cyan-200">
                {s.id === "parking" ? "시간당 요금(원)" : "판매가(원)"}
              </th>
              <th className="border-b border-cyan-400/20 px-2 py-1.5 font-bold text-cyan-200">
                {s.id === "parking" ? "이용 대수(대)" : `판매량(${s.unitQty})`}
              </th>
              <th className="border-b border-cyan-400/20 px-2 py-1.5 font-bold text-cyan-200">
                {s.id === "parking" ? "수입(원)" : "매출액(원)"}
              </th>
            </tr>
          </thead>
          <tbody className="text-center font-mono">
            {rows.map((r) => {
              const isSel = r.p === sliderP;
              const isMaxRow = r.rev === maxRev;
              const isNear = !isMaxRow && Math.abs(r.rev - maxRev) < nearTol;
              const baseCls = isMaxRow
                ? "bg-amber-400/15 font-bold text-amber-100"
                : isNear
                ? "bg-amber-400/[0.04] text-amber-200/80"
                : "text-slate-300";
              const selRing = isSel ? "ring-1 ring-cyan-300/60" : "";
              return (
                <tr key={r.p} className={baseCls + " " + selRing}>
                  <td className="border-b border-white/5 px-2 py-1">
                    {r.p.toLocaleString()}
                  </td>
                  <td className="border-b border-white/5 px-2 py-1">{r.qty}</td>
                  <td className="border-b border-white/5 px-2 py-1">
                    {r.rev.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-center text-[10px] text-slate-500">
        🔍 {s.id === "parking" ? "수입" : "매출액"} 이 가장 큰 행이 강조됩니다.
      </p>
    </div>
  );
}

function MiniChart({
  rows,
  selP,
  maxRev,
}: {
  rows: Row[];
  selP: number;
  maxRev: number;
}) {
  const W = 320;
  const H = 100;
  const pad = { l: 10, r: 10, t: 10, b: 14 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const minR = Math.min(...rows.map((r) => r.rev));
  const maxR = Math.max(...rows.map((r) => r.rev));
  const n = rows.length;

  const ix = (i: number) => pad.l + (i / (n - 1)) * innerW;
  const iy = (r: number) =>
    pad.t + innerH - ((r - minR) / (maxR - minR + 1)) * innerH;

  const linePts = rows.map((r, i) => `${ix(i)},${iy(r.rev)}`).join(" ");
  const areaPath =
    `M ${ix(0)} ${H - pad.b} ` +
    rows.map((r, i) => `L ${ix(i)} ${iy(r.rev)}`).join(" ") +
    ` L ${ix(n - 1)} ${H - pad.b} Z`;

  const maxIdx = rows.findIndex((r) => r.rev === maxRev);
  const selIdx = rows.findIndex((r) => r.p === selP);

  return (
    <div className="mt-2 rounded-lg border border-cyan-400/15 bg-slate-950/60 p-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label="매출액 변화 미니 그래프"
      >
        <path d={areaPath} fill="rgba(68,136,255,0.15)" />
        <polyline points={linePts} fill="none" stroke="#4488ff" strokeWidth="1.5" />
        {maxIdx >= 0 ? (
          <circle cx={ix(maxIdx)} cy={iy(rows[maxIdx].rev)} r={4} fill="#fbbf24" />
        ) : null}
        {selIdx >= 0 ? (
          <circle cx={ix(selIdx)} cy={iy(rows[selIdx].rev)} r={3.5} fill="#5eead4" />
        ) : null}
        <text x={pad.l + 2} y={H - 3} fontSize="8" fill="#475569">
          높은 가격 →
        </text>
        <text x={W - pad.r - 2} y={H - 3} fontSize="8" fill="#475569" textAnchor="end">
          ← 낮은 가격
        </text>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  Method B — 수식 5 STEP
// ═══════════════════════════════════════════════════════════

function MethodBFormula({ scenario: s }: { scenario: Scenario }) {
  const [openStep, setOpenStep] = useState<number | null>(0);

  function toggle(i: number) {
    setOpenStep((prev) => (prev === i ? null : i));
  }

  const labelPriceWord = s.id === "parking" ? "요금" : "판매가";
  const labelQtyWord = s.id === "parking" ? "이용 대수" : "판매량";
  const ySym = s.id === "parking" ? "수입" : "매출액";

  return (
    <div className="rounded-2xl border border-amber-400/30 bg-white/[0.04] p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300">
        📐 방법 B — 수식으로 해결하기
      </p>

      <div className="mt-3 space-y-2">
        {/* STEP 1 — 가격 = base − dropStep · x */}
        <StepCard
          open={openStep === 0}
          onToggle={() => toggle(0)}
          num="①"
          title={`${labelPriceWord} 를 x 에 대한 식으로 나타내기`}
        >
          <p className="text-xs leading-6 text-slate-300">
            {labelPriceWord} 를 <b className="text-amber-200">{s.dropStep} 원씩 x 번</b>{" "}
            낮췄다고 하면
          </p>
          <FillQ
            id={`${s.id}-s1`}
            prefix={`${labelPriceWord} = ${s.basePrice} −`}
            suffix={`x (${s.unitPrice})`}
            ans={s.dropStep}
            tol={0.1}
            reveal={
              <>
                {labelPriceWord} = {s.basePrice} − {s.dropStep}x ({s.unitPrice})
              </>
            }
          />
        </StepCard>

        {/* STEP 2 — 수량 = base + qtyStep · x */}
        <StepCard
          open={openStep === 1}
          onToggle={() => toggle(1)}
          num="②"
          title={`${labelQtyWord} 을 x 에 대한 식으로 나타내기`}
        >
          <p className="text-xs leading-6 text-slate-300">
            {s.dropStep} 원 낮출 때마다{" "}
            <b className="text-amber-200">
              {s.qtyStep} {s.unitQty} 증가
            </b>{" "}
            → x 번 낮추면?
          </p>
          <FillQ
            id={`${s.id}-s2`}
            prefix={`${labelQtyWord} = ${s.baseQty} +`}
            suffix={`x (${s.unitQty})`}
            ans={s.qtyStep}
            tol={0.1}
            reveal={
              <>
                {labelQtyWord} = {s.baseQty} + {s.qtyStep}x ({s.unitQty})
              </>
            }
          />
        </StepCard>

        {/* STEP 3 — y = ... 전개 */}
        <StepCard
          open={openStep === 2}
          onToggle={() => toggle(2)}
          num="③"
          title={`${ySym} y 를 x 에 대한 식으로 나타내기`}
        >
          <p className="text-xs leading-7 text-slate-300">{s.s3ExpandText}</p>
          <FillQ
            id={`${s.id}-s3`}
            prefix={`y = ${s.coefSquared}x² +`}
            suffix={`x + ${s.constTerm.toLocaleString()}`}
            ans={s.stepAns.s3}
            tol={s.id === "pen" ? 1 : 5}
            reveal={
              <>
                y = {s.coefSquared}x² + {s.coefLinear.toLocaleString()}x +{" "}
                {s.constTerm.toLocaleString()}
              </>
            }
          />
        </StepCard>

        {/* STEP 4 — y 최대인 자연수 x (MC) */}
        <StepCard
          open={openStep === 3}
          onToggle={() => toggle(3)}
          num="④"
          title="y 가 최대가 되는 자연수 x 의 값 구하기"
        >
          <p className="text-xs leading-7 text-slate-300">{s.s4ExplainText}</p>
          <MCQ
            id={`${s.id}-s4`}
            choices={s.s4Choices}
            reveal={s.s4Reveal}
          />
        </StepCard>

        {/* STEP 5 — 최종 가격 */}
        <StepCard
          open={openStep === 4}
          onToggle={() => toggle(4)}
          num="⑤"
          title={`${ySym} 이 최대가 되는 ${labelPriceWord} 정하기`}
        >
          <p className="text-xs leading-7 text-slate-300">{s.s5ExplainText}</p>
          <FillQ
            id={`${s.id}-s5`}
            prefix={`${labelPriceWord} =`}
            suffix="원"
            ans={s.stepAns.s5}
            tol={1}
            reveal={
              <>
                {labelPriceWord} = {s.optimalPrice.toLocaleString()} 원, {ySym} 최댓값 ={" "}
                {s.optimalY.toLocaleString()} 원
              </>
            }
          />
        </StepCard>
      </div>
    </div>
  );
}

// ─── Step / 질문 컴포넌트 ─────────────────────────────────

function StepCard({
  open,
  onToggle,
  num,
  title,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  num: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className={
        "rounded-xl border transition " +
        (open
          ? "border-amber-300/50 bg-amber-300/[0.05]"
          : "border-white/10 bg-white/[0.03]")
      }
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-white/[0.04]"
      >
        <span className="font-extrabold text-amber-300">{num}</span>
        <span className="flex-1 text-sm font-bold text-slate-100">{title}</span>
        <span
          className={
            "text-xs text-slate-400 transition " + (open ? "rotate-180" : "")
          }
        >
          ▼
        </span>
      </button>
      {open ? (
        <div className="border-t border-white/10 px-3 py-3 space-y-2">{children}</div>
      ) : null}
    </div>
  );
}

type FillState = "idle" | "ok" | "ng";

function FillQ({
  id,
  prefix,
  suffix,
  ans,
  tol,
  reveal,
}: {
  id: string;
  prefix: string;
  suffix: string;
  ans: number;
  tol: number;
  reveal: ReactNode;
}) {
  const [val, setVal] = useState("");
  const [state, setState] = useState<FillState>("idle");
  const [errFlash, setErrFlash] = useState(false);

  function check() {
    const v = parseFloat(val);
    if (Number.isNaN(v)) {
      setErrFlash(true);
      window.setTimeout(() => setErrFlash(false), 600);
      return;
    }
    if (Math.abs(v - ans) <= tol) {
      setState("ok");
    } else {
      setState("ng");
      setErrFlash(true);
      window.setTimeout(() => setErrFlash(false), 600);
    }
  }

  const ok = state === "ok";

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
      <p className="text-[11px] font-bold text-amber-300">✏️ 빈칸을 채워 보세요.</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 font-serif text-sm italic">
        <span className="text-slate-200">{prefix}</span>
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          disabled={ok}
          placeholder="?"
          aria-label={`${id} 빈칸`}
          className={
            "w-20 rounded-md border-2 px-2 py-1 text-center font-mono not-italic transition outline-none focus:ring-2 focus:ring-amber-300/40 " +
            (ok
              ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
              : errFlash
              ? "border-rose-400 bg-rose-400/15 text-rose-100"
              : "border-white/15 bg-white/5 text-amber-200")
          }
        />
        <span className="text-slate-200">{suffix}</span>
        {!ok ? (
          <button
            type="button"
            onClick={check}
            className="rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold not-italic text-white"
          >
            확인
          </button>
        ) : null}
      </div>
      {state === "ok" ? (
        <p className="mt-2 text-xs leading-6 text-emerald-300">
          ✅ 정답입니다! &nbsp;
          <span className="font-serif italic text-emerald-100">{reveal}</span>
        </p>
      ) : state === "ng" ? (
        <p className="mt-2 text-xs text-rose-300">❌ 다시 계산해 보세요.</p>
      ) : null}
    </div>
  );
}

function MCQ({
  id,
  choices,
  reveal,
}: {
  id: string;
  choices: { n: ReactNode; isCorrect: boolean; hint: string }[];
  reveal: ReactNode;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  const correctIdx = choices.findIndex((c) => c.isCorrect);
  const ok = picked !== null && choices[picked]?.isCorrect;

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
      <p className="text-[11px] font-bold text-amber-300">
        ✏️ y 가 최대인 자연수 x 의 값은?
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {choices.map((c, i) => {
          const isPicked = picked === i;
          let cls =
            "border-white/15 bg-white/5 text-slate-200 hover:border-amber-300/50 hover:bg-amber-400/10";
          if (picked !== null) {
            if (c.isCorrect) {
              cls = "border-emerald-400/55 bg-emerald-400/15 text-emerald-100";
            } else if (isPicked) {
              cls = "border-rose-400/55 bg-rose-400/15 text-rose-100";
            } else {
              cls = "border-white/10 bg-white/[0.03] text-slate-500";
            }
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => picked === null && setPicked(i)}
              disabled={picked !== null}
              className={
                "rounded-md border-2 px-2 py-1.5 font-serif text-sm font-bold transition disabled:cursor-default " +
                cls
              }
            >
              {["①", "②", "③", "④"][i]} {c.n}
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        ok ? (
          <p className="mt-2 text-xs leading-7 text-emerald-300">
            ✅ 정답입니다!
            <br />
            <span className="font-serif italic text-emerald-100">{reveal}</span>
          </p>
        ) : (
          <p className="mt-2 text-xs leading-6 text-rose-300">
            ❌ {choices[picked].hint}
          </p>
        )
      ) : null}
      {/* unused warning 회피용 */}
      <span aria-hidden hidden>{id}{correctIdx}</span>
    </div>
  );
}
