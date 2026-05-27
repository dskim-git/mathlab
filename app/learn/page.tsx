import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { getAccessibleSubjects } from "@/lib/curriculum/accessibleSubjects";
import { buttonClasses } from "@/components/ui/Button";
import LearnBrowser, { type CurriculumUnit } from "@/components/learn/LearnBrowser";

export default async function LearnPage() {
  const { supabase, user, profile } = await requireUser();

  const subjects = await getAccessibleSubjects(supabase, user, profile);
  const subjectNames = subjects.map((s) => s.name);

  let units: CurriculumUnit[] = [];
  if (subjectNames.length > 0) {
    const { data } = await supabase
      .from("curriculum_units")
      .select(
        "id, subject, parent_id, unit_key, label, depth, order_index, content_blocks"
      )
      .in("subject", subjectNames)
      .order("depth")
      .order("order_index");
    units = (data ?? []) as CurriculumUnit[];
  }

  const homeHref = profile.role === "student" ? "/student/home" : "/teacher";

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-cyan-300">수업 자료</p>
            <h1 className="mt-2 text-3xl font-bold">교과 학습</h1>
            <p className="mt-2 text-sm text-slate-400">
              교과 → 대단원 → 중단원 → 소단원을 선택해 수업 자료와 활동을 봅니다.
            </p>
          </div>
          <Link href={homeHref} className={buttonClasses("neutral", { size: "sm" })}>
            홈으로
          </Link>
        </div>

        <div className="mt-8">
          <LearnBrowser subjects={subjects} units={units} />
        </div>
      </div>
    </main>
  );
}
