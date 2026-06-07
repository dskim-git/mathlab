"use client";

// 학생 검색·필터 + 선택 학생의 옛/새 성찰 패널 — admin / teacher 공용.
// RLS 가 학생 가시 범위를 자동 제한: admin=전체 / teacher=담당 학급만.
// accentText 만 prop 으로 받아 role 별 테마 색 적용.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
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
  profiles: {
    name: string | null;
    email: string | null;
    status: string | null;
    must_change_password: boolean | null;
    created_at: string | null;
  } | null;
};

export function StudentsExplorer({ accentText }: { accentText: string }) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [legacyCounts, setLegacyCounts] = useState<Map<string, number>>(
    new Map()
  );
  const [recentCounts, setRecentCounts] = useState<Map<string, number>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [grade, setGrade] = useState<string>("");
  const [classNum, setClassNum] = useState<string>("");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [sRes, lRes, rRes] = await Promise.all([
      supabase
        .from("students")
        .select(
          "id, school_year, grade, class_number, student_number, student_code, student_login_id, profile_id, profiles!profile_id(name, email, status, must_change_password, created_at)"
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

  const grades = useMemo(
    () => Array.from(new Set(students.map((s) => s.grade))).sort(),
    [students]
  );
  const classNumbers = useMemo(() => {
    const set = new Set(
      students
        .filter((s) => !grade || String(s.grade) === grade)
        .map((s) => s.class_number)
    );
    return Array.from(set).sort((a, b) => a - b);
  }, [students, grade]);

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
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
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

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label
              htmlFor="f-grade"
              className="block text-xs font-semibold text-slate-300"
            >
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
            <label
              htmlFor="f-class"
              className="block text-xs font-semibold text-slate-300"
            >
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
            <label
              htmlFor="f-keyword"
              className="block text-xs font-semibold text-slate-300"
            >
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

      {selected ? (
        <section>
          <Card className="mb-4 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {selected.profiles?.name ?? "(이름 없음)"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {selected.school_year}학년도 · {selected.grade}학년{" "}
                  {selected.class_number}반 {selected.student_number}번
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selected.profiles?.must_change_password ? (
                  <span
                    className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200"
                    title="임시 비번 11111111 — 학생이 첫 로그인 시 강제 변경 동선"
                  >
                    ⚠ 임시 비번
                  </span>
                ) : null}
                <span
                  className={
                    selected.profiles?.status === "approved"
                      ? "rounded-full bg-emerald-300/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200"
                      : "rounded-full bg-slate-700/40 px-2 py-0.5 text-[11px] font-semibold text-slate-400"
                  }
                >
                  {selected.profiles?.status ?? "(unknown)"}
                </span>
              </div>
            </div>
            <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-slate-500">로그인 ID</dt>
                <dd className="font-mono text-slate-200">
                  {selected.student_login_id}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-slate-500">학번 코드</dt>
                <dd className="font-mono text-slate-200">
                  {selected.student_code}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-slate-500">이메일(합성)</dt>
                <dd className="break-all text-slate-300">
                  {selected.profiles?.email ?? "-"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-slate-500">가입일</dt>
                <dd className="text-slate-300">
                  {selected.profiles?.created_at
                    ? new Date(selected.profiles.created_at).toLocaleString(
                        "ko-KR",
                        { dateStyle: "short", timeStyle: "short" }
                      )
                    : "-"}
                </dd>
              </div>
            </dl>
          </Card>
          <ActivityResponsesPanel
            studentId={selected.id}
            accentText={accentText}
          />
          <LegacyReflectionsSection
            studentId={selected.id}
            accentText={accentText}
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
