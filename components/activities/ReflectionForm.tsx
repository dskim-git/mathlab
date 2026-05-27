"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  withCommonReflection,
  type ReflectionAnswers,
  type ReflectionQuestion,
} from "@/lib/activities/reflection";

type ReflectionFormProps = {
  /** 활동 고유 질문(공통 마무리 질문은 자동 추가). */
  questions: ReflectionQuestion[];
  /** 제출 핸들러(저장). 없으면 저장 배선 전 상태로 안내만 표시(#3에서 연결). */
  onSubmit?: (answers: ReflectionAnswers) => Promise<void> | void;
};

export default function ReflectionForm({ questions, onSubmit }: ReflectionFormProps) {
  const all = withCommonReflection(questions);
  const [answers, setAnswers] = useState<ReflectionAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const unanswered = all.filter((q) => !(answers[q.id] ?? "").trim());
    if (unanswered.length > 0) {
      setError("모든 항목을 작성해 주세요.");
      return;
    }

    if (!onSubmit) {
      // #3에서 Supabase 저장을 연결할 예정.
      setMessage("작성 내용이 확인되었습니다. (저장 기능은 곧 연결됩니다)");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(answers);
      setMessage("성찰을 제출했습니다.");
    } catch (e) {
      setError(`제출 중 오류가 발생했습니다: ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-2xl border border-white/10 bg-slate-950 p-6"
    >
      <p className="text-sm font-semibold text-cyan-300">활동 성찰</p>
      <h3 className="mt-2 text-xl font-bold">활동을 정리해 볼까요?</h3>

      <div className="mt-5 space-y-5">
        {all.map((q, index) => (
          <div key={q.id}>
            <label
              htmlFor={`reflection-${q.id}`}
              className="block text-sm font-semibold text-slate-200"
            >
              {index + 1}. {q.prompt}
            </label>

            {q.kind === "select" ? (
              <select
                id={`reflection-${q.id}`}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
              >
                <option value="">선택해 주세요</option>
                {(q.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                id={`reflection-${q.id}`}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                rows={3}
                placeholder={q.placeholder}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
              />
            )}
          </div>
        ))}
      </div>

      {error ? (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      ) : null}
      {message ? (
        <Alert tone="success" className="mt-4">
          {message}
        </Alert>
      ) : null}

      <Button type="submit" disabled={submitting} className="mt-5">
        {submitting ? "제출 중..." : "성찰 제출"}
      </Button>
    </form>
  );
}
