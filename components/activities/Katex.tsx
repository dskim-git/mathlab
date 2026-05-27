import katex from "katex";

type KatexProps = {
  /** LaTeX 소스(정적 — 사용자 입력 아님) */
  expr: string;
  /** 블록(디스플레이) 수식이면 true, 인라인이면 false */
  display?: boolean;
  className?: string;
};

// 미니활동 공용 수식 조판. katex.renderToString 으로 SSR·CSR 모두 안전하게 렌더.
// (KaTeX CSS 는 app/layout.tsx 에서 전역 import.)
export default function Katex({ expr, display = false, className }: KatexProps) {
  const html = katex.renderToString(expr, {
    throwOnError: false,
    displayMode: display,
  });
  // KaTeX 가 생성한 신뢰된 마크업(정적 LaTeX 문자열에서 변환).
  if (display) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
