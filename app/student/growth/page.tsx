"use client";

// 학생 본인 성장 그래프 — activity_visits + activity_responses 기반 시각화.
// - 최근 12주 주간 활동 수(SVG 막대) + 이번 주/지난 주/누적 KPI
// - 누적 활동/성찰 곡선(꺾은선)
// 인라인 style 없이 SVG 속성으로 동적 width/x/y 표현.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { startOfThisWeekMonday, toIsoDate } from "@/lib/dashboard/progressDates";

type VisitRow = { visited_at: string };
type ResponseRow = { created_at: string };

function isoDate(d: Date): string {
  return toIsoDate(d);
}

function startOfWeekMon(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addWeeks(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n * 7);
  return x;
}

const WEEKS = 12;

export default function StudentGrowthPage() {
  const theme = getRoleTheme("student");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
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

  useEffect(() => {
    if (!authChecked || !studentId) return;
    let active = true;
    (async () => {
      const [vRes, rRes] = await Promise.all([
        supabase
          .from("activity_visits")
          .select("visited_at")
          .order("visited_at", { ascending: true })
          .limit(5000),
        supabase
          .from("activity_responses")
          .select("created_at")
          .eq("student_id", studentId)
          .order("created_at", { ascending: true })
          .limit(5000),
      ]);
      if (!active) return;
      if (vRes.error) setError(vRes.error.message);
      if (rRes.error) setError(rRes.error.message);
      setVisits((vRes.data ?? []) as VisitRow[]);
      setResponses((rRes.data ?? []) as ResponseRow[]);
    })();
    return () => {
      active = false;
    };
  }, [authChecked, studentId]);

  // 주별 집계 (최근 WEEKS 주)
  const weekly = useMemo(() => {
    const now = new Date();
    const thisMon = startOfWeekMon(now);
    // 가장 최근 주가 마지막. 0..WEEKS-1 거꾸로.
    const weeks: { label: string; start: Date; end: Date }[] = [];
    for (let i = WEEKS - 1; i >= 0; i--) {
      const start = addWeeks(thisMon, -i);
      const end = addWeeks(start, 1);
      weeks.push({
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        start,
        end,
      });
    }
    const visitCounts = new Array(WEEKS).fill(0) as number[];
    for (const v of visits) {
      const t = new Date(v.visited_at).getTime();
      for (let i = 0; i < WEEKS; i++) {
        if (t >= weeks[i].start.getTime() && t < weeks[i].end.getTime()) {
          visitCounts[i] += 1;
          break;
        }
      }
    }
    const maxCount = visitCounts.reduce((m, x) => (x > m ? x : m), 0);
    return { weeks, visitCounts, maxCount };
  }, [visits]);

  // KPI
  const stats = useMemo(() => {
    const weekStart = startOfThisWeekMonday().getTime();
    const lastWeekStart = addWeeks(startOfThisWeekMonday(), -1).getTime();
    let thisWeek = 0;
    let lastWeek = 0;
    for (const v of visits) {
      const t = new Date(v.visited_at).getTime();
      if (t >= weekStart) thisWeek += 1;
      else if (t >= lastWeekStart) lastWeek += 1;
    }
    return {
      total: visits.length,
      reflections: responses.length,
      thisWeek,
      lastWeek,
      delta: thisWeek - lastWeek,
    };
  }, [visits, responses]);

  // 누적 곡선 — 일자별 누적 활동 + 누적 성찰
  const cumulative = useMemo(() => {
    // 최근 90일
    const now = new Date();
    const days = 90;
    const start = new Date(now);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    const visitPerDay = new Map<string, number>();
    const respPerDay = new Map<string, number>();
    for (const v of visits) {
      const iso = isoDate(new Date(v.visited_at));
      visitPerDay.set(iso, (visitPerDay.get(iso) ?? 0) + 1);
    }
    for (const r of responses) {
      const iso = isoDate(new Date(r.created_at));
      respPerDay.set(iso, (respPerDay.get(iso) ?? 0) + 1);
    }
    const points: { iso: string; visits: number; resp: number }[] = [];
    let cumV = 0;
    let cumR = 0;
    // 시작 시점 이전 누적은 0 부터.
    // (정확하지 않지만 곡선 모양만 보여줘도 충분.)
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const iso = isoDate(d);
      cumV += visitPerDay.get(iso) ?? 0;
      cumR += respPerDay.get(iso) ?? 0;
      points.push({ iso, visits: cumV, resp: cumR });
    }
    const maxV = points.reduce((m, p) => (p.visits > m ? p.visits : m), 0);
    return { points, maxV };
  }, [visits, responses]);

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
        학생 계정으로 로그인이 필요합니다.
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>내 성장</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">활동 성장 그래프</h1>
        <p className="mt-1 text-sm text-slate-400">
          최근 12주 주간 활동·90일 누적 곡선·이번 주 비교를 한눈에 봅니다.
        </p>
      </div>

      {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}

      {/* KPI */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-slate-400">누적 활동</p>
          <p className={`mt-2 text-2xl font-bold sm:text-3xl ${theme.accentText}`}>
            {stats.total}회
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-slate-400">누적 성찰</p>
          <p className="mt-2 text-2xl font-bold text-amber-200 sm:text-3xl">
            {stats.reflections}개
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-slate-400">이번 주</p>
          <p className={`mt-2 text-2xl font-bold sm:text-3xl ${theme.accentText}`}>
            {stats.thisWeek}회
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-slate-400">지난 주 대비</p>
          <p
            className={`mt-2 text-2xl font-bold sm:text-3xl ${
              stats.delta > 0
                ? "text-emerald-200"
                : stats.delta < 0
                ? "text-rose-200"
                : "text-slate-300"
            }`}
          >
            {stats.delta > 0 ? "+" : ""}
            {stats.delta}회
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            (지난 주 {stats.lastWeek}회)
          </p>
        </div>
      </div>

      {/* 주간 막대 그래프 — 막대만 SVG, 카운트/날짜 라벨은 HTML 로 분리(가로 늘어남 영향 X). */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <p className="text-xs font-semibold text-slate-400">
          최근 12주 주간 활동 수
        </p>
        <div className="mt-4 overflow-x-auto">
          {/* WEEKS=12 고정 → Tailwind grid-cols-12 로 인라인 style 회피. */}
          <div
            className="grid min-w-[600px] grid-cols-12 gap-3"
            aria-label="주간 활동 수"
          >
            {weekly.weeks.map((w, i) => {
              const count = weekly.visitCounts[i];
              const h =
                weekly.maxCount > 0
                  ? Math.round((count / weekly.maxCount) * 100)
                  : 0;
              const isThisWeek = i === WEEKS - 1;
              return (
                <div key={w.label} className="flex flex-col items-center">
                  <span
                    className={`mb-1 h-4 text-xs font-semibold ${
                      isThisWeek ? "text-emerald-200" : "text-slate-300"
                    }`}
                  >
                    {count > 0 ? count : ""}
                  </span>
                  {/* 막대 영역 — SVG 의 viewBox 0~100 좌표계에서 y/height 만 동적. */}
                  <svg
                    viewBox="0 0 10 100"
                    preserveAspectRatio="none"
                    className="h-32 w-full"
                    aria-hidden
                  >
                    <line
                      x1={0}
                      y1={100}
                      x2={10}
                      y2={100}
                      className="stroke-white/10"
                      strokeWidth={0.5}
                    />
                    {h > 0 ? (
                      <rect
                        x={1}
                        y={100 - h}
                        width={8}
                        height={h}
                        rx={1}
                        className={
                          isThisWeek
                            ? "fill-emerald-300"
                            : "fill-emerald-300/50"
                        }
                      />
                    ) : null}
                  </svg>
                  <span
                    className={`mt-1 text-[11px] ${
                      isThisWeek
                        ? "font-semibold text-emerald-200"
                        : "text-slate-400"
                    }`}
                  >
                    {w.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          가장 오른쪽 막대(짙은 색)가 이번 주.
        </p>
      </section>

      {/* 누적 곡선 (90일) */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <p className="text-xs font-semibold text-slate-400">
          최근 90일 누적 곡선
        </p>
        <div className="mt-4 overflow-x-auto">
          <svg
            viewBox={`0 0 ${cumulative.points.length} 100`}
            preserveAspectRatio="none"
            className="h-40 w-full min-w-[600px]"
            aria-label="누적 활동·성찰 곡선"
          >
            {/* visits 곡선 */}
            <polyline
              fill="none"
              strokeWidth={1.2}
              className="stroke-emerald-300"
              points={cumulative.points
                .map((p, i) => {
                  const y =
                    cumulative.maxV > 0
                      ? 95 - (p.visits / cumulative.maxV) * 90
                      : 95;
                  return `${i},${y}`;
                })
                .join(" ")}
            />
            {/* responses 곡선 */}
            <polyline
              fill="none"
              strokeWidth={1.2}
              className="stroke-amber-300"
              points={cumulative.points
                .map((p, i) => {
                  const y =
                    cumulative.maxV > 0
                      ? 95 - (p.resp / cumulative.maxV) * 90
                      : 95;
                  return `${i},${y}`;
                })
                .join(" ")}
            />
            {/* x축 */}
            <line
              x1={0}
              y1={95}
              x2={cumulative.points.length}
              y2={95}
              className="stroke-white/10"
            />
          </svg>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-200">
            <span className="inline-block h-1.5 w-3 bg-emerald-300" /> 활동
          </span>
          <span className="flex items-center gap-1 text-amber-200">
            <span className="inline-block h-1.5 w-3 bg-amber-300" /> 성찰
          </span>
          <span className="text-slate-500">
            최대 {cumulative.maxV}회 기준 정규화
          </span>
        </div>
      </section>
    </>
  );
}
