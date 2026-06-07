"use client";

// /admin/students — 관리자가 학생 한 명 선택 후 그 학생의
// 옛 성찰(legacy_reflections) + 새 성찰(activity_responses) 한꺼번에 본다.
// admin RLS(ALL) 라 client 직접 조회.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { LegacyReflectionsSection } from "@/components/student/LegacyReflectionsSection";
import { ActivityResponsesPanel } from "@/components/student/ActivityResponsesPanel";

type StudentRow = {
  id: string;
  school_year: number;
  grade: number;
  class_number: number;
  student_number: number;
  student_code: string;
  student_login_id: string;
  profile_id: string;
  profiles: { name: string | null } | null;
};

export default function AdminStudentsPage() {
  const theme = getRoleTheme("admin");
  const [students, setStudents] = useState<StudentRow[]>([]);
  // student_id → 성찰 카운트 (옛 / 새 각각)
  const [legacyCounts, setLegacyCounts] = useState<Map<string, number>>(new Map());
  const [recentCounts, setRecentCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 필터
  const [grade, setGrade] = useState<string>("");
  const [classNum, setClassNum] = useState<string>("");
  const [keyword, setKeyword] = useState("");

  // 선택된 학생
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    // 학생 + 옛/새 성찰 student_id 목록을 병렬 fetch — 클라이언트에서 group by 카운트.
    const [sRes, lRes, rRes] = await Promise.all([
      supabase
        .from("students")
        .select(
          // FK 컬럼 명시(!profile_id) — students↔profiles 관계가 여러 개라 hint 필요.
          "id, school_year, grade, class_number, student_number, student_code, student_login_id, profile_id, profiles!profile_id(name)"
        )
        .order("school_year", { ascending: false })
        .order("grade")
        .order("class_number")
        .order("student_number"),
      supabase.from("legacy_reflections").select("student_id"),
      supabase.from("activity_responses").select("student_id"),
    ]);
    if (sRes.error) setError(sRes.error.message);
    if (lRes.error) setError((e) => e || lRes.error!.message);
    if (rRes.error) setError((e) => e || rRes.error!.message);
    setStudents((sRes.data ?? []) as unknown as StudentRow[]);

    const lMap = new Map<string, number>();
    for (const r of (lRes.data ?? []) as { student_id: string }[]) {
      lMap.set(r.student_id, (lMap.get(r.student_id) ?? 0) + 1);
    }
    setLegacyCounts(lMap);

    const rMap = new Map<string, number>();
    for (const r of (rRes.data ?? []) as { student_id: string }[]) {
      rMap.set(r.student_id, (rMap.get(r.student_id) ?? 0) + 1);
    }
    setRecentCounts(rMap);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 학년·반 옵션
  const grades = useMemo(
    () => Array.from(new Set(students.map((s) => s.grade))).sort(),
    [students]
  );
  const classNumbers = useMemo(() => {
    const set = new Set(
      students.filter((s) => !grade || String(s.grade) === grade).map((s) => s.class_number)
    );
    return Array.from(set).sort((a, b) => a - b);
  }, [students, grade]);

  // 필터 적용
  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return students.filter((s) => {
      if (grade && String(s.grade) !== grade) return false;
      if (classNum && String(s.class_number) !== classNum) return false;
      if (k) {
        const name = (s.profiles?.name ?? "").toLowerCase();
        const login = s.student_login_id.toLowerCase();
        const code = s.student_code.toLowerCase();
        if (!name.includes(k) && !login.includes(k) && !code.includes(k))
          return false;
      }
      return true;
    });
  }, [students, grade, classNum, keyword]);

  const selected = useMemo(
    () => students.find((s) => s.id === selectedId) ?? null,
    [students, selectedId]
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${theme.accentText}`}>학생</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">학생 활동 기록</h1>
          <p className="mt-1 text-sm text-slate-400">
            학생을 선택해 옛 앱(Streamlit) 이식 성찰과 새 앱 성찰을 한 화면에서
            봅니다.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-60"
        >
          {loading ? "..." : "새로고침"}
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {/* 필터 */}
      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor="f-grade" className="block text-xs font-semibold text-slate-300">
              학년
            </label>
            <select
              id="f-grade"
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                setClassNum("");
              }}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            >
              <option value="">전체</option>
              {grades.map((g) => (
                <option key={g} value={String(g)}>
                  {g}학년
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-class" className="block text-xs font-semibold text-slate-300">
              반
            </label>
            <select
              id="f-class"
              value={classNum}
              onChange={(e) => setClassNum(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            >
              <option value="">전체</option>
              {classNumbers.map((c) => (
                <option key={c} value={String(c)}>
                  {c}반
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="f-keyword" className="block text-xs font-semibold text-slate-300">
              검색 (이름·학번)
            </label>
            <input
              id="f-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="예: 홍길동 / 20602 / 202610000"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {filtered.length}명 표시 (전체 {students.length}명)
        </p>
      </Card>

      {/* 학생 목록 */}
      <Card className="mb-6 max-h-72 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <p className="p-3 text-sm text-slate-400">매칭된 학생이 없습니다.</p>
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const active = s.id === selectedId;
              const legacy = legacyCounts.get(s.id) ?? 0;
              const recent = recentCounts.get(s.id) ?? 0;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={
                      active
                        ? "block w-full rounded-lg border border-cyan-300/50 bg-cyan-300/15 px-3 py-2 text-left text-sm text-cyan-100"
                        : "block w-full rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-slate-950"
                    }
                    title={`옛 성찰 ${legacy}건 · 새 성찰 ${recent}건 (합계 ${legacy + recent})`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold">
                          {s.profiles?.name ?? "(이름 없음)"}
                        </span>
                        <span className="ml-2 text-[11px] text-slate-400">
                          {s.school_year}·{s.grade}-{s.class_number}-
                          {s.student_number} · {s.student_login_id}
                        </span>
                      </div>
                      <div className="shrink-0 text-[11px] font-semibold">
                        {legacy > 0 ? (
                          <span className="text-amber-300">📜{legacy}</span>
                        ) : null}
                        {legacy > 0 && recent > 0 ? (
                          <span className="mx-1 text-slate-500">·</span>
                        ) : null}
                        {recent > 0 ? (
                          <span className="text-cyan-300">🆕{recent}</span>
                        ) : null}
                        {legacy === 0 && recent === 0 ? (
                          <span className="text-slate-600">0</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* 선택된 학생 상세 */}
      {selected ? (
        <section>
          <Card className="mb-4 p-4">
            <h2 className="text-lg font-bold text-white">
              {selected.profiles?.name ?? "(이름 없음)"}{" "}
              <span className="ml-2 text-xs font-normal text-slate-400">
                {selected.school_year}학년도 · {selected.grade}학년{" "}
                {selected.class_number}반 {selected.student_number}번 · ID{" "}
                {selected.student_login_id}
              </span>
            </h2>
          </Card>
          <ActivityResponsesPanel
            studentId={selected.id}
            accentText={theme.accentText}
          />
          <LegacyReflectionsSection
            studentId={selected.id}
            accentText={theme.accentText}
          />
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-slate-400">
          위에서 학생을 선택해 주세요.
        </p>
      )}
    </>
  );
}
