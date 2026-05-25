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
        `이 세션으로 제출된 학생 응답 수: ${responseCount}개`,
        "",
        "세션만 삭제됩니다. 학생 응답 기록은 보존되며(세션 연결만 해제),",
        "학생별 누적 기록에서 계속 확인할 수 있습니다.",
        "삭제한 세션은 되돌릴 수 없습니다.",
      ].join("\n")
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    // activity_responses.session_id 는 ON DELETE SET NULL → 세션을 지워도 학생 응답
    // 기록은 보존되고 세션 연결만 해제된다(누적 기록 모델).
    // (레거시 responses 테이블은 아카이브됨 — 더 이상 참조하지 않는다.)
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