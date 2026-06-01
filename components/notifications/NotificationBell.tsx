"use client";

// 헤더에 마운트하는 알림 종.
// - 본인 알림(notifications) 의 unread 수를 종 뱃지에 표시.
// - 클릭 시 드롭다운 → 최근 알림 목록 + "전체 읽음 처리" + 각 항목 클릭 시 ref_table/ref_id 로 라우팅.
//
// 알림 INSERT 는 DB 트리거가 처리(SECURITY DEFINER). 클라이언트는 SELECT + UPDATE(read_at) 만.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function timeAgoKo(iso: string): string {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.round((now - t) / 1000);
  if (sec < 60) return "방금";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

/** ref_table/ref_id 를 알림 클릭 시 갈 라우트로 변환. 권한 안 맞으면 그냥 홈으로. */
function hrefForNotification(
  n: NotificationRow,
  role: string | null
): string {
  if (n.type === "feedback_received") {
    return "/admin/feedback";
  }
  if (n.type === "feedback_replied") {
    if (role === "student") return "/student/feedback";
    if (role === "teacher") return "/teacher/feedback";
    if (role === "general") return "/general/feedback";
    return "/admin/feedback";
  }
  if (n.type === "response_locked") {
    return "/student/reflections";
  }
  return "/";
}

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setItems([]);
      setRole(null);
      return;
    }
    const [profRes, listRes] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase
        .from("notifications")
        .select("id, type, title, body, ref_table, ref_id, read_at, created_at")
        .eq("recipient_profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    const p = profRes.data as { role: string } | null;
    setRole(p?.role ?? null);
    setItems((listRes.data ?? []) as NotificationRow[]);
  }, []);

  useEffect(() => {
    load();
    // 30 초마다 갱신 — 페이지 머무를 때 새 알림 폴링.
    const handle = setInterval(load, 30_000);
    return () => clearInterval(handle);
  }, [load]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

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

  async function handleItemClick(n: NotificationRow) {
    // 읽음 처리 후 라우팅
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
    setOpen(false);
    router.push(hrefForNotification(n, role));
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`알림 ${unreadCount > 0 ? `(읽지 않음 ${unreadCount}건)` : ""}`}
        className="relative rounded-full border border-white/15 px-2.5 py-1.5 text-base text-slate-100 transition hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-white/10 bg-slate-900 p-2 shadow-xl sm:w-96">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs font-semibold text-slate-300">알림</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] font-semibold text-cyan-300 hover:opacity-80"
                >
                  전체 읽음
                </button>
              ) : null}
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-[11px] font-semibold text-slate-400 hover:text-white"
              >
                전체 보기 →
              </Link>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-slate-400">
              알림이 없습니다.
            </p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs transition hover:bg-white/5 ${
                      n.read_at ? "opacity-70" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`font-semibold ${
                          n.read_at ? "text-slate-300" : "text-white"
                        }`}
                      >
                        {!n.read_at ? (
                          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-cyan-300 align-middle" />
                        ) : null}
                        {n.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-500">
                        {timeAgoKo(n.created_at)}
                      </span>
                    </div>
                    {n.body ? (
                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">
                        {n.body}
                      </p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
