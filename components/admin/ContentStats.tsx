"use client";

// 콘텐츠 통계 — activity_visits 기반.
//   - 활동 인기 Top 10 가로 막대 (가장 많이 방문된 활동)
//   - 교과별 이용 도넛 (subject 별 분포)
//   - 시간대(0-23시 KST) 활동 분포 막대 (수업/자율 패턴)
// activity_responses 가 아니라 visits 를 쓰는 이유: 학생이 활동을 "열어 본" 횟수까지 잡혀
// 인기·시간대 분석에 더 풍부한 신호. responses 는 더 무거운 "성찰 제출" 지표.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/lib/supabase/client";
import { shortActivityTitle } from "@/lib/activities/activityTitles";

type VisitRow = {
  activity_slug: string;
  subject: string | null;
  visited_at: string;
};

const SUBJECT_COLORS = [
  "#67e8f9", // cyan
  "#6ee7b7", // emerald
  "#fcd34d", // amber
  "#c4b5fd", // violet
  "#f9a8d4", // pink
  "#fdba74", // orange
  "#a5b4fc", // indigo
  "#86efac", // green
  "#fca5a5", // red
];

/** ISO 시각 → KST 0~23 시 정수 */
function hourKst(iso: string): number {
  const t = new Date(iso).getTime();
  const kst = new Date(t + 9 * 60 * 60 * 1000);
  return kst.getUTCHours();
}

export function ContentStats({ accentText }: { accentText: string }) {
  const [rows, setRows] = useState<VisitRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    // 최근 9000건까지 — 학교 1개 규모면 1학기 누적도 이 안에 들어옴.
    const { data, error: e } = await supabase
      .from("activity_visits")
      .select("activity_slug, subject, visited_at")
      .order("visited_at", { ascending: false })
      .limit(9000);
    if (e) setError(e.message);
    setRows((data ?? []) as VisitRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const top10 = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      m.set(r.activity_slug, (m.get(r.activity_slug) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([slug, count]) => ({
        slug,
        title: shortActivityTitle(slug),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [rows]);

  const bySubject = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const key = r.subject ?? "(미분류)";
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  const byHour = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    for (const r of rows) {
      const h = hourKst(r.visited_at);
      arr[h].count += 1;
    }
    return arr;
  }, [rows]);

  const totalVisits = rows.length;
  // 차트 막대 색을 한 톤으로 — 인기 Top10 은 cyan 그라디언트 대신 단색 + bar size 로 강조.

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm font-semibold ${accentText}`}>콘텐츠 통계</p>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-60"
        >
          {loading ? "..." : "새로고침"}
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-xs text-rose-200">불러오기 오류: {error}</p>
      ) : null}

      {totalVisits === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-slate-400">
          아직 활동 방문 기록이 없습니다. 학생이 활동을 시작하면 인기·교과·시간대
          분석이 여기에 표시됩니다.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 활동 인기 Top 10 가로 막대 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5 lg:col-span-2">
            <p className="text-xs font-semibold text-slate-400">
              활동 인기 Top 10 (방문 횟수 기준)
            </p>
            <div className="mt-3 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={top10}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="title"
                    width={160}
                    tick={{ fill: "#cbd5e1", fontSize: 11 }}
                    tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                    formatter={(value) => [`${Number(value)}회`, "방문"]}
                  />
                  <Bar dataKey="count" fill="#67e8f9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 교과별 이용 도넛 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5">
            <p className="text-xs font-semibold text-slate-400">교과별 이용 비중</p>
            <div className="mt-3 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bySubject}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {bySubject.map((entry, idx) => (
                      <Cell
                        key={entry.name}
                        fill={SUBJECT_COLORS[idx % SUBJECT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value, name) => [`${Number(value)}회`, String(name)]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 시간대 0-23 막대 */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5">
            <p className="text-xs font-semibold text-slate-400">
              시간대(시각) 활동 분포 — KST
            </p>
            <div className="mt-3 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byHour}
                  margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickFormatter={(h: number) => `${h}시`}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelFormatter={(h) => `${h}시`}
                    formatter={(value) => [`${Number(value)}회`, "활동"]}
                  />
                  <Bar dataKey="count" fill="#fcd34d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
