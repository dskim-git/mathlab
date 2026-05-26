export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import ActivityRenderer from "@/components/activity-renderer/ActivityRenderer";
import {
  ContentBlock,
  resolveSessionBlocks,
} from "@/lib/activities/activityBlocks";
import { requireTeacher } from "@/lib/auth/requireTeacher";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

type TeacherSessionLessonPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

type SessionLesson = {
  id: string;
  title: string;
  join_code: string;
  is_active: boolean;
  created_by: string | null;
  content_blocks: ContentBlock[] | null;
  activities: {
    title: string | null;
    slug: string | null;
    description: string | null;
    content_blocks: ContentBlock[] | null;
  } | null;
};

export default async function TeacherSessionLessonPage({
  params,
}: TeacherSessionLessonPageProps) {
  const { sessionId } = await params;

  // 승인된 교사/관리자만 통과 + 그 사용자 신원으로 조회하는 서버 클라이언트.
  const { supabase, user, profile } = await requireTeacher();

  const { data: session, error } = await supabase
    .from("sessions")
    .select(
      `
      id,
      title,
      join_code,
      is_active,
      created_by,
      content_blocks,
      activities (
        title,
        slug,
        description,
        content_blocks
      )
    `
    )
    .eq("id", sessionId)
    .single();

  const sessionData = session as unknown as SessionLesson | null;

  // 학생 화면과 동일한 규칙으로 블록을 해석한다(DB 우선, 없으면 코드 fallback).
  const blocks = resolveSessionBlocks(
    sessionData?.content_blocks,
    sessionData?.activities?.content_blocks,
    sessionData?.activities?.slug
  );

  // '이 세션 수업 편집' 링크는 세션을 만든 교사 + 관리자에게만 노출.
  const canEdit =
    profile.role === "admin" || sessionData?.created_by === user.id;

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-6xl p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/teacher/sessions/${sessionId}`}
            className={buttonClasses("neutral", { size: "sm" })}
          >
            ← 응답 확인으로
          </Link>
          <Link href="/teacher" className={buttonClasses("neutral", { size: "sm" })}>
            교사용 대시보드
          </Link>
          {canEdit ? (
            <Link
              href={`/teacher/sessions/${sessionId}/edit`}
              className={buttonClasses("secondary", { size: "sm" })}
            >
              이 세션 수업 편집
            </Link>
          ) : null}
        </div>

        {error || !sessionData ? (
          <Alert tone="error" className="mt-8">
            <h1 className="text-2xl font-bold">세션을 불러오지 못했습니다.</h1>
            <p className="mt-3">{error?.message}</p>
          </Alert>
        ) : (
          <>
            <header className="mt-8 border-b border-white/10 pb-8">
              <p className="text-sm font-semibold text-cyan-300">교사용 수업 화면</p>

              <h1 className="mt-3 text-3xl font-bold">{sessionData.title}</h1>

              <p className="mt-4 leading-7 text-slate-300">
                {sessionData.activities?.title ?? "활동 정보 없음"} · 학생이 보는
                수업 화면과 동일하게 표시됩니다. (미니활동은 학생 화면에서
                실행·제출됩니다.)
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-300">
                <span className="rounded-full bg-cyan-300/10 px-3 py-1 font-semibold text-cyan-200">
                  입장 코드 {sessionData.join_code}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1">
                  상태: {sessionData.is_active ? "진행 중" : "종료"}
                </span>
              </div>
            </header>

            <ActivityRenderer mode="teacher" blocks={blocks} />
          </>
        )}
      </Card>
    </main>
  );
}
