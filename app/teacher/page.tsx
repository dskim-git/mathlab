export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { requireTeacher } from "@/lib/auth/requireTeacher";
import { formatKoreanDateTime } from "@/lib/dateTime";
import SessionCreateForm from "@/components/teacher/SessionCreateForm";
import SessionDeleteButton from "@/components/teacher/SessionDeleteButton";
import SessionStatusButton from "@/components/teacher/SessionStatusButton";

type TeacherPageProps = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

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

type SessionWithResponseCount = Session & {
  responseCount: number;
};

type ResponseSessionIdRow = {
  session_id: string;
};

type SessionFilter =
  | "all"
  | "active"
  | "closed"
  | "has-responses"
  | "no-responses";

function createResponseCountMap(rows: ResponseSessionIdRow[]) {
  const responseCountMap = new Map<string, number>();

  rows.forEach((row) => {
    responseCountMap.set(
      row.session_id,
      (responseCountMap.get(row.session_id) ?? 0) + 1
    );
  });

  return responseCountMap;
}

function normalizeSessionFilter(value: string | undefined): SessionFilter {
  if (value === "active") {
    return "active";
  }

  if (value === "closed") {
    return "closed";
  }

  if (value === "has-responses") {
    return "has-responses";
  }

  if (value === "no-responses") {
    return "no-responses";
  }

  return "all";
}

function filterSessions(
  sessions: SessionWithResponseCount[],
  filter: SessionFilter
) {
  if (filter === "active") {
    return sessions.filter((session) => session.is_active);
  }

  if (filter === "closed") {
    return sessions.filter((session) => !session.is_active);
  }

  if (filter === "has-responses") {
    return sessions.filter((session) => session.responseCount > 0);
  }

  if (filter === "no-responses") {
    return sessions.filter((session) => session.responseCount === 0);
  }

  return sessions;
}

function countSessions(
  sessions: SessionWithResponseCount[],
  filter: SessionFilter
) {
  return filterSessions(sessions, filter).length;
}

const filterOptions: {
  value: SessionFilter;
  label: string;
  href: string;
}[] = [
  {
    value: "all",
    label: "전체",
    href: "/teacher",
  },
  {
    value: "active",
    label: "진행 중",
    href: "/teacher?filter=active",
  },
  {
    value: "closed",
    label: "종료",
    href: "/teacher?filter=closed",
  },
  {
    value: "has-responses",
    label: "응답 있음",
    href: "/teacher?filter=has-responses",
  },
  {
    value: "no-responses",
    label: "응답 없음",
    href: "/teacher?filter=no-responses",
  },
];

export default async function TeacherPage({ searchParams }: TeacherPageProps) {
  const { filter } = await searchParams;
  const selectedFilter = normalizeSessionFilter(filter);

  // 승인된 교사/관리자만 통과 + 그 사용자 신원으로 조회하는 서버 클라이언트.
  const { supabase } = await requireTeacher();

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

  const sessionList = (sessions ?? []) as unknown as Session[];
  const sessionIds = sessionList.map((session) => session.id);

  const { data: responseSessionRows, error: responseCountError } =
    sessionIds.length > 0
      ? await supabase
          .from("activity_responses")
          .select("session_id")
          .in("session_id", sessionIds)
      : { data: [], error: null };

  const responseCountMap = createResponseCountMap(
    (responseSessionRows ?? []) as ResponseSessionIdRow[]
  );

  const activityList = (activities ?? []) as Activity[];
  const sessionListWithResponseCount: SessionWithResponseCount[] =
    sessionList.map((session) => ({
      ...session,
      responseCount: responseCountMap.get(session.id) ?? 0,
    }));

  const filteredSessionList = filterSessions(
    sessionListWithResponseCount,
    selectedFilter
  );

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

          <Link
            href="/teacher/records"
            className="rounded-full border border-cyan-300/40 px-5 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
          >
            학급별 활동 기록 조회
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

          {responseCountError ? (
            <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-950/30 p-4 text-yellow-100">
              <p className="font-semibold">
                응답 수 정보를 불러오지 못했습니다.
              </p>
              <p className="mt-2 text-sm">{responseCountError.message}</p>
            </div>
          ) : null}
        </section>

        {activityList.length > 0 ? (
          <SessionCreateForm activities={activityList} />
        ) : (
          <div className="mt-8 rounded-2xl border border-yellow-400/30 bg-yellow-950/30 p-6 text-yellow-100">
            활동 데이터가 없어서 수업 세션을 만들 수 없습니다.
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">최근 수업 세션</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                생성된 세션의 입장 코드와 학생 응답 수를 확인하고, 수업이
                끝난 세션을 종료하거나 삭제할 수 있습니다.
              </p>
            </div>

            <div className="text-sm text-slate-400">
              표시 중:{" "}
              <span className="font-bold text-cyan-300">
                {filteredSessionList.length}
              </span>
              개 / 전체{" "}
              <span className="font-bold text-white">
                {sessionListWithResponseCount.length}
              </span>
              개
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {filterOptions.map((option) => {
              const isSelected = option.value === selectedFilter;
              const count = countSessions(
                sessionListWithResponseCount,
                option.value
              );

              return (
                <Link
                  key={option.value}
                  href={option.href}
                  scroll={false}
                  className={
                    isSelected
                      ? "rounded-full border border-cyan-300/60 bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950"
                      : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                  }
                >
                  {option.label}{" "}
                  <span
                    className={
                      isSelected
                        ? "text-slate-800"
                        : "text-slate-500"
                    }
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>

          {sessionsError ? (
            <div className="mt-5 rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-red-200">
              <p className="font-semibold">세션 목록을 불러오지 못했습니다.</p>
              <p className="mt-2 text-sm">{sessionsError.message}</p>
            </div>
          ) : sessionListWithResponseCount.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-slate-950 p-6 text-slate-300">
              아직 생성된 수업 세션이 없습니다.
            </div>
          ) : filteredSessionList.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-slate-950 p-6 text-slate-300">
              현재 필터 조건에 맞는 수업 세션이 없습니다.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-slate-300">
                    <th className="py-3 pr-4">수업 세션</th>
                    <th className="py-3 pr-4">활동</th>
                    <th className="py-3 pr-4">입장 코드</th>
                    <th className="py-3 pr-4">교사</th>
                    <th className="py-3 pr-4">생성 시각</th>
                    <th className="py-3 pr-4">상태</th>
                    <th className="py-3 pr-4">응답 수</th>
                    <th className="py-3 pr-4">응답</th>
                    <th className="py-3 pr-4">관리</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSessionList.map((session) => (
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
                        <span
                          className={
                            session.responseCount > 0
                              ? "rounded-full bg-yellow-300/10 px-3 py-1 font-bold text-yellow-200"
                              : "rounded-full bg-white/10 px-3 py-1 font-semibold text-slate-300"
                          }
                        >
                          {session.responseCount}개
                        </span>
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
                        <div className="flex flex-col gap-2">
                          <SessionStatusButton
                            sessionId={session.id}
                            isActive={session.is_active}
                          />

                          <SessionDeleteButton
                            sessionId={session.id}
                            sessionTitle={session.title}
                            joinCode={session.join_code}
                            responseCount={session.responseCount}
                          />
                        </div>
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