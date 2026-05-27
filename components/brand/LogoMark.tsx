type Props = { size?: number; className?: string };

/**
 * MathLab 로고 마크 — 실험실 플라스크 + 상승 데이터 포인트.
 * "수학을 실험으로 탐구"하는 브랜드 컨셉(math + lab)을 담는다.
 * 색은 브랜드 시안(cyan-300/200) 고정. 다크 표면 위 사용 전제.
 */
export function LogoMark({ size = 40, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="MathLab 로고"
    >
      <defs>
        <linearGradient id="mathlab-flask-liquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {/* 액체 */}
      <path
        d="M15.4 30 Q24 27 32.6 30 L37 40 Q37.6 42 35 42 H13 Q10.4 42 11 40 Z"
        fill="url(#mathlab-flask-liquid)"
      />
      {/* 플라스크 외형 */}
      <path
        d="M21 7 V18 L11 40 Q10.4 42 13 42 H35 Q37.6 42 37 40 L27 18 V7"
        stroke="#67e8f9"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M18.5 7 H29.5" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
      {/* 상승하는 측정점(실험 결과) */}
      <path
        d="M16 35 Q21 31 24 26 Q27 21 31 17"
        stroke="#a5f3fc"
        strokeWidth="1.4"
        strokeDasharray="0.5 3"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx="16" cy="35" r="1.6" fill="#a5f3fc" />
      <circle cx="24" cy="26" r="1.6" fill="#a5f3fc" />
      <circle cx="31" cy="17" r="2.2" fill="#67e8f9" />
    </svg>
  );
}
