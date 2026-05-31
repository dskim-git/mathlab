"use client";

// 활동(interactive_activity 블록 1개) 단위의 React Context.
// 두 가지 역할:
//   (1) ReflectionForm 자동 저장 — useActivityContext() 로 slug/subject 를 받아 INSERT.
//   (2) 활동 방문 로깅 — "활동 안에서 첫 클릭이 발생했을 때만" activity_visits 에 1행 INSERT.
//       단원 목록에서 잎을 눌러 화면이 뜨기만 한 건 visit 카운트 X — 실제로 활동을 시작한
//       (콘텐츠를 하나라도 클릭한) 경우만 카운트해야 통계가 의미를 가진다.
//
// 활동 컴포넌트(70+개) 코드를 건드리지 않고 일괄 활성화하기 위한 우회 통로.
// onClickCapture 로 자식 영역의 첫 클릭을 잡고, 같은 마운트 안에선 중복 INSERT 안 함.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";

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
  // 활동이 바뀌면(slug 변경 — 사용자가 다른 단원의 활동으로 이동) 다시 로깅 가능하도록 초기화.
  const loggedRef = useRef(false);
  useEffect(() => {
    loggedRef.current = false;
  }, [value.activitySlug]);

  function handleFirstInteraction() {
    if (loggedRef.current) return;
    loggedRef.current = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      // 학생만 카운트. 교사/관리자 미리보기는 통계 의미가 없으므로 제외.
      const { data: studentRow } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (!studentRow) return;
      await supabase.from("activity_visits").insert({
        profile_id: user.id,
        activity_slug: value.activitySlug,
        subject: value.subject,
      });
    })();
  }

  return (
    <Ctx.Provider value={value}>
      <div onClickCapture={handleFirstInteraction}>{children}</div>
    </Ctx.Provider>
  );
}

/** Provider 바깥에서 부르면 null. ReflectionForm 이 fallback 동작을 결정한다. */
export function useActivityContext(): ActivityContextValue | null {
  return useContext(Ctx);
}
