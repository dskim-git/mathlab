export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import ActivityBlocksEditor from "@/components/teacher/ActivityBlocksEditor";
import { buttonClasses } from "@/components/ui/Button";

type PageProps = {
  params: Promise<{ unitId: string }>;
};

export default async function AdminCurriculumBlocksPage({ params }: PageProps) {
  const { unitId } = await params;
  const { supabase, profile } = await requireUser();
  if (profile.role !== "admin") {
    redirect("/");
  }

  const { data, error } = await supabase
    .from("curriculum_units")
    .select("id, subject, unit_key, label, depth, content_blocks")
    .eq("id", unitId)
    .maybeSingle();
  if (error || !data) {
    notFound();
  }

  const unit = data as {
    id: string;
    subject: string;
    unit_key: string;
    label: string;
    depth: number;
    content_blocks: unknown;
  };

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold text-violet-300">
          교과 단원 관리 › 콘텐츠 블록 편집
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {unit.label}{" "}
          <span className="text-base font-semibold text-slate-400">
            ({unit.subject} · {unit.unit_key})
          </span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          이 단원의 수업 자료 블록을 편집합니다. 저장은 즉시 모든 사용자에게
          반영(공유 마스터). 교사별 커스터마이즈는 teacher_unit_overrides 에서
          관리되며 이 편집과는 별개입니다.
        </p>
        <div className="mt-3">
          <Link
            href="/admin/curriculum"
            className={buttonClasses("neutral", { size: "sm" })}
          >
            ← 단원 트리로
          </Link>
        </div>
      </div>

      <ActivityBlocksEditor
        targetTable="curriculum_units"
        targetId={unit.id}
        initialContentBlocks={unit.content_blocks}
      />
    </>
  );
}
