import { LogoMark } from "@/components/brand/LogoMark";
import { LandingLoginForm } from "@/components/landing/LandingLoginForm";
import Link from "next/link";

// 랜딩 — SiteFooter 포함 한 화면에 들어가도록 layout flex-col 안에서 flex-1 차지 + 수직 중앙 정렬.
// 매우 짧은 뷰포트(가로 모드 모바일 등)에선 자연스럽게 스크롤 허용.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-6 py-6">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <header className="text-center">
          <div className="flex justify-center">
            <LogoMark
              size={64}
              className="drop-shadow-[0_0_22px_rgba(34,211,238,0.35)]"
            />
          </div>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            MATHLAB
          </h1>
          <p className="mt-1 text-xs font-medium tracking-[0.2em] text-slate-400 sm:text-sm">
            수학을 실험하다
          </p>
        </header>

        <div className="mt-8">
          <LandingLoginForm />
        </div>

        <p className="mt-5 text-center text-sm text-slate-400">
          처음이신가요?{" "}
          <Link
            href="/signup"
            className="font-semibold text-cyan-200 underline-offset-4 hover:underline"
          >
            회원가입
          </Link>
        </p>
      </div>
    </main>
  );
}
