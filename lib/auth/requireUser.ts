import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UserProfile = {
  id: string;
  login_id: string;
  name: string;
  role: string;
  status: string;
  must_change_password?: boolean;
};

// 역할 무관 공통 가드 — 승인된 로그인 사용자면 통과(학생/교사/일반인/관리자).
// 없거나 미승인이면 랜딩(/)으로. 통과 시 그 사용자 신원의 서버 클라이언트+프로필 반환.
export async function requireUser() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, login_id, name, role, status, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as UserProfile | null;

  if (!profile || profile.status !== "approved") {
    redirect("/");
  }

  return { supabase, user, profile };
}
