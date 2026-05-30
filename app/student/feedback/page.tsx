"use client";

import { MyFeedbackPanel } from "@/components/feedback/MyFeedbackPanel";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

export default function StudentFeedbackPage() {
  const theme = getRoleTheme("student");
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
