"use client";

// admin/교사가 학생의 새 성찰(activity_responses)을 조회하는 단순 패널.
// /student/reflections 의 풀 기능(별표·우선순위·편집)과는 별개 — 읽기 전용 펼침 카드.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { shortActivityTitle } from "@/lib/activities/activityTitles";

type ResponseRow = {
  id: string;
  subject: string | null;
  activity_slug: string | null;
  reflection_data: Record<string, unknown> | null;
  response_data: Record<string, unknown> | null;
  created_at: string;
  activities: { title: string | null } | null;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/**
 * 조회 범위. 교사가 수업을 고르고 볼 때는 그 (학년도·학기·교과) 로 좁힌다.
 * 학생 본인 화면처럼 범위가 없으면 전체를 보여준다.
 */
export type RecordScope = {
  school_year: number;
  semester: number;
  subject: string;
};

export function ActivityResponsesPanel({
  studentId,
  accentText,
  scope,
}: {
  studentId: string | null;
  accentText: string;
  scope?: RecordScope | null;
}) {
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(false);

  const scopeYear = scope?.school_year ?? null;
  const scopeSemester = scope?.semester ?? null;
  const scopeSubject = scope?.subject ?? null;

  useEffect(() => {
    if (!studentId) {
      setRows([]);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      let query = supabase
        .from("activity_responses")
        .select(
          "id, subject, activity_slug, reflection_data, response_data, created_at, activities(title)"
        )
        .eq("student_id", studentId);
      if (scopeYear !== null && scopeSemester !== null && scopeSubject) {
        query = query
          .eq("school_year", scopeYear)
          .eq("semester", scopeSemester)
          .eq("subject", scopeSubject);
      }
      const { data } = await query.order("created_at", { ascending: false });
      if (!active) return;
      setRows((data ?? []) as unknown as ResponseRow[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [studentId, scopeYear, scopeSemester, scopeSubject]);

  if (!studentId) return null;
  if (loading)
    return <p className="text-sm text-slate-400">새 성찰 불러오는 중...</p>;

  return (
    <section className="mb-6 rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.04] p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className={`text-base font-bold ${accentText}`}>
            🆕 현재 앱 성찰
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {scope
              ? `${scope.school_year}학년도 ${scope.semester}학기 · ${scope.subject} 성찰 ${rows.length}건`
              : `새로 만든 웹앱에서 작성한 성찰 ${rows.length}건`}
          </p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">
          {scope
            ? "이 수업 범위에서 작성한 성찰이 없습니다."
            : "아직 새 앱에서 작성한 성찰이 없습니다."}
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((r) => {
            const title =
              shortActivityTitle(r.activity_slug ?? "") ||
              r.activities?.title ||
              r.activity_slug ||
              "(활동 미상)";
            const reflectionEntries = r.reflection_data
              ? Object.entries(r.reflection_data)
              : [];
            return (
              <details
                key={r.id}
                className="rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 transition open:bg-slate-950"
              >
                <summary className="cursor-pointer text-sm marker:text-slate-500">
                  <span className="font-semibold text-white">{title}</span>
                  {r.subject ? (
                    <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      {r.subject}
                    </span>
                  ) : null}
                  <span className="ml-2 text-[11px] text-slate-500">
                    {formatDateTime(r.created_at)}
                  </span>
                </summary>
                <div className="mt-3 space-y-2 border-t border-white/5 pt-3 text-xs">
                  {reflectionEntries.length > 0 ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-300/80">
                        성찰
                      </p>
                      <div className="mt-1 space-y-1.5">
                        {reflectionEntries.map(([k, v]) => {
                          const obj = v as {
                            prompt?: string;
                            answer?: string;
                          } | null;
                          if (obj && typeof obj === "object") {
                            return (
                              <div key={k} className="flex flex-col gap-0.5">
                                {obj.prompt ? (
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    {obj.prompt}
                                  </span>
                                ) : null}
                                <span className="whitespace-pre-wrap text-slate-100">
                                  {String(obj.answer ?? "")}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div key={k} className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-semibold text-slate-400">
                                {k}
                              </span>
                              <span className="whitespace-pre-wrap text-slate-100">
                                {String(v ?? "")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  {r.response_data ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        결과 데이터(raw)
                      </p>
                      <pre className="mt-1 overflow-x-auto rounded bg-black/30 p-2 text-[10px] text-slate-400">
                        {JSON.stringify(r.response_data, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
