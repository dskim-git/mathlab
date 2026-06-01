// 학생 게이미피케이션 — 별도 DB 테이블 없이 activity_visits/activity_responses 의
// 일자·카운트로 스트릭·배지·주간 목표를 계산한다(클라이언트 집계).

import { startOfThisWeekMonday, toIsoDate } from "@/lib/dashboard/progressDates";

/** 활동 방문 일자 집합(중복 제거)에서 오늘부터 거꾸로 연속된 날 수. */
export function computeStreak(visitDates: Iterable<string>): number {
  const set = new Set(visitDates);
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 400; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = toIsoDate(d);
    if (set.has(iso)) {
      streak += 1;
    } else if (i === 0) {
      // 오늘 방문 없으면 streak 0 (어제까지의 연속을 보여줘도 좋지만 일관성 위해 오늘 포함만).
      // → 어제까지 이어진 streak 도 보고 싶다면 i===0 케이스 break 대신 continue.
      // 기본은 오늘 visit 있어야 streak 카운트.
      break;
    } else {
      break;
    }
  }
  return streak;
}

/** 이번 주(월요일~) 방문 카운트(중복 일자도 다 카운트). */
export function computeWeeklyVisits(visitDates: Iterable<string>): number {
  const monday = startOfThisWeekMonday();
  const mondayIso = toIsoDate(monday);
  let n = 0;
  for (const d of visitDates) {
    if (d >= mondayIso) n += 1;
  }
  return n;
}

/** 배지 정의 — 누적/연속 조건. earned 여부는 호출자가 계산. */
export type BadgeDef = {
  key: string;
  emoji: string;
  label: string;
  description: string;
  /** 진척 표시용 — (current, threshold). current >= threshold 면 획득. */
  threshold: number;
  domain: "visits" | "reflections" | "streak";
};

export const BADGES: BadgeDef[] = [
  // 활동(visits) — 마일스톤
  { key: "v1", emoji: "🌱", label: "첫 발걸음", description: "첫 활동 시작", threshold: 1, domain: "visits" },
  { key: "v10", emoji: "🌿", label: "꾸준한 학습자", description: "활동 10회", threshold: 10, domain: "visits" },
  { key: "v50", emoji: "🌳", label: "탐구자", description: "활동 50회", threshold: 50, domain: "visits" },
  { key: "v100", emoji: "🏔️", label: "도전자", description: "활동 100회", threshold: 100, domain: "visits" },
  // 성찰(responses) — 마일스톤
  { key: "r1", emoji: "✍️", label: "첫 성찰", description: "첫 성찰 제출", threshold: 1, domain: "reflections" },
  { key: "r10", emoji: "📓", label: "성찰러", description: "성찰 10개", threshold: 10, domain: "reflections" },
  { key: "r50", emoji: "📚", label: "기록의 달인", description: "성찰 50개", threshold: 50, domain: "reflections" },
  // 스트릭
  { key: "s7", emoji: "🔥", label: "한 주 연속", description: "7일 연속 학습", threshold: 7, domain: "streak" },
  { key: "s30", emoji: "🔥🔥", label: "한 달 연속", description: "30일 연속 학습", threshold: 30, domain: "streak" },
];

export type BadgeProgress = {
  def: BadgeDef;
  current: number;
  earned: boolean;
};

/** 누적치 3개를 받아 모든 배지의 획득/진척 상태 산출. */
export function computeBadgeProgress(stats: {
  visits: number;
  reflections: number;
  streak: number;
}): BadgeProgress[] {
  return BADGES.map((def) => {
    const current =
      def.domain === "visits"
        ? stats.visits
        : def.domain === "reflections"
        ? stats.reflections
        : stats.streak;
    return { def, current, earned: current >= def.threshold };
  });
}

/** 기본 주간 목표 — 후속에 학생 본인 설정 가능. 지금은 고정. */
export const DEFAULT_WEEKLY_GOAL = 5;
