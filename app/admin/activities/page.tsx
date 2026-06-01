"use client";

// 관리자 전용 activities 행 CRUD.
// - activities = 옛 세션 시절 공유 템플릿(현재 curriculum_units 가 주역).
// - 운영 빈도 낮음. 신규/삭제/블록 편집 링크만 제공.
// - RLS admin all activities → SELECT/INSERT/DELETE 허용. UPDATE 는 별도 페이지(/teacher/activities/[id]/blocks).

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

type ActivityRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  subject: string | null;
  activity_type: string | null;
  content_blocks: unknown[] | null;
  created_at: string | null;
};

type SubjectOption = { name: string };

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function countBlocks(b: unknown): number {
  return Array.isArray(b) ? b.length : 0;
}

export default function AdminActivitiesPage() {
  const router = useRouter();
  const theme = getRoleTheme("admin");
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // 신규 활동 폼
  const [adding, setAdding] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState<string>("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState("");
  const [addBusy, setAddBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [aRes, sRes] = await Promise.all([
      supabase
        .from("activities")
        .select(
          "id, slug, title, description, subject, activity_type, content_blocks, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("subjects")
        .select("name, order_index")
        .order("order_index"),
    ]);
    if (aRes.error) setError(aRes.error.message);
    setRows((aRes.data ?? []) as ActivityRow[]);
    setSubjects(
      ((sRes.data ?? []) as SubjectOption[]).map((s) => s.name)
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setNewSlug("");
    setNewTitle("");
    setNewSubject("");
    setNewDescription("");
    setNewType("");
  }

  async function handleAdd() {
    const slug = newSlug.trim();
    const title = newTitle.trim();
    if (!slug) {
      setError("slug 를 입력해 주세요.");
      return;
    }
    if (!title) {
      setError("활동명을 입력해 주세요.");
      return;
    }
    setAddBusy(true);
    setError("");
    const { error: e } = await supabase.from("activities").insert({
      slug,
      title,
      subject: newSubject || null,
      description: newDescription.trim() || null,
      activity_type: newType.trim() || null,
      content_blocks: [],
    });
    setAddBusy(false);
    if (e) {
      setError(
        e.code === "23505"
          ? `slug "${slug}" 가 이미 존재합니다.`
          : e.message
      );
      return;
    }
    resetForm();
    setAdding(false);
    await load();
  }

  async function handleDelete(row: ActivityRow) {
    const confirmed = confirm(
      `활동 "${row.title}" (slug=${row.slug}) 을 영구 삭제할까요?\n\n` +
        `주의: 이 활동의 콘텐츠 블록은 함께 사라집니다.\n` +
        `(activity_responses 가 이 활동을 참조 중이면 RESTRICT 로 삭제가 거부될 수 있습니다.)`
    );
    if (!confirmed) return;
    setBusyId(row.id);
    setError("");
    const { error: e } = await supabase
      .from("activities")
      .delete()
      .eq("id", row.id);
    setBusyId(null);
    if (e) {
      setError(`삭제 실패: ${e.message}`);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>
          활동 행 관리
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          activities 신규/삭제
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          활동 행(공유 템플릿) 자체의 신규/삭제. 콘텐츠 블록 편집은 행의
          [블록 편집] 버튼에서. 단원·블록은 별도{" "}
          <Link
            href="/admin/curriculum"
            className={`underline ${theme.accentText}`}
          >
            단원 관리
          </Link>{" "}
          에서 다룹니다.
        </p>
      </div>

      {error ? (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          총 {rows.length}개 · 가장 최근부터
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setAdding((v) => !v)}
          >
            {adding ? "취소" : "+ 새 활동"}
          </Button>
        </div>
      </div>

      {/* 신규 폼 */}
      {adding ? (
        <div className="mb-4 rounded-2xl border border-cyan-300/30 bg-cyan-300/5 p-4">
          <p className="text-xs font-semibold text-cyan-200">새 활동 추가</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex flex-col text-xs text-slate-300">
              <span>slug (영문 식별자) *</span>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="probability-simulator-v2"
                className="mt-1 rounded border border-white/10 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
              />
            </label>
            <label className="flex flex-col text-xs text-slate-300">
              <span>활동명 *</span>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="확률 시뮬레이터"
                className="mt-1 rounded border border-white/10 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
              />
            </label>
            <label className="flex flex-col text-xs text-slate-300">
              <span>과목</span>
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="mt-1 rounded border border-white/10 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
                aria-label="과목"
              >
                <option value="">(미지정)</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs text-slate-300">
              <span>유형(activity_type, 자유)</span>
              <input
                type="text"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="probability / counting / ..."
                className="mt-1 rounded border border-white/10 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
              />
            </label>
            <label className="col-span-1 flex flex-col text-xs text-slate-300 sm:col-span-2">
              <span>설명</span>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
                placeholder="짧은 설명"
                className="mt-1 rounded border border-white/10 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                resetForm();
              }}
              disabled={addBusy}
              className="rounded px-3 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-60"
            >
              취소
            </button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleAdd}
              disabled={addBusy || !newSlug.trim() || !newTitle.trim()}
            >
              {addBusy ? "저장 중..." : "저장"}
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            저장 후 행의 [블록 편집] 으로 콘텐츠 블록을 채우세요. content_blocks
            는 빈 배열로 시작합니다.
          </p>
        </div>
      ) : null}

      {/* 표 */}
      {rows.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-400">
          등록된 활동이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                  활동
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                  slug
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                  과목
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-300">
                  블록
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                  생성
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-300">
                  <span className="sr-only">관리</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="px-3 py-2 text-white">
                    {r.title}
                    {r.description ? (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                        {r.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-300">
                    {r.slug}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-slate-300">
                    {r.subject ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">
                      {countBlocks(r.content_blocks)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-slate-400">
                    {formatDateTime(r.created_at)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/teacher/activities/${r.id}/blocks`)
                        }
                        className="rounded border border-white/10 px-2 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-white/10"
                      >
                        블록 편집
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        disabled={busyId === r.id}
                        aria-label={`${r.title} 삭제`}
                        className="rounded border border-rose-300/30 px-2 py-1 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-300/10 disabled:opacity-60"
                      >
                        {busyId === r.id ? "..." : "✕"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/admin"
          className="text-xs font-semibold text-slate-400 hover:text-white"
        >
          ← 관리자 홈으로
        </Link>
      </div>
    </>
  );
}
