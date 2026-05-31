// 학생이 /learn 등에서 미니활동을 마치고 성찰을 제출할 때 activity_responses 에 새 행을 만든다.
// - 학생 신원: 현재 Auth 세션의 user → students 행 조회(profile_id=auth.uid). 학생이 아니면 silent skip.
// - 매 제출마다 새 행(시간순 기록 보존). 같은 활동을 여러 번 풀어도 각각 별도 응답.
// - 세션(join_code) 없이 단독 제출 — session_id=null, teacher_id=null.
// - activity_id 는 activities 행이 없는 이식 미니활동도 많아 NULLABLE(20260531_responses_loosen_activity_fk).
//   activity_slug 만 식별 키로 쓴다.

import { supabase } from "@/lib/supabase/client";
import type {
  ReflectionAnswers,
  ReflectionQuestion,
} from "./reflection";

export type SubmitReflectionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * 저장 형식: reflection_data 의 각 entry 가 { prompt, answer } 객체.
 * 이전 형식({id: string})은 옛 5건 기록에서만 보임 — 렌더러가 fallback 으로 처리.
 * prompt 까지 저장해 두는 이유: 학생/교사 기록 화면에서 영어 id 가 아니라
 * 한국어 질문 문구를 라벨로 보여주기 위함.
 */
export async function submitActivityReflection(opts: {
  activitySlug: string;
  subject: string | null;
  answers: ReflectionAnswers;
  /** ReflectionForm 이 렌더 시점에 갖고 있던 질문 배열 (id, prompt 등). */
  questions: ReflectionQuestion[];
  /** 활동별 자유 데이터(점수·진행도 등). 없으면 빈 객체로 저장. */
  responseData?: Record<string, unknown>;
}): Promise<SubmitReflectionResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  const { data: studentRow } = await supabase
    .from("students")
    .select("id, school_year, grade, class_number, student_number")
    .eq("profile_id", user.id)
    .maybeSingle();
  const student = studentRow as
    | {
        id: string;
        school_year: number;
        grade: number;
        class_number: number;
        student_number: number;
      }
    | null;
  if (!student) {
    // 학생이 아닌 사용자(관리자가 학생화면 미리보기 등)는 저장하지 않는다.
    return { ok: false, error: "학생 계정에서만 저장됩니다." };
  }

  // reflection_data 를 { id: { prompt, answer } } 형식으로 정규화.
  const reflectionData: Record<string, { prompt: string; answer: string }> = {};
  for (const q of opts.questions) {
    reflectionData[q.id] = {
      prompt: q.prompt,
      answer: opts.answers[q.id] ?? "",
    };
  }

  const insertPayload = {
    activity_id: null,
    student_id: student.id,
    session_id: null,
    teacher_id: null,
    school_year: student.school_year,
    grade: student.grade,
    class_number: student.class_number,
    student_number: student.student_number,
    subject: opts.subject,
    activity_slug: opts.activitySlug,
    response_data: opts.responseData ?? {},
    reflection_data: reflectionData,
  };

  const { data, error } = await supabase
    .from("activity_responses")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, id: (data as { id: string }).id };
}
