"use client";

// 교사 측 마감 관리 — 학급(+선택 시 과목) 안에서 활동별로 마감/해제.
// 학생 측은 activity_responses.locked_at IS NULL 일 때만 본인 응답 수정 가능(RLS 정책).
// 여기서 마감 = 그 학급·과목·활동 슬러그 매칭 응답들의 locked_at = now() UPDATE.
// 해제 = locked_at = NULL.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { shortActivityTitle } from "@/lib/activities/activityTitles";

export type LockGroup = {
  activity_slug: string;
  subject: string | null;
  total: number;
  lockedCount: number;
};

type Props = {
  /** 현재 필터된 학급 */
  grade: number;
  classNumber: number;
  /** 활동별 그룹 — server 페이지에서 records 를 (subject,activity_slug)별 distinct + 카운트로 집계해 전달. */
  groups: LockGroup[];
};

function statusLabel(g: LockGroup): string {
  if (g.total === 0) return "응답 없음";
  if (g.lockedCount === 0) return `미마감 (${g.total}명)`;
  if (g.lockedCount === g.total) return `🔒 마감 (${g.total}명)`;
  return `일부 마감 (${g.lockedCount}/${g.total})`;
}

export default function LockManager({ grade, classNumber, groups }: Props) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggleLock(g: LockGroup, action: "lock" | "unlock") {
    const key = `${g.subject}::${g.activity_slug}::${action}`;
    setBusyKey(key);
    setError("");
    const payload =
      action === "lock"
        ? { locked_at: new Date().toISOString() }
        : { locked_at: null };
    let q = supabase
      .from("activity_responses")
      .update(payload)
      .eq("grade", grade)
      .eq("class_number", classNumber)
      .eq("activity_slug", g.activity_slug);
    // RLS 가 교사 권한(teacher_has_class_subject) 으로 제한하지만, 의도된 과목만 일괄 처리하기
    // 위해 subject 도 명시. subject IS NULL 인 옛 행은 따로 처리 필요(현재는 무시).
    if (g.subject) q = q.eq("subject", g.subject);
    else q = q.is("subject", null);
    const { error: e } = await q;
    setBusyKey(null);
    if (e) {
      setError(e.message);
      return;
    }
    router.refresh();
  }

  // 학급 전체 일괄 마감/해제 — 이 화면에 보이는 (RLS 로 자기 담당 과목만) 모든 활동 응답.
  async function toggleAllLock(action: "lock" | "unlock") {
    const key = `__all__::${action}`;
    if (
      !confirm(
        action === "lock"
          ? `이 학급의 ${groups.length}개 활동 응답을 모두 마감할까요?\n학생들이 더 이상 자기 응답을 수정할 수 없게 됩니다.`
          : `이 학급의 ${groups.length}개 활동의 마감을 모두 해제할까요?\n학생들이 다시 자기 응답을 수정할 수 있게 됩니다.`
      )
    ) {
      return;
    }
    setBusyKey(key);
    setError("");
    const payload =
      action === "lock"
        ? { locked_at: new Date().toISOString() }
        : { locked_at: null };
    // 학급 단위 일괄. RLS 가 자기 담당 과목 외 행은 거부하므로 안전.
    // 마감(lock): 미마감 행만 갱신해도 무방하나, 단순화 위해 전체 UPDATE.
    // 해제(unlock): locked_at IS NOT NULL 조건을 걸면 영향 0인 행을 안 건드림.
    let q = supabase
      .from("activity_responses")
      .update(payload)
      .eq("grade", grade)
      .eq("class_number", classNumber);
    if (action === "unlock") q = q.not("locked_at", "is", null);
    const { error: e } = await q;
    setBusyKey(null);
    if (e) {
      setError(e.message);
      return;
    }
    router.refresh();
  }

  if (groups.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        이 학급에 아직 응답이 없어 마감할 활동이 없습니다.
      </p>
    );
  }

  // 전체 상태 — 모든 그룹이 lockedCount === total 이면 "전부 마감"
  const totalResponses = groups.reduce((s, g) => s + g.total, 0);
  const totalLocked = groups.reduce((s, g) => s + g.lockedCount, 0);
  const allLockedGlobally = totalResponses > 0 && totalLocked === totalResponses;
  const someLocked = totalLocked > 0;

  return (
    <div>
      {error ? (
        <p className="mb-2 text-xs text-rose-300">오류: {error}</p>
      ) : null}
      {/* 전체 일괄 마감/해제 */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300/20 bg-amber-300/5 p-2.5 text-sm">
        <span className="text-xs font-semibold text-amber-200">
          학급 전체:{" "}
          <span className="text-amber-100">
            {allLockedGlobally
              ? `🔒 전부 마감 (${totalLocked}건)`
              : someLocked
              ? `일부 마감 (${totalLocked}/${totalResponses})`
              : `미마감 (${totalResponses}건)`}
          </span>
        </span>
        <div className="flex items-center gap-2">
          {!allLockedGlobally ? (
            <button
              type="button"
              onClick={() => toggleAllLock("lock")}
              disabled={busyKey === "__all__::lock"}
              className="rounded-full border border-amber-300/50 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200 transition hover:bg-amber-300/20 disabled:opacity-60"
            >
              {busyKey === "__all__::lock" ? "처리 중..." : "전체 마감"}
            </button>
          ) : null}
          {someLocked ? (
            <button
              type="button"
              onClick={() => toggleAllLock("unlock")}
              disabled={busyKey === "__all__::unlock"}
              className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-60"
            >
              {busyKey === "__all__::unlock" ? "처리 중..." : "전체 마감 해제"}
            </button>
          ) : null}
        </div>
      </div>
      <ul className="space-y-2">
        {groups.map((g) => {
          const lockKey = `${g.subject}::${g.activity_slug}::lock`;
          const unlockKey = `${g.subject}::${g.activity_slug}::unlock`;
          const allLocked = g.total > 0 && g.lockedCount === g.total;
          return (
            <li
              key={`${g.subject}-${g.activity_slug}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">
                  {shortActivityTitle(g.activity_slug)}
                </span>
                {g.subject ? (
                  <span className="text-xs text-cyan-300">{g.subject}</span>
                ) : null}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    allLocked
                      ? "bg-amber-300/15 text-amber-200"
                      : g.lockedCount > 0
                      ? "bg-amber-300/10 text-amber-300/80"
                      : "bg-emerald-300/10 text-emerald-200"
                  }`}
                >
                  {statusLabel(g)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!allLocked ? (
                  <button
                    type="button"
                    onClick={() => toggleLock(g, "lock")}
                    disabled={busyKey === lockKey}
                    className="rounded-full border border-amber-300/40 px-3 py-1 text-xs font-semibold text-amber-200 transition hover:bg-amber-300/10 disabled:opacity-60"
                  >
                    {busyKey === lockKey ? "처리 중..." : "마감"}
                  </button>
                ) : null}
                {g.lockedCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggleLock(g, "unlock")}
                    disabled={busyKey === unlockKey}
                    className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-60"
                  >
                    {busyKey === unlockKey ? "처리 중..." : "마감 해제"}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
