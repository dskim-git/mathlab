"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";

type DraftRow = {
  id: string;
  student_id: string;
  body: string;
  ai_model: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
  students: {
    grade: number;
    class_number: number;
    student_number: number;
    student_code: string; // 학번 (예: 20602)
    student_login_id: string; // 로그인 아이디 (예: 202620602)
    profiles: { name: string | null } | null;
  } | null;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

type Props = {
  teacherProfileId: string;
  schoolYear: number;
  accentText: string;
};

export function SebteukList({
  teacherProfileId,
  schoolYear,
  accentText,
}: Props) {
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all"); // "G-C" or "all"
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 인라인 편집
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editSavedId, setEditSavedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const { data, error } = await supabase
      .from("sebteuk_drafts")
      .select(
        "id, student_id, body, ai_model, status, created_at, updated_at, finalized_at, students ( grade, class_number, student_number, student_code, student_login_id, profiles ( name ) )"
      )
      .eq("teacher_id", teacherProfileId)
      .eq("school_year", schoolYear)
      .order("updated_at", { ascending: false });
    if (error) setErrorMessage(error.message);
    setRows((data ?? []) as unknown as DraftRow[]);
    setLoading(false);
  }, [teacherProfileId, schoolYear]);

  useEffect(() => {
    load();
  }, [load]);

  // 학반 옵션
  const classOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.students)
        set.add(`${r.students.grade}-${r.students.class_number}`);
    });
    return Array.from(set).sort((a, b) => {
      const [ga, ca] = a.split("-").map(Number);
      const [gb, cb] = b.split("-").map(Number);
      if (ga !== gb) return ga - gb;
      return ca - cb;
    });
  }, [rows]);

  // 필터 + 정렬
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (classFilter !== "all") {
          const s = r.students;
          if (!s || `${s.grade}-${s.class_number}` !== classFilter)
            return false;
        }
        if (q) {
          const s = r.students;
          const hay = (
            (s?.profiles?.name ?? "") +
            " " +
            (s?.student_code ?? "") +
            " " +
            (s?.student_login_id ?? "") +
            " " +
            r.body
          ).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const sa = a.students;
        const sb = b.students;
        if (!sa || !sb) return 0;
        if (sa.grade !== sb.grade) return sa.grade - sb.grade;
        if (sa.class_number !== sb.class_number)
          return sa.class_number - sb.class_number;
        return sa.student_number - sb.student_number;
      });
  }, [rows, search, classFilter]);

  // 학반 단위 그룹화
  const grouped = useMemo(() => {
    type Group = { key: string; label: string; items: DraftRow[] };
    const map = new Map<string, Group>();
    filtered.forEach((r) => {
      const s = r.students;
      if (!s) return;
      const key = `${s.grade}-${s.class_number}`;
      const label = `${s.grade}학년 ${s.class_number}반`;
      let g = map.get(key);
      if (!g) {
        g = { key, label, items: [] };
        map.set(key, g);
      }
      g.items.push(r);
    });
    return Array.from(map.values()).sort((a, b) => {
      const [ga, ca] = a.key.split("-").map(Number);
      const [gb, cb] = b.key.split("-").map(Number);
      if (ga !== gb) return ga - gb;
      return ca - cb;
    });
  }, [filtered]);

  async function copyBody(row: DraftRow) {
    try {
      await navigator.clipboard.writeText(row.body);
      setCopiedId(row.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // 클립보드 안 됨 시 무시
    }
  }

  async function deleteDraft(id: string) {
    if (!confirm("이 초안을 삭제하시겠습니까?")) return;
    const { error } = await supabase
      .from("sebteuk_drafts")
      .delete()
      .eq("id", id);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    load();
  }

  function startEdit(row: DraftRow) {
    setEditingId(row.id);
    setEditDraft(row.body);
    setEditSavedId(null);
    setExpandedId(row.id); // 편집 시 자동 펼침
  }
  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }
  async function saveEdit(row: DraftRow) {
    setSavingId(row.id);
    setErrorMessage("");
    const { error } = await supabase
      .from("sebteuk_drafts")
      .update({ body: editDraft.trim() })
      .eq("id", row.id);
    if (error) {
      setErrorMessage(error.message);
      setSavingId(null);
      return;
    }
    // 메모리 갱신
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, body: editDraft.trim() } : r
      )
    );
    setEditingId(null);
    setEditDraft("");
    setSavingId(null);
    setEditSavedId(row.id);
    setTimeout(() => setEditSavedId(null), 1500);
  }

  // 엑셀 다운로드 (학번·이름·세특내용)
  function downloadXlsx(items: DraftRow[], filename: string) {
    const sheetData = items.map((r) => {
      const s = r.students;
      return {
        학번: s?.student_code ?? "",
        이름: s?.profiles?.name ?? "",
        세특내용: r.body,
      };
    });
    const ws = XLSX.utils.json_to_sheet(sheetData, {
      header: ["학번", "이름", "세특내용"],
    });
    // 컬럼 폭 (가독성)
    ws["!cols"] = [
      { wch: 12 }, // 학번
      { wch: 10 }, // 이름
      { wch: 80 }, // 세특내용
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "세특");
    XLSX.writeFile(wb, filename);
  }

  function downloadGroup(group: { key: string; label: string; items: DraftRow[] }) {
    const safeLabel = group.label.replace(/[\\/:*?"<>|]/g, "_");
    downloadXlsx(group.items, `세특_${safeLabel}_${schoolYear}.xlsx`);
  }
  function downloadAll() {
    if (filtered.length === 0) return;
    const tag =
      classFilter === "all"
        ? "전체학급"
        : classFilter.replace("-", "학년_") + "반";
    downloadXlsx(filtered, `세특_${tag}_${schoolYear}.xlsx`);
  }

  // 학반 전체 복사 (NEIS 일괄 입력용)
  async function copyClassAll(group: { key: string; label: string; items: DraftRow[] }) {
    const text = group.items
      .map((r) => {
        const s = r.students;
        const name = s?.profiles?.name ?? "";
        const num = s?.student_number ?? "";
        return `[${num}번 ${name}]\n${r.body}\n`;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(`group:${group.key}`);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      {/* 컨트롤 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold">
            전체 ({rows.length}건 · 표시 {filtered.length}건)
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadAll}
              disabled={filtered.length === 0}
              className={`rounded-full bg-emerald-300 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-200 disabled:opacity-60`}
              title="현재 필터 조건의 모든 학반 세특을 한 엑셀로 다운로드"
            >
              📥 엑셀 다운로드 ({filtered.length})
            </button>
            <Link
              href="/teacher/sebteuk"
              className={buttonClasses("secondary", { size: "sm" })}
            >
              ← 새 세특 작성
            </Link>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-60"
            >
              {loading ? "..." : "새로고침"}
            </button>
          </div>
        </div>

        {errorMessage ? (
          <Alert tone="error" className="mt-3">
            {errorMessage}
          </Alert>
        ) : null}

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름·학번·본문 검색"
            aria-label="검색"
            className="rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
          />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            aria-label="학반 필터"
            className="rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
          >
            <option value="all">전체 학반</option>
            {classOptions.map((k) => {
              const [g, c] = k.split("-");
              return (
                <option key={k} value={k}>
                  {g}학년 {c}반
                </option>
              );
            })}
          </select>
        </div>
      </section>

      {/* 그룹별 목록 */}
      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950 p-8 text-center text-slate-400">
          {rows.length === 0
            ? "아직 저장된 세특이 없습니다. '새 세특 작성'에서 만들어보세요."
            : "조건에 맞는 초안이 없습니다."}
        </div>
      ) : (
        grouped.map((g) => (
          <section
            key={g.key}
            className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-bold">
                {g.label}{" "}
                <span className="ml-1 text-xs font-semibold text-slate-400">
                  ({g.items.length}건)
                </span>
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadGroup(g)}
                  className="rounded-full bg-emerald-300/15 px-3 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-300/25 border border-emerald-300/30"
                >
                  📥 엑셀
                </button>
                <button
                  type="button"
                  onClick={() => copyClassAll(g)}
                  className={`rounded-full border ${
                    copiedId === `group:${g.key}`
                      ? "border-emerald-300/40 text-emerald-200"
                      : "border-white/15 text-slate-300"
                  } px-3 py-1 text-[11px] font-semibold hover:bg-white/10`}
                >
                  {copiedId === `group:${g.key}`
                    ? "✓ 복사됨"
                    : "📋 학반 전체 복사"}
                </button>
              </div>
            </div>

            <ul className="mt-3 space-y-2">
              {g.items.map((r) => {
                const s = r.students;
                const isOpen = expandedId === r.id;
                const bytes = new Blob([r.body]).size;
                return (
                  <li
                    key={r.id}
                    className="rounded-lg border border-white/5 bg-slate-950/60 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">
                        {s?.student_number ?? "?"}번 {s?.profiles?.name ?? ""}
                        <span className="ml-2 text-[11px] font-normal text-slate-400">
                          학번 {s?.student_code ?? ""}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{bytes}바이트</span>
                        <span className={accentText}>
                          {r.ai_model ?? "직접"}
                        </span>
                        <span>{formatDateTime(r.updated_at)}</span>
                      </div>
                    </div>

                    {editingId === r.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          rows={8}
                          aria-label="세특 본문 편집"
                          placeholder="세특 본문을 직접 편집하세요"
                          className="w-full rounded border border-cyan-300/40 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
                        />
                        <div className="text-[11px] text-slate-400">
                          현재 바이트:{" "}
                          {new Blob([editDraft]).size}
                        </div>
                      </div>
                    ) : isOpen ? (
                      <p className="mt-2 whitespace-pre-wrap rounded border border-white/10 bg-slate-950 p-3 text-sm text-slate-100">
                        {r.body}
                      </p>
                    ) : (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-300">
                        {r.body}
                      </p>
                    )}

                    {editSavedId === r.id ? (
                      <p className="mt-2 text-[11px] text-emerald-300">
                        ✓ 저장되었습니다.
                      </p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap items-center justify-end gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => copyBody(r)}
                        className={`rounded-full border ${
                          copiedId === r.id
                            ? "border-emerald-300/40 text-emerald-200"
                            : "border-white/15 text-slate-300"
                        } px-2 py-0.5 hover:bg-white/10`}
                      >
                        {copiedId === r.id ? "✓ 복사됨" : "📋 복사"}
                      </button>

                      {editingId === r.id ? (
                        <>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={savingId === r.id}
                            className="rounded-full border border-white/15 px-2 py-0.5 text-slate-300 hover:bg-white/10 disabled:opacity-60"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(r)}
                            disabled={
                              savingId === r.id || !editDraft.trim()
                            }
                            className="rounded-full bg-cyan-300 px-3 py-0.5 font-bold text-slate-950 hover:bg-cyan-200 disabled:opacity-60"
                          >
                            {savingId === r.id ? "저장중..." : "저장"}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(r)}
                            className="rounded-full border border-white/15 px-2 py-0.5 text-slate-300 hover:bg-white/10"
                          >
                            ✏️ 편집
                          </button>
                          <Link
                            href={`/teacher/sebteuk?student=${r.student_id}`}
                            className="rounded-full border border-white/15 px-2 py-0.5 text-slate-400 hover:bg-white/10"
                            title="AI 작성 페이지에서 학생 컨텍스트와 함께 편집"
                          >
                            AI 작성으로
                          </Link>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteDraft(r.id)}
                        className="rounded-full border border-red-300/40 px-2 py-0.5 font-semibold text-red-200 hover:bg-red-300/10"
                      >
                        삭제
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId((cur) =>
                            cur === r.id ? null : r.id
                          )
                        }
                        className={`rounded-full px-2 py-0.5 ${accentText} hover:opacity-80`}
                      >
                        {isOpen ? "접기" : "펼치기"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
