// 역할별 컬러/라벨 토큰. 헤더 뱃지, 사이드바 액센트, KPI 강조 등에 일관 사용.
export type DashboardRole = "admin" | "teacher" | "student" | "general";

export type RoleTheme = {
  label: string;
  // 뱃지 (작은 칩) — 헤더 사용자명 옆에 표시
  badgeClass: string;
  // 사이드바 활성 항목 / KPI 강조 텍스트
  accentText: string;
  // 사이드바 활성 항목 배경
  accentBg: string;
  // 활성 항목 좌측 인디케이터
  accentBorder: string;
  // 카드 호버 시 액센트 보더
  hoverBorder: string;
};

const themes: Record<DashboardRole, RoleTheme> = {
  admin: {
    label: "관리자",
    badgeClass: "bg-violet-300/15 text-violet-200 border border-violet-300/30",
    accentText: "text-violet-200",
    accentBg: "bg-violet-300/10",
    accentBorder: "border-violet-300/60",
    hoverBorder: "hover:border-violet-300/40",
  },
  teacher: {
    label: "교사",
    badgeClass: "bg-cyan-300/15 text-cyan-200 border border-cyan-300/30",
    accentText: "text-cyan-200",
    accentBg: "bg-cyan-300/10",
    accentBorder: "border-cyan-300/60",
    hoverBorder: "hover:border-cyan-300/40",
  },
  student: {
    label: "학생",
    badgeClass:
      "bg-emerald-300/15 text-emerald-200 border border-emerald-300/30",
    accentText: "text-emerald-200",
    accentBg: "bg-emerald-300/10",
    accentBorder: "border-emerald-300/60",
    hoverBorder: "hover:border-emerald-300/40",
  },
  general: {
    label: "일반",
    badgeClass: "bg-amber-300/15 text-amber-200 border border-amber-300/30",
    accentText: "text-amber-200",
    accentBg: "bg-amber-300/10",
    accentBorder: "border-amber-300/60",
    hoverBorder: "hover:border-amber-300/40",
  },
};

export function getRoleTheme(role: DashboardRole): RoleTheme {
  return themes[role];
}

// 관리자가 다른 역할 뷰로 전환할 때 사용할 라우트 매핑.
export const ROLE_HOME_ROUTE: Record<DashboardRole, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student/home",
  general: "/general",
};
