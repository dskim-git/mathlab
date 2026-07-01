// 활동 성찰 스키마 — [[activity-reflection-policy]] 구현.
// 각 활동은 "고유 질문"(그 활동 내용에 관한 것)만 정의하고,
// 공통 마무리 질문은 withCommonReflection 이 깊이(simple/deep)에 따라 자동 부착한다.
// 블록 설정의 reflectionType 이 ActivityContext 를 거쳐 ReflectionForm 까지 전달된다.

export type ReflectionQuestion = {
  id: string;
  prompt: string;
  /** text(서술형) | select(관점 선택) */
  kind: "text" | "select";
  options?: string[]; // kind=select 일 때
  placeholder?: string;
};

export type ReflectionAnswers = Record<string, string>;
export type ReflectionDepth = "simple" | "deep";

// 간단 — 공통 마무리 질문 1개("느낀 점").
export const COMMON_REFLECTION_QUESTIONS_SIMPLE: ReflectionQuestion[] = [
  {
    id: "takeaway",
    prompt: "이번 활동에서 새롭게 알게 된 점과 느낀 점을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 자릿수가 하나 늘 때마다 경우의 수가 k배씩 커진다는 것을 알게 되었다.",
  },
];

// 심화 — 느낀 점 + 적용·의문·연결 4개.
export const COMMON_REFLECTION_QUESTIONS_DEEP: ReflectionQuestion[] = [
  {
    id: "takeaway",
    prompt: "이번 활동에서 새롭게 알게 된 점과 느낀 점을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 자릿수가 하나 늘 때마다 경우의 수가 k배씩 커진다는 것을 알게 되었다.",
  },
  {
    id: "application",
    prompt:
      "이번 활동의 개념을 실생활이나 다른 문제 상황에 어떻게 적용할 수 있을지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 비밀번호를 만들 때 자릿수를 한 자리 늘리면 가능한 경우가 몇 배로 늘어나는지 추정해 봤다.",
  },
  {
    id: "question",
    prompt:
      "활동을 하면서 새로 생긴 의문이나 더 알고 싶어진 부분이 있다면 적어 보세요.",
    kind: "text",
    placeholder: "예: 자릿수마다 사용할 수 있는 문자 집합이 다르면 어떻게 계산할까?",
  },
  {
    id: "next_link",
    prompt:
      "이번 학습 내용이 앞으로 배울 어떤 내용과 연결될 것 같은지 적어 보세요.",
    kind: "text",
    placeholder: "예: 순열과 조합, 이항정리 단원과 자연스럽게 이어질 것 같다.",
  },
];

/** 활동 고유 질문 뒤에 깊이에 맞는 공통 마무리 질문을 붙여 최종 목록을 만든다. */
export function withCommonReflection(
  questions: ReflectionQuestion[],
  depth: ReflectionDepth = "simple"
): ReflectionQuestion[] {
  const common =
    depth === "deep"
      ? COMMON_REFLECTION_QUESTIONS_DEEP
      : COMMON_REFLECTION_QUESTIONS_SIMPLE;
  return [...questions, ...common];
}

/** 옛 코드 호환 — 단일 객체 export 유지. */
export const COMMON_REFLECTION_QUESTION = COMMON_REFLECTION_QUESTIONS_SIMPLE[0];

/**
 * reflection_data 의 형식이 시기별로 다르다(옛: { reflection: string } 또는 { id: string },
 * 새: { id: { prompt, answer } }). 어느 형식이든 "공통 마무리(takeaway)" 답을 뽑아낸다.
 * 학생 기록 메인 줄의 한 줄 요약(UI 미리보기)에 사용.
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

function reflectionFieldAnswer(val: unknown): string {
  if (typeof val === "string") return val.trim();
  if (val && typeof val === "object") {
    const ans = (val as { answer?: unknown }).answer;
    if (typeof ans === "string") return ans.trim();
  }
  return "";
}

/**
 * reflection_data 의 모든 Q&A를 추출해 세특 AI 컨텍스트용 문자열로 반환.
 * takeaway(느낀점)만이 아닌 application·question·next_link 및
 * 활동별 고유 질문 답변까지 모두 포함해 AI가 풍부한 성찰 전체를 참고할 수 있게 한다.
 */
export function extractAllReflections(reflectionData: unknown): string {
  if (!reflectionData || typeof reflectionData !== "object") return "";
  const obj = reflectionData as Record<string, unknown>;

  // 옛 ProbabilitySimulator 형식 — 단일 문자열
  if (typeof obj.reflection === "string") {
    const v = obj.reflection.trim();
    return v ? `[느낀 점] ${v}` : "";
  }

  // 표준 공통 질문 라벨 (고정 순서)
  const STANDARD: [string, string][] = [
    ["takeaway", "새롭게 알게 된 점·느낀 점"],
    ["application", "실생활·다른 문제에 적용"],
    ["question", "새로 생긴 의문"],
    ["next_link", "앞으로 배울 내용과의 연결"],
  ];

  const lines: string[] = [];
  const handled = new Set<string>();

  for (const [id, label] of STANDARD) {
    const val = obj[id];
    if (val === undefined || val === null) continue;
    handled.add(id);
    const answer = reflectionFieldAnswer(val);
    if (answer) lines.push(`[${label}] ${answer}`);
  }

  // 활동별 고유 질문 — 나머지 필드. prompt 가 있으면 그걸 라벨로 사용.
  for (const [key, val] of Object.entries(obj)) {
    if (handled.has(key)) continue;
    const answer = reflectionFieldAnswer(val);
    if (!answer) continue;
    let label = key;
    if (val && typeof val === "object") {
      const p = (val as { prompt?: unknown }).prompt;
      if (typeof p === "string" && p.trim()) label = p.trim();
    }
    lines.push(`[${label}] ${answer}`);
  }

  return lines.join("\n");
}
