"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { NoticeBoard } from "@/components/notices/NoticeBoard";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import {
  fetchStudentTodayLessons,
  formatTodayLabel,
  type TodayLesson,
} from "@/lib/dashboard/todayLessons";

type StudentInfo = {
  studentId: string;
  loginId: string;
  name: string;
  schoolYear: number;
  grade: number;
  classNumber: number;
  studentNumber: number;
};

type RecentResponseRow = {
  id: string;
  subject: string | null;
  activity_slug: string | null;
  created_at: string;
  activities: { title: string | null } | null;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function StudentHomePage() {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [userRole, setUserRole] = useState<"student" | "admin" | "other" | null>(
    null
  );
  const [profileName, setProfileName] = useState<string>("");
  const [authChecked, setAuthChecked] = useState(false);

  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [markedCount, setMarkedCount] = useState<number | null>(null);
  const [recent, setRecent] = useState<RecentResponseRow[]>([]);
  const [todayLessons, setTodayLessons] = useState<TodayLesson[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setAuthChecked(true);
        return;
      }

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", user.id)
        .maybeSingle();
      const profile = profileRow as { role: string; name: string } | null;
      if (active) {
        setProfileName(profile?.name ?? "");
        if (profile?.role === "admin") setUserRole("admin");
        else if (profile?.role === "student") setUserRole("student");
        else setUserRole("other");
      }

      const { data: studentRow } = await supabase
        .from("students")
        .select(
          "id, school_year, student_login_id, grade, class_number, student_number, profiles ( name )"
        )
        .eq("profile_id", user.id)
        .maybeSingle();
      if (!active) return;
      const row = studentRow as unknown as {
        id: string;
        school_year: number;
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
              name: row.profiles?.name ?? profile?.name ?? "",
              schoolYear: row.school_year,
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

  const loadStats = useCallback(async () => {
    if (!studentId) return;
    const [countRes, markedRes, recentRes] = await Promise.all([
      supabase
        .from("activity_responses")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId),
      supabase
        .from("reflection_priority")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("marked", true),
      supabase
        .from("activity_responses")
        .select(
          "id, subject, activity_slug, created_at, activities ( title )"
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    setTotalCount(countRes.count ?? 0);
    setMarkedCount(markedRes.count ?? 0);
    setRecent((recentRes.data ?? []) as unknown as RecentResponseRow[]);
  }, [studentId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const studentGrade = student?.grade;
  const studentClassNumber = student?.classNumber;

  useEffect(() => {
    let active = true;
    if (studentGrade == null || studentClassNumber == null) {
      setTodayLessons(null);
      return;
    }
    (async () => {
      const rows = await fetchStudentTodayLessons(supabase, {
        grade: studentGrade,
        classNumber: studentClassNumber,
      });
      if (active) setTodayLessons(rows);
    })();
    return () => {
      active = false;
    };
  }, [studentGrade, studentClassNumber]);

  if (!authChecked) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
        확인 중...
      </div>
    );
  }

  const displayName = student?.name ?? profileName ?? "";
  const isAdmin = userRole === "admin";
  const theme = getRoleTheme("student");

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>학생 홈</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {displayName ? `${displayName} 학생, 안녕하세요 👋` : "안녕하세요 👋"}
        </h1>
        {student ? (
          <p className="mt-1 text-sm text-slate-400">
            {student.schoolYear}학년도 · {student.grade}학년{" "}
            {student.classNumber}반 {student.studentNumber}번 · 로그인 ID{" "}
            {student.loginId}
          </p>
        ) : isAdmin ? (
          <p className="mt-1 text-sm text-amber-300">
            관리자 계정으로 학생 화면을 보고 있습니다 (읽기 전용).
          </p>
        ) : null}
      </div>

      <NoticeBoard accentText={theme.accentText} />

      {/* KPI */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="누적 활동"
          value={totalCount == null ? "···" : `${totalCount}회`}
          valueClassName={theme.accentText}
          href="/student/records"
        />
        <KpiCard
          label="별표 성찰"
          value={markedCount == null ? "···" : `${markedCount}개`}
          hint="생기부 후보 →"
          valueClassName="text-amber-200"
          href="/student/reflections"
        />
        <KpiCard
          label="이번 주 활동"
          value="-"
          hint="교과 학습 →"
          valueClassName="text-slate-400"
          href="/learn"
        />
        <KpiCard
          label="이어보기"
          value="-"
          hint="교과 학습 →"
          valueClassName="text-slate-400"
          href="/learn"
        />
      </div>

      {/* 오늘의 수업 — 같은 학급(grade+class_number)의 progress_tracker 오늘 행 */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-400">오늘의 수업</p>
            <p className="mt-1 text-sm text-slate-300">{formatTodayLabel()}</p>
          </div>
        </div>

        {student == null ? (
          <p className="mt-3 text-sm text-slate-400">
            학생 정보가 없어 오늘의 수업을 불러올 수 없습니다.
          </p>
        ) : todayLessons == null ? (
          <p className="mt-3 text-sm text-slate-400">불러오는 중...</p>
        ) : todayLessons.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            오늘 예정된 수업이 없습니다.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {todayLessons.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-white/10 bg-slate-950/60 p-3"
              >
                <span className={`text-xs font-semibold ${theme.accentText}`}>
                  {row.subject}
                </span>
                <p className="mt-1 text-sm font-semibold text-white">
                  {row.lesson_topic || (
                    <span className="text-slate-500">(주제 미입력)</span>
                  )}
                </p>
                {row.notes ? (
                  <p className="mt-1 text-xs text-slate-400 whitespace-pre-wrap">
                    {row.notes}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 기능 카드 그리드 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        <DashboardCard
          icon="📚"
          title="교과 학습"
          description="단원별 수업 자료"
          href="/learn"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="📝"
          title="내 활동"
          description={
            totalCount != null ? `누적 ${totalCount}개` : "활동 기록·결과"
          }
          href="/student/records"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="💭"
          title="내 성찰"
          description={
            markedCount != null ? `별표 ${markedCount}개` : "생기부 후보 모음"
          }
          href="/student/reflections"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="🎯"
          title="입장코드"
          description="수업 참여"
          href="/join"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="💡"
          title="건의 보내기"
          description="오류·활동 건의"
          href="/student/feedback"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="👤"
          title="내 정보"
          description="비밀번호 변경 등"
          href="/student/profile"
          hoverBorderClass={theme.hoverBorder}
        />
      </div>

      {/* 최근 3건 미리보기 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold">최근 활동</h2>
          <Link
            href="/student/records"
            className={`text-xs font-semibold transition ${theme.accentText} hover:opacity-80`}
          >
            전체 보기 →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            아직 제출한 활동이 없습니다.{" "}
            <Link href="/learn" className={theme.accentText}>
              교과 학습
            </Link>{" "}
            에서 활동을 해보세요.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">
                    {row.activities?.title ??
                      row.activity_slug ??
                      "활동"}
                  </span>
                  {row.subject ? (
                    <span className={`text-xs ${theme.accentText}`}>
                      {row.subject}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-slate-400">
                  {formatDateTime(row.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
