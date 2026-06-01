export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { requireTeacher } from "@/lib/auth/requireTeacher";
import { getCurrentSchoolYear } from "@/lib/settings/schoolYear";
import {
  buildWeekRangeDays,
  buildMonthDays,
  flattenWeeks,
} from "@/lib/dashboard/progressDates";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { buttonClasses } from "@/components/ui/Button";
import {
  ProgressGrid,
  type ClassRow,
  type ProgressEntry,
  type WeeklySlotKey,
  type DailyMeta,
  type DailyClassOverride,
} from "@/components/teacher/progress/ProgressGrid";

type TeacherPermissionRow = {
  grade: number;
  class_number: number;
  subject: string;
};

type ProgressRow = {
  id: string;
  date: string;
  grade: number;
  class_number: number;
  subject: string;
  lesson_topic: string;
};

type WeeklyRow = {
  day_of_week: number;
  grade: number;
  class_number: number;
  subject: string;
};

type DailyMetaRow = {
  id: string;
  date: string;
  is_off: boolean;
  notes: string;
};

type OverrideRow = {
  id: string;
  date: string;
  grade: number;
  class_number: number;
  subject: string;
  action: "add" | "remove";
};

function sortClasses(rows: ClassRow[]): ClassRow[] {
  return [...rows].sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    if (a.class_number !== b.class_number)
      return a.class_number - b.class_number;
    return a.subject.localeCompare(b.subject, "ko");
  });
}

type PageProps = {
  searchParams: Promise<{
    w?: string;
    weeks?: string;
    view?: string;
    m?: string;
  }>;
};

function parseWeekOffset(raw: string | undefined): number {
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return 0;
  if (n < -26) return -26;
  if (n > 26) return 26;
  return n;
}

function parseWeeksCount(raw: string | undefined): number {
  if (!raw) return 2;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return 2;
  if (n < 1) return 1;
  if (n > 4) return 4;
  return n;
}

// "YYYY-MM" → {year, month(1-12)}. 잘못된 입력은 이번 달로 폴백.
function parseMonth(raw: string | undefined): { year: number; month: number } {
  const now = new Date();
  if (!raw) return { year: now.getFullYear(), month: now.getMonth() + 1 };
  const match = /^(\d{4})-(\d{1,2})$/.exec(raw);
  if (!match) return { year: now.getFullYear(), month: now.getMonth() + 1 };
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  return { year: y, month: m };
}

function shiftMonth(year: number, month: number, delta: number) {
  // month 는 1-12. JS Date 에 맡겨 자동 정규화.
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthParam(year: number, month: number) {
  return `${year}-${pad2(month)}`;
}

export default async function TeacherProgressPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const weekOffset = parseWeekOffset(sp.w);
  const weeksCount = parseWeeksCount(sp.weeks);
  const viewMode: "week" | "month" = sp.view === "month" ? "month" : "week";
  const { year, month } = parseMonth(sp.m);

  const { supabase, user, profile } = await requireTeacher();
  const isAdmin = profile.role === "admin";
  const theme = getRoleTheme("teacher");

  const schoolYear = await getCurrentSchoolYear();

  // 담당 학급
  let classes: ClassRow[] = [];
  if (!isAdmin) {
    const { data: teacherRow } = await supabase
      .from("teachers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (teacherRow) {
      const { data: permissions } = await supabase
        .from("teacher_permissions")
        .select("grade, class_number, subject")
        .eq("teacher_id", (teacherRow as { id: string }).id);

      classes = sortClasses(
        ((permissions ?? []) as TeacherPermissionRow[]).map((p) => ({
          grade: p.grade,
          class_number: p.class_number,
          subject: p.subject,
        }))
      );
    }
  }

  // 보는 윈도우의 날짜 묶음 — 주간(1~4주) 또는 월간.
  const weeks =
    viewMode === "month"
      ? buildMonthDays(year, month)
      : buildWeekRangeDays(new Date(), weekOffset, weeksCount);
  const flat = flattenWeeks(weeks);
  const dateIsos = flat.map((d) => d.iso);
  const firstIso = dateIsos[0] ?? "";
  const lastIso = dateIsos[dateIsos.length - 1] ?? "";

  // 진도 / 시간표 / 일자 메타 / 학반 오버라이드 병렬
  const [progressRes, weeklyRes, dayMetaRes, overrideRes] = isAdmin || !firstIso
    ? [
        { data: [] as ProgressRow[] },
        { data: [] as WeeklyRow[] },
        { data: [] as DailyMetaRow[] },
        { data: [] as OverrideRow[] },
      ]
    : await Promise.all([
        supabase
          .from("progress_tracker")
          .select(
            "id, date, grade, class_number, subject, lesson_topic"
          )
          .eq("teacher_id", user.id)
          .gte("date", firstIso)
          .lte("date", lastIso),
        supabase
          .from("weekly_schedule")
          .select("day_of_week, grade, class_number, subject")
          .eq("teacher_id", user.id),
        supabase
          .from("daily_schedule_meta")
          .select("id, date, is_off, notes")
          .eq("teacher_id", user.id)
          .gte("date", firstIso)
          .lte("date", lastIso),
        supabase
          .from("daily_class_overrides")
          .select("id, date, grade, class_number, subject, action")
          .eq("teacher_id", user.id)
          .gte("date", firstIso)
          .lte("date", lastIso),
      ]);

  const initialEntries: ProgressEntry[] = (
    (progressRes.data ?? []) as ProgressRow[]
  ).map((r) => ({
    id: r.id,
    date: r.date,
    grade: r.grade,
    class_number: r.class_number,
    subject: r.subject,
    content: r.lesson_topic,
  }));

  const initialWeeklySlots: WeeklySlotKey[] = (
    (weeklyRes.data ?? []) as WeeklyRow[]
  ).map((r) => ({
    day_of_week: r.day_of_week,
    grade: r.grade,
    class_number: r.class_number,
    subject: r.subject,
  }));

  const initialDayMeta: DailyMeta[] = (
    (dayMetaRes.data ?? []) as DailyMetaRow[]
  ).map((r) => ({
    id: r.id,
    date: r.date,
    isOff: r.is_off,
    notes: r.notes,
  }));

  const initialOverrides: DailyClassOverride[] = (
    (overrideRes.data ?? []) as OverrideRow[]
  ).map((r) => ({
    id: r.id,
    date: r.date,
    grade: r.grade,
    class_number: r.class_number,
    subject: r.subject,
    action: r.action,
  }));

  // 헤더 타이틀
  const headerTitle =
    viewMode === "month"
      ? `${year}년 ${month}월 수업 진도`
      : weekOffset === 0 && weeksCount === 2
      ? "전주 · 이번 주 수업 진도"
      : `${weeks[0]?.days[0]?.monthDay ?? ""} ~ ${
          weeks[weeks.length - 1]?.days.slice(-1)[0]?.monthDay ?? ""
        }`;

  // 주간 모드용 링크 쿼리 헬퍼
  const weekQS = (offset: number, count: number = weeksCount) => {
    const params = new URLSearchParams();
    if (offset !== 0) params.set("w", String(offset));
    if (count !== 2) params.set("weeks", String(count));
    const s = params.toString();
    return s ? `/teacher/progress?${s}` : `/teacher/progress`;
  };
  const monthQS = (y: number, m: number) =>
    `/teacher/progress?view=month&m=${monthParam(y, m)}`;
  const prevMonth = shiftMonth(year, month, -1);
  const nextMonth = shiftMonth(year, month, 1);
  const now = new Date();
  const thisMonth = { year: now.getFullYear(), month: now.getMonth() + 1 };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${theme.accentText}`}>진도표</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{headerTitle}</h1>
          <p className="mt-1 text-sm text-slate-400">
            행 = 일자, 열 = 담당 학반(과목). 음영 = 요일 시간표에 등록된 수업
            시간. 미래 주에 휴강·임시수업·진도 계획을 미리 표시할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/teacher/progress/schedule"
            className={buttonClasses("secondary", { size: "sm" })}
          >
            ⚙ 시간표 설정
          </Link>
          <Link
            href="/teacher/progress/history"
            className={buttonClasses("neutral", { size: "sm" })}
          >
            📜 과거 기록
          </Link>
        </div>
      </div>

      {/* 보기 모드 토글 + 주간 기간 선택 */}
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-xs">
        <span className="text-slate-400">보기</span>
        <Link
          href={weekQS(0, weeksCount)}
          className={
            viewMode === "week"
              ? buttonClasses("primary", { size: "sm" })
              : buttonClasses("neutral", { size: "sm" })
          }
        >
          주간
        </Link>
        <Link
          href={monthQS(thisMonth.year, thisMonth.month)}
          className={
            viewMode === "month"
              ? buttonClasses("primary", { size: "sm" })
              : buttonClasses("neutral", { size: "sm" })
          }
        >
          월간
        </Link>

        {viewMode === "week" ? (
          <>
            <span className="ml-3 text-slate-400">기간</span>
            {[1, 2, 3, 4].map((c) => (
              <Link
                key={c}
                href={weekQS(weekOffset, c)}
                className={
                  weeksCount === c
                    ? buttonClasses("primary", { size: "sm" })
                    : buttonClasses("neutral", { size: "sm" })
                }
              >
                {c}주
              </Link>
            ))}
          </>
        ) : null}
      </div>

      {/* 이동 컨트롤 — 주간/월간 분기 */}
      {viewMode === "week" ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-xs">
          <Link
            href={weekQS(weekOffset - weeksCount)}
            className={buttonClasses("neutral", { size: "sm" })}
          >
            « {weeksCount}주 이전
          </Link>
          <Link
            href={weekQS(weekOffset - 1)}
            className={buttonClasses("neutral", { size: "sm" })}
          >
            ← 한 주 이전
          </Link>
          <Link
            href={weekQS(0)}
            className={
              weekOffset === 0
                ? buttonClasses("primary", { size: "sm" })
                : buttonClasses("secondary", { size: "sm" })
            }
          >
            🎯 오늘 기준
          </Link>
          <Link
            href={weekQS(weekOffset + 1)}
            className={buttonClasses("neutral", { size: "sm" })}
          >
            한 주 이후 →
          </Link>
          <Link
            href={weekQS(weekOffset + weeksCount)}
            className={buttonClasses("neutral", { size: "sm" })}
          >
            {weeksCount}주 이후 »
          </Link>
          <span className="ml-auto text-slate-400">
            현재 보는 기간:{" "}
            <span className={`font-semibold ${theme.accentText}`}>
              {weeks[0]?.days[0]?.monthDay ?? "-"} ~{" "}
              {weeks[weeks.length - 1]?.days.slice(-1)[0]?.monthDay ?? "-"}
            </span>
          </span>
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-xs">
          <Link
            href={monthQS(prevMonth.year, prevMonth.month)}
            className={buttonClasses("neutral", { size: "sm" })}
          >
            ← {prevMonth.year}년 {prevMonth.month}월
          </Link>
          <Link
            href={monthQS(thisMonth.year, thisMonth.month)}
            className={
              year === thisMonth.year && month === thisMonth.month
                ? buttonClasses("primary", { size: "sm" })
                : buttonClasses("secondary", { size: "sm" })
            }
          >
            🎯 이번 달
          </Link>
          <Link
            href={monthQS(nextMonth.year, nextMonth.month)}
            className={buttonClasses("neutral", { size: "sm" })}
          >
            {nextMonth.year}년 {nextMonth.month}월 →
          </Link>
          <span className="ml-auto text-slate-400">
            평일{" "}
            <span className={`font-semibold ${theme.accentText}`}>
              {flat.length}일
            </span>
          </span>
        </div>
      )}

      {isAdmin ? (
        <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 text-sm text-amber-200">
          관리자 계정에는 담당 학급이 없어 진도표 입력이 불가합니다. 교사 본인
          계정으로 로그인해 사용하세요.
        </div>
      ) : null}

      <ProgressGrid
        teacherId={user.id}
        schoolYear={schoolYear}
        classes={classes}
        weeks={weeks}
        initialEntries={initialEntries}
        initialWeeklySlots={initialWeeklySlots}
        initialDayMeta={initialDayMeta}
        initialOverrides={initialOverrides}
      />
    </>
  );
}
