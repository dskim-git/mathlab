"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

type Permission = {
  id: string;
  subject: string;
  grade: number;
  class_number: number;
};

type TeacherProfile = {
  id: string;
  name: string;
  login_id: string;
  role: string;
  status: string;
};

type TeacherRow = {
  id: string; // teacher_id
  profiles: TeacherProfile;
  teacher_permissions: Permission[];
};

type SchoolClass = {
  grade: number;
  class_number: number;
};

function TeacherCard({
  teacher,
  subjects,
  classes,
  onChanged,
}: {
  teacher: TeacherRow;
  subjects: string[];
  classes: SchoolClass[];
  onChanged: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [classNumber, setClassNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  // 등록된 학급에서 학년 목록(중복 제거), 선택한 학년의 반 목록.
  const gradeOptions = useMemo(
    () => Array.from(new Set(classes.map((c) => c.grade))).sort((a, b) => a - b),
    [classes]
  );

  const classOptions = useMemo(
    () =>
      classes
        .filter((c) => c.grade === Number(grade))
        .map((c) => c.class_number)
        .sort((a, b) => a - b),
    [classes, grade]
  );

  const masterEmpty = subjects.length === 0 || classes.length === 0;

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!subject) {
      setErrorMessage("과목을 선택해 주세요.");
      return;
    }
    const gradeValue = Number(grade);
    const classValue = Number(classNumber);
    if (!gradeValue) {
      setErrorMessage("학년을 선택해 주세요.");
      return;
    }
    if (!classValue) {
      setErrorMessage("반을 선택해 주세요.");
      return;
    }

    setIsBusy(true);
    const { error } = await supabase.from("teacher_permissions").insert({
      teacher_id: teacher.id,
      subject,
      grade: gradeValue,
      class_number: classValue,
    });
    setIsBusy(false);

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? "이미 등록된 담당 학급입니다."
          : `추가 중 오류: ${error.message}`
      );
      return;
    }

    setSubject("");
    setGrade("");
    setClassNumber("");
    onChanged();
  }

  async function handleDelete(permission: Permission) {
    setErrorMessage("");
    setIsBusy(true);
    const { error } = await supabase
      .from("teacher_permissions")
      .delete()
      .eq("id", permission.id);
    setIsBusy(false);

    if (error) {
      setErrorMessage(`삭제 중 오류: ${error.message}`);
      return;
    }
    onChanged();
  }

  const selectClassName =
    "mt-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40";

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-white">{teacher.profiles.name}</p>
          <p className="text-sm text-slate-400">
            아이디: {teacher.profiles.login_id}
          </p>
        </div>

        <span className="text-sm text-slate-400">
          담당 학급{" "}
          <span className="font-bold text-cyan-300">
            {teacher.teacher_permissions.length}
          </span>
          개
        </span>
      </div>

      {teacher.teacher_permissions.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-slate-950 p-4 text-sm text-slate-400">
          지정된 담당 학급이 없습니다.
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {teacher.teacher_permissions.map((permission) => (
            <span
              key={permission.id}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200"
            >
              {permission.subject} · {permission.grade}학년 {permission.class_number}반
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleDelete(permission)}
                className="rounded-full px-1 text-cyan-200/70 transition hover:text-red-300 disabled:opacity-50"
                aria-label="담당 학급 삭제"
                title="삭제"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {masterEmpty ? (
        <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-950/30 p-4 text-sm text-yellow-100">
          먼저 상단 <span className="font-semibold">과목·학급</span> 메뉴에서 과목과
          학급을 등록해 주세요.
        </div>
      ) : (
        <form
          onSubmit={handleAdd}
          className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/10 pt-4"
        >
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-300">과목</label>
            <select
              aria-label="과목 선택"
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value);
                setErrorMessage("");
              }}
              className={selectClassName}
            >
              <option value="">선택</option>
              {subjects.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-300">학년</label>
            <select
              aria-label="학년 선택"
              value={grade}
              onChange={(event) => {
                setGrade(event.target.value);
                setClassNumber(""); // 학년 바뀌면 반 초기화
                setErrorMessage("");
              }}
              className={selectClassName}
            >
              <option value="">선택</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g}>
                  {g}학년
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-300">반</label>
            <select
              aria-label="반 선택"
              value={classNumber}
              onChange={(event) => {
                setClassNumber(event.target.value);
                setErrorMessage("");
              }}
              disabled={!grade}
              className={`${selectClassName} disabled:opacity-50`}
            >
              <option value="">{grade ? "선택" : "학년 먼저"}</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}반
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" size="sm" disabled={isBusy}>
            담당 학급 추가
          </Button>
        </form>
      )}

      {errorMessage ? (
        <Alert tone="error" className="mt-3">
          {errorMessage}
        </Alert>
      ) : null}
    </div>
  );
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const [teacherResult, subjectResult, classResult] = await Promise.all([
      supabase
        .from("teachers")
        .select(
          "id, profiles!inner(id, name, login_id, role, status), teacher_permissions(id, subject, grade, class_number)"
        )
        .eq("profiles.role", "teacher")
        .eq("profiles.status", "approved"),
      supabase.from("subjects").select("name").order("name"),
      supabase
        .from("school_classes")
        .select("grade, class_number")
        .order("grade")
        .order("class_number"),
    ]);

    if (teacherResult.error) {
      setErrorMessage(`교사 목록을 불러오지 못했습니다: ${teacherResult.error.message}`);
      setTeachers([]);
    } else {
      setTeachers((teacherResult.data ?? []) as unknown as TeacherRow[]);
    }

    if (!subjectResult.error) {
      setSubjects(
        ((subjectResult.data ?? []) as { name: string }[]).map((s) => s.name)
      );
    }

    if (!classResult.error) {
      setClasses((classResult.data ?? []) as SchoolClass[]);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-5xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan-300">관리자 대시보드</p>

        <h1 className="mt-3 text-3xl font-bold">교사 담당 학급(권한)</h1>

        <p className="mt-4 leading-7 text-slate-300">
          승인된 교사에게 담당 학급(과목·학년·반)을 부여하거나 회수합니다. 선택지는{" "}
          <span className="font-semibold text-cyan-200">과목·학급</span> 메뉴에서
          등록한 목록에서 고릅니다.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadData}>
            새로고침
          </Button>

          <span className="text-sm text-slate-400">
            승인된 교사:{" "}
            <span className="font-bold text-cyan-300">{teachers.length}</span>명
          </span>
        </div>

        {errorMessage ? (
          <Alert tone="error" className="mt-5">
            {errorMessage}
          </Alert>
        ) : null}

        <section className="mt-6 space-y-4">
          {isLoading ? (
            <p className="text-slate-300">불러오는 중...</p>
          ) : teachers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950 p-6 text-slate-300">
              승인된 교사가 없습니다.
            </div>
          ) : (
            teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                subjects={subjects}
                classes={classes}
                onChanged={loadData}
              />
            ))
          )}
        </section>
      </Card>
    </main>
  );
}
