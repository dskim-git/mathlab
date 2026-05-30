"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/dashboard/PageShell";

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
    <PageShell
      role="admin"
      userName={admin?.name ?? "관리자"}
      isAdmin
    >
      {children}
    </PageShell>
  );
}
