"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { NoticeBoard } from "@/components/notices/NoticeBoard";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

type Counts = {
  pending: number | null;
  responses: number | null;
  sessions: number | null;
  students: number | null;
  newFeedback: number | null;
};

const initialCounts: Counts = {
  pending: null,
  responses: null,
  sessions: null,
  students: null,
  newFeedback: null,
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

    const [
      pendingRes,
      responsesRes,
      sessionsRes,
      studentsRes,
      newFeedbackRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("activity_responses")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("students")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("status", "received"),
    ]);

    const errors = [
      pendingRes.error,
      responsesRes.error,
      sessionsRes.error,
      studentsRes.error,
      newFeedbackRes.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      setErrorMessage(errors.map((e) => e?.message ?? "").join(" / "));
    }

    setCounts({
      pending: pendingRes.count ?? null,
      responses: responsesRes.count ?? null,
      sessions: sessionsRes.count ?? null,
      students: studentsRes.count ?? null,
      newFeedback: newFeedbackRes.count ?? null,
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

      {/* KPI 줄 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="가입 승인 대기"
          value={`${formatCount(counts.pending)}건`}
          valueClassName={theme.accentText}
          hint={
            counts.pending && counts.pending > 0
              ? "처리 필요 →"
              : "대기 없음 →"
          }
          href="/admin/members"
        />
        <KpiCard
          label="누적 활동 응답"
          value={`${formatCount(counts.responses)}회`}
          valueClassName="text-cyan-200"
          href="/admin/stats"
        />
        <KpiCard
          label="진행 중 세션"
          value={`${formatCount(counts.sessions)}개`}
          valueClassName="text-emerald-200"
          href="/teacher/sessions?filter=active"
        />
        <KpiCard
          label="등록 학생"
          value={`${formatCount(counts.students)}명`}
          valueClassName="text-amber-200"
          href="/admin/roster"
        />
      </div>

      {/* 데이터 부재 KPI 안내 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
        <KpiCard
          label="오늘 접속자"
          value="-"
          hint="2차(접속 이력)"
          valueClassName="text-slate-400"
          href="/admin/stats"
        />
        <KpiCard
          label="이번 주 활동"
          value="-"
          hint="2차(통계)"
          valueClassName="text-slate-400"
          href="/admin/stats"
        />
        <KpiCard
          label="성찰 작성 비율"
          value="-"
          hint="2차(통계)"
          valueClassName="text-slate-400"
          href="/admin/stats"
        />
      </div>

      {/* 기능 카드 그리드 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        <DashboardCard
          icon="👥"
          title="회원관리"
          description="가입 승인·계정·명렬표"
          href="/admin/members"
          badge={
            counts.pending && counts.pending > 0
              ? `대기 ${counts.pending}`
              : undefined
          }
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="⚙️"
          title="마스터"
          description="과목·학급·학년도"
          href="/admin/settings"
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
          icon="📊"
          title="통계"
          description="접속·활동 분석 (준비 중)"
          href="/admin/stats"
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
          icon="📚"
          title="교과 학습 보기"
          description="모든 교과 전체 열람"
          href="/learn"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="🎯"
          title="교사 대시보드"
          description="교사 화면 열람"
          href="/teacher"
          hoverBorderClass={theme.hoverBorder}
        />
      </div>

      {/* 최근 활동 (자리표시자, 추후 채움) */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <p className="text-xs font-semibold text-slate-400">최근 활동</p>
        <p className="mt-2 text-sm text-slate-400">
          신규 가입·세션 종료·신규 건의 등을 시간순으로 보여줄 예정입니다.
          (Step 6 이후)
        </p>
      </section>
    </>
  );
}
