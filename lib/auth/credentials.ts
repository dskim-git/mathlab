// 아이디(login_id) ↔ 합성 이메일 매핑과 가입 입력값 검증.
//
// 모든 역할(교사·학생·관리자)은 "아이디 + 비밀번호"로 로그인하고,
// 앱이 아이디를 단일 도메인 합성 이메일로 매핑해 Supabase Auth를 사용한다.
// (설계 문서 docs/authentication_and_rls_plan_v1.md §5.1)

// NEXT_PUBLIC_ 변수는 빌드 시 인라인되므로 반드시 정적으로 직접 참조한다.
// 값이 없으면 기본 도메인을 쓴다(=.env.local 설정 없이도 동작).
//
// 주의: Supabase Auth는 .local / .test / .example 등 예약 TLD를 invalid 이메일로 거부한다.
// 실제 메일을 보내지 않더라도(이메일 확인 off) 형식상 유효한 일반 TLD를 써야 한다.
const SYNTH_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_SYNTH_EMAIL_DOMAIN ?? "mathlab.app";

// 레거시 일반인 아이디 규칙 계승: 영문/숫자/밑줄 4~20자.
export const LOGIN_ID_PATTERN = /^[a-zA-Z0-9_]{4,20}$/;

export function isValidLoginId(loginId: string): boolean {
  return LOGIN_ID_PATTERN.test(loginId);
}

// 아이디 입력을 저장·매핑에 쓸 정규형(소문자)으로 통일한다.
// 가입과 로그인이 같은 정규형을 써야 합성 이메일이 일치한다.
export function normalizeLoginId(loginId: string): string {
  return loginId.trim().toLowerCase();
}

// 아이디 → 합성 이메일. 가입과 로그인이 반드시 같은 함수를 공유해야 한다.
export function loginIdToEmail(loginId: string): string {
  return `${normalizeLoginId(loginId)}@${SYNTH_EMAIL_DOMAIN}`;
}

// 비밀번호 정책(레거시 계승): 8자 이상 + 숫자 1개 이상.
// 통과하면 null, 위반하면 사용자에게 보여줄 메시지를 반환한다.
export function checkPasswordPolicy(password: string): string | null {
  if (password.length < 8) {
    return "비밀번호는 8자 이상이어야 합니다.";
  }
  if (!/[0-9]/.test(password)) {
    return "비밀번호에 숫자를 1개 이상 포함해 주세요.";
  }
  return null;
}
