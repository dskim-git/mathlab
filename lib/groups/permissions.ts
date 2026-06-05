// 수업 그룹(study_groups) 권한 판정 헬퍼.
// 정규 학년·반 권한 (teacher_permissions / class_subject_permissions / general_subject_permissions)
// 과 별개로, 그룹 멤버이면 그룹의 교과에 접근 가능 + 그룹 안 역할(teacher/student)에 따라
// 그 교과에서의 권한이 결정된다.
//
// 사용처: 빙고 방장 판정, 활동 화면에서 "이 교과에서 교사인가" 판정 등.
// RLS: 본인의 study_group_members / study_group_subjects 행만 읽힘 → 별도 사용자 필터 불필요.

import type { SupabaseClient } from "@supabase/supabase-js";

export type GroupRole = "teacher" | "student";

export type GroupMembership = {
  group_id: string;
  role: GroupRole;
  /** 그룹의 접근 교과 목록 (자기 그룹의 study_group_subjects). */
  subjects: string[];
};

// 본인이 속한 모든 그룹 + 그룹 내 역할 + 그룹의 교과 목록.
export async function getMyGroups(
  supabase: SupabaseClient,
): Promise<GroupMembership[]> {
  // RLS: profile_id = auth.uid() 행만 읽음.
  const { data: members } = await supabase
    .from("study_group_members")
    .select("group_id, role");
  const rows = (members ?? []) as { group_id: string; role: GroupRole }[];
  if (rows.length === 0) return [];

  const groupIds = rows.map((r) => r.group_id);
  const { data: subjects } = await supabase
    .from("study_group_subjects")
    .select("group_id, subject")
    .in("group_id", groupIds);
  const subjectMap = new Map<string, string[]>();
  for (const s of (subjects ?? []) as { group_id: string; subject: string }[]) {
    const arr = subjectMap.get(s.group_id) ?? [];
    arr.push(s.subject);
    subjectMap.set(s.group_id, arr);
  }

  return rows.map((r) => ({
    group_id: r.group_id,
    role: r.role,
    subjects: subjectMap.get(r.group_id) ?? [],
  }));
}

// 주어진 교과에서 본인의 그룹 역할 — 같은 교과를 여러 그룹에서 가지면 teacher 우선.
// 어느 그룹에도 그 교과가 없으면 null.
export async function getGroupRoleForSubject(
  supabase: SupabaseClient,
  subject: string,
): Promise<GroupRole | null> {
  const groups = await getMyGroups(supabase);
  let role: GroupRole | null = null;
  for (const g of groups) {
    if (!g.subjects.includes(subject)) continue;
    if (g.role === "teacher") return "teacher"; // 최강 — 즉시 반환
    role = "student";
  }
  return role;
}

// 정규 교사 권한 (teacher_permissions) 까지 합쳐 "이 교과에서 교사인가" 판정.
//   - profiles.role === 'teacher' 이고 teacher_permissions 에 그 subject 행이 있음
//   - OR 그룹 안 teacher 역할로 그 교과를 가짐
// 정규 권한 쪽 판정은 비용을 줄이기 위해 호출처에서 미리 알 수 있는 신호 (profile + teachers row)
// 가 있으면 그 결과를 넘겨 합산. 없으면 false 로 받아 그룹 역할만 검사.
export async function isTeacherForSubject(
  supabase: SupabaseClient,
  subject: string,
  opts?: { hasRegularTeacherAccess?: boolean },
): Promise<boolean> {
  if (opts?.hasRegularTeacherAccess) return true;
  const role = await getGroupRoleForSubject(supabase, subject);
  return role === "teacher";
}
