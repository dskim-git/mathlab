"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

type StoredMathLabStudent = {
  studentId: string;
  profileId: string;
  loginId: string;
  name: string;
  schoolYear: number;
  studentCode: string;
  grade: number;
  classNumber: number;
  studentNumber: number;
};

const STUDENT_STORAGE_KEY = "mathlab_student";
const STUDENT_STORAGE_EVENT = "mathlab-student-change";

function getStudentSnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(STUDENT_STORAGE_KEY) ?? "";
}

function getServerStudentSnapshot() {
  return "";
}

function subscribeStudentStorage(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener(STUDENT_STORAGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STUDENT_STORAGE_EVENT, callback);
  };
}

function parseStoredStudent(rawStudent: string): StoredMathLabStudent | null {
  if (!rawStudent) {
    return null;
  }

  try {
    return JSON.parse(rawStudent) as StoredMathLabStudent;
  } catch {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STUDENT_STORAGE_KEY);
    }

    return null;
  }
}

export default function StudentHomePage() {
  const rawStudent = useSyncExternalStore(
    subscribeStudentStorage,
    getStudentSnapshot,
    getServerStudentSnapshot
  );

  const student = useMemo(() => {
    return parseStoredStudent(rawStudent);
  }, [rawStudent]);

  function handleLogout() {
    localStorage.removeItem(STUDENT_STORAGE_KEY);
    window.dispatchEvent(new Event(STUDENT_STORAGE_EVENT));
  }

  if (!student) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold text-cyan-300">학생 홈</p>

          <h1 className="mt-3 text-3xl font-bold">
            로그인된 학생 정보가 없습니다
          </h1>

          <p className="mt-4 leading-7 text-slate-300">
            학생 ID로 먼저 로그인해야 학생 활동 기록을 확인할 수 있습니다.
          </p>

          <Link
            href="/student/login"
            className="mt-8 inline-flex rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            학생 로그인하러 가기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold text-cyan-300">학생 홈</p>

        <h1 className="mt-3 text-3xl font-bold">
          {student.name} 학생, 안녕하세요
        </h1>

        <p className="mt-4 leading-7 text-slate-300">
          이 화면은 학생 로그인 정보가 브라우저에 저장되어 있는지 확인하는
          임시 학생 홈 화면입니다.
        </p>

        <section className="mt-8 rounded-2xl border border-cyan-300/30 bg-cyan-950/30 p-6">
          <h2 className="text-xl font-bold text-cyan-100">내 학생 정보</h2>

          <div className="mt-5 space-y-3 text-slate-200">
            <p>
              <span className="font-semibold text-slate-400">이름: </span>
              {student.name}
            </p>

            <p>
              <span className="font-semibold text-slate-400">로그인 ID: </span>
              {student.loginId}
            </p>

            <p>
              <span className="font-semibold text-slate-400">학년도: </span>
              {student.schoolYear}
            </p>

            <p>
              <span className="font-semibold text-slate-400">학번: </span>
              {student.grade}학년 {student.classNumber}반{" "}
              {student.studentNumber}번
            </p>

            <p>
              <span className="font-semibold text-slate-400">
                학생 코드:{" "}
              </span>
              {student.studentCode}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">다음 단계 예정</h2>

          <p className="mt-4 leading-7 text-slate-300">
            다음 단계에서는 이 학생 정보로 활동 응답과 성찰을 저장하도록
            연결할 예정입니다.
          </p>

          <div className="mt-5 rounded-xl border border-dashed border-white/20 bg-slate-950 p-5 text-slate-400">
            아직 학생별 활동 목록은 연결하지 않았습니다.
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/join"
            className="rounded-full border border-cyan-300/40 px-5 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
          >
            입장 코드로 활동 참여하기
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/20 px-5 py-3 font-semibold transition hover:bg-white/10"
          >
            홈으로 돌아가기
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-red-300/40 px-5 py-3 font-semibold text-red-200 transition hover:bg-red-300/10"
          >
            학생 로그아웃
          </button>
        </div>
      </section>
    </main>
  );
}