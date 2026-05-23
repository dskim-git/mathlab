export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import TeacherRecordRow, {
  TeacherRecordRowData,
} from "@/components/teacher/TeacherRecordRow";

type TeacherRecordsPageProps = {
  searchParams: Promise<{
    grade?: string;
    classNumber?: string;
    subject?: string;
  }>;
};

const GRADE_OPTIONS = [1, 2, 3];
const CLASS_OPTIONS = Array.from({ length: 15 }, (_, index) => index + 1);

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
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-cyan-300">교사용 대시보드</p>

        <h1 className="mt-3 text-3xl font-bold">학급별 활동 기록 조회</h1>

        <p className="mt-4 leading-7 text-slate-300">
          학년과 반을 선택하면 해당 학급 학생들이 제출한 활동 기록(
          <span className="font-semibold text-cyan-200">activity_responses</span>
          )을 학생 로그인 기반으로 모아 봅니다. (세션과 무관하게 누적됩니다)
        </p>

        <form
          method="get"
          action="/teacher/records"
          className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="grade"
                className="block text-sm font-semibold text-slate-200"
              >
                학년
              </label>
              <select
                id="grade"
                name="grade"
                defaultValue={gradeValue ?? ""}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              >
                <option value="">선택</option>
                {GRADE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}학년
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="classNumber"
                className="block text-sm font-semibold text-slate-200"
              >
                반
              </label>
              <select
                id="classNumber"
                name="classNumber"
                defaultValue={classValue ?? ""}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              >
                <option value="">선택</option>
                {CLASS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}반
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-semibold text-slate-200"
              >
                과목 (선택)
              </label>
              <input
                id="subject"
                name="subject"
                defaultValue={subjectValue}
                placeholder="예: 확률과 통계"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                조회하기
              </button>
            </div>
          </div>
        </form>

        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          {!hasFilter ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-slate-950 p-6 text-slate-300">
              학년과 반을 선택한 뒤 조회하기를 누르면 해당 학급의 활동 기록이
              표시됩니다.
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
              기록을 불러오지 못했습니다: {loadError}
            </div>
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
                <div className="mt-5 overflow-x-auto">
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
              )}
            </>
          )}
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/teacher"
            className="rounded-full border border-white/20 px-5 py-3 font-semibold transition hover:bg-white/10"
          >
            교사 대시보드로
          </Link>
        </div>
      </section>
    </main>
  );
}
