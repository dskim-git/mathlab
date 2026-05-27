"use client";

import { usePathname } from "next/navigation";

/*
 * 전역 배경 레이어. 루트 레이아웃에서 한 번만 렌더하며, position:fixed -z-10 으로
 * 콘텐츠 뒤(html 기본 배경 #020617 위)에 깔린다. pointer-events-none 이라 클릭을 막지 않는다.
 *
 * 경로에 따라 모티프를 바꾼다:
 *  - 랜딩·로그인·회원가입 → BG-2(흩뿌린 수학 기호)
 *  - 그 외 모든 화면      → BG-1(모눈 그리드 + 은은한 곡선)
 *
 * ⚠️ 이 레이어가 보이려면 위에 덮이는 페이지/레이아웃이 불투명 배경(bg-slate-950 등)을
 *    가지면 안 된다. body 는 layout 에서 배경색을 비워 두고 html 기본색만 베이스로 쓴다.
 */

const GLYPH_ROUTES = new Set([
  "/",
  "/student/login",
  "/student/signup",
  "/teacher/login",
  "/teacher/signup",
]);

// BG-2 기호 배치 (viewBox 1440×900 기준, slice 로 화면 채움)
const GLYPHS = [
  { c: "∑", x: 90, y: 190, s: 150, r: -10 },
  { c: "∫", x: 1240, y: 180, s: 180, r: 8 },
  { c: "π", x: 300, y: 540, s: 130, r: 0 },
  { c: "√", x: 540, y: 280, s: 140, r: -6 },
  { c: "∞", x: 170, y: 700, s: 120, r: 10 },
  { c: "θ", x: 780, y: 200, s: 110, r: 0 },
  { c: "≈", x: 1180, y: 600, s: 110, r: 0 },
  { c: "∂", x: 980, y: 760, s: 130, r: 6 },
  { c: "Δ", x: 620, y: 760, s: 120, r: -8 },
  { c: "÷", x: 1320, y: 400, s: 96, r: 0 },
];

function GlyphLayer() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {GLYPHS.map((g, i) => (
        <text
          key={i}
          x={g.x}
          y={g.y}
          fontSize={g.s}
          fill="#67e8f9"
          fillOpacity="0.08"
          fontFamily="ui-serif, Georgia, 'Times New Roman', serif"
          transform={`rotate(${g.r} ${g.x} ${g.y})`}
        >
          {g.c}
        </text>
      ))}
    </svg>
  );
}

function GridLayer() {
  return (
    <>
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="mathlab-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0 H0 V32" fill="none" stroke="#67e8f9" strokeOpacity="0.05" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mathlab-grid)" />
      </svg>
      {/* 하단에 은은히 깔리는 곡선 */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[45%] w-full"
        viewBox="0 0 1440 400"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden
      >
        <path
          d="M0 300 Q 360 180 720 240 T 1440 140"
          fill="none"
          stroke="#67e8f9"
          strokeOpacity="0.09"
          strokeWidth="2"
        />
        <path
          d="M0 380 Q 420 280 840 320 T 1440 230"
          fill="none"
          stroke="#22d3ee"
          strokeOpacity="0.06"
          strokeWidth="2"
        />
      </svg>
    </>
  );
}

export function SiteBackground() {
  const pathname = usePathname();
  const useGlyphs = GLYPH_ROUTES.has(pathname);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 상단 시안 글로우 — 전체 다크 톤에 깊이감 */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_-10%,rgba(34,211,238,0.10),transparent_70%)]" />
      {useGlyphs ? <GlyphLayer /> : <GridLayer />}
    </div>
  );
}
