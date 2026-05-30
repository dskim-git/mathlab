"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getTabBarMenu } from "@/lib/dashboard/menus";
import { getRoleTheme, type DashboardRole } from "@/lib/dashboard/roleTheme";

type MobileTabBarProps = {
  role: DashboardRole;
};

/**
 * 모바일(lg 미만) 하단 고정 탭바. 4개 핵심 메뉴.
 * Sidebar와 동일하게 현재 경로 매칭 시 액센트 적용.
 */
export function MobileTabBar({ role }: MobileTabBarProps) {
  const pathname = usePathname();
  const theme = getRoleTheme(role);
  const items = getTabBarMenu(role);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-slate-950/95 backdrop-blur lg:hidden"
      aria-label="대시보드 탭"
    >
      <ul className="grid grid-cols-4">
        {items.slice(0, 4).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href + "/"));

          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? theme.accentText : "text-slate-400"
                }`}
              >
                <span className="text-xl" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
