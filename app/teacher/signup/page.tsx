"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  checkPasswordPolicy,
  isValidLoginId,
  loginIdToEmail,
  normalizeLoginId,
} from "@/lib/auth/credentials";

export default function TeacherSignupPage() {
  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    const normalizedId = normalizeLoginId(loginId);

    if (!trimmedName) {
      setErrorMessage("이름을 입력해 주세요.");
      return;
    }

    if (!isValidLoginId(normalizedId)) {
      setErrorMessage("아이디는 영문/숫자/밑줄 4~20자로 입력해 주세요.");
      return;
    }

    const passwordError = checkPasswordPolicy(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email: loginIdToEmail(normalizedId),
      password,
      options: {
        // 트리거(handle_new_auth_user)가 이 metadata로 profiles 행을 만든다.
        // role은 트리거에서 다시 검증되며 admin은 차단된다.
        data: {
          login_id: normalizedId,
          name: trimmedName,
          role: "teacher",
        },
      },
    });

    if (error) {
      setIsSubmitting(false);
      setErrorMessage(
        `가입 중 오류가 발생했습니다: ${error.message} (이미 사용 중인 아이디일 수 있습니다.)`
      );
      return;
    }

    // 이메일 확인이 꺼져 있으면 가입 직후 세션이 생긴다.
    // 아직 승인 전(pending)이므로 세션을 정리해 "로그인된 상태"로 두지 않는다.
    await supabase.auth.signOut();

    setIsSubmitting(false);
    setIsDone(true);
  }

  if (isDone) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold text-cyan-300">교사 회원가입</p>

          <h1 className="mt-3 text-3xl font-bold">가입 신청이 접수되었습니다</h1>

          <p className="mt-4 leading-7 text-slate-300">
            계정이 만들어졌고 현재 <span className="font-semibold text-cyan-200">승인 대기</span>{" "}
            상태입니다. 관리자가 승인한 뒤에 교사 로그인을 사용할 수 있습니다.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/teacher/login"
              className="rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              교사 로그인으로
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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-cyan-300">교사 회원가입</p>

        <h1 className="mt-3 text-3xl font-bold">교사 계정 만들기</h1>

        <p className="mt-4 leading-7 text-slate-300">
          사용할 아이디와 비밀번호를 정해 가입하면, 관리자 승인 후 교사 로그인을
          사용할 수 있습니다. (이메일은 입력하지 않습니다.)
        </p>

        <form onSubmit={handleSignup} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-200">
              이름
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrorMessage("");
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
              placeholder="예: 김선생"
            />
          </div>

          <div>
            <label htmlFor="login-id" className="block text-sm font-semibold text-slate-200">
              아이디
            </label>
            <input
              id="login-id"
              value={loginId}
              onChange={(event) => {
                setLoginId(event.target.value);
                setErrorMessage("");
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
              placeholder="영문/숫자/밑줄 4~20자 (예: teacher02)"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-200">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrorMessage("");
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
              placeholder="8자 이상, 숫자 1개 이상"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label
              htmlFor="password-confirm"
              className="block text-sm font-semibold text-slate-200"
            >
              비밀번호 확인
            </label>
            <input
              id="password-confirm"
              type="password"
              value={passwordConfirm}
              onChange={(event) => {
                setPasswordConfirm(event.target.value);
                setErrorMessage("");
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
              placeholder="비밀번호를 한 번 더 입력"
              autoComplete="new-password"
            />
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "가입 처리 중..." : "가입 신청"}
          </button>
        </form>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/teacher/login"
            className="rounded-full border border-cyan-300/40 px-5 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
          >
            이미 계정이 있어요 (로그인)
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
