import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type GeneralGuardProfile = {
  id: string;
  login_id: string;
  name: string;
  role: string;
  status: string;
};

/**
 * 일반인 서버 페이지의 공통 가드. 일반인 또는 관리자(슈퍼유저) 통과.
 * 승인되지 않은 사용자는 /teacher/login(공용 로그인)으로 보낸다.
 */
export async function requireGeneral() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/teacher/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, login_id, name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as GeneralGuardProfile | null;

  if (
    !profile ||
    profile.status !== "approved" ||
    (profile.role !== "general" && profile.role !== "admin")
  ) {
    redirect("/teacher/login");
  }

  return { supabase, user, profile };
}
