"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { getResultRenderer } from "@/components/activities/resultRenderer";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { extractMainReflection } from "@/lib/activities/reflection";

// 통합 페이지: "내 성찰"
// - 학생이 제출한 모든 활동 응답을 한 곳에서 본다.
// - 필터 칩으로 "전체 / ★ 생기부 후보" 전환.
// - ★ 토글로 생기부 후보 마킹. 마킹된 행에 한해 우선순위 1·2·3 + 코멘트 인라인 편집.
// - "결과 자세히 보기" 펼침으로 RawJsonResult / 활동별 렌더러로 응답 상세 시각화.
// (구) /student/records 는 여기로 리다이렉트.

type ActivityResponseRow = {
  id: string;
  subject: string | null;
  activity_slug: string | null;
  reflection_data: Record<string, unknown> | null;
  response_data: Record<string, unknown> | null;
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
  const [loadError, setLoadError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "marked">("all");
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

  const loadAll = useCallback(async () => {
    if (!studentId) {
      setResponses([]);
      return;
    }
    setIsLoading(true);
    setLoadError("");

    const [respRes, prioRes] = await Promise.all([
      supabase
        .from("activity_responses")
        .select(
          "id, subject, activity_slug, reflection_data, response_data, created_at, activities ( title )"
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),
      supabase
        .from("reflection_priority")
        .select("id, activity_response_id, marked, priority_rank, comment")
        .eq("student_id", studentId),
    ]);

    if (respRes.error) {
      setLoadError(respRes.error.message);
      setResponses([]);
    } else {
      setResponses((respRes.data ?? []) as unknown as ActivityResponseRow[]);
    }
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
    loadAll();
  }, [loadAll]);

  async function toggleMarked(responseId: string) {
    if (!studentId) return;
    const cur = priorities[responseId];
    const newMarked = !cur?.marked;

    if (cur) {
      const { data, error } = await supabase
        .from("reflection_priority")
        .update({ marked: newMarked })
        .eq("id", cur.id)
        .select("id, activity_response_id, marked, priority_rank, comment")
        .single();
      if (error) {
        setLoadError(error.message);
        return;
      }
      setPriorities((prev) => ({
        ...prev,
        [responseId]: data as PriorityRow,
      }));
    } else {
      const { data, error } = await supabase
        .from("reflection_priority")
        .insert({
          activity_response_id: responseId,
          student_id: studentId,
          marked: newMarked,
        })
        .select("id, activity_response_id, marked, priority_rank, comment")
        .single();
      if (error) {
        setLoadError(error.message);
        return;
      }
      setPriorities((prev) => ({
        ...prev,
        [responseId]: data as PriorityRow,
      }));
    }
  }

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
      setLoadError(error.message);
      return;
    }
    setPriorities((prev) => ({
      ...prev,
      [responseId]: data as PriorityRow,
    }));
  }

  const filtered = useMemo(() => {
    if (filter === "marked") {
      const onlyMarked = responses.filter((r) => priorities[r.id]?.marked);
      // 별표 모드는 우선순위 → 최신 순
      return onlyMarked.sort((a, b) => {
        const ra = priorities[a.id]?.priority_rank ?? 999;
        const rb = priorities[b.id]?.priority_rank ?? 999;
        if (ra !== rb) return ra - rb;
        return a.created_at < b.created_at ? 1 : -1;
      });
    }
    return responses;
  }, [responses, priorities, filter]);

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
        본인 학생 정보가 없습니다 (관리자 계정 등). 학생 본인 계정으로 로그인해
        주세요.
      </div>
    );
  }

  const markedCount = Object.values(priorities).filter((p) => p.marked).length;

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>내 성찰</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">성찰 모음</h1>
        <p className="mt-1 text-sm text-slate-400">
          제출한 활동·성찰을 활동별 결과 시각화와 함께 봅니다. ★ 토글로 생기부
          후보로 표시한 뒤 우선순위·코멘트를 남기면, 교사가 세특 작성 시
          참고합니다.
        </p>
      </div>

      {loadError ? (
        <Alert tone="error" className="mb-4">
          {loadError}
        </Alert>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "all"
                ? `${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            전체 ({responses.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("marked")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "marked"
                ? `${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            ★ 생기부 후보 ({markedCount})
          </button>
        </div>
        <button
          type="button"
          onClick={loadAll}
          disabled={isLoading}
          className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-60"
        >
          {isLoading ? "불러오는 중..." : "새로고침"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950 p-8 text-center text-slate-400">
          {filter === "marked"
            ? "별표 표시한 성찰이 아직 없습니다. '전체'에서 ☆를 ★로 바꿔 보세요."
            : "아직 제출한 활동 기록이 없습니다."}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((row) => {
            const isExpanded = expandedId === row.id;
            const reflection = extractMainReflection(row.reflection_data);
            const Renderer = getResultRenderer(row.activity_slug);
            const prio = priorities[row.id];
            const isMarked = !!prio?.marked;
            const isEditingComment = editingComment === row.id;

            return (
              <li
                key={row.id}
                className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleMarked(row.id)}
                      aria-label={isMarked ? "생기부 후보 별표 해제" : "생기부 후보로 별표"}
                      className={`text-lg transition ${
                        isMarked
                          ? "text-amber-300"
                          : "text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      {isMarked ? "★" : "☆"}
                    </button>
                    <p className="font-semibold text-white">
                      {row.activities?.title ??
                        row.activity_slug ??
                        "활동"}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {formatDateTime(row.created_at)}
                  </p>
                </div>

                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  {row.subject ? (
                    <span className={theme.accentText}>{row.subject}</span>
                  ) : null}
                  {row.activity_slug ? (
                    <span className="text-slate-500">{row.activity_slug}</span>
                  ) : null}
                </div>

                {reflection ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                    {reflection}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">성찰 내용 없음</p>
                )}

                {/* 별표된 행만: 우선순위 + 코멘트 인라인 */}
                {isMarked && prio ? (
                  <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">
                        우선순위:
                      </span>
                      {[1, 2, 3].map((rank) => {
                        const isSel = prio.priority_rank === rank;
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
                      {prio.priority_rank ? (
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
                            setCommentDraft(prio.comment ?? "");
                          }}
                          className="mt-1 block w-full rounded border border-white/10 bg-slate-950 px-2 py-2 text-left text-sm text-slate-300 hover:bg-white/5"
                        >
                          {prio.comment ? (
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
                ) : null}

                {isExpanded ? (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <Renderer
                      responseData={row.response_data}
                      reflectionData={row.reflection_data}
                    />
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((cur) =>
                      cur === row.id ? null : row.id
                    )
                  }
                  className={`mt-3 text-xs font-semibold transition ${theme.accentText} hover:opacity-80`}
                >
                  {isExpanded ? "접기" : "결과 자세히 보기"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
