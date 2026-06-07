"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "./actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Alert } from "@/components/ui/Alert";

export function ChangePasswordForm({
  forced,
  role,
}: {
  /** 강제 변경 동선이면 "건너뛰기" 같은 옵션을 막는다. */
  forced: boolean;
  role: string;
}) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pw !== pwConfirm) {
      setError("두 비밀번호가 일치하지 않습니다.");
      return;
    }
    setSubmitting(true);
    const res = await changePassword(pw);
    if (!res.ok) {
      setError(res.error);
      setSubmitting(false);
      return;
    }
    // 성공 — 역할별 홈으로. proxy 가드가 must_change_password=false 이라 통과.
    const home =
      role === "admin"
        ? "/admin"
        : role === "teacher"
        ? "/teacher"
        : role === "student"
        ? "/student/home"
        : role === "general"
        ? "/general"
        : "/";
    router.push(home);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <TextField
        id="new-password"
        label="새 비밀번호"
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        autoComplete="new-password"
        hint="8자 이상, 임시 비밀번호 11111111 과 다른 값"
        required
      />
      <TextField
        id="new-password-confirm"
        label="새 비밀번호 확인"
        type="password"
        value={pwConfirm}
        onChange={(e) => setPwConfirm(e.target.value)}
        autoComplete="new-password"
        required
      />

      {error ? <Alert tone="error">{error}</Alert> : null}

      <Button type="submit" variant="primary" fullWidth disabled={submitting}>
        {submitting ? "변경 중..." : "비밀번호 변경"}
      </Button>

      {!forced ? (
        <p className="text-center text-xs text-slate-500">
          변경하지 않으려면 뒤로 가기.
        </p>
      ) : null}
    </form>
  );
}
