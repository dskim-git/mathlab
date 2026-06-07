"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * 본인 비밀번호 변경.
 *   1) supabase.auth.updateUser({ password }) — Auth 비번 갱신
 *   2) profiles.must_change_password = false  — proxy 가드에서 풀어줌
 * 성공 시 호출자(form)가 redirect, 실패 시 에러 메시지 반환.
 */
export async function changePassword(
  newPassword: string
): Promise<ChangePasswordResult> {
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (newPassword === "11111111") {
    return {
      ok: false,
      error: "임시 비밀번호와 같습니다. 다른 비밀번호를 사용해 주세요.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "로그인 세션이 만료되었습니다. 다시 로그인해 주세요." };
  }

  const { error: authError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (authError) {
    return { ok: false, error: `비밀번호 변경 실패: ${authError.message}` };
  }

  // profiles RLS 는 본인 UPDATE 를 허용하지 않으므로(role/status 보호) SECURITY DEFINER
  // RPC 로 그 한 컬럼만 풀어준다. (마이그: 20260607_clear_must_change_password_rpc.sql)
  const { error: rpcError } = await supabase.rpc("clear_must_change_password");
  if (rpcError) {
    return {
      ok: false,
      error: `플래그 해제 실패: ${rpcError.message}`,
    };
  }

  return { ok: true };
}

/** 비번 변경 후 역할별 홈으로 이동. server action 별도 — 클라에서 호출. */
export async function redirectToRoleHome(role: string): Promise<never> {
  if (role === "admin") redirect("/admin");
  if (role === "teacher") redirect("/teacher");
  if (role === "student") redirect("/student/home");
  if (role === "general") redirect("/general");
  redirect("/");
}
