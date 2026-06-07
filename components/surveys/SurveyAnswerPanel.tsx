"use client";

// 학생/일반인 공용 설문 응답 패널.
//   - 활성화된 설문 목록 (is_active=true)
//   - 본인 응답 여부 — 있으면 "응답 완료(보기)", 없으면 "응답하기"
//   - 질문 kind 별 동적 폼: text / select / scale (1~5)
//   - 제출 시 survey_responses INSERT (트리거가 respondent_kind 자동 복사)
//   - 1 설문 × 1 사용자 unique 제약 → 재제출은 UPDATE 로
//
// 사용처: /student/surveys, /general/surveys (둘 다 같은 컴포넌트 import).

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Question = {
  id: string;
  prompt: string;
  kind?: "text" | "select" | "scale";
  options?: string[];
};

type SurveyRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: string | null;
  questions: Question[];
  is_active: boolean;
  consent_text: string | null;
};

type ResponseRow = {
  id: string;
  survey_id: string;
  answers: Record<string, string>;
  created_at: string;
};

export function SurveyAnswerPanel({ accentText }: { accentText: string }) {
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [myResponses, setMyResponses] = useState<Map<string, ResponseRow>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 응답 폼 — 한 번에 한 설문만 펼침.
  const [openSurveyId, setOpenSurveyId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  // 동의 단계 — consent_text 있는 설문에서, 새 응답 시 폼 가리고 안내문+체크 노출.
  const [consentAgreed, setConsentAgreed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }
    const [sRes, rRes] = await Promise.all([
      supabase
        .from("surveys")
        .select(
          "id, slug, title, description, kind, questions, is_active, consent_text"
        )
        .eq("is_active", true)
        .order("kind", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("survey_responses")
        .select("id, survey_id, answers, created_at")
        .eq("profile_id", user.id),
    ]);
    if (sRes.error) setError(sRes.error.message);
    if (rRes.error) setError((e) => e || rRes.error!.message);
    setSurveys((sRes.data ?? []) as SurveyRow[]);
    const m = new Map<string, ResponseRow>();
    for (const r of (rRes.data ?? []) as ResponseRow[]) {
      m.set(r.survey_id, r);
    }
    setMyResponses(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openSurvey(s: SurveyRow) {
    setOpenSurveyId(s.id);
    setSubmitMsg("");
    // 기존 응답이 있으면 그 값으로 채워 수정 모드. 동의도 이미 한 것으로 간주.
    const existing = myResponses.get(s.id);
    setAnswers(existing?.answers ?? {});
    // 새 응답인데 consent_text 있으면 동의 단계 노출 — 그 외는 바로 폼.
    setConsentAgreed(!s.consent_text || !!existing);
  }

  function closeSurvey() {
    setOpenSurveyId(null);
    setAnswers({});
    setSubmitMsg("");
    setConsentAgreed(false);
  }

  async function submitSurvey(s: SurveyRow) {
    setSubmitMsg("");
    // 빈 답변 체크 (모든 질문에 답해야 함).
    const missing = s.questions.filter(
      (q) => !(answers[q.id] ?? "").trim()
    );
    if (missing.length > 0) {
      setSubmitMsg(`모든 항목을 작성해 주세요 (남은 ${missing.length}개)`);
      return;
    }
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      setSubmitMsg("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      return;
    }
    const existing = myResponses.get(s.id);
    // 학생인 경우 student_id 도 채움(교사 RLS 통과). 일반인은 NULL.
    const { data: stRow } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    const studentId = (stRow as { id: string } | null)?.id ?? null;
    const payload = {
      survey_id: s.id,
      profile_id: user.id,
      student_id: studentId,
      answers,
    };
    const res = existing
      ? await supabase
          .from("survey_responses")
          .update({ answers })
          .eq("id", existing.id)
      : await supabase.from("survey_responses").insert(payload);
    setSubmitting(false);
    if (res.error) {
      setSubmitMsg(`제출 실패: ${res.error.message}`);
      return;
    }
    setSubmitMsg(existing ? "응답을 수정했습니다." : "응답을 제출했습니다.");
    await load();
  }

  const openSurvey_ = openSurveyId
    ? surveys.find((s) => s.id === openSurveyId) ?? null
    : null;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm font-semibold ${accentText}`}>활성 설문</p>
        <Button
          onClick={load}
          variant="neutral"
          size="sm"
          disabled={loading}
        >
          {loading ? "..." : "새로고침"}
        </Button>
      </div>

      {error ? (
        <Alert tone="error" className="mt-3">
          {error}
        </Alert>
      ) : null}

      <div className="mt-3 space-y-3">
        {surveys.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-slate-400">
            현재 응답 가능한 설문이 없습니다.
          </p>
        ) : (
          surveys.map((s) => {
            const existing = myResponses.get(s.id);
            const isOpen = openSurveyId === s.id;
            return (
              <Card key={s.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {existing ? (
                        <span className="rounded-full bg-emerald-300/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                          응답 완료
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                          응답 전
                        </span>
                      )}
                      {s.kind ? (
                        <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                          {s.kind}
                        </span>
                      ) : null}
                      <h3 className="text-base font-bold text-white">{s.title}</h3>
                    </div>
                    {s.description ? (
                      <p className="mt-1 text-xs text-slate-400">{s.description}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {isOpen ? (
                      <Button onClick={closeSurvey} variant="neutral" size="sm">
                        닫기
                      </Button>
                    ) : (
                      <Button
                        onClick={() => openSurvey(s)}
                        variant={existing ? "neutral" : "primary"}
                        size="sm"
                      >
                        {existing ? "보기·수정" : "응답하기"}
                      </Button>
                    )}
                  </div>
                </div>

                {isOpen ? (
                  s.consent_text && !consentAgreed ? (
                    <ConsentStep
                      text={s.consent_text}
                      onAgree={() => setConsentAgreed(true)}
                    />
                  ) : (
                    <SurveyForm
                      survey={s}
                      answers={answers}
                      setAnswers={setAnswers}
                      onSubmit={() => submitSurvey(s)}
                      submitting={submitting}
                      message={submitMsg}
                    />
                  )
                ) : null}
              </Card>
            );
          })
        )}
      </div>
      {openSurvey_ ? null : null}
    </section>
  );
}

/** 설문 시작 전 개인정보 동의 단계 — 안내문 + 체크 + "시작" 버튼. */
function ConsentStep({
  text,
  onAgree,
}: {
  text: string;
  onAgree: () => void;
}) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="mt-4 space-y-3 rounded-xl border border-violet-300/30 bg-violet-300/5 p-4">
      <p className="font-semibold text-violet-200">📋 설문 시작 전 안내</p>
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-100">
        {text}
      </p>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="h-4 w-4"
        />
        안내 내용을 확인했으며, 설문에 참여합니다.
      </label>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!checked}
          onClick={onAgree}
        >
          동의하고 설문 시작 →
        </Button>
      </div>
    </div>
  );
}

function SurveyForm({
  survey,
  answers,
  setAnswers,
  onSubmit,
  submitting,
  message,
}: {
  survey: SurveyRow;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSubmit: () => void;
  submitting: boolean;
  message: string;
}) {
  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="mt-4 space-y-4 border-t border-white/5 pt-4"
    >
      {survey.questions.map((q, idx) => (
        <div key={q.id}>
          <label
            htmlFor={`q-${survey.id}-${q.id}`}
            className="block text-sm font-semibold text-slate-200"
          >
            {idx + 1}. {q.prompt}
          </label>
          {q.kind === "select" && q.options ? (
            <select
              id={`q-${survey.id}-${q.id}`}
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            >
              <option value="">선택해 주세요</option>
              {q.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : q.kind === "scale" ? (
            <ScaleInput
              name={`q-${survey.id}-${q.id}`}
              value={answers[q.id] ?? ""}
              onChange={(v) => setAnswer(q.id, v)}
            />
          ) : (
            <textarea
              id={`q-${survey.id}-${q.id}`}
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            />
          )}
        </div>
      ))}

      {message ? (
        <Alert tone={message.includes("실패") ? "error" : "success"}>
          {message}
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="sm" disabled={submitting}>
          {submitting ? "제출 중..." : "제출"}
        </Button>
      </div>
    </form>
  );
}

function ScaleInput({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // 1~5 라디오 — 옛 시트 "3 - 보통이다" 같은 자유 텍스트도 그대로 보존 가능.
  // 새 응답은 숫자 문자열("1".."5") 저장.
  const opts = [
    { v: "1", label: "1 (매우 그렇지 않다)" },
    { v: "2", label: "2 (그렇지 않다)" },
    { v: "3", label: "3 (보통이다)" },
    { v: "4", label: "4 (그렇다)" },
    { v: "5", label: "5 (매우 그렇다)" },
  ];
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {opts.map((o) => {
        const active = value === o.v || value === o.label || value.startsWith(o.v);
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={
              active
                ? "rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-semibold text-slate-950"
                : "rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
