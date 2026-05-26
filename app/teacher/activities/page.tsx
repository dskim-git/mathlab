export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { requireTeacher } from "@/lib/auth/requireTeacher";
import { formatKoreanDateTime } from "@/lib/dateTime";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

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

function countBlocks(contentBlocks: unknown[] | null) {
  if (!Array.isArray(contentBlocks)) {
    return 0;
  }

  return contentBlocks.length;
}

export default async function TeacherActivitiesPage() {
  // 승인된 교사/관리자만 통과 + 그 사용자 신원으로 조회하는 서버 클라이언트.
  const { supabase, profile } = await requireTeacher();
  // 활동 블록(공유 템플릿) 편집은 관리자 전용 — 편집 링크는 관리자에게만 노출.
  const isAdmin = profile.role === "admin";

  const { data: activities, error } = await supabase
    .from("activities")
    .select(
      "id, slug, title, description, subject, activity_type, content_blocks, created_at"
    )
    .order("created_at", { ascending: true });

  const activityList = (activities ?? []) as unknown as Activity[];

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-6xl p-6 sm:p-8">
        <Link
          href="/teacher"
          className={buttonClasses("neutral", { size: "sm" })}
        >
          ← 교사용 대시보드로 돌아가기
        </Link>

        <header className="mt-8 border-b border-white/10 pb-8">
          <p className="text-sm font-semibold text-cyan-300">교사용 활동 관리</p>

          <h1 className="mt-3 text-3xl font-bold">활동 콘텐츠 블록 관리</h1>

          <p className="mt-4 leading-7 text-slate-300">
            활동별로 학생 화면에 표시할 안내문, Canva PPT, YouTube 영상,
            PDF, 외부 사이트, 미니활동 블록을 관리합니다.
          </p>
        </header>

        {error ? (
          <Alert tone="error" className="mt-8">
            <h2 className="text-xl font-bold">활동 목록을 불러오지 못했습니다.</h2>
            <p className="mt-3">{error.message}</p>
          </Alert>
        ) : activityList.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-slate-900 p-6 text-slate-300">
            등록된 활동이 없습니다.
          </div>
        ) : (
          <>
            <div className="mt-8 hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-300">
                  <th className="py-3 pr-4">활동명</th>
                  <th className="py-3 pr-4">slug</th>
                  <th className="py-3 pr-4">과목</th>
                  <th className="py-3 pr-4">유형</th>
                  <th className="py-3 pr-4">블록 수</th>
                  <th className="py-3 pr-4">생성 시각</th>
                  <th className="py-3 pr-4">관리</th>
                </tr>
              </thead>

              <tbody>
                {activityList.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-b border-white/5 text-slate-300"
                  >
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-white">{activity.title}</p>
                      <p className="mt-1 line-clamp-2 max-w-md text-xs leading-5 text-slate-400">
                        {activity.description ?? "-"}
                      </p>
                    </td>

                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs">
                        {activity.slug}
                      </span>
                    </td>

                    <td className="py-4 pr-4">{activity.subject ?? "-"}</td>

                    <td className="py-4 pr-4">{activity.activity_type ?? "-"}</td>

                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-cyan-300/10 px-3 py-1 font-semibold text-cyan-200">
                        {countBlocks(activity.content_blocks)}
                      </span>
                    </td>

                    <td className="py-4 pr-4">
                      {formatKoreanDateTime(activity.created_at)}
                    </td>

                    <td className="py-4 pr-4">
                      {isAdmin ? (
                        <Link
                          href={`/teacher/activities/${activity.id}/blocks`}
                          className={buttonClasses("secondary", { size: "sm" })}
                        >
                          블록 편집
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">관리자 전용</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <div className="mt-8 space-y-4 lg:hidden">
              {activityList.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-white/10 bg-slate-950 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {activity.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                        {activity.description ?? "-"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      블록 {countBlocks(activity.content_blocks)}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="col-span-2">
                      <dt className="text-xs text-slate-400">slug</dt>
                      <dd className="mt-1">
                        <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs">
                          {activity.slug}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">과목</dt>
                      <dd className="mt-1 text-slate-300">
                        {activity.subject ?? "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">유형</dt>
                      <dd className="mt-1 text-slate-300">
                        {activity.activity_type ?? "-"}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-slate-400">생성 시각</dt>
                      <dd className="mt-1 text-slate-300">
                        {formatKoreanDateTime(activity.created_at)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4">
                    {isAdmin ? (
                      <Link
                        href={`/teacher/activities/${activity.id}/blocks`}
                        className={buttonClasses("secondary", { size: "sm" })}
                      >
                        블록 편집
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">
                        관리자 전용 (공유 템플릿)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </main>
  );
}