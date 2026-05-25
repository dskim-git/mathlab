export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { requireTeacher } from "@/lib/auth/requireTeacher";
import TeacherRecordRow, {
  TeacherRecordRowData,
} from "@/components/teacher/TeacherRecordRow";
import TeacherClassPicker from "@/components/teacher/TeacherClassPicker";
import TeacherRecordCard from "@/components/teacher/TeacherRecordCard";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

type TeacherRecordsPageProps = {
  searchParams: Promise<{
    grade?: string;
    classNumber?: string;
    subject?: string;
  }>;
};

function toPositiveInt(value: string | undefined): number | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export default async function TeacherRecordsPage({
  searchParams,
}: TeacherRecordsPageProps) {
  const { grade, classNumber, subject } = await searchParams;

  const gradeValue = toPositiveInt(grade);
  const classValue = toPositiveInt(classNumber);
  const subjectValue = subject?.trim() ?? "";
  const hasFilter = gradeValue !== null && classValue !== null;

  // 승인된 교사/관리자만 통과 + 그 사용자 신원으로 조회하는 서버 클라이언트.
  const { supabase, profile } = await requireTeacher();

  // 담당 학급 권한을 RLS로 조회(교사=본인, 관리자=전체) → 픽커에 props로 전달.
  const { data: permissionRows } = await supabase
    .from("teacher_permissions")
    .select("subject, grade, class_number")
    .order("grade", { ascending: true })
    .order("class_number", { ascending: true });

  const permissions = (permissionRows ?? []) as {
    subject: string | null;
    grade: number;
    class_number: number;
  }[];

  let records: TeacherRecordRowData[] = [];
  let loadError = "";

  if (hasFilter) {
    let query = supabase
      .from("activity_responses")
      .select(
        "id, student_code, student_number, grade, class_number, subject, activity_slug, reflection_data, response_data, created_at, activities ( title ), students ( profiles ( name ) )"
      )
      .eq("grade", gradeValue)
      .eq("class_number", classValue)
      .order("created_at", { ascending: false });

    if (subjectValue) {
      query = query.eq("subject", subjectValue);
    }

    const { data, error } = await query;

    if (error) {
      loadError = error.message;
    } else {
      records = (data ?? []) as unknown as TeacherRecordRowData[];
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-6xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan-300">교사용 대시보드</p>

        <h1 className="mt-3 text-3xl font-bold">학급별 활동 기록 조회</h1>

        <p className="mt-4 leading-7 text-slate-300">
          학년과 반을 선택하면 해당 학급 학생들이 제출한 활동 기록(
          <span className="font-semibold text-cyan-200">activity_responses</span>
          )을 학생 로그인 기반으로 모아 봅니다. (세션과 무관하게 누적됩니다)
        </p>

        <TeacherClassPicker
          permissions={permissions}
          teacherName={profile.name}
          selectedGrade={gradeValue}
          selectedClassNumber={classValue}
        />

        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          {!hasFilter ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-slate-950 p-6 text-slate-300">
              위에서 담당 학급을 선택하면 해당 학급의 활동 기록이 표시됩니다.
            </div>
          ) : loadError ? (
            <Alert tone="error">기록을 불러오지 못했습니다: {loadError}</Alert>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">
                  {gradeValue}학년 {classValue}반
                  {subjectValue ? ` · ${subjectValue}` : ""} 활동 기록{" "}
                  <span className="text-base font-semibold text-slate-400">
                    ({records.length}개)
                  </span>
                </h2>
              </div>

              {records.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-white/20 bg-slate-950 p-6 text-slate-300">
                  해당 조건으로 저장된 활동 기록이 없습니다.
                </div>
              ) : (
                <>
                  <div className="mt-5 hidden overflow-x-auto lg:block">
                    <table className="w-full min-w-[920px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-slate-300">
                          <th className="py-3 pr-4">이름</th>
                          <th className="py-3 pr-4">학번</th>
                          <th className="py-3 pr-4">활동</th>
                          <th className="py-3 pr-4">과목</th>
                          <th className="py-3 pr-4">제출 시각</th>
                          <th className="py-3 pr-4">성찰 미리보기</th>
                        </tr>
                      </thead>

                      <tbody>
                        {records.map((row) => (
                          <TeacherRecordRow key={row.id} row={row} />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 space-y-4 lg:hidden">
                    {records.map((row) => (
                      <TeacherRecordCard key={row.id} row={row} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/teacher" className={buttonClasses("neutral")}>
            교사 대시보드로
          </Link>
        </div>
      </Card>
    </main>
  );
}
