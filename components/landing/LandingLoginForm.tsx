"use client";

// 랜딩 통합 로그인 — 아이디·비번만 받고 profile.role 따라 자동 분기.
//   admin   → /admin
//   teacher → /teacher
//   student → /student/home
//   general → /general
// must_change_password 가드는 proxy.ts 가 처리(여기는 router.push 만).

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { loginIdToEmail } from "@/lib/auth/credentials";

type ProfileRow = {
  role: string;
  status: string;
};

export function LandingLoginForm() {
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
      .select("role, status")
      .eq("id", signInData.user.id)
      .maybeSingle();

    if (profileError) {
      setIsChecking(false);
      await supabase.auth.signOut();
      setErrorMessage(
        `프로필 조회 중 오류가 발생했습니다: ${profileError.message}`
      );
      return;
    }
    if (!profile) {
      setIsChecking(false);
      await supabase.auth.signOut();
      setErrorMessage(
        "프로필 정보를 찾을 수 없습니다. 관리자에게 문의해 주세요."
      );
      return;
    }

    const p = profile as ProfileRow;
    if (p.status !== "approved") {
      setIsChecking(false);
      await supabase.auth.signOut();
      setErrorMessage(
        "아직 승인되지 않았거나 사용할 수 없는 계정입니다. 관리자 승인 후 이용해 주세요."
      );
      return;
    }

    setIsChecking(false);

    // role 자동 분기.
    const home =
      p.role === "admin"
        ? "/admin"
        : p.role === "teacher"
        ? "/teacher"
        : p.role === "student"
        ? "/student/home"
        : p.role === "general"
        ? "/general"
        : "/";
    router.push(home);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-7">
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label
            htmlFor="landing-login-id"
            className="block text-xs font-semibold text-slate-300"
          >
            아이디
          </label>
          <input
            id="landing-login-id"
            value={loginId}
            onChange={(e) => {
              setLoginId(e.target.value);
              setErrorMessage("");
            }}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            placeholder="학생은 9자리 학번, 그 외엔 가입 때 정한 아이디"
            autoComplete="username"
          />
        </div>

        <div>
          <label
            htmlFor="landing-login-pw"
            className="block text-xs font-semibold text-slate-300"
          >
            비밀번호
          </label>
          <input
            id="landing-login-pw"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage("");
            }}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            placeholder="비밀번호"
            autoComplete="current-password"
          />
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-xs text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isChecking}
          className="w-full rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isChecking ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </section>
  );
}
