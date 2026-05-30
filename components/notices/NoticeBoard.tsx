"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type NoticeRow = {
  id: string;
  title: string;
  body: string;
  target_kind: string;
  target_value: string | null;
  created_at: string;
  profiles: { name: string | null } | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

type Props = {
  accentText: string;
  // 표시할 최대 개수
  limit?: number;
};

/**
 * 본인이 받을 수 있는 공지 목록 (RLS 가 자동으로 대상 매칭 필터).
 * 홈 페이지 상단에 amber 박스로 노출한다.
 */
export function NoticeBoard({ accentText, limit = 5 }: Props) {
  const [rows, setRows] = useState<NoticeRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notices")
      .select(
        "id, title, body, target_kind, target_value, created_at, profiles ( name )"
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    setRows((data ?? []) as unknown as NoticeRow[]);
    setLoaded(true);
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  if (!loaded || rows.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 sm:p-5">
      <p className={`text-xs font-semibold ${accentText}`}>📢 공지사항</p>
      <ul className="mt-2 space-y-2">
        {rows.map((n) => {
          const isOpen = openId === n.id;
          return (
            <li
              key={n.id}
              className="rounded-lg border border-white/5 bg-slate-950/60 p-3"
            >
              <button
                type="button"
                onClick={() => setOpenId((cur) => (cur === n.id ? null : n.id))}
                className="block w-full text-left"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">
                    {n.title}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {formatDate(n.created_at)}
                  </span>
                </div>
              </button>
              {isOpen ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
                  {n.body}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
