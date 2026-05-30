"use client";

import { AiUsageStats } from "@/components/admin/AiUsageStats";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

export default function AdminStatsPage() {
  const theme = getRoleTheme("admin");

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>통계</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          AI 토큰 · 접속 · 활동
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          AI 사용량과 비용 추정을 누적으로 봅니다. 접속·활동 통계는 추후 추가
          예정입니다.
        </p>
      </div>

      <AiUsageStats accentText={theme.accentText} />

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-slate-300">
        <p className="text-sm font-semibold text-amber-300">앞으로 추가 예정</p>
        <p className="mt-2 text-sm">
          • 일·주·월·연 신규/중복 제외 접속자 수 <br />
          • 역할별 접속 이력 (login_logs 테이블 신설 필요) <br />
          • 교과별·활동별 수행 횟수 인기 차트 <br />
          • 유지율(이번 주 활동한 학생 비율) · 세션 활용도
        </p>
      </section>
    </>
  );
}
