import Link from "next/link";
import type { ReactNode } from "react";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  // 강조 텍스트 색 (역할별 액센트 등). 기본 cyan-200.
  valueClassName?: string;
  // 있으면 카드 전체가 클릭 가능한 링크가 된다 (hover 시 들림).
  href?: string;
};

const baseClass =
  "rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5";
const linkInteractive =
  "block transition hover:-translate-y-0.5 hover:bg-white/[0.07] hover:border-white/20 " +
  "outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70";

/**
 * 대시보드 상단 KPI 카드. 작은 라벨 + 큰 숫자 + 선택적 보조 텍스트.
 * href 가 있으면 카드 전체가 링크가 된다.
 */
export function KpiCard({
  label,
  value,
  hint,
  valueClassName = "text-cyan-200",
  href,
}: KpiCardProps) {
  const inner = (
    <>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold sm:text-3xl ${valueClassName}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${baseClass} ${linkInteractive}`}>
        {inner}
      </Link>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}
