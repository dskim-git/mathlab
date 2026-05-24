"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const TEACHER_STORAGE_KEY = "mathlab_teacher";

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
    localStorage.removeItem(TEACHER_STORAGE_KEY);
    router.push("/teacher/login");
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
          <p className="text-sm font-semibold text-cyan-300">관리자 페이지</p>

          <h1 className="mt-3 text-3xl font-bold">관리자 로그인이 필요합니다</h1>

          <p className="mt-4 leading-7 text-slate-300">
            이 페이지는 관리자 계정으로 로그인한 경우에만 이용할 수 있습니다.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/teacher/login"
              className="rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              로그인하러 가기
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
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-cyan-200">{admin?.name}</span>{" "}
            관리자로 로그인됨
          </p>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/teacher"
              className="rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
            >
              교사 대시보드
            </Link>

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
