"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  withCommonReflection,
  type ReflectionAnswers,
  type ReflectionQuestion,
} from "@/lib/activities/reflection";
import { useActivityContext } from "@/components/activities/ActivityContext";
import { submitActivityReflection } from "@/lib/activities/submitReflection";

type ReflectionFormProps = {
  /** 활동 고유 질문(공통 마무리 질문은 자동 추가). */
  questions: ReflectionQuestion[];
  /** 명시적 핸들러. 주어지면 우선 사용. */
  onSubmit?: (answers: ReflectionAnswers) => Promise<void> | void;
};

export default function ReflectionForm({ questions, onSubmit }: ReflectionFormProps) {
  const activityCtx = useActivityContext();
  // 블록의 reflectionType(Context 로 흘려옴) 에 따라 공통 마무리 질문 깊이 결정.
  // Context 없으면(교사 미리보기 등) 기본 simple.
  const all = withCommonReflection(questions, activityCtx?.reflectionDepth);
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

    // 우선순위:
    //  1) props.onSubmit 이 명시되면 그걸 사용
    //  2) ActivityContext 가 있으면(학생 모드 + activitySlug 알림) 내장 자동 저장
    //  3) 둘 다 없으면 안내만 표시(교사 미리보기 등)
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(answers);
        setMessage("성찰을 제출했습니다.");
      } else if (activityCtx) {
        const res = await submitActivityReflection({
          activitySlug: activityCtx.activitySlug,
          subject: activityCtx.subject,
          answers,
          questions: all,
        });
        if (res.ok) {
          setMessage("성찰을 제출했습니다. 학생 활동 기록에 저장됩니다.");
        } else {
          setError(`제출 중 오류가 발생했습니다: ${res.error}`);
        }
      } else {
        setMessage("작성 내용이 확인되었습니다.");
      }
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
