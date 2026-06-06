"use client";

import { AccessStats } from "@/components/admin/AccessStats";
import { AiUsageStats } from "@/components/admin/AiUsageStats";
import { ContentStats } from "@/components/admin/ContentStats";
import { MembershipStats } from "@/components/admin/MembershipStats";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

export default function AdminStatsPage() {
  const theme = getRoleTheme("admin");

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>통계</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          운영 규모 · 접속 · 콘텐츠 · AI
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          회원·접속·활동·AI 사용량을 한 곳에서 봅니다.
        </p>
      </div>

      <MembershipStats accentText={theme.accentText} />

      <div className="mt-8">
        <AccessStats accentText={theme.accentText} />
      </div>

      <div className="mt-8">
        <ContentStats accentText={theme.accentText} />
      </div>

      <div className="mt-8">
        <AiUsageStats accentText={theme.accentText} />
      </div>
    </>
  );
}
