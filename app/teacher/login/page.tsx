"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

const TEACHER_STORAGE_KEY = "mathlab_teacher";

type ProfileRow = {
  id: string;
  login_id: string;
  name: string;
  role: string;
  status: string;
};

export default function TeacherLoginPage() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = loginId.trim();

    setErrorMessage("");

    if (!value) {
      setErrorMessage("교사 로그인 ID를 입력해 주세요.");
      return;
    }

    setIsChecking(true);

    // 1. 프로필 조회 (교사 역할 + 승인 상태 확인)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, login_id, name, role, status")
      .eq("login_id", value)
      .maybeSingle();

    if (profileError) {
      setIsChecking(false);
      setErrorMessage(`조회 중 오류가 발생했습니다: ${profileError.message}`);
      return;
    }

    if (!profile) {
      setIsChecking(false);
      setErrorMessage(
        "등록된 교사 계정을 찾을 수 없습니다. 로그인 ID를 확인해 주세요."
      );
      return;
    }

    const profileData = profile as ProfileRow;

    if (profileData.role !== "teacher") {
      setIsChecking(false);
      setErrorMessage("교사 권한이 없는 계정입니다.");
      return;
    }

    if (profileData.status !== "approved") {
      setIsChecking(false);
      setErrorMessage("아직 승인되지 않았거나 사용할 수 없는 계정입니다.");
      return;
    }

    // 2. teachers 행 조회 (teacher_id 확보)
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("id")
      .eq("profile_id", profileData.id)
      .maybeSingle();

    setIsChecking(false);

    if (teacherError) {
      setErrorMessage(`교사 정보 조회 오류: ${teacherError.message}`);
      return;
    }

    if (!teacher) {
      setErrorMessage(
        "교사 권한 정보(teachers)가 없습니다. 관리자에게 문의해 주세요."
      );
      return;
    }

    localStorage.setItem(
      TEACHER_STORAGE_KEY,
      JSON.stringify({
        teacherId: teacher.id,
        profileId: profileData.id,
        loginId: profileData.login_id,
        name: profileData.name,
      })
    );

    router.push("/teacher");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-cyan-300">교사 로그인</p>

        <h1 className="mt-3 text-3xl font-bold">교사 ID로 로그인하기</h1>

        <p className="mt-4 leading-7 text-slate-300">
          교사 로그인 ID를 입력하면 등록·승인된 교사 계정인지 확인합니다.
          확인되면 교사 대시보드로 이동합니다.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="teacher-login-id"
              className="block text-sm font-semibold text-slate-200"
            >
              교사 로그인 ID
            </label>

            <input
              id="teacher-login-id"
              value={loginId}
              onChange={(event) => {
                setLoginId(event.target.value);
                setErrorMessage("");
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              placeholder="예: teacher01"
            />

            <p className="mt-2 text-sm leading-6 text-slate-400">
              현재는 비밀번호 없이 로그인 ID로만 확인하는 임시 방식입니다.
            </p>
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
            {isChecking ? "확인 중..." : "교사 로그인"}
          </button>
        </form>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/teacher"
            className="rounded-full border border-cyan-300/40 px-5 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
          >
            교사 대시보드로
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/20 px-5 py-3 font-semibold transition hover:bg-white/10"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
