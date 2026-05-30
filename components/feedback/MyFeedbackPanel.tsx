"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  FEEDBACK_CATEGORIES,
  categoryLabel,
  statusInfo,
  type FeedbackCategory,
  type FeedbackRow,
} from "./types";

type Props = {
  // 역할별 액센트 텍스트 클래스 (예: "text-emerald-200")
  accentText: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function MyFeedbackPanel({ accentText }: Props) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitOk, setSubmitOk] = useState(false);

  const [myList, setMyList] = useState<FeedbackRow[]>([]);
  const [listError, setListError] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setProfileId(user?.id ?? null);
      setAuthChecked(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const loadMine = useCallback(async () => {
    if (!profileId) return;
    setListLoading(true);
    setListError("");
    const { data, error } = await supabase
      .from("feedback")
      .select(
        "id, profile_id, category, title, body, status, admin_reply, created_at, resolved_at"
      )
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });
    if (error) setListError(error.message);
    setMyList((data ?? []) as FeedbackRow[]);
    setListLoading(false);
  }, [profileId]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId) return;
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) {
      setSubmitError("제목과 내용을 모두 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    setSubmitOk(false);

    const { error } = await supabase.from("feedback").insert({
      profile_id: profileId,
      category,
      title: t,
      body: b,
    });
    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }
    setSubmitOk(true);
    setTitle("");
    setBody("");
    setSubmitting(false);
    loadMine();
  }

  if (!authChecked) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
        확인 중...
      </div>
    );
  }
  if (!profileId) {
    return (
      <div className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6 text-sm text-amber-200">
        로그인이 필요합니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 작성 폼 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <h2 className="text-base font-bold">새 건의 보내기</h2>
        <p className="mt-1 text-xs text-slate-400">
          관리자가 확인 후 상태를 갱신하고 필요하면 답변을 남깁니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="fb-cat"
              className="text-xs font-semibold text-slate-300"
            >
              카테고리
            </label>
            <select
              id="fb-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
            >
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="fb-title"
              className="text-xs font-semibold text-slate-300"
            >
              제목
            </label>
            <input
              id="fb-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="짧은 한 줄 요약"
              className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
          </div>

          <div>
            <label
              htmlFor="fb-body"
              className="text-xs font-semibold text-slate-300"
            >
              내용
            </label>
            <textarea
              id="fb-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="언제·어디서·어떤 일이 있었는지, 또는 어떤 활동을 원하는지 자세히 적어주세요."
              className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
          </div>

          {submitError ? (
            <Alert tone="error">{submitError}</Alert>
          ) : null}
          {submitOk ? (
            <Alert tone="success">건의가 접수되었습니다. 아래 목록에서 진행 상태를 확인할 수 있습니다.</Alert>
          ) : null}

          <div className="flex items-center justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "보내는 중..." : "보내기"}
            </Button>
          </div>
        </form>
      </section>

      {/* 내 건의 목록 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold">
            내 건의 ({myList.length}건)
          </h2>
          <button
            type="button"
            onClick={loadMine}
            disabled={listLoading}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-60"
          >
            {listLoading ? "..." : "새로고침"}
          </button>
        </div>

        {listError ? (
          <Alert tone="error" className="mt-3">
            {listError}
          </Alert>
        ) : null}

        {myList.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">아직 보낸 건의가 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {myList.map((row) => {
              const stat = statusInfo(row.status);
              const isOpen = expanded === row.id;
              return (
                <li
                  key={row.id}
                  className="rounded-lg border border-white/5 bg-slate-950/60 p-3"
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
                    <span className={accentText}>
                      {categoryLabel(row.category)}
                    </span>
                    <span>{formatDateTime(row.created_at)}</span>
                  </div>
                  {isOpen ? (
                    <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
                      <p className="whitespace-pre-wrap text-sm text-slate-200">
                        {row.body}
                      </p>
                      {row.admin_reply ? (
                        <div className="rounded border border-emerald-300/20 bg-emerald-300/5 p-2">
                          <p className="text-[11px] font-semibold text-emerald-200">
                            관리자 답변
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">
                            {row.admin_reply}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          아직 답변 없음
                        </p>
                      )}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((cur) => (cur === row.id ? null : row.id))
                    }
                    className={`mt-2 text-[11px] font-semibold ${accentText} hover:opacity-80`}
                  >
                    {isOpen ? "접기" : "자세히"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
