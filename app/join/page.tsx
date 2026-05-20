import Link from "next/link";

export default function JoinPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-cyan-300">학생 입장</p>

        <h1 className="mt-3 text-3xl font-bold">입장 코드로 참여하기</h1>

        <p className="mt-4 leading-7 text-slate-300">
          이 화면은 앞으로 학생이 선생님에게 받은 입장 코드를 입력하고
          수업 활동에 참여하는 페이지가 됩니다.
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-cyan-300/40 bg-slate-900 p-5 text-slate-300">
          아직 Supabase 연결 전이므로 실제 입장 기능은 다음 단계에서
          구현합니다.
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