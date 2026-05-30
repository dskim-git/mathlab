export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireTeacher } from "@/lib/auth/requireTeacher";
import { getCurrentSchoolYear } from "@/lib/settings/schoolYear";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { SebteukList } from "@/components/teacher/sebteuk/SebteukList";

export default async function TeacherSebteukListPage() {
  const { supabase, user, profile } = await requireTeacher();
  const isAdmin = profile.role === "admin";
  const theme = getRoleTheme("teacher");
  const schoolYear = await getCurrentSchoolYear();

  // 권한 게이트 — ai_sebteuk_enabled 인 교사 또는 관리자만
  let enabled = isAdmin;
  if (!isAdmin) {
    const { data: tRow } = await supabase
      .from("teachers")
      .select("ai_sebteuk_enabled")
      .eq("profile_id", user.id)
      .maybeSingle();
    const t = tRow as { ai_sebteuk_enabled: boolean } | null;
    enabled = !!t?.ai_sebteuk_enabled;
  }

  if (!enabled) {
    return (
      <>
        <div className="mb-6">
          <p className={`text-sm font-semibold ${theme.accentText}`}>
            저장된 세특
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">권한이 없습니다</h1>
        </div>
        <div className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6 text-sm text-amber-100">
          이 페이지는 AI세특 사용 권한이 있는 교사만 볼 수 있습니다.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>
          저장된 세특
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          본인이 저장한 세특 초안 모음
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          학년·반·번호 순으로 정렬되어 NEIS 입력에 그대로 사용할 수 있습니다.
          학반 단위 일괄 복사도 가능합니다.
        </p>
      </div>

      <SebteukList
        teacherProfileId={user.id}
        schoolYear={schoolYear}
        accentText={theme.accentText}
      />
    </>
  );
}
