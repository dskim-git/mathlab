import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/auth/requireUser";

export type AccessibleSubject = { name: string; order_index: number | null };

function distinct(values: (string | null | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v)));
}

// 로그인 사용자가 접근 가능한 교과명을 역할별로 산출한다.
//  - admin   : 전체 교과
//  - teacher : 내 teacher_permissions 의 과목(담당 학급 기준) + 그룹 멤버 교과
//  - student : 내 학급에 부여된 class_subject_permissions + 그룹 멤버 교과
//  - general : 내게 부여된 general_subject_permissions + 그룹 멤버 교과
// 학생/일반인 권한 테이블은 RLS('본인만 읽기')가 이미 행을 제한하므로 전체 select 후 distinct 한다.
// study_group_subjects 도 RLS('자기 그룹만') 로 제한되어 같은 방식.
async function getAccessibleSubjectNames(
  supabase: SupabaseClient,
  user: User,
  profile: UserProfile
): Promise<string[]> {
  if (profile.role === "admin") {
    const { data } = await supabase.from("subjects").select("name");
    return distinct((data ?? []).map((r) => (r as { name: string }).name));
  }

  let base: string[] = [];

  if (profile.role === "teacher") {
    const { data: teacherRow } = await supabase
      .from("teachers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (teacherRow) {
      const { data } = await supabase
        .from("teacher_permissions")
        .select("subject")
        .eq("teacher_id", (teacherRow as { id: string }).id);
      base = (data ?? []).map((r) => (r as { subject: string }).subject);
    }
  } else if (profile.role === "student") {
    const { data } = await supabase
      .from("class_subject_permissions")
      .select("subject");
    base = (data ?? []).map((r) => (r as { subject: string }).subject);
  } else {
    // general
    const { data } = await supabase
      .from("general_subject_permissions")
      .select("subject");
    base = (data ?? []).map((r) => (r as { subject: string }).subject);
  }

  // 그룹 멤버이면 그룹의 교과도 합산 (RLS 가 자기 그룹으로 제한).
  const { data: groupSubjects } = await supabase
    .from("study_group_subjects")
    .select("subject");
  const groupNames = (groupSubjects ?? []).map((r) => (r as { subject: string }).subject);

  return distinct([...base, ...groupNames]);
}

// 접근 교과를 교육과정 순서(order_index)로 정렬해 반환.
export async function getAccessibleSubjects(
  supabase: SupabaseClient,
  user: User,
  profile: UserProfile
): Promise<AccessibleSubject[]> {
  const names = await getAccessibleSubjectNames(supabase, user, profile);
  if (names.length === 0) return [];

  const { data } = await supabase
    .from("subjects")
    .select("name, order_index")
    .in("name", names)
    .order("order_index", { nullsFirst: false })
    .order("name");

  return (data ?? []) as AccessibleSubject[];
}
