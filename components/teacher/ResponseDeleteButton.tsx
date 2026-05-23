"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ResponseDeleteButtonProps = {
  responseId: string;
  studentName: string;
  studentNumber?: string | null;
  table?: "responses" | "activity_responses";
};

export default function ResponseDeleteButton({
  responseId,
  studentName,
  studentNumber,
  table = "responses",
}: ResponseDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDelete() {
    const studentLabel = studentNumber
      ? `${studentName} (${studentNumber})`
      : studentName;

    const confirmed = window.confirm(
      `${studentLabel} 학생의 이 응답을 삭제할까요?\n\n삭제한 응답은 되돌릴 수 없습니다.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", responseId);

    setIsDeleting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-full border border-red-300/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDeleting ? "삭제 중..." : "응답 삭제"}
      </button>

      {errorMessage ? (
        <p className="max-w-64 text-xs leading-5 text-red-200">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}