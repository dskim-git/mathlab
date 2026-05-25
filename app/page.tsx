import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const features = [
  {
    title: "확률 시뮬레이터",
    description: "동전, 주사위, 베르누이 시행을 직접 실험하고 이론값과 비교합니다.",
  },
  {
    title: "학생 응답 저장",
    description: "학생의 실험 결과와 해석을 Supabase에 저장할 예정입니다.",
  },
  {
    title: "교사용 대시보드",
    description: "수업 세션별 학생 제출 현황과 응답 내용을 확인할 수 있게 됩니다.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-sm font-semibold text-cyan-300">MathLab</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              수학 수업용 활동 웹앱
            </h1>
          </div>

          <div className="rounded-full border border-cyan-300/40 px-4 py-2 text-sm text-cyan-100">
            MVP 개발 중
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <p className="mb-4 inline-flex rounded-full bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200">
              Next.js + Supabase + Vercel 기반 새 프로젝트
            </p>

            <h2 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              학생이 직접 실험하고,
              <br />
              교사가 바로 확인하는
              <br />
              수학 수업 플랫폼
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              기존 Streamlit 기반 수학 웹앱의 활동 구조를 바탕으로,
              더 빠르고 안정적인 수업용 웹앱을 새로 구축하고 있습니다.
              첫 번째 목표는 확률 시뮬레이터, 학생 응답 저장, 교사용
              대시보드입니다.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/student/login" className={buttonClasses("primary")}>
                학생 로그인
              </Link>

              <Link href="/join" className={buttonClasses("secondary")}>
                입장 코드로 참여
              </Link>

              <Link href="/teacher" className={buttonClasses("neutral")}>
                교사용 대시보드
              </Link>
            </div>
          </section>

          <Card className="p-6 shadow-2xl shadow-cyan-950/40">
            <h3 className="text-xl font-bold">현재 개발 중인 기능</h3>

            <div className="mt-6 space-y-4">
              {features.map((feature, index) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-slate-900/80 p-5"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300 text-sm font-bold text-slate-950">
                    {index + 1}
                  </div>
                  <h4 className="text-lg font-semibold">{feature.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </Card>
        </div>

        <footer className="border-t border-white/10 pt-5 text-sm text-slate-400">
          기존 repository `dskim-git/math`를 참고하여 새 repository
          `dskim-git/mathlab`에서 개발 중입니다.
        </footer>
      </section>
    </main>
  );
}