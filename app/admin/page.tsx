"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { NoticeBoard } from "@/components/notices/NoticeBoard";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

// 관리자 대시보드 4행 구성 (사용자 결정):
//   1행 통계 KPI (4): 오늘접속자·이번주 활동·성찰 작성 비율·새 건의사항
//                   — 처음 3개는 /admin/stats 로 (실데이터 매핑은 후속)
//   2행 회원 관리 (5): 가입승인 대기·회원관리·설정·교과권한·명렬표
//   3행 교과 (2):     교과 학습 관리·교사 대시보드
//   4행 기타 (2):     통계·건의사항

type Counts = {
  pending: number | null;
  newFeedback: number | null;
};

const initialCounts: Counts = {
  pending: null,
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

    const [pendingRes, newFeedbackRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("status", "received"),
    ]);

    const errors = [pendingRes.error, newFeedbackRes.error].filter(Boolean);
    if (errors.length > 0) {
      setErrorMessage(errors.map((e) => e?.message ?? "").join(" / "));
    }

    setCounts({
      pending: pendingRes.count ?? null,
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

      {/* 1행 — 통계 KPI 4 */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="오늘 접속자"
          value="-"
          hint="통계 →"
          valueClassName="text-slate-400"
          href="/admin/stats"
        />
        <KpiCard
          label="이번 주 활동"
          value="-"
          hint="통계 →"
          valueClassName="text-slate-400"
          href="/admin/stats"
        />
        <KpiCard
          label="성찰 작성 비율"
          value="-"
          hint="통계 →"
          valueClassName="text-slate-400"
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

      {/* 2행 — 회원 관리 5 */}
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
      </div>

      {/* 3행 — 교과 2. 2행과 같은 5컬럼 그리드라 카드 크기 일정. 우측 3칸은 빈 공간(후속). */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard
          icon="📚"
          title="교과 학습 관리"
          description="모든 교과 전체 열람·점검"
          href="/learn"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="🎯"
          title="교사 대시보드"
          description="교사 화면 미리보기"
          href="/teacher"
          hoverBorderClass={theme.hoverBorder}
        />
      </div>

      {/* 4행 — 기타 2. 동일한 5컬럼 그리드, 우측 3칸 빈 공간. */}
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
