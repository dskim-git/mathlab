export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireTeacher } from "@/lib/auth/requireTeacher";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import {
  ScheduleEditor,
  type EditorClassRow,
  type WeeklySlot,
} from "@/components/teacher/progress/ScheduleEditor";

type TeacherPermissionRow = {
  grade: number;
  class_number: number;
  subject: string;
};

function sortClasses(rows: EditorClassRow[]): EditorClassRow[] {
  return [...rows].sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    if (a.class_number !== b.class_number)
      return a.class_number - b.class_number;
    return a.subject.localeCompare(b.subject, "ko");
  });
}

export default async function TeacherScheduleEditPage() {
  const { supabase, user, profile } = await requireTeacher();
  const isAdmin = profile.role === "admin";
  const theme = getRoleTheme("teacher");

  let classes: EditorClassRow[] = [];
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

  const { data: slotRows } = await supabase
    .from("weekly_schedule")
    .select("id, day_of_week, grade, class_number, subject")
    .eq("teacher_id", user.id);

  const initialSlots = (slotRows ?? []) as WeeklySlot[];

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>
          요일 시간표
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          학기 기본 시간표 설정
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          요일별로 어느 학반 수업이 있는지 등록합니다. 등록된 (학반·요일) 칸은
          진도표에서 음영으로 표시되어 입력해야 할 자리를 알려줍니다. 특정 날의
          휴강·비고는 진도표 그 날 행에서 직접 처리합니다.
        </p>
      </div>

      {isAdmin ? (
        <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 text-sm text-amber-200">
          관리자 계정은 본인 담당 학급이 없어 시간표 입력이 불가합니다. 교사
          계정으로 로그인해 사용하세요.
        </div>
      ) : null}

      <ScheduleEditor
        teacherId={user.id}
        classes={classes}
        initialSlots={initialSlots}
      />
    </>
  );
}
