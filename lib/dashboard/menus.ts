import type { DashboardRole } from "./roleTheme";

export type MenuItem = {
  key: string;
  label: string;
  icon: string; // 이모지(빠른 1차). 나중에 SVG 컴포넌트로 교체 가능.
  href: string;
  // 하단 탭바에 노출할지 (모바일 공간이 적어 핵심만)
  inTabBar?: boolean;
};

const studentMenu: MenuItem[] = [
  { key: "home", label: "홈", icon: "🏠", href: "/student/home", inTabBar: true },
  { key: "learn", label: "교과 학습", icon: "📚", href: "/learn", inTabBar: true },
  {
    // /learn 에서 미니활동에 진입한 시뮬레이션 이력(activity_visits).
    key: "activity",
    label: "내 활동",
    icon: "🧭",
    href: "/student/activity",
    inTabBar: true,
  },
  {
    // 제출한 응답·성찰 + 별표/우선순위/코멘트 (옛 /student/records 흡수).
    key: "reflections",
    label: "내 성찰",
    icon: "💭",
    href: "/student/reflections",
  },
  {
    // 본인 성장 그래프 — 주간 활동·누적 곡선·이번 주 비교.
    key: "growth",
    label: "내 성장",
    icon: "📈",
    href: "/student/growth",
  },
  {
    key: "feedback",
    label: "건의 보내기",
    icon: "💡",
    href: "/student/feedback",
  },
  {
    key: "profile",
    label: "내 정보",
    icon: "👤",
    href: "/student/profile",
    inTabBar: true,
  },
];

const teacherMenu: MenuItem[] = [
  { key: "home", label: "홈", icon: "🏠", href: "/teacher", inTabBar: true },
  { key: "learn", label: "교과 학습", icon: "📚", href: "/learn", inTabBar: true },
  {
    key: "progress",
    label: "진도표",
    icon: "📅",
    href: "/teacher/progress",
    inTabBar: true,
  },
  {
    // 누적 응답 = 학급 기록 같은 화면. KPI 카드에서 바로 진입하므로 메뉴 항목으로 노출.
    key: "records",
    label: "응답 기록",
    icon: "📊",
    href: "/teacher/records",
  },
  {
    // 단원 안의 수업 블록(콘텐츠) 을 교사별로 편집 — /teacher/activities 의 공유 템플릿과는 다른 개념.
    key: "lesson-blocks",
    label: "수업활동 편집",
    icon: "📝",
    href: "/teacher/lesson-blocks",
  },
  { key: "sebteuk", label: "AI 세특", icon: "🤖", href: "/teacher/sebteuk" },
  {
    key: "feedback",
    label: "건의 보내기",
    icon: "💡",
    href: "/teacher/feedback",
  },
  // 세션 메뉴는 진입 빈도가 낮아 사이드바·탭바에서 제외. 필요 시 /teacher/sessions URL 직접 접근.
  {
    key: "profile",
    label: "내 정보",
    icon: "👤",
    href: "/teacher/profile",
    inTabBar: true,
  },
];

const adminMenu: MenuItem[] = [
  { key: "home", label: "홈", icon: "🏠", href: "/admin", inTabBar: true },
  {
    key: "members",
    label: "회원관리",
    icon: "👥",
    href: "/admin/members",
    inTabBar: true,
  },
  { key: "settings", label: "설정", icon: "⚙️", href: "/admin/settings" },
  {
    key: "learn",
    label: "교과 학습 관리",
    icon: "📚",
    href: "/learn",
    inTabBar: true,
  },
  {
    // 교과 단원(curriculum_units) 트리 + 콘텐츠 블록 관리. SQL 임포트 대체.
    key: "curriculum",
    label: "단원 관리",
    icon: "🗂️",
    href: "/admin/curriculum",
  },
  {
    // activities 행 자체(공유 템플릿) 신규/삭제. 운영 빈도 낮음.
    key: "activities",
    label: "활동 행 관리",
    icon: "🧪",
    href: "/admin/activities",
  },
  {
    key: "access",
    label: "교과 권한",
    icon: "🔐",
    href: "/admin/access",
    inTabBar: true,
  },
  {
    key: "feedback",
    label: "건의사항",
    icon: "💬",
    href: "/admin/feedback",
  },
  { key: "stats", label: "통계", icon: "📊", href: "/admin/stats", inTabBar: true },
  { key: "scores", label: "점수 관리", icon: "🏆", href: "/admin/scores" },
  { key: "notices", label: "공지 작성", icon: "📢", href: "/admin/notices" },
  { key: "surveys", label: "설문", icon: "📝", href: "/admin/surveys" },
];

const generalMenu: MenuItem[] = [
  { key: "home", label: "홈", icon: "🏠", href: "/general", inTabBar: true },
  { key: "learn", label: "교과 학습", icon: "📚", href: "/learn", inTabBar: true },
  {
    key: "feedback",
    label: "건의 보내기",
    icon: "💡",
    href: "/general/feedback",
    inTabBar: true,
  },
  {
    key: "profile",
    label: "내 정보",
    icon: "👤",
    href: "/general/profile",
    inTabBar: true,
  },
];

export function getMenu(role: DashboardRole): MenuItem[] {
  if (role === "admin") return adminMenu;
  if (role === "teacher") return teacherMenu;
  if (role === "student") return studentMenu;
  return generalMenu;
}

export function getTabBarMenu(role: DashboardRole): MenuItem[] {
  return getMenu(role).filter((m) => m.inTabBar);
}

/**
 * 정적 라우트 → 표시 라벨 맵. 브래드크럼이 누적 prefix(예: /admin, /admin/members,
 * /admin/members/students)를 한 번에 한 칸씩 라벨로 변환할 때 사용한다.
 * 메뉴(사이드바)에 노출되지 않는 sub 라우트(예: /admin/teachers, /teacher/sessions/[id]/lesson)
 * 도 여기에 등록해두면 브래드크럼이 사람이 읽을 수 있는 이름으로 표시된다.
 */
export const ROUTE_LABELS: Record<string, string> = {
  "/": "홈",
  "/learn": "교과 학습",
  "/join": "입장코드",
  "/notifications": "알림함",

  // 관리자
  "/admin": "관리자 홈",
  "/admin/members": "회원관리",
  "/admin/teachers": "교사 권한",
  "/admin/roster": "명렬표",
  "/admin/subjects": "교과 접근(학생·일반)",
  "/admin/settings": "설정",
  "/admin/curriculum": "단원 관리",
  "/admin/activities": "활동 행 관리",
  "/admin/access": "교과 권한",
  "/admin/feedback": "건의사항",
  "/admin/stats": "통계",
  "/admin/scores": "점수 관리",
  "/admin/notices": "공지 작성",
  "/admin/surveys": "설문",

  // 교사
  "/teacher": "교사 홈",
  "/teacher/sessions": "세션 관리",
  "/teacher/records": "응답 기록",
  "/teacher/activities": "콘텐츠 블록",
  "/teacher/lesson-blocks": "수업활동 편집",
  "/teacher/progress": "진도표",
  "/teacher/progress/schedule": "요일 시간표 설정",
  "/teacher/progress/history": "과거 기록",
  "/teacher/sebteuk": "AI 세특 작성",
  "/teacher/sebteuk/list": "저장된 세특",
  "/teacher/feedback": "건의 보내기",
  "/teacher/profile": "내 정보",

  // 학생
  "/student/home": "학생 홈",
  "/student/activity": "내 활동",
  "/student/reflections": "내 성찰",
  "/student/growth": "내 성장",
  // (구) /student/records 는 /student/reflections 로 흡수·리다이렉트.
  "/student/feedback": "건의 보내기",
  "/student/profile": "내 정보",
  "/student/session": "수업 참여",

  // 일반인
  "/general": "일반인 홈",
  "/general/feedback": "건의 보내기",
  "/general/profile": "내 정보",
};

/**
 * 동적 세그먼트(예: UUID·숫자 id, 또는 join_code)는 ROUTE_LABELS 매칭이 안 됨.
 * 그런 경우 부모 라우트가 알고 있는 "꼬리표" 라벨을 추가 매칭한다. 예) `lesson`→"수업 화면".
 */
export const ROUTE_TAIL_LABELS: Record<string, string> = {
  lesson: "수업 화면",
  edit: "편집",
  blocks: "블록 편집",
  new: "새로 만들기",
};

/**
 * 페이지의 "논리적 부모"가 URL 한 칸 위와 다를 때 명시한다.
 * 예: /admin/teachers 는 URL 상 /admin 직속이지만 페이지 멘탈 모델로는 "회원관리"(=/admin/members)
 *     아래에 속하므로 브래드크럼이 "관리자 홈 › 회원관리 › 교사 권한" 으로 표시되도록 한다.
 * 등록 안 된 라우트는 URL 한 칸 위로 자동 폴백한다.
 */
export const ROUTE_PARENTS: Record<string, string> = {
  // 회원관리 산하 — 계정 자체에 관한 것
  "/admin/roster": "/admin/members",

  // 교과 권한 산하 — 콘텐츠/교과 접근에 관한 것
  // /admin/teachers 는 "교사의 담당 학급·과목 + AI세특 권한" 화면이라 권한 메뉴 아래.
  // (교사 *계정 자체* 관리는 Step 2 후속에서 /admin/members 안 탭으로 추가 예정.)
  "/admin/teachers": "/admin/access",
  "/admin/subjects": "/admin/access",
};
