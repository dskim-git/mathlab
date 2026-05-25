import type { ComponentProps } from "react";

type ButtonVariant = "primary" | "secondary" | "neutral" | "danger";
type ButtonSize = "sm" | "md";

const baseClasses =
  "inline-flex items-center justify-center rounded-full font-semibold transition outline-none " +
  "focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-cyan-300 text-slate-950 hover:bg-cyan-200",
  secondary: "border border-cyan-300/40 text-cyan-200 hover:bg-cyan-300/10",
  neutral: "border border-white/20 text-white hover:bg-white/10",
  danger: "border border-red-300/40 text-red-200 hover:bg-red-300/10",
};

/**
 * 버튼 스타일 문자열. <button> 이 아닌 <Link> 등에 같은 모양을 입힐 때 사용한다.
 *   <Link href="..." className={buttonClasses("secondary", { size: "sm" })}>...
 */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  options?: { size?: ButtonSize; fullWidth?: boolean; className?: string }
) {
  return [
    baseClasses,
    sizeClasses[options?.size ?? "md"],
    variantClasses[variant],
    options?.fullWidth ? "w-full" : "",
    options?.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

/** 공통 버튼. variant(primary/secondary/neutral/danger), size(sm/md), fullWidth. */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, { size, fullWidth, className })}
      {...props}
    />
  );
}
