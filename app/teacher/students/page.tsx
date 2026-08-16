"use client";

// /teacher/students — 담당 교사가 본인 학급 학생의 옛+새 성찰 조회.
// students RLS 가 자동으로 담당 학급만 노출 (teacher_has_class 정책).
// admin 도 통과 (슈퍼유저) — 다만 admin 은 /admin/students 사용 권장.

import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { StudentsExplorer } from "@/components/students/StudentsExplorer";

export default function TeacherStudentsPage() {
  const theme = getRoleTheme("teacher");
  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>학생</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">학생 활동 기록</h1>
        <p className="mt-1 text-sm text-slate-400">
          수업을 골라 그 수강생의 성찰을 봅니다. 옛 앱(Streamlit) 이식 성찰과 새 앱
          성찰이 한 화면에 함께 나옵니다.
        </p>
      </div>
      <StudentsExplorer accentText={theme.accentText} />
    </>
  );
}
