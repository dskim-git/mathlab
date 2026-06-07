import Link from "next/link";
import { Card } from "@/components/ui/Card";

const choices = [
  {
    icon: "🎓",
    title: "학생",
    description: "우리 학교 학생 — 학번·이름 매칭으로 자동 승인.",
    href: "/student/signup",
    border: "border-emerald-300/30",
    text: "text-emerald-200",
  },
  {
    icon: "🧑‍🏫",
    title: "교사",
    description: "수업 세션 생성·콘텐츠 구성. 관리자 승인 후 사용.",
    href: "/teacher/signup",
    border: "border-cyan-300/30",
    text: "text-cyan-200",
  },
  {
    icon: "🧭",
    title: "일반인",
    description: "외부 교사·연구자·영재 수업 참여자. 승인 + 그룹 배정.",
    href: "/general/signup",
    border: "border-amber-300/30",
    text: "text-amber-200",
  },
];

// 회원가입 역할 선택 — SiteFooter 포함 한 화면에 들어가도록 layout flex 안에서 flex-1.
export default function SignupChooserPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-6">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center">
        <header className="text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-slate-400">
            회원가입
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            어떤 계정을 만드시겠어요?
          </h1>
        </header>

        <div className="mt-6 grid gap-3">
          {choices.map((c) => (
            <Link key={c.title} href={c.href} className="block">
              <Card
                className={`flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:${c.border}`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${c.border} bg-white/5 text-xl`}
                >
                  {c.icon}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${c.text}`}>{c.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-300">
                    {c.description}
                  </p>
                </div>
                <span className="ml-auto shrink-0 text-slate-500">→</span>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 underline-offset-4 hover:text-white hover:underline"
          >
            ← 로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
