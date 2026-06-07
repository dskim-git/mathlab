"use client";

// 일반인 로그인 — 교사와 분리. role=general (또는 admin) 만 통과.
// 동선: 아이디·비번 → Auth → profile 조회 → approved + general/admin 확인 → /general (or /admin).

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

export default function GeneralLoginPage() {
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

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: loginIdToEmail(id),
        password,
      });

    if (signInError || !signInData.user) {
      setIsChecking(false);
      setErrorMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

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

    if (profileData.status !== "approved") {
      setIsChecking(false);
      await supabase.auth.signOut();
      setErrorMessage(
        "아직 승인되지 않았거나 사용할 수 없는 계정입니다. 관리자 승인 후 이용해 주세요."
      );
      return;
    }

    if (profileData.role !== "general" && profileData.role !== "admin") {
      setIsChecking(false);
      await supabase.auth.signOut();
      setErrorMessage("일반인 권한이 없는 계정입니다. 학생/교사 로그인을 사용해 주세요.");
      return;
    }

    setIsChecking(false);

    // 관리자는 승인 대시보드로, 일반인은 일반인 홈으로.
    router.push(profileData.role === "admin" ? "/admin" : "/general");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-amber-300">일반인 로그인</p>

        <h1 className="mt-3 text-3xl font-bold">아이디로 로그인하기</h1>

        <p className="mt-4 leading-7 text-slate-300">
          가입 때 정한 아이디와 비밀번호로 로그인합니다. 관리자 승인을 받은
          일반인 계정만 이용할 수 있습니다.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="general-login-id"
              className="block text-sm font-semibold text-slate-200"
            >
              아이디
            </label>
            <input
              id="general-login-id"
              value={loginId}
              onChange={(event) => {
                setLoginId(event.target.value);
                setErrorMessage("");
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-amber-300 focus-visible:ring-2 focus-visible:ring-amber-300/40"
              placeholder="가입 시 정한 아이디"
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="general-login-pw"
              className="block text-sm font-semibold text-slate-200"
            >
              비밀번호
            </label>
            <input
              id="general-login-pw"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrorMessage("");
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-amber-300 focus-visible:ring-2 focus-visible:ring-amber-300/40"
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
            className="w-full rounded-full bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isChecking ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/general/signup"
            className="rounded-full border border-amber-300/40 px-5 py-3 font-semibold text-amber-200 transition hover:bg-amber-300/10"
          >
            아직 계정이 없어요 (가입)
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
