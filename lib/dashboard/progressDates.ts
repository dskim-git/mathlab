// 진도표용 날짜 헬퍼. 전주(월~금) + 이번 주(월~금) = 평일 10일.
// 토/일은 제외. 시간대는 로컬(Asia/Seoul 가정) 기준.
//
// 서버 사이드(Vercel Functions)에서 호출 시 Node 런타임의 TZ env var 가
// `Asia/Seoul` 로 설정되어 있어야 정확하다. Vercel: Settings → Environment
// Variables 에서 TZ=Asia/Seoul 추가. (로컬 dev 는 한국 PC 기본값이라 보통 OK)

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

/** 이번 주 월요일 00:00 (로컬 타임존). KPI/카운트의 "이번 주" 시작 시각. */
export function startOfThisWeekMonday(now: Date = new Date()): Date {
  return startOfWeekMonday(now);
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

/**
 * count 주(1~4) 만큼 평일 윈도우를 만든다.
 * 윈도우의 마지막 주 = 현재 이번 주 + weekOffset*7 (buildTwoWeekDays 와 동일 의미).
 * 가장 앞 (count-1)개 주는 자동으로 이전 주들.
 * count=2 + offset=0 인 특수 케이스만 옛 친근 라벨("전 주"/"이번 주") 유지(브래드크럼·헤더 호환).
 */
export function buildWeekRangeDays(
  now: Date = new Date(),
  weekOffset: number = 0,
  count: number = 2
): ProgressWeek[] {
  const safeCount = Math.max(1, Math.min(count, 12));
  const monThisActual = startOfWeekMonday(now);
  const monLast = addDays(monThisActual, weekOffset * 7);
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
    const first = days[0];
    const last = days[days.length - 1];
    const absoluteLabel = `${first.monthDay} ~ ${last.monthDay}`;
    return { label: fallbackLabel || absoluteLabel, days };
  }

  const out: ProgressWeek[] = [];
  for (let i = safeCount - 1; i >= 0; i--) {
    const monday = addDays(monLast, -i * 7);
    const friendly =
      weekOffset === 0 && safeCount === 2
        ? i === 1
          ? "전 주"
          : "이번 주"
        : "";
    out.push(buildWeek(monday, friendly));
  }
  return out;
}

/**
 * 한 달(year-month, 1-base month) 의 평일(월~금) 묶음.
 * 월요일이 그 달 시작 전이면 잘라서 그 달 첫 평일부터; 마찬가지로 끝 처리.
 * 헤더 라벨 = "YYYY년 M월 1주"/"2주" ...
 */
export function buildMonthDays(year: number, month: number): ProgressWeek[] {
  const today = new Date();
  const todayIso = toIsoDate(today);
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999); // 마지막 날

  // 첫 평일이 속한 주의 월요일부터 5일씩 끊되 month 안의 평일만 days 에 포함.
  const mondays: Date[] = [];
  // monthStart 가 속한 주의 월요일.
  let cursor = startOfWeekMonday(monthStart);
  while (cursor <= monthEnd) {
    mondays.push(new Date(cursor));
    cursor = addDays(cursor, 7);
  }

  const weeks: ProgressWeek[] = [];
  mondays.forEach((monday, idx) => {
    const days: ProgressDay[] = [];
    for (let i = 0; i < 5; i++) {
      const d = addDays(monday, i);
      // 해당 월에 속하는 평일만.
      if (
        d.getFullYear() === year &&
        d.getMonth() + 1 === month
      ) {
        days.push({
          iso: toIsoDate(d),
          dayLabel: DAY_LABELS_KO[d.getDay()],
          monthDay: `${d.getMonth() + 1}/${d.getDate()}`,
          isToday: toIsoDate(d) === todayIso,
        });
      }
    }
    if (days.length === 0) return;
    weeks.push({ label: `${year}년 ${month}월 ${idx + 1}주`, days });
  });
  return weeks;
}
