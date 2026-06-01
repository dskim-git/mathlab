"use client";

// 본인 알림 전체 목록 — NotificationBell 의 드롭다운(최근 30개)과 달리 페이지네이션 + 필터.
// RLS owner SELECT 로 본인 행만 보임.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type NotificationRow = {
  id: number;
  type: "feedback_received" | "feedback_replied" | "response_locked";
  title: string;
  body: string | null;
  ref_table: string | null;
  ref_id: string | null;
  read_at: string | null;
  created_at: string;
};

type FilterKey = "all" | "unread";

const TYPE_LABEL: Record<NotificationRow["type"], string> = {
  feedback_received: "새 건의",
  feedback_replied: "건의 답변",
  response_locked: "성찰 마감",
};

const TYPE_BADGE: Record<NotificationRow["type"], string> = {
  feedback_received: "bg-cyan-300/15 text-cyan-200",
  feedback_replied: "bg-emerald-300/15 text-emerald-200",
  response_locked: "bg-amber-300/15 text-amber-200",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function hrefForNotification(
  n: NotificationRow,
  role: string | null
): string {
  if (n.type === "feedback_received") return "/admin/feedback";
  if (n.type === "feedback_replied") {
    if (role === "student") return "/student/feedback";
    if (role === "teacher") return "/teacher/feedback";
    if (role === "general") return "/general/feedback";
    return "/admin/feedback";
  }
  if (n.type === "response_locked") return "/student/reflections";
  return "/";
}

const PAGE_SIZE = 50;

export function NotificationsList({ role }: { role: string }) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const load = useCallback(
    async (reset: boolean) => {
      setLoading(true);
      setError("");
      const from = reset ? 0 : offset;
      let q = supabase
        .from("notifications")
        .select("id, type, title, body, ref_table, ref_id, read_at, created_at")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (filter === "unread") q = q.is("read_at", null);
      const { data, error: e } = await q;
      if (e) {
        setError(e.message);
        setLoading(false);
        return;
      }
      const next = (data ?? []) as NotificationRow[];
      setHasMore(next.length === PAGE_SIZE);
      if (reset) {
        setItems(next);
        setOffset(next.length);
      } else {
        setItems((prev) => [...prev, ...next]);
        setOffset(from + next.length);
      }
      setLoading(false);
    },
    [filter, offset]
  );

  // 필터 바뀌면 처음부터 다시 로드
  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read_at).length,
    [items]
  );

  async function markAllRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const nowIso = new Date().toISOString();
    await supabase
      .from("notifications")
      .update({ read_at: nowIso })
      .eq("recipient_profile_id", user.id)
      .is("read_at", null);
    setItems((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: nowIso }))
    );
  }

  async function toggleRead(n: NotificationRow) {
    const nowIso = new Date().toISOString();
    const next = n.read_at ? null : nowIso;
    await supabase.from("notifications").update({ read_at: next }).eq("id", n.id);
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read_at: next } : x))
    );
  }

  async function handleClick(n: NotificationRow) {
    if (!n.read_at) {
      const nowIso = new Date().toISOString();
      await supabase
        .from("notifications")
        .update({ read_at: nowIso })
        .eq("id", n.id);
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read_at: nowIso } : x))
      );
    }
    router.push(hrefForNotification(n, role));
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "all"
                ? "bg-cyan-300 text-slate-950"
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            전체
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === "unread"
                ? "bg-cyan-300 text-slate-950"
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            읽지 않음 ({unreadCount})
          </button>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
          >
            전체 읽음
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-3 text-xs text-rose-300">불러오기 오류: {error}</p>
      ) : null}

      {items.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-400">
          {filter === "unread"
            ? "읽지 않은 알림이 없습니다."
            : "알림이 없습니다."}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border border-white/10 bg-slate-900/40 p-3 ${
                n.read_at ? "opacity-70" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className="flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        TYPE_BADGE[n.type]
                      }`}
                    >
                      {TYPE_LABEL[n.type]}
                    </span>
                    {!n.read_at ? (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-300" />
                    ) : null}
                    <p
                      className={`text-sm font-semibold ${
                        n.read_at ? "text-slate-300" : "text-white"
                      }`}
                    >
                      {n.title}
                    </p>
                  </div>
                  {n.body ? (
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-slate-400">
                      {n.body}
                    </p>
                  ) : null}
                </button>
                <div className="flex shrink-0 items-center gap-2 text-[11px] text-slate-500">
                  <span>{formatDateTime(n.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => toggleRead(n)}
                    className="rounded border border-white/10 px-2 py-0.5 transition hover:bg-white/10"
                  >
                    {n.read_at ? "읽지 않음으로" : "읽음으로"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-center">
        {hasMore ? (
          <button
            type="button"
            onClick={() => load(false)}
            disabled={loading}
            className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? "불러오는 중..." : "더 보기"}
          </button>
        ) : items.length > 0 ? (
          <p className="text-[11px] text-slate-500">마지막입니다.</p>
        ) : null}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-xs font-semibold text-slate-400 hover:text-white"
        >
          홈으로
        </Link>
      </div>
    </>
  );
}
