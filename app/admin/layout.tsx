"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type AdminProfile = {
  id: string;
  name: string;
  login_id: string;
  role: string;
  status: string;
};

type GateState = "loading" | "denied" | "ok";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [gateState, setGateState] = useState<GateState>("loading");
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

  useEffect(() => {
    let active = true;

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
        .select("id, name, login_id, role, status")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!active) return;

      const profileData = profile as AdminProfile | null;

      if (
        profileData &&
        profileData.role === "admin" &&
        profileData.status === "approved"
      ) {
        setAdmin(profileData);
        setGateState("ok");
      } else {
        setGateState("denied");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/teacher/login");
  }

  if (gateState === "loading") {
    return (
      <main className="min-h-screen px-6 py-10">
        <Card className="mx-auto max-w-3xl p-6 text-slate-300 sm:p-8">
          확인 중...
        </Card>
      </main>
    );
  }

  if (gateState === "denied") {
    return (
      <main className="min-h-screen px-6 py-10">
        <Card className="mx-auto max-w-3xl p-6 sm:p-8">
          <p className="text-sm font-semibold text-cyan-300">관리자 페이지</p>

          <h1 className="mt-3 text-3xl font-bold">관리자 로그인이 필요합니다</h1>

          <p className="mt-4 leading-7 text-slate-300">
            이 페이지는 관리자 계정으로 로그인한 경우에만 이용할 수 있습니다.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/teacher/login" className={buttonClasses("primary")}>
              로그인하러 가기
            </Link>

            <Link href="/" className={buttonClasses("neutral")}>
              홈으로 돌아가기
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <>
      <div className="px-6 pt-6 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-cyan-200">{admin?.name}</span>{" "}
            관리자로 로그인됨
          </p>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className={buttonClasses("secondary", { size: "sm" })}>
              승인 대기
            </Link>

            <Link
              href="/admin/teachers"
              className={buttonClasses("secondary", { size: "sm" })}
            >
              교사 권한
            </Link>

            <Link
              href="/admin/settings"
              className={buttonClasses("secondary", { size: "sm" })}
            >
              과목·학급
            </Link>

            <Link
              href="/admin/subjects"
              className={buttonClasses("secondary", { size: "sm" })}
            >
              교과 접근
            </Link>

            <Link
              href="/admin/roster"
              className={buttonClasses("secondary", { size: "sm" })}
            >
              명렬표
            </Link>

            <Link href="/teacher" className={buttonClasses("neutral", { size: "sm" })}>
              교사 대시보드
            </Link>

            <Button variant="danger" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </div>
      </div>

      {children}
    </>
  );
}
