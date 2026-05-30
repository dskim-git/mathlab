"use client";

import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AiSebteukToggleList } from "@/components/admin/AiSebteukToggleList";
import { AiModelAllowList } from "@/components/admin/AiModelAllowList";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

export default function AdminAccessPage() {
  const theme = getRoleTheme("admin");

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>교과 권한</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          교사 · 학생 · 일반인 교과 접근 관리
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          각 역할이 어떤 교과에 접근할 수 있는지를 설정합니다. 통합 화면은 Step
          8 단계에서 정리되며, 현재는 기존 페이지로 진입합니다.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        <DashboardCard
          icon="🧑‍🏫"
          title="교사 권한"
          description="담당 학급·과목 + AI세특 권한"
          href="/admin/teachers"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="🎓"
          title="학생·일반인 교과 접근"
          description="학급/개인 단위 교과 허용"
          href="/admin/subjects"
          hoverBorderClass={theme.hoverBorder}
        />
      </div>

      <div className="mb-6">
        <AiSebteukToggleList accentText={theme.accentText} />
      </div>

      <div className="mb-6">
        <AiModelAllowList accentText={theme.accentText} />
      </div>

      <section className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-5">
        <p className={`text-xs font-semibold ${theme.accentText}`}>
          통합 안내
        </p>
        <p className="mt-2 text-sm text-slate-300">
          교사 권한(현재 <Link className="underline" href="/admin/teachers">/admin/teachers</Link>)
          과 학생·일반인 교과 접근(현재 <Link className="underline" href="/admin/subjects">/admin/subjects</Link>)
          은 추후 이 페이지 안에서 탭으로 통합될 예정입니다.
        </p>
      </section>
    </>
  );
}
