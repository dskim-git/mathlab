"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMenu } from "@/lib/dashboard/menus";
import { getRoleTheme, type DashboardRole } from "@/lib/dashboard/roleTheme";

type SidebarProps = {
  role: DashboardRole;
};

/**
 * 데스크톱(lg+) 좌측 사이드바.
 * 현재 경로와 매칭되는 항목에 액센트(역할별 컬러)를 입힌다.
 * 모바일에서는 PageShell이 hidden 처리하고 하단 탭바를 대신 노출한다.
 */
export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const theme = getRoleTheme(role);
  const items = getMenu(role);

  return (
    <aside
      className="hidden w-56 shrink-0 border-r border-white/10 bg-slate-950/40 px-3 py-6 lg:block"
      aria-label="대시보드 메뉴"
    >
      <nav className="flex flex-col gap-1">
        {items.map((item, idx) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));

          const activeClass = isActive
            ? `${theme.accentBg} ${theme.accentText} border-l-2 ${theme.accentBorder}`
            : "text-slate-300 hover:bg-white/5 border-l-2 border-transparent";

          // 그룹 경계 — 이전 항목과 group 이 다르면 구분선 삽입 (첫 항목 제외).
          const prevGroup = idx > 0 ? items[idx - 1].group : null;
          const groupChanged =
            idx > 0 && item.group != null && item.group !== prevGroup;

          return (
            <div key={item.key}>
              {groupChanged ? (
                <div className="my-2 border-t border-white/10" aria-hidden />
              ) : null}
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-r-lg px-3 py-2 text-sm font-medium transition ${activeClass}`}
              >
                <span className="text-base" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
