export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { formatKoreanDateTime } from "@/lib/dateTime";
import SessionCreateForm from "@/components/teacher/SessionCreateForm";
import SessionStatusButton from "@/components/teacher/SessionStatusButton";

type Activity = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  subject: string | null;
  activity_type: string | null;
  created_at: string | null;
};

type Session = {
  id: string;
  title: string;
  join_code: string;
  teacher_name: string | null;
  is_active: boolean;
  created_at: string | null;
  activities: {
    title: string;
    slug: string;
  } | null;
};

export default async function TeacherPage() {
  const { data: activities, error: activitiesError } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: true });

  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select(
      `
      id,
      title,
      join_code,
      teacher_name,
      is_active,
      created_at,
      activities (
        title,
        slug
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(20);

  const activityList = (activities ?? []) as Activity[];
  const sessionList = (sessions ?? []) as unknown as Session[];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-cyan-300">교사용 대시보드</p>

        <h1 className="mt-3 text-3xl font-bold">수업 세션 관리</h1>

        <p className="mt-4 leading-7 text-slate-300">
          선생님이 활동 세션을 만들고, 입장 코드를 발급하고, 학생 응답을
          확인하는 대시보드입니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/teacher/activities"
            className="rounded-full border border-cyan-300/40 px-5 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
          >
            활동 콘텐츠 블록 관리
          </Link>
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">Supabase 연결 상태</h2>

          {activitiesError ? (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-red-200">
              <p className="font-semibold">
                활동 데이터를 불러오지 못했습니다.
              </p>
              <p className="mt-2 text-sm">{activitiesError.message}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-300">
              activities 테이블에서 불러온 활동 수:{" "}
              <span className="font-bold text-cyan-300">
                {activityList.length}
              </span>
            </p>
          )}
        </section>

        {activityList.length > 0 ? (
          <SessionCreateForm activities={activityList} />
        ) : (
          <div className="mt-8 rounded-2xl border border-yellow-400/30 bg-yellow-950/30 p-6 text-yellow-100">
            활동 데이터가 없어서 수업 세션을 만들 수 없습니다.
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">최근 수업 세션</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                생성된 세션의 입장 코드와 학생 응답을 확인하고, 수업이 끝난
                세션을 종료할 수 있습니다.
              </p>
            </div>
          </div>

          {sessionsError ? (
            <div className="mt-5 rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-red-200">
              <p className="font-semibold">세션 목록을 불러오지 못했습니다.</p>
              <p className="mt-2 text-sm">{sessionsError.message}</p>
            </div>
          ) : sessionList.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-slate-950 p-6 text-slate-300">
              아직 생성된 수업 세션이 없습니다.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-slate-300">
                    <th className="py-3 pr-4">수업 세션</th>
                    <th className="py-3 pr-4">활동</th>
                    <th className="py-3 pr-4">입장 코드</th>
                    <th className="py-3 pr-4">교사</th>
                    <th className="py-3 pr-4">생성 시각</th>
                    <th className="py-3 pr-4">상태</th>
                    <th className="py-3 pr-4">응답</th>
                    <th className="py-3 pr-4">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionList.map((session) => (
                    <tr
                      key={session.id}
                      className="border-b border-white/5 text-slate-300"
                    >
                      <td className="py-4 pr-4 font-semibold text-white">
                        {session.title}
                      </td>

                      <td className="py-4 pr-4">
                        {session.activities?.title ?? "-"}
                      </td>

                      <td className="py-4 pr-4">
                        <span className="rounded-full bg-cyan-300/10 px-3 py-1 font-bold tracking-[0.15em] text-cyan-300">
                          {session.join_code}
                        </span>
                      </td>

                      <td className="py-4 pr-4">
                        {session.teacher_name ?? "-"}
                      </td>

                      <td className="py-4 pr-4">
                        {formatKoreanDateTime(session.created_at)}
                      </td>

                      <td className="py-4 pr-4">
                        {session.is_active ? (
                          <span className="rounded-full bg-green-300/10 px-3 py-1 font-semibold text-green-200">
                            진행 중
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-700 px-3 py-1 font-semibold text-slate-300">
                            종료
                          </span>
                        )}
                      </td>

                      <td className="py-4 pr-4">
                        <Link
                          href={`/teacher/sessions/${session.id}`}
                          className="rounded-full border border-cyan-300/40 px-4 py-2 font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
                        >
                          응답 보기
                        </Link>
                      </td>

                      <td className="py-4 pr-4">
                        <SessionStatusButton
                          sessionId={session.id}
                          isActive={session.is_active}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-full border border-white/20 px-5 py-3 font-semibold transition hover:bg-white/10"
        >
          홈으로 돌아가기
        </Link>
      </section>
    </main>
  );
}