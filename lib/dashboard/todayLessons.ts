// "오늘의 수업" 데이터 헬퍼.
// progress_tracker (한 칸 = teacher,date,grade,class,subject) 에서 오늘 날짜 행을 가져온다.
// 음영은 daily_class_overrides/weekly_schedule 합성 결과로 결정되지만, 여기서는
// 교사가 실제로 내용을 적어둔 행(progress_tracker)만 노출한다 — 동선 자체는 "오늘 적어둔 수업".

import type { SupabaseClient } from "@supabase/supabase-js";
import { toIsoDate } from "./progressDates";

export type TodayLesson = {
  id: string;
  date: string;
  grade: number;
  class_number: number;
  subject: string;
  lesson_topic: string;
  notes: string;
  activity_slug: string | null;
};

export function todayIsoLocal(now: Date = new Date()): string {
  return toIsoDate(now);
}

/** 교사 자신이 오늘 적어둔 진도 행들. 관리자는 teacherId=null 로 전체. */
export async function fetchTeacherTodayLessons(
  supabase: SupabaseClient,
  opts: { teacherId: string | null; dateIso?: string }
): Promise<TodayLesson[]> {
  const date = opts.dateIso ?? todayIsoLocal();
  let q = supabase
    .from("progress_tracker")
    .select("id, date, grade, class_number, subject, lesson_topic, notes, activity_slug")
    .eq("date", date);
  if (opts.teacherId) q = q.eq("teacher_id", opts.teacherId);
  const { data, error } = await q
    .order("grade", { ascending: true })
    .order("class_number", { ascending: true })
    .order("subject", { ascending: true });
  if (error) return [];
  return (data ?? []) as TodayLesson[];
}

/** 학생 학급(grade+class_number)이 오늘 받는 수업들. RLS가 학생=자기학급 SELECT 허용. */
export async function fetchStudentTodayLessons(
  supabase: SupabaseClient,
  opts: { grade: number; classNumber: number; dateIso?: string }
): Promise<TodayLesson[]> {
  const date = opts.dateIso ?? todayIsoLocal();
  const { data, error } = await supabase
    .from("progress_tracker")
    .select("id, date, grade, class_number, subject, lesson_topic, notes, activity_slug")
    .eq("date", date)
    .eq("grade", opts.grade)
    .eq("class_number", opts.classNumber)
    .order("subject", { ascending: true });
  if (error) return [];
  return (data ?? []) as TodayLesson[];
}

/** "오늘은 X월 Y일 (요일)" 텍스트 한국어 포맷. */
export function formatTodayLabel(now: Date = new Date()): string {
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  return `${now.getMonth() + 1}월 ${now.getDate()}일 (${dayLabels[now.getDay()]})`;
}
