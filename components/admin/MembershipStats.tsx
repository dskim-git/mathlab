"use client";

// 회원 구성 + 누적 활동 + 학생 유지율 KPI 모음.
// 관리자 페이지의 첫 줄 — 운영 규모를 한 눈에. RLS=admin all 이라 그대로 select.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { startOfThisWeekMonday } from "@/lib/dashboard/progressDates";

type RoleRow = { role: string };
type StudentIdRow = { student_id: string };
type ProfileIdRow = { profile_id: string };

type RoleCounts = {
  admin: number;
  teacher: number;
  student: number;
  general: number;
};

export function MembershipStats({ accentText }: { accentText: string }) {
  const [roleCounts, setRoleCounts] = useState<RoleCounts | null>(null);
  const [totalResponses, setTotalResponses] = useState<number | null>(null);
  const [totalVisits, setTotalVisits] = useState<number | null>(null);
  const [distinctActiveStudents, setDistinctActiveStudents] = useState<
    number | null
  >(null);
  const [weeklyActiveStudents, setWeeklyActiveStudents] = useState<
    number | null
  >(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const weekStartIso = startOfThisWeekMonday().toISOString();
    const [
      profilesRes,
      respCountRes,
      visitsCountRes,
      respStudentsRes,
      weeklyVisitsRes,
    ] = await Promise.all([
      // 역할별 인원 — 작은 규모라 전체 row 들고 와 클라이언트 집계.
      supabase.from("profiles").select("role"),
      // 누적 활동 응답
      supabase
        .from("activity_responses")
        .select("id", { count: "exact", head: true }),
      // 누적 방문
      supabase
        .from("activity_visits")
        .select("id", { count: "exact", head: true }),
      // 활동을 한 번이라도 해 본 학생 수 — distinct student_id
      supabase.from("activity_responses").select("student_id"),
      // 이번 주 방문한 사용자(학생 포함) — distinct profile_id, 학생만 추리려면 join 필요.
      // 단순화: profile_id 만 받아오고 학생 profile id 와 교집합.
      supabase
        .from("activity_visits")
        .select("profile_id")
        .gte("visited_at", weekStartIso),
    ]);
    const errs = [
      profilesRes.error,
      respCountRes.error,
      visitsCountRes.error,
      respStudentsRes.error,
      weeklyVisitsRes.error,
    ].filter(Boolean);
    if (errs.length > 0) setError(errs.map((e) => e!.message).join(" / "));

    const rc: RoleCounts = { admin: 0, teacher: 0, student: 0, general: 0 };
    for (const r of (profilesRes.data ?? []) as RoleRow[]) {
      if (r.role in rc) rc[r.role as keyof RoleCounts] += 1;
    }
    setRoleCounts(rc);
    setTotalResponses(respCountRes.count ?? 0);
    setTotalVisits(visitsCountRes.count ?? 0);
    const respStudentSet = new Set<string>();
    for (const r of (respStudentsRes.data ?? []) as StudentIdRow[]) {
      if (r.student_id) respStudentSet.add(r.student_id);
    }
    setDistinctActiveStudents(respStudentSet.size);

    // 이번 주 활동 학생 = 이번 주 방문 사용자 중 role=student. profiles 결과로 학생 id set.
    const studentProfileIds = new Set<string>();
    // profiles row 에서 role=student 만 추리고 싶지만 위 쿼리는 role 만 가져옴.
    // 별도 students 조회 없이도 weekly 카운트 가능 — visits 의 profile 이 student 인지
    // 확인하려면 students 테이블이 더 정확(profile_id 보유). 이미 단순 select 이라 추가 호출.
    const studRes = await supabase.from("students").select("profile_id");
    if (studRes.data) {
      for (const r of studRes.data as ProfileIdRow[]) {
        studentProfileIds.add(r.profile_id);
      }
    }
    const weeklySet = new Set<string>();
    for (const r of (weeklyVisitsRes.data ?? []) as ProfileIdRow[]) {
      if (studentProfileIds.has(r.profile_id)) weeklySet.add(r.profile_id);
    }
    setWeeklyActiveStudents(weeklySet.size);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const retentionPct = useMemo(() => {
    if (!roleCounts || weeklyActiveStudents == null) return null;
    if (roleCounts.student === 0) return 0;
    return Math.round((weeklyActiveStudents / roleCounts.student) * 100);
  }, [roleCounts, weeklyActiveStudents]);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm font-semibold ${accentText}`}>운영 규모</p>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-60"
        >
          {loading ? "불러오는 중..." : "새로고침"}
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-xs text-rose-200">불러오기 오류: {error}</p>
      ) : null}

      {/* 회원 구성 KPI 4 */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiBox
          label="관리자"
          value={roleCounts?.admin}
          valueClass="text-violet-200"
        />
        <KpiBox
          label="교사"
          value={roleCounts?.teacher}
          valueClass="text-cyan-200"
        />
        <KpiBox
          label="학생"
          value={roleCounts?.student}
          valueClass="text-emerald-200"
        />
        <KpiBox
          label="일반인"
          value={roleCounts?.general}
          valueClass="text-amber-200"
        />
      </div>

      {/* 누적 활동 KPI 3 + 유지율 1 = 4 */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiBox
          label="누적 응답"
          value={totalResponses}
          suffix="건"
          valueClass={accentText}
        />
        <KpiBox
          label="누적 방문"
          value={totalVisits}
          suffix="회"
          valueClass={accentText}
        />
        <KpiBox
          label="활동 참여 학생"
          value={distinctActiveStudents}
          suffix="명"
          valueClass="text-emerald-200"
          hint={
            roleCounts?.student
              ? `${distinctActiveStudents ?? 0} / ${roleCounts.student}`
              : undefined
          }
        />
        <KpiBox
          label="이번 주 활동률"
          value={retentionPct}
          suffix="%"
          valueClass={
            (retentionPct ?? 0) >= 50 ? "text-emerald-200" : "text-amber-200"
          }
          hint={
            roleCounts?.student
              ? `${weeklyActiveStudents ?? 0} / ${roleCounts.student} 학생`
              : undefined
          }
        />
      </div>
    </section>
  );
}

function KpiBox({
  label,
  value,
  suffix,
  hint,
  valueClass,
}: {
  label: string;
  value: number | null | undefined;
  suffix?: string;
  hint?: string;
  valueClass: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold sm:text-3xl ${valueClass}`}>
        {value == null ? "···" : `${value.toLocaleString("ko-KR")}${suffix ?? ""}`}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
