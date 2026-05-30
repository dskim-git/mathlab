"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { NoticeBoard } from "@/components/notices/NoticeBoard";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

type SubjectRow = { subject: string };

export default function GeneralHomePage() {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");

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

      // RLS가 본인 행만 돌려준다(general_subject_permissions).
      const { data } = await supabase
        .from("general_subject_permissions")
        .select("subject");

      if (!active) return;
      const rows = (data ?? []) as SubjectRow[];
      setSubjects(Array.from(new Set(rows.map((r) => r.subject))));
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

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="내 접근 교과"
          value={`${subjects.length}개`}
          valueClassName={theme.accentText}
          href="/learn"
        />
        <KpiCard
          label="이어보기"
          value="-"
          hint="교과 학습 →"
          valueClassName="text-slate-400"
          href="/learn"
        />
        <KpiCard
          label="누적 활동"
          value="-"
          hint="이후 집계"
          valueClassName="text-slate-400"
        />
        <KpiCard
          label="별표 성찰"
          value="-"
          hint="이후 집계"
          valueClassName="text-slate-400"
        />
      </div>

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs font-semibold text-slate-400">
          내가 접근할 수 있는 교과
        </p>
        {subjects.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">
            아직 부여된 교과가 없습니다. 관리자에게 문의해 주세요.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {subjects.map((s) => (
              <li
                key={s}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${theme.accentBg} ${theme.accentText}`}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        <DashboardCard
          icon="📚"
          title="교과 학습"
          description="내 교과 단원 보기"
          href="/learn"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="💡"
          title="건의 보내기"
          description="오류 제보·요청 (준비 중)"
          hoverBorderClass={theme.hoverBorder}
        />
        <DashboardCard
          icon="👤"
          title="내 정보"
          description="비밀번호 변경 등 (준비 중)"
          hoverBorderClass={theme.hoverBorder}
        />
      </div>
    </>
  );
}
