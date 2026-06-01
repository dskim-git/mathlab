export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { requireTeacher } from "@/lib/auth/requireTeacher";
import { formatKoreanDateTime } from "@/lib/dateTime";
import ResponseCsvDownloadButton, {
  SessionResponseRow,
} from "@/components/teacher/ResponseCsvDownloadButton";
import ResponseDeleteButton from "@/components/teacher/ResponseDeleteButton";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

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
  created_by: string | null;
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

type EnhancedStudentResponse = StudentResponse & {
  studentKey: string;
  submissionCount: number;
  submissionOrder: number;
  isLatestSubmission: boolean;
};

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

function getStudentKey(response: StudentResponse) {
  const normalizedName = response.student_name.trim();
  const normalizedNumber = response.student_number?.trim() || "no-number";

  return `${normalizedName}__${normalizedNumber}`;
}

function createEnhancedResponses(
  responses: StudentResponse[]
): EnhancedStudentResponse[] {
  const counts = new Map<string, number>();
  const currentOrder = new Map<string, number>();

  responses.forEach((response) => {
    const key = getStudentKey(response);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return responses.map((response) => {
    const key = getStudentKey(response);
    const nextOrder = (currentOrder.get(key) ?? 0) + 1;
    currentOrder.set(key, nextOrder);

    return {
      ...response,
      studentKey: key,
      submissionCount: counts.get(key) ?? 1,
      submissionOrder: nextOrder,
      isLatestSubmission: nextOrder === 1,
    };
  });
}

function countUniqueStudents(responses: StudentResponse[]) {
  const keys = new Set(responses.map((response) => getStudentKey(response)));
  return keys.size;
}

function countStudentsWithResubmissions(responses: EnhancedStudentResponse[]) {
  const keys = new Set(
    responses
      .filter((response) => response.submissionCount > 1)
      .map((response) => response.studentKey)
  );

  return keys.size;
}

export default async function TeacherSessionResponsesPage({
  params,
}: TeacherSessionResponsesPageProps) {
  const { sessionId } = await params;

  // 승인된 교사/관리자만 통과 + 그 사용자 신원으로 조회하는 서버 클라이언트.
  const { supabase, user, profile } = await requireTeacher();

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
      created_by,
      activities (
        title,
        slug,
        description
      )
    `
    )
    .eq("id", sessionId)
    .single();

  const { data: activityResponses, error: responsesError } = await supabase
    .from("activity_responses")
    .select(
      "id, student_code, student_number, grade, class_number, response_data, reflection_data, created_at, students ( profiles!profile_id ( name ) )"
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  const sessionData = session as unknown as SessionDetail | null;

  // '수업 편집' 링크는 세션 소유자 + 관리자에게만(편집 페이지/RLS와 동일 기준).
  const canEditSession =
    profile.role === "admin" || sessionData?.created_by === user.id;

  const activityRows =
    (activityResponses ?? []) as unknown as SessionResponseRow[];

  // activity_responses 행을 기존 표시/CSV 구조(StudentResponse)로 매핑한다.
  const responseList: StudentResponse[] = activityRows.map((row) => ({
    id: row.id,
    student_name: row.students?.profiles?.name ?? "(이름 없음)",
    student_number:
      row.student_code ??
      (row.student_number != null ? String(row.student_number) : null),
    result: row.response_data,
    reflection: row.reflection_data?.reflection ?? null,
    created_at: row.created_at,
  }));
  const enhancedResponseList = createEnhancedResponses(responseList);

  const uniqueStudentCount = countUniqueStudents(responseList);
  const resubmissionStudentCount =
    countStudentsWithResubmissions(enhancedResponseList);

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-6xl p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/teacher"
            className={buttonClasses("neutral", { size: "sm" })}
          >
            ← 교사용 대시보드로 돌아가기
          </Link>
          <Link
            href={`/teacher/sessions/${sessionId}/lesson`}
            className={buttonClasses("secondary", { size: "sm" })}
          >
            수업 화면 보기
          </Link>
          {canEditSession ? (
            <Link
              href={`/teacher/sessions/${sessionId}/edit`}
              className={buttonClasses("secondary", { size: "sm" })}
            >
              수업 편집
            </Link>
          ) : null}
        </div>

        {sessionError || !sessionData ? (
          <Alert tone="error" className="mt-8">
            <h1 className="text-2xl font-bold">세션을 불러오지 못했습니다.</h1>
            <p className="mt-3">{sessionError?.message}</p>
          </Alert>
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
                  생성: {formatKoreanDateTime(sessionData.created_at)}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1">
                  상태: {sessionData.is_active ? "진행 중" : "종료"}
                </span>
                <span className="rounded-full bg-cyan-300/10 px-3 py-1 font-semibold text-cyan-200">
                  전체 제출 수: {responseList.length}
                </span>
                <span className="rounded-full bg-cyan-300/10 px-3 py-1 font-semibold text-cyan-200">
                  참여 학생 수: {uniqueStudentCount}
                </span>
                <span className="rounded-full bg-yellow-300/10 px-3 py-1 font-semibold text-yellow-200">
                  재제출 학생 수: {resubmissionStudentCount}
                </span>
              </div>
            </header>

            <section className="mt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">제출 응답 목록</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    같은 학생이 여러 번 제출한 경우 최신 제출과 이전 제출을
                    구분해서 표시합니다. CSV에는 전체 제출 기록이 포함됩니다.
                  </p>
                </div>

                <ResponseCsvDownloadButton
                  sessionTitle={sessionData.title}
                  joinCode={sessionData.join_code}
                  responses={activityRows}
                />
              </div>

              {responsesError ? (
                <Alert tone="error" className="mt-5">
                  <p className="font-semibold">
                    응답 목록을 불러오지 못했습니다.
                  </p>
                  <p className="mt-2">{responsesError.message}</p>
                </Alert>
              ) : enhancedResponseList.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-slate-900 p-6 text-slate-300">
                  아직 제출된 응답이 없습니다.
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  {enhancedResponseList.map((response) => (
                    <article
                      key={response.id}
                      className={
                        response.isLatestSubmission
                          ? "rounded-2xl border border-white/10 bg-slate-900 p-6"
                          : "rounded-2xl border border-yellow-300/20 bg-slate-900/60 p-6 opacity-80"
                      }
                    >
                      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-bold">
                              {response.student_name}
                              {response.student_number
                                ? ` (${response.student_number})`
                                : ""}
                            </h3>

                            {response.submissionCount > 1 ? (
                              response.isLatestSubmission ? (
                                <span className="rounded-full bg-green-300/10 px-3 py-1 text-xs font-semibold text-green-200">
                                  최신 제출
                                </span>
                              ) : (
                                <span className="rounded-full bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                                  이전 제출 {response.submissionOrder}
                                </span>
                              )
                            ) : (
                              <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                                단일 제출
                              </span>
                            )}

                            {response.submissionCount > 1 ? (
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
                                총 {response.submissionCount}회 제출
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-2 text-sm text-slate-400">
                            제출 시각:{" "}
                            {formatKoreanDateTime(response.created_at)}
                          </p>
                        </div>

                        <div className="flex flex-col items-start gap-3 md:items-end">
                          <span className="rounded-full bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
                            {getInterpretationTypeLabel(
                              response.result?.interpretationType
                            )}
                          </span>

                          <ResponseDeleteButton
                            responseId={response.id}
                            studentName={response.student_name}
                            studentNumber={response.student_number}
                          />
                        </div>
                      </div>

                      {!response.isLatestSubmission &&
                      response.submissionCount > 1 ? (
                        <div className="mt-5 rounded-xl border border-yellow-300/20 bg-yellow-950/20 p-4 text-sm leading-6 text-yellow-100">
                          이 응답은 같은 학생의 이전 제출입니다. 학생 대표
                          응답으로는 가장 위에 표시되는 최신 제출을 우선
                          참고하세요.
                        </div>
                      ) : null}

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
      </Card>
    </main>
  );
}