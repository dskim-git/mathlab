"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type GateState = "loading" | "denied" | "ok";

export default function StudentHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [gateState, setGateState] = useState<GateState>("loading");

  // 경로가 바뀔 때마다 Auth 세션을 확인한다(로그인/로그아웃 직후 반영).
  useEffect(() => {
    let active = true;
    setGateState("loading");

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      setGateState(session ? "ok" : "denied");
    })();

    return () => {
      active = false;
    };
  }, [pathname]);

  if (gateState === "loading") {
    return (
      <main className="min-h-screen px-6 py-10">
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
          확인 중...
        </section>
      </main>
    );
  }

  if (gateState === "denied") {
    return (
      <main className="min-h-screen px-6 py-10">
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold text-cyan-300">학생 홈</p>

          <h1 className="mt-3 text-3xl font-bold">학생 로그인이 필요합니다</h1>

          <p className="mt-4 leading-7 text-slate-300">
            내 활동 기록은 학번과 비밀번호로 로그인한 후에 볼 수 있습니다.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/student/login"
              className="rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              학생 로그인하러 가기
            </Link>

            <Link
              href="/"
              className="rounded-full border border-white/20 px-5 py-3 font-semibold transition hover:bg-white/10"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
