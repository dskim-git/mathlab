"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { loginIdToEmail } from "@/lib/auth/credentials";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Alert } from "@/components/ui/Alert";

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
      // 동시 로그인 burst(같은 IP 분당 30회 초과) 또는 일시 서버 오류는
      // "비번 틀림"으로 오인되지 않도록 분기한다. NAT 단일 IP 학교에서 발생 가능.
      if (signInError?.status === 429) {
        setErrorMessage(
          "접속이 잠시 몰려 로그인이 제한되었습니다. 10초 후 다시 시도해 주세요."
        );
      } else if (signInError?.status && signInError.status >= 500) {
        setErrorMessage(
          "로그인 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요."
        );
      } else {
        setErrorMessage("학번 또는 비밀번호가 올바르지 않습니다.");
      }
      return;
    }

    // 2. 학생 정보 조회 (profiles.id = auth.uid())
    const { data, error } = await supabase
      .from("students")
      .select(
        `
        id, profile_id, school_year, student_code, student_login_id,
        grade, class_number, student_number,
        profiles!profile_id ( id, login_id, name, role, status )
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

    // 홈/입장 화면은 모두 Auth 세션에서 학생 정보를 파생한다 — localStorage 저장 없음.
    router.push("/student/home");
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan-300">학생 로그인</p>

        <h1 className="mt-3 text-3xl font-bold">학번으로 로그인하기</h1>

        <p className="mt-4 leading-7 text-slate-300">
          로그인 ID(연도+학번)와 비밀번호로 로그인합니다. 예를 들어{" "}
          <span className="font-semibold text-cyan-200">202620602</span>는
          2026학년도 2학년 6반 2번을 의미합니다. (가입 완료 화면에서 본인 로그인
          ID를 확인할 수 있습니다.)
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <TextField
            id="student-login-id"
            label="로그인 ID (연도+학번)"
            value={loginId}
            onChange={(event) => {
              setLoginId(event.target.value);
              setErrorMessage("");
            }}
            placeholder="예: 202620602"
            inputMode="numeric"
            autoComplete="username"
          />

          <TextField
            id="student-password"
            label="비밀번호"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrorMessage("");
            }}
            placeholder="비밀번호"
            autoComplete="current-password"
          />

          {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

          <Button type="submit" fullWidth disabled={isChecking}>
            {isChecking ? "확인 중..." : "로그인"}
          </Button>
        </form>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/student/signup" className={buttonClasses("secondary")}>
            학생 회원가입
          </Link>

          <Link href="/" className={buttonClasses("neutral")}>
            홈으로 돌아가기
          </Link>
        </div>
      </Card>
    </main>
  );
}
