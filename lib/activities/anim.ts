import { useEffect, useRef, useState } from "react";

// 미니활동 공용: 목표값으로 부드럽게 올라가는 카운트업(슬라이더 변경 시 결과 애니메이션).
export function useCountUp(target: number, duration = 450): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};

// 지수 표기용 위첨자 문자열. 예: sup(12) → "¹²"
export function sup(n: number): string {
  return String(n).split("").map((c) => SUP[c] ?? c).join("");
}
