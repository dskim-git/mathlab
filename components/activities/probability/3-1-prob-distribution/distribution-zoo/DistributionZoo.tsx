"use client";

import { useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

type Dist = {
  icon: string;
  name: string;
  nameEn: string;
  textbook?: boolean;
  desc: string;
  examples: [string, string];
};

const DISCRETE: Dist[] = [
  {
    icon: "🎯",
    name: "베르누이분포",
    nameEn: "Bernoulli Distribution",
    desc: "성공 또는 실패, 딱 두 가지 결과만 있는 단 한 번의 시행에서 '성공 횟수'의 확률분포입니다.",
    examples: [
      "동전을 한 번 던져 앞면이 나오는지 여부",
      "자유투 한 번에서 성공할지 실패할지",
    ],
  },
  {
    icon: "📊",
    name: "이항분포",
    nameEn: "Binomial Distribution",
    textbook: true,
    desc: "독립적인 베르누이 시행을 n번 반복했을 때, 성공 횟수의 확률분포입니다. 이항분포의 핵심!",
    examples: [
      "동전을 10번 던졌을 때 앞면이 나오는 횟수",
      "시험 20문항을 모두 찍었을 때 맞히는 문항 수",
    ],
  },
  {
    icon: "🎲",
    name: "다항분포",
    nameEn: "Multinomial Distribution",
    desc: "결과가 3가지 이상인 시행을 n번 반복했을 때, 각 결과가 나오는 횟수의 확률분포입니다. 이항분포를 여러 결과로 확장한 것!",
    examples: [
      "주사위를 30번 던졌을 때 각 눈(1~6)이 나오는 횟수",
      "설문에서 '매우좋음/좋음/보통/나쁨/매우나쁨' 응답 분포",
    ],
  },
  {
    icon: "⚖️",
    name: "이산균등분포",
    nameEn: "Discrete Uniform Distribution",
    desc: "유한한 값들이 모두 똑같은 확률을 가지는 가장 단순한 이산확률분포입니다.",
    examples: [
      "주사위를 한 번 던져 나오는 수 (1~6이 모두 1/6 확률)",
      "1부터 45까지 중 로또 번호 하나를 뽑을 때",
    ],
  },
  {
    icon: "⚡",
    name: "포아송분포",
    nameEn: "Poisson Distribution",
    desc: "일정한 시간이나 공간 안에서 드물게 발생하는 사건의 횟수를 나타내는 확률분포입니다.",
    examples: [
      "하루 동안 특정 교차로에서 발생하는 교통사고 건수",
      "1시간 동안 병원 응급실에 방문하는 환자 수",
    ],
  },
  {
    icon: "🔁",
    name: "기하분포",
    nameEn: "Geometric Distribution",
    desc: "처음으로 성공할 때까지 시행해야 하는 횟수의 확률분포입니다. '몇 번 만에 처음 성공할까?'",
    examples: [
      "자유투를 처음으로 성공할 때까지 시도한 횟수",
      "불량품이 처음 발생할 때까지 생산한 제품 수",
    ],
  },
  {
    icon: "🔢",
    name: "음이항분포",
    nameEn: "Negative Binomial Distribution",
    desc: "r번째 성공이 일어날 때까지 시행해야 하는 총 횟수의 확률분포입니다. 기하분포를 r번으로 확장!",
    examples: [
      "야구에서 3번째 아웃을 잡을 때까지의 타석 수",
      "불량품이 5번째로 나올 때까지 검사한 제품 수",
    ],
  },
  {
    icon: "🃏",
    name: "초기하분포",
    nameEn: "Hypergeometric Distribution",
    desc: "비복원추출에서 N개 중 n개를 뽑았을 때, 원하는 것이 k개 뽑힐 확률을 나타내는 확률분포입니다.",
    examples: [
      "30명의 학생 중 12명이 여학생일 때, 5명을 무작위로 선발했을 때의 여학생 수",
      "52장의 카드 중 5장을 뽑았을 때 스페이드가 나오는 장 수",
    ],
  },
];

const CONTINUOUS: Dist[] = [
  {
    icon: "📏",
    name: "균등분포",
    nameEn: "Continuous Uniform Distribution",
    desc: "정해진 구간 안의 모든 값이 동일한 확률로 나타나는 가장 단순한 연속확률분포입니다.",
    examples: [
      "버스가 0~10분 사이에 도착할 때, 정확히 몇 분에 도착할지",
      "원판을 돌려 멈추는 각도(0°~360°)",
    ],
  },
  {
    icon: "🔔",
    name: "정규분포",
    nameEn: "Normal Distribution",
    textbook: true,
    desc: "평균을 중심으로 좌우 대칭인 종 모양의 연속확률분포입니다. 자연과 사회 현상에서 가장 자주 나타납니다.",
    examples: [
      "같은 학년 학생들의 키 분포",
      "공장에서 생산된 과자의 무게 분포",
    ],
  },
  {
    icon: "⭐",
    name: "표준정규분포",
    nameEn: "Standard Normal Distribution",
    textbook: true,
    desc: "평균이 0, 표준편차가 1인 특별한 정규분포입니다. 모든 정규분포는 이것으로 변환해 확률을 구합니다.",
    examples: [
      "Z점수(표준점수)로 변환된 수능 원점수",
      "정규분포를 따르는 어떤 데이터든 표준화하면 이 분포가 됨",
    ],
  },
  {
    icon: "⏱️",
    name: "지수분포",
    nameEn: "Exponential Distribution",
    desc: "다음 사건이 발생하기까지 기다려야 하는 시간의 확률분포입니다. 포아송분포의 '쌍둥이'!",
    examples: [
      "기계가 고장난 후 다음 고장까지의 시간",
      "버스 정류장에서 다음 버스를 기다리는 시간",
    ],
  },
  {
    icon: "🎯",
    name: "베타분포",
    nameEn: "Beta Distribution",
    desc: "0과 1 사이의 비율이나 확률 그 자체를 모델링하는 확률분포입니다.",
    examples: [
      "야구 선수의 타율(성공 비율) 추정",
      "어떤 광고 클릭률이 얼마나 될지 불확실성 표현",
    ],
  },
  {
    icon: "⏳",
    name: "감마분포",
    nameEn: "Gamma Distribution",
    desc: "r번째 사건이 발생하기까지의 대기 시간의 확률분포입니다. 지수분포를 r번으로 확장한 것!",
    examples: [
      "3번째 고객이 도착할 때까지의 시간",
      "보험 청구 금액의 분포 모델링",
    ],
  },
  {
    icon: "🔬",
    name: "카이제곱분포",
    nameEn: "Chi-squared Distribution",
    desc: "표준정규분포를 따르는 값들을 제곱해서 합산한 확률분포입니다. 통계 검정에서 자주 쓰입니다.",
    examples: [
      "설문조사에서 관찰 빈도와 기대 빈도 차이 검정(χ² 검정)",
      "두 범주형 변수 사이의 연관성 검정",
    ],
  },
  {
    icon: "🧪",
    name: "스튜던트 t분포",
    nameEn: "Student's t-Distribution",
    desc: "표본의 크기가 작을 때 모평균을 추정하는 데 쓰이는 확률분포입니다. 샘플 수가 많아질수록 정규분포에 가까워집니다.",
    examples: [
      "소수의 실험 참가자로 신약 효과 검증",
      "두 학급의 시험 평균 점수 차이를 소규모 표본으로 비교",
    ],
  },
  {
    icon: "📐",
    name: "F분포",
    nameEn: "F Distribution",
    desc: "두 집단의 분산을 비교할 때 사용하는 확률분포입니다. 세 집단 이상의 평균 차이를 한꺼번에 검정할 때도 씁니다.",
    examples: [
      "두 공장 제품의 무게 변동성(균일성) 비교",
      "세 반 이상의 수학 점수 평균 차이 분석(분산분석, ANOVA)",
    ],
  },
];

type TabKey = "discrete" | "continuous";

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "favorite_distribution",
    prompt:
      "카드 중 가장 흥미로웠던 분포 하나를 골라, 어떤 분포인지·왜 흥미로웠는지·어떤 실생활 상황을 떠올리게 했는지 적어 보세요.",
    kind: "text",
    placeholder: "예: 포아송분포 — 응급실 환자 수처럼 '드물게 일어나는 사건' 횟수를 다룬다는 점이 흥미로웠다. 카페에서 시간당 손님 수가 떠올랐다.",
  },
  {
    id: "beyond_textbook",
    prompt:
      "고등학교에서 배우는 이항분포·정규분포 외에 새로 알게 된 분포가 있다면, 그 분포가 왜 따로 만들어졌을지(어떤 상황을 다루기 위한 것일지) 추측해 보세요.",
    kind: "text",
    placeholder: "예: 지수분포는 '다음 일이 일어날 때까지의 시간'을 다루는데, 횟수가 아니라 시간이 관심 대상일 때 필요해서 따로 만든 것 같다.",
  },
];

export default function DistributionZoo() {
  const [tab, setTab] = useState<TabKey>("discrete");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">🌐 세상의 확률분포 한눈에 보기</h3>
        <p className="mt-2 leading-7 text-slate-300">
          수학자들이 발견한 다양한 확률분포를 만나보세요. 카드를 클릭하면 상세 설명과 실생활 예시를 볼 수 있어요.
        </p>

        <div className="mt-4 rounded-xl border border-indigo-400/30 bg-indigo-400/5 p-4 text-center">
          <p className="text-sm leading-7 text-indigo-100/90">
            우리가 배우는 확률분포는 전체 중 극히 일부예요. 고등학교에서는 이 중{" "}
            <b className="text-indigo-200">이항분포</b>와{" "}
            <b className="text-indigo-200">정규분포(표준정규분포 포함)</b>를 집중적으로 다룹니다. ⭐
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <TabButton active={tab === "discrete"} onClick={() => setTab("discrete")} tone="amber">
          ⚂ 이산확률분포 ({DISCRETE.length}종)
        </TabButton>
        <TabButton active={tab === "continuous"} onClick={() => setTab("continuous")} tone="emerald">
          〰 연속확률분포 ({CONTINUOUS.length}종)
        </TabButton>
      </div>

      {/* 두 탭 동시 마운트 + 펼침 상태 보존 */}
      <div className={tab === "discrete" ? "mt-5" : "mt-5 hidden"}>
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
          이산확률변수 — 셀 수 있는 값을 갖는 확률분포
        </p>
        <DistGrid dists={DISCRETE} tone="amber" />
      </div>
      <div className={tab === "continuous" ? "mt-5" : "mt-5 hidden"}>
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
          연속확률변수 — 구간 내 어떤 값도 가질 수 있는 확률분포
        </p>
        <DistGrid dists={CONTINUOUS} tone="emerald" />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone: "amber" | "emerald";
  children: React.ReactNode;
}) {
  const baseCls = "rounded-xl border-2 px-5 py-2.5 text-sm font-bold transition";
  const inactiveCls = "border-white/12 bg-white/5 text-slate-400 hover:bg-white/10";
  const activeCls =
    tone === "amber"
      ? "border-amber-400/60 bg-amber-400/15 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.18)]"
      : "border-emerald-400/60 bg-emerald-400/15 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.18)]";
  return (
    <button type="button" onClick={onClick} className={`${baseCls} ${active ? activeCls : inactiveCls}`}>
      {children}
    </button>
  );
}

function DistGrid({ dists, tone }: { dists: Dist[]; tone: "amber" | "emerald" }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {dists.map((d) => (
        <DistCard key={d.name} dist={d} tone={tone} />
      ))}
    </div>
  );
}

function DistCard({ dist, tone }: { dist: Dist; tone: "amber" | "emerald" }) {
  const [open, setOpen] = useState(false);

  const accent = tone === "amber"
    ? { iconBg: "bg-amber-400/15", iconText: "text-amber-200", typeBadge: "border-amber-400/30 bg-amber-400/10 text-amber-200", borderLeft: "border-l-amber-400/60", exNum: "bg-amber-400/20 text-amber-200" }
    : { iconBg: "bg-emerald-400/15", iconText: "text-emerald-200", typeBadge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200", borderLeft: "border-l-emerald-400/60", exNum: "bg-emerald-400/20 text-emerald-200" };

  const cardBorder = dist.textbook
    ? tone === "amber"
      ? "border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
      : "border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
    : "border-white/10 hover:border-white/25";

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className={`group relative overflow-hidden rounded-2xl border-2 bg-white/[0.035] text-left transition hover:-translate-y-0.5 hover:bg-white/[0.055] ${cardBorder}`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl ${accent.iconBg}`}>
          {dist.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-slate-100">{dist.name}</p>
          <p className="text-xs text-slate-500">{dist.nameEn}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${accent.typeBadge}`}>
              {tone === "amber" ? "이산" : "연속"}
            </span>
            {dist.textbook ? (
              <span className="rounded-md border border-cyan-400/40 bg-cyan-400/15 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                교과서 ⭐
              </span>
            ) : null}
          </div>
        </div>
        <span className={`absolute right-3 top-4 text-sm text-slate-500 transition ${open ? "rotate-180" : ""}`}>▼</span>
      </div>

      <div
        className={`grid overflow-hidden px-4 transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={`rounded-lg border-l-4 bg-white/[0.04] px-3 py-2.5 text-sm leading-6 text-slate-300 ${accent.borderLeft}`}>
            {dist.desc}
          </div>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">📌 실생활 예시</p>
          <ul className="mt-1.5 space-y-1.5">
            {dist.examples.map((ex, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-6 text-slate-300">
                <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${accent.exNum}`}>
                  {i + 1}
                </span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </button>
  );
}
