import Link from "next/link";
import type { ReactNode } from "react";

type DashboardCardProps = {
  icon: string; // 이모지 1자 권장. 추후 SVG 컴포넌트 교체 가능.
  title: string;
  description?: string;
  href?: string;
  // 우측 상단 작은 KPI/뱃지 — "대기 3건" 등
  badge?: ReactNode;
  // 카드 hover 시 강조 색 (역할 액센트). 기본 cyan.
  hoverBorderClass?: string;
};

/**
 * 대시보드 기능 카드. 클릭 시 href 로 이동. 호버 시 살짝 들리고 액센트 보더.
 *
 *   <DashboardCard icon="📅" title="진도표" description="이번 주 12칸" href="/teacher/progress" />
 */
export function DashboardCard({
  icon,
  title,
  description,
  href,
  badge,
  hoverBorderClass = "hover:border-cyan-300/40",
}: DashboardCardProps) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl sm:text-3xl" aria-hidden>
          {icon}
        </span>
        {badge ? (
          <span className="text-[11px] font-semibold text-slate-300">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-base font-bold text-white sm:text-lg">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">{description}</p>
      ) : null}
    </>
  );

  const baseClass =
    `block rounded-2xl border border-white/10 bg-white/5 p-4 transition ` +
    `hover:-translate-y-0.5 hover:bg-white/[0.07] ${hoverBorderClass} ` +
    `sm:p-5 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70`;

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {inner}
      </Link>
    );
  }

  // href 없으면 비활성처럼 보이도록 (준비 중 카드)
  return (
    <div className={`${baseClass} cursor-default opacity-60`}>{inner}</div>
  );
}
