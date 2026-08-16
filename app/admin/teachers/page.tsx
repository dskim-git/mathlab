"use client";

// 교사별 담당 현황 — 읽기 전용.
//
// 담당의 정본은 courses(수업 관리) 로 옮겨졌다. 이 화면에서 teacher_permissions 를
// 편집할 수 있게 두면, 여기서 담당 학급을 추가해도 진도표·AI 세특·기록 조회에는
// 나타나지 않아 오히려 함정이 된다. 그래서 편집은 전부 제거하고 현황만 보여준다.
//
// teacher_permissions 행 자체는 남겨둔다 — 기존 RLS 헬퍼(teacher_has_class 등)가
// 아직 참조하며, 수업 기반 정책과 OR 로 합쳐져 권한이 좁아지지 않는다.
// 한 학기 운영해 courses 만으로 문제없음이 확인되면 그때 정리한다.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

type TeacherProfile = {
  id: string;
  name: string;
  login_id: string;
  role: string;
  status: string;
};

type LegacyPermission = {
  id: string;
  subject: string;
  grade: number;
  class_number: number;
};

type TeacherRow = {
  id: string; // teachers.id
  profiles: TeacherProfile;
  teacher_permissions: LegacyPermission[];
};

type CourseRow = {
  id: string;
  school_year: number;
  semester: number;
  subject: string;
  name: string;
};

type CourseTeacherRow = {
  course_id: string;
  profile_id: string;
};

function TeacherCard({
  teacher,
  courses,
  legacy,
}: {
  teacher: TeacherRow;
  courses: CourseRow[];
  legacy: LegacyPermission[];
}) {
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
          담당 수업{" "}
          <span className="font-bold text-cyan-300">{courses.length}</span>개
        </span>
      </div>

      {/* 담당 수업 — 현재의 정본 */}
      {courses.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-slate-950 p-4 text-sm text-slate-400">
          배정된 수업이 없습니다.{" "}
          <Link href="/admin/courses" className="underline hover:text-cyan-200">
            수업 관리
          </Link>
          에서 담당 교사로 추가하세요.
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {courses.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200"
            >
              {c.name}
              <span className="text-[11px] font-normal text-cyan-300/70">
                {c.school_year} {c.semester}학기
              </span>
            </span>
          ))}
        </div>
      )}

      {/* 레거시 담당 학급 — 참고용 */}
      {legacy.length > 0 ? (
        <details className="mt-4 border-t border-white/10 pt-3">
          <summary className="cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-200">
            옛 담당 학급 기록 {legacy.length}건 (참고용)
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {legacy.map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-400"
              >
                {p.subject} · {p.grade}-{p.class_number}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            수업 모델 도입 전의 기록입니다. 2026학년도 1학기 수업으로 이미 변환되어
            있으며, 여기서 고쳐도 화면에는 반영되지 않습니다.
          </p>
        </details>
      ) : null}
    </div>
  );
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [courseTeachers, setCourseTeachers] = useState<CourseTeacherRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const [teacherResult, courseResult, courseTeacherResult] = await Promise.all([
      supabase
        .from("teachers")
        .select(
          "id, profiles!inner(id, name, login_id, role, status), teacher_permissions(id, subject, grade, class_number)"
        )
        .eq("profiles.role", "teacher")
        .eq("profiles.status", "approved"),
      supabase
        .from("courses")
        .select("id, school_year, semester, subject, name")
        .order("school_year", { ascending: false })
        .order("semester", { ascending: false })
        .order("name"),
      supabase.from("course_teachers").select("course_id, profile_id"),
    ]);

    if (teacherResult.error) {
      setErrorMessage(
        `교사 목록을 불러오지 못했습니다: ${teacherResult.error.message}`
      );
      setTeachers([]);
    } else {
      setTeachers((teacherResult.data ?? []) as unknown as TeacherRow[]);
    }
    if (!courseResult.error) {
      setCourses((courseResult.data ?? []) as CourseRow[]);
    }
    if (!courseTeacherResult.error) {
      setCourseTeachers((courseTeacherResult.data ?? []) as CourseTeacherRow[]);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // profile_id → 담당 수업 목록
  const coursesByProfile = useMemo(() => {
    const byId = new Map(courses.map((c) => [c.id, c]));
    const map = new Map<string, CourseRow[]>();
    courseTeachers.forEach((ct) => {
      const c = byId.get(ct.course_id);
      if (!c) return;
      const arr = map.get(ct.profile_id) ?? [];
      arr.push(c);
      map.set(ct.profile_id, arr);
    });
    return map;
  }, [courses, courseTeachers]);

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-5xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan-300">관리자 대시보드</p>

        <h1 className="mt-3 text-3xl font-bold">교사별 담당 현황</h1>

        <p className="mt-4 leading-7 text-slate-300">
          승인된 교사가 어떤 수업을 맡고 있는지 한눈에 봅니다.{" "}
          <span className="font-semibold text-cyan-200">읽기 전용</span>입니다.
        </p>

        <Alert tone="info" className="mt-4">
          담당 배정은{" "}
          <Link href="/admin/courses" className="font-semibold underline">
            수업 관리
          </Link>
          에서 합니다. 수업 하나에 학년도·학기·교과·수강생이 함께 묶여 있어, 이
          화면의 옛 &ldquo;담당 학급&rdquo;을 고쳐도 진도표·AI 세특·기록 조회에는
          반영되지 않습니다.
        </Alert>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadData}>
            새로고침
          </Button>
          <Link href="/admin/courses" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            수업 관리로 이동 →
          </Link>
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
                courses={coursesByProfile.get(teacher.profiles.id) ?? []}
                legacy={teacher.teacher_permissions ?? []}
              />
            ))
          )}
        </section>
      </Card>
    </main>
  );
}
