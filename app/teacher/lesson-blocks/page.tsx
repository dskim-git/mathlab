import Link from "next/link";
import { requireTeacher } from "@/lib/auth/requireTeacher";
import { buttonClasses } from "@/components/ui/Button";

// 자리표시자 — 단원 안의 수업 블록을 교사별로 편집(순서 변경/제외)하는 화면.
// 데이터 모델(teacher_unit_overrides) 과 학생측 진입 시 "내 담당 교사 우선" 해석 로직을
// 별도 작업(C"-b) 으로 분리해 진행 중.
export default async function TeacherLessonBlocksPage() {
  await requireTeacher();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-cyan-300">수업활동 편집</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          내 단원·블록 구성 (준비 중)
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          이 화면에서는 곧 각 단원의 수업 블록 순서를 조정하거나 필요 없는
          블록을 제외할 수 있게 됩니다. 편집 결과는 교사별로 저장되어 다른
          교사·기본 자료에는 영향을 주지 않습니다.
        </p>
      </div>

      <section className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-5 text-sm leading-7 text-amber-100">
        <p className="font-semibold">기능 범위(예정)</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>교과·대단원·중단원·소단원 트리에서 단원을 선택</li>
          <li>그 단원의 기본 수업 블록을 가져와 미리보기</li>
          <li>각 블록 순서 변경(↑↓) / 제외(체크 해제) / 다시 포함</li>
          <li>저장 시 본인 계정에만 적용 — 다른 교사·기본 자료 영향 없음</li>
          <li>학생이 자기 학급의 담당 교사 화면을 따라가도록 자동 연결</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href="/learn" className={buttonClasses("secondary", { size: "sm" })}>
          기본 수업 자료 둘러보기 (교과 학습)
        </Link>
        <Link href="/teacher" className={buttonClasses("neutral", { size: "sm" })}>
          교사 홈으로
        </Link>
      </div>
    </div>
  );
}
