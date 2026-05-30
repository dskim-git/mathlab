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
  ClassRow,
  WeeklySlotKey,
  DailyClassOverride,
} from "@/components/teacher/progress/ProgressGrid";

type ProgressRow = {
  id: string;
  date: string;
  grade: number;
  class_number: number;
  subject: string;
  lesson_topic: string;
};

type DailyMetaRow = {
  date: string;
  is_off: boolean;
  notes: string;
};

type TeacherPermissionRow = {
  grade: number;
  class_number: number;
  subject: string;
};

type WeeklyRow = {
  day_of_week: number;
  grade: number;
  class_number: number;
  subject: string;
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

export default async function TeacherProgressHistoryPage() {
  const { supabase, user, profile } = await requireTeacher();
  const isAdmin = profile.role === "admin";
  const theme = getRoleTheme("teacher");
  const schoolYear = await getCurrentSchoolYear();

  let entries: HistoryEntry[] = [];
  let dayMeta: HistoryDayMeta[] = [];
  let classes: ClassRow[] = [];
  let weeklySlots: WeeklySlotKey[] = [];
  let overrides: DailyClassOverride[] = [];

  if (!isAdmin) {
    // 진도 + 일자 메타 + 음영용 weekly_schedule/daily_class_overrides 병렬
    const [progressRes, dayMetaRes, weeklyRes, overrideRes] = await Promise.all(
      [
        supabase
          .from("progress_tracker")
          .select("id, date, grade, class_number, subject, lesson_topic")
          .eq("teacher_id", user.id)
          .order("date", { ascending: false }),
        supabase
          .from("daily_schedule_meta")
          .select("date, is_off, notes")
          .eq("teacher_id", user.id)
          .order("date", { ascending: false }),
        supabase
          .from("weekly_schedule")
          .select("day_of_week, grade, class_number, subject")
          .eq("teacher_id", user.id),
        supabase
          .from("daily_class_overrides")
          .select("id, date, grade, class_number, subject, action")
          .eq("teacher_id", user.id),
      ]
    );

    entries = ((progressRes.data ?? []) as ProgressRow[]).map((r) => ({
      id: r.id,
      date: r.date,
      grade: r.grade,
      class_number: r.class_number,
      subject: r.subject,
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
      grade: r.grade,
      class_number: r.class_number,
      subject: r.subject,
      action: r.action,
    }));

    // 담당 학급 (편집 모드 학반 컬럼 합집합용)
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
        classes={classes}
        entries={entries}
        dayMeta={dayMeta}
        weeklySlots={weeklySlots}
        overrides={overrides}
      />
    </>
  );
}
