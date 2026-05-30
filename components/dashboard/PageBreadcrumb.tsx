"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import {
  ROUTE_LABELS,
  ROUTE_PARENTS,
  ROUTE_TAIL_LABELS,
} from "@/lib/dashboard/menus";
import {
  getRoleTheme,
  ROLE_HOME_ROUTE,
  type DashboardRole,
} from "@/lib/dashboard/roleTheme";

type Props = {
  role: DashboardRole;
};

function lastSegment(path: string) {
  const i = path.lastIndexOf("/");
  return i >= 0 ? path.slice(i + 1) : path;
}

function parentOf(path: string): string {
  // 1) 명시적 부모(논리 계층) 우선
  const explicit = ROUTE_PARENTS[path];
  if (explicit) return explicit;
  // 2) URL 한 칸씩 위로 올라가되, ROUTE_LABELS 에 등록된(=페이지 있는)
  //    가장 가까운 경로를 부모로 한다. 페이지 없는 중간 segment(예: /student)
  //    는 클릭 시 404 가 나므로 건너뛴다.
  let p = path;
  while (true) {
    const i = p.lastIndexOf("/");
    if (i <= 0) return "";
    p = p.slice(0, i);
    if (ROUTE_LABELS[p]) return p;
  }
}

function labelFor(path: string): string {
  if (ROUTE_LABELS[path]) return ROUTE_LABELS[path];
  const seg = lastSegment(path);
  if (ROUTE_TAIL_LABELS[seg]) return ROUTE_TAIL_LABELS[seg];
  // 동적 세그먼트(UUID·숫자 등): 너무 길면 축약
  return seg.length > 12 ? seg.slice(0, 6) + "…" : seg;
}

/**
 * 윈도우 탐색기식 브래드크럼.
 *  - 현재 경로에서 시작해 ROUTE_PARENTS 가 정의돼 있으면 그쪽 체인을, 없으면 URL 한 칸 위로
 *    재귀적으로 올라가며 역할 홈에 도달할 때까지 누적.
 *  - 각 칸은 클릭 가능한 링크(현재 페이지 칸은 강조).
 *  - 첫 칸은 항상 "{역할} 홈".
 */
export function PageBreadcrumb({ role }: Props) {
  const pathname = usePathname();
  const homeRoute = ROLE_HOME_ROUTE[role];
  const theme = getRoleTheme(role);

  if (pathname === homeRoute) return null;

  const trail: string[] = [];
  const seen = new Set<string>();
  let cur = pathname;
  // 안전 가드 — 무한 루프 방지(잘못된 ROUTE_PARENTS 등)
  while (cur && cur !== homeRoute && !seen.has(cur) && trail.length < 12) {
    seen.add(cur);
    trail.unshift(cur);
    cur = parentOf(cur);
  }

  return (
    <nav
      className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm"
      aria-label="브래드크럼"
    >
      <Link
        href={homeRoute}
        className="text-slate-400 transition hover:text-white"
      >
        {theme.label} 홈
      </Link>
      {trail.map((path, idx) => {
        const isLast = idx === trail.length - 1;
        return (
          <Fragment key={path}>
            <span className="text-slate-600" aria-hidden>
              ›
            </span>
            {isLast ? (
              <span className={`font-semibold ${theme.accentText}`}>
                {labelFor(path)}
              </span>
            ) : (
              <Link
                href={path}
                className="text-slate-400 transition hover:text-white"
              >
                {labelFor(path)}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
