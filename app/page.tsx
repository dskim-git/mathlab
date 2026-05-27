import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LogoMark } from "@/components/brand/LogoMark";

const roles = [
  {
    icon: "🎓",
    title: "학생",
    description: "수업 활동에 참여하고, 내 활동 기록과 성찰을 모아 봅니다.",
    loginHref: "/student/login",
    loginLabel: "학생 로그인",
    signupHref: "/student/signup",
    signupLabel: "학생 회원가입",
  },
  {
    icon: "🧑‍🏫",
    title: "교사",
    description: "수업 세션을 만들고 콘텐츠를 구성하며, 학생 응답을 확인합니다.",
    loginHref: "/teacher/login",
    loginLabel: "교사 로그인",
    signupHref: "/teacher/signup",
    signupLabel: "교사 회원가입",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col">
        <header className="pt-12 text-center sm:pt-20">
          <div className="flex justify-center">
            <LogoMark
              size={76}
              className="drop-shadow-[0_0_22px_rgba(34,211,238,0.35)]"
            />
          </div>
          <h1 className="mt-5 text-5xl font-extrabold tracking-tight sm:text-6xl">
            MATHLAB
          </h1>
          <p className="mt-2 text-sm font-medium tracking-[0.2em] text-slate-400 sm:text-base">
            수학 수업 활동 플랫폼
          </p>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-cyan-100/90 sm:text-xl">
            수학을 실험하다 — 해보고, 관찰하고, 발견하는 수학
          </p>
        </header>

        <div className="mt-12 grid flex-1 content-start gap-6 sm:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.title} className="flex flex-col p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/15 text-2xl">
                {role.icon}
              </div>

              <h2 className="mt-5 text-2xl font-bold">{role.title}</h2>

              <p className="mt-2 flex-1 leading-7 text-slate-300">
                {role.description}
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={role.loginHref}
                  className={buttonClasses("primary", { fullWidth: true })}
                >
                  {role.loginLabel}
                </Link>
                <Link
                  href={role.signupHref}
                  className={buttonClasses("secondary", { fullWidth: true })}
                >
                  {role.signupLabel}
                </Link>
              </div>
            </Card>
          ))}
        </div>

        <footer className="mt-12 pb-4 text-center text-sm text-slate-400">
          MathLab · 수학 수업용 활동 웹앱
        </footer>
      </div>
    </main>
  );
}
