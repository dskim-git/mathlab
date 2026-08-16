import { supabase } from "@/lib/supabase/client";

// app_settings.current_semester 를 읽어 현재 학기(1|2)를 돌려준다.
// 기록 조회·AI 세특의 기본 학기 선택값으로 쓴다.
// 값이 없거나 이상하면 월 규칙으로 떨어진다 — 3~8월 1학기, 9~2월 2학기
// (20260816_academic_term_scope.sql 의 백필/트리거와 같은 규칙).

export type Semester = 1 | 2;

export const SEMESTER_LABEL: Record<Semester, string> = {
  1: "1학기",
  2: "2학기",
};

export function semesterFromMonth(month: number): Semester {
  return month >= 3 && month <= 8 ? 1 : 2;
}

export async function getCurrentSemester(): Promise<Semester> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "current_semester")
    .maybeSingle();

  if (!error && data) {
    const n = Number((data as { value: string }).value);
    if (n === 1 || n === 2) return n;
  }
  return semesterFromMonth(new Date().getMonth() + 1);
}
