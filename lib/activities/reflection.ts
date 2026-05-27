// 활동 성찰 스키마 — [[activity-reflection-policy]] 구현.
// 각 활동은 "고유 질문"(그 활동 내용에 관한 것)만 정의하고,
// 공통 마무리 질문("새롭게 알게 된 점과 느낀 점")은 withCommonReflection 이 자동 부착한다.

export type ReflectionQuestion = {
  id: string;
  prompt: string;
  /** text(서술형) | select(관점 선택) */
  kind: "text" | "select";
  options?: string[]; // kind=select 일 때
  placeholder?: string;
};

export type ReflectionAnswers = Record<string, string>;

// 모든 활동 공통 마무리 질문.
export const COMMON_REFLECTION_QUESTION: ReflectionQuestion = {
  id: "takeaway",
  prompt: "이번 활동에서 새롭게 알게 된 점과 느낀 점을 적어 보세요.",
  kind: "text",
  placeholder: "예: 자릿수가 하나 늘 때마다 경우의 수가 k배씩 커진다는 것을 알게 되었다.",
};

// 활동 고유 질문 뒤에 공통 질문을 붙여 최종 질문 목록을 만든다.
export function withCommonReflection(
  questions: ReflectionQuestion[]
): ReflectionQuestion[] {
  return [...questions, COMMON_REFLECTION_QUESTION];
}
