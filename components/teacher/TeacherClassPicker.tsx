import Link from "next/link";

type PermissionRow = {
  subject: string | null;
  grade: number;
  class_number: number;
};

type ClassOption = {
  grade: number;
  classNumber: number;
  subjects: string[];
};

// 담당 학급 권한을 (학년·반) 단위로 묶고, 같은 학급의 과목들을 모은다.
function buildClassOptions(permissions: PermissionRow[]): ClassOption[] {
  const map = new Map<string, ClassOption>();

  permissions.forEach((perm) => {
    const key = `${perm.grade}-${perm.class_number}`;
    const existing = map.get(key);

    if (existing) {
      if (perm.subject && !existing.subjects.includes(perm.subject)) {
        existing.subjects.push(perm.subject);
      }
    } else {
      map.set(key, {
        grade: perm.grade,
        classNumber: perm.class_number,
        subjects: perm.subject ? [perm.subject] : [],
      });
    }
  });

  return Array.from(map.values());
}

// Phase 4: 담당 학급 권한은 상위 서버 페이지가 RLS로 조회해 props로 내려준다.
// (localStorage teacherId 의존 제거 — 접근/조회 모두 Auth 세션 기준)
export default function TeacherClassPicker({
  permissions,
  teacherName,
  selectedGrade,
  selectedClassNumber,
}: {
  permissions: PermissionRow[];
  teacherName: string;
  selectedGrade: number | null;
  selectedClassNumber: number | null;
}) {
  const classOptions = buildClassOptions(permissions);

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
      <h2 className="text-xl font-bold">담당 학급</h2>

      <p className="mt-2 text-sm text-slate-400">
        {teacherName} 선생님의 담당 학급입니다. 학급을 선택하면 아래에 활동
        기록이 표시됩니다.
      </p>

      {classOptions.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/20 bg-slate-950 p-5 text-sm text-slate-300">
          지정된 담당 학급(권한)이 없습니다. 관리자에게 권한 설정을 요청해
          주세요.
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {classOptions.map((option) => {
            const isSelected =
              selectedGrade === option.grade &&
              selectedClassNumber === option.classNumber;

            return (
              <Link
                key={`${option.grade}-${option.classNumber}`}
                href={`/teacher/records?grade=${option.grade}&classNumber=${option.classNumber}`}
                scroll={false}
                className={
                  isSelected
                    ? "rounded-2xl border border-cyan-300/60 bg-cyan-300 px-5 py-3 text-slate-950"
                    : "rounded-2xl border border-white/10 bg-slate-950 px-5 py-3 text-slate-200 transition hover:bg-white/10"
                }
              >
                <span className="block text-base font-bold">
                  {option.grade}학년 {option.classNumber}반
                </span>
                {option.subjects.length > 0 ? (
                  <span
                    className={
                      isSelected
                        ? "mt-1 block text-xs text-slate-700"
                        : "mt-1 block text-xs text-slate-400"
                    }
                  >
                    {option.subjects.join(", ")}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
