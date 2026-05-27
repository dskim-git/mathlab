type Props = { size?: number; className?: string };

/**
 * MathLab 앱 아이콘 — 좌표 플롯 배지(모눈 위 상승 곡선 + 정점 노드).
 * 파비콘·작은 아이콘 등 정사각 슬롯에서 로고 마크(플라스크) 대신 쓴다.
 * 색은 브랜드 시안 고정. 다크 표면 위 사용 전제.
 */
export function AppIcon({ size = 40, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="MathLab"
    >
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="13"
        fill="#67e8f9"
        fillOpacity="0.06"
        stroke="#67e8f9"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      {/* 그리드 */}
      <g stroke="#67e8f9" strokeOpacity="0.18" strokeWidth="1">
        <path d="M14 10 V38 M24 10 V38 M34 10 V38" />
        <path d="M10 18 H38 M10 28 H38" />
      </g>
      {/* 축 */}
      <path
        d="M12 36 H37 M12 11 V36"
        stroke="#94a3b8"
        strokeOpacity="0.5"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* 상승 곡선 + 정점 노드 */}
      <path
        d="M13 33 C 19 32 21 18 26 16 C 30 14.5 32 13 36 12"
        stroke="#67e8f9"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="36" cy="12" r="2.6" fill="#67e8f9" />
      <circle cx="36" cy="12" r="5" fill="#67e8f9" fillOpacity="0.2" />
    </svg>
  );
}
