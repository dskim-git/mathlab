"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// Phase 4: 학생 정보는 localStorage 블롭이 아니라 Auth 세션에서 파생한다.
type StudentInfo = {
  studentId: string;
  loginId: string;
  name: string;
  grade: number;
  classNumber: number;
  studentNumber: number;
};

export default function JoinPage() {
  const router = useRouter();

  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [joinCode, setJoinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) {
          setStudent(null);
          setAuthChecked(true);
        }
        return;
      }

      const { data } = await supabase
        .from("students")
        .select(
          "id, student_login_id, grade, class_number, student_number, profiles ( name )"
        )
        .eq("profile_id", user.id)
        .maybeSingle();

      if (!active) return;

      const row = data as unknown as {
        id: string;
        student_login_id: string;
        grade: number;
        class_number: number;
        student_number: number;
        profiles: { name: string } | null;
      } | null;

      setStudent(
        row
          ? {
              studentId: row.id,
              loginId: row.student_login_id,
              name: row.profiles?.name ?? "",
              grade: row.grade,
              classNumber: row.class_number,
              studentNumber: row.student_number,
            }
          : null
      );
      setAuthChecked(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCode = joinCode.trim().toUpperCase();

    if (!student) {
      setErrorMessage("학생 로그인 후 입장 코드로 참여할 수 있습니다.");
      return;
    }

    if (!normalizedCode) {
      setErrorMessage("입장 코드를 입력해 주세요.");
      return;
    }

    setIsChecking(true);
    setErrorMessage("");

    const { data: session, error } = await supabase
      .from("sessions")
      .select("id, join_code, title, is_active")
      .eq("join_code", normalizedCode)
      .eq("is_active", true)
      .single();

    setIsChecking(false);

    if (error || !session) {
      setErrorMessage("유효한 입장 코드를 찾을 수 없습니다.");
      return;
    }

    // 신원은 세션 페이지가 Auth 세션에서 파생하므로 URL 파라미터 없이 이동한다.
    router.push(`/student/session/${normalizedCode}`);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-cyan-300">학생 입장</p>

        <h1 className="mt-3 text-3xl font-bold">입장 코드로 참여하기</h1>

        <p className="mt-4 leading-7 text-slate-300">
          선생님이 알려준 입장 코드를 입력하고 수업 활동에 참여하세요.
        </p>

        {!authChecked ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-5 text-sm text-slate-300">
            확인 중...
          </section>
        ) : student ? (
          <section className="mt-6 rounded-2xl border border-green-400/30 bg-green-950/30 p-5 text-sm text-green-100">
            <p className="font-semibold">로그인된 학생 정보</p>
            <p className="mt-2">이름: {student.name}</p>
            <p className="mt-1">
              학번: {student.grade}학년 {student.classNumber}반{" "}
              {student.studentNumber}번
            </p>
            <p className="mt-1">로그인 ID: {student.loginId}</p>
          </section>
        ) : (
          <section className="mt-6 rounded-2xl border border-yellow-400/30 bg-yellow-950/30 p-5 text-sm text-yellow-100">
            <p className="font-semibold">학생 로그인이 필요합니다</p>
            <p className="mt-2 leading-6">
              입장 코드로 활동에 참여하려면 먼저 학생 ID로 로그인해 주세요.
            </p>

            <Link
              href="/student/login"
              className="mt-4 inline-flex rounded-full bg-cyan-300 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              학생 로그인하러 가기
            </Link>
          </section>
        )}

        <form onSubmit={handleJoin} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="join-code"
              className="block text-sm font-semibold text-slate-200"
            >
              입장 코드
            </label>
            <input
              id="join-code"
              value={joinCode}
              onChange={(event) => {
                setJoinCode(event.target.value);
                setErrorMessage("");
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-lg font-bold uppercase tracking-[0.2em] text-white outline-none transition focus:border-cyan-300"
              placeholder="예: ABC123"
            />
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isChecking || !student}
            className="w-full rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isChecking ? "입장 코드 확인 중..." : "활동 입장하기"}
          </button>
        </form>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/student/home"
            className="rounded-full border border-cyan-300/40 px-5 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
          >
            학생 홈으로 가기
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
