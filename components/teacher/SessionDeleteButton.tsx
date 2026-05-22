"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type SessionDeleteButtonProps = {
  sessionId: string;
  sessionTitle: string;
  joinCode: string;
  responseCount: number;
};

export default function SessionDeleteButton({
  sessionId,
  sessionTitle,
  joinCode,
  responseCount,
}: SessionDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDeleteSession() {
    const confirmed = window.confirm(
      [
        `"${sessionTitle}" 세션을 삭제할까요?`,
        "",
        `입장 코드: ${joinCode}`,
        `저장된 학생 응답 수: ${responseCount}개`,
        "",
        "이 세션에 저장된 학생 응답도 함께 삭제됩니다.",
        "삭제한 세션과 응답은 되돌릴 수 없습니다.",
      ].join("\n")
    );

    if (!confirmed) {
      return;
    }

    const doubleConfirmed = window.confirm(
      responseCount > 0
        ? `정말 삭제할까요? 학생 응답 ${responseCount}개가 함께 삭제됩니다.`
        : "정말 삭제할까요? 이 작업은 되돌릴 수 없습니다."
    );

    if (!doubleConfirmed) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    const { error: responsesDeleteError } = await supabase
      .from("responses")
      .delete()
      .eq("session_id", sessionId);

    if (responsesDeleteError) {
      setIsDeleting(false);
      setErrorMessage(responsesDeleteError.message);
      return;
    }

    const { error: sessionDeleteError } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId);

    setIsDeleting(false);

    if (sessionDeleteError) {
      setErrorMessage(sessionDeleteError.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleDeleteSession}
        disabled={isDeleting}
        className="rounded-full border border-red-400/50 px-4 py-2 font-semibold text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDeleting ? "삭제 중..." : "세션 삭제"}
      </button>

      {errorMessage ? (
        <p className="max-w-56 text-xs leading-5 text-red-200">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}