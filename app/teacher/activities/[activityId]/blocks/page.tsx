export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import ActivityBlocksEditor from "@/components/teacher/ActivityBlocksEditor";
import { requireTeacher } from "@/lib/auth/requireTeacher";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

type TeacherActivityBlocksPageProps = {
  params: Promise<{
    activityId: string;
  }>;
};

type Activity = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  subject: string | null;
  activity_type: string | null;
  content_blocks: unknown[] | null;
  created_at: string | null;
};

export default async function TeacherActivityBlocksPage({
  params,
}: TeacherActivityBlocksPageProps) {
  const { activityId } = await params;

  // 활동 블록(공유 템플릿) 편집은 관리자 전용.
  const { supabase, profile } = await requireTeacher();

  if (profile.role !== "admin") {
    return (
      <main className="min-h-screen px-6 py-10">
        <Card className="mx-auto max-w-3xl p-6 sm:p-8">
          <Link
            href="/teacher/activities"
            className={buttonClasses("neutral", { size: "sm" })}
          >
            ← 활동 목록으로
          </Link>
          <Alert tone="info" className="mt-8">
            <h1 className="text-2xl font-bold">관리자 전용 화면입니다</h1>
            <p className="mt-3 leading-7">
              활동 블록(공유 템플릿) 편집은 관리자만 할 수 있습니다. 특정 수업만
              다르게 구성하려면 그 세션의 수업 화면에서 &quot;이 세션 수업
              편집&quot;을 사용하세요.
            </p>
          </Alert>
        </Card>
      </main>
    );
  }

  const { data: activity, error } = await supabase
    .from("activities")
    .select(
      "id, slug, title, description, subject, activity_type, content_blocks, created_at"
    )
    .eq("id", activityId)
    .single();

  const activityData = activity as unknown as Activity | null;

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-6xl p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/teacher/activities"
            className={buttonClasses("neutral", { size: "sm" })}
          >
            ← 활동 목록으로 돌아가기
          </Link>

          <Link href="/teacher" className={buttonClasses("neutral", { size: "sm" })}>
            교사용 대시보드
          </Link>
        </div>

        {error || !activityData ? (
          <Alert tone="error" className="mt-8">
            <h1 className="text-2xl font-bold">활동을 불러오지 못했습니다.</h1>
            <p className="mt-3">{error?.message}</p>
          </Alert>
        ) : (
          <>
            <header className="mt-8 border-b border-white/10 pb-8">
              <p className="text-sm font-semibold text-cyan-300">
                활동 블록 편집 (공유 템플릿)
              </p>

              <h1 className="mt-3 text-3xl font-bold">{activityData.title}</h1>

              <p className="mt-4 leading-7 text-slate-300">
                {activityData.description ?? "활동 설명이 없습니다."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-full bg-white/10 px-3 py-1">
                  slug: {activityData.slug}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1">
                  subject: {activityData.subject ?? "-"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1">
                  type: {activityData.activity_type ?? "-"}
                </span>
                <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-cyan-200">
                  blocks:{" "}
                  {Array.isArray(activityData.content_blocks)
                    ? activityData.content_blocks.length
                    : 0}
                </span>
              </div>
            </header>

            <Alert tone="info" className="mt-6">
              이 편집기는 <span className="font-semibold">공유 템플릿</span>입니다.
              여기서 저장하면 이 활동을 사용하는 모든 교사·세션의 기본 구성이
              바뀝니다. 특정 수업만 다르게 구성하려면 그 세션의 수업 화면에서
              &quot;이 세션 수업 편집&quot;을 사용하세요.
            </Alert>

            <ActivityBlocksEditor
              targetTable="activities"
              targetId={activityData.id}
              initialContentBlocks={activityData.content_blocks ?? []}
            />
          </>
        )}
      </Card>
    </main>
  );
}