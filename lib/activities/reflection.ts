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

/**
 * reflection_data 의 형식이 시기별로 다르다(옛: { reflection: string } 또는 { id: string },
 * 새: { id: { prompt, answer } }). 어느 형식이든 "공통 마무리(takeaway)" 답을 뽑아낸다.
 * 학생 기록 메인 줄의 한 줄 요약·교사 세특 컨텍스트 같은 곳에서 한 곳에서 호출.
 */
export function extractMainReflection(
  reflectionData: unknown
): string {
  if (!reflectionData || typeof reflectionData !== "object") return "";
  const obj = reflectionData as Record<string, unknown>;

  // 옛 ProbabilitySimulator 형식
  if (typeof obj.reflection === "string") return obj.reflection.trim();

  // 새 형식 takeaway = { prompt, answer }
  const tk = obj.takeaway;
  if (tk && typeof tk === "object") {
    const ans = (tk as { answer?: unknown }).answer;
    if (typeof ans === "string") return ans.trim();
  }
  // 옛 새-형식-이전 (id → string): takeaway 문자열 직접
  if (typeof tk === "string") return tk.trim();

  return "";
}
