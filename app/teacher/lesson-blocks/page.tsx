export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireTeacher } from "@/lib/auth/requireTeacher";
import LessonBlocksEditor, {
  type EditorOverride,
  type EditorUnit,
} from "@/components/teacher/LessonBlocksEditor";

// 교사 페이지 — 단원(잎) 별 수업 블록 커스터마이즈.
// - 본인 담당 교과(관리자=전체) 의 curriculum_units 와 본인 teacher_unit_overrides 를 미리 SELECT.
// - 편집 UI 는 클라이언트 컴포넌트(LessonBlocksEditor)에서 처리.

type TeacherPermissionRow = { subject: string };

export default async function TeacherLessonBlocksPage() {
  const { supabase, user, profile } = await requireTeacher();
  const isAdmin = profile.role === "admin";

  // 담당 교과 — 관리자=전체, 교사=teacher_permissions 의 distinct subject.
  let subjects: string[] = [];
  if (isAdmin) {
    const { data } = await supabase
      .from("subjects")
      .select("name, order_index")
      .order("order_index");
    subjects = ((data ?? []) as Array<{ name: string }>).map((s) => s.name);
  } else {
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
      const set = new Set(
        ((data ?? []) as TeacherPermissionRow[]).map((r) => r.subject)
      );
      if (set.size > 0) {
        const { data: ordered } = await supabase
          .from("subjects")
          .select("name, order_index")
          .in("name", Array.from(set))
          .order("order_index");
        subjects = ((ordered ?? []) as Array<{ name: string }>).map(
          (s) => s.name
        );
      }
    }
  }

  // 위 교과들에 속하는 모든 curriculum_units 한 번에 가져오기.
  let units: EditorUnit[] = [];
  if (subjects.length > 0) {
    const { data } = await supabase
      .from("curriculum_units")
      .select(
        "id, subject, parent_id, unit_key, label, depth, order_index, content_blocks"
      )
      .in("subject", subjects)
      .order("depth")
      .order("order_index");
    units = (data ?? []) as EditorUnit[];
  }

  // 본인이 만들어둔 override 들 — RLS 본인 SELECT 로 자동 필터.
  const { data: ovData } = await supabase
    .from("teacher_unit_overrides")
    .select("subject, unit_key, block_ids")
    .eq("teacher_profile_id", user.id);
  const overrides = (ovData ?? []) as EditorOverride[];

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold text-cyan-300">수업활동 편집</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          내 단원·블록 구성
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          기본 자료 위에 본인 수업용 구성을 얹습니다. 불필요한 블록은 빼고
          순서를 바꿔도 다른 교사·기본 자료에는 영향이 없습니다. ●는 내가 편집한
          단원입니다.
        </p>
      </div>

      <LessonBlocksEditor
        subjects={subjects}
        units={units}
        overrides={overrides}
        teacherProfileId={user.id}
      />
    </>
  );
}
