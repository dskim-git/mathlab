"use client";

// 관리자 — activity_scores 정정/삭제. 마스터-디테일:
// 1) 점수가 기록된 활동 list(슬러그별 카운트·최고점) → 카드 클릭
// 2) 그 활동의 점수 표(학생별 정렬 가능 + 행 ✕ 삭제)
// RLS "admin all activity_scores" 로 관리자 SELECT/DELETE 허용.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { shortActivityTitle } from "@/lib/activities/activityTitles";

type ScoreRow = {
  id: string;
  student_id: string;
  activity_slug: string;
  subject: string | null;
  difficulty: string | null;
  score: number;
  display_name: string;
  grade: number | null;
  class_number: number | null;
  student_number: number | null;
  created_at: string;
};

type ActivityGroup = {
  activity_slug: string;
  subject: string | null;
  count: number;
  maxScore: number;
  latest: string;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminScoresPage() {
  const theme = getRoleTheme("admin");
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: e } = await supabase
      .from("activity_scores")
      .select(
        "id, student_id, activity_slug, subject, difficulty, score, display_name, grade, class_number, student_number, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(2000);
    if (e) setError(e.message);
    setRows((data ?? []) as ScoreRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 활동 슬러그별 집계 — 점수가 기록된 활동만
  const groups = useMemo<ActivityGroup[]>(() => {
    const map = new Map<string, ActivityGroup>();
    for (const r of rows) {
      const cur = map.get(r.activity_slug) ?? {
        activity_slug: r.activity_slug,
        subject: r.subject,
        count: 0,
        maxScore: 0,
        latest: r.created_at,
      };
      cur.count += 1;
      if (r.score > cur.maxScore) cur.maxScore = r.score;
      if (r.created_at > cur.latest) cur.latest = r.created_at;
      map.set(r.activity_slug, cur);
    }
    return Array.from(map.values()).sort(
      (a, b) => b.count - a.count || b.latest.localeCompare(a.latest)
    );
  }, [rows]);

  const selectedRows = useMemo(() => {
    if (!selectedSlug) return [];
    return rows
      .filter((r) => r.activity_slug === selectedSlug)
      .sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at));
  }, [rows, selectedSlug]);

  async function handleDelete(row: ScoreRow) {
    const label = `${row.display_name} · ${row.score}점`;
    if (!confirm(`이 점수 기록을 영구 삭제할까요?\n${label}`)) return;
    setBusyId(row.id);
    setError("");
    const { error: e } = await supabase
      .from("activity_scores")
      .delete()
      .eq("id", row.id);
    setBusyId(null);
    if (e) {
      setError(e.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>
          점수 관리
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          게임/활동 점수 정정·삭제
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          점수가 기록되는 활동만 노출됩니다. 활동을 선택하면 그 활동의 점수
          기록을 학생별로 확인하고 잘못된 행을 삭제할 수 있습니다.
        </p>
      </div>

      {error ? (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      ) : null}

      {selectedSlug ? (
        // ── 디테일: 선택한 활동의 점수 표 ──────────────────────────
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSelectedSlug(null)}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
            >
              ← 활동 목록으로
            </button>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-60"
            >
              {loading ? "불러오는 중..." : "새로고침"}
            </button>
          </div>
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold text-slate-400">활동</p>
            <h2 className="mt-1 text-lg font-bold text-white">
              {shortActivityTitle(selectedSlug)}
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              {selectedSlug} · {selectedRows.length}개 기록
            </p>
          </div>

          {selectedRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-400">
              이 활동에 기록된 점수가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                      순위
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                      학생
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-300">
                      점수
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                      난이도
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                      등록 시각
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-300">
                      <span className="sr-only">삭제</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRows.map((r, idx) => (
                    <tr key={r.id} className="border-t border-white/5">
                      <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-2 text-slate-200">
                        {r.display_name}
                        {r.grade != null && r.class_number != null ? (
                          <span className="ml-2 text-[11px] text-slate-400">
                            {r.grade}-{r.class_number}
                            {r.student_number != null
                              ? `-${r.student_number}`
                              : ""}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-amber-200">
                        {r.score}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-400">
                        {r.difficulty ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-400">
                        {formatDateTime(r.created_at)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(r)}
                          disabled={busyId === r.id}
                          aria-label={`${r.display_name} 점수 삭제`}
                          className="rounded border border-rose-300/30 px-2 py-1 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-300/10 disabled:opacity-60"
                        >
                          {busyId === r.id ? "..." : "✕"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        // ── 마스터: 점수 기록된 활동 카드 list ───────────────────
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              점수 기록 활동 {groups.length}개 · 총 {rows.length}건
            </p>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-60"
            >
              {loading ? "불러오는 중..." : "새로고침"}
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-400">
              아직 점수가 기록된 활동이 없습니다.
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <li key={g.activity_slug}>
                  <button
                    type="button"
                    onClick={() => setSelectedSlug(g.activity_slug)}
                    className="block w-full rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-slate-900/70"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white">
                        {shortActivityTitle(g.activity_slug)}
                      </p>
                      {g.subject ? (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-cyan-200">
                          {g.subject}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-400">
                        기록{" "}
                        <span className="font-semibold text-white">
                          {g.count}건
                        </span>
                      </span>
                      <span className="text-slate-400">
                        최고{" "}
                        <span className="font-bold text-amber-200">
                          {g.maxScore}점
                        </span>
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      최근: {formatDateTime(g.latest)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
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
