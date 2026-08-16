"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { NoticeBoard } from "@/components/notices/NoticeBoard";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { startOfThisWeekMonday } from "@/lib/dashboard/progressDates";

function todayKst(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// 관리자 대시보드 5행 구성:
//   1행 통계 KPI (4): 오늘접속자·이번주 활동·성찰 작성 비율·새 건의사항
//   2행 회원 (3):     가입승인·회원관리·설정
//   3행 학생·그룹 (3): 교과권한·명렬표·수업그룹
//   4행 콘텐츠·교사 도구 (5): 교과학습관리·단원관리·교사대시보드·학생활동기록·AI세특
//   5행 소통·분석 (3): 통계·건의사항·설문

type Counts = {
  pending: number | null;
  newFeedback: number | null;
  todayLogins: number | null;
  weeklyVisits: number | null;
  /** 옵션 2 학생 단위 비율 (이번 주 방문한 학생 중 응답까지 한 학생 %). null=계산 전, 0~100. */
  reflectionRatio: number | null;
};

const initialCounts: Counts = {
  pending: null,
  newFeedback: null,
  todayLogins: null,
  weeklyVisits: null,
  reflectionRatio: null,
};

function formatCount(value: number | null) {
  if (value == null) return "···";
  return value.toLocaleString("ko-KR");
}

export default function AdminHomePage() {
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    setErrorMessage("");
    const today = todayKst();
    const weekStartIso = startOfThisWeekMonday().toISOString();

    // count 쿼리들 — RLS 관리자 ALL 로 전체 카운트.
    const [
      pendingRes,
      newFeedbackRes,
      todayLoginsRes,
      weeklyVisitsRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("status", "received"),
      supabase
        .from("login_logs")
        .select("id", { count: "exact", head: true })
        .eq("log_date", today),
      supabase
        .from("activity_visits")
        .select("id", { count: "exact", head: true })
        .gte("visited_at", weekStartIso),
    ]);

    // 성찰 작성 비율(학생 단위) — 이번 주 활동한 학생 중 응답까지 한 학생.
    //   1) activity_visits 의 이번 주 distinct profile_id 집합(분모)
    //   2) activity_responses 의 이번 주 distinct student_id → students.profile_id 변환 집합(분자)
    //   분모=0 이면 비율 null.
    const [visitProfilesRes, responseStudentsRes] = await Promise.all([
      supabase
        .from("activity_visits")
        .select("profile_id")
        .gte("visited_at", weekStartIso),
      supabase
        .from("activity_responses")
        .select("student_id")
        .gte("created_at", weekStartIso),
    ]);
    const visitProfiles = new Set(
      ((visitProfilesRes.data ?? []) as Array<{ profile_id: string }>).map(
        (r) => r.profile_id
      )
    );
    const respondedStudentIds = Array.from(
      new Set(
        ((responseStudentsRes.data ?? []) as Array<{ student_id: string }>).map(
          (r) => r.student_id
        )
      )
    );
    let respondedProfiles = new Set<string>();
    if (respondedStudentIds.length > 0) {
      const { data: stuRows } = await supabase
        .from("students")
        .select("id, profile_id")
        .in("id", respondedStudentIds);
      respondedProfiles = new Set(
        ((stuRows ?? []) as Array<{ profile_id: string }>).map(
          (r) => r.profile_id
        )
      );
    }
    const denom = visitProfiles.size;
    let reflectionRatio: number | null = null;
    if (denom > 0) {
      let respondedCount = 0;
      for (const pid of visitProfiles) {
        if (respondedProfiles.has(pid)) respondedCount += 1;
      }
      reflectionRatio = Math.round((respondedCount / denom) * 100);
    }

    const errors = [
      pendingRes.error,
      newFeedbackRes.error,
      todayLoginsRes.error,
      weeklyVisitsRes.error,
      visitProfilesRes.error,
      responseStudentsRes.error,
    ].filter(Boolean);
    if (errors.length > 0) {
      setErrorMessage(errors.map((e) => e?.message ?? "").join(" / "));
    }

    setCounts({
      pending: pendingRes.count ?? null,
      newFeedback: newFeedbackRes.count ?? null,
      todayLogins: todayLoginsRes.count ?? null,
      weeklyVisits: weeklyVisitsRes.count ?? null,
      reflectionRatio,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const theme = getRoleTheme("admin");

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>
          관리자 대시보드
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          MathLab 운영 현황
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          시스템 핵심 지표와 빠른 진입을 한곳에 모았습니다.
        </p>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-red-300/30 bg-red-950/30 p-4 text-sm text-red-200">
          일부 지표를 불러오지 못했습니다: {errorMessage}
        </div>
      ) : null}

      <NoticeBoard accentText={theme.accentText} />

      {/* 1행 — 통계 KPI 4 */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="오늘 접속자"
          value={`${formatCount(counts.todayLogins)}명`}
          valueClassName={theme.accentText}
          hint="통계 →"
          href="/admin/stats"
        />
        <KpiCard
          label="이번 주 활동"
          value={`${formatCount(counts.weeklyVisits)}회`}
          valueClassName="text-cyan-200"
          hint="통계 →"
          href="/admin/stats"
        />
        <KpiCard
          label="성찰 작성 비율"
          value={
            counts.reflectionRatio == null
              ? "···"
              : `${counts.reflectionRatio}%`
          }
          valueClassName="text-emerald-200"
          hint="이번 주(학생 단위) →"
          href="/admin/stats"
        />
        <KpiCard
          label="새 건의 사항"
          value={`${formatCount(counts.newFeedback)}건`}
          valueClassName={
            counts.newFeedback && counts.newFeedback > 0
              ? "text-rose-200"
              : "text-slate-300"
          }
          hint={
            counts.newFeedback && counts.newFeedback > 0
              ? "검토 필요 →"
              : "접수 없음 →"
          }
          href="/admin/feedback"
        />
      </div>

      {/* 2행 — 회원 (3) */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard
          icon="🕒"
          title="가입 승인 대기"
          description={
            counts.pending != null
              ? `${counts.pending}명 대기`
              : "신규 가입 처리"
          }
          href="/admin/members"
          badge={
            counts.pending && counts.pending > 0
              ? `대기 ${counts.pending}`
              : undefined
          }
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="👥"
          title="회원관리"
          description="전체 회원 · 검색·필터"
          href="/admin/members"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="⚙️"
          title="설정"
          description="과목·학급·학년도"
          href="/admin/settings"
          hoverBorderClass={theme.hoverBorder}
        />
      </div>

      {/* 3행 — 학생·그룹 (4) */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard
          icon="🏫"
          title="수업 관리"
          description="학년도·학기·교과별 수강생"
          href="/admin/courses"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="🔐"
          title="교과 권한"
          description="교사·학생·일반인 접근"
          href="/admin/access"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="📋"
          title="명렬표"
          description="CSV 업로드 · 학년도별"
          href="/admin/roster"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="👨‍👩‍👧"
          title="수업 그룹"
          description="영재 등 별도 수업 단위"
          href="/admin/groups"
          hoverBorderClass={theme.hoverBorder}
        />
      </div>

      {/* 4행 — 콘텐츠·교사 도구 (5) */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard
          icon="📚"
          title="교과 학습 관리"
          description="모든 교과 전체 열람·점검"
          href="/learn"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="🗂️"
          title="단원 관리"
          description="대·중·소단원 + 콘텐츠 블록"
          href="/admin/curriculum"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="🎯"
          title="교사 대시보드"
          description="교사 화면 미리보기"
          href="/teacher"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="🎒"
          title="학생 활동 기록"
          description="옛·새 성찰 모음 + profile"
          href="/admin/students"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="🤖"
          title="AI 세특"
          description="학생별 세특 초안 생성"
          href="/admin/sebteuk"
          hoverBorderClass={theme.hoverBorder}
        />
      </div>

      {/* 5행 — 소통·분석 (3) */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard
          icon="📊"
          title="통계"
          description="접속·활동 분석"
          href="/admin/stats"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="💬"
          title="건의사항"
          description="오류 제보·활동 건의 처리"
          href="/admin/feedback"
          badge={
            counts.newFeedback && counts.newFeedback > 0
              ? `접수 ${counts.newFeedback}`
              : undefined
          }
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="📝"
          title="설문"
          description="사전·사후 설문 + 분석"
          href="/admin/surveys"
          hoverBorderClass={theme.hoverBorder}
        />
      </div>

      {/* 최근 활동 (자리표시자, 추후 채움) */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <p className="text-xs font-semibold text-slate-400">최근 활동</p>
        <p className="mt-2 text-sm text-slate-400">
          신규 가입·세션 종료·신규 건의 등을 시간순으로 보여줄 예정입니다.
        </p>
      </section>
    </>
  );
}
