"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Subject = {
  id: string;
  name: string;
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

  const [subjectError, setSubjectError] = useState("");
  const [classError, setClassError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const loadAll = useCallback(async () => {
    setIsLoading(true);

    const [subjectResult, classResult] = await Promise.all([
      supabase.from("subjects").select("id, name").order("name"),
      supabase
        .from("school_classes")
        .select("id, grade, class_number")
        .order("grade")
        .order("class_number"),
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

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-cyan-300">관리자 대시보드</p>

        <h1 className="mt-3 text-3xl font-bold">과목·학급 관리</h1>

        <p className="mt-4 leading-7 text-slate-300">
          여기서 등록한 과목과 학급이 교사 담당 학급(권한) 부여 화면의 드롭다운
          선택지가 됩니다.
        </p>

        {isLoading ? (
          <p className="mt-6 text-slate-300">불러오는 중...</p>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* 과목 관리 */}
            <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">과목</h2>

              <form onSubmit={handleAddSubject} className="mt-4 flex gap-2">
                <input
                  value={newSubject}
                  onChange={(event) => {
                    setNewSubject(event.target.value);
                    setSubjectError("");
                  }}
                  className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
                  placeholder="예: 확률과통계"
                />
                <button
                  type="submit"
                  disabled={isBusy}
                  className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  추가
                </button>
              </form>

              {subjectError ? (
                <div className="mt-3 rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200">
                  {subjectError}
                </div>
              ) : null}

              {subjects.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-slate-950 p-4 text-sm text-slate-400">
                  등록된 과목이 없습니다.
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <span
                      key={subject.id}
                      className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200"
                    >
                      {subject.name}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDeleteSubject(subject)}
                        className="rounded-full px-1 text-cyan-200/70 transition hover:text-red-300 disabled:opacity-50"
                        aria-label="과목 삭제"
                        title="삭제"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* 학급 관리 */}
            <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">학급 (학년·반)</h2>

              <form onSubmit={handleAddClass} className="mt-4 flex flex-wrap items-end gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    학년
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newGrade}
                    onChange={(event) => {
                      setNewGrade(event.target.value);
                      setClassError("");
                    }}
                    className="mt-1 w-20 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    반
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newClass}
                    onChange={(event) => {
                      setNewClass(event.target.value);
                      setClassError("");
                    }}
                    className="mt-1 w-20 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
                    placeholder="6"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  추가
                </button>
              </form>

              {classError ? (
                <div className="mt-3 rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200">
                  {classError}
                </div>
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
      </section>
    </main>
  );
}
