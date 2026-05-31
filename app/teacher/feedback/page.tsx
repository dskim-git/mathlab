"use client";

import { MyFeedbackPanel } from "@/components/feedback/MyFeedbackPanel";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

// 학생/일반인과 같은 MyFeedbackPanel 공용. supabase.auth.getUser() 로 신원 잡으므로
// 교사도 그대로 작동(profile_id=auth.uid). RLS 정책에서 본인 행 SELECT/INSERT 허용.
export default function TeacherFeedbackPage() {
  const theme = getRoleTheme("teacher");
  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>
          건의 보내기
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          오류 제보 · 활동 건의
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          버그를 발견했거나 만들어주었으면 하는 활동이 있으면 관리자에게
          보냅니다.
        </p>
      </div>
      <MyFeedbackPanel accentText={theme.accentText} />
    </>
  );
}
