"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { shortActivityTitle } from "@/lib/activities/activityTitles";
import { startOfThisWeekMonday, toIsoDate } from "@/lib/dashboard/progressDates";

type VisitRow = {
  id: number;
  activity_slug: string;
  subject: string | null;
  visited_at: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatHmm(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatDateLabel(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${
    ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
  })`;
}

type Group = {
  key: "today" | "yesterday" | "thisWeek" | "earlier";
  label: string;
  rows: VisitRow[];
};

export default function StudentActivityPage() {
  const theme = getRoleTheme("student");
  const [authChecked, setAuthChecked] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setAuthChecked(true);
        return;
      }
      const { data: s } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (!active) return;
      setStudentId((s as { id: string } | null)?.id ?? null);
      setAuthChecked(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const loadVisits = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error: e } = await supabase
      .from("activity_visits")
      .select("id, activity_slug, subject, visited_at")
      .eq("profile_id", user.id)
      .order("visited_at", { ascending: false })
      .limit(200);
    if (e) {
      setError(e.message);
      return;
    }
    setVisits((data ?? []) as VisitRow[]);
  }, []);

  useEffect(() => {
    if (!authChecked || !studentId) return;
    loadVisits();
  }, [authChecked, studentId, loadVisits]);

  // KPI: 오늘 / 이번 주 / 누적
  const stats = useMemo(() => {
    const now = new Date();
    const todayIso = toIsoDate(now);
    const weekStart = startOfThisWeekMonday(now).getTime();
    let today = 0;
    let week = 0;
    for (const v of visits) {
      const t = new Date(v.visited_at);
      if (toIsoDate(t) === todayIso) today += 1;
      if (t.getTime() >= weekStart) week += 1;
    }
    return { today, week, total: visits.length };
  }, [visits]);

  // 그룹별 분류: 오늘 / 어제 / 이번 주 / 그 이전
  const groups = useMemo<Group[]>(() => {
    const now = new Date();
    const todayIso = toIsoDate(now);
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const yestIso = toIsoDate(yest);
    const weekStart = startOfThisWeekMonday(now).getTime();

    const today: VisitRow[] = [];
    const yesterday: VisitRow[] = [];
    const thisWeek: VisitRow[] = [];
    const earlier: VisitRow[] = [];
    for (const v of visits) {
      const t = new Date(v.visited_at);
      const iso = toIsoDate(t);
      if (iso === todayIso) today.push(v);
      else if (iso === yestIso) yesterday.push(v);
      else if (t.getTime() >= weekStart) thisWeek.push(v);
      else earlier.push(v);
    }
    const out: Group[] = [];
    if (today.length) out.push({ key: "today", label: "오늘", rows: today });
    if (yesterday.length) out.push({ key: "yesterday", label: "어제", rows: yesterday });
    if (thisWeek.length)
      out.push({ key: "thisWeek", label: "이번 주(앞쪽)", rows: thisWeek });
    if (earlier.length)
      out.push({ key: "earlier", label: "그 이전", rows: earlier });
    return out;
  }, [visits]);

  if (!authChecked) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
        확인 중...
      </div>
    );
  }
  if (!studentId) {
    return (
      <div className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-6 text-sm text-amber-200">
        본인 학생 정보가 없습니다. 학생 계정으로 로그인해 주세요.
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>내 활동</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          학습 이력 ({stats.total}회)
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          /learn 에서 미니활동에 진입한 기록입니다. 성찰·결과는{" "}
          <Link
            href="/student/reflections"
            className={`font-semibold ${theme.accentText} hover:opacity-80`}
          >
            내 성찰
          </Link>{" "}
          에서 확인해 보세요.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-slate-400">오늘</p>
          <p className={`mt-2 text-2xl font-bold sm:text-3xl ${theme.accentText}`}>
            {stats.today}회
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-slate-400">이번 주</p>
          <p className="mt-2 text-2xl font-bold text-amber-200 sm:text-3xl">
            {stats.week}회
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-slate-400">누적(최근 200)</p>
          <p className="mt-2 text-2xl font-bold text-slate-200 sm:text-3xl">
            {stats.total}회
          </p>
        </div>
      </div>

      {error ? (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      ) : null}

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-400">
          아직 학습 이력이 없습니다.{" "}
          <Link href="/learn" className={theme.accentText}>
            교과 학습
          </Link>{" "}
          에서 활동을 시작해 보세요.
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.key}>
              <p className="text-xs font-semibold text-slate-400">{g.label}</p>
              <ul className="mt-2 space-y-2">
                {g.rows.map((row) => {
                  const t = new Date(row.visited_at);
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white">
                          {shortActivityTitle(row.activity_slug)}
                        </span>
                        {row.subject ? (
                          <span className={`text-xs ${theme.accentText}`}>
                            {row.subject}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-xs text-slate-400">
                        {g.key === "today" || g.key === "yesterday"
                          ? formatHmm(t)
                          : `${formatDateLabel(t)} ${formatHmm(t)}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
