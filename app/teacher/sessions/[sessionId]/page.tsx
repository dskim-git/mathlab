import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import ResponseCsvDownloadButton from "@/components/teacher/ResponseCsvDownloadButton";

type TeacherSessionResponsesPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

type SessionDetail = {
  id: string;
  title: string;
  join_code: string;
  teacher_name: string | null;
  created_at: string | null;
  is_active: boolean;
  activities: {
    title: string;
    slug: string;
    description: string | null;
  } | null;
};

type ResponseResult = {
  activitySlug?: string;
  mode?: string;
  modeLabel?: string;
  n?: number;
  repeats?: number;
  p?: number;
  observedMean?: number;
  expectedMean?: number;
  observedVariance?: number;
  expectedVariance?: number;
  interpretationType?: string;
};

type StudentResponse = {
  id: string;
  student_name: string;
  student_number: string | null;
  result: ResponseResult | null;
  reflection: string | null;
  created_at: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatNumber(value: number | undefined, digits = 4) {
  if (typeof value !== "number") {
    return "-";
  }

  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: digits,
  });
}

function getInterpretationTypeLabel(value: string | undefined) {
  if (value === "theory_comparison") {
    return "이론값 비교";
  }

  if (value === "large_number_law") {
    return "큰 수의 법칙";
  }

  if (value === "distribution_shape") {
    return "분포 모양";
  }

  if (value === "personal_question") {
    return "추가 궁금증";
  }

  return "-";
}

export default async function TeacherSessionResponsesPage({
  params,
}: TeacherSessionResponsesPageProps) {
  const { sessionId } = await params;

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select(
      `
      id,
      title,
      join_code,
      teacher_name,
      created_at,
      is_active,
      activities (
        title,
        slug,
        description
      )
    `
    )
    .eq("id", sessionId)
    .single();

  const { data: responses, error: responsesError } = await supabase
    .from("responses")
    .select("id, student_name, student_number, result, reflection, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  const sessionData = session as unknown as SessionDetail | null;
  const responseList = (responses ?? []) as unknown as StudentResponse[];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <Link
          href="/teacher"
          className="inline-flex rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
        >
          ← 교사용 대시보드로 돌아가기
        </Link>

        {sessionError || !sessionData ? (
          <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-950/40 p-6 text-red-200">
            <h1 className="text-2xl font-bold">세션을 불러오지 못했습니다.</h1>
            <p className="mt-3 text-sm">{sessionError?.message}</p>
          </div>
        ) : (
          <>
            <header className="mt-8 border-b border-white/10 pb-8">
              <p className="text-sm font-semibold text-cyan-300">
                학생 응답 확인
              </p>

              <h1 className="mt-3 text-3xl font-bold">{sessionData.title}</h1>

              <p className="mt-4 leading-7 text-slate-300">
                {sessionData.activities?.title ?? "활동 정보 없음"} / 입장 코드{" "}
                <span className="font-bold tracking-[0.15em] text-cyan-300">
                  {sessionData.join_code}
                </span>
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-300">
                <span className="rounded-full bg-white/10 px-3 py-1">
                  교사: {sessionData.teacher_name ?? "-"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1">
                  생성: {formatDateTime(sessionData.created_at)}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1">
                  상태: {sessionData.is_active ? "진행 중" : "종료"}
                </span>
                <span className="rounded-full bg-cyan-300/10 px-3 py-1 font-semibold text-cyan-200">
                  제출 수: {responseList.length}
                </span>
              </div>
            </header>

            <section className="mt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">제출 응답 목록</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    학생 응답을 확인하거나 CSV 파일로 내려받을 수 있습니다.
                  </p>
                </div>

                <ResponseCsvDownloadButton
                  sessionTitle={sessionData.title}
                  joinCode={sessionData.join_code}
                  responses={responseList}
                />
              </div>

              {responsesError ? (
                <div className="mt-5 rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-red-200">
                  <p className="font-semibold">
                    응답 목록을 불러오지 못했습니다.
                  </p>
                  <p className="mt-2 text-sm">{responsesError.message}</p>
                </div>
              ) : responseList.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-slate-900 p-6 text-slate-300">
                  아직 제출된 응답이 없습니다.
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  {responseList.map((response) => (
                    <article
                      key={response.id}
                      className="rounded-2xl border border-white/10 bg-slate-900 p-6"
                    >
                      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-xl font-bold">
                            {response.student_name}
                            {response.student_number
                              ? ` (${response.student_number})`
                              : ""}
                          </h3>
                          <p className="mt-2 text-sm text-slate-400">
                            제출 시각: {formatDateTime(response.created_at)}
                          </p>
                        </div>

                        <span className="rounded-full bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
                          {getInterpretationTypeLabel(
                            response.result?.interpretationType
                          )}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-slate-950 p-4">
                          <p className="text-xs text-slate-400">실험 종류</p>
                          <p className="mt-1 font-semibold">
                            {response.result?.modeLabel ?? "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-950 p-4">
                          <p className="text-xs text-slate-400">n / 반복</p>
                          <p className="mt-1 font-semibold">
                            {response.result?.n ?? "-"} /{" "}
                            {response.result?.repeats ?? "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-950 p-4">
                          <p className="text-xs text-slate-400">평균 비교</p>
                          <p className="mt-1 font-semibold">
                            {formatNumber(response.result?.observedMean)} /{" "}
                            {formatNumber(response.result?.expectedMean)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-950 p-4">
                          <p className="text-xs text-slate-400">분산 비교</p>
                          <p className="mt-1 font-semibold">
                            {formatNumber(response.result?.observedVariance)} /{" "}
                            {formatNumber(response.result?.expectedVariance)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl border border-white/10 bg-slate-950 p-5">
                        <p className="text-sm font-semibold text-slate-300">
                          학생 성찰
                        </p>
                        <p className="mt-3 whitespace-pre-wrap leading-7 text-white">
                          {response.reflection ?? "-"}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}