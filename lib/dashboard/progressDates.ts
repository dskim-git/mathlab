// 진도표용 날짜 헬퍼. 전주(월~금) + 이번 주(월~금) = 평일 10일.
// 토/일은 제외. 시간대는 로컬(Asia/Seoul 가정) 기준.

const DAY_LABELS_KO = ["일", "월", "화", "수", "목", "금", "토"];

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay(); // 0=일, 1=월, ... 6=토
  const diff = (day + 6) % 7; // 월=0
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export type ProgressDay = {
  iso: string; // YYYY-MM-DD
  dayLabel: string; // 월/화/수/목/금
  monthDay: string; // 5/29
  isToday: boolean;
};

export type ProgressWeek = {
  label: string; // "이번 주" / "전 주"
  days: ProgressDay[];
};

/**
 * 오늘을 기준으로 2주 슬라이딩 윈도우 (월~금 × 2주).
 * weekOffset=0  → 전 주 + 이번 주 (기본)
 * weekOffset=1  → 이번 주 + 다음 주
 * weekOffset=2  → 다음 주 + 다다음 주
 * weekOffset=-1 → 전전 주 + 전 주
 * 라벨은 weekOffset=0일 때만 "전 주" / "이번 주" 친근하게, 그 외엔 주의 시작/끝 날짜.
 */
export function buildTwoWeekDays(
  now: Date = new Date(),
  weekOffset = 0
): ProgressWeek[] {
  const monThisActual = startOfWeekMonday(now); // 실제 이번 주 월요일
  // 보는 윈도우의 두 번째 주의 월요일 = 실제 이번 주 + weekOffset*7
  const monSecond = addDays(monThisActual, weekOffset * 7);
  const monFirst = addDays(monSecond, -7);
  const todayIso = toIsoDate(now);

  function buildWeek(monday: Date, fallbackLabel: string): ProgressWeek {
    const days: ProgressDay[] = [];
    for (let i = 0; i < 5; i++) {
      const d = addDays(monday, i);
      days.push({
        iso: toIsoDate(d),
        dayLabel: DAY_LABELS_KO[d.getDay()],
        monthDay: `${d.getMonth() + 1}/${d.getDate()}`,
        isToday: toIsoDate(d) === todayIso,
      });
    }
    // 절대 날짜 라벨 ("5/22 ~ 5/26")
    const first = days[0];
    const last = days[days.length - 1];
    const absoluteLabel = `${first.monthDay} ~ ${last.monthDay}`;
    return {
      label: fallbackLabel ? fallbackLabel : absoluteLabel,
      days,
    };
  }

  // 기본(0)일 때만 친근 라벨, 그 외 절대 날짜
  if (weekOffset === 0) {
    return [buildWeek(monFirst, "전 주"), buildWeek(monSecond, "이번 주")];
  }
  return [buildWeek(monFirst, ""), buildWeek(monSecond, "")];
}

export function flattenWeeks(weeks: ProgressWeek[]): ProgressDay[] {
  return weeks.flatMap((w) => w.days);
}
