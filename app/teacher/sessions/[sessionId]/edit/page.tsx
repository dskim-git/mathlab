export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import ActivityBlocksEditor from "@/components/teacher/ActivityBlocksEditor";
import {
  ContentBlock,
  resolveActivityBlocks,
} from "@/lib/activities/activityBlocks";
import { requireTeacher } from "@/lib/auth/requireTeacher";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

type TeacherSessionEditPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

type SessionEdit = {
  id: string;
  title: string;
  join_code: string;
  content_blocks: ContentBlock[] | null;
  activities: {
    title: string | null;
    slug: string | null;
    content_blocks: ContentBlock[] | null;
  } | null;
};

export default async function TeacherSessionEditPage({
  params,
}: TeacherSessionEditPageProps) {
  const { sessionId } = await params;

  // 승인된 교사/관리자만 통과 + 그 사용자 신원으로 조회하는 서버 클라이언트.
  const { supabase } = await requireTeacher();

  const { data: session, error } = await supabase
    .from("sessions")
    .select(
      `
      id,
      title,
      join_code,
      content_blocks,
      activities (
        title,
        slug,
        content_blocks
      )
    `
    )
    .eq("id", sessionId)
    .single();

  const sessionData = session as unknown as SessionEdit | null;

  // 세션에 저장된 구성이 있으면 그걸, 없으면 활동 템플릿(없으면 코드 fallback)에서 시드한다.
  const initialBlocks =
    Array.isArray(sessionData?.content_blocks) &&
    sessionData.content_blocks.length > 0
      ? sessionData.content_blocks
      : resolveActivityBlocks(
          sessionData?.activities?.content_blocks,
          sessionData?.activities?.slug
        );

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-6xl p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/teacher/sessions/${sessionId}/lesson`}
            className={buttonClasses("neutral", { size: "sm" })}
          >
            ← 수업 화면으로
          </Link>
          <Link
            href={`/teacher/sessions/${sessionId}`}
            className={buttonClasses("neutral", { size: "sm" })}
          >
            응답 확인
          </Link>
        </div>

        {error || !sessionData ? (
          <Alert tone="error" className="mt-8">
            <h1 className="text-2xl font-bold">세션을 불러오지 못했습니다.</h1>
            <p className="mt-3">{error?.message}</p>
          </Alert>
        ) : (
          <>
            <header className="mt-8 border-b border-white/10 pb-8">
              <p className="text-sm font-semibold text-cyan-300">
                이 세션 수업 구성
              </p>

              <h1 className="mt-3 text-3xl font-bold">{sessionData.title}</h1>

              <p className="mt-4 leading-7 text-slate-300">
                {sessionData.activities?.title ?? "활동"} 템플릿을 바탕으로 이
                세션만의 블록 구성을 편집합니다. 저장하면 이 세션(입장 코드{" "}
                <span className="font-semibold text-cyan-200">
                  {sessionData.join_code}
                </span>
                )에만 적용되며, 다른 교사·다른 세션에는 영향을 주지 않습니다.
              </p>
            </header>

            <ActivityBlocksEditor
              targetTable="sessions"
              targetId={sessionData.id}
              initialContentBlocks={initialBlocks}
            />
          </>
        )}
      </Card>
    </main>
  );
}
