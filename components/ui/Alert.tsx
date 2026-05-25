import type { ReactNode } from "react";

type AlertTone = "error" | "info" | "success";

const toneClasses: Record<AlertTone, string> = {
  error: "border-red-400/30 bg-red-950/40 text-red-200",
  info: "border-cyan-300/30 bg-cyan-950/30 text-cyan-100",
  success: "border-green-400/30 bg-green-950/30 text-green-200",
};

/** 폼 에러(error) / 안내 강조(info) 박스. */
export function Alert({
  tone = "error",
  className = "",
  children,
}: {
  tone?: AlertTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm ${toneClasses[tone]} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
