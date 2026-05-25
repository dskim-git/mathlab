"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { checkPasswordPolicy, loginIdToEmail } from "@/lib/auth/credentials";
import { getCurrentSchoolYear } from "@/lib/settings/schoolYear";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Alert } from "@/components/ui/Alert";

export default function StudentSignupPage() {
  const [studentCode, setStudentCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [registeredId, setRegisteredId] = useState("");

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const code = studentCode.trim();
    const trimmedName = name.trim();

    if (!/^\d+$/.test(code)) {
      setErrorMessage("학번은 숫자로 입력해 주세요. (예: 20602)");
      return;
    }
    if (!trimmedName) {
      setErrorMessage("이름을 입력해 주세요.");
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

    // 현재 학년도(관리자 설정)를 읽어 학번 앞에 붙인다.
    const schoolYear = await getCurrentSchoolYear();

    // 1. 명렬표 사전 확인 (전체 명단 노출 없이 일치 여부만)
    const { data: matched, error: rpcError } = await supabase.rpc(
      "check_student_roster",
      {
        p_school_year: schoolYear,
        p_student_code: code,
        p_name: trimmedName,
      }
    );

    if (rpcError) {
      setIsSubmitting(false);
      setErrorMessage(`명렬표 확인 중 오류: ${rpcError.message}`);
      return;
    }

    if (!matched) {
      setIsSubmitting(false);
      setErrorMessage(
        "명렬표에서 학번과 이름을 찾을 수 없습니다. 입력을 다시 확인하거나 선생님께 문의해 주세요."
      );
      return;
    }

    // 2. 합성 이메일로 Auth 가입 (트리거가 명렬표를 다시 검증하고 students 행 생성 + 자동 승인)
    const studentLoginId = `${schoolYear}${code}`;

    const { error } = await supabase.auth.signUp({
      email: loginIdToEmail(studentLoginId),
      password,
      options: {
        data: {
          role: "student",
          name: trimmedName,
          school_year: schoolYear,
          student_code: code,
          login_id: studentLoginId,
        },
      },
    });

    if (error) {
      setIsSubmitting(false);
      setErrorMessage(
        `가입 중 오류가 발생했습니다: ${error.message} (이미 가입된 학번일 수 있습니다.)`
      );
      return;
    }

    // 자동 승인이지만, 깔끔하게 로그인부터 다시 하도록 세션을 정리한다.
    await supabase.auth.signOut();

    setIsSubmitting(false);
    setRegisteredId(studentLoginId);
    setIsDone(true);
  }

  if (isDone) {
    return (
      <main className="min-h-screen px-6 py-10">
        <Card className="mx-auto max-w-xl p-6 sm:p-8">
          <p className="text-sm font-semibold text-cyan-300">학생 회원가입</p>

          <h1 className="mt-3 text-3xl font-bold">가입이 완료되었습니다</h1>

          <p className="mt-4 leading-7 text-slate-300">
            명렬표와 일치해 <span className="font-semibold text-cyan-200">바로 사용</span>{" "}
            할 수 있습니다. 아래 로그인 ID와 비밀번호로 로그인해 주세요.
          </p>

          <Alert tone="info" className="mt-5">
            <p className="text-sm">내 로그인 ID</p>
            <p className="mt-1 text-2xl font-bold tracking-wider">{registeredId}</p>
            <p className="mt-2 text-xs leading-5 text-cyan-200/80">
              다음 로그인부터 이 ID(연도+학번)를 입력합니다. 잊지 않도록 기억해
              두세요.
            </p>
          </Alert>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/student/login" className={buttonClasses("primary")}>
              학생 로그인으로
            </Link>

            <Link href="/" className={buttonClasses("neutral")}>
              홈으로 돌아가기
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan-300">학생 회원가입</p>

        <h1 className="mt-3 text-3xl font-bold">학생 계정 만들기</h1>

        <p className="mt-4 leading-7 text-slate-300">
          학번과 이름이 명렬표와 일치해야 가입할 수 있습니다. 학번과 비밀번호로
          로그인하게 됩니다. (이메일은 입력하지 않습니다.)
        </p>

        <form onSubmit={handleSignup} className="mt-8 space-y-5">
          <TextField
            id="student-code"
            label="학번"
            value={studentCode}
            onChange={(event) => {
              setStudentCode(event.target.value);
              setErrorMessage("");
            }}
            placeholder="예: 20602 (2학년 6반 2번)"
            inputMode="numeric"
          />

          <TextField
            id="name"
            label="이름"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setErrorMessage("");
            }}
            placeholder="명렬표에 등록된 이름"
          />

          <TextField
            id="password"
            label="비밀번호"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrorMessage("");
            }}
            placeholder="8자 이상, 숫자 1개 이상"
            autoComplete="new-password"
          />

          <TextField
            id="password-confirm"
            label="비밀번호 확인"
            type="password"
            value={passwordConfirm}
            onChange={(event) => {
              setPasswordConfirm(event.target.value);
              setErrorMessage("");
            }}
            placeholder="비밀번호를 한 번 더 입력"
            autoComplete="new-password"
          />

          {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "가입 처리 중..." : "가입하기"}
          </Button>
        </form>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/student/login" className={buttonClasses("secondary")}>
            이미 계정이 있어요 (로그인)
          </Link>

          <Link href="/" className={buttonClasses("neutral")}>
            홈으로 돌아가기
          </Link>
        </div>
      </Card>
    </main>
  );
}
