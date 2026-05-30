"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  FEEDBACK_STATUSES,
  categoryLabel,
  statusInfo,
  type FeedbackRow,
  type FeedbackStatus,
} from "@/components/feedback/types";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

type RowWithProfile = FeedbackRow & {
  profiles: {
    name: string | null;
    login_id: string | null;
    role: string | null;
  } | null;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const FILTER_OPTIONS: { value: FeedbackStatus | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "received", label: "접수" },
  { value: "reviewing", label: "검토" },
  { value: "resolved", label: "처리완료" },
  { value: "rejected", label: "반려" },
];

export default function AdminFeedbackPage() {
  const theme = getRoleTheme("admin");

  const [filter, setFilter] = useState<FeedbackStatus | "all">("all");
  const [rows, setRows] = useState<RowWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [openId, setOpenId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<FeedbackStatus>("received");
  const [replyDraft, setReplyDraft] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const { data, error } = await supabase
      .from("feedback")
      .select(
        "id, profile_id, category, title, body, status, admin_reply, created_at, resolved_at, profiles ( name, login_id, role )"
      )
      .order("created_at", { ascending: false });
    if (error) setErrorMessage(error.message);
    setRows((data ?? []) as unknown as RowWithProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: rows.length };
    FEEDBACK_STATUSES.forEach((s) => {
      m[s.value] = rows.filter((r) => r.status === s.value).length;
    });
    return m;
  }, [rows]);

  function startEdit(row: RowWithProfile) {
    setOpenId(row.id);
    setStatusDraft(row.status as FeedbackStatus);
    setReplyDraft(row.admin_reply ?? "");
  }
  function cancelEdit() {
    setOpenId(null);
    setReplyDraft("");
  }

  async function save(row: RowWithProfile) {
    setSavingId(row.id);
    setErrorMessage("");
    const isClosing =
      (statusDraft === "resolved" || statusDraft === "rejected") &&
      !row.resolved_at;
    const patch: Record<string, unknown> = {
      status: statusDraft,
      admin_reply: replyDraft.trim() || null,
    };
    if (isClosing) {
      patch.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("feedback")
      .update(patch)
      .eq("id", row.id);
    if (error) {
      setErrorMessage(error.message);
      setSavingId(null);
      return;
    }
    setSavingId(null);
    setOpenId(null);
    load();
  }

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>건의사항</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          학생·일반인 건의 처리
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          접수된 건의를 검토하고 상태를 변경하거나 답변을 남깁니다.
        </p>
      </div>

      {errorMessage ? (
        <Alert tone="error" className="mb-4">
          {errorMessage}
        </Alert>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const isSel = filter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  isSel
                    ? `${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {opt.label} ({counts[opt.value] ?? 0})
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-60"
        >
          {loading ? "..." : "새로고침"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950 p-8 text-center text-slate-400">
          {filter === "all"
            ? "건의가 없습니다."
            : "이 상태의 건의가 없습니다."}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((row) => {
            const stat = statusInfo(row.status);
            const isOpen = openId === row.id;
            const isSaving = savingId === row.id;
            const author = row.profiles?.name ?? "(이름 없음)";
            const authorId = row.profiles?.login_id ?? "";
            const authorRole = row.profiles?.role ?? "";

            return (
              <li
                key={row.id}
                className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">
                    {row.title}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${stat.badgeClass}`}
                  >
                    {stat.label}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className={theme.accentText}>
                    {categoryLabel(row.category)}
                  </span>
                  <span>
                    {author}
                    {authorId ? ` (${authorId})` : ""}
                    {authorRole ? ` · ${authorRole}` : ""}
                  </span>
                  <span>{formatDateTime(row.created_at)}</span>
                </div>

                {isOpen ? (
                  <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">
                        본문
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">
                        {row.body}
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor={`status-${row.id}`}
                        className="text-xs font-semibold text-slate-300"
                      >
                        상태
                      </label>
                      <select
                        id={`status-${row.id}`}
                        value={statusDraft}
                        onChange={(e) =>
                          setStatusDraft(e.target.value as FeedbackStatus)
                        }
                        className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
                      >
                        {FEEDBACK_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`reply-${row.id}`}
                        className="text-xs font-semibold text-slate-300"
                      >
                        관리자 답변 (선택)
                      </label>
                      <textarea
                        id={`reply-${row.id}`}
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        rows={4}
                        placeholder="예: 해당 버그는 다음 업데이트에서 수정될 예정입니다. 감사합니다."
                        className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isSaving}
                        className="rounded px-3 py-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-60"
                      >
                        취소
                      </button>
                      <Button
                        size="sm"
                        onClick={() => save(row)}
                        disabled={isSaving}
                      >
                        {isSaving ? "저장중" : "저장"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className={`mt-2 text-xs font-semibold ${theme.accentText} hover:opacity-80`}
                  >
                    상세 / 처리 →
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
