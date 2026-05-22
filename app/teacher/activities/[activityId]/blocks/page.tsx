export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import ActivityBlocksJsonEditor from "@/components/teacher/ActivityBlocksJsonEditor";
import { supabase } from "@/lib/supabase/client";

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

  const { data: activity, error } = await supabase
    .from("activities")
    .select(
      "id, slug, title, description, subject, activity_type, content_blocks, created_at"
    )
    .eq("id", activityId)
    .single();

  const activityData = activity as unknown as Activity | null;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/teacher/activities"
            className="inline-flex rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
          >
            ← 활동 목록으로 돌아가기
          </Link>

          <Link
            href="/teacher"
            className="inline-flex rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
          >
            교사용 대시보드
          </Link>
        </div>

        {error || !activityData ? (
          <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-950/40 p-6 text-red-200">
            <h1 className="text-2xl font-bold">활동을 불러오지 못했습니다.</h1>
            <p className="mt-3 text-sm">{error?.message}</p>
          </div>
        ) : (
          <>
            <header className="mt-8 border-b border-white/10 pb-8">
              <p className="text-sm font-semibold text-cyan-300">
                활동 블록 편집
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

            <ActivityBlocksJsonEditor
              activityId={activityData.id}
              initialContentBlocks={activityData.content_blocks ?? []}
            />
          </>
        )}
      </section>
    </main>
  );
}