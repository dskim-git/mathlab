// 미니활동 "도전 모드" 점수 · 랭킹 — 20260527_activity_scores.sql 의 기존 RPC 를 감싼 공용 헬퍼.
//
// 테이블(activity_scores)에 직접 INSERT 하는 경로는 없다. 두 개의 SECURITY DEFINER RPC 만 쓴다:
//   submit_activity_score(slug, subject, difficulty, score, meta)
//     → 학생 신원(학생 행·이름·학급)을 서버가 auth.uid() 로 채운다. 이름·학급 위조 불가.
//     → 학생 계정이 아니면 'not a student' 예외.
//   activity_leaderboard(slug, limit)
//     → 학생별 최고점 Top N 투영(전체 공개). is_me 로 내 행을 알려 준다.
//
// 새 활동에서 랭킹이 필요하면 이 헬퍼를 쓰고 마이그레이션은 추가하지 않는다.

import { supabase } from "@/lib/supabase/client";

export type LeaderRow = {
  rank: number;
  displayName: string;
  grade: number | null;
  classNumber: number | null;
  bestScore: number;
  bestDifficulty: string | null;
  isMe: boolean;
};

export type SubmitScoreResult =
  | { ok: true }
  | { ok: false; error: string; notStudent: boolean };

/** 한 번의 도전 결과를 랭킹에 제출한다. 학생 계정이 아니면 notStudent=true 로 돌아온다. */
export async function submitActivityScore(opts: {
  activitySlug: string;
  subject: string | null;
  /** 활동별 의미의 난이도·모드 문자열(예: "speed60") */
  difficulty?: string | null;
  score: number;
  meta?: Record<string, unknown>;
}): Promise<SubmitScoreResult> {
  const { error } = await supabase.rpc("submit_activity_score", {
    p_activity_slug: opts.activitySlug,
    p_subject: opts.subject,
    p_difficulty: opts.difficulty ?? null,
    p_score: opts.score,
    p_meta: opts.meta ?? {},
  });
  if (error) {
    return {
      ok: false,
      error: error.message,
      notStudent: /not a student/i.test(error.message),
    };
  }
  return { ok: true };
}

export type LeaderboardResult =
  | { ok: true; rows: LeaderRow[] }
  | { ok: false; error: string };

/** 학생별 최고점 Top N 순위표. */
export async function fetchLeaderboard(opts: {
  activitySlug: string;
  limit?: number;
}): Promise<LeaderboardResult> {
  const { data, error } = await supabase.rpc("activity_leaderboard", {
    p_activity_slug: opts.activitySlug,
    p_limit: opts.limit ?? 20,
  });
  if (error) return { ok: false, error: error.message };

  const raw = (data ?? []) as {
    rank: number | string;
    display_name: string;
    grade: number | null;
    class_number: number | null;
    best_score: number;
    best_difficulty: string | null;
    is_me: boolean;
  }[];

  return {
    ok: true,
    rows: raw.map((r) => ({
      rank: Number(r.rank),
      displayName: r.display_name,
      grade: r.grade,
      classNumber: r.class_number,
      bestScore: r.best_score,
      bestDifficulty: r.best_difficulty,
      isMe: r.is_me,
    })),
  };
}
