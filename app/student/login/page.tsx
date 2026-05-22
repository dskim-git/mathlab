"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
    formatStudentLabel,
    parseStudentLoginId,
    ParsedStudentLoginId,
} from "@/lib/students/parseStudentLoginId";

type StudentWithProfile = {
    id: string;
    profile_id: string;
    school_year: number;
    student_code: string;
    student_login_id: string;
    grade: number;
    class_number: number;
    student_number: number;
    profiles: {
        id: string;
        login_id: string;
        name: string;
        role: string;
        status: string;
    } | null;
};

export default function StudentLoginPage() {
    const router = useRouter();

    const [loginId, setLoginId] = useState("");
    const [parsedStudent, setParsedStudent] =
        useState<ParsedStudentLoginId | null>(null);
    const [student, setStudent] = useState<StudentWithProfile | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [isChecking, setIsChecking] = useState(false);

    async function handleCheckStudent(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setErrorMessage("");
        setStudent(null);
        setParsedStudent(null);

        const parsed = parseStudentLoginId(loginId, 2026);

        if (!parsed.ok) {
            setErrorMessage(parsed.error);
            return;
        }

        setParsedStudent(parsed.data);
        setIsChecking(true);

        const { data, error } = await supabase
            .from("students")
            .select(
                `
                id,
                profile_id,
                school_year,
                student_code,
                student_login_id,
                grade,
                class_number,
                student_number,
                profiles (
                  id,
                  login_id,
                  name,
                  role,
                  status
                )
            `
            )
            .eq("student_login_id", parsed.data.studentLoginId)
            .single();

        setIsChecking(false);

        if (error || !data) {
            setErrorMessage(
                "등록된 학생 정보를 찾을 수 없습니다. Supabase students 테이블에 테스트 학생이 있는지 확인해 주세요."
            );
            return;
        }

        const studentData = data as unknown as StudentWithProfile;

        if (studentData.profiles?.status !== "approved") {
            setErrorMessage("아직 승인되지 않았거나 사용할 수 없는 학생 계정입니다.");
            return;
        }

        localStorage.setItem(
            "mathlab_student",
            JSON.stringify({
                studentId: studentData.id,
                profileId: studentData.profile_id,
                loginId: studentData.student_login_id,
                name: studentData.profiles?.name ?? "",
                schoolYear: studentData.school_year,
                studentCode: studentData.student_code,
                grade: studentData.grade,
                classNumber: studentData.class_number,
                studentNumber: studentData.student_number,
            })
        );

        setStudent(studentData);
        router.push("/student/home");
    }

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
            <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
                <p className="text-sm font-semibold text-cyan-300">학생 로그인</p>

                <h1 className="mt-3 text-3xl font-bold">학생 ID로 로그인하기</h1>

                <p className="mt-4 leading-7 text-slate-300">
                    학생 로그인 ID를 입력하면 등록된 학생 정보를 확인합니다. 예를 들어{" "}
                    <span className="font-semibold text-cyan-200">202620202</span>는
                    2026학년도 2학년 2반 2번 학생을 의미합니다.
                </p>

                <form onSubmit={handleCheckStudent} className="mt-8 space-y-5">
                    <div>
                        <label
                            htmlFor="student-login-id"
                            className="block text-sm font-semibold text-slate-200"
                        >
                            학생 로그인 ID
                        </label>

                        <input
                            id="student-login-id"
                            value={loginId}
                            onChange={(event) => {
                                setLoginId(event.target.value);
                                setErrorMessage("");
                                setStudent(null);
                                setParsedStudent(null);
                            }}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                            placeholder="예: 202620202 또는 20202"
                        />

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            5자리 학번만 입력하면 현재는 2026학년도로 해석합니다.
                        </p>
                    </div>

                    {parsedStudent ? (
                        <div className="rounded-xl border border-cyan-300/30 bg-cyan-950/30 p-4 text-sm text-cyan-100">
                            <p className="font-semibold">입력한 ID 해석 결과</p>
                            <p className="mt-2">
                                {parsedStudent.schoolYear
                                    ? `${parsedStudent.schoolYear}학년도 / `
                                    : ""}
                                {formatStudentLabel(parsedStudent)}
                            </p>
                            <p className="mt-1 text-cyan-200">
                                조회할 로그인 ID: {parsedStudent.studentLoginId}
                            </p>
                        </div>
                    ) : null}

                    {errorMessage ? (
                        <div className="rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
                            {errorMessage}
                        </div>
                    ) : null}

                    {student ? (
                        <div className="rounded-xl border border-green-400/30 bg-green-950/40 p-4 text-sm text-green-100">
                            <p className="font-semibold">학생 정보를 찾았습니다.</p>
                            <p className="mt-2">이름: {student.profiles?.name ?? "-"}</p>
                            <p className="mt-1">
                                학번: {student.grade}학년 {student.class_number}반{" "}
                                {student.student_number}번
                            </p>
                            <p className="mt-1">로그인 ID: {student.student_login_id}</p>
                            <p className="mt-1">계정 상태: {student.profiles?.status}</p>
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isChecking}
                        className="w-full rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isChecking ? "학생 정보 확인 중..." : "학생 정보 확인하기"}
                    </button>
                </form>

                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        href="/"
                        className="rounded-full border border-white/20 px-5 py-3 font-semibold transition hover:bg-white/10"
                    >
                        홈으로 돌아가기
                    </Link>

                    <Link
                        href="/join"
                        className="rounded-full border border-cyan-300/40 px-5 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
                    >
                        입장 코드로 참여하기
                    </Link>
                </div>
            </section>
        </main>
    );
}