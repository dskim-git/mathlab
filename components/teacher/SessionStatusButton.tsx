"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type SessionStatusButtonProps = {
  sessionId: string;
  isActive: boolean;
};

export default function SessionStatusButton({
  sessionId,
  isActive,
}: SessionStatusButtonProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleToggleSession() {
    const nextStatus = !isActive;

    const confirmMessage = isActive
      ? "이 수업 세션을 종료할까요? 종료하면 학생들이 더 이상 이 입장 코드로 들어올 수 없습니다."
      : "이 수업 세션을 다시 진행 중으로 바꿀까요? 학생들이 다시 입장할 수 있습니다.";

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) {
      return;
    }

    setIsUpdating(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("sessions")
      .update({
        is_active: nextStatus,
      })
      .eq("id", sessionId)
      .select("id, is_active")
      .single();

    setIsUpdating(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (!data) {
      setErrorMessage(
        "세션 상태가 변경되지 않았습니다. Supabase 정책이나 환경 변수를 확인해 주세요."
      );
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleToggleSession}
        disabled={isUpdating}
        className={
          isActive
            ? "rounded-full border border-red-300/40 px-4 py-2 font-semibold text-red-200 transition hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-60"
            : "rounded-full border border-green-300/40 px-4 py-2 font-semibold text-green-200 transition hover:bg-green-300/10 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {isUpdating ? "변경 중..." : isActive ? "세션 종료" : "다시 열기"}
      </button>

      {errorMessage ? (
        <p className="max-w-48 text-xs leading-5 text-red-200">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}