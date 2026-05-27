"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

// Phase 4: 학생 정보는 localStorage 블롭이 아니라 Auth 세션에서 파생한다.
type StudentInfo = {
  studentId: string;
  loginId: string;
  name: string;
  schoolYear: number;
  studentCode: string;
  grade: number;
  classNumber: number;
  studentNumber: number;
};

type ActivityResponseRow = {
  id: string;
  subject: string | null;
  activity_slug: string | null;
  reflection_data: {
    interpretationType?: string;
    reflection?: string;
  } | null;
  response_data: {
    modeLabel?: string;
    n?: number;
    repeats?: number;
    p?: number;
    observedMean?: number;
    expectedMean?: number;
    observedVariance?: number;
    expectedVariance?: number;
  } | null;
  created_at: string;
  activities: {
    title: string | null;
  } | null;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function previewText(text: string, max = 120) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function getInterpretationLabel(value?: string) {
  switch (value) {
    case "theory_comparison":
      return "시뮬레이션 결과와 이론값 비교";
    case "large_number_law":
      return "반복 횟수와 큰 수의 법칙 관점";
    case "distribution_shape":
      return "성공 횟수 분포 모양 관찰";
    case "personal_question":
      return "스스로 생긴 궁금증";
    default:
      return value ?? "-";
  }
}

function formatNumber(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return value.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
}

export default function StudentHomePage() {
  const router = useRouter();

  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [responses, setResponses] = useState<ActivityResponseRow[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 로그인 세션에서 본인 학생 정보를 가져온다(localStorage 블롭 제거).
  useEffect(() => {
    let active = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) {
          setStudent(null);
          setAuthChecked(true);
        }
        return;
      }

      const { data } = await supabase
        .from("students")
        .select(
          "id, school_year, student_code, student_login_id, grade, class_number, student_number, profiles ( name )"
        )
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!active) return;

      const row = data as unknown as {
        id: string;
        school_year: number;
        student_code: string;
        student_login_id: string;
        grade: number;
        class_number: number;
        student_number: number;
        profiles: { name: string } | null;
      } | null;

      setStudent(
        row
          ? {
              studentId: row.id,
              loginId: row.student_login_id,
              name: row.profiles?.name ?? "",
              schoolYear: row.school_year,
              studentCode: row.student_code,
              grade: row.grade,
              classNumber: row.class_number,
              studentNumber: row.student_number,
            }
          : null
      );
      setAuthChecked(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  const studentId = student?.studentId;

  const loadResponses = useCallback(async () => {
    if (!studentId) {
      setResponses([]);
      return;
    }

    setIsLoadingResponses(true);
    setLoadError("");

    const { data, error } = await supabase
      .from("activity_responses")
      .select(
        "id, subject, activity_slug, reflection_data, response_data, created_at, activities ( title )"
      )
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError(error.message);
      setResponses([]);
    } else {
      setResponses((data ?? []) as unknown as ActivityResponseRow[]);
    }

    setIsLoadingResponses(false);
  }, [studentId]);

  useEffect(() => {
    loadResponses();
  }, [loadResponses]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/student/login");
  }

  if (!authChecked) {
    return (
      <main className="min-h-screen px-6 py-10">
        <Card className="mx-auto max-w-3xl p-6 text-slate-300 sm:p-8">
          확인 중...
        </Card>
      </main>
    );
  }

  if (!student) {
    return (
      <main className="min-h-screen px-6 py-10">
        <Card className="mx-auto max-w-3xl p-6 sm:p-8">
          <p className="text-sm font-semibold text-cyan-300">학생 홈</p>

          <h1 className="mt-3 text-3xl font-bold">
            로그인된 학생 정보가 없습니다
          </h1>

          <p className="mt-4 leading-7 text-slate-300">
            학생 ID로 먼저 로그인해야 학생 활동 기록을 확인할 수 있습니다.
          </p>

          <Link
            href="/student/login"
            className={buttonClasses("primary", { className: "mt-8" })}
          >
            학생 로그인하러 가기
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-3xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan-300">학생 홈</p>

        <h1 className="mt-3 text-3xl font-bold">
          {student.name} 학생, 안녕하세요
        </h1>

        <p className="mt-4 leading-7 text-slate-300">
          로그인한 학생 계정에 쌓인 활동·성찰 기록을 한곳에서 확인하는 화면입니다.
        </p>

        <section className="mt-8 rounded-2xl border border-cyan-300/30 bg-cyan-950/30 p-6">
          <h2 className="text-xl font-bold text-cyan-100">내 학생 정보</h2>

          <div className="mt-5 space-y-3 text-slate-200">
            <p>
              <span className="font-semibold text-slate-400">이름: </span>
              {student.name}
            </p>

            <p>
              <span className="font-semibold text-slate-400">로그인 ID: </span>
              {student.loginId}
            </p>

            <p>
              <span className="font-semibold text-slate-400">학년도: </span>
              {student.schoolYear}
            </p>

            <p>
              <span className="font-semibold text-slate-400">학번: </span>
              {student.grade}학년 {student.classNumber}반{" "}
              {student.studentNumber}번
            </p>

            <p>
              <span className="font-semibold text-slate-400">
                학생 코드:{" "}
              </span>
              {student.studentCode}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              내 활동 기록{" "}
              <span className="text-base font-semibold text-slate-400">
                ({responses.length}개)
              </span>
            </h2>

            <button
              type="button"
              onClick={loadResponses}
              disabled={isLoadingResponses}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingResponses ? "불러오는 중..." : "새로고침"}
            </button>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            로그인한 학생 계정으로 저장된 활동·성찰 기록입니다. (최신순)
          </p>

          {loadError ? (
            <Alert tone="error" className="mt-5">
              기록을 불러오지 못했습니다: {loadError}
            </Alert>
          ) : null}

          {isLoadingResponses && responses.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-white/20 bg-slate-950 p-5 text-slate-400">
              활동 기록을 불러오는 중입니다...
            </div>
          ) : null}

          {!isLoadingResponses && !loadError && responses.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-white/20 bg-slate-950 p-5 text-slate-400">
              아직 제출한 활동 기록이 없습니다. 활동에 참여해 결과와 성찰을
              제출하면 여기에 쌓입니다.
            </div>
          ) : null}

          {responses.length > 0 ? (
            <ul className="mt-5 space-y-4">
              {responses.map((row) => {
                const isExpanded = expandedId === row.id;
                const data = row.response_data;
                const reflection = row.reflection_data?.reflection?.trim() ?? "";
                const hasResultData =
                  data != null && Object.keys(data).length > 0;

                const stats = [
                  { label: "실험 종류", value: data?.modeLabel ?? "-" },
                  { label: "시행 수 n", value: formatNumber(data?.n) },
                  { label: "반복 횟수", value: formatNumber(data?.repeats) },
                  { label: "성공확률 p", value: formatNumber(data?.p) },
                  {
                    label: "시뮬레이션 평균",
                    value: formatNumber(data?.observedMean),
                  },
                  {
                    label: "이론 평균 np",
                    value: formatNumber(data?.expectedMean),
                  },
                  {
                    label: "시뮬레이션 분산",
                    value: formatNumber(data?.observedVariance),
                  },
                  {
                    label: "이론 분산",
                    value: formatNumber(data?.expectedVariance),
                  },
                ];

                return (
                  <li
                    key={row.id}
                    className="rounded-xl border border-white/10 bg-slate-950 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-white">
                        {row.activities?.title ?? row.activity_slug ?? "활동"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(row.created_at)}
                      </p>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      {row.subject ? (
                        <span className="text-cyan-300">{row.subject}</span>
                      ) : null}
                      {row.activity_slug ? (
                        <span className="text-slate-400">
                          {row.activity_slug}
                        </span>
                      ) : null}
                    </div>

                    {reflection ? (
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {isExpanded ? reflection : previewText(reflection)}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-slate-400">
                        성찰 내용 없음
                      </p>
                    )}

                    {isExpanded ? (
                      <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-400">
                            해석 관점
                          </p>
                          <p className="mt-1 text-sm text-slate-200">
                            {getInterpretationLabel(
                              row.reflection_data?.interpretationType
                            )}
                          </p>
                        </div>

                        {hasResultData ? (
                          <div>
                            <p className="text-xs font-semibold text-slate-400">
                              결과 요약
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                              {stats.map((stat) => (
                                <div
                                  key={stat.label}
                                  className="rounded-lg border border-white/10 bg-slate-900 p-3"
                                >
                                  <p className="text-[11px] text-slate-400">
                                    {stat.label}
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-cyan-200">
                                    {stat.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">
                            저장된 결과 데이터가 없습니다.
                          </p>
                        )}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((current) =>
                          current === row.id ? null : row.id
                        )
                      }
                      className="mt-4 text-sm font-semibold text-cyan-300 transition hover:text-cyan-200"
                    >
                      {isExpanded ? "접기" : "자세히 보기"}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/learn" className={buttonClasses("primary")}>
            교과 학습
          </Link>

          <Link href="/join" className={buttonClasses("secondary")}>
            입장 코드로 활동 참여하기
          </Link>

          <Link href="/" className={buttonClasses("neutral")}>
            홈으로 돌아가기
          </Link>

          <Button variant="danger" onClick={handleLogout}>
            학생 로그아웃
          </Button>
        </div>
      </Card>
    </main>
  );
}