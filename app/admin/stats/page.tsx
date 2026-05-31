"use client";

import { AiUsageStats } from "@/components/admin/AiUsageStats";
import { AccessStats } from "@/components/admin/AccessStats";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

export default function AdminStatsPage() {
  const theme = getRoleTheme("admin");

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>통계</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          접속 · 활동 · AI 토큰
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          일자별 접속자와 AI 사용량·비용 추정을 누적으로 봅니다.
        </p>
      </div>

      <AccessStats accentText={theme.accentText} />

      <div className="mt-8">
        <AiUsageStats accentText={theme.accentText} />
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-slate-300">
        <p className="text-sm font-semibold text-amber-300">앞으로 추가 예정</p>
        <p className="mt-2 text-sm">
          • 교과별·활동별 수행 횟수 인기 차트 <br />
          • 유지율(이번 주 활동한 학생 비율) · 세션 활용도 <br />
          • 역할별 접속 이력 세분(현재는 전체 합계만)
        </p>
      </section>
    </>
  );
}
