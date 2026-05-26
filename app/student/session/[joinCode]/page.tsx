import Link from "next/link";
import { redirect } from "next/navigation";
import ActivityRenderer from "@/components/activity-renderer/ActivityRenderer";
import {
  ContentBlock,
  resolveActivityBlocks,
} from "@/lib/activities/activityBlocks";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type StudentSessionPageProps = {
  params: Promise<{
    joinCode: string;
  }>;
};

type SessionWithActivity = {
  id: string;
  title: string;
  join_code: string;
  teacher_name: string | null;
  is_active: boolean;
  activities: {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    subject: string | null;
    activity_type: string | null;
    content_blocks: ContentBlock[] | null;
  } | null;
};

type CurrentStudent = {
  id: string;
  student_login_id: string;
  student_code: string;
  grade: number;
  class_number: number;
  student_number: number;
  profiles: { name: string } | null;
};

function getBlocksFromActivity(
  activity: SessionWithActivity["activities"]
): ContentBlock[] {
  return resolveActivityBlocks(activity?.content_blocks, activity?.slug);
}

export default async function StudentSessionPage({
  params,
}: StudentSessionPageProps) {
  const { joinCode } = await params;
  const normalizedCode = joinCode.toUpperCase();

  const supabase = await createServerSupabaseClient();

  // Phase 4: 입장은 로그인 필수 + 신원은 Auth 세션에서 파생한다(URL 파라미터 제거).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login");
  }

  // 본인 학생 정보(표시용). 제출 신원은 ProbabilitySimulator가 세션에서 다시 조회한다.
  const { data: meData } = await supabase
    .from("students")
    .select(
      "id, student_login_id, student_code, grade, class_number, student_number, profiles ( name )"
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  const me = meData as unknown as CurrentStudent | null;

  const { data: session, error } = await supabase
    .from("sessions")
    .select(
      `
      id,
      title,
      join_code,
      teacher_name,
      is_active,
      activities (
        id,
        title,
        description,
        slug,
        subject,
        activity_type,
        content_blocks
      )
    `
    )
    .eq("join_code", normalizedCode)
    .eq("is_active", true)
    .single();

  const sessionData = session as unknown as SessionWithActivity | null;
  const activityBlocks = getBlocksFromActivity(sessionData?.activities ?? null);

  const name = me?.profiles?.name ?? "";
  const studentId = me?.id;
  const loginId = me?.student_login_id;
  const studentCode = me?.student_code;
  const number = me ? String(me.student_number) : undefined;
  const grade = me ? String(me.grade) : undefined;
  const classNumber = me ? String(me.class_number) : undefined;
  const studentLabel = me
    ? `${me.grade}학년 ${me.class_number}반 ${me.student_number}번`
    : "";

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-7xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan-300">학생 활동</p>

        {error || !sessionData ? (
          <>
            <h1 className="mt-3 text-3xl font-bold">
              세션을 찾을 수 없습니다
            </h1>

            <p className="mt-4 leading-7 text-slate-300">
              입장 코드가 잘못되었거나 이미 종료된 수업 세션입니다.
            </p>

            <Link
              href="/join"
              className={buttonClasses("neutral", { className: "mt-8" })}
            >
              다시 입장하기
            </Link>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="mt-3 text-3xl font-bold">
                  {sessionData.title}
                </h1>

                <section className="mt-5 rounded-2xl border border-green-400/30 bg-green-950/30 p-5 text-sm text-green-100">
                  <p className="font-semibold">
                    {name ? `${name} 학생이 입장했습니다.` : "학생이 입장했습니다."}
                  </p>

                  {studentLabel ? (
                    <p className="mt-2">학번: {studentLabel}</p>
                  ) : null}

                  {loginId ? (
                    <p className="mt-1">로그인 ID: {loginId}</p>
                  ) : null}

                  {studentCode ? (
                    <p className="mt-1">학생 코드: {studentCode}</p>
                  ) : null}

                  {studentId ? (
                    <p className="mt-1 text-green-200/80">
                      student_id 연결됨
                    </p>
                  ) : (
                    <p className="mt-1 text-yellow-200">
                      학생 계정이 아닙니다. (제출하려면 학생으로 로그인하세요.)
                    </p>
                  )}
                </section>
              </div>

              <div className="rounded-2xl border border-cyan-300/40 bg-cyan-300/10 px-5 py-4 text-center">
                <p className="text-xs text-slate-300">입장 코드</p>
                <p className="mt-1 text-2xl font-black tracking-[0.2em] text-cyan-300">
                  {sessionData.join_code}
                </p>
              </div>
            </div>

            <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
              <p className="text-sm font-semibold text-cyan-300">활동 정보</p>

              <h2 className="mt-3 text-2xl font-bold">
                {sessionData.activities?.title ?? "활동 정보 없음"}
              </h2>

              <p className="mt-3 leading-7 text-slate-300">
                {sessionData.activities?.description ??
                  "연결된 활동 정보를 불러오지 못했습니다."}
              </p>
            </section>

            <ActivityRenderer
              blocks={activityBlocks}
              sessionId={sessionData.id}
              activityId={sessionData.activities?.id}
              activitySlug={sessionData.activities?.slug}
              activitySubject={sessionData.activities?.subject}
              studentId={studentId}
              studentLoginId={loginId}
              studentName={name}
              studentNumber={number}
              studentGrade={grade}
              studentClassNumber={classNumber}
              studentCode={studentCode}
            />

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/student/home" className={buttonClasses("secondary")}>
                학생 홈으로 가기
              </Link>

              <Link href="/" className={buttonClasses("neutral")}>
                홈으로 돌아가기
              </Link>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}
