"use client";

// 접속 통계 — login_logs(profile_id, log_date) 기반.
// KPI 4 (오늘/이번주/이번달/올해 distinct 접속자) + 최근 14일 일별 표.
// 학교 1개 규모(~수십 학생)면 login_logs 행 수가 작아 클라이언트에서 일괄 집계해도 충분.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type LogRow = {
  profile_id: string;
  log_date: string; // 'YYYY-MM-DD' (KST 기준)
};

function todayKst(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

/** KST 기준 N일 전 'YYYY-MM-DD' */
function daysAgoKst(n: number): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() - n);
  return kst.toISOString().slice(0, 10);
}

function monthStartKst(): string {
  const t = todayKst();
  return t.slice(0, 8) + "01";
}

function yearStartKst(): string {
  const t = todayKst();
  return t.slice(0, 5) + "01-01";
}

function weekStartIsoDateKst(): string {
  // KST 월요일 00:00 의 date 부분
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = kst.getUTCDay(); // 0=일,1=월..6=토 (KST 기준)
  const diff = (day + 6) % 7; // 월=0
  kst.setUTCDate(kst.getUTCDate() - diff);
  return kst.toISOString().slice(0, 10);
}

export function AccessStats({ accentText }: { accentText: string }) {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    // 올해 시작부터의 행만 가져오면 부담 줄음.
    const { data, error: e } = await supabase
      .from("login_logs")
      .select("profile_id, log_date")
      .gte("log_date", yearStartKst())
      .order("log_date", { ascending: false })
      .limit(20000);
    if (e) {
      setError(e.message);
    }
    setRows((data ?? []) as LogRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const today = todayKst();
    const weekStart = weekStartIsoDateKst();
    const monthStart = monthStartKst();
    const yearStart = yearStartKst();
    const todaySet = new Set<string>();
    const weekSet = new Set<string>();
    const monthSet = new Set<string>();
    const yearSet = new Set<string>();
    // 일별 카운트 (최근 14일)
    const recent14 = new Set<string>();
    for (let i = 0; i < 14; i++) recent14.add(daysAgoKst(i));
    const dailyCount = new Map<string, Set<string>>();

    for (const r of rows) {
      if (r.log_date >= yearStart) yearSet.add(r.profile_id);
      if (r.log_date >= monthStart) monthSet.add(r.profile_id);
      if (r.log_date >= weekStart) weekSet.add(r.profile_id);
      if (r.log_date === today) todaySet.add(r.profile_id);
      if (recent14.has(r.log_date)) {
        const s = dailyCount.get(r.log_date) ?? new Set<string>();
        s.add(r.profile_id);
        dailyCount.set(r.log_date, s);
      }
    }

    const dailyList: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = daysAgoKst(i);
      dailyList.push({ date: d, count: dailyCount.get(d)?.size ?? 0 });
    }
    const maxDaily = dailyList.reduce((m, x) => (x.count > m ? x.count : m), 0);

    return {
      today: todaySet.size,
      week: weekSet.size,
      month: monthSet.size,
      year: yearSet.size,
      daily: dailyList,
      maxDaily,
    };
  }, [rows]);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm font-semibold ${accentText}`}>접속 통계</p>
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

      <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-slate-400">오늘</p>
          <p className={`mt-2 text-2xl font-bold sm:text-3xl ${accentText}`}>
            {stats.today}명
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-slate-400">이번 주</p>
          <p className="mt-2 text-2xl font-bold text-cyan-200 sm:text-3xl">
            {stats.week}명
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-slate-400">이번 달</p>
          <p className="mt-2 text-2xl font-bold text-amber-200 sm:text-3xl">
            {stats.month}명
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-slate-400">올해</p>
          <p className="mt-2 text-2xl font-bold text-emerald-200 sm:text-3xl">
            {stats.year}명
          </p>
        </div>
      </div>

      {/* 최근 14일 일별 표 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5">
        <p className="text-xs font-semibold text-slate-400">
          최근 14일 일별 접속자 (KST)
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="border-b border-white/10 px-3 py-2 text-left text-xs font-semibold text-slate-300"
                >
                  일자
                </th>
                <th
                  scope="col"
                  className="w-24 border-b border-white/10 px-3 py-2 text-right text-xs font-semibold text-slate-300"
                >
                  접속자
                </th>
                <th
                  scope="col"
                  className="border-b border-white/10 px-3 py-2 text-left text-xs font-semibold text-slate-300"
                >
                  비율
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.daily.map((d) => {
                const widthPct =
                  stats.maxDaily > 0
                    ? Math.round((d.count / stats.maxDaily) * 100)
                    : 0;
                return (
                  <tr key={d.date} className="border-b border-white/5">
                    <td className="px-3 py-2 text-slate-200">{d.date}</td>
                    <td className="px-3 py-2 text-right font-semibold text-cyan-200">
                      {d.count}명
                    </td>
                    <td className="px-3 py-2">
                      {/* SVG 막대 — 동적 width 는 SVG 속성으로 표현(인라인 style 회피). */}
                      <svg
                        viewBox="0 0 100 8"
                        preserveAspectRatio="none"
                        className="h-2 w-full"
                        aria-hidden
                      >
                        <rect
                          x={0}
                          y={0}
                          width={100}
                          height={8}
                          rx={4}
                          ry={4}
                          className="fill-white/10"
                        />
                        <rect
                          x={0}
                          y={0}
                          width={widthPct}
                          height={8}
                          rx={4}
                          ry={4}
                          className="fill-cyan-400/60"
                        />
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          행은 KST 기준 일자, 같은 사용자가 하루 여러 번 들어와도 1명으로 셉니다.
        </p>
      </div>
    </section>
  );
}
