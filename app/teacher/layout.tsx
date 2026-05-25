"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type TeacherProfile = {
  id: string;
  login_id: string;
  name: string;
  role: string;
  status: string;
};

type GateState = "loading" | "denied" | "ok";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // 로그인·회원가입 페이지는 게이트 없이 항상 통과시킨다.
  const isPublicPage =
    pathname === "/teacher/login" || pathname === "/teacher/signup";

  const [gateState, setGateState] = useState<GateState>("loading");
  const [teacherName, setTeacherName] = useState("");
  const [teacherRole, setTeacherRole] = useState("");

  // 경로가 바뀔 때마다 Auth 세션을 다시 확인해, 로그인/로그아웃 직후 상태를 반영한다.
  useEffect(() => {
    if (isPublicPage) {
      return;
    }

    let active = true;
    setGateState("loading");

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (active) setGateState("denied");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, login_id, name, role, status")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!active) return;

      const profileData = profile as TeacherProfile | null;

      if (
        !profileData ||
        profileData.status !== "approved" ||
        (profileData.role !== "teacher" && profileData.role !== "admin")
      ) {
        setGateState("denied");
        return;
      }

      setTeacherName(profileData.name);
      setTeacherRole(profileData.role);
      setGateState("ok");
    })();

    return () => {
      active = false;
    };
  }, [pathname, isPublicPage]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/teacher/login");
  }

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (gateState === "loading") {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
          확인 중...
        </section>
      </main>
    );
  }

  if (gateState === "denied") {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold text-cyan-300">교사용 대시보드</p>

          <h1 className="mt-3 text-3xl font-bold">교사 로그인이 필요합니다</h1>

          <p className="mt-4 leading-7 text-slate-300">
            교사용 페이지는 승인된 교사·관리자 계정으로 로그인한 후에 이용할 수
            있습니다.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/teacher/login"
              className="rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              교사 로그인하러 가기
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
    <>
      <div className="bg-slate-950 px-6 pt-6 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-cyan-200">{teacherName}</span>{" "}
            님으로 로그인됨
          </p>

          <div className="flex flex-wrap gap-2">
            {teacherRole === "admin" ? (
              <Link
                href="/admin"
                className="rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
              >
                관리자 대시보드
              </Link>
            ) : null}

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-red-300/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-300/10"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {children}
    </>
  );
}
