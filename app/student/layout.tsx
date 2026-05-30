"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { PageShell } from "@/components/dashboard/PageShell";

type GateState = "loading" | "denied" | "ok";

type GateProfile = {
  name: string;
  role: string;
};

// 학생 영역 공용 가드 + 셸. 다만 인증·세션 진입 등 특수 페이지는 셸·게이트 없이 통과.
function isPublicStudentPath(pathname: string): boolean {
  if (pathname === "/student/login") return true;
  if (pathname === "/student/signup") return true;
  if (pathname.startsWith("/student/session")) return true; // 입장 코드 후 진입(별도 가드)
  return false;
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublic = isPublicStudentPath(pathname);

  const [gateState, setGateState] = useState<GateState>("loading");
  const [profile, setProfile] = useState<GateProfile | null>(null);

  useEffect(() => {
    if (isPublic) {
      return;
    }
    let active = true;
    setGateState("loading");

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      if (!session) {
        setGateState("denied");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!active) return;
      setProfile((data as GateProfile | null) ?? null);
      setGateState("ok");
    })();

    return () => {
      active = false;
    };
  }, [pathname, isPublic]);

  if (isPublic) {
    return <>{children}</>;
  }

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
          <p className="text-sm font-semibold text-cyan-300">학생 페이지</p>
          <h1 className="mt-3 text-3xl font-bold">학생 로그인이 필요합니다</h1>
          <p className="mt-4 leading-7 text-slate-300">
            학생 페이지는 학번과 비밀번호로 로그인한 후에 볼 수 있습니다.
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

  return (
    <PageShell
      role="student"
      userName={profile?.name ?? "이용자"}
      isAdmin={profile?.role === "admin"}
    >
      {children}
    </PageShell>
  );
}
