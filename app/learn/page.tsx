import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";
import { getAccessibleSubjects } from "@/lib/curriculum/accessibleSubjects";
import { fetchUserOverrideMap } from "@/lib/curriculum/lessonOverrides";
import { OT_MATERIALS } from "@/lib/learn/otMaterials";
import { buttonClasses } from "@/components/ui/Button";
import LearnBrowser, { type CurriculumUnit } from "@/components/learn/LearnBrowser";
import FloatingCalculator from "@/components/learn/FloatingCalculator";

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

  // 학생 = 자기 학급 담당 교사의 override / 교사 = 본인 override / 그 외 = 빈 맵.
  // LearnBrowser 가 잎 선택 시 (subject, unit_key) 로 lookup 해 기본 블록 위에 적용한다.
  const overrideMap = await fetchUserOverrideMap(supabase, {
    role: profile.role,
    userId: user.id,
  });
  const overrideEntries = Array.from(overrideMap.entries()).map(([key, ids]) => ({
    key,
    blockIds: ids,
  }));

  const isAdmin = profile.role === "admin";
  // 역할별 홈 — 관리자는 /admin, 학생은 /student/home, 일반인은 /general, 그 외(교사)는 /teacher.
  // (이전엔 학생만 분기되어 관리자가 /teacher 로 가는 버그가 있었음.)
  const homeHref =
    profile.role === "student"
      ? "/student/home"
      : isAdmin
      ? "/admin"
      : profile.role === "general"
      ? "/general"
      : "/teacher";
  // 관리자에게만 OT 자료 노출. 비관리자에게는 빈 객체로 전달해
  // LearnBrowser 가 OT 버튼·콘텐츠를 모두 숨긴다.
  const otMaterials = isAdmin ? OT_MATERIALS : {};

  // 학생일 때 students.id 를 미리 해석해 LearnBrowser 로 전달.
  // 학생만 진척(✓/⭐) 인디케이터를 보고, 교사·관리자는 미리보기 동선이라 노이즈 회피.
  let studentId: string | null = null;
  if (profile.role === "student") {
    const { data: row } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    studentId = (row as { id: string } | null)?.id ?? null;
  }

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
          <LearnBrowser
            subjects={subjects}
            units={units}
            otMaterials={otMaterials}
            overrideEntries={overrideEntries}
            studentId={studentId}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* 교과 학습 화면 어디서나 쓸 수 있는 떠 있는 계산기 (수업 내용과 별개로 동작) */}
      <FloatingCalculator />
    </main>
  );
}
