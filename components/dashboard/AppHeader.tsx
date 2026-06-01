"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { LogoMark } from "@/components/brand/LogoMark";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  getRoleTheme,
  ROLE_HOME_ROUTE,
  type DashboardRole,
} from "@/lib/dashboard/roleTheme";

type AppHeaderProps = {
  role: DashboardRole; // 현재 보고 있는 화면의 역할
  userName: string;
  // 관리자 여부 (역할 뷰 전환 셀렉트 노출)
  isAdmin: boolean;
};

/**
 * 상단 고정 헤더.
 * - 좌: 로고 + 서비스명
 * - 우: 역할 뱃지 + 사용자명 + (관리자만) 역할 뷰 전환 + 로그아웃
 *
 * 학생/일반인 로그인 라우트가 다른 점에 주의 — 로그아웃 후 홈("/")으로 보낸다.
 */
export function AppHeader({ role, userName, isAdmin }: AppHeaderProps) {
  const router = useRouter();
  const theme = getRoleTheme(role);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function handleRoleViewChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as DashboardRole;
    router.push(ROLE_HOME_ROUTE[next]);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
        >
          <LogoMark className="h-7 w-7" />
          <span className="text-base font-bold tracking-tight sm:text-lg">
            MathLab
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin ? (
            <label className="hidden items-center gap-1.5 sm:flex">
              <span className="sr-only">역할 뷰 전환</span>
              <select
                aria-label="역할 뷰 전환"
                value={role}
                onChange={handleRoleViewChange}
                className="rounded-full border border-white/15 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
              >
                <option value="admin">관리자 대시보드</option>
                <option value="teacher">교사 보기</option>
                <option value="student">학생 보기</option>
                <option value="general">일반 보기</option>
              </select>
            </label>
          ) : null}

          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.badgeClass}`}
          >
            {theme.label}
          </span>

          <span className="hidden text-sm text-slate-300 sm:inline">
            <span className="font-semibold text-white">{userName}</span> 님
          </span>

          <NotificationBell />

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-red-300/40 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-300/10 outline-none focus-visible:ring-2 focus-visible:ring-red-300/40"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
