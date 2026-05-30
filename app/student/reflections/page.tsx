"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

type ActivityResponseRow = {
  id: string;
  subject: string | null;
  activity_slug: string | null;
  reflection_data: { reflection?: string } | null;
  created_at: string;
  activities: { title: string | null } | null;
};

type PriorityRow = {
  id: string;
  activity_response_id: string;
  marked: boolean;
  priority_rank: number | null;
  comment: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function StudentReflectionsPage() {
  const theme = getRoleTheme("student");

  const [studentId, setStudentId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [responses, setResponses] = useState<ActivityResponseRow[]>([]);
  const [priorities, setPriorities] = useState<Record<string, PriorityRow>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setAuthChecked(true);
        return;
      }
      const { data } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (!active) return;
      const row = data as { id: string } | null;
      setStudentId(row?.id ?? null);
      setAuthChecked(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    setError("");

    const [respRes, prioRes] = await Promise.all([
      supabase
        .from("activity_responses")
        .select(
          "id, subject, activity_slug, reflection_data, created_at, activities ( title )"
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),
      supabase
        .from("reflection_priority")
        .select("id, activity_response_id, marked, priority_rank, comment")
        .eq("student_id", studentId)
        .eq("marked", true),
    ]);

    if (respRes.error) setError(respRes.error.message);
    setResponses((respRes.data ?? []) as unknown as ActivityResponseRow[]);

    if (!prioRes.error) {
      const map: Record<string, PriorityRow> = {};
      ((prioRes.data ?? []) as PriorityRow[]).forEach((p) => {
        map[p.activity_response_id] = p;
      });
      setPriorities(map);
    }
    setIsLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function updatePriority(
    responseId: string,
    patch: { priority_rank?: number | null; comment?: string }
  ) {
    const cur = priorities[responseId];
    if (!cur) return;
    const { data, error } = await supabase
      .from("reflection_priority")
      .update(patch)
      .eq("id", cur.id)
      .select("id, activity_response_id, marked, priority_rank, comment")
      .single();
    if (error) {
      setError(error.message);
      return;
    }
    setPriorities((prev) => ({
      ...prev,
      [responseId]: data as PriorityRow,
    }));
  }

  async function unmark(responseId: string) {
    const cur = priorities[responseId];
    if (!cur) return;
    const { error } = await supabase
      .from("reflection_priority")
      .update({ marked: false })
      .eq("id", cur.id);
    if (error) {
      setError(error.message);
      return;
    }
    setPriorities((prev) => {
      const next = { ...prev };
      delete next[responseId];
      return next;
    });
  }

  // 별표 표시된 응답만 + 우선순위 정렬 (낮은 숫자 위, NULL은 아래)
  const markedSorted = useMemo(() => {
    const filtered = responses.filter((r) => priorities[r.id]);
    return filtered.sort((a, b) => {
      const ra = priorities[a.id]?.priority_rank ?? 999;
      const rb = priorities[b.id]?.priority_rank ?? 999;
      if (ra !== rb) return ra - rb;
      // 같은 순위면 최신 위
      return a.created_at < b.created_at ? 1 : -1;
    });
  }, [responses, priorities]);

  if (!authChecked) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
        확인 중...
      </div>
    );
  }
  if (!studentId) {
    return (
      <div className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6 text-sm text-amber-200">
        본인 학생 정보가 없습니다. 학생 계정으로 로그인해 주세요.
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>내 성찰</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          생기부 후보 성찰 모음
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          별표(★) 표시한 성찰만 모아 봅니다. 1·2·3 우선순위를 설정하고, 왜
          중요한지 코멘트를 남기면 교사가 세특 작성 시 참고합니다.
        </p>
      </div>

      {error ? (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
        <Link
          href="/student/records"
          className={buttonClasses("secondary", { size: "sm" })}
        >
          전체 활동 기록 →
        </Link>
        <button
          type="button"
          onClick={load}
          disabled={isLoading}
          className="rounded-full border border-white/20 px-3 py-1.5 font-semibold transition hover:bg-white/10 disabled:opacity-60"
        >
          {isLoading ? "불러오는 중..." : "새로고침"}
        </button>
      </div>

      {markedSorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950 p-8 text-center text-slate-400">
          별표 표시한 성찰이 아직 없습니다. <br />
          <Link
            href="/student/records"
            className={`mt-3 inline-block ${theme.accentText} underline`}
          >
            활동 기록 페이지로 가서 ☆를 ★로 바꿔보세요
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {markedSorted.map((row) => {
            const prio = priorities[row.id];
            const reflection = row.reflection_data?.reflection?.trim() ?? "";
            const isEditingComment = editingComment === row.id;

            return (
              <li
                key={row.id}
                className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">
                      {row.activities?.title ??
                        row.activity_slug ??
                        "활동"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      {row.subject ? (
                        <span className={theme.accentText}>{row.subject}</span>
                      ) : null}
                      <span className="text-slate-400">
                        {formatDateTime(row.created_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => unmark(row.id)}
                    aria-label="별표 해제"
                    className="text-lg text-amber-300 hover:text-amber-200"
                  >
                    ★
                  </button>
                </div>

                {reflection ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                    {reflection}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">성찰 내용 없음</p>
                )}

                {/* 우선순위 + 코멘트 컨트롤 */}
                <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      우선순위:
                    </span>
                    {[1, 2, 3].map((rank) => {
                      const isSel = prio?.priority_rank === rank;
                      return (
                        <button
                          key={rank}
                          type="button"
                          onClick={() =>
                            updatePriority(row.id, {
                              priority_rank: isSel ? null : rank,
                            })
                          }
                          aria-label={`우선순위 ${rank} ${isSel ? "해제" : "설정"}`}
                          className={`h-7 w-7 rounded-full text-xs font-bold transition ${
                            isSel
                              ? `${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`
                              : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {rank}
                        </button>
                      );
                    })}
                    {prio?.priority_rank ? (
                      <span className="text-[11px] text-slate-400">
                        (낮을수록 우선)
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        순위 미설정
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      이 성찰이 왜 중요한지 (코멘트)
                    </p>
                    {isEditingComment ? (
                      <div className="mt-1 space-y-2">
                        <textarea
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          rows={3}
                          placeholder="예: 베이즈 정리를 이 상황에 적용했고, 직관과 다른 결과를 확인했음"
                          className="w-full rounded border border-cyan-300/40 bg-slate-950 px-2 py-1 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-cyan-300/40"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingComment(null);
                              setCommentDraft("");
                            }}
                            className="rounded px-2 py-0.5 text-[11px] text-slate-400 hover:text-white"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await updatePriority(row.id, {
                                comment: commentDraft.trim(),
                              });
                              setEditingComment(null);
                              setCommentDraft("");
                            }}
                            className="rounded bg-cyan-300 px-2 py-0.5 text-[11px] font-bold text-slate-950 hover:bg-cyan-200"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingComment(row.id);
                          setCommentDraft(prio?.comment ?? "");
                        }}
                        className="mt-1 block w-full rounded border border-white/10 bg-slate-950 px-2 py-2 text-left text-sm text-slate-300 hover:bg-white/5"
                      >
                        {prio?.comment ? (
                          <span className="whitespace-pre-wrap">
                            {prio.comment}
                          </span>
                        ) : (
                          <span className="text-slate-500">+ 코멘트 추가</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
