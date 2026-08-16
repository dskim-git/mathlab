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

type ResponseScopeRow = {
  student_id: string | null;
  subject: string | null;
  school_year: number | null;
  semester: number | null;
};

type MyCourse = {
  id: string;
  school_year: number;
  semester: number;
  subject: string;
  name: string;
};

type RecentResponseRow = {
  id: string;
  created_at: string;
  activity_slug: string | null;
  subject: string | null;
  session_id: string | null;
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

  // 담당 권한(관리자=빈 배열, UI 에서 "전체" 처리)
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

  // 누적 응답: RLS 가 본인 권한 행만 반환하므로 그대로 count.
  // (이전엔 본인 세션 ID 안의 응답만 카운트해서 /learn 의 세션 없는 응답이 누락됐었음.)
  // 수업별 표를 위해 (student_id, subject, school_year, semester) 행도 같이 가져와 집계.
  const [responsesCountRes, responseRowsRes, recentResponsesRes, permRes] =
    await Promise.all([
      supabase
        .from("activity_responses")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("activity_responses")
        .select("student_id, subject, school_year, semester"),
      supabase
        .from("activity_responses")
        .select(
          "id, created_at, activity_slug, subject, session_id, activities ( title )"
        )
        .order("created_at", { ascending: false })
        .limit(5),
      permissionsQuery,
    ]);

  const responsesCount = (responsesCountRes as { count: number }).count ?? 0;
  const responseRows = (responseRowsRes.data ?? []) as ResponseScopeRow[];
  const recentResponses = (recentResponsesRes.data ?? []) as unknown as RecentResponseRow[];
  const permissions = (permRes.data ?? []) as TeacherPermissionRow[];

  // 내가 담당하는 개설 수업 + 그 수강생 — 표의 단위가 "학급" 에서 "수업" 으로 바뀌었다.
  // 경제수학처럼 여러 학급에서 모인 선택 수업은 학년·반으로 셀 수 없기 때문.
  const { data: courseRows } = await supabase
    .from("courses")
    .select("id, school_year, semester, subject, name")
    .order("school_year", { ascending: false })
    .order("semester", { ascending: false })
    .order("subject")
    .order("name");
  const myCourses = (courseRows ?? []) as MyCourse[];

  const { data: enrollRows } = await supabase
    .from("course_students")
    .select("course_id, student_id")
    .not("student_id", "is", null);
  const studentsByCourse = new Map<string, Set<string>>();
  for (const r of (enrollRows ?? []) as {
    course_id: string;
    student_id: string;
  }[]) {
    const set = studentsByCourse.get(r.course_id) ?? new Set<string>();
    set.add(r.student_id);
    studentsByCourse.set(r.course_id, set);
  }

  // 수업별 응답 수 — (수강생 ∧ 교과 ∧ 학년도 ∧ 학기) 가 모두 맞는 응답만 센다.
  const courseBuckets = myCourses.map((c) => {
    const roster = studentsByCourse.get(c.id);
    let count = 0;
    if (roster && roster.size > 0) {
      for (const r of responseRows) {
        if (!r.student_id || !roster.has(r.student_id)) continue;
        if (r.subject !== c.subject) continue;
        if (r.school_year !== c.school_year) continue;
        if (r.semester !== c.semester) continue;
        count += 1;
      }
    }
    return { course: c, count, students: roster?.size ?? 0 };
  });

  // Hero — 담당 교과 칩
  let accessibleSubjects: string[] = [];
  if (isAdmin) {
    const { data } = await supabase
      .from("subjects")
      .select("name, order_index")
      .order("order_index");
    accessibleSubjects = ((data ?? []) as Array<{ name: string }>).map(
      (s) => s.name
    );
  } else {
    const wanted = new Set(permissions.map((p) => p.subject));
    // 담당 학반과 무관하게 개인 부여된 교과도 히어로 칩에 포함 (RLS 가 본인 행만 반환).
    const { data: granted } = await supabase
      .from("teacher_subject_permissions")
      .select("subject");
    ((granted ?? []) as Array<{ subject: string }>).forEach((g) =>
      wanted.add(g.subject)
    );
    // 담당 수업 그룹(선택 수업 등)의 교과도 칩에 포함 (RLS 가 자기 그룹만 반환).
    const { data: groupSubjects } = await supabase
      .from("study_group_subjects")
      .select("subject");
    ((groupSubjects ?? []) as Array<{ subject: string }>).forEach((g) =>
      wanted.add(g.subject)
    );
    // 개설 수업(courses) 담당 교과 — 지금은 이쪽이 담당의 정본이다.
    ((myCourses ?? []) as Array<{ subject: string }>).forEach((c) =>
      wanted.add(c.subject)
    );
    if (wanted.size > 0) {
      const { data } = await supabase
        .from("subjects")
        .select("name, order_index")
        .in("name", Array.from(wanted))
        .order("order_index");
      accessibleSubjects = ((data ?? []) as Array<{ name: string }>).map(
        (s) => s.name
      );
    }
  }

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
            ? "관리자 계정으로 교사 화면을 보고 있습니다 (전체 응답 조회 가능)."
            : "담당 교과의 단원·자료·기록을 한곳에서 확인하세요."}
        </p>
      </div>

      <NoticeBoard accentText={theme.accentText} />

      {/* Hero — 담당 교과 바로가기 */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-300/10 via-white/5 to-transparent p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className={`text-xs font-semibold ${theme.accentText}`}>
              {isAdmin ? "전체 교과" : "담당 교과"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
              교과를 선택해 수업을 준비하세요
            </h2>
          </div>
          <Link
            href="/learn"
            className="text-xs font-semibold text-slate-400 transition hover:text-white"
          >
            전체 교과 학습 →
          </Link>
        </div>

        {accessibleSubjects.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            담당 교과가 없습니다. 관리자에게 권한을 요청해 주세요.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {accessibleSubjects.map((s) => (
              <Link
                key={s}
                href={`/learn?subject=${encodeURIComponent(s)}`}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-slate-950"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/15 text-xl">
                  📘
                </span>
                <span className="text-sm font-semibold text-white group-hover:text-cyan-100">
                  {s}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 누적 응답 KPI + 수업별 응답 표 */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[200px_1fr]">
        <KpiCard
          label="누적 응답"
          value={`${responsesCount}회`}
          valueClassName="text-amber-200"
          hint="응답 기록 →"
          href="/teacher/records"
        />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-400">
            {isAdmin ? "수업별 응답" : "담당 수업별 응답"}
          </p>
          {courseBuckets.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">
              {isAdmin
                ? "개설된 수업이 없습니다."
                : "담당 수업이 없습니다. 관리자에게 수업 배정을 요청하세요."}
            </p>
          ) : (
            <div className="mt-3 max-h-64 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400">
                    <th scope="col" className="border-b border-white/10 px-2 py-1.5">
                      수업
                    </th>
                    <th scope="col" className="border-b border-white/10 px-2 py-1.5">
                      학기
                    </th>
                    <th
                      scope="col"
                      className="border-b border-white/10 px-2 py-1.5 text-right"
                    >
                      수강생
                    </th>
                    <th
                      scope="col"
                      className="border-b border-white/10 px-2 py-1.5 text-right"
                    >
                      응답
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courseBuckets.map((b) => (
                    <tr key={b.course.id} className="border-b border-white/5">
                      <td className="px-2 py-1.5">
                        <span className="font-semibold text-white">
                          {b.course.name}
                        </span>
                        <span className="ml-1.5 text-[10px] text-cyan-300">
                          {b.course.subject}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-xs text-slate-400">
                        {b.course.school_year} {b.course.semester}학기
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs text-slate-300">
                        {b.students}명
                      </td>
                      <td className="px-2 py-1.5 text-right font-bold text-amber-200">
                        {b.count}회
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 기능 카드 — 1행 3개. 관리자 대시보드와 같은 5컬럼 그리드로 카드 크기 통일.
          우측 2칸은 빈 공간(후속 사용 예정). */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard
          icon="📅"
          title="진도표"
          description="2주치 수업 진도"
          href="/teacher/progress"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="📝"
          title="수업활동 편집"
          description="내 단원·블록 구성"
          href="/teacher/lesson-blocks"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="🤖"
          title="AI 세특 작성"
          description={
            aiSebteukEnabled ? "학생별 초안 생성" : "관리자 승인 필요"
          }
          href={aiSebteukEnabled ? "/teacher/sebteuk" : undefined}
          badge={aiSebteukEnabled ? "활성" : undefined}
          hoverBorderClass={theme.hoverBorder}
        />
      </div>

      {/* 기능 카드 — 2행 2개. 동일한 5컬럼 그리드, 우측 3칸 빈 공간. */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard
          icon="💡"
          title="건의 보내기"
          description="오류·활동 건의"
          href="/teacher/feedback"
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
                    {row.activities?.title ?? row.activity_slug ?? "활동"}
                  </span>
                  {row.subject ? (
                    <span className="text-xs text-cyan-300">{row.subject}</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{formatKoreanDateTime(row.created_at)}</span>
                  {row.session_id ? (
                    <Link
                      href={`/teacher/sessions/${row.session_id}`}
                      className="font-semibold text-cyan-200 transition hover:text-white"
                    >
                      응답 →
                    </Link>
                  ) : (
                    <Link
                      href="/teacher/records"
                      className="font-semibold text-cyan-200 transition hover:text-white"
                    >
                      기록 →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
