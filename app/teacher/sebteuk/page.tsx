export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireTeacher } from "@/lib/auth/requireTeacher";
import { getCurrentSchoolYear } from "@/lib/settings/schoolYear";
import { getCurrentSemester } from "@/lib/settings/semester";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import {
  getEnabledSebteukModels,
  getEnabledSebteukModelsForTeacher,
} from "@/lib/ai/enabledModels";
import { SebteukWorkflow } from "@/components/teacher/sebteuk/SebteukWorkflow";

export default async function TeacherSebteukPage() {
  const { supabase, user, profile } = await requireTeacher();
  const isAdmin = profile.role === "admin";
  const theme = getRoleTheme("teacher");
  const schoolYear = await getCurrentSchoolYear();
  const semester = await getCurrentSemester();
  // 관리자: 글로벌 그대로 / 교사: 글로벌 ∩ 본인 허용
  const enabledModels = isAdmin
    ? await getEnabledSebteukModels(supabase)
    : await getEnabledSebteukModelsForTeacher(supabase, user.id);

  // 권한 게이트: ai_sebteuk_enabled 인 교사 또는 관리자만 통과
  let teacherId: string | null = null;
  let enabled = false;
  if (!isAdmin) {
    const { data: tRow } = await supabase
      .from("teachers")
      .select("id, ai_sebteuk_enabled")
      .eq("profile_id", user.id)
      .maybeSingle();
    const t = tRow as
      | { id: string; ai_sebteuk_enabled: boolean }
      | null;
    teacherId = t?.id ?? null;
    enabled = !!t?.ai_sebteuk_enabled;
  } else {
    enabled = true;
  }

  if (!enabled) {
    return (
      <>
        <div className="mb-6">
          <p className={`text-sm font-semibold ${theme.accentText}`}>
            AI 세특 작성
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">권한이 없습니다</h1>
        </div>
        <div className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6 text-sm text-amber-100">
          AI 세특 작성 기능은 관리자가 별도 승인한 교사만 사용할 수 있습니다.
          관리자에게 권한 요청을 보내주세요. (관리자 화면: 교과 권한 › AI세특
          사용 권한)
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
            학생의 활동·성찰을 입력으로 Claude API 가 NEIS 형식 초안을
            생성합니다. 교사가 직접 검토·편집한 뒤 저장하세요. 기록에 없는
            내용은 환각 방지를 위해 추가되지 않습니다.
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
        teacherId={teacherId}
        isAdmin={isAdmin}
        schoolYear={schoolYear}
        currentSemester={semester}
        accentText={theme.accentText}
        enabledModels={enabledModels}
      />
    </>
  );
}
