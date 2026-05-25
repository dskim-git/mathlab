import type { ComponentProps } from "react";

/**
 * 공통 카드 표면(다크 테마 반투명 패널). 패딩은 호출부에서 className 으로 지정한다
 * (인증 카드 p-6 sm:p-8, 작은 카드 p-5 등 화면마다 다르므로).
 */
export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 ${className}`}
      {...props}
    />
  );
}
