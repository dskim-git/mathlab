"use client";

import { SurveyAnswerPanel } from "@/components/surveys/SurveyAnswerPanel";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

export default function StudentSurveysPage() {
  const theme = getRoleTheme("student");
  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>설문</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">설문 응답</h1>
        <p className="mt-1 text-sm text-slate-400">
          현재 활성화된 사전·사후 설문에 응답하거나 본인 응답을 확인합니다.
        </p>
      </div>
      <SurveyAnswerPanel accentText={theme.accentText} />
    </>
  );
}
