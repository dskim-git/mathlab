"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TEACHER_STORAGE_KEY = "mathlab_teacher";

type StoredTeacher = {
  teacherId: string;
  profileId: string;
  loginId: string;
  name: string;
};

function parseStoredTeacher(raw: string | null): StoredTeacher | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredTeacher;
  } catch {
    return null;
  }
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [teacher, setTeacher] = useState<StoredTeacher | null>(null);
  const [isReady, setIsReady] = useState(false);

  const isLoginPage = pathname === "/teacher/login";

  // 경로가 바뀔 때마다 다시 읽어, 로그인/로그아웃 직후 상태를 반영한다.
  useEffect(() => {
    setTeacher(parseStoredTeacher(localStorage.getItem(TEACHER_STORAGE_KEY)));
    setIsReady(true);
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem(TEACHER_STORAGE_KEY);
    setTeacher(null);
    router.push("/teacher/login");
  }

  // 로그인 페이지는 게이트 없이 항상 통과시킨다.
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isReady) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
          확인 중...
        </section>
      </main>
    );
  }

  if (!teacher) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold text-cyan-300">
            교사용 대시보드
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            교사 로그인이 필요합니다
          </h1>

          <p className="mt-4 leading-7 text-slate-300">
            교사용 페이지는 교사 로그인 후에 이용할 수 있습니다.
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
            <span className="font-semibold text-cyan-200">
              {teacher.name}
            </span>{" "}
            선생님으로 로그인됨
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-red-300/40 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-300/10"
          >
            교사 로그아웃
          </button>
        </div>
      </div>

      {children}
    </>
  );
}
