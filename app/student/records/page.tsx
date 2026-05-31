"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { getResultRenderer } from "@/components/activities/resultRenderer";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { extractMainReflection } from "@/lib/activities/reflection";

type ActivityResponseRow = {
  id: string;
  subject: string | null;
  activity_slug: string | null;
  reflection_data: Record<string, unknown> | null;
  response_data: Record<string, unknown> | null;
  created_at: string;
  activities: {
    title: string | null;
  } | null;
};

type PriorityRow = {
  activity_response_id: string;
  marked: boolean;
  priority_rank: number | null;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function StudentRecordsPage() {
  const theme = getRoleTheme("student");

  const [studentId, setStudentId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [responses, setResponses] = useState<ActivityResponseRow[]>([]);
  const [priorities, setPriorities] = useState<Record<string, PriorityRow>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "marked">("all");

  // 본인 student id 조회 (관리자는 null)
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
        .select("activity_response_id, marked, priority_rank")
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

  // 별표 토글 — 우선순위(reflection_priority) upsert/delete
  async function toggleMarked(responseId: string) {
    if (!studentId) return;
    const cur = priorities[responseId];
    const newMarked = !cur?.marked;

    if (cur) {
      const { error } = await supabase
        .from("reflection_priority")
        .update({ marked: newMarked })
        .eq("activity_response_id", responseId);
      if (error) {
        setLoadError(error.message);
        return;
      }
      setPriorities((prev) => ({
        ...prev,
        [responseId]: { ...cur, marked: newMarked },
      }));
    } else {
      const { data, error } = await supabase
        .from("reflection_priority")
        .insert({
          activity_response_id: responseId,
          student_id: studentId,
          marked: newMarked,
        })
        .select("activity_response_id, marked, priority_rank")
        .single();
      if (error) {
        setLoadError(error.message);
        return;
      }
      const row = data as PriorityRow;
      setPriorities((prev) => ({
        ...prev,
        [responseId]: row,
      }));
    }
  }

  const filtered = useMemo(() => {
    if (filter === "marked") {
      return responses.filter((r) => priorities[r.id]?.marked);
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
        <p className={`text-sm font-semibold ${theme.accentText}`}>내 활동</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">활동 기록</h1>
        <p className="mt-1 text-sm text-slate-400">
          제출한 활동·성찰을 활동별 결과 시각화와 함께 봅니다. ★ 토글로 생기부
          후보를 표시할 수 있습니다.
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
            ? "별표 표시한 성찰이 아직 없습니다. 아래 '전체'에서 별표를 눌러보세요."
            : "아직 제출한 활동 기록이 없습니다."}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((row) => {
            const isExpanded = expandedId === row.id;
            const reflection = extractMainReflection(row.reflection_data);
            const Renderer = getResultRenderer(row.activity_slug);
            const isMarked = !!priorities[row.id]?.marked;

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
