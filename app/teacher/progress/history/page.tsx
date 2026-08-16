export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireTeacher } from "@/lib/auth/requireTeacher";
import { getCurrentSchoolYear } from "@/lib/settings/schoolYear";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import {
  HistoryView,
  type HistoryEntry,
  type HistoryDayMeta,
} from "@/components/teacher/progress/HistoryView";
import type {
  CourseRow,
  WeeklySlotKey,
  DailyClassOverride,
} from "@/components/teacher/progress/ProgressGrid";

type ProgressRow = {
  id: string;
  date: string;
  course_id: string | null;
  lesson_topic: string;
};

type DailyMetaRow = {
  date: string;
  is_off: boolean;
  notes: string;
};

type WeeklyRow = {
  day_of_week: number;
  course_id: string | null;
};

type OverrideRow = {
  id: string;
  date: string;
  course_id: string | null;
  action: "add" | "remove";
};

export default async function TeacherProgressHistoryPage() {
  const { supabase, user, profile } = await requireTeacher();
  const isAdmin = profile.role === "admin";
  const theme = getRoleTheme("teacher");
  const schoolYear = await getCurrentSchoolYear();

  let entries: HistoryEntry[] = [];
  let dayMeta: HistoryDayMeta[] = [];
  let courses: CourseRow[] = [];
  let weeklySlots: WeeklySlotKey[] = [];
  let overrides: DailyClassOverride[] = [];

  if (!isAdmin) {
    // 진도 + 일자 메타 + 음영용 weekly_schedule/daily_class_overrides 병렬
    const [progressRes, dayMetaRes, weeklyRes, overrideRes] = await Promise.all(
      [
        supabase
          .from("progress_tracker")
          .select("id, date, course_id, lesson_topic")
          .eq("teacher_id", user.id)
          .order("date", { ascending: false }),
        supabase
          .from("daily_schedule_meta")
          .select("date, is_off, notes")
          .eq("teacher_id", user.id)
          .order("date", { ascending: false }),
        supabase
          .from("weekly_schedule")
          .select("day_of_week, course_id")
          .eq("teacher_id", user.id),
        supabase
          .from("daily_class_overrides")
          .select("id, date, course_id, action")
          .eq("teacher_id", user.id),
      ]
    );

    entries = ((progressRes.data ?? []) as ProgressRow[]).map((r) => ({
      id: r.id,
      date: r.date,
      course_id: r.course_id,
      content: r.lesson_topic,
    }));
    dayMeta = ((dayMetaRes.data ?? []) as DailyMetaRow[]).map((r) => ({
      date: r.date,
      isOff: r.is_off,
      notes: r.notes,
    }));
    weeklySlots = (weeklyRes.data ?? []) as WeeklyRow[];
    overrides = ((overrideRes.data ?? []) as OverrideRow[]).map((r) => ({
      id: r.id,
      date: r.date,
      course_id: r.course_id,
      action: r.action,
    }));

    // 담당 수업 — 과거 기록도 함께 보므로 학기를 가리지 않고 내 수업 전체를 컬럼 후보로.
    const { data: courseRows } = await supabase
      .from("courses")
      .select("id, name, subject, grade, class_number")
      .order("school_year", { ascending: false })
      .order("semester", { ascending: false })
      .order("grade", { nullsFirst: false })
      .order("class_number", { nullsFirst: false })
      .order("name");
    courses = (courseRows ?? []) as CourseRow[];
  }

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>
          진도표 · 과거 기록
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          지난 모든 수업 진도
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          저장된 모든 진도와 일자 비고를 월별로 모아 봅니다. 편집 모드를 켜면
          진도표 페이지와 같은 방식으로 과거 기록도 추가·수정·삭제할 수 있습니다.
        </p>
      </div>

      {isAdmin ? (
        <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 text-sm text-amber-200">
          관리자 계정에는 본인 진도 데이터가 없습니다.
        </div>
      ) : null}

      <HistoryView
        teacherId={user.id}
        schoolYear={schoolYear}
        courses={courses}
        entries={entries}
        dayMeta={dayMeta}
        weeklySlots={weeklySlots}
        overrides={overrides}
      />
    </>
  );
}
