"use client";

// 학생 홈에 마운트되는 게이미피케이션 박스.
// - 스트릭(연속 학습 일수) / 이번 주 목표 진도 바 / 배지 그리드.
// - 별도 DB 테이블 없이 activity_visits + activity_responses 의 일자·카운트로 산출.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toIsoDate } from "@/lib/dashboard/progressDates";
import {
  BADGES,
  DEFAULT_WEEKLY_GOAL,
  computeBadgeProgress,
  computeStreak,
  computeWeeklyVisits,
} from "@/lib/gamification";

type Props = {
  studentId: string;
  /** 학생 홈에서 이미 가져온 누적 응답 수(중복 호출 회피). 없으면 0 fallback. */
  reflectionCount?: number | null;
};

export function GamificationCard({ studentId, reflectionCount }: Props) {
  const [visitDates, setVisitDates] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  // user_settings.weekly_goal — NULL/없으면 DEFAULT_WEEKLY_GOAL.
  const [customGoal, setCustomGoal] = useState<number | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState<string>("");
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalError, setGoalError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      const [visitsRes, settingsRes] = await Promise.all([
        supabase
          .from("activity_visits")
          .select("visited_at")
          .order("visited_at", { ascending: false })
          .limit(2000),
        user
          ? supabase
              .from("user_settings")
              .select("weekly_goal")
              .eq("profile_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null } as {
              data: { weekly_goal: number | null } | null;
              error: null;
            }),
      ]);
      if (!active) return;
      if (visitsRes.error) {
        setError(visitsRes.error.message);
        setVisitDates([]);
        return;
      }
      const dates = ((visitsRes.data ?? []) as Array<{ visited_at: string }>).map(
        (r) => toIsoDate(new Date(r.visited_at))
      );
      setVisitDates(dates);
      const s = settingsRes.data as { weekly_goal: number | null } | null;
      setCustomGoal(s?.weekly_goal ?? null);
    })();
    return () => {
      active = false;
    };
  }, [studentId]);

  async function saveGoal() {
    const n = Number(goalDraft);
    if (!Number.isInteger(n) || n < 1 || n > 30) {
      setGoalError("1~30 사이 정수를 입력해 주세요.");
      return;
    }
    setGoalSaving(true);
    setGoalError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setGoalError("로그인이 필요합니다.");
      setGoalSaving(false);
      return;
    }
    const { error: e } = await supabase
      .from("user_settings")
      .upsert(
        { profile_id: user.id, weekly_goal: n },
        { onConflict: "profile_id" }
      );
    setGoalSaving(false);
    if (e) {
      setGoalError(e.message);
      return;
    }
    setCustomGoal(n);
    setEditingGoal(false);
  }

  async function resetGoal() {
    setGoalSaving(true);
    setGoalError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setGoalSaving(false);
      return;
    }
    const { error: e } = await supabase
      .from("user_settings")
      .upsert(
        { profile_id: user.id, weekly_goal: null },
        { onConflict: "profile_id" }
      );
    setGoalSaving(false);
    if (e) {
      setGoalError(e.message);
      return;
    }
    setCustomGoal(null);
    setEditingGoal(false);
  }

  if (visitDates == null) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-xs font-semibold text-slate-400">학습 동기</p>
        <p className="mt-2 text-sm text-slate-400">불러오는 중...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-xs font-semibold text-slate-400">학습 동기</p>
        <p className="mt-2 text-sm text-rose-300">{error}</p>
      </section>
    );
  }

  const uniqueDates = Array.from(new Set(visitDates));
  const streak = computeStreak(uniqueDates);
  const weekly = computeWeeklyVisits(visitDates);
  const totalVisits = visitDates.length;
  const totalReflections = reflectionCount ?? 0;

  const goal = customGoal ?? DEFAULT_WEEKLY_GOAL;
  const progressPct = Math.min(100, Math.round((weekly / goal) * 100));
  const goalDone = weekly >= goal;

  const badges = computeBadgeProgress({
    visits: totalVisits,
    reflections: totalReflections,
    streak,
  });
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-300/10 via-white/5 to-transparent p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-emerald-300">학습 동기</p>
          <h2 className="mt-1 text-base font-bold text-white sm:text-lg">
            오늘도 한 걸음 더!
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          획득 배지 {earnedCount} / {BADGES.length}
        </span>
      </div>

      {/* 스트릭 + 이번 주 목표 */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
          <p className="text-xs text-slate-400">연속 학습</p>
          <p className="mt-1 text-2xl font-bold text-amber-200">
            🔥 {streak}일
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {streak === 0
              ? "오늘 활동을 시작하면 1일 카운트!"
              : "내일도 이어가 보세요"}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-400">이번 주 목표</p>
              {!editingGoal ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingGoal(true);
                    setGoalDraft(String(goal));
                    setGoalError("");
                  }}
                  aria-label="목표 수정"
                  className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400 transition hover:bg-white/10"
                >
                  ✏️
                </button>
              ) : null}
            </div>
            <p className="text-xs text-slate-300">
              <span className="font-bold text-emerald-200">{weekly}</span>{" "}
              / {goal}회
              {goalDone ? <span className="ml-1">🎉</span> : null}
            </p>
          </div>
          {/* SVG 막대 — 동적 width 인라인 style 회피. */}
          <svg
            viewBox="0 0 100 8"
            preserveAspectRatio="none"
            className="mt-2 h-2 w-full"
            aria-hidden
          >
            <rect x={0} y={0} width={100} height={8} rx={4} className="fill-white/10" />
            <rect
              x={0}
              y={0}
              width={progressPct}
              height={8}
              rx={4}
              className={goalDone ? "fill-emerald-300" : "fill-emerald-300/70"}
            />
          </svg>
          {editingGoal ? (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  aria-label="주간 목표 (1~30)"
                  className="w-20 rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-300/40"
                />
                <span className="text-xs text-slate-400">회 / 주</span>
                <button
                  type="button"
                  onClick={saveGoal}
                  disabled={goalSaving}
                  className="rounded-full bg-emerald-300 px-3 py-1 text-[11px] font-bold text-slate-950 hover:bg-emerald-200 disabled:opacity-60"
                >
                  {goalSaving ? "저장 중..." : "저장"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingGoal(false);
                    setGoalError("");
                  }}
                  disabled={goalSaving}
                  className="rounded px-2 py-1 text-[11px] text-slate-400 hover:text-white disabled:opacity-60"
                >
                  취소
                </button>
                {customGoal != null ? (
                  <button
                    type="button"
                    onClick={resetGoal}
                    disabled={goalSaving}
                    className="ml-auto rounded px-2 py-1 text-[11px] text-slate-500 hover:text-slate-300 disabled:opacity-60"
                  >
                    기본값({DEFAULT_WEEKLY_GOAL})으로
                  </button>
                ) : null}
              </div>
              {goalError ? (
                <p className="text-[11px] text-rose-300">{goalError}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-0.5 text-[11px] text-slate-500">
              {goalDone
                ? "이번 주 목표 달성!"
                : `목표까지 ${Math.max(goal - weekly, 0)}회 남음`}
            </p>
          )}
        </div>
      </div>

      {/* 배지 그리드 */}
      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-400">배지</p>
        <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
          {badges.map((b) => {
            const ratio = Math.min(
              100,
              Math.round((b.current / b.def.threshold) * 100)
            );
            return (
              <li
                key={b.def.key}
                title={`${b.def.label} — ${b.def.description}${
                  b.earned
                    ? " (획득)"
                    : ` (${b.current} / ${b.def.threshold})`
                }`}
                className={`rounded-xl border p-2 text-center transition ${
                  b.earned
                    ? "border-amber-300/40 bg-amber-300/10"
                    : "border-white/10 bg-slate-950/40 opacity-70"
                }`}
              >
                <p className="text-xl" aria-hidden>
                  {b.def.emoji}
                </p>
                <p
                  className={`mt-1 text-[10px] font-semibold ${
                    b.earned ? "text-amber-200" : "text-slate-400"
                  }`}
                >
                  {b.def.label}
                </p>
                <p className="mt-0.5 text-[9px] text-slate-500">
                  {b.earned
                    ? "획득 ✓"
                    : `${b.current}/${b.def.threshold} (${ratio}%)`}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
