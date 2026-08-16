"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import type { DashboardRole } from "@/lib/dashboard/roleTheme";

type ProfileInfo = {
  id: string;
  name: string;
  loginId: string;
  role: string;
  status: string;
  email: string | null;
};

type StudentInfo = {
  schoolYear: number;
  grade: number;
  classNumber: number;
  studentNumber: number;
  studentLoginId: string;
};

type TeacherCourse = {
  id: string;
  name: string;
  subject: string;
  school_year: number;
  semester: number;
};

const ROLE_LABEL: Record<string, string> = {
  admin: "관리자",
  teacher: "교사",
  student: "학생",
  general: "일반",
};

type Props = {
  role: DashboardRole;
  accentText: string;
};

export function MyProfilePanel({ role, accentText }: Props) {
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([]);

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwOk, setPwOk] = useState(false);

  const load = useCallback(async () => {
    setAuthChecked(false);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAuthChecked(true);
      return;
    }
    const { data: pRow } = await supabase
      .from("profiles")
      .select("id, name, login_id, role, status, email")
      .eq("id", user.id)
      .maybeSingle();
    const p = pRow as
      | {
          id: string;
          name: string;
          login_id: string;
          role: string;
          status: string;
          email: string | null;
        }
      | null;
    if (p) {
      setProfile({
        id: p.id,
        name: p.name,
        loginId: p.login_id,
        role: p.role,
        status: p.status,
        email: p.email,
      });
    }

    // 학생 본인 정보
    if (p?.role === "student") {
      const { data: sRow } = await supabase
        .from("students")
        .select(
          "school_year, grade, class_number, student_number, student_login_id"
        )
        .eq("profile_id", user.id)
        .maybeSingle();
      const s = sRow as
        | {
            school_year: number;
            grade: number;
            class_number: number;
            student_number: number;
            student_login_id: string;
          }
        | null;
      if (s) {
        setStudent({
          schoolYear: s.school_year,
          grade: s.grade,
          classNumber: s.class_number,
          studentNumber: s.student_number,
          studentLoginId: s.student_login_id,
        });
      }
    }

    // 교사 담당 수업 — 담당의 정본은 courses 다(RLS 가 본인 수업만 반환).
    if (p?.role === "teacher" || p?.role === "admin") {
      const { data: courseRows } = await supabase
        .from("courses")
        .select("id, name, subject, school_year, semester")
        .order("school_year", { ascending: false })
        .order("semester", { ascending: false })
        .order("name");
      setTeacherCourses((courseRows ?? []) as TeacherCourse[]);
    }

    setAuthChecked(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwOk(false);
    if (newPassword.length < 8) {
      setPwError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPwError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setPwSubmitting(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      setPwError(error.message);
      setPwSubmitting(false);
      return;
    }
    setPwOk(true);
    setNewPassword("");
    setNewPasswordConfirm("");
    setPwSubmitting(false);
  }

  if (!authChecked) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
        확인 중...
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6 text-sm text-amber-200">
        로그인 정보를 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 본인 정보 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <h2 className="text-base font-bold">내 정보</h2>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
            <dt className="text-[11px] uppercase tracking-wider text-slate-400">
              이름
            </dt>
            <dd className="mt-1 font-semibold text-white">{profile.name}</dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
            <dt className="text-[11px] uppercase tracking-wider text-slate-400">
              로그인 ID
            </dt>
            <dd className="mt-1 font-semibold text-white">{profile.loginId}</dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
            <dt className="text-[11px] uppercase tracking-wider text-slate-400">
              역할
            </dt>
            <dd className={`mt-1 font-semibold ${accentText}`}>
              {ROLE_LABEL[profile.role] ?? profile.role}
            </dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
            <dt className="text-[11px] uppercase tracking-wider text-slate-400">
              상태
            </dt>
            <dd className="mt-1 font-semibold text-white">
              {profile.status === "approved"
                ? "승인됨"
                : profile.status === "pending"
                ? "승인 대기"
                : profile.status === "rejected"
                ? "거부됨"
                : profile.status}
            </dd>
          </div>
        </dl>

        {role === "student" && student ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">
              학생 정보
            </p>
            <p className="mt-1 text-sm text-slate-200">
              {student.schoolYear}학년도 · {student.grade}학년{" "}
              {student.classNumber}반 {student.studentNumber}번
              <span className="ml-2 text-slate-400">
                (학번 {student.studentLoginId})
              </span>
            </p>
          </div>
        ) : null}

        {(role === "teacher" || role === "admin") &&
        teacherCourses.length > 0 ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">
              담당 수업
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {teacherCourses.map((c) => (
                <li
                  key={c.id}
                  className={`rounded-full bg-white/5 px-3 py-1 text-xs ${accentText}`}
                >
                  {c.school_year} {c.semester}학기 · {c.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-4 text-xs text-slate-500">
          이름·역할·담당 수업 변경은 관리자에게 건의해 주세요.
        </p>
      </section>

      {/* 비밀번호 변경 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <h2 className="text-base font-bold">비밀번호 변경</h2>
        <p className="mt-1 text-xs text-slate-400">
          8자 이상으로 새 비밀번호를 설정합니다. 변경 즉시 적용됩니다.
        </p>

        <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="new-pw"
              className="text-xs font-semibold text-slate-300"
            >
              새 비밀번호
            </label>
            <input
              id="new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
          </div>
          <div>
            <label
              htmlFor="new-pw-confirm"
              className="text-xs font-semibold text-slate-300"
            >
              새 비밀번호 확인
            </label>
            <input
              id="new-pw-confirm"
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
          </div>

          {pwError ? <Alert tone="error">{pwError}</Alert> : null}
          {pwOk ? (
            <Alert tone="success">비밀번호가 변경되었습니다.</Alert>
          ) : null}

          <div className="flex items-center justify-end">
            <Button
              type="submit"
              disabled={
                pwSubmitting ||
                newPassword.length < 8 ||
                newPassword !== newPasswordConfirm
              }
            >
              {pwSubmitting ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
