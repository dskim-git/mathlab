export const dynamic = "force-dynamic";
export const revalidate = 0;

// /admin/sebteuk — 관리자도 AI 세특 작성. /teacher/sebteuk 의 admin 분기를
// admin 테마(violet)와 admin 사이드바로 노출하는 래핑.

import { requireTeacher } from "@/lib/auth/requireTeacher";
import { getCurrentSchoolYear } from "@/lib/settings/schoolYear";
import { getCurrentSemester } from "@/lib/settings/semester";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { getEnabledSebteukModels } from "@/lib/ai/enabledModels";
import { SebteukWorkflow } from "@/components/teacher/sebteuk/SebteukWorkflow";

export default async function AdminSebteukPage() {
  // requireTeacher 는 admin 도 통과시킴 — 같은 가드 재사용.
  const { supabase, user, profile } = await requireTeacher();
  // 안전망: admin 이 아닌데 들어왔으면 권한 안내.
  const isAdmin = profile.role === "admin";
  const theme = getRoleTheme("admin");
  const schoolYear = await getCurrentSchoolYear();
  const semester = await getCurrentSemester();
  const enabledModels = await getEnabledSebteukModels(supabase);

  if (!isAdmin) {
    return (
      <>
        <div className="mb-6">
          <p className={`text-sm font-semibold ${theme.accentText}`}>
            AI 세특 작성
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">권한이 없습니다</h1>
        </div>
        <div className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6 text-sm text-amber-100">
          관리자 전용 페이지입니다. 교사는 <code>/teacher/sebteuk</code> 을 사용해 주세요.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${theme.accentText}`}>
            AI 세특 작성
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            학생별 세특 초안 생성
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            전체 학생 대상으로 활동·성찰·옛 기록·설문을 입력으로 Claude API 가
            NEIS 형식 초안을 생성합니다. 관리자는 전체 학생 접근 + 모든 모델 사용
            가능.
          </p>
        </div>
        <a
          href="/teacher/sebteuk/list"
          className={`rounded-full border ${theme.accentBorder} ${theme.accentText} px-3 py-1.5 text-xs font-semibold hover:bg-white/5`}
        >
          📁 저장된 세특 보기
        </a>
      </div>

      <SebteukWorkflow
        teacherProfileId={user.id}
        teacherId={null}
        isAdmin={true}
        schoolYear={schoolYear}
        currentSemester={semester}
        accentText={theme.accentText}
        enabledModels={enabledModels}
      />
    </>
  );
}
