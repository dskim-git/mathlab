export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import CurriculumEditor, {
  type AdminUnit,
} from "@/components/admin/CurriculumEditor";

// 관리자: 교과 단원(트리) 관리.
// - subjects 마스터(/admin/settings) 의 교과명을 그대로 사용.
// - 대단원→중단원→소단원 CRUD. 소단원의 content_blocks 는 별도 페이지(/admin/curriculum/[id]/blocks).

export default async function AdminCurriculumPage() {
  const { supabase, profile } = await requireUser();
  if (profile.role !== "admin") {
    redirect("/");
  }

  const [subjRes, unitRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("name, order_index")
      .order("order_index"),
    supabase
      .from("curriculum_units")
      .select("id, subject, parent_id, unit_key, label, depth, order_index, content_blocks")
      .order("depth")
      .order("order_index"),
  ]);

  const subjects = ((subjRes.data ?? []) as Array<{ name: string }>).map(
    (s) => s.name
  );
  const units: AdminUnit[] = (
    (unitRes.data ?? []) as Array<{
      id: string;
      subject: string;
      parent_id: string | null;
      unit_key: string;
      label: string;
      depth: number;
      order_index: number;
      content_blocks: unknown;
    }>
  ).map((u) => ({
    id: u.id,
    subject: u.subject,
    parent_id: u.parent_id,
    unit_key: u.unit_key,
    label: u.label,
    depth: u.depth,
    order_index: u.order_index,
    hasContent:
      Array.isArray(u.content_blocks) && (u.content_blocks as unknown[]).length > 0,
  }));

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold text-violet-300">교과 단원 관리</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          단원 트리 + 콘텐츠 블록
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          교과별로 대단원·중단원·소단원을 추가·이름변경·순서변경·삭제합니다.
          소단원의 수업 콘텐츠 블록은 행의 [블록] 버튼에서 편집합니다.
        </p>
      </div>

      <CurriculumEditor subjects={subjects} units={units} />
    </>
  );
}
