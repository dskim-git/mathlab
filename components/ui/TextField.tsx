import type { ComponentProps } from "react";

type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  /** htmlFor 연결 + a11y 를 위해 필수. */
  id: string;
  label: string;
  hint?: string;
};

const inputClasses =
  "mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition " +
  "placeholder:text-slate-400 focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40";

/** 라벨 + 인풋 (+ 선택적 힌트) 한 묶음. value/onChange/type 등은 input 으로 그대로 전달. */
export function TextField({
  id,
  label,
  hint,
  className = "",
  ...props
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-200">
        {label}
      </label>
      <input id={id} className={`${inputClasses} ${className}`.trim()} {...props} />
      {hint ? (
        <p className="mt-1.5 text-xs leading-5 text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
