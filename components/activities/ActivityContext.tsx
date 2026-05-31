"use client";

// 활동(interactive_activity 블록 1개) 단위의 React Context.
// ActivityRenderer 가 미니활동을 렌더할 때 Provider 로 감싸 activitySlug 와 subject 를 흘려보내고,
// 활동 내부의 ReflectionForm 이 props.onSubmit 을 안 받았을 때 이 Context 로부터 신원을 얻어
// 자동으로 activity_responses 에 저장한다.
//
// 활동 컴포넌트(70+개) 코드를 건드리지 않고 성찰 저장을 일괄 활성화하기 위한 우회 통로.

import { createContext, useContext, type ReactNode } from "react";

export type ActivityContextValue = {
  activitySlug: string;
  /** /learn 단원의 교과명. 세션 경로 등에선 null 일 수 있다. */
  subject: string | null;
};

const Ctx = createContext<ActivityContextValue | null>(null);

export function ActivityContextProvider({
  value,
  children,
}: {
  value: ActivityContextValue;
  children: ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Provider 바깥에서 부르면 null. ReflectionForm 이 fallback 동작을 결정한다. */
export function useActivityContext(): ActivityContextValue | null {
  return useContext(Ctx);
}
