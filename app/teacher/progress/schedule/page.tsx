export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireTeacher } from "@/lib/auth/requireTeacher";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { getCurrentSchoolYear } from "@/lib/settings/schoolYear";
import { getCurrentSemester } from "@/lib/settings/semester";
import {
  ScheduleEditor,
  type EditorCourseRow,
  type WeeklySlot,
} from "@/components/teacher/progress/ScheduleEditor";

export default async function TeacherScheduleEditPage() {
  const { supabase, user, profile } = await requireTeacher();
  const isAdmin = profile.role === "admin";
  const theme = getRoleTheme("teacher");

  // 시간표는 학기마다 새로 짠다 — 현재 학년도·학기의 내 수업만 대상.
  const schoolYear = await getCurrentSchoolYear();
  const semester = await getCurrentSemester();
  const termLabel = `${schoolYear}학년도 ${semester}학기`;

  // courses RLS 가 담당 수업만 반환한다(관리자는 전체).
  const { data: courseRows } = await supabase
    .from("courses")
    .select("id, name, subject, grade, class_number")
    .eq("school_year", schoolYear)
    .eq("semester", semester)
    .order("grade", { nullsFirst: false })
    .order("class_number", { nullsFirst: false })
    .order("name");
  const courses = (courseRows ?? []) as EditorCourseRow[];

  const { data: slotRows } = await supabase
    .from("weekly_schedule")
    .select("id, day_of_week, course_id")
    .eq("teacher_id", user.id);

  const initialSlots = (slotRows ?? []) as WeeklySlot[];

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>
          요일 시간표
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {termLabel} 기본 시간표 설정
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          요일별로 어느 수업이 있는지 등록합니다. 등록된 (수업·요일) 칸은
          진도표에서 음영으로 표시되어 입력해야 할 자리를 알려줍니다. 특정 날의
          휴강·비고는 진도표 그 날 행에서 직접 처리합니다. 목록은 관리자가
          배정한 {termLabel} 담당 수업입니다.
        </p>
      </div>

      {isAdmin ? (
        <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 text-sm text-amber-200">
          관리자 계정에는 전체 수업이 보입니다. 시간표는 교사 본인 계정으로
          등록하세요.
        </div>
      ) : null}

      <ScheduleEditor
        teacherId={user.id}
        courses={courses}
        initialSlots={initialSlots}
        termLabel={termLabel}
      />
    </>
  );
}
