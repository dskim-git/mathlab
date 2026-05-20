import Link from "next/link";

export default function TeacherPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-cyan-300">교사용 대시보드</p>

        <h1 className="mt-3 text-3xl font-bold">수업 세션 관리</h1>

        <p className="mt-4 leading-7 text-slate-300">
          이 화면은 앞으로 선생님이 활동 세션을 만들고, 입장 코드를
          발급하고, 학생 응답을 확인하는 대시보드가 됩니다.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <h2 className="font-semibold">다음 구현 예정</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Supabase sessions 테이블을 만들고, 수업 세션 생성 기능을
              연결합니다.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <h2 className="font-semibold">MVP 목표</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              확률 시뮬레이터 활동을 생성하고 학생 응답을 확인하는
              흐름을 완성합니다.
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-full border border-white/20 px-5 py-3 font-semibold transition hover:bg-white/10"
        >
          홈으로 돌아가기
        </Link>
      </section>
    </main>
  );
}