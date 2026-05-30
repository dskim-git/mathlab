export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { requireTeacher } from "@/lib/auth/requireTeacher";
import { getCurrentSchoolYear } from "@/lib/settings/schoolYear";
import { buildTwoWeekDays, flattenWeeks } from "@/lib/dashboard/progressDates";
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
  searchParams: Promise<{ w?: string }>;
};

function parseWeekOffset(raw: string | undefined): number {
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return 0;
  // 안전 가드: ±26주(약 반년) 범위로만 이동
  if (n < -26) return -26;
  if (n > 26) return 26;
  return n;
}

export default async function TeacherProgressPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const weekOffset = parseWeekOffset(sp.w);

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

  // 2주치 평일 (오프셋 적용)
  const weeks = buildTwoWeekDays(new Date(), weekOffset);
  const flat = flattenWeeks(weeks);
  const dateIsos = flat.map((d) => d.iso);
  const firstIso = dateIsos[0];
  const lastIso = dateIsos[dateIsos.length - 1];

  // 진도 / 시간표 / 일자 메타 / 학반 오버라이드 병렬
  const [progressRes, weeklyRes, dayMetaRes, overrideRes] = isAdmin
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
    content: r.lesson_topic, // DB lesson_topic 컬럼을 통합 content 로 사용
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

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${theme.accentText}`}>진도표</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {weekOffset === 0
              ? "전주 · 이번 주 수업 진도"
              : `${weeks[0].label} ~ ${weeks[1].label}`}
          </h1>
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

      {/* 주 이동 컨트롤 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-xs">
        <Link
          href={`/teacher/progress?w=${weekOffset - 2}`}
          className={buttonClasses("neutral", { size: "sm" })}
        >
          « 2주 이전
        </Link>
        <Link
          href={`/teacher/progress?w=${weekOffset - 1}`}
          className={buttonClasses("neutral", { size: "sm" })}
        >
          ← 한 주 이전
        </Link>
        <Link
          href="/teacher/progress"
          className={
            weekOffset === 0
              ? `${buttonClasses("primary", { size: "sm" })}`
              : `${buttonClasses("secondary", { size: "sm" })}`
          }
        >
          🎯 오늘 (전주+이번주)
        </Link>
        <Link
          href={`/teacher/progress?w=${weekOffset + 1}`}
          className={buttonClasses("neutral", { size: "sm" })}
        >
          한 주 이후 →
        </Link>
        <Link
          href={`/teacher/progress?w=${weekOffset + 2}`}
          className={buttonClasses("neutral", { size: "sm" })}
        >
          2주 이후 »
        </Link>
        <span className="ml-auto text-slate-400">
          현재 보는 기간:{" "}
          <span className={`font-semibold ${theme.accentText}`}>
            {weeks[0].days[0].monthDay} ~ {weeks[1].days[4].monthDay}
          </span>
        </span>
      </div>

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
