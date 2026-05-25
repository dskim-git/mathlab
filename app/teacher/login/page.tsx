"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { loginIdToEmail } from "@/lib/auth/credentials";

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
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const id = loginId.trim();

    if (!id || !password) {
      setErrorMessage("아이디와 비밀번호를 입력해 주세요.");
      return;
    }

    setIsChecking(true);

    // 1. 아이디 → 합성 이메일로 Supabase Auth 로그인 (실제 비밀번호 검증)
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: loginIdToEmail(id),
        password,
      });

    if (signInError || !signInData.user) {
      setIsChecking(false);
      // 계정 존재 여부를 흘리지 않도록 메시지를 합친다.
      setErrorMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    // 2. 프로필 조회 (profiles.id = auth.uid())
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, login_id, name, role, status")
      .eq("id", signInData.user.id)
      .maybeSingle();

    if (profileError) {
      setIsChecking(false);
      await supabase.auth.signOut();
      setErrorMessage(`프로필 조회 중 오류가 발생했습니다: ${profileError.message}`);
      return;
    }

    if (!profile) {
      setIsChecking(false);
      await supabase.auth.signOut();
      setErrorMessage("프로필 정보를 찾을 수 없습니다. 관리자에게 문의해 주세요.");
      return;
    }

    const profileData = profile as ProfileRow;

    // 3. 승인 상태 확인
    if (profileData.status !== "approved") {
      setIsChecking(false);
      await supabase.auth.signOut();
      setErrorMessage(
        "아직 승인되지 않았거나 사용할 수 없는 계정입니다. 관리자 승인 후 이용해 주세요."
      );
      return;
    }

    // 4. 교사/관리자 권한 확인
    if (profileData.role !== "teacher" && profileData.role !== "admin") {
      setIsChecking(false);
      await supabase.auth.signOut();
      setErrorMessage("교사 권한이 없는 계정입니다.");
      return;
    }

    setIsChecking(false);

    // 관리자는 승인 대시보드로, 교사는 교사 대시보드로 보낸다.
    // (게이트/화면은 모두 Auth 세션에서 신원을 파생한다 — localStorage 저장 없음)
    router.push(profileData.role === "admin" ? "/admin" : "/teacher");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-cyan-300">교사 로그인</p>

        <h1 className="mt-3 text-3xl font-bold">아이디로 로그인하기</h1>

        <p className="mt-4 leading-7 text-slate-300">
          가입 때 정한 아이디와 비밀번호로 로그인합니다. 관리자 승인을 받은
          교사·관리자 계정만 이용할 수 있습니다.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="teacher-login-id"
              className="block text-sm font-semibold text-slate-200"
            >
              아이디
            </label>

            <input
              id="teacher-login-id"
              value={loginId}
              onChange={(event) => {
                setLoginId(event.target.value);
                setErrorMessage("");
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              placeholder="예: teacher02"
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="teacher-password"
              className="block text-sm font-semibold text-slate-200"
            >
              비밀번호
            </label>

            <input
              id="teacher-password"
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
            href="/teacher/signup"
            className="rounded-full border border-cyan-300/40 px-5 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
          >
            교사 회원가입
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
