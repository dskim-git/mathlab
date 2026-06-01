"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { NoticeBoard } from "@/components/notices/NoticeBoard";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { startOfThisWeekMonday } from "@/lib/dashboard/progressDates";
import { shortActivityTitle } from "@/lib/activities/activityTitles";

type RecentVisitRow = {
  id: number;
  activity_slug: string;
  subject: string | null;
  visited_at: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function GeneralHomePage() {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");

  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [weeklyCount, setWeeklyCount] = useState<number | null>(null);
  const [lastUnit, setLastUnit] = useState<
    { subject: string; unit_key: string; unit_title: string } | null
  >(null);
  const [recent, setRecent] = useState<RecentVisitRow[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      const p = profile as { name: string; role: string } | null;
      setName(p?.name ?? "");
      setRole(p?.role ?? "");

      // 접근 가능 교과 — 일반: general_subject_permissions / 관리자(읽기): 전체.
      const isAdmin = p?.role === "admin";
      let subjList: string[] = [];
      if (isAdmin) {
        const { data: all } = await supabase
          .from("subjects")
          .select("name, order_index")
          .order("order_index");
        subjList = ((all ?? []) as Array<{ name: string }>).map((s) => s.name);
      } else {
        const { data: perms } = await supabase
          .from("general_subject_permissions")
          .select("subject");
        const allowed = Array.from(
          new Set(
            ((perms ?? []) as Array<{ subject: string }>).map((r) => r.subject)
          )
        );
        if (allowed.length > 0) {
          const { data: ordered } = await supabase
            .from("subjects")
            .select("name, order_index")
            .in("name", allowed)
            .order("order_index");
          subjList = ((ordered ?? []) as Array<{ name: string }>).map(
            (s) => s.name
          );
        }
      }
      if (!active) return;
      setSubjects(subjList);

      const weekStartIso = startOfThisWeekMonday().toISOString();
      const [totalRes, weeklyRes, recentRes, progRes] = await Promise.all([
        supabase
          .from("activity_visits")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("activity_visits")
          .select("id", { count: "exact", head: true })
          .gte("visited_at", weekStartIso),
        supabase
          .from("activity_visits")
          .select("id, activity_slug, subject, visited_at")
          .order("visited_at", { ascending: false })
          .limit(3),
        supabase
          .from("learning_progress")
          .select("subject, unit_key, unit_title")
          .eq("profile_id", user.id)
          .order("last_seen_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (!active) return;
      setTotalCount(totalRes.count ?? 0);
      setWeeklyCount(weeklyRes.count ?? 0);
      setRecent((recentRes.data ?? []) as RecentVisitRow[]);
      setLastUnit(
        (progRes.data as {
          subject: string;
          unit_key: string;
          unit_title: string;
        } | null) ?? null
      );
    })();
    return () => {
      active = false;
    };
  }, []);

  const theme = getRoleTheme("general");
  const isAdminViewing = role === "admin";

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>일반인 홈</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {name ? `${name} 님, 안녕하세요 👋` : "안녕하세요 👋"}
        </h1>
        {isAdminViewing ? (
          <p className="mt-1 text-sm text-amber-300">
            관리자 계정으로 일반인 화면을 보고 있습니다 (읽기 전용).
          </p>
        ) : null}
      </div>

      <NoticeBoard accentText={theme.accentText} />

      {/* Hero — 내 교과 큰 칩 그리드 (학생·교사 대시보드와 통일) */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-amber-300/10 via-white/5 to-transparent p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className={`text-xs font-semibold ${theme.accentText}`}>
              내 교과
            </p>
            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
              교과를 선택해 학습을 시작하세요
            </h2>
          </div>
          <Link
            href="/learn"
            className="text-xs font-semibold text-slate-400 transition hover:text-white"
          >
            전체 교과 학습 →
          </Link>
        </div>
        {subjects.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            접근 가능한 교과가 없습니다. 관리자에게 교과 접근을 요청해 주세요.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {subjects.map((s) => (
              <Link
                key={s}
                href={`/learn?subject=${encodeURIComponent(s)}`}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 transition hover:-translate-y-0.5 hover:border-amber-300/50 hover:bg-slate-950"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/15 text-xl">
                  📘
                </span>
                <span className="text-sm font-semibold text-white group-hover:text-amber-100">
                  {s}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* KPI — 4개 */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="내 접근 교과"
          value={`${subjects.length}개`}
          valueClassName={theme.accentText}
          href="/learn"
        />
        <KpiCard
          label="누적 활동"
          value={totalCount == null ? "···" : `${totalCount}회`}
          valueClassName={theme.accentText}
          hint="교과 학습 →"
          href="/learn"
        />
        <KpiCard
          label="이번 주 활동"
          value={weeklyCount == null ? "···" : `${weeklyCount}회`}
          valueClassName={
            (weeklyCount ?? 0) > 0 ? theme.accentText : "text-slate-400"
          }
          hint="교과 학습 →"
          href="/learn"
        />
        <KpiCard
          label="이어보기"
          value={
            lastUnit ? (
              <span className="block break-keep text-lg leading-snug sm:text-xl">
                {lastUnit.unit_title}
              </span>
            ) : (
              "—"
            )
          }
          hint={lastUnit ? `${lastUnit.subject} →` : "교과 학습에서 시작 →"}
          valueClassName={lastUnit ? theme.accentText : "text-slate-400"}
          href={
            lastUnit
              ? `/learn?subject=${encodeURIComponent(
                  lastUnit.subject
                )}&unit=${encodeURIComponent(lastUnit.unit_key)}`
              : "/learn"
          }
        />
      </div>

      {/* 기능 카드 — 5컬럼 그리드(다른 역할과 통일), 우측 빈 공간 후속용 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard
          icon="💡"
          title="건의 보내기"
          description="오류·요청 보내기"
          href="/general/feedback"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="👤"
          title="내 정보"
          description="비밀번호 변경 등"
          href="/general/profile"
          hoverBorderClass={theme.hoverBorder}
        />
      </div>

      {/* 최근 활동 미리보기 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold">최근 활동</h2>
          <Link
            href="/learn"
            className={`text-xs font-semibold transition ${theme.accentText} hover:opacity-80`}
          >
            교과 학습 →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            아직 학습 이력이 없습니다.{" "}
            <Link href="/learn" className={theme.accentText}>
              교과 학습
            </Link>{" "}
            에서 시작해 보세요.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-sm"
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
                  {formatDateTime(row.visited_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
