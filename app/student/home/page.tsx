"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { NoticeBoard } from "@/components/notices/NoticeBoard";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { startOfThisWeekMonday } from "@/lib/dashboard/progressDates";
import { shortActivityTitle } from "@/lib/activities/activityTitles";

type StudentInfo = {
  studentId: string;
  loginId: string;
  name: string;
  schoolYear: number;
  grade: number;
  classNumber: number;
  studentNumber: number;
};

type RecentVisitRow = {
  id: number;
  activity_slug: string;
  subject: string | null;
  visited_at: string;
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
  const [reflectionCount, setReflectionCount] = useState<number | null>(null);
  const [markedCount, setMarkedCount] = useState<number | null>(null);
  const [weeklyCount, setWeeklyCount] = useState<number | null>(null);
  const [recent, setRecent] = useState<RecentVisitRow[]>([]);
  const [accessibleSubjects, setAccessibleSubjects] = useState<string[]>([]);
  const [lastUnit, setLastUnit] = useState<
    { subject: string; unit_key: string; unit_title: string } | null
  >(null);

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
          "id, school_year, student_login_id, grade, class_number, student_number, profiles!profile_id ( name )"
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
  const studentGrade = student?.grade;
  const studentClassNumber = student?.classNumber;
  const isAdmin = userRole === "admin";

  // KPI 카운트들 — activity_visits 기반(누적/이번주) + reflection_priority(별표).
  const loadStats = useCallback(async () => {
    if (!studentId) return;
    const weekStartIso = startOfThisWeekMonday().toISOString();
    const [
      {
        data: { user },
      },
      totalRes,
      weeklyRes,
      reflectionRes,
      markedRes,
      recentRes,
    ] = await Promise.all([
      supabase.auth.getUser(),
      // 누적 활동(visits 전체) — 본인만(RLS 자체 제한).
      supabase
        .from("activity_visits")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("activity_visits")
        .select("id", { count: "exact", head: true })
        .gte("visited_at", weekStartIso),
      // 내 성찰 총수(제출한 응답 개수) — activity_responses.
      supabase
        .from("activity_responses")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId),
      // 별표 성찰 — 본인이 마킹한 reflection_priority.
      supabase
        .from("reflection_priority")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("marked", true),
      // 최근 활동 미리보기 — 활동 슬러그 + 시각(visits).
      supabase
        .from("activity_visits")
        .select("id, activity_slug, subject, visited_at")
        .order("visited_at", { ascending: false })
        .limit(3),
    ]);

    // user 는 위에서 RLS 가 알아서 본인 행만 카운트하므로 별도 안 씀.
    void user;
    setTotalCount(totalRes.count ?? 0);
    setWeeklyCount(weeklyRes.count ?? 0);
    setReflectionCount(reflectionRes.count ?? 0);
    setMarkedCount(markedRes.count ?? 0);
    setRecent((recentRes.data ?? []) as RecentVisitRow[]);
  }, [studentId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // 접근 가능한 교과(학생=학급 권한, 관리자=전체) — Hero 칩 그리드.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: allSubj } = await supabase
        .from("subjects")
        .select("name, order_index")
        .order("order_index");
      const all = (allSubj ?? []) as Array<{ name: string; order_index: number }>;

      if (isAdmin) {
        if (active) setAccessibleSubjects(all.map((s) => s.name));
        return;
      }
      if (studentGrade == null || studentClassNumber == null) {
        if (active) setAccessibleSubjects([]);
        return;
      }
      const { data: perms } = await supabase
        .from("class_subject_permissions")
        .select("subject")
        .eq("grade", studentGrade)
        .eq("class_number", studentClassNumber);
      const allowed = new Set(
        ((perms ?? []) as Array<{ subject: string }>).map((r) => r.subject)
      );
      if (active)
        setAccessibleSubjects(all.filter((s) => allowed.has(s.name)).map((s) => s.name));
    })();
    return () => {
      active = false;
    };
  }, [isAdmin, studentGrade, studentClassNumber]);

  // 이어보기 — /learn 에서 마지막으로 본 잎(소단원)
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user) return;
      const { data } = await supabase
        .from("learning_progress")
        .select("subject, unit_key, unit_title")
        .eq("profile_id", user.id)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      const row = data as {
        subject: string;
        unit_key: string;
        unit_title: string;
      } | null;
      setLastUnit(row);
    })();
  }, []);

  if (!authChecked) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
        확인 중...
      </div>
    );
  }

  const displayName = student?.name ?? profileName ?? "";
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

      {/* Hero — 내 교과 바로가기. 학생 학습 동선의 첫 진입점. */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-300/10 via-white/5 to-transparent p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className={`text-xs font-semibold ${theme.accentText}`}>
              내 교과
            </p>
            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
              교과를 선택해 학습을 시작하세요
            </h2>
          </div>
          <Link
            href="/learn"
            className="text-xs font-semibold text-slate-400 transition hover:text-white"
          >
            전체 교과 학습 →
          </Link>
        </div>

        {accessibleSubjects.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            접근 가능한 교과가 없습니다. 관리자에게 교과 접근 권한을 요청해 주세요.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {accessibleSubjects.map((s) => (
              <Link
                key={s}
                href={`/learn?subject=${encodeURIComponent(s)}`}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 transition hover:-translate-y-0.5 hover:border-emerald-300/50 hover:bg-slate-950"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300/15 text-xl">
                  📘
                </span>
                <span className="text-sm font-semibold text-white group-hover:text-emerald-100">
                  {s}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 1행 3개 — 활동·성찰·이어보기 (KPI 카드, 누적·이번주를 한 카드에 묶어 표시) */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        <KpiCard
          label="내 활동 (이번 주 활동)"
          value={
            <span>
              {totalCount == null ? "···" : `${totalCount}회`}
              <span className="ml-2 text-lg text-amber-200 sm:text-xl">
                ({weeklyCount == null ? "···" : `${weeklyCount}회`})
              </span>
            </span>
          }
          valueClassName={theme.accentText}
          hint="학습 이력 →"
          href="/student/activity"
        />
        <KpiCard
          label="내 성찰 (별표 성찰)"
          value={
            <span>
              {reflectionCount == null ? "···" : `${reflectionCount}개`}
              <span className="ml-2 text-lg text-amber-200 sm:text-xl">
                ({markedCount == null ? "···" : `${markedCount}개`})
              </span>
            </span>
          }
          valueClassName={theme.accentText}
          hint="응답·생기부 후보 →"
          href="/student/reflections"
        />
        <KpiCard
          label="이어보기"
          value={
            lastUnit ? (
              <span className="block break-keep text-lg leading-snug sm:text-xl">
                {lastUnit.unit_title}
              </span>
            ) : (
              "—"
            )
          }
          hint={
            lastUnit ? `${lastUnit.subject} →` : "교과 학습에서 시작 →"
          }
          valueClassName={
            lastUnit ? theme.accentText : "text-slate-400"
          }
          href={
            lastUnit
              ? `/learn?subject=${encodeURIComponent(
                  lastUnit.subject
                )}&unit=${encodeURIComponent(lastUnit.unit_key)}`
              : "/learn"
          }
        />
      </div>

      {/* 2행 2개 — 건의·내 정보. 관리자·교사 대시보드와 같은 5컬럼 그리드로 카드 크기 통일.
          우측 3칸은 빈 공간(후속 사용 예정). */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
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

      {/* 최근 활동 — visits 최근 3건 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold">최근 활동</h2>
          <Link
            href="/student/activity"
            className={`text-xs font-semibold transition ${theme.accentText} hover:opacity-80`}
          >
            전체 보기 →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            아직 학습 이력이 없습니다.{" "}
            <Link href="/learn" className={theme.accentText}>
              교과 학습
            </Link>{" "}
            에서 활동을 시작해 보세요.
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
                    {shortActivityTitle(row.activity_slug)}
                  </span>
                  {row.subject ? (
                    <span className={`text-xs ${theme.accentText}`}>
                      {row.subject}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-slate-400">
                  {formatDateTime(row.visited_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
