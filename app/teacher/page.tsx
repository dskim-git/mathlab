export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { requireTeacher } from "@/lib/auth/requireTeacher";
import { formatKoreanDateTime } from "@/lib/dateTime";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { NoticeBoard } from "@/components/notices/NoticeBoard";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

type TeacherPermissionRow = {
  grade: number;
  class_number: number;
  subject: string;
};

type RecentResponseRow = {
  id: string;
  created_at: string;
  activity_slug: string | null;
  subject: string | null;
  session_id: string;
  activities: { title: string | null } | null;
};

export default async function TeacherHomePage() {
  const { supabase, user, profile } = await requireTeacher();
  const isAdmin = profile.role === "admin";
  const theme = getRoleTheme("teacher");

  // AI세특 권한 여부 — 관리자는 무조건 활성, 교사는 ai_sebteuk_enabled 확인
  let aiSebteukEnabled = isAdmin;
  if (!isAdmin) {
    const { data: tRow } = await supabase
      .from("teachers")
      .select("ai_sebteuk_enabled")
      .eq("profile_id", user.id)
      .maybeSingle();
    const t = tRow as { ai_sebteuk_enabled: boolean } | null;
    aiSebteukEnabled = !!t?.ai_sebteuk_enabled;
  }

  // === 카운트들 (병렬) ===
  // 1) 본인 세션(관리자=전체) — 전체 / 진행 중
  const baseSessionQuery = isAdmin
    ? supabase.from("sessions").select("id, is_active")
    : supabase.from("sessions").select("id, is_active").eq("created_by", user.id);

  // 2) 담당 학급(관리자는 표시 의미 약함, 0건 폴백)
  const permissionsQuery = isAdmin
    ? Promise.resolve({ data: [] as TeacherPermissionRow[] })
    : (async () => {
        const { data: teacherRow } = await supabase
          .from("teachers")
          .select("id")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (!teacherRow) return { data: [] as TeacherPermissionRow[] };
        const { data } = await supabase
          .from("teacher_permissions")
          .select("grade, class_number, subject")
          .eq("teacher_id", (teacherRow as { id: string }).id);
        return { data: (data ?? []) as TeacherPermissionRow[] };
      })();

  // 3) 본인 세션에 들어온 활동 응답 수 — 세션 ID 모은 뒤 in()
  const sessionsRes = await baseSessionQuery;
  const sessionRows = (sessionsRes.data ?? []) as {
    id: string;
    is_active: boolean;
  }[];
  const totalSessions = sessionRows.length;
  const activeSessions = sessionRows.filter((s) => s.is_active).length;

  // 4) 응답 수·최근 응답 — 세션 id 가 있을 때만
  const sessionIds = sessionRows.map((s) => s.id);

  const [responsesCountRes, recentResponsesRes, permRes] = await Promise.all([
    sessionIds.length > 0
      ? supabase
          .from("activity_responses")
          .select("id", { count: "exact", head: true })
          .in("session_id", sessionIds)
      : Promise.resolve({ count: 0, error: null } as {
          count: number;
          error: null;
        }),
    sessionIds.length > 0
      ? supabase
          .from("activity_responses")
          .select(
            "id, created_at, activity_slug, subject, session_id, activities ( title )"
          )
          .in("session_id", sessionIds)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null } as {
          data: RecentResponseRow[];
          error: null;
        }),
    permissionsQuery,
  ]);

  const responsesCount = (responsesCountRes as { count: number }).count ?? 0;
  const recentResponses = (recentResponsesRes.data ?? []) as RecentResponseRow[];
  const permissions = (permRes.data ?? []) as TeacherPermissionRow[];
  const classCount = new Set(
    permissions.map((p) => `${p.grade}-${p.class_number}`)
  ).size;

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>
          교사 대시보드
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {profile.name} {isAdmin ? "관리자" : "선생님"}, 안녕하세요 👋
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {isAdmin
            ? "관리자 계정으로 교사 화면을 보고 있습니다 (전체 세션 조회 가능)."
            : "오늘의 수업·세션·학급 기록을 한곳에서 확인하세요."}
        </p>
      </div>

      <NoticeBoard accentText={theme.accentText} />

      {/* KPI 줄 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="진행 중 세션"
          value={`${activeSessions}개`}
          valueClassName={theme.accentText}
          hint={`전체 ${totalSessions}개 →`}
          href="/teacher/sessions?filter=active"
        />
        <KpiCard
          label="누적 응답"
          value={`${responsesCount}회`}
          valueClassName="text-amber-200"
          href="/teacher/records"
        />
        <KpiCard
          label="담당 학급"
          value={isAdmin ? "전체" : `${classCount}개`}
          valueClassName="text-emerald-200"
          hint={isAdmin ? "관리자" : undefined}
          href="/teacher/profile"
        />
        <KpiCard
          label="오늘 수업"
          value="-"
          hint="진도표 →"
          valueClassName="text-slate-400"
          href="/teacher/progress"
        />
      </div>

      {/* 오늘의 수업 — Step 3-2 에서 진도표·세션 연동 */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs font-semibold text-slate-400">오늘의 수업</p>
        <p className="mt-2 text-slate-300">
          진도표(`Step 3-2`)와 연동되면 오늘 수업할 학급·단원과 1클릭 세션
          만들기 버튼이 여기에 표시됩니다.
        </p>
      </section>

      {/* 기능 카드 그리드 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        <DashboardCard
          icon="📅"
          title="진도표"
          description="2주치 수업 진도 (준비 중)"
          href="/teacher/progress"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="🎯"
          title="세션 관리"
          description={`진행 ${activeSessions} · 전체 ${totalSessions}`}
          href="/teacher/sessions"
          badge={activeSessions > 0 ? `진행 ${activeSessions}` : undefined}
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="📊"
          title="학급 기록"
          description="응답 조회 · 학급별"
          href="/teacher/records"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="📝"
          title="콘텐츠 블록"
          description="활동 공유 템플릿 편집"
          href="/teacher/activities"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="📚"
          title="교과 학습"
          description="단원·블록 보기"
          href="/learn"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="🤖"
          title="AI 세특 작성"
          description={
            aiSebteukEnabled
              ? "학생별 초안 생성"
              : "관리자 승인 필요"
          }
          href={aiSebteukEnabled ? "/teacher/sebteuk" : undefined}
          badge={aiSebteukEnabled ? "활성" : undefined}
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="👤"
          title="내 정보"
          description="비밀번호 변경 등"
          href="/teacher/profile"
          hoverBorderClass={theme.hoverBorder}
        />
      </div>

      {/* 최근 응답 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">최근 응답</h2>
          <Link
            href="/teacher/records"
            className="text-xs font-semibold text-slate-400 transition hover:text-white"
          >
            전체 보기 →
          </Link>
        </div>

        {recentResponses.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            아직 들어온 응답이 없습니다.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentResponses.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-slate-950/60 px-4 py-2.5 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">
                    {row.activities?.title ??
                      row.activity_slug ??
                      "활동"}
                  </span>
                  {row.subject ? (
                    <span className="text-xs text-cyan-300">
                      {row.subject}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{formatKoreanDateTime(row.created_at)}</span>
                  <Link
                    href={`/teacher/sessions/${row.session_id}`}
                    className="font-semibold text-cyan-200 transition hover:text-white"
                  >
                    응답 →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
