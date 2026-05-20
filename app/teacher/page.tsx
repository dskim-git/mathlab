import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import SessionCreateForm from "@/components/teacher/SessionCreateForm";

type Activity = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  subject: string | null;
  activity_type: string | null;
  created_at: string | null;
};

export default async function TeacherPage() {
  const { data: activities, error } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: true });

  const activityList = (activities ?? []) as Activity[];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-cyan-300">교사용 대시보드</p>

        <h1 className="mt-3 text-3xl font-bold">수업 세션 관리</h1>

        <p className="mt-4 leading-7 text-slate-300">
          선생님이 활동 세션을 만들고, 입장 코드를 발급하고, 학생 응답을
          확인하는 대시보드입니다.
        </p>

        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">Supabase 연결 상태</h2>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-red-200">
              <p className="font-semibold">
                Supabase 데이터를 불러오지 못했습니다.
              </p>
              <p className="mt-2 text-sm">{error.message}</p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-slate-300">
                activities 테이블에서 불러온 활동 수:{" "}
                <span className="font-bold text-cyan-300">
                  {activityList.length}
                </span>
              </p>

              <div className="mt-5 grid gap-4">
                {activityList.map((activity) => (
                  <article
                    key={activity.id}
                    className="rounded-2xl border border-white/10 bg-slate-950 p-5"
                  >
                    <p className="text-sm text-cyan-300">{activity.slug}</p>
                    <h3 className="mt-2 text-lg font-bold">{activity.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {activity.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        subject: {activity.subject}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        type: {activity.activity_type}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        {activityList.length > 0 ? (
          <SessionCreateForm activities={activityList} />
        ) : (
          <div className="mt-8 rounded-2xl border border-yellow-400/30 bg-yellow-950/30 p-6 text-yellow-100">
            활동 데이터가 없어서 수업 세션을 만들 수 없습니다.
          </div>
        )}

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