import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TeacherGuardProfile = {
  id: string;
  login_id: string;
  name: string;
  role: string;
  status: string;
};

// Phase 3a: 교사 서버 페이지의 공통 가드.
// 쿠키 세션으로 로그인 사용자를 확인하고, 승인된 교사/관리자가 아니면
// /teacher/login으로 보낸다. 통과하면 그 사용자 신원으로 조회하는 서버
// 클라이언트와 프로필을 함께 돌려준다(같은 클라이언트로 이어서 쿼리하도록).
export async function requireTeacher() {
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

  const profile = data as TeacherGuardProfile | null;

  if (
    !profile ||
    profile.status !== "approved" ||
    (profile.role !== "teacher" && profile.role !== "admin")
  ) {
    redirect("/teacher/login");
  }

  return { supabase, user, profile };
}
