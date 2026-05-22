import Link from "next/link";
import ActivityRenderer from "@/components/activity-renderer/ActivityRenderer";
import {
  ContentBlock,
  getActivityBlocksForSlug,
} from "@/lib/activities/activityBlocks";
import { supabase } from "@/lib/supabase/client";

type StudentSessionPageProps = {
  params: Promise<{
    joinCode: string;
  }>;
  searchParams: Promise<{
    name?: string;
    number?: string;
  }>;
};

type SessionWithActivity = {
  id: string;
  title: string;
  join_code: string;
  teacher_name: string | null;
  is_active: boolean;
  activities: {
    title: string;
    description: string | null;
    slug: string;
    subject: string | null;
    activity_type: string | null;
    content_blocks: ContentBlock[] | null;
  } | null;
};

function getBlocksFromActivity(
  activity: SessionWithActivity["activities"]
): ContentBlock[] {
  if (
    activity?.content_blocks &&
    Array.isArray(activity.content_blocks) &&
    activity.content_blocks.length > 0
  ) {
    return activity.content_blocks;
  }

  return getActivityBlocksForSlug(activity?.slug ?? "unknown");
}

export default async function StudentSessionPage({
  params,
  searchParams,
}: StudentSessionPageProps) {
  const { joinCode } = await params;
  const { name, number } = await searchParams;

  const normalizedCode = joinCode.toUpperCase();

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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/5 p-8">
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
              className="mt-8 inline-flex rounded-full border border-white/20 px-5 py-3 font-semibold transition hover:bg-white/10"
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

                <p className="mt-4 leading-7 text-slate-300">
                  {name ? `${name} 학생` : "학생"}이 입장했습니다.
                  {number ? ` 번호: ${number}` : ""}
                </p>
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

              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-full bg-white/10 px-3 py-1">
                  subject: {sessionData.activities?.subject ?? "-"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1">
                  type: {sessionData.activities?.activity_type ?? "-"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1">
                  blocks: {activityBlocks.length}
                </span>
                <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-cyan-200">
                  source:{" "}
                  {sessionData.activities?.content_blocks &&
                  sessionData.activities.content_blocks.length > 0
                    ? "DB"
                    : "fallback"}
                </span>
              </div>
            </section>

            <ActivityRenderer
              blocks={activityBlocks}
              sessionId={sessionData.id}
              studentName={name}
              studentNumber={number}
            />

            <Link
              href="/"
              className="mt-8 inline-flex rounded-full border border-white/20 px-5 py-3 font-semibold transition hover:bg-white/10"
            >
              홈으로 돌아가기
            </Link>
          </>
        )}
      </section>
    </main>
  );
}