import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type StudentGuardProfile = {
  id: string;
  login_id: string;
  name: string;
  role: string;
  status: string;
};

/**
 * 학생 서버 페이지의 공통 가드. 학생 또는 관리자(슈퍼유저) 통과.
 * 승인되지 않은 사용자는 /student/login 으로 보낸다.
 */
export async function requireStudent() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, login_id, name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as StudentGuardProfile | null;

  if (
    !profile ||
    profile.status !== "approved" ||
    (profile.role !== "student" && profile.role !== "admin")
  ) {
    redirect("/student/login");
  }

  return { supabase, user, profile };
}
