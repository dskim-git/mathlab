"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { loginIdToEmail } from "@/lib/auth/credentials";

const STUDENT_STORAGE_KEY = "mathlab_student";

type StudentWithProfile = {
  id: string;
  profile_id: string;
  school_year: number;
  student_code: string;
  student_login_id: string;
  grade: number;
  class_number: number;
  student_number: number;
  profiles: {
    id: string;
    login_id: string;
    name: string;
    role: string;
    status: string;
  } | null;
};

export default function StudentLoginPage() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!password) {
      setErrorMessage("비밀번호를 입력해 주세요.");
      return;
    }

    // 로그인 ID는 '연도+학번' 전체를 입력받는다. (저장 ID와 동일, 다년도에도 안전)
    const studentLoginId = loginId.trim();
    if (!/^\d+$/.test(studentLoginId)) {
      setErrorMessage("로그인 ID를 숫자로 입력해 주세요. (예: 202620602)");
      return;
    }

    setIsChecking(true);

    // 1. 합성 이메일로 Auth 로그인
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: loginIdToEmail(studentLoginId),
        password,
      });

    if (signInError || !signInData.user) {
      setIsChecking(false);
      setErrorMessage("학번 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    // 2. 학생 정보 조회 (profiles.id = auth.uid())
    const { data, error } = await supabase
      .from("students")
      .select(
        `
        id, profile_id, school_year, student_code, student_login_id,
        grade, class_number, student_number,
        profiles ( id, login_id, name, role, status )
      `
      )
      .eq("profile_id", signInData.user.id)
      .maybeSingle();

    if (error || !data) {
      setIsChecking(false);
      await supabase.auth.signOut();
      setErrorMessage("학생 정보를 찾을 수 없습니다. 관리자에게 문의해 주세요.");
      return;
    }

    const studentData = data as unknown as StudentWithProfile;

    if (studentData.profiles?.status !== "approved") {
      setIsChecking(false);
      await supabase.auth.signOut();
      setErrorMessage("아직 승인되지 않았거나 사용할 수 없는 학생 계정입니다.");
      return;
    }

    setIsChecking(false);

    // 홈 화면이 읽는 localStorage 정보를 채운다(세션이 통과한 뒤에만 기록).
    localStorage.setItem(
      STUDENT_STORAGE_KEY,
      JSON.stringify({
        studentId: studentData.id,
        profileId: studentData.profile_id,
        loginId: studentData.student_login_id,
        name: studentData.profiles?.name ?? "",
        schoolYear: studentData.school_year,
        studentCode: studentData.student_code,
        grade: studentData.grade,
        classNumber: studentData.class_number,
        studentNumber: studentData.student_number,
      })
    );

    router.push("/student/home");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-cyan-300">학생 로그인</p>

        <h1 className="mt-3 text-3xl font-bold">학번으로 로그인하기</h1>

        <p className="mt-4 leading-7 text-slate-300">
          로그인 ID(연도+학번)와 비밀번호로 로그인합니다. 예를 들어{" "}
          <span className="font-semibold text-cyan-200">202620602</span>는
          2026학년도 2학년 6반 2번을 의미합니다. (가입 완료 화면에서 본인 로그인
          ID를 확인할 수 있습니다.)
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="student-login-id"
              className="block text-sm font-semibold text-slate-200"
            >
              로그인 ID (연도+학번)
            </label>
            <input
              id="student-login-id"
              value={loginId}
              onChange={(event) => {
                setLoginId(event.target.value);
                setErrorMessage("");
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              placeholder="예: 202620602"
              inputMode="numeric"
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="student-password"
              className="block text-sm font-semibold text-slate-200"
            >
              비밀번호
            </label>
            <input
              id="student-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrorMessage("");
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              placeholder="비밀번호"
              autoComplete="current-password"
            />
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isChecking}
            className="w-full rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isChecking ? "확인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/student/signup"
            className="rounded-full border border-cyan-300/40 px-5 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
          >
            학생 회원가입
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/20 px-5 py-3 font-semibold transition hover:bg-white/10"
          >
            홈으로 돌아가기
          </Link>

          <Link
            href="/join"
            className="rounded-full border border-white/20 px-5 py-3 font-semibold transition hover:bg-white/10"
          >
            입장 코드로 참여하기
          </Link>
        </div>
      </section>
    </main>
  );
}
