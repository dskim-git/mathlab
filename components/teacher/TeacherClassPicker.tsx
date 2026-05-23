"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const TEACHER_STORAGE_KEY = "mathlab_teacher";

type StoredTeacher = {
  teacherId: string;
  profileId: string;
  loginId: string;
  name: string;
};

type PermissionRow = {
  subject: string | null;
  grade: number;
  class_number: number;
};

type ClassOption = {
  grade: number;
  classNumber: number;
  subjects: string[];
};

export default function TeacherClassPicker({
  selectedGrade,
  selectedClassNumber,
}: {
  selectedGrade: number | null;
  selectedClassNumber: number | null;
}) {
  const [teacher, setTeacher] = useState<StoredTeacher | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(TEACHER_STORAGE_KEY);

    if (raw) {
      try {
        setTeacher(JSON.parse(raw) as StoredTeacher);
      } catch {
        localStorage.removeItem(TEACHER_STORAGE_KEY);
      }
    }

    setIsReady(true);
  }, []);

  const teacherId = teacher?.teacherId;

  useEffect(() => {
    if (!teacherId) {
      setPermissions([]);
      return;
    }

    let active = true;
    setIsLoading(true);
    setLoadError("");

    supabase
      .from("teacher_permissions")
      .select("subject, grade, class_number")
      .eq("teacher_id", teacherId)
      .order("grade", { ascending: true })
      .order("class_number", { ascending: true })
      .then(({ data, error }) => {
        if (!active) {
          return;
        }

        if (error) {
          setLoadError(error.message);
          setPermissions([]);
        } else {
          setPermissions((data ?? []) as PermissionRow[]);
        }

        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [teacherId]);

  const classOptions = useMemo<ClassOption[]>(() => {
    const map = new Map<string, ClassOption>();

    permissions.forEach((perm) => {
      const key = `${perm.grade}-${perm.class_number}`;
      const existing = map.get(key);

      if (existing) {
        if (perm.subject && !existing.subjects.includes(perm.subject)) {
          existing.subjects.push(perm.subject);
        }
      } else {
        map.set(key, {
          grade: perm.grade,
          classNumber: perm.class_number,
          subjects: perm.subject ? [perm.subject] : [],
        });
      }
    });

    return Array.from(map.values());
  }, [permissions]);

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
      <h2 className="text-xl font-bold">담당 학급</h2>

      {!isReady ? (
        <p className="mt-4 text-sm text-slate-400">불러오는 중...</p>
      ) : !teacher ? (
        <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-950/30 p-5 text-sm text-yellow-100">
          <p className="font-semibold">교사 로그인이 필요합니다.</p>
          <p className="mt-2">
            담당 학급의 활동 기록을 보려면 먼저 교사 로그인을 해 주세요.
          </p>
          <Link
            href="/teacher/login"
            className="mt-4 inline-flex rounded-full bg-cyan-300 px-5 py-2 font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            교사 로그인하러 가기
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-400">
            {teacher.name} 선생님의 담당 학급입니다. 학급을 선택하면 아래에 활동
            기록이 표시됩니다.
          </p>

          {loadError ? (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
              담당 학급 정보를 불러오지 못했습니다: {loadError}
            </div>
          ) : isLoading ? (
            <p className="mt-4 text-sm text-slate-400">담당 학급을 불러오는 중...</p>
          ) : classOptions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/20 bg-slate-950 p-5 text-sm text-slate-300">
              지정된 담당 학급(권한)이 없습니다. 관리자에게 권한 설정을 요청해
              주세요.
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              {classOptions.map((option) => {
                const isSelected =
                  selectedGrade === option.grade &&
                  selectedClassNumber === option.classNumber;

                return (
                  <Link
                    key={`${option.grade}-${option.classNumber}`}
                    href={`/teacher/records?grade=${option.grade}&classNumber=${option.classNumber}`}
                    scroll={false}
                    className={
                      isSelected
                        ? "rounded-2xl border border-cyan-300/60 bg-cyan-300 px-5 py-3 text-slate-950"
                        : "rounded-2xl border border-white/10 bg-slate-950 px-5 py-3 text-slate-200 transition hover:bg-white/10"
                    }
                  >
                    <span className="block text-base font-bold">
                      {option.grade}학년 {option.classNumber}반
                    </span>
                    {option.subjects.length > 0 ? (
                      <span
                        className={
                          isSelected
                            ? "mt-1 block text-xs text-slate-700"
                            : "mt-1 block text-xs text-slate-400"
                        }
                      >
                        {option.subjects.join(", ")}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
