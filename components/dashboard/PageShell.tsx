"use client";

import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { Sidebar } from "./Sidebar";
import { MobileTabBar } from "./MobileTabBar";
import { PageBreadcrumb } from "./PageBreadcrumb";
import type { DashboardRole } from "@/lib/dashboard/roleTheme";

type PageShellProps = {
  role: DashboardRole;
  userName: string;
  isAdmin: boolean;
  children: ReactNode;
};

/**
 * 4역할 공용 대시보드 셸: 상단 헤더 + 좌측 사이드바(lg+) + 하단 탭바(모바일) + 본문.
 * 본문 영역은 모바일에서 하단 탭바 높이만큼 padding-bottom 을 가진다.
 *
 *   <PageShell role="student" userName="이서연" isAdmin={false}>
 *     ...본문 카드 그리드...
 *   </PageShell>
 */
export function PageShell({
  role,
  userName,
  isAdmin,
  children,
}: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader role={role} userName={userName} isAdmin={isAdmin} />
      <div className="flex flex-1">
        <Sidebar role={role} />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto max-w-7xl">
            <PageBreadcrumb role={role} />
            {children}
          </div>
        </main>
      </div>
      <MobileTabBar role={role} />
    </div>
  );
}
