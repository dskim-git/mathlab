"use client";

// 접속 통계 — login_logs(profile_id, log_date) + profiles.role 조인 기반.
// KPI 4 (오늘/이번주/이번달/올해 distinct 접속자) + 최근 14일 역할별 다선 차트(LineChart).
// 학교 1개 규모(~수십 학생)면 행 수가 작아 클라이언트에서 일괄 집계해도 충분.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LogRow = {
  profile_id: string;
  log_date: string; // 'YYYY-MM-DD' (KST 기준)
};

type ProfileRoleRow = { id: string; role: string };

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
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = kst.getUTCDay(); // 0=일,1=월..6=토 (KST 기준)
  const diff = (day + 6) % 7; // 월=0
  kst.setUTCDate(kst.getUTCDate() - diff);
  return kst.toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' → 'MM/DD' (차트 X축 라벨 콤팩트) */
function shortDate(iso: string): string {
  return `${iso.slice(5, 7)}/${iso.slice(8, 10)}`;
}

export function AccessStats({ accentText }: { accentText: string }) {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [roleMap, setRoleMap] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [logsRes, profRes] = await Promise.all([
      // 올해 시작부터의 행만 가져오면 부담 줄음.
      supabase
        .from("login_logs")
        .select("profile_id, log_date")
        .gte("log_date", yearStartKst())
        .order("log_date", { ascending: false })
        .limit(20000),
      supabase.from("profiles").select("id, role"),
    ]);
    if (logsRes.error) setError(logsRes.error.message);
    if (profRes.error) setError((e) => e || profRes.error!.message);
    setRows((logsRes.data ?? []) as LogRow[]);
    const map = new Map<string, string>();
    for (const p of (profRes.data ?? []) as ProfileRoleRow[]) {
      map.set(p.id, p.role);
    }
    setRoleMap(map);
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
    // 14일치 역할별 distinct profile_id set
    const recent14 = new Set<string>();
    for (let i = 0; i < 14; i++) recent14.add(daysAgoKst(i));
    // dailyByRole.get(date) → { student: Set, teacher: Set, general: Set }
    type DayBuckets = {
      student: Set<string>;
      teacher: Set<string>;
      general: Set<string>;
    };
    const dailyByRole = new Map<string, DayBuckets>();

    for (const r of rows) {
      if (r.log_date >= yearStart) yearSet.add(r.profile_id);
      if (r.log_date >= monthStart) monthSet.add(r.profile_id);
      if (r.log_date >= weekStart) weekSet.add(r.profile_id);
      if (r.log_date === today) todaySet.add(r.profile_id);
      if (recent14.has(r.log_date)) {
        const role = roleMap.get(r.profile_id) ?? "general";
        let b = dailyByRole.get(r.log_date);
        if (!b) {
          b = { student: new Set(), teacher: new Set(), general: new Set() };
          dailyByRole.set(r.log_date, b);
        }
        // 관리자는 운영자 자신 — 차트에서 generals 합산(노이즈 회피)
        if (role === "student") b.student.add(r.profile_id);
        else if (role === "teacher") b.teacher.add(r.profile_id);
        else b.general.add(r.profile_id);
      }
    }

    const chartData: {
      date: string;
      label: string;
      student: number;
      teacher: number;
      general: number;
      total: number;
    }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = daysAgoKst(i);
      const b = dailyByRole.get(d);
      const s = b?.student.size ?? 0;
      const t = b?.teacher.size ?? 0;
      const g = b?.general.size ?? 0;
      chartData.push({
        date: d,
        label: shortDate(d),
        student: s,
        teacher: t,
        general: g,
        total: s + t + g,
      });
    }

    return {
      today: todaySet.size,
      week: weekSet.size,
      month: monthSet.size,
      year: yearSet.size,
      chartData,
    };
  }, [rows, roleMap]);

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
        <KpiBox label="오늘" value={stats.today} valueClass={accentText} />
        <KpiBox label="이번 주" value={stats.week} valueClass="text-cyan-200" />
        <KpiBox
          label="이번 달"
          value={stats.month}
          valueClass="text-amber-200"
        />
        <KpiBox
          label="올해"
          value={stats.year}
          valueClass="text-emerald-200"
        />
      </div>

      {/* 최근 14일 역할별 다선 차트 */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5">
        <p className="text-xs font-semibold text-slate-400">
          최근 14일 일별 접속자 — 역할별 (KST)
        </p>
        <div className="mt-3 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={stats.chartData}
              margin={{ top: 8, right: 12, left: -16, bottom: 4 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
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
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="student"
                name="학생"
                stroke="#6ee7b7"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="teacher"
                name="교사"
                stroke="#67e8f9"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="general"
                name="일반인·관리자"
                stroke="#fcd34d"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          같은 사용자가 하루 여러 번 들어와도 1명으로 셉니다. 관리자는 일반인 선에
          합산.
        </p>
      </div>
    </section>
  );
}

function KpiBox({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold sm:text-3xl ${valueClass}`}>
        {value}명
      </p>
    </div>
  );
}
