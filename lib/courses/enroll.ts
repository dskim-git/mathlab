// 수업 편성(course_students) 공용 타입·헬퍼.
//
// 편성의 정체성은 "학번(student_code)" 이다. 아직 회원가입 안 한 학생도 미리 넣어두면
// 가입 시 DB 트리거(20260816_course_enrollment_by_roster.sql)가 계정을 이어붙인다.
// 그래서 관리자 화면은 가입 계정이 아니라 명렬표(student_roster)를 기준으로 학생을 고른다.

import { supabase } from "@/lib/supabase/client";

/** 편성 한 줄. student_id 가 null 이면 "미가입 대기" 상태. */
export type EnrollRow = {
  id: string; // course_students.id
  student_id: string | null;
  student_code: string;
  school_year: number;
  grade: number | null;
  class_number: number | null;
  student_number: number | null;
  name: string;
};

/** 명렬표 또는 가입 계정에서 온 편성 후보. */
export type CandidateStudent = {
  student_code: string;
  name: string;
  grade: number;
  class_number: number;
  student_number: number;
};

/**
 * 한 학급의 학생을 명렬표에서 가져온다 — 아직 가입 안 한 학생 포함.
 * 해당 학년도 명렬표가 아직 없으면 이미 가입한 students 로 대체한다.
 */
export async function fetchClassStudentCodes(
  schoolYear: number,
  grade: number,
  classNumber: number
): Promise<CandidateStudent[]> {
  const { data: roster } = await supabase
    .from("student_roster")
    .select("student_code, name, grade, class_number, student_number")
    .eq("school_year", schoolYear)
    .eq("grade", grade)
    .eq("class_number", classNumber)
    .order("student_number");

  const rosterRows = (roster ?? []) as CandidateStudent[];
  if (rosterRows.length > 0) return rosterRows;

  const { data: registered } = await supabase
    .from("students")
    .select(
      "student_code, grade, class_number, student_number, profiles!profile_id(name)"
    )
    .eq("school_year", schoolYear)
    .eq("grade", grade)
    .eq("class_number", classNumber)
    .order("student_number");

  return ((registered ?? []) as unknown as {
    student_code: string;
    grade: number;
    class_number: number;
    student_number: number;
    profiles: { name: string | null } | null;
  }[]).map((r) => ({
    student_code: r.student_code,
    name: r.profiles?.name ?? "",
    grade: r.grade,
    class_number: r.class_number,
    student_number: r.student_number,
  }));
}
