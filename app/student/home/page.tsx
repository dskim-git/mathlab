"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { supabase } from "@/lib/supabase/client";

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

type ActivityResponseRow = {
  id: string;
  subject: string | null;
  activity_slug: string | null;
  reflection_data: {
    interpretationType?: string;
    reflection?: string;
  } | null;
  created_at: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function previewText(text: string, max = 120) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
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

  const studentId = student?.studentId;
  const [responses, setResponses] = useState<ActivityResponseRow[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadResponses = useCallback(async () => {
    if (!studentId) {
      setResponses([]);
      return;
    }

    setIsLoadingResponses(true);
    setLoadError("");

    const { data, error } = await supabase
      .from("activity_responses")
      .select("id, subject, activity_slug, reflection_data, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError(error.message);
      setResponses([]);
    } else {
      setResponses((data ?? []) as ActivityResponseRow[]);
    }

    setIsLoadingResponses(false);
  }, [studentId]);

  useEffect(() => {
    loadResponses();
  }, [loadResponses]);

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              내 활동 기록{" "}
              <span className="text-base font-semibold text-slate-400">
                ({responses.length}개)
              </span>
            </h2>

            <button
              type="button"
              onClick={loadResponses}
              disabled={isLoadingResponses}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingResponses ? "불러오는 중..." : "새로고침"}
            </button>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            로그인한 학생 계정으로 저장된 활동·성찰 기록입니다. (최신순)
          </p>

          {loadError ? (
            <div className="mt-5 rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
              기록을 불러오지 못했습니다: {loadError}
            </div>
          ) : null}

          {isLoadingResponses && responses.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-white/20 bg-slate-950 p-5 text-slate-400">
              활동 기록을 불러오는 중입니다...
            </div>
          ) : null}

          {!isLoadingResponses && !loadError && responses.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-white/20 bg-slate-950 p-5 text-slate-400">
              아직 제출한 활동 기록이 없습니다. 활동에 참여해 결과와 성찰을
              제출하면 여기에 쌓입니다.
            </div>
          ) : null}

          {responses.length > 0 ? (
            <ul className="mt-5 space-y-4">
              {responses.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-white/10 bg-slate-950 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-white">
                      {row.activity_slug ?? "활동"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(row.created_at)}
                    </p>
                  </div>

                  {row.subject ? (
                    <p className="mt-1 text-xs text-cyan-300">{row.subject}</p>
                  ) : null}

                  {row.reflection_data?.reflection ? (
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {previewText(row.reflection_data.reflection)}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">성찰 내용 없음</p>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
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