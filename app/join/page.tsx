"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function JoinPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCode = joinCode.trim().toUpperCase();

    if (!normalizedCode) {
      setErrorMessage("입장 코드를 입력해 주세요.");
      return;
    }

    if (!studentName.trim()) {
      setErrorMessage("이름을 입력해 주세요.");
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

    const params = new URLSearchParams({
      name: studentName.trim(),
      number: studentNumber.trim(),
    });

    router.push(`/student/session/${normalizedCode}?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-cyan-300">학생 입장</p>

        <h1 className="mt-3 text-3xl font-bold">입장 코드로 참여하기</h1>

        <p className="mt-4 leading-7 text-slate-300">
          선생님이 알려준 입장 코드를 입력하고 수업 활동에 참여하세요.
        </p>

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
              onChange={(event) => setJoinCode(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-lg font-bold uppercase tracking-[0.2em] text-white outline-none transition focus:border-cyan-300"
              placeholder="예: ABC123"
            />
          </div>

          <div>
            <label
              htmlFor="student-name"
              className="block text-sm font-semibold text-slate-200"
            >
              이름
            </label>
            <input
              id="student-name"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              placeholder="예: 김민준"
            />
          </div>

          <div>
            <label
              htmlFor="student-number"
              className="block text-sm font-semibold text-slate-200"
            >
              학번 또는 번호
            </label>
            <input
              id="student-number"
              value={studentNumber}
              onChange={(event) => setStudentNumber(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              placeholder="예: 20512"
            />
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isChecking}
            className="w-full rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isChecking ? "입장 코드 확인 중..." : "활동 입장하기"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-full border border-white/20 px-5 py-3 font-semibold transition hover:bg-white/10"
        >
          홈으로 돌아가기
        </Link>
      </section>
    </main>
  );
}