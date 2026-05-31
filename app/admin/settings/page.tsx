"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

type Subject = {
  id: string;
  name: string;
  order_index: number | null;
};

type SchoolClass = {
  id: string;
  grade: number;
  class_number: number;
};

export default function AdminSettingsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newSubject, setNewSubject] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newClass, setNewClass] = useState("");

  // 과목 인라인 이름 편집 (한 번에 한 행만)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");

  const [subjectError, setSubjectError] = useState("");
  const [classError, setClassError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const [currentYear, setCurrentYear] = useState("");
  const [yearMessage, setYearMessage] = useState("");
  const [yearError, setYearError] = useState("");

  const loadAll = useCallback(async () => {
    setIsLoading(true);

    const [subjectResult, classResult, yearResult] = await Promise.all([
      supabase
        .from("subjects")
        .select("id, name, order_index")
        .order("order_index", { nullsFirst: false })
        .order("name"),
      supabase
        .from("school_classes")
        .select("id, grade, class_number")
        .order("grade")
        .order("class_number"),
      supabase
        .from("app_settings")
        .select("value")
        .eq("key", "current_school_year")
        .maybeSingle(),
    ]);

    if (subjectResult.error) {
      setSubjectError(`과목 목록 오류: ${subjectResult.error.message}`);
    } else {
      setSubjects((subjectResult.data ?? []) as Subject[]);
    }

    if (classResult.error) {
      setClassError(`학급 목록 오류: ${classResult.error.message}`);
    } else {
      setClasses((classResult.data ?? []) as SchoolClass[]);
    }

    if (!yearResult.error && yearResult.data) {
      setCurrentYear((yearResult.data as { value: string }).value);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleSaveYear(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setYearMessage("");
    setYearError("");

    const year = Number(currentYear);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setYearError("학년도를 올바르게 입력해 주세요. (예: 2026)");
      return;
    }

    setIsBusy(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ value: String(year), updated_at: new Date().toISOString() })
      .eq("key", "current_school_year");
    setIsBusy(false);

    if (error) {
      setYearError(`저장 중 오류: ${error.message}`);
      return;
    }

    setYearMessage(`현재 학년도를 ${year}로 저장했습니다.`);
  }

  async function handleAddSubject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubjectError("");

    const name = newSubject.trim();
    if (!name) {
      setSubjectError("과목명을 입력해 주세요.");
      return;
    }

    setIsBusy(true);
    const { error } = await supabase.from("subjects").insert({ name });
    setIsBusy(false);

    if (error) {
      setSubjectError(
        error.code === "23505"
          ? "이미 등록된 과목입니다."
          : `추가 중 오류: ${error.message}`
      );
      return;
    }

    setNewSubject("");
    loadAll();
  }

  async function handleDeleteSubject(subject: Subject) {
    setSubjectError("");
    setIsBusy(true);
    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", subject.id);
    setIsBusy(false);

    if (error) {
      setSubjectError(`삭제 중 오류: ${error.message}`);
      return;
    }
    loadAll();
  }

  // 과목명 변경 — subject FK 가 ON UPDATE CASCADE 라 activities/responses/permissions 등이
  // 자동으로 새 이름으로 따라간다.
  async function handleRenameSubject(subject: Subject, newName: string) {
    const t = newName.trim();
    if (!t) {
      setSubjectError("과목명은 비울 수 없습니다.");
      return;
    }
    if (t === subject.name) return;
    setSubjectError("");
    setIsBusy(true);
    const { error } = await supabase
      .from("subjects")
      .update({ name: t })
      .eq("id", subject.id);
    setIsBusy(false);
    if (error) {
      setSubjectError(
        error.code === "23505"
          ? "이미 같은 이름의 과목이 있습니다."
          : `이름 변경 중 오류: ${error.message}`
      );
      return;
    }
    loadAll();
  }

  // 순서 변경 — 인접한 이웃과 order_index 를 교환. NULL 은 0 으로 간주.
  async function handleMoveSubject(subject: Subject, direction: -1 | 1) {
    setSubjectError("");
    const sorted = [...subjects].sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    );
    const idx = sorted.findIndex((s) => s.id === subject.id);
    const targetIdx = idx + direction;
    if (idx < 0 || targetIdx < 0 || targetIdx >= sorted.length) return;
    const me = sorted[idx];
    const other = sorted[targetIdx];
    const myOrder = me.order_index ?? 0;
    const otherOrder = other.order_index ?? 0;
    setIsBusy(true);
    const [r1, r2] = await Promise.all([
      supabase.from("subjects").update({ order_index: otherOrder }).eq("id", me.id),
      supabase.from("subjects").update({ order_index: myOrder }).eq("id", other.id),
    ]);
    setIsBusy(false);
    if (r1.error || r2.error) {
      setSubjectError(
        `순서 변경 중 오류: ${r1.error?.message ?? r2.error?.message ?? "?"}`
      );
      return;
    }
    loadAll();
  }

  async function handleAddClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClassError("");

    const gradeValue = Number(newGrade);
    const classValue = Number(newClass);

    if (!Number.isInteger(gradeValue) || gradeValue <= 0) {
      setClassError("학년은 1 이상의 정수로 입력해 주세요.");
      return;
    }
    if (!Number.isInteger(classValue) || classValue <= 0) {
      setClassError("반은 1 이상의 정수로 입력해 주세요.");
      return;
    }

    setIsBusy(true);
    const { error } = await supabase
      .from("school_classes")
      .insert({ grade: gradeValue, class_number: classValue });
    setIsBusy(false);

    if (error) {
      setClassError(
        error.code === "23505"
          ? "이미 등록된 학급입니다."
          : `추가 중 오류: ${error.message}`
      );
      return;
    }

    setNewGrade("");
    setNewClass("");
    loadAll();
  }

  async function handleDeleteClass(schoolClass: SchoolClass) {
    setClassError("");
    setIsBusy(true);
    const { error } = await supabase
      .from("school_classes")
      .delete()
      .eq("id", schoolClass.id);
    setIsBusy(false);

    if (error) {
      setClassError(`삭제 중 오류: ${error.message}`);
      return;
    }
    loadAll();
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-5xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan-300">관리자 대시보드</p>

        <h1 className="mt-3 text-3xl font-bold">과목·학급 관리</h1>

        <p className="mt-4 leading-7 text-slate-300">
          여기서 등록한 과목과 학급이 교사 담당 학급(권한) 부여 화면의 드롭다운
          선택지가 됩니다.
        </p>

        <section className="mt-6 rounded-2xl border border-cyan-300/30 bg-cyan-950/20 p-6">
          <h2 className="text-xl font-bold">현재 학년도</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            학생 회원가입 시 학번 앞에 붙는 연도이자, 명렬표 업로드의 기본
            학년도입니다. 예: 2026 → 학번 20602는 로그인 ID{" "}
            <span className="font-semibold text-cyan-200">202620602</span>가 됩니다.
          </p>

          <form onSubmit={handleSaveYear} className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="settings-school-year"
                className="block text-xs font-semibold text-slate-300"
              >
                학년도
              </label>
              <input
                id="settings-school-year"
                type="number"
                value={currentYear}
                onChange={(event) => {
                  setCurrentYear(event.target.value);
                  setYearMessage("");
                  setYearError("");
                }}
                className="mt-1 w-32 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
                placeholder="2026"
              />
            </div>
            <Button type="submit" size="sm" disabled={isBusy}>
              저장
            </Button>
          </form>

          {yearMessage ? (
            <Alert tone="success" className="mt-3">
              {yearMessage}
            </Alert>
          ) : null}
          {yearError ? (
            <Alert tone="error" className="mt-3">
              {yearError}
            </Alert>
          ) : null}
        </section>

        {isLoading ? (
          <p className="mt-6 text-slate-300">불러오는 중...</p>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* 과목 관리 */}
            <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">과목</h2>

              <form onSubmit={handleAddSubject} className="mt-4 flex gap-2">
                <input
                  aria-label="과목명"
                  value={newSubject}
                  onChange={(event) => {
                    setNewSubject(event.target.value);
                    setSubjectError("");
                  }}
                  className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
                  placeholder="예: 확률과통계"
                />
                <Button type="submit" size="sm" disabled={isBusy}>
                  추가
                </Button>
              </form>

              {subjectError ? (
                <Alert tone="error" className="mt-3">
                  {subjectError}
                </Alert>
              ) : null}

              {subjects.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-slate-950 p-4 text-sm text-slate-400">
                  등록된 과목이 없습니다.
                </div>
              ) : (
                <ul className="mt-4 space-y-2">
                  {subjects.map((subject, idx) => {
                    const isEditing = editingSubjectId === subject.id;
                    return (
                      <li
                        key={subject.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-950 px-3 py-2"
                      >
                        <div className="flex flex-1 items-center gap-2">
                          <span className="w-6 text-xs font-semibold text-slate-500">
                            {idx + 1}.
                          </span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingSubjectName}
                              onChange={(e) =>
                                setEditingSubjectName(e.target.value)
                              }
                              aria-label="과목명"
                              className="flex-1 rounded border border-cyan-300/40 bg-slate-900 px-2 py-1 text-sm font-semibold text-cyan-200 outline-none focus:ring-2 focus:ring-cyan-300/40"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-cyan-200">
                              {subject.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  setEditingSubjectId(null);
                                  setEditingSubjectName("");
                                }}
                                className="rounded px-2 py-1 text-[11px] text-slate-400 hover:text-white disabled:opacity-60"
                              >
                                취소
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={async () => {
                                  await handleRenameSubject(
                                    subject,
                                    editingSubjectName
                                  );
                                  setEditingSubjectId(null);
                                  setEditingSubjectName("");
                                }}
                                className="rounded-full bg-cyan-300 px-2 py-1 text-[11px] font-bold text-slate-950 hover:bg-cyan-200 disabled:opacity-60"
                              >
                                저장
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={isBusy || idx === 0}
                                onClick={() => handleMoveSubject(subject, -1)}
                                aria-label="위로 이동"
                                className="rounded border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                disabled={isBusy || idx === subjects.length - 1}
                                onClick={() => handleMoveSubject(subject, 1)}
                                aria-label="아래로 이동"
                                className="rounded border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  setEditingSubjectId(subject.id);
                                  setEditingSubjectName(subject.name);
                                  setSubjectError("");
                                }}
                                className="rounded border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition hover:bg-white/10 disabled:opacity-60"
                              >
                                ✏️ 이름
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleDeleteSubject(subject)}
                                aria-label="과목 삭제"
                                title="삭제"
                                className="rounded border border-rose-300/30 px-2 py-1 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-300/10 disabled:opacity-60"
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* 학급 관리 */}
            <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">학급 (학년·반)</h2>

              <form onSubmit={handleAddClass} className="mt-4 flex flex-wrap items-end gap-2">
                <div>
                  <label
                    htmlFor="settings-new-grade"
                    className="block text-xs font-semibold text-slate-300"
                  >
                    학년
                  </label>
                  <input
                    id="settings-new-grade"
                    type="number"
                    min={1}
                    value={newGrade}
                    onChange={(event) => {
                      setNewGrade(event.target.value);
                      setClassError("");
                    }}
                    className="mt-1 w-20 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="settings-new-class"
                    className="block text-xs font-semibold text-slate-300"
                  >
                    반
                  </label>
                  <input
                    id="settings-new-class"
                    type="number"
                    min={1}
                    value={newClass}
                    onChange={(event) => {
                      setNewClass(event.target.value);
                      setClassError("");
                    }}
                    className="mt-1 w-20 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
                    placeholder="6"
                  />
                </div>
                <Button type="submit" size="sm" disabled={isBusy}>
                  추가
                </Button>
              </form>

              {classError ? (
                <Alert tone="error" className="mt-3">
                  {classError}
                </Alert>
              ) : null}

              {classes.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-slate-950 p-4 text-sm text-slate-400">
                  등록된 학급이 없습니다.
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {classes.map((schoolClass) => (
                    <span
                      key={schoolClass.id}
                      className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200"
                    >
                      {schoolClass.grade}학년 {schoolClass.class_number}반
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDeleteClass(schoolClass)}
                        className="rounded-full px-1 text-cyan-200/70 transition hover:text-red-300 disabled:opacity-50"
                        aria-label="학급 삭제"
                        title="삭제"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </Card>
    </main>
  );
}
