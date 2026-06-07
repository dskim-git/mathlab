"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/dashboard/PageShell";

type GateState = "loading" | "denied" | "ok";

type GateProfile = {
  name: string;
  role: string;
  status: string;
};

export default function GeneralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [gateState, setGateState] = useState<GateState>("loading");
  const [profile, setProfile] = useState<GateProfile | null>(null);

  // 공개 경로 — 로그인·가입은 가드 예외 (무한 루프 회피).
  const isPublic =
    pathname === "/general/signup" || pathname === "/general/login";

  useEffect(() => {
    if (isPublic) {
      // 공개 경로에선 게이트 검사 자체를 건너뛰고 children 만 렌더.
      setGateState("ok");
      setProfile(null);
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

      const { data } = await supabase
        .from("profiles")
        .select("name, role, status")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!active) return;

      const row = data as GateProfile | null;
      // 일반인 또는 관리자(슈퍼유저)만 통과.
      if (
        !row ||
        row.status !== "approved" ||
        (row.role !== "general" && row.role !== "admin")
      ) {
        setGateState("denied");
        return;
      }

      setProfile(row);
      setGateState("ok");
    })();

    return () => {
      active = false;
    };
  }, [pathname, isPublic]);

  // 공개 경로(가입·로그인) — PageShell 없이 자체 main 그대로.
  if (isPublic) {
    return <>{children}</>;
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
          <p className="text-sm font-semibold text-cyan-300">일반인 페이지</p>

          <h1 className="mt-3 text-3xl font-bold">로그인이 필요합니다</h1>

          <p className="mt-4 leading-7 text-slate-300">
            이 페이지는 일반인 계정으로 로그인한 후에 이용할 수 있습니다.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/general/login" className={buttonClasses("primary")}>
              일반인 로그인
            </Link>

            <Link
              href="/general/signup"
              className={buttonClasses("secondary")}
            >
              회원가입
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
      role="general"
      userName={profile?.name ?? "이용자"}
      isAdmin={profile?.role === "admin"}
    >
      {children}
    </PageShell>
  );
}
